// A real green finer than the hole's ground: its surface from LiDAR at
// half a metre, laid over the 1 m ground the hole was rebuilt on (the
// owner, 21 November 2026, of the real links course: "the greens are more
// technical than 1m").
//
// A mapped hole's ground is a height every metre, kept to the centimetre
// (server/lidar.mjs, sim/terrain.mjs packGrid) - fine for a fairway, but a
// green's own small ridges and hollows are finer than that, and a
// centimetre step from one metre to the next is a 1% slope that isn't
// there. Where the LiDAR was flown at half a metre, two surveys of the
// same green agree on that fine detail (it's the green, not noise): so the
// green is given it, as the green shaped by hand is - a grid of half-metre
// squares, to the millimetre, of how far the fine surface stands from the
// ground under it (sim/greensculpt.mjs, the "gh" edit). Played, it takes
// the ground's place on the green and its fringe and eases back into the
// 1 m ground round it.
//
// Two surveys of the same ground are stacked (stackSurveys): the second
// set level with the first where both have it, and the two averaged - what
// they share is kept and each one's noise halved. Then smoothed a little
// (smoothGrid): by half a metre for one survey, a third for two, which is
// what each survey says best matches the other.
//
// And the flag: a real hole is cut where a ball will stop by it, so the
// flag is moved to the nearest spot to where it was wanted that's gentle
// enough (puttableSpot).
//
// Pure: tools/realcourse.mjs fetches and samples the LiDAR; these work on
// the numbers.

import { CELL, FRINGE, editFromGrid, groundOf, sculptBox } from "./greensculpt.mjs";
import { insidePolygon, distanceToEdge, holeFrame } from "./terrain.mjs";

export const FINE_GREEN = {
  // Squares sampled past the stored grid each way, for the smoothing.
  margin: 4,
  // How far it's smoothed (metres): one survey, two stacked.
  sigma: { one: 0.5, two: 0.35 },
  // The share of the green the LiDAR must cover for it to be used.
  cover: 0.98,
};

// The grid a green's fine surface is sampled on: the squares it's stored
// on - the box the green is worked out on when it's played (greensculpt
// sculptBox: its outline, fringe and widest bank) - and `margin` more each
// way. { x0, z0, nx, nz, cell, margin }. (It was the grid a green shaped
// by hand starts on, 2.6 m past the green: from there out to the end of
// the bank, as much as 14 m more, the green as played was a guess
// carried on from the edge - out by 0.6 - 0.7 m on two of the real links'
// greens.)
export function fineBox(stored, margin = FINE_GREEN.margin) {
  const g = sculptBox(stored.green);
  return { x0: g.x0 - margin * CELL, z0: g.z0 - margin * CELL, nx: g.nx + 2 * margin, nz: g.nz + 2 * margin, cell: CELL, margin };
}

// Which of a box's squares (fineBox's) are on the green or its fringe -
// what the surveys must cover, and what they're judged on. A Uint8Array.
export function greenCells(stored, box) {
  const poly = stored.green?.poly;
  const on = new Uint8Array(box.nx * box.nz);
  if (!poly) return on;
  for (let iz = 0; iz < box.nz; iz++) {
    for (let ix = 0; ix < box.nx; ix++) {
      const x = box.x0 + ix * box.cell;
      const z = box.z0 + iz * box.cell;
      if (insidePolygon(poly, x, z) || distanceToEdge(poly, x, z) <= FRINGE) on[iz * box.nx + ix] = 1;
    }
  }
  return on;
}

// The share of the squares `on` marks (all, without it) a grid has a
// height for.
export function coverOn(h, on = null) {
  let want = 0;
  let got = 0;
  for (let i = 0; i < h.length; i++) {
    if (on && !on[i]) continue;
    want++;
    if (Number.isFinite(h[i])) got++;
  }
  return got / Math.max(1, want);
}

