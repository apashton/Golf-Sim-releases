// Signs round a hole: where they stand, worked out from the hole itself
// every time it's drawn, so every hole ever saved has them and nothing is
// added to a course file.
//   - a tee sign ahead and to one side of the tee (the cart path's side,
//     else the left), turned to the golfer: the hole's number, par and yards
//   - yardage posts at 100 (red), 150 (white) and 200 (blue) yards from the
//     middle of the green, just off each edge of the fairway, with a plate
//     in the middle of the fairway at each - measured straight to the green,
//     as on a real course, and the same spots as the map's distance marks
//   - an arrow on the way from the green to the next tee, never within
//     15 m of the green (or past the cart path's end, on to the clubhouse,
//     after the last hole)
//   - two tee markers either side of the teeing spot, in the colour of the
//     tee being played; on a course from a map its other tee boxes along
//     the hole have pairs of their own (sim/furniture.mjs otherTees)
//   - an aiming post over the rise on a blind shot (sim/aimpost.mjs)
// None of them takes part in play: like trees, they don't stop a ball.
//
// Pure functions, in the hole's frame; look/signs.js draws them.

import { YARD } from "./flight.mjs";
import { makePath, pointAt, nearest, fairwayHalfWidth, surfaceAt, insideBlob, blobOutline } from "./course.mjs";
import { insidePolygon, distanceToEdge, holeFrame } from "./terrain.mjs";
import { pathLine, pathSide, gapToPaths, validPath } from "./paths.mjs";
import { playedTee, otherTees } from "./furniture.mjs";
import { teeSpot } from "./tees.mjs";
import { aimPosts } from "./aimpost.mjs";

// The yardage posts: distance to the middle of the green, and their colour
// (the usual club colours - and the range flags' red, white and blue).
export const YARDAGES = [
  { n: 100, colour: "red" },
  { n: 150, colour: "white" },
  { n: 200, colour: "blue" },
];
// Where the golfer's camera stands at the tee, behind the ball (course.js
// placeCamera): the tee sign turns to face it.
export const TEE_VIEW = [-4.5, 0];
// The tee sign's usual spot: this far ahead of the tee and out to the side.
export const TEE_SIGN = { ahead: 14, out: 8.5, most: 16 };
// No yardage is marked closer to the tee than this (metres): a post by the
// tee only clutters the view from it.
const MIN_AHEAD = 40;
// A post stands this far outside the fairway's edge; where there's no
// fairway, this far out from the middle of the hole.
const POST_OUT = 1.5;
const NO_FAIRWAY = 14;

const r2 = (v) => Math.round(v * 100) / 100;
const unit = (x, z) => {
  const l = Math.hypot(x, z) || 1;
  return [x / l, z / l];
};

// The next hole's posts - the arrow on to its tee, and the board at it
// (the owner: "they should always be placed towards the next tee but not
// within 15m of the current green"): at least `green` metres from the
// green's edge, the arrow on the way to the next tee (or out along the
// cart path, where the next tee isn't known) and at least `tee` short of
// it; nudged up to `across` metres to either side onto clear ground, and
// looked for as far as `reach` metres out. A next tee nearer the green
// than `green` has neither.
export const ARROW = { green: 15, tee: 10, across: 6, reach: 60 };

// Surfaces a sign or post never stands on.
const KEEP_OFF = new Set(["fairway", "tee", "bunker", "greenside", "waste", "water", "green", "fringe", "path"]);
const clearAt = (L, path, x, z, gap = 1) => !KEEP_OFF.has(surfaceAt(L, x, z, path)) && gapToPaths(L.paths, x, z, gap + 0.01) > gap;

// The green's middle, which the yardages are measured to.
export const greenMiddle = (L) => [L.green.x, L.green.z];

// The point on the middle line of the hole, coming back from the green,
// whose straight-line distance to the green's middle is `yards`: { s, p,
// dir } - or null if that's back beyond the tee.
export function yardageSpot(L, yards, path = makePath(L.path)) {
  const want = yards * YARD;
  const [gx, gz] = greenMiddle(L);
  const dist = (s) => {
    const q = pointAt(path, s).p;
    return Math.hypot(q[0] - gx, q[1] - gz);
  };
  if (dist(0) < want) return null;
  // Back from the green in 2 m steps, then closer in between.
  let near = path.length;
  let far = null;
  for (let s = path.length; s >= 0; s -= 2) {
    if (dist(s) >= want) {
      far = s;
      break;
    }
    near = s;
  }
  if (far == null) return null;
  for (let i = 0; i < 30; i++) {
    const mid = (near + far) / 2;
    if (dist(mid) >= want) far = mid;
    else near = mid;
  }
  const at = pointAt(path, far);
  return { s: far, p: at.p, dir: at.dir };
}

