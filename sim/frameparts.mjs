// What a frame's own work was spent on (report #589, 5 November 2026: "hugh
// slow down around water" - fifty frames in a row of 130 - 190 ms, all of
// it in the game's own update, and nothing in the long frames' list to say
// which part of it). The main loop (app.js) times each part of the update
// - the mode's own step, the sound, the scenery's motion, the trees, the
// shadow check, the recording's picture, the frame rate - and the course
// its own steps (course.js update: the flight, the cart ride, the
// celebration, the putt's read, the camera ...); a long frame then names
// the parts that took the time (sim/longframes.mjs). And any page layout
// forced in it - the browser working out where everything on the page
// goes, mid-script (its own long-frame record, where it has one).
//
// Pure: given a clock, it keeps and words the numbers.

// The parts of the main loop's update, in words.
export const PART_WORDS = {
  play: "the play",
  sound: "the sound",
  scenery: "the scenery's motion",
  trees: "trees near and far",
  shadows: "the shadow check",
  recording: "the recording's picture",
  rate: "the frame rate",
  other: "the rest of the update",
};
// The course's own steps (course.js update), in words.
export const STEP_WORDS = {
  flight: "the ball's flight",
  ride: "the cart ride",
  celebration: "the celebration",
  read: "the putt's read",
  camera: "the camera",
  grid: "the green's grid",
  ground: "the grass round the ball",
  sprays: "sand and water thrown up",
  flyover: "the flyover",
  remote: "the other bays' shots",
  other: "the rest of the course's step",
};
// A part is named when it took this long (ms); the whole is said when the
// parts the game times took this long between them.
export const PART_MS = 10;
export const OWN_MS = 50;
// Page layout forced mid-script is named from this long (ms).
export const LAYOUT_MS = 20;

// Laps of a stopwatch: start(), then lap(name) after each part - the time
// since the last lap (or the start) is that part's, added to what it has
// already in this frame. skip() starts the next part from now (time not
// counted: the drawing). take() hands over the parts and starts again.
export class PartClock {
  constructor(now = () => performance.now()) {
    this.now = now;
    this.parts = {};
    this.at = null;
  }
  start() {
    this.parts = {};
    this.at = this.now();
  }
  lap(name) {
    const t = this.now();
    if (this.at != null) this.parts[name] = (this.parts[name] ?? 0) + Math.max(0, t - this.at);
    this.at = t;
  }
  skip() {
    this.at = this.now();
  }
  take() {
    const out = this.parts;
    this.parts = {};
    this.at = null;
    return out;
  }
}

const ms = (n) => `${Math.round(n)} ms`;

// The parts over `min` ms, most first, in words: "the cart ride 120 ms,
// the camera 14 ms".
export function partList(parts = {}, words = PART_WORDS, min = PART_MS) {
  return Object.entries(parts ?? {})
    .filter(([, v]) => Number.isFinite(v) && v >= min)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${words[k] ?? k} ${ms(v)}`);
}

// A long frame's own work in words ([] when it wasn't much): the parts
// that took the time (the course's own steps inside its own: "the game's
// own work: the play 130 ms (the cart ride 120 ms)"), and page layout
// forced in it.
// parts: the main loop's ({ play, sound, ... }, ms; the quiet moments' work
// is said on its own and left out). steps: the course's. layout: ms of
// forced page layout.
export function ownWorkWords({ parts = null, steps = null, layout = 0 } = {}) {
  const p = { ...(parts ?? {}) };
  delete p.idle;
  const total = Object.values(p).reduce((a, v) => a + (Number.isFinite(v) ? v : 0), 0);
  const out = [];
  if (total >= OWN_MS) {
    const inner = partList(steps, STEP_WORDS);
    const list = partList(p).map((w) => (inner.length && w.startsWith(`${PART_WORDS.play} `) ? `${w} (${inner.join(", ")})` : w));
    if (list.length) out.push(`${ms(total)} in the game's own work: ${list.join(", ")}`);
  }
  if (layout >= LAYOUT_MS) out.push(`${ms(layout)} working out the page's layout (forced mid-script)`);
  return out;
}
