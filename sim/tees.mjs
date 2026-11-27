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
// the nearest in front the red - or the ones the course names for the hole,
// layout.teeAt); otherwise a spot on clear ground - never
// in water, sand, on a green or a path (over the whole box), in the trees
// or under one, nor on or by another hole's green (where the course says
// where they are: the layout's otherGround, sim/treeclear.mjs - Sea Links'
// 9th white box sat on the 8th green) - stepped
// back towards the yellow until there is one. A box that can't be placed
// is the yellow's (the hole played from there).
//
// A hole the course maker made from its second round on (sim/maker.mjs)
// names its own white and red (layout.teeAt, sim/teesets.mjs: at a real
// spread, each to one side of the line), on its hills or off them - each
// box its own size (sim/teesets.mjs TEE_SETS.size: the rest are
// TEE_REACH's square); one not clear tried again nearer the
// yellow, as far to the side, a step at a time.
//
// Pure, in the hole's frame (sim/course.mjs: the tee at (0, 0), x down the
// hole, z to the right, metres).

import { makePath, pointAt, nearest, surfaceAt, TEE_REACH, onTeeBox } from "./course.mjs";
import { pathByBox } from "./paths.mjs";
import { polygonCentroid, polygonBounds, insidePolygon, distanceToEdge } from "./terrain.mjs";
import { YARD } from "./flight.mjs";
import { madeSince } from "./maker.mjs";
import { TEE_SETS, elsewhere } from "./teesets.mjs";

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
// A box the course names for the hole (layout.teeAt): this far along the
// line at most, and this far to its side.
const NAMED_REACH = 120;
const NAMED_SIDE = 40;

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
  // (And a hole of the course maker's second round keeps its boxes off the
  // other holes' tees and fairways too - its white 24 m back can reach a
  // neighbour's.)
  const others = madeSince(L) ? (L.otherGround ?? []).filter((o) => (o?.lie === "tee" || o?.lie === "fairway") && o.poly?.length > 2).map((o) => ({ poly: o.poly, b: polygonBounds(o.poly) })) : [];
  const byOther = (x, z) => others.some(({ poly, b }) => x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1 && insidePolygon(poly, x, z));
  const clear = ([x, z]) => {
    if (x < backmost) return false;
    for (const [dx, dz] of [[0, 0], [4, 0], [-4, 0], [0, 4], [0, -4], [4, 4], [4, -4], [-4, 4], [-4, -4]]) if (NOT_ON.has(at(x + dx, z + dz)) || byGreen(x + dx, z + dz) || byOther(x + dx, z + dz)) return false;
    // Nowhere near a path, over the whole box (a path between the spots
    // looked at above slipped through, under the box).
    if (pathByBox(L.paths, [x, z])) return false;
    // (Its own corners kept off the other holes' ground too.)
    if (others.length && [[1, 1], [1, -1], [-1, 1], [-1, -1]].some(([a, b]) => byOther(x + (a * TEE_SETS.size.white[0]) / 2, z + (b * TEE_SETS.size.white[1]) / 2))) return false;
    return !trees.some((t) => Math.hypot(t[0] - x, t[1] - z) < TREE_CLEAR);
  };
  const length = path.length || (L.yards ?? 0) * YARD;
  const heading = pointAt(path, 0).dir;
  const yellow = { colour: "yellow", at: [0, 0], ahead: 0 };

  // A course from a map: its own boxes behind and in front, near the line.
  const mapped = L.source === "map" ? mappedBoxes(L) : { back: [], front: [] };

  // ...or the boxes the course itself names for the hole (layout.teeAt:
  // { white: [x, z], red: [x, z] } - a real course's championship and
  // forward tees, where the nearest box behind or in front isn't the one:
  // tools/realcourse.mjs), tried first.
  const sets = madeSince(L);
  const named = (c, behind) => ((L.source === "map" || sets) && Array.isArray(c) && Number.isFinite(c[0]) && Number.isFinite(c[1]) && Math.abs(c[0]) <= NAMED_REACH && Math.abs(c[1]) <= NAMED_SIDE && (behind ? c[0] < 0 : c[0] > 0) ? [[c[0], c[1]]] : []);

  // (A named box is a real tee: it's played where it is - by its path, or
  // the burn it sits beside - so long as the spot's on a tee box of the
  // hole's, on its ground.)
  const onOwnBox = (c) => c[0] >= backmost && at(c[0], c[1]) === "tee";
  const whites = named(L.teeAt?.white, true);
  const reds = named(L.teeAt?.red, false);
  // (A hole of the second round's own box not clear - another hole's tee
  // or fairway there, a path or a bunker put there by hand: the other side
  // of the line, then nearer the yellow: sim/teesets.mjs elsewhere.)
  const nearer = (list, behind) => (sets && list.length ? elsewhere(path, list[0], behind, { step: STEP }) : []);
  // How far ahead of the yellow a box is: along the hole's line on a
  // designed hole of the second round (its boxes to the side of it); on a
  // map's, along its frame.
  const aheadOf = (c, behind) => (!sets || L.source === "map" ? c[0] : behind ? c[0] * heading[0] + c[1] * heading[1] : nearest(path, c[0], c[1]).s);
  const sized = (t) => (sets && L.source !== "map" && TEE_SETS.size[t.colour] ? { ...t, size: TEE_SETS.size[t.colour] } : t);

  let white = null;
  for (const c of [...whites, ...nearer(whites, true), ...mapped.back]) {
    if (whites.includes(c) ? onOwnBox(c) || clear(c) : clear(c)) {
      white = { colour: "white", at: [r2(c[0]), r2(c[1])], ahead: r2(aheadOf(c, true)) };
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
  for (const c of [...reds, ...nearer(reds, false), ...mapped.front]) {
    if (reds.includes(c) ? onOwnBox(c) || clear(c) : clear(c)) {
      red = { colour: "red", at: [r2(c[0]), r2(c[1])], ahead: r2(aheadOf(c, false)) };
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

  return [white ? sized(white) : { ...yellow, colour: "white" }, yellow, red ? sized(red) : { ...yellow, colour: "red" }];
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
