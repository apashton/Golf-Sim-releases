// The Android app's play mode in the page (sim/playmode.mjs): the touch
// screen or a launch monitor - kept, put in force as the game starts (the
// swing pad on for the touch screen; the Omni looked for only with a launch
// monitor, through the pocket server: POST /api/omni-search), and the top
// bar's words on the touch screen. Only in the app (public/pocket/start.js
// sets window.pocket before anything else); on a PC nothing here acts.

import { loadSetting, saveSetting } from "../util.js";
import { cleanPlayMode, playModeEffects, touchStatus, DEFAULT_PLAY_MODE } from "../sim/playmode.mjs";

const postSearch = (on) =>
  fetch("/api/omni-search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ on }) }).catch(() => {});

export class PlayMode {
  // setSwingPad(on): the swing pad (app.js setMouseSwing). onChange(mode):
  // it changed (the menu, the welcome screen and the top bar follow).
  constructor({ inApp = typeof window !== "undefined" && !!window.pocket, setSwingPad = () => {}, onChange = () => {}, search = postSearch } = {}) {
    this.inApp = inApp;
    this.setSwingPad = setSwingPad;
    this.onChange = onChange;
    this.search = search;
    this.mode = cleanPlayMode(loadSetting("playMode", DEFAULT_PLAY_MODE));
  }

  // Whether it's been kept (chosen, or left as it was on the welcome).
  get kept() {
    return loadSetting("playMode", null) != null;
  }
  keep() {
    if (this.inApp) saveSetting("playMode", this.mode);
  }

  // As the game starts: the kept mode in force.
  start() {
    if (this.inApp) this.apply(false);
  }

  // Chosen (the welcome screen, the menu): kept, and in force at once.
  set(next) {
    if (!this.inApp) return;
    this.mode = cleanPlayMode(next);
    saveSetting("playMode", this.mode);
    this.apply(true);
    this.onChange(this.mode);
  }

  apply(chosen) {
    const fx = playModeEffects(this.mode, { chosen });
    if (fx.swingPad !== null) this.setSwingPad(fx.swingPad);
    this.search(fx.omniSearch);
  }

  get touch() {
    return this.inApp && this.mode === "touch";
  }

  // The top bar's words instead of "waiting for the launch monitor", on
  // the touch screen (null otherwise).
  status(s) {
    return this.inApp ? touchStatus(this.mode, s) : null;
  }
}
