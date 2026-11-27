// A links hole's open bunkers (the course maker's second round, sim/
// maker.mjs), as on Auld Grey Links: of a real links' bunkers about a third
// are open - no revetted face, bigger than a pot and shallower, their edges
// rough and worn by the wind, the sand blown a little way up the side the
// shot comes from (docs/REAL-COURSES.md). A made links hole's were all pots
// (course.mjs potBunker): each drive-zone bunker a pair of them. Now about
// LINKS_OPEN.share of those pairs - never a greenside pot, nor a row across
// the fairway (sim/crossbunkers.mjs) - are one open bunker where the pair
// was, chosen from a randomness of its own once every pot is made, so the
// other pots stay just where they were. Dug and cut into the land as any
// plain bunker of the round is (sim/bunkercut.mjs), and drawn ragged as a
// links hole's open bunkers are (sim/bunkerlook.mjs).
//
// Pure: for the course maker and the tests.

import { seeded, insideBlob, blobOutline, nearest, pointAt } from "./course.mjs";

// share: how many of a hole's drive-zone pairs are made open; along/across: its
// size, metres (its length at least the pair's reach); lobes, depth: its
// blob; fingers: how rough its edge (course.mjs straightRadius); flash: its
// low face of blown sand towards the shot (sim/hazardshapes.mjs flashLift);
// clear: how far (metres) it's kept from water, the green and the hole's
// other bunkers.
export const LINKS_OPEN = { share: 0.35, along: [4.2, 7.5], across: [3, 4.4], lobes: [3, 4], depth: [0.14, 0.2], fingers: [0.04, 0.07], fk: [7, 9], flash: { h: [0.15, 0.25], back: [1.6, 2.2] }, clear: { water: 3, green: 4, other: 1.5 } };

const span = (rand, [a, b]) => a + rand() * (b - a);
const r2 = (v) => Math.round(v * 100) / 100;
const r3 = (v) => Math.round(v * 1000) / 1000;

// The hole's drive-zone pairs of pots (`pairs`: [{ from, pots: [a, b] }] -
// `from` the bunker the plan put there, the two pots made of it) made open
// where its randomness says - in place, in the hole's list of bunkers:
// where the first of the pair was. path: the hole's line (makePath).
// Returns the hole.
export function openLinksBunkers(hole, spec, pairs, { path }) {
  const rand = seeded(((spec.seed ?? 1) ^ 0x0be7) >>> 0 || 1);
  const C = LINKS_OPEN.clear;
  // How many of its pairs (its share, give or take one), tried in an order
  // of its own until that many are made - one with no room passed over.
  let want = Math.floor(pairs.length * LINKS_OPEN.share + rand());
  const order = pairs.map((q, i) => [rand(), i]).sort((p, q) => p[0] - q[0]).map(([, i]) => i);
  // (Every draw made for every pair, chosen or not: one pair's shape never
  // moves the next's.)
  const shapes = pairs.map(() => {
    const along = span(rand, LINKS_OPEN.along);
    const across = span(rand, LINKS_OPEN.across);
    const lobes = LINKS_OPEN.lobes[0] + Math.floor(rand() * (LINKS_OPEN.lobes[1] - LINKS_OPEN.lobes[0] + 1));
    const phase = rand() * 6.283;
    const depth = span(rand, LINKS_OPEN.depth);
    const fingers = span(rand, LINKS_OPEN.fingers);
    const fk = LINKS_OPEN.fk[0] + Math.floor(rand() * (LINKS_OPEN.fk[1] - LINKS_OPEN.fk[0] + 1));
    const fphase = rand() * 6.283;
    const h = span(rand, LINKS_OPEN.flash.h);
    const back = span(rand, LINKS_OPEN.flash.back);
    return { along, across, lobes, phase, depth, fingers, fk, fphase, h, back };
  });
  for (const i of order) {
    if (want <= 0) break;
    const { from: b, pots } = pairs[i];
    const { along, across, lobes, phase, depth, fingers, fk, fphase, h, back } = shapes[i];
    const at = hole.bunkers.findIndex((o) => pots.includes(o));
    if (at < 0) continue;
    // As long as the pair reached (each pot `reach` from its middle, about
    // its radius more), as wide as a big pot or more.
    const reach = Math.hypot(pots[1].x - pots[0].x, pots[1].z - pots[0].z) / 2 + Math.max(pots[0].rx, pots[1].rx) * 0.6;
    const dir = pointAt(path, nearest(path, b.x, b.z).s).dir;
    const open = {
      x: r2(b.x),
      z: r2(b.z),
      rot: r3(b.rot ?? 0),
      rx: r2(Math.max(along, reach)),
      rz: r2(across),
      lobes,
      phase: r3(phase),
      depth: r3(depth),
      fingers: r3(fingers),
      fk,
      fphase: r3(fphase),
      // Sand blown up its face towards the shot.
      flash: { a: r3(Math.atan2(dir[1], dir[0])), h: r3(h), back: r3(back) },
      linksOpen: 1,
    };
    const edge = blobOutline(open, 48);
    const others = hole.bunkers.filter((o) => !pots.includes(o));
    const clear = edge.every(([x, z]) => !insideBlob(hole.green, x, z, C.green) && !(hole.water ?? []).some((w) => insideBlob(w, x, z, C.water)) && !others.some((o) => insideBlob(o, x, z, C.other)));
    if (!clear || others.some((o) => insideBlob(open, o.x, o.z, C.other))) continue;
    hole.bunkers = hole.bunkers.flatMap((o, k) => (k === at ? [open] : pots.includes(o) ? [] : [o]));
    want--;
  }
  return hole;
}
