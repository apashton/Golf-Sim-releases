// Online match ladders - the Live ladder (docs/LADDERS.md, "Online: the
// Live ladder"): kept in the relay's ladder store (relay/ladders.mjs),
// asked through net/ladderclient.mjs. This part makes and joins them,
// refreshes them, sends what this bay does (challenge, accept, decline,
// take back, let in), plays the match as an online game and reports its
// result. The Match ladder section itself is course/matchladder.js.
//   - Making one: this bay is its admin, and sends its code to the others.
//   - Joining: with the code; the admin lets you in.
//   - A challenge: the one challenged accepts with a course (its first
//     holes fix the strokes) or declines; either has the ladder's days to
//     do it (sim/matchladder.mjs RULES).
//   - The match: the one challenged hosts it as an online game (Host the
//     match), whose code goes to the ladder; the challenger joins it from
//     their ladder (Join the match). The host's Start plays it: match play
//     over the ladder's holes with its strokes (app.js netRound).
//   - The result: both bays report the scores; the relay puts it on the
//     ladder when they agree.
// A Postal ladder's matches are played apart, not as an online game
// (course/ladderpostal.js): its accept fixes the round, and each player's
// card says where they are with theirs.
// A ladder's own key for this bay is kept with it (ladder.online.key).
// Part of CourseMode (course.js), split out of it: these methods are
// added to CourseMode.prototype there and run with `this` the course.

import { LadderClient, newLadderKey } from "../net/ladderclient.mjs";
import { cleanLadder, ladderState, RULES, DAY } from "../sim/matchladder.mjs";
import { waitingFor } from "../sim/ladderfun.mjs";
import { roundKey } from "../sim/postal.mjs";
import { esc, typingNow } from "../util.js";
import { ladderJoinLink } from "../sim/netinvite.mjs";
import { saidAbout, saidWords, linesFor, lineWords, BEFORE_LINES } from "../sim/ladderlines.mjs";
import { qrSvg } from "../netlobby.js";
import { keepUnsent, unsentFor, sentNow } from "../sim/ladderunsent.mjs";

const newMatchId = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
// "LK7Q2M" -> "LK7-Q2M"
export const showLadderCode = (c) => (c && c.length === 6 ? `${c.slice(0, 3)}-${c.slice(3)}` : (c ?? ""));
const dateWords = (t) => new Date(t).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

export class CourseLadderOnline {
  // The relay's ladder store (none without a relay: online ladders aren't there).
  ladderStore() {
    return new LadderClient({ relay: this.ladderRelay?.() ?? "" });
  }

  // A ladder as the store sent it, kept: the ladder, with what this bay is
  // on it (online: { code, key, me, admin, pending, reports, rooms, at }).
  takeOnline(reply, key) {
    const L = cleanLadder(reply.ladder);
    if (!L) return null;
    L.online = { code: reply.code, key, me: reply.me ?? null, admin: !!reply.admin, pending: reply.pending ?? (reply.admin ? [] : 0), reports: reply.reports ?? {}, rooms: reply.rooms ?? {}, watch: reply.watch ?? {}, at: Date.now() };
    return L;
  }

  // An online ladder as kept, made sound (course/matchladder.js readLadders).
  readOnline(x) {
    const o = x?.online;
    if (!o || typeof o.code !== "string" || typeof o.key !== "string") return null;
    const L = cleanLadder(x);
    if (!L) return null;
    L.online = { code: o.code, key: o.key, me: o.me ?? null, admin: !!o.admin, pending: o.pending ?? 0, reports: o.reports ?? {}, rooms: o.rooms ?? {}, watch: o.watch ?? {}, alerts: typeof o.alerts === "string" ? o.alerts : null, at: o.at ?? 0 };
    return L;
  }

  putOnline(L) {
    const i = this.ladders.list.findIndex((x) => x.online?.code === L.online.code);
    if (i >= 0) this.ladders.list[i] = L;
    else this.ladders.list.push(L);
    this.saveLadders();
  }

