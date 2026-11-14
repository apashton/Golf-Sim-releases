// A hole's kept parts (sim/bakefile.mjs, server/bakes.mjs): the shapes of
// its ground and what the other cores worked out for it, kept from the
// last time the hole was built - on this graphics setting, by this version
// of the game - so building it again takes each part as it was, rather
// than working it out again (the owner, on the loading: "a proper engine
// rather than this self built one" - a real engine's courses are built
// once, before they're played).
//
// Each part is kept under the fingerprint of everything it was worked out
// from (its inputs), so a part is only ever taken back for the very same
// inputs: the hole's own recipe (in the file's name), and the part's own -
// the sheet it's cut from, the setting's spacing. Anything else that went
// into it changes its fingerprint, and it's worked out afresh.

import * as THREE from "three";
import { fingerprint, encodeBake, decodeBake, bakeKey } from "../sim/bakefile.mjs";

// The stamp of the game's code, from the server (server/bakes.mjs): asked
// once, as the page loads. Null until it's back, and for good if the
// server keeps no holes (an older server, or none to ask).
let stamp = null;
const asking =
  typeof fetch === "function" && typeof location !== "undefined" && /^https?:$/.test(location.protocol)
    ? fetch("/api/bakes")
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          stamp = typeof j?.stamp === "string" ? j.stamp : null;
        })
        .catch(() => {})
    : Promise.resolve();

// Whether holes can be kept: the server gave the code's stamp.
export function bakesOn() {
  return !!stamp;
}

// ---- Shapes as plain data, and back ---------------------------------------------

// A shape (BufferGeometry) as plain data: its attributes in order, its
// index, groups and draw range, and whether its bounds had been worked out.
// copy: its numbers copied (as they are now: it may be changed after).
export function geometryData(geo, copy = false) {
  const arr = (a) => (copy ? a.slice() : a);
  return {
    attributes: Object.entries(geo.attributes).map(([name, a]) => [name, arr(a.array), a.itemSize, !!a.normalized]),
    index: geo.index ? arr(geo.index.array) : null,
    groups: geo.groups.map((g) => ({ ...g })),
    drawRange: [geo.drawRange.start, geo.drawRange.count],
    sphere: !!geo.boundingSphere,
    box: !!geo.boundingBox,
  };
}

// The shape back from its plain data (its numbers taken as they are).
export function geometryFrom(data) {
  const geo = new THREE.BufferGeometry();
  for (const [name, array, itemSize, normalized] of data.attributes) geo.setAttribute(name, new THREE.BufferAttribute(array, itemSize, normalized));
  if (data.index) geo.setIndex(new THREE.BufferAttribute(data.index, 1));
  for (const g of data.groups ?? []) geo.addGroup(g.start, g.count, g.materialIndex);
  if (data.drawRange) geo.setDrawRange(data.drawRange[0], data.drawRange[1]);
  if (data.box) geo.computeBoundingBox();
  if (data.sphere) geo.computeBoundingSphere();
  return geo;
}

// What a shape is, for a fingerprint: its plain data (wherever it is in a
// part's inputs).
const asInput = (v) => (v?.isBufferGeometry ? geometryData(v) : v);
const inputPrint = (inputs) => fingerprint(inputs ?? null, { as: asInput });

// Plain data copied, typed arrays and all - each typed array just its own
// numbers. (structuredClone copies the whole of what a view looks into: a
// part read back from its file looks into the whole file, tens of
// megabytes, copied again for every part taken.)
function copyOf(v) {
  if (v === null || typeof v !== "object") return v;
  if (ArrayBuffer.isView(v)) return v.slice();
  if (Array.isArray(v)) return v.map(copyOf);
  const out = {};
  for (const [k, x] of Object.entries(v)) out[k] = copyOf(x);
  return out;
}

// ---- A hole's kept parts ----------------------------------------------------------

