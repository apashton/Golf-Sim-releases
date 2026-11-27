// A hole's boundaries as they're drawn (course/boundaries.js): its
// free-standing walls as ribbons that follow the ground, its fences as
// posts and rails, and the white stakes of its out of bounds.
// Where each stands is play's own (sim/solids.mjs, sim/outofbounds.mjs).
// Pure.

import { solidWalls, SOLID } from "./solids.mjs";
import { outShapes, outStakes } from "./outofbounds.mjs";
import { nearest } from "./course.mjs";

export const BOUNDARY = {
  // A wall's stretches (metres long, at most), and its stone.
  stretch: 5,
  stone: "#96968f",
  coping: "#a8a8a1",
  // A fence: posts this far apart and this high, two rails.
  post: 2.4,
  fenceHeight: 1.05,
  rails: [0.5, 0.95],
  // A stake: how high, and how near a wall or fence none's needed.
  stake: 0.9,
  marked: 3,
};

// A line's points every `step` metres at most, its own corners kept
// (each marked: point.corner true).
export function alongLine(line, step) {
  const out = [];
  const corner = (p) => Object.assign([p[0], p[1]], { corner: true });
  for (let i = 1; i < line.length; i++) {
    const [ax, az] = line[i - 1];
    const [bx, bz] = line[i];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / step));
    for (let k = 0; k < n; k++) out.push(k ? [ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n] : corner(line[i - 1]));
  }
  if (line.length) out.push(corner(line[line.length - 1]));
  return out;
}

// A line as a ribbon `thick` wide: for each of its points, the ribbon's
// two edges there - [[x, z] to its right, [x, z] to its left] - mitred at
// each bend, so stretches made from one point's pair to the next's meet
// exactly round a corner (a mitre no longer than twice the half-width, at
// a sharp one).
export function ribbon(pts, thick) {
  const h = thick / 2;
  const dir = (a, b) => {
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  };
  return pts.map((p, i) => {
    const before = i ? dir(pts[i - 1], p) : null;
    const after = i < pts.length - 1 ? dir(p, pts[i + 1]) : null;
    // (Each stretch's normal, to its right: (uz, -ux).)
    const n = [before, after].filter(Boolean).map(([ux, uz]) => [uz, -ux]);
    let nx = n.reduce((a, v) => a + v[0], 0);
    let nz = n.reduce((a, v) => a + v[1], 0);
    const l = Math.hypot(nx, nz) || 1;
    nx /= l;
    nz /= l;
    // The mitre: out along the bend's bisector until it's h off each stretch.
    const cos = Math.max(0.5, nx * n[0][0] + nz * n[0][1]);
    const k = h / cos;
    return [
      [p[0] + nx * k, p[1] + nz * k],
      [p[0] - nx * k, p[1] - nz * k],
    ];
  });
}

// The hole's walls as they're drawn: [{ h, pts, edges }] - each wall's
// line in stretches of BOUNDARY.stretch metres at most (pts), with the
// ribbon's two edges at each point (edges: ribbon). The wall stands `h`
// over the ground along its line, its top following the ground from point
// to point - one length of wall, not blocks.
export function wallRuns(L) {
  return solidWalls(L)
    .map((w) => {
      const pts = alongLine(w.p, BOUNDARY.stretch).filter((p, i, all) => !i || Math.hypot(p[0] - all[i - 1][0], p[1] - all[i - 1][1]) > 1e-6);
      return { h: w.h, pts, edges: ribbon(pts, SOLID.thick) };
    })
    .filter((w) => w.pts.length >= 2);
}

// The hole's fences: [{ posts: [[x, z], ...] }] - a post at every corner
// and every BOUNDARY.post metres between; the rails run post to post.
export function fenceRuns(L) {
  return (L?.walls ?? []).filter((w) => w?.kind === "fence" && Array.isArray(w.p) && w.p.length >= 2).map((w) => ({ posts: alongLine(w.p, BOUNDARY.post) }));
}

// Where the hole's white stakes stand (sim/outofbounds.mjs outStakes):
// along its out of bounds within sight of its line (`path`: the hole's,
// course.mjs makePath), not where a wall or fence marks the edge already.
export function boundaryStakes(L, path) {
  const shapes = outShapes(L);
  if (!shapes.length) return [];
  const lines = (L.walls ?? []).filter((w) => Array.isArray(w?.p)).map((w) => alongLine(w.p, 1.5));
  const marked = (x, z) => lines.some((pts) => pts.some(([px, pz]) => Math.hypot(px - x, pz - z) <= BOUNDARY.marked));
  return outStakes(shapes, (x, z) => Math.abs(nearest(path, x, z).d), marked);
}
