// Grass across the hole, on Ultra (the owner, 9 October 2026: "looking for a
// significant leap up from high"): real blades on every kind of grass in
// sight - fairway, first cut, tee, fringe, rough - not only round the ball.
// Grown as each shot is set up, round the ball and round where the shot is
// likely to land (so the camera that follows the ball down finds grass
// there too), and it stays as it is through the shot: nothing changes
// while it's watched. Short grass is short (a fairway's blades a couple of
// centimetres) and only near enough to see; the rough's and the deep
// rough's go further out. Around the ball the long grass (sim/longgrass.mjs)
// already grows the rough and the deep rough: this grows them only past it,
// fading in where that fades out. Pure: where the clumps go; look/
// longgrass.js draws them with the long grass's blades.

import { withOtherGround } from "./holetufts.mjs";
import { LONG_GRASS, variantOf } from "./longgrass.mjs";
import { drawnLift } from "./lifts.mjs";
import { grassPathRoom, TALL_GRASS, TUFT_PATH_GAP, GRASS_PATH_FADE } from "./tufts.mjs";
import { gapToPaths } from "./paths.mjs";
import { holeSite, holeProbe } from "./holesite.mjs";

export const HOLE_GRASS = {
  // How far out it grows round the ball and round the landing, metres.
  ball: 60,
  landing: 45,
  // The grass kinds it grows, by lie: its colour code (look/groundbits.js
  // TUFT_GROUND: 5 fairway, 6 first cut, 7 fringe, 8 tee - the fairway's
  // and the tee's each in its mowing stripe's shade; the rough's own), clumps
  // a square metre where it's full, how tall, the clump shapes' mix, and
  // how far from a centre it's worth growing (blades a couple of
  // centimetres tall vanish into the ground's own texture past it).
  kinds: {
    fairway: { code: 5, perM2: 44, h: 0.03, mix: [1, 0, 0, 0], reach: 30 },
    tee: { code: 8, perM2: 44, h: 0.025, mix: [1, 0, 0, 0], reach: 30 },
    semi: { code: 6, perM2: 40, h: 0.055, mix: [0.8, 0.2, 0, 0], reach: 40 },
    fringe: { code: 7, perM2: 36, h: 0.02, mix: [1, 0, 0, 0], reach: 25 },
  },
  // The rough's own (from the long grass's kinds), as far as a centre's
  // radius - but round the ball only past the long grass's reach.
  roughLies: ["rough", "deep", "trees"],
  // Where every square metre has its full count, metres from a centre.
  full: 18,
  // The lie is read on a grid this many metres a cell, and where each clump
  // stands if the cell borders other ground.
  cell: 1,
  // The most clumps it may grow in all.
  most: 160000,
};

const AROUND = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

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

// How full it grows d metres from a centre reaching r: full near it,
// thinning as the square of the distance (each clump smaller in the
// picture, so it looks as thick all the way out), faded away over the last
// quarter of the reach so it has no edge.
export function fullness(d, r) {
  const near = d <= HOLE_GRASS.full ? 1 : (HOLE_GRASS.full / d) ** 2;
  return near * Math.min(1, Math.max(0, (r - d) / (r * 0.25)));
}

// What grows at a lie: { code, perM2, h, mix, reach, rough } or null.
//   codes: the colour codes of the rough and the deep rough ({ rough, deep }:
//   a links hole's own, as the long grass's).
function kindAt(lie, codes) {
  const k = HOLE_GRASS.kinds[lie];
  if (k) return { ...k, rough: false };
  if (!HOLE_GRASS.roughLies.includes(lie)) return null;
  const code = lie === "deep" ? codes.deep : codes.rough;
  const r = LONG_GRASS.kinds[code] ?? LONG_GRASS.kinds[0];
  return { code, perM2: r.perM2, h: r.h, mix: r.mix, reach: Infinity, rough: true };
}

