// Slopes shown on a green (course.js shadeSlopes): each spot a little
// lighter where it faces the sun and darker where it faces away - more
// than the light alone makes it, so a tier, a crown or a hollow reads from
// the approach and not just in the putting grid.
//
// Only on the putting surface, fading out before its edge
// (slopeShadeWeight): on a hole from a map it ran on 1.6 m past the edge
// and faded over 3 m more, so a green's bank facing away from the sun was
// drawn up to 22% darker than the green above it and the fairway below -
// a dark band round the shaded side of every green; on a designed hole it
// stopped dead at the edge, a step between the shaded green and the
// fringe. The owner, 22 November 2026: "fairway needs to be seamless with
// the green".

// most: the furthest it lightens or darkens (a share of the colour);
// gain: how much a slope (rise over run) lightens or darkens; edge: it
// fades in over this many metres in from the green's edge (none at the
// edge itself or past it).
export const SLOPE_SHADE = { most: 0.22, gain: 5, edge: 1 };

const smooth01 = (t) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

// How much of it a spot gets: `depth` metres inside the green's outline
// (negative outside, sim/holeedits.mjs insideDepth).
export function slopeShadeWeight(depth, k = SLOPE_SHADE) {
  return smooth01(depth / k.edge);
}

// The spot's colour scale: (gx, gz) the ground's slope there, (sx, sz)
// the way to the sun across the ground (a unit vector), weight as above.
export function slopeShade(gx, gz, sx, sz, weight, k = SLOPE_SHADE) {
  const lit = Math.max(-k.most, Math.min(k.most, (gx * sx + gz * sz) * k.gain));
  return 1 + lit * weight;
}
