// Offshoots (the owner, 27 October 2026: "have a few static tree shapes and
// then the offshoots are connected to the tree shapes. Each type of
// offshoot is small in memory and can be spun in different ways and
// lengths etc. but gives you the same base tree many times over with
// smaller bits drawn to make them all different"; and, of the first try,
// whose offshoots stayed inside the shape's lumps, "I don't see any
// difference ... We should be able to build lots of variants versus the
// set 8 variants"): a small kit of boughs - a branch forking into big
// clumps of leaves - made once and shared by every tree of a kind; and for
// each tree, from its own seed, its own habit (how many boughs, how far
// out, how high, lopsided or even) and where each grows off its limbs. Close
// up, a tree's shape keeps only its trunk, its limbs and a smaller heart of
// leaves (OFFSHOOT.core: look/trees.js); its boughs make the rest of its
// crown and its outline, so every tree is its own. A trial on the
// broadleaf (OFFSHOOT_KINDS), close up only (sim/treelod.mjs CLOSE_FROM):
// look/trees.js draws each bough as an instance in the batches the tree is
// already in - no more draws.
//
// Each bough leaves its limb exactly (its socket: a point on the limb's
// middle line, limbPath), and the whole of it, leaves and all, stays
// inside the room a camera keeps clear of round the tree (room: the
// shape's own reach, look/trees.js crownBound). Its place in the tree is a
// turn about the tree's own foot and a scale of nearly 1 (KIT.from: made
// standing that far up), never a move: so the wind's sway
// (look/glsl/bend.js), which reads where the instance stands, moves it
// with its tree, and its tree's mottling (treepatch.js) is its tree's.
//
// Model units, as sim/treeshapes.mjs: metres for a tree of scale 1, its
// trunk's foot at the origin, y up. Pure, no browser.

import { trunkAt, branchAt, KIND, needleProfile, needlesAt, stemsOf } from "./treeshapes.mjs";
import { mulberry32 } from "./mathutil.mjs";

// The kinds that wear them, each the boughs of its own sort (boughsOf): the
// broadleaf and the oak a broadleaf's; the silver birch its own, slender
// and hanging; the Lombardy poplar's short and upright; a bush's or
// flowering shrub's small sprigs; a weeping willow's arching out of its
// dome and hanging in curtains (the owner, 28 October 2026: "work on the
// remainder of trees and shrubs").
// (And the latest broadleaves: a beech and a horse chestnut a broadleaf's;
// a holly and a hawthorn, smaller trees, a small broadleaf's, SMALL_OFFSHOOT.)
export const OFFSHOOT_KINDS = new Set([KIND.leaf, KIND.oak, KIND.birch, KIND.poplar, KIND.bush, KIND.willow, KIND.beech, KIND.chestnut, KIND.holly, KIND.hawthorn]);
// And the conifers - the pine, the Scots pine, the spruce and the column
// conifer - their own sprays (SPRAY: treeSprays), off the trunk under each
// tier and out to its rim.
export const SPRAY_KINDS = new Set([KIND.pine, KIND.scots, KIND.spruce, KIND.column, KIND.cedar]);
// And a dead tree its own bare boughs, off its branches (snagOffshoots).
export const BARE_KINDS = new Set([KIND.snag]);
export const BOUGH_KINDS = new Set([...OFFSHOOT_KINDS, ...SPRAY_KINDS, ...BARE_KINDS]);
export const BOUGH_SORTS = ["broad", "birch", "poplar", "bush", "willow", "conifer", "snag", "small"];
const SORT_OF = { [KIND.birch]: "birch", [KIND.poplar]: "poplar", [KIND.bush]: "bush", [KIND.willow]: "willow", [KIND.snag]: "snag", [KIND.holly]: "small", [KIND.hawthorn]: "small" };
export const boughsOf = (kind) => (SPRAY_KINDS.has(kind) ? "conifer" : (SORT_OF[kind] ?? "broad"));

