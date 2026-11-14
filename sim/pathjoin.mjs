// Cart paths that meet drawn as one path (the owner, 1 November 2026: "the
// cart paths ... often have overlaying lines with other cart paths. They
// need to link up and look smooth as one path, not clashing with each
// other"; 3 November: "It should look like 1 path, connect the paths and
// draw one continuous path not trying to blend the paths").
//
// Every path drawn on a hole - its own, those between holes and the next
// hole's (look/paths.js makePaths, one call for them all) - is a strip with
// a kerb along each side.
//
// Paths that meet end to end - one's end within CHAIN.gap of another's,
// running on the same way - are one path (chainPaths): one line through
// both, the join a smooth curve from one into the other, drawn as one strip
// with its edges and kerbs running straight on. On the bundled courses
// that's every path between holes with the paths at either end of it, and
// the next hole's with the one it's cut short by.
//
// Where one runs into another's side (a T), one is drawn over the other: in
// the drawing order (pathOrder: the widest first), each path lies over
// every path after it. Then:
//   - a path under another sinks below it where the other's strip and kerb
//     are (sunkUnder), so its kerbs and ends never show across the other's
//     tarmac, and it has no end of its own there (joinPlan: head, tail);
//   - a path over another opens its kerb where the other's tarmac runs on
//     from under it (openOver: the kerb laid flat and drawn as tarmac), so
//     the two surfaces run into each other with no line between - a kerb
//     only round the outside of the two, as overlapping bunkers are drawn
//     as one (sim/potjoin.mjs).
// Near another path the strips have a point every JOIN.fine metres (finer),
// so the kerb opens and the path sinks just where the other is.
//
// An end that meets nothing (head, tail) fades out into the grass
// (look/paths.js END): no rounded end. A path's drawn extent (drawnGap) is
// its line, a half width round past an end that fades and none past one
// under another path (it stops square under the path over it). Hole frame,
// metres. Pure.

import { pathLine, validPath, PATH_WIDTH, KERB } from "./paths.mjs";

export const JOIN = {
  // The kerb's foot past the path's edge (look/paths.js KERBED): a path is
  // over another's ground this far out.
  foot: 0.14,
  // An end this near a path over it doesn't fade out: it's under it.
  meet: KERB + 0.3,
  // How high a sunk part lies over the ground: its tarmac just under the
  // tarmac over it (0.045 at its edges, look/paths.js KERBED, laid flat to
  // that where it's open) - no step at the seam to catch the light - and
  // its edges and kerbs (deep) down under the other's kerb.
  sunk: 0.043,
  deep: 0,
  // Points this far apart along a path near another (metres)...
  fine: 0.25,
  // ...within this of it.
  near: 3,
  // A kerb opens from this far inside the other's tarmac to fully open
  // this far in (metres).
  open: [0.02, 0.12],
};

// The paths in drawing order: the widest first, the others as they come.
export function pathOrder(paths) {
  return (paths ?? []).filter(validPath).map((p, i) => [p, i]).sort(([a, i], [b, j]) => (b.w ?? PATH_WIDTH) - (a.w ?? PATH_WIDTH) || i - j).map(([p]) => p);
}

export const CHAIN = {
  // Two ends this near (metres) are one path's - on the bundled courses a
  // path between holes meets the paths at its ends within 0.1 m, and the
  // next hole's, cut short where it lies along this hole's own, within
  // 1.5 m; ends further apart are ones left apart on purpose (cut off a
  // hole's play) -
  gap: 2,
  // - when they run on the same way: how far round one may turn into the
  // other (the cosine of the angle: 0.5 is 60 degrees).
  turn: 0.5,
  // The curve from one into the other starts this far back along each
  // (metres; less on a short path), with a point every `step` metres.
  blend: 2,
  step: 0.5,
};

