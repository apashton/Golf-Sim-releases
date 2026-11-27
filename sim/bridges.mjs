// Bridges: a cart path that crosses water goes over it on a timber bridge
// (the owner: "cart path always needs to be on top and over a bridge if
// crossing water"; and, 28 October 2026, "going around brooks rather than
// over? Don't forget you can build bridges"). A path crosses water only
// straight over, where it's narrow (crossesWell): a hole's own path over
// its brooks (sim/paths.mjs generatePath), a path between holes
// (sim/linkway.mjs) or one kept off another hole's ground (sim/
// coursepaths.mjs) over any hole's brook or a narrow bit of a pond. Never
// along the water, nor across a pond.
//
// Where a path's line is over water - its middle or either edge - a bridge
// takes it across: a deck of planks over the water and a little way onto
// the bank either side (its abutments), sloping up from the path on the
// grass to clear the water, on posts with a rail each side. The asphalt
// stops where the timber starts.
//
// It's scenery: play goes on as it did. A ball that comes down on a bridge
// is in the water, as a footbridge on a course from the map always has
// been (sim/paths.mjs pathsFromLines), and the bank either side is path.
// And bridges placed by hand on a real course where its map has a way over
// water that isn't a cart path (handBridgeShape, below): a small arch of
// rough stone, or a plain flat slab.
// Pure: what's where, for look/bridges.js to build.

import { pathLine, reachOf } from "./paths.mjs";

export const BRIDGE = {
  // How far the deck reaches onto dry ground past the water's edge, and
  // the ramp up to it beyond that (metres along the path).
  margin: 1.5,
  ramp: 3,
  // How far the deck stands over the highest ground it spans (metres).
  clear: 0.35,
  // Two crossings closer than this are one bridge.
  join: 4,
  // A plank's width along the path and its gap; the timber's thickness.
  plank: 0.24,
  gap: 0.04,
  thick: 0.05,
  // Posts: how far apart, how thick; the rail's height over the deck.
  postEvery: 2.4,
  post: 0.12,
  rail: 0.95,
  // How far down past the water a post goes (it's driven into the bed).
  sink: 0.6,
  // The longest bridge a path is laid over (metres of water along it), and
  // how far either side of the water a path crossing it can be nearer than
  // a path keeps (sim/paths.mjs PATH_CLEAR.water) - coming to it and
  // leaving it, a little askew. Further than that is running along it.
  most: 14,
  approach: 7,
  // Passing by water a little nearer than a path keeps, for no further
  // than this, it needn't cross it: it just goes by.
  brush: 4,
};

// Whether a path's crossings of water are each a bridge's (BRIDGE.most and
// approach): flags along it, a point every `step` metres - 0 dry, 1 nearer
// water than a path keeps, 2 over it (its middle or an edge). Each stretch
// near water goes over it (or only brushes past it), and no further over it
// than a bridge reaches, nor longer near it than it takes to come to it
// and leave it.
export function crossesWell(flags, step = 1) {
  const B = BRIDGE;
  for (let i = 0; i < flags.length; i++) {
    if (!flags[i]) continue;
    let j = i;
    while (j + 1 < flags.length && flags[j + 1]) j++;
    let first = -1;
    let last = -1;
    for (let k = i; k <= j; k++) {
      if (flags[k] !== 2) continue;
      if (first < 0) first = k;
      last = k;
    }
    if (first < 0) {
      if ((j - i) * step > B.brush) return false;
      i = j;
      continue;
    }
    const over = (last - first) * step;
    if (over > B.most || (j - i) * step > over + 2 * B.approach) return false;
    i = j;
  }
  return true;
}

