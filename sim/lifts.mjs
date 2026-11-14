// How far above or below the ground each surface of a designed hole is
// drawn. course.js lays them out at these heights - a centimetre or two
// apart, with drawing layers (grass.js LAYER) so a far-off one never
// flickers through the one on top - and the ball rests, and its shadow
// falls, on what's drawn rather than on the bare ground under it: without
// that it hovered over the fairway and sank out of sight in a bunker.
//
// Plain numbers, no three.js, so the tests can check them - and so another
// core can place grass on the drawn surface (sim/holegrass.mjs). look/
// lifts.js hands them on to the drawing code.

export const SURFACE_LIFT = {
  rough: -0.03,
  semi: -0.025,
  deep: -0.025,
  trees: -0.03,
  fairway: -0.02,
  tee: -0.01,
  fringe: -0.006,
  green: 0,
  bunker: 0.03,
  greenside: 0.03,
  // A waste area's sand is drawn as a bunker's is (course/holebuild.js),
  // the ball sitting up on it.
  waste: 0.03,
  water: 0.03,
  // A cart path stands a few centimetres proud of the grass (look/paths.js).
  path: 0.05,
};

// A ball at rest in sand sits a third of the way down into it, as a ball
// does (the course's ball is 4.5 cm across the middle).
export const IN_SAND = 0.015;

// On a hole from a map the ground is all one surface, a whisker over it.
export const MAPPED_LIFT = 0.002;

// How far above the ground what's drawn on `lie` is. A cart path is laid
// over the ground, whatever the hole: on one from a map too.
export function drawnLift(lie, mapped = false) {
  if (lie === "path") return SURFACE_LIFT.path;
  return mapped ? MAPPED_LIFT : (SURFACE_LIFT[lie] ?? 0);
}

// How far above the ground a resting ball's lowest point is, on `lie`.
export function restingLift(lie, mapped = false) {
  const sunk = lie === "bunker" || lie === "greenside" ? IN_SAND : 0;
  return drawnLift(lie, mapped) - sunk;
}
