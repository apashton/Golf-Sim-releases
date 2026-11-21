// The side panel's fold (sim/sidepanel.mjs has the rules): a tab on the
// picture's right edge folds the panel away and opens it again, and a pin
// beside it keeps it open while playing. Folded, the body has the class
// side-folded: the panel goes, the picture takes its width, and the shot's
// numbers and notes are over the picture (style.css). app.js tells it when
// play starts (played) and redraws the picture at its new size (onResize).

import { loadSetting, saveSetting } from "./util.js";
import { cleanSide, sideAfter, foldedHere } from "./sim/sidepanel.mjs";

const PIN_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3l6 6-2 1-3.5 3.5.5 4.5-2 2-4-4-5 5-1-1 5-5-4-4 2-2 4.5.5L14 5z"/></svg>`;

export class SideFold {
  // view: the picture's element (the tab goes on its right edge).
  // here(): { bay, separate } - whether the panel's there to fold.
  // onResize(): the picture's size changed. onChange(state): kept/changed
  // (the menu follows).
  constructor({ view, doc = document, here = () => ({}), onResize = () => {}, onChange = () => {} }) {
    this.doc = doc;
    this.here = here;
    this.onResize = onResize;
    this.onChange = onChange;
    this.state = cleanSide(loadSetting("sidePanel", {}));
    this.el = doc.createElement("div");
    this.el.className = "side-grip";
    this.el.innerHTML = `<button type="button" class="sg-fold"></button><button type="button" class="sg-pin" aria-label="Pin the side panel open">${PIN_SVG}</button>`;
    view.appendChild(this.el);
    this.el.querySelector(".sg-fold").addEventListener("click", (e) => {
      e.currentTarget.blur();
      this.change("toggle");
    });
    this.el.querySelector(".sg-pin").addEventListener("click", (e) => {
      e.currentTarget.blur();
      this.change(this.state.pinned ? "unpin" : "pin");
    });
    // (As the page starts: the picture's sized as it starts anyway.)
    this.show({ resize: false });
  }

  get pinned() {
    return this.state.pinned;
  }
  get folded() {
    return foldedHere(this.state, this.here());
  }

  // Play started (a shot, a round): folded unless pinned.
  played() {
    this.change("play");
  }
  setPinned(on) {
    this.change(on ? "pin" : "unpin");
  }

  change(what) {
    const next = sideAfter(this.state, what);
    if (next.pinned === this.state.pinned && next.folded === this.state.folded) return;
    this.state = next;
    saveSetting("sidePanel", this.state);
    this.show();
    this.onChange(this.state);
  }

  // The page as the state is: the class, the tab's words, the picture's size.
  show({ resize = true } = {}) {
    const folded = this.folded;
    const was = this.doc.body.classList.contains("side-folded");
    this.doc.body.classList.toggle("side-folded", folded);
    this.doc.body.classList.toggle("side-pinned", this.state.pinned);
    const fold = this.el.querySelector(".sg-fold");
    fold.textContent = folded ? "‹" : "›";
    fold.title = folded ? "Open the side panel (each mode's settings)" : "Fold the side panel away - the picture the whole width";
    fold.setAttribute("aria-label", folded ? "Open the side panel" : "Fold the side panel away");
    const pin = this.el.querySelector(".sg-pin");
    pin.classList.toggle("on", this.state.pinned);
    pin.title = this.state.pinned ? "Pinned open - click to let it fold away by itself as you play" : "Pin it open - otherwise it folds away by itself as you play";
    pin.setAttribute("aria-pressed", String(this.state.pinned));
    if (resize && folded !== was) this.onResize();
  }
}
