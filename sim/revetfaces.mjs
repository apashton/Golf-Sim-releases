// A real course's bunkers given revetted faces, as it's made
// (tools/realcourse.mjs): the definition's
//   "bunkers": { "faces": "revetted", "least": <metres>, "at": [[lat, lon], ...] }
// gives every bunker whose survey drops far enough round its edge a face
// of stacked turf where it drops most (public/sim/walls.mjs revetWall: a
// wall, m 0, on the bunker, and the bunker marked `surveyed: true` - its
// depth is the survey's, its face cut upright between the survey's rim
// and floor in play: sim/holeedits/ground.mjs). `least`: the least drop
// from the rim to the floor that's a face (REVET_SURVEY.least if not
// given) - the photographs' open sides, the sand meeting the ground at
// grade, measure half a metre or less on the survey.
//
// A bunker is copied onto every hole whose ground reaches it, each copy in
// its own hole's frame with its points in the same order: its face is
// found once, on the copy whose hole's ground reaches furthest round it,
// from that hole's ground as play has it before any shaping (its fine
// green included: prepareHole's baseHeightAt) - and carried to the other
// copies by where they lie on the course, so the same bunker has the same
// face whichever hole it's played from.

import { revetWall, edgeOf, pointAtT, tNear, inSpan, cleanWall, spanOf } from "./walls.mjs";
import { shapeBounds } from "./holeedits.mjs";

// Two copies are the same bunker when their middles lie this close (metres)
// on the course, with as many points to their outlines.
const SAME = 0.5;
// A place named in the definition is a bunker's when it's this near its middle.
const NEAR = 3;

// holes: [{ spec, layout }], each layout from a map (layout.geo, so placed()
// finds its frame); def: the course's definition; helpers: { placed,
// prepareHole } as tools/realcourse.mjs has them. Returns the holes, those
// with a bunker given a face as new holes with new layouts.
export function revetBunkers(holes, def, { placed, prepareHole }) {
  const spec = def?.bunkers;
  if (spec?.faces !== "revetted") return holes;
  const opts = Number.isFinite(spec.least) ? { least: spec.least } : {};
  const frames = holes.map((h) => placed(h.layout));
  const copies = bunkerCopies(holes, frames);
  // Each hole's ground before shaping, the first time it's wanted.
  const grounds = new Map();
  const groundOf = (i) => {
    if (!grounds.has(i)) grounds.set(i, prepareHole(holes[i].layout).baseHeightAt);
    return grounds.get(i);
  };
  // (`at`: only the bunkers standing at these places - [[lat, lon], ...],
  // each within NEAR metres of a bunker's middle. A course with pot
  // bunkers on its links and open ones on its heath: a deep heathland
  // bunker on a slope drops as far, and has no such face.)
  const first = holes.findIndex((h) => h.layout?.geo);
  const only = Array.isArray(spec.at) && first >= 0 ? spec.at.map(([lat, lon]) => frames[first].toCourse(frames[first].toHole(lat, lon))) : null;
  const faced = holes.map(() => new Map());
  for (const group of copies) {
    const home = homeCopy(holes, group);
    if (only && !only.some((p) => Math.hypot(p[0] - home.at[0], p[1] - home.at[1]) <= NEAR)) continue;
    const own = holes[home.hole].layout.bunkers[home.index];
    const wall = revetWall(own, groundOf(home.hole), opts);
    if (!wall) continue;
    for (const c of group) {
      const b = holes[c.hole].layout.bunkers[c.index];
      const w = c === home ? wall : carryWall(own, wall, frames[home.hole], b, frames[c.hole]);
      if (w) faced[c.hole].set(c.index, { ...b, wall: w, surveyed: true });
    }
  }
  return holes.map((h, i) => {
    if (!faced[i].size) return h;
    const bunkers = h.layout.bunkers.map((b, k) => faced[i].get(k) ?? b);
    return { ...h, layout: { ...h.layout, bunkers } };
  });
}

