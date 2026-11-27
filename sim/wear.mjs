// Where a hole's grass is worn, for the look of it (look/wear.js draws it):
//
//   lines    tracks worn by feet where everyone walks the same way - off the
//            tee towards the fairway, from the green on towards the next
//            tee, between the end of a cart path and the green or tee it
//            serves. Slightly wandering, as people walk, a little under a
//            metre wide, and only over rough: never on a green or its
//            fringe (they stop a couple of metres short), never over the
//            fairway, a tee, sand, water or the path itself.
//   patches  thin, patchy grass here and there in the rough - a few metres
//            across, well away from the fairway and the green.
//
// The browner grass along the cart paths themselves is the paths' verge
// (look/paths.js), made wider and less even with vergeProfile() here.
//
// Hole frame (sim/course.mjs): the tee at (0, 0), x down the hole, z to the
// right, metres. lieAt(x, z) is the hole's surface. Seeded, so a hole
// always looks the same. Pure, for the tests.

import { seeded } from "./course.mjs";
import { pathLine, validPath } from "./paths.mjs";

// What a worn line or a patch may lie on.
export const WEARS = new Set(["rough", "semi", "deep"]);
// Kept clear of these by at least the distance given (metres).
const PATCH_CLEAR = { fairway: 6, green: 12, fringe: 10, tee: 6, bunker: 3, greenside: 3, waste: 3, water: 3, path: 2 };
const LINE_STOP = 2; // how far short of a green's fringe a line stops

export const MAX_PATCHES = 18;

// A little random number from a whole-number seed and a position, 0 - 1:
// for wobbles along a line that don't depend on how finely it's sampled.
function hash(a, b) {
  let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
// Smooth noise along a line: 0 - 1, changing over about `scale` metres.
export function wobble(seed, s, scale = 6) {
  const t = s / scale;
  const i = Math.floor(t);
  const f = t - i;
  const u = f * f * (3 - 2 * f);
  return hash(seed, i) * (1 - u) + hash(seed, i + 1) * u;
}

// On rough, with nothing it mustn't lie near within that thing's distance
// in `table` - looked for on rings at each of those distances.
function clearOf(lieAt, x, z, table) {
  if (!WEARS.has(lieAt(x, z))) return false;
  const rings = [...new Set(Object.values(table))].sort((a, b) => a - b);
  for (const r of rings) {
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      const lie = lieAt(x + Math.cos(a) * r, z + Math.sin(a) * r);
      if (table[lie] != null && table[lie] >= r) return false;
    }
  }
  return true;
}

// The box the hole's play takes place in: tee to beyond the green.
export function holeBox(L) {
  const g = L.green;
  const len = Math.max(60, (g?.x ?? 150) + Math.max(g?.rx ?? 15, g?.rz ?? 15) + 30);
  return { x0: -15, x1: len, z0: -55, z1: 55 };
}

// Patches of thin grass in the rough, at most MAX_PATCHES, none
// overlapping another: { x, z, r (how far it reaches from x, z), kind,
// strength, parts }. Each is one or more soft-edged parts - { x, z, rx,
// rz, rot, lobes: [[k, phase, amp]...] } - so no two are the same shape:
//   blob     one rounded shape, stretched a little and irregular
//   bean     longer, bent - a kidney or comma
//   cluster  a few small ones close together, as wear comes in spots
//   streak   long and thin, where water runs off or feet cut a corner
export const PATCH_KINDS = ["blob", "bean", "cluster", "streak"];
export function wearPatches(L, lieAt, seed = 1) {
  const rand = seeded((seed ^ 0x51ed) >>> 0 || 1);
  const box = holeBox(L);
  const area = (box.x1 - box.x0) * (box.z1 - box.z0);
  const want = Math.min(MAX_PATCHES, Math.round(area / 1500));
  const out = [];
  for (let tries = 0; tries < want * 12 && out.length < want; tries++) {
    const x = box.x0 + rand() * (box.x1 - box.x0);
    const z = box.z0 + rand() * (box.z1 - box.z0);
    const size = 1.5 + rand() * rand() * 4;
    const kind = PATCH_KINDS[Math.floor(rand() * PATCH_KINDS.length)];
    const parts = patchParts(kind, x, z, size, rand);
    const r = reachOf(parts, x, z);
    if (out.some((p) => Math.hypot(p.x - x, p.z - z) < p.r + r + 4)) continue;
    const table = Object.fromEntries(Object.entries(PATCH_CLEAR).map(([k, v]) => [k, v + r]));
    if (!clearOf(lieAt, x, z, table)) continue;
    out.push({ x: r2(x), z: r2(z), r: r2(r), kind, strength: r2(0.55 + rand() * 0.45), parts });
  }
  return out;
}

