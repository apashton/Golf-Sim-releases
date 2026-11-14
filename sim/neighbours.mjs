// The rest of the course round the hole being played, as it's seen from
// the air (docs/GRAPHICS-NEXT.md section 7; the owner: "Showing the nearby
// holes fully drawn when the flight goes up in the air (but at a lower
// resolution) ... so that the world feels complete"). Only the hole being
// played is built in full; from high in a drive's flight or a flyover, the
// course's other holes are where they really are:
//
//   - painted on the ground, in the picture laid over it beyond the hole
//     (look/country.js countryMap): each hole's fairway (mown in stripes),
//     green and fringe, tee, bunkers and water, and the made-up country
//     cleared from along it, so between holes there's rough, not fields
//   - their greens and tees as low, plain shapes on the ground (course.js)
//   - their trees as flat pictures of their real kinds and sizes, among the
//     far woods (look/farwoods.js) - and the made-up woods kept off them
//
// A mapped course's holes are where the map has them (layout.geo); a
// designed course's where its routing puts them (imaginary.mjs
// coursePlaces: each hole a short walk on from the last green, or where
// it was dragged on the course map). Nothing of another hole is drawn on
// the hole being played's own ground - its rough out past its tree line,
// or a mapped hole's box - so two never overlap where a neighbour runs
// close. As play moves on the next hole is built in full and the one just
// played joins the rest. Pure: course.js and look/country.js draw it.

import { holeMowing, turnedMow } from "./mowing.mjs";
import { coursePlaces, toCourse, fairwayOutline } from "./imaginary.mjs";
import { insideBlob, outlinesMeet } from "./course.mjs";
import { holeShapes } from "./coursewide.mjs";
import { courseOwners, ownShapesOnly } from "./owners.mjs";
import { holeFrame, insidePolygon } from "./terrain.mjs";
import { withEdits } from "./holeedits.mjs";
import { keptTrees } from "./courseplay.mjs";
import { standsFor } from "./treepalette.mjs";
import { lockFor, keptLayout, liveLock } from "./treelock.mjs";
import { treeForm, treeStands, turnedForm } from "./treehits.mjs";
import { KINDS } from "./treeshapes.mjs";
import { FAR_SIZE, smoothstep, lineDistance, boxDistance, hash2, valueNoise, courseHoleSeed, characterFor, backdropTrees } from "./country.mjs";
import { deepWoods, DEEP_WOODS } from "./deepwoods.mjs";
import { clearedLayout, treeClearance, treeReach, realTrees } from "./treeclear.mjs";

export const NEIGHBOURS = {
  // A neighbour with any of its line within this of the hole's middle.
  reach: 1300,
  // The made-up country cleared this far past a neighbour's tree line.
  clear: 25,
  // A designed hole's own ground: out to its tree line and this much more
  // (its deep rough), fading over ownFade; round its green and tee.
  own: 30,
  ownFade: 10,
  greenOwn: 55,
  teeOwn: 20,
  // Where it's played (ownArea's play): round its green and tee.
  greenPlay: 35,
  teePlay: 15,
  // A mapped hole's own ground: its box and this much more.
  boxOwn: 10,
  // A mapped neighbour's open ground: this far either side of its line.
  mappedOpen: 40,
  // Mowing stripes, metres: fairways and greens.
  stripe: 9,
  greenStripe: 4,
  // The fringe round a green and the collar round a bunker, metres.
  fringe: 1.5,
  collar: 1,
  // A pond's muddy margin, metres.
  mud: 1,
  // Another hole's fairway, green and tee always shown in full over the
  // hole being played's rough (ownArea's play), and this far round them
  // (their bunkers and fringes), easing out over the last `shownFade`.
  shown: 6,
  shownFade: 3,
  // A links hole's long grass: from its deep rough (this far inside its
  // tree line) to this far past it.
  deep: 9,
  longGrass: 60,
  // Their greens and tees drawn low on the ground (course/holescenery.js
  // glimpseSteps): cut into triangles no longer than this a side, metres,
  // so they lie on its rises and falls.
  lowEdge: 4,
};

import { clamp } from "./mathutil.mjs";

// Hole frame [x, z] <-> the world's (scenery.js toWorld: x = z, z = -x).
export const toWorldXZ = ([x, z]) => [z, -x];
export const fromWorldXZ = ([wx, wz]) => [-wz, wx];

const middleOf = (path) => {
  let len = 0;
  for (let i = 1; i < path.length; i++) len += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
  let at = len / 2;
  for (let i = 1; i < path.length; i++) {
    const d = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
    if (at <= d) {
      const k = d ? at / d : 0;
      return [path[i - 1][0] + (path[i][0] - path[i - 1][0]) * k, path[i - 1][1] + (path[i][1] - path[i - 1][1]) * k];
    }
    at -= d;
  }
  return path[0] ?? [0, 0];
};

// The course's other holes' lines in this hole's frame, without their
// shapes and trees (quick, on any graphics setting): [{ index, path, open }]
// - open as courseNeighbours has it.
export function courseLines(course, index) {
  const holes = course?.holes ?? [];
  const places = coursePlaces(course);
  const me = places?.[index];
  if (holes.length < 2 || !me) return [];
  const mine = holeFrame([me.x, me.z], me.heading);
  const out = [];
  holes.forEach((h, i) => {
    const raw = h?.layout;
    if (i === index || !raw?.path?.length || !places[i]) return;
    const mapped = raw.source === "map";
    const L = mapped ? raw : withEdits(raw);
    out.push({ index: i, path: L.path.map((p) => mine.toHole(toCourse(places[i], p))), open: mapped ? NEIGHBOURS.mappedOpen : (L.treeLine ?? 40) });
  });
  return out;
}

