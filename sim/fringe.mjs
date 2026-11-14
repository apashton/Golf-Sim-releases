// How a green's fringe looks (the owner: "collars and fringes that vary"),
// from the hole: one even shade as before, mown in rings round the green
// (two shades, as a collar cut goes round it), or a lusher, darker, longer
// collar. Only how it looks: every fringe plays the same and is as wide.

export const FRINGE_LOOKS = ["even", "rings", "lush"];

// The look for a hole's mowing seed (course.js mowSeed).
export function fringeLook(seed = 1) {
  let h = Math.imul((seed | 0) ^ 0x5f1e, 0x9e3779b1) >>> 0;
  h = (h ^ (h >>> 15)) >>> 0;
  return FRINGE_LOOKS[h % FRINGE_LOOKS.length];
}
