// A real course, rebuilt from OpenStreetMap shapes (osm.mjs) and open
// terrain (terrain.mjs), in the same course format the designer and play
// use - each hole in its own frame, with its real outline shapes, a height
// grid, and trees. Pure: the caller hands in a height function, so the
// server can do the fetching.
//
// A mapped hole's layout carries everything a generated one does (so the
// map, the designer and play all work on it), plus:
//   source: "map"
//   green.poly, fairways, tees, greens (the others nearby), bunkers[i].poly,
//   water[i].poly, woods, buildings     shapes in the hole's frame
//   terrain                  a packed height grid (terrain.mjs)
//   region                   the box the grid covers
//   pointTrees               trees mapped one by one or in rows
//   paths                    its cart paths, from the paths and tracks
//                            mapped round it (sim/paths.mjs)
// and once a LiDAR surface model has been applied (server/lidar.mjs):
//   lidarTrees               the real trees found in it: [x, z, height,
//                            crown radius, kind (0 pine, 1 broadleaf)]
//   canopy                   { x0, z0, cell, nx, nz, trees, cover, far }:
//                            1 m masks (terrain.mjs packMask) of where
//                            their crowns are and where the model covered,
//                            over the hole's box and a crown's reach round
//                            it; far, a coarse mask { ..., bare } of where
//                            it showed bare ground in the woods beyond
//   treesFrom: "lidar"       while the real trees are the ones shown

import { YARD } from "./flight.mjs";
import { COURSE_FORMAT, slugify, seeded, greenContours, blobRadius } from "./course.mjs";
import {
  project,
  unproject,
  holeFrame,
  makeGrid,
  packGrid,
  insidePolygon,
  distanceToEdge,
  polygonArea,
  polygonCentroid,
  polygonBounds,
  gridHeight,
  dsmDecides,
} from "./terrain.mjs";
import { modelTree } from "./lidartrees.mjs";
import { teeLane, inTeeLane, crownReach } from "./teelane.mjs";
import { pathsFromLines, gapToPaths } from "./paths.mjs";
import { wallsFromLines } from "./walls.mjs";
import { shapeOwners } from "./owners.mjs";

// Trees filled into a mapped wood keep this far off a cart path's edge.
const WOODS_OFF_PATHS = 2;

// How far round a hole its ground reaches (metres): beside the line, past
// the green and behind the tee.
const SIDE = 75;
const BEYOND = 45;
const BEHIND = 25;
// Trees scattered in mapped woods: one per this many metres, at most so many
// per hole (they're instanced, but not free).
const WOOD_SPACING = { light: 11, normal: 7.5, heavy: 5.5 };
const MAX_TREES = 1800;
const GRID_CELL = 2.5;

const round2 = (v) => Math.round(v * 100) / 100;
const roundPts = (poly) => poly.map(([x, z]) => [round2(x), round2(z)]);

function lineLength(pts) {
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return d;
}

// Distance from a point to a polyline.
function distanceToLine(line, x, z) {
  let best = Infinity;
  for (let i = 1; i < line.length; i++) {
    const ax = line[i - 1][0];
    const az = line[i - 1][1];
    const dx = line[i][0] - ax;
    const dz = line[i][1] - az;
    let t = ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1);
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
    const px = ax + dx * t - x;
    const pz = az + dz * t - z;
    const d2 = px * px + pz * pz;
    if (d2 < best) best = d2;
  }
  return Math.sqrt(best);
}

const parFor = (yards) => (yards <= 250 ? 3 : yards <= 480 ? 4 : 5);

// A shape's rough size and turn, so code written for generated blobs (the
// green's rx/rz, its facing) has something sensible to work with.
function blobFields(poly, facing) {
  const [cx, cz] = polygonCentroid(poly);
  const c = Math.cos(-facing);
  const s = Math.sin(-facing);
  let rx = 0;
  let rz = 0;
  for (const [x, z] of poly) {
    const u = (x - cx) * c - (z - cz) * s;
    const v = (x - cx) * s + (z - cz) * c;
    rx = Math.max(rx, Math.abs(u));
    rz = Math.max(rz, Math.abs(v));
  }
  return { x: round2(cx), z: round2(cz), rot: round2(facing), rx: round2(Math.max(rx, 1)), rz: round2(Math.max(rz, 1)) };
}

