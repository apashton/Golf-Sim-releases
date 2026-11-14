// The Online tab's Seasons (sim/netseason.mjs has the rules): an online
// season played together - made here by the bay that runs it (the host),
// its events played one at a time as online rounds from the lobby, and
// its standings for everyone in the game. Drawn into the section's card
// (netplay.js OnlinePanel, onlinetabs.js "seasons").
//
// The host's own season (netseasonkeep.js) is what this bay keeps; in a
// game hosted elsewhere, the host's season comes with the game (g.season)
// and is shown as it stands.

import { esc } from "./util.js";
import { SEASON_LENGTHS, NET_SEASON_EVENTS, SCORINGS, nextNetEvent, eventWords, netSeasonTable, netSeasonLine, eventPoints } from "./sim/netseason.mjs";
import { placeWords } from "./sim/season.mjs";
import { ask } from "./askbox.js";

// A season's standings and its events, for anyone.
export function seasonTableHtml(s) {
  if (!s) return "";
  const t = netSeasonTable(s);
  const line = netSeasonLine(s) || `${s.events.length} events, none played yet`;
  const table = t.length
    ? `<table class="online-match-table"><tr><th></th><th>Player</th><th>Points</th><th>Won</th><th>Played</th></tr>${t.map((r) => `<tr><td>${r.place}</td><td>${esc(r.name)}</td><td><b>${r.points.toLocaleString("en-GB")}</b></td><td>${r.wins}</td><td>${r.played}</td></tr>`).join("")}</table>`
    : "";
  const events = `<ol class="online-season-events">${s.events
    .map((e) => {
      const pts = e.done ? eventPoints(e.places) : null;
      const won = e.done ? e.places.filter((p) => p.place === 1).map((p) => p.name) : [];
      return `<li class="${e.done ? "done" : ""}"><b>${esc(e.name)}</b> <span class="small muted">${esc(e.course)}${
        e.done ? ` - won by ${esc(won.join(" and "))}${won.length === 1 ? ` (${esc(e.places[0].text)})` : ""}; ${e.places.map((p) => `${placeWords({ pos: p.place, tied: e.places.filter((q) => q.place === p.place).length > 1 })} ${esc(p.name)} ${pts.get(p.name)}`).join(", ")}` : ""
      }</span></li>`;
    })
    .join("")}</ol>`;
  return `<p><b>${esc(s.name)}</b> <span class="small muted">${esc(SCORINGS[s.scoring].split(" - ")[0])} · ${esc(line)}</span></p>${table}<details class="online-presets"><summary>The events</summary>${events}</details>`;
}

export class SeasonsSection {
  // keeper: netseasonkeep.js NetSeasonKeeper (this bay's own season).
  // view(): the online client's view (whether hosting, the game).
  // courses(): this bay's courses [{ id, name }]. play(k): the host's
  // event k as the lobby's next game (app.js: hosting first if it isn't).
  // toast(text): said. onCourse(): the lobby's Play is a round on the
  // course (only then is the event the next game).
  constructor({ keeper, view, courses, play, toast = () => {}, onCourse = () => true }) {
    Object.assign(this, { keeper, view, courses, play, toast, onCourse });
    this.el = null;
  }

  attach(el) {
    this.el = el;
    el.addEventListener("click", (e) => this.click(e));
    this.render();
  }

