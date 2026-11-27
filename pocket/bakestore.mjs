// Where the phone keeps its built holes (sim/pocketbakes.mjs): the page's
// IndexedDB, each hole's file a Blob (kept as a file on the phone, not
// held in memory) and beside it what it is - its size, when it was last
// used and whether it's a course's first hole - read without the file.
// Null where IndexedDB can't be had.

const DB = "golfsim-holes";
const FILES = "files";
const INFO = "info";

const done = (req) =>
  new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
const finished = (tx) =>
  new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = tx.onabort = () => reject(tx.error ?? new Error("not kept"));
  });

export async function bakeStorage() {
  if (typeof indexedDB === "undefined") return null;
  let db;
  try {
    const open = indexedDB.open(DB, 1);
    open.onupgradeneeded = () => {
      open.result.createObjectStore(FILES);
      open.result.createObjectStore(INFO);
    };
    db = await done(open);
  } catch {
    return null;
  }
  // (Kept for good if the phone allows: not cleared when it's short of room.)
  navigator.storage?.persist?.().catch(() => {});
  const store = (names, mode = "readonly") => db.transaction(names, mode);
  return {
    async read(key) {
      const blob = await done(store([FILES]).objectStore(FILES).get(key));
      return blob ? await blob.arrayBuffer() : null;
    },
    async write(key, bytes, info) {
      const tx = store([FILES, INFO], "readwrite");
      tx.objectStore(FILES).put(new Blob([bytes]), key);
      tx.objectStore(INFO).put(info, key);
      await finished(tx);
    },
    async drop(key) {
      const tx = store([FILES, INFO], "readwrite");
      tx.objectStore(FILES).delete(key);
      tx.objectStore(INFO).delete(key);
      await finished(tx);
    },
    async touch(key, used) {
      const tx = store([INFO], "readwrite");
      const info = tx.objectStore(INFO);
      const was = await done(info.get(key));
      if (was) info.put({ ...was, used }, key);
      await finished(tx);
    },
    async list() {
      const info = store([INFO]).objectStore(INFO);
      const [keys, values] = await Promise.all([done(info.getAllKeys()), done(info.getAll())]);
      return keys.map((key, i) => ({ key, bytes: values[i]?.bytes ?? 0, used: values[i]?.used ?? 0, first: !!values[i]?.first }));
    },
  };
}
