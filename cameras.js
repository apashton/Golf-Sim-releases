// The webcams: which the owner has chosen (the Cameras panel,
// camerapanel.js), opening each one and keeping its MediaStream, and
// saying plainly when one can't be opened - on Windows usually because
// another program has it, since a webcam opens in one program at a time.
//
// Everything that shows or records a camera takes its stream from here:
// the controls window's camera boxes (camerabox.js), the instant replays
// (replay.js), and in phase 2 the recorder. Nothing else calls
// getUserMedia for a chosen camera, so each is opened once however many
// things use it. The rules - matching a camera by deviceId or label, the
// constraints, the words for an error - are sim/cameras.mjs's.
//
// Nothing is opened until a camera is chosen: with none, this does nothing
// at all.

import { cleanCameraSettings, matchAll, constraintsFor, cameraProblem, micProblem, matchMic, describeTrack, newCameraId, defaultName } from "./sim/cameras.mjs";
import { loadSetting, saveSetting } from "./util.js";

export class CameraManager {
  constructor({ media = globalThis.navigator?.mediaDevices ?? null } = {}) {
    this.media = media;
    this.settings = cleanCameraSettings(loadSetting("cameras", {}));
    // cam.id -> { stream, device, error: { code, text } | null, actual }
    this.live = new Map();
    this.devices = [];
    this.listeners = new Set();
    this.applying = null;
    this.media?.addEventListener?.("devicechange", () => this.devicesChanged());
  }

  get supported() {
    return !!this.media?.getUserMedia;
  }

  // The cameras in use (ticked), in order.
  get cams() {
    return this.settings.cams.filter((c) => c.on);
  }

  // Told whenever a camera opens, closes or fails, or the choice changes.
  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  changed() {
    for (const fn of this.listeners) {
      try {
        fn(this);
      } catch (err) {
        console.error("A camera listener failed:", err);
      }
    }
  }

  save() {
    this.settings = cleanCameraSettings(this.settings);
    saveSetting("cameras", this.settings);
  }

  // The video inputs present. Their names only come once camera access has
  // been allowed; before that they're blank.
  async listDevices() {
    if (!this.media?.enumerateDevices) return [];
    try {
      this.devices = (await this.media.enumerateDevices()).filter((d) => d.kind === "videoinput");
    } catch {
      this.devices = [];
    }
    return this.devices;
  }

  // Asks for camera access once, so the devices have their names (Windows
  // and Chromium hide them until then). Opens the default camera for a
  // moment; one another program holds says so rather than failing the list.
  async unlockNames() {
    if (!this.supported) return { ok: false, problem: cameraProblem({ name: "unsupported" }) };
    const have = await this.listDevices();
    if (have.some((d) => d.label)) return { ok: true };
    try {
      const s = await this.media.getUserMedia({ video: true, audio: false });
      for (const t of s.getTracks()) t.stop();
      await this.listDevices();
      return { ok: true };
    } catch (err) {
      await this.listDevices();
      return { ok: false, problem: cameraProblem(err) };
    }
  }

  // A camera's state now: { cam, stream, error, actual } (actual: what it's
  // really giving, "1280x720 at 30 fps").
  state(id) {
    const cam = this.settings.cams.find((c) => c.id === id) ?? null;
    const l = this.live.get(id);
    return { cam, stream: l?.stream ?? null, error: l?.error ?? null, actual: l?.actual ?? "", settings: l?.settings ?? null };
  }

