// Where a designed hole's fairway meets its green (course/holebuild.js):
// seamless, with no rough or first cut showing through between them (the
// owner, 22 November 2026: "often see those little dark patches ...
// fairway needs to be seamless with the green").
//
// Two things showed through there. The fairway was laid on the ground only
// at its corners, a couple of metres apart, while the ground under it
// round the green is half a metre apart (sim/greenpatch.mjs): on every
// rise its straight sides dipped under the ground and the rough came
// through in patches. Near the green it's split as finely as the ground
// now (GREEN_FAIRWAY.out, step). And the green's surround of first cut, a
// band round the fringe, was laid at the fairway's own height right
// across the approach, in long flat strips: the two took turns to show.
// It's laid as finely, and left out where the fairway is over it
// (underFairway).

import { nearest, fairwayHalfWidth, insideBlob } from "./course.mjs";

// out: how far past the fringe the fairway is split finer; step(high):
// how finely (metres between corners) - the ground's own spacing round
// the green on each setting.
export const GREEN_FAIRWAY = { out: 8, step: (high) => (high ? 0.5 : 1) };

// Whether a spot (hole frame: x down the hole, z across) is under the
// hole's fairway or one added by hand. path: the hole's line (sim/
// course.mjs makePath).
export function underFairway(L, path, x, z) {
  if (L.fairway) {
    const n = nearest(path, x, z);
    if (Math.abs(n.d) <= fairwayHalfWidth(L.fairway, n.s, n.d < 0 ? -1 : 1)) return true;
  }
  return (L.extraFairways ?? []).some((s) => insideBlob(s, x, z));
}
