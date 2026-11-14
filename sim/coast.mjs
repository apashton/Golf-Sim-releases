// The sea beside a course (the owner: "Having link courses and the sea on
// one side. Wind always coming from that direction" - and "should have the
// opportunity for peninsulas too, so sea always being one side might not be
// the case"). A course by the sea has a coast round it, laid out from where
// its holes are (imaginary.mjs coursePlaces), in one of three shapes:
//
//   side      the sea along one side of the course, the coast wandering in
//             bays and points, the holes nearest it running along the shore
//   corner    round two sides: the course in a corner of the land
//   headland  round three sides: the course out on a headland, joined to
//             the land at one end
//
// Wherever a hole runs out towards the sea the land comes out round it, so
// the coast bends round the holes, and narrow inlets between them are
// filled in. The water is never nearer play than COAST.clear past where a
// ball can finish, so the sea is scenery only, never in play.
//
// makeCoast (course frame: metres east and north, as the places are):
//   at(e, n)   metres to the water's edge: + on land, - out at sea
//   past(e, n) metres past where a ball can finish on any of its holes
//   seaward    the way the sea lies, as a whole: [east, north]
//   from       the compass bearing an onshore wind blows from
// coastHere: the same for one hole's scene (the world's x and z).
// shoreHeight: the ground at the shore - low dunes behind a sandy beach that
// runs down into the water, the sea bed falling away beyond. Pure.

import { coursePlaces, routingSeed, toCourse } from "./imaginary.mjs";
import { holeFrame } from "./terrain.mjs";
import { valueNoise, hash2, smoothstep } from "./country.mjs";

// The designer's choice (course.sea): auto (none chosen) - a links course
// is by the sea, any other inland; by the sea in a shape as it comes (from
// its routing), or in the shape asked for; or inland.
export const SEA_CHOICES = ["auto", "coast", "side", "corner", "headland", "none"];
export const SEA_NAMES = {
  auto: "Links courses by the sea, others inland",
  coast: "By the sea - the coast as it comes",
  side: "By the sea - along one side",
  corner: "By the sea - round two sides",
  headland: "By the sea - out on a headland",
  none: "Inland - no sea",
};
export const SEA_SHAPES = ["side", "corner", "headland"];

// How close the sea comes (course.seaGap; the owner: "I really want to be
// able to put some holes much closer to the sea"): the water's edge this
// far past where a ball can finish. Behind the dunes (as it always was:
// COAST.clear), near the beach (low dunes between), or right on the shore
// - the beach running up to the edge of the long grass, the sea about 90 m
// off a hole's line. Never in play: a ball can't finish past `reach`.
export const SEA_GAPS = { dunes: 110, beach: 60, shore: 35 };
export const SEA_GAP_NAMES = { dunes: "Behind the dunes", beach: "Near the beach", shore: "Right on the shore" };
export const seaGapOf = (course) => SEA_GAPS[course?.seaGap] ?? SEA_GAPS.dunes;

export const COAST = {
  // The water's edge at least this far past where a ball can finish; the
  // dunes (and the ground easing down to the beach) only this far past it,
  // full by `dunesFull`, so nothing changes in play or along a links
  // hole's long grass.
  clear: 110,
  dunesFrom: 42,
  dunesFull: 62,
  // The beach from the water's edge up, metres; its wet sand; and how far
  // above the water its back is.
  beach: 35,
  wet: 7,
  rise: 1.6,
  // Low dunes behind the beach, this deep, at most this high - broken by
  // gaps, so the sea shows through from the course.
  dunes: 60,
  duneHeight: 3.8,
  // The sea bed: falling this much a metre out from the edge, to this deep.
  shelf: 0.035,
  deep: 7,
  // The side's coast this far out past the course's furthest play, on
  // average, wandering this far either way along it.
  out: -40,
  wander: 170,
  // A headland's neck: the land behind reaching this far into the course.
  neck: 260,
  // Inlets narrower than about twice this between the holes filled in.
  close: 220,
  // The water's edge wiggling this far either way, at two sizes.
  wiggle: 45,
  // The grid the coast is worked out on: its cell, and how far past the
  // course it reaches (the ground of every hole drawn is inside it).
  cell: 20,
  pad: 1600,
  // How far either way of straight onshore the round's wind may come from.
  onshore: 30,
};

