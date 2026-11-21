// Real trees from LiDAR. A surface model (DSM: the first thing the laser
// hit - treetops, roofs) less the ground under it leaves the height of
// whatever stands there, the canopy. Each tree is a peak in it, and its
// crown the patch round the peak that falls away from it. Roofs are peaks
// too, but mostly at one height or on one plane; poles, wires and nets are
// peaks with next to nothing round them. Pure: the server samples the files
// onto a hole's 1 m grid and hands the heights in (see server/lidar.mjs).

import { KIND } from "./treeshapes.mjs";

// Shorter than this is a bush, taller a mast or a bird.
export const MIN_TREE = 3;
const MAX_TREE = 60;
// Canopy lower than this is grass, or the gap under a crown.
const CROWN_EDGE = 2;
// A roof: at least this much of the patch grown from its top (square
// metres), with half of it or more within ROOF_BAND (metres) of one height
// and a solid piece of that - a crown falls away from its top, so only a
// thin ring of it is ever at one height. Or all of it on one plane, to
// within ROOF_PLANE (RMS, metres), which no crown is.
const ROOF_AREA = 8;
const ROOF_BAND = 0.4;
const ROOF_SHARE = 0.5;
const ROOF_PLANE = 0.12;
// A wire, fence or net: a patch no more than about three metres across
// (spread, as a standard deviation) and much longer than it is wide.
const LINE_WIDTH = 0.95;
const LINE_RATIO = 2.2;
// A pole or a mast: taller than this many times its crown's radius - unless
// it's a column of leaves (a Lombardy poplar, an Italian cypress): at least
// COLUMN_AREA square metres of it, no slimmer than COLUMN_SLIMMEST, solid a
// metre out from its top (COLUMN_SOLID of its height, three ways of four) and rounded
// over the top (falling COLUMN_ROUND of its height in that metre), which a
// post, a mast or a floodlight's flat head isn't. (A phantom tree in play
// is the worse mistake: anything less sure is left out.)
const SLIMMEST = 10;
const COLUMN_AREA = 5;
const COLUMN_SLIMMEST = 20;
const COLUMN_SOLID = 0.55;
const COLUMN_ROUND = 0.02;
const COLUMN_HEIGHT = [8, 35];
// A tree this slim (height over crown radius), this tall and rounded over
// the top (falling less than POPLAR_POINT of its height in a metre, most
// ways - a
// conifer's tip is sharper) is a poplar.
const POPLAR_SLIM = 6;
const POPLAR_TALL = 12;
const POPLAR_POINT = 0.12;
// And no wider than this round (metres): a Lombardy poplar's crown is
// 3-5 m across, 7 m with its fringes; a big cypress is much wider.
const POPLAR_WIDEST = 3.5;
// A net or a lattice: this share of its patch or more is see-through, down
// near the ground (a crown is solid at a metre).
const SEE_THROUGH = 0.2;
// Or this share of its upper half on a line: high two cells either way
// along it, low two cells either way across it (a crown, wide or slim, is
// much the same every way from its middle).
const ON_A_LINE = 0.35;
// A spike on something lower - a post on a net, a mast in a hedge: less of
// its patch than this stands half as high as its top. (A crown's upper
// half is most of it; 0.5 or more for 99% of the trees at Harding Park.)
const BULK = 0.3;

