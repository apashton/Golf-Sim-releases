// Match ladders (sim/matchladder.mjs; docs/LADDERS.md): the Match ladder
// section of the panel, the card before a match, the match played as a
// course round, and its result.
//   - At the bay: friends on this PC - the challenger and the defender play
//     a round of match play over the ladder's holes, its strokes the
//     ladder's (frozen as the match starts).
//   - Solo: you against the made-up golfer on the rung you challenge, whose
//     scores come hole by hole as you play (sim/matchladder.mjs botScores),
//     shown beside yours on the picture.
// A match is over once it's decided (3&2) or the ladder's holes are
// played. Kept as the "ladders" setting: { list: [ladder], current: id,
// as: { ladderId: whoChallenges }, rounds: { postal round kept as it's
// played }, seen: { postal reveal shown } } (course/ladderpostal.js).
// Part of CourseMode (course.js), split out of it: these methods are
// added to CourseMode.prototype there and run with `this` the course.

import { cleanUnsent } from "../sim/ladderunsent.mjs";
import {
  KINDS, KIND_NAMES, KIND_HELP, PLAY_NAMES, PLAY_HELP, WAYS, WAY_NAMES, LEVELS, HOLE_CHOICES, GIMME_CHOICES, SEASONS, SEASON_NAMES, DEFAULT_HOLES, DEFAULT_GIMME,
  NO_INDEX, RULES, SCOPE_PLAYS, ladderScope, scopeLadders, scopeLadder, newLadder, cleanLadder, reachOf, withEvent, ladderState, challengeable, challengeProblem, preview, headToHead, playerIndex, botScores, matchResult, resultWords,
  PLACE_CHOICES, PLACE_NAMES, DEFAULT_PLACES, joinedWords,
} from "../sim/matchladder.mjs";
import { oddsWords, changeWords, expected } from "../sim/elo.mjs";
import { honoursBoard, streakOf, resultNotes, idleWarning } from "../sim/ladderfun.mjs";
import { ladderIndexWords } from "../sim/ladderhcp.mjs";
import { hcpWords } from "../sim/season.mjs";
import { isGuest } from "../sim/profiles.mjs";
import { LEVELS as SWING_LEVELS } from "../sim/swinglevels.mjs";
import { scoreName } from "../sim/courseplay.mjs";
import { standingsFor } from "../sim/formats.mjs";
import { waitingNote } from "../sim/panelsections.mjs";
import { saveSetting, esc } from "../util.js";

const newMatchId = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
const GIMME_NAMES = { 0: "None", 2: "Inside 2 ft", 3: "Inside 3 ft" };
const dayWords = (t) => new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "short" });

export class CourseMatchLadder {
  // ---- Kept ---------------------------------------------------------------------

  // The ladders as kept, made sound (course.js constructor).
  readLadders(kept) {
    const list = (Array.isArray(kept?.list) ? kept.list : []).map((x) => (x?.online ? this.readOnline(x) : cleanLadder(x))).filter(Boolean);
    const obj = (x) => (x && typeof x === "object" && !Array.isArray(x) ? x : {});
    return { list, current: list.some((l) => l.id === kept?.current) ? kept.current : (list[0]?.id ?? null), as: obj(kept?.as), rounds: obj(kept?.rounds), seen: obj(kept?.seen), alertToken: typeof kept?.alertToken === "string" ? kept.alertToken : null, unsent: cleanUnsent(kept?.unsent) };
  }
  saveLadders() {
    saveSetting("ladders", this.ladders);
    // (The online ones to the server, for a browser signed in to this PC:
    // course/ladderweb.js.)
    this.reportLadders?.();
  }
  currentLadder() {
    return this.ladders.list.find((l) => l.id === this.ladders.current) ?? null;
  }
  putLadder(L) {
    this.ladders.list = this.ladders.list.map((x) => (x.id === L.id ? L : x));
    this.saveLadders();
  }
  // A ladder off this PC (Delete; or once left, online): an online match of
  // it being set up goes with it.
  dropLadder(L) {
    this.ladders.list = this.ladders.list.filter((x) => x.id !== L.id);
    this.ladders.current = this.ladders.list[0]?.id ?? null;
    this.ladderCard = null;
    if (L.online && this.pendingNetLadder?.code === L.online.code) this.pendingNetLadder = null;
    if (L.online && this.ladderLeaving === L.online.code) this.ladderLeaving = null;
    this.saveLadders();
    this.renderLadder();
  }

  // Who challenges on a ladder: solo, its one real player; at the bay, the
  // one picked (else the first real player on it).
  ladderMe(L, s) {
    // Online: this bay's own player on it, once let in.
    if (L.online) return L.online.me?.admitted && s.players[L.online.me.id] ? L.online.me.id : null;
    const real = s.rungs.filter((id) => !s.players[id].bot);
    if (L.play === "solo") return real[0] ?? null;
    const as = this.ladders.as[L.id];
    return real.includes(as) ? as : (real.at(-1) ?? null);
  }

