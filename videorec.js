// The in-house recorder, with no other software: the active recording layout
// (sim/videolayout.mjs) drawn off screen by the compositor (compositor.js)
// - the game, the cameras, the shot data - with the game's own sound and a
// microphone mixed in, recorded as a session: Start to Stop, a file an
// hour (rollPart: the next begun before the last is finished, so nothing's
// lost between them, the files kept together), sent to the local server a
// second at a time as it's recorded, so an hour never sits in memory, and
// finished there (server/clips.mjs).
// Nothing is ever recorded without being started: it's something the owner
// starts and finishes. (Quick review of a shot is the cameras' replays.)
//
// Started and stopped by the Record button in the controls window's top
// bar, Shift + V, the Recording panel (videopanel.js), or saying "start
// filming" / "stop filming". The files go in the recordings folder inside
// the clips folder, named like "2026-09-29 14-05 A-Squared Golf session.mp4",
// with an allowance of their own (5 GB to begin with): the oldest not
// marked Keep are deleted when a new one would go over it, never the one
// being recorded. The panel lists them and says how much is used.
//
// Everything runs in the game window's page, beside the renderer: it
// records whether the controls window is open or not. Nothing is drawn on
// the game window unless the owner ticks the small REC dot.
//
// Encoders: one for the session. While recording, the cameras' own replays
// are paused (two encoders each) unless the owner keeps both - the session
// has the swing in it.
//
// A crash takes the recording down with the page, so the page keeps a mark
// while recording (sim/recresume.mjs) and the page that comes back finishes
// the file that was cut off and carries on in the next (resumeAfterRestart);
// closing or reloading the game on purpose finishes the file then (leaving)
// and records no more.

import { cleanLayouts, activeLayout, ensureFinish } from "./sim/videolayout.mjs";
import { cleanScenes, sceneForMode, finishScene, stepScene, findScene, phaseStep } from "./sim/videoscenes.mjs";
import { shotPhase } from "./sim/shotphase.mjs";
import { elapsedText } from "./sim/videotiles.mjs";
import { cleanVideoSettings, sizeOf, pickVideoType, videoBitrate, AUDIO_BITRATE, KEY_FRAME_MS, mixGains, PerfWatch, encoderCount, bytesPerHour } from "./sim/videorec.mjs";
import { setPictureRecording } from "./look/renderscale.js";
import { sessionUse } from "./sim/clips.mjs";
import { sizeText } from "./limits.js";
import { FrameMeter } from "./sim/framerate.mjs";
import { Compositor } from "./compositor.js";
import { loadSetting, saveSetting } from "./util.js";
import { RESUME_KEY, BEAT_MS, recordingMark, resumePlan, resumeSaid } from "./sim/recresume.mjs";

// A session's pieces: a second each.
const TIMESLICE = 1000;
// How often the frame rate is looked at.
const TICK = 250;
// Below this many minutes of room in the recordings' allowance, starting a
// recording says how long before the oldest is deleted.
const WARN_MINUTES = 60;
// A piece that won't send is tried again this often, this many times,
// before the session is given up as lost (held in memory meanwhile).
const RETRY_MS = 2000;
const MAX_TRIES = 30;
// A long recording goes on in a new file about every hour (rollPart).
export const PART_MS = 60 * 60 * 1000;
// An encoder that keeps failing: started again at most RESTARTS times in
// RESTART_WINDOW, then the recording stops and says why.
export const RESTARTS = 3;
export const RESTART_WINDOW = 10 * 60 * 1000;

export class VideoRecorder {
  // gameCanvas: the renderer's canvas. cameras: the CameraManager. replay:
  // the InstantReplay (paused while recording). audio: the sound engine.
  // info(): what the words show (compositor.js). view: the game window's
  // picture, for the REC dot. toast(text, ms).
  constructor({ gameCanvas, cameras, replay, audio, info, view, toast = () => {} }) {
    Object.assign(this, { cameras, replay, audio, toast });
    const stored = loadSetting("video", {});
    this.settings = cleanVideoSettings(stored);
    // Settings from before (a per-shot mode, 30 fps by default): kept as
    // they are now, so the old mode is gone for good.
    if (JSON.stringify(stored) !== JSON.stringify(this.settings)) saveSetting("video", this.settings);
    this.layouts = cleanLayouts(loadSetting("videoLayouts", {}));
    // Scenes (sim/videoscenes.mjs): which layout each mode and the end of a
    // round switch to, and the transition. The Finish scene added to the
    // layouts if it isn't there.
    this.scenes = cleanScenes(loadSetting("videoScenes", {}));
    const withFinish = ensureFinish(this.layouts);
    if (withFinish !== this.layouts) {
      this.layouts = withFinish;
      saveSetting("videoLayouts", this.layouts);
    }
    this.compositor = new Compositor({ gameCanvas, cameras, info });
    this.compositor.setLayout(activeLayout(this.layouts));
    this.listeners = new Set();
    this.recording = false;
    this.startedAt = 0;
    this.session = null;
    // The clips index as last read (the recordings, their allowance): for
    // the panel's list and the warning before one is pushed out.
    this.library = null;
    this.meter = new FrameMeter();
    this.perf = new PerfWatch();
    this.perfAt = 0;
    this.hint = null;
    this.saved = { sessions: 0 };
    this.lastFile = null;
    this.dot = document.createElement("div");
    this.dot.className = "video-rec-dot";
    this.dot.textContent = "REC";
    this.dot.hidden = true;
    view?.appendChild(this.dot);
    this.timer = setInterval(() => this.tick(), TICK);
    this.loadLibrary();
  }

