// The speed test (the owner asked for "a fixed 30-second fly-through that
// gives one speed score per setting"): the same 30 seconds every time - a
// hole of the first starter course (sim/starters.mjs, built in the page,
// so it's there even if the course has been deleted or changed), a clear
// sky and still air, the camera on a fixed path: behind the tee, up over
// the landing area, high above the hole with the rest of the course round
// it, down to the green, round it, and back up looking down the hole - run
// once at each setting, Standard, Medium, High and Ultra. Each gets one score: the
// frames a second this PC can draw it (the drawing timed to the end of
// the graphics card's work), which can be more than the screen shows, so
// a setting's headroom shows too. A setting needs a reload to change
// (look/quality.js), so the run goes from one load to the next with its
// plan kept for the session (speedtest.js), and the graphics are put back
// as they were at the end. Pure: the path, the measuring and the plan.

import { STARTER_COURSES, starterCourse } from "./starters.mjs";
import { coursePlaces, toCourse } from "./imaginary.mjs";
import { makeCoast } from "./coast.mjs";
import { speedLinksCourse, mountainCourse } from "./shown.mjs";
import { prepareHole } from "./courseplay.mjs";
import { NAMES as GRAPHICS_NAMES } from "./graphics.mjs";

export const SPEED_TEST = {
  // Each hole's fly-through, seconds.
  seconds: 20,
  // The kinds of hole flown at each setting, in turn (the owner: "the
  // speed test needs to try the different hole types too"): a parkland
  // hole, a links hole by the sea, and a hole on hills - each the same on
  // every PC (speedTestHole).
  holes: [
    { id: "parkland", name: "Parkland" },
    { id: "links", name: "Links by the sea" },
    { id: "hills", name: "Mountain" },
  ],
  // The first second (the camera already moving) isn't counted: the
  // picture settling in.
  warm: 1,
  settings: ["standard", "medium", "high", "ultra"],
  // Golf Sim Links' 10th: water, bunkers, a bend, trees, and holes all
  // round it.
  course: 0,
  hole: 10,
  // The Mountain course's steepest hole (the most height between tee and
  // green: the speed test's hole on hills). Kept, not found again at every
  // load of the page - that was all nine holes made ready, seconds of the
  // page held before each setting's run (the owner's report, 20 October
  // 2026); test/speedtest.test.mjs checks it's still the steepest.
  hillsHole: 0,
  // Still air, a clear sky, 20°C (sim/weather.mjs).
  weather: { preset: "calm", wind: { mph: 0, from: 0, gust: 0 }, temperatureC: 20, sky: "clear", seed: 1 },
  // Runs kept, newest first.
  keep: 8,
  // Before the clock starts, the camera visits every `rehearse` seconds of
  // the path for a frame each, uncounted: everything it will see built,
  // uploaded and compiled first, so the run measures the picture, not its
  // first sight of things (the owner: "it started off slow").
  rehearse: 2,
  // The start, reported on its own: the first seconds counted.
  start: 3,
  // After the top setting's run, what costs most (the owner: "maybe the
  // test needs to change a little to find out what hurts the most"): at
  // the run's slowest moment, the camera held still, each part of the
  // picture the safety valve can shed (look/safety.js) shed in turn -
  // `settle` seconds to settle, `measure` seconds timed - against the
  // whole picture timed between them.
  costs: { settle: 0.4, measure: 1.6, show: 6 },
};

// The rehearsal: the times the camera visits before the clock starts.
export function rehearsalTimes(step = SPEED_TEST.rehearse, seconds = SPEED_TEST.seconds) {
  const out = [];
  for (let t = 0; t < seconds; t += step) out.push(t);
  out.push(seconds);
  return out;
}

// The course the test flies over: the same on every PC.
export function speedTestCourse() {
  return starterCourse(STARTER_COURSES[SPEED_TEST.course]);
}

