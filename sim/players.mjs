// Playing a course with friends: one to eight people sharing the bay and the
// launch monitor, taking turns as they would on a real course. Who plays
// next, who has the honour, when a hole is over for everyone, and who won.
// Pure, so the rules can be tested; course.js does the rest.

export const MAX_PLAYERS = 8;

// A fixed colour per player slot, for their markers on the hole and on the
// map, and their name in the panel. Chosen to stand apart from the grass,
// the sand, the red flag and each other.
export const PLAYER_COLOURS = ["#4c9ffe", "#ff9f1c", "#e45cd8", "#35d0c0", "#e8e85a", "#9d5cff", "#ff4d5e", "#3ddc84"];
// Their names, for picking one (a saved player's colour: sim/profiles.mjs).
export const COLOUR_NAMES = ["Blue", "Orange", "Pink", "Teal", "Yellow", "Purple", "Red", "Green"];

// How the order goes once everyone is off the tee.
export const TURNS = {
  farthest: "Farthest from the hole",
  holeout: "Play the hole out",
};

const MAX_NAME = 20;

export const defaultName = (i) => `Player ${i + 1}`;

// The players from the saved settings: one to eight names, a blank one
// standing in as "Player n". Old settings with no players get one player.
export function playerNames(saved) {
  const list = Array.isArray(saved) ? saved.slice(0, MAX_PLAYERS) : [];
  if (!list.length) return [defaultName(0)];
  return list.map((n, i) => (typeof n === "string" && n.trim() ? n.trim().slice(0, MAX_NAME) : defaultName(i)));
}

// The order off the next tee. The lowest score on the hole just played has
// the honour; a tie keeps the order the players teed off in on that hole.
// With no previous hole (the first tee), the order they're listed in.
//  order   player indices in the order they played the last hole
//  scores  each player's score on it, by player index
export function honourOrder(order, scores = null) {
  if (!scores) return [...order];
  const at = new Map(order.map((p, k) => [p, k]));
  const score = (p) => (Number.isFinite(scores[p]) ? scores[p] : Infinity);
  return [...order].sort((a, b) => score(a) - score(b) || at.get(a) - at.get(b));
}

// Whose turn it is. Everyone tees off first, in honour order; after that
// it's whoever is farthest from the hole (a tie going to the one earlier in
// the order), or with "holeout", each plays their ball until it's in, in
// honour order. A player who has holed out, been given a putt or picked up
// is out of the order. Null once everyone has finished.
//  balls  by player index: { done, teed (has played from the tee), distance }
//  order  player indices in honour order
export function nextPlayer(balls, order, turns = "farthest") {
  const live = order.filter((i) => balls[i] && !balls[i].done);
  if (!live.length) return null;
  if (turns === "holeout") return live[0];
  const onTee = live.find((i) => !balls[i].teed);
  if (onTee != null) return onTee;
  let best = live[0];
  for (const i of live) if (balls[i].distance > balls[best].distance) best = i;
  return best;
}

// A hole moves on only once every player has finished it.
export function holeFinished(balls) {
  return balls.length > 0 && balls.every((b) => b.done);
}

// "E", "+3", "-2".
export const overText = (over) => (over === 0 ? "E" : over > 0 ? `+${over}` : String(over));

// Each player's total and score against par, for the holes they've played.
//  players  [{ name, scores: [strokes or null per hole] }]
//  pars     par per hole
export function standings(players, pars) {
  return players.map((p, index) => {
    let total = 0;
    let over = 0;
    let played = 0;
    p.scores.forEach((s, i) => {
      if (s == null) return;
      total += s;
      over += s - pars[i];
      played++;
    });
    return { index, name: p.name, total, over, played, toPar: overText(over) };
  });
}

// The lowest total wins; level totals share it. Players who played no holes
// don't count. Returns the winners' indices, in the listed order.
export function winners(table) {
  const counted = table.filter((s) => s.played > 0);
  if (!counted.length) return [];
  const low = Math.min(...counted.map((s) => s.total));
  return counted.filter((s) => s.total === low).map((s) => s.index);
}

// "Anna wins!", "Anna and Ben tie!", "Anna, Ben and Cy tie!".
export function winnerTitle(table) {
  const names = winners(table).map((i) => table[i].name);
  if (!names.length) return "Round complete";
  if (names.length === 1) return `${names[0]} wins!`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]} tie!`;
}

// "Anna 74 (+2) · Ben 80 (+8)", best first (ties in the listed order).
export function totalsLine(table) {
  return [...table]
    .filter((s) => s.played > 0)
    .sort((a, b) => a.total - b.total || a.index - b.index)
    .map((s) => `${s.name} ${s.total} (${s.toPar})`)
    .join(" · ");
}

// ---- Simple play ---------------------------------------------------------------

// A player can play "simple" (the owner: "for when my kids play... a lot of
// poor hits that don't need questions"): their shots go into their own
// stats as anyone's do, but nothing asks about them - no club check, no
// "what was it?", no strike, misread or power card, no card at the end of
// a session or tips after it, no key tips while they're hitting. Kept as a
// list of names ({ simple: [names] }, the "profiles" setting).
export function simpleNames(profiles, names = null) {
  const list = Array.isArray(profiles?.simple) ? profiles.simple.filter((n) => typeof n === "string" && n.trim()).map((n) => n.trim()) : [];
  return names ? list.filter((n) => names.includes(n)) : list;
}
export const isSimple = (profiles, name) => !!name && simpleNames(profiles).includes(String(name).trim());

// The profiles after the players' list is saved: the boxes ticked, row by
// row, against the names those rows now have (so a renamed player keeps
// it, and a removed one drops it).
export function profilesFor(names, ticked, profiles = {}) {
  return { ...profiles, simple: names.filter((n, i) => ticked[i]) };
}
