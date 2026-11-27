// A hole's kept parts (look/bake.js): what building it worked out the last
// time - the shapes of its ground, what the other cores worked out - kept
// in one file on this PC (server/bakes.mjs), so building the same hole
// again takes them as they were rather than working them out again.
//
// Pure: a fingerprint of any plain data (what a part was worked out from),
// and a kept hole's parts to and from the bytes of its file.

// ---- Fingerprints -----------------------------------------------------------------

// Two runs of a 32-bit hash side by side (murmur3's mixing, two seeds):
// 64 bits, as 16 hex digits. Not for secrets - for telling one part's
// input from another's, millions of numbers at a time, quickly.
const C1 = 0xcc9e2d51;
const C2 = 0x1b873593;

class Hasher {
  constructor() {
    this.a = 0x9747b28c;
    this.b = 0x2f6f1d3b;
    this.n = 0;
  }

  word(w) {
    let k = Math.imul(w, C1);
    k = (k << 15) | (k >>> 17);
    k = Math.imul(k, C2);
    let a = this.a ^ k;
    a = (a << 13) | (a >>> 19);
    this.a = (Math.imul(a, 5) + 0xe6546b64) | 0;
    let j = Math.imul(w ^ 0x5bd1e995, C2);
    j = (j << 17) | (j >>> 15);
    j = Math.imul(j, C1);
    let b = this.b ^ j;
    b = (b << 11) | (b >>> 21);
    this.b = (Math.imul(b, 9) + 0x52dce729) | 0;
    this.n++;
  }

  words(u32) {
    for (let i = 0; i < u32.length; i++) this.word(u32[i]);
  }

  bytes(u8) {
    const whole = u8.length >> 2;
    for (let i = 0; i < whole; i++) this.word(u8[i * 4] | (u8[i * 4 + 1] << 8) | (u8[i * 4 + 2] << 16) | (u8[i * 4 + 3] << 24));
    let w = 0;
    for (let i = whole * 4; i < u8.length; i++) w |= u8[i] << ((i - whole * 4) * 8);
    this.word(w ^ (u8.length << 24));
  }

  digest() {
    const fin = (h, n) => {
      h ^= n;
      h ^= h >>> 16;
      h = Math.imul(h, 0x85ebca6b);
      h ^= h >>> 13;
      h = Math.imul(h, 0xc2b2ae35);
      h ^= h >>> 16;
      return (h >>> 0).toString(16).padStart(8, "0");
    };
    return fin(this.a, this.n) + fin(this.b ^ 0x68e31da4, this.n * 3);
  }
}

const TYPED = ["Int8Array", "Uint8Array", "Uint8ClampedArray", "Int16Array", "Uint16Array", "Int32Array", "Uint32Array", "Float32Array", "Float64Array", "BigInt64Array", "BigUint64Array"];
const typedName = (v) => (ArrayBuffer.isView(v) && !(v instanceof DataView) ? v.constructor.name : null);
const f64 = new Float64Array(1);
const f64words = new Uint32Array(f64.buffer);

// A fingerprint of a value made of plain data: null, true and false,
// numbers, strings, lists, objects (whatever order their keys were set in)
// and typed arrays (by their bytes and their type). A function in it (a
// way of working something out, not data) is a mistake: it throws, unless
// skipFunctions, when it's left out as if it weren't there. as: given each
// object met, what to take in its place (a shape's own plain data, say).
export function fingerprint(value, { skipFunctions = false, as = null } = {}) {
  const h = new Hasher();
  const seen = new Map();
  const str = (s) => {
    h.word(s.length);
    for (let i = 0; i < s.length; i += 2) h.word(s.charCodeAt(i) | ((i + 1 < s.length ? s.charCodeAt(i + 1) : 0) << 16));
  };
  const walk = (v) => {
    if (v === null) return h.word(1);
    if (v === undefined) return h.word(2);
    const t = typeof v;
    if (t === "boolean") return h.word(v ? 3 : 4);
    if (t === "number") {
      h.word(5);
      f64[0] = Object.is(v, -0) ? 0 : v;
      h.word(f64words[0]);
      return h.word(f64words[1]);
    }
    if (t === "string") {
      h.word(6);
      return str(v);
    }
    if (t === "bigint") {
      h.word(7);
      return str(v.toString());
    }
    if (t === "function") {
      if (skipFunctions) return h.word(8);
      throw new Error("A fingerprint is of data: there's a function in it");
    }
    if (as) v = as(v);
    if (v === null || typeof v !== "object") return walk(v);
    // (An object met again - a loop, or one shared - by where it was met.)
    if (seen.has(v)) {
      h.word(9);
      return h.word(seen.get(v));
    }
    seen.set(v, seen.size);
    const typed = typedName(v);
    if (typed) {
      h.word(10);
      h.word(TYPED.indexOf(typed));
      h.word(v.length);
      if (v.byteOffset % 4 === 0 && v.byteLength % 4 === 0) h.words(new Uint32Array(v.buffer, v.byteOffset, v.byteLength / 4));
      else h.bytes(new Uint8Array(v.buffer, v.byteOffset, v.byteLength));
      return;
    }
    if (v instanceof ArrayBuffer) {
      h.word(11);
      return h.bytes(new Uint8Array(v));
    }
    if (Array.isArray(v)) {
      h.word(12);
      h.word(v.length);
      for (const x of v) walk(x);
      return;
    }
    if (v instanceof Map || v instanceof Set) throw new Error("A fingerprint is of plain data: there's a Map or Set in it");
    h.word(13);
    const keys = Object.keys(v)
      .filter((k) => !(skipFunctions && typeof v[k] === "function"))
      .sort();
    h.word(keys.length);
    for (const k of keys) {
      str(k);
      walk(v[k]);
    }
  };
  walk(value);
  return h.digest();
}

