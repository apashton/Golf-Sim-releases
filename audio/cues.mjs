// When a shot makes its sounds: from a shot's path (the same one the ball is
// drawn along), the moments it lands, bounces, splashes into water, drops
// in the cup or lips out, each with what it hit and how hard. The modes
// play each one as the ball gets there (CueQueue), so the sound is always
// in step with the picture - a shot cut short by the next one simply
// stops making sounds.

import { blobOutline } from "../sim/course.mjs";
import { waterKind } from "./ambience.mjs";

// A shot's path: [[x, y, z, t], ...] with y the height above the ground,
// the first `flightPoints` of them in the air. The courses end a ball in
// the water or the cup with a point just below the ground.
//   lieAt(x, z)  what the ground is at a spot (course lies), for the thud
// Returns cues sorted by time: { t, kind, lie?, speed, steep?, impact?,
// bounce?, at }
//   kind  "land" (with lie and bounce: 0 the first touchdown), "splash",
//         "cup" (fly: dropped in without touching the green), "lip" (a
//         tick off the rim; wall: a clack off the cup's wall; pin: a knock
//         off the flagstick),
//         "tree" (into a wood, in the air; or a tree on a course, with
//         part: "trunk", "caught", "branch" or "clip"), "face" (into a bunker's face)
//   speed how fast the ball arrived (m/s), steep how steeply (0 level, 1
//         straight down), impact how hard it met the ground: mostly the
//         coming down, a little the skidding along
//   at    [x, y, z] in the path's frame
export function shotCues(res, { lieAt = () => "fairway" } = {}) {
  const path = res?.path ?? [];
  const cues = [];
  if (path.length < 2) return cues;
  const n = Math.min(res.flightPoints ?? 0, path.length);
  const last = path.length - 1;
  const at = (p) => [p[0], p[1], p[2]];

  // Into a wood (the driving challenge's dog-leg): it hits the trees in the
  // air and drops.
  if (res.wood && n > 1) {
    const hit = path[n - 1];
    cues.push({ t: hit[3], kind: "tree", speed: speedAt(path, n - 1).speed, at: at(hit) });
    const end = path[last];
    if (end[3] > hit[3]) cues.push({ t: end[3], kind: "land", lie: "trees", speed: 6, bounce: 1, at: at(end) });
    return cues;
  }
  // Into a dug bunker's face: a thump into the bank, then it drops back.
  if (res.face && n > 1) {
    const hit = path[n - 1];
    cues.push({ t: hit[3], kind: "face", lie: "bunker", speed: speedAt(path, n - 1).speed, at: at(hit) });
    const end = path[last];
    if (end[3] > hit[3] + 0.05) cues.push({ t: end[3], kind: "land", lie: "bunker", speed: 4, bounce: 1, at: at(end) });
    return cues;
  }

  // A tree on the way (a course's, sim/treehits.mjs): its trunk knocked,
  // or its leaves, as the ball gets there.
  for (const h of res.trees ?? []) cues.push({ t: h.t, kind: "tree", part: h.kind, speed: h.speedIn, at: [...h.at] });

  // Every touchdown: the first landing, then each hop coming down again.
  let bounce = 0;
  for (let i = Math.max(1, n - 1); i <= last; i++) {
    const p = path[i];
    const q = path[i - 1];
    if (p[1] < -0.001) continue; // the cup or the water: below
    const first = i === n - 1 && n > 1;
    if (!first && !(p[1] <= 0.005 && q[1] > 0.005)) continue;
    const { speed, steep } = speedAt(path, i);
    if (speed < 0.8 && bounce > 0) continue;
    const lie = lieAt(p[0], p[2]);
    cues.push({ t: p[3], kind: "land", lie, speed, steep, impact: impactSpeed(speed, steep), bounce, at: at(p) });
    bounce++;
    // Into the water (the range's pond, which its ball flies on over): a
    // splash, and nothing after it.
    if (lie === "water") break;
  }
  const end = path[last];
  if (res.penalty?.kind === "water") {
    const { speed, steep } = speedAt(path, last);
    // Landing straight in: the speed it came down at, not the drop below.
    const land = cues.find((c) => Math.abs(c.t - end[3]) < 0.02);
    dropNear(cues, end[3]);
    cues.push({ t: end[3], kind: "splash", speed: land?.speed ?? speed, steep: land?.steep ?? steep, at: at(end) });
  } else if (res.holed) {
    // How fast it dropped in: as the physics says, or else from the path up
    // to the rim (not the jump to the cup's middle the path ends with).
    const speed = Number.isFinite(res.cupSpeed) ? res.cupSpeed : speedAt(path, Math.max(0, last - 1)).speed;
    // When: as it first reaches the bottom of the cup, if the physics says
    // (the path goes on as it settles there), or where the path ends.
    const t = Number.isFinite(res.cupTime) && res.cupTime <= end[3] ? res.cupTime : end[3];
    const fly = res.fly ?? (res.how === "in on the fly" || (end[1] < -0.001 && cues.some((c) => Math.abs(c.t - end[3]) < 0.02)));
    dropNear(cues, end[3]);
    cues.push({ t, kind: "cup", speed: Math.min(speed, 6), fly, at: at(pointAt(path, t)) });
  }
  const touches = cupTouches(res, path, end);
  // The knock on the back of the cup, heard as it happened: the drop
  // needn't add its own.
  const cup = cues.find((c) => c.kind === "cup");
  if (cup && touches.some((c) => c.wall || (!c.pin && c.speed > 1))) cup.tapped = true;
  cues.push(...touches);
  return cues.sort((a, b) => a.t - b.t);
}

