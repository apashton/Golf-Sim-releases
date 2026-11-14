// The way a cart path takes from one hole to the next (sim/linkpaths.mjs
// lays them): the owner, 28 October 2026, "Cart paths should mainly be as
// per the hole creation. But the end of one hole finding it's way to the
// start of the new hole. It can from time to time end on a hole and start
// a fresh on a new hole, where the pathing would be substantial and not
// worth it. Carts can run over grass, but let's ensure the paths make sense
// both logistically and visually."
//
// Found over a grid of the course's ground (LINK.cell metres a square,
// [east, north] as the holes' places are) between its two ends: never on a
// green, a tee box or sand, nor nearer them than a hole's own path keeps
// (sim/paths.mjs groundTrouble); over water only on a bridge, straight
// across where it's narrow (sim/bridges.mjs crossesWell - "Don't forget
// you can build bridges", the owner) - a little dearer than the grass, so
// it goes round only where that's not far; dear across the line of a
// hole's play (the corridor sim/routing.mjs keeps the holes apart by: no
// path where the golfers are hitting) and under a tree's crown; a little
// cheaper along a path that's there already. The cheapest way, pulled
// into a few straight legs and rounded at its bends. Whether it's worth
// laying is the paths between holes' to say (linkpaths.mjs). Pure.

import { groundTrouble, troubleBoxes, wetness, pathLine, validPath, fewerPoints, MAX_POINTS, PATH_WIDTH, KERB, PATH_CLEAR } from "./paths.mjs";
import { crossesWell } from "./bridges.mjs";
import { holeFrame } from "./terrain.mjs";
import { measuredLine, lineLength, clearanceFor } from "./routing.mjs";
import { crownReach } from "./teelane.mjs";
import { withEdits } from "./holeedits.mjs";

export const LINK = {
  // Metres a square of the grid, and how far round the two ends the way
  // may go.
  cell: 1.5,
  margin: 35,
  // How much further off greens, tees, sand and water than a path must be
  // (sim/paths.mjs PATH_CLEAR), as a hole's own path keeps (its SLACK).
  keep: 1.2,
  // What a metre costs: across the line of a hole's play, under a tree's
  // crown (or within `crown` of its edge), along a path there already -
  // against a metre of open grass, 1.
  play: 25,
  tree: 6,
  crown: 1,
  onPath: 0.6,
  // Over water on a bridge, and on the banks it's built from.
  bridge: 3,
  bank: 2,
  // Laid only where it's worth it: no longer than `most` metres, nor more
  // than `detour` times the straight way between its ends and `slack`
  // over, nor across more than `playMost` metres of a hole's play (but
  // for the `ends` metres at either end, where it meets the holes' own
  // paths). Else the one hole's path ends and the next's starts afresh,
  // and the carts cross the grass between.
  most: 80,
  detour: 1.6,
  slack: 15,
  playMost: 4,
  ends: 8,
  // Two holes' paths that come this close by the green and the next tee
  // are joined already: no path between them.
  joined: 4,
  // It leaves the one path, and comes to the next, this far on in the way
  // that path runs.
  lead: 5,
};
// Half a path's width, its kerbs on.
const HALF = PATH_WIDTH / 2 + KERB;
// How far round what a path keeps off it could be too close (for the
// quick look first: troubles) - its half width, the most any clearance is,
// a link's keep and a square's half diagonal, and a little.
const REACH = HALF + Math.max(PATH_CLEAR.tee, PATH_CLEAR.green, PATH_CLEAR.sand, PATH_CLEAR.water) + 1.2 + 1.1 + 0.5;

const boxAround = (pts, grow) => {
  let x0 = Infinity;
  let z0 = Infinity;
  let x1 = -Infinity;
  let z1 = -Infinity;
  for (const [x, z] of pts) {
    x0 = Math.min(x0, x);
    z0 = Math.min(z0, z);
    x1 = Math.max(x1, x);
    z1 = Math.max(z1, z);
  }
  return { x0: x0 - grow, z0: z0 - grow, x1: x1 + grow, z1: z1 + grow };
};
const inBox = (b, x, z) => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1;
const meets = (a, b) => a.x0 <= b.x1 && b.x0 <= a.x1 && a.z0 <= b.z1 && b.z0 <= a.z1;

