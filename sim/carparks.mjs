// A car park beside a course's buildings: asphalt laid on the ground as it
// lies, bays marked out in rows, cars parked in some of them (the owner, 27
// November 2026, of Arrowmill Park: "Create the range building and car
// park"). A course from a map carries each on the holes whose ground it
// lies on (layout.carParks - tools/realsteps/carparks.mjs puts a real
// course's there from its definition); look/carpark.js draws them. Scenery:
// the ground under it plays as it did.
//
// One as a hole keeps it: { poly: [[x, z], ...] (its outline, the hole's
// frame), bays: [[x, z, turn, car], ...] - each bay's middle, the way a car
// in it faces (radians: the direction (cos turn, sin turn) in the hole's
// frame), and the car in it (0: empty; 1 - CAR_COLOURS.length: a car of
// that colour) }.
//
// Pure.

import { insidePolygon, distanceToEdge, polygonBounds } from "./terrain.mjs";

export const CARPARK = {
  // A bay: this wide and this deep (metres); an aisle between the rows.
  wide: 2.5,
  deep: 4.8,
  aisle: 6.2,
  // No bay nearer the car park's edge than this, or a building than `wall`.
  edge: 0.4,
  wall: 1.2,
  // About this share of its bays have a car in them, no more than `most`.
  full: 0.45,
  most: 70,
  // The surface is laid in cells this big (metres), each at the ground's
  // own height at its corners, so it follows a slope or a bank.
  cell: 2.5,
};
// The cars' colours (look/carpark.js paints them).
export const CAR_COLOURS = ["#d9dadb", "#9aa0a6", "#23262b", "#2f4a6b", "#7c2a2a", "#5b6b5a"];

function hash(a, b, seed) {
  let h = 0x811c9dc5 ^ (seed | 0);
  h = Math.imul(h ^ Math.round(a * 10), 16777619);
  h = Math.imul(h ^ Math.round(b * 10), 16777619);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  return (h >>> 0) / 4294967296;
}
const r2 = (v) => Math.round(v * 100) / 100;

// Its bays: rows running along `along` (a direction in the hole's frame, [x,
// z]; its longest edge's if none is given), two rows back to back and an
// aisle, across the whole of it - each bay kept where all of it is on the
// asphalt clear of its edge and of the buildings (`walls`: their outlines).
// Cars in a share of them, picked by where each stands.
export function carparkBays(poly, { along = null, walls = [], seed = 1 } = {}) {
  if (!(poly?.length >= 3)) return [];
  const C = CARPARK;
  let u = along;
  if (!u) {
    let best = 0;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (d > best) {
        best = d;
        u = [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
      }
    }
  }
  const l = Math.hypot(u[0], u[1]) || 1;
  u = [u[0] / l, u[1] / l];
  const v = [-u[1], u[0]];
  // The outline in its own frame: along the rows, across them.
  const at = (p, q) => [p * u[0] + q * v[0], p * u[1] + q * v[1]];
  const ps = poly.map(([x, z]) => x * u[0] + z * u[1]);
  const qs = poly.map(([x, z]) => x * v[0] + z * v[1]);
  const [p0, p1, q0, q1] = [Math.min(...ps), Math.max(...ps), Math.min(...qs), Math.max(...qs)];
  const clear = (x, z) => {
    // (A hair's give: a row laid exactly its margin off the edge is on it.)
    if (!insidePolygon(poly, x, z) || distanceToEdge(poly, x, z) < C.edge - 1e-6) return false;
    for (const w of walls) if (insidePolygon(w, x, z) || distanceToEdge(w, x, z) < C.wall - 1e-6) return false;
    return true;
  };
  const bays = [];
  const period = 2 * C.deep + C.aisle;
  for (let q = q0 + C.edge + C.deep / 2; q < q1; q += period) {
    // (Back to back: the first row's cars nose out towards -v, the second's towards +v.)
    for (const [dq, nose] of [[0, -1], [C.deep, 1]]) {
      for (let p = p0 + C.edge + C.wide / 2; p < p1; p += C.wide) {
        const mid = at(p, q + dq);
        const corners = [[-C.wide / 2, -C.deep / 2], [C.wide / 2, -C.deep / 2], [C.wide / 2, C.deep / 2], [-C.wide / 2, C.deep / 2]].map(([a, b]) => at(p + a, q + dq + b));
        if (!clear(mid[0], mid[1]) || !corners.every(([x, z]) => clear(x, z))) continue;
        bays.push([r2(mid[0]), r2(mid[1]), r2(Math.atan2(v[1] * nose, v[0] * nose)), 0]);
      }
    }
  }
  // Its cars: that share of its bays, whichever a steady draw picks.
  // (By each bay's place in its rows, not where it lies on the hole: the
  // same cars from every hole that has it.)
  const order = bays.map((b, i) => [hash(i, i * 7 + 3, seed), i]).sort((a, b) => a[0] - b[0]);
  for (const [h, i] of order.slice(0, Math.min(C.most, Math.round(bays.length * C.full)))) bays[i][3] = 1 + Math.floor(h * 977) % CAR_COLOURS.length;
  return bays;
}

