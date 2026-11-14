// The whole course on one map (the owner: "make the course designer 1 big
// map that stitches together so you lay out the 18 holes, as they would be
// in the OpenStreetMap or LiDAR positions"): each hole's shapes on the
// course's own ground, from where the hole is - a mapped course's (or one
// on made-up hills) where its holes really are, a designed one's where its
// routing puts them, which can be dragged and turned on the map. Pure:
// coursewide.js draws it.

import { blobOutline } from "./course.mjs";
import { causeways, causewayOutline } from "./causeway.mjs";
import { coursePlaces, toCourse, fairwayOutline, placeHillHole } from "./imaginary.mjs";
import { courseOwners, ownShapesOnly, separateHole } from "./owners.mjs";
import { CLEARANCE, END_ALLOWANCE, clearanceFor, measuredLine, lineGap, lineLength as length } from "./routing.mjs";

// A hole's shapes in its own frame: { fairways, greens, tees, bunkers,
// water, woods, path, pin, causeways } - polygons as [[x, z]...]. (causeways:
// an island green's way to land, fairway over the water - sim/causeway.mjs.)
export function holeShapes(L) {
  const ways = causeways(L).map((c) => causewayOutline(c, 8));
  if (L.source === "map") {
    return {
      fairways: L.fairways ?? [],
      greens: L.green?.poly ? [L.green.poly] : [blobOutline(L.green, 40)],
      tees: L.tees ?? [],
      bunkers: (L.bunkers ?? []).map((b) => b.poly ?? blobOutline(b, 24)),
      water: (L.water ?? []).map((w) => w.poly ?? blobOutline(w, 32)),
      woods: L.woods ?? [],
      path: L.path,
      pin: L.pin,
      causeways: ways,
    };
  }
  const fw = fairwayOutline(L);
  // (And any added by hand: holeedits "a+".)
  return {
    fairways: [...(fw ? [fw] : []), ...(L.extraFairways ?? []).map((a) => blobOutline(a, 32))],
    greens: [blobOutline(L.green, 40)],
    tees: [[[-6, -4], [6, -4], [6, 4], [-6, 4]]],
    bunkers: (L.bunkers ?? []).map((b) => blobOutline(b, 24)),
    water: (L.water ?? []).map((w) => blobOutline(w, 32)),
    woods: [],
    path: L.path,
    pin: L.pin,
    causeways: ways,
  };
}

// Every hole's shapes on the course's ground ([east, north] metres), and
// the bounds of them all: { holes: [{ number, place, shapes }], bounds:
// { x0, z0, x1, z1 } }. places: each hole's place, if not the course's own
// (a drag under way). A hole from the map shows only its own shapes: the
// neighbours' its map has too are drawn with their own holes (owners.mjs).
export function courseShapes(course, places = coursePlaces(course)) {
  let x0 = Infinity;
  let z0 = Infinity;
  let x1 = -Infinity;
  let z1 = -Infinity;
  const owners = courseOwners(course);
  const holes = (course?.holes ?? []).map((h, i) => {
    const place = places[i];
    const local = holeShapes(ownShapesOnly(h.layout, owners[i], i));
    const on = (pts) =>
      pts.map((p) => {
        const q = toCourse(place, p);
        x0 = Math.min(x0, q[0]);
        z0 = Math.min(z0, q[1]);
        x1 = Math.max(x1, q[0]);
        z1 = Math.max(z1, q[1]);
        return q;
      });
    const shapes = {};
    for (const k of ["fairways", "greens", "tees", "bunkers", "water", "woods"]) shapes[k] = local[k].map(on);
    shapes.path = on(local.path);
    shapes.pin = on([local.pin ?? local.path.at(-1)])[0];
    return { number: h.spec?.number ?? i + 1, place, shapes };
  });
  if (!holes.length) return { holes, bounds: { x0: 0, z0: 0, x1: 1, z1: 1 } };
  return { holes, bounds: { x0, z0, x1, z1 } };
}

// Distance from [x, z] to a polyline.
function lineDistance(line, x, z) {
  let best = Infinity;
  for (let i = 1; i < line.length; i++) {
    const ax = line[i - 1][0];
    const az = line[i - 1][1];
    const dx = line[i][0] - ax;
    const dz = line[i][1] - az;
    const len2 = dx * dx + dz * dz || 1;
    let t = ((x - ax) * dx + (z - az) * dz) / len2;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
    const px = ax + dx * t - x;
    const pz = az + dz * t - z;
    const d2 = px * px + pz * pz;
    if (d2 < best) best = d2;
  }
  return Math.sqrt(best);
}

// Which hole a spot on the map is on: the index of the hole whose line is
// nearest, if within `reach` metres; -1 if none.
export function holeAt(shapes, x, z, reach = 40) {
  let best = -1;
  let d = reach;
  shapes.holes.forEach((h, i) => {
    const e = lineDistance(h.shapes.path, x, z);
    if (e < d) {
      d = e;
      best = i;
    }
  });
  return best;
}

// Whether a course's holes can be moved on the map: a designed course's
// can (its routing), and one on made-up hills (each moved hole's ground
// made again where it goes); a real course from the map's are where they
// really are.
export const isHills = (course) => course?.source?.kind === "imaginary";
export const canMoveHoles = (course) => isHills(course) || !(course?.holes ?? []).some((h) => h.layout?.source === "map");