  // Asks the store and keeps what it says: the ladder brought up to date.
  async onlineAsk(L, op, what = {}) {
    const store = this.ladderStore();
    const { code, key } = L.online;
    try {
      const reply = op === "read" ? await store.read(code, key) : await store.send(code, key, op, what);
      const next = this.takeOnline(reply, key);
      // (The alert token it's been given, carried over.)
      if (next) next.online.alerts = L.online.alerts ?? null;
      if (next) {
        this.putOnline(next);
        if (this.ladders.current === L.id) this.ladders.current = next.id;
      }
      this.ladderNote = null;
      // (Brought up to date: any result that couldn't be sent, sent now.)
      if (op === "read") this.resendUnsent(code);
      return reply;
    } catch (err) {
      this.ladderNote = err.message;
      // Taken off it (or the ladder's gone): it's kept here until removed.
      return null;
    } finally {
      // (A read - opening the section, an alert - doesn't wipe a name or
      // code being typed: drawn with the next change.)
      if (op !== "read" || !typingNow()) this.renderLadder();
    }
  }

  // Brought up to date when the section first shows, and on Refresh - never
  // on a timer (relay/README.md, "Keeping to the free plan").
  // (Not before the relay's known - a moment after the page opens - or
  // it would say there's none: asked when the section's drawn again then.)
  resendUnsent(code) {
    const L = this.ladders.list.find((l) => l.online?.code === code);
    if (!L) return;
    for (const r of unsentFor(this.ladders.unsent, code)) this.sendReport(L, r.match, r.scores);
  }

  refreshOnlineOnce(L) {
    this.ladderFetched ??= new Set();
    if (!L?.online || this.ladderFetched.has(L.online.code) || !this.ladderStore().on) return;
    this.ladderFetched.add(L.online.code);
    this.onlineAsk(L, "read");
  }

  // Once, when the game opens (app.js, once the relay's known): each online
  // ladder on this PC asked what's happened, and what's waiting for this
  // bay said - a challenge to answer, a match to play, a reveal - so it's
  // seen without opening the panel. One request a ladder.
  async ladderNotices() {
    if (this.ladderNoticed || !this.ladderStore().on) return;
    this.ladderNoticed = true;
    this.ladderFetched ??= new Set();
    // (All marked asked first, so the panel drawn meanwhile doesn't ask
    // again: refreshOnlineOnce.)
    const online = this.ladders.list.filter((l) => l.online);
    for (const kept of online) this.ladderFetched.add(kept.online.code);
    for (const kept of online) {
      await this.onlineAsk(kept, "read");
      const L = this.ladders.list.find((l) => l.online?.code === kept.online.code);
      if (!L) continue;
      const lines = this.ladderWaitingLines(L);
      if (!lines.length) continue;
      const s = ladderState(L);
      this.revealNoted ??= new Set();
      for (const r of this.newReveals?.(L, s) ?? []) this.revealNoted.add(roundKey(L.online.code, r.match));
      (this.onNotice ?? this.onToast)(`${L.name}: ${lines[0]}${lines.length > 1 ? ` (and ${lines.length - 1} more)` : ""} - ${this.ladderWhere ?? "Match ladder, in the course panel"}`, 8000);
    }
    this.sendAlertTokens();
  }

  // The phone's alert token (public/ladderalerts.js): kept, and given to
  // each online ladder once (op alerts) so its changes reach the phone.
  ladderAlertToken(token) {
    if (!token || token === this.ladders.alertToken) return this.sendAlertTokens();
    this.ladders.alertToken = token;
    this.saveLadders();
    return this.sendAlertTokens();
  }
  async sendAlertTokens() {
    const t = this.ladders.alertToken;
    if (!t || !this.ladderStore().on) return;
    for (const L of this.ladders.list.filter((l) => l.online?.me && l.online.alerts !== t)) {
      if (!(await this.onlineAsk(L, "alerts", { token: t }))) continue;
      const kept = this.ladders.list.find((x) => x.online?.code === L.online.code);
      if (kept) kept.online.alerts = t;
      this.saveLadders();
    }
  }
  // Brought up to date at once (an alert came while the app was open).
  ladderAlerted() {
    this.ladderFetched = new Set();
    for (const L of this.ladders.list.filter((l) => l.online)) this.refreshOnlineOnce(L);
  }