// A kind of hole to fly (SPEED_TEST.holes' id): { course, index } - the
// course built in the page, the same on every PC and made once a page:
//   parkland  Golf Sim Links' 10th (speedTestCourse)
//   links     a links course with the sea along one side and the beach
//             near: its hole nearest the water (dunes, long grass, the
//             shore and the sea)
//   hills     Nine Oaks laid out on the Mountain hills: its steepest hole
const built = new Map();
export function speedTestHole(id) {
  if (built.has(id)) return built.get(id);
  let out;
  if (id === "links") {
    // (Also the player's own Links by the Sea: sim/shown.mjs.)
    const course = speedLinksCourse();
    const coast = makeCoast(course);
    const places = coursePlaces(course);
    const near = course.holes.map((h, i) => (coast ? Math.min(...h.layout.path.map((p) => coast.at(...toCourse(places[i], p)))) : 0));
    out = { course, index: near.indexOf(Math.min(...near)) };
  } else if (id === "hills") {
    // On the course maker's Mountain hills (the owner: "Ensuring we have a
    // hilly/mountain type elevation on a hole"), its steepest hole: the
    // most height between tee and green (hillsDrops, SPEED_TEST.hillsHole).
    // (Also the player's own Nine Oaks Mountain: sim/shown.mjs.)
    out = { course: mountainCourse(), index: SPEED_TEST.hillsHole };
  } else out = { course: speedTestCourse(), index: SPEED_TEST.hole - 1 };
  built.set(id, out);
  return out;
}

// Each of a course's holes' height between tee and green (metres): the
// Mountain course's steepest is the speed test's (SPEED_TEST.hillsHole).
export function hillsDrops(course) {
  return course.holes.map((h) => {
    const r = prepareHole(h.layout);
    const [a, b] = [r.layout.path[0], r.layout.path.at(-1)];
    return Math.abs(r.heightAt(a[0], a[1]) - r.heightAt(b[0], b[1]));
  });
}

// A setting's result from its holes' ({ id, score, fps, slowest, work,
// frames, start, worst, worstAt }): the score over all their frames
// together; the slowest start and moment of any of them, and which hole
// (worstHole); and each hole's own (holes).
export function combineHoles(list) {
  const ok = list.filter((r) => r && r.frames > 0);
  if (!ok.length) return { score: 0, fps: 0, slowest: 0, work: 0, frames: 0, holes: [] };
  const frames = ok.reduce((a, r) => a + r.frames, 0);
  const work = ok.reduce((a, r) => a + r.work * r.frames, 0) / frames;
  const worstOf = ok.filter((r) => Number.isFinite(r.worst)).reduce((a, r) => (!a || r.worst < a.worst ? r : a), null);
  const starts = ok.map((r) => r.start).filter(Number.isFinite);
  return {
    score: Math.round(1000 / Math.max(0.1, work)),
    fps: Math.round((ok.reduce((a, r) => a + r.fps * r.frames, 0) / frames) * 10) / 10,
    slowest: Math.max(...ok.map((r) => r.slowest ?? 0)),
    work: Math.round(work * 10) / 10,
    frames,
    ...(starts.length ? { start: Math.min(...starts) } : {}),
    ...(worstOf ? { worst: worstOf.worst, worstAt: worstOf.worstAt, worstHole: worstOf.id } : {}),
    holes: ok.map((r) => ({ id: r.id, score: r.score, ...(Number.isFinite(r.start) ? { start: r.start } : {}), ...(Number.isFinite(r.worst) ? { worst: r.worst, worstAt: r.worstAt } : {}) })),
    // The longest frames of any hole - freezes and what caused them
    // (speedtest.js), with which hole.
    long: ok
      .flatMap((r) => (Array.isArray(r.long) ? r.long : []).map((l) => ({ ...l, hole: r.id })))
      .sort((a, b) => b.ms - a.ms)
      .slice(0, 6),
  };
}
export const holeName = (id) => SPEED_TEST.holes.find((h) => h.id === id)?.name ?? id;

// ---- The path ----------------------------------------------------------------