// The clumps. centres: [{ x, z, r, ball }] - round the ball (ball: true) and
// round the landing, in lieAt's frame; lieAt(x, z): the lie there; codes:
// as kindAt's; longReach: how far the long grass grows round the ball (its
// rough isn't grown twice). Returns [{ x, z, h, code, turn, v, shade, lie }]
// (lie: the ground each stands on), nearest the centres first, at most
// HOLE_GRASS.most.
// paths: the cart paths to keep off - the hole's own and the next hole's
// drawn on it (course/holescenery.js nextTeePaths: the cart drives off the
// green along one, and this hole's lies call it rough - the owner, 1
// November 2026: "when the buggy drove to the next hole I saw grass in the
// path") - none on or by the kerb, thickening back up beyond, as the long
// grass round the ball keeps off them (sim/tufts.mjs grassPathRoom).
export function holeGrassClumps({ centres, lieAt, codes = { rough: 0, deep: 1 }, longReach = LONG_GRASS.radius.ultra, seed = 1, paths = null }) {
  const { cell } = HOLE_GRASS;
  const byPaths = paths?.length ? TUFT_PATH_GAP.tall + GRASS_PATH_FADE + cell : 0;
  const pathGapFor = (tall) => (tall ? TUFT_PATH_GAP.tall : TUFT_PATH_GAP.tuft) + GRASS_PATH_FADE;
  const rand = random(seed);
  const done = new Set();
  // Each cell's lie read once (its neighbours' too, for the edges): the
  // lie lookups are most of the time it takes.
  const lies = new Map();
  const cellLie = (cx, cz) => {
    const key = `${cx},${cz}`;
    let l = lies.get(key);
    if (l === undefined) lies.set(key, (l = lieAt(cx, cz)));
    return l;
  };
  const out = [];
  // Cells within any centre's reach, each once.
  for (const c of centres) {
    const n = Math.ceil(c.r / cell);
    for (let i = -n; i <= n; i++) {
      for (let j = -n; j <= n; j++) {
        const cx = Math.round(c.x / cell + i) * cell;
        const cz = Math.round(c.z / cell + j) * cell;
        const key = `${cx},${cz}`;
        if (done.has(key)) continue;
        done.add(key);
        // How full it grows here: the best of the centres it's near.
        let best = 0;
        let fromBall = Infinity;
        let fromAny = Infinity;
        for (const o of centres) {
          const d = Math.hypot(cx - o.x, cz - o.z);
          if (o.ball) fromBall = Math.min(fromBall, d);
          fromAny = Math.min(fromAny, d);
          if (d <= o.r) best = Math.max(best, fullness(d, o.r));
        }
        if (best <= 0) continue;
        const lie = cellLie(cx, cz);
        const kind = kindAt(lie, codes);
        if (!kind || fromAny > kind.reach) continue;
        // The rough round the ball is the long grass's: this takes over as
        // it fades out (over the last quarter of its reach).
        let share = 1;
        if (kind.rough && fromBall < longReach) share = Math.min(1, Math.max(0, (fromBall - longReach * 0.75) / (longReach * 0.25)));
        if (share <= 0) continue;
        // Short grass fades out over the last third of its own reach.
        if (Number.isFinite(kind.reach)) share *= Math.min(1, Math.max(0, (kind.reach - fromAny) / (kind.reach / 3)));
        const expect = kind.perM2 * cell * cell * best * share;
        const count = Math.floor(expect + rand());
        // A cell by other ground: each clump's own lie read.
        // (All eight round it: a green's corner can touch one only across
        // a diagonal.)
        const edge = AROUND.some(([a, b]) => cellLie(cx + a * cell, cz + b * cell) !== lie);
        // How far the cell's middle is from a path's edge (Infinity: further
        // than any clump in it needs to know).
        const pathGap = byPaths > 0 && count > 0 ? gapToPaths(paths, cx, cz, byPaths) : Infinity;
        for (let k = 0; k < count; k++) {
          const x = cx + (rand() - 0.5) * cell;
          const z = cz + (rand() - 0.5) * cell;
          const size = 0.7 + rand() * 0.5;
          const turn = rand() * Math.PI * 2;
          const pick = rand();
          const shade = 0.85 + rand() * 0.3;
          let own = kind;
          let on = lie;
          if (edge) {
            on = lieAt(x, z);
            own = kindAt(on, codes);
            // (Held to its own ground's reach: first cut grows further out
            // than the fairway beside it.)
            if (!own || fromAny > own.reach) continue;
          }
          // Off the cart paths (looked at only where the cell's middle says
          // it might be near).
          const tall = own.h > TALL_GRASS;
          if (pathGap - Math.hypot(x - cx, z - cz) < pathGapFor(tall)) {
            const room = grassPathRoom(paths, x, z, tall);
            if (room <= 0 || (room < 1 && rand() >= room)) continue;
          }
          out.push({ x, z, h: own.h * size, code: own.code, turn, v: variantOf(own.mix, pick), shade, lie: on, d: fromAny });
        }
      }
    }
  }
  out.sort((a, b) => a.d - b.d);
  return out.slice(0, HOLE_GRASS.most).map(({ d, ...c }) => c);
}

// Drawn in square chunks (metres a side), so the graphics card only draws
// the ones in view; and a chunk far from the camera draws only a share of
// its clumps (shuffled, so the share is spread evenly), down to `least` of
// them past `far` metres - blades a few centimetres tall are lost in the
// ground's own texture out there (look/longgrass.js chunkShare).
export const HOLE_CHUNKS = { size: 32, near: 45, far: 130, least: 0.2 };