// The bridges a path needs: [{ from, to, a, b }] - metres along its line
// (pathLine), the deck from `from` to `to`, level from `a` to `b` over the
// water and sloping up to that from the ground at each end (over
// BRIDGE.ramp, or less where the path ends sooner - a path that ends in
// the water has a jetty there, level to its end). wet(x, z), hole frame:
// is it water there?
export function bridgeSpans(path, wet) {
  const { pts, cum, length } = pathLine(path);
  const half = reachOf(path);
  const n = pts.length;
  const over = pts.map(([x, z], i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    // Across the path: its middle and both edges.
    const nx = -(b[1] - a[1]) / l;
    const nz = (b[0] - a[0]) / l;
    return wet(x, z) || wet(x + nx * half, z + nz * half) || wet(x - nx * half, z - nz * half);
  });
  const runs = [];
  for (let i = 0; i < n; i++) {
    if (!over[i]) continue;
    let j = i;
    while (j + 1 < n && over[j + 1]) j++;
    // Out to the points either side that are dry, then onto the bank.
    const a = i > 0 ? cum[i - 1] - BRIDGE.margin : 0;
    const b = j < n - 1 ? cum[j + 1] + BRIDGE.margin : length;
    const last = runs[runs.length - 1];
    if (last && a - BRIDGE.ramp - (last.b + BRIDGE.ramp) < BRIDGE.join) last.b = b;
    else runs.push({ a, b });
    i = j;
  }
  return runs.map(({ a, b }) => {
    const lo = Math.max(0, a);
    const hi = Math.min(length, b);
    return { from: Math.max(0, lo - BRIDGE.ramp), to: Math.min(length, hi + BRIDGE.ramp), a: lo, b: hi };
  });
}

// The deck's height at `s` metres along a bridge's path: level at `top`
// from a to b, sloping down over the ramps to the ground (`ground`, its
// height there) at either end - where the path itself is laid.
export function deckHeight(span, s, top, ground) {
  let t = 1;
  if (s < span.a && span.a - span.from > 0.01) t = (s - span.from) / (span.a - span.from);
  else if (s > span.b && span.to - span.b > 0.01) t = (span.to - s) / (span.to - span.b);
  if (t >= 1) return top;
  t = Math.max(0, t);
  // Eased at both ends, so the deck leaves the path and meets the level
  // without a kink.
  const k = t * t * (3 - 2 * t);
  return ground + (top - ground) * k;
}

// The pieces of the bridge on `span` of `path`, in the hole's frame: each a
// box { a, b, w, h } - from point a to b ([x, y, z], metres; y up), w wide
// and h deep across that. heightAt(x, z): the ground's height (as the path
// is laid on it); waterAt(x, z): the water's height where it's wet, else
// null. Returns { planks, frame, top } - frame the posts, rails and the
// beams along each side under the deck.
export function bridgePieces(path, span, heightAt, waterAt = () => null) {
  const B = BRIDGE;
  const line = pathLine(path);
  const half = reachOf(path) + 0.1;
  const at = (s) => {
    const { pts, cum } = line;
    const c = Math.max(0, Math.min(line.length, s));
    let i = 1;
    while (i < pts.length - 1 && cum[i] < c) i++;
    const a = pts[i - 1];
    const b = pts[i];
    const l = cum[i] - cum[i - 1] || 1;
    const u = Math.max(0, Math.min(1, (c - cum[i - 1]) / l));
    const dx = (b[0] - a[0]) / l;
    const dz = (b[1] - a[1]) / l;
    // Its point, which way it runs, and to the right of that.
    return { p: [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u], d: [dx, dz], r: [-dz, dx] };
  };
  // The level: clear of the ground and the water all along the deck.
  let high = -Infinity;
  for (let s = span.from; s <= span.to; s += 0.5) {
    const { p, r } = at(s);
    for (const k of [-1, 0, 1]) {
      const x = p[0] + r[0] * half * k;
      const z = p[1] + r[1] * half * k;
      high = Math.max(high, heightAt(x, z), waterAt(x, z) ?? -Infinity);
    }
  }
  const top = high + B.clear;
  const deckAt = (s) => {
    const { p } = at(s);
    return deckHeight(span, s, top, heightAt(p[0], p[1]) + 0.05);
  };
  const side = (s, k, y) => {
    const { p, r } = at(s);
    return [p[0] + r[0] * half * k, y, p[1] + r[1] * half * k];
  };
  const planks = [];
  for (let s = span.from + B.plank / 2; s <= span.to - B.plank / 2 + 1e-6; s += B.plank + B.gap) {
    const y = deckAt(s);
    planks.push({ a: side(s, -1, y), b: side(s, 1, y), w: B.plank, h: B.thick });
  }
  const frame = [];
  // Posts along the level part and partway down each ramp, a rail along
  // their tops and another halfway down, both sides.
  const p0 = (span.from + span.a) / 2;
  const p1 = (span.b + span.to) / 2;
  const count = Math.max(1, Math.round((p1 - p0) / B.postEvery));
  const posts = Array.from({ length: count + 1 }, (_, i) => p0 + ((p1 - p0) * i) / count);
  for (const k of [-1, 1]) {
    let prev = null;
    for (const s of posts) {
      const y = deckAt(s);
      const { p, r } = at(s);
      const x = p[0] + r[0] * (half + B.post / 2) * k;
      const z = p[1] + r[1] * (half + B.post / 2) * k;
      const foot = Math.min(heightAt(x, z), waterAt(x, z) ?? Infinity) - B.sink;
      frame.push({ a: [x, foot, z], b: [x, y + B.rail, z], w: B.post, h: B.post });
      if (prev) {
        for (const up of [B.rail, B.rail / 2]) frame.push({ a: [prev.x, prev.y + up, prev.z], b: [x, y + up, z], w: 0.06, h: up === B.rail ? 0.08 : 0.06 });
      }
      prev = { x, y, z };
    }
    // The beam under each edge of the deck, end to end.
    for (let s = span.from; s < span.to - 1e-6; s += 1) {
      const e = Math.min(span.to, s + 1);
      frame.push({ a: side(s, k * 0.92, deckAt(s) - B.thick - 0.07), b: side(e, k * 0.92, deckAt(e) - B.thick - 0.07), w: 0.1, h: 0.16 });
    }
  }
  return { planks, frame, top };
}

