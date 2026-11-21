// The mower's line (the owner, 19 October 2026: "it still needs to be much
// straighter against that cut of long grass. The mower cut is a neat line.
// Only in areas where a mower doesn't trim should the lines be more
// natural"): how far each spot is into the mown ground - the fairway and
// its first cut, the tees and their surrounds, the green, its fringe and
// its channel (sim/course.mjs SURROUND) - in metres, worked out by the
// same rules the lies are (surfaceAt, mappedSurfaceAt), so it's 0 right on
// the line between them and the rough: positive on the mower's side,
// negative in the rough. The long grass, the tufts and the grass round
// the ball are cut off there (look/cutline.js), so the rough stands up in
// a neat line along every edge a mower makes; where none does - the deep
// rough's edge, round sand, water, paths and trees - it stays as it grows.
// Pure: no Three.js.

import { nearest, makePath, fairwayHalfWidth, firstCutWidth, blobRadius, teeBoxes, teeBridges, greenMown, fairwayBand, mappedTeeShapes, mappedJoin, edgeReach, SURROUND, FRINGE, FIRST_CUT, MOW_JOIN } from "./course.mjs";
import { insidePolygon, distanceToEdge } from "./terrain.mjs";
import { causeways, causewayPast, causewayBounds } from "./causeway.mjs";

export const CUT = {
  // How far either side of the line the field tells apart, metres (the
  // grid holds it to this: 1.5 m in 255 steps, a centimetre and a bit).
  range: 1.5,
  // The grid's cell, metres: the line between cells is read straight
  // across (look/cutline.js reads it with the card's own smoothing), and
  // the field is near enough straight over a cell that it stays a line.
  cell: 0.5,
  // Looked at first on a coarser grid, this many cells a side: where a
  // block's corners are all well clear of the line, so is all of it.
  block: 4,
  // The most cells a side the grid may have (a texture's bounds).
  most: 4096,
};

// The most a join between two mown shapes lifts the measure (sim/course.mjs
// smoothMax: a quarter of its k).
const JOIN_LIFT = (2 * MOW_JOIN) / 4;

// A shape's edge, signed: below 0 inside it.
const signed = (poly, x, z) => (insidePolygon(poly, x, z) ? -distanceToEdge(poly, x, z) : distanceToEdge(poly, x, z));

// How far (x, z), in the hole's frame, is into its mown ground: metres, 0 on
// the line, below 0 in the rough. L: the hole's layout, as played.
export function mownMeasure(L, path = makePath(L.path)) {
  // An island green's causeway is mown right to its edge, over whatever it
  // crosses (sim/causeway.mjs).
  const ways = causeways(L);
  const measure = mownOf(L, path);
  return ways.length ? (x, z) => Math.max(measure(x, z), ...ways.map((c) => -causewayPast(c, x, z))) : measure;
}
function mownOf(L, path) {
  if (L.source === "map") {
    // Each shape with how far past its edge is mown, and its box that far
    // and the field's range out: past that box it can't reach.
    const shapes = [
      ...(L.fairways ?? []).map((poly) => ({ poly, out: FIRST_CUT })),
      ...mappedTeeShapes(L).map((poly) => ({ poly, out: SURROUND.tee })),
      ...[L.green.poly, ...(L.greens ?? [])].map((poly) => ({ poly, out: FRINGE + SURROUND.green })),
    ]
      .filter((q) => q.poly?.length > 2)
      .map((q) => {
        const r = q.out + CUT.range + 1;
        let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
        for (const [x, z] of q.poly) {
          x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
        }
        return { ...q, x0: x0 - r, x1: x1 + r, z0: z0 - r, z1: z1 + r };
      });
    // (And between them, where they come close: sim/course.mjs mappedJoin.)
    const join = mappedJoin(L);
    return (x, z) => {
      let g = -(CUT.range + 1);
      for (const q of shapes) if (x >= q.x0 && x <= q.x1 && z >= q.z0 && z <= q.z1) g = Math.max(g, q.out - signed(q.poly, x, z));
      return Math.max(g, join(x, z));
    };
  }
  const boxes = teeBoxes(L.teeSpots);
  const bridges = teeBridges(L.teeSpots);
  const f = L.fairway;
  // (A blob's edge, out from its middle, as insideBlob reads it.)
  const blobIn = (b, x, z) => {
    const dx = x - b.x;
    const dz = z - b.z;
    const cr = Math.cos(-(b.rot ?? 0));
    const sr = Math.sin(-(b.rot ?? 0));
    const u = dx * cr - dz * sr;
    const v = dx * sr + dz * cr;
    return blobRadius(b, Math.atan2(v, u)) - Math.hypot(u, v);
  };
  // Fairways added by hand (holeedits "a+"), each with its reach.
  const added = (L.extraFairways ?? []).map((b) => ({ b, R: Math.max(b.rx, b.rz) * 1.3 * edgeReach(b) + FIRST_CUT + CUT.range + 1 }));
  return (x, z) => {
    let g = -Infinity;
    // A fairway added by hand and its first cut round it.
    for (const { b, R } of added) if (Math.abs(x - b.x) < R && Math.abs(z - b.z) < R) g = Math.max(g, blobIn(b, x, z) + FIRST_CUT);
    // Each tee box's surround: square to it, square at its corners; and
    // between two close together.
    for (const [x0, x1, z0, z1] of boxes) g = Math.max(g, SURROUND.tee - Math.max(x0 - x, x - x1, z0 - z, z - z1));
    for (const [x0, x1, z0, z1] of bridges) g = Math.max(g, -Math.max(x0 - x, x - x1, z0 - z, z - z1));
    // The fairway and its first cut, where there's fairway beside it; and
    // the green's channel, out from its middle as insideBlob reads it,
    // joined to them where the rough between is narrow (course.mjs
    // greenMown).
    let band = -Infinity;
    if (f && path.points?.length > 1) {
      const n = nearest(path, x, z);
      const side = n.d < 0 ? -1 : 1;
      band = fairwayBand(L, n.s, Math.abs(n.d), side, fairwayHalfWidth(f, n.s, side));
    }
    return Math.max(g, greenMown(L, x, z, band));
  };
}

