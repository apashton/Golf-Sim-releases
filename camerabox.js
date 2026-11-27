// The cameras in the controls window (separate windows): a box for each
// chosen camera, live, and after every shot its instant replay looping,
// with a strip to play and pause it, slow it to a quarter or half speed,
// step it a frame at a time (the buttons, or , and . with the box clicked)
// and go back to live. The next shot brings every box back to live until
// its replay is ready. With two angles, the controls work both together,
// so a face-on and a down-the-line replay stay in step. Save keeps the
// replay (every angle of that shot): otherwise it's gone at the next shot.
// "Show on projector" puts the last shot's replay big on the game window
// for the golfer at the mat (swingreplay.js) - the one thing of the
// cameras ever shown there, and only until it closes.
//
// The boxes are arrange.js's, like the Shot details: moved, sized and
// zoomed in arrange mode, kept for every mode, and packed with the rest to
// begin with, 16:9. Only with separate windows: with one window nothing is
// shown (the replays are still saved), and nothing is drawn on the game
// window, which stays clean for the projector - unless it's asked for.
//
// Plain <video> elements, played by the graphics card's decoder; no frame
// is copied through a canvas. The elements live in the sim's page, in a
// wrapper that goes to the controls window with the rest (app.js's parts).

import { showView } from "./camview.js";
import { esc } from "./util.js";
import { describeTrack } from "./sim/cameras.mjs";

const SPEEDS = [0.25, 0.5, 1];
const SPEED_WORDS = { 0.25: "¼×", 0.5: "½×", 1: "1×" };

export class CameraBoxes {
  // cameras: the CameraManager. layout(): the controls window's boxes have
  // changed (arrange.js lays them out again). settings(): opens the
  // Cameras panel. save(): keeps the current replay (app.js's saveReplay).
  // project(): the swing replay on the game window, shown or closed.
  constructor({ cameras, layout = () => {}, settings = () => {}, save = () => {}, project = () => {} }) {
    this.cameras = cameras;
    this.layout = layout;
    this.settings = settings;
    this.save = save;
    this.project = project;
    // Whether the swing replay is showing on the game window.
    this.projecting = false;
    // The current replay, as the InstantReplay has it (saveState()).
    this.saveState = null;
    this.el = document.createElement("div");
    this.el.className = "camera-boxes";
    document.body.appendChild(this.el);
    this.boxes = new Map(); // cam.id -> { el, live, replay, clip, mode }
    this.separate = false;
    // Shared by every box: the replays play together.
    this.speed = 1;
    this.playing = true;
    cameras.onChange(() => this.render());
    this.render();
  }

  // Arrange.js's boxes: one per camera, while the screens are separate.
  extras() {
    if (!this.separate) return [];
    // Taken out (its ×, or unticked in Arrange's Boxes): off the command
    // centre - Cameras' Command centre tick brings it back.
    return [...this.boxes].map(([id, b]) => ({ id: `cam-${id}`, el: b.el, name: `Camera: ${b.cam.name}`, remove: () => this.offCentre(id) }));
  }

  // The cameras taken off the command centre, to tick back in Arrange ▾
  // (as Cameras' Command centre tick does).
  takenOut() {
    if (!this.separate) return [];
    return this.cameras.cams.filter((c) => c.centre === false).map((c) => ({ id: `cam-back-${c.id}`, name: `Camera: ${c.name}`, restore: () => this.cameras.update(c.id, { centre: true }) }));
  }

  // A camera taken off the command centre: still recording its replays,
  // and on the shot screen if it's ticked for that.
  offCentre(id) {
    this.cameras.update(id, { centre: false });
  }

  setSeparate(on) {
    this.separate = on;
    for (const b of this.boxes.values()) this.attach(b);
    this.layout();
  }

