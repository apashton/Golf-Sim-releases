// Hand edits to a hole (sim/holeedits.mjs): the limits and sizes every part
// shares - bunker styles, depths, tilts, the green's handles, clearances.


// The bunker styles a hole's bunkers can be given (the "bstyle" edit).
export const BUNKER_RESTYLES = ["classic", "rugged", "modern"];

// Bunker depths: how far the sand sits below the grass round it, metres.
export const DEPTHS = [
  { name: "Shallow", dig: 0.3 },
  { name: "Normal", dig: 0.6 },
  { name: "Deep", dig: 1.1 },
  { name: "Pot bunker", dig: 1.7 },
];
// How much a green can be tilted: its fall across the middle, percent.
export const TILTS = [
  { name: "Flat", pct: 0 },
  { name: "Gentle", pct: 1 },
  { name: "Medium", pct: 2 },
  { name: "Strong", pct: 3 },
];
// Handles round the green's edge.
export const HANDLES = 12;
// Plenty for anyone's changes, and a cap on what a course file can grow to.
export const MAX_EDITS = 400;
// The height of a bunker's grass lip above the ground round it, which a
// shot out has to clear as well as the face.
export const LIP = 0.1;
// A dug bunker is dug to its full depth only this far (metres) out from
// the green's edge - the width of the fringe - so the green and its fringe
// stay as they were, however deep the sand beside them.
export const GREEN_CLEAR = 1.6;
// How far a dug bunker's sand takes to shelf up to meet water it runs into
// (metres).
export const WATER_SHELF = 2.5;
// A pond on sloping real ground (a hillside, the course maker's hills):
// the hill feeds down to the water's edge on a natural bank rather than
// standing over it as a cliff (the owner, of the Mountain hills: "whether
// there is a cliff edge to the water or whether the hill should sort of
// feed down to the water edge"). Ground standing higher than a slope of
// `rise` (1 in 2.5) up from `foot` metres above the water at its edge is
// taken down to it, eased in where it meets the hill
// (over `ease` metres of height at the edge, more further out: the bank
// is never steeper than about 25 degrees), so the edge is never more than
// `foot` plus half of `ease` - 30 cm - above the water. Ground already
// below that - a pond on level ground - is as it was.
export const POND_BANK = { foot: 0.15, rise: 0.4, ease: 0.3 };
// A bunker by the green set to meet it (join 1) or to sit just off it (0):
// how far its sand stays from the green's edge, metres. Joined, it tucks a
// hand's width under the green's edge (the green wins there), so no strip
// of anything shows between; next to it, a narrow collar of grass.
export const JOIN_GAP = { 1: -0.1, 0: 1 };
// How near the green a bunker has to be to be offered either.
export const JOIN_REACH = 6;
// Size limits (metres, the longer way across).
// (Water as big as a lake needs to be: the owner, 22 October 2026, "Should
// be able to place [it] and the causeway be as big as it needs to be".)
export const SIZES = { bunker: [2.5, 24], water: [5, 250], fairway: [6, 120] };
// The hole's own trees are cleared this far (metres) round a fairway added
// by hand - its first cut and a little more.
export const ADDED_CLEAR = 3;
// Keep this clear round the teeing spot.
export const TEE_CLEAR = 12;
// Water keeps this far (metres) off the teeing ground's edge.
export const WATER_TEE = 4;
// Trees: this far from the tee, the green's edge, the line of play.
export const TREE_TEE = 14;
export const TREE_GREEN = 3;
export const TREE_LINE = 1;
// A bump or hollow on the green: its height (metres) and width.
export const BUMP = { a: 0.035, s: 2.2 };
// Hand-made bumps kept per hole at most.
export const MAX_BUMPS = 120;

export const r2 = (v) => Math.round(v * 100) / 100;
