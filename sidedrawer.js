// One of the command centre's two side drawers (arrange.js lays out the
// boxes in them): down the right, the keys, the shot history and whatever
// else the player puts there; down the left, the mode's own options (the owner, 16 October 2026: "Can we have some
// left-hand side tabs for mode-specific options? So you've got your keys,
// your general options on the right-hand side ... Then you've got
// mode-specific options on the left-hand side, and a tab there that can
// feed in from the left"). Each opens over the boxes from its own edge, or
// is closed to its tabs there, with tabs, widths and box sizes of its own
// (sim/ccdrawer.mjs), kept as its own setting. This is the drawer itself:
// its back and heading, its tabs on the edge, and its part while arranging.

import { drawerWidth, DRAWER } from "./sim/arrange.mjs";
import { cleanDrawer, addTab, renameTab, removeTab, showTab, tabWords, tabOrder } from "./sim/ccdrawer.mjs";
import { loadSetting, saveSetting, esc } from "./util.js";

export class SideDrawer {
  // layout: the ControlsLayout (its drawerChanged(), boxWord(b) and
  // toast()). side: "right" or "left".
  constructor(layout, side) {
    this.layout = layout;
    this.side = side;
    this.setting = side === "left" ? "ccDrawerLeft" : "ccDrawer";
    this.data = cleanDrawer(loadSetting(this.setting, null));
    this.el = null;
    this.rect = null;
    this.strip = null;
  }

  get left() {
    return this.side === "left";
  }
  // Open over the boxes, or closed to its tabs on the edge, as it was left
  // (closed to begin with: it opens over the boxes, so nothing moves).
  get open() {
    return this.data.open === true;
  }
  get tabNow() {
    return this.data.tabs.find((t) => t.id === this.data.tab) ?? this.data.tabs[0];
  }
  // Its arrows: into the window (open it) and back to its edge (close it).
  get inArrow() {
    return this.left ? "⟩" : "⟨";
  }
  get outArrow() {
    return this.left ? "⟨" : "⟩";
  }
  // "the drawer down the left".
  get name() {
    return `the drawer down the ${this.side}`;
  }

  attach(doc) {
    this.detach();
    this.el = doc.createElement("div");
    this.el.className = `cc-drawer ${this.side}`;
    this.el.addEventListener("click", (e) => this.click(e));
    doc.body.append(this.el);
  }
  detach() {
    this.el?.remove();
    this.el = null;
  }

  // Opened (at a tab) or closed: kept.
  set(open, tab = null) {
    let d = { ...this.data, open: !!open };
    if (tab) d = showTab(d, tab);
    this.save(d);
  }
  // One of its tabs clicked: closed, opened at it; the one showing, closed
  // again ("just click on them and click off it"); another, shown.
  tabClicked(id) {
    if (!this.open) return this.set(true, id);
    if (id === this.data.tab) return this.set(false);
    this.save(showTab(this.data, id));
  }
  // Its tabs and boxes changed: kept, and laid out again.
  save(d) {
    this.keep(d);
    this.layout.drawerChanged();
  }
  // Kept, without laying out again.
  keep(d) {
    this.data = d;
    saveSetting(this.setting, d);
  }
  // A new tab, shown: its id, or null if there are as many as can be.
  addTab({ open = null } = {}) {
    const made = addTab(this.data);
    if (made.id) this.save(open == null ? made.drawer : { ...made.drawer, open });
    return made.id;
  }

  // Where it is on a window W x H: down its edge from below the top bar
  // (where the bar reaches over it) to the foot of the window - its strip
  // of tabs when it's closed, as wide as the window says (or the player
  // made it on the tab showing) when it's open.
  measure(W, H, barRects) {
    const at = (w) => (this.left ? 0 : W - w);
    const below = (w) => Math.min(H * 0.5, Math.max(0, ...barRects.filter((r) => (this.left ? r.x < w : r.x + r.w > W - w)).map((r) => r.y + r.h)));
    const top = below(drawerWidth(W));
    this.strip = { x: at(DRAWER.tab), y: top, w: DRAWER.tab, h: H - top };
    const wide = drawerWidth(W, true, this.tabNow.w);
    this.rect = this.open ? { x: at(wide), y: below(wide), w: wide, h: H - below(wide) } : this.strip;
    return this.rect;
  }

