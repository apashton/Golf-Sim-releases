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
export function pineRings(tiers) {
  return [
    ...tiers.map(([r, h, y, dx, dz], i) => [r * 1.02, y - h * 0.32, [20, 16, 12, 7][i] ?? 6, dx, dz]),
    ...tiers.map(([r, h, y, dx, dz], i) => [r * 0.9, y - h * 0.05, [16, 13, 9, 5][i] ?? 5, dx, dz]),
    ...tiers.map(([r, h, y, dx, dz], i) => [r * 0.7, y + h * 0.22, [12, 10, 7, 4][i] ?? 4, dx, dz]),
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
function trunkPlan(rand, { height, r0, r1, bendy, branchy, reach }) {
  const bent = rand() < bendy;
  const plan = { height, r0, r1, a: rand() * Math.PI * 2, off: bent ? 0.15 + rand() * 0.45 : 0, kink: bent ? (rand() - 0.5) * 0.35 : 0, branches: [] };
  if (rand() < branchy) {
    const n = rand() < 0.35 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const t0 = 0.35 + rand() * 0.35;
      plan.branches.push({ t0, b: rand() * Math.PI * 2, len: reach * (0.7 + rand() * 0.5), up: 0.35 + rand() * 0.45, rb: (r0 + (r1 - r0) * t0) * 0.42 });
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
// drooping a little on its way out; its tip; its thickness.
export function branchTip(plan, br) {
  const from = trunkAt(plan, br.t0);
  return [from[0] + Math.cos(br.b) * br.len, from[1] + br.up * br.len, from[2] + Math.sin(br.b) * br.len];
}
export function branchAt(plan, br, t) {
  const from = trunkAt(plan, br.t0);
  const tip = branchTip(plan, br);
  return [from[0] + (tip[0] - from[0]) * t, from[1] + (tip[1] - from[1]) * t - Math.sin(t * Math.PI) * 0.18 * br.len, from[2] + (tip[2] - from[2]) * t];
}
export const branchRadius = (br, t) => br.rb * (1 - 0.6 * t);

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
export const shapeCount = (kind) => clumpFrom(kind) + clumpMore(kind);
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
// out low and far, a lump of leaves at the end of each and along it, and a
// broad dome over them - 5 - 7 m out from the trunk.
function oakShape(rand) {
  const trunk = { height: 2.7 + rand() * 0.6, r0: 0.72, r1: 0.5, a: rand() * Math.PI * 2, off: rand() < 0.4 ? 0.1 + rand() * 0.2 : 0, kink: (rand() - 0.5) * 0.2, branches: [] };
  const limbs = 4 + Math.floor(rand() * 3);
  const a0 = rand() * Math.PI * 2;
  for (let i = 0; i < limbs; i++) {
    const t0 = 0.62 + rand() * 0.38;
    trunk.branches.push({ t0, b: a0 + (i / limbs) * Math.PI * 2 + (rand() - 0.5) * 0.7, len: 3.1 + rand() * 1.5, up: 0.22 + rand() * 0.3, rb: trunkRadius(trunk, t0) * 0.55 });
  }
  const spheres = [];
  const keep = (x, y, z, r) => {
    // Within 7 m of the trunk, leaves and all.
    const d = Math.hypot(x, z);
    const k = d + r * 1.2 > 7 ? (7 - r * 1.2) / d : 1;
    spheres.push([x * k, y, z * k, r]);
  };
  for (const br of trunk.branches) {
    const [x, y, z] = branchTip(trunk, br);
    keep(x * 1.05, y + 1.1, z * 1.05, 1.7 + rand() * 0.6);
    const [mx, my, mz] = branchAt(trunk, br, 0.55);
    keep(mx, my + 1.6, mz, 1.5 + rand() * 0.5);
  }
  const top = trunkAt(trunk, 1);
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
    trunk.branches.push({ t0, b: a0 + (i / limbs) * Math.PI * 2 + (rand() - 0.5) * 0.6, len: 2.0 + rand() * 0.8, up: 0.55 + rand() * 0.3, rb: trunkRadius(trunk, t0) * 0.55 });
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
    trunk.branches.push({ t0, b: a0 + (rand() - 0.5) * 2.4, len: 3.2 + rand() * 1.4, up: 0.2 + rand() * 0.3, rb: trunkRadius(trunk, t0) * 0.55 });
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
// The most shapes any kind has (a hole editor's shape choice:
// holeedits/apply.mjs) - a broadleaf's: its first six, two more, two of
// the commonest, its third and its alder's clump.
export const MOST_SHAPES = Math.max(...KINDS.map((_, k) => shapeCount(k)));

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