  // What waits for this bay on an online ladder, in words, from what's
  // kept: a challenge to answer, a match to play, the other's round in
  // (the reveal ready). -> [words]
  ladderWaitingLines(L) {
    if (!L?.online) return [];
    const s = ladderState(L);
    const me = this.ladderMe(L, s);
    if (!me) return [];
    // (With what they said with it: "Bob challenges you: Revenge?")
    const said = (w) => saidAbout(s, w.match).filter((x) => x.id !== me).at(-1);
    const lines = waitingFor(s, L, me).map((w) => (w.kind === "answer" ? `${w.other} challenges you${said(w) ? `: ${said(w).words}` : ""} - answer by ${dateWords(w.by)}` : `your match v ${w.other} - play it by ${dateWords(w.by)}`));
    for (const r of this.newReveals?.(L, s) ?? []) lines.push(`${s.players[r.by === me ? r.of : r.by]?.name ?? "the other"}'s round is in - the reveal's ready`);
    return lines;
  }
  // Every online ladder's: [{ id, name, line (the first), more }] - the
  // phone's Ladder button and Play's Match ladders tile.
  ladderWaiting() {
    return this.ladders.list
      .map((L) => ({ L, lines: this.ladderWaitingLines(L) }))
      .filter((x) => x.lines.length)
      .map(({ L, lines }) => ({ id: L.id, name: L.name, line: lines[0], more: lines.length - 1 }));
  }

  // A ladder's link opened (its QR code, a friend's message: app.js): one
  // already here is shown; else the new ladder's form, its code typed in
  // to join (Join asks the ladder's admin).
  askToJoinLadder(code) {
    const had = this.ladders.list.find((l) => l.online?.code === code);
    if (had) {
      this.ladders.current = had.id;
      this.ladderForm = false;
      this.saveLadders();
    } else {
      this.ladderJoinWanted = code;
      this.ladderForm = "online";
    }
    // (An online ladder's: on the Online tab.)
    if (this.onOnlineTab) this.onOnlineTab("ladders");
    this.renderLadder();
  }

  // A new Live ladder: made on the store, this bay its admin and first
  // rung (name: who's on it from this bay).
  async makeOnline({ name, rules, me }) {
    const key = newLadderKey();
    const reply = await this.ladderStore().create(key, { name, rules, me, seed: (Date.now() & 0xffffff) | 1 });
    const L = this.takeOnline(reply, key);
    this.putOnline(L);
    this.ladders.current = L.id;
    this.saveLadders();
    this.sendAlertTokens();
    this.onLadderOnline?.();
    return L;
  }

  // Joining one with its code: asked, then the admin lets you in - or, on
  // a ladder with places, a place taken at once (joinedWords says which).
  async joinOnline(code, me) {
    const key = newLadderKey();
    const reply = await this.ladderStore().send(code, key, "join", me);
    const L = this.takeOnline(reply, key);
    this.putOnline(L);
    this.ladders.current = L.id;
    this.ladderJoinWanted = null;
    this.saveLadders();
    this.sendAlertTokens();
    this.onLadderOnline?.();
    return L;
  }