  get supported() {
    return typeof MediaRecorder !== "undefined" && typeof HTMLCanvasElement.prototype.captureStream === "function";
  }
  get layout() {
    return activeLayout(this.layouts);
  }

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  changed() {
    this.dot.hidden = !(this.recording && this.settings.recDot);
    for (const fn of this.listeners) {
      try {
        fn(this);
      } catch (err) {
        console.error("A recorder listener failed:", err);
      }
    }
  }

  // ---- Settings and layouts ------------------------------------------------------

  set(patch) {
    this.settings = cleanVideoSettings({ ...this.settings, ...patch });
    saveSetting("video", this.settings);
    if (this.recording) {
      this.applyGains();
      if ("keepReplays" in patch) this.replay.setPaused(!this.settings.keepReplays);
    }
    this.changed();
  }

  // Every layout, and which is active (the designer's).
  setLayouts(store) {
    this.layouts = cleanLayouts(store);
    saveSetting("videoLayouts", this.layouts);
    this.compositor.setLayout(activeLayout(this.layouts));
    this.changed();
  }

  // ---- Scenes ---------------------------------------------------------------------------

  setScenes(patch) {
    this.scenes = cleanScenes({ ...this.scenes, ...patch, byMode: { ...this.scenes.byMode, ...(patch.byMode ?? {}) } });
    saveSetting("videoScenes", this.scenes);
    this.changed();
  }

  // Switches the recording to another layout, with the scenes' transition.
  // why: "voice", "mode", "finish", "panel" - a toast says so while
  // recording, or when asked by voice. Returns the layout, or null.
  switchScene(id, why = "panel") {
    const layout = this.layouts.layouts.find((l) => l.id === id);
    if (!layout) return null;
    if (this.layouts.active === id) return layout;
    this.layouts = { ...this.layouts, active: id };
    saveSetting("videoLayouts", this.layouts);
    this.compositor.setLayout(layout, { transition: this.scenes.transition, seconds: this.scenes.seconds });
    // (Recording the screen as it shows, a scene changes nothing in it - and
    // the message would be in the video.)
    const screen = this.recording && this.what === "screen";
    if (!screen && (why === "voice" || (this.recording && why !== "panel" && why !== "shot"))) this.toast(`Scene: ${layout.name}`, 1800);
    this.changed();
    return layout;
  }

  // The next or previous scene (dir 1 or -1), or one by what was said.
  stepScene(dir, why = "voice") {
    return this.switchScene(stepScene(this.layouts.layouts, this.layouts.active, dir), why);
  }
  sceneByWords(words, why = "voice") {
    const id = findScene(this.layouts.layouts, words);
    return id ? this.switchScene(id, why) : null;
  }

  // The mode changed: its scene, if it has one.
  modeChanged(mode) {
    this.beforeFinish = null;
    this.shotBase = null;
    const id = sceneForMode(this.scenes, mode, this.layouts.layouts);
    if (id) this.switchScene(id, "mode");
  }

  // A round finished: the Finish scene. A new round: back to the course's
  // scene, or to what it was before the finish.
  roundEnded() {
    const id = finishScene(this.scenes, this.layouts.layouts);
    if (!id || this.layouts.active === id) return;
    this.beforeFinish = this.layouts.active;
    this.switchScene(id, "finish");
  }
  roundStarted() {
    const back = sceneForMode(this.scenes, "course", this.layouts.layouts) ?? this.beforeFinish;
    this.beforeFinish = null;
    if (back && back !== this.layouts.active && this.layouts.active === finishScene(this.scenes, this.layouts.layouts)) this.switchScene(back, "mode");
  }

  // ---- Every frame ------------------------------------------------------------------

  // The animation loop, just after the game was drawn (app.js).
  frame(time) {
    this.meter.tick(time);
    // A picture drawn: shown on the game window too, if it's asked for
    // (videomonitor.js).
    if (this.compositor.frame(time)) this.onFrame?.();
    this.followShot(time);
  }

