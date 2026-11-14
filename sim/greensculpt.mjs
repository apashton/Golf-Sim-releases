// Shaping a green by hand, in detail: ready-made styles, a ring brush to
// raise, lower or smooth, soft-edged shapes stamped on, and smoothing the
// whole thing - all kept as one small grid of heights over the green.
//
// The grid (half-metre squares, to the millimetre) says how far the green
// has been raised or lowered by hand from the ground under it as the hole
// was made (the real ground on a mapped hole; the green's own contours on
// a designed one). Kept as a difference, a square nobody has touched stays
// exactly as it was however the ground runs - and if the ground itself is
// changed later (new LiDAR, say), the shaped green moves with it.
// Played, the green's surface takes the place of the ground under the
// green and its fringe, and eases back into the ground round it over a
// bank a few metres wide (wider the more it has to come back), so a green
// shaped by hand always fits in: no step or cliff at its edge, on flat
// designed ground or on a real hillside. Round a bunker or pond by the
// green it gives way to the ground over a face as wide as it needs, so the
// sand lies where it always did. A tilt or bumps from the older tools
// still add on top.
//
// In a course file it is one edit (holeedits.mjs):
//   { k: "gh", o: [x0, z0], n: [nx, nz], d, s? }
//   o, n  where the grid starts (hole frame, metres) and how many squares
//   d     the heights, packed small (see packHeights): each is guessed from
//         its neighbours and only the miss is kept, so a smooth green takes
//         about a byte a square - a few kilobytes for a big green
//   s     shapes stamped on, kept as shapes so they can be moved later:
//         [[kind, x, z, length, width, turn, height], ...]
// Like the green's outline, it says how the green is now: only the last
// counts, and undo is just the one before.
//
// Pure functions, shared by the designer, play and the tests.

import { blobOutline } from "./course.mjs";
import { insidePolygon, distanceToEdge, polygonBounds, gridHeight, unpackGrid } from "./terrain.mjs";
import { greenHeight } from "./putting.mjs";
import { mulberry32, clamp, smoothstep01 } from "./mathutil.mjs";

export const CELL = 0.5;
// The fringe: the surface holds its shape this far past the green's edge.
export const FRINGE = 1.6;
// The bank beyond it, back to the ground: at least and at most this wide.
const BANK = [3, 14];
// Stored grids cover the green and its fringe and this much more.
const PAD = 1;
// Beyond that, when the green is worked out: room for the widest bank and
// the smoothing.
const MARGIN = FRINGE + BANK[1] + 1.5;
// Largest grid a course file may hold (squares), and the most shapes.
export const MAX_CELLS = 60000;
export const MAX_STAMPS = 16;
// The most a grid may hold, either way (metres): room for a style laid
// level over a steep drop, while keeping a damaged file from standing a
// green in the sky.
const REACH = 10;
// The brushes and stamps raise or lower the green this far from the ground
// at most - though they never pull back what a style has already done.
const TOOL_REACH = 1.5;
// The steepest a stamp's edge may make the green, with the slope already
// there under it; and the least room it is given on a green that's already
// steep (its edge then widens as far as it has to).
const STAMP_STEEP = 0.055;
const STAMP_ROOM = 0.025;

const smoothstep = smoothstep01;
const r2 = (v) => Math.round(v * 100) / 100;
// A tool's change to a square: never past TOOL_REACH from the ground, but
// what was there already (a style's) is left alone.
const nudge = (was, add) => (add > 0 ? Math.min(was + add, Math.max(was, TOOL_REACH)) : Math.max(was + add, Math.min(was, -TOOL_REACH)));

// ---- Packing the heights -----------------------------------------------------------

