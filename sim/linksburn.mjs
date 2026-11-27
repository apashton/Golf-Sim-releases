// A links hole's burn as the old links' (the course round, 23 November
// 2026 - what Auld Grey Links and Saltpine Links have: tools/realsteps/
// burn.mjs burnBrook, handBridges). On a links hole the course maker makes
// from its second round on (sim/maker.mjs), its burn (sim/course.mjs
// burnFor) is
//   - a straight-sided channel through the turf, walled in stone both
//     sides its whole length (brooks.mjs `even`, `banks`; sim/walls.mjs
//     WALLS.water's Stone), with no stakes or painted line - its walls are
//     its edge (`marks: false`, sim/penalty.mjs) - its colour as the Rules
//     give it: yellow, crossing the line of play;
//   - crossed by a small humped bridge of rough stone (layout.bridges,
//     sim/bridges.mjs HAND_BRIDGE.arch; drawn by course/holescenery.js)
//     where the way walked goes over it - the hole's path of worn grass -
//     or, with none, beside the fairway (Saltpine's: "where each hole
//     crosses, beside its fairway"). Not the dark plank bridges a cart
//     path's crossing has (Sea Links' 2nd had two).
// Scenery and play as a real course's: a ball under the bridge is in the
// burn. Pure, in the hole's frame.

import { brookShape, brookLine, brookHalf, nearestOnLine, alongLine } from "./brooks.mjs";
import { pathLine, validPath } from "./paths.mjs";
import { BUILT } from "./walls.mjs";
import { insideBlob, makePath, nearest, pointAt, fairwayHalfWidth, seeded } from "./course.mjs";

export const LINKS_BURN = {
  // Its walls: stone (sim/walls.mjs WALLS.water.kinds). (Read when it's
  // asked for: walls.mjs and course.mjs import each other through here.)
  get wall() {
    return BUILT.water.stone;
  },
  // Its bridge: how wide overall (Saltpine's arches), and how far its deck
  // reaches onto the turf past the water each side (its ends).
  bridge: { w: 2.4, land: 1.5, look: "arch" },
  // With no path over it, the bridge this far outside the fairway's edge.
  beside: 5,
};

const r2 = (v) => Math.round(v * 100) / 100;

// The burn's brook ({ p, kind, w }) walled and straight-sided, as its
// water shape - stone both banks, no stakes or line - a yellow penalty
// area, as the Rules have one across the line of play (and as it's
// carried onto hills, sim/imaginary.mjs surveyOf: there the map builder
// makes it a plain burn again, staked).
export function stoneBurn(brook) {
  const m = LINKS_BURN.wall;
  const shape = brookShape({ ...brook, even: true, banks: [{ side: 0, s: [0, 1], m }, { side: 1, s: [0, 1], m }] });
  shape.marks = false;
  return shape;
}

// A bridge across the burn `w` at its nearest to (x, z): square across
// it, its deck from the turf on one bank to the turf on the other.
function bridgeAt(w, x, z) {
  const line = brookLine(w.brook);
  const q = nearestOnLine(line, x, z);
  const { p, dir } = alongLine(line, q.u);
  const n = [-dir[1], dir[0]];
  const reach = brookHalf(w.brook) + LINKS_BURN.bridge.land;
  return { p: [[r2(p[0] - n[0] * reach), r2(p[1] - n[1] * reach)], [r2(p[0] + n[0] * reach), r2(p[1] + n[1] * reach)]], w: LINKS_BURN.bridge.w, look: LINKS_BURN.bridge.look };
}

// The stone bridges a links hole's walled burns want (layout.bridges):
// one where each of the hole's paths first goes over a burn, else one
// beside the fairway where the line of play crosses it (on a side from
// the hole's seed, salted). seed: the hole's.
export function burnBridges(hole, seed = 1) {
  const burns = (hole.water ?? []).filter((w) => w?.brook && w.burn && w.marks === false);
  if (!burns.length) return [];
  const out = [];
  const path = makePath(hole.path);
  const rand = seeded((seed ^ 0xb81d6e) >>> 0 || 1);
  for (const w of burns) {
    let at = null;
    for (const p of (hole.paths ?? []).filter(validPath)) {
      at = pathLine(p).pts.find(([x, z]) => insideBlob(w, x, z)) ?? null;
      if (at) break;
    }
    if (!at) {
      // Where the line of play crosses it: beside the fairway there.
      const line = brookLine(w.brook);
      let s = null;
      for (let d = 0; d <= path.length && s == null; d += 1) {
        const { p } = pointAt(path, d);
        if (insideBlob(w, p[0], p[1])) s = d;
      }
      if (s == null) s = nearest(path, w.x, w.z).s;
      const side = rand() < 0.5 ? -1 : 1;
      const off = (fairwayHalfWidth(hole.fairway, s, side) || 15) + LINKS_BURN.beside;
      const q = pointAt(path, s);
      const want = [q.p[0] - q.dir[1] * side * off, q.p[1] + q.dir[0] * side * off];
      // (On the burn's own line, where it reaches that far.)
      const near = nearestOnLine(line, want[0], want[1]);
      at = alongLine(line, near.u).p;
    }
    out.push(bridgeAt(w, at[0], at[1]));
  }
  return out;
}
