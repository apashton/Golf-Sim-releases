// The lie of the land on a designed hole (docs/PHYSICS-PLAN.md phase 2;
// the owner: "Anywhere but in regions. So can have flat areas in parts of
// the fairway, but rolling areas in other sections"): gentle undulations in
// patches - here a flat stretch of fairway, there a rolling one - that a
// ball kicks off and feeds down, and that the ground is drawn with, so what
// you see is what it does. None by the green (it has its own contours), the
// tees, the bunkers or the water, faded out round each. A hole from a map
// has its real ground instead.
//
// Worked out once a hole onto a grid, read back smoothly; the same hole
// always rolls the same way. Pure.

import { insideDepth } from "./holeedits.mjs";
import { insideOutline } from "./terrain.mjs";
import { makePath, nearest, fairwayHalfWidth, beyondShape } from "./course.mjs";

export const ROLLS = {
  // The undulations: how high (metres, up or down) and how long a swell
  // runs, with a smaller ripple on it.
  height: 0.55,
  swell: 30,
  ripple: 13,
  // The patches: how big (metres across) and how much of the hole rolls.
  patch: 110,
  share: 0.5,
  // Kept flat this far round the green, the tees, bunkers and water
  // (metres), fading in over `fade` more.
  clear: { green: 14, tee: 12, bunker: 5, water: 6 },
  fade: 10,
  // The grid it's worked out on, metres a cell, and how far past the
  // hole's own ground it goes.
  cell: 2,
  margin: 40,
  // Level again over the grid's last this-many metres.
  edge: 15,
};

// A links hole (hole.links) rolls more, and out past its fairway rises into
// real dunes (the owner, 10 October 2026: links ground "could have a
// significant graphics improvement"): hummocks and ridges with swales
// between them, growing from nothing at the corridor's edge (the fairway,
// or `corridor` metres either side of the line where there's no fairway)
// to their full height `rise` metres further out - so a ball kicks off
// them and runs down into the swales, and from the tee the line of play is
// never blocked. Faded to nothing over the grid's last `edge` metres, so the
// country round it meets it level.
export const LINKS_ROLLS = {
  fairway: { height: 0.8, swell: 26, ripple: 11, share: 0.85 },
  dunes: { height: 3.2, from: 5, rise: 24, ridge: 17, hummock: 38, swale: 0.45 },
  corridor: 14,
  margin: 70,
  // Links ground is firm: a rolling ball slows this much as fast as on a
  // parkland fairway (sim/courseplay.mjs, firmnessAt).
  firm: 0.8,
  edge: 25,
};

// Smooth value noise, -1 to 1, the same for the same seed.
function hash(ix, iz, seed) {
  let h = (ix * 374761393 + iz * 668265263 + seed * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export function noise(x, z, seed) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const u = fx * fx * (3 - 2 * fx);
  const v = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz, seed);
  const b = hash(ix + 1, iz, seed);
  const c = hash(ix, iz + 1, seed);
  const d = hash(ix + 1, iz + 1, seed);
  return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
}
const smooth = (t) => {
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
};

// How much a spot rolls (0 flat - 1 rolling): in the rolling patches, and
// clear of the green, tees, bunkers and water.
export function rollingAt(layout, x, z, seed, clear = () => clearAt(layout, x, z)) {
  const share = layout.links ? LINKS_ROLLS.fairway.share : ROLLS.share;
  const n = noise(x / ROLLS.patch, z / ROLLS.patch, seed + 7);
  // (share 0.5: the noise's middle; a little either way to the edge.)
  const patch = smooth((n - (1 - 2 * share) + 0.15) / 0.3);
  if (patch <= 0) return 0;
  return patch * clear();
}

