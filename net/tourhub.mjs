// The game's side of the Tour (relay/tour.mjs; the rules: sim/tour.mjs):
// this week as the relay has it, this account's cards, round and places,
// the week's round begun and its scores sent, and each go played put on
// its card - with the account's login, got fresh from the
// device's own server each time (sim/accountstore.mjs login). Asked when
// something's wanted, never on a timer of its own.
//
// Each go's kept here first (setting tourPending), then sent with the ones
// before it a few at a time (BATCH) - all of them when a card's 50 are
// played, when an event's left, or when the Tour's looked at - so nothing
// played is lost to a dropped connection, and while its week's open what
// couldn't be sent goes the next time. A card here is the relay's with
// what's waiting played on it.
//
//   relay()        the online play relay's address ("" for none)
//   login()        -> { uid, player, idToken } (throws in words when
//                  nobody's signed in)
//   kept           { get(), set(v) }: what waits to be sent
//   version        this copy of the game, said with each go sent
//   circles(player) this bay's match ladders and seasons by post as that
//                  player (sim/tourfriends.mjs tourCircles), for the
//                  friends board - or null for none

import { ladderBase } from "./ladderclient.mjs";
import { weekOf, weekOpen, goodEvent, goodDivision, GOES, newCard, cardAfter, cardDone } from "../sim/tour.mjs";

// Looked at again at most this often, unless asked to (the relay's edge
// keeps a week's view a minute anyway).
const FRESH_MS = 60 * 1000;
// Goes sent this many at a time.
export const BATCH = 5;

// An account's own as the relay says it, with its season's rows (when it's
// on the season's table).
const withSeason = (m) => ({ ...(m.mine ?? {}), ...(m.season && Object.keys(m.season).length ? { season: m.season } : {}) });

