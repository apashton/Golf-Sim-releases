// Where a hole's tufts of longer grass stand, all over it (look/groundbits.js
// tuftFieldMesh draws them; course.js buildHoleSteps): over its rough,
// taller over its long grass, and taller again where hay grows in that
// (sim/hay.mjs) - clear of sand, water, the cart paths, the
// tee (sim/tufts.mjs TUFT_TEE_GAP), the rocks and the beach, thinner over
// stony ground. Pure, so it's worked out on another core (buildworker.js)
// while the hole's other parts are built, or on the page where that can't
// be: the same tufts either way.

import { TUFT_FIELD, TUFT_TEE_GAP, tuftHeight, tuftClearOfPaths, byTee } from "./tufts.mjs";
import { insideBlob } from "./course.mjs";
import { insidePolygon } from "./terrain.mjs";
import { holeSite, holeProbe } from "./holesite.mjs";
import { mownField, mownLine, alongLine } from "./mowncut.mjs";
import { makePath } from "./course.mjs";
import { HAY, hayAt } from "./hay.mjs";

// (look/trees.js seeded: the same draws.)
function seeded(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A tuft's numbers in a square's list.
export const TUFT_STRIDE = 8; // x, y, z, code, width, turn, height, shade

// Worked out on the page (the other core's answer late, or none), the
// field comes in steps of about STEP_MS, so no frame waits on the whole of
// it: on Ultra a hole drawn from a map is seconds of work (the owner's
// report, 20 October 2026: one step of 108 s). The steps change nothing
// placed: the same tufts either way.
export const STEP_MS = 25;
// A step's end: true once `ms` have passed since the last (checked every
// so many calls, so the clock isn't read for every tuft).
function pacer(ms = STEP_MS) {
  let last = performance.now();
  let n = 0;
  return () => {
    if (++n % 256) return false;
    const now = performance.now();
    if (now - last < ms) return false;
    last = now;
    return true;
  };
}
// Run a steps generator to its end, for its answer.
function finish(steps) {
  for (;;) {
    const r = steps.next();
    if (r.done) return r.value;
  }
}

// `count` tufts placed by place(rand) -> [x, z, code] or null, in squares
// (TUFT_FIELD.size): [{ data: Float32Array (TUFT_STRIDE a tuft), centre:
// [x, y, z] }], each tuft stood at groundY(x, z). (Single precision: each
// tuft's drawn from a single-precision matrix anyway, and on Ultra a hole
// has most of a million of them - half the memory, and half the bytes when
// the hole's kept: look/bake.js.) fixed: [[x, z, code]...] stood first, as
// they are (the row along the mower's line: holeTufts).
export function fieldTufts(count, place, opts = {}) {
  return finish(fieldTuftsSteps(count, place, opts));
}
// The same in steps, each yielding `label` (STEP_MS).
export function* fieldTuftsSteps(count, place, { groundY = () => 0, seed = 37, fixed = [], label = "tufts" } = {}) {
  const rand = seeded(seed);
  const due = pacer();
  const squares = new Map();
  // (Most of a hole's ground isn't what a field grows on: tried hard.)
  for (let n = 0, tries = 0, f = 0; f < fixed.length || (n < count && tries < count * 14); tries++) {
    const at = f < fixed.length ? fixed[f++] : place(rand);
    if (!at) continue;
    const [x, z, code = 0] = at;
    const key = `${Math.floor(x / TUFT_FIELD.size)},${Math.floor(z / TUFT_FIELD.size)}`;
    let sq = squares.get(key);
    if (!sq) squares.set(key, (sq = []));
    // Its width its own; its height by the stand of grass it's in
    // (sim/tufts.mjs tuftHeight).
    sq.push([x, z, Number(code) || 0, 0.8 + rand() * 0.4, rand() * Math.PI, tuftHeight(x, z, rand(), rand(), seed), 0.94 + rand() * 0.12]);
    n++;
    if (due()) yield label;
  }
  const out = [];
  for (const list of squares.values()) {
    const data = new Float32Array(list.length * TUFT_STRIDE);
    let cx = 0;
    let cz = 0;
    for (let i = 0; i < list.length; i++) {
      const [x, z, code, s, turn, tall, shade] = list[i];
      data.set([x, groundY(x, z), z, code, s, turn, tall, shade], i * TUFT_STRIDE);
      cx += x;
      cz += z;
      if (due()) yield label;
    }
    cx /= list.length;
    cz /= list.length;
    out.push({ data, centre: [cx, groundY(cx, cz), cz] });
  }
  return out;
}

// The hole's two fields: its rough's and its long grass's. a:
//   L, rb      the hole's layout, and the box the field's over (its frame)
//   lieAt      the lie at a spot (its frame); groundY, onShore (the world)
//   per, most  tufts a square metre of rough and of long grass, and the
//              most in all (TUFT_FIELD)
//   tall       their heights; deepCode, roughCode: their colours
//   rocks      [[x, z, size]] in the world; stony: the dunes' stony
//              patches (the world)
// Returns [rough's, long grass's] (fieldTufts's squares).
// A hole's lieAt with the other holes' ground near it ([{ lie, poly }] in
// its frame) read as that ground.
export function withOtherGround(lieAt, others = []) {
  const parts = (others ?? []).filter((q) => q?.poly?.length > 2).map((q) => {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const [x, z] of q.poly) {
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
    }
    return { ...q, x0, x1, z0, z1 };
  });
  if (!parts.length) return lieAt;
  return (x, z) => {
    for (const q of parts) if (x >= q.x0 && x <= q.x1 && z >= q.z0 && z <= q.z1 && insidePolygon(q.poly, x, z)) return q.lie;
    return lieAt(x, z);
  };
}