// A course with hole i moved (dx, dz metres) or turned (by `turn` radians
// about its tee) on the map: a designed course's kept in course.routing,
// one on hills with the hole's ground made again where it goes.
export function moveHole(course, i, { dx = 0, dz = 0, turn = 0 } = {}) {
  const places = coursePlaces(course);
  const q = places[i];
  if (!q || !canMoveHoles(course)) return course;
  const place = { x: round1(q.x + dx), z: round1(q.z + dz), heading: Math.round((q.heading + turn) * 1000) / 1000 };
  // (Its copies in the holes round it, and theirs in it, let go first:
  // owners.mjs separateHole.)
  if (isHills(course)) return placeHillHole(separateHole(course, i), i, place);
  return { ...course, routing: places.map((p, k) => (k === i ? place : p)) };
}

// ---- Holes that cross ---------------------------------------------------------------

// How close two holes' lines may come, and the measure itself, are the
// routing's (routing.mjs): a course laid out by itself never crosses.
export { CLEARANCE, END_ALLOWANCE, clearanceFor };

// Two holes' pair key, smaller first: "3-7" (1-based, as numbered).
export const pairKey = (a, b) => (a < b ? `${a + 1}-${b + 1}` : `${b + 1}-${a + 1}`);

// The holes that cross, or come closer than CLEARANCE: [{ a, b, key, d,
// at, ok }] (a < b, hole indexes; ok: crossing on purpose - the pair is in
// course.crossOk). shapes: courseShapes of the course (or as being dragged).
export function crossings(course, shapes = courseShapes(course)) {
  const ok = new Set(course?.crossOk ?? []);
  // Short holes (a par 3 course's, a chip and putt's) are kept apart and
  // let off at their ends in proportion: a 30 m hole can't be 45 m from
  // its neighbour all along, nor lose 25 m off each end.
  const lens = shapes.holes.map((h) => length(h.shapes.path));
  const lines = shapes.holes.map((h, i) => measuredLine(h.shapes.path, lens[i]));
  const out = [];
  for (let a = 0; a < lines.length; a++) {
    for (let b = a + 1; b < lines.length; b++) {
      if (lines[a].length < 2 || lines[b].length < 2) continue;
      const g = lineGap(lines[a], lines[b]);
      if (g.d < clearanceFor(lens[a], lens[b])) out.push({ a, b, key: pairKey(a, b), d: Math.round(g.d), at: g.at, ok: ok.has(pairKey(a, b)) });
    }
  }
  return out;
}

// The crossings hole i is in that aren't on purpose.
export const clashesOf = (course, i, shapes) => crossings(course, shapes).filter((c) => !c.ok && (c.a === i || c.b === i));

// A pair let cross (true) or kept apart again (false).
export function allowCrossing(course, key, on = true) {
  const set = new Set(course.crossOk ?? []);
  if (on) set.add(key);
  else set.delete(key);
  const crossOk = [...set].sort();
  const out = { ...course, crossOk };
  if (!crossOk.length) delete out.crossOk;
  return out;
}

// Hole i dropped after a drag from `from` to `to` (places): where it can
// go without crossing a hole it isn't let cross - `to` if clear, else the
// nearest clear spot back along the drag, else where it was. Returns {
// place, slid: true when it had to come back }.
export function clearSpot(course, i, from, to) {
  const placesAt = (p) => coursePlaces(course).map((q, k) => (k === i ? p : q));
  // Crossings it was already in don't stop it (it may be on its way out of
  // one); only new ones do.
  const keys = (p) => clashesOf(course, i, courseShapes(course, placesAt(p))).map((c) => c.key);
  const had = new Set(keys(from));
  const clear = (p) => keys(p).every((k) => had.has(k));
  if (clear(to)) return { place: to, slid: false };
  for (let k = 1; k <= 20; k++) {
    const t = 1 - k / 20;
    const p = { x: from.x + (to.x - from.x) * t, z: from.z + (to.z - from.z) * t, heading: from.heading + (to.heading - from.heading) * t };
    if (clear(p)) return { place: p, slid: true };
  }
  return { place: from, slid: true };
}

// The crossings not on purpose pushed apart: for each, the smallest move
// or turn of either hole (out to 400 m, or a quarter turn) that clears it
// without making a new one. Holes of a real course from the map aren't
// moved. Returns { course, left: how many crossings are still there }.
export function untangle(course, { rounds = 30 } = {}) {
  const bad = (c) => crossings(c).filter((x) => !x.ok);
  if (!canMoveHoles(course)) return { course, left: bad(course).length };
  let c = course;
  const tries = [];
  for (const dist of [20, 40, 60, 90, 120, 160, 210, 270, 340, 400]) {
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * 2 * Math.PI;
      tries.push({ dx: Math.cos(a) * dist, dz: Math.sin(a) * dist, turn: 0, cost: dist });
    }
  }
  for (const turn of [0.15, -0.15, 0.3, -0.3, 0.5, -0.5, 0.8, -0.8]) tries.push({ dx: 0, dz: 0, turn, cost: Math.abs(turn) * 150 });
  tries.sort((a, b) => a.cost - b.cost);
  for (let n = 0; n < rounds; n++) {
    const now = bad(c);
    if (!now.length) break;
    const x = now[0];
    let best = null;
    for (const i of [x.b, x.a]) {
      for (const t of tries) {
        if (best && t.cost >= best.cost) break;
        // Its place moved, worked out on the routing before anything's
        // made again (a hole on hills is only rebuilt for the move kept).
        const places = coursePlaces(c).map((q, k) => (k === i ? { x: q.x + t.dx, z: q.z + t.dz, heading: q.heading + t.turn } : q));
        const after = crossings(c, courseShapes(c, places)).filter((y) => !y.ok);
        if (after.length < now.length && !after.some((y) => y.key === x.key)) best = { i, t, cost: t.cost };
      }
    }
    if (!best) break;
    c = moveHole(c, best.i, best.t);
  }
  return { course: c, left: bad(c).length };
}

const round1 = (v) => Math.round(v * 10) / 10;
