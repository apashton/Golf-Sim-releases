// Which round of the course maker made a hole (the owner, 23 November
// 2026: "Update the static course maps we already have using lessons
// learned from the two new additions ... we might go through another
// improvement round at some points").
//
// A hole made by the course maker's strategic design from this round on
// carries `layout.maker` (sim/architect.mjs strategicHole; kept when the
// course is put on hills, sim/imaginary.mjs withHills). What the round
// taught - from Saltpine Links and Watling Pines (docs/REAL-COURSES.md) -
// is switched on by it: bunkers cut into the land, woods with ragged edges
// and their kinds by where they stand, every tee set level and marked, and
// the rest (docs/COURSES.md, "The course maker's second round"). A hole
// saved before it (a player's own course, made at round 1), a Challenge's
// hole (the classic generator) or a course from a map has none, and is
// played and drawn as it always was - so what a course is doesn't change
// under it with a new version of the game, and the courses that come with
// it (sim/shown.mjs) change only when they're made again on purpose.
//
// Pure: for the page, the server and the tests.

export const MAKER = 2;
// The round that made a hole's layout (1 for any made before rounds were
// counted, or not by the course maker).
export const makerOf = (L) => (Number.isInteger(L?.maker) ? L.maker : 1);
// Whether a hole was made at round n or later.
export const madeSince = (L, n = MAKER) => makerOf(L) >= n;
