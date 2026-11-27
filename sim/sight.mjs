// What a golfer can see on a hole on hills (docs/COURSE-DESIGN-PLAN.md,
// phase 5): MacKenzie's "minimum of blindness" - the flag seen from where
// the second shot's played on nearly every hole, and only now and then a
// tee shot played over a rise to a landing out of sight. The routing over
// the hills (routing.mjs) looks along these lines; an Alps hole
// (sim/landforms.mjs) is blind on purpose. Pure.

import { YARD } from "./flight.mjs";
import { GOLFERS } from "./golfers.mjs";
import { makePath, pointAt } from "./course.mjs";
import { unpackGrid, gridHeight } from "./terrain.mjs";

// How high a golfer's eye is, and the top of the flag (metres); and how
// much of the landing must show from the tee - a ball's bounce.
export const SIGHT = { eye: 1.7, flag: 2.1, landing: 0.5 };

// Whether `to` (top metres above the ground) can be seen from `from` (eye
// metres above it) over the ground between: height(x, z). step: how often
// it's looked at (metres).
export function canSee(height, from, to, { eye = SIGHT.eye, top = SIGHT.flag, step = 4 } = {}) {
  const h0 = height(from[0], from[1]) + eye;
  const h1 = height(to[0], to[1]) + top;
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const n = Math.max(2, Math.ceil(Math.hypot(dx, dz) / step));
  for (let k = 1; k < n; k++) {
    const t = k / n;
    if (height(from[0] + dx * t, from[1] + dz * t) > h0 + (h1 - h0) * t) return false;
  }
  return true;
}

// How far down a hole (its line, metres long) its second shot is played
// from: where the 10 handicap's drive finishes, but at least 110 yards out
// and no less than 40% of the way.
export const landingS = (length) => Math.max(0.4 * length, Math.min(GOLFERS.mid.drive * YARD, length - 110 * YARD));

// A hole's sight lines in its own frame: { from, land } - where its second
// shot is played from (the tee on a par 3) and the drive's landing (null
// on a par 3).
export function sightLines(layout) {
  if (!(layout?.path?.length > 1)) return { from: [0, 0], land: null };
  const path = makePath(layout.path);
  if (layout.par === 3) return { from: [0, 0], land: null };
  const land = pointAt(path, landingS(path.length)).p;
  return { from: land, land };
}

// What can be seen on a hole built on its ground (layout.terrain): {
// approach: the flag from where the second shot's played (the tee on a par
// 3), tee: the drive's landing from the tee (as approach on a par 3) }.
export function holeSight(layout) {
  if (!layout?.terrain || !layout.pin) return { approach: true, tee: true };
  const grid = unpackGrid(layout.terrain);
  const height = (x, z) => gridHeight(grid, x, z);
  const { from, land } = sightLines(layout);
  const approach = canSee(height, from, layout.pin);
  const tee = land ? canSee(height, [0, 0], land, { top: SIGHT.landing }) : approach;
  return { approach, tee };
}
