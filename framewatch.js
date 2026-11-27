// Page layout forced mid-script, for a long frame's words (sim/
// frameparts.mjs): the browser's own record of each long frame (its "long
// animation frames", over 50 ms) says how long its scripts spent waiting
// while it worked out where everything on the page goes. A script that
// changes the page and then asks where something is makes it do that there
// and then - and the controls window's page, moved over from the game
// (screens.js), is laid out on the game's own time too: they share one
// process. Where the browser has no such record, nothing is said.

let forced = 0;
try {
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) for (const s of e.scripts ?? []) forced += s.forcedStyleAndLayoutDuration ?? 0;
  }).observe({ type: "long-animation-frame", buffered: false });
} catch {
  // An older browser: none.
}

// The ms forced since last asked (app.js noteFrame, once a drawn frame).
export function takeForcedLayout() {
  const out = forced;
  forced = 0;
  return out;
}
