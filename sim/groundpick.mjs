// A green, a tee or a bunker picked off the ground with one tap, for a
// course whose map doesn't have them (the course plan: courseplan.js). On
// LiDAR's metre grid each shows plainly:
//   - a green is level, smooth ground inside its banks: from where it's
//     tapped, the ground no steeper than a green is and as smooth as rolled
//     turf (about half as rough on the survey as the ground round it), out
//     to where the banks start - and no bigger than a green;
//   - a tee is a flat platform: the level ground round the tap, squared
//     off into the oblong it's built as;
//   - a bunker lies below the ground round it - a bowl, or one cut into a
//     slope and open on its low side: from its floor, out to where the
//     ground comes up to its surroundings' level.
// Where the ground is coarser than that (map tiles, a height every 3 - 5
// m: the hills, not a green's banks) or the shape found isn't one, it's a
// shape of the usual size round the tap, the long way along the hole.
//
// Measured against a parkland course traced from the air, on England's 1 m
// LiDAR (tools/realcourses/watling-pines: its outlines sit about 2.5 m off
// the survey, as an aerial picture's do - allowed for): 18 of its 22 greens
// found from a tap in the middle, overlapping the traced outline by 70%
// (intersection over union) at 1.2 times its size; 65 of 82 bunkers, at
// 52% and their own size; tees as their whole platform, often two or three
// boxes' worth.
//
// Pure. The ground: { x0, z0, cell, nx, nz, h } (terrain.mjs makeGrid,
// heights at x0 + ix * cell, z0 + iz * cell), x east and z north of the
// course's middle, metres.

import { traceOutline, chaikin, thin } from "./cellmask.mjs";
import { polygonArea } from "./terrain.mjs";

// What each is like (metres, and slopes as a fall per metre).
export const PICK = {
  // Finer than this, the ground shows a green's banks.
  fine: 1.6,
  // (rough: the most a green's ground differs from its neighbours, as a
  // mean - metres.)
  green: { reach: 22, slope: 0.07, fall: 1.4, rough: 0.012, least: 140, most: 1300, usual: [16, 12] },
  tee: { reach: 26, slope: 0.035, fall: 0.35, least: 30, most: 900, usual: [6, 4.5] },
  // (method "dip": below the mean of the ground `around` metres each way,
  // its floor `deep` and its edge where it's within `edge` of it; "basin",
  // a bowl filled to where it spills - `depth` at most, `rim` in from it -
  // which found a third as many of the parkland's bunkers.)
  bunker: { method: "dip", around: 4, deep: 0.12, edge: 0.15, reach: 16, depth: 2.6, least: 6, most: 450, usual: [4.2, 3.4], floor: 4, rim: 0.12 },
};

const r2 = (v) => Math.round(v * 100) / 100;

// An oval (or, a tee, an oblong) of the usual size round `at`, its long way
// along `toward` ([dx, dz], a unit vector).
export function usualShape(kind, at, toward = [1, 0]) {
  const [a, b] = PICK[kind].usual;
  const [ux, uz] = toward;
  const pts = [];
  if (kind === "tee") {
    for (const [p, q] of [[-a, -b], [a, -b], [a, b], [-a, b]]) pts.push([r2(at[0] + ux * p - uz * q), r2(at[1] + uz * p + ux * q)]);
    return pts;
  }
  const n = kind === "green" ? 24 : 16;
  for (let k = 0; k < n; k++) {
    const t = (k / n) * Math.PI * 2;
    const p = Math.cos(t) * a;
    const q = Math.sin(t) * b;
    pts.push([r2(at[0] + ux * p - uz * q), r2(at[1] + uz * p + ux * q)]);
  }
  return pts;
}

