// What stands on a hole and stops a ball: a mapped hole's buildings
// (sim/buildings.mjs) and its free-standing walls (layout.walls) - the
// owner, 21 November 2026, of the real links course: "the significant
// holes such as 17th hotel have the right level of detail". A drive over
// the corner of the hotel has to clear it; a ball run through the green
// and over the road comes to rest against the wall.
//
// Each is a footprint (a polygon in the hole's frame) and how high it
// stands over each spot of it (metres, as the ground's heights are): a
// building's walls to its eaves and its roof as it's drawn, a wall the
// ground's own height and the wall's on top. A ball meets:
//   - a wall's face, coming in through the footprint's edge below its top
//     there: it comes off it, keeping some of its speed (SOLID.off) and
//     more of what it had along the face (SOLID.along);
//   - a roof (or a wall's top), coming down inside the footprint: the same
//     off the roof's slope there.
// One already inside (played from under a roof's edge, say) is let out.
//
// Fences (layout.walls with kind "fence") stop nothing: post and rail.
//
// Pure: courseplay.mjs flies, bounces and rolls a ball against these;
// course/boundaries.js draws the walls.

import { raiseBuildings, roofAt } from "./buildings.mjs";
import { insidePolygon } from "./terrain.mjs";

export const SOLID = {
  // What's kept of the speed straight off it, by what it's built of, and of
  // the speed along it.
  off: { building: 0.45, wall: 0.4 },
  along: 0.75,
  // The spin left after it.
  spin: 0.4,
  // How thick a free-standing wall is, and how high where nobody's said.
  thick: 0.5,
  height: 1.1,
  // Slower than this (m/s) off a roof it stays up there.
  settle: 2.5,
  // How far off the face it's put (m).
  clear: 0.03,
};

// A free-standing wall's own height: as kept, within reason.
export const wallHeight = (w) => (Number.isFinite(w?.h) && w.h > 0 ? Math.min(Math.max(w.h, 0.4), 3) : SOLID.height);

// A hole's walls that stop a ball (not its fences): [{ p, h }].
export function solidWalls(L) {
  return (L?.walls ?? []).filter((w) => w?.kind !== "fence" && Array.isArray(w?.p) && w.p.length >= 2).map((w) => ({ ...w, h: wallHeight(w) }));
}

// One stretch of a wall's line as a footprint: `thick` wide, squared off a
// half-thickness past each end so the stretches meet at a corner (in
// play; as drawn they're mitred there: sim/boundaries.mjs ribbon).
export function wallQuad([ax, az], [bx, bz], thick = SOLID.thick) {
  const len = Math.hypot(bx - ax, bz - az);
  if (len < 1e-6) return null;
  const ux = (bx - ax) / len;
  const uz = (bz - az) / len;
  const h = thick / 2;
  const [x0, z0, x1, z1] = [ax - ux * h, az - uz * h, bx + ux * h, bz + uz * h];
  return [
    [x0 + uz * h, z0 - ux * h],
    [x1 + uz * h, z1 - ux * h],
    [x1 - uz * h, z1 + ux * h],
    [x0 - uz * h, z0 + ux * h],
  ];
}

function solid(kind, poly, topAt, top) {
  let x0 = Infinity;
  let z0 = Infinity;
  let x1 = -Infinity;
  let z1 = -Infinity;
  let area = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [x, z] = poly[i];
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    z0 = Math.min(z0, z);
    z1 = Math.max(z1, z);
    area += poly[j][0] * z - x * poly[j][1];
  }
  // (turn: +1 where the outline runs anticlockwise in (x, z), so an edge's
  // outward side is to its right.)
  return { kind, poly, topAt, top, box: { x0, z0, x1, z1 }, turn: area > 0 ? 1 : -1 };
}

// Everything on the hole that stops a ball: { list: [{ kind: "building" |
// "wall", poly, topAt(x, z), top (its highest, for a quick miss), box }] }.
// L: the hole's layout; groundAt(x, z): its ground; largest: the area of
// the course's largest building (it's drawn as the clubhouse:
// buildings.mjs raiseBuildings), by default this hole's own.
export function holeSolids(L, groundAt, { largest = null } = {}) {
  const list = [];
  if (L?.source === "map") {
    for (const b of raiseBuildings(L, { largest })) {
      // (Standing on the lowest ground under it, as it's drawn.)
      const base = Math.min(...b.poly.map(([x, z]) => groundAt(x, z)));
      list.push(solid("building", b.poly, (x, z) => base + roofAt(b, x, z), base + b.ridge));
    }
  }
  for (const w of solidWalls(L)) {
    for (let i = 1; i < w.p.length; i++) {
      const quad = wallQuad(w.p[i - 1], w.p[i]);
      if (!quad) continue;
      const top = Math.max(...quad.map(([x, z]) => groundAt(x, z))) + w.h + 0.5;
      list.push(solid("wall", quad, (x, z) => groundAt(x, z) + w.h, top));
    }
  }
  return { list };
}

