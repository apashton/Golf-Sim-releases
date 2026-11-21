// How much of the rest of the course a hole draws, by graphics preset
// (docs/COURSE-LOD-PLAN.md, stage 7). One table: the crop's reach, how
// near a neighbour must be to be drawn in full (tier 1), and how fine
// the crop's ground is. The safety valve can shrink tier 1 and drop the
// 3D neighbour trees without rebuilding a shader.

import { coursePlaces } from "./imaginary.mjs";

export const TIERS = {
  // Metres past the hole's own bounds.
  pad: { standard: 250, medium: 400, high: 400, ultra: 500 },
  // Metres past the hole's own ground. 0: only the next hole is tier 1.
  t1: { standard: 0, medium: 100, high: 150, ultra: 200 },
  // The crop's ground grid, metres. The sheet beyond it is `outer`.
  grid: { standard: 16, medium: 16, high: 8, ultra: 8 },
  outer: 36,
};

// Set by the safety valve (look/trees.js). True: tier 1 shrinks to the
// next hole only, and the neighbour trees already drawn are hidden.
let shed = false;

export function neighbourShed() {
  return shed;
}

export function setNeighbourShed(on) {
  shed = !!on;
}

// The row in use. t1 is 0 and trees are off while the valve has shed them.
export function courseTier(preset = "high") {
  const name = TIERS.pad[preset] ? preset : "high";
  return {
    preset: name,
    pad: TIERS.pad[name],
    t1: shed ? 0 : TIERS.t1[name],
    grid: TIERS.grid[name],
    outer: TIERS.outer,
    trees: !shed,
  };
}

const round = (n) => (typeof n === "number" && Number.isFinite(n) ? Math.round(n * 10) / 10 : 0);

// A checksum of positions, so moving a bunker changes the bake key even
// when the count does not.
const sumAt = (list, at) => {
  let n = 0;
  for (const item of list ?? []) {
    const [x, z] = at(item) ?? [0, 0];
    n = (n + round(x) * 13 + round(z)) % 1000003;
  }
  return Math.round(n);
};

// Plain data for the other holes, for the bake fingerprint (look/bake.js).
// An edit to a neighbour, or a hole moved in the routing, changes it, so
// a kept hole is built again instead of showing a stale crop. Null when
// there are no other holes. The day's pin is not in here.
export function neighbourPrint(course, index) {
  const holes = course?.holes ?? [];
  if (holes.length < 2) return null;
  let places = [];
  try {
    places = coursePlaces(course) ?? [];
  } catch {
    places = [];
  }
  const out = [];
  holes.forEach((h, i) => {
    if (i === index) return;
    const L = h?.layout ?? {};
    const p = places[i] ?? {};
    const at = p.at ?? [0, 0];
    out.push({
      i,
      x: round(at[0]),
      z: round(at[1]),
      rot: round(p.rot ?? 0),
      par: L.par ?? null,
      yards: L.yards ?? null,
      path: L.path?.length ?? 0,
      fairways: L.fairways?.length ?? 0,
      bunkers: L.bunkers?.length ?? 0,
      water: L.water?.length ?? 0,
      trees: L.trees?.length ?? 0,
      bunkerAt: sumAt(L.bunkers, (b) => [b.x, b.z]),
      waterAt: sumAt(L.water, (w) => [w.x, w.z]),
    });
  });
  return out;
}
