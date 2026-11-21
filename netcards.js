// Online play's cards over the picture: the countdown before a game starts
// (the host's Start, counted down on every bay - sim/netlobby.mjs), and the
// game paused for everyone by the host (no shots played, nobody goes on:
// app.js drops a shot that comes meanwhile).

import { esc } from "./util.js";
import { countdownLeft } from "./sim/netlobby.mjs";

export class NetCards {
  // onResume(): the host's Carry on.
  constructor({ onResume = () => {} } = {}) {
    this.count = document.createElement("div");
    this.count.className = "net-countdown";
    this.count.hidden = true;
    this.count.setAttribute("aria-live", "assertive");
    this.pause = document.createElement("div");
    this.pause.className = "net-paused";
    this.pause.hidden = true;
    this.pause.addEventListener("click", (e) => {
      if (e.target.closest("button[data-act=resume]")) onResume();
    });
    document.body.append(this.count, this.pause);
    this.heardSeq = null;
    this.heardAt = null;
    this.secs = 0;
    this.timer = null;
    this.pauseKey = "";
  }

  // The game as it is now (netplay.js view).
  update(view) {
    const g = view?.mode !== "off" ? view?.game : null;
    // The countdown: from when this bay heard it.
    const c = g && !g.started ? g.countdown : null;
    if (c && c.seq !== this.heardSeq) {
      this.heardSeq = c.seq;
      this.heardAt = Date.now();
      this.secs = c.secs;
      clearInterval(this.timer);
      this.timer = setInterval(() => this.tick(), 200);
      this.tick();
    }
    if (!c) this.stopCount();
    // Paused for everyone.
    const p = g?.started && !g.ended ? g.paused : null;
    const key = p ? `${p.seq}|${view.mode}` : "";
    if (key === this.pauseKey) return;
    this.pauseKey = key;
    this.pause.hidden = !p;
    if (p) {
      this.pause.innerHTML = `<div class="net-paused-box"><h2>Paused</h2><p>${esc(p.by)} has paused the game for everyone. No shots are played, and nobody goes on, until ${view.mode === "host" ? "you carry on" : "they carry on"}.</p>${view.mode === "host" ? '<button class="primary" data-act="resume">Carry on</button>' : ""}</div>`;
    }
  }

  get paused() {
    return !this.pause.hidden;
  }

  tick() {
    const left = countdownLeft(this.heardAt, this.secs);
    // (The host's start a moment late, or never: gone after a while.)
    if (left == null || Date.now() - this.heardAt > (this.secs + 8) * 1000) return this.stopCount();
    this.count.hidden = false;
    const words = left > 0 ? `<b>${left}</b><span>Starting - get your club ready</span>` : `<b>Go!</b><span>Starting...</span>`;
    if (this.count.innerHTML !== words) this.count.innerHTML = words;
  }

  stopCount() {
    clearInterval(this.timer);
    this.timer = null;
    this.count.hidden = true;
  }
}
