// The ways walked between holes: from each green on to the next tee, a
// path of worn grass (sim/paths.mjs PATH_KINDS: flattened by feet, no made
// surface - the owner, 21 November 2026, of the real links course: "Paths
// between holes probably need not a cart path, but a wander path of
// flattened grass").
//
// For a course from a map, whose holes lie where they really are: each
// walk leaves its green on the side the next tee is, wanders a little (no
// groundsman laid it) and stops short of the tee, going round a bunker,
// water, a green or a building in its way where a few metres to one side
// clears them. Kept as one of each hole's own paths - the hole it leaves
// and the hole it comes to, each in its own frame - so it's drawn, mapped
// and changed in the hole editor like any path. None where the next tee
// is right beside the green, or a long way off (there the players take a
// path that's mapped).
//
// The carts' paths between holes are another thing (sim/linkpaths.mjs).
//
// Pure.

import { holeFrame, insidePolygon, polygonCentroid } from "./terrain.mjs";
import { seeded } from "./course.mjs";
import { WORN } from "./paths.mjs";

export const WALK = {
  // How wide it's worn (metres).
  width: 2,
  // It starts this far off the green's edge, and stops this far short of the tee.
  offGreen: 3,
  shortOfTee: 4,
  // None shorter or longer than these (metres, green's edge to tee).
  least: 10,
  most: 160,
  // ...and none shorter than this once it's off the green and short of the tee.
  worth: 8,
  // How far it wanders off the straight way (a share of its length, and the most, metres).
  wander: 0.07,
  wanderMost: 5,
  // The ways round what's in the way that are tried: its middle this far to one side.
  round: [0, 6, -6, 12, -12, 18, -18, 26, -26],
  // How finely it's checked (metres).
  step: 1.5,
};

const r2 = (v) => Math.round(v * 100) / 100;

// A hole's shapes a walk goes round, in its own frame: greens, sand, water,
// buildings. (Not tee boxes: it ends among them, and where it crosses one
// the box is what's seen and played.)
function inTheWay(L) {
  return [L.green?.poly, ...(L.greens ?? []), ...(L.bunkers ?? []).map((b) => b.poly), ...(L.water ?? []).map((w) => w.poly), ...(L.buildings ?? [])].filter((p) => Array.isArray(p) && p.length > 2);
}

// The walk from hole A's green to hole B's tee, on the course's own ground:
// [[x, z], ...] (four points), or null. A, B: holes from a map ({ layout }
// with its geo). rand: for its wander.
export function walkBetween(A, B, rand = Math.random) {
  const LA = A?.layout;
  const LB = B?.layout;
  if (LA?.source !== "map" || LB?.source !== "map" || !LA.geo || !LB.geo || !(LA.green?.poly?.length > 2)) return null;
  const fa = holeFrame(LA.geo.tee, LA.geo.heading);
  const fb = holeFrame(LB.geo.tee, LB.geo.heading);
  const tee = fb.toLocal([0, 0]);
  // Off the green on the side the tee is: the outline's nearest point to it.
  const green = LA.green.poly.map((p) => fa.toLocal(p));
  let near = null;
  for (let i = 0; i < green.length; i++) {
    const a = green[i];
    const b = green[(i + 1) % green.length];
    const l2 = (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2 || 1;
    const t = Math.min(1, Math.max(0, ((tee[0] - a[0]) * (b[0] - a[0]) + (tee[1] - a[1]) * (b[1] - a[1])) / l2));
    const q = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const d = Math.hypot(q[0] - tee[0], q[1] - tee[1]);
    if (!near || d < near.d) near = { q, d };
  }
  if (near.d < WALK.least || near.d > WALK.most) return null;
  const ux = (tee[0] - near.q[0]) / near.d;
  const uz = (tee[1] - near.q[1]) / near.d;
  const from = [near.q[0] + ux * WALK.offGreen, near.q[1] + uz * WALK.offGreen];
  const to = [tee[0] - ux * WALK.shortOfTee, tee[1] - uz * WALK.shortOfTee];
  const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
  // (What's left once it's off the green and short of the tee: worth wearing.)
  if (len < WALK.worth) return null;
  // What's in its way, on both holes (each asked in its own frame).
  const shapes = [
    [fa, inTheWay(LA)],
    [fb, inTheWay(LB)],
  ];
  const blocked = (p) => shapes.some(([f, list]) => {
    const q = f.toHole(p);
    return list.some((poly) => insidePolygon(poly, q[0], q[1]));
  });
  const wander = Math.min(WALK.wanderMost, len * WALK.wander) * (rand() < 0.5 ? -1 : 1) * (0.5 + 0.5 * rand());
  // Through two points a third and two thirds along, one each side of the
  // straight way; pushed to one side together where something's in the way.
  for (const side of WALK.round) {
    const at = (t, off) => [from[0] + (to[0] - from[0]) * t - uz * off, from[1] + (to[1] - from[1]) * t + ux * off];
    const line = [from, at(1 / 3, side + wander), at(2 / 3, side - wander * 0.6), to];
    let clear = true;
    for (let k = 1; k < line.length && clear; k++) {
      const [a, b] = [line[k - 1], line[k]];
      const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / WALK.step));
      for (let j = 0; j <= n && clear; j++) if (blocked([a[0] + ((b[0] - a[0]) * j) / n, a[1] + ((b[1] - a[1]) * j) / n])) clear = false;
    }
    if (clear) return line;
  }
  return null;
}

// A course's holes each with the walks to and from it among its paths:
// from its green on to the next hole's tee, and from the hole before's
// green to its own tee. (seed: for the wander; the same course, the same
// walks.) Returns the holes; `walks` on the array says how many were laid.
export function courseWalks(holes, seed = 1) {
  const out = holes.map((h) => h);
  let laid = 0;
  for (let i = 0; i + 1 < holes.length; i++) {
    const line = walkBetween(holes[i], holes[i + 1], seeded(seed * 9973 + i * 131 + 7));
    if (!line) continue;
    laid++;
    for (const k of [i, i + 1]) {
      const L = out[k].layout;
      const f = holeFrame(L.geo.tee, L.geo.heading);
      const path = { p: line.map((p) => f.toHole(p).map(r2)), w: WALK.width, m: WORN };
      out[k] = { ...out[k], layout: { ...L, paths: [...(L.paths ?? []), path] } };
    }
  }
  out.walks = laid;
  return out;
}