// The ball meeting the cup (sim/cup.mjs): a tick off the rim, a clack off
// the wall, a knock off the pin - each touch hard enough to hear, before a
// holed ball drops (its rattles in the bottom are the cup's own sound).
// A lip-out that only rode the rim, touching nothing hard, still gets its
// small tick, when it last touched.
export const TOUCH_HEARD = 0.15; // m/s into the rim, wall or pin
function cupTouches(res, path, end) {
  const out = [];
  const until = res.holed && Number.isFinite(res.cupTime) ? res.cupTime - 0.001 : end[3];
  let last = -Infinity;
  for (const e of res.cupEvents ?? []) {
    if (e.kind === "bottom" || e.t > until || e.speed < TOUCH_HEARD || e.t - last < 0.025) continue;
    last = e.t;
    const c = { t: e.t, kind: "lip", speed: Math.min(3, e.speed), at: at3(pointAt(path, e.t)) };
    if (e.kind === "wall") c.wall = true;
    if (e.kind === "pin") c.pin = true;
    out.push(c);
  }
  const heard = (t) => out.some((c) => Math.abs(c.t - t) < 0.025);
  if (res.lipped && Number.isFinite(res.lipTime) && res.lipTime <= end[3] && !out.some((c) => !c.pin)) out.push({ t: res.lipTime, kind: "lip", speed: 1, at: at3(pointAt(path, res.lipTime)) });
  // Knocked back off the flagstick: a knock, if the touches didn't say.
  if (Number.isFinite(res.pinTime) && res.pinTime <= end[3] && !heard(res.pinTime)) out.push({ t: res.pinTime, kind: "lip", pin: true, speed: 1, at: at3(pointAt(path, res.pinTime)) });
  return out;
}
const at3 = (p) => [p[0], p[1], p[2]];

// A putt on the practice green: its path is [[x, z, t, y?], ...], rolling
// (y its height, where it's given: down in the cup, or hopping out).
export function puttCues(res) {
  const path = (res?.path ?? []).map(([x, z, t, y]) => [x, y ?? 0, z, t]);
  return shotCues({ ...res, path, flightPoints: 0 }, { lieAt: () => "green" });
}

// How hard a ball meets the ground (m/s): all of its coming down, a third
// of its going along.
export function impactSpeed(speed, steep) {
  const down = speed * steep;
  const along = Math.sqrt(Math.max(0, speed * speed - down * down));
  return Math.hypot(down, 0.35 * along);
}

