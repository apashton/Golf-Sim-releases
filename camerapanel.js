// The Cameras panel: which webcams to use, each with a live preview, its
// angle's name ("Face on", "Down the line"), its size and frame rate, and
// whether it keeps a replay of every shot; the replay's window (seconds
// before and after the shot) and how much disk the saved clips may use (a
// replay not saved goes at the next shot); and the swing replay on the game
// window - which one or two cameras it shows, left and right, its speed,
// times round and place (swingreplay.js). Opened
// from the camera button in the controls window's top bar, a camera box's
// ⚙, or the menu's Cameras & video page. It opens in the controls window when
// the screens are separate (app.js moves it there with the menus).
//
// Previews of cameras not ticked are opened small while the panel is open
// and closed with it; a ticked camera's preview is its own stream. A camera
// another program holds says so on its row.

import { RESOLUTIONS, FRAME_RATES, constraintsFor, cameraProblem, MAX_CAMERAS } from "./sim/cameras.mjs";
import { WINDOW_LIMITS, LIMIT_GB } from "./sim/clips.mjs";
import { SWING_SPEEDS, SPEED_WORDS, PLACES, PLACE_WORDS, LOOP_LIMITS, pickReplayCams } from "./sim/swingreplay.mjs";
import { changeLimit } from "./limits.js";
import { esc } from "./util.js";
import { cleanView, turned, viewWords, turnedSize, containRect, cropFromPoints, moveCrop, fixedCorner, FULL } from "./sim/camview.mjs";
import { showView } from "./camview.js";

export class CameraPanel {
  // cameras: the CameraManager. replay: the InstantReplay. bridge: the
  // Windows app's (to open the clips folder), or null. separate(): whether
  // the screens are separate (the boxes only show then). toast(text, ms).
  // openReplays(): every saved replay (the Recording panel's Saved
  // replays), or null.
  constructor({ cameras, replay, bridge = null, separate = () => false, toast = () => {}, openReplays = null }) {
    Object.assign(this, { cameras, replay, bridge, separate, toast });
    this.el = document.createElement("div");
    this.el.className = "bay-help camera-panel";
    this.el.hidden = true;
    this.el.innerHTML = `<div class="bay-help-box camera-settings">
      <h2>Cameras</h2>
      <p class="muted small">Tick the webcams to use. Each one is a box in the controls window (separate windows, <kbd>Shift + D</kbd>) and on the shot data screen, live, and after every shot it plays that shot's replay - <b>Show in</b> picks which of the two (either, both or neither; the × on a camera's box takes it off that one). A replay is kept only until the next shot, unless you save it: <b>Save</b> on a camera box, <kbd>Shift + S</kbd>, or say "save that" - every angle of that shot goes in the clips folder. Nothing is shown on the game window, except the swing replay when it's asked for (below). A webcam opens in one program at a time: if another program has it, close it there first.</p>
      <div class="cam-list"></div>
      <div class="buttons"><button data-act="look">Look for cameras again</button></div>
      <section class="cam-swing">
        <h3>Swing replay on the game window</h3>
        <p class="muted small">Say "replay" (or "show me that swing", "slow motion"), press <kbd>Q</kbd>, or <b>Show on projector</b> on a camera box: the last shot's replay, big on the game window for whoever is at the mat, a few times round, then gone. The next shot, <kbd>Esc</kbd>, <kbd>Q</kbd> or "close replay" closes it.</p>
        <div class="cam-numbers">
          <label>Left <select data-swing="left"></select></label>
          <label>Right <select data-swing="right"></select></label>
        </div>
        <div class="cam-numbers">
          <label>Speed <select data-swing="speed">${SWING_SPEEDS.map((v) => `<option value="${v}">${SPEED_WORDS[v]}</option>`).join("")}</select></label>
          <label>Times round <input type="number" min="${LOOP_LIMITS.min}" max="${LOOP_LIMITS.max}" step="1" data-swing="loops"></label>
          <label>Where <select data-swing="place">${PLACES.map((v) => `<option value="${v}">${PLACE_WORDS[v]}${v === "full" ? "" : " (the ball in view)"}</option>`).join("")}</select></label>
        </div>
        <p class="small cam-swing-now"></p>
      </section>
      <section>
        <h3>Instant replay</h3>
        <label class="check"><input type="checkbox" data-set="replay"> A replay of every shot, from each camera with Replay ticked</label>
        <div class="cam-numbers">
          <label>Seconds before the shot <input type="number" min="${WINDOW_LIMITS.min}" max="${WINDOW_LIMITS.max}" step="0.5" data-set="preRoll"></label>
          <label>and after <input type="number" min="${WINDOW_LIMITS.min}" max="${WINDOW_LIMITS.max}" step="0.5" data-set="postRoll"></label>
        </div>
        <div class="cam-numbers">
          <label>Keep up to <input type="number" min="${LIMIT_GB.min}" max="${LIMIT_GB.max}" step="0.5" data-set="maxGB"> GB of saved clips</label>
          <label>and none older than <input type="number" min="1" max="3650" step="1" placeholder="any" data-set="maxDays"> days</label>
        </div>
        <p class="muted small">When the saved clips go over it, the oldest saved ones are deleted first. Each replay keeps two recordings going per camera, so it costs the graphics card some encoding: untick Replay on a camera to show it live only.</p>
        <p class="small cam-status"></p>
        <div class="buttons">${openReplays ? `<button data-act="saved">Every saved replay...</button>` : ""}${bridge?.openClipsFolder ? `<button data-act="folder">Open clips folder</button>` : ""}<button data-act="close" class="primary">Close (Esc)</button></div>
      </section>
    </div>`;
    document.body.appendChild(this.el);
    this.previews = new Map(); // deviceId -> MediaStream (unticked cameras' previews)
    this.el.addEventListener("click", (e) => {
      if (e.target === this.el) return this.show(false);
      const btn = e.target.closest("button");
      if (!btn) return;
      if (btn.dataset.act === "close") this.show(false);
      else if (btn.dataset.act === "look") this.look();
      else if (btn.dataset.act === "folder") this.bridge?.openClipsFolder?.();
      else if (btn.dataset.act === "saved") openReplays?.();
      else if (btn.dataset.retry != null) this.cameras.retry(btn.dataset.retry);
      else if (btn.dataset.turn != null) this.turn(Number(btn.dataset.turn));
      else if (btn.dataset.crop != null) this.editCrop(Number(btn.dataset.crop));
    });
    this.el.addEventListener("change", (e) => this.change(e.target));
    cameras.onChange(() => {
      if (!this.open) return;
      this.renderRows();
      this.renderSwing();
    });
  }

