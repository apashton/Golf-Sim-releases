// Changing several of a recording's layers at once, and the exact sizes
// their looks can be given (the owner, 1 November 2026: "When we group a
// set of things we need to be able to change all those boxes together or
// individually ... Text size, border size etc all need to be given a
// specific number so we can make sure all border areas 5 pixels thick for
// example"). Pure: videopanel.js draws the settings, compositor.js the
// layers; a layout is sim/videolayout.mjs's.

import { setLayer } from "./videolayout.mjs";

// What each layer is rather than how it looks - which number, which piece
// of information, which camera, its words - is never changed on several at
// once: picking six numbers and choosing "Carry" would make all six the
// carry.
export const OWN_KEYS = ["stat", "field", "slot", "text", "tiles", "view", "show"];

// A change made to each of `ids` that has it (a camera has no text size: a
// look's change only goes to those it means something to - cleanLayer
// leaves it off the rest). With more than one, what's each one's own
// (OWN_KEYS) is left alone.
export function setLayers(layout, ids, patch) {
  const list = [...new Set(ids)].filter((id) => layout.layers.some((l) => l.id === id));
  if (!list.length) return layout;
  const shared = list.length > 1 ? Object.fromEntries(Object.entries(patch).filter(([k]) => !OWN_KEYS.includes(k))) : patch;
  if (!Object.keys(shared).length) return layout;
  let out = layout;
  for (const id of list) out = setLayer(out, id, shared);
  return out;
}

// Which layers a change of a picked layer goes to: the group's, with "the
// whole group" chosen (and it in one), several picked, or it alone.
export function changeTargets(layout, { selected = null, picked = [], wholeGroup = true } = {}) {
  if (picked.length > 1) return picked;
  if (!selected) return [];
  const g = layout.layers.find((l) => l.id === selected)?.group;
  if (!g || !wholeGroup) return [selected];
  return layout.layers.filter((l) => l.group === g).map((l) => l.id);
}

// ---- Exact sizes ------------------------------------------------------------------------

// Text as many pixels high as asked, kept for a 1080p picture (and scaled
// with it): its biggest words (a number, a line) that size - labels and
// units smaller, as ever - or, at 0, as big as fits the box, the slider's
// share of that (textScale).
export { MAX_TEXT_PX } from "./videolayout.mjs";
// The words' size against what fits: `base` the main words' size, in the
// picture's pixels, with nothing scaled (k = 1). lineScale: the picture's
// height against 1080.
export function textMul(s, base) {
  if (s?.textPx > 0 && base > 0) return (s.textPx * (s.lineScale ?? 1)) / base;
  return s?.textScale ?? 1;
}

// A words layer's rounded corners: as many pixels as asked (kept for
// 1080p), or at 0 a share of the box's size (r), as they always were; none
// without Rounded corners.
export function cornerOf(s, w, h, r = 0.14) {
  if (!s?.rounded) return 0;
  if (s.cornerPx > 0) return Math.min(Math.min(w, h) / 2, s.cornerPx * (s.lineScale ?? 1));
  return Math.min(w, h) * r;
}
