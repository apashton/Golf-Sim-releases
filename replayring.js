// One camera's replays from one steady encoder: the camera's frames are
// encoded as H.264 all the time replay is on (WebCodecs, on the processor),
// the last few seconds of them kept (sim/clipring.mjs), and a shot's clip
// is those frames written out as an MP4 (sim/mp4mux.mjs) - nothing encoded
// again, no recorder started or stopped.
//
// It stands in for replay.js's Roller (two MediaRecorders a camera,
// restarted every few seconds), which is kept for a browser that can't do
// this. Why: sim/clipring.mjs.
//
// The encoder is asked for on the processor (hardwareAcceleration
// "prefer-software"): about half a core for a 720p60 camera, and nothing of
// the graphics card's, whose encoder was in the graphics crashes (#591,
// #592, #649). Only where the processor's isn't there is the browser left
// to choose - one encoder for the whole session then, not one every few
// seconds.
//
// A PC too busy to keep up drops camera frames here rather than queue them
// (the replay's a little jerky; the game isn't held up).

import { ClipRing, KEY_EVERY_MS, spanReady } from "./sim/clipring.mjs";
import { muxMp4, avcCodec } from "./sim/mp4mux.mjs";

// Frames waiting on the encoder before one's dropped.
const QUEUE_MOST = 3;

// Whether this browser can encode a camera this way at all.
export const ringCapable = () => typeof VideoEncoder !== "undefined" && typeof MediaStreamTrackProcessor !== "undefined";

// The encoder's settings for a camera's picture, the processor's first:
// the first of them this browser supports, or null. { config, where:
// "processor" | "browser's choice" }.
export async function ringConfig({ width, height, fps, bits }) {
  if (!ringCapable()) return null;
  // (H.264 wants even sizes.)
  const w = Math.max(2, Math.round(width / 2) * 2);
  const h = Math.max(2, Math.round(height / 2) * 2);
  const base = { codec: avcCodec(w, h, fps), width: w, height: h, bitrate: bits, framerate: fps, latencyMode: "realtime", avc: { format: "avc" } };
  for (const [hardwareAcceleration, where] of [
    ["prefer-software", "processor"],
    ["no-preference", "browser's choice"],
  ]) {
    const config = { ...base, hardwareAcceleration };
    try {
      if ((await VideoEncoder.isConfigSupported(config)).supported) return { config, where };
    } catch {
      // Not one it knows: the next.
    }
  }
  return null;
}

export class RingRecorder {
  // cam, stream: the camera and its picture. bits: the bitrate. preRollMs:
  // how far back a clip begins. done(clip): a shot's clip is ready (as
  // Roller's). unsupported(): this browser can't after all - replay.js
  // puts a Roller in its place.
  constructor({ cam, stream, bits, preRollMs, done, unsupported = () => {} }) {
    Object.assign(this, { cam, stream, bits, done, unsupported });
    this.ring = new ClipRing({ keepMs: preRollMs });
    this.claims = []; // { meta, at, pre, post, from, to }
    this.stopped = false;
    this.encoder = null;
    this.track = null;
    this.description = null;
    this.where = null;
    this.dropped = 0;
    this.failures = 0;
    this.lastKeyAt = -Infinity;
    this.start();
  }

  // How many encoders are running (one, once it's going).
  get encoders() {
    return this.encoder && this.encoder.state === "configured" ? 1 : 0;
  }

  get kind() {
    return "MP4";
  }

  size() {
    const s = this.stream.getVideoTracks()[0]?.getSettings?.() ?? {};
    return { width: s.width || this.cam.width, height: s.height || this.cam.height, fps: Math.round(s.frameRate || this.cam.fps) || 30 };
  }

  async start() {
    const size = this.size();
    const found = await ringConfig({ ...size, bits: this.bits });
    if (this.stopped) return;
    if (!found) return this.unsupported(this);
    const source = this.stream.getVideoTracks()[0];
    if (!source) return this.unsupported(this);
    this.where = found.where;
    this.config = found.config;
    try {
      this.encoder = new VideoEncoder({ output: (chunk, meta) => this.encoded(chunk, meta), error: (err) => this.failed(err) });
      this.encoder.configure(found.config);
      // Its own copy of the camera's track: stopping it leaves the live
      // picture (and anything else reading the camera) alone.
      this.track = source.clone();
      this.reader = new MediaStreamTrackProcessor({ track: this.track }).readable.getReader();
    } catch (err) {
      console.warn(`Replay for ${this.cam.name} couldn't encode this way:`, err);
      this.close();
      return this.unsupported(this);
    }
    this.pump(this.encoder, this.reader);
  }