  // A scene of its own while the ball flies, or after it lands (the Scenes
  // section): switched to as the shot's time changes, and back once the
  // next shot is set up. Looked at a few times a second, only while the
  // picture is being drawn.
  followShot(time) {
    if (!this.compositor.active || time - (this.phaseAt ?? -Infinity) < 150) return;
    this.phaseAt = time;
    const now = shotPhase(this.compositor.data?.shot ?? null, time).phase;
    const was = this.phase ?? "address";
    this.phase = now;
    const step = phaseStep(this.scenes, this.layouts.layouts, { was, now, active: this.layouts.active, base: this.shotBase ?? null });
    this.shotBase = step.base;
    if (step.to) this.switchScene(step.to, "shot");
  }

  tick() {
    const now = performance.now();
    // Still recording: said again, for the page that comes back after a
    // crash (resumeAfterRestart).
    if (this.recording && now - (this.beatAt ?? -Infinity) >= BEAT_MS) this.remember();
    // About an hour in one file, then the next (not while it's held, nor
    // ever for the game's own video - one file however slowly it's drawn:
    // onePart). (And, as each new file starts, a word when the oldest
    // recordings are about to go to make room: roomWarning.)
    if (this.recording && !this.rolling && !this.heldAt && !this.onePart && this.partAt && now - this.partAt >= PART_MS) {
      this.rollPart().then((ok) => {
        if (!ok) return;
        const room = this.roomWarning();
        this.toast(room ?? `Recording goes on in a new file (part ${this.part}) - a file an hour`, room ? 6000 : 3500);
      });
    }
    // The game's frame rate, twice a second: slower while recording?
    if (now - this.perfAt >= 500) {
      this.perfAt = now;
      const s = this.meter.stats();
      const hint = s ? this.perf.feed(s.fps, now, { recording: this.recording, size: this.settings.size, rate: this.settings.fps }) : null;
      if (hint !== this.hint) {
        const first = hint && !this.hint;
        this.hint = hint;
        if (first) console.warn(hint);
        this.changed();
      }
    }
  }

  // ---- Start and stop -------------------------------------------------------------------

  toggle() {
    return this.recording ? this.stop() : this.start();
  }

  // reel: the game's own video (showreel.js; video: its id, sim/clips.mjs
  // REEL_ID) - named as that, of the scene, with the game's sound and
  // without the microphone whatever the setting (the room's noise, with
  // nobody in it). The owner's settings aren't changed. carry: the recording this goes on
  // with, after everything had to be opened again (recover) - { rec, part,
  // startedAt }. what: what it's of (sim/videorec.mjs RECORD_WHAT) -
  // "scene" (scene: which, made the one shown; else the one picked) or
  // "screen", the game window as it shows (openScreen). quiet: no message
  // if it doesn't start (the caller tries something else).
  async start({ reel = false, video = null, carry = null, what = "scene", scene = null, quiet = false } = {}) {
    if (this.recording || this.starting) return false;
    if (!this.supported) {
      this.toast("Recording needs the A² Golf app (or a browser with MediaRecorder)", 3000);
      return false;
    }
    this.starting = true;
    this.onePart = !!reel;
    // Stopped a moment ago: what that opened goes first.
    clearTimeout(this.teardownTimer);
    this.teardown();
    try {
      const s = this.settings;
      const { w, h } = sizeOf(s);
      const of = reel ? "scene" : what === "screen" ? "screen" : "scene";
      if (of === "scene" && scene && scene !== this.layouts.active && this.layouts.layouts.some((l) => l.id === scene)) {
        this.layouts = { ...this.layouts, active: scene };
        saveSetting("videoLayouts", this.layouts);
      }
      this.compositor.setSize(w, h);
      this.compositor.fps = s.fps;
      this.compositor.setLayout(this.layout);
      // The screen as it shows: asked for before anything else is opened
      // (in a browser it's chosen from the browser's own list, and may be
      // turned down).
      if (of === "screen") await this.openScreen(w, h, s.fps);
      this.what = of;
      const track = this.compositor.videoTrack();
      this.micWanted = reel ? false : null;
      this.reelMix = reel;
      const sound = await this.openSound();
      const type = this.typeFor(!!sound);
      if (!type) throw new Error("this browser can't record video");
      const stream = new MediaStream([track, ...(sound?.dest.stream.getAudioTracks() ?? [])]);
      const bits = videoBitrate(w, h, s.fps, s.quality, type.codec);
      this.type = type;
      this.stream = stream;
      this.sound = sound;
      this.bits = bits;
      this.startOpts = { reel, video, what: of, scene: of === "scene" ? this.layouts.active : null };
      this.sessionMeta = reel && video ? { video } : {};
      this.compositor.use("record", true);
      // The picture as it is now on the canvas, not the last one drawn.
      this.compositor.draw();
      await this.startSession(stream, type, bits, { ...this.sessionMeta, ...(carry ? { rec: carry.rec, part: carry.part } : {}) });
      if (!s.keepReplays) this.replay.setPaused(true);
      this.recording = true;
      // Which recording, and which of its files (rollPart).
      this.rec = carry?.rec ?? this.session.id;
      this.part = carry?.part ?? 1;
      this.partAt = performance.now();
      this.startedAt = carry?.startedAt ?? this.partAt;
      if (!carry) {
        this.startedWall = new Date();
        this.restarts = [];
      } else if (Number.isFinite(carry.startedWall)) {
        // Carried on in a page that came back after a crash.
        this.startedWall = new Date(carry.startedWall);
      }
      // What was recorded, for the next time voice starts one (it can't
      // be asked).
      if (!reel && s.lastWhat !== of) {
        this.settings = { ...this.settings, lastWhat: of };
        saveSetting("video", this.settings);
      }
      setPictureRecording({ width: w, height: h });
      this.remember();
      this.changed();
      return true;
    } catch (err) {
      console.warn("Recording didn't start:", err);
      if (!quiet) this.toast(`Recording didn't start: ${err.message}`, 3500);
      this.teardown();
      return false;
    } finally {
      this.starting = false;
      // A screen's capture kept for this start (recover) and not taken up.
      this.dropKept();
    }
  }

