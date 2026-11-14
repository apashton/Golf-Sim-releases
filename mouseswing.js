// The swing pad: hitting with the mouse (or a finger) instead of a launch
// monitor - for trying the game out, and for friends without one. Press on
// the ball, pull down (the bar fills: the gold line is a full swing, 100%,
// the line under it the most a swing goes, 105%, and at the levels that
// show them where to stop: the bright line the shot as it plays, wind,
// slope and lie and all - "play" - and the white dashed one the flag were
// it flat and still, when that's another swing: sim/swingguide.mjs), then
// push back up
// through the ball: that's the strike. Before it's pressed the lines are
// drawn from the ball, with what the flag's swing carries; as it's pulled,
// the swing's size and how far it carries (or a putt rolls) show at the
// foot of the pad, and the way the finger (or the mouse) went is drawn as
// it goes - down, then back up through the ball, kept a moment after the
// strike - so a push up across the line, for a hook or a slice, shows as
// it was made (the owner: "when I'm trying to hook it, I still see a
// straight back and forth"). Pulled too far (past TOO_FAR_PCT) the fill
// goes red and says so: over the top, it'll cost the shot.
// sim/mouseswing.mjs reads the swing; app.js turns it into the shot
// (sim/madeshot.mjs). The Shot button opens the shot setup (shotsetupcard.js).
// The ½ button makes it the half-power pad (sim/mouseswing.mjs HALF): the
// gold line a half swing (50%), the most it gives - every percent twice as
// long a pull, for chips - for the next swing: struck, it's full power
// again.

import { readSwing, JUST_RIGHT, MOST_PCT, TOO_FAR_PCT, HALF, LET_GO } from "./sim/mouseswing.mjs";
import { pullWords } from "./sim/madeshot.mjs";
import { dotOf, setupRisk, riskTone } from "./sim/shotsetup.mjs";

// How long the way a swing went stays on the pad after it (ms; it fades
// over the last of it: style.css).
const TRAIL_KEPT_MS = 3500;
// How long "Let go early" stays big on the pad after a let-go (ms).
const LET_GO_SHOWN_MS = 2800;

// Before the swing: the swing to play and its yards ("play 68%" over "168
// yds", with the flag's own line besides) - or, with no more than the one
// line, the flag's ("flag 62%" over "142 yds") - or with no mark a full
// swing's (the half pad's: a half one's). A putt says its pace ("pace 77%"
// over "23 ft") beside the hole's. On the half pad a flag past its reach
// says it wants the full pad; a shot wanting more than a full swing says
// so ("full 100%" over what a full one carries).
export function waitWords(read, k = 1) {
  if (read.mark != null && read.mark > 100 * k + 0.5) return `flag ${Math.round(read.mark)}%\nfull power (½)`;
  if (read.mark == null) return pullWords(100 * k, read);
  if (read.capped && !read.scale) return `full ${pullWords(100, read)}`;
  const p = Math.round(read.mark);
  if (read.scale) return read.flag != null && read.paceFeet > 0 ? `pace ${p}%\n${Math.round(read.paceFeet)} ft` : `flag ${pullWords(read.mark, read)}`;
  if (read.flag != null && read.playYards > 0) return `play ${p}%\n${Math.round(read.playYards)} yds`;
  return read.flagYards > 0 ? `flag ${p}%\n${Math.round(read.flagYards)} yds` : `flag ${pullWords(read.mark, read)}`;
}

// What each line's called, by it: the shot's ("play 168"; a putt's "pace
// 23 ft") and the flag's ("flag 142"; "hole 20 ft"), or the one line's
// "flag" (none for a shot wanting more than a full swing: the 100% line).
export function markLabels(read) {
  if (!read || read.mark == null) return { mark: "", flag: "" };
  if (read.capped && !read.scale) return { mark: "", flag: read.flag == null ? "" : read.flagYards > 0 ? `flag ${Math.round(read.flagYards)}` : "flag" };
  if (read.flag == null) return { mark: "flag", flag: "" };
  if (read.scale) return { mark: read.paceFeet > 0 ? `pace ${Math.round(read.paceFeet)} ft` : "pace", flag: read.holeFeet > 0 ? `hole ${Math.round(read.holeFeet)} ft` : "hole" };
  return { mark: read.playYards > 0 ? `play ${Math.round(read.playYards)}` : "play", flag: read.flagYards > 0 ? `flag ${Math.round(read.flagYards)}` : "flag" };
}