// A neighbouring hole as it is on its own - its layout as played and its
// trees as they grow, with their forms - the same whichever hole it's seen
// from, so worked out once for the course as it is (a hole's layout is
// replaced when it changes, never changed where it is): seen from each of
// the course's holes in turn, every other hole's trees grew afresh each
// time, eighteen times over. make(): { L, grow, grown } - grow() its trees
// and their forms, kept in grown once it's near enough a hole to be seen.
// (Known by every hole and its layout: a hole or a layout swapped for
// another - a new seed, an edit - and the course's are worked out again.)
const ownKeptBy = new WeakMap();
function ownKept(course, i, make) {
  const parts = [];
  for (const h of course?.holes ?? []) parts.push(h ?? null, h?.layout ?? null);
  let kept = course ? ownKeptBy.get(course) : null;
  if (!kept || kept.parts.length !== parts.length || kept.parts.some((p, k) => p !== parts[k])) {
    kept = { parts, holes: new Map() };
    if (course) ownKeptBy.set(course, kept);
  }
  if (!kept.holes.has(i)) kept.holes.set(i, make());
  return kept.holes.get(i);
}

// The course's other holes in this hole's frame (index: the hole being
// played): [{ number, mapped, path, pin, open, fairways, greens, tees,
// bunkers, water, woods, trees }] - shapes as polygons [[x, z]...], open
// how far either side of its line is open ground (its tree line, or a
// mapped hole's mappedOpen), trees [[x, z, size, kind?...]] as the hole
// keeps them, with a designed hole's woods past them (woods: true) and
// forms, each tree's form from where it stands on its own hole (treehits.mjs
// treeForm). Those with nothing within `reach` of this hole's middle are
// left out; a mapped course's trees that two holes' maps both found are
// kept once, and none on this hole's own box.
// A course's holes as they are, for knowing when something kept for it is
// out of date: each hole and its layout (a hole swapped for one with a new
// seed counts, its layout the same or not).
const holesNow = (course) => ({ holes: [...(course.holes ?? [])], layouts: (course.holes ?? []).map((h) => h?.layout) });
const sameHoles = (kept, course) => {
  const holes = course.holes ?? [];
  return !!kept && kept.holes.length === holes.length && holes.every((h, i) => h === kept.holes[i] && h?.layout === kept.layouts[i]);
};

// (Worked out once for each hole, reach and woods on the course as it is:
// it's asked twice a hole and more, and took 65 ms each time. The list is
// a fresh copy each time; the holes in it are shared - not to be changed.)
const neighboursKept = new WeakMap();
export function courseNeighbours(course, index, { reach = NEIGHBOURS.reach, woods = true } = {}) {
  if (!course || typeof course !== "object") return [];
  let kept = neighboursKept.get(course);
  if (!sameHoles(kept, course)) {
    kept = { ...holesNow(course), by: new Map() };
    neighboursKept.set(course, kept);
  }
  const key = `${index}|${reach}|${!!woods}`;
  if (!kept.by.has(key)) kept.by.set(key, neighboursOf(course, index, { reach, woods }));
  return [...kept.by.get(key)];
}

