// The open ladders (the owner, 7 November 2026: joining ladders "even
// doable with strangers"): the relay's board of listed ladders with a place
// free (relay/board.mjs), as the Online tab's Open ladders shows them
// (course/ladderopen.js) - which suit this bay, and each in a line. Pure.
//
// An entry: { code, name, play, kind, way, level, holes, gimme, season,
// places, filled, started, own: [best, worst] handicap or null }.

import { PLAY_NAMES, KIND_NAMES, WAY_NAMES } from "./matchladder.mjs";
import { LEVELS as SWING_LEVELS } from "./swinglevels.mjs";

// How far outside a ladder's handicaps a player still counts as near them.
export const NEAR_STROKES = 8;
export const SWING_FILTERS = ["mine", "any"];

// Whether a ladder suits how this bay swings: a launch monitor ladder for a
// launch monitor, a made-up swings one for the mouse, a finger or a
// controller - and "any way" for both.
export const suitsSwing = (e, way) => e.way === "any" || e.way === way;

// Whether a handicap is near a ladder's players' (no handicap, or nobody's
// on it with one: near).
export function nearHandicap(e, index) {
  if (!Number.isFinite(index) || !Array.isArray(e.own)) return true;
  return index >= e.own[0] - NEAR_STROKES && index <= e.own[1] + NEAR_STROKES;
}

// The board's ladders this bay would want: not ones it's on already, and -
// as the filters say - its way of swinging (swing "mine": way) and near
// its handicap (near: index).
export function openFor(list, { mine = [], swing = "mine", way = "monitor", near = false, index = null } = {}) {
  const on = new Set(mine);
  return (list ?? []).filter((e) => e?.code && !on.has(e.code) && (swing !== "mine" || suitsSwing(e, way)) && (!near || nearHandicap(e, index)));
}

// An entry's rules in a line: "Postal, handicap, 9 holes, launch monitor".
export function rulesLine(e) {
  const way = e.way === "monitor" ? "launch monitor" : e.way === "madeup" ? `mouse, finger or controller (${SWING_LEVELS[e.level]?.label ?? e.level})` : WAY_NAMES.any.toLowerCase();
  return `${PLAY_NAMES[e.play] ?? e.play}, ${(KIND_NAMES[e.kind] ?? e.kind).toLowerCase()}, ${e.holes} holes, ${way}`;
}

// Its places in a line: "3 of 8 places taken - waiting to start; handicaps
// 6 to 20".
export function placesLine(e) {
  const own = Array.isArray(e.own) ? (e.own[0] === e.own[1] ? `; handicap ${e.own[0]}` : `; handicaps ${e.own[0]} to ${e.own[1]}`) : "";
  const left = e.places - e.filled;
  const when = e.started ? `under way, ${left === 1 ? "a place" : `${left} places`} free` : `waiting to start - ${left === 1 ? "one more" : `${left} more`} and it's off`;
  return `${e.filled} of ${e.places} places taken - ${when}${own}`;
}
