// Ratings for the match ladders (docs/LADDER-PLAN.md, "The ratings"): Elo,
// the chess way, for one-against-one match play. Each player's rating says
// how good they are on that ladder; the gap between two says how often the
// better one should win; a result moves both by how far it beat what was
// expected - a little for the favourite winning, more for an upset.
//
// The numbers, from season mode's made-up golfers (20,000 matches at each
// handicap gap, tools/laddersim.mjs): a stroke of handicap is worth about
// 48 points over 18 holes and 33 over 9. So a newcomer to a scratch ladder
// starts from their handicap (1500 for an 18, 48 a stroke better or
// worse); on a handicap ladder, where the strokes even a match out,
// everyone starts at 1500.
//
// Pure: sim/matchladder.mjs replays a ladder's results through it.

export const START = 1500;
// The Elo scale: 400 points' gap is ten to one.
export const SCALE = 400;
// How far one match moves a rating: more while a player's new (their first
// NEW_MATCHES), so a newcomer finds their level quickly.
export const K_NEW = 40;
export const K = 24;
export const NEW_MATCHES = 5;
// Points a stroke of handicap is worth, by the match's length.
export const PER_STROKE = { 18: 48, 9: 33 };
// The handicap a rating of START stands for on a scratch ladder.
export const START_HANDICAP = 18;

// How often a player rated `a` beats one rated `b` (a halved match half a
// win): 0 - 1.
export const expected = (a, b) => 1 / (1 + 10 ** ((b - a) / SCALE));

// A newcomer's rating on a scratch ladder from their handicap index (null:
// none known - START).
export function startRating(index, holes = 18) {
  if (!Number.isFinite(index)) return START;
  return Math.round(START + PER_STROKE[holes === 9 ? 9 : 18] * (START_HANDICAP - index));
}

// How much more a match counts for its margin: a 1 up win is a win, a 5&4
// thrashing a little more (holes up when it ended). Kept small, so running
// a match up isn't worth much.
export function marginFactor(up) {
  const n = Math.abs(up ?? 0);
  if (n <= 1) return 1;
  if (n <= 3) return 1.15;
  return 1.3;
}

// K for a player with this many matches behind them.
export const kFor = (played) => (played < NEW_MATCHES ? K_NEW : K);

// A match between a (rated ra, played pa) and b: score is a's result - 1
// won, 0.5 halved, 0 lost; up the holes it was won by; weight a share (a
// pair's fourth match in a month counts half: sim/matchladder.mjs).
//   { a, b, da, db, odds } - the new ratings, the changes, a's odds before
export function rate({ ra, rb, pa = NEW_MATCHES, pb = NEW_MATCHES, score, up = 0, weight = 1 }) {
  const odds = expected(ra, rb);
  const m = marginFactor(up) * weight;
  const da = Math.round(kFor(pa) * m * (score - odds));
  const db = Math.round(kFor(pb) * m * (1 - score - (1 - odds)));
  return { a: ra + da, b: rb + db, da, db, odds };
}

// Odds in a few words: "64%".
export const oddsWords = (p) => `${Math.round(p * 100)}%`;

// A change in a few words: "+18", "-6", "no change".
export const changeWords = (d) => (d > 0 ? `+${d}` : d < 0 ? `${d}` : "no change");