  render() {
    const el = this.el;
    if (!el?.isConnected) return;
    const v = this.view() ?? {};
    const g = v.game;
    const mine = this.keeper.season;
    // In someone else's game: theirs, as the game has it.
    if (v.mode === "guest") {
      el.innerHTML = g?.season
        ? `<p class="small muted">The host's season - they run it, and each of its events is a game they start from the lobby.</p>${seasonTableHtml(g.season)}`
        : `<p class="small muted">The host of this game isn't running a season. A season of your own is made here when you're not in someone else's game.</p>`;
      return;
    }
    if (!mine) {
      // (Its form drawn already: left as it is, with what's typed in it.)
      if (el.querySelector("#ns-name")) return;
      const courses = this.courses() ?? [];
      el.innerHTML = `<p class="small muted">A run of events played together online: each event a round on one of your courses that everyone in the game plays at once, points by where each finishes (500 for first, 300, 190...), and the standings across them. You run it - it's kept on this ${v.lan === false ? "phone" : "PC"} - and everyone in the game sees it.</p>
        <label>Name <input id="ns-name" type="text" maxlength="40" placeholder="Winter season" autocomplete="off"></label>
        <label>Events <select id="ns-events">${SEASON_LENGTHS.map((n) => `<option value="${n}" ${n === NET_SEASON_EVENTS ? "selected" : ""}>${n}</option>`).join("")}</select></label>
        <label title="Gross: the fewest strokes wins each event. Net: each player's handicap taken off first (the round's handicaps on), so players of every standard can win">Scoring <select id="ns-scoring">${Object.entries(SCORINGS).map(([v2, name]) => `<option value="${v2}">${esc(name)}</option>`).join("")}</select></label>
        <p class="small muted">${courses.length ? `Its events go round your ${courses.length} course${courses.length === 1 ? "" : "s"}, one each.` : "Make a course first - the events are played on your courses."}</p>
        <div class="row-buttons"><button class="primary" data-act="ns-start" ${courses.length ? "" : "disabled"}>Start the season</button></div>`;
      return;
    }
    const k = nextNetEvent(mine);
    const next = this.keeper.next;
    const play =
      k < 0
        ? `<p class="small"><b>Season over.</b></p>`
        : next === k && v.mode === "host" && !g?.started
          ? `<p class="small">Next game in the lobby: <b>${esc(eventWords(mine, k))}</b>. <button data-act="ns-aside">Play something else first</button></p>`
          : `<div class="row-buttons"><button class="primary" data-act="ns-play" title="${esc(`${mine.events[k].course}: everyone in the game plays it at once, stroke play${mine.scoring === "net" ? " with handicaps" : ""}`)}">Play event ${k + 1} - ${esc(mine.events[k].name)}</button></div>`;
    el.innerHTML = `${seasonTableHtml(mine)}${play}<p class="small"><button data-act="ns-end">${k < 0 ? "New season" : "End the season"}</button></p>`;
  }

  // In the lobby, for everyone: the season the game's host runs, where it
  // stands, and the event being played or next - with the way to its
  // standings.
  lobbyHtml(v, g) {
    const s = g?.season;
    if (!s) return "";
    const k = g.started ? g.round?.season?.k : v.mode === "host" ? this.keeper.next : null;
    // (The host playing something else first: the event waits.)
    const waits = !g.started && k != null && !this.onCourse();
    const what = k == null ? "" : waits ? `${eventWords(s, k)} waits - Play a round on the course for it. ` : `${g.started ? "Playing" : "Next game"}: ${eventWords(s, k)}. `;
    return `<div class="online-match"><p><b>${esc(s.name)}</b> <span class="small muted">${esc(netSeasonLine(s) || "No events played yet")}</span></p><p class="small">${esc(what)}<button data-act="tab" data-tab="seasons">The season</button></p></div>`;
  }

  async click(e) {
    const act = e.target.closest("button")?.dataset.act;
    if (!act?.startsWith("ns-")) return;
    if (act === "ns-start") {
      const q = (s) => this.el.querySelector(s);
      const ok = await this.keeper.start({ name: q("#ns-name").value, events: Number(q("#ns-events").value), scoring: q("#ns-scoring").value, courses: this.courses() ?? [], seed: Date.now() & 0xffffff });
      if (!ok) this.toast("Make a course first - the events are played on your courses");
    } else if (act === "ns-play") {
      const k = this.keeper.playNext(true);
      if (k != null) await this.play(k);
    } else if (act === "ns-aside") {
      this.keeper.playNext(false);
      this.toast("The lobby's next game is yours to pick - the season's event waits");
    } else if (act === "ns-end") {
      const over = nextNetEvent(this.keeper.season) < 0;
      // (Asked in the page: the browser's own confirm() upsets the Windows
      // app's boxes - askbox.js.)
      if (!over && !(await ask("End the season? Its standings go.", { yes: "End it", no: "Keep it", danger: true }))) return;
      await this.keeper.end();
    }
    this.render();
  }
}
