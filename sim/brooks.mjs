// Brooks: water drawn as a line (the owner: "add that and maybe other water
// options as an easy line input initially and then manipulate the brook as
// needed... sloping ground into the brook unless hard walls added (one side
// or both, short area or long)").
//
// A brook is drawn in the hole builder as a few dots along where it runs,
// like a cart path, and kept on its water shape as
//   brook: { p: [[x, z], ...], kind, w, banks }
//     p      the dots it was drawn through (hole frame, metres), 2 to 40
//     kind   BROOK_KINDS' index: a brook, a ditch or a stream - how wide,
//            how far below the grass its water lies and how far its banks
//            reach
//     w      how much wider (> 1) or narrower than its kind it's made
//     banks  stretches of either bank built as a wall: [{ side, s: [s0,
//            s1], m }] - side 0 the left looking along it (from its first
//            dot), 1 the right; s0 to s1 how far along it, each a fraction
//            (0 to 1) of its length; m what it's built of (sim/walls.mjs
//            WALLS.water's kinds). Elsewhere the ground slopes into it.
// From that it's made again as any water shape is (brookShape): a narrow
// outline (poly) round a smooth line through its dots, so it plays and is
// drawn as water does - a yellow penalty area, as a burn is - and each
// walled stretch a wall of its own round that outline (walls: sim/walls.mjs).
//
// Its water lies its kind's drop below the grass and, on sloping ground,
// runs downhill with it - never uphill (brookLevels).
//
// Pure: the hole builder, the edits (holeedits.mjs), play and drawing all
// use these.

import { tNear } from "./walls.mjs";

export const BROOK_KINDS = [
  // half: half its width; drop: its water below the grass beside it; bank:
  // how far out from the water's edge its banks slope up to the grass.
  // (A channel, its banks' faces seen from the fairway: half a metre down
  // over two and a half, they sloped no more than 18 degrees, and from a
  // fairway a burn read as a stripe painted on the grass - the owner, 24
  // October 2026: "not sure ... the brooks have been as successful".)
  { id: "brook", word: "Brook", half: 1.4, drop: 0.75, bank: 1.6 },
  { id: "ditch", word: "Ditch", half: 0.75, drop: 0.9, bank: 0.9 },
  { id: "stream", word: "Stream", half: 3, drop: 0.7, bank: 2.6 },
];
// How much wider or narrower than its kind it can be made.
export const BROOK_WIDTH = [0.6, 2];
// How long a brook can be, metres along its line.
export const BROOK_LENGTH = [8, 400];
// Its smooth line is sampled about this often (metres).
const STEP = 1.5;

const r2 = (v) => Math.round(v * 100) / 100;
const r3 = (v) => Math.round(v * 1000) / 1000;
import { clamp } from "./mathutil.mjs";
const fin = (v) => typeof v === "number" && Number.isFinite(v);

const BROOK_REACH = 5000;

// Is a brook's own record well formed? (A course file can be edited by
// hand or damaged: one that isn't is left out.)
export function validBrook(b) {
  if (!b || typeof b !== "object" || !Array.isArray(b.p) || b.p.length < 2 || b.p.length > 40) return false;
  // (Within a few km of the tee, its line not far past the longest brook:
  // a damaged file's brook of a billion metres would be sampled for ever.)
  if (!b.p.every((q) => Array.isArray(q) && q.length >= 2 && fin(q[0]) && fin(q[1]) && Math.abs(q[0]) <= BROOK_REACH && Math.abs(q[1]) <= BROOK_REACH)) return false;
  let raw = 0;
  for (let i = 1; i < b.p.length; i++) raw += Math.hypot(b.p[i][0] - b.p[i - 1][0], b.p[i][1] - b.p[i - 1][1]);
  if (raw > 4 * BROOK_LENGTH[1]) return false;
  if (b.kind != null && !(Number.isInteger(b.kind) && b.kind >= 0 && b.kind < BROOK_KINDS.length)) return false;
  if (b.w != null && !fin(b.w)) return false;
  if (b.banks != null && (!Array.isArray(b.banks) || !b.banks.every(validBank))) return false;
  return true;
}
export function validBank(k) {
  return !!k && (k.side === 0 || k.side === 1) && Array.isArray(k.s) && k.s.length === 2 && k.s.every((t) => fin(t) && t >= 0 && t <= 1) && k.s[1] > k.s[0] && (k.m == null || k.m === 0 || k.m === 1 || k.m === 2);
}

