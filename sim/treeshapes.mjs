import { mulberry32 } from "./mathutil.mjs";
// The shapes trees are drawn in and played against: a few of each kind, no
// two alike - a pine's tiers uneven and drifting off the middle, a
// broadleaf's lumps of leaves bunched to one side, tall and narrow or broad
// and spreading - each with its own trunk, now and then bent partway, and
// some with a low branch or two (a broadleaf's ending in a lump of leaves).
//
// Made once from a fixed seed, so the drawing (look/trees.js) and a ball in
// the air (treehits.mjs) always have the very same shapes; which shape a
// tree takes, how it leans and how unevenly it spreads is its form's
// (treehits.mjs treeForm), from where it stands.
//
// Model units: metres for a tree of scale 1, the trunk's foot at the
// origin, y up. Pure, no browser.

// How many shapes of each kind: six of the first six kinds, four of the
// newer ones (NEWER_SHAPES) - and two more of every kind since
// (MORE_SHAPES: the owner, 20 October 2026, "more tree shapes per kind"),
// and two more again of the commonest, the pine and the broadleaf - every
// designed hole's trees, but for the stands (COMMON_SHAPES, COMMON_MORE:
// the owner's list, 2 November 2026) - and a third of those again
// (THIRD_SHAPES, THIRD_MORE), and clumps of two to four stems from one
// base, two of the birch and an alder's of the broadleaf (CLUMP_MORE: the
// owner's list, 5 November 2026).
export const TREE_SHAPES = 6;
export const NEWER_SHAPES = 4;
export const MORE_SHAPES = 2;
export const COMMON_SHAPES = 2;
export const THIRD_SHAPES = 1;
// And the kinds added after those (the owner, 10 November 2026: "go for it
// on trees, new kinds and signature"): three shapes each (LATEST_SHAPES) -
// a beech, a horse chestnut, a cedar of Lebanon, a holly and a hawthorn.
export const LATEST_SHAPES = 3;

function seededRand(seed) {
  return mulberry32(seed);
}

// ---- Pines -------------------------------------------------------------------------

// A pine's tiers [radius, height, y (middle), dx, dz]: each a little wider
// or narrower, a little off the middle (pines grow towards the light and
// lose branches on one side). The lowest is held up (PINE_LIFT) so the
// trunk shows under it.
export const PINE_LIFT = 0.5;
function pineTiers(rand) {
  const base = [
    [3.2, 4.2, 3.0],
    [2.5, 3.6, 5.2],
    [1.7, 3.0, 7.2],
    [0.9, 2.2, 8.9],
  ];
  const a = rand() * Math.PI * 2;
  const drift = 0.15 + rand() * 0.35;
  return base.map(([r, h, y], i) => {
    const off = drift * (i / 3) + (rand() - 0.5) * 0.25;
    return [r * (0.82 + rand() * 0.3), h * (0.9 + rand() * 0.2), y + (rand() - 0.5) * 0.4 + (i === 0 ? PINE_LIFT : 0), Math.cos(a) * off, Math.sin(a) * off];
  });
}

// The rings of needle cards round a pine's tiers, as look/trees.js draws
// them: [radius of the ring, height, how many, dx, dz] - one along each
// tier's drooping rim and two more up it. Each card reaches out past its
// ring to needleReach(ring radius).
// (A tier that carries a sixth number - a great cedar's: its plates are many
// tiers, side by side - has that many on its rim, by its own size, and
// fewer up it; a pine's are by its place up the tree.)
export function pineRings(tiers) {
  return [
    ...tiers.map(([r, h, y, dx, dz, n], i) => [r * 1.02, y - h * 0.32, n ?? [20, 16, 12, 7][i] ?? 6, dx, dz]),
    ...tiers.map(([r, h, y, dx, dz, n], i) => [r * 0.9, y - h * 0.05, n ? Math.round(n * 0.8) : ([16, 13, 9, 5][i] ?? 5), dx, dz]),
    ...tiers.map(([r, h, y, dx, dz, n], i) => [r * 0.7, y + h * 0.22, n ? Math.round(n * 0.6) : ([12, 10, 7, 4][i] ?? 4), dx, dz]),
  ];
}
// How far out from the tree's middle a ring's cards reach (they sit a
// little in from the ring and lie out past it): from the card's size,
// 1.5 + 0.45 of the ring's radius, as look/trees.js makes them.
export const needleReach = (ringR) => ringR * 0.62 + 0.4 * (1.5 + ringR * 0.45);

// A pine's needles as the ball meets them: how far they reach (and where
// their middle is) at each height, up through its rings of cards - from a
// little under the lowest, to nothing at its tip. [[y, reach, dx, dz]...]
// in order of height.
export function needleProfile(tiers) {
  const rings = pineRings(tiers)
    .map(([r, y, , dx, dz]) => [y, needleReach(r), dx, dz])
    .sort((a, b) => a[0] - b[0]);
  const low = rings[0];
  const tip = tiers.reduce((best, t) => (t[2] + t[1] * 0.5 > best[2] + best[1] * 0.5 ? t : best));
  return [[low[0] - 0.6, low[1] * 0.75, low[2], low[3]], ...rings, [tip[2] + tip[1] * 0.5, 0, tip[3], tip[4]]];
}
// The needles' reach, and their middle, at height y (model units): 0 if
// none there.
export function needlesAt(profile, y) {
  if (y < profile[0][0] || y > profile[profile.length - 1][0]) return null;
  for (let i = 1; i < profile.length; i++) {
    if (y <= profile[i][0]) {
      const a = profile[i - 1];
      const b = profile[i];
      const f = b[0] > a[0] ? (y - a[0]) / (b[0] - a[0]) : 0;
      return [a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, a[3] + (b[3] - a[3]) * f];
    }
  }
  return null;
}

// How far a tier's branches reach out at height y (model units), and its
// middle there: from its drooping rim up to its point - the shape
// look/trees.js turns it on, with its needle cards reaching a little past
// it (NEEDLE_REACH). 0 outside it.
export const NEEDLE_REACH = 1.1;
export function tierReach([r, h, y0], y) {
  const lo = y0 - h * 0.5;
  const hi = y0 + h * 0.5;
  if (y < lo || y > hi) return 0;
  // Profile: full at the rim, a little in at the bottom (the underside
  // rising to the trunk), to nothing at the point.
  const t = (y - lo) / (hi - lo);
  const out = t < 0.08 ? 0.75 + (t / 0.08) * 0.25 : 1 - (t - 0.08) / 0.92;
  return r * out * NEEDLE_REACH;
}

// ---- Broadleaves ---------------------------------------------------------------------

// A broadleaf's lumps of leaves [x, y, z, r]: one main mass and three to
// six more, bunched more to one side than the other, some higher, some
// lower, within 3.2 m of the trunk; its habit tall and narrow or broad and
// spreading.
function broadleafSpheres(rand) {
  const a = rand() * Math.PI * 2;
  const bias = 0.3 + rand() * 0.5;
  const out = [[Math.cos(a) * bias * 0.4, 5.3 + rand() * 0.7, Math.sin(a) * bias * 0.4, 2.4 + rand() * 0.6]];
  const n = 3 + Math.floor(rand() * 4);
  for (let i = 0; i < n; i++) {
    const b = rand() * Math.PI * 2;
    const d = 1.1 + rand() * 1.0;
    let x = Math.cos(b) * d + Math.cos(a) * bias;
    let z = Math.sin(b) * d + Math.sin(a) * bias;
    const r = 1.4 + rand() * 0.8;
    const reach = Math.hypot(x, z) + r;
    if (reach > 3.2) {
      const k = (3.2 - r) / Math.hypot(x, z);
      x *= k;
      z *= k;
    }
    out.push([x, 4.3 + rand() * 2.9, z, r]);
  }
  const tall = 0.8 + rand() * 0.5;
  return out.map(([x, y, z, r]) => {
    const k = Math.min(1, 1.15 / tall);
    return [x * k, 4.6 + (y - 4.6) * tall, z * k, r * (tall > 1.1 ? 0.92 : 1)];
  });
}

// ---- Trunks ---------------------------------------------------------------------------

// A trunk's plan: tapering from r0 to r1 over `height`, now and then bent
// partway (off: how far its top sits from its foot, towards a; kink: a
// wobble partway), and some with a low branch or two - each { t0 (how far
// up the trunk it leaves), b (which way), len, up (how steeply it rises),
// rb (its thickness where it leaves) }. A clump's other stems (CLUMP_MORE)
// are branches too, marked `stem`: leaving right at its foot and rising
// nearly as high as it, drawn as trunks (look/trees.js) and met by a ball
// as wood, as any branch is.
export const LOW_TAPER = 0.76;
function trunkPlan(rand, { height, r0, r1, bendy, branchy, reach }) {
  const bent = rand() < bendy;
  const plan = { height, r0, r1, a: rand() * Math.PI * 2, off: bent ? 0.15 + rand() * 0.45 : 0, kink: bent ? (rand() - 0.5) * 0.35 : 0, branches: [] };
  if (rand() < branchy) {
    const n = rand() < 0.35 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const t0 = 0.35 + rand() * 0.35;
      // (Thin at its tip, as a limb grows: LOW_TAPER of its thickness gone by there.)
      plan.branches.push({ t0, b: rand() * Math.PI * 2, len: reach * (0.7 + rand() * 0.5), up: 0.35 + rand() * 0.45, rb: (r0 + (r1 - r0) * t0) * 0.42, taper: LOW_TAPER });
    }
  }
  return plan;
}

// A point up the trunk's middle (t 0 foot, 1 top): [x, y, z].
export function trunkAt(plan, t) {
  const side = plan.off * Math.sin((t * Math.PI) / 2) + plan.kink * Math.sin(t * Math.PI);
  return [Math.cos(plan.a) * side, t * plan.height, Math.sin(plan.a) * side];
}
export const trunkRadius = (plan, t) => plan.r0 + (plan.r1 - plan.r0) * t;

// A trunk's root flare (drawn only: the ball meets the trunk as
// trunkRadius has it): how much wider than trunkRadius it is at t, round
// it at angle q (radians) - spreading into a few soft buttresses over the
// last stretch into the ground, as a real trunk's foot does, rather than
// going straight in. Up to FLARE.most wider at the foot (which is sunk
// FLARE.sunk into the ground), none from FLARE.reach trunk-widths up.
export const FLARE = { most: 0.65, reach: 5, least: 0.35, longest: 1.2, roots: 5, lobe: 0.35, sunk: 0.2 };
export function flareHeight(plan) {
  return Math.min(FLARE.longest, Math.max(FLARE.least, plan.r0 * FLARE.reach)) + FLARE.sunk;
}
export function trunkFlare(plan, t, q = 0) {
  const k = Math.max(0, 1 - (t * plan.height) / flareHeight(plan));
  if (!(k > 0)) return 1;
  const phase = plan.a * 3;
  return 1 + FLARE.most * Math.pow(k, 2.2) * (1 + FLARE.lobe * Math.cos(FLARE.roots * q + phase));
}

// A point along a low branch (t 0 where it leaves the trunk, 1 its tip),
// drooping a little on its way out (BRANCH.sag of its length, at its
// middle - or its own `sag`: less than none arches it up and out, rising
// steeply from the trunk and levelling towards its tip, as a big limb
// grows); its tip; its thickness, tapering to its tip (BRANCH.taper of it
// gone by there - or its own `taper`).
export const BRANCH = { sag: 0.18, taper: 0.6 };
export function branchTip(plan, br) {
  const from = trunkAt(plan, br.t0);
  return [from[0] + Math.cos(br.b) * br.len, from[1] + br.up * br.len, from[2] + Math.sin(br.b) * br.len];
}
export function branchAt(plan, br, t) {
  const from = trunkAt(plan, br.t0);
  const tip = branchTip(plan, br);
  return [from[0] + (tip[0] - from[0]) * t, from[1] + (tip[1] - from[1]) * t - Math.sin(t * Math.PI) * (br.sag ?? BRANCH.sag) * br.len, from[2] + (tip[2] - from[2]) * t];
}
export const branchRadius = (br, t) => br.rb * (1 - (br.taper ?? BRANCH.taper) * t);

// A tree's stems: its trunk, and a clump's others (branches marked stem) -
// each { at(t), radius(t), branch (null for the trunk) }, t 0 at its foot
// to 1 at its top.
export function stemsOf(plan) {
  const out = [{ at: (t) => trunkAt(plan, t), radius: (t) => trunkRadius(plan, t), branch: null }];
  for (const br of plan.branches ?? []) if (br.stem) out.push({ at: (t) => branchAt(plan, br, t), radius: (t) => branchRadius(br, t), branch: br });
  return out;
}

// ---- All of them -------------------------------------------------------------------------

// { pine: [{ tiers, trunk }], leaf, birch, willow, poplar, bush: [{
// spheres, trunk }] }: TREE_SHAPES of each, the same every time; the first
// pine and broadleaf the classic ones.
let shapes = null;
export function treeShapes() {
  if (shapes) return shapes;
  const rand = seededRand(0x7e5ee5);
  // The first of each kind the classic tree: tiers or lumps as they always
  // were, a straight trunk, no low branches - a tree to measure the rest by
  // (and the tests' own).
  const straight = (height, r0, r1) => ({ height, r0, r1, a: 0, off: 0, kink: 0, branches: [] });
  const classicPine = {
    trunk: straight(3.2, 0.38, 0.22),
    tiers: [
      [3.2, 4.2, 3.0, 0, 0],
      [2.5, 3.6, 5.2, 0, 0],
      [1.7, 3.0, 7.2, 0, 0],
      [0.9, 2.2, 8.9, 0, 0],
    ],
  };
  const classicLeaf = {
    trunk: straight(4.2, 0.45, 0.28),
    spheres: [
      [0, 5.6, 0, 2.8],
      [1.6, 5.0, 0.6, 2.0],
      [-1.4, 5.2, -0.5, 2.1],
      [0.3, 6.9, -0.3, 2.0],
      [-0.4, 4.8, 1.5, 1.8],
    ],
  };
  const pine = Array.from({ length: TREE_SHAPES }, (_, i) => (i === 0 ? classicPine : {
    trunk: trunkPlan(rand, { height: 3.4, r0: 0.38, r1: 0.22, bendy: 0.4, branchy: 0.35, reach: 1.4 }),
    tiers: pineTiers(rand),
  }));
  const leaf = Array.from({ length: TREE_SHAPES }, (_, i) => {
    if (i === 0) return classicLeaf;
    const trunk = trunkPlan(rand, { height: 4.4, r0: 0.45, r1: 0.28, bendy: 0.7, branchy: 0.5, reach: 2 });
    // A lump of leaves at each low branch's end, kept within the crown's
    // reach.
    const lumps = trunk.branches.map((br) => {
      const [x, y, z] = branchTip(trunk, br);
      const r = 0.8 + rand() * 0.5;
      const k = Math.min(1, (3.2 - r) / (Math.hypot(x, z) || 1));
      return [x * k, y + 0.3, z * k, r];
    });
    return { trunk, spheres: [...broadleafSpheres(rand), ...lumps] };
  });
  // The newer kinds, each from a seed of its own (so the pines' and
  // broadleaves' shapes stay as they were).
  const birch = Array.from({ length: TREE_SHAPES }, (_, i) => birchShape(seededRand(0xb1c4 + i * 977)));
  const willow = Array.from({ length: TREE_SHAPES }, (_, i) => willowShape(seededRand(0x3111 + i * 977)));
  const poplar = Array.from({ length: TREE_SHAPES }, (_, i) => poplarShape(seededRand(0x9091 + i * 977)));
  // Half the bushes rounded evergreens, half flowering shrubs.
  const bush = Array.from({ length: TREE_SHAPES }, (_, i) => (i < FLOWERING_FROM ? bushShape : shrubShape)(seededRand(0xb054 + i * 977)));
  // The five kinds added after those, four shapes each, each from seeds of
  // their own (so nothing above changes).
  const newer = (make, seed) => Array.from({ length: NEWER_SHAPES }, (_, i) => make(seededRand(seed + i * 977)));
  const scots = newer(scotsShape, 0x5c075);
  const oak = newer(oakShape, 0x0a4);
  const column = newer(columnShape, 0xc01);
  const spruce = newer(spruceShape, 0x5b2);
  const snag = newer(snagShape, 0x54a9);
  // The latest kinds, three shapes each (LATEST_SHAPES: one maker each,
  // three habits), each from seeds of their own.
  const latest = (makes, seed) => makes.map((make, i) => make(seededRand(seed + i * 977)));
  const beech = latest([(r) => beechShape(r), (r) => beechShape(r, { wood: true }), (r) => beechShape(r, { open: true })], 0xbee0c);
  const chestnut = latest([(r) => chestnutShape(r), (r) => chestnutShape(r, { tall: true }), (r) => chestnutShape(r, { broad: true })], 0xc4e57);
  const cedar = latest([(r) => cedarShape(r), (r) => cedarShape(r, { spread: true }), (r) => cedarShape(r, { young: true })], 0xced42);
  const holly = latest([(r) => hollyShape(r), (r) => hollyShape(r, { broad: true }), (r) => hollyShape(r, { tall: true })], 0x4011e);
  const hawthorn = latest([(r) => hawthornShape(r), (r) => hawthornShape(r, { swept: true }), (r) => hawthornShape(r, { stems: true })], 0x4a3d0);
  const all = { pine, leaf, birch, willow, poplar, bush, scots, oak, column, spruce, snag, beech, chestnut, cedar, holly, hawthorn };
  // And the two more of each (MORE), after all of those, from seeds of
  // their own.
  KINDS.forEach((kind, k) => (MORE[kind] ?? []).forEach((make, i) => all[kind].push(make(seededRand(0x40e5 + k * 977 + i * 131)))));
  // And the commonest kinds' two more again (COMMON_MORE), after those.
  KINDS.forEach((kind, k) => (COMMON_MORE[kind] ?? []).forEach((make, i) => all[kind].push(make(seededRand(0xc0e5 + k * 977 + i * 131)))));
  // And after those the commonest kinds' third (THIRD_MORE), then the
  // clumps (CLUMP_MORE) - each from a seed of its own.
  KINDS.forEach((kind, k) => (THIRD_MORE[kind] ?? []).forEach((make, i) => all[kind].push(make(seededRand(0x7d1e5 + k * 977 + i * 131)))));
  KINDS.forEach((kind, k) => (CLUMP_MORE[kind] ?? []).forEach((make, i) => all[kind].push(make(seededRand(0xc1a5e + k * 977 + i * 131)))));
  // And last the veterans (VETERAN_MORE): a feature tree's, never by chance.
  // (Each handed the first's own randomness too: a form of it is the same tree.)
  KINDS.forEach((kind, k) => (VETERAN_MORE[kind] ?? []).forEach((make, i) => all[kind].push(make(seededRand(0x7e7e1 + k * 977 + i * 131), () => seededRand(0x7e7e1 + k * 977)))));
  // And after them a kind's tall shapes (TALL_MORE): a tree far over its
  // kind's size takes one by its size, never by chance.
  KINDS.forEach((kind, k) => (TALL_MORE[kind] ?? []).forEach((make, i) => all[kind].push(make(seededRand(0x7a11 + k * 977 + i * 131)))));
  shapes = Object.freeze(all);
  return shapes;
}