// Millimetres, row by row. Each is guessed as the plane through the ones
// left, above and above-left (a straight line along the first row and
// column); the miss is kept as a small number, and runs of exact guesses -
// most of a smooth green - as a count. Written as base64.
export function packHeights(mm, nx, nz) {
  const bytes = [];
  const put = (v) => {
    while (v >= 128) {
      bytes.push((v & 127) | 128);
      v = Math.floor(v / 128);
    }
    bytes.push(v);
  };
  let run = 0;
  const flush = () => {
    if (run) put(run * 2 + 1);
    run = 0;
  };
  for (let i = 0; i < nx * nz; i++) {
    const miss = mm[i] - guess(mm, i, nx);
    if (miss === 0) {
      run++;
      continue;
    }
    flush();
    put((miss > 0 ? miss * 2 - 1 : -miss * 2) * 2);
  }
  flush();
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function guess(mm, i, nx) {
  const ix = i % nx;
  const iz = (i - ix) / nx;
  if (ix > 0 && iz > 0) return mm[i - 1] + mm[i - nx] - mm[i - nx - 1];
  if (ix > 1) return 2 * mm[i - 1] - mm[i - 2];
  if (ix > 0) return mm[i - 1];
  if (iz > 1) return 2 * mm[i - nx] - mm[i - 2 * nx];
  if (iz > 0) return mm[i - nx];
  return 0;
}

// Back to millimetres; null if the text is damaged.
export function unpackHeights(text, nx, nz) {
  let bin;
  try {
    bin = atob(text);
  } catch {
    return null;
  }
  const n = nx * nz;
  const mm = new Int32Array(n);
  let i = 0;
  let p = 0;
  while (p < bin.length) {
    let v = 0;
    let scale = 1;
    for (;;) {
      if (p >= bin.length) return null;
      const b = bin.charCodeAt(p++);
      v += (b & 127) * scale;
      scale *= 128;
      if (b < 128) break;
      if (scale > 2 ** 35) return null;
    }
    if (v % 2 === 1) {
      const run = (v - 1) / 2;
      if (i + run > n) return null;
      for (let k = 0; k < run; k++, i++) mm[i] = guess(mm, i, nx);
    } else {
      if (i >= n) return null;
      const z = v / 2;
      const miss = z % 2 === 1 ? (z + 1) / 2 : -z / 2;
      mm[i] = guess(mm, i, nx) + miss;
      if (Math.abs(mm[i]) > 1e6) return null;
      i++;
    }
  }
  return i === n ? mm : null;
}

// ---- The grid in the editor ---------------------------------------------------------

// A grid being worked on: { x0, z0, nx, nz, h (metres raised above the
// ground as made, negative lowered), stamps }.
export function gridFromEdit(e) {
  if (!validSculpt(e)) return null;
  const [nx, nz] = e.n;
  const mm = unpackHeights(e.d, nx, nz);
  if (!mm) return null;
  const h = new Float32Array(nx * nz);
  for (let i = 0; i < h.length; i++) h[i] = mm[i] / 1000;
  return { x0: e.o[0], z0: e.o[1], nx, nz, h, stamps: (e.s ?? []).map((s) => s.slice()) };
}

export function editFromGrid(g) {
  const mm = new Int32Array(g.h.length);
  for (let i = 0; i < mm.length; i++) mm[i] = Math.round(clamp(g.h[i], -REACH, REACH) * 1000);
  const e = { k: "gh", o: [g.x0, g.z0], n: [g.nx, g.nz], d: packHeights(mm, g.nx, g.nz) };
  if (g.stamps?.length) e.s = g.stamps.map((s) => [s[0], ...s.slice(1).map(r2)]);
  return e;
}

// Does a grid still lie over the green? Most of it has to be (its middle
// and at least four in five of the points round its edge): a green moved
// well away since - a designed hole made longer, say - has left it behind.
export function sculptCovers(e, green) {
  if (!validSculpt(e)) return false;
  const x1 = e.o[0] + (e.n[0] - 1) * CELL;
  const z1 = e.o[1] + (e.n[1] - 1) * CELL;
  const inBox = ([x, z]) => x >= e.o[0] && x <= x1 && z >= e.o[1] && z <= z1;
  const edge = blobOutline(green, 32);
  return inBox([green.x, green.z]) && edge.filter(inBox).length >= edge.length * 0.8;
}

export function validSculpt(e) {
  const fin = (v) => typeof v === "number" && Number.isFinite(v);
  if (!e || e.k !== "gh" || !Array.isArray(e.o) || !fin(e.o[0]) || !fin(e.o[1])) return false;
  if (!Array.isArray(e.n) || !e.n.every((v) => Number.isInteger(v) && v >= 4 && v <= 600) || e.n[0] * e.n[1] > MAX_CELLS) return false;
  if (typeof e.d !== "string") return false;
  if (e.s != null && !(Array.isArray(e.s) && e.s.length <= MAX_STAMPS && e.s.every((s) => Array.isArray(s) && s.length === 7 && s.every(fin) && STAMP_KINDS[s[0]]))) return false;
  return true;
}

// The green's outline, and how far a spot is inside it (negative outside).
const outlineOf = (s) => s.poly ?? blobOutline(s, 96);
function depthIn(poly, x, z) {
  const d = distanceToEdge(poly, x, z);
  return insidePolygon(poly, x, z) ? d : -d;
}

// The ground under the green without anything done to it by hand: the real
// ground and the green's own slopes as it was made. `stored` is the hole as
// kept (its layout, before the edits are laid on).
const unpacked = new WeakMap();
export function terrainOf(stored) {
  if (stored.source !== "map" || !stored.terrain) return null;
  let terrain = unpacked.get(stored.terrain);
  if (!terrain) {
    terrain = unpackGrid(stored.terrain);
    unpacked.set(stored.terrain, terrain);
  }
  return terrain;
}
export function groundOf(stored) {
  const g = { contours: stored.contours ?? [], terrain: terrainOf(stored) };
  return (x, z) => greenHeight(g, x, z);
}

// The box a grid for this green covers, on whole squares.
function boxFor(green, pad) {
  const b = polygonBounds(outlineOf(green));
  const x0 = Math.floor((b.x0 - pad) / CELL) * CELL;
  const z0 = Math.floor((b.z0 - pad) / CELL) * CELL;
  return { x0, z0, nx: Math.ceil((b.x1 + pad - x0) / CELL) + 1, nz: Math.ceil((b.z1 + pad - z0) / CELL) + 1 };
}

// A grid for the green as it is now (`L`, with the edits laid on), ready to
// be worked on: the one it already has, grown if the green has grown past
// it - or, the first time, nothing raised or lowered anywhere, so the
// first rub changes only what it touches.
export function startGrid(stored, L, edit = null) {
  const was = edit ? gridFromEdit(edit) : null;
  const box = boxFor(L.green, FRINGE + PAD);
  if (was) {
    const covers = box.x0 >= was.x0 - 1e-6 && box.z0 >= was.z0 - 1e-6 && box.x0 + (box.nx - 1) * CELL <= was.x0 + (was.nx - 1) * CELL + 1e-6 && box.z0 + (box.nz - 1) * CELL <= was.z0 + (was.nz - 1) * CELL + 1e-6;
    if (covers) return was;
    const x0 = Math.min(box.x0, was.x0);
    const z0 = Math.min(box.z0, was.z0);
    const x1 = Math.max(box.x0 + (box.nx - 1) * CELL, was.x0 + (was.nx - 1) * CELL);
    const z1 = Math.max(box.z0 + (box.nz - 1) * CELL, was.z0 + (was.nz - 1) * CELL);
    const g = { x0, z0, nx: Math.round((x1 - x0) / CELL) + 1, nz: Math.round((z1 - z0) / CELL) + 1, stamps: was.stamps };
    g.h = new Float32Array(g.nx * g.nz);
    for (let iz = 0; iz < g.nz; iz++) for (let ix = 0; ix < g.nx; ix++) g.h[iz * g.nx + ix] = sampleStored(was, x0 + ix * CELL, z0 + iz * CELL);
    return g;
  }
  return { ...box, h: new Float32Array(box.nx * box.nz), stamps: [] };
}

// A grid holding the heights `at(x, z)` (above the hole's zero, as play
// has them), as how far that is from the ground: what styles and levelling
// build.
function gridOf(box, at, ground) {
  const g = { ...box, stamps: [] };
  g.h = new Float32Array(g.nx * g.nz);
  for (let iz = 0; iz < g.nz; iz++) {
    for (let ix = 0; ix < g.nx; ix++) {
      const x = g.x0 + ix * CELL;
      const z = g.z0 + iz * CELL;
      g.h[iz * g.nx + ix] = at(x, z) - ground(x, z);
    }
  }
  return g;
}

// The heights a grid stands for: the ground plus what's been done by hand.
function surfaceOfGrid(g, ground) {
  const a = new Float32Array(g.h.length);
  for (let iz = 0; iz < g.nz; iz++) for (let ix = 0; ix < g.nx; ix++) a[iz * g.nx + ix] = g.h[iz * g.nx + ix] + ground(g.x0 + ix * CELL, g.z0 + iz * CELL);
  return a;
}

// What a green's heights are measured from: the grass on a designed hole,
// the real ground's average over the green on a mapped one.
function levelFor(stored, L, ground) {
  if (stored.source !== "map") return 0;
  const poly = outlineOf(L.green);
  const b = polygonBounds(poly);
  let sum = 0;
  let n = 0;
  for (let x = b.x0; x <= b.x1; x += 1) {
    for (let z = b.z0; z <= b.z1; z += 1) {
      if (!insidePolygon(poly, x, z)) continue;
      sum += ground(x, z);
      n++;
    }
  }
  return r2(n ? sum / n : ground(L.green.x, L.green.z));
}

// A stored grid's height at (x, z), straight between its squares, and the
// edge value carried on beyond it.
function sampleStored(g, x, z) {
  return gridHeight({ x0: g.x0, z0: g.z0, cell: CELL, nx: g.nx, nz: g.nz, h: g.h }, x, z);
}

const copy = (g) => ({ ...g, h: g.h.slice(), stamps: (g.stamps ?? []).map((s) => s.slice()) });

// ---- Tools ------------------------------------------------------------------------

// Ring brush sizes: its radius, metres.
export const RINGS = { small: 1.5, medium: 3, big: 6 };
// How much one dab of the brush raises the middle of its ring (metres).
export const DAB = 0.008;

// The brush's weight at a distance from the middle of its ring: full in
// the middle, easing to nothing - and flat - at the ring itself, so no
// rub ever leaves a step.
export const ringWeight = (d, r) => (d >= r ? 0 : (1 - (d / r) ** 2) ** 2);

// One dab of the raise (amount > 0) or lower brush.
export function rub(grid, x, z, r, amount) {
  const g = copy(grid);
  eachNear(g, x, z, r, (i, w) => (g.h[i] = nudge(g.h[i], amount * w)));
  return g;
}

// One dab of the smoothing brush: each square under the ring moves
// towards the average of the green's surface round it (the ground's own
// humps included), most in the middle of the ring.
export function smoothRub(grid, x, z, r, strength = 0.5, ground = FLAT) {
  const g = copy(grid);
  const abs = surfaceOfGrid(grid, ground);
  const avg = blurred(abs, grid.nx, grid.nz, 2);
  eachNear(g, x, z, r, (i, w) => (g.h[i] += (avg[i] - abs[i]) * w * strength));
  return g;
}
const FLAT = () => 0;

function eachNear(g, x, z, r, fn) {
  const ix0 = Math.max(0, Math.floor((x - r - g.x0) / CELL));
  const ix1 = Math.min(g.nx - 1, Math.ceil((x + r - g.x0) / CELL));
  const iz0 = Math.max(0, Math.floor((z - r - g.z0) / CELL));
  const iz1 = Math.min(g.nz - 1, Math.ceil((z + r - g.z0) / CELL));
  for (let iz = iz0; iz <= iz1; iz++) {
    for (let ix = ix0; ix <= ix1; ix++) {
      const w = ringWeight(Math.hypot(g.x0 + ix * CELL - x, g.z0 + iz * CELL - z), r);
      if (w > 0) fn(iz * g.nx + ix, w);
    }
  }
}

// A soft blur: `passes` rounds of 1-4-6-4-1 each way.
function blurred(h, nx, nz, passes) {
  let a = Float32Array.from(h);
  let b = new Float32Array(h.length);
  const k = [1, 4, 6, 4, 1];
  for (let p = 0; p < passes; p++) {
    for (const [step, count, other] of [
      [1, nx, nz],
      [nx, nz, nx],
    ]) {
      for (let o = 0; o < other; o++) {
        for (let c = 0; c < count; c++) {
          let s = 0;
          let w = 0;
          for (let t = -2; t <= 2; t++) {
            const cc = c + t;
            if (cc < 0 || cc >= count) continue;
            const i = step === 1 ? o * nx + cc : cc * nx + o;
            s += a[i] * k[t + 2];
            w += k[t + 2];
          }
          b[step === 1 ? o * nx + c : c * nx + o] = s / w;
        }
      }
      [a, b] = [b, a];
    }
  }
  return a;
}

// Smooths the whole green in one go, shapes stamped on and all (and the
// ground's own ripples): the humps and hollows keep where they are, but
// lose their sharp edges and small ripples.
export function smoothAll(grid, ground = FLAT, passes = 3) {
  const g = bakeStamps(grid, ground);
  const abs = surfaceOfGrid(g, ground);
  const soft = blurred(abs, g.nx, g.nz, passes);
  for (let i = 0; i < g.h.length; i++) g.h[i] += soft[i] - abs[i];
  return g;
}

// Level again, to start afresh: dead flat, at the grass on a designed hole
// and at the real ground's average under the green on a mapped one.
export function levelAll(stored, L, grid = startGrid(stored, L)) {
  const ground = groundOf(stored);
  const lv = stored.source === "map" ? levelFor(stored, L, ground) : 0;
  return gridOf({ x0: grid.x0, z0: grid.z0, nx: grid.nx, nz: grid.nz }, () => lv, ground);
}

// A rough measure of how bumpy a green is: the average bend between
// neighbouring squares (metres), over the squares `inside` says count.
export function roughness(grid, inside = () => true, ground = FLAT) {
  let sum = 0;
  let n = 0;
  const baked = bakeStamps(grid, ground);
  const { nx, nz } = baked;
  const h = surfaceOfGrid(baked, ground);
  for (let iz = 1; iz < nz - 1; iz++) {
    for (let ix = 1; ix < nx - 1; ix++) {
      if (!inside(grid.x0 + ix * CELL, grid.z0 + iz * CELL)) continue;
      const i = iz * nx + ix;
      sum += Math.abs(h[i - 1] + h[i + 1] + h[i - nx] + h[i + nx] - 4 * h[i]);
      n++;
    }
  }
  return n ? sum / n : 0;
}

// ---- An area of the green, outlined with dots --------------------------------------

// (The owner: "highlight the green area and then smooth it all out, and
// put its maximum amount of incline or decline on that section... more
// than a circle, so you click a few dots... you could do that over two
// sections and have a two-tier green with a big slope in it.") An area is
// a polygon [[x, z], ...] of three dots or more; each change works on the
// squares inside it in full and eases off to nothing over AREA_FEATHER
// metres outside, so no change leaves a step. Shapes stamped on are
// pressed in first (as smoothing the whole green does).
export const AREA_FEATHER = 2.5;
export const MAX_AREA_DOTS = 40;
// The slopes an area can be held to (a share: 0.02 is 2%), gentlest first.
export const AREA_SLOPES = [0.01, 0.015, 0.02, 0.025, 0.03, 0.04, 0.05];
// One step of Raise / Lower (metres).
export const AREA_STEP = 0.05;

export const validArea = (poly) => Array.isArray(poly) && poly.length >= 3 && poly.length <= MAX_AREA_DOTS && poly.every((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));

// Each square's share of a change to the area: 1 inside, easing smoothly to
// 0 at `feather` metres outside.
export function areaWeights(grid, poly, feather = AREA_FEATHER) {
  const w = new Float32Array(grid.nx * grid.nz);
  if (!validArea(poly)) return w;
  const b = polygonBounds(poly);
  for (let iz = 0; iz < grid.nz; iz++) {
    const z = grid.z0 + iz * CELL;
    if (z < b.z0 - feather || z > b.z1 + feather) continue;
    for (let ix = 0; ix < grid.nx; ix++) {
      const x = grid.x0 + ix * CELL;
      if (x < b.x0 - feather || x > b.x1 + feather) continue;
      if (insidePolygon(poly, x, z)) w[iz * grid.nx + ix] = 1;
      else if (feather > 0) w[iz * grid.nx + ix] = 1 - smoothstep(distanceToEdge(poly, x, z) / feather);
    }
  }
  return w;
}

// The grid with the area's surface moved towards `target` (heights above
// the hole's zero, square by square), by each square's weight.
function blendArea(g, abs, target, w) {
  const out = copy(g);
  for (let i = 0; i < out.h.length; i++) if (w[i] > 0) out.h[i] = clamp(out.h[i] + (target[i] - abs[i]) * w[i], -REACH, REACH);
  return out;
}

// The squares fully inside, and the surface as it is (stamps pressed in).
function areaStart(grid, poly, ground) {
  const g = bakeStamps(grid, ground);
  const abs = surfaceOfGrid(g, ground);
  const w = areaWeights(g, poly);
  const inside = [];
  for (let i = 0; i < w.length; i++) if (w[i] === 1) inside.push(i);
  // The squares inside whose neighbours are inside too: where its slope is
  // measured (at the edge itself the surface is easing into the green
  // round it).
  const nx = g.nx;
  const inner = inside.filter((i) => w[i - 1] === 1 && w[i + 1] === 1 && w[i - nx] === 1 && w[i + nx] === 1);
  return { g, abs, w, inside, inner: inner.length ? inner : inside };
}

// Level: the area dead flat at its own average height - a tier.
export function levelArea(grid, poly, ground = FLAT) {
  const { g, abs, w, inside } = areaStart(grid, poly, ground);
  if (!inside.length) return grid;

  // ⚡ Bolt: Replaced `inside.reduce` with a basic `for` loop to eliminate
  // iterator callback overhead in this hot path, keeping accumulation order exact.
  let sum = 0;
  for (let k = 0; k < inside.length; k++) sum += abs[inside[k]];
  const mean = sum / inside.length;

  return blendArea(g, abs, new Float32Array(abs.length).fill(mean), w);
}

// Smooth: the area's humps and ripples softened, its overall lie kept.
export function smoothArea(grid, poly, ground = FLAT, passes = 3) {
  const { g, abs, w } = areaStart(grid, poly, ground);
  return blendArea(g, abs, blurred(abs, g.nx, g.nz, passes), w);
}

// Raise (amount > 0) or lower the whole area, easing in at its edge.
export function raiseArea(grid, poly, amount, ground = FLAT) {
  const { g, abs, w } = areaStart(grid, poly, ground);
  return blendArea(g, abs, abs.map((v) => v + amount), w);
}

// How steep the surface is at square i (a share: rise over run), from its
// neighbours either side.
function gradientAt(h, nx, nz, i) {
  const ix = i % nx;
  const iz = Math.floor(i / nx);
  const gx = (h[iz * nx + Math.min(nx - 1, ix + 1)] - h[iz * nx + Math.max(0, ix - 1)]) / (CELL * (Math.min(nx - 1, ix + 1) - Math.max(0, ix - 1)) || 1);
  const gz = (h[Math.min(nz - 1, iz + 1) * nx + ix] - h[Math.max(0, iz - 1) * nx + ix]) / (CELL * (Math.min(nz - 1, iz + 1) - Math.max(0, iz - 1)) || 1);
  return Math.hypot(gx, gz);
}

// How steep the area is now: { mean, max } (shares), over its squares.
export function areaSlope(grid, poly, ground = FLAT) {
  const { g, abs, inner } = areaStart(grid, poly, ground);
  if (!inner.length) return { mean: 0, max: 0 };
  let sum = 0;
  let max = 0;
  for (const i of inner) {
    const s = gradientAt(abs, g.nx, g.nz, i);
    sum += s;
    max = Math.max(max, s);
  }
  return { mean: sum / inner.length, max };
}

// Limit the slope: nowhere in the area steeper than `most` (a share). The
// area's overall lie (the plane through it) is kept if it's within that,
// or eased back to it if not, still falling the same way; then its bumps
// are softened just as far as they must be.
export function limitSlope(grid, poly, most, ground = FLAT) {
  const { g, abs, w, inside, inner } = areaStart(grid, poly, ground);
  if (!inside.length || !(most > 0)) return grid;
  // The plane through the area, by least squares about its middle.
  const n = inside.length;

  // ⚡ Bolt: Consolidated a `map` and three consecutive `reduce` passes into
  // a single `for` loop. This avoids multiple array allocations and closure
  // overhead, while precisely maintaining the original float accumulation sequence.
  const xy = new Array(n);
  let sumX = 0, sumZ = 0, sumH = 0;
  for (let k = 0; k < n; k++) {
    const i = inside[k];
    const x = g.x0 + (i % g.nx) * CELL;
    const z = g.z0 + Math.floor(i / g.nx) * CELL;
    xy[k] = [x, z];
    sumX += x;
    sumZ += z;
    sumH += abs[i];
  }
  const cx = sumX / n;
  const cz = sumZ / n;
  const mean = sumH / n;
  let sxx = 0;
  let szz = 0;
  let sxz = 0;
  let sxh = 0;
  let szh = 0;
  for (let k = 0; k < inside.length; k++) {
    const dx = xy[k][0] - cx;
    const dz = xy[k][1] - cz;
    const dh = abs[inside[k]] - mean;
    sxx += dx * dx;
    szz += dz * dz;
    sxz += dx * dz;
    sxh += dx * dh;
    szh += dz * dh;
  }
  const det = sxx * szz - sxz * sxz;
  let bx = det ? (sxh * szz - szh * sxz) / det : 0;
  let bz = det ? (szh * sxx - sxh * sxz) / det : 0;
  const tilt = Math.hypot(bx, bz);
  // A little under the limit, so the bumps have some room.
  const room = most * 0.9;
  if (tilt > room) {
    bx *= room / tilt;
    bz *= room / tilt;
  }
  const plane = (x, z) => mean + bx * (x - cx) + bz * (z - cz);
  const planeAt = new Float32Array(abs.length);
  const resid = new Float32Array(abs.length);
  for (let i = 0; i < abs.length; i++) {
    const x = g.x0 + (i % g.nx) * CELL;
    const z = g.z0 + Math.floor(i / g.nx) * CELL;
    planeAt[i] = plane(x, z);
    resid[i] = abs[i] - planeAt[i];
  }
  // The bumps kept as far as the limit allows: less of them each step, and
  // softened, until nowhere inside is steeper.
  const target = new Float32Array(abs.length);
  let keep = 1;
  let r = resid;
  for (let step = 0; step < 24; step++) {
    for (let i = 0; i < abs.length; i++) target[i] = planeAt[i] + r[i] * keep;
    const steepest = Math.max(...inner.map((i) => gradientAt(target, g.nx, g.nz, i)));
    if (steepest <= most) break;
    keep *= 0.8;
    r = blurred(r, g.nx, g.nz, 1);
    if (keep < 0.02) keep = 0;
  }
  // Outside the area the surface is left as it was (the weights ease it).
  return blendArea(g, abs, target, w);
}

// ---- Shapes stamped on --------------------------------------------------------------

// The kinds, with their size when first put down (length, width, metres).
export const STAMP_KINDS = [
  { id: "round", word: "Round", size: [5, 5] },
  { id: "rect", word: "Rectangle", size: [9, 5] },
  { id: "crescent", word: "Crescent", size: [11, 2.6] },
];
export const STAMP_LIMITS = { length: [1.5, 24], width: [1, 16], height: [-0.4, 0.4] };

// A stamp's soft edge: how wide the band over which it rises (metres).
// `room` is how steep its edge may be (a fall per metre): the edge widens
// with the stamp's height to keep to it. (The steepest a smoothstep rises
// is half as steep again as its average.)
export const stampSoft = (s, room = STAMP_STEEP) => Math.max(1.2, (Math.abs(s[6]) * 1.5) / room);

// Each stamp's room, against the green under it: on a green already
// falling 2%, a stamp's edge may add only so much before a ball can't stop
// on it, so its edge is wider there. `abs` is the grid's heights as played
// (the ground and all), without the stamps.
function stampRooms(g, abs) {
  return g.stamps.map((s) => {
    const reach = Math.max(s[3], s[4]) / 2 + 2;
    const ix0 = Math.max(0, Math.floor((s[1] - reach - g.x0) / CELL));
    const ix1 = Math.min(g.nx - 2, Math.ceil((s[1] + reach - g.x0) / CELL));
    const iz0 = Math.max(0, Math.floor((s[2] - reach - g.z0) / CELL));
    const iz1 = Math.min(g.nz - 2, Math.ceil((s[2] + reach - g.z0) / CELL));
    let steep = 0;
    for (let iz = iz0; iz <= iz1; iz++) {
      for (let ix = ix0; ix <= ix1; ix++) {
        const i = iz * g.nx + ix;
        steep = Math.max(steep, Math.hypot(abs[i + 1] - abs[i], abs[i + g.nx] - abs[i]) / CELL);
      }
    }
    return clamp(STAMP_STEEP - steep, STAMP_ROOM, STAMP_STEEP);
  });
}

// How far (x, z) is inside a stamp's shape (metres; negative outside).
export function stampDepth(s, x, z) {
  const [kind, sx, sz, len, wid, turn] = s;
  const c = Math.cos(turn);
  const n = Math.sin(turn);
  const u = (x - sx) * c + (z - sz) * n;
  const v = -(x - sx) * n + (z - sz) * c;
  const a = len / 2;
  const b = wid / 2;
  if (kind === 0) return (1 - Math.hypot(u / a, v / b)) * Math.min(a, b);
  if (kind === 1) {
    // A box with rounded corners.
    const rr = Math.min(0.6, a, b);
    const qx = Math.abs(u) - (a - rr);
    const qz = Math.abs(v) - (b - rr);
    const out = Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0);
    return rr - out;
  }
  // A crescent: a band `wid` wide along an arc through the stamp's middle,
  // `len` from tip to tip along its turn, bowed out to its left.
  const R = Math.max(a * 1.15, 1);
  const sweep = Math.asin(Math.min(1, a / R));
  const dv = v + R;
  const phi = Math.atan2(u, dv);
  let dist;
  if (Math.abs(phi) <= sweep) dist = Math.abs(Math.hypot(u, dv) - R);
  else {
    const t = Math.sign(phi) * sweep;
    dist = Math.hypot(u - Math.sin(t) * R, dv - Math.cos(t) * R);
  }
  return b - dist;
}