// A brook tidied: its dots to two decimals, its kind and width in range,
// its banks in order with overlaps on the same side joined.
export function cleanBrook(b) {
  const out = { p: b.p.map(([x, z]) => [r2(x), r2(z)]), kind: Number.isInteger(b.kind) ? clamp(b.kind, 0, BROOK_KINDS.length - 1) : 0, w: r2(clamp(fin(b.w) ? b.w : 1, ...BROOK_WIDTH)) };
  const banks = (b.banks ?? []).filter(validBank).map((k) => ({ side: k.side, s: [r3(k.s[0]), r3(k.s[1])], m: k.m ?? 0 }));
  if (banks.length) out.banks = joinBanks(banks);
  return out;
}

// Stretches of wall on the same side that meet or overlap made one (the
// later one's material kept), in order along the brook.
export function joinBanks(banks) {
  const out = [];
  for (const side of [0, 1]) {
    const list = banks.filter((k) => k.side === side).sort((a, b) => a.s[0] - b.s[0]);
    for (const k of list) {
      const last = out[out.length - 1];
      if (last && last.side === side && k.s[0] <= last.s[1] + 1e-6) {
        last.s = [last.s[0], Math.max(last.s[1], k.s[1])];
        last.m = k.m;
      } else out.push({ side, s: [...k.s], m: k.m });
    }
  }
  return out;
}

// ---- Its line ------------------------------------------------------------------------------

// A smooth line through the dots (a Catmull-Rom curve), sampled about every
// STEP metres: { pts, cum, length } - each point, and how far along it is.
const lines = new WeakMap();
export function brookLine(b) {
  let line = lines.get(b);
  if (line) return line;
  const p = b.p;
  const pts = [];
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[Math.max(0, i - 1)];
    const q0 = p[i];
    const q1 = p[i + 1];
    const c = p[Math.min(p.length - 1, i + 2)];
    const n = Math.max(1, Math.ceil(Math.hypot(q1[0] - q0[0], q1[1] - q0[1]) / STEP));
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (u0, u1, u2, u3) => 0.5 * (2 * u1 + (-u0 + u2) * t + (2 * u0 - 5 * u1 + 4 * u2 - u3) * t2 + (-u0 + 3 * u1 - 3 * u2 + u3) * t3);
      pts.push([f(a[0], q0[0], q1[0], c[0]), f(a[1], q0[1], q1[1], c[1])]);
    }
  }
  pts.push([p[p.length - 1][0], p[p.length - 1][1]]);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  line = { pts, cum, length: cum[cum.length - 1] };
  lines.set(b, line);
  return line;
}

// The point `u` of the way along the line (0 to 1), and the way it runs
// there (a unit vector).
export function alongLine(line, u) {
  const d = clamp(u, 0, 1) * line.length;
  let i = 1;
  while (i < line.pts.length - 1 && line.cum[i] < d) i++;
  const [ax, az] = line.pts[i - 1];
  const [bx, bz] = line.pts[i];
  const seg = line.cum[i] - line.cum[i - 1] || 1;
  const k = clamp((d - line.cum[i - 1]) / seg, 0, 1);
  const len = Math.hypot(bx - ax, bz - az) || 1;
  return { p: [ax + (bx - ax) * k, az + (bz - az) * k], dir: [(bx - ax) / len, (bz - az) / len], i: i - 1, k };
}

