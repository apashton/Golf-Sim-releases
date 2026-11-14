// The phone app's top bar while playing (the owner, 29 October 2026: "make
// the top bar disappear during game, can scroll down if need be"): it
// slides away out of the picture once you're playing - at the shot, or
// left a few seconds untouched - and a touch on the tab left at the top
// brings it back, for as long as it's being used and a few seconds more.
// Not a pull from the screen's top edge: that's Android's own pull-down,
// and the two fought (the owner, 1 November 2026). Pinned (the menu's Top
// bar always shown), it stays. Its page: topbarfold.js.

// How long it stays after it was last touched (ms).
export const BAR_IDLE_MS = 6000;

export const cleanBar = (s) => ({ pinned: !!s?.pinned });

// Whether it's shown: always when pinned, out of the game (the phone's
// home screens over it) or while something of it is in use (busy: the
// menu, its modes list, its club or player list, a box asking something);
// else only for BAR_IDLE_MS after it was last shown or touched (touchedAt,
// null: not since the last shot).
export function barShown({ pinned = false, inGame = true, busy = false, touchedAt = null, now = Date.now(), idle = BAR_IDLE_MS } = {}) {
  if (pinned || !inGame || busy) return true;
  return Number.isFinite(touchedAt) && now - touchedAt < idle;
}

// When to look again: the moment it would go (ms from now), or null -
// nothing to wait for.
export function barRecheck({ pinned = false, inGame = true, busy = false, touchedAt = null, now = Date.now(), idle = BAR_IDLE_MS } = {}) {
  if (pinned || !inGame || busy || !Number.isFinite(touchedAt)) return null;
  const left = touchedAt + idle - now;
  return left > 0 ? left : null;
}