  // The online ladder's own part of the section: its code, who's waiting to
  // be let in, this bay's matches and what to do about each.
  onlineHtml(L, s) {
    const o = L.online;
    const me = o.me?.admitted ? o.me.id : null;
    const name = (id) => esc(s.players[id]?.name ?? "?");
    const parts = [`<p class="small">Code <b>${esc(showLadderCode(o.code))}</b> - ${L.places ? "anyone with it (or its link) takes a place" : "others join with it"}. <button data-ladder-online="read" title="What's happened on the ladder since">Refresh</button> <button data-ladder-online="qr" title="The ladder's code as a QR code and a link: a phone's camera opens it in the A² Golf app, ready to join">${this.ladderQr ? "Hide the QR code" : "QR code"}</button></p>`];
    if (this.ladderQr) parts.push(this.ladderQrHtml(o.code));
    if (this.ladderNote) parts.push(`<p class="small bad">${esc(this.ladderNote)}</p>`);
    // Places still to fill (sim/matchladder.mjs PLACE_CHOICES): it waits,
    // and starts by itself with the last one - or its admin starts it.
    if (s.waiting) parts.push(this.waitingHtml(L, s));
    if (!me) {
      parts.push(`<p class="small">${o.me ? "Waiting for the ladder's admin to let you in - Refresh to see." : "You're not on this ladder."}</p>`);
      return parts.join("");
    }
    if (o.admin && Array.isArray(o.pending) && o.pending.length)
      parts.push(`<div class="ladder-card"><p><b>Asking to join</b></p>${o.pending.map((p) => `<p class="small">${esc(p.name)}${Number.isFinite(p.own) ? ` (${p.own})` : ""} <button data-ladder-online="admit" data-id="${esc(p.id)}">Let in</button> <button data-ladder-online="turnaway" data-id="${esc(p.id)}">Turn away</button></p>`).join("")}</div>`);
    // Leaving it as its admin (Leave): handed over to another player first.
    const heirs = o.admin && this.ladderLeaving === o.code ? s.rungs.filter((id) => id !== me) : [];
    if (heirs.length)
      parts.push(`<div class="ladder-card"><p><b>Leaving ${esc(L.name)}</b></p><p class="small">You're its admin: hand it over to another player first - they let new players in from then on. Then you leave it, and come off its rungs.</p><p class="small"><label>Hand over to <select data-ladder-heir>${heirs.map((id) => `<option value="${esc(id)}">${name(id)}</option>`).join("")}</select></label> <button data-ladder-online="handover-leave" title="Hand the ladder over to them, then leave it">Hand over and leave</button> <button data-ladder-online="handover-cancel">Not now</button></p></div>`);
    for (const m of s.open.filter((x) => x.by === me || x.of === me)) {
      const other = m.by === me ? m.of : m.by;
      const room = o.rooms?.[m.match];
      const rep = o.reports?.[m.match];
      let body;
      if (m.acceptedAt == null) {
        const by = dateWords(m.t + RULES.accept * DAY);
        body =
          m.by === me
            ? `You challenged ${name(other)} - waiting for them to answer (by ${by}). <button data-ladder-online="cancel" data-match="${esc(m.match)}">Take it back</button>`
            : `<b>${name(other)} challenges you</b> for rung ${s.rungs.indexOf(me) + 1} - answer by ${by}.<br><label${L.play === "postal" ? ` title="One you both have - a course that comes with the game, unless you've both the same one"` : ""}>Course <select data-ladder-course="${esc(m.match)}">${this.list.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join("")}</select></label> <button class="primary" data-ladder-online="accept" data-match="${esc(m.match)}" title="${L.play === "postal" ? `You both play your rounds on this course: its first ${L.holes} holes fix the strokes; your tees and your weather (rolled now), and today's cups, are the same for both` : `Play it on this course: its first ${L.holes} holes fix the strokes`}">Accept</button> <button data-ladder-online="decline" data-match="${esc(m.match)}" title="One a month doesn't count against you; a second is a walkover">Decline</button>`;
      } else if (L.play === "postal") {
        body = this.postalCardHtml(L, s, m, me);
      } else {
        const course = this.list.find((c) => c.id === m.course)?.name ?? m.course ?? "the course";
        const by = dateWords(m.acceptedAt + RULES.play * DAY);
        let act;
        if (rep?.differ) act = "Your two bays sent different scores - the ladder's admin can call it off.";
        else if (rep?.from?.includes(me)) act = `Your result's in - on the ladder when ${name(other)}'s bay sends theirs (or in a day).`;
        else if (typeof room?.code === "string" && room.by !== me) act = `<button class="primary" data-ladder-online="join-match" data-match="${esc(m.match)}" title="Join the online game ${name(other)} is hosting for it">Join the match</button> (game ${esc(room.code.slice(0, 3))}-${esc(room.code.slice(3))})`;
        else if (m.of === me) act = `<button class="primary" data-ladder-online="host-match" data-match="${esc(m.match)}" title="Host it as an online game: its code goes to the ladder for ${name(other)} to join">${room ? "Host it again" : "Host the match"}</button>${typeof room?.code === "string" ? ` (game ${esc(room.code.slice(0, 3))}-${esc(room.code.slice(3))} - waiting for them)` : ""}`;
        else act = `${name(other)} hosts it - Refresh when they say they're ready.`;
        body = `<b>Match v ${name(other)}</b> on ${esc(course)}, by ${by}. ${act}`;
      }
      parts.push(`<div class="ladder-card"><p class="small">${body}</p>${this.linesHtml(s, m, me)}</div>`);
    }
    // After a match (for a few days): what was said, and a line to say.
    for (const r of s.results.filter((x) => (x.by === me || x.of === me) && !x.walkover).slice(-2)) {
      // (A Postal round's shots too, once revealed: course/ladderpostal.js.)
      const html = this.linesHtml(s, r, me, { after: true }) + (this.newReveals?.(L, s).some((x) => x.match === r.match) ? "" : (this.postalWatchHtml?.(L, s, r) ?? ""));
      if (html) parts.push(`<div class="ladder-card"><p class="small">After your match v ${name(r.by === me ? r.of : r.by)}:</p>${html}</div>`);
    }
    // Away (a holiday, an injury): not challenged, and no slide, for up to
    // RULES.awayMost days.
    const until = s.players[me]?.awayUntil;
    const away = until && until > Date.now();
    const weeks = [1, 2, 3, 4].filter((w) => w * 7 <= RULES.awayMost);
    parts.push(`<p class="small"><label title="Away (a holiday, say): nobody can challenge you and you don't slip down the ladder - ${RULES.awayMost} days at most">Away <select data-ladder-away>${away ? `<option value="" selected>till ${esc(dateWords(until))}</option>` : ""}<option value="0" ${away ? "" : "selected"}>${away ? "Back now" : "Not away"}</option>${weeks.map((w) => `<option value="${w}">For ${w === 1 ? "a week" : `${w} weeks`}</option>`).join("")}</select></label></p>`);
    return parts.join("");
  }

