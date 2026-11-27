// The Clubhouse: A-Squared Golf's one menu. M (or the Menu button in the top
// bar) opens it at the page last used; the connection pill opens it at the
// launch monitor. Its pages and what's on them are sim/menu.mjs's plan;
// app.js binds each item to what it changes (bind), and anything not bound
// isn't shown.
//
// A page rail down the left, the page on the right: each section a card,
// each setting a row - its name, a line saying what it does and its key,
// and the control. The search box finds any setting on any page. While
// it's open it has the keyboard: Esc or M closes it, / goes to the search,
// Tab goes round the menu only, Page Up / Down scroll it.
//
// Two styles (Menus and buttons, sim/menu.mjs UI_STYLES): Legacy is the
// menu as it was; New has its own pages (NEW_PAGES), the rail in groups,
// and each setting's line cut to two with More for the rest. On the phone
// (or a narrow window) the new style is a page at a time: the pages as a
// list first, then the page with a way back to the list (stacked).
//
// A binding: { get(), set(value), run(value), options(), words(value),
// note(), mount(el), available() } - only what the item's kind needs:
//   toggle   get, set            range   get, set, words
//   choice   get, set, options?  number  get, set
//   select   get, set, options   action  run, buttons?
//   custom   mount(el) - draws into el whenever the page is drawn
// note() is a line of state under the item (what's in force, say).

import { cleanUiStyle, pagesFor, search } from "./sim/menu.mjs";
import { keyRoute, TYPE } from "./keys.mjs";
import { esc } from "./util.js";

// A power button's ring and bar: Quit, here and in the top bar (index.html).
export const QUIT_ICON =
  '<path d="M16.88 6.04A8.5 8.5 0 1 1 7.12 6.04a1 1 0 0 1 1.15 1.64 6.5 6.5 0 1 0 7.46 0 1 1 0 0 1 1.15-1.64zM11 3a1 1 0 0 1 2 0v8a1 1 0 0 1-2 0z"/>';

