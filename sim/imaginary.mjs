// Imaginary courses laid out as a whole, and given hills (the owner:
// "generate imaginary maps with some different elevations in the holes",
// and "make the course designer 1 big map ... so you lay out the 18
// holes"). A course built from a scorecard (course.mjs) has each hole in
// its own frame, flat. Here:
//
//   routeCourse   where each hole sits on the ground: a routing
//                 (routing.mjs) - each nine out from the clubhouse and back,
//                 its holes turning back alongside each other - or where the
//                 owner has dragged it on the course map (course.routing)
//   hillField     made-up ground: rolling hills of a chosen size, eased flat
//                 round each green and tee so they stay playable
//   withHills     the course rebuilt on that ground, through the same
//                 builder a real course from the map goes through
//                 (mapcourse.mjs courseFromMap): its holes then have real
//                 ground - a grid of heights - that plays and draws as a
//                 mapped course's does, and can be reshaped by hand
//                 (groundedit.mjs)
//
// Pure, for the designer and the tests.

import { blobOutline, fairwayHalfWidth, makePath, pointAt, nearest, seeded, seedName, greenContours, GREEN_SLOPES, holeBunkerStyle, FINGERED_POINTS, SURROUND } from "./course.mjs";
import { holeFrame, unproject, project, makeGrid, gridHeight, packGrid, unpackGrid, insidePolygon, distanceToEdge } from "./terrain.mjs";
import { courseFromMap } from "./mapcourse.mjs";
import { madeSince } from "./maker.mjs";
import { routeHoles } from "./routing.mjs";
import { pathLine, validPath, PATH_WIDTH } from "./paths.mjs";
import { landformFor, landformFlats, landProfile, alpsFor, ridgeEnds } from "./landforms.mjs";
import { canSee, sightLines } from "./sight.mjs";
import { signatureTree, withSignature } from "./signaturetree.mjs";
import { TEE_SETS, teeAtSpot, elsewhere } from "./teesets.mjs";
import { crownReach } from "./teelane.mjs";

// How hilly, and how high the hills (metres from the lowest to the highest
// across the course, roughly).
export const HILLS = ["flat", "gentle", "rolling", "hilly", "mountain"];
export const HILL_NAMES = { flat: "Flat", gentle: "Gentle", rolling: "Rolling", hilly: "Hilly", mountain: "Mountain" };
export const HILL_HEIGHT = { flat: 0, gentle: 5, rolling: 12, hilly: 25, mountain: 50 };

// Where an imaginary course is said to be: nowhere real (the made-up ground
// is all its own), but the builder works in latitude and longitude.
export const IMAGINARY_ORIGIN = { lat: 52, lon: -1.5 };

// ---- The routing ---------------------------------------------------------------------

// Each hole's place on the course's ground: { x, z, heading } - its tee in
// metres east and north of the clubhouse, and the way it plays (radians,
// 0 east, anticlockwise). holes: the course's holes ({ layout: { path } }).
// routing: places kept from the course map (any missing are worked out).
// seed: which of the routings (routingSeed). ground, groundKey: a strategic
// course's routed over the hills it's going on (routing.mjs routeHoles).
export function routeCourse(holes, routing = [], { seed = 1, ground = null, groundKey = null } = {}) {
  const keptAt = (i) => {
    const kept = routing?.[i];
    return kept && [kept.x, kept.z, kept.heading].every(Number.isFinite) ? { x: kept.x, z: kept.z, heading: kept.heading } : null;
  };
  const kept = holes.map((h, i) => keptAt(i));
  if (kept.every(Boolean)) return kept;
  const made = routeHoles(holes, { seed, ground, groundKey });
  return made.map((p, i) => kept[i] ?? p);
}

// Which routing a course has: its own seed once it's asked for another
// (the designer's Lay them out again), else one from its name - each
// course its own arrangement, the same every time.
export function routingSeed(course) {
  if (Number.isFinite(course?.routingSeed)) return course.routingSeed;
  let h = 7;
  for (const ch of seedName(course)) h = (h * 31 + ch.charCodeAt(0)) % 2147483647;
  return h;
}

// Where a hole's green is on the course's ground, from its place.
export function holeEnd(hole, place) {
  const path = hole?.layout?.path ?? [[0, 0], [300, 0]];
  const last = hole?.layout?.pin ?? path[path.length - 1];
  return holeFrame([place.x, place.z], place.heading).toLocal(last);
}

// A point of a hole (its own frame) on the course's ground.
export const toCourse = (place, p) => holeFrame([place.x, place.z], place.heading).toLocal(p);

// The way a hole points on the compass (degrees clockwise from north) from
// its place: its own frame's x, down the hole from the tee - so a round's
// wind (sim/weather.mjs holeBearing) blows the same way across every hole,
// as it does on a real course.
export const placeBearing = (place) => (((90 - (place.heading * 180) / Math.PI) % 360) + 360) % 360;