// A stamp's height at (x, z): its full height well inside, easing to
// nothing across its soft edge, which is centred on its outline.
export function stampHeight(s, x, z, soft = stampSoft(s)) {
  const reach = Math.max(s[3], s[4]) / 2 + soft;
  if (Math.abs(x - s[1]) > reach + 2 || Math.abs(z - s[2]) > reach + 2) return 0;
  return s[6] * smoothstep((stampDepth(s, x, z) + soft / 2) / soft);
}

// A stamp's outline, for drawing: [[x, z], ...].
export function stampOutline(s, n = 48) {
  const [kind, sx, sz, len, wid, turn] = s;
  const a = len / 2;
  const b = wid / 2;
  const local = [];
  if (kind === 0) for (let i = 0; i < n; i++) local.push([Math.cos((i / n) * Math.PI * 2) * a, Math.sin((i / n) * Math.PI * 2) * b]);
  else if (kind === 1) {
    const rr = Math.min(0.6, a, b);
    const corners = [
      [a - rr, b - rr, 0],
      [-(a - rr), b - rr, Math.PI / 2],
      [-(a - rr), -(b - rr), Math.PI],
      [a - rr, -(b - rr), (Math.PI * 3) / 2],
    ];
    for (const [cx, cz, t0] of corners) for (let i = 0; i <= 4; i++) local.push([cx + Math.cos(t0 + (i / 4) * (Math.PI / 2)) * rr, cz + Math.sin(t0 + (i / 4) * (Math.PI / 2)) * rr]);
  } else {
    const R = Math.max(a * 1.15, 1);
    const sweep = Math.asin(Math.min(1, a / R));
    const m = Math.floor(n / 3);
    // Along the arc at radius r and angle t (0 at the stamp's middle).
    const at = (r, t) => [Math.sin(t) * r, -R + Math.cos(t) * r];
    const cap = (t, dir) => {
      const [ex, ez] = at(R, t);
      for (let i = 1; i < 6; i++) {
        const k = (Math.PI * i) / 6;
        // From the outside of the band round the tip to the inside.
        const rad = [Math.sin(t), Math.cos(t)];
        const tan = [Math.cos(t) * dir, -Math.sin(t) * dir];
        local.push([ex + (rad[0] * Math.cos(k) + tan[0] * Math.sin(k)) * b, ez + (rad[1] * Math.cos(k) + tan[1] * Math.sin(k)) * b]);
      }
    };
    for (let i = 0; i <= m; i++) local.push(at(R + b, -sweep + (2 * sweep * i) / m));
    cap(sweep, 1);
    for (let i = 0; i <= m; i++) local.push(at(R - b, sweep - (2 * sweep * i) / m));
    cap(-sweep, -1);
  }
  const c = Math.cos(turn);
  const sn = Math.sin(turn);
  return local.map(([u, v]) => [sx + u * c - v * sn, sz + u * sn + v * c]);
}