// The irregular outline of a part: a few gentle bulges (low harmonics
// only, so it stays soft - no points or spikes).
function lobes(rand, bold = 1) {
  return [2, 3, 4, 5].map((k, i) => [k, r2(rand() * Math.PI * 2), r2((0.04 + rand() * 0.14) * bold / (1 + i * 0.6))]);
}

export function patchParts(kind, x, z, size, rand) {
  const rot = rand() * Math.PI;
  const part = (dx, dz, rx, rz, turn = 0, bold = 1) => ({
    x: r2(x + dx),
    z: r2(z + dz),
    rx: r2(rx),
    rz: r2(rz),
    rot: r2(rot + turn),
    lobes: lobes(rand, bold),
  });
  if (kind === "bean") {
    // Three overlapping parts along a curve (a parabola, turned): along
    // `u`, bowed out to one side by `bow` at the ends.
    const bow = (rand() < 0.5 ? -1 : 1) * size * (0.3 + rand() * 0.4);
    const len = size * (0.6 + rand() * 0.35);
    return [-1, 0, 1].map((t) => {
      const u = t * len;
      const v = bow * t * t;
      const turn = Math.atan2(2 * bow * t, len);
      return part(Math.cos(rot) * u - Math.sin(rot) * v, Math.sin(rot) * u + Math.cos(rot) * v, size * (t ? 0.6 : 0.72), size * (t ? 0.45 : 0.55), turn);
    });
  }
  if (kind === "cluster") {
    const n = 2 + Math.floor(rand() * 3);
    return Array.from({ length: n }, (_, i) => {
      const a = rand() * Math.PI * 2;
      const d = i === 0 ? 0 : size * (0.5 + rand() * 0.7);
      const r = size * (i === 0 ? 0.55 : 0.28 + rand() * 0.25);
      return part(Math.cos(a) * d, Math.sin(a) * d, r * (1 + rand() * 0.5), r, rand() * Math.PI, 1.3);
    });
  }
  if (kind === "streak") {
    // A row of soft round parts along a slight curve, smaller towards the
    // ends: long and thin, but rounded at the ends (one thin ellipse would
    // come to a point).
    const n = 4 + Math.floor(rand() * 3);
    const width = size * (0.3 + rand() * 0.15);
    const step = width * 1.1;
    const bow = (rand() - 0.5) * width * 1.5;
    return Array.from({ length: n }, (_, i) => {
      const t = (i / (n - 1)) * 2 - 1;
      const u = t * step * (n - 1) * 0.5;
      const v = bow * t * t;
      const taper = 1 - 0.4 * t * t;
      return part(Math.cos(rot) * u - Math.sin(rot) * v, Math.sin(rot) * u + Math.cos(rot) * v, width * taper * (1.2 + rand() * 0.3), width * taper, (rand() - 0.5) * 0.4, 0.8);
    });
  }
  // A blob: stretched up to two to one, and bolder bulges.
  return [part(0, 0, size * (1 + rand() * 0.8), size, 0, 1.6)];
}

// How far from (x, z) any part of it reaches.
// ⚡ Bolt Optimization: Replaced chained .map().reduce() and spread syntax (...Math.max)
// with native for-loops to eliminate intermediate array allocations and closure overhead
// in this tight geometry loop, saving CPU cycles during shape generation.
function reachOf(parts, x, z) {
  let maxReach = 0;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    let sum = 0;
    for (let j = 0; j < p.lobes.length; j++) {
      sum += p.lobes[j][2];
    }
    const r = Math.hypot(p.x - x, p.z - z) + Math.max(p.rx, p.rz) * (1 + sum);
    if (r > maxReach) {
      maxReach = r;
    }
  }
  return maxReach;
}

