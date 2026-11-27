// An MP4 file from H.264 frames already encoded: what a replay's clip is
// written as (replayring.js). One video track, every frame in one piece
// after the index, so it plays from the first byte anywhere - the game's
// own boxes, a phone, YouTube.
//
// Why here rather than MediaRecorder's own file: a replay is the last few
// seconds of a camera that's been encoded all along (sim/clipring.mjs), so
// the frames exist before anyone knows a file is wanted. MediaRecorder can
// only write what it encodes from the moment it's started - which is why
// each camera once kept two of them going, started again every few
// seconds, and why that cost what it did (the owner, 21 November 2026,
// after replays were moved to the processor as VP8: "incredibly slow ...
// minutes in between things happening" - measured, one camera's two VP8
// recorders took four whole cores).
//
// The frames are as WebCodecs gives them with avc: { format: "avc" }: each
// a run of NAL units with a four-byte length before each, the stream's
// settings (SPS/PPS: the AVCDecoderConfigurationRecord) apart, as
// `description`. No B-frames (the encoders used make none in real time), so
// frames are shown in the order they're stored.
//
// Pure: bytes in, bytes out.

const TIMESCALE = 90000;

// The H.264 codec string for a picture this size and rate: constrained
// baseline (which every software encoder makes) at the lowest level that
// allows it. Levels: the most macroblocks a second and in a frame.
const LEVELS = [
  [0x1e, 40500, 1620], // 3.0
  [0x1f, 108000, 3600], // 3.1: 720p30
  [0x20, 216000, 5120], // 3.2: 720p60
  [0x28, 245760, 8192], // 4.0: 1080p30
  [0x2a, 522240, 8704], // 4.2: 1080p60
  [0x32, 589824, 22080], // 5.0
  [0x33, 983040, 36864], // 5.1: 4K30
  [0x34, 2073600, 36864], // 5.2: 4K60
];
export function avcCodec(width, height, fps) {
  const mbs = Math.ceil(Math.max(16, width) / 16) * Math.ceil(Math.max(16, height) / 16);
  const rate = mbs * Math.max(1, fps || 30);
  const level = LEVELS.find(([, perSecond, perFrame]) => rate <= perSecond && mbs <= perFrame) ?? LEVELS[LEVELS.length - 1];
  return `avc1.42E0${level[0].toString(16).toUpperCase().padStart(2, "0")}`;
}

const text = (s) => Uint8Array.from(s, (c) => c.charCodeAt(0));
const u16 = (n) => [(n >>> 8) & 255, n & 255];
const u32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];