// ---- Made-up ground ---------------------------------------------------------------------

// Smooth value noise: a lattice of random heights, eased between.
function noise2(seed) {
  const rand = seeded(seed);
  const N = 64;
  const table = Array.from({ length: N * N }, () => rand() * 2 - 1);
  // (& 63: the lattice repeats every N = 64, negatives included.)
  const v = (i, j) => table[(j & 63) * N + (i & 63)];
  const ease = (t) => t * t * (3 - 2 * t);
  return (x, z) => {
    const i = Math.floor(x);
    const j = Math.floor(z);
    const u = ease(x - i);
    const w = ease(z - j);
    const a = v(i, j) + (v(i + 1, j) - v(i, j)) * u;
    const b = v(i, j + 1) + (v(i + 1, j + 1) - v(i, j + 1)) * u;
    return a + (b - a) * w;
  };
}

// The ground's height (metres) at [east, north], for a course's places:
// hills of the size chosen, broad ones and smaller ones on them, eased to
// a gentle plateau round each green (35 m) and tee (15 m) so they're
// playable. flats: [{ x, z, r }] - where to ease it flat; and a strategic
// hole's landforms (sim/landforms.mjs): { x, z, lift, top, bank } built up
// (or dug out, lift below 0) that much over `top` metres round, its bank
// easing back over `bank` more - round a point, or (with x2, z2) a ridge
// along the line to there.
export function hillField(hills = "rolling", { seed = 1, flats = [] } = {}) {
  const size = HILL_HEIGHT[hills] ?? HILL_HEIGHT.rolling;
  if (!size) return () => 0;
  const big = noise2(seed);
  const mid = noise2(seed + 1);
  const small = noise2(seed + 2);
  const raw = (x, z) => (size / 2) * (big(x / 600, z / 600) * 0.75 + mid(x / 220, z / 220) * 0.35 + small(x / 80, z / 80) * 0.08);
  // Asked of every point near each flat: the height in its middle, worked
  // out once; and only the flats that can reach a point's square of ground
  // are looked at (in their order) - the same height, sooner.
  const middles = flats.map((f) => (f.r > 0 ? raw(f.x, f.z) : 0));
  const near = flatCells(flats);
  return (x, z) => {
    let h = raw(x, z);
    const ks = near ? near.get(cellKey(x, z)) : flats.keys();
    if (!ks) return h;
    for (const k of ks) {
      const f = flats[k];
      const d = Math.hypot(x - f.x, z - f.z);
      if (f.lift) {
        const along = f.x2 == null ? d : Math.sqrt(segDist2(x, z, f.x, f.z, f.x2, f.z2));
        if (along < f.top + f.bank) h += f.lift * landProfile(f, along);
      }
      if (!(f.r > 0) || d > f.r * 2.2) continue;
      // Towards the height in its middle, most at the middle.
      const w = Math.exp(-((d / f.r) ** 2) * 1.2) * 0.9;
      h = h * (1 - w) + middles[k] * w;
    }
    return h;
  };
}

// Which flats can change the height in each square of ground FLAT_CELL m
// across: a Map from the square (cellKey) to the flats' indices, in order.
// A flat reaches 2.2 radii (easing to its middle) or its landform's top and
// bank, from its point or along its ridge. Null - every flat looked at, as
// before - if one has no proper place.
const FLAT_CELL = 128;
const cellOf = (v) => Math.floor(v / FLAT_CELL);
const cellKey = (x, z) => (cellOf(x) + 32768) * 65536 + (cellOf(z) + 32768);
function flatCells(flats) {
  const cells = new Map();
  for (let k = 0; k < flats.length; k++) {
    const f = flats[k];
    const reach = Math.max(f.r > 0 ? f.r * 2.2 : 0, f.lift ? (f.top ?? 0) + (f.bank ?? 0) : 0) + 1;
    const xs = f.x2 == null ? [f.x] : [f.x, f.x2];
    const zs = f.z2 == null ? [f.z] : [f.z, f.z2];
    const i0 = cellOf(Math.min(...xs) - reach);
    const i1 = cellOf(Math.max(...xs) + reach);
    const j0 = cellOf(Math.min(...zs) - reach);
    const j1 = cellOf(Math.max(...zs) + reach);
    if (![i0, i1, j0, j1].every((c) => Number.isFinite(c) && Math.abs(c) < 32000)) return null;
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        const key = (i + 32768) * 65536 + (j + 32768);
        const list = cells.get(key);
        if (list) list.push(k);
        else cells.set(key, [k]);
      }
    }
  }
  return cells;
}

// How far (squared) [x, z] is from the line from [ax, az] to [bx, bz].
function segDist2(x, z, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
  return (x - ax - dx * t) ** 2 + (z - az - dz * t) ** 2;
}

// ---- The course on its ground --------------------------------------------------------

