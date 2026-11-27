// Hand edits to a hole (sim/holeedits.mjs): bunkers' and water's shapes -
// finding one by where it is, moving, sizing, a new one, whether it fits.

import { blobRadius, blobOutline, makePath, nearest, pointAt, edgeLoop, shapeReach, EDGE_MARKS, EDGE_RANGE } from "../course.mjs";
import { fingeredDepth } from "../fingers.mjs";
import { insidePolygon, distanceToEdge, polygonBounds } from "../terrain.mjs";
import { shapeOnPath } from "../paths.mjs";
import { TEE_CLEAR, WATER_TEE, r2 } from "./common.mjs";
import { wallOf } from "../walls.mjs";

// ---- Shapes ---------------------------------------------------------------------

// How far (x, z) is inside a shape's edge: positive inside, negative
// outside. Exact for a mapped shape; for a generated blob, measured along
// the line from its middle, which is close enough for its gentle outline -
// but a fingered bunker's to its nearest edge (sim/fingers.mjs
// fingeredDepth): a finger's sides are as much its edge as its tip.
export function insideDepth(shape, x, z) {
  if (shape.poly) {
    const d = distanceToEdge(shape.poly, x, z);
    return insidePolygon(shape.poly, x, z) ? d : -d;
  }
  const dx = x - shape.x;
  const dz = z - shape.z;
  const c = Math.cos(-(shape.rot ?? 0));
  const s = Math.sin(-(shape.rot ?? 0));
  const u = dx * c - dz * s;
  const v = dx * s + dz * c;
  if (shape.fingered) return fingeredDepth(shape, u, v);
  return blobRadius(shape, Math.atan2(v, u)) - Math.hypot(u, v);
}

// A box round a shape, `grow` metres wider all round.
export function shapeBounds(s, grow = 0) {
  if (s.poly) {
    const b = polygonBounds(s.poly);
    return { x0: b.x0 - grow, z0: b.z0 - grow, x1: b.x1 + grow, z1: b.z1 + grow };
  }
  // (Marks pulling its edge out reach further, and a fingered bunker's
  // fingers: course.mjs shapeReach.)
  const R = shapeReach(s) + grow;
  return { x0: s.x - R, z0: s.z - R, x1: s.x + R, z1: s.z + R };
}
export const inBox = (b, x, z) => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1;

// Moved or resized copies. A mapped shape moves its outline with it.
export function moveShape(s, dx, dz) {
  const out = { ...s, x: r2(s.x + dx), z: r2(s.z + dz) };
  if (s.poly) out.poly = s.poly.map(([x, z]) => [r2(x + dx), r2(z + dz)]);
  return out;
}
export function scaleShape(s, f) {
  const out = { ...s, rx: r2(s.rx * f), rz: r2(s.rz * f) };
  if (s.poly) out.poly = s.poly.map(([x, z]) => [r2(s.x + (x - s.x) * f), r2(s.z + (z - s.z) * f)]);
  return out;
}

// The shape nearest a spot, within `tol` metres of its middle: -1 if none.
export function shapeAt(list, [x, z], tol = 1) {
  let best = -1;
  let bd = tol;
  list.forEach((s, i) => {
    const d = Math.hypot(s.x - x, s.z - z);
    if (d <= bd) {
      bd = d;
      best = i;
    }
  });
  return best;
}

// The shape a spot is in (or within `grow` metres of): -1 if none.
export function shapeUnder(list, x, z, grow = 0) {
  let best = -1;
  let bd = -grow;
  list.forEach((s, i) => {
    if (!inBox(shapeBounds(s, grow), x, z)) return;
    const d = insideDepth(s, x, z);
    if (d >= bd) {
      bd = d;
      best = i;
    }
  });
  return best;
}

// The green's outline, for tests against it.
export const greenPoly = (L) => L.green.poly ?? blobOutline(L.green, 32);

// A new bunker or pond where someone taps: a kidney of sand lying across
// the line of play (round the green's edge when near it), or a pond.
export function newShape(L, kind, x, z) {
  const path = makePath(L.path);
  const g = L.green;
  const near = Math.hypot(x - g.x, z - g.z) < Math.max(g.rx, g.rz) + 25;
  const at = pointAt(path, nearest(path, x, z).s);
  const rot = near ? Math.atan2(z - g.z, x - g.x) + Math.PI / 2 : Math.atan2(at.dir[1], at.dir[0]);
  // (A fairway added by hand: a broad, gently lobed oval along the hole.)
  const s =
    kind === "fairway"
      ? { x: r2(x), z: r2(z), rot: r2(Math.atan2(at.dir[1], at.dir[0])), rx: 22, rz: 14, lobes: 2, phase: 0.4, depth: 0.05 }
      : kind === "water"
      ? { x: r2(x), z: r2(z), rot: r2(rot), rx: 15, rz: 10, lobes: 2, phase: 0.7, depth: 0.1 }
      : { x: r2(x), z: r2(z), rot: r2(rot), rx: 6.5, rz: 3.6, lobes: 2, phase: 1.3, depth: 0.16 };
  // A mapped hole's shapes are outlines.
  if (L.source === "map") s.poly = blobOutline(s, 28).map(([px, pz]) => [r2(px), r2(pz)]);
  return s;
}

// ---- A pond reshaped by its marks (course.mjs EDGE_MARKS) -------------------------

