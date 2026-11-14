// One height map for the whole course (docs/COURSE-LOD-PLAN.md, stage 1):
// the ground anywhere on or round a course, in its own metres (east and
// north, as coursePlaces puts its holes), the same whichever hole it's
// asked from - so the parts of the neighbouring holes laid into a hole's
// map (hole + 400 m, a later stage) lie on their own ground, and two holes'
// maps agree where they overlap.
//
// Each hole keeps its own heights in its own frame (relative to its tee):
//   - a mapped hole (and a course on hills, whose holes are mapped from
//     the made-up hills) its grid (layout.terrain) over its box
//     (layout.region), its tee at layout.geo.teeHeight
//   - a designed hole its shaped ground (courseplay.mjs prepareHole's
//     heightAt) out to its tree line and the deep rough, its tee at 0
// Between and beyond them:
//   - a course on hills: the hills it was made from (imaginary.mjs
//     courseField)
//   - a mapped course: the nearest holes' edges, eased between (no data
//     there yet - a later stage may fetch the course's whole box)
//   - a designed course: level ground, 0
// Inside a hole's own ground its own heights are used exactly, so the hole
// being played is unchanged (holeHeightField); a hole's edge fades into
// the field over FIELD.feather metres. Pure: no Three.js.

import { coursePlaces, toCourse, courseField } from "./imaginary.mjs";
import { isHills } from "./coursewide.mjs";
import { holeFrame, unpackGrid, gridHeight } from "./terrain.mjs";
import { prepareHole } from "./courseplay.mjs";
import { lineDistance, boxDistance } from "./country.mjs";
import { smoothstep01 } from "./mathutil.mjs";

export const FIELD = {
  // A hole's own heights fade into the field over this many metres past
  // its own ground.
  feather: 40,
  // A designed hole's own ground: its tree line and this much more (its
  // deep rough, as sim/neighbours.mjs NEIGHBOURS.own).
  designedPad: 30,
  // Round a designed hole's green and tee, at least this far.
  greenPad: 55,
  teePad: 20,
  // A mapped course's ground between holes: the nearest edges weighted by
  // 1 / (d + soften)^2.
  soften: 10,
};

// One hole's part: its frame, where its own ground is (core: 0 inside,
// metres past it outside) and its heights there, relative to its tee
// (local), and its tee's height on the course (datum).
function holePart(h, i, place, heightOf) {
  const L = h?.layout;
  if (!L?.path?.length || !place) return null;
  const frame = holeFrame([place.x, place.z], place.heading);
  const mapped = L.source === "map" && L.terrain && L.region;
  let local;
  let past;
  let box;
  if (mapped) {
    const r = L.region;
    let grid = null;
    local = heightOf?.(i) ?? ((x, z) => gridHeight((grid ??= unpackGrid(L.terrain)), x, z));
    past = (x, z) => boxDistance(r, x, z);
    box = r;
  } else {
    let hole = null;
    local = heightOf?.(i) ?? ((x, z) => (hole ??= prepareHole(L)).heightAt(x, z));
    const reach = (L.treeLine ?? 40) + FIELD.designedPad;
    const pin = L.pin ?? L.path.at(-1);
    past = (x, z) => Math.min(lineDistance(L.path, x, z) - reach, Math.hypot(x - pin[0], z - pin[1]) - FIELD.greenPad, Math.hypot(x, z) - FIELD.teePad);
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const [x, z] of L.path) {
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
    }
    const pad = Math.max(reach, FIELD.greenPad);
    box = { x0: x0 - pad, x1: x1 + pad, z0: z0 - pad, z1: z1 + pad };
  }
  const datum = mapped ? (L.geo?.teeHeight ?? 0) : 0;
  // Its box in course metres (for skipping it quickly when far off).
  const corners = [[box.x0, box.z0], [box.x1, box.z0], [box.x0, box.z1], [box.x1, box.z1]].map((p) => frame.toLocal(p));
  const f = FIELD.feather;
  const reachBox = {
    x0: Math.min(...corners.map((c) => c[0])) - f,
    x1: Math.max(...corners.map((c) => c[0])) + f,
    z0: Math.min(...corners.map((c) => c[1])) - f,
    z1: Math.max(...corners.map((c) => c[1])) + f,
  };
  return { index: i, mapped: !!mapped, frame, local, past, box, datum, reachBox };
}

// How much of hole `p`'s own heights count at its frame's (x, z): 1 on its
// own ground, easing to 0 over the feather.
const weightOf = (p, x, z) => {
  const d = p.past(x, z);
  if (d <= 0) return 1;
  if (d >= FIELD.feather) return 0;
  return 1 - smoothstep01(d / FIELD.feather);
};

const kept = new WeakMap();

// The course's height field: { at(east, north) -> metres, parts, kind }.
// heightOf(i): optionally hole i's own heights as already prepared (the
// hole being played's, so none are worked out twice). Kept per course
// object (a changed course is a new object).
export function courseHeightField(course, { heightOf = null } = {}) {
  if (!heightOf && course && kept.has(course)) return kept.get(course);
  const holes = course?.holes ?? [];
  const places = holes.length ? coursePlaces(course) : [];
  const parts = holes.map((h, i) => holePart(h, i, places[i], heightOf));
  const live = parts.filter(Boolean);
  const hills = isHills(course) && course.source?.origin ? courseField(course, places) : null;
  const kind = hills ? "hills" : live.some((p) => p.mapped) ? "mapped" : "designed";
  // Between the holes of a mapped course: their edges, the nearest most.
  const between = (e, n) => {
    let sw = 0;
    let sh = 0;
    for (const p of live) {
      if (!p.mapped) continue;
      const [x, z] = p.frame.toHole([e, n]);
      const cx = Math.min(Math.max(x, p.box.x0), p.box.x1);
      const cz = Math.min(Math.max(z, p.box.z0), p.box.z1);
      const d = Math.hypot(x - cx, z - cz);
      const w = 1 / (d + FIELD.soften) ** 2;
      sw += w;
      sh += w * (p.local(cx, cz) + p.datum);
    }
    return sw ? sh / sw : 0;
  };
  const ground = hills ?? (kind === "mapped" ? between : () => 0);
  const at = (e, n) => {
    let sw = 0;
    let sh = 0;
    for (const p of live) {
      const b = p.reachBox;
      if (e < b.x0 || e > b.x1 || n < b.z0 || n > b.z1) continue;
      const [x, z] = p.frame.toHole([e, n]);
      const w = weightOf(p, x, z);
      if (w <= 0) continue;
      sw += w;
      sh += w * (p.local(x, z) + p.datum);
    }
    if (sw >= 1) return sh / sw;
    return sh + (1 - sw) * ground(e, n);
  };
  const field = { at, parts, kind, ground };
  if (!heightOf && course) kept.set(course, field);
  return field;
}

// The field in hole `index`'s own frame and terms (heights relative to its
// tee, as the hole's own heightAt): on its own ground exactly its own
// heights (own: the hole's heightAt as played - default its prepared
// ground), past it the course's field, eased between over the feather.
export function holeHeightField(course, index, { own = null, field = null } = {}) {
  const f = field ?? courseHeightField(course);
  const p = f.parts[index];
  if (!p) return own ?? (() => 0);
  const mine = own ?? p.local;
  return (x, z) => {
    const w = weightOf(p, x, z);
    if (w >= 1) return mine(x, z);
    const [e, n] = p.frame.toLocal([x, z]);
    const there = f.at(e, n) - p.datum;
    return w <= 0 ? there : w * mine(x, z) + (1 - w) * there;
  };
}