const ring = (pts) => pts.map(([x, z]) => [x, z]);
const round1 = (v) => Math.round(v * 10) / 10;
const round3 = (v) => Math.round(v * 1000) / 1000;

// A designed hole's fairway as an outline in its own frame.
export function fairwayOutline(L) {
  const f = L.fairway;
  if (!f || !(f.to > f.from)) return null;
  const path = makePath(L.path);
  const left = [];
  const right = [];
  for (let d = f.from; d <= f.to; d += 4) {
    const at = pointAt(path, d);
    const hl = fairwayHalfWidth(f, d, -1);
    const hr = fairwayHalfWidth(f, d, 1);
    left.push([at.p[0] + at.dir[1] * hl, at.p[1] - at.dir[0] * hl]);
    right.push([at.p[0] - at.dir[1] * hr, at.p[1] + at.dir[0] * hr]);
  }
  return left.length > 2 ? [...left, ...right.reverse()] : null;
}

// What the map builder reads (osm.mjs parseOverpass's shape), from a
// designed course on its places: each hole's line, its green, tee,
// fairway, bunkers, water, trees and pin, in latitude and longitude.
export function surveyOf(course, places, origin = IMAGINARY_ORIGIN) {
  const out = { name: course.name, holes: [], greens: [], tees: [], fairways: [], bunkers: [], water: [], woods: [], buildings: [], trees: [], treeRows: [], pins: [], paths: [], walls: [] };
  let bounds = null;
  // (Every hole's play, where the places put it: worked out once there's a
  // second-round hole's trees to keep off it.)
  let play = null;
  const ll = ([e, n]) => {
    const p = unproject(origin, e, n);
    bounds ??= { north: p.lat, south: p.lat, east: p.lon, west: p.lon };
    bounds.north = Math.max(bounds.north, p.lat);
    bounds.south = Math.min(bounds.south, p.lat);
    bounds.east = Math.max(bounds.east, p.lon);
    bounds.west = Math.min(bounds.west, p.lon);
    return [p.lat, p.lon];
  };
  for (const [i, h] of course.holes.entries()) {
    const L = h.layout;
    const place = places[i];
    const at = (p) => ll(toCourse(place, p));
    // (Its ground reaching back past its white: the map builder's
    // `back`, from its line's start.)
    const sets = teeSetBoxes(L);
    const back = sets.reduce((m, s) => (s.colour === "white" ? Math.max(m, Math.hypot(s.at[0], s.at[1])) : m), 0);
    out.holes.push({ ref: h.spec?.number ?? i + 1, par: h.spec?.par ?? null, handicap: h.spec?.si ?? null, name: null, line: L.path.map(at), ...(back ? { back: round1(back) } : {}) });
    out.greens.push(ring(blobOutline(L.green, 40)).map(at));
    out.pins.push(at(L.pin));
    out.tees.push([[-6, -4], [6, -4], [6, 4], [-6, 4]].map(at));
    // And a hole of the course maker's second round its white's and red's
    // boxes, each its own (sim/teesets.mjs) - built level where they are
    // (holeedits/cuts.mjs teePlatesPart), and marked.
    for (const s of sets) out.tees.push(s.box.map(at));
    const fw = fairwayOutline(L);
    if (fw) out.fairways.push(fw.map(at));
    // What each bunker and pond is, carried onto the hills (traitsOf): a
    // walled one's outline the one its wall is measured round (walls.mjs
    // edgeOf), so the wall stays where it was.
    // (A hole the course maker made at its second round or since keeps its
    // shapes: a fingered bunker's fingers and a bunker wrapped round the
    // green in as many points as their edges need, and a flashed face -
    // its way as two points, carried as the outline is: shapeOn.)
    const made = madeSince(L);
    for (const b of L.bunkers ?? []) out.bunkers.push(shapeOn(traitsOf(sandRing(b, made).map(at), b, BUNKER_TRAITS), b, made, at));
    for (const w of L.water ?? []) out.water.push(traitsOf(waterRing(w).map(at), w, WATER_TRAITS));
    // Its trees: where each stands - and on a hole the course maker's
    // second round made (sim/maker.mjs), as big and as broad as it is, its
    // signature tree among them (sim/signaturetree.mjs), so the hills keep
    // what the flat course had. Such a hole's are kept off the other
    // holes' play where these places put them (offPlay): on the hills the
    // map builder hands a tree to every hole whose ground it's on, as that
    // hole's own, and a hole's own trees aren't kept off its play - so a
    // wood of the 7th, routed elsewhere on the hills, stood one in the
    // 1st's greenside bunker, and the 6th's one on the 5th's fairway. One
    // that isn't clear is still listed, marked `off`, so the builder draws
    // the sizes it always did for the trees after it (sim/mapcourse.mjs).
    if (madeSince(L)) {
      play ??= playOn(course, places);
      for (const t of withSignature(L.trees ?? [], signatureTree(L))) {
        const tree = [...at([t[0], t[1]]), ...t.slice(2)];
        if (offPlay(play, i, toCourse(place, [t[0], t[1]]), crownReach(t))) tree.traits = { off: true };
        out.trees.push(tree);
      }
    } else for (const t of L.trees ?? []) out.trees.push(at([t[0], t[1]]));
    // Its cart paths, as a mapped course has them: lines the builder lays
    // on its ground (the owner: "the cart paths despite being picked
    // weren't added" - the hills left them behind, every hole of a new
    // course being on hills unless it's made flat). Where one crosses a
    // neighbour's pond there, it goes over on a bridge.
    for (const p of (L.paths ?? []).filter(validPath)) out.paths.push({ line: pathLine(p).pts.map(at), width: p.w ?? PATH_WIDTH, surface: p.m ?? 0, bridged: true });
  }
  out.bounds = bounds;
  return out;
}

