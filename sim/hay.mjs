// Hay: a third length of grass past the rough and the long grass (the
// owner, 23 October 2026: "Long long grass definitely in links golf. But at
// times on other areas. Another length of grass will help the visuals") -
// waist-high, gone to seed, paler and blowing more than the long grass, and
// where nobody means to play: on a links hole out past where a ball in the
// long grass is lost (sim/courseplay.mjs: the tree line and 18 m more),
// its edge wandering; on a parkland hole now and then, in drifts in the
// deep rough, thickest by the trees, on some holes and not others.
// It plays as the deep rough it grows in: only its look is its own - the
// tufts (sim/holetufts.mjs), the long grass round the ball (sim/
// longgrass.mjs), their colour (look/groundbits.js code HAY.code).

import { nearest, makePath, deepRoughFrom } from "./course.mjs";
import { lineNoise } from "./woods.mjs";
import { valueNoise } from "./country.mjs";

export const HAY = {
  // Its tufts' and clumps' colour code (look/groundbits.js TUFT_GROUND).
  code: 9,
  // Links: how far past the tree line it starts (the lost ball's line),
  // and how far its edge wanders either way.
  links: { from: 18, wander: 4 },
  // Parkland: the share of holes with any; how far in from the tree line
  // it may reach, in drifts about `drift` metres across, more of them the
  // nearer the trees; and over what length the stretches with any come
  // and go along the hole (metres).
  parkland: { share: 0.5, depth: 11, drift: 9, along: 70, stretch: 0.42 },
  // Its tufts' height (sim/tufts.mjs TUFT_FIELD.height's third), and how
  // thick they stand, as a share of the long grass's.
  thick: 0.85,
  // On a parkland hole, the ground under it painted its straw (paintHay):
  // how much over the deep rough's green, and how many looks a pixel of
  // the country picture takes (a side), so a drift's edge is soft.
  ground: { strength: 0.8, looks: 2 },
};

// Does hay grow at (x, z) on hole L (its own frame) - given the deep rough
// (or a links hole's long grass) is there? path: makePath(L.path).
export function hayAt(L, x, z, path = makePath(L.path)) {
  if (!L?.path?.length || !Number.isFinite(L.treeLine) || L.source === "map") return false;
  const n = nearest(path, x, z);
  const off = Math.abs(n.d);
  const side = n.d < 0 ? 0 : 1;
  const seed = Math.round((L.fairway?.phase ?? 1) * 1e5) % 100003;
  const band = L.bandScale ?? 1;
  if (L.links) {
    const edge = L.treeLine + (HAY.links.from + HAY.links.wander * (2 * lineNoise(n.s / 25 + side * 50, seed + 31) - 1)) * band;
    return off > edge;
  }
  // (Some parkland holes have none.)
  if (lineNoise(seed * 0.001, 977) >= HAY.parkland.share) return false;
  const P = HAY.parkland;
  const depth = P.depth * band;
  // (Its outer edge short of the tree line's straight one, raggedly.)
  if (off > L.treeLine - 3 * band * valueNoise(x, z, 6, seed + 67) || off < L.treeLine - depth) return false;
  if (lineNoise(n.s / P.along + side * 40, seed + 53) <= P.stretch) return false;
  // Drifts, their edges ragged and feathered (a finer wobble a metre or
  // so across, so tufts of each mix along it), more of them by the trees.
  const near = (off - (L.treeLine - depth)) / depth;
  const drift = 0.7 * valueNoise(x, z, P.drift, seed + 71) + 0.3 * valueNoise(x, z, P.drift / 3, seed + 73) + 0.12 * (valueNoise(x, z, 1.1, seed + 79) - 0.5);
  return drift > 0.66 - 0.18 * near;
}

// The ground under a parkland hole's hay painted its straw, into the
// hole's country picture (sim/countryparts.mjs) - the owner, 29 October
// 2026, of the hay drawing in as the camera came towards it: "I think we
// should do the floor colouring anyway ... makes sense long term". Laid
// over the deep rough's green (and under the tufts, which take the
// picture's colour too) by the ground's shader, WebGL's and WebGPU's
// alike (look/glsl/ground.js gCountry), so a drift reads as straw however
// few of its tufts are drawn. A links hole's long grass is straw already,
// and a hole from a map has none (hayAt). pixels: the picture (n x n,
// RGBA, premultiplied, linear; rows along world z) over box { x0, z0, size }
// (world metres); colour: linear [r, g, b]. Returns how many pixels it
// painted.
export function paintHay(pixels, { box, n, L, colour, strength = HAY.ground.strength, looks = HAY.ground.looks }) {
  if (L?.links || L?.source === "map" || !L?.path?.length || !Number.isFinite(L.treeLine)) return 0;
  const path = makePath(L.path);
  const cell = box.size / n;
  // Only over the hole and its trees (hole frame [x, z] -> world [z, -x]).
  const out = L.treeLine + 4;
  let wx0 = Infinity, wx1 = -Infinity, wz0 = Infinity, wz1 = -Infinity;
  for (const [x, z] of L.path) {
    wx0 = Math.min(wx0, z - out); wx1 = Math.max(wx1, z + out);
    wz0 = Math.min(wz0, -x - out); wz1 = Math.max(wz1, -x + out);
  }
  const c0 = Math.max(0, Math.floor((wx0 - box.x0) / cell));
  const c1 = Math.min(n - 1, Math.ceil((wx1 - box.x0) / cell));
  const r0 = Math.max(0, Math.floor((wz0 - box.z0) / cell));
  const r1 = Math.min(n - 1, Math.ceil((wz1 - box.z0) / cell));
  // (None on some holes; and only in from the tree line, so a pixel whose
  // middle is well clear of that is passed over.)
  const seed = Math.round((L.fairway?.phase ?? 1) * 1e5) % 100003;
  if (lineNoise(seed * 0.001, 977) >= HAY.parkland.share) return 0;
  const band = L.bandScale ?? 1;
  const inner = L.treeLine - HAY.parkland.depth * band - cell;
  const outer = L.treeLine + cell;
  // Hay where it grows in the deep rough (as it plays: sim/course.mjs
  // surfaceAt), the world spot (wx, wz).
  const hay = (wx, wz) => {
    const x = -wz;
    const z = wx;
    if (!hayAt(L, x, z, path)) return false;
    const p = nearest(path, x, z);
    return Math.abs(p.d) > deepRoughFrom(L, Math.min(Math.max(p.s, 0), path.length), p.d < 0 ? -1 : 1);
  };
  let painted = 0;
  for (let row = r0; row <= r1; row++) {
    for (let col = c0; col <= c1; col++) {
      const off = Math.abs(nearest(path, -(box.z0 + (row + 0.5) * cell), box.x0 + (col + 0.5) * cell).d);
      if (off < inner || off > outer) continue;
      let k = 0;
      for (let j = 0; j < looks; j++) {
        for (let i = 0; i < looks; i++) if (hay(box.x0 + (col + (i + 0.5) / looks) * cell, box.z0 + (row + (j + 0.5) / looks) * cell)) k++;
      }
      if (!k) continue;
      const a = (strength * k) / (looks * looks);
      const at = (row * n + col) * 4;
      // Over what's there (premultiplied).
      for (let ch = 0; ch < 3; ch++) pixels[at + ch] = Math.round(colour[ch] * a * 255 + pixels[at + ch] * (1 - a));
      pixels[at + 3] = Math.round(a * 255 + pixels[at + 3] * (1 - a));
      painted++;
    }
  }
  return painted;
}