// Where a stamp's handles are: the end one (drag to make it longer or
// shorter, and to turn it) and the side one (wider or narrower).
export function stampHandles(s) {
  const [kind, sx, sz, len, wid, turn] = s;
  const c = Math.cos(turn);
  const sn = Math.sin(turn);
  // A crescent's end handle sits on its tip, which curls back.
  // Both a little outside it, clear of its middle.
  let [eu, ev] = [len / 2 + 0.6, 0];
  if (kind === 2) {
    const R = Math.max((len / 2) * 1.15, 1);
    const t = Math.asin(Math.min(1, len / 2 / R));
    [eu, ev] = [Math.sin(t) * R + Math.cos(t) * 0.6, -R + Math.cos(t) * R - Math.sin(t) * 0.6];
  }
  const side = [0, wid / 2 + 0.6];
  const at = ([u, v]) => [sx + u * c - v * sn, sz + u * sn + v * c];
  return { end: at([eu, ev]), side: at(side) };
}

// A new stamp, as first put down: across the line of play.
export function newStamp(kind, x, z, height, turn = 0) {
  const [len, wid] = STAMP_KINDS[kind].size;
  return [kind, r2(x), r2(z), len, wid, r2(turn), height];
}

// The grid with its stamps pressed into it (and none left as shapes), as
// they are played: each as wide at its edge as the green under it needs.
export function bakeStamps(grid, ground = FLAT) {
  const g = copy(grid);
  if (!g.stamps.length) return g;
  const soft = stampRooms(g, surfaceOfGrid(g, ground)).map((room, k) => stampSoft(g.stamps[k], room));
  for (let iz = 0; iz < g.nz; iz++) {
    for (let ix = 0; ix < g.nx; ix++) {
      const x = g.x0 + ix * CELL;
      const z = g.z0 + iz * CELL;
      let add = 0;
      for (let k = 0; k < g.stamps.length; k++) {
        add += stampHeight(g.stamps[k], x, z, soft[k]);
      }
      g.h[iz * g.nx + ix] = nudge(g.h[iz * g.nx + ix], add);
    }
  }
  g.stamps = [];
  return g;
}