// The kits: a bough for every `from` (metres up from the foot it's made
// standing: each fits a socket that far from the foot, at a scale within
// 9% of 1 - 12% for a birch's, taller), `tilt` (radians its branch leaves
// from that line up, rising to drooping) and `length` (metres out to its
// end clump). A birch's start higher, rise more steeply and are shorter.
// How far a bough may be scaled from its made size to fit its socket (its
// kit's heights a step apart): a broadleaf's within 10%, the rest's 12.5%.
export const KIT_SCALE = { broad: [0.88, 1.1], small: [0.88, 1.1], rest: [0.875, 1.125] };
export const KITS = {
  broad: { from: [3.7, 4.4, 5.2, 6.1, 7.2], tilt: [0.45, 0.85, 1.25, 1.65, 2.05], length: [1.4, 2.2, 3.0] },
  birch: { from: [3.9, 4.8, 5.9, 7.2, 8.8, 10.8], tilt: [0.3, 0.6, 0.9, 1.2, 1.5], length: [1.0, 1.6, 2.2] },
  // A conifer's: from low on a spruce to high on a Scots pine, leaving the
  // trunk level or a little up or down, 0.9 - 3 m out.
  conifer: { from: [0.9, 1.1, 1.35, 1.65, 2.0, 2.45, 3.0, 3.65, 4.45, 5.45, 6.65, 8.1, 9.9, 12.1], tilt: [1.2, 1.45, 1.7, 1.95], length: [0.9, 1.5, 2.2, 3.0] },
  // A poplar's: all the way up its tall column, rising steeply, short.
  poplar: { from: [3.5, 4.3, 5.2, 6.4, 7.8, 9.5, 11.6, 14.2], tilt: [0.15, 0.4, 0.65, 0.9], length: [0.7, 1.1, 1.6] },
  // A bush's sprigs: from just off the ground to its top, a few tens of
  // centimetres out.
  bush: { from: [0.42, 0.52, 0.64, 0.78, 0.95, 1.16, 1.42], tilt: [0.5, 0.9, 1.3, 1.7], length: [0.35, 0.55, 0.8] },
  // A willow's: out of its dome, level to drooping, long.
  willow: { from: [3.9, 4.75, 5.8, 7.0], tilt: [0.6, 1.0, 1.4, 1.8], length: [1.2, 1.9, 2.7] },
  // A small broadleaf's (a holly's, a hawthorn's): a broadleaf's lower and
  // shorter, for a crown from 2 m up.
  small: { from: [1.9, 2.3, 2.75, 3.3, 3.95], tilt: [0.45, 0.85, 1.25, 1.65, 2.05], length: [0.85, 1.3, 1.8] },
  // A dead tree's bare boughs: off its branches, from low to high.
  snag: { from: [1.6, 1.95, 2.4, 2.9, 3.55, 4.35, 5.3, 6.45, 7.9, 9.6], tilt: [0.3, 0.75, 1.2], length: [0.7, 1.2, 1.8] },
};
export const KIT = KITS.broad;
export const kitSize = (sort = "broad") => KITS[sort].from.length * KITS[sort].tilt.length * KITS[sort].length.length;
// Which of the kit: its from, tilt and length.
export function kitPick(i, sort = "broad") {
  const K = KITS[sort];
  const nl = K.length.length;
  const nt = K.tilt.length;
  return { from: Math.floor(i / (nt * nl)), tilt: Math.floor(i / nl) % nt, length: i % nl };
}
export const kitIndex = (from, tilt, length, sort = "broad") => (from * KITS[sort].tilt.length + tilt) * KITS[sort].length.length + length;

