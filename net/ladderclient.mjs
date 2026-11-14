// The game's side of an online match ladder (relay/ladders.mjs): asks the
// relay's ladder store over plain HTTP. One request each time - opening the
// ladder, a challenge, an answer, a result - and never on a timer of its
// own (relay/README.md, "Keeping to the free plan").
//   relay: the online play relay's address (wss://... - netgame.mjs
//   DEFAULT_RELAY, or RELAY_URL); "" for none.

import { token } from "../sim/netgame.mjs";

// wss://host -> https://host (ws:// -> http://), the store's base.
export const ladderBase = (relay) =>
  String(relay ?? "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/^wss:/, "https:")
    .replace(/^ws:/, "http:");

// A bay's own key for a ladder: kept with it on this PC, never shown.
export const newLadderKey = () => token(16);

export class LadderClient {
  // what: what it's for, in its words ("Online ladders").
  constructor({ relay, fetchImpl = globalThis.fetch?.bind(globalThis), what = "Online ladders", store = "ladder store" } = {}) {
    this.base = ladderBase(relay);
    this.fetch = fetchImpl;
    this.what = what;
    this.store = store;
  }

  get on() {
    return !!this.base && typeof this.fetch === "function";
  }

  async ask(path, body = null) {
    if (!this.on) throw new Error(`${this.what} need the online play relay, and there isn't one set up`);
    let res;
    try {
      res = await this.fetch(`${this.base}${path}`, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {});
    } catch {
      throw new Error(`Couldn't reach the ${this.what.toLowerCase()} - check the internet connection`);
    }
    const reply = await res.json().catch(() => ({}));
    if (!res.ok || reply.ok === false) throw Object.assign(new Error(reply.error ?? `The ${this.store} said ${res.status}`), { status: res.status });
    return reply;
  }

  // A new ladder: { code, ladder, me, admin, ... }.
  create(key, { name, rules, me, seed }) {
    return this.ask("/ladder", { op: "create", key, name, rules, me, seed });
  }
  read(code, key) {
    return this.ask(`/ladder/${encodeURIComponent(code)}?key=${encodeURIComponent(key)}`);
  }
  // Any other request: join, admit, turnaway, remove, handover, start,
  // challenge, accept, decline, cancel, void, leave, away, room, report
  // (relay/ladders.mjs act).
  send(code, key, op, what = {}) {
    return this.ask(`/ladder/${encodeURIComponent(code)}`, { ...what, op, key });
  }
  // What anyone may see of a ladder, without a key (relay/ladders.mjs
  // publicView): { code, ladder, places, filled, started }.
  publicView(code) {
    return this.ask(`/ladder/${encodeURIComponent(code)}/public`);
  }
  // The open ladders' board (relay/board.mjs): { ladders: [entries], at }.
  board() {
    return this.ask("/board");
  }
}