// The kinds, in the order a tree's form numbers them (treehits.mjs
// treeForm, and a layout's kind): 0 pine, 1 broadleaf (these two as they
// always were), 2 silver birch, 3 weeping willow, 4 Lombardy poplar, 5 a
// bush; and added after them (never renumbered), 6 Scots pine, 7 spreading
// oak, 8 dark column conifer (a yew or cypress), 9 spruce, 10 dead snag;
// and after those (never renumbered either), 11 beech, 12 horse chestnut,
// 13 cedar of Lebanon, 14 holly, 15 hawthorn.
// The conifers - pine, Scots pine, column conifer, spruce, cedar - are
// tiers of needles (TIERED); the snag is its trunk and bare branches
// alone; the rest are lumps of leaves (spheres).
export const KINDS = ["pine", "leaf", "birch", "willow", "poplar", "bush", "scots", "oak", "column", "spruce", "snag", "beech", "chestnut", "cedar", "holly", "hawthorn"];
export const KIND = Object.fromEntries(KINDS.map((k, i) => [k, i]));
// What each kind is called (the hole builder's tree key and kind lists).
export const KIND_NAMES = {
  pine: "Pine",
  leaf: "Broadleaf",
  birch: "Silver birch",
  willow: "Weeping willow",
  poplar: "Lombardy poplar",
  bush: "Flowering bush",
  scots: "Scots pine",
  oak: "Oak",
  column: "Column conifer",
  spruce: "Spruce",
  snag: "Dead tree",
  beech: "Beech",
  chestnut: "Horse chestnut",
  cedar: "Cedar of Lebanon",
  holly: "Holly",
  hawthorn: "Hawthorn",
};
export const shapesOfKind = (kind) => treeShapes()[KINDS[kind] ?? "leaf"];
// The newer kinds (from Scots pine on), and the latest (from the beech on).
export const NEWER_FROM = KIND.scots;
export const LATEST_FROM = KIND.beech;
// The kinds with tiers of needles.
export const TIERED = new Set([KIND.pine, KIND.scots, KIND.column, KIND.spruce, KIND.cedar]);
// How many shapes a kind had before MORE_SHAPES (a tree's form picks among
// those first: treehits.mjs treeForm), with them, with the commonest
// kinds' COMMON_SHAPES more again (COMMON_MORE: commonCount), with their
// third (THIRD_MORE, from thirdFrom), and has now, with its clumps
// (CLUMP_MORE, from clumpFrom).
// (The latest kinds have no MORE: their three are all of them.)
export const firstShapes = (kind) => (kind >= LATEST_FROM && kind < KINDS.length ? LATEST_SHAPES : kind >= NEWER_FROM && kind < KINDS.length ? NEWER_SHAPES : TREE_SHAPES);
export const moreShapes = (kind) => firstShapes(kind) + (MORE[KINDS[kind]]?.length ?? 0);
export const commonMore = (kind) => (COMMON_MORE[KINDS[kind]]?.length ?? 0);
export const commonCount = (kind) => moreShapes(kind) + commonMore(kind);
export const thirdMore = (kind) => THIRD_MORE[KINDS[kind]]?.length ?? 0;
export const thirdFrom = (kind) => commonCount(kind);
export const clumpMore = (kind) => CLUMP_MORE[KINDS[kind]]?.length ?? 0;
export const clumpFrom = (kind) => thirdFrom(kind) + thirdMore(kind);
export const veteranFrom = (kind) => clumpFrom(kind) + clumpMore(kind);
export const veteranMore = (kind) => VETERAN_MORE[KINDS[kind]]?.length ?? 0;
// (And after the veterans, a kind's tall shapes - TALL_MORE - from tallFrom.)
export const tallFrom = (kind) => veteranFrom(kind) + veteranMore(kind);
export const tallMore = (kind) => TALL_MORE[KINDS[kind]]?.length ?? 0;
export const shapeCount = (kind) => tallFrom(kind) + tallMore(kind);
// The shapes a tree may take by chance - all but its kind's veterans (and
// its tall shapes, after them, which a tree takes by its size), which
// only a feature tree is (a real course's big tree planted as one, a
// designed hole's signature tree: veteranChoices).
export const pickShapes = (kind) => veteranFrom(kind);
// Which of a kind's batches of shapes one is: 0 its first, 1 MORE_SHAPES,
// 2 COMMON_MORE, 3 THIRD_MORE, 4 CLUMP_MORE (look/trees.js draws each
// batch with randomness of its own, so a batch added changes none before).
export const shapeBatch = (kind, shape) => (shape < firstShapes(kind) ? 0 : shape < moreShapes(kind) ? 1 : shape < commonCount(kind) ? 2 : shape < clumpFrom(kind) ? 3 : 4);
// (The most any kind has: MOST_SHAPES, at the end.)

// Lumps round an upright line from (0, y0) up to (0, y1): n of them, each
// r0 - r1 across, no further than `spread` from the line (towards a side
// by `lean`, 0 - 1, of it).
function lumpsUp(rand, { n, y0, y1, r0, r1, spread, lean = 0, a = rand() * Math.PI * 2 }) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = n > 1 ? i / (n - 1) : 0.5;
    const y = y0 + (y1 - y0) * t + (rand() - 0.5) * 0.6;
    const b = rand() * Math.PI * 2;
    const d = spread * Math.sqrt(rand());
    out.push([Math.cos(b) * d + Math.cos(a) * lean * spread * t, y, Math.sin(b) * d + Math.sin(a) * lean * spread * t, r0 + rand() * (r1 - r0)]);
  }
  return out;
}

// A silver birch: tall and slender, a white trunk running well up into a
// light, open crown of small lumps - narrow, often leaning a little.
function birchShape(rand) {
  const tall = 0.9 + rand() * 0.25;
  const trunk = trunkPlan(rand, { height: 6.8 * tall, r0: 0.22, r1: 0.1, bendy: 0.55, branchy: 0.2, reach: 1.1 });
  const top = trunkAt(trunk, 1);
  const spheres = lumpsUp(rand, { n: 7 + Math.floor(rand() * 4), y0: 4.6 * tall, y1: 10.6 * tall, r0: 0.9, r1: 1.4, spread: 1.4, lean: 0.4 }).map(([x, y, z, r]) => [x + top[0], y, z + top[2], r]);
  return { trunk, spheres };
}

// A weeping willow: a short, thick trunk, often leaning, under a wide dome,
// its edge hanging down in curtains nearly to the ground.
function willowShape(rand) {
  const trunk = trunkPlan(rand, { height: 3.2, r0: 0.6, r1: 0.42, bendy: 0.8, branchy: 0.3, reach: 1.6 });
  const top = trunkAt(trunk, 1);
  const dome = lumpsUp(rand, { n: 5 + Math.floor(rand() * 3), y0: 4.6, y1: 6.6, r0: 1.8, r1: 2.5, spread: 2.2 }).map(([x, y, z, r]) => [x + top[0], y, z + top[2], r]);
  // The curtain: a ring of hanging lumps round the dome's edge, lower and
  // lower as they come round, and gaps where it parts.
  const curtain = [];
  const n = 11 + Math.floor(rand() * 4);
  const reach = 3.6 + rand() * 0.6;
  for (let i = 0; i < n; i++) {
    if (rand() < 0.15) continue;
    const a = (i / n) * Math.PI * 2 + (rand() - 0.5) * 0.3;
    const d = reach * (0.9 + rand() * 0.15);
    curtain.push([top[0] + Math.cos(a) * d, 2.4 + rand() * 1.4, top[2] + Math.sin(a) * d, 1.0 + rand() * 0.35]);
  }
  return { trunk, spheres: [...dome, ...curtain], curtain: curtain.length };
}

// A Lombardy poplar: a tall, narrow column of leaves, straight up, from low
// on its trunk nearly to its top.
function poplarShape(rand) {
  const tall = 0.9 + rand() * 0.25;
  const trunk = trunkPlan(rand, { height: 3.2, r0: 0.38, r1: 0.24, bendy: 0.15, branchy: 0, reach: 1 });
  const n = 8 + Math.floor(rand() * 3);
  const spheres = lumpsUp(rand, { n, y0: 3.8, y1: 15 * tall, r0: 1.2, r1: 1.6, spread: 0.45 }).map(([x, y, z, r], i) => {
    // Narrowing to its point.
    const t = i / (n - 1);
    return [x, y, z, r * (1 - 0.45 * t * t)];
  });
  return { trunk, spheres };
}

// A bush's shapes from this one on are flowering shrubs (shrubShape).
export const FLOWERING_FROM = 3;

// A flowering shrub (a rhododendron, a broom, a hydrangea): looser than a
// rounded bush and vase-shaped - narrow at its foot, spreading higher up -
// a little taller, with blossom over its upper lumps (look/trees.js).
function shrubShape(rand) {
  const trunk = trunkPlan(rand, { height: 0.6, r0: 0.07, r1: 0.05, bendy: 0, branchy: 0, reach: 0 });
  const n = 5 + Math.floor(rand() * 3);
  const spheres = lumpsUp(rand, { n, y0: 0.6, y1: 1.45, r0: 0.42, r1: 0.7, spread: 0.75 }).map(([x, y, z, r], i) => {
    // Spreading out as it rises.
    const out = 0.55 + (i / (n - 1)) * 0.75;
    return [x * out, Math.max(r * 0.8, y), z * out, r];
  });
  return { trunk, spheres, flowering: true };
}

// A bush: a few low, rounded lumps of leaves close to the ground, a stub of
// stem hidden under them.
function bushShape(rand) {
  const trunk = trunkPlan(rand, { height: 0.35, r0: 0.08, r1: 0.05, bendy: 0, branchy: 0, reach: 0 });
  const wide = 0.8 + rand() * 0.5;
  const spheres = lumpsUp(rand, { n: 3 + Math.floor(rand() * 4), y0: 0.55, y1: 1.1, r0: 0.6, r1: 1.0, spread: 0.9 * wide }).map(([x, y, z, r]) => [x, Math.max(r * 0.75, y), z, r]);
  return { trunk, spheres };
}

// ---- The newer kinds --------------------------------------------------------------------

// Tiers up a line, [r, h, y, dx, dz] each, as a pine's are: from `from`
// (the middle of the lowest) to `to`, their radius r(f) and height h(f)
// for f 0 (lowest) - 1 (top), drifting a little off the middle.
function tiersUp(rand, { n, from, to, r, h, drift = 0.2, jitter = 0.12 }) {
  const a = rand() * Math.PI * 2;
  const lean = drift * rand();
  return Array.from({ length: n }, (_, i) => {
    const f = n > 1 ? i / (n - 1) : 0;
    const off = lean * f + (rand() - 0.5) * jitter;
    return [r(f) * (0.9 + rand() * 0.2), h(f) * (0.9 + rand() * 0.2), from + (to - from) * f + (rand() - 0.5) * 0.3, Math.cos(a) * off, Math.sin(a) * off];
  });
}

// A Scots pine: a tall, bare trunk (orange up high: look/trees.js), the odd
// dead stub of a branch down it, and at its top a flat, uneven umbrella of
// two or three spreading tiers, often off to one side.
function scotsShape(rand) {
  const tall = 0.95 + rand() * 0.2;
  const trunk = trunkPlan(rand, { height: 9.4 * tall, r0: 0.36, r1: 0.15, bendy: 0.7, branchy: 0.6, reach: 1.3 });
  // Its stubs short and rising.
  for (const br of trunk.branches) {
    br.len *= 0.6;
    br.up += 0.3;
  }
  const top = trunkAt(trunk, 1);
  const n = 2 + Math.floor(rand() * 2);
  const a = rand() * Math.PI * 2;
  const side = 0.3 + rand() * 0.7;
  const tiers = Array.from({ length: n }, (_, i) => {
    const f = n > 1 ? i / (n - 1) : 0;
    const r = (3.1 - 1.3 * f) * (0.85 + rand() * 0.3);
    const b = a + (rand() - 0.5) * 1.2;
    const off = side * (1 - f * 0.5) * (0.5 + rand() * 0.6);
    return [r, 1.5 + rand() * 0.4, top[1] - 0.5 + i * 1.05 + (rand() - 0.5) * 0.25, top[0] + Math.cos(b) * off, top[2] + Math.sin(b) * off];
  });
  return { trunk, tiers };
}

// A spreading oak: a short, massive trunk, four to six heavy limbs reaching
// out low and far, a lump of leaves at the end of each and one between it
// and the next, and a broad dome over them - 5 - 7 m out from the trunk.
// (As the veteran taught, veteranOak below: its limbs oakLimb's - under half
// its trunk's thickness, arching, thin at their ends, where they were over
// half of it, sagging, and blunt - and its crown closed between its limbs,
// where each had a second lump along it and the gaps between them stood
// open. No more lumps than it had: on a hole of 65 oaks a storey of five
// more each cost a quarter of the frames, 26 November 2026.)
function oakLimb(rand, trunk, t0, limbs) {
  // (Together about what the trunk carries: fewer limbs, each thicker.)
  const thick = Math.min(0.5, (LIMB.thick[0] + rand() * (LIMB.thick[1] - LIMB.thick[0])) * Math.sqrt(6.5 / limbs));
  return { rb: trunkRadius(trunk, t0) * thick, sag: -(0.03 + rand() * 0.07), taper: LIMB.taper };
}
function oakShape(rand) {
  const trunk = { height: 2.7 + rand() * 0.6, r0: 0.72, r1: 0.5, a: rand() * Math.PI * 2, off: rand() < 0.4 ? 0.1 + rand() * 0.2 : 0, kink: (rand() - 0.5) * 0.2, branches: [] };
  const limbs = 4 + Math.floor(rand() * 3);
  const a0 = rand() * Math.PI * 2;
  for (let i = 0; i < limbs; i++) {
    const t0 = 0.62 + rand() * 0.38;
    trunk.branches.push({ t0, b: a0 + (i / limbs) * Math.PI * 2 + (rand() - 0.5) * 0.7, len: 3.1 + rand() * 1.5, up: 0.22 + rand() * 0.3, ...oakLimb(rand, trunk, t0, limbs) });
  }
  const spheres = [];
  const keep = (x, y, z, r) => {
    // Within 7 m of the trunk, leaves and all.
    const d = Math.hypot(x, z);
    const k = d + r * 1.2 > 7 ? (7 - r * 1.2) / d : 1;
    spheres.push([x * k, y, z * k, r]);
  };
  const top = trunkAt(trunk, 1);
  trunk.branches.forEach((br, i) => {
    const [x, y, z] = branchTip(trunk, br);
    keep(x * 1.05, y + 1.1, z * 1.05, 1.7 + rand() * 0.6);
    // Between it and the next, part way out and a little higher.
    const q = a0 + ((i + 0.5) / limbs) * Math.PI * 2 + (rand() - 0.5) * 0.4;
    const d = 2.6 + rand() * 1.2;
    keep(top[0] + Math.cos(q) * d, 4.5 + rand() * 1.2, top[2] + Math.sin(q) * d, 1.5 + rand() * 0.5);
  });
  for (const [x, y, z, r] of lumpsUp(rand, { n: 4 + Math.floor(rand() * 2), y0: 5.6, y1: 7.4, r0: 2.1, r1: 2.7, spread: 2.2 })) keep(x + top[0], y, z + top[2], r);
  return { trunk, spheres };
}

