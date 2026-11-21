// What dresses a hole's rough, for the look of it (look/dressing.js draws
// it; none of it changes how a ball plays):
//
//   heather  patches of low purple-brown heather, in soft irregular shapes
//            (the shapes of sim/wear.mjs's worn patches), out in the rough
//   gorse    rounded clumps of dark gorse, yellow in flower, alone or a few
//            together, at the edge of the heather and out in the deep rough
//   rocks    stones half sunk in the ground, alone or two or three together
//   flowers  patches of wildflowers - white, yellow, purple, blue, pink,
//            red, orange, lilac or cream - each patch mostly one colour
//   reeds    along the edges of ponds and lakes, in runs with gaps between,
//            never against a wall
//   stumps   an old stump or a fallen log now and then, look only (kept off
//            play as rocks are)
//   bracken  drifts at the woods' edges, green to russet (High)
//   fescue   long fescue with golden seed heads on open holes (High; kept
//            off as heather is)
//   lilies   lily pads, some flowering cream or pink, in calm shallows (High;
//            [x, z, size, turn, flower, the water's level])
// Each rock is also one of ROCK_SHAPES, and the hole has a stone of its own
// (STONES); and a few feature boulders by the tees (boulders, drawn as
// rocks are).
//
// A hole with few trees (a links or heathland hole) has more heather and
// gorse; a wooded one only a little. All of it kept well clear of the
// fairway, greens, tees, sand, water and paths (reeds excepted, which grow
// at the water's edge). Hole frame (sim/course.mjs): the tee at (0, 0), x
// down the hole, z to the right, metres. lieAt(x, z): the hole's surface.
// Seeded, so a hole always looks the same. Pure, for the tests.

import { seeded } from "./course.mjs";
import { marshAt } from "./hazardshapes.mjs";
import { insideDepth } from "./holeedits/shapes.mjs";
import { patchParts, partRadius, holeBox, wobble } from "./wear.mjs";
import { wallDistance, pondLevel } from "./walls.mjs";

// What dressing may stand on.
export const DRESSES = new Set(["rough", "deep", "semi", "trees"]);
// Kept at least this far (metres) from each kind of ground.
export const DRESSING_CLEAR = {
  heather: {
    fairway: 8,
    semi: 3,
    green: 14,
    fringe: 12,
    tee: 8,
    bunker: 3,
    greenside: 4,
    water: 2.5,
    path: 2.5,
  },
  gorse: {
    fairway: 7,
    semi: 3,
    green: 14,
    fringe: 12,
    tee: 8,
    bunker: 3,
    greenside: 4,
    water: 2.5,
    path: 2.5,
  },
  rocks: {
    fairway: 5,
    semi: 2,
    green: 10,
    fringe: 8,
    tee: 6,
    bunker: 2,
    greenside: 3,
    water: 1.5,
    path: 1.5,
  },
  flowers: {
    fairway: 4,
    green: 9,
    fringe: 7,
    tee: 5,
    bunker: 2,
    greenside: 2,
    water: 1.5,
    path: 1.5,
  },
};
// Reeds: on the water within REED_REACH of the bank, where the bank is
// one of these, and nowhere near the rest.
const REED_BANK = new Set(["rough", "deep", "semi", "trees"]);
const REED_REACH = 1.4;
const REED_CLEAR = {
  fairway: 5,
  green: 10,
  fringe: 8,
  tee: 6,
  bunker: 3,
  path: 3,
};
export const LIMITS = {
  heather: 900,
  gorse: 36,
  rocks: 30,
  flowers: 360,
  reeds: 320,
};
export const FLOWER_COLOURS = ["white", "yellow", "purple", "blue", "pink", "red", "orange", "lilac", "cream"];
// The newer dressing: how many at most, and kept off as what.
LIMITS.stumps = 10;
LIMITS.bracken = 420;
LIMITS.fescue = 700;
LIMITS.lilies = 90;
LIMITS.boulders = 4;
DRESSING_CLEAR.stumps = DRESSING_CLEAR.rocks;
DRESSING_CLEAR.bracken = DRESSING_CLEAR.heather;
DRESSING_CLEAR.fescue = DRESSING_CLEAR.heather;
// The rocks' shapes (look/dressing.js draws each): a rounded boulder, a
// flat slab, a squarish block, a split pair and a low outcrop.
export const ROCK_SHAPES = ["boulder", "slab", "block", "split", "outcrop"];
// A hole's own stone.
export const STONES = ["granite", "sandstone", "limestone", "basalt"];
export const stoneOf = (seed) => STONES[((seed >>> 0) * 2654435761 >>> 0) % STONES.length];

