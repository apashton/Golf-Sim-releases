// Keys said in words, taken out on the phone (the owner, 1 November 2026:
// "Remove keyboard references from mobile screens"): a phone has no keys,
// so "Flyover - Esc skips", "J for Alex's" or "Save picture (S)" read as
// noise there. The key labels drawn as <kbd> are hidden by the phone's own
// style (style.css html.pocket kbd); this takes the ones written into a
// line's words out - for the toasts (bay.js toast) and the cards that say
// them. Pure.

// " - Esc skips", " - Esc skips it", " - Esc stops", " - J for Alex's",
// "(S)", "(Esc)", "(Shift + M)", "Esc skips it" alone at the end.
const PATTERNS = [
  /\s*[-–]\s*(Esc|Space|Enter|[A-Z])\s+(skips|stops|closes|replays|watches|plays|for [^-–]+?'s)(\s+(it|them))?(?=\s*(?:[-–.,]|$))/g,
  /\s*\((?:Shift\s*\+\s*)?(?:Esc|Space|Enter|Tab|[A-Z]|←|→|↑|↓)\)/g,
];

export function withoutKeys(text) {
  if (typeof text !== "string" || !text) return text;
  let s = text;
  for (const p of PATTERNS) s = s.replace(p, "");
  return s.replace(/\s{2,}/g, " ").replace(/\s+([.,])/g, "$1").trim();
}

// For a line about to be shown: as it is on a PC, without its keys on the
// phone (the app's page: window.pocket).
export const onThisScreen = (text, phone = typeof globalThis !== "undefined" && !!globalThis.pocket) => (phone ? withoutKeys(text) : text);
