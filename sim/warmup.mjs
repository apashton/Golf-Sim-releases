// A warm-up on the range (the owner: "5 unsaved shots. 5 drivers, 5 long
// iron (change them each warmup) 5 short irons (again change) 5 wedges,
// back to 5 drivers. And then 10 putts"): a set order of clubs, the game
// picking each in turn, the first few balls kept out of the stats
// altogether (loosening up), then on to the putting green. Which long iron,
// short iron and wedge changes from one warm-up to the next. Pure: the
// practice plan runs it in the sim (practiceplan.js), the tests feed it
// shots.

import { CLUB_NAMES } from "./clubs.mjs";

// loosen: the shots kept out of the stats first; per: balls a club;
// putts: putts at the end, on the practice green (feet, from to).
export const WARMUP = Object.freeze({ loosen: 5, per: 5, putts: 10, puttFt: [4, 30] });

// The clubs each kind of shot takes turns with, one warm-up to the next
// (only those in the bag, when it's known).
export const WARMUP_CLUBS = Object.freeze({
  long: ["4I", "5I", "4H", "6I"],
  short: ["8I", "9I", "7I"],
  wedge: ["PW", "GW", "SW", "AW", "LW"],
});

const KIND_WORDS = { loosen: "loosening up", driver: "drivers", long: "long irons", short: "short irons", wedge: "wedges", putts: "putts" };

// The warm-up's steps, in order: [{ kind, mode, club, shots, saved }].
//   n      how many warm-ups this player has done before (so the clubs
//          change each time)
//   known  the clubs in the player's bag (their stats'), or empty for any
export function warmupSteps(n = 0, known = []) {
  const have = new Set(known);
  const pick = (kind) => {
    const list = WARMUP_CLUBS[kind];
    const mine = have.size ? list.filter((c) => have.has(c)) : list;
    const from = mine.length ? mine : list;
    return from[((n % from.length) + from.length) % from.length];
  };
  const range = (kind, club, shots = WARMUP.per, saved = true) => ({ kind, mode: "range", club, shots, saved });
  return [
    // (Any club for these: whatever's in hand.)
    range("loosen", null, WARMUP.loosen, false),
    range("driver", "DR"),
    range("long", pick("long")),
    range("short", pick("short")),
    range("wedge", pick("wedge")),
    range("driver", "DR"),
    { kind: "putts", mode: "putting", club: "PT", shots: WARMUP.putts, saved: true },
  ];
}

// A step in words: "5 drivers", "5 long irons (5 iron)", "10 putts".
export function stepWords(step) {
  const club = step.club && step.kind !== "driver" && step.kind !== "putts" ? ` (${CLUB_NAMES[step.club]?.toLowerCase() ?? step.club})` : "";
  return step.kind === "loosen" ? `${step.shots} to loosen up (not kept)` : `${step.shots} ${KIND_WORDS[step.kind]}${club}`;
}

export class WarmupRun {
  constructor(steps) {
    this.steps = steps;
    this.at = 0;
    this.n = 0;
    this.total = 0;
  }
  get step() {
    return this.steps[this.at] ?? null;
  }
  get done() {
    return this.at >= this.steps.length;
  }
  // What a drill would have: the mode it's on now (a mode left ends it).
  get drill() {
    return { mode: this.step?.mode ?? "range", name: "Warm-up" };
  }
  // Whether the shot about to be hit is kept out of the stats.
  get unsaved() {
    return !!this.step && !this.step.saved;
  }

  // A shot in `mode`: counted towards the step (any club for loosening up;
  // otherwise counted whatever club, the game having picked it). Returns
  // { n, of, stepDone, next, finished } or null when it's not the warm-up's
  // (another mode, or it's over).
  add(mode) {
    const step = this.step;
    if (!step || mode !== step.mode) return null;
    this.n++;
    this.total++;
    const of = step.shots;
    if (this.n < of) return { n: this.n, of, step, stepDone: false, next: null, finished: false };
    this.at++;
    this.n = 0;
    return { n: of, of, step, stepDone: true, next: this.step, finished: this.done };
  }

  // Skips the rest of this step (N).
  skip() {
    if (this.done) return { finished: true, next: null };
    const skipped = this.step;
    this.at++;
    this.n = 0;
    return { skipped, next: this.step, finished: this.done };
  }

  // A line for the overlay.
  note() {
    const step = this.step;
    if (!step) return "";
    const after = this.steps[this.at + 1];
    return `Warm-up: ${stepWords(step)} - ${Math.min(this.n + 1, step.shots)} of ${step.shots}${after ? ` · then ${stepWords(after)}` : ""}`;
  }
}