// Trees filling a wood, on a jittered grid.
function scatter(poly, spacing, rand, out, limit) {
  const b = polygonBounds(poly);
  for (let x = b.x0; x <= b.x1; x += spacing) {
    for (let z = b.z0; z <= b.z1; z += spacing) {
      if (out.length >= limit) return;
      const tx = x + (rand() - 0.5) * spacing * 0.8;
      const tz = z + (rand() - 0.5) * spacing * 0.8;
      if (insidePolygon(poly, tx, tz)) out.push([round2(tx), round2(tz), round2(0.85 + rand() * 0.7)]);
    }
  }
}

// A shape's outline can bring what it is with it, as `traits` on its list
// of points (a course made up and put on hills: sim/imaginary.mjs surveyOf
// - a pot bunker's depth and turf face, a waste area, a burn): kept on the
// outline wherever it's carried, and on the shape made from it.
const withTraits = (poly, from) => {
  if (from?.traits) poly.traits = from.traits;
  return poly;
};

// Does a shape come near the box at all?
const touches = (poly, r) => {
  const b = polygonBounds(poly);
  return b.x1 >= r.x0 && b.x0 <= r.x1 && b.z1 >= r.z0 && b.z0 <= r.z1;
};

// survey: parseOverpass() output. heightAt(lat, lon) -> metres or null.
// Returns { course, report, skipped } - report says what was found per hole,
// for the designer to show; skipped, the numbers of holes left out.
export function courseFromMap(survey, heightAt, { name = survey.name ?? "Mapped course", seed = 1, trees = "normal" } = {}) {
  if (!survey.holes.length) throw new Error("No holes are mapped for this course in OpenStreetMap (golf=hole lines from tee to green).");
  const b = survey.bounds;
  const origin = { lat: (b.north + b.south) / 2, lon: (b.east + b.west) / 2 };
  const toLocal = ([lat, lon]) => project(origin, lat, lon);
  const local = (list) => list.map((r) => withTraits(r.map(toLocal), r)).filter((p) => Math.abs(polygonArea(p)) > 1);
  const all = {
    greens: local(survey.greens),
    tees: local(survey.tees),
    fairways: local(survey.fairways),
    bunkers: local(survey.bunkers),
    water: local(survey.water),
    woods: local(survey.woods),
    buildings: local(survey.buildings ?? []),
    trees: survey.trees.map(toLocal),
    treeRows: survey.treeRows.map((l) => l.map(toLocal)),
    pins: survey.pins.map(toLocal),
    paths: (survey.paths ?? []).map((p) => ({ ...p, line: p.line.map(toLocal) })),
    walls: (survey.walls ?? []).map((w) => ({ ...w, line: w.line.map(toLocal) })),
  };
  const rand = seeded(seed);
  const report = [];
  // One course of up to 18: grounds with two courses map both, so keep the
  // first hole of each number and leave the rest (reported).
  const seen = new Set();
  const picked = [];
  const skipped = [];
  for (const h of survey.holes) {
    if (picked.length >= 18 || (h.ref != null && seen.has(h.ref))) skipped.push(h.ref);
    else {
      picked.push(h);
      if (h.ref != null) seen.add(h.ref);
    }
  }

  const holes = picked.map((h, i) => {
    const line = h.line.map(toLocal);
    const tee = line[0];
    const end = line[line.length - 1];
    const heading = Math.atan2(end[1] - tee[1], end[0] - tee[0]);
    const frame = holeFrame(tee, heading);
    const conv = (poly) => roundPts(poly.map(frame.toHole));
    const path = roundPts(line.map(frame.toHole));
    path[0] = [0, 0];
    const length = lineLength(path);
    const last = path[path.length - 1];

    // The box this hole's ground covers, in its own frame.
    let x0 = -BEHIND;
    let x1 = Math.max(...path.map((p) => p[0])) + BEYOND;
    let z0 = Math.min(...path.map((p) => p[1])) - SIDE;
    let z1 = Math.max(...path.map((p) => p[1])) + SIDE;
    const region = { x0: Math.floor(x0), x1: Math.ceil(x1), z0: Math.floor(z0), z1: Math.ceil(z1) };
    const near = (list) => list.map((p) => withTraits(conv(p), p)).filter((p) => touches(p, region));

    // Its green: the one the line ends in, or the nearest to its end.
    const greens = near(all.greens);
    let green = greens.find((g) => insidePolygon(g, last[0], last[1]));
    if (!green && greens.length) {
      green = greens[0];
      let minD = distanceToEdge(green, last[0], last[1]);
      for (let j = 1; j < greens.length; j++) {
        const d = distanceToEdge(greens[j], last[0], last[1]);
        if (d < minD) {
          minD = d;
          green = greens[j];
        }
      }
      if (distanceToEdge(green, ...last) > 40) green = null;
    }
    const approach = Math.atan2(last[1] - path[path.length - 2][1], last[0] - path[path.length - 2][0]);
    let greenShape;
    if (green) greenShape = { ...blobFields(green, approach), poly: green };
    else {
      // No green mapped: a round one where the line ends.
      const r = 12;
      const poly = [];
      for (let k = 0; k < 24; k++) poly.push([round2(last[0] + Math.cos((k / 24) * 2 * Math.PI) * r), round2(last[1] + Math.sin((k / 24) * 2 * Math.PI) * r)]);
      greenShape = { ...blobFields(poly, approach), poly };
    }
    // The pin: a mapped one on this green, or the middle of it.
    const pinMapped = all.pins.map(frame.toHole).find((p) => insidePolygon(greenShape.poly, p[0], p[1]));
    let pin = pinMapped ?? polygonCentroid(greenShape.poly);
    if (!insidePolygon(greenShape.poly, pin[0], pin[1])) pin = last;
    pin = [round2(pin[0]), round2(pin[1])];

    const yards = Math.round(length / YARD);
    const par = Math.min(5, Math.max(3, h.par ?? parFor(yards)));
    const shape = (poly) => ({ ...blobFields(poly, 0), poly, ...(poly.traits ?? {}) });
    // A mapped wall along a pond's bank or a bunker's edge is its wall
    // (sim/walls.mjs).
    const wallLines = all.walls.map((w) => ({ ...w, line: w.line.map(frame.toHole) }));
    const bunkers = wallsFromLines(near(all.bunkers).map(shape), wallLines, "bunker");
    const water = wallsFromLines(near(all.water).map(shape), wallLines, "water");
    const woods = near(all.woods);
    const buildings = near(all.buildings);

    // Trees: mapped ones, rows, and woods filled in.
    const treeList = [];
    for (const p of all.trees.map(frame.toHole)) {
      if (p[0] >= region.x0 && p[0] <= region.x1 && p[1] >= region.z0 && p[1] <= region.z1) treeList.push([round2(p[0]), round2(p[1]), round2(0.9 + rand() * 0.6)]);
    }
    for (const row of all.treeRows) {
      const pts = row.map(frame.toHole);
      for (let k = 1; k < pts.length; k++) {
        const [ax, az] = pts[k - 1];
        const [bx, bz] = pts[k];
        const n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / 6));
        for (let j = 0; j < n; j++) {
          const t = j / n;
          const x = ax + (bx - ax) * t;
          const z = az + (bz - az) * t;
          if (x >= region.x0 && x <= region.x1 && z >= region.z0 && z <= region.z1) treeList.push([round2(x), round2(z), round2(0.9 + rand() * 0.5)]);
        }
      }
    }
    const pointCount = treeList.length;
    const spacing = WOOD_SPACING[trees] ?? WOOD_SPACING.normal;
    for (const w of woods) scatter(w, spacing, rand, treeList, MAX_TREES);
    // Keep trees off the playing surfaces and out of water.
    // Where the map leaves a hole's outline thin, it's filled in from the
    // hole's own line (outlineGaps): a fairway down a par 4 or 5 with none
    // mapped along it, and a tee where none is mapped at its start.
    const filled = outlineGaps({ path, length, par, fairways: near(all.fairways), tees: near(all.tees) });
    const fairways = filled.fairways;
    const tees = filled.tees;
    // Its cart paths: the mapped paths near it, cut to its ground and off
    // its greens, tees, sand and water.
    const paths = pathsFromLines(
      { source: "map", region, green: greenShape, greens: greens.filter((g) => g !== green), tees, bunkers, water },
      all.paths
        .map((p) => ({ ...p, line: p.line.map(frame.toHole) }))
        .filter((p) => p.line.some(([x, z]) => x >= region.x0 - 10 && x <= region.x1 + 10 && z >= region.z0 - 10 && z <= region.z1 + 10)),
    );
    const clear = (x, z) =>
      !greens.some((g) => insidePolygon(g, x, z) || distanceToEdge(g, x, z) < 4) &&
      !fairways.some((f) => insidePolygon(f, x, z)) &&
      !tees.some((t) => insidePolygon(t, x, z)) &&
      !water.some((w) => insidePolygon(w.poly, x, z)) &&
      !bunkers.some((bk) => insidePolygon(bk.poly, x, z));
    // Trees mapped one by one (or in rows) are kept apart from those filled
    // into woods, so the woods can be filled again at another density.
    // And none in the lane from the tee to the fairway (teelane.mjs).
    const lane = teeLane({ path, par, fairways, source: "map" }, { insideFairway: (x, z) => fairways.some((f) => insidePolygon(f, x, z)) });
    const open = (t) => !inTeeLane(lane, t[0], t[1], crownReach(t));
    const pointTrees = treeList.slice(0, pointCount).filter((t) => clear(t[0], t[1]) && open(t));
    const kept = [...pointTrees, ...treeList.slice(pointCount).filter((t) => clear(t[0], t[1]) && open(t) && gapToPaths(paths, t[0], t[1], WOODS_OFF_PATHS + 0.01) > WOODS_OFF_PATHS)];

    // Ground heights over the whole box.
    const grid = makeGrid({ x0: region.x0, z0: region.z0, x1: region.x1, z1: region.z1, cell: GRID_CELL }, (x, z) => {
      const p = unproject(origin, ...frame.toLocal([x, z]));
      return heightAt(p.lat, p.lon);
    });
    // Heights from the tee: the tee is at 0, wherever the course is.
    const teeHeight = gridHeight(grid, 0, 0);
    for (let k = 0; k < grid.h.length; k++) grid.h[k] -= teeHeight;

    const number = h.ref ?? i + 1;
    report.push({
      number,
      par,
      yards,
      green: !!green,
      fairways: fairways.length,
      tees: tees.length,
      bunkers: bunkers.length,
      water: water.length,
      trees: kept.length,
      paths: paths.length,
      walls: [...bunkers, ...water].filter((sh) => sh.wall).length,
      fromWoods: woods.length > 0,
      outlined: filled.added,
      rise: round2(
        (() => {
          const g = grid;
          const at = (x, z) => g.h[Math.min(g.nz - 1, Math.max(0, Math.round((z - g.z0) / g.cell))) * g.nx + Math.min(g.nx - 1, Math.max(0, Math.round((x - g.x0) / g.cell)))];
          return at(pin[0], pin[1]) - at(0, 0);
        })(),
      ),
    });

    const layout = {
      number,
      par,
      yards,
      si: h.handicap ?? null,
      length,
      source: "map",
      path,
      tee: { x: 0, z: 0, heading: Math.atan2(path[1][1], path[1][0]) },
      green: greenShape,
      greens: greens.filter((g) => g !== green),
      pin,
      contours: [],
      fairways,
      tees,
      bunkers,
      water,
      woods,
      buildings,
      trees: kept,
      pointTrees,
      ...(paths.length ? { paths } : {}),
      region,
      terrain: packGrid(grid),
      // What generated holes use for the fairway and rough; a mapped hole
      // has real shapes instead.
      fairway: { from: 0, to: 0, half: 0, phase: 0 },
      treeLine: SIDE - 10,
      geo: { origin, tee, heading, teeHeight: round2(teeHeight) },
      // What the map left out and was outlined from the hole's line.
      ...(filled.added.length ? { outlined: filled.added } : {}),
    };
    const spec = { number, par, yards, si: layout.si, seed: Math.floor(rand() * 2 ** 31), options: { trees }, source: "map" };
    return { spec, layout };
  });

  const course = {
    format: COURSE_FORMAT,
    id: slugify(name),
    name: String(name).trim() || "Mapped course",
    created: new Date().toISOString(),
    source: { kind: "osm", origin },
    holes,
  };
  // What each hole has of its own: the greens, tees, fairways, sand and
  // water of holes nearby in its box are theirs (owners.mjs), and not
  // counted as its own.
  const places = holes.map((h) => ({ x: h.layout.geo.tee[0], z: h.layout.geo.tee[1], heading: h.layout.geo.heading }));
  holes.forEach((h, i) => {
    const own = shapeOwners(course, i, { places });
    const mine = (list) => own[list].filter((j) => j === i).length;
    let theirs = 0;
    for (let k = 0; k < OWNED_LISTS.length; k++) {
      const list = own[OWNED_LISTS[k]];
      for (let m = 0; m < list.length; m++) {
        if (list[m] !== i) theirs++;
      }
    }
    Object.assign(report[i], { fairways: mine("fairways"), tees: mine("tees"), bunkers: mine("bunkers"), water: mine("water"), others: theirs });
  });
  return { course, report, skipped };
}
const OWNED_LISTS = ["greens", "tees", "fairways", "bunkers", "water"];

