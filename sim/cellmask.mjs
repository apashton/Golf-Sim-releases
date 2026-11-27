// Shapes on a grid: a quick "is this spot on a fairway?" over a whole
// course (a mask of cells, filled from outlines), and the outline of a
// patch of cells traced back into a shape. Used by the hole finder
// (sim/holefinder.mjs: thousands of spots looked at for each hole it
// tries) and by picking a green, tee or bunker off the ground
// (sim/groundpick.mjs).
//
// Pure, in metres (x east, z north - or a hole's frame, whatever the
// outlines are in).

import { polygonBounds } from "./terrain.mjs";

// A grid over a box: { x0, z0, cell, nx, nz }. The box is grown to whole
// cells.
export function gridOver({ x0, z0, x1, z1 }, cell) {
  const nx = Math.max(1, Math.ceil((x1 - x0) / cell));
  const nz = Math.max(1, Math.ceil((z1 - z0) / cell));
  return { x0, z0, cell, nx, nz };
}

// The box round outlines, `pad` metres bigger each way; null for none.
export function boxOf(polys, pad = 0) {
  let b = null;
  for (const p of polys) {
    if (!p?.length) continue;
    const q = polygonBounds(p);
    b = b ? { x0: Math.min(b.x0, q.x0), z0: Math.min(b.z0, q.z0), x1: Math.max(b.x1, q.x1), z1: Math.max(b.z1, q.z1) } : q;
  }
  return b && { x0: b.x0 - pad, z0: b.z0 - pad, x1: b.x1 + pad, z1: b.z1 + pad };
}

// Each cell whose middle is inside an outline set to `value` (scanlines:
// for every row of cell middles, where each edge crosses it, filled
// between pairs - either way round, holes in a shape not looked for).
export function fillShape(mask, grid, poly, value = 1) {
  const { x0, z0, cell, nx, nz } = grid;
  const n = poly.length;
  if (n < 3) return mask;
  const b = polygonBounds(poly);
  const r0 = Math.max(0, Math.floor((b.z0 - z0) / cell - 0.5));
  const r1 = Math.min(nz - 1, Math.ceil((b.z1 - z0) / cell - 0.5));
  const xs = [];
  for (let r = r0; r <= r1; r++) {
    const z = z0 + (r + 0.5) * cell;
    xs.length = 0;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const zi = poly[i][1];
      const zj = poly[j][1];
      if (zi > z !== zj > z) xs.push(poly[i][0] + ((z - zi) * (poly[j][0] - poly[i][0])) / (zj - zi));
    }
    xs.sort((a, b2) => a - b2);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const c0 = Math.max(0, Math.ceil((xs[k] - x0) / cell - 0.5));
      const c1 = Math.min(nx - 1, Math.floor((xs[k + 1] - x0) / cell - 0.5));
      for (let c = c0; c <= c1; c++) mask[r * nx + c] = value;
    }
  }
  return mask;
}

// A mask of the outlines over a grid: { ...grid, data, at(x, z) } - at()
// the value of the cell a spot is in (0 off the grid).
export function shapeMask(polys, grid) {
  const data = new Uint8Array(grid.nx * grid.nz);
  for (const p of polys) fillShape(data, grid, p, 1);
  return withLookup({ ...grid, data });
}

export function withLookup(m) {
  const { x0, z0, cell, nx, nz, data } = m;
  m.at = (x, z) => {
    const c = Math.floor((x - x0) / cell);
    const r = Math.floor((z - z0) / cell);
    return c < 0 || r < 0 || c >= nx || r >= nz ? 0 : data[r * nx + c];
  };
  return m;
}

// The outline round the cells set in `cells` (a Uint8Array over grid),
// the patch holding cell `seed` (its index): traced along the cells'
// edges, then each corner cut (twice, Chaikin) so it isn't stepped, and
// thinned to points `step` metres or so apart. Returns [[x, z], ...] or
// null if there's no patch there.
export function traceOutline(cells, grid, seed, { step = 1.5, smooth = 2 } = {}) {
  const { x0, z0, cell, nx, nz } = grid;
  if (!cells[seed]) return null;
  const set = (c, r) => c >= 0 && r >= 0 && c < nx && r < nz && cells[r * nx + c] !== 0;
  // The patch's left-most cell in its top row: walk left from the seed
  // until the edge, then follow the boundary round (a square's corners).
  let sc = seed % nx;
  const sr = Math.floor(seed / nx);
  while (set(sc - 1, sr)) sc--;
  // Boundary following on the cells' corners (Moore neighbourhood, by
  // edges): start at the left edge of cell (sc, sr), going up.
  // Corner (i, j) is the top-left of cell (i, j).
  const pts = [];
  // Directions: 0 right, 1 down, 2 left, 3 up (in grid rows: down is +r).
  const dc = [1, 0, -1, 0];
  const dr = [0, 1, 0, -1];
  // Start at corner (sc, sr + 1) going up along the cell's left edge
  // (outside on the left).
  let ci = sc;
  let cj = sr + 1;
  let dir = 3;
  const start = `${ci},${cj},${dir}`;
  for (let guard = 0; guard < 4 * nx * nz + 8; guard++) {
    pts.push([ci, cj]);
    ci += dc[dir];
    cj += dr[dir];
    // With the patch on the right of the way we're going: try turning
    // left, then straight on, then right, then back.
    for (const turn of [3, 0, 1, 2]) {
      const d = (dir + turn) % 4;
      // The two cells either side of the edge going `d` from (ci, cj):
      // the one on the right must be set, the one on the left not.
      const [rc, rr, lc, lr] = edgeCells(ci, cj, d);
      if (set(rc, rr) && !set(lc, lr)) {
        dir = d;
        break;
      }
    }
    if (`${ci},${cj},${dir}` === start) break;
  }
  if (pts.length < 4) return null;
  let poly = pts.map(([i, j]) => [x0 + i * cell, z0 + j * cell]);
  poly = dropStraight(poly);
  for (let k = 0; k < smooth; k++) poly = chaikin(poly);
  return thin(poly, step);
}

// The cells right and left of the edge leaving corner (i, j) in
// direction d (0 right, 1 down, 2 left, 3 up), in grid rows.
function edgeCells(i, j, d) {
  if (d === 0) return [i, j, i, j - 1]; // along the top of cell (i, j)
  if (d === 1) return [i - 1, j, i, j]; // down the left of cell (i, j)
  if (d === 2) return [i - 1, j - 1, i - 1, j]; // along the bottom of cell (i-1, j-1)
  return [i, j - 1, i - 1, j - 1]; // up the right of cell (i-1, j-1)
}

// Corners that are only on a straight run taken out.
function dropStraight(poly) {
  const n = poly.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = poly[(i - 1 + n) % n];
    const b = poly[i];
    const c = poly[(i + 1) % n];
    const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (Math.abs(cross) > 1e-9) out.push(b);
  }
  return out.length >= 3 ? out : poly;
}

export function chaikin(poly) {
  const out = [];
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];
    out.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]]);
    out.push([0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
  }
  return out;
}

// Points kept at least `step` metres apart round the outline.
export function thin(poly, step) {
  const out = [poly[0]];
  for (const p of poly.slice(1)) {
    const q = out[out.length - 1];
    if (Math.hypot(p[0] - q[0], p[1] - q[1]) >= step) out.push(p);
  }
  if (out.length > 3) {
    const a = out[0];
    const z = out[out.length - 1];
    if (Math.hypot(a[0] - z[0], a[1] - z[1]) < step * 0.5) out.pop();
  }
  return out.map(([x, z]) => [Math.round(x * 100) / 100, Math.round(z * 100) / 100]);
}
