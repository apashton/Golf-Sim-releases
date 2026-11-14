// The controls window laid out as boxes (sim/arrange.mjs does the
// arithmetic): the top bar in two halves, the boxes for every mode - This
// shot, the messages, a box for each camera (camerabox.js) and the owner's own (ccwidgets.js: the Last
// shot, the game screen, a shot number on its own...) - packed round the blank
// area rather than below it, so both sides of a webcam hanging over the
// laptop's screen are used; the mode's box, in the same place whatever's
// being played, with the mode showing's own boxes in it (sim/modebox.mjs);
// and a drawer down each side, over the boxes - the cards from the game
// window, the keys and the shot history down the right, the mode's options
// down the left (sidedrawer.js). Switching mode changes only what's in the
// mode's box and the left drawer: the rest stays where it was set out (the
// owner, 16 October 2026: "Everything needs to be laid out where it's
// initially set out, and then additional stuff needs to be sort of to the
// side").
//
// In arrange mode (Shift + B in the controls window, its Arrange button,
// or the menu's Screens page) each box can be dragged somewhere else, sized
// from its corner and its text made bigger or smaller, the mode's box and
// the blank area moved and sized the same way, and any box put in either
// drawer; boxes of the owner's own are added from its bar and taken out
// with their ×. What's arranged is kept: the top bar's halves and the boxes
// for every mode, the mode's box and the drawers for every mode, and which
// of a mode's boxes are put away for it.
//
// The sections stay where they are in the page - they're only placed on
// the screen - so everything in them works as before, and docking puts
// them back as they were.

import { packToFit, placeBars, barsAfresh, pushOut, moveTo, sizeTo, resizeFrom, snapToEdges, stepZoom, toShares, toPixels, cleanBox, arrangeKey, roomBelow, clearOfBars, restack, drawerWidth, stackDrawer, belowFold, DRAWER, MIN_H } from "./sim/arrange.mjs";
import { cleanRect } from "./sim/blankarea.mjs";
import { cleanDrawer, takeOut, showTab, tabOrder, tabWidth, sizeOf, sizeBox, homeSide, whereIn, moveInto } from "./sim/ccdrawer.mjs";
import { cleanModeBox, modeBoxPixels, modeBoxShares, boxZoom, zoomBox, modeBoxChoices, modeBoxInside, besideModeBox, placeInBox, placedIn, holdInside, forgetPlaces, MODE_BOX } from "./sim/modebox.mjs";
import { SideDrawer } from "./sidedrawer.js";
import { loadSetting, saveSetting, esc } from "./util.js";

// The drawers' boxes are over the rest (a card out over the boxes while
// the drawer's closed), which are numbered from 1 (restack) and never
// reach this.
const DRAWER_LAYER = 900;
// What the drawers' tabs call the boxes that start in the right one (a
// mode's options go by their own names: Course, Season, Practice...).
const DRAWER_WORDS = { keys: "Keys", options: "Options", history: "Shot history" };
// The drawer's boxes top to bottom: the cards (they want an answer), then
// the open tab's (sim/ccdrawer.mjs tabOrder: those put there in order, then
// the keys, a mode's options and the shot history).
// The most of the drawer's height a box in it can have (scrolling past
// that), so the ones below still show: the keys 0.45, or 0.3 with a mode's
// options under them (0.4) - about a third left for the shot history; any
// other box half. The last takes what's left - all of it, for a box on a
// tab of its own (the owner, 16 October 2026: "the options one, I'd just
// like to be full screen. The keys, I'd like to be full screen, and just
// click on them and click off it"). A box the player has sized in the
// drawer is that tall instead (sim/ccdrawer.mjs sizeBox).
const drawerShare = (b, list) => {
  const boxes = list.filter((x) => x.kind !== "messages");
  if (boxes.length < 2) return null;
  return b.drawer === "keys" ? (boxes.some((x) => x.drawer === "options") ? 0.3 : 0.45) : b.drawer === "options" ? 0.4 : 0.5;
};
// "Keys, Options and Shot history".
const listWords = (list) => (list.length < 2 ? list.join("") : `${list.slice(0, -1).join(", ")} and ${list.at(-1)}`);
const BAR_NAMES = { "bar-main": "Top bar: modes, club, player", "bar-tools": "Top bar: links, connection, buttons" };
// The least This shot is held to when the window's too small for
// everything: its heading and a few lines.
const DETAILS_MIN = 140;
const STYLE_KEYS = ["left", "top", "width", "height", "zoom", "right", "bottom", "maxHeight", "zIndex", "overflow"];
// The cards in the side drawer: no bigger than this share of the size they
// are on the game window, and small enough that one this wide fits.
const CARD_ZOOM = 0.75;
const CARD_WIDTH = 560;
// The drawer's heading.
const DRAWER_HEAD = 34;
// What some modes hide in the top bar: shown while it's measured, so it's
// placed wide enough for every mode.
const BY_MODE = "#club-wrap, #hitter-wrap";
// The text sizes the mode's box's boxes are tried at, biggest first, to
// fill it.
const FILL_ZOOMS = [1.6, 1.45, 1.3, 1.2, 1.1, 1];
// Boxes held at least this tall (pixels) when they place themselves.
const RESERVE = { msglog: 170, details: 240 };
// What the arrangement is kept for: from 2, the mode's box; from 3, This
// shot (held taller) and the Last shot box. An older one's boxes that
// placed themselves are placed again - never those placed by hand.
const LAYOUT_VERSION = 3;
// The keys that open and minimise each drawer while arranging.
const DRAWER_KEYS = { right: "D", left: "A" };

export class ControlsLayout {
  // header: the top bar (its halves are .bar-main and .bar-tools). aside:
  // the side panel. mode(): the mode showing. panel(mode): its panel.
  // messages(): the prompts' area (promptmirror.js), or null. extras(): the
  // boxes of the controls window's own that every mode has, [{ id, el,
  // name }] - This shot (details.js) and each camera (camerabox.js), boxes
  // while they're in the window and not hidden.
  // blank: blankarea.js's, for the controls window's blank area.
  // inbox: the Messages box (messages.js), told whether it's in sight, its
  // drawer's tab counting what comes while it isn't.
  // toast(text, ms).
  // palette(): boxes that can be added from the Arrange bar, [{ group,
  // items: [{ key, name }] }], and add(key) adds one (ccwidgets.js); an
  // extra with a remove() can be taken out again with its ×.
  // takenOut(): boxes taken out that way, [{ id, name, restore() }] - each
  // listed in Arrange ▾, unticked, to tick back (a camera taken off, a box
  // the command centre starts with).
  constructor({ header, aside, mode, panel, messages = () => null, extras = () => [], blank, inbox = null, toast = () => {}, palette = () => null, add = () => null, takenOut = () => [] }) {
    Object.assign(this, { header, aside, mode, panel, messages, extras, blank, inbox, toast, palette, add, takenOut });
    if (inbox) {
      inbox.inSight = () => this.inboxInSight();
      inbox.onUnseen = () => this.drawTabs();
    }
    // The mode the game's on - or, while arranging, the one being looked at
    // (the arrange bar's modes: only the command centre changes, to check
    // its layout in each mode; the game stays where it is).
    this.realMode = mode;
    this.preview = null;
    this.previewEls = [];
    this.mode = () => this.preview ?? this.realMode();
    this.saved = loadSetting("arrange", { common: {}, modes: {} });
    // A drawer down each side - open over the boxes, or closed to its tabs
    // on the edge, as it was left (closed to begin with) - each with its
    // tabs, which boxes are in each and how big (sidedrawer.js,
    // sim/ccdrawer.mjs).
    this.drawers = { right: new SideDrawer(this, "right"), left: new SideDrawer(this, "left") };
    // The mode's box: where it is, the same for every mode, and the text
    // size of each box in it (sim/modebox.mjs).
    this.modeBox = cleanModeBox(loadSetting("ccModeBox", null));
    this.doc = null;
    this.rects = {};
    this.where = {};
    this.boxRect = null;
    this.editor = null;
  }

  get attached() {
    return !!this.doc;
  }
  get editing() {
    return !!this.editor;
  }
  get sides() {
    return [this.drawers.right, this.drawers.left];
  }