  get open() {
    return !this.el.hidden;
  }
  get doc() {
    return this.el.ownerDocument;
  }

  async show(on = !this.open) {
    this.el.hidden = !on;
    if (!on) {
      this.closeCrop();
      this.stopPreviews();
      if (this.el.contains(this.doc.activeElement)) this.doc.activeElement.blur();
      return;
    }
    this.renderSettings();
    this.el.querySelector(".cam-list").innerHTML = `<p class="muted">Looking for cameras...</p>`;
    this.el.querySelector("button").focus();
    await this.look();
    this.status();
  }

  // The devices listed again, asking for access first if their names are
  // hidden.
  async look() {
    const r = await this.cameras.unlockNames();
    this.problem = r.ok ? null : r.problem;
    this.renderRows();
  }

  // One row per video input, and one for any chosen camera that isn't
  // plugged in.
  renderRows() {
    const list = this.el.querySelector(".cam-list");
    const devices = this.cameras.devices;
    const cams = this.cameras.settings.cams;
    const rows = [];
    const shown = new Set();
    for (const d of devices) {
      const cam = cams.find((c) => c.on && c.deviceId === d.deviceId) ?? cams.find((c) => !c.on && (c.deviceId === d.deviceId || (d.label && c.label === d.label))) ?? null;
      if (cam) shown.add(cam.id);
      rows.push({ device: d, cam: cam && { ...cam } });
    }
    for (const cam of cams) if (cam.on && !shown.has(cam.id)) rows.push({ device: null, cam });
    if (!rows.length) {
      list.innerHTML = `<p class="muted">${this.problem ? `No cameras: ${esc(this.problem.text)}` : "No webcams found. Plug one in, then Look for cameras again."}</p>`;
      return;
    }
    const ticked = cams.filter((c) => c.on).length;
    list.innerHTML = rows
      .map(({ device, cam }, i) => {
        const on = !!cam?.on;
        const st = cam && on ? this.cameras.state(cam.id) : null;
        const label = device?.label || cam?.label || `Camera ${i + 1}`;
        const words = !device ? "not found - unplugged?" : st?.error ? st.error.text : st?.stream ? `showing ${st.actual}` : on ? "opening..." : "";
        const size = cam ? `${cam.width}x${cam.height}` : "1280x720";
        return `<div class="cam-row${on ? " on" : ""}" data-row="${i}">
          <div class="cam-preview"><video muted playsinline autoplay></video><span class="cam-preview-note"></span></div>
          <div class="cam-row-set">
            <label class="check"><input type="checkbox" data-use ${on ? "checked" : ""} ${!on && ticked >= MAX_CAMERAS ? "disabled" : ""}> <b>${esc(label)}</b></label>
            <label>Angle <input type="text" maxlength="40" data-name value="${esc(cam?.name ?? "")}" placeholder="Face on, Down the line..." ${on ? "" : "disabled"}></label>
            <label>Size <select data-size ${on ? "" : "disabled"}>${RESOLUTIONS.map((r) => `<option value="${r.w}x${r.h}" ${size === `${r.w}x${r.h}` ? "selected" : ""}>${r.name} (${r.w}x${r.h})</option>`).join("")}</select></label>
            <label>Frames <select data-fps ${on ? "" : "disabled"}>${FRAME_RATES.map((f) => `<option value="${f}" ${(cam?.fps ?? 60) === f ? "selected" : ""}>${f} a second${f === 60 ? " (if it can)" : ""}</option>`).join("")}</select></label>
            <label class="check"><input type="checkbox" data-rep ${cam?.replay !== false ? "checked" : ""} ${on ? "" : "disabled"}> Replay</label>
            <span class="cam-show" title="Where this camera's picture shows - either, both or neither (it records its replays all the same)">Show in <label class="check"><input type="checkbox" data-centre ${cam?.centre !== false ? "checked" : ""} ${on ? "" : "disabled"}> Command centre</label> <label class="check"><input type="checkbox" data-shotscreen ${cam?.shotScreen !== false ? "checked" : ""} ${on ? "" : "disabled"}> Shot screen</label></span>
            <div class="cam-view-set"><button data-turn="${i}" ${on ? "" : "disabled"} title="Turn the picture a quarter clockwise - for a camera mounted on its side or upside down">Turn ↻</button><button data-crop="${i}" ${on ? "" : "disabled"} title="Keep only part of the picture - everywhere it's shown and recorded">Crop...</button> <span class="small muted">${esc(viewWords(cam?.view))}</span></div>
            <p class="cam-row-state${st?.error ? " bad" : ""}">${esc(words)}${st?.error && cam ? ` <button data-retry="${esc(cam.id)}">Try again</button>` : ""}</p>
          </div>
        </div>`;
      })
      .join("");
    this.rows = rows;
    this.previewAll();
  }