  // A ladder with places waiting for them to fill: how many are taken, that
  // it starts by itself with the last one, who can find it - and, for its
  // admin with two players or more, Start now.
  waitingHtml(L, s) {
    const { places, filled } = s.waiting;
    const draw = L.kind === "scratch" ? "by handicap, the best on top" : "at random";
    const who = L.listed ? "It's in Open ladders for anyone to find, and anyone with its link or code can join." : "Only people sent its link or code can join.";
    const start = L.online?.admin && filled >= 2 && filled < places ? ` <button data-ladder-online="start" title="Start it now with ${filled} players: the rungs are drawn, challenges open, and the places left are taken by whoever joins next">Start now with ${filled}</button>` : "";
    return `<div class="ladder-card ladder-waiting"><p><b>Waiting for players: ${filled} of ${places} places taken</b></p><p class="small">It starts by itself when the last place goes: the rungs are drawn (${draw}) and challenges open. ${esc(who)} <button data-ladder-online="share" title="Copy its link to send (on a phone, share it): it opens the ladder, ready to join">Share the link</button>${start}</p></div>`;
  }

  // A line sent with a challenge (the card before it, online).
  challengeLineHtml() {
    const v = this.ladderCard?.line;
    return `<label class="small" title="One of a few set lines, sent with the challenge">Say <select id="ladder-say"><option value="">Nothing</option>${BEFORE_LINES.map((i) => `<option value="${i}" ${v === i ? "selected" : ""}>${esc(lineWords(i))}</option>`).join("")}</select></label>`;
  }

  // A match's lines: what's been said on it, and the set lines to say -
  // before it's played, or after its result (sim/ladderlines.mjs).
  linesHtml(s, m, me, { after = false } = {}) {
    const said = saidAbout(s, m.match);
    const can = linesFor(s, me, m, { after });
    if (!said.length && !can.length) return "";
    return `${said.length ? `<p class="small ladder-said">${esc(saidWords(said))}</p>` : ""}${can.length ? `<p class="small ladder-lines">${can.map((i) => `<button data-ladder-say="${i}" data-match="${esc(m.match)}" title="Say it to them, on the ladder">${esc(lineWords(i))}</button>`).join(" ")}</p>` : ""}`;
  }

