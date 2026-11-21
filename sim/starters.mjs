// The ready-made courses' cards, seeds and walls, and how each is built:
// pure, so the game page can build one itself too (the speed test's
// fly-through: sim/speedtest.mjs) - the same on every PC. server/starter.mjs
// adds them to the courses folder the first time A-Squared Golf runs.

import { buildCourse } from "./course.mjs";
import { withEdits, addEdit } from "./holeedits.mjs";
import { defaultWall } from "./walls.mjs";
import { makeCard } from "./coursemaker.mjs";
import { asSearched, forHills } from "./searchkept.mjs";
import { withHills } from "./imaginary.mjs";


// Sea Links, one of the courses every player gets (sim/shown.mjs): nine
// links holes by the sea - green links grass on the first five, brown
// dunes on the last four, the coast along one side. First made for the
// game's old videos (its id and file are theirs: the course is laid out
// and seeded from its id, sim/course.mjs seedName), kept in
// server/videolinks.json (tools/videocourse.mjs); made from these choices
// with the course maker (sim/coursemaker.mjs makeCard), as the designer
// would make it, with Best holes (sim/coursesearch.mjs) - the search's
// record in `search` (sim/searchkept.mjs): it tried other designs of eight
// of its holes and kept none (none was better), only setting the stroke
// indexes from how the holes play.
export const VIDEO_LINKS_ID = "videos-sea-links";
export const VIDEO_LINKS = {
  name: "Sea Links",
  seed: 20261016,
  holes: 9,
  sections: [
    { from: 1, to: 5, style: "greenlinks" },
    { from: 6, to: 9, style: "links" },
  ],
  pars: "standard",
  sea: "headland",
  search: {
    record: {
      seed: 20261016,
      tries: 3,
      before: { review: 7.4, search: 5.18 },
      after: { review: 7.4, search: 5.18 },
      holes: [
        { hole: 2, tried: [1205507237, 213762133, 33978581], kept: null },
        { hole: 1, tried: [650583306, 807692235, 277350107], kept: null },
        { hole: 5, tried: [53241578, 438958731, 1886225340], kept: null },
        { hole: 7, tried: [1440424378, 554075219, 370332760], kept: null },
        { hole: 4, tried: [301908408, 1370181669, 16439605], kept: null },
        { hole: 6, tried: [1748802733, 672722647, 671513886], kept: null },
        { hole: 9, tried: [1755243768, 258940921, 648260836], kept: null },
        { hole: 8, tried: [986665269, 194557114, 1156921228], kept: null },
      ],
      si: true,
    },
    si: [4, 5, 9, 8, 2, 3, 6, 7, 1],
  },
};

// Hillside Park, another every player gets: nine strategic holes on Hilly
// ground, laid out
// as the course maker lays a new course out today (the owner: "expand the
// course designer as we have a few new features now") - the great
// courses' templates (a Short up on a plateau, a Redan, the Alps, a par 5
// to go for) and holes that find the land, the 1st dropping 15 m from its
// tee. Kept as Sea Links is (server/videohills.json,
// tools/videocourse.mjs); made from these choices with the course maker,
// then put on its hills (sim/imaginary.mjs withHills), as the designer
// would make it.
export const VIDEO_HILLS_ID = "videos-hills";
export const VIDEO_HILLS = {
  name: "Hillside Park",
  seed: 3,
  holes: 9,
  sections: [{ from: 1, to: 9, style: "parkland" }],
  pars: "standard",
  hills: "hilly",
  // Best holes, on the flat course before its hills: new designs of the
  // 2nd, 5th, 6th, 7th and 9th kept, the review's score from 8.2 to 9.6.
  search: {
    record: {
      seed: 3,
      tries: 3,
      before: { review: 8.2, search: 7.99 },
      after: { review: 9.6, search: 9.12 },
      holes: [
        { hole: 1, tried: [805946700, 1748791688, 206990108], kept: null },
        { hole: 2, tried: [516910071, 1254917558, 1762937591], kept: 1254917558 },
        { hole: 5, tried: [752881438, 646022196, 1541174128], kept: 646022196 },
        { hole: 6, tried: [1498387231, 4377984, 405163759], kept: 1498387231 },
        { hole: 7, tried: [282919395, 912167057, 1002925240], kept: 282919395 },
        { hole: 9, tried: [1601803656, 875723190, 1030430920], kept: 1601803656 },
      ],
      si: true,
    },
    si: [5, 4, 9, 2, 6, 8, 1, 7, 3],
  },
};

// Each made as the course maker makes a new course today (the owner:
// "ensure that the pre built maps all update with our course designer
// knowledge"): strategic holes, a composed scorecard and the great
// courses' templates (sim/coursemaker.mjs makeCard) - its choices here,
// its card from them.
const made = (holes, seed, details = {}) => makeCard({ holes, sections: [{ from: 1, to: holes, style: "parkland" }], pars: "standard", seed, details });

