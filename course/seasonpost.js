// A season by post in the game (docs/COURSES.md, "A season by post";
// sim/postseason.mjs has the rules, relay/seasons.mjs keeps it): the Online
// tab's Seasons, its By post card. Made here or joined with its link or
// code, started by whoever made it; each event open for its days, played
// as a round on its own whenever the player likes before its deadline;
// the leaderboards and the season's table as the rounds come in.
//   - Made: its settings, and its events going round the courses that come
//     with the game (everyone has them) - or this PC's own courses too, and
//     friends' it has: shared as it's made (sim/sharedcourse.mjs), each
//     event's course then its shared copy ("shared-c7q2mx"), which a phone,
//     the web version or another PC fetches by its code when its round's
//     played - the first holes of each kept, to check a player's copy is
//     the same course - each event's weather rolled now from this bay's
//     weather settings.
//   - Play your round: said to the relay (begin: once), then played as a
//     course round of one with the event's tees, cups, weather and luck -
//     no restarts, mulligans, gimmes or skill points. Each hole's kept on
//     this PC as it's finished, so a round broken off carries on from the
//     next hole (a hole left part way, after a shot, counts as unfinished:
//     par and 3).
//   - The round's end: its scores sent; kept here until they're in.
// Asked of the relay when the card's first drawn, as the game opens and on
// Refresh - never on a timer (relay/README.md, "Keeping to the free plan").
// Part of CourseMode (course.js), split out of it: these methods are added
// to CourseMode.prototype there and run with `this` the course.

import { SeasonClient, newSeasonKey } from "../net/seasonclient.mjs";
import { sharedId, codeOfShared } from "../sim/sharedcourse.mjs";
import { newPostSeason, SEASON_LENGTHS, DEFAULT_EVENTS, DAY_CHOICES, DEFAULT_DAYS, HOLE_CHOICES, WAYS, LEVELS, eventState, currentEvent, eventPinDay, eventWindow, leaderboard, postTable, postLine, windowWords, myRound, readKept, roundOf, rulesLine } from "../sim/postseason.mjs";
import { carryOn } from "../sim/postal.mjs";
import { rollConditions, cleanConditions } from "../sim/weather.mjs";
import { WAY_NAMES } from "../sim/matchladder.mjs";
import { LEVELS as SWING_LEVELS } from "../sim/swinglevels.mjs";
import { seasonJoinLink, readSeasonCode } from "../sim/netinvite.mjs";
import { qrSvg } from "../netlobby.js";
import { showLadderCode } from "./ladderonline.js";
import { saveSetting, esc } from "../util.js";

const dateWords = (t) => new Date(t).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
const opt = (list, names, chosen) => list.map((v) => `<option value="${esc(v)}" ${v === chosen ? "selected" : ""}>${esc(names[v] ?? v)}</option>`).join("");
// A course that comes with the game (sim/coursepicker.mjs origin).
const fromGame = (c) => (c?.origin ?? (c?.builtIn ? "game" : null)) === "game";

export class CourseSeasonPost {
  // ---- Kept -----------------------------------------------------------------------

  // The seasons as kept, made sound (course.js constructor).
  readPostSeasons(x) {
    return readKept(x);
  }
  savePostSeasons() {
    saveSetting("postSeasons", this.postSeasons);
    // (Their names to the server, for a browser signed in to this PC:
    // course/ladderweb.js.)
    this.reportLadders?.();
  }
  postSeasonOf(code) {
    return this.postSeasons.list.find((s) => s.code === code) ?? null;
  }
  // The relay's season store (none without a relay).
  seasonStore() {
    return new SeasonClient({ relay: this.ladderRelay?.() ?? "" });
  }

  // A reply from the relay kept: the season as it now stands.
  takePostSeason(reply, key) {
    if (!reply?.season?.events?.length) return null;
    const code = reply.code;
    const kept = { code, key, view: { code, season: reply.season, members: reply.members ?? [], entries: reply.entries ?? {}, me: reply.me ?? null, admin: !!reply.admin }, at: Date.now() };
    const i = this.postSeasons.list.findIndex((s) => s.code === code);
    if (i >= 0) this.postSeasons.list[i] = kept;
    else this.postSeasons.list.push(kept);
    this.savePostSeasons();
    return kept;
  }
  dropPostSeason(code) {
    this.postSeasons.list = this.postSeasons.list.filter((s) => s.code !== code);
    for (const key of Object.keys(this.postSeasons.rounds)) if (key.startsWith(`${code}:`)) delete this.postSeasons.rounds[key];
    if (this.postSeasons.current === code) this.postSeasons.current = this.postSeasons.list[0]?.code ?? null;
    this.savePostSeasons();
  }