// A dark column conifer (a yew or an Italian cypress): a short trunk hidden
// low under a dense, narrow column of needles, nearly straight-sided and
// rounded over the top.
function columnShape(rand) {
  const tall = 0.9 + rand() * 0.25;
  const wide = 0.9 + rand() * 0.25;
  const trunk = trunkPlan(rand, { height: 1.3, r0: 0.3, r1: 0.22, bendy: 0.1, branchy: 0, reach: 1 });
  const tiers = tiersUp(rand, {
    n: 7,
    from: 1.3,
    to: 8.2 * tall,
    r: (f) => 1.3 * wide * (f < 0.6 ? 1 : 1 - (f - 0.6) * 1.35),
    h: () => 2.3,
    drift: 0.15,
    jitter: 0.08,
  });
  return { trunk, tiers };
}

// A spruce: a narrow spire, its tiers of needles from low on the trunk to a
// sharp point, each a little narrower than the one below.
function spruceShape(rand) {
  const tall = 0.95 + rand() * 0.2;
  const trunk = trunkPlan(rand, { height: 3, r0: 0.34, r1: 0.2, bendy: 0.2, branchy: 0, reach: 1 });
  const n = 6 + Math.floor(rand() * 2);
  const tiers = tiersUp(rand, { n, from: 1.9, to: 12.4 * tall, r: (f) => 2.35 * (1 - 0.8 * f), h: (f) => 2.7 * (1 - 0.35 * f), drift: 0.2 });
  return { trunk, tiers };
}

// A dead snag: a grey trunk, often bent, broken off short of where its top
// was, with a few bare branches reaching up and out - no leaves at all.
function snagShape(rand) {
  const height = 6.2 + rand() * 2.6;
  const bent = rand() < 0.6;
  const trunk = { height, r0: 0.36, r1: 0.12, a: rand() * Math.PI * 2, off: bent ? 0.2 + rand() * 0.4 : 0, kink: bent ? (rand() - 0.5) * 0.4 : 0, branches: [] };
  const n = 3 + Math.floor(rand() * 3);
  for (let i = 0; i < n; i++) {
    const t0 = 0.35 + rand() * 0.55;
    trunk.branches.push({ t0, b: rand() * Math.PI * 2, len: (2.6 - t0 * 1.6) * (0.6 + rand() * 0.5), up: 0.6 + rand() * 0.8, rb: trunkRadius(trunk, t0) * 0.45 });
  }
  return { trunk, spheres: [], snag: true };
}

// ---- The latest kinds -------------------------------------------------------------------

// The owner, 10 November 2026: "go for it on trees, new kinds and
// signature". Each within the owner's rule - branches plain, no large gaps,
// no leaves without a branch: its lumps overlapping, each on a low branch
// or reached by a limb from its trunk as every crown's are (look/trees.js),
// its tiers off its trunk. Kept within reach (KEEP) of their trunk, and
// within the height their kind's size has (sim/lidartrees.mjs TREE_KINDS).

// Within `most` metres of the trunk, leaves and all: a lump pulled in.
function keeper(out, most) {
  return (x, y, z, r) => {
    const d = Math.hypot(x, z);
    const k = d + r * 1.1 > most ? Math.max(0, most - r * 1.1) / (d || 1) : 1;
    out.push([x * k, y, z * k, r]);
  };
}

// A beech: a smooth grey trunk (look/trees.js), its crown a great, dense,
// even dome - rounder and smoother than an oak's - its lowest boughs
// reaching out and down so the crown comes low round it. wood: grown in a
// wood, taller and narrower, its crown higher on a longer trunk; open:
// grown alone in the open, broader still, its skirt nearly to the ground.
function beechShape(rand, { wood = false, open = false } = {}) {
  const tall = (wood ? 1.06 : 0.94) + rand() * 0.14;
  const trunk = trunkPlan(rand, { height: (wood ? 4.2 : 3.0) * tall, r0: 0.5, r1: 0.34, bendy: 0.3, branchy: wood ? 0.3 : 0.8, reach: 2.4 });
  const top = trunkAt(trunk, 1);
  const spheres = [];
  const keep = keeper(spheres, open ? 5.8 : wood ? 4.6 : 5.4);
  const spread = wood ? 2.0 : open ? 2.8 : 2.5;
  for (const [x, y, z, r] of lumpsUp(rand, { n: 8 + Math.floor(rand() * 3), y0: (wood ? 6.0 : 5.2) * tall, y1: 9.4 * tall, r0: 2.0, r1: 2.6, spread })) keep(x + top[0], y, z + top[2], r);
  // Its skirt: a ring of lower lumps reaching out and down, overlapping the
  // dome above them.
  const ring = (wood ? 4 : 6) + Math.floor(rand() * 2);
  const a0 = rand() * Math.PI * 2;
  for (let i = 0; i < ring; i++) {
    const a = a0 + (i / ring) * Math.PI * 2 + (rand() - 0.5) * 0.5;
    const d = (wood ? 2.4 : open ? 3.4 : 3.0) + rand() * 0.7;
    keep(top[0] + Math.cos(a) * d, (wood ? 5.0 : open ? 3.4 : 4.0) + rand() * 1.0, top[2] + Math.sin(a) * d, 1.6 + rand() * 0.4);
  }
  // A lump at each low branch's end.
  for (const br of trunk.branches) {
    const [x, y, z] = branchTip(trunk, br);
    keep(x, y + 0.5, z, 1.4 + rand() * 0.3);
  }
  return { trunk, spheres };
}

// A horse chestnut: a short, stout trunk under a tall, rounded crown, its
// lower limbs held out level and long - drooping a little on their way out
// - with a heavy lump at each end. tall: its crown more upright; broad:
// its limbs longer, the crown wider than tall.
function chestnutShape(rand, { tall: upright = false, broad = false } = {}) {
  const tall = (upright ? 1.06 : 0.95) + rand() * 0.14;
  const trunk = { height: 2.5 + rand() * 0.5, r0: 0.62, r1: 0.44, a: rand() * Math.PI * 2, off: rand() < 0.3 ? 0.1 + rand() * 0.2 : 0, kink: (rand() - 0.5) * 0.15, branches: [] };
  const limbs = (broad ? 5 : 4) + Math.floor(rand() * 2);
  const a0 = rand() * Math.PI * 2;
  for (let i = 0; i < limbs; i++) {
    const t0 = 0.78 + rand() * 0.22;
    trunk.branches.push({ t0, b: a0 + (i / limbs) * Math.PI * 2 + (rand() - 0.5) * 0.6, len: (broad ? 3.3 : upright ? 2.4 : 2.9) + rand() * 0.8, up: 0.04 + rand() * 0.16, rb: trunkRadius(trunk, t0) * 0.5 });
  }
  const spheres = [];
  const keep = keeper(spheres, broad ? 5.6 : upright ? 4.6 : 5.2);
  for (const br of trunk.branches) {
    const [x, y, z] = branchTip(trunk, br);
    keep(x * 1.04, y + 0.7, z * 1.04, 1.7 + rand() * 0.4);
    const [mx, my, mz] = branchAt(trunk, br, 0.5);
    keep(mx, my + 1.3, mz, 1.6 + rand() * 0.4);
  }
  const top = trunkAt(trunk, 1);
  for (const [x, y, z, r] of lumpsUp(rand, { n: 7 + Math.floor(rand() * 3), y0: 5.0 * tall, y1: (upright ? 8.4 : 8.8) * tall, r0: 2.1, r1: 2.7, spread: upright ? 1.8 : 2.3 })) keep(x + top[0], y, z + top[2], r);
  return { trunk, spheres };
}

// A cedar of Lebanon: a massive trunk, its crown in broad, flat layers of
// needles held out level one above another - each off to a side of its
// own - and flat across the top: the parkland's great specimen. spread: an
// old one, its trunk leaning and its layers reaching wider; young:
// smaller, still coming to a point, its layers closer.
function cedarShape(rand, { spread: old = false, young = false } = {}) {
  const tall = (young ? 0.8 : 0.92) + rand() * 0.16;
  const trunk = trunkPlan(rand, { height: (young ? 7.2 : 8.8) * tall, r0: young ? 0.5 : 0.74, r1: young ? 0.24 : 0.34, bendy: old ? 0.9 : 0.5, branchy: old ? 0.8 : 0.4, reach: 2.4 });
  const fork = old;
  const n = (young ? 5 : 4) + Math.floor(rand() * 2);
  const a0 = rand() * Math.PI * 2;
  const low = young ? 2.4 : 3.2;
  const high = trunk.height + (young ? 1.2 : 0.8);
  const tiers = Array.from({ length: n }, (_, i) => {
    const f = n > 1 ? i / (n - 1) : 0;
    // A young cedar narrows to its top; a grown one's layers are nearly as
    // broad all the way up - flat plates, its top flat - its crown wider
    // than it's tall.
    const r = (young ? 3.0 - 1.9 * f : 4.7 - 0.7 * f) * (fork ? 1.08 : 1) * (0.88 + rand() * 0.22);
    const side = a0 + i * 2.4 + (rand() - 0.5) * 0.6;
    const off = (young ? 0.5 : 1.6 - 0.5 * f) * (fork ? 1.2 : 1) * (0.6 + rand() * 0.6);
    return [r, (young ? 0.95 : 0.8) + rand() * 0.3, low + (high - low) * f + (rand() - 0.5) * 0.3, Math.cos(side) * off, Math.sin(side) * off];
  });
  return { trunk, tiers };
}

// A holly: a small evergreen tree, dense and dark, a cone of leaves from
// low on its trunk to a blunt point: a heart of lumps up its middle, each
// well into the next, and rings of them round it narrowing to the top -
// all within reach of its boughs (sim/offshoots.mjs KITS.small), so none
// of its crown is the bare heart alone. broad: older, wider and blunter;
// tall: drawn up in a wood, slimmer and taller.
function hollyShape(rand, { broad = false, tall: drawn = false } = {}) {
  const tall = (drawn ? 1.15 : broad ? 0.88 : 0.97) + rand() * 0.14;
  const trunk = trunkPlan(rand, { height: 1.2, r0: 0.2, r1: 0.14, bendy: 0.3, branchy: 0, reach: 0.8 });
  const top = trunkAt(trunk, 1);
  const width = broad ? 1.2 : drawn ? 0.9 : 1.05;
  const y0 = 1.5;
  const y1 = 5.0 * tall;
  const spheres = [];
  const heart = 6;
  for (let i = 0; i < heart; i++) {
    const t = i / (heart - 1);
    spheres.push([top[0] + (rand() - 0.5) * 0.2, y0 + (y1 - y0) * t, top[2] + (rand() - 0.5) * 0.2, (1.35 - 0.5 * t) * width]);
  }
  for (let j = 0; j < 3; j++) {
    const t = j / 3;
    const y = y0 + 0.2 + (y1 - y0) * t * 0.85;
    const out = (1.3 - 0.8 * t) * width;
    const k = 6 - j;
    const a0 = rand() * Math.PI * 2;
    for (let i = 0; i < k; i++) {
      const a = a0 + (i / k) * Math.PI * 2 + (rand() - 0.5) * 0.4;
      spheres.push([top[0] + Math.cos(a) * out, y + (rand() - 0.5) * 0.4, top[2] + Math.sin(a) * out, (1.05 - 0.3 * t) * width]);
    }
  }
  return { trunk, spheres };
}

// A hawthorn: a small, twisted tree, its crown of small lumps dense and
// rounded, low on a short, often leaning trunk. swept: shaped by the wind
// on an open hole, its crown streaming off to one side; stems: two or
// three stems from its foot (met as wood, drawn as trunks).
function hawthornShape(rand, { swept = false, stems = false } = {}) {
  const trunk = trunkPlan(rand, { height: 1.6 + rand() * 0.4, r0: 0.24, r1: 0.16, bendy: 0.9, branchy: stems ? 0 : 0.5, reach: 1.4 });
  if (stems) clumpStems(rand, trunk, 2 + Math.floor(rand() * 2), { out: [0.4, 0.8], high: [0.9, 1.15], thick: [0.13, 0.19] });
  const top = trunkAt(trunk, 1);
  const a = rand() * Math.PI * 2;
  const spheres = [];
  const keep = keeper(spheres, swept ? 3.3 : 3.0);
  for (const [x, y, z, r] of lumpsUp(rand, { n: 7 + Math.floor(rand() * 3), y0: 2.6, y1: swept ? 4.4 : 5.0, r0: 0.95, r1: 1.3, spread: swept ? 1.3 : 1.5, lean: swept ? 0.9 : 0, a })) keep(x + top[0], y, z + top[2], r);
  // On each stem, and at each low branch's end, a lump of its own.
  for (const br of trunk.branches) {
    const [x, y, z] = br.stem ? branchAt(trunk, br, 1) : branchTip(trunk, br);
    keep(x, y + 0.3, z, 1.0 + rand() * 0.25);
  }
  return { trunk, spheres };
}

// ---- More of each kind ----------------------------------------------------------------

// Two more shapes of every kind (MORE_SHAPES), each a habit the first ones
// haven't - a pine drawn up in a wood, a broadleaf at a wood's edge, a
// storm-bent oak, a slim cypress, a broken stump - and each within the
// reach and height of its kind's first shapes, so a tree's size and how
// far it's kept off other holes (sim/lidartrees.mjs TREE_KINDS) hold for
// them too.

// A pine drawn up in a wood: a long, clear trunk with the odd dead stub,
// and a small crown of three tiers high on it.
function drawnUpPine(rand) {
  const trunk = trunkPlan(rand, { height: 5.4, r0: 0.36, r1: 0.2, bendy: 0.4, branchy: 0.6, reach: 0.9 });
  for (const br of trunk.branches) {
    br.len *= 0.5;
    br.up += 0.2;
  }
  const a = rand() * Math.PI * 2;
  const drift = 0.1 + rand() * 0.3;
  const tiers = [
    [2.3, 3.0, 6.1],
    [1.7, 2.6, 7.7],
    [0.9, 2.0, 9.0],
  ].map(([r, h, y], i) => {
    const off = drift * (i / 2) + (rand() - 0.5) * 0.2;
    return [r * (0.88 + rand() * 0.24), h * (0.9 + rand() * 0.2), y + (rand() - 0.5) * 0.3, Math.cos(a) * off, Math.sin(a) * off];
  });
  return { trunk, tiers };
}

// A young pine, full to the ground: five broad tiers from low on a short
// trunk, a little shorter than a grown one.
function fullPine(rand) {
  const trunk = trunkPlan(rand, { height: 1.6, r0: 0.34, r1: 0.22, bendy: 0.2, branchy: 0, reach: 1 });
  const tiers = tiersUp(rand, { n: 5, from: 2.3, to: 8.1, r: (f) => 3.0 * (1 - 0.7 * f), h: (f) => 3.4 * (1 - 0.4 * f), drift: 0.2 });
  return { trunk, tiers };
}

