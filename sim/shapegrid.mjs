// Which shapes (bunkers, ponds) might be near a spot, found from a grid of
// cells rather than by trying every one: building a hole asks "is this
// near a dug bunker's rim?" of every corner and every side of the ground
// and grass it lays, again and again as it splits them finer
// (look/dugground.js refineNear, trimOut) - with a links hole's dozen pots
// each tried every time, a few seconds of the page held while the next
// hole was built ahead (the owner, on the green: "huge slowdown between
// shots"). Each shape is put in every cell its outline (grown by `grow`)
// can reach - as far as course.mjs insideBlob looks - so a shape not
// listed for a cell can't hold there.
//
// Hole frame (x, z), metres. Pure.

import { edgeReach } from "./course.mjs";
import { fingerReach } from "./fingers.mjs";

const EMPTY = Object.freeze([]);

// How far a shape's outline can reach from its middle (as insideBlob
// reckons it), or its outline's box for one drawn as points.
export function shapeBox(s, grow = 0) {
  if (s.poly) {
    let x0 = Infinity;
    let z0 = Infinity;
    let x1 = -Infinity;
    let z1 = -Infinity;
    for (const [x, z] of s.poly) {
      x0 = Math.min(x0, x);
      z0 = Math.min(z0, z);
      x1 = Math.max(x1, x);
      z1 = Math.max(z1, z);
    }
    return { x0: x0 - grow, z0: z0 - grow, x1: x1 + grow, z1: z1 + grow };
  }
  // (A wild one's edge isn't bounded so simply: twice as far, to be safe.)
  // (And as far as marks pulled its edge out: course.mjs edgeReach.)
  // (And a fingered bunker's fingers: sim/fingers.mjs.)
  const bent = s.bend ? 1 + Math.abs(s.bend) * Math.max(s.rx, s.rz) * 0.6 : 1;
  const reach = (Math.max(s.rx, s.rz) * (1.03 + Math.abs(s.depth ?? 0.08) + 1.45 * Math.max(0, s.fingers ?? 0)) + fingerReach(s)) * (s.wild > 0 ? 2 : 1.001) * (s.fingered ? bent : 1) * edgeReach(s) + grow + 0.01;
  return { x0: s.x - reach, z0: s.z - reach, x1: s.x + reach, z1: s.z + reach };
}

// The grid: at(x, z) - the shapes that might hold at (x, z); any(x0, z0,
// x1, z1) - whether any shape might reach into that box.
export function shapeGrid(shapes, grow = 0, cell = 4) {
  const cells = new Map();
  const key = (ix, iz) => ix * 100003 + iz;
  let ix0 = Infinity, ix1 = -Infinity, iz0 = Infinity, iz1 = -Infinity;
  for (const s of shapes) {
    const b = shapeBox(s, grow);
    for (let ix = Math.floor(b.x0 / cell); ix <= Math.floor(b.x1 / cell); ix++) {
      for (let iz = Math.floor(b.z0 / cell); iz <= Math.floor(b.z1 / cell); iz++) {
        const k = key(ix, iz);
        const list = cells.get(k);
        if (list) list.push(s);
        else cells.set(k, [s]);
        ix0 = Math.min(ix0, ix);
        ix1 = Math.max(ix1, ix);
        iz0 = Math.min(iz0, iz);
        iz1 = Math.max(iz1, iz);
      }
    }
  }
  // The cells laid out flat as well, over the box they span: each spot's
  // list read straight off it - asked a million times as a hole's ground
  // is cut round its pots, the map's lookups were a fifth of a second.
  // (Shapes spread over more than a few kilometres: the map alone.)
  const nx = cells.size ? ix1 - ix0 + 1 : 0;
  const nz = cells.size ? iz1 - iz0 + 1 : 0;
  if (nx * nz > FLAT_MOST) return mapped(cells, key, cell);
  const flat = new Array(nx * nz).fill(EMPTY);
  for (let ix = ix0; ix <= ix1; ix++) for (let iz = iz0; iz <= iz1; iz++) flat[(ix - ix0) * nz + (iz - iz0)] = cells.get(key(ix, iz)) ?? EMPTY;
  const listAt = (ix, iz) => (ix >= ix0 && ix <= ix1 && iz >= iz0 && iz <= iz1 ? flat[(ix - ix0) * nz + (iz - iz0)] : EMPTY);
  const at = (x, z) => listAt(Math.floor(x / cell), Math.floor(z / cell));
  const any = (x0, z0, x1, z1) => {
    if (!cells.size) return false;
    const a0 = Math.max(ix0, Math.floor(Math.min(x0, x1) / cell));
    const a1 = Math.min(ix1, Math.floor(Math.max(x0, x1) / cell));
    const b0 = Math.max(iz0, Math.floor(Math.min(z0, z1) / cell));
    const b1 = Math.min(iz1, Math.floor(Math.max(z0, z1) / cell));
    for (let ix = a0; ix <= a1; ix++) for (let iz = b0; iz <= b1; iz++) if (flat[(ix - ix0) * nz + (iz - iz0)] !== EMPTY) return true;
    return false;
  };
  return { at, any, empty: !cells.size };
}
const FLAT_MOST = 1 << 21;
// The grid read from its map of cells.
function mapped(cells, key, cell) {
  const at = (x, z) => cells.get(key(Math.floor(x / cell), Math.floor(z / cell))) ?? EMPTY;
  const any = (x0, z0, x1, z1) => {
    if (!cells.size) return false;
    for (let ix = Math.floor(Math.min(x0, x1) / cell); ix <= Math.floor(Math.max(x0, x1) / cell); ix++) {
      for (let iz = Math.floor(Math.min(z0, z1) / cell); iz <= Math.floor(Math.max(z0, z1) / cell); iz++) if (cells.has(key(ix, iz))) return true;
    }
    return false;
  };
  return { at, any, empty: !cells.size };
}
