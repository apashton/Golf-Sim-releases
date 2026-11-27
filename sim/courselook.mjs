// A real course's own turf, sand, long grass and haze (public/sim/turf.mjs,
// public/sim/bunkerlook.mjs), from its definition (tools/realcourses/
// <name>.json):
//
//   "turf":  { "tint": [r, g, b], "stripes": 0 - 1, "tees": 0 - 1, "rough": [r, g, b] }
//            onto every hole's layout.turf
//   "grass": { "flowers": 0 - 1, "marram": 0 - 1, "long": metres, ...the
//            rough's dressing's kinds: 0 - 1 } onto every hole's layout.grass
//   "sand":  a SANDS key, onto the course (course.sand)
//   "haze":  how thick the haze against anywhere else, onto the course
//            (course.haze)
//   "gravel": the colour of its gravel paths ("#rrggbb", or { "colour" }),
//            onto the course (course.gravel) - a course whose paths are
//            red hoggin, not the game's pale buff (sim/turf.mjs ownGravel)
//
// Each may carry a "why" (how its numbers were read from the photographs),
// which stays in the definition: only the numbers reach the course file.
// A definition without them leaves the course as the import made it.
//
// Run by tools/realcourse.mjs (makeRealCourse): lookStep with the holes
// (the steps' shared contract: (holes, def, helpers) -> holes), then
// courseLook on the made course for its own two.

import { SANDS } from "./bunkerlook.mjs";
import { TINT_RANGE, HAZE_RANGE } from "./turf.mjs";

const r3 = (v) => Math.round(v * 1000) / 1000;
const isNum = (v) => typeof v === "number" && Number.isFinite(v);

function tint(t, what) {
  if (!Array.isArray(t) || t.length !== 3 || !t.every(isNum)) throw new Error(`${what}: three numbers, red, green and blue`);
  if (t.some((v) => v < TINT_RANGE[0] || v > TINT_RANGE[1])) throw new Error(`${what}: each between ${TINT_RANGE[0]} and ${TINT_RANGE[1]}`);
  return t.map(r3);
}
function share(v, what) {
  if (!isNum(v) || v < 0 || v > 1) throw new Error(`${what}: a share, 0 - 1`);
  return r3(v);
}

// The definition's turf as a layout keeps it (its numbers only), or null.
export function cleanTurf(t) {
  if (t == null) return null;
  const out = {};
  if (t.tint != null) out.tint = tint(t.tint, "turf.tint");
  if (t.stripes != null) out.stripes = share(t.stripes, "turf.stripes");
  if (t.tees != null) out.tees = share(t.tees, "turf.tees");
  if (t.rough != null) out.rough = tint(t.rough, "turf.rough");
  return Object.keys(out).length ? out : null;
}

// The definition's long grass as a layout keeps it, or null.
export function cleanGrass(g) {
  if (g == null) return null;
  const out = {};
  for (const [k, v] of Object.entries(g)) {
    if (k === "why") continue;
    if (k === "long") {
      if (!isNum(v) || v < 0.1 || v > 2) throw new Error("grass.long: metres, 0.1 - 2");
      out.long = r3(v);
    } else out[k] = share(v, `grass.${k}`);
  }
  return Object.keys(out).length ? out : null;
}

// Every hole's layout.turf and layout.grass from the definition.
// helpers ({ placed, prepareHole }) aren't needed: the same on every hole.
export function lookStep(holes, def, helpers = {}) {
  void helpers;
  const turf = cleanTurf(def.turf);
  const grass = cleanGrass(def.grass);
  if (!turf && !grass) return holes;
  return holes.map((h) => ({ ...h, layout: { ...h.layout, ...(turf ? { turf } : {}), ...(grass ? { grass } : {}) } }));
}

// The made course with its own sand and haze, and every hole's turf and
// long grass (lookStep).
export function courseLook(course, def) {
  const out = { ...course, holes: lookStep(course.holes, def) };
  if (def.sand != null) {
    if (typeof def.sand !== "string" || !Object.hasOwn(SANDS, def.sand)) throw new Error(`sand: one of ${Object.keys(SANDS).join(", ")}`);
    out.sand = def.sand;
  }
  if (def.haze != null) {
    if (!isNum(def.haze) || def.haze < HAZE_RANGE[0] || def.haze > HAZE_RANGE[1]) throw new Error(`haze: ${HAZE_RANGE[0]} - ${HAZE_RANGE[1]}`);
    out.haze = r3(def.haze);
  }
  if (def.gravel != null) {
    const colour = typeof def.gravel === "string" ? def.gravel : def.gravel.colour;
    if (!/^#[0-9a-f]{6}$/i.test(colour ?? "")) throw new Error('gravel: a colour, "#rrggbb"');
    out.gravel = colour.toLowerCase();
  }
  return out;
}