// The nearest the line comes to (x, z): { d, u, i, k, left } - how far,
// how far along (0 to 1), the piece it's on and how far along that piece,
// and whether it's on the left (side 0) looking along the line.
export function nearestOnLine(line, x, z) {
  let best = { d: Infinity, u: 0, i: 0, k: 0, left: true };
  for (let i = 1; i < line.pts.length; i++) {
    const [ax, az] = line.pts[i - 1];
    const dx = line.pts[i][0] - ax;
    const dz = line.pts[i][1] - az;
    const len2 = dx * dx + dz * dz;
    const k = len2 > 0 ? clamp(((x - ax) * dx + (z - az) * dz) / len2, 0, 1) : 0;
    const d = Math.hypot(ax + dx * k - x, az + dz * k - z);
    if (d < best.d) best = { d, u: line.length ? (line.cum[i - 1] + k * Math.sqrt(len2)) / line.length : 0, i: i - 1, k, left: dx * (z - az) - dz * (x - ax) >= 0 };
  }
  return best;
}

// Across a brook at (x, z), hole frame: { lx, lz, s } - the way to its
// left bank (side 0, a unit vector) and how far towards it (x, z) is from
// its middle line (metres; negative towards its right). Its water's drawn
// with them (course/holescenery.js drawBrook): which way, and how far on,
// its far bank is, mirrored along its far side (look/sandwater.js).
export function brookAcross(b, x, z) {
  const line = brookLine(b);
  const q = nearestOnLine(line, x, z);
  const [ax, az] = line.pts[q.i];
  const [bx, bz] = line.pts[Math.min(line.pts.length - 1, q.i + 1)];
  const len = Math.hypot(bx - ax, bz - az) || 1;
  return { lx: -(bz - az) / len, lz: (bx - ax) / len, s: q.left ? q.d : -q.d };
}

// ---- Its water shape -------------------------------------------------------------------

export const kindOf = (b) => BROOK_KINDS[b?.kind ?? 0] ?? BROOK_KINDS[0];
// Half its width, metres.
export const brookHalf = (b) => kindOf(b).half * clamp(b?.w ?? 1, ...BROOK_WIDTH);
// How high its banks stand over its water, the grass on them included
// (metres): what its water mirrors along its far side, seen low
// (look/sandwater.js waterMaterial's bank).
export const brookBankHeight = (b) => kindOf(b).drop + 0.1;
// How much narrower than a pond's its water's muddy margin and shallows
// are drawn (look/sandwater.js waterMaterial's edgeScale), from half its
// width: a brook's; and a links burn's (sim/course.mjs burnFor - its rx,
// burn: true), deep water down its middle - drawn as a pond's it was
// olive shallows from bank to bank, and read from above as a dark green
// streak across the fairway.
export const waterEdgeScale = (half, burn = false) => (burn ? Math.min(5, Math.max(1, 6 / (half || 6))) : Math.min(4, Math.max(1, 4 / (half || 4))));

