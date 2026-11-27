// The Tour's word as the game opens (sim/tournotice.mjs has what's said):
// asked once, a few seconds after the game's up and someone's signed in -
// the week looked at, last week's too the first time in a week - and said
// over the picture. What's been seen is kept here (setting tourSeen), and
// brought up to date whenever the Tour's panel is looked at, so a place
// that's gone down is only said once.

import { tourNotice, lookedAt } from "./sim/tournotice.mjs";
import { loadSetting, saveSetting } from "./util.js";

export class TourNotice {
  // hub: the TourHub. account(): the account signed in here, or null.
  // toast(text, ms). now(): the clock.
  constructor({ hub, account = () => null, toast = () => {}, now = () => Date.now() }) {
    Object.assign(this, { hub, account, toast, now });
    this.said = null;
  }

  get seen() {
    return loadSetting("tourSeen", null);
  }
  set seen(v) {
    saveSetting("tourSeen", v);
  }

  // Asked (once): -> what was said, or null.
  async check() {
    if (this.said || !this.account() || !this.hub.on) return null;
    await this.hub.refresh();
    if (!this.hub.view || this.hub.error || !this.hub.mine) return null;
    const week = this.hub.week;
    const seen = this.seen;
    // (Last week's own: asked for only when it hasn't been said yet.)
    const last = seen?.last === week - 1 ? null : await this.hub.mineOf(week - 1);
    const n = tourNotice({ week, day: Math.floor(this.now() / 86400000), round: this.hub.view.round?.setup ?? null, mine: this.hub.mine, last, season: this.hub.mine.season ?? null, seen });
    if (!n) {
      this.seen = lookedAt(seen, week, this.hub.mine);
      return null;
    }
    this.said = n;
    this.seen = n.seen;
    this.toast(n.text, 8000);
    return n;
  }

  // The Tour's panel looked at: its places seen.
  looked() {
    if (this.hub.mine) this.seen = lookedAt(this.seen, this.hub.week, this.hub.mine);
  }
}
