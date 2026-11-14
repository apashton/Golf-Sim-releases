// The ground of a whole hole changed by hand in the designer (the owner:
// "a way to add overall elevation changing the floor map"): on a hole with
// real ground - one from the map, or an imaginary course given hills
// (sim/imaginary.mjs) - its grid of heights (layout.terrain) raised or
// lowered with a brush, tilted as a whole, or smoothed. They're edits like
// the rest (holeedits.mjs), replayed onto the grid as it was:
//
//   { k: "gr", p: [[x, z], ...], r, a }   the brush: each point raises the
//                                        ground by a (metres; lower if
//                                        negative), most at the point and
//                                        easing off to nothing r out
//   { k: "gt", up, side }                the hole tilted: the green up (or
//                                        down) by `up` metres against the
//                                        tee, the right side up by `side`
//                                        metres against the left (60 m
//                                        across). Says how it is now: only
//                                        the last counts.
//   { k: "gs", p: [[x, z], ...], r }     smoothed round each point
//
// Pure: holeedits.mjs calls groundEdited as a hole's edits are laid on.

import { unpackGrid, packGrid, gridHeight } from "./terrain.mjs";

export const GROUND_KINDS = ["gr", "gt", "gs"];
// The brush's sizes and steps (metres), and how far a tilt can go.
export const BRUSH_SIZES = [6, 12, 25, 50];
export const BRUSH_STEPS = [0.25, 0.5, 1, 2];
export const TILT_LIMIT = { up: 40, side: 12 };
export const MAX_POINTS = 400;

const fin = (v) => typeof v === "number" && Number.isFinite(v);
const spot = (p) => Array.isArray(p) && p.length >= 2 && fin(p[0]) && fin(p[1]);

export function validGroundEdit(e) {
  if (e?.k === "gr") return Array.isArray(e.p) && e.p.length > 0 && e.p.length <= MAX_POINTS && e.p.every(spot) && fin(e.r) && e.r > 0 && e.r <= 200 && fin(e.a) && Math.abs(e.a) <= 20;
  if (e?.k === "gt") return fin(e.up) && fin(e.side) && Math.abs(e.up) <= TILT_LIMIT.up && Math.abs(e.side) <= TILT_LIMIT.side;
  if (e?.k === "gs") return Array.isArray(e.p) && e.p.length > 0 && e.p.length <= MAX_POINTS && e.p.every(spot) && fin(e.r) && e.r > 0 && e.r <= 200;
  return false;
}

// The brush's shape: 1 at the middle, easing to 0 at r (smooth all the way).
export function falloff(d, r) {
  if (d >= r) return 0;
  const t = d / r;
  return (1 - t * t) ** 2;
}

// The grid's cell centres as [x, z] for index i.
const cellAt = (g, i) => [g.x0 + (i % g.nx) * g.cell, g.z0 + Math.floor(i / g.nx) * g.cell];

// A grid (unpacked) with one edit laid on; changes it in place.
// path: the hole's centre line [[x, z]...], for the tilt (tee to green).
function apply(g, e, { length = 1 } = {}) {
  if (e.k === "gr") {
    for (const [px, pz] of e.p) {
      const i0 = Math.max(0, Math.floor((px - e.r - g.x0) / g.cell));
      const i1 = Math.min(g.nx - 1, Math.ceil((px + e.r - g.x0) / g.cell));
      const j0 = Math.max(0, Math.floor((pz - e.r - g.z0) / g.cell));
      const j1 = Math.min(g.nz - 1, Math.ceil((pz + e.r - g.z0) / g.cell));
      for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) {
          const w = falloff(Math.hypot(g.x0 + i * g.cell - px, g.z0 + j * g.cell - pz), e.r);
          if (w > 0) g.h[j * g.nx + i] += e.a * w;
        }
      }
    }
  } else if (e.k === "gt") {
    // Along the hole (x, tee at 0) and across it (z, right +).
    for (let i = 0; i < g.h.length; i++) {
      const [x, z] = cellAt(g, i);
      g.h[i] += (e.up * x) / length + (e.side * z) / 60;
    }
  } else if (e.k === "gs") {
    const copy = Float32Array.from(g.h);
    const k = Math.max(1, Math.round(4 / g.cell));
    for (const [px, pz] of e.p) {
      const i0 = Math.max(0, Math.floor((px - e.r - g.x0) / g.cell));
      const i1 = Math.min(g.nx - 1, Math.ceil((px + e.r - g.x0) / g.cell));
      const j0 = Math.max(0, Math.floor((pz - e.r - g.z0) / g.cell));
      const j1 = Math.min(g.nz - 1, Math.ceil((pz + e.r - g.z0) / g.cell));
      for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) {
          const w = falloff(Math.hypot(g.x0 + i * g.cell - px, g.z0 + j * g.cell - pz), e.r);
          if (w <= 0) continue;
          let sum = 0;
          let n = 0;
          for (let dj = -k; dj <= k; dj++) {
            for (let di = -k; di <= k; di++) {
              const ii = i + di;
              const jj = j + dj;
              if (ii < 0 || jj < 0 || ii >= g.nx || jj >= g.nz) continue;
              sum += copy[jj * g.nx + ii];
              n++;
            }
          }
          g.h[j * g.nx + i] = copy[j * g.nx + i] * (1 - w) + (sum / n) * w;
        }
      }
    }
  }
}

// The packed grid with the ground edits among `edits` laid on, in order
// (only the last tilt), or the same grid when there are none. Returns {
// terrain, applied: Set of the edits that took }.
export function groundEdited(terrain, edits, { length = 1 } = {}) {
  const mine = (edits ?? []).filter((e) => GROUND_KINDS.includes(e?.k) && validGroundEdit(e));
  if (!terrain || !mine.length) return { terrain, applied: new Set() };
  const lastTilt = mine.findLast((e) => e.k === "gt");
  const g = unpackGrid(terrain);
  const applied = new Set();
  for (const e of mine) {
    if (e.k === "gt" && e !== lastTilt) continue;
    apply(g, e, { length: Math.max(1, length) });
    applied.add(e);
  }
  // Heights from the tee, as the grid always is.
  const tee = gridHeight(g, 0, 0);
  for (let i = 0; i < g.h.length; i++) g.h[i] -= tee;
  return { terrain: packGrid(g), applied };
}

// How much a hole rises from tee to green on its grid (for the designer's
// words: "the green is 6 m above the tee").
export function riseToGreen(terrain, pin) {
  if (!terrain || !pin) return 0;
  const g = unpackGrid(terrain);
  return gridHeight(g, pin[0], pin[1]) - gridHeight(g, 0, 0);
}
