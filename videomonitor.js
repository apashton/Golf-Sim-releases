// What's being recorded, on the game window (the owner: "Can the game
// screen show the recording screen (flick between the two) so I can see
// what is being recorded even if I have in a smaller box"): a box over the
// game while recording - the Recording panel's "On the game window", moved
// and sized with the game screen's Arrange like its other boxes - or, with
// Shift + Q, the whole window flicked to the recording's picture and back
// (sim/videorec.mjs monitorView). A copy of the picture the recording
// draws anyway, taken each time it draws one: nothing is drawn twice. Not
// recording, the flicked window shows what would be recorded.
//
//   new VideoMonitor({ video, view })
//   flick() -> words to say (why it can't), or null

import { monitorView } from "./sim/videorec.mjs";

export class VideoMonitor {
  constructor({ video, view }) {
    this.video = video;
    this.view = view;
    this.full = false;
    const doc = view.ownerDocument;
    this.el = doc.createElement("div");
    this.el.className = "video-monitor";
    this.el.hidden = true;
    this.el.innerHTML = `<canvas></canvas><span class="vm-label"></span>`;
    this.canvas = this.el.querySelector("canvas");
    this.label = this.el.querySelector(".vm-label");
    view.appendChild(this.el);
    // Its size in the window's pixels, kept as it changes (not asked for
    // every frame).
    this.size = { w: 0, h: 0 };
    new ResizeObserver(() => this.measure()).observe(this.el);
    video.onChange(() => this.update());
    video.onFrame = () => this.draw();
    this.update();
  }

  get shows() {
    const v = this.video;
    return monitorView(v.settings, { full: this.full, recording: v.recording, what: v.what, reel: !!v.startOpts?.reel && v.recording });
  }

  // Shift + Q: the whole window the recording's picture, or the game again.
  flick() {
    const v = this.video;
    if (v.recording && v.what === "screen") {
      this.full = false;
      this.update();
      return "Recording full screen: the game window is what's being recorded";
    }
    // (Its own label says so, and how to go back: no message either way.)
    this.full = !this.full;
    this.update();
    return null;
  }

  update() {
    const shows = this.shows;
    const was = this.el.hidden ? "none" : this.el.classList.contains("full") ? "full" : "box";
    this.el.hidden = shows === "none";
    this.el.classList.toggle("full", shows === "full");
    this.el.classList.toggle("box", shows === "box");
    // (Whether it's been chosen at all: the game screen's Arrange shows it
    // to place only then - gamearrange.js.)
    this.el.dataset.chosen = this.video.settings?.monitor === "box" ? "box" : "";
    const rec = this.video.recording;
    this.label.textContent = shows === "full" ? (rec ? "● REC  What's being recorded - Shift + Q: the game" : "What would be recorded - Shift + Q: the game") : "● REC";
    // Not recording, the picture's drawn for this alone.
    this.video.compositor.use("monitor", shows !== "none");
    if (shows !== was) this.measure();
  }

  measure() {
    const dpr = this.view.ownerDocument.defaultView?.devicePixelRatio ?? 1;
    this.size = { w: Math.round(this.el.clientWidth * dpr), h: Math.round(this.el.clientHeight * dpr) };
  }

  draw() {
    if (this.el.hidden || !this.size.w || !this.size.h) return;
    const src = this.video.compositor.canvas;
    // The recording's shape, as big as fits (never bigger than it is).
    const k = Math.min(1, this.size.w / src.width, this.size.h / src.height);
    const w = Math.max(1, Math.round(src.width * k));
    const h = Math.max(1, Math.round(src.height * k));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.canvas.getContext("2d").drawImage(src, 0, 0, w, h);
  }
}
