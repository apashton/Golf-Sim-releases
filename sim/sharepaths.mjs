// Cart paths that run side by side share one (the owner, 28 October 2026:
// "Can also play smart and share cart paths over small distances"). Two
// holes laid out together each have their own path, made knowing only its
// own hole (sim/paths.mjs), so where they come back alongside each other
// the two paths can run a few metres apart for a hundred metres - Golf Sim
// Links' 3rd and 4th, Hillside Park's 5th and 6th. Where one runs within
// SHARE.near of another, the same way (or back the other way) for at
// least SHARE.min, it leaves its own line a little before, runs along the
// other's, and comes back to its own a little after (SHARE.ease): one path
// there, as a course would have. The one kept is the one further off the
// two holes' play. And a path between holes (sim/linkpaths.mjs) that runs
// right beside one there already runs on it (SHARE.snap). Pure: lines of
// [x, z] points on the course's ground, a metre or so apart.

import { lineGap } from "./linkway.mjs";

export const SHARE = {
  // Side by side: no further apart than `near` (middle to middle), running
  // within `parallel` (the cosine of the angle between them) of the same
  // way, for at least `min` metres.
  near: 10,
  parallel: 0.85,
  min: 20,
  // Off its own line onto the other's over this far, at least (further
  // where they're further apart: `slope` times the gap).
  ease: 8,
  slope: 1.5,
  // A path between holes this close beside one, for `snapMin`, runs on it.
  snap: 3,
  snapMin: 6,
};

// A quick look-up of a line's points: a grid of SHARE.near squares.
const key = (ix, iz) => ix * 131072 + iz;
function gridOf(line, cell) {
  const g = new Map();
  line.forEach(([x, z], i) => {
    const k = key(Math.floor(x / cell), Math.floor(z / cell));
    if (!g.has(k)) g.set(k, []);
    g.get(k).push(i);
  });
  return g;
}

// The point of `line` nearest (x, z) within `within`: [index, distance], or
// null.
function nearestIn(line, grid, cell, x, z, within) {
  const cx = Math.floor(x / cell);
  const cz = Math.floor(z / cell);
  const r = Math.ceil(within / cell);
  let best = null;
  for (let ix = cx - r; ix <= cx + r; ix++) {
    for (let iz = cz - r; iz <= cz + r; iz++) {
      for (const i of grid.get(key(ix, iz)) ?? []) {
        const d = Math.hypot(line[i][0] - x, line[i][1] - z);
        if (d <= within && (!best || d < best[1])) best = [i, d];
      }
    }
  }
  return best;
}

// Which way a line runs at point i (a unit vector).
function heading(line, i) {
  const a = line[Math.max(0, i - 2)];
  const b = line[Math.min(line.length - 1, i + 2)];
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
}

// The stretches of line `a` beside line `b` (each a metre or so a point):
// [{ a0, a1, b0, b1, gap, length }] - a's points a0 to a1 run beside b's
// b0 to b1 (b1 < b0 where they run opposite ways), on average `gap` apart.
export function besideRuns(a, b, { near = SHARE.near, min = SHARE.min, parallel = SHARE.parallel } = {}) {
  if (a.length < 2 || b.length < 2) return [];
  const cell = Math.max(2, near);
  const grid = gridOf(b, cell);
  const runs = [];
  let run = null;
  let length = 0;
  const flush = () => {
    if (run && length >= min) runs.push({ ...run, gap: run.sum / run.n, length });
    run = null;
    length = 0;
  };
  for (let i = 0; i < a.length; i++) {
    const hit = nearestIn(b, grid, cell, a[i][0], a[i][1], near);
    let ok = false;
    if (hit) {
      const [ux, uz] = heading(a, i);
      const [vx, vz] = heading(b, hit[0]);
      ok = Math.abs(ux * vx + uz * vz) >= parallel;
    }
    if (!ok) {
      flush();
      continue;
    }
    if (!run) run = { a0: i, b0: hit[0], sum: 0, n: 0 };
    else length += Math.hypot(a[i][0] - a[i - 1][0], a[i][1] - a[i - 1][1]);
    run.a1 = i;
    run.b1 = hit[0];
    run.sum += hit[1];
    run.n++;
  }
  flush();
  return runs;
}

// Line `a` running on `b` along a stretch of them side by side
// (besideRuns): its own points up to a little before, b's along it, and its
// own again from a little after - eased over SHARE.ease (or `slope` times
// the gap) at each end that isn't a's own end.
export function onto(a, b, run, ease = Math.max(SHARE.ease, SHARE.slope * run.gap)) {
  const { a0, a1, b0, b1 } = run;
  const back = (from, metres, dir) => {
    let i = from;
    let d = 0;
    while (i + dir >= 0 && i + dir < a.length && d < metres) {
      d += Math.hypot(a[i + dir][0] - a[i][0], a[i + dir][1] - a[i][1]);
      i += dir;
    }
    return i;
  };
  // Along b the way a runs.
  const step = b1 >= b0 ? 1 : -1;
  const along = [];
  for (let k = b0; k !== b1 + step; k += step) along.push(b[k]);
  const head = a0 > 0 ? a.slice(0, back(a0, ease, -1) + 1) : [];
  const tail = a1 < a.length - 1 ? a.slice(back(a1, ease, 1)) : [];
  return [...head, ...along, ...tail];
}

// How far a line's stretch keeps off play: the least, along it, of how far
// outside each of `lines` ([{ measured, clear }], as linkway.mjs
// linkGrounds has a hole's play) it is - the further, the better a path
// to keep.
export function offPlay(line, from, to, lines) {
  let least = Infinity;
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  for (let i = lo; i <= hi; i++) for (const g of lines) least = Math.min(least, lineGap(g.measured, line[i][0], line[i][1]) - g.clear);
  return least;
}
