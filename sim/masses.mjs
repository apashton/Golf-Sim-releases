// A building's real masses, read off the survey.
//
// A map's building outline is often a plot, not a building: a whole town
// block with its courtyard, a terrace with its low back ranges, a hotel
// and its yard in one line. Raised as one block at one height it stood as
// a flat-topped slab where the place has a tall front range under a
// pitched roof, lower wings behind and open ground between (the real
// links' town, 22 November 2026: a third of its mapped building area
// stands under 3 m). The survey's surface model knows better: here its
// heights over the outline are sorted into oblong masses, each with the
// roof it shows - how high its eaves and its ridge, which way the ridge
// runs - and what's open is left open.
//
// How: the heights above the ground are laid on a grid square with the
// outline's longest side; an oblong of it is fitted with the roof that
// suits it best (flat, or a ridge along either way); one that fits badly,
// or is part open ground, is cut in two where that helps most, and each
// part looked at again (a regression tree, its leaves the masses). Leaves
// of open ground are dropped; each kept one is trimmed to what's built in
// it and its roof read again from the heights away from its edges (an edge
// square is half wall, half street); neighbours under one roof are joined.
//
// Pure: server/lidar.mjs calls it for a course's buildings where surface
// and ground models cover them; sim/buildings.mjs raiseBuildings raises a
// building in its masses where it has them (layout.buildingMasses).

import { orientedBox, polygonArea, BUILDING_RANGE } from "./buildings.mjs";
import { insidePolygon } from "./terrain.mjs";

export const MASSES = {
  // The grid's squares (m) unless said, and the height a square counts as
  // built at.
  cell: 1,
  built: 2.5,
  // The least an oblong's side is cut down to (m).
  least: 4,
  // An oblong is kept whole once its roof fits this well (rms, m) and this
  // much of it is built; dropped as open ground under `open` built; and a
  // cut must take at least `gain` off the misfit to be made.
  fine: 0.8,
  whole: 0.85,
  open: 0.2,
  gain: 0.15,
  // A leaf is a mass with this much of it built.
  keep: 0.5,
  // A roof is read from the built squares this far (m) in from any open
  // one - an edge square is half wall, half street - and from no fewer
  // than `inner` square metres of them.
  edge: 1,
  inner: 8,
  // A pitched roof: across at least `across` m, its profile across the
  // ridge a tent to within this share of its spread (or `rough`, where it
  // rises `tall` m or more), its rise at least `rise` m and no steeper than
  // `steep` (rise over half-width).
  across: 4.5,
  pitched: 0.35,
  rough: 0.65,
  tall: 2.5,
  rise: 1.5,
  steep: 1.7,
  // Neighbours joined under one roof: ridges and eaves within this (m).
  join: 1.2,
  // The most squares a grid may have (a bigger outline is left whole), and
  // the least of the outline that must have a height at all.
  most: 250000,
  known: 0.6,
  // An outline is tried up to `reach` m each way from where the map has it,
  // a `step` at a time, and read where most of it is built - if that's at
  // least `better` more of it than where it is.
  reach: 5,
  step: 0.5,
  better: 0.05,
};

