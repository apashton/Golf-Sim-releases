// The cup's hole cut only near the cup (the graphics audit, 1 November
// 2026). The ground's shaders cut the cup's hole out of the grass by
// leaving its pixels out (a discard) - and a shader that can leave pixels
// out can't have them tested against what's already drawn before it works
// them out (the graphics card's early depth test), so every pixel of the
// green, the rough under it and every other piece of ground drawn with
// that shader was worked out in full even where it was hidden. Now only a
// small patch round the cup is drawn with the cut: each piece of ground
// that reaches the cup is split in two, its triangles near the cup in a
// patch of their own with the cut, the rest without it (look/cupcut.js) -
// the same triangles, corner for corner, so the picture is the same.
// Pure: which triangles, and the lists to split them by.

// How far round the cup (metres) a triangle is kept in the patch with the
// cut: anything reaching nearer the cup than this. (The cut itself is the
// cup's radius, a few centimetres: the rest is room to spare.)
export const CUP_PATCH = 2;

// Whether the triangle (ax, az), (bx, bz), (cx, cz) - seen from above -
// comes within `reach` of (px, pz): the point inside it, or any of its
// sides that near.
export function triangleNear(ax, az, bx, bz, cx, cz, px, pz, reach) {
  // (Its box first: most are nowhere near.)
  if (Math.min(ax, bx, cx) > px + reach || Math.max(ax, bx, cx) < px - reach) return false;
  if (Math.min(az, bz, cz) > pz + reach || Math.max(az, bz, cz) < pz - reach) return false;
  const d1 = (bx - ax) * (pz - az) - (bz - az) * (px - ax);
  const d2 = (cx - bx) * (pz - bz) - (cz - bz) * (px - bx);
  const d3 = (ax - cx) * (pz - cz) - (az - cz) * (px - cx);
  if ((d1 >= 0 && d2 >= 0 && d3 >= 0) || (d1 <= 0 && d2 <= 0 && d3 <= 0)) return true;
  const r2 = reach * reach;
  return sideNear(ax, az, bx, bz, px, pz) <= r2 || sideNear(bx, bz, cx, cz, px, pz) <= r2 || sideNear(cx, cz, ax, az, px, pz) <= r2;
}

// The square of the distance from (px, pz) to the side (ax, az) - (bx, bz).
function sideNear(ax, az, bx, bz, px, pz) {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz;
  const t = len2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / len2)) : 0;
  const qx = ax + dx * t - px;
  const qz = az + dz * t - pz;
  return qx * qx + qz * qz;
}

// Which of a mesh's triangles come within `reach` of the cup ({ x, z },
// where the mesh's corners are: x and z of `position`, three numbers a
// corner). index: its triangles' corners, or null (three corners a
// triangle, in order). Returns { near: a byte a triangle, count }.
export function nearCup(position, index, cup, reach = CUP_PATCH) {
  const triangles = Math.floor((index ? index.length : position.length / 3) / 3);
  const near = new Uint8Array(triangles);
  let count = 0;
  for (let t = 0; t < triangles; t++) {
    const a = (index ? index[t * 3] : t * 3) * 3;
    const b = (index ? index[t * 3 + 1] : t * 3 + 1) * 3;
    const c = (index ? index[t * 3 + 2] : t * 3 + 2) * 3;
    if (triangleNear(position[a], position[a + 2], position[b], position[b + 2], position[c], position[c + 2], cup.x, cup.z, reach)) {
      near[t] = 1;
      count++;
    }
  }
  return { near, count };
}

// The triangles split by `near` (nearCup's): each part's corners, in the
// order they were - the corner numbers of `index`, or for a mesh with
// none, the corners themselves (0, 1, 2 for the first triangle...).
export function splitCorners(index, near) {
  const triangles = near.length;
  let n = 0;
  for (let t = 0; t < triangles; t++) n += near[t];
  const far = new Uint32Array((triangles - n) * 3);
  const close = new Uint32Array(n * 3);
  for (let t = 0, f = 0, c = 0; t < triangles; t++) {
    const to = near[t] ? close : far;
    const k = near[t] ? c : f;
    for (let j = 0; j < 3; j++) to[k + j] = index ? index[t * 3 + j] : t * 3 + j;
    if (near[t]) c += 3;
    else f += 3;
  }
  return { far, near: close };
}

// A list of corners (splitCorners) as a mesh of its own: the corners it
// uses, each once, in the order first used (`vertices`: their numbers in
// the old mesh), and its triangles by their new numbers (`index`).
export function ownCorners(corners) {
  const map = new Map();
  const index = new Uint32Array(corners.length);
  for (let i = 0; i < corners.length; i++) {
    let k = map.get(corners[i]);
    if (k === undefined) {
      k = map.size;
      map.set(corners[i], k);
    }
    index[i] = k;
  }
  return { vertices: Uint32Array.from(map.keys()), index };
}

// An attribute's numbers (`itemSize` a corner) at just these corners, in
// that order: a new array of the same kind.
export function cornersOf(array, itemSize, corners) {
  const out = new array.constructor(corners.length * itemSize);
  for (let i = 0; i < corners.length; i++) {
    const from = corners[i] * itemSize;
    for (let j = 0; j < itemSize; j++) out[i * itemSize + j] = array[from + j];
  }
  return out;
}