// The box round everything mown on a hole, in its frame, with `pad` metres
// to spare: { x0, x1, z0, z1 }.
export function mownBounds(L, path = makePath(L.path), pad = CUT.range + 2) {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  const take = (x, z, r = 0) => {
    x0 = Math.min(x0, x - r); x1 = Math.max(x1, x + r);
    z0 = Math.min(z0, z - r); z1 = Math.max(z1, z + r);
  };
  if (L.source === "map") {
    for (const p of [...(L.fairways ?? [])]) for (const [x, z] of p) take(x, z, FIRST_CUT);
    for (const p of mappedTeeShapes(L)) for (const [x, z] of p) take(x, z, SURROUND.tee);
    for (const p of [L.green.poly, ...(L.greens ?? [])]) for (const [x, z] of p ?? []) take(x, z, FRINGE + SURROUND.green);
    // (Its mapped shapes reach other holes': only as far as its own ground.)
    const r = L.region;
    if (r) {
      x0 = Math.max(x0, r.x0); x1 = Math.min(x1, r.x1);
      z0 = Math.max(z0, r.z0); z1 = Math.min(z1, r.z1);
    }
  } else {
    for (const [a, b, c, d] of teeBoxes(L.teeSpots)) {
      take(a, c, SURROUND.tee);
      take(b, d, SURROUND.tee);
    }
    const g = L.green;
    if (g) take(g.poly ? g.poly[0][0] : g.x, g.poly ? g.poly[0][1] : g.z, Math.max(g.rx ?? 0, g.rz ?? 0) * 1.6 + FRINGE + SURROUND.green + 4);
    if (g?.poly) for (const [x, z] of g.poly) take(x, z, FRINGE + SURROUND.green);
    for (const b of L.extraFairways ?? []) take(b.x, b.z, Math.max(b.rx, b.rz) * 1.3 * edgeReach(b) + FIRST_CUT);
    for (const c of causeways(L)) {
      const b = causewayBounds(c);
      take(b.x0, b.z0);
      take(b.x1, b.z1);
    }
    const f = L.fairway;
    if (f && f.to > f.from) {
      for (let at = f.from; at <= f.to + 3; at += 3) {
        const s = Math.min(at, f.to);
        let { p } = pathPoint(path, s);
        const w = Math.max(fairwayHalfWidth(f, s, -1) + firstCutWidth(L, s, -1), fairwayHalfWidth(f, s, 1) + firstCutWidth(L, s, 1));
        take(p[0], p[1], w + 1);
      }
    }
  }
  return Number.isFinite(x0) ? { x0: x0 - pad, x1: x1 + pad, z0: z0 - pad, z1: z1 + pad } : null;
}

