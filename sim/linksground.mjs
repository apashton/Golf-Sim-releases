// A links hole's ground, past what the dunes' rolls (sim/rolls.mjs) give
// it (the owner, 10 October 2026: "Go with all suggestions"):
//
//   marram   clumps of tall, pale marram grass along the dune crests:
//            [x, z, size, turn]
//   rabbit   rabbit scrapes in the dune faces: [x, z, size, turn]
//   pebbles  pebbles and broken shells round the bunkers: [x, z, size,
//            turn, shell (0 / 1)]
//   drifts   sand blown onto the turf on the downwind side of each bunker
//            (the hole's own prevailing wind, from its seed): [x, z, r,
//            turn]
//
// No sand of its own: a links hole's sand is its bunkers, on and beside
// its fairways and by its greens (the owner, 19 October 2026: "still
// bunkers in random places on links. They should only be on fairways or
// next to greens" - the sand scrapes once blown out of its dune faces,
// 10 - 45 m off the line of play, played and looked like bunkers).
//
// Hole frame (sim/course.mjs), metres. rolls: the hole's (holeRolls), whose
// height tells crest from swale. lieAt(x, z): the hole's surface. Seeded:
// the same hole is always the same. Pure.

import { seeded, makePath, insideBlob } from "./course.mjs";
import { outsideCorridor } from "./rolls.mjs";
import { tuftClearOfPaths } from "./tufts.mjs";

export const LINKS_GROUND = {
  // Marram clumps for each 100 m, by graphics setting, on ground at least
  // this high (metres) and higher than round it (a crest).
  marram: { per100: { standard: 220, medium: 400, high: 700, ultra: 1300 }, high: 0.7, crest: 0.05, size: [0.7, 1.25] },
  rabbit: { per100: 4 },
  pebbles: { perBunker: 8 },
  drifts: { perEdge: 3 },
};

const r2 = (v) => Math.round(v * 100) / 100;

// The hole's prevailing wind, a direction (radians, the hole's frame), from
// its seed: where blown sand lies.
export function prevailing(seed) {
  return seeded((seed ^ 0x51ad) >>> 0 || 1)() * Math.PI * 2;
}

// A hole from a map has no rolls: its real ground stands in for them, as
// its relief - each spot's height above the ground round it (the mean over
// \`reach\` metres each way), so a crest is high and a hollow low wherever
// the hole lies - and its own slope. heightAt(x, z): the real ground. Read
// once on a grid of \`cell\` metres; between, the nearest.
export function reliefRolls(bounds, heightAt, { cell = 4, reach = 24 } = {}) {
  if (!bounds) return null;
  const nx = Math.max(2, Math.ceil((bounds.x1 - bounds.x0) / cell) + 1);
  const nz = Math.max(2, Math.ceil((bounds.z1 - bounds.z0) / cell) + 1);
  const raw = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) raw[j * nx + i] = heightAt(bounds.x0 + i * cell, bounds.z0 + j * cell) || 0;
  // Sums over every box from the corner, for each spot's mean round it.
  const sum = new Float64Array((nx + 1) * (nz + 1));
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) sum[(j + 1) * (nx + 1) + i + 1] = raw[j * nx + i] + sum[j * (nx + 1) + i + 1] + sum[(j + 1) * (nx + 1) + i] - sum[j * (nx + 1) + i];
  const k = Math.max(1, Math.round(reach / cell));
  const relief = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const i0 = Math.max(0, i - k), i1 = Math.min(nx, i + k + 1), j0 = Math.max(0, j - k), j1 = Math.min(nz, j + k + 1);
      const total = sum[j1 * (nx + 1) + i1] - sum[j0 * (nx + 1) + i1] - sum[j1 * (nx + 1) + i0] + sum[j0 * (nx + 1) + i0];
      relief[j * nx + i] = raw[j * nx + i] - total / ((i1 - i0) * (j1 - j0));
    }
  }
  const at = (x, z) => Math.min(nz - 1, Math.max(0, Math.round((z - bounds.z0) / cell))) * nx + Math.min(nx - 1, Math.max(0, Math.round((x - bounds.x0) / cell)));
  return {
    bounds,
    height: (x, z) => relief[at(x, z)],
    gradient: (x, z) => [(heightAt(x + 1, z) - heightAt(x - 1, z)) / 2, (heightAt(x, z + 1) - heightAt(x, z - 1)) / 2],
  };
}

