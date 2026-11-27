// The Tour's panel (the owner, 14 November 2026: "I don't see the tour?
// This should be really obvious and key in getting original players to
// come back ... in the beginning the main place to compete"): opened from
// the top bar's Tour, beside the modes and Online, and from the phone's
// home. This week - when it closes - and each event with what it is, your
// card (its 50 shots - the owner, 16 November 2026: "Top made and also top
// streak in that amount") and where you stand, its two boards side by side
// (the most made, the longest streak) and Play; last week's winners; the
// same boards on the web. The two divisions (a launch monitor's shots; the
// mouse's, a finger's and a controller's swings) are looked at one at a
// time.
//
// Thin: net/tourhub.mjs keeps the week and this account's places,
// tourplay.js plays an event, sim/tour.mjs has the rules and the words.

import { friendsLine } from "./sim/tourfriends.mjs";
import { EVENTS, EVENT_ORDER, DIVISIONS, DIVISION_ORDER, MEASURES, MEASURE_ORDER, SHOTS, FLIGHTS, SEASON_WEEKS, cardDone, weekWords, closesWords, greenLine, upDownLine, roundLine, placeWords, ordinal, toParWords, goodDivision, seasonWords } from "./sim/tour.mjs";
import { esc, loadSetting, saveSetting } from "./util.js";
import { ask } from "./askbox.js";

// The name the boards show for this device's runs: "name" (the player's)
// or "anon" (A player) - kept here, said with each run sent (tourplay.js).
export const shownAs = () => (loadSetting("tourName", "name") === "anon" ? "anon" : "name");

// What each event is, in a line or two (after its week's own numbers).
const RULES = {
  putt: `${SHOTS} putts this week, as and when you like - stop any time, and the rest are here next time. Two boards: the most holed, and the longest streak in a row.`,
  updown: `${SHOTS} chips this week, each putted out: one chip, one putt. A chip-in earns a life - good for one two-putt that keeps a streak going; miss the putt with no life, and the streak's over. Two boards: the most up and downs, and the longest streak.`,
};
// How many of each board are shown here (all its top places on the web).
const SHOWN = 8;

