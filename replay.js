// Instant replay: every shot's clip from each camera, a few seconds either
// side of the moment the launch monitor reported it (3 s before and 2 s
// after, to begin with), shown looping in the controls window's camera
// boxes (camerabox.js) and sent to the local server (server/clips.mjs).
//
// A replay is for quick review: it's kept only until the next shot, which
// replaces it, unless the owner saves it while it's the current one - the
// Save on a camera box, Shift + S, "save that", the menu or the Shot
// details (app.js's saveReplay). Saving keeps every angle of that shot, in
// the clips folder.
//
// Each camera with replay on has two MediaRecorders rolling, half a cycle
// apart, restarted every cycle; when a shot comes the one that has the
// pre-roll in hand is kept going to the end of the post-roll and its whole
// recording is the clip. Why it's done that way, and the scheduling rules,
// are in sim/clips.mjs. Each recording is a new MediaRecorder with no
// timeslice, so the browser hands over one whole, playable file at the end
// and nothing is held here meanwhile.
//
// Cost: two video encoders per camera, all the time replay is on. The
// Cameras panel turns replay off per camera (the live picture stays), or
// altogether.

import { rollPlan, rollStep, coverFor, cleanClipWindow } from "./sim/clips.mjs";
import { pickRecordingType, bitrateFor } from "./sim/cameras.mjs";
import { loadSetting, saveSetting } from "./util.js";

// How often the recorders are looked at, ms.
const TICK = 250;
// How long a clip waits for its shot to be recorded (the course and the
// greens record it when the ball stops) before it's saved without the
// carry.
const META_WAIT = 15000;

export class InstantReplay {
  // cameras: the CameraManager. onClip(clip): a clip is ready to play
  // (before it's saved). onShot(): a shot has come (the boxes go live).
  // toast(text, ms).
  constructor({ cameras, onClip = () => {}, onShot = () => {}, onSaved = () => {}, toast = () => {} }) {
    this.cameras = cameras;
    this.onClip = onClip;
    this.onShot = onShot;
    this.onSaved = onSaved;
    this.toast = toast;
    this.window = cleanClipWindow(loadSetting("clipWindow", {}));
    this.rollers = new Map(); // cam.id -> Roller
    this.shots = new Map(); // shotNumber -> { meta, recorded, waiting: [clip] }
    this.type = typeof MediaRecorder === "undefined" ? null : pickRecordingType((m) => MediaRecorder.isTypeSupported(m));
    this.saved = 0;
    this.failed = 0;
    this.paused = false;
    // The shot whose replay is current: { shotNumber, shot (its entry in
    // shots, whose save says the owner has asked to keep it), clips (how
    // many angles are ready), at, cams, byCam (below) }. Null before the
    // first shot, or when the last shot had no replay (none recording).
    this.current = null;
    this.saveListeners = new Set();
    cameras.onChange(() => this.sync());
    this.timer = setInterval(() => this.tick(), TICK);
    this.sync();
  }

  get supported() {
    return !!this.type;
  }

  setWindow(w) {
    this.window = cleanClipWindow({ ...this.window, ...w });
    saveSetting("clipWindow", this.window);
    for (const r of this.rollers.values()) r.plan = rollPlan(this.window.preRoll * 1000);
  }

  // Paused while the recorder runs (videorec.js), unless the owner keeps
  // both: every camera's two encoders freed for the recording's.
  setPaused(on) {
    if (this.paused === !!on) return;
    this.paused = !!on;
    this.sync();
  }

  // A roller for each open camera with replay on; the rest stopped.
  sync() {
    const want = new Map();
    if (this.type && this.cameras.settings.replay && !this.paused) {
      for (const cam of this.cameras.cams) {
        const { stream } = this.cameras.state(cam.id);
        if (cam.replay && stream) want.set(cam.id, { cam, stream });
      }
    }
    for (const [id, r] of this.rollers) {
      const w = want.get(id);
      if (!w || w.stream !== r.stream) {
        r.stop();
        this.rollers.delete(id);
      } else r.cam = w.cam;
    }
    for (const [id, { cam, stream }] of want) {
      if (this.rollers.has(id)) continue;
      const s = this.cameras.state(id).settings ?? {};
      const bits = bitrateFor(s.width ?? cam.width, s.height ?? cam.height, s.frameRate ?? cam.fps);
      this.rollers.set(id, new Roller({ cam, stream, type: this.type, bits, plan: rollPlan(this.window.preRoll * 1000), done: (clip) => this.clipDone(clip) }));
    }
  }

