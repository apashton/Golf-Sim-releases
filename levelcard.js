// The levels card (sim/levelchoice.mjs): the four levels side by side - how
// forgiving each is (dots, four at Beginner to one at Tour) and how far it
// hits (a bar, shortest at Beginner, longest at Tour), with the trade said
// under them - and a row for each player playing here, their level picked
// among the four. Opened from the level on the swing pad, the card before
// a round and the online lobby (app.js) - in the window it was asked from,
// with the screens separate; a game controller's D-pad and A work it as
// any card (gamepad.js). A level picked here is the player's
// own (Saved players), or a guest's the menu's.

import { esc } from "./util.js";
import { RANKED } from "./sim/swinglevels.mjs";
import { TRADE, levelFacts, levelTag } from "./sim/levelchoice.mjs";

export class LevelCard {
  // players(): [{ name, level }] - who's playing here and their own level;
  // setLevel(name, level): one picked; floor(): an online host's rule (the
  // easiest level anyone plays at: a RANKED level), or null; custom(): the
  // menu's Custom set.
  constructor({ doc = document, parent = doc.body, players = () => [], setLevel = () => {}, floor = () => null, custom = () => undefined }) {
    this.players = players;
    this.setLevel = setLevel;
    this.floor = floor;
    this.custom = custom;
    this.el = doc.createElement("div");
    this.el.className = "corner-card level-card";
    this.el.hidden = true;
    this.el.setAttribute("role", "dialog");
    this.el.setAttribute("aria-label", "Levels");
    parent.append(this.el);
    this.el.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.act === "done") return this.show(false);
      if (b.dataset.level && b.dataset.name != null) {
        this.setLevel(b.dataset.name, b.dataset.level);
        this.draw();
        // (The controller's place on the card kept.)
        this.el.querySelector(`button[data-name="${CSS.escape(b.dataset.name)}"][data-level="${b.dataset.level}"]`)?.focus({ preventScroll: true });
      }
    });
  }

  get open() {
    return !this.el.hidden;
  }

  // Into another window's page (with the screens separate: the controls
  // window's, or back to the game's), listeners and all.
  moveTo(doc) {
    if (doc?.body && this.el.ownerDocument !== doc) doc.body.append(this.el);
  }

  show(on = !this.open) {
    if (on) this.draw();
    this.el.hidden = !on;
    if (!on && this.el.contains(this.el.ownerDocument.activeElement)) this.el.ownerDocument.activeElement.blur();
  }

  // Drawn again if it's open (a player added, a level moved up).
  refresh() {
    if (this.open) this.draw();
  }

  draw() {
    const custom = this.custom();
    const facts = RANKED.map((k) => levelFacts(k, custom));
    const floor = this.floor();
    const dots = (n) => `<span class="lv-dots" aria-hidden="true">${[1, 2, 3, 4].map((i) => `<i${i <= n ? ' class="on"' : ""}></i>`).join("")}</span>`;
    const head = facts
      .map(
        (f) => `<div class="lv-col" data-forgive="${f.forgive}"><b>${esc(f.name)}</b>
          ${dots(f.forgive)}<small>${esc(f.forgiveWords)}</small>
          <span class="lv-reach" aria-hidden="true"><i style="width:${f.reach * 25}%"></i></span><small>drives ${f.drive.from}-${f.drive.most} yds</small></div>`,
      )
      .join("");
    const players = this.players();
    const rows = players
      .map((p) => {
        const tag = levelTag(p.level, floor);
        const note = tag.own === "custom" ? "Custom - your own mix (Menu, Swing pad & controller)" : tag.raised ? `Plays as ${tag.name} (the host's rule)` : "";
        return `<div class="lv-row"><span class="lv-name">${esc(p.name)}</span>${RANKED.map((k) => {
          const on = tag.own === k;
          const below = floor && RANKED.indexOf(k) < RANKED.indexOf(floor);
          return `<button type="button" class="lv-pick${on ? " on" : ""}${below ? " below" : ""}" data-name="${esc(p.name)}" data-level="${k}" aria-pressed="${on}" aria-label="${esc(p.name)}: ${esc(levelFacts(k, custom).name)}">${on ? "✓ " : ""}${esc(levelFacts(k, custom).name)}</button>`;
        }).join("")}${note ? `<span class="small muted lv-note">${esc(note)}</span>` : ""}</div>`;
      })
      .join("");
    this.el.innerHTML = `<b>Levels</b> <span class="small muted">for the mouse, a finger and a controller</span>
      <div class="lv-grid"><span></span>${head}</div>
      <p class="small lv-trade">${esc(TRADE)}</p>
      ${rows ? `<div class="lv-players">${rows}</div>` : `<p class="small muted">No one playing yet.</p>`}
      ${floor ? `<p class="small muted">Online, the host's rule: no one plays easier than ${esc(levelFacts(floor, custom).name)}.</p>` : ""}
      <p class="small muted">A level can be changed any time - here, or tap the level on the swing pad. Two good rounds at it and you move up one (Menu, Swing pad & controller).</p>
      <div class="buttons"><button type="button" class="primary" data-act="done">Done</button></div>`;
  }
}