// ---- Filling in what the map leaves out -------------------------------------------------

// A strip `half` metres either side of a line, from `from` to `to` metres
// along it, as a polygon.
export function corridor(path, from, to, half) {
  const cum = [0];
  for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  const at = (s) => {
    let i = 1;
    while (i < path.length - 1 && cum[i] < s) i++;
    const a = path[i - 1];
    const b = path[i];
    const seg = cum[i] - cum[i - 1] || 1;
    const t = Math.min(1, Math.max(0, (s - cum[i - 1]) / seg));
    const dx = (b[0] - a[0]) / seg;
    const dz = (b[1] - a[1]) / seg;
    return { p: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], dir: [dx, dz] };
  };
  const left = [];
  const right = [];
  for (let s = from; s <= to + 0.01; s += Math.max(3, (to - from) / 40)) {
    const { p, dir } = at(s);
    // Narrower at its ends, as a fairway is.
    const k = Math.min(1, (s - from) / 25, (to - s) / 20);
    const w = half * (0.6 + 0.4 * Math.max(0, k));
    left.push([round2(p[0] + dir[1] * w), round2(p[1] - dir[0] * w)]);
    right.push([round2(p[0] - dir[1] * w), round2(p[1] + dir[0] * w)]);
  }
  return [...left, ...right.reverse()];
}