export function clearOf(lieAt, x, z, table, pad = 0) {
  if (!DRESSES.has(lieAt(x, z))) return false;
  const rings = [...new Set(Object.values(table))].sort((a, b) => a - b);
  for (const base of rings) {
    const r = base + pad;
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      const lie = lieAt(x + Math.cos(a) * r, z + Math.sin(a) * r);
      if (table[lie] != null && table[lie] + pad >= r) return false;
    }
  }
  return true;
}

// How far inside a patch's parts (sim/wear.mjs) a point is, metres
// (negative outside).
function depthInParts(parts, x, z) {
  return Math.max(...parts.map((p) => partRadius(p, Math.atan2(z - p.z, x - p.x)) - Math.hypot(x - p.x, z - p.z)));
}

// How open the hole is, 0 (a wood) - 1 (not a tree on it): trees per
// hundred metres of its length.
export function openness(L) {
  const len = Math.max(60, L.green?.x ?? 150);
  const perHundred = ((L.trees ?? []).filter((t) => t[3] !== 5).length * 100) / len;
  return Math.max(0, Math.min(1, 1 - perHundred / 80));
}

const r2 = (v) => Math.round(v * 100) / 100;

// The hole's dressing: { heather, gorse, rocks, flowers, reeds }, each a
// list of [x, z, size, turn] (flowers [x, z, size, turn, colour index]).
export function roughDressing(L, lieAt, seed = 1) {
  const steps = roughDressingSteps(L, lieAt, seed);
  for (;;) {
    const r = steps.next();
    if (r.done) return r.value;
  }
}
// The same, a kind or two at a time (yielding what it's done), for a hole
// built a step at a time (course/holescenery.js addDressingSteps): on a
// links hole by the sea, all of it was a quarter of a second of the page.
export function* roughDressingSteps(L, lieAt, seed = 1) {
  const rand = seeded((seed ^ 0xd2e55) >>> 0 || 1);
  const box = holeBox(L);
  const area = (box.x1 - box.x0) * (box.z1 - box.z0);
  const open = openness(L);
  const out = { heather: [], gorse: [], rocks: [], flowers: [], reeds: [], stumps: [], bracken: [], fescue: [], lilies: [], boulders: [], stone: stoneOf(seed) };
  const room = (list, x, z, gap) => !list.some((p) => Math.abs(p[0] - x) < gap && Math.abs(p[1] - z) < gap && Math.hypot(p[0] - x, p[1] - z) < gap);
  const spot = () => [box.x0 + rand() * (box.x1 - box.x0), box.z0 + rand() * (box.z1 - box.z0)];

  // Heather: patches, more of them the more open the hole.
  const patches = [];
  const wantPatches = Math.round(Math.min(10, area / 2500) * (0.2 + 0.8 * open));
  for (let tries = 0; tries < wantPatches * 14 && patches.length < wantPatches; tries++) {
    const [x, z] = spot();
    const size = 2 + rand() * 4;
    const kind = ["blob", "bean", "cluster", "streak"][Math.floor(rand() * 4)];
    const parts = patchParts(kind, x, z, size, rand);
    const reach = Math.max(...parts.map((p) => Math.hypot(p.x - x, p.z - z) + Math.max(p.rx, p.rz) * 1.4));
    if (patches.some((p) => Math.hypot(p.x - x, p.z - z) < p.reach + reach + 3)) continue;
    if (!clearOf(lieAt, x, z, DRESSING_CLEAR.heather, reach)) continue;
    patches.push({ x, z, reach, parts });
    // Filled with clumps about 0.7 m apart, jittered.
    for (let gx = x - reach; gx <= x + reach; gx += 0.7) {
      for (let gz = z - reach; gz <= z + reach; gz += 0.7) {
        const px = gx + (rand() - 0.5) * 0.5;
        const pz = gz + (rand() - 0.5) * 0.5;
        // Thinning out over its last metre, so its edge is ragged.
        const depth = depthInParts(parts, px, pz);
        if (out.heather.length >= LIMITS.heather || depth < 0 || (depth < 1 && rand() > depth) || !DRESSES.has(lieAt(px, pz))) continue;
        out.heather.push([r2(px), r2(pz), r2(0.35 + rand() * 0.35), r2(rand() * Math.PI * 2)]);
      }
    }
  }

  yield "the heather";
  // Gorse: at the edge of a patch of heather now and then, and in clumps
  // of its own in the deep rough.
  // (Not in a tree or a bush: a tree's trunk, or a bush's middle, stands
  // at [x, z] of each of L.trees.)
  const trees = L.trees ?? [];
  const byTree = (x, z, r) => trees.some((t) => Math.abs(t[0] - x) < r && Math.abs(t[1] - z) < r && Math.hypot(t[0] - x, t[1] - z) < r);
  const addGorse = (x, z) => {
    const s = 0.6 + rand() * 0.7;
    if (out.gorse.length >= LIMITS.gorse || byTree(x, z, s + 2.2) || !room(out.gorse, x, z, s * 2.2) || !clearOf(lieAt, x, z, DRESSING_CLEAR.gorse, s)) return;
    out.gorse.push([r2(x), r2(z), r2(s), r2(rand() * Math.PI * 2)]);
  };
  for (const p of patches) {
    if (rand() > 0.6) continue;
    const a = rand() * Math.PI * 2;
    const n = 1 + Math.floor(rand() * 3);
    for (let i = 0; i < n; i++) addGorse(p.x + Math.cos(a) * (p.reach + 0.5 + i * 1.6), p.z + Math.sin(a) * (p.reach + 0.5) + (rand() - 0.5) * 2);
  }
  const wantClumps = Math.round(2 + 5 * open);
  for (let c = 0, tries = 0; c < wantClumps && tries < 60; tries++) {
    const [x, z] = spot();
    if (lieAt(x, z) !== "deep" && lieAt(x, z) !== "rough") continue;
    c++;
    const n = 1 + Math.floor(rand() * 4);
    for (let i = 0; i < n; i++) addGorse(x + (rand() - 0.5) * 4, z + (rand() - 0.5) * 4);
  }

  // Rocks: a few, alone or in twos and threes.
  const wantRocks = Math.round(Math.min(LIMITS.rocks, area / 1200) * (0.4 + 0.6 * rand()));
  for (let tries = 0; tries < 80 && out.rocks.length < wantRocks; tries++) {
    const [x, z] = spot();
    const n = rand() < 0.6 ? 1 : 2 + Math.floor(rand() * 2);
    for (let i = 0; i < n; i++) {
      const px = x + (i ? (rand() - 0.5) * 2.5 : 0);
      const pz = z + (i ? (rand() - 0.5) * 2.5 : 0);
      const s = (i ? 0.15 : 0.25) + rand() * rand() * 0.6;
      if (out.rocks.length < LIMITS.rocks && !byTree(px, pz, s + 1) && room(out.rocks, px, pz, s + 0.4) && clearOf(lieAt, px, pz, DRESSING_CLEAR.rocks, s)) {
        out.rocks.push([r2(px), r2(pz), r2(s), r2(rand() * Math.PI * 2)]);
      }
    }
  }

  // Wildflowers: patches a few metres across, each mostly one colour,
  // thicker in the middle.
  const wantFlowers = Math.round(Math.min(12, area / 1800));
  for (let f = 0, tries = 0; f < wantFlowers && tries < wantFlowers * 10; tries++) {
    const [x, z] = spot();
    const r = 1.5 + rand() * 2.5;
    if (!clearOf(lieAt, x, z, DRESSING_CLEAR.flowers, r)) continue;
    f++;
    const main = Math.floor(rand() * FLOWER_COLOURS.length);
    const other = Math.floor(rand() * FLOWER_COLOURS.length);
    const n = Math.round(r * r * 3);
    for (let i = 0; i < n && out.flowers.length < LIMITS.flowers; i++) {
      const a = rand() * Math.PI * 2;
      const d = r * Math.sqrt(rand()) * (0.6 + 0.4 * rand());
      const px = x + Math.cos(a) * d;
      const pz = z + Math.sin(a) * d * 0.8;
      if (!DRESSES.has(lieAt(px, pz))) continue;
      out.flowers.push([r2(px), r2(pz), r2(0.6 + rand() * 0.6), r2(rand() * Math.PI), rand() < 0.8 ? main : other]);
    }
  }

  yield "the gorse, rocks and flowers";
  // Reeds: on the water at its edge, in runs (smooth noise along the
  // bank) - not against a wall, nor anywhere near play.
  const walls = (L.water ?? []).filter((w) => w.wall || w.walls);
  const step = 0.9;
  // (A step every few rows of a big pond's: each spot on the water asks
  // the ground round it a hundred times over.)
  let rows = 0;
  for (const b of (L.water ?? []).map(waterBounds)) {
    for (let x = b.x0; x <= b.x1 && out.reeds.length < LIMITS.reeds; x += step) {
      if (++rows % 8 === 0) yield "the reeds";
      for (let z = b.z0; z <= b.z1 && out.reeds.length < LIMITS.reeds; z += step) {
        const px = x + (rand() - 0.5) * step;
        const pz = z + (rand() - 0.5) * step;
        if (lieAt(px, pz) !== "water") continue;
        if (wobble(seed & 0xffff, px * 0.7 + pz * 0.3, 7) < 0.45) continue;
        let bank = false;
        for (let k = 0; k < 8 && !bank; k++) {
          const a = (k / 8) * Math.PI * 2;
          bank = REED_BANK.has(lieAt(px + Math.cos(a) * REED_REACH, pz + Math.sin(a) * REED_REACH));
        }
        if (!bank) continue;
        if (walls.some((w) => wallDistance(w, px, pz, 3) < 3)) continue;
        let near = false;
      for (const [lie, r] of Object.entries(REED_CLEAR)) {
        for (let d = 1; d <= r + 0.01 && !near; d += 1) {
          for (let k = 0; k < 12 && !near; k++) {
            const a = (k / 12) * Math.PI * 2;
            near = lieAt(px + Math.cos(a) * d, pz + Math.sin(a) * d) === lie;
          }
        }
        if (near) break;
      }
      if (near) continue;
        if (!room(out.reeds, px, pz, 0.5)) continue;
        out.reeds.push([r2(px), r2(pz), r2(0.8 + rand() * 0.7), r2(rand() * Math.PI)]);
      }
    }
  }
  marshReeds(out, L, lieAt, seed, walls);
  yield "the reeds";
  yield* moreDressing(out, L, lieAt, seed, { box, open, spot: null });
  return out;
}