export class TourPanel {
  // hub: the TourHub. play(event): that event started (tourplay.js).
  // playing(): the event being played now, or null. account(): the
  // account in use here, or null. signIn(): the sign-in card.
  // firstDivision(): the board first shown on this device. onShow(open):
  // the top bar's Tour told. events: the ones that can be played here.
  // The week's round (tourplay.js): playRound(), sendRound(), roundState()
  // ("play" | "carry" | "send" | "in" | "elsewhere").
  // courses(): the week's round's course and the next weeks', as this game
  // stands with each (tourplay.js checkCourses: [{ week, course, name,
  // start, ready }], this week's first), or null till they're checked.
  constructor({ hub, play = () => {}, playing = () => null, leave = () => {}, account = () => null, signIn = () => {}, firstDivision = () => "monitor", onShow = () => {}, events = EVENT_ORDER, now = () => Date.now(), playRound = () => {}, sendRound = () => {}, roundState = () => "play", courses = () => null }) {
    Object.assign(this, { hub, play, playing, leave, account, signIn, firstDivision, onShow, events, now, playRound, sendRound, roundState, courses });
    const kept = loadSetting("tourBoard", null);
    this.division = goodDivision(kept) ? kept : null;
    // Whose boards: "everyone" or "friends" (scopeHtml).
    this.scope = "everyone";
    this.el = document.createElement("div");
    this.el.className = "bay-help online-play tour-panel";
    this.el.hidden = true;
    this.el.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-act]");
      if (b) this.act(b.dataset.act, b.dataset);
      else if (e.target === this.el) this.show(false);
    });
    // The name the boards show: the player's, or "A player".
    this.el.addEventListener("change", (e) => {
      const sel = e.target.closest("select[data-tour-name]");
      if (sel) saveSetting("tourName", sel.value === "anon" ? "anon" : "name");
    });
    document.body.appendChild(this.el);
    hub.onChange(() => this.open && this.render());
  }

  get open() {
    return !this.el.hidden;
  }

  show(on = true) {
    this.el.hidden = !on;
    this.onShow(on);
    if (!on) return;
    this.render();
    // (The owner's page as it is now, for the owner's account: once the
    // look's said whose this is.)
    Promise.resolve(this.hub.refresh())
      .then(() => this.open && this.hub.owner && this.hub.ownerView())
      .catch(() => {});
  }

  key(e) {
    if (!this.open) return false;
    if (e.key === "Escape") {
      this.show(false);
      e.preventDefault();
      return true;
    }
    return false;
  }

  act(act, data = {}) {
    if (act === "close") return this.show(false);
    if (act === "division" && goodDivision(data.division)) {
      this.division = data.division;
      saveSetting("tourBoard", this.division);
      return this.render();
    }
    if (act === "refresh") return this.hub.refresh({ force: true });
    // The boards: everyone's, or your friends' (the people in your match
    // ladders and seasons by post: hub.friendsBoard).
    if (act === "scope") {
      this.scope = data.scope === "friends" ? "friends" : "everyone";
      if (this.scope === "friends" && this.account()) {
        this.hub
          .friendsBoard?.()
          ?.then(() => this.open && this.render())
          .catch((err) => {
            this.note = err.message;
            if (this.open) this.render();
          });
      }
      return this.render();
    }
    if (act === "signin") return (this.show(false), this.signIn());
    if (act === "leave") return (this.leave(), this.render());
    if (act === "round") return (this.show(false), this.playRound());
    if (act === "round-send") return this.sendRound();
    if (act === "report") return this.report(data);
    if (act.startsWith("owner-")) return this.ownerDo(act.slice(6), data);
    if (act === "play") {
      // (Shut first: the event's own mode comes up behind it.)
      this.show(false);
      this.play(data.event);
    }
  }

  // A score on a board reported (step 4): asked first, then said.
  async report({ event, division, board, place, name, score }) {
    if (!(await ask(`Report ${name}'s ${score} on this board? The Tour's owner looks at what's reported, and can take a score off the boards.`, { yes: "Report it", no: "Cancel" }))) return;
    try {
      const r = await this.hub.report({ event, division, board, place: Number(place), name, score: Number(score), why: "score" });
      this.note = r.already ? "You've reported that one already - thanks." : "Reported - thanks. The Tour's owner will look at it.";
    } catch (err) {
      this.note = err.message;
    }
    this.render();
  }
  // The owner's page's buttons: an entry let on, hidden, shown again, or
  // its reports put away; a whole account hidden.
  async ownerDo(op, { key }) {
    if (op === "hide" && !(await ask("Hide it from the boards? Its player's told it's hidden; Show again puts it back.", { yes: "Hide it", no: "Cancel", danger: true }))) return;
    try {
      await this.hub.ownerAct(op, { key });
    } catch (err) {
      this.note = err.message;
    }
    this.render();
  }

  // A Report button on a board's row (not this account's own).
  reportCell(event, division, board, i, e, own) {
    // (Not on the friends board: a report names a place on everyone's.)
    if (own || !this.account() || this.scope === "friends") return "<td></td>";
    return `<td><button class="tour-report" data-act="report" data-event="${event}" data-division="${division}" data-board="${board}" data-place="${i}" data-name="${esc(e.name)}" data-score="${e.score}" title="Report this score to the Tour's owner">Report</button></td>`;
  }

  // The owner's page (for the accounts the relay's TOUR_OWNER names): what's
  // held for a look, what's been reported, and what's hidden - each a press
  // from on the boards, or off them.
  ownerHtml() {
    const o = this.hub.owner ? this.hub.ownerPage : null;
    if (!this.hub.owner) return "";
    if (!o) return `<section class="online-card tour-owner"><h3>The owner's page</h3><p class="small muted">Fetching what's held and reported...</p></section>`;
    const what = (x) => (x.kind === "round" || x.event === "round" || x.key?.startsWith("r:") ? EVENTS.round.short : esc(EVENTS[x.event]?.short ?? x.event ?? ""));
    const row = (cells, buttons) => `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}<td class="tour-owner-acts">${buttons}</td></tr>`;
    const btn = (op, key, label) => `<button data-act="owner-${op}" data-key="${esc(key)}">${label}</button>`;
    const held = (o.held ?? []).map((x) => row([esc(x.name), what(x), esc(x.score ?? ""), esc(x.why)], btn("release", x.key, "Let it on") + btn("hide", x.key, "Hide"))).join("");
    const reports = (o.reports ?? []).map((x) => row([esc(x.name), what(x), esc(String(x.score)), `${x.n} report${x.n === 1 ? "" : "s"}`], btn("hide", x.key, "Hide") + btn("dismiss", x.key, "Put away"))).join("");
    const hidden = (o.hidden ?? []).map((x) => row([esc(x.name), what(x), esc(x.score ?? ""), ""], btn("show", x.key, "Show again"))).join("");
    const table = (title, rows, empty) => `<h4>${title}</h4>${rows ? `<table class="clubs tour-board">${rows}</table>` : `<p class="small muted">${empty}</p>`}`;
    return `<section class="online-card tour-owner"><h3>The owner's page</h3>
      <p class="small muted">This week. Held: out of the ordinary, or a putt the relay rolled again that couldn't have dropped - shown to its player, not on the boards till you've looked.</p>
      ${table("Held for a look", held, "Nothing held.")}${table("Reported", reports, "Nothing reported.")}${table("Hidden", hidden, "Nothing hidden.")}</section>`;
  }

  // The board looked at: the one chosen, else this account's own (the one
  // it has a card on), else this device's.
  get shown() {
    if (this.division) return this.division;
    const mine = this.hub.mine ?? {};
    for (const d of DIVISION_ORDER) if (EVENT_ORDER.some((e) => mine[e]?.[d])) return d;
    return goodDivision(this.firstDivision()) ? this.firstDivision() : "monitor";
  }

  eventHtml(event, v, division) {
    const ev = EVENTS[event];
    const setup = v.setup?.[event];
    const what = !setup ? "" : event === "putt" ? greenLine(setup) : upDownLine(setup);
    const boards = v.boards?.[event]?.[division] ?? {};
    const card = this.hub.card(event, division);
    const st = this.hub.standing(event, division);
    // (Its places as the relay last said - once all that's played is sent.)
    const placed = st && st.shots === card.shots;
    const waiting = this.hub.waiting(event, division).length;
    // (Held for a look, or hidden: no places - it isn't on the boards.)
    const held = st?.held ?? null;
    const at = (m) => (placed && !held && st.places?.[m] ? ` (${esc(placeWords(st.places[m], st.count))})` : "");
    const mine = card.shots
      ? `<p class="tour-mine">Your ${SHOTS}: <b>${card.shots}</b> played${cardDone(card) ? "" : `, ${SHOTS - card.shots} left`}. ${esc(ev.made[0].toUpperCase() + ev.made.slice(1))} <b>${card.made}</b>${at("made")} · longest streak <b>${card.streak}</b>${at("streak")}${card.run && !cardDone(card) ? ` · ${card.run} in a row now` : ""}${waiting ? ` <span class="muted">- ${waiting} waiting to be sent</span>` : ""}${held ? `<br><span class="tour-held">${esc(held)}</span>` : ""}</p>`
      : "";
    // (This account's own row, as near as a board without accounts in it
    // can tell: its score, shots and place, under its player's name.)
    const me = this.account()?.player ?? null;
    const mineRow = (m, e) => placed && !held && e.score === card[m] && e.shots === card.shots && e.place === st.places?.[m] && (!me || e.name === me);
    const table = (m) => {
      const b = boards[m] ?? { count: 0, top: [] };
      const rows = b.top
        .slice(0, SHOWN)
        .map((e, i) => `<tr${mineRow(m, e) ? ' class="near"' : ""}><td>${e.place}</td><td>${esc(e.name)}${e.shots < SHOTS ? ` <span class="small muted">${e.shots}/${SHOTS}</span>` : ""}</td><td><b>${e.score}</b></td>${this.reportCell(event, division, m, i, e, mineRow(m, e) || (me && e.name === me))}</tr>`)
        .join("");
      return `<div><h4>${esc(MEASURES[m].name)}</h4>${rows ? `<table class="clubs tour-board"><tr><th>Place</th><th>Player</th><th>${m === "made" ? esc(ev.made[0].toUpperCase() + ev.made.slice(1)) : "In a row"}</th><th></th></tr>${rows}</table>` : `<p class="small muted">Nobody yet.</p>`}</div>`;
    };
    const count = boards.made?.count ?? boards.count ?? 0;
    const played = count ? `${count} playing this week` : "Nobody's played it yet this week - be the first";
    const can = this.events.includes(event);
    const on = this.playing() === event;
    const button = !can ? `<span class="small muted">To come</span>` : on ? `<button data-act="leave">Leave it</button>` : cardDone(card) ? `<span class="small muted">All ${SHOTS} played</span>` : `<button class="primary" data-act="play" data-event="${event}">${card.shots ? "Play on" : "Play it"}</button>`;
    return `<section class="online-card tour-event">
      <div class="tour-event-head"><h3>${esc(ev.name)}</h3>${button}</div>
      <p>${esc(what)}${what ? "." : ""}</p>
      <p class="small muted">${esc(RULES[event])}</p>
      ${mine}
      <p class="small muted">${esc(played)}${!card.shots && count ? " - not you yet" : ""}.</p>
      <div class="tour-boards">${MEASURE_ORDER.map(table).join("")}</div>
    </section>`;
  }

  // The week's round: what it is, this account's (its button, or its score
  // and places), and its boards - the world's, net and the flight's.
  roundHtml(v, division) {
    const R = v.round;
    if (!R?.setup) return "";
    const setup = R.setup;
    const mine = this.hub.mine?.round ?? null;
    const state = this.roundState();
    const boards = R.boards?.[division] ?? {};
    const par = setup.par ?? null;
    // This game and the week's course (and the next weeks'): one it can't
    // make as the Tour plays it needs an update first.
    const checked = this.courses();
    const here = checked?.[0]?.week === setup.week ? checked : null;
    const update = here && !here[0].ready && (state === "play" || state === "carry");
    const button = update
      ? `<span class="tour-update">Update A² Golf to play</span>`
      : ({ play: `<button class="primary" data-act="round">Play it</button>`, carry: `<button class="primary" data-act="round">Carry on</button>`, send: `<button class="primary" data-act="round-send">Send it</button>`, elsewhere: `<span class="small muted">Begun on another device</span>`, in: `<span class="small muted">Your round's in</span>` }[state] ?? "");
    const yours =
      state === "in" && mine?.sent && mine.held
        ? `<p class="tour-mine">Your round: <b>${mine.gross}</b> (${esc(toParWords(mine.toPar))}), net <b>${mine.net}</b><br><span class="tour-held">${esc(mine.held)}</span></p>`
        : state === "in" && mine?.sent
        ? `<p class="tour-mine">Your round: <b>${mine.gross}</b> (${esc(toParWords(mine.toPar))}), net <b>${mine.net}</b> - ${esc(placeWords(mine.places.world, mine.counts.world))} on the Tour, ${esc(ordinal(mine.places.net))} net, ${esc(placeWords(mine.places.flight, mine.counts.flight))} in your flight <span class="muted small">(${esc(DIVISIONS[mine.division]?.name.toLowerCase() ?? "")})</span></p>`
        : state === "carry"
          ? `<p class="tour-mine">Begun - <b>Carry on</b> from the next hole.</p>`
          : state === "send"
            ? `<p class="tour-mine">Played - it couldn't be sent: <b>Send it</b>.</p>`
            : "";
    const flight = mine ? mine.flight : null;
    const me = this.account()?.player ?? null;
    const table = (title, b, net, board) => {
      const rows = (b?.top ?? [])
        .slice(0, SHOWN)
        .map((e, i) => `<tr><td>${e.place}</td><td>${esc(e.name)}</td><td><b>${e.score}</b>${par ? ` <span class="small muted">${esc(toParWords(e.score - par))}</span>` : ""}</td>${this.reportCell("round", division, board, i, e, !!me && e.name === me)}</tr>`)
        .join("");
      return `<div><h4>${esc(title)}</h4>${rows ? `<table class="clubs tour-board"><tr><th>Place</th><th>Player</th><th>${net ? "Net" : "Score"}</th><th></th></tr>${rows}</table>` : `<p class="small muted">Nobody yet.</p>`}</div>`;
    };
    const count = boards.world?.count ?? 0;
    return `<section class="online-card tour-event">
      <div class="tour-event-head"><h3>${esc(EVENTS.round.name)}</h3>${button}</div>
      <p>${esc(roundLine(setup))}.</p>
      ${update ? `<p class="tour-update-line">This version of A² Golf doesn't have ${esc(setup.name)} as the Tour plays it - update A² Golf to play this week's round.</p>` : ""}
      ${this.aheadHtml(R, here)}
      <p class="small muted">One go: stroke play - no restarts, mulligans or gimmes, no skill points. Leave part way and carry it on from the next hole (one left part way counts as par and 3). Three boards: the world's, net of your handicap, and your flight's.</p>
      ${yours}
      <p class="small muted">${count ? `${count} in` : "Nobody's played it yet this week - be the first"}.</p>
      <div class="tour-boards">${table("The world", boards.world, false, "world")}${table("Net", boards.net, true, "net")}${flight != null ? table(FLIGHTS[flight], boards.flights?.[flight], false, `f${flight}`) : ""}</div>
    </section>`;
  }

  // The next weeks' courses (the relay's ahead): each Monday and course -
  // one this game can't make as the Tour plays it marked, to update for
  // before its week. (here: as this game stands with each, once checked.)
  aheadHtml(R, here) {
    const ahead = Array.isArray(R.ahead) ? R.ahead : [];
    if (!ahead.length) return "";
    const day = (t) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
    const items = ahead.map((a) => {
      const c = here?.find((x) => x.week === a.week && x.course === a.course);
      return c && !c.ready ? `<li class="tour-update">${esc(day(a.start))}: ${esc(a.name)} - update A² Golf before then to play it</li>` : `<li>${esc(day(a.start))}: ${esc(a.name)}${c ? ` <span class="tour-ready" title="Ready to play here">✓</span>` : ""}</li>`;
    });
    return `<div class="tour-ahead"><span class="small muted">Coming up:</span><ul>${items.join("")}</ul></div>`;
  }

  // The season: its weeks, how it's scored, where you stand, its table.
  seasonHtml(division) {
    const S = this.hub.season;
    if (!S?.ok) return "";
    const table = S.divisions?.[division] ?? { count: 0, top: [] };
    const mine = this.hub.mine?.season?.[division] ?? null;
    const me = this.account()?.player ?? null;
    const rows = table.top
      .slice(0, 10)
      .map((e) => `<tr${mine && e.place === mine.place && e.total === mine.total && (!me || e.name === me) ? ' class="near"' : ""}><td>${e.place}</td><td>${esc(e.name)} <span class="small muted">${e.played}</span></td><td><b>${e.total.toLocaleString("en-GB")}</b></td></tr>`)
      .join("");
    const yours = mine ? `<p class="tour-mine">You: <b>${esc(placeWords(mine.place, mine.count))}</b>, ${mine.total.toLocaleString("en-GB")} points from ${mine.played} round${mine.played === 1 ? "" : "s"}${mine.played > S.best ? ` (your best ${S.best} counted)` : ""}.</p>` : "";
    return `<section class="online-card tour-event">
      <div class="tour-event-head"><h3>The season</h3><span class="small muted">${S.week ? `Week ${S.week} of ${SEASON_WEEKS}` : ""}</span></div>
      <p>Season ${S.season}: ${esc(seasonWords(S.season))}.</p>
      <p class="small muted">Each week's round gives points for its place in your flight - 500, 300, 190 and on down to 1 for finishing - and your best ${S.best} weeks of the ${SEASON_WEEKS} count.</p>
      ${yours}
      ${rows ? `<table class="clubs tour-board"><tr><th>Place</th><th>Player <span class="small muted">rounds</span></th><th>Points</th></tr>${rows}</table>` : `<p class="small muted">Nobody on it yet - the week's round puts you on.</p>`}
    </section>`;
  }

  // The week's view with its boards your friends' alone, when that's what's
  // shown and the hub has them for this week (else everyone's).
  boardsShown(v) {
    const f = this.hub.friends;
    if (this.scope !== "friends" || !v || !f || f.week !== v.week?.n) return v;
    return { ...v, boards: f.boards ?? {}, round: v.round ? { ...v.round, boards: f.round?.boards ?? {} } : v.round, last: null };
  }
  // The switch between everyone's boards and your friends', and what the
  // friends board is.
  scopeHtml(acc) {
    if (!this.hub.friendsBoard) return "";
    const friends = this.scope === "friends";
    const f = this.hub.friends;
    const line = !friends ? "" : !acc ? "Sign in to see your friends' boards." : f && f.week === this.hub.view?.week?.n ? friendsLine(f) : "Finding your friends...";
    return `<div class="tour-scope" role="group" aria-label="Whose boards"><button data-act="scope" data-scope="everyone" class="${friends ? "" : "on"}" aria-pressed="${!friends}">Everyone</button><button data-act="scope" data-scope="friends" class="${friends ? "on" : ""}" aria-pressed="${friends}" title="The people in your match ladders and seasons by post">Your friends</button>${line ? `<span class="small muted">${esc(line)}</span>` : ""}</div>`;
  }

  render() {
    const hub = this.hub;
    const v = this.boardsShown(hub.view);
    const division = this.shown;
    const tabs = `<div class="online-tabs" role="tablist">${DIVISION_ORDER.map((d) => `<button role="tab" data-act="division" data-division="${d}" aria-selected="${d === division}" class="${d === division ? "on" : ""}" title="${esc(DIVISIONS[d].line)}">${esc(DIVISIONS[d].name)}</button>`).join("")}</div>`;
    const head = `<header class="online-head"><h2>The Tour</h2>${v ? tabs : ""}<button class="online-x" data-act="close" title="Close (Esc)" aria-label="Close">×</button></header>`;
    let body;
    if (!v) {
      body = hub.error
        ? `<p class="menu-status bad">${esc(hub.error)}</p><p><button data-act="refresh">Try again</button></p>`
        : `<p class="online-intro">${hub.on ? "Fetching this week..." : "The Tour needs the internet: this week's boards are kept online."}</p>`;
    } else {
      const n = v.week.n;
      const acc = this.account();
      const who = !acc
        ? `<p class="tour-who"><button class="primary" data-act="signin">Sign in</button> to play - your ${SHOTS} shots a week on each event are kept with your account.</p>`
        : hub.signin
          ? `<p class="tour-who worse">${esc(hub.signin)} - <button data-act="signin">Sign in</button></p>`
          : `<p class="tour-who small muted">Playing as <b>${esc(acc.player ?? "you")}</b>. One card per account on each board. <label title="The name the boards show for your cards from now on - the boards are public, on the web too">Shown as <select data-tour-name><option value="name"${shownAs() === "name" ? " selected" : ""}>${esc(acc.player ?? "your name")}</option><option value="anon"${shownAs() === "anon" ? " selected" : ""}>A player</option></select></label></p>`;
      const won = (w, e) => MEASURE_ORDER.filter((m) => w[m]).map((m) => `${esc(MEASURES[m].name.toLowerCase())}: ${esc(w[m].name)}, ${w[m].score}${m === "streak" ? " in a row" : ` ${esc(EVENTS[e].made)}`}`).join("; ");
      const roundWon = (w) => `${esc(w.world.name)}, ${w.world.score}${w.net ? `; net ${esc(w.net.name)}, ${w.net.score}` : ""}`;
      const last = v.last?.winners
        ? `<section class="online-card"><h3>Last week's winners</h3>${DIVISION_ORDER.filter((d) => v.last.winners.round?.[d]).map((d) => `<p><b>${esc(EVENTS.round.short)}</b> <span class="muted small">${esc(DIVISIONS[d].name.toLowerCase())}</span>: ${roundWon(v.last.winners.round[d])}</p>`).join("")}${EVENT_ORDER.flatMap((e) => DIVISION_ORDER.filter((d) => v.last.winners[e]?.[d]).map((d) => `<p><b>${esc(EVENTS[e].short)}</b> <span class="muted small">${esc(DIVISIONS[d].name.toLowerCase())}</span>: ${won(v.last.winners[e][d], e)}</p>`)).join("")}</section>`
        : "";
      const web = hub.base ? `<p class="small muted">The same boards on the web, for anyone: <a href="${esc(hub.base)}/tour" target="_blank" rel="noopener">${esc(hub.base.replace(/^https?:\/\//, ""))}/tour</a></p>` : "";
      // (This account's Tour id: the relay's TOUR_OWNER names the owner's.)
      const id = hub.you ? `<details class="small muted tour-id"><summary>Your Tour id</summary><code>${esc(hub.you)}</code> - only for setting who has the Tour's owner's page.</details>` : "";
      body = `<p class="online-intro">Every week, the same for every A² Golf player in the world, with its leaderboards. <b>${esc(weekWords(n))}</b> - ${esc(closesWords(n, this.now()))}. ${esc(DIVISIONS[division].line)}.</p>
        ${hub.error ? `<p class="menu-status bad">${esc(hub.error)} - showing what was here before. <button data-act="refresh">Try again</button></p>` : ""}
        ${this.note ? `<p class="menu-status">${esc(this.note)}</p>` : ""}
        ${who}
        ${this.scopeHtml(acc)}
        ${this.ownerHtml()}
        ${this.roundHtml(v, division)}
        ${this.seasonHtml(division)}
        ${EVENT_ORDER.map((e) => this.eventHtml(e, v, division)).join("")}
        ${last}${web}${id}`;
    }
    this.el.innerHTML = `<div class="bay-help-box online-box tour-box">${head}<div class="online-body">${body}</div></div>`;
  }
}
