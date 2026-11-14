// The side panel (each mode's settings, and in one window the shot's
// numbers) folds away to give the picture the whole width, on the PC and
// the phone (the owner, 24 October 2026: "On both mobile and PC, the side
// section of this should be collapsible. And collapse automatically when
// playing unless the user pins it"):
//   - the tab at its edge folds it and opens it again;
//   - unpinned, it folds by itself as play starts - a shot, a course round
//     starting - and stays as it's left until the next;
//   - pinned, it stays open while you play (the pin by the tab, or the
//     menu's Screens -> Side panel pinned open);
// While it's folded, the shot's numbers and notes are over the picture, as
// in bay view (style.css body.side-folded). One window only: with separate
// windows the panel is the controls window's, and bay view has none.
//
// Pure: public/sidepanel.js draws it; test/sidepanel.test.mjs.

export const SIDE_DEFAULT = Object.freeze({ pinned: false, folded: false });

export function cleanSide(v) {
  return { pinned: v?.pinned === true, folded: v?.folded === true };
}

// The state after something happens:
//   "play"   a shot, or a round starting - folds it unless it's pinned
//   "toggle" the tab: folded <-> open
//   "open" / "fold"
//   "pin" / "unpin" - pinning opens it too
export function sideAfter(state, what) {
  const s = cleanSide(state);
  switch (what) {
    case "play":
      return s.pinned ? s : { ...s, folded: true };
    case "toggle":
      return { ...s, folded: !s.folded };
    case "open":
      return { ...s, folded: false };
    case "fold":
      return { ...s, folded: true };
    case "pin":
      return { pinned: true, folded: false };
    case "unpin":
      return { ...s, pinned: false };
    default:
      return s;
  }
}

// Whether the panel's folded on this screen just now: never in bay view or
// with separate windows (it isn't there to fold).
export const foldedHere = (state, { bay = false, separate = false } = {}) => !bay && !separate && cleanSide(state).folded;
