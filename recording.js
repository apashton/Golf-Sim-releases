// The recording switch, on the page: practice, round, experimental or off
// (the rules are in sim/recording.mjs). It's the drop-down in the top bar
// next to Hitting - which goes to the controls window with the rest of the
// top bar when the screens are separate - and the menu's Play page
// buttons, Shift + R, and golfsim.setRecording() for a voice command.
//
// Whenever it isn't practice it's hard to miss: the top bar shows it as a
// coloured badge ("Round", "Experimental", "Not recording" - on practice it's
// just a small green recording light, as the top bar is full at 1280 px),
// bay view and the game window say it in a big line over the picture ("NOT
// RECORDING", "EXPERIMENTAL", "ROUND"), and every change says so in a toast.
// The badge is the face of a drop-down laid invisibly over it, so a click
// opens the list, with every format's full name. It's kept through a reload
// or a restart, but a new day's first session goes back to practice,
// saying so.

import { FORMATS, FORMAT_NAMES, parseRecording, nextFormat, shotFormat, recCode, bayLine, formatToast, staleFormat, RECORDING_KEY } from "./sim/recording.mjs";
import { loadSetting, saveSetting } from "./util.js";

export class RecordingSwitch {
  // select: the top bar's drop-down. toast(text, ms). bay: the BayView, for
  // its line over the picture. mode(): the mode being played.
  constructor({ select, toast = () => {}, bay = null, mode = () => "range" }) {
    this.select = select;
    this.toast = toast;
    this.bay = bay;
    this.mode = mode;
    this.saved = loadSetting("recording", { format: "practice", at: 0 });
    if (!FORMATS.includes(this.saved.format)) this.saved = { format: "practice", at: 0 };
    // Called with the format whenever it changes (the menu shows it,
    // the special-shot mark is dropped when recording stops).
    this.listeners = [];
    if (select) {
      select.innerHTML = FORMATS.map((f) => `<option value="${f}">${FORMAT_NAMES[f]}</option>`).join("");
      select.addEventListener("change", () => this.set(select.value));
    }
    // A day that ended with something other than practice: this one starts
    // with it again.
    this.checkDay();
    // And the display follows if A-Squared Golf is left running overnight.
    setInterval(() => this.checkDay(), 5 * 60 * 1000);
    this.render();
  }

  get format() {
    return this.saved.format;
  }

  onChange(fn) {
    this.listeners.push(fn);
  }

  // Back to practice if the chosen format has had its day. True when it was.
  checkDay(now = Date.now()) {
    if (!staleFormat(this.saved, now)) return false;
    const was = this.saved.format;
    this.save("practice", now);
    this.toast(`A new day: recording is back to Practice (it was ${FORMAT_NAMES[was]}) - ${RECORDING_KEY} to change`, 5000);
    this.changed();
    return true;
  }

  // Changes it: a format, or words for one ("stop recording"). False when it
  // isn't one. quiet: no toast.
  set(value, { quiet = false } = {}) {
    const f = parseRecording(value);
    if (!f) {
      this.render();
      return false;
    }
    const same = f === this.saved.format;
    this.save(f);
    if (!quiet) this.toast(formatToast(f), 3500);
    if (!same) this.changed();
    else this.render();
    return true;
  }

  // Shift + R: on to the next one.
  cycle() {
    return this.set(nextFormat(this.saved.format));
  }

  save(format, now = Date.now()) {
    this.saved = { format, at: now };
    saveSetting("recording", this.saved);
  }

  changed() {
    this.render();
    for (const fn of this.listeners) fn(this.saved.format);
  }

  // The format a shot hit now in `mode` is recorded as ("off": not at all).
  // Also keeps the chosen format fresh, so a session going on past midnight
  // keeps it.
  formatFor(mode) {
    this.checkDay();
    if (this.saved.format !== "practice") this.save(this.saved.format);
    return shotFormat(this.saved.format, mode);
  }
  // What a shot or game line carries for it: "r", "x" or nothing.
  recFor(mode) {
    return recCode(this.formatFor(mode));
  }

  // The drop-down and the line over the picture, for the mode now: on a
  // course, practice reads "Round (course)", as a course round is always
  // round play.
  render() {
    const mode = this.mode();
    const f = this.saved.format;
    const sel = this.select;
    if (sel) {
      const practice = sel.querySelector('option[value="practice"]');
      if (practice) practice.textContent = mode === "course" ? "Round (course)" : FORMAT_NAMES.practice;
      sel.value = f;
      const wrap = sel.closest("label");
      if (wrap) wrap.className = `rec-${f}`;
      const face = wrap?.querySelector(".rec-face");
      if (face) face.innerHTML = f === "practice" ? `<span class="rec-word">${mode === "course" ? "Round" : FORMAT_NAMES.practice}</span>` : FORMAT_NAMES[f];
      const words = {
        practice: mode === "course" ? "a course round is recorded as round play" : "every shot is recorded and counted",
        round: "recorded and counted, kept as round play",
        experimental: "recorded and kept, but out of every number, tip and club check",
        off: "nothing is recorded - shots still fly and games still score",
      }[f];
      if (wrap) wrap.title = `Recording: ${FORMAT_NAMES[f]} - ${words}. Back to Practice each new day (${RECORDING_KEY})`;
    }
    this.bay?.setRecording?.(bayLine(f, mode), f);
  }
}