// The window of the ground round a spot: its own little grid, heights
// smoothed over three cells each way (a metre's noise isn't a bank).
function windowAt(ground, at, reach) {
  const { x0, z0, cell, nx, nz, h } = ground;
  const r = Math.ceil(reach / cell) + 3;
  const ci = Math.round((at[0] - x0) / cell);
  const cj = Math.round((at[1] - z0) / cell);
  const i0 = Math.max(0, ci - r);
  const j0 = Math.max(0, cj - r);
  const i1 = Math.min(nx - 1, ci + r);
  const j1 = Math.min(nz - 1, cj + r);
  const w = i1 - i0 + 1;
  const hh = j1 - j0 + 1;
  if (w < 5 || hh < 5 || ci < 0 || cj < 0 || ci >= nx || cj >= nz) return null;
  const raw = new Float32Array(w * hh);
  for (let j = 0; j < hh; j++) for (let i = 0; i < w; i++) raw[j * w + i] = h[(j0 + j) * nx + (i0 + i)];
  const s = new Float32Array(w * hh);
  for (let j = 0; j < hh; j++) {
    for (let i = 0; i < w; i++) {
      let sum = 0;
      let n = 0;
      for (let dj = -1; dj <= 1; dj++) {
        for (let di = -1; di <= 1; di++) {
          const a = i + di;
          const b = j + dj;
          if (a < 0 || b < 0 || a >= w || b >= hh) continue;
          sum += raw[b * w + a];
          n++;
        }
      }
      s[j * w + i] = sum / n;
    }
  }
  const slope = new Float32Array(w * hh);
  for (let j = 0; j < hh; j++) {
    for (let i = 0; i < w; i++) {
      const a = s[j * w + Math.max(0, i - 1)];
      const b = s[j * w + Math.min(w - 1, i + 1)];
      const c = s[Math.max(0, j - 1) * w + i];
      const d = s[Math.min(hh - 1, j + 1) * w + i];
      const dx = (b - a) / (cell * (Math.min(w - 1, i + 1) - Math.max(0, i - 1)) || 1);
      const dz = (d - c) / (cell * (Math.min(hh - 1, j + 1) - Math.max(0, j - 1)) || 1);
      slope[j * w + i] = Math.hypot(dx, dz);
    }
  }
  // How rough the ground is: each cell against its neighbours' mean, the
  // mean of that over five cells each way. A green's rolled turf is about
  // half as rough on the survey as the ground round it.
  const bump = new Float32Array(w * hh);
  for (let k = 0; k < w * hh; k++) bump[k] = Math.abs(raw[k] - s[k]);
  const rough = new Float32Array(w * hh);
  for (let j = 0; j < hh; j++) {
    for (let i = 0; i < w; i++) {
      let sum = 0;
      let n = 0;
      for (let dj = -2; dj <= 2; dj++) {
        for (let di = -2; di <= 2; di++) {
          const a = i + di;
          const b = j + dj;
          if (a < 0 || b < 0 || a >= w || b >= hh) continue;
          sum += bump[b * w + a];
          n++;
        }
      }
      rough[j * w + i] = sum / n;
    }
  }
  return { i0, j0, w, h: hh, cell, x0: x0 + i0 * cell, z0: z0 + j0 * cell, s, slope, rough, seed: (cj - j0) * w + (ci - i0) };
}

// The cells reachable from the seed through cells `ok` says yes to, no
// further from `centre` than `reach`.
function grow(win, seed, ok, centre, reach) {
  const { w, h, cell, x0, z0 } = win;
  const out = new Uint8Array(w * h);
  if (!ok(seed)) return out;
  const stack = [seed];
  out[seed] = 1;
  while (stack.length) {
    const k = stack.pop();
    const i = k % w;
    const j = (k - i) / w;
    for (const [a, b] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) {
      if (a < 0 || b < 0 || a >= w || b >= h) continue;
      const n = b * w + a;
      if (out[n]) continue;
      if (Math.hypot(x0 + a * cell - centre[0], z0 + b * cell - centre[1]) > reach) continue;
      if (!ok(n)) continue;
      out[n] = 1;
      stack.push(n);
    }
  }
  return out;
}

// Cells tidied: each kept where most of its neighbours are (spurs and
// notches gone), holes filled, and only the patch holding the seed.
function tidy(win, cells, seed) {
  const { w, h } = win;
  const maj = new Uint8Array(w * h);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      let n = 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) if (cells[(j + dj) * w + (i + di)] && i + di >= 0 && j + dj >= 0 && i + di < w && j + dj < h) n++;
      maj[j * w + i] = n >= 5 ? 1 : 0;
    }
  }
  // Holes: whatever isn't set and can't be reached from the window's edge.
  const outside = new Uint8Array(w * h);
  const stack = [];
  for (let i = 0; i < w; i++) for (const j of [0, h - 1]) if (!maj[j * w + i]) stack.push(j * w + i);
  for (let j = 0; j < h; j++) for (const i of [0, w - 1]) if (!maj[j * w + i]) stack.push(j * w + i);
  for (const k of stack) outside[k] = 1;
  while (stack.length) {
    const k = stack.pop();
    const i = k % w;
    const j = (k - i) / w;
    for (const [a, b] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) {
      if (a < 0 || b < 0 || a >= w || b >= h) continue;
      const n = b * w + a;
      if (outside[n] || maj[n]) continue;
      outside[n] = 1;
      stack.push(n);
    }
  }
  const filled = new Uint8Array(w * h);
  for (let k = 0; k < w * h; k++) filled[k] = maj[k] || !outside[k] ? 1 : 0;
  // The patch with the seed (or the nearest cell set, if tidying took it).
  let start = seed;
  if (!filled[start]) {
    let best = Infinity;
    const si = seed % w;
    const sj = (seed - si) / w;
    for (let k = 0; k < w * h; k++) {
      if (!filled[k]) continue;
      const d = Math.hypot((k % w) - si, Math.floor(k / w) - sj);
      if (d < best) {
        best = d;
        start = k;
      }
    }
    if (best > 3) return null;
  }
  return { cells: grow({ ...win, cell: 1, x0: 0, z0: 0 }, start, (k) => filled[k] === 1, [start % w, Math.floor(start / w)], Infinity), start };
}

