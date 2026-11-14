// A course round's season (sim/season.mjs): recording a finished event,
// playing the next one and drawing the standings - and at its start, the
// handicap it's played at (your rounds', or asked for with too few: kept
// for your rounds until they give one, course/madeupplay.js askedIndex),
// round which the field at your level is drawn.
// Part of CourseMode (course.js), split out of it: these methods are
// added to CourseMode.prototype there and run with `this` the course.

import {
  FIELDS, SEASON_LENGTHS, YOU, DEFAULT_FIELD, HCP_RANGE, YOU_FROM, newSeason, nextEvent, recordEvent, withYou,
  standings as seasonStandings, placeWords, moneyWords, hcpWords, liveBoard, boardLines, groupOnHole, toParWords,
} from "../sim/season.mjs";
import { scoreName } from "../sim/courseplay.mjs";
import { saveSetting, esc } from "../util.js";

export class CourseSeason {
  // ---- A season (sim/season.mjs) ------------------------------------------------

  // A round that was a season's event, finished: its leaderboard with
  // the first player's round - every hole played - points and prize money,
  // kept with the season.
  seasonEventPlayed() {
    const r = this.round;
    const k = r?.season;
    if (k == null || !this.season?.events?.[k] || this.season.events[k].done) return;
    const scores = r.players[0]?.scores ?? [];
    const pars = this.course.holes.map((h) => h.spec.par);
    if (scores.length < pars.length || scores.some((x) => x == null)) {
      this.onToast(`${this.season.events[k].name}: not every hole was played - it isn't counted`, 4000);
      return;
    }
    this.season = recordEvent(this.season, k, scores, pars);
    // Your handicap as your rounds now have it, kept with the season.
    const p0 = r.players[0];
    if (p0?.indexFrom === "rounds" && Number.isFinite(p0.index)) this.season = withYou(this.season, { hcp: p0.index, from: "rounds" });
    saveSetting("season", this.season);
    const me = this.season.events[k].results.find((x) => x.id === YOU);
    r.seasonPos = me.pos;
    this.onToast(`${this.season.events[k].name}: you finished ${placeWords(me)} - ${me.points} pts, ${moneyWords(me.money)}`, 6000);
    this.renderSeason();
  }

  // The season's event this round is, or null: { season, k, event }.
  seasonEvent() {
    const k = this.round?.season;
    const event = k == null ? null : this.season?.events?.[k];
    return event && !event.done ? { season: this.season, k, event } : null;
  }

  // Between holes in a season's event: its leaderboard so far - the top
  // five, you and your group wherever you are, everyone through the holes
  // you've played (sim/season.mjs liveBoard) - for the hole card and the
  // cart's screen. "" in any other round.
  seasonBoardHtml() {
    const at = this.seasonEvent();
    if (!at) return "";
    const pars = this.course.holes.map((h) => h.spec.par);
    const board = liveBoard(at.season, at.k, this.round.players[0]?.scores ?? [], pars);
    if (!board.thru) return "";
    const rows = boardLines(board, 5)
      .map((x) => (x.gap ? `<tr class="gap"><td colspan="3">...</td></tr>` : `<tr class="${x.you ? "me" : x.partner ? "partner" : ""}"><td>${placeWords(x)}</td><td>${esc(x.you ? this.round.players[0].name : x.name)}</td><td>${toParWords(x.toPar)}</td></tr>`))
      .join("");
    return `<div class="season-board"><div class="sb-head">${esc(at.event.name)} - after ${board.thru}</div><table>${rows}</table></div>`;
  }

  // Who's on this hole with you, for the box over the picture (bay.js
  // group): the round's players (with friends, here or online) and in a
  // season's event the two of the field playing with you - each one's
  // strokes on the hole so far, a partner's keeping pace with yours until
  // they've holed out (sim/season.mjs groupOnHole: no ball of theirs is
  // shown, the owner's "even if no balls shown in flight"). Null alone.
  holeGroup() {
    const r = this.round;
    if (!r?.hole || r.finished) return null;
    const i = r.index;
    const spec = this.course.holes[i].spec;
    const pars = this.course.holes.map((h) => h.spec.par);
    const rows = r.players.map((p) => {
      const done = p.scores[i] != null;
      const strokes = done ? p.scores[i] : p.strokes || 0;
      return { name: p.name, colour: p.colour, strokes, holed: done, words: done ? scoreName(p.scores[i], spec.par) : "" };
    });
    const at = this.seasonEvent();
    if (at) {
      const me = r.players[0];
      const done = me.scores[i] != null;
      for (const g of groupOnHole(at.season, at.k, pars, i, done ? me.scores[i] : me.strokes || 0, done)) {
        rows.push({ name: g.name, colour: null, strokes: g.strokes, holed: g.holed, words: g.holed ? scoreName(g.strokes, spec.par) : "" });
      }
    }
    // A solo ladder match: the made-up golfer you're playing, and the
    // match in the title (course/matchladder.js).
    this.ladderRows(i, rows);
    if (rows.length < 2) return null;
    const match = r.ladder ? this.ladderLiveWords() : null;
    return { title: `Hole ${spec.number} · par ${spec.par}${match ? ` · ${match.replace(/^[^:]*: /, "")}` : ""}`, rows };
  }

