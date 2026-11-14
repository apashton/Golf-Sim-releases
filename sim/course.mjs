// Courses from scorecards: each hole's par and length turned into a playable
// layout - a centreline with any dog-legs, a fairway, a green with slopes and
// a pin, bunkers, water and trees.
//
// Frame for a hole: the tee at (0, 0), x forward along the tee's line, z to
// the golfer's right, in metres (the same as the rest of the physics).
// A hole is stored as its spec (par, yards, options, seed) and the geometry
// generated from it, so a saved course replays exactly even if the generator
// changes later.
//
// Pure functions, shared by the designer, the play mode and the tests.

import { shapeHazards } from "./hazardshapes.mjs";
import { YARD } from "./flight.mjs";
import { greenGradient, tierRise } from "./putting.mjs";
import { insidePolygon, distanceToEdge, insideOutline, nearOutline, beyondOutline, polygonCentroid, polygonBounds, maskAt, dsmDecides } from "./terrain.mjs";
import { onPath, onVerge, generatePath, treesOffPaths, pathLine, validPath, reachOf, VERGE } from "./paths.mjs";
import { lineNoise } from "./woods.mjs";
import { clearTeeLane } from "./teelane.mjs";
import { defaultWall } from "./walls.mjs";
import { brookShape, burnBrook, brookBed } from "./brooks.mjs";
import { strategicHole } from "./architect.mjs";
import { causeways, causewayPast, causewayBounds, onCauseway } from "./causeway.mjs";
import { fingerOffset, fingerReach, localAngle, fingerBunker, FINGERED } from "./fingers.mjs";
import { crossRow, teeRow, CROSS } from "./crossbunkers.mjs";
import { linksWaste } from "./wastearea.mjs";
import { mulberry32 } from "./mathutil.mjs";

export const COURSE_FORMAT = 1;

// ---- Randomness and shapes ---------------------------------------------------

export function seeded(seed) {
  return mulberry32(seed);
}

export function newSeed() {
  return Math.floor(Math.random() * 2 ** 31);
}

// What a course's lay-out and look are seeded from - its routing, each
// hole's country, its horizon: its id, or its name - or, for an exact copy
// of another course, seedAs, the id of the course it's a copy of, so it's
// laid out and dressed just as that.
export const seedName = (course) => String(course?.seedAs ?? course?.id ?? course?.name ?? "");

// A shape's edge reshaped by hand (the owner, 22 October 2026, of a pond:
// "Be able to put marks on the water and physically change the shape of
// the water"): EDGE_MARKS marks evenly round it, each pushing its edge out
// or pulling it in along its own line from the middle - shape.edge, a size
// for each against the shape as made (1: as it was), within EDGE_RANGE -
// and the edge between them a smooth loop through them (edgeLoop). Along
// lines from the middle, so the shape's still one that every way out from
// its middle crosses once (insideBlob, insideDepth, a pond's bank).
export const EDGE_MARKS = 12;
export const EDGE_RANGE = [0.35, 2.5];
// A smooth loop through sizes round a shape (Catmull-Rom, wrapping round):
// at local angle phi. (The green's handles too: holeedits/green.mjs.)
export function edgeLoop(h, phi) {
  const n = h.length;
  const t = ((((phi / (Math.PI * 2)) % 1) + 1) % 1) * n;
  const i = Math.floor(t);
  const u = t - i;
  const p0 = h[(i - 1 + n) % n];
  const p1 = h[i % n];
  const p2 = h[(i + 1) % n];
  const p3 = h[(i + 2) % n];
  return 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
}
// How much a shape's marks push its edge out at local angle phi.
const edgeAt = (shape, phi) => (shape.edge ? Math.min(EDGE_RANGE[1] * 1.15, Math.max(EDGE_RANGE[0] * 0.85, edgeLoop(shape.edge, phi))) : 1);
// The furthest its marks push it out (1 with none): for anything that
// boxes a shape by its size.
export const edgeReach = (shape) => (shape?.edge ? Math.max(1, ...shape.edge) * 1.08 : 1);

// An organic outline: an ellipse (rx along its own axis, rz across) with a
// couple of gentle lobes - bent round an arc if it has a `bend` (a bunker
// curving round a green: sim/hazardshapes.mjs). Returns the radius at local
// angle phi.
export function blobRadius(shape, phi) {
  if (shape.poly) return polyRadius(shape, phi);
  if (shape.bend) return bentRadius(shape, phi);
  return straightRadius(shape, phi);
}
function straightRadius(shape, phi) {
  const { rx, rz, lobes = 2, phase = 0, depth = 0.08, wild = 0 } = shape;
  const ellipse = (rx * rz) / Math.hypot(rz * Math.cos(phi), rx * Math.sin(phi));
  let f = 1 + Math.sin(phi * lobes + phase) * depth + Math.sin(phi * 5 + phase * 1.7) * 0.03;
  // A rugged bunker's fingers (BUNKER_STYLES.rugged): sand reaching out in
  // narrow tongues between bays of grass, as on heathland - k of them
  // round it, with a finer ripple along the edge between.
  const fingers = shape.fingers ?? 0;
  if (fingers > 0) {
    const k = shape.fk ?? 7;
    const fp = shape.fphase ?? 0;
    f += fingers * (1.2 * Math.max(0, Math.sin(phi * k + fp)) ** 3 - 0.25 + 0.25 * Math.sin(phi * (k + 4) + fp * 1.7));
  }
  // A pond's wilder edge (0 - 1, see wildWater): bays and spits of several
  // sizes, from its own phase, so a saved pond keeps its shape.
  if (wild > 0) {
    for (const [k, amp, turn] of WILD) f += wild * amp * Math.sin(phi * k + phase * turn + turn);
    // And bays and spits sized by its width, not its length, so a long
    // thin pond gets a real waist and bulges along its sides, not just
    // wobbles at its ends.
    // Spaced evenly round the shore (by where they are round the ellipse,
    // not by angle from its middle, which crowds a long pond's sides into
    // a narrow band).
    const theta = Math.atan2(rx * Math.sin(phi), rz * Math.cos(phi));
    let bays = 0;
    for (const [k, amp, turn] of WIDE) bays += amp * Math.sin(theta * k + phase * turn + turn * 2);
    // Never pinched shut: a narrows keeps at least a third of the width.
    const narrow = Math.min(rx, rz) * 0.33;
    const r = ellipse * f + wild * Math.min(rx, rz) * bays;
    return (r > narrow * 1.5 ? r : narrow + (narrow * 0.5) * Math.exp((r - narrow * 1.5) / (narrow * 0.5))) * edgeAt(shape, phi);
  }
  // A fingered bunker's fingers and the capes of grass between them
  // (sim/fingers.mjs): metres out and in - never pinched in past a third
  // of its blob.
  if (shape.fingered) return Math.max(ellipse * f * 0.3, ellipse * f + fingerOffset(shape, phi)) * edgeAt(shape, phi);
  return ellipse * f * edgeAt(shape, phi);
}

// A bent blob (shape.bend: how sharply, 1 / the radius of the arc it
// follows; its own +z side the inside of the curve): its outline as if
// straight, each point carried round the arc - along it as far as it lay
// along the straight one, as far in or out - in its own frame (x along,
// z across). How far its edge is from its middle in a direction is cast
// along a ray to that outline, as a mapped shape's is (polyRadius). Kept
// for each shape as it is.
const BENT = new WeakMap();
const BENT_POINTS = 96;
// (Kept by what it's made from, each looked at as it is: a key built of
// them on every call was a good part of the time a patch of ground round
// a green's curved bunkers took to split finer.)
const BENT_FIELDS = ["rx", "rz", "lobes", "phase", "depth", "fingers", "fk", "fphase", "bend", "edge", "fingered"];
function bentOutline(shape) {
  const kept = BENT.get(shape);
  if (kept && BENT_FIELDS.every((f, i) => kept.key[i] === shape[f])) return kept.pts;
  const key = BENT_FIELDS.map((f) => shape[f]);
  const k = shape.bend;
  const R = 1 / k;
  const pts = [];
  // (A fingered one's finely, evenly along its edge: outlineAngle.)
  const n = shape.fingered ? FINGERED_POINTS : BENT_POINTS;
  for (let i = 0; i < n; i++) {
    const phi = outlineAngle(shape, i, n);
    const r = straightRadius(shape, phi);
    const u = Math.cos(phi) * r;
    const v = Math.sin(phi) * r;
    const a = u * k;
    const rho = R - v;
    pts.push([Math.sin(a) * rho, R - Math.cos(a) * rho]);
  }
  BENT.set(shape, { key, pts });
  return pts;
}
function bentRadius(shape, phi) {
  const p = bentOutline(shape);
  const dx = Math.cos(phi);
  const dz = Math.sin(phi);
  let best = 0;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const ax = p[j][0];
    const az = p[j][1];
    const ex = p[i][0] - ax;
    const ez = p[i][1] - az;
    const den = dx * ez - dz * ex;
    if (Math.abs(den) < 1e-12) continue;
    const t = (ax * ez - az * ex) / den;
    const u = (ax * dz - az * dx) / den;
    if (t > 0 && u >= 0 && u <= 1) best = Math.max(best, t);
  }
  return best || Math.min(shape.rx, shape.rz);
}

// The wilder edge's bulges: how many round, how big, and a twist on the
// pond's phase so each has its own place. Low enough to stay a soft line.
const WILD = [
  [1, 0.1, 1.3], // one end fuller than the other
  [3, 0.11, 2.3],
  [4, 0.09, 3.1],
  [6, 0.05, 4.7],
  [7, 0.035, 5.3],
  [9, 0.02, 6.1],
];
const WIDE = [
  [3, 0.26, 1.7],
  [4, 0.2, 2.9],
  [6, 0.14, 3.7],
  [9, 0.06, 4.3],
];

// Ponds and lakes with wilder, more erratic edges: each designed water
// shape (not a mapped one, whose edge is real) at the most it can take
// without its water reaching the green (and a couple of metres round it)
// or the tee - tried at full, then less. Leaves a hole it has no change for
// as it was. Used as holes are made and as saved courses are read, so
// every pond has it.
// Checked every time (not only when it has none yet), so a pond given its
// edge before the edge's shape last changed still never reaches the green.
export function wildWater(hole) {
  if (!hole?.water?.length || hole.water.every((w) => w.poly)) return hole;
  const green = hole.green && !hole.green.poly ? blobOutline(hole.green, 48, 2.5) : null;
  const dry = (w) => (!green || !green.some(([x, z]) => insideBlob(w, x, z))) && !insideBlob(w, 0, 0, 7);
  let changed = false;
  const water = hole.water.map((w) => {
    if (w.poly) return w;
    const most = w.wild ?? 1;
    for (const wild of [most, most * 0.6, most * 0.3]) {
      if (wild <= 0) break;
      const tried = wild === w.wild ? w : { ...w, wild: Math.round(wild * 100) / 100 };
      if (dry(tried)) {
        if (tried !== w) changed = true;
        return tried;
      }
    }
    if (w.wild === 0) return w;
    changed = true;
    return { ...w, wild: 0 };
  });
  return changed ? { ...hole, water } : hole;
}

// A real (mapped) shape: { poly, x, z, rot } - how far its edge is from its
// middle in a direction, by casting a ray.
function polyRadius(shape, phi) {
  const a = phi + (shape.rot ?? 0);
  const dx = Math.cos(a);
  const dz = Math.sin(a);
  let best = 0;
  const p = shape.poly;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const ax = p[j][0] - shape.x;
    const az = p[j][1] - shape.z;
    const ex = p[i][0] - p[j][0];
    const ez = p[i][1] - p[j][1];
    const den = dx * ez - dz * ex;
    if (Math.abs(den) < 1e-12) continue;
    const t = (ax * ez - az * ex) / den;
    const u = (ax * dz - az * dx) / den;
    if (t > 0 && u >= 0 && u <= 1) best = Math.max(best, t);
  }
  return best || Math.max(shape.rx ?? 1, 1);
}

// Is (x, z) inside a rotated blob { x, z, rot, rx, rz, ... }, or a mapped
// shape { poly }? `grow` widens it.
export function insideBlob(shape, x, z, grow = 0) {
  if (shape.poly) return insideOutline(shape.poly, x, z) || (grow > 0 && nearOutline(shape.poly, x, z, grow));
  const dx = x - shape.x;
  const dz = z - shape.z;
  // Well outside the furthest its edge can reach: out, without the sums
  // round its edge (most of what's asked, of a hole's every bunker).
  const reach = blobReach(shape) + grow + 1e-6;
  if (reach < Infinity && reach > 0 && dx * dx + dz * dz > reach * reach) return false;
  const c = Math.cos(-shape.rot);
  const s = Math.sin(-shape.rot);
  const u = dx * c - dz * s;
  const v = dx * s + dz * c;
  const d = Math.hypot(u, v);
  if (d < 1e-9) return true;
  return d <= blobRadius(shape, Math.atan2(v, u)) + grow;
}

// The furthest a blob's edge reaches from its middle (Infinity for a wild
// one: no telling).
export function blobReach(shape) {
  if (shape.wild > 0) return Infinity;
  // (Bent, its outer edge's carried a little further round: a share of how
  // sharply.)
  const bent = shape.bend ? 1 + Math.abs(shape.bend) * Math.max(shape.rx, shape.rz) * 0.6 : 1;
  // (And a fingered one's fingers past it: sim/fingers.mjs.)
  return (Math.max(shape.rx, shape.rz) * (1.03 + Math.abs(shape.depth ?? 0.08) + 1.45 * Math.max(0, shape.fingers ?? 0)) + fingerReach(shape)) * 1.001 * bent * edgeReach(shape);
}

// How far a shape reaches from its middle, for boxing it: as anything
// boxing a shape always reckoned (its larger half size, a third more, and
// as far as hand marks pull it), or a fingered bunker's fingers if they
// reach further (sim/fingers.mjs).
export function shapeReach(s) {
  const r = Math.max(s.rx, s.rz) * 1.3 * edgeReach(s);
  return s.fingered ? Math.max(r, blobReach(s)) : r;
}

// How many points round a fingered bunker its outline's drawn and cut
// with (more than a plain one's, for its narrow fingers): blobOutline's
// at least, and its spokes (course/holebuild.js rimPoints).
export const FINGERED_POINTS = 256;
// The local angle of point i of n round a shape's outline: evenly round
// its middle - or, a fingered one's, evenly round the ellipse it's made
// from, so a long one's sides have as many as its ends (its fingers are
// spaced so: sim/fingers.mjs).
export function outlineAngle(shape, i, n) {
  const t = (i / n) * Math.PI * 2;
  if (!shape?.fingered) return t;
  const a = localAngle(shape.rx, shape.rz, t);
  return a < 0 ? a + Math.PI * 2 : a;
}

// Whether (x, z) is surely more than `reach` metres outside a shape (a
// blob, or a mapped shape's outline) - so nothing round its edge need be
// worked out there.
export function beyondShape(shape, x, z, reach) {
  if (shape.poly) return beyondOutline(shape.poly, x, z, reach);
  const r = blobReach(shape) + reach;
  return r < Infinity && (x - shape.x) ** 2 + (z - shape.z) ** 2 > r * r;
}

