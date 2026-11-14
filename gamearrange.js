// Arranging the game screen (Shift + B in the game window or bay view, or
// the menu's Screens page): a frame over each of the words and numbers laid
// over the picture - the club and connection, the note, the lie's and the
// putt's guidance, the shot's numbers, the messages, the course's hole map
// and scoreboard. Drag one to move it, − and + to size it, ↺ to put it back;
// Enter keeps it all, Esc puts it back as it was. The blank area is drawn
// from its bar. What's kept, and the sums, are sim/gamelayout.mjs's.

import { GAME_ITEMS, cleanGameLayout, cleanPlace, moved, zoomed, widened, placeStyle, arrangeGameKey, fitPlace, shownPlace, screenList } from "./sim/gamelayout.mjs";
import { slopeSvg } from "./sim/gametext.mjs";
import { loadSetting, saveSetting, esc } from "./util.js";

// What an item shows while it's being arranged and has nothing in it, so
// it can be seen and moved.
const SAMPLES = {
  note: "The note: the hole, the result",
  lie: "80–95%",
  guide: "20 ft ↑ 5 in · plays 25 ft",
  stats: "Carry · Total · Ball speed · Launch · Spin",
  toast: "The demo videos' words show here",
  hint: "Tip: a key that helps right now",
  fps: "60 fps",
  reactions: "Sam: Nice shot!",
};

export class GameLayout {
  // view: the picture's element (#view), the items' parent. blank(): draws
  // the window's blank area. toast(text, ms): a message. switches: the
  // items that can be turned on and off, { id: { get(), set(on) } } (the
  // frame rate, the key tips: the menu's own switches), for the list of
  // everything on the screen.
  constructor(view, { blank = () => {}, toast = () => {}, switches = {} } = {}) {
    this.view = view;
    this.blank = blank;
    this.toast = toast;
    this.switches = switches;
    this.places = cleanGameLayout(loadSetting("gameLayout", {}));
    // Each item's place as it's shown (sim/gamelayout.mjs fitPlace: kept
    // on the picture), where a drag or an arrow key starts from.
    this.shown = {};
    this.editor = null;
    // Set aside (the game's video): everything where the page puts it, as
    // it comes, until it's back (aside(false)).
    this.setAside = false;
    new ResizeObserver(() => this.apply()).observe(view);
    // And again when an item shows, grows or comes (the frame rate turned
    // on, a longer result, the hole map made): each kept on the picture.
    this.sizes = new ResizeObserver(() => this.soon());
    const overlay = view.querySelector(".bay-overlay");
    const mo = new MutationObserver(() => this.soon());
    mo.observe(view, { childList: true });
    if (overlay) mo.observe(overlay, { childList: true });
    this.apply();
  }

  // apply() once, before the next frame is drawn, however many asked.
  soon() {
    if (this.queued) return;
    this.queued = true;
    const run = () => {
      this.queued = false;
      this.apply();
    };
    const raf = this.view.ownerDocument?.defaultView?.requestAnimationFrame;
    if (raf) raf(run);
    else setTimeout(run, 16);
  }

  get editing() {
    return !!this.editor;
  }

  els(item) {
    return [...this.view.querySelectorAll(`:scope > ${item.selector}, :scope > .bay-overlay ${item.selector}`)];
  }

  // The owner's arrangement set aside, or back: the game's video plays on
  // the game screen as it comes, where its caption can't land on a moved
  // or bigger box (the page reloads as it ends, which brings it back too).
  aside(on = true) {
    this.setAside = !!on;
    this.apply();
  }

  // Each item where it's been put (again: the picture's size changed, or
  // an item showed or grew) - and on the picture, whatever was kept
  // (sim/gamelayout.mjs fitPlace): a move that takes most of it off is set
  // aside for where the page puts it, a little over an edge is nudged in.
  apply() {
    const w = this.view.clientWidth;
    const h = this.view.clientHeight;
    const base = this.view.getBoundingClientRect();
    const shown = {};
    for (const item of GAME_ITEMS) {
      const place = this.setAside ? null : this.places[item.id];
      const { translate, scale, width } = placeStyle(place, w, h);
      for (const el of this.els(item)) {
        this.sizes?.observe(el);
        el.style.translate = translate;
        el.style.scale = scale;
        if (item.widen) {
          el.style.width = width;
          el.classList.toggle("ga-narrow", !!width);
        }
        if (el.hidden || !el.getClientRects().length) continue;
        const r = el.getBoundingClientRect();
        const fit = fitPlace(place, { left: r.left - base.left, top: r.top - base.top, width: r.width, height: r.height }, w, h);
        const was = translate || "";
        const now = fit.x || fit.y ? `${fit.x}px ${fit.y}px` : "";
        if (now !== was) el.style.translate = now;
        // (Moved by a place of its own: the frame rate's corner is then
        // the top line's again - fps.js.)
        if (fit.kept) el.dataset.gaMoved = "";
        else delete el.dataset.gaMoved;
        shown[item.id] ??= shownPlace(place, fit.x, fit.y, w, h);
      }
    }
    this.shown = shown;
    if (this.editor && !this.editor.dragging) this.drawFrames();
  }