// The newer dressing, from a randomness of its own so none of the above
// moves for it: every rock's shape; a few feature boulders by the tees;
// stumps and fallen logs; bracken at the woods' edges; fescue on an open
// hole; lily pads in calm shallows.
function* moreDressing(out, L, lieAt, seed, { box, open }) {
  const rand = seeded((seed ^ 0x5707e) >>> 0 || 1);
  const spot = () => [box.x0 + rand() * (box.x1 - box.x0), box.z0 + rand() * (box.z1 - box.z0)];
  const room = (list, x, z, gap) => !list.some((p) => Math.hypot(p[0] - x, p[1] - z) < gap);
  const trees = L.trees ?? [];
  const byTree = (x, z, r) => trees.some((t) => Math.abs(t[0] - x) < r && Math.abs(t[1] - z) < r && Math.hypot(t[0] - x, t[1] - z) < r);
  for (const r of out.rocks) r.push(Math.floor(rand() * ROCK_SHAPES.length));
  // Feature boulders by the tees (the tee at the hole's origin): off to
  // one side or the other, 9 - 16 m out.
  for (let i = 0, tries = 0; i < 2 + Math.floor(rand() * 3) && tries < 30; tries++) {
    const x = -6 + rand() * 30;
    const z = (rand() < 0.5 ? -1 : 1) * (10 + rand() * 7);
    const s = 0.8 + rand() * 0.5;
    if (out.boulders.length >= LIMITS.boulders || byTree(x, z, s + 1.5) || !room(out.rocks, x, z, s + 1.5) || !room(out.boulders, x, z, s + 2) || !clearOf(lieAt, x, z, DRESSING_CLEAR.rocks, s)) continue;
    out.boulders.push([r2(x), r2(z), r2(s), r2(rand() * Math.PI * 2), rand() < 0.5 ? 0 : 2]);
    i++;
  }
  // Stumps and fallen logs: [x, z, size, turn, log (1) or stump (0)].
  const wantStumps = Math.round(3 + rand() * 6);
  for (let tries = 0; tries < 60 && out.stumps.length < Math.min(LIMITS.stumps, wantStumps); tries++) {
    const [x, z] = spot();
    const log = rand() < 0.45;
    const s = log ? 0.8 + rand() * 0.6 : 0.5 + rand() * 0.4;
    const reach = log ? s * 2.2 : s * 0.5;
    if (byTree(x, z, reach + 0.8) || !room(out.stumps, x, z, 4) || !room(out.rocks, x, z, reach + 1) || !clearOf(lieAt, x, z, DRESSING_CLEAR.stumps, reach)) continue;
    out.stumps.push([r2(x), r2(z), r2(s), r2(rand() * Math.PI * 2), log ? 1 : 0]);
  }
  yield "the boulders, stumps and logs";
  // Bracken: drifts in the rough where the woods begin - a tree within 9 m.
  const wantDrifts = Math.round(4 + rand() * 6);
  for (let d = 0, tries = 0; d < wantDrifts && tries < 90 && out.bracken.length < LIMITS.bracken; tries++) {
    const [x, z] = spot();
    const r = 2 + rand() * 3;
    if (!byTree(x, z, 9) || byTree(x, z, 1.5) || !clearOf(lieAt, x, z, DRESSING_CLEAR.bracken, r)) continue;
    d++;
    // Its fronds green to russet, the drift mostly one or the other.
    const russet = rand();
    const n = Math.round(r * r * 2.4);
    for (let i = 0; i < n && out.bracken.length < LIMITS.bracken; i++) {
      const a = rand() * Math.PI * 2;
      const dd = r * Math.sqrt(rand());
      const px = x + Math.cos(a) * dd;
      const pz = z + Math.sin(a) * dd * 0.8;
      if (!DRESSES.has(lieAt(px, pz)) || byTree(px, pz, 0.8)) continue;
      out.bracken.push([r2(px), r2(pz), r2(0.7 + rand() * 0.5), r2(rand() * Math.PI * 2), r2(Math.min(1, Math.max(0, russet + (rand() - 0.5) * 0.3)))]);
    }
  }
  yield "the bracken";
  // Fescue: on an open hole, clumps of long grass with golden seed heads.
  if (open > 0.3) {
    const wantPatches = Math.round(open * 12);
    for (let f = 0, tries = 0; f < wantPatches && tries < 100 && out.fescue.length < LIMITS.fescue; tries++) {
      const [x, z] = spot();
      const r = 3 + rand() * 4;
      if (!clearOf(lieAt, x, z, DRESSING_CLEAR.fescue, r)) continue;
      f++;
      const n = Math.round(r * r * 1.8);
      for (let i = 0; i < n && out.fescue.length < LIMITS.fescue; i++) {
        const a = rand() * Math.PI * 2;
        const dd = r * Math.sqrt(rand());
        const px = x + Math.cos(a) * dd;
        const pz = z + Math.sin(a) * dd;
        if (!DRESSES.has(lieAt(px, pz))) continue;
        out.fescue.push([r2(px), r2(pz), r2(0.6 + rand() * 0.5), r2(rand() * Math.PI)]);
      }
    }
  }
  yield "the fescue";
  // Lily pads: on the water 1.5 - 5 m from a grassy bank, in a few rafts,
  // not by a wall nor anywhere near play (as reeds are).
  const walls = (L.water ?? []).filter((w) => w.wall || w.walls);
  // (Designed holes only: a mapped pond's level comes from its ground.)
  for (const w of L.source === "map" ? [] : (L.water ?? [])) {
    const level = r2(pondLevel(L, w));
    const b = waterBounds(w);
    const rafts = 1 + Math.floor(rand() * 3);
    for (let k = 0, tries = 0; k < rafts && tries < 120 && out.lilies.length < LIMITS.lilies; tries++) {
      const x = b.x0 + rand() * (b.x1 - b.x0);
      const z = b.z0 + rand() * (b.z1 - b.z0);
      if (!calmShallow(lieAt, x, z) || walls.some((wl) => wallDistance(wl, x, z, 4) < 4)) continue;
      if (["green", "fringe", "tee", "path"].some((lie) => nearLie(lieAt, x, z, 8, lie)) || nearLie(lieAt, x, z, 4, "fairway")) continue;
      k++;
      const n = 5 + Math.floor(rand() * 10);
      for (let i = 0; i < n && out.lilies.length < LIMITS.lilies; i++) {
        const px = x + (rand() - 0.5) * 3;
        const pz = z + (rand() - 0.5) * 3;
        if (!calmShallow(lieAt, px, pz) || !room(out.lilies, px, pz, 0.45)) continue;
        // [x, z, size, turn, flower: 0 none, 1 cream, 2 pink]
        const fl = rand();
        out.lilies.push([r2(px), r2(pz), r2(0.25 + rand() * 0.2), r2(rand() * Math.PI * 2), fl < 0.7 ? 0 : fl < 0.87 ? 1 : 2, level]);
      }
    }
  }
}

