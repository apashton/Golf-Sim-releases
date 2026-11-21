// A ball in the air meeting a tree: its trunk, or its crown of leaves.
//
// The trees are the ones the course draws (look/trees.js): the same kind,
// height, spread and turn for each, from treeForm, and the same shapes -
// a pine's tiers of needles, a broadleaf's five round masses of leaves, a
// trunk under each. Where the ball is drawn going into a tree, it meets it.
//
// A trunk is a hard hit: the ball comes off it with most of its speed gone,
// scattered a little either way. A crown is mostly air (the owner, 27
// October 2026: "Tree hits at the moment always go straight down. And
// leaves etc seem to kill the ball no matter what. There should sometimes
// be deflection and sometimes the ball passing through the trees with
// little to no contact"): going through it the ball brushes leaves, which
// take a little of its speed, and now and then meets something harder - a
// twig that knocks it a little aside, a branch it comes off as off any
// piece of wood (glancing on nearly its way, square back the way it came,
// up, down or out to the side, by how the branch lies and where on it the
// ball strikes), or, in the thick of a crown, a tangle of them that stops
// it dead, when it drops out of the tree. The deeper in the crown, the
// more of each; the edge of one is little more than leaves. And each time
// through a tree, the line the ball takes is its own - through a gap, or
// a clump - so the same crown can let one ball through barely touched and
// stop the next. What happens is drawn from a seed (the shot's), so the
// same shot does the same thing every time.
//
// Not every tree takes a ball the same. Each has its own thickness of
// leaves (treeForm's `thick`, 0.5 to 1.6 of the usual, 1 on average),
// drawn like its kind and height from where it stands, so the same tree
// always plays the same; and the leaves are spread through a crown by its
// kind (leafProfile): a pine's lowest branches are sparse, so a ball can
// often get through low under one but not through its crown, and a
// broadleaf is thicker at its heart than round its edges.
//
// Pure, no browser: the course's play (courseplay.mjs) steps the flight
// through treeStep, the drawing takes its shapes from treeForm, and the
// warning before a shot from under the trees (treewarn.mjs) looks along a
// line with treesOnLine.
//
// Heights here are absolute (the ground's own height, as hole.heightAt has
// it), positions in the hole's frame: x down the hole, z to the right.

import { treeShapes, trunkAt, trunkRadius, branchAt, branchRadius, needleProfile, needlesAt, TREE_SHAPES, KINDS, KIND, TIERED, shapeCount, firstShapes, moreShapes, commonMore, commonCount, thirdMore, thirdFrom, clumpMore, clumpFrom, EDGE_SHAPES, crownLop } from "./treeshapes.mjs";
import { OFFSHOOT, OFFSHOOT_KINDS, roomOf, treeOffshoots, boughDome } from "./offshoots.mjs";
import { mulberry32 } from "./mathutil.mjs";

// ---- The trees' forms -------------------------------------------------------------

// Deterministic randomness from a seed.
export function seededRand(seed) {
  return mulberry32(seed);
}

// A number from a list of numbers, the same every time for the same list.
export function hashNumbers(values) {
  let h = 0x811c9dc5;
  for (const v of values) {
    const n = Math.round((Number.isFinite(v) ? v : 0) * 1000);
    h = Math.imul(h ^ (n & 0xffff), 16777619);
    h = Math.imul(h ^ ((n >>> 16) & 0xffff), 16777619);
  }
  return h >>> 0;
}

// How thick a tree's leaves can be, against the usual: from sparse and
// forgiving to thick. Drawn as THICK[0] + (THICK[1] - THICK[0]) * u^1.2
// for u even between 0 and 1, which averages 1 (0.5 + 1.1 / 2.2): the
// trees as a whole take a ball as they did when every one was the same.
export const THICK = [0.5, 1.6];
const THICK_POWER = 1.2;

// How a tree [x, z, scale, kind, width] (hole frame, as a layout keeps it)
// is drawn: kind (treeshapes.mjs KINDS: 0 pine, 1 broadleaf, 2 silver
// birch, 3 weeping willow, 4 Lombardy poplar, 5 bush, and after them 6
// Scots pine, 7 spreading oak, 8 column conifer, 9 spruce, 10 dead snag),
// h its height scale, w its spread, yaw its turn about the upright
// (radians, as three.js turns it in the world frame), and thick how thick
// its leaves are (THICK; 1 the usual).
// A real tree (from LiDAR, or with a kind) keeps its kind and is within a
// few per cent of its scale's height (REAL_VARY); any other has its kind
// picked and its height varied a little more. Worked out from where the tree stands, so it doesn't
// change when some other tree is moved or taken away. A sixth number, if
// a tree has one, is its thickness instead of the drawn one, and a seventh
// its shape (for trying things out, and the tests). An eighth (1) marks it
// as by the water (courseplay.mjs prepareHole); a ninth, one of the newer
// kinds it grows as in a stand (treeStands), if it's given no kind of its
// own - drawn after everything else, so only its kind, shape and lean
// change. A tenth, its design as it was kept (sim/treelock.mjs: designOf),
// is its form as it was first worked out - whatever this code would make
// of it now - while the nine before it are still what it was made from.
// An eleventh, [which way the open side is (radians, in the hole's frame:
// atan2 of z over x), how much it stands at a wood's edge (0 - 1)], marks a
// tree at a wood's edge (sim/woodedge.mjs, laid on as its hole's trees
// grow: courseplay.mjs grownTrees) - grown reaching out to the open side
// (EDGE_FORM).
// Its form: { kind, h, w, yaw, thick, shape, leanA, lean, sx, sz, young,
// seed, open } - open: at a wood's edge, which way the open side is in the
// tree's own frame (radians, as sim/offshoots.mjs treeOffshoots' toward),
// its boughs crowded that way; else null.
export function treeForm(t) {
  return designed(t) ? formOfDesign(t[9]) : madeForm(t);
}

