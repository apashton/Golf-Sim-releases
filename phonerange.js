// The range session on a phone (docs/ANDROID-PLAN.md, "At the range,
// properly": the app's At the range -> Range session). The PC has its side
// panel; on the phone that's folded away and too small to read, so over the
// picture a Session button with the session's count, and tapped, a card:
// - Shots: the session's shots, newest first - club, carry, total, line,
//   ball speed (a misread crossed out, a thin or fat said);
// - Clubs: each club's distances - shots, average carry and total, its
//   shortest to longest, how wide, which way on average;
// - Finish: the session summed up - shots and minutes, the longest and the
//   straightest, any overlap or gap between clubs - then a new one (the
//   range's Clear session: the session ended and kept in the stats).
// The numbers are sim/rangesession.mjs's; app.js shows it on the phone's
// range only (range.js onSession hands it the shots).

import { shotRows, clubDistances, sessionSummary, summaryWords, sideWords } from "./sim/rangesession.mjs";
import { clubShort } from "./sim/clubs.mjs";
import { esc } from "./util.js";

const n0 = (v) => (Number.isFinite(v) ? String(Math.round(v)) : "-");

export class PhoneRange {
  // session(): a range session with a launch monitor is on (app.js
  // inRangeSession); onEnd(): end it, back to phone play.
  constructor({ range, parent = document.body, now = () => Date.now(), session = () => false, onEnd = () => {} }) {
    this.range = range;
    this.session = session;
    this.onEnd = onEnd;
    this.now = now;
    this.shots = [];
    this.start = null;
    this.tab = "shots";
    this.summary = null;
    this.button = document.createElement("button");
    this.button.className = "phone-range-open";
    this.button.hidden = true;
    this.button.title = "This session's shots, each club's distances, and Finish to sum it up";
    this.card = document.createElement("div");
    this.card.className = "phone-range";
    this.card.hidden = true;
    parent.append(this.button, this.card);
    this.home = parent;
    this.button.addEventListener("click", () => (this.card.hidden ? this.open() : this.close()));
    this.card.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-do]");
      if (!b) return;
      const what = b.dataset.do;
      if (what === "close" || what === "keep") this.close();
      else if (what === "finish") this.finish();
      else if (what === "new") this.newSession();
      else if (what === "end") {
        this.close();
        this.onEnd();
      }
      else this.open(what);
    });
    this.label();
  }

  // On the range, or not (app.js setMode).
  shown(on) {
    this.on = on;
    this.button.hidden = !on;
    if (!on) this.close();
  }

  // The button in the touch strip while it's up (app.js), not over it at
  // the picture's corner (the owner's photos, 1 November 2026: Session over
  // the strip's club buttons); back over the picture without it.
  dock(strip) {
    const at = strip ?? this.home;
    if (this.button.parentElement !== at) at.append(this.button);
    this.button.classList.toggle("docked", !!strip);
  }


  // The session's shots (range.js renderSession, after each and when it's
  // cleared): the count on the button, the card drawn again if it's open.
  update(shots) {
    this.shots = shots ?? [];
    if (!this.shots.length) this.start = null;
    else this.start ??= this.now();
    this.label();
    if (!this.card.hidden && !this.summary) this.draw();
  }

  label() {
    const n = this.shots.filter((s) => !s.removed).length;
    this.button.innerHTML = `Session <b>${n}</b>`;
  }

  open(tab = this.tab) {
    this.tab = tab;
    this.summary = null;
    this.card.hidden = false;
    this.button.classList.add("on");
    this.draw();
  }

  close() {
    this.card.hidden = true;
    this.summary = null;
    this.button.classList.remove("on");
  }

  // Finish: the session summed up, a new one a tap away.
  finish() {
    this.summary = sessionSummary(this.shots, { start: this.start, end: this.now() });
    this.card.hidden = false;
    this.draw();
  }

  newSession() {
    this.close();
    this.range.clearSession();
  }

  draw() {
    if (this.summary) return this.drawSummary();
    const tabs = [
      ["shots", "Shots"],
      ["clubs", "Clubs"],
    ]
      .map(([k, word]) => `<button data-do="${k}" class="${this.tab === k ? "on" : ""}">${word}</button>`)
      .join("");
    const body = this.tab === "clubs" ? this.clubsTable(clubDistances(this.shots)) : this.shotsTable();
    this.card.innerHTML = `<div class="pr-head">${tabs}<button data-do="close" class="pr-x" title="Close">✕</button></div>
      <div class="pr-body">${body}</div>
      <div class="pr-foot"><button data-do="finish" ${this.shots.length ? "" : "disabled"}>Finish session</button>${this.session() ? `<button data-do="end" title="Back to phone play: the swing pad on, the launch monitor not looked for">End range session</button>` : ""}</div>`;
  }

  shotsTable() {
    const rows = shotRows(this.shots);
    if (!rows.length) return `<p class="pr-none">No shots yet - hit one and it's here.</p>`;
    return `<table><tr><th>#</th><th>Club</th><th>Carry</th><th>Total</th><th>Line</th><th>Speed</th></tr>${rows
      .map(
        (r) => `<tr class="${r.misread ? "misread" : ""}"><td>${r.n}</td><td>${esc(clubShort(r.club ?? "-"))}${r.mark ? ` <i>${esc(r.mark)}</i>` : ""}</td>
        <td>${n0(r.carry)}</td><td>${n0(r.total)}</td><td>${Number.isFinite(r.offline) ? sideWords(r.offline) : "-"}</td><td>${n0(r.speed)}</td></tr>`,
      )
      .join("")}</table>`;
  }

  clubsTable(clubs) {
    if (!clubs.length) return `<p class="pr-none">No shots yet - each club's distances show here.</p>`;
    return `<table><tr><th>Club</th><th>Shots</th><th>Carry</th><th>Total</th><th>Range</th><th>Width</th><th>Line</th></tr>${clubs
      .map(
        (c) => `<tr><td>${esc(clubShort(c.club))}</td><td>${c.n}</td><td>${n0(c.carry)}</td><td>${n0(c.total)}</td>
        <td>${n0(c.low)}-${n0(c.high)}</td><td>${n0(c.width)}</td><td>${sideWords(c.side)}</td></tr>`,
      )
      .join("")}</table>`;
  }

  drawSummary() {
    const words = summaryWords(this.summary);
    this.card.innerHTML = `<div class="pr-head"><h3>${esc(words.head)}</h3><button data-do="keep" class="pr-x" title="Close">✕</button></div>
      <div class="pr-body">${words.lines.length ? `<ul>${words.lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>` : ""}
        ${this.clubsTable(this.summary.clubs)}</div>
      <div class="pr-foot"><button data-do="keep">Keep going</button><button data-do="new" class="go">New session</button></div>`;
  }
}
