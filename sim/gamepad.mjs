// A game controller on the PC - an Xbox or PlayStation pad, plugged in or
// by Bluetooth (the owner: "Can we add controller support on pc thumbstick
// driven"). The right stick swings, as the mouse does on the swing pad
// (sim/mouseswing.mjs): pull it back (down) - the further, the bigger the
// swing, a full one (100%) just short of the stick's edge and an overswing
// past it, up to 105% at the edge itself (stickPercent; the shot is
// sim/madeshot.mjs's) - then push it up through the middle; that's the
// strike. Straight back and up hits it straight; through the middle off to
// one side starts it that way, and a slanted push curves it; how long the
// pull back took against the push through is the swing's rhythm. Let go
// without pushing through - the stick springs back to the middle - and
// there's no shot. The other sticks and buttons are the game's own keys
// (BUTTONS), and in the menu and on a card they move round its buttons
// and press them (gamepad.js).
//
// Pure: fed the stick each frame (x and y from -1 to 1, y down, as the
// browser's Gamepad API gives them; t in ms), tested in
// test/gamepad.test.mjs.

import { JUST_RIGHT, MOST_PCT } from "./mouseswing.mjs";
import { clamp } from "./mathutil.mjs";

export const STICK = {
  // Inside this the stick is at rest in the middle.
  dead: 0.2,
  // Pulled this far down, a backswing has begun.
  back: 0.25,
  // Pushed this far up past the middle: struck.
  through: 0.5,
  // Sideways counts for this much of the mouse's: a thumb wobbles more
  // than a hand does.
  side: 0.5,
  // Resting in the middle this long, never coming through: let go, no shot.
  idleMs: 400,
  // The longest from crossing the middle to pushed through: any slower
  // and the stick only sprang back.
  quickMs: 350,
  // The swing's size from how far back: nothing at `from`, a full swing
  // (100%) at `full`, and on to 105% at the edge.
  from: 0.2,
  full: 0.895,
};

// How big a swing a pull back is (percent): 0 at the dead middle, 100 a
// little short of the edge, MOST (105) right at it.
export function stickPercent(pull, o = STICK) {
  return clamp((100 * (pull - o.from)) / (o.full - o.from), 0, MOST_PCT);
}

// The swing, a frame at a time. step(x, y, t) returns what's happening:
//   null                         nothing (at rest, or pushed up first)
//   { kind: "back", pull, pct }  pulling back: pull 0 - 1 (1 all the
//                                way), pct the swing it is (stickPercent)
//   { kind: "through", pull, pct, push }  coming back up: push 0 - 1
//   { kind: "swing", swing }     struck: readSwing's numbers (power,
//                                pct, start, slant, tempoMs, backMs,
//                                downMs, struck)
//   { kind: "cancel" }           let go: no shot
export class StickSwing {
  constructor(opts = STICK) {
    this.o = { ...STICK, ...opts };
    this.reset();
  }

  reset() {
    this.phase = "rest";
    this.top = null;
    this.cross = null;
    this.last = null;
    this.restSince = null;
    // The pull back as it went ([t, pull]), from when the stick left the
    // middle: for the swing's rhythm.
    this.backs = [];
    this.leftRest = null;
  }

  step(x, y, t) {
    const o = this.o;
    const r = Math.min(1, Math.hypot(x, y));
    const last = this.last;
    // Read between frames as well (gamepad.js), time never runs backwards.
    if (last && t < last.t) t = last.t;
    this.last = { x, y, t };
    if (this.phase === "rest") {
      // Down, and more down than sideways: a backswing - begun when the
      // stick last left the middle.
      if (y >= o.back && y > Math.abs(x) * 0.6) {
        this.phase = "back";
        this.top = { x, y, t, pull: r };
        this.backs = [[this.leftRest ?? t, 0], [t, r]];
        return { kind: "back", pull: r, pct: stickPercent(r, o) };
      }
      if (r < o.dead) this.leftRest = t;
      return null;
    }
    if (this.phase === "back") {
      if (y > 0) this.backs.push([t, r]);
      if (y > 0 && r >= this.top.pull) this.top = { x, y, t, pull: r };
      if (y <= 0) {
        // Through the middle: where and when exactly, between this frame
        // and the last (a quick push crosses it between two).
        const k = last && last.y > 0 ? last.y / (last.y - y) : 1;
        const lx = last?.x ?? x;
        const lt = last?.t ?? t;
        this.cross = { x: lx + (x - lx) * k, t: lt + (t - lt) * k };
        this.phase = "through";
        return this.through(y, t);
      }
      if (r < o.dead) {
        this.restSince ??= t;
        if (t - this.restSince > o.idleMs) {
          this.reset();
          return { kind: "cancel" };
        }
      } else this.restSince = null;
      return { kind: "back", pull: this.top.pull, pct: stickPercent(this.top.pull, o) };
    }
    return this.through(y, t);
  }

