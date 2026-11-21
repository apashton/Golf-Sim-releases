// The Postal ladder's matches (docs/LADDERS.md, "The Postal ladder"): each
// player plays the same round on their own, when they like within the
// ladder's days, in one go - the course, tees, cups and weather fixed when
// the challenge is accepted, and so is the luck: the same draw for the same
// shot (hole, stroke) in both rounds. Neither sees the other's scores until
// both are in (the relay's store keeps them: relay/ladders.mjs); then the
// reveal, hole by hole, with the match as it went.
//
// Pure: course/ladderpostal.js plays the rounds and shows the reveal; the
// ladder's own rules (begun, played, the walkover at the deadline) are in
// sim/matchladder.mjs.

import { matchResult, pickUps, PICK_UP } from "./matchladder.mjs";

// A seeded stream of numbers in [0, 1) (mulberry32).
function stream(seed) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The luck of one shot in a Postal match: a stream of numbers from the
// match's seed, the hole (0 for the first), the stroke on it (0 for the
// tee shot) and what it's for ("lie": how the lie plays, "swing": a
// made-up swing's spread) - the same for both players' rounds.
export function postalLuck(seed, hole, stroke, what = "") {
  let h = (seed >>> 0) ^ 0x9e3779b9;
  for (const c of `${hole}|${stroke}|${what}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return stream(h);
}

// Where each of the two is with their round: "ready" (not begun), "begun"
// or "played" - from the ladder's open match (sim/matchladder.mjs).
export const roundState = (m, id) => (m?.played?.[id] != null ? "played" : m?.begun?.[id] != null ? "begun" : "ready");

// The key a round's progress is kept under on this PC.
export const roundKey = (code, match) => `${code}:${match}`;

// Where a round broken off picks up (the page closed part way): kept as
// { scores, next, playing } - next the hole to play next (0 for the first),
// playing the hole it was on if a shot had been taken there. That hole is
// lost (a pick-up): starting it again from the tee would be a second go
// at it. -> { from (1 for the first), scores (as kept), lost (the hole
// lost, 1 for the first, or null), done }
export function carryOn(kept, holes) {
  const scores = Array.isArray(kept?.scores) ? kept.scores.slice(0, holes) : [];
  let next = Number.isInteger(kept?.next) ? kept.next : 0;
  if (!Number.isInteger(kept?.next)) while (next < scores.length && Number.isFinite(scores[next])) next++;
  const lost = Number.isInteger(kept?.playing) && kept.playing === next && next < holes ? next + 1 : null;
  if (lost) next++;
  return { from: Math.min(holes, next + 1), scores, lost, done: next >= holes };
}

// The reveal: both rounds hole by hole, the match as it went.
//   holes: [{ par, ... }]; a, b: the two players' hole scores (null: not
//   played - a pick-up); strokes: each one's strokes a hole.
//   { rows: [{ hole, par, a, b, gotA, gotB, won: "a" | "b" | null, up,
//     after: "decided" | null }], result: matchResult, decidedAt }
//   up: + for a, - for b, after the hole; after: the match was already
//   decided before this hole (shown, but not counted).
export function revealRows(holes, a, b, strokesA = [], strokesB = []) {
  const n = holes.length;
  const pa = pickUps(a, n);
  const pb = pickUps(b, n);
  let up = 0;
  let decidedAt = null;
  const rows = holes.map((h, i) => {
    const na = pa[i] - (strokesA[i] ?? 0);
    const nb = pb[i] - (strokesB[i] ?? 0);
    const won = na < nb ? "a" : nb < na ? "b" : null;
    const after = decidedAt != null ? "decided" : null;
    if (!after) {
      if (won === "a") up++;
      else if (won === "b") up--;
      if (Math.abs(up) > n - i - 1) decidedAt = i;
    }
    return { hole: i + 1, par: h.par, a: pa[i] === PICK_UP ? null : pa[i], b: pb[i] === PICK_UP ? null : pb[i], gotA: strokesA[i] ?? 0, gotB: strokesB[i] ?? 0, won: after ? null : won, up, after };
  });
  return { rows, result: matchResult(pa, pb, strokesA, strokesB), decidedAt };
}

// The match after a hole in words: "Alex 2 up", "All square".
export const upWords = (up, nameA, nameB) => (up > 0 ? `${nameA} ${up} up` : up < 0 ? `${nameB} ${-up} up` : "All square");

// ---- Watching the other's round ------------------------------------------------
// After the reveal each player can see the other's shots, hole by hole
// (docs/LADDERS.md, "Watch their round"): sent with the round's scores, a
// few short fields a shot, kept by the store for the two of them
// (relay/ladders.mjs cleanShots, watch).

// A round's shots from its players's log (course.js record: { g: { id,
// hole }, c club, lie, tg: { d, f }, to, pen }) - only this round's, the
// first `holes` holes. -> [hole][shot] = [club, lie, yards before, yards
// after, where it finished, penalty?] (an empty list for a hole not played
// here: mergeShots keeps one played before, on another day).
export function postalShots(log, holes, roundId = null) {
  const out = Array.from({ length: holes }, () => []);
  for (const e of Array.isArray(log) ? log : []) {
    if (!e?.g || (roundId != null && e.g.id !== roundId)) continue;
    const i = (e.g.hole ?? 0) - 1;
    if (i < 0 || i >= holes) continue;
    const shot = [String(e.c ?? "?"), String(e.lie ?? ""), Math.round(e.tg?.d ?? 0), Math.round(e.tg?.f ?? 0), e.tg?.made ? "cup" : String(e.to ?? "")];
    if (e.pen) shot.push(String(e.pen));
    out[i].push(shot);
  }
  return out;
}
// Shots kept from before (a round picked back up) and this time's: a hole's
// from this time when it has any, else as kept.
export function mergeShots(kept, fresh) {
  const n = Math.max(kept?.length ?? 0, fresh?.length ?? 0);
  return Array.from({ length: n }, (_, i) => (fresh?.[i]?.length ? fresh[i] : (kept?.[i] ?? [])));
}
// A shot in words: "D 412 to 165, fairway" - a putt's in feet, "holed" in the cup.
const PLACES = { fairway: "fairway", rough: "rough", deep: "deep rough", green: "green", fringe: "fringe", bunker: "bunker", sand: "bunker", water: "water", cup: "holed", trees: "trees", out: "out of bounds" };
export function shotWords(shot) {
  const [club, , d, f, to, pen] = Array.isArray(shot) ? shot : [];
  const putt = club === "PT";
  const len = (y) => (putt ? `${Math.round(y * 3)} ft` : `${y}`);
  const where = to === "cup" ? "holed" : (PLACES[to] ?? to ?? "");
  return `${club} ${len(d)}${to === "cup" ? "" : ` to ${len(f)}`}${where ? `, ${where}` : ""}${pen ? ` (${pen})` : ""}`;
}