  // Plays the season's next event: a round on its course.
  async playSeasonEvent() {
    const k = nextEvent(this.season);
    if (k < 0) return;
    if (!(await this.leaveRound(`Play ${this.season.events[k].name}?`))) return;
    // (The season ended, or moved on, while it asked.)
    if (!this.season || nextEvent(this.season) !== k) return;
    this.pendingSeason = k;
    this.startRound(this.season.events[k].courseId);
  }

  // Who a season's for: the course's first player.
  seasonName() {
    return this.players[0] ?? "You";
  }

  // Their handicap for how they're playing now (the launch monitor, or the
  // mouse or a controller at their level): a player as a round has one -
  // { name, swing, index, indexFrom } (course/madeupplay.js swingIndex),
  // indexFrom "rounds" or "typed" when it needn't be asked for.
  async seasonHandicap(name) {
    const p = { name, swing: this.madeUpGuess?.(name) ?? null, madeUps: null, realIndex: null, realFrom: null };
    let d = null;
    try {
      d = await fetch(`/api/stats/player?name=${encodeURIComponent(name)}&period=today`).then((res) => (res.ok ? res.json() : null));
    } catch {
      d = null;
    }
    const typed = this.settings.hcp?.[name];
    if (typed != null && typed !== "" && Number.isFinite(Number(typed))) {
      p.realIndex = Number(typed);
      p.realFrom = "typed";
    }
    this.madeUpStats(p, d);
    return p;
  }