function madeForm([x, z, s = 1, kind, width = 1, thick, shapeSet, byWater, stand, , edge]) {
  const rand = seededRand(hashNumbers([x, z, s]) ^ 0x7f4a7c15);
  const known = Number.isInteger(kind) && kind >= 0 && kind < KINDS.length;
  let k = known ? kind : rand() < 0.55 ? 0 : 1;
  const h = known ? s : s * (0.85 + rand() * 0.35);
  let yaw = rand() * Math.PI * 2;
  // Drawn after the rest, so each tree keeps the kind, height and turn it
  // had before trees had a thickness.
  const drawn = THICK[0] + (THICK[1] - THICK[0]) * rand() ** THICK_POWER;
  // And after that, so none of the above changes: which of its kind's
  // shapes it takes (treeshapes.mjs), how it leans (lean radians, towards
  // leanA) and how unevenly it spreads (sx, sz: across its own x and z; a
  // real tree as wide both ways as it was measured, until REAL_VARY below).
  let shape = Math.floor(rand() * TREE_SHAPES);
  let leanA = rand() * Math.PI * 2;
  const leanBy = rand();
  let sx = known ? 1 : 0.85 + rand() * 0.35;
  let sz = known ? 1 : 0.85 + rand() * 0.35;
  // Last of all, what sort of tree one of no given kind is, beyond pine or
  // broadleaf: by water (an eighth number, 1: prepareHole marks the trees
  // near a pond or lake) as likely as not a weeping willow; and among the
  // broadleaves, now and then a silver birch or a Lombardy poplar. A pine
  // stays a pine.
  const variety = rand();
  if (!known) {
    if (byWater === 1 && variety < 0.45) k = KIND.willow;
    else if (k === KIND.leaf && variety < 0.2) k = KIND.birch;
    else if (k === KIND.leaf && variety < 0.3) k = KIND.poplar;
    // Growing in a stand: of one of the newer kinds (treeStands), or of
    // any of its hole's kinds (sim/treepalette.mjs palettedTrees).
    if (Number.isInteger(stand) && stand >= 0 && stand < KINDS.length) k = stand;
  }
  // The newer kinds have fewer shapes: the same draw, wrapped round.
  shape %= firstShapes(k);
  // And last, so no tree's anything above changes: as often as each of the
  // others, one of the shapes its kind has had added since (treeshapes.mjs
  // MORE_SHAPES) - a tree that took one of the first keeps it.
  // (The latest kinds have none: treeshapes.mjs LATEST_SHAPES.)
  const more = rand();
  const added = moreShapes(k) - firstShapes(k);
  const share = added / moreShapes(k);
  if (added > 0 && more < share) shape = firstShapes(k) + Math.min(added - 1, Math.floor((more / share) * added));
  let lean = leanBy * LEAN[k];
  // A seventh number chooses its shape (0 the classic tree) - for trying
  // things out, and the tests - and it then stands upright, as wide both
  // ways (and a real one exactly as tall as it's given).
  // And after all of it, so no tree's anything above changes: now and
  // then a young one (YOUNG) - smaller, and slimmer for its height - so a
  // wood's heights step down among its old trees and at its edges (the
  // owner, 27 October 2026: "expand the tree variation shapes and
  // sizes"). Only a tree of no given size: a real one is as it was
  // measured. Only ever smaller, so it keeps clear of whatever the full
  // size of it did.
  const young = rand();
  const youth = rand();
  const age = !known && young < YOUNG.share ? YOUNG.from + (YOUNG.to - YOUNG.from) * youth : 1;
  // And last of all, so nothing above changes: the tree's own seed, for
  // whatever else is its own - its boughs (sim/offshoots.mjs), which a ball
  // meets (treeIndex) as they're drawn, and its colour (look/trees.js) - so
  // the same tree is the same wherever it's drawn and met from, whatever
  // trees are round it.
  const seed = Math.floor(rand() * 4294967296) >>> 0;
  // And after the seed, so nothing above changes: a real tree's own height
  // and spread varied a little as the others' are (REAL_VARY; the owner's
  // list, 2 November 2026) - a measured one within a few per cent of its
  // height, each way of its spread on its own, so no two of a kind in a
  // row are the same tree.
  const vh = rand();
  const vx = rand();
  const vz = rand();
  let height = h;
  if (known) {
    height = s * (REAL_VARY.h[0] + (REAL_VARY.h[1] - REAL_VARY.h[0]) * vh);
    sx = REAL_VARY.w[0] + (REAL_VARY.w[1] - REAL_VARY.w[0]) * vx;
    sz = REAL_VARY.w[0] + (REAL_VARY.w[1] - REAL_VARY.w[0]) * vz;
  }
  // And after those: a pine's or a broadleaf's share of the shapes the
  // commonest kinds have had added since (treeshapes.mjs COMMON_SHAPES), as
  // often as each of its others.
  const common = rand();
  const extra = commonMore(k);
  const commonShare = extra / commonCount(k);
  if (extra > 0 && common < commonShare) shape = moreShapes(k) + Math.min(extra - 1, Math.floor((common / commonShare) * extra));
  // And after those (the owner's list, 5 November 2026): the commonest
  // kinds' third shape (treeshapes.mjs THIRD_MORE), as often as each of its
  // others; then a clump of stems (CLUMP_MORE) - a birch's, and a
  // broadleaf's (an alder's), as often as each of its others, and a
  // broadleaf by the water as likely as not (CLUMP_WATER).
  const third = rand();
  const thirds = thirdMore(k);
  const thirdShare = thirds / (thirdFrom(k) + thirds);
  if (thirds > 0 && third < thirdShare) shape = thirdFrom(k) + Math.min(thirds - 1, Math.floor((third / thirdShare) * thirds));
  const clump = rand();
  const clumps = clumpMore(k);
  const clumpShare = byWater === 1 && k === KIND.leaf ? CLUMP_WATER : clumps / shapeCount(k);
  if (clumps > 0 && clump < clumpShare) shape = clumpFrom(k) + Math.min(clumps - 1, Math.floor((clump / clumpShare) * clumps));
  // And last, a tree at a wood's edge (an eleventh number: sim/woodedge.mjs)
  // grown reaching out to the open side - from randomness of its own (its
  // seed's), so no other tree, nor anything above, changes. Not one given
  // a shape (below), a bush or a dead tree.
  const edged = Array.isArray(edge) && Number.isFinite(edge[0]) && edge[1] > 0 && !(Number.isInteger(shapeSet) && shapeSet >= 0) && !NO_EDGE.has(k);
  let open = null;
  if (edged) ({ shape, yaw, leanA, lean, sx, sz, open } = edgeForm({ kind: k, shape, yaw, leanA, lean, sx, sz, known, seed, at: edge[0], by: Math.min(1, edge[1]) }));
  if (Number.isInteger(shapeSet) && shapeSet >= 0) {
    shape = shapeSet % shapeCount(k);
    lean = 0;
    sx = 1;
    sz = 1;
    // (A real one as tall as it's given, too.)
    if (known) height = s;
  }
  const slim = age < 1 ? YOUNG.slim : 1;
  return { kind: k, h: height * age, w: s * width * age * slim, yaw, thick: Number.isFinite(thick) && thick > 0 ? thick : drawn, shape, leanA, lean, sx, sz, young: age < 1, seed, open };
}

// By the water, the share of broadleaves that grow as an alder's clump
// (treeshapes.mjs CLUMP_MORE).
export const CLUMP_WATER = 0.5;

// A tree at a wood's edge (the owner's list, 5 November 2026: "trees at a
// wood's edge reaching out over the fairway"), as real ones grow, its crown
// fuller and reaching further on the open side - every number of it within
// what any tree of its kind may have (so it reaches no further than a tree
// could before, only to the open side rather than any way; sim/treeclear.mjs
// keeps trees off the other holes by their reach as ever):
//   oneSided  how often (by how much it's at the edge) it takes its kind's
//             one-sided shape (treeshapes.mjs EDGE_SHAPES), if it has one
//   turn      its shape turned with its fuller side (crownLop) to the open,
//             give or take this (radians) - one hardly fuller one way
//             (under `lop` metres) keeps its own turn
//   lean      leaning out to the open side, give or take leanTurn
//             (radians), as far as this share of its kind's most (LEAN)
//   wider     its spread each way up towards its kind's widest (a made
//             tree's 1.2, a real one's REAL_VARY), by how much it's at
//             the edge
// and its boughs crowded to the open side, reaching their furthest
// (sim/offshoots.mjs treeOffshoots' toward: its form's `open`, in its own
// frame) - drawn as a ball meets them.
export const EDGE_FORM = { oneSided: 0.5, turn: 0.5, lop: 0.15, lean: [0.55, 1], leanTurn: 0.4, wider: [0.6, 1] };
const NO_EDGE = new Set([KIND.bush, KIND.snag]);
const MADE_SPREAD = [0.85, 1.2];
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
function edgeForm({ kind, shape, yaw, leanA, lean, sx, sz, known, seed, at, by }) {
  const er = seededRand((seed ^ 0xed9e5) >>> 0);
  const [one, which, turn, tilt, tiltTurn, wx, wz] = [er(), er(), er(), er(), er(), er(), er()];
  const sides = EDGE_SHAPES[kind];
  if (sides?.length && one < EDGE_FORM.oneSided * by) shape = sides[Math.floor(which * sides.length)];
  const most = known ? REAL_VARY.w[1] : MADE_SPREAD[1];
  const wider = (v, u) => Math.min(most, Math.max(v, 1 + (most - 1) * by * (EDGE_FORM.wider[0] + (EDGE_FORM.wider[1] - EDGE_FORM.wider[0]) * u)));
  sx = wider(sx, wx);
  sz = wider(sz, wz);
  // Its fuller side, spread as it's drawn, turned to the open: a way in
  // its own frame at angle q is at q - yaw + a quarter turn in the hole's.
  const [lx, lz] = SHAPES[kind][shape].lop;
  if (Math.hypot(lx, lz) >= EDGE_FORM.lop) yaw = wrap(Math.atan2(lz * sz, lx * sx) + Math.PI / 2 - at + (turn - 0.5) * EDGE_FORM.turn);
  // Leaning out: a lean about the level axis at leanA tips its top towards
  // leanA + half a turn in the hole's frame.
  leanA = wrap(at - Math.PI + (tiltTurn - 0.5) * EDGE_FORM.leanTurn);
  lean = Math.min(LEAN[kind], Math.max(lean, LEAN[kind] * (EDGE_FORM.lean[0] + (EDGE_FORM.lean[1] - EDGE_FORM.lean[0]) * by * tilt)));
  return { shape, yaw, leanA, lean, sx, sz, open: wrap(at + yaw - Math.PI / 2) };
}

