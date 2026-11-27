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
import { holeFrame, polygonCentroid } from "./terrain.mjs";

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
// They stand in play: a ball comes off a wall or a roof (sim/solids.mjs,
// with roofAt below for the roof as it's drawn).
//
// What the map says of one, where it says it (layout.buildingLooks[i], from
// OpenStreetMap's roof:shape, building:colour and roof:colour - sim/
// osm.mjs buildingLook): { roof: "flat" | "pitched" | "hipped", walls,
// roofColour (a colour, "#rrggbb") } - each used in place of the guess.
// A real course's definition can add (tools/realcourse.mjs: its landmarks
// and its town) windows: false, for a building with none in its walls (a
// shed, a hoarding).

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
export const BUILDING_RANGE = { low: 2.5, high: 30 };
export const WALLS = ["render", "brick", "stone"];
export const ROOFS = ["roofSlate", "roofTile"];
export const ROOF_SHAPES = ["flat", "pitched", "hipped"];
// The least of its box an outline fills for a sloping roof to fit it - and,
// on a building beyond the hole's ground (only ever seen from afar, never
// played off), for a roof the map or the course's definition asks for to
// be built all the same (a landmark's hipped roof over a block a little
// short of its box: the tall red block behind the real links' 18th green
// fills 0.844 of it).
export const ROOF_FIT = 0.85;
export const FAR_ROOF_FIT = 0.8;
// A colour the map gave ("#rrggbb"), or null.
export const colourOf = (c) => (typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c) ? c.toLowerCase() : null);

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

// An outline's walls, each with the way it faces: out of the building.
// [{ a, b, len, out: [x, z] }] in the outline's own frame, whichever way
// round its corners run. (The walls were once all built facing in - seen
// from outside, the near wall wasn't drawn and the far one showed through
// from behind, its windows with it: the owner, 21 November 2026, "a few of
// your screen shots have gaps in the buildings".)
export function outlineWalls(poly) {
  let area = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) area += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1];
  // (Counter-clockwise in (x, z): the inside is on the left of each wall
  // as it runs, the outside on the right.)
  const turn = area > 0 ? 1 : -1;
  const walls = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len < 0.05) continue;
    walls.push({ a, b, len, out: [((b[1] - a[1]) / len) * turn, (-(b[0] - a[0]) / len) * turn] });
  }
  return walls;
}

// Whether a face at `at`, facing `out` (both [x, z]), can be seen from any
// of `eyes` ([[x, z], ...]): one of them is in front of it. A building
// beyond a hole's ground is only ever looked at from the hole (its
// corners, here), so its back walls and the far slope of its roof needn't
// be built at all ("most only need a front roof and a bit of the side of
// the building").
export const seenFrom = (eyes, at, out) => eyes.some(([x, z]) => (x - at[0]) * out[0] + (z - at[1]) * out[1] > 0);

// A hole's buildings beyond its own ground (sim/mapcourse.mjs BACKDROP:
// farBuildings, with their heights and looks beside them) as a layout
// raiseBuildings reads: the same houses, drawn past the hole's edge.
// (Its frame comes with it, so each keeps its colours: placeHash.)
export function farLayout(L) {
  return { source: L?.source, geo: L?.geo, far: true, buildings: L?.farBuildings ?? [], buildingHeights: L?.farBuildingHeights, buildingLooks: L?.farBuildingLooks, buildingMasses: L?.farBuildingMasses };
}

// Whether the surface model shows nothing standing where a building is
// mapped - a grandstand put up for a week and mapped, something since
// pulled down: enough of its outline measured (20 squares of it) and four
// fifths of that under a metre and a half. (server/lidar.mjs leaves such a
// building off the hole: it would be drawn, and stand in play, where
// there's only grass.)
export function nothingStands(samples) {
  const s = samples.filter(Number.isFinite).sort((a, b) => a - b);
  if (s.length < 20) return false;
  return s[Math.min(s.length - 1, Math.floor(s.length * 0.8))] < 1.5;
}

// A small seeded hash of an outline, so a building keeps its colours.
function hashOf(poly) {
  let h = 0x811c9dc5;
  for (const [x, z] of poly) h = Math.imul(h ^ Math.round(x * 10), 16777619) ^ Math.round(z * 10);
  return h >>> 0;
}