// The outline's heights on a grid square with its longest side: { ax, az
// (along u), u0, v0, nu, nv, cell, h (Float32Array, nu * nv: metres above
// the ground, 0 outside the outline or where nothing's known), known (the
// share of the outline's squares with a height), built (the share of them
// built on) } - or null for an outline
// too small or too big. heightAt(x, z): metres above the ground there (in
// the outline's own frame), not finite where the survey doesn't reach.
export function heightGrid(poly, heightAt, cell = MASSES.cell) {
  const box = orientedBox(poly);
  if (!box) return null;
  const { ax, az } = box;
  const cu = box.cx * ax + box.cz * az;
  const cv = -box.cx * az + box.cz * ax;
  const u0 = cu - box.length / 2;
  const v0 = cv - box.width / 2;
  const nu = Math.ceil(box.length / cell);
  const nv = Math.ceil(box.width / cell);
  if (nu < 2 || nv < 2 || nu * nv > MASSES.most) return null;
  const h = new Float32Array(nu * nv);
  let inside = 0;
  let known = 0;
  let built = 0;
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      const u = u0 + (i + 0.5) * cell;
      const v = v0 + (j + 0.5) * cell;
      const x = u * ax - v * az;
      const z = u * az + v * ax;
      if (!insidePolygon(poly, x, z)) continue;
      inside++;
      const y = heightAt(x, z);
      if (!Number.isFinite(y)) continue;
      known++;
      h[i * nv + j] = Math.max(0, y);
      if (y >= MASSES.built) built++;
    }
  }
  return { ax, az, u0, v0, nu, nv, cell, h, known: inside ? known / inside : 0, built: inside ? built / inside : 0 };
}

// Where the survey has a building the map draws a little off: [dx, dz] to
// add to a spot on the outline to read the survey's heights for it. A
// map's outline is traced from a picture taken from the air, where a tall
// building leans away from the camera: its outline can sit 2 - 4 m off
// its walls (the real links' clubhouse, 3 m), and read where it's drawn
// it's part roof, part street. The outline is slid up to MASSES.reach each
// way - no further than a third of its own size, so a shed isn't slid onto
// the house beside it - and settled where the most of it is built; [0, 0]
// where that's no better than where it is, or nearer if as good.
// taken(x, z): a spot that's another building's (in its outline) - never
// counted as this one's.
export function settleOutline(poly, heightAt, { taken = null } = {}) {
  const { step, better, built } = MASSES;
  let x0 = Infinity;
  let x1 = -Infinity;
  let z0 = Infinity;
  let z1 = -Infinity;
  for (const [x, z] of poly) {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    z0 = Math.min(z0, z);
    z1 = Math.max(z1, z);
  }
  // The spots of the outline tried (a metre apart, fewer over a big one).
  const gap = Math.max(1, Math.sqrt(((x1 - x0) * (z1 - z0)) / 4000));
  const spots = [];
  for (let x = x0 + gap / 2; x < x1; x += gap) for (let z = z0 + gap / 2; z < z1; z += gap) if (insidePolygon(poly, x, z)) spots.push([x, z]);
  if (spots.length < 6) return [0, 0];
  const reach = Math.min(MASSES.reach, Math.floor((Math.sqrt(spots.length * gap * gap) / 3) / step) * step);
  if (reach < step) return [0, 0];
  // What's built, once, on a grid of `step` over the outline's box and its reach.
  const nx = Math.ceil((x1 - x0 + 2 * reach) / step) + 2;
  const nz = Math.ceil((z1 - z0 + 2 * reach) / step) + 2;
  const up = new Int8Array(nx * nz).fill(-1);
  const at = (x, z) => {
    const i = Math.round((x - x0 + reach) / step);
    const j = Math.round((z - z0 + reach) / step);
    const k = j * nx + i;
    if (up[k] < 0) {
      const [px, pz] = [x0 - reach + i * step, z0 - reach + j * step];
      const y = heightAt(px, pz);
      up[k] = Number.isFinite(y) && y >= built && !(taken && !insidePolygon(poly, px, pz) && taken(px, pz)) ? 1 : 0;
    }
    return up[k];
  };
  const share = (dx, dz) => spots.reduce((n, [x, z]) => n + at(x + dx, z + dz), 0) / spots.length;
  const here = share(0, 0);
  let best = { dx: 0, dz: 0, v: here, far: 0 };
  const steps = Math.round(reach / step);
  for (let i = -steps; i <= steps; i++) {
    for (let j = -steps; j <= steps; j++) {
      const v = share(i * step, j * step);
      const far = Math.hypot(i, j);
      if (v > best.v + 1e-9 || (v > best.v - 1e-9 && far < best.far)) best = { dx: i * step, dz: j * step, v, far };
    }
  }
  if (best.v < here + better) return [0, 0];
  // (The nearest spot as good as the best, to within a hundredth.)
  let near = best;
  for (let i = -steps; i <= steps; i++) {
    for (let j = -steps; j <= steps; j++) {
      const far = Math.hypot(i, j);
      if (far < near.far && share(i * step, j * step) >= best.v - 0.01) near = { dx: i * step, dz: j * step, v: best.v, far };
    }
  }
  return [near.dx, near.dz];
}

