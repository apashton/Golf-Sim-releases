// The shot data screen's camera column (sim/shotcams.mjs says which
// cameras, where and when): each camera's live picture, turned and cropped
// as the Cameras panel has it (a camera on its side for down the line is
// upright here too; camview.js), opened here as well as in
// the game's window (Chromium shares a webcam between windows of one
// program), each shot's replay from the server once it's ready - played at
// the swing replay's speed, its times round - then live again. Where the
// webcam won't open here (a browser that isn't the one the game's in,
// with another program holding it), the box shows the replays alone.

import { CAM_CHANNEL, shotScreenCams, replayPace, clipsByCam, lookAgain, afterReplay, camWords, camAspect, camColumn, packCams, SHOT_CAMS } from "./sim/shotcams.mjs";
import { showView } from "./camview.js";
import { constraintsFor, matchAll, cameraProblem } from "./sim/cameras.mjs";
import { esc, loadSetting } from "./util.js";

export class ShotCams {
  // host: the column's element. onChange(count, { width, table }): the
  // cameras there now, how wide the column is (px) and whether the session
  // table goes under them (the page lays itself out round them).
  constructor({ host, onChange = () => {} }) {
    Object.assign(this, { host, onChange });
    this.area = document.createElement("div");
    this.area.className = "ss-cam-area";
    host.prepend(this.area);
    this.boxes = new Map();
    this.current = null;
    this.timer = null;
    this.build();
    // Cameras chosen or changed in the game's window: shown here too.
    window.addEventListener("storage", (e) => {
      if (e.key !== "golfsim.cameras") return;
      // The saved choice is the one that counts now (ticked again in
      // Cameras, a camera taken off here comes back).
      this.dropped?.clear();
      this.build();
    });
    window.addEventListener("resize", () => this.layout());
  }

  get count() {
    return this.boxes.size;
  }

  build() {
    const saved = loadSetting("cameras", null);
    // A camera's × here takes it off at once; the game saves it, and the
    // storage event brings the saved choice back here.
    this.dropped ??= new Set();
    const cams = shotScreenCams(saved).filter((c) => !this.dropped.has(c.id));
    const key = JSON.stringify(cams.map((c) => [c.id, c.deviceId, c.name, c.replay]));
    this.pace = replayPace(saved);
    if (key === this.key) {
      // Only turned or cropped differently: the same boxes, laid out again.
      for (const c of cams) {
        const b = this.boxes.get(c.id);
        if (b) b.cam = { ...b.cam, view: c.view, width: c.width, height: c.height };
      }
      return this.layout();
    }
    this.key = key;
    for (const b of this.boxes.values()) this.close(b);
    this.boxes.clear();
    for (const el of [...this.host.querySelectorAll(".ss-cam")]) el.remove();
    for (const cam of cams) {
      const el = document.createElement("figure");
      el.className = "ss-panel ss-cam";
      el.innerHTML = `<figcaption><span>${esc(cam.name)}</span><b class="ss-cam-state"></b><button type="button" class="ss-cam-x" title="Take this camera off the shot screen (it still records; Cameras in the game's menu brings it back)">×</button></figcaption>
        <div class="ss-cam-pic"><video class="live" muted autoplay playsinline></video><video class="replay" muted playsinline hidden></video></div>`;
      this.area.appendChild(el);
      const b = { cam, el, live: el.querySelector("video.live"), replay: el.querySelector("video.replay"), mode: "live", stream: null, problem: null, done: 0, label: "" };
      b.replay.addEventListener("ended", () => this.ended(b));
      el.querySelector(".ss-cam-x").addEventListener("click", () => this.drop(cam.id));
      this.boxes.set(cam.id, b);
      this.say(b);
      this.open(b);
    }
    this.layout();
  }

  // A camera taken off the shot screen with its ×.
  drop(id) {
    this.dropped.add(id);
    try {
      const ch = new BroadcastChannel(CAM_CHANNEL);
      ch.postMessage({ offShotScreen: id });
      ch.close();
    } catch {
      // No BroadcastChannel: off here until the screen is opened again.
    }
    this.key = null;
    this.build();
  }