// The tree models in look/trees.js at scale 1 (sim/treeshapes.mjs KINDS):
// kind 0 a pine about 10 m tall with a crown 3.3 m round, kind 1 a
// broadleaf 8.9 m tall, 4.4 m round; then a silver birch, tall and narrow;
// a weeping willow, low and wide; a Lombardy poplar, a tall column; a bush.
// (LiDAR finds pines, broadleaves and poplars by their shape; a low,
// spreading broadleaf by the water is drawn as a willow - modelTree.)
// And after them (never renumbered) the newer kinds: a Scots pine, a
// spreading oak, a column conifer, a spruce and a dead snag. An import
// from now on tells an oak (a wide, low broadleaf), a spruce (a tall,
// slim, pointed conifer) and a column conifer (a slim one rounded over
// the top) by their measured shape (findTrees); files imported before
// keep the kinds they were found with.
export const TREE_KINDS = [
  { name: "pine", height: 10, radius: 3.3 },
  { name: "broadleaf", height: 8.9, radius: 4.4 },
  { name: "birch", height: 12, radius: 2.4 },
  { name: "willow", height: 8.5, radius: 5 },
  { name: "poplar", height: 17, radius: 2.1 },
  { name: "bush", height: 1.9, radius: 1.8 },
  { name: "scots", height: 12.8, radius: 3.8 },
  { name: "oak", height: 10.4, radius: 6.3 },
  { name: "column", height: 9.6, radius: 1.8 },
  { name: "spruce", height: 14.5, radius: 2.5 },
  { name: "snag", height: 7.9, radius: 1.6 },
  // And the latest (never found by LiDAR: grown on a course, or planted by
  // hand): a beech, a horse chestnut, a cedar of Lebanon, a holly, a
  // hawthorn.
  { name: "beech", height: 13.4, radius: 5.8 },
  { name: "chestnut", height: 12.6, radius: 5.6 },
  { name: "cedar", height: 10.6, radius: 6.8 },
  { name: "holly", height: 6.6, radius: 2.8 },
  { name: "hawthorn", height: 6.4, radius: 3.2 },
];

// Which found conifers and broadleaves are the newer kinds (findTrees,
// only where the file is fine enough to show a crown's shape): an oak is
// a broadleaf at least half as wide as it is tall, 8 - 22 m; a spruce a
// pointed conifer 18 m or more and under a fifth as wide as it's tall; a
// column conifer a slim conifer (under a quarter as wide) rounded over its
// top, shorter than a poplar.
export const SORT = { oakSpread: 0.5, oakHeight: [8, 22], spruceTall: 18, spruceSlim: 0.2, columnSlim: 0.25, columnHeight: [5, 12] };

// How far round a peak of height h (metres) there may be no higher one for
// it to count as a treetop: small trees stand close, big ones spread.
export const searchRadius = (h) => Math.min(5, Math.max(2, 1.5 + 0.1 * h));
// How far a crown may reach from its top.
const crownReach = (h) => Math.min(12, Math.max(2.5, 0.45 * h + 1));

const quantile = (values, q) => {
  const a = Float32Array.from(values).sort();
  return a.length ? a[Math.min(a.length - 1, Math.floor(q * a.length))] : 0;
};

// The height difference between a surface model and the ground it's laid
// over - two surveys can measure from different zero heights. On open
// playing surfaces (fairways, greens, tees) the two should agree, so it's
// the median difference there. With too few of those, it's the ground
// showing through wherever the surface model covers: the tightest cluster
// of differences in their lower part (bare ground agrees to a few
// centimetres; canopy is spread over metres), so a model that only covers
// a wood still finds the ground between its trees.
// dsm, ground: heights per cell (NaN where the DSM has none); open: 1 for a
// playing surface. Returns { offset, from: "open" | "low" | null }.
export function datumOffset(dsm, ground, open) {
  const onOpen = [];
  const all = [];
  for (let i = 0; i < dsm.length; i++) {
    if (!Number.isFinite(dsm[i]) || !Number.isFinite(ground[i])) continue;
    const d = dsm[i] - ground[i];
    if (open?.[i]) onOpen.push(d);
    if (i % 3 === 0) all.push(d);
  }
  if (onOpen.length >= 200) return { offset: quantile(onOpen, 0.5), from: "open" };
  if (all.length >= 200) return { offset: lowMode(all), from: "low" };
  return { offset: 0, from: null };
}

