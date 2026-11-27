// Scoring for the short-game challenges: ten attempts at one distance, best
// total kept as a personal best. Pure, so the rules are tested.

// Putting: pace is the skill. In the hole is best; finishing just past (where
// it had a chance and leaves a tap-in) is next; short never went in.
export const PUTT_ZONES = [
  { points: 10, label: "Holed" },
  { points: 7, label: "Perfect pace", past: true, within: 2 },
  { points: 5, label: "A touch firm", past: true, within: 3 },
  { points: 3, label: "Just short", past: false, within: 2 },
  { points: 1, label: "Close", within: 5 },
  { points: 0, label: "Missed the zone" },
];

// result: { holed, leaveFeet, longFeet }
export function scorePutt(result) {
  if (result.holed) return { points: 10, label: "Holed" };
  const past = result.longFeet >= 0;
  for (const z of PUTT_ZONES.slice(1, -1)) {
    if (result.leaveFeet > z.within) continue;
    if (z.past === undefined || z.past === past) return { points: z.points, label: z.label };
  }
  return { points: 0, label: "Missed the zone" };
}

// The distance challenge (one distance): no hole - a target, and a half
// circle just past it (the owner: "we don't actually want a hole because
// the idea is to hit just past the hole semicircle, not before and not too
// far past"). Finishing in the half circle is the skill; a little firmer
// scores some; short of the line or well past scores nothing.
export const PACE_ZONES = [
  { points: 10, label: "In the zone", within: 2 },
  { points: 5, label: "A touch firm", within: 3 },
];

// result: { leaveFeet, longFeet } from the target (sim/putting.mjs
// simulatePutt with no hole).
export function scorePace(result) {
  if (result.longFeet < 0) return { points: 0, label: "Short" };
  const z = PACE_ZONES.find((z) => result.leaveFeet <= z.within);
  return z ? { points: z.points, label: z.label } : { points: 0, label: "Too firm" };
}

// Lag putting (the distance challenge's "Lag: 30 - 50 ft"): from long range
// the skill is leaving a sure second putt, short or past alike - three-putt
// avoidance. Scored as the practice plan's lag putts are (100, 70, 30).
export const LAG_ZONES = [
  { points: 10, label: "Holed" },
  { points: 7, label: "Dead weight", within: 3 },
  { points: 3, label: "Two-putt range", within: 6 },
  { points: 0, label: "Three-putt danger" },
];

export function scoreLag(result) {
  if (result.holed) return { points: 10, label: "Holed" };
  const z = LAG_ZONES.slice(1, -1).find((z) => result.leaveFeet <= z.within);
  return z ? { points: z.points, label: z.label } : { points: 0, label: "Three-putt danger" };
}

// A lag round's putts: two from each of these, every round, so every
// round (and every player online) has the same ten.
export const LAG_DISTANCES = [30, 35, 40, 45, 50];

// The ten in an order of their own (the same seed, the same order), never
// the same length twice running so each is a fresh judgement of pace.
export function lagOrder(seed = Math.random() * 2147483646) {
  let x = (Math.abs(Math.floor(seed)) % 2147483646) + 1;
  const rand = () => {
    x = (x * 48271) % 2147483647;
    return (x - 1) / 2147483646;
  };
  const shuffled = () => {
    const a = [...LAG_DISTANCES];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const first = shuffled();
  let second = shuffled();
  // The halves meet in the middle: a repeat there swaps to the other end.
  if (second[0] === first.at(-1)) second = [...second.slice(1), second[0]];
  return [...first, ...second];
}

// Chipping: landing it on your spot is the skill that makes the roll-out
// predictable, so it scores on its own; then how close it finishes, with the
// hole worth most.
export const CHIP_LANDING = [
  { within: 1, points: 3 },
  { within: 2, points: 2 },
  { within: 3, points: 1 },
];
export const CHIP_FINISH = [
  { within: 3, points: 6, label: "Tap-in" },
  { within: 6, points: 4, label: "Close" },
  { within: 10, points: 2, label: "On the green" },
  { within: 15, points: 1, label: "Long way" },
];
export const CHIP_HOLED = 10;

// result: { holed, leaveFeet, landingMissYards }
export function scoreChip(result) {
  const landing = CHIP_LANDING.find((z) => result.landingMissYards <= z.within)?.points ?? 0;
  let finish = 0;
  let label = "Too far";
  if (result.holed) {
    finish = CHIP_HOLED;
    label = "Holed!";
  } else {
    const z = CHIP_FINISH.find((f) => result.leaveFeet <= f.within);
    if (z) ({ points: finish, label } = z);
  }
  return { points: landing + finish, landing, finish, label };
}

export const ATTEMPTS = 10;
export const MAX_PUTT_ROUND = 10 * ATTEMPTS;
export const MAX_CHIP_ROUND = (3 + CHIP_HOLED) * ATTEMPTS;

// A round in progress: add attempts, get the total, know when it's over.
export class Round {
  constructor(key, attempts = ATTEMPTS) {
    this.key = key;
    this.attempts = attempts;
    this.scores = [];
  }
  add(score) {
    if (!this.finished) this.scores.push(score);
    return this.finished;
  }
  get total() {
    return this.scores.reduce((a, s) => a + s.points, 0);
  }
  get finished() {
    return this.scores.length >= this.attempts;
  }
}

// Personal bests: { [key]: { score, date } }. The store is passed in so the
// tests can use a plain object and the page can use localStorage.
export function recordBest(bests, key, score, date = new Date().toISOString().slice(0, 10)) {
  const old = bests[key];
  if (old && old.score >= score) return { bests, isBest: false, previous: old.score };
  return { bests: { ...bests, [key]: { score, date } }, isBest: true, previous: old?.score ?? null };
}
