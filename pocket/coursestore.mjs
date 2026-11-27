// Where a phone or a browser keeps its courses (sim/coursekeep.mjs
// KeptCourses): the page's IndexedDB - the ones made in the web version's
// course designer, and friends' fetched by code. A course on hills is a
// megabyte or more, far past what the page's small storage (localStorage,
// where the settings and rounds are) will take; here each is one record,
// with its line for the list beside it, read without the course.
// Null where IndexedDB can't be had (the pocket server then keeps friends'
// courses for as long as the page is open, and the designer says it can't
// save).
//
// Each page of the game has its own pocket server: a course saved or
// deleted in one (the designer's) is told to the others (the game's) over
// a BroadcastChannel, for their lists - onChange(fn).

const DB = "golfsim-courses";
const COURSES = "courses";
const LIST = "list";
const CHANNEL = "a2-courses";

const done = (req) =>
  new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
const finished = (tx) =>
  new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = tx.onabort = () => reject(tx.error ?? new Error("The course couldn't be kept - this browser's storage for A² Golf may be full"));
  });

export async function courseStorage() {
  if (typeof indexedDB === "undefined") return null;
  let db;
  try {
    const open = indexedDB.open(DB, 1);
    open.onupgradeneeded = () => {
      open.result.createObjectStore(COURSES);
      open.result.createObjectStore(LIST);
    };
    db = await done(open);
  } catch {
    return null;
  }
  // (Kept for good if the browser allows: not cleared when it's short of room.)
  navigator.storage?.persist?.().catch(() => {});
  let channel = null;
  try {
    channel = new BroadcastChannel(CHANNEL);
  } catch {
    channel = null;
  }
  const told = () => channel?.postMessage("changed");
  return {
    lasting: true,
    all: () => done(db.transaction([LIST]).objectStore(LIST).getAll()),
    read: async (id) => (await done(db.transaction([COURSES]).objectStore(COURSES).get(id))) ?? null,
    async write(id, course, summary) {
      const tx = db.transaction([COURSES, LIST], "readwrite");
      tx.objectStore(COURSES).put(course, id);
      tx.objectStore(LIST).put(summary, id);
      await finished(tx);
      told();
    },
    async drop(id) {
      const tx = db.transaction([COURSES, LIST], "readwrite");
      tx.objectStore(COURSES).delete(id);
      tx.objectStore(LIST).delete(id);
      await finished(tx);
      told();
    },
    // Another page of the game changed what's kept.
    onChange(fn) {
      if (channel) channel.onmessage = () => fn();
    },
  };
}