import { clamp } from "./mathutil.mjs";
const BIG = 1e20;

// ---- Which coast -------------------------------------------------------------------

// The shape of a course's coast, or null for none: what the designer chose
// (course.sea) - or, with nothing chosen, a course with links holes is by
// the sea. As it comes, the shape is from its routing (so laying the holes
// out again may move the sea too). A course from the map has the coast it
// has, which isn't known: none.
export function seaShape(course) {
  if (!course?.holes?.length || course.source?.kind === "osm") return null;
  const choice = SEA_CHOICES.includes(course.sea) ? course.sea : "auto";
  if (choice === "none") return null;
  if (SEA_SHAPES.includes(choice)) return choice;
  if (choice === "auto" && !course.holes.some((h) => h.layout?.links)) return null;
  const r = hash2(routingSeed(course) | 0, 41, 0x5ea);
  return r < 0.45 ? "side" : r < 0.75 ? "corner" : "headland";
}

// ---- The holes, as the coast sees them ------------------------------------------------

// Each hole's line of play on the course's ground and how far either side
// of it a ball can finish (as course.js addCountry has it: a designed
// hole's tree line and 18 m more, a mapped hole's 78 m and its box).
function holesOf(course, places) {
  return course.holes.map((h, i) => {
    const L = h.layout ?? {};
    const place = places[i];
    const frame = holeFrame([place.x, place.z], place.heading);
    const line = (L.path ?? [[0, 0], [300, 0]]).map((p) => toCourse(place, p));
    const mapped = L.source === "map";
    const reach = mapped ? 78 : (L.treeLine ?? 40) + 18 * (L.bandScale ?? 1);
    return { line, reach, frame, region: mapped ? L.region ?? null : null };
  });
}