// How far along a -> b (0 to 1) it crosses p -> q, or null.
function crossing(ax, az, bx, bz, px, pz, qx, qz) {
  const dx = bx - ax;
  const dz = bz - az;
  const ex = qx - px;
  const ez = qz - pz;
  const den = dx * ez - dz * ex;
  if (Math.abs(den) < 1e-12) return null;
  const f = ((px - ax) * ez - (pz - az) * ex) / den;
  const g = ((px - ax) * dz - (pz - az) * dx) / den;
  return f >= 0 && f <= 1 && g >= 0 && g <= 1 ? f : null;
}

// What a ball going straight from `a` to `b` ([x, y, z]: the hole's frame,
// y as the ground's heights are) meets first: null, or { f (how far along,
// 0 to 1), at: [x, y, z], normal: [nx, ny, nz] (out of the face), solid,
// roof (true on a roof or a wall's top) }.
export function solidHit(solids, a, b) {
  if (!solids?.list.length) return null;
  const x0 = Math.min(a[0], b[0]);
  const x1 = Math.max(a[0], b[0]);
  const z0 = Math.min(a[2], b[2]);
  const z1 = Math.max(a[2], b[2]);
  const low = Math.min(a[1], b[1]);
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const dz = b[2] - a[2];
  let best = null;
  for (const s of solids.list) {
    if (x1 < s.box.x0 || x0 > s.box.x1 || z1 < s.box.z0 || z0 > s.box.z1 || low > s.top) continue;
    let face = false;
    const n = s.poly.length;
    for (let i = 0; i < n; i++) {
      const p = s.poly[i];
      const q = s.poly[(i + 1) % n];
      const f = crossing(a[0], a[2], b[0], b[2], p[0], p[1], q[0], q[1]);
      if (f == null) continue;
      const len = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
      const nx = ((q[1] - p[1]) / len) * s.turn;
      const nz = (-(q[0] - p[0]) / len) * s.turn;
      // Going out through it: let out.
      if (dx * nx + dz * nz >= 0) continue;
      const x = a[0] + dx * f;
      const z = a[2] + dz * f;
      const y = a[1] + dy * f;
      // Over the top of it here. (Asked just inside the edge: a roof's own
      // height at its eaves.)
      if (y >= s.topAt(x - nx * 0.05, z - nz * 0.05)) continue;
      face = true;
      if (!best || f < best.f) best = { f, at: [x, y, z], normal: [nx, 0, nz], solid: s, roof: false };
    }
    if (face) continue;
    // Down onto its roof: inside the footprint and under the roof at the
    // end, and not at the start.
    const under = (f) => {
      const x = a[0] + dx * f;
      const z = a[2] + dz * f;
      return insidePolygon(s.poly, x, z) && a[1] + dy * f < s.topAt(x, z);
    };
    if (!under(1) || under(0)) continue;
    let lo = 0;
    let hi = 1;
    for (let k = 0; k < 10; k++) {
      const mid = (lo + hi) / 2;
      if (under(mid)) hi = mid;
      else lo = mid;
    }
    if (best && lo >= best.f) continue;
    const x = a[0] + dx * hi;
    const z = a[2] + dz * hi;
    const e = 0.2;
    const gx = (s.topAt(x + e, z) - s.topAt(x - e, z)) / (2 * e);
    const gz = (s.topAt(x, z + e) - s.topAt(x, z - e)) / (2 * e);
    // (A roof's slope, not the step at a wall's edge or a ridge's crease.)
    const steep = Math.hypot(gx, gz);
    const k = steep > 1.5 ? 0 : 1;
    const l = Math.hypot(gx * k, 1, gz * k);
    best = { f: lo, at: [x, s.topAt(x, z), z], normal: [(-gx * k) / l, 1 / l, (-gz * k) / l], solid: s, roof: true };
  }
  return best;
}

// A ball's velocity ([vx, vy, vz], the hole's frame) off what it met
// (solidHit's): what it keeps straight off the face and along it. As it
// was if it isn't going into the face.
export function offSolid(v, hit) {
  const [nx, ny, nz] = hit.normal;
  const vn = v[0] * nx + v[1] * ny + v[2] * nz;
  if (vn >= 0) return [...v];
  const e = SOLID.off[hit.solid.kind] ?? SOLID.off.wall;
  return [(v[0] - vn * nx) * SOLID.along - e * vn * nx, (v[1] - vn * ny) * SOLID.along - e * vn * ny, (v[2] - vn * nz) * SOLID.along - e * vn * nz];
}

// The building or wall (x, z) is in or under, or null.
export function solidAt(solids, x, z) {
  for (const s of solids?.list ?? []) {
    if (x < s.box.x0 || x > s.box.x1 || z < s.box.z0 || z > s.box.z1) continue;
    if (insidePolygon(s.poly, x, z)) return s;
  }
  return null;
}