// A broadleaf at a wood's edge: grown out towards the light, its trunk
// leaning that way and its crown nearly all on that side.
function edgeLeaf(rand) {
  const trunk = trunkPlan(rand, { height: 4.0, r0: 0.45, r1: 0.28, bendy: 1, branchy: 0.5, reach: 1.8 });
  const a = trunk.a;
  const spheres = [[Math.cos(a) * 1.0, 5.6 + rand() * 0.5, Math.sin(a) * 1.0, 2.2 + rand() * 0.3]];
  const n = 4 + Math.floor(rand() * 3);
  for (let i = 0; i < n; i++) {
    const b = a + (rand() - 0.5) * 2.2;
    const d = 0.8 + rand() * 1.6;
    const r = 1.4 + rand() * 0.6;
    const k = Math.min(1, (3.2 - r) / d);
    spheres.push([Math.cos(b) * d * k, 4.5 + rand() * 2.4, Math.sin(b) * d * k, r]);
  }
  // A lump of leaves at each low branch's end, as the others have.
  for (const br of trunk.branches) {
    const [x, y, z] = branchTip(trunk, br);
    const r = 0.8 + rand() * 0.5;
    const k = Math.min(1, (3.2 - r) / (Math.hypot(x, z) || 1));
    spheres.push([x * k, y + 0.3, z * k, r]);
  }
  return { trunk, spheres };
}

// A parkland broadleaf (a London plane: look/trees.js PLANE_SHAPES): a
// tall, clear trunk under a broad dome, a ring of lumps round its rim and
// a big one over them.
function parkLeaf(rand) {
  const trunk = trunkPlan(rand, { height: 5.0, r0: 0.5, r1: 0.3, bendy: 0.3, branchy: 0, reach: 1 });
  const top = trunkAt(trunk, 1);
  const spheres = [[top[0], 6.9 + rand() * 0.2, top[2], 2.1 + rand() * 0.2]];
  const n = 5 + Math.floor(rand() * 2);
  const a0 = rand() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const b = a0 + (i / n) * Math.PI * 2 + (rand() - 0.5) * 0.5;
    const r = 1.4 + rand() * 0.4;
    const d = 3.1 - r - rand() * 0.3;
    spheres.push([Math.cos(b) * d, 6.0 + rand() * 0.7, Math.sin(b) * d, r]);
  }
  return { trunk, spheres };
}

// A weeping birch: slender and leaning, its crown of small lumps hanging
// long, from low on its trunk nearly to its top.
function weepingBirch(rand) {
  const tall = 0.9 + rand() * 0.2;
  const trunk = trunkPlan(rand, { height: 6.4 * tall, r0: 0.21, r1: 0.09, bendy: 0.9, branchy: 0, reach: 1 });
  const top = trunkAt(trunk, 1);
  const spheres = lumpsUp(rand, { n: 10 + Math.floor(rand() * 3), y0: 3.2 * tall, y1: 10.2 * tall, r0: 0.7, r1: 1.1, spread: 1.1, lean: 0.5 }).map(([x, y, z, r]) => [x + top[0], y, z + top[2], r]);
  return { trunk, spheres };
}

// An old birch, grown broad: a bent trunk under a wider, rounder crown of
// bigger lumps.
function broadBirch(rand) {
  const tall = 0.9 + rand() * 0.15;
  const trunk = trunkPlan(rand, { height: 6.0 * tall, r0: 0.26, r1: 0.12, bendy: 0.8, branchy: 0.3, reach: 1.2 });
  const top = trunkAt(trunk, 1);
  const spheres = lumpsUp(rand, { n: 7 + Math.floor(rand() * 2), y0: 5.4 * tall, y1: 10.0 * tall, r0: 1.1, r1: 1.5, spread: 1.6, lean: 0.2 }).map(([x, y, z, r]) => [x + top[0], y, z + top[2], r]);
  return { trunk, spheres };
}

// A tall, narrow weeping willow: its dome higher and its curtain hanging
// closer in and further down.
function tallWillow(rand) {
  const trunk = trunkPlan(rand, { height: 3.8, r0: 0.55, r1: 0.38, bendy: 0.5, branchy: 0.2, reach: 1.4 });
  const top = trunkAt(trunk, 1);
  const dome = lumpsUp(rand, { n: 5 + Math.floor(rand() * 2), y0: 5.4, y1: 7.2, r0: 1.6, r1: 2.2, spread: 1.6 }).map(([x, y, z, r]) => [x + top[0], y, z + top[2], r]);
  const curtain = [];
  const n = 10 + Math.floor(rand() * 3);
  const reach = 2.9 + rand() * 0.4;
  for (let i = 0; i < n; i++) {
    if (rand() < 0.12) continue;
    const a = (i / n) * Math.PI * 2 + (rand() - 0.5) * 0.3;
    const d = reach * (0.9 + rand() * 0.12);
    curtain.push([top[0] + Math.cos(a) * d, 2.0 + rand() * 1.4, top[2] + Math.sin(a) * d, 0.95 + rand() * 0.3]);
  }
  return { trunk, spheres: [...dome, ...curtain], curtain: curtain.length };
}

// A willow leaning far out (over the water, as they do): its trunk bent
// well over and its dome and curtain carried out with it.
function leaningWillow(rand) {
  const trunk = trunkPlan(rand, { height: 3.0, r0: 0.62, r1: 0.42, bendy: 1, branchy: 0.3, reach: 1.6 });
  trunk.off = 0.8 + rand() * 0.3;
  const top = trunkAt(trunk, 1);
  const dome = lumpsUp(rand, { n: 5 + Math.floor(rand() * 2), y0: 4.4, y1: 6.2, r0: 1.7, r1: 2.3, spread: 1.8, lean: 0.4, a: trunk.a }).map(([x, y, z, r]) => [x + top[0], y, z + top[2], r]);
  const curtain = [];
  const n = 11 + Math.floor(rand() * 3);
  const reach = 3.2 + rand() * 0.3;
  for (let i = 0; i < n; i++) {
    if (rand() < 0.15) continue;
    const a = (i / n) * Math.PI * 2 + (rand() - 0.5) * 0.3;
    const d = reach * (0.9 + rand() * 0.15);
    curtain.push([top[0] + Math.cos(a) * d, 2.2 + rand() * 1.4, top[2] + Math.sin(a) * d, 1.0 + rand() * 0.3]);
  }
  return { trunk, spheres: [...dome, ...curtain], curtain: curtain.length };
}

// A slender poplar: a still narrower column, its lumps smaller.
function slimPoplar(rand) {
  const tall = 0.95 + rand() * 0.15;
  const trunk = trunkPlan(rand, { height: 3.4, r0: 0.34, r1: 0.22, bendy: 0.1, branchy: 0, reach: 1 });
  const n = 9 + Math.floor(rand() * 3);
  const spheres = lumpsUp(rand, { n, y0: 4.0, y1: 15 * tall, r0: 0.95, r1: 1.25, spread: 0.3 }).map(([x, y, z, r], i) => {
    const t = i / (n - 1);
    return [x, y, z, r * (1 - 0.5 * t * t)];
  });
  return { trunk, spheres };
}

// A black poplar: fuller and shorter than a Lombardy one, rounded over
// the top rather than coming to a point.
function blackPoplar(rand) {
  const tall = 0.9 + rand() * 0.15;
  const trunk = trunkPlan(rand, { height: 3.6, r0: 0.42, r1: 0.26, bendy: 0.3, branchy: 0, reach: 1 });
  const n = 7 + Math.floor(rand() * 2);
  const spheres = lumpsUp(rand, { n, y0: 4.6, y1: 12.5 * tall, r0: 1.25, r1: 1.45, spread: 0.6 }).map(([x, y, z, r], i) => {
    const t = i / (n - 1);
    return [x, y, z, r * (1 - 0.25 * t * t)];
  });
  return { trunk, spheres };
}

// A low, spreading mound of a bush: more lumps, lower and wider.
function moundBush(rand) {
  const trunk = trunkPlan(rand, { height: 0.3, r0: 0.08, r1: 0.05, bendy: 0, branchy: 0, reach: 0 });
  const spheres = lumpsUp(rand, { n: 5 + Math.floor(rand() * 2), y0: 0.4, y1: 0.75, r0: 0.5, r1: 0.8, spread: 1.05 }).map(([x, y, z, r]) => [x, Math.max(r * 0.62, y), z, r]);
  return { trunk, spheres };
}

// An open flowering shrub: a vase as shrubShape's, of fewer, smaller
// lumps, its stems showing between them.
function openShrub(rand) {
  const trunk = trunkPlan(rand, { height: 0.8, r0: 0.08, r1: 0.06, bendy: 0, branchy: 0, reach: 0 });
  const n = 4 + Math.floor(rand() * 2);
  const spheres = lumpsUp(rand, { n, y0: 0.75, y1: 1.4, r0: 0.38, r1: 0.55, spread: 0.8 }).map(([x, y, z, r], i) => {
    const out = 0.5 + (i / (n - 1)) * 0.85;
    return [x * out, Math.max(r * 0.8, y), z * out, r];
  });
  return { trunk, spheres, flowering: true };
}

// A young Scots pine, still a cone: its tiers down the upper half of its
// trunk as a pine's are, not yet spread into an umbrella.
function youngScots(rand) {
  const tall = 0.95 + rand() * 0.15;
  const trunk = trunkPlan(rand, { height: 6.2 * tall, r0: 0.32, r1: 0.16, bendy: 0.4, branchy: 0.4, reach: 1 });
  for (const br of trunk.branches) {
    br.len *= 0.5;
    br.up += 0.3;
  }
  const tiers = tiersUp(rand, { n: 5, from: 5.0 * tall, to: 10.6 * tall, r: (f) => 2.5 * (1 - 0.6 * f), h: (f) => 2.2 * (1 - 0.3 * f), drift: 0.3 });
  return { trunk, tiers };
}

// A Scots pine forked high up, with a head on each fork - one higher, off
// one side, the other lower, out the other.
function forkedScots(rand) {
  const tall = 0.95 + rand() * 0.15;
  const trunk = trunkPlan(rand, { height: 9.0 * tall, r0: 0.36, r1: 0.16, bendy: 0.5, branchy: 0, reach: 1 });
  const a = trunk.a + Math.PI + (rand() - 0.5) * 0.6;
  // The fork: a limb off high on the trunk, rising out the other way.
  const fork = { t0: 0.78 + rand() * 0.08, b: a, len: 1.4 + rand() * 0.4, up: 0.8 + rand() * 0.3, rb: trunkRadius(trunk, 0.8) * 0.8 };
  trunk.branches.push(fork);
  const top = trunkAt(trunk, 1);
  const tip = branchTip(trunk, fork);
  const r1 = 2.2 + rand() * 0.4;
  const r2 = 1.9 + rand() * 0.4;
  const tiers = [
    [r1, 1.5, top[1] - 0.2, top[0] - Math.cos(a) * 0.5, top[2] - Math.sin(a) * 0.5],
    [r1 * 0.55, 1.2, top[1] + 0.8, top[0] - Math.cos(a) * 0.7, top[2] - Math.sin(a) * 0.7],
    [r2, 1.4, tip[1] + 0.2, tip[0] + Math.cos(a) * 0.4, tip[2] + Math.sin(a) * 0.4],
  ];
  return { trunk, tiers };
}

// An oak drawn up among others: a taller trunk, fewer limbs leaving high
// and rising steeply, a narrower crown.
function uprightOak(rand) {
  const trunk = { height: 3.4 + rand() * 0.4, r0: 0.62, r1: 0.44, a: rand() * Math.PI * 2, off: rand() < 0.3 ? 0.1 + rand() * 0.2 : 0, kink: (rand() - 0.5) * 0.2, branches: [] };
  const limbs = 3 + Math.floor(rand() * 2);
  const a0 = rand() * Math.PI * 2;
  for (let i = 0; i < limbs; i++) {
    const t0 = 0.8 + rand() * 0.2;
    trunk.branches.push({ t0, b: a0 + (i / limbs) * Math.PI * 2 + (rand() - 0.5) * 0.6, len: 2.0 + rand() * 0.8, up: 0.55 + rand() * 0.3, ...oakLimb(rand, trunk, t0, limbs) });
  }
  const spheres = [];
  for (const br of trunk.branches) {
    const [x, y, z] = branchTip(trunk, br);
    spheres.push([x, y + 1.0, z, 1.6 + rand() * 0.5]);
  }
  const top = trunkAt(trunk, 1);
  for (const [x, y, z, r] of lumpsUp(rand, { n: 4 + Math.floor(rand() * 2), y0: 6.2, y1: 7.6, r0: 1.9, r1: 2.4, spread: 1.5 })) spheres.push([x + top[0], y, z + top[2], r]);
  return { trunk, spheres };
}

// A storm-bent oak: its trunk leaning, every limb reaching out the one
// way and its dome carried out over them - a crown all to one side.
function bentOak(rand) {
  const a0 = rand() * Math.PI * 2;
  const trunk = { height: 2.6 + rand() * 0.5, r0: 0.75, r1: 0.52, a: a0, off: 0.3 + rand() * 0.2, kink: (rand() - 0.5) * 0.2, branches: [] };
  const limbs = 4 + Math.floor(rand() * 2);
  for (let i = 0; i < limbs; i++) {
    const t0 = 0.6 + rand() * 0.4;
    trunk.branches.push({ t0, b: a0 + (rand() - 0.5) * 2.4, len: 3.2 + rand() * 1.4, up: 0.2 + rand() * 0.3, ...oakLimb(rand, trunk, t0, limbs) });
  }
  const spheres = [];
  const keep = (x, y, z, r) => {
    const d = Math.hypot(x, z);
    const k = d + r * 1.2 > 7 ? (7 - r * 1.2) / d : 1;
    spheres.push([x * k, y, z * k, r]);
  };
  for (const br of trunk.branches) {
    const [x, y, z] = branchTip(trunk, br);
    keep(x, y + 1.0, z, 1.7 + rand() * 0.5);
    const [mx, my, mz] = branchAt(trunk, br, 0.5);
    keep(mx, my + 1.5, mz, 1.5 + rand() * 0.4);
  }
  const top = trunkAt(trunk, 1);
  for (const [x, y, z, r] of lumpsUp(rand, { n: 3 + Math.floor(rand() * 2), y0: 5.2, y1: 6.6, r0: 2.0, r1: 2.5, spread: 1.6, lean: 0.8, a: a0 })) keep(x + top[0], y, z + top[2], r);
  return { trunk, spheres };
}

// A slim cypress: narrower than the column's others, and coming to a
// point rather than rounded over.
function slimColumn(rand) {
  const tall = 1.0 + rand() * 0.12;
  const trunk = trunkPlan(rand, { height: 1.2, r0: 0.26, r1: 0.18, bendy: 0.05, branchy: 0, reach: 1 });
  const tiers = tiersUp(rand, {
    n: 7,
    from: 1.2,
    to: 8.6 * tall,
    r: (f) => 0.95 * (f < 0.45 ? 1 : 1 - (f - 0.45) * 1.5),
    h: () => 2.1,
    drift: 0.08,
    jitter: 0.06,
  });
  return { trunk, tiers };
}

// A broad old yew: shorter and wider than the rest, rounded over.
function broadColumn(rand) {
  const trunk = trunkPlan(rand, { height: 1.0, r0: 0.4, r1: 0.3, bendy: 0.2, branchy: 0, reach: 1 });
  const tiers = tiersUp(rand, {
    n: 6,
    from: 1.2,
    to: 6.0 + rand() * 0.5,
    r: (f) => 1.25 * (f < 0.65 ? 1 : 1 - (f - 0.65) * 1.8),
    h: () => 2.4,
    drift: 0.1,
    jitter: 0.08,
  });
  return { trunk, tiers };
}

// A slender spruce: a narrower spire, as one grown close among others.
function slimSpruce(rand) {
  const tall = 1.0 + rand() * 0.12;
  const trunk = trunkPlan(rand, { height: 3.4, r0: 0.3, r1: 0.18, bendy: 0.15, branchy: 0, reach: 1 });
  const n = 7 + Math.floor(rand() * 2);
  const tiers = tiersUp(rand, { n, from: 2.4, to: 12.4 * tall, r: (f) => 1.7 * (1 - 0.78 * f), h: (f) => 2.4 * (1 - 0.3 * f), drift: 0.15 });
  return { trunk, tiers };
}

// An old spruce with its skirts down: its lowest tiers broad, deep and
// down near the ground, the rest stepping in to its point.
function skirtedSpruce(rand) {
  const trunk = trunkPlan(rand, { height: 2.2, r0: 0.4, r1: 0.24, bendy: 0.2, branchy: 0, reach: 1 });
  const n = 7 + Math.floor(rand() * 2);
  const tiers = tiersUp(rand, { n, from: 1.5, to: 11.6, r: (f) => 2.45 * (1 - 0.85 * f ** 0.8), h: (f) => 3.3 * (1 - 0.45 * f), drift: 0.2 });
  return { trunk, tiers };
}

