// The shot a made-up swing makes - the mouse on the swing pad, a game
// controller's stick - with set club distances (the owner, 23 October 2026:
// "Club distances should be set, so sometimes it's a perfect 100% shot
// sometimes the player needs to try and perform a 90% swing. Controller
// players can over swing, but only to 105% and each percentage adds more
// variability into the harshness of not swinging 'true'").
//
// The swing is a percentage (pct, how far back: gamepad.mjs stickPercent,
// mouseswing.mjs readSwing):
//   - 100% carries the club's distance at the player's level (the bag's,
//     clubs.mjs BAG, times reachOf: the level's drive, further with Power
//     points - swinglevels.mjs DRIVES - a long hitter's irons stretching
//     less than the driver), as the shot setup makes it fly
//     (shotsetup.mjs: a punch carries less);
//     90% carries 90% of that, and so on down to a chip - the launch and
//     spin going from the club's full swing to its chip (chipping.mjs
//     CHIP_CLUBS) the shorter the swing;
//   - past 100% it's an overswing, up to MOST (105%): a little further,
//     and every percent over makes a crooked swing more crooked
//     (OVER.faults) and adds its own scatter (OVER.start, curve, strike);
//   - pulled further still (the swing pad: past the level's tooFar,
//     TOO_FAR_PCT at Pro and Tour, later the easier the level) it goes no
//     further, it's over the top (the owner, 24 October 2026: "massive
//     overpower should hurt the user. I can go over the top and still hit
//     a reasonable drive"): each percent past costs distance, sprays it
//     and makes a bad mishit likelier (BEYOND), at every level;
//   - sideways at the strike starts it off line, a slanted push curves it
//     (as the old swing did: mouseswing.mjs), as much as the level says
//     (swinglevels.mjs faults) - once past the level's wobble, the
//     wandering a finger can't help, which doesn't count at all; and the swing's rhythm counts as much as
//     the level says: back about three times as long as through is pure,
//     outside the level's band it loses distance and goes more crooked.
// A putt: 100% is the putt's scale on the flat (puttScale: the next of
// PUTT_SCALES past the hole), so a 20 footer on a 30 ft scale wants a 67%
// stroke, more uphill. The line is the player's aim, or read for them at
// Beginner (the level's putt help).
//
// `plan` is the shot A-Squared Golf would play here (the test shot's own,
// planOf): how far it carries, or how hard a putt's struck - the flag's
// mark on the pad (planMark), for the levels that show it.
//
// A player's skill points (sim/skills.mjs shotSkills) play on top of the
// level: further (within the level's distances), straighter, tighter, a
// wider window round the mark; and
// the shot setup has its price (setupHarshness): a height, spin or shape
// picked makes a crooked swing more crooked, a stock shot as it always
// was. Pure.

import { simulateFlight, simulateShot, YARD } from "./flight.mjs";
import { BAG } from "./clubs.mjs";
import { CHIP_CLUBS } from "./chipping.mjs";
import { flatRoll } from "./puttguide.mjs";
import { FOOT } from "./putting.mjs";
import { setupBall, cleanSetup } from "./shotsetup.mjs";
import { levelHelp, driveTotal, levelName } from "./swinglevels.mjs";
import { clamp, smoothstep } from "./mathutil.mjs";
import { MOST_PCT, TOO_FAR_PCT, PULL_MOST_PCT, LET_GO } from "./mouseswing.mjs";
import { shotSkills, setupHarshness, SHORT_BELOW, MAX_RANK } from "./skills.mjs";