  tick() {
    const now = performance.now();
    for (const r of this.rollers.values()) r.tick(now);
  }

  // How many MediaRecorders are recording now (two per camera with replay).
  activeRecorders() {
    let n = 0;
    for (const r of this.rollers.values()) n += r.recs.filter((x) => x.active).length;
    return n;
  }

  // A shot from the launch monitor, the moment it arrived. meta: what's
  // known already - { shotNumber, at (ISO), player, club, mode }. It
  // replaces the last shot's replay: unless that was saved, its clips still
  // waiting to be sent are dropped, and the server deletes those it has.
  shot(meta) {
    const now = performance.now();
    this.onShot(meta);
    const had = this.current;
    if (had && !had.shot.save) had.shot.waiting = [];
    this.current = null;
    if (this.rollers.size) {
      const w = this.window;
      const s = { meta: { ...meta }, recorded: false, waiting: [], timer: null, save: false };
      this.shots.set(meta.shotNumber, s);
      // Only the last few shots are waited on.
      for (const k of [...this.shots.keys()].slice(0, -8)) this.shots.delete(k);
      for (const r of this.rollers.values()) r.shot(now, w, meta);
      // at: when it came (performance.now); cams: the cameras recording
      // it; byCam: each one's clip once it's ready (the swing replay on
      // the game window plays them: swingreplay.js).
      this.current = { shotNumber: meta.shotNumber, shot: s, clips: 0, at: now, cams: [...this.rollers.keys()], byCam: new Map() };
    }
    if (had || this.current) this.tell("next", { shot: meta.shotNumber });
    this.saveChanged();
  }

  // The shot has been recorded for the stats (recorder.js): its carry, who
  // hit it and with what, and its id there. Clips waiting for it are sent.
  recorded(shotNumber, info) {
    const s = this.shots.get(shotNumber);
    if (!s) return;
    Object.assign(s.meta, Object.fromEntries(Object.entries(info).filter(([, v]) => v != null)));
    s.recorded = true;
    const waiting = s.waiting;
    s.waiting = [];
    for (const clip of waiting) this.upload(clip);
    if (this.current?.shotNumber === shotNumber) this.saveChanged();
  }

  // ---- Saving the current replay ----------------------------------------------------

  // The owner wants the current replay kept: every angle of it, those sent
  // already and those still to come. Only until the next shot. Returns
  // straight away { saved: true, meta } (the server is told meanwhile),
  // { already: true, meta } or { why } (and nothing is done).
  save() {
    const c = this.current;
    if (!c) return { why: this.rollers.size ? "No replay to save yet - it comes with the next shot" : "No replay to save - no camera is recording one" };
    const s = c.shot;
    if (s.save) return { already: true, meta: s.meta };
    s.save = true;
    this.saveChanged();
    this.tell("save", { shot: c.shotNumber }).then((r) => {
      if (r && !r.ok) {
        // Refused (the next shot has come): not saved after all.
        s.save = false;
        this.saveChanged();
        this.toast(`The replay wasn't saved: ${r.error}`, 3000);
      }
    });
    return { saved: true, meta: s.meta };
  }

  // For the Save buttons and the Shot details: the current replay and
  // whether it's saved - { shotNumber, meta, saved, clips } or null.
  saveState() {
    const c = this.current;
    if (!c) return null;
    return { shotNumber: c.shotNumber, meta: { ...c.shot.meta }, saved: c.shot.save, clips: c.clips };
  }
  onSaveChange(fn) {
    this.saveListeners.add(fn);
    return () => this.saveListeners.delete(fn);
  }
  saveChanged() {
    const state = this.saveState();
    for (const fn of this.saveListeners) {
      try {
        fn(state);
      } catch (err) {
        console.error("A replay listener failed:", err);
      }
    }
  }

