// What can show in a pond's reflection (look/mirrors.js, Ultra). The
// owner's speed test put the reflections at 2.8 ms of Links by the Sea's
// slowest frame: for the pond on a hole, the whole scene was drawn again -
// the hole's rolling dunes, over a million triangles, from end to end.
//
// A still surface shows a point P where the line from the eye to P's
// mirror image (P dropped as far under the water as it stands over it)
// crosses the water: between the eye and P, seen from above - nearer the
// eye the higher P stands. So:
//   - an object can show only if, for some point of it, that crossing is
//     on the water: for a box, every crossing lies inside the box the
//     crossings of its eight corners span (mirrorFootprint, mayShow);
//   - and the ground that can show in a pond, nothing on it over `top`
//     high, lies between the pond and the pond pushed away from the eye as
//     far as `top` allows (mirrorSource) - all of it, for a low eye and
//     high dunes beyond; little more than the pond itself from up in the
//     air.
// A ground sheet is a grid laid row by row (greenscene.js sheetGeometry),
// its triangles in the order of their rows: those that can show are one
// short run of them (sheetRows, rowRange), drawn alone.
//
// And how far the water's ripples can bend where a pond reads its picture
// (rippleBend), from the weather the water shows now - so a pond's reach is
// grown by what they bend it today, not the most they ever could.
//
// Pure, for the reflections and the tests.

import { SPLASH } from "./ultra.mjs";
import { rippleMost } from "./ripplemap.mjs";

// Where on the water at `level` the box { min: {x, y, z}, max } could be
// seen mirrored from `eye` ({x, y, z}): { x0, z0, x1, z1 } - or null if the
// eye's at or under the water (no reflection). A corner at or under the
// water is seen where it is.
export function mirrorFootprint(box, eye, level) {
  const above = eye.y - level;
  if (!(above > 0)) return null;
  let x0 = Infinity;
  let z0 = Infinity;
  let x1 = -Infinity;
  let z1 = -Infinity;
  for (let k = 0; k < 8; k++) {
    const x = k & 1 ? box.max.x : box.min.x;
    const y = k & 2 ? box.max.y : box.min.y;
    const z = k & 4 ? box.max.z : box.min.z;
    // Its mirror image's depth under the water, and where the line from
    // the eye to it crosses the surface: that share of the way there.
    const t = above / (above + Math.max(0, y - level));
    const wx = eye.x + (x - eye.x) * t;
    const wz = eye.z + (z - eye.z) * t;
    if (wx < x0) x0 = wx;
    if (wx > x1) x1 = wx;
    if (wz < z0) z0 = wz;
    if (wz > z1) z1 = wz;
  }
  return { x0, z0, x1, z1 };
}

// Whether two { x0, z0, x1, z1 } overlap.
export const overlaps = (a, b) => a.x0 <= b.x1 && b.x0 <= a.x1 && a.z0 <= b.z1 && b.z0 <= a.z1;

// Whether something whose box is `box` could show in water mirrored at
// `level` lying within any of `rects`, seen from `eye`. A box that isn't
// known can.
export function mayShow(box, eye, level, rects) {
  if (!box || !Number.isFinite(box.min?.x) || !Number.isFinite(box.max?.x)) return true;
  const foot = mirrorFootprint(box, eye, level);
  return !!foot && rects.some((r) => overlaps(foot, r));
}

// Where ground no higher than `top` could be for it to show in water at
// `level` within `rect`, from `eye`: { x0, z0, x1, z1 }, or null if the
// eye's at or under the water.
export function mirrorSource(rect, eye, level, top) {
  const above = eye.y - level;
  if (!(above > 0)) return null;
  const s = (above + Math.max(0, top - level)) / above;
  let x0 = rect.x0;
  let z0 = rect.z0;
  let x1 = rect.x1;
  let z1 = rect.z1;
  for (const x of [rect.x0, rect.x1]) {
    for (const z of [rect.z0, rect.z1]) {
      const px = eye.x + (x - eye.x) * s;
      const pz = eye.z + (z - eye.z) * s;
      x0 = Math.min(x0, px);
      x1 = Math.max(x1, px);
      z0 = Math.min(z0, pz);
      z1 = Math.max(z1, pz);
    }
  }
  return { x0, z0, x1, z1 };
}

