// Online play: watching another player's view (the owner, 29 October 2026:
// "What the possibility on view the other person's view point, say you
// are on the green and don't want to putt but watch the other players
// from Thier view?" - then "Let's do all the follow [ons] from today's
// work"): who can be watched, the next one round, and when watching
// stops. course/watch.js moves the camera. Nothing more goes between the
// bays for it: a friend's ball where it lies and their flights as they're
// struck are on every bay already. Pure.

// Who can be watched: the other bays' players still playing the hole.
// players: the round's ({ remote, done, name }); the indexes, in order.
export function watchable(players = []) {
  const out = [];
  players.forEach((p, i) => {
    if (p?.remote && !p.done) out.push(i);
  });
  return out;
}

// The next to watch after `current` (an index, or null for the first),
// round again from the start; null when there's nobody - or nobody else
// (one friend, already watched: still them).
export function nextWatch(players = [], current = null) {
  const list = watchable(players);
  if (!list.length) return null;
  if (current == null) return list[0];
  return list.find((i) => i > current) ?? list[0];
}

// Whether watching stops now, and why: { stop, why } - "hit" when a
// player here's own ball's in the air (they've swung: their shot's the
// one to see), "done" when the friend has finished the hole and nothing
// of theirs is still flying here, "gone" when they've left the game or
// the hole has changed.
//   watched   the player being watched (or null)
//   players   the round's players now
//   ownFlying a ball of this bay's in the air
//   flying    a shot of theirs flying (or waiting to) here
export function watchStops({ watched = null, players = [], ownFlying = false, flying = false } = {}) {
  if (!watched) return { stop: false, why: "" };
  if (!players.includes(watched)) return { stop: true, why: "gone" };
  if (ownFlying) return { stop: true, why: "hit" };
  if (watched.done && !flying) return { stop: true, why: "done" };
  return { stop: false, why: "" };
}

// What's said as watching stops, or "" for nothing ("Sam's holed out -
// back to your ball").
export function stopWords(name, why) {
  if (why === "done") return `${name} has finished the hole - back to your ball`;
  if (why === "gone") return `${name} isn't on this hole now - back to your ball`;
  return "";
}
