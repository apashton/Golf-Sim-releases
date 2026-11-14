// The woods behind a designed hole's trees: forest from its back row of
// trees out into the country, so from the air a hole runs through woods
// rather than down an avenue of two or three rows with open ground behind
// (the owner: "Often the flyovers have channels of trees rather than
// expanding into forest"). Scenery only: it all stands past where a ball
// can finish, and none of it is met by a ball.
//
// Each hole grows its own, in its own frame from its own seed, so it's the
// same wood whichever hole is being played: the hole's own as far woods
// past its 3D trees (course.js), another hole's among the course's other
// holes seen from the air (sim/neighbours.mjs). Where two holes run side
// by side, each spot belongs to the hole it's nearest (by how far past its
// tree line it is), so the wood between them is grown once, and none
// stands on any hole's open ground. Thinner on a heath, none on a links
// hole (its long grass instead: buildHole's trees "none"). Pure.

import { makePath, nearest, insideBlob } from "./course.mjs";
import { KIND } from "./treeshapes.mjs";
import { lineDistance, valueNoise, hash2, smoothstep } from "./country.mjs";
import { treeStands } from "./treehits.mjs";
import { palettedTrees } from "./treepalette.mjs";

// Grid cells and bins by number rather than "a,b" text: looked up for
// every spot of the woods' grid, nine at a time - the same cells, none of
// the strings made (a cell's index stays well inside a million either way).
const cellKey = (a, b) => a * 2097152 + b;
const binKey = (k, sign) => k * 4 + (sign + 2);

export const DEEP_WOODS = {
  // From this far behind the hole's back row of trees, and never nearer
  // play than `lost` past its tree line (where a ball's lost).
  behind: 4,
  lost: 18,
  // Out to this far past the tree line, give or take `wander`, thinning
  // over the last `thin` metres into the country.
  depth: 120,
  wander: 45,
  thin: 45,
  // Trees this far apart on a grid, each jittered within its cell.
  spacing: 7.5,
  // Kept clear of another hole's open ground (its tree line) by this.
  clear: 8,
  // How full the wood is, by the hole's character (sim/country.mjs).
  fill: { woodland: 1, parkland: 0.9, lakeside: 0.85, heath: 0.5, links: 0, linksgreen: 0 },
  // Grown woodland trees: a little bigger than the hole's own on the whole.
  size: [1.1, 1.7],
  // No two nearer than this many metres a unit of the bigger one's size
  // (about three fifths of a crown's reach): the grid's jitter could put
  // two a metre and a half apart, one grown through the other (the
  // owner: "trees glitching through each other"; treehits.mjs
  // apartTrees for the hole's own).
  apart: 2.7,
};

// How far out from its line of play a hole's own trees reach, along it
// and on either side: (s, sign) -> metres - the furthest of its trees
// within a bin or so either way (L.trees, as it keeps them: moved by hand,
// cleared for a path), or `none` where it has none there.
export function backRows(L, path, { bin = 10, none = 30 } = {}) {
  const far = new Map();
  for (const t of L.trees ?? []) {
    const n = nearest(path, t[0], t[1]);
    const off = Math.abs(n.d);
    if (off < (L.treeLine ?? 40) - 4) continue;
    const key = binKey(Math.round(n.s / bin), n.d < 0 ? -1 : 1);
    far.set(key, Math.max(far.get(key) ?? 0, off));
  }
  const tl = L.treeLine ?? 40;
  return (s, sign) => {
    const b = Math.round(s / bin);
    let best = 0;
    for (let k = b - 1; k <= b + 1; k++) best = Math.max(best, far.get(binKey(k, sign)) ?? 0);
    return best || tl + none;
  };
}

// A hole's seed for its woods, from where its green is: the same however
// the hole is reached (played, or seen from another).
export function woodsSeed(L) {
  const g = L?.green ?? {};
  return ((Math.round((g.x ?? 0) * 10) * 31 + Math.round((g.z ?? 0) * 10)) ^ 0xdeed5) >>> 0;
}