export function holeTufts(a) {
  return finish(holeTuftsSteps(a));
}
// The same in steps (STEP_MS), each yielding `label`: for the page, when
// it works the field out itself.
export function* holeTuftsSteps(a, label = "tufts") {
  const { L, rb, deepCode, roughCode } = a;
  const hayCode = a.hayCode ?? HAY.code;
  const path = makePath(L.path);
  // A cell's kind: 2 rough, 3 long grass, 4 hay, 1 else.
  const kindOf = (l, x, z) => (l === "rough" ? 2 : l === "deep" ? (hayAt(L, x, z, path) ? 4 : 3) : 1);
  const due = pacer();
  // Another hole's fairway, green or tee in reach (its layout's otherGround,
  // treeclear.mjs) read as what it is, not as this hole's rough: its tufts
  // stood on the next hole's green.
  const lieAt = withOtherGround(a.lieAt, L.otherGround);
  // Its cart paths, and any others drawn on it (`paths`: the next hole's,
  // course/holescenery.js nextTeePaths) - its tufts stood on those.
  const paths = [...(L.paths ?? []), ...(a.paths ?? [])];
  const cell = 2;
  const nx = Math.ceil((rb.x1 - rb.x0) / cell) + 1;
  const nz = Math.ceil((rb.z1 - rb.z0) / cell) + 1;
  // The lie at every cell's middle (kindOf), and so how much of each
  // there is.
  const lies = new Uint8Array(nx * nz);
  const area = [0, 0, 0, 0, 0];
  const tees = [];
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const cx = rb.x0 + (i + 0.5) * cell;
      const cz = rb.z0 + (j + 0.5) * cell;
      const l = lieAt(cx, cz);
      const code = kindOf(l, cx, cz);
      lies[j * nx + i] = code;
      area[code] += cell * cell;
      if (l === "tee") tees.push([i, j]);
      if (due()) yield label;
    }
  }
  // The cells near the tee, where each tuft is looked at more closely
  // (sim/tufts.mjs byTee): any within reach of a cell that plays as tee -
  // the gap, and a cell either side (a box's edge can lie most of a cell
  // past the last middle in it, and a tuft anywhere in its own).
  const teeReach = Math.ceil(TUFT_TEE_GAP / cell) + 2;
  const nearTee = new Uint8Array(nx * nz);
  for (const [ti, tj] of tees) {
    for (let j = Math.max(0, tj - teeReach); j <= Math.min(nz - 1, tj + teeReach); j++) nearTee.fill(1, j * nx + Math.max(0, ti - teeReach), j * nx + Math.min(nx - 1, ti + teeReach) + 1);
  }
  const cellOf = (x, z) => Math.min(nz - 1, Math.max(0, Math.floor((z - rb.z0) / cell))) * nx + Math.min(nx - 1, Math.max(0, Math.floor((x - rb.x0) / cell)));
  // A cell on a border between two kinds of ground is read exactly where
  // each tuft stands, so the border isn't a staircase.
  const lieCode = (x, z) => {
    const i = Math.min(nx - 1, Math.max(0, Math.floor((x - rb.x0) / cell)));
    const j = Math.min(nz - 1, Math.max(0, Math.floor((z - rb.z0) / cell)));
    const k = lies[j * nx + i];
    const edge = (i > 0 && lies[j * nx + i - 1] !== k) || (i < nx - 1 && lies[j * nx + i + 1] !== k) || (j > 0 && lies[(j - 1) * nx + i] !== k) || (j < nz - 1 && lies[(j + 1) * nx + i] !== k);
    if (!edge) return k;
    return kindOf(lieAt(x, z), x, z);
  };
  // Clear of the rocks, and thinner over the stony ground round an
  // outcrop, so the rock shows.
  const rockCell = 4;
  const rockAt = new Map();
  for (const [rx, rz, size] of a.rocks ?? []) {
    const key = `${Math.floor(rx / rockCell)},${Math.floor(rz / rockCell)}`;
    if (!rockAt.has(key)) rockAt.set(key, []);
    rockAt.get(key).push([rx, rz, size]);
  }
  const stony = a.stony ?? [];
  const nearRock = (x, z) => {
    const cx = Math.floor(x / rockCell);
    const cz = Math.floor(z / rockCell);
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const [rx, rz, size] of rockAt.get(`${cx + i},${cz + j}`) ?? []) if (Math.hypot(x - rx, z - rz) < size * 1.4 + 0.3) return true;
    return false;
  };
  const field = (want) => (rand) => {
    const x = rb.x0 + rand() * (rb.x1 - rb.x0);
    const z = rb.z0 + rand() * (rb.z1 - rb.z0);
    if (nearRock(x, z) || (stony.length && rand() < 0.6 && stony.some((q) => Math.hypot(x - q.x, z - q.z) < q.r)) || a.onShore(z, -x)) return null;
    if (lieCode(x, z) !== want || !tuftClearOfPaths(paths, x, z, want >= 3) || L.bunkers.some((b) => insideBlob(b, x, z, 1.2)) || L.water.some((w) => insideBlob(w, x, z, 1.2))) return null;
    // (Off the tee: not in a sliver of rough between two of its boxes, nor
    // on the soft edge each is drawn with.)
    if (nearTee[cellOf(x, z)] && byTee(lieAt, x, z)) return null;
    return [z, -x, want === 4 ? hayCode : want === 3 ? deepCode : roughCode];
  };
  const per = a.per;
  const share = Math.min(1, a.most / (per[0] * area[2] + per[1] * (area[3] + HAY.thick * area[4]) || 1));
  // A row along the mower's line (sim/mowncut.mjs), each just into the
  // rough, so the rough's grass stands right up to every edge a mower
  // makes with no gaps along it, cut off there in a neat line (look/
  // cutline.js; the owner: "The mower cut is a neat line"). Clear of sand,
  // water, the paths and the rocks as the rest are; not kept off the tee,
  // being on its surround's edge.
  const edge = [[], [], [], [], []];
  const mown = mownField(L, { path });
  const rand = seeded(11);
  for (const [x, z] of alongLine(mownLine(mown), mown, { every: EDGE_ROW.every, inset: EDGE_ROW.inset, rand })) {
    const want = lieCode(x, z);
    if (want < 2 || nearRock(x, z) || a.onShore(z, -x) || !tuftClearOfPaths(paths, x, z, want >= 3) || L.bunkers.some((b) => insideBlob(b, x, z, 1.2)) || L.water.some((w) => insideBlob(w, x, z, 1.2))) continue;
    edge[want].push([z, -x, want === 4 ? hayCode : want === 3 ? deepCode : roughCode]);
    if (due()) yield label;
  }
  const rough = yield* fieldTuftsSteps(Math.round(per[0] * area[2] * share), field(2), { seed: 3, groundY: a.groundY, fixed: edge[2], label });
  const long = yield* fieldTuftsSteps(Math.round(per[1] * area[3] * share), field(3), { seed: 5, groundY: a.groundY, fixed: edge[3], label });
  const hay = yield* fieldTuftsSteps(Math.round(per[1] * HAY.thick * area[4] * share), field(4), { seed: 7, groundY: a.groundY, fixed: edge[4], label });
  return [rough, long, hay];
}

// The row of tufts along the mower's line: about this far apart (a tuft is
// most of a metre across), each this far into the rough.
export const EDGE_ROW = { every: 0.3, inset: [0.05, 0.3] };

// The same on another core: the hole made again from its recipe (sim/
// holesite.mjs) - and only if it's the page's hole (probe: holeProbe's
// readings of it there).
export function holeTuftsFrom(a) {
  const site = holeSite(a.site);
  const L = site.hole.layout;
  const probe = holeProbe(site.heightAt, (x, z) => site.hole.lieAt(x, z), L);
  if (JSON.stringify(probe) !== JSON.stringify(a.probe)) throw new Error("not the page's hole");
  return { fields: holeTufts({ ...a, L, lieAt: (x, z) => site.hole.lieAt(x, z), groundY: site.worldHeight, onShore: site.onShore }) };
}