// ---- Bridges placed by hand ----------------------------------------------------------

// A hole's bridges placed by hand, where its map has a way over water that
// isn't a cart path (a real course: tools/realsteps/burn.mjs), kept as
// layout.bridges: [{ p, w, look }]
//   p     its deck's two ends ([[x, z], [x, z]], hole frame), on the turf
//         either side of the water
//   w     how wide it is overall (metres)
//   look  "arch": a small humped bridge of rough stone on a single low
//         arch, its deck of flagstones rising from the turf at each end to
//         a crown over the water, low parapets along its crown, its ends
//         flaring out onto the turf (the stone bridge on the 18th of a
//         links); "flat": a plain slab of stone laid across from bank to
//         bank, level with the turf
// It's scenery as a cart path's bridge is: a ball goes through it, and one
// that comes down on it is in the water under it (the Rules have a ball on
// a bridge over a penalty area in it). Not a path: the ground under it is
// left as the water's is (a cart path over a brook fills it in over a
// culvert: holeedits/ground.mjs).
export const HAND_BRIDGE = {
  // The stone bridge's shape, in proportion to its length (the map's: the
  // way over it 9 m end to end, its parapets 3.6 - 3.7 m long and 1.56 m
  // apart) as two photographs show it - one from the fairway, in sun and
  // nearly end on, one from across the course under cloud, nearly side on,
  // people beside it for scale (map-cache/photos/agl: 18-bridge-town-a.jpg,
  // 17-road-bunker-a.jpg): its parapets' tops some 1.35 m over the turf at
  // the crown, 0.4 m over the deck - so the deck's crown 0.95 m over the
  // turf at its banks; the arch's opening reaching half a metre over the
  // turf (in the sunlit photograph: 0.38 of the parapets' height over the
  // bank); the parapets a tenth as thick as they're long; the deck at its
  // ends spreading out to some 1.7 times its width at the crown.
  // (land: how far past the water its deck reaches at the least; foot: how
  // far proud of the turf its ends lie, drawn over it rather than into it.)
  arch: { crown: 0.95, open: 0.5, ring: 0.3, clear: 0.3, parapet: { h: 0.4, thick: 0.38, long: 3.6, rough: 0.05, end: 0.3 }, flare: 1.7, buried: 0.25, land: 1.5, foot: 0.02 },
  // A plain flat slab: as thick as a flagstone's slab and its kerb, laid on
  // the walls' coping (look/walls.js: 6 cm proud of the turf) - its top 10
  // cm over the turf - bearing on each bank this far past the water.
  flat: { thick: 0.28, lift: 0.1, bearing: 0.6, buried: 0.1 },
  // How far apart its shape is sampled along it (metres); how far past
  // its ends the water it crosses is looked for.
  step: 0.15,
  past: 3,
};
export const HAND_LOOKS = ["arch", "flat"];

