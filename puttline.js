// The ideal line on the greens (sim/puttguide.mjs LINE_LEVELS): off, after
// each putt, or before and after. One setting for the putting green and
// the course, remembered between sessions; T steps it. With it, the other
// settings the two greens share: plays-like before the putt, and the
// grid's colours.

import { loadSetting, saveSetting } from "./util.js";
import { LINE_NAMES, nextLineLevel, savedLineLevel } from "./sim/puttguide.mjs";

const saved = loadSetting("puttline", {});
// level: the ideal line's. playsLike: say what a putt plays like (and that
// a putt runs away downhill) before it's struck - a help, off unless asked
// for; after a putt its pace against what was needed is always said.
// gridColours: the grid's markers coloured by how steep it is (greengrid.js
// slopeColor), or plain white - the grid without the colouring, its lines
// and the markers' pace showing the slopes (the owner, 26 October 2026:
// "You should be able to toggle the colouring off the grid but not the
// grid. So you can get a better idea of the slopes").
export const puttLine = { level: savedLineLevel(saved, loadSetting("putting", {})), playsLike: saved.playsLike === true, gridColours: saved.gridColours !== false };
const watchers = new Set();

export function setLineLevel(level) {
  puttLine.level = level;
  saveSetting("puttline", puttLine);
  for (const fn of watchers) fn(level);
}

// T: the next level, and what to say about it.
export function stepLineLevel() {
  setLineLevel(nextLineLevel(puttLine.level));
  return `Ideal line: ${LINE_NAMES[puttLine.level].toLowerCase()}`;
}

export function watchLineLevel(fn) {
  watchers.add(fn);
}

// The options for a drop-down.
export function lineOptions() {
  return Object.entries(LINE_NAMES)
    .map(([v, t]) => `<option value="${v}" ${v === puttLine.level ? "selected" : ""}>${t}</option>`)
    .join("");
}

// Plays-like before the putt: on or off, for both greens.
export function setPlaysLike(on) {
  puttLine.playsLike = !!on;
  saveSetting("puttline", puttLine);
  for (const fn of watchers) fn(puttLine.level);
}

// The grid's colours: on or off, for both greens (each grid looks as it
// draws its markers, so it changes at once).
export function setGridColours(on) {
  puttLine.gridColours = !!on;
  saveSetting("puttline", puttLine);
  for (const fn of watchers) fn(puttLine.level);
}