// A hole's fairways and tees with what the map left out filled in from its
// line: a fairway along a par 4 or 5 with none mapped crossing its line
// (from where a drive lands to short of the green), a tee at the start of
// its line with none mapped there. Returns { fairways, tees, added: [what
// was filled in] }.
export function outlineGaps({ path, length, par, fairways = [], tees = [] }) {
  const added = [];
  let fw = fairways;
  const onLine = (poly) => path.some(([x, z]) => insidePolygon(poly, x, z)) || corridor(path, 0, length, 0.01).some(([x, z]) => insidePolygon(poly, x, z));
  if (par > 3 && length > 200 && !fairways.some(onLine)) {
    fw = [...fairways, corridor(path, Math.min(150, length * 0.35), length - 30, 16)];
    added.push("fairway");
  }
  let te = tees;
  if (!tees.some((t) => insidePolygon(t, 0, 0) || distanceToEdge(t, 0, 0) < 15)) {
    te = [...tees, [[-5, -4], [5, -4], [5, 4], [-5, 4]]];
    added.push("tee");
  }
  return { fairways: fw, tees: te, added };
}

// ---- Reworking a mapped hole --------------------------------------------------------

export const MAPPED_OPTIONS = {
  trees: { none: "None", light: "Light", normal: "Normal", heavy: "Heavy", lidar: "Real trees (LiDAR)" },
  contours: { none: "Real ground only", gentle: "Add gentle slopes", moderate: "Add moderate slopes", severe: "Add severe slopes" },
};

