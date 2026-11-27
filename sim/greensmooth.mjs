// A real green smooth and sensible, by sums alone (the owner, 24 November
// 2026, after playing Watling Pines and Auld Grey Links: the greens "aren't
// realistic" - smooth greens with limits on their slopes, unless a big
// slope is clearly meant; "sensible even if not exactly the same").
//
// A green from the map stands on the LiDAR: on Watling Pines the open 1 m
// model kept to the centimetre (a 1 cm step a metre is a 1% slope that
// isn't there), on Auld Grey Links its half-metre surveys (sim/finegreen.mjs).
// Either way the survey's noise, a mower's stripe or a footprint reads as
// slope, and a green's bank or a bunker's lip can run into its edge: as
// made, half of every green was steeper than 3% and the steepest spots
// were 20% and more. A real green is mostly 1 - 3%, rarely 4% where its
// architect put a tier or a big tilt in, and rolls off gently at its edge.
// So each green is worked again, as one grid shaped by hand is (the "gh"
// edit, sim/greensculpt.mjs), from the surface it had:
//
//   1. Smoothed at two sizes (smoothParts): the big shape - its tiers,
//      tilts, ridges and hollows, metres across - kept whole; what's
//      between a metre and that kept in part; anything finer (the survey's
//      noise) let go. Only the green and its fringe are averaged, so the
//      bank below a raised green doesn't drag its edge down.
//   2. Tilted no more than GREEN_SMOOTH.tilt as a whole (untilt): a green
//      on a hillside is built flatter than the hill, so only the tilt past
//      that is taken off - its tiers and rolls are left on it.
//   3. Its slopes held to a limit (limitSlopes): GREEN_SMOOTH.most
//      anywhere, up to GREEN_SMOOTH.tier only where the big shape slopes
//      one way for several metres together (allowedSlopes: a tier or a
//      tilt, not a bump). The limit is met by spreading a slope wider, not
//      by flattening it: a tier keeps its height, over a longer face.
//   4. Its fringe let fall off more (GREEN_SMOOTH.collar at its outer
//      edge), and beyond it the change eased away - over 3 m, or as much
//      wider as it takes to keep the bank it makes gentle - back to the
//      ground the hole had.
//
// Then the flags are put on puttable spots again (sim/finegreen.mjs
// puttableFlags), on the green as it now is.
//
// Pure: tools/realcourse.mjs and server/mapimport.mjs run it on every green
// from the map; tools/truegreens.mjs on a course already made.

import { CELL, FRINGE, editFromGrid, gridFromEdit, groundOf, sculptBox } from "./greensculpt.mjs";
import { smoothGrid } from "./finegreen.mjs";
import { insidePolygon, distanceToEdge, gridHeight } from "./terrain.mjs";
import { smoothstep01 } from "./mathutil.mjs";
import { addEdit } from "./holeedits.mjs";

export const GREEN_SMOOTH = {
  // The two sizes it's smoothed at (Gaussian sigma, metres): finer than
  // `fine` is noise; `big` and bigger is the green's own shape.
  fine: 1,
  big: 2.5,
  // The share kept of what lies between the two sizes.
  keep: 0.5,
  // The most a green as a whole may tilt (its best plane, a fall per
  // metre): one laid on a hillside is built flatter than the hill.
  tilt: 0.02,
  // The steepest a green may be anywhere (a fall per metre) - and where a
  // big slope is clearly meant, this much.
  most: 0.03,
  tier: 0.04,
  // A slope is "clearly meant" where the big shape falls one way over
  // `reach` metres (sigma) round it - its slopes there agree to `agree`
  // (the length of their mean against the mean of their lengths) - and
  // falls at least `from`, wholly so from `to`.
  reach: 2.5,
  agree: [0.6, 0.9],
  from: 0.025,
  to: 0.045,
  // On a green whose survey can be trusted that far (two half-metre
  // surveys that agree, of a course famous for its big greens: a course's
  // definition says so, as `greenSmooth`), a big shape clearly meant -
  // a hollow, a ridge, a green falling hard from the back - keeps its own
  // slope, up to this; only the bumps on it are let go. Off (null) unless
  // asked for.
  feature: null,
  // The steepest at the fringe's outer edge: it rolls off into the bank.
  collar: 0.08,
  // Beyond the fringe, the change eases away over at least `blend`
  // metres - wider where it's bigger, so the bank it makes back to the
  // ground falls no more than `bank` more than it did, out to `wide`
  // (as wide as a green's bank comes: sim/greensculpt.mjs).
  blend: 3,
  bank: 0.12,
  wide: 14,
  // A last, light smoothing of the creases a limit leaves (metres).
  finish: 0.5,
  // Round where the flag is wanted, gentle enough for a hole to be cut
  // (sim/finegreen.mjs FLAG.most, a hair under) out to `round` metres,
  // easing to the green's own limit by `ease` more.
  cup: { most: 0.024, round: 2, ease: 1.5 },
};

