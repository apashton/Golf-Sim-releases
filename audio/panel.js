// The Sound panel: sound on and off, the volumes, the club strike and the
// celebrations, each background layer and how many birds, a button to hear
// each kind of sound, and the owner's own recordings. Opened from the
// speaker button in the top bar or with Shift + A (so it works in bay view
// too); A turns sound on and off anywhere. It works from the keyboard: Tab
// from control to control, the arrows move a slider, Space ticks a box or
// presses a button. Every change is remembered (engine.js keeps the settings).

import { FAMILY_NAMES, SOUND_FAMILIES, SOUND_TYPE_LIST } from "./families.mjs";
import { esc } from "../util.js";

const SPEAKER_ON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>`;
const SPEAKER_OFF = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.6 3 2.7-2.7-1.4-1.4-2.7 2.7-2.7-2.7-1.4 1.4 2.7 2.7-2.7 2.7 1.4 1.4 2.7-2.7 2.7 2.7 1.4-1.4z"/></svg>`;

export class SoundPanel {
  // engine: the sound engine. bridge: the Windows app's (to open the sounds
  // folder), or null in a browser. button: the top bar's speaker. toggle:
  // what A does (sound on and off, and saying so). toast: to say something
  // briefly (a sound that can't be heard, and why).
  constructor(engine, { bridge = null, button = null, toggle = null, toast = () => {} } = {}) {
    this.engine = engine;
    this.bridge = bridge;
    this.button = button;
    this.toggle = toggle ?? (() => engine.toggle());
    this.toast = toast;
    this.el = document.createElement("div");
    this.el.className = "bay-help sound-panel";
    this.el.hidden = true;
    this.el.innerHTML = `<div class="bay-help-box sound-box">
      <h2>Sound</h2>
      <label class="check sound-on"><input type="checkbox" data-set="on"> Sound on <kbd>A</kbd></label>
      <section>
        <label class="slider">Volume <input type="range" min="0" max="1" step="0.05" data-set="master"></label>
        <label class="slider">Shots <small>strike, landing, cup, tee-up, celebrations</small> <input type="range" min="0" max="1" step="0.05" data-set="effects"></label>
        <label class="check mute"><input type="checkbox" data-set="effectsMute"> Mute the shots <small class="muted">the slider stays where it is</small></label>
        <label class="slider">Background <small>wind, birds, water, rain</small> <input type="range" min="0" max="1" step="0.05" data-set="ambience"></label>
        <label class="check mute"><input type="checkbox" data-set="ambienceMute"> Mute the background <small class="muted">birds and all - for recording a swing video</small></label>
        <label class="check"><input type="checkbox" data-set="strike"> Club strike sound <small class="muted">off to begin with: at the mat you hear your own club</small></label>
        <label class="check"><input type="checkbox" data-set="celebrations"> Celebrations <small class="muted">fanfares and chimes for a hole's score</small></label>
      </section>
      <section>
        <h3>Background</h3>
        <label class="check"><input type="checkbox" data-set="wind"> Wind</label>
        <label class="check"><input type="checkbox" data-set="outdoor"> Distant outdoors <small class="muted">a quiet bed under the wind, from a recording</small></label>
        <label class="check"><input type="checkbox" data-set="birds"> Birds</label>
        <label class="slider">How many birds <small>few - lots</small> <input type="range" min="0" max="1" step="0.05" data-set="birdDensity"></label>
        <label class="check"><input type="checkbox" data-set="water"> Water, near ponds and streams</label>
        <label class="check"><input type="checkbox" data-set="rain"> Rain, when it rains</label>
      </section>
      <section>
        <h3>Hear them</h3>
        <div class="buttons">
          ${[["driver", "Driver"], ["iron", "Iron"], ["wedge", "Wedge"], ["putt", "Putt"], ["land", "Landing"], ["splash", "Splash"], ["cup", "In the cup"], ["tee", "Tee-up"], ["tree", "Into a tree"], ["bird", "A bird"], ["duck", "Ducks and swans"]]
            .map(([k, name]) => `<button data-try="${k}">${name}</button>`)
            .join("")}
        </div>
      </section>
      <section>
        <h3>Recordings</h3>
        <p class="small" data-recordings></p>
        <div class="radios" role="radiogroup" aria-label="Recordings">
          <label class="check"><input type="radio" name="sound-recordings" data-set="recordings" value="only"> Recordings - the game's and yours - wherever there are some, a different one each time</label>
          <label class="check"><input type="radio" name="sound-recordings" data-set="recordings" value="mixed"> Mixed in with sounds the game makes up</label>
          <label class="check"><input type="radio" name="sound-recordings" data-set="recordings" value="made"> None - every sound made up by the game</label>
        </div>
        <div class="buttons">
          ${bridge?.openSoundsFolder ? `<button data-act="folder">Open sounds folder</button>` : ""}
          <button data-act="reload">Look for new recordings</button>
        </div>
      </section>
      <p class="muted small"><kbd>A</kbd> sound on / off - <kbd>Tab</kbd> next, <kbd>← →</kbd> slider, <kbd>Space</kbd> tick or press - <kbd>Esc</kbd> or <kbd>Shift + A</kbd> closes</p>
    </div>`;
    document.body.appendChild(this.el);
    this.el.addEventListener("click", (e) => {
      if (e.target === this.el) this.show(false);
    });
    const box = this.el.querySelector(".sound-box");
    // Sliders as they move; boxes once ticked.
    box.addEventListener("input", (e) => e.target.type === "range" && this.change(e.target));
    box.addEventListener("change", (e) => ["checkbox", "radio"].includes(e.target.type) && this.change(e.target));
    box.addEventListener("click", (e) => this.click(e));
    button?.addEventListener("click", () => {
      this.show(true);
      button.blur();
    });
    engine.watch(() => this.render());
    this.render();
  }

