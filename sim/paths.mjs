// Cart paths: a narrow strip of asphalt, concrete or gravel, usually down
// one side of a hole from behind the tee to past the green - sometimes
// crossing in front of the tee - with low kerbs along its edges.
//
// A path is kept on a hole's layout as { p, w, m }:
//   p  the points it runs through, in the hole's frame (x down the hole, z
//      to the right, metres, two decimals): 2 to 40 of them. The path runs
//      smoothly through them (pathLine), so a few points make a long curve.
//   w  how wide it is, metres (the kerbs are extra)
//   m  what it's made of: 0 asphalt, 1 concrete, 2 gravel
// layout.paths is a list of them; a layout without one has none. That's
// every hole made before paths existed, and every Challenges hole: they
// play and look exactly as they did.
//
// One line (pathLine) is used by everything - play, the 3D path, the maps
// and the signs - so the path is where it's drawn, everywhere.
//
// Pure functions, shared by the designer, play and the tests.

import { blobRadius, makePath, nearest, pointAt, fairwayHalfWidth, FIRST_CUT, seeded, TEE_REACH, shapeReach } from "./course.mjs";
import { insidePolygon, distanceToEdge, polygonBounds } from "./terrain.mjs";
import { teeSpots } from "./tees.mjs";
import { crossesWell } from "./bridges.mjs";

// What a path can be made of, in the order of `m`.
export const PATH_KINDS = [{ word: "Asphalt" }, { word: "Concrete" }, { word: "Gravel" }];
// A cart path's usual width, and the narrowest and widest (metres).
export const PATH_WIDTH = 2.4;
export const WIDTHS = [1.5, 4];
// Points a path can be kept as, and how long it can be (metres).
export const MAX_POINTS = 40;
export const PATH_LENGTH = [10, 2000];
// The kerbs: how far past the surface's edge they reach. A ball on them is
// on the path. Gravel has none; its edge frays into the grass.
export const KERB = 0.12;
// How far a path's edge keeps from things, metres: clear of the tee box,
// of the teeing spot on a hole from a map (it plays as tee for 5 m round),
// off the green and its fringe, and clear of sand and water - and of the
// collar of grass round a bunker and the muddy margin round a pond, which
// would otherwise lie over it.
export const PATH_CLEAR = { tee: 0.5, spot: 5.5, green: 2, sand: 1, water: 1.5 };
// Trees don't stand this close to a path's edge (metres).
export const TREE_GAP = 1.5;
// The grass either side of a path is kept down this far from its edge
// (metres): rough, never deep rough or its hay (the owner, 28 October
// 2026: "let's ensure the paths make sense both logistically and
// visually" - long grass had grown right up to the edge of a sixth of the
// paths' length, more than half of some).
export const VERGE = 2;
// Points along the line, metres apart.
const STEP = 1;
// A path made for a hole keeps this much further off things than it has to,
// so rounding its corners afterwards can't take it too close.
const SLACK = 1.2;

const r2 = (v) => Math.round(v * 100) / 100;
import { clamp, smoothstep01 } from "./mathutil.mjs";
const fin = (v) => typeof v === "number" && Number.isFinite(v);

// ---- The path's line ------------------------------------------------------------------

// Is a path well formed? A course file can be edited by hand or damaged:
// one that isn't is left out (not drawn, not played).
// (Its points within a few km of the hole's tee, and its line no longer
// than a long walk - a damaged file's or another PC's path of a billion
// metres would otherwise be sampled until the game ran out of memory.)
export const PATH_REACH = 5000;
export function validPath(path) {
  if (!path || typeof path !== "object" || !Array.isArray(path.p)) return false;
  if (path.p.length < 2 || path.p.length > MAX_POINTS) return false;
  if (!path.p.every((q) => Array.isArray(q) && fin(q[0]) && fin(q[1]) && Math.abs(q[0]) <= PATH_REACH && Math.abs(q[1]) <= PATH_REACH)) return false;
  if (rawLength(path.p) > 2 * PATH_REACH) return false;
  if (path.w != null && !(fin(path.w) && path.w > 0)) return false;
  if (path.m != null && ![0, 1, 2].includes(path.m)) return false;
  return true;
}

// The paths between holes laid into a hole's layout to play (linkpaths.mjs
// withLinks): known as such, so the hole's own edits work on its own paths
// alone (holeedits/apply.mjs).
const LINKS = new WeakSet();
export const markLink = (p) => (p && typeof p === "object" && LINKS.add(p), p);
export const isLink = (p) => !!p && typeof p === "object" && LINKS.has(p);

// A line's length as its points give it (before it's smoothed).
export function rawLength(pts) {
  let n = 0;
  for (let i = 1; i < pts.length; i++) n += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return n;
}

// A path tidied: points to two decimals, width in range, a surface.
export function cleanPath({ p, w = PATH_WIDTH, m = 0 }) {
  return { p: p.map(([x, z]) => [r2(x), r2(z)]), w: r2(clamp(w, WIDTHS[0], WIDTHS[1])), m: [0, 1, 2].includes(m) ? m : 0 };
}

const halfOf = (path) => clamp(path.w ?? PATH_WIDTH, WIDTHS[0], WIDTHS[1]) / 2;
// How far from the middle of the line a ball is on the path (its kerbs too).
export const reachOf = (path) => halfOf(path) + (path.m === 2 ? 0.05 : KERB);