export class SwingPad {
  // onSwing(swing): a swing made (sim/mouseswing.mjs readSwing).
  // what(): "putt", "swing", or null when there's nothing to hit just now.
  // reading(): as a swing begins, what a full one carries and the flag's
  // mark ({ full } yards or { scale } feet, mark: percent or null), or null.
  // waiting(): the same while nothing's pressed, or null where it can't be
  // asked just now - the lines drawn from the ball before the swing (the
  // owner: "Would be better to show the flag distance line before the
  // users starts the shot").
  // onSetup(): the Shot button, for the shot setup. onLevel(): the level at
  // its top, for the levels card (levelcard.js).
  // side: "left" or "right" of the screen; onSide(side) when it's moved.
  // half: the half-power pad (swings, not putts); onHalf(on) when it's
  // switched (the ½ button).
  // onPress(): a swing's begun (the side panel folds then, not at the
  // strike: app.js).
  // away(what): set aside for now (what: what there is to hit, null for
  // nothing) - the phone with nothing to hit (app.js).
  constructor({ doc = document, onSwing, what, away = () => false, reading = () => null, waiting = () => null, onPress = () => {}, onSetup = () => {}, onLevel = () => {}, side = "left", onSide = () => {}, half = false, onHalf = () => {} }) {
    this.doc = doc;
    this.away = away;
    this.onPress = onPress;
    this.onSwing = onSwing;
    this.what = what;
    this.reading = reading;
    this.waiting = waiting;
    this.onSide = onSide;
    this.onHalf = onHalf;
    this.half = !!half;
    this.on = false;
    this.samples = null;
    this.read = null;
    this.setupSaid = "";
    this.el = doc.createElement("div");
    this.el.className = "swing-pad";
    this.el.hidden = true;
    this.el.innerHTML = `
      <button class="swing-pad-side" type="button" title="Move the swing pad to the other side">⇄</button>
      <button class="swing-pad-level" type="button" hidden></button>
      <button class="swing-pad-half" type="button" title="Half power for the next swing: the gold line is a 50% swing, and the most - every percent twice as long a pull, for chips. Back to full power once it's struck (or press again)">½</button>
      <button class="swing-pad-setup" type="button" title="The shot setup: the next shot's curve, spin and height"><svg viewBox="-12 -12 24 24" aria-hidden="true"><circle r="11" class="mini-ball"/><circle r="3.4" class="mini-dot"/></svg>Shot</button>
      <div class="swing-pad-label"></div>
      <div class="swing-pad-ball"></div>
      <div class="swing-pad-fill"></div>
      <svg class="swing-pad-trail" aria-hidden="true" hidden><polyline class="back"></polyline><polyline class="through"></polyline></svg>
      <div class="swing-pad-line swing-pad-right" title="A full swing: 100%"></div>
      <div class="swing-pad-line swing-pad-most" title="The most a swing goes: 105%"></div>
      <div class="swing-pad-line swing-pad-flag" title="The flag, were it flat and still: where to stop without the wind, slope and lie"></div>
      <div class="swing-pad-line swing-pad-mark" title="Where to stop: the shot as it plays - the wind, the slope and the lie and all"></div>
      <div class="swing-pad-line swing-pad-start"></div>
      <div class="swing-pad-reading"></div>
      <div class="swing-pad-why" hidden></div>
      <div class="swing-pad-letgo" hidden>Let go early<b>${Math.round(LET_GO * 100)}% shorter</b></div>
      <div class="swing-pad-result"></div>`;
    doc.body.append(this.el);
    this.q = (s) => this.el.querySelector(s);
    this.el.classList.toggle("right", side === "right");
    // (The page told too, so what's over the picture keeps clear of it:
    // phoneplay.css.)
    doc.body.classList.toggle("pad-at-right", side === "right");
    for (const b of [".swing-pad-side", ".swing-pad-setup", ".swing-pad-half", ".swing-pad-level"]) this.q(b).addEventListener("pointerdown", (e) => e.stopPropagation());
    this.q(".swing-pad-level").addEventListener("click", () => onLevel());
    this.q(".swing-pad-half").addEventListener("click", () => {
      this.half = !this.half;
      onHalf(this.half);
      this.refresh();
    });
    this.q(".swing-pad-side").addEventListener("click", () => {
      const right = this.el.classList.toggle("right");
      doc.body.classList.toggle("pad-at-right", right);
      this.onSide(right ? "right" : "left");
    });
    this.q(".swing-pad-setup").addEventListener("click", () => onSetup());
    this.el.addEventListener("pointerdown", (e) => this.down(e));
    this.el.addEventListener("pointermove", (e) => this.move(e));
    this.el.addEventListener("pointerup", (e) => this.up(e));
    this.el.addEventListener("pointercancel", () => this.cancel());
    // Not the page's own drags, text picks or menus.
    this.el.addEventListener("contextmenu", (e) => e.preventDefault());
    this.refresh();
  }