// A go's own name, so one sent twice is counted once.
const goId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export class TourHub {
  constructor({ relay = () => "", fetchImpl = globalThis.fetch?.bind(globalThis), login = async () => {
    throw new Error("Sign in to enter");
  }, now = () => Date.now(), kept = null, version = "", circles = null } = {}) {
    let held = null;
    kept ??= { get: () => held, set: (v) => (held = v) };
    Object.assign(this, { relay, fetch: fetchImpl, login, now, kept, version, circles });
    // The friends board (friendsBoard): { week, at, count, circles, boards,
    // round }, or null.
    this.friends = null;
    // The week's view (relay/tour.mjs "view"), this account's cards as the
    // relay last said ({ event: { division: { shots, made, streak, run,
    // lives, places, count } } }), and why not.
    this.view = null;
    this.mine = null;
    this.you = null;
    this.owner = false;
    this.ownerPage = null;
    // The season's table (relay/tourseason.mjs seasonView), or null.
    this.season = null;
    this.error = null;
    this.signin = null;
    this.busy = false;
    this.sending = null;
    this.at = 0;
    this.listeners = new Set();
  }

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  changed() {
    for (const fn of this.listeners) fn(this);
  }

  // The friends board (relay /tour/friends): the week's boards of the
  // people in this account's match ladders and seasons by post, places
  // among them. Each membership sent is linked to the account there as it
  // goes, so the others find it on theirs. Kept a minute (force: asked
  // again).
  async friendsBoard({ force = false } = {}) {
    if (!this.circles) return null;
    if (!force && this.friends?.week === this.week && this.now() - this.friends.at < FRESH_MS) return this.friends;
    if (this.friendsAsking) return this.friendsAsking;
    this.friendsAsking = (async () => {
      try {
        const { idToken, player } = await this.login();
        const circles = this.circles(player) ?? [];
        const r = await this.ask("/tour/friends", { token: idToken, week: this.week, circles });
        this.friends = { week: this.week, at: this.now(), count: r.friends ?? 0, circles: circles.length, boards: r.boards ?? {}, round: r.round ?? { boards: {} } };
        this.changed();
        return this.friends;
      } finally {
        this.friendsAsking = null;
      }
    })();
    return this.friendsAsking;
  }

  get base() {
    return ladderBase(this.relay());
  }
  get on() {
    return !!this.base && typeof this.fetch === "function";
  }
  // This week's number, by the clock.
  get week() {
    return weekOf(this.now());
  }

  async ask(path, body = null) {
    if (!this.on) throw new Error("The Tour needs the internet - there's no online play relay set up here");
    let res;
    try {
      res = await this.fetch(`${this.base}${path}`, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {});
    } catch {
      throw Object.assign(new Error("Couldn't reach the Tour - check the internet connection"), { offline: true });
    }
    const reply = await res.json().catch(() => ({}));
    if (!res.ok || reply.ok === false) throw Object.assign(new Error(reply.error ?? `The Tour's store said ${res.status}`), { status: res.status, signin: !!reply.signin, closed: !!reply.closed, begun: !!reply.begun });
    return reply;
  }

  // The goes waiting to be sent, while their week's open (an older week's
  // let go - and anything kept by a copy of the game from before the 50
  // shots, which kept whole runs).
  pending() {
    const list = Array.isArray(this.kept.get()) ? this.kept.get() : [];
    return list.filter((p) => p && typeof p.id === "string" && goodEvent(p.event) && goodDivision(p.division) && GOES[p.event].includes(p.r) && weekOpen(p.week, this.now()));
  }
  waiting(event, division) {
    const week = this.week;
    return this.pending().filter((p) => p.week === week && p.event === event && p.division === division);
  }

  // This account's card this week on a board: the relay's, with what's
  // waiting played on it.
  card(event, division) {
    const relay = this.mine?.[event]?.[division] ?? newCard();
    return cardAfter(relay, event, this.waiting(event, division).map((p) => p.r));
  }
  // Its places as the relay last said: { places: { made, streak }, count,
  // shots } - or null (nothing of it there yet).
  standing(event, division) {
    return this.mine?.[event]?.[division] ?? null;
  }

  // The week looked at again: its view, this account's own, and anything
  // waiting sent. Never throws: why not is in `error` (and `signin`: why
  // this account's own couldn't be had). Asked while it's being looked at,
  // it's that look that's waited for.
  refresh(opts = {}) {
    this.refreshing ??= this.load(opts).finally(() => (this.refreshing = null));
    return this.refreshing;
  }
  async load({ force = false } = {}) {
    if (!force && this.view && this.now() - this.at < FRESH_MS && this.view.week?.n === weekOf(this.now())) return this;
    this.busy = true;
    this.changed();
    try {
      this.view = await this.ask("/tour/week");
      this.error = null;
      this.at = this.now();
    } catch (err) {
      this.error = err.message;
    }
    // (The season's table: kept as it was when it can't be had.)
    if (!this.error) this.season = await this.ask("/tour/season").catch(() => this.season);
    if (!this.error) {
      let token = null;
      try {
        token = (await this.login()).idToken;
        this.signin = null;
      } catch (err) {
        this.signin = err.message;
        this.mine = null;
      }
      if (token) {
        try {
          const m = await this.ask("/tour/mine", { token });
          this.mine = withSeason(m);
          // This account's Tour id (the relay's TOUR_OWNER names the
          // owner's), and whether it's the owner's.
          this.you = m.you ?? null;
          this.owner = m.owner === true;
        } catch (err) {
          if (err.signin) this.signin = "Sign in again to enter";
        }
        // (This account's ladders and seasons linked to it as it looks -
        // so friends find it on theirs - and its friends board fetched.)
        if (this.circles) this.friendsBoard().catch(() => {});
        // (Something sent: the boards are looked at again with it on them.)
        if (await this.flush({ token })) this.view = await this.ask("/tour/week").catch(() => this.view);
      }
    }
    this.busy = false;
    this.changed();
    return this;
  }

  // A go played on a board: kept, played on its card here, and sent with
  // the ones waiting when there are BATCH of them or the 50 are played.
  //   r: its letter (sim/tour.mjs GOES); d: what it was; name: the name
  //   the boards show ("" - A player).
  // -> the card after it. (A card that's done takes no more.)
  went({ event, division, r, d = null, name = "" }) {
    if (!goodEvent(event) || !goodDivision(division) || !GOES[event].includes(r)) return this.card(event, division);
    if (cardDone(this.card(event, division))) return this.card(event, division);
    this.kept.set([...this.pending(), { week: this.week, event, division, id: goId(), r, d, name }]);
    const card = this.card(event, division);
    if (this.waiting(event, division).length >= BATCH || cardDone(card)) this.flush();
    this.changed();
    return card;
  }

  // Whatever's waiting, sent - one sending at a time (what's played while
  // one's on its way goes with the next). -> how many went. Never throws.
  async flush({ token = null } = {}) {
    while (this.sending) await this.sending;
    if (!this.pending().length) return 0;
    this.sending = this.send(token).finally(() => (this.sending = null));
    return this.sending;
  }
  async send(token) {
    const list = this.pending();
    if (!token) {
      try {
        token = (await this.login()).idToken;
      } catch (err) {
        this.signin = err.message;
        this.changed();
        return 0;
      }
    }
    const groups = new Map();
    for (const p of list) {
      const k = `${p.week}:${p.event}:${p.division}`;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(p);
    }
    let sent = 0;
    for (const goes of groups.values()) {
      const { week, event, division } = goes[0];
      const ids = new Set(goes.map((g) => g.id));
      try {
        const r = await this.ask("/tour/go", { token, week, event, division, goes: goes.map(({ id, r, d }) => ({ id, r, d })), name: goes[goes.length - 1].name, version: this.version });
        this.took(r, week);
        this.kept.set(this.pending().filter((p) => !ids.has(p.id)));
        sent += goes.length;
      } catch (err) {
        if (err.signin) this.signin = "Sign in again to enter";
        // (Turned down for good - a closed week, not a go: let go. No
        // internet, or the login: kept for next time.)
        if (!(err.offline || err.signin || err.status === 429 || err.status >= 500)) this.kept.set(this.pending().filter((p) => !ids.has(p.id)));
      }
    }
    this.changed();
    return sent;
  }

  // This account's own for an earlier week (as the game opens: last
  // week's), with its season's rows - or null. Never throws.
  async mineOf(week) {
    try {
      const { idToken } = await this.login();
      return withSeason(await this.ask("/tour/mine", { token: idToken, week }));
    } catch {
      return null;
    }
  }

  // ---- Keeping it honest (step 4) -------------------------------------------------

  // A score on a board reported: the place as it's shown (from 0), with its
  // name and score; why: sim/tour.mjs REPORT_WHY. -> { ok, already }.
  // Throws in words.
  async report({ event, division, board, place, name, score, why }) {
    const { idToken } = await this.login();
    return this.ask("/tour/report", { token: idToken, week: this.week, event, division, board, place, name, score, why });
  }
  // The owner's page: what's held, reported and hidden this week (null
  // when this isn't the owner's account) - and an entry let on, hidden,
  // shown again or its reports put away (op), or a whole account hidden.
  async ownerView() {
    if (!this.owner) return null;
    const { idToken } = await this.login();
    this.ownerPage = await this.ask("/tour/owner", { token: idToken, week: this.week, op: "owner" });
    this.changed();
    return this.ownerPage;
  }
  async ownerAct(op, { key = null, account = null } = {}) {
    const { idToken } = await this.login();
    await this.ask("/tour/owner", { token: idToken, week: this.week, op, key, account });
    // (The boards, and the owner's page, as they are now.)
    this.view = await this.ask("/tour/week").catch(() => this.view);
    return this.ownerView();
  }

  // ---- The week's round ----------------------------------------------------------

  // Begun: once a week (holes: this copy's of the course, [{ par, yards }];
  // index: the player's handicap index, or null; edition: this copy's
  // edition of it - sim/shown.mjs EDITIONS). Throws in words.
  async beginRound({ holes, index, edition = 1 }) {
    const { idToken } = await this.login();
    const r = await this.ask("/tour/begin", { token: idToken, week: this.week, holes, index, edition, version: this.version });
    (this.mine ??= {}).round = r.round;
    this.changed();
    return r.round;
  }
  // Its scores sent (once): -> this account's round with its places.
  // Throws in words (err.status, err.closed: it can't be sent at all).
  async sendRound({ week, division, scores, name }) {
    const { idToken } = await this.login();
    const r = await this.ask("/tour/round", { token: idToken, week, division, scores, name, version: this.version });
    if (week === this.week) {
      this.mine ??= {};
      this.mine.round = r.round;
      if (r.season) this.mine.season = r.season;
    }
    this.at = 0;
    this.changed();
    // (Where it stands on the season's table, with it.)
    return { ...r.round, season: r.season?.[r.round?.division] ?? null };
  }

  // The relay's answer to goes sent, taken into what's known here.
  took(r, week) {
    if (!r?.event || !r.card || week !== this.week) return;
    this.mine ??= {};
    (this.mine[r.event] ??= {})[r.division] = r.card;
    // (The board in hand's a minute old at most: looked at again next time.)
    this.at = 0;
  }
}