  // The controls window has opened: lay it out, and again whenever what's
  // showing changes - another mode or tab, a section shown or hidden, a box
  // growing, the window's size.
  attach(doc) {
    this.detach();
    if (!doc?.body) return;
    this.doc = doc;
    doc.body.classList.add("arranged");
    this.mutations = new MutationObserver((records) => {
      // A section appearing or going: placed before it's ever drawn out of place.
      if (records.some((r) => r.type === "childList" || r.attributeName === "hidden")) queueMicrotask(() => this.layout());
    });
    this.mutations.observe(this.aside, { subtree: true, childList: true, attributes: true, attributeFilter: ["hidden"] });
    this.mutations.observe(this.header, { subtree: true, attributes: true, attributeFilter: ["hidden"] });
    // One of them showing or hiding.
    for (const x of this.extras()) if (x.el) this.mutations.observe(x.el, { attributes: true, attributeFilter: ["hidden"] });
    // And what's in them changing: This shot grows with each line. The size
    // observer below notices too, but only when the window next draws, and
    // until then the box below sat over them.
    this.contents = new MutationObserver(() => this.soon());
    for (const x of this.extras()) if (x.el) this.contents.observe(x.el, { childList: true, subtree: true, characterData: true });
    this.sizes = new doc.defaultView.ResizeObserver(() => this.soon());
    // The mode's box (under everything: its boxes are drawn over it), the
    // drawers, and the word that boxes are out of sight below.
    this.boxEl = doc.createElement("div");
    this.boxEl.className = "cc-modebox";
    doc.body.prepend(this.boxEl);
    // Its heading's buttons press the mode's own (headItems).
    this.boxEl.addEventListener("click", (e) => {
      const b = e.target.closest("[data-mirror]");
      if (b) this.headItems?.[Number(b.dataset.mirror)]?.click();
    });
    // And keep up with them: a tab chosen, a button's words or state.
    this.headWatch = new MutationObserver(() => {
      if (this.headTimer) return;
      this.headTimer = doc.defaultView.requestAnimationFrame(() => {
        this.headTimer = 0;
        if (this.boxRect) this.drawModeBox(this.boxRect, this.inBoxNow ?? []);
      });
    });
    this.headWatch.observe(this.aside, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["class", "disabled", "hidden"] });
    for (const s of this.sides) s.attach(doc);
    this.moreEl = doc.createElement("div");
    this.moreEl.className = "cc-more";
    this.moreEl.hidden = true;
    doc.body.append(this.moreEl);
    this.onResize = () => this.soon();
    doc.defaultView.addEventListener("resize", this.onResize);
    this.layout();
  }

  // Back in one window: everything as it was before it was placed.
  detach() {
    if (!this.doc) return;
    this.close(false);
    this.endPreview();
    this.mutations?.disconnect();
    this.headWatch?.disconnect();
    this.contents?.disconnect();
    this.sizes?.disconnect();
    this.doc.defaultView?.removeEventListener("resize", this.onResize);
    clearTimeout(this.timer);
    this.doc.body?.classList.remove("arranged");
    this.closeMenu();
    for (const s of this.sides) s.detach();
    this.boxEl?.remove();
    this.moreEl?.remove();
    this.boxEl = this.moreEl = null;
    for (const el of [this.header.querySelector(".bar-main"), this.header.querySelector(".bar-tools"), ...this.extras().map((x) => x.el), ...this.aside.querySelectorAll("section"), this.messages()]) {
      if (!el) continue;
      for (const k of STYLE_KEYS) el.style[k] = "";
      delete el.dataset.box;
      delete el.dataset.boxTitle;
      el.classList.remove("arr-off", "arr-empty");
    }
    this.doc = null;
    this.rects = {};
  }

  // A layout a moment from now: a box growing as it fills can set off a
  // few changes at once.
  soon() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.layout(), 60);
  }

  // ---- Which boxes, and where they go ---------------------------------------------------

  // The boxes showing now: { id, key, el, kind, name, drawer } - drawer:
  // where it starts ("keys", "history", "cards"; "options" for a mode's
  // options, which start in the drawer down the left).
  boxes() {
    const out = [];
    for (const id of ["bar-main", "bar-tools"]) {
      const el = this.header.querySelector(`.${id}`);
      if (el && !el.hidden) out.push({ id, key: id, el, kind: "bar", name: BAR_NAMES[id] });
    }
    for (const x of this.extras()) {
      if (x.el && !x.el.hidden && x.el.ownerDocument === this.doc) out.push({ id: x.id, key: x.id, el: x.el, kind: "extra", name: x.name, remove: x.remove ?? null, drawer: x.drawer ?? null });
    }
    const mode = this.mode();
    const panel = this.panel(mode);
    if (panel) {
      [...panel.querySelectorAll("section")].forEach((el, i) => {
        // (A mode only looked at while arranging: its panel is hidden, as
        // the game isn't on it, but its sections are the boxes.)
        const off = el.closest("[hidden]");
        if (off && !(this.preview && off === panel)) return;
        // Not a box in the command centre: one This shot or the mode's
        // box's heading has instead (data-cc="off" - the one window keeps
        // it), or one shown in the heading (data-cc="head": the tabs, a
        // round's Start).
        if (el.dataset.cc === "off" || el.dataset.cc === "head") return;
        // Nothing in it yet (the target before there is one, the guide
        // before a round): not a box at all until there is.
        const empty = isEmpty(el);
        el.classList.toggle("arr-empty", empty);
        if (empty) return;
        const name = sectionName(el, i);
        // Its name over it, where it has no heading of its own, so it's
        // clear what each box is.
        if (!el.querySelector("h3") && CAPTIONED.test(name)) el.dataset.boxTitle = name;
        else delete el.dataset.boxTitle;
        // Known to the drawers by its mode and name: key. A mode's options
        // (its settings) start in the drawer down the left.
        const option = el.dataset.drawer || (el.classList.contains("settings") ? "options" : null);
        out.push({ id: `s${i}`, key: `${mode}:${el.dataset.drawer || name}`, el, kind: "section", name, drawer: option });
      });
    }
    const m = this.messages();
    if (m) out.push({ id: "messages", key: "messages", el: m, kind: "messages", name: "Cards and messages from the game window", drawer: "cards" });
    return out;
  }

  // The window's size, and its blank area in pixels. The size is inside
  // any scrollbar: laid out to the window's full width, a column running a
  // little below the window brought a scrollbar down the side that took
  // its width from the boxes on the right, and a second one along the
  // bottom with it.
  get size() {
    const w = this.doc.defaultView;
    const root = this.doc.documentElement;
    return { W: root?.clientWidth || w.innerWidth, H: root?.clientHeight || w.innerHeight };
  }
  blankPx() {
    const r = this.blank?.rect("controls");
    if (!r) return null;
    const { W, H } = this.size;
    return { x: r.x * W, y: r.y * H, w: r.w * W, h: r.h * H };
  }

  // A drawer opened or closed, a tab added, named or taken away, a box put
  // in one or sized there: laid out again.
  drawerChanged() {
    if (this.editor) this.relayout();
    else this.layout();
  }

  // Which drawer and tab a box is in, or null: the cards always the right
  // drawer's own; a box the player has put in one; one that starts in one
  // (the keys and the shot history the right, a mode's options the left)
  // until it's placed somewhere by hand or taken out. A section put away
  // (×) isn't anywhere.
  whereIs(b, placed) {
    if (b.kind === "messages") return { side: "right", tab: "cards" };
    if (b.kind === "bar" || (b.kind === "section" && this.saved.modes?.[this.mode()]?.[b.id]?.hide)) return null;
    return whereIn({ right: this.drawers.right.data, left: this.drawers.left.data }, b.key, { home: homeSide(b), placed });
  }
  // The mode's name, as a heading ("Course").
  modeTitle() {
    return MODE_TITLES[this.mode()] ?? this.mode();
  }
  // What a drawer's tab calls a box in it.
  boxWord(b) {
    return b.drawer === "keys" || b.drawer === "history" ? DRAWER_WORDS[b.drawer] : b.name;
  }

  // Boxes out of sight below the foot of the window: said so, at the foot.
  showMore(rects, H) {
    const el = this.moreEl;
    if (!el) return;
    const n = belowFold(
      Object.entries(rects)
        .filter(([, r]) => !r.inDrawer)
        .map(([, r]) => r),
      H,
    );
    el.hidden = !n || this.editing;
    if (n) el.textContent = `▼ ${n} more ${n === 1 ? "box" : "boxes"} below - scroll down, or Arrange ▾ → Tidy up`;
  }

  // Everything placed: the top bar's halves, then the drawers down each
  // side, then the boxes for every mode kept where they are, then the
  // mode's box (where it was put, or the first time beside the rest), then
  // any box for every mode showing for the first time in a free spot round
  // those - kept there from then on, so nothing moves by itself (the owner,
  // 16 October 2026: "it switches screen from time to time ... on the
  // putting green the whole screen changes? Need a consistent screen
  // here") - and the mode's own boxes inside its box. Another mode changes
  // only what's in the mode's box and the left drawer. repack: every box,
  // the mode's box and the top bar packed afresh (Tidy up), keeping each
  // one's text size.
  layout({ repack = false } = {}) {
    if (!this.doc || (this.editor && !repack)) return;
    const { W, H } = this.size;
    const blank = this.blankPx();
    const mode = this.mode();
    const all = this.boxes();
    const bars = all.filter((b) => b.kind === "bar");
    // The top bar's halves where they placed themselves, placed afresh when
    // that's better now: a tab added since, or a wider window (barsAfresh).
    if (!repack && bars.length === 2) {
      const nat = {};
      const natural = (id) => (nat[id] ??= this.naturalWidth(bars.find((b) => b.id === id).el));
      if (barsAfresh(this.saved.common, { W, natural, fresh: () => this.autoBars(bars, W, blank) })) this.forgetAutoBars();
    }
    const common = this.saved.common ?? {};
    const mine = this.saved.modes?.[mode] ?? {};
    // (Only the top bar's halves and the boxes for every mode have places
    // of their own: a mode's are in its box or a drawer.)
    const kept = (b) => (repack || (b.kind !== "bar" && b.kind !== "extra") ? null : cleanBox(common[b.id]));
    const zoomOf = (b) => (repack ? this.rects[b.id]?.z ?? 1 : 1);
    const rects = {};
    for (const b of all) this.sizes?.observe(b.el);

    // The top bar.
    const loose = bars.filter((b) => !kept(b));
    if (loose.length) {
      const auto = this.autoBars(bars, W, blank);
      for (const b of loose) rects[b.id] = this.place(b, { ...auto[b.id], h: null, z: zoomOf(b) });
      // Kept there from then on, like every box for every mode: the top bar
      // doesn't move with the mode (or the connection's words).
      if (!repack) this.remember(loose, rects);
    }
    for (const b of bars) {
      const s = kept(b);
      if (s) rects[b.id] = this.place(b, { ...toPixels(s, W, H), l: layerOf(common[b.id]) });
    }
    const barRects = Object.values(rects);

    // The drawers: from below the top bar to the foot of the window, over
    // the boxes - they're laid out as if the drawers weren't there, so
    // opening one moves nothing and closing it shows them again (the owner,
    // 16 October 2026: "The tab should just come over the top of it and
    // should come back down below it"). Closed, each is its tabs on its
    // edge (kept clear: its strip), and a card that comes slides out over
    // the boxes from the right one until it's answered.
    const { right, left } = this.drawers;
    for (const s of this.sides) s.measure(W, H, barRects);
    // (Placed by hand somewhere, whether or not it's being tidied up: a box
    // taken out of a drawer stays out.)
    const placed = (b) => b.kind === "extra" && !!cleanBox(common[b.id]);
    for (const b of all) b.where = this.whereIs(b, placed(b));
    this.where = Object.fromEntries(all.map((b) => [b.id, b.where]));
    this.lastBoxes = all;
    for (const s of this.sides) s.draw(all);
    const strips = [left.strip, right.strip];
    const obstacles = [blank, ...barRects, ...strips].filter(Boolean);
    const area = { x: left.strip.w, y: 0, w: Math.max(1, right.strip.x - left.strip.w), h: H };

    // A mode's boxes put away (the × in arrange mode) aren't shown at all;
    // the rest not in a drawer go in the mode's box. The boxes for every
    // mode: This shot and the messages at the head of the first column,
    // then the cameras and the owner's own.
    for (const b of all) if (b.kind === "section") b.el.classList.toggle("arr-off", !!mine[b.id]?.hide);
    const head = (b) => b.id === "details" || b.id === "msglog";
    const free = all.filter((b) => !b.where);
    const extras = [...free.filter((b) => b.kind === "extra" && head(b)), ...free.filter((b) => b.kind === "extra" && !head(b))];
    const inBox = free.filter((b) => b.kind === "section" && !mine[b.id]?.hide);
    for (const b of [...extras, ...inBox]) b.el.classList.remove("arr-off");

    // The mode's box: where it is - or, the first time (and tidied up),
    // placed by itself, and the boxes for every mode that placed themselves
    // placed again round it.
    // (An arrangement from before this version: the boxes that placed
    // themselves, and the mode's box, placed again round the new set of
    // boxes - never those placed by hand.)
    const older = (this.saved.v ?? 1) < LAYOUT_VERSION;
    let box = repack || older ? null : modeBoxPixels(this.modeBox, W, H);
    const first = !box;
    // Each box for every mode: placed by hand (kept where it was put),
    // placed by itself before (kept there too - but packed again with the
    // others placed by themselves when there's no room for a box that's
    // never been seen), or never placed.
    const entry = (b) => common[b.id];
    const fresh = [];
    const byItself = [];
    const put = [];
    for (const b of extras) {
      const s = kept(b);
      if (!s || (first && entry(b)?.auto)) fresh.push(b);
      else if (entry(b)?.auto) byItself.push({ b, s });
      else put.push({ b, s });
    }
    // Placed by hand somewhere a closed drawer's tabs now cover (the
    // window's narrower, or it was put at the very edge): moved out from
    // under them - measured first if it's as tall as it needs (a height of
    // none overlapped nothing). Those the top bar now reaches (it wraps on
    // a narrower window than they were arranged on) go down clear of it.
    const handRects = put.map(({ b, s }) => {
      const at = toPixels(s, W, H);
      let r = { ...at, h: at.h ?? this.heightAt(b.el, at.w, at.z), l: layerOf(entry(b)) };
      for (const strip of strips) r = pushOut(r, strip, W, H);
      return { b, r: { ...r, h: at.h, z: at.z } };
    });
    const ys = clearOfBars(handRects.map(({ b, r }) => ({ id: b.id, x: r.x, y: r.y, w: r.w })), barRects);
    for (const { b, r } of handRects) rects[b.id] = this.place(b, { ...r, y: ys[b.id] });
    for (const { b } of handRects) obstacles.push(rects[b.id]);

    // Packed into the room beside the mode's box - slimmer columns, and
    // more of them, where the usual ones would run below the window (a 1280
    // x 720 laptop); each box measured again at each width tried. This shot
    // stays at the head of the first column, however that evens the columns
    // out, and if nothing else fits This shot is held shorter (no
    // less than DETAILS_MIN): what's at its foot scrolls.
    const pack = (list, around, room = besideModeBox(area, box)) => {
      const byId = Object.fromEntries(list.map((b) => [b.id, b]));
      const ids = list.map((b) => ({ id: b.id, first: head(b), ...(b.id === "details" ? { min: DETAILS_MIN } : {}) }));
      return packToFit(ids, (id, width) => Math.max(RESERVE[id] ?? 0, this.heightAt(byId[id].el, width, zoomOf(byId[id]))), { area: room, obstacles: around });
    };
    if (first) {
      const top = Math.max(0, ...barRects.map((r) => r.y + r.h));
      // As wide as it can be with the boxes for every mode that place
      // themselves all fitting beside it (modeBoxChoices: a column fewer
      // each time) - or, if they never would, as narrow as it goes.
      const choices = modeBoxChoices(area, { top, hand: [blank, ...handRects.map(({ b }) => rects[b.id])].filter(Boolean) });
      box = (fresh.length ? choices.find((c) => pack(fresh, [...obstacles, c], besideModeBox(area, c)).fits) : choices[0]) ?? choices.at(-1);
      this.modeBox = { ...this.modeBox, rect: modeBoxShares(box, W, H) };
      if (!this.editor) {
        this.saveModeBox();
        this.saved = { ...this.saved, v: LAYOUT_VERSION };
        saveSetting("arrange", this.saved);
      }
    }
    obstacles.push(box);
    this.boxRect = box;
    this.drawModeBox(box, inBox);

    const lay = (list, packed) => {
      for (const b of list) {
        const p = packed.rects[b.id];
        // (The messages kept a few lines tall, whatever's in them when
        // they're placed - placed empty, they were cut to a line.)
        rects[b.id] = this.place(b, { ...p, h: RESERVE[b.id] ? Math.max(p.h, RESERVE[b.id]) : null, z: zoomOf(b) });
        if (p.shrunk) {
          b.el.style.maxHeight = `${p.h / zoomOf(b)}px`;
          rects[b.id] = { ...rects[b.id], h: p.h };
        }
      }
    };
    const inWindow = (packed, list) => list.every((b) => packed.rects[b.id].y + Math.min(packed.rects[b.id].h, 32) <= H + 0.5);
    // Those placed by themselves stay where they are.
    for (const { b, s } of byItself) {
      rects[b.id] = this.place(b, { ...toPixels(s, W, H), l: layerOf(entry(b)) });
      obstacles.push(rects[b.id]);
    }
    // The new ones in a free spot round all of those - one in sight beside
    // an open drawer, if there's room (from then on it's kept there, open
    // or not). The others never move to make room (the owner, 16 October
    // 2026: "Boxes for all should stay in their same position unless
    // specifically marked to move"): with no room, a new one goes below,
    // and the note at the foot says so - Tidy up packs them all again.
    if (fresh.length) {
      const open = this.sides.filter((s) => s.open).map((s) => s.rect);
      const beside = open.length && !repack ? pack(fresh, [...obstacles, ...open]) : null;
      const packed = beside && inWindow(beside, fresh) ? beside : pack(fresh, obstacles);
      lay(fresh, packed);
      if (!repack) this.remember(fresh, rects);
    }

    // Every box as tall as what's in it: no taller than the room down to
    // the next box or the window's foot, scrolling inside itself beyond
    // that (cut off, for a box that can't scroll: a camera's picture). A
    // box growing (This shot with every line) never moves the box
    // below it.
    const others = (id) => [blank, ...strips, box, ...Object.entries(rects).filter(([k]) => k !== id).map(([, r]) => r)];
    for (const b of extras) {
      const r = rects[b.id];
      if (!r || r.fixedH || (repack && fresh.includes(b))) continue;
      const below = roomBelow(r, others(b.id), H);
      if (r.h > below + 0.5) {
        b.el.style.maxHeight = `${below / (r.z ?? 1)}px`;
        if (!scrolls(b.el)) b.el.style.overflow = "hidden";
        rects[b.id] = { ...r, h: below };
      }
    }

    // The Messages box with a card in it (messages.js has-cards): out in
    // front of the boxes below it, as tall as the card and the messages
    // need (down to the window's foot), until the card's answered - then
    // back as it was, as the cards slid out over the boxes before they were
    // pinned in it. (Not while arranging: it's laid out as it's kept.)
    const msgs = extras.find((b) => b.id === "msglog" && b.el.classList.contains("has-cards"));
    if (msgs && rects.msglog && !this.editor) {
      const r = rects.msglog;
      const z = r.z ?? 1;
      Object.assign(msgs.el.style, { height: "", maxHeight: `${Math.max(MIN_H, H - r.y - 6) / z}px`, overflow: "", zIndex: String(DRAWER_LAYER - 1) });
      rects.msglog = { ...r, h: msgs.el.getBoundingClientRect().height, l: DRAWER_LAYER - 1, fixedH: false };
    }

    // The mode's own boxes, in its box.
    this.fillModeBox(box, inBox, rects, blank);

    // The drawers' boxes, one under another.
    for (const s of this.sides) this.fillDrawer(s, all, rects, W);
    this.rects = rects;
    this.showMore(rects, H);
    // The Messages box showing: what came while it wasn't, seen.
    if (this.inbox && this.inboxInSight()) this.inbox.seen();
  }

  // Whether the Messages box shows now: in the window, or in an open
  // drawer on its tab - not in a closed one, nor on another of its tabs.
  inboxInSight() {
    if (!this.doc) return true;
    const w = this.where?.msglog;
    if (!w) return true;
    const s = this.drawers[w.side];
    return !!s?.open && s.tabNow?.id === w.tab;
  }
  // How many messages came in a drawer's tab while it wasn't showing (the
  // Messages box's, if it's in that tab): its tab says so.
  unseenIn(side, tab) {
    const w = this.where?.msglog;
    return this.inbox && w?.side === side && w.tab === tab ? this.inbox.unseen : 0;
  }
  // The drawers' tabs drawn again (a message come, or seen).
  drawTabs() {
    if (!this.doc || !this.lastBoxes) return;
    for (const s of this.sides) s.draw(this.lastBoxes);
  }

  // The mode's box: its back and heading - the mode's name, and its tabs
  // and the buttons that play it (headItems) - where it is.
  drawModeBox(r, list) {
    const el = this.boxEl;
    if (!el) return;
    this.inBoxNow = list;
    Object.assign(el.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` });
    const left = this.drawers.left;
    const m = this.mode();
    const what = this.preview ? `a look at ${modeWord(m)} - the game's on ${modeWord(this.realMode())}` : `only ${possessive(modeWord(m))} - they change with the mode`;
    this.headItems = this.headButtons();
    const actions = this.headItems
      .map((b, i) => `<button type="button" data-mirror="${i}" class="${b.classList.contains("active") || b.classList.contains("on") ? "on" : ""}${b.classList.contains("primary") ? " primary" : ""}"${b.disabled ? " disabled" : ""}${b.title ? ` title="${esc(b.title)}"` : ""}>${esc(b.textContent.replace(/\s+/g, " ").trim())}</button>`)
      .join("");
    const html = `<div class="cc-modebox-head"><b>${esc(this.modeTitle())}</b>${actions ? `<span class="cc-modebox-actions">${actions}</span>` : ""}<i>${esc(what)}</i><span>${left.open ? "" : "Its options: in the drawer on the left"}</span></div>${list.length ? "" : `<p class="muted cc-modebox-empty">Nothing here for ${esc(modeWord(m))} - its boxes are in the drawers, or put away (Arrange ▾)</p>`}`;
    if (el.dataset.html !== html) {
      el.innerHTML = html;
      el.dataset.html = html;
    }
    // (As tall as its tabs and buttons need: two rows of them on a narrow
    // box. Its boxes go below that.)
    this.headH = el.querySelector(".cc-modebox-head")?.offsetHeight ?? 0;
  }

  // Its inside, below its heading as it's drawn.
  modeInside(box = this.boxRect) {
    return box ? modeBoxInside(box, (this.headH ?? 0) + 2) : null;
  }

  // The buttons the mode's box's heading shows, the mode's own (it presses
  // them): its tabs and a round's Start (a section marked data-cc="head")
  // and any button marked data-head - Start round, Start and Pick a game,
  // New game, the putt's aim, Session view - wherever they are, so what
  // plays the mode is never shut away in a closed drawer (the owner, 16
  // October 2026: "Yep let's go with your suggestions"). Only those
  // showing now (not on a tab or in a game that isn't).
  headButtons() {
    const panel = this.panel(this.mode());
    if (!panel) return [];
    const showing = (el) => {
      const off = el.closest("[hidden]");
      return !el.hidden && (!off || (this.preview && off === panel));
    };
    const list = [];
    for (const sec of panel.querySelectorAll('section[data-cc="head"]')) if (showing(sec)) list.push(...[...sec.querySelectorAll("button")].filter(showing));
    for (const b of panel.querySelectorAll("button[data-head]")) if (showing(b) && !list.includes(b)) list.push(b);
    return list;
  }

  // The mode's own boxes inside its box: those moved or sized by hand
  // where they were put (kept as shares of its inside), the rest packed
  // round them into columns as wide as it's room for - each at the text
  // size set for it there - and every one held to its foot, what doesn't
  // fit scrolling inside each box.
  fillModeBox(box, all, rects, blank) {
    if (!all.length) return;
    const inside = this.modeInside(box);
    const foot = inside.y + inside.h;
    // Each as tall as what's in it (or as it was made, or packed: want),
    // no further down than the box's foot.
    const footed = (b, r, z, want = r.h) => {
      const h = Math.min(want, Math.max(MIN_H, foot - r.y));
      if (h < r.h - 0.5) {
        b.el.style.maxHeight = `${h / z}px`;
        if (!scrolls(b.el)) b.el.style.overflow = "hidden";
        return { ...r, h };
      }
      return r;
    };
    const placed = all.filter((b) => this.modeBox.place?.[b.key]);
    for (const b of placed) {
      const p = holdInside(placedIn(this.modeBox, b.key, inside), inside);
      rects[b.id] = { ...footed(b, this.place(b, p), p.z), inMode: true, placed: true };
    }
    const list = all.filter((b) => !placed.includes(b));
    if (!list.length) return;
    const byId = Object.fromEntries(list.map((b) => [b.id, b]));
    const around = { area: inside, obstacles: [blank, ...placed.map((b) => rects[b.id])].filter(Boolean) };
    // Its text as big as fills the box (the owner's screenshots: half of it
    // empty), up to FILL_ZOOMS' largest, each box's own size on top -
    // worked out again only when what's in it or its size changes, not
    // with every shot (it's measured at each size tried).
    const key = `${this.mode()}|${list.map((b) => `${b.id}:${boxZoom(this.modeBox, b.key)}`).join(",")}|${placed.map((b) => b.id + JSON.stringify(this.modeBox.place[b.key])).join(",")}|${Math.round(box.w)}x${Math.round(box.h)}`;
    if (this.fill?.key !== key) {
      let fit = 1;
      for (const z of FILL_ZOOMS) {
        // (And as wide as it's room for: a table wider than its column at
        // that size doesn't fit either.)
        const wide = new Set();
        const tried = packToFit(
          list.map((b) => ({ id: b.id })),
          (id, width) => {
            const el = byId[id].el;
            const h = this.heightAt(el, width, z * boxZoom(this.modeBox, byId[id].key));
            if (el.scrollWidth > el.clientWidth + 2) wide.add(`${id}@${width}`);
            return h;
          },
          around,
        );
        if (tried.fits && !list.some((b) => wide.has(`${b.id}@${tried.width}`))) {
          fit = z;
          break;
        }
      }
      this.fill = { key, z: fit };
    }
    const zOf = (b) => Math.round(this.fill.z * boxZoom(this.modeBox, b.key) * 100) / 100;
    const packed = packToFit(
      list.map((b) => ({ id: b.id, min: MODE_BOX.min })),
      (id, width) => this.heightAt(byId[id].el, width, zOf(byId[id])),
      around,
    );
    for (const b of list) {
      const p = packed.rects[b.id];
      if (!p) continue;
      const z = zOf(b);
      const r = this.place(b, { ...p, h: null, z });
      rects[b.id] = { ...footed(b, r, z, p.shrunk ? p.h : r.h), inMode: true };
    }
  }

  // A drawer's boxes, one under another: the cards first (they want an
  // answer), then the open tab's, the last taking what's left; the other
  // tabs' put by. Each as big as the player has made it there, if they
  // have (its height and text size). Closed, only the cards, out over the
  // boxes beside the right one's tabs.
  fillDrawer(s, all, rects, W) {
    const drawer = s.rect;
    const mine = all.filter((b) => b.where?.side === s.side);
    const inside = { x: drawer.x + 6, y: drawer.y + DRAWER_HEAD, w: drawer.w - 12, h: drawer.h - DRAWER_HEAD - 6 };
    const cardZoom = (w) => Math.min(CARD_ZOOM, w / CARD_WIDTH);
    // The game window's prompts, if they have a box of their own (they're
    // in the Messages box now): out in front. The Messages box stays in its
    // tab, card or not - the tab counts what's come (the owner, 20 October
    // 2026: "Messages pops out of the tab, rather than staying in the tab
    // and a message number coming up").
    const pinned = (b) => b.kind === "messages";
    if (s.open) {
      const tabNow = s.tabNow;
      const cards = mine.filter((b) => b.kind === "messages");
      const msgs = mine.filter((b) => b.kind !== "messages" && pinned(b) && b.where.tab !== tabNow.id);
      const here = mine.filter((b) => b.kind !== "messages" && b.where.tab === tabNow.id);
      for (const b of mine) if (!pinned(b) && b.where.tab !== tabNow.id) b.el.classList.add("arr-off");
      const list = [...cards, ...msgs, ...tabOrder(tabNow, here)];
      // (Shown before they're measured: put by, they measured nothing, and
      // the drawer opened with its boxes one over another.)
      for (const b of list) b.el.classList.remove("arr-off");
      const zOf = (b) => (b.kind === "messages" ? cardZoom(inside.w) : sizeOf(s.data, b.key).z ?? 1);
      const stacked = stackDrawer(
        list.map((b, i) => ({ id: b.id, h: this.heightAt(b.el, inside.w, zOf(b)), grow: i === list.length - 1 && b.kind !== "messages", max: b.kind === "messages" ? null : drawerShare(b, list), size: b.kind === "messages" ? null : sizeOf(s.data, b.key).h })),
        inside,
      );
      for (const b of list) {
        const p = stacked[b.id];
        rects[b.id] = { ...this.place(b, { ...p, h: p.fixedH ? p.h : null, z: zOf(b), l: DRAWER_LAYER }), inDrawer: true, side: s.side };
        if (p.fixedH && b.kind !== "messages" && !scrolls(b.el)) b.el.style.overflow = "hidden";
      }
      return;
    }
    const w = drawerWidth(W) - 12;
    for (const b of mine) {
      if (!pinned(b)) {
        b.el.classList.add("arr-off");
        continue;
      }
      b.el.classList.remove("arr-off");
      const x = s.side === "left" ? DRAWER.tab + 6 : W - DRAWER.tab - w - 6;
      const z = b.kind === "messages" ? cardZoom(w) : 1;
      rects[b.id] = { ...this.place(b, { x, y: inside.y, w, h: null, z, l: DRAWER_LAYER + 1 }), inDrawer: true, side: s.side };
    }
  }

  // Boxes for every mode placed by themselves for the first time: kept
  // there (as shares of the window, as tall as what's in them), so they
  // don't move again until they're moved by hand, tidied up or started
  // again.
  remember(list, rects) {
    if (!list.length) return;
    const { W, H } = this.size;
    const common = { ...(this.saved.common ?? {}) };
    for (const b of list) {
      const r = rects[b.id];
      if (!r || b.kind === "section") continue;
      common[b.id] = { ...toShares({ ...r, h: RESERVE[b.id] ? r.h : null }, W, H, r.z ?? 1), auto: true };
    }
    this.saved = { ...this.saved, common, v: LAYOUT_VERSION };
    saveSetting("arrange", this.saved);
  }

  saveModeBox() {
    saveSetting("ccModeBox", this.modeBox);
  }

  // Puts a box at a rectangle (pixels, h null for as tall as it needs, z
  // its zoom, l which layer: the one moved last is over the others).
  // Returns where it is, with its height.
  place(b, r) {
    const el = b.el;
    const z = r.z ?? 1;
    // Lengths on a zoomed box are zoomed too: given here in its own units.
    Object.assign(el.style, {
      left: `${r.x / z}px`,
      top: `${r.y / z}px`,
      width: `${r.w / z}px`,
      height: r.h == null ? "" : `${r.h / z}px`,
      zoom: z === 1 ? "" : String(z),
    });
    if (b.kind === "messages") Object.assign(el.style, { right: "auto", bottom: "auto", maxHeight: "none" });
    else Object.assign(el.style, { maxHeight: "", overflow: "" });
    el.style.zIndex = r.l ? String(r.l) : "";
    el.dataset.box = b.id;
    const h = r.h ?? el.getBoundingClientRect().height;
    return { x: r.x, y: r.y, w: r.w, h, z, l: r.l ?? 0, fixedH: r.h != null };
  }

  // Where the top bar's halves place themselves (placeBars) in a window W
  // wide round the blank area.
  autoBars(bars, W, blank) {
    const el = (id) => bars.find((b) => b.id === id)?.el;
    return placeBars({
      W,
      blank,
      natural: (id) => (el(id) ? this.naturalWidth(el(id)) : 0),
      heightAt: (id, w) => (el(id) ? this.heightAt(el(id), w, 1) : 0),
    });
  }

  // How wide a half of the top bar is on one row - at its widest, with
  // what some modes hide (the club, who's hitting) showing, so it's placed
  // for every mode and doesn't move with the mode.
  naturalWidth(el) {
    const was = { width: el.style.width, flexWrap: el.style.flexWrap, zoom: el.style.zoom };
    const byMode = [...el.querySelectorAll(BY_MODE)].filter((x) => x.hidden);
    for (const x of byMode) x.style.display = "block";
    Object.assign(el.style, { width: "max-content", flexWrap: "nowrap", zoom: "" });
    const w = el.getBoundingClientRect().width;
    Object.assign(el.style, was);
    for (const x of byMode) x.style.display = "";
    return Math.ceil(w) + 1;
  }

  // How tall a box is at a width (pixels on screen) and zoom.
  heightAt(el, width, z = 1) {
    Object.assign(el.style, { width: `${width / z}px`, height: "", maxHeight: "", zoom: z === 1 ? "" : String(z) });
    return el.getBoundingClientRect().height;
  }

  // ---- Arranging by hand ------------------------------------------------------------------

  // Arrange mode: a frame over each box to drag, size and zoom it, and the
  // mode's box and the blank area to move and size; Done keeps it, Cancel
  // puts it all back.
  edit() {
    if (!this.doc || this.editor) return;
    const doc = this.doc;
    const el = doc.createElement("div");
    el.className = "arrange-editor";
    el.innerHTML = `
      <div class="arrange-frames"></div>
      <div class="arrange-bar">
        <button data-act="small" class="arrange-small"></button>
        <b>Arrange the controls window</b>
        <span class="muted">Drag a box to move it - it lines up with its neighbours - and any edge or corner to size it (double-click the bottom right corner: as tall as it needs); − and + for its text, × to put it away. The top bar, This shot, the Last shot, the messages (with any card from the game window at their top), the cameras and your own boxes are the same for every mode. The mode's box is too - move and size it as one - with the mode's own boxes in it (drag and size them anywhere inside it), and another mode's when you change mode: look at each mode below to check. A mode's options are in the drawer down the left, the keys and shot history in the one down the right; any box goes in either: drag it onto a drawer or one of its tabs, or press its ← drawer or → drawer. Drag one out of a drawer to place it (a mode's box goes back in the mode's box). The drawers come over the boxes: minimise them (A and D, or their tabs again) to lay out the boxes under them. In a drawer, drag a box's foot to make it taller or shorter and the drawer's inner edge to make it wider; + makes another tab.</span>
        <span class="arrange-buttons">
          <button data-act="left" title="The drawer down the left opened over the boxes (to put boxes in it), or minimised to its tabs on the edge (to lay out the boxes under it)"></button>
          <button data-act="drawer" title="The drawer down the right opened over the boxes (to put boxes in it), or minimised to its tabs on the edge (to lay out the boxes under it)"></button>
          <button data-act="tidy" title="Pack everything neatly round the blank area again, keeping each box's text size">Tidy up</button>
          <button data-act="reset" title="Forget this arrangement: laid out by itself again">Start again</button>
          <button data-act="blank">${this.blank?.rect("controls") ? "No blank area" : "Add a blank area"}</button>
          <button data-act="cancel">Cancel (Esc)</button>
          <button data-act="done" class="primary">Done (Enter)</button>
        </span>
        <span class="arrange-modes"></span>
        <span class="arrange-away"></span>
        <span class="arrange-add"></span>
      </div>`;
    doc.body.appendChild(el);
    this.barSmall(!!loadSetting("arrangeBarSmall", false));
    this.editor = {
      el,
      before: JSON.stringify(this.saved),
      drawersBefore: Object.fromEntries(this.sides.map((s) => [s.side, JSON.stringify(s.data)])),
      modeBoxBefore: JSON.stringify(this.modeBox),
      blankBefore: this.blank?.rect("controls") ?? null,
      selected: null,
      drag: null,
    };
    el.addEventListener("pointerdown", (e) => this.pointerDown(e));
    el.addEventListener("pointermove", (e) => this.pointerMove(e));
    el.addEventListener("pointerup", (e) => this.pointerUp(e));
    el.addEventListener("pointercancel", (e) => this.pointerUp(e));
    el.addEventListener("dblclick", (e) => this.doubleClick(e));
    el.querySelector(".arrange-bar").addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (btn?.dataset.preview) return this.setPreview(btn.dataset.preview);
      if (btn?.dataset.show) return this.putAway(btn.dataset.show, false);
      if (btn?.dataset.add) return this.addBox(btn.dataset.add);
      if (btn?.dataset.act) this.act(btn.dataset.act);
    });
    this.drawFrames();
    this.drawPutAway();
    this.drawModes();
    this.drawAdd();
  }

  // ---- Looking at each mode while arranging --------------------------------------------------

  // The arrange bar's modes: each shows how the command centre looks in
  // that mode - its boxes in the mode's box, its options in the left
  // drawer - without the game going there (the owner, 16 October 2026:
  // "when going into arrange allow dummy switching modes to check the
  // layouts match"). The boxes for every mode stay where they are.
  drawModes() {
    const el = this.editor?.el.querySelector(".arrange-modes");
    if (!el) return;
    const real = this.realMode();
    const now = this.mode();
    const list = Object.keys(MODE_TITLES).filter((m) => this.panel(m));
    const buttons = list
      .map((m) => `<button data-preview="${m}" class="${m === now ? "on" : ""}" title="${m === real ? "The mode the game's on" : `How the command centre looks on ${esc(modeWord(m))} - only a look: the game stays on ${esc(modeWord(real))}`}">${esc(MODE_TITLES[m])}${m === real ? " ●" : ""}</button>`)
      .join("");
    const words = this.preview ? `A look at ${modeWord(now)} - the game's still on ${modeWord(real)}. The boxes for every mode stay where they are; only the mode's box and the left drawer change.` : "The boxes for every mode stay where they are in every mode; only the mode's box and the left drawer change.";
    el.innerHTML = `<i>See each mode</i>${buttons}<span class="muted">${esc(words)}</span>`;
  }
  // Looked at (null, or the game's own mode: as it is): its panel shown in
  // the command centre in place of the game's, and laid out.
  setPreview(m) {
    const real = this.realMode();
    this.endPreview();
    this.preview = m && m !== real && this.panel(m) ? m : null;
    if (this.preview) {
      const show = this.panel(this.preview);
      const hide = this.panel(real);
      Object.assign(show.style, { display: "block", columns: "auto" });
      if (hide) hide.style.display = "none";
      this.previewEls = [show, hide].filter(Boolean);
    }
    if (!this.editor) return this.layout();
    this.relayout();
    this.drawPutAway();
    this.drawModes();
  }
  // Back to the game's own mode (leaving arranging).
  endPreview() {
    for (const el of this.previewEls ?? []) Object.assign(el.style, { display: "", columns: "" });
    this.previewEls = [];
    this.preview = null;
  }

  // The bar's boxes to add: a number on its own, all of them, the flight
  // path - one click each, placed in a free spot to be moved from there.
  drawAdd() {
    const el = this.editor?.el.querySelector(".arrange-add");
    const groups = this.palette?.();
    if (!el || !groups?.length) return;
    el.innerHTML = `Add a box: ${groups
      .map((g) => `<span class="arrange-group"><i>${esc(g.group)}</i>${g.items.map((it) => `<button data-add="${esc(it.key)}" title="Add ${esc(it.name)} as a box of its own">+ ${esc(it.name)}</button>`).join("")}</span>`)
      .join("")}`;
  }
  addBox(key) {
    const id = this.add(key);
    if (!id) return this.toast("That's as many boxes of your own as there's room for", 2500);
    this.relayout();
  }
  // Taken out (its ×): gone, and forgotten.
  removeBox(id) {
    const b = this.boxes().find((x) => x.id === id);
    if (!b?.remove) return;
    b.remove();
    const common = { ...(this.saved.common ?? {}) };
    delete common[id];
    this.saved = { ...this.saved, common };
    saveSetting("arrange", this.saved);
    this.relayout();
  }
  // Laid out again while arranging (a box added or taken out): the others
  // stay where they are, a new one goes in a free spot.
  relayout() {
    const ed = this.editor;
    this.editor = null;
    this.layout();
    this.editor = ed;
    this.drawFrames();
  }

  // Everything with a frame: the boxes, the mode's box and the blank area
  // if there is one - the biggest first, so a small box inside a big one
  // (the mode's boxes in the mode's box) is on top of it and can be picked
  // up.
  frameList() {
    // (Not the cards: they're the drawer's.)
    const list = this.boxes()
      .filter((b) => b.kind !== "messages")
      .map((b) => ({ ...b, rect: this.rects[b.id] }));
    if (this.boxRect) list.push({ id: "modebox", kind: "modebox", name: `The mode's box - ${this.modeTitle()}'s boxes in it now`, rect: { ...this.boxRect, z: 1 } });
    const blank = this.blankPx();
    if (blank) list.push({ id: "blank", kind: "blank", name: "Blank area", rect: { ...blank, z: 1 } });
    return list.filter((f) => f.rect).sort((a, b) => b.rect.w * b.rect.h - a.rect.w * a.rect.h);
  }

  drawFrames() {
    const ed = this.editor;
    if (!ed) return;
    const doc = this.doc;
    const scroll = doc.scrollingElement ?? doc.documentElement;
    const tall = Math.max(scroll.scrollHeight, this.size.H);
    ed.el.style.height = `${tall}px`;
    const layer = ed.el.querySelector(".arrange-frames");
    const zoomer = (r) => `<button data-zoom="-1" title="Smaller text (-)">−</button><i>${Math.round((r.z ?? 1) * 100)}%</i><button data-zoom="1" title="Bigger text (+)">+</button>`;
    // Whose each box is: every mode's, or only this mode's (the owner, 16
    // October 2026: "make it clear what each box relates to if it's a
    // specific mode or all").
    const scope = (f) =>
      f.kind === "section"
        ? `<b class="arrange-scope mode">${esc(this.modeTitle())} only</b>`
        : f.kind === "modebox"
          ? `<b class="arrange-scope box">Changes with the mode</b>`
          : f.kind === "blank"
            ? ""
            : `<b class="arrange-scope all">All modes</b>`;
    const scopeClass = (f) => (f.kind === "section" ? " scope-mode" : f.kind === "modebox" || f.kind === "blank" ? "" : " scope-all");
    // (Just the arrows on a narrow frame, so its name and whose it is show.)
    const toDrawers = (r) => {
      const short = r.w < 560;
      return `<button data-to-drawer="left" title="Into the drawer down the left, its open tab (or drag it onto the drawer, or one of its tabs)">${short ? "←" : "← drawer"}</button><button data-to-drawer="right" title="Into the drawer down the right, its open tab (or drag it onto the drawer, or one of its tabs)">${short ? "→" : "→ drawer"}</button>`;
    };
    const frame = (f) => {
      const r = f.rect;
      // In a drawer: the drawer places it, so it's dragged out to go
      // anywhere else - its foot sizes it there, − and + its text.
      if (r.inDrawer) {
        const out = r.side === "left" ? `<button data-from-drawer title="Out of the drawer${f.kind === "section" ? ", into the mode's box" : ", into a free spot in the window"} (or drag it out)">out →</button>` : `<button data-from-drawer title="Out of the drawer${f.kind === "section" ? ", into the mode's box" : ", into a free spot in the window"} (or drag it out)">← out</button>`;
        return `<div class="arrange-frame ${f.kind} in-drawer${scopeClass(f)}${ed.selected === f.id ? " selected" : ""}" data-id="${f.id}" title="In the drawer - drag it out to place it, its foot to make it taller or shorter" style="left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px">
          <span class="arrange-name">${scope(f)}${esc(f.name)}</span><span class="arrange-zoom">${zoomer(r)}${out}</span><span class="arrange-edge s" data-drawer-foot title="Drag to make it taller or shorter (double-click: as tall as it comes)"></span></div>`;
      }
      // In the mode's box: moved and sized anywhere in it (kept there), or
      // dragged onto a drawer, or put away.
      if (r.inMode) {
        const handles = EDGES.map((e) => `<span class="arrange-edge ${e}${e === "se" ? " arrange-corner" : ""}" data-edges="${e}"></span>`).join("");
        return `<div class="arrange-frame section in-mode scope-mode${ed.selected === f.id ? " selected" : ""}" data-id="${f.id}" title="In the mode's box - drag it anywhere in there (or onto a drawer to put it there), its edges to size it" style="left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px">
          <span class="arrange-name">${scope(f)}${esc(f.name)}</span><span class="arrange-zoom">${zoomer(r)}${toDrawers(r)}<button data-hide title="Put this box away (shown again from the bar below)">×</button></span>${handles}</div>`;
      }
      const off =
        f.kind === "section"
          ? `<button data-hide title="Put this box away (shown again from the bar below)">×</button>`
          : f.remove
            ? `<button data-remove-box title="Take this box out (add it again from the bar below)">×</button>`
            : "";
      const back = f.kind !== "bar" && f.kind !== "blank" && f.kind !== "modebox" ? toDrawers(r) : "";
      const zoom = f.kind === "blank" || f.kind === "modebox" ? "" : `<span class="arrange-zoom">${zoomer(r)}${back}${off}</span>`;
      // A handle on every edge and corner; the bottom right corner's
      // double-click makes it as tall as what's in it again.
      const handles = EDGES.map((e) => `<span class="arrange-edge ${e}${e === "se" ? " arrange-corner" : ""}" data-edges="${e}"></span>`).join("");
      return `<div class="arrange-frame ${f.kind}${scopeClass(f)}${ed.selected === f.id ? " selected" : ""}" data-id="${f.id}" style="left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px">
          <span class="arrange-name">${scope(f)}${esc(f.name)}</span>${zoom}${handles}</div>`;
    };
    const frames = this.frameList();
    // The boxes' frames are under an open drawer, as the boxes are: what
    // shows beside it can be picked up, and the rest once it's minimised.
    // The drawers' own, and one being dragged, over them.
    const open = this.sides.filter((s) => s.open && s.rect).map((s) => s.rect);
    const W = this.size.W;
    const clip = open.length ? ` style="clip-path: path(evenodd, '${[`M0 0H${W}V${tall}H0Z`, ...open.map((r) => `M${r.x} ${r.y}h${r.w}v${r.h}h${-r.w}Z`)].join(" ")}')"` : "";
    const boxes = this.boxes().map((b) => ({ ...b, where: this.where?.[b.id] ?? null }));
    layer.innerHTML = `<div class="arrange-under"${clip}>${frames.filter((f) => !f.rect.inDrawer).map(frame).join("")}</div>${this.sides.map((s) => s.targets(boxes)).join("")}<div class="arrange-over">${frames.filter((f) => f.rect.inDrawer).map(frame).join("")}</div>`;
    const word = (s) => `${s.open ? "Minimise" : "Open"} the ${s.side} drawer (${DRAWER_KEYS[s.side]})`;
    for (const s of this.sides) {
      const button = ed.el.querySelector(`[data-act="${s.side === "left" ? "left" : "drawer"}"]`);
      if (button) button.textContent = word(s);
    }
  }

  pointerDown(e) {
    const ed = this.editor;
    if (!ed || e.button !== 0) return;
    const capture = () => {
      try {
        ed.el.setPointerCapture(e.pointerId);
      } catch {
        // Not every pointer can be captured.
      }
    };
    const sideOf = (el) => this.drawers[el.dataset.side === "left" ? "left" : "right"];
    const tab = e.target.closest("[data-arr-tab]");
    if (tab) {
      e.preventDefault();
      sideOf(tab).tabClicked(tab.dataset.arrTab);
      return;
    }
    const add = e.target.closest("[data-arr-tab-add]");
    if (add) {
      e.preventDefault();
      sideOf(add).addTab();
      return;
    }
    const min = e.target.closest("[data-arr-drawer]");
    if (min) {
      e.preventDefault();
      const s = sideOf(min);
      s.set(!s.open);
      return;
    }
    // A drawer's inner edge: dragged to make it wider or narrower on the
    // tab showing (shown as it goes, laid out when it's let go).
    const edge = e.target.closest("[data-arr-drawer-w]");
    if (edge && sideOf(edge).rect) {
      e.preventDefault();
      const s = sideOf(edge);
      ed.drag = { kind: "width", side: s.side, from: [e.pageX, e.pageY], start: { ...s.rect } };
      capture();
      return;
    }
    const frame = e.target.closest(".arrange-frame");
    if (!frame) return;
    const id = frame.dataset.id;
    ed.selected = id;
    // A box in a drawer: out of it (← out), or its foot dragged to make it
    // taller or shorter there.
    if (e.target.closest("[data-from-drawer]")) {
      e.preventDefault();
      this.outOf(id);
      return;
    }
    if (e.target.closest("[data-drawer-foot]") && this.rects[id]?.inDrawer) {
      e.preventDefault();
      ed.drag = { id, kind: "foot", side: this.rects[id].side, from: [e.pageX, e.pageY], start: { ...this.rects[id] } };
      capture();
      return;
    }
    const zoomBtn = e.target.closest("[data-zoom]");
    if (zoomBtn) {
      e.preventDefault();
      this.zoom(id, Number(zoomBtn.dataset.zoom));
      return;
    }
    if (e.target.closest("[data-hide]")) {
      e.preventDefault();
      this.putAway(id, true);
      return;
    }
    if (e.target.closest("[data-remove-box]")) {
      e.preventDefault();
      this.removeBox(id);
      return;
    }
    const to = e.target.closest("[data-to-drawer]");
    if (to) {
      e.preventDefault();
      this.toDrawer([id], to.dataset.toDrawer === "left" ? "left" : "right");
      return;
    }
    const f = this.frameList().find((x) => x.id === id);
    if (!f) return;
    const edges = e.target.closest("[data-edges]")?.dataset.edges ?? null;
    ed.drag = { id, kind: edges ? "size" : "move", edges, from: [e.pageX, e.pageY], start: { ...f.rect } };
    // Picked up: over whatever it's moved onto - and kept there as it's
    // dragged (the drag starts from its rectangle as it was). One taken out
    // of a drawer comes over the boxes it's put among. Its frame comes over
    // the drawers while it's dragged, to be dropped in one. (One in the
    // mode's box stays in it: let go outside it, it's held inside.)
    this.toFront(id);
    if (this.rects[id]?.inDrawer) {
      ed.drag.fromDrawer = this.rects[id].side;
      ed.drag.start.l = 1 + Math.max(0, ...Object.values(this.rects).filter((x) => !x.inDrawer).map((x) => x.l ?? 0));
    } else if (this.rects[id]?.inMode) ed.drag.fromMode = true;
    else if (this.rects[id]) ed.drag.start.l = this.rects[id].l;
    ed.el.querySelector(".arrange-over")?.append(frame);
    capture();
    for (const x of ed.el.querySelectorAll(".arrange-frame")) x.classList.toggle("selected", x.dataset.id === id);
    e.preventDefault();
  }

  pointerMove(e) {
    const d = this.editor?.drag;
    if (!d) return;
    const { W, H } = this.size;
    const s = d.start;
    // The pointer's point on the dragged edge: where the edge was, plus how
    // far the pointer has gone.
    const dx = e.pageX - d.from[0];
    const dy = e.pageY - d.from[1];
    // A drawer's edge, or a box's foot in one: shown where it would be.
    if (d.kind === "width") {
      const left = d.side === "left";
      d.w = Math.max(Math.min(DRAWER.least, W * 0.5), Math.min(s.w + (left ? dx : -dx), W - 2 * DRAWER.tab));
      const el = this.editor.el.querySelector(`.arrange-drawer[data-side="${d.side}"]`);
      if (el) Object.assign(el.style, { left: `${left ? 0 : W - d.w}px`, width: `${d.w}px` });
      return;
    }
    if (d.kind === "foot") {
      const dr = this.drawers[d.side].rect;
      const foot = dr.y + dr.h - 6;
      d.h = Math.max(MIN_H, Math.min(s.h + dy, foot - s.y));
      const el = this.editor.el.querySelector(`.arrange-frame[data-id="${d.id}"]`);
      if (el) el.style.height = `${d.h}px`;
      return;
    }
    let r;
    if (d.kind === "move") r = snapToEdges(moveTo(s, s.x + dx, s.y + dy, W, H), this.neighbours(d.id), { W, H });
    else {
      const px = (d.edges.includes("w") ? s.x : s.x + s.w) + dx;
      const py = (d.edges.includes("n") ? s.y : s.y + s.h) + dy;
      r = snapToEdges(resizeFrom(s, d.edges, px, py, W, H), this.neighbours(d.id), { W, H, edges: d.edges });
    }
    const tall = d.kind === "size" && /[ns]/.test(d.edges) ? true : undefined;
    this.setRect(d.id, r, { fixedH: tall });
    // (Over the drawers too while it's dragged.)
    const moving = this.boxes().find((b) => b.id === d.id)?.el;
    if (moving) moving.style.zIndex = String(DRAWER_LAYER + 5);
    this.frameOnly(d.id);
    // Over a drawer, or one of its tabs, or + tab: lit, to say it goes in
    // there.
    const over = d.kind === "move" && this.canDrawer(d.id) ? this.dropTarget(e) : null;
    for (const el of this.editor.el.querySelectorAll(".arrange-drawer, [data-arr-tab], [data-arr-tab-add]")) {
      const same = !!over && el.dataset.side === over.side;
      const lit = !same ? false : el.hasAttribute("data-arr-tab") ? over.onTab && over.tab === el.dataset.arrTab : el.hasAttribute("data-arr-tab-add") ? !!over.add : !over.onTab;
      el.classList.toggle("drop", lit);
    }
  }

  // Whether a box can go in a drawer: any but the top bar's halves (and
  // the mode's box and the blank area, which aren't boxes).
  canDrawer(id) {
    const b = this.boxes().find((x) => x.id === id);
    return !!b && b.kind !== "bar" && b.kind !== "messages";
  }

  // Where the pointer would drop a box into a drawer: { side, tab, onTab,
  // index } - a tab's label (that tab; add: + tab, a new one), or the
  // drawer itself (the tab showing, among its boxes by height; minimised,
  // the strip its tabs are on) - or null, not over either. By where the
  // pointer is, not the box: a wide box's middle never reached the drawer,
  // and a box can't be dragged past the window's edge.
  dropTarget(e) {
    const x = e.pageX;
    const y = e.pageY;
    for (const el of this.editor?.el.querySelectorAll("[data-arr-tab], [data-arr-tab-add]") ?? []) {
      const b = el.getBoundingClientRect();
      const sx = this.doc.defaultView.scrollX;
      const sy = this.doc.defaultView.scrollY;
      if (!(x >= b.left + sx && x <= b.right + sx && y >= b.top + sy && y <= b.bottom + sy)) continue;
      const side = el.dataset.side === "left" ? "left" : "right";
      if (el.hasAttribute("data-arr-tab-add")) return { side, tab: null, add: true, onTab: true, index: 0 };
      return { side, tab: el.dataset.arrTab, onTab: true, index: Infinity };
    }
    const s = this.sides.find((x2) => x2.holds(x, y));
    if (!s) return null;
    const d = s.data;
    if (!s.open) return { side: s.side, tab: d.tab, onTab: false, index: Infinity };
    const boxes = this.boxes();
    const list = s.tabNow.boxes.map((k) => boxes.find((b) => b.key === k)).filter((b) => b && this.rects[b.id]?.inDrawer && this.rects[b.id].side === s.side);
    const index = list.filter((b) => this.rects[b.id].y + this.rects[b.id].h / 2 < y).length;
    return { side: s.side, tab: d.tab, onTab: false, index };
  }

  pointerUp(e) {
    const ed = this.editor;
    const d = ed?.drag;
    if (!d) return;
    ed.drag = null;
    try {
      ed.el.releasePointerCapture(e.pointerId);
    } catch {
      // Let go already.
    }
    for (const el of ed.el.querySelectorAll(".drop")) el.classList.remove("drop");
    // A drawer's edge let go: that wide on the tab showing. A box's foot
    // in one: that tall there.
    if (d.kind === "width") {
      const s = this.drawers[d.side];
      if (d.w != null) s.save(tabWidth(s.data, s.data.tab, d.w / this.size.W));
      return;
    }
    if (d.kind === "foot") {
      const s = this.drawers[d.side];
      const b = this.boxes().find((x) => x.id === d.id);
      const room = s.rect.h - DRAWER_HEAD - 6;
      if (b && d.h != null && room > 0) s.save(sizeBox(s.data, b.key, { h: d.h / room }));
      return;
    }
    // Dropped on a drawer or one of its tabs (+ tab: a new one): in there
    // (at the place among the tab's boxes it was dropped) - and one dragged
    // out of a drawer is placed where it's let go (a mode's box: in the
    // mode's box), the others in the drawer closing up.
    let into = d.kind === "move" && this.canDrawer(d.id) ? this.dropTarget(e) : null;
    if (into?.add) {
      const s = this.drawers[into.side];
      const made = s.addTab();
      into = made ? { ...into, tab: made } : null;
    }
    if (into) return this.toDrawer([d.id], into.side, into.tab, into.index);
    if (d.id === "modebox") return this.settle("modebox");
    if (d.fromMode) return this.placeInMode(d.id, d.start);
    const moved = this.boxes().find((x) => x.id === d.id)?.el;
    if (moved && this.rects[d.id]) moved.style.zIndex = this.rects[d.id].l ? String(this.rects[d.id].l) : "";
    if (d.fromDrawer) {
      const s = this.drawers[d.fromDrawer];
      const b = this.boxes().find((x) => x.id === d.id);
      if (b) s.keep(takeOut(s.data, b.key));
      if (this.rects[d.id]) this.rects[d.id] = { ...this.rects[d.id], inDrawer: false, l: d.start.l };
    }
    this.settle(d.id);
    if (d.fromDrawer) this.relayout();
  }

  // Every other box's rectangle (and the mode's box's and the blank
  // area's), to line up with.
  // (One in the mode's box: with its inside and the others in it.)
  neighbours(id) {
    if (this.rects[id]?.inMode) {
      const inside = this.modeInside();
      return [inside, ...Object.entries(this.rects).filter(([k, r]) => k !== id && r.inMode).map(([, r]) => r)].filter(Boolean);
    }
    return this.frameList()
      .filter((f) => f.id !== id && f.kind !== "messages" && !f.rect.inMode)
      .map((f) => f.rect);
  }

  // A box in the mode's box let go after it's been moved or sized: kept
  // there, held inside it (as tall as what's in it unless its top or foot
  // was dragged), at the text size it has now - the rest packed round it.
  // from: where it was picked up (only picked up and let go - clicked, to
  // pick it for the keys - it stays as it was).
  placeInMode(id, from = null) {
    const b = this.boxes().find((x) => x.id === id);
    const r = this.rects[id];
    const inside = this.modeInside();
    const moved = !from || !r || ["x", "y", "w", "h"].some((k) => Math.abs((r[k] ?? 0) - (from[k] ?? 0)) >= 1);
    if (b && r && inside && moved) {
      const at = holdInside({ ...r, h: r.fixedH ? r.h : null }, inside);
      this.modeBox = placeInBox(this.modeBox, b.key, at, inside);
      this.saveModeBox();
    }
    this.relayout();
  }

  // A section put away (×) or back again: kept, for this mode.
  putAway(id, away) {
    const mode = this.mode();
    const mine = { ...(this.saved.modes?.[mode] ?? {}) };
    const b = this.boxes().find((x) => x.id === id);
    if (!b || b.kind !== "section") return;
    if (away) {
      mine[id] = { name: b.name, hide: true };
      b.el.classList.add("arr-off");
      delete this.rects[id];
    } else delete mine[id];
    if (!away) b.el.classList.remove("arr-off");
    this.saved = { ...this.saved, modes: { ...(this.saved.modes ?? {}), [mode]: mine } };
    saveSetting("arrange", this.saved);
    this.relayout();
    this.drawFrames();
    this.drawPutAway();
  }

  // The bar's list of boxes put away, each a button to show it again.
  drawPutAway() {
    const ed = this.editor;
    if (!ed) return;
    const mine = this.saved.modes?.[this.mode()] ?? {};
    const away = this.boxes().filter((b) => b.kind === "section" && mine[b.id]?.hide);
    const el = ed.el.querySelector(".arrange-away");
    el.innerHTML = away.length ? `Put away: ${away.map((b) => `<button data-show="${b.id}" title="Show it again">${esc(b.name)}</button>`).join("")}` : "";
  }

  // Double-clicking a corner: the box as tall as what's in it again. The
  // foot of one in a drawer: as tall as it comes there; a drawer's edge:
  // as wide as it comes. (What's under the pointer: the click after a
  // pointer's been held goes to the arranging, not the handle.)
  doubleClick(e) {
    const at = this.doc.elementFromPoint?.(e.clientX, e.clientY) ?? e.target;
    const edge = at.closest?.("[data-arr-drawer-w]");
    if (edge) {
      const s = this.drawers[edge.dataset.side === "left" ? "left" : "right"];
      return s.save(tabWidth(s.data, s.data.tab, null));
    }
    const frame = at.closest?.(".arrange-frame");
    if (frame && at.closest("[data-drawer-foot]")) {
      const b = this.boxes().find((x) => x.id === frame.dataset.id);
      const s = this.drawers[this.rects[frame.dataset.id]?.side ?? "right"];
      if (b) s.save(sizeBox(s.data, b.key, { h: null }));
      return;
    }
    if (!frame || !at.closest(".arrange-corner") || frame.dataset.id === "blank" || frame.dataset.id === "modebox") return;
    const r = this.rects[frame.dataset.id];
    if (!r || r.inDrawer) return;
    if (r.inMode) {
      const b = this.boxes().find((x) => x.id === frame.dataset.id);
      const p = b && this.modeBox.place?.[b.key];
      if (p) {
        this.modeBox = cleanModeBox({ ...this.modeBox, place: { ...this.modeBox.place, [b.key]: { ...p, h: null } } });
        this.saveModeBox();
        this.relayout();
      }
      return;
    }
    this.setRect(frame.dataset.id, { ...r, h: null }, { fixedH: false });
    this.settle(frame.dataset.id);
  }

  // A box's new place and size while arranging (the mode's box's and the
  // blank area's too).
  setRect(id, r, { fixedH } = {}) {
    if (id === "blank") {
      const { W, H } = this.size;
      this.blank.setRect("controls", cleanRect({ x: r.x / W, y: r.y / H, w: r.w / W, h: r.h / H }));
      this.blank.apply(this.doc, "controls");
      return;
    }
    if (id === "modebox") {
      const { W, H } = this.size;
      this.modeBox = { ...this.modeBox, rect: modeBoxShares(r, W, H) };
      this.boxRect = { x: r.x, y: r.y, w: r.w, h: r.h };
      if (this.boxEl) Object.assign(this.boxEl.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` });
      return;
    }
    const b = this.boxes().find((x) => x.id === id);
    if (!b) return;
    const old = this.rects[id] ?? {};
    const keepH = fixedH ?? old.fixedH;
    this.rects[id] = { ...this.place(b, { ...r, h: keepH ? r.h : null, z: r.z ?? old.z ?? 1, l: r.l ?? old.l ?? 0 }), ...(old.inMode ? { inMode: true } : {}) };
  }

  // The box last picked up goes over the others.
  // Numbered 1, 2, 3... each time, the others in the order they were.
  toFront(id) {
    const r = this.rects[id];
    if (!r || id === "blank" || r.inDrawer || r.inMode) return;
    const layers = Object.fromEntries(Object.entries(this.rects).filter(([, x]) => !x.inDrawer && !x.inMode).map(([k, x]) => [k, x.l ?? 0]));
    const next = restack(layers, id);
    for (const [k, x] of Object.entries(this.rects)) {
      if (x.inDrawer || x.inMode || (next[k] ?? 0) === (x.l ?? 0)) continue;
      if (k === id) this.setRect(k, { ...x, l: next[k] });
      else {
        x.l = next[k] ?? 0;
        const el = this.boxes().find((b) => b.id === k)?.el;
        if (el) el.style.zIndex = x.l ? String(x.l) : "";
      }
    }
  }

  zoom(id, dir) {
    if (id === "blank" || id === "modebox") return;
    const r = this.rects[id];
    if (!r) return;
    const b = this.boxes().find((x) => x.id === id);
    // In a drawer: kept by the drawer (nothing comes out of it by being
    // made bigger); in the mode's box, by the mode's box.
    if (r.inDrawer) {
      const s = this.drawers[r.side ?? "right"];
      if (b) s.save(sizeBox(s.data, b.key, { z: stepZoom(r.z ?? 1, dir) }));
      return;
    }
    if (r.inMode) {
      if (b) {
        // (Placed by hand: its text size there. Packed: its own size, under
        // the size that fills the box.)
        const p = this.modeBox.place?.[b.key];
        if (p) this.modeBox = cleanModeBox({ ...this.modeBox, place: { ...this.modeBox.place, [b.key]: { ...p, z: stepZoom(p.z ?? 1, dir) } } });
        else this.modeBox = zoomBox(this.modeBox, b.key, stepZoom(boxZoom(this.modeBox, b.key), dir));
        this.saveModeBox();
        this.relayout();
      }
      return;
    }
    this.setRect(id, { ...r, z: stepZoom(r.z ?? 1, dir) });
    this.settle(id);
  }

  // After a change: off the blank area if it's on it, every box pushed off
  // a blank area that's been moved onto it, and the whole arrangement kept.
  // The mode's box moved or sized: its boxes laid out in it again.
  settle(id) {
    const { W, H } = this.size;
    const blank = this.blankPx();
    const moved = id === "blank" || id === "modebox" ? [] : [id];
    if (id === "blank") this.forgetAutoBars();
    if (blank && id !== "modebox") {
      const ids = id === "blank" ? Object.keys(this.rects) : [id];
      for (const k of ids) {
        const r = this.rects[k];
        if (!r || k === "messages" || r.inDrawer || r.inMode || (id === "blank" && k.startsWith("bar-"))) continue;
        const out = pushOut(r, blank, W, H);
        if (out !== r) {
          this.setRect(k, out);
          if (!moved.includes(k)) moved.push(k);
        }
      }
    }
    this.keep(moved);
    if (id === "modebox" || id === "blank") this.relayout();
    else this.drawFrames();
  }

  // The top bar's halves where they placed themselves: forgotten, to place
  // themselves again round a blank area that's come, gone or moved (never
  // those placed by hand).
  forgetAutoBars() {
    const common = { ...(this.saved.common ?? {}) };
    for (const id of ["bar-main", "bar-tools"]) if (common[id]?.auto) delete common[id];
    this.saved = { ...this.saved, common };
    saveSetting("arrange", this.saved);
  }

  // Keeps where every box is now: the top bar and the boxes for every mode
  // (the mode's own are in its box or a drawer: only which are put away is
  // kept for them), and the mode's box.
  // ids: only these boxes, moved, sized or zoomed by hand - the rest stay
  // packed by themselves (kept, every box stayed where it happened to be
  // when Done was pressed, and a box added later went below the window),
  // though one kept already keeps its layer. Every box (Tidy up) without.
  keep(ids = null, { auto = false } = {}) {
    const { W, H } = this.size;
    const mode = this.mode();
    const common = { ...(this.saved.common ?? {}) };
    for (const b of this.boxes()) {
      const r = this.rects[b.id];
      if (!r || b.kind === "messages" || b.kind === "section") continue;
      // In a drawer: its place is the drawer's.
      if (r.inDrawer) {
        delete common[b.id];
        continue;
      }
      if (ids && !ids.includes(b.id)) {
        if (!common[b.id]) continue;
        const { l, ...rest } = common[b.id];
        common[b.id] = { ...rest, ...(r.l ? { l: r.l } : {}) };
        continue;
      }
      common[b.id] = { ...toShares({ ...r, h: r.fixedH ? r.h : null }, W, H, r.z ?? 1), ...(r.l ? { l: r.l } : {}), ...(auto ? { auto: true } : {}) };
    }
    this.saved = { ...this.saved, common, modes: { ...(this.saved.modes ?? {}), [mode]: putAwayOnly(this.saved.modes?.[mode]) } };
    saveSetting("arrange", this.saved);
    this.saveModeBox();
  }

  // Redraws one frame while it's dragged.
  frameOnly(id) {
    const frame = this.editor?.el.querySelector(`.arrange-frame[data-id="${id}"]`);
    const f = this.frameList().find((x) => x.id === id);
    if (!frame || !f) return;
    Object.assign(frame.style, { left: `${f.rect.x}px`, top: `${f.rect.y}px`, width: `${f.rect.w}px`, height: `${f.rect.h}px` });
  }

  act(what) {
    const ed = this.editor;
    if (!ed) return;
    if (what === "done") return this.close(true);
    if (what === "cancel") {
      this.saved = JSON.parse(ed.before);
      saveSetting("arrange", this.saved);
      for (const s of this.sides) s.keep(cleanDrawer(JSON.parse(ed.drawersBefore[s.side])));
      this.modeBox = cleanModeBox(JSON.parse(ed.modeBoxBefore));
      this.saveModeBox();
      this.blank?.setRect("controls", ed.blankBefore);
      this.blank?.apply(this.doc, "controls");
      return this.close(false);
    }
    if (what === "small") return this.barSmall(!ed.el.classList.contains("bar-small"), true);
    if (what === "drawer") this.drawers.right.set(!this.drawers.right.open);
    else if (what === "left") this.drawers.left.set(!this.drawers.left.open);
    else if (what === "tidy") this.tidy();
    else if (what === "reset") this.reset();
    else if (what === "blank") {
      if (this.blank?.rect("controls")) {
        this.blank.setRect("controls", null);
        this.blank.apply(this.doc, "controls");
        this.forgetAutoBars();
        this.relayout();
      } else {
        // A box in the top middle, where a webcam hangs, to move and size.
        this.blank?.setRect("controls", cleanRect({ x: 0.43, y: 0, w: 0.14, h: 0.14 }));
        this.settle("blank");
      }
      this.blank?.apply(this.doc, "controls");
      ed.el.querySelector('[data-act="blank"]').textContent = this.blank?.rect("controls") ? "No blank area" : "Add a blank area";
    }
    this.drawFrames();
    this.drawPutAway();
  }

  // The Arrange bar minimised to a strip at the foot - Show the panel,
  // Cancel and Done - so it isn't over the boxes being laid out (the owner,
  // 20 October 2026: "need to be able to minimise the big panel with all
  // the options on it. It gets on the way of rearranging the screens"), or
  // shown in full again. Kept for the next time (the arrangeBarSmall
  // setting). keep: said by the player now, so kept.
  barSmall(small, keep = false) {
    const el = this.editor?.el ?? this.doc?.querySelector(".arrange-editor");
    if (!el) return;
    el.classList.toggle("bar-small", small);
    const btn = el.querySelector('[data-act="small"]');
    if (btn) {
      btn.textContent = small ? "▴ Show the panel (H)" : "▾ Minimise (H)";
      btn.title = small ? "The whole Arrange panel again: its help, Tidy up, the modes to look at and the boxes to add" : "Shrink this panel to a strip at the foot, out of the way of the boxes (Cancel and Done stay)";
    }
    if (keep) saveSetting("arrangeBarSmall", small);
  }

  // Tidy up: everything packed neatly again - the mode's box placed by
  // itself again too - each box's text size kept. Boxes not showing (a
  // camera that's off) forget where they were too, and
  // are packed afresh when they show: kept where they were, they'd come
  // back over whatever's been tidied into their place since.
  tidy() {
    const showing = new Set(this.boxes().map((b) => b.id));
    const only = (kept) => Object.fromEntries(Object.entries(kept ?? {}).filter(([id]) => showing.has(id)));
    this.saved = { ...this.saved, common: only(this.saved.common) };
    // (The mode's boxes moved in its box by hand packed again too.)
    this.modeBox = forgetPlaces(this.modeBox, this.mode());
    this.layout({ repack: true });
    // (Packed by themselves, as a box placed by itself is: packed again
    // with them if there's ever no room for a newcomer.)
    this.keep(null, { auto: true });
  }

  // Start again: the arrangement forgotten - the boxes for every mode, the
  // mode's box and what's put away in this mode - and laid out by itself.
  reset() {
    const modes = { ...(this.saved.modes ?? {}) };
    delete modes[this.mode()];
    this.saved = { common: {}, modes };
    saveSetting("arrange", this.saved);
    this.modeBox = { ...forgetPlaces(this.modeBox, this.mode()), rect: null };
    this.relayout();
    this.saveModeBox();
  }

  // ---- Into the drawers and out -----------------------------------------------------------------

  // The boxes that start in a drawer (the keys, the shot history, a mode's
  // options) out of it now - placed by hand, taken out or put in the other
  // drawer - and showing.
  outOfDrawer() {
    return this.boxes().filter((b) => b.kind !== "messages" && homeSide(b) && this.rects[b.id] && this.where?.[b.id]?.side !== homeSide(b));
  }

  // Into a drawer (a box's → drawer or ← drawer, one dropped on a drawer or
  // on one of its tabs, or the Arrange menu's): where they were put
  // forgotten, each in the tab (the one showing, if none's said) at `index`
  // among its boxes - and the drawer opened at that tab, to see them go in.
  // ids: those boxes; none, every box that starts in a drawer back in it
  // (side then: each its own).
  toDrawer(ids = null, side = "right", tab = null, index = Infinity) {
    const common = { ...(this.saved.common ?? {}) };
    let data = { right: this.drawers.right.data, left: this.drawers.left.data };
    const list = ids ? this.boxes().filter((b) => ids.includes(b.id) && b.kind !== "bar" && b.kind !== "messages") : this.outOfDrawer();
    const opened = new Set();
    list.forEach((b, i) => {
      const to = ids ? side : homeSide(b);
      if (b.kind !== "section") delete common[b.id];
      // (One moved in the mode's box by hand: packed with the rest when it
      // comes out again.)
      else if (this.modeBox.place?.[b.key]) this.modeBox = placeInBox(this.modeBox, b.key, null);
      data = moveInto(data, b.key, to, tab ?? data[to].tab, index + i, homeSide(b));
      data = { ...data, [to]: showTab(data[to], tab ?? data[to].tab) };
      opened.add(to);
    });
    this.saved = { ...this.saved, common };
    saveSetting("arrange", this.saved);
    this.saveModeBox();
    for (const s of this.sides) {
      let d = data[s.side];
      // (Opened to see them go in - but while arranging it's left
      // minimised if it is, to go on laying out the boxes under it.)
      if (opened.has(s.side) && !this.editor && !s.open) d = { ...d, open: true };
      s.keep(d);
    }
    this.drawerChanged();
    for (const to of opened) {
      const s = this.drawers[to];
      if (this.editor && !s.open) this.toast(`In the drawer - click its tab on the ${to} (or ${DRAWER_KEYS[to]}) to open it`, 2500);
    }
  }

  // Out of its drawer (← out, or the Arrange menu's): a mode's box into the
  // mode's box, any other into a free spot, to be moved from there.
  outOf(id) {
    const b = this.boxes().find((x) => x.id === id);
    const side = this.where?.[id]?.side;
    if (!b || !side) return;
    const s = this.drawers[side];
    s.save(takeOut(s.data, b.key));
  }

  // ---- The Arrange menu ---------------------------------------------------------------------

  // The top bar's Arrange ▾: every box by name - ticked if it's showing,
  // to put away or show again; its name clicked to find it (brought to the
  // front, lit for a moment) - the drawers, Tidy up, Start again, and
  // arranging by hand. A second click (or Esc, or a click elsewhere)
  // closes it.
  menu(button) {
    if (!this.doc) return;
    if (this.menuEl) return this.closeMenu();
    const doc = this.doc;
    const el = doc.createElement("div");
    el.className = "arrange-menu";
    this.menuEl = el;
    this.fillMenu();
    doc.body.appendChild(el);
    const at = button?.getBoundingClientRect();
    const { W } = this.size;
    if (at) Object.assign(el.style, { top: `${at.bottom + 4}px`, left: `${Math.max(4, Math.min(at.left, W - el.offsetWidth - 4))}px` });
    el.addEventListener("click", (e) => this.menuClick(e));
    el.addEventListener("change", (e) => this.menuClick(e));
    this.menuAway = (e) => {
      if (!el.contains(e.target) && !button?.contains(e.target)) this.closeMenu();
    };
    doc.addEventListener("pointerdown", this.menuAway, true);
  }
  closeMenu() {
    this.doc?.removeEventListener("pointerdown", this.menuAway, true);
    this.menuEl?.remove();
    this.menuEl = null;
  }
  fillMenu() {
    const el = this.menuEl;
    if (!el) return;
    const mine = this.saved.modes?.[this.mode()] ?? {};
    const outOfDrawer = this.outOfDrawer();
    const all = this.boxes().map((b) => ({ ...b, where: this.where?.[b.id] ?? null }));
    const tabName = (s, id) => s.title(s.data.tabs.find((t) => t.id === id) ?? s.data.tabs[0], all);
    const row = (b) => {
        const away = b.kind === "section" && mine[b.id]?.hide;
        const can = b.kind === "section" || b.remove;
        const tick = `<input type="checkbox" data-box-show="${esc(b.id)}"${away ? "" : " checked"}${can ? "" : " disabled"} title="${can ? (away ? "Show this box again" : "Put this box away") : "Shown while it's in use"}">`;
        const w = !away && b.where && b.where.tab !== "cards" ? b.where : null;
        const s = w ? this.drawers[w.side] : null;
        const move = away
          ? ""
          : w
            ? `<button type="button" data-box-out="${esc(b.id)}" title="Out of the drawer, into ${b.kind === "section" ? "the mode's box" : "the window"}">${w.side === "left" ? "out →" : "← out"}</button>`
            : `<button type="button" data-box-drawer="${esc(b.id)}" data-side="left" title="Into the drawer down the left: ${esc(tabName(this.drawers.left, this.drawers.left.data.tab))}">← drawer</button><button type="button" data-box-drawer="${esc(b.id)}" data-side="right" title="Into the drawer down the right: ${esc(tabName(this.drawers.right, this.drawers.right.data.tab))}">→ drawer</button>`;
        const where = w ? ` <small>(in the ${w.side} drawer${s.data.tabs.length > 1 ? `: ${esc(tabName(s, w.tab))}` : ""})</small>` : b.kind === "section" && !away ? ` <small>(in the mode's box)</small>` : "";
        return `<li>${tick}<button type="button" class="link" data-box-find="${esc(b.id)}" title="${away ? "Put away - tick it to show it again" : "Find it: brought to the front and lit for a moment"}">${esc(b.name)}</button>${where}${move}</li>`;
    };
    // Whose each box is: every mode's, then only this mode's.
    const listed = all.filter((b) => b.kind !== "bar" && b.kind !== "messages");
    // (And the boxes taken out with their ×, unticked: ticked, back.)
    const out = (this.takenOut?.() ?? []).map((b) => `<li class="arrange-menu-out"><input type="checkbox" data-box-back="${esc(b.id)}" title="Bring it back"><span>${esc(b.name)}</span> <small>(taken out - tick to bring it back)</small></li>`).join("");
    const every = listed.filter((b) => b.kind !== "section").map(row).join("");
    const only = listed.filter((b) => b.kind === "section").map(row).join("");
    const tabsOf = (s) => s.data.tabs.map((t) => `<button type="button" data-menu-tab="${esc(t.id)}" data-side="${s.side}" class="${s.open && t.id === s.data.tab ? "on" : ""}" title="Show this tab of the drawer">${esc(tabName(s, t.id))}</button>`).join("");
    const drawerRow = (s) => `<div class="arrange-menu-row arrange-menu-tabs"><button type="button" data-menu="drawer" data-side="${s.side}">${s.open ? "Close" : "Open"} the ${s.side} drawer</button>${tabsOf(s)}${s.data.tabs.length < 6 ? `<button type="button" data-menu="tab-add" data-side="${s.side}" title="A new tab in the drawer">+ tab</button>` : ""}</div>`;
    el.innerHTML = `
      <button type="button" data-menu="edit" class="primary">Move and size the boxes… (Shift + B)</button>
      ${drawerRow(this.drawers.left)}
      ${drawerRow(this.drawers.right)}
      ${outOfDrawer.length ? `<button type="button" data-menu="to-drawer" title="Put every box that starts in a drawer back in it">${esc(listWords(outOfDrawer.map((b) => this.boxWord(b))))} back in the drawers</button>` : ""}
      <div class="arrange-menu-row"><button type="button" data-menu="tidy" title="Pack every box neatly again, keeping its text size">Tidy up</button><button type="button" data-menu="reset" title="Forget this arrangement: laid out by itself again">Start again</button></div>
      <p class="arrange-menu-scope"><b class="arrange-scope all">All modes</b> the same boxes in the same places whatever you're playing - untick one to put it away:</p>
      <ul>${every}${out}</ul>
      <p class="arrange-menu-scope"><b class="arrange-scope mode">${esc(this.modeTitle())} only</b> ${esc(possessive(modeWord(this.mode())))} own, in the mode's box or a drawer - another mode has its own there:</p>
      <ul>${only}</ul>`;
  }
  menuClick(e) {
    const t = e.target;
    if (e.type === "change" && t.matches?.("[data-box-back]") && t.checked) {
      this.takenOut?.().find((b) => b.id === t.dataset.boxBack)?.restore();
      this.relayout();
      return this.fillMenu();
    }
    if (e.type === "change" && t.matches?.("[data-box-show]")) {
      const id = t.dataset.boxShow;
      const b = this.boxes().find((x) => x.id === id);
      if (b?.kind === "section") this.putAway(id, !t.checked);
      else if (b?.remove && !t.checked) this.removeBox(id);
      return this.fillMenu();
    }
    if (e.type !== "click") return;
    const sideOf = (x) => this.drawers[x.dataset.side === "left" ? "left" : "right"];
    const find = t.closest?.("[data-box-find]");
    if (find) return this.find(find.dataset.boxFind);
    const back = t.closest?.("[data-box-drawer]");
    if (back) {
      this.toDrawer([back.dataset.boxDrawer], sideOf(back).side);
      return this.fillMenu();
    }
    const out = t.closest?.("[data-box-out]");
    if (out) {
      this.outOf(out.dataset.boxOut);
      return this.fillMenu();
    }
    const tab = t.closest?.("[data-menu-tab]");
    if (tab) {
      sideOf(tab).set(true, tab.dataset.menuTab);
      return this.fillMenu();
    }
    const btn = t.closest?.("[data-menu]");
    const act = btn?.dataset.menu;
    if (!act) return;
    if (act === "edit") {
      this.closeMenu();
      return this.edit();
    }
    if (act === "drawer") sideOf(btn).set(!sideOf(btn).open);
    else if (act === "tab-add") sideOf(btn).addTab({ open: true });
    else if (act === "to-drawer") this.toDrawer();
    else if (act === "tidy") this.tidy();
    else if (act === "reset") this.reset();
    this.fillMenu();
  }

  // A box found from the menu: over the others, in sight, lit a moment.
  find(id) {
    const b = this.boxes().find((x) => x.id === id);
    if (!b || !this.rects[id]) return;
    this.toFront(id);
    this.keep([]);
    b.el.scrollIntoView?.({ block: "nearest" });
    b.el.classList.remove("arr-flash");
    void b.el.offsetWidth;
    b.el.classList.add("arr-flash");
    setTimeout(() => b.el.classList.remove("arr-flash"), 1600);
  }

  // While arranging, every key is its own (true): Enter keeps it, Esc
  // puts it back, A and D the drawers, the arrows move the box last
  // touched (Shift: size it), - and + its text; the rest nothing.
  key(e) {
    const ed = this.editor;
    if (!ed) return false;
    e.preventDefault?.();
    const k = arrangeKey(e);
    if (!k) return true;
    if (k.act === "done" || k.act === "cancel" || k.act === "drawer" || k.act === "left" || k.act === "small") {
      this.act(k.act);
      return true;
    }
    const id = ed.selected;
    const r = id === "blank" ? { ...this.blankPx(), z: 1 } : id === "modebox" ? (this.boxRect ? { ...this.boxRect, z: 1 } : null) : this.rects[id];
    if (!id || !r || r.inDrawer) return true;
    if (k.act === "zoom") return this.zoom(id, k.dir), true;
    const { W, H } = this.size;
    const next = k.act === "move" ? moveTo(r, r.x + k.dx, r.y + k.dy, W, H) : sizeTo(r, r.x + r.w + k.dx, r.y + r.h + k.dy, W);
    this.setRect(id, next, { fixedH: k.act === "size" ? true : undefined });
    // (One in the mode's box: kept there, inside it.)
    if (r.inMode) this.placeInMode(id);
    else this.settle(id);
    return true;
  }

  // Leaves arrange mode. kept: say so.
  close(kept) {
    const ed = this.editor;
    if (!ed) return;
    this.editor = null;
    ed.el.remove();
    this.endPreview();
    this.layout();
    if (kept) this.toast("Arranged - Shift + B to change it", 2500);
  }
}

