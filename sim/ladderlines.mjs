// A line with a challenge (docs/LADDERS.md, "A line with it"; the owner
// chose it for the phone ladders): a few set things to say on an online
// ladder - sent with a challenge, on a match waiting to be played, or after
// a result - kept on the ladder as a "say" event (sim/matchladder.mjs) and
// shown to both players. Set lines only, never typed: nothing to look
// after, nothing unkind. The store checks a line's number
// (relay/ladders.mjs LINE_COUNT, held to this list by the tests).
//
// Pure: course/ladderlines.js shows and sends them.

// Every line, by number (the number's what's kept - so add to the end only).
export const LADDER_LINES = Object.freeze([
  "Ready when you are",
  "Good luck!",
  "Bring your best",
  "Game on",
  "Well played",
  "Revenge?",
  "Rematch?",
  "Lucky bounce!",
  "Next time...",
  "See you at the top",
]);
// Which fit before a match (with the challenge, on the match waiting), and
// which after it.
export const BEFORE_LINES = Object.freeze([0, 1, 2, 3, 9]);
export const AFTER_LINES = Object.freeze([4, 5, 6, 7, 8]);
// A result's lines are offered for this long after it.
export const AFTER_DAYS = 3;

export const lineWords = (i) => (Number.isInteger(i) ? (LADDER_LINES[i] ?? null) : null);
export const goodLine = (i) => Number.isInteger(i) && i >= 0 && i < LADDER_LINES.length;

// What's been said about a match, oldest first: [{ t, id, name, words }].
export function saidAbout(state, match) {
  return (state.said ?? [])
    .filter((x) => x.match === match && lineWords(x.line))
    .map((x) => ({ t: x.t, id: x.id, name: state.players[x.id]?.name ?? "?", words: lineWords(x.line) }));
}

// In words for a card: "Bob: Good luck! - Ann: Game on".
export const saidWords = (said) => said.map((x) => `${x.name}: ${x.words}`).join(" - ");

// The lines this player can say on a match now - before it's played, or
// after its result (AFTER_DAYS) - less any they've said on it already.
//   m: an open match ({ match, by, of }) or a result ({ match, by, of, t })
export function linesFor(state, id, m, { after = false, now = Date.now() } = {}) {
  if (!m || ![m.by, m.of].includes(id)) return [];
  if (after && now - m.t > AFTER_DAYS * 86400000) return [];
  const mine = new Set((state.said ?? []).filter((x) => x.match === m.match && x.id === id).map((x) => x.line));
  return (after ? AFTER_LINES : BEFORE_LINES).filter((i) => !mine.has(i));
}
