// The flag at the hole: in or out, as a player would have it.
//
// A chip or a pitch - anything played from off the green - is played with
// the flag in, and it stays in while the ball rolls (the physics has the
// pin then: a pole in the cup, sim/cup.mjs). A putt is played with it out: from a
// long way, it stays in while the player lines up, so the hole can be
// seen, and is lifted out as the putt is struck; from close in (15 ft or
// less) it's out from the start, and only the hole shows.
// Pure functions, shared by the modes that draw a flag and the tests.

import { FOOT } from "./putting.mjs";

// Within this far, a putt is lined up with the flag already out.
export const FLAG_OUT_FEET = 15;
// How long the flag takes to lift out and fade away once a putt is struck.
export const FLAG_FADE = 0.5;
// How far it rises as it goes, metres.
export const FLAG_LIFT = 0.6;

// How the flag is played for a shot:
//   "in"     it stays in throughout (a shot from off the green)
//   "pulled" in while lining up, taken out when the putt is struck
//   "out"    not there at all, only the hole (a putt from 15 ft or less)
// putting: whether the ball is on the green (being putted); distance: from
// the ball to the hole, metres.
export function flagFor({ putting, distance }) {
  if (!putting) return "in";
  return distance <= FLAG_OUT_FEET * FOOT + 1e-9 ? "out" : "pulled";
}

// How the flag looks, `since` seconds after the shot was struck (null
// before it's struck): { visible, lift (metres), opacity }.
export function flagLook(plan, since = null) {
  if (plan === "out") return { visible: false, lift: 0, opacity: 0 };
  if (plan !== "pulled" || since == null || since <= 0) return { visible: true, lift: 0, opacity: 1 };
  const k = Math.min(1, since / FLAG_FADE);
  if (k >= 1) return { visible: false, lift: FLAG_LIFT, opacity: 0 };
  // Eased: it comes up briskly and slows as it clears the cup.
  const up = 1 - (1 - k) * (1 - k);
  return { visible: true, lift: FLAG_LIFT * up, opacity: 1 - k };
}
