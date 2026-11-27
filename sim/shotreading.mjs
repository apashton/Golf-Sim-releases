// What a shot was hit as, against what it played like and what it did in
// the game - for the recording's numbers and words (sim/videotiles.mjs) and
// the command centre's number boxes (the owner, 27 November 2026: "be good
// to see what the normal reading is versus the game result. User aiming
// for a 20ft putt on a 15ft uphill put and hitting the 20ft show they hit
// their intended aim ... when I'm recording I'm talking about the power
// I'm aiming for in the putts and approach shots"). Pure.
//
//   hit as       how far that strike goes on the flat - the normal reading:
//                a putt at the green's speed (puttguide.mjs flatRoll), a
//                full shot in still air over flat ground (flight.mjs
//                simulateShot, as a range or the launch monitor's own
//                screen has it: app.js keeps it as the shot's `still`) -
//                its total, where it would have finished; and the full
//                shot's carry too (hitAsCarry)
//   plays like   the flat distance it needed: a putt's dead-weight pace
//                (puttguide.mjs lineFigures playsLike); a shot at the
//                flag, the flag as the swing pad has it (swingguide.mjs
//                playYards: the wind, the air, up or down, the lie) - none
//                for a shot that isn't played at the flag (aimedAt)
//   in the game  what it did here: how far the putt rolled; the full
//                shot's total as the game flew it (the shot's `flight`:
//                the wind, the air, the ground, the lie)
//
// Putts in feet, full shots in yards. A mode hands over a reading (app.js
// onReading): a putt's as it's struck (puttReading) and again once it
// stops (puttDone); a full shot's as it's struck (fullReading) and once
// it's down (fullDone). Before a shot's struck, the shot at hand's read
// (the same shapes, before: true - app.js info's `read`) shows in its
// place: how far, up or down, what it plays like.

import { FOOT, INCH } from "./putting.mjs";
import { figure, ON_PACE } from "./puttguide.mjs";
import { BAG } from "./clubs.mjs";

const DASH = "–";
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

// ---- What the modes hand over ------------------------------------------------------

// A putt's reading. Metres in (distance to the hole; feedback: puttguide.mjs
// puttFeedback; fig: lineFigures; aim: the ideal line's aim at the hole,
// right +, or null where the game isn't showing it), feet and inches out:
// { kind: "putt", before, distance, hitAs, needed, runsAway, rise (inches,
// uphill +), slopePct, stimp, aim (inches, right +), speedMph, rollSeconds,
// done }. before: the putt at hand, not struck yet (hitAs null);
// showNeeded false: what it plays like kept back (the player judging the
// pace: puttline.js playsLike). rollSeconds: how long it rolls
// (sim/shotphase.mjs keeps the after-the-shot time from when it stops).
export function puttReading({ distance, stimp = null, feedback = null, fig = null, aim = null, speedMph = null, rollSeconds = null, before = false, showNeeded = true } = {}) {
  const figs = fig ?? null;
  const runsAway = !!(figs?.runsAway ?? feedback?.runsAway);
  const neededM = num(figs?.playsLike ?? feedback?.needed);
  return {
    kind: "putt",
    before: !!before,
    distance: num(distance) != null ? distance / FOOT : null,
    hitAs: !before && num(feedback?.flat) != null ? feedback.flat / FOOT : null,
    needed: showNeeded && !runsAway && neededM != null ? neededM / FOOT : null,
    runsAway: showNeeded && runsAway,
    rise: num(figs?.rise) != null ? figs.rise / INCH : null,
    slopePct: num(figs?.slopePct),
    stimp: num(stimp),
    aim: num(aim) != null ? aim / INCH : null,
    speedMph: num(speedMph),
    rollSeconds: num(rollSeconds) != null && rollSeconds > 0 ? rollSeconds : null,
    done: false,
  };
}