// Takes out landings at the same moment as a splash or a drop into the cup:
// that's one sound, not two.
function dropNear(cues, t) {
  for (let i = cues.length - 1; i >= 0; i--) if (cues[i].kind === "land" && Math.abs(cues[i].t - t) < 0.02) cues.splice(i, 1);
}

// How fast the ball is going arriving at path point i (m/s), and how steep
// its way down is (0 level, 1 straight down), from the points before it.
export function speedAt(path, i) {
  const p = path[i];
  for (let j = i - 1; j >= 0; j--) {
    const q = path[j];
    const dt = p[3] - q[3];
    if (dt < 0.004) continue;
    const dx = p[0] - q[0];
    const dy = Math.max(0, q[1]) - Math.max(0, p[1]);
    const dz = p[2] - q[2];
    const speed = Math.hypot(dx, dy, dz) / dt;
    return { speed, steep: speed > 0 ? Math.max(0, dy / dt) / speed : 0 };
  }
  return { speed: 0, steep: 0 };
}

// Where the path is at time t (the point just before).
function pointAt(path, t) {
  let p = path[0];
  for (const q of path) {
    if (q[3] > t) break;
    p = q;
  }
  return p;
}

// Hands out a shot's cues as the ball reaches them.
export class CueQueue {
  constructor(cues = []) {
    this.cues = [...cues].sort((a, b) => a.t - b.t);
    this.next = 0;
  }
  // The cues whose time has come by `elapsed` seconds into the shot.
  due(elapsed) {
    const out = [];
    while (this.next < this.cues.length && this.cues[this.next].t <= elapsed) out.push(this.cues[this.next++]);
    return out;
  }
  get done() {
    return this.next >= this.cues.length;
  }
}

// ---- What a scene sounds like ---------------------------------------------------

// A scene's background: how windy (0-1), whether birds are about, and its
// water - [{ points: [[x, z], ...] (world ground plane), y, kind }].
// `dusk` 0-1 for a scene with a time of day (none has one yet).
export function soundscape({ wind = 0.35, birds = true, water = [], dusk = 0, fowl = [] } = {}) {
  return {
    wind,
    birds,
    dusk,
    fowl: fowlOnWater(fowl),
    water: water.filter((w) => w.points?.length >= 3).map((w) => ({ ...w, y: w.y ?? 0, kind: w.kind ?? waterKind(w.points) })),
  };
}

// The ducks and swans on the water (sim/furniture.mjs pondBirds), each
// where it's drawn in the world: [{ kind, at: [x, y, z] }].
export function fowlOnWater(birds = []) {
  return (birds ?? []).filter((b) => (b?.kind === "duck" || b?.kind === "swan") && b.at?.length === 3 && b.at.every(Number.isFinite)).map((b) => ({ kind: b.kind, at: [...b.at] }));
}

// A hole's background (course.mjs layout, in the hole's frame): its ponds
// and streams, turned into the world's frame as the course draws them
// (world x = hole z, world z = -hole x). heightAt(x, z) (hole frame) puts
// the water's surface at its lowest edge, as the course lays it.
export function holeSoundscape(layout, { heightAt = null, wind = 0.35 } = {}) {
  const water = [];
  for (const w of layout?.water ?? []) {
    let pts = null;
    if (Array.isArray(w.poly)) pts = w.poly;
    else if (Number.isFinite(w.x) && Number.isFinite(w.rx)) pts = blobOutline(w, 32);
    if (!pts || pts.length < 3) continue;
    // A long mapped outline needs no more than this many points to judge by.
    const step = Math.max(1, Math.floor(pts.length / 96));
    const kept = pts.filter((_, i) => i % step === 0);
    const y = heightAt ? Math.min(...kept.map(([x, z]) => heightAt(x, z))) : 0;
    water.push({ points: kept.map(([x, z]) => [z, -x]), y });
  }
  return soundscape({ wind, water });
}
