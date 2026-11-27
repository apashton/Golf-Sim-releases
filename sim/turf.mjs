// A course's own turf, long grass and haze: what a course can say about
// how its ground looks, beyond the palette every course shares - a real
// course's from its photographs (tools/realsteps/look.mjs). A course that
// says nothing is drawn exactly as before. Pure: the shaders and meshes
// that read it are look/mappedground.js (the ground of a hole from a map),
// look/groundbits.js (Ultra's short grass, the tufts' grasses), course.js
// (the ground beyond the hole, the haze) and course/holescenery.js (what
// grows in the long grass, the other holes painted round it).
//
// layout.turf (each hole's; all optional):
//   tint     [r, g, b] the mown grass's colour times this (linear light):
//            fairways, the first cut, tees, fringes and greens
//   stripes  0 - 1, how strong the fairways' and greens' mowing stripes
//            are (1 as always, 0 none) - about their middle shade, so the
//            grass is as bright overall however faint the stripes
//   tees     0 - 1, the same for the tees' stripes (0: plain tees)
//   rough    [r, g, b] the long grass's colour times this (linear light):
//            the rough and the deep rough, their tufts and the long grass
//            round the ball - the green grasses' (rough, deep rough, a
//            green links hole's long green), not the fescue, dune rough or
//            hay, which have their own straw colours
// layout.grass (each hole's; all optional):
//   flowers  0 - 1, the share of the rough's wildflowers kept (and of the
//            daisies and dandelions painted on the ground close to)
//   marram   0 - 1, the share of a links hole's marram on its crests kept
//   long     metres: how tall the long grass's tufts stand, on the whole
//            (as always without: sim/tufts.mjs TUFT_FIELD.height)
//   any other kind of the rough's dressing (sim/dressing.mjs: gorse,
//   heather, fescue, bracken, stumps, reeds, ...): 0 - 1, the share kept
// course.haze: how thick the haze is there against anywhere else (1 as
// always, 0.5 half as thick: a clearer air).

import { clamp } from "./mathutil.mjs";
import { SANDS } from "./bunkerlook.mjs";

export const TURF_PLAIN = { tint: [1, 1, 1], stripes: 1, tees: 1, rough: [1, 1, 1] };
// How far a tint may go either way, each of its three.
export const TINT_RANGE = [0.25, 4];
// The course's haze, the most either way.
export const HAZE_RANGE = [0.2, 2];

const num = (v, d) => (typeof v === "number" && Number.isFinite(v) ? v : d);
const tintOf = (t) => (Array.isArray(t) && t.length === 3 ? t.map((v) => clamp(num(v, 1), TINT_RANGE[0], TINT_RANGE[1])) : [1, 1, 1]);
const share = (v) => clamp(num(v, 1), 0, 1);

// A hole's turf (layout.turf), every part there and in range.
export function turfOf(L) {
  const t = L?.turf;
  if (!t || typeof t !== "object") return { tint: [1, 1, 1], stripes: 1, tees: 1, rough: [1, 1, 1] };
  return { tint: tintOf(t.tint), stripes: share(t.stripes), tees: share(t.tees), rough: tintOf(t.rough) };
}

// Whether a turf is as every course's always was.
export function plainTurf(t) {
  return t.stripes === 1 && t.tees === 1 && t.tint.every((v) => v === 1) && t.rough.every((v) => v === 1);
}

// A hole's long grass (layout.grass): { flowers, marram, long, keep } -
// keep: each kind of the rough's dressing's share kept (flowers among
// them). As always without: everything kept, the tufts their own height.
export function grassOf(L) {
  const g = L?.grass && typeof L.grass === "object" ? L.grass : {};
  const keep = {};
  for (const [k, v] of Object.entries(g)) if (k !== "long" && k !== "marram" && typeof v === "number") keep[k] = share(v);
  const long = num(g.long, null);
  return { flowers: share(g.flowers), marram: share(g.marram), long: long == null ? null : clamp(long, 0.1, 2), keep };
}

