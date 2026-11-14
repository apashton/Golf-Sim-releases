// The game page's part in a phone linked to the PC (sim/devicelink.mjs):
// the same names are the same players on both.
//   - On the PC: the saved players told to the server whenever they change
//     (server/phonelinks.mjs leaves them for the phones), and a player who
//     came in from a phone (the link's view, add) saved here too.
//   - On the phone: the PC's saved players taken into the phone's when they
//     come down (pocket/pocket.mjs says so: "pocket-linkdown").

import { addProfile, isProfile, isGuest } from "./sim/profiles.mjs";
import { mergeProfiles } from "./sim/devicelink.mjs";

export class PagePhoneLink {
  // pocket: the phone app. profiles(): the saved players now; save(p):
  // saved (app.js saveProfiles).
  constructor({ pocket = false, profiles, save, fetchImpl = (...a) => fetch(...a), win = globalThis.window } = {}) {
    Object.assign(this, { pocket, profiles, save, fetch: fetchImpl });
    if (pocket) win?.addEventListener?.("pocket-linkdown", (e) => this.down(e.detail));
    else this.tell();
  }

  // The PC's saved players, to its server.
  tell() {
    if (this.pocket) return;
    this.fetch("/api/phone/link/players", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ players: this.profiles().list }) }).catch(() => null);
  }

  // The link's view on the PC: anyone from a phone not saved here, saved -
  // and, a browser having left something for this PC (a ladder joined on
  // the web), onInbox (app.js: course/ladderweb.js takeWebInbox).
  heard(view) {
    if (view?.inbox > 0) this.onInbox?.();
    const was = this.profiles();
    let p = was;
    for (const n of view?.add ?? []) if (typeof n === "string" && !isGuest(n) && !isProfile(p, n)) p = addProfile(p, n);
    if (p !== was) this.save(p);
  }

  // What came down to the phone: the PC's players taken in.
  down(d) {
    const was = this.profiles();
    const p = mergeProfiles(was, d?.players ?? []);
    if (p !== was) this.save(p);
  }
}
