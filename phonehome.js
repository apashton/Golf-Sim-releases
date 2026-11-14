// The phone app's homes - Play's things to do, and the range session's
// (sim/phoneroutes.mjs ROUTES) - drawn over the game page itself. The app
// opens straight into the game, in phone play (the owner, 3 November
// 2026: "do away with the play/range screen, feels clunky and delays
// loading. Go straight to load screen ... always default to mobile
// gameplay"): no start screen, the loading screen first, the swing pad on.
// A range session with a launch monitor is the menu's (Range session), and
// ended there or on its Session card, back to phone play. Home (first in the
// menu) brings the route's home over the game as it is - a round in
// progress kept - and nothing loads again to go back into it: Back to the
// game, at the top of each home, returns to it. Where you are is the
// address's # (sim/phoneroutes.mjs homeAt: #play, #play/courses,
// #play/game), so the phone's back button steps back through them, from a
// home to the game and out of the app. Each step's kept with the way there
// (nav), and Home and the ‹ arrows go back to a step already on it (backTo)
// rather than adding one, so back never goes round in circles between the
// game and a home.
//
// Only in the app (public/pocket/start.js marks the page before anything
// else); on a PC nothing here shows. Its look: phonehome.css.

import { routeById, routeSettings, OPENS_IN, PHONE_LEVELS, withLevel, homeAt, homeHash, startsInGame, gameWhere } from "./sim/phoneroutes.mjs";
import { distanceWords, levelDistances } from "./sim/madeshot.mjs";
import { TRADE, levelFacts } from "./sim/levelchoice.mjs";
import { esc, loadSetting, saveSetting } from "./util.js";
import { versionWords } from "./sim/webapp.mjs";

