// A game controller on the PC (sim/gamepad.mjs says how it plays), read
// every frame: the right stick's swing shown on the swing pad as it's made
// and sent as the shot, the other buttons and the left stick as the game's
// own keys - and in the menu or a panel, the D-pad and the left stick
// moving round its buttons and boxes, A pressing the one picked (or
// changing a list or a slider with left and right), B going back, as Tab,
// Enter and the arrows would with a keyboard. A card asking something over
// the picture (the range's "Odd shot?", the graphics question) gets the D-pad and A
// the same way, but the sticks still aim and swing there and LB / RB still
// change club: a question left unanswered never stops play. Y opens the
// shot setup (shotsetupcard.js), itself a card: while it's open the left
// stick moves its spin dot instead of aiming, the D-pad's up and down its
// height (left and right the dot across), A is Done and X a plain shot -
// the right stick still swings. While a swing's being
// made the stick's read between frames too, so its rhythm is timed
// finely, and the controller gives a tap of rumble as the pull reaches a
// full swing (100%) and a stronger one at the most (105%).

import { StickSwing, STICK, BUTTONS, aimEvery, repeatsNow, pickPad, dotStep } from "./sim/gamepad.mjs";
import { KEY_STEP } from "./shotsetupcard.js";
import { JUST_RIGHT, MOST_PCT } from "./sim/mouseswing.mjs";

const FOCUSABLE = "button, input, select, textarea, a[href], summary, [tabindex]:not([tabindex='-1'])";
const LABEL = "Right stick: pull back, then push up through the ball";
// The stick's swing stays on the pad this long after the strike, with what
// it did under it (ms).
const SHOWN_MS = 1800;
// How often the stick's read between frames while a swing's being made (ms).
const FAST_MS = 8;
// The rumble as the pull reaches a full swing, and the most (ms, 0 - 1).
const RUMBLE = { full: { duration: 40, weakMagnitude: 0.55, strongMagnitude: 0.1 }, most: { duration: 70, weakMagnitude: 0.4, strongMagnitude: 0.6 } };

export class GamePad {
  // host:
  //   on()        whether the controller's used at all (the menu's setting)
  //   windows()   the windows to read it in: this one, and the controls
  //               window with the screens separate
  //   busy()      "test" while nothing may be done with it (the speed
  //               test), "video" while only B may (the game's video), or
  //               null
  //   what()      "putt", "swing", or null: nothing to hit just now
  //   pad         the swing pad (mouseswing.js), to show the swing on
  //   onSwing(swing)  a swing made (readSwing's numbers): returns the words
  //                   for what it did
  //   reading()   as a swing begins, what a full one carries and the
  //               flag's mark (mouseswing.js reading), or null
  //   setupWords()  the shot setup in a few words ("" for a plain shot)
  //   setup()     Y: the shot setup, open or closed
  //   setupCard() the shot setup while it's open (its moveDot, stepHeight,
  //               plain and show), or null
  //   rumble()    whether the controller may rumble (the menu's setting)
  //   quick       read the stick between frames while swinging (the game;
  //               not the tests, which keep their own time)
  //   key(key)    a key, as if pressed (app.js onKey)
  //   panel()     the open menu or panel, which has the controller while
  //               it's open (the sticks don't play), or null
  //   card()      a card asking something over the picture, whose buttons
  //               the D-pad and A work (the sticks still play), or null
  //   actions()   View: the controller panel open or closed (padpanel.js)
  //   wake()      something happened (the picture stops resting)
  //   toast(text) a word on the picture
  constructor(host) {
    this.host = host;
    this.stick = new StickSwing();
    this.held = new Map();
    this.aimLast = 0;
    this.navLast = 0;
    // The last frame the left stick moved the shot setup's dot (steer).
    this.steerLast = null;
    this.connected = null;
    this.shown = false;
    this.focused = null;
    this.reading = null;
    this.lastPct = 0;
    this.fast = null;
    // Turned away (nothing to hit): the stick's ignored until it's back in
    // the middle, so it's said once a pull, not every frame.
    this.refused = false;
  }

  // Each frame (now: ms).
  frame(now) {
    if (!this.host.on()) return this.forget();
    const pad = this.read();
    if (!pad) {
      if (this.connected) this.host.toast?.("Controller disconnected");
      this.forget();
      return;
    }
    if (this.connected !== pad.id) {
      this.connected = pad.id;
      this.host.toast?.("Controller ready - right stick to swing, View for every action");
    }
    const busy = this.host.busy?.() ?? null;
    const panel = busy ? null : this.host.panel?.() ?? null;
    const card = busy || panel ? null : this.host.card?.() ?? null;
    const setup = busy || panel ? null : this.host.setupCard?.() ?? null;
    this.buttons(pad, now, busy, panel, card, setup);
    if (busy) return this.drop();
    const [lx = 0, ly = 0, rx = 0, ry = 0] = pad.axes ?? [];
    if (panel) {
      this.drop();
      this.navigate(panel, ly, now);
      return;
    }
    if (setup) this.steer(setup, lx, ly, now);
    else {
      this.steerLast = null;
      this.aim(lx, now);
    }
    this.pad = pad;
    this.swing(rx, ry, now);
    this.quicken();
  }

