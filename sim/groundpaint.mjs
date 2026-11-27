// What a hole from a map is painted with, where (look/mappedground.js):
// its lie raster (sim/course.mjs lieRaster, half-metre cells) turned into a
// channel per surface, and the order the shader lays them one over another
// - the rough, the deep rough and woods, the first cut, the fairway, tees,
// the fringe, the green, then water's margin and sand.
//
// Each layer is drawn over the ones before with its own soft, noisy edge,
// so wherever two of them have their edges on the same line - the
// fairway's against the fringe, the fringe's against the green, the
// fringe's against the first cut round it - what's under both shows
// through. Under the mown ground that was the rough, with its dark clumps
// and flowers: a dark seam round every green, darker than the grass either
// side (the owner, 22 November 2026: "often see those little dark patches
// ... fairway needs to be seamless with the green"). So each mown layer
// carries on under the ones drawn over it (paintChannels): the fringe
// under the green, the first cut under the fairway, fringe, green and
// tees, and the fairway under the fringe, green and tees it runs into -
// for UNDER.fairway metres only, so a green or a tee out in the rough gets
// no fairway round it. Each edge is then the one drawn over it's own, crisp,
// with only grass of its own kind beneath. The fairway's ragged edge is as
// it was made, and opens onto first cut, not the rough: it pulls back up
// to a metre inside its cells where its noise is high, and the rough came
// through in flecks along every fairway's edge and at the shoulders of
// each approach.
//
// Water walled at its edge - a burn walled in stone through its turf, a
// pond's bulkhead (sim/walls.mjs) - has no muddy margin painted round it:
// the wall meets the turf (walledWater marks its cells; the margin's wide
// water channel leaves them out).
//
// Pure: the channels, their blur, and the shader's layering in numbers
// (layerShares, which test/groundpaint.test.mjs holds to the shader's own
// thresholds) to show what shows where.

import { smoothstep } from "./mathutil.mjs";
import { wallViews, wallAt } from "./walls.mjs";
import { insidePolygon } from "./terrain.mjs";
import { LIE_CODES } from "./course.mjs";

// How far (m) the fairway carries on under the mown ground it runs into
// (the fringe, the green and a tee): past the fringe (1.6 m) and the
// fairway channel's blur (BLUR.fairway), so it's whole under the fringe's
// edge.
export const UNDER = { fairway: 3.5 };

// Each channel's blur, metres each way (a box blur, as many cells): the
// fairway's wide for its ragged edge, the deep rough's and the woods'
// wider still; the rest a cell (CRISP), for crisp edges. wideSand and
// wideWater are copies of the sand and water blurred wider, for how far
// from the edge a spot is (damp sand at the lip, the collar round it, a
// muddy margin round water).
export const BLUR = { fairway: 1.5, deep: 3, woods: 2, wideSand: 1, wideWater: 1.5 };
export const CRISP = 1;

// The channels: which index holds which surface (look/mappedground.js
// packs them A = fairway, fringe, green, sand; B = tee, deep, water, woods;
// C = wide sand, wide water, first cut, and a spare).
export const CH = { fairway: 0, fringe: 1, green: 2, sand: 3, tee: 4, deep: 5, water: 6, woods: 7, semi: 8 };