// How far a made tree is kept off another hole's play on the hills,
// metres from its edge - or by its crown's reach (sim/teelane.mjs
// crownReach), if that's further: the margins sim/treeclear.mjs CLEAR
// keeps on the flat (a green's taking in its fringe), and its sand's
// collar and a pond's bank besides (on the hills a hole's ground holds
// the trees of whichever holes it's beside).
const OFF_PLAY = { green: 4, fairway: 2, tee: 3, sand: 1, water: 1 };

// Every hole's play as the survey has it - its green, fairway, tee boxes,
// sand and water - in course metres where `places` put it: [{ hole, poly,
// margin, grow, box }] (grow: mown ground round it that's kept off too).
function playOn(course, places) {
  const out = [];
  for (const [i, h] of course.holes.entries()) {
    const L = h.layout;
    const to = (p) => toCourse(places[i], p);
    const add = (poly, margin, grow = 0) => {
      if (!(poly?.length > 2)) return;
      const pts = poly.map(to);
      const box = { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity };
      for (const [x, z] of pts) {
        box.x0 = Math.min(box.x0, x);
        box.x1 = Math.max(box.x1, x);
        box.z0 = Math.min(box.z0, z);
        box.z1 = Math.max(box.z1, z);
      }
      out.push({ hole: i, poly: pts, margin, grow, box });
    };
    if (L.green) add(ring(blobOutline(L.green, 40)), OFF_PLAY.green);
    add(fairwayOutline(L), OFF_PLAY.fairway);
    // (A tee with the first cut mown round it, as sim/treeclear.mjs keeps
    // a designed hole's: SURROUND.)
    for (const box of [[[-6, -4], [6, -4], [6, 4], [-6, 4]], ...teeSetBoxes(L).map((s) => s.box)]) add(box, OFF_PLAY.tee, SURROUND.tee);
    const made = madeSince(L);
    for (const b of L.bunkers ?? []) add(sandRing(b, made), OFF_PLAY.sand);
    for (const w of L.water ?? []) add(waterRing(w), OFF_PLAY.water);
  }
  return out;
}

// Whether a tree of hole `owner` at [x, z] (course metres), its crown
// reaching `reach`, stands on or over another hole's play (playOn).
function offPlay(play, owner, [x, z], reach) {
  for (const q of play) {
    if (q.hole === owner) continue;
    const m = q.grow + Math.max(q.margin, reach);
    if (x < q.box.x0 - m || x > q.box.x1 + m || z < q.box.z0 - m || z > q.box.z1 + m) continue;
    if (insidePolygon(q.poly, x, z) || distanceToEdge(q.poly, x, z) <= m) return true;
  }
  return false;
}

// A bunker's outline and a pond's as the survey has them (in as many
// points as their edges need: surveyOf).
const sandRing = (b, made) => ring(blobOutline(b, b.wall ? 96 : made && b.fingered ? FINGERED_POINTS : made && b.bend ? 96 : 32));
const waterRing = (w) => ring(blobOutline(w, w.wall ? 96 : 40));

// What a designed hole's bunkers and ponds keep when the course is put on
// hills (the map builder carries them: sim/mapcourse.mjs withTraits): a
// pot's depth and turf face, any wall, a waste area; a burn, its penalty
// area's colour.
const BUNKER_TRAITS = ["dig", "wall", "waste"];
// A flashed face carried too, from a hole made at the course maker's second
// round or since (sim/maker.mjs): its way from its middle as two points
// (`at` puts them where the outline goes), its height and back - the
// map builder turns them into its way on the hole there (sim/mapcourse.mjs).
function shapeOn(ring, b, made, at) {
  if (!made || !b.flash || !Number.isFinite(b.flash.a)) return ring;
  const to = [b.x + Math.cos(b.flash.a) * 10, b.z + Math.sin(b.flash.a) * 10];
  ring.traits = { ...(ring.traits ?? {}), flash: { from: at([b.x, b.z]), to: at(to), h: b.flash.h, back: b.flash.back } };
  return ring;
}
const WATER_TRAITS = ["wall", "burn", "penalty"];
function traitsOf(ring, shape, keys) {
  const traits = {};
  for (const k of keys) if (shape[k] != null) traits[k] = shape[k];
  if (Object.keys(traits).length) ring.traits = traits;
  return ring;
}

