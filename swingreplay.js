// The swing replay on the game window: the last shot's camera replay, big,
// where the golfer can see it from the mat - asked for by voice ("replay",
// "show me that swing", "slow motion"), Q, or a camera box's "Show on
// projector". One camera large and centred, two side by side and in step;
// a caption under it ("7 iron · 154 yds · ½ speed"); round a few times (3
// to begin with) at half speed, then gone. The next shot, Esc, Q again or
// "close replay" closes it at once. It never takes a click or a key the
// sim needs: shots go on arriving and close it.
//
// Which cameras, the speed, the times round and where on the picture are
// the Cameras panel's (kept with the cameras' settings); the rules and the
// steps are sim/swingreplay.mjs's.
//
// The clips are the ones the camera boxes play (replay.js), already in
// this page: the game window IS the sim's page (the controls window is
// only its elements moved to another window), so the recording's own blob
// is played - nothing copied, re-encoded or read from disk, and a save
// moving the file on the server doesn't pull it from under the replay.
// Only if that's gone is the clip looked up on the server
// (/api/clips/shot/<n>) and read from there.
//
// Only decoded while it shows: closed, every video lets go of its clip.

import { showView } from "./camview.js";
import { pickReplayCams, replayPlan, replayStep, replayCaption, followerTime, waitUntil, IDLE, NO_REPLAY } from "./sim/swingreplay.mjs";
import { seekable } from "./camerabox.js";

// How often the waiting is checked and two clips kept in step, ms.
const TICK = 200;

export class SwingReplay {
  // view: the picture's element (#view). cameras: the CameraManager.
  // replay: the InstantReplay. toast(text, ms). clubName(code). before:
  // the element it goes in front of (the toasts, so they stay on top).
  // onChange(showing): shown or closed (the camera boxes' button).
  // playerList(): the players list, so the caption leaves the name out when
  // there's only one (sim/swingreplay.mjs's captionPlayer).
  constructor({ view, cameras, replay, toast = () => {}, clubName = (c) => c, playerList = () => null, before = null, onChange = () => {} }) {
    Object.assign(this, { cameras, replay, toast, clubName, playerList, onChange });
    this.state = IDLE;
    this.el = document.createElement("div");
    this.el.className = "swing-replay";
    this.el.hidden = true;
    this.el.innerHTML = `<div class="sr-frame"><div class="sr-videos"></div><div class="sr-caption"></div></div>`;
    view.insertBefore(this.el, before && before.parentNode === view ? before : null);
    this.videos = this.el.querySelector(".sr-videos");
    this.captionEl = this.el.querySelector(".sr-caption");
    // camId -> { v, start, end, clipUrl }
    this.players = new Map();
    this.timer = null;
    // The caption follows the shot's carry, which comes when it's recorded.
    replay.onSaveChange(() => this.showing && this.caption());
  }

  get showing() {
    return this.state.phase !== "idle";
  }
  // Whether the next shot will have a replay to show: a camera set up for
  // it, with replays on (and a browser that can record them).
  get canReplay() {
    return this.replay.supported && pickReplayCams(this.cameras.cams, this.cameras.settings.swing, { replayOn: this.cameras.settings.replay }).length > 0;
  }

  // ---- Asked for --------------------------------------------------------------------------

  // Voice, Q, the button: the last shot's replay, at speed (or the Cameras
  // panel's). Asked while it's showing that shot, it starts again. Returns
  // { done, short } or { why } (said in a toast too).
  show({ speed = null } = {}) {
    const swing = this.cameras.settings.swing;
    const pick = pickReplayCams(this.cameras.cams, swing, { replayOn: this.cameras.settings.replay });
    const cur = this.replay.current;
    const shot = cur && { shotNumber: cur.shotNumber, recording: cur.cams ?? [], clips: [...(cur.byCam?.keys() ?? [])], gone: [] };
    const plan = replayPlan({ pick, replayOn: this.cameras.settings.replay, paused: this.replay.paused, shot });
    if (plan.why) {
      const why = NO_REPLAY[plan.why];
      this.toast(why, 2600);
      return { why };
    }
    this.meta = cur.shot.meta;
    this.names = new Map(plan.cams.map((c) => [c.id, c.name]));
    this.dispatch({
      type: "show",
      shot: plan.shot,
      cams: plan.cams.map((c) => c.id),
      ready: plan.ready,
      speed: speed ?? swing.speed,
      loops: swing.loops,
      deadline: waitUntil({ now: performance.now(), shotAt: cur.at, postRoll: this.replay.window.postRoll }),
    });
    return { done: "showing the replay", short: "Replay" };
  }

