// A course putt's read - its figures (how much it's uphill or downhill,
// what it plays like) and then its ideal line - worked out on another of
// the computer's cores (sim/buildtasks.mjs puttRead, look/offload.js) from
// the hole made again there from its recipe (sim/holesite.mjs), so the
// green goes on drawing while it's read. Each try in a read is a whole
// roll down the green, and worked out on the page, a little each frame,
// it held every frame on the green for some seconds on a phone (the
// owner: "some slowdown and freezing between shots"). The same answer as
// the page's own (course/putting.js, which still reads it there where
// there's no other core).
//
// And the stand-in for a putt struck before its read is back: straight at
// the hole, at the pace that would roll it what it plays like (or, before
// even that's known, its distance) and a foot and a half more.

import { holeSite, holeProbe } from "./holesite.mjs";
import { courseGreen, lineFigures, idealLine } from "./puttguide.mjs";
import { FOOT } from "./putting.mjs";

// part: "figures" or "ideal". site and probe as the other tasks have them
// (holeProbe: the page's hole and this one the same); ball: [x, z]; cup and
// stimp: the page's, which the hole made here has to have too.
export function puttReadFrom({ part, site, probe, ball, cup, stimp }) {
  const s = holeSite(site);
  const hole = s.hole;
  if (JSON.stringify(holeProbe(s.heightAt, (x, z) => hole.lieAt(x, z), hole.layout)) !== JSON.stringify(probe)) throw new Error("not the page's hole");
  if (hole.cup.x !== cup.x || hole.cup.z !== cup.z || hole.cup.r !== cup.r || hole.green.stimp !== stimp) throw new Error("not the page's green");
  const cg = courseGreen(hole, ball);
  return part === "figures" ? lineFigures(cg.green, cg.distance) : idealLine(cg.green, cg.distance, { holeRadius: hole.cup.r });
}

// How far past the hole the stand-in's pace rolls it (feet): the ideal
// line's own (puttguide.mjs idealLineSteps).
export const ROUGH_PAST_FEET = 1.5;

// The stand-in: { feet, hla, rough } - feet the pace on the flat (sim/
// madeshot.mjs planOf's putt plan), hla 0. fig: the figures if they're in
// (lineFigures: playsLike, runsAway); distance: metres to the hole.
export function roughPutt(fig, distance) {
  if (fig?.runsAway) return { feet: ROUGH_PAST_FEET, hla: 0, rough: true };
  const metres = Number.isFinite(fig?.playsLike) && fig.playsLike > 0 ? fig.playsLike : distance;
  return { feet: metres / FOOT + ROUGH_PAST_FEET, hla: 0, rough: true };
}