// The handles a frame has: every edge and corner.
const EDGES = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];

// A mode's kept boxes: only which are put away (where they were placed by
// hand, before the mode's box, is forgotten).
const putAwayOnly = (m) => Object.fromEntries(Object.entries(m ?? {}).filter(([, s]) => s?.hide).map(([id, s]) => [id, { name: s.name, hide: true }]));

// Whether a box scrolls what doesn't fit in it (This shot, the sections), so it can be held shorter than what's in
// it; a camera's picture is cut off instead, so it never is.
const scrolls = (el) => /auto|scroll/.test(el.ownerDocument.defaultView?.getComputedStyle(el).overflowY ?? "");

// Which layer a kept box is on (0: as the page has it).
const layerOf = (s) => (Number.isInteger(s?.l) && s.l > 0 ? Math.min(s.l, 999) : 0);

// A section's name for its frame and the Arrange menu: its heading, or
// what it holds.
function sectionName(el, i) {
  const h = el.querySelector("h3");
  if (h) return (h.childNodes[0]?.textContent ?? h.textContent).trim() || `Box ${i + 1}`;
  for (const [sel, name] of SECTION_NAMES) if (el.matches(sel) || (sel.startsWith(":has") && el.querySelector(sel.slice(5, -1)))) return name;
  return `Box ${i + 1}`;
}
// What a section with no heading is, by what it is or holds.
const SECTION_NAMES = [
  [".tabs", "Tabs"],
  [".numbers", "Last shot's numbers"],
  [".putt-result", "Result"],
  [".target-result", "Target"],
  [".lie-guide", "Lie"],
  [".odd-shot", "Odd shot"],
  [".line-read", "Reading the line"],
  [".round-buttons", "Round"],
  ["#game-round", "Round"],
  ["#chip-round", "Round"],
  [":has(#ch-rules)", "The game"],
  [":has(#ch-sounds)", "Sounds"],
  [":has(.describe)", "What the shot did"],
  [":has(.guide)", "Guide"],
  [":has(canvas)", "Map"],
];
// The names worth showing over a box that has no heading: not the tabs,
// the round's button or the result, which say what they are.
const CAPTIONED = /^(Last shot's numbers|Carry match|Target|Lie|Odd shot|Reading the line|What the shot did|Guide|Map)$/;

// Whether a section has nothing in it to show: no words, and nothing to
// click, type in or look at.
function isEmpty(el) {
  if (el.textContent.trim()) return false;
  return !el.querySelector("button, input, select, textarea, canvas, img, svg, video");
}

const MODE_WORDS = { range: "the driving range", putting: "putting", chipping: "chipping", course: "the course", challenges: "the challenges" };
const modeWord = (m) => MODE_WORDS[m] ?? m;
// "the course's", "the challenges'".
const possessive = (w) => (w.endsWith("s") ? `${w}'` : `${w}'s`);
// The mode's box's heading.
const MODE_TITLES = { range: "Driving range", putting: "Putting", chipping: "Chipping", course: "Course", challenges: "Challenges" };
