// A course's cart paths kept as they were first worked out (the owner, 28
// October 2026: "Can the links be locked in once built. So when course
// designing they are worked out, pre built are worked out"). The paths
// between holes (sim/linkpaths.mjs) and each hole's paths as they're played
// with the others (sim/coursepaths.mjs: kept off the other holes' ground,
// over their brooks, shared where two run side by side) are worked out by
// code that changes from version to version - the way a path finds its way,
// what it may cross. Worked out once, they're kept with the course - a
// lock - and from then on the course is played with them: the same paths,
// whatever a later version would make of it.
//
// A lock: { v: PATH_LOCK_V, key, holes, links }
//   key     what they were worked out from (pathKey): every hole's layout
//           but its trees, where each hole lies on the course, whether the
//           course has paths between holes and the owner's bends and paths
//           drawn for them. Anything of that changed - a hole moved or
//           edited in the designer - and the lock's let go: they're worked
//           out again (and kept again)
//   holes   each hole's paths as played, in its own frame ({ p, w, m }), or
//           null where they're its layout's own
//   links   the paths between holes, on the course's ground ({ from, to,
//           line, bend, hand? }, as linkPaths has them)
// Kept by the server beside the course (server/courses.mjs: <id>.paths.json)
// - worked out as a course is saved, a course that comes with the game when
// it's first added, and any other the first time it's played (course.js) -
// and handed out as course.pathLock. Pure.

import { coursePlaces } from "./imaginary.mjs";
import { validPath } from "./paths.mjs";
import { workedPaths } from "./coursepaths.mjs";
import { laidLinks } from "./linkpaths.mjs";

// Which way locks are kept: one of another is let go and the paths worked
// out afresh (and kept afresh).
export const PATH_LOCK_V = 1;

const r1 = (v) => Math.round(v * 10) / 10;
const r3 = (v) => Math.round(v * 1000) / 1000;

// What a course's paths are worked out from, as a few characters (a hash of
// it all). Its trees aren't (a path keeps its line; trees are cleared off it).
const keys = new WeakMap();
export function pathKey(course) {
  const layouts = (course?.holes ?? []).map((h) => h?.layout);
  const kept = keys.get(course);
  if (kept && kept.layouts.length === layouts.length && kept.layouts.every((l, i) => l === layouts[i])) return kept.key;
  const places = coursePlaces(course) ?? [];
  const holes = layouts.map((L) => {
    if (!L) return null;
    const { trees, treeLock, otherGround, decor, ...rest } = L;
    return rest;
  });
  const text = JSON.stringify({
    v: PATH_LOCK_V,
    on: !!course?.linkPaths,
    bends: course?.linkBends ?? null,
    lines: course?.linkLines ?? null,
    places: places.map((p) => (p ? [r1(p.x), r1(p.z), r3(p.heading ?? 0)] : null)),
    holes,
  });
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  const key = `${text.length.toString(36)}:${(h >>> 0).toString(36)}`;
  if (course) keys.set(course, { layouts, key });
  return key;
}

const point = (q) => Array.isArray(q) && q.length >= 2 && Number.isFinite(q[0]) && Number.isFinite(q[1]);

// A lock as it should be, or null (one of another version, or damaged).
export function validPathLock(lock) {
  if (!lock || typeof lock !== "object" || lock.v !== PATH_LOCK_V || typeof lock.key !== "string") return null;
  if (!Array.isArray(lock.holes) || !Array.isArray(lock.links)) return null;
  if (!lock.holes.every((ps) => ps === null || (Array.isArray(ps) && ps.every(validPath)))) return null;
  if (!lock.links.every((l) => l && Number.isInteger(l.from) && Number.isInteger(l.to) && Array.isArray(l.line) && l.line.length >= 2 && l.line.every(point))) return null;
  return lock;
}

// The course's lock if it's for the course as it is now, else null.
export function lockFor(course) {
  const lock = validPathLock(course?.pathLock);
  if (!lock || lock.holes.length !== (course.holes?.length ?? 0)) return null;
  return lock.key === pathKey(course) ? lock : null;
}

// The course's paths worked out afresh, as a lock to keep.
export function lockPaths(course) {
  const layouts = (course?.holes ?? []).map((h) => h?.layout);
  const played = workedPaths(course);
  return {
    v: PATH_LOCK_V,
    key: pathKey(course),
    holes: layouts.map((L, i) => (played[i] === L?.paths ? null : (played[i] ?? []).filter(validPath))),
    links: laidLinks(course).map(({ from, to, line, bend, refused, hand }) => ({ from, to, line, bend, ...(refused ? { refused } : {}), ...(hand ? { hand } : {}) })),
  };
}
