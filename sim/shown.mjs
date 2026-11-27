// The courses that come with the game (the owner, 23 November 2026: "All
// these maps will be always built into the game from here on in. But we
// might go through another improvement round at some points which would
// require all users to update to ensure seeing the same things"): Golf Sim
// Links and Nine Oaks, the courses A-Squared Golf shows off in its videos
// and its speed test (the owner: "the course we present in the videos
// should be playable"), and the real ones and the one made as a real one is.
//
// Each is kept in a file of its own (server/*.json, server/courses.mjs) and
// served from it just as it is - never made again as the game starts - so a
// change to the course maker never moves a course that comes with the game,
// and every PC, phone and browser on a version plays the very same holes.
// The six the course maker makes are made into their files on purpose, by
// tools/builtins.mjs (MAKE_BUILT_IN here); an improvement round is: make
// them again, look, and give each one that changed its next edition
// (EDITIONS). The speed test builds its own courses in the page from code
// (sim/speedtest.mjs speedTestHole), as ever. Pure, for the page, the
// server and the tests.

import { STARTER_COURSES, starterCourse, videoCourseFrom, VIDEO_LINKS, VIDEO_LINKS_ID, VIDEO_HILLS, VIDEO_HILLS_ID } from "./starters.mjs";
import { withLook } from "./coursecharacter.mjs";
import { buildCourse, seedName } from "./course.mjs";
import { makeCard } from "./coursemaker.mjs";
import { withHills } from "./imaginary.mjs";

// The speed test's links course: nine links holes with the sea along one
// side, the beach right up to the holes - made as the course maker makes
// a links course (strategic: sim/coursemaker.mjs makeCard). Kept, as made
// for its edition, as Links by the Sea.
export const SPEED_LINKS_ID = "speed-test-links";
export function speedLinksCourse() {
  const card = makeCard({ holes: 9, sections: [{ from: 1, to: 9, style: "links" }], pars: "standard", seed: 2026 });
  return { ...buildCourse("Speed Test Links", card, 2026), id: SPEED_LINKS_ID, sea: "side", seaGap: "beach" };
}

// The speed test's mountain course: Nine Oaks laid out on the course
// maker's Mountain hills - its woods led by Scots pines, with spruces
// (sim/treepalette.mjs ledWeights). Kept as Nine Oaks Mountain.
export const MOUNTAIN_TREES = { kinds: { scots: 2.6, spruce: 1.7 } };
export const SPEED_HILLS_ID = "speed-test-hills";
export function mountainCourse() {
  return { ...withHills(starterCourse(STARTER_COURSES[1]), { hills: "mountain", seed: 3 }).course, id: SPEED_HILLS_ID, treeLead: MOUNTAIN_TREES };
}

// A course as the player's own, to play: its own id and name, but laid
// out and dressed as it was made (seedAs) - with cart paths between its
// holes (sim/linkpaths.mjs), as the course maker makes a course (not a real
// course's: its paths are the ones on its map).
export function playableCopy(course, id, name, { linkPaths = true } = {}) {
  const { videos, ...rest } = course;
  return { ...rest, id, name, seedAs: seedName(course), ...(linkPaths ? { linkPaths: true } : {}) };
}

// Auld Grey Links: a real links course, the oldest there is, rebuilt (and
// renamed) from its map and LiDAR - the owner, 21 November 2026: "recreate
// a version of the old course in st andrews in game please, rename it
// something else". Made once by tools/realcourse.mjs (its map and the
// LiDAR it's built on: tools/realcourses/) and kept in
// server/auldgreylinks.json, served from there as it is (server/courses.mjs).
export const REAL_LINKS_ID = "real-auld-grey-links";

