// Keeping a course, wherever it's kept: the PC keeps each as files
// (server/courses.mjs); the web version keeps the ones made in its designer,
// and a phone or browser the friends' courses fetched by code, in the
// device's own storage (KeptCourses, below - the owner, 14 November 2026:
// "Also build the web designer"). What's the same for both is here:
//   checkCourse     what a course must be to be saved, in the PC's words
//   tidyWater       a saved hole's water as it's made now
//   courseSummary   a course's line in a list
// Pure: the storage is handed in (public/pocket/coursestore.mjs: the page's
// IndexedDB; memoryCourses() for the tests and where there's none).

import { wildWater } from "./course.mjs";
import { burnsAsBrooks } from "./brooks.mjs";
import { validLock } from "./treelock.mjs";
import { validPathLock, lockPaths } from "./pathlock.mjs";
import { courseFacts } from "./coursepicker.mjs";

export const COURSE_ID = /^[a-z0-9][a-z0-9-]{0,59}$/;

// A course that can be saved: 1 to 18 holes, each with a par and a layout.
export function checkCourse(course) {
  if (!course || !Array.isArray(course.holes) || !course.holes.length || course.holes.length > 18) throw new Error("A course needs 1 to 18 holes");
  for (const h of course.holes) {
    if (!h?.spec || !h?.layout || ![3, 4, 5].includes(h.spec.par)) throw new Error("Every hole needs a par and a layout");
  }
  return course;
}

// A saved hole's water as it's made now: burns as brooks (sim/brooks.mjs),
// then ponds' wilder edges (sim/course.mjs wildWater: never onto a green).
export const tidyWater = (layout) => {
  const water = burnsAsBrooks(layout.water);
  return wildWater(water === layout.water ? layout : { ...layout, water });
};

// A course's line in the list (as server/courses.mjs list makes it, without
// its rounds). With what kind of course it is (sim/coursepicker.mjs
// courseFacts), for the course picker's filters (game: one that comes with
// the game).
export function courseSummary(id, c, { game = false } = {}) {
  return {
    id,
    name: c.name,
    holes: c.holes.length,
    par: c.holes.reduce((a, h) => a + h.spec.par, 0),
    yards: c.holes.reduce((a, h) => a + h.spec.yards, 0),
    updated: c.updated ?? c.created ?? null,
    ...(c.builtIn ? { builtIn: true } : {}),
    ...courseFacts(c, { game }),
  };
}

// A course as it's kept on a device: checked, each hole's trees as kept
// (sim/treelock.mjs) only if they're sound, its cart paths worked out and
// kept with it (sim/pathlock.mjs) as the PC does as it saves one, its id
// and when. One record: the PC's three files (the course, its trees, its
// paths) in one.
export function forKeeping(id, course, now = Date.now()) {
  checkCourse(course);
  const holes = course.holes.map((h) => {
    const { treeLock, ...layout } = h.layout;
    const lock = validLock(treeLock);
    return { ...h, layout: lock ? { ...layout, treeLock: lock } : layout };
  });
  const { pathLock, builtIn, ...rest } = course;
  const kept = { ...rest, holes, id, updated: new Date(now).toISOString() };
  if (holes.length >= 2) {
    try {
      const lock = lockPaths(asServed(kept));
      if (validPathLock(lock)) kept.pathLock = lock;
    } catch {
      // Worked out again as it's played.
    }
  }
  return kept;
}

// A kept course as it's handed out (the PC's CourseStore get).
export function asServed(kept) {
  if (!kept?.holes) return kept ?? null;
  return { ...kept, holes: kept.holes.map((h) => (h?.layout ? { ...h, layout: tidyWater(h.layout) } : h)) };
}

// Courses kept in memory: the tests, and a browser that keeps nothing (a
// private window, say) - there for as long as the page is, no longer.
export function memoryCourses({ lasting = false } = {}) {
  const courses = new Map();
  return {
    lasting,
    all: async () => [...courses.values()].map((c) => c.summary),
    read: async (id) => (courses.has(id) ? structuredClone(courses.get(id).course) : null),
    write: async (id, course, summary) => void courses.set(id, { course: structuredClone(course), summary }),
    drop: async (id) => void courses.delete(id),
  };
}

// The courses kept on this device.
//   storage: { lasting, all() -> [summary], read(id) -> course | null,
//     write(id, course, summary), drop(id) } - each a promise
//   ready: the list read (await it before list() or has())
export class KeptCourses {
  constructor({ storage = memoryCourses(), now = () => Date.now() } = {}) {
    this.storage = storage;
    this.now = now;
    this.summaries = new Map();
    this.ready = this.reload();
  }

  // Whether what's saved here is still here next time (false: a browser
  // that keeps nothing for the site).
  get lasting() {
    return this.storage.lasting !== false;
  }

  // The list read again (another page of the game saved or deleted one).
  async reload() {
    let all = [];
    try {
      all = await this.storage.all();
    } catch {
      all = [];
    }
    this.summaries = new Map(all.filter((s) => s && COURSE_ID.test(s.id)).map((s) => [s.id, s]));
  }

  list() {
    return [...this.summaries.values()];
  }
  has(id) {
    return this.summaries.has(id);
  }

  async get(id) {
    if (!this.has(id)) return null;
    return asServed(await this.storage.read(id));
  }

  // Saved (made, or changed): { id, name, updated }.
  async save(id, course) {
    if (!COURSE_ID.test(id)) throw new Error("Bad course id");
    const kept = forKeeping(id, course, this.now());
    const summary = courseSummary(id, kept);
    await this.storage.write(id, kept, summary);
    this.summaries.set(id, summary);
    return { id, name: kept.name, updated: kept.updated };
  }

  async remove(id) {
    await this.storage.drop(id);
    this.summaries.delete(id);
  }

  // Hole `index`'s trees kept, as the game made them the first time the
  // hole was made ready (server/courses.mjs keepTrees).
  async keepTrees(id, index, lock) {
    const course = this.has(id) ? await this.storage.read(id) : null;
    if (!course?.holes) throw new Error("No such course");
    if (!Number.isInteger(index) || index < 0 || index >= course.holes.length) throw new Error("No such hole");
    if (!validLock(lock)) throw new Error("Not a hole's trees");
    const holes = course.holes.map((h, i) => (i === index ? { ...h, layout: { ...h.layout, treeLock: lock } } : h));
    await this.storage.write(id, { ...course, holes }, this.summaries.get(id));
  }

  // Its cart paths kept, as the game worked them out as it was played.
  async keepPaths(id, lock) {
    const course = this.has(id) ? await this.storage.read(id) : null;
    if (!course?.holes) throw new Error("No such course");
    if (!validPathLock(lock)) throw new Error("Not a course's cart paths");
    await this.storage.write(id, { ...course, pathLock: lock }, this.summaries.get(id));
  }
}
