// A brown links hole's dunes (course.mjs trees "dunes"): more to them than
// one khaki (the owner: "Dunes khaki need some more variation but also more
// rocky areas? That can be part of the variation"). Out in its rough and
// long grass:
//
//   patches  broad, ragged patches laid over the ground's colour - pale
//            sandy blowouts, dark heather and gorse, greener hollows, and
//            stony ground under each outcrop: { x, z, r, kind, a } (hole
//            frame, metres; a: how strongly, 0 - 1)
//   rocks    outcrops: five to a dozen stones together on stony ground,
//            as sim/dressing.mjs keeps rocks ([x, z, size, turn, shape])
//
// Look only, like the rest of the dressing: kept clear of the fairway,
// greens, tees, sand, water and paths as rocks are (sim/dressing.mjs
// DRESSING_CLEAR). Seeded from the hole, so it's the same every time. Pure.

import { seeded, makePath, pointAt } from "./course.mjs";
import { clearOf, DRESSING_CLEAR, ROCK_SHAPES } from "./dressing.mjs";

export const DUNES = {
  // Patches for each 100 m of the hole, and outcrops.
  // (Fewer since the dunes had real shape of their own, sim/rolls.mjs:
  // the painted ones read as smears.)
  patches: 12,
  outcrops: 8,
  // How far out from the line of play they reach past the tree line.
  beyond: 70,
  // The kinds of patch and how often: sandy, heather, green.
  kinds: { sand: 3, heather: 3, green: 2 },
};

const r2 = (v) => Math.round(v * 100) / 100;

// The patches and the outcrops' rocks for a hole (L: its layout, lieAt its
// surface), from seed.
export function dunesDressing(L, lieAt, seed = 1) {
  const rand = seeded((seed ^ 0xd0e5) >>> 0 || 1);
  const path = makePath(L.path);
  const len = path.length;
  const reach = (L.treeLine ?? 40) + DUNES.beyond;
  const out = { patches: [], rocks: [] };
  // A spot along the hole, out to one side or the other.
  const spot = (inner) => {
    const s = -30 + rand() * (len + 70);
    const at = pointAt(path, Math.max(0, Math.min(len, s)));
    const side = rand() < 0.5 ? -1 : 1;
    const off = inner + rand() * Math.max(1, reach - inner);
    return [at.p[0] - at.dir[1] * side * off + (s < 0 || s > len ? at.dir[0] * (s - Math.max(0, Math.min(len, s))) : 0), at.p[1] + at.dir[0] * side * off + (s < 0 || s > len ? at.dir[1] * (s - Math.max(0, Math.min(len, s))) : 0)];
  };
  const kinds = Object.entries(DUNES.kinds);
  const total = kinds.reduce((a, [, w]) => a + w, 0);
  const kindOf = (r) => {
    let left = r * total;
    for (const [k, w] of kinds) if ((left -= w) < 0) return k;
    return kinds[kinds.length - 1][0];
  };
  // Patches: their middles in the rough or long grass, ragged, 6 - 30 m
  // across - none over what plays as anything else at its middle.
  const want = Math.round((DUNES.patches * len) / 100);
  for (let tries = 0; tries < want * 6 && out.patches.length < want; tries++) {
    const [x, z] = spot(10);
    const lie = lieAt(x, z);
    if (lie !== "rough" && lie !== "deep") continue;
    const r = 5 + rand() * 14;
    out.patches.push({ x: r2(x), z: r2(z), r: r2(r), kind: kindOf(rand()), a: r2(0.5 + rand() * 0.4) });
  }
  // Outcrops: stones close together, a big one or two among smaller, on a
  // patch of stony ground.
  const outcrops = Math.max(2, Math.round((DUNES.outcrops * len) / 100));
  for (let o = 0, tries = 0; o < outcrops && tries < outcrops * 10; tries++) {
    const [x, z] = spot(14);
    const spread = 2 + rand() * 4;
    if (!clearOf(lieAt, x, z, DRESSING_CLEAR.rocks, spread + 1)) continue;
    o++;
    const n = 5 + Math.floor(rand() * 8);
    const placed = [];
    for (let i = 0; i < n * 3 && placed.length < n; i++) {
      const a = rand() * Math.PI * 2;
      const d = Math.sqrt(rand()) * spread;
      const px = x + Math.cos(a) * d;
      const pz = z + Math.sin(a) * d;
      const size = i < 2 ? 0.6 + rand() * 0.4 : 0.2 + rand() * rand() * 0.5;
      if (placed.some((p) => Math.hypot(p[0] - px, p[1] - pz) < (p[2] + size) * 0.9)) continue;
      // (Each stone on ground a stone may lie on, not just the outcrop's middle.)
      if (!["rough", "deep", "semi"].includes(lieAt(px, pz))) continue;
      placed.push([r2(px), r2(pz), r2(size), r2(rand() * Math.PI * 2), Math.floor(rand() * ROCK_SHAPES.length)]);
    }
    out.rocks.push(...placed);
    out.patches.push({ x: r2(x), z: r2(z), r: r2(spread + 3), kind: "stone", a: 0.85 });
  }
  return out;
}