// Watling Pines: a real parkland course west of St Albans, opened in 2013,
// rebuilt and renamed (the owner, 23 November 2026: "I'd like two more
// courses, one the centurion in at Alban's") - traced from aerial imagery
// (the open map had a third of it), on England's LiDAR, its routing, name
// and tees signed off by the owner. Made once by tools/realcourse.mjs
// (tools/realcourses/watling-pines.json and its prep folder) and kept in
// server/watlingpines.json.
export const REAL_PARK_ID = "real-watling-pines";

// Arrowmill Park: a real parkland course in the Arrow valley, renamed - the
// owner's home course (the owner, 25 November 2026: "Start the abbey golf
// hotel course please"). As it's played since its 2026 change (the club's
// new par-70 card), traced from aerial imagery on England's LiDAR. A first
// draft: its routing, its new holes and its name wait for the owner.
// Made once by tools/realcourse.mjs (tools/realcourses/arrowmill.json and
// arrowmill-prep/) and kept in server/arrowmillpark.json.
export const REAL_HOME_ID = "real-arrowmill-park";

// Saltpine Links: an imaginary course made as a real one is - the owner,
// 23 November 2026: "a new imaginary course utilising all the tips and
// tricks we've learned from auld links and the centurion". Eight holes
// through pine heath, nine on linksland by the sea, home to a lake below
// the clubhouse: its land worked out from its design (tools/madeland/,
// tools/realcourses/saltpine.land.mjs) and made once by
// tools/realcourse.mjs, kept in server/saltpinelinks.json.
export const MADE_LINKS_ID = "made-saltpine-links";

// The courses that come with the game, as the player gets them: id, name,
// and the made course each is played from (from: its file's course, read
// by the server - server/courses.mjs getVideoCourse - laid out and dressed
// as made: playableCopy). Golf Sim Links and Nine Oaks are kept under their
// own ids; Sea Links and Hillside Park under the ids of the old videos
// they were first made for; Links by the Sea and Nine Oaks Mountain under
// the speed test's (each course is laid out and seeded from its made id:
// sim/course.mjs seedName).
export const SHOWN_COURSES = [
  { id: "golf-sim-links", name: "Golf Sim Links", from: "golf-sim-links" },
  { id: "nine-oaks", name: "Nine Oaks", from: "nine-oaks" },
  { id: "sea-links", name: "Sea Links", from: VIDEO_LINKS_ID },
  { id: "hillside-park", name: "Hillside Park", from: VIDEO_HILLS_ID },
  { id: "links-by-the-sea", name: "Links by the Sea", from: SPEED_LINKS_ID },
  { id: "nine-oaks-mountain", name: "Nine Oaks Mountain", from: SPEED_HILLS_ID },
  { id: "auld-grey-links", name: "Auld Grey Links", from: REAL_LINKS_ID, real: true },
  { id: "saltpine-links", name: "Saltpine Links", from: MADE_LINKS_ID, real: true },
  { id: "watling-pines", name: "Watling Pines", from: REAL_PARK_ID, real: true },
  { id: "arrowmill-park", name: "Arrowmill Park", from: REAL_HOME_ID, real: true },
];
export const BUILT_IN_IDS = SHOWN_COURSES.map((c) => c.id);
export const isBuiltIn = (id) => BUILT_IN_IDS.includes(id);