const count = (cells) => cells.reduce((n, v) => n + v, 0);

// Each cell's mean over the square r cells each way (as much of it as is
// on the grid), by a running sum.
function boxMean(v, w, h, r) {
  const sum = new Float64Array((w + 1) * (h + 1));
  for (let j = 0; j < h; j++) {
    let row = 0;
    for (let i = 0; i < w; i++) {
      row += v[j * w + i];
      sum[(j + 1) * (w + 1) + (i + 1)] = sum[j * (w + 1) + (i + 1)] + row;
    }
  }
  const out = new Float32Array(w * h);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const a = Math.max(0, i - r);
      const b = Math.max(0, j - r);
      const c = Math.min(w, i + r + 1);
      const d = Math.min(h, j + r + 1);
      const s = sum[d * (w + 1) + c] - sum[b * (w + 1) + c] - sum[d * (w + 1) + a] + sum[b * (w + 1) + a];
      out[j * w + i] = s / ((c - a) * (d - b));
    }
  }
  return out;
}

// Cells grown a cell each way.
function dilate(win, cells) {
  const { w, h } = win;
  const out = new Uint8Array(w * h);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      if (!cells[j * w + i]) continue;
      for (const [a, b] of [[i, j], [i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) if (a >= 0 && b >= 0 && a < w && b < h) out[b * w + a] = 1;
    }
  }
  return out;
}

// The outline of a patch of cells, on the course.
function outlineOf(win, cells, start, step) {
  const grid = { x0: win.x0 - win.cell / 2, z0: win.z0 - win.cell / 2, cell: win.cell, nx: win.w, nz: win.h };
  return traceOutline(cells, grid, start, { step, smooth: 2 });
}

// The least oblong round a patch of cells (tried every 3 degrees): its
// corners, on the course.
function oblongRound(win, cells) {
  const pts = [];
  for (let k = 0; k < cells.length; k++) if (cells[k]) pts.push([win.x0 + (k % win.w) * win.cell, win.z0 + Math.floor(k / win.w) * win.cell]);
  let best = null;
  const half = win.cell / 2;
  for (let deg = 0; deg < 90; deg += 3) {
    const t = (deg * Math.PI) / 180;
    const u = [Math.cos(t), Math.sin(t)];
    const v = [-u[1], u[0]];
    let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
    for (const [x, z] of pts) {
      const a = x * u[0] + z * u[1];
      const b = x * v[0] + z * v[1];
      a0 = Math.min(a0, a);
      a1 = Math.max(a1, a);
      b0 = Math.min(b0, b);
      b1 = Math.max(b1, b);
    }
    const area = (a1 - a0 + 2 * half) * (b1 - b0 + 2 * half);
    if (!best || area < best.area) best = { area, u, v, a0: a0 - half, a1: a1 + half, b0: b0 - half, b1: b1 + half };
  }
  const { u, v, a0, a1, b0, b1 } = best;
  return [
    [a0, b0],
    [a1, b0],
    [a1, b1],
    [a0, b1],
  ].map(([a, b]) => [r2(u[0] * a + v[0] * b), r2(u[1] * a + v[1] * b)]);
}

