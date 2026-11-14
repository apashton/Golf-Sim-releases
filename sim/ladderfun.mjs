// What makes a match ladder more than a table (docs/LADDER-PLAN.md, "Fun";
// docs/LADDERS.md): the honours board of season champions, rivalries and
// streaks - a giant-killing, a defence held again and again, wins in a
// row - a nudge before the idle slide, and what's waiting for you (a
// challenge to answer, a match to play, a round to send).
//
// Pure, from a ladder's state (sim/matchladder.mjs ladderState):
// course/matchladder.js shows them.

import { RULES, DAY, TIMED } from "./matchladder.mjs";

// A win this unlikely (the winner's odds before it) is a giant-killing.
export const GIANT = 0.3;
// Defences in a row worth a word, and wins in a row.
export const DEFENCES = 3;
export const STREAK = 3;
// Days without a match before the nudge (the slide comes at RULES.idle).
export const IDLE_NUDGE = 14;

const ord = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`;

// The honours board: each season's champion, the latest first, and each
// champion's titles. -> { rows: [{ season, id, name, t }], titles: [{ id,
// name, n }] }
export function honoursBoard(state) {
  const name = (id) => state.players[id]?.name ?? "?";
  const rows = [...state.honours].reverse().map((h) => ({ season: h.season, id: h.champion, name: name(h.champion), t: h.t }));
  const count = new Map();
  for (const h of state.honours) count.set(h.champion, (count.get(h.champion) ?? 0) + 1);
  const titles = [...count.entries()].map(([id, n]) => ({ id, name: name(id), n })).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
  return { rows, titles };
}

// A player's results, oldest first (walkovers too).
const resultsOf = (state, id, upTo = Infinity) => state.results.filter((r, i) => i <= upTo && (r.by === id || r.of === id));

// A player's run now, from their latest results: wins in a row ("won"),
// or defences held in a row as the one challenged ("defended" - a halved
// defence holds too). -> { won, defended }
export function streakOf(state, id, upTo = Infinity) {
  const mine = resultsOf(state, id, upTo);
  let won = 0;
  for (let i = mine.length - 1; i >= 0 && mine[i].winner === id; i--) won++;
  let defended = 0;
  for (let i = mine.length - 1; i >= 0; i--) {
    const r = mine[i];
    if (r.of !== id) continue;
    if (r.winner === r.by) break;
    defended++;
  }
  return { won, defended };
}

// What a result says beyond its score: a giant-killing (the winner's
// odds under GIANT), the one challenged holding on again (DEFENCES in a
// row and more), a winning streak (STREAK and more). -> [words]
export function resultNotes(state, r) {
  if (!r || r.walkover || !r.winner || r.odds == null) return [];
  const i = state.results.indexOf(r);
  const name = (id) => state.players[id]?.name ?? "?";
  const out = [];
  const odds = r.winner === r.by ? r.odds : 1 - r.odds;
  if (odds < GIANT) out.push(`a giant-killing (${name(r.winner)} had a ${Math.round(odds * 100)}% chance)`);
  const s = streakOf(state, r.winner, i);
  if (r.winner === r.of && s.defended >= DEFENCES) out.push(`${name(r.of)}'s ${ord(s.defended)} defence in a row`);
  else if (s.won >= STREAK) out.push(`${name(r.winner)}'s ${ord(s.won)} win in a row`);
  return out;
}

// The idle slide coming (timed ladders): no match for IDLE_NUDGE days and
// not away -> { days, slideIn } (days without one, days till the slide),
// else null.
export function idleWarning(state, ladder, id, now = Date.now()) {
  const p = state.players[id];
  if (!TIMED.has(ladder.play) || !p || p.left) return null;
  if (p.awayUntil && p.awayUntil > now) return null;
  if (state.open.some((m) => m.by === id || m.of === id)) return null;
  // (The bottom rung has nowhere to slide.)
  if (state.rungs.indexOf(id) === state.rungs.length - 1) return null;
  const since = Math.max(p.joined, p.lastMatch ?? 0);
  const days = Math.floor((now - since) / DAY);
  if (days < IDLE_NUDGE) return null;
  return { days, slideIn: Math.max(0, RULES.idle - days) };
}

// What's waiting for this player on the ladder: challenges to answer,
// matches to play (a Postal round of theirs not played yet), each with
// its deadline. -> [{ kind: "answer" | "play", match, other, by }]
export function waitingFor(state, ladder, id) {
  const out = [];
  for (const m of state.open) {
    if (m.by !== id && m.of !== id) continue;
    const other = state.players[m.by === id ? m.of : m.by]?.name ?? "?";
    if (m.acceptedAt == null) {
      if (m.of === id) out.push({ kind: "answer", match: m.match, other, by: m.t + RULES.accept * DAY });
    } else if (ladder.play !== "postal" || m.played?.[id] == null) out.push({ kind: "play", match: m.match, other, by: m.acceptedAt + RULES.play * DAY });
  }
  return out;
}
