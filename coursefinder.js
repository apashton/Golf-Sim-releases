// Finding a course (sim/coursepicker.mjs): a box to type words in, the
// filters the list has a choice in as chips (one of each kind at a time;
// pressed again, off), an order, and the courses that match - pressed to
// pick one. Drawn into any element: the course picker card from the
// course panel (CoursePicker, below) and the designer's own list of
// courses (designer.js).

import { esc } from "./util.js";
import { findCourses, filterChoices, facetCounts, courseLine, cleanFilters, SORTS } from "./sim/coursepicker.mjs";

export class CourseFinder {
  // list(): the courses (the course list's lines); current(): the id of
  // the one chosen now (marked), or null; pick(id): one pressed; mark:
  // the word on the chosen one's row; fold: the filters folded under a
  // "Filters" of their own till opened (the designer's narrow list).
  constructor(el, { list = () => [], current = () => null, pick = () => {}, mark = "Chosen", placeholder = "Find a course - its name, links, hilly, 9 holes...", fold = false } = {}) {
    this.el = el;
    this.list = list;
    this.current = current;
    this.pick = pick;
    this.mark = mark;
    this.state = { words: "", filters: {}, sort: "name" };
    el.classList.add("course-finder");
    el.innerHTML = `
      <div class="cf-top">
        <input type="search" class="cf-words" placeholder="${esc(placeholder)}" aria-label="Find a course by its name or what kind it is" autocomplete="off">
        <label class="cf-sort">Order <select class="cf-order">${Object.entries(SORTS)
          .map(([v, name]) => `<option value="${v}">${esc(name)}</option>`)
          .join("")}</select></label>
      </div>
      ${fold ? `<details class="cf-fold"><summary>Filters <span class="cf-on"></span></summary><div class="cf-filters"></div></details>` : `<div class="cf-filters"></div>`}
      <p class="cf-count small muted"></p>
      <div class="cf-list" role="list"></div>`;
    this.words = el.querySelector(".cf-words");
    this.words.addEventListener("input", () => {
      this.state.words = this.words.value;
      this.update();
    });
    // Enter: the first that matches.
    this.words.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const first = this.matches()[0];
      if (first) {
        e.preventDefault();
        this.pick(first.id);
      }
    });
    el.querySelector(".cf-order").addEventListener("change", (e) => {
      this.state.sort = e.target.value;
      this.update();
    });
    el.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b || !el.contains(b)) return;
      if (b.dataset.filter) {
        const f = b.dataset.filter;
        if (this.state.filters[f] === b.dataset.value) delete this.state.filters[f];
        else this.state.filters[f] = b.dataset.value;
        this.update();
        el.querySelector(`button[data-filter="${CSS.escape(f)}"][data-value="${CSS.escape(b.dataset.value)}"]`)?.focus({ preventScroll: true });
        return;
      }
      if (b.dataset.act === "clear") {
        this.clear();
        this.words.focus({ preventScroll: true });
        return;
      }
      if (b.dataset.course) this.pick(b.dataset.course);
    });
    this.update();
  }

  // The courses that match now, in order.
  matches() {
    return findCourses(this.list() ?? [], { words: this.state.words, filters: cleanFilters(this.state.filters), sort: this.state.sort });
  }

  // Words and filters off: every course.
  clear() {
    this.state.words = "";
    this.state.filters = {};
    this.words.value = "";
    this.update();
  }

  focus() {
    this.words.focus({ preventScroll: true });
  }

  // The chips, the count and the list drawn again (the words box left as
  // it is, so typing isn't disturbed).
  update() {
    const all = this.list() ?? [];
    const choices = filterChoices(all);
    // (A filter no longer offered - the list changed - let go of.)
    for (const id of Object.keys(this.state.filters)) if (!choices.some((f) => f.id === id && f.values.some((v) => v.value === this.state.filters[id]))) delete this.state.filters[id];
    this.el.querySelector(".cf-order").value = this.state.sort;
    // Each chip's count: what pressing it would leave, with the words and
    // the other filters as they are (none: dimmed).
    const facets = facetCounts(all, { words: this.state.words, filters: this.state.filters });
    this.el.querySelector(".cf-filters").innerHTML = choices
      .map(
        (f) => `<div class="cf-group" role="group" aria-label="${esc(f.name)}"><span class="cf-group-name">${esc(f.name)}</span>${f.values
          .map((v) => {
            const on = this.state.filters[f.id] === v.value;
            const n = facets[f.id]?.[v.value] ?? 0;
            return `<button type="button" class="cf-chip${on ? " on" : ""}${n || on ? "" : " none"}" aria-pressed="${on}" data-filter="${esc(f.id)}" data-value="${esc(v.value)}">${esc(v.name)} <small>${n}</small></button>`;
          })
          .join("")}</div>`,
      )
      .join("");
    const fold = this.el.querySelector(".cf-fold");
    if (fold) {
      fold.hidden = !choices.length;
      const on = Object.keys(this.state.filters).length;
      fold.querySelector(".cf-on").textContent = on ? `(${on} on)` : "";
    }
    const found = this.matches();
    const asked = this.state.words.trim() || Object.keys(this.state.filters).length;
    const count = this.el.querySelector(".cf-count");
    count.innerHTML = !all.length ? "" : asked ? `${found.length} of ${all.length} courses <button type="button" class="cf-clear" data-act="clear">Show all</button>` : `${all.length} ${all.length === 1 ? "course" : "courses"}`;
    const now = this.current();
    this.el.querySelector(".cf-list").innerHTML = found.length
      ? found
          .map((c) => {
            const chosen = c.id === now;
            return `<button type="button" role="listitem" class="cf-course${chosen ? " chosen" : ""}" data-course="${esc(c.id)}"${chosen ? ' aria-current="true"' : ""}><span class="cf-name">${esc(c.name)}${chosen ? ` <em class="cf-mark">${esc(this.mark)}</em>` : ""}</span><small>${esc(courseLine(c))}</small></button>`;
          })
          .join("")
      : all.length
        ? `<p class="muted cf-none">No course matches. <button type="button" data-act="clear">Show all</button></p>`
        : `<p class="muted cf-none">No courses yet.</p>`;
  }
}