  // A word to the server: "next" (a new shot) or "save". Resolves { ok,
  // error }, or null when it couldn't be reached.
  async tell(what, body) {
    try {
      const res = await fetch(`/api/clips/${what}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const got = await res.json().catch(() => ({}));
      return { ok: res.ok, error: got.error ?? `the server said ${res.status}` };
    } catch (err) {
      console.warn(`The clips server wasn't told "${what}":`, err);
      return null;
    }
  }

  async clipDone(clip) {
    // A blob URL to play from here, straight away.
    clip.url = URL.createObjectURL(clip.blob);
    // Where the shot is in it, measured back from its end: the end is when
    // it was stopped, to within a frame, but its start can be a second or
    // two after the recorder was started when the PC is busy (the encoder
    // warming up drops the first frames), so counting from the start would
    // put the replay late.
    const duration = await mediaDuration(clip.url);
    if (duration > 0) {
      const from = duration - (clip.pre + clip.tailMs / 1000);
      clip.offsetMs = Math.max(0, from * 1000);
      clip.shortMs = Math.max(0, -from * 1000);
      clip.duration = duration;
    }
    const s = this.shots.get(clip.meta.shotNumber);
    const current = this.current?.shotNumber === clip.meta.shotNumber;
    // Its shot replaced already (the next came within the post-roll) and
    // not saved: nothing to show or keep.
    if (!current && !s?.save) return URL.revokeObjectURL(clip.url);
    if (current) this.current.byCam.set(clip.cam.id, clip);
    this.onClip(clip);
    if (current) {
      this.current.clips++;
      this.saveChanged();
    }
    if (!s || s.recorded) return this.upload(clip);
    s.waiting.push(clip);
    setTimeout(() => {
      if (!s.waiting.includes(clip)) return;
      s.waiting = s.waiting.filter((c) => c !== clip);
      this.upload(clip);
    }, META_WAIT);
  }

  // Sent to the server: kept until the next shot, or saved if the owner
  // has asked. What's known about the shot goes in the address; the video
  // is the body. A clip whose shot has been replaced, not saved, isn't sent.
  async upload(clip) {
    const s = this.shots.get(clip.meta.shotNumber);
    if (this.current?.shotNumber !== clip.meta.shotNumber && !s?.save) return;
    const m = { ...clip.meta, ...(s?.meta ?? {}) };
    const meta = {
      at: m.at,
      player: m.player,
      club: m.club,
      carry: m.carry,
      mode: m.mode,
      stats: m.stats,
      shot: m.shotNumber,
      angle: clip.cam.name,
      cam: clip.cam.id,
      offset: Math.round(clip.offsetMs) / 1000,
      pre: clip.pre,
      post: clip.post,
      mime: clip.mime,
      save: !!s?.save,
    };
    try {
      const res = await fetch(`/api/clips?meta=${encodeURIComponent(JSON.stringify(meta))}`, { method: "POST", headers: { "Content-Type": clip.mime.split(";")[0] }, body: clip.blob });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `the server said ${res.status}`);
      if (body.dropped) return;
      clip.saved = body.clip;
      this.saved++;
      this.onSaved(clip);
    } catch (err) {
      this.failed++;
      console.warn("A replay clip wasn't saved:", err);
      this.toast(`The ${clip.cam.name} replay wasn't saved: ${err.message}`, 3000);
    }
  }

  stop() {
    clearInterval(this.timer);
    for (const r of this.rollers.values()) r.stop();
    this.rollers.clear();
  }
}

// One camera's recorders, rolling.
export class Roller {
  constructor({ cam, stream, type, bits, plan, done }) {
    Object.assign(this, { cam, stream, type, bits, plan, done });
    const now = performance.now();
    this.recs = Array.from({ length: plan.count }, (_, i) => ({ id: i, active: false, startedAt: 0, until: null, notBefore: now + i * plan.stagger, mr: null, claims: [] }));
    this.stopped = false;
    this.tick(now);
  }