// How the boughs grow on a tree:
//   core   how big a close-up tree's own heart of leaves is, of its
//          shape's lumps (look/trees.js) - the boughs make the rest
//   margin how far a clump's leaves reach past its radius (its cards'
//          half width, at any setting: so a tree's boughs are the same on
//          every setting, and a ball meets them - sim/treehits.mjs - as
//          they're drawn)
//   edge   how deep in its crown a clump's middle counts, of a lump's,
//          for a ball going through (out at the crown's edge, thin leaves:
//          sim/treehits.mjs, where a ball meets the shape's own lumps as
//          ever, and these where they reach out past them)
//   count  how many boughs a tree has, [fewest, most]
//   spread how far out its boughs reach, of the room it has, [least, most]
//   rise   how high they're carried: -1 low and spreading - 1 high and
//          upright
//   lopsided how often a tree's boughs crowd to one side (grown towards
//          the light), and how much, [least, most] - and at a wood's edge
//          (treeOffshoots' toward), always towards the open side, at least
//          `edge`
//   jitter how far (radians) each is turned off an even spacing round it
//   pull   how much nearer in a bough is tried, in turn, if it won't fit
//   attach how far out from the tree's heart of leaves (core) a clump's
//          middle may be, of its own radius - so every clump overlaps the
//          crown, none a ball off on its own with sky between
//   along  where on its limb it leaves, of the way from the trunk to the
//          lump's middle
//   band   how high its end clump is, of the shape's lumps' height: [lowest,
//          highest]
//   spin   how far either way (radians) it's turned from straight at where
//          it's making for
//   shade  how much lighter or darker (light), and warmer or cooler
//          (warm), each one is than its tree's leaves at most - a bough in
//          the sun, the next in shade
//   clumps the end clump's and the side clumps' radii (metres; a short
//          bough's `short` of them), and an inner one's, `within` along it
//          (so its leaves run from the crown out to its end, not a ball off
//          on its own); the twigs' length (of the bough's), how far they
//          fork either way (radians), and where along it
//   radius the bough's thickness at its foot and tip, and the twigs'
export const OFFSHOOT = {
  core: 0.78,
  margin: 0.95,
  edge: 0.5,
  count: [5, 9],
  spread: [0.75, 1],
  rise: [-1, 1],
  lopsided: { share: 0.45, by: [0.3, 0.7], edge: 0.55 },
  jitter: 0.9,
  pull: [1, 0.85, 0.7, 0.55],
  attach: 1.1,
  along: [0.4, 0.9],
  band: [0.05, 0.95],
  spin: 0.3,
  shade: { light: 0.07, warm: 0.04 },
  clumps: { end: [0.95, 1.2], side: [0.75, 0.95], inner: [0.6, 0.75], within: [0.3, 0.42], short: 0.85, twig: [0.4, 0.5], fork: [0.5, 0.8], at: [0.55, 0.7] },
  radius: { base: 0.09, tip: 0.035, twig: 0.04, twigTip: 0.016 },
};
// A silver birch's (the owner's tree idea, for the birch): more of them,
// thinner and shorter, rising steeply then arching over at the end, its
// twigs hanging (hang: how far down each twig falls, of the bough's length,
// and its clump below its end, of the clump's radius) in small, loose,
// hanging clumps of its small leaves - its cards reaching less past them
// (margin). Its heart a little bigger (core): a birch's crown is light and
// open, its lumps already small. The rest as a broadleaf's.
export const BIRCH_OFFSHOOT = {
  ...OFFSHOOT,
  core: 0.7,
  margin: 0.5,
  count: [7, 12],
  spread: [0.85, 1],
  rise: [-0.6, 1],
  band: [0.08, 0.97],
  attach: 1.3,
  clumps: { end: [0.6, 0.82], side: [0.5, 0.66], inner: [0.42, 0.55], within: [0.32, 0.45], short: 0.9, twig: [0.4, 0.55], fork: [0.45, 0.75], at: [0.5, 0.68] },
  radius: { base: 0.05, tip: 0.018, twig: 0.018, twigTip: 0.008 },
  hang: { twig: 0.8, clump: 0.6, droop: 0.16 },
};
// A conifer's sprays (the owner: "Then birches and conifers"): a branch
// out from the trunk under one of its tiers to that tier's rim, drooping at
// its end, with a fan of needles along it and on two side twigs - its
// tiers' own needles close up drawn in a little (core, of their radius),
// so its sprays make its outline, each tree its own: how many (count, a
// metre of its tiers' radii), how far out (spread, of its tier's radius),
// how far under the tier they leave the trunk (drop, of its height),
// lopsided or not. Every needle of them inside the outline its tiers'
// needles are drawn to (outline: of where they reach as a ball meets them,
// sim/treeshapes.mjs needleProfile - a tier's needle cards reach out past
// that, thinly, as ever; and inside the room the camera keeps clear of,
// look/trees.js crownBound) - margin: their cards' reach past a clump, at
// any setting. fan: how far its end droops, and its twigs (of its length).
export const SPRAY = {
  ...OFFSHOOT,
  core: 0.85,
  margin: 0.6,
  outline: 1.25,
  count: [1.1, 1.6],
  spread: [0.95, 1.2],
  drop: [0.05, 0.32],
  jitter: 0.7,
  lopsided: { share: 0.35, by: [0.25, 0.55], edge: 0.45 },
  pull: [1, 0.92, 0.84, 0.76, 0.68],
  clumps: { end: [0.45, 0.6], side: [0.36, 0.48], inner: [0.38, 0.5], within: [0.45, 0.6], short: 0.85, twig: [0.3, 0.45], fork: [0.6, 0.95], at: [0.5, 0.7] },
  radius: { base: 0.05, tip: 0.016, twig: 0.018, twigTip: 0.008 },
  shade: { light: 0.06, warm: 0.03 },
  fan: { droop: 0.12, twig: 0.08 },
};
// A Lombardy poplar's: short boughs rising steeply all the way up its
// column, their clumps narrow and upright (look/trees.js draws them taller
// than they're wide), on a heart of its lumps drawn in a little.
export const POPLAR_OFFSHOOT = {
  ...OFFSHOOT,
  core: 0.8,
  margin: 0.6,
  count: [8, 13],
  spread: [0.85, 1],
  band: [0.04, 0.98],
  attach: 1.2,
  clumps: { end: [0.5, 0.7], side: [0.42, 0.56], inner: [0.38, 0.48], within: [0.35, 0.5], short: 0.9, twig: [0.3, 0.45], fork: [0.25, 0.45], at: [0.5, 0.7] },
  radius: { base: 0.05, tip: 0.02, twig: 0.02, twigTip: 0.01 },
};
// A bush's or flowering shrub's sprigs: small, round it, poking out past
// its lumps here and there - its lumps as they are (core: a flowering
// shrub's blossom lies over them), the sprigs adding to its outline.
export const BUSH_OFFSHOOT = {
  ...OFFSHOOT,
  core: 1,
  margin: 0.3,
  count: [5, 9],
  spread: [0.9, 1.05],
  band: [0.1, 0.95],
  attach: 1.3,
  clumps: { end: [0.26, 0.36], side: [0.2, 0.28], inner: [0.18, 0.24], within: [0.35, 0.5], short: 1, twig: [0.35, 0.5], fork: [0.5, 0.9], at: [0.5, 0.7] },
  radius: { base: 0.022, tip: 0.009, twig: 0.01, twigTip: 0.005 },
};
// A weeping willow's: arching out of its dome and down, each twig and its
// end hanging a long curtain of leaves (look/trees.js draws its clumps as
// hanging strands) - on its dome drawn in a little, its own curtain as it
// is. Its clumps may hang well below its dome (attach).
export const WILLOW_OFFSHOOT = {
  ...OFFSHOOT,
  core: 0.85,
  margin: 0.6,
  count: [6, 10],
  spread: [0.85, 1],
  rise: [-1, 0.4],
  band: [0.25, 0.95],
  attach: 2.4,
  clumps: { end: [0.6, 0.8], side: [0.5, 0.65], inner: [0.45, 0.55], within: [0.35, 0.5], short: 0.9, twig: [0.4, 0.55], fork: [0.4, 0.7], at: [0.5, 0.7] },
  radius: { base: 0.06, tip: 0.02, twig: 0.02, twigTip: 0.01 },
  hang: { twig: 0.85, clump: 1.0, droop: 0.32 },
};
// A dead tree's bare boughs (snagOffshoots): 3 - 6 off its branches, each
// forking into two bare twigs - no leaves. (Its clumps are only where its
// ends are, kept in its room.)
export const SNAG_OFFSHOOT = {
  ...OFFSHOOT,
  core: 1,
  margin: 0,
  count: [3, 6],
  along: [0.45, 0.9],
  clumps: { end: [0.05, 0.05], side: [0.05, 0.05], inner: [0.05, 0.05], within: [0.3, 0.42], short: 1, twig: [0.35, 0.5], fork: [0.4, 0.8], at: [0.5, 0.7] },
  radius: { base: 0.06, tip: 0.02, twig: 0.025, twigTip: 0.01 },
};
// A small broadleaf's (a holly's, a hawthorn's): a broadleaf's habit, its
// clumps and wood about six tenths the size, kept a little nearer its edge.
export const SMALL_OFFSHOOT = {
  ...OFFSHOOT,
  margin: 0.55,
  count: [5, 8],
  clumps: { end: [0.6, 0.76], side: [0.48, 0.6], inner: [0.38, 0.48], within: [0.3, 0.42], short: 0.85, twig: [0.4, 0.5], fork: [0.5, 0.8], at: [0.55, 0.7] },
  radius: { base: 0.055, tip: 0.022, twig: 0.025, twigTip: 0.01 },
};
export const OFFSHOOTS = { broad: OFFSHOOT, birch: BIRCH_OFFSHOOT, poplar: POPLAR_OFFSHOOT, bush: BUSH_OFFSHOOT, willow: WILLOW_OFFSHOOT, conifer: SPRAY, snag: SNAG_OFFSHOOT, small: SMALL_OFFSHOOT };
// The lumps a kind's boughs grow into: its shape's, a willow's dome only
// (not its curtain).
export const boughDome = (shape) => (shape.curtain ? shape.spheres.slice(0, shape.spheres.length - shape.curtain) : shape.spheres);
// A close-up conifer's tiers, its own needles drawn in (SPRAY.core of a
// broad tier's radius; a small one, 1 m or less across, as it is - its
// sprays seldom fit there, and it would be left thin). A Scots pine's not
// at all: its flat umbrella's flared skirt is the tree, and its
// sprays reach out past it here and there; nor a column conifer's, whose
// close, smooth column is.
export const SPRAY_CORE = { [KIND.scots]: 1, [KIND.column]: 1 };
// (A column conifer's narrow tiers leave its sprays no room inside the
// outline a broad tier gives them: it lets them a little further out, so a
// tuft pokes out of its smooth side here and there.)
export const SPRAY_OUTLINE = { [KIND.column]: 1.35 };
export function sprayCore(tiers, kind = KIND.pine) {
  const core = SPRAY_CORE[kind] ?? SPRAY.core;
  return tiers.map(([r, h, y, dx, dz, ...rest]) => [r * (1 - (1 - core) * Math.min(1, Math.max(0, r - 1))), h, y, dx, dz, ...rest]);
}