// On the water, with grassy bank 1.5 - 5 m away (and no nearer).
function calmShallow(lieAt, x, z) {
  if (lieAt(x, z) !== "water") return false;
  for (const d of [1.5, 5]) {
    let bank = false;
    for (let k = 0; k < 8 && !bank; k++) {
      const a = (k / 8) * Math.PI * 2;
      bank = REED_BANK.has(lieAt(x + Math.cos(a) * d, z + Math.sin(a) * d));
    }
    if (d === 1.5 && bank) return false;
    if (d === 5 && !bank) return false;
  }
  return true;
}
function nearLie(lieAt, x, z, r, lie) {
  for (let d = 1; d <= r; d += 1.5) for (let k = 0; k < 12; k++) if (lieAt(x + Math.cos((k / 12) * Math.PI * 2) * d, z + Math.sin((k / 12) * Math.PI * 2) * d) === lie) return true;
  return false;
}

// Dressing for the edges of the range and the practice greens, which have
// no layout of their own: the same kinds, placed in the places given.
//   lieAt(x, z): "rough" where it may stand, "water" in a pond, anything
//     else where it may not (hole frame, as roughDressing's)
//   zones: [{ x0, x1, z0, z1 }] boxes to scatter in
//   ponds: [{ x0, x1, z0, z1, level }] boxes round lieAt's water, to edge
//     with reeds and lily pads (level: the water's height)
//   trees: [x, z] trunks to keep off
// Returns the same lists as roughDressing.
export function edgeDressing({ lieAt, zones, trees = [], seed = 1, heather = 6, gorse = 5, rocks = 10, flowers = 5, ponds = [] }) {
  const rand = seeded((seed ^ 0xed9e) >>> 0 || 1);
  const out = { heather: [], gorse: [], rocks: [], flowers: [], reeds: [], stumps: [], bracken: [], fescue: [], lilies: [], boulders: [], stone: stoneOf(seed) };
  const area = zones.reduce((a, z) => a + (z.x1 - z.x0) * (z.z1 - z.z0), 0);
  const spot = () => {
    let pick = rand() * area;
    const zn = zones.find((z) => (pick -= (z.x1 - z.x0) * (z.z1 - z.z0)) < 0) ?? zones[0];
    return [zn.x0 + rand() * (zn.x1 - zn.x0), zn.z0 + rand() * (zn.z1 - zn.z0)];
  };
  const ok = (x, z, r) => lieAt(x, z) === "rough" && !trees.some((t) => Math.hypot(t[0] - x, t[1] - z) < r + 1.2) && [0, 1, 2, 3, 4, 5].every((k) => lieAt(x + Math.cos(k) * r, z + Math.sin(k) * r) === "rough");
  const room = (list, x, z, gap) => !list.some((p) => Math.hypot(p[0] - x, p[1] - z) < gap);
  for (let p = 0, tries = 0; p < heather && tries < heather * 10; tries++) {
    const [x, z] = spot();
    const r = 1.5 + rand() * 2.5;
    if (!ok(x, z, r)) continue;
    p++;
    for (let gx = x - r; gx <= x + r; gx += 0.7) {
      for (let gz = z - r; gz <= z + r; gz += 0.7) {
        const px = gx + (rand() - 0.5) * 0.5;
        const pz = gz + (rand() - 0.5) * 0.5;
        const depth = r * (0.8 + 0.3 * Math.sin(Math.atan2(pz - z, px - x) * 3 + x)) - Math.hypot(px - x, pz - z);
        if (depth < 0 || (depth < 1 && rand() > depth) || out.heather.length >= LIMITS.heather) continue;
        out.heather.push([r2(px), r2(pz), r2(0.35 + rand() * 0.35), r2(rand() * Math.PI * 2)]);
      }
    }
    if (rand() < 0.6 && out.gorse.length < gorse * 3) {
      const a = rand() * Math.PI * 2;
      const gx = x + Math.cos(a) * (r + 0.8);
      const gz = z + Math.sin(a) * (r + 0.8);
      if (ok(gx, gz, 1)) out.gorse.push([r2(gx), r2(gz), r2(0.6 + rand() * 0.6), r2(rand() * Math.PI * 2)]);
    }
  }
  for (let c = 0, tries = 0; c < gorse && tries < gorse * 10; tries++) {
    const [x, z] = spot();
    if (!ok(x, z, 2)) continue;
    c++;
    const n = 1 + Math.floor(rand() * 3);
    for (let i = 0; i < n; i++) {
      const gx = x + (rand() - 0.5) * 4;
      const gz = z + (rand() - 0.5) * 4;
      const s = 0.6 + rand() * 0.7;
      if (ok(gx, gz, s) && room(out.gorse, gx, gz, s * 2.2)) out.gorse.push([r2(gx), r2(gz), r2(s), r2(rand() * Math.PI * 2)]);
    }
  }
  for (let tries = 0; tries < rocks * 8 && out.rocks.length < rocks; tries++) {
    const [x, z] = spot();
    const s = 0.2 + rand() * rand() * 0.8;
    if (ok(x, z, s + 0.5) && room(out.rocks, x, z, s + 1)) out.rocks.push([r2(x), r2(z), r2(s), r2(rand() * Math.PI * 2), Math.floor(rand() * ROCK_SHAPES.length)]);
  }
  for (let f = 0, tries = 0; f < flowers && tries < flowers * 10; tries++) {
    const [x, z] = spot();
    const r = 1.5 + rand() * 2;
    if (!ok(x, z, r)) continue;
    f++;
    const main = Math.floor(rand() * FLOWER_COLOURS.length);
    for (let i = 0; i < Math.round(r * r * 3) && out.flowers.length < LIMITS.flowers; i++) {
      const a = rand() * Math.PI * 2;
      const d = r * Math.sqrt(rand());
      const px = x + Math.cos(a) * d;
      const pz = z + Math.sin(a) * d;
      if (lieAt(px, pz) === "rough") out.flowers.push([r2(px), r2(pz), r2(0.6 + rand() * 0.6), r2(rand() * Math.PI), main]);
    }
  }
  // Reeds round a pond's edge, and a raft or two of lily pads.
  for (const b of ponds) {
    for (let x = b.x0; x <= b.x1; x += 0.9) {
      for (let z = b.z0; z <= b.z1; z += 0.9) {
        const px = x + (rand() - 0.5) * 0.9;
        const pz = z + (rand() - 0.5) * 0.9;
        if (lieAt(px, pz) !== "water" || out.reeds.length >= LIMITS.reeds) continue;
        if (wobble(seed & 0xffff, px * 0.7 + pz * 0.3, 7) < 0.45) continue;
        let bank = false;
        for (let k = 0; k < 8 && !bank; k++) bank = lieAt(px + Math.cos(k) * REED_REACH, pz + Math.sin(k) * REED_REACH) === "rough";
        if (bank) out.reeds.push([r2(px), r2(pz), r2(0.8 + rand() * 0.7), r2(rand() * Math.PI)]);
      }
    }
    for (let k = 0, tries = 0; k < 2 && tries < 40; tries++) {
      const x = b.x0 + rand() * (b.x1 - b.x0);
      const z = b.z0 + rand() * (b.z1 - b.z0);
      if (lieAt(x, z) !== "water" || [0, 1, 2, 3, 4, 5].some((a) => lieAt(x + Math.cos(a) * 1.5, z + Math.sin(a) * 1.5) !== "water")) continue;
      k++;
      for (let i = 0; i < 10; i++) {
        const px = x + (rand() - 0.5) * 3;
        const pz = z + (rand() - 0.5) * 3;
        if (lieAt(px, pz) !== "water" || !room(out.lilies, px, pz, 0.45)) continue;
        const fl = rand();
        out.lilies.push([r2(px), r2(pz), r2(0.25 + rand() * 0.2), r2(rand() * Math.PI * 2), fl < 0.7 ? 0 : fl < 0.87 ? 1 : 2, b.level]);
      }
    }
  }
  return out;
}