// How far (x, z) is from a line ([[x, z]...]).
export function lineGap(line, x, z) {
  let best = Infinity;
  for (let i = 1; i < line.length; i++) {
    const ax = line[i - 1][0];
    const az = line[i - 1][1];
    const vx = line[i][0] - ax;
    const vz = line[i][1] - az;
    const l2 = vx * vx + vz * vz || 1;
    let t = ((x - ax) * vx + (z - az) * vz) / l2;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
    const px = ax + vx * t - x;
    const pz = az + vz * t - z;
    const d2 = px * px + pz * pz;
    if (d2 < best) best = d2;
  }
  return line.length === 1 ? Math.hypot(line[0][0] - x, line[0][1] - z) : Math.sqrt(best);
}

// Every hole's ground as a path between holes meets it, on the course's
// ground: [{ index, L, frame, box, measured, clear, trees, paths, pin, tee }]
// (null for a hole with no place or line) - its layout and frame, the box
// its ground is in, the line of its play (routing.mjs measuredLine: its
// ends trimmed, as the holes are kept apart) and how far either side of it
// is in play, its trees ([x, z, crown's reach]), its paths' lines, its pin
// and its tee. paths: each hole's paths, if not its layout's (kept off the
// other holes: sim/coursepaths.mjs).
export function linkGrounds(course, places, paths = null) {
  return (course?.holes ?? []).map((h, i) => {
    // (The hole as it's played: its edits applied - a pond or bunker added
    // by hand is in the way of a path as much as one it was made with.)
    const L = withEdits(h?.layout);
    const place = places?.[i];
    if (!L?.path?.length || !place) return null;
    const frame = holeFrame([place.x, place.z], place.heading);
    const to = (q) => frame.toLocal(q);
    const line = L.path.map(to);
    const len = lineLength(line);
    const measured = measuredLine(line, len);
    const clear = clearanceFor(len, len) / 2;
    // (Its troubles' boxes on the course's ground, each grown by REACH.)
    const troubles = troubleBoxes(L).map((b) => boxAround([to([b.x0, b.z0]), to([b.x1, b.z0]), to([b.x1, b.z1]), to([b.x0, b.z1])], REACH));
    return {
      index: i,
      L,
      frame,
      troubles,
      box: boxAround(line, (L.treeLine ?? 60) + 30),
      measured,
      clear,
      // (The box its play's in, for a quick look first.)
      inPlayBox: boxAround(measured, clear),
      trees: (L.trees ?? []).map((t) => [...to([t[0], t[1]]), crownReach(t)]),
      paths: ((paths ? paths[i] : L.paths) ?? []).filter(validPath).map((p) => pathLine(p).pts.map(to)),
      pin: to(L.pin ?? L.path[L.path.length - 1]),
      tee: [place.x, place.z],
    };
  });
}

// Whether (x, z) is near enough anything on hole g's ground a path keeps
// off for it to matter (its troubles' boxes, on the course's ground) - a
// quick look before the exact one.
export const nearTrouble = (g, x, z) => !!g && inBox(g.box, x, z) && g.troubles.some((b) => inBox(b, x, z));

// What a path at (x, z) on the course's ground would be too close to on any
// hole ("green", "tee", "sand", "water"), or null. dry: water left out (a
// path goes over it on a bridge).
export function troubleAt(grounds, x, z, dry = false) {
  for (const g of grounds) {
    if (!nearTrouble(g, x, z)) continue;
    const t = groundTrouble(g.L, ...g.frame.toHole([x, z]), HALF, LINK.keep);
    if (t && !(dry && t === "water")) return t;
  }
  return null;
}

// How near water a path at (x, z) is on any hole: 2 over it, 1 nearer than
// a path keeps (sim/paths.mjs wetness), else 0.
export function wetAt(grounds, x, z) {
  let out = 0;
  for (const g of grounds) {
    if (!nearTrouble(g, x, z)) continue;
    out = Math.max(out, wetness(g.L, ...g.frame.toHole([x, z]), HALF, LINK.keep));
    if (out === 2) return 2;
  }
  return out;
}