// Where a building stands on the course - not on the hole: one house is on
// several holes, each in its own frame - as a small hash, so it has the
// same colours from every hole it's seen from: its middle, metres east and
// north of the course's own (holeFrame), to PLACE_STEP. (It was the outline
// in the hole's frame: one house was render and tile from the 1st, brick
// and slate from the 18th.) Null for a layout with no frame (made up),
// where the outline's own hash serves.
export const PLACE_STEP = 2;
export function placeHash(L, poly) {
  const g = L?.geo;
  if (!Array.isArray(g?.tee) || !Number.isFinite(g.heading) || !poly?.length) return null;
  const [e, n] = holeFrame(g.tee, g.heading).toLocal(polygonCentroid(poly));
  let h = 0x811c9dc5;
  h = Math.imul(h ^ Math.round(e / PLACE_STEP), 16777619);
  h = Math.imul(h ^ Math.round(n / PLACE_STEP), 16777619);
  // (Mixed, so neighbours a step apart differ in every bit.)
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  return h >>> 0;
}

// ---- A building in its real masses ---------------------------------------------------------

// Where the survey's surface model covers a building, the import sorts
// what stands in its outline into oblong masses, each with the roof it
// shows (sim/masses.mjs buildingMasses): layout.buildingMasses[i] (and
// farBuildingMasses[i], beyond the hole's ground) - an array of masses, or
// null for a building raised whole from its outline as before.
// (A hipped one, and an octagon - eight walls under a tented roof rising to
// a point over its middle, its length the way across it flat to flat - only
// where a course's definition sets a building's masses by hand: tools/
// realsteps/handmasses.mjs. The survey's own sorting finds flat and pitched.)
export const MASS_ROOFS = ["flat", "pitched", "hipped", "octagon"];
// A mass as kept with a hole: [cx, cz, ax, az, length, width, eaves, ridge,
// roof (its place in MASS_ROOFS)] - its middle, the way its ridge runs (a
// flat one's longer side), its length along that and its width, metres up
// to its eaves and its ridge - and back.
export const packMass = (m) => [m.cx, m.cz, m.ax, m.az, m.length, m.width, m.eaves, m.ridge, Math.max(0, MASS_ROOFS.indexOf(m.roof))];
export function unpackMass(a) {
  if (!Array.isArray(a) || a.length < 9 || !a.every(Number.isFinite)) return null;
  const [cx, cz, ax, az, length, width, eaves, ridge, roof] = a;
  if (!(length > 0.5) || !(width > 0.5) || !(ridge >= eaves)) return null;
  return { cx, cz, ax, az, length, width, eaves, ridge, roof: MASS_ROOFS[roof] ?? "flat" };
}
// A mass's four corners (an octagon's eight), in its outline's frame.
export function massCorners(m) {
  const hl = m.length / 2;
  const hw = m.width / 2;
  const at = ([u, v]) => [m.cx + u * m.ax - v * m.az, m.cz + u * m.az + v * m.ax];
  if (m.roof === "octagon") {
    // (Flat to flat it's its length: a flat faces each way along and across it.)
    const r = hl / Math.cos(Math.PI / 8);
    return Array.from({ length: 8 }, (_, k) => at([r * Math.cos(Math.PI / 8 + (k * Math.PI) / 4), r * Math.sin(Math.PI / 8 + (k * Math.PI) / 4)]));
  }
  return [[-hl, -hw], [hl, -hw], [hl, hw], [-hl, hw]].map(at);
}
// How far out a spot (u along, v across its middle) is in an octagon, as a
// share of the way to its walls: 0 at its middle, 1 on them.
export const octagonOut = (u, v, half) => Math.max(Math.abs(u), Math.abs(v), (Math.abs(u) + Math.abs(v)) * Math.SQRT1_2) / Math.max(half, 0.1);
// A building's masses as kept, each read back: a list of them; an empty
// list for a building the survey showed is itself one flat-roofed mass
// (raised whole from its outline, under a flat roof); null for one it never
// read (raised as before).
export function massesOf(L, i) {
  const list = L?.buildingMasses?.[i];
  if (!Array.isArray(list)) return null;
  const out = list.map(unpackMass).filter(Boolean);
  return out.length || !list.length ? out : null;
}

