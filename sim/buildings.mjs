// The club's buildings: where the clubhouse stands, and what the chase
// camera keeps clear of. Pure; look/club.js draws them.
//
// One clubhouse design (look/club.js makeClubhouse) stands
//   - behind the practice greens' hole, in the gap left for it in their
//     ring of trees (sim/woods.mjs CLUBHOUSE_GAP; greenscene.js)
//   - past the last green of a designed course, where the "Clubhouse"
//     arrow points (sim/signs.mjs), beyond where a ball can finish and out
//     of the trees (clubhouseSpot).
// Each building joins the chase camera's keep-clear list (view.js
// keepClear) as upright cylinders, as tree crowns do (footprintClear).

import { makePath, nearest, surfaceAt, insideBlob } from "./course.mjs";
import { gapToPaths } from "./paths.mjs";

// The clubhouse (metres): the building, its terrace in front and the
// beds, benches and board before that; its eaves and ridge. Its own frame:
// the front wall's middle at the origin, facing +z.
export const CLUBHOUSE = { width: 18, depth: 10, eaves: 5.2, ridge: 8.6, terrace: 4.5, front: 8, flag: 9.5 };
// Its whole plot, in that frame: [x0, z0, x1, z1].
export const CLUBHOUSE_PLOT = [-CLUBHOUSE.width / 2 - 4, -CLUBHOUSE.depth - 1, CLUBHOUSE.width / 2 + 4, CLUBHOUSE.front];
// How far (metres) the plot keeps from a tree's trunk, and past the last
// green it stands at least this far beyond the green's edge.
export const CLUBHOUSE_CLEAR = { tree: 7, green: 40 };

const r2 = (v) => Math.round(v * 100) / 100;

// The keep-clear cylinders for a footprint (a polygon, [[x, z], ...], in
// whatever frame the camera works in) of a building whose top is `top`
// metres up: [{ x, z, r, top }], covering it - circles along its longer
// side, each as wide as the shorter, no wider than it needs.
export function footprintClear(poly, top) {
  if (!poly?.length) return [];
  // Its longest edge gives the long axis.
  let ax = 1;
  let az = 0;
  let best = -1;
  for (let i = 0; i < poly.length; i++) {
    const [x0, z0] = poly[i];
    const [x1, z1] = poly[(i + 1) % poly.length];
    const l = Math.hypot(x1 - x0, z1 - z0);
    if (l > best) {
      best = l;
      ax = (x1 - x0) / (l || 1);
      az = (z1 - z0) / (l || 1);
    }
  }
  // Its extent along and across that axis.
  let u0 = Infinity;
  let u1 = -Infinity;
  let v0 = Infinity;
  let v1 = -Infinity;
  for (const [x, z] of poly) {
    const u = x * ax + z * az;
    const v = -x * az + z * ax;
    u0 = Math.min(u0, u);
    u1 = Math.max(u1, u);
    v0 = Math.min(v0, v);
    v1 = Math.max(v1, v);
  }
  const across = (v1 - v0) / 2;
  const along = u1 - u0;
  const n = Math.max(1, Math.ceil(along / Math.max(2 * across, 1)));
  const step = along / n;
  // Each circle reaches the corners of its slice.
  const r = Math.hypot(step / 2, across) + 0.05;
  const vm = (v0 + v1) / 2;
  const out = [];
  for (let i = 0; i < n; i++) {
    const u = u0 + step * (i + 0.5);
    out.push({ x: r2(u * ax - vm * az), z: r2(u * az + vm * ax), r: r2(r), top: r2(top) });
  }
  return out;
}

// The plot's corners, placed at (x, z) turned `turn` (radians: its front,
// +z in its own frame, then faces (sin turn, cos turn) - as three.js turns
// an object about the upright, in the world's x and z).
export function plotCorners(x, z, turn, [x0, z0, x1, z1] = CLUBHOUSE_PLOT) {
  const c = Math.cos(turn);
  const s = Math.sin(turn);
  return [
    [x0, z0],
    [x1, z0],
    [x1, z1],
    [x0, z1],
  ].map(([u, v]) => [x + u * c + v * s, z - u * s + v * c]);
}

// The clubhouse's keep-clear cylinders, for its plot at (x, z) turned
// `turn` on ground `y` (world frame): the building, and its flagpole.
export function clubhouseClear(x, z, turn, y = 0) {
  const c = Math.cos(turn);
  const s = Math.sin(turn);
  const at = (u, v) => [x + u * c + v * s, z - u * s + v * c];
  const W = CLUBHOUSE.width / 2;
  const building = [at(-W, -CLUBHOUSE.depth), at(W, -CLUBHOUSE.depth), at(W, CLUBHOUSE.terrace), at(-W, CLUBHOUSE.terrace)];
  const [fx, fz] = at(-W - 2.5, CLUBHOUSE.terrace - 0.5);
  return [...footprintClear(building, y + CLUBHOUSE.ridge), { x: r2(fx), z: r2(fz), r: 1, top: r2(y + CLUBHOUSE.flag) }];
}