// ---- Styles -----------------------------------------------------------------------------

export const STYLES = [
  { id: "gentle", word: "Gentle" },
  { id: "backfront", word: "Back to front" },
  { id: "tiers", word: "Two tiers" },
  { id: "punchbowl", word: "Punchbowl" },
  { id: "crowned", word: "Crowned" },
  { id: "saddle", word: "Saddle" },
  { id: "random", word: "Random" },
];

// Small seeded random, so a style's variations come back the same.
function seeded(seed) {
  return mulberry32(seed);
}

// The way into the green: from the line of play short of it towards its
// middle. "Back" is further along it.
export function approachOf(L) {
  const g = L.green;
  const pts = L.path ?? [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const [x, z] = pts[i];
    const d = Math.hypot(g.x - x, g.z - z);
    if (d > 20) return Math.atan2(g.z - z, g.x - x);
  }
  return 0;
}

// Slopes kept to: round the cup, and over most of the green.
// A ball can't stop on much more than `steep` on an ordinary green.
// A ball can't stop on much more than `steep` on the fastest greens offered
// (Stimp 13): at Stimp 10 it's nearer 8%, but a green has to suit them all.
export const PUTTABLE = { cup: 0.03, most: 0.035, share: 0.8, steep: 0.06 };

// A ready-made green in a style, as a grid: `variation` 0, 1, 2... gives a
// different take on it each time. Its slopes are kept puttable: gentle
// round the cup and over most of the green; a tier's ramp is steeper, but
// kept away from the cup. On a designed hole the lowest of it sits on the
// grass; on a mapped one it sits at the real ground's average level.
export function styleGrid(stored, L, style, variation = 0) {
  const ground = groundOf(stored);
  const lv = levelFor(stored, L, ground);
  const box = boxFor(L.green, FRINGE + PAD);
  const poly = outlineOf(L.green);
  const [cx, cz] = [L.green.x, L.green.z];
  const idx = Math.max(0, STYLES.findIndex((s) => s.id === style));
  const rand = seeded(9173 + idx * 7919 + variation * 104729);
  const aim = approachOf(L);
  // The green's reach along the approach (u) and across it (v).
  let u0 = Infinity;
  let u1 = -Infinity;
  let v0 = Infinity;
  let v1 = -Infinity;
  const ca = Math.cos(aim);
  const sa = Math.sin(aim);
  const toUV = (x, z) => [(x - cx) * ca + (z - cz) * sa, -(x - cx) * sa + (z - cz) * ca];
  for (const [x, z] of poly) {
    const [u, v] = toUV(x, z);
    u0 = Math.min(u0, u);
    u1 = Math.max(u1, u);
    v0 = Math.min(v0, v);
    v1 = Math.max(v1, v);
  }
  const uc = (u0 + u1) / 2;
  const vc = (v0 + v1) / 2;
  const Ru = Math.max(4, (u1 - u0) / 2);
  const Rv = Math.max(4, (v1 - v0) / 2);
  const R = (Ru + Rv) / 2;
  const pin = toUV(L.pin[0], L.pin[1]);
  const pick = (lo, hi) => lo + rand() * (hi - lo);
  const sign = () => (rand() < 0.5 ? -1 : 1);

  // Each style: a list of parts, each a function of (u, v), with a scale
  // the puttable pass can turn down.
  const plane = (pct, dir) => (u, v) => (pct / 100) * ((u - uc) * Math.cos(dir) + (v - vc) * Math.sin(dir));
  const swell = (a, su, sv, s) => (u, v) => a * Math.exp(-((u - su) ** 2 + (v - sv) ** 2) / (2 * s * s));
  // Distance out from a middle, against the green's own edge that way: 0
  // in the middle, 1 at the edge, so bowls and crowns follow its shape.
  const edgeR = (mu, mv) => {
    const BINS = 90;
    const radius = new Float32Array(BINS).fill(0);
    for (const [x, z] of poly) {
      const [pu, pv] = toUV(x, z);
      const bin = Math.round(((Math.atan2(pv - mv, pu - mu) / (Math.PI * 2)) % 1 + 1) * BINS) % BINS;
      radius[bin] = Math.max(radius[bin], Math.hypot(pu - mu, pv - mv));
    }
    // Bins no outline point fell in: from their neighbours.
    for (let pass = 0; pass < BINS && radius.some((r) => !r); pass++) {
      for (let i = 0; i < BINS; i++) if (!radius[i]) radius[i] = radius[(i + 1) % BINS] || radius[(i + BINS - 1) % BINS];
    }
    return (u, v) => {
      const t = (((Math.atan2(v - mv, u - mu) / (Math.PI * 2)) % 1) + 1) % 1 * BINS;
      const i = Math.floor(t) % BINS;
      const f = t - Math.floor(t);
      const r = radius[i] * (1 - f) + radius[(i + 1) % BINS] * f;
      return Math.hypot(u - mu, v - mv) / Math.max(3, r || R);
    };
  };
  let parts = [];
  // On real ground the green keeps a little of the land's own fall (1.5% at
  // most), so it sits into the hillside rather than being cut level into it.
  if (stored.source === "map") {
    let n = 0;
    let su = 0, sv = 0, sh = 0, suu = 0, svv = 0, suv = 0, suh = 0, svh = 0;
    for (let x = polygonBounds(poly).x0; x <= polygonBounds(poly).x1; x += 1.5) {
      for (let z = polygonBounds(poly).z0; z <= polygonBounds(poly).z1; z += 1.5) {
        if (!insidePolygon(poly, x, z)) continue;
        const [u, v] = toUV(x, z);
        const h = ground(x, z);
        n++;
        su += u; sv += v; sh += h; suu += u * u; svv += v * v; suv += u * v; suh += u * h; svh += v * h;
      }
    }
    if (n > 3) {
      const mu = su / n, mv = sv / n, mh = sh / n;
      const cuu = suu / n - mu * mu, cvv = svv / n - mv * mv, cuv = suv / n - mu * mv, cuh = suh / n - mu * mh, cvh = svh / n - mv * mh;
      const det = cuu * cvv - cuv * cuv;
      if (Math.abs(det) > 1e-9) {
        let bu = (cuh * cvv - cvh * cuv) / det;
        let bv = (cvh * cuu - cuh * cuv) / det;
        const m = Math.hypot(bu, bv);
        if (m > 0.015) [bu, bv] = [(bu * 0.015) / m, (bv * 0.015) / m];
        parts.push((u, v) => bu * (u - uc) + bv * (v - vc));
      }
    }
  }
  let ramp = null; // a tier's ramp: [distance(u, v) from its middle line, half width]
  switch (STYLES[idx].id) {
    case "gentle": {
      parts.push(plane(pick(0.8, 1.4), pick(-0.6, 0.6)));
      const n = 2 + Math.floor(rand() * 2);
      for (let i = 0; i < n; i++) parts.push(swell(sign() * pick(0.025, 0.045), uc + pick(-0.6, 0.6) * Ru, vc + pick(-0.6, 0.6) * Rv, R * pick(0.3, 0.45)));
      break;
    }
    case "backfront": {
      parts.push(plane(pick(1.7, 2.4), pick(-0.45, 0.45)));
      parts.push(swell(sign() * pick(0.015, 0.03), uc + pick(-0.5, 0.5) * Ru, vc + pick(-0.5, 0.5) * Rv, R * 0.4));
      break;
    }
    case "tiers": {
      // A ramp across the green between a lower and an upper level; each
      // level falls gently towards the front. Mostly the back is higher;
      // every third take splits it left and right instead.
      const across = variation % 3 === 2;
      const dir = (across ? Math.PI / 2 : 0) + pick(-0.4, 0.4);
      const step = pick(0.24, 0.34) * (across ? sign() : 1);
      // (A ramp no steeper than 4.5%, so with the fall along each level it
      // stays under what a ball can stop on.)
      const half = Math.max(2, (Math.abs(step) * 1.5) / 0.045) / 2;
      const span = across ? Rv : Ru;
      let at = pick(-0.25, 0.25) * span;
      const dist = (u, v) => (u - uc) * Math.cos(dir) + (v - vc) * Math.sin(dir) - at;
      // Never under the cup: moved along until the cup is well clear of it.
      const clear = half + 2;
      if (Math.abs(dist(...pin)) < clear) at += (dist(...pin) >= 0 ? -1 : 1) * (clear - Math.abs(dist(...pin)));
      const tier = (u, v) => step * smoothstep((dist(u, v) + half) / (2 * half));
      tier.fixed = true;
      parts.push(tier);
      parts.push(plane(pick(0.8, 1.3), pick(-0.3, 0.3)));
      ramp = [dist, half];
      break;
    }
    case "punchbowl": {
      const mu = uc + pick(-0.15, 0.15) * Ru;
      const mv = vc + pick(-0.15, 0.15) * Rv;
      const a = 0.013 * R * pick(0.85, 1.1);
      const out = edgeR(mu, mv);
      parts.push((u, v) => a * Math.min(1.6, out(u, v)) ** 2);
      parts.push(plane(pick(0.3, 0.7), pick(-0.8, 0.8)));
      break;
    }
    case "crowned": {
      const mu = uc + pick(-0.2, 0.2) * Ru;
      const mv = vc + pick(-0.2, 0.2) * Rv;
      const a = 0.011 * R * pick(0.85, 1.1);
      const out = edgeR(mu, mv);
      parts.push((u, v) => a * (1 - Math.min(1.6, out(u, v)) ** 2));
      parts.push(plane(pick(0.3, 0.7), pick(-0.8, 0.8)));
      break;
    }
    case "saddle": {
      // High to the sides, low along a channel through the middle (or the
      // other way round, every other take).
      const turn = (variation % 2 ? Math.PI / 2 : 0) + pick(-0.35, 0.35);
      const a = 0.01 * R * pick(0.85, 1.1);
      parts.push((u, v) => {
        const p = ((u - uc) * Math.cos(turn) + (v - vc) * Math.sin(turn)) / R;
        const q = (-(u - uc) * Math.sin(turn) + (v - vc) * Math.cos(turn)) / R;
        return a * (q * q - p * p);
      });
      parts.push(plane(pick(0.4, 0.8), pick(-0.5, 0.5)));
      break;
    }
    default: {
      parts.push(plane(pick(0.4, 1.5), pick(-Math.PI, Math.PI)));
      const n = 3 + Math.floor(rand() * 3);
      for (let i = 0; i < n; i++) parts.push(swell(sign() * pick(0.04, 0.09), uc + pick(-0.8, 0.8) * Ru, vc + pick(-0.8, 0.8) * Rv, R * pick(0.2, 0.38)));
    }
  }

  // Kept puttable: turned down until gentle enough round the cup and over
  // most of the green (a tier's ramp aside).
  const at = (u, v, k) => {
    let s = 0;
    for (let i = 0; i < parts.length; i++) {
      const f = parts[i];
      s += f(u, v) * (f.fixed ? 1 : k);
    }
    return s;
  };
  const slopeAt = (u, v, k) => {
    const e = 0.25;
    return Math.hypot(at(u + e, v, k) - at(u - e, v, k), at(u, v + e, k) - at(u, v - e, k)) / (2 * e);
  };
  const b = polygonBounds(poly);
  const samples = [];
  for (let x = b.x0; x <= b.x1; x += 1) for (let z = b.z0; z <= b.z1; z += 1) if (insidePolygon(poly, x, z)) samples.push(toUV(x, z));
  let k = 1;
  for (let round = 0; round < 12; round++) {
    let cup = 0;
    for (let t = 0; t < 12; t++) {
      const a = (t / 12) * Math.PI * 2;
      for (const r of [0, 1, 2]) cup = Math.max(cup, slopeAt(pin[0] + Math.cos(a) * r, pin[1] + Math.sin(a) * r, k));
    }
    // ⚡ Bolt: Combined `filter` and `reduce` loops over `samples` into a single
    // pass. This computes `ok` count and `top` slope in one go, significantly
    // reducing array allocations and redundant `slopeAt` calls in this hot loop.
    let offCount = 0;
    let okCount = 0;
    let top = 0;
    for (let i = 0; i < samples.length; i++) {
      const [u, v] = samples[i];
      const slope = slopeAt(u, v, k);
      top = Math.max(top, slope);
      if (!ramp || Math.abs(ramp[0](u, v)) > ramp[1]) {
        offCount++;
        if (slope <= PUTTABLE.most) okCount++;
      }
    }
    const ok = okCount / Math.max(1, offCount);
    // Nowhere steeper than a ball can stop on (a tier's ramp included).
    if (cup <= PUTTABLE.cup * 0.9 && ok >= PUTTABLE.share + 0.05 && top <= PUTTABLE.steep - 0.005) break;
    k *= 0.85;
  }

  // Where it sits: its lowest point on the green on the grass (designed),
  // or its average at the ground's (mapped).
  let lo = Infinity;
  let sum = 0;
  let n = 0;
  for (let iz = 0; iz < box.nz; iz++) {
    for (let ix = 0; ix < box.nx; ix++) {
      const x = box.x0 + ix * CELL;
      const z = box.z0 + iz * CELL;
      if (depthIn(poly, x, z) < -FRINGE) continue;
      const v = at(...toUV(x, z), k);
      lo = Math.min(lo, v);
      sum += v;
      n++;
    }
  }
  const shift = stored.source === "map" ? lv - sum / Math.max(1, n) : -lo + 0.02;
  return gridOf(box, (x, z) => at(...toUV(x, z), k) + shift, ground);
}

