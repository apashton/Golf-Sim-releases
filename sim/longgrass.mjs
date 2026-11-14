// Long grass (the owner, 9 October 2026: "long grass is a must"): real
// blades over the rough, the deep rough and a links hole's long grass,
// round where the ball lies. It's grown as each shot is set up, with the
// grass round the ball (look/lienest.js), and stays as it is through the
// shot - nothing changes while it's watched. High grows a lighter field,
// Ultra the full one, further out. look/longgrass.js draws it; course.js
// grows it. Pure: where the clumps go.

import { gapToPaths } from "./paths.mjs";
import { grassPathRoom, grassStand, byTee, TALL_GRASS, TUFT_PATH_GAP, TUFT_TEE_GAP, GRASS_PATH_FADE } from "./tufts.mjs";

export const LONG_GRASS = {
  // How far out it grows, metres.
  radius: { high: 20, ultra: 32 },
  // Within `full` metres of the ball every square metre has its full
  // count; beyond, it thins as the square of the distance - each clump
  // smaller in the picture, so the grass looks as thick all the way out -
  // and fades away over the last quarter of the radius, so it has no edge.
  full: 6,
  // Each kind of ground it grows in, by the tufts' colour codes (look/
  // groundbits.js TUFT_GROUND): clumps a square metre where it's full
  // (Ultra's; High grows `highShare` of them), how tall a clump stands,
  // metres, and its mix of clump shapes (VARIANTS, by share) - the rough's
  // and deep rough's as tall as the grass round the ball's (NEST.height); a
  // links hole's long grass much longer (the owner: "much longer for links
  // areas"), knee-high fescue and marram in seed, thinner on the ground
  // as each clump is so much bigger.
  kinds: {
    0: { name: "rough", perM2: 36, h: 0.09, mix: [0.55, 0.25, 0.2, 0] },
    1: { name: "deep", perM2: 52, h: 0.18, mix: [0.35, 0.35, 0.3, 0] },
    2: { name: "fescue", perM2: 26, h: 0.75, mix: [0.15, 0.35, 0.2, 0.3] },
    3: { name: "dune rough", perM2: 34, h: 0.14, mix: [0.45, 0.3, 0.25, 0] },
    4: { name: "long green", perM2: 32, h: 0.45, mix: [0.25, 0.4, 0.2, 0.15] },
    // Hay (sim/hay.mjs): waist-high, gone to seed, thinner.
    9: { name: "hay", perM2: 18, h: 1.05, mix: [0.1, 0.3, 0.2, 0.4] },
  },
  highShare: 0.5,
  // None within this of a fringe or green: it stops at a clean line, at
  // its full count right up to it (the owner, 19 October 2026: "the line
  // between long grass and short grass can be clean"; on a designed hole
  // the green's surround of first cut lies between: sim/course.mjs
  // SURROUND), not thinning out over a couple of metres as it did.
  clear: 0.35,
  // The lies are read on a grid this many metres a cell, and exactly
  // where a cell borders another kind of ground.
  cell: 1,
  // The most clumps a field may have, whatever the ground.
  most: 60000,
  // The row along the mower's line: about this far apart where it's full,
  // each this far into the rough (metres).
  edge: { every: 0.12, inset: [0.02, 0.15] },
};

// Seen from further off - from the air above all, a flyover or a drive
// followed up - a clump's own light and dark (darker at its foot, lighter
// at its tips) eases into a flat `lift` times the ground's colour, from
// `from` to `to` metres away, by at most `most`, as a tuft's does (sim/
// tufts.mjs TUFT_BLEND): from the air the long grass round the ball read
// as a darker ring (the owner, 18 October 2026: "when the ball is in the
// air we don't see a different colour in-between grass"). Eased as much
// by how high the camera is above it, `up` metres (a links hole's tall
// grass looked down on from 20 m showed its light tips). Its lift under
// 1: a clump is lit as level ground, where the ground under it slopes (a
// links hole's dunes) and its blades shade it - set so that from the air
// it measures as the ground between (Links by the Sea's 9th and Golf Sim
// Links' 3rd on Ultra). And with the camera high above it, fewer clumps,
// as the tufts (heightShare): each clump shrinking away by its own
// random, never at once.
export const LONG_BLEND = { from: 12, to: 60, up: [4, 20], lift: 0.82, most: 0.85 };

// The clump shapes (look/longgrass.js draws them): straight fine blades,
// wider blades arching out, a tussock of short blades with a few tall, and
// stalks in seed among a few leaves.
export const VARIANTS = ["fine", "arched", "tussock", "seed"];

// Which shape a clump is, from a random number and its kind's mix.
export function variantOf(mix, r) {
  let sum = 0;
  for (let v = 0; v < mix.length; v++) {
    sum += mix[v];
    if (r < sum) return v;
  }
  return 0;
}

// Lies it grows in, and those it thins out before.
const GROWS = { rough: "rough", deep: "deep" };
const THIN = new Set(["fringe", "green"]);
// Round a clump by a fringe or green: where it's looked at, `clear` off.
const NEAR = Array.from({ length: 6 }, (_, i) => [Math.cos((i * Math.PI) / 3) * LONG_GRASS.clear, Math.sin((i * Math.PI) / 3) * LONG_GRASS.clear]);