// A tree's form as seen from another hole's frame: a hole's frame turned by
// `a` (radians: its own x lies at angle a in the other's) - its turn and
// lean turned with it, so it stands, leans and reaches the same way on the
// course from every hole (sim/neighbours.mjs). Its open side (its own
// frame's) is unchanged.
export function turnedForm(f, a) {
  return { ...f, yaw: wrap(f.yaw - a), leanA: wrap(f.leanA + a) };
}
// A tree's design as it's kept with it (sim/treelock.mjs): [check, kind,
// shape, h, w, yaw, thick, lean, leanA, sx, sz, young, seed, hand] - its
// treeForm rounded (a millimetre, a tenth of a milliradian: nothing anyone
// could see), check what it was made from (recipeCheck), and hand 1 for
// one planted or moved by hand (sim/treeclear.mjs keeps it off other
// holes as one).
// And open: at a wood's edge, its open side (its form's `open`), else null
// - a design kept before trees had one has none (its first 14 numbers are
// a design as ever).
const DESIGN_LENGTH = 14;
const roundTo = (v, k) => Math.round(v * k) / k;
export function designOf(t, form = treeForm(t), hand = false) {
  const f = form;
  return [recipeCheck(t), f.kind, f.shape, roundTo(f.h, 1e3), roundTo(f.w, 1e3), roundTo(f.yaw, 1e4), roundTo(f.thick, 1e3), roundTo(f.lean, 1e4), roundTo(f.leanA, 1e4), roundTo(f.sx, 1e3), roundTo(f.sz, 1e3), f.young ? 1 : 0, f.seed >>> 0, hand ? 1 : 0, Number.isFinite(f.open) ? roundTo(f.open, 1e4) : null];
}

// The form a kept design stands for (treeForm's). A shape past the end of
// its kind's (fewer shapes than when it was kept) wraps round.
function formOfDesign(d) {
  const kind = Number.isInteger(d[1]) && d[1] >= 0 && d[1] < KINDS.length ? d[1] : 1;
  return { kind, h: d[3], w: d[4], yaw: d[5], thick: d[6], shape: (d[2] >>> 0) % shapeCount(kind), leanA: d[8], lean: d[7], sx: d[9], sz: d[10], young: d[11] === 1, seed: d[12] >>> 0, open: Number.isFinite(d[14]) ? d[14] : null };
}

// What a tree was made from, as one number: its size, kind, spread,
// thickness, shape, whether it's by the water and its stand's kind - not
// where it stands, so one moved keeps its design (a kept design whose
// check no longer matches is worked out afresh: one resized, say).
export function recipeCheck(t) {
  return hashNumbers([t[2] ?? 1, t[3] ?? -1, t[4] ?? 1, t[5] ?? -1, t[6] ?? -1, t[7] ?? 0, t[8] ?? -1]);
}

// Whether a tree carries its design kept (treeForm's tenth number).
export function designed(t) {
  return Array.isArray(t?.[9]) && t[9].length >= DESIGN_LENGTH && t[9][0] === recipeCheck(t);
}

// A real tree's (from LiDAR, or with a kind) height, from its measured
// one, and each way of its spread (treeForm sx, sz): within these. Its
// height stays near what was measured; a made tree's varies more (0.85 -
// 1.2, and its spread the same).
export const REAL_VARY = { h: [0.94, 1.06], w: [0.88, 1.14] };

// The young trees: this share of the made trees, this size of a full one
// (between from and to), and their spread this share of that again.
export const YOUNG = { share: 0.14, from: 0.6, to: 0.84, slim: 0.9 };
// How far each kind may lean (radians): a pine or a poplar stands
// straighter, a birch or a willow leans more; a bush hardly; an oak about
// 5°, a snag 4°, a Scots pine or a spruce 3°, a column conifer 1°; a
// beech or a horse chestnut 3°, a cedar 3.5°, a holly 2°, a hawthorn 7°
// (twisted, wind-bent).
export const LEAN = [0.045, 0.08, 0.12, 0.14, 0.02, 0.03, 0.052, 0.087, 0.017, 0.052, 0.07, 0.052, 0.052, 0.061, 0.035, 0.12];

export const treeForms = (trees) => trees.map(treeForm);

// ---- Stands of the newer kinds ------------------------------------------------------

// Where the newer kinds grow on a course whose trees have no kind of their
// own (every designed hole, and a mapped one's filled woods): in stands, a
// few tens of metres across, from the hole's own seed - so the same hole
// grows the same stands every time it's played. In a stand of conifers its
// pines are Scots pines, spruces or column conifers; in a stand of oaks
// most of its broadleaves are spreading oaks; and now and then, in any
// stand, a tree has died and stands as a snag. Birches, poplars, willows,
// bushes and trees with a kind of their own (from LiDAR, planted by hand)
// stay as they are, and outside a stand every tree is what it always was.
// Returns the trees, each changed one with a ninth number: the kind it
// grows as (treeForm).
export const STAND = { size: 42, share: 0.6, oaks: 0.8, snags: 0.035 };
export function treeStands(trees, seed = 1) {
  const s = (seed >>> 0) || 1;
  return trees.map((t) => {
    const [x, z, scale = 1, kind, width = 1, thick, shapeSet, byWater] = t;
    if (kind != null) return t;
    const inStand = standNoise(x / STAND.size, z / STAND.size, s) > STAND.share;
    if (!inStand) return t;
    const k = treeForm(t).kind;
    if (k !== KIND.pine && k !== KIND.leaf) return t;
    // Which stand: oaks, or one kind of conifer - over broader ground.
    const which = standNoise(x / (STAND.size * 1.9) + 31.7, z / (STAND.size * 1.9) - 12.3, s ^ 0x5eed);
    const own = hashNumbers([x, z, s % 100003]) / 4294967296;
    let grow = null;
    if (own < STAND.snags) grow = KIND.snag;
    else if (k === KIND.leaf && (which < 0.5 || own < STAND.oaks * 0.35)) grow = own < STAND.oaks ? KIND.oak : null;
    else if (k === KIND.pine) grow = which < 0.42 ? KIND.scots : which < 0.66 ? KIND.spruce : KIND.column;
    return grow == null ? t : [x, z, scale, kind, width, thick, shapeSet, byWater, grow];
  });
}

// Smooth value noise (0 - 1) over a grid of whole numbers, from a seed.
function latticeValue(ix, iz, seed) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iz, 668265263) ^ Math.imul(seed, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function standNoise(x, z, seed) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const sx = fx * fx * (3 - 2 * fx);
  const sz = fz * fz * (3 - 2 * fz);
  const a = latticeValue(ix, iz, seed);
  const b = latticeValue(ix + 1, iz, seed);
  const c = latticeValue(ix, iz + 1, seed);
  const d = latticeValue(ix + 1, iz + 1, seed);
  return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz;
}

// How far a drawn tree's leaves can reach, for keeping a camera out of
// them: `reach` is how far its drawing's leaves reach from the foot of the
// trunk at scale 1 - level (r) and up or down (y), model units, from the
// geometry itself (look/trees.js). Returns { r, top }: how far out from
// the foot they can be and how high above it, once the tree is spread,
// sized and leaning as its form says.
// This is a bound worked out from the drawing, not the shapes a ball meets
// (treeIndex): those are the heart of the leaves, and the cards round them
// reach several metres past them on a big tree. Turning a tree about the
// upright doesn't move its leaves any further out, so only its spread, its
// size and its lean count - and a lean of angle a can carry a leaf y high
// out by y sin a, and one r out up by r sin a, never more. (With its
// leaves' outline from above - reach.hull, levelHull's corners as x, z, x,
// z... - exactly as far out as its spread carries them: a crown longer one
// way than the other, a clump of two stems, spread more the other way, is
// no further out than that.)
export function crownBound(form, reach) {
  const sx = form.sx ?? 1;
  const sz = form.sz ?? 1;
  let spread = Math.max(sx, sz) * reach.r;
  if (reach.hull?.length >= 2) {
    let most = 0;
    for (let i = 0; i + 1 < reach.hull.length; i += 2) most = Math.max(most, Math.hypot(sx * reach.hull[i], sz * reach.hull[i + 1]));
    spread = Math.min(spread, most);
  }
  const out = form.w * spread;
  const up = form.h * reach.y;
  const lean = Math.abs(form.lean ?? 0);
  return { r: out + up * Math.sin(lean), top: up * Math.cos(lean) + out * Math.sin(lean) };
}

