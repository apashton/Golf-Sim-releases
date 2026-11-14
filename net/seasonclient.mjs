// The game's side of a season by post (relay/seasons.mjs): asks the relay's
// season store over plain HTTP, as a ladder's client does (ladderclient.mjs)
// - one request each time (made, joined, read, begun, sent), never on a
// timer of its own.

import { LadderClient, ladderBase, newLadderKey } from "./ladderclient.mjs";

export { ladderBase as seasonBase };
// A bay's own key for a season: kept with it, never shown.
export const newSeasonKey = newLadderKey;

export class SeasonClient extends LadderClient {
  constructor(opts = {}) {
    super({ what: "Seasons by post", store: "season store", ...opts });
  }
  // A new season: { code, season, members, entries, me, admin }.
  create(key, { season, me }) {
    return this.ask("/season", { op: "create", key, season, me });
  }
  read(code, key) {
    return this.ask(`/season/${encodeURIComponent(code)}?key=${encodeURIComponent(key)}`);
  }
  // join, leave, remove, start, end, begin, report (relay/seasons.mjs act).
  send(code, key, op, what = {}) {
    return this.ask(`/season/${encodeURIComponent(code)}`, { ...what, op, key });
  }
  publicView(code) {
    return this.ask(`/season/${encodeURIComponent(code)}/public`);
  }
}
