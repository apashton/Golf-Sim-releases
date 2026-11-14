// The ground round a tree's foot (look/treefoot.js draws it, High and up):
// not the same pristine grass right up to the trunk, but a patch of bare,
// darker soil scattered with what the tree drops - fallen leaves under a
// broadleaf, rust-brown needles under a pine - its edge ragged into the
// grass. How big, by kind (metres across its middle for a tree of width
// 1), and what's in it. Pure.

export const FOOT = {
  // Radius, metres, at width 1.
  r: { oak: 2.1, leaf: 1.8, willow: 1.9, poplar: 1.3, birch: 1.2, bush: 1.0, pine: 1.7, scots: 1.7, spruce: 1.6, column: 1.1, snag: 0.9, beech: 2.2, chestnut: 2.0, cedar: 2.3, holly: 1.1, hawthorn: 1.2 },
  least: 0.6,
  most: 3,
  // Litter by kind: leaves, needles, or bare soil.
  needles: new Set(["pine", "scots", "spruce", "column", "cedar"]),
  // Laid this far above the ground (metres), drawn over the grass.
  lift: 0.02,
};

// Each litter's tint, multiplied into the patch's picture.
export const FOOT_TINTS = {
  leaves: [1, 1, 1],
  needles: [1.12, 0.92, 0.78],
  soil: [0.92, 0.9, 0.88],
};

// A tree's patch: { r, litter, turn }. seed: anything whole that differs
// tree to tree (its turn).
export function footPatch(kind, width = 1, seed = 0) {
  const base = FOOT.r[kind] ?? FOOT.r.leaf;
  const r = Math.min(FOOT.most, Math.max(FOOT.least, base * width));
  const litter = kind === "snag" ? "soil" : FOOT.needles.has(kind) ? "needles" : "leaves";
  const h = Math.sin((seed + 1) * 12.9898) * 43758.5453;
  return { r, litter, turn: (h - Math.floor(h)) * Math.PI * 2 };
}