  // A tab's name, from the boxes in it showing now (boxes: arrange.js's,
  // each with where it is): its own, or the mode's options ("Course
  // options") when that's all it holds, or what's in it.
  title(tab, boxes) {
    const mine = this.inTab(tab, boxes);
    if (!tab.name && mine.length && mine.every((b) => b.kind === "section" && b.drawer === "options")) return `${this.layout.modeTitle()} options`;
    return tabWords(tab, this.names(tab, mine));
  }
  // Everything in it, for its tip ("Course · Season · Options").
  contents(tab, boxes) {
    return this.names(tab, this.inTab(tab, boxes)).join(" · ") || "Empty tab";
  }
  inTab(tab, boxes) {
    return boxes.filter((b) => b.kind !== "messages" && b.where?.side === this.side && b.where.tab === tab.id);
  }
  names(tab, mine) {
    return tabOrder(tab, mine).map((b) => this.layout.boxWord(b));
  }

  // Its back and heading - its tabs, + for a new one, the open one's ✎
  // and ×, and its button - or, closed, a tab on the edge for each of its
  // tabs.
  draw(boxes) {
    const el = this.el;
    const r = this.rect;
    if (!el || !r) return;
    Object.assign(el.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: this.open ? `${r.h}px` : "" });
    el.classList.toggle("open", this.open);
    const d = this.data;
    const titles = d.tabs.map((t) => this.title(t, boxes));
    const tips = d.tabs.map((t) => this.contents(t, boxes));
    // How many messages have come in a tab while it wasn't showing (the
    // Messages box's): a number on it.
    const badges = d.tabs.map((t) => {
      const n = this.layout.unseenIn?.(this.side, t.id) ?? 0;
      return n ? ` <b class="cc-badge" title="${n} new ${n === 1 ? "message" : "messages"}">${n > 9 ? "9+" : n}</b>` : "";
    });
    const many = d.tabs.length > 1;
    let html;
    if (this.open) {
      const tabs = d.tabs
        .map((t, i) => {
          const on = t.id === d.tab;
          const tools = on ? `<span class="cc-tab-tools"><button type="button" data-tab-rename="${esc(t.id)}" title="Name this tab">✎</button>${many ? `<button type="button" data-tab-remove="${esc(t.id)}" title="Take this tab away (its boxes go to the first tab)">×</button>` : ""}</span>` : "";
          return `<span class="cc-tab${on ? " on" : ""}" data-tab-at="${esc(t.id)}"><button type="button" data-tab="${esc(t.id)}" title="${esc(tips[i])}${on ? " - click again to close the drawer" : ""}">${esc(titles[i])}${badges[i]}</button>${tools}</span>`;
        })
        .join("");
      const add = d.tabs.length < 6 ? `<button type="button" class="cc-tab-add" data-tab-add title="A new tab: drag boxes onto it while arranging, or send them there from Arrange ▾">+</button>` : "";
      html = `<div class="cc-drawer-head"><div class="cc-tabs">${tabs}${add}</div><button type="button" data-drawer title="Close the drawer: the boxes under it show again${this.left ? "" : " (a number on a tab says when messages come in it)"}">${this.outArrow}</button></div>`;
    } else {
      html = d.tabs.map((t, i) => `<button type="button" class="cc-drawer-tab" data-open-tab="${esc(t.id)}" title="Open the drawer over the boxes: ${esc(tips[i])}"><span>${this.left ? `${esc(titles[i])}${badges[i]} ${this.inArrow}` : `${this.inArrow} ${esc(titles[i])}${badges[i]}`}</span></button>`).join("");
    }
    if (el.dataset.html !== html) {
      el.innerHTML = html;
      el.dataset.html = html;
    }
  }

  // Its heading clicked: a tab shown, a new one, one named or taken away,
  // the drawer opened at a tab or closed.
  click(e) {
    const t = e.target;
    const at = t.closest("[data-open-tab]");
    if (at) return this.set(true, at.dataset.openTab);
    const tab = t.closest("[data-tab]");
    if (tab) return this.tabClicked(tab.dataset.tab);
    if (t.closest("[data-tab-add]")) {
      if (this.addTab()) this.layout.toast("A new tab in the drawer - drag boxes onto it while arranging (Shift + B), or send them there from Arrange ▾", 4000);
      return;
    }
    const ren = t.closest("[data-tab-rename]");
    if (ren) return this.renameAt(ren.dataset.tabRename);
    const rem = t.closest("[data-tab-remove]");
    if (rem) return this.save(removeTab(this.data, rem.dataset.tabRemove));
    if (t.closest("[data-drawer]")) this.set(!this.open);
  }

  // A tab named where it is: its label becomes a box to type in (Enter
  // keeps it, Esc leaves it as it was; nothing typed: named by what's in
  // it). Not the browser's own prompt, which the Windows app hasn't got.
  renameAt(id) {
    const span = this.el?.querySelector(`[data-tab-at="${CSS.escape(id)}"]`);
    const tab = this.data.tabs.find((t) => t.id === id);
    if (!span || !tab) return;
    const input = this.el.ownerDocument.createElement("input");
    input.type = "text";
    input.className = "cc-tab-name";
    input.maxLength = 24;
    input.value = tab.name ?? "";
    input.placeholder = span.querySelector("[data-tab]")?.textContent ?? "";
    span.replaceChildren(input);
    this.el.dataset.html = "";
    input.focus();
    let done = false;
    const finish = (keep) => {
      if (done) return;
      done = true;
      if (keep) this.save(renameTab(this.data, id, input.value));
      else this.layout.drawerChanged();
    };
    input.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") finish(true);
      else if (e.key === "Escape") finish(false);
    });
    input.addEventListener("blur", () => finish(true));
  }

  // While arranging: its tabs over the arranging, to drop a box on (into
  // that tab) or click (that tab shown, its boxes to drag out; the one
  // showing, the drawer minimised), + for a new one, its arrow to minimise
  // it and its inner edge to drag it wider. Minimised, its tabs on the
  // edge: each opens it at that tab, or takes a box dropped on it.
  targets(boxes) {
    const r = this.rect;
    if (!r) return "";
    const d = this.data;
    const side = `data-side="${this.side}"`;
    const title = (t) => esc(this.title(t, boxes));
    const at = `left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px`;
    const key = this.left ? "A" : "D";
    if (!this.open) {
      const tabs = d.tabs.map((t) => `<button type="button" class="arrange-tab edge" data-arr-tab="${esc(t.id)}" ${side} title="${title(t)}: click to open the drawer at this tab (${key}), or drop a box here to put it in this tab">${title(t)}</button>`).join("");
      return `<div class="arrange-drawer ${this.side} closed" ${side} style="${at}"><div class="arrange-tabs">${tabs}</div></div>`;
    }
    const tabs = d.tabs.map((t) => `<button type="button" class="arrange-tab${t.id === d.tab ? " on" : ""}" data-arr-tab="${esc(t.id)}" ${side} title="Drop a box here to put it in this tab; click to show it${t.id === d.tab ? " (showing: click again to minimise the drawer)" : ""}">${title(t)}</button>`).join("");
    const add = d.tabs.length < 6 ? `<button type="button" class="arrange-tab add" data-arr-tab-add ${side} title="A new tab in the drawer (drop a box here to start one with it)">+ tab</button>` : "";
    const min = `<button type="button" class="arrange-tab min" data-arr-drawer ${side} title="Minimise the drawer (${key}): lay out the boxes under it, then open it again from its tabs on the edge">${this.outArrow}</button>`;
    return `<div class="arrange-drawer ${this.side}" ${side} style="${at}"><span class="arrange-drawer-edge" data-arr-drawer-w ${side} title="Drag to make the drawer wider or narrower on this tab (double-click: as wide as it comes)"></span><div class="arrange-tabs">${tabs}${add}${min}</div><span class="arrange-drawer-hint">Drop a box here to put it in the drawer</span></div>`;
  }

  // Whether a point (pixels on the page) is over it - open, the drawer;
  // closed, its strip of tabs.
  holds(x, y) {
    const r = this.rect;
    return !!r && x >= r.x && x <= r.x + r.w && y >= r.y;
  }
}