// How far a spot is from the green, tees, bunkers and water, as 0 (on or
// by one) - 1 (clear of them all).
// (Asked of every spot of the rolls' grid, so nothing made for each: the
// same sums, in the same order, as ever.)
export function clearAt(layout, x, z) {
  let k = awayFrom(layout.green, ROLLS.clear.green, x, z);
  // The tees: the line's first point, then each tee spot.
  const first = layout.path?.[0];
  if (first) {
    k *= smooth((Math.hypot(x - first[0], z - first[1]) - ROLLS.clear.tee) / ROLLS.fade);
    if (k <= 0) return 0;
  }
  const spots = layout.teeSpots;
  if (spots) {
    for (let i = 0; i < spots.length; i++) {
      const t = spots[i].at;
      if (!t) continue;
      k *= smooth((Math.hypot(x - t[0], z - t[1]) - ROLLS.clear.tee) / ROLLS.fade);
      if (k <= 0) return 0;
    }
  }
  const bunkers = layout.bunkers;
  if (bunkers) {
    for (let i = 0; i < bunkers.length; i++) {
      k *= awayFrom(bunkers[i], ROLLS.clear.bunker, x, z);
      if (k <= 0) return 0;
    }
  }
  const water = layout.water;
  if (water) {
    for (let i = 0; i < water.length; i++) {
      k *= awayFrom(water[i], ROLLS.clear.water, x, z);
      if (k <= 0) return 0;
    }
  }
  return k;
}
// (Past the fade, fully clear: most of the hole, of most bunkers - not
// worked out round each edge, for every spot of the rolls' grid.)
function awayFrom(shape, clear, x, z) {
  return !shape || beyondShape(shape, x, z, clear + ROLLS.fade) ? 1 : smooth((-insideDepth(shape, x, z) - clear) / ROLLS.fade);
}

// The ground's rise at a spot (metres), before any grid. path: the hole's
// (makePath), for a links hole's dunes.
export function rollHeight(layout, x, z, seed, path = null) {
  const links = !!layout.links;
  const f = links ? LINKS_ROLLS.fairway : ROLLS;
  // (How clear of the green, tees, bunkers and water the spot is, worked
  // out once for the rolls and the dunes both - if either asks.)
  let clearAtSpot;
  const clear = () => (clearAtSpot ??= clearAt(layout, x, z));
  const k = rollingAt(layout, x, z, seed, clear);
  let h = 0;
  if (k > 0) {
    const swell = noise(x / f.swell, z / f.swell, seed);
    const ripple = noise(x / f.ripple, z / f.ripple, seed + 3);
    h = f.height * k * (0.75 * swell + 0.25 * ripple);
  }
  if (links && path) h += duneHeight(layout, x, z, seed, path, clear);
  return h;
}

// A links hole's dunes at a spot (metres): 0 in the corridor of play.
export function duneHeight(layout, x, z, seed, path, clearHere = () => clearAt(layout, x, z)) {
  const D = LINKS_ROLLS.dunes;
  const out = outsideCorridor(layout, x, z, path);
  const grow = smooth((out - D.from) / D.rise);
  if (grow <= 0) return 0;
  const clear = clearHere();
  if (clear <= 0) return 0;
  // Ridges (sharp crests, from folded noise), on broad hummocks, with
  // swales dipping between.
  const ridge = 1 - Math.abs(ridgeNoise(x, z, D.ridge, seed + 21));
  const hummock = noise(x / D.hummock, z / D.hummock, seed + 23);
  const shape = 0.55 * ridge * ridge + 0.45 * (hummock * 0.5 + 0.5) - D.swale * 0.5;
  return D.height * grow * clear * shape;
}

// The noise a dune's ridges are folded from (-1 to 1; a crest where it
// crosses 0), `scale` metres across. Value noise crosses its middle along
// its own grid, so folded on its own its crests ran in straight lines and
// right angles a scale apart - terraces from the air, the dunes' light and
// shade in steps. Two layers at odd angles to the grid and each other,
// their sum wandered by a slower noise, wind and branch as a dune ridge
// does.
const RIDGE_TURN = [0.61, 2.17];
export function ridgeNoise(x, z, scale, seed) {
  const slow = scale * 2.3;
  const wx = x + scale * 0.45 * noise(x / slow, z / slow, seed + 5);
  const wz = z + scale * 0.45 * noise(x / slow + 31.7, z / slow - 12.3, seed + 6);
  let n = 0;
  RIDGE_TURN.forEach((a, k) => {
    const c = Math.cos(a);
    const s = Math.sin(a);
    const sc = scale * (k ? 0.8 : 1);
    n += (k ? 0.4 : 0.6) * noise((wx * c - wz * s) / sc, (wx * s + wz * c) / sc, seed + k * 2);
  });
  // (Two layers' sum spreads less than one: back to the one's spread.)
  return Math.max(-1, Math.min(1, n / 0.72));
}

// How far a spot lies outside the corridor of play (metres; 0 or less in it).
export function outsideCorridor(layout, x, z, path) {
  const near = nearest(path, x, z);
  const half = layout.fairway ? Math.max(LINKS_ROLLS.corridor, fairwayHalfWidth(layout.fairway, near.s, Math.sign(near.d) || 1) + 4) : LINKS_ROLLS.corridor;
  return Math.abs(near.d) - half;
}