// Where the clubhouse stands past a designed course's last green, in the
// hole's frame: { at: [x, z], face: [fx, fz] } (its front turned to face
// that way - back towards the green), or null if nowhere is clear.
// Along the "Clubhouse" arrow's way from the end of the cart path if
// there's one (sim/signs.mjs signsFor's `arrow`), else straight on past
// the green; at least CLUBHOUSE_CLEAR.green beyond the green's edge, its
// plot clear of every tree's trunk, of water and sand, the green, the
// fairway and the path.
export function clubhouseSpot(L, arrow = null) {
  if (L.source === "map") return null;
  const path = makePath(L.path);
  const g = L.green;
  const reach = Math.max(g.rx ?? 0, g.rz ?? 0);
  const end = path.length ? nearest(path, g.x, g.z) : null;
  // Straight on past the green: the way the hole's line runs into it.
  let way = [1, 0];
  if (end && L.path.length >= 2) {
    const [ax, az] = L.path[L.path.length - 2];
    const l = Math.hypot(g.x - ax, g.z - az) || 1;
    way = [(g.x - ax) / l, (g.z - az) / l];
  }
  const ways = [];
  if (arrow?.dir) ways.push({ from: arrow.at, dir: arrow.dir });
  ways.push({ from: [g.x, g.z], dir: way });
  const trees = L.trees ?? [];
  const KEEP_OFF = new Set(["fairway", "tee", "bunker", "greenside", "waste", "water", "green", "fringe", "path"]);
  const clear = (x, z, turn) => {
    const corners = plotCorners(x, z, turn);
    // Far enough past the green's edge.
    if (corners.some(([cx, cz]) => insideBlob(g, cx, cz, CLUBHOUSE_CLEAR.green - 15))) return false;
    if (Math.hypot(x - g.x, z - g.z) < reach + CLUBHOUSE_CLEAR.green) return false;
    // Every corner and the middle on plain ground.
    for (const [cx, cz] of [...corners, [x, z]]) if (KEEP_OFF.has(surfaceAt(L, cx, cz, path))) return false;
    if ((L.water ?? []).some((w) => corners.some(([cx, cz]) => insideBlob(w, cx, cz, 3)))) return false;
    if (gapToPaths(L.paths, x, z, 16.01) <= 16) return false;
    // No tree in the plot or close round it.
    const R = Math.hypot(CLUBHOUSE_PLOT[2], CLUBHOUSE.depth) + CLUBHOUSE_CLEAR.tree;
    return !trees.some(([tx, tz]) => {
      if (Math.abs(tx - x) > R || Math.abs(tz - z) > R) return false;
      // In its own frame.
      const c = Math.cos(turn);
      const s = Math.sin(turn);
      const dx = tx - x;
      const dz = tz - z;
      const u = dx * c - dz * s;
      const v = dx * s + dz * c;
      const [x0, z0, x1, z1] = CLUBHOUSE_PLOT;
      const t = CLUBHOUSE_CLEAR.tree;
      return u > x0 - t && u < x1 + t && v > z0 - t && v < z1 + t;
    });
  };
  for (const { from, dir } of ways) {
    const across = [-dir[1], dir[0]];
    for (let d = 20; d <= 120; d += 5) {
      for (const o of [0, 8, -8, 16, -16, 24, -24, 32, -32]) {
        const x = from[0] + dir[0] * d + across[0] * o;
        const z = from[1] + dir[1] * d + across[1] * o;
        // Its front towards the green.
        const fx = g.x - x;
        const fz = g.z - z;
        const l = Math.hypot(fx, fz) || 1;
        const face = [fx / l, fz / l];
        // (Its plot's front, +z in its own frame, turned to face that way.)
        if (!clear(x, z, Math.atan2(face[0], face[1]))) continue;
        return { at: [r2(x), r2(z)], face: face.map(r2) };
      }
    }
  }
  return null;
}

// ---- Buildings on a course from a map ----------------------------------------------------

// A mapped course's building outlines (layout.buildings: polygons in the
// hole's frame, from OpenStreetMap) are raised: walls to their eaves, and
// a roof - pitched along the longer side of a long building, hipped on a
// squarer one, flat over an outline that isn't near a rectangle (an L, a
// courtyard). Heights from the outline's size (a shed, a house, a hall),
// or as the surface model measured them where the import has that
// (layout.buildingHeights, server/lidar.mjs). The course's largest
// building is its clubhouse: cream render and slate, the tallest class.
//
// None of it takes part in play: a ball goes through as through a tree.

// By footprint area (m²): eaves height, and the roof's rise per metre of
// half-width (a pitch).
export const BUILDING_SIZES = [
  { upTo: 40, eaves: 2.5 },
  { upTo: 150, eaves: 3 },
  { upTo: 400, eaves: 5.2 },
  { upTo: Infinity, eaves: 6.5 },
];
export const ROOF_PITCH = 0.7;
// Heights are kept within these (metres, to the ridge), measured or not.
export const BUILDING_RANGE = { low: 2.5, high: 16 };
export const WALLS = ["render", "brick", "stone"];
export const ROOFS = ["roofSlate", "roofTile"];

export function polygonArea(poly) {
  let a = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) a += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1];
  return Math.abs(a) / 2;
}