// Distance from (x, z) to a polyline.
function lineDist(line, x, z) {
  let best = Infinity;
  for (let i = 1; i < line.length; i++) {
    const [ax, az] = line[i - 1];
    const [bx, bz] = line[i];
    const ex = bx - ax;
    const ez = bz - az;
    const f = clamp(((x - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez || 1), 0, 1);
    best = Math.min(best, Math.hypot(x - ax - ex * f, z - az - ez * f));
  }
  return line.length === 1 ? Math.hypot(x - line[0][0], z - line[0][1]) : best;
}

// How far past where a ball can finish (e, n) is, on hole h.
function holePast(h, e, n) {
  let d = lineDist(h.line, e, n) - h.reach;
  if (h.region) {
    const [x, z] = h.frame.toHole([e, n]);
    const r = h.region;
    d = Math.min(d, Math.hypot(Math.max(r.x0 - x, 0, x - r.x1), Math.max(r.z0 - z, 0, z - r.z1)));
  }
  return d;
}

// ---- Distance transforms ------------------------------------------------------------

// The squared distance (in cells) from each cell to the nearest one where
// `on` is set (Felzenszwalb and Huttenlocher's, exact).
export function distanceField(on, nx, nz) {
  const f = new Float64Array(nx * nz);
  for (let i = 0; i < f.length; i++) f[i] = on[i] ? 0 : BIG;
  const n = Math.max(nx, nz);
  const g = new Float64Array(n);
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const zz = new Float64Array(n + 1);
  const pass = (len) => {
    let k = 0;
    v[0] = 0;
    zz[0] = -Infinity;
    zz[1] = Infinity;
    for (let q = 1; q < len; q++) {
      let s = (g[q] + q * q - (g[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      // (zz[0] is -Infinity: this stops at k = 0 at the latest.)
      while (s <= zz[k]) {
        k--;
        s = (g[q] + q * q - (g[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      }
      k++;
      v[k] = q;
      zz[k] = s;
      zz[k + 1] = Infinity;
    }
    k = 0;
    for (let q = 0; q < len; q++) {
      while (zz[k + 1] < q) k++;
      const p = v[k];
      d[q] = (q - p) * (q - p) + g[p];
    }
  };
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) g[j] = f[j * nx + i];
    pass(nz);
    for (let j = 0; j < nz; j++) f[j * nx + i] = d[j];
  }
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) g[i] = f[j * nx + i];
    pass(nx);
    for (let i = 0; i < nx; i++) f[j * nx + i] = d[i];
  }
  return f;
}

// ---- The coast -----------------------------------------------------------------------

// The way across the course it's longest (its holes' points' main axis),
// as a unit [east, north].
function longAxis(points) {
  let mx = 0;
  let mz = 0;
  for (const [x, z] of points) {
    mx += x;
    mz += z;
  }
  mx /= points.length;
  mz /= points.length;
  let sxx = 0;
  let sxz = 0;
  let szz = 0;
  for (const [x, z] of points) {
    sxx += (x - mx) ** 2;
    sxz += (x - mx) * (z - mz);
    szz += (z - mz) ** 2;
  }
  const a = 0.5 * Math.atan2(2 * sxz, sxx - szz);
  return { axis: [Math.cos(a), Math.sin(a)], middle: [mx, mz] };
}

// A compass bearing (degrees clockwise from north) for [east, north].
export const bearingOf = ([e, n]) => ((Math.atan2(e, n) * 180) / Math.PI + 360) % 360;

// The coast round a course, or null if it has none (seaShape). shape: to
// ask for one whatever the course says. places: its holes' places.
export function makeCoast(course, { shape = seaShape(course), places = null } = {}) {
  if (!shape || !course?.holes?.length) return null;
  places ??= coursePlaces(course);
  // How far past play the water stays (seaGapOf), and how much the edge
  // may wiggle out from that, in proportion.
  const clear = seaGapOf(course);
  const wiggleIn = COAST.wiggle * (clear / COAST.clear);
  const seed = (routingSeed(course) ^ 0xc0a57) >>> 0;
  const holes = holesOf(course, places);
  const points = holes.flatMap((h) => h.line);
  const { axis, middle } = longAxis(points);
  // Which way along the axis and across it: towards the course's links
  // holes, if it has them off to one side; else from the seed - except a
  // corner's and a headland's run along the axis away from the clubhouse
  // (the course's 0, 0), which stays on the land.
  const across = [-axis[1], axis[0]];
  const linksAt = course.holes.map((h, i) => (h.layout?.links ? holes[i].line : [])).flat();
  const lean = (dir) => {
    if (linksAt.length && linksAt.length < points.length) {
      const [lx, lz] = linksAt.reduce((a, p) => [a[0] + p[0] / linksAt.length, a[1] + p[1] / linksAt.length], [0, 0]);
      const k = (lx - middle[0]) * dir[0] + (lz - middle[1]) * dir[1];
      if (Math.abs(k) > 40) return Math.sign(k);
    }
    return hash2(seed, dir === axis ? 3 : 5, 7) < 0.5 ? -1 : 1;
  };
  const away = Math.sign(middle[0] * axis[0] + middle[1] * axis[1]) || lean(axis);
  const side = lean(across);
  const u1 = [across[0] * side, across[1] * side];
  const u2 = [axis[0] * away, axis[1] * away];
  // How far play reaches each way: the course's furthest and nearest.
  const ext = (u) => Math.max(...holes.flatMap((h) => h.line.map(([x, z]) => x * u[0] + z * u[1] + h.reach)));
  const back = (u) => Math.min(...holes.flatMap((h) => h.line.map(([x, z]) => x * u[0] + z * u[1] - h.reach)));
  // A coast along a line facing u, at `at` along it, wandering: metres
  // inland of it (- out to sea).
  const wanderAt = (t, k) => (valueNoise(t, k * 977, 900, seed) - 0.5) * 2 * COAST.wander + (valueNoise(t, k * 131, 300, seed ^ 0x33) - 0.5) * 0.6 * COAST.wander;
  const halfPlane = (u, at, k) => (e, n) => {
    const s = e * u[0] + n * u[1];
    const t = -e * u[1] + n * u[0];
    return at + wanderAt(t, k) - s;
  };
  let inland;
  let seaward;
  if (shape === "side") {
    inland = halfPlane(u1, ext(u1) + clear + COAST.out, 1);
    seaward = u1;
  } else if (shape === "corner") {
    const a = halfPlane(u1, ext(u1) + clear + COAST.out, 1);
    const b = halfPlane(u2, ext(u2) + clear + COAST.out, 2);
    inland = (e, n) => Math.min(a(e, n), b(e, n));
    const m = Math.hypot(u1[0] + u2[0], u1[1] + u2[1]) || 1;
    seaward = [(u1[0] + u2[0]) / m, (u1[1] + u2[1]) / m];
  } else {
    // A headland: the land behind the course's back end, its neck, and
    // the sea all round the rest.
    const neck = halfPlane(u2, back(u2) + COAST.neck, 3);
    inland = (e, n) => neck(e, n);
    seaward = u2;
  }

  // The grid: how far past play each cell is (the nearest hole's), and
  // what's land.
  const cell = COAST.cell;
  let x0 = Infinity;
  let x1 = -Infinity;
  let z0 = Infinity;
  let z1 = -Infinity;
  for (const [x, z] of points) {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    z0 = Math.min(z0, z);
    z1 = Math.max(z1, z);
  }
  x0 = Math.floor((x0 - COAST.pad) / cell) * cell;
  z0 = Math.floor((z0 - COAST.pad) / cell) * cell;
  const nx = Math.ceil((x1 + COAST.pad - x0) / cell) + 1;
  const nz = Math.ceil((z1 + COAST.pad - z0) / cell) + 1;
  const past = new Float32Array(nx * nz).fill(1e5);
  const near = clear + COAST.close * 2 + 200;
  for (const h of holes) {
    let hx0 = Infinity;
    let hx1 = -Infinity;
    let hz0 = Infinity;
    let hz1 = -Infinity;
    const corners = h.region ? [[h.region.x0, h.region.z0], [h.region.x1, h.region.z0], [h.region.x0, h.region.z1], [h.region.x1, h.region.z1]].map((p) => h.frame.toLocal(p)) : [];
    for (const [x, z] of [...h.line, ...corners]) {
      hx0 = Math.min(hx0, x);
      hx1 = Math.max(hx1, x);
      hz0 = Math.min(hz0, z);
      hz1 = Math.max(hz1, z);
    }
    const reach = h.reach + near;
    const i0 = Math.max(0, Math.floor((hx0 - reach - x0) / cell));
    const i1 = Math.min(nx - 1, Math.ceil((hx1 + reach - x0) / cell));
    const j0 = Math.max(0, Math.floor((hz0 - reach - z0) / cell));
    const j1 = Math.min(nz - 1, Math.ceil((hz1 + reach - z0) / cell));
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const k = j * nx + i;
        past[k] = Math.min(past[k], holePast(h, x0 + i * cell, z0 + j * cell));
      }
    }
  }
  const N = nx * nz;
  const land0 = new Uint8Array(N);
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      land0[k] = past[k] <= clear + wiggleIn || inland(x0 + i * cell, z0 + j * cell) >= 0 ? 1 : 0;
    }
  }
  // Closed: grown by COAST.close and shrunk back, filling the inlets
  // between holes.
  const r2 = (COAST.close / cell) ** 2;
  const toLand = distanceField(land0, nx, nz);
  const grown = new Uint8Array(N);
  for (let k = 0; k < N; k++) grown[k] = toLand[k] <= r2 ? 0 : 1; // (1: sea after growing)
  const toSea = distanceField(grown, nx, nz);
  const land = new Uint8Array(N);
  for (let k = 0; k < N; k++) land[k] = land0[k] || toSea[k] > r2 ? 1 : 0;
  // Signed metres to the edge (+ land).
  const seaCells = new Uint8Array(N);
  for (let k = 0; k < N; k++) seaCells[k] = land[k] ? 0 : 1;
  const dSea = distanceField(seaCells, nx, nz);
  const dLand = distanceField(land, nx, nz);
  const sd = new Float32Array(N);
  for (let k = 0; k < N; k++) sd[k] = land[k] ? (Math.sqrt(dSea[k]) - 0.5) * cell : -(Math.sqrt(dLand[k]) - 0.5) * cell;
  const any = seaCells.some((s) => s);

  const sample = (grid, e, n) => {
    const fx = clamp((e - x0) / cell, 0, nx - 1.001);
    const fz = clamp((n - z0) / cell, 0, nz - 1.001);
    const i = Math.floor(fx);
    const j = Math.floor(fz);
    const u = fx - i;
    const v = fz - j;
    const k = j * nx + i;
    const a = grid[k] + (grid[k + 1] - grid[k]) * u;
    const b = grid[k + nx] + (grid[k + nx + 1] - grid[k + nx]) * u;
    return a + (b - a) * v;
  };
  // How far inside the grid (e, n) is: 0 at its edge (and beyond).
  const inside = (e, n) => Math.min(e - x0, x0 + (nx - 1) * cell - e, n - z0, z0 + (nz - 1) * cell - n);
  const pastAt = (e, n) => (inside(e, n) > 0 ? sample(past, e, n) : 1e5);
  const wiggle = (e, n) => (valueNoise(e, n, 260, seed ^ 0x51) - 0.5) * 2 * COAST.wiggle + (valueNoise(e, n, 70, seed ^ 0x52) - 0.5) * 0.5 * COAST.wiggle + (valueNoise(e, n, 23, seed ^ 0x53) - 0.5) * 0.12 * COAST.wiggle;
  const at = (e, n) => {
    // The grid's, eased into the plain coast towards its edge (beyond it,
    // the coast as it was laid out, far from any hole).
    const w = smoothstep(0, 300, inside(e, n));
    const grid = any ? sample(sd, e, n) : 1e4;
    let d = w >= 1 ? grid : w <= 0 ? inland(e, n) : grid * w + inland(e, n) * (1 - w);
    d += wiggle(e, n);
    // (Half a cell more: past is read off the grid, which can make play
    // look up to that much further off right by a line.)
    return Math.max(d, clear + COAST.cell * 0.5 - pastAt(e, n));
  };
  return { shape, seed, seaward, from: Math.round(bearingOf(seaward)), at, past: pastAt, inland, grid: { x0, z0, nx, nz, cell } };
}