const ICONS = {
  flag: '<path d="M6 21V3h1.6v1.2L18 7.5l-10.4 3.3V21z"/>',
  arc: '<path d="M3 19c3-9 9-14 18-14v2C13 7 8 11 5.3 19z"/><circle cx="4" cy="19" r="2"/>',
  green: '<ellipse cx="12" cy="15" rx="9" ry="5" opacity=".45"/><path d="M11 3h1.4v1l5 2-5 2v7h-1.4z"/><circle cx="12" cy="15.2" r="1.3"/>',
  signal: '<path d="M11 13h2v8h-2z"/><path d="M7.8 9.6a6 6 0 0 1 8.4 0l-1.4 1.4a4 4 0 0 0-5.6 0zM4.9 6.8a10 10 0 0 1 14.2 0l-1.4 1.4a8 8 0 0 0-11.4 0z"/><circle cx="12" cy="12.3" r="1.6"/>',
  screens: '<path d="M2 4h14v10H2zm2 2v6h10V6zM8 16h2v2H6v-2zM18 8h4v10H12v-2h8v-6h-2z"/>',
  camera: '<path d="M3 6h12a1 1 0 0 1 1 1v3.5l5-3v9l-5-3V17a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/>',
  sound: '<path d="M3 9h4l5-4v14l-5-4H3z"/><path d="M15.5 8.5a5 5 0 0 1 0 7l-1.4-1.4a3 3 0 0 0 0-4.2zM18.3 5.7a9 9 0 0 1 0 12.6l-1.4-1.4a7 7 0 0 0 0-9.8z"/>',
  chart: '<path d="M4 20V10h3v10zm6 0V4h3v16zm6 0v-7h3v7z"/>',
  gear: '<path d="M10.3 2h3.4l.5 2.6 1.8.8 2.2-1.5 2.4 2.4-1.5 2.2.8 1.8 2.6.5v3.4l-2.6.5-.8 1.8 1.5 2.2-2.4 2.4-2.2-1.5-1.8.8-.5 2.6h-3.4l-.5-2.6-1.8-.8-2.2 1.5-2.4-2.4 1.5-2.2-.8-1.8L2 13.7v-3.4l2.6-.5.8-1.8-1.5-2.2 2.4-2.4 2.2 1.5 1.8-.8zM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/>',
  news: '<path d="M12 2l2.6 6.2 6.7.6-5.1 4.4 1.5 6.6L12 16.3l-5.7 3.5 1.5-6.6-5.1-4.4 6.7-.6z"/>',
  keys: '<path d="M2 6h20v12H2zm2 2v8h16V8zm1 1h2v2H5zm3 0h2v2H8zm3 0h2v2h-2zm3 0h2v2h-2zm3 0h2v2h-2zM7 13h10v2H7z"/>',
  search: '<path d="M10 3a7 7 0 0 1 5.6 11.2l5.1 5.1-1.4 1.4-5.1-5.1A7 7 0 1 1 10 3zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/>',
  people: '<circle cx="9" cy="7.5" r="3.5"/><path d="M2 20c0-4 3.1-6.5 7-6.5s7 2.5 7 6.5z"/><circle cx="17" cy="8.5" r="2.6" opacity=".6"/><path d="M17.5 13.2c2.7.4 4.5 2.6 4.5 5.8h-4.4c0-2.3-.7-4.2-2-5.5.6-.2 1.2-.3 1.9-.3z" opacity=".6"/>',
  pad: '<path d="M7 7h10a5 5 0 0 1 4.9 6l-1 4.6a2.6 2.6 0 0 1-4.6 1L14.6 16H9.4l-1.7 2.6a2.6 2.6 0 0 1-4.6-1l-1-4.6A5 5 0 0 1 7 7zm0 3v1.5H5.5v2H7V15h2v-1.5h1.5v-2H9V10zm8.5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zm2.5 2.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z"/>',
  eye: '<path d="M12 5c5 0 9 4.5 10 7-1 2.5-5 7-10 7S3 14.5 2 12c1-2.5 5-7 10-7zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/>',
  help: '<path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 14a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6zm.2-10C9.9 6 8.4 7.3 8.2 9.3h2.2c.1-.9.8-1.4 1.7-1.4 1 0 1.7.6 1.7 1.5 0 .8-.4 1.2-1.4 1.8-1.2.7-1.6 1.5-1.6 2.8v.5h2.1v-.4c0-.8.3-1.1 1.4-1.8 1.2-.7 1.8-1.6 1.8-3 0-2-1.6-3.3-3.9-3.3z"/>',
  back: '<path d="M15.4 5.4 14 4l-8 8 8 8 1.4-1.4L8.8 12z"/>',
  next: '<path d="M8.6 5.4 10 4l8 8-8 8-1.4-1.4 6.6-6.6z"/>',
  power: QUIT_ICON,
  house: '<path d="M12 3 2 11.5h3V21h5.5v-6h3v6H19v-9.5h3z"/>',
};
export const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] ?? ""}</svg>`;

// "Shift + R" as keys: each key in a box.
const keysHtml = (keys) =>
  keys
    ? `<span class="ch-keys">${String(keys)
        .split(/\s{2,}/)
        .map((k) => `<kbd>${esc(k)}</kbd>`)
        .join(" ")}</span>`
    : "";

export class Clubhouse {
  // pages: the plan (sim/menu.mjs) - by default, the style's own. style:
  // "new" or "legacy" (setStyle). version: said at the foot of the rail.
  // onQuit(button): quits A-Squared Golf, asked first (the Windows app) - a
  // Quit button under the pages, whichever page is open; none without it.
  // onHome(): the phone app's Home - its start screens - first above the
  // pages (the owner, 29 October 2026: "hide the home button within menu").
  constructor({ pages = null, style = "new", version = "", onOpen = () => {}, onClose = () => {}, onQuit = null, onHome = null } = {}) {
    this.ownPages = pages;
    this.style = cleanUiStyle(style);
    this.pages = pages ?? pagesFor(this.style);
    // A page at a time (the new style on a phone): the list of pages first.
    this.home = false;
    this.version = version;
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.onQuit = onQuit;
    this.onHome = onHome;
    this.bindings = new Map();
    this.page = this.pages[0].id;
    this.query = "";
    this.el = document.createElement("div");
    this.el.className = "clubhouse";
    this.el.hidden = true;
    this.el.addEventListener("click", (e) => this.click(e));
    this.el.addEventListener("change", (e) => this.change(e));
    this.el.addEventListener("input", (e) => this.input(e));
    document.body.appendChild(this.el);
  }

  get doc() {
    return this.el.ownerDocument;
  }
  get open() {
    return !this.el.hidden;
  }

  // New or Legacy: its pages, and how it's drawn - at once if it's open
  // (the switch is on one of its own pages, in both).
  setStyle(style) {
    this.style = cleanUiStyle(style);
    this.pages = this.ownPages ?? pagesFor(this.style);
    if (!this.pages.some((p) => p.id === this.page)) this.page = this.pages[0].id;
    this.home = false;
    if (this.open) this.render();
  }

  // A page at a time: the new style on the phone app, or in a window too
  // narrow for the rail beside the page.
  get stacked() {
    if (this.style !== "new") return false;
    const html = this.doc.documentElement;
    return html.classList.contains("pocket") || !!this.doc.defaultView?.matchMedia?.("(max-width: 860px)").matches;
  }

  bind(id, binding) {
    this.bindings.set(id, binding);
    return this;
  }
  bindAll(map) {
    for (const [id, b] of Object.entries(map)) if (b) this.bind(id, b);
    return this;
  }
  // Whether an item is shown: bound, and available here and now.
  has(id) {
    const b = this.bindings.get(id);
    if (!b) return false;
    try {
      return b.available ? !!b.available() : true;
    } catch {
      return false;
    }
  }
  // The pages with anything on them.
  shownPages() {
    return this.pages.filter((p) => p.sections.some((s) => s.items.some((i) => this.has(i.id))));
  }

  // Opens it (at a page, or the one last used), or closes it.
  show(on = !this.open, page = null) {
    if (on) {
      if (page && this.pages.some((p) => p.id === page)) this.page = page;
      if (!this.shownPages().some((p) => p.id === this.page)) this.page = this.shownPages()[0]?.id ?? this.page;
      // A page at a time: opened at a page asked for, or the list of them.
      this.home = this.stacked && !page;
      this.query = "";
      this.render();
      this.el.hidden = false;
      for (const el of this.doc.querySelectorAll("body > header, body > main, body > aside")) el.inert = true;
      // (The list of pages: its first page has the keyboard.)
      this.el.querySelector(this.home ? ".ch-nav-item" : ".ch-page")?.focus({ preventScroll: true });
      this.onOpen();
      return;
    }
    if (!this.open) return;
    this.el.hidden = true;
    for (const el of this.doc.querySelectorAll("body > header, body > main, body > aside")) el.inert = false;
    const active = this.doc.activeElement;
    if (this.el.contains(active)) active.blur();
    this.onClose();
  }

  // Something changed elsewhere (a key, the side panel): the items shown
  // are drawn again - all of them, or those asked for.
  refresh(ids = null) {
    if (!this.open) return;
    for (const row of this.el.querySelectorAll("[data-item]")) {
      if (ids && !ids.includes(row.dataset.item)) continue;
      this.renderItem(row);
    }
  }

  // ---- Drawing ------------------------------------------------------------------------

  render() {
    const pages = this.shownPages();
    this.el.classList.toggle("ui-new", this.style === "new");
    this.el.classList.toggle("stacked", this.stacked);
    // The new style's rail: the pages in their groups (Play, Set up, More).
    const group = (p, i) => (p.group && p.group !== pages[i - 1]?.group ? `<h4 class="ch-group">${esc(p.group)}</h4>` : "");
    this.el.innerHTML = `<div class="ch-shell" role="dialog" aria-modal="true" aria-label="Menu">
      <nav class="ch-rail" aria-label="Menu pages">
        <div class="ch-brand"><span class="ch-flag brand-mark" aria-hidden="true">A²</span><span><b>Golf</b><small>Clubhouse</small></span></div>
        ${this.onHome ? `<button class="ch-nav-item ch-apphome" data-app-home title="Home: Play, At the range, your level - the game kept as it is">${icon("house")}<span><b>Home</b><small>Play, At the range, your level</small></span>${this.style === "new" ? `<i class="ch-go">${icon("next")}</i>` : ""}</button>` : ""}
        <div class="ch-nav">${pages
          .map(
            (p, i) => `${group(p, i)}<button class="ch-nav-item${p.id === this.page ? " on" : ""}" data-page="${p.id}" aria-current="${p.id === this.page}">
          ${icon(p.icon)}<span><b>${esc(p.title)}</b><small>${esc(p.blurb)}</small></span>${this.style === "new" ? `<i class="ch-go">${icon("next")}</i>` : ""}</button>`,
          )
          .join("")}</div>
        ${this.onQuit ? `<button class="ch-quit" data-quit title="Quit A² Golf - it asks first (Alt + F4 too)">${icon("power")}<span>Quit A² Golf</span></button>` : ""}
        <div class="ch-foot">${this.version ? `A² Golf ${esc(this.version)}<br>` : ""}<kbd>M</kbd> or <kbd>Esc</kbd> closes<br><span class="ch-maker">by A2 Games</span></div>
      </nav>
      <div class="ch-main">
        <header class="ch-head">
          ${this.style === "new" ? `<button class="ch-back" data-back title="Every page" aria-label="Back to every page">${icon("back")}<span>Menu</span></button>` : ""}
          <div class="ch-title"></div>
          <label class="ch-search">${icon("search")}<input type="search" data-search placeholder="Find a setting..." aria-label="Find a setting" value="${esc(this.query)}"><kbd>/</kbd></label>
          <button class="ch-close" data-close title="Close (M or Esc)" aria-label="Close">✕</button>
        </header>
        <div class="ch-page" tabindex="-1"></div>
        <p class="ch-status small" role="status" aria-live="polite"></p>
      </div>
    </div>`;
    this.renderPage();
  }

  renderPage() {
    const title = this.el.querySelector(".ch-title");
    const body = this.el.querySelector(".ch-page");
    if (!body) return;
    // A page at a time: the list of pages, or one page (or what the search
    // found) with the way back.
    const home = this.stacked && this.home && !this.query.trim();
    this.el.classList.toggle("at-home", home);
    if (home) {
      title.innerHTML = `<h2>Menu</h2>${this.version ? `<p>A² Golf ${esc(this.version)}</p>` : ""}`;
      body.innerHTML = "";
      return;
    }
    for (const b of this.el.querySelectorAll(".ch-nav-item")) {
      const on = !this.query && b.dataset.page === this.page;
      b.classList.toggle("on", on);
      b.setAttribute("aria-current", String(on));
    }
    if (this.query.trim()) {
      const hits = search(this.query, { has: (id) => this.has(id), pages: this.pages });
      title.innerHTML = `<h2>Found</h2><p>${hits.length ? `${hits.length} setting${hits.length === 1 ? "" : "s"} for "${esc(this.query.trim())}"` : `Nothing for "${esc(this.query.trim())}" - try other words`}</p>`;
      body.innerHTML = hits.length
        ? `<section class="ch-card">${hits.map((h) => this.rowHtml(h.item, `${h.page.title} · ${h.section.title}`)).join("")}</section>`
        : "";
    } else {
      const page = this.pages.find((p) => p.id === this.page) ?? this.pages[0];
      title.innerHTML = `<h2>${icon(page.icon)}${esc(page.title)}</h2><p>${esc(page.blurb)}</p>`;
      body.innerHTML = page.sections
        .filter((s) => s.items.some((i) => this.has(i.id)))
        .map(
          (s) => `<section class="ch-card">
            <h3>${esc(s.title)}</h3>
            ${s.help ? this.sectionHelp(s.help) : ""}
            ${s.items
              .filter((i) => this.has(i.id))
              .map((i) => this.rowHtml(i))
              .join("")}
          </section>`,
        )
        .join("");
    }
    for (const row of body.querySelectorAll("[data-item]")) this.renderItem(row);
    body.scrollTop = 0;
    if (this.style === "new") this.markLong(body);
  }

  // The new style: a setting's line cut to two, and More on the ones that
  // say more than that (measured once the page is laid out).
  markLong(body) {
    const win = this.doc.defaultView;
    (win?.requestAnimationFrame ?? setTimeout)(() => {
      for (const p of body.querySelectorAll(".ch-help")) p.closest(".ch-row, .ch-sechelp")?.classList.toggle("long", p.scrollHeight > p.clientHeight + 2);
    });
  }

  // A section's words: in the new style cut to two lines like a setting's,
  // with More.
  sectionHelp(help) {
    if (this.style !== "new") return `<p class="ch-section-help">${esc(help)}</p>`;
    return `<div class="ch-sechelp"><p class="ch-section-help ch-help">${esc(help)}</p><button class="ch-more" data-more aria-expanded="false">More</button></div>`;
  }

  rowHtml(item, where = "") {
    const wide = item.kind === "custom" || (item.kind === "choice" && (item.options?.length ?? 0) > 4);
    return `<div class="ch-row${wide ? " wide" : ""} kind-${item.kind}" data-item="${esc(item.id)}">
      <div class="ch-label">
        ${where ? `<span class="ch-where">${esc(where)}</span>` : ""}
        <b>${esc(item.label)}</b>${keysHtml(item.keys)}
        <p class="ch-help">${esc(item.help)}</p>${this.style === "new" ? `<button class="ch-more" data-more aria-expanded="false">More</button>` : ""}
        <p class="ch-note" hidden></p>
      </div>
      <div class="ch-control"></div>
    </div>`;
  }

  item(id) {
    for (const p of this.pages) for (const s of p.sections) for (const i of s.items) if (i.id === id) return i;
    return null;
  }

  // One item's control, drawn from its binding's state now.
  renderItem(row) {
    const item = this.item(row.dataset.item);
    const b = this.bindings.get(row.dataset.item);
    const box = row.querySelector(".ch-control");
    if (!item || !b || !box) return;
    const note = row.querySelector(".ch-note");
    const n = safe(() => b.note?.());
    note.hidden = !n;
    note.textContent = n ?? "";
    const v = safe(() => b.get?.());
    const id = esc(item.id);
    switch (item.kind) {
      case "toggle":
        box.innerHTML = `<label class="ch-switch"><input type="checkbox" data-set="${id}" ${v ? "checked" : ""}><span></span><em>${v ? "On" : "Off"}</em></label>`;
        break;
      case "choice": {
        const opts = safe(() => b.options?.()) ?? item.options ?? [];
        box.innerHTML = `<div class="ch-seg" role="group">${opts
          .map((o) => `<button data-choice="${id}" data-value="${esc(String(o.value))}" class="${String(o.value) === String(v) ? "on" : ""}" aria-pressed="${String(o.value) === String(v)}">${esc(o.label)}</button>`)
          .join("")}</div>`;
        break;
      }
      case "select": {
        const opts = safe(() => b.options?.()) ?? [];
        box.innerHTML = `<select data-set="${id}">${opts.map((o) => `<option value="${esc(String(o.value))}" ${String(o.value) === String(v) ? "selected" : ""}>${esc(o.label)}</option>`).join("")}</select>`;
        break;
      }
      case "range":
        box.innerHTML = `<div class="ch-range"><input type="range" data-set="${id}" min="${item.min}" max="${item.max}" step="${item.step}" value="${esc(String(v ?? 0))}"><output data-words="${id}">${esc(safe(() => b.words?.(v)) ?? String(v ?? ""))}</output></div>`;
        break;
      case "number":
        box.innerHTML = `<label class="ch-number"><input type="number" data-set="${id}" min="${item.min}" max="${item.max}" step="${item.step}" value="${esc(String(v ?? ""))}">${item.unit ? `<span>${esc(item.unit)}</span>` : ""}</label>`;
        break;
      case "action": {
        const buttons = safe(() => b.buttons?.()) ?? [{ value: "", label: b.button ?? "Open" }];
        box.innerHTML = `<div class="ch-buttons">${buttons
          .map((o) => `<button data-run="${id}" data-value="${esc(String(o.value ?? ""))}" class="${o.primary ? "primary" : ""}" ${o.disabled ? "disabled" : ""}>${esc(o.label)}</button>`)
          .join("")}</div>`;
        break;
      }
      case "custom":
        box.innerHTML = "";
        safe(() => b.mount?.(box));
        break;
      default:
        box.innerHTML = "";
    }
  }

  // A page at a time: back to the list of pages.
  goHome() {
    this.home = true;
    this.query = "";
    const s = this.el.querySelector("[data-search]");
    if (s) s.value = "";
    this.say("");
    this.renderPage();
    this.el.querySelector(".ch-rail")?.scrollTo?.(0, 0);
  }

  // A line at the foot of the page: what a button did.
  say(text, bad = false) {
    const el = this.el.querySelector(".ch-status");
    if (!el) return;
    el.textContent = text;
    el.classList.toggle("bad", bad);
  }

  // ---- Using it -----------------------------------------------------------------------

  async click(e) {
    if (e.target === this.el) return this.show(false);
    const t = e.target.closest?.("button");
    if (!t) return;
    if (t.hasAttribute("data-close")) return this.show(false);
    if (t.hasAttribute("data-quit")) return this.onQuit?.(t);
    if (t.hasAttribute("data-app-home")) return this.show(false), this.onHome?.();
    if (t.hasAttribute("data-back")) return this.goHome();
    if (t.hasAttribute("data-more")) {
      const row = t.closest(".ch-row, .ch-sechelp");
      const open = !row.classList.contains("open");
      row.classList.toggle("open", open);
      t.textContent = open ? "Less" : "More";
      t.setAttribute("aria-expanded", String(open));
      return;
    }
    if (t.dataset.page) {
      this.home = false;
      this.page = t.dataset.page;
      this.query = "";
      this.say("");
      const s = this.el.querySelector("[data-search]");
      if (s) s.value = "";
      return this.renderPage();
    }
    if (t.dataset.choice) {
      const b = this.bindings.get(t.dataset.choice);
      const opts = safe(() => b?.options?.()) ?? this.item(t.dataset.choice)?.options ?? [];
      const o = opts.find((x) => String(x.value) === t.dataset.value);
      await this.apply(t.dataset.choice, () => b?.set?.(o ? o.value : t.dataset.value));
      return;
    }
    if (t.dataset.run) {
      const b = this.bindings.get(t.dataset.run);
      await this.apply(t.dataset.run, () => b?.run?.(t.dataset.value || undefined));
    }
  }

  change(e) {
    const t = e.target;
    if (!t.dataset?.set) return;
    const item = this.item(t.dataset.set);
    const b = this.bindings.get(t.dataset.set);
    if (!item || !b) return;
    let v = t.value;
    if (t.type === "checkbox") v = t.checked;
    else if (item.kind === "range" || item.kind === "number") {
      v = Number(t.value);
      if (!Number.isFinite(v)) return this.renderItem(t.closest("[data-item]"));
      if (item.kind === "number") v = Math.min(item.max, Math.max(item.min, v));
    }
    this.apply(item.id, () => b.set?.(v));
  }

  // A slider moving: its words follow (and, if the binding wants it live,
  // what it sets) - kept when it's let go (change).
  input(e) {
    const t = e.target;
    if (t.matches?.("[data-search]")) {
      this.query = t.value;
      // A page at a time: what it finds in place of the list; emptied, the
      // list again.
      if (this.stacked) this.home = !this.query.trim();
      return this.renderPage();
    }
    if (t.type !== "range" || !t.dataset.set) return;
    const b = this.bindings.get(t.dataset.set);
    const v = Number(t.value);
    const out = this.el.querySelector(`[data-words="${CSS.escape(t.dataset.set)}"]`);
    if (out) out.textContent = safe(() => b?.words?.(v)) ?? String(v);
    if (b?.live) safe(() => b.set?.(v));
  }

  // Does it, then draws the item again with what's in force now (and says
  // what went wrong, if it did).
  async apply(id, fn) {
    try {
      const said = await fn();
      if (typeof said === "string") this.say(said);
    } catch (err) {
      this.say(err?.message ?? String(err), true);
    }
    if (!this.open) return;
    const row = this.el.querySelector(`[data-item="${CSS.escape(id)}"]`);
    if (row) this.renderItem(row);
  }

  // A key while it's open (app.js hands every key here first). True: the
  // menu took it.
  key(e) {
    if (!this.open) return false;
    const typing = keyRoute(e.target, e.key) === TYPE;
    if (e.key === "Escape") {
      e.preventDefault();
      // Esc in the search empties it first.
      const s = e.target.matches?.("[data-search]") ? e.target : null;
      if (s && s.value) {
        s.value = "";
        this.query = "";
        if (this.stacked) this.home = true;
        this.renderPage();
        return true;
      }
      // A page at a time: back to the list first.
      if (this.stacked && !this.home) {
        this.goHome();
        return true;
      }
      this.show(false);
      return true;
    }
    if (!typing && (e.key === "m" || e.key === "M") && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      this.show(false);
      return true;
    }
    if (!typing && e.key === "/") {
      e.preventDefault();
      this.el.querySelector("[data-search]")?.focus();
      return true;
    }
    if (e.key === "Tab") {
      const all = [...this.el.querySelectorAll("button, input, select, textarea, a[href]")].filter((x) => !x.disabled && x.offsetParent !== null);
      const at = all.indexOf(e.target);
      if (all.length && ((!e.shiftKey && at === all.length - 1) || (e.shiftKey && at <= 0))) {
        e.preventDefault();
        all[e.shiftKey ? all.length - 1 : 0].focus();
      }
      return true;
    }
    if (!typing && (e.key === "PageDown" || e.key === "PageUp")) {
      e.preventDefault();
      const page = this.el.querySelector(".ch-page");
      page?.scrollBy({ top: (e.key === "PageDown" ? 0.8 : -0.8) * page.clientHeight, behavior: "instant" });
      return true;
    }
    // Every other key is the menu's own (Enter, Space, the arrows).
    return true;
  }
}

function safe(fn) {
  try {
    return fn();
  } catch (err) {
    console.warn("A menu item couldn't be drawn:", err);
    return undefined;
  }
}