// Each of a hole's buildings, ready to draw: [{ poly, area, box, eaves,
// ridge, roof: "pitched" | "hipped" | "flat", walls, roofColour,
// clubhouse, measured, of }]. largest: the area of the course's largest
// building (it's the clubhouse); by default this hole's own largest.
// A building the survey sorted into masses (massesOf) comes as one entry a
// mass - each an oblong with its own roof and heights, all in the
// building's colours - `of` the building's place in layout.buildings on
// each, `part` the mass's among its building's.
export function raiseBuildings(L, { largest = null } = {}) {
  const all = L.buildings ?? [];
  const areas = all.map((p) => (Array.isArray(p) && p.length >= 3 ? polygonArea(p) : 0));
  const biggest = largest ?? Math.max(0, ...areas);
  return all.flatMap((poly, i) => {
    const area = areas[i];
    if (area < 4) return [];
    const box = orientedBox(poly);
    if (!box) return [];
    const clubhouse = biggest > 0 && area >= biggest * 0.999;
    const size = BUILDING_SIZES.find((s) => area <= s.upTo);
    const fill = area / Math.max(box.area, 1e-6);
    const look = L.buildingLooks?.[i] ?? null;
    const h = placeHash(L, poly) ?? hashOf(poly);
    const dress = {
      walls: colourOf(look?.walls) ?? (clubhouse ? "render" : WALLS[(h >>> 7) % WALLS.length]),
      roofColour: colourOf(look?.roofColour) ?? (clubhouse ? "roofSlate" : ROOFS[(h >>> 13) % ROOFS.length]),
      clubhouse,
      of: i,
      ...(look?.windows === false ? { windows: false } : {}),
      // (How a real course's town is built - tools/realsteps/town.mjs: a
      // flat-topped house's top storey a slate mansard; stacks on its roofs.)
      ...(look?.mansard === true ? { mansard: true } : {}),
      ...(look?.chimneys === true ? { chimneys: true } : {}),
      // (A hall - a kirk, a church: tall round-headed windows, one storey.)
      ...(look?.hall === true ? { hall: true } : {}),
      // (Dormers in its pitched roofs, where a roof has a storey in it:
      // look/club.js DORMERS.)
      ...(look?.dormers === true ? { dormers: true } : {}),
    };
    const asked = ROOF_SHAPES.includes(look?.roof) ? look.roof : null;
    // In its masses, where the survey sorted it into them: each an oblong
    // under the roof it shows (a flat one where the map says the building's
    // roof is flat).
    const masses = massesOf(L, i);
    if (masses?.length) {
      return masses.map((m, part) => {
        const roof = asked === "flat" ? "flat" : m.roof;
        const ridge = Math.min(Math.max(m.ridge, BUILDING_RANGE.low), BUILDING_RANGE.high);
        return {
          poly: massCorners({ ...m, roof }),
          area: r2(roof === "octagon" ? 8 * (m.length / 2) ** 2 * Math.tan(Math.PI / 8) : m.length * m.width),
          box: { cx: m.cx, cz: m.cz, ax: m.ax, az: m.az, length: m.length, width: m.width, area: m.length * m.width },
          eaves: r2(roof === "flat" ? ridge : Math.min(Math.max(2.2, m.eaves), ridge)),
          ridge: r2(ridge),
          roof,
          ...dress,
          measured: true,
          part,
        };
      });
    }
    // Its roof: sloping only where the outline nearly fills its box (the
    // roof is built over the box: over an L or a T it would hang out past
    // the walls like a lid) - there, the shape the map asks for, or pitched
    // over a long box and hipped over a square one. Anything else is flat,
    // following the outline, whatever was asked.
    // (And flat where the survey showed it one flat-roofed mass: an empty
    // list of masses.)
    const fit = L.far && asked ? FAR_ROOF_FIT : ROOF_FIT;
    const roof = asked === "flat" || masses || fill < fit ? "flat" : (asked ?? (box.length / Math.max(box.width, 0.1) > 1.5 ? "pitched" : "hipped"));
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
    return [{ poly, area: r2(area), box, eaves: r2(Math.min(eaves, ridge)), ridge: r2(ridge), roof, ...dress, measured }];
  });
}