// Is a bridge placed by hand well formed? (A course file can be edited by
// hand: a damaged one is left out.)
export function validHandBridge(b) {
  if (!b || typeof b !== "object" || !Array.isArray(b.p) || b.p.length !== 2) return false;
  if (!b.p.every((q) => Array.isArray(q) && q.length >= 2 && q.every((v) => Number.isFinite(v) && Math.abs(v) <= 5000))) return false;
  const len = Math.hypot(b.p[1][0] - b.p[0][0], b.p[1][1] - b.p[0][1]);
  return len >= 1 && len <= 40 && Number.isFinite(b.w) && b.w >= 0.5 && b.w <= 8 && HAND_LOOKS.includes(b.look ?? "arch");
}

// Where along it the water is: the longest wet stretch of its middle line
// ({ s0, s1, level }: metres from its first end, and the water's level at
// the middle of it), or null over dry ground - looked for up to `past`
// metres beyond either end (a map's way over water can stop short of the
// far bank: s0 below 0, or s1 past its length). waterAt(x, z): the water's
// level there, or null where it's dry.
export function wetSpan(b, waterAt, { step = 0.05, past = 0 } = {}) {
  const [a, e] = b.p;
  const len = Math.hypot(e[0] - a[0], e[1] - a[1]);
  const at = (s) => [a[0] + ((e[0] - a[0]) * s) / len, a[1] + ((e[1] - a[1]) * s) / len];
  let best = null;
  let from = null;
  const n = Math.ceil((len + 2 * past) / step);
  const S = (i) => Math.min(len + past, -past + i * step);
  for (let i = 0; i <= n + 1; i++) {
    const s = S(i);
    const wet = i <= n && waterAt(...at(s)) != null;
    if (wet && from == null) from = s;
    if (!wet && from != null) {
      const to = S(i - 1);
      if (!best || to - from > best.s1 - best.s0) best = { s0: from, s1: to };
      from = null;
    }
  }
  if (!best) return null;
  const mid = at((best.s0 + best.s1) / 2);
  return { ...best, level: waterAt(...mid) };
}

// A bridge placed by hand as the pieces look/bridges.js builds: its stone
// in strips, each a grid of points - rows across it, or down it, one after
// another along it - every point [x, y, z, u, v] (hole frame, y up; u, v
// how far along and down or across it is, metres, for its stones'
// pattern), and what it's of (kind: 0 rough stone, 1 flagstones, 2 the
// underside of its arch). Also what it was made from, for checking it:
// { strips, length, deck: [{ s, y, half }], span, arch: { s0, s1, level,
// open } | null, parapets: { s0, s1, top(s) } | null, ends: [g0, g1] }.
// heightAt(x, z): the ground as it's played and drawn (hole frame);
// waterAt(x, z): the water's level, or null where it's dry.
export function handBridgeShape(b, { heightAt, waterAt }) {
  const look = b.look ?? "arch";
  const [a0, e0] = b.p;
  const L0 = Math.hypot(e0[0] - a0[0], e0[1] - a0[1]);
  const d = [(e0[0] - a0[0]) / L0, (e0[1] - a0[1]) / L0];
  const r = [-d[1], d[0]];
  // Its deck from end to end - or further, to land on the turf this far
  // past the water either side (a ramp's worth for the arch, a bearing's
  // for a slab), where the way it's placed on stops short of a bank.
  const wet0 = wetSpan(b, waterAt, { past: HAND_BRIDGE.past });
  const land = look === "flat" ? HAND_BRIDGE.flat.bearing : HAND_BRIDGE.arch.land;
  const lo = wet0 ? Math.min(0, wet0.s0 - land) : 0;
  const hi = wet0 ? Math.max(L0, wet0.s1 + land) : L0;
  const a = [a0[0] + d[0] * lo, a0[1] + d[1] * lo];
  const L = hi - lo;
  const span = wet0 ? { s0: wet0.s0 - lo, s1: wet0.s1 - lo, level: wet0.level } : null;
  const P = (s, t) => [a[0] + d[0] * s + r[0] * t, a[1] + d[1] * s + r[1] * t];
  const ground = (s, t = 0) => heightAt(...P(s, t));
  // The turf on the banks either side of the water (or at its middle, over
  // dry ground).
  const bank = span ? Math.max(ground(Math.max(0, span.s0 - 0.3)), ground(Math.min(L, span.s1 + 0.3))) : ground(L / 2);
  const ends = [ground(0), ground(L)];
  // Samples along it - every step, with the water's edges themselves.
  const ss = [];
  const n = Math.max(2, Math.ceil(L / HAND_BRIDGE.step));
  for (let i = 0; i <= n; i++) ss.push((L * i) / n);
  if (span) ss.push(span.s0, span.s1, Math.max(0, span.s0 - 0.002), Math.min(L, span.s1 + 0.002));
  const along = [...new Set(ss.map((s) => Math.round(s * 1e4) / 1e4))].sort((x, y) => x - y);
  return look === "flat" ? flatBridge(b, { L, P, ground, span, bank, ends, along }) : archBridge(b, { L, P, ground, span, bank, ends, along });
}