  // "Again": from the beginning (or, closed, shown again).
  again() {
    if (!this.showing) return this.show();
    this.dispatch({ type: "again" });
    return { done: "again", short: "Again" };
  }

  close() {
    if (!this.showing) return { done: "no replay showing", short: "No replay showing" };
    this.dispatch({ type: "close" });
    return { done: "replay closed", short: "Replay closed" };
  }

  // Q and the button: shown, or closed if it's showing.
  toggle() {
    return this.showing ? this.close() : this.show();
  }

  // The next shot: closed at once.
  shot() {
    this.dispatch({ type: "shot" });
  }

  // A camera's clip came (replay.js): the replay waiting for it goes on.
  clip(clip) {
    if (this.state.phase === "waiting") this.dispatch({ type: "ready", shot: clip.meta?.shotNumber, cam: clip.cam.id });
  }

  // ---- Showing it ---------------------------------------------------------------------------

  dispatch(ev) {
    const prev = this.state;
    this.state = replayStep(prev, ev);
    this.render(prev);
  }

  render(prev) {
    const s = this.state;
    if (s.phase === "idle") {
      if (prev.phase !== "idle") {
        this.stop();
        if (s.why === "late") this.toast(NO_REPLAY.late, 2600);
        this.onChange(false);
      }
      return;
    }
    const place = this.cameras.settings.swing?.place ?? "full";
    this.el.hidden = false;
    this.el.dataset.place = place;
    this.el.dataset.phase = s.phase;
    this.el.dataset.count = String(s.cams.length);
    if (!this.timer) this.timer = setInterval(() => this.tick(), TICK);
    if (prev.phase === "idle") this.onChange(true);
    this.caption();
    if (s.phase === "waiting") {
      this.videos.hidden = true;
      return;
    }
    this.videos.hidden = false;
    // A video for each camera shown (the shot's own clip), in order.
    for (const id of [...this.players.keys()]) if (!s.cams.includes(id) || prev.shot !== s.shot) this.drop(id);
    for (const id of s.cams) if (!this.players.has(id)) this.load(id);
    for (const id of s.cams) this.videos.appendChild(this.players.get(id).box);
    if (s.run !== prev.run || prev.phase !== "showing") this.restart();
    else for (const p of this.players.values()) p.v.playbackRate = s.speed;
  }

  caption() {
    const s = this.state;
    this.captionEl.textContent = s.phase === "waiting" ? "Replay coming…" : replayCaption(this.meta, s.speed, this.clubName, { players: this.playerList() });
  }

  // A camera's clip into a video: the one in this page, else the server's.
  load(id) {
    const box = document.createElement("div");
    box.className = "sr-cam";
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    box.appendChild(v);
    // Turned and cropped as the camera's settings say (camview.js).
    showView(v, this.cameras.cams.find((c) => c.id === id)?.view);
    const p = { id, box, v, start: 0, end: Infinity, ready: false, ended: false, triedServer: false };
    this.players.set(id, p);
    const clip = this.replay.current?.byCam?.get(id);
    v.addEventListener("ended", () => this.ended(p));
    v.addEventListener("error", () => this.fromServer(p));
    if (clip?.url) this.source(p, clip.url, (clip.offsetMs ?? 0) / 1000, clip.duration);
    else this.fromServer(p);
  }

  source(p, url, start, duration) {
    p.start = Math.max(0, start || 0);
    p.end = Number.isFinite(duration) && duration > 0 ? duration : Infinity;
    p.ready = false;
    p.v.addEventListener(
      "loadedmetadata",
      () =>
        seekable(p.v).then(() => {
          if (Number.isFinite(p.v.duration)) p.end = p.v.duration;
          p.ready = true;
          if (this.state.phase === "showing") this.restart();
        }),
      { once: true },
    );
    p.v.src = url;
  }

