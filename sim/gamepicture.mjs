// The game's picture lost and got back. When the graphics process crashes
// (the driver's own process, not the page), the game's 3D picture is lost
// until the card gives it back - and a recording went on drawing the empty
// space where it had been, the cameras and the words over nothing, for the
// rest of the file (the owner, 20 October 2026: 29 minutes into a
// recording "the second half of the video was a bit buggy and missing the
// main game screen"). So while it's lost the recording holds the last
// picture it had, dimmed, with a line saying it's coming back
// (compositor.js); the card usually gives it back within a few seconds, and
// if it hasn't after GAME_BACK_WITHIN_MS the page is opened again to get it
// back, the recording carrying on in its next file - unless that would end
// a round or a game in progress, when the player is told how instead.
// Pure, for the page and the tests.

// How long the card has to give the picture back before the page is
// opened again for it.
export const GAME_BACK_WITHIN_MS = 15_000;
// How often the recording keeps a copy of the game's picture to hold if
// it's lost, and how wide (it's only shown dimmed, for a few seconds).
export const HELD_EVERY_MS = 1000;
export const HELD_WIDTH = 960;
// What the recording says over the held picture.
export const LOST_LINE = "The game's picture is coming back...";

// What to do about a picture lost lostFor ms ago:
//   "wait"    the card may yet give it back
//   "reload"  open the page again (nothing in progress would end)
//   "tell"    say how to get it back: reloading would end what's in
//             progress (busy: "the round in progress", say)
// Once the page has said, it isn't said again (told).
export function afterLoss({ lostFor, busy = null, told = false }) {
  if (!(lostFor >= GAME_BACK_WITHIN_MS)) return "wait";
  if (!busy) return "reload";
  return told ? "wait" : "tell";
}

// What the player's told when reloading would end something.
export function lostWords(busy) {
  return `The game's picture didn't come back after the graphics card crashed - Menu → System → Reload gets it back (${busy} will end, its scores so far saved)`;
}

// The held copy's size: as wide as HELD_WIDTH at most, the picture's shape
// kept; null for a picture with no size.
export function heldSize(w, h, most = HELD_WIDTH) {
  if (!(w > 0) || !(h > 0)) return null;
  const s = Math.min(1, most / w);
  return { w: Math.max(1, Math.round(w * s)), h: Math.max(1, Math.round(h * s)) };
}