// A course's coast, made once while the course and its places stay the
// same (the routing's search and the grid aren't free).
const made = new WeakMap();
export function coastOf(course) {
  if (!course?.holes?.length) return null;
  const places = coursePlaces(course);
  const key = JSON.stringify([course.sea ?? null, course.seaGap ?? null, course.routingSeed ?? null, places, course.holes.map((h) => [h.layout?.links ?? 0, h.layout?.treeLine ?? 0, h.layout?.path?.length ?? 0, h.layout?.path?.at?.(-1) ?? null])]);
  const kept = made.get(course);
  if (kept && kept.key === key) return kept.coast;
  const coast = makeCoast(course, { places });
  made.set(course, { key, coast });
  return coast;
}

// The coast for one hole's scene: at(wx, wz) in the world's x and z (the
// hole's frame turned: scenery.js toWorld), and the way the sea lies in
// the world. null without a coast.
export function coastHere(coast, place) {
  if (!coast || !place) return null;
  const frame = holeFrame([place.x, place.z], place.heading);
  // World -> hole -> course.
  const toCourse = (wx, wz) => frame.toLocal([-wz, wx]);
  const [se, sn] = coast.seaward;
  // The seaward way in the hole's frame, then the world's.
  const dx = Math.cos(place.heading);
  const dn = Math.sin(place.heading);
  const hx = se * dx + sn * dn;
  const hz = se * dn - sn * dx;
  return {
    shape: coast.shape,
    at: (wx, wz) => coast.at(...toCourse(wx, wz)),
    past: (wx, wz) => coast.past(...toCourse(wx, wz)),
    seaward: [hz, -hx],
  };
}