  // Held (on) or let go: the recording paused - nothing of what's drawn
  // meanwhile goes into the file, and its length leaves the time out - then
  // carried on from where it stopped. For what the game's video mustn't
  // show (showreel.js: a hole being built, its first frames drawn).
  // True if it was recording and is now held.
  hold(on) {
    const mr = this.session?.mr;
    if (!this.recording || !mr) return false;
    try {
      if (on && mr.state === "recording") {
        mr.pause();
        this.heldAt = performance.now();
        return true;
      }
      if (!on && mr.state === "paused") {
        mr.resume();
        // The time it was held, left out of its length.
        const held = performance.now() - (this.heldAt ?? performance.now());
        this.startedAt += held;
        this.partAt += held;
        this.heldAt = null;
        // The picture as it is now, first.
        this.compositor.draw();
        return true;
      }
    } catch (err) {
      console.warn("The recording couldn't be held:", err);
    }
    return false;
  }

  async stop() {
    if (!this.recording) return false;
    // A new file beginning meanwhile (rollPart): stopped once it has, so
    // it isn't left open.
    if (this.rolling) await this.rolling;
    if (!this.recording) return false;
    this.hold(false);
    this.recording = false;
    this.forget();
    setPictureRecording(null);
    const length = this.partLength();
    const session = this.session;
    this.session = null;
    this.changed();
    this.replay.setPaused(false);
    if (session) await this.endSession(session, length);
    // The sound and the picture's track go once every recorder has let go
    // of them (a clip's last piece comes a moment after it's stopped).
    this.teardownTimer = setTimeout(() => !this.recording && this.teardown(), 1500);
    this.changed();
    return true;
  }

  // Stops what start() opened: the compositor's recording, the sound, the
  // screen's capture.
  teardown() {
    this.compositor.use("record", false);
    this.closeScreen();
    if (this.sound) {
      this.sound.untap?.();
      try {
        this.sound.dest.disconnect();
        this.sound.game.disconnect();
        this.sound.mic?.disconnect();
        this.sound.micSource?.disconnect();
      } catch {
        // Gone already.
      }
      this.sound = null;
      this.cameras.closeMic();
    }
  }

  // Full screen: the game window's own picture, just as it shows (its
  // numbers, cards and messages with it), drawn whole by the compositor in
  // place of the layout. In the Windows app the window hands over its own
  // picture with nothing to pick (electron/main.mjs, the display media
  // handler); in a browser, it's picked from the browser's list ("this
  // tab"). Throws, with why, if it can't be had.
  async openScreen(w, h, fps) {
    // Going on after a failed encoder (recover): the capture it had, still
    // live - asking again would need a click.
    const kept = this.kept;
    this.kept = null;
    if (kept?.stream.getVideoTracks().some((t) => t.readyState === "live")) {
      this.screen = kept;
      this.compositor.useScreen(kept.video);
      return;
    }
    if (kept) for (const t of kept.stream.getTracks()) t.stop();
    const md = navigator.mediaDevices;
    if (!md?.getDisplayMedia) throw new Error("full screen can't be recorded here - pick a scene");
    let stream;
    try {
      stream = await md.getDisplayMedia({ video: { width: { ideal: w }, height: { ideal: h }, frameRate: { ideal: fps } }, audio: false, preferCurrentTab: true, selfBrowserSurface: "include", surfaceSwitching: "exclude" });
    } catch (err) {
      throw new Error(err?.name === "NotAllowedError" ? "full screen wasn't allowed - pick a scene, or allow it" : `full screen couldn't be had (${err?.message ?? err})`);
    }
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.srcObject = stream;
    await v.play().catch(() => {});
    // Stopped from outside (the browser's own Stop sharing): the recording
    // stops too, rather than going on black.
    for (const t of stream.getVideoTracks()) t.addEventListener("ended", () => this.recording && this.what === "screen" && this.stop().then(() => this.toast("Recording stopped: the screen's capture ended", 3500)));
    this.screen = { stream, video: v };
    this.compositor.useScreen(v);
  }
  dropKept() {
    if (!this.kept) return;
    for (const t of this.kept.stream.getTracks()) t.stop();
    this.kept = null;
  }
  closeScreen() {
    if (!this.screen) return;
    this.compositor.useScreen(null);
    for (const t of this.screen.stream.getTracks()) t.stop();
    this.screen.video.srcObject = null;
    this.screen = null;
  }