// Somewhere a tree can't stand on a mapped hole: a green (or just off it),
// fairway, tee, water or sand.
function onPlay(layout, x, z) {
  return (
    [layout.green.poly, ...(layout.greens ?? [])].some((g) => insidePolygon(g, x, z) || distanceToEdge(g, x, z) < 4) ||
    (layout.fairways ?? []).some((f) => insidePolygon(f, x, z)) ||
    (layout.tees ?? []).some((t) => insidePolygon(t, x, z)) ||
    layout.water.some((w) => insidePolygon(w.poly, x, z)) ||
    layout.bunkers.some((b) => insidePolygon(b.poly, x, z)) ||
    gapToPaths(layout.paths, x, z, WOODS_OFF_PATHS + 0.01) <= WOODS_OFF_PATHS
  );
}

// How near the water a real tree stands to be taken for a willow (metres;
// as courseplay.mjs has it for a planted one).
const WILLOW_WATER = 14;

// The trees a mapped hole shows for a choice of MAPPED_OPTIONS.trees: its
// single mapped trees and rows plus its woods filled at that density; or,
// for "lidar", the real trees found in a LiDAR surface model wherever it
// covered the hole, and the mapped and filled ones (at normal density)
// only where it didn't - nor on the bare ground it saw in the woods
// beyond (terrain.mjs dsmDecides).
export function treesFor(layout, choice, rand) {
  if (choice === "none") return [];
  const real = choice === "lidar" && layout.lidarTrees && layout.canopy;
  const spacing = WOOD_SPACING[real ? "normal" : choice] ?? WOOD_SPACING.normal;
  const woods = [];
  for (const w of layout.woods ?? []) scatter(w, spacing, rand, woods, MAX_TREES);
  const lane = teeLane(layout, { insideFairway: (x, z) => (layout.fairways ?? []).some((f) => insidePolygon(f, x, z)) });
  const open = (t) => !inTeeLane(lane, t[0], t[1], crownReach(t));
  const list = [...(layout.pointTrees ?? []), ...woods.filter(([x, z]) => !onPlay(layout, x, z))].filter(open);
  if (!real) return list;
  // (A low, spreading one by the water drawn as a weeping willow.)
  const byWater = (x, z) => (layout.water ?? []).some((w) => insidePolygon(w.poly, x, z) || distanceToEdge(w.poly, x, z) < WILLOW_WATER);
  return [...layout.lidarTrees.map((t) => modelTree(t, byWater(t[0], t[1]))).filter(open), ...list.filter(([x, z]) => !dsmDecides(layout.canopy, x, z))];
}

