// Which hole each shape on a hole from the map is (the owner: "the main
// fairway or fairways for that hole and not a nearby hole should be on that
// map, nearby fairways will be loaded in their map"). A hole from the map
// (mapcourse.mjs) keeps every green, tee, fairway, bunker and pond in its
// box - its neighbours' with its own, as the ground really has them, so play
// shows them where they are. Each is the hole's whose line it lies on:
//
//   a green     the hole whose line ends on it (the hole's own is
//               layout.green; these are the others near it)
//   a tee       the hole whose line starts on it or runs back across it
//               (a hole's forward tees sit along its first stretch)
//   a fairway   the hole whose line runs down it the furthest - two that
//               share one big fairway both have it
//   sand, water the hole whose line passes nearest
//
// The designer draws other holes' shapes in red and leaves them alone (and
// a tap on one goes to that hole); the course map draws each only with its
// own hole; the import's report counts only the hole's own. Where it's not
// clear, the owner says ("If that needs to be a user decision that's ok"):
// layout.ownerSaid { "fairways:2": 7 } - that shape is hole 7's. Pure.

import { coursePlaces, toCourse } from "./imaginary.mjs";
import { insidePolygon, distanceToEdge, polygonCentroid, polygonBounds } from "./terrain.mjs";
import { lineDistance } from "./country.mjs";

export const OWNED = ["greens", "tees", "fairways", "bunkers", "water"];

// A green this far from where a hole's line ends is no hole's (a practice
// green); a hole's tees run this far down its line; sand or water this
// close to the hole's line, however near another's, is the hole's too.
const GREEN_REACH = 40;
const TEE_STRETCH = 150;
const NEAR_ENOUGH = 6;
// Past the green, where its back bunkers are.
const BEYOND_GREEN = 30;

const polyOf = (list, s) => (list === "bunkers" || list === "water" ? s?.poly : s);

const lengthOf = (line) => line.reduce((d, p, i) => (i ? d + Math.hypot(p[0] - line[i - 1][0], p[1] - line[i - 1][1]) : 0), 0);

// The first `upTo` metres of a line.
function firstStretch(line, upTo) {
  const out = [line[0]];
  let s = 0;
  for (let i = 1; i < line.length; i++) {
    const [ax, az] = line[i - 1];
    const [bx, bz] = line[i];
    const d = Math.hypot(bx - ax, bz - az);
    if (s + d >= upTo) {
      const t = d ? (upTo - s) / d : 0;
      out.push([ax + (bx - ax) * t, az + (bz - az) * t]);
      return out;
    }
    out.push(line[i]);
    s += d;
  }
  return out;
}

// A line carried on `by` metres past its end, the way it was going.
function carriedOn(line, by) {
  if (line.length < 2) return line;
  const [ax, az] = line[line.length - 2];
  const [bx, bz] = line[line.length - 1];
  const d = Math.hypot(bx - ax, bz - az) || 1;
  return [...line, [bx + ((bx - ax) / d) * by, bz + ((bz - az) / d) * by]];
}

// How far (metres) a line runs inside a polygon, from points every 4 m.
// (A stretch wholly outside the polygon's box is passed over, and a point
// outside it isn't tested: neither can be inside - the same answer, sooner.)
function lengthInside(poly, line) {
  const { x0, z0, x1, z1 } = polygonBounds(poly);
  let inside = 0;
  for (let i = 1; i < line.length; i++) {
    const [ax, az] = line[i - 1];
    const [bx, bz] = line[i];
    if (Math.max(ax, bx) < x0 || Math.min(ax, bx) > x1 || Math.max(az, bz) < z0 || Math.min(az, bz) > z1) continue;
    const d = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.ceil(d / 4));
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n;
      const x = ax + (bx - ax) * t;
      const z = az + (bz - az) * t;
      if (x < x0 || x > x1 || z < z0 || z > z1) continue;
      if (insidePolygon(poly, x, z)) inside += d / n;
    }
  }
  return inside;
}

// How near a line comes to a polygon: 0 where it crosses it.
function gapTo(poly, line) {
  if (line.some(([x, z]) => insidePolygon(poly, x, z)) || lengthInside(poly, line) > 0) return 0;
  let best = Infinity;
  for (const [x, z] of poly) best = Math.min(best, lineDistance(line, x, z));
  return best;
}

// Each hole's line on the course's ground: { line, start, end, stretch,
// reach } (stretch: its first TEE_STRETCH metres; reach: carried on past
// the green). Null for a hole with no place or line.
function linesOf(course, places) {
  return (course?.holes ?? []).map((h, i) => {
    const L = h?.layout;
    const place = places?.[i];
    if (!L?.path?.length || !place) return null;
    const line = L.path.map((p) => toCourse(place, p));
    const end = toCourse(place, L.pin ?? L.path[L.path.length - 1]);
    return { line, start: line[0], end, stretch: firstStretch(line, Math.min(TEE_STRETCH, lengthOf(line) * 0.45)), reach: carriedOn(line, BEYOND_GREEN) };
  });
}

