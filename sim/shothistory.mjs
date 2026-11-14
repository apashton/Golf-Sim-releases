// The command centre's shot history (the owner: "a shot history box, and
// the ability there to mark them up as fat / thin / ignore etc or even
// change clubs, so you have at least a few shots to remember and edit the
// shot before it goes into history"): the last few shots recorded, each
// with what was said about it and its club, to change. Pure: recorder.js
// keeps the list, ccwidgets.js draws it.

import { STRIKE_NAMES, SPECIAL_NAMES, CLUB_ORDER } from "./shotstats.mjs";

// How many shots it keeps.
export const HISTORY_MAX = 10;

// What can be said about a shot from the box, in order: how it was struck,
// a special shot, or a misread (taken out of everything - "ignore"); and
// "auto", back to how it was judged.
export const HISTORY_MARKS = ["good", "badhit", "thin", "fat", "topped", "shank", "punch", "part", "other", "misread"];
export const HISTORY_MARK_NAMES = {
  ...STRIKE_NAMES,
  good: "Good",
  punch: SPECIAL_NAMES.punch,
  part: SPECIAL_NAMES.part,
  // (The range's "Last shot thin, fat or a misread?" card's last choice:
  // the command centre has no such button now - this is where.)
  other: SPECIAL_NAMES.other,
  misread: "Ignore (misread)",
  auto: "As judged",
};

// The list with a shot recorded: newest first, at most HISTORY_MAX. A
// shot: { id, player, club, mode, t, carry, total, say, shotNumber } (the
// launch monitor's number for it).
export function pushShot(list, shot) {
  if (!shot?.id) return list ?? [];
  const rest = (list ?? []).filter((s) => s.id !== shot.id);
  return [{ say: null, ...shot }, ...rest].slice(0, HISTORY_MAX);
}

// The list with one shot changed (what was said, its club).
export function changeShot(list, id, patch) {
  return (list ?? []).map((s) => (s.id === id ? { ...s, ...patch } : s));
}

// The clubs a shot can be put down to from the box: any in the bag - but a
// putt was the putter, so none for it.
export function historyClubs(shot) {
  return shot && shot.club !== "PT" ? CLUB_ORDER : [];
}

// One shot's line: "7 iron · 152 yds" (and whose, with friends).
export function historyLine(shot, { names = false, clubName = (c) => c } = {}) {
  const parts = [];
  if (names && shot.player) parts.push(shot.player);
  if (shot.club) parts.push(clubName(shot.club));
  if (Number.isFinite(shot.carry)) parts.push(`${Math.round(shot.carry)} yds`);
  return parts.join(" · ");
}
