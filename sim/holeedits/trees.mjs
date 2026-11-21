// Hand edits to a hole (sim/holeedits.mjs): trees - where one may stand,
// those near a spot, a clump planted at once.

import { makePath, nearest } from "../course.mjs";
import { insidePolygon, distanceToEdge } from "../terrain.mjs";
import { TREE_KINDS } from "../lidartrees.mjs";
import { gapToPaths, TREE_GAP } from "../paths.mjs";
import { TREE_GREEN, TREE_LINE, TREE_TEE, r2 } from "./common.mjs";
import { inBox, insideDepth, shapeBounds } from "./shapes.mjs";
import { clearOfCauseways } from "../causeway.mjs";

// ---- Trees -------------------------------------------------------------------------

// How far a tree's crown reaches, metres: a real (LiDAR) tree as wide as it
// was found, any other by its size.
export function crownOf(t) {
  const [, , s = 1, kind, width] = t;
  return kind != null && TREE_KINDS[kind] ? s * (width ?? 1) * TREE_KINDS[kind].radius : 2.8 * s;
}

// Can a tree stand here? Not on or right by a green, on a tee, in sand or
// water, down the middle of the hole (its line of play), on a cart path,
// or on or by an island green's causeway (sim/causeway.mjs). On its own
// fairway off the line, yes: a tactical tree.
export function treeSpotOk(L, x, z, path = makePath(L.path)) {
  if (Math.hypot(x, z) < TREE_TEE) return false;
  if ((L.tees ?? []).some((t) => insidePolygon(t, x, z))) return false;
  if (insideDepth(L.green, x, z) > -TREE_GREEN) return false;
  if ((L.greens ?? []).some((g) => insidePolygon(g, x, z) || distanceToEdge(g, x, z) < TREE_GREEN)) return false;
  if (L.bunkers.some((b) => inBox(shapeBounds(b, 1), x, z) && insideDepth(b, x, z) > -1)) return false;
  if (L.water.some((w) => inBox(shapeBounds(w, 1), x, z) && insideDepth(w, x, z) > -1)) return false;
  const n = nearest(path, x, z);
  if (Math.abs(n.d) < TREE_LINE && n.s > 0 && n.s < path.length) return false;
  // On its own fairway (off the line, above) a tree planted by hand is
  // the designer's tactical tree (the owner: "tactical trees on the hole's
  // own fairway should be allowed"); nothing made ever stands there.
  const r = L.region;
  if (r && !inBox(r, x, z)) return false;
  // Nor on or right by a cart path.
  if (L.paths?.length && gapToPaths(L.paths, x, z, TREE_GAP + 0.01) <= TREE_GAP) return false;
  return clearOfCauseways(L, x, z);
}

// Trees within `r` metres of a spot: their positions.
export function treesNear(L, x, z, r) {
  return L.trees.filter((t) => Math.hypot(t[0] - x, t[1] - z) <= r).map((t) => [t[0], t[1]]);
}

// A clump of trees planted with one dab of the brush: a few at a natural
// spacing and mixed sizes, on spots a tree may stand, clear of the trees
// already there (and of `also`, those planted earlier in the same stroke).
export function clumpAt(L, x, z, r, rand = Math.random, also = []) {
  const path = makePath(L.path);
  const gap = 4.5;
  const want = Math.max(1, Math.round((r * r) / 16));
  const placed = [];
  const clear = (px, pz) =>
    L.trees.every((t) => Math.hypot(t[0] - px, t[1] - pz) >= gap * 0.8) && [...also, ...placed].every((t) => Math.hypot(t[0] - px, t[1] - pz) >= gap);
  for (let k = 0; k < want * 8 && placed.length < want; k++) {
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand()) * r;
    const px = x + Math.cos(a) * d;
    const pz = z + Math.sin(a) * d;
    if (!clear(px, pz) || !treeSpotOk(L, px, pz, path)) continue;
    placed.push([r2(px), r2(pz), r2(0.75 + rand() * 0.6)]);
  }
  return placed;
}

// The index of the tree at a spot (within a few centimetres), skipping any
// already taken: -1 if none.
export function treeAt(trees, x, z, taken) {
  let best = -1;
  let bd = 0.08;
  for (let i = 0; i < trees.length; i++) {
    if (taken.has(i)) continue;
    const d = Math.abs(trees[i][0] - x) + Math.abs(trees[i][1] - z);
    if (d < bd) {
      bd = d;
      best = i;
    }
  }
  return best;
}
