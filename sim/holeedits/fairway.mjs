// Hand edits to a hole (sim/holeedits.mjs): the fairway - widening and
// sizing it along its spine, which fairway is where.

import { makePath, nearest, pointAt } from "../course.mjs";
import { insidePolygon, distanceToEdge, polygonBounds } from "../terrain.mjs";
import { clamp } from "../mathutil.mjs";
import { r2 } from "./common.mjs";
import { editState, validEdit } from "./apply.mjs";

// ---- The fairway -------------------------------------------------------------------

// A mapped fairway made wider or narrower: each edge point moved out from
// (or in towards) the fairway's own middle there, square to `path` - the
// hole's line for its own fairway, or the fairway's own middle line
// (fairwaySpine) for any fairway on its own.
export function widenFairway(poly, path, f) {
  const info = poly.map(([x, z]) => nearest(path, x, z));
  return poly.map(([x, z], i) => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const o of info) {
      if (Math.abs(o.s - info[i].s) > 20) continue;
      lo = Math.min(lo, o.d);
      hi = Math.max(hi, o.d);
    }
    const mid = (lo + hi) / 2;
    const shift = (info[i].d - mid) * (f - 1);
    const at = pointAt(path, info[i].s);
    return [r2(x - at.dir[1] * shift), r2(z + at.dir[0] * shift)];
  });
}

// A hole from a map or on hills can have several fairways: its own, and
// those of the holes beside it that come within its bounds (the owner: "A
// course has generated with multiple fairways. I need them to be
// independent and to be able to delete them and size them differently").
// Each is found, sized and taken away on its own.

// The line down the middle of a fairway, end to end and on a little past
// each: along its longest way, the middle of it every few metres. Widened
// square to this, a fairway keeps its line and length whichever way it
// runs - a neighbour's strip crossing the hole, widened square to the
// hole's line, was stretched sideways tens of metres.
export function fairwaySpine(poly) {
  const n = poly.length;
  let mx = 0;
  let mz = 0;
  for (const [x, z] of poly) {
    mx += x / n;
    mz += z / n;
  }
  let sxx = 0;
  let sxz = 0;
  let szz = 0;
  for (const [x, z] of poly) {
    sxx += (x - mx) ** 2;
    sxz += (x - mx) * (z - mz);
    szz += (z - mz) ** 2;
  }
  // Its longest way, and square to it.
  const ang = 0.5 * Math.atan2(2 * sxz, sxx - szz);
  const u = [Math.cos(ang), Math.sin(ang)];
  const v = [-u[1], u[0]];
  const along = ([x, z]) => (x - mx) * u[0] + (z - mz) * u[1];
  const across = ([x, z]) => (x - mx) * v[0] + (z - mz) * v[1];
  let t0 = Infinity;
  let t1 = -Infinity;
  for (const q of poly) {
    t0 = Math.min(t0, along(q));
    t1 = Math.max(t1, along(q));
  }
  const at = (t, w) => [mx + u[0] * t + v[0] * w, mz + u[1] * t + v[1] * w];
  const steps = Math.max(2, Math.ceil((t1 - t0) / 6));
  const pts = [];
  for (let k = 0; k <= steps; k++) {
    // (A little in from each end, where it's more than a point across.)
    const t = t0 + (t1 - t0) * (0.02 + (0.96 * k) / steps);
    // Where the line square to its way at t crosses the outline.
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const ta = along(poly[j]);
      const tb = along(poly[i]);
      if (ta === tb || (ta - t) * (tb - t) > 0) continue;
      const w = across(poly[j]) + (across(poly[i]) - across(poly[j])) * ((t - ta) / (tb - ta));
      lo = Math.min(lo, w);
      hi = Math.max(hi, w);
    }
    if (lo <= hi) pts.push(at(t, (lo + hi) / 2));
  }
  if (pts.length < 2) return [at(t0 - 20, 0), at(t1 + 20, 0)];
  // On past each end, so its ends widen across it too.
  const out = (a, b) => {
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [a[0] + ((a[0] - b[0]) / d) * 20, a[1] + ((a[1] - b[1]) / d) * 20];
  };
  return [out(pts[0], pts[1]), ...pts, out(pts[pts.length - 1], pts[pts.length - 2])];
}

// A fairway made narrower or wider on its own, square to its own line.
export function sizeFairway(poly, f) {
  return f === 1 ? poly : widenFairway(poly, makePath(fairwaySpine(poly)), f);
}

// Each fairway's spot - where an edit finds it by: a point well inside it
// (the furthest in from its edge of a grid over it), which narrowing or
// widening it never leaves. Worked out once for each outline.
const anchors = new WeakMap();
export function fairwayAnchor(poly) {
  let best = anchors.get(poly);
  if (best) return best;
  const b = polygonBounds(poly);
  let deep = -Infinity;
  const N = 24;
  for (let i = 0; i <= N; i++) {
    for (let k = 0; k <= N; k++) {
      const x = b.x0 + ((b.x1 - b.x0) * i) / N;
      const z = b.z0 + ((b.z1 - b.z0) * k) / N;
      if (!insidePolygon(poly, x, z)) continue;
      const d = distanceToEdge(poly, x, z);
      if (d > deep) [deep, best] = [d, [r2(x), r2(z)]];
    }
  }
  best ??= [r2((b.x0 + b.x1) / 2), r2((b.z0 + b.z1) / 2)];
  anchors.set(poly, best);
  return best;
}

// Which of `polys` is the fairway at `at` - its spot, or else the one `at`
// is furthest inside (or nearest, within `reach` metres) - or -1.
export function fairwayAt(polys, at, reach = 3) {
  const same = (a) => Math.abs(a[0] - at[0]) < 0.05 && Math.abs(a[1] - at[1]) < 0.05;
  const exact = polys.findIndex((p) => same(fairwayAnchor(p)));
  if (exact >= 0) return exact;
  let best = -1;
  let deep = -Infinity;
  polys.forEach((p, i) => {
    const d = distanceToEdge(p, at[0], at[1]) * (insidePolygon(p, at[0], at[1]) ? 1 : -1);
    if (d > deep) [deep, best] = [d, i];
  });
  return deep >= -reach ? best : -1;
}

// Does the hole's line run through this fairway? (Its own, not a
// neighbour's beside it.)
export function onTheLine(poly, path) {
  for (let s = 0; s <= path.length; s += 5) {
    const { p } = pointAt(path, s);
    if (insidePolygon(poly, p[0], p[1])) return true;
  }
  return false;
}

// How wide the fairway at `at` is now, against how it was made: its own
// last "f", or for the hole's own fairway an older "fw" (from before each
// fairway had its own), or 1. For the designer's slider.
export function fairwayWidth(layout, at) {
  const edits = layout?.edits ?? [];
  const list = layout?.fairways ?? [];
  const i = fairwayAt(list, at);
  if (i < 0) return 1;
  for (let k = edits.length - 1; k >= 0; k--) {
    const e = edits[k];
    if (e?.k === "f" && validEdit(e) && fairwayAt(list, e.at) === i) return clamp(e.f, 0.5, 1.8);
  }
  const fw = clamp(editState(edits).fw, 0.5, 1.8);
  return fw !== 1 && onTheLine(list[i], makePath(layout.path)) ? fw : 1;
}