// The coast as a picture for the sea's shader (look/sea.js): how far each
// spot of `box` ({ x0, z0, size }, the world's metres; n pixels a side,
// rows along z) is from the water's edge, SEA_TEXEL metres a step either
// way of 128 - so 254 m out to sea at most, which is deep water.
export const SEA_TEXEL = 2;
export function coastPixels(at, { box, n }) {
  const out = new Uint8Array(n * n);
  const cell = box.size / n;
  for (let row = 0; row < n; row++) {
    const z = box.z0 + (row + 0.5) * cell;
    for (let col = 0; col < n; col++) out[row * n + col] = clamp(Math.round(128 + at(box.x0 + (col + 0.5) * cell, z) / SEA_TEXEL), 0, 255);
  }
  return out;
}

// ---- The ground at the shore --------------------------------------------------------

// The ground at `d` metres from the water's edge (coast.at), where it would
// otherwise be `g`: inland of the dunes it's left alone; across the dunes
// it eases to `top` (the back of the beach) with the dunes on it - low
// mounds, broken by gaps (`lump`: 0 - 1, how much dune there is here, from
// noise); the beach runs down to the water at `level`, and the sea bed on
// down beyond. top: COAST.rise above the water. past: how far past where a
// ball can finish it is (coast.past) - the dunes and the easing only from
// COAST.dunesFrom on.
export function shoreHeight(d, g, level, lump = 0.5, past = Infinity) {
  const top = level + COAST.rise;
  const back = COAST.beach + COAST.dunes;
  if (d >= back) return g;
  if (d >= COAST.beach) {
    const t = (d - COAST.beach) / COAST.dunes;
    const ease = smoothstep(1, 0.55, t);
    const ridge = Math.sin(Math.PI * Math.min(1, t * 1.15)) ** 0.8;
    const clear = smoothstep(COAST.dunesFrom, COAST.dunesFull, past);
    return g + ((top - g) * ease + COAST.duneHeight * ridge * lump * smoothstep(0, 0.12, t)) * clear;
  }
  if (d >= 0) return level + COAST.rise * (d / COAST.beach) ** 1.15;
  return level - Math.min(COAST.deep, -d * COAST.shelf + (-d) ** 2 * 0.00004);
}