// A number 0 - 1 for the i-th of a kind (its own salt), so a share kept is
// the same ones every time.
function pick(i, salt) {
  let h = Math.imul(i + 1, 0x9e3779b1) ^ Math.imul(salt + 7, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}
const saltOf = (kind) => [...kind].reduce((s, c) => Math.imul(s ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;

// The share of a list kept (the same ones every time; all of it at 1).
export function keepShare(list, k, kind = "") {
  if (!Array.isArray(list) || k >= 1) return list;
  if (k <= 0) return [];
  const salt = saltOf(kind);
  return list.filter((_, i) => pick(i, salt) < k);
}

// The rough's dressing (sim/dressing.mjs, once thinned for the hole's
// character: sim/country.mjs dressFor) thinned for the hole's long grass:
// only ever fewer.
export function keepDressing(dressing, grass) {
  if (!dressing || !grass) return dressing;
  let out = dressing;
  for (const [kind, k] of Object.entries(grass.keep ?? {})) {
    if (k >= 1 || !Array.isArray(out[kind])) continue;
    if (out === dressing) out = { ...dressing };
    out[kind] = keepShare(out[kind], k, kind);
  }
  return out;
}

// The tuft field's heights (sim/tufts.mjs TUFT_FIELD.height: the rough's,
// the long grass's, hay's) with the long grass's the course's own (long,
// metres; as they are with none).
export function longTufts(tall, long) {
  return long == null ? tall : [tall[0], long, tall[2]];
}

// A links hole's ground (sim/linksground.mjs) with its marram thinned.
export function keepMarram(ground, grass) {
  if (!ground || !grass || grass.marram >= 1) return ground;
  return { ...ground, marram: keepShare(ground.marram ?? [], grass.marram, "marram") };
}

// The course's haze (course.haze): how thick against anywhere else.
export function courseHaze(course) {
  const h = course?.haze;
  return typeof h === "number" && Number.isFinite(h) && h > 0 ? clamp(h, HAZE_RANGE[0], HAZE_RANGE[1]) : 1;
}

// The sand a course names for itself (course.sand, a SANDS key: sim/
// bunkerlook.mjs courseSand), or null. Only such a course has the sand of
// its holes from a map - their ground's, their walled bunkers' - and of the
// other holes drawn round a hole in it: every other course's are as they
// always were (a hills course's golden on its ground, whatever its
// courseSand; a designed course's other holes in the palette's sand).
export function ownSand(course) {
  return typeof course?.sand === "string" && Object.hasOwn(SANDS, course.sand) ? course.sand : null;
}
// The colour of a course's own gravel paths (course.gravel, "#rrggbb"), or
// null: the game's (look/palette.js pathGravel).
export function ownGravel(course) {
  return typeof course?.gravel === "string" && /^#[0-9a-f]{6}$/i.test(course.gravel) ? course.gravel.toLowerCase() : null;
}
export function ownSandTint(course) {
  const s = ownSand(course);
  return s ? SANDS[s].tint : [1, 1, 1];
}

// ---- Colours ---------------------------------------------------------------------

const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
// "#rrggbb" in linear light, and back.
export function hexLinear(hex) {
  const h = String(hex).replace("#", "");
  return [0, 2, 4].map((i) => toLin(parseInt(h.slice(i, i + 2), 16) / 255));
}
export function linearHex(rgb) {
  return `#${rgb.map((v) => Math.round(clamp(toSrgb(clamp(v, 0, 1)), 0, 1) * 255).toString(16).padStart(2, "0")).join("")}`;
}

// A colour (linear [r, g, b]) times a tint.
export const tinted = (rgb, t) => rgb.map((v, i) => v * t[i]);

// A light and dark stripe brought together about their middle by k (1 as
// they are, 0 both the middle shade), linear [r, g, b] each: as the map
// ground's shader does its stripes (look/mappedground.js).
export function stripePair(light, dark, k) {
  const mid = light.map((v, i) => (v + dark[i]) / 2);
  return [mid.map((m, i) => m + (light[i] - m) * k), mid.map((m, i) => m + (dark[i] - m) * k)];
}

// A grass's options (look/grass.js GRASS: light, dark) in the long grass's
// tint, for the ground beyond a hole from a map (course.js), which is its
// deep rough carried on.
export function tintedGrass(g, rough) {
  if (rough.every((v) => v === 1)) return g;
  const t = (hex) => linearHex(tinted(hexLinear(hex), rough));
  return { ...g, light: t(g.light), dark: t(g.dark) };
}

// A mown grass's options (look/grass.js GRASS: light, dark) in a turf's
// tint, its stripes as strong as the turf has them (or `stripes`), for the
// course's other holes drawn round a hole (course/holescenery.js
// cropSurfaceSteps).
export function turfGrass(g, turf, stripes = turf.stripes) {
  if (stripes === 1 && turf.tint.every((v) => v === 1)) return g;
  const [light, dark] = stripePair(hexLinear(g.light), hexLinear(g.dark), stripes).map((c) => linearHex(tinted(c, turf.tint)));
  return { ...g, light, dark };
}

// A colour (hex) with a sand's tint as the sand's shader takes it (look/
// sandwater.js sandColour: on the colour as written, not linear light).
export function sandHex(hex, tint = [1, 1, 1]) {
  if (tint.every((v) => v === 1)) return hex;
  return linearHex(hexLinear(hex).map((v, i) => toLin(clamp(toSrgb(v) * tint[i], 0, 1))));
}

// The colours the course's other holes are painted in round a hole (look/
// country.js courseColours, linear light), in this course's turf and sand:
// sandTint over the palette's sand as the sand's shader takes it (look/
// sandwater.js sandColour: on the colour as written, not linear light).
export function turfColours(colours, turf, sandTint = [1, 1, 1]) {
  if (plainTurf(turf) && sandTint.every((v) => v === 1)) return colours;
  const mown = (c) => tinted(c, turf.tint);
  const pair = (p) => stripePair(p[0], p[1], turf.stripes).map(mown);
  const sand = colours.sand.map((v, i) => toLin(clamp(toSrgb(v) * sandTint[i], 0, 1)));
  return {
    ...colours,
    fairway: pair(colours.fairway),
    linksFairway: colours.linksFairway ? pair(colours.linksFairway) : colours.linksFairway,
    green: pair(colours.green),
    fringe: mown(colours.fringe),
    tee: mown(colours.tee),
    sand,
    collar: tinted(colours.collar, turf.rough),
    longGreen: colours.longGreen ? tinted(colours.longGreen, turf.rough) : colours.longGreen,
  };
}
