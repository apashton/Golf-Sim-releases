// Pot bunkers laid over each other, joined into one (the owner, 1 November
// 2026, of Sea Links 2: "There was a pot bunker on hole 2 to the left
// which hadn't combined like we agreed"). Bunkers that overlap are drawn
// and played as one (course/holebuild.js laidOver) - but not walled ones,
// each with its own turf face along its own outline, so two pots a few
// metres apart showed two rims, one across the other's sand. Here each
// such pair becomes one pot: an oval over both, its face as tall as the
// taller's, dug as deep as the deeper, and its low side - the way in, at
// the back - turned the same way as the bigger one's was. Done as the hole
// is made ready to play (sim/courseplay.mjs playLayout), so it's drawn,
// dug and played as one; the hole as saved keeps its two. Pure.

import { isPot, insideBlob, blobOutline } from "./course.mjs";
import { spanOf } from "./walls.mjs";

// Whether two pots' outlines overlap (one's edge reaches into the other).
function overlap(a, b) {
  if (Math.hypot(a.x - b.x, a.z - b.z) > Math.max(a.rx, a.rz) + Math.max(b.rx, b.rz) + 0.5) return false;
  return blobOutline(b, 48).some(([x, z]) => insideBlob(a, x, z)) || blobOutline(a, 48).some(([x, z]) => insideBlob(b, x, z));
}

// The outline's points, with how far round each is as a share of the way
// (the wall's t: sim/walls.mjs measures it so).
const N = 96;
function round(shape) {
  const pts = blobOutline(shape, N);
  const cum = [0];
  for (let i = 1; i <= N; i++) cum.push(cum[i - 1] + Math.hypot(pts[i % N][0] - pts[i - 1][0], pts[i % N][1] - pts[i - 1][1]));
  return { pts, cum, total: cum[N] };
}
// The direction (hole frame, radians) from a shape's middle to its edge at
// share t of the way round.
function angleAtT(shape, t) {
  const { pts, cum, total } = round(shape);
  const d = (((t % 1) + 1) % 1) * total;
  let i = 0;
  while (i < N - 1 && cum[i + 1] < d) i++;
  const [x, z] = pts[i];
  return Math.atan2(z - shape.z, x - shape.x);
}
// The share of the way round a shape's edge lies in direction `angle`.
function tAtAngle(shape, angle) {
  const { pts, cum, total } = round(shape);
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < N; i++) {
    const a = Math.atan2(pts[i][1] - shape.z, pts[i][0] - shape.x);
    const d = Math.abs(Math.atan2(Math.sin(a - angle), Math.cos(a - angle)));
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return cum[best] / total;
}
const wrap = (t) => Math.round((((t % 1) + 1) % 1) * 1000) / 1000;

// Two pots as one: an oval from the far edge of one to the far edge of
// the other, as wide as the wider; the bigger one's look; its face's gap
// (the low back, from a[1] round to a[0]) turned to face the same way.
export function joinTwo(a, b) {
  const big = a.rx * a.rz >= b.rx * b.rz ? a : b;
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const d = Math.hypot(dx, dz) || 1e-6;
  const ux = dx / d;
  const uz = dz / d;
  const ra = Math.max(a.rx, a.rz);
  const rb = Math.max(b.rx, b.rz);
  const e1 = [a.x - ux * ra, a.z - uz * ra];
  const e2 = [b.x + ux * rb, b.z + uz * rb];
  const rx = Math.max(Math.hypot(e2[0] - e1[0], e2[1] - e1[1]) / 2, ra, rb);
  const rz = Math.max(Math.min(a.rx, a.rz), Math.min(b.rx, b.rz));
  const joined = {
    ...big,
    x: (e1[0] + e2[0]) / 2,
    z: (e1[1] + e2[1]) / 2,
    rx,
    rz,
    rot: Math.atan2(uz, ux),
    dig: Math.max(a.dig ?? 0, b.dig ?? 0),
    joined: true,
  };
  const wall = big.wall;
  if (wall && Array.isArray(wall.a)) {
    const gap = 1 - spanOf(wall.a);
    const back = angleAtT(big, wall.a[1] + gap / 2);
    const t = tAtAngle(joined, back);
    joined.wall = { ...wall, a: [wrap(t + gap / 2), wrap(t - gap / 2)], h: Math.max(a.wall?.h ?? 0, b.wall?.h ?? 0) };
  }
  return joined;
}

// The hole's bunkers with every pot laid over another joined to it (again,
// till none overlap: three in a row become one). The list as it was if
// none do.
export function joinPots(bunkers) {
  if (!Array.isArray(bunkers)) return bunkers;
  let list = bunkers;
  for (let pass = 0; pass < bunkers.length; pass++) {
    let found = null;
    for (let i = 0; i < list.length && !found; i++) {
      if (!isPot(list[i]) || list[i].poly) continue;
      for (let j = i + 1; j < list.length; j++) {
        if (isPot(list[j]) && !list[j].poly && overlap(list[i], list[j])) {
          found = [i, j];
          break;
        }
      }
    }
    if (!found) break;
    const [i, j] = found;
    const one = joinTwo(list[i], list[j]);
    list = list.flatMap((b, k) => (k === i ? [one] : k === j ? [] : [b]));
  }
  return list;
}