  // Coming up through the middle: struck once pushed far enough, quickly
  // enough; else it only sprang back.
  through(y, t) {
    const o = this.o;
    if (y <= -o.through) {
      const swing = this.swing();
      this.reset();
      return { kind: "swing", swing };
    }
    if (t - this.cross.t > o.quickMs) {
      this.reset();
      return { kind: "cancel" };
    }
    return { kind: "through", pull: this.top.pull, pct: stickPercent(this.top.pull, o), push: Math.min(1, Math.max(0, -y / o.through)) };
  }

  // The swing in the mouse's numbers (sim/mouseswing.mjs readSwing): the
  // stick all the way back is "just right" (power), and pct the swing's size (stickPercent); sideways measured as
  // the mouse's would be against its full pull, toned down for a thumb.
  // The rhythm: from leaving the middle to first reaching the top (backMs),
  // and from last leaving the top to the middle (downMs) - a pause at the
  // top is neither.
  swing() {
    const { top, cross } = this;
    const o = this.o;
    const up = top.y - 0;
    const reached = this.backs.find(([, p]) => p >= top.pull - 0.02)?.[0] ?? top.t;
    const left = this.backs.findLast(([, p]) => p >= top.pull - 0.03)?.[0] ?? top.t;
    return {
      power: top.pull,
      pct: stickPercent(top.pull, o),
      start: cross.x * JUST_RIGHT * o.side,
      slant: up > 0.05 ? ((cross.x - top.x) / up) * o.side : 0,
      tempoMs: Math.max(0, cross.t - top.t),
      backMs: Math.max(0, reached - this.backs[0][0]),
      downMs: Math.max(0, cross.t - left),
      struck: true,
    };
  }
}

// The buttons (the standard layout's numbers) as the game's own keys, and
// what each does, for the keys list. In the menu or on a card, A, B and
// the D-pad work its buttons instead (gamepad.js). Y is no key: it opens
// the shot setup (run: "setup"; the camera it used to change is on the
// controller panel, and V).
export const BUTTONS = [
  { index: 0, name: "A", key: "Enter", does: "OK - in the menu and on a card, press the button picked" },
  { index: 1, name: "B", key: "Escape", does: "Back - close, skip a flyover, stop a video" },
  { index: 2, name: "X", key: "n", does: "Next - a new putt, the next hole, start a round" },
  { index: 3, name: "Y", run: "setup", does: "The shot setup: the next shot's curve, spin and height (the left stick moves the spin dot, the D-pad the height; A done, X plain)" },
  { index: 4, name: "LB", key: "ArrowUp", does: "A longer club", repeat: true },
  { index: 5, name: "RB", key: "ArrowDown", does: "A shorter club", repeat: true },
  { index: 6, name: "LT", key: "j", does: "The hole's flyover" },
  { index: 7, name: "RT", key: "q", does: "The swing replay" },
  { index: 8, name: "View", key: "h", does: "The controller panel: every key's action as a button, and these buttons" },
  { index: 9, name: "Menu", key: "m", does: "The menu" },
  { index: 10, name: "Left stick, pressed", key: "s", does: "Look from the ball (the course) or session view (the range)" },
  { index: 11, name: "Right stick, pressed", key: "i", does: "Look along the putt's line" },
  { index: 12, name: "D-pad up", key: "ArrowUp", does: "A longer club", repeat: true },
  { index: 13, name: "D-pad down", key: "ArrowDown", does: "A shorter club", repeat: true },
  { index: 14, name: "D-pad left", key: "ArrowLeft", does: "Aim left", repeat: true },
  { index: 15, name: "D-pad right", key: "ArrowRight", does: "Aim right", repeat: true },
];