// The point s metres along a path.
function pathPoint(path, s) {
  const { points, cum } = path;
  for (let i = 1; i < points.length; i++) {
    if (cum[i] >= s || i === points.length - 1) {
      const a = points[i - 1];
      const b = points[i];
      const len = cum[i] - cum[i - 1] || 1;
      const t = Math.min(1, Math.max(0, (s - cum[i - 1]) / len));
      return { p: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t] };
    }
  }
  return { p: points[0] ?? [0, 0] };
}

// The field on a grid in the world's terms (world x = the hole's z, world
// z = minus its x), for the graphics card: { x0, z0, cell, nx, nz, data }
// - data a byte a cell, row by row along world x, 128 on the line, 255
// CUT.range or more into the mown ground, 0 as far into the rough - and
// each cell's middle at (x0 + (i + 0.5) cell, z0 + (j + 0.5) cell). Null
// with nothing mown.
export function mownField(L, options = {}) {
  const steps = mownFieldSteps(L, { ...options, every: Infinity });
  for (;;) {
    const r = steps.next();
    if (r.done) return r.value;
  }
}
// The same, stopping (yield) after every `every` places the field's worked
// out at (or, on a mapped hole, each shape and so many of its cells) - for
// the hole built a step at a time while the next is built ahead (it was a
// step of 0.15 - 0.2 s).
export const FIELD_STEP = 6000;
export function* mownFieldSteps(L, { path = makePath(L.path), cell = CUT.cell, every = FIELD_STEP } = {}) {
  const b = mownBounds(L, path);
  if (!b) return null;
  // World box: x from the hole's z, z from minus its x.
  let size = cell;
  while (Math.ceil((b.z1 - b.z0) / size) > CUT.most || Math.ceil((b.x1 - b.x0) / size) > CUT.most) size *= 2;
  const wx0 = b.z0;
  const wz0 = -b.x1;
  const nx = Math.ceil((b.z1 - b.z0) / size);
  const nz = Math.ceil((b.x1 - b.x0) / size);
  const R = CUT.range;
  const code = (v) => Math.max(0, Math.min(255, Math.round(127.5 + (Math.max(-R, Math.min(R, v)) / R) * 127.5)));
  const data = new Uint8Array(nx * nz);
  const grid = { x0: wx0, z0: wz0, cell: size, nx, nz };
  if (L.source === "map") {
    const G = yield* mappedGrid(L, grid, every);
    for (let k = 0; k < G.length; k++) data[k] = code(G[k]);
    return { ...grid, data };
  }
  const at = mownMeasure(L, path);
  let work = 0;
  const g = (i, j) => {
    work++;
    return at(-(wz0 + (j + 0.5) * size), wx0 + (i + 0.5) * size);
  };
  const B = CUT.block;
  // Clear of the line by more than this, a block's corners say all of it
  // is (the field changes by at most a metre a metre). Each corner worked
  // out once.
  const clear = R + B * size * 1.5;
  const cx = Math.ceil(nx / B) + 1;
  const cz = Math.ceil(nz / B) + 1;
  const corner = new Float32Array(cx * cz);
  for (let j = 0; j < cz; j++) {
    for (let i = 0; i < cx; i++) corner[j * cx + i] = g(Math.min(nx - 1, i * B), Math.min(nz - 1, j * B));
    if (work >= every) {
      work = 0;
      yield;
    }
  }
  for (let bj = 0; bj < nz; bj += B) {
    if (work >= every) {
      work = 0;
      yield;
    }
    for (let bi = 0; bi < nx; bi += B) {
      const i1 = Math.min(nx - 1, bi + B - 1);
      const j1 = Math.min(nz - 1, bj + B - 1);
      const ci = bi / B;
      const cj = bj / B;
      const corners = [corner[cj * cx + ci], corner[cj * cx + ci + 1], corner[(cj + 1) * cx + ci], corner[(cj + 1) * cx + ci + 1]];
      const allIn = corners.every((v) => v > clear);
      const allOut = corners.every((v) => v < -clear);
      for (let j = bj; j <= j1; j++) {
        for (let i = bi; i <= i1; i++) data[j * nx + i] = allIn ? 255 : allOut ? 0 : code(g(i, j));
      }
    }
  }
  return { ...grid, data };
}