// Which hole (index) a shape of hole `me` is - polygon `poly` on the
// course's ground - or -1 for none (a green no line ends near).
function ownerOf(list, poly, lines, me) {
  const each = (fn) => lines.forEach((h, j) => h && fn(h, j));
  if (list === "greens") {
    // Another green: the hole whose line ends on it.
    let best = -1;
    let bd = GREEN_REACH;
    each((h, j) => {
      if (j === me) return;
      const d = insidePolygon(poly, ...h.end) ? 0 : distanceToEdge(poly, ...h.end);
      if (d < bd) {
        bd = d;
        best = j;
      }
    });
    return best;
  }
  if (list === "tees") {
    // The hole whose first stretch is nearest the tee.
    const [cx, cz] = polygonCentroid(poly);
    let best = me;
    let bd = Infinity;
    each((h, j) => {
      const d = insidePolygon(poly, ...h.start) ? 0 : lineDistance(h.stretch, cx, cz);
      if (d < bd - (j === me ? -NEAR_ENOUGH : 0)) {
        bd = d;
        best = j;
      }
    });
    return best;
  }
  if (list === "fairways") {
    // The hole whose line runs down it furthest; this hole's too if its
    // line runs a good way down it (one fairway shared by two holes).
    const runs = lines.map((h) => (h ? lengthInside(poly, h.line) : 0));
    const most = Math.max(...runs);
    if (most > 0) {
      if (runs[me] > 15 && runs[me] >= most * 0.3) return me;
      return runs.indexOf(most);
    }
  }
  // Sand, water, and a fairway no line runs down: the nearest line, this
  // hole's if it's near enough to it either way.
  const gaps = lines.map((h) => (h ? gapTo(poly, h.reach) : Infinity));
  const near = Math.min(...gaps);
  if (gaps[me] <= near + NEAR_ENOUGH) return me;
  return gaps.indexOf(near);
}

// The hole (index) each of hole `index`'s shapes is: { greens, tees,
// fairways, bunkers, water }, each an array lined up with the layout's own
// list (-1: no hole's). A designed hole's are all its own. places: the
// holes' places (coursePlaces), if known already.
export function shapeOwners(course, index, { places = coursePlaces(course) } = {}) {
  const holes = course?.holes ?? [];
  const L = holes[index]?.layout;
  const out = {};
  for (const list of OWNED) out[list] = (L?.[list] ?? []).map(() => index);
  if (L?.source !== "map" || !places?.[index]) return out;
  const lines = linesOf(course, places);
  if (!lines[index]) return out;
  const toC = (p) => toCourse(places[index], p);
  for (const list of OWNED) {
    (L[list] ?? []).forEach((s, k) => {
      const poly = polyOf(list, s);
      if (!poly || poly.length < 3) return;
      out[list][k] = ownerOf(list, poly.map(toC), lines, index);
    });
  }
  // What the owner has said over the sums: { "fairways:2": hole number }.
  const byNumber = new Map(holes.map((h, i) => [h?.spec?.number ?? i + 1, i]));
  for (const [key, number] of Object.entries(L.ownerSaid ?? {})) {
    const [list, k] = key.split(":");
    const j = byNumber.get(number);
    if (out[list] && j != null && Number(k) >= 0 && Number(k) < out[list].length) out[list][Number(k)] = j;
  }
  return out;
}

// Every hole's owners at once, kept for the course as it stands (the course
// map draws them all, often).
const kept = new WeakMap();
export function courseOwners(course) {
  if (!course || typeof course !== "object") return [];
  let all = kept.get(course);
  if (!all) {
    const places = coursePlaces(course);
    all = (course.holes ?? []).map((h, i) => shapeOwners(course, i, { places }));
    kept.set(course, all);
  }
  return all;
}

// A hole's layout with only its own shapes in its lists (owners: from
// shapeOwners) - for drawing it on the course map, or as a neighbour.
export function ownShapesOnly(L, owners, index) {
  if (L?.source !== "map" || !owners) return L;
  const out = { ...L };
  for (const list of OWNED) if (Array.isArray(L[list])) out[list] = L[list].filter((s, k) => (owners[list]?.[k] ?? index) === index);
  return out;
}

// The owner's word on a shape: hole `number`'s (null: back to the sums).
export function sayOwner(L, list, k, number) {
  const said = { ...(L.ownerSaid ?? {}) };
  if (number == null) delete said[`${list}:${k}`];
  else said[`${list}:${k}`] = number;
  const out = { ...L };
  if (Object.keys(said).length) out.ownerSaid = said;
  else delete out.ownerSaid;
  return out;
}

// A course from the map or on hills with hole i about to move (sim/
// coursewide.mjs moveHole): each hole's layout keeps the shapes round it
// - its neighbours' greens, tees, fairways, sand and water too - so before
// it goes, hole i keeps only its own, and every other hole lets go of
// hole i's (the owner: moving holes "left copies of the original holes in
// the original place"; the moved hole carried its old neighbours' with
// it, too). Ownership as the holes stand now (shapeOwners), the owner's
// word on a shape kept with it (ownerSaid's numbers follow the shapes).
export function separateHole(course, i) {
  const holes = course?.holes ?? [];
  if (!holes[i]?.layout) return course;
  const owners = courseOwners(course);
  const out = holes.map((h, j) => {
    const L = h?.layout;
    if (L?.source !== "map" || !owners[j]) return h;
    const keep = (list, k) => {
      const o = owners[j][list]?.[k] ?? j;
      return j === i ? o === i : o !== i;
    };
    const layout = { ...L };
    let changed = false;
    const said = {};
    for (const list of OWNED) {
      if (!Array.isArray(L[list])) continue;
      const kept = [];
      L[list].forEach((s, k) => {
        if (!keep(list, k)) return;
        const was = L.ownerSaid?.[`${list}:${k}`];
        if (was != null) said[`${list}:${kept.length}`] = was;
        kept.push(s);
      });
      if (kept.length !== L[list].length) {
        layout[list] = kept;
        changed = true;
      } else for (const [key, v] of Object.entries(L.ownerSaid ?? {})) if (key.startsWith(`${list}:`)) said[key] = v;
    }
    if (!changed) return h;
    if (Object.keys(said).length) layout.ownerSaid = said;
    else delete layout.ownerSaid;
    return { ...h, layout };
  });
  return { ...course, holes: out };
}
