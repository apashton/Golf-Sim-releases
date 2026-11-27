// A phone linked to the PC (sim/devicelink.mjs says what and why): the
// relay's link mailbox asked over plain HTTP (relay/links.mjs) - the
// client both sides use (LinkClient: the PC's server too,
// server/phonelinks.mjs) - and the phone's half (PhoneLink): joining with
// the PC's code, then each time it syncs, its outbox's writes handed to the
// mailbox a batch at a time and what the PC left for it taken back.

import { token } from "../sim/netgame.mjs";
import { ladderBase } from "./ladderclient.mjs";
import { outboxBatches, outboxSummary, keepHandicaps } from "../sim/phonesync.mjs";
import { readLinkCode, linkCodeFromLink, readDown, phoneLinkWords } from "../sim/devicelink.mjs";

// A device's own key for its link: kept with it, never shown.
export const newLinkKey = () => token(16);
// A batch's text, well inside the relay's most (links.mjs BATCH_BYTES).
export const LINK_BATCH = 100 * 1024;

export class LinkClient {
  constructor({ relay, fetchImpl = globalThis.fetch?.bind(globalThis) } = {}) {
    this.base = ladderBase(relay);
    this.fetch = fetchImpl;
  }

  get on() {
    return !!this.base && typeof this.fetch === "function";
  }