  wireOnline(el, L) {
    for (const b of el.querySelectorAll("[data-ladder-say]")) b.addEventListener("click", () => this.onlineAsk(L, "say", { match: b.dataset.match, line: Number(b.dataset.ladderSay) }));
    el.querySelector("[data-ladder-away]")?.addEventListener("change", (e) => {
      if (e.target.value === "") return;
      const w = Number(e.target.value);
      this.onlineAsk(L, "away", { until: Date.now() + w * 7 * DAY });
    });
    for (const b of el.querySelectorAll("[data-ladder-online]")) {
      b.addEventListener("click", async () => {
        const what = b.dataset.ladderOnline;
        const match = b.dataset.match;
        if (what === "read") return this.onlineAsk(L, "read");
        if (what === "qr") {
          this.ladderQr = !this.ladderQr;
          return this.renderLadder();
        }
        if (what === "share") return this.shareLadder(L);
        if (what === "handover-leave") return this.handOverAndLeave(L, el.querySelector("[data-ladder-heir]")?.value);
        if (what === "handover-cancel") {
          this.ladderLeaving = null;
          return this.renderLadder();
        }
        if (what === "admit" || what === "turnaway") return this.onlineAsk(L, what, { id: b.dataset.id });
        if (what === "start") {
          const reply = await this.onlineAsk(L, "start");
          if (reply?.started) this.onToast(`${L.name}: under way - the rungs are drawn`, 4000);
          return;
        }
        if (what === "cancel" || what === "decline") return this.onlineAsk(L, what, { match });
        if (what === "accept") {
          const id = el.querySelector(`[data-ladder-course="${CSS.escape(match)}"]`)?.value;
          const holes = await this.courseHoles(id, L.holes);
          if (!holes) return this.onToast(`That course hasn't ${L.holes} holes - pick another`, 3500);
          return this.onlineAsk(L, "accept", { match, holes, course: id, ...this.postalAccept(L) });
        }
        const m = ladderState(L).open.find((x) => x.match === match);
        if (!m) return;
        if (what === "host-match") return this.onLadderHost?.(L, m);
        if (what === "join-match") return this.onLadderJoin?.(L, m, L.online.rooms?.[match]?.code);
      });
    }
  }

  // ---- Leaving ------------------------------------------------------------------

  // Leave (the Match ladder section): off the ladder for everyone - the
  // relay's leave - and off this PC. Still waiting to be let in, it takes
  // the ask back; not on it any more (taken off, or the ladder's gone),
  // only this PC's copy goes. Its admin hands it over to another player
  // first (the Leaving card), unless they're its last player: then it ends,
  // for good. (At the bay and solo, Delete: course/matchladder.js.)
  async leaveOnline(L) {
    const o = L.online;
    const me = o.me?.admitted ? o.me.id : null;
    if (me && o.admin && ladderState(L).rungs.some((id) => id !== me)) {
      this.ladderLeaving = o.code;
      return this.renderLadder();
    }
    const [text, yes] = !o.me
      ? [`Take ${L.name} off this PC? You're not on it any more.`, "Take it off"]
      : !me
        ? [`Take back your ask to join ${L.name}? It comes off this PC.`, "Take it back"]
        : o.admin
          ? [`End ${L.name}? You're its last player, so it ends for good - its rungs and results go.`, "End it"]
          : [`Leave ${L.name}? You come off its rungs for everyone, and a match you have open is called off. Its results so far stay.`, "Leave it"];
    if (!(await this.askFirst(text, { yes, no: "Not now", danger: true }))) return;
    if (o.me && !(await this.leaveStore(L))) return;
    this.dropLadder(L);
  }

  // The relay's leave: true once off the ladder - or there's no ladder, or
  // no place on it, to leave any more - false if it couldn't be done (said).
  async leaveStore(L) {
    try {
      await this.ladderStore().send(L.online.code, L.online.key, "leave");
      return true;
    } catch (err) {
      if (err.status === 403 || err.status === 404) return true;
      this.ladderNote = err.message;
      // (Others on it after all: the ladder brought up to date, to hand over.)
      if (err.status === 409) return this.onlineAsk(L, "read").then(() => false);
      this.renderLadder();
      return false;
    }
  }

  // The Leaving card's Hand over and leave: the admin's job to that player,
  // then off the ladder.
  async handOverAndLeave(L, id) {
    const who = ladderState(L).players[id]?.name;
    if (!who) return;
    if (!(await this.askFirst(`Hand ${L.name} over to ${who} and leave it? They let new players in from now on, and you come off its rungs.`, { yes: "Hand over and leave", no: "Not now", danger: true }))) return;
    if (!(await this.onlineAsk(L, "handover", { id }))) return;
    this.ladderLeaving = null;
    if (await this.leaveStore(L)) this.dropLadder(L);
  }