// Everything else on a links hole's ground (see above). setting: the
// graphics setting ("standard", "medium", "high", "ultra"). paths: every
// cart path drawn on the hole (its own, those between holes and the next
// hole's: course/holescenery.js) - marram and scrapes kept off them as the
// tufts are (sim/tufts.mjs tuftClearOfPaths).
export function linksGround(L, rolls, lieAt, { seed = 1, setting = "high", paths = L.paths ?? [] } = {}) {
  const out = { marram: [], rabbit: [], pebbles: [], drifts: [] };
  if (!L.links || !rolls) return out;
  const rand = seeded((seed ^ 0x3a77) >>> 0 || 1);
  const path = makePath(L.path);
  const b = rolls.bounds;
  const len = path.length;
  const grows = (x, z) => {
    const lie = lieAt(x, z);
    return (lie === "rough" || lie === "deep") && tuftClearOfPaths(paths, x, z, true);
  };
  // Marram on the crests: high, and higher than the ground 6 m round.
  const M = LINKS_GROUND.marram;
  const wantMarram = Math.round(((M.per100[setting] ?? M.per100.high) * len) / 100);
  for (let tries = 0; tries < wantMarram * 8 && out.marram.length < wantMarram; tries++) {
    const x = b.x0 + rand() * (b.x1 - b.x0);
    const z = b.z0 + rand() * (b.z1 - b.z0);
    const h = rolls.height(x, z);
    if (h < M.high * (0.6 + rand() * 0.8)) continue;
    const round = (rolls.height(x + 6, z) + rolls.height(x - 6, z) + rolls.height(x, z + 6) + rolls.height(x, z - 6)) / 4;
    if (h - round < M.crest * (rand() - 0.3)) continue;
    if (!grows(x, z) || outsideCorridor(L, x, z, path) < 6) continue;
    // In tussocks: a few together.
    const n = 1 + Math.floor(rand() * 4);
    for (let i = 0; i < n && out.marram.length < wantMarram; i++) {
      const px = x + (rand() - 0.5) * 2.4;
      const pz = z + (rand() - 0.5) * 2.4;
      if (!grows(px, pz)) continue;
      out.marram.push([r2(px), r2(pz), r2(M.size[0] + rand() * (M.size[1] - M.size[0])), r2(rand() * 6.28)]);
    }
  }
  // Rabbit scrapes in the dune faces.
  const wantRabbit = Math.round((LINKS_GROUND.rabbit.per100 * len) / 100);
  for (let tries = 0; tries < wantRabbit * 30 && out.rabbit.length < wantRabbit; tries++) {
    const x = b.x0 + rand() * (b.x1 - b.x0);
    const z = b.z0 + rand() * (b.z1 - b.z0);
    const [gx, gz] = rolls.gradient(x, z);
    if (Math.hypot(gx, gz) < 0.08 || rolls.height(x, z) < 0.3 || !grows(x, z) || outsideCorridor(L, x, z, path) < 8) continue;
    // Dug into the slope: facing down it.
    out.rabbit.push([r2(x), r2(z), r2(0.5 + rand() * 0.5), r2(Math.atan2(-gz, -gx))]);
  }
  // Pebbles and shells round the bunkers' edges.
  const scatter = (cx, cz, r, n) => {
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2;
      const d = Math.sqrt(rand()) * r;
      out.pebbles.push([r2(cx + Math.cos(a) * d), r2(cz + Math.sin(a) * d), r2(0.03 + rand() * rand() * 0.07), r2(rand() * 6.28), rand() < 0.3 ? 1 : 0]);
    }
  };
  // Blown sand on the downwind side of each bunker.
  const wind = prevailing(seed);
  const wx = Math.cos(wind);
  const wz = Math.sin(wind);
  const drift = (shape, r, pit = false) => {
    for (let i = 0; i < LINKS_GROUND.drifts.perEdge; i++) {
      const a = wind + (rand() - 0.5) * 1.1;
      const d = r * (0.95 + rand() * 0.2);
      let x = shape.x + Math.cos(a) * d + wx * 0.6;
      let z = shape.z + Math.sin(a) * d + wz * 0.6;
      const size = r2(0.8 + rand() * 1.4);
      // A bunker's: blown out onto the turf beyond its lip, all of it - a
      // drift reaching back over the edge was laid down into the hollow, a
      // sheet of sand hanging across a pot bunker's face.
      if (pit) {
        for (let k = 0; k < 40 && insideBlob(shape, x, z, size + DRIFT_CLEAR); k++) {
          x += Math.cos(a) * 0.15;
          z += Math.sin(a) * 0.15;
        }
      }
      out.drifts.push([r2(x), r2(z), size, r2(wind + (rand() - 0.5) * 0.6)]);
    }
  };
  for (const bk of L.bunkers ?? []) {
    if (bk.poly) continue;
    drift(bk, Math.max(bk.rx, bk.rz), true);
    scatter(bk.x, bk.z, Math.max(bk.rx, bk.rz) * 1.25, LINKS_GROUND.pebbles.perBunker);
  }
  // (None on what plays as anything but rough, sand or deep.)
  const ok = new Set(["rough", "deep", "bunker", "greenside", "waste"]);
  out.pebbles = out.pebbles.filter(([x, z]) => ok.has(lieAt(x, z)));
  // A drift is a picture draped over the ground, so all of it lies on the
  // rough: none reaching into a bunker (or down a pot's face), onto the
  // green or the fairway.
  out.drifts = out.drifts.filter((d) => driftClear(L, d, lieAt));
  return out;
}

// How far (metres) blown sand stays back from a bunker's edge.
export const DRIFT_CLEAR = 0.3;

// Whether a drift ([x, z, r, turn]: a disc r metres round) lies wholly on
// the rough: clear of every bunker by DRIFT_CLEAR, and its middle and its
// edge (every 30 degrees, and half way out) on rough, deep rough or semi.
export function driftClear(L, [x, z, r], lieAt) {
  const rough = (px, pz) => {
    const l = lieAt(px, pz);
    return l === "rough" || l === "deep" || l === "semi";
  };
  if (!rough(x, z)) return false;
  if ((L.bunkers ?? []).some((bk) => insideBlob(bk, x, z, r + DRIFT_CLEAR))) return false;
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    for (const f of [0.5, 1]) if (!rough(x + Math.cos(a) * r * f, z + Math.sin(a) * r * f)) return false;
  }
  return true;
}