// Paths (in drawing order, pathOrder) that meet end to end chained into
// one: [{ ...the first's (w, m), line (its points, a metre or so apart),
// parts (the paths in it, in order along it) }], the rest each on its own,
// in the order of the first of each. Only paths as wide as each other and
// of the same surface join; an end joins one other at most (the nearest
// first), and never round in a loop.
export function chainPaths(paths) {
  const list = (paths ?? []).map((path) => ({ path, pts: pathLine(path).pts })).filter((e) => e.pts.length >= 2);
  const ends = [];
  list.forEach(({ path, pts }, k) => {
    const n = pts.length;
    for (const head of [true, false]) {
      const at = head ? pts[0] : pts[n - 1];
      const from = head ? pts[Math.min(n - 1, 2)] : pts[Math.max(0, n - 3)];
      const l = Math.hypot(at[0] - from[0], at[1] - from[1]) || 1;
      ends.push({ k, head, at, out: [(at[0] - from[0]) / l, (at[1] - from[1]) / l], w: path.w ?? PATH_WIDTH, m: path.m ?? 0 });
    }
  });
  const pairs = [];
  for (let a = 0; a < ends.length; a++) {
    for (let b = a + 1; b < ends.length; b++) {
      const [A, B] = [ends[a], ends[b]];
      if (A.k === B.k || Math.abs(A.w - B.w) > 0.01 || A.m !== B.m) continue;
      const d = Math.hypot(A.at[0] - B.at[0], A.at[1] - B.at[1]);
      if (d < CHAIN.gap && -(A.out[0] * B.out[0] + A.out[1] * B.out[1]) > CHAIN.turn) pairs.push({ a, b, d });
    }
  }
  pairs.sort((p, q) => p.d - q.d);
  const group = list.map((_, k) => k);
  const root = (k) => (group[k] === k ? k : (group[k] = root(group[k])));
  const link = new Map();
  for (const { a, b } of pairs) {
    if (link.has(a) || link.has(b) || root(ends[a].k) === root(ends[b].k)) continue;
    link.set(a, b);
    link.set(b, a);
    group[root(ends[a].k)] = root(ends[b].k);
  }
  const endOf = (k, head) => 2 * k + (head ? 0 : 1);
  const used = new Set();
  const chains = [];
  for (let k = 0; k < list.length; k++) {
    if (used.has(k)) continue;
    // Back to the first path of k's chain (each oriented so it runs on
    // into the next: in by its head if `forward`), then along it.
    let cur = { k, forward: true };
    for (let guard = 0; guard < list.length; guard++) {
      const entry = endOf(cur.k, cur.forward);
      if (!link.has(entry)) break;
      const o = ends[link.get(entry)];
      cur = { k: o.k, forward: !o.head };
    }
    const parts = [];
    let line = null;
    for (let guard = 0; cur && guard < list.length; guard++) {
      used.add(cur.k);
      const pts = cur.forward ? list[cur.k].pts : [...list[cur.k].pts].reverse();
      parts.push(list[cur.k].path);
      line = line ? joinLines(line, pts) : pts.map(([x, z]) => [x, z]);
      const exit = endOf(cur.k, !cur.forward);
      const next = link.has(exit) ? ends[link.get(exit)] : null;
      cur = next && !used.has(next.k) ? { k: next.k, forward: next.head } : null;
    }
    chains.push({ ...parts[0], line, parts });
  }
  return chains;
}

// Line a then line b, a's end meeting b's start: a curve from a point
// CHAIN.blend back along a to one as far along b, leaving each the way it
// runs (a cubic Hermite), so one runs into the other with no kink or step.
export function joinLines(a, b) {
  const back = (pts, most) => {
    let run = 0;
    let i = pts.length - 1;
    while (i > 1 && run < most) {
      run += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      i--;
    }
    return i;
  };
  const length = (pts) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
  const ia = back(a, Math.min(CHAIN.blend, length(a) * 0.4));
  const rb = [...b].reverse();
  const ib = b.length - 1 - back(rb, Math.min(CHAIN.blend, length(b) * 0.4));
  const way = (pts, i) => {
    const p = pts[Math.max(0, i - 1)];
    const q = pts[Math.min(pts.length - 1, i + 1)];
    const l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
    return [(q[0] - p[0]) / l, (q[1] - p[1]) / l];
  };
  const p0 = a[ia];
  const p1 = b[ib];
  const t0 = way(a, ia);
  const t1 = way(b, ib);
  const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
  const n = Math.max(1, Math.ceil(L / CHAIN.step));
  const out = a.slice(0, ia + 1).map(([x, z]) => [x, z]);
  for (let j = 1; j < n; j++) {
    const t = j / n;
    const h00 = 2 * t ** 3 - 3 * t ** 2 + 1;
    const h10 = t ** 3 - 2 * t ** 2 + t;
    const h01 = -2 * t ** 3 + 3 * t ** 2;
    const h11 = t ** 3 - t ** 2;
    out.push([h00 * p0[0] + h10 * L * t0[0] + h01 * p1[0] + h11 * L * t1[0], h00 * p0[1] + h10 * L * t0[1] + h01 * p1[1] + h11 * L * t1[1]]);
  }
  for (let i = ib; i < b.length; i++) out.push([b[i][0], b[i][1]]);
  return out;
}