  // While a swing's being made, the stick read between frames as well (a
  // frame can take 30 ms; a push through, not much more), until it's done.
  quicken() {
    if (!this.host.quick) return;
    const swinging = this.stick.phase !== "rest";
    if (swinging && !this.fast) {
      this.fast = setInterval(() => {
        if (this.stick.phase === "rest" || !this.host.on()) return this.slow();
        const pad = this.read2();
        if (!pad) return this.slow();
        const [, , rx = 0, ry = 0] = pad.axes ?? [];
        this.swing(rx, ry, performance.now());
      }, FAST_MS);
      this.fast.unref?.();
    } else if (!swinging) this.slow();
  }
  slow() {
    clearInterval(this.fast);
    this.fast = null;
  }
  // The controller now, for the reads between frames (null if it's gone).
  read2() {
    try {
      return this.read();
    } catch {
      return null;
    }
  }

  // Lets go of everything (the setting off, or the controller gone).
  forget() {
    this.connected = null;
    this.held.clear();
    this.refused = false;
    this.drop();
  }

  // A swing being made, dropped (a panel opened, the video began): no shot,
  // and off the pad.
  drop() {
    if (this.shown) this.showPad(null);
    this.stick.reset();
    this.reading = null;
    this.slow();
  }

  // The controller to use: the one last used, in whichever window the
  // browser gives it to.
  read() {
    const pads = [];
    for (const w of this.host.windows()) {
      try {
        pads.push(...(w?.navigator?.getGamepads?.() ?? []));
      } catch {
        // A window going away.
      }
    }
    return pickPad(pads);
  }

  // The buttons: each press once, the ones that repeat again while held.
  buttons(pad, now, busy, panel, card, setup = null) {
    for (const b of BUTTONS) {
      const btn = pad.buttons?.[b.index];
      const down = !!(btn?.pressed || (btn?.value ?? 0) > 0.5);
      const was = this.held.get(b.index);
      if (!down) {
        if (was) this.held.delete(b.index);
        continue;
      }
      if (!was) {
        this.held.set(b.index, { down: now, last: null });
        this.press(b, busy, panel, card, setup);
      } else if (b.repeat && repeatsNow(now, was.down, was.last)) {
        was.last = now;
        this.press(b, busy, panel, card, setup);
      }
    }
  }

  // A button: in the menu, a panel or a card, working its buttons (the shot
  // setup, its height, dot, Done and Plain shot); otherwise the game's key.
  // LB and RB go round a panel too, but on a card they're still the clubs.
  press(b, busy, panel, card, setup = null) {
    this.host.wake?.();
    if (busy === "test") return;
    if (busy === "video") {
      if (b.name === "B") this.host.key("Escape");
      return;
    }
    // View: the controller panel - every key's action as a button - open
    // or closed (app.js), wherever the controller is.
    if (b.name === "View" && this.host.actions) return this.host.actions();
    // Y: the shot setup, open or closed - outside the menu and panels.
    if (b.run === "setup") {
      if (!panel) this.host.setup?.();
      return;
    }
    if (setup && !panel) {
      const step = { "D-pad up": [0, 1], "D-pad down": [0, -1], "D-pad left": [-1, 0], "D-pad right": [1, 0] }[b.name];
      if (step) return step[1] ? setup.stepHeight(step[1]) : setup.moveDot(step[0] * KEY_STEP, 0);
      if (b.name === "A") return setup.show(false);
      if (b.name === "X") return setup.plain();
    }
    const root = panel ?? card;
    if (root) {
      if (b.name === "D-pad up" || (panel && b.name === "LB")) return this.move(root, -1);
      if (b.name === "D-pad down" || (panel && b.name === "RB")) return this.move(root, 1);
      if (b.name === "D-pad left" || b.name === "D-pad right") {
        const dir = b.name === "D-pad left" ? -1 : 1;
        if (!this.adjust(root, dir)) this.move(root, dir);
        return;
      }
      if (b.name === "A") return this.activate(root);
    }
    this.host.key(b.key);
  }

  // The left stick across: the aim, turning faster the further it's pushed.
  aim(x, now) {
    const every = aimEvery(x);
    if (!every || now - this.aimLast < every) return;
    this.aimLast = now;
    this.host.wake?.();
    this.host.key(x < 0 ? "ArrowLeft" : "ArrowRight");
  }

  // The left stick with the shot setup open: its dot, the further pushed
  // the faster (sim/gamepad.mjs dotStep).
  steer(setup, x, y, now) {
    const ms = this.steerLast == null ? 16 : now - this.steerLast;
    this.steerLast = now;
    const step = dotStep(x, y, ms);
    if (!step) return;
    this.host.wake?.();
    setup.moveDot(step.dx, step.dy);
  }

