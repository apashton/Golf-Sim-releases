// The shot setup on the screen (sim/shotsetup.mjs): a card by the swing pad
// with the next shot's curve, spin and height, for a made-up swing - opened
// by a game controller's Y (gamepad.js) or the swing pad's Shot button
// (mouseswing.js). The owner, 30 October 2026: "We need a visual guide for
// the ball spin, a small element is free but extreme spins indicate the
// swing will penalise more if the shot is wrong. Height needs to be a
// vertical bar, same...". So:
//   - a ball with a dot on it: across, the curve; down, more backspin (up,
//     less) - dragged with a finger or the mouse, the arrow keys when it's
//     picked, a controller's left stick (gamepad.js);
//   - beside it a bar, the height: its marker dragged up or down, the
//     arrow keys, a controller's D-pad;
//   - each green in the middle (a little costs nothing), amber, then red
//     to the edge, the dot and the marker coloured by where they are, and
//     each's risk said under it. Under them, what it costs: a set-up shot
//     makes a crooked swing more crooked (sim/skills.mjs setupHarshness),
//     the more the further out.
// Y, B or Done closes it; Plain shot (a controller's X) puts both back in
// the middle. It lasts the one shot: after a made-up swing it's plain again
// (app.js). A putt has none.

import { PLAIN, FREE, SOME_RISK, cleanSetup, isPlain, setupWords, setupRisk, riskTone, RISK_WORDS, dotOf, barOf, withDot, withBar, shapeName, heightName, spinName } from "./sim/shotsetup.mjs";

// The ball's size in its picture (120 across), and where its zones change:
// free to FREE of the way out, some risk to halfway from there to the edge
// (sim/shotsetup.mjs SOME_RISK), high beyond.
const BALL_R = 54;
const SOME_AT = FREE + SOME_RISK * (1 - FREE);
// An arrow key's step, and the D-pad's: a tenth of the way to the edge.
export const KEY_STEP = 0.1;

// The bar's zones top to bottom, as the ball's: high, some, free, some, high.
function barZones() {
  const a = ((1 - SOME_AT) / 2) * 100;
  const b = ((1 - FREE) / 2) * 100;
  return `linear-gradient(to bottom, var(--risk-high) 0 ${a}%, var(--risk-some) ${a}% ${b}%, var(--risk-free) ${b}% ${100 - b}%, var(--risk-some) ${100 - b}% ${100 - a}%, var(--risk-high) ${100 - a}%)`;
}