  // Asks the relay and keeps what it says. Null if it couldn't (said on
  // the card): taken off it, or the season's ended, it's dropped here.
  async seasonAsk(S, op, what = {}) {
    try {
      const reply = op === "read" ? await this.seasonStore().read(S.code, S.key) : await this.seasonStore().send(S.code, S.key, op, what);
      this.postNote = null;
      if (reply.ended) this.dropPostSeason(S.code);
      else this.takePostSeason(reply, S.key);
      return reply;
    } catch (err) {
      this.postNote = err.message;
      if (err.status === 404 || (err.status === 403 && op === "read")) {
        this.dropPostSeason(S.code);
        this.onToast(`${S.view.season.name}: ${err.status === 404 ? "it's ended" : "you're not in it any more"} - it's off this PC`, 5000);
      }
      return null;
    } finally {
      this.renderPostSeasons();
    }
  }

  // Brought up to date when the card first shows for a season, and on
  // Refresh.
  refreshPostSeasonOnce(S) {
    this.postFetched ??= new Set();
    if (!S || this.postFetched.has(S.code) || !this.seasonStore().on) return;
    this.postFetched.add(S.code);
    this.seasonAsk(S, "read");
  }

  // Once, when the game opens (app.js, once the relay's known): each season
  // asked how it stands, and an event open that this bay hasn't played
  // said - with the days left.
  async postSeasonNotices() {
    if (this.postNoticed || !this.seasonStore().on) return;
    this.postNoticed = true;
    this.postFetched ??= new Set();
    const list = [...this.postSeasons.list];
    for (const S of list) this.postFetched.add(S.code);
    for (const kept of list) {
      await this.seasonAsk(kept, "read");
      const line = this.postSeasonWaiting(this.postSeasonOf(kept.code));
      if (line) (this.onNotice ?? this.onToast)(`${line} - the Online tab's Seasons`, 8000);
    }
  }
  // What waits for this bay on a season, in a line, or "".
  postSeasonWaiting(S) {
    if (!S) return "";
    const v = S.view;
    const k = currentEvent(v.season);
    if (k < 0 || eventState(v.season, k) !== "open") return "";
    const mine = myRound(v, k, this.postSeasons.rounds[roundOf(S.code, k)] ?? null);
    const by = dateWords(eventWindow(v.season, k).closes);
    if (mine === "play") return `${v.season.name}: ${v.season.events[k].name} is open - play your round by ${by}`;
    if (mine === "carry") return `${v.season.name}: carry on your round of ${v.season.events[k].name} (by ${by})`;
    if (mine === "send") return `${v.season.name}: your round of ${v.season.events[k].name} isn't sent yet`;
    return "";
  }
  // How many seasons wait on this bay (the Online tab's number).
  postSeasonsWaiting() {
    return this.postSeasons.list.filter((S) => this.postSeasonWaiting(S)).length;
  }

  // ---- Making and joining ------------------------------------------------------------

  // A season's link opened (its web page's button, a friend's message:
  // app.js): one already here is shown; else its code typed in, to join.
  askToJoinPostSeason(code) {
    const c = readSeasonCode(code);
    if (!c) return;
    if (this.postSeasonOf(c)) this.postSeasons.current = c;
    else this.postJoinWanted = c;
    this.postForm = this.postSeasonOf(c) ? null : "join";
    if (this.onOnlineTab) this.onOnlineTab("seasons");
    this.renderPostSeasons();
  }