// Points every `step` metres along a line (its ends included).
export function stepsAlong(line, step) {
  const out = [line[0]];
  let left = step;
  for (let i = 1; i < line.length; i++) {
    let [ax, az] = line[i - 1];
    const [bx, bz] = line[i];
    let d = Math.hypot(bx - ax, bz - az);
    while (d >= left) {
      const t = left / d;
      ax += (bx - ax) * t;
      az += (bz - az) * t;
      out.push([ax, az]);
      d -= left;
      left = step;
    }
    left -= d;
  }
  const last = line[line.length - 1];
  const end = out[out.length - 1];
  if (Math.hypot(last[0] - end[0], last[1] - end[1]) > 1e-6) out.push(last);
  return out;
}

// A small heap of [cost, square], cheapest first.
function heap() {
  const a = [];
  return {
    get size() {
      return a.length;
    },
    push(v) {
      a.push(v);
      let i = a.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (a[p][0] <= a[i][0]) break;
        [a[p], a[i]] = [a[i], a[p]];
        i = p;
      }
    },
    pop() {
      const top = a[0];
      const last = a.pop();
      if (a.length) {
        a[0] = last;
        let i = 0;
        for (;;) {
          const l = i * 2 + 1;
          const r = l + 1;
          let m = i;
          if (l < a.length && a[l][0] < a[m][0]) m = l;
          if (r < a.length && a[r][0] < a[m][0]) m = r;
          if (m === i) break;
          [a[m], a[i]] = [a[i], a[m]];
          i = m;
        }
      }
      return top;
    },
  };
}

// The way from `from` to `to` (course metres) over the grounds
// (linkGrounds): { line, length, inPlay, underTrees, bridged } - its line,
// its length, how many metres of it are across a hole's play or under a
// crown, and over water on a bridge - or null if there's none (the ends
// shut in). Over water where it can cross it well (sim/bridges.mjs), else
// round it.
export function linkWay(grounds, from, to) {
  let way = findWay(grounds, from, to, true);
  if (!way.line && way.wet) way = findWay(grounds, from, to, false);
  return way.line ? way : null;
}