const CELL = 6;
const cellKey = (ix, iz) => ix * 131072 + iz;

// The plan for paths in drawing order (pathOrder - each over every one after
// it; or chainPaths' chains, each with its `line`): [{ path, half, pts (its
// line), head, tail (whether each end is free, fading out: not under a path
// before it) }], with a grid of their stretches for drawnGap.
export function joinPlan(paths) {
  const plan = { entries: [], cells: new Map() };
  for (const path of paths) {
    const pts = path.line ?? pathLine(path).pts;
    const half = (path.w ?? PATH_WIDTH) / 2;
    const i = plan.entries.length;
    const under = (q) => i > 0 && drawnGap(plan, q[0], q[1], { to: i }) < JOIN.meet;
    const e = { path, half, pts, head: !under(pts[0]), tail: !under(pts[pts.length - 1]) };
    plan.entries.push(e);
    for (let k = 1; k < pts.length; k++) {
      const s = { ax: pts[k - 1][0], az: pts[k - 1][1], bx: pts[k][0], bz: pts[k][1], half, i, open0: k === 1 && !e.head, open1: k === pts.length - 1 && !e.tail };
      const r = half + JOIN.near;
      const ix0 = Math.floor((Math.min(s.ax, s.bx) - r) / CELL);
      const ix1 = Math.floor((Math.max(s.ax, s.bx) + r) / CELL);
      const iz0 = Math.floor((Math.min(s.az, s.bz) - r) / CELL);
      const iz1 = Math.floor((Math.max(s.az, s.bz) + r) / CELL);
      for (let ix = ix0; ix <= ix1; ix++) {
        for (let iz = iz0; iz <= iz1; iz++) {
          const kk = cellKey(ix, iz);
          const list = plan.cells.get(kk);
          if (list) list.push(s);
          else plan.cells.set(kk, [s]);
        }
      }
    }
  }
  return plan;
}

// How far (x, z) is from the nearest drawn edge of the plan's paths from
// index `from` up to (not including) `to`, leaving out `skip` - metres,
// negative on one; Infinity past JOIN.near. A square end (under another
// path) reaches no further than its last point.
export function drawnGap(plan, x, z, { from = 0, to = Infinity, skip = -1 } = {}) {
  const list = plan.cells.get(cellKey(Math.floor(x / CELL), Math.floor(z / CELL)));
  let best = Infinity;
  if (!list) return best;
  for (const s of list) {
    if (s.i < from || s.i >= to || s.i === skip) continue;
    const dx = s.bx - s.ax;
    const dz = s.bz - s.az;
    const l2 = dx * dx + dz * dz || 1;
    const t = ((x - s.ax) * dx + (z - s.az) * dz) / l2;
    if ((t < 0 && s.open0) || (t > 1 && s.open1)) continue;
    const c = Math.max(0, Math.min(1, t));
    const d = Math.hypot(x - s.ax - dx * c, z - s.az - dz * c) - s.half;
    if (d < best) best = d;
  }
  return best <= JOIN.near ? best : Infinity;
}

// Whether path i of the plan is under a path over it at (x, z): within
// that path's kerb foot.
export const sunkUnder = (plan, i, x, z) => i > 0 && drawnGap(plan, x, z, { to: i }) < JOIN.foot;

// How open path i's kerb is at (x, z): 1 well inside the tarmac of a path
// under it (running on from beneath), 0 clear of them.
export function openOver(plan, i, x, z) {
  const g = drawnGap(plan, x, z, { from: i + 1 });
  if (g === Infinity) return 0;
  return Math.min(1, Math.max(0, (-g - JOIN.open[0]) / (JOIN.open[1] - JOIN.open[0])));
}