// A part's outline radius at angle t (radians, in the hole frame), as a
// factor of its size: ellipse, turned, with its bulges.
// ⚡ Bolt Optimization: Eliminated .reduce() in favor of a basic for-loop.
// This function is called repeatedly during simulation, so avoiding callback overhead
// yields measurable improvements to execution speed while preventing GC thrashing.
export function partRadius(part, t) {
  const a = t - part.rot;
  const e = 1 / Math.hypot(Math.cos(a) / part.rx, Math.sin(a) / part.rz);
  let sum = 0;
  for (let i = 0; i < part.lobes.length; i++) {
    const lobe = part.lobes[i];
    sum += lobe[2] * Math.sin(lobe[0] * a + lobe[1]);
  }
  return e * (1 + sum);
}

// A worn line from a to b: waypoints a metre or so apart, wandering a
// little either side (up to `sway` metres, most in the middle), cut into
// the runs that lie on rough. Each: { pts: [[x, z]...], w } - w, its width.
export function wornLine(a, b, lieAt, { seed = 1, sway = 1.2, width = 0.85, stopShort = null } = {}) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const len = Math.hypot(dx, dz);
  if (len < 4) return [];
  const ux = dx / len;
  const uz = dz / len;
  const n = Math.max(2, Math.ceil(len / 1));
  const runs = [];
  let run = [];
  for (let i = 0; i <= n; i++) {
    const s = (i / n) * len;
    // Most wander in the middle; none at the ends, where it starts and
    // arrives where it must.
    const bell = Math.sin((Math.PI * i) / n);
    const off = (wobble(seed, s, 9) - 0.5) * 2 * sway * bell + (wobble(seed + 7, s, 2.5) - 0.5) * 0.25;
    const x = a[0] + ux * s - uz * off;
    const z = a[1] + uz * s + ux * off;
    const ok = WEARS.has(lieAt(x, z)) && !(stopShort && stopShort(x, z));
    if (ok) run.push([r2(x), r2(z)]);
    else if (run.length) {
      runs.push(run);
      run = [];
    }
  }
  if (run.length) runs.push(run);
  return runs.filter((r) => r.length >= 4).map((pts) => ({ pts, w: width }));
}

// Where people walk on a hole: off the tee, green to next tee, and between
// the cart path's ends and the tee and green. nextTee: the next hole's tee
// in this hole's frame (sim/signs.mjs nextTeeFrom), or null.
export function wearLines(L, lieAt, { seed = 1, nextTee = null } = {}) {
  const g = L.green;
  if (!g || !Number.isFinite(g.x)) return [];
  const gr = Math.max(g.rx ?? 10, g.rz ?? 10);
  // Near the green: its fringe and a couple of metres more are kept clear.
  const nearGreen = (x, z) => ["green", "fringe"].includes(lieAt(x, z)) || ringHits(lieAt, x, z, LINE_STOP, ["green", "fringe"]);
  // A point on the green's edge towards (x, z), from its middle.
  const edgeToward = (x, z) => {
    const d = Math.hypot(x - g.x, z - g.z) || 1;
    return [g.x + ((x - g.x) / d) * gr, g.z + ((z - g.z) / d) * gr];
  };
  const out = [];
  let k = 0;
  const add = (a, b, opts = {}) => out.push(...wornLine(a, b, lieAt, { seed: seed * 31 + k++, stopShort: nearGreen, ...opts }));
  // Off the tee: straight on towards the fairway, over whatever rough
  // lies in front (a par 3's runs on towards the green).
  // Off the side of the tee's front, angling out: nobody walks the exact
  // middle.
  const side = seed % 2 ? 1 : -1;
  add([6, side * 2], [Math.min(90, g.x - gr - 4), side * 6], { sway: 2.2, width: 1.1 });
  // From the green on to the next tee.
  if (nextTee && Number.isFinite(nextTee[0])) {
    const from = edgeToward(nextTee[0], nextTee[1]);
    const d = Math.hypot(nextTee[0] - from[0], nextTee[1] - from[1]);
    const to = d > 45 ? [from[0] + ((nextTee[0] - from[0]) / d) * 45, from[1] + ((nextTee[1] - from[1]) / d) * 45] : nextTee;
    add(from, to, { width: 1 });
  }
  // The cart path's ends: to the green (players walk on from where the cart
  // stops) and to the tee.
  for (const p of (L.paths ?? []).filter(validPath)) {
    const pts = pathLine(p).pts;
    for (const end of [pts[0], pts[pts.length - 1]]) {
      const dGreen = Math.hypot(end[0] - g.x, end[1] - g.z) - gr;
      if (dGreen < 45) add(end, edgeToward(end[0], end[1]), { width: 0.9 });
      if (Math.hypot(end[0], end[1]) < 40) add(end, [3, 0], { width: 0.9, sway: 0.6 });
    }
  }
  return out;
}