// (The limits are met along 16 directions: a slope across them can come out
// a hair steeper than along one, so they're held a little under.)
const ISOTROPY = 0.97;
const FREE = 10;

// ---- Slopes ----------------------------------------------------------------------

// The slope at every square of a grid (a fall per metre: central
// differences, one-sided at an edge or a gap). NaN where there's no height.
export function slopeField(h, nx, nz, cell) {
  const out = new Float32Array(h.length).fill(NaN);
  const at = (ix, iz) => (ix < 0 || iz < 0 || ix >= nx || iz >= nz ? NaN : h[iz * nx + ix]);
  const d = (a, c, b) => {
    if (Number.isFinite(a) && Number.isFinite(b)) return (b - a) / (2 * cell);
    if (Number.isFinite(b)) return (b - c) / cell;
    if (Number.isFinite(a)) return (c - a) / cell;
    return 0;
  };
  for (let iz = 0; iz < nz; iz++) {
    for (let ix = 0; ix < nx; ix++) {
      const c = at(ix, iz);
      if (!Number.isFinite(c)) continue;
      out[iz * nx + ix] = Math.hypot(d(at(ix - 1, iz), c, at(ix + 1, iz)), d(at(ix, iz - 1), c, at(ix, iz + 1)));
    }
  }
  return out;
}

// A grid's slopes over the squares `on` marks (all, without it), as
// percentages: { max, p95, mean, over (the share steeper than `over`, 3%
// unless said) }.
export function slopeStats(h, nx, nz, cell, on = null, over = 0.03) {
  const s = slopeField(h, nx, nz, cell);
  const v = [];
  for (let i = 0; i < s.length; i++) if ((!on || on[i]) && Number.isFinite(s[i])) v.push(s[i]);
  return statsOf(v, over);
}

// The same of a list of slopes (falls per metre).
export function statsOf(v, over = 0.03) {
  if (!v.length) return { max: 0, p95: 0, mean: 0, over: 0, n: 0 };
  const s = Float64Array.from(v).sort();
  const pc = (x) => Math.round(x * 10000) / 100;
  return { max: pc(s[s.length - 1]), p95: pc(s[Math.min(s.length - 1, Math.floor(s.length * 0.95))]), mean: pc(s.reduce((a, b) => a + b, 0) / s.length), over: Math.round((s.filter((x) => x > over).length / s.length) * 1000) / 10, n: s.length };
}

// ---- Smoothing ----------------------------------------------------------------------

// A grid smoothed at two sizes (GREEN_SMOOTH fine and big, metres) over the
// squares `on` marks only (the rest left as they were, and out of every
// average): the big shape, and `keep` of what's between the sizes.
export function smoothParts(h, nx, nz, cell, on, { fine = GREEN_SMOOTH.fine, big = GREEN_SMOOTH.big, keep = GREEN_SMOOTH.keep } = {}) {
  const masked = Float32Array.from(h, (v, i) => (on[i] ? v : NaN));
  const a = smoothGrid(masked, nx, nz, fine / cell);
  const b = smoothGrid(masked, nx, nz, big / cell);
  const out = Float32Array.from(h);
  for (let i = 0; i < h.length; i++) if (on[i]) out[i] = b[i] + keep * (a[i] - b[i]);
  return { h: out, big: b };
}

