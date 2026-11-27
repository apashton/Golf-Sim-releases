// The Online tab's Open ladders (the owner, 7 November 2026: "make joining
// ladders etc really easy and even doable with strangers"): the ladders
// anyone can join - listed by their makers, each with a place free - from
// the relay's board (relay/board.mjs), under this bay's online ladders.
// Join takes a place at once; the ladder starts by itself when the last
// one goes (relay/ladders.mjs). Filters: how this bay swings, and near its
// handicap (sim/openladders.mjs). Asked when the section first shows and
// on Refresh - never on a timer (relay/README.md, "Keeping to the free
// plan"); the board itself is kept at the relay's edge for a minute.
// Part of CourseMode (course.js), split out of it: these methods are
// added to CourseMode.prototype there and run with `this` the course.

import { esc, loadSetting, saveSetting } from "../util.js";
import { openFor, rulesLine, placesLine, NEAR_STROKES } from "../sim/openladders.mjs";
import { joinedWords, WAY_NAMES } from "../sim/matchladder.mjs";

// The filters, kept: { swing: "mine" | "any", near: bool }.
const FILTER_KEY = "openLadders";

export class CourseLadderOpen {
  // The section's part, added under the online ladders (renderLadderInto).
  appendOpenLadders(el, scope) {
    if (scope !== "online") return;
    if (!this.ladderStore().on) return;
    // (Asked once as it first shows; Refresh asks again.)
    if (!this.openLadders) this.loadOpenLadders();
    const box = document.createElement("div");
    box.className = "ladder-open";
    box.innerHTML = this.openLaddersHtml();
    el.append(box);
    this.wireOpenLadders(box);
    // (On the web: this PC's ladders on a phone's browser - course/ladderweb.js.)
    const web = document.createElement("div");
    web.className = "ladder-web";
    web.innerHTML = this.webCardHtml();
    el.append(web);
    this.wireWebCard(web);
  }

  openFilters() {
    const f = loadSetting(FILTER_KEY, {});
    return { swing: f?.swing === "any" ? "any" : "mine", near: f?.near === true };
  }

  // The board, asked: { list, at } kept, or what went wrong.
  async loadOpenLadders() {
    this.openLadders = { ...(this.openLadders ?? {}), busy: true };
    // This bay's handicap, for Near my handicap (once).
    if (this.openIndex === undefined) {
      try {
        this.openIndex = await this.ownIndex(this.seasonName());
      } catch {
        this.openIndex = null;
      }
    }
    try {
      const reply = await this.ladderStore().board();
      this.openLadders = { list: Array.isArray(reply.ladders) ? reply.ladders : [], at: reply.at ?? Date.now() };
    } catch (err) {
      this.openLadders = { list: this.openLadders?.list ?? [], error: err.message };
    }
    this.renderLadder();
  }

  openLaddersHtml() {
    const o = this.openLadders ?? { busy: true };
    const f = this.openFilters();
    const way = this.ladderWayDefault?.() ?? "monitor";
    const mine = this.ladders.list.filter((L) => L.online).map((L) => L.online.code);
    const list = openFor(o.list, { mine, swing: f.swing, way, near: f.near, index: this.openIndex });
    const rows = list
      .map((e) => `<div class="ladder-card"><p class="small"><b>${esc(e.name)}</b> - ${esc(rulesLine(e))}<br>${esc(placesLine(e))}</p><p class="small"><button class="primary" data-open-join="${esc(e.code)}" title="Take a place on it as ${esc(this.seasonName())}: no one to wait for">Join</button></p></div>`)
      .join("");
    const none = o.busy && !o.list ? "Looking..." : o.error ? `Couldn't get the open ladders: ${o.error}` : (o.list ?? []).length && !list.length ? "None open that suit these filters - try Any, or untick Near my handicap." : "None open just now. Make one: New online ladder, with Places and Who can join: Anyone - it shows here for others to join.";
    return `<h4>Open ladders</h4>
      <p class="small muted">Ladders anyone can join: take a place, and each starts by itself when its places are all taken. Names only, and only set lines to say - nothing typed.</p>
      <p class="small"><label title="Ladders for how you swing here (${esc(WAY_NAMES[way])}), or every one">Swing <select data-open-swing><option value="mine" ${f.swing === "mine" ? "selected" : ""}>Yours (${esc(WAY_NAMES[way].toLowerCase())})</option><option value="any" ${f.swing === "any" ? "selected" : ""}>Any way</option></select></label>
      <label title="Only ladders whose players' handicaps are within ${NEAR_STROKES} of yours"><input type="checkbox" data-open-near ${f.near ? "checked" : ""}> Near my handicap</label>
      <button data-open-refresh title="Ask again what's open">Refresh</button></p>
      ${rows || `<p class="small muted">${esc(none)}</p>`}`;
  }

  wireOpenLadders(box) {
    const keep = (patch) => {
      saveSetting(FILTER_KEY, { ...this.openFilters(), ...patch });
      this.renderLadder();
    };
    box.querySelector("[data-open-swing]")?.addEventListener("change", (e) => keep({ swing: e.target.value }));
    box.querySelector("[data-open-near]")?.addEventListener("change", (e) => keep({ near: e.target.checked }));
    box.querySelector("[data-open-refresh]")?.addEventListener("click", () => this.loadOpenLadders());
    for (const b of box.querySelectorAll("[data-open-join]")) b.addEventListener("click", () => this.joinOpenLadder(b.dataset.openJoin));
  }

  // A place taken on an open ladder: joined as this bay's player, the
  // ladder then shown above (and taken off the list).
  async joinOpenLadder(code) {
    const name = this.seasonName();
    try {
      const L = await this.joinOnline(code, { name, own: await this.ownIndex(name) });
      this.ladderForm = false;
      this.onToast(joinedWords(L, name), 4500);
    } catch (err) {
      this.onToast(err.message, 4000);
      // (Filled meanwhile, or gone: the list asked again.)
      this.loadOpenLadders();
    }
    this.renderLadder();
  }
}
