// A warning before a shot from under the trees, or from close behind them:
// "Under the trees - punch it low".
//
// Worked out from the trees themselves (treehits.mjs), not the lie: the
// flight a shot with the club in hand would take along the aim - the swing
// the player is about to make, full or less near the green - is looked
// along for its first WARN_REACH metres against the trees near it, and so
// is a low punch. If the shot would likely be caught by the branches (off
// one, or stopped in the thick of a crown) or run into a trunk, it says so,
// and whether a punch gets out under them. The
// same trees and the same rates as the flight itself (treesOnLine), but
// flown once without them and looked along, rather than played: a couple
// of hundred points against the grid of trees, cheap enough to redo at
// every nudge of the aim.
//
// Pure: the course (course.js) and the approach ladder show it with the
// lie's guidance, as { text, short } - the whole sentence for the Shot
// details, a short one for the game window (gametext.mjs).

import { simulateFlight, YARD } from "./flight.mjs";
import { applyLie, FLAT } from "./lie.mjs";
import { typicalShot, distanceToPin, riseToPin } from "./courseplay.mjs";
import { treesOnLine } from "./treehits.mjs";
import { clubName } from "./clubs.mjs";

// How far along the ground (metres) the flight is looked along: trees
// further out are a target to aim away from, not trees the ball is under.
export const WARN_REACH = 60;
// The chance of being caught by a branch (or a trunk) at which a shot is in trouble,
// and under which it's clear enough to say nothing - or, for the punch,
// under which it gets out.
export const BLOCKED = 0.5;
export const CLEAR = 0.2;

// A low punch: ball back, hands forward, a long iron's loft taken off -
// low, running, well under the branches.
export const PUNCH = Object.freeze({ speedMph: 85, vla: 6, hla: 0, totalSpin: 3500, spinAxis: 0 });

// The flight of a shot, in its own frame (x down the aim, y up from where
// it's hit, z right), as far as WARN_REACH along the ground - flown over
// level ground once and kept.
const flights = new Map();
export function earlyFlight(shot, reach = WARN_REACH) {
  const key = [shot.speedMph, shot.vla, shot.hla, shot.totalSpin, shot.spinAxis, reach].map((v) => Math.round(v * 100)).join();
  let pts = flights.get(key);
  if (pts) return pts;
  const path = simulateFlight(shot).path;
  pts = [];
  for (const p of path) {
    pts.push([p[0], p[1], p[2]]);
    if (Math.hypot(p[0], p[2]) > reach) break;
  }
  if (flights.size > 200) flights.clear();
  flights.set(key, pts);
  return pts;
}

// That flight put down on the hole from `ball` along `aim` (hole frame,
// absolute heights, as the flight meets the trees in play: courseplay.mjs),
// ending where it would meet rising ground.
function onHole(hole, ball, aim, pts) {
  const c = Math.cos(aim);
  const s = Math.sin(aim);
  const hilly = !!hole.green?.terrain;
  const h0 = hole.heightAt(ball[0], ball[1]);
  const out = [];
  for (const [fx, fy, fz] of pts) {
    const x = ball[0] + fx * c - fz * s;
    const z = ball[1] + fx * s + fz * c;
    const g = hole.heightAt(x, z);
    const y = hilly ? h0 + fy : fy + g;
    out.push([x, y, z]);
    if (out.length > 3 && y < g) break;
  }
  return out;
}

// What the trees would do to `shot` (as it leaves the lie) played from
// `ball` along `aim`: treesOnLine's { stopped, trunk, touched, first },
// with `chance` - the trunk counting as certain. `enough`: a chance past
// which it needn't look further (treesOnLine).
export function lineTrouble(hole, ball, aim, shot, index = hole.treeIndex?.(), enough = 1) {
  if (!index?.list.length) return { stopped: 0, trunk: null, touched: false, first: null, chance: 0 };
  const r = treesOnLine(index, onHole(hole, ball, aim, earlyFlight(shot)), { enough });
  return { ...r, chance: r.trunk != null ? 1 : r.stopped };
}

// Is there a crown right over the ball?
export function underCrown(hole, ball, index = hole.treeIndex?.()) {
  if (!index?.list.length) return false;
  const g = hole.heightAt(ball[0], ball[1]);
  return treesOnLine(index, [
    [ball[0], g + 0.5, ball[1]],
    [ball[0], g + 30, ball[1]],
  ]).touched;
}