// The simple changes a mapped hole allows, keeping its real shapes and
// ground: { par, si, trees, contours, pin: "move" }. Returns a new course.
export function reworkMappedHole(course, index, changes = {}) {
  const old = course.holes[index];
  const spec = { ...old.spec, options: { ...old.spec.options } };
  const layout = { ...old.layout };
  const rand = seeded((changes.seed ?? spec.seed ?? 1) + index * 7919);
  if (changes.par) spec.par = layout.par = Math.min(5, Math.max(3, changes.par));
  if ("si" in changes) spec.si = layout.si = changes.si ?? null;
  if (changes.trees) {
    // Real trees only where a surface model found some.
    const choice = changes.trees === "lidar" && !layout.lidarTrees ? "normal" : changes.trees;
    spec.options.trees = choice;
    layout.trees = treesFor(layout, choice, rand);
    // The ground under real crowns plays as trees only while they're shown.
    if (choice === "lidar") layout.treesFrom = "lidar";
    else delete layout.treesFrom;
  }
  if (changes.pin === "move") {
    // Somewhere on the green, a sensible way in from its edge.
    const g = layout.green;
    for (let k = 0; k < 40; k++) {
      const phi = rand() * Math.PI * 2;
      const r = (0.15 + rand() * 0.5) * blobRadius(g, phi - (g.rot ?? 0));
      const p = [g.x + Math.cos(phi) * r, g.z + Math.sin(phi) * r];
      if (insidePolygon(g.poly, ...p) && distanceToEdge(g.poly, ...p) > 3) {
        layout.pin = [round2(p[0]), round2(p[1])];
        break;
      }
    }
  }
  if (changes.contours || changes.pin === "move") {
    const level = changes.contours ?? spec.options.contours ?? "none";
    spec.options.contours = level;
    layout.contours = level === "none" ? [] : greenContours(rand, layout.green, layout.pin, level, { mapped: true });
  }
  const holes = course.holes.slice();
  holes[index] = { spec, layout };
  return { ...course, holes };
}