  // The courses its events go round: those that come with the game with
  // `holes` holes or more, each with its first holes - with own: the rest
  // here too (this PC's own, and friends' it has fetched), each shared (the
  // same code if it's unchanged since it was last shared; a friend's, its
  // own code), its event's course the shared copy everyone fetches.
  async postSeasonCourses(holes, { own = false } = {}) {
    const out = [];
    for (const c of (this.list ?? []).filter(fromGame)) {
      const h = await this.courseHoles(c.id, holes);
      if (h) out.push({ id: c.id, name: c.name, holes: h });
    }
    if (!own) return out;
    for (const c of (this.list ?? []).filter((x) => !fromGame(x))) {
      const h = await this.courseHoles(c.id, holes);
      if (!h) continue;
      const r = await fetch("/api/courses/share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: c.id }) })
        .then((res) => res.json())
        .catch(() => null);
      if (!r?.code) throw new Error(`Couldn't share ${c.name} for it: ${r?.error ?? "no answer - check the internet"}`);
      // Once each: a course and a copy of it fetched back are one code.
      if (!out.some((o) => o.id === sharedId(r.code))) out.push({ id: sharedId(r.code), name: c.name, holes: h });
    }
    return out;
  }

  // An event's course this PC (or phone) hasn't got: a shared one fetched
  // by its code. True once it's here.
  async fetchEventCourse(e) {
    const code = codeOfShared(e.course);
    if (!code) return false;
    this.onToast(`Fetching ${e.courseName} for the season...`, 3000);
    try {
      const r = await fetch("/api/courses/shared", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      if (!r.ok) return false;
      await this.refreshList();
      return true;
    } catch {
      return false;
    }
  }

  // Made on the relay: this bay its maker, and its first player.
  async makePostSeason({ name, events, scoring, holes, days, way, level, player, own = false }) {
    const courses = await this.postSeasonCourses(holes, { own });
    const s = this.settings;
    const seed = (Date.now() & 0xffffff) | 1;
    const season = newPostSeason({ name, events, scoring, holes, way, level, days, tees: s.tees ?? null, courses, seed, weather: (k) => cleanConditions(rollConditions({ wind: s.wind, temp: s.temp, sky: s.sky, time: s.time, altitudeM: s.altitudeM, humidity: s.humidity }, seed + k * 7919)) });
    if (!season) throw new Error(own ? `None of the courses has ${holes} holes - try 9` : `None of the courses that come with the game has ${holes} holes - try 9`);
    const key = newSeasonKey();
    const reply = await this.seasonStore().create(key, { season, me: { name: player, own: await this.ownIndex(player) } });
    const S = this.takePostSeason(reply, key);
    this.postSeasons.current = S.code;
    this.savePostSeasons();
    return S;
  }

  // Joined with its code: in at once.
  async joinPostSeason(code, player) {
    const c = readSeasonCode(code);
    if (!c) throw new Error("A season's code is an S and five more letters or numbers (SK7-Q2M)");
    const key = newSeasonKey();
    const reply = await this.seasonStore().send(c, key, "join", { name: player, own: await this.ownIndex(player) });
    const S = this.takePostSeason(reply, key);
    this.postSeasons.current = S.code;
    this.postJoinWanted = null;
    this.savePostSeasons();
    return S;
  }

  // A season joined in a browser signed in to this PC (course/ladderweb.js
  // takeWebInbox): taken up with the key it joined with. Its name, or null
  // if it's here already; throws (with a status) if it's gone.
  async takeWebSeason(it) {
    if (this.postSeasonOf(it.code)) return null;
    const reply = await this.seasonStore().read(it.code, it.key);
    const S = this.takePostSeason(reply, it.key);
    this.renderPostSeasons();
    return S?.view.season.name ?? null;
  }

  // ---- The card ---------------------------------------------------------------------

  renderPostSeasons() {
    const el = this.onlinePostSeasonEl;
    if (!el?.isConnected) return;
    const list = this.postSeasons.list;
    const S = this.postSeasonOf(this.postSeasons.current) ?? list[0] ?? null;
    const head = `<h3>Seasons by post</h3>`;
    const note = this.postNote ? `<p class="small bad">${esc(this.postNote)}</p>` : "";
    if (!this.seasonStore().on) {
      el.innerHTML = `${head}<p class="small muted">Seasons by post go through the online play relay, and there isn't one set up.</p>`;
      return;
    }
    if (this.postForm === "make") {
      el.innerHTML = `${head}${this.postMakeHtml()}${note}`;
      return this.wirePostSeasons(el, null);
    }
    const pick = list.length > 1 ? `<p class="small"><label>Season <select data-post-pick>${list.map((x) => `<option value="${esc(x.code)}" ${x === S ? "selected" : ""}>${esc(x.view.season.name)}</option>`).join("")}</select></label></p>` : "";
    const join = `<div class="online-field"><input data-post-code type="text" maxlength="8" placeholder="SK7-Q2M" value="${esc(this.postJoinWanted ? showLadderCode(this.postJoinWanted) : "")}" autocomplete="off" aria-label="A season's code"><button ${this.postJoinWanted ? `class="primary"` : ""} data-post="join" title="Join it now - you're in from its next event open">Join a season by post</button> <button data-post="make" title="A season of your own: its events open one after another, each for the days you choose, and anyone you send its link to can join">Make one</button></div>`;
    if (!S) {
      el.innerHTML = `${head}<p class="small muted">A season whose events each stay open for days: everyone plays each event's round on their own, whenever they like before its deadline, and the scores go on its leaderboard as they come in - points by place (500 for first, 300, 190...) and the table across the events. Invite anyone with its link or code.</p>${join}${note}`;
      return this.wirePostSeasons(el, null);
    }
    this.refreshPostSeasonOnce(S);
    // (A season's link just opened: joining it first, at the top.)
    const wanted = this.postJoinWanted ? `<div class="ladder-card ladder-waiting"><p><b>Join the season ${esc(showLadderCode(this.postJoinWanted))}?</b> <span class="small muted">Its link was opened.</span></p>${join}</div>` : "";
    el.innerHTML = `${head}${wanted}${note}${pick}${this.postSeasonHtml(S)}${this.postJoinWanted ? "" : `<details class="online-presets"><summary>Another season</summary>${join}</details>`}`;
    this.wirePostSeasons(el, S);
  }

  // The form that makes one.
  postMakeHtml() {
    const sel = (id, list, names, chosen, title) => `<label title="${esc(title)}">${esc(names.label)} <select data-post-${id}>${opt(list, names, chosen)}</select></label>`;
    const n = (list, word) => Object.fromEntries(list.map((v) => [v, `${v}${word}`]));
    const way = this.ladderWayDefault?.() ?? "monitor";
    const levels = Object.fromEntries(LEVELS.map((l) => [l, SWING_LEVELS[l]?.label ?? l]));
    // Courses besides the game's here (made on this PC, or friends'): the
    // choice of those too.
    const ownToo = (this.list ?? []).some((c) => !fromGame(c));
    return `<p class="small muted">Its events go round the courses, one after another: the first opens when you start it, each stays open for its days, and the next opens as it closes. The tees and the weather (rolled now from yours), the day's cups and the luck are the same for everyone.</p>
      <label>Name <input data-post-name type="text" maxlength="40" placeholder="Winter by post" autocomplete="off"></label>
      <label>Your name in it <input data-post-player type="text" maxlength="30" value="${esc(this.seasonName())}" autocomplete="off"></label>
      ${sel("events", SEASON_LENGTHS, { ...n(SEASON_LENGTHS, " events"), label: "Events" }, DEFAULT_EVENTS, "How many events it runs to")}
      ${sel("days", DAY_CHOICES, { ...n(DAY_CHOICES, " days"), label: "Each open for" }, DEFAULT_DAYS, "How long each event's open: everyone plays its round before it closes")}
      ${sel("holes", HOLE_CHOICES, { ...n(HOLE_CHOICES, " holes"), label: "Rounds of" }, 9, "Each event's round: the course's first 9 holes, or all 18")}
      ${ownToo ? sel("courses", ["game", "own"], { game: "The ones that come with A² Golf", own: "Those and my other courses", label: "Courses" }, "game", "The courses that come with A² Golf (everyone has them) - or your own courses and friends' too: shared as it's made, and fetched by each player's PC, phone or browser when they play that event") : ""}
      ${sel("scoring", ["gross", "net"], { gross: "Gross - the fewest strokes", net: "Net - handicaps off", label: "Scoring" }, "gross", "Gross: the fewest strokes wins each event. Net: each player's handicap off first, as they begin their round")}
      ${sel("way", WAYS, { ...WAY_NAMES, label: "Swing with" }, way, "How everyone swings in it: a launch monitor, or the mouse, a finger or a controller at its one level")}
      ${sel("level", LEVELS, { ...levels, label: "Level" }, "amateur", "The one level every mouse, finger and controller swing plays at in it")}
      <div class="row-buttons"><button class="primary" data-post="create">Make it</button> <button data-post="cancel">Not now</button></div>`;
  }

  // One season: its line, how to invite, where you are with the event
  // that's open, its leaderboards, the table and who's in it.
  postSeasonHtml(S) {
    const v = S.view;
    const season = v.season;
    const now = Date.now();
    const started = Number.isFinite(season.started);
    const k = currentEvent(season, now);
    const parts = [`<p><b>${esc(season.name)}</b> <span class="small muted">${esc(rulesLine(season))}</span></p>`];
    parts.push(`<p class="small">Code <b>${esc(showLadderCode(S.code))}</b> - anyone with it, or its link, joins. <button data-post="share" title="Copy its link to send (on a phone, share it): it opens a page with the season's leaderboards and a button that opens A² Golf, ready to join">Share the link</button> <button data-post="qr">${this.postQr ? "Hide the QR code" : "QR code"}</button> <button data-post="read" title="How it stands now">Refresh</button></p>`);
    if (this.postQr) {
      const link = seasonJoinLink(this.ladderRelay?.() ?? "", S.code);
      if (link) parts.push(`<div class="ladder-card ladder-qr">${qrSvg(link)}<p class="small muted">Point a phone's camera at this: the season's page, with a button that opens A² Golf ready to join. Its leaderboards are there too, for anyone.</p></div>`);
    }
    if (!started) {
      const who = v.members.length;
      parts.push(
        v.admin
          ? `<div class="ladder-card ladder-waiting"><p><b>Not started yet - ${who} in it</b></p><p class="small">Send its link to everyone you want in it; they can join after it starts too. Start it and event 1 opens now, for ${esc(season.days)} days. <button class="primary" data-post="start">Start the season</button></p></div>`
          : `<p class="small">Waiting for whoever made it to start it - event 1 opens then, for ${esc(season.days)} days.</p>`,
      );
    }
    const line = postLine(v, now);
    if (line) parts.push(`<p class="small"><b>${esc(line)}</b></p>`);
    if (k >= 0 && started) parts.push(this.postEventHtml(S, k, now));
    // The last event closed: its leaderboard, the places it gave.
    const last = k < 0 ? season.events.length - 1 : k - 1;
    if (last >= 0 && started && eventState(season, last, now) === "closed") parts.push(`<details class="online-presets"><summary>${esc(season.events[last].name)} - how it finished</summary>${this.postBoardHtml(v, last, now)}</details>`);
    if (k < 0 && started) parts.push(`<p class="small"><b>Season over.</b></p>`);
    const table = postTable(v, now);
    if (table.length) parts.push(`<table class="online-match-table"><tr><th></th><th>Player</th><th>Points</th><th>Won</th><th>Played</th></tr>${table.map((r) => `<tr><td>${r.place}</td><td>${esc(r.name)}</td><td><b>${r.points.toLocaleString("en-GB")}</b></td><td>${r.wins}</td><td>${r.played}</td></tr>`).join("")}</table>`);
    parts.push(`<details class="online-presets"><summary>The events</summary><ol class="online-season-events">${season.events.map((e, i) => `<li class="${eventState(season, i, now) === "closed" ? "done" : ""}"><b>${esc(e.name)}</b> <span class="small muted">${esc(windowWords(season, i, now))}</span></li>`).join("")}</ol></details>`);
    const remove = (m) => (v.admin && m.id !== v.me?.id ? ` <button class="small" data-post="remove" data-id="${esc(m.id)}" title="Take ${esc(m.name)} out of the season">×</button>` : "");
    parts.push(`<details class="online-presets"><summary>In it (${v.members.length})</summary><p class="small">${v.members.map((m) => `${esc(m.name)}${Number.isFinite(m.own) ? ` (${m.own})` : ""}${remove(m)}`).join(", ")}</p></details>`);
    parts.push(`<p class="small">${v.admin ? `<button data-post="end" title="End it for everyone: it comes off the relay">End the season</button>` : `<button data-post="leave">Leave the season</button>`}</p>`);
    return parts.join("");
  }

  // The event open now (or the next to open): its dates, your round and
  // its leaderboard so far.
  postEventHtml(S, k, now) {
    const v = S.view;
    const e = v.season.events[k];
    const kept = this.postSeasons.rounds[roundOf(S.code, k)] ?? null;
    const mine = myRound(v, k, kept, now);
    const playing = this.round?.postSeason?.code === S.code && this.round.postSeason.k === k && !this.round.finished;
    const holes = v.season.holes;
    const how = `One go: no restarts, mulligans or gimmes - the same tees, cups, weather and luck for everyone.`;
    let act;
    if (playing) act = `You're playing your round now.`;
    else if (mine === "play") act = `<button class="primary" data-post="play" data-k="${k}" title="${esc(how)}">Play your round</button>`;
    else if (mine === "carry") act = `<button class="primary" data-post="play" data-k="${k}" title="Pick your round up where it stopped">Carry on your round</button> (from hole ${carryOn(kept, holes).from})`;
    else if (mine === "send") act = `Your round's played but not sent. <button class="primary" data-post="send" data-k="${k}">Send your round</button>`;
    else if (mine === "in") act = `Your round's in.`;
    else if (mine === "elsewhere") act = `You began your round on another PC - finish it there.`;
    else if (mine === "late") act = `Too late to send your round - it closed.`;
    else act = "";
    const board = eventState(v.season, k, now) === "open" ? this.postBoardHtml(v, k, now) : "";
    return `<div class="ladder-card"><p><b>${k + 1}. ${esc(e.name)}</b> <span class="small muted">${esc(e.courseName)}, ${holes} holes - ${esc(windowWords(v.season, k, now))}</span></p>${act ? `<p class="small">${act}</p>` : ""}${board}</div>`;
  }

  postBoardHtml(v, k, now) {
    const rows = leaderboard(v, k, now);
    if (!rows.length) return `<p class="small muted">No rounds in yet.</p>`;
    const me = v.me?.id;
    return `<table class="online-match-table"><tr><th></th><th>Player</th><th>Score</th></tr>${rows.map((r) => `<tr${r.id === me ? ` class="me"` : ""}><td>${r.playing ? "" : r.place}</td><td>${esc(r.name)}</td><td>${r.playing ? "playing" : esc(r.text)}</td></tr>`).join("")}</table>`;
  }

  wirePostSeasons(el, S) {
    el.querySelector("[data-post-pick]")?.addEventListener("change", (e) => {
      this.postSeasons.current = e.target.value;
      this.savePostSeasons();
      this.renderPostSeasons();
    });
    // (The way's level only matters for made-up swings.)
    const way = el.querySelector("[data-post-way]");
    const level = el.querySelector("[data-post-level]")?.closest("label");
    const showLevel = () => level && (level.hidden = way?.value === "monitor");
    way?.addEventListener("change", showLevel);
    showLevel();
    for (const b of el.querySelectorAll("[data-post]")) b.addEventListener("click", () => this.postClick(el, S, b));
  }

  async postClick(el, S, b) {
    const what = b.dataset.post;
    const k = Number(b.dataset.k);
    const q = (s) => el.querySelector(s);
    if (what === "make") {
      this.postForm = "make";
      this.postNote = null;
      return this.renderPostSeasons();
    }
    if (what === "cancel") {
      this.postForm = null;
      return this.renderPostSeasons();
    }
    if (what === "create" || what === "join") {
      const player = (what === "create" ? q("[data-post-player]")?.value : null)?.trim() || this.seasonName();
      b.disabled = true;
      try {
        if (what === "create") await this.makePostSeason({ name: q("[data-post-name]").value, events: Number(q("[data-post-events]").value), days: Number(q("[data-post-days]").value), holes: Number(q("[data-post-holes]").value), scoring: q("[data-post-scoring]").value, way: q("[data-post-way]").value, level: q("[data-post-level]").value, player, own: q("[data-post-courses]")?.value === "own" });
        else await this.joinPostSeason(q("[data-post-code]")?.value, player);
        this.postForm = null;
        this.postNote = null;
        const made = this.postSeasonOf(this.postSeasons.current);
        this.onToast(what === "create" ? `${made.view.season.name} made - send its link to everyone you want in it, then Start the season` : `You're in ${made.view.season.name}`, 5000);
      } catch (err) {
        this.postNote = err.message;
      }
      return this.renderPostSeasons();
    }
    if (!S) return;
    if (what === "read") {
      this.postFetched?.delete(S.code);
      return this.seasonAsk(S, "read");
    }
    if (what === "qr") {
      this.postQr = !this.postQr;
      return this.renderPostSeasons();
    }
    if (what === "share") return this.sharePostSeason(S);
    if (what === "start") {
      if (!(await this.askFirst(`Start ${S.view.season.name} now? Event 1 opens for ${S.view.season.days} days - anyone can still join after.`, { yes: "Start it", no: "Not yet" }))) return;
      const reply = await this.seasonAsk(S, "start");
      if (reply) this.onToast(`${S.view.season.name}: under way - event 1 is open`, 4000);
      return;
    }
    if (what === "remove") {
      const m = S.view.members.find((x) => x.id === b.dataset.id);
      if (m && (await this.askFirst(`Take ${m.name} out of ${S.view.season.name}? Their rounds so far stay on the events' leaderboards.`, { yes: "Take them out", no: "Not now", danger: true }))) await this.seasonAsk(S, "remove", { id: m.id });
      return;
    }
    if (what === "leave" || what === "end") {
      const text = what === "end" ? `End ${S.view.season.name} for everyone? Its leaderboards and table go, for good.` : `Leave ${S.view.season.name}? You come off it, and it off this PC.`;
      if (!(await this.askFirst(text, { yes: what === "end" ? "End it" : "Leave it", no: "Not now", danger: true }))) return;
      try {
        await this.seasonStore().send(S.code, S.key, what);
      } catch (err) {
        if (err.status !== 403 && err.status !== 404) {
          this.postNote = err.message;
          return this.renderPostSeasons();
        }
      }
      this.postNote = null;
      this.dropPostSeason(S.code);
      return this.renderPostSeasons();
    }
    if (what === "play") return this.playPostSeason(S, k);
    if (what === "send") return this.sendPostSeason(S, k);
  }

  async sharePostSeason(S) {
    const link = seasonJoinLink(this.ladderRelay?.() ?? "", S.code);
    if (!link) return;
    const text = `Join my season ${S.view.season.name} in A² Golf - each event's open for ${S.view.season.days} days, play it when you like: ${link} (code ${showLadderCode(S.code)})`;
    try {
      if (navigator.share) return void (await navigator.share({ title: S.view.season.name, text, url: link }));
      await navigator.clipboard.writeText(text);
      this.onToast("The season's link is copied - paste it to a friend", 3000);
    } catch {
      // Cancelled, or no clipboard: the code's on the card.
    }
  }

  // ---- Playing an event ---------------------------------------------------------------

  // Play your round: said to the relay (once), then played - or picked up
  // where it stopped on this PC.
  async playPostSeason(S, k) {
    const v = S.view;
    const e = v.season.events[k];
    const key = roundOf(S.code, k);
    let kept = this.postSeasons.rounds[key] ?? null;
    const mine = myRound(v, k, kept);
    if (mine !== "play" && mine !== "carry") return this.renderPostSeasons();
    // Your copy of the course must be the one it was made with (its first
    // holes' pars and lengths), or it isn't the same round.
    let holes = await this.courseHoles(e.course, v.season.holes);
    // A course shared for it (one of the maker's own) not here yet: fetched.
    if (!holes && (await this.fetchEventCourse(e))) holes = await this.courseHoles(e.course, v.season.holes);
    const same = holes && holes.every((h, i) => h.par === e.holes[i]?.par && h.yards === e.holes[i]?.yards);
    if (!same) return this.onToast(holes ? `Your ${e.courseName} isn't the same as the season's (its holes differ) - update A² Golf` : `This ${this.isPocket?.() ? "phone" : "PC"} hasn't ${e.courseName} - update A² Golf`, 6000);
    if (!(await this.leaveRound(`Play your round of ${e.name} now? It's one go - no restarts.`))) return;
    if (!kept) {
      const own = await this.ownIndex(v.me?.name ?? this.seasonName());
      const reply = await this.seasonAsk(S, "begin", { k, own });
      if (!reply) return this.onToast(this.postNote ?? "Couldn't begin it - try again", 4000);
      kept = { scores: [], at: Date.now(), done: false };
      this.postSeasons.rounds[key] = kept;
      this.savePostSeasons();
    }
    const go = carryOn(kept, v.season.holes);
    if (go.lost) this.onToast(`Hole ${go.lost} was left part way, so it counts as unfinished (par and 3)`, 5000);
    if (go.done) {
      this.postSeasons.rounds[key] = { ...kept, scores: Array.from({ length: v.season.holes }, (_, i) => (Number.isFinite(go.scores[i]) ? go.scores[i] : null)), done: true };
      this.savePostSeasons();
      return this.sendPostSeason(S, k);
    }
    const season = v.season;
    this.pendingPostSeason = { code: S.code, k, name: season.name, event: e.name, holes: season.holes, seed: e.seed, level: season.way === "monitor" ? null : season.level, players: [v.me?.name ?? this.seasonName()], tees: season.tees ?? null, pin: eventPinDay(season, k) };
    this.postCarry = go.scores;
    this.startRound(e.course, go.from, null, { weather: e.weather ?? undefined });
  }

  // A season's round just started (course.js startRound): the holes already
  // played on this PC put back on its card.
  resumePostSeason() {
    const r = this.round;
    const carried = this.postCarry;
    this.postCarry = null;
    if (!r?.postSeason || !carried?.length) return;
    carried.forEach((x, i) => {
      if (Number.isFinite(x)) r.players[0].scores[i] = x;
    });
  }

  // The event's holes played (course.js nextHole, lastOfRound).
  postSeasonOver(r = this.round) {
    return !!r?.postSeason && r.index >= 0 && r.index + 1 >= r.postSeason.holes;
  }

  // The round as it stands, kept on this PC: each hole as it's finished
  // (course.js nextHole), and each shot as it lands (so a hole left part
  // way is known: carryOn).
  keepPostSeason(r = this.round) {
    const ps = r?.postSeason;
    if (!ps || ps.recorded || r.index < 0) return;
    const p = r.players[0];
    const scores = Array.from({ length: ps.holes }, (_, i) => (Number.isFinite(p?.scores?.[i]) ? p.scores[i] : null));
    const finished = scores[r.index] != null;
    const key = roundOf(ps.code, ps.k);
    this.postSeasons.rounds[key] = { ...(this.postSeasons.rounds[key] ?? {}), scores, next: finished ? r.index + 1 : r.index, playing: !finished && (p?.strokes ?? 0) > 0 ? r.index : null, at: Date.now() };
    saveSetting("postSeasons", this.postSeasons);
  }

  // The round over (course.js finishRound): kept as played, then sent.
  postSeasonPlayed() {
    const ps = this.round?.postSeason;
    if (!ps || ps.recorded) return;
    ps.recorded = true;
    const scores = Array.from({ length: ps.holes }, (_, i) => (Number.isFinite(this.round.players[0]?.scores?.[i]) ? this.round.players[0].scores[i] : null));
    this.postSeasons.rounds[roundOf(ps.code, ps.k)] = { scores, at: Date.now(), done: true };
    this.savePostSeasons();
    if (scores.some((x) => x == null)) this.onToast(`${ps.event}: holes not finished count as par and 3`, 4000);
    const S = this.postSeasonOf(ps.code);
    if (S) this.sendPostSeason(S, ps.k);
  }

  // A played round's scores to the relay (once; kept here until they're in).
  async sendPostSeason(S, k) {
    const key = roundOf(S.code, k);
    const kept = this.postSeasons.rounds[key];
    if (!kept?.done) return;
    const name = S.view.season.events[k]?.name ?? S.view.season.name;
    const reply = await this.seasonAsk(S, "report", { k, scores: kept.scores });
    if (!reply) {
      // (Too late, or in already: nothing more to send.)
      if (/Too late|in already/.test(this.postNote ?? "")) {
        delete this.postSeasons.rounds[key];
        this.savePostSeasons();
      }
      return this.onToast(`${name}: your round couldn't be sent (${this.postNote ?? "no answer"})${this.postSeasons.rounds[key] ? " - it's kept: Send your round from the Online tab's Seasons" : ""}`, 6000);
    }
    delete this.postSeasons.rounds[key];
    this.savePostSeasons();
    const row = leaderboard(this.postSeasonOf(S.code)?.view, k).find((x) => x.id === reply.me?.id);
    this.onToast(`${name}: your round's in${row?.place ? ` - ${row.text}, ${ordinal(row.place)} so far` : ""}`, 6000);
  }
}

const ordinal = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
