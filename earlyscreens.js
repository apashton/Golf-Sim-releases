// Separate windows (screens.js): the controls window opened first, as the
// page starts - before the game's code has loaded, let alone built its
// scenes - so the command centre's screen comes up straight away (the
// owner, 21 October 2026: open the command centre and the shot screen
// first). It shows that the command centre's on its way (controls.html)
// until the game's Screens takes it over (takeEarlyControls) and moves the
// controls in - already loaded by then, so at once, rather than loading in
// the game's own process while the game is busy building. A plain script,
// loaded before the game's modules.
//
// Only when the screens were left separate (the page's "app" setting). A
// browser may block a pop-up nobody clicked for: then nothing's held, and
// screens.js asks as it always has.

(() => {
  try {
    const app = JSON.parse(localStorage.getItem("golfsim.app") || "null");
    if (app?.screens !== "separate") return;
    // (The same name and address screens.js gives one it opens itself.)
    const stamp = String(Date.now());
    const win = window.open(`controls.html?open=${stamp}`, `golfsim-controls-${stamp}`, "popup,width=1280,height=800");
    if (!win) return;
    window.__earlyControls = { win, stamp };
    // The page going (reloaded as it loads) before the game's taken it
    // over: it goes too, and the new page opens its own.
    window.addEventListener("pagehide", () => {
      if (window.__earlyControls?.win === win) win.close();
    });
    // What the loading screen says, and how far its bar's got, shown
    // there too while it waits.
    document.addEventListener("DOMContentLoaded", () => {
      const loading = document.getElementById("loading");
      if (!loading) return;
      const watch = new MutationObserver(() => {
        try {
          if (win.closed) return watch.disconnect();
          const card = win.document.querySelector(".controls-coming");
          const words = loading.querySelector(".loading-words")?.textContent;
          if (card && words) card.querySelector(".loading-words").textContent = words;
          const fill = loading.querySelector(".loading-fill")?.style.transform;
          if (card && fill) card.querySelector(".loading-fill").style.transform = fill;
        } catch {
          // Between pages for a moment.
        }
      });
      watch.observe(loading, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["style"] });
    });
  } catch {
    // No storage, or no pop-up: screens.js opens it as before.
  }
})();