export class HoleBake {
  // key: the file's name (sim/bakefile.mjs bakeKey); kept: its parts, as
  // read (decodeBake), or none.
  constructor(key, kept = new Map()) {
    this.key = key;
    this.kept = kept;
    // The kept parts taken this time, and the ones worked out afresh: what
    // the file will hold next (nothing kept that wasn't asked for).
    this.used = new Map();
    this.made = new Map();
    this.hits = 0;
    this.misses = 0;
    // A course's first hole: kept for good (server/bakes.mjs).
    this.first = false;
    // Time spent on fingerprints and copies, ms.
    this.ms = 0;
  }

  // A part's own key: its name and the fingerprint of its inputs.
  partKey(name, inputs) {
    return `${name}:${inputPrint(inputs)}`;
  }

  // A kept part, a copy (what's kept stays as it was, whatever's done to
  // what's handed out), or undefined.
  take(key) {
    const v = this.used.get(key) ?? this.made.get(key) ?? this.kept.get(key);
    if (v === undefined) return undefined;
    if (!this.made.has(key)) this.used.set(key, v);
    return copyOf(v);
  }

  // Whether a part's kept for these inputs (without taking it).
  has(name, inputs) {
    const key = this.partKey(name, inputs);
    return this.made.has(key) || this.used.has(key) || this.kept.has(key);
  }

  // A shape (BufferGeometry) worked out by make() from `inputs` (plain
  // data, shapes among it) - the kept one if it was worked out from the
  // very same before. keep: whether one just worked out is to be kept (it
  // isn't if it was worked out some other way than it always is).
  geometry(name, inputs, make, { keep = null } = {}) {
    const t = performance.now();
    const key = this.partKey(name, inputs);
    const had = this.take(key);
    this.ms += performance.now() - t;
    if (had) {
      this.hits++;
      return geometryFrom(had);
    }
    const geo = make();
    this.misses++;
    if (keep && !keep()) return geo;
    const t2 = performance.now();
    this.made.set(key, geometryData(geo, true));
    this.ms += performance.now() - t2;
    return geo;
  }

  // The same for plain data (another core's answer: sim/buildtasks.mjs).
  // find: the kept answer for these inputs, or undefined; keep: one just
  // worked out.
  find(name, inputs) {
    const t = performance.now();
    const v = this.take(this.partKey(name, inputs));
    this.ms += performance.now() - t;
    if (v !== undefined) this.hits++;
    return v;
  }

  keep(name, inputs, value) {
    this.keepAt(this.partKey(name, inputs), value);
  }

  // Kept under a key taken before (partKey): for inputs that may have
  // changed since.
  keepAt(key, value) {
    if (value === undefined || value === null) return;
    const t = performance.now();
    this.made.set(key, copyOf(value));
    this.ms += performance.now() - t;
    this.misses++;
  }

  // Whether there's anything new to keep.
  get changed() {
    return this.made.size > 0;
  }

  // What the file will hold: the parts taken and the ones made.
  entries() {
    return new Map([...this.used, ...this.made]);
  }

  // The file's bytes.
  bytes() {
    return encodeBake(this.entries());
  }

  // For the report: { hits, misses, ms }.
  summary() {
    return { hits: this.hits, misses: this.misses, ms: Math.round(this.ms) };
  }
}

// A hole's kept parts from the server: a HoleBake (empty if none are kept
// yet, or the file couldn't be read) - or null if holes can't be kept
// (no stamp, no hole fingerprint). level: the graphics setting.
export async function loadBake(level, holeId) {
  await asking;
  const key = stamp && holeId ? bakeKey(stamp, level, holeId) : null;
  if (!key) return null;
  try {
    const r = await fetch(`/api/bakes/${key}`);
    if (!r.ok) return new HoleBake(key);
    return new HoleBake(key, decodeBake(await r.arrayBuffer()));
  } catch (err) {
    console.warn("Couldn't read the kept hole; building it afresh:", err?.message ?? err);
    return new HoleBake(key);
  }
}