// A mapped hole's field on the grid (its shapes have hundreds of corners,
// too many to measure each cell against): each shape's edges laid over
// the cells near them - the distance to the nearest, exactly, within the
// reach that matters - and its inside filled row by row by the same rule
// insidePolygon has, at each cell's middle. Metres, as mownMeasure's.
function* mappedGrid(L, { x0, z0, cell, nx, nz }, every = Infinity) {
  const R = CUT.range;
  const G = new Float32Array(nx * nz).fill(-(R + 1));
  const shapes = [
    ...(L.fairways ?? []).map((poly) => ({ poly, out: FIRST_CUT })),
    ...mappedTeeShapes(L).map((poly) => ({ poly, out: SURROUND.tee })),
    ...[L.green.poly, ...(L.greens ?? [])].map((poly) => ({ poly, out: FRINGE + SURROUND.green })),
  ].filter((q) => q.poly?.length > 2);
  const X = (i) => x0 + (i + 0.5) * cell;
  const Z = (j) => z0 + (j + 0.5) * cell;
  const toI = (x) => Math.floor((x - x0) / cell - 0.5);
  const toJ = (z) => Math.floor((z - z0) / cell - 0.5);
  for (const { poly, out } of shapes) {
    // In the world's terms: x the hole's z, z minus its x.
    const pts = poly.map(([x, z]) => [z, -x]);
    // (Out past the field's range by as much as a join can lift it: a
    // quarter of MOW_K, sim/course.mjs.)
    const reach = out + R + JOIN_LIFT + cell;
    let bx0 = Infinity, bx1 = -Infinity, bz0 = Infinity, bz1 = -Infinity;
    for (const [x, z] of pts) {
      bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); bz0 = Math.min(bz0, z); bz1 = Math.max(bz1, z);
    }
    const i0 = Math.max(0, toI(bx0 - reach));
    const i1 = Math.min(nx - 1, toI(bx1 + reach) + 1);
    const j0 = Math.max(0, toJ(bz0 - reach));
    const j1 = Math.min(nz - 1, toJ(bz1 + reach) + 1);
    if (i0 > i1 || j0 > j1) continue;
    const w = i1 - i0 + 1;
    const dist = new Float32Array(w * (j1 - j0 + 1)).fill(Infinity);
    // The nearest edge, for the cells within reach of one.
    for (let k = 0; k < pts.length; k++) {
      const [ax, az] = pts[k];
      const [bx, bz] = pts[(k + 1) % pts.length];
      const ex = bx - ax;
      const ez = bz - az;
      const len2 = ex * ex + ez * ez || 1e-12;
      const si0 = Math.max(i0, toI(Math.min(ax, bx) - reach));
      const si1 = Math.min(i1, toI(Math.max(ax, bx) + reach) + 1);
      const sj0 = Math.max(j0, toJ(Math.min(az, bz) - reach));
      const sj1 = Math.min(j1, toJ(Math.max(az, bz) + reach) + 1);
      for (let j = sj0; j <= sj1; j++) {
        const z = Z(j);
        for (let i = si0; i <= si1; i++) {
          const x = X(i);
          const t = Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / len2));
          const d = Math.hypot(x - ax - ex * t, z - az - ez * t);
          const at = (j - j0) * w + (i - i0);
          if (d < dist[at]) dist[at] = d;
        }
      }
    }
    // Inside or out, by rows (even-odd, at each cell's middle).
    const xs = [];
    for (let j = j0; j <= j1; j++) {
      const z = Z(j);
      xs.length = 0;
      for (let k = 0, m = pts.length - 1; k < pts.length; m = k++) {
        const [xk, zk] = pts[k];
        const [xm, zm] = pts[m];
        if (zk > z !== zm > z) xs.push(((xm - xk) * (z - zk)) / (zm - zk) + xk);
      }
      xs.sort((a, b) => a - b);
      let c = 0;
      for (let i = i0; i <= i1; i++) {
        const x = X(i);
        while (c < xs.length && xs[c] < x) c++;
        const inside = c % 2 === 1;
        const d = dist[(j - j0) * w + (i - i0)];
        const k = j * nx + i;
        if (d === Infinity) {
          if (inside) G[k] = R + 1;
          continue;
        }
        G[k] = Math.max(G[k], out - (inside ? -d : d));
      }
    }
    if (every < Infinity) yield;
  }
  // Joined where two come close (sim/course.mjs mappedJoin): worked out
  // only where it can show - within the field's range of the line, or as
  // far again as a join can lift it.
  const join = mappedJoin(L);
  let work = 0;
  for (let k = 0; k < G.length; k++) {
    if (G[k] > -(R + JOIN_LIFT) && G[k] < R) {
      G[k] = Math.max(G[k], join(-Z(Math.floor(k / nx)), X(k % nx)));
      if (++work >= every) {
        work = 0;
        yield;
      }
    }
  }
  return G;
}