// The hull round points [[x, z]...] (counter-clockwise, Andrew's monotone
// chain): every point's distance from the middle under any spread is at
// most its corners' - so a crown's outline from above, for crownBound.
export function levelHull(points) {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length < 3) return pts;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

// The drawn shapes, in the model's own units: every kind's shapes
// (treeshapes.mjs) - a pine's tiers of needles, a broadleaf's lumps
// of leaves, and the trunk under each, bent or not, with any low branches.
// A broadleaf's leaf cards reach out a little past its solid lumps:
// LEAF_REACH of their radius.
export const LEAF_REACH = 1.2;
// The model stands this far down into the ground (look/trees.js).
export const SUNK = 0.2;
const BALL_RADIUS = 0.021;

// How deep (0 at the edge of the leaves, 1 at the heart of the crown) a
// point (model units, from the foot of the trunk) is in a crown of a shape.
function crownDepthOf(kind, shape, mx, my, mz) {
  if (TIERED.has(kind)) {
    const at = needlesAt(shape.needles, my);
    if (!at || at[0] <= 0) return 0;
    const d = 1 - Math.hypot(mx - at[1], mz - at[2]) / at[0];
    // Thinning out at the bottom of the lowest tier.
    return Math.max(0, Math.min(d, (my - shape.bottom) / 1.5));
  }
  let best = 0;
  // (A lump may carry how deep its middle is, of a whole lump's: a
  // bough's clumps, out at the crown's edge, sim/offshoots.mjs.) Only a
  // lump the point is near enough to for it to be deeper than the deepest
  // yet is measured: told by its distance squared first, with a hair to
  // spare, so the depth is to the last digit what measuring every lump gave
  // - a tree wearing boughs has dozens of them, and this is most of a
  // ball's time in the trees.
  const { spheres } = shape;
  for (let i = 0; i < spheres.length; i++) {
    const s = spheres[i];
    const k = s[4] ?? 1;
    const R = s[3] * LEAF_REACH;
    const dx = mx - s[0];
    const dy = my - s[1];
    const dz = mz - s[2];
    const near = R * (1 - best / k);
    if (near <= 0 || dx * dx + dy * dy + dz * dz >= near * near * (1 + 1e-9)) continue;
    const d = (1 - Math.hypot(dx, dy, dz) / R) * k;
    if (d > best) best = d;
  }
  return best;
}

// How thick the leaves are at a point in a crown, against the tree's own
// average: model height y (from the foot of the trunk, model units) and
// depth d. A pine's lowest tier is sparse - bare twigs and a few needles,
// a ball can get through under it - and it fills in up the tree to its
// thick crown. A broadleaf is thicker at its heart than round its edges.
// The newer conifers go by how far up their own crown a point is (from the
// bottom of its needles to its tip, NEEDLE_LAYERS): a spruce as a pine, a
// Scots pine's high umbrella thin only at its underside, a column conifer
// dense right down to the ground. Each shape's is scaled (its
// profileScale) so that across its crown the leaves a ball meets come to
// the tree's `thick`, no more.
const PINE_LAYERS = [
  [0, 0.25],
  [2.4, 0.3],
  [4.2, 1.1],
  [6, 1.25],
  [10.1, 1.25],
];
const NEEDLE_LAYERS = {
  [KIND.scots]: [[0, 0.35], [0.3, 1.05], [0.55, 1.25], [1, 1.25]],
  [KIND.spruce]: [[0, 0.3], [0.15, 0.45], [0.35, 1.15], [0.5, 1.25], [1, 1.25]],
  [KIND.column]: [[0, 0.95], [0.15, 1.2], [1, 1.25]],
  // A cedar's flat layers: thick right through each, a little thinner at
  // the lowest's underside.
  [KIND.cedar]: [[0, 0.7], [0.2, 1.15], [1, 1.2]],
};
function layered(L, y) {
  if (y <= L[0][0]) return L[0][1];
  for (let i = 1; i < L.length; i++) {
    if (y <= L[i][0]) {
      const [y0, v0] = L[i - 1];
      const [y1, v1] = L[i];
      return v0 + ((v1 - v0) * (y - y0)) / (y1 - y0);
    }
  }
  return L[L.length - 1][1];
}
function rawProfile(kind, y, d, shape) {
  // Every kind of lumps of leaves: thicker at its heart than round its edges.
  if (!TIERED.has(kind)) return 0.55 + 0.9 * d;
  if (kind === KIND.pine) return layered(PINE_LAYERS, y);
  return layered(NEEDLE_LAYERS[kind], (y - shape.bottom) / Math.max(1e-6, shape.top - shape.bottom));
}

// The profile averaged over a shape's crown - every point in the leaves
// counted by how deep in it is, as a ball going through meets them - so it
// can be brought to 1.
function profileScaleOf(kind, shape) {
  let sum = 0;
  let weight = 0;
  const step = 0.3;
  for (let y = 0; y <= shape.top; y += step) {
    for (let x = -shape.reach; x <= shape.reach; x += step) {
      for (let z = -shape.reach; z <= shape.reach; z += step) {
        const d = crownDepthOf(kind, shape, x, y, z);
        if (d <= 0) continue;
        sum += rawProfile(kind, y, d, shape) * d;
        weight += d;
      }
    }
  }
  // (No leaves at all - a snag - nothing to scale.)
  return sum > 0 ? weight / sum : 1;
}

// Each shape ready to be met: how far its crown reaches from the trunk and
// how high, its leaves' profile scale, and its trunk (and low branches) as
// short straight pieces [x0, y0, z0, x1, y1, z1, r] in model units.
const SHAPES = (() => {
  const all = treeShapes();
  return KINDS.map((name) => all[name]).map((list, kind) =>
    list.map((sh) => {
      const shape = { ...sh };
      if (TIERED.has(kind)) {
        shape.needles = needleProfile(sh.tiers);
        shape.bottom = shape.needles[0][0];
        shape.reach = Math.max(...shape.needles.map(([, r, dx, dz]) => Math.hypot(dx, dz) + r));
        shape.top = shape.needles[shape.needles.length - 1][0];
      } else {
        // (A snag has no leaves: its reach and top are its trunk's and
        // branches', below.)
        shape.reach = Math.max(0, ...sh.spheres.map(([x, , z, r]) => Math.hypot(x, z) + r * LEAF_REACH));
        shape.top = Math.max(0, ...sh.spheres.map(([, y, , r]) => y + r * LEAF_REACH));
      }
      const pieces = [];
      const T = 6;
      for (let i = 0; i < T; i++) {
        const [a, b] = [trunkAt(sh.trunk, i / T), trunkAt(sh.trunk, (i + 1) / T)];
        pieces.push([...a, ...b, trunkRadius(sh.trunk, (i + 0.5) / T)]);
      }
      // (A clump's stems in as many pieces as its trunk: each as long.)
      for (const br of sh.trunk.branches) {
        const n = br.stem ? T : 3;
        for (let i = 0; i < n; i++) {
          const [a, b] = [branchAt(sh.trunk, br, i / n), branchAt(sh.trunk, br, (i + 1) / n)];
          pieces.push([...a, ...b, branchRadius(br, (i + 0.5) / n)]);
        }
      }
      // Which way its crown is fuller (treeshapes.mjs crownLop): a tree at
      // a wood's edge turns it to the open (edgeForm).
      shape.lop = crownLop(sh);
      shape.pieces = pieces;
      shape.reach = Math.max(shape.reach, ...pieces.map((q) => Math.hypot(q[3], q[5]) + q[6]));
      shape.top = Math.max(shape.top, ...pieces.map((q) => Math.max(q[1], q[4]) + q[6]));
      shape.trunkTop = sh.trunk.height;
      // (Its profile's scale worked out the first time a ball meets one:
      // every shape's at once was seconds of a phone's start.)
      let scale = null;
      Object.defineProperty(shape, "profileScale", { enumerable: true, get: () => (scale ??= profileScaleOf(kind, shape)) });
      return shape;
    }),
  );
})();
export const shapeOf = (t) => SHAPES[t.kind][t.shape ?? 0];

