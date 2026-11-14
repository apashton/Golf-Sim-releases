// Guidance for a putt: how much it's uphill or downhill and what it plays
// like before it's struck; afterwards, how far that stroke would have gone
// on the flat, what the slope did to it and how the pace compared; the
// ideal line, as a training aid; and where the camera goes to follow a long
// putt down the green.
//
// Everything is in the putting frame (putting.mjs): the ball at the origin,
// the hole `distance` metres along +x, z to the golfer's right. A course
// green is read through a frame (courseGreen) so the same functions serve
// both. Pure, so the browser and the tests share it.

import { MPH } from "./flight.mjs";
import { rollBall, greenHeight, idealPuttSteps, runSteps, simulatePutt, rollingDecel, FOOT, INCH, HOLE_RADIUS, BALL_RADIUS } from "./putting.mjs";
import { LIES } from "./course.mjs";

// ---- Before the putt ---------------------------------------------------------

// How far a putt struck at `speedMph` rolls on a flat green of this stimp
// (metres): the stroke's length, with the slopes taken away. Rolled with
// the same physics as the putt itself.
export function flatRoll(speedMph, stimp) {
  if (!(speedMph > 0)) return 0;
  return rollBall({ p: [0, 0], v: [speedMph * MPH, 0], t: 0 }, { stimp }, null).rest[0];
}

// The dead-weight pace along the straight line: the slowest start that
// just gets the ball as far as the hole (it would die at the hole).
// { speedMph, runsAway } - runsAway when the slope carries even a nudged
// ball that far (a green so steep it never stops), unreachable when no
// sensible pace gets there.
export function deadWeight(green, distance, hla = 0) {
  return runSteps(deadWeightSteps(green, distance, hla));
}
// The same a roll at a time (yielding between), for a course's green to
// work out a little each frame rather than all at once (course/putting.js).
export function* deadWeightSteps(green, distance, hla = 0) {
  const a = (hla * Math.PI) / 180;
  const reaches = (speedMph) => {
    const v = speedMph * MPH;
    const r = rollBall({ p: [0, 0], v: [v * Math.cos(a), v * Math.sin(a)], t: 0 }, green, null, { stopPastX: distance, maxTime: 30 });
    return r.rest[0] >= distance;
  };
  let lo = 0.05;
  let hi = 25;
  if (reaches(lo)) return { speedMph: 0, runsAway: true };
  yield;
  if (!reaches(hi)) return { speedMph: hi, unreachable: true };
  for (let i = 0; i < 17; i++) {
    yield;
    const mid = (lo + hi) / 2;
    if (reaches(mid)) hi = mid;
    else lo = mid;
  }
  return { speedMph: (lo + hi) / 2 };
}

// The figures for the line from the ball to the hole: the height change
// (metres, positive uphill), the average slope along it (percent) and what
// it plays like - the flat distance that needs the same pace as getting to
// the hole dead weight here. { distance, rise, slopePct, playsLike,
// deadSpeedMph, runsAway }. All in metres.
export function lineFigures(green, distance) {
  return runSteps(lineFiguresSteps(green, distance));
}
// The same a roll at a time (deadWeightSteps).
export function* lineFiguresSteps(green, distance) {
  const rise = greenHeight(green, distance, 0) - greenHeight(green, 0, 0);
  const slopePct = distance > 0 ? (100 * rise) / distance : 0;
  const dead = distance > 0 ? yield* deadWeightSteps(green, distance) : { speedMph: 0 };
  return {
    distance,
    rise,
    slopePct,
    playsLike: flatRoll(dead.speedMph, green.stimp),
    deadSpeedMph: dead.speedMph,
    runsAway: !!dead.runsAway,
  };
}

// Feet or inches as written on screen: whole feet from 3 ft, a tenth below.
const feet = (m) => {
  const f = Math.round((Math.abs(m) / FOOT) * 10) / 10;
  return f >= 3 ? `${Math.round(f)} ft` : `${f.toFixed(1)} ft`;
};
const inches = (m) => {
  const i = Math.round((Math.abs(m) / INCH) * 10) / 10;
  return i >= 3 ? `${Math.round(i)} in` : `${i.toFixed(1)} in`;
};

// "↑ 4 in uphill (1.7%)", "↓ 2 in downhill (0.8%)", "level".
export function riseText(rise, slopePct) {
  if (Math.abs(rise) < 0.25 * INCH) return "level";
  const pct = Math.abs(slopePct) < 0.05 ? "" : ` (${Math.abs(slopePct).toFixed(1)}%)`;
  const size = Math.abs(rise) < 24 * INCH ? inches(rise) : feet(rise);
  return `${rise > 0 ? "↑" : "↓"} ${size} ${rise > 0 ? "uphill" : "downhill"}${pct}`;
}

