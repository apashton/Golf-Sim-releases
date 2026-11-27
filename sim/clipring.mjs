// A camera's last few seconds, already encoded: the frames a replay is cut
// from when a shot comes (replayring.js; written out by sim/mp4mux.mjs).
//
// The camera is encoded once, all the time replay is on, by one encoder
// that's never restarted; each frame it makes is kept here with when it
// was taken, and the old ones dropped as new ones come. A clip can only
// begin on a key frame (a whole picture: the frames after it are changes
// from it), so one is asked for every KEY_EVERY_MS and a clip begins on the
// last key frame at or before the moment it's wanted from - up to that
// long early, never late.
//
// Before this each camera kept two recorders going, half a cycle apart,
// each started again every few seconds (sim/clips.mjs rollPlan): two
// encoders a camera, made and closed over and over. That churn was in the
// graphics crashes while it was the graphics card's encoder (#591, #592,
// #649), and took every core the PC had once it was the processor's VP8
// (the owner, 21 November 2026: "incredibly slow"). One steady H.264
// encoder a camera, on the processor, is about a tenth of that.
//
// Pure: no browser here.

// A key frame this often (ms).
export const KEY_EVERY_MS = 500;
// Kept beyond the longest pre-roll and a key frame's wait (ms).
export const RING_SPARE_MS = 1500;

export class ClipRing {
  // keepMs: how far back a clip may begin (the pre-roll).
  constructor({ keepMs = 3000 } = {}) {
    this.keepMs = keepMs;
    this.frames = []; // { at (ms, the page's clock), ts (µs, the camera's), key, data }
    this.bytes = 0;
  }

  setKeep(ms) {
    this.keepMs = ms;
  }

  // A frame from the encoder, in order.
  push(frame) {
    this.frames.push(frame);
    this.bytes += frame.data.length;
  }

  get length() {
    return this.frames.length;
  }

  // When the newest frame was taken, or null.
  get newest() {
    return this.frames.length ? this.frames[this.frames.length - 1].at : null;
  }

  // What's too old to begin a clip is dropped: everything before the last
  // key frame at or before `now - keepMs - RING_SPARE_MS` - or before
  // `hold`, where a shot's clip is still to be cut from further back.
  prune(now, hold = null) {
    const before = Math.min(now - this.keepMs - RING_SPARE_MS, hold ?? Infinity);
    let cut = -1;
    for (let i = 0; i < this.frames.length; i++) {
      if (this.frames[i].at > before) break;
      if (this.frames[i].key) cut = i;
    }
    if (cut <= 0) return 0;
    for (let i = 0; i < cut; i++) this.bytes -= this.frames[i].data.length;
    this.frames.splice(0, cut);
    return cut;
  }

  // The frames for a clip from `from` to `to` (the page's clock, ms): from
  // the last key frame at or before `from` (the first there is, when the
  // ring doesn't go back that far) to the last frame taken by `to`.
  // { frames, startAt, endAt } - endAt: when the frame after the last was
  // taken (the last one's time up), or the last one's own - or null when
  // there's no key frame to begin on or nothing in that time.
  span(from, to) {
    let first = -1;
    for (let i = 0; i < this.frames.length; i++) {
      const f = this.frames[i];
      if (!f.key) continue;
      if (f.at <= from || first < 0) first = i;
      if (f.at > from) break;
    }
    if (first < 0) return null;
    let last = -1;
    for (let i = first; i < this.frames.length && this.frames[i].at <= to; i++) last = i;
    if (last < first) return null;
    const next = this.frames[last + 1];
    return { frames: this.frames.slice(first, last + 1), startAt: this.frames[first].at, endAt: next ? next.at : this.frames[last].at, endTs: next ? next.ts : null };
  }

  clear() {
    this.frames = [];
    this.bytes = 0;
  }
}

// Whether the frames up to `to` are all in: one taken after it has come, or
// it's `graceMs` past (the camera stalled, or its encoder is behind).
export function spanReady(ring, to, now, graceMs = 700) {
  const newest = ring.newest;
  return (newest != null && newest > to) || now >= to + graceMs;
}