  show(on) {
    this.on = !!on;
    this.refresh();
  }

  // Shown or set aside as things are now (app.js asks every so often):
  // brought up to date as it changes.
  place() {
    if (this.demoing) return;
    const what = this.on ? this.what() : null;
    if (this.on && !this.away(what) === this.el.hidden) this.refresh();
  }

  // The full pull back, in px: most of the pad's height.
  get full() {
    return Math.max(120, this.el.clientHeight * 0.85);
  }

  // What the pull to the gold line is, of a full swing: HALF on the half
  // pad (for a swing - a putt's pull is the putt's own), else 1.
  scale(what = this.on ? this.what() : null) {
    return this.half && what === "swing" ? HALF : 1;
  }

  refresh() {
    // (A controller's swing has the pad until it's done: demo.)
    if (this.demoing) return;
    const what = this.on ? this.what() : null;
    // (On, but set aside: hidden, its room given back - pad-shown off.)
    const shown = this.on && !this.away(what);
    this.el.hidden = !shown;
    this.doc.body.classList.toggle("pad-shown", shown);
    this.el.classList.toggle("idle", !what);
    this.q(".swing-pad-setup").hidden = what !== "swing";
    this.q(".swing-pad-half").hidden = what !== "swing";
    const k = this.scale(what);
    this.q(".swing-pad-half").classList.toggle("set", k < 1);
    this.el.classList.toggle("half", k < 1);
    this.q(".swing-pad-right").title = k < 1 ? "Half power: 50%, the most" : "A full swing: 100%";
    if (!this.samples) {
      // (A shot set up: its words, said short enough to stay under the
      // pad's lines.)
      const half = k < 1 ? "Half power - " : "";
      const swing = what === "swing" && this.setupSaid ? `${this.setupSaid}, then swing` : "Swing: press the ball, pull down, push up";
      this.q(".swing-pad-label").textContent = !what ? "Nothing to hit just now" : what === "putt" ? "Putt: press the ball, pull down, push up" : `${half}${swing}`;
      // Waiting: the lines from the ball - the flag's, a full swing's, the
      // most - and what the flag's swing carries.
      let rest = null;
      if (this.on && what) {
        try {
          rest = this.waiting();
        } catch {
          rest = null;
        }
      }
      this.read = rest;
      this.el.classList.toggle("waiting", !!rest);
      if (rest) {
        const b = this.q(".swing-pad-ball");
        const y0 = b.offsetTop + b.offsetHeight / 2;
        this.lines(y0, y0, { waiting: true });
      } else this.lines(null);
    }
  }

  // The level whoever's swinging plays at, at the pad's top: { name
  // ("Beginner"), forgive (1 - 4: its colour), title (what it means) }, or
  // null for none.
  level(tag) {
    const btn = this.q(".swing-pad-level");
    const name = tag?.name ?? "";
    btn.hidden = !name;
    if (btn.textContent !== name) btn.textContent = name;
    btn.dataset.forgive = String(tag?.forgive ?? "");
    btn.title = tag?.title ?? "";
  }