// The field's value back from a byte (metres; the tests read it so).
export const fieldMetres = (byte) => ((byte - 127.5) / 127.5) * CUT.range;

// The field at (x, z) in the hole's frame, read between its cells as the
// graphics card reads it (metres; -CUT.range outside it).
export function fieldAt(field, x, z) {
  if (!field) return -CUT.range;
  const u = (z - field.x0) / field.cell - 0.5;
  const v = (-x - field.z0) / field.cell - 0.5;
  if (u < 0 || v < 0 || u > field.nx - 1 || v > field.nz - 1) return -CUT.range;
  const i = Math.min(field.nx - 2, Math.floor(u));
  const j = Math.min(field.nz - 2, Math.floor(v));
  const fu = u - i;
  const fv = v - j;
  const d = field.data;
  const n = field.nx;
  const b = (d[j * n + i] * (1 - fu) + d[j * n + i + 1] * fu) * (1 - fv) + (d[(j + 1) * n + i] * (1 - fu) + d[(j + 1) * n + i + 1] * fu) * fv;
  return fieldMetres(b);
}

// The mower's line itself: where the field crosses 0, as straight pieces
// [[x0, z0, x1, z1]...] in the hole's frame (marching squares over its
// cells, each crossing found between two cells' middles).
export function mownLine(field) {
  if (!field) return [];
  const { nx, nz, cell, data } = field;
  const out = [];
  const val = (i, j) => data[j * nx + i] - 127.5;
  // A cell's middle in the hole's frame (world x = hole z, world z = -hole x).
  const hole = (i, j) => [-(field.z0 + (j + 0.5) * cell), field.x0 + (i + 0.5) * cell];
  const cross = (a, b, va, vb) => {
    const t = va / (va - vb);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  };
  for (let j = 0; j + 1 < nz; j++) {
    for (let i = 0; i + 1 < nx; i++) {
      const v = [val(i, j), val(i + 1, j), val(i + 1, j + 1), val(i, j + 1)];
      const inside = v.map((x) => x > 0);
      if (inside.every((x) => x) || inside.every((x) => !x)) continue;
      const p = [hole(i, j), hole(i + 1, j), hole(i + 1, j + 1), hole(i, j + 1)];
      const pts = [];
      for (let k = 0; k < 4; k++) {
        const m = (k + 1) % 4;
        if (inside[k] !== inside[m]) pts.push(cross(p[k], p[m], v[k], v[m]));
      }
      // Two crossings: one piece; four (a saddle): two, paired round.
      for (let k = 0; k + 1 < pts.length; k += 2) out.push([pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1]]);
    }
  }
  return out;
}

// Points along the line, about `every` metres apart (jittered), each set
// `inset` metres (a random share of [lo, hi]) into the rough, square to
// the line: [[x, z]...] in the hole's frame. keep(x, z): whether a point
// may stand there (its lie). near: [x, z, r] - only within r of it.
export function alongLine(segments, field, { every = 0.25, inset = [0.03, 0.25], rand = Math.random, keep = () => true, near = null } = {}) {
  const out = [];
  let carry = rand() * every;
  for (const [x0, z0, x1, z1] of segments) {
    if (near && Math.min(Math.hypot(x0 - near[0], z0 - near[1]), Math.hypot(x1 - near[0], z1 - near[1])) > near[2] + 1) continue;
    const len = Math.hypot(x1 - x0, z1 - z0);
    if (len < 1e-6) continue;
    const tx = (x1 - x0) / len;
    const tz = (z1 - z0) / len;
    // Which way's the rough: the side the field's lower.
    const mx = (x0 + x1) / 2;
    const mz = (z0 + z1) / 2;
    const side = fieldAt(field, mx - tz * 0.2, mz + tx * 0.2) < fieldAt(field, mx + tz * 0.2, mz - tx * 0.2) ? 1 : -1;
    const nx = -tz * side;
    const nz = tx * side;
    for (let s = carry; s < len; s += every * (0.7 + 0.6 * rand())) {
      const d = inset[0] + rand() * (inset[1] - inset[0]);
      const x = x0 + tx * s + nx * d;
      const z = z0 + tz * s + nz * d;
      if (near && Math.hypot(x - near[0], z - near[1]) > near[2]) continue;
      if (keep(x, z)) out.push([x, z]);
    }
    carry = 0;
  }
  return out;
}