  // The left stick up and down in the menu or a panel: round its buttons.
  navigate(root, y, now) {
    const every = aimEvery(y);
    if (!every || now - this.navLast < Math.max(every, 140)) return;
    this.navLast = now;
    this.move(root, y < 0 ? -1 : 1);
  }

  // The right stick: the swing, shown on the swing pad as it's made.
  swing(x, y, now) {
    if (this.refused) {
      if (Math.hypot(x, y) < STICK.dead) this.refused = false;
      return;
    }
    const ev = this.stick.step(x, y, now);
    if (!ev) return;
    this.host.wake?.();
    if (ev.kind === "back" || ev.kind === "through") {
      if (!this.host.what()) {
        this.drop();
        this.refused = true;
        this.host.toast?.("Nothing to hit just now");
        return;
      }
      // What a full swing carries and the flag's mark: once, as it begins.
      if (!this.reading) {
        this.reading = this.host.reading?.() ?? {};
        this.lastPct = 0;
      }
      this.buzz(ev.pct);
      const push = ev.kind === "through" ? ev.push : 0;
      const setup = this.host.what() === "swing" ? (this.host.setupWords?.() ?? "") : "";
      this.showPad({ phase: ev.kind === "back" ? "pull" : "push", pull: (ev.pct / 100) * JUST_RIGHT, push, pointer: false, label: setup ? `${setup}: ${LABEL.toLowerCase()}` : LABEL, reading: this.reading });
      return;
    }
    if (ev.kind === "cancel") {
      this.reading = null;
      this.showPad(null);
      return;
    }
    // Struck: the shot, and what it did on the pad for a moment.
    const words = this.host.onSwing(ev.swing) ?? "";
    this.showPad({ phase: "struck", pull: (ev.swing.pct / 100) * JUST_RIGHT, words, pointer: false, label: "", reading: this.reading });
    this.reading = null;
    this.hideTimer = setTimeout(() => this.showPad(null), SHOWN_MS);
  }

  // A tap of rumble as the pull reaches a full swing, a stronger one at the
  // most a swing goes.
  buzz(pct) {
    const was = this.lastPct;
    this.lastPct = Math.max(was, pct);
    const at = was < 100 && pct >= 100 ? (pct >= MOST_PCT - 0.5 ? "most" : "full") : was < MOST_PCT - 0.5 && pct >= MOST_PCT - 0.5 ? "most" : null;
    if (!at || this.host.rumble?.() === false) return;
    try {
      this.pad?.vibrationActuator?.playEffect?.("dual-rumble", RUMBLE[at])?.catch?.(() => {});
    } catch {
      // A controller that can't.
    }
  }

  showPad(state) {
    clearTimeout(this.hideTimer);
    this.shown = !!state;
    this.host.pad?.demo(state);
  }

  // ---- Menus, panels and cards ----------------------------------------------------

  focusables(root) {
    return [...root.querySelectorAll(FOCUSABLE)].filter((el) => !el.disabled && el.offsetParent !== null && !el.closest("[hidden]"));
  }
  // The button or box picked: the one with the keyboard, when it's one of
  // root's (not root itself, or the menu's page, which takes the keyboard
  // as it opens).
  current(root) {
    const at = root.ownerDocument.activeElement;
    return at && at !== root && root.contains(at) && at.matches(FOCUSABLE) && !at.disabled ? at : null;
  }
  // The next (or previous) button or box round, marked as picked.
  move(root, dir) {
    const all = this.focusables(root);
    if (!all.length) return;
    const at = all.indexOf(this.current(root));
    const next = at < 0 ? all[dir > 0 ? 0 : all.length - 1] : all[(at + dir + all.length) % all.length];
    this.focus(next);
  }
  focus(el) {
    this.focused?.classList.remove("pad-focus");
    this.focused = el;
    el.classList.add("pad-focus");
    el.focus({ preventScroll: true });
    el.scrollIntoView?.({ block: "nearest" });
  }
  // Left and right on a list or a slider: its value along one.
  adjust(root, dir) {
    const el = this.current(root);
    if (!el) return false;
    if (el.matches("select")) {
      const i = Math.max(0, Math.min(el.options.length - 1, el.selectedIndex + dir));
      if (i === el.selectedIndex) return true;
      el.selectedIndex = i;
    } else if (el.matches("input[type=range], input[type=number]")) {
      if (dir > 0) el.stepUp();
      else el.stepDown();
    } else return false;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }
  // A: the one picked pressed (a list or slider moves on one). With nothing
  // picked yet, it picks the one to press - the main one (a card's Close),
  // else the first - so nothing's pressed unseen.
  activate(root) {
    const el = this.current(root);
    if (!el) {
      const all = this.focusables(root);
      const main = all.find((e) => e.matches(".primary")) ?? all[0];
      if (main) this.focus(main);
      return;
    }
    if (this.adjust(root, 1)) return;
    if (el.matches("input[type=text], input[type=search], input:not([type]), textarea")) return el.focus();
    el.click();
  }
}