// The furthest a swing goes, and a full one (percent).
export const MOST = MOST_PCT;
export const FULL = 100;
// Each percent past a full swing: how much more a crooked swing shows
// (faults x (1 + per x over + squared x over^2): three times at 105% on
// Pro), and its own scatter on top - start line and curve (degrees, one
// standard deviation) and a strike off the middle (share of the speed).
export const OVER = { per: 0.15, squared: 0.05, start: 0.4, curve: 1.2, strike: 0.005, putt: 0.01 };
// Each percent pulled past the level's tooFar (the swing pad's pull, not
// the swing's size: still MOST), by the level's over (least BEYOND.least):
// how much more a crooked swing shows, the start line's and curve's own
// scatter (degrees, one standard deviation), the speed it loses for
// certain and as scatter (shares), the chance of a bad mishit (topped,
// thinned, off the heel) and what that one loses; and a putt's pace and
// line scatter. Graded by level (the owner, 25 October 2026: "like 113
// end up 87+ not half a shot"; 29 October: "if on pro and hitting long
// penalties should be tough"): pulled 113%, a 7 iron carries all of a full
// one at Beginner (whose too far starts at 118%) and Amateur (112%), 89% at
// Pro and 83% at Tour; at 125%, 98%, 91%, 61% and under half.
export const BEYOND = { least: 0.15, faults: 0.2, start: 0.6, curve: 1.6, loss: 0.004, scatter: 0.004, mishit: 0.02, mishitMost: 0.6, mishitLoss: [0.12, 0.35], most: 0.6, pace: 0.03, line: 0.4 };
// How far off line and how much curve a swing's sideways and slant give
// (degrees, before the level's faults), and the most either goes.
const START = { deg: 18, most: 20, putt: 6, puttMost: 8 };
const CURVE = { k: 0.9, most: 40 };
// A rhythm outside the band (by how far, in log terms): the speed lost and
// how much more crooked, and its own scatter (degrees).
export const TEMPO = { ideal: 3, loss: 0.08, most: 0.12, faults: 0.6, start: 1.5, curve: 4 };
// A golfer's own spread: even a swing made just right doesn't go the same
// way twice (the owner, 24 October 2026, on the phone: "I was waaaay too
// consistent on the driving range. Every shot within a few feet, all the
// same 250 distance"). One standard deviation at Amateur, scaled by the
// level's spread (swinglevels.mjs; Custom's from its faults, spreadOf: less
// at Beginner, more at Pro and Tour): the
// strike (a share of the speed), the start line and the curve (degrees);
// now and then a mishit (its chance, and the speed it loses); and a putt's
// pace (a share) and line (degrees). The mishits come as often as the
// level's mishit says, too.
export const SPREAD = { strike: 0.025, start: 1.4, curve: 3.5, mishit: 0.04, mishitLoss: [0.08, 0.2], pace: 0.05, line: 0.8 };
export const spreadOf = (faults) => clamp(0.5 + (0.5 * faults) / 0.7, 0.6, 2);
// A putt's scale (feet on the flat at 100%): the first of these at least a
// quarter past the hole.
export const PUTT_SCALES = [6, 10, 15, 20, 30, 40, 60, 80, 120];
const PAST = 1.25;

const gauss = (rand) => (rand() + rand() + rand() - 1.5) * 2;
const cache = new Map();
const kept = (key, make) => {
  if (cache.has(key)) return cache.get(key);
  if (cache.size > 4000) cache.clear();
  const v = make();
  cache.set(key, v);
  return v;
};
const carryOf = (ball) => simulateFlight({ ...ball, hla: 0, spinAxis: 0 }).landing.position[0] / YARD;

// A club's full swing as the bag has it ({ speedMph, vla, totalSpin }).
function bagBall(club) {
  const b = BAG[club] ?? BAG["7I"];
  return { speedMph: b.speed, vla: b.vla, hla: 0, totalSpin: b.spin, spinAxis: 0 };
}

// The launch and spin of a swing `k` of a full one (1 full): a wedge's or a
// short iron's going over to its chip's as the swing gets shorter; any
// other club launching a little lower and spinning a good deal less.
export function partShape(club, k) {
  const full = bagBall(club);
  const w = smoothstep(0.3, 0.85, k);
  const chip = CHIP_CLUBS[club];
  if (chip) return { vla: chip.vla + (full.vla - chip.vla) * w, totalSpin: chip.spin + (full.totalSpin - chip.spin) * w };
  return { vla: full.vla * (0.88 + 0.12 * w), totalSpin: full.totalSpin * (0.55 + 0.45 * w) };
}