  // A player's handicap to join with: their own, for how they play now
  // (course/season.js seasonHandicap: their rounds', typed in, or their
  // level's start) - null without one.
  async ownIndex(name) {
    try {
      const p = await this.seasonHandicap(name);
      return Number.isFinite(p.index) ? p.index : null;
    } catch {
      return null;
    }
  }

  // ---- The panel's section ------------------------------------------------------

  // Where the ladders are drawn: the course panel's section, the ones
  // played on this PC (at the bay, solo) - on the phone too, the panel
  // opened at it (app.js openLadderPanel) - and the Online tab's Ladders,
  // the ones against other people online (live, postal: app.js
  // gives it onlineLadderEl). Each ladder in one place only.
  ladderBodies() {
    const out = [];
    const course = this.panel?.querySelector("#course-ladder-body");
    if (course) out.push([course, "offline"]);
    if (this.onlineLadderEl?.isConnected) out.push([this.onlineLadderEl, "online"]);
    return out;
  }
  renderLadder() {
    for (const [el, scope] of this.ladderBodies()) this.renderLadderInto(el, scope);
    // (Its heading's note, seen while the section's folded on the phone:
    // what's waiting on the online ladders - sim/panelsections.mjs.)
    const head = this.panel?.querySelector("#course-ladder > h3");
    if (!head) return;
    let waiting = [];
    try {
      waiting = this.ladderWaiting?.() ?? [];
    } catch {
      waiting = [];
    }
    const note = waitingNote(waiting);
    if (head.dataset.note !== note) head.dataset.note = note;
  }
  renderLadderInto(el, scope = "offline") {
    const L = scopeLadder(this.ladders.list, this.ladders.current, scope);
    // (What's pressed here is about this ladder: the last used from now.)
    el.dataset.ladder = L?.id ?? "";
    if (!el.dataset.follows) {
      el.dataset.follows = "1";
      const follow = () => {
        const id = el.dataset.ladder;
        if (id && this.ladders.current !== id && this.ladders.list.some((x) => x.id === id)) this.ladders.current = id;
      };
      el.addEventListener("pointerdown", follow, true);
      el.addEventListener("focusin", follow, true);
    }
    if (!L || this.ladderForm === scope || this.ladderForm === true) {
      this.renderLadderForm(el, scope);
      // (Online: the open ladders under it - course/ladderopen.js.)
      return this.appendOpenLadders(el, scope);
    }
    const now = Date.now();
    const s = ladderState(L, now);
    const me = this.ladderMe(L, s);
    this.refreshOnlineOnce(L);
    const r = this.round;
    const playing = r?.ladder && r.ladder.id === L.id && !r.finished ? r.ladder : null;
    const reach = me && !playing ? challengeable(s, L, me, now) : [];
    const can = new Map(reach.map((x) => [x.id, x]));
    const showIdx = L.kind === "handicap";
    const rows = s.rungs
      .map((id, i) => {
        const p = s.players[id];
        const h = playerIndex(s, id, now);
        const c = can.get(id);
        const rec = `${p.won}-${p.lost}${p.halved ? `-${p.halved}` : ""}`;
        // (Their run now, in the record's line; away, by the name.)
        const run = streakOf(s, id);
        const runWords = [run.won >= 2 ? `${run.won} wins in a row` : "", run.defended >= 2 ? `${run.defended} defences held in a row` : ""].filter(Boolean).join("; ");
        const away = p.awayUntil && p.awayUntil > now ? ` <span class="muted small" title="Away till ${esc(dayWords(p.awayUntil))}: not to be challenged">away</span>` : "";
        const act = c ? (c.ok ? `<button data-ladder-challenge="${esc(id)}" title="Challenge ${esc(p.name)} for rung ${i + 1}">Challenge</button>` : `<span class="muted small" title="${esc(c.why)}">-</span>`) : "";
        return `<tr class="${id === me ? "me" : ""}"><td>${i + 1}</td><td>${esc(p.name)}${away}</td><td title="Rating">${p.rating}</td>${showIdx ? `<td title="${esc(p.bot ? "A made-up golfer's handicap" : `Ladder handicap: ${ladderIndexWords(h)}`)}">${h.index == null ? `<span class="muted">${NO_INDEX}</span>` : hcpWords(h.index)}</td>` : ""}<td title="Won-lost-halved${runWords ? `; ${esc(runWords)}` : ""}">${rec}</td><td>${act}</td></tr>`;
      })
      .join("");
    const real = s.rungs.filter((id) => !s.players[id].bot);
    const last = s.results.slice(-4).reverse();
    const champs = s.honours.slice(-3).reverse();
    // (The slide coming: three weeks without a match, not away.)
    const idle = me ? idleWarning(s, L, me, now) : null;
    const missing = L.play === "bay" ? this.players.filter((n) => !isGuest(n) && !s.players[n]) : [];
    const mine = scopeLadders(this.ladders.list, scope);
    // (The online ladders are the Online tab's alone: the course panel
    // says nothing of them - the owner, 3 November 2026: "Online options
    // don't need to be a thing in Courses, that's only in the online
    // section".)
    el.innerHTML = `
      ${mine.length > 1 ? `<label>Ladder <select id="ladder-pick">${mine.map((l) => `<option value="${esc(l.id)}" ${l.id === L.id ? "selected" : ""}>${esc(l.name)}</option>`).join("")}</select></label>` : ""}
      <p><b>${esc(L.name)}</b> - ${KIND_NAMES[L.kind]}, ${PLAY_NAMES[L.play].toLowerCase()}${L.online ? " (online)" : ""}, ${L.holes} holes${L.way === "monitor" ? "" : ` (${WAY_NAMES[L.way].toLowerCase()}${L.way !== "monitor" ? `, ${SWING_LEVELS[L.level].label}` : ""})`}. ${esc(s.season.name)}.</p>
      ${L.online ? this.revealHtml(L, s) + this.onlineHtml(L, s) : ""}
      ${L.play === "bay" && real.length > 1 ? `<label title="Who's picking someone to challenge">Challenger <select id="ladder-as">${real.map((id) => `<option value="${esc(id)}" ${id === me ? "selected" : ""}>${esc(s.players[id].name)}</option>`).join("")}</select></label>` : ""}
      ${playing ? `<p class="small ladder-live">${esc(this.ladderLiveWords() ?? "")}</p>` : ""}
      <table class="season-table ladder-table"><tr><th></th><th>Player</th><th title="Elo rating">Rating</th>${showIdx ? "<th title=\"Ladder handicap\">Hcp</th>" : ""}<th title="Won-lost-halved">W-L</th><th></th></tr>${rows}</table>
      ${this.ladderCard ? this.ladderCardHtml(L, s) : ""}
      ${idle ? `<p class="small">No match for ${idle.days} days: ${idle.slideIn ? `in ${idle.slideIn} more` : "now"} you slip a rung, and a rung a week after - challenge someone${L.online ? ", or say you're away" : ""}.</p>` : ""}
      ${last.length ? `<p class="small muted">${last.map((x) => esc(resultWords(s, x)) + (x.changes && x.changes[x.by] != null && !x.walkover ? ` (${changeWords(x.changes[x.by])})` : "") + resultNotes(s, x).map((n) => ` - ${esc(n)}`).join("")).join("<br>")}</p>` : `<p class="small muted">${s.waiting ? "No challenges till it starts - then challenge someone above you, beat them and take their rung." : me ? (s.rungs[0] === me ? "You're on top: the others challenge you." : `Challenge someone up to ${reachOf(s, me)} rungs above you: beat them and take their rung.`) : L.online ? "" : "Add who's playing to the ladder to start."}</p>`}
      ${champs.length ? `<p class="small">Champions: ${champs.map((h) => `${esc(h.season)} - ${esc(s.players[h.champion]?.name ?? "?")}`).join("; ")} <button id="ladder-honours" title="Every season's champion, and who's won most">${this.ladderHonours ? "Hide the honours board" : "Honours board"}</button></p>` : ""}
      ${champs.length && this.ladderHonours ? this.honoursHtml(s) : ""}
      <div class="row-buttons">
        ${missing.length ? `<button id="ladder-add" title="Add ${esc(missing.join(", "))} (who's playing) to the ladder, at the bottom">Add ${esc(missing.length === 1 ? missing[0] : `${missing.length} players`)}</button>` : ""}
        <button id="ladder-new">${scope === "online" ? "New online ladder" : "New ladder"}</button>
        <button id="ladder-delete" title="${L.online ? (L.online.me?.admitted ? "Leave the ladder: you come off its rungs for everyone, and it comes off this PC" : "Take it off this PC") : "Delete it, results and all"}">${L.online?.me ? "Leave" : L.online ? "Remove" : "Delete"}</button>
      </div>`;
    const $ = (q) => el.querySelector(q);
    $("#ladder-pick")?.addEventListener("change", (e) => {
      this.ladders.current = e.target.value;
      this.ladderCard = null;
      this.saveLadders();
      this.renderLadder();
    });
    $("#ladder-as")?.addEventListener("change", (e) => {
      this.ladders.as[L.id] = e.target.value;
      this.ladderCard = null;
      this.saveLadders();
      this.renderLadder();
    });
    for (const b of el.querySelectorAll("[data-ladder-challenge]")) b.addEventListener("click", () => this.openLadderCard(me, b.dataset.ladderChallenge));
    $("#ladder-honours")?.addEventListener("click", () => {
      this.ladderHonours = !this.ladderHonours;
      this.renderLadder();
    });
    $("#ladder-add")?.addEventListener("click", async () => {
      let next = this.currentLadder();
      for (const name of missing) next = withEvent(next, { type: "join", t: Date.now(), id: name, name, own: await this.ownIndex(name) });
      this.putLadder(next);
      this.renderLadder();
    });
    $("#ladder-new").addEventListener("click", () => {
      this.ladderForm = scope;
      this.renderLadder();
    });
    $("#ladder-delete").addEventListener("click", async () => {
      // (Online: leaving it for everyone - handed over first by its admin,
      // course/ladderonline.js. At the bay and solo: only ever on this PC.)
      if (L.online) return this.leaveOnline(L);
      if (!(await this.askFirst(`Delete ${L.name}? Its rungs, ratings and results go.`, { yes: "Delete it", no: "Keep it", danger: true }))) return;
      this.dropLadder(L);
    });
    this.wireLadderCard(el, L, me);
    if (L.online) {
      this.wireOnline(el, L);
      this.wirePostal(el, L);
    }
    this.appendOpenLadders(el, scope);
  }