// The fly-through's plan, in world terms (y up): path the hole's line of
// play [[x, z]...] from the tee to the green, groundY(x, z), pin [x, y, z].
// Six poses over the 30 seconds, eased through as one smooth curve.
export function speedTestPlan(path, groundY, pin) {
  const cum = [0];
  for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  const total = cum.at(-1) || 1;
  const at = (s) => {
    const d = Math.min(Math.max(s, 0), total);
    let i = 1;
    while (i < path.length - 1 && cum[i] < d) i++;
    const [a, b] = [path[i - 1] ?? path[0], path[i] ?? path[0]];
    const span = cum[i] - cum[i - 1] || 1;
    const k = Math.min(Math.max((d - cum[i - 1]) / span, 0), 1);
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return { p: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], dir: [(b[0] - a[0]) / len, (b[1] - a[1]) / len] };
  };
  const lift = ([x, z], up) => [x, groundY(x, z) + up, z];
  const off = (p, dir, back, side = 0) => [p[0] - dir[0] * back - dir[1] * side, p[1] - dir[1] * back + dir[0] * side];
  const tee = at(0);
  const landing = at(Math.min(total * 0.45, 230));
  const middle = at(total * 0.5);
  const short = at(Math.max(0, total - 45));
  const end = at(total);
  const green = [pin[0], pin[2]];
  // (The poses' times as shares of the fly-through: 6, 13, 20 and 25 s
  // of the 30 it once was.)
  const T = SPEED_TEST.seconds / 30;
  const keys = [
    { t: 0, cam: lift(off(tee.p, tee.dir, 30), 12), look: lift(landing.p, 0) },
    { t: 6 * T, cam: lift(off(at(total * 0.3).p, landing.dir, 20, 15), 45), look: lift(at(total * 0.75).p, 0) },
    { t: 13 * T, cam: lift(off(middle.p, middle.dir, 60), 160), look: lift(end.p, 0) },
    { t: 20 * T, cam: lift(short.p, 8), look: pin },
    { t: 25 * T, cam: lift(off(green, end.dir, -10, 35), 10), look: pin },
    { t: SPEED_TEST.seconds, cam: lift(off(green, end.dir, -60), 35), look: lift(at(total * 0.4).p, 0) },
  ];
  return { keys, total: SPEED_TEST.seconds };
}

// Catmull-Rom between b and c (a and d either side), u from 0 to 1.
const spline = (a, b, c, d, u) => b.map((v, i) => 0.5 * (2 * v + (-a[i] + c[i]) * u + (2 * a[i] - 5 * v + 4 * c[i] - d[i]) * u * u + (-a[i] + 3 * v - 3 * c[i] + d[i]) * u * u * u));

// Where the camera is and looks `t` seconds in: { cam, look, done }.
export function speedTestAt(plan, t) {
  const keys = plan.keys;
  const time = Math.min(Math.max(t, 0), plan.total);
  let i = 0;
  while (i < keys.length - 2 && keys[i + 1].t <= time) i++;
  const [a, b, c, d] = [keys[Math.max(0, i - 1)], keys[i], keys[i + 1], keys[Math.min(keys.length - 1, i + 2)]];
  const u = (time - b.t) / (c.t - b.t || 1);
  return { cam: spline(a.cam, b.cam, c.cam, d.cam, u), look: spline(a.look, b.look, c.look, d.look, u), done: t >= plan.total };
}

// Where it goes, for the trees drawn in full (look/trees.js): chosen once
// for the whole run, as it never cuts.
export function speedTestTreePath(plan) {
  const out = [];
  for (let t = 0; t <= plan.total; t += 1) {
    const at = speedTestAt(plan, t);
    out.push([at.cam[0], at.cam[2]], [at.look[0], at.look[2]]);
  }
  return out;
}

// ---- Measuring ----------------------------------------------------------------

// Each frame drawn during the run: time (the animation loop's ms) and work
// (ms: the frame's own work, timed to the end of the drawing on the
// graphics card). The first `warm` seconds aren't counted.
export class SpeedMeter {
  constructor({ warm = SPEED_TEST.warm } = {}) {
    this.warm = warm;
    this.start = null;
    this.last = null;
    this.work = [];
    this.gaps = [];
  }

  // Seconds since the first frame.
  elapsed(time) {
    return this.start === null ? 0 : (time - this.start) / 1000;
  }

  frame(time, work) {
    if (this.start === null) this.start = time;
    const gap = this.last === null ? null : time - this.last;
    this.last = time;
    if (this.elapsed(time) < this.warm || !Number.isFinite(work)) return;
    this.work.push(work);
    // (And by the second it fell in: where in the fly-through it's slow.)
    const sec = Math.floor(this.elapsed(time));
    (this.bySecond ??= [])[sec] = [...(this.bySecond[sec] ?? []), work];
    if (gap !== null && gap > 0) this.gaps.push(gap);
  }