  tick(now) {
    if (this.stopped) return;
    const { start, restart } = rollStep(this.recs, now, this.plan);
    for (const id of restart) this.discard(this.recs[id]);
    for (const id of [...start, ...restart]) this.begin(this.recs[id], now);
    // Held for a shot and its post-roll is over: stopped, and it's the clip.
    for (const r of this.recs) if (r.active && r.until != null && now >= r.until) this.finish(r);
  }

  begin(r, now) {
    let mr;
    try {
      mr = new MediaRecorder(this.stream, { mimeType: this.type.mime, videoBitsPerSecond: this.bits });
      mr.start();
    } catch (err) {
      console.warn(`Replay for ${this.cam.name} couldn't record:`, err);
      // Tried again in a few seconds rather than every tick.
      Object.assign(r, { active: false, mr: null, until: null, notBefore: now + 5000 });
      return;
    }
    Object.assign(r, { active: true, startedAt: now, until: null, mr, claims: [] });
  }

  // Stopped, and what it recorded thrown away.
  discard(r) {
    const mr = r.mr;
    Object.assign(r, { active: false, mr: null, until: null, claims: [] });
    if (mr && mr.state !== "inactive") {
      try {
        mr.stop();
      } catch {
        // Stopped already.
      }
    }
  }

  // A shot: the recorder covering it is kept going to the end of the
  // post-roll (a later shot within one clip extends it).
  shot(now, w, meta) {
    const c = coverFor(this.recs, now, w.preRoll * 1000);
    if (!c) return;
    const r = this.recs[c.id];
    r.until = Math.max(r.until ?? 0, now + w.postRoll * 1000);
    r.claims.push({ meta: { ...meta }, at: now, offsetMs: c.offsetMs, shortMs: c.shortMs, pre: w.preRoll, post: w.postRoll });
  }

  // Stopped at the end of the post-roll: its recording is the clip for
  // every shot that claimed it.
  finish(r) {
    const { mr, claims, startedAt } = r;
    const stoppedAt = performance.now();
    Object.assign(r, { active: false, mr: null, until: null, claims: [], notBefore: 0 });
    if (!mr) return;
    const chunks = [];
    mr.addEventListener("dataavailable", (e) => e.data?.size && chunks.push(e.data));
    mr.addEventListener(
      "stop",
      () => {
        if (!chunks.length) return;
        const blob = new Blob(chunks, { type: mr.mimeType || this.type.mime });
        for (const claim of claims) {
          this.done({ cam: this.cam, blob, mime: blob.type, ext: this.type.ext, offsetMs: claim.offsetMs, shortMs: claim.shortMs, tailMs: stoppedAt - claim.at, pre: claim.pre, post: claim.post, meta: claim.meta, fps: this.fps(), length: (stoppedAt - startedAt) / 1000 });
        }
      },
      { once: true },
    );
    try {
      mr.stop();
    } catch {
      // Stopped already: nothing to keep.
    }
  }

  fps() {
    return this.stream.getVideoTracks()[0]?.getSettings?.().frameRate || this.cam.fps;
  }

  stop() {
    this.stopped = true;
    for (const r of this.recs) this.discard(r);
  }
}

// How long a recording really is, in seconds (0 if it can't be told within
// a few seconds). MediaRecorder's files often don't say in their header:
// asking to seek past the end makes the browser work it out. Only the
// container is read, not the pictures.
export function mediaDuration(url) {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.muted = true;
    v.preload = "metadata";
    let done = false;
    const finish = (d) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      v.removeAttribute("src");
      v.load();
      resolve(Number.isFinite(d) && d > 0 ? d : 0);
    };
    const timer = setTimeout(() => finish(0), 4000);
    v.addEventListener("error", () => finish(0));
    v.addEventListener("durationchange", () => Number.isFinite(v.duration) && v.duration > 0 && v.readyState >= 1 && finish(v.duration));
    v.addEventListener("loadedmetadata", () => {
      if (Number.isFinite(v.duration) && v.duration > 0) finish(v.duration);
      else v.currentTime = 1e7;
    });
    v.src = url;
  });
}