// The way, over water on a bridge or not (bridges). { wet: true } where
// the way it found over water didn't cross it well.
function findWay(grounds, from, to, bridges) {
  const c = LINK.cell;
  const box = boxAround([from, to], LINK.margin);
  const W = Math.ceil((box.x1 - box.x0) / c) + 1;
  const H = Math.ceil((box.z1 - box.z0) / c) + 1;
  const X = (i) => box.x0 + i * c;
  const Z = (j) => box.z0 + j * c;
  const near = grounds.filter((g) => g && meets(g.box, box));
  // The squares under a crown, and along a path there already.
  const shade = new Uint8Array(W * H);
  const pathed = new Uint8Array(W * H);
  const stamp = (mask, x, z, r) => {
    const i0 = Math.max(0, Math.floor((x - r - box.x0) / c));
    const i1 = Math.min(W - 1, Math.ceil((x + r - box.x0) / c));
    const j0 = Math.max(0, Math.floor((z - r - box.z0) / c));
    const j1 = Math.min(H - 1, Math.ceil((z + r - box.z0) / c));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (Math.hypot(X(i) - x, Z(j) - z) <= r) mask[j * W + i] = 1;
  };
  for (const g of near) {
    for (const [x, z, r] of g.trees) {
      const R = r + LINK.crown + HALF;
      if (x > box.x0 - R && x < box.x1 + R && z > box.z0 - R && z < box.z1 + R) stamp(shade, x, z, R);
    }
    for (const line of g.paths) for (const [x, z] of line) if (inBox(box, x, z)) stamp(pathed, x, z, 1);
  }
  // A square's cost, worked out the first time it's wanted (-1 not yet;
  // Infinity never), and whether it's across a hole's play.
  const cost = new Float32Array(W * H).fill(-1);
  const play = new Uint8Array(W * H);
  let wet = false;
  // (Right by its ends it can go where a path must not quite: a hole's
  // path may end by the next hole's tee.)
  const freeR = 2.5;
  const costOf = (k) => {
    if (cost[k] >= 0) return cost[k];
    const x = X(k % W);
    const z = Z(Math.floor(k / W));
    let v = 1;
    let never = false;
    for (const g of near) {
      if (!inBox(g.box, x, z)) continue;
      // (Kept off by enough more that anywhere in the square is.)
      const h = nearTrouble(g, x, z) ? g.frame.toHole([x, z]) : null;
      const t = h ? groundTrouble(g.L, ...h, HALF, LINK.keep + c * Math.SQRT1_2) : null;
      if (t === "water" && bridges) {
        // Over it on a bridge, or on a bank by one.
        wet = true;
        v = Math.max(v, wetness(g.L, ...h, HALF + c * Math.SQRT1_2) === 2 ? LINK.bridge : LINK.bank);
      } else if (t) {
        const free = t !== "water" && (Math.hypot(x - from[0], z - from[1]) <= freeR || Math.hypot(x - to[0], z - to[1]) <= freeR);
        if (!free) never = true;
        v = Math.max(v, 3);
      }
      if (inBox(g.inPlayBox, x, z) && lineGap(g.measured, x, z) < g.clear) play[k] = 1;
    }
    if (never) v = Infinity;
    else if (play[k]) v = Math.max(v, LINK.play);
    else if (shade[k]) v = Math.max(v, LINK.tree);
    else if (pathed[k] && v === 1) v = LINK.onPath;
    cost[k] = v;
    return v;
  };
  const cellOf = ([x, z]) => Math.min(H - 1, Math.max(0, Math.round((z - box.z0) / c))) * W + Math.min(W - 1, Math.max(0, Math.round((x - box.x0) / c)));
  const start = cellOf(from);
  const goal = cellOf(to);
  const gx = goal % W;
  const gz = Math.floor(goal / W);
  const guess = (k) => Math.hypot((k % W) - gx, Math.floor(k / W) - gz) * c * LINK.onPath;
  const best = new Float64Array(W * H).fill(Infinity);
  const came = new Int32Array(W * H).fill(-1);
  const open = heap();
  best[start] = 0;
  open.push([guess(start), start]);
  const STEPS = [
    [1, 0, 1],
    [-1, 0, 1],
    [0, 1, 1],
    [0, -1, 1],
    [1, 1, Math.SQRT2],
    [1, -1, Math.SQRT2],
    [-1, 1, Math.SQRT2],
    [-1, -1, Math.SQRT2],
  ];
  let found = false;
  let looked = 0;
  while (open.size) {
    const [f, k] = open.pop();
    if (f - guess(k) > best[k] + 1e-9) continue;
    if (k === goal) {
      found = true;
      break;
    }
    if (++looked > W * H * 2) break;
    const i = k % W;
    const j = Math.floor(k / W);
    const here = k === start ? 1 : costOf(k);
    for (const [di, dj, len] of STEPS) {
      const ni = i + di;
      const nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= W || nj >= H) continue;
      const n = nj * W + ni;
      const there = n === goal ? 1 : costOf(n);
      if (!Number.isFinite(there)) continue;
      // (No corner cut past a square it can't cross.)
      if (di && dj && (!Number.isFinite(costOf(j * W + ni)) || !Number.isFinite(costOf(nj * W + i)))) continue;
      const g = best[k] + len * c * (here + there) / 2;
      if (g < best[n]) {
        best[n] = g;
        came[n] = k;
        open.push([g + guess(n), n]);
      }
    }
  }
  if (!found) return { wet };
  const cells = [];
  for (let k = goal; k >= 0; k = came[k]) {
    cells.push(k);
    if (k === start) break;
  }
  cells.reverse();
  const pts = cells.map((k) => [X(k % W), Z(Math.floor(k / W))]);
  pts[0] = from;
  pts[pts.length - 1] = to;
  // Along a straight leg, at every half square: the dearest square on it
  // (Infinity if it crosses one it can't), and what the leg costs.
  const legCost = (a, b) => {
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(1, Math.ceil(d / (c / 2)));
    let most = 0;
    let sum = 0;
    for (let s = 0; s <= n; s++) {
      const q = [a[0] + ((b[0] - a[0]) * s) / n, a[1] + ((b[1] - a[1]) * s) / n];
      const k = cellOf(q);
      const v = k === start || k === goal ? 1 : costOf(k);
      if (!Number.isFinite(v)) return { most: Infinity, sum: Infinity };
      most = Math.max(most, v);
      sum += (v * d) / (n + 1);
    }
    return { most, sum };
  };
  // Pulled tight: from each point, straight to the furthest one on that
  // it can reach without going anywhere dearer than the way it had, nor
  // costing more (so it goes over water straight across, as the way did).
  const dearest = cells.map((k, i) => (i === 0 || i === cells.length - 1 ? 1 : costOf(k)));
  const tight = [pts[0]];
  for (let i = 0; i < pts.length - 1; ) {
    let j = pts.length - 1;
    for (; j > i + 1; j--) {
      let most = 0;
      for (let k = i; k <= j; k++) most = Math.max(most, dearest[k]);
      const leg = legCost(pts[i], pts[j]);
      if (leg.most <= most && leg.sum <= (best[cells[j]] - best[cells[i]]) * 1.02 + 0.5) break;
    }
    tight.push(pts[j]);
    i = j;
  }
  // Rounded at its bends (as a hole's own path is: sim/paths.mjs), where
  // the rounding stays clear; and kept to a path's points.
  const kept = (pts) => {
    let out = pts;
    for (let tol = 0.2; out.length > MAX_POINTS - 4; tol *= 1.5) out = fewerPoints(pts, tol);
    return out;
  };
  let round = tight;
  for (let r = 0; r < 2; r++) {
    const next = [round[0]];
    for (let i = 0; i < round.length - 1; i++) {
      const [ax, az] = round[i];
      const [bx, bz] = round[i + 1];
      if (i > 0) next.push([ax * 0.75 + bx * 0.25, az * 0.75 + bz * 0.25]);
      if (i < round.length - 2) next.push([ax * 0.25 + bx * 0.75, az * 0.25 + bz * 0.75]);
    }
    next.push(round[round.length - 1]);
    let ok = true;
    for (let i = 1; i < next.length && ok; i++) if (!Number.isFinite(legCost(next[i - 1], next[i]).most)) ok = false;
    if (!ok) break;
    round = next;
  }
  // Every half metre of it clear, as it's drawn (but right by its ends),
  // and over water only straight across on a bridge.
  const clearLine = (line) => {
    const flags = [];
    for (const [x, z] of stepsAlong(line, 0.5)) {
      flags.push(wetAt(near, x, z));
      if (Math.hypot(x - from[0], z - from[1]) <= freeR || Math.hypot(x - to[0], z - to[1]) <= freeR) continue;
      if (troubleAt(near, x, z, bridges)) return false;
    }
    return (bridges || !flags.some(Boolean)) && crossesWell(flags, 0.5);
  };
  const line = [kept(round), kept(tight)].find(clearLine);
  if (!line) return { wet };
  // What it crosses, a metre at a time - across a hole's play only away
  // from its ends (where it meets a hole's own path, which goes where its
  // hole was made to).
  const length = lineLength(line);
  let inPlay = 0;
  let underTrees = 0;
  let bridged = 0;
  let along = 0;
  for (let i = 1; i < line.length; i++) {
    const [ax, az] = line[i - 1];
    const [bx, bz] = line[i];
    const n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az)));
    const step = Math.hypot(bx - ax, bz - az) / n;
    for (let s = 0; s < n; s++, along += step) {
      const k = cellOf([ax + ((bx - ax) * (s + 0.5)) / n, az + ((bz - az) * (s + 0.5)) / n]);
      costOf(k);
      if (play[k] && along > LINK.ends && along < length - LINK.ends) inPlay += step;
      if (shade[k]) underTrees += step;
      if (wetAt(near, ax + ((bx - ax) * (s + 0.5)) / n, az + ((bz - az) * (s + 0.5)) / n) === 2) bridged += step;
    }
  }
  return { line, length, inPlay, underTrees, bridged };
}