// The line a path follows: a smooth curve through its points, a point about
// every metre, with how far along each one is. Worked out once per path.
//
// Between each two points it's a gentle curve (a cubic Bezier) leaving the
// first and arriving at the second in the path's direction there - halfway
// between the ways in and out. How far that direction carries into a
// stretch is kept to a third of the shorter stretch either side, so a long
// straight stretch stays straight, the turning is done on the short
// stretches round a bend, and a dot dragged well out of line makes a bend,
// never a loop.
const lines = new WeakMap();
export function pathLine(path) {
  let line = lines.get(path);
  if (line) return line;
  const P = path.p;
  const n = P.length;
  const seg = (i) => [P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]];
  const size = (i) => (i >= 0 && i < n - 1 ? Math.hypot(...seg(i)) : Infinity);
  const unit = ([x, z]) => {
    const l = Math.hypot(x, z) || 1;
    return [x / l, z / l];
  };
  const dirs = P.map((_, i) => {
    const a = i > 0 ? unit(seg(i - 1)) : null;
    const b = i < n - 1 ? unit(seg(i)) : null;
    if (!a) return b;
    if (!b) return a;
    const t = [a[0] + b[0], a[1] + b[1]];
    // Doubling straight back: carry on the way it was going.
    if (Math.hypot(t[0], t[1]) < 0.1) return b;
    return unit(t);
  });
  const pts = [];
  for (let i = 0; i < n - 1; i++) {
    const b = P[i];
    const c = P[i + 1];
    const L = Math.hypot(c[0] - b[0], c[1] - b[1]);
    const out = Math.min(L, size(i - 1)) / 3;
    const into = Math.min(L, size(i + 1)) / 3;
    const h1 = [b[0] + dirs[i][0] * out, b[1] + dirs[i][1] * out];
    const h2 = [c[0] - dirs[i + 1][0] * into, c[1] - dirs[i + 1][1] * into];
    const k = Math.max(1, Math.ceil(L / STEP));
    for (let j = 0; j < k; j++) {
      const u = j / k;
      const v = 1 - u;
      const w0 = v * v * v;
      const w1 = 3 * v * v * u;
      const w2 = 3 * v * u * u;
      const w3 = u * u * u;
      pts.push(j === 0 ? [b[0], b[1]] : [w0 * b[0] + w1 * h1[0] + w2 * h2[0] + w3 * c[0], w0 * b[1] + w1 * h1[1] + w2 * h2[1] + w3 * c[1]]);
    }
  }
  pts.push([P[n - 1][0], P[n - 1][1]]);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  line = { pts, cum, length: cum[cum.length - 1] };
  lines.set(path, line);
  return line;
}

// A stretch of line from (ax, az) to (bx, bz), its run and length worked
// out once (segDistance asks for them at every spot).
function stretch(ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  return { ax, az, bx, bz, dx, dz, len2: dx * dx + dz * dz };
}

// Distance from (x, z) to a stretch of line (made by stretch()).
function segDistance(s, x, z) {
  const dx = s.dx;
  const dz = s.dz;
  const len2 = s.len2;
  const t = len2 > 0 ? clamp(((x - s.ax) * dx + (z - s.az) * dz) / len2, 0, 1) : 0;
  return Math.hypot(x - (s.ax + dx * t), z - (s.az + dz * t));
}

// ---- Finding paths quickly ---------------------------------------------------------------

// The paths' lines cut into short stretches and filed on a grid of 8 m
// squares, so "is this spot on a path?" - asked at every step of a rolling
// ball - looks at the two or three stretches near it, not every one.
const CELL = 8;
const key = (ix, iz) => ix * 131072 + iz;
const indexes = new WeakMap();
export function pathIndex(paths) {
  let idx = indexes.get(paths);
  if (idx) return idx;
  const cells = new Map();
  const segs = [];
  paths.forEach((path, i) => {
    // (A path as it's drawn - sim/pathjoin.mjs drawnPaths - measured from
    // its own line.)
    const pts = Array.isArray(path?.line) && path.line.length >= 2 ? path.line : validPath(path) ? pathLine(path).pts : null;
    if (!pts) return;
    const reach = reachOf(path);
    const half = halfOf(path);
    for (let k = 1; k < pts.length; k++) {
      const s = stretch(pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1]);
      s.reach = reach;
      s.half = half;
      s.path = i;
      segs.push(s);
      const ix0 = Math.floor((Math.min(s.ax, s.bx) - reach) / CELL);
      const ix1 = Math.floor((Math.max(s.ax, s.bx) + reach) / CELL);
      const iz0 = Math.floor((Math.min(s.az, s.bz) - reach) / CELL);
      const iz1 = Math.floor((Math.max(s.az, s.bz) + reach) / CELL);
      for (let ix = ix0; ix <= ix1; ix++) {
        for (let iz = iz0; iz <= iz1; iz++) {
          const kk = key(ix, iz);
          const list = cells.get(kk);
          if (list) list.push(s);
          else cells.set(kk, [s]);
        }
      }
    }
  });
  idx = { cells, segs };
  indexes.set(paths, idx);
  return idx;
}