// A convex cell cut to the outline: the part of polygon `poly` inside the
// box x0 - x1, z0 - z1 (the outline clipped by each of the box's sides in
// turn), or null where none of it is.
export function clipToBox(poly, x0, z0, x1, z1) {
  let out = poly;
  const sides = [
    [(p) => p[0] >= x0, (a, b) => [x0, a[1] + ((b[1] - a[1]) * (x0 - a[0])) / (b[0] - a[0])]],
    [(p) => p[0] <= x1, (a, b) => [x1, a[1] + ((b[1] - a[1]) * (x1 - a[0])) / (b[0] - a[0])]],
    [(p) => p[1] >= z0, (a, b) => [a[0] + ((b[0] - a[0]) * (z0 - a[1])) / (b[1] - a[1]), z0]],
    [(p) => p[1] <= z1, (a, b) => [a[0] + ((b[0] - a[0]) * (z1 - a[1])) / (b[1] - a[1]), z1]],
  ];
  for (const [inside, cut] of sides) {
    const next = [];
    for (let i = 0; i < out.length; i++) {
      const a = out[i];
      const b = out[(i + 1) % out.length];
      if (inside(a)) {
        next.push(a);
        if (!inside(b)) next.push(cut(a, b));
      } else if (inside(b)) next.push(cut(a, b));
    }
    out = next;
    if (out.length < 3) return null;
  }
  return out;
}

// Its surface as cells: the outline cut into pieces no bigger than
// CARPARK.cell square, each a small polygon [[x, z], ...] - laid at the
// ground's height at every corner, the surface follows the ground.
export function carparkCells(poly, cell = CARPARK.cell) {
  if (!(poly?.length >= 3)) return [];
  const b = polygonBounds(poly);
  const cells = [];
  for (let x = Math.floor(b.x0 / cell) * cell; x < b.x1; x += cell) {
    for (let z = Math.floor(b.z0 / cell) * cell; z < b.z1; z += cell) {
      const piece = clipToBox(poly, x, z, x + cell, z + cell);
      if (!piece) continue;
      // (A sliver's nothing to draw.)
      let area = 0;
      for (let i = 0, j = piece.length - 1; i < piece.length; j = i++) area += piece[j][0] * piece[i][1] - piece[i][0] * piece[j][1];
      if (Math.abs(area) / 2 > 0.02) cells.push(piece);
    }
  }
  return cells;
}

// A car park as a hole keeps it, from its outline.
export function carparkFor(poly, { along = null, walls = [], seed = 1 } = {}) {
  const ring = poly.map(([x, z]) => [r2(x), r2(z)]);
  return { poly: ring, bays: carparkBays(ring, { along, walls, seed }) };
}

// A hole's car parks, read back safely: those with an outline.
export const carparksOf = (L) => (Array.isArray(L?.carParks) ? L.carParks.filter((c) => Array.isArray(c?.poly) && c.poly.length >= 3) : []);
