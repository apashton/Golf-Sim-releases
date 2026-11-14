// The loading screen: up from the page's first paint (it's in index.html,
// styled by loading.css, so it shows before any script has run), it says
// which part of the game is being built and fills its bar as each stage
// starts (sim/loading.mjs), then fades once the first whole picture has
// been drawn - so the player never sees the top bar half filled in, a
// blank picture, or the scene arriving in pieces.
//
// The bar's shimmer is a compositor animation: it keeps moving while the
// page is busy building, so a long stage reads as work, not a hang.
//
// Not tied to the page's start: show() puts it up again (with a plan of its
// own) for anything else that needs a moment, and finish() takes it down.

import { loadPlan, progressAt, loadSummary, STAGES } from "./sim/loading.mjs";

// The longest a stage waits for a frame to be drawn before carrying on: a
// hidden or minimised window draws none, and the load mustn't wait for it.
const FRAME_WAIT_MS = 100;
// How long the fade takes (loading.css has the same).
const FADE_MS = 400;
// Resolves once the browser has had a chance to draw (the next animation
// frame, then the task after it), or after FRAME_WAIT_MS whatever.
export function nextFrame(maxMs = FRAME_WAIT_MS) {
  return new Promise((resolve) => {
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      resolve();
    };
    requestAnimationFrame(() => setTimeout(go, 0));
    setTimeout(go, maxMs);
  });
}

// A promise, or `fallback` after `ms` - for anything the loading screen
// waits on that might never come (a course that doesn't load, a texture
// file that's missing).
export function within(promise, ms, fallback = null) {
  return Promise.race([Promise.resolve(promise).catch(() => fallback), new Promise((r) => setTimeout(() => r(fallback), ms))]);
}

// A picture of the game behind the bar (sim/loading.mjs loadingShot): shown
// once it's loaded - never half drawn, and never at all if the load is over
// first - with what it shows along the bottom. (loadingpic.js puts it up as
// the page starts, before the game's own code has even arrived.)
export function showPicture(el, shot, base = "loadingshots/") {
  if (!shot?.file || !el) return;
  const url = `${base}${shot.file}`;
  const img = new Image();
  img.onload = () => {
    if (el.hidden || el.classList.contains("leaving")) return;
    el.style.setProperty("--loading-shot", `url("${url}")`);
    el.classList.add("with-shot");
    let cap = el.querySelector(".loading-shot");
    if (!cap) {
      cap = document.createElement("div");
      cap.className = "loading-shot";
      cap.append(document.createElement("b"), document.createElement("span"));
      el.append(cap);
    }
    cap.children[0].textContent = shot.title ?? "";
    cap.children[1].textContent = shot.line ?? "";
  };
  img.src = url;
}

export class LoadingScreen {
  constructor(el = document.getElementById("loading"), { plan = loadPlan() } = {}) {
    this.el = el ?? LoadingScreen.make();
    this.words = this.el.querySelector(".loading-words");
    this.fill = this.el.querySelector(".loading-fill");
    this.plan = plan;
    this.marks = [];
    this.longest = 0;
    this.showing = !this.el.hidden;
    this.fraction = 0;
    if (this.showing) this.watch();
    // (Something going wrong while it's up: loadguard.js.)
  }

  // The loading screen's own element, for a page without one in its HTML.
  static make() {
    const el = document.createElement("div");
    el.id = "loading";
    el.className = "loading";
    el.setAttribute("role", "status");
    el.innerHTML = `<div class="loading-card"><span class="brand-mark loading-mark" aria-hidden="true">A²</span><div class="loading-name">Golf</div><div class="loading-bar"><div class="loading-fill"></div></div><div class="loading-words"></div></div>`;
    document.body.prepend(el);
    return el;
  }

  // Stage `id` starts (`part` of it done, 0 to 1): the words and the bar
  // say so, and it resolves once that's been drawn.
  async reach(id, part = 0) {
    if (!this.showing) return;
    const at = performance.now();
    if (!part) {
      this.marks.push([id, Math.round(at)]);
      // How far it's got, for loadguard.js.
      this.el.dataset.stage = `${this.marks.length} ${id}`;
      try {
        performance.mark(`load: ${id}`);
      } catch {
        // Only for a profile.
      }
    }
    this.say(STAGES[id]?.words ?? id);
    this.setBar(progressAt(this.plan, id, part));
    await nextFrame();
  }

  say(words) {
    if (this.words) this.words.textContent = `${words}...`;
  }

  // The bar never goes back.
  setBar(fraction) {
    if (fraction == null || !this.fill) return;
    this.fraction = Math.max(this.fraction, fraction);
    this.fill.style.transform = `scaleX(${this.fraction.toFixed(3)})`;
  }

  // The longest the page went without drawing while this is up: the
  // load's worst freeze, for a report.
  watch() {
    let last = performance.now();
    const tick = (now) => {
      if (!this.showing) return;
      // (A hidden window draws nothing: that's not a freeze.)
      if (document.visibilityState === "visible") this.longest = Math.max(this.longest, now - last);
      last = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // Fades out; resolves once it's gone.
  async finish() {
    if (!this.showing) return;
    this.marks.push(["done", Math.round(performance.now())]);
    this.setBar(1);
    this.showing = false;
    this.el.classList.add("leaving");
    await new Promise((resolve) => {
      const gone = (e) => {
        // (Its own fade, not the bar's fill finishing inside it.)
        if (e && (e.target !== this.el || e.propertyName !== "opacity")) return;
        clearTimeout(timer);
        this.el.removeEventListener("transitionend", gone);
        resolve();
      };
      const timer = setTimeout(() => gone(), FADE_MS + 200);
      this.el.addEventListener("transitionend", gone);
    });
    if (!this.showing) this.el.hidden = true;
  }

  // Up again, for something else that needs a moment (`plan`: its own
  // stages; sim/loading.mjs loadPlan's shape).
  show(plan = this.plan) {
    this.plan = plan;
    this.marks = [];
    this.longest = 0;
    this.fraction = 0;
    if (this.fill) this.fill.style.transform = "scaleX(0)";
    this.el.hidden = false;
    this.el.classList.remove("leaving");
    if (!this.showing) {
      this.showing = true;
      this.watch();
    }
  }

  // The last load, for a report (sim/loading.mjs loadSummary).
  summary() {
    return loadSummary(this.marks, this.longest);
  }
}