export const STARTER_COURSES = [
  {
    name: "Golf Sim Links",
    seed: 20260926,
    card: made(18, 20260926),
    // Made with Best holes (sim/coursesearch.mjs), as the course maker
    // makes a new course - the search run once (tools/videocourse.mjs
    // --search) and what it kept made again from its record here
    // (sim/searchkept.mjs): new designs of the 2nd, 4th, 10th, 14th and
    // 18th, the review's score from 8.4 to 9.3 (since the bunkers and water
    // were shaped further, sim/hazardshapes.mjs: the 1st and 13th tried as
    // well, neither bettered), and the stroke indexes from how the holes
    // play.
    search: {
      record: {
        seed: 20260926,
        tries: 3,
        before: { review: 8.4, search: 7.53 },
        after: { review: 9.3, search: 8.76 },
        holes: [
          { hole: 4, tried: [620310753, 932806739, 97901478], kept: 620310753 },
          { hole: 14, tried: [508480861, 314498786, 541529799], kept: 314498786 },
          { hole: 1, tried: [2069706767, 349799413, 353965470], kept: null },
          { hole: 2, tried: [69490441, 600670430, 378592079], kept: 69490441 },
          { hole: 3, tried: [345731643, 486715611, 1602565021], kept: null },
          { hole: 10, tried: [479975904, 980744104, 68064168], kept: 68064168 },
          { hole: 13, tried: [782164480, 1913755769, 946286194], kept: null },
          { hole: 15, tried: [519703369, 1885087469, 1912326624], kept: null },
          { hole: 18, tried: [878538565, 492179778, 258284436], kept: 878538565 },
        ],
        si: true,
      },
      si: [9, 3, 11, 13, 17, 5, 7, 1, 15, 6, 4, 8, 16, 14, 12, 10, 18, 2],
    },
    // Walls along bunkers and ponds (sim/walls.mjs), to be seen from the
    // start: a bunker faced with timber sleepers by the 1st green; on the
    // 13th, a drivable par 4, the pond held by a timber wall and a bunker
    // by the green with a wall of stacked turf, overlapping another; on the
    // 18th, the pond held by a brick wall (its new design from Best holes
    // has its pond still). Each is a hand change,
    // facing the green, so "Put this hole back as it was" takes it away
    // and the hole builder can change it: [hole, "bunkers" or "water",
    // which, the wall's height and what it's built of].
    walls: [
      [1, "bunkers", 3, { h: 1, m: 1 }],
      [13, "water", 0, { h: 0.5, m: 0 }],
      [13, "bunkers", 2, { h: 1.2, m: 0 }],
      [18, "water", 0, { h: 0.75, m: 1 }],
    ],
  },
  {
    // Short and quick: a nine for a half-hour session - its greens
    // Moderate, with more to read than the course maker's Gentle (the
    // owner: "nine oaks can it default to medium sloped green").
    name: "Nine Oaks",
    seed: 90909,
    card: made(9, 90909, { contours: "moderate" }),
  },
];

// A starter course as it's first added: built from its card and seed, the
// holes Best holes kept made again from its record (sim/searchkept.mjs),
// and its walls put on as hand changes; with cart paths between its holes
// (sim/linkpaths.mjs), as the course maker makes a course. The same on
// every PC.
export function starterCourse(s) {
  const built = buildCourse(s.name, s.card, s.seed);
  const course = s.search ? asSearched(built, s.search) : built;
  putOnWalls(course, s.walls);
  return { ...course, linkPaths: true };
}

// Sea Links or Hillside Park (VIDEO_LINKS, VIDEO_HILLS) as the course
// maker makes it from its choices - its card, its holes, Best holes' (from
// its record: sim/searchkept.mjs), by the sea or on its hills - for
// tools/videocourse.mjs to keep in its file, under its own id (id). The
// game itself never makes them: each player's copy is made from its file
// (sim/shown.mjs).
export function videoCourseFrom(v, id) {
  const card = makeCard({ holes: v.holes, sections: v.sections, pars: v.pars, seed: v.seed });
  const flat = { ...buildCourse(v.name, card, v.seed), id, ...(v.sea ? { sea: v.sea } : {}) };
  const searched = v.search ? asSearched(flat, v.search) : flat;
  if (!v.hills) return searched;
  const { search } = searched;
  const onHills = withHills(forHills(searched), { hills: v.hills, seed: v.seed }).course;
  return search ? { ...onHills, search } : onHills;
}

// Put a starter course's walls on its holes, as hand changes. `only`, if
// given, says which holes may be changed (by number). Returns the numbers
// of the holes that got a wall.
export function putOnWalls(course, walls = [], only = null) {
  const done = new Set();
  for (const [number, list, i, { h, m }] of walls ?? []) {
    const hole = course.holes[number - 1];
    if (!hole || (only && !only.has(number))) continue;
    const L = withEdits(hole.layout);
    const shape = L[list][i];
    const kind = list === "water" ? "water" : "bunker";
    const wall = shape && defaultWall(L, shape, kind);
    if (!wall) continue;
    const next = addEdit(hole.layout, { k: list === "water" ? "w" : "b", at: [shape.x, shape.z], wall: { ...wall, h, m } });
    // Only if it goes on as it should.
    if (withEdits(next).applied?.every(Boolean)) {
      hole.layout = next;
      done.add(number);
    }
  }
  return [...done];
}
