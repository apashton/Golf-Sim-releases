// A rock face to the water - a pond's Rock wall edge (sim/walls.mjs), the
// cliff the owner can choose - in shape, not only in colour (the owner:
// "Rock face still looks like wonky brick"): a flat face painted with
// beds and cracks read as masonry however it was painted. So the face is
// a fine mesh (look/walls.js) standing out over the water by the rock's
// relief. And it's organic, with nothing in rows or columns (the owner, of
// beds stepped out as ledges, blocks between straight joints and cracks
// cut down them: "too structured going back to wonky brick look"):
//
//   bulges and hollows at four sizes, from a body of rock 3 m across to
//                   the roughness of a hand's breadth
//   soft ledges     the beds standing out a little, coming and going
//                   along the face rather than running the length of it
//   cracks          a network wandering every way - the lines where a
//                   noise crosses its middle - cut into the face, in some
//                   parts of it and not others
//   its lean        back from near upright to a third of a metre,
//                   changing along it
//   fallen rock     lumps of it lying half in the water at its foot
//
// The paint (look/walls.js: the beds' shades, the cracks' dark lines) is
// drawn from the same beds and cracks. Pure: the shape and the drawing
// share it, and the tests.

import { valueNoise, hash2 } from "./country.mjs";

// Metres: a bed's thickness; how far its ledge stands out at most; the
// bulges' depth; how deep a crack is cut; and over how far below the top
// the face comes out to its full relief (at the top it's on the wall's
// line, where the grass meets it).
export const ROCK = { bed: 0.8, ledge: 0.12, bulge: 0.6, crack: 0.2, settle: 0.5 };

const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

// Which bed of a rock face a spot is in (whole numbers its partings): the
// beds of uneven thickness, wandering and dipping as they run along.
// along: metres along the wall; down: metres down from its top; seed: the
// wall's own.
export function rockBed(along, down, seed = 0) {
  const warp = (valueNoise(along, 3.1, 8.3, seed) - 0.5) * 1.2 + (valueNoise(along, 9, 1.7, seed + 1) - 0.5) * 0.25;
  return (down + along * 0.06 + warp) / ROCK.bed + 0.35 * (valueNoise(down, along * 0.1, 1.6, seed + 4) - 0.5);
}

// How much of a crack a spot is in, 0 to 1: a network of wandering lines
// (where a noise, its spots warped about, crosses its middle) - broad ones
// and finer ones - in some parts of the face and not others, and broken
// into lengths that taper out, so none closes round into an outline.
export function rockCrack(along, down, seed = 0) {
  const wa = along + 0.6 * (valueNoise(down, along * 0.3, 1.9, seed + 22) - 0.5);
  const wd = down + 0.6 * (valueNoise(along, down * 0.3, 1.9, seed + 23) - 0.5);
  const ridge = (scale, k) => 1 - Math.abs(2 * valueNoise(wa, wd * 0.85, scale, seed + k) - 1);
  const lengths = (k) => smooth((valueNoise(along, down, 0.9, seed + k) - 0.34) / 0.2);
  const broad = smooth((ridge(1.5, 20) - 0.91) / 0.06) * smooth((valueNoise(along, down, 3.5, seed + 21) - 0.4) / 0.2) * lengths(26);
  const fine = 0.6 * smooth((ridge(0.65, 24) - 0.94) / 0.04) * smooth((valueNoise(along, down, 2.2, seed + 25) - 0.5) / 0.2) * lengths(27);
  return Math.max(broad, fine);
}

// How far out from the wall's line (metres, over the water) the face
// stands at a spot: never behind it, nothing at its top.
export function rockRelief(along, down, seed = 0) {
  const n = (scale, k) => valueNoise(along, down, scale, seed + k);
  const bulge = ROCK.bulge * (0.55 * n(2.8, 3) + 0.27 * n(1.2, 5) + 0.12 * n(0.5, 8) + 0.06 * n(0.22, 9));
  // A bed's soft ledge, eased into the next over its lower part, and only
  // where the face has one along here.
  const bed = rockBed(along, down, seed);
  const k = Math.floor(bed);
  const t = smooth((bed - k - 0.6) / 0.4);
  const ledge = ROCK.ledge * (hash2(k, 7, seed) * (1 - t) + hash2(k + 1, 7, seed) * t) * smooth((valueNoise(along, bed, 4, seed + 30) - 0.3) / 0.4);
  return Math.max(0, 0.05 + bulge + ledge - ROCK.crack * rockCrack(along, down, seed)) * smooth(down / ROCK.settle);
}

// How far back the face leans, from its foot to its top (metres), at a
// place along it: more in some stretches, near upright in others.
export const rockLean = (along, seed = 0) => 0.06 + 0.3 * valueNoise(along, 0, 7, seed + 9);

// Rock fallen from a face into the water at its foot: [{ along, out,
// size, turn, shape }] - where along it, how far out from its line
// (metres), how big, which way turned, and which of a few lumps - a few
// along a wall, more along a taller one.
export function rockFall(length, tall, seed = 0) {
  const out = [];
  const count = Math.round((length / 7) * Math.min(1.5, 0.5 + tall / 4) * (0.6 + 0.8 * hash2(1, 2, seed)));
  for (let i = 0; i < count; i++) {
    const r = (k) => hash2(i, k, seed + 13);
    const size = 0.45 + 1.0 * r(1) ** 1.3 * Math.min(1, 0.4 + tall / 5);
    out.push({ along: 0.5 + (length - 1) * r(2), out: 0.6 + size * 0.6 + 1.4 * r(3), size, turn: r(4) * Math.PI * 2, shape: Math.floor(r(5) * 4) });
  }
  return out.filter((b) => b.along > 0.3 && b.along < length - 0.3);
}
