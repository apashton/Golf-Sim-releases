// The host's online season (sim/netseason.mjs): made in the Online tab's
// Seasons (netseasons.js), each event played as an online round from the
// lobby and its places kept once it's finished - kept in this PC's or
// phone's own storage, so it carries on across nights, lobbies and the app
// starting again - and sent with the game for every bay to see (one small
// message an event, as the match over several games is: netmatchkeep.js).
// None of it on the relay.

import { newNetSeason, cleanNetSeason, recordNetEvent, nextNetEvent } from "./sim/netseason.mjs";

export class NetSeasonKeeper {
  // client: netplay.js NetPlayClient. load(), save(season | null): where
  // it's kept (app.js: the page's settings).
  constructor({ client, load, save }) {
    Object.assign(this, { client, load, save });
    this.sharing = false;
    // The event the host's asked to play next (its index), or null: the
    // lobby's next game is it till it's played or put aside.
    this.pending = null;
  }

  get season() {
    try {
      return cleanNetSeason(this.load());
    } catch {
      return null;
    }
  }

  // A new season ({ name, events, courses, scoring, seed }); false with no
  // courses to play it on.
  async start(opts) {
    const s = newNetSeason(opts);
    if (!s) return false;
    this.pending = null;
    this.save(s);
    await this.share(s);
    return true;
  }

  async end() {
    this.pending = null;
    this.save(null);
    if (this.client.view.mode === "host") await this.client.send({ type: "season", season: null });
  }

  // The next event asked for (k: the season's next, or nothing once it's
  // over), or put aside (null).
  playNext(on = true) {
    const k = nextNetEvent(this.season);
    this.pending = on && k >= 0 ? k : null;
    return this.pending;
  }

  // The event this game will be, if one's asked for and still to play.
  get next() {
    const s = this.season;
    return this.pending != null && s?.events[this.pending] && !s.events[this.pending].done ? this.pending : null;
  }

  // Event k played (sim/netresults.mjs courseResult's places): kept once
  // (by the game's id), and everyone told. Returns whether it counted.
  record(k, result) {
    const s = this.season;
    if (!s || !result) return false;
    const next = recordNetEvent(s, k, result);
    if (!next?.events[k]?.done || s.events[k].done) return false;
    if (this.pending === k) this.pending = null;
    this.save(next);
    this.share(next);
    return true;
  }

  share(s = this.season) {
    if (this.client.view.mode !== "host") return Promise.resolve();
    return this.client.send({ type: "season", season: s });
  }

  // Hosting with a season: the game told it, if it hasn't been.
  sync(view) {
    const s = this.season;
    if (view.mode !== "host" || !view.game || !s || this.sharing) return;
    if (JSON.stringify(view.game.season ?? null) === JSON.stringify(s)) return;
    this.sharing = true;
    this.share(s).finally(() => (this.sharing = false));
  }
}
