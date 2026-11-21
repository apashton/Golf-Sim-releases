// More variety among the trees, for nothing (the owner, 27 October 2026:
// "Find ways to expand the tree variation shapes and sizes and colours.
// Slight offsets. Add greater variety without affecting overall resource
// usage find smart ways to vary even further"). No more shapes, pictures,
// draws or memory: each tree's colour is already its own (a tint of its
// kind's, look/trees.js TREE_TINTS, set on its instance), and these move it
// a little further by where it stands -
//   - standShade: a slow drift over the ground, so trees near each other
//     share a cast - one stand a touch yellower and lighter, the next
//     bluer and darker - as a real wood's do, rather than each tree a
//     speckle of its own; the far woods take it too (look/farwoods.js),
//     so a stand carries on into them;
//   - treeOpenness: a tree standing in the open - alone, or along a
//     fairway's edge - a touch lighter and warmer (more sun on it), one
//     deep in a wood darker and cooler.
// And a share of the made trees are young (sim/treehits.mjs treeForm,
// YOUNG): smaller and slimmer, so a wood's heights step down at its edges
// and among the old trees. Pure.

import { valueNoise } from "./country.mjs";

// The drift: two scales of it (metres), and how far it moves a tree's
// hue, saturation and lightness at most (HSL, 0 - 1).
export const STAND_SHADE = { size: 70, fine: 26, hue: 0.03, sat: 0.08, light: 0.055 };

// The drift where (x, z) is (world metres): { hue, sat, light } offsets.
// (Yellower goes with lighter, bluer with darker, as in sun and shade.)
export function standShade(x, z, seed = 0) {
  const S = STAND_SHADE;
  const broad = valueNoise(x, z, S.size, seed ^ 0x51a7d) * 2 - 1;
  const fine = valueNoise(x + 113.7, z - 41.3, S.fine, seed ^ 0x2be7) * 2 - 1;
  const cast = 0.7 * broad + 0.3 * fine;
  const sat = valueNoise(x - 57.1, z + 89.9, S.size * 1.3, seed ^ 0x77c1) * 2 - 1;
  return { hue: -S.hue * cast, sat: S.sat * sat, light: S.light * cast };
}

// How open each tree stands: 1 with no other tree within `radius` metres,
// 0 with `crowded` or more; and the most it moves a tree's colour.
export const OPEN = { radius: 9, crowded: 6, hue: 0.012, sat: 0.04, light: 0.045 };

// points: [[x, z, ...]] (world metres). A Float32Array, one value a tree.
export function treeOpenness(points, { radius = OPEN.radius, crowded = OPEN.crowded } = {}) {
  const cell = radius;
  const grid = new Map();
  const key = (i, j) => i * 73856093 + j * 19349663;
  points.forEach(([x, z], n) => {
    const k = key(Math.floor(x / cell), Math.floor(z / cell));
    const list = grid.get(k);
    if (list) list.push(n);
    else grid.set(k, [n]);
  });
  const out = new Float32Array(points.length);
  const r2 = radius * radius;
  points.forEach(([x, z], n) => {
    const i = Math.floor(x / cell);
    const j = Math.floor(z / cell);
    let near = 0;
    for (let a = i - 1; a <= i + 1; a++) {
      for (let b = j - 1; b <= j + 1; b++) {
        for (const m of grid.get(key(a, b)) ?? []) {
          if (m === n) continue;
          const dx = points[m][0] - x;
          const dz = points[m][1] - z;
          if (dx * dx + dz * dz <= r2) near++;
        }
      }
    }
    out[n] = Math.max(0, 1 - near / crowded);
  });
  return out;
}

// The two together for one tree: { hue, sat, light } to add to its
// colour (HSL).
export function treeShift(stand, open) {
  const o = open * 2 - 1;
  return { hue: stand.hue - OPEN.hue * o, sat: stand.sat + OPEN.sat * o, light: stand.light + OPEN.light * o };
}
