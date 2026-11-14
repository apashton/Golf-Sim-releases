// A broadleaf's shoot ends (the owner, 11 November 2026, of the horse
// chestnut's: "show what's possible with 10% more triangles. At least on
// the best drawn versions", then "this improved tree is much better, with
// eventually less triangles, so would love to see the rest"): where leaf
// cards are flat pictures facing out of the crown, a shoot's end is a
// little shape of its own - a shallow umbrella of six triangles about a
// point just off a lump's surface, its rim below its middle (or above: a
// poplar's swept up), wearing the kind's leaf picture from its middle out.
// So close to, the leaves have a middle nearer the eye than their edges;
// from further off they break the crown's outline against the sky; and
// under its lowest lumps they hang as a skirt. Paid for by the solid crown
// behind the leaves, drawn a quarter as fine since (look/trees.js
// CROWN_UNDER): a tree with them has fewer triangles than it had.
//
// Pure geometry: look/trees.js says which kinds wear them and how (LOOK's
// `ends`), shades them with the rest of the crown and puts them in the
// leaf cards' own geometry - no batch, no draw more.

import * as THREE from "three";

// How a kind's are made, unless its LOOK says otherwise:
//   near, close  how many a lump on the tree drawn near and close up (the
//                near ones the first of the close-up ones: none appear or
//                go as the tree changes)
//   apart        the least between two, of the smaller's lump's radius
//   out          how far from a lump's middle, of its radius
//   radius       its rim's, of its lump's radius [least, most]
//   droop        its rim below its middle, of its radius (negative: above)
//   wave         every other corner that much further again
//   up           how far its face is turned from straight out of the lump
//                towards straight up (0 out, 1 half way, more: nearly flat)
//   under        how far round under a lump they go (-1 its underside, 0
//                its side): below its side they hang
//   over         how far up over a lump they go (1 its top, 0 its side): a
//                conifer's ring the rim of each tier, not its top
//   fresh        the share that are this year's growth: a yellower, lighter
//                green than the leaves behind them, as a tree's shoot tips
//                are (the owner, 12 November 2026: "the intricate details of
//                a tree ... closer to realism but cheap") - by each one's
//                place in the list, so the rest are as they were
//   freshTint    that green, as a share of its red, green and blue
export const SHOOT_ENDS = { near: 3.5, close: 6, apart: 0.36, out: 1.06, radius: [0.42, 0.58], droop: 0.3, wave: 0.3, up: 0.4, under: -0.6, over: 1, fresh: 0.3, freshTint: [1, 1, 0.74] };
export const SIDES = 6;

// Up to `count` shoot ends on the outside of a crown's lumps [x, y, z, r]:
// a geometry of position, normal, uv (its middle the picture's, its rim
// round it) and colour, indexed - or null with nowhere for one.
export function shootEnds(dome, rand, count, E = SHOOT_ENDS) {
  const spots = [];
  for (const [cx, cy, cz, r] of dome) {
    const n = Math.max(12, Math.round(r * r * 10));
    for (let i = 0; i < n; i++) {
      const y = E.under + ((E.over ?? 1) - E.under) * ((i + rand()) / n);
      const a = i * 2.39996 + rand() * 0.8;
      const h = Math.sqrt(Math.max(0, 1 - y * y));
      const dir = [h * Math.cos(a), y, h * Math.sin(a)];
      const at = [cx + dir[0] * r * E.out, cy + dir[1] * r * E.out, cz + dir[2] * r * E.out];
      // (Inside another lump: in the leaves, not on the outside.)
      if (dome.some(([x2, y2, z2, r2]) => (x2 !== cx || y2 !== cy || z2 !== cz) && Math.hypot(at[0] - x2, at[1] - y2, at[2] - z2) < r2 * 1.02)) continue;
      spots.push({ at, dir, r, pick: rand() });
    }
  }
  spots.sort((p, q) => p.pick - q.pick);
  const kept = [];
  for (const sp of spots) {
    if (kept.length >= count) break;
    if (kept.every((k) => Math.hypot(k.at[0] - sp.at[0], k.at[1] - sp.at[1], k.at[2] - sp.at[2]) >= E.apart * Math.min(k.r, sp.r))) kept.push(sp);
  }
  if (!kept.length) return null;
  const pos = [];
  const nor = [];
  const uv = [];
  const col = [];
  const index = [];
  const axis = new THREE.Vector3();
  const u = new THREE.Vector3();
  const v = new THREE.Vector3();
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (const { at, dir, r } of kept) {
    const R = r * (E.radius[0] + rand() * (E.radius[1] - E.radius[0]));
    const turn = rand() * Math.PI * 2;
    const shade = 0.86 + rand() * 0.14;
    axis.set(dir[0], dir[1] + E.up, dir[2]).normalize();
    // Two directions across it.
    u.set(0, 1, 0);
    if (Math.abs(axis.y) > 0.92) u.set(1, 0, 0);
    u.cross(axis).normalize();
    v.crossVectors(axis, u);
    const first = pos.length / 3;
    pos.push(at[0], at[1], at[2]);
    nor.push(axis.x, axis.y, axis.z);
    uv.push(0.5, 0.5);
    // (This year's growth, or not: a hash of where it is in the list.)
    const young = (((first + 1) * 2654435761) >>> 0) / 4294967296 < (E.fresh ?? 0);
    const [tr, tg, tb] = young ? E.freshTint : [shade, shade, shade];
    col.push(tr, tg, tb);
    for (let j = 0; j < SIDES; j++) {
      const a = turn + (j / SIDES) * Math.PI * 2;
      const [ca, sa] = [Math.cos(a), Math.sin(a)];
      const drop = E.droop * R * (1 + (j % 2 ? E.wave : -E.wave));
      p.set(at[0], at[1], at[2]).addScaledVector(u, ca * R).addScaledVector(v, sa * R).addScaledVector(axis, -drop);
      n.copy(axis).addScaledVector(u, ca * 0.6).addScaledVector(v, sa * 0.6).normalize();
      pos.push(p.x, p.y, p.z);
      nor.push(n.x, n.y, n.z);
      uv.push(0.5 + 0.5 * ca, 0.5 + 0.5 * sa);
      // (Its tips a little darker: they hang into the tree's shade.)
      col.push(tr * 0.9, tg * 0.9, tb * 0.9);
      index.push(first, first + 1 + j, first + 1 + ((j + 1) % SIDES));
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(nor), 3));
  g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(uv), 2));
  g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(col), 3));
  g.setIndex(index);
  return g;
}
