// The blank area (Shift + B, or the menu's Screens page): part of a window
// kept black - where a webcam hangs in front of the laptop's screen, say -
// with everything else in that window moved into the biggest clear part
// beside it (sim/blankarea.mjs works out which). Each window has its own:
// "main", the sim's page (the game on the projector, or the one window),
// and "controls", the controls window when the screens are separate. It's
// drawn on the window it's for, by dragging over the part to keep blank.
//
// Drawn by the sim's own code in whichever window (the controls window is
// the sim's page split in two - screens.js), so the element lookups here go
// through the document they're given, never this page's.

import { cleanRect, freeInsets, insetVars, rectFromPoints, moveRect, resizeRect, oppositeCorner, editorKey } from "./sim/blankarea.mjs";
import { loadSetting, saveSetting } from "./util.js";

const pct = (share) => `${(share * 100).toFixed(3)}%`;
const CORNERS = ["tl", "tr", "bl", "br"];

export class BlankAreas {
  // onChange(role): after a window's blank area has changed (the page
  // resizes its picture). toast(text, ms): a message.
  constructor({ onChange = () => {}, toast = () => {} } = {}) {
    this.saved = loadSetting("blank", { main: null, controls: null });
    this.onChange = onChange;
    this.toast = toast;
    this.editor = null;
  }

  rect(role) {
    return cleanRect(this.saved[role]);
  }

  // A window's blank area set from elsewhere (arranging the controls
  // window moves and sizes it with the boxes), or null for none. Kept.
  setRect(role, rect) {
    this.saved = { ...this.saved, [role]: cleanRect(rect) };
    saveSetting("blank", this.saved);
  }

  // Puts a window's blank area on it - the black box, and the insets that
  // keep everything else clear of it - or takes it off.
  apply(doc, role) {
    if (!doc?.body) return;
    const r = this.rect(role);
    const root = doc.documentElement;
    for (const [k, v] of Object.entries(insetVars(freeInsets(r)))) root.style.setProperty(k, v);
    root.classList.toggle("has-blank", !!r);
    let box = doc.body.querySelector(":scope > .blank-area");
    if (!r) {
      box?.remove();
      return;
    }
    if (!box) {
      box = doc.createElement("div");
      box.className = "blank-area";
      box.setAttribute("aria-hidden", "true");
    }
    // Last in the page, so it's over everything else.
    doc.body.appendChild(box);
    Object.assign(box.style, { left: pct(r.x), top: pct(r.y), width: pct(r.w), height: pct(r.h) });
  }

  get editing() {
    return !!this.editor;
  }

  // Draws a window's blank area: over the whole window, a drag draws a new
  // one, dragging it moves it and a corner sizes it; Enter keeps it, Delete
  // takes it away, Esc leaves it as it was.
  edit(doc, role) {
    if (!doc?.body) return;
    if (this.editor) this.close();
    const el = doc.createElement("div");
    el.className = "blank-editor";
    el.innerHTML = `
      <div class="blank-editor-rect" hidden>${CORNERS.map((c) => `<span class="blank-editor-corner ${c}" data-corner="${c}"></span>`).join("")}</div>
      <div class="blank-editor-help">
        <h2>Blank area on ${role === "controls" ? "the controls window" : "this window"}</h2>
        <p>Drag over the part of the screen to keep blank - where a camera hangs in front of it, say. Drag the box to move it, a corner to size it. Everything else moves into the biggest clear part beside it.</p>
        <p class="muted small">Arrow keys move it, Shift + arrows size it.</p>
        <div class="buttons">
          <button data-act="save" class="primary">Keep it (Enter)</button>
          <button data-act="clear">No blank area (Delete)</button>
          <button data-act="cancel">Cancel (Esc)</button>
        </div>
      </div>`;
    doc.body.appendChild(el);
    this.editor = { doc, role, el, rect: this.rect(role), drag: null };
    doc.body.querySelector(":scope > .blank-area")?.setAttribute("hidden", "");
    el.addEventListener("pointerdown", (e) => this.pointerDown(e));
    el.addEventListener("pointermove", (e) => this.pointerMove(e));
    el.addEventListener("pointerup", (e) => this.pointerUp(e));
    el.addEventListener("pointercancel", (e) => this.pointerUp(e));
    el.querySelector(".blank-editor-help").addEventListener("click", (e) => {
      const act = e.target.closest("button")?.dataset.act;
      if (act) this.act(act);
    });
    this.draw();
  }