function neighboursOf(course, index, { reach, woods }) {
  const holes = course?.holes ?? [];
  if (holes.length < 2 || !holes[index]?.layout?.path) return [];
  const places = coursePlaces(course);
  if (!places?.[index]) return [];
  const frames = places.map((p) => (p ? holeFrame([p.x, p.z], p.heading) : null));
  const mine = frames[index];
  const me = holes[index].layout;
  const mid = middleOf(me.path);
  const regionOf = (L) => (L?.source === "map" && L.region ? L.region : null);
  // Each mapped neighbour with only its own shapes (owners.mjs): what its
  // map has of other holes is theirs to show.
  const owners = holes.some((h) => h?.layout?.source === "map") ? courseOwners(course) : [];
  const out = [];
  holes.forEach((h, i) => {
    const raw = h?.layout;
    if (i === index || !raw?.path?.length || !places[i]) return;
    const mapped = raw.source === "map";
    // A designed hole's made trees kept off the other holes (treeclear.mjs),
    // as when it's played; its hand-planted ones come with its edits.
    // (What it is on its own - the same from every hole - worked out once
    // for the course as it is: ownKept.)
    const kept = ownKept(course, i, () => {
      const cleared = mapped ? null : clearedLayout(course, i, raw);
      const L = mapped ? raw : withEdits(cleared);
      // As they first grew, if they're kept (sim/treelock.mjs:
      // courseplay.mjs keptTrees, as when the hole's played). (A made-up
      // course's holes, built as a map's, with their made trees kept off
      // as when they're played: treeclear.mjs realTrees.)
      // (Only once it's near enough to be seen from a hole: grow.)
      const grow = () => {
        const stored = mapped ? (realTrees(course, raw) ? keptLayout(raw) : clearedLayout(course, i, raw)) : cleared;
        const grown = mapped ? withEdits(stored) : L;
        const own = keptTrees(stored, grown, standsFor(course, i)).trees;
        return { trees: own, forms: own.map((t) => treeForm(t)) };
      };
      return { L, grow, grown: null };
    });
    const L = kept.L;
    const to = (p) => mine.toHole(toCourse(places[i], p));
    const shapes = holeShapes(mapped ? ownShapesOnly(L, owners[i], i) : L);
    const on = (polys) => polys.filter((p) => p?.length > 2).map((p) => p.map(to));
    const path = shapes.path.map(to);
    if (!path.some(([x, z]) => Math.hypot(x - mid[0], z - mid[1]) <= reach)) return;
    // Trees: each where its own hole's map found it; on a mapped course
    // one in the box of an earlier hole, or of this one, is that hole's.
    // (As they grow when it's played: its willows by the water, its
    // stands of oaks and conifers - courseplay.mjs grownTrees.)
    const trees = [];
    // Each tree's form from where it stands on its own hole (a form is
    // worked out from its spot: here it would be another tree).
    const forms = [];
    // (Each turned and leaning as on its own hole, its frame's turn into
    // this one's taken off: so one at a wood's edge reaches out over its
    // own hole from here too - treehits.mjs turnedForm.)
    const frameTurned = frameTurn(to);
    kept.grown ??= kept.grow();
    const its = kept.grown;
    for (let n = 0; n < its.trees.length; n++) {
      const t = its.trees[n];
      const c = toCourse(places[i], [t[0], t[1]]);
      if (mapped) {
        let taken = false;
        for (let k = 0; k < holes.length && !taken; k++) {
          if (k === i || !(k < i || k === index)) continue;
          const r = regionOf(holes[k]?.layout);
          if (r && frames[k] && boxDistance(r, ...frames[k].toHole(c)) <= 0) taken = true;
        }
        if (taken) continue;
      }
      const [x, z] = mine.toHole(c);
      trees.push([x, z, ...t.slice(2)]);
      forms.push(turnedForm(its.forms[n], frameTurned));
    }
    // How it's mown, as when it's played (sim/mowing.mjs): its patterns
    // turned into this hole's frame, and its tee, where its stripes start.
    const origin = to([0, 0]);
    const turn = (d) => {
      const b = to(d);
      return [b[0] - origin[0], b[1] - origin[1]];
    };
    const own = holeMowing(raw);
    const mowing = { fairway: turnedMow(own.fairway, turn), green: turnedMow(own.green, turn), origin };
    out.push({
      number: h.spec?.number ?? i + 1,
      mowing,
      index: i,
      mapped,
      path,
      pin: to(shapes.pin ?? L.path.at(-1)),
      open: mapped ? NEIGHBOURS.mappedOpen : (L.treeLine ?? 40),
      // A links hole's look ("dunes" or "green"), or null.
      links: L.links ? (L.links === "green" ? "green" : "dunes") : null,
      fairways: on(shapes.fairways),
      // An island green's way to land (sim/causeway.mjs).
      causeways: on(shapes.causeways ?? []),
      greens: on(shapes.greens),
      tees: on(shapes.tees),
      bunkers: on(shapes.bunkers),
      water: on(shapes.water),
      woods: on(shapes.woods),
      trees,
      forms,
      // Its decor placed by hand (sim/decor.mjs), where it stands on the
      // course: the same from every hole.
      decor: mapped ? [] : (L.decor ?? []).map((d) => [...mine.toHole(toCourse(places[i], [d[0], d[1]])), ...d.slice(2)]),
    });
  });
  // A designed hole's woods past its trees, as when it's played: the fuller
  // backdrop behind its green, and the woods out from its back rows
  // (sim/deepwoods.mjs) - each spot the nearest hole's, this one's too.
  out.forEach((h, k) => {
    if (h.mapped || !woods) return;
    const L = withEdits(holes[h.index].layout);
    const seed = courseHoleSeed(course, L.number ?? h.number);
    const character = characterFor(L, seed);
    const to = (x, z) => mine.toHole(toCourse(places[h.index], [x, z]));
    // (Kept as it first grew, if it is: sim/treelock.mjs.)
    const backdrop = liveLock(lockFor(holes[h.index].layout), holes[h.index].layout.edits)?.backdrop ?? backdropTrees(L, { seed, character });
    const grown = courseDeepWoods(course, h.index, { character, keepOff: backdrop });
    const ok = treeClearance(course, h.index);
    const frameTurned = frameTurn(([x, z]) => to(x, z));
    for (const t of [...backdrop, ...grown]) {
      if (!ok(t[0], t[1], treeReach(t))) continue;
      h.trees.push([...to(t[0], t[1]), ...t.slice(2)]);
      h.forms.push(turnedForm(treeForm(t), frameTurned));
    }
  });
  return dedupeTees(out);
}

// A designed hole's woods past its back rows on a course (sim/deepwoods.mjs),
// in its own frame: grown against every other hole of the course, once for
// the course as it is - the same woods whichever hole it's seen from, and
// as it's played (from another hole, it once grew against only the holes
// that one could see: 113 trees from one, 436 from another). character and
// keepOff (its backdrop's trees) as deepWoods takes them.
const deepKept = new WeakMap();
export function courseDeepWoods(course, index, { character = "parkland", keepOff = [] } = {}) {
  const holes = course?.holes ?? [];
  const L = withEdits(holes[index]?.layout);
  if (!L?.path?.length) return [];
  let kept = deepKept.get(course);
  if (!sameHoles(kept, course)) {
    kept = { ...holesNow(course), by: new Map() };
    deepKept.set(course, kept);
  }
  const key = `${index}|${character}|${keepOff.length}`;
  if (kept.by.has(key)) return kept.by.get(key);
  const places = coursePlaces(course);
  let others = [];
  if (places?.[index]) {
    const mine = holeFrame([places[index].x, places[index].z], places[index].heading);
    others = holes
      .map((h, i) => {
        const O = h?.layout;
        if (i === index || !O?.path?.length || !places[i]) return null;
        return { path: O.path.map((q) => mine.toHole(toCourse(places[i], q))), open: O.source === "map" ? NEIGHBOURS.mappedOpen : (O.treeLine ?? 40) };
      })
      .filter(Boolean);
  }
  const out = deepWoods(L, { character, others, keepOff, stands: standsFor(course, index) });
  kept.by.set(key, out);
  return out;
}

