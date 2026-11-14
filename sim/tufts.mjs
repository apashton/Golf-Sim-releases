// Tufts of longer grass in the ring of rough round a green (the course's
// greens and the practice greens alike): how likely one is to stand `out`
// metres beyond where the ring starts - few right by the fringe, fullest a
// few metres out, thinning again past about 6 m - so they neither start at
// a line nor stand round the green as a hedge. Pure.
import { gapToPaths } from "./paths.mjs";
import { valueNoise } from "./country.mjs";

export function tuftChance(out) {
  return Math.max(0, Math.min(0.15 + out / 5, 1 - 0.85 * Math.min(1, Math.max(0, (out - 6) / 10))));
}

// How far a tuft's middle keeps from a cart path's edge (metres): its cards
// reach up to 0.35 m either side (a links hole's tall long grass, 0.7 m tall
// and more, its own), and a tuft standing right at the kerb still leans
// over the path seen along it from down the hole (the owner: "long grass
// can draw on top of the cart path from distance, cart path always needs
// to be on top"). A lie check at the tuft's middle alone let 39 of a links
// hole's tufts stand over its path.
export const TUFT_PATH_GAP = { tuft: 1, tall: 1.75 };

// Is (x, z), hole frame, far enough from every path for a tuft (tall: the
// links long grass's)?
export function tuftClearOfPaths(paths, x, z, tall = false) {
  const gap = tall ? TUFT_PATH_GAP.tall : TUFT_PATH_GAP.tuft;
  return !paths?.length || gapToPaths(paths, x, z, gap + 0.01) > gap;
}

// How far a tuft or a clump of long grass keeps off the tee (metres; the
// owner, of the speed test's parkland hole: "long grass floating on top of
// the fairway" - the striped tee, its boxes drawn as one). A hole's tee
// boxes are squares (the first tee's 12 x 14 m, TEE_REACH round each other
// tee spot), so two side by side leave a sliver of rough between them - on
// Golf Sim Links' 5th 0.7 m between the yellow box and the white one - and
// a lie check at each tuft stood a row of them right across the tee there;
// and each box was drawn with a soft edge out over the rough, which those
// beside it stood on. Kept this far from any tee, none does - as far as
// the surround of first cut mown round each box now reaches (sim/
// course.mjs SURROUND.tee), so they start at its clean, straight line.
export const TUFT_TEE_GAP = 2;
const AROUND = Array.from({ length: 8 }, (_, i) => [Math.cos((i * Math.PI) / 4), Math.sin((i * Math.PI) / 4)]);

// Is (x, z), hole frame, on the tee or within `gap` of it? lieAt: the
// hole's lie (hole frame). (Looked at there and on two rings round it: a
// tee box is far wider than the rings' gaps.)
export function byTee(lieAt, x, z, gap = TUFT_TEE_GAP) {
  if (lieAt(x, z) === "tee") return true;
  for (const r of [gap / 2, gap]) for (const [dx, dz] of AROUND) if (lieAt(x + dx * r, z + dz * r) === "tee") return true;
  return false;
}

// The long grass round the ball and the grass right round it (sim/
// longgrass.mjs, look/lienest.js) keep off the paths as the tufts do (the
// owner, again: "the car path should definitely be on top of the grass,
// not below it" - grown by a lie check at each clump alone, their blades
// stood at the kerb and arched over it). A grass taller than TALL_GRASS
// (metres) keeps the tall gap. Beyond the gap they thicken back up over
// GRASS_PATH_FADE metres, so they meet the worn verge along the path
// raggedly rather than at a line.
export const TALL_GRASS = 0.3;
export const GRASS_PATH_FADE = 0.75;

// How much of its full count grows at (x, z), hole frame: 0 within the
// gap of every path's edge, rising to 1 by the fade's end (1 with no paths).
export function grassPathRoom(paths, x, z, tall = false) {
  if (!paths?.length) return 1;
  const gap = tall ? TUFT_PATH_GAP.tall : TUFT_PATH_GAP.tuft;
  const d = gapToPaths(paths, x, z, gap + GRASS_PATH_FADE + 0.01);
  return Math.min(1, Math.max(0, (d - gap) / GRASS_PATH_FADE));
}