// Every bunker's copies, grouped: [{ hole, index, at: [course x, z] }, ...]
// for each bunker on the course - by where its middle is on the course
// (within SAME metres, as many points to its outline).
export function bunkerCopies(holes, frames) {
  const groups = [];
  const cells = new Map();
  const keyOf = (x, z) => `${Math.floor(x / 2)},${Math.floor(z / 2)}`;
  holes.forEach((h, i) => {
    (h.layout.bunkers ?? []).forEach((b, index) => {
      // (Its points' middle: the same in any frame, where its x and z - the
      // middle of its box in its hole's frame - aren't.)
      const pts = edgeOf(b).pts;
      const mid = pts.reduce((m, p) => [m[0] + p[0] / pts.length, m[1] + p[1] / pts.length], [0, 0]);
      const at = frames[i].toCourse(mid);
      const n = b.poly?.length ?? 0;
      let found = null;
      for (let dx = -1; dx <= 1 && !found; dx++) {
        for (let dz = -1; dz <= 1 && !found; dz++) {
          for (const g of cells.get(keyOf(at[0] + dx * 2, at[1] + dz * 2)) ?? []) {
            if (g.n === n && Math.hypot(g.at[0] - at[0], g.at[1] - at[1]) <= SAME) {
              found = g;
              break;
            }
          }
        }
      }
      if (!found) {
        found = { at, n, list: [] };
        groups.push(found);
        const key = keyOf(at[0], at[1]);
        if (!cells.has(key)) cells.set(key, []);
        cells.get(key).push(found);
      }
      found.list.push({ hole: i, index, at });
    });
  });
  return groups.map((g) => g.list);
}

// The copy whose hole's ground reaches furthest round it (the most room
// between the bunker and the edge of its hole's region; the first such).
export function homeCopy(holes, group) {
  let best = group[0];
  let room = -Infinity;
  for (const c of group) {
    const L = holes[c.hole].layout;
    const r = L.region;
    if (!r) continue;
    const b = shapeBounds(L.bunkers[c.index]);
    const m = Math.min(b.x0 - r.x0, r.x1 - b.x1, b.z0 - r.z0, r.z1 - b.z1);
    if (m > room + 1e-9) {
      room = m;
      best = c;
    }
  }
  return best;
}

// A wall found on one copy (`own`, its hole's frame `from`) carried to
// another (`b`, frame `to`): the same fractions round it if its outline is
// the same points in the same order (as the map's copies are), else its
// ends and middle found on the other's outline by where they lie on the
// course (and tidied: null if it can't be a wall there).
export function carryWall(own, wall, from, b, to) {
  const move = ([x, z]) => to.fromCourse(from.toCourse([x, z]));
  if (own.poly && b.poly && own.poly.length === b.poly.length && own.poly.every((p, k) => {
    const q = move(p);
    return Math.hypot(q[0] - b.poly[k][0], q[1] - b.poly[k][1]) <= 0.05;
  })) return { ...wall, a: [...wall.a] };
  const o = edgeOf(own);
  const [t0, t1, tm] = [wall.a[0], wall.a[0] + spanOf(wall.a), wall.a[0] + spanOf(wall.a) / 2].map((t) => tNear(b, ...move(pointAtT(o, t).p)));
  const a = inSpan(tm, [t0, t1]) ? [t0, t1] : [t1, t0];
  return cleanWall(b, { ...wall, a }, "bunker");
}

// How many bunkers on the course have a revetted face (each counted once,
// however many holes it's copied onto), and the copies that do.
export function revetSummary(holes, placedOf) {
  const frames = holes.map((h) => placedOf(h.layout));
  const groups = bunkerCopies(holes, frames);
  const faced = groups.filter((g) => g.some((c) => holes[c.hole].layout.bunkers[c.index].surveyed && holes[c.hole].layout.bunkers[c.index].wall));
  return { bunkers: groups.length, faced: faced.length, copies: faced.reduce((n, g) => n + g.length, 0) };
}