  // The mix: the game's sound (as the speakers get it) and the microphone,
  // each with its own volume, into one track. Null when there's no sound
  // at all (the recording is then silent).
  async openSound() {
    const ctx = this.audio?.context?.({ gesture: true });
    if (!ctx?.createMediaStreamDestination) return null;
    const dest = ctx.createMediaStreamDestination();
    const game = ctx.createGain();
    game.connect(dest);
    const untap = this.audio.tapOutput(game);
    const out = { ctx, dest, game, untap, mic: null, micSource: null };
    if (this.micWanted ?? this.settings.micOn) {
      const stream = await this.cameras.micStream();
      if (stream) {
        out.micSource = ctx.createMediaStreamSource(stream);
        out.mic = ctx.createGain();
        out.micSource.connect(out.mic).connect(dest);
      } else {
        const why = this.cameras.micError?.text ?? "none chosen";
        this.toast(`Recording without the microphone: ${why}`, 3500);
      }
    }
    this.sound = out;
    this.applyGains();
    return out;
  }

  applyGains() {
    const s = this.sound;
    if (!s) return;
    const g = mixGains({ game: this.reelMix && !(this.settings.game > 0) ? 100 : this.settings.game, mic: this.settings.mic, micOn: (this.micWanted ?? this.settings.micOn) && this.settings.micOn, hasMic: !!s.mic });
    s.game.gain.setTargetAtTime(g.game, s.ctx.currentTime, 0.05);
    s.mic?.gain.setTargetAtTime(g.mic, s.ctx.currentTime, 0.05);
  }

  // ---- The session: a second at a time to the server ------------------------------------

