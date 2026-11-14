// Skill points for made-up swings - the swing pad (a finger or the mouse)
// and a game controller (the owner, 25 October 2026: "We need ways to
// build skill points. And attribute those skill points to things like
// distance spin etc. not able to max every skill out so have to choose
// preferred things to be better at. When hitting shots a stock shot has no
// increased difficulty, but controlling the spin/height (picked before
// shot) increase the harshness of not hitting a perfect swing. This can be
// reduced with skill sets etc. and how close you have to be to the power
// bar reduced"; on the proposal: "75 total points. But anything past 60
// gets very hard to earn and achieve", and re-spending as proposed; then
// "Just drop shaping. Power is fine ... That power also is controlled by
// level picked. So cant have 320 drives on beginner level").
//
//   - Points come from what's recorded: the stats' games played with
//     made-up swings (gameXp: a course round's holes, its pars and better
//     and its finish, a season event's place, a challenge), so they're the
//     same on the PC and on the phone once its stats are sent. Each point
//     costs more XP than the last, and from the 61st far more (pointCost):
//     75 at most.
//   - Each of the eleven attributes takes up to MAX_RANK points: 110 in
//     all, so even 75 fills under seven - you choose what to be good at.
//     Power moves a player's distances through their level's
//     (swinglevels.mjs DRIVES: Beginner's drives 180 yards with none, 220
//     with ten), so no Power makes a Beginner drive like a Tour player.
//   - Spent points can be moved (a re-spend: lowering any) freely below
//     level 5, then once a season (once in RESPEC_DAYS with no season).
//   - What the ranks do is shotSkills's: the multipliers madeshot.mjs
//     plays a swing with.
//   - The shot setup's price (setupHarshness): a stock shot plays as it
//     always has, and so does a little curve, height or spin (the setup's
//     free middle); more makes a crooked swing more crooked and narrows the
//     window round the flag's mark that counts as the mark, the more the
//     further out. Trajectory takes back the height's and spin's share; a
//     curve's stays.
//
// A player's skills are theirs on every made-up device (touch, the mouse,
// a controller). Pure.

import { clamp } from "./mathutil.mjs";
import { setupRisk } from "./shotsetup.mjs";
import { DRIVES, DRIVE_FROM, RANKED, LEVELS } from "./swinglevels.mjs";

// The made-up devices (sim/madeuphcp.mjs DEVICES: not imported, as it
// imports madeshot.mjs, which imports this).
const DEVICES = ["controller", "mouse"];

// Power's words: each level's drives (carry and roll) with none and ten.
const yards = (v) => Math.round(v);
const reaches = RANKED.map((k) => `${LEVELS[k].label} ${yards(DRIVES[k] * DRIVE_FROM)}-${DRIVES[k]}`).join(", ");

export const ATTRIBUTES = [
  { id: "power", name: "Power", does: `Your distances within your level's: each point a tenth of the way from its shortest drives to its longest, the whole bag with them (yards with roll: ${reaches})` },
  { id: "accuracy", name: "Accuracy", does: "A crooked push starts 4% less off line a point" },
  { id: "curve", name: "Curve control", does: "A slanted push curves 4% less a point" },
  { id: "consistency", name: "Consistency", does: "Your natural spread - the same swing going a bit differently each time - 3% tighter a point" },
  { id: "feel", name: "Feel", does: "Half a percent more each side of the flag's mark counts as the mark, a point" },
  { id: "tempo", name: "Tempo", does: "The good-rhythm band 6% wider each way, and a bad rhythm costs 5% less, a point" },
  { id: "strike", name: "Strike", does: "Mishits 6% rarer, and a little less costly, a point" },
  { id: "trajectory", name: "Trajectory", does: "What picking a height or spin adds to a fault 8% less a point" },
  { id: "shortgame", name: "Short game", does: "Chips and pitches (swings under 85%): faults and spread 4% smaller a point" },
  { id: "putting", name: "Putting", does: "A putt's pace and line spread, and a crooked stroke, 4% smaller a point" },
  { id: "recovery", name: "Recovery", does: "Over-swinging and pulling too far hurt 5% less a point" },
];
export const ATTRIBUTE_IDS = ATTRIBUTES.map((a) => a.id);
export const MAX_RANK = 10;
// The most points anyone has, and the last before they get far harder.
export const MOST_POINTS = 75;
export const HARD_FROM = 60;
// A re-spend is free below this level (points earned); after it, once a
// season - or with no season going, once in this many days.
export const FREE_RESPEC_BELOW = 5;
export const RESPEC_DAYS = 90;

// ---- Earning ------------------------------------------------------------------

// XP: a course round's each hole played, a par, a birdie and an eagle (or
// better) on it, an 18 or 9 hole round finished, a season event by where
// it finished (seasonPos); any other game (a challenge) its own - no more
// than GAMES_A_DAY of those a day count, so they can't be ground out.
export const XP = { hole: 10, par: 5, birdie: 15, eagle: 40, round18: 50, round9: 25, game: 20, win: 200, top5: 100, top10: 50 };
export const GAMES_A_DAY = 10;
const DAY = 86_400_000;