  // A box for every chosen camera shown in the command centre, each
  // showing what it can.
  render() {
    const cams = this.cameras.cams.filter((c) => c.centre !== false);
    let changed = false;
    for (const [id, b] of this.boxes) {
      if (cams.some((c) => c.id === id)) continue;
      this.detachVideo(b);
      b.el.remove();
      this.boxes.delete(id);
      changed = true;
    }
    for (const cam of cams) {
      let b = this.boxes.get(cam.id);
      if (!b) {
        b = this.make(cam);
        this.boxes.set(cam.id, b);
        changed = true;
      }
      // In the settings' order.
      this.el.appendChild(b.el);
      b.cam = cam;
      // Turned and cropped as its settings say (camview.js), live and replay.
      showView(b.live, cam.view);
      showView(b.replay, cam.view);
      this.attach(b);
      this.drawState(b);
    }
    if (changed) this.layout();
  }

  make(cam) {
    const el = document.createElement("section");
    el.className = "camera-box";
    el.tabIndex = 0;
    el.dataset.cam = cam.id;
    el.innerHTML = `
      <h3><span class="cam-name"></span> <small class="cam-state"></small><button class="cam-gear" data-act="settings" title="Cameras: which, their names, size, replay and where they show">⚙</button><button class="cam-gear" data-act="hide" title="Take this camera off the command centre (it still records; Cameras brings it back)">×</button></h3>
      <div class="cam-view">
        <video class="cam-live" muted playsinline autoplay></video>
        <video class="cam-replay" muted playsinline hidden></video>
        <span class="cam-badge" hidden>Replay</span>
        <p class="cam-problem" hidden></p>
      </div>
      <div class="cam-strip">
        <button data-act="play" title="Play / pause the replay">Pause</button>
        <button data-act="back" title="A frame back (, with this box clicked)">◀ frame</button>
        <button data-act="fwd" title="A frame on (. with this box clicked)">frame ▶</button>
        <span class="cam-speeds">${SPEEDS.map((s) => `<button data-speed="${s}" title="${s === 1 ? "Full speed" : `${s * 100}% speed`}">${SPEED_WORDS[s]}</button>`).join("")}</span>
        <button data-act="toggle" class="cam-toggle">Replay</button>
        <button data-act="save" class="cam-save">Save</button>
        <button data-act="project" class="cam-project">Show on projector</button>
      </div>`;
    const b = { el, cam, live: el.querySelector(".cam-live"), replay: el.querySelector(".cam-replay"), clip: null, mode: "live", stream: null };
    el.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      btn.blur();
      if (btn.dataset.speed) return this.control("speed", Number(btn.dataset.speed));
      if (btn.dataset.act === "settings") return this.settings();
      if (btn.dataset.act === "hide") return this.offCentre(b.cam.id);
      if (btn.dataset.act === "save") return this.save();
      if (btn.dataset.act === "project") return this.project();
      if (btn.dataset.act === "toggle") return b.mode === "replay" ? this.goLive() : this.replayAll();
      this.control(btn.dataset.act);
    });
    // , and . step a frame while the box has the keyboard (clicked); they
    // go no further, so they're no shortcut anywhere else.
    el.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "," || e.key === ".") {
        e.preventDefault();
        e.stopPropagation();
        if (b.mode !== "replay") this.replayAll();
        this.control(e.key === "," ? "back" : "fwd");
      }
    });
    // Round and round: back to where the shot's window starts.
    b.replay.addEventListener("ended", () => {
      if (b.mode !== "replay") return;
      b.replay.currentTime = b.start ?? 0;
      if (this.playing) b.replay.play().catch(() => {});
    });
    return b;
  }

  // The live picture on while the box is on screen; off otherwise, so an
  // unseen video isn't decoded.
  attach(b) {
    const { stream } = this.cameras.state(b.cam.id);
    const want = this.separate && b.mode === "live" ? stream : null;
    if (b.live.srcObject !== want) b.live.srcObject = want;
    b.live.hidden = b.mode !== "live";
    if (want) b.live.play().catch(() => {});
    if (!this.separate && b.mode === "replay") b.replay.pause();
    if (this.separate && b.mode === "replay" && this.playing && b.replay.paused) b.replay.play().catch(() => {});
  }

  detachVideo(b) {
    b.live.srcObject = null;
    b.replay.removeAttribute("src");
    b.replay.load();
  }

  drawState(b) {
    const { error, actual, stream } = this.cameras.state(b.cam.id);
    b.el.querySelector(".cam-name").textContent = b.cam.name;
    const replay = b.cam.replay && this.cameras.settings.replay;
    const state = b.mode === "replay" ? `replay${b.clip?.shotLabel ? ` · ${b.clip.shotLabel}` : ""}` : error ? "not showing" : stream ? `live${actual ? ` · ${actual}` : ""}${replay ? "" : " · replay off"}` : "opening...";
    b.el.querySelector(".cam-state").textContent = state;
    const problem = b.el.querySelector(".cam-problem");
    problem.hidden = !error;
    problem.innerHTML = error ? `${esc(b.cam.name)}: ${esc(error.text)} <button data-act="retry">Try again</button>` : "";
    problem.querySelector("button")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.cameras.retry(b.cam.id);
    });
    b.el.querySelector(".cam-badge").hidden = b.mode !== "replay";
    b.el.classList.toggle("replaying", b.mode === "replay");
    const inReplay = b.mode === "replay";
    for (const btn of b.el.querySelectorAll('.cam-strip [data-act="play"], .cam-strip [data-act="back"], .cam-strip [data-act="fwd"], .cam-strip [data-speed]')) btn.disabled = !inReplay;
    b.el.querySelector('[data-act="play"]').textContent = this.playing ? "Pause" : "Play";
    for (const btn of b.el.querySelectorAll("[data-speed]")) btn.classList.toggle("on", Number(btn.dataset.speed) === this.speed);
    const toggle = b.el.querySelector(".cam-toggle");
    toggle.textContent = inReplay ? "Live" : "Replay";
    toggle.title = inReplay ? "Back to the live picture" : "The last shot's replay again";
    toggle.disabled = !inReplay && !b.clip;
    this.drawSave(b);
  }

  // Save: while there's a replay to keep (until the next shot), then
  // "Saved" once it's kept.
  drawSave(b) {
    const btn = b.el.querySelector(".cam-save");
    const st = this.saveState;
    btn.hidden = !(b.cam.replay && this.cameras.settings.replay);
    btn.disabled = !st || st.saved;
    btn.classList.toggle("on", !!st?.saved);
    btn.textContent = st?.saved ? "Saved ✓" : "Save";
    btn.title = st?.saved ? "This replay is kept in the clips folder, every angle" : st ? "Keep this replay, every angle (Shift + S, or say \"save that\") - otherwise the next shot replaces it" : "No replay to keep yet";
    const pro = b.el.querySelector(".cam-project");
    pro.hidden = btn.hidden;
    pro.disabled = !st && !this.projecting;
    pro.classList.toggle("on", this.projecting);
    pro.textContent = this.projecting ? "Hide from projector" : "Show on projector";
    pro.title = this.projecting ? "Close the swing replay on the game window (Q, Esc, or say \"close replay\")" : st ? "The last shot's replay, big on the game window for the golfer (Q, or say \"replay\") - which cameras in Cameras" : "No replay to show yet";
  }

  // The swing replay on the game window shown or closed.
  setProjecting(on) {
    this.projecting = !!on;
    for (const b of this.boxes.values()) this.drawSave(b);
  }

  // The current replay changed (a shot, an angle ready, saved).
  setSaveState(state) {
    this.saveState = state;
    for (const b of this.boxes.values()) this.drawSave(b);
  }

  // ---- Replays ------------------------------------------------------------------------

  // A shot: every box back to live until its replay is ready.
  shot() {
    this.goLive();
    for (const b of this.boxes.values()) if (b.cam.replay && this.cameras.settings.replay) b.el.querySelector(".cam-state").textContent = "live · replay coming";
  }

  // A camera's clip is ready: its box plays it, from the shot less the
  // pre-roll, round and round.
  clip(clip) {
    const b = this.boxes.get(clip.cam.id);
    if (!b) return URL.revokeObjectURL(clip.url);
    if (b.clip?.url && b.clip.url !== clip.url) URL.revokeObjectURL(b.clip.url);
    const m = clip.meta ?? {};
    clip.shotLabel = [m.player, m.club].filter(Boolean).join(" ");
    b.clip = clip;
    this.playing = true;
    this.show(b);
  }

  // Back to every box's last replay.
  replayAll() {
    this.playing = true;
    for (const b of this.boxes.values()) if (b.clip) this.show(b);
  }

  show(b) {
    const clip = b.clip;
    b.mode = "replay";
    b.start = clip.offsetMs / 1000;
    b.fps = clip.fps || 30;
    const v = b.replay;
    v.hidden = false;
    v.playbackRate = this.speed;
    if (v.dataset.url !== clip.url) {
      v.dataset.url = clip.url;
      v.src = clip.url;
      v.addEventListener("loadedmetadata", () => seekable(v).then(() => this.restart(b)), { once: true });
    } else this.restart(b);
    this.attach(b);
    this.drawState(b);
  }

  restart(b) {
    const v = b.replay;
    if (b.mode !== "replay") return;
    v.currentTime = Math.min(b.start, Math.max(0, (Number.isFinite(v.duration) ? v.duration : b.start) - 0.05));
    v.playbackRate = this.speed;
    if (this.playing && this.separate) v.play().catch(() => {});
  }

  goLive() {
    for (const b of this.boxes.values()) {
      if (b.mode === "live") continue;
      b.mode = "live";
      b.replay.pause();
      b.replay.hidden = true;
      this.attach(b);
      this.drawState(b);
    }
  }

  // The strip's buttons, on every box showing a replay together.
  control(act, value) {
    const showing = [...this.boxes.values()].filter((b) => b.mode === "replay");
    if (act === "speed") {
      this.speed = value;
      for (const b of showing) b.replay.playbackRate = value;
    } else if (act === "play") {
      this.playing = !this.playing;
      for (const b of showing) this.playing ? b.replay.play().catch(() => {}) : b.replay.pause();
    } else if (act === "back" || act === "fwd") {
      this.playing = false;
      for (const b of showing) {
        const v = b.replay;
        v.pause();
        const end = Number.isFinite(v.duration) ? v.duration : Infinity;
        v.currentTime = Math.min(end, Math.max(0, v.currentTime + (act === "fwd" ? 1 : -1) / (b.fps || 30)));
      }
    } else if (act === "live") return this.goLive();
    for (const b of this.boxes.values()) this.drawState(b);
  }

  // For the checks: what each box shows.
  status() {
    return [...this.boxes.values()].map((b) => ({ cam: b.cam.id, name: b.cam.name, mode: b.mode, live: !!b.live.srcObject, clip: !!b.clip, save: b.el.querySelector(".cam-save").textContent, saveDisabled: b.el.querySelector(".cam-save").disabled, playing: b.mode === "replay" && !b.replay.paused, time: b.replay.currentTime, start: b.start, duration: b.replay.duration, length: b.clip?.length, track: describeTrack(this.cameras.state(b.cam.id).settings) }));
  }
}

// A recording straight from MediaRecorder often doesn't say how long it is
// (WebM has no duration in its header): the browser works it out if asked
// to seek past the end, and seeking then works properly.
export function seekable(v) {
  if (Number.isFinite(v.duration)) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      v.removeEventListener("durationchange", check);
      clearTimeout(timer);
      resolve();
    };
    const check = () => Number.isFinite(v.duration) && done();
    const timer = setTimeout(done, 2000);
    v.addEventListener("durationchange", check);
    v.currentTime = 1e7;
  });
}