// Points round a blob's edge, in hole coordinates, for drawing. A mapped
// shape gives its own outline, pushed out from its middle to grow it.
export function blobOutline(shape, n = 48, grow = 0) {
  if (shape.poly) {
    if (!grow) return shape.poly;
    const [cx, cz] = polygonCentroid(shape.poly);
    return shape.poly.map(([x, z]) => {
      const d = Math.hypot(x - cx, z - cz) || 1;
      return [x + ((x - cx) / d) * grow, z + ((z - cz) / d) * grow];
    });
  }
  const pts = [];
  // (A fingered bunker's at least FINGERED_POINTS, evenly along its edge.)
  if (shape.fingered) n = Math.max(n, FINGERED_POINTS);
  for (let i = 0; i < n; i++) {
    const phi = outlineAngle(shape, i, n);
    const r = blobRadius(shape, phi) + grow;
    const u = Math.cos(phi) * r;
    const v = Math.sin(phi) * r;
    pts.push([shape.x + u * Math.cos(shape.rot) - v * Math.sin(shape.rot), shape.z + u * Math.sin(shape.rot) + v * Math.cos(shape.rot)]);
  }
  return pts;
}

// A links hole's pot bunkers (POT): every bunker made small and round,
// with a tall revetted turf face on its high side; and `extra` more in the
// driving zone of a par 4 or 5. As real pots are (the owner: "the land
// should raise around the flat bunker... the layered walls often crescent
// around the flat area"; "there's never really a steep edge"): cut into the
// front of a broad rise, nearly flat sand dug only `dig` metres, so it
// lies almost level with the grass on its open side, and a revetted face
// `face` metres tall at its middle, running `span` of the way round and
// dying away towards its ends (sim/holeedits.mjs groundShaping).
export const POT = { r: [2.2, 3.6], dig: [0.25, 0.35], face: [1.1, 1.3], span: [0.7, 0.78], extra: 2 };
// A pot as they were first made: dug deep all round (1.1 to 1.5 m) with
// a 1.2 m face - steep sand on every side.
const OLD_POT_DIG = 1.1;
function potBunkers(hole, spec, { path, side, halfWidthBase }) {
  const rand = seeded((spec.seed ^ 0x9077) >>> 0 || 1);
  const L = hole.length;
  if (spec.par > 3) {
    for (let i = 0; i < POT.extra; i++) {
      const s = Math.min(L - 60 * YARD, (190 + rand() * 90) * YARD);
      if (s < 60) continue;
      const at = pointAt(path, s);
      const sign = rand() < 0.5 ? -side || -1 : side || 1;
      const off = halfWidthBase * (0.35 + rand() * 0.55);
      hole.bunkers.push(blobShape(rand, at.p[0] - at.dir[1] * sign * off, at.p[1] + at.dir[0] * sign * off, rand() * Math.PI, 3, 3));
    }
  }
  hole.bunkers = hole.bunkers.map((b) => potBunker(hole, b, rand));
}

// One bunker on hole L made a pot (POT): small, round, dug deep, faced on
// its far side with stacked turf. rand: where its size and depth come from
// (by default its own place, so the same bunker always comes out the same:
// the hole builder's "pots" edit, sim/holeedits.mjs).
export function potBunker(L, b, rand = seeded((Math.round(b.x * 100) * 73856093) ^ (Math.round(b.z * 100) * 19349663) || 1)) {
  const r = POT.r[0] + rand() * (POT.r[1] - POT.r[0]);
  const pot = { ...b, rx: r * (1 + rand() * 0.15), rz: r, lobes: 2, depth: 0.04, dig: Math.round((POT.dig[0] + rand() * (POT.dig[1] - POT.dig[0])) * 100) / 100 };
  // (Drawn after the rest, so each pot keeps its size and place.)
  const face = Math.round((POT.face[0] + rand() * (POT.face[1] - POT.face[0])) * 20) / 20;
  const span = POT.span[0] + rand() * (POT.span[1] - POT.span[0]);
  const wall = defaultWall(L, pot, "bunker");
  if (wall) {
    const mid = (wall.a[0] + wall.a[1]) / 2 + (wall.a[1] < wall.a[0] ? 0.5 : 0);
    pot.wall = { a: [mid - span / 2, mid + span / 2].map((t) => Math.round((((t % 1) + 1) % 1) * 1000) / 1000), h: face, m: 0 };
  }
  return pot;
}
// Whether a bunker is already a pot (small, with a tall turf face) - or
// pots laid over each other joined into one (sim/potjoin.mjs: longer).
export const isPot = (b) => b.wall?.m === 0 && (b.wall.h ?? 0) >= 1.1 && (b.dig ?? 0) > 0 && (b.joined === true || Math.max(b.rx ?? 99, b.rz ?? 99) <= POT.r[1] * 1.2);

// A pot made the first way (dug deep all round) as they're made now: its
// sand dug shallow and flat, its face (as tall as it was) standing up out
// of the ground built up behind it - so a links course made before plays
// and looks as a new one does. Anything else as it was. Applied as a
// hole's made ready (courseplay.mjs prepareHole), so play and the picture
// agree; nothing stored changes.
export function potShape(b) {
  if (!isPot(b) || b.dig < OLD_POT_DIG) return b;
  const dig = Math.round((POT.dig[0] + (Math.abs(Math.sin(b.x * 12.9898 + b.z * 78.233)) % 1) * (POT.dig[1] - POT.dig[0])) * 100) / 100;
  return { ...b, dig };
}

// Every bunker on a designed hole dug a little below the grass, with a
// face down into it from its rim (the owner, 19 October 2026: "the drawn
// looks the connection to the surrounding ground, lips in bunkers and
// ponds. Less flat feel to both"): sand laid flat on flat grass read as
// painted on, its lip only painted. By the green 0.24 - 0.3 m, out on the
// fairway 0.18 - 0.26, each its own from where it is - never deeper than
// the hole editor's Shallow (holeedits DEPTHS), so its Deeper always is -
// as a dug bunker plays and is
// drawn (holeedits groundShaping, holebuild.js). Not one already dug or
// walled (a pot), a waste area (sandy scrub, at grade) or one from a map.
// `sunk` says it was dug so: its fine ground (holescenery.js
// groundSheets) needs to reach only a little past it.
export const SINK = { green: [0.24, 0.3], fairway: [0.18, 0.26], near: 18 };
export function sinkShape(b, green = null) {
  if (!b || b.dig || b.wall || b.walls || b.waste || b.poly) return b;
  const byGreen = !!green && Math.hypot(b.x - green.x, b.z - green.z) < Math.max(green.rx ?? 0, green.rz ?? 0) + Math.max(b.rx, b.rz) + SINK.near;
  const [lo, hi] = byGreen ? SINK.green : SINK.fairway;
  const t = Math.abs(Math.sin(b.x * 12.9898 + b.z * 78.233) * 43758.5453) % 1;
  return { ...b, dig: Math.round((lo + t * (hi - lo)) * 100) / 100, sunk: true };
}

// How a course's bunkers are shaped, by its style (the hole's trees
// option: holeBunkerStyle) - the owner: "they all look a bit similar":
//   classic   parkland's: kidneys and ovals, now and then a small one
//             beside a greenside bunker and a cluster in the driving zone
//   rugged    woodland's and heathland's: ragged edges with fingers of sand
//             between bays of grass, deeper lobes, more of them in pairs
//   modern    open courses': big, sweeping and scalloped, wrapping greens
//   links     pot bunkers (POT), and on longer holes a line of them across
//             the fairway
// size: how much each bunker is scaled ([least, most], along and across);
// partner: the chance a greenside bunker has a small one beside it;
// cluster: the chance a fairway bunker has one or two more beyond it.
export const BUNKER_STYLES = {
  classic: { size: [[0.75, 1.25], [0.85, 1.2]], partner: 0.3, cluster: 0.35 },
  rugged: { size: [[0.9, 1.35], [0.9, 1.3]], fingers: [0.06, 0.13], fk: [6, 9], lobes: [3, 4], depth: [0.12, 0.2], partner: 0.4, cluster: 0.3 },
  modern: { size: [[1.2, 1.6], [0.9, 1.15]], lobes: [3, 4], depth: [0.14, 0.22], partner: 0.15, cluster: 0.15 },
  links: { cross: 0.75, pair: 0.3 },
};

// A hole's bunker style, from its options (a course's style sets its
// trees): woodland's heavy trees rugged, open courses' light ones modern,
// links holes pots, the rest classic.
export function holeBunkerStyle(options = {}) {
  // (A hole of a course put on made-up hills keeps the style it was made
  // in: sim/imaginary.mjs withHills.)
  if (BUNKER_STYLES[options.bunkerStyle]) return options.bunkerStyle;
  if (LINKS_TREES[options.trees]) return "links";
  if (options.trees === "heavy") return "rugged";
  if (options.trees === "light") return "modern";
  return "classic";
}

// One bunker shaped in a style (BUNKER_STYLES): its size, lobes and, for a
// rugged one, its fingers - where it is and which way it lies kept.
export function styleBunker(b, style, rand) {
  const st = BUNKER_STYLES[style];
  if (!st?.size) return b;
  const span = ([a, z]) => a + rand() * (z - a);
  const out = { ...b, rx: b.rx * span(st.size[0]), rz: b.rz * span(st.size[1]) };
  if (st.lobes) out.lobes = st.lobes[0] + Math.floor(rand() * (st.lobes[1] - st.lobes[0] + 1));
  if (st.depth) out.depth = span(st.depth);
  if (st.fingers) {
    out.fingers = Math.round(span(st.fingers) * 1000) / 1000;
    out.fk = st.fk[0] + Math.floor(rand() * (st.fk[1] - st.fk[0] + 1));
    out.fphase = Math.round(rand() * 6283) / 1000;
  }
  return out;
}

// A hole's bunkers in its style, from a randomness of their own (so
// nothing else on the hole moves for them): each shaped (styleBunker), a
// small one now and then beside a greenside bunker, one or two more beyond
// a fairway bunker - none on the green, a tee or another bunker's middle.
// clusters: false keeps a hole's fairway bunkers where they are, none added
// (a strategic hole's: sim/architect.mjs has put each where it's meant).
export function styleBunkers(hole, spec, style, { path, greenShape, halfWidthBase, clusters = true }) {
  const st = BUNKER_STYLES[style];
  if (!st?.size) return;
  const rand = seeded((spec.seed ^ 0xb0b5) >>> 0 || 1);
  const L = hole.length;
  const clear = (x, z, r) => !insideBlob(greenShape, x, z, r + 2) && Math.hypot(x, z) > 25 && !hole.water.some((w) => insideBlob(w, x, z, r)) && x < L + 30;
  const out = [];
  for (const b of hole.bunkers) {
    const shaped = styleBunker(b, style, rand);
    out.push(shaped);
    const greenside = Math.hypot(b.x - greenShape.x, b.z - greenShape.z) < Math.max(greenShape.rx, greenShape.rz) + 20;
    if (greenside && rand() < st.partner) {
      // Beside it, along its own length, a little further from the green.
      const along = (rand() < 0.5 ? -1 : 1) * (shaped.rx * 0.95 + 2);
      const away = Math.atan2(b.z - greenShape.z, b.x - greenShape.x);
      const x = b.x + Math.cos(b.rot) * along + Math.cos(away) * 2.5;
      const z = b.z + Math.sin(b.rot) * along + Math.sin(away) * 2.5;
      const small = styleBunker(blobShape(rand, x, z, b.rot + (rand() - 0.5) * 0.6, 3 + rand() * 2, 2 + rand() * 1.2), style, rand);
      if (clear(x, z, small.rx)) out.push(small);
    } else if (!greenside && rand() < st.cluster && clusters) {
      // One or two more, staggered on down the hole and a little further out.
      const s0 = nearest(path, b.x, b.z).s;
      const n = 1 + (rand() < 0.4 ? 1 : 0);
      for (let k = 1; k <= n; k++) {
        const s = s0 + k * (12 + rand() * 8);
        if (s > L - 60) break;
        const at = pointAt(path, s);
        const sign = Math.sign((b.x - at.p[0]) * -at.dir[1] + (b.z - at.p[1]) * at.dir[0]) || 1;
        const off = halfWidthBase * (0.85 + 0.12 * k + rand() * 0.1);
        const x = at.p[0] - at.dir[1] * sign * off;
        const z = at.p[1] + at.dir[0] * sign * off;
        const more = styleBunker(blobShape(rand, x, z, Math.atan2(at.dir[1], at.dir[0]) + (rand() - 0.5) * 0.5, 4 + rand() * 3, 2.5 + rand() * 1.5), style, rand);
        if (clear(x, z, more.rx)) out.push(more);
      }
    }
  }
  hole.bunkers = out;
}

// A links hole's cross bunkers: on a par 5 (and now and then a par 4) a line
// of pots across the fairway short of the green, as on the old links -
// played over or laid up short of.
function crossBunkers(hole, spec, { path, halfWidthBase }) {
  const st = BUNKER_STYLES.links;
  const rand = seeded((spec.seed ^ 0xc055) >>> 0 || 1);
  const L = hole.length;
  if (!(spec.par === 5 ? rand() < st.cross : spec.par === 4 && rand() < st.pair)) return;
  const s = spec.par === 5 ? L * (0.6 + rand() * 0.12) : Math.min(L - 70 * YARD, (235 + rand() * 30) * YARD);
  if (s < 120) return;
  const at = pointAt(path, s);
  const n = spec.par === 5 ? 3 : 2;
  for (let k = 0; k < n; k++) {
    const t = (k - (n - 1) / 2) * (halfWidthBase * 0.8) + (rand() - 0.5) * 4;
    const x = at.p[0] - at.dir[1] * t + (rand() - 0.5) * 6;
    const z = at.p[1] + at.dir[0] * t;
    if (hole.water.some((w) => insideBlob(w, x, z, 4))) continue;
    hole.bunkers.push({ ...potBunker(hole, blobShape(rand, x, z, rand() * Math.PI, 3, 3), rand), cross: 1 });
  }
}

// A heathland par 5's row of cross bunkers across the lay-up (sim/
// crossbunkers.mjs), as the links hole's line of pots: now and then
// (CROSS.second), from a randomness of its own, a hundred yards and more
// short of the green.
function secondRow(hole, spec, { path, halfWidthBase }) {
  const rand = seeded((spec.seed ^ 0x5ec0d) >>> 0 || 1);
  const L = hole.length;
  if (spec.par !== 5 || rand() >= CROSS.second.chance) return [];
  const s = Math.min(L * (0.6 + rand() * 0.12), L - CROSS.tee.short * YARD);
  if (s < 250) return [];
  return crossRow(hole, { s, path, style: "rugged", rand, half: halfWidthBase, keepOff: true });
}

// A bunker given a style's shape (the hole builder's "bstyle" edit, sim/
// holeedits.mjs, for courses made before the styles came): its lobes and
// how deep they are, and a rugged one's fingers - its size, place and lie
// kept - from its own place, so doing it again changes nothing. On a hole
// (L), a rugged one big enough is fingered (sim/fingers.mjs), its fingers
// up its face towards the way play goes past it - shorter, or the ragged
// edge it had, if they'd reach onto the green.
export function restyleBunker(b, style, L = null) {
  const st = BUNKER_STYLES[style];
  if (!st?.size || b.poly) return b;
  const rand = seeded((Math.round(b.x * 100) * 73856093) ^ (Math.round(b.z * 100) * 19349663) ^ 0x5b1e || 1);
  const span = ([a, z]) => a + rand() * (z - a);
  const { fingers, fk, fphase, fingered, ...plain } = b;
  void fingers, fk, fphase, fingered;
  const out = { ...plain, lobes: st.lobes ? st.lobes[0] + Math.floor(rand() * (st.lobes[1] - st.lobes[0] + 1)) : 2 + Math.floor(rand() * 2), depth: st.depth ? span(st.depth) : 0.05 + rand() * 0.09 };
  if (st.fingers) {
    out.fingers = Math.round(span(st.fingers) * 1000) / 1000;
    out.fk = st.fk[0] + Math.floor(rand() * (st.fk[1] - st.fk[0] + 1));
    out.fphase = Math.round(rand() * 6283) / 1000;
    if (L?.path?.length > 1 && L.green && Math.max(b.rx, b.rz) >= FINGERED.least) {
      const path = makePath(L.path);
      const dir = pointAt(path, nearest(path, b.x, b.z).s).dir;
      const shaped = fingerBunker(out, style, Math.atan2(dir[1], dir[0]), rand);
      for (const k of [1, 0.7, 0.45]) {
        const f = k === 1 ? shaped : { ...shaped, fingered: { ...shaped.fingered, len: Math.round(shaped.fingered.len * k * 1000) / 1000 } };
        if (!blobOutline(f, 96).some(([x, z]) => insideBlob(L.green, x, z, 1))) return f;
      }
    }
  }
  return out;
}

