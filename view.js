// The camera: follow the ball, or stay put and watch it go. One setting for
// every mode (V), remembered between sessions.

import { loadSetting, saveSetting } from "./util.js";

export const view = loadSetting("view", { follow: true });

export function setFollow(on) {
  view.follow = on;
  saveSetting("view", view);
}

// With the camera staying put: where to look so the ball stays in the
// picture. The camera turns from `look` only as far as it must to keep the
// ball within `yaw` degrees of the centre side to side and `pitch` degrees up
// and down - a draw or a high wedge stays on screen, but a straight shot
// flies away down a still picture. Writes into and returns `out` (anything
// with x, y, z and set()).
export function keepInView(camera, look, ball, out, { yaw = 12, pitch = 14 } = {}) {
  const angles = (p) => {
    const dx = p.x - camera.x;
    const dy = p.y - camera.y;
    const dz = p.z - camera.z;
    const flat = Math.hypot(dx, dz);
    return { yaw: Math.atan2(dx, -dz), pitch: Math.atan2(dy, flat), dist: Math.hypot(flat, dy) };
  };
  const base = angles(look);
  const b = angles(ball);
  const clampTurn = (from, to, limit) => {
    let d = to - from;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    const l = (limit * Math.PI) / 180;
    return from + Math.sign(d) * Math.max(0, Math.abs(d) - l);
  };
  const y = clampTurn(base.yaw, b.yaw, yaw);
  const p = clampTurn(base.pitch, b.pitch, pitch);
  const r = base.dist;
  return out.set(
    camera.x + Math.sin(y) * Math.cos(p) * r,
    camera.y + Math.sin(p) * r,
    camera.z - Math.cos(y) * Math.cos(p) * r,
  );
}

// Keeps a chase camera out of the trees. trees: [{ x, z, r, top }] in world
// metres - where each stands, how far its crown reaches and the height of
// its top; p: where the camera wants to be (changed in place); target: what
// it's looking at (the ball). A camera inside a crown goes up over it if
// that's not far (climb metres); otherwise it comes in along the line
// towards the ball until it's clear - and failing that, over the top.
export function clearOfTrees(trees, p, target, { margin = 1.5, climb = 6 } = {}) {
  if (!trees?.length) return p;
  // How high the camera must be at (x, z) to be clear of every crown there.
  const need = (x, z) => {
    let h = -Infinity;
    for (const t of trees) {
      const dx = t.x - x;
      const dz = t.z - z;
      const r = t.r + margin;
      if (dx * dx + dz * dz < r * r && t.top + margin > h) h = t.top + margin;
    }
    return h;
  };
  const here = need(p.x, p.z);
  if (p.y >= here) return p;
  if (here - p.y <= climb) {
    p.y = here;
    return p;
  }
  const [sx, sy, sz] = [p.x, p.y, p.z];
  for (let f = 0.1; f <= 0.85; f += 0.05) {
    const x = sx + (target.x - sx) * f;
    const y = sy + (target.y - sy) * f;
    const z = sz + (target.z - sz) * f;
    const h = need(x, z);
    if (y >= h || h - y <= climb) {
      p.x = x;
      p.y = Math.max(y, h);
      p.z = z;
      return p;
    }
  }
  p.y = here;
  return p;
}

// What the chase camera (and the flyover's) keeps clear of: the trees'
// crowns, and every building - the clubhouse past the last green, a mapped
// course's buildings - each a group in `world` that carries its own
// upright cylinders, as crowns are counted (userData.keepClear: [{ x, z,
// r, top }], sim/buildings.mjs footprintClear). One list, so every camera
// that keeps out of the trees keeps out of the buildings too.
export function keepClear(crowns, world) {
  const out = [...(crowns ?? [])];
  for (const o of world?.children ?? []) if (o.userData?.keepClear) out.push(...o.userData.keepClear);
  return out;
}

// Whether a point is inside any tree's crown, as clearOfTrees counts one:
// its reach and `margin` round it, from the ground to `margin` over its top.
export function inCrown(trees, p, margin = 1.5) {
  return !!trees?.some((t) => Math.hypot(p.x - t.x, p.z - t.z) < t.r + margin && p.y < t.top + margin);
}