// Is (x, z) on one of a hole's paths (kerbs included)?
export function onPath(layout, x, z) {
  const paths = layout.paths;
  if (!paths?.length) return false;
  const list = pathIndex(paths).cells.get(key(Math.floor(x / CELL), Math.floor(z / CELL)));
  if (!list) return false;
  for (const s of list) if (segDistance(s, x, z) <= s.reach) return true;
  return false;
}

// How far (x, z) is from the nearest path's edge, metres (negative on it);
// Infinity with no paths. `within`: only paths nearer than that are looked
// for (quicker), anything further counts as Infinity.
export function gapToPaths(paths, x, z, within = Infinity) {
  if (!paths?.length) return Infinity;
  const idx = pathIndex(paths);
  let best = Infinity;
  if (within === Infinity) {
    for (const s of idx.segs) best = Math.min(best, segDistance(s, x, z) - s.half);
    return best;
  }
  const r = Math.ceil((within + 3) / CELL);
  const cx = Math.floor(x / CELL);
  const cz = Math.floor(z / CELL);
  // (A stretch filed in two cells is measured twice - the same least
  // either way - rather than a set made at every spot to skip it.)
  for (let ix = cx - r; ix <= cx + r; ix++) {
    for (let iz = cz - r; iz <= cz + r; iz++) {
      const list = idx.cells.get(key(ix, iz));
      if (!list) continue;
      for (let n = 0; n < list.length; n++) {
        const s = list[n];
        best = Math.min(best, segDistance(s, x, z) - s.half);
      }
    }
  }
  return best <= within ? best : Infinity;
}

// Whether (x, z) is in a path's verge (VERGE), or on one.
export const onVerge = (paths, x, z) => !!paths?.length && gapToPaths(paths, x, z, VERGE + 0.01) <= VERGE;

// A made tree's crown reaches no further than this over a path's edge
// (metres): its trunk stands at least its crown's reach less this from the
// edge, and never nearer than TREE_GAP - so no path runs on under the
// trees (the owner, 28 October 2026: "ensure the paths make sense both
// logistically and visually").
export const CROWN_OVER = 0.5;
// How far a trunk keeps from a path's edge, its crown reaching `reach`.
export const pathGapFor = (reach = 0) => Math.max(TREE_GAP, reach - CROWN_OVER);
// Whether a tree at (x, z), its crown reaching `reach`, is clear of paths.
export const clearOfPaths = (paths, x, z, reach = 0) => {
  const need = pathGapFor(reach);
  return !paths?.length || gapToPaths(paths, x, z, need + 0.01) > need;
};

// Which path (its place in the list) passes nearest (x, z), within `tol`
// metres of its line: -1 if none.
export function pathAt(paths, [x, z], tol = 3) {
  let best = -1;
  let bd = tol;
  (paths ?? []).forEach((path, i) => {
    if (!validPath(path)) return;
    const { pts } = pathLine(path);
    for (let k = 1; k < pts.length; k++) {
      const d = segDistance(stretch(pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1]), x, z);
      if (d <= bd) {
        bd = d;
        best = i;
      }
    }
  });
  return best;
}

// The point of a path nearest (x, z): { at: [x, z], along (metres), point
// (the index of the point the path runs through that it's after) }.
export function nearestOnPath(path, x, z) {
  const { pts, cum } = pathLine(path);
  let best = { d: Infinity, at: pts[0], along: 0, k: 1 };
  for (let k = 1; k < pts.length; k++) {
    const s = { ax: pts[k - 1][0], az: pts[k - 1][1], bx: pts[k][0], bz: pts[k][1] };
    const dx = s.bx - s.ax;
    const dz = s.bz - s.az;
    const len2 = dx * dx + dz * dz || 1;
    const t = clamp(((x - s.ax) * dx + (z - s.az) * dz) / len2, 0, 1);
    const px = s.ax + dx * t;
    const pz = s.az + dz * t;
    const d = Math.hypot(x - px, z - pz);
    if (d < best.d) best = { d, at: [px, pz], along: cum[k - 1] + t * Math.sqrt(len2), k };
  }
  // Which of the path's own points come before it: they sit on the line at
  // known distances along.
  const P = path.p;
  let point = 0;
  let run = 0;
  for (let i = 0; i < P.length - 1; i++) {
    run += Math.max(1, Math.ceil(Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]) / STEP));
    if (best.k <= run) break;
    point = i + 1;
  }
  return { at: best.at, along: best.along, d: best.d, point };
}

// ---- Where a path can go -----------------------------------------------------------------

// How far (x, z) is inside a shape's edge: positive inside, negative
// outside (holeedits.mjs insideDepth: exact for a mapped outline, measured
// from the middle for a designed blob).
function depthIn(shape, x, z) {
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
  return blobRadius(shape, Math.atan2(v, u)) - Math.hypot(u, v);
}
// (Each outline's bounds worked out once.)
const boundsKept = new WeakMap();
function boundsOf(poly) {
  let b = boundsKept.get(poly);
  if (!b) boundsKept.set(poly, (b = polygonBounds(poly)));
  return b;
}
function boxOf(shape, grow) {
  if (shape.poly) {
    const b = boundsOf(shape.poly);
    return { x0: b.x0 - grow, z0: b.z0 - grow, x1: b.x1 + grow, z1: b.z1 + grow };
  }
  const R = shapeReach(shape) + grow;
  return { x0: shape.x - R, z0: shape.z - R, x1: shape.x + R, z1: shape.z + R };
}
const inBox = (b, x, z) => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1;

