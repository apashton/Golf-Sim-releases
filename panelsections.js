// The side panel's sections folded on the phone until their heading's
// tapped (sim/panelsections.mjs has the rules). Every section in the panel
// with a heading of its own (an h3 straight inside it) folds: phoneplay.css
// shows only the heading of one without the class fold-open, so a section
// a panel draws anew starts folded with nothing done here. This keeps what
// was opened open (put back on a section drawn again), answers the taps and
// keys on the headings, and says on each whether it's open.

import { sectionKey, noneOpen, toggled, opened } from "./sim/panelsections.mjs";

// Taps on these inside a heading are theirs, not the heading's.
const OWN = "button, a, input, select, label, textarea";

export class PanelSections {
  // root: the side panel (aside).
  constructor({ root, doc = document }) {
    this.root = root;
    this.doc = doc;
    this.open = noneOpen();
    this.queued = false;
    root.addEventListener("click", (e) => {
      const head = this.headOf(e.target);
      if (!head || e.target.closest(OWN)) return;
      this.toggle(head.parentElement);
    });
    root.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const head = this.headOf(e.target);
      if (!head || e.target !== head) return;
      e.preventDefault();
      this.toggle(head.parentElement);
    });
    // (A panel drawing its sections again: what was open opened again.)
    new MutationObserver(() => this.soon()).observe(root, { childList: true, subtree: true });
    this.apply();
  }

  // The heading of a foldable section an element's in, or null.
  headOf(el) {
    const head = el?.closest?.("h3");
    return head && head.parentElement?.matches("section") && this.root.contains(head) ? head : null;
  }

  keyOf(section) {
    const panel = section.closest("[id^=panel-]")?.id ?? "";
    return sectionKey({ id: section.id, panel, title: section.querySelector(":scope > h3")?.textContent ?? "" });
  }

  toggle(section) {
    this.open = toggled(this.open, this.keyOf(section));
    this.apply();
  }

  // Opens a section: id (as the page has it, "course-ladder") or the
  // section itself.
  show(which) {
    const section = typeof which === "string" ? this.root.querySelector(`#${which}`) : which;
    if (!section) return;
    this.open = opened(this.open, this.keyOf(section));
    this.apply();
  }

  soon() {
    if (this.queued) return;
    this.queued = true;
    requestAnimationFrame(() => {
      this.queued = false;
      this.apply();
    });
  }

  // Each section's heading made a button, and open or folded as it should
  // be (changing only what's different: the watch above sees no change of
  // its own making).
  apply() {
    for (const head of this.root.querySelectorAll("section > h3")) {
      if (head.parentElement.querySelector(":scope > h3") !== head) continue;
      const section = head.parentElement;
      const on = this.open.has(this.keyOf(section));
      if (section.classList.contains("fold-open") !== on) section.classList.toggle("fold-open", on);
      if (!head.hasAttribute("role")) {
        head.setAttribute("role", "button");
        head.tabIndex = 0;
      }
      if (head.getAttribute("aria-expanded") !== String(on)) head.setAttribute("aria-expanded", String(on));
    }
  }
}