// The box round a pond or lake - mapped (its outline) or designed (a blob,
// whose bulges reach past its radii).
// A wetland edge's reeds (sim/hazardshapes.mjs marshAt): thick across the
// marsh on a lake's far shore, out over its shallows - most where it's
// most marsh - kept off a wall and play as every reed is; up to MARSH_REEDS
// more, from a randomness of their own.
export const MARSH_REEDS = 280;
function marshReeds(out, L, lieAt, seed, walls) {
  const rand = seeded((seed ^ 0x3a25) >>> 0 || 1);
  const room = (list, x, z, gap) => !list.some((p) => Math.abs(p[0] - x) < gap && Math.abs(p[1] - z) < gap && Math.hypot(p[0] - x, p[1] - z) < gap);
  let n = 0;
  for (const w of (L.water ?? []).filter((q) => q.marsh)) {
    const b = waterBounds(w);
    const step = 0.75;
    for (let x = b.x0; x <= b.x1 && n < MARSH_REEDS; x += step) {
      for (let z = b.z0; z <= b.z1 && n < MARSH_REEDS; z += step) {
        const px = x + (rand() - 0.5) * step;
        const pz = z + (rand() - 0.5) * step;
        const keep = rand();
        if (lieAt(px, pz) !== "water") continue;
        const k = marshAt(w, px, pz, insideDepth(w, px, pz));
        if (keep > k * 0.8) continue;
        if (walls.some((q) => wallDistance(q, px, pz, 3) < 3) || nearPlay(lieAt, px, pz)) continue;
        if (!room(out.reeds, px, pz, 0.45)) continue;
        out.reeds.push([r2(px), r2(pz), r2(0.9 + rand() * 0.8), r2(rand() * Math.PI)]);
        n++;
      }
    }
  }
}

// Whether a reed at (x, z) would be near play (REED_CLEAR).
function nearPlay(lieAt, px, pz) {
  for (const [lie, r] of Object.entries(REED_CLEAR)) {
    for (let d = 1; d <= r + 0.01; d += 1) {
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        if (lieAt(px + Math.cos(a) * d, pz + Math.sin(a) * d) === lie) return true;
      }
    }
  }
  return false;
}

function waterBounds(w) {
  if (w.poly?.length) {
    const xs = w.poly.map((p) => p[0]);
    const zs = w.poly.map((p) => p[1]);
    return {
      x0: Math.min(...xs) - 1,
      x1: Math.max(...xs) + 1,
      z0: Math.min(...zs) - 1,
      z1: Math.max(...zs) + 1,
    };
  }
  const r = Math.max(w.rx ?? 0, w.rz ?? 0) * 1.6 + 2;
  return { x0: w.x - r, x1: w.x + r, z0: w.z - r, z1: w.z + r };
}