// A hole of the course maker's second round: its white's and red's boxes
// (layout.teeAt, sim/teesets.mjs) - [{ colour, at, box }], each box its
// outline (TEE_SETS.size, square to the line there), in its own frame.
// None for any other hole.
export function teeSetBoxes(L) {
  if (!madeSince(L) || !(L?.path?.length >= 2)) return [];
  const path = makePath(L.path);
  const out = [];
  for (const colour of ["white", "red"]) {
    const at = teeAtSpot(L.teeAt, colour);
    if (at) out.push({ colour, at, box: setBox(path, colour, at) });
  }
  return out;
}
// A white's or red's box at `at`: TEE_SETS.size, square to the way the
// line runs by it (off the tee for the white, beside it for the red).
function setBox(path, colour, at) {
  const [along, across] = TEE_SETS.size[colour];
  const { dir } = pointAt(path, colour === "white" ? 0 : nearest(path, at[0], at[1]).s);
  const r = [-dir[1], dir[0]];
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [round1(at[0] + (dir[0] * along * a + r[0] * across * b) / 2), round1(at[1] + (dir[1] * along * a + r[1] * across * b) / 2)]);
}

// A course's holes of the second round with their whites and reds where
// they can be on its ground as the routing lays it (places): clear of every
// other hole's fairway, green and tee and each other's boxes - by SET_CLEAR,
// so rough lies between their mown ground, not a thin strip - each where it was
// made, else the other side of the line, else further back or nearer the
// yellow (sim/teesets.mjs elsewhere); where none is that clear, the first
// of those not on another hole's fairway or tee at all (built and
// levelled all the same, a strip of rough the narrower) - never by its
// green; else none. The course as it was
// where nothing moves.
export function settledSets(course, places) {
  const holes = course.holes ?? [];
  if (!holes.some((h) => teeSetBoxes(h.layout).length)) return course;
  const grounds = holes.map((h, i) => {
    const L = h.layout;
    const to = (p) => toCourse(places[i], p);
    const shape = (poly, green = false) => poly && Object.assign(poly.map(to), { green });
    return [shape(fairwayOutline(L)), L.green ? shape(ring(blobOutline(L.green, 40)), true) : null, shape([[-6, -4], [6, -4], [6, 4], [-6, 4]])].filter(Boolean);
  });
  const taken = [];
  const meets = (box, i, clear) => {
    const pts = [...box, [(box[0][0] + box[2][0]) / 2, (box[0][1] + box[2][1]) / 2], ...box.map((p, k) => [(p[0] + box[(k + 1) % 4][0]) / 2, (p[1] + box[(k + 1) % 4][1]) / 2])];
    // (A green kept SET_CLEAR off always: never a tee by a green.)
    const near = (poly) => pts.some(([x, z]) => insidePolygon(poly, x, z) || distanceToEdge(poly, x, z) < (poly.green ? SET_CLEAR : clear)) || poly.some(([x, z]) => insidePolygon(box, x, z));
    return grounds.some((list, j) => j !== i && list.some(near)) || taken.some(near);
  };
  let moved = false;
  const out = holes.map((h, i) => {
    const sets = teeSetBoxes(h.layout);
    if (!sets.length) return h;
    const path = makePath(h.layout.path);
    const teeAt = {};
    for (const s of sets) {
      const behind = s.colour === "white";
      const tries = [s.at, ...elsewhere(path, s.at, behind)].map((c) => ({ c, box: setBox(path, s.colour, c).map((p) => toCourse(places[i], p)) }));
      const fits = tries.find((t) => !meets(t.box, i, SET_CLEAR)) ?? tries.find((t) => !meets(t.box, i, 0));
      if (fits) {
        teeAt[s.colour] = fits.c;
        taken.push(fits.box);
      }
      if (teeAt[s.colour] !== s.at) moved = true;
    }
    if (!moved) return h;
    const layout = { ...h.layout, teeAt };
    if (!Object.keys(teeAt).length) delete layout.teeAt;
    return { ...h, layout };
  });
  return moved ? { ...course, holes: out } : course;
}
// How flat round a white or red box the hills are eased (as round a tee:
// 15 m - its own box smaller).
const SET_FLAT = 10;
// How far a white's or red's box keeps from the other holes' fairways,
// greens and tees (metres, edge to edge): their mown ground round them and
// its own, and room between.
const SET_CLEAR = 10;