// A brook's water shape: its outline round its line - half its width out
// either side, wandering a little wider and narrower as a real one does -
// with its middle, size and way for everything that finds water by those,
// and a wall for each walled stretch of bank. The side-0 bank is the
// outline's first half, in order along the brook; the side-1 bank comes
// back along its second half.
export function brookShape(b) {
  const brook = cleanBrook(b);
  const line = brookLine(brook);
  const half = brookHalf(brook);
  const n = line.pts.length;
  // (Its width's wander from where its dots are, so it's the same each time.)
  const phase = (Math.abs(brook.p[0][0] * 7.1 + brook.p[0][1] * 3.3) % 6.28) || 1;
  const sides = [[], []];
  for (let i = 0; i < n; i++) {
    const [px, pz] = line.pts[Math.max(0, i - 1)];
    const [nx, nz] = line.pts[Math.min(n - 1, i + 1)];
    const len = Math.hypot(nx - px, nz - pz) || 1;
    // Left (side 0) is (-dz, dx) of the way it runs.
    const lx = -(nz - pz) / len;
    const lz = (nx - px) / len;
    const w = half * (0.9 + 0.1 * Math.sin(line.cum[i] * 0.21 + phase) + 0.05 * Math.sin(line.cum[i] * 0.53 + 2 * phase));
    const [x, z] = line.pts[i];
    sides[0].push([r2(x + lx * w), r2(z + lz * w)]);
    sides[1].push([r2(x - lx * w), r2(z - lz * w)]);
  }
  const poly = [...sides[0], ...sides[1].slice().reverse()];
  const mid = alongLine(line, 0.5);
  let x0 = Infinity;
  let z0 = Infinity;
  let x1 = -Infinity;
  let z1 = -Infinity;
  for (const [x, z] of poly) {
    x0 = Math.min(x0, x);
    z0 = Math.min(z0, z);
    x1 = Math.max(x1, x);
    z1 = Math.max(z1, z);
  }
  const ends = [line.pts[0], line.pts[n - 1]];
  const shape = {
    poly,
    x: r2(mid.p[0]),
    z: r2(mid.p[1]),
    rx: r2(half),
    rz: r2(Math.max(half, line.length / 2)),
    rot: r3(Math.atan2(ends[1][1] - ends[0][1], ends[1][0] - ends[0][0])),
    burn: 1,
    penalty: "yellow",
    brook,
  };
  const walls = (brook.banks ?? []).map((k) => bankWall(shape, line, half, k)).filter(Boolean);
  if (walls.length) shape.walls = walls;
  return shape;
}

// A walled stretch of bank as a wall round the shape's outline
// (sim/walls.mjs): its ends found where its bank is that far along, its
// height the brook's drop. Side 1's outline runs back along the brook, so
// its ends swap.
function bankWall(shape, line, half, k) {
  const at = (u) => {
    const q = alongLine(line, u);
    const [lx, lz] = [-q.dir[1], q.dir[0]];
    const s = k.side === 0 ? 1 : -1;
    return tNear(shape, q.p[0] + lx * half * s, q.p[1] + lz * half * s);
  };
  const a = k.side === 0 ? [at(k.s[0]), at(k.s[1])] : [at(k.s[1]), at(k.s[0])];
  if (Math.abs(a[1] - a[0]) < 1e-4) return null;
  return { a: a.map(r3), h: kindOf(shape.brook).drop, m: k.m ?? 0 };
}

// ---- A links burn -----------------------------------------------------------------------

// A links hole's burn (sim/course.mjs burnFor) is a brook: lying below the
// grass in a channel of its own, its banks worn by its water, the fairway
// mown down to its edge (it was a flat ribbon of water laid on the grass).
// One saved before then - only its outline (poly) round its winding line,
// its two sides each half of it - made one: a brook through the middle of
// its outline, a dozen dots along it, as wide (the hole editor's "make the
// burn a brook" too).
export function burnBrook(w) {
  const n = Math.floor(w.poly.length / 2);
  const mid = Array.from({ length: n }, (_, i) => [r2((w.poly[i][0] + w.poly[2 * n - 1 - i][0]) / 2), r2((w.poly[i][1] + w.poly[2 * n - 1 - i][1]) / 2)]);
  const step = Math.max(1, Math.ceil(n / 10));
  const dots = mid.filter((_, i) => i % step === 0);
  if (dots[dots.length - 1] !== mid[n - 1]) dots.push(mid[n - 1]);
  return { p: dots, kind: 0, w: r2(clamp((w.rx ?? BROOK_KINDS[0].half) / BROOK_KINDS[0].half, ...BROOK_WIDTH)) };
}
// A hole's water with any burn saved before burns were brooks made one.
export function burnsAsBrooks(water) {
  if (!water?.some((w) => w?.burn && !w.brook && w.poly?.length >= 8)) return water;
  return water.map((w) => (w?.burn && !w.brook && w.poly?.length >= 8 ? brookShape(burnBrook(w)) : w));
}