// The outline's oriented box: along its longest edge. { cx, cz, ax, az,
// length, width } - (ax, az) the long axis.
export function orientedBox(poly) {
  let best = null;
  for (let i = 0; i < poly.length; i++) {
    const [x0, z0] = poly[i];
    const [x1, z1] = poly[(i + 1) % poly.length];
    const l = Math.hypot(x1 - x0, z1 - z0);
    if (l < 1e-6) continue;
    const ax = (x1 - x0) / l;
    const az = (z1 - z0) / l;
    let u0 = Infinity;
    let u1 = -Infinity;
    let v0 = Infinity;
    let v1 = -Infinity;
    for (const [x, z] of poly) {
      const u = x * ax + z * az;
      const v = -x * az + z * ax;
      u0 = Math.min(u0, u);
      u1 = Math.max(u1, u);
      v0 = Math.min(v0, v);
      v1 = Math.max(v1, v);
    }
    const area = (u1 - u0) * (v1 - v0);
    if (!best || area < best.area - 1e-6) best = { area, ax, az, u0, u1, v0, v1 };
  }
  if (!best) return null;
  let { ax, az, u0, u1, v0, v1 } = best;
  // The long axis along the box's longer side.
  if (v1 - v0 > u1 - u0) {
    [ax, az] = [-az, ax];
    [u0, u1, v0, v1] = [v0, v1, -u1, -u0];
  }
  const um = (u0 + u1) / 2;
  const vm = (v0 + v1) / 2;
  return { cx: um * ax - vm * az, cz: um * az + vm * ax, ax, az, length: u1 - u0, width: v1 - v0, area: (u1 - u0) * (v1 - v0) };
}

// A height the surface model measured over a building: the 80th percentile
// of what stands above the ground in its outline (its ridge, not the odd
// chimney or aerial), or null with too few samples to trust.
export function measuredHeight(samples) {
  const s = samples.filter(Number.isFinite).sort((a, b) => a - b);
  if (s.length < 6) return null;
  const h = s[Math.min(s.length - 1, Math.floor(s.length * 0.8))];
  return h >= BUILDING_RANGE.low ? Math.round(Math.min(h, BUILDING_RANGE.high) * 10) / 10 : null;
}

// A small seeded hash of an outline, so a building keeps its colours.
function hashOf(poly) {
  let h = 0x811c9dc5;
  for (const [x, z] of poly) h = Math.imul(h ^ Math.round(x * 10), 16777619) ^ Math.round(z * 10);
  return h >>> 0;
}

// Each of a hole's buildings, ready to draw: [{ poly, area, box, eaves,
// ridge, roof: "pitched" | "hipped" | "flat", walls, roofColour,
// clubhouse, measured }]. largest: the area of the course's largest
// building (it's the clubhouse); by default this hole's own largest.
export function raiseBuildings(L, { largest = null } = {}) {
  const polys = (L.buildings ?? []).filter((p) => Array.isArray(p) && p.length >= 3);
  const areas = polys.map(polygonArea);
  const biggest = largest ?? Math.max(0, ...areas);
  return polys.flatMap((poly, i) => {
    const area = areas[i];
    if (area < 4) return [];
    const box = orientedBox(poly);
    if (!box) return [];
    const clubhouse = biggest > 0 && area >= biggest * 0.999;
    const size = BUILDING_SIZES.find((s) => area <= s.upTo);
    const fill = area / Math.max(box.area, 1e-6);
    const roof = fill < 0.85 ? "flat" : box.length / Math.max(box.width, 0.1) > 1.5 ? "pitched" : "hipped";
    let eaves = clubhouse ? Math.max(size.eaves, 5.2) : size.eaves;
    let rise = roof === "flat" ? 0.4 : Math.min((box.width / 2) * ROOF_PITCH, 5);
    // As measured, where the import has it: the ridge at that height, the
    // eaves below it by the roof's own rise.
    const m = L.buildingHeights?.[i];
    const measured = Number.isFinite(m) && m >= BUILDING_RANGE.low;
    if (measured) {
      const ridge = Math.min(m, BUILDING_RANGE.high);
      rise = Math.min(rise, ridge * 0.45);
      eaves = Math.max(2.2, ridge - rise);
    }
    const ridge = Math.min(eaves + rise, BUILDING_RANGE.high);
    const h = hashOf(poly);
    return [
      {
        poly,
        area: r2(area),
        box,
        eaves: r2(Math.min(eaves, ridge)),
        ridge: r2(ridge),
        roof,
        walls: clubhouse ? "render" : WALLS[(h >>> 7) % WALLS.length],
        roofColour: clubhouse ? "roofSlate" : ROOFS[(h >>> 13) % ROOFS.length],
        clubhouse,
        measured,
      },
    ];
  });
}

// The largest building's area over a whole course's holes (one outline
// can show on several holes: the same, measured the same).
export function largestBuilding(holes) {
  let a = 0;
  for (const h of holes ?? []) for (const p of h?.layout?.buildings ?? h?.buildings ?? []) if (Array.isArray(p) && p.length >= 3) a = Math.max(a, polygonArea(p));
  return a;
}