  // Every ticked camera opened (and the rest closed). One that fails is
  // left with its reason; the others open regardless. Only one of these
  // runs at a time; asked again meanwhile, it runs once more after.
  apply() {
    if (this.applying) {
      this.again = true;
      return this.applying;
    }
    this.applying = this.#apply().finally(() => {
      this.applying = null;
      if (this.again) {
        this.again = false;
        this.apply();
      }
    });
    return this.applying;
  }

  async #apply() {
    const want = this.cams;
    // Closed: anything no longer ticked.
    for (const id of [...this.live.keys()]) if (!want.some((c) => c.id === id)) this.#close(id);
    if (!want.length) return this.changed();
    if (!this.supported) {
      for (const cam of want) this.live.set(cam.id, { stream: null, error: cameraProblem({ name: "unsupported" }) });
      return this.changed();
    }
    await this.listDevices();
    // Without names yet, a camera remembered by its label alone can't be
    // found: ask once.
    if (!this.devices.some((d) => d.label) && want.some((c) => !this.devices.some((d) => d.deviceId === c.deviceId))) await this.unlockNames();
    const matched = matchAll(want, this.devices);
    let moved = false;
    for (const cam of want) {
      const device = matched.get(cam.id) ?? null;
      const l = this.live.get(cam.id);
      // Already open on the right device, at the size asked: left alone.
      if (l?.stream && l.device?.deviceId === device?.deviceId && l.key === key(cam) && l.stream.getVideoTracks().some((t) => t.readyState === "live")) continue;
      this.#close(cam.id);
      if (!device) {
        this.live.set(cam.id, { stream: null, device: null, error: cameraProblem({ name: "NotFoundError" }) });
        continue;
      }
      // Found by its label under a new deviceId: remembered under that now.
      if (device.deviceId !== cam.deviceId || (device.label && device.label !== cam.label)) {
        cam.deviceId = device.deviceId;
        if (device.label) cam.label = device.label;
        moved = true;
      }
      try {
        const stream = await this.media.getUserMedia(constraintsFor(cam, device.deviceId));
        const track = stream.getVideoTracks()[0];
        const settings = track?.getSettings?.() ?? {};
        // Unplugged while in use: said, and tried again when it's back.
        track?.addEventListener("ended", () => {
          const now = this.live.get(cam.id);
          if (now?.stream !== stream) return;
          this.live.set(cam.id, { stream: null, device, error: { code: "gone", text: "stopped - unplugged, or taken by another program?" } });
          this.changed();
        });
        this.live.set(cam.id, { stream, device, error: null, key: key(cam), settings, actual: describeTrack(settings) });
      } catch (err) {
        this.live.set(cam.id, { stream: null, device, error: cameraProblem(err) });
      }
    }
    if (moved) this.save();
    this.changed();
  }

  #close(id) {
    const l = this.live.get(id);
    if (l?.stream) for (const t of l.stream.getTracks()) t.stop();
    this.live.delete(id);
  }

  // A camera plugged in or out: any that failed or went are tried again.
  devicesChanged() {
    if (!this.cams.length) return;
    clearTimeout(this.deviceTimer);
    this.deviceTimer = setTimeout(() => this.apply(), 800);
  }

  // Try again: a camera that failed (the program holding it closed now,
  // say) is opened afresh.
  retry(id = null) {
    for (const cam of this.cams) if (!id || cam.id === id) if (!this.live.get(cam.id)?.stream) this.live.delete(cam.id);
    return this.apply();
  }

  // ---- Changing the choice (the Cameras panel) ----------------------------------

  // A device ticked: a camera for it, named after the next usual angle.
  add(device) {
    const cams = this.settings.cams;
    const found = cams.find((c) => c.deviceId === device.deviceId || (device.label && c.label === device.label && !c.on));
    if (found) {
      found.on = true;
      found.deviceId = device.deviceId;
    } else {
      cams.push({ id: newCameraId(cams), deviceId: device.deviceId, label: device.label ?? "", name: defaultName(cams), on: true });
    }
    this.save();
    return this.apply();
  }

  // Unticked: closed, but its name and size kept for when it's ticked again.
  remove(id) {
    const cam = this.settings.cams.find((c) => c.id === id);
    if (cam) cam.on = false;
    this.save();
    return this.apply();
  }

  // A camera's name, size, rate or replay changed.
  update(id, patch) {
    const cam = this.settings.cams.find((c) => c.id === id);
    if (!cam) return Promise.resolve();
    Object.assign(cam, patch);
    this.save();
    // A new name or replay setting needs nothing reopened; a new size does.
    if ("width" in patch || "fps" in patch) return this.apply();
    this.changed();
    return Promise.resolve();
  }

  setReplay(on) {
    this.settings.replay = !!on;
    this.save();
    this.changed();
  }

  // The swing replay on the game window: which one or two cameras (left,
  // right; null for automatic), its speed, times round and place
  // (sim/swingreplay.mjs cleans it).
  setSwing(patch) {
    this.settings.swing = { ...this.settings.swing, ...patch };
    this.save();
  }

  // ---- The microphone (the recorder's) ---------------------------------------------------

  // The audio inputs present (names once access has been allowed).
  async listMics() {
    if (!this.media?.enumerateDevices) return [];
    try {
      return (await this.media.enumerateDevices()).filter((d) => d.kind === "audioinput" && d.deviceId !== "communications");
    } catch {
      return [];
    }
  }

  // The microphone chosen ({ deviceId, label }), or none (null). Kept by
  // its deviceId and found again by its name, like a camera. A change
  // closes the one open; the recorder opens the new one when it needs it.
  setMic(device) {
    this.settings.mic = device ? { deviceId: device.deviceId ?? "", label: device.label ?? "" } : null;
    this.save();
    this.closeMic();
    this.changed();
  }

  // The chosen microphone's stream, opened once however many ask (the
  // recorder, the panel's level). Null with none chosen; when it can't be
  // opened, null with micError saying why - on Windows another program can
  // hold a microphone too. Opened raw: no echo cancelling or noise gate, which
  // would pump the game's own sound.
  async micStream() {
    const mic = this.settings.mic;
    if (!mic || !this.supported) return null;
    if (this.mic?.stream && this.mic.stream.getAudioTracks().some((t) => t.readyState === "live")) return this.mic.stream;
    if (this.micOpening) return this.micOpening;
    this.micOpening = (async () => {
      const devices = await this.listMics();
      const device = matchMic(mic, devices);
      if (!device) {
        this.mic = { stream: null, error: cameraProblem({ name: "NotFoundError" }) };
        return null;
      }
      try {
        const stream = await this.media.getUserMedia({ video: false, audio: { deviceId: { exact: device.deviceId }, echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
        if (device.deviceId !== mic.deviceId || (device.label && device.label !== mic.label)) {
          this.settings.mic = { deviceId: device.deviceId, label: device.label || mic.label };
          this.save();
        }
        this.mic = { stream, error: null, label: device.label };
        return stream;
      } catch (err) {
        this.mic = { stream: null, error: micProblem(err) };
        return null;
      } finally {
        this.changed();
      }
    })().finally(() => (this.micOpening = null));
    return this.micOpening;
  }

  get micError() {
    return this.mic?.error ?? null;
  }

  closeMic() {
    for (const t of this.mic?.stream?.getTracks() ?? []) t.stop();
    this.mic = null;
  }
}

// What a camera was opened with: a change reopens it.
const key = (cam) => `${cam.width}x${cam.height}@${cam.fps}`;