// How steep each square may be: GREEN_SMOOTH.most, rising to .tier where
// the big shape (`big`, a grid) falls one way for several metres together
// - a tier or a tilt the green was built with, not a bump (and, where
// .feature is set, up to the big shape's own slope where it's meant). NaN
// in `big` is off the green.
export function allowedSlopes(big, nx, nz, cell, { most = GREEN_SMOOTH.most, tier = GREEN_SMOOTH.tier, reach = GREEN_SMOOTH.reach, agree = GREEN_SMOOTH.agree, from = GREEN_SMOOTH.from, to = GREEN_SMOOTH.to, feature = GREEN_SMOOTH.feature } = {}) {
  const n = nx * nz;
  const gx = new Float32Array(n).fill(NaN);
  const gz = new Float32Array(n).fill(NaN);
  const len = new Float32Array(n).fill(NaN);
  const at = (ix, iz) => (ix < 0 || iz < 0 || ix >= nx || iz >= nz ? NaN : big[iz * nx + ix]);
  for (let iz = 0; iz < nz; iz++) {
    for (let ix = 0; ix < nx; ix++) {
      const i = iz * nx + ix;
      const c = big[i];
      if (!Number.isFinite(c)) continue;
      const l = at(ix - 1, iz), r = at(ix + 1, iz), u = at(ix, iz - 1), dn = at(ix, iz + 1);
      const dx = Number.isFinite(l) && Number.isFinite(r) ? (r - l) / (2 * cell) : Number.isFinite(r) ? (r - c) / cell : Number.isFinite(l) ? (c - l) / cell : 0;
      const dz = Number.isFinite(u) && Number.isFinite(dn) ? (dn - u) / (2 * cell) : Number.isFinite(dn) ? (dn - c) / cell : Number.isFinite(u) ? (c - u) / cell : 0;
      gx[i] = dx;
      gz[i] = dz;
      len[i] = Math.hypot(dx, dz);
    }
  }
  const mx = smoothGrid(gx, nx, nz, reach / cell);
  const mz = smoothGrid(gz, nx, nz, reach / cell);
  const ml = smoothGrid(len, nx, nz, reach / cell);
  const out = new Float32Array(n).fill(most);
  for (let i = 0; i < n; i++) {
    if (!Number.isFinite(ml[i]) || !(ml[i] > 0)) continue;
    const mean = Math.hypot(mx[i], mz[i]);
    const one = smoothstep01((mean / ml[i] - agree[0]) / (agree[1] - agree[0]));
    const steep = smoothstep01((mean - from) / (to - from));
    out[i] = most + (tier - most) * one * steep;
    // (A big shape trusted as surveyed: its own slope, where it's meant.)
    if (feature > tier && len[i] > tier) out[i] = Math.max(out[i], tier + (Math.min(feature, len[i] * 1.1) - tier) * one);
  }
  return out;
}

