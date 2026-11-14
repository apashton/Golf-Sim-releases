// The phone app held upright (sim/upright.mjs says why; its look is
// upright.css): the page marked (html.upright) as the phone turns, the touch
// strip moved into the dock under the picture (out of the picture's element,
// which it can't leave otherwise) and back onto the picture held sideways,
// and the picture sized again as it turns or the dock comes and goes - a
// round or session carrying on, nothing loaded again. And how the app turns
// with the phone (Menu -> Screens: sim/upright.mjs TURN_WAYS), said to the
// app (MainActivity's Turn plugin, android/ble-entry.js PocketTurn).
//
// Only in the app (window.pocket); on a PC nothing here does anything.

import { isUpright, cleanTurn } from "./sim/upright.mjs";
import { loadSetting, saveSetting } from "./util.js";

export class Upright {
  // view: the picture's element; strip: the touch strip's; on: the app;
  // onResize(): the picture sized again (app.js resize).
  constructor({ doc = document, view, strip, on = false, onResize = () => {} }) {
    this.doc = doc;
    this.view = view;
    this.strip = strip;
    this.onResize = onResize;
    this.up = false;
    this.on = !!on;
    if (!this.on) return;
    // The way it turns, as it was left.
    setTurnWay(phoneTurn());
    const win = doc.defaultView;
    // (Before app.js's own resize: the page marked first, so the picture's
    // measured as it will be.)
    win.addEventListener("resize", () => this.update());
    win.matchMedia?.("(orientation: portrait)")?.addEventListener?.("change", () => this.update());
    // Upright, the picture's height changes with the dock - the swing pad
    // shown or set aside, the side panel out or folded - without the
    // window's changing.
    if (typeof ResizeObserver === "function") new ResizeObserver(() => this.up && this.onResize()).observe(view);
    // (Marked as the page starts, before its picture can be sized: app.js
    // sizes it once it's set up.)
    this.update({ resize: false });
  }

  // Marked as the phone's held now, the strip where it goes - and the
  // picture sized again if it's turned.
  update({ resize = true } = {}) {
    if (!this.on) return false;
    const win = this.doc.defaultView;
    const up = isUpright(win.innerWidth, win.innerHeight);
    this.doc.documentElement.classList.toggle("upright", up);
    const home = up ? this.doc.body : this.view;
    if (this.strip && this.strip.parentNode !== home) home.append(this.strip);
    const turned = up !== this.up;
    this.up = up;
    if (turned && resize) this.onResize();
    return up;
  }
}

// How the app turns with the phone (Menu -> Screens, Turns with the phone):
// kept, and said to the app.
export const phoneTurn = () => cleanTurn(loadSetting("phoneTurn", "both"));
export function setPhoneTurn(way) {
  saveSetting("phoneTurn", cleanTurn(way));
  setTurnWay(way);
}

// Said to the app (nothing without it): its plugins' bundle loaded for it
// if it isn't yet, as the Bluetooth plugin is (pocket/pocket.mjs). Whether
// it's there, never the plugin itself: a Capacitor plugin is a stand-in
// that answers every name, `then` too, so an async function returning it
// had the promise call its then() - "Turn.then() is not implemented on
// android" (the owner's Phone check, 5 November 2026) - and never settle,
// and the app was never told how to turn.
async function haveTurnPlugin() {
  if (window.PocketTurn) return true;
  if (!window.Capacitor?.isNativePlatform?.()) return false;
  try {
    await import("/pocket/ble.js");
  } catch {
    return false;
  }
  return !!window.PocketTurn;
}
export async function setTurnWay(way) {
  try {
    if (!(await haveTurnPlugin())) return;
    await window.PocketTurn.set?.({ way: cleanTurn(way) });
  } catch {
    // (An app from before it could.)
  }
}
