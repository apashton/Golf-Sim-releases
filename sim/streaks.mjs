// Streaks in practice: how many in a row - putts holed, chips finishing
// inside 5 ft, chips landing in the zone - the most in a row for each
// practice and player, and what each success gets: a celebration that grows
// with the run, a heartbeat while it closes on the best, and a crowd's cheer
// when it beats it. Pure: the page (streaks.js) keeps the counts and plays
// what this decides; the tests hold the ladder to growing.

import { describeLevel } from "./celebration.mjs";

// The kinds of streak, and the words for each.
//   one     a single success's banner
//   many    the line under "N in a row!"
//   miss    what ends it, for the message when a run is over
export const STREAK_KINDS = {
  putt: { name: "Putts holed in a row", one: "Holed!", many: "holed", unit: "ft" },
  "chip-pin": { name: "Chips inside 5 ft in a row", one: "Inside 5 ft", many: "inside 5 ft", unit: "yds" },
  "chip-zone": { name: "Chips landed in the zone in a row", one: "In the zone", many: "in the zone", unit: "yds" },
};

// A chip counts for the pin streak when it finishes this close (or in).
export const CHIP_STREAK_FEET = 5;

// ---- Keys: which practice a best belongs to -----------------------------------------

// The distance part of a key: one distance ("10ft"), a range drawn from at
// random ("6-20ft"), or the ladder.
export function distanceKey({ mode = "fixed", value, min, max, unit = "ft" }) {
  if (mode === "ladder") return "ladder";
  if (mode === "random") return `${Math.min(min, max)}-${Math.max(min, max)}${unit}`;
  return `${value}${unit}`;
}

// A best's key: the kind, the distance and anything else that makes it the
// same practice (the cup, the zone's size).
export function streakKey(kind, distance, ...extra) {
  return [kind, distance, ...extra.filter((e) => e !== undefined && e !== null && e !== "")].join(":");
}

// A key back in words, for the table of bests: { kind, distance, extra }.
export function describeKey(key) {
  const [kind, distance = "", ...extra] = String(key).split(":");
  let words = distance;
  const m = /^(\d+)(?:-(\d+))?(ft|yds)$/.exec(distance);
  if (m) words = m[2] ? `${m[1]} - ${m[2]} ${m[3]}` : `${m[1]} ${m[3]}`;
  else if (distance === "ladder") words = "Ladder";
  return { kind, distance: words, extra };
}

// ---- A run -----------------------------------------------------------------------------

// A run of tries, for one player at one practice.
//   count       successes in a row so far
//   bestBefore  the best when the run began: what it's trying to beat
//   best        the best now (a record run raises it as it goes)
export function newRun(best = 0) {
  return { count: 0, bestBefore: best, best };
}

// After a try: the run as it now stands, and what happened.
//   { run, success, ended, record, firstRecord }
//   ended        how long the run that has just ended was (a miss), or 0
//   record       this success beat a best worth beating (2 or more)
//   firstRecord  and it's the one that went past it
export function afterTry(run, success) {
  if (!success) {
    return { run: newRun(run.best), success: false, ended: run.count, record: false, firstRecord: false, beat: run.count > run.bestBefore && run.bestBefore >= 2 };
  }
  const count = run.count + 1;
  const record = run.bestBefore >= 2 && count > run.bestBefore;
  return {
    run: { count, bestBefore: run.bestBefore, best: Math.max(run.best, count) },
    success: true,
    ended: 0,
    record,
    firstRecord: record && count === run.bestBefore + 1,
  };
}

// The rung of the celebration ladder (0 - 3, as the course's) for a run
// this long: each success bigger than the last - a neat banner and a chime
// for the first, confetti from three in a row, fireworks from five - and
// the whole show for going past the best.
export function streakLevel(count, { record = false, firstRecord = false } = {}) {
  if (firstRecord) return 3;
  let level = count >= 5 ? 2 : count >= 3 ? 1 : 0;
  if (record) level = Math.max(level, 2);
  return level;
}

// How long a practice's banner stays: the next putt comes quickly.
const HOLD = { 0: 2.6, 1: 3, 2: 3.6, 3: 5.5 };