// ---- Its water's level -----------------------------------------------------------------

// The level of its water at each point of its line, from the ground there
// (groundAt(x, z), or 0 on flat ground): its drop below the grass, and
// running downhill all the way from its higher end - never rising, so a
// dip in the ground it crosses doesn't make it climb out again - smoothed
// so it falls gently. { levels, at(x, z) } - at: the level by the line
// nearest (x, z).
export function brookLevels(b, groundAt = null) {
  const line = brookLine(b.brook ?? b);
  const drop = kindOf(b.brook ?? b).drop;
  const g = line.pts.map(([x, z]) => (groundAt ? groundAt(x, z) : 0) - drop);
  // Downhill from whichever end is higher.
  const down = g[0] >= g[g.length - 1];
  const order = down ? g.map((_, i) => i) : g.map((_, i) => g.length - 1 - i);
  const lv = g.slice();
  let low = Infinity;
  for (const i of order) {
    low = Math.min(low, g[i]);
    lv[i] = low;
  }
  // (Smoothed a few times, still never rising.)
  for (let pass = 0; pass < 3; pass++) {
    const s = lv.slice();
    for (let i = 1; i < lv.length - 1; i++) s[i] = Math.min(lv[i], (lv[i - 1] + 2 * lv[i] + lv[i + 1]) / 4);
    lv.splice(0, lv.length, ...s);
  }
  const at = (x, z) => {
    const q = nearestOnLine(line, x, z);
    const a = lv[q.i];
    const c = lv[Math.min(lv.length - 1, q.i + 1)];
    return a + (c - a) * q.k;
  };
  return { levels: lv, at, low: Math.min(...lv) };
}

// Its banks, worn by the water (the owner, 23 October 2026: water edges
// "often smooth due to water erosion"): cut back steep and short on the
// outside of a bend, where the flow wears into it, a lip of turf over a
// face of earth; shelving long and gentle on the inside, where it drops
// its silt, the grass nearly down to the water; and on the straight
// wandering between, a stretch at a time. How far out each reaches is
// its kind's bank times `wide` (gentlest) to `narrow` (steepest); turf:
// how far over the water the grass comes down to, gentlest to steepest
// (as a pond's: sim/walls.mjs SHORE), and how far out from the water at
// most (margin: the bare ground a gentle bank shows is a muddy margin). `bend`: the radius (metres) of a
// bend that wears it the most.
export const BROOK_BANKS = { wide: 1.4, narrow: 0.6, turf: [0.12, 0.3], margin: [0.12, 0.5], bend: 14 };
// How far out from its water its banks can reach at most, metres.
export const brookBankReach = (b) => kindOf(b).bank * BROOK_BANKS.wide;

// How the line turns at each of its points (1 / metres, + to the left),
// smoothed over a few metres, so a bend's outside and inside are known.
const turns = new WeakMap();
function lineTurns(line) {
  let t = turns.get(line);
  if (t) return t;
  const n = line.pts.length;
  const raw = line.pts.map((_, i) => {
    if (i === 0 || i === n - 1) return 0;
    const [ax, az] = line.pts[i - 1];
    const [bx, bz] = line.pts[i];
    const [cx, cz] = line.pts[i + 1];
    const h0 = Math.atan2(bz - az, bx - ax);
    const h1 = Math.atan2(cz - bz, cx - bx);
    let dh = h1 - h0;
    while (dh > Math.PI) dh -= 2 * Math.PI;
    while (dh < -Math.PI) dh += 2 * Math.PI;
    return dh / Math.max(0.1, (line.cum[i + 1] - line.cum[i - 1]) / 2);
  });
  t = raw.map((_, i) => {
    let sum = 0;
    let w = 0;
    for (let j = Math.max(0, i - 3); j <= Math.min(n - 1, i + 3); j++) {
      const k = 4 - Math.abs(j - i);
      sum += raw[j] * k;
      w += k;
    }
    return sum / w;
  });
  turns.set(line, t);
  return t;
}