  // Each row's live picture: a ticked camera's own stream; the others
  // opened small, only while the panel is open.
  async previewAll() {
    const rows = this.rows ?? [];
    const keep = new Set();
    for (const [i, { device, cam }] of rows.entries()) {
      const row = this.el.querySelector(`[data-row="${i}"]`);
      const v = row?.querySelector("video");
      const note = row?.querySelector(".cam-preview-note");
      if (!v) continue;
      if (cam?.on) {
        v.srcObject = this.cameras.state(cam.id).stream;
        // As it'll be shown: turned and cropped.
        showView(v, cam.view);
        continue;
      }
      if (!device) continue;
      keep.add(device.deviceId);
      let s = this.previews.get(device.deviceId);
      if (!s) {
        try {
          s = await this.cameras.media.getUserMedia(constraintsFor({ width: 640, height: 360, fps: 30 }, device.deviceId));
          if (!this.open) {
            for (const t of s.getTracks()) t.stop();
            return;
          }
          this.previews.set(device.deviceId, s);
        } catch (err) {
          if (note) note.textContent = cameraProblem(err).text;
          continue;
        }
      }
      v.srcObject = s;
    }
    for (const [id, s] of this.previews) {
      if (keep.has(id)) continue;
      for (const t of s.getTracks()) t.stop();
      this.previews.delete(id);
    }
  }

  // ---- Turning and cropping (sim/camview.mjs) ----------------------------------------

  // A quarter turn clockwise, the crop turned with it.
  turn(i) {
    const cam = this.rows?.[i]?.cam;
    if (!cam?.on) return;
    this.cameras.update(cam.id, { view: turned(cam.view) });
    this.renderRows();
  }