// A grid's best plane over the squares `on` marks: { x0, z0 (where it's
// measured from, in squares), gx, gz (its fall per square each way) }.
export function planeOf(h, nx, nz, on) {
  let n = 0, sx = 0, sz = 0, sh = 0;
  for (let i = 0; i < h.length; i++) if (on[i]) {
    const ix = i % nx;
    n++;
    sx += ix;
    sz += (i - ix) / nx;
    sh += h[i];
  }
  if (n < 3) return { x0: 0, z0: 0, gx: 0, gz: 0, mean: n ? sh / n : 0 };
  const cx = sx / n, cz = sz / n, mean = sh / n;
  let xx = 0, xz = 0, zz = 0, xh = 0, zh = 0;
  for (let i = 0; i < h.length; i++) if (on[i]) {
    const ix = i % nx;
    const dx = ix - cx, dz = (i - ix) / nx - cz, dh = h[i] - mean;
    xx += dx * dx; xz += dx * dz; zz += dz * dz; xh += dx * dh; zh += dz * dh;
  }
  const det = xx * zz - xz * xz;
  if (Math.abs(det) < 1e-9) return { x0: cx, z0: cz, gx: 0, gz: 0, mean };
  return { x0: cx, z0: cz, gx: (xh * zz - zh * xz) / det, gz: (zh * xx - xh * xz) / det, mean };
}

// A grid tilted back to no more than `most` (a fall per metre) as a whole,
// over the squares `on` marks (measured over those `inside`: the green
// itself): only the part of its best plane past that taken off, about the
// green's middle. Returns { h, was (its tilt), now }.
export function untilt(h, nx, nz, cell, on, inside = on, most = GREEN_SMOOTH.tilt) {
  const p = planeOf(h, nx, nz, inside);
  const was = Math.hypot(p.gx, p.gz) / cell;
  const out = Float32Array.from(h);
  if (!(was > most)) return { h: out, was, now: was };
  const k = 1 - most / was;
  for (let i = 0; i < h.length; i++) if (on[i]) {
    const ix = i % nx;
    out[i] -= k * (p.gx * (ix - p.x0) + p.gz * ((i - ix) / nx - p.z0));
  }
  return { h: out, was, now: most };
}

// The 16 ways a limit is carried from square to square (and their lengths, in squares).
const STEPS = [[1, 0], [0, 1], [1, 1], [1, -1], [2, 1], [1, 2], [2, -1], [1, -2]].flatMap(([a, b]) => [[a, b], [-a, -b]]).map(([a, b]) => [a, b, Math.hypot(a, b)]);

// A grid whose slopes are held to `limit` (a fall per metre, a grid or one
// number) over the squares `on` marks - by the mean of its highest and
// lowest surfaces that stay within the limit below and above it (each the
// nearest such to the grid, carried only through the squares on): a
// slope no steeper than the limit is left exactly as it was, and a steeper
// one is spread wider about its middle, keeping the height it falls. The
// squares not on are left as they were.
export function limitSlopes(h, nx, nz, cell, on, limit, { sweeps = 60 } = {}) {
  const L = typeof limit === "number" ? null : limit;
  const lim = (i) => (L ? L[i] : limit) * ISOTROPY * cell;
  const up = Float32Array.from(h);
  const down = Float32Array.from(h);
  const relax = (g, sign) => {
    for (let s = 0; s < sweeps; s++) {
      let changed = false;
      const pass = (forward) => {
        for (let k = 0; k < nx * nz; k++) {
          const i = forward ? k : nx * nz - 1 - k;
          if (!on[i]) continue;
          const ix = i % nx;
          const iz = (i - ix) / nx;
          let v = g[i];
          for (const [dx, dz, d] of STEPS) {
            const jx = ix + dx;
            const jz = iz + dz;
            if (jx < 0 || jz < 0 || jx >= nx || jz >= nz) continue;
            const j = jz * nx + jx;
            if (!on[j]) continue;
            const w = ((lim(i) + lim(j)) / 2) * d;
            const c = g[j] + sign * w;
            if (sign > 0 ? c < v : c > v) v = c;
          }
          if (v !== g[i]) {
            if (Math.abs(v - g[i]) > 1e-7) changed = true;
            g[i] = v;
          }
        }
      };
      pass(true);
      pass(false);
      if (!changed) break;
    }
  };
  relax(up, 1);
  relax(down, -1);
  const out = Float32Array.from(h);
  for (let i = 0; i < out.length; i++) if (on[i]) out[i] = (up[i] + down[i]) / 2;
  return out;
}