// The level's own words start a sentence here.
const sentence = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export class PhoneHome {
  // on: the app's page (start.js set window.pocket).
  constructor({ doc = typeof document !== "undefined" ? document : null, on = typeof window !== "undefined" && !!window.pocket } = {}) {
    this.doc = doc;
    this.el = doc?.getElementById("phone-home") ?? null;
    this.on = !!on && !!this.el;
    // The game's own, once it's there (connect): until then a choice waits.
    this.hooks = null;
    this.waiting = null;
    this.courses = null;
    // The game's place once it's been in it (its #: back to it from a home).
    this.played = null;
    if (!this.on) return;
    // Opened: straight into the game, in phone play - however it was left
    // (a range session's the menu's each time). Come back to (from the
    // app's other pages, or reloaded): where it was.
    if (!history.state?.home) {
      for (const [key, value] of Object.entries(routeSettings(OPENS_IN, { mouseSwing: loadSetting("mouseSwing", {}) }))) saveSetting(key, value);
      const at = homeHash(OPENS_IN, "game");
      history.replaceState({ home: { depth: 0, trail: [at] } }, "", url(at));
    } else if (startsInGame(location.search) && homeAt(location.hash).sub !== "game") this.nav(homeHash(loadSetting("route", OPENS_IN), "game"));
    this.el.addEventListener("click", (e) => this.click(e));
    addEventListener("popstate", () => this.show());
    addEventListener("hashchange", () => this.show());
    this.show();
    fetch("/pocket/app.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((a) => a && (this.version = versionWords(a, !!window.a2web)) && this.foot())
      .catch(() => {});
  }

  // Whether it's over the game now.
  get up() {
    return this.on && !this.el.hidden;
  }

  // The game's own (app.js), as it gets to them: route(route) - how the
  // phone plays, chosen; go({ mode, course, online }) - into the game
  // there; level() and setLevel(id) - the swing's level; progress() - how
  // far whoever's playing is towards the next level; power() - the
  // player's Power ranks (skill points); shown(up) - it came or went;
  // where() - { mode, round } where the game is, for Back to the game;
  // ladderWaiting() - what waits on the online ladders, for Match ladders.
  connect(hooks) {
    this.hooks = hooks;
    if (this.up) this.show();
    const go = this.waiting;
    this.waiting = null;
    if (go) hooks.go(go);
  }

  // Home, from the game: the route's home.
  open() {
    if (!this.on) return;
    // (The way the phone's playing now: a range session's started from the
    // menu, not from here.)
    const route = loadSetting("route", OPENS_IN);
    this.backTo(homeHash(routeById(route) ? route : OPENS_IN));
  }

  // Into the game as it is, the home put away (a friend's join link opening
  // the app: netinvite.js).
  toGame() {
    if (!this.on) return;
    const route = homeAt(location.hash).route ?? loadSetting("route", "play");
    if (homeAt(location.hash).sub !== "game") this.nav(homeHash(route, "game"));
  }

  // A step on: kept with the way here.
  nav(hash) {
    const s = history.state?.home ?? { depth: 0, trail: [here()] };
    history.pushState({ home: { depth: s.depth + 1, trail: [...s.trail.slice(0, s.depth + 1), hash] } }, "", url(hash));
    this.show();
  }
  // Back to `hash` if it's on the way here (as the phone's back button
  // would go), else on to it.
  backTo(hash) {
    const s = history.state?.home;
    const at = s ? s.trail.slice(0, s.depth).lastIndexOf(hash) : -1;
    if (at >= 0) history.go(at - s.depth);
    else this.nav(hash);
  }

  show() {
    const { route, sub } = homeAt(location.hash);
    // (No start screen: an address without a route is phone play's home.)
    const r = routeById(route) ?? routeById(OPENS_IN);
    if (sub === "game") this.played = homeHash(route, "game");
    this.el.hidden = sub === "game";
    this.doc.documentElement.classList.toggle("home-up", !this.el.hidden);
    if (!this.el.hidden) {
      if (sub === "courses") this.courseList(r);
      else this.routeHome(r);
      this.el.scrollTop = 0;
    }
    this.hooks?.shown?.(!this.el.hidden);
  }

  // Back to the game, as it is - once it's been played.
  resumeHtml() {
    if (!this.played) return "";
    let where = null;
    try {
      where = this.hooks?.where?.() ?? null;
    } catch {
      // (Said without where, then.)
    }
    return `<button class="resume" data-resume><b>Back to the game</b><span>${esc(gameWhere(where ?? {}))}</span><i aria-hidden="true">›</i></button>`;
  }

  routeHome(route) {
    this.draw(`
      <div class="bar">${route.id === OPENS_IN ? "" : `<button class="back" data-back="${homeHash(OPENS_IN)}" aria-label="Phone play">‹</button>`}<h1>${esc(route.name)}</h1></div>
      <p class="muted small">${esc(route.line)}</p>
      ${this.resumeHtml()}
      <div class="tiles">${route.items.map((i) => this.itemHtml(i)).join("")}</div>`);
  }

  // A thing to do; Your level, the levels to pick from - each with its
  // drives, from no Power points to Power maxed - and the one picked's
  // distances in words.
  itemHtml(item) {
    const soon = item.soon ? `<em class="soon">${esc(item.soon)}</em>` : "";
    if (!item.level) return `<button class="tile" data-item="${esc(item.id)}"${item.soon ? " disabled" : ""}><b>${esc(item.label)}</b><span>${esc(item.help)}</span>${soon}${item.go?.online ? this.ladderWaitingHtml() : ""}</button>`;
    const now = this.level();
    const power = this.hooks?.power?.() ?? 0;
    // How far they are towards the next level ("Anna: 1 of 2 good rounds
    // towards Amateur": app.js levelProgressLine).
    const progress = this.hooks?.progress?.() ?? "";
    return `<div class="tile tile-level">
      <b>${esc(item.label)}</b>
      <div class="levels">${PHONE_LEVELS.map((l) => {
        const d = levelDistances(l.id).drive;
        // (How forgiving it is too: sim/levelchoice.mjs.)
        return `<button data-level="${esc(l.id)}" class="${l.id === now ? "chosen" : ""}" aria-pressed="${l.id === now}" title="${esc(l.help)}"><b>${esc(l.name)}</b><small>${esc(levelFacts(l.id).forgiveWords.toLowerCase())}</small><small>drives ${d.from}-${d.most}</small></button>`;
      }).join("")}</div>
      <span class="small">${esc(TRADE)}</span>
      <span class="small muted">${esc(sentence(PHONE_LEVELS.find((l) => l.id === now)?.help) ?? item.help)}.</span>
      <span class="small distances">${esc(distanceWords(now, { power }))}</span>
      ${progress ? `<span class="small climb">${esc(progress)}</span>` : ""}
    </div>`;
  }

  // Match ladders' tile: what's waiting on the online ladders (app.js
  // ladderWaiting: a challenge to answer, a match to play, a round in).
  ladderWaitingHtml() {
    let waiting = [];
    try {
      waiting = this.hooks?.ladderWaiting?.() ?? [];
    } catch {
      waiting = [];
    }
    return waiting
      .slice(0, 3)
      .map((w) => `<em class="waiting">${esc(w.name)}: ${esc(w.line)}${w.more ? ` (and ${w.more} more)` : ""}</em>`)
      .join("");
  }

  // Drawn again as it is (what's waiting on the ladders came in).
  refresh() {
    if (this.up) this.show();
  }

  async courseList(route) {
    const want = homeHash(route.id, "courses");
    this.draw(`
      <div class="bar"><button class="back" data-back="${homeHash(route.id)}" aria-label="Back">‹</button><h1>${route.id === "play" ? "Play a round" : "Play a course"}</h1></div>
      <p class="muted small">Loading the courses...</p>`);
    const list = await (this.courses ??= fetch("/pocket/courses/index.json")
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []));
    const wait = this.el.querySelector("main p");
    if (location.hash !== want || !wait) return;
    wait.outerHTML = list.length
      ? `<div class="tiles courses">${list
          .map((c) => `<button class="tile" data-course="${esc(c.id)}"><b>${esc(c.name)}</b><span>${c.holes} holes · par ${c.par}${c.yards ? ` · ${c.yards.toLocaleString("en-GB")} yds` : ""}</span></button>`)
          .join("")}</div>`
      : '<p class="muted">No courses came with this app.</p>';
  }

  draw(html) {
    this.el.innerHTML = `<main>${html}</main><footer class="home-foot small muted"><span class="version"></span><a href="/pocket/phone.html">Phone check</a></footer>`;
    this.foot();
  }
  foot() {
    const v = this.el.querySelector(".version");
    if (v) v.textContent = this.version ?? "";
  }

  level() {
    return this.hooks?.level?.() ?? loadSetting("mouseSwing", {}).level ?? "beginner";
  }

  click(e) {
    const b = e.target.closest("button");
    if (!b || b.disabled) return;
    const route = routeById(homeAt(location.hash).route) ?? routeById(OPENS_IN);
    if (b.dataset.back) return this.backTo(b.dataset.back);
    if (b.dataset.resume != null && this.played) return this.backTo(this.played);
    if (b.dataset.course) return this.go(route, { mode: "course", course: b.dataset.course });
    if (b.dataset.level) {
      if (this.hooks) this.hooks.setLevel(b.dataset.level);
      else saveSetting("mouseSwing", withLevel(loadSetting("mouseSwing", {}), b.dataset.level));
      return this.routeHome(route);
    }
    const item = route.items.find((i) => i.id === b.dataset.item);
    if (!item) return;
    if (item.page) return location.assign(item.page);
    if (item.go?.course === "pick") return this.nav(homeHash(route.id, "courses"));
    if (item.go) this.go(route, item.go);
  }

  // Into the game, there: the route's way of playing chosen (in force at
  // once once the game's there; kept for it to start with before), the
  // home put away - and what was picked played once the game's loaded.
  go(route, go) {
    if (this.hooks) this.hooks.route(route);
    else for (const [key, value] of Object.entries(routeSettings(route, { mouseSwing: loadSetting("mouseSwing", {}) }))) saveSetting(key, value);
    this.nav(homeHash(route.id, "game"));
    if (this.hooks) this.hooks.go(go);
    else this.waiting = go;
  }
}

// Where the page is now, as homeHash has it ("#" the start screen), and
// the page's address there.
const here = () => {
  const { route, sub } = homeAt(location.hash);
  return homeHash(route, sub);
};
const url = (hash) => `${location.pathname}${location.search}${hash}`;

// The one: made as the page's code first runs, before the game starts
// loading, so the start screen's up at once.
export const phoneHome = new PhoneHome();