// Sums over any oblong of the grid in one step: of the heights, their
// squares, and how many are built.
function tables(g) {
  const { nu, nv, h } = g;
  const w = nv + 1;
  const s1 = new Float64Array((nu + 1) * w);
  const s2 = new Float64Array((nu + 1) * w);
  const sb = new Float64Array((nu + 1) * w);
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      const v = h[i * nv + j];
      const k = (i + 1) * w + j + 1;
      s1[k] = v + s1[k - w] + s1[k - 1] - s1[k - w - 1];
      s2[k] = v * v + s2[k - w] + s2[k - 1] - s2[k - w - 1];
      sb[k] = (v >= MASSES.built ? 1 : 0) + sb[k - w] + sb[k - 1] - sb[k - w - 1];
    }
  }
  const sum = (s) => (i0, i1, j0, j1) => s[i1 * w + j1] - s[i0 * w + j1] - s[i1 * w + j0] + s[i0 * w + j0];
  return { sum1: sum(s1), sum2: sum(s2), built: sum(sb), least: Math.max(2, Math.round(MASSES.least / g.cell)) };
}

// The roof that fits an oblong of the grid best, every square of it
// counted (open ground as nothing standing): { sse, roof: "flat" | "u" |
// "v" (a ridge along u, or along v), e, r (its eaves and ridge) }.
function fitBlock(t, i0, i1, j0, j1) {
  const n = (i1 - i0) * (j1 - j0);
  const sh = t.sum1(i0, i1, j0, j1);
  const mh = sh / n;
  const shh = Math.max(0, t.sum2(i0, i1, j0, j1) - n * mh * mh);
  let best = { sse: shh, roof: "flat", e: mh, r: mh };
  // A tent across one way: 0 at the oblong's edges, 1 along its middle.
  const tent = (k0, k1, others, strip, roof) => {
    const k = k1 - k0;
    if (k < t.least) return;
    let st = 0;
    let stt = 0;
    let sht = 0;
    for (let q = k0; q < k1; q++) {
      const T = 1 - Math.abs(q + 0.5 - (k0 + k1) / 2) / (k / 2);
      st += T * others;
      stt += T * T * others;
      sht += T * strip(q);
    }
    const mt = st / n;
    const Stt = stt - n * mt * mt;
    if (Stt < 1e-9) return;
    const Sht = sht - n * mh * mt;
    const slope = Sht / Stt;
    const sse = Math.max(0, shh - slope * Sht);
    if (sse < best.sse) best = { sse, roof, e: mh - slope * mt, r: mh - slope * mt + slope };
  };
  tent(j0, j1, i1 - i0, (q) => t.sum1(i0, i1, q, q + 1), "u");
  tent(i0, i1, j1 - j0, (q) => t.sum1(q, q + 1, j0, j1), "v");
  return best;
}