// How calm (1 level - 0 rolling as usual) the ground is at (x, z), from
// other holes' playing surfaces (polygons in this hole's frame): 1 on
// them, easing to 0 over CALM.soft metres past their edges.
export const CALM = { soft: 18 };
export function calmField(shapes, soft = CALM.soft) {
  const polys = shapes
    .filter((p) => p?.length >= 3)
    .map((p) => {
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
      for (const [x, z] of p) {
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
      }
      return { p, x0: x0 - soft, x1: x1 + soft, z0: z0 - soft, z1: z1 + soft, near: edgesBySoft(p, x0, x1, z0, z1, soft) };
    });
  // (Inside one: the walk round it by bands, terrain.mjs insideOutline.
  // How near its edge: only its edges within `soft` of the spot, those
  // further easing nothing - so the grid over a hole, every spot in the
  // box round another hole's fairway walking all of it, no longer held
  // the page for a few tenths of a second as the hole was made ready.)
  return (x, z) => {
    let best = 0;
    for (const { p, x0, x1, z0, z1, near } of polys) {
      if (x < x0 || x > x1 || z < z0 || z > z1) continue;
      if (insideOutline(p, x, z)) return 1;
      const i = Math.floor((x - near.x0) / soft);
      const k = Math.floor((z - near.z0) / soft);
      let d = Infinity;
      for (let a = Math.max(0, i - 1); a <= Math.min(near.nx - 1, i + 1); a++) {
        for (let b = Math.max(0, k - 1); b <= Math.min(near.nz - 1, k + 1); b++) {
          const cell = a * near.nz + b;
          for (let e = near.start[cell]; e < near.start[cell + 1]; e += 2) {
            const [ax, az] = p[near.edges[e + 1]];
            const [bx, bz] = p[near.edges[e]];
            const dx = bx - ax;
            const dz = bz - az;
            const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
            d = Math.min(d, Math.hypot(x - ax - dx * t, z - az - dz * t));
          }
        }
      }
      best = Math.max(best, 1 - smooth(d / soft));
    }
    return best;
  };
}
// A polygon's edges ([i, j] pairs: from p[j] to p[i]) by cell, `soft`
// metres square from its lowest x0, z0, each in every cell its box
// reaches: any edge within `soft` of a spot is in the spot's cell or one
// of the eight round it.
function edgesBySoft(p, x0, x1, z0, z1, soft) {
  const nx = Math.floor((x1 - x0) / soft) + 1;
  const nz = Math.floor((z1 - z0) / soft) + 1;
  const lists = Array.from({ length: nx * nz }, () => []);
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const a0 = Math.floor((Math.min(p[i][0], p[j][0]) - x0) / soft);
    const a1 = Math.floor((Math.max(p[i][0], p[j][0]) - x0) / soft);
    const b0 = Math.floor((Math.min(p[i][1], p[j][1]) - z0) / soft);
    const b1 = Math.floor((Math.max(p[i][1], p[j][1]) - z0) / soft);
    for (let a = a0; a <= a1; a++) for (let b = b0; b <= b1; b++) lists[a * nz + b].push(i, j);
  }
  const start = new Int32Array(nx * nz + 1);
  for (let c = 0; c < nx * nz; c++) start[c + 1] = start[c] + lists[c].length;
  return { x0, z0, nx, nz, start, edges: Int32Array.from(lists.flat()) };
}