// A hole's woods: [[x, z, size, kind?, ...], ...] in its own frame (trees as
// a layout keeps them, of no given kind but on a heath - sim/treehits.mjs
// treeForm picks), grown in stands as the hole's own trees are.
//   L          the hole's layout (designed: its path, treeLine, green,
//              water, trees; links: none)
//   character  its character (sim/country.mjs holeCharacter)
//   keepOff    trees already standing past its rows ([[x, z], ...]: its
//              backdrop's), which none crowds
//   others     the course's other holes in this hole's frame: [{ path,
//              open }] - their line and how far either side is open
//   toFrame    (x, z) -> [x, z]: where a spot of this hole is in the frame
//              `others` is given in (default: this hole's own)
//   stands     on a course, what the hole's own trees grow with
//              (sim/treepalette.mjs standsFor): its woods then in stands of
//              its kinds, as its trees near play are; else the old stands
export function deepWoods(L, { character = "parkland", others = [], toFrame = null, keepOff = [], stands = null } = {}) {
  const fill = DEEP_WOODS.fill[character] ?? DEEP_WOODS.fill.parkland;
  if (!L?.path?.length || L.links || !(fill > 0) || L.source === "map") return [];
  const paletted = Array.isArray(stands?.kinds) && stands.kinds.length > 0;
  const path = makePath(L.path);
  const treeLine = L.treeLine ?? 40;
  const back = backRows(L, path);
  const seed = woodsSeed(L);
  const s0 = seed % 100003;
  const crowded = new Set(keepOff.map(([x, z]) => cellKey(Math.floor(x / 8), Math.floor(z / 8))));
  const crowds = (x, z) => {
    const i = Math.floor(x / 8);
    const j = Math.floor(z / 8);
    for (let a = i - 1; a <= i + 1; a++) for (let b = j - 1; b <= j + 1; b++) if (crowded.has(cellKey(a, b))) return true;
    return false;
  };
  const reach = treeLine + DEEP_WOODS.depth + DEEP_WOODS.wander;
  // The holes it shares the country with: each line thinned, with its box.
  const near = others
    .filter((o) => o?.path?.length)
    .map((o) => {
      const line = o.path;
      const pad = o.open + reach;
      let x0 = Infinity;
      let x1 = -Infinity;
      let z0 = Infinity;
      let z1 = -Infinity;
      for (const [x, z] of line) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        z0 = Math.min(z0, z);
        z1 = Math.max(z1, z);
      }
      return { line, open: o.open, x0: x0 - pad, x1: x1 + pad, z0: z0 - pad, z1: z1 + pad };
    });
  let x0 = Infinity;
  let x1 = -Infinity;
  let z0 = Infinity;
  let z1 = -Infinity;
  for (const [x, z] of L.path) {
    x0 = Math.min(x0, x - reach);
    x1 = Math.max(x1, x + reach);
    z0 = Math.min(z0, z - reach);
    z1 = Math.max(z1, z + reach);
  }
  const step = DEEP_WOODS.spacing;
  const out = [];
  // Those kept, by grid cell, for keeping the next ones apart.
  const placed = new Map();
  const tooNear = (x, z, size, i, j) => {
    for (let a = i - 1; a <= i + 1; a++) {
      for (let b = j - 1; b <= j + 1; b++) {
        const q = placed.get(cellKey(a, b));
        if (q && Math.hypot(q[0] - x, q[1] - z) < DEEP_WOODS.apart * Math.max(size, q[2])) return true;
      }
    }
    return false;
  };
  for (let i = Math.floor(x0 / step); i <= Math.ceil(x1 / step); i++) {
    for (let j = Math.floor(z0 / step); j <= Math.ceil(z1 / step); j++) {
      const h = (k) => hash2(i * 3 + k, j * 5 - k, s0 ^ 0xd33b);
      const x = (i + 0.1 + 0.8 * h(1)) * step;
      const z = (j + 0.1 + 0.8 * h(2)) * step;
      const n = nearest(path, x, z);
      const off = Math.abs(n.d);
      if (off < treeLine) continue;
      // Behind the back row (round the green and the tee, past the end of
      // the line, the back row's reach there).
      const s = Math.max(0, Math.min(path.length, n.s));
      const sign = n.d < 0 ? -1 : 1;
      // (And never short of where a ball can be lost: 18 m past the tree
      // line, playReach's.)
      if (off < Math.max(back(s, sign), treeLine + DEEP_WOODS.lost) + DEEP_WOODS.behind) continue;
      // Its outer edge wanders in and out; it thins towards it.
      const edge = treeLine + DEEP_WOODS.depth + (valueNoise(x, z, 140, s0 ^ 0x0ede) - 0.5) * 2 * DEEP_WOODS.wander;
      if (off > edge) continue;
      let keep = fill * (1 - smoothstep(edge - DEEP_WOODS.thin, edge, off));
      // Clearings, and glades.
      const glade = valueNoise(x, z, 70, s0 ^ 0x61ade);
      if (glade < 0.2) keep *= 0.1;
      else keep *= smoothstep(0.2, 0.3, glade);
      if (h(3) >= keep) continue;
      // Apart from its neighbours - decided before the water, the trees out
      // there and the other holes take any away, so a tree grown beside
      // another hole is one this hole would grow alone.
      const size = DEEP_WOODS.size[0] + h(4) * (DEEP_WOODS.size[1] - DEEP_WOODS.size[0]);
      if (tooNear(x, z, size, i, j)) continue;
      placed.set(cellKey(i, j), [x, z, size]);
      if ((L.water ?? []).some((w) => insideBlob(w, x, z, 4)) || crowds(x, z)) continue;
      // The country's: not on another hole's open ground, and only where
      // this hole is the nearest.
      const [fx, fz] = toFrame ? toFrame(x, z) : [x, z];
      const mine = off - treeLine;
      let theirs = false;
      for (const o of near) {
        if (fx < o.x0 || fx > o.x1 || fz < o.z0 || fz > o.z1) continue;
        const past = lineDistance(o.line, fx, fz) - o.open;
        if (past < DEEP_WOODS.clear || past < mine) {
          theirs = true;
          break;
        }
      }
      if (theirs) continue;
      // On a heath, mostly Scots pines and birches (on a course, the
      // hole's kinds instead: palettedTrees, below).
      const kind = !paletted && character === "heath" ? (h(5) < 0.5 ? KIND.scots : h(5) < 0.8 ? KIND.birch : undefined) : undefined;
      out.push(kind == null ? [r2(x), r2(z), r2(size)] : [r2(x), r2(z), r2(size), kind]);
    }
  }
  return paletted ? palettedTrees(out, stands) : treeStands(out, seed);
}

const r2 = (v) => Math.round(v * 100) / 100;
