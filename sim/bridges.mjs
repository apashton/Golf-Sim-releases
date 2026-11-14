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