// ---- Laying it on the hole --------------------------------------------------------------

// The shaped green as one of the green's contours (see putting.mjs): its
// surface T and weight W on a grid wide enough for the bank, worked out
// from the edit, the green as it ends up, the sand and water round it and
// the hole as kept (`stored`, for the ground it has to meet). Null if the
// edit is damaged. Worked out again only when something it depends on
// changes: a rub of the brush changes the heights but not the green, so
// the green's own part is kept between rubs.
const built = new Map();
const sites = new WeakMap();
const NO_GROUND = {};
export function sculptContour(e, green, bunkers, water, stored) {
  const near = [...bunkers.map((s) => ({ s, water: false })), ...water.map((s) => ({ s, water: true }))];
  // (The hole's own contours are part of its ground: a mapped hole given
  // new ones keeps its terrain.)
  const siteKey = [JSON.stringify(outlineOf(green)), near.map(({ s, water }) => `${water ? "w" : "b" + (s.join ?? "")}${JSON.stringify(outlineOf(s))}`).join(";"), JSON.stringify(stored.contours ?? [])].join("|");
  // Each change makes a new copy of the hole, but its ground is shared.
  const ground = (stored.source === "map" && stored.terrain) || stored.contours || NO_GROUND;
  let mine = sites.get(ground);
  if (!mine) sites.set(ground, (mine = new Map()));
  let site = mine.get(siteKey);
  if (!site) {
    site = siteFor(green, near, groundOf(stored), stored.source !== "map");
    // A designed green sits on flat ground and never below it: lowered
    // below the grass, the whole of it comes up (and its bank with it).
    // (Within 2 cm, as a designed green with hollows is: holeedits.mjs.)
    site.floor = stored.source === "map" ? null : -0.02;
    mine.set(siteKey, site);
    if (mine.size > 6) mine.delete(mine.keys().next().value);
  }
  const id = [e.d, JSON.stringify(e.s ?? []), e.o, e.n].join("|");
  let out = built.get(site)?.get(id);
  if (out !== undefined) return out;
  out = buildContour(e, site);
  if (!built.has(site)) built.set(site, new Map());
  const cache = built.get(site);
  cache.set(id, out);
  if (cache.size > 8) cache.delete(cache.keys().next().value);
  if (built.size > 12) built.delete(built.keys().next().value);
  return out;
}