// A mapped course's woods past its holes' boxes (the owner: "how to deal
// with OB trees on the maps"): a hole's map fills its woods with trees in
// its own box only, so from the air the woods beyond each box stood empty.
// Every mapped hole's woods are filled here as far trees, on one grid over
// the whole course (so a wood two holes' maps both have is grown once),
// outside every hole's box (each box has its own trees) and within reach
// of this hole's middle, thinning in glades as deepwoods.mjs's do. Returns
// { trees: [[x, z, size, ...]] in this hole's frame, forms } (forms: each
// tree's treeForm, from where it stands on the course, so it's the same
// tree from any hole).
export function mappedWoods(course, index, { reach = NEIGHBOURS.reach, spacing = DEEP_WOODS.spacing, max = 16000 } = {}) {
  const holes = course?.holes ?? [];
  const me = holes[index]?.layout;
  if (!me?.path) return { trees: [], forms: [] };
  const places = coursePlaces(course);
  if (!places?.[index]) return { trees: [], forms: [] };
  const frameOf = (i) => holeFrame([places[i].x, places[i].z], places[i].heading);
  const mine = frameOf(index);
  const mid = middleOf(me.path);
  const woods = [];
  const boxes = [];
  holes.forEach((h, i) => {
    const L = h?.layout;
    if (L?.source !== "map" || !places[i]) return;
    if (L.region) boxes.push({ frame: frameOf(i), r: L.region });
    for (const poly of L.woods ?? []) if (poly?.length > 2) woods.push(poly.map((p) => toCourse(places[i], p)));
  });
  if (!woods.length) return { trees: [], forms: [] };
  const seed = courseHoleSeed(course, 0);
  const s0 = seed % 100003;
  const seen = new Set();
  const out = [];
  for (const poly of woods) {
    let x0 = Infinity;
    let x1 = -Infinity;
    let z0 = Infinity;
    let z1 = -Infinity;
    for (const [x, z] of poly) {
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      z0 = Math.min(z0, z);
      z1 = Math.max(z1, z);
    }
    for (let i = Math.floor(x0 / spacing); i <= Math.ceil(x1 / spacing) && out.length < max; i++) {
      for (let j = Math.floor(z0 / spacing); j <= Math.ceil(z1 / spacing) && out.length < max; j++) {
        const key = `${i},${j}`;
        if (seen.has(key)) continue;
        const r = (k) => hash2(i * 3 + k, j * 5 - k, s0 ^ 0x3a9d);
        const x = (i + 0.1 + 0.8 * r(1)) * spacing;
        const z = (j + 0.1 + 0.8 * r(2)) * spacing;
        if (!insidePolygon(poly, x, z)) continue;
        seen.add(key);
        const here = mine.toHole([x, z]);
        if (Math.hypot(here[0] - mid[0], here[1] - mid[1]) > reach) continue;
        if (boxes.some((b) => boxDistance(b.r, ...b.frame.toHole([x, z])) <= 0)) continue;
        // Glades, and a wood a little uneven.
        const glade = valueNoise(x, z, 70, s0 ^ 0x61ade);
        if (r(3) >= (glade < 0.2 ? 0.1 : 0.9 * smoothstep(0.2, 0.3, glade))) continue;
        const size = DEEP_WOODS.size[0] + r(4) * (DEEP_WOODS.size[1] - DEEP_WOODS.size[0]);
        out.push({ at: here, t: [Math.round(x * 100) / 100, Math.round(z * 100) / 100, Math.round(size * 100) / 100] });
      }
    }
  }
  const grown = treeStands(out.map((o) => o.t), seed);
  return { trees: out.map((o, k) => [o.at[0], o.at[1], ...grown[k].slice(2)]), forms: grown.map((t) => treeForm(t)) };
}