// The middle of the tightest run of values (a twentieth of them) in their
// lowest 60%.
export function lowMode(values) {
  const a = Float32Array.from(values).sort();
  const n = a.length;
  const k = Math.max(10, Math.floor(n / 20));
  const last = Math.max(k, Math.floor(n * 0.6));
  let best = 0;
  for (let i = 1; i + k - 1 < Math.min(n, last); i++) if (a[i + k - 1] - a[i] < a[best + k - 1] - a[best]) best = i;
  return a[best + (k >> 1)] ?? 0;
}

// A light blur ([1 2 1] each way) that skips cells with no data.
function blur(c, nx, nz) {
  const out = new Float32Array(c.length).fill(NaN);
  const k = [1, 2, 1];
  for (let iz = 0; iz < nz; iz++) {
    for (let ix = 0; ix < nx; ix++) {
      const i = iz * nx + ix;
      if (!Number.isFinite(c[i])) continue;
      let s = 0;
      let w = 0;
      for (let dz = -1; dz <= 1; dz++) {
        const zz = iz + dz;
        if (zz < 0 || zz >= nz) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = ix + dx;
          if (xx < 0 || xx >= nx) continue;
          const v = c[zz * nx + xx];
          if (!Number.isFinite(v)) continue;
          const kw = k[dx + 1] * k[dz + 1];
          s += v * kw;
          w += kw;
        }
      }
      out[i] = s / w;
    }
  }
  return out;
}

// Offsets within a radius (cells), for scanning round a cell.
const discs = new Map();
function disc(r) {
  const key = Math.round(r * 100);
  if (!discs.has(key)) {
    const out = [];
    const n = Math.ceil(r);
    for (let dz = -n; dz <= n; dz++) for (let dx = -n; dx <= n; dx++) if (dx * dx + dz * dz <= r * r && (dx || dz)) out.push([dx, dz]);
    discs.set(key, out);
  }
  return discs.get(key);
}

// A max-heap of cells by height, for growing crowns downhill from their tops.
class Heap {
  constructor() {
    this.keys = [];
    this.cells = [];
  }
  get size() {
    return this.cells.length;
  }
  push(key, cell) {
    const k = this.keys;
    const c = this.cells;
    let i = c.length;
    k.push(key);
    c.push(cell);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (k[p] >= key) break;
      k[i] = k[p];
      c[i] = c[p];
      i = p;
    }
    k[i] = key;
    c[i] = cell;
  }
  pop() {
    const k = this.keys;
    const c = this.cells;
    const top = c[0];
    const lastK = k.pop();
    const lastC = c.pop();
    if (c.length) {
      let i = 0;
      for (;;) {
        let j = 2 * i + 1;
        if (j >= c.length) break;
        if (j + 1 < c.length && k[j + 1] > k[j]) j++;
        if (k[j] <= lastK) break;
        k[i] = k[j];
        c[i] = c[j];
        i = j;
      }
      k[i] = lastK;
      c[i] = lastC;
    }
    return top;
  }
}