// The hole's other tee boxes (sim/tees.mjs: the white behind, the red in
// front), where they go with no path in the way: their middles, each the
// square TEE_REACH round it. A path keeps clear of them as of the hole's
// own tee - so a path never takes a box's place, and a box is never put on
// a path (the owner: "cart paths when created have crossed over the tee box
// a few times"). Worked out once for a layout as it stands.
const boxesKept = new WeakMap();
export function otherTeeBoxes(L) {
  if (!L?.path?.length || !L.green) return [];
  const kept = boxesKept.get(L);
  if (kept && kept.trees === L.trees && kept.green === L.green && kept.water === L.water && kept.bunkers === L.bunkers) return kept.boxes;
  const boxes = teeSpots({ ...L, paths: [] })
    .map((t) => t.at)
    .filter(([x, z]) => Math.hypot(x, z) > 1);
  boxesKept.set(L, { trees: L.trees, green: L.green, water: L.water, bunkers: L.bunkers, boxes });
  return boxes;
}
// How far (x, z) is outside the square TEE_REACH round [cx, cz] (0 inside).
export const outsideBox = ([cx, cz], x, z, R = TEE_REACH) => Math.hypot(Math.max(0, Math.abs(x - cx) - R), Math.max(0, Math.abs(z - cz) - R));

// What a path at (x, z), `half` wide each side, would be too close to - or
// null if nothing. `extra` keeps it further off still. boxes: the hole's
// other tee boxes (otherTeeBoxes). own: kept to the hole's own ground (a
// mapped hole's region).
function trouble(L, x, z, half, extra = 0, boxes = otherTeeBoxes(L), own = true) {
  const c = PATH_CLEAR;
  for (const b of boxes) if (outsideBox(b, x, z) - half < c.tee + extra) return "tee";
  if (own && L.region && !inBox(L.region, x, z)) return "off the hole";
  if (L.source === "map") {
    if (Math.hypot(x, z) - half < c.spot + extra) return "tee";
    for (const t of L.tees ?? []) {
      const b = boundsOf(t);
      const g = half + c.tee + extra;
      if (x < b.x0 - g || x > b.x1 + g || z < b.z0 - g || z > b.z1 + g) continue;
      if (insidePolygon(t, x, z) || distanceToEdge(t, x, z) - half < c.tee + extra) return "tee";
    }
  } else {
    // The designed tee box (sim/course.mjs surfaceAt).
    const d = Math.hypot(Math.max(0, Math.abs(x) - 6), Math.max(0, Math.abs(z) - 7));
    if (d - half < c.tee + extra) return "tee";
  }
  const g = half + c.green + extra;
  if (inBox(boxOf(L.green, g), x, z) && -depthIn(L.green, x, z) - half < c.green + extra) return "green";
  for (const other of L.greens ?? []) {
    const b = boundsOf(other);
    if (x < b.x0 - g || x > b.x1 + g || z < b.z0 - g || z > b.z1 + g) continue;
    if (insidePolygon(other, x, z) || distanceToEdge(other, x, z) - half < c.green + extra) return "green";
  }
  for (const b of L.bunkers) {
    if (inBox(boxOf(b, half + c.sand + extra), x, z) && -depthIn(b, x, z) - half < c.sand + extra) return "sand";
  }
  for (const w of L.water) {
    if (inBox(boxOf(w, half + c.water + extra), x, z) && -depthIn(w, x, z) - half < c.water + extra) return "water";
  }
  return null;
}

// Why a path can't go where it is on a hole - "green", "tee", "sand",
// "water", "off the hole", "too short", "too long" or "bad" - or null if it
// can. Every path, made for a hole, drawn by hand or brought in from a map,
// is checked the same way: never on a green or near one, a tee, sand or
// water, and (on a hole from a map) on the hole's own ground.
export function pathTrouble(L, path) {
  if (!validPath(path)) return "bad";
  const line = pathLine(path);
  if (line.length < PATH_LENGTH[0]) return "too short";
  if (line.length > PATH_LENGTH[1]) return "too long";
  const half = halfOf(path);
  const boxes = otherTeeBoxes(L);
  for (const [x, z] of line.pts) {
    const t = trouble(L, x, z, half, 0, boxes);
    if (t) return t;
  }
  return null;
}
export const pathFits = (L, path) => pathTrouble(L, path) == null;

// Boxes ({ x0, z0, x1, z1 }, the hole's frame) round everything a path
// keeps off on a hole (trouble): its tee boxes, its teeing spot (on a hole
// from a map), its greens, sand and water - a path further than its
// clearance from all of them is clear of them. Worked out once for a layout.
const troubleBoxesKept = new WeakMap();
export function troubleBoxes(L) {
  let out = troubleBoxesKept.get(L);
  if (out) return out;
  const R = TEE_REACH;
  out = otherTeeBoxes(L).map(([x, z]) => ({ x0: x - R, z0: z - R, x1: x + R, z1: z + R }));
  if (L.source === "map") {
    out.push({ x0: -PATH_CLEAR.spot, z0: -PATH_CLEAR.spot, x1: PATH_CLEAR.spot, z1: PATH_CLEAR.spot });
    for (const t of L.tees ?? []) if (t?.length > 2) out.push(polygonBounds(t));
    for (const g of L.greens ?? []) if (g?.length > 2) out.push(polygonBounds(g));
  } else out.push({ x0: -6, z0: -7, x1: 6, z1: 7 });
  if (L.green) out.push(boxOf(L.green, 0));
  for (const b of L.bunkers ?? []) out.push(boxOf(b, 0));
  for (const w of L.water ?? []) out.push(boxOf(w, 0));
  troubleBoxesKept.set(L, out);
  return out;
}

