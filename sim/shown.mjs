// The courses A-Squared Golf shows off - in its videos and its speed test -
// made playable too (the owner: "Can we ensure that the test course is in
// the build, the course we present in the videos should be playable"),
// and Nine Oaks, the course that comes with the game (BUILT_IN).
//
// The speed test builds its courses in the page from here (sim/speedtest.mjs
// speedTestHole), so they're there on every PC; the server puts a copy of
// each in the player's own courses (server/starter.mjs), seeded and dressed
// as the test's (seedAs: the routing, each hole's country and the horizon
// come from a course's id - sim/course.mjs seedName), so the hole played is
// the hole the test flies. Pure, for the page, the server and the tests.

import { STARTER_COURSES, starterCourse, VIDEO_LINKS_ID, VIDEO_HILLS_ID } from "./starters.mjs";
import { buildCourse, seedName } from "./course.mjs";
import { makeCard } from "./coursemaker.mjs";
import { withHills } from "./imaginary.mjs";

// The speed test's links course: nine links holes with the sea along one
// side, the beach right up to the holes - made as the course maker makes
// a links course today (strategic: sim/coursemaker.mjs makeCard).
export function speedLinksCourse() {
  const card = makeCard({ holes: 9, sections: [{ from: 1, to: 9, style: "links" }], pars: "standard", seed: 2026 });
  return { ...buildCourse("Speed Test Links", card, 2026), id: "speed-test-links", sea: "side", seaGap: "beach" };
}

// The speed test's mountain course: Nine Oaks laid out on the course
// maker's Mountain hills.
export function mountainCourse() {
  return { ...withHills(starterCourse(STARTER_COURSES[1]), { hills: "mountain", seed: 3 }).course, id: "speed-test-hills" };
}

// A course as the player's own, to play: its own id and name, but laid
// out and dressed as it was shown (seedAs) - with cart paths between its
// holes (sim/linkpaths.mjs), as the course maker makes a course.
export function playableCopy(course, id, name) {
  const { videos, ...rest } = course;
  return { ...rest, id, name, seedAs: seedName(course), linkPaths: true };
}

// The courses shown off, as the player gets them: id, name, and how each
// is made (the videos' own - Sea Links and Hillside Park - are read from
// their files by the server: from the videos' course of that id).
export const SHOWN_COURSES = [
  { id: "sea-links", name: "Sea Links", from: VIDEO_LINKS_ID },
  { id: "hillside-park", name: "Hillside Park", from: VIDEO_HILLS_ID },
  { id: "links-by-the-sea", name: "Links by the Sea", make: () => playableCopy(speedLinksCourse(), "links-by-the-sea", "Links by the Sea") },
  { id: "nine-oaks-mountain", name: "Nine Oaks Mountain", make: () => playableCopy(mountainCourse(), "nine-oaks-mountain", "Nine Oaks Mountain") },
];

// The course that comes with the game itself (the owner: "nine oaks should
// be updated in the default build (the only course a user can't delete)"):
// made from this version's own card every time it's asked for, so each new
// version brings the latest; always in the course list, played and scored
// like any other, but never deleted or saved over - changed in the
// designer, it's saved as a copy.
export const BUILT_IN = {
  "nine-oaks": () => ({ ...starterCourse(STARTER_COURSES[1]), builtIn: true }),
};
export const isBuiltIn = (id) => Object.hasOwn(BUILT_IN, id);