// The trees standing on a grid of canopy heights.
//   canopy     metres above the ground per cell, row by row (iz * nx + ix);
//              NaN where the surface model has no data
//   excluded   1 where no tree may stand: playing surfaces, water, sand,
//              buildings (optional)
//   walls      1 where no crown may spread: mapped buildings (optional)
//   edge       true if the grid reaches past where trees are wanted (by
//              more than a crown), so any crown the grid's edge cuts off
//              is left out rather than kept as a sliver of a tree
// Returns { trees, crowns }: trees [{ ix, iz, h, r, kind }] - where it
// stands in cells (fractional: the middle of its crown), its height and
// crown radius in metres, kind 0 pine / 1 broadleaf / 4 poplar by the
// crown's shape -
// and crowns, the number of the tree (from 1) whose crown covers each cell,
// 0 for none.
export function findTrees({ nx, nz, cell = 1, canopy, excluded = null, walls = null, edge = false }) {
  const n = nx * nz;
  const raw = new Float32Array(n);
  for (let i = 0; i < n; i++) raw[i] = Number.isFinite(canopy[i]) ? Math.max(0, canopy[i]) : NaN;
  const s = blur(raw, nx, nz);
  const at = (a, ix, iz) => (ix < 0 || iz < 0 || ix >= nx || iz >= nz ? NaN : a[iz * nx + ix]);

  // Tops: cells higher than everything within the search radius. Heights
  // are compared to 5 cm, and ties go to the first cell, so a flat roof
  // (or a flat-topped crown) gives one top, not one per speck of noise.
  const q = new Int32Array(n);
  for (let i = 0; i < n; i++) q[i] = Number.isFinite(s[i]) ? Math.round(s[i] * 20) : -1;
  const tops = [];
  for (let iz = 0; iz < nz; iz++) {
    for (let ix = 0; ix < nx; ix++) {
      const i = iz * nx + ix;
      const v = s[i];
      if (!(v >= MIN_TREE)) continue;
      let top = true;
      for (const [dx, dz] of disc(searchRadius(v) / cell)) {
        const xx = ix + dx;
        const zz = iz + dz;
        if (xx < 0 || zz < 0 || xx >= nx || zz >= nz) continue;
        const w = q[zz * nx + xx];
        if (w > q[i] || (w === q[i] && dz * nx + dx < 0)) {
          top = false;
          break;
        }
      }
      if (top) tops.push(i);
    }
  }
  tops.sort((a, b) => s[b] - s[a]);

  const kept = [];
  for (const i of tops) {
    const ix = i % nx;
    const iz = (i - ix) / nx;
    if (excluded?.[i]) continue;
    // Its true height: the highest return round the top.
    let h = 0;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) h = Math.max(h, at(raw, ix + dx, iz + dz) || 0);
    if (h < MIN_TREE || h > MAX_TREE) continue;
    // Something with a body, not a pole, a wire or a stray return: the
    // cells either side of the top, both ways, stand well up too. (Only
    // the four beside it - a slim crown sampled at cell centres can fall
    // away fast enough to leave its corners low.)
    let full = 0;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (at(raw, ix + dx, iz + dz) >= 0.3 * h) full++;
    if (full < 3) continue;
    // Two tops of one crown, unless the canopy dips between them.
    const same = kept.some((k) => {
      const d = Math.hypot(k.ix - ix, k.iz - iz);
      if (d * cell > crownReach(s[i])) return false;
      const steps = Math.ceil(d * 2);
      let low = Infinity;
      for (let t = 1; t < steps; t++) {
        const f = t / steps;
        low = Math.min(low, at(s, Math.round(ix + (k.ix - ix) * f), Math.round(iz + (k.iz - iz) * f)) || 0);
      }
      return low >= 0.85 * s[i];
    });
    if (same) continue;
    kept.push({ i, ix, iz, h });
  }

  // Crowns: grown from each top downhill, highest cells first, as far as
  // its reach, until the canopy drops to the crown's edge.
  const label = new Int32Array(n);
  const heap = new Heap();
  kept.forEach((t, k) => {
    label[t.i] = k + 1;
    heap.push(s[t.i], t.i);
  });
  while (heap.size) {
    const i = heap.pop();
    const t = kept[label[i] - 1];
    const floor = Math.max(CROWN_EDGE, 0.25 * t.h);
    const reach = crownReach(t.h) / cell;
    const ix = i % nx;
    const iz = (i - ix) / nx;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const xx = ix + dx;
      const zz = iz + dz;
      if (xx < 0 || zz < 0 || xx >= nx || zz >= nz) continue;
      const j = zz * nx + xx;
      if (label[j] || walls?.[j] || !(s[j] >= floor) || s[j] > s[i] + 0.3) continue;
      if (Math.hypot(xx - t.ix, zz - t.iz) > reach) continue;
      label[j] = label[i];
      heap.push(s[j], j);
    }
  }

  // Each crown's cells, to measure it by.
  const start = new Int32Array(kept.length + 2);
  for (let i = 0; i < n; i++) if (label[i]) start[label[i] + 1]++;
  for (let k = 1; k < start.length; k++) start[k] += start[k - 1];
  const cells = new Int32Array(start[kept.length + 1]);
  const fillAt = start.slice();
  for (let i = 0; i < n; i++) if (label[i]) cells[fillAt[label[i]]++] = i;

  // A patch of a few cells is a stray bit of something else, a long thin
  // or see-through one a wire, fence or net, a tall slim one (or a spike
  // on something lower) a pole, and one mostly at one height (or on one
  // plane) a roof: none of them a tree, nor any canopy.
  const number = new Int32Array(kept.length + 1);
  const trees = [];
  kept.forEach((t, k) => {
    const mine = cells.subarray(start[k + 1], start[k + 2]);
    const area = mine.length;
    if (area * cell * cell < 3) return;
    let sx = 0;
    let sz = 0;
    let sh = 0;
    let ring = 0;
    let ringN = 0;
    let clipped = false;
    let low = 0;
    let upper = 0;
    let lined = 0;
    for (const i of mine) {
      const ix = i % nx;
      const iz = (i - ix) / nx;
      sx += ix;
      sz += iz;
      sh += raw[i];
      if (raw[i] < 0.15 * t.h) low++;
      if (raw[i] >= 0.5 * t.h) {
        upper++;
        if (onLine(ix, iz)) lined++;
      }
      if (ix === 0 || iz === 0 || ix === nx - 1 || iz === nz - 1) clipped = true;
      const d = Math.hypot(ix - t.ix, iz - t.iz) * cell;
      if (d >= 1.5 && d <= 2.5) {
        ring += raw[i];
        ringN++;
      }
    }
    // Cut off by the edge of the grid: a piece of a tree beyond it.
    if (clipped && edge) return;
    if (low >= SEE_THROUGH * area || lined >= ON_A_LINE * upper || upper < BULK * area) return;
    const mx = sx / area;
    const mz = sz / area;
    const mh = sh / area;
    let xx = 0;
    let zz = 0;
    let xz = 0;
    let xh = 0;
    let zh = 0;
    for (const i of mine) {
      const ix = i % nx;
      const dx = ix - mx;
      const dz = (i - ix) / nx - mz;
      xx += dx * dx;
      zz += dz * dz;
      xz += dx * dz;
      xh += dx * (raw[i] - mh);
      zh += dz * (raw[i] - mh);
    }
    // Its spread each way (the cells' own width included).
    const a = xx / area + 1 / 12;
    const c = zz / area + 1 / 12;
    const b = xz / area;
    const half = Math.sqrt(((a - c) / 2) ** 2 + b * b);
    const major = Math.sqrt((a + c) / 2 + half) * cell;
    const minor = Math.sqrt(Math.max(0, (a + c) / 2 - half)) * cell;
    if (minor < LINE_WIDTH && major > LINE_RATIO * minor) return;
    if (area * cell * cell >= ROOF_AREA && isRoof(mine, xx, zz, xz, xh, zh, mx, mz, mh)) return;
    const r = Math.sqrt((area * cell * cell) / Math.PI);
    // How far it falls a metre out from its top, the least of the four
    // ways and on average, as a share of its height.
    const beside = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => at(raw, t.ix + dx, t.iz + dz) || 0);
    const shoulder = (t.h - beside.reduce((a, v) => a + v, 0) / 4) / t.h;
    // And the three ways it falls least (a top off the middle of its cell
    // falls further the fourth way): a conifer's tip falls fast every way.
    const tip = (t.h - (beside.reduce((a, v) => a + v, 0) - Math.min(...beside)) / 3) / t.h;
    const column =
      cell <= 1.5 &&
      area * cell * cell >= COLUMN_AREA &&
      t.h >= COLUMN_HEIGHT[0] &&
      t.h <= COLUMN_HEIGHT[1] &&
      t.h <= COLUMN_SLIMMEST * r &&
      beside.filter((v) => v >= COLUMN_SOLID * t.h).length >= 3 &&
      shoulder >= COLUMN_ROUND &&
      upper >= 0.6 * area;
    if (t.h > SLIMMEST * r && !column) return;
    // Where the trunk goes: the middle of the crown (crowns lean), unless
    // that's somewhere no tree may be.
    let cx = mx;
    let cz = mz;
    if (excluded?.[Math.round(cz) * nx + Math.round(cx)]) {
      cx = t.ix;
      cz = t.iz;
    }
    // A conifer is slim, or pointed: it falls away steeply from its tip.
    // Broadleaf crowns are wide and rounded.
    const drop = ringN ? (t.h - ring / ringN) / t.h : 1;
    const pine = r / t.h < 0.22 || (drop > 0.2 && r / t.h < 0.45);
    // A column rounded over the top: a poplar.
    const poplar = t.h > SLIMMEST * r || (t.h >= POPLAR_TALL && t.h > POPLAR_SLIM * r && tip < POPLAR_POINT && r <= POPLAR_WIDEST && cell <= 1.5);
    let kind = poplar ? KIND.poplar : pine ? KIND.pine : KIND.leaf;
    // The newer kinds, where the crown's shape shows (SORT).
    if (cell <= 1.5) {
      const slim = r / t.h;
      if (kind === KIND.leaf && slim >= SORT.oakSpread && t.h >= SORT.oakHeight[0] && t.h <= SORT.oakHeight[1]) kind = KIND.oak;
      else if (kind === KIND.pine && slim < SORT.columnSlim && tip < POPLAR_POINT && t.h >= SORT.columnHeight[0] && t.h < SORT.columnHeight[1]) kind = KIND.column;
      else if (kind === KIND.pine && slim < SORT.spruceSlim && tip >= POPLAR_POINT && t.h >= SORT.spruceTall) kind = KIND.spruce;
    }
    trees.push({ ix: cx, iz: cz, h: t.h, r, kind });
    number[k + 1] = trees.length;
  });
  for (let i = 0; i < n; i++) if (label[i]) label[i] = number[label[i]];
  return { trees, crowns: label };

  // A cell on a thin line of canopy (a net, a fence, a wire): along one of
  // the four ways through it the cells two away are both well up, and
  // across it both well down.
  function onLine(ix, iz) {
    const v = raw[iz * nx + ix];
    for (const [dx, dz] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
      const a = at(raw, ix + 2 * dx, iz + 2 * dz);
      const b = at(raw, ix - 2 * dx, iz - 2 * dz);
      if (!(a >= 0.6 * v && b >= 0.6 * v)) continue;
      const c = at(raw, ix - 2 * dz, iz + 2 * dx);
      const d = at(raw, ix + 2 * dz, iz - 2 * dx);
      if (c <= 0.3 * v && d <= 0.3 * v) return true;
    }
    return false;
  }

  // A roof: half or more of the patch within ROOF_BAND of one height, with
  // a solid piece of it (a cell of the patch ringed by others at that
  // height) - a flat roof, with or without a parapet, plant or a stair
  // tower standing on it - or the whole patch on one plane.
  function isRoof(mine, xx, zz, xz, xh, zh, mx, mz, mh) {
    const hs = new Float32Array(mine.length);
    for (let k = 0; k < mine.length; k++) hs[k] = raw[mine[k]];
    hs.sort();
    let most = 0;
    let lo = 0;
    for (let j = 0, i = 0; i < hs.length; i++) {
      while (hs[i] - hs[j] > ROOF_BAND) j++;
      if (i - j + 1 > most) {
        most = i - j + 1;
        lo = hs[j];
      }
    }
    if (most >= ROOF_SHARE * mine.length) {
      // (The roof may carry on past the patch, which stops at a crown's
      // reach from its top.)
      const inBand = (j) => raw[j] >= lo && raw[j] <= lo + ROOF_BAND;
      for (const i of mine) {
        if (!inBand(i)) continue;
        const ix = i % nx;
        if (ix === 0 || ix === nx - 1 || i < nx || i >= n - nx) continue;
        let ringed = true;
        for (const j of [i - nx - 1, i - nx, i - nx + 1, i - 1, i + 1, i + nx - 1, i + nx, i + nx + 1]) {
          if (!inBand(j)) {
            ringed = false;
            break;
          }
        }
        if (ringed) return true;
      }
    }
    // One plane: the best fit's slopes each way, and how far off it the
    // heights are.
    const det = xx * zz - xz * xz;
    if (det <= 0) return false;
    const gx = (xh * zz - zh * xz) / det;
    const gz = (zh * xx - xh * xz) / det;
    let rss = 0;
    for (const i of mine) {
      const ix = i % nx;
      const e = raw[i] - mh - gx * (ix - mx) - gz * ((i - ix) / nx - mz);
      rss += e * e;
    }
    return Math.sqrt(rss / mine.length) < ROOF_PLANE;
  }
}