// A mapped course's tees are copied into every hole whose box they touch:
// each drawn once (by its middle, to the metre).
function dedupeTees(holes) {
  const seen = new Set();
  for (const h of holes) {
    h.tees = h.tees.filter((poly) => {
      const c = centroid(poly);
      const key = `${Math.round(c[0])},${Math.round(c[1])}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  return holes;
}

function centroid(poly) {
  let x = 0;
  let z = 0;
  for (const p of poly) {
    x += p[0];
    z += p[1];
  }
  return [x / poly.length, z / poly.length];
}

// The hole being played's own ground, where nothing of another hole is
// drawn: (x, z) in its frame -> 0 (clear of it) to 1 (on it). A designed
// hole's is out to its tree line and its deep rough past it (NEIGHBOURS.own,
// fading), and round its green and tee; a mapped hole's is its box (the
// ground built for it), a little more.
// play: only where the hole is played - out to its tree line (none of its
// deep rough), and closer round its green and tee: where a neighbour's
// mown ground, sand and water still show (paintNeighbours's play) - a
// links hole's long grass runs 60 m past its tree line, and a neighbour's
// fairway running there was cut off under it, a dark band across it. And
// never over another hole's fairway, green or tee (its layout's
// otherGround, sim/treeclear.mjs), nor just round them (NEIGHBOURS.shown):
// those are always drawn in full where they run through this hole's rough
// - the routing keeps two holes' lines 45 m apart, inside a wide hole's
// tree line, and the next hole's fairway was cut off along a curve, half of
// it gone (the owner, of the show reel's Sea Links 5th: "the fairway &
// green getting overlapped and looking messy"). This hole's own fairway,
// green and tee stay its own if another's ever comes that close.
export function ownArea(L, { band = 1, play = false } = {}) {
  if (L?.source === "map" && L.region) {
    const r = L.region;
    // Where it's played, its box: the others' mown ground painted right up
    // to its edge (and in under the edge, where its ground fades out),
    // since the box itself draws theirs inside it. Kept off the box and
    // boxOwn more, a fairway running out past the back of the hole had a
    // dark strip of plain rough across it (the owner: "fairway at the back
    // of the hole big dark streak across it").
    if (play) return (x, z) => 1 - smoothstep(-NEIGHBOURS.ownFade, 0, boxDistance(r, x, z) || -Math.min(x - r.x0, r.x1 - x, z - r.z0, r.z1 - z));
    return (x, z) => 1 - smoothstep(NEIGHBOURS.boxOwn, NEIGHBOURS.boxOwn + NEIGHBOURS.ownFade, boxDistance(r, x, z));
  }
  if (play) {
    const line = L?.treeLine ?? 40;
    const pin = L?.pin ?? L?.path?.at(-1) ?? [0, 0];
    const path = thinLine(L?.path ?? [[0, 0]]);
    const others = otherCover(L?.otherGround);
    const fairway = others && L?.fairway ? fairwayOutline(L) : null;
    const mine = (x, z) => Math.hypot(x, z) <= NEIGHBOURS.teePlay || (L.green && insideBlob(L.green, x, z, NEIGHBOURS.shown)) || (fairway && insidePolygon(fairway, x, z));
    return (x, z) => {
      if (Math.hypot(x - pin[0], z - pin[1]) <= NEIGHBOURS.greenPlay || Math.hypot(x, z) <= NEIGHBOURS.teePlay) return others && !mine(x, z) ? 1 - others(x, z) : 1;
      const v = 1 - smoothstep(line - NEIGHBOURS.ownFade, line, lineDistance(path, x, z));
      return v > 0 && others && !mine(x, z) ? v * (1 - others(x, z)) : v;
    };
  }
  const edge = (L?.treeLine ?? 40) + NEIGHBOURS.own * band;
  const pin = L?.pin ?? L?.path?.at(-1) ?? [0, 0];
  const path = thinLine(L?.path ?? [[0, 0]]);
  return (x, z) => {
    if (Math.hypot(x - pin[0], z - pin[1]) <= NEIGHBOURS.greenOwn || Math.hypot(x, z) <= NEIGHBOURS.teeOwn) return 1;
    return 1 - smoothstep(edge, edge + NEIGHBOURS.ownFade, lineDistance(path, x, z));
  };
}

// How much a spot (the hole's frame) is another hole's ground: 1 on one of
// its fairways, greens or tees (otherGround: [{ lie, poly }] in the frame)
// and out to NEIGHBOURS.shown round it, easing to 0 over the last
// shownFade; null with none.
function otherCover(otherGround) {
  const m = NEIGHBOURS.shown;
  const parts = (otherGround ?? [])
    .filter((q) => q?.poly?.length > 2)
    .map(({ poly }) => {
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
      for (const [x, z] of poly) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        z0 = Math.min(z0, z);
        z1 = Math.max(z1, z);
      }
      return { poly, x0: x0 - m, x1: x1 + m, z0: z0 - m, z1: z1 + m };
    });
  if (!parts.length) return null;
  return (x, z) => {
    let cover = 0;
    for (const q of parts) {
      if (x < q.x0 || x > q.x1 || z < q.z0 || z > q.z1) continue;
      if (insidePolygon(q.poly, x, z)) return 1;
      cover = Math.max(cover, 1 - smoothstep(m - NEIGHBOURS.shownFade, m, ringDistance(q.poly, x, z)));
    }
    return cover;
  };
}

// The distance from (x, z) to a closed outline's edge.
function ringDistance(poly, x, z) {
  let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const ax = poly[j][0];
    const az = poly[j][1];
    const dx = poly[i][0] - ax;
    const dz = poly[i][1] - az;
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

// ---- Painting them on the ground ---------------------------------------------------

// Fills a polygon (world [x, z] points) on the picture: rows along z,
// box { x0, z0, size } in world metres over n * n pixels. each(i, x, z)
// for every pixel whose middle is inside (even-odd).
export function fillPolygon(poly, { box, n }, each) {
  if (!poly || poly.length < 3) return;
  const cell = box.size / n;
  let z0 = Infinity;
  let z1 = -Infinity;
  for (const [, z] of poly) {
    z0 = Math.min(z0, z);
    z1 = Math.max(z1, z);
  }
  const r0 = clamp(Math.ceil((z0 - box.z0) / cell - 0.5), 0, n - 1);
  const r1 = clamp(Math.floor((z1 - box.z0) / cell - 0.5), 0, n - 1);
  const xs = [];
  for (let row = r0; row <= r1; row++) {
    const z = box.z0 + (row + 0.5) * cell;
    xs.length = 0;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [ax, az] = poly[j];
      const [bx, bz] = poly[i];
      if (az <= z === bz <= z) continue;
      xs.push(ax + ((z - az) / (bz - az)) * (bx - ax));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const c0 = clamp(Math.ceil((xs[k] - box.x0) / cell - 0.5), 0, n);
      const c1 = clamp(Math.floor((xs[k + 1] - box.x0) / cell - 0.5), -1, n - 1);
      for (let col = c0; col <= c1; col++) each(row * n + col, box.x0 + (col + 0.5) * cell, z);
    }
  }
}

// The same, its edges smoothed: each(i, x, z, cover) for every pixel the
// polygon covers any of, cover how much of it (0 - 1: four rows a pixel,
// each span's ends to the part of a pixel) - so a neighbour's bunker or
// green painted a couple of metres a pixel has a soft edge, not steps.
export function fillPolygonSoft(poly, { box, n }, each) {
  if (!poly || poly.length < 3) return;
  const cell = box.size / n;
  const SUB = 4;
  let z0 = Infinity;
  let z1 = -Infinity;
  for (const [, z] of poly) {
    z0 = Math.min(z0, z);
    z1 = Math.max(z1, z);
  }
  const r0 = clamp(Math.floor((z0 - box.z0) / cell), 0, n - 1);
  const r1 = clamp(Math.floor((z1 - box.z0) / cell), 0, n - 1);
  const cover = new Float32Array(n);
  const xs = [];
  for (let row = r0; row <= r1; row++) {
    let lo = n;
    let hi = -1;
    for (let s = 0; s < SUB; s++) {
      const z = box.z0 + (row + (s + 0.5) / SUB) * cell;
      xs.length = 0;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [ax, az] = poly[j];
        const [bx, bz] = poly[i];
        if (az <= z === bz <= z) continue;
        xs.push(ax + ((z - az) / (bz - az)) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const u0 = clamp((xs[k] - box.x0) / cell, 0, n);
        const u1 = clamp((xs[k + 1] - box.x0) / cell, 0, n);
        if (u1 <= u0) continue;
        const c0 = Math.floor(u0);
        const c1 = Math.min(n - 1, Math.floor(u1 - 1e-9));
        lo = Math.min(lo, c0);
        hi = Math.max(hi, c1);
        for (let col = c0; col <= c1; col++) cover[col] += (Math.min(u1, col + 1) - Math.max(u0, col)) / SUB;
      }
    }
    for (let col = lo; col <= hi; col++) {
      const c = cover[col];
      cover[col] = 0;
      if (c > 0.002) each(row * n + col, box.x0 + (col + 0.5) * cell, box.z0 + (row + 0.5) * cell, Math.min(1, c));
    }
  }
}

// A polygon grown by `by` metres from its middle (a fringe round a green,
// a collar round a bunker): good enough for the rounded shapes they are.
export function grown(poly, by) {
  const [cx, cz] = centroid(poly);
  return poly.map(([x, z]) => {
    const d = Math.hypot(x - cx, z - cz) || 1;
    return [x + ((x - cx) / d) * by, z + ((z - cz) / d) * by];
  });
}

// Paints the course's other holes into the country picture (a
// premultiplied RGBA Uint8Array, rows along z: sim/country.mjs
// paintCountry's) - box { x0, z0, size } its world metres, n its size:
//   holes    courseNeighbours' (this hole's frame)
//   colours  linear [r, g, b] for fairway (and linksFairway, a links hole
//            on the dunes') and green ([light, dark] each,
//            for their stripes), fringe, tee, sand, collar and water
//   own      ownArea's, for the hole being played (nothing drawn on it)
//   play     ownArea's with play, where the hole is played: the neighbours'
//            fairways, greens, tees, sand and water are kept off only that
//            (over its deep rough they show, as on the map); own if not given
//   mown     optional Uint8Array (n x n, rows along z): set to how much of
//            each pixel is a neighbour's mown ground or sand or water (0 -
//            255), so the ground's shader draws it plain and short
//            (look/glsl/ground.js gCountry: the rough's patches, dunes and
//            standing grass kept off it - they made the other holes'
//            fairways look like dunes from the air)
// First the made-up country is cleared along each hole, out past its tree
// line (the ground's own rough shows there), then each hole's fairway,
// tee, fringe and green, collars and bunkers go over it, and its water
// (in its muddy margin) last, over any sand running into it.
export function paintNeighbours(pixels, { box, n, holes, colours, own = () => 0, play = own, mown = null }) {
  if (!holes?.length) return pixels;
  const cell = box.size / n;
  // The hole being played's own ground, every few pixels and filled in
  // between (it fades over ten metres, so that's plenty).
  const grid = coarseGrid({ box, n, at: (x, z) => own(...fromWorldXZ([x, z])), lazy: true });
  // The clearing along each neighbour's line, the same way; a links
  // hole's long grass past its rough.
  clearAlong(pixels, { box, n, holes, cell, own: grid });
  for (const [look, colour] of [["dunes", colours.fescue], ["green", colours.longGreen]]) {
    if (colour) longGrass(pixels, { box, n, holes: holes.filter((h) => h.links === look), colour, own: grid });
  }
  // (Their mown ground, sand and water kept off only where the hole is
  // played: over its deep rough or long grass they still show.)
  const playGrid = play === own ? grid : coarseGrid({ box, n, at: (x, z) => play(...fromWorldXZ([x, z])), lazy: true });
  const lay = (poly, colourAt) =>
    fillPolygonSoft(poly.map(toWorldXZ), { box, n }, (i, x, z, cover) => {
      const w = (1 - playGrid.atPixel(i % n, Math.floor(i / n))) * cover;
      if (w <= 0) return;
      const c = colourAt(x, z);
      if (!c) return;
      const k = i * 4;
      const keep = 1 - w;
      pixels[k] = Math.round(c[0] * 255 * w + pixels[k] * keep);
      pixels[k + 1] = Math.round(c[1] * 255 * w + pixels[k + 1] * keep);
      pixels[k + 2] = Math.round(c[2] * 255 * w + pixels[k + 2] * keep);
      pixels[k + 3] = Math.round(255 * w + pixels[k + 3] * keep);
      if (mown) mown[i] = Math.max(mown[i], Math.round(255 * w));
    });
  for (const h of holes) {
    // Stripes across the hole, from its tee towards its green.
    const [tx, tz] = toWorldXZ(h.path[0]);
    const [gx, gz] = toWorldXZ(h.pin ?? h.path.at(-1));
    const len = Math.hypot(gx - tx, gz - tz) || 1;
    const [dx, dz] = [(gx - tx) / len, (gz - tz) / len];
    const striped = (pair, width) => (x, z) => pair[Math.floor(((x - tx) * dx + (z - tz) * dz) / width) & 1];
    // (A links hole on the dunes: its own paler fairway, as it's drawn played.)
    const fairway = h.links === "dunes" && colours.linksFairway ? colours.linksFairway : colours.fairway;
    for (const p of [...h.fairways, ...(h.causeways ?? [])]) lay(p, striped(fairway, NEIGHBOURS.stripe));
    for (const p of h.tees) lay(p, () => colours.tee);
    for (const p of h.greens) lay(grown(p, NEIGHBOURS.fringe), () => colours.fringe);
    for (const p of h.greens) lay(p, striped(colours.green, NEIGHBOURS.greenStripe));
    for (const p of h.bunkers) lay(grown(p, NEIGHBOURS.collar), () => colours.collar);
    for (const p of h.bunkers) lay(p, () => colours.sand);
    // Water last, over any sand that runs into it, inside its muddy
    // margin - as the hole draws it when it's played: water reaching onto
    // a green never over it or its fringe, which it gives way to (sim/
    // greenfirst.mjs), nor over an island green's causeway.
    const dry = h.water.length ? [...h.greens.map((p) => grown(p, NEIGHBOURS.fringe)), ...(h.causeways ?? [])].map((p) => p.map(toWorldXZ)) : [];
    const wet = (p, c) => (h.greens.some((g) => outlinesMeet(g, p)) ? (x, z) => (dry.some((g) => insidePolygon(g, x, z)) ? null : c) : () => c);
    for (const p of h.water) lay(grown(p, NEIGHBOURS.mud), wet(p, colours.mud ?? colours.water));
    for (const p of h.water) lay(p, wet(p, colours.water));
  }
  return pixels;
}

// A value over the picture worked out every `step` pixels and filled in
// between: { m, step, values, atPixel(col, row) }. at(x, z): the value at
// a world spot.
// lazy: each point worked out only when it's first asked for (the hole's
// own ground is only wanted where a neighbour is painted).
function coarseGrid({ box, n, at, step = 4, lazy = false }) {
  const cell = box.size / n;
  const m = Math.ceil(n / step) + 1;
  const values = new Float32Array(m * m);
  const point = (i, j) => at(box.x0 + (i * step + 0.5) * cell, box.z0 + (j * step + 0.5) * cell);
  if (lazy) values.fill(NaN);
  else for (let j = 0; j < m; j++) for (let i = 0; i < m; i++) values[j * m + i] = point(i, j);
  const value = (i, j) => {
    const k = j * m + i;
    let v = values[k];
    if (v !== v) v = values[k] = point(i, j);
    return v;
  };
  const atPixel = (col, row) => {
    const i = Math.floor(col / step);
    const j = Math.floor(row / step);
    const u = (col - i * step) / step;
    const v = (row - j * step) / step;
    const a = value(i, j);
    const b = value(i + 1, j);
    const c = value(i, j + 1);
    const d = value(i + 1, j + 1);
    return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
  };
  return { m, step, values, atPixel };
}

// A line with points no closer than `gap` metres (and its ends): for how
// far things are from it, where a few metres don't matter.
export function thinLine(line, gap = 12) {
  if (!line?.length) return [];
  const out = [line[0]];
  for (let i = 1; i < line.length - 1; i++) {
    const [px, pz] = out[out.length - 1];
    if (Math.hypot(line[i][0] - px, line[i][1] - pz) >= gap) out.push(line[i]);
  }
  if (line.length > 1) out.push(line[line.length - 1]);
  return out;
}

function clearAlong(pixels, { box, n, holes, cell, own }) {
  const step = own.step;
  // Worked out only round each hole (its line's box, grown by how far its
  // clearing reaches).
  const lines = holes.map((h) => {
    const world = thinLine(h.path).map(toWorldXZ);
    const reach = h.open + NEIGHBOURS.clear;
    let x0 = Infinity;
    let x1 = -Infinity;
    let z0 = Infinity;
    let z1 = -Infinity;
    for (const [x, z] of world) {
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      z0 = Math.min(z0, z);
      z1 = Math.max(z1, z);
    }
    return { world, reach, x0: x0 - reach - cell * step, x1: x1 + reach + cell * step, z0: z0 - reach - cell * step, z1: z1 + reach + cell * step };
  });
  // How much is cleared at each coarse point: 1 inside a hole's clearing,
  // fading out over its last 10 metres.
  const clear = coarseGrid({
    box,
    n,
    step,
    at: (x, z) => {
      let c = 0;
      for (const l of lines) {
        if (x < l.x0 || x > l.x1 || z < l.z0 || z > l.z1) continue;
        c = Math.max(c, 1 - smoothstep(l.reach - 10, l.reach, lineDistance(l.world, x, z)));
        if (c >= 1) break;
      }
      return c;
    },
  });
  // Only the cells with some clearing at a corner are touched.
  const m = clear.m;
  for (let j = 0; j + 1 < m; j++) {
    for (let i = 0; i + 1 < m; i++) {
      const v = clear.values;
      if (!(v[j * m + i] > 0 || v[j * m + i + 1] > 0 || v[(j + 1) * m + i] > 0 || v[(j + 1) * m + i + 1] > 0)) continue;
      for (let row = j * step; row < Math.min(n, (j + 1) * step); row++) {
        for (let col = i * step; col < Math.min(n, (i + 1) * step); col++) {
          const c = clear.atPixel(col, row);
          if (c <= 0) continue;
          const keep = 1 - c * (1 - own.atPixel(col, row));
          const k = (row * n + col) * 4;
          pixels[k] = Math.round(pixels[k] * keep);
          pixels[k + 1] = Math.round(pixels[k + 1] * keep);
          pixels[k + 2] = Math.round(pixels[k + 2] * keep);
          pixels[k + 3] = Math.round(pixels[k + 3] * keep);
        }
      }
    }
  }
}

// A links hole's long grass (course.mjs buildHole's trees "none"): from its
// deep rough out past its tree line, painted over its clearing, fading out
// over its last ten metres - as the hole's own fescue looks from the air.
function longGrass(pixels, { box, n, holes, colour, own }) {
  for (const h of holes) {
    const world = thinLine(h.path).map(toWorldXZ);
    const from = h.open - NEIGHBOURS.deep;
    const to = h.open + NEIGHBOURS.longGrass;
    const grass = coarseGrid({
      box,
      n,
      at: (x, z) => {
        const d = lineDistance(world, x, z);
        return smoothstep(from - 3, from, d) * (1 - smoothstep(to - 10, to, d));
      },
      lazy: true,
    });
    let x0 = Infinity;
    let x1 = -Infinity;
    let z0 = Infinity;
    let z1 = -Infinity;
    for (const [x, z] of world) {
      x0 = Math.min(x0, x - to);
      x1 = Math.max(x1, x + to);
      z0 = Math.min(z0, z - to);
      z1 = Math.max(z1, z + to);
    }
    const cell = box.size / n;
    const c0 = clamp(Math.floor((x0 - box.x0) / cell), 0, n - 1);
    const c1 = clamp(Math.ceil((x1 - box.x0) / cell), 0, n - 1);
    const r0 = clamp(Math.floor((z0 - box.z0) / cell), 0, n - 1);
    const r1 = clamp(Math.ceil((z1 - box.z0) / cell), 0, n - 1);
    for (let row = r0; row <= r1; row++) {
      for (let col = c0; col <= c1; col++) {
        const w = grass.atPixel(col, row) * (1 - own.atPixel(col, row));
        if (w <= 0) continue;
        const k = (row * n + col) * 4;
        const keep = 1 - w;
        pixels[k] = Math.round(colour[0] * 255 * w + pixels[k] * keep);
        pixels[k + 1] = Math.round(colour[1] * 255 * w + pixels[k + 1] * keep);
        pixels[k + 2] = Math.round(colour[2] * 255 * w + pixels[k + 2] * keep);
        pixels[k + 3] = Math.round(255 * w + pixels[k + 3] * keep);
      }
    }
  }
}

// How far another hole's frame is turned in this one's (radians: its x's
// way here), from `to` - a point of its frame [x, z] in this one's.
function frameTurn(to) {
  const o = to([0, 0]);
  const e = to([1, 0]);
  return Math.atan2(e[1] - o[1], e[0] - o[0]);
}

// ---- Their trees, and keeping the made-up woods off them -----------------------

// The neighbours' trees as far woods (look/farwoods.js): { x, z, h, w,
// kind, shape, tint, flip, stretch, scale } in the world, each the tree its
// hole grows there (treehits.mjs treeForm, from where it stands on its own
// hole) - the same kind and shape, and as tall and wide as it's drawn in
// 3D: scale is its height's (its picture's model units to metres), and
// stretch how much wider than that it spreads. h and w are for its painted
// shade. None on the hole being played's own ground.
export function neighbourTrees(holes, { own = () => 0 } = {}) {
  const out = [];
  for (const h of holes ?? []) {
    h.trees.forEach((t, k) => {
      if (own(t[0], t[1]) > 0) return;
      out.push(farTree(t, h.forms?.[k] ?? treeForm(t)));
    });
  }
  return out;
}

// A tree [x, z, ...] (hole frame) with its form (treehits.mjs treeForm) as
// a far tree in the world, drawn as its 3D self is (neighbourTrees).
export function farTree(t, form) {
  const kind = KINDS[form.kind] ?? "leaf";
  const [fh, fw] = FAR_SIZE[kind] ?? FAR_SIZE.leaf;
  const [x, z] = toWorldXZ([t[0], t[1]]);
  const r = hash2(Math.round(t[0] * 10), Math.round(t[1] * 10), 0x5eed);
  const stretch = ((form.w ?? form.h) * (form.sx ?? 1)) / (form.h || 1);
  return { x, z, h: fh * form.h, w: fw * form.h * stretch, kind, shape: form.shape, tint: r, flip: r < 0.5, stretch, scale: form.h };
}

// Whether a spot in the world is on a neighbour's open ground - inside its
// tree line, or on its green or tee - where the made-up far woods mustn't
// stand. Worked out on a grid of `cell` metres over the box.
export function neighbourGround(holes, { box, cell = 8 } = {}) {
  if (!holes?.length || !box) return () => false;
  const m = Math.ceil(box.size / cell);
  const grid = new Uint8Array(m * m);
  for (const h of holes) {
    const world = h.path.map(toWorldXZ);
    const open = Math.max(0, h.open - 3);
    const spots = [...h.greens, ...h.tees].map((p) => {
      const c = toWorldXZ(centroid(p));
      return { c, r: Math.max(...p.map((q) => Math.hypot(...toWorldXZ(q).map((v, i) => v - c[i])))) + 6 };
    });
    let x0 = Infinity;
    let x1 = -Infinity;
    let z0 = Infinity;
    let z1 = -Infinity;
    for (const [x, z] of world) {
      x0 = Math.min(x0, x - open);
      x1 = Math.max(x1, x + open);
      z0 = Math.min(z0, z - open);
      z1 = Math.max(z1, z + open);
    }
    for (const s of spots) {
      x0 = Math.min(x0, s.c[0] - s.r);
      x1 = Math.max(x1, s.c[0] + s.r);
      z0 = Math.min(z0, s.c[1] - s.r);
      z1 = Math.max(z1, s.c[1] + s.r);
    }
    const i0 = clamp(Math.floor((x0 - box.x0) / cell), 0, m - 1);
    const i1 = clamp(Math.floor((x1 - box.x0) / cell), 0, m - 1);
    const j0 = clamp(Math.floor((z0 - box.z0) / cell), 0, m - 1);
    const j1 = clamp(Math.floor((z1 - box.z0) / cell), 0, m - 1);
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        if (grid[j * m + i]) continue;
        const x = box.x0 + (i + 0.5) * cell;
        const z = box.z0 + (j + 0.5) * cell;
        if (lineDistance(world, x, z) <= open || spots.some((s) => Math.hypot(x - s.c[0], z - s.c[1]) <= s.r)) grid[j * m + i] = 1;
      }
    }
  }
  return (x, z) => {
    const i = Math.floor((x - box.x0) / cell);
    const j = Math.floor((z - box.z0) / cell);
    return i >= 0 && j >= 0 && i < m && j < m && grid[j * m + i] === 1;
  };
}

// The neighbours' greens and tees as low shapes on the ground (course.js
// draws them, lifted a little and plain): { greens, tees } polygons in
// this hole's frame - none touching the hole being played's own ground.
export function neighbourLows(holes, { own = () => 0 } = {}) {
  const clearOf = (poly) => poly.every(([x, z]) => own(x, z) <= 0);
  return {
    greens: (holes ?? []).flatMap((h) => h.greens.filter(clearOf)),
    tees: (holes ?? []).flatMap((h) => h.tees.filter(clearOf)),
  };
}