// The places to keep flat: every green and tee - and, on a hole of the
// course maker's second round, its white's and red's boxes too.
export function flatsOf(course, places) {
  const flats = [];
  for (const [i, h] of course.holes.entries()) {
    const place = places[i];
    const [gx, gz] = toCourse(place, h.layout.pin ?? h.layout.path.at(-1));
    flats.push({ x: gx, z: gz, r: 35 }, { x: place.x, z: place.z, r: 15 });
    for (const s of teeSetBoxes(h.layout)) {
      const [x, z] = toCourse(place, s.at);
      flats.push({ x, z, r: SET_FLAT });
    }
  }
  return flats;
}

// A designed course rebuilt on made-up hills: the same holes, where the
// routing puts them, with real ground. Returns { course, report } (the
// builder's report: each hole's rise from tee to green and the like).
export function withHills(course, { hills = "rolling", seed = 1, trees = "normal" } = {}) {
  const raw = hillField(hills, { seed });
  const places = placesOnHills(course, { hills, seed });
  // Each strategic hole's land shaped (sim/landforms.mjs): its green on a
  // plateau or in a hollow, its tee on a mound, a shelf where drives land
  // on a climb - from the hills as they come, before they're shaped.
  const landforms = course.holes.map((h, i) => {
    const rand = seeded((((seed ^ 0x1a4d) >>> 0) + (i + 1) * 7919) >>> 0 || 1);
    const tee = raw(places[i].x, places[i].z);
    const path = makePath(h.layout?.path ?? [[0, 0], [1, 0]]);
    const rise = (s) => raw(...toCourse(places[i], pointAt(path, s).p)) - tee;
    return landformFor(h.layout, rand, { hills, rise });
  });
  // (Its whites and reds where they can be on this ground: settledSets.)
  const sets = settledSets(course, places);
  const flats = flatsOf(sets, places);
  const shapedAt = (lfs) => lfs.flatMap((lf, i) => landformFlats(course.holes[i].layout, lf, (p) => toCourse(places[i], p)));
  // A punchbowl green that'd hide the flag from the second shot left as the
  // ground has it (MacKenzie's "minimum of blindness": sim/sight.mjs).
  const bowled = hillField(hills, { seed, flats: [...flats, ...shapedAt(landforms)] });
  for (const [i, lf] of landforms.entries()) {
    if (!(lf?.green?.lift < 0)) continue;
    const L = course.holes[i].layout;
    if (canSee(bowled, toCourse(places[i], sightLines(L).from), toCourse(places[i], L.pin))) continue;
    const { green, ...rest } = lf;
    landforms[i] = Object.keys(rest).length ? rest : null;
  }
  // And the Alps, on one hole where the land's for it: a ridge across the
  // fairway short of the green, hiding it from the second shot.
  const alps = alpsFor(
    course.holes.map((h) => h.layout),
    (i, p) => toCourse(places[i], p),
    hillField(hills, { seed, flats: [...flats, ...shapedAt(landforms)] }),
    { hills, rand: seeded(((seed ^ 0xa1b5) >>> 0) || 1) },
  );
  if (alps) landforms[alps.i] = { ...(landforms[alps.i] ?? {}), ridge: alps.ridge };
  const field = hillField(hills, { seed, flats: [...flats, ...shapedAt(landforms)] });
  const survey = surveyOf(sets, places);
  const origin = IMAGINARY_ORIGIN;
  const heightAt = (lat, lon) => {
    const [e, n] = project(origin, lat, lon);
    return field(e, n);
  };
  const built = courseFromMap(survey, heightAt, { name: course.name, seed, trees });
  // A point of a hole as made on the field, in the frame of the hole as
  // built (for its landform: sim/landforms.mjs landformFlats).
  const fromField = ([x, z]) => {
    const p = unproject(IMAGINARY_ORIGIN, x, z);
    return project(built.course.source.origin, p.lat, p.lon);
  };
  // (Where a point of hole i as designed is on it as built.)
  const onBuilt = (i, L) => {
    const frame = holeFrame(L.geo.tee, L.geo.heading);
    return (p) => frame.toHole(fromField(toCourse(places[i], p))).map((v) => Math.round(v * 100) / 100);
  };
  const landformOn = (i, L) => {
    const lf = landforms[i];
    if (!lf || !L?.geo) return lf;
    const was = course.holes[i].layout;
    const at = onBuilt(i, L);
    const out = { ...lf };
    if (lf.green) out.green = { ...lf.green, at: at([was.green.x, was.green.z]) };
    if (lf.shelf) out.shelf = { ...lf.shelf, at: at(pointAt(makePath(was.path), lf.shelf.s).p) };
    if (lf.ridge) out.ridge = { ...lf.ridge, ends: ridgeEnds(was, lf.ridge).map(at) };
    return out;
  };
  // The builder takes its course's middle as its origin: the holes' places
  // are kept on the course for its map, as the builder has them.
  const shaped = landforms.some(Boolean) ? { landforms: 1 } : {};
  const out = { ...built.course, id: course.id, name: course.name, created: course.created ?? built.course.created, source: { kind: "imaginary", hills, seed, origin: built.course.source.origin, ...shaped } };
  // By the sea or not, as it was (sim/coast.mjs) - a links course by the
  // sea stays by it, though its holes on hills are drawn from the ground.
  const sea = course.sea ?? (course.holes.some((h) => h.layout?.links) ? "coast" : null);
  if (sea) out.sea = sea;
  if (course.seaGap) out.seaGap = course.seaGap;
  // Each green as sloping as it was asked to be (course.mjs greenContours):
  // the hills are eased flat round it, so without these it'd be flat. A
  // strategic hole's (sim/architect.mjs) tilts along its green's own turn,
  // a template green with its own slopes (a Redan falling away, a
  // Biarritz's swale); and the hole keeps its plan.
  out.holes = out.holes.map((h, i) => {
    const level = course.holes[i]?.spec?.options?.contours ?? "gentle";
    if (!GREEN_SLOPES[level] || !h.layout?.green || !h.layout.pin) return h;
    const rand = seeded(((course.holes[i].spec?.seed ?? i + 1) ^ 0x5109e) >>> 0 || 1);
    const was = course.holes[i]?.layout;
    const style = strategicGreen(was, h.layout.green);
    const contours = greenContours(rand, h.layout.green, h.layout.pin, style?.level ?? level, { mapped: true, style });
    const kept = was?.plan ? { plan: was.plan, ...(was.greenStyle ? { greenStyle: was.greenStyle } : {}) } : {};
    return { ...h, spec: { ...h.spec, options: { ...h.spec.options, contours: level } }, layout: { ...h.layout, contours, ...kept } };
  });
  // And each hole as it was made: a links hole's look and ground (its dune
  // grass, its long grass playing as deep rough), its bunkers in its
  // course's style (course.mjs holeBunkerStyle) - the holes on hills are
  // built as a map's are, which knows neither.
  out.holes = out.holes.map((h, i) => {
    const was = course.holes[i];
    if (!was?.layout) return h;
    const style = holeBunkerStyle(was.spec?.options ?? {});
    const links = was.layout.links ? { links: was.layout.links } : {};
    const land = landforms[i] ? { landform: landformOn(i, h.layout) } : {};
    // The course maker's round that made it (sim/maker.mjs), kept on its hills.
    const maker = Number.isInteger(was.layout.maker) ? { maker: was.layout.maker } : {};
    // And one it made, the tree line its woods were grown from (the hills'
    // own is the map's, further out) and its copses, each where it stands
    // on the hill (sim/treeroles.mjs, sim/deepwoods.mjs).
    const woods = madeSince(was.layout) && h.layout?.geo ? { woodLine: was.layout.treeLine, ...(was.layout.copses?.length ? { copses: was.layout.copses.map(([x, z, r]) => [...onBuilt(i, h.layout)([x, z]), r]) } : {}) } : {};
    // And its white and red where they were made (sim/teesets.mjs), in the
    // frame of the hole as built: on the boxes the map builder made for them.
    const made = teeSetBoxes(sets.holes[i].layout);
    const teeAt = made.length && h.layout?.geo ? { teeAt: Object.fromEntries(made.map((s) => [s.colour, onBuilt(i, h.layout)(s.at)])) } : {};
    return { ...h, spec: { ...h.spec, options: { ...h.spec.options, bunkerStyle: style } }, layout: { ...h.layout, ...links, ...land, ...maker, ...woods, ...teeAt } };
  });
  return { course: out, report: built.report };
}