// How near (x, z) a path `half` wide each side is to hole L's water: 2 over
// it (its middle or an edge), 1 nearer it than a path keeps (PATH_CLEAR.water
// and `extra`), else 0. brooks: only its brooks (sim/brooks.mjs).
export function wetness(L, x, z, half = PATH_WIDTH / 2, extra = 0, brooks = false) {
  let out = 0;
  const keep = PATH_CLEAR.water + extra;
  for (const w of L.water ?? []) {
    if ((brooks && !w.brook) || !inBox(boxOf(w, half + keep), x, z)) continue;
    const d = -depthIn(w, x, z) - half;
    if (d < 0) return 2;
    if (d < keep) out = 1;
  }
  return out;
}

// What a path at (x, z) on hole L's ground or past it would be too close to,
// as a hole's own path is kept off them ("green", "tee", "sand", "water"),
// or null - for a path between holes (sim/linkway.mjs), which leaves one
// hole's ground for the next's.
export const groundTrouble = (L, x, z, half = PATH_WIDTH / 2, extra = 0) => trouble(L, x, z, half, extra, otherTeeBoxes(L), false);

// Is any of a hole's paths on or right by the square `R` round [cx, cz]
// (a tee box: sim/tees.mjs puts none there)?
export function pathByBox(paths, at, R = TEE_REACH, clear = PATH_CLEAR.tee) {
  for (const path of paths ?? []) {
    if (!validPath(path)) continue;
    const reach = reachOf(path);
    for (const [x, z] of pathLine(path).pts) if (outsideBox(at, x, z, R) - reach < clear) return true;
  }
  return false;
}

// Would a bunker or pond (`shape`) sit on or right by any of the hole's
// paths? For hand changes: one dragged onto a path isn't allowed.
export function shapeOnPath(L, shape, kind) {
  if (!L.paths?.length) return false;
  const clear = kind === "water" ? PATH_CLEAR.water : PATH_CLEAR.sand;
  for (const path of L.paths) {
    if (!validPath(path)) continue;
    const half = halfOf(path);
    const box = boxOf(shape, half + clear);
    for (const [x, z] of pathLine(path).pts) {
      if (inBox(box, x, z) && -depthIn(shape, x, z) - half < clear) return true;
    }
  }
  return false;
}

// ---- A path made for a hole ---------------------------------------------------------------

// Rounds the corners of a line, keeping its ends (Chaikin).
function roundCorners(pts, rounds = 2) {
  let out = pts;
  for (let r = 0; r < rounds; r++) {
    const next = [out[0]];
    for (let i = 0; i < out.length - 1; i++) {
      const [ax, az] = out[i];
      const [bx, bz] = out[i + 1];
      if (i > 0) next.push([ax * 0.75 + bx * 0.25, az * 0.75 + bz * 0.25]);
      if (i < out.length - 2) next.push([ax * 0.25 + bx * 0.75, az * 0.25 + bz * 0.75]);
    }
    next.push(out[out.length - 1]);
    out = next;
  }
  return out;
}