// One recorded game's XP ({ kind, sw, scores, pars, holes, complete,
// seasonPos }): none unless it was played with made-up swings (sw).
export function gameXp(g) {
  if (!g || !DEVICES.includes(g.sw)) return 0;
  if (g.kind !== "course") return XP.game;
  let xp = 0;
  const scores = Array.isArray(g.scores) ? g.scores : [];
  const pars = Array.isArray(g.pars) ? g.pars : [];
  for (let i = 0; i < scores.length; i++) {
    if (!Number.isFinite(scores[i])) continue;
    xp += XP.hole;
    if (!Number.isFinite(pars[i])) continue;
    const d = scores[i] - pars[i];
    xp += d <= -2 ? XP.eagle : d === -1 ? XP.birdie : d === 0 ? XP.par : 0;
  }
  const holes = Number.isFinite(g.holes) ? g.holes : scores.filter(Number.isFinite).length;
  if (g.complete) xp += holes >= 18 ? XP.round18 : holes >= 9 ? XP.round9 : 0;
  const pos = g.seasonPos;
  if (Number.isInteger(pos) && pos > 0) xp += pos === 1 ? XP.win : pos <= 5 ? XP.top5 : pos <= 10 ? XP.top10 : 0;
  return xp;
}

// Everything a player's games earned.
export function xpOf(games) {
  let xp = 0;
  const perDay = new Map();
  for (const g of games ?? []) {
    const x = gameXp(g);
    if (!x) continue;
    if (g.kind !== "course") {
      const day = Number.isFinite(g.t) ? Math.floor(g.t / DAY) : 0;
      const n = perDay.get(day) ?? 0;
      if (n >= GAMES_A_DAY) continue;
      perDay.set(day, n + 1);
    }
    xp += x;
  }
  return xp;
}

// The XP the nth point costs: 200 for the first and 15 more each, so the
// 60th's 1,085 (about a round a point at first, three by the 60th); from
// the 61st twice that and an eighth more each - the last few take hundreds
// of rounds.
export function pointCost(n) {
  if (n <= HARD_FROM) return 200 + 15 * (n - 1);
  return Math.round(2 * pointCost(HARD_FROM) * 1.12 ** (n - HARD_FROM - 1));
}

// The points `xp` earns: { points, into (XP towards the next), need (the
// next's cost, or null at the most) }.
export function pointsFor(xp) {
  let points = 0;
  let used = 0;
  const x = Math.max(0, Number(xp) || 0);
  while (points < MOST_POINTS && used + pointCost(points + 1) <= x) {
    used += pointCost(points + 1);
    points++;
  }
  return { points, into: x - used, need: points < MOST_POINTS ? pointCost(points + 1) : null };
}

// ---- Spending -----------------------------------------------------------------

// Ranks made sound: { attribute: 1 - MAX_RANK } (none for 0).
export function cleanRanks(r) {
  const out = {};
  for (const id of ATTRIBUTE_IDS) {
    const v = Number(r?.[id]);
    if (Number.isInteger(v) && v > 0) out[id] = Math.min(MAX_RANK, v);
  }
  return out;
}
export const spentOf = (ranks) => Object.values(cleanRanks(ranks)).reduce((a, b) => a + b, 0);

// Where a player's skills stand, from their games and their skill writes
// ([{ ranks, t, re }], oldest first - re: a re-spend that counted), on
// top of `base` (the phone's: { xp, ranks, lastRespec } as the PC last
// sent them, its own games and writes since): { xp, points, into, need,
// ranks, spent, left, lastRespec }.
export function skillsOf(games, lines = [], base = null) {
  const xp = (Number(base?.xp) || 0) + xpOf(games);
  const earned = pointsFor(xp);
  let ranks = cleanRanks(base?.ranks);
  let lastRespec = Number.isFinite(base?.lastRespec) ? base.lastRespec : null;
  for (const l of lines ?? []) {
    ranks = cleanRanks(l?.ranks);
    if (l?.re && Number.isFinite(l.t)) lastRespec = l.t;
  }
  // (Never more spent than earned: what's over comes off the last ranks.)
  let spent = spentOf(ranks);
  for (const id of [...ATTRIBUTE_IDS].reverse()) {
    while (spent > earned.points && ranks[id] > 0) {
      ranks[id]--;
      spent--;
      if (!ranks[id]) delete ranks[id];
    }
  }
  return { xp, ...earned, ranks, spent, left: earned.points - spent, lastRespec };
}