// A broken stump of a snag: short, thick and splintered, a stub or two.
function stumpSnag(rand) {
  const height = 2.8 + rand() * 1.2;
  const trunk = { height, r0: 0.46, r1: 0.28, a: rand() * Math.PI * 2, off: rand() < 0.4 ? 0.1 + rand() * 0.15 : 0, kink: 0, branches: [] };
  const n = 1 + Math.floor(rand() * 2);
  for (let i = 0; i < n; i++) {
    const t0 = 0.4 + rand() * 0.45;
    trunk.branches.push({ t0, b: rand() * Math.PI * 2, len: 0.5 + rand() * 0.5, up: 0.4 + rand() * 0.6, rb: trunkRadius(trunk, t0) * 0.4 });
  }
  return { trunk, spheres: [], snag: true };
}

// A stag-headed snag: a tall dead trunk, its crown of bare branches all
// near its top, short and reaching up.
function staggedSnag(rand) {
  const height = 6.6 + rand() * 1.0;
  const bent = rand() < 0.4;
  const trunk = { height, r0: 0.38, r1: 0.13, a: rand() * Math.PI * 2, off: bent ? 0.2 + rand() * 0.3 : 0, kink: bent ? (rand() - 0.5) * 0.3 : 0, branches: [] };
  const n = 5 + Math.floor(rand() * 3);
  const a0 = rand() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const t0 = 0.68 + rand() * 0.27;
    trunk.branches.push({ t0, b: a0 + (i / n) * Math.PI * 2 + (rand() - 0.5) * 0.8, len: 0.6 + rand() * 0.6, up: 0.7 + rand() * 0.6, rb: trunkRadius(trunk, t0) * 0.45 });
  }
  return { trunk, spheres: [], snag: true };
}

// Each kind's two more, in order (MORE_SHAPES).
const MORE = {
  pine: [drawnUpPine, fullPine],
  leaf: [edgeLeaf, parkLeaf],
  birch: [weepingBirch, broadBirch],
  willow: [tallWillow, leaningWillow],
  poplar: [slimPoplar, blackPoplar],
  bush: [moundBush, openShrub],
  scots: [youngScots, forkedScots],
  oak: [uprightOak, bentOak],
  column: [slimColumn, broadColumn],
  spruce: [slimSpruce, skirtedSpruce],
  snag: [stumpSnag, staggedSnag],
};

// ---- Two more again of the commonest ----------------------------------------------------

// The pine and the broadleaf are most of a designed hole's trees: two more
// shapes each (COMMON_SHAPES), each a habit none of theirs has, within the
// reach and height of their first shapes (so a tree's size and how far it's
// kept off other holes hold for them too).

// A wind-shorn pine on an open hole: its tiers flattened and swept to one
// side, the top one leaning furthest, on a trunk bent the same way.
function shornPine(rand) {
  const trunk = trunkPlan(rand, { height: 3.0, r0: 0.4, r1: 0.22, bendy: 1, branchy: 0.3, reach: 1.2 });
  const a = trunk.a;
  const tiers = [
    [3.0, 3.0, 3.7],
    [2.4, 2.6, 5.5],
    [1.7, 2.1, 7.0],
    [1.0, 1.6, 8.2],
  ].map(([r, h, y], i) => {
    const off = 0.25 + 0.3 * (i / 3) + rand() * 0.2;
    return [r * (0.9 + rand() * 0.2), h * (0.85 + rand() * 0.15), y + (rand() - 0.5) * 0.3 + (i === 0 ? PINE_LIFT : 0), Math.cos(a) * off, Math.sin(a) * off];
  });
  return { trunk, tiers };
}

// A spire of a pine: tall and narrow, six slim tiers close up a tall trunk,
// hardly off the middle.
function spirePine(rand) {
  const trunk = trunkPlan(rand, { height: 4.2, r0: 0.34, r1: 0.18, bendy: 0.2, branchy: 0.2, reach: 0.9 });
  const tiers = tiersUp(rand, { n: 6, from: 3.4, to: 9.4, r: (f) => 2.1 * (1 - 0.62 * f), h: (f) => 2.5 * (1 - 0.35 * f), drift: 0.12, jitter: 0.08 });
  return { trunk, tiers };
}

// A broadleaf grown from an old coppice stool: three or four stems rising
// from low down, leaning out, each crowned with its own lumps - a broad,
// open crown with gaps between them.
function coppiceLeaf(rand) {
  const trunk = trunkPlan(rand, { height: 3.6, r0: 0.4, r1: 0.24, bendy: 0.5, branchy: 0, reach: 1 });
  const n = 3 + Math.floor(rand() * 2);
  const a0 = rand() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const t0 = 0.08 + rand() * 0.12;
    trunk.branches.push({ t0, b: a0 + (i / n) * Math.PI * 2 + (rand() - 0.5) * 0.6, len: 1.6 + rand() * 0.5, up: 2.1 + rand() * 0.4, rb: trunkRadius(trunk, t0) * 0.62 });
  }
  // Each stem's own crown of lumps from partway up it to over its top, and
  // one over the middle stem - together a broad crown, open between them.
  const spheres = [];
  for (const br of trunk.branches) {
    const [x, y, z] = branchTip(trunk, br);
    const r = 1.4 + rand() * 0.4;
    const k = Math.min(1, (3.2 - r) / (Math.hypot(x, z) || 1));
    spheres.push([x * k, y + 0.4, z * k, r]);
    spheres.push([x * k * 0.55, y - 0.7, z * k * 0.55, r * 0.85]);
  }
  const top = trunkAt(trunk, 1);
  spheres.push([top[0], 5.9 + rand() * 0.5, top[2], 1.9 + rand() * 0.3]);
  return { trunk, spheres };
}

// An upright broadleaf (an ash or hornbeam grown in company): a long trunk
// under a tall, narrow crown of lumps stacked up it, reaching higher than
// it spreads.
function uprightLeaf(rand) {
  const trunk = trunkPlan(rand, { height: 4.8, r0: 0.42, r1: 0.26, bendy: 0.4, branchy: 0.4, reach: 1.4 });
  const top = trunkAt(trunk, 1);
  const spheres = lumpsUp(rand, { n: 6 + Math.floor(rand() * 2), y0: 4.6, y1: 7.6, r0: 1.3, r1: 1.8, spread: 0.9, lean: 0.3 }).map(([x, y, z, r]) => [x + top[0], y, z + top[2], r]);
  for (const br of trunk.branches) {
    const [x, y, z] = branchTip(trunk, br);
    const r = 0.8 + rand() * 0.4;
    const k = Math.min(1, (3.2 - r) / (Math.hypot(x, z) || 1));
    spheres.push([x * k, y + 0.3, z * k, r]);
  }
  return { trunk, spheres };
}

// The commonest kinds' two more again (COMMON_SHAPES), in order.
const COMMON_MORE = {
  pine: [shornPine, spirePine],
  leaf: [coppiceLeaf, uprightLeaf],
};

// ---- A third of the commonest, and clumps -----------------------------------------------

// The owner's list, 5 November 2026: "a third shape each for the broadleaf
// and the pine" - more silhouettes in a wood - and "multi-stemmed birch and
// alder clumps". Each within the reach and height of its kind's first
// shapes, as the rest are; each crown whole, its lumps or tiers overlapping
// (no large gaps), every lump on a branch or a stem.

// An old pine, its top flattened out where its leader has gone: a long
// trunk with the odd dead stub under a broad, blunt crown - its tiers as
// wide high up as low down, the topmost broad and low - a silhouette none
// of its others has (the rest come to a point).
function flatPine(rand) {
  const trunk = trunkPlan(rand, { height: 4.4, r0: 0.4, r1: 0.24, bendy: 0.5, branchy: 0.45, reach: 1.1 });
  for (const br of trunk.branches) {
    br.len *= 0.55;
    br.up += 0.25;
  }
  const a = rand() * Math.PI * 2;
  const drift = 0.1 + rand() * 0.3;
  const tiers = [
    [2.5, 2.6, 5.2],
    [2.8, 2.4, 6.5],
    [2.6, 2.1, 7.6],
    [1.9, 1.5, 8.5],
  ].map(([r, h, y], i) => {
    const off = drift * (i / 3) + (rand() - 0.5) * 0.2;
    return [r * (0.9 + rand() * 0.18), h * (0.9 + rand() * 0.15), y + (rand() - 0.5) * 0.25, Math.cos(a) * off, Math.sin(a) * off];
  });
  return { trunk, tiers };
}

// A low, broad-headed broadleaf (a field maple or a lime grown in the
// open, its lower limbs kept): a short trunk forking low into a wide,
// rounded crown - a ring of lumps round a big one over the middle - nearly
// as wide as it's tall, lower than the rest: the wood's lower layer, under
// the others' crowns. (Its crown no lower than a broadleaf's boughs fit:
// sim/offshoots.mjs KITS.broad.)
function lowLeaf(rand) {
  const trunk = trunkPlan(rand, { height: 2.8, r0: 0.4, r1: 0.26, bendy: 0.6, branchy: 0, reach: 1 });
  const top = trunkAt(trunk, 1);
  const spheres = [[top[0], 5.0 + rand() * 0.4, top[2], 2.0 + rand() * 0.3]];
  const n = 5 + Math.floor(rand() * 2);
  const a0 = rand() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const b = a0 + (i / n) * Math.PI * 2 + (rand() - 0.5) * 0.5;
    const r = 1.2 + rand() * 0.4;
    const d = Math.min(2.3, 3.45 - r) * (0.88 + rand() * 0.12);
    spheres.push([top[0] * 0.5 + Math.cos(b) * d, 3.9 + rand() * 1.2, top[2] * 0.5 + Math.sin(b) * d, r]);
  }
  return { trunk, spheres: spheres.map(([x, y, z, r]) => within(x, y, z, r, 3.6)) };
}

// A lump kept within `reach` of the foot, leaves and all.
function within(x, y, z, r, reach) {
  const d = Math.hypot(x, z);
  const k = d + r > reach && d > 0 ? Math.max(0, reach - r) / d : 1;
  return [x * k, y, z * k, r];
}

// A clump's stems: its trunk (a stem of its own, leaning out) and n - 1
// more from its foot (branches marked stem: trunkPlan), each leaning out
// its own way - spread round, so they lean apart - `out` metres at its top
// (a range) and as high as `high` of the first (a range), `thick` where it
// leaves.
function clumpStems(rand, trunk, n, { out, high, thick }) {
  const a0 = trunk.a;
  for (let i = 1; i < n; i++) {
    const b = a0 + (i / n) * Math.PI * 2 + (rand() - 0.5) * 0.7;
    const t0 = 0.01 + rand() * 0.03;
    const from = trunkAt(trunk, t0);
    const len = out[0] + rand() * (out[1] - out[0]);
    const rise = trunk.height * (high[0] + rand() * (high[1] - high[0]));
    trunk.branches.push({ t0, b, len, up: (rise - from[1]) / len, rb: thick[0] + rand() * (thick[1] - thick[0]), stem: true });
  }
  return trunk;
}

// Lumps up each of a clump's stems, from `from` of the way up it to a
// little over its top, `each` a stem, r0 - r1 across, `spread` off its
// line; and `over` more over the middle of them, joining their crowns
// into one canopy (rOver across, `drop` below its stems' tops on average).
function clumpLumps(rand, trunk, { from, each, r0, r1, spread, over, rOver, drop, reach }) {
  const stems = stemsOf(trunk);
  const out = [];
  for (const s of stems) {
    for (let i = 0; i < each; i++) {
      const t = from + (1.05 - from) * (each > 1 ? i / (each - 1) : 1) + (rand() - 0.5) * 0.08;
      // (Past its top: on along its line from three quarters up.)
      const p = t <= 1 ? s.at(t) : s.at(1).map((v, k) => v + (v - s.at(0.75)[k]) * ((t - 1) / 0.25));
      const b = rand() * Math.PI * 2;
      const d = spread * Math.sqrt(rand());
      out.push(within(p[0] + Math.cos(b) * d, p[1] + (rand() - 0.5) * 0.4, p[2] + Math.sin(b) * d, r0 + rand() * (r1 - r0), reach));
    }
  }
  const tops = stems.map((s) => s.at(1));
  const mid = [0, 1, 2].map((k) => tops.reduce((a, p) => a + p[k], 0) / tops.length);
  for (let i = 0; i < over; i++) {
    const b = rand() * Math.PI * 2;
    out.push(within(mid[0] + Math.cos(b) * 0.4, mid[1] - drop + (rand() - 0.5) * 0.5, mid[2] + Math.sin(b) * 0.4, rOver[0] + rand() * (rOver[1] - rOver[0]), reach));
  }
  return out;
}

// A clump of silver birches: two to four slender white stems from one
// base (least - most), leaning apart, their small lumps up the top half of
// each and one or two over the middle - one light, open canopy over them.
function birchClump(rand, [least, most]) {
  const tall = 0.86 + rand() * 0.18;
  const n = least + Math.floor(rand() * (most - least + 1));
  const trunk = { height: 9.6 * tall, r0: 0.19, r1: 0.08, a: rand() * Math.PI * 2, off: 0.8 + rand() * 0.4, kink: (rand() - 0.5) * 0.25, branches: [] };
  clumpStems(rand, trunk, n, { out: [1.1, 1.8], high: [0.8, 0.96], thick: [0.13, 0.17] });
  // (Fewer lumps a stem the more stems: a clump's leaves as many as two
  // or three birches', not four.)
  const spheres = clumpLumps(rand, trunk, { from: 0.56, each: n > 2 ? 3 : 4, r0: 0.85, r1: 1.2, spread: 0.45, over: n > 2 ? 2 : 1, rOver: [1.0, 1.25], drop: 0.3, reach: 3.3 });
  return { trunk, spheres, clump: n };
}

// An alder grown in a clump, as they do by water (and a broadleaf cut back
// to its stool in its day): two to four dark stems from one base, leaning
// apart, under one narrow, rounded canopy - lumps up the top half of each
// and a big one over the middle.
function alderClump(rand) {
  const n = 2 + Math.floor(rand() * 3);
  const trunk = { height: 6.2 + rand() * 0.7, r0: 0.3, r1: 0.15, a: rand() * Math.PI * 2, off: 0.5 + rand() * 0.4, kink: (rand() - 0.5) * 0.2, branches: [] };
  clumpStems(rand, trunk, n, { out: [0.9, 1.4], high: [0.82, 0.95], thick: [0.21, 0.26] });
  const spheres = clumpLumps(rand, trunk, { from: 0.72, each: 3, r0: 1.15, r1: 1.5, spread: 0.4, over: 1, rOver: [1.7, 2.0], drop: -0.5, reach: 3.2 });
  return { trunk, spheres, clump: n };
}

// The commonest kinds' third (THIRD_SHAPES), and the clumps, in order.
const THIRD_MORE = {
  pine: [flatPine],
  leaf: [lowLeaf],
};
const CLUMP_MORE = {
  birch: [(rand) => birchClump(rand, [2, 3]), (rand) => birchClump(rand, [3, 4])],
  leaf: [alderClump],
};

// ---- Tall trees of the commonest kinds -------------------------------------------------