  // The crop drawn over the camera's whole (turned) picture: drag out the
  // part to keep, drag it to move it, a corner to size it; Keep it (Enter),
  // Whole picture, or Cancel (Esc).
  editCrop(i) {
    const cam = this.rows?.[i]?.cam;
    const stream = cam?.on ? this.cameras.state(cam.id).stream : null;
    if (!cam || !stream) return this.toast("Crop: the camera isn't showing a picture yet", 2500);
    this.closeCrop();
    const view = cleanView(cam.view);
    const el = this.doc.createElement("div");
    el.className = "cam-crop";
    el.innerHTML = `
      <div class="cam-crop-card">
        <h3>Crop: ${esc(cam.name)}</h3>
        <div class="cam-crop-stage"><video muted playsinline autoplay></video><div class="cam-crop-rect">${["tl", "tr", "bl", "br"].map((c) => `<span class="cam-crop-corner ${c}" data-corner="${c}"></span>`).join("")}</div></div>
        <p class="small muted">Drag over the part of the picture to keep - it's all that's shown in the boxes and replays and recorded. Drag the box to move it, a corner to size it.</p>
        <div class="buttons"><button data-crop-act="keep" class="primary">Keep it (Enter)</button><button data-crop-act="full">Whole picture</button><button data-crop-act="cancel">Cancel (Esc)</button></div>
      </div>`;
    this.el.appendChild(el);
    const video = el.querySelector("video");
    video.srcObject = stream;
    // The whole picture, turned as it will be.
    showView(video, { rotate: view.rotate, crop: FULL });
    this.crop = { el, cam, video, rotate: view.rotate, rect: { ...view.crop }, drag: null };
    const stage = el.querySelector(".cam-crop-stage");
    stage.addEventListener("pointerdown", (e) => this.cropDown(e));
    stage.addEventListener("pointermove", (e) => this.cropMove(e));
    stage.addEventListener("pointerup", () => (this.crop && (this.crop.drag = null)));
    stage.addEventListener("pointercancel", () => (this.crop && (this.crop.drag = null)));
    el.addEventListener("click", (e) => {
      const act = e.target.closest("button")?.dataset.cropAct;
      if (act) this.cropAct(act);
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.cropAct("keep");
      else if (e.key === "Escape") this.cropAct("cancel");
      else return;
      e.preventDefault();
      e.stopPropagation();
    });
    el.tabIndex = -1;
    el.focus();
    video.addEventListener("loadedmetadata", () => this.drawCrop());
    if (typeof ResizeObserver !== "undefined") {
      this.crop.observer = new ResizeObserver(() => this.drawCrop());
      this.crop.observer.observe(stage);
    }
    this.drawCrop();
  }

  // Where the turned picture sits in the stage: { x, y, w, h } pixels.
  cropFrame() {
    const c = this.crop;
    const stage = c.el.querySelector(".cam-crop-stage");
    const t = turnedSize(c.video.videoWidth || 16, c.video.videoHeight || 9, c.rotate);
    return containRect(t.w, t.h, stage.clientWidth, stage.clientHeight);
  }

  drawCrop() {
    const c = this.crop;
    if (!c) return;
    const f = this.cropFrame();
    Object.assign(c.el.querySelector(".cam-crop-rect").style, {
      left: `${f.x + c.rect.x * f.w}px`,
      top: `${f.y + c.rect.y * f.h}px`,
      width: `${c.rect.w * f.w}px`,
      height: `${c.rect.h * f.h}px`,
    });
  }

  // The pointer as shares of the turned picture.
  cropAt(e) {
    const f = this.cropFrame();
    const r = this.crop.el.querySelector(".cam-crop-stage").getBoundingClientRect();
    return [(e.clientX - r.left - f.x) / f.w, (e.clientY - r.top - f.y) / f.h];
  }