  get open() {
    return !this.el.hidden;
  }

  // The page it's on: the sim's, or the controls window's when the screens
  // are separate (app.js moves it there).
  get doc() {
    return this.el.ownerDocument;
  }

  show(on = !this.open) {
    this.el.hidden = !on;
    if (on) {
      this.render();
      // Ready for the keyboard: on the first control.
      this.first().focus();
      return;
    }
    if (this.el.contains(this.doc.activeElement)) this.doc.activeElement.blur();
    // Opened from the menu: back to it (app.js sets this).
    const back = this.onClose;
    this.onClose = null;
    back?.();
  }

  first() {
    return this.el.querySelector("input, button");
  }

  // A key pressed while the panel is open (app.js asks first, whatever has
  // the keyboard). Esc and Shift + A close it, A turns sound on and off;
  // Tab, the arrows, Space, Enter, Home and End do what they always do to
  // the control that has the keyboard. True when the key was the panel's.
  // Any other key (a letter or number, a clicker's Page Up / Down) closes
  // the panel and goes on to do its usual job: false.
  key(e) {
    if (!this.open) return false;
    const k = e.key;
    const plain = !e.ctrlKey && !e.metaKey && !e.altKey;
    if (k === "Escape" || (plain && e.shiftKey && k.toLowerCase() === "a")) {
      e.preventDefault();
      this.show(false);
      return true;
    }
    if (plain && k.toLowerCase() === "a") {
      e.preventDefault();
      this.toggle();
      return true;
    }
    // Tab goes round the controls, and back into the panel if the keyboard
    // was somewhere else (a click outside them).
    if (k === "Tab") {
      const all = [...this.el.querySelectorAll("input, button")];
      const i = all.indexOf(this.doc.activeElement);
      const to = i < 0 ? all[0] : e.shiftKey && i === 0 ? all.at(-1) : !e.shiftKey && i === all.length - 1 ? all[0] : null;
      if (to) {
        e.preventDefault();
        to.focus();
        to.scrollIntoView({ block: "nearest" });
      }
      return true;
    }
    const passOn = plain && (k === "PageUp" || k === "PageDown" || (k.length === 1 && k !== " "));
    if (!passOn) return true;
    this.show(false);
    return false;
  }

  change(t) {
    const key = t.dataset?.set;
    if (!key) return;
    this.engine.set(key, t.type === "checkbox" ? t.checked : t.type === "radio" ? t.value : Number(t.value));
  }