// The line shown before a putt: "20 ft · ↑ 4 in uphill (1.7%) · plays
// like 23 ft". Plays-like is left out when it's the distance anyway, and
// with playsLike false (the putt's pace left to the player: puttline.js)
// so is it and the runs-away hint.
export function lineText(fig, { playsLike = true } = {}) {
  const parts = [feet(fig.distance), riseText(fig.rise, fig.slopePct)];
  if (!playsLike) return parts.join(" · ");
  if (fig.runsAway) parts.push("runs away downhill: just get it moving");
  else if (Math.abs(fig.playsLike - fig.distance) >= 0.5 * FOOT) parts.push(`plays like ${feet(fig.playsLike)}`);
  return parts.join(" · ");
}

// ---- After the putt ----------------------------------------------------------

// What a stroke did: { flat, real, slope, needed, pace, holed } in metres.
//   flat    how far it would have rolled on a flat green at this stimp
//   real    how far along the line to the hole it went here, without the
//           hole in the way (a holed putt's too)
//   slope   what the slopes added (positive) or took off
//   needed  the dead-weight pace, as a flat distance (lineFigures)
//   pace    the stroke against it: positive too firm, negative short
// `fig` is lineFigures for this putt, if already worked out.
export function puttFeedback(green, distance, shot, { holed = false, fig = null } = {}) {
  const figures = fig ?? lineFigures(green, distance);
  const a = ((shot.hla ?? 0) * Math.PI) / 180;
  const flat = flatRoll(shot.speedMph, green.stimp);
  const v = shot.speedMph * MPH;
  const real = rollBall({ p: [0, 0], v: [v * Math.cos(a), v * Math.sin(a)], t: 0 }, green, null, { maxTime: 30 }).rest[0];
  const flatAlong = flat * Math.cos(a);
  return {
    flat,
    real,
    slope: real - flatAlong,
    needed: figures.playsLike,
    pace: flat - figures.playsLike,
    holed,
    runsAway: figures.runsAway,
  };
}

// "Hit for 17 ft on the flat · the slope took 3 ft off · you needed 23 ft
// of pace - 6 ft short"; holed, "A 21 ft stroke · 20 ft was the
// dead-weight pace".
export function feedbackText(fb) {
  if (fb.holed) {
    if (fb.runsAway) return `A ${feet(fb.flat)} stroke · downhill enough to run away on its own`;
    return `A ${feet(fb.flat)} stroke · ${feet(fb.needed)} was the dead-weight pace`;
  }
  const s = Math.abs(fb.slope) < 0.5 * FOOT ? "the slope made little difference" : fb.slope < 0 ? `the slope took ${feet(fb.slope)} off` : `the slope added ${feet(fb.slope)}`;
  const parts = [`Hit for ${feet(fb.flat)} on the flat`, s];
  if (fb.runsAway) parts.push("it runs away downhill on its own");
  else {
    const verdict = Math.abs(fb.pace) < 0.5 * FOOT ? "right on it" : `${feet(fb.pace)} ${fb.pace < 0 ? "short" : "long"}`;
    parts.push(`you needed ${feet(fb.needed)} of pace - ${verdict}`);
  }
  return parts.join(" · ");
}

// ---- The ideal line ----------------------------------------------------------

// Where to aim to start the ball on a line `hla` degrees right: the point
// level with the hole on that line, metres right of it (negative left).
export function aimOffset(hla, distance) {
  return Math.tan((hla * Math.PI) / 180) * distance;
}

// "aim 8 in left of the hole (2 cups)", "straight at the hole". A cup is a
// regulation hole's width, 4¼ in.
export function aimText(offset) {
  if (Math.abs(offset) < 0.5 * INCH) return "straight at the hole";
  const side = offset > 0 ? "right" : "left";
  const size = Math.abs(offset) < 24 * INCH ? inches(offset) : feet(offset);
  const cups = Math.round(Math.abs(offset) / (2 * HOLE_RADIUS));
  return `aim ${size} ${side} of the hole${cups >= 1 && cups <= 12 ? ` (${cups} ${cups === 1 ? "cup" : "cups"})` : ""}`;
}