  async ask(path, body) {
    if (!this.on) throw new Error("Linking needs the online play relay, and there isn't one set up");
    let res;
    try {
      res = await this.fetch(`${this.base}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } catch {
      throw Object.assign(new Error("Couldn't reach the online server - check the internet connection"), { status: 0 });
    }
    const reply = await res.json().catch(() => ({}));
    if (!res.ok || reply.ok === false) throw Object.assign(new Error(reply.error ?? `The online server said ${res.status}`), { status: res.status, reply });
    return reply;
  }

  // The PC's: a new link ({ code, open, phones }), or its link opened for a
  // phone again.
  create(key, name) {
    return this.ask("/link", { op: "create", key, name });
  }
  open(code, key) {
    return this.ask(`/link/${encodeURIComponent(code)}`, { op: "open", key });
  }
  // The phone's: on with the code; then its writes up, what the PC left down.
  join(code, key, { device, name }) {
    return this.ask(`/link/${encodeURIComponent(code)}`, { op: "join", key, device, name });
  }
  phone(code, key, { entries = [], down = false } = {}) {
    return this.ask(`/link/${encodeURIComponent(code)}`, { op: "phone", key, entries, down });
  }
  // The PC's sync: what it's filed (took: { device: n }), what its phones
  // should know (down), its name; back come the phones and their batches.
  // got: the ids of what a browser left that the PC has taken up (they go
  // from the relay only then - relay/links.mjs).
  pc(code, key, { took = {}, down = null, name = null, got = [] } = {}) {
    return this.ask(`/link/${encodeURIComponent(code)}`, { op: "pc", key, took, ...(down ? { down } : {}), ...(name ? { name } : {}), got });
  }
  // A phone off its link; the PC taking a phone off (device), or ending it.
  unlink(code, key, device = null) {
    return this.ask(`/link/${encodeURIComponent(code)}`, { op: "unlink", key, ...(device ? { device } : {}) });
  }
}

// ---- The phone's half -----------------------------------------------------------

// store: the pocket server's ({ get, set }): the link kept as "link" ({
// code, key, pc, joined, synced, pcSeen, downAt }), the last that came
// down as "linkDown". outbox: phonesync.mjs phoneOutbox. name(): what the
// PC calls this phone. onDown(down): what came down (readDown), new.
// onChange(view).
export class PhoneLink {
  constructor({ store, outbox, relay, name = () => "Phone", onDown = () => {}, onChange = () => {}, fetchImpl, now = () => Date.now() } = {}) {
    this.store = store;
    this.outbox = outbox;
    this.client = new LinkClient({ relay, fetchImpl });
    this.name = name;
    this.onDown = onDown;
    this.onChange = onChange;
    this.now = now;
    this.state = "off";
    this.error = null;
    this.busy = null;
  }

  get link() {
    const l = this.store.get("link");
    return l && readLinkCode(l.code) && typeof l.key === "string" ? l : null;
  }
  get linked() {
    return !!this.link;
  }
  keep(fields) {
    this.store.set("link", fields ? { ...(this.link ?? {}), ...fields } : null);
  }

  // { linked, code, pc, synced, pcSeen, waiting, state, error, words, down }.
  view() {
    const l = this.link;
    const waiting = outboxSummary(this.outbox.entries()).players.reduce((n, p) => n + p.shots, 0);
    const v = { linked: !!l, code: l?.code ?? null, pc: l?.pc ?? null, synced: l?.synced ?? null, pcSeen: l?.pcSeen ?? null, waiting, state: this.state, error: this.error, down: this.store.get("linkDown") ?? null };
    return { ...v, words: phoneLinkWords(v, this.now()) };
  }
  changed() {
    this.onChange(this.view());
  }

  // On the PC's link with its code (as typed, or a link's), then in step.
  async join(typed) {
    const code = readLinkCode(typed) ?? linkCodeFromLink(typed);
    if (!code) {
      this.state = "failed";
      this.error = "That isn't a link code - it's a P and five letters and numbers, as the PC shows it";
      this.changed();
      return this.view();
    }
    const key = newLinkKey();
    this.state = "syncing";
    this.error = null;
    this.changed();
    try {
      const r = await this.client.join(code, key, { device: this.outbox.device, name: this.name() });
      this.keep({ code, key, pc: r.pc?.name ?? null, pcSeen: r.pc?.seen ?? null, joined: this.now(), synced: null, downAt: null });
    } catch (err) {
      this.state = "failed";
      this.error = err.message;
      this.changed();
      return this.view();
    }
    return this.sync();
  }

  // In step: the writes up, a batch at a time (each the relay's now, so off
  // the phone), then what the PC left. One at a time.
  sync() {
    if (!this.linked) return Promise.resolve(this.view());
    this.busy ??= this.syncing().finally(() => (this.busy = null));
    return this.busy;
  }

  async syncing() {
    const { code, key } = this.link;
    this.state = "syncing";
    this.error = null;
    this.changed();
    let reply = null;
    let problem = null;
    try {
      for (let i = 0; i < 200; i++) {
        const [batch] = outboxBatches(this.outbox.entries(), LINK_BATCH);
        if (!batch) break;
        try {
          reply = await this.client.phone(code, key, { entries: batch });
        } catch (err) {
          // Full up (the PC hasn't been on for a while): they wait here.
          if (err.reply?.full) {
            problem = err.message;
            break;
          }
          throw err;
        }
        if (!(reply.upTo >= batch[0].n)) throw new Error("The online server didn't take them - try again");
        this.outbox.taken(reply.upTo);
      }
      reply = await this.client.phone(code, key, { down: true });
      const down = readDown(reply.down);
      if (down && reply.downAt !== this.link?.downAt) {
        this.store.set("linkDown", down);
        keepHandicaps(this.store, down.handicaps);
        this.keep({ downAt: reply.downAt });
        this.onDown(down);
      }
      this.keep({ pc: reply.pc?.name ?? this.link?.pc, pcSeen: reply.pc?.seen ?? null, synced: this.now() });
      this.state = problem ? "failed" : "done";
      this.error = problem;
    } catch (err) {
      // Taken off on the PC (or the link ended there): not linked now.
      if (err.status === 403 || err.status === 404) {
        this.keep(null);
        this.state = "off";
        this.error = "The PC unlinked this phone - link it again from the PC's My stats";
      } else {
        this.state = "failed";
        this.error = err.message;
      }
    }
    this.changed();
    return this.view();
  }

  // Off the link (the relay told; gone here whatever it says).
  async unlink() {
    const l = this.link;
    if (l) await this.client.unlink(l.code, l.key).catch(() => null);
    this.keep(null);
    this.store.set("linkDown", null);
    this.state = "off";
    this.error = null;
    this.changed();
    return this.view();
  }
}