// A links hole's tufts all over (look/groundbits.js makeTuftField; the
// owner: "we need at least 20x the amount of grass tufts"): how many, by
// graphics setting, and
// how they thin with distance, drawn in squares `size` metres across - all
// of a square's within `near` metres, down to `least` of them by `far`.
export const TUFT_FIELD = {
  // Tufts a square metre (rough's, the long grass's), by setting: the long
  // grass covers most of a links hole, so it's by area, not length (by
  // length it came out a quarter as thick as the rough, with bare ground
  // between). Twice what they were once a far tuft became one card of 2
  // triangles (TUFT_LOD; the owner, 18 October 2026: "allow us to multiply
  // the number of them to look like greater coverage").
  perM2: { medium: [3.6, 3], high: [7.2, 6], ultra: [12, 10] },
  // The most a hole may have, whatever its size.
  most: 900000,
  size: 48,
  near: 40,
  far: 170,
  least: 0.05,
  // How tall a tuft stands (rough's, the long grass's, hay's: sim/hay.mjs),
  // metres: a links hole's knee-high fescue, a parkland hole's shorter,
  // greener rough; hay waist-high.
  height: { links: [0.42, 0.95, 1.4], parkland: [0.32, 0.6, 1.1] },
};

// The ground a hole's tufts are laid over when it has no rolls to give
// it (a parkland hole, a hole from a map): its path's box, out past the
// long grass by \`out\` metres each side, plus a little behind the tee and
// past the green.
export function fieldBounds(points, out) {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const [x, z] of points) {
    x0 = Math.min(x0, x); x1 = Math.max(x1, x);
    z0 = Math.min(z0, z); z1 = Math.max(z1, z);
  }
  if (!Number.isFinite(x0)) return null;
  const pad = out + 20;
  return { x0: x0 - pad, x1: x1 + pad, z0: z0 - pad, z1: z1 + pad };
}

// How much of a square of tufts is drawn, its middle d metres away. reach:
// below 1 when the picture's slow and the safety valve has pulled the
// detail in (NEARER): full tufts only nearer the camera, and next to none
// far off - where the ground's own colour carries on the look - rather
// than all of them gone at once.
export function tuftShare(d, reach = 1) {
  return shareAt(d, TUFT_FIELD, reach);
}

// Grass seen from high up (a flyover's crane, the view from above the
// hole, a drive followed from the air) is the ground's texture more than
// blades (the owner: "grass specifically can be drawn much cheaper at
// height than at golf shot level"): full with the camera within `from`
// metres above it, thinning to `least` by `to` metres up.
export const GRASS_HEIGHT = { from: 10, to: 45, least: 0.15 };
export function heightShare(up) {
  const t = Math.min(1, Math.max(0, (up - GRASS_HEIGHT.from) / (GRASS_HEIGHT.to - GRASS_HEIGHT.from)));
  return 1 - (1 - GRASS_HEIGHT.least) * t * t * (3 - 2 * t);
}

// And not as far: the grass's reach - how far out it's drawn before it
// thins (shareAt's near and far, brought in) - with the camera up `up`
// metres over it (the owner, 19 October 2026: "at max height for a ball
// flight camera the draw distance doesn't need to be as long as it is for
// grass. Makes more sense for trees but not for grass"): all of it up to
// `from` metres (a golfer's eye, a camera low behind the ball), down to
// `least` of it by `to` metres up - the chase camera at a drive's peak, a
// flyover - where a blade a hundred metres off is a pixel or two and the
// painted ground carries the look. For Ultra's grass across the hole (look/
// longgrass.js chunkDrawn), its clumps of real blades the dearest of the
// grass. Not the tufts: two triangles each, their thin haze far off is
// what gives a links hole's dunes their long grass from the air (without
// it the painted ground showed in streaks). The trees keep their own.
export const GRASS_REACH = { from: 4, to: 25, least: 0.55 };
export function heightReach(up) {
  const t = Math.min(1, Math.max(0, (up - GRASS_REACH.from) / (GRASS_REACH.to - GRASS_REACH.from)));
  return 1 - (1 - GRASS_REACH.least) * t * t * (3 - 2 * t);
}

