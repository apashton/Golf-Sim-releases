// Playing with a finger: what the keyboard's keys do, on the touch screen
// (the owner, 24 October 2026: "Putting doesn't work on touch screen...
// Changing direction doesn't seem to work on mobile either. Might need a
// full workaround of the controls from a touchscreen point of view").
// With the swing pad on a touch screen - the Android app played on the
// touch screen, or any screen a finger works - a strip of buttons on the
// other side of the picture from the pad:
//   - the aim, ◀ ▶ (held, it keeps turning), wherever ← → turn it: the
//     course, a challenge being played, the putting green; and a finger
//     drawn across the picture turns it too, the aim following the finger;
//   - the club, ▲ ▼, wherever ↑ ↓ change it (a longer club, a shorter);
//   - a few buttons for what's useful just then - the keys the tips would
//     suggest (sim/keyhints.mjs), each with a word or two for a button:
//     Ball view and Unplayable in the trees, Read and Along the line on a
//     green, Next hole, Skip a flyover, Replay after a shot...
// Each does just what its key does (app.js pressKey), so it works wherever
// that key does. While the strip's there the key tips don't pop up: they
// name keys a finger hasn't got, and the strip has their buttons.
//
// Pure: public/touchcontrols.js draws it; test/touchcontrols.test.mjs.

import { HINTS, pressOf, clubChoice } from "./keyhints.mjs";

// The strip's buttons' words, by tip (sim/keyhints.mjs HINTS ids). Only
// these tips become buttons: the rest are the strip's own (the aim, the
// club), the top bar's (the menu), on a card that's tapped
// itself (a scramble's ball, a drop, the Challenges' games) or not for a
// finger (the keys page).
export const TOUCH_WORDS = {
  "flyover-stop": "Skip",
  "look-down-stop": "Stop",
  "turn-now": "Next player",
  "ball-view": "Ball view",
  "ball-view-back": "Behind ball",
  mulligan: "Mulligan",
  unplayable: "Unplayable",
  "relief-keep": "As it lies",
  "relief-drop": "Drop here",
  "relief-back": "Choices",
  "green-sections": "Along line",
  "course-line": "Read",
  "next-hole": "Next hole",
  flyover: "Flyover",
  "course-start": "Start round",
  "range-session-back": "Back to tee",
  "gapping-skip": "Skip club",
  "range-target": "Target",
  "range-session": "Session",
  "putt-read": "Read",
  "putt-new": "New putt",
  "pong-new": "New game",
  "chip-new": "New distance",
  "challenge-again": "Again",
  "challenge-skip": "Skip",
  "challenge-cards": "Games",
  replay: "Replay",
  who: "Next player",
};

// At most this many at once: about what's just happened first, then where
// you are, then the rest (as the command centre's Keys box orders them).
export const MAX_ACTIONS = 4;

// The buttons for now: [{ id, label, press: { key, shift }, title }] -
// press is the key a tap sends; title the tip's own words. None while
// something else is up (the menu, a card being answered...).
export function touchActions(ctx, { max = MAX_ACTIONS } = {}) {
  if (!ctx || ctx.busy) return [];
  const lead = (h) => (h.soon ? 0 : h.first ? 1 : 2);
  const fits = HINTS.filter((h) => TOUCH_WORDS[h.id] && h.when(ctx)).sort((a, b) => lead(a) - lead(b));
  const out = [];
  for (const h of fits) {
    const press = pressOf(typeof h.key === "function" ? h.key(ctx) : h.key);
    if (!press || out.length >= max || out.some((o) => o.press.key === press.key && o.press.shift === press.shift)) continue;
    out.push({ id: h.id, label: TOUCH_WORDS[h.id], press, title: typeof h.text === "function" ? h.text(ctx) : h.text });
  }
  return out;
}

// Whether ← → turn the aim now (app/keys.js): on the course with a round
// going (not between holes, nor at a drop's card), in a challenge being
// played, and on the putting green (golf pong too).
export const aimsNow = (c) => !!c && ((c.mode === "course" && c.round && !c.holeDone && !c.relief) || (c.mode === "challenges" && c.challenge === "playing") || c.mode === "putting");

// Whether a drop's spot is being chosen (course/dropspot.js): the strip's
// ◀ ▶ move it across and ▲ ▼ further back or nearer (the arrows'), and a
// finger on the picture puts it there rather than turning the aim.
export const placingNow = (c) => !!c && c.mode === "course" && !!c.placing;

// Whether ↑ ↓ change club now: a shot with a club to come, on the range,
// the chipping green, a course round or a challenge being played.
export const clubsNow = (c) => !!c && clubChoice(c) && !(c.mode === "course" && !c.round) && !(c.mode === "challenges" && c.challenge !== "playing");

// Whether the arrows are the cart's (course/buggy.js driveKey): between
// holes with the cart's drive watched - "watch" before the wheel's taken
// (▲ takes it, as ↑ does), "drive" once it is: ▲ ▼ its speed, ◀ ▶ its
// wheel, held to keep it turned.
export const drivesNow = (c) => (c && c.mode === "course" && (c.cart === "watch" || c.cart === "drive") ? c.cart : null);
// The strip's words for them.
export const DRIVE_TOUCH = { watch: "Drive", drive: "Speed", steer: "Steer" };

// A finger drawn across the picture: the aim a step (a key press: a degree
// on the course, a quarter on a green) for each AIM_DRAG_PX it goes
// sideways, right turning it right - what's left over carried to the next
// move. Returns { steps (+ right), carry }.
export const AIM_DRAG_PX = 12;
export function dragSteps(dx, carry = 0, per = AIM_DRAG_PX) {
  const total = carry + dx;
  const steps = Math.trunc(total / per);
  return { steps, carry: total - steps * per };
}
// (A drag isn't the aim's until it's gone this far sideways - and more
// sideways than up or down - so a tap, or a thumb resting, turns nothing.)
export const DRAG_START_PX = 10;
export const isAimDrag = (dx, dy) => Math.abs(dx) >= DRAG_START_PX && Math.abs(dx) > Math.abs(dy);

// ◀ ▶ held: one step at once, then on again after a moment, every so often
// (milliseconds) - as a held arrow key repeats.
export const REPEAT = { wait: 350, every: 60 };

// Whether the strip's shown: the swing pad on a touch screen, in the one
// window (with separate windows the pad's on the game window, played from
// the controls window's keys).
export const touchStripOn = ({ swingPad = false, touch = false, separate = false } = {}) => !!swingPad && !!touch && !separate;
