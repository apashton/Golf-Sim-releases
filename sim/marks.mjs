// What a shot leaves on the ground, on Ultra (look/marks.js draws them):
// a divot where an iron or a wedge was struck off turf, and a pitch mark
// where a ball came down on the green. They stay for the hole, so the
// shots before show where they were played and landed.

// Clubs that take turf: the irons and wedges (and a hybrid a little); the
// driver and the woods sweep it.
const TURF = { "4H": 0.5, "4I": 0.8, "5I": 0.85, "6I": 0.9, "7I": 1, "8I": 1, "9I": 1.05, PW: 1.1, AW: 1.1, GW: 1.1, SW: 1.15, LW: 1.15 };
const TURF_LIES = ["fairway", "tee", "semi", "rough", "fringe"];

// A divot for a shot: null, or { length, width } metres - longer the more
// the club digs; none from the green, sand or trees, nor for a putt.
export function divotFor({ club, lie, putt = false, speedMph = 0 }) {
  const k = TURF[club];
  if (putt || !k || !TURF_LIES.includes(lie)) return null;
  // A soft chip barely brushes the turf.
  const swing = Math.min(1, Math.max(0, (speedMph - 25) / 60));
  if (swing <= 0) return null;
  return { length: (0.1 + 0.08 * swing) * k, width: 0.045 + 0.02 * k };
}

// A pitch mark where a ball lands (a shot's cue, audio/cues.mjs): its first
// touchdown on the green, coming down hard enough - its size (metres
// across), or 0.
export function pitchMarkFor(cue) {
  if (!cue || cue.kind !== "land" || cue.bounce !== 0 || cue.lie !== "green") return 0;
  const hit = (cue.speed ?? 0) * (cue.steep ?? 0.5);
  return hit < 4 ? 0 : Math.min(0.055, 0.025 + hit * 0.0015);
}

// At most this many on a hole (the oldest go).
export const MOST_MARKS = 48;

// Sand (the owner, 21 October 2026: "the mark it leaves in the sand"):
export const SAND_LIES = new Set(["bunker", "greenside"]);

// Where a ball lands in a bunker (a shot's "land" cue): a dent with a rim
// of thrown sand, its size (metres across) - bigger the harder it came
// down, smaller where it hops on - or 0 coming down too gently to show.
export function craterFor(cue) {
  if (!cue || cue.kind !== "land" || !SAND_LIES.has(cue.lie)) return 0;
  const hit = cue.impact ?? (cue.speed ?? 0) * (cue.steep ?? 0.5);
  if (hit < 2) return 0;
  const size = Math.min(0.2, 0.07 + hit * 0.006);
  return cue.bounce > 0 ? size * 0.6 : size;
}

// The sand a bunker shot takes (not a putt): a long, shallow scoop just
// ahead of the ball, { length, width } metres - longest from a splash out
// (slow, the club through the sand), shorter from a full one picked
// cleanly; most from a plugged ball, dug out.
export function scoopFor({ lie, putt = false, speedMph = 0, plug = null }) {
  if (putt || !SAND_LIES.has(lie)) return null;
  const full = Math.min(1, Math.max(0, (speedMph - 25) / 85));
  const dig = plug === "buried" ? 1.3 : plug === "egg" ? 1.15 : 1;
  return { length: (0.32 - 0.14 * full) * dig, width: (0.13 - 0.03 * full) * dig };
}

// A plugged ball's crater: a fried egg's wide ring of sand round it, one
// right in a smaller, deeper hole - { size (across), rim (how wide its
// ring, a share of it) }, or null.
export function eggFor(plug) {
  if (plug === "egg") return { size: 0.13, rim: 0.45 };
  if (plug === "buried") return { size: 0.08, rim: 0.3 };
  return null;
}