// A surveyed tree far over its kind's size - a 28 m Scots pine, a 30 m
// broadleaf, a 30 m oak on Watling Pines and Arrowmill Park - was drawn as
// its kind's ordinary shape blown up, leaves and all, two or three times
// their size (the great oak's lesson: "it should just be bigger with original
// type leaf size"). So the commonest kinds on the real courses have tall
// shapes (TALL_MORE): built about twice their kind's size (TALL_SIZE), a
// tiered kind with its tiers up a longer trunk rather than bigger tiers, a
// broadleaf or oak as a shell (sim/crownshell.mjs) of lumps a little over
// its own size (`grow`, the leaves' allowance) - never more leaf cards than
// half as many again as its ordinary shapes. Never taken by chance: a tree
// takes one when it's drawn and met over TALL.from times its kind's size
// (sim/treehits.mjs treeForm), so no course file changes.
//   top, reach: a tall broadleaf's or oak's own height and reach (metres,
//   scale 1) - a pine's and Scots pine's are its tiers' (tallPine, tallScots),
//   about 1.7 and 2 times their kind's, as broad for their height as its
//   ordinary shapes, so a tree taking one is hardly stretched either way
export const TALL_SIZE = {
  leaf: { top: 19.5, reach: 7.0 },
  oak: { top: 21, reach: 13.5 },
};
// A tall broadleaf's or oak's numbers, as GREAT_BEECH's are a beech's: its
// bole, limbs and the egg its masses stand round (dome), how many masses
// of how many lumps of what size (r: a little over the kind's own), and the
// spacing of its heart's lumps.
export const TALL_CROWN = {
  leaf: {
    bole: [6.0, 1.0], r0: 0.75, r1: 0.45, lean: [0.1, 0.3],
    limbs: 4, from: 0.7, span: 0.25, len: [3.6, 1.0], up: [1.1, 0.5],
    dome: { cy: 13.0, rx: 4.6, ry: 6.0, base: -0.55 },
    masses: 4, mass: { lumps: 2, wide: 1.8, deep: 1.6, r: [2.8, 3.4] }, sink: 0.12, billow: 2.4, heart: 4.0,
  },
  oak: {
    bole: [5.0, 0.8], r0: 1.0, r1: 0.75, lean: [0.1, 0.25],
    limbs: 6, from: 0.7, span: 0.3, len: [6.5, 1.2], up: [0.4, 0.3],
    dome: { cy: 13.2, rx: 9.6, ry: 6.4, base: -0.45 },
    masses: 8, mass: { lumps: 2, wide: 2.4, deep: 1.6, r: [2.8, 3.4] }, sink: 0.12, billow: 2.4, heart: 5.0,
  },
};
function tallBroadleaf(rand, kind, habit = {}) {
  const G = { ...TALL_CROWN[kind], ...habit };
  const D = G.dome;
  const range = ([lo, more]) => lo + rand() * more;
  const trunk = { height: range(G.bole), r0: G.r0, r1: G.r1, a: rand() * Math.PI * 2, off: range(G.lean), kink: (rand() - 0.5) * 0.15, branches: [] };
  const n = G.limbs + Math.floor(rand() * 2);
  const a0 = rand() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const t0 = G.from + rand() * G.span;
    trunk.branches.push({ t0, b: a0 + (i / n) * Math.PI * 2 + (rand() - 0.5) * 0.5, len: range(G.len), up: range(G.up), rb: trunkRadius(trunk, t0) * (LIMB.thick[0] + rand() * 0.08), sag: -range([0.05, 0.06]), taper: LIMB.taper });
  }
  const spheres = [];
  // A lump at each limb's end.
  for (const br of trunk.branches) {
    const [x, y, z] = branchTip(trunk, br);
    spheres.push([x, y + 0.6, z, G.mass.r[0]]);
  }
  // Its masses round the egg (Fibonacci, each in or out a little: billows),
  // its underside tucked in.
  const turn = rand() * Math.PI * 2;
  const pBase = Math.acos(D.base);
  const total = Math.round(G.masses / ((1 - Math.cos(pBase)) / 2));
  for (let i = 0; i < total; i++) {
    const yv = 1 - (2 * (i + 0.5)) / total;
    const p = Math.acos(yv);
    if (p > pBase) break;
    const q = turn + i * 2.399963229728653 + (rand() - 0.5) * 0.4;
    const k = (1 - G.sink + (rand() - 0.5) * G.billow * 0.2) * (1 - 0.3 * Math.max(0, -yv));
    leafMass(rand, [Math.cos(q) * Math.sin(p) * D.rx * k, D.cy + yv * D.ry * (1 - G.sink), Math.sin(q) * Math.sin(p) * D.rx * k], spheres, G.mass);
  }
  // Its heart: a ring or two of lumps inside (planes, drawn: heartPlanes).
  for (let y = D.cy - D.ry * 0.5; y <= D.cy + D.ry * 0.5; y += G.heart) {
    const rr = D.rx * 0.27;
    const m = Math.max(1, Math.round((Math.PI * 2 * rr) / G.heart));
    for (let j = 0; j < m; j++) {
      const q = (j / m) * Math.PI * 2 + rand();
      spheres.push([Math.cos(q) * rr, y + (rand() - 0.5), Math.sin(q) * rr, G.mass.r[1]]);
    }
  }
  const [out, kx, ky] = fitGreat(spheres, TALL_SIZE[kind]);
  for (const br of trunk.branches) {
    br.up *= ky / kx;
    br.len *= kx;
  }
  return { trunk, spheres: out, shell: true, tall: true };
}
// A tall pine: drawn up as a wood's pines are - a long bare trunk with the
// odd stub, its tiers high on it, more of them than a pine's four, each a
// little broader, and its cards by its radius (pineRings' sixth number:
// TALL_CARDS a metre, under a pine's own, so more tiers cost little more).
export const TALL_CARDS = { pine: 4.4, scots: 5.2 };
function tallPine(rand, { n = 5, from = 7, to = 15.6, r0 = 4.6, r1 = 1.6 } = {}) {
  const trunk = { height: from - 1.5, r0: 0.62, r1: 0.4, a: rand() * Math.PI * 2, off: rand() < 0.5 ? 0.2 + rand() * 0.5 : 0, kink: (rand() - 0.5) * 0.3, branches: [] };
  const stubs = 1 + Math.floor(rand() * 3);
  for (let i = 0; i < stubs; i++) {
    const t0 = 0.35 + rand() * 0.5;
    trunk.branches.push({ t0, b: rand() * Math.PI * 2, len: 0.8 + rand() * 0.8, up: 0.5 + rand() * 0.4, rb: trunkRadius(trunk, t0) * 0.3, taper: 0.8 });
  }
  const a = rand() * Math.PI * 2;
  const drift = 0.3 + rand() * 0.6;
  const tiers = Array.from({ length: n }, (_, i) => {
    const f = i / (n - 1);
    const off = drift * f + (rand() - 0.5) * 0.4;
    const r = (r0 + (r1 - r0) * f) * (0.85 + rand() * 0.3);
    return [r, (4.6 - 2.2 * f) * (0.9 + rand() * 0.2), from + (to - from) * f + (rand() - 0.5) * 0.4, Math.cos(a) * off, Math.sin(a) * off, Math.round(r * TALL_CARDS.pine)];
  });
  return { trunk, tiers, tall: true };
}
// A tall Scots pine: its bare trunk twice as long, its umbrella a little
// broader and now and then a tier more.
function tallScots(rand, { lean = 1 } = {}) {
  const tall = 0.95 + rand() * 0.15;
  const trunk = { height: 19.5 * tall, r0: 0.62, r1: 0.26, a: rand() * Math.PI * 2, off: (rand() < 0.7 ? 0.3 + rand() * 0.9 : 0) * lean, kink: (rand() - 0.5) * 0.4, branches: [] };
  const stubs = 1 + Math.floor(rand() * 3);
  for (let i = 0; i < stubs; i++) {
    const t0 = 0.4 + rand() * 0.45;
    trunk.branches.push({ t0, b: rand() * Math.PI * 2, len: 1 + rand(), up: 0.7 + rand() * 0.4, rb: trunkRadius(trunk, t0) * 0.3, taper: 0.8 });
  }
  const top = trunkAt(trunk, 1);
  const n = 3 + Math.floor(rand() * 2);
  const a = rand() * Math.PI * 2;
  const side = 0.5 + rand() * 1.0;
  const tiers = Array.from({ length: n }, (_, i) => {
    const f = i / (n - 1);
    const r = (5.0 - 2.0 * f) * (0.85 + rand() * 0.3);
    const b = a + (rand() - 0.5) * 1.4;
    const off = side * (1 - f * 0.5) * (0.5 + rand() * 0.6);
    return [r, 1.8 + rand() * 0.5, top[1] - 1.2 + i * 1.25 + (rand() - 0.5) * 0.3, top[0] + Math.cos(b) * off, top[2] + Math.sin(b) * off, Math.round(r * TALL_CARDS.scots)];
  });
  return { trunk, tiers, tall: true };
}
// Each kind's tall shapes, after its veterans (so no other shape's number
// changes): two each, each another tree.
const TALL_MORE = {
  pine: [(rand) => tallPine(rand), (rand) => tallPine(rand, { n: 4, from: 8.6, to: 15.8, r0: 4.4, r1: 1.8 })],
  leaf: [(rand) => tallBroadleaf(rand, "leaf"), (rand) => tallBroadleaf(rand, "leaf", { bole: [4.8, 0.8], dome: { cy: 12.4, rx: 5.2, ry: 6.8, base: -0.6 }, masses: 5 })],
  oak: [(rand) => tallBroadleaf(rand, "oak"), (rand) => tallBroadleaf(rand, "oak", { bole: [6.2, 0.8], dome: { cy: 14.4, rx: 8.6, ry: 6.0, base: -0.4 }, masses: 7 })],
  scots: [(rand) => tallScots(rand), (rand) => tallScots(rand, { lean: 0.4 })],
};
// When a tree takes one: drawn and met over `from` times its kind's own
// size (its scale), whichever of them its seed picks (sim/treehits.mjs).
export const TALL = { from: 1.6 };

// ---- A veteran ---------------------------------------------------------------------------

// A veteran oak: an open-grown giant, centuries old, some 18 m high and
// 24 m across. Built from lumps of an oak's own size, many more of them -
// not an oak scaled up, whose leaves grow with it (the owner, 26 November
// 2026, of Arrowmill Park's oak by the 13th: "the tree is probably the
// right size, but everything is scaled up, so leaves are monstrous, but it
// should just be bigger with original type leaf size"). Never a tree's by
// chance - picks among a kind's shapes stop short of it (pickShapes): a
// feature tree's alone - a real course's big tree planted as it (tools/
// realsteps/specimens.mjs), a designed hole's signature oak (sim/
// signaturetree.mjs) - and then one of several (HABITS, veteranChoices).
//
// Its form, as an old oak grown in the open has it (the owner, later on 26
// November 2026, of the first - 43 lumps on limbs over half its trunk's thickness,
// sagging in a bowl: "the lower expanding branches huge, yes they can be
// big, but they look extreme. And the clusters not wide or enough of them,
// overall height a width good"). Of the ideas tried side by side in the game
// (tools/treeblueprint.mjs draws each first) - its lumps spread evenly over
// a dome, that dome drawn into billows, and masses of lumps alone - the
// domes read as a ball on a stick at any distance, and the masses as a tree:
// - a stout bole, its six or seven main limbs leaving its upper third, each
//   about 0.4 of its thickness (together about the trunk's own: a tree's
//   limbs carry what its trunk does), rising steeply and arching out to
//   level, thin at their ends (LIMB) - and two leaders from its top;
// - its crown great masses of leaves (MASS: seven or eight lumps each,
//   broader than deep), dark hollows between them: one over each main
//   limb's end - the limb goes up into it, seen only in the crown's shade
//   near the trunk - five more higher and further in, three at its top, so
//   its outline is a broad round dome in billows, not a point;
// - fitted to its own height and reach (VETERAN_OAK), which the trees
//   planted as it are sized by: its form can change, their size doesn't.
// (Close up it wears a bough or none, where a tree wears five to nine -
// sim/offshoots.mjs: a kit's bough is made for a tree a third its size and
// reaches few of its lumps. Its masses are its form.)
export const VETERAN_OAK = { top: 17.594, reach: 11.893 };
// A big limb: how thick where it leaves (of the trunk there), how far it
// arches up (of its length: BRANCH.sag, the other way) and how much of its
// thickness is gone by its tip.
export const LIMB = { thick: [0.36, 0.44], arch: [0.07, 0.13], taper: 0.82 };
// A mass of leaves: how many lumps (and one more, as likely as not), how
// far they spread from its middle across and up and down, and their sizes.
export const MASS = { lumps: 7, wide: 3.4, deep: 2.4, r: [1.85, 2.45] };
function leafMass(rand, [cx, cy, cz], out, M = MASS) {
  const n = M.lumps + Math.floor(rand() * 2);
  for (let i = 0; i < n; i++) {
    const q = rand() * Math.PI * 2;
    const u = Math.sqrt(rand()) * M.wide;
    out.push([cx + Math.cos(q) * u, cy + (rand() - 0.5) * M.deep, cz + Math.sin(q) * u, M.r[0] + rand() * (M.r[1] - M.r[0])]);
  }
}
// The veteran's own numbers (GREAT_OAK), which a form or a habit of it
// changes some of: its bole's height (and how much it varies), how far it
// leans, its main limbs - how many, from how far up its bole (and over what
// span of it), how long, how steeply rising - where its low masses stand
// (`low`: no lower, no higher), its higher masses (`upper` of them, how far
// out and how high) and those at its top (`caps`); `lop`: fuller to the
// side it leans by that much, drawn in on the other; `skip`: that many
// neighbouring limbs' masses left thin - a gap, its limbs seen.
export const GREAT_OAK = { bole: [4.3, 0.5], lean: [0.1, 0.15], limbs: 6, from: 0.7, span: 0.3, len: [6.6, 1.2], up: [0.32, 0.36], low: [7.4, 9.4], upper: 5, upperOut: [5.6, 1], upperAt: [11, 1.2], caps: 3, capOut: 2.5, capAt: [13.2, 0.6], lop: 0, skip: 0 };
// A form of its own (TAPERING): the same tree - `rand` the veteran's own, so
// every limb and mass is where the veteran has it - changed a little, and
// what it adds drawn from `own`. A habit (HABITS): another tree altogether,
// by the same rules - its own randomness, and some of GREAT_OAK's numbers
// its own.
function veteranOak(rand, form = null, own = null) {
  const G = { ...GREAT_OAK, ...form };
  const trunk = { height: G.bole[0] + rand() * G.bole[1], r0: 0.95, r1: 0.72, a: rand() * Math.PI * 2, off: G.lean[0] + rand() * G.lean[1], kink: (rand() - 0.5) * 0.15, branches: [] };
  const range = ([lo, hi]) => lo + rand() * (hi - lo);
  const n = G.limbs + Math.floor(rand() * 2);
  const a0 = rand() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const t0 = G.from + rand() * G.span;
    trunk.branches.push({ t0, b: a0 + (i / n) * Math.PI * 2 + (rand() - 0.5) * 0.45, len: G.len[0] + rand() * G.len[1], up: G.up[0] + rand() * G.up[1], rb: trunkRadius(trunk, t0) * range(LIMB.thick), sag: -range(LIMB.arch), taper: LIMB.taper });
  }
  const main = trunk.branches.slice();
  // (Its lowest limbs leaving lower, in a form that has them so.)
  const lowered = new Set(form?.lower ? [...main].sort((a, b) => a.t0 - b.t0).slice(0, form.lower) : []);
  for (const br of lowered) {
    const share = br.rb / trunkRadius(trunk, br.t0);
    br.t0 = Math.max(0.42, br.t0 - form.drop / trunk.height);
    br.rb = trunkRadius(trunk, br.t0) * share;
  }
  const la = rand() * Math.PI * 2;
  for (let i = 0; i < 2; i++) trunk.branches.push({ t0: 0.94 + rand() * 0.06, b: la + i * Math.PI + (rand() - 0.5) * 0.8, len: 3.6 + rand() * 1.2, up: 1.15 + rand() * 0.4, rb: trunkRadius(trunk, 1) * LIMB.thick[1], sag: -0.04, taper: 0.85 });
  const spheres = [];
  // A lump at every limb's end: it goes into leaves.
  for (const br of trunk.branches) {
    const [x, y, z] = branchTip(trunk, br);
    spheres.push([x, y + 0.9, z, 1.8 + rand() * 0.5]);
  }
  // (Lopsided: a mass towards the way it leans pushed out, one the other
  // way drawn in.)
  const side = (x, z) => (G.lop ? 1 + G.lop * Math.cos(Math.atan2(z, x) - trunk.a) : 1);
  // (Open: where its gap is - drawn only by a habit that has one, so the
  // rest are as they were.)
  const gapAt = G.skip ? Math.floor(rand() * n) : -1;
  // Its masses: one over each main limb's end, low round the crown...
  main.forEach((br, i) => {
    const [x, y, z] = branchTip(trunk, br);
    const k = side(x, z);
    const thin = G.skip > 0 && (i - gapAt + n) % n < G.skip;
    leafMass(rand, [x * k, Math.min(G.low[1], Math.max(G.low[0] - (lowered.has(br) ? form.drop : 0), y + 1.6)), z * k], spheres, thin ? THIN_MASS : MASS);
  });
  // ...five higher and further in...
  const u0 = rand() * Math.PI * 2;
  for (let i = 0; i < G.upper; i++) {
    const q = u0 + (i / G.upper) * Math.PI * 2 + (rand() - 0.5) * 0.4;
    const d = (G.upperOut[0] + rand() * G.upperOut[1]) * (form?.upperIn ?? 1) * side(Math.cos(q), Math.sin(q));
    leafMass(rand, [Math.cos(q) * d, G.upperAt[0] + rand() * G.upperAt[1], Math.sin(q) * d], spheres);
  }
  // ...and three at its top.
  const c0 = rand() * Math.PI * 2;
  for (let i = 0; i < G.caps; i++) {
    const q = c0 + (i / G.caps) * Math.PI * 2 + (rand() - 0.5) * 0.4;
    const d = G.capOut * (form?.capIn ?? 1);
    leafMass(rand, [Math.cos(q) * d, G.capAt[0] + rand() * G.capAt[1], Math.sin(q) * d], spheres);
  }
  // (And one small mass above them: its top a point, not a dome.)
  if (form?.apex) leafMass(own, [0, form.apex.at, 0], spheres, form.apex);
  // Fitted to its own height and reach: how far its lumps stand up and out
  // scaled (never their size) until its top and its edge are there.
  const fitted = (target, of) => {
    let lo = 0.5;
    let hi = 2;
    for (let i = 0; i < 40; i++) {
      const k = (lo + hi) / 2;
      if (Math.max(...spheres.map((l) => of(l) * k + l[3])) > target) hi = k;
      else lo = k;
    }
    return (lo + hi) / 2;
  };
  const ky = fitted(VETERAN_OAK.top, (l) => l[1]);
  const kx = fitted(VETERAN_OAK.reach, (l) => Math.hypot(l[0], l[2]));
  const out = spheres.map(([x, y, z, r]) => [x * kx, y * ky, z * kx, r]);
  if (form?.stray) {
    // A stray branch: long, thin and low, out through the widest gap
    // between its main limbs to a tuft of leaves past the crown's edge
    // there - inside the tree's own reach, so its size is as it was - and
    // a bare stub on the trunk's other side.
    const S = form.stray;
    const turns = main.map((br) => ((br.b % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)).sort((a, b) => a - b);
    let q = 0;
    let gap = -1;
    turns.forEach((a, i) => {
      const next = i + 1 < turns.length ? turns[i + 1] : turns[0] + Math.PI * 2;
      if (next - a > gap) [gap, q] = [next - a, (a + next) / 2];
    });
    const more = own ?? rand;
    const t0 = S.from + more() * 0.08;
    const from = trunkAt(trunk, t0);
    const len = VETERAN_OAK.reach - S.tuft - 0.05 - Math.hypot(from[0], from[2]);
    const br = { t0, b: q, len, up: S.up + more() * 0.06, rb: trunkRadius(trunk, t0) * S.thick, sag: -0.05, taper: 0.88 };
    trunk.branches.push(br);
    const tip = branchTip(trunk, br);
    out.push([tip[0], tip[1] + 0.4, tip[2], S.tuft]);
    const along = branchAt(trunk, br, 0.74);
    out.push([along[0], along[1] + 0.6, along[2], S.tuft * 0.88]);
    trunk.branches.push({ t0: t0 - 0.12, b: q + 2.2 + more() * 0.8, len: S.stub, up: 0.4, rb: trunkRadius(trunk, t0) * S.thick * 0.8, sag: -0.03, taper: 0.9, bare: true });
  }
  return { trunk, spheres: out, veteran: true, ...(form ? { form: form.name } : {}) };
}
// (A gap's thin mass: two lumps where a mass has seven.)
const THIN_MASS = { ...MASS, lumps: 2, wide: 1.6 };
// The veteran as one old oak stands - Arrowmill Park's by its 13th green,
// which its owner knows (26 November 2026, of the veteran there: "This one is
// really good. And the tree looks realistic, the only thing is this tree
// doesn't look quite so perfect. The odd stray branch and it's a little more
// cone shaped tapering to the top ... and the lowest branches a few foot
// lower. All this is the realm of random variation. But this specific tree
// alone needs a slight change as I recognise it from the course"): the same
// tree, its two lowest limbs leaving 0.75 m lower (a few feet, planted) and
// their leaves with them; its upper masses drawn in and a small one above
// them, so it tapers to its top; and a stray branch with a bare stub.
export const TAPERING = { name: "tapering", lower: 2, drop: 0.75, upperIn: 0.8, capIn: 0.62, apex: { at: 15.1, lumps: 3, wide: 1.5, deep: 1.2, r: [1.75, 2.1] }, stray: { from: 0.56, up: 0.16, thick: 0.25, tuft: 1.5, stub: 1.9 } };
// (first: a new sequence of the first veteran's own randomness.)
const taperingOak = (rand, first) => veteranOak(first(), TAPERING, rand);
// The great oak's habits: other trees by the same rules, so that no two
// feature trees are the same tree (the owner, 26 November 2026, of the
// 13th's: "in general a feature tree should be less basic. The reason a
// hole is built around a tree is down to it being particularly striking and
// pretty usually. But there should be a certain randomisation in our tree
// generation that ensure tree looks different and rarely we have these kind
// of offshoots") - flat-topped and spreading; lofty, a tall bole under a
// high crown; lopsided, leaning and fuller that way; and open, a gap in its
// crown with its limbs seen - which alone of them has a stray branch and a
// bare stub: an offshoot is rare (veteranStray; sim/signaturetree.mjs
// SIGNATURE.stray, tools/realsteps/specimens.mjs STRAY).
export const HABITS = {
  spreading: { name: "spreading", bole: [3.9, 0.4], len: [7.2, 1.2], up: [0.26, 0.24], upperOut: [6.6, 1], upperAt: [10.6, 0.8], caps: 4, capOut: 3.4, capAt: [12.3, 0.4] },
  lofty: { name: "lofty", bole: [5.0, 0.5], from: 0.76, span: 0.24, up: [0.5, 0.4], low: [8.6, 10.4], upperOut: [5.0, 0.8], upperAt: [12.4, 1.2], capAt: [14.6, 0.6] },
  lopsided: { name: "lopsided", lop: 0.3, lean: [0.45, 0.25], caps: 2, capOut: 2.2 },
  open: { name: "open", skip: 2, upper: 4, stray: { from: 0.56, up: 0.16, thick: 0.25, tuft: 1.5, stub: 1.9 } },
};
// ---- Great trees of the other signature kinds ------------------------------------------