// Where a course's holes go on its hills: a strategic course's routed over
// the ground (routing.mjs CLIMB - short climbs from green to tee, no steep
// par 3s, a mix of holes up, down and level, an easy walk home); a classic
// one's where they'd be on the flat; any put by hand on the course map
// where they were put. hills, seed: the ground's, as for withHills.
export function placesOnHills(course, { hills = "rolling", seed = 1 } = {}) {
  const holes = course.holes ?? [];
  if (!holes.some((h) => h.layout?.plan) || holes.some((h) => h.layout?.geo?.tee)) return coursePlaces(course);
  return routeCourse(holes, course.routing, { seed: routingSeed(course), ground: hillField(hills, { seed }), groundKey: `${hills}/${seed}` });
}

// A strategic hole's green's slopes on hills: its template's (if any),
// facing as the green was turned off the line in - the rebuilt green faces
// straight down the line, so it's turned as much again. Null for a
// classic hole.
function strategicGreen(was, green) {
  if (!was?.plan || !was.green || !(was.path?.length > 1)) return null;
  const [a, b] = [was.path[was.path.length - 2], was.path[was.path.length - 1]];
  const turn = (was.green.rot ?? 0) - Math.atan2(b[1] - a[1], b[0] - a[0]);
  return { ...(was.greenStyle ?? {}), rot: (green.rot ?? 0) + turn };
}