// Path i's line (points about a metre apart) with a point every JOIN.fine
// metres where it's near another of the plan's paths.
export function finerNear(plan, i, pts) {
  if (plan.entries.length < 2 || pts.length < 2) return pts;
  const near = pts.map(([x, z]) => drawnGap(plan, x, z, { skip: i }) < JOIN.near);
  const out = [pts[0]];
  for (let k = 1; k < pts.length; k++) {
    const [ax, az] = pts[k - 1];
    const [bx, bz] = pts[k];
    const n = near[k - 1] || near[k] ? Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / JOIN.fine)) : 1;
    for (let j = 1; j <= n; j++) out.push(j === n ? pts[k] : [ax + ((bx - ax) * j) / n, az + ((bz - az) * j) / n]);
  }
  return out;
}

// A line with its kinks taken out: wherever it wanders off and back within
// `span` metres - its run between two points more than 1 / `ratio` times
// the way straight across - the points between are laid straight across
// (a point every half metre). A route's small zigzag (Sea Links' link from
// the 1st's green steps on, back and on again in two metres) can't be
// drawn as a curve a strip's width round, so it showed as a pointed kerb;
// a real bend, even a hairpin a strip can go round, runs on further than
// that for how far it gets. And at each end, a hook back within `hook.span`
// metres (its run more than 1 / `hook.ratio` times the way straight across)
// - a route that overshoots a tee and comes back to it (two of Golf Sim
// Links' links) - is laid straight from where it starts. For the look
// only: play keeps its line, the drawn strip a metre or so off it.
export const KINK = { span: 4, ratio: 0.7, hook: { span: 12, ratio: 0.45 } };
export function unkink(pts, { span = KINK.span, ratio = KINK.ratio, hook = KINK.hook } = {}) {
  if (pts.length < 4) return pts;
  const ends = hook ? (line) => unhookEnd(unhookEnd(line, hook).reverse(), hook).reverse() : (line) => line;
  return ends(straighten(pts, span, ratio));
}

// The end of a line laid straight from the first point within `span` metres
// of it whose run to the end is more than 1 / `ratio` times the way straight.
function unhookEnd(pts, { span, ratio }) {
  const n = pts.length;
  if (n < 4) return pts;
  const end = pts[n - 1];
  let run = 0;
  let from = -1;
  for (let i = n - 2; i >= 0; i--) {
    run += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    if (run > span) break;
    if (i < n - 2 && Math.hypot(end[0] - pts[i][0], end[1] - pts[i][1]) < ratio * run) from = i;
  }
  if (from < 0) return pts;
  const [ax, az] = pts[from];
  const k = Math.max(1, Math.round(Math.hypot(end[0] - ax, end[1] - az) / 0.5));
  return [...pts.slice(0, from + 1), ...Array.from({ length: k }, (_, j) => [ax + ((end[0] - ax) * (j + 1)) / k, az + ((end[1] - az) * (j + 1)) / k])];
}

function straighten(pts, span, ratio) {
  const run = [0];
  for (let k = 1; k < pts.length; k++) run.push(run[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
  const out = [];
  let i = 0;
  while (i < pts.length) {
    out.push(pts[i]);
    let to = -1;
    for (let j = i + 2; j < pts.length && run[j] - run[i] <= span; j++) {
      if (Math.hypot(pts[j][0] - pts[i][0], pts[j][1] - pts[i][1]) < ratio * (run[j] - run[i])) to = j;
    }
    if (to < 0) {
      i++;
      continue;
    }
    const [ax, az] = pts[i];
    const [bx, bz] = pts[to];
    const n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / 0.5));
    for (let k = 1; k < n; k++) out.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n]);
    i = to;
  }
  return out;
}

// A line's bends eased where they're tighter than `minR` metres round (the
// strip's half width: tighter, its inner edge folds back over itself, a
// dark fold at the corner) - each such point drawn halfway to its
// neighbours' middle, a round at a time, until none is, or `rounds` - so a
// tight corner is drawn as a curve of about that radius, as a real cart
// path's is. Its ends stay where they are, and no point moves more than
// `most` metres (a hairpin tighter than that allows is left a little
// tight, rather than the path drawn away from where it plays).
export function easeBends(pts, minR, { rounds = 400, most = minR * 1.5 } = {}) {
  if (pts.length < 3 || !(minR > 0)) return pts;
  let line = pts.map(([x, z]) => [x, z]);
  for (let round = 0; round < rounds; round++) {
    let eased = false;
    const next = line.map(([x, z]) => [x, z]);
    for (let k = 1; k < line.length - 1; k++) {
      if (bendRadius(line, k) >= minR) continue;
      let x = line[k][0] * 0.5 + (line[k - 1][0] + line[k + 1][0]) * 0.25;
      let z = line[k][1] * 0.5 + (line[k - 1][1] + line[k + 1][1]) * 0.25;
      const [ox, oz] = pts[k];
      const off = Math.hypot(x - ox, z - oz);
      if (off > most) {
        x = ox + ((x - ox) * most) / off;
        z = oz + ((z - oz) * most) / off;
      }
      if (Math.hypot(x - line[k][0], z - line[k][1]) < 1e-4) continue;
      next[k] = [x, z];
      eased = true;
    }
    line = next;
    if (!eased) break;
  }
  return line;
}