// The fewest points that keep a line within `tol` metres of where it was
// (Douglas-Peucker).
export function fewerPoints(pts, tol) {
  if (pts.length <= 2) return pts.slice();
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const s = stretch(pts[a][0], pts[a][1], pts[b][0], pts[b][1]);
    let far = -1;
    let fd = tol;
    for (let i = a + 1; i < b; i++) {
      const d = segDistance(s, pts[i][0], pts[i][1]);
      if (d > fd) {
        fd = d;
        far = i;
      }
    }
    if (far > 0) {
      keep[far] = 1;
      stack.push([a, far], [far, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}
// ...and no more than MAX_POINTS of them.
export function simplifyLine(pts, tol = 0.5) {
  let out = fewerPoints(pts, tol);
  for (let t = tol * 1.5; out.length > MAX_POINTS; t *= 1.5) out = fewerPoints(pts, t);
  return out;
}

// How far out from the middle of the hole its fairway reaches at s metres
// along it (either side, at its widest; 0 where there's no fairway): a
// designed hole's fairway, or a mapped hole's fairway shapes. `usual`: the
// fairway's usual half-width, for laying a path alongside where it's
// missing (12 m on a hole from a map with none).
function fairwayEdge(L, path) {
  if (L.source !== "map") {
    const f = L.fairway;
    return { at: (s) => fairwayHalfWidth(f, s), usual: f.half || 12 };
  }
  // How far the hole's own fairway reaches out from its line of play at s:
  // walking out from the line, either way, to where the fairway stops - so
  // only fairway joined to the line counts. A hole from a map, or on
  // made-up hills, carries its neighbours' fairways too; measured round
  // every outline it had, a fairway's "edge" was a neighbour's, a hundred
  // metres out or more, and no path had room. Worked out a couple of
  // metres apart along the hole, once.
  const fairways = L.fairways ?? [];
  const reach = L.treeLine ?? 60;
  const inFairway = (x, z) => fairways.some((poly) => insidePolygon(poly, x, z));
  const STEP = 3;
  const cache = new Map();
  const at = (s) => {
    const key = Math.round(clamp(s, 0, path.length) / STEP);
    if (cache.has(key)) return cache.get(key);
    const a = pointAt(path, key * STEP);
    const nx = -a.dir[1];
    const nz = a.dir[0];
    let out = 0;
    for (const sign of [-1, 1]) {
      // From the line, or just off it if the line itself isn't on fairway
      // there (a dog-leg's corner, the gap before the fairway starts).
      let o = 0;
      while (o <= 6 && !inFairway(a.p[0] + nx * o * sign, a.p[1] + nz * o * sign)) o += 1;
      if (o > 6) continue;
      while (o <= reach && inFairway(a.p[0] + nx * o * sign, a.p[1] + nz * o * sign)) o += 1;
      out = Math.max(out, o);
    }
    cache.set(key, out);
    return out;
  };
  const widths = [];
  for (let s = 0; s <= path.length; s += 10) {
    const w = at(s);
    if (w > 0) widths.push(w);
  }
  widths.sort((a, b) => a - b);
  return { at, usual: widths.length ? widths[Math.floor(widths.length * 0.75)] : 12 };
}

// Is the ground at (x, z) clear for a path made for a hole: `half` wide,
// SLACK further off things than a path has to be?
const clearFor = (L, x, z, half, slack = SLACK) => trouble(L, x, z, half, slack) == null;
// Every metre of the straight line from a to b clear.
function segmentClear(L, a, b, half, slack) {
  const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]));
  for (let i = 1; i < n; i++) {
    const t = i / n;
    if (!clearFor(L, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, half, slack)) return false;
  }
  return true;
}

// A cart path laid out down one side of a hole (`side`: -1 left, 1 right).
// `cross`: it starts on the other side, behind the tee, and crosses in
// front of it before the fairway. Null if it can't be done.
// reach: how far past the tree line it may go to get round something (a
// pond reaching back into the trees); slack: how far it keeps from sand,
// water, the green and the tee beyond what it must.
function layOut(L, path, side, cross, { phase, sway }, { reach = 8, slack = SLACK, step = 6, out = false, first = false } = {}, floors = [], stuck = null) {
  const half = PATH_WIDTH / 2;
  const len = path.length;
  const edge = fairwayEdge(L, path);
  const treeLine = L.treeLine ?? 60;
  const g = L.green;
  const greenSide = blobRadius(g, (side * Math.PI) / 2);
  // Where the fairway starts: a crossing has to be over before it.
  const fairwayFrom = L.source === "map" ? 60 : (L.fairway?.to > L.fairway?.from ? L.fairway.from : len);
  const crossA = 16;
  const crossB = 52;
  if (cross && fairwayFrom < crossB + 8) return null;
  const start = cross ? -side : side;
  const pts = [];
  const place = (s, off, sign, free) => {
    // The spot `off` metres out from the middle of the hole at s (beyond
    // either end, carried on straight).
    const at = pointAt(path, clamp(s, 0, len));
    const beyond = s < 0 ? s : s > len ? s - len : 0;
    const cx = at.p[0] + at.dir[0] * beyond;
    const cz = at.p[1] + at.dir[1] * beyond;
    const nx = -at.dir[1];
    const nz = at.dir[0];
    const spot = (o) => [cx + nx * o * sign, cz + nz * o * sign];
    // Clear, and reachable from the point before without crossing anything
    // (a pond beside the hole: passing inside it at one point and behind it
    // at the next would cut straight across the water).
    const prev = pts[pts.length - 1];
    // (The first try, as paths were always made, checks the points alone:
    // every path that fitted before comes out the same.)
    const ok = (q) => clearFor(L, q[0], q[1], half, slack) && (first || !prev || segmentClear(L, prev, q, half, slack));
    if (free) {
      // Crossing: wherever it falls, as long as it's clear.
      const q = spot(off);
      return ok(q) ? q : null;
    }
    // Round anything in the way: the nearest clear spot, out or in, between
    // just outside the first cut and a little way into the trees.
    const e = s > 0 && s < len ? edge.at(s) : 0;
    const lo = e > 0 ? e + half + 1 : 6;
    const hi = treeLine + reach;
    // (out: further out first, then in - round the back of what's there.)
    for (let k = 0; k <= 100; k++) {
      const o = out ? (k <= 60 ? off + k * 1.5 : off - (k - 60) * 1.5) : off + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 1.5;
      if (o < lo || o > hi) continue;
      const q = spot(o);
      if (ok(q)) return q;
    }
    // Stuck: where it could have gone had it come from further out - the
    // first clear spot beyond what's in the way - for another go
    // (generatePath), the way there taken out earlier.
    if (stuck) {
      let blocked = false;
      for (let o = lo; o <= hi; o += 1.5) {
        const q = spot(o);
        if (!clearFor(L, q[0], q[1], half, slack)) blocked = true;
        else if (blocked) {
          stuck.at = { s, o: o + 1.5 };
          break;
        }
      }
    }
    return null;
  };
  // Behind the tee, then along the hole to past the green.
  for (const s of [-14, -7]) {
    const q = place(s, s === -14 ? 9.5 : 10, start, false);
    if (!q) return null;
    pts.push(q);
  }
  for (let s = 0; s <= len + 12; s += step) {
    const e = Math.max(edge.at(Math.min(s, len)), edge.usual);
    let target = clamp(e + FIRST_CUT + 6 + sway * Math.sin(s / 55 + phase), e + half + 1.5, Math.max(e + half + 1.5, treeLine - 5));
    // From beside the tee out to its usual line.
    if (s < 45) target = 10 + (target - 10) * smoothstep01(s / 45);
    // Round the green, well clear of it, and on past its middle.
    if (s > len - 35) target = target + (Math.max(target, greenSide + 12) - target) * smoothstep01((s - (len - 35)) / 35);
    // Out behind something it got stuck on last time: easing out over the
    // 40 m before it - further before it each time it's stuck there again.
    for (const f of floors) {
      const ease = 40 * (f.n ?? 1);
      if (s >= f.s - ease && s <= f.s) target = Math.max(target, target + (f.o - target) * smoothstep01((s - (f.s - ease)) / ease));
      else if (s > f.s && s <= f.s + step) target = Math.max(target, f.o);
    }
    let q;
    if (cross && s >= crossA && s <= crossB) {
      const u = smoothstep01((s - crossA) / (crossB - crossA));
      q = place(s, target * (2 * u - 1), side, true);
    } else q = place(s, target, cross && s < crossA ? start : side, false);
    if (!q) return null;
    pts.push(q);
  }
  const line = simplifyLine(roundCorners(pts, 2), 0.5);
  return cleanPath({ p: line, w: PATH_WIDTH, m: 0 });
}

