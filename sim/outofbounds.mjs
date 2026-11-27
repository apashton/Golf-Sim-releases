// Out of bounds: ground a hole's ball may not be played from - over the
// boundary wall into the hotel's grounds, beyond the wall behind the road,
// over the fence into the town (the real links course's 17th and 18th: the
// owner, 21 November 2026, "the significant holes such as 17th hotel have
// the right level of detail").
//
// A hole keeps it as `layout.out`: closed shapes in its own frame
// ([[x, z], ...] each), from the map's golf=out_of_bounds (sim/osm.mjs).
// A ball that comes to rest in one is out: a penalty stroke, and it's
// played again from where it was (stroke and distance, Rule 18.2) -
// courseplay.mjs gives the shot `penalty: { kind: "out", drop }`, the drop
// where the shot was played from. So is one that comes to rest on a roof
// (sim/solids.mjs): nobody plays off the hotel.
//
// Pure: play, the hole's map and the white stakes (course/boundaries.js)
// all ask here.

import { insidePolygon } from "./terrain.mjs";

// How far apart (metres) the white stakes stand along a boundary, and how
// near the hole's ground they're worth standing.
export const OUT = { stakes: 12, near: 70 };

// A hole's out-of-bounds shapes, each with its box: [{ poly, box }].
export function outShapes(L) {
  return (L?.out ?? [])
    .filter((p) => Array.isArray(p) && p.length >= 3)
    .map((poly) => {
      let x0 = Infinity;
      let z0 = Infinity;
      let x1 = -Infinity;
      let z1 = -Infinity;
      for (const [x, z] of poly) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        z0 = Math.min(z0, z);
        z1 = Math.max(z1, z);
      }
      return { poly, box: { x0, z0, x1, z1 } };
    });
}

// Whether (x, z) is out of bounds, given outShapes(L).
export function isOut(shapes, x, z) {
  for (const s of shapes) {
    if (x < s.box.x0 || x > s.box.x1 || z < s.box.z0 || z > s.box.z1) continue;
    if (insidePolygon(s.poly, x, z)) return true;
  }
  return false;
}

// Where the white stakes stand: along each shape's edge every OUT.stakes
// metres, where the edge is in bounds' sight - within OUT.near of the
// hole's line (`distance(x, z)`: how far a spot is from it) - and isn't
// along a wall or fence that marks it already (`marked(x, z)`: true within
// a stride of one). [[x, z], ...].
export function outStakes(shapes, distance, marked = () => false) {
  const stakes = [];
  for (const { poly } of shapes) {
    let carry = 0;
    for (let i = 0; i < poly.length; i++) {
      const [ax, az] = poly[i];
      const [bx, bz] = poly[(i + 1) % poly.length];
      const len = Math.hypot(bx - ax, bz - az);
      for (let d = OUT.stakes - carry; d <= len; d += OUT.stakes) {
        const x = ax + ((bx - ax) * d) / len;
        const z = az + ((bz - az) * d) / len;
        if (distance(x, z) <= OUT.near && !marked(x, z)) stakes.push([Math.round(x * 100) / 100, Math.round(z * 100) / 100]);
      }
      carry = (carry + len) % OUT.stakes;
    }
  }
  return stakes;
}

// What's said when a ball is lost (sim/courseplay.mjs: a stroke, and a
// drop back towards the line): in the trees; in a links' long grass; or -
// on a hole from a map - off the hole's own ground, where there are no
// trees to say it was lost in (the owner, 23 November 2026: "lost in the
// trees, even though you can't be lost in the trees on a links course").
export function lostWords(penalty) {
  if (penalty?.where === "off") return "Off the hole's ground - one stroke penalty, drop";
  if (penalty?.where === "grass") return "Lost in the long grass - one stroke penalty, drop";
  return "Lost in the trees - one stroke penalty, drop";
}

// What's said when a ball goes out.
export function outWords(penalty) {
  return penalty?.where === "roof" ? "On the roof - out of play: one stroke penalty, played again from where it was" : "Out of bounds - one stroke penalty, played again from where it was";
}
