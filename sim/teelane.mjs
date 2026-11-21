// A clear view from the tee (the owner: "it keeps putting trees right in
// front of the tee box... a small, narrow corridor where there should
// always be a gap ... trees to the side of that corridor, but not
// blocking the main view to the fairway"). A lane from the tee to where
// the fairway starts (a par 3: the green) that a course, as it's made,
// never puts a tree in - generated (course.mjs buildHole), from the map
// or on made-up hills (mapcourse.mjs). Trees planted by hand are the
// player's own business and stay. Pure.
//
// The lane: the straight line from the tee to its far end, and the hole's
// own line that far (a dogleg off the tee), LANE.near metres either side
// at the tee, widening to LANE.far at the end; each tree's crown kept out
// of it too.

import { TREE_KINDS } from "./lidartrees.mjs";

export const LANE = { near: 6, far: 12, past: 30 };

const hyp = Math.hypot;

// How far along a polyline [[x, z]...] to its point at s, and the point.
function along(points, s) {
  let run = 0;
  for (let i = 1; i < points.length; i++) {
    const [ax, az] = points[i - 1];
    const [bx, bz] = points[i];
    const len = hyp(bx - ax, bz - az);
    if (run + len >= s) {
      const f = (s - run) / (len || 1);
      return [ax + (bx - ax) * f, az + (bz - az) * f];
    }
    run += len;
  }
  return points.at(-1);
}

// The hole's line, cut at s metres: [[x, z]...].
function lineTo(points, s) {
  const out = [points[0]];
  let run = 0;
  for (let i = 1; i < points.length; i++) {
    const len = hyp(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
    if (run + len >= s) {
      out.push(along(points, s));
      return out;
    }
    run += len;
    out.push(points[i]);
  }
  return out;
}

// Where along the hole's line its fairway starts (metres): a generated
// hole's fairway.from; a mapped one's first point of its line inside a
// fairway polygon. Null when there's none (the lane runs to the green).
function fairwayStart(L, insideFairway) {
  if (L.fairway?.to > L.fairway?.from && L.source !== "map") return L.fairway.from;
  if (!insideFairway || !(L.fairways ?? []).length) return null;
  let run = 0;
  const pts = L.path;
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1];
    const [bx, bz] = pts[i];
    const len = hyp(bx - ax, bz - az);
    for (let s = 0; s < len; s += 4) {
      const f = s / (len || 1);
      if (insideFairway(ax + (bx - ax) * f, az + (bz - az) * f)) return run + s;
    }
    run += len;
  }
  return null;
}

// The lane for a hole layout: { lines: [[[x, z]...], ...], length } - the
// straight line and the hole's line, both from the tee - or null for a
// hole with no line. insideFairway(x, z): for a mapped hole's polygons.
export function teeLane(L, { insideFairway = null } = {}) {
  const pts = L?.path;
  if (!Array.isArray(pts) || pts.length < 2) return null;
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += hyp(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  const start = L.par === 3 ? null : fairwayStart(L, insideFairway);
  const length = Math.min(total, start == null ? total : start + LANE.past);
  if (length <= 0) return null;
  const end = along(pts, length);
  return { lines: [[pts[0], end], lineTo(pts, length)], length };
}

// Is [x, z] (a crown `reach` metres across, as a radius) in the lane?
export function inTeeLane(lane, x, z, reach = 0) {
  if (!lane) return false;
  for (const line of lane.lines) {
    let run = 0;
    for (let i = 1; i < line.length; i++) {
      const [ax, az] = line[i - 1];
      const [bx, bz] = line[i];
      const dx = bx - ax;
      const dz = bz - az;
      const len2 = dx * dx + dz * dz;
      const len = Math.sqrt(len2);
      const t = len2 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / len2)) : 0;
      const s = run + t * len;
      // Only alongside the lane, not past either end of it.
      const endOn = (i === 1 && t === 0) || (i === line.length - 1 && t === 1);
      const half = LANE.near + (LANE.far - LANE.near) * Math.min(1, s / (lane.length || 1));
      if (!endOn && hyp(ax + dx * t - x, az + dz * t - z) < half + reach) return true;
      run += len;
    }
  }
  return false;
}

// A tree's crown radius (metres), as holeedits.mjs crownOf has it: a real
// (LiDAR) tree's from its kind and width, any other's from its size.
export function crownReach(t) {
  const [, , s = 1, kind, width] = t;
  return kind != null && TREE_KINDS[kind] ? s * (width ?? 1) * TREE_KINDS[kind].radius : 2.8 * s;
}

// A hole's trees with those in its tee lane left out.
export function clearTeeLane(L, trees, opts = {}) {
  const lane = teeLane(L, opts);
  if (!lane) return trees;
  return trees.filter((t) => !inTeeLane(lane, t[0], t[1], crownReach(t)));
}