// A links hole's burn (the owner: "links burns and ditches"): a narrow
// stream winding right across the fairway - in front of the green (as the
// Swilcan crosses the 1st at St Andrews) or out in the driving zone of a
// par 5 - from a randomness of its own. Its water is a narrow outline
// (poly) round its winding line, so it plays and is drawn as any water is;
// a yellow penalty area (sim/penalty.mjs). Bunkers it would cut through
// are left out.
export const BURN = { chance: 0.4, width: [2.6, 4], wander: [2, 5], beyond: 45, step: 5 };
export function burnFor(hole, spec, { path, halfWidthBase, greenShape }) {
  const rand = seeded((spec.seed ^ 0xb0e2) >>> 0 || 1);
  const L = hole.length;
  if (spec.par < 4 || rand() > BURN.chance) return;
  const greenR = Math.max(greenShape.rx, greenShape.rz);
  const front = spec.par === 4 || rand() < 0.5;
  const s = front ? L - greenR - (18 + rand() * 14) : L * (0.55 + rand() * 0.12);
  if (s < 140) return;
  const at = pointAt(path, s);
  const [dx, dz] = at.dir;
  const reach = halfWidthBase + BURN.beyond;
  const wander = BURN.wander[0] + rand() * (BURN.wander[1] - BURN.wander[0]);
  const phase = rand() * 6.28;
  const turns = 0.02 + rand() * 0.02;
  const half = (BURN.width[0] + rand() * (BURN.width[1] - BURN.width[0])) / 2;
  // Its line: across the hole, wandering up and down it.
  const line = [];
  for (let t = -reach; t <= reach + 1e-6; t += BURN.step) {
    const along = wander * Math.sin(t * turns * 6.28 + phase) + 0.4 * wander * Math.sin(t * turns * 15 + phase * 2);
    line.push([at.p[0] + dx * along - dz * t, at.p[1] + dz * along + dx * t]);
  }
  // Not near the green or a tee.
  if (line.some(([x, z]) => insideBlob(greenShape, x, z, 6) || Math.hypot(x, z) < 30)) return;
  const sides = [[], []];
  line.forEach(([x, z], i) => {
    const [px, pz] = line[Math.max(0, i - 1)];
    const [nx, nz] = line[Math.min(line.length - 1, i + 1)];
    const len = Math.hypot(nx - px, nz - pz) || 1;
    const w = half * (0.85 + 0.3 * Math.sin(i * 1.7 + phase));
    sides[0].push([x - ((nz - pz) / len) * w, z + ((nx - px) / len) * w]);
    sides[1].push([x + ((nz - pz) / len) * w, z - ((nx - px) / len) * w]);
  });
  const poly = [...sides[0], ...sides[1].reverse()].map(([x, z]) => [Math.round(x * 100) / 100, Math.round(z * 100) / 100]);
  // A brook through it (sim/brooks.mjs burnBrook): in its own channel below
  // the grass, its banks worn by its water.
  // (The very brook a burn saved as an outline is made as it's read:
  // burnsAsBrooks - there, its banks stop short of a bunker beside it:
  // brookRoom.) No bunker on its banks.
  const burn = brookShape(burnBrook({ poly, rx: half }));
  hole.water.push(burn);
  const bed = brookBed(burn);
  hole.bunkers = hole.bunkers.filter((b) => !insideBlob(bed, b.x, b.z, Math.max(b.rx, b.rz) + 1));
}

// A heathland hole's waste areas: broad stretches of sandy ground, heather
// and scrub beside the fairway, out past the rough (a rugged course's:
// BUNKER_STYLES.rugged) - played as their own ground, firm sand and scrub
// (sim/wastearea.mjs), with no grass collar, the sand rough and windblown,
// the edge ragged (sim/bunkerlook.mjs waste). From a randomness of their
// own.
export const WASTE = { chance: 0.55, size: [[22, 40], [7, 12]], at: [150, 250] };
export function wasteAreas(hole, spec, { path, halfWidthBase, greenShape }) {
  const rand = seeded((spec.seed ^ 0x3a57e) >>> 0 || 1);
  const L = hole.length;
  if (spec.par < 4 || rand() > WASTE.chance) return;
  const s = Math.min(L - 70, (WASTE.at[0] + rand() * (WASTE.at[1] - WASTE.at[0])) * YARD);
  const at = pointAt(path, s);
  const sign = rand() < 0.5 ? -1 : 1;
  const rx = WASTE.size[0][0] + rand() * (WASTE.size[0][1] - WASTE.size[0][0]);
  const rz = WASTE.size[1][0] + rand() * (WASTE.size[1][1] - WASTE.size[1][0]);
  const off = halfWidthBase + rz + 4;
  const x = at.p[0] - at.dir[1] * sign * off;
  const z = at.p[1] + at.dir[0] * sign * off;
  const area = { x, z, rot: Math.atan2(at.dir[1], at.dir[0]) + (rand() - 0.5) * 0.3, rx, rz, lobes: 4, phase: rand() * 6.28, depth: 0.16, fingers: 0.16 + rand() * 0.06, fk: 7 + Math.floor(rand() * 3), fphase: rand() * 6.28, waste: 1 };
  if (insideBlob(greenShape, x, z, rx + 4) || hole.water.some((w) => insideBlob(w, x, z, rx))) return;
  hole.bunkers.push(area);
}

export function blobShape(rand, x, z, rot, rx, rz) {
  return { x, z, rot, rx, rz, lobes: 2 + Math.floor(rand() * 2), phase: rand() * 6, depth: 0.05 + rand() * 0.09 };
}

// ---- The centreline ------------------------------------------------------------

// Rounds the corners of a polyline (Chaikin), keeping the ends.
export function smooth(points, rounds = 3) {
  let pts = points;
  for (let r = 0; r < rounds; r++) {
    const out = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i];
      const [bx, bz] = pts[i + 1];
      if (i > 0) out.push([ax * 0.75 + bx * 0.25, az * 0.75 + bz * 0.25]);
      if (i < pts.length - 2) out.push([ax * 0.25 + bx * 0.75, az * 0.25 + bz * 0.75]);
    }
    out.push(pts[pts.length - 1]);
    pts = out;
  }
  return pts;
}

// A polyline with lengths, for "where along the hole is this".
export function makePath(points) {
  const cum = [0];
  for (let i = 1; i < points.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  }
  return { points, cum, length: cum[cum.length - 1] };
}

export function pointAt(path, s) {
  const { points, cum } = path;
  if (s <= 0) return { p: points[0], dir: dirOf(points[0], points[1]) };
  for (let i = 1; i < points.length; i++) {
    if (cum[i] >= s) {
      const f = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
      const a = points[i - 1];
      const b = points[i];
      return { p: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], dir: dirOf(a, b) };
    }
  }
  const n = points.length;
  return { p: points[n - 1], dir: dirOf(points[n - 2], points[n - 1]) };
}

function dirOf(a, b) {
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
}

// How far (x, z) is from the path - nearest(path, x, z).d's size, by the
// same sums, without making anything (a mapped hole's lies ask it of a
// few hundred thousand spots along the deep rough's edge: lieRaster).
export function nearestDistance(path, x, z) {
  const { points } = path;
  let best = Infinity;
  let best2 = Infinity;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const ax = a[0];
    const az = a[1];
    const ex = b[0] - ax;
    const ez = b[1] - az;
    const len2 = ex * ex + ez * ez || 1;
    let f = ((x - ax) * ex + (z - az) * ez) / len2;
    if (f < 0) f = 0;
    else if (f > 1) f = 1;
    const qx = x - (ax + ex * f);
    const qz = z - (az + ez * f);
    // (Its square first: plainly further than the best so far, no need
    // for the exact distance - the same answer as ever, sooner: NEAR_SKIP.)
    const d2 = qx * qx + qz * qz;
    if (d2 > best2 * NEAR_SKIP) continue;
    const dist = Math.hypot(qx, qz);
    if (dist < best) {
      best = dist;
      best2 = d2;
    }
  }
  return best;
}

// A segment whose distance squared is more than this times the best's is
// plainly further (Math.hypot is within a part in 10^15 of the square
// root of the squares), so it's skipped without working out its distance:
// nearest and nearestDistance give exactly what they always did, a good
// deal quicker - they're asked of every spot whose lie or shape is wanted.
const NEAR_SKIP = 1 + 1e-9;

// Nearest point on the path: s (metres along), d (signed, + right of the line).
export function nearest(path, x, z) {
  const { points, cum } = path;
  let dist = Infinity;
  let best2 = Infinity;
  let s = 0;
  let d = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const ax = a[0];
    const az = a[1];
    const ex = b[0] - ax;
    const ez = b[1] - az;
    const len2 = ex * ex + ez * ez || 1;
    let f = ((x - ax) * ex + (z - az) * ez) / len2;
    if (f < 0) f = 0;
    else if (f > 1) f = 1;
    const qx = x - (ax + ex * f);
    const qz = z - (az + ez * f);
    const d2 = qx * qx + qz * qz;
    if (d2 > best2 * NEAR_SKIP) continue;
    const here = Math.hypot(qx, qz);
    if (here < dist) {
      // Right of travel is +z when heading +x: cross(dir, offset) > 0.
      const side = Math.sign(ex * (z - az) - ez * (x - ax)) || 1;
      dist = here;
      best2 = d2;
      s = cum[i - 1] + f * Math.sqrt(len2);
      d = side * here;
    }
  }
  return { dist, s, d };
}

// ---- Options -----------------------------------------------------------------

export const OPTIONS = {
  dogleg: { auto: "Auto", none: "Straight", left: "Left", right: "Right" },
  fairway: { narrow: "Narrow", normal: "Normal", wide: "Wide" },
  bunkers: { none: "None", few: "Few", some: "Some", lots: "Lots" },
  water: { auto: "Auto", none: "None", left: "Left", right: "Right", front: "In front of the green" },
  green: { small: "Small", normal: "Normal", large: "Large" },
  contours: { gentle: "Gentle", moderate: "Moderate", severe: "Severe" },
  // None: a links hole - long grass where the trees would be, either the
  // brown of the dunes everywhere off the fairways, or green with darker,
  // thicker patches of long grass.
  trees: { dunes: "None - links, brown dunes", greenlinks: "None - links, green", light: "Light", normal: "Normal", heavy: "Heavy" },
  // A cart path (sim/paths.mjs): down whichever side suits, or the one asked.
  paths: { auto: "Auto", left: "Left side", right: "Right side", none: "None" },
  // How the hole is designed: classic, the hazards at set distances along
  // it, as every hole was made before; or strategic (sim/architect.mjs),
  // built round where golfers' shots finish - a better side of the
  // fairway, hazards on the bold line, a green turned and guarded to match.
  design: { classic: "Classic", strategic: "Strategic" },
  // A classic hole of the great courses (sim/architect.mjs TEMPLATES): a
  // Redan, an Eden, a Cape and the rest - which makes it strategic, unless
  // its design is asked to be classic. Auto: the hole's own kind, from its
  // choices.
  template: {
    auto: "Auto",
    redan: "Redan (par 3)",
    eden: "Eden (par 3)",
    biarritz: "Biarritz (par 3)",
    short: "Short (par 3)",
    road: "Road (par 4)",
    narrows: "Narrows (par 4)",
    bottle: "Bottle (par 4)",
    cape: "Cape (par 4)",
    principal: "Principal's Nose (par 4, 5)",
    drivable: "Drivable (par 4)",
    plateau: "Double plateau (par 4)",
    long: "Long (par 5)",
    reachable: "Par 5 to go for",
  },
};

// What each option is called in the designer, where its key alone won't do.
export const OPTION_LABELS = { paths: "Cart path" };

export const DEFAULT_OPTIONS = {
  dogleg: "auto",
  fairway: "normal",
  bunkers: "some",
  water: "auto",
  green: "normal",
  contours: "gentle",
  trees: "normal",
  // None unless asked: every hole made before cart paths existed, and every
  // Challenges hole, stays exactly as it was - even rebuilt for another
  // option. A new course asks for them (buildCourse).
  paths: "none",
};

export const FAIRWAY_WIDTH = { narrow: 24, normal: 32, wide: 42 }; // yards
export const GREEN_SIZE = { small: 0.82, normal: 1, large: 1.2 };
const BUNKERS = { none: [0, 0], few: [1, 0], some: [2, 1], lots: [3, 2] }; // [greenside, fairway]
const TREE_GAP = { light: 16, normal: 10, heavy: 6.5 };
// The trees options that make a links hole, and its look.
export const LINKS_TREES = { dunes: "dunes", greenlinks: "green" };

// The shortest and longest hole (yards): down to a chip and putt course's.
export const MIN_YARDS = 20;
export const MAX_YARDS = 700;

export function holeSpec({ number, par, yards, si = null, seed = newSeed(), options = {} }) {
  return {
    number,
    par: [3, 4, 5].includes(par) ? par : yards < 250 ? 3 : yards < 480 ? 4 : 5,
    yards: Math.max(MIN_YARDS, Math.min(MAX_YARDS, Math.round(yards))),
    si,
    seed,
    options: { ...DEFAULT_OPTIONS, ...options },
  };
}

// ---- Building a hole -----------------------------------------------------------

