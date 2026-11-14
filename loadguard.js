// The loading screen's safety net: if the game's code goes wrong while the
// loading screen is up and the load goes no further, the loading screen
// says so and steps aside, rather than covering the window for good. A
// plain script, loaded before the game's modules, so it works even when
// they fail to load at all (loading.js is one of them). A slip the load
// carries on past changes nothing: loading.js marks each stage it reaches
// on the element (data-stage), and only a load that has stopped is taken
// as stuck.

(() => {
  // Longer than any stage takes; then how long the words stay up.
  const STUCK_MS = 30000;
  const SAY_MS = 4000;
  let watching = false;

  const up = (el) => el && !el.hidden && !el.classList.contains("leaving");

  function stepAside(el) {
    const words = el.querySelector(".loading-words");
    if (words) words.textContent = "Something went wrong starting A² Golf - it's noted for the next report; restarting may help";
    setTimeout(() => {
      if (!up(el)) return;
      el.classList.add("leaving");
      setTimeout(() => (el.hidden = true), 600);
    }, SAY_MS);
  }

  function onError() {
    const el = document.getElementById("loading");
    if (watching || !up(el)) return;
    watching = true;
    const stage = el.dataset.stage;
    setTimeout(() => {
      watching = false;
      if (up(el) && el.dataset.stage === stage) stepAside(el);
    }, STUCK_MS);
  }

  // (Capturing: a script that fails to load reports on its element only.)
  window.addEventListener("error", onError, true);
  window.addEventListener("unhandledrejection", onError);
})();