// A sheet's triangles, in blocks of `block` as they're drawn, for finding
// the run of them that can lie within some z (rowRange): each block's
// furthest z and the furthest of those before it (top), and each block's
// nearest and the nearest of those after it (bottom). Exact whatever the
// order - a sheet laid row by row gives short runs; one out of order, the
// whole of it. From its index (null: its corners three by three, as a sheet
// cut round what's dug is - look/dugground.js) and corners' positions
// (arrays: x y z each).
export const ROW_BLOCK = 64;
export function sheetRows(index, position, block = ROW_BLOCK) {
  const count = Math.floor((index ? index.length : position.length / 3) / 3);
  const corner = index ? (k) => index[k] : (k) => k;
  const n = Math.ceil(count / block);
  const top = new Float32Array(n).fill(-Infinity);
  const bottom = new Float32Array(n).fill(Infinity);
  for (let k = 0; k < count; k++) {
    const b = Math.floor(k / block);
    for (let j = 0; j < 3; j++) {
      const z = position[corner(k * 3 + j) * 3 + 2];
      if (z > top[b]) top[b] = z;
      if (z < bottom[b]) bottom[b] = z;
    }
  }
  for (let b = 1; b < n; b++) top[b] = Math.max(top[b], top[b - 1]);
  for (let b = n - 2; b >= 0; b--) bottom[b] = Math.min(bottom[b], bottom[b + 1]);
  return { count, block, top, bottom };
}

// The run of a sheet's triangles (sheetRows) holding every one that
// reaches between z0 and z1: [first, end), in triangles - empty when first
// >= end.
export function rowRange(rows, z0, z1) {
  const { count, block, top, bottom } = rows;
  const n = top.length;
  // The first block whose top reaches z0, and the last whose bottom is
  // at or before z1 (both lists only ever grow).
  let lo = 0;
  let hi = n;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (top[m] < z0) lo = m + 1;
    else hi = m;
  }
  const first = lo;
  lo = 0;
  hi = n;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (bottom[m] <= z1) lo = m + 1;
    else hi = m;
  }
  return [first * block, Math.min(count, lo * block)];
}

// The water's ripples, as its shader sums them (look/sandwater.js, which
// takes these numbers from here): each set's slope from the ripple map
// (coarse, and fine on High and up), choppier in the gusts' patches by up
// to `gust` again, a rain ring's slope at most `rain`, each ring of a
// splash `splash` times its bump's slope (-x e^-x², at most 1/sqrt(2e)),
// each later ring `ringFade` weaker; and the reflection read `mirror` of
// the surface normal's tilt off flat away (in the picture's 0 - 1).
export const RIPPLE = { coarse: 0.11, fine: 0.06, gust: 1.3, rain: 0.5, splash: 0.55, ringFade: 0.25, mirror: 0.06 };
// In the lee of the bank the wind blows off, the water's glassy - its
// ripples `calm` less, and no gust patches - out to `near` metres from the
// bank, the wind's ripples growing back over the open water to `reach`;
// so a small pond lies mostly calm and mirrors its banks, a lake's choppy
// out in the middle and on its far side. With the wind, fading in from
// still air to `wind` mph (look/sandwater.js waterLook).
export const WATER_LEE = Object.freeze({ near: 3, reach: 40, calm: 0.9, wind: 6 });
// Running water - a links burn, a brook - is shallow and clear: its stony
// bed shows through it, `tint` of the way to the water's shallow colour,
// the water's own colour only `clear` of it but in its pools (where the
// noise at 1/0.12 m is past `poolFrom`, full by `poolTo`) and down its
// deep middle; its ripples `scale` times finer than a pond's, drawn out
// `stretch` along the flow and carried downstream at `speed` m/s
// (course/holebuild.js runOf, holescenery.js drawBrook).
export const WATER_RUN = Object.freeze({ tint: 0.35, clear: 0.15, poolFrom: 0.55, poolTo: 0.8, scale: 2, stretch: 0.5, speed: 0.35 });
const BUMP_PEAK = 1 / Math.sqrt(2 * Math.E);

// How far (in the reflection's picture, 0 - 1 across it) the ripples can
// move where a pond reads its picture, at most, with the water as it is:
// chop (the ripples' roughness, 1 as they always were), gust (the gust
// patches' strength now, 0 none), rain (0 none), and the splashes still
// spreading ([{ time, size }] on the water's clock, `now`). The slope can
// be no more than every part of it at its steepest together; a normal
// leaning by atan(slope) moves 2 sin(half that) off flat, and the picture
// is read `mirror` of that away.
export function rippleBend({ chop = 1, gust = 0, rain = 0, splashes = [], now = 0 } = {}, most = rippleMost()) {
  let slope = (RIPPLE.coarse + RIPPLE.fine) * most * Math.max(0, chop) * (1 + RIPPLE.gust * Math.max(0, gust));
  if (rain > 0) slope += RIPPLE.rain;
  for (const sp of splashes) {
    const age = now - sp.time;
    if (!(sp.size > 0) || age < 0 || age >= SPLASH.life) continue;
    const fade = (1 - age / SPLASH.life) ** 2 * sp.size;
    let rings = 0;
    for (let ri = 0; ri < SPLASH.rings && age - ri * SPLASH.gap >= 0; ri++) rings += 1 - ri * RIPPLE.ringFade;
    slope += RIPPLE.splash * BUMP_PEAK * fade * rings;
  }
  return RIPPLE.mirror * 2 * Math.sin(Math.atan(slope) / 2);
}