// The name a hole's file has, or would have (as loadBake names it): null
// until the server's given its stamp, and for good if it keeps no holes.
export function keptKey(level, holeId) {
  return stamp && holeId ? bakeKey(stamp, level, holeId) : null;
}

// The names of the holes kept now (a Set), or null if holes aren't kept.
export async function keptHoles() {
  await asking;
  if (!stamp) return null;
  try {
    const r = await fetch("/api/bakes?names=1");
    if (!r.ok) return null;
    const j = await r.json();
    return Array.isArray(j?.names) ? new Set(j.names) : null;
  } catch {
    return null;
  }
}

// Keeps what's new of a hole (in the background: nothing waits on it):
// its parts sent to another core (bakeworker.js) to be put together and
// sent to the server - their numbers handed over, not copied, so the page
// gives up nothing for it. Where there's no worker to be had, here.
// Resolves to the bytes sent, or 0.
let warned = false;
let worker = null;
let workerBroken = typeof Worker === "undefined";
let nextId = 1;
const waiting = new Map();

function bakeWorker() {
  if (workerBroken) return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL("../bakeworker.js", import.meta.url), { type: "module" });
  } catch {
    workerBroken = true;
    return null;
  }
  worker.onmessage = ({ data }) => {
    const done = waiting.get(data.id);
    waiting.delete(data.id);
    done?.(data);
  };
  worker.onerror = () => {
    workerBroken = true;
    worker = null;
    for (const done of waiting.values()) done({ error: "the worker stopped" });
    waiting.clear();
  };
  return worker;
}

// Every buffer under a value (once each), to hand over with it.
function buffers(v, out = new Set()) {
  if (!v || typeof v !== "object") return out;
  if (ArrayBuffer.isView(v)) {
    if (v.buffer instanceof ArrayBuffer) out.add(v.buffer);
    return out;
  }
  for (const x of v instanceof Map ? v.values() : Object.values(v)) buffers(x, out);
  return out;
}

// Where a hole's kept: a course's first hole marked to be kept for good.
export const bakeUrl = (key, first = false) => `/api/bakes/${key}${first ? "?first=1" : ""}`;

export async function saveBake(bake) {
  if (!bake?.changed) return 0;
  const fail = (err) => {
    if (!warned) console.warn("Couldn't keep the hole for next time:", err?.message ?? err);
    warned = true;
    return 0;
  };
  const w = bakeWorker();
  if (w) {
    // (Its parts are the bake's own copies, and what was read from its
    // file, which nothing else looks into: handed over whole.)
    const entries = bake.entries();
    const id = nextId++;
    const answer = new Promise((resolve) => waiting.set(id, resolve));
    try {
      w.postMessage({ id, key: bake.key, first: bake.first, entries, back: IN_POCKET }, [...buffers(entries)]);
    } catch (err) {
      waiting.delete(id);
      return fail(err);
    }
    const r = await answer;
    if (r.error) return fail(new Error(r.error));
    // (On the phone the worker hands the bytes back: its server's in the
    // page - pocket/start.js - out of a worker's reach.)
    return r.data ? send(bake, r.data, fail) : r.bytes;
  }
  return send(bake, bake.bytes(), fail);
}
const IN_POCKET = typeof window !== "undefined" && !!window.pocket;
async function send(bake, bytes, fail) {
  try {
    const r = await fetch(bakeUrl(bake.key, bake.first), { method: "PUT", headers: { "Content-Type": "application/octet-stream" }, body: new Blob([bytes]) });
    if (!r.ok) throw new Error(`the server said ${r.status}`);
    return bytes.byteLength;
  } catch (err) {
    return fail(err);
  }
}

// A hole's own fingerprint, for its file's name: what the other cores make
// it again from (course.js offloadSite: its recipe, and by the sea the
// course and where it lies), with anything else given.
export function holeFingerprint(site, extra = {}) {
  if (!site) return null;
  try {
    return fingerprint({ site, ...extra });
  } catch {
    return null;
  }
}