  cropDown(e) {
    const c = this.crop;
    if (!c || e.button !== 0) return;
    const [px, py] = this.cropAt(e);
    const corner = e.target.closest("[data-corner]")?.dataset.corner;
    // (With no crop yet the box is the whole picture: a drag in it draws one.)
    const whole = c.rect.w >= 0.999 && c.rect.h >= 0.999;
    if (corner) c.drag = { kind: "corner", fixed: fixedCorner(c.rect, corner) };
    else if (!whole && e.target.closest(".cam-crop-rect")) c.drag = { kind: "move", from: [px, py], start: { ...c.rect } };
    else c.drag = { kind: "draw", from: [px, py] };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // The drag still works inside the stage.
    }
    e.preventDefault();
  }

  cropMove(e) {
    const c = this.crop;
    const d = c?.drag;
    if (!d) return;
    const [px, py] = this.cropAt(e);
    if (d.kind === "draw") {
      if (Math.abs(px - d.from[0]) < 0.01 && Math.abs(py - d.from[1]) < 0.01) return;
      c.rect = cropFromPoints(d.from[0], d.from[1], px, py);
    } else if (d.kind === "move") c.rect = moveCrop(d.start, px - d.from[0], py - d.from[1]);
    else c.rect = cropFromPoints(d.fixed[0], d.fixed[1], px, py);
    this.drawCrop();
  }

  cropAct(act) {
    const c = this.crop;
    if (!c) return;
    if (act === "keep" || act === "full") {
      this.cameras.update(c.cam.id, { view: { rotate: c.rotate, crop: act === "full" ? { ...FULL } : c.rect } });
      this.toast(act === "full" ? `${c.cam.name}: the whole picture` : `${c.cam.name}: cropped`, 2000);
    }
    this.closeCrop();
    this.renderRows();
  }

  closeCrop() {
    const c = this.crop;
    if (!c) return;
    c.observer?.disconnect();
    c.video.srcObject = null;
    c.el.remove();
    this.crop = null;
  }

  stopPreviews() {
    for (const s of this.previews.values()) for (const t of s.getTracks()) t.stop();
    this.previews.clear();
    for (const v of this.el.querySelectorAll(".cam-list video")) v.srcObject = null;
  }

  async change(t) {
    const rowEl = t.closest?.("[data-row]");
    if (rowEl) {
      const { device, cam } = this.rows[Number(rowEl.dataset.row)];
      if (t.matches("[data-use]")) {
        if (t.checked && device) {
          // Its preview goes: the camera itself opens now.
          const s = this.previews.get(device.deviceId);
          if (s) for (const tr of s.getTracks()) tr.stop();
          this.previews.delete(device.deviceId);
          await this.cameras.add(device);
        } else if (cam) await this.cameras.remove(cam.id);
        this.renderRows();
        if (!this.separate() && t.checked) this.toast("Camera on - its box shows in the controls window: Shift + D for separate windows", 3500);
        return;
      }
      if (!cam) return;
      if (t.matches("[data-name]")) return this.cameras.update(cam.id, { name: t.value.trim() || cam.name });
      if (t.matches("[data-size]")) {
        const [w, h] = t.value.split("x").map(Number);
        return this.cameras.update(cam.id, { width: w, height: h });
      }
      if (t.matches("[data-fps]")) return this.cameras.update(cam.id, { fps: Number(t.value) });
      if (t.matches("[data-rep]")) return this.cameras.update(cam.id, { replay: t.checked });
      if (t.matches("[data-centre]")) return this.cameras.update(cam.id, { centre: t.checked });
      if (t.matches("[data-shotscreen]")) return this.cameras.update(cam.id, { shotScreen: t.checked });
      return;
    }
    if (t.dataset?.swing) return this.changeSwing(t);
    const key = t.dataset?.set;
    if (key === "replay") return this.cameras.setReplay(t.checked);
    if (key === "preRoll" || key === "postRoll") {
      this.replay.setWindow({ [key]: Number(t.value) });
      return this.renderSettings();
    }
    if (key === "maxGB") {
      // 1 - 500 GB, and asked first if it would delete saved clips now.
      const win = this.doc.defaultView;
      const r = await changeLimit("clips", t.value, { confirm: (q) => win.confirm(q), toast: this.toast });
      if (r) this.retention = r.retention;
      else t.value = String(this.retention?.maxGB ?? "");
      return this.status();
    }
    if (key === "maxDays") {
      const body = { ...(this.retention ?? {}), [key]: t.value === "" ? null : Number(t.value) };
      try {
        const res = await fetch("/api/clips/retention", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const r = await res.json();
        this.retention = r.retention;
        if (r.deleted?.length) this.toast(`${r.deleted.length} old clip${r.deleted.length === 1 ? "" : "s"} deleted to fit`, 2500);
      } catch {
        this.toast("Couldn't change the clips' allowance - is the server running?", 2500);
      }
      this.renderSettings();
      this.status();
    }
  }

  // The swing replay's settings changed in the panel.
  changeSwing(t) {
    const k = t.dataset.swing;
    if (k === "left" || k === "right") {
      const left = k === "left" ? t.value : this.el.querySelector('[data-swing="left"]').value;
      const right = k === "right" ? t.value : this.el.querySelector('[data-swing="right"]').value;
      this.cameras.setSwing({ cams: left ? [left, ...(right && right !== left ? [right] : [])] : null });
    } else if (k === "speed") this.cameras.setSwing({ speed: Number(t.value) });
    else if (k === "loops") this.cameras.setSwing({ loops: Number(t.value) });
    else if (k === "place") this.cameras.setSwing({ place: t.value });
    this.renderSwing();
  }

  // Which cameras it shows (a choice for each side: automatic is the first
  // one or two with Replay on), and what that comes to now.
  renderSwing() {
    const sw = this.cameras.settings.swing;
    const cams = this.cameras.cams;
    const opt = (c, sel) => `<option value="${esc(c.id)}" ${sel ? "selected" : ""} ${c.replay ? "" : "disabled"}>${esc(c.name)}${c.replay ? "" : " (Replay off)"}</option>`;
    const [left, right] = sw.cams ?? [];
    const leftEl = this.el.querySelector('[data-swing="left"]');
    const rightEl = this.el.querySelector('[data-swing="right"]');
    if (this.doc.activeElement !== leftEl) leftEl.innerHTML = `<option value="" ${left ? "" : "selected"}>Automatic</option>${cams.map((c) => opt(c, c.id === left)).join("")}`;
    if (this.doc.activeElement !== rightEl) rightEl.innerHTML = `<option value="" ${right ? "" : "selected"}>${left ? "None" : "Automatic"}</option>${cams.map((c) => opt(c, c.id === right)).join("")}`;
    rightEl.disabled = !left;
    const set = (k, v) => {
      const el = this.el.querySelector(`[data-swing="${k}"]`);
      if (el && this.doc.activeElement !== el) el.value = String(v);
    };
    set("speed", sw.speed);
    set("loops", sw.loops);
    set("place", sw.place);
    const pick = pickReplayCams(cams, sw, { replayOn: this.cameras.settings.replay });
    const now = this.el.querySelector(".cam-swing-now");
    now.classList.toggle("bad", !pick.length);
    now.textContent = !this.cameras.settings.replay
      ? "Replays are off (below), so there's no swing replay."
      : !pick.length
        ? "No camera with Replay ticked: tick one above to show its replay."
        : `Shows ${pick.length === 1 ? pick[0].name : `${pick[0].name} on the left, ${pick[1].name} on the right, in step`}${sw.cams ? "" : " (automatic: the first with Replay ticked)"}.`;
  }

  renderSettings() {
    const set = (k, v) => {
      const el = this.el.querySelector(`[data-set="${k}"]`);
      if (!el || this.doc.activeElement === el) return;
      if (el.type === "checkbox") el.checked = !!v;
      else el.value = v == null ? "" : String(v);
    };
    set("replay", this.cameras.settings.replay);
    this.renderSwing();
    set("preRoll", this.replay.window.preRoll);
    set("postRoll", this.replay.window.postRoll);
    if (this.retention) {
      set("maxGB", this.retention.maxGB);
      set("maxDays", this.retention.maxDays);
    }
  }

  // How many recorders are running and how much is kept.
  async status() {
    const el = this.el.querySelector(".cam-status");
    let kept = "";
    try {
      const s = await (await fetch("/api/clips")).json();
      this.retention = s.retention;
      this.renderSettings();
      const saved = s.saved ?? 0;
      kept = `${saved} saved clip${saved === 1 ? "" : "s"}, ${(s.bytes / 1e6).toFixed(s.bytes < 1e8 ? 1 : 0)} MB of ${s.retention?.maxGB ?? 5} GB`;
    } catch {
      kept = "";
    }
    const n = this.replay.activeRecorders();
    const running = !this.replay.supported ? "Replays can't be recorded here (no MediaRecorder)" : n ? `${n} replay recording${n === 1 ? "" : "s"} running (${this.replay.type.ext.toUpperCase()})` : "No replays recording";
    el.textContent = [running, kept].filter(Boolean).join(" · ");
  }

  // While it's open the panel has the keyboard: Esc closes it, and every
  // other key is left to its boxes (typing a name, Tab round the controls).
  key(e) {
    if (!this.open) return false;
    if (e.key === "Escape") {
      e.preventDefault();
      this.show(false);
    }
    return true;
  }
}