// Two surveys of the same squares as one: `b` (which may be missing, or
// have gaps - NaN) shifted to stand level with `a` where both have a
// height, then their mean there and `a` alone elsewhere. Returns { h, both
// (the share of a's squares b covers too), offset (how far b stood above
// a), spread (how far they differ after that, rms, metres) } - measured
// over the squares `on` marks, where it's given (the green and its fringe:
// greenCells), over all of them otherwise.
export function stackSurveys(a, b = null, on = null) {
  const h = Float32Array.from(a);
  if (!b) return { h, both: 0, offset: 0, spread: 0 };
  let sum = 0;
  let n = 0;
  let have = 0;
  for (let i = 0; i < a.length; i++) {
    if (!Number.isFinite(a[i]) || (on && !on[i])) continue;
    have++;
    if (!Number.isFinite(b[i])) continue;
    sum += b[i] - a[i];
    n++;
  }
  if (!n) return { h, both: 0, offset: 0, spread: 0 };
  const offset = sum / n;
  let sq = 0;
  for (let i = 0; i < a.length; i++) {
    if (!Number.isFinite(a[i]) || !Number.isFinite(b[i])) continue;
    const d = b[i] - offset - a[i];
    if (!on || on[i]) sq += d * d;
    h[i] = a[i] + d / 2;
  }
  return { h, both: n / Math.max(1, have), offset, spread: Math.sqrt(sq / n) };
}

// A grid smoothed by a Gaussian `sigma` squares wide, gaps (NaN) left out
// of every average and left as gaps.
export function smoothGrid(h, nx, nz, sigma) {
  if (!(sigma > 0)) return Float32Array.from(h);
  const r = Math.max(1, Math.ceil(sigma * 3));
  const k = [];
  for (let i = -r; i <= r; i++) k.push(Math.exp(-(i * i) / (2 * sigma * sigma)));
  const pass = (src, along) => {
    const out = new Float32Array(src.length);
    for (let iz = 0; iz < nz; iz++) {
      for (let ix = 0; ix < nx; ix++) {
        const at = iz * nx + ix;
        if (!Number.isFinite(src[at])) {
          out[at] = NaN;
          continue;
        }
        let sum = 0;
        let w = 0;
        for (let j = -r; j <= r; j++) {
          const jx = along ? ix + j : ix;
          const jz = along ? iz : iz + j;
          if (jx < 0 || jz < 0 || jx >= nx || jz >= nz) continue;
          const v = src[jz * nx + jx];
          if (!Number.isFinite(v)) continue;
          sum += v * k[j + r];
          w += k[j + r];
        }
        out[at] = sum / w;
      }
    }
    return out;
  };
  return pass(pass(h, true), false);
}

// The green's fine surface as the edit that lays it on the hole, over the
// whole box it's played on (fineBox) - the green, its fringe and its bank,
// every square the survey's. `stored`:
// the hole as kept (a mapped hole with its ground); `box`: fineBox(stored);
// `heights`: the fine surface over the box (any datum: it's set level with
// the hole's ground over the green). Returns { edit, cover (the share of
// the green and its fringe the heights cover), detail (how far the fine
// surface stands from the ground under it, rms, metres), level (what the
// heights stand above the hole's own zero: heights - level is the green as
// played) } - edit null where the heights don't cover the green.
export function fineGreenEdit(stored, box, heights) {
  const poly = stored.green?.poly;
  if (stored.source !== "map" || !stored.terrain || !poly) return { edit: null, cover: 0, detail: 0 };
  const m = box.margin;
  // (Stored on the box's squares within its margin: fineBox's.)
  const g = { x0: box.x0 + m * CELL, z0: box.z0 + m * CELL, nx: box.nx - 2 * m, nz: box.nz - 2 * m, stamps: [] };
  g.h = new Float32Array(g.nx * g.nz);
  const ground = groundOf(stored);
  const on = new Uint8Array(g.nx * g.nz);
  let want = 0;
  let got = 0;
  let sum = 0;
  for (let iz = 0; iz < g.nz; iz++) {
    for (let ix = 0; ix < g.nx; ix++) {
      const x = g.x0 + ix * CELL;
      const z = g.z0 + iz * CELL;
      const fine = heights[(iz + m) * box.nx + ix + m];
      const d = fine - ground(x, z);
      g.h[iz * g.nx + ix] = d;
      if (!insidePolygon(poly, x, z) && distanceToEdge(poly, x, z) > FRINGE) continue;
      want++;
      if (!Number.isFinite(fine)) continue;
      on[iz * g.nx + ix] = 1;
      got++;
      sum += d;
    }
  }
  const cover = got / Math.max(1, want);
  if (cover < FINE_GREEN.cover) return { edit: null, cover, detail: 0 };
  // Level with the ground over the green: what's left is its fine shape.
  const level = sum / got;
  let sq = 0;
  for (let i = 0; i < g.h.length; i++) {
    g.h[i] = Number.isFinite(g.h[i]) ? g.h[i] - level : 0;
    if (on[i]) sq += g.h[i] * g.h[i];
  }
  return { edit: editFromGrid(g), cover, detail: Math.sqrt(sq / got), level };
}

// ---- The flag ------------------------------------------------------------------------------