// The great oak's lesson taken to the beech, the horse chestnut and the
// cedar of Lebanon (the owner, 26 November 2026: "I'd like to start both,
// but the biggest the tree the more we just move the more visable clusters
// to the outside. And we could use cheap planes inside the tree to help feel
// depth but without using tons of resource that isn't ever seen"): each as
// that tree grows when it's old and grown in the open, from lumps (or a
// cedar's tiers) of its kind's own size - never its ordinary shape scaled
// up - and each a shell (sim/crownshell.mjs): its masses of leaves round the
// outside of its crown, where they're seen, and a sparse heart inside, which
// a ball meets and the drawing makes a few cheap dark planes of. Fitted to
// one height and reach per kind (GREAT_SIZE), as the great oak is
// (VETERAN_OAK), so a tree planted as any of them is the size it was meant.
// Three each, no two alike (GREAT_HABITS); none with offshoots - they're the
// oak's alone, and rare (veteranStray).
export const GREAT_SIZE = {
  beech: { top: 19.5, reach: 10 },
  chestnut: { top: 17.5, reach: 9.6 },
  cedar: { top: 15.5, reach: 11.5 },
};

// A great broadleaf's numbers (G), as GREAT_OAK's are the oak's:
//   bole [height, more], r0, r1 (its thickness), lean [least, more]
//   limbs: how many main limbs, from `from` (+ `span`) of the bole, each
//     len [least, more] long, rising up [least, more], arching (LIMB.arch,
//     less than none) or drooping (`droop` [least, more]: a horse
//     chestnut's, down from the trunk and up again at its end), with a fork
//     off each as likely as `fork`
//   dome: its crown's outline - an egg round (0, cy) `rx` across and `ry` up
//     and down, flattened over the top by `flat` (0 - 1), cut off below
//     `base` (of ry, under the middle: -1 the bottom)
//   masses: how many over it, each MASS-like (`mass`), set `sink` of the
//     way in from the outline; `billow`: how far in or out each stands, at
//     random (hollows between them)
//   skirt: { n, at [y, more], out [of rx, more], mass } - masses low round
//     it (a beech's sweeping lowest boughs, a horse chestnut's drooping
//     limbs' ends): at each low limb's end, then round between
//   heart: the spacing (metres) of its heart's lumps, inside `inner` of the
//     dome, each `hr` [least, most] across; lop: fuller one way (a habit's)
export const GREAT_BEECH = {
  bole: [5.2, 0.6], r0: 0.85, r1: 0.62, lean: [0.05, 0.12],
  limbs: 7, from: 0.72, span: 0.26, len: [5.4, 1.4], up: [0.9, 0.5], fork: 0.6,
  dome: { cy: 12.6, rx: 9.0, ry: 9.4, flat: 0.06, base: -0.5 },
  masses: 18, mass: { lumps: 6, wide: 3.0, deep: 2.0, r: [1.9, 2.5] }, sink: 0.16, billow: 2.2,
  skirt: { n: 8, at: [5.8, 1.2], out: [1.1, 0.08], mass: { lumps: 5, wide: 2.4, deep: 1.2, r: [1.6, 2.0] } },
  heart: 4.2, inner: 0.62, hr: [1.9, 2.4], lop: 0,
};
export const GREAT_CHESTNUT = {
  bole: [3.0, 0.5], r0: 0.95, r1: 0.7, lean: [0.08, 0.15],
  limbs: 6, from: 0.78, span: 0.22, len: [6.2, 1.2], up: [0.14, 0.18], droop: [0.16, 0.08], fork: 0.4,
  dome: { cy: 11.8, rx: 8.2, ry: 8.4, flat: 0, base: -0.45 },
  masses: 14, mass: { lumps: 7, wide: 3.3, deep: 2.3, r: [2.0, 2.6] }, sink: 0.18, billow: 2.6,
  skirt: { n: 8, at: [3.8, 1.0], out: [1.16, 0.06], mass: { lumps: 5, wide: 2.6, deep: 1.2, r: [1.7, 2.2] } },
  heart: 4.4, inner: 0.6, hr: [2.0, 2.5], lop: 0,
};
// Each kind's habits: the first its classic; then two more, each another
// tree by the same rules.
export const GREAT_HABITS = {
  beech: {
    dome: { name: "dome" },
    // A tall smooth bole under a high, vaulted crown, no skirt to speak of.
    cathedral: { name: "cathedral", bole: [7.2, 0.6], from: 0.8, up: [1.3, 0.5], dome: { cy: 14.6, rx: 8.6, ry: 7.8, flat: 0.08, base: -0.55 }, skirt: { n: 6, at: [8.6, 1.2], out: [1.0, 0.08], mass: { lumps: 4, wide: 2.2, deep: 1.2, r: [1.6, 2.0] } } },
    // Its lowest boughs sweeping out to the ground, fuller to one side.
    sweeping: { name: "sweeping", bole: [4.2, 0.5], lop: 0.16, dome: { cy: 12.0, rx: 9.2, ry: 8.8, flat: 0.15, base: -0.45 }, skirt: { n: 10, at: [3.4, 1.4], out: [1.15, 0.05], mass: { lumps: 5, wide: 2.6, deep: 1.2, r: [1.6, 2.0] } } },
  },
  chestnut: {
    dome: { name: "dome" },
    // More upright: a taller, rounder crown, its limbs rising more.
    tall: { name: "tall", bole: [3.6, 0.5], up: [0.34, 0.2], droop: [0.1, 0.06], dome: { cy: 12.4, rx: 7.8, ry: 8.8, flat: 0, base: -0.5 }, skirt: { n: 7, at: [5.0, 1.2], out: [1.1, 0.06], mass: { lumps: 5, wide: 2.4, deep: 1.2, r: [1.7, 2.2] } } },
    // Broad and low, its drooping limbs sweeping nearly to the ground.
    broad: { name: "broad", bole: [2.6, 0.4], limbs: 7, len: [7.0, 1.2], droop: [0.22, 0.08], lop: 0.12, dome: { cy: 10.8, rx: 8.8, ry: 7.6, flat: 0.08, base: -0.45 }, skirt: { n: 10, at: [2.8, 1.0], out: [1.2, 0.04], mass: { lumps: 5, wide: 2.6, deep: 1.1, r: [1.7, 2.2] } } },
  },
};
// A point on the dome's outline at angle q round and polar angle p from
// the top: [x, y, z] (flattened over the top, lopsided towards `a` by lop).
function domeAt(D, q, p, lop = 0, a = 0) {
  const s = Math.sin(p);
  let y = Math.cos(p);
  if (y > 0) y *= 1 - D.flat * y;
  const k = 1 + lop * Math.cos(q - a);
  return [Math.cos(q) * s * D.rx * k, D.cy + y * D.ry, Math.sin(q) * s * D.rx * k];
}
// (How far its underside is drawn in, at its very bottom.)
const TUCK_UNDER = 0.35;
function greatBroadleaf(rand, kind, habit) {
  const G = { ...(kind === "beech" ? GREAT_BEECH : GREAT_CHESTNUT), ...habit };
  const D = G.dome;
  const range = ([lo, more]) => lo + rand() * more;
  const trunk = { height: range(G.bole), r0: G.r0, r1: G.r1, a: rand() * Math.PI * 2, off: range(G.lean), kink: (rand() - 0.5) * 0.12, branches: [] };
  // Its main limbs: under half its trunk's thickness, together about what
  // it carries (oakLimb), rising and arching out (a beech's steeply, its
  // forks with it), or a horse chestnut's drooping and turning up at its end.
  const n = G.limbs + Math.floor(rand() * 2);
  const a0 = rand() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const t0 = G.from + rand() * G.span;
    const limb = oakLimb(rand, trunk, t0, n);
    const br = { t0, b: a0 + (i / n) * Math.PI * 2 + (rand() - 0.5) * 0.45, len: range(G.len), up: range(G.up), ...limb };
    if (G.droop) br.sag = range(G.droop);
    trunk.branches.push(br);
    if (rand() < G.fork) trunk.branches.push({ ...br, b: br.b + (rand() < 0.5 ? -1 : 1) * (0.35 + rand() * 0.3), len: br.len * (0.7 + rand() * 0.2), up: br.up * (1.1 + rand() * 0.3), rb: br.rb * 0.7 });
  }
  const main = trunk.branches.slice();
  // A leader or two on up from its top, into the crown.
  for (let i = 0; i < 2; i++) trunk.branches.push({ t0: 0.95 + rand() * 0.05, b: rand() * Math.PI * 2, len: D.ry * 0.4, up: 2 + rand() * 0.8, rb: trunkRadius(trunk, 1) * LIMB.thick[1], sag: -0.03, taper: 0.85 });
  const spheres = [];
  // A lump at every limb's end: it goes into leaves.
  for (const br of trunk.branches) {
    const [x, y, z] = branchTip(trunk, br);
    spheres.push([x, y + 0.8, z, G.mass.r[0] + rand() * (G.mass.r[1] - G.mass.r[0]) * 0.6]);
  }
  // Its masses over the outline: even round it (Fibonacci, from the top
  // down to its base), each in or out a little at random - billows, and
  // hollows between them - its lumps set a little in.
  const lopA = trunk.a;
  const pBase = Math.acos(Math.max(-1, Math.min(1, D.base)));
  const turn = rand() * Math.PI * 2;
  // (A share of a whole sphere's points reach down to its base.)
  const total = Math.round(G.masses / ((1 - Math.cos(pBase)) / 2));
  for (let i = 0; i < total; i++) {
    const yv = 1 - (2 * (i + 0.5)) / total;
    const p = Math.acos(yv);
    if (p > pBase) break;
    const q = turn + i * 2.399963229728653 + (rand() - 0.5) * 0.3;
    const [ox, oy, oz] = domeAt(D, q, p + (rand() - 0.5) * 0.08, G.lop, lopA);
    // (Under its middle, tucked in: its underside rounds in to its limbs,
    // not straight down like a wall.)
    const k = (1 - G.sink + (rand() - 0.5) * G.billow * 0.2) * (1 - TUCK_UNDER * Math.max(0, -yv));
    leafMass(rand, [ox * k, D.cy + (oy - D.cy) * (1 - G.sink), oz * k], spheres, G.mass);
  }
  // Its skirt: a mass at each low limb's end, out near the crown's edge,
  // and more round between them.
  const S = G.skirt;
  const lowEnds = main.map((br) => Math.atan2(branchTip(trunk, br)[2], branchTip(trunk, br)[0]));
  for (let i = 0; i < S.n; i++) {
    const q = i < lowEnds.length ? lowEnds[i] + (rand() - 0.5) * 0.3 : rand() * Math.PI * 2;
    const k = (1 + G.lop * Math.cos(q - lopA)) * D.rx * range(S.out);
    const y = range(S.at);
    leafMass(rand, [Math.cos(q) * k, y, Math.sin(q) * k], spheres, S.mass);
    // (And one between it and the dome's underside, in a little: the bough
    // sweeping down out of the crown, not a shelf under it.)
    const up = D.cy + D.ry * D.base * (1 - G.sink);
    leafMass(rand, [Math.cos(q) * k * 0.82, (y + up) / 2, Math.sin(q) * k * 0.82], spheres, S.mass);
  }
  // Its heart: lumps on a loose grid inside the outline - a ball meets
  // them; the drawing makes them cheap planes (look/trees.js heartPlanes).
  const H = G.heart;
  for (let x = -D.rx; x <= D.rx; x += H)
    for (let y = D.cy - D.ry; y <= D.cy + D.ry; y += H)
      for (let z = -D.rx; z <= D.rx; z += H) {
        const jx = x + (rand() - 0.5) * H * 0.4;
        const jy = y + (rand() - 0.5) * H * 0.4;
        const jz = z + (rand() - 0.5) * H * 0.4;
        const e = Math.hypot(jx / D.rx, (jy - D.cy) / D.ry, jz / D.rx);
        if (e < G.inner && (jy - D.cy) / D.ry > D.base + 0.1) spheres.push([jx, jy, jz, G.hr[0] + rand() * (G.hr[1] - G.hr[0])]);
      }
  const [out, kx, ky] = fitGreat(spheres, GREAT_SIZE[kind]);
  // (Its limbs with them, out and up to where their leaves went.)
  for (const br of trunk.branches) {
    br.up *= ky / kx;
    br.len *= kx;
  }
  return { trunk, spheres: out, veteran: true, shell: true, form: habit.name };
}
// Lumps fitted to a great tree's height and reach: how far they stand up
// and out scaled (never their size) until its top and its edge are there.
function fitGreat(spheres, size) {
  const fitted = (target, of) => {
    let lo = 0.4;
    let hi = 2.5;
    for (let i = 0; i < 40; i++) {
      const k = (lo + hi) / 2;
      if (Math.max(...spheres.map((l) => of(l) * k + l[3])) > target) hi = k;
      else lo = k;
    }
    return (lo + hi) / 2;
  };
  const ky = fitted(size.top, (l) => l[1]);
  const kx = fitted(size.reach, (l) => Math.hypot(l[0], l[2]));
  return [spheres.map(([x, y, z, r]) => [x * kx, y * ky, z * kx, r]), kx, ky];
}