export function buildHole(spec) {
  const o = { ...DEFAULT_OPTIONS, ...spec.options };
  // (A chip and putt's tiny holes stay classic: there's no strategy to plan.)
  if ((o.design === "strategic" || (o.design !== "classic" && o.template && o.template !== "auto")) && spec.yards >= 90) return strategicHole(spec);
  const rand = seeded(spec.seed);
  const L = spec.yards * YARD;

  // Centreline: straight for most par 3s; dog-legs on longer holes.
  let bends = 0;
  let side = rand() < 0.5 ? -1 : 1;
  if (o.dogleg === "left") side = -1;
  if (o.dogleg === "right") side = 1;
  if (o.dogleg === "left" || o.dogleg === "right") bends = spec.par === 5 && rand() < 0.35 ? 2 : 1;
  else if (o.dogleg === "auto") {
    if (spec.par === 4) bends = rand() < 0.6 ? 1 : 0;
    if (spec.par === 5) bends = rand() < 0.3 ? 2 : rand() < 0.7 ? 1 : 0;
  }
  const raw = [[0, 0]];
  let heading = spec.par === 3 ? (rand() - 0.5) * 0.12 : (rand() - 0.5) * 0.06;
  let x = 0;
  let z = 0;
  const legs = [];
  // (A par 4 or 5 on a very short card has no room for its bends: one leg
  // would come out backwards - the line doubling back behind the tee. Then
  // fewer bends, or none.)
  if (bends === 2 && Math.min(L - 100 * YARD, Math.min(250 * YARD, L * 0.45) + L * 0.33) - Math.min(250 * YARD, L * 0.45) < 10) bends = 1;
  if (bends === 1 && L - 90 * YARD < 10) bends = 0;
  if (bends === 0) legs.push(L);
  else if (bends === 1) {
    const corner = Math.min(L - 90 * YARD, Math.max(0.55 * L, Math.min(250 * YARD, 0.66 * L)));
    legs.push(corner, L - corner);
  } else {
    const c1 = Math.min(250 * YARD, L * 0.45);
    const c2 = Math.min(L - 100 * YARD, c1 + L * 0.33);
    legs.push(c1, c2 - c1, L - c2);
  }
  legs.forEach((len, i) => {
    if (i > 0) {
      const turn = (0.25 + rand() * 0.35) * (bends === 2 && i === 2 ? -side * 0.7 : side);
      heading += turn;
    }
    x += Math.cos(heading) * len;
    z += Math.sin(heading) * len;
    raw.push([x, z]);
  });
  // Rescale so the measured (smoothed) length is the card's length.
  let path = makePath(smooth(raw));
  const k = L / path.length;
  path = makePath(path.points.map(([px, pz]) => [px * k, pz * k]));

  // Green at the end of the line, turned to face the approach.
  const end = pointAt(path, path.length);
  const approach = Math.atan2(end.dir[1], end.dir[0]);
  // (A very short hole - a chip and putt's, under 60 yds, shorter than
  // any hole could be before - has a smaller green, or the green would be
  // half the hole, and its trees closer in. Anything longer is as it was.)
  const short = spec.yards < 60 ? 0.55 + 0.45 * (spec.yards / 60) : 1;
  const scale = GREEN_SIZE[o.green] * (spec.par === 3 ? 0.85 + Math.min(1, spec.yards / 220) * 0.2 : 1) * short;
  const greenShape = blobShape(rand, end.p[0], end.p[1], approach, (13 + rand() * 3) * scale, (10.5 + rand() * 3) * scale);
  // Pin somewhere on the green, a sensible way from the edge.
  const pinPhi = rand() * Math.PI * 2;
  const pinR = (0.15 + rand() * 0.45) * blobRadius(greenShape, pinPhi);
  const pin = [
    greenShape.x + Math.cos(pinPhi + approach) * pinR,
    greenShape.z + Math.sin(pinPhi + approach) * pinR,
  ];
  const contours = greenContours(rand, greenShape, pin, o.contours);

  // Fairway: from past the tee area to the front of the green.
  const halfWidthBase = (FAIRWAY_WIDTH[o.fairway] * YARD) / 2;
  const fairway =
    spec.par === 3
      ? { from: Math.max(0, L - blobRadius(greenShape, Math.PI) - 25 * YARD), to: L - blobRadius(greenShape, Math.PI) * 0.8, half: halfWidthBase * 0.7, phase: rand() * 6, natural: true }
      : { from: Math.min(90 * YARD, L * 0.22), to: L - blobRadius(greenShape, Math.PI) * 0.8, half: halfWidthBase, phase: rand() * 6, natural: true };
  // Rough out to the trees.
  const treeLine = (halfWidthBase + (22 + rand() * 12) * YARD * (o.trees === "heavy" ? 0.8 : o.trees === "light" || LINKS_TREES[o.trees] ? 1.25 : 1)) * (spec.yards < 60 ? 0.45 + 0.55 * (spec.yards / 60) : 1);

  const hole = {
    number: spec.number,
    par: spec.par,
    yards: spec.yards,
    si: spec.si,
    length: L,
    path: path.points,
    tee: { x: 0, z: 0, heading: Math.atan2(path.points[1][1], path.points[1][0]) },
    fairway,
    treeLine,
    green: greenShape,
    pin,
    contours,
    bunkers: [],
    water: [],
    trees: [],
  };
  // A links hole: no trees, long grass past its rough (surfaceAt) - its
  // look, "dunes" or "green", kept as hole.links.
  const links = !!LINKS_TREES[o.trees];
  if (links) hole.links = LINKS_TREES[o.trees];

  // Water: sometimes on its own, or where asked.
  let water = o.water;
  if (water === "auto") {
    const r = rand();
    water = r < 0.72 ? "none" : spec.par === 3 && r < 0.86 ? "front" : r < 0.93 ? "left" : "right";
  }
  if (water === "front") {
    const s = L - blobRadius(greenShape, Math.PI) - 18 * YARD;
    const at = pointAt(path, Math.max(40, s));
    hole.water.push(blobShape(rand, at.p[0], at.p[1], approach + Math.PI / 2, (halfWidthBase + 10) * 0.9, 9 + rand() * 5));
  } else if (water === "left" || water === "right") {
    const sign = water === "left" ? -1 : 1;
    const s = spec.par === 3 ? L * 0.7 : Math.min(L - 60, 215 * YARD + rand() * 30);
    const at = pointAt(path, s);
    const nx = -at.dir[1] * sign;
    const nz = at.dir[0] * sign;
    const off = halfWidthBase + 14;
    hole.water.push(
      blobShape(rand, at.p[0] + nx * off, at.p[1] + nz * off, Math.atan2(at.dir[1], at.dir[0]), 30 + rand() * 25, 9 + rand() * 6),
    );
  }

  // Its water's edge made wilder, before the sand and trees go round it.
  hole.water = wildWater(hole).water;

  // Bunkers round the green and in the driving zone.
  const [greenside, fairwayBunkers] = BUNKERS[o.bunkers];
  const spots = [Math.PI * 0.75, -Math.PI * 0.75, Math.PI * 0.45, -Math.PI * 0.45, Math.PI];
  for (let i = 0; i < greenside; i++) {
    const phi = spots[(i + Math.floor(rand() * 2)) % spots.length] + (rand() - 0.5) * 0.4;
    const r = blobRadius(greenShape, phi) + 5 + rand() * 2;
    const a = phi + approach;
    hole.bunkers.push(
      blobShape(rand, greenShape.x + Math.cos(a) * r, greenShape.z + Math.sin(a) * r, a + Math.PI / 2, 7 + rand() * 4, 3.2 + rand() * 1.6),
    );
  }
  if (spec.par > 3) {
    for (let i = 0; i < fairwayBunkers; i++) {
      const s = Math.min(L - 70 * YARD, (225 + rand() * 45) * YARD);
      const at = pointAt(path, s);
      // The inside of a dog-leg first (its side), then the other side.
      const sign = (i % 2 === 0 ? side : -side) * (bends ? 1 : rand() < 0.5 ? 1 : -1);
      const off = halfWidthBase * (0.75 + rand() * 0.2);
      hole.bunkers.push(
        blobShape(rand, at.p[0] - at.dir[1] * sign * off, at.p[1] + at.dir[0] * sign * off, Math.atan2(at.dir[1], at.dir[0]), 11 + rand() * 6, 4 + rand() * 2),
      );
    }
  }

  // A links hole's bunkers are pots: small, round and deep, each faced on
  // its far side with stacked turf (a revetted face: sim/walls.mjs), and a
  // couple more out in the driving zone, in the fairway's edges - from a
  // randomness of their own, so nothing else on the hole moves for them.
  if (links) {
    potBunkers(hole, spec, { path, side, halfWidthBase });
    crossBunkers(hole, spec, { path, halfWidthBase });
    burnFor(hole, spec, { path, halfWidthBase, greenShape });
    // Now and then a waste area of sandy, scrubby ground out in its rough
    // (sim/wastearea.mjs).
    linksWaste(hole, spec, { path, halfWidthBase, greenShape });
  } else {
    styleBunkers(hole, spec, holeBunkerStyle(o), { path, greenShape, halfWidthBase });
    if (holeBunkerStyle(o) === "rugged") {
      wasteAreas(hole, spec, { path, greenShape, halfWidthBase });
      // Cross bunkers (sim/crossbunkers.mjs): on a par 5 now and then a row
      // across the lay-up, as a links hole's line of pots; on another a row
      // where the long hitters' drives finish.
      if (!secondRow(hole, spec, { path, halfWidthBase }).length) teeRow(hole, spec, { style: "rugged", path, half: halfWidthBase });
    }
    // And shaped further: wraps round the green, sizes, flashed faces,
    // lakes and wetland edges (sim/hazardshapes.mjs) - its water's edge
    // made wild again for a lake, kept off the green.
    shapeHazards(hole, spec, { style: holeBunkerStyle(o), path, greenShape, approach, halfWidthBase });
    hole.water = wildWater(hole).water;
  }

  return dressHole(hole, spec, { rand, path, approach, links });
}

// A hole's trees, the view from its tee and its cart path, once its
// shapes are laid out (buildHole's, or sim/architect.mjs's strategic
// hole's): rand, the hole's randomness, drawn on from where its shapes
// left it.
export function dressHole(hole, spec, { rand, path, approach, links }) {
  const o = { ...DEFAULT_OPTIONS, ...spec.options };
  const L = hole.length;
  const { treeLine, fairway, green: greenShape } = hole;
  // Trees down both sides beyond the rough, and behind the green. Their
  // line is shaped by noise (woodsShape): bays where the wood stands back,
  // gaps in its front row, a row more or fewer - from a randomness of its
  // own, so nothing else on the hole moves for it.
  const gap = TREE_GAP[o.trees];
  const shape = woodsShape(spec.seed);
  for (let s = 25; !links && s < L + 40; s += gap) {
    const at = pointAt(path, s);
    for (const sign of [-1, 1]) {
      const rows = o.trees === "heavy" ? 3 : 2;
      const here = shape.at(s, sign, rows);
      for (let r = 0; r < Math.max(rows, here.rows); r++) {
        // (The first rows' randomness drawn as it always was.)
        const off = (r < rows ? treeLine + 3 + r * 9 + rand() * 8 : treeLine + 3 + r * 9 + shape.rand() * 8) + here.back;
        const jx = (r < rows ? rand() : shape.rand()) - 0.5;
        const jz = (r < rows ? rand() : shape.rand()) - 0.5;
        const size = r < rows ? rand() : shape.rand();
        if (r >= here.rows || (r === 0 && here.gap)) continue;
        const tx = at.p[0] - at.dir[1] * sign * off + jx * 4;
        const tz = at.p[1] + at.dir[0] * sign * off + jz * 4;
        if (hole.water.some((w) => insideBlob(w, tx, tz, 3))) continue;
        hole.trees.push([round2(tx), round2(tz), round2(0.85 + size * 0.7)]);
      }
    }
  }
  // Lone trees out in the rough between the fairway and the woods, and a
  // copse or two beyond the tree line.
  for (const [x, z, size] of links ? [] : shape.extras({ path, L, treeLine, fairway, green: greenShape })) {
    if (hole.water.some((w) => insideBlob(w, x, z, 4)) || hole.bunkers.some((b) => insideBlob(b, x, z, 5))) continue;
    hole.trees.push([round2(x), round2(z), round2(size)]);
  }
  for (let i = 0; !links && i < 16; i++) {
    const a = approach + (rand() - 0.5) * 2.2;
    const r = blobRadius(greenShape, 0) + 28 + rand() * 25;
    hole.trees.push([round2(greenShape.x + Math.cos(a) * r), round2(greenShape.z + Math.sin(a) * r), round2(1 + rand() * 0.6)]);
  }

  // A clear view from the tee down to the fairway (teelane.mjs).
  hole.trees = clearTeeLane(hole, hole.trees);

  // A cart path, laid out last with its own randomness, so asking for one
  // moves nothing else on the hole; only trees standing in its way go.
  if (o.paths && o.paths !== "none") {
    const p = generatePath(hole, o.paths, (spec.seed ^ 0x9a7b) >>> 0 || 1);
    if (p) {
      hole.paths = [p];
      hole.trees = treesOffPaths(hole.trees, hole.paths);
    }
  }
  return hole;
}

function round2(v) {
  return Math.round(v * 100) / 100;
}

// How a green slopes, by how wild it is - from what real greens measure
// (the USGA Green Section and green architects; README "Green slopes"):
//   tilt      the whole green's tilt, rising to the back (a share: 0.02 is
//             2% - an average green), and how far round from straight
//             back-to-front it may lie (radians)
//   humps     how many humps and hollows; hump, how high or deep (metres)
//             and wide (spread, metres: about a quarter of across)
//   tiers     how many tiers, how high each step (metres), and its face's
//             own steepest slope (the tilt adds to it); front, how often
//             a false front, and its rise
//   pin       the steepest a pin is cut on (round the cup) - inside 39 /
//             stimp, the green architects' rule, at stimp 10 and more
//   most      the steepest anywhere on the green, tier faces and all
// A gentle green tilts about 1.5% with a swell or two: the whole of it
// puttable, no tiers, 0.3 - 0.5 m from its highest to its lowest. A
// moderate one tilts 2% with a tier (30 - 45 cm, faces about 10%), humps and
// hollows, now and then a false front: 0.6 - 1 m. A severe one tilts nearly
// 3%, with one or two tiers (45 - 75 cm, faces up to 15%), a false front
// mostly, bigger humps and deeper hollows: a metre and more.
export const GREEN_SLOPES = {
  gentle: { tilt: [0.012, 0.018], cross: 0.35, humps: [1, 2], hump: [0.05, 0.12], spread: [3.5, 5.5], tiers: [0, 0], tier: [0, 0], face: 0, front: 0, frontRise: [0, 0], pin: 0.022, most: 0.05 },
  moderate: { tilt: [0.016, 0.024], cross: 0.5, humps: [2, 3], hump: [0.08, 0.2], spread: [2.8, 4.4], tiers: [1, 1], tier: [0.3, 0.45], face: 0.07, front: 0.35, frontRise: [0.18, 0.28], pin: 0.028, most: 0.1 },
  severe: { tilt: [0.022, 0.03], cross: 0.7, humps: [3, 4], hump: [0.12, 0.32], spread: [2.4, 3.8], tiers: [1, 2], tier: [0.45, 0.72], face: 0.125, front: 0.75, frontRise: [0.3, 0.48], pin: 0.034, most: 0.16 },
};
// How far a pin is kept from a tier's face (metres past its edge), and
// how far round it the slope is looked at (the cup's own ground).
const PIN_CLEAR = 2;
const PIN_ROUND = 0.9;
// Tiers only on a green this big (metres, its smallest radius): a small
// green has no room for two levels.
const TIER_ROOM = 9;

