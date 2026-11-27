// The flyover after a hole: the camera follows one player's ball through
// its strokes on the hole, from the tee to the cup - each stroke's flight,
// then its bounces and roll - pausing a moment where it lay before the
// next. Pure, so its timing and where the camera goes can be tested;
// course.js moves the camera, draws the tracers as it goes and keeps the
// camera out of the ground and the trees.
//
// A stroke is { points: [[x, y, z], ...], putt }: where the ball's centre
// went, in world terms (y up), from where it was struck to where it
// stopped.

// How long each part takes, in seconds. A shot 2.5 to 4 seconds by its
// length (a drive 4, a mid iron about 3.5, a chip 2.5), a putt 1 to 2.2:
// watchable, and a hole of five or six strokes over in about twenty.
export const PACE = {
  tee: 1.2, // a look down the hole from behind the tee first
  lie: 0.8, // at each lie before the next stroke
  end: 1.8, // at the cup (or where it finished) at the end
  shot: { min: 2.5, max: 4, base: 2, perMetre: 1 / 100 },
  putt: { min: 1, max: 2.2, base: 1, perMetre: 1 / 8 },
};

// Where the camera sits: behind the ball along the way the stroke goes,
// `back` metres back and `up` metres above it, looking `ahead` metres past
// it. Close and low on the green; well back and up for a full shot, so the
// whole flight's curve is in the picture.
export const VIEW = {
  shot: { back: 24, up: 7, ahead: 12 },
  putt: { back: 3.5, up: 1.4, ahead: 1 },
};

import { clamp } from "./mathutil.mjs";

// Cumulative distance along points.
export function lengths(points) {
  const cum = [0];
  for (let i = 1; i < points.length; i++) {
    const [a, b] = [points[i - 1], points[i]];
    cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
  }
  return cum;
}

// Seconds for a stroke of `length` metres.
export function strokeSeconds(length, putt = false, pace = PACE) {
  const p = putt ? pace.putt : pace.shot;
  return clamp(p.base + length * p.perMetre, p.min, p.max);
}

// The flyover's plan: a pause at the tee, then for each stroke its flight
// and roll followed by a pause where it stopped (the last one's longer: the
// end). Steps are { kind: "lie" | "stroke" | "end", stroke, from, to } in
// seconds from the start; `total` is when it's over. Strokes that didn't
// go anywhere (fewer than two points) are left out.
export function flyoverPlan(strokes, pace = PACE) {
  const steps = [];
  let t = 0;
  const add = (kind, stroke, seconds) => {
    steps.push({ kind, stroke, from: t, to: t + seconds });
    t += seconds;
  };
  // Each stroke with its distances worked out once.
  const list = strokes.filter((s) => s.points?.length > 1).map((s) => ({ ...s, cum: lengths(s.points) }));
  list.forEach((s, i) => {
    add("lie", i, i === 0 ? pace.tee : pace.lie);
    add("stroke", i, strokeSeconds(s.cum.at(-1), s.putt, pace));
  });
  if (list.length) add("end", list.length - 1, pace.end);
  return { strokes: list, steps, total: t };
}

// Eased in and out, so the camera sets off and arrives gently.
export const ease = (u) => {
  const x = clamp(u, 0, 1);
  return x * x * (3 - 2 * x);
};

// The point `along` (0 - 1) of the way along points by distance:
// { index, k } (k of the way from point index to the next) and `at`.
export function pointAlong(points, along, cum = lengths(points)) {
  const total = cum.at(-1);
  const d = clamp(along, 0, 1) * total;
  let i = 0;
  while (i < points.length - 2 && cum[i + 1] < d) i++;
  const span = cum[i + 1] - cum[i];
  const k = span > 0 ? clamp((d - cum[i]) / span, 0, 1) : 1;
  const [a, b] = [points[i], points[i + 1]];
  return { index: i, k, at: a.map((v, j) => v + (b[j] - v) * k) };
}

// The way a stroke goes, level: from where it was struck to where it
// stopped (a unit [x, z]), or `fallback` if it hardly moved.
export function strokeHeading(points, fallback = [0, -1]) {
  const [a, b] = [points[0], points.at(-1)];
  const dx = b[0] - a[0];
  const dz = b[2] - a[2];
  const len = Math.hypot(dx, dz);
  return len > 0.05 ? [dx / len, dz / len] : fallback;
}

// Where the camera wants to be to watch a ball at `at` going `heading`.
export function cameraFor(at, heading, putt = false, view = VIEW) {
  const v = putt ? view.putt : view.shot;
  const [hx, hz] = heading;
  return {
    cam: [at[0] - hx * v.back, at[1] + v.up, at[2] - hz * v.back],
    look: [at[0] + hx * v.ahead, at[1], at[2] + hz * v.ahead],
  };
}

// Everything about the flyover `t` seconds in:
//   stroke   which stroke is being watched (its index in plan.strokes)
//   kind     "lie", "stroke" or "end"
//   reveal   for that stroke: null (none of it yet), "all", or { index, k }
//            as far as the ball has got
//   ball     where the ball is
//   cam, look  where the camera wants to be and look
//   done     it's over
export function flyoverAt(plan, t) {
  const { steps, strokes } = plan;
  if (!steps.length) return { done: true };
  const step = steps.find((s) => t < s.to) ?? steps.at(-1);
  const s = strokes[step.stroke];
  const heading = strokeHeading(s.points, step.stroke > 0 ? strokeHeading(strokes[step.stroke - 1].points) : undefined);
  let ball;
  let reveal;
  if (step.kind === "lie") {
    ball = s.points[0];
    reveal = null;
  } else if (step.kind === "end") {
    ball = s.points.at(-1);
    reveal = "all";
  } else {
    const u = ease((t - step.from) / (step.to - step.from));
    const p = pointAlong(s.points, u, s.cum);
    ball = p.at;
    reveal = u >= 1 ? "all" : { index: p.index, k: p.k };
  }
  const { cam, look } = cameraFor(ball, heading, s.putt);
  return { stroke: step.stroke, kind: step.kind, reveal, ball, cam, look, done: t >= plan.total };
}