// The putt once it's stopped: holed, or where it finished from the hole
// (feet: long past it +, right +). { ...reading, done, holed, rolled (feet
// from where it was struck to where it stopped; holed, to the hole), long,
// right, away }.
export function puttDone(reading, { holed = false, long = 0, right = 0 } = {}) {
  const l = num(long) ?? 0;
  const r = num(right) ?? 0;
  const d = reading?.distance ?? 0;
  return { ...reading, done: true, holed: !!holed, rolled: holed ? d : Math.hypot(d + l, r), long: holed ? 0 : l, right: holed ? 0 : r, away: holed ? 0 : Math.hypot(l, r) };
}

// A full shot's reading, yards: { kind: "full", before, toPin (to the flag
// or target; null with none), plays (what it plays like; null where the
// shot isn't played at it), rise (how much higher the flag is), done }.
export function fullReading({ toPin = null, plays = null, rise = null, before = false } = {}) {
  return { kind: "full", before: !!before, toPin: num(toPin), plays: num(plays), rise: num(rise), done: false };
}

// The full shot once it's down, yards: holed, or how far from the flag
// (away) - long past it +, right +. A shot with no flag to finish by has
// nothing to add.
export function fullDone(reading, { holed = false, away = null, long = null, right = null } = {}) {
  if (reading?.toPin == null) return { ...reading, done: true };
  return { ...reading, done: true, holed: !!holed, away: holed ? 0 : num(away), long: holed ? 0 : num(long), right: holed ? 0 : num(right) };
}

// Whether a full shot is played at the flag - an approach - so what it
// plays like means something: the flag within reach of the club (its
// carry in the bag, sim/clubs.mjs BAG, REACH times over and REACH_YARDS
// more - a lay-up or a drive down a long hole isn't one). `plays`: what the
// flag plays like, yards.
export const REACH = 1.3;
export const REACH_YARDS = 15;
export function aimedAt(plays, club) {
  if (!(plays > 0)) return false;
  const carry = BAG[club]?.carry ?? BAG["7I"].carry;
  return plays <= carry * REACH + REACH_YARDS;
}

// ---- How it shows ------------------------------------------------------------------

// Hit as against plays like: right on it - a putt within half a foot, as
// the game's own line after it says "right on it" (puttguide.mjs ON_PACE:
// the recording never calls on it a putt the game calls long or short);
// an approach within the larger of 3 yds or 4%.
export const ON_IT = { putt: { least: ON_PACE / FOOT, share: 0 }, full: { least: 3, share: 0.04 } };
export function onIt(kind, hitAs, plays) {
  if (num(hitAs) == null || num(plays) == null) return null;
  const d = Math.abs(hitAs - plays);
  if (kind === "putt") return d < ON_IT.putt.least;
  const t = ON_IT[kind] ?? ON_IT.full;
  return d <= Math.max(t.least, t.share * plays);
}

// Feet as written: whole from 3 ft, a tenth below - rounded as the game's
// own lines round them (puttguide.mjs figure), so the two never differ by
// a foot. Yards whole.
export function feetText(v) {
  return num(v) == null ? DASH : figure(v);
}
const yardsText = (v) => (num(v) == null ? DASH : String(Math.round(Math.abs(v))));
// Inches as written, feet beyond two of them: "4 in", "2.5 ft" (as the
// game's riseText and aimText write them).
function inchesWords(v) {
  const a = Math.abs(v);
  if (a < 24) return `${figure(a)} in`;
  return `${feetText(a / 12)} ft`;
}

// The shot's reading to show: the shot at hand's read before it's struck,
// else the last shot's own - and what it was hit as and did in the game.
// shot: the recording's shot ({ reading, still, flight, ball }); read: the
// shot at hand's (app.js info). -> { kind, r, hitAs, hitAsCarry, inGame,
// putt } or null for nothing to show.
export function readingNow(shot, read = null) {
  const r = read ?? shot?.reading ?? null;
  const putt = r ? r.kind === "putt" : !shot?.still && !!shot?.ball;
  const live = !!read;
  if (!r && !shot?.still) return null;
  if (putt) {
    return { kind: "putt", r: r ?? {}, hitAs: live ? null : num(r?.hitAs), hitAsCarry: null, inGame: !live && r?.done ? num(r.rolled) : null };
  }
  return {
    kind: "full",
    r: r ?? {},
    hitAs: live ? null : num(shot?.still?.total),
    hitAsCarry: live ? null : num(shot?.still?.carry),
    inGame: live ? null : num(shot?.flight?.total),
  };
}