  // The average frame's work (ms) each second of the run (null where none
  // was counted).
  curve() {
    return Array.from({ length: SPEED_TEST.seconds }, (_, i) => {
      const w = this.bySecond?.[i];
      return w?.length ? Math.round((w.reduce((a, v) => a + v, 0) / w.length) * 10) / 10 : null;
    });
  }

  // { score, fps, slowest, work, frames }: score - the frames a second it
  // can draw (1000 / the average frame's work); fps - the frames a second
  // actually shown; slowest - the longest gap between frames (ms); work -
  // the average frame's work (ms). null with nothing measured.
  result() {
    if (!this.work.length) return null;
    const mean = this.work.reduce((s, v) => s + v, 0) / this.work.length;
    const shown = this.gaps.reduce((s, v) => s + v, 0);
    const curve = this.curve();
    return {
      score: Math.round(1000 / Math.max(0.1, mean)),
      fps: shown > 0 ? Math.round((this.gaps.length / shown) * 10000) / 10 : 0,
      slowest: Math.round(Math.max(0, ...this.gaps)),
      work: Math.round(mean * 10) / 10,
      frames: this.work.length,
      curve,
      ...curveFacts(curve),
    };
  }
}

// What a run's per-second curve says: start - the frames a second it
// could draw over the first seconds counted (SPEED_TEST.start); rest -
// over the rest; worstAt - the second it was slowest (its middle, for
// holding the camera there), and worst - the frames a second then.
export function curveFacts(curve) {
  const fps = (ms) => (ms > 0 ? Math.round(1000 / ms) : null);
  const mean = (v) => (v.length ? v.reduce((a, x) => a + x, 0) / v.length : null);
  const counted = curve.map((ms, i) => [ms, i]).filter(([ms]) => ms != null);
  if (!counted.length) return { start: null, rest: null, worstAt: null, worst: null };
  const first = counted[0][1];
  const start = counted.filter(([, i]) => i < first + SPEED_TEST.start).map(([ms]) => ms);
  const rest = counted.filter(([, i]) => i >= first + SPEED_TEST.start).map(([ms]) => ms);
  // (The slowest after the start: the start says itself.)
  const [worstMs, worstI] = (rest.length ? counted.filter(([, i]) => i >= first + SPEED_TEST.start) : counted).reduce((a, b) => (b[0] > a[0] ? b : a));
  return { start: fps(mean(start)), rest: fps(mean(rest)), worstAt: worstI + 0.5, worst: fps(worstMs) };
}

// Where the camera is at a moment of the fly-through, in words.
export function momentWords(t) {
  const u = (t / SPEED_TEST.seconds) * 30;
  if (u < 6) return "behind the tee";
  if (u < 11) return "over the landing area";
  if (u < 17) return "high above the hole, the course round it";
  if (u < 22) return "coming down to the green";
  if (u < 26) return "round the green";
  return "rising, looking back down the hole";
}

// What costs most: the whole picture's frame (ms, `whole`) against each
// part's frame with it shed ({ name: ms }) - [{ name, ms, share }], the
// biggest first, those saving under `least` ms left out. share: of the
// whole frame, 0 - 1.
export function costsFrom(whole, without, least = 0.2) {
  if (!(whole > 0)) return [];
  return Object.entries(without)
    .filter(([, ms]) => Number.isFinite(ms))
    .map(([name, ms]) => ({ name, ms: Math.round((whole - ms) * 10) / 10, share: Math.round(((whole - ms) / whole) * 100) / 100 }))
    .filter((c) => c.ms >= least)
    .sort((a, b) => b.ms - a.ms);
}

// ---- The plan, from one load to the next ------------------------------------------

// The graphics to load for one setting of the run: the owner's own kept
// (the highest raised, so it's allowed), left alone by the safety valve.
export function graphicsFor(keep, setting) {
  return { ...(keep && typeof keep === "object" ? keep : {}), setting, level: setting === "standard" ? "standard" : "high", highest: null, fixed: true };
}

