// A handicap for playing with the mouse or a game controller, kept apart
// from a player's real one (the owner, 23 October 2026: "pitted a launch
// monitor user against a controller user needs to feel fair, so handicaps
// etc are important" - and of a separate controller handicap: "Yes
// seperate ok").
//
// A round a player swings with the mouse or a controller is kept as
// experimental (out of every real number: CLAUDE.md), with the device and
// the level they swung at (sw, lv: recorder.js, from madeUpOf). Those
// rounds make a handicap index of their own for each device and level, the
// World Handicap System's way (sim/handicap.mjs) - the real index is
// never touched. Until there are ROUNDS_NEEDED of them, a level starts
// from START: the golfer it's named after. (tools/swinglevels.mjs plays a
// typical thumb through the swing model at each level - levelSpread - for
// how many strokes the level itself costs; START isn't that.) Pure.

import { madeUpShot, fullCarry, reachOf } from "./madeshot.mjs";
import { simulateFlight, YARD } from "./flight.mjs";
import { handicapReport } from "./handicap.mjs";
import { RANKED, LEVELS, cleanLevel, levelHelp, cleanCustom } from "./swinglevels.mjs";

export const DEVICES = ["controller", "mouse"];
export const DEVICE_NAMES = { controller: "Controller", mouse: "Mouse" };
// Rounds at a level before its own index stands (the World Handicap
// System's first index needs three).
export const ROUNDS_NEEDED = 3;
// Each level's index before a player has their own at it: the golfer it's
// named after (the owner, 25 October 2026: "they should go in one
// direction", Tour lowest) - a Beginner 28, an Amateur 15, a Pro 5, Tour
// scratch, so a Tour player gives a Beginner strokes as a real one would.
// Their own rounds take over after ROUNDS_NEEDED. (They used to be the
// strokes each level's own harshness costs a steady thumb - Tour the most -
// which ran the other way.)
export const START = { beginner: 28, amateur: 15, pro: 5, tour: 0 };

// ---- Which rounds count ---------------------------------------------------------

// A game a player played with made-up swings counts for this handicap when
// at least MADE_SHARE of their shots in it were made-up (a round mostly on
// the launch monitor counts for neither handicap): the device and level
// most of those swings were. sw: { shots, made: { "device|level": n } }
// (recorder.js). null otherwise.
export const MADE_SHARE = 0.8;
export function madeUpOf(sw) {
  if (!sw?.shots) return null;
  const counts = Object.entries(sw.made ?? {});
  const made = counts.reduce((a, [, n]) => a + n, 0);
  if (!made || made < sw.shots * MADE_SHARE) return null;
  const [key] = counts.sort((a, b) => b[1] - a[1])[0];
  const [device, level] = key.split("|");
  return { device, level: level || null };
}

// ---- The indexes ------------------------------------------------------------------

// Every device's and level's index from the rounds kept with them
// (roundstats.mjs rounds carrying sw and lv): { controller: { pro: {
// index, rounds } }, mouse: {...} } - index null until there are enough.
export function madeUpHandicaps(rounds) {
  const by = {};
  for (const r of rounds ?? []) {
    if (!DEVICES.includes(r?.sw)) continue;
    const lv = cleanLevel(r.lv);
    ((by[r.sw] ??= {})[lv] ??= []).push(r);
  }
  const out = {};
  for (const [device, levels] of Object.entries(by)) {
    out[device] = {};
    for (const [lv, list] of Object.entries(levels)) {
      const rep = handicapReport(list);
      out[device][lv] = { index: rep.rounds >= ROUNDS_NEEDED ? rep.index : null, rounds: rep.rounds };
    }
  }
  return out;
}

// A level's index before any rounds: START's, or for Custom the ranked
// level nearest its forgiveness.
export function startIndex(level, custom = undefined) {
  const key = cleanLevel(level);
  if (key !== "custom") return START[key];
  const f = cleanCustom(custom).faults;
  const near = RANKED.reduce((a, k) => (Math.abs(LEVELS[k].faults - f) < Math.abs(LEVELS[a].faults - f) ? k : a), RANKED[0]);
  return START[near];
}

// The index for a player swinging with `device` at `level`: { index, own,
// rounds } - their own from their rounds at it once there are enough, else
// the level's start.
export function madeUpIndex(handicaps, device, level, custom = undefined) {
  const own = handicaps?.[device]?.[cleanLevel(level)];
  if (Number.isFinite(own?.index)) return { index: own.index, own: true, rounds: own.rounds };
  return { index: startIndex(level, custom), own: false, rounds: own?.rounds ?? 0 };
}