// A tree wearing boughs (sim/offshoots.mjs OFFSHOOT_KINDS): its own crown,
// as a ball meets it - its shape's lumps, as ever (its heart and the leaves
// between its boughs, as thick as they always were: the tree catches what
// it always caught), and its boughs' clumps where they're drawn close up
// (look/trees.js), out at its edge: thin leaves (each OFFSHOOT.edge as deep
// at its middle as a lump), where a ball clipping a bough's reach brushes
// them. (Their wood isn't met as a trunk's: a crown's branches are, by
// chance - the branch rates.) Like a shape: { spheres, reach, top, pieces,
// trunkTop, profileScale (its shape's: within 3% of its own, which would be
// tens of milliseconds the first time a ball met it) }, own. Or null.
function boughCrown(f) {
  if (!OFFSHOOT_KINDS.has(f.kind) || f.seed == null) return null;
  const sh = SHAPES[f.kind][f.shape];
  const spheres = [...sh.spheres];
  for (const b of treeOffshoots({ trunk: sh.trunk, dome: boughDome(sh) }, f.seed, { kind: f.kind, toward: f.open })) for (const [x, y, z, r] of b.clumps) spheres.push([x, y, z, r, OFFSHOOT.edge]);
  const crown = { spheres, pieces: sh.pieces, trunkTop: sh.trunkTop, own: true };
  crown.reach = Math.max(sh.reach, ...spheres.map(([x, , z, r]) => Math.hypot(x, z) + r * LEAF_REACH));
  crown.top = Math.max(sh.top, ...spheres.map(([, y, , r]) => y + r * LEAF_REACH));
  Object.defineProperty(crown, "profileScale", { enumerable: true, get: () => sh.profileScale });
  return crown;
}
// How far a tree wearing boughs may reach and how high (model units): its
// shape's, or the room its boughs are kept in (sim/offshoots.mjs roomOf),
// whichever is more - known without placing them.
function boughRoom(f) {
  const sh = SHAPES[f.kind][f.shape];
  if (!OFFSHOOT_KINDS.has(f.kind) || f.seed == null) return sh;
  const room = roomOf(boughDome(sh));
  return { reach: Math.max(sh.reach, room.r), top: Math.max(sh.top, room.top) };
}

// For the tests and the drawing: a kind's first shape's crown - a pine's
// needles' reach up it [y, r], a broadleaf's lumps [x, y, z, r].
export const PINE_PROFILE = SHAPES[0][0].needles.map(([y, r]) => [y, r]);
export const BROADLEAF_SPHERES = SHAPES[1][0].spheres;

export function leafProfile(kind, y, d, shape = 0, crown = null) {
  const sh = crown ?? SHAPES[kind][shape];
  return rawProfile(kind, y, d, sh) * sh.profileScale;
}

// How thick the leaves are (1 the usual) at a point (hole frame, absolute
// height) at depth d in tree t's crown: the tree's own thickness, spread
// through the crown by its kind and shape.
export function thicknessAt(t, y, d) {
  return t.thick * leafProfile(t.kind, (y - t.base) / t.h, d, t.shape ?? 0, t.crown);
}

// ---- Where the trees stand: a grid to find them quickly -----------------------------

const CELL = 12;
const key = (ix, iz) => (ix + 32768) * 65536 + (iz + 32768);

// Every tree of a hole ready to be met: its form, the foot of its trunk
// (heightAt: the ground's height, as the course draws it), how far its
// crown reaches and how high, and a grid of CELL-metre squares holding
// each tree in every square its crown reaches into.
export function treeIndex(trees = [], heightAt = () => 0) {
  const list = trees.map((t) => {
    const [x, z] = t;
    const f = treeForm(t);
    const base = heightAt(x, z) - SUNK;
    const shape = SHAPES[f.kind][f.shape];
    // (A tree wearing boughs reaches as far as their room: boughRoom.)
    const room = boughRoom(f);
    const tr = {
      x,
      z,
      ...f,
      c: Math.cos(f.yaw),
      s: Math.sin(f.yaw),
      // The lean: a turn about a level axis.
      lc: Math.cos(f.lean),
      ls: Math.sin(f.lean),
      ax: Math.cos(f.leanA),
      az: Math.sin(f.leanA),
      base,
      top: base + room.top * f.h,
    };
    // How far out it reaches, spread and lean and all.
    tr.reach = room.reach * f.w * Math.max(f.sx, f.sz) + Math.sin(f.lean) * room.top * f.h;
    // Its trunk and low branches, in the hole's frame, as the ball meets
    // them: each piece with the ball's radius on.
    const across = (f.w * (f.sx + f.sz)) / 2;
    tr.pieces = shape.pieces.map(([x0, y0, z0, x1, y1, z1, r]) => [...toHole(tr, x0, y0, z0), ...toHole(tr, x1, y1, z1), r * across + BALL_RADIUS]);
    tr.trunkR = tr.pieces[0][6];
    // Its own crown, if it wears boughs: placed the first time a ball comes
    // near it (boughCrown), not for every tree of a hole as it's built.
    if (room !== shape) {
      let crown;
      Object.defineProperty(tr, "crown", { enumerable: true, get: () => (crown ??= boughCrown(f)) });
    }
    return tr;
  });
  const cells = new Map();
  list.forEach((t, i) => {
    for (let ix = Math.floor((t.x - t.reach) / CELL); ix <= Math.floor((t.x + t.reach) / CELL); ix++) {
      for (let iz = Math.floor((t.z - t.reach) / CELL); iz <= Math.floor((t.z + t.reach) / CELL); iz++) {
        const k = key(ix, iz);
        const c = cells.get(k);
        if (c) c.push(i);
        else cells.set(k, [i]);
      }
    }
  });
  return { list, cells, stamp: new Uint32Array(list.length), mark: 0 };
}

// The trees whose crowns reach into the squares a segment crosses (its box):
// the ones a step of a flight looks at.
export function nearby(index, a, b) {
  const out = [];
  if (!index.list.length) return out;
  index.mark = (index.mark + 1) >>> 0 || 1;
  for (let ix = Math.floor(Math.min(a[0], b[0]) / CELL); ix <= Math.floor(Math.max(a[0], b[0]) / CELL); ix++) {
    for (let iz = Math.floor(Math.min(a[2], b[2]) / CELL); iz <= Math.floor(Math.max(a[2], b[2]) / CELL); iz++) {
      const c = index.cells.get(key(ix, iz));
      if (!c) continue;
      for (const i of c) {
        if (index.stamp[i] === index.mark) continue;
        index.stamp[i] = index.mark;
        out.push(i);
      }
    }
  }
  return out;
}

// A point of tree t's model (model units, from the foot of its trunk) in
// the hole's frame (absolute height): its spread and size, its turn, its
// lean - as look/trees.js draws it - then the world's frame to the hole's.
function toHole(t, mx, my, mz) {
  // Size, then the turn about the upright (as three.js turns it).
  const px = mx * t.w * t.sx;
  const py = my * t.h;
  const pz = mz * t.w * t.sz;
  const wx0 = px * t.c + pz * t.s;
  const wz0 = -px * t.s + pz * t.c;
  const [wx, wy, wz] = rotate(wx0, py, wz0, t.ax, t.az, t.lc, t.ls);
  // The world's (x, z) is the hole's (z, -x).
  return [t.x - wz, t.base + wy, t.z + wx];
}

// A turn about the level axis (ax, 0, az) by an angle with cosine c and
// sine s (Rodrigues).
function rotate(x, y, z, ax, az, c, s) {
  const dot = ax * x + az * z;
  // axis x v = (ax, 0, az) x (x, y, z) = (0*z - az*y, az*x - ax*z, ax*y - 0*x)
  const kx = -az * y;
  const ky = az * x - ax * z;
  const kz = ax * y;
  return [x * c + kx * s + ax * dot * (1 - c), y * c + ky * s, z * c + kz * s + az * dot * (1 - c)];
}

