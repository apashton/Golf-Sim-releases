// The side panel's sections folded on the phone (the owner, 1 November
// 2026: "we should have sections collapsed until expanded. The ladder
// section is so low"): each section with a heading shows just the heading
// until it's tapped, so the panel opens as a short list - Course, Season,
// Match ladder, Scorecard, Options - with what's in each a tap away. The
// round's own lines (what's next, the numbers, the map) have no heading
// and always show. What's been opened stays open while the game's open
// (not kept for next time: the panel opens short again). On the PC the
// sections are as they were, always open.
//
// Pure: public/panelsections.js does the page's side;
// test/panelsections.test.mjs.

// A section's name for what's open: its id, or the panel it's in and its
// heading's words (two panels can both have "Personal bests").
export function sectionKey({ id = "", panel = "", title = "" } = {}) {
  if (id) return `#${id}`;
  const words = String(title).replace(/\s+/g, " ").trim();
  return `${panel || "panel"}:${words}`;
}

// What's open: a set of keys, none to start with.
export const noneOpen = () => new Set();

// Open after a tap on its heading: shut if it was open, open if not.
export function toggled(open, key) {
  const next = new Set(open);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

// Opened (by a tap elsewhere: Play's Match ladders tile opens the ladder
// section).
export function opened(open, key) {
  if (open.has(key)) return open;
  const next = new Set(open);
  next.add(key);
  return next;
}

// The note on the Match ladder heading while it's folded: how many things
// wait for this bay on the online ladders (course/ladderonline.js
// ladderWaiting: [{ line, more }]), or none.
export function waitingNote(waiting = []) {
  const n = (waiting ?? []).reduce((a, w) => a + 1 + Math.max(0, Number(w?.more) || 0), 0);
  return n ? `${n} waiting` : "";
}