// Box blur of one channel, `r` cells each way, in place.
export function blurChannel(ch, nx, nz, r) {
  if (r <= 0) return ch;
  const tmp = new Float32Array(ch.length);
  for (let z = 0; z < nz; z++) {
    let acc = 0;
    for (let x = -r; x <= r; x++) acc += ch[z * nx + Math.min(nx - 1, Math.max(0, x))];
    for (let x = 0; x < nx; x++) {
      tmp[z * nx + x] = acc / (2 * r + 1);
      acc += ch[z * nx + Math.min(nx - 1, x + r + 1)] - ch[z * nx + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < nx; x++) {
    let acc = 0;
    for (let z = -r; z <= r; z++) acc += tmp[Math.min(nz - 1, Math.max(0, z)) * nx + x];
    for (let z = 0; z < nz; z++) {
      ch[z * nx + x] = acc / (2 * r + 1);
      acc += tmp[Math.min(nz - 1, z + r + 1) * nx + x] - tmp[Math.max(0, z - r) * nx + x];
    }
  }
  return ch;
}

// A cell of water whose edge nearby is walled (walledWater): water, but
// with no margin painted round it. A code of its own, past LIE_CODES'
// in a raster's copy for painting only - play reads the raster as made.
export const WALLED = 255;

// The raster (sim/course.mjs lieRaster) for painting: each water cell
// whose nearest edge is walled (sim/walls.mjs wallAt: more than half a
// wall there) given WALLED, in a copy of its lies - or the raster itself
// where the hole has no walled water. layout: the hole's (its water).
export function walledWater(raster, layout) {
  const { nx, nz, cell } = raster;
  const water = LIE_CODES.indexOf("water");
  let lie = null;
  for (const w of layout?.water ?? []) {
    if (!w?.poly || !wallViews(w).length) continue;
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    for (const [x, z] of w.poly) {
      x0 = Math.min(x0, x);
      z0 = Math.min(z0, z);
      x1 = Math.max(x1, x);
      z1 = Math.max(z1, z);
    }
    const ix0 = Math.max(0, Math.ceil((x0 - raster.x0) / cell));
    const ix1 = Math.min(nx - 1, Math.floor((x1 - raster.x0) / cell));
    const iz0 = Math.max(0, Math.ceil((z0 - raster.z0) / cell));
    const iz1 = Math.min(nz - 1, Math.floor((z1 - raster.z0) / cell));
    for (let iz = iz0; iz <= iz1; iz++) {
      for (let ix = ix0; ix <= ix1; ix++) {
        const i = iz * nx + ix;
        if (raster.lie[i] !== water) continue;
        const x = raster.x0 + ix * cell;
        const z = raster.z0 + iz * cell;
        if (!insidePolygon(w.poly, x, z) || (wallAt(w, x, z)?.wn ?? 0) <= 0.5) continue;
        lie ??= Uint8Array.from(raster.lie);
        lie[i] = WALLED;
      }
    }
  }
  return lie ? { ...raster, lie } : raster;
}

// The raster's channels, before any blur: lie (one code a cell, as
// LIE_CODES numbers them, or WALLED), nx by nz cells of `cell` metres;
// codes: each lie's number by name. Returns nine Float32Arrays (CH), 1
// where the surface is, and where a mown surface carries on under one
// drawn over it (above) - and, as `walled` on the list, the cells of
// walled water (or null with none).
export function paintChannels(lie, nx, nz, cell, codes) {
  const n = nx * nz;
  const ch = Array.from({ length: 9 }, () => new Float32Array(n));
  const which = new Map([
    [codes.fairway, CH.fairway],
    [codes.fringe, CH.fringe],
    [codes.green, CH.green],
    [codes.bunker, CH.sand],
    [codes.greenside, CH.sand],
    // (A waste area - a heathland hole's put on hills - painted as sand.)
    [codes.waste, CH.sand],
    [codes.tee, CH.tee],
    [codes.deep, CH.deep],
    [codes.water, CH.water],
    [codes.trees, CH.woods],
    [codes.semi, CH.semi],
  ]);
  let walled = null;
  for (let i = 0; i < n; i++) {
    const k = which.get(lie[i]);
    if (k !== undefined) ch[k][i] = 1;
    else if (lie[i] === WALLED) {
      ch[CH.water][i] = 1;
      (walled ??= new Float32Array(n))[i] = 1;
    }
  }
  const isGreen = (l) => l === codes.green;
  const mownOver = (l) => l === codes.fringe || l === codes.green || l === codes.tee;
  for (let i = 0; i < n; i++) {
    const l = lie[i];
    // The fringe under the green; the first cut under the fairway, the
    // fringe, the green and tees.
    if (isGreen(l)) ch[CH.fringe][i] = 1;
    if (l === codes.fairway || mownOver(l)) ch[CH.semi][i] = 1;
  }
  // The fairway under the fringe, green and tees next to it: out from its
  // own cells, through theirs only, UNDER.fairway at most (eight ways
  // round, so it reaches as far on a slant).
  const most = Math.max(1, Math.round(UNDER.fairway / cell));
  const dist = new Int16Array(n).fill(-1);
  let front = [];
  for (let i = 0; i < n; i++) {
    if (lie[i] === codes.fairway) {
      dist[i] = 0;
      front.push(i);
    }
  }
  for (let step = 1; step <= most && front.length; step++) {
    const next = [];
    for (const i of front) {
      const x = i % nx;
      const z = (i - x) / nx;
      for (let dz = -1; dz <= 1; dz++) {
        const zz = z + dz;
        if (zz < 0 || zz >= nz) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if ((!dx && !dz) || xx < 0 || xx >= nx) continue;
          const j = zz * nx + xx;
          if (dist[j] >= 0 || !mownOver(lie[j])) continue;
          dist[j] = step;
          ch[CH.fairway][j] = 1;
          next.push(j);
        }
      }
    }
    front = next;
  }
  ch.walled = walled;
  return ch;
}

// The channels blurred as the shader reads them (in place), and the two
// wide copies: returns { ch, wideSand, wideWater }. (The wide water - the
// muddy margin's - from the water that isn't walled: ch.walled.)
export function blurChannels(ch, nx, nz, cell) {
  const cells = (m) => Math.round(m / cell);
  const wideSand = blurChannel(Float32Array.from(ch[CH.sand]), nx, nz, cells(BLUR.wideSand));
  const open = ch.walled ? ch[CH.water].map((v, i) => v * (1 - ch.walled[i])) : ch[CH.water];
  const wideWater = blurChannel(Float32Array.from(open), nx, nz, cells(BLUR.wideWater));
  blurChannel(ch[CH.fairway], nx, nz, cells(BLUR.fairway));
  blurChannel(ch[CH.deep], nx, nz, cells(BLUR.deep));
  blurChannel(ch[CH.woods], nx, nz, cells(BLUR.woods));
  for (const k of [CH.fringe, CH.green, CH.sand, CH.tee, CH.water, CH.semi]) blurChannel(ch[k], nx, nz, CRISP);
  return { ch, wideSand, wideWater };
}

// How much of each grass shows at a spot, laid as the shader lays them
// (look/mappedground.js, its map_fragment), from the channels there (0 -
// 1, as sampled) and the shader's two noises n1, n2 (0 - 1): { rough,
// semi, fairway, tee, fringe, green } summing to 1. Sand, water's margin
// and the woods aren't in it (it's for the mown grass's edges). The
// thresholds are the shader's own (the test reads them out of it).
export function layerShares({ fairway = 0, fringe = 0, green = 0, tee = 0, semi = 0 }, n1, n2) {
  const share = { rough: 1, semi: 0, fairway: 0, tee: 0, fringe: 0, green: 0 };
  const over = (name, a) => {
    for (const k of Object.keys(share)) share[k] *= 1 - a;
    share[name] += a;
  };
  over("semi", smoothstep(0.3, 0.55, semi + (n1 - 0.5) * 0.3));
  const cut = 0.35 + 0.25 * n1 + 0.1 * n2;
  over("fairway", smoothstep(cut - 0.08, cut + 0.08, fairway));
  const jig = (n2 - 0.5) * 0.08;
  over("tee", smoothstep(0.4, 0.6, tee + jig));
  over("fringe", smoothstep(0.4, 0.6, fringe + jig));
  over("green", smoothstep(0.45, 0.55, green + jig * 0.5));
  return share;
}