// ---- A green --------------------------------------------------------------------------

// A green's surface worked again (the three steps above), over a grid of
// heights `h` and how far each square is inside the green (`depth`, metres,
// negative outside): the green and its fringe smoothed and limited (gentle
// enough for a hole round `opts.flags`), the change eased away beyond. Returns { h, limit (each square's), on (the
// green and its fringe) }.
export function smoothGreen(h, nx, nz, cell, depth, opts = {}) {
  const o = { ...GREEN_SMOOTH, ...opts };
  const n = nx * nz;
  const on = new Uint8Array(n);
  for (let i = 0; i < n; i++) on[i] = depth[i] >= -FRINGE && Number.isFinite(h[i]) ? 1 : 0;
  const inside = Uint8Array.from(depth, (d, i) => (on[i] && d >= 0 ? 1 : 0));
  const parts = smoothParts(h, nx, nz, cell, on, o);
  const flat = untilt(parts.h, nx, nz, cell, on, inside, o.tilt);
  const big = untilt(parts.big, nx, nz, cell, on, inside, o.tilt).h;
  const allowed = allowedSlopes(Float32Array.from(big, (v, i) => (on[i] ? v : NaN)), nx, nz, cell, o);
  // The fringe falls off more, to `collar` at its outer edge.
  const limit = new Float32Array(n).fill(FREE);
  for (let i = 0; i < n; i++) {
    if (!on[i]) continue;
    const t = depth[i] >= 0 ? 0 : smoothstep01(-depth[i] / FRINGE);
    limit[i] = allowed[i] + (o.collar - allowed[i]) * t;
  }
  // Where the flags are wanted (`flags`: [[ix, iz], ...] in squares).
  for (const [fx, fz] of o.flags ?? []) {
    const r = Math.ceil((o.cup.round + o.cup.ease) / cell);
    for (let iz = Math.max(0, Math.floor(fz) - r); iz <= Math.min(nz - 1, Math.ceil(fz) + r); iz++) {
      for (let ix = Math.max(0, Math.floor(fx) - r); ix <= Math.min(nx - 1, Math.ceil(fx) + r); ix++) {
        const i = iz * nx + ix;
        if (!on[i]) continue;
        const t = smoothstep01((Math.hypot(ix - fx, iz - fz) * cell - o.cup.round) / o.cup.ease);
        limit[i] = Math.min(limit[i], o.cup.most + (limit[i] - o.cup.most) * t);
      }
    }
  }
  let s = limitSlopes(flat.h, nx, nz, cell, on, limit);
  s = smoothGrid(Float32Array.from(s, (v, i) => (on[i] ? v : NaN)), nx, nz, o.finish / cell);
  s = limitSlopes(Float32Array.from(s, (v, i) => (on[i] ? v : h[i])), nx, nz, cell, on, limit);
  // Set back to the height it stood at (a limit meets in the middle: a
  // green whose bank ran into its edge would come down towards it).
  let shift = 0;
  let k = 0;
  for (let i = 0; i < n; i++) if (inside[i]) {
    shift += flat.h[i] - s[i];
    k++;
  }
  if (k) for (let i = 0; i < n; i++) if (on[i]) s[i] += shift / k;
  // Beyond the fringe: the change carried out from its edge and eased away.
  const delta = new Float32Array(n);
  const known = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (on[i]) {
    delta[i] = s[i] - h[i];
    known[i] = 1;
  }
  const room = Math.min(o.wide, o.room ?? o.wide);
  const reach = Math.ceil((room + 1) / cell);
  for (let pass = 0; pass < reach; pass++) {
    const next = [];
    for (let i = 0; i < n; i++) {
      if (known[i]) continue;
      const ix = i % nx;
      let sum = 0;
      let k = 0;
      for (const j of [ix > 0 ? i - 1 : -1, ix < nx - 1 ? i + 1 : -1, i - nx, i + nx]) {
        if (j < 0 || j >= n || !known[j]) continue;
        sum += delta[j];
        k++;
      }
      if (k) next.push([i, sum / k]);
    }
    for (const [i, v] of next) {
      delta[i] = v;
      known[i] = 1;
    }
  }
  const out = Float32Array.from(h);
  for (let i = 0; i < n; i++) {
    if (on[i]) out[i] = s[i];
    else if (known[i] && Number.isFinite(h[i])) {
      const width = Math.min(room, Math.max(o.blend, Math.abs(delta[i]) / o.bank));
      out[i] = h[i] + delta[i] * smoothstep01(1 - (-depth[i] - FRINGE) / width);
    }
  }
  return { h: out, limit, on, tilt: { was: flat.was, now: flat.now } };
}