// The slopes on a green for `level` (GREEN_SLOPES): one contour of the
// whole green's tilt with its tiers and false front (putting.mjs
// tiltHeight), then the humps and hollows. pins: the pin, or several (the
// chipping ladder's) - each kept off the faces and on a spot no steeper
// than the level's pin slope, by easing what's tilting it there (the humps
// first, then the tilt), not the whole green. mapped: on real ground, the
// tilt pivots about the green's middle (a designed green's low edge sits on
// the grass). Its own randomness, from one of rand's draws - and as many
// draws of rand as ever, so nothing else on a hole moves for it.
// style: a template green's own (sim/architect.mjs TEMPLATES) - away, its
// tilt falling away to the back (a Redan's); tilt, how much it tilts, and
// cross, how far round from its axis it may lie; tiers
// set where the template has them ([angle off its axis, where across it as
// a share of its reach, rise, width]: a Biarritz's swale, a double
// plateau's levels) instead of at random, and no false front; rot, the way
// it faces (a mapped green's, which has no turn of its own).
export function greenContours(rand, g, pins, level, { mapped = false, style = null } = {}) {
  const look = GREEN_SLOPES[level] ?? GREEN_SLOPES.gentle;
  const own = seeded((Math.floor(rand() * 2 ** 31) ^ 0x51ae3) >>> 0 || 1);
  for (let i = 0; i < 20; i++) rand();
  const list = Array.isArray(pins?.[0]) ? pins : [pins];
  const rot = style?.rot ?? g.rot ?? 0;
  const between = ([a, b]) => a + own() * (b - a);
  const R = (phi) => blobRadius(g, phi - rot);
  let small = Infinity;
  for (let k = 0; k < 24; k++) small = Math.min(small, R((k / 24) * Math.PI * 2));
  // Along a direction from the middle: how far a pin is.
  const along = ([px, pz], n) => (px - g.x) * n[0] + (pz - g.z) * n[1];
  // The tilt: rising to the back, a little round one way or the other.
  const theta = rot + (style?.away ? Math.PI : 0) + (own() - 0.5) * 2 * (style?.cross ?? look.cross);
  let slope = between(style?.tilt ?? look.tilt);
  const tiers = [];
  // A step across the green clear of every pin, or null.
  const stepClear = (n, at, width) => list.every((p) => Math.abs(along(p, n) - at) >= width / 2 + PIN_CLEAR);
  if (style?.tiers) {
    for (const [off, share, rise, width] of style.tiers) {
      const phi = rot + off;
      const n = [Math.cos(phi), Math.sin(phi)];
      const reach = Math.min(R(phi), R(phi + Math.PI));
      tiers.push([n[0], n[1], reach * share, rise, width]);
    }
  } else if (small >= TIER_ROOM && look.tiers[1] > 0) {
    const count = look.tiers[0] + Math.floor(own() * (look.tiers[1] - look.tiers[0] + 1));
    // Mostly back to front (the back the higher), sometimes across or on
    // the slant; two tiers run the same way, one either side of the middle.
    const ways = [0, 0, 0, 0.55, -0.55, Math.PI / 2, -Math.PI / 2];
    const phi = rot + ways[Math.floor(own() * ways.length)] + (own() - 0.5) * 0.3;
    const n = [Math.cos(phi), Math.sin(phi)];
    const reach = Math.min(R(phi), R(phi + Math.PI));
    for (let t = 0; t < count; t++) {
      const rise = between(look.tier);
      const width = (1.5 * rise) / look.face;
      for (let tries = 0; tries < 12; tries++) {
        const span = count === 1 ? [-0.4, 0.4] : t === 0 ? [-0.55, -0.08] : [0.08, 0.55];
        const at = reach * (span[0] + own() * (span[1] - span[0]));
        if (!stepClear(n, at, width)) continue;
        if (tiers.some((q) => Math.abs(q[2] - at) < (q[4] + width) / 2 + 2.5)) continue;
        tiers.push([n[0], n[1], at, rise, width]);
        break;
      }
    }
  }
  // A false front: the front few metres falling away to the approach.
  if (own() < look.front && small >= TIER_ROOM && !style?.tiers && !style?.away) {
    const n = [Math.cos(rot), Math.sin(rot)];
    const rise = between(look.frontRise);
    // (As steep as the level's steepest less the tilt, and clear of a
    // tier running the same way.)
    const width = (1.5 * rise) / ((look.most - look.tilt[1]) * 0.85);
    const at = -R(Math.PI + rot) + width / 2 + 1;
    const apart = tiers.every((q) => q[0] * n[0] + q[1] * n[1] < 0.9 || Math.abs(q[2] - at) >= (q[4] + width) / 2 + 3);
    if (apart && list.every((p) => along(p, n) >= at + width / 2 + PIN_CLEAR + 1)) tiers.push([n[0], n[1], at, rise, width]);
  }
  // Humps and hollows, anywhere on the green, never steeper at their sides
  // than half the level's steepest.
  const humps = [];
  const count = look.humps[0] + Math.floor(own() * (look.humps[1] - look.humps[0] + 1));
  for (let i = 0; i < count; i++) {
    const phi = own() * Math.PI * 2;
    const r = Math.sqrt(own()) * R(phi) * 0.85;
    const a = (own() < 0.5 ? -1 : 1) * between(look.hump);
    const spread = Math.max(between(look.spread), (0.607 * Math.abs(a)) / (look.most * 0.45));
    humps.push({ x: g.x + Math.cos(phi) * r, z: g.z + Math.sin(phi) * r, a, s: spread });
  }
  const make = () => [shapeContour(g, slope, theta, tiers, mapped), ...humps];
  // Each pin on a spot no steeper than the level allows: the humps tilting
  // it eased, then if need be the tilt.
  const steepAt = (contours, [px, pz]) => {
    let most = 0;
    for (const [ox, oz] of [[0, 0], [PIN_ROUND, 0], [-PIN_ROUND, 0], [0, PIN_ROUND], [0, -PIN_ROUND]]) {
      const [gx, gz] = greenGradient({ contours }, px + ox, pz + oz);
      most = Math.max(most, Math.hypot(gx, gz));
    }
    return most;
  };
  for (let i = 0; i < 40; i++) {
    const contours = make();
    const steep = list.filter((p) => steepAt(contours, p) > look.pin);
    if (!steep.length) break;
    for (const p of steep) {
      const pull = humps.map((h) => steepAt([h], p));
      const top = Math.max(0, ...pull);
      if (top > 0.004) humps.forEach((h, k) => pull[k] >= top * 0.3 && (h.a *= 0.85));
      else slope *= 0.92;
    }
  }
  // And nowhere steeper than the level's steepest: the humps eased, then
  // the tilt, then the steps (where a tier crosses a false front, say).
  for (let i = 0; i < 30 && steepest(g, make(), 0.5) > look.most; i++) {
    for (const h of humps) h.a *= 0.88;
    if (i > 6) slope *= 0.96;
    if (i > 10) for (const q of tiers) q[3] *= 0.92;
  }
  return make().map((c) => (c.tilt ? c : { x: round2(c.x), z: round2(c.z), a: Math.round(c.a * 1000) / 1000, s: round2(c.s) }));
}

// The whole green's tilt as a contour (putting.mjs tiltHeight): the plane
// rising `slope` towards `theta`, with its tiers (fitGreenTilt fits it to
// the green). green: 1 marks it the green's own, made with it.
function shapeContour(g, slope, theta, tiers, mapped) {
  const t = (v) => Math.round(v * 1e5) / 1e5;
  const c = { x: round2(g.x), z: round2(g.z), tilt: [t(Math.cos(theta) * slope), t(Math.sin(theta) * slope)], green: 1 };
  if (tiers.length) c.tiers = tiers.map(([nx, nz, at, rise, width]) => [t(nx), t(nz), round2(at), Math.round(rise * 1000) / 1000, round2(width)]);
  return fitGreenTilt(c, g, mapped);
}

// A green's tilt (its plane and tiers) laid over green `g` - as it's made,
// or after the green's been reshaped by hand (holeedits.mjs): full over
// the green and its fringe, easing back to the ground round it over a bank
// - wider the higher the green stands there, so the bank stays gentle. On
// a designed hole the green's lowest edge sits on the grass; on real ground
// (mapped) it pivots about its middle height.
const GREEN_FRINGE = 1.6;
export function fitGreenTilt(c, g, mapped = false) {
  const EDGE = 36;
  const edge = [];
  let lo = Infinity;
  let hi = -Infinity;
  for (let k = 0; k < EDGE; k++) {
    const phi = (k / EDGE) * Math.PI * 2;
    const r = blobRadius(g, phi - (g.rot ?? 0));
    edge.push(round2(r + GREEN_FRINGE));
    const dx = g.x + Math.cos(phi) * r - c.x;
    const dz = g.z + Math.sin(phi) * r - c.z;
    const h = c.tilt[0] * dx + c.tilt[1] * dz + (c.tiers ? tierRise(c.tiers, dx, dz) : 0);
    lo = Math.min(lo, h);
    hi = Math.max(hi, h);
  }
  const lift = mapped ? -(lo + hi) / 2 : -lo;
  const top = mapped ? (hi - lo) / 2 : hi - lo;
  const fade = round2(Math.min(24, Math.max(6, (top * 1.5) / 0.06)));
  // (The edge is round the green's own middle: the contour's put there.)
  const dx = g.x - c.x;
  const dz = g.z - c.z;
  const shift = c.tilt[0] * dx + c.tilt[1] * dz;
  const tiers = c.tiers ? { tiers: c.tiers.map(([nx, nz, at, rise, width]) => [nx, nz, round2(at - (nx * dx + nz * dz)), rise, width]) } : {};
  return { ...c, x: round2(g.x), z: round2(g.z), ...tiers, edge, lift: Math.round((lift + shift) * 1000) / 1000, fade, reach: round2(Math.max(...edge) + fade), low: mapped ? 1 : 0 };
}

// Every green of a course given new slopes at `level` (GREEN_SLOPES) - its
// outline, pin and everything else as they are, hand changes still laid
// on top: a designed hole's, or one on made-up hills (whose own ground is
// eased flat round the green, so these are all the slopes it has; they
// pivot about its middle). A real course's greens keep their real ground.
// pinsOf(hole): the pins to keep fair (default its own; the designer adds
// one moved by hand). Seeded from each hole, so the same every time.
export function reslopeGreens(course, level, pinsOf = (h) => [h.layout.pin]) {
  if (!GREEN_SLOPES[level] || !course?.holes?.length || course.source?.kind === "osm") return course;
  const holes = course.holes.map((h) => {
    const L = h.layout;
    if (!L?.green || !L.pin) return h;
    const rand = seeded(((h.spec?.seed ?? L.number ?? 1) ^ 0x5109e) >>> 0 || 1);
    const contours = greenContours(rand, L.green, pinsOf(h), level, { mapped: L.source === "map" });
    return { ...h, spec: { ...h.spec, options: { ...(h.spec?.options ?? {}), contours: level } }, layout: { ...L, contours } };
  });
  return { ...course, holes };
}

// The steepest slope on a green (a share), on a 1 m grid over it.
export function steepest(g, contours, step = 1) {
  let most = 0;
  const R = Math.max(g.rx ?? 0, g.rz ?? 0) + 2;
  for (let x = g.x - R; x <= g.x + R; x += step) {
    for (let z = g.z - R; z <= g.z + R; z += step) {
      if (!insideBlob(g, x, z)) continue;
      const [gx, gz] = greenGradient({ contours }, x, z);
      most = Math.max(most, Math.hypot(gx, gz));
    }
  }
  return most;
}

// ---- What's under the ball ------------------------------------------------------

export const LIES = {
  tee: { name: "Tee", decel: 1.5 },
  fairway: { name: "Fairway", decel: 1.5 },
  fringe: { name: "Fringe", decel: 1.6 },
  green: { name: "Green", decel: null },
  semi: { name: "First cut", decel: 3.8 },
  rough: { name: "Rough", decel: 5.5 },
  deep: { name: "Deep rough", decel: 9 },
  trees: { name: "Trees", decel: 8 },
  bunker: { name: "Fairway bunker", decel: 14 },
  greenside: { name: "Greenside bunker", decel: 14 },
  // A waste area (sim/wastearea.mjs): firm sand and scrub - a ball runs
  // on a little, not as far as on grass.
  waste: { name: "Waste area", decel: 5 },
  water: { name: "Water", decel: 30 },
  // A cart path: hard and smooth, so a ball runs a long way on it.
  path: { name: "Cart path", decel: 1 },
};

// Fairway half-width at s along the hole, with a natural wobble and rounded
// ends. Zero outside the fairway. `stretch` (1 unless set) lengthens the
// wobble and the rounding with it, so a whole hole drawn bigger or smaller
// (the driving challenge's, scaled to each player's drive) keeps exactly
// the same shape.
// side: which edge (-1 left, +1 right of the line, as nearest's d), or 0
// for the two edges' mean. A fairway with a natural line (f.natural: every
// one designed from October 2026 on, or set so by hand) has each edge
// wandering in and out on its own; one changed by hand (f.adj: the hole
// builder's Fairway brush, holeedits.mjs "edge") is that much wider or
// narrower there.
export function fairwayHalfWidth(f, s, side = 0) {
  if (s < f.from || s > f.to) return 0;
  const k = f.stretch ?? 1;
  const cap = Math.min(s - f.from, f.to - s);
  const round = cap < 12 * k ? Math.sqrt(cap / (12 * k)) : 1;
  let w = f.half * (f.shape ? widthShape(f.shape, s / k) : 1) * (1 + 0.1 * Math.sin(s / (37 * k) + f.phase) + 0.05 * Math.sin(s / (13 * k) + f.phase * 2));
  if (f.natural && side) w *= 1 + side * (0.13 * Math.sin(s / (53 * k) + f.phase * 3) + 0.07 * Math.sin(s / (19 * k) + f.phase * 5));
  if (f.adj) w += side ? edgeAdj(f.adj, s, side) : (edgeAdj(f.adj, s, -1) + edgeAdj(f.adj, s, 1)) / 2;
  return Math.max(0, w) * round;
}

// A fairway planned wider here and narrower there (a strategic hole's,
// sim/architect.mjs): [[s, k], ...] - at s metres along the line its width
// is k times its own, in proportion between, as the ends beyond.
export function widthShape(shape, s) {
  if (s <= shape[0][0]) return shape[0][1];
  for (let i = 1; i < shape.length; i++) {
    const [s1, k1] = shape[i];
    if (s <= s1) {
      const [s0, k0] = shape[i - 1];
      return k0 + ((k1 - k0) * (s - s0)) / (s1 - s0 || 1);
    }
  }
  return shape[shape.length - 1][1];
}

// A hand change to an edge along the hole (holeedits.mjs "edge"): { from,
// step, l: [...], r: [...] } - metres more (or less) every `step` metres
// along the line from `from`, each side; between, in proportion.
export const EDGE_STEP = 5;
export const EDGE_FROM = -40;
export function edgeAdj(adj, s, side) {
  const list = side < 0 ? adj.l : adj.r;
  if (!list?.length) return 0;
  const u = (s - (adj.from ?? EDGE_FROM)) / (adj.step ?? EDGE_STEP);
  const i = Math.floor(u);
  if (i < 0 || i >= list.length) return 0;
  const a = list[i] ?? 0;
  const b = list[i + 1] ?? 0;
  return a + (b - a) * (u - i);
}

// The rough's lines along a designed hole, each side its own way, wavy
// rather than ruled (the owner: "varying the semi and deep rough away from
// channels ... areas where it is straight into deep rough or areas with
// much wider areas of semi rough or even no deep ... they should start
// initially more wavy anyway"):
//   firstCutWidth   how wide the first cut is past the fairway's edge: a
//                   metre or so in places, up to about 9 m in others
//   deepRoughFrom   how far from the line deep rough begins: now and then
//                   right past the first cut, now and then not at all
//                   (past the tree line), mostly DEEP_ROUGH short of it
// From the hole's own fairway (its phase), the same every time, and any
// hand changes (hole.edges: the Rough tool). The Driving Challenge's holes
// (bandScale) keep straight bands, and a hole from a map has its own.
const wavy = (hole) => !hole.bandScale && hole.source !== "map";
const roughSeed = (hole) => Math.round((hole.fairway?.phase ?? 1) * 1e5) % 100003;
export function firstCutWidth(hole, s, side) {
  const band = hole.bandScale ?? 1;
  let w = FIRST_CUT * band;
  if (wavy(hole)) {
    const n = lineNoise(s / 55 + (side > 0 ? 70 : 0), roughSeed(hole));
    w = FIRST_CUT * (0.5 + 3.2 * easeStep(0.6, 0.95, n)) + 0.35 * Math.sin(s / 7 + side * 2 + roughSeed(hole));
  }
  if (hole.edges?.cut) w += edgeAdj(hole.edges.cut, s, side);
  // (Never narrower than a mower's pass: MOW_PASS.)
  return Math.max(MOW_PASS * band, w);
}
export function deepRoughFrom(hole, s, side, half = fairwayHalfWidth(hole.fairway, s, side)) {
  const band = hole.bandScale ?? 1;
  const base = hole.treeLine - DEEP_ROUGH * band;
  let d = base;
  if (wavy(hole)) {
    const seed = roughSeed(hole) + 7;
    const n = lineNoise(s / 70 + (side > 0 ? 40 : 0), seed);
    // In right past the first cut, only along the fairway.
    const near = half + firstCutWidth(hole, s, side) + 1;
    const inward = easeStep(0.3, 0.1, n) * easeStep(0, 4, half);
    // Out past the tree line: no deep rough there.
    const outward = easeStep(0.72, 0.9, n);
    d = base + (near - base) * inward + (hole.treeLine + 1 - base) * outward + 2 * Math.sin(s / 13 + side + seed);
  }
  if (hole.edges?.deep) d += edgeAdj(hole.edges.deep, s, side);
  return Math.max(half + firstCutWidth(hole, s, side), d);
}
const easeStep = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// The rough in bands out from the fairway: a first cut along its edge, the
// rough, and deep rough in the last stretch before the trees (metres).
export const FIRST_CUT = 2.5;
export const DEEP_ROUGH = 9;
// A bunker whose middle is this close to the green's edge is a greenside one.
const GREENSIDE = 15;