// The grid's oblongs of one roof each: [{ i0, i1, j0, j1 }] (squares, i1 and
// j1 past the end).
function leaves(g, t) {
  const out = [];
  const least = Math.max(2, Math.round(MASSES.least / g.cell));
  const visit = (i0, i1, j0, j1) => {
    const n = (i1 - i0) * (j1 - j0);
    const builtShare = t.built(i0, i1, j0, j1) / n;
    if (builtShare < MASSES.open) return;
    const whole = fitBlock(t, i0, i1, j0, j1);
    if (Math.sqrt(whole.sse / n) < MASSES.fine && builtShare > MASSES.whole) return void out.push({ i0, i1, j0, j1 });
    let best = null;
    for (let c = i0 + least; c <= i1 - least; c++) {
      const s = fitBlock(t, i0, c, j0, j1).sse + fitBlock(t, c, i1, j0, j1).sse;
      if (!best || s < best.s) best = { s, way: "u", c };
    }
    for (let c = j0 + least; c <= j1 - least; c++) {
      const s = fitBlock(t, i0, i1, j0, c).sse + fitBlock(t, i0, i1, c, j1).sse;
      if (!best || s < best.s) best = { s, way: "v", c };
    }
    if (!best || best.s > whole.sse * (1 - MASSES.gain)) {
      if (builtShare >= MASSES.keep) out.push({ i0, i1, j0, j1 });
      return;
    }
    if (best.way === "u") {
      visit(i0, best.c, j0, j1);
      visit(best.c, i1, j0, j1);
    } else {
      visit(i0, i1, j0, best.c);
      visit(i0, i1, best.c, j1);
    }
  };
  visit(0, g.nu, 0, g.nv);
  return out;
}

// A leaf trimmed to what's built in it, and its roof read from the built
// squares away from its edges: { i0, i1, j0, j1, roof: "flat" | "u" | "v",
// eaves, ridge, rms (how far those squares stand from that roof) } - or
// null if too little of it stands.
function massOf(g, t, leaf) {
  let { i0, i1, j0, j1 } = leaf;
  const half = (a, b, c, d) => t.built(a, b, c, d) >= 0.5 * (b - a) * (d - c);
  while (i1 - i0 > 2 && !half(i0, i0 + 1, j0, j1)) i0++;
  while (i1 - i0 > 2 && !half(i1 - 1, i1, j0, j1)) i1--;
  while (j1 - j0 > 2 && !half(i0, i1, j0, j0 + 1)) j0++;
  while (j1 - j0 > 2 && !half(i0, i1, j1 - 1, j1)) j1--;
  const { nu, nv, h, cell } = g;
  const at = (i, j) => (i < 0 || j < 0 || i >= nu || j >= nv ? 0 : h[i * nv + j]);
  // (Away from an edge: every square within MASSES.edge of it built too.)
  const m = Math.max(1, Math.round(MASSES.edge / cell));
  const deep = (i, j) => {
    for (let k = 1; k <= m; k++) if (at(i - k, j) < MASSES.built || at(i + k, j) < MASSES.built || at(i, j - k) < MASSES.built || at(i, j + k) < MASSES.built) return false;
    return true;
  };
  const built = [];
  const inner = [];
  for (let i = i0; i < i1; i++) {
    for (let j = j0; j < j1; j++) {
      const v = at(i, j);
      if (v < MASSES.built) continue;
      built.push(v);
      if (deep(i, j)) inner.push([i, j, v]);
    }
  }
  if (built.length * cell * cell < 6) return null;
  built.sort((a, b) => a - b);
  const top = built[Math.min(built.length - 1, Math.floor(built.length * 0.9))];
  const flat = { i0, i1, j0, j1, roof: "flat", eaves: top, ridge: top, rms: 0 };
  if (inner.length * cell * cell < MASSES.inner) return flat;
  const n = inner.length;
  const mh = inner.reduce((s, c) => s + c[2], 0) / n;
  const shh = inner.reduce((s, c) => s + (c[2] - mh) ** 2, 0);
  flat.rms = Math.sqrt(shh / n);
  // A ridge along either way: read off the roof's profile across it - the
  // middle height of each strip of squares (a chimney or a dormer stands
  // above its strip's middle, and doesn't bend it) - fitted with a tent,
  // nothing at the edges and whole along the middle.
  let best = null;
  for (const [roof, k0, k1, which] of [["u", j0, j1, 1], ["v", i0, i1, 0]]) {
    const k = k1 - k0;
    if (k * cell < MASSES.across) continue;
    const strips = Array.from({ length: k }, () => []);
    for (const c of inner) strips[c[which] - k0].push(c[2]);
    const pts = [];
    strips.forEach((list, q) => {
      if (list.length < 3) return;
      list.sort((x, y) => x - y);
      pts.push({ T: 1 - Math.abs(q + 0.5 - k / 2) / (k / 2), y: list[list.length >> 1], w: list.length });
    });
    if (pts.length < 5) continue;
    const W = pts.reduce((s, p) => s + p.w, 0);
    const mt = pts.reduce((s, p) => s + p.w * p.T, 0) / W;
    const my = pts.reduce((s, p) => s + p.w * p.y, 0) / W;
    const Stt = pts.reduce((s, p) => s + p.w * (p.T - mt) ** 2, 0);
    const Syy = pts.reduce((s, p) => s + p.w * (p.y - my) ** 2, 0);
    if (Stt < 1e-6 || Syy < 1e-6) continue;
    const Sty = pts.reduce((s, p) => s + p.w * (p.T - mt) * (p.y - my), 0);
    const slope = Sty / Stt;
    const fit = 1 - (Sty * Sty) / (Stt * Syy);
    const e = my - slope * mt;
    const halfWidth = (k * cell) / 2;
    // (A tent, or - rising well over a storey - near enough one: a roof
    // with a wing or a row of dormers on it.)
    if ((fit > MASSES.pitched && !(fit <= MASSES.rough && slope >= MASSES.tall)) || slope < MASSES.rise || slope > MASSES.steep * halfWidth || e < 2) continue;
    if (!best || fit < best.fit) best = { fit, roof, e, r: e + slope, rms: Math.sqrt((fit * Syy) / W) };
  }
  if (!best) return flat;
  const ridge = Math.min(Math.max(best.r, top - 1), top + 0.5);
  return { i0, i1, j0, j1, roof: best.roof, eaves: Math.min(best.e, ridge - 1), ridge, rms: best.rms };
}