// How far a full swing (100%) with this club carries, struck as the setup
// says (yards, still air).
export function fullCarry(club, setup = null) {
  const s = cleanSetup(setup);
  return kept(`full|${club}|${s.height}|${s.spin}`, () => carryOf(setupBall(bagBall(club), s)));
}

// The driver's carry (yards) that runs out to `total` yards of carry and
// roll on a fairway in still air, launched and spun as the bag's driver:
// the speed found by the secant way, as speedFor does for a carry.
export function driveCarry(total) {
  return kept(`drive|${Math.round(total * 2)}`, () => {
    const b = bagBall("DR");
    const shot = (v) => simulateShot({ ...b, speedMph: v });
    let a = BAG.DR.speed * (total / 250);
    let b2 = a * 1.05;
    let fa = shot(a).total - total;
    let fb = shot(b2).total - total;
    for (let i = 0; i < 8 && Math.abs(fb) > 0.1; i++) {
      if (fb === fa) break;
      const c = clamp(b2 - (fb * (b2 - a)) / (fb - fa), 40, 230);
      [a, fa] = [b2, fb];
      b2 = c;
      fb = shot(b2).total - total;
    }
    return shot(b2).carry;
  });
}

// How much of a longer drive than the bag's each club takes (1 the whole
// of it): a long hitter's irons and wedges stretch less than the driver
// (the owner: "tour pro 7 iron should be about 180 carry" - a Tour player
// with Power maxed drives 320 and hits the 7 iron 180, where the bag's
// share would be nearly 200). A shorter driver than the bag's takes every
// club down with it, as a slower swing does.
export const LONG_REACH = Object.freeze({ DR: 1, "3W": 0.95, "5W": 0.9, "4H": 0.85, "4I": 0.78, "5I": 0.72, "6I": 0.67, "7I": 0.62, "8I": 0.58, "9I": 0.55, PW: 0.52, AW: 0.5, GW: 0.48, SW: 0.45, LW: 0.45 });

// How far this player's club goes against the bag's: the level's drive
// (help.drive: levelHelp's; Power's points, from skills, moving it from its
// shortest to its longest) over the bag's driver - all of it for a shorter
// drive, the club's LONG_REACH share of a longer one.
export function reachOf(help = levelHelp("beginner"), skills = null, club = "DR") {
  const total = driveTotal(help?.drive ?? "beginner", shotSkills(skills).power);
  const k = driveCarry(total) / fullCarry("DR");
  return k <= 1 ? k : 1 + (k - 1) * (LONG_REACH[club] ?? LONG_REACH["7I"]);
}

// What a level's distances are (the owner, 26 October 2026: "would be key
// to show the user on 'your level' how the level picks default and
// maximum distances you can shoot"): a full swing's drive (carry and roll)
// and 7 iron (carry), with no Power points (`from`), with Power maxed
// (`most`: sim/skills.mjs, skill points) and with `power` ranks (`now`: a
// player's own). Yards, rounded.
//   -> { drive: { from, most, now }, iron: { from, most, now } }
export function levelDistances(level, { custom, power = 0 } = {}) {
  const help = levelHelp(level, custom);
  const at = (ranks) => ({
    drive: Math.round(driveTotal(help.drive, ranks / MAX_RANK)),
    iron: Math.round(fullCarry("7I") * reachOf(help, { power: ranks }, "7I")),
  });
  const [from, most, now] = [at(0), at(MAX_RANK), at(clamp(Number(power) || 0, 0, MAX_RANK))];
  return {
    drive: { from: from.drive, most: most.drive, now: now.drive },
    iron: { from: from.iron, most: most.iron, now: now.iron },
  };
}
// In words, for the level picked (the phone's Your level, the menu's
// Level): "Amateur: a full swing drives 213 yards to start, up to 260 with
// Power maxed (skill points); a 7 iron carries 124, up to 154." - and with
// Power points, "Yours now: 226 and 131."
export function distanceWords(level, opts = {}) {
  const { drive: d, iron: i } = levelDistances(level, opts);
  const yours = d.now !== d.from ? ` Yours now: ${d.now} and ${i.now}.` : "";
  return `${levelName(level)}: a full swing drives ${d.from} yards to start, up to ${d.most} with Power maxed (skill points); a 7 iron carries ${i.from}, up to ${i.most}.${yours}`;
}