// Its marks' sizes as they are (1 each as made).
export const edgeOf = (s) => (Array.isArray(s?.edge) && s.edge.length === EDGE_MARKS ? s.edge : Array(EDGE_MARKS).fill(1));

// Where its marks sit, on its edge: EDGE_MARKS spots in the hole's frame,
// evenly round it from its own axis.
export function edgeMarks(s) {
  const out = [];
  for (let k = 0; k < EDGE_MARKS; k++) {
    const phi = (k / EDGE_MARKS) * Math.PI * 2;
    const r = blobRadius(s, phi);
    const a = phi + (s.rot ?? 0);
    out.push([s.x + Math.cos(a) * r, s.z + Math.sin(a) * r]);
  }
  return out;
}

// The size mark k needs to sit at (x, z): how far out along its own line
// that is, against the shape without its marks (a mapped outline: as it is
// now, over the size the mark has).
export function edgeMarkSize(s, k, x, z) {
  const phi = (k / EDGE_MARKS) * Math.PI * 2;
  const a = phi + (s.rot ?? 0);
  const along = (x - s.x) * Math.cos(a) + (z - s.z) * Math.sin(a);
  const base = s.poly ? blobRadius(s, phi) / edgeOf(s)[k] : blobRadius({ ...s, edge: undefined }, phi);
  return Math.min(EDGE_RANGE[1], Math.max(EDGE_RANGE[0], along / Math.max(0.5, base)));
}

// The shape with its marks at sizes h (1 each: as made). A blob keeps them
// (course.mjs straightRadius); a mapped outline's points move out or in
// along their lines from its middle, by how much more or less than before.
export function reshapeShape(s, h) {
  const edge = h.map((v) => r2(Math.min(EDGE_RANGE[1], Math.max(EDGE_RANGE[0], v))));
  const out = { ...s };
  if (edge.every((v) => v === 1)) delete out.edge;
  else out.edge = edge;
  if (s.poly) {
    const was = edgeOf(s);
    const rot = s.rot ?? 0;
    out.poly = s.poly.map(([x, z]) => {
      const phi = Math.atan2(z - s.z, x - s.x) - rot;
      const k = edgeLoop(edge, phi) / Math.max(0.05, edgeLoop(was, phi));
      return [r2(s.x + (x - s.x) * k), r2(s.z + (z - s.z) * k)];
    });
  }
  return out;
}

// A pond that can lie over the green, or all round it (an island green):
// it gives way to the green and its fringe (sim/greenfirst.mjs). Not a
// brook, nor one with a wall - their banks and walls would run across it.
export const pondGivesWay = (w) => !w.brook && !wallOf(w);

// Would this bunker or pond leave the hole playable? The tee clear of it,
// the cup well out of it, and (for water that can't give way to the green:
// pondGivesWay) none of the green under it; sand can come up to the green
// but not over much of it.
export const shapeFits = (L, s, kind, opts) => !shapeTrouble(L, s, kind, opts);

// Why a bunker, pond or added fairway won't fit where it is: "tee", "cup",
// "green", "ground" (its middle off the hole's ground) or "path" - or null
// if it will (the hole editor says which).
export function shapeTrouble(L, s, kind, { paths = true } = {}) {
  const r = L.region;
  const offGround = r && !inBox(r, s.x, s.z);
  // A fairway added by hand (holeedits "a+") goes anywhere on the hole but
  // the green - the tee, a cart path, sand and water all play over it.
  if (kind === "fairway") return insideDepth(L.green, s.x, s.z) > 0 ? "green" : offGround ? "ground" : null;
  // Water may come right up to the teeing ground, just not onto it (the
  // owner, 22 October 2026, making the whole front of a par 3 water: "Was
  // having a struggle placing [it] with a can't place here"); sand keeps
  // TEE_CLEAR from the tee.
  if (kind === "water" ? teeBoxPoints.some(([x, z]) => insideDepth(s, x, z) > 0) : insideDepth(s, 0, 0) > -TEE_CLEAR) return "tee";
  if (kind !== "water" || !pondGivesWay(s)) {
    if (insideDepth(s, L.pin[0], L.pin[1]) > -2) return "cup";
    if (insideDepth(L.green, s.x, s.z) > 0) return "green";
    const g = greenPoly(L);
    let covered = 0;
    for (const [x, z] of g) if (insideDepth(s, x, z) > 0) covered++;
    if (kind === "water" ? covered > 0 : covered > g.length * 0.25) return "green";
  }
  if (offGround) return "ground";
  // Nor sand on or right by a cart path. Water may lie over one: the path
  // crosses it on a timber bridge, as the paths between holes do (sim/
  // bridges.mjs) - a pond grown round a par 3's green for an island green
  // was always stopped by its path (the owner, 22 October 2026: "I tried
  // to create a island green, but didn't work").
  if (paths && kind !== "water" && shapeOnPath(L, s, kind)) return "path";
  return null;
}
// The teeing ground (sim/course.mjs surfaceAt: 12 m by 14 m) and WATER_TEE
// metres round it: where no water may reach.
const teeBoxPoints = (() => {
  const [hx, hz] = [6 + WATER_TEE, 7 + WATER_TEE];
  const out = [[0, 0]];
  for (let i = 0; i < 16; i++) {
    const k = i / 4;
    const side = Math.floor(k);
    const f = k - side;
    out.push([[-hx + 2 * hx * f, hz], [hx, hz - 2 * hz * f], [hx - 2 * hx * f, -hz], [-hx, -hz + 2 * hz * f]][side]);
  }
  return out;
})();