// Whether points can be moved now: { ok, free, words }.
export function canRespec({ points = 0, lastRespec = null, seasonStart = null, now = Date.now() } = {}) {
  if (points < FREE_RESPEC_BELOW) return { ok: true, free: true, words: `Free below level ${FREE_RESPEC_BELOW}` };
  const since = Number.isFinite(seasonStart) ? seasonStart : now - RESPEC_DAYS * DAY;
  if (lastRespec == null || lastRespec < since) return { ok: true, free: false, words: Number.isFinite(seasonStart) ? "Once this season" : `Once in ${RESPEC_DAYS} days` };
  return { ok: false, free: false, words: Number.isFinite(seasonStart) ? "Already moved points this season - next season" : `Already moved points in the last ${RESPEC_DAYS} days` };
}

// New ranks checked against where they stand (skillsOf): { ok, ranks, re
// (a re-spend that counts), why }.
export function checkSpend(now, wanted, { seasonStart = null, at = Date.now() } = {}) {
  const ranks = cleanRanks(wanted);
  const spent = spentOf(ranks);
  if (spent > now.points) return { ok: false, why: `${now.points} point${now.points === 1 ? "" : "s"} to spend, not ${spent}` };
  const lowered = ATTRIBUTE_IDS.some((id) => (ranks[id] ?? 0) < (now.ranks?.[id] ?? 0));
  if (!lowered) return { ok: true, ranks, re: false };
  const r = canRespec({ points: now.points, lastRespec: now.lastRespec, seasonStart, now: at });
  if (!r.ok) return { ok: false, why: r.words };
  return { ok: true, ranks, re: !r.free };
}

// ---- Playing ------------------------------------------------------------------

// What a player's ranks do to a swing (madeshot.mjs): each a multiplier
// (1 with no points), Feel's percent of extra window, or Power's share of
// the way through the level's distances (0 to 1: madeshot.mjs reachOf).
export function shotSkills(ranks) {
  const r = (id) => clamp(Number(ranks?.[id]) || 0, 0, MAX_RANK);
  return {
    power: r("power") / MAX_RANK,
    start: 1 - 0.04 * r("accuracy"),
    curve: 1 - 0.04 * r("curve"),
    spread: 1 - 0.03 * r("consistency"),
    snap: 0.5 * r("feel"),
    tempoBand: 1 + 0.06 * r("tempo"),
    tempoCost: 1 - 0.05 * r("tempo"),
    mishit: 1 - 0.06 * r("strike"),
    mishitLoss: 1 - 0.03 * r("strike"),
    trajectory: 1 - 0.08 * r("trajectory"),
    short: 1 - 0.04 * r("shortgame"),
    putt: 1 - 0.04 * r("putting"),
    recovery: 1 - 0.05 * r("recovery"),
  };
}
export const NO_SKILLS = Object.freeze(shotSkills({}));
// A part swing under this share of a full one is the short game's.
export const SHORT_BELOW = 0.85;

// The shot setup's price: how much more a fault shows (faults) and how
// much of the window round the flag's mark is left (window); a stock shot
// 1 and 1. Nothing within the setup's free middle (sim/shotsetup.mjs
// FREE); past it, with the risk the card shows, faster near the edge
// (HARSH.rise): at the ball's edge a fault shows 1.35x, the spin's share
// narrowing the window a quarter; at the bar's ends 1.45x and the window
// halved. Trajectory takes back the height's and spin's share; the
// curve's no skill does.
export const HARSH = { ball: 0.35, height: 0.45, heightWindow: 0.5, spinWindow: 0.25, rise: 1.4 };
export function setupHarshness(setup, skills = NO_SKILLS) {
  const risk = setupRisk(setup);
  if (!risk.ball && !risk.height) return { faults: 1, window: 1, plain: true };
  const ball = risk.ball ** HARSH.rise;
  const height = risk.height ** HARSH.rise;
  const curve = 1 + HARSH.ball * ball * risk.curve;
  const flight = (1 + HARSH.height * height) * (1 + HARSH.ball * ball * (1 - risk.curve));
  const faults = (1 + (flight - 1) * skills.trajectory) * curve;
  const w = (1 - HARSH.heightWindow * height) * (1 - HARSH.spinWindow * ball * (1 - risk.curve));
  return { faults, window: 1 - (1 - w) * skills.trajectory, plain: false };
}

// The setup's price in words, for the shot setup card: "Faults show 1.4x,
// the mark's window half as wide", or "" for a stock shot.
export function harshWords(h) {
  if (!h || h.plain) return "";
  // (Rounded up: a little past the free middle says 1.01x, not 1.0x.)
  const faults = Math.ceil(h.faults * 100 - 1e-9) / 100;
  const parts = [`a crooked swing shows ${faults.toFixed(2).replace(/0$/, "")}x`];
  if (h.window < 0.99) parts.push(Math.abs(h.window - 0.5) < 0.01 ? "the mark's window half as wide" : `the mark's window ${Math.round((1 - h.window) * 100)}% narrower`);
  return parts.join(", ");
}