// The field as the graphics card gets it (look/longgrass.js makeHoleGrass):
// the clumps in chunks by shape and square (HOLE_CHUNKS.size), each chunk
// shuffled the same way every time, every clump placed - plain typed
// arrays, so another core can work it out and hand it over (holeGrassFrom)
// and the page has only the meshes to make.
//   clumps: holeGrassClumps's; place(x, z, lie): where a clump at (x, z) on
//   `lie` stands, world [x, y, z] (on its ground's drawn surface);
//   heightAt(x, z): the hole's ground (hole frame), for the slope each
//   stands on (groundNormal) - or none: level.
// Returns { n, pos (3 a clump, world), norm (3 a clump: the ground's
// normal at its foot, world), h, turn, shade, code, v, chunks: [{ v, from,
// to, centre: [x, y, z] }] } - a chunk's clumps are from..to.
export function holeGrassField(clumps, place, size = HOLE_CHUNKS.size, heightAt = null) {
  const n = clumps.length;
  const at = new Float32Array(n * 3);
  const up = new Float32Array(n * 3);
  const byChunk = new Map();
  for (let i = 0; i < n; i++) {
    const c = clumps[i];
    const p = place(c.x, c.z, c.lie);
    at[i * 3] = p[0];
    at[i * 3 + 1] = p[1];
    at[i * 3 + 2] = p[2];
    const nw = heightAt ? groundNormal(heightAt, c.x, c.z) : [0, 1, 0];
    up[i * 3] = nw[0];
    up[i * 3 + 1] = nw[1];
    up[i * 3 + 2] = nw[2];
    const key = `${c.v ?? 0}:${Math.floor(p[0] / size)}:${Math.floor(p[2] / size)}`;
    let list = byChunk.get(key);
    if (!list) byChunk.set(key, (list = []));
    list.push(i);
  }
  const pos = new Float32Array(n * 3);
  const norm = new Float32Array(n * 3);
  const h = new Float32Array(n);
  const turn = new Float32Array(n);
  const shade = new Float32Array(n);
  const code = new Uint8Array(n);
  const v = new Uint8Array(n);
  const chunks = [];
  let k = 0;
  for (const [key, list] of byChunk) {
    // Shuffled (the same way each time), so drawing only the first share of
    // them thins the chunk evenly.
    let seed = list.length * 7919 + 1;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    const from = k;
    const centre = [0, 0, 0];
    for (const i of list) {
      const c = clumps[i];
      pos[k * 3] = at[i * 3];
      pos[k * 3 + 1] = at[i * 3 + 1];
      pos[k * 3 + 2] = at[i * 3 + 2];
      norm[k * 3] = up[i * 3];
      norm[k * 3 + 1] = up[i * 3 + 1];
      norm[k * 3 + 2] = up[i * 3 + 2];
      centre[0] += at[i * 3] / list.length;
      centre[1] += at[i * 3 + 1] / list.length;
      centre[2] += at[i * 3 + 2] / list.length;
      h[k] = c.h;
      turn[k] = c.turn;
      shade[k] = c.shade ?? 1;
      code[k] = c.code;
      v[k] = c.v ?? 0;
      k++;
    }
    chunks.push({ v: Number(key.split(":")[0]), from, to: k, centre });
  }
  return { n, pos, norm, h, turn, shade, code, v, chunks };
}

// The ground's normal at (x, z) on the hole (hole frame: x along, z
// across), in the world's frame (world x = z, z = -x), from its height
// either side - so a clump of grass is lit as the slope it stands on is,
// not as level ground (on a slope turned from the sun its blades were as
// bright as on the flat, lighter than the ground round them: the owner,
// 1 November 2026, "nearside green looks blotchy"). e: how far either side
// (the ground's own mesh is about this fine).
export const SLOPE_STEP = 1;
export function groundNormal(heightAt, x, z, e = SLOPE_STEP) {
  const dx = (heightAt(x + e, z) - heightAt(x - e, z)) / (2 * e);
  const dz = (heightAt(x, z + e) - heightAt(x, z - e)) / (2 * e);
  const l = Math.hypot(dx, 1, dz) || 1;
  if (!Number.isFinite(l)) return [0, 1, 0];
  // Hole frame (-dx, 1, -dz) / l; in the world (its z, y, -its x).
  return [-dz / l, 1 / l, dx / l];
}

// The same on another core (buildworker.js, look/offload.js, as each shot
// is set up): the hole made again from its recipe (sim/holesite.mjs), the
// field placed on it with every clump on its ground's drawn surface, in the
// world's frame (hole x along, z across; world x = z, z = -x) - so the page
// has only the meshes to make. Only for the page's own hole (probe).
//   a: { site (holeSite's), probe (holeProbe's), centres, codes, seed,
//        others (the other holes' ground: its layout's otherGround) }
export function holeGrassFrom(a) {
  const site = holeSite(a.site);
  const hole = site.hole;
  const lieAt = (x, z) => hole.lieAt(x, z);
  const probe = holeProbe(site.heightAt, lieAt, hole.layout);
  if (JSON.stringify(probe) !== JSON.stringify(a.probe)) throw new Error("not the page's hole");
  const clumps = holeGrassClumps({ centres: a.centres, lieAt: withOtherGround(lieAt, a.others), codes: a.codes, seed: a.seed, paths: a.paths ?? null });
  return holeGrassField(clumps, (x, z, lie) => [z, site.heightAt(x, z) + drawnLift(lie, hole.mapped), -x], HOLE_CHUNKS.size, (x, z) => site.heightAt(x, z));
}