// A new run: each setting in turn, the owner's graphics (as saved) to put back.
export function newPlan(keep, now = 0) {
  return { v: 1, at: 0, order: [...SPEED_TEST.settings], results: [], keep: keep ?? null, started: now };
}

// The setting to measure next, or null when every one is done.
export const planNext = (plan) => plan?.order?.[plan.at] ?? null;

// The plan with this setting's result kept and the next one up.
export function planAfter(plan, result) {
  return { ...plan, at: plan.at + 1, results: [...plan.results, { setting: planNext(plan), ...result }] };
}

// A plan as kept in the session's storage, checked; null if it isn't one.
export function cleanPlan(raw) {
  if (!raw || raw.v !== 1 || !Array.isArray(raw.order) || !Array.isArray(raw.results) || !Number.isInteger(raw.at)) return null;
  if (!raw.order.every((s) => SPEED_TEST.settings.includes(s)) || raw.at < 0 || raw.at > raw.order.length) return null;
  return raw;
}

// The runs kept ({ at, gpu, hz, results: [{ setting, score, fps,
// slowest }] }, newest first), checked.
export function cleanHistory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r) => r && Number.isFinite(r.at) && Array.isArray(r.results))
    .map((r) => ({
      at: r.at,
      gpu: typeof r.gpu === "string" ? r.gpu.slice(0, 120) : "",
      hz: Number.isFinite(r.hz) ? r.hz : null,
      results: r.results
        .filter((x) => x && SPEED_TEST.settings.includes(x.setting) && Number.isFinite(x.score))
        .map((x) => ({
          setting: x.setting,
          score: Math.round(x.score),
          fps: Number(x.fps) || 0,
          slowest: Math.round(Number(x.slowest) || 0),
          ...(Number.isFinite(x.start) ? { start: Math.round(x.start) } : {}),
          ...(Number.isFinite(x.worst) ? { worst: Math.round(x.worst), worstAt: Number(x.worstAt) || 0 } : {}),
          ...(SPEED_TEST.holes.some((h) => h.id === x.worstHole) ? { worstHole: x.worstHole } : {}),
          ...(Array.isArray(x.holes) ? { holes: x.holes.filter((h) => h && SPEED_TEST.holes.some((k) => k.id === h.id) && Number.isFinite(h.score)).map((h) => ({ id: h.id, score: Math.round(h.score) })) } : {}),
          ...(Array.isArray(x.long) && x.long.length
            ? {
                long: x.long
                  .filter((l) => l && Number.isFinite(l.ms))
                  .slice(0, 6)
                  .map((l) => ({ ms: Math.round(l.ms), t: Number(l.t) || 0, ...(l.ready ? { ready: true } : {}), ...(SPEED_TEST.holes.some((h) => h.id === l.hole) ? { hole: l.hole } : {}), causes: (Array.isArray(l.causes) ? l.causes : []).filter((c) => typeof c === "string").slice(0, 4).map((c) => c.slice(0, 120)) })),
              }
            : {}),
          ...(Array.isArray(x.costs) ? { costs: x.costs.filter((c) => c && typeof c.name === "string" && Number.isFinite(c.ms)).slice(0, 12).map((c) => ({ name: c.name.slice(0, 60), ms: c.ms, share: Number(c.share) || 0 })) } : {}),
        })),
    }))
    .filter((r) => r.results.length)
    .slice(0, SPEED_TEST.keep);
}

export const withRun = (history, run) => cleanHistory([run, ...cleanHistory(history)]);

// Each setting by its name (sim/graphics.mjs NAMES).
const NAME = GRAPHICS_NAMES;

// "Very low 214 · Low 131 · Standard 88": a run's scores.
export function runText(run) {
  return (run?.results ?? []).map((r) => `${NAME[r.setting] ?? r.setting} ${r.score}`).join(" · ");
}

// What a score means against what the safety valve aims at for this screen
// (target: sim/refresh.mjs targetFps).
export function scoreWords(score, target = 60) {
  if (score >= target * 1.5) return "smooth, with room to spare";
  if (score >= target) return "smooth";
  if (score >= target * 0.75) return "a little under the screen's rate";
  return "too slow for this screen";
}