// How much room a brook's banks have, side by side with what's beside
// them (`others`: shapes - a hole's bunkers): along each side, how far out
// from its water its bank may reach before it would run into one (half a
// metre short of it), eased along the brook. A burn saved before burns
// were brooks has its bunkers where its flat water left room for them.
// (i, left) => metres; null with nothing beside it.
const rooms = new WeakMap();
export function brookRoom(shape, others, insideBlob) {
  const near = (others ?? []).filter(Boolean);
  if (!near.length) return null;
  const kept = rooms.get(shape);
  if (kept && kept.others.length === near.length && kept.others.every((o, i) => o === near[i])) return kept.at;
  const line = brookLine(shape.brook);
  const half = brookHalf(shape.brook);
  const most = brookBankReach(shape.brook);
  const n = line.pts.length;
  const sides = [new Float32Array(n).fill(most), new Float32Array(n).fill(most)];
  for (let i = 0; i < n; i++) {
    const [px, pz] = line.pts[Math.max(0, i - 1)];
    const [nx, nz] = line.pts[Math.min(n - 1, i + 1)];
    const len = Math.hypot(nx - px, nz - pz) || 1;
    const [lx, lz] = [-(nz - pz) / len, (nx - px) / len];
    for (const [k, sgn] of [[0, 1], [1, -1]]) {
      for (let t = 0; t <= most; t += 0.25) {
        const x = line.pts[i][0] + lx * sgn * (half + t);
        const z = line.pts[i][1] + lz * sgn * (half + t);
        if (near.some((o) => insideBlob(o, x, z, 0.5))) {
          sides[k][i] = Math.max(0.4, t);
          break;
        }
      }
    }
  }
  // Eased along it: the least within a few metres either way, then
  // smoothed, so the bank narrows gently where it must.
  for (const room of sides) {
    const least = room.map((_, i) => Math.min(...room.slice(Math.max(0, i - 2), i + 3)));
    for (let i = 0; i < n; i++) room[i] = least.slice(Math.max(0, i - 2), i + 3).reduce((a, v) => a + v, 0) / least.slice(Math.max(0, i - 2), i + 3).length;
    for (let i = 0; i < n; i++) room[i] = Math.min(room[i], ...least.slice(Math.max(0, i - 1), i + 2).map((v) => v + 0.6));
  }
  const at = (i, left) => sides[left ? 0 : 1][i];
  rooms.set(shape, { others: near, at });
  return at;
}

// A bank's shape at the nearest point q (nearestOnLine) of a brook's line:
// { bank, steep, turf } - how far out it reaches (metres), how steep it is
// (0 shelving, 1 cut back), and how far over the water its grass comes
// down to (metres). Pure, the same each time for the same brook. room:
// brookRoom's (or null).
export function brookBankAt(b, line, q, room = null) {
  const kind = kindOf(b);
  const t = lineTurns(line);
  const turn = t[q.i] + ((t[Math.min(t.length - 1, q.i + 1)] ?? t[q.i]) - t[q.i]) * q.k;
  // + on a bend's outside, - on its inside; and a wander of its own along
  // each side (from where its first dot is, so it's the same each time).
  const outside = (q.left ? -1 : 1) * Math.max(-1, Math.min(1, turn * BROOK_BANKS.bend));
  const phase = (Math.abs(b.p[0][0] * 3.7 + b.p[0][1] * 5.3) % 6.28) + (q.left ? 0 : 2.1);
  const s = q.u * line.length;
  const wander = 0.6 * Math.sin(s * 0.11 + phase) + 0.4 * Math.sin(s * 0.29 + 1.7 * phase);
  const steep = Math.max(0, Math.min(1, 0.3 + 0.6 * outside + 0.35 * wander));
  let bank = kind.bank * (BROOK_BANKS.wide + (BROOK_BANKS.narrow - BROOK_BANKS.wide) * steep);
  if (room) {
    const j = Math.min(line.pts.length - 1, q.i + 1);
    bank = Math.min(bank, room(q.i, q.left) + (room(j, q.left) - room(q.i, q.left)) * q.k);
  }
  return {
    bank,
    steep,
    turf: BROOK_BANKS.turf[0] + (BROOK_BANKS.turf[1] - BROOK_BANKS.turf[0]) * steep,
  };
}