// The ideal putt, a roll at a time (see Stepper): the start line and pace
// that finish `pastFeet` beyond the hole (idealPuttSteps), checked by
// rolling it with the hole there. If it doesn't drop, a softer and then a
// firmer finish is tried. Returns { ok, speedMph, hla, path, aim, pace,
// pastFeet } - ok false (with the nearest try, if any) when nothing
// holes, such as on a green so steep a putt can't stop by the hole.
export function* idealLineSteps(green, distance, { pastFeet = 1.5, holeRadius = HOLE_RADIUS } = {}) {
  if (!(distance > 0)) return { ok: false, speedMph: 0, hla: 0, path: [], aim: 0, pace: 0, pastFeet };
  let best = null;
  for (const past of [pastFeet, pastFeet * 0.6, pastFeet * 1.4]) {
    const ideal = yield* idealPuttSteps(green, distance, past);
    if (!Number.isFinite(ideal.speedMph) || !Number.isFinite(ideal.hla)) continue;
    const sim = simulatePutt(ideal, green, distance, holeRadius);
    yield;
    const found = {
      ok: sim.holed,
      speedMph: ideal.speedMph,
      hla: ideal.hla,
      path: sim.holed ? lineIntoCup(sim.path, distance) : sim.path,
      aim: aimOffset(ideal.hla, distance),
      pace: flatRoll(ideal.speedMph, green.stimp),
      pastFeet: past,
      leave: sim.holed ? 0 : sim.leaveFeet * FOOT,
    };
    if (sim.holed) return found;
    if (!best || found.leave < best.leave) best = found;
  }
  return best ?? { ok: false, speedMph: 0, hla: 0, path: [], aim: 0, pace: 0, pastFeet };
}
// The line to draw for a holed putt: along the green until the ball
// drops, then into the middle of the cup - not the rattle about the
// bottom the putt's own path goes on to.
function lineIntoCup(path, distance) {
  const line = [];
  for (const q of path) {
    if ((q[3] ?? 0) < -0.01) break;
    line.push(q);
  }
  line.push([distance, 0, line[line.length - 1]?.[2] ?? 0]);
  return line;
}
export function idealLine(green, distance, options) {
  return runSteps(idealLineSteps(green, distance, options));
}

// "Ideal: aim 8 in left of the hole (2 cups) · 22 ft of pace, 5.1 mph".
export function idealText(line) {
  if (!line) return "";
  if (!line.ok) return "No line holes this one: lag it close";
  return `Ideal: ${aimText(line.aim)} · ${feet(line.pace)} of pace, ${line.speedMph.toFixed(1)} mph`;
}

// The ideal line as a training aid: off (the default), shown after each
// putt, or shown before it as well - the read, with where to aim. One
// setting for the putting green and course greens (T steps it).
export const LINE_LEVELS = ["off", "after", "always"];
export const LINE_NAMES = { off: "Off", after: "After each putt", always: "Before and after" };
export function nextLineLevel(level) {
  const i = LINE_LEVELS.indexOf(level);
  return LINE_LEVELS[(i + 1) % LINE_LEVELS.length];
}
// The level remembered, or for someone who had the putting read switched
// on before there were levels, the read as it was: before and after.
export function savedLineLevel(saved, putting) {
  if (LINE_LEVELS.includes(saved?.level)) return saved.level;
  return putting?.showRead ? "always" : "off";
}

// Runs a step-at-a-time search a few milliseconds at a time, so working
// out the ideal line never holds a frame up for long. run() does one
// frame's share and says whether it's finished; finish() does the rest at
// once (when the answer is needed now). `now` is the clock, for the tests.
export class Stepper {
  constructor(steps, now = () => performance.now()) {
    this.steps = steps;
    this.now = now;
    this.done = false;
    this.value = undefined;
    this.count = 0;
  }
  run(budgetMs = 4) {
    const end = this.now() + budgetMs;
    while (!this.done) {
      const r = this.steps.next();
      this.count++;
      if (r.done) {
        this.done = true;
        this.value = r.value;
      } else if (this.now() >= end) break;
    }
    return this.done;
  }
  finish() {
    while (!this.done) this.run(1e9);
    return this.value;
  }
}

// A few recent answers, by a key the caller makes from what the answer
// depends on (the ball, the hole, the green): the same spot isn't worked
// out twice.
export class GuideCache {
  constructor(size = 12) {
    this.size = size;
    this.map = new Map();
  }
  get(key) {
    if (!this.map.has(key)) return undefined;
    const v = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, v);
    return v;
  }
  set(key, value) {
    this.map.delete(key);
    this.map.set(key, value);
    while (this.map.size > this.size) this.map.delete(this.map.keys().next().value);
    return value;
  }
}

// ---- A course green ------------------------------------------------------------