// A course's holes have other tee boxes than the one their line starts at
// (sim/tees.mjs teeSpots, kept as hole.teeSpots: [{ colour, at, ahead }]):
// a box this far either side of each plays as tee (metres) - 9 m square,
// square to the hole as the first tee's is.
export const TEE_REACH = 4.5;
export function onTeeBox(spots, x, z) {
  return !!spots?.some((t) => Math.abs(x - t.at[0]) < TEE_REACH && Math.abs(z - t.at[1]) < TEE_REACH);
}

// The fringe round a green (metres past its edge).
export const FRINGE = 1.6;
// The mown grass round each tee box and round the green (the owner, 19
// October 2026: "With tee boxes and greens the line between long grass and
// short grass can be clean. They would get cut in straight lines or around
// the green in a perfect channel between rough first cut fairway etc."): a
// band of first cut where the rough or the deep rough would be, `tee`
// metres round each tee box - straight along its sides, square at its
// corners - and `green` metres past the green's fringe, following its
// outline. It plays as first cut (surfaceAt) and is drawn as it (course/
// holebuild.js), so the long grass and the tufts, which grow only in the
// rough, start at a clean line. (As far as the tufts keep off a tee:
// sim/tufts.mjs TUFT_TEE_GAP.)
export const SURROUND = { tee: 2, green: 1.5 };
// The tee boxes drawn on a hole, [x0, x1, z0, z1] in its frame: the first,
// 12 x 14 m, and the square TEE_REACH round each other spot outside it.
const boxesOf = new WeakMap();
export function teeBoxes(spots) {
  const key = Array.isArray(spots) ? spots : null;
  if (key && boxesOf.has(key)) return boxesOf.get(key);
  const boxes = [[-6, 6, -7, 7]];
  for (const t of spots ?? []) {
    const [cx, cz] = t.at;
    if (Math.abs(cx) < 6 && Math.abs(cz) < 7) continue;
    boxes.push([cx - TEE_REACH, cx + TEE_REACH, cz - TEE_REACH, cz + TEE_REACH]);
  }
  if (key) boxesOf.set(key, boxes);
  return boxes;
}
// Is (x, z) within the mown surround of a tee box (or between two close
// together: teeBridges) or the green?
export function inSurround(hole, x, z) {
  const t = SURROUND.tee;
  for (const [x0, x1, z0, z1] of teeBoxes(hole.teeSpots)) if (x > x0 - t && x < x1 + t && z > z0 - t && z < z1 + t) return true;
  for (const [x0, x1, z0, z1] of teeBridges(hole.teeSpots)) if (x > x0 && x < x1 && z > z0 && z < z1) return true;
  return !!hole.green && insideBlob(hole.green, x, z, FRINGE + SURROUND.green);
}

// The mown grass flowing as a mower leaves it (the owner, 23 October 2026:
// "the odd section where fairway and greens end up with a very small patch
// where it doesn't flow correctly. The way grass will be cut there will
// always be a smooth transition, usually a mower's width of grass cutting
// lengths"): rough left between the green's channel and the fairway's
// first cut (each side of the approach), narrower than MOW_JOIN, is mown
// too, the two meeting in a smooth curve; tee boxes
// that close share their surround (teeBridges); and the first cut is never
// narrower than a mower's pass (MOW_PASS). Played as first cut, drawn as
// it (course/holebuild.js), the rough's grass cut off at its edge (sim/
// mowncut.mjs) and on the map (coursemap.js).
export const MOW_JOIN = 3;
export const MOW_PASS = 1.2;
// (A smooth max of two measures of how far into a shape a point is: their
// union, the gap between them filled where it's narrower than MOW_JOIN -
// up to k/4 added where the two are level.)
const MOW_K = 2 * MOW_JOIN;
export function smoothMax(a, b, k = MOW_K) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.max(a, b) + (h * h * k) / 4;
}
// How far in from a shape's edge (x, z) is (metres; negative outside):
// out from its middle as insideBlob reads a blob, square to the edge of a
// mapped shape.
export function shapeIn(shape, x, z) {
  if (shape.poly) return insidePolygon(shape.poly, x, z) ? distanceToEdge(shape.poly, x, z) : -distanceToEdge(shape.poly, x, z);
  const dx = x - shape.x;
  const dz = z - shape.z;
  const c = Math.cos(-(shape.rot ?? 0));
  const s = Math.sin(-(shape.rot ?? 0));
  const u = dx * c - dz * s;
  const v = dx * s + dz * c;
  return blobRadius(shape, Math.atan2(v, u)) - Math.hypot(u, v);
}
// How far into the fairway's first cut (x, z) is (metres; negative out
// past it; -Infinity where there's no fairway beside it).
// (Round its ends too, as a mower goes round them: past either end, how
// far into the first cut that far out from the end's rounded tip.)
export function firstCutIn(hole, x, z, path = makePath(hole.path)) {
  if (!hole.fairway) return -Infinity;
  const n = nearest(path, x, z);
  const side = n.d < 0 ? -1 : 1;
  return fairwayBand(hole, n.s, Math.abs(n.d), side, fairwayHalfWidth(hole.fairway, n.s, side));
}
export function fairwayBand(hole, s, off, side, half) {
  const f = hole.fairway;
  let band = half > 0 ? half + firstCutWidth(hole, s, side) - off : -Infinity;
  if (!f || f.to <= f.from) return band;
  // Near either end, where it rounds off quickly: from the nearest part
  // of it, not only square across from here (a notch of rough was left
  // beside its last few metres). (Over its rounding's length, stretched
  // with a hole drawn to a player's drive: fairwayHalfWidth.)
  const reach = 12 * (f.stretch ?? 1);
  for (const [end, back] of [[f.to, -1], [f.from, 1]]) {
    const inward = (s - end) * back;
    const cut = firstCutWidth(hole, end, side);
    if (inward > reach || inward < -(cut + 0.5 * (hole.bandScale ?? 1))) continue;
    let near = Infinity;
    for (let k = 0; k <= 12; k++) {
      const at = end + (back * k * reach) / 12;
      near = Math.min(near, Math.hypot(s - at, Math.max(0, off - fairwayHalfWidth(f, at, side))));
    }
    band = Math.max(band, cut - near);
  }
  return band;
}
// How far into the mown grass round the green and its approach (x, z) is
// (metres; negative out in the rough): its channel, joined to the
// fairway's first cut beside it (band: firstCutIn there).
export function greenMown(hole, x, z, band = -Infinity) {
  const g = hole.green;
  if (!g) return band;
  const m = shapeIn(g, x, z) + FRINGE + SURROUND.green;
  // (Its reach scaled with a hole drawn to a player's drive: bandScale.)
  const k = MOW_K * (hole.bandScale ?? 1);
  // (Well out from it, nothing it could join: just the band.)
  if (m < -2 * k) return band;
  return smoothMax(m, band, k);
}
// How far out from (x, z) along (ux, uz) the mown grass round the green
// reaches into what would be rough (greenMown), looking from `from`
// metres out, no further than `most`: stopping at the fairway's own first
// cut (drawn with the fairway) and at sand or water. For drawing the
// green's channel out over it (course/holebuild.js, coursemap.js).
export function greenMownReach(hole, x, z, ux, uz, from, most = 14, path = makePath(hole.path)) {
  const inside = (d) => {
    const px = x + ux * d;
    const pz = z + uz * d;
    const band = firstCutIn(hole, px, pz, path);
    if (band >= 0) return null;
    if (hole.bunkers.some((b) => insideBlob(b, px, pz)) || hole.water.some((w) => insideBlob(w, px, pz))) return null;
    return greenMown(hole, px, pz, band) > 0;
  };
  let d = from;
  for (; d < most; d += 0.25) {
    const k = inside(d + 0.25);
    if (k === null) return d + 0.25;
    if (!k) break;
  }
  if (d >= most) return most;
  // (Its edge found more finely between the last two looks.)
  let lo = d;
  let hi = d + 0.25;
  for (let i = 0; i < 6; i++) {
    const mid = (lo + hi) / 2;
    if (inside(mid)) lo = mid;
    else hi = mid;
  }
  return lo;
}
// Tee boxes close enough to share their surround: for each two whose
// surrounds come within MOW_JOIN of each other, side by side or one ahead
// of the other, the strip between them across the stretch they face each
// other over - [x0, x1, z0, z1], in the hole's frame, as teeBoxes.
const bridgesOf = new WeakMap();
export function teeBridges(spots) {
  const key = Array.isArray(spots) ? spots : null;
  if (key && bridgesOf.has(key)) return bridgesOf.get(key);
  const t = SURROUND.tee;
  const grown = teeBoxes(spots).map(([x0, x1, z0, z1]) => [x0 - t, x1 + t, z0 - t, z1 + t]);
  const bridges = [];
  for (let i = 0; i < grown.length; i++) {
    for (let j = i + 1; j < grown.length; j++) {
      const [a, b] = [grown[i], grown[j]];
      const gapX = Math.max(b[0] - a[1], a[0] - b[1]);
      const gapZ = Math.max(b[2] - a[3], a[2] - b[3]);
      if (gapX > 0 && gapX <= MOW_JOIN && gapZ < 0) bridges.push([Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[2], b[2]), Math.min(a[3], b[3])]);
      else if (gapZ > 0 && gapZ <= MOW_JOIN && gapX < 0) bridges.push([Math.max(a[0], b[0]), Math.min(a[1], b[1]), Math.min(a[3], b[3]), Math.max(a[2], b[2])]);
    }
  }
  if (key) bridgesOf.set(key, bridges);
  return bridges;
}
// The rough or the deep rough at (x, z), or the first cut where it's mown
// round a tee box or the green.
// (And deep rough kept down along a cart path, its verge: sim/paths.mjs
// VERGE.)
const mown = (hole, x, z, lie) => (inSurround(hole, x, z) ? "semi" : lie === "deep" && onVerge(hole.paths, x, z) ? "rough" : lie);

// Do two outlines ([[x, z], ...]) meet - either's edge inside the other?
export function outlinesMeet(a, b) {
  return a.some(([x, z]) => insidePolygon(b, x, z)) || b.some(([x, z]) => insidePolygon(a, x, z));
}

// Does a piece of water reach onto a green - the hole's, or another of a
// mapped hole's? Water that does gives way to the green and its fringe
// (sim/greenfirst.mjs); water that stops short of the green - a pond held
// up to it by a wall - is left as it was. (Worked out once a shape.)
const reaching = new WeakMap();
export function reachesGreen(hole, w) {
  const had = reaching.get(w);
  if (had && had.green === hole.green && had.greens === hole.greens) return had.value;
  const edge = (s) => s.poly ?? blobOutline(s, 64);
  const greens = hole.green ? [edge(hole.green), ...(hole.greens ?? [])] : [];
  const value = greens.some((g) => outlinesMeet(g, edge(w)));
  reaching.set(w, { green: hole.green, greens: hole.greens, value });
  return value;
}

// What surface is at (x, z) on a hole.
export function surfaceAt(hole, x, z, path = makePath(hole.path)) {
  if (hole.source === "map") return mappedSurfaceAt(hole, x, z, path);
  // The green first; and water that reaches onto it gives way to its
  // fringe too (sim/greenfirst.mjs), and to an island green's causeway to
  // land, which plays as fairway (sim/causeway.mjs).
  if (insideBlob(hole.green, x, z)) return "green";
  const fringe = insideBlob(hole.green, x, z, FRINGE);
  const causeway = !fringe && onCauseway(hole, x, z);
  if (hole.water.some((w) => insideBlob(w, x, z) && !((fringe || causeway) && reachesGreen(hole, w)))) return "water";
  if (causeway) return "fairway";
  // A bunker set by hand to meet the green, or to sit just off it
  // (holeedits.mjs), is sand right up to its edge, fringe or not - and so
  // is one with a wall (sim/walls.mjs), dropping away at its edge.
  // (A waste area - sim/wastearea.mjs - plays as its own ground, under any
  // bunker lying in it.)
  const bunker = sandAt(hole.bunkers, (b) => (!fringe || b.join != null || b.wall) && insideBlob(b, x, z));
  if (fringe && !bunker) return "fringe";
  if (bunker) {
    if (bunker.waste) return "waste";
    const g = hole.green;
    return Math.hypot(bunker.x - g.x, bunker.z - g.z) < Math.max(g.rx, g.rz) + GREENSIDE ? "greenside" : "bunker";
  }
  // A cart path, over whatever grass it crosses (sim/paths.mjs).
  if (hole.paths && onPath(hole, x, z)) return "path";
  if ((Math.abs(x) < 6 && Math.abs(z) < 7) || onTeeBox(hole.teeSpots, x, z)) return "tee";
  // A fairway added by hand (holeedits "a+"): fairway, wherever it is.
  const added = hole.extraFairways;
  if (added?.length && added.some((f) => insideBlob(f, x, z))) return "fairway";
  const n = nearest(path, x, z);
  const off = Math.abs(n.d);
  const side = n.d < 0 ? -1 : 1;
  const half = fairwayHalfWidth(hole.fairway, n.s, side);
  if (off <= half) return "fairway";
  // (And its first cut round it, as the fairway's: FIRST_CUT.)
  if (added?.length && added.some((f) => insideBlob(f, x, z, FIRST_CUT))) return "semi";
  // Past the rough a links hole's long grass plays as deep rough; anyone
  // else's is the trees.
  if (off > hole.treeLine) return hole.links ? mown(hole, x, z, "deep") : "trees";
  // The bands wander along a course's hole; the driving challenge scales
  // straight ones with the hole (bandScale: firstCutWidth, deepRoughFrom).
  const band = fairwayBand(hole, n.s, off, side, half);
  if (band >= 0) return "semi";
  // (The rough left between it and the green's channel mown too, where
  // it's narrow: greenMown.)
  if (greenMown(hole, x, z, band) > 0) return "semi";
  // (Mown round the tee boxes and the green: SURROUND.)
  if (off > deepRoughFrom(hole, n.s, side, half)) return mown(hole, x, z, "deep");
  return mown(hole, x, z, "rough");
}

// ---- Mapped holes ------------------------------------------------------------------

// On a hole rebuilt from a map, deep rough starts this far from the line of
// play (there's no generated tree line to measure from).
export const MAPPED_DEEP = 38;
// The lie codes a mapped hole's raster stores. New ones go on the end, so
// no code already in use changes.
export const LIE_CODES = ["rough", "semi", "fairway", "deep", "trees", "tee", "fringe", "green", "bunker", "greenside", "water", "path", "waste"];
const CODE = Object.fromEntries(LIE_CODES.map((l, i) => [l, i]));

// The bunker a spot is in (`inside` says), a bunker before a waste area
// (sim/wastearea.mjs) it lies in; undefined in neither.
function sandAt(bunkers, inside) {
  let waste;
  for (const b of bunkers) {
    if (!inside(b)) continue;
    if (!b.waste) return b;
    waste ??= b;
  }
  return waste;
}

