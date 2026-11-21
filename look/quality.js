// The graphics setting - Standard, Medium, High or Ultra - chosen in the menu or
// with G (sim/graphics.mjs). Changing it reloads the page, since it decides
// what gets built; while playing, the game steps down from it by itself
// when the picture stays slow (look/safety.js), never above it.

import { loadSetting, saveSetting } from "../util.js";
import { readGraphics, chooseSetting, nextSetting } from "../sim/graphics.mjs";
import { guardStart } from "../sim/startguard.mjs";

// The start's guard (sim/startguard.mjs): a setting that didn't finish
// starting last time starts one lower this time; "?graphics=standard"
// starts on Standard. Noted now, cleared once the first picture is up
// (startedSafely, from app.js).
const guard = guardStart(loadSetting("graphics", {}), loadSetting("startGuard", null), Date.now(), typeof location === "undefined" ? "" : location.search);
if (guard.changed) saveSetting("graphics", guard.graphics);
saveSetting("startGuard", guard.note);
// "?graphics=..." is for this start only: off the address, so a reload
// (G, the menu) builds what's saved.
if (typeof location !== "undefined" && /[?&]graphics=/.test(location.search)) {
  const u = new URL(location.href);
  u.searchParams.delete("graphics");
  history.replaceState(history.state, "", u);
}
// What to say about it once the game is up ("" for nothing).
export const startMessage = guard.message;
export function startedSafely() {
  saveSetting("startGuard", null);
}

// The setting this page is built at.
export const LEVEL = guard.setting;
// Medium's detail or more: what High was before there were three (the
// grass, trees and shadows in full). Medium and High build the same
// scenes; High adds its extras on top.
export const HIGH = LEVEL !== "standard";
// High's extras (3D trees further out, more far woods, long grass): only
// counts and distances, so the safety valve can drop them between shots.
// Ultra has them all.
export const EXTRA = LEVEL === "high" || LEVEL === "ultra";
// Ultra's own (the long grass fuller and further out).
export const ULTRA = LEVEL === "ultra";
// The phone app (window.pocket: set before the game's code, pocket/start.js),
// whatever the setting: its picture is a thousand-odd pixels across on a
// six-inch screen (sim/phonepicture.mjs), so what's finer than that can
// show is left out or drawn coarser - the ground's finest blades, the
// shadow maps at half the size each way (the same detail on its pixels as
// the PC's maps on a monitor's).
export const PHONE = typeof window !== "undefined" && !!window.pocket;

// The setting saved, which G and the menu change (the page is built at
// LEVEL until it reloads).
export function savedGraphics() {
  return readGraphics(loadSetting("graphics", {}));
}

// G: the setting after the one saved - Standard, Medium, High, Ultra and
// round again, never above the highest.
export function nextQuality() {
  const g = savedGraphics();
  return nextSetting(g.setting, g.highest);
}

// Saves a setting and reloads the page to build it.
export function setQuality(setting) {
  saveSetting("graphics", chooseSetting(loadSetting("graphics", {}), setting));
  location.reload();
}
