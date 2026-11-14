// The next tee from the hole before, as it's drawn when that hole's played
// (the owner, 26 October 2026: "the card on the next tee box always seems
// to be in the middle of the tee box, not where it'd land when you
// actually drive up to that tee box. So can, when we're drawing the next
// tee box, can we make sure we draw it like it will be drawn when we
// arrive there?"). It had a plain board ("Hole 2  par 5") stood in the
// middle of a stand-in box; driving up, the hole's own tee was elsewhere -
// its sign out to the side, its boxes bigger.
//
// Now the next hole's own: its layout as it's played (courseplay.mjs
// playLayout), and from it its tee boxes, its tee sign with the card on
// it, the markers in the round's colour (and its other boxes' pairs), its
// windsock and the furniture by the tee, and its cart paths - each worked
// out by the very same code as when it's played, in its own frame, and
// placed where the course puts that hole. Pure; course/holescenery.js
// addNextTee draws it.

import { coursePlaces, toCourse } from "./imaginary.mjs";
import { holeFrame } from "./terrain.mjs";
import { withLinks } from "./linkpaths.mjs";
import { playLayout } from "./courseplay.mjs";
import { signsFor } from "./signs.mjs";
import { windsockSpot } from "./windsock.mjs";
import { teeFurniture } from "./furniture.mjs";
import { validPath } from "./paths.mjs";
import { teeBoxes, teeBridges, makePath, pointAt } from "./course.mjs";
import { teeSpot } from "./tees.mjs";

// Hole index + 1's frame -> hole index's: p -> [x, z], as the course has
// them (coursePlaces: where a map puts them, or the routing); null on the
// last hole.
export function nextHoleMap(course, index) {
  const holes = course?.holes ?? [];
  if (!holes[index]?.layout || !holes[index + 1]?.layout) return null;
  const places = coursePlaces(course);
  if (!places?.[index] || !places[index + 1]) return null;
  const mine = holeFrame([places[index].x, places[index].z], places[index].heading);
  return (p) => mine.toHole(toCourse(places[index + 1], p));
}

// The other way: hole index's frame -> the next hole's (nextHoleMap's
// `to` turned round - it's a turn and a shift, never a stretch).
export function fromNextHole(to) {
  const o = to([0, 0]);
  const ex = to([1, 0]);
  const ez = to([0, 1]);
  const [ax, az] = [ex[0] - o[0], ex[1] - o[1]];
  const [bx, bz] = [ez[0] - o[0], ez[1] - o[1]];
  return ([x, z]) => [(x - o[0]) * ax + (z - o[1]) * az, (x - o[0]) * bx + (z - o[1]) * bz];
}

// How the next hole's world (its frame's x, z drawn at world z, -x) sits in
// this hole's: { at: [wx, wz] where its origin is, turn: radians about the
// upright } - a group's position and rotation.y. (Both frames are turned
// the same way from the course's ground, so it's a turn, never a mirror.)
export function nextHoleTurn(to) {
  const o = to([0, 0]);
  const e = to([1, 0]);
  const ow = [o[1], -o[0]];
  // Its world's (0, -1) - its frame's (1, 0) - in this world.
  const dx = e[1] - o[1];
  const dz = -e[0] + o[0];
  return { at: ow, turn: Math.atan2(-dx, -dz) };
}