// How steep the face may be where the green comes down into sand or water
// beside it (a fall per metre, on average across it: at its steepest, half
// as steep again), and how wide that face is at least and at most (metres).
const FACE = { slope: 0.45, min: 1.2, max: 8 };

// The green's part: where the grid lies, how far each square is inside the
// green, the ground there and along the fringe's outer edge, and where
// sand or water in play lies (how far in, and which).
function siteFor(green, near, ground, designed) {
  const poly = outlineOf(green);
  const box = boxFor(green, MARGIN);
  const { x0, z0, nx, nz } = box;
  const n = nx * nz;
  const depth = new Float32Array(n);
  const base = new Float32Array(n);
  const sandIn = new Float32Array(n).fill(-1);
  const sandOf = new Int16Array(n).fill(-1);
  const edge = [];
  const shapes = near.map(({ s, water }) => ({ poly: outlineOf(s), b: polygonBounds(outlineOf(s)), water, loose: designed && !water && s.join == null }));
  const pb = polygonBounds(poly);
  const far = MARGIN;
  for (let iz = 0; iz < nz; iz++) {
    for (let ix = 0; ix < nx; ix++) {
      const x = x0 + ix * CELL;
      const z = z0 + iz * CELL;
      const i = iz * nx + ix;
      // Well clear of the green's box: past the bank, whatever its shape.
      const out = Math.max(pb.x0 - x, x - pb.x1, pb.z0 - z, z - pb.z1);
      const d = out > far ? -out : depthIn(poly, x, z);
      depth[i] = d;
      base[i] = ground(x, z);
      if (d < -FRINGE + 0.01 && d > -FRINGE - 0.8) edge.push(i, ground(x, z));
      if (d >= 0 || d <= -far) continue;
      shapes.forEach((s, k) => {
        if (x < s.b.x0 || x > s.b.x1 || z < s.b.z0 || z > s.b.z1 || !insidePolygon(s.poly, x, z)) return;
        let inSand = distanceToEdge(s.poly, x, z);
        // On a designed hole the fringe beats the sand of a bunker nobody
        // has set beside the green: there, the sand starts past the fringe.
        if (s.loose) inSand = d > -FRINGE ? -1 : Math.min(inSand, -d - FRINGE);
        if (inSand > sandIn[i]) {
          sandIn[i] = inSand;
          sandOf[i] = k;
        }
      });
    }
  }
  return { ...box, depth, base, sandIn, sandOf, shapes: shapes.length, edge, ground };
}

