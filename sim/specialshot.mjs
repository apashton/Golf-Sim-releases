// Special shots on the page: the "special shot next" toggle before one.
// After a very unusual shot, a message says it's left out of the club's
// numbers (sim/shotmessages.mjs unusualSaid) and Shot history marks what it
// was. The rules for when it's said are shotstats.mjs's (unusualShot).

import { SPECIALS, SPECIAL_NAMES } from "./shotstats.mjs";

// The key that says "special shot" - before a shot, it marks the next one
// (again to go through the kinds, then off); on the range's "Odd shot?"
// card, it answers "a punch".
export const SPECIAL_KEY = "E";

// Off -> punch / low -> part swing -> something else -> off.
export function nextSpecial(current) {
  const i = SPECIALS.indexOf(current);
  return i < 0 ? SPECIALS[0] : (SPECIALS[i + 1] ?? null);
}

// What the player said the next shot would be, in a few words.
export function specialLabel(kind) {
  return SPECIAL_NAMES[kind] ?? "";
}

