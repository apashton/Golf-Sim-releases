// The ladder handicap (docs/LADDER-PLAN.md, "Handicaps built from ladder
// matches"): a handicap index from a player's ladder rounds only, worked
// out the World Handicap System's way as sim/handicap.mjs does - each
// round's differential, the best of the latest 20, each hole capped at net
// double bogey - so the strokes on a handicap ladder come from scores both
// players saw, not from rounds kept on one PC.
//
//   - It starts from the player's own index (their real one on a launch
//     monitor, their mouse or controller one on a made-up ladder) until
//     there are ROUNDS_NEEDED ladder rounds.
//   - Holes not played - a match won 5&4 - count as net par, as the
//     System counts holes not played.
//   - It can't rise fast: past SOFT_CAP over the lowest index of the last
//     year it rises at half the rate, and HARD_CAP over it is the most.
//
// Pure: sim/matchladder.mjs keeps each player's rounds and asks this for
// the index as a challenge is accepted (when it's frozen for the match).

import { roundDifferential, indexFrom, courseRating, courseHandicap, strokesByHole, STANDARD_SLOPE, MAX_INDEX } from "./handicap.mjs";

export const ROUNDS_NEEDED = 3;
export const SOFT_CAP = 3;
export const HARD_CAP = 5;
const YEAR = 365 * 24 * 3600 * 1000;

// A ladder round's holes as the handicap reads them: [{ par, yards, si,
// score }], a hole not played (score null) as net par for a player of
// `index` - par and the strokes they'd get there (par + 2, the System's
// "most likely", with no index yet).
export function filledHoles(holes, index) {
  if (!holes?.length) return null;
  const rating = courseRating(holes);
  const par = holes.reduce((a, h) => a + h.par, 0);
  const n = holes.length === 9 ? 9 : 18;
  const strokes = index == null || rating == null ? null : strokesByHole(holes, courseHandicap(index, { rating, par, slope: STANDARD_SLOPE, holes: n }));
  return holes.map((h, i) => ({ par: h.par, yards: h.yards, si: h.si, score: Number.isFinite(h.score) ? h.score : h.par + (strokes ? strokes[i] : 2) }));
}

// The ladder handicap from a player's ladder rounds, oldest first:
// [{ t, holes: [{ par, yards, si, score }] }], and their own index to start
// from (null: none). As of `now` (ms).
//   { index, from: "ladder" | "own" | null, rounds, capped }
export function ladderIndex(rounds, own = null, now = Date.now()) {
  const list = (rounds ?? []).filter((r) => Number.isFinite(r.t) && r.t <= now).sort((a, b) => a.t - b.t);
  const diffs = [];
  // Every index along the way, for the lowest of the last year (the own
  // index counts as the first).
  const history = Number.isFinite(own) ? [{ t: list[0]?.t ?? now, index: own }] : [];
  let index = Number.isFinite(own) ? own : null;
  let counted = 0;
  let capped = false;
  for (const r of list) {
    const holes = filledHoles(r.holes, index);
    const d = holes && roundDifferential(holes, index);
    if (!d) continue;
    diffs.push(d.diff);
    counted++;
    if (counted < ROUNDS_NEEDED) continue;
    let next = indexFrom(diffs);
    if (next == null) continue;
    const low = Math.min(...history.filter((h) => h.t >= r.t - YEAR).map((h) => h.index));
    // (Held back or not: as the latest index was worked out - not for ever
    // once it ever was.)
    capped = false;
    if (Number.isFinite(low) && next > low + SOFT_CAP) {
      const soft = low + SOFT_CAP + (next - low - SOFT_CAP) / 2;
      next = Math.min(soft, low + HARD_CAP);
      capped = true;
    }
    index = Math.min(MAX_INDEX, Math.round(next * 10) / 10);
    history.push({ t: r.t, index });
  }
  const from = counted >= ROUNDS_NEEDED ? "ladder" : Number.isFinite(own) ? "own" : null;
  return { index: from === "ladder" ? index : Number.isFinite(own) ? own : null, from, rounds: counted, capped };
}

// Where it comes from, in words: "from 4 ladder rounds", "your own
// handicap - 2 more ladder rounds and it's the ladder's".
export function ladderIndexWords(h) {
  if (h.from === "ladder") return `from ${h.rounds} ladder round${h.rounds === 1 ? "" : "s"}${h.capped ? " (held back from rising too fast)" : ""}`;
  const left = ROUNDS_NEEDED - h.rounds;
  if (h.from === "own") return `your own handicap - ${left} more ladder round${left === 1 ? "" : "s"} and it's the ladder's`;
  // (18: sim/matchladder.mjs NO_INDEX.)
  return `no handicap yet, so 18 for now - ${left} ladder round${left === 1 ? "" : "s"} to get one`;
}