// Where a brook's banks give way from bare earth and silt to the turf, for
// drawing them (course/holescenery.js drawBrook): along each side, every
// `step` metres, { x, z, nx, nz, s, to } - the point on the water's edge
// (half its width out), the way out from the water, how far along, and how
// far out the earth reaches before the grass (metres; its edge bitten
// into here and there - and on a gentle bank only a muddy margin, `margin`
// metres at most, the grass nearly down to the water) - in runs, a run broken where a wall stands
// instead or the bank's gone (a culvert under a path). heightAt(x, z):
// the ground as dug; levelAt(x, z): its water's level (both hole frame).
export function brookBankLines(shape, { heightAt, levelAt, step = 0.5, wallsAt = () => 0, room = null }) {
  const b = shape.brook;
  const line = brookLine(b);
  const half = brookHalf(b);
  const runs = [];
  const n = Math.max(2, Math.ceil(line.length / step) + 1);
  for (const left of [true, false]) {
    let run = [];
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const at = alongLine(line, u);
      const sgn = left ? 1 : -1;
      const nx = -at.dir[1] * sgn;
      const nz = at.dir[0] * sgn;
      const x = at.p[0] + nx * half;
      const z = at.p[1] + nz * half;
      const lv = levelAt(x, z);
      const bk = brookBankAt(b, line, { i: at.i, k: at.k, u, left }, room);
      const above = (o) => heightAt(x + nx * o, z + nz * o) - lv;
      // (No bank here: a wall, or the ground left as it was.)
      if (wallsAt(x + nx * 0.2, z + nz * 0.2) > 0.5 || above(0.05) > 0.3) {
        if (run.length > 1) runs.push(run);
        run = [];
        continue;
      }
      let lo = 0;
      let hi = bk.bank;
      if (above(hi) <= bk.turf) lo = hi;
      else
        // (To within a bank's 256th - under a centimetre.)
        for (let k = 0; k < 8; k++) {
          const mid = (lo + hi) / 2;
          if (above(mid) > bk.turf) hi = mid;
          else lo = mid;
        }
      const s = u * line.length;
      const bite = 1 + 0.2 * Math.sin(s * 2.3 + (left ? 0 : 1.3)) + 0.12 * Math.sin(s * 5.9 + 0.7) - 0.1 * Math.max(0, Math.sin(s * 0.9 + 2.1)) ** 4;
      const most = BROOK_BANKS.margin[0] + (BROOK_BANKS.margin[1] - BROOK_BANKS.margin[0]) * bk.steep;
      run.push({ x, z, nx, nz, s, to: Math.max(0.05, Math.min(lo, most) * bite) });
    }
    if (run.length > 1) runs.push(run);
  }
  return runs;
}