// The warning, or null when the trees leave this shot alone:
//   { level: "blocked" | "close", full, punch, under, text, short }
// full and punch: lineTrouble for the shot with the club in hand and for
// a low punch; under: a crown over the ball. "blocked": the shot would
// likely be caught by the branches (or hit a trunk) - the text says whether a punch gets
// out; "close": it might be.
//   club, lie, stance   the shot being set up
//   yards               how far it's to go (the swing near the green is
//                       less than a full one); the pin by default
export function treeWarning(hole, ball, aim, { club = "7I", lie = "fairway", stance = FLAT, yards = null } = {}) {
  if (!hole || !ball || lie === "green" || club === "PT") return null;
  const index = hole.treeIndex?.();
  if (!index?.list.length) return null;
  const to = yards ?? (distanceToPin(hole, ball) + riseToPin(hole, ball)) / YARD;
  const full = lineTrouble(hole, ball, aim, typicalShot(club, lie, stance, to), index, 0.97);
  if (full.chance < CLEAR) return null;
  const punch = lineTrouble(hole, ball, aim, applyLie(PUNCH, { lie, stance, club: "5I" }), index, CLEAR);
  const under = underCrown(hole, ball, index);
  const name = clubName(club).toLowerCase();
  const where = under ? "Under the trees" : "Trees in the way";
  const tens = Math.max(1, Math.min(10, Math.round(full.chance * 10)));
  const what =
    full.trunk != null
      ? `runs into a tree's trunk ${Math.max(1, Math.round(full.trunk / YARD))} yds out`
      : full.chance >= 0.95
        ? "would almost certainly be caught by the branches"
        : `would likely be caught by the branches (about ${Math.min(9, tens)} in 10)`;
  if (full.chance < BLOCKED) {
    return {
      level: "close",
      full,
      punch,
      under,
      text: `${under ? "Under the trees: the" : "The"} leaves reach over your line - a ${name} along it may catch a branch (about ${tens} in 10)${
        punch.chance < CLEAR ? "; punched low it gets out under them" : ""
      }.`,
      short: under ? "Under the trees - leaves may catch it" : "Leaves over your line - may catch it",
    };
  }
  if (punch.chance < CLEAR) {
    return {
      level: "blocked",
      full,
      punch,
      under,
      text: `${where}: a ${name} along this line ${what}. Punched low it gets out under them.`,
      short: `${where} - punch it low`,
    };
  }
  // Neither gets out this way: the nearest turn of the aim that does -
  // for the shot in hand if there's a gap for it, or for a punch.
  const shot = typicalShot(club, lie, stance, to);
  const out = wayOut(hole, ball, aim, [shot, applyLie(PUNCH, { lie, stance, club: "5I" })], index);
  const turn = out ? `${out.degrees}° ${out.side}` : "";
  const then = !out
    ? "No low punch within 90° of this line gets out cleanly: just get it back in play."
    : out.shot === 0
      ? `There's a gap for it ${turn}.`
      : `Turned ${turn}, a low punch gets out.`;
  return {
    level: "blocked",
    full,
    punch,
    under,
    out,
    text: `${where}: a ${name} along this line ${what}, and punched low it doesn't get out either. ${then}`,
    short: !out ? `${where} - just get it out` : out.shot === 0 ? `${where} - a gap ${turn}` : `${where} - punch out ${turn}`,
  };
}

// The nearest turn of the aim (10° at a time, up to 90° either way) along
// which one of `shots` gets out, trying them in order at each turn:
// { degrees, side: "left" | "right", aim, shot (its place in `shots`) },
// or null.
export const TURN_STEP = 10;
export function wayOut(hole, ball, aim, shots, index = hole.treeIndex?.()) {
  for (let deg = TURN_STEP; deg <= 90; deg += TURN_STEP) {
    for (const sign of [1, -1]) {
      const a = aim + (sign * deg * Math.PI) / 180;
      const k = shots.findIndex((shot) => lineTrouble(hole, ball, a, shot, index, CLEAR).chance < CLEAR);
      if (k >= 0) return { degrees: deg, side: sign > 0 ? "right" : "left", aim: a, shot: k };
    }
  }
  return null;
}