function seededRand(seed) {
  return mulberry32(seed);
}

const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const len3 = (a) => Math.hypot(a[0], a[1], a[2]);
const unit = (a) => {
  const l = len3(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
// v turned by angle q about the unit axis k (Rodrigues).
function turn(v, k, q) {
  const c = Math.cos(q);
  const s = Math.sin(q);
  const kv = cross(k, v);
  const d = dot(k, v) * (1 - c);
  return [v[0] * c + kv[0] * s + k[0] * d, v[1] * c + kv[1] * s + k[1] * d, v[2] * c + kv[2] * s + k[2] * d];
}

// A broadleaf's plain limb into a lump [x, y, z] of its crown, as
// look/trees.js draws it (limbsGeometry): from the highest point on the
// trunk a little below the lump, up and out in a gentle curve rising
// early, to the lump's middle. { at(t) (t 0 - 1), radius(t), start, end,
// length } - or null, too short to draw.
// A clump's (its stems: sim/treeshapes.mjs stemsOf) leaves whichever stem
// that point is nearest the lump across the ground - each stem's crown on
// its own stem.
export function limbPath(plan, [x, y, z]) {
  const end = [x, y, z];
  const stems = stemsOf(plan);
  let best = null;
  for (const s of stems) {
    let ts = 0.5;
    for (let k = 0; k <= 12; k++) {
      const t = 0.45 + (k / 12) * 0.55;
      if (s.at(t)[1] <= end[1] - 0.3) ts = t;
    }
    const start = s.at(ts);
    const across = Math.hypot(end[0] - start[0], end[2] - start[2]);
    if (!best || across < best.across) best = { s, ts, start, across };
  }
  const { s, ts, start } = best;
  const length = Math.hypot(end[0] - start[0], end[1] - start[1], end[2] - start[2]);
  if (length < 0.4) return null;
  const mid = [start[0] + (end[0] - start[0]) * 0.35, start[1] + (end[1] - start[1]) * 0.35 + length * 0.22, start[2] + (end[2] - start[2]) * 0.35];
  const at = (t) => [0, 1, 2].map((i) => (1 - t) * (1 - t) * start[i] + 2 * t * (1 - t) * mid[i] + t * t * end[i]);
  const r0 = Math.min(0.22, s.radius(ts) * 0.55);
  return { at, radius: (t) => Math.max(0.025, r0 * (1 - 0.75 * t)), start, end, length, ts, r0 };
}

// One bough of a kit (i: kitPick's; sort: whose, BOUGH_SORTS), in its own
// frame - standing at [0, from, 0], its branch leaving that point `tilt`
// from straight up towards +x: { from, tilt, length, branch: [start, mid,
// end], twigs: [[from, to]...], clumps: [[x, y, z, r]...] (the end's
// first, then the twigs', then the inner one on the bough) }. The same
// every time.
const PLAN_SEED = { birch: 0xb1f5, conifer: 0xc0f5, poplar: 0x9f5, bush: 0xb5f5, willow: 0x3f5, snag: 0x5f5, small: 0x5a5f5 };
export function offshootPlan(i, sort = "broad") {
  const K = KITS[sort];
  const O = OFFSHOOTS[sort];
  const pick = kitPick(i, sort);
  const from = K.from[pick.from];
  const tilt = K.tilt[pick.tilt];
  const length = K.length[pick.length];
  const rand = seededRand((PLAN_SEED[sort] ?? 0x0ff5) + i * 977);
  const C = O.clumps;
  const range = ([a, b]) => a + rand() * (b - a);
  const base = [0, from, 0];
  const dir = [Math.sin(tilt), Math.cos(tilt), 0];
  // A broadleaf's arching up a little on its way out; a birch's rising,
  // then arching over and down at its end; a conifer's spray drooping at
  // its end.
  const hang = O.hang;
  const fan = O.fan;
  const end = add(add(base, dir, length), [0, (hang ? -hang.droop : fan ? -fan.droop : 0.06) * length, 0]);
  const mid = add(add(base, dir, length * 0.5), [0, (hang ? 0.1 : fan ? 0.03 : 0.07) * length, 0]);
  const branch = [base, mid, end];
  const along = (t) => [0, 1, 2].map((k) => (1 - t) * (1 - t) * base[k] + 2 * t * (1 - t) * mid[k] + t * t * end[k]);
  const k = length < (hang ? 1.2 : 2) ? C.short : 1;
  // (A birch's clumps hang from where they grow.)
  const below = (p, r) => (hang ? [p[0], p[1] - r * hang.clump, p[2]] : p);
  const r0 = range(C.end) * k;
  const clumps = [[...below(end, r0), r0]];
  // Two twigs off it, forking either side of it in a plane of their own
  // (turned about the branch by its own angle), each to a smaller clump -
  // a birch's hanging.
  const across = turn([0, 0, 1], unit(dir), rand() * Math.PI * 2);
  const twigs = [];
  for (const side of [-1, 1]) {
    const f = along(range(C.at));
    const way = turn(unit(dir), unit(across), side * range(C.fork));
    const tw = length * range(C.twig);
    const to = hang ? add(add(f, way, tw * (1 - hang.twig)), [0, -tw * hang.twig, 0]) : add(add(f, way, tw), [0, (fan ? -fan.twig : 0.04) * length, 0]);
    twigs.push([f, to]);
    const r = range(C.side) * k;
    clumps.push([...below(to, r), r]);
  }
  // And one on the bough itself, nearer the crown.
  const inner = along(range(C.within));
  const ri = range(C.inner) * k;
  clumps.push([...below(inner, ri), ri]);
  return { from, tilt, length, branch, twigs, clumps };
}

// A kit's plans, made once.
const plans = {};
export function kitPlans(sort = "broad") {
  plans[sort] ??= Array.from({ length: kitSize(sort) }, (_, i) => offshootPlan(i, sort));
  return plans[sort];
}

// A point p of an offshoot's own frame, placed by m (offshootMatrix's).
export function placePoint(m, [x, y, z]) {
  return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];
}

// The matrix placing an offshoot made standing `from` up from the foot
// with its socket at `at` (model units), its branch leaning towards `way`:
// a turn about the foot taking its up to the socket's direction and its +x
// towards `way` (square to that), and a scale taking `from` to the
// socket's distance - no move. Column-major, as THREE.Matrix4's elements.
export function offshootMatrix(at, way, from) {
  const d = len3(at);
  const u = unit(at);
  let a = add(way, u, -dot(way, u));
  if (len3(a) < 1e-6) a = Math.abs(u[1]) < 0.9 ? cross([0, 1, 0], u) : cross([1, 0, 0], u);
  a = unit(a);
  const c = cross(a, u);
  const s = d / from;
  return [a[0] * s, a[1] * s, a[2] * s, 0, u[0] * s, u[1] * s, u[2] * s, 0, c[0] * s, c[1] * s, c[2] * s, 0, 0, 0, 0, 1];
}

// The room a tree's crown has (model units): how far out from its trunk
// and how high its leaves may reach - the camera's (look/trees.js passes
// its shape's own reach; this a measure from its lumps alone, for the
// tests).
export function roomOf(dome) {
  return { r: Math.max(...dome.map(([x, , z, r]) => Math.hypot(x, z) + r * 1.25)), top: Math.max(...dome.map(([, y, , r]) => y + r * 1.15)) };
}

// A tree's boughs: shape { trunk (its plan), dome (its lumps of leaves
// [x, y, z, r]) }, seed its own (a whole number); room: how far out and
// up its leaves may reach (roomOf), margin how far a clump's leaves reach
// past its radius (its cards' half width). [{ kit (which of the kit),
// matrix (offshootMatrix's), lump, t, at (its socket, t along that lump's
// limb: limbPath), clumps (where its clumps are, model units: [x, y, z,
// r]), shade (-1 - 1: OFFSHOOT.shade's share) }]. The same tree, the same
// boughs.
// kind: the tree's (OFFSHOOT_KINDS: which boughs it wears, boughsOf).
// toward: for a tree at a wood's edge (sim/woodedge.mjs, treehits.mjs
// treeForm's `open`), which way the open side is (radians, in its own
// frame: x towards 0, z towards a quarter turn) - its boughs crowd that
// way, reaching as far out as its room lets them: its crown fuller on the
// open side, in the same room (no further out than any tree's).
export function treeOffshoots({ trunk, dome }, seed, { kind = KIND.leaf, sort = boughsOf(kind), room = roomOf(dome), margin = OFFSHOOTS[sort].margin, plansOf = kitPlans(sort), toward = null } = {}) {
  const rand = seededRand((seed ^ 0x5eed0ff) >>> 0);
  const O = OFFSHOOTS[sort];
  const K = KITS[sort];
  const range = ([a, b]) => a + rand() * (b - a);
  const near = (list, v) => list.reduce((best, x, i) => (Math.abs(x - v) < Math.abs(list[best] - v) ? i : best), 0);
  // Its habit: how many, how far out, how high, and lopsided or not.
  const count = Math.round(range([O.count[0] - 0.49, O.count[1] + 0.49]));
  let spread = range(O.spread);
  const rise = range(O.rise);
  let side = rand() * Math.PI * 2;
  let lean = rand() < O.lopsided.share ? range(O.lopsided.by) : 0;
  const a0 = rand() * Math.PI * 2;
  // (At a wood's edge, after every draw, so the rest are as they were.)
  if (Number.isFinite(toward)) {
    side = toward;
    lean = Math.max(lean, O.lopsided.edge);
    spread = O.spread[1];
  }
  const limbs = dome.map((l) => limbPath(trunk, l));
  const lo = Math.min(...dome.map(([, y, , r]) => y - r * 0.75));
  const hi = Math.max(...dome.map(([, y, , r]) => y + r * 0.6));
  const endR = O.clumps.end[1];
  // How far (x, y, z) is outside the tree's heart of leaves (its lumps at
  // OFFSHOOT.core of their size).
  const offCore = (x, y, z) => Math.min(...dome.map(([lx, ly, lz, r]) => Math.hypot(x - lx, y - ly, z - lz) - r * O.core));
  const out = [];
  for (let j = 0; j < count; j++) {
    // Round the tree, evenly but not quite, crowded to one side if it's
    // lopsided.
    let az = a0 + (j / count) * Math.PI * 2 + (rand() - 0.5) * O.jitter;
    if (lean) az = side + (Math.atan2(Math.sin(az - side), Math.cos(az - side)) * (1 - lean));
    const up = Math.min(O.band[1], Math.max(O.band[0], 0.5 + 0.25 * rise + (rand() - 0.5) * 0.8));
    const h = Math.min(lo + (hi - lo) * up, room.top - endR - margin);
    const reach = Math.max(0.8, (room.r - endR - margin) * spread * (0.85 + 0.15 * rand()));
    const t = range(O.along);
    const shade = rand() * 2 - 1;
    const spin = (rand() * 2 - 1) * O.spin;
    // Making for there - or, if it won't fit in its room, a little nearer
    // in, and nearer again.
    for (const pull of O.pull) {
      const placed = bough([Math.cos(az) * reach * pull, h, Math.sin(az) * reach * pull], t, spin);
      if (!placed) continue;
      out.push({ ...placed, t, shade });
      break;
    }
  }
  // A bough making for `target`, off the limb whose lump is nearest it, t
  // along it: the kit's nearest - made standing nearest the socket's
  // distance, leaving at the nearest tilt to the way it's to go, and the
  // nearest length, or a shorter one - that keeps it in its room; or null.
  function bough(target, t, spin) {
    let k = -1;
    let best = Infinity;
    for (let m = 0; m < dome.length; m++) {
      if (!limbs[m]) continue;
      const d = Math.hypot(dome[m][0] - target[0], dome[m][1] - target[1], dome[m][2] - target[2]) - dome[m][3] * 0.5;
      if (d < best) [k, best] = [m, d];
    }
    if (k < 0) return null;
    const at = limbs[k].at(t);
    const want = add(target, at, -1);
    const dist = len3(at);
    const fi = near(K.from, dist);
    // (Only where its kit's nearest height makes it within KIT_SCALE of
    // its made size - always, on the kinds the kits were made for; on a
    // latest kind's crown, higher or lower than theirs (a beech's, a
    // holly's), a socket out of reach of them takes none.)
    const band = KIT_SCALE[sort] ?? KIT_SCALE.rest;
    if (dist / K.from[fi] < band[0] || dist / K.from[fi] > band[1]) return null;
    const ti = near(K.tilt, Math.acos(Math.max(-1, Math.min(1, dot(unit(want), unit(at))))));
    const way = turn(unit(want), unit(at), spin);
    for (let li = near(K.length, len3(want)); li >= 0; li--) {
      const i = kitIndex(fi, ti, li, sort);
      const plan = plansOf[i];
      const matrix = offshootMatrix(at, way, plan.from);
      const s = dist / plan.from;
      const clumps = plan.clumps.map(([x, y, z, cr]) => [...placePoint(matrix, [x, y, z]), cr * s]);
      const fits = clumps.every(([x, y, z, cr]) => Math.hypot(x, z) + cr + margin * s <= room.r && y + cr + margin * s <= room.top && y - cr >= lo - 0.3 && offCore(x, y, z) <= cr * O.attach);
      if (fits) return { kit: i, matrix, lump: k, at, clumps };
    }
    return null;
  }
  return out;
}

// A conifer's sprays (SPRAY): shape { trunk (its plan), tiers ([r, h, y,
// dx, dz]) }, seed its own, kind its own (SPRAY_KINDS). [{ kit (which of
// the conifers' kit), matrix (offshootMatrix's), tier, at (its socket: on
// the trunk where it's that high, else on the line up through the tiers'
// middles, as look/trees.js coniferLimbs' arms leave it), clumps ([x, y,
// z, r], model units), shade }]. The same tree, the same sprays.
// toward: a tree at a wood's edge (as treeOffshoots): its sprays crowded
// to the open side.
export function treeSprays({ trunk, tiers }, seed, { kind = KIND.pine, margin = SPRAY.margin, plansOf = kitPlans("conifer"), toward = null } = {}) {
  const rand = seededRand((seed ^ 0x5b4a7) >>> 0);
  const O = SPRAY;
  const outline = SPRAY_OUTLINE[kind] ?? O.outline;
  const K = KITS.conifer;
  const range = ([a, b]) => a + rand() * (b - a);
  const near = (list, v) => list.reduce((best, x, i) => (Math.abs(x - v) < Math.abs(list[best] - v) ? i : best), 0);
  const profile = needleProfile(tiers);
  const top = trunkAt(trunk, 1);
  // Its habit: how many (more on a broader tree), lopsided or not.
  const total = tiers.reduce((a, [r]) => a + r, 0);
  const count = Math.max(3, Math.round(total * range(O.count)));
  let side = rand() * Math.PI * 2;
  let lean = rand() < O.lopsided.share ? range(O.lopsided.by) : 0;
  const a0 = rand() * Math.PI * 2;
  if (Number.isFinite(toward)) {
    side = toward;
    lean = Math.max(lean, O.lopsided.edge);
  }
  // Whether a clump, leaves and all, is inside where the tree's needles
  // reach: at its middle and above and below it.
  // (A low tier's sprays droop to below where its needles start, as its
  // own cards do: there, as wide as they start, down to a little under.)
  const bottom = profile[0][0];
  const inside = (x, y, z, cr, s) =>
    y - cr >= bottom - 0.8 &&
    [-0.5, 0, 0.5].every((k) => {
      const n = needlesAt(profile, Math.max(bottom, y + cr * k));
      return !!n && Math.hypot(x - n[1], z - n[2]) + cr + margin * s <= n[0] * outline;
    });
  const out = [];
  for (let j = 0; j < count; j++) {
    let az = a0 + (j / count) * Math.PI * 2 + (rand() - 0.5) * O.jitter;
    if (lean) az = side + Math.atan2(Math.sin(az - side), Math.cos(az - side)) * (1 - lean);
    // Its tier: the broader the likelier.
    let pick = rand() * total;
    let ti = 0;
    while (ti < tiers.length - 1 && pick > tiers[ti][0]) pick -= tiers[ti++][0];
    const [r, h, y, dx, dz] = tiers[ti];
    // (Never from right at the foot: a spruce's lowest tier sweeps the
    // ground.)
    const base = Math.max(K.from[0] * 1.05, y - h * range(O.drop));
    const at = base <= top[1] ? trunkAt(trunk, Math.max(0, base / trunk.height)) : [dx, base, dz];
    const reach = r * range(O.spread);
    const shade = rand() * 2 - 1;
    for (const pull of O.pull) {
      const target = [dx + Math.cos(az) * reach * pull, base - h * 0.05, dz + Math.sin(az) * reach * pull];
      const placed = spray(at, target);
      if (!placed) continue;
      out.push({ ...placed, tier: ti, at, shade });
      break;
    }
  }
  // A spray from `at` making for `target`: the kit's nearest - made
  // standing nearest the socket's distance, leaving at the nearest tilt to
  // the way it's to go, and the nearest length, or a shorter one - that
  // keeps it inside the needles; or null.
  function spray(at, target) {
    const want = add(target, at, -1);
    const dist = len3(at);
    if (dist < 0.5) return null;
    const fi = near(K.from, dist);
    const ti = near(K.tilt, Math.acos(Math.max(-1, Math.min(1, dot(unit(want), unit(at))))));
    const way = unit(want);
    for (let li = near(K.length, len3(want)); li >= 0; li--) {
      const i = kitIndex(fi, ti, li, "conifer");
      const plan = plansOf[i];
      const matrix = offshootMatrix(at, way, plan.from);
      const s = dist / plan.from;
      const clumps = plan.clumps.map(([x, y, z, cr]) => [...placePoint(matrix, [x, y, z]), cr * s]);
      if (clumps.every(([x, y, z, cr]) => inside(x, y, z, cr, s))) return { kit: i, matrix, clumps };
    }
    return null;
  }
  return out;
}

// A dead tree's bare boughs (SNAG_OFFSHOOT): shape { trunk (its plan, its
// branches) }, seed its own. Off its branches, each `t` along one (branch
// -1: its trunk, high up), turned a little either way off it and up; the kit's nearest that keeps its ends
// inside the room its branches give it (its trunk's top and its branches'
// tips: the camera keeps clear of those). [{ kit, matrix, branch, t, at,
// clumps (its ends), shade }]. The same tree, the same boughs.
export function snagOffshoots({ trunk }, seed, { plansOf = kitPlans("snag") } = {}) {
  const rand = seededRand((seed ^ 0x5a6b0) >>> 0);
  const O = SNAG_OFFSHOOT;
  const K = KITS.snag;
  const range = ([a, b]) => a + rand() * (b - a);
  const near = (list, v) => list.reduce((best, x, i) => (Math.abs(x - v) < Math.abs(list[best] - v) ? i : best), 0);
  const branches = trunk.branches ?? [];
  if (!branches.length) return [];
  const tips = [trunkAt(trunk, 1), ...branches.map((br) => branchAt(trunk, br, 1))];
  const room = { r: Math.max(...tips.map(([x, , z]) => Math.hypot(x, z))), top: Math.max(...tips.map(([, y]) => y)) };
  const count = Math.round(range([O.count[0] - 0.49, O.count[1] + 0.49]));
  const out = [];
  for (let j = 0; j < count; j++) {
    // Off a branch - or, as often as its branches are few, off its trunk
    // high up (b -1), out any way.
    const onTrunk = rand() < 1 / (1 + branches.length);
    const b = onTrunk ? -1 : Math.floor(rand() * branches.length);
    const t = onTrunk ? range([0.55, 0.92]) : range(O.along);
    const at = onTrunk ? trunkAt(trunk, t) : branchAt(trunk, branches[b], t);
    const a = rand() * Math.PI * 2;
    const ahead = onTrunk ? [Math.cos(a), 0, Math.sin(a)] : add(branchAt(trunk, branches[b], Math.min(1, t + 0.05)), at, -1);
    const side = (rand() < 0.5 ? -1 : 1) * (0.4 + rand() * 0.6);
    const way = unit(add(turn(unit(ahead), [0, 1, 0], side), [0, 0.25 + rand() * 0.35, 0]));
    const want = range([K.length[0], K.length.at(-1)]);
    const shade = rand() * 2 - 1;
    const dist = len3(at);
    if (dist < K.from[0] * 0.88) continue;
    const fi = near(K.from, dist);
    const ti = near(K.tilt, Math.acos(Math.max(-1, Math.min(1, dot(way, unit(at))))));
    for (let li = near(K.length, want); li >= 0; li--) {
      const i = kitIndex(fi, ti, li, "snag");
      const plan = plansOf[i];
      const matrix = offshootMatrix(at, way, plan.from);
      const s = dist / plan.from;
      const clumps = plan.clumps.map(([x, y, z, cr]) => [...placePoint(matrix, [x, y, z]), cr * s]);
      if (clumps.every(([x, y, z]) => Math.hypot(x, z) <= room.r && y <= room.top && y > 0.5)) {
        out.push({ kit: i, matrix, branch: b, t, at, clumps, shade });
        break;
      }
    }
  }
  return out;
}