// How far round a line bends at point k (metres): its neighbours' spacing
// over the angle it turns there.
export function bendRadius(line, k) {
  const [a, b, c] = [line[k - 1], line[k], line[k + 1]];
  const ux = b[0] - a[0];
  const uz = b[1] - a[1];
  const vx = c[0] - b[0];
  const vz = c[1] - b[1];
  const la = Math.hypot(ux, uz);
  const lb = Math.hypot(vx, vz);
  if (!(la > 0 && lb > 0)) return Infinity;
  const turn = Math.acos(Math.max(-1, Math.min(1, (ux * vx + uz * vz) / (la * lb))));
  return turn > 1e-6 ? (la + lb) / 2 / turn : Infinity;
}

// ---- The paths as drawn -------------------------------------------------------------

// How a path's line is drawn (look/paths.js makePaths): bends eased to its
// half width and `bendRoom` more round (an inside kerb a curve, never a
// point), and a free end run on `past` metres into the grass (look/paths.js
// END: its gravel thinning out there).
export const DRAWN = { bendRoom: 1, past: 1.5 };

// A line with a point every `step` metres or so (pathLine's are a metre
// apart).
export function resample(pts, step) {
  if (Math.abs(step - 1) < 1e-6 || pts.length < 2) return pts;
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1];
    const [bx, bz] = pts[i];
    const n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / step));
    for (let k = 1; k <= n; k++) out.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n]);
  }
  return out;
}

// A line run on DRAWN.past metres straight on past each free end (`head`,
// `tail`), a point every half metre.
export function fadeEnds(pts, head, tail) {
  if (pts.length < 2 || !(head || tail)) return pts;
  const on = (a, b) => {
    // Beyond a, away from b.
    const dx = a[0] - b[0];
    const dz = a[1] - b[1];
    const l = Math.hypot(dx, dz) || 1;
    const n = Math.max(1, Math.round(DRAWN.past / 0.5));
    return Array.from({ length: n }, (_, k) => [a[0] + (dx / l) * DRAWN.past * ((k + 1) / n), a[1] + (dz / l) * DRAWN.past * ((k + 1) / n)]);
  };
  const start = head ? on(pts[0], pts[1]).reverse() : [];
  const end = tail ? on(pts[pts.length - 1], pts[pts.length - 2]) : [];
  return [...start, ...pts, ...end];
}

// Paths as they're drawn: { chains (chainPaths), plan (joinPlan), lines -
// each chain's line as its strip is laid (its kinks taken out, its bends
// eased, a free end run on into the grass) }. step: how far apart its
// points are (closer on real ground). The one sum makePaths draws from and
// the grass keeps off (drawnPaths) - so no grass stands where a path is
// drawn, wherever that's off the line it plays on.
export function drawnLines(paths, { step = 1 } = {}) {
  const chains = chainPaths(pathOrder(paths));
  const plan = joinPlan(chains);
  const lines = plan.entries.map(({ half, pts, head, tail }) => fadeEnds(easeBends(unkink(resample(pts, step)), half + DRAWN.bendRoom), head, tail));
  return { chains, plan, lines };
}

// The paths as drawn, for the grass to keep off (sim/paths.mjs gapToPaths
// and the rest measure from a path's `line` where it has one): [{ w, m,
// line }], one a strip.
export function drawnPaths(paths, opts) {
  const { chains, lines } = drawnLines(paths, opts);
  return chains.map((c, i) => ({ w: c.w ?? PATH_WIDTH, m: c.m ?? 0, line: lines[i] }));
}