import { smoothstep } from "./mathutil.mjs";
import { alongLine } from "./mowncut.mjs";

// How thick it grows at d metres from the ball, as a share of full: full
// near the ball, thinning with the square of the distance, faded away
// over the last quarter of `radius`.
export function thickness(d, radius) {
  const near = d <= LONG_GRASS.full ? 1 : (LONG_GRASS.full / d) ** 2;
  return near * Math.min(1, Math.max(0, (radius - d) / (radius * 0.25)));
}

// A little deterministic randomness (the same field for the same spot).
function random(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The clumps round the ball. centre: the ball, [x, z] in lieAt's frame;
// lieAt(x, z): the lie there; codes: the colour code the rough and the
// deep rough grow in ({ rough, deep }: a links hole's own, course.js);
// setting: "high" or "ultra"; nest: the radius of the grass round the
// ball when there is some (the ball lies in grass: look/lienest.js) - the
// field fades in over the stretch where that fades out (from 60% of its
// radius to all of it), so the two meet without a seam, and the grass by
// the ball stays the nest's, kept low enough for the ball to show.
// paths: the hole's cart paths, its own and those between holes (the
// layout's, as played: sim/linkpaths.mjs withLinks) - none grows within a
// metre of one's edge (a links hole's tall grass 1.75 m), thickening back
// up beyond (sim/tufts.mjs grassPathRoom), so no blade stands on or leans
// over a path: a lie check at each clump let them stand at the kerb.
// Returns { clumps: [{ x, z, h, code, turn, v, shade }], high } - High's
// clumps first, then Ultra's more; high: how many are High's (on High,
// all). v: its shape (VARIANTS); shade: a touch lighter or darker than the
// ground it grows from (0.85 - 1.15).
// edge: the hole's mower's line ({ field, line }: sim/mowncut.mjs
// mownField, mownLine) - a row of clumps along it, just into the rough,
// so the long grass stands right up to every edge a mower makes, cut off
// there in a neat line (look/cutline.js).
// hay(x, z): whether hay grows there, in the deep rough (sim/hay.mjs) -
// codes.hay its clumps then.
export function longGrassClumps({ centre, lieAt, codes = { rough: 0, deep: 1 }, setting = "ultra", nest = 0, seed = 1, paths = null, edge = null, hay = null }) {
  const R = LONG_GRASS.radius[setting] ?? LONG_GRASS.radius.high;
  const ultra = setting === "ultra";
  const [bx, bz] = centre;
  const { cell, clear } = LONG_GRASS;
  const n = Math.ceil((R + clear) / cell) + 1;
  const side = 2 * n + 1;
  // Each cell: the code it grows (-1: nothing), or -2 where it thins
  // before (a fringe or green), -3 on the tee (none within TUFT_TEE_GAP of
  // it, as the tufts: sim/tufts.mjs byTee).
  const grid = new Int8Array(side * side);
  const codeOf = (lie, x, z) => (lie === GROWS.rough ? codes.rough : lie === GROWS.deep ? (hay?.(x, z) ? (codes.hay ?? 9) : codes.deep) : THIN.has(lie) ? -2 : lie === "tee" ? -3 : -1);
  for (let i = 0; i < side; i++) {
    for (let j = 0; j < side; j++) {
      const x = bx + (i - n) * cell;
      const z = bz + (j - n) * cell;
      grid[i * side + j] = codeOf(lieAt(x, z), x, z);
    }
  }
  const at = (i, j) => (i < 0 || j < 0 || i >= side || j >= side ? -1 : grid[i * side + j]);
  const reach = Math.ceil(clear / cell) + 1;
  // (And as far as a tee could be from a clump within the gap of it.)
  const teeReach = Math.max(reach, Math.ceil(TUFT_TEE_GAP / cell) + 2);
  // A cell further than this from every path's edge needs no clump in it
  // checked against them.
  const byPaths = paths?.length ? TUFT_PATH_GAP.tall + GRASS_PATH_FADE + cell : 0;
  const pathGapFor = (tall) => (tall ? TUFT_PATH_GAP.tall : TUFT_PATH_GAP.tuft) + GRASS_PATH_FADE;
  const rand = random(seed);
  const high = [];
  const more = [];
  for (let i = 0; i < side; i++) {
    for (let j = 0; j < side; j++) {
      const code = grid[i * side + j];
      if (code < 0) continue;
      const cx = bx + (i - n) * cell;
      const cz = bz + (j - n) * cell;
      const d0 = Math.hypot(cx - bx, cz - bz);
      if (d0 > R + cell) continue;
      // How far to a fringe or green, and whether every neighbour grows
      // the same (else each clump's lie is read where it stands).
      let thin = Infinity;
      let tee = Infinity;
      let edge = false;
      for (let di = -teeReach; di <= teeReach; di++) {
        for (let dj = -teeReach; dj <= teeReach; dj++) {
          const c = at(i + di, j + dj);
          if (c === -3) tee = Math.min(tee, Math.hypot(di, dj) * cell);
          if (Math.abs(di) > reach || Math.abs(dj) > reach) continue;
          if (c === -2) thin = Math.min(thin, Math.hypot(di, dj) * cell);
          if (Math.abs(di) <= 1 && Math.abs(dj) <= 1 && c !== code) edge = true;
        }
      }
      const kind = LONG_GRASS.kinds[code] ?? LONG_GRASS.kinds[0];
      const field = thickness(d0, ultra ? R : LONG_GRASS.radius.ultra);
      const expect = kind.perM2 * cell * cell * field;
      const count = Math.floor(expect + rand());
      // How far the cell's middle is from a path's edge (Infinity: further
      // than any clump in it needs to know).
      const pathGap = byPaths > 0 && count > 0 ? gapToPaths(paths, cx, cz, byPaths) : Infinity;
      for (let k = 0; k < count; k++) {
        const x = cx + (rand() - 0.5) * cell;
        const z = cz + (rand() - 0.5) * cell;
        const keep = rand();
        const size = 0.7 + rand() * 0.5;
        const turn = rand() * Math.PI * 2;
        const pick = rand();
        const shade = 0.85 + rand() * 0.3;
        const d = Math.hypot(x - bx, z - bz);
        // With grass round the ball, this takes over where that thins out.
        if (nest > 0 && rand() > smoothstep(nest * 0.6, nest, d)) continue;
        let c = code;
        if (edge) {
          c = codeOf(lieAt(x, z), x, z);
          if (c < 0) continue;
        }
        // By a fringe or green, none within a hand's breadth of it, the
        // cells being coarser than that.
        if (thin < clear + cell && NEAR.some(([dx, dz]) => codeOf(lieAt(x + dx, z + dz)) === -2)) continue;
        // Off the tee: not in a sliver of rough between two of its boxes,
        // nor on the soft edge each is drawn with.
        if (tee < TUFT_TEE_GAP + 2 * cell && byTee(lieAt, x, z)) continue;
        const k = LONG_GRASS.kinds[c] ?? kind;
        // Off the cart paths: none by the kerb, thickening back up beyond
        // (looked at only where the cell's middle says it might be near).
        const tall = k.h > TALL_GRASS;
        if (pathGap - Math.hypot(x - cx, z - cz) < pathGapFor(tall)) {
          const share = grassPathRoom(paths, x, z, tall);
          if (share <= 0 || (share < 1 && rand() >= share)) continue;
        }
        // Taller and shorter in stands, as the tufts are (sim/tufts.mjs
        // grassStand: world x, z from the hole's).
        const h = k.h * size * grassStand(z, -x);
        const v = variantOf(k.mix, pick);
        // High's share: half of them, faded out over the last quarter of
        // High's own radius.
        const isHigh = keep < LONG_GRASS.highShare * Math.min(1, Math.max(0, (LONG_GRASS.radius.high - d) / (LONG_GRASS.radius.high * 0.25)));
        if (isHigh) high.push({ x, z, h, code: c, turn, v, shade });
        else if (ultra) more.push({ x, z, h, code: c, turn, v, shade });
      }
    }
  }
  // The row along the mower's line: thinning with distance as the rest,
  // off the paths, and leaving the grass by the ball to the nest's.
  if (edge?.line?.length) {
    for (const [x, z] of alongLine(edge.line, edge.field, { every: LONG_GRASS.edge.every, inset: LONG_GRASS.edge.inset, rand, near: [bx, bz, R] })) {
      const d = Math.hypot(x - bx, z - bz);
      if (rand() > thickness(d, ultra ? R : LONG_GRASS.radius.ultra)) continue;
      if (nest > 0 && rand() > smoothstep(nest * 0.6, nest, d)) continue;
      const c = codeOf(lieAt(x, z), x, z);
      if (c < 0) continue;
      const k = LONG_GRASS.kinds[c] ?? LONG_GRASS.kinds[0];
      const tall = k.h > TALL_GRASS;
      if (paths?.length) {
        const share = grassPathRoom(paths, x, z, tall);
        if (share <= 0 || (share < 1 && rand() >= share)) continue;
      }
      const keep = rand();
      const size = 0.7 + rand() * 0.5;
      const turn = rand() * Math.PI * 2;
      const v = variantOf(k.mix, rand());
      const shade = 0.85 + rand() * 0.3;
      const h = k.h * size * grassStand(z, -x);
      const isHigh = keep < LONG_GRASS.highShare * Math.min(1, Math.max(0, (LONG_GRASS.radius.high - d) / (LONG_GRASS.radius.high * 0.25)));
      if (isHigh) high.push({ x, z, h, code: c, turn, v, shade });
      else if (ultra) more.push({ x, z, h, code: c, turn, v, shade });
    }
  }
  const clumps = [...high, ...more].slice(0, LONG_GRASS.most);
  return { clumps, high: Math.min(high.length, clumps.length) };
}
