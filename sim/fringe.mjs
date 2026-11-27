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

// A collar mown in rings: rings width metres apart that follow the green's
// own edge (look/grass.js edgeRings), starting `phase` of a ring out from
// it - half way, so both the green's edge and the collar's outer edge fall
// on the lighter lap: begun on the darker one, each edge was a thin line
// darker than both sides (the owner, 22 November 2026: "fairway needs to
// be seamless with the green").
export const RINGS = { width: 0.8, phase: 0.5 };