// The course picker: a card over the game, from the course panel's course
// (course/panel.js openPicker) - the finder, and the way to a new one: the
// course designer's New course, or a real course from the map (the PC
// only). In the window it was asked from (the
// controls window with the screens separate).
export class CoursePicker {
  // list(), current(): as the finder's; choose(id): one picked (the card
  // closes); design(start): the designer opened - "new" or "map" - or
  // null where there's none; autofocus: the words box ready to
  // type in as it opens (not on the phone: its keyboard would cover the
  // list); fold: the filters folded under "Filters" (the phone's short
  // screen).
  // map: the way to a real course from the map too (the PC's alone).
  constructor({ doc = document, list = () => [], current = () => null, choose = () => {}, design = null, map = true, autofocus = true, fold = false } = {}) {
    this.choose = choose;
    this.autofocus = autofocus;
    this.el = doc.createElement("div");
    this.el.className = "corner-card course-picker";
    this.el.hidden = true;
    this.el.setAttribute("role", "dialog");
    this.el.setAttribute("aria-label", "Choose a course");
    this.el.innerHTML = `
      <div class="cp-head"><h2>Choose a course</h2><button type="button" class="cp-x" data-act="close" aria-label="Close" title="Close (Esc)">×</button></div>
      <div class="cp-finder"></div>
      ${
        design
          ? `<div class="cp-new"><span class="small muted">Or make one:</span> <button type="button" data-act="new" title="The course designer: a course in a few clicks, from a quick start, styles by hole or a scorecard">New course...</button>${map ? ` <button type="button" data-act="map" title="The course designer: a real course rebuilt from the map and its real ground">Real course from the map...</button>` : ""}</div>`
          : ""
      }`;
    doc.body.append(this.el);
    this.finder = new CourseFinder(this.el.querySelector(".cp-finder"), {
      list,
      current,
      mark: "Playing next",
      fold,
      pick: (id) => {
        this.show(false);
        choose(id);
      },
    });
    this.el.addEventListener("click", (e) => {
      const act = e.target.closest("button")?.dataset.act;
      if (act === "close") this.show(false);
      else if (act === "new" || act === "map") {
        this.show(false);
        design?.(act);
      }
    });
    this.el.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      this.show(false);
    });
  }

  get open() {
    return !this.el.hidden;
  }

  // Into another window's page (the screens separate or back together).
  moveTo(doc) {
    if (doc?.body && this.el.ownerDocument !== doc) doc.body.append(this.el);
  }

  show(on = !this.open) {
    if (on) this.finder.update();
    this.el.hidden = !on;
    if (on && this.autofocus) this.finder.focus();
    else if (this.el.contains(this.el.ownerDocument.activeElement)) this.el.ownerDocument.activeElement.blur();
  }

  // Drawn again if it's open (the course list changed).
  refresh() {
    if (this.open) this.finder.update();
  }
}
