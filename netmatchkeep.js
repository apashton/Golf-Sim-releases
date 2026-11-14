// The host's match over several games (sim/netmatch.mjs): started by name
// in the Online play panel's lobby, each game the group finishes while it's
// on added (sim/netresults.mjs: where everyone finished), kept in this PC's
// or phone's own storage - so it carries on across games, lobbies and the
// app starting again - and sent with the game for every bay to see (one
// small message a game). None of it on the relay.

import { newMatch, addGame, cleanMatch } from "./sim/netmatch.mjs";

export class MatchKeeper {
  // client: netplay.js NetPlayClient. load(), save(match | null): where
  // it's kept (app.js: the page's settings).
  constructor({ client, load, save }) {
    Object.assign(this, { client, load, save });
    this.sharing = false;
  }

  get match() {
    try {
      return cleanMatch(this.load());
    } catch {
      return null;
    }
  }

  async start(name) {
    const m = newMatch(name);
    this.save(m);
    await this.share(m);
  }

  async end() {
    this.save(null);
    if (this.client.view.mode === "host") await this.client.send({ type: "match", match: null });
  }

  // A game finished: added once (by its id), and everyone told.
  record(result) {
    const m = this.match;
    if (!m || !result) return false;
    const next = addGame(m, result);
    if (next.games.length === m.games.length) return false;
    this.save(next);
    this.share(next);
    return true;
  }

  share(m = this.match) {
    if (this.client.view.mode !== "host") return Promise.resolve();
    return this.client.send({ type: "match", match: m });
  }

  // Hosting with a match on: the game told it, if it hasn't been.
  sync(view) {
    const m = this.match;
    if (view.mode !== "host" || !view.game || !m || this.sharing) return;
    if (JSON.stringify(view.game.match ?? null) === JSON.stringify(m)) return;
    this.sharing = true;
    this.share(m).finally(() => (this.sharing = false));
  }
}