// A course hole's green as seen from the ball, looking at the cup: the
// putting frame for everything above. `hole` has green and cup { x, z }
// (hole frame); `ball` is [x, z]. { green, distance, heading, toHole }:
// toHole(x, z) takes a point in the putting frame back to the hole frame.
// A putt from off the green (the putter picked on the fringe, the fairway
// or the first cut: clubs.mjs PUTTER_LIES) is read rolling as it will be
// played - slower over the grass until it's on the green, as playPutt
// (courseplay.mjs) has it - so its read's pace allows for that grass
// (green.frictionAt, which putting.mjs rollBall goes by).
export function courseGreen(hole, ball) {
  const heading = Math.atan2(hole.cup.z - ball[1], hole.cup.x - ball[0]);
  const distance = Math.hypot(hole.cup.x - ball[0], hole.cup.z - ball[1]);
  const c = Math.cos(heading);
  const s = Math.sin(heading);
  const toHole = (x, z) => [ball[0] + x * c - z * s, ball[1] + x * s + z * c];
  const green = { stimp: hole.green.stimp, framed: { green: hole.green, frame: [ball[0], ball[1], heading] } };
  if (hole.lieAt && hole.lieAt(ball[0], ball[1]) !== "green") green.frictionAt = grassFriction(hole, toHole);
  return { green, distance, heading, toHole };
}

// The rolling ball's slowing at a spot in the putting frame: the green's
// speed on the green, each other grass's own (sim/course.mjs LIES) off it.
// Each spot's grass is looked up once (a read rolls the putt a few hundred
// times), to FRICTION_CELL metres.
const FRICTION_CELL = 0.1;
function grassFriction(hole, toHole) {
  const onGreen = rollingDecel(hole.green.stimp);
  const seen = new Map();
  return (x, z) => {
    const key = Math.round(x / FRICTION_CELL) * 1e6 + Math.round(z / FRICTION_CELL);
    let f = seen.get(key);
    if (f === undefined) {
      const [hx, hz] = toHole(x, z);
      const lie = hole.lieAt(hx, hz);
      f = lie === "green" ? onGreen : (LIES[lie]?.decel ?? onGreen);
      seen.set(key, f);
    }
    return f;
  };
}

// ---- The camera --------------------------------------------------------------

// Past this, a putt is followed down the green.
export const FOLLOW_FEET = 16;

// Whether the camera should follow a putt: one of FOLLOW_FEET or more, or
// one whose ball would end up smaller than `minPx` across on a screen
// `screenPx` high, seen from the camera `camBack` metres behind the ball
// with a vertical field of view of `fovDeg`. `path` is the roll ([x, z,
// ...] points, putting frame) or null to go by the hole alone. A short putt
// stays as it is: the whole of it is in the picture from behind the ball.
export function followsPutt({ distance, path = null, fovDeg = 45, screenPx = 1080, camBack = 2.6, minPx = 6 }) {
  if (distance >= FOLLOW_FEET * FOOT) return true;
  let far = distance + camBack;
  for (const p of path ?? []) far = Math.max(far, Math.hypot(p[0] + camBack, p[1]));
  const px = ((2 * BALL_RADIUS) / far / ((fovDeg * Math.PI) / 180)) * screenPx;
  return px < minPx;
}

// Where the camera should be while it follows: behind the ball on the line
// from where it was struck to the hole, `trail` metres back and `up` above
// the ground, drifting sideways with the ball (a little less than it does)
// and looking at the ball, a touch ahead while it's short of the hole. It
// never goes further forward than `holeBack` short of the hole, so a putt
// that runs past is watched going by with the hole still in the picture,
// nor further back than `startBack` behind where it was struck (the
// address view). Any frame: `start`, `hole` and `ball` are [x, z].
// Returns { cam: [x, z], up, look: [x, z] }; the caller adds the ground's
// height and eases towards it.
export function followPose({ start, hole, ball }, { trail = 2.4, up = 0.9, holeBack = 1.5, startBack = 2.6 } = {}) {
  const dx = hole[0] - start[0];
  const dz = hole[1] - start[1];
  const D = Math.hypot(dx, dz) || 1;
  const ux = dx / D;
  const uz = dz / D;
  // Right of the line, whichever way it runs.
  const nx = -uz;
  const nz = ux;
  const bx = ball[0] - start[0];
  const bz = ball[1] - start[1];
  const along = bx * ux + bz * uz;
  const side = bx * nx + bz * nz;
  const camAlong = Math.max(-startBack, Math.min(along - trail, D - holeBack));
  const camSide = side * 0.6;
  const lookAlong = along + Math.min(1, Math.max(0, D - along)) * 0.5;
  return {
    cam: [start[0] + ux * camAlong + nx * camSide, start[1] + uz * camAlong + nz * camSide],
    up,
    look: [start[0] + ux * lookAlong + nx * side, start[1] + uz * lookAlong + nz * side],
  };
}