// One shape picked off the ground: kind "green", "tee" or "bunker", tapped
// at `at` ([x, z]), the hole going `toward` (for a shape of the usual
// size). Returns { poly, found } - found false where it's the usual shape
// (and why: "coarse", the ground too coarse to show it; "none", nothing
// like one there).
export function pickShape(ground, kind, at, { toward = [1, 0] } = {}) {
  const spec = PICK[kind];
  const usual = (why) => ({ poly: usualShape(kind, at, toward), found: false, why });
  if (!ground || !spec) return usual("coarse");
  if (ground.cell > PICK.fine) return usual("coarse");
  const win = windowAt(ground, at, spec.reach + (spec.around ?? 0));
  if (!win) return usual("none");
  const cellArea = win.cell * win.cell;
  let cells;
  if (kind === "bunker" && spec.method === "dip") {
    // Ground lying below the ground round it - a bunker cut into a slope,
    // open on its low side, as well as a bowl: each cell against the mean
    // of the ground `around` metres each way (on an even slope, the same).
    const broad = boxMean(win.s, win.w, win.h, Math.max(1, Math.round(spec.around / win.cell)));
    const dip = (k) => win.s[k] - broad[k];
    let floor = win.seed;
    const si = floor % win.w;
    const sj = (floor - si) / win.w;
    const r = Math.ceil(spec.floor / win.cell);
    for (let j = Math.max(0, sj - r); j <= Math.min(win.h - 1, sj + r); j++) {
      for (let i = Math.max(0, si - r); i <= Math.min(win.w - 1, si + r); i++) if (dip(j * win.w + i) < dip(floor)) floor = j * win.w + i;
    }
    if (dip(floor) > -spec.deep) return usual("none");
    const centre = [win.x0 + (floor % win.w) * win.cell, win.z0 + Math.floor(floor / win.w) * win.cell];
    cells = grow(win, floor, (k) => dip(k) <= -spec.edge, centre, spec.reach);
    win.seed = floor;
  } else if (kind === "bunker") {
    // Down to its floor (the lowest ground near the tap), then the hollow
    // filled to just under where it would spill.
    let floor = win.seed;
    const si = floor % win.w;
    const sj = (floor - si) / win.w;
    const r = Math.ceil(spec.floor / win.cell);
    for (let j = Math.max(0, sj - r); j <= Math.min(win.h - 1, sj + r); j++) {
      for (let i = Math.max(0, si - r); i <= Math.min(win.w - 1, si + r); i++) if (win.s[j * win.w + i] < win.s[floor]) floor = j * win.w + i;
    }
    const base = win.s[floor];
    const centre = [win.x0 + (floor % win.w) * win.cell, win.z0 + Math.floor(floor / win.w) * win.cell];
    let kept = null;
    for (let level = base + 0.1; level <= base + spec.depth; level += 0.1) {
      const lvl = level;
      const c = grow(win, floor, (k) => win.s[k] <= lvl, centre, spec.reach + win.cell * 2);
      // Spilt: reached the edge of where a bunker can be, or too big.
      let edge = false;
      for (let k = 0; k < c.length && !edge; k++) {
        if (!c[k]) continue;
        const x = win.x0 + (k % win.w) * win.cell;
        const z = win.z0 + Math.floor(k / win.w) * win.cell;
        if (Math.hypot(x - centre[0], z - centre[1]) > spec.reach) edge = true;
      }
      if (edge || count(c) * cellArea > spec.most) break;
      kept = { c, level: lvl };
    }
    if (!kept || kept.level - base < 0.25) return usual("none");
    // Just inside the rim: the sand, not the bank's top.
    cells = grow(win, floor, (k) => win.s[k] <= kept.level - spec.rim, centre, spec.reach);
    win.seed = floor;
  } else {
    const h0 = win.s[win.seed];
    cells = grow(win, win.seed, (k) => win.slope[k] <= spec.slope && Math.abs(win.s[k] - h0) <= spec.fall && !(win.rough[k] > (spec.rough ?? Infinity)), at, spec.reach);
  }
  // (A green's or tee's edge is where its bank starts: the smoothing
  // blurs that a cell inwards, so it's given back.)
  if (kind !== "bunker") cells = dilate(win, cells);
  const t = tidy(win, cells, win.seed);
  if (!t) return usual("none");
  const area = count(t.cells) * cellArea;
  if (area < spec.least) return usual("none");
  if (kind === "tee") return { poly: oblongRound(win, t.cells), found: true };
  let poly = outlineOf(win, t.cells, t.start, kind === "green" ? 1.5 : 0.8);
  if (!poly || poly.length < 4) return usual("none");
  // Bigger than one: trimmed to the usual size's reach round the tap.
  if (area > spec.most) return usual("none");
  if (Math.abs(polygonArea(poly)) < spec.least * 0.8) return usual("none");
  poly = thin(chaikin(poly), kind === "green" ? 1.5 : 0.8);
  return { poly, found: true };
}