// The safety valve's reach for detail drawn thinner with distance: half as
// far (the tufts, Ultra's grass across the hole) before any of it goes.
export const NEARER = 0.5;

// The share of something drawn d metres away that's all there out to
// `near`, thinning to `least` by `far` - both brought in by reach, and the
// far share with them (squared: little of it left at half the reach).
export function shareAt(d, { near, far, least }, reach = 1) {
  const r = Math.min(1, Math.max(0.1, reach));
  const n = near * r;
  const f = far * r;
  const lo = least * r * r;
  const t = Math.min(1, Math.max(0, (d - n) / (f - n)));
  return Math.max(lo, 1 - (1 - lo) * t * t * (3 - 2 * t));
}

// The field drawn two ways by distance (look/tuftfield.js; the owner, 18
// October 2026: "only the few metre of grass line closest to the player
// needs to be drawn decently. All other grass is behind grass or once in
// the air blending in. How low can we go with a grass object"):
//   near   within `near` to `out` metres of the camera - each tuft its own
//          point between (tuftSwitch), so they don't change at a line -
//          three splayed cards of drawn blades: 24 corners, 18 triangles;
//          gathered round the camera each time it has moved `move` metres
//   far    every other tuft: one card, 4 corners and 2 triangles, upright
//          and turned to face the camera, its blades drawn in it (no
//          picture: each blade worked out where it's drawn, and too fine
//          to draw blade by blade, their share of the card - so a far
//          tuft never thins to a dark stub as a cut-out picture does). As
//          many as the field's share at its distance (tuftShare,
//          heightShare), each one thinning out as the share passes its
//          own place in the field, by shrinking, never at once - and the
//          fewer there are, the wider each card, more blades across
//          (fanWiden: up to `widen` times), so the thinner field still
//          covers the ground - less so seen from above (`above`: from the
//          sine of the camera's height over the tuft at the first, to
//          none at the second), where a wide card is foreshortened to a
//          flat strip: from a ball's flight or a flyover a drift of hay
//          read as pale bricks. (The ground under it is painted its
//          colour: sim/hay.mjs paintHay.)
export const TUFT_LOD = { near: 12, out: 16, move: 4, widen: 2.5, above: [0.15, 0.45] };

// A parkland hole's long grass and hay always there (the owner, 29 October
// 2026: "The parklands long grass like the light brown grass it tends to
// sort of draw in as the camera's moving. It should always be there, even
// if it's far in distance, so that it doesn't appear as the camera's
// moving, but it can be really low triangles, really low graphics"): of a
// field kept (look/tuftfield.js tuftFieldMesh `keep`), never less than
// `least` of its far tufts drawn, however far off or high up the camera is
// - each widened (fanWiden), so it covers the ground as the full field
// does - rather than down to TUFT_FIELD.least, the rest growing up out of
// the ground as the camera came in. Their ground is the deep rough's
// green, under hay's pale straw: thinned, the hay all but went, and grew
// back as the camera came near. At most `most` tufts a field kept so (two
// triangles each): a hole drawn from a map has hundreds of thousands in its
// long grass, and keeps fewer of them; a links hole's long grass and hay,
// over their own straw ground, as before.
export const KEPT_FAR = { least: 0.4, most: 20000 };
// The share of a field of `count` tufts kept at any distance (0: none).
export function keptShare(count, kept = true) {
  if (!kept || !(count > 0)) return 0;
  const share = Math.min(KEPT_FAR.least, KEPT_FAR.most / count);
  return share > TUFT_FIELD.least ? share : 0;
}