const sinPow = (t) => Math.sin((Math.PI / 2) * Math.min(1, Math.max(0, t))) ** 1.4;

function archBridge(b, { L, P, ground, span, bank, ends, along }) {
  const A = HAND_BRIDGE.arch;
  const half = b.w / 2;
  const sc = span ? (span.s0 + span.s1) / 2 : L / 2;
  const hs = span ? (span.s1 - span.s0) / 2 : 0;
  // The arch's opening: half a metre over the turf at its crown, clear of
  // the water by `clear` at the least; the deck's crown over that by the
  // ring of stone at least.
  const level = span ? span.level : bank - 1;
  const open = span ? Math.max(bank + A.open, level + A.clear + 0.05) : null;
  const crown = Math.max(bank + A.crown, (open ?? bank) + A.ring);
  // The deck: from the turf at each end up to its crown over the middle of
  // the water - a hump, steepest a little way in from each end and level
  // at its crown - and never under the turf it crosses.
  const base = (s) => ends[0] + A.foot + ((ends[1] - ends[0]) * s) / L;
  const raw = (s) => base(s) + (crown - base(sc)) * sinPow(s <= sc ? s / Math.max(1e-6, sc) : (L - s) / Math.max(1e-6, L - sc));
  const inWater = (s) => !!span && s > span.s0 && s < span.s1;
  const deckY = new Map(along.map((s) => [s, s <= 1e-6 || s >= L - 1e-6 ? raw(s) : Math.max(raw(s), inWater(s) ? -Infinity : Math.max(ground(s, -half), ground(s), ground(s, half)) + 0.02)]));
  const y = (s) => deckY.get(s) ?? raw(s);
  // Its parapets along its crown; its ends spreading out onto the turf.
  const pa = Math.max(0.3, sc - A.parapet.long / 2);
  const pb = Math.min(L - 0.3, sc + A.parapet.long / 2);
  const wide = (s) => {
    if (s >= pa && s <= pb) return half;
    const k = s < pa ? (pa - s) / Math.max(1e-6, pa) : (s - pb) / Math.max(1e-6, L - pb);
    const t = Math.min(1, Math.max(0, k));
    return half + half * (A.flare - 1) * t * t * (3 - 2 * t);
  };
  const rough = (s, k) => A.parapet.rough * (Math.sin(s * 7.3 + k * 2.1) * 0.6 + Math.sin(s * 17.9 + k * 5.3) * 0.4);
  const parTop = (s, k) => {
    const into = Math.min(s - pa, pb - s);
    const end = Math.min(1, Math.max(0, into / A.parapet.end));
    return y(s) + A.parapet.h * (0.35 + 0.65 * Math.sqrt(end)) + rough(s, k);
  };
  // The arch's opening at s: springing from just under the water at its
  // banks, up to `open` over the middle - half an ellipse.
  const archY = (s) => (span ? level - 0.05 + (open - level + 0.05) * Math.sqrt(Math.max(0, 1 - ((s - sc) / Math.max(1e-6, hs)) ** 2)) : null);
  const strips = [];
  const pt = (s, t, yy, u, v) => [...[P(s, t)].map(([x, z]) => [x, yy, z])[0], u, v];
  // The deck's flagstones, across it.
  strips.push({ kind: 1, rows: along.map((s) => [pt(s, -wide(s), y(s), s, -wide(s)), pt(s, 0, y(s) + 0.01, s, 0), pt(s, wide(s), y(s), s, wide(s))]) });
  // Each side: its face from the deck - or its parapet's top - down into
  // the ground, or to the arch's opening over the water.
  for (const k of [-1, 1]) {
    strips.push({
      kind: 0,
      rows: along.map((s) => {
        const t = k * wide(s);
        const top = s >= pa && s <= pb ? parTop(s, k) : y(s);
        const bottom = inWater(s) || (span && (s === span.s0 || s === span.s1)) ? archY(s) : ground(s, t) - A.buried;
        return [pt(s, t, top, s, 0), pt(s, t, Math.min(bottom, top - 0.02), s, top - Math.min(bottom, top - 0.02))];
      }),
    });
    // The parapet: its inner face, its top, and its ends.
    const par = along.filter((s) => s >= pa - 1e-6 && s <= pb + 1e-6);
    if (par.length > 1) {
      const outer = k * half;
      const inner = k * (half - A.parapet.thick);
      strips.push({ kind: 0, rows: par.map((s) => [pt(s, inner, parTop(s, k), s, 0), pt(s, inner, y(s) - 0.01, s, parTop(s, k) - y(s))]) });
      strips.push({ kind: 0, rows: par.map((s) => [pt(s, outer, parTop(s, k), s, 0), pt(s, (outer + inner) / 2, parTop(s, k) + 0.015, s, A.parapet.thick / 2), pt(s, inner, parTop(s, k), s, A.parapet.thick)]) });
      for (const s of [par[0], par[par.length - 1]]) strips.push({ kind: 0, rows: [[pt(s, outer, parTop(s, k), 0, 0), pt(s, outer, y(s) - 0.01, 0, parTop(s, k) - y(s))], [pt(s, inner, parTop(s, k), A.parapet.thick, 0), pt(s, inner, y(s) - 0.01, A.parapet.thick, parTop(s, k) - y(s))]] });
    }
  }
  // The underside of the arch, across it from side to side.
  if (span) {
    const under = along.filter((s) => s >= span.s0 && s <= span.s1);
    strips.push({ kind: 2, rows: under.map((s) => [pt(s, half, archY(s), s, 0), pt(s, -half, archY(s), s, b.w)]) });
  }
  return {
    look: "arch",
    length: L,
    strips,
    ends,
    bank,
    span,
    deck: along.map((s) => ({ s, y: y(s), half: wide(s) })),
    arch: span ? { s0: span.s0, s1: span.s1, level, open, at: archY } : null,
    parapets: { s0: pa, s1: pb, top: (s) => Math.min(parTop(s, -1), parTop(s, 1)) },
    crown,
  };
}