  // The shot setup in a few words ("Punch, draw"; "" for a plain shot),
  // shown on the pad until the shot, and the setup itself, its dot on the
  // button's little ball.
  setup(words, setup = null) {
    this.setupSaid = words ?? "";
    const btn = this.q(".swing-pad-setup");
    btn.classList.toggle("set", !!this.setupSaid);
    const dot = btn.querySelector(".mini-dot");
    const at = dotOf(setup);
    dot.setAttribute("cx", (at.x * 8).toFixed(1));
    dot.setAttribute("cy", (at.y * 8).toFixed(1));
    const risk = setupRisk(setup);
    dot.dataset.tone = riskTone(Math.max(risk.ball, risk.height));
    btn.title = `The shot setup: the next shot's curve, spin and height${this.setupSaid ? ` - now ${this.setupSaid.toLowerCase()}` : ""}`;
    this.refresh();
  }

  // The start line, the 100% and 105% lines, the flag's mark and the fill,
  // from the press; the swing's size and what it carries at the fill's end.
  // waiting: drawn from the ball before the press - what the flag's swing
  // carries (or a full one's, with no mark) instead of the pull's.
  lines(y0, y = y0, { waiting = false } = {}) {
    const show = y0 != null;
    // The half pad: the gold line's a half swing and the most (no 105%).
    const k = this.scale();
    const top = 100 * k;
    for (const s of [".swing-pad-fill", ".swing-pad-right", ".swing-pad-start", ".swing-pad-reading"]) this.q(s).hidden = !show;
    this.q(".swing-pad-most").hidden = !show || k < 1;
    const mark = this.read?.mark;
    const flag = this.read?.flag;
    // (A flag past the half pad's reach has no mark on it.)
    const markEl = this.q(".swing-pad-mark");
    const flagEl = this.q(".swing-pad-flag");
    // (Wanting more than a full swing, the shot's line is the 100% one.)
    markEl.hidden = !show || mark == null || mark > top + 0.5 || !!this.read?.capped;
    flagEl.hidden = !show || mark == null || flag == null || flag > top + 0.5;
    // What the two differ by ("into the wind · uphill"), at the pad's foot
    // in its words' place while it's there (a short pad has no room for
    // both).
    const why = this.q(".swing-pad-why");
    why.textContent = waiting && !flagEl.hidden ? (this.read?.why ?? []).join(" · ") : "";
    why.hidden = !why.textContent;
    this.el.classList.toggle("has-why", !why.hidden);
    if (!show) return;
    // The gold line's pull (100%, or the half pad's 50%).
    const unit = this.full * JUST_RIGHT;
    this.q(".swing-pad-start").style.top = `${y0}px`;
    this.q(".swing-pad-right").style.top = `${y0 + unit}px`;
    this.q(".swing-pad-most").style.top = `${y0 + (unit * MOST_PCT) / 100}px`;
    if (mark != null) markEl.style.top = `${y0 + (unit * mark) / top}px`;
    if (flag != null) flagEl.style.top = `${y0 + (unit * flag) / top}px`;
    // Each line's name by it - the lower one's under its line, so the two
    // never sit on each other.
    const names = markLabels(this.read);
    markEl.dataset.label = names.mark;
    flagEl.dataset.label = names.flag;
    markEl.classList.toggle("below", flag != null && mark > flag);
    flagEl.classList.toggle("below", flag != null && flag >= mark);
    const fill = this.q(".swing-pad-fill");
    fill.style.top = `${y0}px`;
    fill.style.height = `${Math.max(0, y - y0)}px`;
    // How far it's pulled, as the gold line's percent; the swing it makes.
    const pulled = Math.max(0, ((y - y0) / unit) * 100);
    const pct = k < 1 ? Math.min(top, pulled * k) : Math.min(MOST_PCT, pulled);
    // (Where too far starts: later the easier the level.)
    const tooFar = k === 1 && pulled > (this.read?.tooFar ?? TOO_FAR_PCT);
    if (this.samples && this.felt) {
      if (pct >= top && !this.felt.full) {
        this.felt.full = true;
        this.buzz(12);
      }
      if (k === 1 && pct >= MOST_PCT - 0.5 && !this.felt.most) {
        this.felt.most = true;
        this.buzz(30);
      }
      if (tooFar && !this.felt.tooFar) {
        this.felt.tooFar = true;
        this.buzz([40, 40, 40]);
      }
    }
    fill.classList.toggle("over", k === 1 && pct > 100.5 && !tooFar);
    fill.classList.toggle("near", pulled >= 97 && pulled <= 100.5);
    fill.classList.toggle("too-far", tooFar);
    this.q(".swing-pad-reading").classList.toggle("too-far", tooFar);
    // Before the swing, what it says goes under the ball, clear of the
    // lines near the foot - unless the line to stop at is up there too.
    this.q(".swing-pad-reading").classList.toggle("up", waiting && !(mark != null && !this.read?.capped && mark / top < 0.55));
    this.q(".swing-pad-reading").textContent = waiting ? waitWords(this.read, k) : tooFar ? `Too far!\n${Math.round(pulled)}%` : this.read ? pullWords(pct, this.read) : `${Math.round(pct)}%`;
  }

