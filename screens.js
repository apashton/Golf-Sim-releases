// Separate windows: the game on one screen (the projector), the controls on
// another (the laptop), the shot data on a third. Shift + D, the Screens
// button in the top bar, or the menu's Screens page flip between them and
// one window.
//
// There is still only one sim. The controls window (controls.html) is an
// empty page of the same site, opened by the sim; the sim moves its own top
// bar, side panel and menus into it, and back again when docking. They are
// the same elements with the same listeners, run by the same code, so every
// panel works there as it does here, and whatever it changes happens to the
// one game. Keys pressed in the controls window go to the sim's own key
// handler; the picture, the numbers over it, the cards and the toasts stay
// on the game window, where the player at the mat can see them.
//
// Closing the controls window docks them back rather than losing them. In a
// browser, Separate needs pop-ups allowed; it says so when they aren't.

import { screensMode } from "./sim/screens.mjs";

const NAME = "golfsim-controls";
// How long the controls page has to load before giving up - longer as the
// game starts: the page loads in the game's own process, while the game is
// busy building its first scene, and given 10 s there it sometimes gave up,
// leaving the controls in the game window and the three screens as two
// (the owner, 20 October 2026: "my three screen setup ends up loading back
// to two screens from time to time").
const LOAD_MS = 10000;
export const START_LOAD_MS = 60000;

export class Screens {
  // parts(): the elements that go to the controls window, in page order.
  // onKey(e): the sim's key handler. onChange(e): the sim's "change"
  // handler (a used control lets go of the keyboard). moved(separate):
  // after they've moved either way. toast(text, ms). bridge: the Windows
  // app's (it places the windows), or null. onActivity(): a key, a click or
  // a control used in the controls window (the picture wakes: app.js).
  constructor({ parts, onKey, onChange = () => {}, moved = () => {}, toast = () => {}, bridge = null, onActivity = () => {} }) {
    this.parts = parts;
    this.onKey = onKey;
    this.onChange = onChange;
    this.onActivity = onActivity;
    this.moved = moved;
    this.toast = toast;
    this.bridge = bridge;
    this.win = null;
    this.places = [];
    this.opening = null;
    // A confirm() asked while the controls window has the keyboard (a panel
    // button, say) is asked there, not on the projector.
    const own = window.confirm.bind(window);
    window.confirm = (text) => {
      const w = this.win;
      try {
        if (w && !w.closed && w.document.hasFocus()) return w.confirm(text);
      } catch {
        // Gone mid-question: ask here.
      }
      return own(text);
    };
    // The sim reloading (G, the menu's Reload): the controls window
    // goes with it, and the new page opens a new one if it should. The app
    // isn't told they're docked, as they won't be for long.
    window.addEventListener("pagehide", () => {
      this.unloading = true;
      this.dock();
    });
  }

  get separate() {
    return !!this.win;
  }

  // The document the controls are in now.
  get doc() {
    return this.win?.document ?? document;
  }

  toggle() {
    return this.separate ? this.dock() : this.open();
  }

  // Opens the controls window and moves the controls into it. True once
  // they're there. quiet: at start-up, with nobody's key or click behind it
  // (a browser may block the pop-up until there is one).
  open({ quiet = false } = {}) {
    if (this.separate) return Promise.resolve(true);
    if (this.opening) return this.opening;
    this.opening = this.#open(quiet).finally(() => (this.opening = null));
    return this.opening;
  }

