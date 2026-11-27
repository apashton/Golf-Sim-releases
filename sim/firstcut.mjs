// The fairway's first cut as it's drawn (course/holebuild.js): a band out
// from the fairway's edge to the mower's line (sim/mowncut.mjs), which runs
// where the lies say the first cut ends. Drawn at its own width
// (sim/course.mjs firstCutWidth), it fell short where the lie runs wider:
// round the curve where it joins the mown grass round the green
// (greenMown - which the green's channel doesn't reach: greenMownReach
// stops at the band), and beside either end of the fairway, where it's as
// wide as at the end itself (fairwayBand). The deep rough's ground showed
// there in a wedge, with the long grass cut off along the mower's line
// beyond it (the owner's picture: Golf Sim Links' 1st, short of the green).
// Pure: no Three.js.

import { makePath, nearest, pointAt, fairwayHalfWidth, fairwayBand, greenMown, firstCutWidth, shapeIn, insideBlob, FRINGE, SURROUND, FIRST_CUT, MOW_JOIN } from "./course.mjs";
import { outwardNormals, roundCorners } from "./bandline.mjs";

// (How far a join between two mown shapes reaches: sim/course.mjs MOW_K.)
const MOW_K = 2 * MOW_JOIN;
// How finely the first cut's outline is laid where it curves, metres.
export const CUT_LAID = 0.5;
// The furthest past its own width it's looked for, metres.
const CUT_MOST = 14;

// How far out from the fairway's edge at (x, z), along (ux, uz), its first
// cut plays (metres), looking from `from` (its own width there): out, or
// in, to the mower's line. It stops at the green's own mown ring (drawn
// with the green), the fairway, and sand and water (drawn over it).
export function firstCutReach(hole, x, z, ux, uz, from, path = makePath(hole.path)) {
  const f = hole.fairway;
  const g = hole.green;
  if (!f) return from;
  // How far into the mown ground d out is (as the mower's line measures
  // it), or null where something else is drawn.
  const mownAt = (d) => {
    const px = x + ux * d;
    const pz = z + uz * d;
    if (g && shapeIn(g, px, pz) + FRINGE + SURROUND.green > 0) return null;
    if (hole.bunkers.some((b) => insideBlob(b, px, pz)) || hole.water.some((w) => insideBlob(w, px, pz))) return null;
    const n = nearest(path, px, pz);
    const side = n.d < 0 ? -1 : 1;
    const half = fairwayHalfWidth(f, n.s, side);
    if (Math.abs(n.d) <= half) return null;
    return greenMown(hole, px, pz, fairwayBand(hole, n.s, Math.abs(n.d), side, half));
  };
  const STEP = 0.25;
  // (Its edge found finely between a look inside, lo, and one past it.)
  const between = (lo, hi) => {
    for (let i = 0; i < 6; i++) {
      const mid = (lo + hi) / 2;
      const m = mownAt(mid);
      if (m === null || m >= 0) lo = mid;
      else hi = mid;
    }
    return lo;
  };
  const here = mownAt(from);
  if (here === null) return from;
  if (here >= 0) {
    // Out, as far as it's mown - under sand or water where it meets them.
    for (let d = from; d < from + CUT_MOST; d += STEP) {
      const m = mownAt(d + STEP);
      if (m === null) return d + STEP;
      if (m < 0) return between(d, d + STEP);
    }
    return from + CUT_MOST;
  }
  // In, to where it's mown.
  for (let d = from; d > STEP; d -= STEP) {
    const m = mownAt(d - STEP);
    if (m === null || m >= 0) return between(d - STEP, d);
  }
  return STEP;
}

// Whether the fairway's first cut at (x, z), s along the line, could curve
// away from its own width: near the green, where it joins its mown grass,
// or beside either end of the fairway (fairwayBand's reach round them).
export function firstCutCurves(hole, x, z, s) {
  const f = hole.fairway;
  const g = hole.green;
  if (g && shapeIn(g, x, z) + FRINGE + SURROUND.green > -3 * MOW_K * (hole.bandScale ?? 1) - FIRST_CUT * 4) return true;
  return !!f && f.to > f.from && Math.min(Math.abs(s - f.from), Math.abs(s - f.to)) < 12 * (f.stretch ?? 1) + 3;
}

// The fairway's outline as it's drawn: each edge every 3 m along the line,
// the left one up and the right one back ([[x, z], ...] in the hole's
// frame; none where the fairway's under 9 m long), and sAt(i): [s along
// the line, side] of each point.
export function fairwayOutline(hole, path = makePath(hole.path)) {
  const f = hole.fairway;
  const left = [];
  const right = [];
  for (let d = f.from; d <= f.to; d += 3) {
    const at = pointAt(path, d);
    // (Each edge its own: a natural line, or moulded by hand.)
    const hl = fairwayHalfWidth(f, d, -1);
    const hr = fairwayHalfWidth(f, d, 1);
    left.push([at.p[0] + at.dir[1] * hl, at.p[1] - at.dir[0] * hl]);
    right.push([at.p[0] - at.dir[1] * hr, at.p[1] + at.dir[0] * hr]);
  }
  const n = left.length;
  const sAt = (i) => (i < n ? [f.from + i * 3, -1] : [f.from + (2 * n - 1 - i) * 3, 1]);
  return { loop: n > 2 ? [...left, ...right.reverse()] : [], sAt };
}

// The first cut's outline along the fairway's (`loop`: [[x, z], ...] in
// the hole's frame, and sAt(i): [s along the line, side] of each of its
// points), as it's drawn: laid every CUT_LAID metres where it curves, its
// sharp outside corners rounded (bandline.mjs roundCorners), and how far
// out from each point it reaches, along its way out as the band lays it
// (outwardNormals): { points, reach }.
export function firstCutBand(hole, loop, sAt, path = makePath(hole.path)) {
  const laid = [];
  const at = [];
  for (let i = 0; i < loop.length; i++) {
    const j = (i + 1) % loop.length;
    const [[x0, z0], [x1, z1]] = [loop[i], loop[j]];
    const [s0, side0] = sAt(i);
    const [s1, side1] = sAt(j);
    const parts = firstCutCurves(hole, x0, z0, s0) || firstCutCurves(hole, x1, z1, s1) ? Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / CUT_LAID)) : 1;
    for (let k = 0; k < parts; k++) {
      const t = k / parts;
      laid.push([x0 + (x1 - x0) * t, z0 + (z1 - z0) * t]);
      // (Across an end, each half the side it's nearer.)
      at.push(side0 === side1 ? [s0 + (s1 - s0) * t, side0] : t < 0.5 ? [s0, side0] : [s1, side1]);
    }
  }
  const [points, from] = roundCorners(laid);
  const ways = outwardNormals(points);
  const reach = points.map(([x, z], i) => firstCutReach(hole, x, z, ...ways[i], firstCutWidth(hole, ...at[from[i]]), path));
  return { points, reach };
}
