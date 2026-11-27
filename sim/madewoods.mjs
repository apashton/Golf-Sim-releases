// A designed hole's woods as the course maker's second round makes them
// (sim/maker.mjs; the owner, 23 November 2026: "tree origination layouts
// etc to improve what we had as a base"), as Saltpine Links' were planted
// (tools/madeland/land.mjs): not two or three rows down each side - an
// avenue - but a wood. A jittered grid over the band past the hole's tree
// line, kept where a clumping noise says (MADE_WOODS.clump): sparse at the
// wood's front and thickening back into it, its front edge ragged -
// standing back where the clumps thin, and open in clearings where they
// fail - and wrapping round behind the green. The older, bigger trees
// stand at the back, as big as the deep woods past them
// (sim/deepwoods.mjs), so the one runs into the other.
// Out in the rough, a few specimen trees, open-grown and broad (their kind
// a specimen's as they grow: sim/treeroles.mjs), and a copse or two in
// front of the wood where it stands back, each copse's disc kept
// (layout.copses) so it grows as one kind.
//
// Only for a hole the second round made (layout.maker: course.mjs
// dressHole); the tree line itself - the "trees" lie and how hard the hole
// plays - is the hole's as before. Each from a randomness of its own, so
// nothing else on the hole moves. Pure; positions in the hole's frame.

import { pointAt, nearest, insideBlob, fairwayHalfWidth, seeded } from "./course.mjs";
import { hash2, valueNoise } from "./country.mjs";
import { clamp, smoothstep } from "./mathutil.mjs";

export const MADE_WOODS = {
  // The grid's cell (metres), by the hole's trees option; each spot
  // jittered this share of a cell either way.
  grid: { light: 12.5, normal: 7.6, heavy: 6.6 },
  jitter: 0.36,
  // Not before this far down the hole (the tee's own ground).
  from: 25,
  // The wood's front: this far past the tree line where its clumps are
  // thickest, standing back up to `ragged` more where they thin.
  front: 3,
  ragged: 14,
  // Its back: this far past the tree line, give or take `wander`.
  depth: { light: 22, normal: 34, heavy: 42 },
  wander: 7,
  // The clumps: a noise this many metres a feature; none below `least`,
  // full from `least` + 1/3 up (Saltpine's LAND.trees) - each hole's
  // noise moved to average `mid` over its band, so every hole's wood is
  // as clumped, wherever its clumps fall.
  clump: 70,
  least: 0.3,
  mid: 0.55,
  // The share of spots kept at the wood's front, rising to all at its back.
  thin: 0.3,
  // Sizes (scale): at the front, as before; at the back, older and bigger,
  // as the deep woods' (DEEP_WOODS.size).
  size: { front: [0.85, 1.5], back: [1.15, 1.8] },
  // None within this of the green's edge; past it, only behind it, within
  // this angle (radians) of straight on.
  green: 26,
  behind: 1.15,
  // How thick a wood is on the whole: this share of its band's spots,
  // wherever its clumps fell - its noise scaled by no more than `even`.
  fill: 0.38,
  even: [0.75, 1.4],
};

// The lone trees out in the rough: how many, where (at least `off` off
// the fairway's edge, and their crown's guessed reach, `reach` a unit of
// size and spread, clear of it; not within `green` of the green's middle),
// how big and how broad (open-grown).
export const SPECIMENS = { count: [2, 5], off: 6, reach: 6, green: 34, size: [1.2, 1.6], width: 1.2 };

// The copses: how many, how many trees each, how wide (radius, metres),
// where (straddling the tree line, `at` from it, where the wood stands
// back), their trees' sizes; none of a copse's trees within `off` of the
// fairway's edge.
export const COPSES = { count: [1, 2], trees: [3, 6], r: 6.5, at: [-4, 5], size: [1.0, 1.45], off: 14, green: 40, tries: 6 };

const r2 = (v) => Math.round(v * 100) / 100;