// The next tee as the cart between holes goes to it (course/buggy.js,
// sim/cartway.mjs), in hole index's frame: { tee: the middle of the box
// the round plays from (colour: sim/tees.mjs), ahead: the next hole's line
// from there (a unit [x, z]) or null, boxes: its tee boxes' outlines
// [[x, z], ...] } - the next hole as it's played, placed where the course
// puts it (nextHoleMap, as its tee's drawn) - or null, no next hole.
export function rideTee(course, index, colour) {
  const to = nextHoleMap(course, index);
  if (!to) return null;
  const next = playLayout(withLinks(course, index + 1), { tees: true });
  if (!(next?.path?.length >= 2)) return null;
  const spot = teeSpot(next.teeSpots, colour);
  const tee = to(spot.at);
  const on = to(pointAt(makePath(next.path), Math.max(0, spot.ahead) + 30).p);
  const d = Math.hypot(on[0] - tee[0], on[1] - tee[1]);
  const corners = ([x0, x1, z0, z1]) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(to);
  const boxes = next.source === "map" ? (next.tees ?? []).filter((t) => Array.isArray(t) && t.length > 2).map((t) => t.map(to)) : teeBoxes(next.teeSpots).map(corners);
  return { tee, ahead: d > 1 ? [(on[0] - tee[0]) / d, (on[1] - tee[1]) / d] : null, boxes };
}

// A cart path ({ p, w, m }) as the runs of it clear of off(x, z) - each a
// path of its own: its line walked a metre at a time and cut where it
// comes onto what's off, the cut at the last clear step.
export function pathRuns(path, off, step = 1) {
  const P = path.p;
  const runs = [];
  let run = [];
  let last = null;
  const end = () => {
    if (last && run.at(-1) !== last) run.push(last);
    if (run.length >= 2) runs.push({ ...path, p: run });
    run = [];
  };
  if (!off(P[0][0], P[0][1])) run.push((last = P[0]));
  for (let i = 1; i < P.length; i++) {
    const [ax, az] = P[i - 1];
    const [bx, bz] = P[i];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / step));
    for (let k = 1; k <= n; k++) {
      const q = k === n ? P[i] : [ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n];
      if (off(q[0], q[1])) {
        end();
        last = null;
        continue;
      }
      // (A run starts at its first clear step, and keeps the line's own
      // corners.)
      if (!run.length || k === n) run.push(q);
      last = q;
    }
  }
  end();
  return runs;
}

// Everything at hole index + 1's tee, in its own frame: { number, layout,
// to (nextHoleMap), at, turn (nextHoleTurn), signs (sim/signs.mjs's, the
// tee's own: its sign, markers and other boxes' pairs - nothing down the
// hole), sock (sim/windsock.mjs), furniture (sim/furniture.mjs's, the
// tee's: { tee, rakes: [] }), boxes and bridges (sim/course.mjs teeBoxes
// and teeBridges: a designed hole's boxes, drawn by holebuild.js; a
// mapped hole's tees are its map's shapes, drawn with the other holes'
// already), paths (its cart paths, but where they'd come onto this hole's
// play - keepOff(x, z), in this hole's frame: cut there, not drawn over
// its fairway or green) } - or null. info: as signsFor takes it (the
// card's number, par and yards; tee, the round's tee colour).
export function nextTeeView(course, index, info = {}, { keepOff = () => false } = {}) {
  const to = nextHoleMap(course, index);
  if (!to) return null;
  const L = playLayout(withLinks(course, index + 1), { tees: true });
  if (!(L?.path?.length >= 2)) return null;
  const all = signsFor(L, info);
  const signs = { tee: all.tee, posts: [], plates: [], arrow: null, aim: [], markers: all.markers, markerColour: all.markerColour, otherTees: all.otherTees };
  const sock = windsockSpot(L, all.tee);
  const mapped = L.source === "map";
  const off = (x, z) => keepOff(...to([x, z]));
  const paths = (L.paths ?? []).filter(validPath).flatMap((p) => pathRuns(p, off));
  return {
    number: info.number ?? course.holes[index + 1].spec?.number ?? index + 2,
    layout: L,
    to,
    from: fromNextHole(to),
    ...nextHoleTurn(to),
    signs,
    sock,
    furniture: { tee: teeFurniture(L, all.tee, sock), rakes: [] },
    boxes: mapped ? [] : teeBoxes(L.teeSpots),
    bridges: mapped ? [] : teeBridges(L.teeSpots),
    paths,
  };
}