// The shore painted over the country's picture (look/country.js
// countryMap: n * n pixels over box, premultiplied by how much each
// covers): marram on the dunes, with pale sandy blowouts, fading into
// whatever lies inland; the beach's dry sand, the tide's line of wrack and
// the dark wet sand along the water; the sea bed under it. at(x, z): the
// coast (coastHere's). colours: { beachSand, beachWet, wrack, marram }
// in linear light.
export function paintShore(pixels, { box, n, at, colours, seed = 0 }) {
  const cell = box.size / n;
  // Worked out every few pixels and filled in between: it changes smoothly.
  const step = 4;
  const m = Math.ceil(n / step) + 1;
  const coarse = new Float32Array(m * m);
  for (let j = 0; j < m; j++) for (let i = 0; i < m; i++) coarse[j * m + i] = at(box.x0 + (i * step + 0.5) * cell, box.z0 + (j * step + 0.5) * cell);
  const back = COAST.beach + COAST.dunes;
  const reach = back + 25;
  const lay = (k, c, w) => {
    const keep = 1 - w;
    pixels[k] = Math.round(pixels[k] * keep + c[0] * 255 * w);
    pixels[k + 1] = Math.round(pixels[k + 1] * keep + c[1] * 255 * w);
    pixels[k + 2] = Math.round(pixels[k + 2] * keep + c[2] * 255 * w);
    pixels[k + 3] = Math.round(pixels[k + 3] * keep + 255 * w);
  };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const seabed = colours.beachWet.map((c) => c * 0.7);
  for (let row = 0; row < n; row++) {
    const j = Math.floor(row / step);
    const v = (row - j * step) / step;
    for (let col = 0; col < n; col++) {
      const i = Math.floor(col / step);
      const u = (col - i * step) / step;
      const a = coarse[j * m + i];
      const b = coarse[j * m + i + 1];
      const c = coarse[(j + 1) * m + i];
      const e = coarse[(j + 1) * m + i + 1];
      const d = (a + (b - a) * u) * (1 - v) + (c + (e - c) * u) * v;
      if (d >= reach) continue;
      const x = box.x0 + (col + 0.5) * cell;
      const z = box.z0 + (row + 0.5) * cell;
      const k = (row * n + col) * 4;
      if (d < 0) {
        lay(k, seabed, 1);
        continue;
      }
      if (d < COAST.beach) {
        // Wet along the water, the wrack a few metres up, dry above.
        const rag = (valueNoise(x, z, 6, seed ^ 0xbea) - 0.5) * 3;
        const wet = 1 - smoothstep(COAST.wet * 0.6, COAST.wet * 1.3, d + rag);
        let sand = mix(colours.beachSand, colours.beachWet, wet);
        const wrack = Math.max(0, 1 - Math.abs(d + rag * 1.5 - COAST.wet * 1.8) / 0.9) * smoothstep(0.35, 0.6, valueNoise(x, z, 9, seed ^ 0xbeb));
        sand = mix(sand, colours.wrack, wrack * 0.8);
        // Blown sand, a little paler or darker.
        const s = 0.94 + 0.12 * valueNoise(x, z, 14, seed ^ 0xbec);
        lay(k, sand.map((q) => q * s), 1);
        continue;
      }
      // The dunes: marram, with sandy blowouts where they're bare, and
      // the sand at their foot; fading out inland.
      const bare = smoothstep(0.58, 0.72, valueNoise(x, z, 32, seed ^ 0xbed)) * 0.85 + (1 - smoothstep(COAST.beach, COAST.beach + 8, d + (valueNoise(x, z, 11, seed ^ 0xbee) - 0.5) * 8));
      const grass = mix(colours.marram, colours.beachSand, Math.min(1, bare));
      const s = 0.92 + 0.16 * valueNoise(x, z, 20, seed ^ 0xbef);
      lay(k, grass.map((q) => q * s), 1 - smoothstep(back - 10, reach, d));
    }
  }
  return pixels;
}

// How much dune there is at a spot: none in the gaps (about a third of
// the shore), up to 1 on the biggest, with smaller hummocks on them.
export function duneLump(x, z, seed = 0) {
  const big = clamp((valueNoise(x, z, 85, seed ^ 0xd17e) - 0.33) / 0.67, 0, 1);
  const small = valueNoise(x, z, 17, seed ^ 0xd17f);
  return clamp(big * (0.75 + 0.5 * small), 0, 1);
}

// The level a hole's sea lies at: COAST.rise below the back of its beach,
// which is at its far ground's own level (`ground`, the height the far
// ground eases to away from the hole).
export function seaLevel(ground = 0) {
  return ground - COAST.rise;
}

// ---- The wind off the sea ----------------------------------------------------------

// Where the round's wind comes from on a course by the sea: off the sea,
// within COAST.onshore either way, from a number 0 - 1 (the roll that
// would have picked any direction).
export function onshoreFrom(from, r) {
  return Math.round((((from + (r - 0.5) * 2 * COAST.onshore) % 360) + 360) % 360) % 360;
}