// A great cedar of Lebanon: a massive trunk, dividing low into a few great
// limbs held out nearly level, and its crown broad flat plates of needles
// one above another - each plate several tiers of a cedar's own size side
// by side (sim/look: a tier's cards are sized by its radius, so its needles
// are a cedar's), at the end of a limb or along it - flat across the top,
// wider than it's tall. A shape of plates (`plates`): a ball meets each
// tier as it's drawn (sim/treehits.mjs), not a pine's one profile up its
// middle; and each tier carries how many cards its rim's ring has, by its
// radius (pineRings), where a pine's are by its place up the tree.
//   bole [height, more], r0, r1, lean; leaders: how many stems it divides
//   into (and from how far up it), each its own stack of plates; levels:
//   how many plates up each, from `low` to `high` (metres), each plate
//   `tiers` [least, more] tiers of `r` [least, more] metres, spread
//   `spread` across, out `out` [least, most] of the reach from its stem at
//   the bottom to `top` of it at the top; lop, as a broadleaf's.
export const GREAT_CEDAR = {
  bole: [10.5, 1.0], r0: 1.1, r1: 0.4, lean: [0.1, 0.2], leaders: 1, split: 0.85,
  levels: 6, low: 3.6, high: 16.4, plates: 3, tiers: [2, 2], r: [2.9, 1.2], h: [0.9, 0.3], spread: 2.6, out: [0.55, 0.75], top: 0.3, lop: 0,
};
GREAT_HABITS.cedar = {
  tabled: { name: "tabled" },
  // Forked low into two or three leaders, each with its own stack of
  // plates - an old cedar's most often.
  forked: { name: "forked", bole: [2.6, 0.4], r1: 0.85, leaders: 3, split: 0.9, levels: 4, plates: 2, out: [0.45, 0.6], top: 0.35 },
  // Swept: its plates reaching out to one side, its top tilted.
  swept: { name: "swept", lean: [0.45, 0.2], lop: 0.25, levels: 5, plates: 3, out: [0.5, 0.8] },
};
// How many cards a cedar tier's rim ring carries, by its radius (a
// pine's lowest, 3.2 m across, carries 20: about six a metre).
export const PLATE_CARDS = 6.2;
function greatCedar(rand, habit) {
  const G = { ...GREAT_CEDAR, ...habit };
  const range = ([lo, more]) => lo + rand() * more;
  const trunk = { height: range(G.bole), r0: G.r0, r1: G.r1, a: rand() * Math.PI * 2, off: range(G.lean), kink: (rand() - 0.5) * 0.15, branches: [] };
  const R = GREAT_SIZE.cedar.reach;
  const a0 = rand() * Math.PI * 2;
  // Its leaders: from the top of its bole up and out, together about as
  // thick as it (each its thickness over their number's root).
  const nl = G.leaders;
  const leaders = Array.from({ length: nl }, (_, i) => {
    const b = a0 + (i / nl) * Math.PI * 2 + (rand() - 0.5) * 0.4;
    if (nl < 2) return null;
    const br = { t0: G.split + rand() * 0.1, b, len: 3.5 + rand() * 1.5, up: 2.4 + rand() * 0.8, rb: trunkRadius(trunk, 1) * Math.min(0.48, 0.95 / Math.sqrt(nl)), sag: -0.04, taper: 0.4 };
    trunk.branches.push(br);
    return br;
  });
  // Its plates: up each stem from `low` to `high`, fewer and nearer it as
  // they go up, each turned from the one below.
  const plates = [];
  const lopA = trunk.a;
  leaders.forEach((br, li) => {
    const base = br ? branchTip(trunk, br) : trunkAt(trunk, 1);
    const own = br ? br.b : 0;
    for (let j = 0; j < G.levels; j++) {
      const f = G.levels > 1 ? j / (G.levels - 1) : 0;
      const y = G.low + (G.high - G.low) * f + (rand() - 0.5) * 0.5;
      const np = Math.max(1, Math.round(G.plates * (1 - 0.45 * f)));
      const turn = rand() * Math.PI * 2;
      for (let p = 0; p < np; p++) {
        // (Up a leader, its plates mostly out on its own side.)
        let q = turn + (p / np) * Math.PI * 2 + (rand() - 0.5) * 0.7;
        if (br) q = own + Math.atan2(Math.sin(q - own), Math.cos(q - own)) * 0.6;
        const reach = (R * (G.out[0] + rand() * (G.out[1] - G.out[0])) * (1 - (1 - G.top) * f) * (1 + G.lop * Math.cos(q - lopA))) / (br ? 1.3 : 1);
        plates.push({ li, y, x: (br ? base[0] * 1.3 : 0) + Math.cos(q) * reach, z: (br ? base[2] * 1.3 : 0) + Math.sin(q) * reach, f });
      }
    }
  });
  // A plate at its very top: its crown's flat table.
  plates.push({ li: -1, y: G.high + 1, x: 0, z: 0, f: 1 });
  // Each plate several tiers side by side round its middle, all but level.
  const tiers = [];
  for (const P of plates) {
    const nt = P.li < 0 ? 2 : Math.round(range(G.tiers));
    P.tiers = [];
    for (let t = 0; t < nt; t++) {
      const u = rand() * Math.PI * 2;
      const d = G.spread * Math.sqrt(rand()) * (t ? 1 : 0.3);
      const r = range(G.r) * (1 - 0.25 * P.f);
      P.tiers.push(tiers.length);
      tiers.push([r, range(G.h), P.y + (rand() - 0.5) * 0.35, P.x + Math.cos(u) * d, P.z + Math.sin(u) * d, Math.round(r * PLATE_CARDS)]);
    }
  }
  // Fitted to its height and reach: its plates moved, never their size.
  const top = Math.max(...tiers.map(([, h, y]) => y + h * 0.5));
  const ky = (GREAT_SIZE.cedar.top - G.low * 0.5) / (top - G.low * 0.5);
  // (Out until its furthest needles are at its reach: a tier's own reach
  // past its middle doesn't grow with it.)
  let [lo, hi] = [0.3, 3];
  for (let i = 0; i < 40; i++) {
    const k = (lo + hi) / 2;
    if (Math.max(...tiers.map(([r, , , dx, dz]) => Math.hypot(dx, dz) * k + needleReach(r * 1.02))) > R) hi = k;
    else lo = k;
  }
  const kx = (lo + hi) / 2;
  const fy = (y) => G.low * 0.5 + (y - G.low * 0.5) * ky;
  const fitted = tiers.map(([r, h, y, dx, dz, n]) => [r, h, fy(y), dx * kx, dz * kx, n]);
  // Then a limb out to each plate, nearly level, under it: off the trunk
  // where it's that high, else off its leader's end (or its bole's top) -
  // a third of the trunk's thickness there or less, thin at its end.
  for (const P of plates) {
    const [px, pz, py] = [P.x * kx, P.z * kx, fy(P.y) - 0.7];
    const br = leaders[P.li] ?? null;
    const t0 = br ? br.t0 : Math.min(1, Math.max(0.4, (py - 1) / trunk.height));
    const at = br ? branchTip(trunk, br) : trunkAt(trunk, t0);
    const len = Math.hypot(px - at[0], pz - at[2]);
    if (len < 1.2) continue;
    // (Off a leader's end: a limb is a branch, from where the leader leaves
    // the trunk, as long as to reach past its end.)
    const from = trunkAt(trunk, t0);
    const dx = px - from[0];
    const dz = pz - from[2];
    const flat = Math.hypot(dx, dz) * 0.92;
    trunk.branches.push({ t0, b: Math.atan2(dz, dx), len: flat, up: (py - from[1]) / flat, rb: (br ? br.rb * 0.36 : trunkRadius(trunk, t0) * 0.32) * (0.85 + rand() * 0.3), sag: br ? 0.04 : -0.05, taper: 0.86 });
  }
  return { trunk, tiers: fitted, veteran: true, plates: true, form: habit.name };
}

// Each kind's veterans, after everything else (so no other shape's number
// changes).
// (Each maker is handed its own randomness and a way to the first's: the
// plain veteran takes only its own.)
const VETERAN_MORE = {
  oak: [(rand) => veteranOak(rand), taperingOak, ...Object.values(HABITS).map((H) => (rand) => veteranOak(rand, H))],
  // (The beech's, the horse chestnut's and the cedar's great trees: GREAT_HABITS.)
  beech: Object.values(GREAT_HABITS.beech).map((H) => (rand) => greatBroadleaf(rand, "beech", H)),
  chestnut: Object.values(GREAT_HABITS.chestnut).map((H) => (rand) => greatBroadleaf(rand, "chestnut", H)),
  cedar: Object.values(GREAT_HABITS.cedar).map((H) => (rand) => greatCedar(rand, H)),
};
// A kind's veterans' forms, by name: which of them (the first, the plain
// one, has none) - tools/realsteps/specimens.mjs plants a tree as one by it.
export const VETERAN_FORMS = { oak: { tapering: 1, ...Object.fromEntries(Object.keys(HABITS).map((name, i) => [name, 2 + i])) }, ...Object.fromEntries(Object.entries(GREAT_HABITS).map(([kind, habits]) => [kind, Object.fromEntries(Object.keys(habits).map((name, i) => [name, i]))])) };
// The forms that are one tree's alone, known by sight: never another's.
export const VETERAN_OWN = { oak: ["tapering"] };
// The veteran shapes a kind's feature trees are chosen among (all but
// one tree's own) - none, a kind with no veteran. stray: those of them
// with offshoots (true: a stray branch and a bare stub - veteranStray) or
// those without (false); all of them, if it isn't said.
export function veteranChoices(kind, stray = null) {
  const own = new Set((VETERAN_OWN[KINDS[kind]] ?? []).map((name) => veteranFrom(kind) + VETERAN_FORMS[KINDS[kind]][name]));
  return Array.from({ length: veteranMore(kind) }, (_, i) => veteranFrom(kind) + i).filter((sh) => !own.has(sh) && (stray == null || veteranStray(kind, sh) === stray));
}
// Whether a veteran shape has offshoots: a stray branch out of its crown
// and a bare stub on its trunk (a form's or a habit's `stray`).
export function veteranStray(kind, shape) {
  return isVeteran(kind, shape) && treeShapes()[KINDS[kind]][shape].trunk.branches.some((br) => br.bare);
}
// The shape a kind's veteran is, in the form named (none: its first) - or
// null, a kind with no veteran, or none of that form.
export function veteranShape(kind, form = null) {
  if (!veteranMore(kind)) return null;
  if (form == null) return veteranFrom(kind);
  const i = VETERAN_FORMS[KINDS[kind]]?.[form];
  return Number.isInteger(i) ? veteranFrom(kind) + i : null;
}
// Whether a shape is one of its kind's veterans.
export const isVeteran = (kind, shape) => Number.isInteger(shape) && shape >= veteranFrom(kind) && shape < tallFrom(kind);
// Whether a shape is one of its kind's tall ones, and the tall shapes a
// tree of a kind may take ([] for a kind with none).
export const isTall = (kind, shape) => Number.isInteger(shape) && shape >= tallFrom(kind) && shape < shapeCount(kind);
export const tallShapes = (kind) => Array.from({ length: tallMore(kind) }, (_, i) => tallFrom(kind) + i);
// The most shapes any kind has (a hole editor's shape choice:
// holeedits/apply.mjs) - a broadleaf's: its first six, two more, two of
// the commonest, its third and its alder's clump.
export const MOST_SHAPES = Math.max(...KINDS.map((_, k) => shapeCount(k)));
// Each kind's veteran shape, by its number: [kind] -> shape (a tree planted
// as a veteran takes it: a "tv" edit, holeedits/apply.mjs).
export const VETERAN_SHAPES = Object.fromEntries(KINDS.map((kind, k) => [k, veteranMore(k) ? veteranFrom(k) : null]).filter(([, s]) => s != null));
// A kind's veteran's own height and crown (metres, at scale 1: its lumps'
// top and furthest reach) and its shape's number - its first's, or the one
// of its veterans `shape` is - null for a kind with none, or a shape that
// isn't one.
const veteranSizes = new Map();
export function veteranSize(kind, shape = VETERAN_SHAPES[kind]) {
  if (shape == null || !isVeteran(kind, shape)) return null;
  const key = kind * 100 + shape;
  if (!veteranSizes.has(key)) {
    const { spheres, tiers } = treeShapes()[KINDS[kind]][shape];
    // (A cedar's tiers: to the top of its highest, and as far out as its
    // needles reach - pineRings, needleReach.)
    if (tiers) veteranSizes.set(key, { shape, height: Math.max(...tiers.map(([, h, y]) => y + h * 0.5)), radius: Math.max(...tiers.map(([r, , , dx, dz]) => Math.hypot(dx, dz) + needleReach(r * 1.02))) });
    else veteranSizes.set(key, { shape, height: Math.max(...spheres.map(([, y, , r]) => y + r)), radius: Math.max(...spheres.map(([x, , z, r]) => Math.hypot(x, z) + r)) });
  }
  return veteranSizes.get(key);
}

// ---- Grown one-sided ---------------------------------------------------------------------

// The shapes of a kind grown one-sided - their crown nearly all to one
// side - that a tree at a wood's edge may take, turned to the open
// (treehits.mjs treeForm, sim/woodedge.mjs): a broadleaf grown out from a
// wood's edge, a wind-shorn pine, a storm-bent oak, a willow leaning far
// out. [kind] -> [shape index].
export const EDGE_SHAPES = {
  [KIND.leaf]: [firstShapes(KIND.leaf) + MORE.leaf.indexOf(edgeLeaf)],
  [KIND.pine]: [moreShapes(KIND.pine) + COMMON_MORE.pine.indexOf(shornPine)],
  [KIND.oak]: [firstShapes(KIND.oak) + MORE.oak.indexOf(bentOak)],
  [KIND.willow]: [firstShapes(KIND.willow) + MORE.willow.indexOf(leaningWillow)],
};

// Which way a shape's crown is fuller, and by how much: the middle of its
// leaves (each lump by its volume, each tier by its radius squared and
// height) across from the foot of its trunk - [x, z], model units.
export function crownLop(sh) {
  let wx = 0;
  let wz = 0;
  let w = 0;
  for (const [x, , z, r] of sh.spheres ?? []) {
    const m = r * r * r;
    wx += x * m;
    wz += z * m;
    w += m;
  }
  for (const [r, h, , dx, dz] of sh.tiers ?? []) {
    const m = r * r * h;
    wx += dx * m;
    wz += dz * m;
    w += m;
  }
  return w > 0 ? [wx / w, wz / w] : [0, 0];
}