// Neighbours under one roof joined: the same kind of roof, side by side
// along its ridge (or, flat, along either way), as wide, as high.
function joined(masses) {
  const list = masses.slice();
  const near = (a, b) => Math.abs(a.ridge - b.ridge) <= MASSES.join && Math.abs(a.eaves - b.eaves) <= MASSES.join;
  for (let again = true; again; ) {
    again = false;
    for (let p = 0; p < list.length && !again; p++) {
      for (let q = p + 1; q < list.length && !again; q++) {
        const a = list[p];
        const b = list[q];
        if (a.roof !== b.roof || !near(a, b)) continue;
        const alongU = a.j0 === b.j0 && a.j1 === b.j1 && (a.i1 === b.i0 || b.i1 === a.i0);
        const alongV = a.i0 === b.i0 && a.i1 === b.i1 && (a.j1 === b.j0 || b.j1 === a.j0);
        if (!(a.roof === "u" ? alongU : a.roof === "v" ? alongV : alongU || alongV)) continue;
        const wa = (a.i1 - a.i0) * (a.j1 - a.j0);
        const wb = (b.i1 - b.i0) * (b.j1 - b.j0);
        const mix = (k) => (a[k] * wa + b[k] * wb) / (wa + wb);
        list[p] = { i0: Math.min(a.i0, b.i0), i1: Math.max(a.i1, b.i1), j0: Math.min(a.j0, b.j0), j1: Math.max(a.j1, b.j1), roof: a.roof, eaves: mix("eaves"), ridge: mix("ridge") };
        list.splice(q, 1);
        again = true;
      }
    }
  }
  return list;
}

const r1 = (v) => Math.round(v * 10) / 10;
const r3 = (v) => Math.round(v * 1000) / 1000;