// More outcrops where a links hole's dunes are steep (sim/rolls.mjs): rock
// breaking through the turf on a dune's face, a few stones together, from
// a randomness of their own (the outcrops above stay where they were).
// rolls: the hole's (holeRolls). Returns { rocks, patches } as above.
export const FACE_OUTCROPS = { per100: 7, steep: 0.16 };
export function duneFaceOutcrops(L, rolls, lieAt, seed = 1) {
  const out = { rocks: [], patches: [] };
  if (!rolls) return out;
  const rand = seeded((seed ^ 0xface) >>> 0 || 1);
  const b = rolls.bounds;
  const want = Math.max(1, Math.round((FACE_OUTCROPS.per100 * makePath(L.path).length) / 100));
  for (let o = 0, tries = 0; o < want && tries < want * 60; tries++) {
    const x = b.x0 + rand() * (b.x1 - b.x0);
    const z = b.z0 + rand() * (b.z1 - b.z0);
    const [gx, gz] = rolls.gradient(x, z);
    if (Math.hypot(gx, gz) < FACE_OUTCROPS.steep) continue;
    const spread = 2.5 + rand() * 3.5;
    if (!clearOf(lieAt, x, z, DRESSING_CLEAR.rocks, spread + 1)) continue;
    o++;
    const n = 6 + Math.floor(rand() * 8);
    const placed = [];
    for (let i = 0; i < n * 3 && placed.length < n; i++) {
      // Strung along the face, across the slope.
      const along = (rand() - 0.5) * spread * 2;
      const across = (rand() - 0.5) * spread * 0.6;
      const k = Math.hypot(gx, gz) || 1;
      const px = x + (-gz / k) * along + (gx / k) * across;
      const pz = z + (gx / k) * along + (gz / k) * across;
      const size = i < 2 ? 0.9 + rand() * 0.8 : 0.25 + rand() * rand() * 0.6;
      if (placed.some((p) => Math.hypot(p[0] - px, p[1] - pz) < (p[2] + size) * 0.9)) continue;
      // (Each stone on ground a stone may lie on, not just the outcrop's middle.)
      if (!["rough", "deep", "semi"].includes(lieAt(px, pz))) continue;
      placed.push([r2(px), r2(pz), r2(size), r2(rand() * Math.PI * 2), Math.floor(rand() * ROCK_SHAPES.length)]);
    }
    out.rocks.push(...placed);
    out.patches.push({ x: r2(x), z: r2(z), r: r2(spread + 2), kind: "stone", a: 0.8 });
  }
  return out;
}

// How much of a patch covers a spot (0 - 1): full in its middle, its edge
// ragged (n: a noise 0 - 1 at the spot).
export function patchCover(p, d, n = 0.5) {
  const edge = p.r * (0.75 + 0.5 * n);
  const t = Math.min(1, Math.max(0, (d - edge * 0.55) / (edge * 0.45)));
  return p.a * (1 - t * t * (3 - 2 * t));
}