// The hole's woods: { trees: [[x, z, size, kind?, width?]...], copses:
// [[x, z, r]...] }. hole: its layout so far (path, treeLine, fairway,
// green, water, bunkers); spec: its seed and options; path: makePath of
// its line.
export function madeWoods(hole, spec, { path }) {
  const o = spec.options ?? {};
  const choice = MADE_WOODS.grid[o.trees] ? o.trees : "normal";
  const cell = MADE_WOODS.grid[choice];
  const depth = MADE_WOODS.depth[choice];
  const seed = ((spec.seed ^ 0x7ee5a) >>> 0) % 100003;
  const { treeLine, green } = hole;
  const L = path.length;
  const trees = [];
  // The box round the band.
  const reach = treeLine + depth + MADE_WOODS.wander + cell;
  let x0 = Infinity;
  let x1 = -Infinity;
  let z0 = Infinity;
  let z1 = -Infinity;
  for (const [x, z] of hole.path) {
    x0 = Math.min(x0, x - reach);
    x1 = Math.max(x1, x + reach);
    z0 = Math.min(z0, z - reach);
    z1 = Math.max(z1, z + reach);
  }
  const wet = (x, z, grow) => (hole.water ?? []).some((w) => insideBlob(w, x, z, grow));
  // Past the green, only behind it (within MADE_WOODS.behind of straight on).
  const end = pointAt(path, L);
  // Every spot of the band, and how likely a tree is there.
  const spots = [];
  let sum = 0;
  let all = 0;
  for (let i = Math.floor(x0 / cell); i <= Math.ceil(x1 / cell); i++) {
    for (let j = Math.floor(z0 / cell); j <= Math.ceil(z1 / cell); j++) {
      const h = (k) => hash2(i * 7 + k, j * 13 - k, seed);
      const x = (i + 0.5 + (h(1) - 0.5) * 2 * MADE_WOODS.jitter) * cell;
      const z = (j + 0.5 + (h(2) - 0.5) * 2 * MADE_WOODS.jitter) * cell;
      const n = nearest(path, x, z);
      if (n.s < MADE_WOODS.from) continue;
      // How far past the tree line (round the green's end, from the end
      // of the line: the wood wraps behind it).
      const u = Math.abs(n.d) - treeLine;
      if (u < MADE_WOODS.front) continue;
      const back = depth + (valueNoise(x, z, 90, seed ^ 0xbac4) - 0.5) * 2 * MADE_WOODS.wander;
      if (u > back) continue;
      if (n.s >= L - 0.01) {
        const dx = x - end.p[0];
        const dz = z - end.p[1];
        if ((dx * end.dir[0] + dz * end.dir[1]) / (Math.hypot(dx, dz) || 1) < Math.cos(MADE_WOODS.behind)) continue;
      }
      spots.push({ x, z, u, back, clump: valueNoise(x, z, MADE_WOODS.clump, seed ^ 0xc1a3), h });
    }
  }
  // The clumps as thick on every hole on the whole (their noise moved to
  // MADE_WOODS.mid on average over the band), wherever they fall.
  const shift = spots.length ? MADE_WOODS.mid - spots.reduce((a, q) => a + q.clump, 0) / spots.length : 0;
  for (const q of spots) {
    const clump = q.clump + shift;
    q.deep = smoothstep(MADE_WOODS.front, q.back, q.u);
    // Its front edge stands back where the clumps thin; sparse at the
    // front, thickening back.
    q.p = q.u < MADE_WOODS.front + MADE_WOODS.ragged * (1 - clump) ? 0 : clamp((clump - MADE_WOODS.least) * 3, 0, 1) * (MADE_WOODS.thin + (1 - MADE_WOODS.thin) * q.deep);
    sum += q.p;
    all++;
  }
  // As thick as a wood of this kind is on the whole (MADE_WOODS.fill of
  // its band, give or take MADE_WOODS.even), wherever its clumps fell.
  const mean = sum / Math.max(1, all);
  const k = clamp(MADE_WOODS.fill / Math.max(1e-6, mean), MADE_WOODS.even[0], MADE_WOODS.even[1]);
  for (const { x, z, p, deep, h } of spots) {
    if (!(p > 0) || h(3) >= p * k) continue;
    if (wet(x, z, 3) || (green && insideBlob(green, x, z, MADE_WOODS.green))) continue;
    const lo = MADE_WOODS.size.front[0] + (MADE_WOODS.size.back[0] - MADE_WOODS.size.front[0]) * deep;
    const hi = MADE_WOODS.size.front[1] + (MADE_WOODS.size.back[1] - MADE_WOODS.size.front[1]) * deep;
    trees.push([r2(x), r2(z), r2(lo + h(4) * (hi - lo))]);
  }
  const clumpAt = (x, z) => valueNoise(x, z, MADE_WOODS.clump, seed ^ 0xc1a3);
  const sand = (x, z, grow) => (hole.bunkers ?? []).some((b) => insideBlob(b, x, z, grow));
  const at = (s, sign, off) => {
    const q = pointAt(path, s);
    return [q.p[0] - q.dir[1] * sign * off, q.p[1] + q.dir[0] * sign * off];
  };
  // Specimens: lone trees in the rough, broad and open-grown.
  const rs = seeded((spec.seed ^ 0x7ee5b) >>> 0 || 1);
  const lone = SPECIMENS.count[0] + Math.floor(rs() * (SPECIMENS.count[1] - SPECIMENS.count[0] + 1));
  for (let k = 0; k < lone; k++) {
    const s = 60 + rs() * Math.max(0, L - 110);
    const sign = rs() < 0.5 ? -1 : 1;
    const size = SPECIMENS.size[0] + rs() * (SPECIMENS.size[1] - SPECIMENS.size[0]);
    const half = fairwayHalfWidth(hole.fairway, s, sign);
    const near = Math.max(half + SPECIMENS.off + SPECIMENS.reach * size * SPECIMENS.width, treeLine - 16);
    const off = near + rs() * Math.max(0, treeLine - 3 - near);
    const [x, z] = at(s, sign, off);
    if (off > treeLine - 2 || (green && Math.hypot(x - green.x, z - green.z) < SPECIMENS.green)) continue;
    if (wet(x, z, 4) || sand(x, z, 5)) continue;
    trees.push([r2(x), r2(z), r2(size), null, SPECIMENS.width]);
  }
  // Copses: a few trees together in front of the wood, where it stands
  // back (the lowest of a few tries of where its clumps thin).
  const rc = seeded((spec.seed ^ 0x7ee5c) >>> 0 || 1);
  const copses = [];
  const many = COPSES.count[0] + Math.floor(rc() * (COPSES.count[1] - COPSES.count[0] + 1));
  for (let c = 0; c < many; c++) {
    let best = null;
    for (let t = 0; t < COPSES.tries; t++) {
      const s = 40 + rc() * Math.max(0, L - 80);
      const sign = rc() < 0.5 ? -1 : 1;
      const off = treeLine + COPSES.at[0] + rc() * (COPSES.at[1] - COPSES.at[0]);
      const [x, z] = at(s, sign, off);
      const thin = clumpAt(x, z);
      if (!best || thin < best.thin) best = { s, sign, off, x, z, thin };
    }
    const { x: cx, z: cz } = best;
    if ((green && Math.hypot(cx - green.x, cz - green.z) < COPSES.green) || copses.some(([px, pz]) => Math.hypot(px - cx, pz - cz) < COPSES.r * 4)) continue;
    const n = COPSES.trees[0] + Math.floor(rc() * (COPSES.trees[1] - COPSES.trees[0] + 1));
    let kept = 0;
    for (let k = 0; k < n; k++) {
      const a = rc() * Math.PI * 2;
      const d = Math.sqrt(rc()) * COPSES.r;
      const x = cx + Math.cos(a) * d;
      const z = cz + Math.sin(a) * d;
      const size = COPSES.size[0] + rc() * (COPSES.size[1] - COPSES.size[0]);
      const q = nearest(path, x, z);
      const half = fairwayHalfWidth(hole.fairway, Math.max(0, Math.min(L, q.s)), q.d < 0 ? -1 : 1);
      if (Math.abs(q.d) < half + COPSES.off || wet(x, z, 4) || sand(x, z, 5)) continue;
      trees.push([r2(x), r2(z), r2(size)]);
      kept++;
    }
    if (kept) copses.push([r2(cx), r2(cz), r2(COPSES.r + 2)]);
  }
  return { trees, copses };
}