// Whether the flyover plays by itself once the hole-out celebration is
// over, rather than waiting to be asked for. It does unless the setting is
// off, or there's nothing worth watching: a hole picked up is ten strokes
// nobody wants to see again, and with no stroke that went anywhere (a
// gimme with nothing before it) there's nothing to follow. Nor after the
// last hole: the round's own ending comes next, and a flyover would only
// hold it up (the card is still there, and J still plays it).
//   on        the setting
//   how       how the hole was finished: "holed", "given" or "picked up"
//   strokes   the strokes it would follow, as flyoverPlan takes them
//   lastHole  whether this was the round's last hole
export function autoFlyover({ on = true, how, strokes = [], lastHole = false } = {}) {
  if (!on || lastHole || how === "picked up") return false;
  return flyoverPlan(strokes).total > 0;
}

// ---- Look down the hole first ----------------------------------------------------------
// A setting (Look down each hole, off to begin with): as a hole starts, a
// four-second crane from behind the tee, up over the landing area, to the
// green - showing what can't be seen from the tee (a pond hidden in a
// dip, a bunker short of the green) and the country round it - in place of
// the short wait while the hole's name is up. A shot, Esc or J cuts it
// short. course.js moves the camera, and keeps it clear of the ground and
// the trees as the flyover's is.

export const LOOK_DOWN = { seconds: 4, back: 28, up: 13, over: 55, short: 75, high: 30 };

// Whether to look down the hole as it starts: only with the setting on,
// never in the Challenges (which draw a hole of their own and have none),
// and not on a hole with nothing to look down (no line of play).
export function lookDownFirst({ on = false, challenge = null, path = null } = {}) {
  return !!on && !challenge && (path?.length ?? 0) > 1;
}

// The crane's plan, in world terms (y up): path the line of play's points
// [[x, z], ...] from the tee to the green, groundY(x, z) the ground's
// height, pin [x, y, z]. Three poses - behind the tee, over the landing
// area, short of the green - eased through as one smooth curve.
export function lookDownPlan(path, groundY, pin, look = LOOK_DOWN) {
  const cum = [0];
  for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  const total = cum.at(-1);
  const at = (s) => {
    const d = clamp(s, 0, total);
    let i = 1;
    while (i < path.length - 1 && cum[i] < d) i++;
    const [a, b] = [path[i - 1], path[i]];
    const span = cum[i] - cum[i - 1] || 1;
    const k = clamp((d - cum[i - 1]) / span, 0, 1);
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return { p: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], dir: [(b[0] - a[0]) / len, (b[1] - a[1]) / len] };
  };
  const lift = ([x, z], up) => [x, groundY(x, z) + up, z];
  const tee = at(0);
  const landing = at(Math.min(total * 0.5, 230));
  const short = at(Math.max(0, total - look.short));
  const cams = [
    lift([tee.p[0] - tee.dir[0] * look.back, tee.p[1] - tee.dir[1] * look.back], look.up),
    lift([landing.p[0] - landing.dir[0] * 40, landing.p[1] - landing.dir[1] * 40], look.over),
    lift(short.p, look.high),
  ];
  const looks = [lift(landing.p, 0), lift(at(total * 0.8).p, 0), pin];
  return { cams, looks, total: look.seconds };
}

const bezier = ([a, b, c], u) => a.map((v, i) => (1 - u) * (1 - u) * v + 2 * (1 - u) * u * b[i] + u * u * c[i]);

// Where the camera is and looks `t` seconds in: { cam, look, done }.
export function lookDownAt(plan, t) {
  const u = ease(t / plan.total);
  return { cam: bezier(plan.cams, u), look: bezier(plan.looks, u), done: t >= plan.total };
}

// ---- Before a round ------------------------------------------------------------------
// With no round going the course shows the first hole of the course N
// plays (course.js), the camera on the look down the hole's own crane -
// behind the tee, over the landing area, short of the green - but slowly,
// and back again, over and over: easing to a stop at each end rather than
// cutting, so nothing jumps while it's watched and the trees' far versions
// are chosen once (it never cuts).
export const IDLE_CRANE = { ...LOOK_DOWN, seconds: 36 };

// Where the camera is and looks `t` seconds in: { cam, look }. plan:
// lookDownPlan's, made with IDLE_CRANE.
export function idleCraneAt(plan, t) {
  const period = plan.total * 2;
  const u = (((t % period) + period) % period) || 0;
  const { cam, look } = lookDownAt(plan, u <= plan.total ? u : period - u);
  return { cam, look };
}

// The ring round the Replay button after a hole (the owner, 1 November
// 2026: "The replay button should have a bar around it that shrinks to 0
// when the button disappears"): how far its time has run when the card's
// shown at `now` (ms), the card fading at `endsAt` after `total` ms - the
// ring drawn from full to nothing over `total`, `elapsed` of it gone (a
// card shown again partway through, on the next hole, picks up where it
// was). null with no time set or none left.
export function replayRing(now, endsAt, total) {
  if (!Number.isFinite(now) || !Number.isFinite(endsAt) || !(total > 0)) return null;
  const left = endsAt - now;
  if (!(left > 0)) return null;
  return { total, elapsed: Math.round(clamp(total - left, 0, total)) };
}