  click(e) {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.try) {
      const s = this.engine.settings;
      if (!s.on) return this.toast("Sound is off - A turns it on");
      // The first press may be what lets the browser make sound at all.
      this.engine.unlock();
      if (!this.engine.demo(t.dataset.try)) return this.toast(this.engine.failed ? "No sound on this computer" : "Sound hasn't started yet - try again");
      const bg = t.dataset.try === "bird";
      const struck = ["driver", "iron", "wedge", "putt"].includes(t.dataset.try);
      if (s.master === 0 || (bg ? s.ambience : s.effects) === 0) this.toast(`The ${s.master === 0 ? "Volume" : bg ? "Background" : "Shots"} slider is right down`);
      else if (bg && !s.birds) this.toast("Birds are off in the game - this one's just to hear");
      else if (struck && !s.strike) this.toast("The club strike sound is off in the game - this one's just to hear");
    }
    if (t.dataset.act === "folder") this.bridge?.openSoundsFolder?.();
    if (t.dataset.act === "reload") this.engine.recordings.refresh();
  }

  render() {
    const s = this.engine.settings;
    for (const input of this.el.querySelectorAll("[data-set]")) {
      const v = s[input.dataset.set];
      if (input.type === "checkbox") input.checked = !!v;
      else if (input.type === "radio") input.checked = input.value === v;
      else if (this.doc.activeElement !== input) input.value = String(v);
    }
    // The background controls only matter with sound on.
    for (const el of this.el.querySelectorAll("section")) el.classList.toggle("off", !s.on);
    this.renderRecordings();
    if (this.button) {
      this.button.className = `sound ${s.on ? "on" : "off"}`;
      this.button.innerHTML = s.on ? SPEAKER_ON : SPEAKER_OFF;
      this.button.setAttribute("aria-label", `Sound: ${s.on ? "on" : "off"}`);
      this.button.title = `Sound: ${s.on ? "on" : "off"} - volumes, wind, birds, water, rain (Shift + A)\nA turns sound on and off`;
    }
  }

  renderRecordings() {
    const el = this.el.querySelector("[data-recordings]");
    const rec = this.engine.recordings;
    const where = rec.dir ? `<br><span class="muted">Add your own in ${esc(rec.dir)}, a folder for each: ${FAMILY_NAMES.map(esc).join(", ")}. ${esc(SOUND_TYPE_LIST)} files.</span>` : "";
    if (!this.engine.settings.on) {
      el.innerHTML = `<span class="muted">Turn sound on (A) to look for them.</span>`;
      return;
    }
    if (!this.engine.ctx) {
      el.innerHTML = `<span class="muted">Found once sound has started (press any key).</span>`;
      return;
    }
    if (rec.loading) {
      el.innerHTML = `<span class="muted">Looking for your recordings...</span>${where}`;
      return;
    }
    const kinds = FAMILY_NAMES.filter((f) => rec.count(f) > 0);
    const own = FAMILY_NAMES.reduce((n, f) => n + rec.ownCount(f), 0);
    const found = kinds.length
      ? `${rec.total} in use${own ? ` (${own} of them yours)` : ""}: ${kinds.map((f) => `${esc(SOUND_FAMILIES[f].toLowerCase().replace(/ \(.*$/, ""))} (${rec.count(f)})`).join(", ")}. Every other sound is made up by the game.`
      : "None yet - every sound is made up by the game.";
    const bad = rec.failed.length ? `<br><span class="warn">Couldn't play: ${rec.failed.slice(0, 6).map(esc).join(", ")}${rec.failed.length > 6 ? "..." : ""}</span>` : "";
    const skipped = rec.skipped ?? [];
    const unused = skipped.length
      ? `<br><span class="warn">Not used: ${skipped
          .slice(0, 6)
          .map((x) => `${esc(x.file)} - ${esc(x.why)}`)
          .join("; ")}${skipped.length > 6 ? ` (and ${skipped.length - 6} more)` : ""}</span>`
      : "";
    el.innerHTML = `${found}${bad}${unused}${where}`;
  }
}