// A hole's rolls: { height(x, z), gradient(x, z) -> [dh/dx, dh/dz] },
// worked out on a grid over the hole (its fairway's path, tee and green,
// and a margin round them) and read back smoothly; nothing outside it.
// null when the hole has no ground of its own to roll (no path).
export function holeRolls(layout, seed = 1, { calm = null } = {}) {
  const calmAt = calm?.length ? calmField(calm) : null;
  const pts = [...(layout.path ?? []), layout.green ? [layout.green.x, layout.green.z] : null].filter((p) => p && Number.isFinite(p[0]));
  if (pts.length < 2) return null;
  const m = layout.links ? Math.max(ROLLS.margin, (layout.treeLine ?? 40) + LINKS_ROLLS.margin) : ROLLS.margin;
  const path = layout.links ? makePath(layout.path) : null;
  const x0 = Math.min(...pts.map((p) => p[0])) - m;
  const z0 = Math.min(...pts.map((p) => p[1])) - m;
  const x1 = Math.max(...pts.map((p) => p[0])) + m;
  const z1 = Math.max(...pts.map((p) => p[1])) + m;
  const c = ROLLS.cell;
  const nx = Math.ceil((x1 - x0) / c) + 1;
  const nz = Math.ceil((z1 - z0) / c) + 1;
  const h = new Float32Array(nx * nz);
  let any = false;
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      let v = rollHeight(layout, x0 + i * c, z0 + j * c, seed, path);
      // Level again over the grid's last stretch, to meet the country
      // round it (drawn as a coarser sheet).
      if (v) v *= smooth((Math.min(i, j, nx - 1 - i, nz - 1 - j) * c) / (path ? LINKS_ROLLS.edge : ROLLS.edge));
      // Level under other holes' fairways, greens and tees: they lie on
      // their own shaped ground, as when they're played.
      if (v && calmAt) v *= 1 - calmAt(x0 + i * c, z0 + j * c);
      h[j * nx + i] = v;
      if (v) any = true;
    }
  }
  if (!any) return null;
  // Bilinear, and its slope from the same cell, fading to nothing at the
  // grid's edge (the margin is flat by then anyway).
  const cellAt = (x, z) => {
    const fx = (x - x0) / c;
    const fz = (z - z0) / c;
    if (fx < 0 || fz < 0 || fx >= nx - 1 || fz >= nz - 1) return null;
    const i = Math.floor(fx);
    const j = Math.floor(fz);
    const u = fx - i;
    const v = fz - j;
    const a = h[j * nx + i];
    const b = h[j * nx + i + 1];
    const d = h[(j + 1) * nx + i];
    const e = h[(j + 1) * nx + i + 1];
    return { a, b, d, e, u, v };
  };
  return {
    // Where it lies (the hole's frame): the ground beyond is level.
    bounds: { x0, z0, x1: x0 + (nx - 1) * c, z1: z0 + (nz - 1) * c },
    height(x, z) {
      const q = cellAt(x, z);
      if (!q) return 0;
      const { a, b, d, e, u, v } = q;
      return a + (b - a) * u + (d - a) * v + (a - b - d + e) * u * v;
    },
    gradient(x, z) {
      const q = cellAt(x, z);
      if (!q) return [0, 0];
      const { a, b, d, e, u, v } = q;
      return [((b - a) + (a - b - d + e) * v) / c, ((d - a) + (a - b - d + e) * u) / c];
    },
  };
}

// How firm the fairway is at a spot, as a multiplier on how quickly a ball
// rolling on it slows (1 as the round's setting has it): a little firmer on
// the crown of a swell, softer in a hollow, and varying a little from spot
// to spot - and firmer all round on a hot, dry day (dry 0 - 1). Only a
// course's own holes (with rolls) vary spot to spot: the Challenges, where
// every player must have the same ground, are even.
export function firmnessAt(rolls, x, z, seed = 1, dry = 0, links = false) {
  const rise = rolls ? rolls.height(x, z) / ROLLS.height : 0;
  const patchy = rolls ? noise(x / 55, z / 55, seed + 11) : 0;
  const k = 1 - 0.18 * Math.max(-1, Math.min(1, rise)) + 0.1 * patchy - 0.15 * Math.min(1, Math.max(0, dry));
  // (A links hole's ground firmer all over: LINKS_ROLLS.firm.)
  const base = links ? LINKS_ROLLS.firm : 1;
  return Math.min(1.3, Math.max(0.7 * base, k * base));
}

// A green's grain (sim/putting.mjs GRAIN): the way its blades lie, from the
// hole's seed - the same every time the hole's played - and only on the
// green itself, fading in over its last half metre.
// How strongly a green's grain shows (look/grass.js grain): lighter by this
// much looking straight down-grain, darker by as much looking into it.
export const GRAIN_LOOK = { sheen: 0.1 };

export function greenGrain(layout, seed = 1) {
  if (!layout.green) return null;
  const a = hash(seed, 17, 911) * Math.PI * 2;
  return {
    dir: [Math.cos(a), Math.sin(a)],
    at: (x, z) => smooth(insideDepth(layout.green, x, z) / 0.5),
  };
}

// Which way it runs, in words, from where the player stands looking along
// `aim` (radians, the hole's frame): "down-grain", "into the grain",
// "grain left to right", "grain right to left".
export function grainWords(grain, aim) {
  if (!grain) return "";
  const ax = Math.cos(aim);
  const az = Math.sin(aim);
  const along = grain.dir[0] * ax + grain.dir[1] * az;
  const across = grain.dir[0] * -az + grain.dir[1] * ax;
  if (Math.abs(along) >= Math.abs(across)) return along > 0 ? "down-grain - a touch quicker" : "into the grain - a touch slower";
  // (+ across: to the right of the line, the frame's +z being right.)
  return across > 0 ? "grain left to right" : "grain right to left";
}