  // Where an item is as it's shown, as a place (null: where the page puts
  // it): a drag or an arrow key starts there, not from a kept place that
  // was off the picture.
  placeOf(id) {
    return id in this.shown ? this.shown[id] : this.places[id] ?? null;
  }

  edit() {
    if (this.editor) return;
    if (!this.view.closest("body")?.classList.contains("bay")) {
      this.toast("Bay view first (B): the game screen's words are arranged there", 2500);
      return;
    }
    const doc = this.view.ownerDocument;
    const el = doc.createElement("div");
    el.className = "game-arrange";
    el.innerHTML = `<div class="ga-frames"></div>
      <div class="ga-bar">
        <b>Arrange the game screen</b>
        <span>Drag to move, − + to size, ⇤⇥ ⟷ (or [ ]) to make the numbers narrower or wider, ↺ to put one back. Arrows move the one last touched (Shift: further). Drag this bar out of the way.</span>
        <button data-ga="list" aria-expanded="true">On the screen</button>
        <button data-ga="reset">Start again</button>
        <button data-ga="blank">Blank area...</button>
        <button data-ga="cancel">Cancel (Esc)</button>
        <button data-ga="done" class="primary">Done (Enter)</button>
        <div class="ga-list"></div>
      </div>`;
    this.editor = { el, was: { ...this.places }, last: null };
    this.view.classList.add("game-arranging");
    for (const item of GAME_ITEMS) for (const e of this.els(item)) if (SAMPLES[item.id]) e.dataset.sample = SAMPLES[item.id];
    // The key tip, when it's not up: shown for now (a sample) so it can be
    // placed, and hidden again after.
    const hint = this.view.querySelector(":scope > .bay-hint[hidden]");
    if (hint) {
      hint.hidden = false;
      hint.dataset.sampled = "";
      hint.innerHTML = `<span class="bh-tip">Tip</span> <kbd>I</kbd> <span class="bh-text">a key that helps right now</span>`;
    }
    // What's being recorded, when it isn't up: the box shown for now, to
    // place (the full window flicked to isn't a box: put back to one) -
    // only when it's been chosen (the Recording panel's On the game window:
    // a small box). Not chosen, it showed while arranging and went when
    // done (the owner, 16 October 2026: "it actually shows me it when
    // Control and B has been pressed ... It doesn't show when you've
    // finished organizing"): the recording's picture is the command
    // centre's Game screen box's (ccwidgets.js), switched to.
    const monitor = this.view.querySelector(":scope > .video-monitor");
    if (monitor?.dataset.chosen === "box" && (monitor.hidden || monitor.classList.contains("full"))) {
      monitor.dataset.peekBox = monitor.hidden ? "hidden" : "full";
      monitor.hidden = false;
      monitor.classList.remove("full");
      monitor.classList.add("box");
    }
    // The lie of the land, on flat ground: a sample of it, to place.
    const slope = this.view.querySelector(".bay-slope[hidden]");
    if (slope) {
      slope.hidden = false;
      slope.dataset.sampled = "";
      slope.innerHTML = `${slopeSvg({ side: 3, slope: -2 })}<div class="slope-nums"><div><span>L–R</span><b>3°</b><small>ball above feet</small></div><div><span>U–D</span><b>2°</b><small>downhill</small></div></div>`;
    }
    this.view.appendChild(el);
    const bar = el.querySelector(".ga-bar");
    // The bar dragged out of the way of what's under it.
    bar.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button, .ga-list")) return;
      e.preventDefault();
      bar.setPointerCapture(e.pointerId);
      const sx = e.clientX - bar.offsetLeft;
      const sy = e.clientY - bar.offsetTop;
      const move = (ev) => Object.assign(bar.style, { left: `${ev.clientX - sx}px`, top: `${ev.clientY - sy}px` });
      const up = () => bar.removeEventListener("pointermove", move);
      bar.addEventListener("pointermove", move);
      bar.addEventListener("pointerup", up, { once: true });
    });
    bar.addEventListener("click", (e) => {
      const act = e.target.closest("[data-ga]")?.dataset.ga;
      if (act === "done") this.finish(true);
      else if (act === "cancel") this.finish(false);
      else if (act === "reset") this.set(null, null, true);
      else if (act === "list") {
        const list = el.querySelector(".ga-list");
        list.hidden = !list.hidden;
        e.target.closest("[data-ga]").setAttribute("aria-expanded", String(!list.hidden));
      }
      else if (act === "blank") {
        this.finish(true);
        this.blank();
      }
    });
    // Everything on the screen: what's showing, what's off (turned back on
    // here), what's waiting for its moment - each put back from here too.
    el.querySelector(".ga-list").addEventListener("click", (e) => {
      const b = e.target.closest("[data-gal]");
      const id = b?.closest("[data-id]")?.dataset.id;
      if (!b || !id) return;
      if (b.dataset.gal === "switch") {
        const sw = this.switches[id];
        sw?.set(!sw.get());
      } else if (b.dataset.gal === "reset") this.set(id, null);
      // (Once what it turned on is drawn.)
      requestAnimationFrame(() => {
        this.apply();
        this.renderList();
      });
    });
    this.drawFrames();
  }

  // The list of everything on the screen (sim/gamelayout.mjs screenList),
  // drawn again only when it's changed (so it keeps its scroll).
  renderList() {
    const box = this.editor?.el.querySelector(".ga-list");
    if (!box) return;
    const showing = {};
    for (const item of GAME_ITEMS) {
      showing[item.id] = this.els(item).some((e) => {
        if (e.hidden || !e.getClientRects().length) return false;
        const r = e.getBoundingClientRect();
        return r.width >= 2 && r.height >= 2;
      });
    }
    const on = {};
    for (const [id, sw] of Object.entries(this.switches)) on[id] = !!sw.get();
    const rows = screenList({ showing, on, places: this.places });
    const off = rows.filter((r) => r.state === "off").length;
    const html = `<div class="gal-head"><b>On the game screen</b><small>Everything that can show here${off ? ` - ${off} turned off` : ""}. Turn one back on, or put it back where it began (↺).</small></div>
      <ul>${rows
        .map(
          (r) => `<li class="gal-row is-${r.state}" data-id="${r.id}">
        <span class="gal-name">${esc(r.name)}</span>
        <span class="gal-state">${esc([r.words, ...r.changed].join(" · "))}</span>
        <span class="gal-acts">${r.switchable ? `<button data-gal="switch" role="switch" aria-checked="${r.state !== "off"}" class="gal-switch${r.state !== "off" ? " on" : ""}" title="${r.state === "off" ? "Turn it on" : "Turn it off"}">${r.state === "off" ? "Off" : "On"}</button>` : ""}${r.changed.length ? `<button data-gal="reset" title="Back where it was to begin with, at its own size">↺</button>` : ""}</span>
      </li>`,
        )
        .join("")}</ul>`;
    if (this.editor.listHtml !== html) {
      this.editor.listHtml = html;
      box.innerHTML = html;
    }
  }

  // One item's place (id null and all: every one back where the page puts
  // it).
  set(id, place, all = false) {
    if (all) this.places = {};
    else {
      const p = cleanPlace(place);
      this.places = { ...this.places };
      if (p) this.places[id] = p;
      else delete this.places[id];
    }
    this.apply();
  }

  drawFrames() {
    const box = this.editor?.el.querySelector(".ga-frames");
    if (!box) return;
    const base = this.view.getBoundingClientRect();
    const html = [];
    for (const item of GAME_ITEMS) {
      const el = this.els(item).find((e) => !e.hidden && e.getClientRects().length);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const z = this.places[item.id]?.z ?? 1;
      html.push(`<div class="ga-frame${this.editor.last === item.id ? " selected" : ""}" data-id="${item.id}" style="left:${r.left - base.left}px;top:${r.top - base.top}px;width:${r.width}px;height:${r.height}px">
        <span class="ga-name">${esc(item.name)}</span>
        <span class="ga-tools"><button data-z="-1" title="Smaller">−</button><i>${Math.round(z * 100)}%</i><button data-z="1" title="Bigger">+</button>${item.widen ? `<button data-w="-1" title="Narrower ([) - a block that wraps, to put anywhere">⇤⇥</button><button data-w="1" title="Wider (])">⟷</button>` : ""}<button data-z="0" title="Back where it was to begin with">↺</button></span>
      </div>`);
    }
    box.innerHTML = html.join("");
    for (const f of box.children) this.wire(f);
    this.renderList();
  }

  wire(frame) {
    const id = frame.dataset.id;
    frame.addEventListener("pointerdown", (e) => {
      const z = e.target.closest("[data-z]");
      const wb = e.target.closest("[data-w]");
      this.editor.last = id;
      if (wb) {
        e.preventDefault();
        this.set(id, widened(this.places[id], Number(wb.dataset.w)));
        return;
      }
      if (z) {
        e.preventDefault();
        const dir = Number(z.dataset.z);
        this.set(id, dir ? zoomed(this.places[id], dir) : null);
        return;
      }
      e.preventDefault();
      frame.setPointerCapture(e.pointerId);
      const start = { x: e.clientX, y: e.clientY, left: frame.offsetLeft, top: frame.offsetTop, place: this.placeOf(id) };
      frame.classList.add("selected");
      this.editor.dragging = true;
      // The frame follows the pointer; the item follows the frame.
      // Kept within the picture: the frame is the item.
      const clamp = (v, lo, hi) => Math.min(Math.max(v, Math.min(lo, 0)), Math.max(hi, 0));
      const move = (ev) => {
        const px = clamp(ev.clientX - start.x, -start.left, this.view.clientWidth - start.left - frame.offsetWidth);
        const py = clamp(ev.clientY - start.y, -start.top, this.view.clientHeight - start.top - frame.offsetHeight);
        frame.style.left = `${start.left + px}px`;
        frame.style.top = `${start.top + py}px`;
        this.set(id, moved(start.place, px, py, this.view.clientWidth, this.view.clientHeight));
      };
      const up = () => {
        if (this.editor) this.editor.dragging = false;
        frame.removeEventListener("pointermove", move);
        frame.removeEventListener("pointerup", up);
        frame.removeEventListener("pointercancel", up);
        this.drawFrames();
      };
      frame.addEventListener("pointermove", move);
      frame.addEventListener("pointerup", up);
      frame.addEventListener("pointercancel", up);
    });
  }

  // A key while arranging: true when it was this's (every key is, until
  // it's kept or left).
  key(e) {
    if (!this.editor) return false;
    e.preventDefault();
    const k = arrangeGameKey(e.key, e.shiftKey);
    const id = this.editor.last;
    if (k?.act === "done") this.finish(true);
    else if (k?.act === "cancel") this.finish(false);
    else if (id && k?.act === "move") {
      const p = this.placeOf(id) ?? { dx: 0, dy: 0, z: 1 };
      this.set(id, { ...p, dx: p.dx + k.dx, dy: p.dy + k.dy });
    } else if (id && k?.act === "zoom") this.set(id, zoomed(this.places[id], k.dir));
    else if (id && k?.act === "width" && GAME_ITEMS.find((i) => i.id === id)?.widen) this.set(id, widened(this.places[id], k.dir));
    else if (id && k?.act === "reset") this.set(id, null);
    return true;
  }

  finish(keep) {
    if (!this.editor) return;
    const { el, was } = this.editor;
    this.editor = null;
    el.remove();
    this.view.classList.remove("game-arranging");
    for (const e of this.view.querySelectorAll("[data-sample]")) delete e.dataset.sample;
    for (const e of this.view.querySelectorAll("[data-peek]")) {
      delete e.dataset.peek;
      e.hidden = true;
    }
    // What's being recorded, as it was before.
    for (const e of this.view.querySelectorAll("[data-peek-box]")) {
      if (e.dataset.peekBox === "hidden") e.hidden = true;
      else e.classList.replace("box", "full");
      delete e.dataset.peekBox;
    }
    for (const e of this.view.querySelectorAll("[data-sampled]")) {
      delete e.dataset.sampled;
      e.hidden = true;
      e.innerHTML = "";
    }
    if (keep) saveSetting("gameLayout", this.places);
    else this.places = was;
    this.apply();
    if (keep) this.toast("Game screen arranged", 1500);
  }
}
