// Several tee boxes on every hole of a course (the owner: "several tee
// boxes on every hole: red, yellow and white"): the yellow is the hole's
// own tee, where its line of play starts (0, 0) - the everyday one, and the
// length on its card; the white a little further back, the red further
// forward along the line. The round is played from one colour, every player
// alike (course.js, the panel's Tees); each box is there on every hole,
// with its markers, whichever is played.
//
// Worked out from the hole every time it's prepared (sim/courseplay.mjs
// prepareHole), so every hole ever saved has them, and every bay in an
// online game finds them in the same places. On a course from a map, its
// own tee boxes where it has them (the nearest behind the yellow the white,
// the nearest in front the red); otherwise a spot on clear ground - never
// in water, sand, on a green or a path (over the whole box), in the trees
// or under one, nor on or by another hole's green (where the course says
// where they are: the layout's otherGround, sim/treeclear.mjs - Sea Links'
// 9th white box sat on the 8th green) - stepped
// back towards the yellow until there is one. A box that can't be placed
// is the yellow's (the hole played from there).
//
// Pure, in the hole's frame (sim/course.mjs: the tee at (0, 0), x down the
// hole, z to the right, metres).

import { makePath, pointAt, surfaceAt, TEE_REACH, onTeeBox } from "./course.mjs";
import { pathByBox } from "./paths.mjs";
import { polygonCentroid, polygonBounds, insidePolygon, distanceToEdge } from "./terrain.mjs";
import { YARD } from "./flight.mjs";

// Back to front.
export const TEES = ["white", "yellow", "red"];
export const DEFAULT_TEE = "yellow";
export const TEE_NAMES = { white: "White", yellow: "Yellow", red: "Red" };
export const teeColour = (c) => (TEES.includes(c) ? c : DEFAULT_TEE);

// How far behind the yellow the white goes, and in front of it the red: a
// share of the hole's length, between the least and the most (metres).
export const WHITE_BACK = { share: 0.035, min: 8, max: 18 };
export const RED_FORWARD = {
  short: { share: 0.1, min: 6, max: 18 },
  long: { share: 0.11, min: 18, max: 55 },
};
// Round each spot, this far plays as tee (sim/course.mjs TEE_REACH).
export { TEE_REACH, onTeeBox };
// Where a box can't go.
const NOT_ON = new Set(["water", "bunker", "greenside", "waste", "green", "fringe", "path", "trees"]);
// A box keeps this far from a tree's trunk (metres).
const TREE_CLEAR = 5;
// And this far (from any of the spots looked at over it) off another
// hole's green.
export const OTHER_GREEN = 3;
// A box is moved back towards the yellow this far at a time (metres).
const STEP = 4;
// On a course from a map, its own tee boxes this far along the line, back
// or forward, and this close to it, are the hole's other tees.
const MAPPED_REACH = 90;

const r2 = (v) => Math.round(v * 100) / 100;
import { clamp } from "./mathutil.mjs";

