// Trees at a wood's edge (the owner's list, 5 November 2026: "trees at a
// wood's edge reaching out over the fairway"): a tree with the wood behind
// it and open ground in front grows towards the light, its crown fuller and
// reaching further on the open side. Which of a hole's trees stand so, and
// which way their open side is, from the trees round each - so it's worked
// out as the hole's trees grow (courseplay.mjs grownTrees: the same trees
// for the played hole and in every other hole's view of it), and each such
// tree carries it as an eleventh number (treehits.mjs treeForm), which its
// form then grows by (treehits.mjs EDGE_FORM), drawing and play alike.
//
// A tree is at a wood's edge when, among the trees within EDGE.near of it
// (at least EDGE.least of them, not counting bushes: a lone tree or two is
// open-grown all round), there's an open arc of at least EDGE.gap radians
// with none in it - its open side, the arc's middle - and:
//   - that side faces the hole's line of play (within EDGE.facing radians
//     of the way to the nearest point of it): the wood's edge along the
//     hole, not its back, out in the woods past it;
//   - it's open far out: no tree within EDGE.clear metres in a cone of
//     EDGE.cone radians either way of it (a tree in the second row sees
//     the first row past its near neighbours);
//   - and it isn't another hole's play ground (its layout's otherGround:
//     sim/treeclear.mjs, a fairway, green or tee) within EDGE.other metres
//     that way: a crown never reaches out over another hole.
// How much it's at the edge (0 - 1): by how wide its open arc is and how
// many trees stand behind it.
//
// Pure; positions in the hole's frame (x along the hole, z across).

import { insidePolygon } from "./terrain.mjs";
import { KIND } from "./treeshapes.mjs";

export const EDGE = { near: 18, least: 3, gap: 2.0, facing: 1.3, clear: 28, cone: 0.42, other: 14 };

const TAU = Math.PI * 2;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const round = (v, k) => Math.round(v * k) / k;

// The nearest point of a line [[x, z]...] to (x, z): [px, pz].
function nearestOn(path, x, z) {
  let best = null;
  let bd = Infinity;
  for (let i = 0; i < Math.max(1, path.length - 1); i++) {
    const [ax, az] = path[i];
    const [bx, bz] = path[i + 1] ?? path[i];
    const dx = bx - ax;
    const dz = bz - az;
    const l2 = dx * dx + dz * dz;
    const t = l2 > 0 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)) : 0;
    const px = ax + dx * t;
    const pz = az + dz * t;
    const d = (x - px) ** 2 + (z - pz) ** 2;
    if (d < bd) [bd, best] = [d, [px, pz]];
  }
  return best;
}

// For each of `trees` ([x, z, size, kind, ...]): null, or [the open side's
// way (radians, atan2 of z over x), how much it's at the edge (0 - 1)].
// path: the hole's line of play; otherGround: the other holes' ground near
// it ([{ lie, poly }]).
export function woodEdges(trees = [], { path = null, otherGround = [] } = {}) {
  const out = new Array(trees.length).fill(null);
  if (trees.length <= EDGE.least || !(path?.length >= 1)) return out;
  // (A bush - one planted by hand - makes no wood.)
  const solid = trees.map((t) => t[3] !== KIND.bush);
  // A grid of the trees, EDGE.near a square.
  const C = EDGE.near;
  const grid = new Map();
  trees.forEach((t, i) => {
    if (!solid[i]) return;
    const k = `${Math.floor(t[0] / C)},${Math.floor(t[1] / C)}`;
    if (grid.has(k)) grid.get(k).push(i);
    else grid.set(k, [i]);
  });
  const around = (x, z, r) => {
    const list = [];
    const n = Math.ceil(r / C);
    const gx = Math.floor(x / C);
    const gz = Math.floor(z / C);
    for (let a = gx - n; a <= gx + n; a++) for (let b = gz - n; b <= gz + n; b++) for (const j of grid.get(`${a},${b}`) ?? []) list.push(j);
    return list;
  };
  // (Each with the box round it: only those it might be in are walked.)
  const others = (otherGround ?? [])
    .filter((o) => o?.poly?.length > 2)
    .map(({ poly }) => {
      const xs = poly.map((p) => p[0]);
      const zs = poly.map((p) => p[1]);
      return { poly, x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) };
    });
  const onOthers = (near, x, z) => near.some((o) => x >= o.x0 && x <= o.x1 && z >= o.z0 && z <= o.z1 && insidePolygon(o.poly, x, z));
  trees.forEach((t, i) => {
    if (!solid[i]) return;
    const [x, z] = t;
    // Its neighbours' ways round it.
    const ways = [];
    for (const j of around(x, z, EDGE.near)) {
      if (j === i) continue;
      const dx = trees[j][0] - x;
      const dz = trees[j][1] - z;
      const d = Math.hypot(dx, dz);
      if (d > 0.3 && d <= EDGE.near) ways.push(Math.atan2(dz, dx));
    }
    if (ways.length < EDGE.least) return;
    ways.sort((a, b) => a - b);
    // The way to the line of play.
    const p = nearestOn(path, x, z);
    const toLine = Math.atan2(p[1] - z, p[0] - x);
    // The open arc the line of play is seen across, if any.
    let open = null;
    for (let k = 0; k < ways.length; k++) {
      const from = ways[k];
      const to = k + 1 < ways.length ? ways[k + 1] : ways[0] + TAU;
      const width = to - from;
      if (width < EDGE.gap) continue;
      const mid = from + width / 2;
      if (Math.abs(wrap(toLine - mid)) > Math.min(EDGE.facing, width / 2)) continue;
      if (!open || width > open.width) open = { mid: wrap(mid), width };
    }
    if (!open) return;
    // Open far out that way.
    for (const j of around(x, z, EDGE.clear)) {
      if (j === i) continue;
      const dx = trees[j][0] - x;
      const dz = trees[j][1] - z;
      const d = Math.hypot(dx, dz);
      if (d > 0.3 && d <= EDGE.clear && Math.abs(wrap(Math.atan2(dz, dx) - open.mid)) <= EDGE.cone) return;
    }
    // Not out over another hole.
    const R = EDGE.other;
    const near = others.filter((o) => o.x1 >= x - R && o.x0 <= x + R && o.z1 >= z - R && o.z0 <= z + R);
    for (let d = 1; near.length && d <= R; d += 1) {
      for (const q of [-0.5, 0, 0.5]) {
        if (onOthers(near, x + Math.cos(open.mid + q) * d, z + Math.sin(open.mid + q) * d)) return;
      }
    }
    const wide = Math.min(1, (open.width - EDGE.gap) / (Math.PI - EDGE.gap));
    const behind = Math.min(1, (ways.length - EDGE.least + 1) / 4);
    out[i] = [round(open.mid, 1e3), round(Math.max(0.15, (0.45 + 0.55 * wide) * behind), 1e2)];
  });
  return out;
}

// A hole's trees with those at a wood's edge marked (their eleventh
// number: woodEdges'); the rest as they were.
export function withWoodEdges(trees = [], opts = {}) {
  const edges = woodEdges(trees, opts);
  return trees.map((t, i) => {
    if (!edges[i]) return t;
    const e = t.slice(0, 10);
    while (e.length < 10) e.push(undefined);
    e[10] = edges[i];
    return e;
  });
}
