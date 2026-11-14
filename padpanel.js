// The controller panel (a game controller's View button): its buttons and
// what each does, then every key's action as a button of its own (sim/
// gamepad.mjs PAD_ACTIONS), so everything the keyboard does can be done
// from the controller - the D-pad to one, A to run it, B or View to close
// (the owner: "every option mapped to the controller too ... a button that
// pops up the key and button maps"). Pressing one closes the panel and
// does what its key does, through the game's own keys (app.js onKey). The
// touch screen's strip opens it too (More): every key's action, for a
// finger.

import { esc } from "./util.js";
import { BUTTONS, PAD_ACTIONS, PAD_ELSEWHERE } from "./sim/gamepad.mjs";

export class PadPanel {
  // run(action): do an action's key (app.js sends it as pressed).
  constructor({ run }) {
    this.run = run;
    this.el = document.createElement("div");
    this.el.className = "bay-help pad-panel";
    this.el.hidden = true;
    const groups = [...new Set(PAD_ACTIONS.map((a) => a.group))];
    const named = new Map();
    for (const b of BUTTONS) if (!named.has(b.name)) named.set(b.name, b.does);
    this.el.innerHTML = `<div class="bay-help-box pad-box" role="dialog" aria-label="Controller">
      <h2 class="pad-ctl">Controller</h2>
      <h2 class="pad-touch">Everything else</h2>
      <p class="small muted pad-ctl">Right stick: pull back, then push up through the ball - a swing. The D-pad picks a button below, A does it, B or View closes this.</p>
      <p class="small muted pad-touch">Every key's action, for a finger: tap one to do it.</p>
      <section class="pad-acts">
        ${groups
          .map(
            (g) => `<h3>${esc(g)}</h3><div class="buttons">${PAD_ACTIONS.map((a, i) => (a.group === g ? `<button type="button" data-act="${i}">${esc(a.label)}</button>` : "")).join("")}</div>`,
          )
          .join("")}
      </section>
      <section class="pad-ctl">
        <h3>Its buttons</h3>
        <table class="keys-full">${[...named].map(([name, does]) => `<tr><td><kbd>${esc(name)}</kbd></td><td>${esc(does)}</td></tr>`).join("")}</table>
        <h3>Done another way</h3>
        <table class="keys-full">${Object.entries(PAD_ELSEWHERE)
          .filter(([row]) => row !== "Controller")
          .map(([row, how]) => `<tr><td><kbd>${esc(row)}</kbd></td><td>${esc(how)}</td></tr>`)
          .join("")}</table>
      </section>
      <div class="buttons"><button type="button" class="primary" data-close>Close</button></div>
    </div>`;
    this.el.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) {
        // A click outside the box closes it.
        if (!e.target.closest(".pad-box")) this.show(false);
        return;
      }
      if (b.hasAttribute("data-close")) return this.show(false);
      const a = PAD_ACTIONS[Number(b.dataset.act)];
      if (!a) return;
      this.show(false);
      // Once closed, so the key goes to the game and not to this.
      setTimeout(() => this.run(a), 0);
    });
    document.body.appendChild(this.el);
  }

  get open() {
    return !this.el.hidden;
  }

  // touch: opened from the touch screen's strip (touchcontrols.js) - the
  // same buttons, without the controller's own words.
  show(on = !this.open, { touch = false } = {}) {
    this.el.classList.toggle("touch", !!on && touch);
    this.el.hidden = !on;
    if (!on && this.el.contains(document.activeElement)) document.activeElement.blur();
  }

  // A key while it's open (app.js asks first): Esc closes it and nothing
  // else happens; any other key closes it and carries on as itself.
  key(e) {
    if (!this.open) return false;
    if (e.key === "Escape") {
      e.preventDefault();
      this.show(false);
      return true;
    }
    // Tab and Enter work its buttons, as everywhere.
    if (e.key === "Tab" || e.key === "Enter" || e.key === " ") return true;
    this.show(false);
    return false;
  }
}
