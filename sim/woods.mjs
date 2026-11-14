// Woods that look grown, not planted: where the trees stand round the
// driving range and the practice greens. Pure, no browser - the same every
// time from its seed. Each tree is [x, z, scale, kind, width] in the
// world's frame (look/trees.js makeTrees); a tree with no kind is a pine
// or a broadleaf (or a birch or poplar) as sim/treehits.mjs treeForm picks,
// and the newer kinds are given by name. None of it is in play.

import { KIND } from "./treeshapes.mjs";

export function seededRand(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Smooth value noise along a line (0 - 1), from a seed: for the edge of a
// wood wandering in and out, how deep it is, and where its gaps are.
export function lineNoise(u, seed) {
  const i = Math.floor(u);
  const f = u - i;
  const v = (k) => {
    let h = Math.imul(k, 374761393) ^ Math.imul(seed, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const s = f * f * (3 - 2 * f);
  return v(i) + (v(i + 1) - v(i)) * s;
}

// What a stretch of wood is made of, as it runs along: mostly mixed
// (kind left to the tree), with blocks of one conifer and a line of
// poplars here and there.
const STRETCHES = [
  { name: "mixed", weight: 5 },
  { name: "scots", weight: 1.2 },
  { name: "spruce", weight: 1 },
  { name: "column", weight: 0.6 },
  { name: "poplars", weight: 0.7 },
  { name: "oaks", weight: 1 },
];
function pickStretch(r) {
  const total = STRETCHES.reduce((a, s) => a + s.weight, 0);
  let x = r * total;
  for (const s of STRETCHES) if ((x -= s.weight) < 0) return s.name;
  return "mixed";
}
// A tree of a stretch's kind: in a block of conifers most are that
// conifer; in a stretch of oaks about half are oaks; and now and then
// anywhere a tree has died and stands as a snag.
function kindIn(stretch, rand) {
  const r = rand();
  if (r < 0.02) return KIND.snag;
  if (stretch === "scots" || stretch === "spruce" || stretch === "column") return r < 0.8 ? KIND[stretch] : undefined;
  if (stretch === "oaks") return r < 0.5 ? KIND.oak : undefined;
  return undefined;
}

// The range's woods (world frame: x across, the tee at z = 0, the range
// running away down -z). Down each side a wood one to five trees deep
// (two at most on Standard), its edge wandering in and out in bays and
// promontories, with see-through gaps in its front, stretches of one
// conifer, a line of poplars; specimen oaks standing out in the range's
// rough; willows by the pond; a backstop of woods across the end; and
// clumps behind and beside the tee for the chase camera.
//   high: the higher graphics setting (more rows, closer spacing)
//   pond: { x, z, rx, rz } the pond's middle and half-size, to keep clear
//     of and grow willows by
export const RANGE_WOODS = { edge: 57, deepest: 5, standardDeepest: 2, rowGap: 9.5, oakX: [45, 51] };
export function rangeWoods({ high = true, seed = 7, pond = { x: -49, z: -120, rx: 4, rz: 13 } } = {}) {
  const rand = seededRand(seed);
  const trees = [];
  const step = high ? 5.5 : 7.5;
  const deepest = high ? RANGE_WOODS.deepest : RANGE_WOODS.standardDeepest;
  const nearPond = (x, z, m) => Math.abs(x - pond.x) < pond.rx + m && Math.abs(z - pond.z) < pond.rz + m;
  for (const side of [-1, 1]) {
    const ns = seed * 7 + (side > 0 ? 101 : 0);
    // Stretches 35 - 70 m long, each of its own make-up.
    let stretchEnd = 16;
    let stretch = "mixed";
    for (let z = 16; z > -372; z -= step * (0.8 + rand() * 0.4)) {
      if (z <= stretchEnd) {
        stretchEnd = z - (35 + rand() * 35);
        stretch = pickStretch(rand());
      }
      // The edge: bays up to 16 m back, promontories up to 5 m out.
      const wander = lineNoise(-z / 55, ns);
      const edge = RANGE_WOODS.edge - 5 + wander * 21;
      // How deep: one to five rows.
      const depth = Math.max(1, Math.min(deepest, 1 + Math.floor(lineNoise(-z / 40 + 17.3, ns + 3) * 5.2)));
      // A see-through gap: the front rows missing for a stretch.
      const gap = lineNoise(-z / 18 + 5.1, ns + 5) < 0.2;
      for (let row = 0; row < depth; row++) {
        if (gap && row < 2) continue;
        const x = side * (edge + row * RANGE_WOODS.rowGap + rand() * 6);
        const tz = z + (rand() - 0.5) * step;
        if (nearPond(x, tz, 6)) continue;
        const poplars = stretch === "poplars" && row === 0;
        const kind = poplars ? KIND.poplar : kindIn(stretch, rand);
        trees.push([x, tz, (poplars ? 0.85 : 0.9) + rand() * 0.6, kind]);
      }
    }
  }
  // Specimen oaks out in the range's rough, well apart.
  for (const [side, yd] of [[-1, 95], [1, 150], [-1, 230], [1, 265]]) {
    const x = side * (RANGE_WOODS.oakX[0] + rand() * (RANGE_WOODS.oakX[1] - RANGE_WOODS.oakX[0]));
    const z = -yd * 0.9144 + (rand() - 0.5) * 10;
    if (!nearPond(x, z, 8)) trees.push([x, z, 1 + rand() * 0.25, KIND.oak, 1]);
  }
  // Willows by the pond, on its far side and ends.
  for (const [dx, dz] of [[-1.8, -0.7], [-1.9, 0.3], [-0.2, -1.35], [-1.3, 1.25]]) {
    trees.push([pond.x + dx * pond.rx * 1.9, pond.z + dz * pond.rz, 0.9 + rand() * 0.3, KIND.willow]);
  }
  // The backstop across the end: two or three deep on High, a block of
  // conifers in its middle.
  const backRows = high ? 3 : 2;
  for (let x = -115; x <= 115; x += step * 1.1) {
    const back = lineNoise(x / 30, seed + 11) * 14;
    for (let row = 0; row < backRows; row++) {
      if (row === 0 && lineNoise(x / 12 + 3, seed + 13) < 0.18) continue;
      const kind = Math.abs(x) < 35 && rand() < 0.75 ? (rand() < 0.5 ? KIND.spruce : KIND.scots) : kindIn("mixed", rand);
      trees.push([x + rand() * 3, -370 - back - row * 11 - rand() * 6, 1.2 + rand() * 0.8, kind]);
    }
  }
  // Clumps behind and beside the tee, for the chase camera.
  for (let c = 0; c < 8; c++) {
    const a = rand() * Math.PI - Math.PI;
    const d = 75 + rand() * 55;
    const cx = Math.cos(a) * d;
    const cz = 30 + Math.abs(Math.sin(a)) * 50 + rand() * 10;
    const n = 2 + Math.floor(rand() * 4);
    const stretch = pickStretch(rand());
    for (let i = 0; i < n; i++) trees.push([cx + (rand() - 0.5) * 12, cz + (rand() - 0.5) * 12, 1 + rand() * 0.6, kindIn(stretch, rand)]);
  }
  return trees;
}

// Where a practice green's clubhouse stands (greenscene.js addClubhouse):
// the gap left in its ring of trees - the direction from the green's
// middle (radians, world frame: 0 along +x, pi/2 along +z, behind the
// golfer) and how wide. Behind the hole and a little to its right, so from
// the golfer's camera it stands in the upper third of the picture, beside
// the flag rather than behind it.
export const CLUBHOUSE_GAP = { angle: -Math.PI * 0.4, width: 0.75 };

// The trees round a practice green (world frame; the hole away down -z
// from the golfer): in clumps with gaps between, thicker behind the hole,
// a clump now and then all of one conifer, a spreading oak or two standing
// alone, and one gap left where the clubhouse stands
// (CLUBHOUSE_GAP). Seeded per green. count: about how many (no more).
export function greenRing({ cx, cz, reach, seed = 5, count = 160 }) {
  const rand = seededRand(seed * 131 + 17);
  const trees = [];
  const inGap = (a) => {
    const d = Math.atan2(Math.sin(a - CLUBHOUSE_GAP.angle), Math.cos(a - CLUBHOUSE_GAP.angle));
    return Math.abs(d) < CLUBHOUSE_GAP.width / 2;
  };
  let a = rand() * Math.PI * 2;
  const end = a + Math.PI * 2;
  while (a < end && trees.length < count) {
    // A clump across 0.25 - 0.6 rad, then a gap of 0.05 - 0.35.
    const span = 0.25 + rand() * 0.35;
    const behind = Math.sin(a + span / 2) < 0;
    const stretch = rand() < 0.3 ? pickStretch(rand()) : "mixed";
    const n = Math.round(span * (behind ? 26 : 16) * (count / 160) * (0.7 + rand() * 0.6));
    for (let i = 0; i < n && trees.length < count; i++) {
      const t = a + rand() * span;
      if (inGap(t)) continue;
      const r = reach + (behind ? 24 : 30) + rand() * (behind ? 45 : 35);
      trees.push([cx + Math.cos(t) * r, cz + Math.sin(t) * r, 0.9 + rand() * 0.6, kindIn(stretch, rand)]);
    }
    a += span + 0.05 + rand() * 0.3;
  }
  // A spreading oak or two, standing alone nearer in.
  for (let i = 0; i < 2; i++) {
    // Off to a side, never in the line of play.
    const t = (rand() < 0.5 ? 0 : Math.PI) + (rand() - 0.5) * 1.1;
    if (inGap(t) || trees.length >= count) continue;
    const r = reach + 20 + rand() * 6;
    trees.push([cx + Math.cos(t) * r, cz + Math.sin(t) * r, 0.95 + rand() * 0.2, KIND.oak, 1]);
  }
  return trees;
}