  // Where each picture goes (sim/shotcams.mjs camColumn): the column as
  // wide as they want, each box its picture's shape, and the session table
  // under them if there's room.
  layout() {
    const cams = [...this.boxes.values()];
    if (!cams.length) {
      this.area.style.height = "0px";
      return this.onChange(0, { width: 0, table: false });
    }
    // The column's height: from its top to the foot of the window (shown
    // first, or it has no top).
    this.host.hidden = false;
    document.body.classList.add("with-cams");
    const top = this.host.getBoundingClientRect().top;
    const h = Math.max(200, window.innerHeight - top - 10);
    const col = camColumn(
      cams.map((b) => camAspect(b.cam)),
      window.innerWidth,
      h,
    );
    this.onChange(cams.length, { width: col.width, table: col.table });
    // As wide as the column really came out (the boxes beside it can only
    // be squeezed so far).
    const w = this.host.clientWidth;
    const tiles = Math.abs(w - col.width) > 2 && w > 0 ? packCams(cams.map((b) => camAspect(b.cam)), { w, h }).tiles : col.tiles;
    const usedH = Math.max(...tiles.map((r) => r.y + r.h));
    this.area.style.height = `${Math.round(usedH)}px`;
    cams.forEach((b, i) => {
      const r = tiles[i];
      Object.assign(b.el.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` });
      showView(b.live, b.cam.view);
      showView(b.replay, b.cam.view);
    });
  }

  // The live picture: the camera as the Cameras panel has it, found again
  // by its name if its id has changed (sim/cameras.mjs matchAll).
  async open(b) {
    const md = navigator.mediaDevices;
    if (!md?.getUserMedia) return this.failed(b, null);
    try {
      let deviceId = b.cam.deviceId;
      try {
        const devices = (await md.enumerateDevices()).filter((d) => d.kind === "videoinput");
        deviceId = matchAll([b.cam], devices).get(b.cam.id)?.deviceId ?? deviceId;
      } catch {
        // Listed or not, the saved id is tried.
      }
      const stream = await md.getUserMedia(constraintsFor(b.cam, deviceId));
      if (this.boxes.get(b.cam.id) !== b) return stream.getTracks().forEach((t) => t.stop());
      b.stream = stream;
      b.live.srcObject = stream;
      b.live.play().catch(() => {});
      b.problem = null;
    } catch (err) {
      this.failed(b, err);
    }
    this.say(b);
  }
  failed(b, err) {
    b.stream = null;
    b.problem = b.cam.replay ? "Replays after each shot" : err ? cameraProblem(err) : "No live picture here";
    this.say(b);
  }
  close(b) {
    b.stream?.getTracks().forEach((t) => t.stop());
    b.replay.removeAttribute("src");
    b.replay.load?.();
  }

  // A shot: each camera waits for its replay, looked for on the server
  // until it's there.
  shot(shotNumber, label = "") {
    if (!this.count) return;
    clearTimeout(this.timer);
    this.current = { n: shotNumber, at: Date.now(), label };
    for (const b of this.boxes.values()) {
      if (!b.cam.replay) continue;
      b.mode = "waiting";
      b.label = label;
      this.say(b);
    }
    this.timer = setTimeout(() => this.look(), SHOT_CAMS.firstLook);
  }

  async look() {
    const s = this.current;
    if (!s) return;
    const waiting = [...this.boxes.values()].filter((b) => b.mode === "waiting");
    let got = null;
    try {
      got = await (await fetch(`/api/clips/shot/${encodeURIComponent(s.n)}`)).json();
    } catch {
      got = null;
    }
    if (this.current !== s) return;
    const clips = clipsByCam(got, waiting.map((b) => b.cam));
    for (const b of waiting) if (clips[b.cam.id]) this.play(b, clips[b.cam.id]);
    const left = waiting.filter((b) => !clips[b.cam.id]).length;
    if (lookAgain({ since: Date.now() - s.at, waiting: left })) this.timer = setTimeout(() => this.look(), SHOT_CAMS.every);
    else for (const b of this.boxes.values()) if (b.mode === "waiting") this.toLive(b);
  }

  // A replay, from the shot less the seconds before it, round its times.
  play(b, clip) {
    b.mode = "replay";
    b.done = 0;
    b.start = clip.offset;
    const v = b.replay;
    v.hidden = false;
    b.live.hidden = true;
    v.src = clip.url;
    v.addEventListener(
      "loadedmetadata",
      () => {
        this.restart(b);
      },
      { once: true },
    );
    this.say(b);
  }
  restart(b) {
    const v = b.replay;
    if (b.mode !== "replay") return;
    v.playbackRate = this.pace.speed;
    v.currentTime = Math.min(b.start, Math.max(0, (Number.isFinite(v.duration) ? v.duration : b.start) - 0.05));
    v.play().catch(() => {});
  }
  ended(b) {
    if (b.mode !== "replay") return;
    b.done++;
    const next = afterReplay({ done: b.done, loops: this.pace.loops, live: !!b.stream });
    if (next === "live") this.toLive(b);
    else this.restart(b);
  }
  toLive(b) {
    b.mode = "live";
    b.replay.pause();
    b.replay.hidden = true;
    b.live.hidden = false;
    this.say(b);
  }

  say(b) {
    const el = b.el.querySelector(".ss-cam-state");
    el.textContent = camWords({ mode: b.mode, live: !!b.stream, problem: b.problem, label: b.label, speed: this.pace?.speed ?? 1 });
    b.el.classList.toggle("replaying", b.mode === "replay");
  }
}