// The putt's or shot's finish in a few words: "Holed", "2.1 ft long", "4
// ft left"; a full shot's "14 ft long", "12 yds short" (feet when it
// finished inside 30 of them). Along the line when that's the most of it,
// else across - each number the distance that way, never the whole
// distance away under one word. both: the other way too where it's at
// least half as much, as the game's own result box gives both ("1.4 ft
// long, 1.1 ft right" - the words line; a tile has room for one).
function finishWords(r, kind, { both = false } = {}) {
  if (!r?.done || r.holed == null) return null;
  if (r.holed) return "Holed";
  if (num(r.away) == null) return null;
  const l = num(r.long) ?? 0;
  const s = num(r.right) ?? 0;
  const along = { v: l, word: l >= 0 ? "long" : "short" };
  const across = { v: s, word: s > 0 ? "right" : "left" };
  // (No parts given: how far away alone.)
  const [main, other] = !l && !s ? [{ v: r.away, word: "away" }, { v: 0 }] : Math.abs(l) >= Math.abs(s) ? [along, across] : [across, along];
  // A full shot in feet only when it finished inside 30 of them.
  const inFeet = kind === "putt" || r.away * 3 < 30;
  const words = (p) => (kind === "putt" ? `${feetText(p.v)} ft ${p.word}` : inFeet ? `${feetText(p.v * 3)} ft ${p.word}` : `${yardsText(p.v)} yds ${p.word}`);
  const out = words(main);
  return both && Math.abs(other.v) >= Math.abs(main.v) / 2 && Math.abs(other.v) > 0 ? `${out}, ${words(other)}` : out;
}

// Hit as against plays like in words: "On it", "3 ft firm", "2 ft soft"
// (a putt), "6 yds over", "4 yds under" (an approach).
function versusWords(n) {
  const plays = n.kind === "putt" ? n.r.needed : n.r.plays;
  const on = onIt(n.kind, n.hitAs, plays);
  if (on == null) return null;
  if (on) return "On it";
  const diff = n.hitAs - plays;
  return n.kind === "putt" ? `${feetText(diff)} ft ${diff > 0 ? "firm" : "soft"}` : `${yardsText(diff)} yds ${diff > 0 ? "over" : "under"}`;
}

// Up or down to the hole: "↑ 4 in", "↓ 2.5 ft" (a putt), "↑ 4 yds" (to the
// flag), "Level".
function riseWords(n) {
  const v = num(n.r.rise);
  if (v == null) return null;
  if (n.kind === "putt") return Math.abs(v) < 0.25 ? "Level" : `${v > 0 ? "↑" : "↓"} ${inchesWords(v)}`;
  return Math.abs(v) < 1 ? "Level" : `${v > 0 ? "↑" : "↓"} ${yardsText(v)} yds`;
}

// The ideal line's aim: "8 in L", "Straight".
function aimWords(v) {
  if (num(v) == null) return null;
  if (Math.abs(v) < 0.5) return "Straight";
  return `${inchesWords(v)} ${v > 0 ? "R" : "L"}`;
}

