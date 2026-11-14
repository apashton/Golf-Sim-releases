// Holes kept once built, on the phone (the Android app): the pocket
// server's answer to /api/bakes (look/bake.js), as the PC's server keeps
// them in a folder (server/bakes.mjs) - so a hole played before is built
// from what was worked out for it then, rather than all over again, a
// phone's slow cores working out its ground and grass each time.
//
// The same requests and the same rules as the PC's: each hole's file named
// by the stamp of the game's code (here the app's own build: a new app
// keeps nothing of the last one's, and its files are cleared away), the
// least lately used going first past POCKET_BAKES_MAX - a course's first
// hole last. The files themselves are kept in the page's own storage
// (pocket/bakestore.mjs: IndexedDB, which keeps them as files on the
// phone); this is what's done with them. Pure: the storage and the clock
// are handed in. test/pocketbakes.test.mjs covers it.
//
// storage: {
//   read(key) -> Promise of the file's bytes (ArrayBuffer) or null,
//   write(key, bytes, info), drop(key), list() -> Promise of
//   [{ key, bytes, used, first }], touch(key, used) }.

import { BAKE_KEY, fingerprint } from "./bakefile.mjs";

// The most the phone keeps: a hole on Medium is a few megabytes, so a
// hundred-odd holes - a phone's storage is smaller than a PC's.
export const POCKET_BAKES_MAX = 500 * 1024 ** 2;
// The most one file may be (as the PC's: server/bakes.mjs BAKE_MAX_FILE).
export const POCKET_BAKE_FILE = 512 * 1024 ** 2;

// The stamp of the app's build (pocket/app.json: its version, when it was
// built and from what), 16 hex digits as a kept hole's name wants.
export function appStamp(app) {
  return fingerprint(["pocket", app?.version ?? null, app?.built ?? null, app?.commit ?? null]);
}

export class PocketBakes {
  constructor(storage, { stamp, maxBytes = POCKET_BAKES_MAX, maxFile = POCKET_BAKE_FILE, now = () => Date.now() } = {}) {
    this.storage = storage;
    this.stamp = typeof stamp === "string" && /^[0-9a-f]{16}$/.test(stamp) ? stamp : null;
    this.maxBytes = maxBytes;
    this.maxFile = maxFile;
    this.now = now;
    // The files of other builds cleared away once, the first time asked.
    this.tidied = null;
  }

  tidy() {
    this.tidied ??= this.prune().catch((err) => console.warn("Couldn't tidy the kept holes:", err?.message ?? err));
    return this.tidied;
  }

  // What's kept: { files, bytes, firsts }.
  async size() {
    const list = await this.storage.list();
    return { files: list.length, bytes: list.reduce((a, f) => a + f.bytes, 0), firsts: list.filter((f) => f.first).length, dir: null };
  }

  // A kept hole's bytes, or null - marked as just used.
  async get(key) {
    const bytes = await this.storage.read(key);
    if (bytes) await this.storage.touch(key, this.now());
    return bytes;
  }

  // Keeps a hole (only one of this build's), then trims what's kept.
  async put(key, bytes, { first = false } = {}) {
    if (!this.stamp || !key.startsWith(`${this.stamp}-`)) throw Object.assign(new Error("Kept by another version of the game"), { status: 409 });
    if (bytes.byteLength > this.maxFile) throw Object.assign(new Error("Too big to keep"), { status: 413 });
    await this.storage.write(key, bytes, { bytes: bytes.byteLength, used: this.now(), first: !!first });
    await this.prune();
    return bytes.byteLength;
  }

  async clear() {
    for (const f of await this.storage.list()) await this.storage.drop(f.key);
  }

  // Another build's files go; then the least lately used until what's
  // kept is under its size, the courses' first holes kept longest.
  async prune() {
    const keep = [];
    for (const f of await this.storage.list()) {
      if (this.stamp && f.key.startsWith(`${this.stamp}-`)) keep.push(f);
      else await this.storage.drop(f.key);
    }
    keep.sort((a, b) => b.first - a.first || b.used - a.used);
    let total = 0;
    for (const f of keep) {
      total += f.bytes;
      if (total > this.maxBytes) await this.storage.drop(f.key);
    }
  }

  // A request to /api/bakes... as the PC's server answers it
  // (server/bakes.mjs handleBakes): { status, json } or { status, bytes }.
  // body: a PUT's bytes (an ArrayBuffer).
  async handle({ method, path, query, body }) {
    const json = (status, value) => ({ status, json: value });
    // (Nowhere to keep them: none kept, every hole built afresh.)
    if (!this.storage) return path === "/api/bakes" && method === "GET" ? json(200, { stamp: null, files: 0, bytes: 0, firsts: 0, dir: null }) : json(404, { error: "Not kept" });
    await this.tidy();
    if (path === "/api/bakes") {
      if (method === "GET") return json(200, { stamp: this.stamp, ...(await this.size()), ...(query?.get?.("names") === "1" ? { names: (await this.storage.list()).map((f) => f.key) } : {}) });
      if (method === "DELETE") {
        await this.clear();
        return json(200, { ok: true });
      }
      return json(405, { error: "Not allowed" });
    }
    const key = decodeURIComponent(path.slice("/api/bakes/".length));
    if (!BAKE_KEY.test(key)) return json(400, { error: "Bad kept hole name" });
    if (method === "GET") {
      const bytes = await this.get(key);
      return bytes ? { status: 200, bytes } : json(404, { error: "Not kept" });
    }
    if (method === "PUT") {
      if (!(body instanceof ArrayBuffer)) return json(400, { error: "No hole to keep" });
      try {
        return json(200, { ok: true, bytes: await this.put(key, body, { first: query?.get?.("first") === "1" }) });
      } catch (err) {
        return json(err.status ?? 500, { error: err.message });
      }
    }
    return json(405, { error: "Not allowed" });
  }
}

// Storage in memory, as the tests use it (and the page where IndexedDB
// can't be had: kept only while it's open).
export function memoryBakeStorage() {
  const files = new Map();
  return {
    files,
    async read(key) {
      return files.get(key)?.data ?? null;
    },
    async write(key, data, info) {
      files.set(key, { data, ...info });
    },
    async drop(key) {
      files.delete(key);
    },
    async touch(key, used) {
      const f = files.get(key);
      if (f) f.used = used;
    },
    async list() {
      return [...files].map(([key, f]) => ({ key, bytes: f.bytes, used: f.used, first: f.first }));
    },
  };
}