function greensideOf(hole, b) {
  const g = hole.green;
  return Math.hypot(b.x - g.x, b.z - g.z) < Math.max(g.rx, g.rz) + GREENSIDE;
}

// Under the crown of a real tree found in LiDAR (see lidartrees.mjs), on a
// hole showing them: the nearest metre of its canopy mask.
const underCanopy = (hole, x, z) => hole.treesFrom === "lidar" && !!hole.canopy && maskAt(hole.canopy, "trees", x, z);
// In a mapped wood that plays as trees: everywhere, unless the hole shows
// real trees and the surface model saw this spot - then only its crowns
// count (a clearing in the wood is open ground).
const inWoods = (hole, x, z) =>
  (hole.woods ?? []).some((w) => insideOutline(w, x, z)) && !(hole.treesFrom === "lidar" && !!hole.canopy && dsmDecides(hole.canopy, x, z));

// The surface on a mapped hole, from its real shapes. The same order of
// precedence as lieRaster() paints in, top first.
function mappedSurfaceAt(hole, x, z, path) {
  // The greens first; and water that reaches onto one gives way to their
  // fringes too (sim/greenfirst.mjs: a mapped pond running across a green),
  // and to an island green's causeway (sim/causeway.mjs).
  const greens = [hole.green.poly, ...(hole.greens ?? [])];
  if (greens.some((g) => insideOutline(g, x, z))) return "green";
  const fringe = greens.some((g) => nearOutline(g, x, z, FRINGE));
  const causeway = !fringe && onCauseway(hole, x, z);
  if (hole.water.some((w) => insideOutline(w.poly, x, z) && !((fringe || causeway) && reachesGreen(hole, w)))) return "water";
  if (causeway) return "fairway";
  const bunker = sandAt(hole.bunkers, (b) => insideOutline(b.poly, x, z));
  if (bunker) return bunker.waste ? "waste" : greensideOf(hole, bunker) ? "greenside" : "bunker";
  if (fringe) return "fringe";
  if (hole.paths && onPath(hole, x, z)) return "path";
  if (Math.hypot(x, z) < 5 || onTeeBox(hole.teeSpots, x, z) || (hole.tees ?? []).some((t) => insideOutline(t, x, z))) return "tee";
  const fairways = hole.fairways ?? [];
  if (fairways.some((f) => insideOutline(f, x, z))) return "fairway";
  if (fairways.some((f) => nearOutline(f, x, z, FIRST_CUT))) return "semi";
  if (inWoods(hole, x, z) || underCanopy(hole, x, z)) return "trees";
  // (Mown round the tees and the greens: SURROUND; and between mown
  // ground that comes close: mappedJoin.)
  if (inMappedSurround(hole, x, z) || mappedJoin(hole)(x, z) > 0) return "semi";
  return Math.abs(nearest(path, x, z).d) > MAPPED_DEEP && !onVerge(hole.paths, x, z) ? "deep" : "rough";
}

// A mapped hole's tees as shapes, for the mown surround round them
// (SURROUND): its mapped tees, the square round each other spot (TEE_REACH)
// and the teeing spot at the start of the line (its 5 m, as 32 points).
const mappedTees = new WeakMap();
export function mappedTeeShapes(hole) {
  let shapes = mappedTees.get(hole);
  if (shapes) return shapes;
  const R = TEE_REACH;
  const spots = (hole.teeSpots ?? []).map(({ at: [x, z] }) => [[x - R, z - R], [x + R, z - R], [x + R, z + R], [x - R, z + R]]);
  const start = Array.from({ length: 32 }, (_, i) => [5 * Math.cos((i * Math.PI) / 16), 5 * Math.sin((i * Math.PI) / 16)]);
  shapes = [...(hole.tees ?? []), ...spots, start];
  mappedTees.set(hole, shapes);
  return shapes;
}
// A mapped hole's thin strips and corners of rough between mown ground,
// mown (the owner, 23 October 2026: "The way grass will be cut there will
// always be a smooth transition, usually a mowers width"): its fairways
// with their first cut, its tees with their surround and its greens with
// their fringe and surround (as mappedSurfaceAt has them), joined as a
// designed hole's are (smoothMax) - where two come within MOW_JOIN of each
// other, the gap between, and the corner where they meet, mown too. A
// measure of how far into the joined ground (x, z) is (metres; below 0
// outside it), only where two of them are in reach (-Infinity elsewhere:
// no gap to fill). The tees are one: a tee's mapped shape, the square round its
// spot and the teeing circle lie over each other, and joined they swelled
// round it. Kept for each hole as it is.
const mappedJoins = new WeakMap();
export function mappedJoin(hole) {
  let at = mappedJoins.get(hole);
  if (at) return at;
  const part = (out) => (poly) => ({ poly, out, box: polygonBounds(poly), reach: out + 1.25 * MOW_K });
  const groups = [
    ...(hole.fairways ?? []).filter((p) => p?.length > 2).map((p) => [part(FIRST_CUT)(p)]),
    mappedTeeShapes(hole).filter((p) => p?.length > 2).map(part(SURROUND.tee)),
    ...[hole.green.poly, ...(hole.greens ?? [])].filter((p) => p?.length > 2).map((p) => [part(FRINGE + SURROUND.green)(p)]),
  ].filter((g) => g.length);
  const near = [];
  const inReach = (q, x, z) => x >= q.box.x0 - q.reach && x <= q.box.x1 + q.reach && z >= q.box.z0 - q.reach && z <= q.box.z1 + q.reach;
  at = (x, z) => {
    near.length = 0;
    for (const g of groups) if (g.some((q) => inReach(q, x, z))) near.push(g);
    if (near.length < 2) return -Infinity;
    let v = -Infinity;
    for (const g of near) {
      let t = -Infinity;
      for (const q of g) if (inReach(q, x, z)) t = Math.max(t, q.out + (insidePolygon(q.poly, x, z) ? distanceToEdge(q.poly, x, z) : -distanceToEdge(q.poly, x, z)));
      v = v === -Infinity ? t : smoothMax(v, t);
    }
    return v;
  };
  mappedJoins.set(hole, at);
  return at;
}

// Is (x, z) within a mapped hole's mown surround of a tee or a green?
function inMappedSurround(hole, x, z) {
  if ([hole.green.poly, ...(hole.greens ?? [])].some((g) => nearOutline(g, x, z, FRINGE + SURROUND.green))) return true;
  return mappedTeeShapes(hole).some((p) => nearOutline(p, x, z, SURROUND.tee));
}

// A mapped hole's lies on a grid (0.5 m), so play can look one up at every
// step of a roll without testing dozens of shapes. Built in the same order
// of precedence as mappedSurfaceAt, and matching it exactly at every cell
// centre, but quickly: shapes are filled row by row, the first-cut and
// fringe bands found with a distance transform and checked exactly only
// where they end, and the deep-rough line worked out on a coarse grid and
// checked exactly only near it.
export function lieRaster(hole, path = makePath(hole.path), cell = 0.5) {
  const r = hole.region;
  const nx = Math.ceil((r.x1 - r.x0) / cell) + 1;
  const nz = Math.ceil((r.z1 - r.z0) / cell) + 1;
  const n = nx * nz;
  const lie = new Uint8Array(n);
  const X = (ix) => r.x0 + ix * cell;
  const Z = (iz) => r.z0 + iz * cell;

  // Rough, or deep rough away from the line of play: coarse, then exact
  // near the boundary.
  const step = 8;
  const cx = Math.ceil(nx / step) + 1;
  const cz = Math.ceil(nz / step) + 1;
  const coarse = new Float32Array(cx * cz);
  for (let j = 0; j < cz; j++) for (let i = 0; i < cx; i++) coarse[j * cx + i] = nearestDistance(path, X(i * step), Z(j * step));
  const slack = step * cell * 1.5;
  // (A block of cells between the same four coarse points, all of them
  // well clear of the deep rough's line - most of a hole - is the one lie
  // at once: what's between them can't be nearer the line than the nearest
  // of them, the sums' rounding a hair (SURE) at the most. Only finite
  // distances: a hole with no line falls through to the sums as before.)
  const SURE = 1e-6;
  for (let iz = 0; iz < nz; iz++) {
    // (What's the same along a row worked out once for it: the same sums.)
    const j0 = Math.floor(iz / step);
    const v = iz / step - j0;
    const r0 = Math.min(cz - 1, j0) * cx;
    const r1 = Math.min(cz - 1, j0 + 1) * cx;
    const z = Z(iz);
    const row = iz * nx;
    for (let ix = 0; ix < nx; ix++) {
      const i0 = Math.floor(ix / step);
      const c0 = Math.min(cx - 1, i0);
      const c1 = Math.min(cx - 1, i0 + 1);
      const p00 = coarse[r0 + c0];
      const p01 = coarse[r0 + c1];
      const p10 = coarse[r1 + c0];
      const p11 = coarse[r1 + c1];
      if (ix % step === 0) {
        const lo = Math.min(p00, p01, p10, p11);
        const hi = Math.max(p00, p01, p10, p11);
        const sure = !Number.isFinite(hi) || !Number.isFinite(lo) ? -1 : lo > MAPPED_DEEP + slack + SURE ? CODE.deep : hi < MAPPED_DEEP - slack - SURE ? CODE.rough : -1;
        if (sure >= 0) {
          const end = Math.min(nx, ix + step);
          lie.fill(sure, row + ix, row + end);
          ix = end - 1;
          continue;
        }
      }
      const u = ix / step - i0;
      const d = p00 * (1 - u) * (1 - v) + p01 * u * (1 - v) + p10 * (1 - u) * v + p11 * u * v;
      const exact = Math.abs(d - MAPPED_DEEP) < slack ? nearestDistance(path, X(ix), z) : d;
      lie[row + ix] = exact > MAPPED_DEEP ? CODE.deep : CODE.rough;
    }
  }

  // Which cells a polygon covers, by rows: the same even-odd rule as
  // insidePolygon, at each cell's centre.
  const fill = (poly, mark) => {
    const b = polygonBounds(poly);
    const iz0 = Math.max(0, Math.ceil((b.z0 - r.z0) / cell));
    const iz1 = Math.min(nz - 1, Math.floor((b.z1 - r.z0) / cell));
    const xs = [];
    for (let iz = iz0; iz <= iz1; iz++) {
      const z = Z(iz);
      xs.length = 0;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, zi] = poly[i];
        const [xj, zj] = poly[j];
        if (zi > z !== zj > z) xs.push(((xj - xi) * (z - zi)) / (zj - zi) + xi);
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const ix0 = Math.max(0, Math.ceil((xs[k] - r.x0) / cell));
        const ix1 = Math.min(nx - 1, Math.floor((xs[k + 1] - r.x0 - 1e-9) / cell));
        for (let ix = ix0; ix <= ix1; ix++) {
          // Exactly on a crossing: leave it to the point test.
          const x = X(ix);
          if (x > xs[k] && x < xs[k + 1]) mark(iz * nx + ix);
          else if (insidePolygon(poly, x, z)) mark(iz * nx + ix);
        }
      }
    }
  };
  const maskOf = (polys) => {
    const m = new Uint8Array(n);
    for (const p of polys) fill(p, (i) => (m[i] = 1));
    return m;
  };
  // A chamfer distance's two passes over the grid, in place (d: 0 at the
  // cells measured from, huge elsewhere; after, cells from the nearest).
  // (Each cell's best held in hand while its neighbours are looked at, and
  // a smaller one taken as the grid would keep it - Math.fround, as d is
  // 32-bit: the very same numbers as storing each step, fewer reads and
  // writes. The grid's every cell, twice, for each band: worth it.)
  const sweep = (d) => {
    const a = 1;
    const b = Math.SQRT2;
    const f = Math.fround;
    for (let iz = 0; iz < nz; iz++) {
      const row = iz * nx;
      for (let ix = 0; ix < nx; ix++) {
        const i = row + ix;
        let v = d[i];
        let c;
        if (ix > 0 && (c = d[i - 1] + a) < v) v = f(c);
        if (iz > 0) {
          if ((c = d[i - nx] + a) < v) v = f(c);
          if (ix > 0 && (c = d[i - nx - 1] + b) < v) v = f(c);
          if (ix < nx - 1 && (c = d[i - nx + 1] + b) < v) v = f(c);
        }
        d[i] = v;
      }
    }
    for (let iz = nz - 1; iz >= 0; iz--) {
      const row = iz * nx;
      for (let ix = nx - 1; ix >= 0; ix--) {
        const i = row + ix;
        let v = d[i];
        let c;
        if (ix < nx - 1 && (c = d[i + 1] + a) < v) v = f(c);
        if (iz < nz - 1) {
          if ((c = d[i + nx] + a) < v) v = f(c);
          if (ix < nx - 1 && (c = d[i + nx + 1] + b) < v) v = f(c);
          if (ix > 0 && (c = d[i + nx - 1] + b) < v) v = f(c);
        }
        d[i] = v;
      }
    }
  };
  // How far each cell is from the nearest set in `mask`, in cells (a
  // chamfer distance: near enough, never too far).
  const chamfer = (mask) => {
    const d = new Float32Array(n);
    for (let i = 0; i < n; i++) d[i] = mask[i] ? 0 : 1e9;
    sweep(d);
    return d;
  };
  // Cells within `band` metres of a mask's shapes (outside them), exact at
  // the far edge of the band.
  const bandAround = (mask, polys, band, code, over = null) => {
    // Chamfer distance, in cells, from the mask - and from the cells the
    // shapes' edges run through, or a sharp corner poking out between cell
    // centres would be too far from any of them for the band round it.
    const INF = 1e9;
    const d = new Float32Array(n).fill(INF);
    for (let i = 0; i < n; i++) if (mask[i]) d[i] = 0;
    for (const p of polys) {
      for (let k = 0, j = p.length - 1; k < p.length; j = k++) {
        const steps = Math.ceil((Math.hypot(p[k][0] - p[j][0], p[k][1] - p[j][1]) / cell) * 2) + 1;
        for (let t = 0; t <= steps; t++) {
          const ix = Math.round((p[j][0] + ((p[k][0] - p[j][0]) * t) / steps - r.x0) / cell);
          const iz = Math.round((p[j][1] + ((p[k][1] - p[j][1]) * t) / steps - r.z0) / cell);
          if (ix >= 0 && iz >= 0 && ix < nx && iz < nz) d[iz * nx + ix] = 0;
        }
      }
    }
    sweep(d);
    const inner = band / cell - 1.5;
    const outer = band / cell + 1.5;
    for (let i = 0; i < n; i++) {
      if (mask[i] || d[i] > outer) continue;
      if (over && !over(lie[i])) continue;
      const x = X(i % nx);
      const z = Z(Math.floor(i / nx));
      if (d[i] <= inner || polys.some((p) => nearOutline(p, x, z, band))) lie[i] = code;
    }
  };

  const woods = maskOf(hole.woods ?? []);
  const real = hole.treesFrom === "lidar" && !!hole.canopy;
  for (let i = 0; i < n; i++) if (woods[i] && !(real && dsmDecides(hole.canopy, X(i % nx), Z(Math.floor(i / nx))))) lie[i] = CODE.trees;
  // Under real crowns: after the woods, before the playing surfaces, which
  // win where a tree overhangs them.
  if (real) {
    for (let iz = 0; iz < nz; iz++) for (let ix = 0; ix < nx; ix++) if (underCanopy(hole, X(ix), Z(iz))) lie[iz * nx + ix] = CODE.trees;
  }
  const fairways = hole.fairways ?? [];
  const fair = maskOf(fairways);
  bandAround(fair, fairways, FIRST_CUT, CODE.semi);
  for (let i = 0; i < n; i++) if (fair[i]) lie[i] = CODE.fairway;
  // The teeing spot at the start of the line, the other tee boxes (sim/
  // tees.mjs), and mapped tees.
  const tees = maskOf(hole.tees ?? []);
  for (let iz = 0; iz < nz; iz++) for (let ix = 0; ix < nx; ix++) if (Math.hypot(X(ix), Z(iz)) < 5 || onTeeBox(hole.teeSpots, X(ix), Z(iz))) tees[iz * nx + ix] = 1;
  for (let i = 0; i < n; i++) if (tees[i]) lie[i] = CODE.tee;
  // The mown surrounds (SURROUND): first cut over the rough and the deep
  // rough round each tee and green, as mappedSurfaceAt has them (the
  // fringe and the rest over them after).
  const rough = (l) => l === CODE.rough || l === CODE.deep;
  const teeShapes = mappedTeeShapes(hole);
  bandAround(tees, teeShapes, SURROUND.tee, CODE.semi, rough);
  const greenPolys = [hole.green.poly, ...(hole.greens ?? [])];
  const greens = maskOf(greenPolys);
  bandAround(greens, greenPolys, FRINGE + SURROUND.green, CODE.semi, rough);
  // Thin strips and corners of rough between mown ground mown too
  // (mappedJoin), checked exactly only within reach of its shapes' bands:
  // a join reaches at most a quarter of MOW_K past one (and a metre more,
  // for the grid's shortfall).
  {
    const near = new Uint8Array(n);
    for (const [polys, out] of [[fairways, FIRST_CUT], [teeShapes, SURROUND.tee], [greenPolys, FRINGE + SURROUND.green]]) {
      if (!polys.length) continue;
      const d = chamfer(maskOf(polys));
      const most = (out + MOW_K / 4 + 1) / cell;
      for (let i = 0; i < n; i++) if (d[i] <= most) near[i] = 1;
    }
    const join = mappedJoin(hole);
    for (let i = 0; i < n; i++) if (near[i] && rough(lie[i]) && join(X(i % nx), Z(Math.floor(i / nx))) > 0) lie[i] = CODE.semi;
  }
  // Cart paths: over the grass and tees, under everything after - their
  // verges (sim/paths.mjs VERGE) kept down to rough. What each path cell
  // would be without it is kept (`beneath`), for the colour of the ground
  // drawn under and round it.
  let beneath = null;
  if (hole.paths?.length) {
    for (const p of hole.paths) {
      if (!validPath(p)) continue;
      const reach = reachOf(p) + VERGE;
      const b = polygonBounds(pathLine(p).pts);
      const ix0 = Math.max(0, Math.floor((b.x0 - reach - r.x0) / cell));
      const ix1 = Math.min(nx - 1, Math.ceil((b.x1 + reach - r.x0) / cell));
      const iz0 = Math.max(0, Math.floor((b.z0 - reach - r.z0) / cell));
      const iz1 = Math.min(nz - 1, Math.ceil((b.z1 + reach - r.z0) / cell));
      for (let iz = iz0; iz <= iz1; iz++) for (let ix = ix0; ix <= ix1; ix++) if (lie[iz * nx + ix] === CODE.deep && onVerge(hole.paths, X(ix), Z(iz))) lie[iz * nx + ix] = CODE.rough;
    }
    beneath = Uint8Array.from(lie);
    for (const p of hole.paths) {
      if (!validPath(p)) continue;
      const reach = reachOf(p);
      const b = polygonBounds(pathLine(p).pts);
      const ix0 = Math.max(0, Math.floor((b.x0 - reach - r.x0) / cell));
      const ix1 = Math.min(nx - 1, Math.ceil((b.x1 + reach - r.x0) / cell));
      const iz0 = Math.max(0, Math.floor((b.z0 - reach - r.z0) / cell));
      const iz1 = Math.min(nz - 1, Math.ceil((b.z1 + reach - r.z0) / cell));
      for (let iz = iz0; iz <= iz1; iz++) for (let ix = ix0; ix <= ix1; ix++) if (onPath(hole, X(ix), Z(iz))) lie[iz * nx + ix] = CODE.path;
    }
  }
  bandAround(greens, greenPolys, FRINGE, CODE.fringe);
  // The greens and their fringes, which water reaching onto a green gives
  // way to (sim/greenfirst.mjs); other water, only to the greens.
  const dry = Uint8Array.from(lie, (l, i) => greens[i] || l === CODE.fringe);
  // (Waste areas first, any bunker in one over it: sandAt.)
  for (const b of [...hole.bunkers.filter((q) => q.waste), ...hole.bunkers.filter((q) => !q.waste)]) {
    const code = b.waste ? CODE.waste : greensideOf(hole, b) ? CODE.greenside : CODE.bunker;
    fill(b.poly, (i) => (lie[i] = code));
  }
  for (let i = 0; i < n; i++) if (greens[i]) lie[i] = CODE.green;
  for (const w of hole.water) {
    const keep = reachesGreen(hole, w) ? dry : greens;
    fill(w.poly, (i) => keep[i] || (lie[i] = CODE.water));
  }
  // An island green's causeway to land (sim/causeway.mjs): fairway, past
  // the greens and their fringes, over whatever it crosses.
  for (const c of causeways(hole)) {
    const b = causewayBounds(c);
    const ix0 = Math.max(0, Math.ceil((b.x0 - r.x0) / cell));
    const ix1 = Math.min(nx - 1, Math.floor((b.x1 - r.x0) / cell));
    const iz0 = Math.max(0, Math.ceil((b.z0 - r.z0) / cell));
    const iz1 = Math.min(nz - 1, Math.floor((b.z1 - r.z0) / cell));
    for (let iz = iz0; iz <= iz1; iz++) {
      for (let ix = ix0; ix <= ix1; ix++) {
        const i = iz * nx + ix;
        if (!dry[i] && causewayPast(c, X(ix), Z(iz)) <= 0) lie[i] = CODE.fairway;
      }
    }
  }
  return {
    ...r,
    cell,
    nx,
    nz,
    lie,
    beneath,
    // Outside the raster: the shapes themselves.
    at: (x, z) => {
      const ix = Math.round((x - r.x0) / cell);
      const iz = Math.round((z - r.z0) / cell);
      if (ix < 0 || iz < 0 || ix >= nx || iz >= nz) return mappedSurfaceAt(hole, x, z, path);
      return LIE_CODES[lie[iz * nx + ix]];
    },
  };
}