  // The ladder's code as a QR code - the relay's page for it, which opens
  // the phone app ready to join - and its link to send (sim/netinvite.mjs).
  ladderQrHtml(code) {
    const link = ladderJoinLink(this.ladderRelay?.() ?? "", code);
    if (!link) return "";
    return `<div class="ladder-card ladder-qr">${qrSvg(link)}<p class="small muted">Point a phone's camera at this: it opens the ladder in the A² Golf app, ready to join. Or send the link: <button data-ladder-online="share" title="Copy the link (or share it, on a phone)">Share the link</button></p></div>`;
  }
  async shareLadder(L) {
    const link = ladderJoinLink(this.ladderRelay?.() ?? "", L.online.code);
    if (!link) return;
    const text = `Join my match ladder ${L.name} in A² Golf: ${link} (code ${showLadderCode(L.online.code)})`;
    try {
      if (navigator.share) return void (await navigator.share({ title: L.name, text, url: link }));
      await navigator.clipboard.writeText(text);
      this.onToast("The ladder's link is copied - paste it to a friend", 3000);
    } catch {
      // Cancelled, or no clipboard: the code's on the panel.
    }
  }

  // A course's first holes for a match: [{ par, yards, si }], or null.
  async courseHoles(id, n) {
    try {
      const c = await fetch(`/api/courses/${encodeURIComponent(id)}`).then((res) => (res.ok ? res.json() : null));
      if (!c || c.holes.length < n) return null;
      return c.holes.slice(0, n).map((h) => ({ par: h.spec.par, yards: h.spec.yards, si: Number.isFinite(h.spec.si) ? h.spec.si : null }));
    } catch {
      return null;
    }
  }

  // A challenge sent (course/matchladder.js openLadderCard, online).
  challengeOnline(L, of, line = null) {
    return this.onlineAsk(L, "challenge", { of, match: newMatchId(), ...(Number.isInteger(line) ? { line } : {}) });
  }

  // The match's online game hosted here: its code to the ladder, for the
  // other to join (app.js onLadderHost, once the game has a code).
  ladderRoom(L, match, code) {
    return this.onlineAsk(L, "room", { match, code });
  }

  // While a ladder match is being set up online: who this bay brings - the
  // ladder's player alone (app.js netBay).
  netLadderPlayers() {
    const p = this.pendingNetLadder;
    return p ? [p.name] : null;
  }

  // An online round's ladder match (course.js startRound, net): from the
  // ladder kept here, as the store last said - brought up to date first
  // when it doesn't know the match yet.
  netLadderRound(ref) {
    // (Only between the two of them: one player on each bay.)
    if (!ref || this.round?.players?.length !== 2) return null;
    const L = this.ladders.list.find((l) => l.online?.code === ref.code);
    if (!L) return null;
    const lad = this.ladderRoundFor({ id: L.id, match: ref.match });
    if (lad) return { ...lad, online: true, me: L.online.me?.id ?? null };
    const r = this.round;
    this.onlineAsk(L, "read").then(() => {
      if (this.round !== r || r.ladder) return;
      const next = this.ladders.list.find((l) => l.online?.code === ref.code);
      const got = next && this.ladderRoundFor({ id: next.id, match: ref.match });
      if (got) r.ladder = { ...got, online: true, me: next.online.me?.id ?? null };
    });
    return null;
  }

  // The online match over: this bay's report of the scores (both players').
  reportOnline(lad, scores) {
    const L = this.ladders.list.find((l) => l.id === lad.id);
    if (!L?.online) return;
    this.pendingNetLadder = null;
    this.sendReport(L, lad.match, scores, lad.name);
  }

  // A result sent; if it can't be, kept with the ladders to send again on
  // the next ask about the ladder (opening the panel, Refresh:
  // sim/ladderunsent.mjs) - never just dropped.
  sendReport(L, match, scores, name = L.name) {
    const code = L.online.code;
    return this.onlineAsk(L, "report", { match, scores }).then((reply) => {
      if (!reply) {
        const was = unsentFor(this.ladders.unsent, code).some((r) => r.match === match);
        this.ladders.unsent = keepUnsent(this.ladders.unsent, code, match, scores);
        this.saveLadders();
        if (!was) this.onToast(`${name}: couldn't send the result - it's kept, and sent again when you next open the ladder or press Refresh`, 6000);
        return;
      }
      this.ladders.unsent = sentNow(this.ladders.unsent, code, match);
      this.saveLadders();
      this.onToast(reply.differ ? `${name}: the other bay sent different scores - the admin can sort it out` : reply.waiting ? `${name}: result sent - on the ladder when the other bay's is in` : `${name}: result on the ladder`, 6000);
    });
  }
}