// How high a raised building's roof stands over (x, z), metres above the
// ground it stands on - as look/club.js makeBuildings draws it: a flat
// roof at its top; a pitched one from the eaves up to a ridge along the
// middle of its box; a hipped one the same, its ridge short of each end by
// the half-width; an octagon's from its eaves up to a point over its
// middle. (Asked inside its outline.)
export function roofAt(b, x, z) {
  if (b.roof === "flat") return b.ridge;
  const { cx, cz, ax, az, length, width } = b.box;
  const u = (x - cx) * ax + (z - cz) * az;
  const v = -(x - cx) * az + (z - cz) * ax;
  if (b.roof === "octagon") return b.eaves + (b.ridge - b.eaves) * Math.min(1, Math.max(0, 1 - octagonOut(u, v, length / 2)));
  const hw = Math.max(width / 2, 0.1);
  const across = 1 - Math.abs(v) / hw;
  const k = b.roof === "pitched" ? across : Math.min(across, (length / 2 - Math.abs(u)) / hw);
  return b.eaves + (b.ridge - b.eaves) * Math.min(1, Math.max(0, k));
}

// The largest building's area over a whole course's holes (one outline
// can show on several holes: the same, measured the same).
export function largestBuilding(holes) {
  let a = 0;
  for (const h of holes ?? []) for (const p of h?.layout?.buildings ?? h?.buildings ?? []) if (Array.isArray(p) && p.length >= 3) a = Math.max(a, polygonArea(p));
  return a;
}

// ---- One building, seen from several holes -------------------------------------------------

// The same building on two holes: its middle within `near` metres on the
// course, its area within `area` of the other's (each hole keeps the map's
// outline in its own frame, to the centimetre).
export const SAME_BUILDING = { near: 1, area: 0.02 };

// Where a hole's outline stands on the course: (poly) -> { e, n, area }
// (metres east and north of the course's middle; m²), or null for a hole
// with no frame.
export function onCourse(L) {
  const g = L?.geo;
  if (!Array.isArray(g?.tee) || !Number.isFinite(g.heading)) return null;
  const f = holeFrame(g.tee, g.heading);
  return (poly) => {
    const [e, n] = f.toLocal(polygonCentroid(poly));
    return { e, n, area: polygonArea(poly) };
  };
}
export const sameBuilding = (a, b, { near = SAME_BUILDING.near, area = SAME_BUILDING.area } = {}) =>
  Math.hypot(a.e - b.e, a.n - b.n) <= near && Math.abs(a.area - b.area) <= area * Math.max(a.area, b.area);

// Far copies of buildings as high as they stand. A building beyond a
// hole's ground is measured from the surface model alone, against the
// street round it (server/lidar.mjs farHeight) - which, for a block joined
// to its neighbours or a terrace, is their roofs: it comes back unmeasured
// and is drawn at the guess for its size (the real links' 21 m hotel block
// was 6.9 m high from four holes). Each such far copy takes the height the
// same building was measured at from another hole: on that hole's own
// ground first (against the LiDAR ground under it), else beyond it; else,
// where the caller has them (`tagged`: [{ e, n, area, height }] on the
// course), the height the map gives it. Far lists only: what stands in
// play is never changed. Returns the holes, each changed one a copy.
export function sameBuildingHeights(holes, { tagged = [] } = {}) {
  const known = [];
  for (const h of holes ?? []) {
    const L = h?.layout;
    const at = onCourse(L);
    if (!at) continue;
    for (const [list, heights, rank] of [["buildings", "buildingHeights", 2], ["farBuildings", "farBuildingHeights", 1]]) {
      (L[list] ?? []).forEach((p, i) => {
        const m = L[heights]?.[i];
        if (Array.isArray(p) && p.length >= 3 && Number.isFinite(m) && m >= BUILDING_RANGE.low) known.push({ ...at(p), height: m, rank });
      });
    }
  }
  for (const t of tagged) if (Number.isFinite(t?.height) && t.height >= BUILDING_RANGE.low) known.push({ e: t.e, n: t.n, area: t.area, height: Math.min(t.height, BUILDING_RANGE.high), rank: 0 });
  if (!known.length) return holes;
  return holes.map((h) => {
    const L = h?.layout;
    const at = onCourse(L);
    if (!at || !L.farBuildings?.length) return h;
    let heights = null;
    L.farBuildings.forEach((p, i) => {
      if (Number.isFinite(L.farBuildingHeights?.[i]) || !Array.isArray(p) || p.length < 3) return;
      const here = at(p);
      let best = null;
      for (const k of known) if (sameBuilding(here, k) && (!best || k.rank > best.rank)) best = k;
      if (!best) return;
      heights ??= L.farBuildings.map((_, j) => L.farBuildingHeights?.[j] ?? null);
      heights[i] = best.height;
    });
    return heights ? { ...h, layout: { ...L, farBuildingHeights: heights } } : h;
  });
}
