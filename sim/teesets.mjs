// Every tee set at a real spread (the course round, 23 November 2026 -
// what Saltpine Links taught: tools/madeland/land.mjs holeShapes). A hole
// the course maker makes from its second round on (sim/maker.mjs) has its
// white and red tees where a real course has them, kept on the hole
// (layout.teeAt: { white: [x, z], red: [x, z] }, the hole's frame), not
// worked out tight in a line behind and in front of the yellow
// (sim/tees.mjs WHITE_BACK, RED_FORWARD):
//   - the white some 24 m behind the yellow, the red well forward - 52 m
//     on a par 4, 56 on a par 5 - give or take a few metres each, the red
//     always short of the fairway and never within a quarter of the hole
//     of the green; on a par 3 some 21 m back and 22 forward, a little more
//     than Saltpine's 14 and 20: far enough that rough lies between each
//     box's mown surround and the yellow's, not a notched strip of it;
//   - each a few metres to one side of the line or the other, so the
//     boxes don't stand in a row;
//   - each a box of its own, 9 m by 7 (TEE_SETS.size; the yellow's is the
//     12 x 14 it always was), its markers on it (sim/signs.mjs), trees kept
//     off it and out of the white's view down the hole (sim/teelane.mjs).
// The yellow stays where it is: the hole's card - and the Tour's - is the
// yellow's. Each from a randomness of its own (the hole's seed, salted),
// so nothing else on the hole moves for it. On hills (sim/imaginary.mjs
// withHills) every set's box is built and levelled where it is.
//
// Pure, in the hole's frame (sim/course.mjs: the yellow at (0, 0), x down
// the hole, z to the right, metres).

import { pointAt, nearest, seeded } from "./course.mjs";
import { crownReach } from "./teelane.mjs";

export const TEE_SETS = {
  // How far behind the yellow the white is: a par 3's, the rest's - give
  // or take `jitter`.
  white: { back: { short: 21, long: 24 }, jitter: { short: 2.5, long: 3 } },
  // How far in front of it the red is, by par - give or take `jitter`;
  // never nearer the fairway than `shortOfFairway`, never within `most` of
  // the hole's length from the green, never less than `least` (a par 3's,
  // the rest's).
  red: { forward: { 3: 22, 4: 52, 5: 56 }, jitter: { short: 2.5, long: 6 }, shortOfFairway: 16, most: 0.25, least: { short: 8, long: 18 } },
  // How far to the side of the line each is (metres, either side).
  side: { white: [1.5, 3.5], red: [2, 4.5] },
  // Where its own spot can't be had, a box goes no nearer the yellow than
  // this (metres): rough between its mown surround and the yellow's.
  least: 18,
  // ...and the white no further back than this.
  most: 32,
  // Each box's size: along the hole, across it (metres).
  size: { white: [9, 7], red: [9, 7] },
  // Trees kept off each box: a trunk this far from its middle, and its
  // crown's reach more.
  clear: 6,
};

const r2 = (v) => Math.round(v * 100) / 100;
const between = (rand, [a, b]) => a + rand() * (b - a);
// A point s along the line, d across it (+ right), as sim/architect.mjs has it.
const beside = (path, s, d) => {
  const q = pointAt(path, Math.max(0, Math.min(path.length, s)));
  return [q.p[0] - q.dir[1] * d, q.p[1] + q.dir[0] * d];
};

// The white's and red's spots for a hole (layout.teeAt): its par, its line
// (makePath), its fairway (where it starts along the line) and its seed.
export function teeSetsFor({ par, path, fairway, seed }) {
  const rand = seeded((seed ^ 0x7ee5e7) >>> 0 || 1);
  const T = TEE_SETS;
  const length = path.length;
  const sign = () => (rand() < 0.5 ? -1 : 1);
  // The white: straight back from the yellow, the way the hole leaves it.
  const short = par === 3 ? "short" : "long";
  const back = T.white.back[short] + (rand() * 2 - 1) * T.white.jitter[short];
  const ws = sign() * between(rand, T.side.white);
  const dir = pointAt(path, 0).dir;
  const white = [r2(-dir[0] * back - dir[1] * ws), r2(-dir[1] * back + dir[0] * ws)];
  // The red: along the line, short of the fairway.
  const want = (T.red.forward[par] ?? T.red.forward[4]) + (rand() * 2 - 1) * T.red.jitter[short];
  const least = T.red.least[short];
  let most = length * T.red.most;
  if (par !== 3 && Number.isFinite(fairway?.from)) most = Math.min(most, fairway.from - T.red.shortOfFairway);
  const fwd = Math.max(least, Math.min(want, most));
  const rs = sign() * between(rand, T.side.red);
  const red = beside(path, fwd, rs).map(r2);
  return { white, red };
}

// Where else a hole's white or red (c) can go when its own spot can't be
// had - another hole's tee or fairway there on the course's ground, a
// bunker or a path put there by hand: as far from the yellow on the other
// side of the line; a white further back, to TEE_SETS.most; then nearer the
// yellow a step at a time, its own side and the other, down to `least`
// metres from it - [[x, z]...]. path: the hole's line (makePath).
export function elsewhere(path, c, behind, { step = 4, least = TEE_SETS.least } = {}) {
  const out = [];
  if (behind) {
    const dir = pointAt(path, 0).dir;
    const back = -(c[0] * dir[0] + c[1] * dir[1]);
    const side = -c[0] * dir[1] + c[1] * dir[0];
    const spot = (d, w) => [r2(-dir[0] * d - dir[1] * w), r2(-dir[1] * d + dir[0] * w)];
    out.push(spot(back, -side));
    for (let d = back + step; d <= TEE_SETS.most + 1e-9; d += step) out.push(spot(d, side), spot(d, -side));
    for (let d = back - step; d >= least - 1e-9; d -= step) out.push(spot(d, side), spot(d, -side));
  } else {
    const n = nearest(path, c[0], c[1]);
    const q = pointAt(path, n.s);
    const side = (c[0] - q.p[0]) * -q.dir[1] + (c[1] - q.p[1]) * q.dir[0];
    out.push(beside(path, n.s, -side).map(r2));
    for (let s = n.s - step; s >= least - 1e-9; s -= step) out.push(beside(path, s, side).map(r2), beside(path, s, -side).map(r2));
  }
  return out;
}

// Is teeAt a hole's own white or red, well formed (a spot behind the
// yellow for the white, in front for the red)?
export const teeAtSpot = (teeAt, colour) => {
  const c = teeAt?.[colour];
  return Array.isArray(c) && Number.isFinite(c[0]) && Number.isFinite(c[1]) && (colour === "white" ? c[0] < 0 : c[0] > 0) ? c : null;
};

// A hole's trees with those standing on or over its white and red boxes
// left out (their trunk within TEE_SETS.clear of a box's middle, crown and
// all).
export function treesOffTeeSets(trees, teeAt) {
  const spots = ["white", "red"].map((c) => teeAtSpot(teeAt, c)).filter(Boolean);
  if (!spots.length) return trees;
  return trees.filter((t) => spots.every(([x, z]) => Math.hypot(t[0] - x, t[1] - z) >= TEE_SETS.clear + crownReach(t)));
}