// Each hole's place on the course's ground, whatever the course: a mapped
// (or imaginary-on-hills) one from where its holes really are (layout.geo),
// a designed one from its routing. In metres east and north of the
// course's middle (mapped) or clubhouse (designed). A course from the map
// with a hole swapped for a designed one keeps its mapped holes where they
// are, and the designed one where it was put (course.routing: where the
// map had it, kept as it was swapped).
export function coursePlaces(course) {
  const holes = course?.holes ?? [];
  const geo = holes.map((h) => (h.layout?.geo?.tee ? { x: h.layout.geo.tee[0], z: h.layout.geo.tee[1], heading: h.layout.geo.heading } : null));
  if (holes.length && geo.every(Boolean)) return geo;
  // (Routing a course is slow - a fifth of a second building a hole, where
  // it's asked for the coast and the other holes - so kept for the course
  // as it is, worked out again if anything in it changes. Asked again with
  // the very same holes' layouts - a layout's replaced when it changes,
  // never changed where it is - it's known at once: writing every layout
  // out to compare them was the slow part, some 27 times a hole built and
  // 2.5 MB of text each time.)
  const layouts = holes.map((h) => h.layout ?? null);
  const seed = routingSeed(course);
  const head = JSON.stringify([course?.routing ?? null, seed]);
  const kept = routedKept.get(course);
  let routed;
  if (kept?.head === head && kept.layouts.length === layouts.length && kept.layouts.every((l, i) => l === layouts[i])) routed = kept.routed;
  else {
    const key = JSON.stringify([course?.routing ?? null, seed, layouts]);
    routed = kept?.key === key ? kept.routed : routeCourse(holes, course?.routing, { seed });
    if (course) routedKept.set(course, { key, head, layouts, routed });
  }
  return geo.some(Boolean) ? holes.map((h, i) => geo[i] ?? routed[i]) : routed.slice();
}
const routedKept = new WeakMap();

// ---- Moving a hole of a course on hills ------------------------------------------

// The hill field a course on hills was built on, in its own ground's
// metres (east and north of its middle, as its holes' places are), eased
// flat round greens and tees where its holes are now (places).
export function courseField(course, places = coursePlaces(course)) {
  const src = course?.source ?? {};
  const origin = src.origin;
  // Its ground's metres to the made-up field's (the field was laid out
  // round IMAGINARY_ORIGIN before the builder centred the course).
  const toField = ([e, n]) => {
    const p = unproject(origin, e, n);
    return project(IMAGINARY_ORIGIN, p.lat, p.lon);
  };
  const flats = [];
  const shapes = [];
  for (const [i, h] of (course.holes ?? []).entries()) {
    const place = places[i];
    const [gx, gz] = toField(toCourse(place, h.layout.pin ?? h.layout.path.at(-1)));
    const [tx, tz] = toField([place.x, place.z]);
    flats.push({ x: gx, z: gz, r: 35 }, { x: tx, z: tz, r: 15 });
    // Its white's and red's, as flatsOf has them.
    for (const s of teeSetBoxes(h.layout)) {
      const [x, z] = toField(toCourse(place, s.at));
      flats.push({ x, z, r: SET_FLAT });
    }
    // Its land shaped as it was when the course was made (withHills).
    if (src.landforms) shapes.push(...landformFlats(h.layout, h.layout.landform, (p) => toField(toCourse(place, p))));
  }
  const field = hillField(src.hills, { seed: src.seed, flats: [...flats, ...shapes] });
  return (e, n) => field(...toField([e, n]));
}

// A course on hills with hole i put at `place` ({ x, z, heading } on its
// ground): the hole keeps its shapes (and any hand changes - they're in
// its own frame), and its ground is made again from the same hills where
// it now is. Its record of the greens near it goes (they were where it
// was).
export function placeHillHole(course, i, place) {
  const h = course.holes[i];
  const L = h?.layout;
  if (!L?.geo || !L.terrain) return course;
  const places = coursePlaces(course).map((p, k) => (k === i ? place : p));
  const field = courseField(course, places);
  const old = unpackGrid(L.terrain);
  const grid = makeGrid({ x0: old.x0, z0: old.z0, x1: old.x0 + (old.nx - 1) * old.cell, z1: old.z0 + (old.nz - 1) * old.cell, cell: old.cell }, (x, z) => field(...toCourse(place, [x, z])));
  const tee = gridHeight(grid, 0, 0);
  for (let k = 0; k < grid.h.length; k++) grid.h[k] -= tee;
  const layout = { ...L, terrain: packGrid(grid), greens: [], geo: { ...L.geo, tee: [round1(place.x), round1(place.z)], heading: round3(place.heading) } };
  const holes = course.holes.slice();
  holes[i] = { ...h, layout };
  return { ...course, holes };
}