// Whether a file on its own looks like a surface model rather than bare
// ground: the lumps standing in it - a top with a body (not a lone spike)
// at least 4 m clear of three-quarters of the ring some 5 m round it.
// Trees and buildings do that, even in a row or a wood; ground can't (it
// would be steeper than a sand dune on nearly every side).
// heights: a window of the file, row by row, NaN for none; cell: its size
// in metres. Returns the number of lumps.
export function countLumps(heights, w, h, cell = 1) {
  if (cell > 2.5) return 0;
  const ring = Math.max(2, Math.round(5 / cell));
  const clear = Math.max(4, 0.8 * ring * cell);
  const v = (x, y) => heights[y * w + x];
  let lumps = 0;
  for (let y = ring; y < h - ring; y++) {
    for (let x = ring; x < w - ring; x++) {
      const c = v(x, y);
      if (!Number.isFinite(c)) continue;
      // The highest of its neighbours (the first of equals), and they
      // nearly as high: a body.
      let top = true;
      let body = 0;
      for (let dy = -1; dy <= 1 && top; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const u = v(x + dx, y + dy);
          if (u > c || (u === c && dy * w + dx < 0)) {
            top = false;
            break;
          }
          if (dx * dy === 0 && (dx || dy) && c - u <= clear / 2) body++;
        }
      }
      if (!top || body < 3) continue;
      let low = 0;
      let seen = 0;
      for (let k = -ring; k < ring && seen >= 0; k++) {
        for (const u of [v(x + k, y - ring), v(x + ring, y + k), v(x - k, y + ring), v(x - ring, y - k)]) {
          if (!Number.isFinite(u)) {
            seen = -1;
            break;
          }
          seen++;
          if (c - u >= clear) low++;
        }
      }
      if (seen > 0 && low >= 0.75 * seen) lumps++;
    }
  }
  return lumps;
}
// How many lumps make a file a surface model.
export const SURFACE_LUMPS = 3;

// A low, spreading broadleaf (crown radius at least this share of its
// height, no taller than WILLOW_TALL) by the water is a weeping willow.
export const WILLOW_SPREAD = 0.5;
const WILLOW_TALL = 15;

// A found tree as the renderer draws it: [x, z, scale, kind, width] - the
// model scaled to the tree's height, and its crown widened or narrowed to
// the tree's (within reason, so it still looks like a tree). byWater: it
// stands by a pond, lake or stream.
export function modelTree([x, z, h, r, kind], byWater = false) {
  // (An oak by the water, low and spreading, is a willow too.)
  if ((kind === KIND.leaf || kind === KIND.oak) && byWater && r >= WILLOW_SPREAD * h && h <= WILLOW_TALL) kind = KIND.willow;
  const m = TREE_KINDS[kind] ?? TREE_KINDS[1];
  const scale = Math.min(6, Math.max(0.3, h / m.height));
  const width = Math.min(1.8, Math.max(0.55, r / m.radius / scale));
  return [x, z, Math.round(scale * 100) / 100, kind, Math.round(width * 100) / 100];
}
