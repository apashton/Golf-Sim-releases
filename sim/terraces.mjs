// A terrace beside a building: paving on a level, a rail along its open
// sides, tables and chairs under parasols (the owner, 27 November 2026, of
// Arrowmill Park's hotel: "particularly the outside seating area that looks
// down on the 18th hole"). A course from a map carries each on the holes
// whose ground it stands on (layout.terraces - tools/realsteps/terraces.mjs
// puts a real course's there from its definition); look/terrace.js draws
// them. It's scenery: the ground under it plays as it did.
//
// One terrace as a hole keeps it: { poly: [[x, z], ...] (its outline, the
// hole's frame), tables: [[x, z, turn, parasol (1 or 0)], ...], rails:
// [[[x, z], ...], ...] (each run of rail along its open edge), parasol
// ("#rrggbb", or none for the game's own) }.
//
// Pure.

import { insidePolygon, distanceToEdge, polygonBounds } from "./terrain.mjs";

export const TERRACE = {
  // Tables: this far apart (metres, a staggered grid), no nearer the
  // terrace's edge than `edge` or a wall of the building than `wall`.
  apart: 3.6,
  edge: 1.5,
  wall: 1.7,
  // No more than this many on one terrace.
  most: 14,
  // About this share of them under a parasol.
  parasols: 0.6,
  // A rail along every edge further than this from the building (metres),
  // in runs no shorter than `least`.
  open: 1.2,
  least: 2,
  // How finely an edge is walked (metres).
  step: 0.5,
  // The paving stands this far over the highest ground under it (metres).
  proud: 0.08,
  // The game's own parasol.
  parasol: "#9c3b33",
};

// A small steady number 0 - 1 from a place and a seed.
function hash(x, z, seed) {
  let h = 0x811c9dc5 ^ (seed | 0);
  h = Math.imul(h ^ Math.round(x * 10), 16777619);
  h = Math.imul(h ^ Math.round(z * 10), 16777619);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  return (h >>> 0) / 4294967296;
}

// How near a spot is to the building: 0 inside any of `walls` (outlines),
// else the distance to the nearest's edge.
function toBuilding(walls, x, z) {
  let d = Infinity;
  for (const w of walls) {
    if (insidePolygon(w, x, z)) return 0;
    d = Math.min(d, distanceToEdge(w, x, z));
  }
  return d;
}

// Where its tables stand: [[x, z, turn, parasol], ...] - a staggered grid
// laid along the terrace's longer way, each spot kept only where it's on
// the paving clear of its edge and of the building (`walls`: the outlines
// of what stands by it), each turned a little its own way.
export function terraceTables(poly, { walls = [], seed = 1 } = {}) {
  if (!(poly?.length >= 3)) return [];
  const T = TERRACE;
  const b = polygonBounds(poly);
  const out = [];
  let row = 0;
  for (let z = b.z0 + T.edge; z <= b.z1 - T.edge + 1e-6; z += T.apart * 0.87, row++) {
    for (let x = b.x0 + T.edge + (row % 2 ? T.apart / 2 : 0); x <= b.x1 - T.edge + 1e-6; x += T.apart) {
      // (Each a little off its place: nobody sets them out with a tape.)
      const px = x + (hash(x, z, seed) - 0.5) * 0.7;
      const pz = z + (hash(z, x, seed + 7) - 0.5) * 0.7;
      if (!insidePolygon(poly, px, pz) || distanceToEdge(poly, px, pz) < T.edge) continue;
      if (toBuilding(walls, px, pz) < T.wall) continue;
      out.push([Math.round(px * 100) / 100, Math.round(pz * 100) / 100, Math.round(hash(px, pz, seed + 3) * Math.PI * 100) / 100, 0]);
    }
  }
  // Its parasols: over that share of its tables, whichever a steady draw picks.
  const order = out.map((t, i) => [hash(t[0], t[1], seed + 11), i]).sort((a, b) => a[0] - b[0]);
  for (const [, i] of order.slice(0, Math.round(out.length * T.parasols))) out[i][3] = 1;
  // (Too many: the ones furthest from the building go last - it's the
  // tables by the rail that are seen.)
  return out.length > T.most ? out.sort((p, q) => toBuilding(walls, q[0], q[1]) - toBuilding(walls, p[0], p[1])).slice(0, T.most) : out;
}

// Its rails: each run of its outline that's open - further than `open`
// from the building - as a line [[x, z], ...], the corners it passes kept.
export function terraceRails(poly, { walls = [] } = {}) {
  if (!(poly?.length >= 3)) return [];
  const T = TERRACE;
  // Its outline walked a step at a time: each spot open or not, and
  // whether it's a corner.
  const spots = [];
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const a = poly[i];
    const c = poly[(i + 1) % n];
    const steps = Math.max(1, Math.ceil(Math.hypot(c[0] - a[0], c[1] - a[1]) / T.step));
    for (let k = 0; k < steps; k++) {
      const p = [a[0] + ((c[0] - a[0]) * k) / steps, a[1] + ((c[1] - a[1]) * k) / steps];
      spots.push({ p, open: toBuilding(walls, p[0], p[1]) > T.open, corner: k === 0 });
    }
  }
  const round = ([x, z]) => [Math.round(x * 100) / 100, Math.round(z * 100) / 100];
  const start = spots.findIndex((s) => !s.open);
  // (Open all round: one rail, back to where it began.)
  if (start < 0) return [[...poly.map(round), round(poly[0])]];
  const runs = [];
  let run = [];
  const end = () => {
    if (run.length >= 2) {
      // (Its ends and the corners between.)
      const line = run.filter((s, i) => i === 0 || i === run.length - 1 || s.corner).map((s) => round(s.p));
      let len = 0;
      for (let i = 1; i < line.length; i++) len += Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]);
      if (len >= T.least) runs.push(line);
    }
    run = [];
  };
  for (let k = 1; k <= spots.length; k++) {
    const s = spots[(start + k) % spots.length];
    if (s.open) run.push(s);
    else end();
  }
  end();
  return runs;
}

// How high its paving stands: a little over the highest ground under it
// (heightAt(x, z)), so no ground shows through; null for no terrace.
export function terraceLevel(poly, heightAt) {
  if (!(poly?.length >= 3)) return null;
  const b = polygonBounds(poly);
  let top = -Infinity;
  for (const [x, z] of poly) top = Math.max(top, heightAt(x, z));
  for (let x = b.x0; x <= b.x1; x += 1) for (let z = b.z0; z <= b.z1; z += 1) if (insidePolygon(poly, x, z)) top = Math.max(top, heightAt(x, z));
  return Number.isFinite(top) ? top + TERRACE.proud : null;
}

// A terrace as a hole keeps it, from its outline: its tables and rails
// worked out against the building's outlines.
export function terraceFor(poly, { walls = [], seed = 1, parasol = null } = {}) {
  const ring = poly.map(([x, z]) => [Math.round(x * 100) / 100, Math.round(z * 100) / 100]);
  return { poly: ring, tables: terraceTables(ring, { walls, seed }), rails: terraceRails(ring, { walls }), ...(parasol ? { parasol } : {}) };
}

// A hole's terraces, read back safely: those with an outline.
export const terracesOf = (L) => (Array.isArray(L?.terraces) ? L.terraces.filter((t) => Array.isArray(t?.poly) && t.poly.length >= 3) : []);