  point(e) {
    const r = this.el.getBoundingClientRect();
    return { t: e.timeStamp || performance.now(), x: e.clientX - r.left, y: e.clientY - r.top };
  }

  down(e) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if (!this.what()) return;
    e.preventDefault();
    this.el.setPointerCapture?.(e.pointerId);
    this.samples = [this.point(e)];
    this.top = this.samples[0];
    this.trail(this.samples);
    // A finger feels the swing: a tap as it reaches a full swing and the
    // most, and as it strikes (buzz).
    this.finger = e.pointerType === "touch";
    this.felt = { full: false, most: false };
    this.read = this.reading();
    this.q(".swing-pad-result").textContent = "";
    this.q(".swing-pad-label").textContent = "Pull down, then push up through the ball";
    this.el.classList.add("swinging");
    this.lines(this.samples[0].y);
    this.onPress();
  }

  move(e) {
    if (!this.samples) return;
    const p = this.point(e);
    this.samples.push(p);
    const s0 = this.samples[0];
    if (p.y > this.top.y) this.top = p;
    this.trail(this.samples);
    // (The bar stays at the swing's size as it's pushed back up: the way
    // back up is the trail's.)
    this.lines(s0.y, Math.max(this.top.y, s0.y));
    // Back up through where it started, after a real pull back: the strike,
    // there and then (not on letting go).
    if (p.y <= s0.y && this.top.y - s0.y > this.full * 0.04) this.finish();
  }

  up() {
    if (this.samples) this.finish();
  }

  cancel() {
    this.samples = null;
    this.trail(null);
    this.el.classList.remove("swinging");
    this.refresh();
  }

  finish() {
    const swing = readSwing(this.samples, this.full, { scale: this.scale() });
    // The way it went stays a moment, fading (style.css), then goes.
    this.trail(this.samples, { done: true });
    this.samples = null;
    this.el.classList.remove("swinging");
    // The strike, felt and seen at once - then the shot, before the pad's
    // drawn again (the ball's on its way first).
    if (swing) {
      // (Struck on the half pad: full power again for the next shot - the
      // owner, 30 October 2026: "untick 1/2 power after the shot taken, ive
      // been done over a few times on the next drive with it still being
      // ticked".)
      const halfUsed = this.scale() < 1;
      this.buzz(swing.struck ? 18 : [40, 60, 40]);
      this.el.classList.remove("struck");
      void this.el.offsetWidth;
      this.el.classList.add("struck");
      this.letGo(!swing.struck);
      this.onSwing(swing);
      if (halfUsed) this.fullPower();
    }
    this.refresh();
  }

  // The half pad off: full power (after a swing struck on it).
  fullPower() {
    if (!this.half) return;
    this.half = false;
    this.onHalf(false);
  }

  // Let go before pushing back up through the ball: said big on the pad a
  // moment (the owner, 26 October 2026: "make it obvious what happened"),
  // as well as in the shot's words.
  letGo(on) {
    const el = this.q(".swing-pad-letgo");
    clearTimeout(this.letGoTimer);
    el.hidden = !on;
    this.el.classList.toggle("let-go", on);
    if (on)
      this.letGoTimer = setTimeout(() => {
        el.hidden = true;
        this.el.classList.remove("let-go");
      }, LET_GO_SHOWN_MS);
  }

  // The way the finger went (samples, pad px; null: none): the pull down,
  // and from its lowest point the push back up - where a hook or a slice
  // is made. done: the swing's over - it fades and goes.
  trail(samples, { done = false } = {}) {
    const svg = this.q(".swing-pad-trail");
    clearTimeout(this.trailTimer);
    svg.classList.remove("done");
    if (!samples?.length) {
      svg.setAttribute("hidden", "");
      return;
    }
    let top = 0;
    for (let i = 1; i < samples.length; i++) if (samples[i].y > samples[top].y) top = i;
    const pts = (list) => list.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    svg.querySelector(".back").setAttribute("points", pts(samples.slice(0, top + 1)));
    svg.querySelector(".through").setAttribute("points", pts(samples.slice(top)));
    svg.removeAttribute("hidden");
    if (done) {
      void svg.getBoundingClientRect();
      svg.classList.add("done");
      this.trailTimer = setTimeout(() => svg.setAttribute("hidden", ""), TRAIL_KEPT_MS);
    }
  }

  // A short buzz of the phone (ms), for a finger only (a mouse or a
  // trackpad has nothing to feel it with).
  buzz(ms) {
    if (!this.finger) return;
    try {
      this.doc.defaultView?.navigator?.vibrate?.(ms);
    } catch {
      // (Not allowed, or no motor.)
    }
  }

  // What happened, under the ball for a few seconds.
  said(words) {
    const r = this.q(".swing-pad-result");
    r.textContent = words;
    clearTimeout(this.saidTimer);
    this.saidTimer = setTimeout(() => (r.textContent = ""), 6000);
  }

  // A swing made elsewhere, on the pad as a player's would show - a game
  // controller's (gamepad.js): { phase ("ready", "pull", "push",
  // "struck"), pull (how far back, a share of the full pull), push (how
  // far back up, 0 to 1), swing (readSwing's numbers), words (what it
  // did) } - the start line, the 100% line and the fill as the press and
  // pull draw them, and a mouse pointer where the hand is (none with
  // pointer: false), its own words (label) and what it carries (reading,
  // as reading() gives it). null: the pad as it was.
  demo(pad) {
    let ptr = this.q(".swing-pad-pointer");
    if (!pad) {
      if (!this.demoing) return;
      this.demoing = false;
      this.el.classList.remove("demo", "swinging");
      ptr?.remove();
      this.refresh();
      return;
    }
    this.demoing = true;
    this.el.hidden = false;
    this.el.classList.add("demo");
    this.el.classList.remove("idle");
    // Pressed on the ball's middle (style.css: 22px down, 26px across).
    const y0 = 35;
    const full = this.full;
    this.read = pad.reading ?? null;
    const bottom = y0 + full * Math.max(0, pad.pull ?? 0);
    const k = pad.phase === "struck" ? 1 : Math.min(1, Math.max(0, pad.push ?? 0));
    const pressed = pad.phase === "pull" || pad.phase === "push";
    const y = pad.phase === "pull" ? bottom : pad.phase === "push" ? bottom + (y0 - bottom) * k : y0;
    const x = this.el.clientWidth / 2 + (pad.phase === "push" ? (pad.swing?.start ?? 0) * full * k : 0);
    this.el.classList.toggle("swinging", pressed);
    this.lines(pressed ? y0 : null, y);
    this.q(".swing-pad-label").textContent = pad.label ?? (pressed ? "Pull down, then push up through the ball" : pad.phase === "struck" ? "" : "Swing: press the ball, pull down, push up");
    if (pad.phase === "struck" && pad.words && this.q(".swing-pad-result").textContent !== pad.words) this.said(pad.words);
    if (!ptr) {
      ptr = this.doc.createElement("div");
      ptr.className = "swing-pad-pointer";
      this.el.append(ptr);
    }
    ptr.style.left = `${x}px`;
    ptr.style.top = `${y}px`;
    ptr.hidden = pad.phase === "struck" || pad.pointer === false;
  }
}