// The hole's tee boxes: [{ colour, at: [x, z], ahead }] back to front -
// ahead: how far in front of the yellow along the line (metres; behind is
// negative). lie(x, z): what's on the ground there (surfaceAt by default).
export function teeSpots(L, { lie = null, path = makePath(L.path) } = {}) {
  const at = lie ?? ((x, z) => surfaceAt(L, x, z, path));
  const trees = (L.trees ?? []).filter((t) => Array.isArray(t) && Number.isFinite(t[0]) && Number.isFinite(t[1]));
  // Mapped ground only goes so far back (sim/mapcourse.mjs region).
  const backmost = Number.isFinite(L.region?.x0) ? L.region.x0 + TEE_REACH : -Infinity;
  // The other holes' greens, in this hole's frame.
  const greens = (L.otherGround ?? []).filter((o) => o?.lie === "green" && o.poly?.length > 2).map((o) => ({ poly: o.poly, b: polygonBounds(o.poly) }));
  const byGreen = (x, z) =>
    greens.some(({ poly, b }) => x > b.x0 - OTHER_GREEN && x < b.x1 + OTHER_GREEN && z > b.z0 - OTHER_GREEN && z < b.z1 + OTHER_GREEN && (insidePolygon(poly, x, z) || distanceToEdge(poly, x, z) < OTHER_GREEN));
  const clear = ([x, z]) => {
    if (x < backmost) return false;
    for (const [dx, dz] of [[0, 0], [4, 0], [-4, 0], [0, 4], [0, -4], [4, 4], [4, -4], [-4, 4], [-4, -4]]) if (NOT_ON.has(at(x + dx, z + dz)) || byGreen(x + dx, z + dz)) return false;
    // Nowhere near a path, over the whole box (a path between the spots
    // looked at above slipped through, under the box).
    if (pathByBox(L.paths, [x, z])) return false;
    return !trees.some((t) => Math.hypot(t[0] - x, t[1] - z) < TREE_CLEAR);
  };
  const length = path.length || (L.yards ?? 0) * YARD;
  const heading = pointAt(path, 0).dir;
  const yellow = { colour: "yellow", at: [0, 0], ahead: 0 };

  // A course from a map: its own boxes behind and in front, near the line.
  const mapped = L.source === "map" ? mappedBoxes(L) : { back: [], front: [] };

  let white = null;
  for (const c of mapped.back) {
    if (clear(c)) {
      white = { colour: "white", at: [r2(c[0]), r2(c[1])], ahead: r2(c[0]) };
      break;
    }
  }
  if (!white) {
    for (let d = clamp(WHITE_BACK.share * length, WHITE_BACK.min, WHITE_BACK.max); d >= WHITE_BACK.min - 1e-9; d -= STEP) {
      const p = [-heading[0] * d, -heading[1] * d];
      if (clear(p)) {
        white = { colour: "white", at: [r2(p[0]), r2(p[1])], ahead: r2(-d) };
        break;
      }
    }
  }

  let red = null;
  for (const c of mapped.front) {
    if (clear(c)) {
      red = { colour: "red", at: [r2(c[0]), r2(c[1])], ahead: r2(c[0]) };
      break;
    }
  }
  if (!red) {
    const f = L.par === 3 ? RED_FORWARD.short : RED_FORWARD.long;
    // Never so far forward it's within a quarter of the hole of the green.
    const most = Math.min(f.max, length * 0.25);
    for (let d = clamp(f.share * length, f.min, most); d >= f.min - 1e-9; d -= STEP) {
      const { p } = pointAt(path, d);
      if (clear(p)) {
        red = { colour: "red", at: [r2(p[0]), r2(p[1])], ahead: r2(d) };
        break;
      }
    }
  }

  return [white ?? { ...yellow, colour: "white" }, yellow, red ?? { ...yellow, colour: "red" }];
}

// A mapped hole's own tee boxes along its line: the middles of those
// behind the yellow (nearest first) and in front of it.
function mappedBoxes(L) {
  const back = [];
  const front = [];
  for (const t of L.tees ?? []) {
    if (!Array.isArray(t) || t.length < 3) continue;
    const [cx, cz] = polygonCentroid(t);
    if (Math.abs(cx) > MAPPED_REACH || Math.abs(cz) > 18 + Math.abs(cx) * 0.15) continue;
    // The yellow's own box, round where the line starts.
    if (Math.hypot(cx, cz) < 8) continue;
    (cx < 0 ? back : front).push([cx, cz]);
  }
  back.sort((a, b) => b[0] - a[0]);
  front.sort((a, b) => a[0] - b[0]);
  return { back, front };
}

// The spot a colour plays from (the yellow's if the hole has no boxes).
export function teeSpot(spots, colour) {
  return spots?.find((t) => t.colour === teeColour(colour)) ?? { colour: DEFAULT_TEE, at: [0, 0], ahead: 0 };
}

// The hole's yards from a colour: the card's yards (the yellow's) with
// what the box is back or forward along the line.
export function teeYards(yards, spots, colour) {
  const t = teeSpot(spots, colour);
  return Math.max(1, Math.round(yards - t.ahead / YARD));
}