// How deep a point (hole frame, absolute height) is in tree t's crown.
export function depthIn(t, x, y, z) {
  // Hole frame to the world's (x, z) -> (z, -x), then back through the
  // tree's lean, turn and size to the model's own units.
  const [wx, wy, wz] = rotate(z - t.z, y - t.base, -(x - t.x), t.ax, t.az, t.lc, -t.ls);
  const mx = (wx * t.c - wz * t.s) / (t.w * t.sx);
  const mz = (wx * t.s + wz * t.c) / (t.w * t.sz);
  return crownDepthOf(t.kind, t.crown ?? SHAPES[t.kind][t.shape], mx, wy / t.h, mz);
}

// The distance from a point to a piece [x0, y0, z0, x1, y1, z1, r] of a
// trunk or branch, less its radius, and the nearest point on its middle.
function toPiece(q, px, py, pz) {
  const dx = q[3] - q[0];
  const dy = q[4] - q[1];
  const dz = q[5] - q[2];
  const l2 = dx * dx + dy * dy + dz * dz;
  const f = l2 > 0 ? Math.max(0, Math.min(1, ((px - q[0]) * dx + (py - q[1]) * dy + (pz - q[2]) * dz) / l2)) : 0;
  const cx = q[0] + dx * f;
  const cy = q[1] + dy * f;
  const cz = q[2] + dz * f;
  return { gap: Math.hypot(px - cx, py - cy, pz - cz) - q[6], at: [cx, cy, cz] };
}

// The nearest two segments come: [distance, where along the first (0-1)]
// for p0-p1 (the ball's) and q0-q1 (a piece of trunk).
function closest(p0, p1, q0, q1) {
  const d1 = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
  const d2 = [q1[0] - q0[0], q1[1] - q0[1], q1[2] - q0[2]];
  const r = [p0[0] - q0[0], p0[1] - q0[1], p0[2] - q0[2]];
  const a = d1[0] * d1[0] + d1[1] * d1[1] + d1[2] * d1[2];
  const e = d2[0] * d2[0] + d2[1] * d2[1] + d2[2] * d2[2];
  const f = d2[0] * r[0] + d2[1] * r[1] + d2[2] * r[2];
  let s = 0;
  let t = 0;
  if (a <= 1e-12 && e <= 1e-12) return [Math.hypot(...r), 0];
  if (a <= 1e-12) t = Math.max(0, Math.min(1, f / e));
  else {
    const c = d1[0] * r[0] + d1[1] * r[1] + d1[2] * r[2];
    if (e <= 1e-12) s = Math.max(0, Math.min(1, -c / a));
    else {
      const b = d1[0] * d2[0] + d1[1] * d2[1] + d1[2] * d2[2];
      const den = a * e - b * b;
      s = den > 1e-12 ? Math.max(0, Math.min(1, (b * f - c * e) / den)) : 0;
      t = (b * s + f) / e;
      if (t < 0) {
        t = 0;
        s = Math.max(0, Math.min(1, -c / a));
      } else if (t > 1) {
        t = 1;
        s = Math.max(0, Math.min(1, (b - c) / a));
      }
    }
  }
  const px = p0[0] + d1[0] * s - (q0[0] + d2[0] * t);
  const py = p0[1] + d1[1] * s - (q0[1] + d2[1] * t);
  const pz = p0[2] + d1[2] * s - (q0[2] + d2[2] * t);
  return [Math.hypot(px, py, pz), s];
}

// Where along a segment (0-1) it first runs into t's trunk or one of its
// low branches, or Infinity: for each piece it comes near enough to touch,
// where it first touches it, found to within a millimetre or so.
function trunkHit(t, a, b) {
  let first = Infinity;
  for (const q of t.pieces) {
    const q0 = [q[0], q[1], q[2]];
    const q1 = [q[3], q[4], q[5]];
    const [dist, at] = closest(a, b, q0, q1);
    if (dist > q[6]) continue;
    const gap = (f) => toPiece(q, a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f).gap;
    // Already against it at the start: leave it be (it's coming off it).
    if (gap(0) <= 0) continue;
    let lo = 0;
    let hi = at;
    if (hi >= first) continue;
    for (let j = 0; j < 14; j++) {
      const mid = (lo + hi) / 2;
      if (gap(mid) <= 0) hi = mid;
      else lo = mid;
    }
    first = Math.min(first, hi);
  }
  return first;
}

// The nearest point on the middle of tree t's trunk (or a branch) to a
// point, and the radius there (with the ball's).
function nearestPiece(t, p) {
  let best = null;
  for (const q of t.pieces) {
    const r = toPiece(q, p[0], p[1], p[2]);
    if (!best || r.gap < best.gap) best = { ...r, r: q[6] };
  }
  return best;
}

// ---- Meeting them -------------------------------------------------------------------

// How the leaves and branches take a ball, per metre it goes through at
// depth d (0 at the edge to 1 at the heart of the crown), each by how thick
// the leaves are there (thicknessAt):
//   leaves  speed lost to them: it keeps exp(-leaves * d) per metre, is
//           knocked down `down` radians per metre and aside, at random,
//           `scatter` radians for each square-root metre
//   twig    a rate of twig * d per metre: a knock aside of `kick` (a range,
//           m/s) - a fast ball barely turned, a slow one more - losing
//           `twigSlow` of the kick from its speed
//   branch  a rate of branch * d^2 per metre: off it as off wood, keeping
//           `rub` (a range) of its speed along the wood and `bounce` (a
//           range) of its speed into it, back out; the branch growing out
//           from the trunk at its kind's angle (BRANCH_RISE)
//   tangle  a rate of tangle * d^3 per metre (the thick of it), more for a
//           ball slower than `slowBall` m/s (up to twice), less for a
//           faster one (down to half): stopped dead, it keeps `caught` (a
//           range) of its speed, any way but mostly on, and drops out
//   gaps    how much the line through a tree varies, gap to clump: every
//           rate above times a draw for each tree it meets, 1 on average
//           (log-normal, this its spread)
// Each takes a share of its spin: leafSpin per metre in, branchSpin at a
// branch, caughtSpin when stopped. Off a trunk: `restitution` of its speed
// into the trunk comes back, it keeps `glance` of its speed along it, and
// goes off up to `spread` radians either way of a clean rebound.
export const TREE_PHYSICS = Object.freeze({
  leaves: 0.05,
  down: 0.02,
  scatter: 0.04,
  twig: 0.4,
  kick: [1.5, 5],
  twigSlow: 0.3,
  branch: 0.32,
  rub: [0.7, 0.9],
  bounce: [0.25, 0.55],
  tangle: 0.08,
  slowBall: 20,
  gaps: 0.6,
  caught: [0.05, 0.25],
  restitution: 0.35,
  glance: 0.55,
  spread: 0.45,
  trunkSpin: 0.2,
  branchSpin: 0.4,
  caughtSpin: 0.1,
  leafSpin: 0.1,
});
// How far a branch rises from level as it grows out from the trunk
// (radians, a range) by kind: a conifer's whorls nearly level, a weeping
// willow's strands hanging, a poplar's and a column's reaching up, the
// rest of the broadleaves climbing out.
const BRANCH_RISE = KINDS.map((k) =>
  TIERED.has(KIND[k]) ? (k === "column" ? [0.7, 1.2] : [-0.3, 0.2]) : k === "willow" ? [-1.45, -0.7] : k === "poplar" ? [0.8, 1.3] : [0.15, 0.9],
);
// How finely a segment of the flight is looked along inside a crown (m).
const SAMPLE = 0.25;

// ---- Looking along a line ------------------------------------------------------------