// The distances marked on a hole (100, 150 and 200 yards, where the hole is
// long enough to have them well clear of the tee), with the spot on its middle
// line each is at: [{ n, colour, s, p, dir }].
export function yardageSpots(L, path = makePath(L.path)) {
  const out = [];
  for (const y of YARDAGES) {
    if (y.n > (L.yards ?? Infinity) - 15) continue;
    const spot = yardageSpot(L, y.n, path);
    if (spot && spot.s >= MIN_AHEAD) out.push({ ...y, ...spot });
  }
  return out;
}

// The distance marks on the map: the yardage posts' spots, and 250 yards
// as a plain mark on a long hole - [{ n, p }], furthest first.
export function mapMarks(L, path = makePath(L.path)) {
  const marks = yardageSpots(L, path).map(({ n, p }) => ({ n, p }));
  if (250 <= (L.yards ?? Infinity) - 15) {
    const far = yardageSpot(L, 250, path);
    if (far && far.s >= MIN_AHEAD) marks.push({ n: 250, p: far.p });
  }
  return marks.sort((a, b) => b.n - a.n);
}

// How far out from the middle line the fairway's edge is at a yardage spot,
// on the side `sign` (-1 left, 1 right): null if there's no fairway there.
function fairwayOut(L, spot, sign) {
  if (L.source !== "map") {
    const half = fairwayHalfWidth(L.fairway, spot.s, sign);
    return half > 0 ? half : null;
  }
  const fairways = L.fairways ?? [];
  const [px, pz] = spot.p;
  if (!fairways.some((f) => insidePolygon(f, px, pz))) return null;
  const nx = -spot.dir[1] * sign;
  const nz = spot.dir[0] * sign;
  for (let o = 0.25; o < 80; o += 0.25) {
    if (!fairways.some((f) => insidePolygon(f, px + nx * o, pz + nz * o))) return o;
  }
  return null;
}

// How far (x, z) is from the green's edge, metres: 0 on it.
function fromGreen(L, x, z) {
  if (insideBlob(L.green, x, z)) return 0;
  return distanceToEdge(blobOutline(L.green, 96), x, z);
}

// Where a post for the next hole stands: the first spot out from `from`
// along `way` (as far as `stop` metres), or up to ARROW.across to either
// side of it, that's at least ARROW.green from the green's edge on clear
// ground (half: the cart path's half-width, kept clear of with room for
// the plate) - or null.
function walkOut(L, path, from, way, stop, half = 1.2) {
  const gap = Math.max(1.5, half + 0.5);
  for (let t = 0; t <= stop; t += 0.5) {
    for (let o = 0; o <= ARROW.across; o += 1) {
      for (const k of o ? [1, -1] : [0]) {
        const x = from[0] + way[0] * t - way[1] * o * k;
        const z = from[1] + way[1] * t + way[0] * o * k;
        if (fromGreen(L, x, z) >= ARROW.green && clearAt(L, path, x, z, gap)) return [x, z];
      }
    }
  }
  return null;
}