function ringHits(lieAt, x, z, r, lies) {
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    if (lies.includes(lieAt(x + Math.cos(a) * r, z + Math.sin(a) * r))) return true;
  }
  return false;
}

// How wide a cart path's worn verge is along it: a factor for each point
// (1 = the usual width), wider where carts pull on and off - near each end
// - and wandering in between, so the browning isn't one even stripe.
export function vergeProfile(pts, seed = 1) {
  let run = 0;
  const along = pts.map((p, i) => (i === 0 ? 0 : (run += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]))));
  const total = run || 1;
  return along.map((s) => {
    const ends = Math.max(0, 1 - Math.min(s, total - s) / 12);
    return r2(0.7 + 1.1 * wobble(seed, s, 7) + 1.6 * ends * ends);
  });
}

const r2 = (v) => Math.round(v * 100) / 100;

// ---- Divots on the tees -------------------------------------------------------------

// Sand-filled divots in rows across the front of a tee, where irons are
// played from - heavier on a par 3 - and in rows along the range's tee
// strip. Each { x, z, len, w, rot, age }: its middle, how long (along the
// line of play) and wide it is (metres), rot the turn of its long axis off
// the line of play (radians), age 0 fresh sand - 1 grown over. Only where
// the whole divot is on the tee: never in sand, water or on a fringe.
export const DIVOT = { len: [0.12, 0.2], w: [0.05, 0.08] };

// A row of divots from a to b (frame [x, z] points), `every` metres apart
// on average, some gaps.
function divotRow(a, b, every, rand, out) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  let s = rand() * every;
  while (s < len) {
    const t = s / len;
    if (rand() > 0.2) {
      out.push({
        x: a[0] + (b[0] - a[0]) * t + (rand() - 0.5) * 0.35,
        z: a[1] + (b[1] - a[1]) * t + (rand() - 0.5) * 0.12,
        len: DIVOT.len[0] + rand() * (DIVOT.len[1] - DIVOT.len[0]),
        w: DIVOT.w[0] + rand() * (DIVOT.w[1] - DIVOT.w[0]),
        rot: (rand() - 0.5) * 0.5,
        age: rand(),
      });
    }
    s += every * (0.5 + rand());
  }
}

// Whether a divot lies wholly on the tee (its ends and sides).
function onTee(lieAt, d, frameRot = 0) {
  const a = d.rot + frameRot;
  const ex = Math.cos(a) * d.len * 0.6;
  const ez = Math.sin(a) * d.len * 0.6;
  const sx = -ez * (d.w / d.len);
  const sz = ex * (d.w / d.len);
  return [[0, 0], [ex, ez], [-ex, -ez], [sx, sz], [-sx, -sz]].every(([dx, dz]) => lieAt(d.x + dx, d.z + dz) === "tee");
}

// A hole's tee (hole frame: the tee at (0, 0), play down +x): rows across
// its front, from a little behind the teeing spot to a few metres ahead of
// it - four rows on a par 3, two otherwise - and none within 40 cm of the
// teeing spot itself, where the ball sits.
export function teeDivots(lieAt, { seed = 1, par = 4 } = {}) {
  const rand = seeded(seed * 31 + 7);
  const rows = par === 3 ? [-0.9, -0.2, 0.6, 1.5] : [-0.6, 0.7];
  const out = [];
  for (const x of rows) divotRow([x + (rand() - 0.5) * 0.3, -3.5], [x + (rand() - 0.5) * 0.3, 3.5], par === 3 ? 0.32 : 0.55, rand, out);
  return out.filter((d) => Math.hypot(d.x, d.z) > 0.4 && onTee(lieAt, d));
}

// The range's tee strip (world frame, play down -z): rows along it at each
// z in `rows`, from x0 to x1, clear of the mats (skip(x, z) says where
// they lie). Divots' long axes run down the range.
export function stripDivots(lieAt, { seed = 1, x0 = -19, x1 = 19, rows = [-0.9, -1.6, -2.3], skip = () => false } = {}) {
  const rand = seeded(seed * 17 + 3);
  const out = [];
  for (const z of rows) divotRow([x0, z], [x1, z], 0.45, rand, out);
  return out.filter((d) => !skip(d.x, d.z) && onTee(lieAt, d, Math.PI / 2));
}