// A cart path for a hole: `choice` "auto" (the side away from any water,
// the left if neither - most courses favour the left, away from a
// right-hander's slice - and now and then crossing in front of the tee),
// "left", "right" or "none". Its own randomness (`seed`), so making one
// changes nothing else about the hole. Null if none fits.
// The tries, in order: how far past the tree line a path may go, and how
// far it keeps off the hazards.
// And how often along the hole it places a point: closer together, a path
// swinging round a pond follows it rather than cutting its corner.
export const PATH_ROOM = [
  { reach: 8, slack: SLACK, step: 6, first: true },
  { reach: 8, slack: SLACK, step: 6 },
  { reach: 8, slack: SLACK, step: 3 },
  { reach: 8, slack: SLACK * 2 + 0.5, step: 3 },
  { reach: 45, slack: SLACK, step: 3 },
  { reach: 45, slack: SLACK, step: 3, out: true },
  { reach: 45, slack: SLACK * 2 + 0.5, step: 3, out: true },
];
// Over its brooks on a bridge where it crosses one straight over (the
// owner, 28 October 2026: "going around brooks rather than over? Don't
// forget you can build bridges" - sim/bridges.mjs crossesWell): down the
// side, and crossing in front of the tee or not, as it would go round them,
// but straight over where it would have gone round. Round them only where
// it would run along one.
export function generatePath(L, choice = "auto", seed = 1) {
  return brookPaths(L, choice, seed).path;
}

// The path generatePath lays (path), and the one it would lay round the
// hole's brooks, as it did before they could be bridged (round).
export function brookPaths(L, choice = "auto", seed = 1) {
  const made = layPath(L, choice, seed);
  const round = made?.path ?? null;
  if (L.water?.some((w) => w.brook)) {
    const dry = { ...L, water: L.water.filter((w) => !w.brook) };
    const over = layPath(dry, choice, seed, made);
    if (over && overBrooks(L, over.path)) return { path: over.path, round };
  }
  return { path: round, round };
}

// Whether a path's crossings of its hole's brooks are each straight over,
// short enough to bridge (sim/bridges.mjs crossesWell).
export function overBrooks(L, path) {
  const half = halfOf(path);
  return crossesWell(pathLine(path).pts.map(([x, z]) => wetness(L, x, z, half, 0, true)));
}