function buildContour(e, site) {
  const stored = gridFromEdit(e);
  if (!stored) return null;
  const { x0, z0, nx, nz, depth, base, sandIn, sandOf, edge, ground } = site;
  const n = nx * nz;
  const T = new Float32Array(n);
  const sx1 = stored.x0 + (stored.nx - 1) * CELL;
  const sz1 = stored.z0 + (stored.nz - 1) * CELL;
  // Beyond the stored squares (a green grown since, and the bank), the
  // green's height above the ground carries on out, following the ground -
  // so a green on a hillside eases into the hill rather than standing out
  // over it, and ground nobody has touched stays exactly as it was. But a
  // green raised or lowered a long way (a metre or more: built up level on
  // the lip of a steep drop, say) carries on level instead, or its bank
  // would copy the drop, steeper, down into whatever lies below it.
  // Smoothed so the corners don't crease.
  const unknown = [];
  const lift = new Float32Array(n);
  const level = new Float32Array(n);
  for (let iz = 0; iz < nz; iz++) {
    for (let ix = 0; ix < nx; ix++) {
      const x = x0 + ix * CELL;
      const z = z0 + iz * CELL;
      const i = iz * nx + ix;
      if (depth[i] <= -MARGIN) continue;
      const cx = clamp(x, stored.x0, sx1);
      const cz = clamp(z, stored.z0, sz1);
      lift[i] = sampleStored(stored, cx, cz);
      level[i] = lift[i] + ground(cx, cz);
      if (cx !== x || cz !== z) unknown.push(i);
    }
  }
  for (let pass = 0; pass < 24; pass++) {
    for (const i of unknown) {
      const ix = i % nx;
      if (ix < 1 || ix >= nx - 1 || i < nx || i >= n - nx) continue;
      lift[i] = (lift[i - 1] + lift[i + 1] + lift[i - nx] + lift[i + nx]) / 4;
      level[i] = (level[i - 1] + level[i + 1] + level[i - nx] + level[i + nx]) / 4;
    }
  }
  for (let i = 0; i < n; i++) T[i] = base[i] + lift[i];
  for (const i of unknown) T[i] += (level[i] - T[i]) * smoothstep((Math.abs(lift[i]) - 0.3) / 1.2);
  // The stamps, each as soft at its edge as the green under it needs.
  if (stored.stamps.length) {
    const soft = stampRooms(stored, surfaceOfGrid(stored, ground)).map((room, k) => stampSoft(stored.stamps[k], room));
    for (let iz = 0; iz < nz; iz++) {
      for (let ix = 0; ix < nx; ix++) {
        const i = iz * nx + ix;
        if (depth[i] < -MARGIN) continue;
        for (let k = 0; k < stored.stamps.length; k++) {
          T[i] += stampHeight(stored.stamps[k], x0 + ix * CELL, z0 + iz * CELL, soft[k]);
        }
      }
    }
  }
  if (site.floor != null) {
    let low = Infinity;
    for (let i = 0; i < n; i++) if (depth[i] >= 0) low = Math.min(low, T[i]);
    if (low < site.floor) for (let i = 0; i < n; i++) T[i] += site.floor - low;
  }
  // The bank: wider the further it has to come back to the ground, so it
  // stays a gentle roll rather than a wall.
  let diff = 0;
  for (let k = 0; k < edge.length; k += 2) diff = Math.max(diff, Math.abs(T[edge[k]] - edge[k + 1]));
  const bank = clamp(BANK[0] + diff * 12, BANK[0], BANK[1]);
  const W = new Float32Array(n);
  for (let iz = 2; iz < nz - 2; iz++) {
    for (let ix = 2; ix < nx - 2; ix++) {
      const i = iz * nx + ix;
      const d = depth[i];
      W[i] = d >= -FRINGE ? 1 : smoothstep((d + FRINGE + bank) / bank);
    }
  }
  // Sand and water by the green keep to the ground: the green comes down
  // to it over a face inside their edge - a short one if it stands only a
  // little above or below, wider the more it has to come down, so it's
  // never a wall. Where there isn't room for that inside the sand (a green
  // built up over a steep drop), the sand comes down only as far as a face
  // that steep can take it, and otherwise lies on the green's bank.
  if (site.shapes) {
    const rim = new Float32Array(site.shapes);
    const room = new Float32Array(site.shapes);
    for (let i = 0; i < n; i++) {
      const k = sandOf[i];
      if (k < 0) continue;
      room[k] = Math.max(room[k], sandIn[i]);
      if (sandIn[i] < 0.75) rim[k] = Math.max(rim[k], Math.abs(T[i] - base[i]) * W[i]);
    }
    const face = [...rim].map((r, k) => Math.max(0.5, Math.min(clamp(r / FACE.slope, FACE.min, FACE.max), room[k] * 0.9)));
    const give = [...rim].map((r, k) => (r > 0 ? Math.min(1, (FACE.slope * face[k]) / r) : 1));
    for (let i = 0; i < n; i++) {
      const k = sandOf[i];
      if (k >= 0) W[i] *= 1 - give[k] * smoothstep(sandIn[i] / face[k]);
    }
  }
  prefilter(T, nx, nz);
  return { sculpt: 1, x0, z0, cell: CELL, nx, nz, T, W, bank: r2(bank) };
}

// Turns heights into the numbers a cubic B-spline is drawn from so that it
// passes through every one of them, not just near them: so a square
// nobody has touched plays exactly as the ground did. (Unser's recursive
// filter, along the rows and then the columns.)
function prefilter(a, nx, nz) {
  const pole = Math.sqrt(3) - 2;
  const line = (start, step, n) => {
    if (n < 3) return;
    const at = (k) => start + k * step;
    for (let k = 0; k < n; k++) a[at(k)] *= 6;
    // Starting values as if the line carried on mirrored.
    let sum = a[at(0)];
    let zn = pole;
    for (let k = 1; k < Math.min(n, 24); k++) {
      sum += zn * a[at(k)];
      zn *= pole;
    }
    a[at(0)] = sum;
    for (let k = 1; k < n; k++) a[at(k)] += pole * a[at(k - 1)];
    a[at(n - 1)] = (pole / (pole * pole - 1)) * (a[at(n - 1)] + pole * a[at(n - 2)]);
    for (let k = n - 2; k >= 0; k--) a[at(k)] = pole * (a[at(k + 1)] - a[at(k)]);
  };
  for (let iz = 0; iz < nz; iz++) line(iz * nx, 1, nx);
  for (let ix = 0; ix < nx; ix++) line(ix, nx, nz);
}

// ---- How it plays ----------------------------------------------------------------------

// Slopes over a green, for the designer's warnings: `surface(x, z)` gives
// [dh/dx, dh/dz] of the whole surface. Returns { cup, steep: [[x, z,
// slope]], share }: the steepest slope within a metre and a half of the
// cup, the spots on the green too steep for a ball to stop on, and the
// share of the green gentle enough to putt on.
// ⚡ Bolt Optimization: Eliminated array spread syntax (...surface(x, z)) in Math.hypot() calls
// inside the multi-pass grid scanning loops. Bypassing implicit array generation and destructuring
// avoids heavy garbage collection in this hot calculation path, lowering memory pressure.
export function slopeReport(green, pin, surface, step = 1) {
  const poly = outlineOf(green);
  const b = polygonBounds(poly);
  const steep = [];
  let gentle = 0;
  let all = 0;
  for (let x = b.x0; x <= b.x1; x += step) {
    for (let z = b.z0; z <= b.z1; z += step) {
      if (!insidePolygon(poly, x, z)) continue;
      const g = surface(x, z);
      const s = Math.hypot(g[0], g[1]);
      all++;
      if (s <= PUTTABLE.most) gentle++;
      if (s > PUTTABLE.steep) steep.push([x, z, s]);
    }
  }
  let cup = 0;
  for (let t = 0; t < 16; t++) {
    const a = (t / 16) * Math.PI * 2;
    for (const r of [0, 0.75, 1.5]) {
      const g = surface(pin[0] + Math.cos(a) * r, pin[1] + Math.sin(a) * r);
      cup = Math.max(cup, Math.hypot(g[0], g[1]));
    }
  }
  return { cup, steep, share: all ? gentle / all : 1 };
}