// The ground under the long grass close to (look/grass.js; the owner, 24
// October 2026: "a more aggressive floor texture"): its blades bolder -
// lighter and darker round their average, `boost` times more at the
// camera, easing back to as they were from `from` to `to` metres off - so
// the ground between the near tufts reads as more grass, not a smooth
// floor. (mean: the blade picture's average, look/textures.js: as bright
// as without it, on average.)
export const NEAR_FLOOR = { boost: 0.8, from: 8, to: 24, mean: 0.733 };

// The distance (metres) a tuft turned `turn` radians (0 - pi: its own
// random, sim/holetufts.mjs) changes from near to far.
export function tuftSwitch(turn) {
  const f = Math.min(1, Math.max(0, turn / Math.PI));
  return TUFT_LOD.near + (TUFT_LOD.out - TUFT_LOD.near) * (f - Math.floor(f));
}

// How much wider a far tuft's card is drawn where the field's drawn at
// `share` of its tufts.
// sinUp: the sine of the camera's height over it (0 level, 1 straight
// above).
export function fanWiden(share, sinUp = 0) {
  const k = Math.min(TUFT_LOD.widen, Math.max(1, 1 / Math.max(share, 1e-3)));
  const [a, b] = TUFT_LOD.above;
  const t = Math.min(1, Math.max(0, (sinUp - a) / (b - a)));
  return k + (1 - k) * t * t * (3 - 2 * t);
}

// How tall each tuft stands, as a share of its field's height (the owner,
// 10 October 2026: "all seems to be same height... different variants of
// height so that it feels more natural"). Grass grows in stands, not tuft
// by tuft at random - a damper hollow lush and tall, a thin, dry rise
// short - so its height goes with where it is:
//   stands     patches about `scale` metres across, from `low` to `high`
//   clumps     smaller swells within a stand, `amount` either way
//   each       every tuft its own, `amount` either way
//   heads      the odd tuft run to seed, standing well above the rest
// and kept between `least` and `most`. x, z: world metres; seed: the
// field's (its clumps); r1, r2: the tuft's own randoms (0 - 1). Pure.
export const TUFT_HEIGHTS = {
  stands: { scale: 11, low: 0.6, high: 1.4 },
  clumps: { scale: 2.5, amount: 0.22 },
  each: 0.12,
  heads: { share: 0.06, tall: [1.35, 1.6] },
  least: 0.45,
  most: 1.75,
};
// The stand a spot is in (world x, z, metres): its share of the grass's
// height, the same for every kind of grass there - the rough's and long
// grass's tufts and the long grass round the ball (sim/longgrass.mjs) - so
// a tall stand is tall all through.
export function grassStand(x, z) {
  const H = TUFT_HEIGHTS.stands;
  // (Value noise sits near its middle: stretched, so the stands reach
  // their shortest and tallest.)
  const n = Math.min(1, Math.max(0, (valueNoise(x, z, H.scale, 0x57a) - 0.2) / 0.6));
  return H.low + (H.high - H.low) * n * n * (3 - 2 * n);
}
export function tuftHeight(x, z, r1, r2, seed = 0) {
  const H = TUFT_HEIGHTS;
  const stand = grassStand(x, z);
  const clump = 1 + H.clumps.amount * (2 * valueNoise(x, z, H.clumps.scale, seed + 17) - 1);
  const each = 1 + H.each * (2 * r1 - 1);
  const head = r2 < H.heads.share ? H.heads.tall[0] + (H.heads.tall[1] - H.heads.tall[0]) * (r2 / H.heads.share) : 1;
  return Math.min(H.most, Math.max(H.least, stand * clump * each * head));
}

// How a tuft's own light and dark - its blades lighter and darker, the
// shade at its foot - eases off with distance (metres from the camera,
// `from` to `to`), towards a flat `lift` times the ground's colour (and
// `ao` times more with the ambient occlusion on), by at most `most`: close to, every blade; from the air, one with the ground
// it grows from (the owner: "from height everything blends. From person
// height already looks great").
export const TUFT_BLEND = { from: 12, to: 60, lift: 1.2, ao: 1.3, most: 0.85 };