// ---- The file --------------------------------------------------------------------
//
//   "A2BAKE01"                 8 bytes
//   the description's length   4 bytes (little-endian), then 4 nought
//   the description            JSON, UTF-8: { v, entries: { key: value } },
//                              every typed array in it a { "$ta": [type,
//                              offset, length] } and every number JSON
//                              can't say a { "$num": "NaN" } (or
//                              "Infinity", "-Infinity")
//   noughts to a multiple of 8
//   the typed arrays' bytes, each starting on a multiple of 8 from there

export const BAKE_FORMAT = 1;
const MAGIC = "A2BAKE01";

// A kept hole's parts (key: value) as the bytes of its file.
export function encodeBake(entries) {
  const blobs = [];
  let at = 0;
  const pack = (v) => {
    if (v === null || typeof v === "boolean" || typeof v === "string") return v;
    if (typeof v === "number") return Number.isFinite(v) ? v : { $num: String(v) };
    if (v === undefined) return null;
    const typed = typedName(v);
    if (typed) {
      if (!TYPED.includes(typed)) throw new Error(`Can't keep a ${typed}`);
      const bytes = new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
      blobs.push({ at, bytes });
      const out = { $ta: [typed, at, v.length] };
      at += Math.ceil(v.byteLength / 8) * 8;
      return out;
    }
    if (Array.isArray(v)) return v.map(pack);
    if (typeof v === "object") {
      const out = {};
      for (const [k, x] of Object.entries(v)) if (typeof x !== "function") out[k] = pack(x);
      return out;
    }
    throw new Error(`Can't keep a ${typeof v}`);
  };
  const described = { v: BAKE_FORMAT, entries: {} };
  for (const [k, v] of entries) described.entries[k] = pack(v);
  const json = new TextEncoder().encode(JSON.stringify(described));
  const head = 16 + Math.ceil(json.length / 8) * 8;
  const out = new Uint8Array(head + at);
  for (let i = 0; i < MAGIC.length; i++) out[i] = MAGIC.charCodeAt(i);
  new DataView(out.buffer).setUint32(8, json.length, true);
  out.set(json, 16);
  for (const b of blobs) out.set(b.bytes, head + b.at);
  return out.buffer;
}

// The parts back from a file's bytes (an ArrayBuffer): a Map, key: value,
// each typed array a view on those bytes (not a copy). Throws if it isn't
// one of these files, or is cut short.
export function decodeBake(buffer) {
  if (!(buffer instanceof ArrayBuffer) || buffer.byteLength < 16) throw new Error("Not a kept hole: too short");
  const u8 = new Uint8Array(buffer);
  for (let i = 0; i < MAGIC.length; i++) if (u8[i] !== MAGIC.charCodeAt(i)) throw new Error("Not a kept hole");
  const len = new DataView(buffer).getUint32(8, true);
  if (16 + len > buffer.byteLength) throw new Error("A kept hole cut short");
  const described = JSON.parse(new TextDecoder().decode(u8.subarray(16, 16 + len)));
  if (described?.v !== BAKE_FORMAT || typeof described.entries !== "object") throw new Error("A kept hole of another kind");
  const head = 16 + Math.ceil(len / 8) * 8;
  const unpack = (v) => {
    if (v === null || typeof v !== "object") return v;
    if (Array.isArray(v)) return v.map(unpack);
    if (Array.isArray(v.$ta) && Object.keys(v).length === 1) {
      const [type, at, n] = v.$ta;
      if (!TYPED.includes(type)) throw new Error(`A kept hole with a ${type} in it`);
      const Ctor = globalThis[type];
      if (head + at + n * Ctor.BYTES_PER_ELEMENT > buffer.byteLength) throw new Error("A kept hole cut short");
      return new Ctor(buffer, head + at, n);
    }
    if (typeof v.$num === "string" && Object.keys(v).length === 1) return Number(v.$num);
    const out = {};
    for (const [k, x] of Object.entries(v)) out[k] = unpack(x);
    return out;
  };
  return new Map(Object.entries(described.entries).map(([k, v]) => [k, unpack(v)]));
}

// A kept hole's file name, less its ".bin": the code's stamp (the game's
// own code, server/bakes.mjs codeStamp), the graphics setting and the
// hole's own fingerprint. Null if any is missing or not as it should be.
export const BAKE_KEY = /^[0-9a-f]{16}-[a-z]{1,12}-[0-9a-f]{16}$/;
export function bakeKey(stamp, level, holeId) {
  const key = `${stamp}-${level}-${holeId}`;
  return BAKE_KEY.test(key) ? key : null;
}