// Everything a hole's signs need: info { number, par, yards, next, last,
// nextTee } - the card's number, par and yards; the next hole's number and
// whether this is the last; and (a hole from a map) where the next tee is,
// [x, z] in this hole's frame, for the arrow to point at.
export function signsFor(L, info = {}) {
  const path = makePath(L.path);
  const side = pathSide(L) || -1;

  // The tee sign: out to the side until it's on plain grass, clear of the
  // path, turned to the golfer.
  let tee = null;
  for (let k = 0; k <= TEE_SIGN.most; k++) {
    const x = TEE_SIGN.ahead;
    const z = side * (TEE_SIGN.out + k);
    if (!clearAt(L, path, x, z, 1.5)) continue;
    tee = { at: [x, z], face: unit(TEE_VIEW[0] - x, TEE_VIEW[1] - z), number: info.number ?? L.number, par: info.par ?? L.par, yards: info.yards ?? L.yards };
    break;
  }

  // Yardage posts either side of the fairway, and plates in it.
  const posts = [];
  const plates = [];
  for (const spot of yardageSpots(L, path)) {
    // Facing back down the hole, towards the tee.
    const face = [-spot.dir[0], -spot.dir[1]];
    for (const sign of [-1, 1]) {
      const edge = fairwayOut(L, spot, sign);
      const base = edge == null ? NO_FAIRWAY : edge + POST_OUT;
      const nx = -spot.dir[1] * sign;
      const nz = spot.dir[0] * sign;
      // Nudged further out, a little at a time, if it would be in sand or
      // water, on a green or a path; left out if that's no good.
      for (let o = base; o <= base + 3; o += 0.5) {
        const x = spot.p[0] + nx * o;
        const z = spot.p[1] + nz * o;
        if (!clearAt(L, path, x, z, 0.8)) continue;
        posts.push({ n: spot.n, colour: spot.colour, at: [r2(x), r2(z)], face });
        break;
      }
    }
    // A plate in the fairway, if it's well on it (not at its very end).
    const onFairway = [-0.6, 0, 0.6].every((k) => surfaceAt(L, spot.p[0] + spot.dir[0] * k, spot.p[1] + spot.dir[1] * k, path) === "fairway");
    if (onFairway) plates.push({ n: spot.n, colour: spot.colour, at: [r2(spot.p[0]), r2(spot.p[1])], face });
  }

  // The arrow on to the next tee, where the cart path ends past the green.
  let arrow = null;
  const ends = [];
  for (const p of (L.paths ?? []).filter(validPath)) {
    const { pts } = pathLine(p);
    if (pts.length < 3) continue;
    for (const [end, before] of [
      [pts[pts.length - 1], pts[pts.length - 3]],
      [pts[0], pts[2]],
    ]) {
      const n = nearest(path, end[0], end[1]);
      const toGreen = Math.hypot(end[0] - L.green.x, end[1] - L.green.z);
      if (n.s >= path.length - 10 && toGreen < 90) ends.push({ end, before, s: n.s, toGreen, half: (p.w ?? 2.4) / 2 });
    }
  }
  const end = ends.sort((a, b) => b.s - a.s)[0];
  if (end) {
    const text = info.last ? "Clubhouse" : info.next != null ? `To ${info.next}` : "Next tee";
    const next = info.nextTee && Number.isFinite(info.nextTee[0]) ? info.nextTee : null;
    // From the green straight towards the next tee; with no next tee, on
    // from the end of the path the way it runs.
    const pathAlong = unit(end.end[0] - end.before[0], end.end[1] - end.before[1]);
    const from = next ? [L.green.x, L.green.z] : end.end;
    const way = next ? unit(next[0] - from[0], next[1] - from[1]) : pathAlong;
    const stop = next ? Math.hypot(next[0] - from[0], next[1] - from[1]) - ARROW.tee : ARROW.reach;
    const at = walkOut(L, path, from, way, Math.min(stop, ARROW.reach), end.half);
    if (at) {
      // Facing whoever walks to it from the green; pointing on to the next
      // tee (or along the path).
      const along = next ? way : pathAlong;
      const dir = next ? unit(next[0] - at[0], next[1] - at[1]) : along;
      arrow = { at: [r2(at[0]), r2(at[1])], along, dir, text };
    }
  }

  // Tee markers, either side of where the ball is teed, in the played
  // tee's colour (info.tee, else yellow); the hole's other tee boxes (a
  // course's, sim/tees.mjs teeSpots) with their own, and a mapped hole's
  // others (its blue, say) too.
  const pair = (at, dir = [1, 0]) => [-1, 1].map((k) => [r2(at[0] + dir[0] * 0.8 - dir[1] * 2.3 * k), r2(at[1] + dir[1] * 0.8 + dir[0] * 2.3 * k)]);
  const colour = playedTee(info);
  const spots = L.teeSpots ?? null;
  // Aiming posts on its blind shots.
  const aim = aimPosts(L, path);
  if (!spots?.length) return { tee, posts, plates, arrow, aim, markers: pair([0, 0]), markerColour: colour, otherTees: otherTees(L) };
  const along = (t) => pointAt(path, Math.max(0, t.ahead)).dir;
  const played = teeSpot(spots, colour);
  const apart = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) > 3;
  const boxes = [played];
  for (const t of spots) if (boxes.every((b) => apart(b.at, t.at))) boxes.push(t);
  const others = boxes.slice(1).map((t) => ({ colour: t.colour, markers: pair(t.at, along(t)) }));
  // A mapped hole's own boxes that aren't one of these.
  for (const o of otherTees(L)) {
    const mid = [(o.markers[0][0] + o.markers[1][0]) / 2, (o.markers[0][1] + o.markers[1][1]) / 2];
    if (boxes.every((b) => Math.hypot(b.at[0] - mid[0], b.at[1] - mid[1]) > 8)) others.push(o);
  }
  return { tee, posts, plates, arrow, aim, markers: pair(played.at, along(played)), markerColour: played.colour, otherTees: others };
}

// Where the next hole's tee is in this hole's frame, for a course from a
// map (both holes know where they are on the ground: layout.geo). Null if
// either doesn't.
export function nextTeeFrom(L, next) {
  const a = L?.geo;
  const b = next?.geo;
  if (!a?.tee || !b?.tee || a.heading == null) return null;
  return holeFrame(a.tee, a.heading).toHole(b.tee);
}