// { path, side, cross }, or null. only: just that side and crossing.
function layPath(L, choice, seed, only = null) {
  if (!choice || choice === "none") return null;
  const rand = seeded(seed);
  const style = { phase: rand() * Math.PI * 2, sway: 1 + rand() * 1.5 };
  const crossing = rand() < 0.25;
  const path = makePath(L.path);
  let sides;
  if (choice === "left") sides = [-1];
  else if (choice === "right") sides = [1];
  else {
    const wet = { [-1]: 0, 1: 0 };
    for (const w of L.water) {
      const n = nearest(path, w.x, w.z);
      if (Math.abs(n.d) > 4) wet[Math.sign(n.d)]++;
    }
    const first = wet[-1] <= wet[1] ? -1 : 1;
    sides = [first, -first];
  }
  // Its own wander first; failing that, a straighter line, which finds
  // its way past more. Then keeping further off the hazards (the line drawn
  // through its points can clip a pond's edge the points themselves miss),
  // and then going further back into the trees to get round a pond or a
  // bunker reaching out there - as a real course's path goes round behind
  // one - rather than saying there's no room on that side.
  for (const room of PATH_ROOM) {
    for (const s of [style, { phase: style.phase, sway: 0 }]) {
      for (const side of sides) {
        if (only && side !== only.side) continue;
        // Crossing first now and then (a designed hole left to choose); and
        // tried anyway if the side it wants is blocked by the tee.
        const tries = choice === "auto" && crossing ? [true, false] : [false, true];
        for (const cross of tries) {
          if (only && cross !== only.cross) continue;
          // Stuck partway (a pond it passed inside of closes in): again,
          // going round the outside of it from 40 m before - a few times.
          const floors = [];
          for (let k = 0; k < 10; k++) {
            const stuck = {};
            const p = layOut(L, path, side, cross, s, room, floors, stuck);
            if (p && pathFits(L, p)) return { path: p, side, cross };
            if (p || !stuck.at || room.first) break;
            // Stuck at the same place again: ease out from further back.
            const again = floors.find((f) => Math.abs(f.s - stuck.at.s) < 1);
            if (again) {
              if (again.n >= 3) break;
              again.n++;
              again.o = Math.max(again.o, stuck.at.o);
            } else floors.push({ ...stuck.at, n: 1 });
          }
        }
      }
    }
  }
  return null;
}

// Trees clear of a hole's paths: none stands within TREE_GAP of one.
export function treesOffPaths(trees, paths) {
  if (!paths?.length) return trees;
  return trees.filter(([x, z]) => gapToPaths(paths, x, z, TREE_GAP + 0.01) > TREE_GAP);
}

// Which side of the hole a path is mostly on near the tee: -1 left, 1
// right, 0 if there's no path.
export function pathSide(L) {
  const p = (L.paths ?? []).find(validPath);
  if (!p) return 0;
  const path = makePath(L.path);
  let sum = 0;
  for (const [x, z] of pathLine(p).pts) {
    if (x < -20 || x > 80) continue;
    sum += Math.sign(nearest(path, x, z).d);
  }
  return sum === 0 ? Math.sign(nearest(path, ...p.p[0]).d) || -1 : Math.sign(sum);
}

// A seed for a hole's path from its layout (for a path put on by hand,
// where the hole's own seed isn't to hand): the same hole, the same path.
export function pathSeed(L) {
  let h = 0x9a7b;
  for (const [x, z] of L.path) h = Math.imul(h ^ Math.round(x * 100), 0x5bd1e995) ^ Math.round(z * 100);
  return (h >>> 0) || 1;
}

// ---- Paths from a map ------------------------------------------------------------------

// Lines mapped as paths ({ line: [[x, z], ...], width, surface }, in the
// hole's frame) turned into the hole's cart paths: only what's on its own
// ground, cut where a line runs onto a green, a tee, sand or water (a
// footbridge over a pond is left out - the water plays as water - unless
// it's `bridged`: then it crosses on a bridge of its own), pieces
// under 8 m dropped, each kept as at most MAX_POINTS points.
export function pathsFromLines(hole, lines, minLength = 8) {
  const out = [];
  for (const { line, width = PATH_WIDTH, surface = 0, bridged = false } of lines) {
    // A path a hole was designed with, carried onto hills (sim/imaginary.mjs
    // surveyOf), crossing a pond of the hole beside it there: over it on a
    // bridge (sim/bridges.mjs) rather than stopping at the water's edge.
    const L = bridged ? { ...hole, water: [] } : hole;
    const w = clamp(width, WIDTHS[0], WIDTHS[1]);
    const half = w / 2;
    // Every half metre along it: whether a path could be there.
    const pts = [];
    for (let i = 0; i < line.length - 1; i++) {
      const [ax, az] = line[i];
      const [bx, bz] = line[i + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 0.5));
      for (let k = 0; k < n; k++) pts.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n]);
    }
    pts.push(line[line.length - 1]);
    const boxes = otherTeeBoxes(L);
    const ok = pts.map(([x, z]) => trouble(L, x, z, half, 0, boxes) == null);
    // A metre short of anything it can't go on, so the smooth line through
    // the points kept can't swing onto it.
    const keep = ok.map((_, i) => ok.slice(Math.max(0, i - 2), i + 3).every(Boolean));
    let run = [];
    const flush = () => {
      if (run.length > 1) {
        let len = 0;
        for (let i = 1; i < run.length; i++) len += Math.hypot(run[i][0] - run[i - 1][0], run[i][1] - run[i - 1][1]);
        if (len >= minLength) {
          // Kept to a few points, the smooth curve through them can swing a
          // little off the line: where that takes it too close to sand or
          // water, kept closer to the line (more points) - a path the
          // designer laid down on a hole, carried onto hills, runs close to
          // its bunkers by design.
          for (const tol of [0.25, 0.1, 0.04]) {
            const p = cleanPath({ p: simplifyLine(run, tol), w, m: surface });
            if (p.p.length > MAX_POINTS) break;
            if (pathFits(L, p)) {
              out.push(p);
              break;
            }
          }
        }
      }
      run = [];
    };
    pts.forEach((q, i) => (keep[i] ? run.push(q) : flush()));
    flush();
  }
  return out;
}