// A mapped hole's green worked again, as the edit that lays it on (a "gh"
// grid over the box a green is played on: greensculpt sculptBox). From the
// surface the green has now: its ground and any grid it has already (a
// green at the LiDAR's own half metre) - kept gentle round its flag. `stored`: the hole as kept. Returns
// { edit, before, after (slopeStats over the green itself) } - edit null
// for a hole that isn't from the map, or a green shaped by hand with
// shapes stamped on it (that's the player's own).
export function smoothGreenEdit(stored, opts = {}) {
  const poly = stored?.green?.poly;
  if (stored?.source !== "map" || !stored.terrain || !poly) return { edit: null };
  const was = [...(stored.edits ?? [])].reverse().find((e) => e?.k === "gh");
  const grid = was ? gridFromEdit(was) : null;
  if (was && (!grid || grid.stamps.length)) return { edit: null };
  const box = sculptBox(stored.green);
  const { nx, nz } = box;
  const ground = groundOf(stored);
  const lift = (x, z) => (grid ? gridHeight({ x0: grid.x0, z0: grid.z0, cell: CELL, nx: grid.nx, nz: grid.nz, h: grid.h }, x, z) : 0);
  const h = new Float32Array(nx * nz);
  const g0 = new Float32Array(nx * nz);
  const depth = new Float32Array(nx * nz);
  const inside = new Uint8Array(nx * nz);
  for (let iz = 0; iz < nz; iz++) {
    for (let ix = 0; ix < nx; ix++) {
      const x = box.x0 + ix * CELL;
      const z = box.z0 + iz * CELL;
      const i = iz * nx + ix;
      g0[i] = ground(x, z);
      h[i] = g0[i] + lift(x, z);
      const d = distanceToEdge(poly, x, z);
      inside[i] = insidePolygon(poly, x, z) ? 1 : 0;
      depth[i] = inside[i] ? d : -d;
    }
  }
  const flags = Array.isArray(stored.pin) ? [[(stored.pin[0] - box.x0) / CELL, (stored.pin[1] - box.z0) / CELL]] : [];
  const made = smoothGreen(h, nx, nz, CELL, depth, { room: box.pad - FRINGE - CELL, flags, ...opts });
  const g = { x0: box.x0, z0: box.z0, nx, nz, stamps: [], h: Float32Array.from(made.h, (v, i) => v - g0[i]) };
  return { edit: editFromGrid(g), before: slopeStats(h, nx, nz, CELL, inside), after: slopeStats(made.h, nx, nz, CELL, inside) };
}

// Every green of a course from the map worked again (smoothGreenEdit), on
// the holes `only(hole, index)` says (all, without it), with `opts` in
// place of any of GREEN_SMOOTH's (a course definition's greenSmooth). Returns [{ hole,
// green: { before, after } | null }].
export function smoothGreens(holes, only = () => true, opts = {}) {
  return holes.map((h, i) => {
    if (!only(h, i)) return { hole: h, green: null };
    const made = smoothGreenEdit(h.layout, opts);
    if (!made.edit) return { hole: h, green: null };
    return { hole: { ...h, layout: addEdit(h.layout, made.edit) }, green: { before: made.before, after: made.after } };
  });
}
