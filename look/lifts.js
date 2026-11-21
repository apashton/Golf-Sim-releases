// How far above or below the ground each surface of a designed hole is
// drawn: the numbers live in sim/lifts.mjs (pure, so another core and the
// tests can use them); the drawing code takes them from here as it always
// did.

export { SURFACE_LIFT, IN_SAND, MAPPED_LIFT, drawnLift, restingLift } from "../sim/lifts.mjs";