function flatBridge(b, { L, P, ground, span, bank, ends, along }) {
  const F = HAND_BRIDGE.flat;
  const half = b.w / 2;
  const sa = span ? Math.max(0, span.s0 - F.bearing) : 0;
  const sb = span ? Math.min(L, span.s1 + F.bearing) : L;
  const top = bank + F.lift;
  const under = top - F.thick;
  const inWater = (s) => !!span && s >= span.s0 && s <= span.s1;
  const on = along.filter((s) => s >= sa - 1e-6 && s <= sb + 1e-6);
  const pt = (s, t, yy, u, v) => {
    const [x, z] = P(s, t);
    return [x, yy, z, u, v];
  };
  const strips = [];
  strips.push({ kind: 1, rows: on.map((s) => [pt(s, -half, top, s, -half), pt(s, half, top, s, half)]) });
  for (const k of [-1, 1]) {
    strips.push({
      kind: 0,
      rows: on.map((s) => {
        const bottom = inWater(s) ? under : Math.min(under, ground(s, k * half) - F.buried);
        return [pt(s, k * half, top, s, 0), pt(s, k * half, bottom, s, top - bottom)];
      }),
    });
  }
  // Its ends, down into the bank.
  for (const s of [on[0], on[on.length - 1]]) {
    const bottom = Math.min(under, ground(s) - F.buried);
    strips.push({ kind: 0, rows: [[pt(s, -half, top, 0, 0), pt(s, -half, bottom, 0, top - bottom)], [pt(s, half, top, b.w, 0), pt(s, half, bottom, b.w, top - bottom)]] });
  }
  if (span) {
    const over = on.filter((s) => inWater(s));
    if (over.length > 1) strips.push({ kind: 2, rows: over.map((s) => [pt(s, half, under, s, 0), pt(s, -half, under, s, b.w)]) });
  }
  return { look: "flat", length: L, strips, ends, bank, span, deck: on.map((s) => ({ s, y: top, half })), slab: { s0: sa, s1: sb, top, under }, arch: null, parapets: null, crown: top };
}