export const FLAG = {
  // The steepest ground a hole is cut on, and how far round it that's held.
  most: 0.025,
  round: 0.9,
  // No nearer the green's edge, and no further from where it was wanted.
  edge: 4,
  reach: 12,
  step: 0.5,
};

// The steepest slope within `round` of a spot on `surface(x, z)`.
export function slopeRound(surface, x, z, round = FLAG.round) {
  let most = 0;
  for (const [dx, dz] of [[0, 0], [round, 0], [-round, 0], [0, round], [0, -round], [round * 0.7, round * 0.7], [round * 0.7, -round * 0.7], [-round * 0.7, round * 0.7], [-round * 0.7, -round * 0.7]]) {
    const gx = (surface(x + dx + 0.5, z + dz) - surface(x + dx - 0.5, z + dz)) / 1;
    const gz = (surface(x + dx, z + dz + 0.5) - surface(x + dx, z + dz - 0.5)) / 1;
    most = Math.max(most, Math.hypot(gx, gz));
  }
  return most;
}

// Where the flag goes: the spot on the green nearest `want` that's gentle
// enough (FLAG.most all round it), well in from the edge, and - on a green
// two holes share - nearer this hole's flag than the other's (`others`:
// the other flags on it). Where nowhere within reach is gentle enough, the
// gentlest there is. Returns { at: [x, z], slope, moved (metres) }.
export function puttableSpot(surface, poly, want, { others = [], most = FLAG.most, edge = FLAG.edge, reach = FLAG.reach, step = FLAG.step, round = FLAG.round } = {}) {
  const ok = (x, z) => insidePolygon(poly, x, z) && distanceToEdge(poly, x, z) >= edge && others.every((o) => Math.hypot(o[0] - x, o[1] - z) > Math.hypot(want[0] - x, want[1] - z));
  let best = null;
  let gentlest = null;
  const n = Math.ceil(reach / step);
  for (let iz = -n; iz <= n; iz++) {
    for (let ix = -n; ix <= n; ix++) {
      const x = want[0] + ix * step;
      const z = want[1] + iz * step;
      const d = Math.hypot(ix, iz) * step;
      if (d > reach || !ok(x, z)) continue;
      if (best && d >= best.moved) continue;
      const slope = slopeRound(surface, x, z, round);
      if (slope <= most) best = { at: [x, z], slope, moved: d };
      else if (!gentlest || slope < gentlest.slope) gentlest = { at: [x, z], slope, moved: d };
    }
  }
  const spot = best ?? gentlest ?? { at: [want[0], want[1]], slope: slopeRound(surface, want[0], want[1], round), moved: 0 };
  return { at: [Math.round(spot.at[0] * 100) / 100, Math.round(spot.at[1] * 100) / 100], slope: spot.slope, moved: spot.moved };
}

// Every hole of a course from a map with its flag on a spot a hole would
// be cut on (puttableSpot): each on its own green as it's played, and on a
// green two holes share, each nearer its own flag than the other's. Made
// for the real links course (tools/realcourse.mjs); every course made
// from the map with LiDAR under it gets the same (server/mapimport.mjs) -
// a flag the map put on a bank is no use to anyone. `surfaceOf(layout)`:
// the hole's ground as played ((x, z) -> height: courseplay.mjs
// prepareHole's heightAt). `only(hole, index)`: which holes to do (the
// rest come back as they were). Returns [{ hole, flag: { was, slope,
// moved } | null }].
export function puttableFlags(holes, surfaceOf, only = () => true) {
  const frame = (L) => holeFrame(L.geo.tee, L.geo.heading);
  const mapped = (h) => h.layout?.source === "map" && h.layout.geo && Array.isArray(h.layout.pin) && h.layout.green?.poly;
  const at = holes.map((h) => (mapped(h) ? frame(h.layout).toLocal(h.layout.pin) : null));
  return holes.map((h, i) => {
    if (!mapped(h) || !only(h, i)) return { hole: h, flag: null };
    const L = h.layout;
    const here = frame(L);
    const others = at.filter((p, j) => p && j !== i).map((p) => here.toHole(p)).filter((p) => insidePolygon(L.green.poly, p[0], p[1]));
    const surface = surfaceOf(L);
    const was = slopeRound(surface, L.pin[0], L.pin[1]);
    const spot = puttableSpot(surface, L.green.poly, L.pin, { others });
    return { hole: { ...h, layout: { ...L, pin: spot.at } }, flag: { was, slope: spot.slope, moved: spot.moved } };
  });
}
