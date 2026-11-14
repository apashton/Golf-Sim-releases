// A hole's signature tree (the owner, 10 November 2026: "go for it on
// trees, new kinds and signature"): on about two designed holes in five, a
// big lone specimen - a spreading oak, a cedar of Lebanon, a beech or a
// horse chestnut - standing in play: at the corner of the drive's landing
// area (the inside of a dogleg), its crown just over the fairway's edge, or
// beside the approach short of the green. Nothing else grows under it.
//
// Worked out from the hole as designed (its line, fairway, green, sand,
// water, paths and seed), so it stands in the same spot every time; put in
// with the hole's made trees where they're kept off the other holes' play
// (sim/treeclear.mjs clearedLayout) - one that would reach another hole's
// isn't there. A hole of trees grown as they first grew (sim/treelock.mjs)
// keeps them as they were: a signature tree comes with a hole grown
// afresh. The hole editor can take it away (an edit { k: "sig", on: 0 }).
// Pure, for the tests.

import { makePath, pointAt, nearest, surfaceAt, insideBlob, blobRadius, fairwayHalfWidth } from "./course.mjs";
import { KIND } from "./treeshapes.mjs";
import { TREE_KINDS } from "./lidartrees.mjs";
import { gapToPaths } from "./paths.mjs";
import { hashNumbers, seededRand } from "./treehits.mjs";

// share: how many designed holes have one; kinds: which, how often; size:
// its scale (a big old tree); width: its spread against its height;
// landing: how far down the hole a long hole's drive lands (metres, or
// this share of its length if less); short: how far short of the green's
// middle an approach one stands; clear: no made tree within this of its
// crown's edge (metres).
export const SIGNATURE = {
  share: 0.4,
  kinds: [
    ["oak", 0.4],
    ["cedar", 0.25],
    ["beech", 0.2],
    ["chestnut", 0.15],
  ],
  size: [1.25, 1.5],
  width: 1.1,
  landing: { most: 235, share: 0.62 },
  short: [28, 42],
  clear: 3,
};

// The lies it may stand on, and those its crown mustn't reach over.
const STANDS_ON = new Set(["rough", "deep", "semi", "trees"]);
const NOT_UNDER = new Set(["green", "tee", "bunker", "water", "path"]);

// How far a tree's crown reaches (its kind's, at its scale and spread).
export const signatureReach = ([, , s = 1, kind, w = 1]) => (TREE_KINDS[kind]?.radius ?? 5) * s * w;

// The hole's signature tree, [x, z, scale, kind, spread] in its frame - or
// null: not this hole (a links hole, a hole from a map, a hole of no trees,
// one in three by its seed), or nowhere fair to stand.
export function signatureTree(L) {
  if (!L?.path?.length || L.path.length < 2 || L.links || L.source === "map" || !(L.trees?.length >= 12)) return null;
  if ((L.edits ?? []).some((e) => e?.k === "sig" && e.on === 0)) return null;
  const end = L.path[L.path.length - 1];
  const rand = seededRand(hashNumbers([L.number ?? 0, L.par ?? 4, L.yards ?? 0, end[0], end[1]]) ^ 0x5e9a7);
  if (rand() >= SIGNATURE.share) return null;
  const pick = rand();
  let acc = 0;
  let name = SIGNATURE.kinds[0][0];
  for (const [k, w] of SIGNATURE.kinds) {
    acc += w;
    if (pick < acc) {
      name = k;
      break;
    }
  }
  const kind = KIND[name];
  const size = Math.round((SIGNATURE.size[0] + rand() * (SIGNATURE.size[1] - SIGNATURE.size[0])) * 100) / 100;
  const tree = (x, z) => [Math.round(x * 100) / 100, Math.round(z * 100) / 100, size, kind, SIGNATURE.width];
  const reach = signatureReach([0, 0, size, kind, SIGNATURE.width]);
  const path = makePath(L.path);
  const sideRand = rand() < 0.5 ? -1 : 1;
  const lateRand = rand();
  // Where it may stand: on grass, not over the green, a tee, sand, water or
  // a path - its crown's edge too - and off the cart paths.
  const fair = (x, z) => {
    if (!STANDS_ON.has(surfaceAt(L, x, z, path))) return false;
    for (let a = 0; a < 8; a++) {
      const px = x + Math.cos((a / 8) * Math.PI * 2) * reach * 0.8;
      const pz = z + Math.sin((a / 8) * Math.PI * 2) * reach * 0.8;
      if (NOT_UNDER.has(surfaceAt(L, px, pz, path))) return false;
    }
    if (insideBlob(L.green, x, z, reach + 6)) return false;
    if ((L.paths?.length ?? 0) && gapToPaths(L.paths, x, z, reach) <= reach * 0.5) return false;
    // Nor so near the tee it blocks the drive.
    return Math.hypot(x, z) > 60;
  };
  const tries = [];
  // At the corner of a long hole's landing area: the inside of its dogleg
  // (or a side of its own on a straight hole), its crown over the fairway's
  // edge by a metre or so.
  if ((L.par ?? 4) >= 4 && path.length > 220) {
    const s = Math.min(SIGNATURE.landing.most, path.length * SIGNATURE.landing.share);
    const before = pointAt(path, Math.max(0, s - 60)).dir;
    const after = pointAt(path, Math.min(path.length, s + 60)).dir;
    const turn = before[0] * after[1] - before[1] * after[0];
    const dogleg = Math.abs(turn) > 0.08;
    // (A dogleg's inside only; a straight hole's either side, its own
    // first.)
    for (const side of dogleg ? [Math.sign(turn)] : [sideRand, -sideRand]) {
      for (const ds of [0, 15, -15, 30, -30]) {
        const p = pointAt(path, s + ds);
        const half = L.fairway ? fairwayHalfWidth(L.fairway, s + ds, side) : 14;
        const out = (half || 14) + reach - 1.2;
        tries.push([p.p[0] - p.dir[1] * out * side, p.p[1] + p.dir[0] * out * side]);
      }
    }
  }
  // Beside the approach, short of the green, out to a side.
  const g = L.green;
  if (g) {
    const gr = g.poly ? Math.max(...g.poly.map(([x, z]) => Math.hypot(x - g.x, z - g.z))) : blobRadius(g, 0);
    for (const k of [lateRand, 1 - lateRand]) {
      const short = SIGNATURE.short[0] + k * (SIGNATURE.short[1] - SIGNATURE.short[0]);
      const s = Math.max(0, nearest(path, g.x, g.z).s - short);
      const p = pointAt(path, s);
      for (const side of [sideRand, -sideRand]) {
        const out = Math.max(gr + 4, (L.fairway ? fairwayHalfWidth(L.fairway, s, side) : 12) || 12) + reach * 0.75;
        tries.push([p.p[0] - p.dir[1] * out * side, p.p[1] + p.dir[0] * out * side]);
      }
    }
  }
  for (const [x, z] of tries) if (fair(x, z)) return tree(x, z);
  return null;
}

// A hole's made trees with its signature tree among them (sig: what
// signatureTree gave), and none of the others under its crown or within
// SIGNATURE.clear of it - a lone specimen. The trees as given, if none.
export function withSignature(trees, sig) {
  if (!sig) return trees;
  const r = signatureReach(sig) + SIGNATURE.clear;
  return [...trees.filter((t) => t[3] != null || Math.hypot(t[0] - sig[0], t[1] - sig[1]) > r), sig];
}