// "Controller, Pro: 11.4" / "Controller, Pro: 11.4 to start (1 round of 3)"
// - or, with a handicap the player gave (asked), "... 11.4, yours until
// your rounds give one (1 round of 3)".
export function madeUpWords(device, level, { index, own, rounds }, { asked = false } = {}) {
  const head = `${DEVICE_NAMES[device] ?? "Mouse"}, ${LEVELS[cleanLevel(level)].label}: ${index.toFixed(1)}`;
  const count = `${rounds} round${rounds === 1 ? "" : "s"} of ${ROUNDS_NEEDED}`;
  return own ? head : asked ? `${head}, yours until your rounds give one (${count})` : `${head} to start (${count})`;
}

// How a player plays, as the handicap they gave is kept by (the course's
// settings.startHcp[name][key]: course/madeupplay.js): "monitor" on the
// launch monitor (swing null), else "device|level".
export const howKey = (swing) => (swing ? `${swing.device}|${cleanLevel(swing.level)}` : "monitor");

// ---- How a level spreads the ball (for START) --------------------------------------

// A typical player's thumb (or hand) - the guesses START rests on:
//   side    how far across the middle the stick goes through (share of its
//           travel, one standard deviation), slant how much the push leans
//   pull    how far off the swing they meant (percent): with the flag's mark
//           to stop at, and judging it from the yards alone
//   over    how often a full swing goes past 100%, and by up to how much
//   tempo   their rhythm, back against through: around `mid`, spread `ln`
export const THUMB = { side: 0.12, slant: 0.12, pull: { marked: 2.5, own: 4 }, over: { often: 0.3, most: 5 }, tempo: { mid: 3.5, ln: 0.35 } };
// A finger on a phone's swing pad, the same way: never back up quite the
// way it went down (sideways and leaning about twice the thumb's), less
// sure where it stopped, overshooting more often and further - what the
// levels are tuned to for the touch screen (the owner, 29 October 2026:
// "Touch screen still way to harsh").
export const FINGER = { side: 0.22, slant: 0.24, pull: { marked: 4.5, own: 7 }, over: { often: 0.35, most: 9 }, tempo: { mid: 3.5, ln: 0.5 } };

const gauss = (rand) => {
  // Box-Muller: a standard normal.
  const u = Math.max(1e-12, rand());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
};

// How a level spreads full shots with these clubs, by THUMB: { angle (off
// line, degrees, one standard deviation), length (long or short, share of
// the shot), miss (how often it's a proper miss: well short or far off
// line) } - the course designer's golfer's numbers (sim/golfers.mjs).
export function levelSpread(level, { clubs = ["DR", "7I"], n = 400, rand = Math.random, thumb = THUMB } = {}) {
  const help = levelHelp(level);
  const angles = [];
  const lengths = [];
  let miss = 0;
  for (const club of clubs) {
    // The club's full swing at the level's distances, with no Power points.
    const full = fullCarry(club) * reachOf(help, null, club);
    // Aimed at 95% of a full one: a full swing's job, a little in hand.
    const want = 0.95 * full;
    for (let i = 0; i < n; i++) {
      let pct = 95 + gauss(rand) * (help.mark ? thumb.pull.marked : thumb.pull.own);
      if (rand() < thumb.over.often) pct = 100 + rand() * thumb.over.most;
      const ratio = thumb.tempo.mid * Math.exp(gauss(rand) * thumb.tempo.ln);
      const swing = { pct, start: gauss(rand) * thumb.side * 0.375, slant: gauss(rand) * thumb.slant * 0.5, struck: true, backMs: ratio * 80, downMs: 80 };
      const { ball } = madeUpShot({ club, swing, level, plan: { carry: want }, rand });
      const at = simulateFlight(ball).landing.position;
      const carry = at[0] / YARD;
      const angle = (Math.atan2(at[2], at[0]) * 180) / Math.PI;
      angles.push(angle);
      lengths.push(carry / want - 1);
      if (carry < want * 0.85 || Math.abs(angle) > 10) miss++;
    }
  }
  const sd = (a) => {
    const m = a.reduce((x, y) => x + y, 0) / a.length;
    return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length);
  };
  return { angle: sd(angles), length: sd(lengths), miss: miss / (clubs.length * n) };
}