// The left stick with the shot setup open (shotsetupcard.js): its dot
// moves DOT.speed of the way across the ball a second pushed right over,
// slower the less it's pushed past the dead middle (squared, for a fine
// touch) - { dx, dy } for a frame ms long (at most DOT.most), or null.
export const DOT = { speed: 1.1, most: 100 };
export function dotStep(x, y, ms, o = STICK) {
  const r = Math.hypot(x, y);
  if (!(r >= o.dead)) return null;
  const push = (Math.min(1, r) - o.dead) / (1 - o.dead);
  const k = (push * push * DOT.speed * clampMs(ms)) / 1000 / r;
  return { dx: x * k, dy: y * k };
}
const clampMs = (ms) => Math.max(0, Math.min(DOT.most, Number(ms) || 0));

// A held button (or the left stick pushed over) goes again after
// REPEAT.first ms, then every REPEAT.every ms.
export const REPEAT = { first: 380, every: 110 };

// The left stick turns the aim: pushed past AIM.from, as the arrow key
// that way, again every AIM.slow ms - every AIM.fast ms pushed all the
// way. 0 for none.
export const AIM = { from: 0.4, slow: 200, fast: 45 };
export function aimEvery(x) {
  const a = Math.abs(x);
  if (a < AIM.from) return 0;
  const k = Math.min(1, (a - AIM.from) / (1 - AIM.from));
  return Math.round(AIM.slow + (AIM.fast - AIM.slow) * k);
}

// Whether a button press repeats now: held since `down` ms, last went at
// `last` ms (null: not yet since the press).
export function repeatsNow(now, down, last, { first = REPEAT.first, every = REPEAT.every } = {}) {
  if (now - down < first) return false;
  return last == null || now - last >= every;
}

// The pad to use from those the browser lists: the one most recently
// used (its timestamp), ignoring empty slots and disconnected ones.
export function pickPad(pads = []) {
  let best = null;
  for (const p of pads) {
    if (!p || !p.connected) continue;
    if (!best || (p.timestamp ?? 0) > (best.timestamp ?? 0)) best = p;
  }
  return best;
}

// ---- Every key from the controller ------------------------------------------------