// How high the straight line from a to b must be to pass clear over every
// crown it crosses (as clearOfTrees counts them: a crown's reach and
// `margin` round it, up to `margin` over its top), or -Infinity if it
// crosses none low enough to go through it. Each crown is an upright
// cylinder, and the line's height changes steadily along it, so the
// lowest it is inside one is where it goes in or where it comes out.
export function wayClear(trees, a, b, margin = 1.5) {
  let need = -Infinity;
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const dd = dx * dx + dz * dz;
  for (const t of trees ?? []) {
    const reach = t.r + margin;
    const over = t.top + margin;
    if (over <= need) continue;
    // Where along the line (0 - 1) it's within reach of the trunk.
    const fx = a.x - t.x;
    const fz = a.z - t.z;
    const c = fx * fx + fz * fz - reach * reach;
    let t0;
    let t1;
    if (dd < 1e-12) {
      if (c >= 0) continue;
      [t0, t1] = [0, 1];
    } else {
      const bb = fx * dx + fz * dz;
      const disc = bb * bb - dd * c;
      if (disc <= 0) continue;
      const s = Math.sqrt(disc);
      t0 = Math.max(0, (-bb - s) / dd);
      t1 = Math.min(1, (-bb + s) / dd);
      if (t0 >= t1) continue;
    }
    const low = Math.min(a.y + (b.y - a.y) * t0, a.y + (b.y - a.y) * t1);
    if (low < over) need = over;
  }
  return need;
}

// Where a camera easing from `from` towards `to` (clear of the trees
// itself) should head for now, so that the straight line it eases along
// doesn't go through a crown: `to`, if the way is clear; if not, first
// straight up where it is until it's high enough to pass over the crowns
// in the way, then level over them until it can come down to `to`. Over
// the trees, as the chase camera goes, rather than weaving round them.
// Writes into and returns `out`.
export function wayPast(trees, from, to, out, { margin = 1.5 } = {}) {
  const need = wayClear(trees, from, to, margin);
  if (need === -Infinity) return out.set(to.x, to.y, to.z);
  // (Heading a little higher than it needs, so easing up it gets there
  // rather than only ever nearer.)
  if (from.y < need) return out.set(from.x, need + 2, from.z);
  return out.set(to.x, from.y, to.z);
}

// A camera that has strayed into a crown, put back out of it the shortest
// way: up over its top, or out sideways to its edge - where it strays in
// a little at a time, never more than a little. Where crowns overlap and
// the way out of one leads into another, it goes over them all. p is
// changed in place.
export function outOfCrowns(trees, p, { margin = 1.5 } = {}) {
  if (!trees?.length) return p;
  for (let pass = 0; pass < 6; pass++) {
    let moved = false;
    for (const t of trees) {
      const dx = p.x - t.x;
      const dz = p.z - t.z;
      const reach = t.r + margin;
      const over = t.top + margin;
      const d = Math.hypot(dx, dz);
      if (d >= reach || p.y >= over) continue;
      moved = true;
      if (over - p.y <= reach - d || d < 1e-6) p.y = over;
      else {
        // (A hair past the edge, so rounding doesn't leave it inside.)
        p.x = t.x + (dx / d) * reach * 1.000001;
        p.z = t.z + (dz / d) * reach * 1.000001;
      }
    }
    if (!moved) return p;
  }
  // Still among them: over the top of every crown it's under.
  for (const t of trees) {
    if (Math.hypot(p.x - t.x, p.z - t.z) < t.r + margin) p.y = Math.max(p.y, t.top + margin);
  }
  return p;
}

// A camera easing `k` of the way from where it is (`cam`, changed in
// place) towards where it wants to be (`want`), kept out of the trees on
// the way as well as there. clearOfTrees keeps clear the place a camera is
// heading for, but the camera eases towards it from wherever it was, and
// the straight line it takes can cut through a crown: the chase camera
// trailing the ball past a tall tree, or the flyover's as the place it's
// heading for jumps from over a crown to in under one. So it goes over
// the crowns in its way (wayPast), and if it has strayed into one all the
// same it's put back out (outOfCrowns). When where it's going is in a
// crown - a ball lying under a tree is looked at from under it - it has
// to go in, and simply eases there.
export function easePast(trees, cam, want, k, { margin = 1.5 } = {}) {
  let to = want;
  if (trees?.length && !inCrown(trees, want, margin)) {
    outOfCrowns(trees, cam, { margin });
    to = wayPast(trees, cam, want, { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } }, { margin });
  }
  cam.x += (to.x - cam.x) * k;
  cam.y += (to.y - cam.y) * k;
  cam.z += (to.z - cam.z) * k;
  if (to !== want) outOfCrowns(trees, cam, { margin });
  return cam;
}

// How big a finished ball left lying on the range is drawn (a radius, in
// metres). Seen from the tee it grows with its distance, so it's a few
// pixels wherever it lies; seen close up - the chase camera stopping just
// behind it - it's tucked just inside the ball that's still lying there, as
// a metre-wide ball would fill the picture. It grows when the camera goes
// back to the tee.
export const BALL_RADIUS = 0.06;
export function sessionBallSize(distance, { closeUp = false } = {}) {
  return closeUp ? BALL_RADIUS * 0.9 : 0.22 + distance * 0.0032;
}