// The ground round a brook, as a change to the height there (metres; 0
// where it's left alone): its banks sloping down from the grass to the
// water's edge, the bed under the water below its level, and along a
// walled stretch of bank the grass kept level right up to the edge, where
// it drops straight down. level: brookLevels(...).at; groundAt: the ground
// before (0 on flat ground); wallsAt(x, z): how much of a wall the edge
// nearest (x, z) is (0 to 1).
export function brookGround(shape, { level, groundAt = null, wallsAt = () => 0, room = null }) {
  const line = brookLine(shape.brook);
  const half = brookHalf(shape.brook);
  const reach = half + brookBankReach(shape.brook) + 0.5;
  return (x, z) => {
    const q = nearestOnLine(line, x, z);
    if (q.d >= reach) return 0;
    const h = groundAt ? groundAt(x, z) : 0;
    const lv = level(x, z);
    const wn = wallsAt(x, z);
    // How far out from the water's edge (negative: in the water).
    const out = q.d - half;
    // Off the ends of its line: eased out, so it doesn't stop at a cliff.
    const endFade = q.u <= 0 || q.u >= 1 ? 1 - Math.min(1, q.d / reach) : 1;
    let want;
    if (out >= 0) {
      // The bank: from the water's edge (a touch above the water) up to the
      // grass - shelving gently out of the water, or cut back, rising
      // steeply from it and rolling over to the grass (brookBankAt); along
      // a wall, the grass right to the edge.
      const top = h;
      const edge = lv + 0.08;
      const bk = brookBankAt(shape.brook, line, q, room);
      const t = Math.min(1, out / bk.bank);
      const shelf = t * t * (3 - 2 * t);
      const cut = 1 - (1 - t) ** 2.6;
      const slope = edge + (top - edge) * (shelf + (cut - shelf) * bk.steep);
      want = slope + (top - slope) * wn;
      if (want >= h) return 0;
    } else {
      // The bed: down from the edge to the middle, below the water.
      const deep = Math.min(1, -out / Math.max(0.3, half * 0.6));
      const bed = lv - 0.15 - 0.35 * deep;
      want = Math.min(bed, h);
    }
    return (want - h) * endFade;
  };
}

// The ground a brook has shaped - its water and its banks out to where
// they meet the grass - as a shape of its own (an outline, `poly`, and its
// middle and size): what's laid flat over the ground (the fairway, the
// rough's bands) stops at its edge, and the ground itself shows its banks.
const beds = new WeakMap();
export function brookBed(shape) {
  let bed = beds.get(shape);
  if (bed) return bed;
  const line = brookLine(shape.brook);
  const reach = brookHalf(shape.brook) + brookBankReach(shape.brook);
  const n = line.pts.length;
  const sides = [[], []];
  for (let i = 0; i < n; i++) {
    const [px, pz] = line.pts[Math.max(0, i - 1)];
    const [nx, nz] = line.pts[Math.min(n - 1, i + 1)];
    const len = Math.hypot(nx - px, nz - pz) || 1;
    const lx = -(nz - pz) / len;
    const lz = (nx - px) / len;
    // (Rounded off past its ends.)
    const [x, z] = line.pts[i];
    const back = i === 0 ? -1 : i === n - 1 ? 1 : 0;
    const ox = back ? (back * (nx - px)) / len : 0;
    const oz = back ? (back * (nz - pz)) / len : 0;
    sides[0].push([x + lx * reach + ox * reach * 0.5, z + lz * reach + oz * reach * 0.5]);
    sides[1].push([x - lx * reach + ox * reach * 0.5, z - lz * reach + oz * reach * 0.5]);
  }
  bed = { poly: [...sides[0], ...sides[1].reverse()], x: shape.x, z: shape.z, rx: reach, rz: shape.rz + reach, rot: shape.rot };
  beds.set(shape, bed);
  return bed;
}

// The nearest brook to (x, z) within `reach` metres of its line, by its
// place in `list` (water shapes): -1 for none.
export function brookAt(list, x, z, reach = 3) {
  let best = -1;
  let bestD = reach;
  list.forEach((w, i) => {
    if (!w?.brook || !validBrook(w.brook)) return;
    const d = nearestOnLine(brookLine(w.brook), x, z).d - brookHalf(w.brook);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}