  // The camera's frames to the encoder, one at a time, each with when it
  // came (the encoder hands them back in order).
  async pump(encoder, reader) {
    this.times = [];
    try {
      while (!this.stopped && this.encoder === encoder) {
        const { value: frame, done } = await reader.read();
        if (done) break;
        const now = performance.now();
        if (this.stopped || this.encoder !== encoder || encoder.state !== "configured") {
          frame.close();
          break;
        }
        if (encoder.encodeQueueSize >= QUEUE_MOST) {
          this.dropped++;
          frame.close();
          continue;
        }
        const keyFrame = now - this.lastKeyAt >= KEY_EVERY_MS;
        if (keyFrame) this.lastKeyAt = now;
        this.times.push({ ts: frame.timestamp, at: now });
        try {
          encoder.encode(frame, { keyFrame });
        } finally {
          frame.close();
        }
      }
    } catch (err) {
      if (!this.stopped && this.encoder === encoder) this.failed(err);
    }
  }

  encoded(chunk, meta) {
    if (this.stopped) return;
    if (meta?.decoderConfig?.description) this.description = new Uint8Array(meta.decoderConfig.description.slice ? meta.decoderConfig.description.slice(0) : meta.decoderConfig.description);
    // When this frame came off the camera.
    let at = performance.now();
    while (this.times.length && this.times[0].ts <= chunk.timestamp) {
      const t = this.times.shift();
      if (t.ts === chunk.timestamp) at = t.at;
    }
    const data = new Uint8Array(chunk.byteLength);
    chunk.copyTo(data);
    this.ring.push({ at, ts: chunk.timestamp, key: chunk.type === "key", data });
  }

  // The encoder stopped by itself (or the camera's frames did): started
  // again in a few seconds, a few times; then a Roller instead.
  failed(err) {
    if (this.stopped) return;
    console.warn(`Replay for ${this.cam.name} stopped encoding:`, err);
    this.close();
    this.failures++;
    if (this.failures > 3) return this.unsupported(this);
    this.retryAt = performance.now() + 5000;
  }

  close() {
    const { encoder, track, reader } = this;
    this.encoder = null;
    this.track = null;
    this.reader = null;
    this.ring.clear();
    this.lastKeyAt = -Infinity;
    try {
      reader?.cancel().catch(() => {});
    } catch {
      // Gone already.
    }
    try {
      track?.stop();
    } catch {
      // Gone already.
    }
    try {
      if (encoder && encoder.state !== "closed") encoder.close();
    } catch {
      // Closed already.
    }
  }

  tick(now) {
    if (this.stopped) return;
    if (!this.encoder && this.retryAt && now >= this.retryAt) {
      this.retryAt = null;
      this.start();
    }
    // Each shot whose post-roll is over, and its frames in: its clip.
    const ready = this.claims.filter((c) => spanReady(this.ring, c.to, now));
    if (ready.length) {
      this.claims = this.claims.filter((c) => !ready.includes(c));
      for (const c of ready) this.cut(c);
    }
    this.ring.prune(now, this.claims.length ? Math.min(...this.claims.map((c) => c.from)) : null);
  }

  // A shot: its clip is cut once its post-roll has been taken.
  shot(now, w, meta) {
    if (!this.encoder) return;
    this.claims.push({ meta: { ...meta }, at: now, pre: w.preRoll, post: w.postRoll, from: now - w.preRoll * 1000, to: now + w.postRoll * 1000 });
  }

  cut(claim) {
    const span = this.ring.span(claim.from, claim.to);
    if (!span || !this.description) return;
    const made = muxMp4({ width: this.config.width, height: this.config.height, description: this.description, samples: span.frames, endTs: span.endTs });
    if (!made) return;
    const mime = `video/mp4;codecs=${this.config.codec}`;
    const blob = new Blob([made.bytes], { type: mime });
    // Where the shot is in it: as Roller's clips say it (replay.js
    // clipDone measures back from the end).
    const offsetMs = Math.max(0, claim.from - span.startAt);
    const shortMs = Math.max(0, span.startAt - claim.from);
    this.done({ cam: this.cam, blob, mime, ext: "mp4", offsetMs, shortMs, tailMs: span.endAt - claim.at, pre: claim.pre, post: claim.post, meta: claim.meta, fps: this.size().fps, length: made.duration });
  }

  stop() {
    this.stopped = true;
    this.claims = [];
    this.close();
  }
}