  async startSession(stream, type, bits, extra = {}) {
    const meta = { at: new Date().toISOString(), mime: type.mime, ...extra };
    const res = await fetch(`/api/clips/session?meta=${encodeURIComponent(JSON.stringify(meta))}`, { method: "POST" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.id) throw new Error(body.error ?? "the local server didn't answer");
    const mr = new MediaRecorder(stream, { mimeType: type.mime, videoBitsPerSecond: bits, videoKeyFrameIntervalDuration: KEY_FRAME_MS, ...(stream.getAudioTracks().length ? { audioBitsPerSecond: AUDIO_BITRATE } : {}) });
    const session = { id: body.id, mr, queue: [], seq: 0, bytes: 0, sending: null, lost: false, tries: 0 };
    mr.addEventListener("dataavailable", (e) => {
      // (A session given up as lost holds nothing more in memory.)
      if (!e.data?.size || session.lost) return;
      session.queue.push(e.data);
      this.pump(session);
    });
    mr.addEventListener("error", (e) => {
      const why = e.error?.message || e.error?.name || "the encoder failed";
      console.warn("The session recorder failed:", why);
      this.recover(why, session);
    });
    mr.start(TIMESLICE);
    this.session = session;
  }

  // This file's length so far, in seconds (less any time it was held).
  partLength() {
    const held = this.heldAt ? performance.now() - this.heldAt : 0;
    return Math.max(0, performance.now() - this.partAt - held) / 1000;
  }

  // The recording carried on in a new file: the next begun on the same
  // picture and sound before this one's finished - nothing lost between
  // them, nothing opened again (the picture's size, the sound, the video's
  // name and its microphone left as they are) - and kept with it (its
  // recording, rec, and which part). False if the next didn't begin: this
  // one carries on.
  async rollPart() {
    if (this.rolling || !this.recording || !this.stream) return false;
    const old = this.session;
    const length = this.partLength();
    const part = this.part + 1;
    this.rolling = (async () => {
      try {
        await this.startSession(this.stream, this.type, this.bits, { ...this.sessionMeta, rec: this.rec, part });
        return true;
      } catch (err) {
        console.warn("The recording's next file didn't begin:", err);
        return false;
      }
    })();
    const ok = await this.rolling;
    this.rolling = null;
    if (!ok) return false;
    this.part = part;
    this.partAt = performance.now();
    this.remember();
    this.changed();
    if (old) await this.endSession(old, length, { quiet: true });
    return true;
  }

  // ---- A crash: the recording carried on in the page that comes back ------------------------

  // The mark the page keeps while recording (sim/recresume.mjs): which file,
  // of which recording, of what. closed: the page is going on purpose.
  remember({ closed = false } = {}) {
    this.beatAt = performance.now();
    if (!this.recording || !this.session) return;
    const o = this.startOpts ?? {};
    saveSetting(RESUME_KEY, recordingMark({ session: this.session.id, rec: this.rec, part: this.part, what: o.what, scene: o.scene, reel: o.reel, startedWall: this.startedWall?.getTime?.() ?? null, closed }));
  }
  forget() {
    saveSetting(RESUME_KEY, null);
  }

  // The page is going on purpose (closed, reloaded, an update): the file
  // finished from what's reached the server (the last second may not
  // have), and the mark says so - so the page that comes next doesn't
  // record again. (A crash never gets here: that's what the mark is for.)
  leaving() {
    if (!this.recording || !this.session) return;
    // Opened again to get the game's picture back (app.js): carried on in
    // the next file, as after a crash - the page that comes next finishes
    // this one (resumeAfterRestart).
    if (this.lostPicture) return this.remember();
    const body = JSON.stringify({ length: Math.round(this.partLength() * 10) / 10, cut: true });
    try {
      navigator.sendBeacon?.(`/api/clips/session/${this.session.id}/finish`, body);
    } catch {
      // Finished from what arrived the next time A² Golf starts.
    }
    this.remember({ closed: true });
  }

  // Once, as the page starts: was it recording when the page before went?
  // The file that was cut off is finished, and - after a crash, within a
  // few minutes - the recording goes on in the next file, as it was (its
  // scene, or the full screen), and says so. True if it carried on.
  async resumeAfterRestart() {
    const plan = resumePlan(loadSetting(RESUME_KEY, null));
    this.forget();
    if (plan.act === "none") return false;
    // Whether the server still had the file (it's run on since): finished
    // now - or nothing in it, a crash as a new hour's file began. 404:
    // finished already (closed on purpose), or the server started again
    // too and finished it itself.
    let finished = false;
    try {
      const res = await fetch(`/api/clips/session/${plan.session}/finish`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cut: true }) });
      finished = res.status !== 404;
    } catch {
      // The server isn't there: it finishes the file as it starts.
    }
    if (plan.act === "finish") {
      const said = resumeSaid(plan, { finished });
      if (said) this.toast(said, 5000);
      if (finished) await this.loadLibrary();
      return false;
    }
    // The server started again too: the game was opened again, so it isn't
    // recorded without being started.
    let ok = false;
    if (finished) {
      const startedAt = plan.carry.startedWall ? performance.now() - (Date.now() - plan.carry.startedWall) : undefined;
      ok = await this.start({ what: plan.what, scene: plan.scene, carry: { ...plan.carry, startedAt }, quiet: true });
    }
    this.noteStop("A² Golf restarted", ok ? "carried on in a new file" : "stopped");
    this.toast(resumeSaid(plan, { ok, part: this.part, finished }), 6000);
    if (!ok) await this.loadLibrary();
    return ok;
  }

  // The encoder failed (or the card stalled it): said, on screen and in a
  // report (stops), and the recording carried on in a new file - on the
  // same picture if it's still there, or everything opened again if it
  // isn't (the graphics card was reset). Not for ever: an encoder failing
  // again and again stops the recording (RESTARTS in RESTART_WINDOW).
  async recover(why, session = this.session) {
    if (!this.recording || session !== this.session || this.recovering) return;
    this.recovering = true;
    const now = performance.now();
    try {
      this.restarts = (this.restarts ?? []).filter((t) => now - t < RESTART_WINDOW);
      const again = this.restarts.length < RESTARTS;
      this.noteStop(why, again ? "carried on in a new file" : "stopped");
      if (!again) {
        await this.stop();
        this.toast(`Recording stopped: the encoder kept failing (${why})`, 6000);
        return;
      }
      this.restarts.push(now);
      // H.265 that failed: H.264 from here on (until the game's started
      // again), in the next file.
      if (this.type?.codec === "hevc") {
        this.hevcFailed = true;
        const next = this.typeFor(!!this.stream?.getAudioTracks().length);
        if (next) {
          const { w, h } = sizeOf(this.settings);
          this.type = next;
          this.bits = videoBitrate(w, h, this.settings.fps, this.settings.quality, next.codec);
        }
      }
      const live = this.stream?.getVideoTracks().some((t) => t.readyState === "live");
      if (live && (await this.rollPart())) {
        this.toast(`The recording's encoder failed (${why}) - it goes on in a new file (part ${this.part})`, 5000);
        return;
      }
      const carry = { rec: this.rec, part: this.part + 1, startedAt: this.startedAt };
      const opts = this.startOpts ?? {};
      // Full screen: its capture carried over, not let go and asked for
      // again (that needs a click).
      const kept = opts.what === "screen" ? this.screen : null;
      if (kept) this.screen = null;
      await this.stop();
      this.kept = kept;
      const ok = await this.start({ ...opts, carry });
      this.toast(ok ? `The recording's encoder failed (${why}) - it goes on in a new file (part ${carry.part})` : `Recording stopped: ${why}`, 5000);
    } finally {
      this.recovering = false;
    }
  }

  // The game's picture lost (the graphics process crashed) or back: the
  // recording holds its last picture meanwhile (compositor.js), said in a
  // report - and a reload while it's lost carries the recording on.
  pictureLost(lost) {
    this.lostPicture = !!lost;
    if (this.recording) this.noteStop(lost ? "The graphics card reset - the game's picture was lost" : "The game's picture came back", lost ? "held its last picture" : "carried on");
  }

  // Why a recording stopped or went on in a new file, for a report (the
  // last few): { at, why, then }.
  noteStop(why, then) {
    this.stops = [...(this.stops ?? []), { at: new Date().toISOString(), why: String(why).slice(0, 200), then }].slice(-6);
  }

  // For a report: recording or not, which file of it, and why any stopped.
  report() {
    return { on: this.recording, part: this.recording ? this.part : null, quality: this.settings.quality, size: this.settings.size, fps: this.settings.fps, format: this.settings.format, type: this.recording ? (this.type?.mime ?? null) : null, stops: this.stops ?? [] };
  }

  // Sends the waiting pieces one at a time, in order.
  pump(session) {
    if (session.sending || session.lost) return session.sending;
    session.sending = (async () => {
      while (session.queue.length && !session.lost) {
        const piece = session.queue[0];
        try {
          const res = await fetch(`/api/clips/session/${session.id}?seq=${session.seq}`, { method: "POST", headers: { "Content-Type": "application/octet-stream" }, body: piece });
          if (res.status === 404) throw Object.assign(new Error("the server has lost this recording (restarted?)"), { fatal: true });
          if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `the server said ${res.status}`);
          session.queue.shift();
          session.seq++;
          session.bytes += piece.size;
          session.tries = 0;
        } catch (err) {
          session.tries++;
          if (err.fatal || session.tries >= MAX_TRIES) {
            session.lost = true;
            session.queue = [];
            this.toast(`The session recording couldn't be saved: ${err.message}`, 5000);
            // Carried on in a new file (or stopped, if it keeps failing),
            // rather than going on recording into nowhere.
            setTimeout(() => this.recover(err.message, session), 0);
            break;
          }
          if (session.tries === 1) console.warn("A piece of the recording didn't send; trying again:", err.message);
          await new Promise((r) => setTimeout(r, RETRY_MS));
        }
      }
      session.sending = null;
    })();
    return session.sending;
  }

  // Stopped: the last piece sent, and the file finished on the server.
  // quiet: one of a recording's files (rollPart) - not said, as it goes on.
  async endSession(session, length, { quiet = false } = {}) {
    const { mr } = session;
    if (mr.state !== "inactive") {
      const stopped = new Promise((r) => mr.addEventListener("stop", r, { once: true }));
      try {
        mr.stop();
      } catch {
        // Stopped already.
      }
      await stopped;
    }
    // The last dataavailable comes before stop; let its send begin.
    await new Promise((r) => setTimeout(r, 0));
    while (session.sending) await session.sending;
    if (session.lost) return;
    try {
      const res = await fetch(`/api/clips/session/${session.id}/finish`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ length: Math.round(length * 10) / 10 }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `the server said ${res.status}`);
      this.saved.sessions++;
      this.lastFile = body.clip;
      const gone = (this.library?.clips ?? []).filter((c) => body.deleted?.includes(c.id));
      if (!quiet || gone.length) this.toast(`Recording saved: ${body.clip.file}${gone.length ? ` - ${gone.length} older recording${gone.length === 1 ? "" : "s"} deleted to stay within the allowance` : ""}`, gone.length ? 6000 : 3500);
    } catch (err) {
      this.noteStop(err.message, "a file wasn't finished");
      this.toast(`The recording wasn't finished: ${err.message}`, 4000);
    }
    await this.loadLibrary();
    this.changed();
  }

  // ---- The recordings kept ---------------------------------------------------------------

  // The clips index, read again: the recordings, their allowance, the one
  // being recorded. Null if the server can't be reached.
  async loadLibrary() {
    // Only the latest read counts: an earlier one answering late mustn't
    // put back what a Keep or a Delete has just changed.
    const n = (this.libraryReads = (this.libraryReads ?? 0) + 1);
    let lib = null;
    try {
      const res = await fetch("/api/clips");
      if (!res.ok) throw new Error(`the server said ${res.status}`);
      lib = await res.json();
    } catch {
      lib = null;
    }
    if (n !== this.libraryReads) return this.library;
    this.library = lib;
    this.changed();
    return this.library;
  }

  // The recordings, newest first.
  recordings() {
    return (this.library?.clips ?? []).filter((c) => c.kind === "session");
  }

  // How the recordings stand against their allowance (sim/clips.mjs's
  // sessionUse), counting the one being recorded.
  use() {
    return sessionUse(this.library?.clips ?? [], this.library?.retention, { extra: this.session?.bytes ?? 0, perHour: this.perHour() });
  }

  // Said as a recording starts, when it would soon push the oldest out:
  // "About 25 min before the oldest recording is deleted to make room
  // (Recording panel: Keep, or a bigger allowance)". Null when there's an
  // hour or more.
  roomWarning() {
    if (!this.library) return null;
    const u = this.use();
    // (Never this recording's own earlier files: they're kept with it.)
    const open = this.recordings().filter((c) => !c.keep && !(this.recording && c.rec && c.rec === this.rec));
    if (!open.length || u.minutesLeft == null || u.minutesLeft >= WARN_MINUTES) return null;
    const when = u.minutesLeft < 1 ? "When this file is finished, the oldest recording will be deleted" : `In about ${u.minutesLeft} min, the oldest recording will be deleted`;
    return `${when} to stay within ${sizeText(u.limit)} (Recording panel: Keep, or a bigger allowance)`;
  }

  // A recording kept whatever the allowance (or not), or deleted. Each
  // reads the index again. (The allowance itself is limits.js's.)
  async setKeep(id, keep) {
    await this.post(`/api/clips/${id}/keep`, { keep });
  }
  async remove(id) {
    try {
      const res = await fetch(`/api/clips/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`the server said ${res.status}`);
    } catch (err) {
      this.toast(`Couldn't delete that recording: ${err.message}`, 3000);
    }
    await this.loadLibrary();
  }
  // Saved replays deleted (the Recording panel's Saved replays: a shot's
  // every angle), then the index read again.
  async removeClips(ids) {
    let failed = 0;
    for (const id of ids) {
      try {
        const res = await fetch(`/api/clips/${id}`, { method: "DELETE" });
        if (!res.ok && res.status !== 404) throw new Error(`the server said ${res.status}`);
      } catch {
        failed++;
      }
    }
    if (failed) this.toast(`Couldn't delete ${failed === 1 ? "one of those replays" : `${failed} of those replays`}`, 3000);
    await this.loadLibrary();
  }
  async post(url, body) {
    let out = null;
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error ?? `the server said ${res.status}`);
    } catch (err) {
      this.toast(`That wasn't changed: ${err.message}`, 3000);
      out = null;
    }
    await this.loadLibrary();
    return out;
  }

  // ---- What the controls show ---------------------------------------------------------------

  elapsedMs() {
    return this.recording ? performance.now() - this.startedAt : 0;
  }
  elapsedText() {
    return elapsedText(this.elapsedMs());
  }

  // The type a recording takes now: the Format chosen (H.265 where the
  // graphics card can), H.264 once H.265 has failed this run (recover).
  typeFor(audio = true) {
    if (typeof MediaRecorder === "undefined") return null;
    return pickVideoType((m) => MediaRecorder.isTypeSupported(m), { audio, format: this.hevcFailed ? "anywhere" : this.settings.format });
  }
  // Whether this PC can record H.265 (the panel says so).
  get canHevc() {
    return typeof MediaRecorder !== "undefined" && pickVideoType((m) => MediaRecorder.isTypeSupported(m), { audio: false })?.codec === "hevc";
  }
  // About how many bytes an hour: the recording's own while recording,
  // else at what's set, in the codec it would take.
  perHour() {
    if (this.recording && this.bits) return ((this.bits + AUDIO_BITRATE) / 8) * 3600;
    const s = this.settings;
    const { w, h } = sizeOf(s);
    return bytesPerHour(w, h, s.fps, s.quality, this.typeFor()?.codec ?? "avc");
  }

  // How many encoders are busy (the panel says so).
  encoders() {
    const replayCams = this.cameras.settings.replay ? this.cameras.cams.filter((c) => c.replay && this.cameras.state(c.id).stream).length : 0;
    return encoderCount({ replayCams, keepReplays: this.settings.keepReplays, recording: true });
  }

  // For the panel: how the compositor is keeping up.
  stats() {
    return { frames: this.compositor.frames, drawMs: this.compositor.drawMs, gameFps: this.meter.stats()?.fps ?? null, sent: this.session?.bytes ?? 0, waiting: this.session?.queue.length ?? 0 };
  }
}

