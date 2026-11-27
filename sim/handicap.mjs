// A handicap index from the course rounds, worked out the way the World
// Handicap System does it, as near as a sim's courses allow:
//
//   score differential = (113 / slope) x (adjusted gross score - course rating)
//
// the adjusted gross score capping each hole at a net double bogey (par + 2
// + the strokes the player gets there; par + 5 before there's an index),
// and the index the average of the best differentials of the latest 20 -
// the best 8 of 20, fewer while there are fewer rounds, less a stroke or
// two at the very start - never above 54.
//
// A sim course has no official rating, so it's estimated from its length
// (the scratch golfer's rating: about 40.9 + yards / 220 for 18 holes - a
// 6,500 yd course rates about 70.4) and its slope is taken as 113, the
// standard, unless the course gives its own. A 9-hole round counts as the
// World Handicap System's: its differential plus the one the player would
// be expected to score over the other nine. Rounds of other lengths, or
// left unfinished, don't count.
//
// Pure: the server works it out over every practice and round-format
// course round (not experimental, not on a day left out), whatever period
// the page is showing.

export const STANDARD_SLOPE = 113;
export const MAX_INDEX = 54;
const WINDOW = 20;

// How many of the latest differentials count, and the adjustment, by how
// many there are (fewer than 3: no index yet).
const COUNT = [null, null, null, [1, -2], [1, -1], [1, 0], [2, -1], [2, 0], [2, 0], [3, 0], [3, 0], [3, 0], [4, 0], [4, 0], [4, 0], [5, 0], [5, 0], [6, 0], [6, 0], [7, 0], [8, 0]];

// A hole's share of the scratch rating, from its length.
export const holeRating = (yards) => 40.9 / 18 + yards / 220;

// The course's rating over the holes played (null when a hole's length
// isn't known).
export function courseRating(holes) {
  if (!holes.length || holes.some((h) => !Number.isFinite(h.yards))) return null;
  return holes.reduce((a, h) => a + holeRating(h.yards), 0);
}

// The order holes take strokes in: by the card's stroke index, the holes
// with one before those without; those without by the longest for their
// par; then the card's order. One order whatever the mix (a sort given a
// comparison that isn't consistent can put them in any order).
export function hardestFirst(a, b) {
  if (a.si != null && b.si != null && a.si !== b.si) return a.si - b.si;
  if ((a.si != null) !== (b.si != null)) return a.si != null ? -1 : 1;
  if (a.si == null && b.hard !== a.hard) return b.hard - a.hard;
  return a.i - b.i;
}

// The strokes a course handicap gives on each hole: one each for every 18
// (or 9), the rest on the hardest holes - by the card's stroke index where
// it has one, else the longest for their par.
export function strokesByHole(holes, courseHandicap) {
  const n = holes.length;
  const ch = Math.max(0, Math.round(courseHandicap));
  const base = Math.floor(ch / n);
  const extra = ch - base * n;
  const hardest = holes
    .map((h, i) => ({ i, si: Number.isFinite(h.si) ? h.si : null, hard: (h.yards ?? 0) / (h.par ?? 4) }))
    .sort(hardestFirst)
    .slice(0, extra)
    .map((x) => x.i);
  return holes.map((_, i) => base + (hardest.includes(i) ? 1 : 0));
}

// The index from a list of differentials, oldest first (the latest 20).
export function indexFrom(diffs) {
  const recent = diffs.slice(-WINDOW);
  const rule = COUNT[recent.length];
  if (!rule) return null;
  const [take, adjust] = rule;
  const best = [...recent].sort((a, b) => a - b).slice(0, take);
  const v = best.reduce((a, d) => a + d, 0) / take + adjust;
  return Math.min(MAX_INDEX, Math.round(v * 10) / 10);
}

// A course handicap: the strokes the index gets over these holes.
// Over nine holes, half the index.
export function courseHandicap(index, { rating, par, slope = STANDARD_SLOPE, holes = 18 }) {
  // (A course of fewer holes - the designer's six, a nine - gets its share
  // of the eighteen-hole handicap, as a ladder's match does.)
  const share = Number.isFinite(holes) && holes > 0 ? Math.min(1, holes / 18) : 1;
  return Math.round((index * share * slope) / STANDARD_SLOPE + (rating - par));
}

// One round's differential, given the index before it (null: none yet).
// holes: [{ par, score, yards }], every hole of the round played.
//   { diff, adjusted, rating, par, courseHandicap, net } or null
export function roundDifferential(holes, indexBefore = null, { slope = STANDARD_SLOPE } = {}) {
  const n = holes.length;
  if ((n !== 18 && n !== 9) || holes.some((h) => !Number.isFinite(h.score) || !Number.isFinite(h.par))) return null;
  const rating = courseRating(holes);
  if (rating == null) return null;
  const par = holes.reduce((a, h) => a + h.par, 0);
  const ch = indexBefore == null ? null : courseHandicap(indexBefore, { rating, par, slope, holes: n });
  const strokes = ch == null ? null : strokesByHole(holes, ch);
  const adjusted = holes.reduce((a, h, i) => a + Math.min(h.score, h.par + (strokes ? 2 + strokes[i] : 5)), 0);
  let diff = (STANDARD_SLOPE / slope) * (adjusted - rating);
  // Nine holes: and what the player would be expected to score over the
  // other nine (half of 1.04 x index + 2.4), or the same again with no
  // index yet.
  if (n === 9) diff += indexBefore == null ? diff : (1.04 * indexBefore + 2.4) / 2;
  const gross = holes.reduce((a, h) => a + h.score, 0);
  return { diff: Math.round(diff * 10) / 10, adjusted, rating: Math.round(rating * 10) / 10, par, courseHandicap: ch, net: ch == null ? null : gross - ch };
}

// A round's holes for the handicap: roundstats.mjs's holes (par, score,
// yards), or null when it isn't a whole 9 or 18.
export function handicapHoles(round) {
  if (round.complete === false) return null;
  const holes = (round.holes ?? []).filter((h) => Number.isFinite(h.score));
  if (holes.length !== 18 && holes.length !== 9) return null;
  return holes.map((h) => ({ par: h.par, score: h.score, yards: h.yards, si: h.si }));
}

// Every counted round, oldest first, through the handicap: each round's
// differential and the index after it, and the index now.
//   { index, rounds: n, history: [{ id, t, diff, index, courseHandicap,
//     net, rating, par }] }
export function handicapReport(rounds) {
  const list = rounds.filter((r) => Number.isFinite(r.t)).sort((a, b) => a.t - b.t);
  const diffs = [];
  const history = [];
  let index = null;
  for (const r of list) {
    const holes = handicapHoles(r);
    if (!holes) continue;
    const d = roundDifferential(holes, index, { slope: r.slope ?? STANDARD_SLOPE });
    if (!d) continue;
    diffs.push(d.diff);
    index = indexFrom(diffs);
    history.push({ id: r.id, t: r.t, diff: d.diff, index, courseHandicap: d.courseHandicap, net: d.net, rating: d.rating, par: d.par });
  }
  const recent = diffs.slice(-WINDOW);
  const rule = COUNT[recent.length];
  return { index, rounds: history.length, counting: rule ? rule[0] : 0, of: recent.length, history };
}