// What a success gets: a celebration for celebrate.js to play (no camera
// moves - the next try is lined up where it is), with `cheer` ("big" for
// going past the best, "small" for each success on a record run after it,
// or null) for the crowd.
//   kind      "putt", "chip-pin" or "chip-zone"
//   outcome   afterTry's
//   holed     it went in (a chip-in says so)
export function streakCelebration(kind, outcome, { holed = false } = {}) {
  const k = STREAK_KINDS[kind] ?? STREAK_KINDS.putt;
  const { count, bestBefore } = outcome.run;
  const level = streakLevel(count, outcome);
  const d = describeLevel(level);
  // Growing within a rung too: more confetti and fireworks, louder, the
  // banner a little bigger, each time.
  const extra = Math.max(0, count - 1);
  const confetti = d.confetti ? Math.round(d.confetti * Math.min(2, 1 + 0.12 * Math.max(0, count - 3))) : 0;
  const fireworks = d.fireworks ? Math.min(10, d.fireworks + Math.max(0, count - 5)) : 0;
  const volume = Math.min(1, d.volume + 0.04 * extra);
  const size = Math.min(1, d.banner.size + 0.03 * extra);
  const chipIn = holed && kind !== "putt";
  let title = count >= 2 ? `${count} in a row!` : chipIn ? "Chipped in!" : k.one;
  let subtitle = count >= 2 ? (chipIn ? `Chipped in - ${k.many}` : k.many) : "";
  let detail = nearBest(count, bestBefore);
  if (outcome.record) {
    title = outcome.firstRecord ? "New record!" : `Record: ${count} in a row!`;
    subtitle = outcome.firstRecord ? `${count} in a row - ${k.many}` : k.many;
    detail = `Your best was ${bestBefore}`;
  }
  return {
    tier: `streak-${level}`,
    level,
    title,
    subtitle,
    detail,
    ...d,
    confetti,
    fireworks,
    volume,
    banner: { ...d.banner, size },
    hold: HOLD[level],
    camera: null,
    cheer: outcome.firstRecord ? "big" : outcome.record ? "small" : null,
  };
}

// The line under a success on the way to the best.
function nearBest(count, best) {
  if (!(best >= 2) || count > best) return "";
  if (count === best) return "Equals your best - one more for a record!";
  if (count === best - 1) return `One more equals your best (${best})`;
  if (count >= 2) return `Best: ${best}`;
  return "";
}

// While the next try is lined up and played: a heartbeat once the run is
// closing on a best worth beating (3 or more) - from two short of it,
// quicker the closer it gets, and quickest when the next one would be a
// new record or the run is already past it. Beats a minute and how loud
// (0 - 1), or null for none.
export function heartbeatFor(run) {
  const { count, bestBefore } = run ?? {};
  if (!(bestBefore >= 3) || !(count >= 1)) return null;
  const toGo = bestBefore - count;
  if (toGo <= 0) return { bpm: 118, gain: 0.9 };
  if (toGo === 1) return { bpm: 96, gain: 0.7 };
  if (toGo === 2) return { bpm: 78, gain: 0.5 };
  return null;
}

// What to say when a run of a few ends: "5 in a row" - and a record's
// "New best: 9 in a row". Null for a short one (under 3).
export function runEndedText(kind, outcome) {
  if (!(outcome.ended >= 3)) return null;
  const k = STREAK_KINDS[kind] ?? STREAK_KINDS.putt;
  return outcome.beat ? `New best: ${outcome.ended} in a row ${k.many}` : `${outcome.ended} in a row ${k.many}`;
}

// ---- Bests -------------------------------------------------------------------------------

// Saves a run's length as a player's best at a practice if it beats it.
// bests: { [player]: { [key]: { best, date } } }. Returns the bests (a new
// object when changed) and whether it was a new best.
export function recordStreak(bests, player, key, count, date = new Date().toISOString().slice(0, 10)) {
  const mine = bests?.[player] ?? {};
  const was = mine[key]?.best ?? 0;
  if (!(count > was)) return { bests, isBest: false, previous: was };
  return { bests: { ...bests, [player]: { ...mine, [key]: { best: count, date } } }, isBest: true, previous: was };
}

// A player's best at a practice, 0 for none.
export function bestOf(bests, player, key) {
  return bests?.[player]?.[key]?.best ?? 0;
}