// What the trees would do to a ball flying along `points` (hole frame,
// absolute heights) - before it's hit, without flying it: the path isn't
// turned by what it meets, so this is what it runs into on its way in.
// { stopped, trunk, touched, first }: the chance a branch or a tangle in a
// crown takes it (the same rates treeStep uses, on an average line through
// each tree), the distance along the ground from the first point to the
// first trunk in its way (or null), whether it goes through any leaves at
// all, and the distance to the first tree it meets.
// `enough`: a chance past which there's no need to look further - it stops
// there, with at least that chance (and the trunk unknown). `step`: how
// finely it looks along the leaves (metres), as finely as a flight does
// unless asked.
export function treesOnLine(index, points, { physics = TREE_PHYSICS, enough = 1, step = SAMPLE } = {}) {
  const most = enough < 1 ? -Math.log(1 - enough) : Infinity;
  let hazard = 0;
  let touched = false;
  let first = null;
  let along = 0;
  for (let p = 1; p < points.length; p++) {
    const a = points[p - 1];
    const b = points[p];
    const run = Math.hypot(b[0] - a[0], b[2] - a[2]);
    const near = nearby(index, a, b);
    if (near.length) {
      const lo = Math.min(a[1], b[1]);
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const dz = b[2] - a[2];
      const len2 = dx * dx + dz * dz;
      const len = Math.hypot(dx, dy, dz);
      const n = Math.max(1, Math.ceil(len / step));
      const ds = len / n;
      const trees = [];
      let trunk = null;
      for (const i of near) {
        const tr = index.list[i];
        if (lo > tr.top) continue;
        const f = len2 > 0 ? Math.max(0, Math.min(1, ((tr.x - a[0]) * dx + (tr.z - a[2]) * dz) / len2)) : 0;
        if (Math.hypot(a[0] + dx * f - tr.x, a[2] + dz * f - tr.z) > tr.reach + 0.05) continue;
        trees.push(i);
        const hit = trunkHit(tr, a, b);
        if (hit < (trunk ?? Infinity)) trunk = hit;
      }
      // Leaves up to the first trunk in the way (or the whole stretch).
      const upTo = trunk ?? 1;
      for (let k = 0; k < n && (k + 0.5) / n < upTo; k++) {
        const fm = (k + 0.5) / n;
        const y = a[1] + dy * fm;
        const x = a[0] + dx * fm;
        const z = a[2] + dz * fm;
        for (const i of trees) {
          const tr = index.list[i];
          if (y > tr.top || y < tr.base) continue;
          // Quickly past a tree it isn't under.
          const ox = x - tr.x;
          const oz = z - tr.z;
          if (ox * ox + oz * oz > tr.reach * tr.reach) continue;
          const d = depthIn(tr, x, y, z);
          if (d <= 0) continue;
          if (!touched) first = along + run * fm;
          touched = true;
          hazard += (physics.branch + physics.tangle * d) * thicknessAt(tr, y, d) * d * d * ds;
        }
      }
      if (hazard >= most) return { stopped: 1 - Math.exp(-hazard), trunk: null, touched: true, first };
      if (trunk != null) {
        const at = along + run * trunk;
        return { stopped: 1 - Math.exp(-hazard), trunk: at, touched: true, first: first ?? at };
      }
    }
    along += run;
  }
  return { stopped: 1 - Math.exp(-hazard), trunk: null, touched, first };
}

// Everything that carries from one step of a flight to the next: the
// seeded draw, each tree's line (`gap`, its rates' factor) and how far it
// is from its next twig, branch and tangle (drawn as it goes in), and what
// each tree touched did - { tree, kind: "clip" | "branch" | "caught" |
// "trunk", t, at: [x, y, z], speedIn, speedOut, depth }.
export function treeState(seed = 1) {
  return { rand: seededRand(seed), met: new Map(), hits: [] };
}

const gauss = (rand) => (rand() + rand() + rand() + rand() - 2) * 1.732;
// How far (in the rate's own units) to the next of something met at random.
const nextAt = (rand) => -Math.log(1 - rand() * 0.999999);
const between = (rand, [lo, hi]) => lo + rand() * (hi - lo);

function turn(v, yawBy, pitchBy) {
  const h = Math.hypot(v[0], v[2]);
  const speed = Math.hypot(h, v[1]);
  if (speed < 1e-9) return v;
  const heading = Math.atan2(v[2], v[0]) + yawBy;
  const pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, Math.atan2(v[1], h) + pitchBy));
  const nh = speed * Math.cos(pitch);
  return [nh * Math.cos(heading), speed * Math.sin(pitch), nh * Math.sin(heading)];
}

const RANK = { clip: 0, branch: 1, caught: 2, trunk: 3 };
function record(state, i, kind, t, at, speedIn, speedOut, P) {
  let r = state.met.get(i);
  if (!r) {
    const rand = state.rand;
    const spread = P?.gaps ?? 0;
    r = { tree: i, kind, t, at, speedIn, speedOut, depth: 0, gap: Math.exp(gauss(rand) * spread - (spread * spread) / 2), twig: nextAt(rand), branch: nextAt(rand), tangle: nextAt(rand), caughtOnce: false };
    state.met.set(i, r);
    state.hits.push(r);
  }
  if (RANK[kind] > RANK[r.kind]) {
    r.kind = kind;
    r.t = t;
    r.at = at;
  }
  r.speedOut = speedOut;
  return r;
}

// One step of a flight, from a to b (hole frame, absolute heights) over
// dt seconds ending at time t, arriving at velocity v. Null if it met
// nothing; otherwise { position, velocity, spin } for the ball to go on
// from (spin a factor on what it had), and the state's hits are brought up
// to date. `physics` changes the numbers (TREE_PHYSICS) for trying out.
export function treeStep(index, state, a, b, v, t, dt, physics = TREE_PHYSICS) {
  const near = nearby(index, a, b);
  if (!near.length) return null;
  const P = physics;
  const lo = Math.min(a[1], b[1]);
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const dz = b[2] - a[2];
  const len2 = dx * dx + dz * dz;
  const trees = [];
  for (const i of near) {
    const tr = index.list[i];
    if (lo > tr.top) continue;
    // Nearest the segment comes to the trunk's line, across the ground.
    const f = len2 > 0 ? Math.max(0, Math.min(1, ((tr.x - a[0]) * dx + (tr.z - a[2]) * dz) / len2)) : 0;
    if (Math.hypot(a[0] + dx * f - tr.x, a[2] + dz * f - tr.z) > tr.reach + 0.05) continue;
    trees.push({ i, tr, trunk: trunkHit(tr, a, b) });
  }
  if (!trees.length) return null;
  const len = Math.hypot(dx, dy, dz);
  const n = Math.max(1, Math.ceil(len / SAMPLE));
  const ds = len / n;
  const speed = Math.hypot(v[0], v[1], v[2]);
  let keep = 1;
  let yawBy = 0;
  let pitchBy = 0;
  let spin = 1;
  let touched = false;
  // The trees it's in the leaves of this step: how fast it leaves them is
  // how fast it's going at the end of it.
  const seen = [];
  // The first trunk it runs into, if any.
  let hit = null;
  for (const q of trees) if (q.trunk < (hit?.trunk ?? Infinity)) hit = q;
  const now = () => turn(v.map((c) => c * keep), yawBy, pitchBy);
  for (let k = 0; k < n; k++) {
    const f0 = k / n;
    const f1 = (k + 1) / n;
    // The trunk in this stretch: that's what it meets.
    if (hit && hit.trunk < f1) return offTrunk(state, hit, a, b, now(), t - dt * (1 - hit.trunk), spin, P);
    const fm = (f0 + f1) / 2;
    const m = [a[0] + dx * fm, a[1] + dy * fm, a[2] + dz * fm];
    for (const q of trees) {
      if (m[1] > q.tr.top) continue;
      const d = depthIn(q.tr, m[0], m[1], m[2]);
      if (d <= 0) continue;
      touched = true;
      const at = t - dt * (1 - fm);
      const r = record(state, q.i, "clip", at, m, speed * keep, speed * keep, P);
      if (!seen.includes(r)) seen.push(r);
      r.depth = Math.max(r.depth, d);
      // Through thicker leaves, as if through more of them; through this
      // tree's gap or clump, as if through less or more.
      const dd = d * ds * thicknessAt(q.tr, m[1], d) * r.gap;
      keep *= Math.exp(-P.leaves * dd);
      spin *= Math.exp(-P.leafSpin * dd);
      yawBy += gauss(state.rand) * P.scatter * Math.sqrt(dd);
      pitchBy += -P.down * dd + gauss(state.rand) * P.scatter * 0.5 * Math.sqrt(dd);
      r.speedOut = speed * keep;
      // Something harder in the way: a tangle (once a tree: after that
      // it's falling through), a branch, a twig.
      const going = speed * keep;
      r.tangle -= P.tangle * Math.min(2, Math.max(0.5, P.slowBall / Math.max(1, going))) * d * dd;
      if (r.tangle <= 0 && !r.caughtOnce) {
        r.caughtOnce = true;
        return caughtBy(state, q.i, m, now(), at, spin, P);
      }
      r.branch -= P.branch * d * dd;
      if (r.branch <= 0) {
        r.branch = nextAt(state.rand);
        const off = offBranch(state, q, m, now(), at, spin, P);
        if (off) return off;
      }
      r.twig -= P.twig * dd;
      if (r.twig <= 0) {
        r.twig = nextAt(state.rand);
        // A knock square to its way, any way round it; it carries on from
        // here, still in the leaves.
        const kick = between(state.rand, P.kick);
        const angle = Math.min(0.8, kick / Math.max(1, going));
        const round = state.rand() * 2 * Math.PI;
        yawBy += angle * Math.cos(round);
        pitchBy += angle * Math.sin(round);
        keep *= Math.max(0.3, 1 - (P.twigSlow * kick) / Math.max(1, going));
        r.speedOut = speed * keep;
      }
    }
  }
  if (!touched) return null;
  for (const r of seen) r.speedOut = speed * keep;
  return { position: b, velocity: now(), spin };
}

