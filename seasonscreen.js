// The season screen (sim/seasonrecord.mjs has what's on it): a season on
// this PC's record - where you stand, each event (where you finished it and
// who won), and the whole field's standings. Opened from the Course tab's
// Season (Season record) while one's under way, shown by itself when one's
// ended (played to the last, or ended early), and - with no season going -
// the past seasons, each one's record a press away.
//
// Thin: course/season.js keeps the season and the past ones, and says when
// to show which.

import { stateWords, youWords, resultWords, pointsWords, endedWords } from "./sim/seasonrecord.mjs";
import { placeWords, moneyWords, toParWords } from "./sim/season.mjs";
import { esc } from "./util.js";

export class SeasonScreen {
  // play(): the season's next event played (course/season.js). onShow(open).
  constructor({ play = () => {}, onShow = () => {} } = {}) {
    Object.assign(this, { play, onShow });
    this.record = null;
    this.past = [];
    this.el = document.createElement("div");
    this.el.className = "bay-help online-play season-screen";
    this.el.hidden = true;
    this.el.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-act]");
      if (b) this.act(b.dataset.act, b.dataset);
      else if (e.target === this.el) this.show(false);
    });
    document.body.appendChild(this.el);
  }

  get open() {
    return !this.el.hidden;
  }

  // A season's record shown (a season in play, or one as it ended), or -
  // with record null - the past seasons. past: the past seasons' records.
  showRecord(record, past = this.past) {
    this.record = record;
    this.past = past ?? [];
    // What's looked at: the record (null), the past seasons' list ("past")
    // or one of them (its index).
    this.view = null;
    this.render();
    this.show(true);
  }

  show(on = true) {
    this.el.hidden = !on;
    this.onShow(on);
  }

  key(e) {
    if (!this.open || e.key !== "Escape") return false;
    this.show(false);
    e.preventDefault();
    return true;
  }

  act(act, data = {}) {
    if (act === "close") return this.show(false);
    if (act === "play") return (this.show(false), this.play());
    if (act === "past") this.view = Number(data.i);
    else if (act === "list") this.view = "past";
    else if (act === "current") this.view = null;
    else return;
    this.render();
  }

  // One season's record.
  recordHtml(r) {
    const rounds = r.rounds
      .map(
        (e) => `<tr${e.next ? ' class="near"' : ""}><td>${e.k + 1}</td><td>${esc(e.name)}<br><span class="small muted">${esc(e.course)}</span></td><td>${e.mine ? esc(resultWords(e.mine)) : e.next ? "Next" : `<span class="muted">${r.early ? "Not played" : "-"}</span>`}</td><td>${e.winner ? `${esc(e.winner.name)} <span class="small muted">${esc(toParWords(e.winner.toPar))}</span>` : ""}</td></tr>`,
      )
      .join("");
    const table = r.standings
      .map((x) => `<tr${x.me ? ' class="near"' : ""}><td>${placeWords({ pos: x.place })}</td><td>${esc(x.name)}${x.wins ? ` <span class="small muted">${x.wins} win${x.wins === 1 ? "" : "s"}</span>` : ""}</td><td>${esc(pointsWords(x.points))}</td><td>${esc(moneyWords(x.money))}</td></tr>`)
      .join("");
    const ended = r.endedAt ? ` · ${esc(endedWords(r.endedAt))}` : "";
    return `<p class="online-intro"><b>${esc(stateWords(r))}</b>${r.field ? ` · ${esc(r.field)}` : ""}${ended}</p>
      <p class="tour-mine">${esc(youWords(r))}</p>
      ${!r.over && !r.early && r.next >= 0 ? `<p><button class="primary" data-act="play">Play event ${r.next + 1}: ${esc(r.rounds[r.next].name)}</button></p>` : ""}
      <section class="online-card"><h3>The events</h3><table class="clubs tour-board season-events"><tr><th></th><th>Event</th><th>You</th><th>Won by</th></tr>${rounds}</table></section>
      <section class="online-card"><h3>Standings</h3><table class="clubs tour-board season-standings"><tr><th>Place</th><th>Player</th><th>Points</th><th>Money</th></tr>${table}</table></section>`;
  }

  // The past seasons, newest first.
  pastHtml() {
    if (!this.past.length) return `<p class="online-intro">No past seasons yet - one's kept here once it's played to the end, or ended early.</p>`;
    return `<section class="online-card">${this.past
      .map((r, i) => `<p><button data-act="past" data-i="${i}">${esc(r.name)}</button> <span class="small muted">${esc(endedWords(r.endedAt))} - ${r.you ? `${esc(placeWords({ pos: r.you.place }))} of ${r.you.of}` : ""}${r.early ? `, ended after ${r.played} of ${r.events}` : ""}</span></p>`)
      .join("")}</section>`;
  }

  render() {
    const shown = typeof this.view === "number" ? this.past[this.view] : this.view === "past" ? null : this.record;
    const title = shown ? shown.name : "Past seasons";
    // (Back from one past season to the list; from the list to the season.)
    const back = typeof this.view === "number" ? `<button data-act="list">Past seasons</button>` : this.view === "past" && this.record ? `<button data-act="current">${esc(this.record.name)}</button>` : "";
    const body = shown ? this.recordHtml(shown) : this.pastHtml();
    // (The season's own record: its past ones a press away below it.)
    const more = shown && shown === this.record && this.past.length ? `<p class="small muted">${this.past.length} past season${this.past.length === 1 ? "" : "s"} kept: <button data-act="list">Past seasons</button></p>` : "";
    this.el.innerHTML = `<div class="bay-help-box online-box tour-box season-box"><header class="online-head"><h2>${esc(title)}</h2>${back}<button class="online-x" data-act="close" title="Close (Esc)" aria-label="Close">×</button></header><div class="online-body">${body}${more}</div></div>`;
  }
}