// Every key's action as a button on the controller panel (View; padpanel.js):
// the D-pad to it, A runs it, as the key would. key: the key pressed (a
// letter as typed), shift: with Shift. row: the keys list's row it's from
// (bay.js SHORTCUTS), so none is left out (test/gamepad.test.mjs).
export const PAD_ACTIONS = [
  { group: "Play", label: "New putt, round or hole", key: "n", row: "N" },
  { group: "Play", label: "Target, or the putting read", key: "t", row: "T" },
  { group: "Play", label: "Look along the putt", key: "i", row: "I  /  Shift + I" },
  { group: "Play", label: "Look along the putt: back", key: "i", shift: true, row: "I  /  Shift + I" },
  { group: "Play", label: "Hole flyover", key: "j", row: "J" },
  { group: "Play", label: "Session view / from the ball", key: "s", row: "S" },
  { group: "Play", label: "Next player / unplayable", key: "u", row: "U" },
  { group: "Play", label: "Next shot is a special one", key: "e", row: "E" },
  { group: "Play", label: "Next swing's power", key: "e", shift: true, row: "Shift + E" },
  { group: "Play", label: "Misread: take the last shot out", key: "Delete", row: "Delete" },
  { group: "Play", label: "Mulligan: play the last stroke again", key: "m", shift: true, row: "Shift + M" },
  { group: "Play", label: "Recording format", key: "r", shift: true, row: "Shift + R" },
  { group: "Play", label: "Tip: don't show again", key: "k", row: "K" },
  { group: "Modes", label: "Driving range", key: "r", row: "R  /  P  /  C  /  O  /  X" },
  { group: "Modes", label: "Putting green", key: "p", row: "R  /  P  /  C  /  O  /  X" },
  { group: "Modes", label: "Chipping", key: "c", row: "R  /  P  /  C  /  O  /  X" },
  { group: "Modes", label: "Course", key: "o", row: "R  /  P  /  C  /  O  /  X" },
  { group: "Modes", label: "Challenges", key: "x", row: "R  /  P  /  C  /  O  /  X" },
  { group: "Modes", label: "Challenges: game 1", key: "1", row: "1  2  3" },
  { group: "Modes", label: "Challenges: game 2", key: "2", row: "1  2  3" },
  { group: "Modes", label: "Challenges: game 3", key: "3", row: "1  2  3" },
  { group: "Modes", label: "Challenges: game 1's option", key: "1", shift: true, row: "Shift + 1  2  3" },
  { group: "Modes", label: "Challenges: game 2's option", key: "2", shift: true, row: "Shift + 1  2  3" },
  { group: "Modes", label: "Challenges: game 3's option", key: "3", shift: true, row: "Shift + 1  2  3" },
  { group: "Camera and replays", label: "Camera: follow / stay put", key: "v", row: "V" },
  { group: "Camera and replays", label: "Swing replay on / off", key: "q", row: "Q" },
  { group: "Camera and replays", label: "Save the replay", key: "s", shift: true, row: "Shift + S" },
  { group: "Camera and replays", label: "Record video: start / stop", key: "v", shift: true, row: "Shift + V" },
  { group: "Camera and replays", label: "What's being recorded / the game", key: "q", shift: true, row: "Shift + Q" },
  { group: "Sound and voice", label: "Sound on / off", key: "a", row: "A  /  Shift + A" },
  { group: "Sound and voice", label: "Sound settings", key: "a", shift: true, row: "A  /  Shift + A" },
  { group: "Sound and voice", label: "Voice on / off", key: "l", row: "L" },
  { group: "Screens", label: "Bay view on / off", key: "b", row: "B" },
  { group: "Screens", label: "Full screen", key: "f", row: "F" },
  { group: "Screens", label: "Graphics", key: "g", row: "G" },
  { group: "Screens", label: "Frame rate", key: "f", shift: true, row: "Shift + F" },
  { group: "Screens", label: "Screens: separate / one", key: "d", shift: true, row: "Shift + D" },
  { group: "Screens", label: "Picture centre left", key: "[", row: "[  /  ]" },
  { group: "Screens", label: "Picture centre right", key: "]", row: "[  /  ]" },
  { group: "Screens", label: "Arrange this screen", key: "b", shift: true, row: "Shift + B" },
  { group: "More", label: "Menu", key: "m", row: "M" },
  { group: "More", label: "Welcome", key: "w", row: "W" },
  { group: "More", label: "The keys", key: "h", row: "H  or  ?" },
];

// The keys list's rows the controller does another way, and how.
export const PAD_ELSEWHERE = {
  "↑ ↓  or  Page Up / Down": "LB / RB, or the D-pad up and down",
  "← →": "The left stick, or the D-pad left and right",
  "Y  /  N or L": "On the card: the D-pad to its button, A to press it",
  "Y  /  K": "On the card: the D-pad to its button, A to press it",
  "Y  /  Esc": "On the box: A to do it, B to cancel",
  "Y  /  K  /  1 - 4": "On the card: the D-pad to its button, A to press it",
  "E  /  Y  /  K": "On the card: the D-pad to its button, A to press it",
  F11: "Full screen on this panel (F11 itself is the Windows app's)",
  ",  /  .": "A camera box's own frame back and frame on buttons",
  "Alt + F4": "The menu's Quit (Menu, then the System page)",
  Controller: "This panel",
};

// The key event an action sends: its key, where it is on the keyboard (a
// digit's place, which the Challenges read with Shift), and Shift.
export function padKeyEvent(a) {
  const k = a.key;
  const code = /^[0-9]$/.test(k) ? `Digit${k}` : /^[a-z]$/.test(k) ? `Key${k.toUpperCase()}` : k === " " ? "Space" : k;
  return { key: a.shift && k.length === 1 ? k.toUpperCase() : k, code, shiftKey: !!a.shift };
}