  // The Season section of the panel: start one, or where it stands.
  renderSeason() {
    const el = this.panel.querySelector("#course-season-body");
    if (!el) return;
    const s = this.season;
    if (!s) {
      const name = this.seasonName();
      el.innerHTML = `<p class="muted small">A run of events on your courses against a field of golfers: each event's leaderboard from your round (every hole played, gross), points and prize money by where you finish, and the season's standings. The leaderboard shows between holes, and two of the field play with you.</p>
        <label>Events <select id="season-length">${SEASON_LENGTHS.map((n) => `<option value="${n}" ${n === 6 ? "selected" : ""}>${n}</option>`).join("")}</select></label>
        <label title="Who you play against: golfers at your level (round your handicap), club golfers (handicaps 2 - 24), county players (+2 - 6) or tour pros (+1 - +6)">Field <select id="season-field">${Object.entries(FIELDS).map(([v, f]) => `<option value="${v}" ${v === DEFAULT_FIELD ? "selected" : ""}>${f.name}</option>`).join("")}</select></label>
        <p class="small" id="season-you">${esc(name)}'s handicap: looking it up...</p>
        <label id="season-hcp-row" hidden title="Too few rounds to have a handicap yet: yours (a plus handicap below 0) - kept until your rounds give you one">Your handicap <input id="season-hcp" type="number" step="0.1" min="${HCP_RANGE[0]}" max="${HCP_RANGE[1]}" inputmode="decimal"></label>
        <div class="row-buttons"><button id="season-new">New season</button></div>`;
      // Their handicap: their rounds', or asked for (with too few).
      let who = null;
      const ask = () => !who || !["rounds", "typed"].includes(who.indexFrom);
      this.seasonHandicap(name).then((p) => {
        if (!el.isConnected || this.season) return;
        who = p;
        // (Touch and the mouse swing on the same pad.)
        const how = p.swing ? (p.swing.device === "controller" ? "with a controller" : "on the swing pad") : "on the launch monitor";
        const you = el.querySelector("#season-you");
        if (!ask()) you.textContent = `${name}'s handicap ${how}: ${hcpWords(p.index)} (${YOU_FROM[p.indexFrom]}) - the field at your level is drawn round it.`;
        else {
          you.textContent = `${name}: too few rounds ${how} for a handicap yet - what's yours? Kept until your rounds give you one.`;
          el.querySelector("#season-hcp-row").hidden = false;
          if (Number.isFinite(p.index)) el.querySelector("#season-hcp").value = String(p.index);
        }
      });
      el.querySelector("#season-new").addEventListener("click", () => {
        let you = null;
        if (!who) return this.onToast("Still looking up your handicap - a moment", 2500);
        if (ask()) {
          const v = el.querySelector("#season-hcp").value;
          if (v === "" || !Number.isFinite(Number(v))) return this.onToast("Your handicap first (a plus handicap below 0)", 3000);
          this.setAskedIndex(name, who.swing, v);
          you = { hcp: Number(v), from: "asked" };
        } else you = { hcp: who.index, from: who.indexFrom };
        const season = newSeason({ seed: (Date.now() & 0xffffff) | 1, field: el.querySelector("#season-field").value, events: Number(el.querySelector("#season-length").value), courses: this.list.map((c) => ({ id: c.id, name: c.name })), you, started: Date.now() });
        if (!season) return this.onToast("Make a course in the course designer first", 2500);
        this.season = season;
        saveSetting("season", season);
        this.renderSeason();
      });
      return;
    }
    const k = nextEvent(s);
    const table = seasonStandings(s);
    const myPlace = table.findIndex((x) => x.id === YOU) + 1;
    const me = table[myPlace - 1];
    const played = s.events.filter((e) => e.done).length;
    const last = [...s.events].reverse().find((e) => e.done);
    const row = (x, i) => `<tr class="${x.id === YOU ? "me" : ""}"><td>${i + 1}</td><td>${esc(x.name)}</td><td>${x.points}</td><td>${moneyWords(x.money)}</td></tr>`;
    el.innerHTML = `<p><b>${esc(s.name)}</b> - ${played} of ${s.events.length} played</p>
      ${s.you ? `<p class="small muted">Your handicap: ${hcpWords(s.you.hcp)} (${YOU_FROM[s.you.from]})</p>` : ""}
      ${played ? `<p class="small">You're ${placeWords({ pos: myPlace })} on ${me.points} pts, ${moneyWords(me.money)}${me.wins ? ` - ${me.wins} win${me.wins > 1 ? "s" : ""}` : ""}</p>` : ""}
      ${k >= 0 ? `<p class="small">Next: <b>${esc(s.events[k].name)}</b> (${esc(s.events[k].course)})</p>` : `<p class="small"><b>Season over</b> - you finished ${placeWords({ pos: myPlace })}${myPlace === 1 ? ": champion!" : "."}</p>`}
      <div class="row-buttons">
        ${k >= 0 ? `<button id="season-play" class="primary">Play event ${k + 1}</button>` : ""}
        <button id="season-standings">Standings</button>
        <button id="season-end">${k >= 0 ? "End season" : "New season"}</button>
      </div>
      <div id="season-table" hidden>
        ${last ? `<p class="small">${esc(last.name)}: ${last.results.slice(0, 5).map((x) => `${placeWords(x)} ${esc(x.name)} ${x.toPar === 0 ? "E" : x.toPar > 0 ? `+${x.toPar}` : x.toPar}`).join(", ")}${last.results.slice(0, 5).some((x) => x.id === YOU) ? "" : ` ... ${placeWords(last.results.find((x) => x.id === YOU))} You`}</p>` : ""}
        <table class="season-table"><tr><th></th><th>Player</th><th>Pts</th><th>Money</th></tr>${table.slice(0, 10).map(row).join("")}${myPlace > 10 ? row(me, myPlace - 1) : ""}</table>
      </div>`;
    el.querySelector("#season-play")?.addEventListener("click", () => this.playSeasonEvent());
    el.querySelector("#season-standings").addEventListener("click", () => {
      const t = el.querySelector("#season-table");
      t.hidden = !t.hidden;
    });
    el.querySelector("#season-end").addEventListener("click", async () => {
      if (k >= 0 && !(await this.askFirst(`End ${s.name}? Its standings go.`, { yes: "End it", no: "Keep it", danger: true }))) return;
      // (Already ended, or another begun, while it asked.)
      if (this.season !== s) return;
      this.season = null;
      saveSetting("season", null);
      this.renderSeason();
    });
  }
}