  async #open(quiet) {
    let w = null;
    // The one opened as the page started (earlyscreens.js), if it's still
    // there: loaded already, so the controls go straight in.
    const early = quiet ? takeEarlyControls() : null;
    if (early) {
      w = early.win;
      this.stamp = early.stamp;
    } else {
      try {
        // A new window each time, never one found by name: after a reload the
        // old one may still be closing, and would take the new page with it.
        this.stamp = String(Date.now());
        w = window.open(`controls.html?open=${this.stamp}`, `${NAME}-${this.stamp}`, "popup,width=1280,height=800");
      } catch {
        w = null;
      }
    }
    // (Blocked: a browser wants a key or a click first - #retryOnGesture.)
    this.blocked = !w;
    if (!w) {
      this.toast(
        quiet
          ? "Separate windows: pop-ups are blocked - press any key or click to open the controls window"
          : "Pop-ups are blocked, so the controls can't have a window of their own. Allow pop-ups for this page (the address bar's icon), then Shift + D",
        6000,
      );
      if (quiet) this.#retryOnGesture();
      return false;
    }
    const ready = await loaded(w, this.stamp, quiet ? START_LOAD_MS : LOAD_MS);
    if (!ready) {
      try {
        w.close();
      } catch {
        // Already gone.
      }
      this.toast("The controls window didn't open - still in one window", 4000);
      return false;
    }
    const body = w.document.body;
    // The menus' and buttons' style (uistyle.js) goes with them.
    w.document.documentElement.dataset.ui = document.documentElement.dataset.ui ?? "";
    this.places = [];
    for (const el of this.parts()) {
      if (!el) continue;
      this.places.push({ el, parent: el.parentNode, next: el.nextSibling });
      // Appending adopts it into the controls window's document, listeners
      // and all.
      keepModal(el, () => body.appendChild(el));
    }
    this.win = w;
    w.addEventListener("keydown", this.onKey);
    w.document.addEventListener("change", this.onChange);
    for (const type of ["keydown", "pointerdown", "wheel", "input"]) w.addEventListener(type, () => this.onActivity(), { capture: true, passive: true });
    // Closed (its X, Alt + F4) or reloaded: the controls come home.
    w.addEventListener("pagehide", () => this.dock({ closed: true }));
    clearInterval(this.watch);
    this.watch = setInterval(() => w.closed && this.dock({ closed: true }), 250);
    this.bridge?.setScreens?.(true);
    this.moved(true);
    return true;
  }

  // Blocked at start-up: the next key or click in the sim (which a browser
  // counts as the player's say-so) opens it.
  #retryOnGesture() {
    const once = () => {
      window.removeEventListener("keydown", once, true);
      window.removeEventListener("pointerdown", once, true);
      if (!this.separate) this.open();
    };
    window.addEventListener("keydown", once, true);
    window.addEventListener("pointerdown", once, true);
  }

  // Everything back in the one window, as it was. closed: the controls
  // window has gone already (or is going).
  dock({ closed = false } = {}) {
    const w = this.win;
    if (!w) return false;
    this.win = null;
    clearInterval(this.watch);
    // Back where each came from, last first, so each one's neighbour is
    // home before it.
    for (const { el, parent, next } of this.places.reverse()) {
      keepModal(el, () => parent.insertBefore(el, next && next.parentNode === parent ? next : null));
    }
    this.places = [];
    if (!closed) {
      try {
        w.close();
      } catch {
        // Already gone.
      }
    }
    if (!this.unloading) {
      this.bridge?.setScreens?.(false);
      this.moved(false);
    }
    return true;
  }

  // The keyboard to the controls window: a menu has opened there.
  focusControls() {
    if (!this.win) return;
    // The app raises the window itself; a browser lets the page that
    // opened a pop-up bring it forward.
    if (this.bridge?.focusControls) return void this.bridge.focusControls();
    try {
      this.win.focus();
    } catch {
      // Gone.
    }
  }

  // What was chosen last time: "separate" or "docked".
  static mode(saved) {
    return screensMode(saved);
  }
}

// A card open over the page as it moves (Who's playing, opened as the game
// starts and the controls window opens a moment later): moving it takes it
// out of the page's top layer, leaving it open but stuck at the top of the
// page behind the boxes. It's opened again over the window it went to -
// in the middle, in front of everything.
export function keepModal(el, move) {
  const modal = el?.tagName === "DIALOG" && el.open && el.matches(":modal");
  move();
  if (!modal || el.matches(":modal")) return;
  el.removeAttribute("open");
  try {
    el.showModal();
  } catch {
    el.setAttribute("open", "");
  }
}

// The controls window earlyscreens.js opened as the page started, handed
// over once (null if there's none, or it's been closed since).
export function takeEarlyControls(from = window) {
  const early = from.__earlyControls;
  from.__earlyControls = null;
  try {
    if (early?.win && !early.win.closed) return early;
  } catch {
    // Gone.
  }
  return null;
}

// Waits for the controls page to finish loading in the new window (it
// starts as a blank page, then loads controls.html in the same window
// object). True once its body is there.
function loaded(w, stamp, most = LOAD_MS) {
  return new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      try {
        if (w.closed) return resolve(false);
        const d = w.document;
        if (d.readyState === "complete" && /\/controls\.html$/.test(w.location.pathname) && w.location.search === `?open=${stamp}` && d.body?.classList.contains("controls-window")) return resolve(true);
      } catch {
        // Between pages for a moment.
      }
      if (Date.now() - start > most) return resolve(false);
      setTimeout(check, 40);
    };
    check();
  });
}
