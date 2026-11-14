// Aiming posts on blind shots (docs/COURSE-DESIGN-PLAN.md, phase 5:
// "Allow one to three blind tee shots, each with an aiming marker"; the
// owner, 20 October 2026: "Yes to all 1-5"). Where the drive's landing
// can't be seen from the tee (sim/sight.mjs holeSight), a tall striped
// post stands on the rise that hides it, on the line to it, as on the
// blind holes at Lahinch or Royal County Down - so the golfer has
// something to aim over. A par 3 blind to its flag gets one on the line to
// the flag, and so does a blind approach (the Alps' ridge), on the line to
// the flag from where the second shot's played.
// Worked out from the hole every time it's drawn, like its signs
// (sim/signs.mjs), so a hole saved before has them too and nothing is
// added to a course file. Takes no part in play. Pure, in the hole's
// frame; look/signs.js draws them.

import { SIGHT, canSee, sightLines, holeSight } from "./sight.mjs";
import { unpackGrid, gridHeight } from "./terrain.mjs";
import { makePath, surfaceAt } from "./course.mjs";

// The post: how tall (metres); how much of it at least must show from
// where the shot's played (its top `show` of it); how far along the line
// it's looked for either side of the crest (metres), a metre at a time.
export const AIM_POST = { h: 3.5, show: 0.5, slide: 12, step: 1 };

// Surfaces a post never stands on.
const KEEP_OFF = new Set(["tee", "bunker", "greenside", "waste", "water", "green", "fringe", "path"]);

const r2 = (v) => Math.round(v * 100) / 100;

// The crest hiding `to` from `from` (eye metres above the ground there):
// the ground along the line between them that stands highest as the eye
// sees it - the steepest rise from it - { s: metres from `from`, at: [x,
// z] }, or null if there's no ground between.
export function crestOf(height, from, to, { eye = SIGHT.eye, step = AIM_POST.step } = {}) {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const d = Math.hypot(dx, dz);
  const h0 = height(from[0], from[1]) + eye;
  let best = null;
  for (let s = step; s < d; s += step) {
    const x = from[0] + (dx * s) / d;
    const z = from[1] + (dz * s) / d;
    const rise = (height(x, z) - h0) / s;
    if (!best || rise > best.rise) best = { s, at: [x, z], rise };
  }
  return best && { s: best.s, at: best.at };
}

// Where a post for the shot from `from` to `to` (top: how high above the
// ground there it has to be seen) stands: on the line between, at the
// crest - or the nearest spot along the line to it, either way, that's not
// in sand or water, on a green, a tee or a path, and shows at least
// AIM_POST.show of the post from `from`. [x, z], or null.
export function aimSpot(L, height, from, to, { path = makePath(L.path) } = {}) {
  const crest = crestOf(height, from, to);
  if (!crest) return null;
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const d = Math.hypot(dx, dz);
  const top = AIM_POST.h * AIM_POST.show;
  for (let k = 0; k <= AIM_POST.slide / AIM_POST.step; k++) {
    for (const sign of k ? [1, -1] : [1]) {
      const s = crest.s + sign * k * AIM_POST.step;
      if (s <= 0 || s >= d) continue;
      const at = [from[0] + (dx * s) / d, from[1] + (dz * s) / d];
      if (KEEP_OFF.has(surfaceAt(L, at[0], at[1], path))) continue;
      if (canSee(height, from, at, { top, step: AIM_POST.step })) return at;
    }
  }
  return null;
}

// A hole's aiming posts: [{ at: [x, z], shot: "tee" | "approach", to:
// [x, z] what it's on the line to }] - none on a hole built without its
// ground (layout.terrain: a hole on the flat has nothing to hide behind),
// or with nothing blind.
export function aimPosts(L, path = L?.path?.length > 1 ? makePath(L.path) : null) {
  if (!path || !L.terrain || !L.pin) return [];
  const seen = holeSight(L);
  if (seen.tee && seen.approach) return [];
  const grid = unpackGrid(L.terrain);
  const height = (x, z) => gridHeight(grid, x, z);
  const { from, land } = sightLines(L);
  const out = [];
  const add = (shot, start, to) => {
    const at = aimSpot(L, height, start, to, { path });
    if (at) out.push({ at: [r2(at[0]), r2(at[1])], shot, to: [r2(to[0]), r2(to[1])] });
  };
  // A par 3's tee shot is its approach: one post, on the line to the flag.
  if (!land) {
    if (!seen.approach) add("tee", [0, 0], L.pin);
    return out;
  }
  if (!seen.tee) add("tee", [0, 0], land);
  if (!seen.approach) add("approach", from, L.pin);
  return out;
}