  // The window's size, for turning the pointer into shares of it.
  share(e) {
    const w = this.editor.doc.defaultView;
    return [e.clientX / Math.max(1, w.innerWidth), e.clientY / Math.max(1, w.innerHeight)];
  }

  pointerDown(e) {
    const ed = this.editor;
    if (!ed || e.button !== 0 || e.target.closest(".blank-editor-help")) return;
    const [px, py] = this.share(e);
    const corner = e.target.closest("[data-corner]")?.dataset.corner;
    if (corner && ed.rect) ed.drag = { kind: "corner", fixed: oppositeCorner(ed.rect, corner) };
    else if (e.target.closest(".blank-editor-rect") && ed.rect) ed.drag = { kind: "move", from: [px, py], start: ed.rect };
    else ed.drag = { kind: "draw", from: [px, py] };
    try {
      ed.el.setPointerCapture(e.pointerId);
    } catch {
      // Not every pointer can be captured; the drag still works inside.
    }
    e.preventDefault();
  }

  pointerMove(e) {
    const ed = this.editor;
    const d = ed?.drag;
    if (!d) return;
    const [px, py] = this.share(e);
    if (d.kind === "draw") {
      // A click without a drag isn't a box.
      if (Math.abs(px - d.from[0]) < 0.005 && Math.abs(py - d.from[1]) < 0.005) return;
      ed.rect = rectFromPoints(d.from[0], d.from[1], px, py);
    } else if (d.kind === "move") {
      ed.rect = moveRect(d.start, px - d.from[0], py - d.from[1]);
    } else {
      ed.rect = rectFromPoints(d.fixed[0], d.fixed[1], px, py);
    }
    this.draw();
  }

  pointerUp(e) {
    const ed = this.editor;
    if (!ed?.drag) return;
    ed.drag = null;
    try {
      ed.el.releasePointerCapture(e.pointerId);
    } catch {
      // Let go already.
    }
  }

  draw() {
    const ed = this.editor;
    if (!ed) return;
    const box = ed.el.querySelector(".blank-editor-rect");
    box.hidden = !ed.rect;
    if (ed.rect) Object.assign(box.style, { left: pct(ed.rect.x), top: pct(ed.rect.y), width: pct(ed.rect.w), height: pct(ed.rect.h) });
    // The words go in the middle of what would be left clear, so they're
    // never under the camera.
    const ins = freeInsets(ed.rect);
    const help = ed.el.querySelector(".blank-editor-help");
    Object.assign(help.style, {
      left: pct(ins.left + (1 - ins.left - ins.right) / 2),
      top: pct(ins.top + (1 - ins.top - ins.bottom) / 2),
    });
  }

  // While it's being drawn, every key is its own (true): Enter, Delete, Esc
  // and the arrows do their thing, the rest nothing - no shortcuts behind it.
  key(e) {
    const ed = this.editor;
    if (!ed) return false;
    e.preventDefault?.();
    const k = editorKey(e);
    if (!k) return true;
    if (k.act === "move" || k.act === "resize") {
      // With nothing drawn yet, the arrows start from a box in the middle.
      const base = ed.rect ?? cleanRect({ x: 0.4, y: 0, w: 0.2, h: 0.15 });
      ed.rect = k.act === "move" ? moveRect(base, k.dx, k.dy) : resizeRect(base, k.dx, k.dy);
      this.draw();
      return true;
    }
    this.act(k.act);
    return true;
  }

  act(what) {
    const ed = this.editor;
    if (!ed) return;
    if (what === "save" || what === "clear") {
      const rect = what === "save" ? ed.rect : null;
      this.saved = { ...this.saved, [ed.role]: rect };
      saveSetting("blank", this.saved);
      this.toast(rect ? "Blank area kept - Shift + B to change it" : "No blank area", 2500);
    }
    const { doc, role } = ed;
    this.close();
    this.apply(doc, role);
    this.onChange(role);
  }

  // Takes the drawing away, keeping nothing.
  close() {
    const ed = this.editor;
    if (!ed) return;
    this.editor = null;
    ed.el.remove();
    ed.doc.body?.querySelector(":scope > .blank-area")?.removeAttribute("hidden");
  }

  // A window going (the controls window closing): its drawing goes with it.
  forget(doc) {
    if (this.editor?.doc === doc) this.close();
  }
}
