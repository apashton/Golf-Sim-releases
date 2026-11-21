// The pressure ladder: a circle round the pin that gets a little smaller
// after every shot finishing inside it. The hole ends at the first shot that
// misses, or once ten have been made, whichever comes first. The score is
// the number made.
//
// Two ladders use it: approach shots (a 40 ft circle down to 10 ft) and
// chips (11 ft down to 2 ft). The last of the ten shots is always played to
// the smallest circle, so the steps are the gap split into nine.
//
// Also the approach ladder's holes: three distances from a band, and where
// on each hole the ball sits. Pure, so the rules can be tested.

import { YARD } from "./flight.mjs";
import { FOOT } from "./putting.mjs";
import { holeSpec, buildHole, seeded, makePath, pointAt, nearest, surfaceAt } from "./course.mjs";

// Feet. `shots` is the most a hole can have made.
export const LADDERS = {
  approach: { start: 40, end: 10, shots: 10 },
  chipping: { start: 11, end: 2, shots: 10 },
};

// How much the circle shrinks after each shot made.
export function ladderStep(ladder) {
  return (ladder.start - ladder.end) / (ladder.shots - 1);
}

// The circle's radius (ft) for the next shot, with `made` made so far on
// this hole. After the last rung there's nothing left to play, so it stays
// at the smallest.
export function radiusFeet(ladder, made) {
  const rung = Math.min(Math.max(0, made), ladder.shots - 1);
  // Rounded to a hundredth, so 40 - 9 x 3.33 comes out at exactly 10.
  return Math.round((ladder.start - ladderStep(ladder) * rung) * 100) / 100;
}

// Every rung's radius, the biggest first, for the ladder display.
export function rungs(ladder) {
  return Array.from({ length: ladder.shots }, (_, i) => radiusFeet(ladder, i));
}

// The circle's colour as it tightens: yellow on the first rung through
// orange to red on the last, so the pressure shows at a glance - and never
// green, which would vanish on a green. Returns 0xRRGGBB.
export function ringColour(ladder, made) {
  const k = Math.min(1, Math.max(0, made / (ladder.shots - 1)));
  const hue = 56 * (1 - k); // degrees: 56 yellow to 0 red
  return hslHex(hue, 0.85, 0.55);
}

function hslHex(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return (f(0) << 16) | (f(8) << 8) | f(4);
}

// How far a shot finished, as it's shown (feet, without the unit): to a
// tenth, and to a hundredth if a tenth would read the same as the circle
// it's being measured against - so a miss never looks as if it's on the
// line, nor a make as if it's outside.
export function feetText(feet, radius = null) {
  if (feet >= 100) return String(Math.round(feet));
  const t = feet.toFixed(1);
  if (radius != null && Math.abs(feet - radius) > 1e-9 && t === radius.toFixed(1)) return feet.toFixed(2);
  return t;
}

// How much a miss was by, in words: "0.4 ft", or for the closest of all
// "under an inch" (rather than "0.0 ft").
export function missText(by) {
  return by < 1 / 12 ? "under an inch" : `${feetText(by)} ft`;
}

// One player's go at one hole of the ladder.
export class LadderHole {
  constructor(ladder) {
    this.ladder = ladder;
    this.made = 0;
    // { feet, radius, inside }
    this.shots = [];
    this.over = false;
  }

  // The circle for the next shot, feet.
  get radius() {
    return radiusFeet(this.ladder, this.made);
  }

  // A shot that finished `feet` from the hole (0 if holed; Infinity for one
  // lost in water or out of bounds). On the line counts as in.
  // Returns { inside, radius, feet, by, made, over, complete }: `by` is how
  // far outside the circle a miss was; `complete` is all ten made.
  add(feet) {
    if (this.over) return null;
    const radius = this.radius;
    const inside = Number.isFinite(feet) && feet <= radius + 1e-9;
    this.shots.push({ feet, radius, inside });
    if (inside) this.made++;
    const complete = this.made >= this.ladder.shots;
    this.over = !inside || complete;
    return { inside, radius, feet, by: inside ? 0 : feet - radius, made: this.made, over: this.over, complete };
  }
}

// Holes in a game, and the best possible score.
export const LADDER_HOLES = 3;
export const maxLadderScore = (ladder) => ladder.shots * LADDER_HOLES;

// ---- The approach ladder's holes -------------------------------------------------

// Distance bands (yards to the pin): one range per hole, shortest first.
export const APPROACH_BANDS = {
  mixed: { name: "Short, mid and long", holes: [[80, 110], [120, 150], [160, 190]] },
  wedges: { name: "Wedges", holes: [[50, 70], [70, 90], [90, 110]] },
  irons: { name: "Irons", holes: [[130, 150], [150, 170], [170, 190]] },
  long: { name: "Long irons and woods", holes: [[170, 190], [190, 210], [210, 230]] },
};

// The three yardages for a game: the same for everyone who plays that seed.
export function approachYards(band, seed) {
  const b = APPROACH_BANDS[band] ?? APPROACH_BANDS.mixed;
  const rand = seeded(seed);
  return b.holes.map(([lo, hi]) => Math.round(lo + rand() * (hi - lo)));
}

// How far back from the ball the tee is: far enough that the ball sits well
// down a proper fairway, not so far the hole is long to draw.
const RUN_UP = 70;

// One approach hole: a straight par 4 with the green `yards` from where the
// ball will sit. Water only on the longer ones, and never a fairway bunker
// (it would be in the way of the ball's spot).
export function approachHoleSpec(yards, seed, number) {
  const rand = seeded(seed ^ 0x5bd1e995);
  const water = number === 1 ? "none" : number === 2 ? ["none", "left", "right"][Math.floor(rand() * 3)] : ["none", "front"][Math.floor(rand() * 2)];
  return holeSpec({
    number,
    par: 4,
    yards: yards + RUN_UP,
    seed,
    options: { dogleg: "none", fairway: "normal", bunkers: number === 1 ? "few" : "some", water, green: "normal", contours: "gentle", trees: "normal" },
  });
}

// The layout for an approach hole (course.mjs's generator).
export function approachLayout(yards, seed, number) {
  const layout = buildHole(approachHoleSpec(yards, seed, number));
  // A fairway bunker could still come from "some": take any that isn't by
  // the green away from near the ball's spot.
  const g = layout.green;
  layout.bunkers = layout.bunkers.filter((b) => Math.hypot(b.x - g.x, b.z - g.z) < Math.max(g.rx, g.rz) + 25);
  return layout;
}

// Where the ball sits on an approach hole: on the centreline, `yards` from
// the pin, and on the fairway (moved a little nearer if it's not).
// Returns [x, z] in the hole's frame.
export function approachSpot(layout, yards) {
  const path = makePath(layout.path);
  const pin = layout.pin;
  const want = yards * YARD;
  // The point on the line that far from the pin, found by halving.
  let lo = 0;
  let hi = nearest(path, pin[0], pin[1]).s;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const p = pointAt(path, mid).p;
    if (Math.hypot(p[0] - pin[0], p[1] - pin[1]) > want) lo = mid;
    else hi = mid;
  }
  let s = (lo + hi) / 2;
  let p = pointAt(path, s).p;
  for (let k = 0; k < 20 && surfaceAt(layout, p[0], p[1], path) !== "fairway"; k++) {
    s += 2;
    p = pointAt(path, s).p;
  }
  return [p[0], p[1]];
}

// Feet from the hole, for a shot's finish (0 if it went in).
export function feetFromPin(pin, rest, holed = false) {
  return holed ? 0 : Math.hypot(rest[0] - pin[0], rest[1] - pin[1]) / FOOT;
}