// Off a trunk: back off it with most of its speed gone, scattered.
function offTrunk(state, { i, tr, trunk: f }, a, b, v, t, spin, P) {
  const at = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  // Off the bark where it hit: out from the middle of the trunk (or branch)
  // there, across the ground.
  const near = nearestPiece(tr, at);
  let nx = at[0] - near.at[0];
  let nz = at[2] - near.at[2];
  const nl = Math.hypot(nx, nz) || 1;
  nx /= nl;
  nz /= nl;
  const into = v[0] * nx + v[2] * nz; // negative: going into the trunk
  const tx = v[0] - into * nx;
  const tz = v[2] - into * nz;
  const out = [tx * P.glance - into * nx * P.restitution, v[1] * P.glance, tz * P.glance - into * nz * P.restitution];
  const speed = Math.hypot(...out);
  const r = state.rand;
  const velocity = turn(out, (r() * 2 - 1) * P.spread, (r() * 2 - 1) * P.spread * 0.5);
  // Just clear of the bark.
  const position = [near.at[0] + nx * (near.r + 0.02), at[1], near.at[2] + nz * (near.r + 0.02)];
  record(state, i, "trunk", t, position, Math.hypot(...v), speed, P);
  return { position, velocity, spin: spin * P.trunkSpin };
}

// Off a branch in the crown: a round piece of wood growing out from the
// trunk where the ball is (rising at its kind's angle, BRANCH_RISE, give
// or take), met somewhere across it - square on, it comes back off it;
// near its edge, it glances on, turned. It keeps `rub` of its speed along
// the wood and `bounce` of its speed into it.
function offBranch(state, { i, tr }, at, v, t, spin, P) {
  const r = state.rand;
  const speed = Math.hypot(v[0], v[1], v[2]);
  // The way the branch goes: out from the trunk, turned a little either
  // way, rising (or hanging) by its kind.
  const ox = at[0] - tr.x;
  const oz = at[2] - tr.z;
  const ol = Math.hypot(ox, oz);
  const out = ol > 0.05 ? Math.atan2(oz, ox) : r() * 2 * Math.PI;
  const heading = out + (r() * 2 - 1) * 0.7;
  const rise = between(r, BRANCH_RISE[tr.kind] ?? BRANCH_RISE[KIND.leaf]);
  const axis = [Math.cos(rise) * Math.cos(heading), Math.sin(rise), Math.cos(rise) * Math.sin(heading)];
  // The ball's way across it, and where across it it strikes (-1 to 1 of
  // the way out from its middle): the face of the wood it meets.
  const along = v[0] * axis[0] + v[1] * axis[1] + v[2] * axis[2];
  const across = [v[0] - along * axis[0], v[1] - along * axis[1], v[2] - along * axis[2]];
  const al = Math.hypot(...across);
  if (al < 1e-6) return null;
  const u = across.map((c) => -c / al);
  const w = [axis[1] * u[2] - axis[2] * u[1], axis[2] * u[0] - axis[0] * u[2], axis[0] * u[1] - axis[1] * u[0]];
  const where = r() * 2 - 1;
  const square = Math.sqrt(1 - where * where);
  const nrm = [0, 1, 2].map((k) => u[k] * square + w[k] * where);
  const into = v[0] * nrm[0] + v[1] * nrm[1] + v[2] * nrm[2]; // negative: into the wood
  const rub = between(r, P.rub);
  const bounce = between(r, P.bounce);
  const velocity = [0, 1, 2].map((k) => (v[k] - into * nrm[k]) * rub - into * nrm[k] * bounce);
  record(state, i, "branch", t, at, speed, Math.hypot(...velocity), P);
  return { position: at, velocity, spin: spin * P.branchSpin };
}

// Stopped in the crown: it drops out of it with little of its speed - any
// way at all, but more often on than back, and down more often than up.
function caughtBy(state, i, at, v, t, spin, P) {
  const r = state.rand;
  const speed = Math.hypot(v[0], v[1], v[2]);
  const kept = speed * between(r, P.caught);
  const heading = Math.atan2(v[2], v[0]) + (r() - 0.5) * (r() < 0.7 ? 1.6 : 2 * Math.PI);
  const pitch = 0.35 - r() * 1.55;
  const velocity = [kept * Math.cos(pitch) * Math.cos(heading), kept * Math.sin(pitch), kept * Math.cos(pitch) * Math.sin(heading)];
  record(state, i, "caught", t, at, speed, kept, P);
  return { position: at, velocity, spin: spin * P.caughtSpin };
}

// ---- What to say about it -----------------------------------------------------------

// The worst any tree did to a shot (a result's `trees`): "trunk", "caught",
// "branch", "clip", or null.
export function worstTree(hits) {
  let worst = null;
  for (const h of hits ?? []) if (worst == null || RANK[h.kind] > RANK[worst]) worst = h.kind;
  return worst;
}

// For the result line: "Hit a tree" (off a trunk), "Knocked down by a
// tree" (stopped in a crown), "Off a branch", "Through the leaves" (deep
// into a crown and out the other side), "Clipped a tree" (the edge of its
// leaves), or "".
export const THROUGH = 0.35;
export function treeNote(res) {
  const w = worstTree(res?.trees);
  if (w === "clip") return res.trees.some((h) => (h.depth ?? 0) >= THROUGH) ? "Through the leaves" : "Clipped a tree";
  return w === "trunk" ? "Hit a tree" : w === "caught" ? "Knocked down by a tree" : w === "branch" ? "Off a branch" : "";
}

// Trees standing in each other (the owner, on a flyover: "trees glitching
// through each other a hell of a lot"): a hole's rows are jittered, and a
// tree could come up a metre from its neighbour, its trunk inside the
// other's crown - two crowns grown through one another, their faces
// crossing as the camera moves. Of two so close that one's trunk stands
// within APART of the other's reach (the wider of the two), the later one
// goes; a tree with a kind of its own (planted by hand, or real, from a
// map) is never taken out, and others make way for it. Each tree's form
// comes from where it stands (treeForm), so the rest are unchanged.
export const APART = 0.6;
export function apartTrees(trees = [], share = APART) {
  if (trees.length < 2) return trees;
  const { list } = treeIndex(trees);
  const fixed = (i) => trees[i][3] != null && trees[i][8] == null;
  const order = trees.map((_, i) => i).sort((a, b) => (fixed(b) ? 1 : 0) - (fixed(a) ? 1 : 0) || a - b);
  const CELLS = 12;
  const grid = new Map();
  const kept = new Uint8Array(trees.length);
  const far = (i, j) => Math.hypot(list[i].x - list[j].x, list[i].z - list[j].z) >= share * Math.max(list[i].reach, list[j].reach);
  for (const i of order) {
    const t = list[i];
    const gx = Math.floor(t.x / CELLS);
    const gz = Math.floor(t.z / CELLS);
    let ok = true;
    for (let a = gx - 1; ok && a <= gx + 1; a++) {
      for (let b = gz - 1; ok && b <= gz + 1; b++) for (const j of grid.get(`${a},${b}`) ?? []) if (!far(i, j)) ok = fixed(i) && fixed(j);
    }
    if (!ok) continue;
    kept[i] = 1;
    const k = `${gx},${gz}`;
    if (grid.has(k)) grid.get(k).push(i);
    else grid.set(k, [i]);
  }
  return trees.filter((_, i) => kept[i]);
}