// The ball speed that carries `carry` yards with a swing k of a full one:
// found by the secant way from two guesses - four or five flights, where
// halving took 24 and a phone felt them as the swing struck - and halving
// only if that doesn't settle.
function speedFor(club, setup, carry, k) {
  const s = cleanSetup(setup);
  const kk = Math.round(clamp(k, 0, 1.1) * 40) / 40;
  return kept(`speed|${club}|${s.height}|${s.spin}|${kk}|${Math.round(carry * 4)}`, () => {
    const shape = setupBall({ speedMph: 0, hla: 0, spinAxis: 0, ...partShape(club, kk) }, { ...s, shape: 0 });
    const off = (v) => carryOf({ ...shape, speedMph: v }) - carry;
    let a = clamp(Math.sqrt(Math.max(1, carry)) * 7, 5, 200);
    let b = a * 1.1;
    let fa = off(a);
    let fb = off(b);
    for (let i = 0; i < 10 && Math.abs(fb) > SPEED_EXACT; i++) {
      if (fb === fa) break;
      const c = clamp(b - (fb * (b - a)) / (fb - fa), 2, 220);
      [a, fa] = [b, fb];
      b = c;
      fb = off(b);
    }
    if (Number.isFinite(fb) && Math.abs(fb) <= SPEED_EXACT) return b;
    let lo = 2;
    let hi = 220;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (carryOf({ ...shape, speedMph: mid }) < carry) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  });
}
// How near the carry asked for a speed found must carry (yards).
const SPEED_EXACT = 0.01;

// The start line (degrees) that lands a curving ball on the line it's
// aimed down: as far the other way as the curve takes it.
function aimFor(ball) {
  if (!ball.spinAxis) return 0;
  const key = `aim|${Math.round(ball.speedMph)}|${Math.round(ball.vla)}|${Math.round(ball.totalSpin / 100)}|${Math.round(ball.spinAxis)}`;
  return kept(key, () => {
    const at = simulateFlight({ ...ball, hla: 0 }).landing.position;
    return (-Math.atan2(at[2], at[0]) * 180) / Math.PI;
  });
}

// A putt's scale for a hole this far away (feet).
export function puttScale(feet) {
  const want = Math.max(1, Number(feet) || 0) * PAST;
  return PUTT_SCALES.find((s) => s >= want) ?? PUTT_SCALES.at(-1);
}