export class ShotSetupCard {
  // hand(): "right" or "left", the player's (a left-hander's draw curves
  // right); near(): { near, wedge } - near the green with a wedge (a
  // punch is a bump and run there, very high a flop); onChange(setup):
  // the setup changed (shown on the swing pad); price(setup): what it
  // makes harder, in words ("" for none).
  constructor({ doc = document, parent = doc.body, hand = () => "right", near = () => ({}), onChange = () => {}, price = () => "" }) {
    this.hand = hand;
    this.near = near;
    this.onChange = onChange;
    this.price = price;
    this.value = { ...PLAIN };
    // The controller's dot between steps, unrounded (moveDot).
    this.dot = null;
    this.drag = null;
    this.el = doc.createElement("div");
    this.el.className = "corner-card shot-setup";
    this.el.hidden = true;
    this.el.setAttribute("role", "dialog");
    this.el.setAttribute("aria-label", "Shot setup");
    parent.append(this.el);
    this.el.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.act === "plain") this.plain();
      if (b.dataset.act === "done") this.show(false);
    });
    // The dot and the marker: pressed where they're to go, and dragged.
    this.el.addEventListener("pointerdown", (e) => {
      const pad = e.target.closest?.("[data-pad]");
      if (!pad || (e.pointerType === "mouse" && e.button !== 0)) return;
      e.preventDefault();
      pad.focus?.({ preventScroll: true });
      try {
        pad.setPointerCapture(e.pointerId);
      } catch {
        // (Lifted already.)
      }
      this.drag = { id: e.pointerId, pad };
      this.point(pad, e);
    });
    this.el.addEventListener("pointermove", (e) => {
      if (this.drag?.id === e.pointerId) this.point(this.drag.pad, e);
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
      this.el.addEventListener(type, (e) => {
        if (this.drag?.id === e.pointerId) this.drag = null;
      });
    // The arrow keys on the one picked (not the game's: no aiming), Home
    // its middle.
    this.el.addEventListener("keydown", (e) => {
      const pad = e.target.closest?.("[data-pad]");
      const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1], Home: [0, 0] }[e.key];
      if (!pad || !step) return;
      e.preventDefault();
      e.stopPropagation();
      if (pad.dataset.pad === "ball") {
        const d = dotOf(this.value);
        this.set(e.key === "Home" ? { ...this.value, shape: 0, spin: 0 } : withDot(this.value, d.x + step[0] * KEY_STEP, d.y + step[1] * KEY_STEP));
      } else if (e.key === "Home") this.set({ ...this.value, height: 0 });
      else if (step[1]) this.stepHeight(-step[1]);
    });
  }

  get open() {
    return !this.el.hidden;
  }
  get setup() {
    return { ...this.value };
  }

  show(on = !this.open) {
    if (on) this.draw();
    this.el.hidden = !on;
    this.drag = null;
    if (!on && this.el.contains(this.el.ownerDocument.activeElement)) this.el.ownerDocument.activeElement.blur();
  }

  set(setup) {
    this.value = cleanSetup(setup);
    this.dot = null;
    this.update();
    this.onChange(this.setup);
  }
  // Both back in the middle.
  plain() {
    this.set({ ...PLAIN });
  }

  // The controller's: the dot moved by so much of the ball (the left stick,
  // a little each frame - kept unrounded between, so a slow push still gets
  // there), and the height a step up (1) or down (-1) (the D-pad).
  moveDot(dx, dy) {
    const at = this.dot ?? dotOf(this.value);
    let x = at.x + dx;
    let y = at.y + dy;
    const r = Math.hypot(x, y);
    if (r > 1) {
      x /= r;
      y /= r;
    }
    this.set(withDot(this.value, x, y));
    this.dot = { x, y };
  }
  stepHeight(dir) {
    this.set(withBar(this.value, barOf(this.value) - (dir * KEY_STEP) / 2));
  }

  // Plain again (after the shot).
  reset() {
    if (isPlain(this.value) && !this.open) return;
    this.value = { ...PLAIN };
    this.dot = null;
    this.show(false);
    this.onChange(this.setup);
  }

  // The shot in a few words, for the swing pad: "Punch, draw" ("" plain).
  words() {
    return setupWords(this.value, { hand: this.hand(), ...this.near() });
  }

  // A press or a drag on the ball or the bar: the dot or the marker there.
  point(pad, e) {
    const r = pad.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const fx = (e.clientX - r.left) / r.width;
    const fy = (e.clientY - r.top) / r.height;
    const k = 60 / BALL_R;
    if (pad.dataset.pad === "ball") this.set(withDot(this.value, (fx * 2 - 1) * k, (fy * 2 - 1) * k));
    else this.set(withBar(this.value, fy));
  }

  draw() {
    // (A left-hander's draw curves right.)
    const [left, right] = this.hand() === "left" ? ["Fade", "Draw"] : ["Draw", "Fade"];
    const zone = (reach, tone) => `<circle r="${(reach * BALL_R).toFixed(1)}" class="setup-zone ${tone}"/>`;
    this.el.innerHTML = `<div class="shot-setup-head"><b>Shot setup</b> <span class="small muted shot-setup-words"></span></div>
      <div class="shot-setup-pads">
        <div class="setup-box">
          <span class="setup-tag">Less spin</span>
          <div class="setup-ball-row">
            <span class="setup-tag" title="Curves left">◀ ${left}</span>
            <svg class="setup-ball" data-pad="ball" viewBox="-60 -60 120 120" tabindex="0" role="slider" aria-label="Spin: drag the dot - across curves it, lower spins it more, higher less">
              <circle r="${BALL_R}" class="setup-ball-face"/>${zone(1, "high")}${zone(SOME_AT, "some")}${zone(FREE, "free")}
              <line x1="-${BALL_R}" x2="${BALL_R}" class="setup-cross"/><line y1="-${BALL_R}" y2="${BALL_R}" class="setup-cross"/>
              <circle r="7.5" class="setup-dot"/>
            </svg>
            <span class="setup-tag" title="Curves right">${right} ▶</span>
          </div>
          <span class="setup-tag">More spin</span>
          <span class="setup-risk" data-risk="ball"></span>
        </div>
        <div class="setup-box">
          <span class="setup-tag">High</span>
          <div class="setup-bar" data-pad="height" tabindex="0" role="slider" aria-label="Height: drag the marker - up higher, down lower" aria-valuemin="-2" aria-valuemax="2" style="background: ${barZones()}"><span class="setup-mark"></span></div>
          <span class="setup-tag">Low</span>
          <span class="setup-risk" data-risk="height"></span>
        </div>
      </div>
      <p class="small shot-setup-price"></p>
      <p class="small muted shot-setup-help">For the next shot only, aimed to land where you're aiming. The green middle of each costs nothing; further out, amber then red, a crooked swing goes more crooked (Trajectory skill points take back what height and spin add). Drag the dot and the marker - on a controller, the left stick and the D-pad; A done, X plain.</p>
      <div class="buttons"><button type="button" data-act="plain">Plain shot</button><button type="button" class="primary" data-act="done">Done</button></div>`;
    this.update();
  }

  // The dot, the marker, their risks and the words as the setup is
  // (changed in place, so a drag carries on).
  update() {
    const v = this.value;
    const risk = setupRisk(v);
    const tones = { ball: riskTone(risk.ball), height: riskTone(risk.height) };
    const dot = this.el.querySelector(".setup-dot");
    if (dot) {
      const at = dotOf(v);
      dot.setAttribute("cx", (at.x * BALL_R).toFixed(1));
      dot.setAttribute("cy", (at.y * BALL_R).toFixed(1));
      dot.dataset.tone = tones.ball;
      this.el.querySelector(".setup-ball").setAttribute("aria-valuetext", `${shapeName(v.shape, this.hand())}, ${spinName(v.spin).toLowerCase()}`);
    }
    const mark = this.el.querySelector(".setup-mark");
    if (mark) {
      mark.style.top = `${barOf(v) * 100}%`;
      mark.dataset.tone = tones.height;
      const bar = this.el.querySelector(".setup-bar");
      bar.setAttribute("aria-valuenow", String(v.height));
      bar.setAttribute("aria-valuetext", heightName(v.height, this.near()));
    }
    for (const [k, name] of [
      ["ball", "Spin"],
      ["height", "Height"],
    ]) {
      const el = this.el.querySelector(`[data-risk="${k}"]`);
      if (!el) continue;
      el.dataset.tone = tones[k];
      el.textContent = `${name}: ${RISK_WORDS[tones[k]]}`;
    }
    const words = this.el.querySelector(".shot-setup-words");
    if (words) words.textContent = this.words() || "A plain shot";
    const price = this.el.querySelector(".shot-setup-price");
    if (price) {
      const p = this.price(v);
      price.textContent = p ? `Harder: ${p}` : "No harder than your level";
    }
  }
}