  // The honours board: every season's champion, and who's won most.
  honoursHtml(s) {
    const b = honoursBoard(s);
    return `<div class="ladder-card"><p><b>Honours board</b></p>
      <table class="season-table"><tr><th>Season</th><th>Champion</th></tr>${b.rows.map((r) => `<tr><td>${esc(r.season)}</td><td>${esc(r.name)}</td></tr>`).join("")}</table>
      <p class="small">${b.titles.map((t) => `${esc(t.name)} ${t.n} title${t.n === 1 ? "" : "s"}`).join(", ")}</p></div>`;
  }

  // A new ladder: its name and rules - on the course panel one played on
  // this PC (at the bay, or solo against made-up golfers), on the Online
  // tab one against other people online (live, or by post: sim/
  // matchladder.mjs SCOPE_PLAYS).
  renderLadderForm(el, scope = "offline") {
    const any = scopeLadders(this.ladders.list, scope).length > 0;
    // Online ladders need the relay: without it the form says so, and
    // can't make or join one.
    const online = scope === "online";
    const reach = !online || this.ladderStore().on;
    const plays = SCOPE_PLAYS[online ? "online" : "offline"];
    const sel = (id, list, names, v, title = "") => `<select id="${id}" ${title ? `title="${esc(title)}"` : ""}>${list.map((x) => `<option value="${x}" ${x === v ? "selected" : ""}>${esc(names[x])}</option>`).join("")}</select>`;
    const play0 = online ? "live" : this.players.filter((n) => !isGuest(n)).length > 1 ? "bay" : "solo";
    const name0 = online ? "Online ladder" : this.players.length > 1 ? "Bay ladder" : "Solo ladder";
    el.innerHTML = `<p class="muted small">One against one, match play, on a ladder of rungs: challenge someone up to three above you, beat them and take their rung. A rating (Elo) works underneath: the odds, what a win's worth.</p>
      ${online && !reach ? `<p class="menu-status bad">Online ladders need the online server, and this ${this.isPocket?.() ? "phone" : "PC"} can't reach it just now - check the internet connection, then try again.</p>` : ""}
      <label title="What the ladder's called on the panel and in its results">Name <input id="ladder-name" maxlength="40" value="${esc(name0)}"></label>
      <label title="${esc(plays.map((k) => `${PLAY_NAMES[k]}: ${PLAY_HELP[k]}`).join(" "))}">Play ${sel("ladder-play", plays, PLAY_NAMES, play0)}</label>
      <label title="${esc(`${KIND_NAMES.handicap}: ${KIND_HELP.handicap} ${KIND_NAMES.scratch}: ${KIND_HELP.scratch}`)}">Kind ${sel("ladder-kind", KINDS, KIND_NAMES, "handicap")}</label>
      <label title="Holes in a match (a 9-hole match on an 18-hole course plays its first nine)">Holes ${sel("ladder-holes", HOLE_CHOICES, { 9: "9", 18: "18" }, DEFAULT_HOLES)}</label>
      <label title="How everyone swings on this ladder: a launch monitor, or the mouse, a finger or a controller - every made-up swing at the ladder's one level">Swing with ${sel("ladder-way", WAYS, WAY_NAMES, this.ladderWayDefault?.() ?? "monitor")}</label>
      <label title="The one level every mouse, finger and controller swing plays at on this ladder">Level ${sel("ladder-level", LEVELS, Object.fromEntries(LEVELS.map((l) => [l, SWING_LEVELS[l].label])), "amateur")}</label>
      <label title="A putt this close is given">Gimmes ${sel("ladder-gimme", GIMME_CHOICES, GIMME_NAMES, DEFAULT_GIMME)}</label>
      <label title="A season's champion is rung 1 at its end; the rungs carry on">Seasons ${sel("ladder-season", SEASONS, SEASON_NAMES, "month")}</label>
      ${online ? `<label title="Places: whoever joins takes one at once - nobody to let in - and the ladder starts by itself when the last one goes, its rungs drawn then. None set: you let each player in, and it's under way from the start">Places ${sel("ladder-places", PLACE_CHOICES, PLACE_NAMES, DEFAULT_PLACES)}</label>
      <label class="ladder-listed" title="Anyone: it's in the Online tab's Open ladders (and on the web) for anyone playing A² Golf to find and join. Only with the link: just the people you send its link or code to">Who can join <select id="ladder-listed"><option value="anyone">Anyone - in Open ladders</option><option value="link" selected>Only people sent the link</option></select></label>` : ""}
      <p class="muted small" id="ladder-who"></p>
      <div class="row-buttons"><button id="ladder-make" class="primary" ${reach ? "" : "disabled"}>Make the ladder</button>${any ? `<button id="ladder-cancel">Cancel</button>` : ""}</div>
      ${online && reach ? `<p class="small">Or join an online ladder: <input id="ladder-join-code" maxlength="8" placeholder="LK7-Q2M" title="The ladder's code, from whoever made it" style="width:7em" value="${esc(this.ladderJoinWanted ?? "")}"> <button id="ladder-join" title="Ask to join - the ladder's admin lets you in">Join</button></p>` : ""}`;
    const $ = (q) => el.querySelector(q);
    const who = () => {
      // (Who can join: only with places - one its admin lets players into
      // isn't for strangers.)
      const placed = Number($("#ladder-places")?.value ?? 0) > 0;
      const listed = el.querySelector(".ladder-listed");
      if (listed) listed.hidden = !placed;
      const solo = $("#ladder-play").value === "solo";
      const names = this.players.filter((n) => !isGuest(n));
      const live = $("#ladder-play").value === "live";
      const postal = $("#ladder-play").value === "postal";
      const joining = placed ? `send its link to the others (or list it for anyone): each takes a place as they join, and it starts by itself when they're all taken` : "send its code to the others, and let them in when they ask";
      $("#ladder-who").textContent = live
        ? `Online: ${this.seasonName()} on it from this bay, and you're its admin - ${joining}. Each match is an online game.`
        : postal
        ? `Online: ${this.seasonName()} on it from this bay, and you're its admin - ${joining}. Each of a match's two plays the same round when they like, in one go; the scores show when both are in.`
        : solo
        ? `${this.seasonName()} at the bottom, against nine made-up golfers round your handicap - the best at the top.`
        : names.length > 1
          ? `On it: ${names.join(", ")} (who's playing now), in that order - add more later.`
          : "At the bay needs two or more saved players in Who's playing.";
    };
    $("#ladder-play").addEventListener("change", who);
    $("#ladder-places")?.addEventListener("change", who);
    who();
    $("#ladder-cancel")?.addEventListener("click", () => {
      this.ladderForm = false;
      this.renderLadder();
    });
    $("#ladder-join")?.addEventListener("click", async () => {
      const code = $("#ladder-join-code").value.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (!/^L[A-Z0-9]{5}$/.test(code)) return this.onToast("A ladder's code is an L and five letters and numbers, like LK7-Q2M", 3500);
      const name = this.seasonName();
      try {
        const L = await this.joinOnline(code, { name, own: await this.ownIndex(name) });
        this.ladderForm = false;
        this.renderLadder();
        this.onToast(joinedWords(L, name), 4500);
      } catch (err) {
        this.onToast(err.message, 4000);
      }
    });
    $("#ladder-make").addEventListener("click", async () => {
      const play = $("#ladder-play").value;
      if (play === "live" || play === "postal") {
        const name = this.seasonName();
        try {
          const places = Number($("#ladder-places")?.value ?? 0);
          const listed = places > 0 && $("#ladder-listed")?.value === "anyone";
          const L = await this.makeOnline({ name: $("#ladder-name").value.trim() || "Match ladder", rules: { kind: $("#ladder-kind").value, play, way: $("#ladder-way").value, level: $("#ladder-level").value, holes: Number($("#ladder-holes").value), gimme: Number($("#ladder-gimme").value), season: $("#ladder-season").value, places, listed }, me: { name, own: await this.ownIndex(name) } });
          this.ladderForm = false;
          this.renderLadder();
          this.onToast(places ? `${L.name}: made - ${listed ? "it's in Open ladders, and " : ""}send its link to fill its ${places} places` : `${L.name}: made - send its code ${L.online.code} to the others`, 5000);
        } catch (err) {
          this.onToast(err.message, 4000);
        }
        return;
      }
      const names = play === "solo" ? [this.seasonName()] : this.players.filter((n) => !isGuest(n));
      if (play === "bay" && names.length < 2) return this.onToast("At the bay needs two or more saved players in Who's playing", 3500);
      const created = Date.now();
      const own = {};
      for (const n of names) own[n] = await this.ownIndex(n);
      let L = newLadder({ id: created.toString(36), name: $("#ladder-name").value.trim() || "Match ladder", kind: $("#ladder-kind").value, play, way: $("#ladder-way").value, level: $("#ladder-level").value, holes: Number($("#ladder-holes").value), gimme: Number($("#ladder-gimme").value), season: $("#ladder-season").value, created, seed: (created & 0xffffff) | 1, around: own[names[0]] });
      for (const n of names) L = withEvent(L, { type: "join", t: created + 1, id: n, name: n, own: own[n] });
      this.ladders.list.push(L);
      this.ladders.current = L.id;
      this.ladderForm = false;
      this.saveLadders();
      this.renderLadder();
      this.onToast(`${L.name}: ready - challenge someone above you`, 3000);
    });
  }

  // ---- The card before a match --------------------------------------------------

  async openLadderCard(by, of) {
    const L = this.currentLadder();
    if (!L) return;
    // Online: the odds and the rung; the one challenged picks the course.
    if (L.online) {
      this.ladderCard = { by, of, online: true };
      return this.renderLadder();
    }
    const courseId = this.settings.courseId ?? this.list[0]?.id;
    this.ladderCard = { by, of, courseId, holes: null };
    this.renderLadder();
    await this.ladderCardCourse(courseId);
  }

  // The course's first holes for the match (their par, length and stroke
  // index), for the strokes: fetched once.
  async ladderCardCourse(id) {
    const card = this.ladderCard;
    const L = this.currentLadder();
    if (!card || !L || !id) return;
    card.courseId = id;
    card.holes = null;
    try {
      const c = await fetch(`/api/courses/${encodeURIComponent(id)}`).then((res) => (res.ok ? res.json() : null));
      if (this.ladderCard !== card) return;
      card.holes = c ? c.holes.slice(0, L.holes).map((h) => ({ par: h.spec.par, yards: h.spec.yards, si: Number.isFinite(h.spec.si) ? h.spec.si : null })) : null;
      card.short = c && c.holes.length < L.holes;
    } catch {
      card.holes = null;
    }
    this.renderLadder();
  }

  ladderCardHtml(L, s) {
    const c = this.ladderCard;
    const a = s.players[c.by];
    const b = s.players[c.of];
    if (!a || !b) return "";
    const why = challengeProblem(s, L, c.by, c.of);
    if (c.online) {
      const odds = expected(a.rating, b.rating);
      const fav = odds > 0.52 ? `${a.name} ${oddsWords(odds)}` : odds < 0.48 ? `${b.name} ${oddsWords(1 - odds)}` : "about even";
      return `<div class="ladder-card"><p><b>${esc(a.name)}</b> (rung ${s.rungs.indexOf(c.by) + 1}) challenges <b>${esc(b.name)}</b> (rung ${s.rungs.indexOf(c.of) + 1})</p>
        <p class="small">Odds: ${esc(fav)}. Rung ${s.rungs.indexOf(c.of) + 1} at stake.${this.rivalryWords(s, c.by, c.of)} ${esc(b.name)} picks the course (its first ${L.holes} holes set the strokes) and has ${RULES.accept} days to answer, then ${RULES.play} to play.</p>
        ${why ? `<p class="small">${esc(why)}</p>` : ""}
        ${this.challengeLineHtml?.() ?? ""}
        <div class="row-buttons"><button id="ladder-play-match" class="primary" ${why ? "disabled" : ""}>Send the challenge</button><button id="ladder-card-cancel">Not now</button></div></div>`;
    }
    const courses = this.list.map((x) => `<option value="${esc(x.id)}" ${x.id === c.courseId ? "selected" : ""}>${esc(x.name)}</option>`).join("");
    let body = `<p class="small muted">Getting the course...</p>`;
    if (c.short) body = `<p class="small">That course has fewer than ${L.holes} holes - pick another.</p>`;
    else if (c.holes) {
      const p = preview(s, L, c.by, c.of, c.holes);
      const fav = p.odds > 0.52 ? `${a.name} ${oddsWords(p.odds)}` : p.odds < 0.48 ? `${b.name} ${oddsWords(1 - p.odds)}` : "about even";
      const holesWith = (id) =>
        p.strokes[id]
          .map((n, i) => (n ? `${i + 1}${n > 1 ? ` (${n})` : ""}` : null))
          .filter(Boolean)
          .join(", ");
      const strokes = L.kind !== "handicap" ? "No strokes - a scratch ladder." : p.give ? `${s.players[p.to].name} gets ${p.give} stroke${p.give === 1 ? "" : "s"}: hole${p.give === 1 ? "" : "s"} ${holesWith(p.to)}.` : "No strokes between them.";
      body = `<p class="small">Odds: ${esc(fav)}. ${esc(strokes)} Rung ${p.rung} at stake.${this.rivalryWords(s, c.by, c.of)}</p>`;
    }
    return `<div class="ladder-card"><p><b>${esc(a.name)}</b> (rung ${s.rungs.indexOf(c.by) + 1}) challenges <b>${esc(b.name)}</b> (rung ${s.rungs.indexOf(c.of) + 1})</p>
      <label>Course <select id="ladder-course">${courses}</select></label>
      ${body}
      ${why ? `<p class="small">${esc(why)}</p>` : ""}
      <div class="row-buttons"><button id="ladder-play-match" class="primary" ${c.holes && !c.short && !why ? "" : "disabled"}>Play the match</button><button id="ladder-card-cancel">Not now</button></div></div>`;
  }

  // The two's rivalry before a match: their head-to-head, and the one
  // challenged's run of defences.
  rivalryWords(s, by, of) {
    const h2h = headToHead(s, by, of);
    const a = s.players[by];
    const b = s.players[of];
    const run = streakOf(s, of);
    const parts = [];
    if (h2h.a + h2h.b + h2h.halved) parts.push(`Between them: ${esc(a.name)} ${h2h.a}, ${esc(b.name)} ${h2h.b}${h2h.halved ? `, halved ${h2h.halved}` : ""}.`);
    if (run.defended >= 2) parts.push(`${esc(b.name)} has held ${run.defended} challenges in a row.`);
    return parts.length ? ` ${parts.join(" ")}` : "";
  }

  wireLadderCard(el, L, me) {
    if (!this.ladderCard) return;
    el.querySelector("#ladder-course")?.addEventListener("change", (e) => this.ladderCardCourse(e.target.value));
    el.querySelector("#ladder-card-cancel")?.addEventListener("click", () => {
      this.ladderCard = null;
      this.renderLadder();
    });
    el.querySelector("#ladder-play-match")?.addEventListener("click", () => this.playLadderMatch());
    el.querySelector("#ladder-say")?.addEventListener("change", (e) => (this.ladderCard.line = e.target.value === "" ? null : Number(e.target.value)));
  }

  // The match begins: challenged and accepted at once (at the bay and
  // solo), its strokes frozen, and played as a round on the course.
  async playLadderMatch() {
    const c = this.ladderCard;
    let L = this.currentLadder();
    if (c?.online && L?.online) {
      this.ladderCard = null;
      return this.challengeOnline(L, c.of, c.line ?? null);
    }
    if (!c?.holes || !L) return;
    if (!(await this.leaveRound(`Play ${L.name}'s match?`))) return;
    // (The card closed, or another opened, while it asked.)
    if (this.ladderCard !== c) return;
    L = this.currentLadder();
    if (!L) return;
    const t = Date.now();
    const match = newMatchId();
    L = withEvent(L, { type: "challenge", t, by: c.by, of: c.of, match });
    L = withEvent(L, { type: "accept", t: t + 1, match, holes: c.holes, course: c.courseId });
    this.putLadder(L);
    const s = ladderState(L, t + 2);
    const bot = s.players[c.of].bot;
    this.pendingLadder = { id: L.id, match, players: bot ? [s.players[c.by].name] : [s.players[c.by].name, s.players[c.of].name] };
    this.ladderCard = null;
    this.renderLadder();
    this.startRound(c.courseId);
  }

  // ---- The match as a round -----------------------------------------------------

  // A round about to start (course.js startRound): the ladder's match it
  // is, or null - { id, match, by, of, holes, strokes, gimme, level, bot,
  // botScores, kind }.
  ladderRoundFor(pending) {
    if (!pending) return null;
    const L = this.ladders.list.find((l) => l.id === pending.id);
    if (!L) return null;
    // (As of its last event at least: a match started this millisecond.)
    const s = ladderState(L, L.events.reduce((t, e) => Math.max(t, e.t), Date.now()));
    const m = s.open.find((x) => x.match === pending.match);
    if (!m?.holes) return null;
    const bot = s.players[m.of].bot ? s.players[m.of] : null;
    return {
      id: L.id,
      name: L.name,
      match: m.match,
      by: m.by,
      of: m.of,
      byName: s.players[m.by].name,
      ofName: s.players[m.of].name,
      holes: m.holes.length,
      strokes: m.strokes,
      kind: L.kind,
      gimme: L.gimme,
      level: L.way === "monitor" ? null : L.level,
      bot: bot ? { id: bot.id, name: bot.name, own: bot.own } : null,
      botScores: bot ? botScores(L, m.match, bot, m.holes.map((h) => h.par)) : null,
      // Online: which of the two this bay is, and the ladder's code.
      ...(L.online ? { online: true, me: L.online.me?.id ?? null, code: L.online.code } : {}),
      // Postal: one player's round, its luck the match's (course/ladderpostal.js).
      ...(L.play === "postal" ? { postal: true, seed: m.seed ?? null } : {}),
    };
  }

  // Both sides' scores so far over the match's holes: { by: [..], of: [..] }
  // - the made-up golfer's only for the holes you've finished.
  ladderScores(r = this.round) {
    const lad = r?.ladder;
    if (!lad) return null;
    const n = lad.holes;
    const mine = (r.players[0]?.scores ?? []).slice(0, n);
    // (Postal: only this bay's round - the other's is hidden.)
    if (lad.postal) return { [lad.me]: mine };
    if (lad.bot) return { [lad.by]: mine, [lad.of]: lad.botScores.map((x, i) => (mine[i] == null ? null : x)) };
    const ids = this.ladderIds(r);
    const out = { [lad.by]: [], [lad.of]: [] };
    r.players.forEach((p, i) => {
      if (ids[i]) out[ids[i]] = (p.scores ?? []).slice(0, n);
    });
    return out;
  }

  // Which ladder player each of the round's players is: online, this bay's
  // own is this bay's ladder player and the other bay's the other (names
  // can be the same); here, by name, else in order (challenger first).
  ladderIds(r = this.round) {
    const lad = r.ladder;
    if (lad.postal) return r.players.map(() => lad.me);
    if (lad.online && r.net) {
      const other = lad.me === lad.by ? lad.of : lad.by;
      return r.players.map((p) => (p.remote ? other : lad.me));
    }
    const named = r.players.map((p) => (p.name === lad.byName ? lad.by : p.name === lad.ofName ? lad.of : null));
    return new Set(named).size === r.players.length && !named.includes(null) ? named : [lad.by, lad.of];
  }

  // Where the match stands: matchResult over the holes played.
  ladderStanding(r = this.round) {
    // (Postal: played blind - no standing until both rounds are in.)
    if (r?.ladder?.postal) return null;
    const sc = this.ladderScores(r);
    if (!sc) return null;
    const lad = r.ladder;
    return matchResult(sc[lad.by], sc[lad.of], lad.strokes?.[lad.by], lad.strokes?.[lad.of]);
  }

  // The match over: decided, or its holes played (course.js nextHole,
  // lastOfRound).
  ladderOver(r = this.round) {
    if (!r?.ladder || r.index < 0) return false;
    const st = this.ladderStanding(r);
    return r.index + 1 >= r.ladder.holes || (!!st && st.winner != null && st.left > 0 && st.up > st.left);
  }

  // The match in a line: "Ladder: Anna 2 up after 5", "Ladder: all square".
  ladderLiveWords(r = this.round) {
    const lad = r?.ladder;
    if (lad?.postal) return this.postalLiveWords(lad);
    const st = lad && this.ladderStanding(r);
    if (!st) return null;
    if (!st.played) return `${lad.name}: ${lad.byName} v ${lad.ofName}`;
    const who = st.winner === "a" ? lad.byName : st.winner === "b" ? lad.ofName : null;
    return `${lad.name}: ${who ? `${who} ${st.up} up` : "all square"} after ${st.played}`;
  }

  // For bay ladders, the round's game (course/netflights.js game): match
  // play over the ladder's holes with its own strokes.
  ladderGame() {
    const r = this.round;
    const lad = r.ladder;
    const holes = this.course.holes.slice(0, lad.holes).map((h, i) => ({ par: h.spec.par, yards: this.yardsOf(i), si: Number.isFinite(h.spec.si) ? h.spec.si : null }));
    const players = r.players.map((p) => ({ ...p, scores: p.scores.slice(0, lad.holes) }));
    const ids = this.ladderIds(r);
    const hs = players.map((_, i) => ({ courseHandicap: null, strokes: lad.strokes?.[ids[i]] ?? holes.map(() => 0) }));
    return { holes, hs, st: standingsFor("match", players, holes, hs, null), shown: true };
  }

  // Solo: the made-up golfer on the hole beside you - their strokes keeping
  // pace with yours until you've holed out (course/season.js holeGroup).
  ladderRows(i, rows) {
    const lad = this.round?.ladder;
    if (!lad?.bot || i >= lad.holes) return;
    const me = this.round.players[0];
    const score = lad.botScores[i];
    const done = me.scores[i] != null;
    const strokes = done ? score : Math.min(score, me.strokes || 0);
    const spec = this.course.holes[i].spec;
    rows.push({ name: lad.bot.name, colour: null, strokes, holed: done || strokes >= score, words: done ? scoreName(score, spec.par) : "" });
  }

  // The finished match, kept: its result on the ladder (course.js
  // finishRound). A round ended before the match was decided (or its holes
  // played) calls it off: nothing changes on the ladder - so no one can
  // walk off while ahead.
  ladderMatchPlayed() {
    const r = this.round;
    const lad = r?.ladder;
    if (!lad || lad.recorded) return;
    lad.recorded = true;
    // (Postal: this bay's round sent, the scores hidden until both are in.)
    if (lad.postal) return this.postalPlayed(lad);
    let L = this.ladders.list.find((l) => l.id === lad.id);
    if (!L) return;
    const scores = this.ladderScores(r);
    const st = this.ladderStanding(r);
    const t = Date.now();
    const over = !!st && (st.left === 0 || (st.winner != null && st.up > st.left));
    // Online: this bay's report; the relay puts it on the ladder when the
    // other bay's agrees (course/ladderonline.js). Left unfinished, the
    // ladder's own deadline decides it.
    if (lad.online) {
      if (over) this.reportOnline(lad, scores);
      else if (st?.played) this.onToast(`${lad.name}: the match was left unfinished - play it again before the ladder's deadline`, 5000);
      return;
    }
    if (!over) {
      this.putLadder(withEvent(L, { type: "cancel", t, match: lad.match }));
      if (st?.played) this.onToast(`${lad.name}: the match was left unfinished, so it's called off`, 5000);
      this.renderLadder();
      return;
    }
    L = withEvent(L, { type: "result", t, match: lad.match, scores });
    this.putLadder(L);
    const s = ladderState(L, t + 1);
    const res = s.results.find((x) => x.match === lad.match);
    if (res) {
      const me = res.changes?.[lad.by];
      this.onToast(`${lad.name}: ${resultWords(s, res)}${me != null ? ` (${lad.byName} ${changeWords(me)})` : ""}`, 7000);
    }
    this.renderLadder();
  }
}