// The putt speed that rolls `feet` on a flat green of this stimp.
export function puttSpeedFor(feet, stimp = 10) {
  return kept(`putt|${stimp}|${Math.round(feet * 10)}`, () => {
    let lo = 0.1;
    let hi = 30;
    for (let i = 0; i < 26; i++) {
      const mid = (lo + hi) / 2;
      if (flatRoll(mid, stimp) / FOOT < feet) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  });
}

// What the shot A-Squared Golf would play here (`ideal`: the test shot's,
// without its wobble) asks: { carry } yards in still air for a full shot
// or a chip, { feet, hla } for a putt - the pace on the flat it's struck at
// (more uphill) and the line it's read on.
export function planOf(ideal, { putt = false, stimp = 10 } = {}) {
  if (!ideal || !(ideal.speedMph > 0)) return null;
  if (putt) return { feet: flatRoll(ideal.speedMph, stimp) / FOOT, hla: ideal.hla ?? 0 };
  return { carry: carryOf(ideal) };
}

// The swing pad's numbers before the swing: { full } yards a full swing
// carries (or { scale } feet for a putt), the mark (percent, or null where
// the level doesn't show it or there's no plan) - the swing for the shot
// as it plays, wind, slope and lie and all - and the flag's (percent, or
// null when it's the same): the swing for the flag were it all flat and
// still (the owner, 29 October 2026: "one line for the flag if it was on a
// flat, one line for the adjusted distance you need to do it because of
// wind, etc."). Neither past a full swing: a flag beyond the club's reach
// wants a full one, not an overswing (capped: the shot wants more than
// that - the pad's 100% line is its line). With them, what's said about
// them: flagYards, playYards and why (sim/swingguide.mjs; a putt's
// holeFeet and paceFeet), and tooFar, the level's (percent of the pull).
export const SAME_MARK = 2;
export function planMark({ club, setup = null, plan = null, putt = false, holeFeet = null, help = levelHelp("beginner"), skills = null }) {
  const tooFar = help.tooFar ?? TOO_FAR_PCT;
  const flagOf = (mark, at) => (mark != null && at != null && Math.abs(at - mark) >= SAME_MARK ? at : null);
  if (putt) {
    const scale = puttScale(holeFeet ?? plan?.feet ?? 10);
    const show = help.putt !== "none" && plan?.feet > 0;
    const mark = show ? clamp((plan.feet / scale) * 100, 1, FULL) : null;
    const hole = show && holeFeet > 0 ? clamp((holeFeet / scale) * 100, 1, FULL) : null;
    return { scale, mark, flag: flagOf(mark, hole), holeFeet: holeFeet ?? null, paceFeet: show ? plan.feet : null, tooFar };
  }
  // (The level's distances, and Power's points within them.)
  const full = fullCarry(club, setup) * reachOf(help, skills, club);
  const show = help.mark && plan?.carry > 0;
  const want = show ? (plan.carry / full) * 100 : null;
  const mark = show ? clamp(want, 1, FULL) : null;
  const flat = show && plan.flat > 0 ? clamp((plan.flat / full) * 100, 1, FULL) : null;
  return { full, mark, capped: show && want > FULL + 0.5, flag: flagOf(mark, flat), flagYards: plan?.flagYards ?? null, playYards: plan?.playYards ?? null, why: plan?.why ?? [], tooFar };
}

// What a pull carries, for the pad as it's made, a line each: "92%\n138
// yds", "64%\n19 ft".
export function pullWords(pct, { full = null, scale = null } = {}) {
  const p = Math.round(pct);
  if (scale) return `${p}%\n${Math.round((pct / 100) * scale)} ft`;
  if (!(full > 0)) return `${p}%`;
  return `${p}%\n${Math.round((pct / 100) * full)} yds`;
}

// The rhythm: back three times as long as through is pure. { ratio, dev,
// words } - dev how far outside the band (0 inside it), words "smooth",
// "rushed the backswing", "snatched at it"; null with no times.
export function tempoOf(swing, band) {
  const back = swing?.backMs;
  const down = swing?.downMs;
  if (!(back > 0) || !(down > 0)) return null;
  const ratio = back / down;
  if (!band) return { ratio, dev: 0, words: "" };
  const [lo, hi] = band;
  const dev = ratio < lo ? Math.log(lo / ratio) : ratio > hi ? Math.log(ratio / hi) : 0;
  const words = ratio < lo ? "rushed the backswing" : ratio > hi ? "snatched at it" : "smooth";
  return { ratio, dev, words };
}

// The shot. swing: the reader's ({ pct, start, slant, struck, pushed,
// backMs, downMs }); level (and custom: the menu's Custom set); setup (the
// shot setup); plan (planOf); putt, stimp and holeFeet for a putt; skills
// (the player's ranks: sim/skills.mjs); rand for the scatter (0 - 1
// uniform).
// Returns { ball, words, pct, snapped, tempo, harsh, carry | feet } - carry
// the yards a pure strike of this swing carries, feet a putt's on the flat;
// harsh the setup's price (setupHarshness).
export function madeUpShot({ club = "7I", swing, level = "beginner", custom = undefined, setup = null, plan = null, putt = false, stimp = 10, holeFeet = null, skills = null, rand = Math.random }) {
  const help = levelHelp(level, custom);
  const sk = shotSkills(skills);
  const s = cleanSetup(putt ? null : setup);
  const harsh = setupHarshness(s, sk);
  let pct = clamp(Number(swing?.pct) || 0, 0, MOST);
  const marked = planMark({ club, setup: s, plan, putt, holeFeet, skills, help: { ...help, mark: true, putt: putt ? "pace" : help.putt } });
  // Pulled too far: over the top (a stick can't be; a swing pad's pull
  // can, pulled or pct past the most) - later the easier the level.
  const pulled = clamp(Number(swing?.pulled ?? swing?.pct) || 0, 0, PULL_MOST_PCT);
  const farFrom = help.tooFar ?? TOO_FAR_PCT;
  const tooFar = pulled > farFrom;
  // Close enough to the mark counts as the mark (Beginner and Amateur,
  // and Feel's points at any level) - not one pulled too far, and a
  // narrower window for a shot set up.
  let snapped = false;
  const window = (help.snap + sk.snap) * harsh.window;
  if (window > 0 && !tooFar && marked.mark != null && marked.mark <= FULL && Math.abs(pct - marked.mark) <= window) {
    pct = marked.mark;
    snapped = true;
  }
  const over = Math.max(0, pct - FULL);
  // (Recovery: an overswing, and one pulled too far, hurt less.)
  const overK = help.over * over * sk.recovery;
  const wild = Math.max(0, pulled - farFrom) * Math.max(BEYOND.least, help.over) * sk.recovery;
  const faults = help.faults * (1 + help.over * sk.recovery * (OVER.per * over + OVER.squared * over * over)) * (1 + BEYOND.faults * wild) * harsh.faults;
  // The golfer's own spread, as much as the level says - tighter with
  // Consistency, half the setup's price on it too.
  const spread = (help.spread ?? spreadOf(help.faults)) * sk.spread * (1 + 0.5 * (harsh.faults - 1));
  // Sideways at the strike and the push's lean, less the level's wobble:
  // a finger's wandering doesn't count.
  const give = (v, dz) => Math.sign(v) * Math.max(0, Math.abs(v) - (dz ?? 0));
  const side = give(Number(swing?.start) || 0, help.wobble?.start);
  const lean = give(Number(swing?.slant) || 0, help.wobble?.slant);
  // Let go before coming back up through the ball (the swing pad): a
  // tenth shorter - the putt's roll, the shot's carry.
  const letGo = swing?.struck === false ? 1 - LET_GO : 1;
  if (putt) {
    const feet = (pct / 100) * marked.scale;
    const pace = 1 + gauss(rand) * (OVER.putt * overK + BEYOND.pace * wild + SPREAD.pace * spread * sk.putt);
    const start = clamp(side * START.putt * faults * sk.putt, -START.puttMost, START.puttMost) + gauss(rand) * (0.15 * overK + BEYOND.line * wild + SPREAD.line * spread * sk.putt);
    const ball = { speedMph: Math.max(0.3, puttSpeedFor(feet * letGo, stimp) * pace), vla: 1, hla: (help.putt === "read" ? (plan?.hla ?? 0) : 0) + start, totalSpin: 0, spinAxis: 0 };
    return { ball, pct, snapped, tempo: null, harsh, feet, words: madeWords({ putt, pct, pulled, wild, snapped, start, curve: 0, tempo: null, swing, feet }) };
  }
  // The rhythm (Tempo: a wider band, and less lost outside it).
  const band = help.tempo.band ? [help.tempo.band[0] / sk.tempoBand, help.tempo.band[1] * sk.tempoBand] : null;
  const tempo = help.tempo.weight ? tempoOf(swing, band) : null;
  const t = tempo ? tempo.dev * help.tempo.weight * sk.tempoCost : 0;
  const k = pct / 100;
  // (A chip or pitch: the short game's.)
  const short = k < SHORT_BELOW ? sk.short : 1;
  const crooked = faults * (1 + TEMPO.faults * t) * short;
  const spr = spread * short;
  let start = clamp(side * START.deg * crooked * sk.start, -START.most, START.most);
  let curve = clamp(((Math.atan(lean) * 180) / Math.PI) * CURVE.k * crooked * sk.curve, -CURVE.most, CURVE.most);
  start += gauss(rand) * (OVER.start * overK + BEYOND.start * wild + TEMPO.start * t + SPREAD.start * spr);
  curve = clamp(curve + gauss(rand) * (OVER.curve * overK + BEYOND.curve * wild + TEMPO.curve * t + SPREAD.curve * spr), -CURVE.most, CURVE.most);
  let loss = Math.abs(gauss(rand)) * (OVER.strike * overK + BEYOND.scatter * wild) + Math.min(TEMPO.most, TEMPO.loss * t) + BEYOND.loss * wild;
  // The strike: a touch either way, and now and then one off the toe or
  // thin (rand's own draws, so a steady middle - 0.5 - is a pure strike).
  // Strike: mishits rarer, and they cost less.
  loss -= gauss(rand) * SPREAD.strike * spr;
  const [lo, hi] = SPREAD.mishitLoss.map((v) => v * sk.mishitLoss);
  const m = rand();
  const chance = SPREAD.mishit * spr * sk.mishit * (help.mishit ?? 1);
  if (m < chance) loss += lo + (hi - lo) * (m / chance);
  // Over the top, a bad one likelier the further (its own draw).
  if (wild > 0) {
    const chance = Math.min(BEYOND.mishitMost, BEYOND.mishit * wild);
    const b = rand();
    if (b < chance) loss += BEYOND.mishitLoss[0] + (BEYOND.mishitLoss[1] - BEYOND.mishitLoss[0]) * (b / chance);
  }
  if (wild > 0) loss = Math.min(loss, BEYOND.most);
  const carry = (pct / 100) * fullCarry(club, s) * reachOf(help, skills, club) * letGo;
  const speed = speedFor(club, s, carry, k);
  // (The speed found for the carry with the setup's launch and spin.)
  const shaped = { ...setupBall({ speedMph: speed, hla: 0, spinAxis: 0, ...partShape(club, k) }, s), speedMph: speed };
  const ball = { ...shaped, speedMph: Math.max(0.5, speed * (1 - loss)), hla: aimFor(shaped) + start, spinAxis: shaped.spinAxis + curve };
  return { ball, pct, snapped, tempo, harsh, carry, words: madeWords({ putt, pct, pulled, wild, snapped, start, curve, tempo, swing, loss }) };
}

// "96% - starts left, curving right - tempo 3.1 to 1", "Overswung 104% -
// straight - tempo 6.2 to 1, snatched at it", "62% putt (19 ft) - straight",
// "Way too far (122%), over the top - starts right, curving left - a bad
// mishit".
function madeWords({ putt, pct, pulled = pct, wild = 0, snapped, start, curve, tempo, swing, feet, loss = 0 }) {
  const p = Math.round(pct);
  const too = wild > 0 ? `Way too far (${Math.round(pulled)}%), over the top` : "";
  const how = putt ? `${too ? `${too} - ` : ""}${p}% putt (${Math.round(feet)} ft)` : too || (pct > FULL + 0.5 ? `Overswung ${p}%` : `${p}%`);
  const side = (v, n, l, r) => (Math.abs(v) < n ? "" : v < 0 ? l : r);
  const line = [side(start, putt ? 1 : 1.5, "starts left", "starts right"), side(curve, 6, "curving left", "curving right")].filter(Boolean).join(", ") || "straight";
  const parts = [`${how}${snapped ? " (on the mark)" : ""}`, line];
  // Said first, so it's plain why it came up short.
  if (swing?.struck === false) parts.unshift(`Let go early - ${Math.round(LET_GO * 100)}% shorter`);
  if (loss > 0.2) parts.push("a bad mishit");
  else if (loss > 0.04) parts.push("off the middle");
  if (tempo) parts.push(`tempo ${tempo.ratio.toFixed(1)} to 1${tempo.words && tempo.words !== "smooth" ? `, ${tempo.words}` : ""}`);
  return parts.join(" - ");
}
