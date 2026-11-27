// A links hole's heather and gorse in belts (the course round, 23 November
// 2026 - what Saltpine Links has: tools/madeland/land.mjs LAND.heather,
// LAND.gorse). On a links hole the course maker makes from its second
// round on (sim/maker.mjs), the rough's dressing (sim/dressing.mjs) lays
//   - its heather nearer: patches between the mown ground and the dunes,
//     25 - 46 m off the line of play, their edges ragged;
//   - its gorse further out: broken belts along the dunes, 36 - 78 m off
//     the line - thick in places and gone in others (a patchiness some
//     55 m across, as Saltpine's), a hundred or so bushes a hole at most;
// where every other hole has both anywhere in its rough (on Sea Links the
// heather stood mostly past 46 m, its gorse a dozen or so bushes a hole at
// the heather's edges - nearer the line than the heather, not beyond it).
// Measured from the hole's line: past the green as well, not behind the
// tee. Each from a randomness of its own (the hole's dressing seed,
// salted), so a hole's belts are the same every time. Look only, as all
// the dressing is: nothing here changes how a ball plays.
//
// Pure, in the hole's frame (sim/course.mjs: the tee at (0, 0), x down the
// hole, z to the right, metres).

import { makePath, nearest, pointAt, seeded } from "./course.mjs";
import { hash2, valueNoise } from "./country.mjs";
import { madeSince } from "./maker.mjs";

export const LINKS_BELTS = {
  // Heather patches' middles this far off the line (metres), and its
  // clumps no more than `ragged` past either edge.
  heather: { from: 25, to: 46, ragged: 3 },
  // Gorse: a bush every `grid` metres where it grows, from `from` metres
  // off the line to `to`; where the patchiness (0 - 1, about one patch
  // each `patch` metres) is under `least`, none. At most `most` a hole.
  gorse: { grid: 7.5, from: 36, to: 78, patch: 55, least: 0.3, most: 120 },
  // None more than this far behind the tee (metres).
  behind: 10,
};

// Whether a hole's heather and gorse are laid in belts.
export const beltsFor = (L) => !!L?.links && madeSince(L) && Array.isArray(L.path) && L.path.length >= 2;

// The belts of hole L, from its dressing's seed: { rand (the heather's and
// gorse's own randomness), off(x, z) (metres off the line, or Infinity
// behind the tee), spot(band) (a patch's middle in a band), within(band,
// x, z, give), gorse() (the gorse's spots, [[x, z]...], in the order
// they're tried) }.
export function linksBelt(L, seed = 1) {
  const path = makePath(L.path);
  const len = path.length;
  const start = pointAt(path, 0);
  const rand = seeded((seed ^ 0xbe175) >>> 0 || 1);
  const off = (x, z) => {
    const n = nearest(path, x, z);
    // (Behind the tee: not where it's measured from.)
    if (n.s <= 0 && (x - start.p[0]) * start.dir[0] + (z - start.p[1]) * start.dir[1] < -LINKS_BELTS.behind) return Infinity;
    return Math.abs(n.d);
  };
  const within = (band, x, z, give = 0) => {
    const d = off(x, z);
    return d >= band.from - give && d <= band.to + give;
  };
  // A patch's middle: along the line (a little past the green), to one
  // side or the other, as far off it as the band says.
  const spot = (band) => {
    const s = rand() * (len + 20);
    const side = rand() < 0.5 ? -1 : 1;
    const d = band.from + rand() * (band.to - band.from);
    const q = pointAt(path, Math.min(len, s));
    const past = Math.max(0, s - len);
    return [q.p[0] - q.dir[1] * side * d + q.dir[0] * past, q.p[1] + q.dir[0] * side * d + q.dir[1] * past];
  };
  const gorse = () => {
    const G = LINKS_BELTS.gorse;
    const xs = L.path.map((p) => p[0]);
    const zs = L.path.map((p) => p[1]);
    const x0 = Math.min(...xs) - G.to;
    const x1 = Math.max(...xs) + G.to;
    const z0 = Math.min(...zs) - G.to;
    const z1 = Math.max(...zs) + G.to;
    const k = (seed ^ 0x60e5e) >>> 0;
    const out = [];
    for (let j = 0; z0 + j * G.grid < z1; j++) {
      for (let i = 0; x0 + i * G.grid < x1; i++) {
        const x = x0 + (i + 0.5) * G.grid + (hash2(i, j, k) - 0.5) * G.grid * 0.8;
        const z = z0 + (j + 0.5) * G.grid + (hash2(i, j, k + 1) - 0.5) * G.grid * 0.8;
        if (!within(G, x, z)) continue;
        const patch = valueNoise(x, z, G.patch, k + 2);
        if (patch < G.least || hash2(i, j, k + 3) > (patch - G.least) * 2.2 + 0.25) continue;
        out.push([x, z, hash2(i, j, k + 4)]);
      }
    }
    // (Tried in no order along the hole, so where there are more spots
    // than bushes the belts are thinned all along, not cut off.)
    return out.sort((a, b) => a[2] - b[2]).map(([x, z]) => [x, z]);
  };
  return { rand, off, spot, within, gorse };
}