function concat(parts) {
  let size = 0;
  for (const p of parts) size += p.length;
  const out = new Uint8Array(size);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

// A box: its size, its four letters, what's in it.
function box(type, ...parts) {
  const body = concat(parts.map((p) => (p instanceof Uint8Array ? p : Uint8Array.from(p))));
  return concat([Uint8Array.from(u32(body.length + 8)), text(type), body]);
}
// A "full" box: a version and flags first.
const full = (type, version, flags, ...parts) => box(type, [version, (flags >>> 16) & 255, (flags >>> 8) & 255, flags & 255], ...parts);

const MATRIX = [...u32(0x00010000), ...u32(0), ...u32(0), ...u32(0), ...u32(0x00010000), ...u32(0), ...u32(0), ...u32(0), ...u32(0x40000000)];

// Each frame's length on the file's clock, from when each was taken
// (microseconds): the next one's time less its own, the last as long as the
// one before it (or `endTs` less its own, where that's known). Rounded
// from the running total, so the lengths never drift from the times.
export function frameTicks(times, endTs = null) {
  const at = (t) => Math.round(((t - times[0]) * TIMESCALE) / 1e6);
  const out = [];
  for (let i = 0; i < times.length; i++) {
    const next = i + 1 < times.length ? times[i + 1] : endTs != null && endTs > times[i] ? endTs : null;
    out.push(next != null ? Math.max(1, at(next) - at(times[i])) : (out[i - 1] ?? Math.round(TIMESCALE / 30)));
  }
  return out;
}

// The file. width, height: the picture's size. description: the stream's
// settings (Uint8Array or ArrayBuffer). samples: [{ data: Uint8Array, ts
// (microseconds), key }] in order, the first a key frame. endTs: when the
// last frame's time is up, if known. Returns { bytes: Uint8Array, duration
// (seconds) }, or null when there's nothing to make one from.
export function muxMp4({ width, height, description, samples, endTs = null }) {
  if (!description || !Array.isArray(samples) || !samples.length || !samples[0].key) return null;
  const avcC = description instanceof Uint8Array ? description : new Uint8Array(description);
  const ticks = frameTicks(
    samples.map((s) => s.ts),
    endTs,
  );
  const total = ticks.reduce((a, b) => a + b, 0);

  // stts: runs of frames the same length.
  const runs = [];
  for (const d of ticks) {
    const last = runs[runs.length - 1];
    if (last && last[1] === d) last[0]++;
    else runs.push([1, d]);
  }
  const keys = [];
  samples.forEach((s, i) => s.key && keys.push(i + 1));

  const stbl = (dataAt) =>
    box(
      "stbl",
      full(
        "stsd",
        0,
        0,
        u32(1),
        box(
          "avc1",
          [0, 0, 0, 0, 0, 0],
          u16(1), // the one place the data is (dref)
          new Uint8Array(16),
          u16(width),
          u16(height),
          u32(0x00480000),
          u32(0x00480000),
          u32(0),
          u16(1),
          new Uint8Array(32),
          u16(0x0018),
          [0xff, 0xff],
          box("avcC", avcC),
        ),
      ),
      full("stts", 0, 0, u32(runs.length), ...runs.map(([n, d]) => [...u32(n), ...u32(d)])),
      full("stss", 0, 0, u32(keys.length), ...keys.map((k) => u32(k))),
      // Every frame in the one chunk.
      full("stsc", 0, 0, u32(1), u32(1), u32(samples.length), u32(1)),
      full("stsz", 0, 0, u32(0), u32(samples.length), ...samples.map((s) => u32(s.data.length))),
      full("stco", 0, 0, u32(1), u32(dataAt)),
    );
  const moov = (dataAt) =>
    box(
      "moov",
      full("mvhd", 0, 0, u32(0), u32(0), u32(TIMESCALE), u32(total), u32(0x00010000), u16(0x0100), new Uint8Array(10), MATRIX, new Uint8Array(24), u32(2)),
      box(
        "trak",
        full("tkhd", 0, 3, u32(0), u32(0), u32(1), u32(0), u32(total), new Uint8Array(8), u16(0), u16(0), u16(0), u16(0), MATRIX, u32(width << 16), u32(height << 16)),
        box(
          "mdia",
          full("mdhd", 0, 0, u32(0), u32(0), u32(TIMESCALE), u32(total), u16(0x55c4), u16(0)),
          full("hdlr", 0, 0, u32(0), text("vide"), new Uint8Array(12), text("Video\0")),
          box("minf", full("vmhd", 0, 1, new Uint8Array(8)), box("dinf", full("dref", 0, 0, u32(1), full("url ", 0, 1))), stbl(dataAt)),
        ),
      ),
    );

  const ftyp = box("ftyp", text("isom"), u32(0x200), text("isom"), text("iso2"), text("avc1"), text("mp41"));
  // The index says where the frames start, which depends on its own
  // length: made once to measure it, then with the place filled in.
  const dataAt = ftyp.length + moov(0).length + 8;
  const mdat = box("mdat", ...samples.map((s) => s.data));
  return { bytes: concat([ftyp, moov(dataAt), mdat]), duration: total / TIMESCALE };
}

// The boxes in a file (or inside a box's contents), for the tests and for
// looking at one: [{ type, start, size, body: [from, to] }].
export function readBoxes(bytes, from = 0, to = bytes.length) {
  const out = [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let at = from;
  while (at + 8 <= to) {
    const size = view.getUint32(at);
    if (size < 8 || at + size > to) break;
    out.push({ type: String.fromCharCode(...bytes.subarray(at + 4, at + 8)), start: at, size, body: [at + 8, at + size] });
    at += size;
  }
  return out;
}
