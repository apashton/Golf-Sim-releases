// Online play's lobby before a game: each bay says it's ready (the owner's
// "a ready check and countdown before Start"), the host sees who isn't yet,
// and Start counts down on every bay before the game begins - nobody still
// finding their club. Rematch starts the same game again with the same
// group (the host's last start, again).

export const COUNTDOWN_S = 5;

// Whether a bay's said it's ready (the host's own counts as ready: it
// presses Start).
export function isReady(g, bay) {
  return bay === g?.host || !!g?.lobbyReady?.[bay];
}

// The bays still to say they're ready, by name (bays with a player only).
export function notReadyYet(g) {
  if (!g || g.started) return [];
  return Object.keys(g.bays ?? {})
    .filter((b) => !isReady(g, b) && g.bays[b].online !== false && g.players.some((p) => p.bay === b))
    .map((b) => g.bays[b].name);
}

// "Everyone's ready", "Waiting for Sam's bay to be ready".
export function readyWords(g) {
  const names = notReadyYet(g);
  if (!names.length) return "Everyone's ready";
  return `Waiting for ${names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`} to be ready`;
}

// The countdown as a bay shows it: seconds left from when it heard it
// (each bay counts from its own arrival - a moment apart, nothing to set
// clocks by), or null when there isn't one.
export function countdownLeft(heardAt, secs, now = Date.now()) {
  if (!Number.isFinite(heardAt) || !secs) return null;
  const left = Math.ceil(secs - (now - heardAt) / 1000);
  return left > 0 ? left : 0;
}

// The host's last start again, for a rematch: the same game and settings,
// a new round of it (its own id, so every bay starts it afresh).
export function rematchOf(last, now = Date.now()) {
  if (!last || typeof last !== "object") return null;
  return { ...last, id: `net-${now.toString(36)}` };
}