  // The page's copy has gone (its blob let go): the server's, if it still
  // has that shot's clip from this camera. Otherwise the replay says so.
  async fromServer(p) {
    if (p.triedServer || this.players.get(p.id) !== p) return;
    p.triedServer = true;
    const shotNumber = this.state.shot;
    let entry = null;
    try {
      const got = await (await fetch(`/api/clips/shot/${encodeURIComponent(shotNumber)}`)).json();
      entry = (got.clips ?? []).find((c) => c.cam === p.id) ?? null;
    } catch {
      entry = null;
    }
    if (this.players.get(p.id) !== p || this.state.shot !== shotNumber) return;
    if (entry) return this.source(p, `/api/clips/file/${encodeURIComponent(entry.file)}`, entry.offset ?? 0, null);
    this.drop(p.id);
    const left = this.state.cams.filter((id) => id !== p.id && this.players.has(id));
    if (!left.length) {
      this.dispatch({ type: "close" });
      this.toast(NO_REPLAY.gone, 2600);
    } else this.state = { ...this.state, cams: left };
  }

  // From the beginning of each clip (the shot less the seconds before it),
  // together, at the speed.
  restart() {
    for (const p of this.players.values()) {
      p.ended = false;
      if (!p.ready) continue;
      p.v.playbackRate = this.state.speed;
      p.v.currentTime = Math.min(p.start, Math.max(0, (Number.isFinite(p.end) ? p.end : p.start) - 0.05));
      p.v.play().catch(() => {});
    }
  }

  // Round again once every clip has reached its end (a shorter one waits
  // on its last frame for the other).
  ended(p) {
    if (this.state.phase !== "showing") return;
    p.ended = true;
    if ([...this.players.values()].every((x) => x.ended || !x.ready)) this.dispatch({ type: "ended" });
  }

  tick() {
    if (this.state.phase === "waiting") return this.dispatch({ type: "tick", now: performance.now() });
    if (this.state.phase !== "showing") return;
    if (this.state.phase !== "showing" || this.players.size < 2) return;
    // Two in step: the one with the most to play leads; the other is kept
    // at the same moment of the swing.
    const list = [...this.players.values()].filter((p) => p.ready);
    if (list.length < 2) return;
    const lead = list.reduce((a, b) => (b.end - b.start > a.end - a.start ? b : a));
    for (const p of list) {
      if (p === lead || p.ended || p.v.seeking) continue;
      const t = followerTime({ leaderTime: lead.v.currentTime, leaderStart: lead.start, followerStart: p.start, followerTime: p.v.currentTime, followerEnd: p.end, tolerance: 0.1 * Math.max(0.5, this.state.speed * 2) });
      if (t != null) p.v.currentTime = t;
    }
  }

  drop(id) {
    const p = this.players.get(id);
    if (!p) return;
    this.players.delete(id);
    p.v.pause();
    p.v.removeAttribute("src");
    p.v.load();
    p.box.remove();
  }

  // Closed: hidden, and every video lets go of its clip, so nothing is
  // decoded while it isn't showing.
  stop() {
    clearInterval(this.timer);
    this.timer = null;
    for (const id of [...this.players.keys()]) this.drop(id);
    this.el.hidden = true;
    this.videos.hidden = true;
  }

  // What the recording draws of it (compositor.js drawReplay): where it
  // sits, its caption, and each camera's video that's ready with that
  // camera's turn and crop - or null while it isn't showing. (It sits over
  // the picture, not in it, so a recording would otherwise miss it.)
  frame() {
    const s = this.state;
    if (s.phase === "idle" || this.el.hidden) return null;
    const videos = s.phase !== "showing" ? [] : s.cams.map((id) => this.players.get(id)).filter((p) => p?.ready && p.v.videoWidth > 0).map((p) => ({ v: p.v, view: this.cameras.cams.find((c) => c.id === p.id)?.view ?? null }));
    return { phase: s.phase, place: this.el.dataset.place ?? "full", caption: this.captionEl.textContent, videos };
  }

  // For the checks: what it's showing.
  status() {
    const s = this.state;
    return {
      phase: s.phase,
      shot: s.shot,
      cams: [...s.cams],
      speed: s.speed,
      loop: s.loop,
      loops: s.loops,
      why: s.why,
      place: this.el.dataset.place ?? null,
      caption: this.el.hidden ? "" : this.captionEl.textContent,
      videos: [...this.players.values()].map((p) => ({ cam: p.id, src: p.v.currentSrc || p.v.src || "", time: p.v.currentTime, start: p.start, since: p.v.currentTime - p.start, rate: p.v.playbackRate, playing: !p.v.paused && !p.v.ended, ready: p.ready })),
      decoding: [...this.el.querySelectorAll("video")].filter((v) => v.getAttribute("src")).length,
    };
  }
}
