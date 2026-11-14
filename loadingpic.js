// The loading screen's picture of the game (sim/loading.mjs LOADING_SHOTS),
// put up as the page starts: a module of its own, loaded before the game's
// (index.html), so the picture comes while the game's code is still on its
// way rather than after it. One of the mode the game opens in (the
// address's ?mode=, else the range as the game starts, the one it was in on
// a reload), never the one shown last time.
// Reads what the page saved straight from storage: util.js waits on the
// game's code. A page with no storage just shows any.

import { loadingShot, startingMode, freshStart } from "./sim/loading.mjs";
import { showPicture } from "./loading.js";

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(`golfsim.${key}`) ?? "null");
  } catch {
    return null;
  }
};
const shot = loadingShot(startingMode(location.search, read("app")?.mode, undefined, { fresh: freshStart() }), read("loadingShot"));
showPicture(document.getElementById("loading"), shot);
try {
  if (shot) localStorage.setItem("golfsim.loadingShot", JSON.stringify(shot.file));
} catch {
  // Not kept: the same might show next time.
}