// How each of the six the course maker makes is made - by tools/builtins.mjs
// alone, into its file (keyed by the made id it's kept under). The game
// never makes them: it plays them from their files. Each in a look of its
// own (sim/coursecharacter.mjs LOOKS), said why where it's chosen (the
// lesson from Saltpine Links: "its look is its own to choose, so say why")
// - Golf Sim Links' and Nine Oaks' in sim/starters.mjs, Sea Links' and
// Hillside Park's with their choices there; the speed test's own courses,
// made in the page, stay in the game's.
const looked = (course, look) => (look && look !== "game" ? withLook(course, look) : course);
export const MAKE_BUILT_IN = {
  "golf-sim-links": () => starterCourse(STARTER_COURSES[0]),
  "nine-oaks": () => starterCourse(STARTER_COURSES[1]),
  [VIDEO_LINKS_ID]: () => looked(videoCourseFrom(VIDEO_LINKS, VIDEO_LINKS_ID), VIDEO_LINKS.look),
  [VIDEO_HILLS_ID]: () => looked(videoCourseFrom(VIDEO_HILLS, VIDEO_HILLS_ID), VIDEO_HILLS.look),
  // Links by the Sea: the old links' look, as Sea Links' - nine links
  // holes with the beach right up to them, every bunker a pot.
  [SPEED_LINKS_ID]: () => looked(speedLinksCourse(), "links"),
  // Nine Oaks Mountain: heathland - firm olive turf, tawny rough, coarse
  // brown sand, a clear sky. Nine Oaks taken up onto the Mountain hills,
  // 50 m of rise: open upland ground, where a lowland park's lush green
  // would look planted.
  [SPEED_HILLS_ID]: () => looked(mountainCourse(), "heath"),
};

// Each course's edition: 1 as it first came with the game, one more each
// improvement round that changes it - and the day it was made at. Stamped
// on the course as it's served (edition, updated: a course's still before
// a round is taken again when it changes - sim/coursephotos.mjs), checked by
// the Tour (sim/tour.mjs TOUR_COURSES' editions) so everyone plays its
// round on the same holes. test/courseedition.test.mjs holds each kept
// file to its edition: a file made again fails it until its edition is
// moved on. 2: the course maker's second round (sim/maker.mjs - the owner,
// 23 November 2026: "Go through and make improvements to bunkers, add in
// extra features, tree origination layouts etc to improve what we had as a
// base"); Auld Grey Links and Watling Pines with their greens smooth and
// sensible (sim/greensmooth.mjs - the owner, 24 November 2026: the greens
// "aren't realistic"). Arrowmill Park's 2: its oak by the 13th green in a
// form of its own (sim/treeshapes.mjs TAPERING - the owner, 26 November 2026:
// "this specific tree alone needs a slight change as I recognise it from the
// course"), and the 4th's big oaks each a great oak of its own - its pair
// in the fairway too ("in general a feature tree should be less basic ...
// ensure tree looks different"); nothing else of it moved.
export const EDITIONS = {
  "golf-sim-links": { n: 2, date: "2026-11-25" },
  "nine-oaks": { n: 2, date: "2026-11-25" },
  "sea-links": { n: 2, date: "2026-11-25" },
  "hillside-park": { n: 2, date: "2026-11-25" },
  "links-by-the-sea": { n: 2, date: "2026-11-25" },
  "nine-oaks-mountain": { n: 2, date: "2026-11-25" },
  "auld-grey-links": { n: 2, date: "2026-11-25" },
  "saltpine-links": { n: 1, date: "2026-11-23" },
  "watling-pines": { n: 2, date: "2026-11-25" },
  "arrowmill-park": { n: 3, date: "2026-11-27" },
};
// A course's edition as served (1 for one from before they had them).
export const editionOf = (course) => (Number.isInteger(course?.edition) && course.edition >= 1 ? course.edition : 1);

// One of those as the player gets it, its made course read by `madeCourse`
// (server/courses.mjs getVideoCourse).
export const shownCourse = (c, madeCourse) => playableCopy(madeCourse(c.from), c.id, c.name, { linkPaths: !c.real });

// A course that comes with the game, by id, as it's served: always in the
// course list, played and scored like any other, but never deleted or
// saved over - changed in the designer, it's saved as a copy - with its
// edition and the day it was made. null for any other id.
export function builtInCourse(id, madeCourse) {
  const c = SHOWN_COURSES.find((s) => s.id === id);
  if (!c) return null;
  const { n, date } = EDITIONS[id];
  return { ...shownCourse(c, madeCourse), builtIn: true, edition: n, updated: `${date}T00:00:00.000Z` };
}