// The numbers (sim/videotiles.mjs TILES has their names): key -> { value,
// unit }, a dash where there's nothing to show.
export const READING_KEYS = ["hitAs", "hitAsCarry", "toHole", "rise", "playsLike", "inGame", "vsPlays", "finish", "stimp", "aim"];
// Those only a putt has, and only a full shot.
export const PUTT_ONLY = ["stimp", "aim"];
export const FULL_ONLY = ["hitAsCarry"];
export function readingTiles(shot, read = null) {
  const n = readingNow(shot, read);
  const out = Object.fromEntries(READING_KEYS.map((k) => [k, { value: DASH, unit: "" }]));
  if (!n) return out;
  const putt = n.kind === "putt";
  const unit = putt ? "ft" : "yds";
  const dist = putt ? feetText : yardsText;
  const set = (k, value, u = "") => {
    if (value != null && value !== "" && value !== DASH) out[k] = { value, unit: u };
  };
  set("hitAs", n.hitAs != null ? dist(n.hitAs) : null, unit);
  set("playsLike", (putt ? n.r.needed : n.r.plays) != null ? dist(putt ? n.r.needed : n.r.plays) : null, unit);
  set("inGame", n.inGame != null ? dist(n.inGame) : null, unit);
  set("vsPlays", versusWords(n));
  set("toHole", (putt ? n.r.distance : n.r.toPin) != null ? dist(putt ? n.r.distance : n.r.toPin) : null, unit);
  set("rise", riseWords(n));
  set("finish", finishWords(n.r, n.kind));
  if (putt) {
    set("stimp", n.r.stimp != null ? String(Math.round(n.r.stimp * 10) / 10) : null);
    set("aim", aimWords(n.r.aim));
  } else set("hitAsCarry", n.hitAsCarry != null ? dist(n.hitAsCarry) : null, unit);
  return out;
}

// The same in one line, for a words box (sim/videotiles.mjs infoField
// "reading"): before a putt "15 ft · ↑ 4 in uphill (1.7%) · plays like 20
// ft"; after it "Hit as 20 ft · Plays like 20 ft · On it · Rolled 15 ft,
// holed"; a full shot "Hit as 170 yds · Plays like 165 · On it · Went 163
// yds, 14 ft long" - or before it "160 yds · plays like 165". "" for
// nothing to say.
export function readingWords(shot, read = null) {
  const n = readingNow(shot, read);
  if (!n) return "";
  const r = n.r;
  if (n.kind === "putt") {
    if (read) {
      if (r.distance == null) return "";
      const parts = [`${feetText(r.distance)} ft`];
      const v = num(r.rise);
      if (v != null) parts.push(Math.abs(v) < 0.25 ? "level" : `${v > 0 ? "↑" : "↓"} ${inchesWords(v)} ${v > 0 ? "uphill" : "downhill"}${num(r.slopePct) != null && Math.abs(r.slopePct) >= 0.05 ? ` (${Math.abs(r.slopePct).toFixed(1)}%)` : ""}`);
      if (r.runsAway) parts.push("runs away downhill");
      else if (r.needed != null) parts.push(`plays like ${feetText(r.needed)} ft`);
      return parts.join(" · ");
    }
    if (n.hitAs == null) return "";
    const parts = [`Hit as ${feetText(n.hitAs)} ft`];
    if (r.needed != null) parts.push(`Plays like ${feetText(r.needed)} ft`, versusWords(n));
    const fin = finishWords(r, "putt", { both: true });
    if (r.done) parts.push(`Rolled ${feetText(r.rolled)} ft${r.holed ? ", holed" : fin ? `, ${fin}` : ""}`);
    else parts.push("Rolling...");
    return parts.join(" · ");
  }
  if (read) return r.toPin != null && r.plays != null ? `${yardsText(r.toPin)} yds · plays like ${yardsText(r.plays)}` : "";
  if (n.hitAs == null) return "";
  const parts = [`Hit as ${yardsText(n.hitAs)} yds`];
  if (r.plays != null) parts.push(`Plays like ${yardsText(r.plays)}`, versusWords(n));
  if (n.inGame != null) {
    const fin = finishWords(r, "full", { both: true });
    parts.push(`Went ${yardsText(n.inGame)} yds${fin ? `, ${fin === "Holed" ? "holed" : fin}` : ""}`);
  }
  return parts.join(" · ");
}