// A building's masses from its heights above the ground: [{ cx, cz, ax, az
// (the way its ridge runs - a flat one's longer side), length (along
// that), width, eaves, ridge (m above the ground), roof: "flat" |
// "pitched" }] in the outline's own frame. An empty list for an outline
// that is itself one flat-roofed mass (what stands in it all of a height:
// the outline says its shape better than an oblong would); null where the
// survey doesn't cover it or nothing of it stands. cell: the grid's squares
// (m) - as fine as the survey. The masses stand where the map has the
// outline, read from where the survey has the building (settleOutline;
// taken: its spots that are other buildings').
export function buildingMasses(poly, heightAt, { cell = MASSES.cell, settle = true, taken = null } = {}) {
  if (!Array.isArray(poly) || poly.length < 3) return null;
  // (Read where the survey has it, if the map draws it a little off.)
  const [dx, dz] = settle ? settleOutline(poly, heightAt, { taken }) : [0, 0];
  const g = heightGrid(poly, dx || dz ? (x, z) => heightAt(x + dx, z + dz) : heightAt, cell);
  if (!g || g.known < MASSES.known) return null;
  const t = tables(g);
  const { ax, az, u0, v0, nu, nv } = g;
  const asMass = (m) => {
    const u = u0 + ((m.i0 + m.i1) / 2) * cell;
    const v = v0 + ((m.j0 + m.j1) / 2) * cell;
    const lu = (m.i1 - m.i0) * cell;
    const lv = (m.j1 - m.j0) * cell;
    // Its axis: along its ridge; a flat one's, its longer side.
    const alongU = m.roof === "u" || (m.roof === "flat" && lu >= lv);
    const ridge = Math.min(BUILDING_RANGE.high, Math.max(BUILDING_RANGE.low, m.ridge));
    return {
      cx: r1(u * ax - v * az),
      cz: r1(u * az + v * ax),
      ax: r3(alongU ? ax : -az),
      az: r3(alongU ? az : ax),
      length: r1(alongU ? lu : lv),
      width: r1(alongU ? lv : lu),
      eaves: r1(Math.min(ridge, Math.max(2.2, m.eaves))),
      ridge: r1(ridge),
      roof: m.roof === "flat" ? "flat" : "pitched",
    };
  };
  // All of a piece - built all over, under one roof: the outline itself if
  // that roof's flat, one oblong if it's pitched over an outline that
  // nearly fills its box.
  if (g.built > MASSES.whole) {
    const whole = massOf(g, t, { i0: 0, i1: nu, j0: 0, j1: nv });
    if (whole && whole.rms < MASSES.fine) {
      if (whole.roof === "flat") return [];
      if (polygonArea(poly) >= nu * nv * cell * cell * 0.8) return [asMass(whole)];
    }
  }
  const found = joined(leaves(g, t).map((l) => massOf(g, t, l)).filter(Boolean));
  return found.length ? found.map(asMass) : null;
}

// A grid of heights read between its squares: (x, z) -> height, for a grid
// { x0, z0, cell, nx, nz } of values at its corners (row by row along x);
// not finite where any of the four round the spot isn't.
export function gridReader({ x0, z0, cell, nx, nz }, values) {
  return (x, z) => {
    const fx = (x - x0) / cell;
    const fz = (z - z0) / cell;
    const ix = Math.floor(fx);
    const iz = Math.floor(fz);
    if (ix < 0 || iz < 0 || ix >= nx - 1 || iz >= nz - 1) return NaN;
    const tx = fx - ix;
    const tz = fz - iz;
    const a = values[iz * nx + ix];
    const b = values[iz * nx + ix + 1];
    const c = values[(iz + 1) * nx + ix];
    const d = values[(iz + 1) * nx + ix + 1];
    return a * (1 - tx) * (1 - tz) + b * tx * (1 - tz) + c * (1 - tx) * tz + d * tx * tz;
  };
}
