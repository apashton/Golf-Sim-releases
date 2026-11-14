// The touch screen's controls (sim/touchcontrols.mjs has the rules): on
// the other side of the picture from the swing pad, a strip with the club
// (▲ ▼), the aim (◀ ▶, held to keep turning), a few buttons for what's
// useful just then, and More - every other key's action as a button (the
// controller panel); and a finger drawn across the picture turns the aim.
// Each does what its key does (app.js pressKey), so it works wherever that
// key does. app.js says when it shows (on) and keeps it up to date.

import { aimsNow, clubsNow, placingNow, drivesNow, DRIVE_TOUCH, touchActions, dragSteps, isAimDrag, REPEAT } from "./sim/touchcontrols.mjs";

// The finger kept by the element it pressed, wherever it goes (not when
// it's already been lifted).
function capture(el, e) {
  try {
    el.setPointerCapture(e.pointerId);
  } catch {
    // (Gone already.)
  }
}

export class TouchControls {
  // view: the picture's element (the strip goes in it); canvas: the game's
  // picture (a finger drawn across it turns the aim). context(): what's
  // going on (app.js hintContext). press(key, shift): that key pressed.
  // club(): the club in hand's name. on(): whether it's touch play (the
  // strip's there to show). idle(): nothing to hit just now - the strip
  // stands aside (the phone before a round: the side panel has the course,
  // the game and Start round - the owner, 1 November 2026). side(): the
  // swing pad's side - the strip goes on the other. more(): More, every
  // other key's action (the controller panel, padpanel.js).
  constructor({ view, canvas, doc = document, context, press, club = () => "", on = () => false, idle = () => false, side = () => "left", more = () => {} }) {
    this.doc = doc;
    this.context = context;
    this.press = press;
    this.club = club;
    this.on = on;
    this.idle = idle;
    this.side = side;
    this.shown = false;
    this.actionsKey = "";
    this.el = doc.createElement("div");
    this.el.className = "touch-strip";
    this.el.hidden = true;
    this.el.innerHTML = `
      <div class="ts-club"><span class="ts-name"></span><div class="ts-row"><button type="button" class="ts-up" aria-label="A longer club" title="A longer club (↑)">▲</button><button type="button" class="ts-down" aria-label="A shorter club" title="A shorter club (↓)">▼</button></div></div>
      <div class="ts-row ts-aim"><button type="button" class="ts-left" aria-label="Aim left" title="Aim left (←) - hold to keep turning, or draw a finger across the picture">◀</button><span>Aim</span><button type="button" class="ts-right" aria-label="Aim right" title="Aim right (→) - hold to keep turning, or draw a finger across the picture">▶</button></div>
      <div class="ts-actions"></div>
      <button type="button" class="ts-more" title="Everything else a key does, as buttons - the modes, the camera, the replay, sound, bay view...">More</button>`;
    view.appendChild(this.el);
    this.q = (s) => this.el.querySelector(s);
    // The club: a tap, a step.
    this.q(".ts-up").addEventListener("click", () => this.key("ArrowUp"));
    this.q(".ts-down").addEventListener("click", () => this.key("ArrowDown"));
    // The aim: a step at once, then on while it's held.
    for (const [sel, key] of [
      [".ts-left", "ArrowLeft"],
      [".ts-right", "ArrowRight"],
    ]) this.holdable(this.q(sel), key);
    this.q(".ts-actions").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-key]");
      if (b) this.key(b.dataset.key, b.dataset.shift === "1");
    });
    this.q(".ts-more").addEventListener("click", () => more());
    // (A button tapped doesn't keep the keyboard: Space would press it
    // again.)
    this.el.addEventListener("click", (e) => e.target.closest("button")?.blur());
    // Not the page's own long-press menus or text picks.
    this.el.addEventListener("contextmenu", (e) => e.preventDefault());
    this.dragging(canvas);
    this.refresh();
  }

  // A key pressed for a button, and the strip brought up to date with what
  // it did (a new club, a button that goes now it's done).
  key(key, shift = false) {
    this.press(key, shift);
    clearTimeout(this.soon);
    this.soon = setTimeout(() => this.refresh(), 60);
  }

  holdable(btn, key) {
    let timer = null;
    let pressed = false;
    const stop = () => {
      clearTimeout(timer);
      clearInterval(timer);
      timer = null;
      btn.classList.remove("held");
    };
    btn.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      stop();
      pressed = true;
      capture(btn, e);
      btn.classList.add("held");
      this.press(key, false);
      timer = setTimeout(() => (timer = setInterval(() => this.press(key, false), REPEAT.every)), REPEAT.wait);
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) btn.addEventListener(type, stop);
    // The click after a press is that press; one without (a keyboard's
    // Enter or Space on it) is a step of its own.
    btn.addEventListener("click", () => {
      if (!pressed) this.press(key, false);
      pressed = false;
    });
  }

  // A finger drawn across the picture: the aim follows it, a step for so
  // far sideways (sim/touchcontrols.mjs dragSteps). Touch only - a mouse
  // on the picture does what it did.
  dragging(canvas) {
    if (!canvas) return;
    let drag = null;
    canvas.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "touch" || !this.shown || drag) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, aiming: false, carry: 0 };
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      if (!drag.aiming) {
        if (!isAimDrag(dx, e.clientY - drag.y) || !aimsNow(this.context())) return;
        drag.aiming = true;
        capture(canvas, e);
      }
      const { steps, carry } = dragSteps(dx, drag.carry);
      drag.x = e.clientX;
      drag.carry = carry;
      // (However fast it's drawn, a handful at a time.)
      for (let i = 0; i < Math.min(Math.abs(steps), 8); i++) this.press(steps > 0 ? "ArrowRight" : "ArrowLeft", false);
    });
    const end = (e) => {
      if (drag && e.pointerId === drag.id) drag = null;
    };
    for (const type of ["pointerup", "pointercancel"]) canvas.addEventListener(type, end);
  }

  // Shown or not, and what's in it, as things are now - called every so
  // often by app.js, and after a button's press.
  refresh() {
    const on = !!this.on();
    if (on !== this.shown) {
      this.shown = on;
      this.doc.body.classList.toggle("touch-play", on);
    }
    // (Standing aside: the room it keeps given back - phoneplay.css.)
    const idle = on && !!this.idle();
    this.el.hidden = !on || idle;
    this.doc.body.classList.toggle("play-idle", idle);
    if (!on || idle) return;
    this.el.classList.toggle("left", this.side() === "right");
    let ctx = null;
    try {
      ctx = this.context();
    } catch {
      // (Before the page has finished setting up.)
    }
    // (A drop's spot being chosen: ▲ ▼ take it further back or nearer, ◀ ▶
    // across - the arrows' - course/dropspot.js.)
    const placing = placingNow(ctx);
    // (Between holes, the cart watched: ▲ takes its wheel, then ▲ ▼ are
    // its speed and ◀ ▶ its wheel - course/buggy.js driveKey.)
    const drive = placing ? null : drivesNow(ctx);
    const clubs = clubsNow(ctx) && !placing && !drive;
    this.q(".ts-club").hidden = !clubs && !placing && !drive;
    if (clubs || placing || drive) this.q(".ts-name").textContent = drive ? DRIVE_TOUCH[drive] : placing ? "Back · nearer" : this.club();
    this.q(".ts-aim").hidden = !aimsNow(ctx) && !placing && drive !== "drive";
    this.q(".ts-aim > span").textContent = drive ? DRIVE_TOUCH.steer : placing ? "Across" : "Aim";
    this.el.classList.toggle("driving", !!drive);
    const actions = touchActions(ctx);
    const key = actions.map((a) => a.id).join();
    if (key !== this.actionsKey) {
      this.actionsKey = key;
      const box = this.q(".ts-actions");
      box.replaceChildren(
        ...actions.map((a) => {
          const b = this.doc.createElement("button");
          b.type = "button";
          b.textContent = a.label;
          b.title = a.title;
          b.dataset.key = a.press.key;
          b.dataset.shift = a.press.shift ? "1" : "0";
          return b;
        }),
      );
    }
  }
}
