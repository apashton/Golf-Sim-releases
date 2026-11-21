// The phone app's top bar folding away while playing (sim/topbarfold.mjs
// has the rules): over the picture rather than above it, so the picture
// keeps its size as the bar comes and goes; slid up out of sight once
// you're playing, and back with a touch on the tab left there - not a pull
// from the screen's top edge, which is Android's own (its notifications:
// the owner, 1 November 2026, "the pull down from the top interferes with
// the android own pull down from top option"). The body has the class
// bar-hidden while it's away (style.css), and --bar-top / --bar-room say
// how much of the screen's and the picture's top it covers (phoneplay.css
// keeps the touch strip and the Session button under it). Pinned, it's above the picture as on the PC.
// app.js tells it of each shot (played).

import { loadSetting, saveSetting } from "./util.js";
import { cleanBar, barShown, barRecheck } from "./sim/topbarfold.mjs";

export class TopBarFold {
  // header: the top bar. on: whether it folds here at all (the phone app).
  // inGame(): the game's in front (not the phone's home screens). busy():
  // something of the bar's in use (the menu, a box asking something).
  // onChange(state): pinned or not (the menu follows).
  constructor({ header, doc = document, on = false, inGame = () => true, busy = () => false, onChange = () => {} }) {
    this.doc = doc;
    this.header = header;
    this.on = !!on && !!header;
    this.inGame = inGame;
    this.busy = busy;
    this.onChange = onChange;
    this.state = cleanBar(loadSetting("topBar", {}));
    // Shown when the game first comes up, then away a few seconds later.
    this.touchedAt = Date.now();
    this.timer = null;
    if (!this.on) return;
    this.tab = doc.createElement("button");
    this.tab.type = "button";
    this.tab.className = "bar-pull";
    this.tab.title = "The top bar";
    this.tab.setAttribute("aria-label", "Show the top bar");
    // (At the touch: a tap, or a finger drawn down from it.)
    this.tab.addEventListener("pointerdown", () => this.reveal());
    this.tab.addEventListener("click", () => this.reveal());
    doc.body.appendChild(this.tab);
    // Touching the bar keeps it up.
    const touch = () => this.reveal();
    header.addEventListener("pointerdown", touch);
    header.addEventListener("focusin", touch);
    // (A club or player picked: let go of the list, its few seconds on.)
    header.addEventListener("change", (e) => {
      if (e.target?.tagName === "SELECT") e.target.blur();
      touch();
    });
    // (The menu closing, a box answered: looked at again now and then.)
    setInterval(() => this.update(), 800);
    this.update();
  }

  get pinned() {
    return this.state.pinned;
  }
  get hidden() {
    return this.doc.body.classList.contains("bar-hidden");
  }

  // A shot: away at once (unless it's pinned or in use).
  played() {
    this.touchedAt = null;
    this.update();
  }
  // Wanted: shown, for a few seconds more.
  reveal() {
    this.touchedAt = Date.now();
    this.update();
  }
  setPinned(on) {
    this.state = cleanBar({ pinned: on });
    saveSetting("topBar", this.state);
    this.update();
    this.onChange(this.state);
  }

  update() {
    if (!this.on) return;
    const now = Date.now();
    const busy = !!this.busy();
    const inGame = !!this.inGame();
    // (In use until now, or the game just come up from the phone's home:
    // its few seconds count from now - seen before it goes.)
    if (busy || (inGame && !this.wasInGame)) this.touchedAt = now;
    this.wasInGame = inGame;
    const at = { pinned: this.state.pinned, inGame, busy, touchedAt: this.touchedAt, now };
    const shown = barShown(at);
    // (Pinned, it's back above the picture, covering none of it.)
    this.doc.documentElement.classList.toggle("bar-folds", !this.state.pinned);
    this.doc.body.classList.toggle("bar-hidden", !shown);
    // (What it covers, for what's kept clear of it - phoneplay.css: of
    // the screen's top while it's shown (--bar-top, for what's fixed to the
    // screen), and of the picture's while it lies over it (--bar-room).)
    const h = this.header.offsetHeight || 0;
    const root = this.doc.documentElement.style;
    root.setProperty("--bar-top", `${shown ? h : 0}px`);
    root.setProperty("--bar-room", `${shown && !this.state.pinned ? h : 0}px`);
    // (Away, it's out of sight and can't be pressed - style.css; the menu
    // makes it inert while it's open, so that's left to it.)
    this.tab.hidden = shown;
    clearTimeout(this.timer);
    const wait = barRecheck(at);
    this.timer = wait == null ? null : setTimeout(() => this.update(), wait + 20);
  }
}