// ---- Courses and scorecards --------------------------------------------------

export function slugify(name) {
  return (
    String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "course"
  );
}

// The kinds of course the designer starts from (the owner: "add options
// for par 3 courses and chip and put courses"): each hole's yards in turn
// (a par 3 course's 100 - 190, a chip and putt's 25 - 70, mixed so no two
// in a row are alike), the par, and the options every hole gets.
export const COURSE_KINDS = {
  full: { name: "Full course", pars: [4, 4, 3, 5, 4, 3, 4, 5, 4], yards: { 3: 165, 4: 390, 5: 520 }, options: {} },
  par3: {
    name: "Par 3 course",
    pars: [3],
    yards: [145, 120, 175, 105, 160, 130, 190, 115, 150, 135, 165, 110, 185, 125, 155, 100, 170, 140],
    options: {},
  },
  // Every hole a links hole, no trees: brown dune grass everywhere off the
  // fairways, or green with darker, thicker patches of long grass.
  links: { name: "Links course (brown dunes)", pars: [4, 4, 3, 5, 4, 3, 4, 5, 4], yards: { 3: 165, 4: 390, 5: 520 }, options: { trees: "dunes" } },
  greenlinks: { name: "Links course (green)", pars: [4, 4, 3, 5, 4, 3, 4, 5, 4], yards: { 3: 165, 4: 390, 5: 520 }, options: { trees: "greenlinks" } },
  chipputt: {
    name: "Chip and putt",
    pars: [3],
    yards: [45, 30, 60, 38, 52, 28, 66, 42, 55, 35, 62, 48, 26, 58, 40, 70, 33, 50],
    // Short and open: no water or cart paths, a bunker or so, light trees,
    // every hole straight.
    options: { dogleg: "none", water: "none", bunkers: "few", trees: "light", paths: "none" },
  },
};

// A kind's scorecard of n holes: [{ par, yards, options }].
export function kindCard(kind, n) {
  const k = COURSE_KINDS[kind] ?? COURSE_KINDS.full;
  return Array.from({ length: n }, (_, i) => {
    const par = k.pars[i % k.pars.length];
    const yards = Array.isArray(k.yards) ? k.yards[i % k.yards.length] : k.yards[par];
    return { par, yards, options: { ...k.options } };
  });
}

// A new course from a scorecard: [{ par, yards, si, options? }]. Every hole
// gets a cart path, unless its options say otherwise.
export function buildCourse(name, card, seed = newSeed()) {
  const rand = seeded(seed);
  const holes = card.map((h, i) => {
    const spec = holeSpec({ number: i + 1, par: h.par, yards: h.yards, si: h.si ?? null, seed: Math.floor(rand() * 2 ** 31), options: { paths: "auto", ...(h.options ?? {}) } });
    return { spec, layout: buildHole(spec) };
  });
  return { format: COURSE_FORMAT, id: slugify(name), name: String(name).trim() || "My course", created: new Date().toISOString(), holes };
}

// Rebuilds one hole after its options (or seed) change. Changes made to it
// by hand (holeedits.mjs) are kept - they go back on wherever they still
// fit - except with a new seed, which is a new layout altogether.
export function rebuildHole(course, index, changes = {}) {
  const old = course.holes[index].spec;
  const edits = changes.seed == null ? course.holes[index].layout?.edits : null;
  const spec = holeSpec({
    number: old.number,
    par: changes.par ?? old.par,
    yards: changes.yards ?? old.yards,
    si: changes.si ?? old.si,
    seed: changes.seed ?? old.seed,
    options: { ...old.options, ...(changes.options ?? {}) },
  });
  const holes = course.holes.slice();
  const layout = buildHole(spec);
  if (edits?.length) layout.edits = edits;
  // Its mowing choice (sim/mowing.mjs) stays through a new layout.
  if (course.holes[index].layout?.mow) layout.mow = course.holes[index].layout.mow;
  holes[index] = { spec, layout };
  return { ...course, holes };
}

export function courseTotals(course) {
  return course.holes.reduce((t, h) => ({ par: t.par + h.spec.par, yards: t.yards + h.spec.yards }), { par: 0, yards: 0 });
}

// Reads a pasted scorecard. Understands either one hole per line
//   "1 4 385"  /  "1, 4, 385, 11"  /  "Hole 1 Par 4 385 yds"
// or rows of values
//   "Par 4 4 3 5 ..."  "Yards 385 410 165 ..."  ("SI"/"Index"/"HCP" optional)
// Returns [{ par, yards, si }] or throws with a reason.
export function parseScorecard(text) {
  const lines = String(text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const numbers = (l) => (l.match(/\d+(\.\d+)?/g) ?? []).map(Number);
  // Row form: a line labelled par, and one labelled yards/metres/length.
  const labelled = (re) => lines.find((l) => re.test(l));
  const parLine = labelled(/^\s*par\b/i);
  const yardLine = labelled(/^\s*(yards?|yds|length|distance|white|yellow|red|blue|tees?|metres?|meters?)\b/i);
  if (parLine && yardLine) {
    const pars = numbers(parLine);
    let yards = numbers(yardLine);
    if (/metre|meter/i.test(yardLine)) yards = yards.map((m) => m / YARD);
    const siLine = labelled(/^\s*(si|s\.i\.|index|hcp|handicap|stroke)/i);
    const sis = siLine ? numbers(siLine) : [];
    // Drop out/in/total columns: a par over 6 or a yardage totalling the rest.
    const holes = [];
    for (let i = 0; i < pars.length && i < yards.length; i++) {
      if (pars[i] < 3 || pars[i] > 6) continue;
      holes.push({ par: pars[i], yards: Math.round(yards[i]), si: sis[i] ?? null });
    }
    return checkCard(holes);
  }
  // Line form: numbers per hole. Take par as the first 3-6 value after the
  // hole number, yards as the first value over 50.
  const holes = [];
  for (const l of lines) {
    if (/^(out|in|total|tot)\b/i.test(l)) continue;
    const nums = numbers(l);
    if (nums.length < 2) continue;
    let rest = nums;
    if (/hole|^#/i.test(l) || (nums.length >= 3 && nums[0] >= 1 && nums[0] <= 18 && nums[0] === holes.length + 1)) rest = nums.slice(1);
    const par = rest.find((n) => n >= 3 && n <= 6 && Number.isInteger(n));
    const yardsRaw = rest.find((n) => n > 50);
    if (!par || !yardsRaw) continue;
    const metres = /\d\s*m\b|metre|meter/i.test(l);
    const after = rest.slice(rest.indexOf(yardsRaw) + 1);
    const si = after.find((n) => n >= 1 && n <= 18 && Number.isInteger(n)) ?? null;
    holes.push({ par, yards: Math.round(metres ? yardsRaw / YARD : yardsRaw), si });
  }
  return checkCard(holes);
}

function checkCard(holes) {
  if (!holes.length) throw new Error("Couldn't find any holes. Try one hole per line: hole, par, yards.");
  if (holes.length > 18) holes = holes.slice(0, 18);
  return holes;
}

// How a designed hole's woods are shaped (buildHole), from its seed and a
// randomness of their own: along each side, bays where the wood stands up
// to 12 m further back, gaps in its front row, and stretches a row deeper
// or a row thinner; then lone trees out in the rough (at least 12 m off
// the fairway and 30 m from the green) and a copse or two beyond the tree
// line.
export function woodsShape(seed) {
  const ns = (seed >>> 0) % 100003;
  const rand = seeded(((seed >>> 0) ^ 0x3d0d5) >>> 0 || 1);
  return {
    rand,
    at(s, sign, rows) {
      const u = s / 45 + (sign > 0 ? 100 : 0);
      const back = Math.max(0, lineNoise(u, ns) - 0.45) * 22;
      const d = lineNoise(u * 1.3 + 7, ns + 1);
      const more = d > 0.62 ? 1 : d < 0.22 ? -1 : 0;
      return { back, rows: Math.max(1, rows + more), gap: lineNoise(s / 14 + (sign > 0 ? 50 : 3), ns + 2) < 0.14 };
    },
    extras({ path, L, treeLine, fairway, green }) {
      const out = [];
      const lone = 2 + Math.floor(rand() * 4);
      for (let i = 0; i < lone; i++) {
        const s = 60 + rand() * Math.max(0, L - 110);
        const sign = rand() < 0.5 ? -1 : 1;
        const half = fairwayHalfWidth(fairway, s);
        const near = Math.max(half + 12, treeLine - 16);
        const off = near + rand() * Math.max(0, treeLine - 2 - near);
        const at = pointAt(path, s);
        const x = at.p[0] - at.dir[1] * sign * off;
        const z = at.p[1] + at.dir[0] * sign * off;
        if (Math.hypot(x - green.x, z - green.z) < 30 || off < half + 12) continue;
        out.push([x, z, 1 + rand() * 0.5]);
      }
      const copses = 1 + Math.floor(rand() * 2);
      for (let c = 0; c < copses; c++) {
        const s = 40 + rand() * Math.max(0, L - 60);
        const sign = rand() < 0.5 ? -1 : 1;
        const at = pointAt(path, s);
        const off = treeLine + 14 + rand() * 14;
        const cx = at.p[0] - at.dir[1] * sign * off;
        const cz = at.p[1] + at.dir[0] * sign * off;
        const n = 3 + Math.floor(rand() * 4);
        for (let i = 0; i < n; i++) out.push([cx + (rand() - 0.5) * 12, cz + (rand() - 0.5) * 12, 0.9 + rand() * 0.6]);
      }
      return out;
    },
  };
}
