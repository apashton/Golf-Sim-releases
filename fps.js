// The frame rate on the picture (Shift + F, or the menu's Screens page):
// frames a second, the average frame and the slowest lately, and under them
// how many draw calls and triangles the last frame took and the graphics
// setting in use, small in the bottom right corner, for telling whether the
// picture stutters on this PC. Off until turned on, and remembered. The
// measuring is in sim/framerate.mjs; this only draws it.
//
// Measured all the time, readout or not: for the frame rate by view that
// a report carries (sim/framerate.mjs ViewTable), and for the safety valve
// (sim/safetyvalve.mjs, look/safety.js), which sheds detail between shots
// while the picture stays slow - High's extras, so High steps down to
// Medium, then Medium's, then the picture drawn smaller
// (look/renderscale.js) - and brings it back once there's room, never above
// the highest setting. With "Don't adjust automatically" it's left alone -
// but for while a recording is made (recordingGuard).

import { fpsRoom } from "./sim/gamelayout.mjs";
import { loadSetting, saveSetting } from "./util.js";
import { FrameMeter, frameRateText, frameRateShort, ViewTable, shadowRate } from "./sim/framerate.mjs";
import { SafetyValve, PHONE_VALVE } from "./sim/safetyvalve.mjs";
import { targetFps, thresholds, refreshText } from "./sim/refresh.mjs";
import { stepCount, setShed, shedLevel, shedNames, ladderSteps } from "./look/safety.js";
import { settingText, settingNow, shedForHighest, settledBetween, settleAdvice, slowWords, nextSetting, above, NAMES } from "./sim/graphics.mjs";

// The words are redrawn a few times a second, not every frame.
const REDRAW_MS = 250;

// Whether the valve may ease the picture though "Don't adjust
// automatically" is chosen: only while a recording is being made (the
// recording guard, FrameRate.frame).
export function recordingGuard({ fixed = false, recording = false } = {}) {
  return !!fixed && !!recording;
}

export class FrameRate {
  // view: the picture's element (the readout goes over it).
  // built: the setting the picture was built at (look/quality.js LEVEL);
  // highest: the highest setting allowed; fixed: "Don't adjust
  // automatically" - the picture is left as chosen however slow (and the
  // readout only says it's slow). scale(): the picture's size now (1, 0.85,
  // 0.7: app.js), for the words.
  // onSettle({ upper, lower }): the valve stopped switching back and forth
  // between two settings and stays on the lower - app.js asks, between
  // shots, whether to make it the highest.
  // onGuard(names): while recording with "Don't adjust automatically", the
  // picture was eased to keep up (names: what's shed), or (null) put back
  // as chosen now the recording's stopped.
  // picture(): the 3D picture's size as drawn, in words ("961 × 433").
  // compact: the frame rate alone (sim/framerate.mjs frameRateShort), the
  // whole readout while it's clicked or tapped open - everywhere now (the
  // owner, 5 November 2026, of the projector: "we get this long ass
  // message popping up and down. Can we minimise the FPS to just the FPS
  // like on mobile unless you click on it"). phone: the phone app - its
  // valve quicker down (PHONE_VALVE), its box in the strip between the
  // pads rather than at the head of the column down the right.
  // onEase(setting, built): the phone's valve has eased the picture down a
  // whole setting ("high" from "ultra"), for a word to say so.
  constructor(view, { built = "medium", highest = "high", fixed = false, scale = () => 1, onSettle = null, onGuard = null, onEase = null, picture = () => "", compact = false, phone = false } = {}) {
    this.picture = picture;
    this.built = built;
    // The setting chosen: the built one, until a lower highest brings it
    // down (the page is rebuilt at it on the next start).
    this.chosen = above(built, highest) ? highest : built;
    this.highest = highest;
    this.fixed = !!fixed;
    this.scale = scale;
    this.onSettle = onSettle;
    this.onGuard = onGuard;
    this.guarded = false;
    this.meter = new FrameMeter();
    this.table = new ViewTable();
    // (On the phone quicker down, slower back up: sim/safetyvalve.mjs
    // PHONE_VALVE.)
    this.valve = new SafetyValve(0, phone ? PHONE_VALVE : {});
    this.onEase = onEase;
    this.easedTo = built;
    // The screen's refresh rate ({ hz, how }: sim/refresh.mjs), once known,
    // and what the valve aims at from it (60 until then).
    this.refresh = null;
    this.target = targetFps(null);
    // Where the valve last settled, and the advice for it.
    this.settled = null;
    this.advice = "";
    this.draws = null;
    // When frames drew a shadow map again, over the last second.
    this.shadowTimes = [];
    // (And the frames that drew the water's reflections.)
    this.reflectionTimes = [];
    this.el = document.createElement("div");
    this.el.className = "fps-readout";
    this.el.setAttribute("aria-hidden", "true");
    this.compact = !!compact;
    this.phone = !!phone;
    this.opened = false;
    if (this.compact) {
      this.el.classList.add("compact");
      this.el.title = "Click for the rest: the frame time, the slowest frame, what each frame draws, the picture and the setting";
      // (A tap opens or closes it - never an aim drag on the picture under it.)
      this.el.addEventListener("pointerdown", (e) => e.stopPropagation());
      this.el.addEventListener("click", (e) => {
        e.stopPropagation();
        this.opened = !this.opened;
        this.el.classList.toggle("open", this.opened);
        this.el.title = this.opened ? "Click for just the frame rate" : "Click for the rest: the frame time, the slowest frame, what each frame draws, the picture and the setting";
        this.drawnAt = -Infinity;
        // (Shut again, the column under it moves back up.)
        this.tallest = 0;
        if (this.resting) this.el.textContent = this.restText();
      });
    }
    view.appendChild(this.el);
    // The column down the right starts under the box (sim/gamelayout.mjs
    // fpsRoom): its height as it changes, and whether Arrange has moved it.
    this.view = view;
    this.room();
    if (typeof ResizeObserver === "function") new ResizeObserver(() => this.room()).observe(this.el);
    if (typeof MutationObserver === "function") new MutationObserver(() => this.room()).observe(this.el, { attributes: true, attributeFilter: ["style", "hidden", "data-ga-moved"] });
    this.drawnAt = -Infinity;
    this.resting = false;
    this.set(loadSetting("fps", { on: false }).on, { save: false });
  }

  // The picture resting while nothing moves (sim/stillpicture.mjs): the
  // readout says so, rather than the last numbers, and measuring starts
  // afresh when it's drawn again (the rest isn't a slow frame).
  rest(on) {
    if (on === this.resting) return;
    this.resting = on;
    this.meter.reset();
    this.drawnAt = -Infinity;
    if (on && this.on) this.el.textContent = this.restText();
  }

  // What it says while the picture rests: shortest on the phone, closed.
  restText() {
    return this.compact && !this.opened ? frameRateShort(null, { resting: true }) : `Resting: nothing moving, not redrawing\n${this.setting}`;
  }

  get on() {
    return !this.el.hidden;
  }

  // The room the column down the right leaves for the box at its head
  // (--fps-h: style.css) - its height as drawn (bigger when made so on
  // Arrange), the tallest it's been since it was turned on or sized, so
  // the hole map doesn't jump as a line comes and goes (resting); none
  // when moved to a place of its own (gamearrange.js data-ga-moved).
  room() {
    const scale = this.el.style.scale;
    if (!this.on || scale !== this.roomScale) this.tallest = 0;
    this.roomScale = scale;
    if (this.on) this.tallest = Math.max(this.tallest ?? 0, this.el.getBoundingClientRect?.().height ?? 0);
    const px = fpsRoom({ on: this.on, compact: this.phone, moved: "gaMoved" in (this.el.dataset ?? {}), size: this.tallest });
    this.view?.style?.setProperty("--fps-h", `${px}px`);
  }

  set(on, { save = true } = {}) {
    this.el.hidden = !on;
    this.drawnAt = -Infinity;
    this.el.textContent = on ? (this.compact && !this.opened ? frameRateShort(null) : frameRateText(null)) : "";
    if (save) saveSetting("fps", { on: !!on });
  }

  toggle() {
    this.set(!this.on);
    return this.on;
  }

  // The setting in use, in words: "High", "High → Medium, picture 85%"...
  get setting() {
    return settingText({ built: this.built, steps: ladderSteps(), shed: shedLevel(), scale: this.scale() });
  }

  // The setting the picture is drawing now ("high", "medium"...).
  get now() {
    return settingNow({ built: this.built, steps: ladderSteps(), shed: shedLevel() });
  }

  // "Don't adjust automatically": on, everything shed comes back at once
  // and stays (but for a setting above the one chosen); off, the valve
  // takes over again from there.
  setFixed(on) {
    this.fixed = !!on;
    this.sizeValve();
    if (this.fixed) setShed(this.valve.least);
    this.valve.level = shedLevel();
    this.drawnAt = -Infinity;
  }

  // A new highest setting: a chosen setting above it comes down to it
  // (as sim/graphics.mjs chooseHighest saves it), and a picture built
  // above that sheds the extras now - High draws Medium's picture - and
  // keeps them shed.
  setHighest(highest) {
    this.highest = highest;
    if (above(this.chosen, highest)) this.chosen = highest;
    this.sizeValve();
    if (shedLevel() < this.valve.least) setShed(this.valve.least);
    this.valve.level = shedLevel();
    this.drawnAt = -Infinity;
  }

  // The screen's refresh rate is known ({ hz, how }): the valve aims at
  // it (up to 60), stepping down below three quarters of it and back up
  // near it (sim/refresh.mjs).
  setRefresh(known) {
    this.refresh = known?.hz ? { hz: known.hz, how: known.how } : null;
    this.target = targetFps(this.refresh?.hz);
    Object.assign(this.valve, thresholds(this.target));
    this.drawnAt = -Infinity;
  }

  // The valve's steps (registered by the parts of the picture that bring
  // them, so sized as it's used), and the fewest it may shed: the extras
  // of a setting above the one chosen, and where it settled after
  // switching back and forth.
  sizeValve() {
    const v = this.valve;
    v.steps = stepCount();
    v.level = Math.min(v.level, v.steps);
    const overChosen = shedForHighest(ladderSteps(), this.chosen);
    v.least = Math.min(v.steps, Math.max(overChosen, this.fixed ? 0 : (v.settled ?? 0)));
  }

  // Every frame, after it's drawn, with the animation loop's time (ms) and
  // what the frame was:
  //   draws: { calls, triangles, shadows, reflections... } (the renderer's
  //   count for the frame: look/gpu.js frameDraws)
  //   view: which view it was (sim/framerate.mjs viewOf), recording: whether
  //   a recording was being made
  //   play: being played (no menu or welcome over it), cut: a camera cut or
  //   a new scene, between: no ball in the air (when the valve may step)
  frame(time, { draws = null, view = null, recording = false, play = true, cut = false, between = true } = {}) {
    this.meter.tick(time);
    this.draws = draws;
    if (draws?.shadows > 0) this.shadowTimes.push(time);
    if (draws?.reflections > 0) this.reflectionTimes.push(time);
    // (Trimmed every frame, the box shown or not.)
    const shadowsRate = shadowRate(this.shadowTimes, time);
    const reflectionsRate = shadowRate(this.reflectionTimes, time);
    this.table.add(time, view, recording, { calls: draws?.calls ?? 0, triangles: draws?.triangles ?? 0, setting: this.setting });
    // The recording guard (the owner's freezes, #325 and #326: Ultra drawn
    // slowly while recording, with "Don't adjust automatically", until the
    // graphics card stalled and the recording stopped): while a recording
    // is made, the valve works whatever that setting - only on a picture
    // that stays slow, between shots, as ever - and what it shed comes back
    // as the recording stops.
    const guard = recordingGuard({ fixed: this.fixed, recording });
    if (this.wasGuard && !guard) this.unguard();
    this.wasGuard = guard;
    if (!this.fixed || guard) {
      if (this.valve.steps !== stepCount()) this.sizeValve();
      const stats = this.meter.stats();
      // (Not until there's most of a second to go on.)
      const fps = stats && stats.span >= 900 ? stats.fps : null;
      if (this.valve.frame(time, fps, { play, cut, between })) {
        setShed(this.valve.level);
        // A whole setting eased (down only): said once each.
        const now = settingNow({ built: this.built, steps: ladderSteps(), shed: shedLevel() });
        if (now !== this.easedTo) {
          if (above(this.easedTo, now)) this.onEase?.(now, this.built);
          this.easedTo = now;
        }
        if (guard && this.valve.level > this.valve.least) {
          this.guarded = true;
          this.onGuard?.(shedNames());
        }
      }
      if (!guard && this.valve.settled !== this.settled) this.settle();
    }
    if (!this.on || time - this.drawnAt < REDRAW_MS) return;
    this.drawnAt = time;
    const next = nextSetting(this.chosen, this.highest);
    if (this.compact && !this.opened) {
      this.el.textContent = frameRateShort(this.meter.stats());
      return;
    }
    this.el.textContent = frameRateText(this.meter.stats(), {
      slow: slowWords({ built: this.built, fixed: this.fixed, spent: this.valve.spent, next }),
      draws,
      shadowRate: shadowsRate,
      reflectionRate: reflectionsRate,
      picture: this.picture(),
      setting: this.setting,
      advice: this.advice,
      low: this.valve.slowFps,
      aim: this.target,
    });
  }

  // The recording's stopped: a picture eased for it, with "Don't adjust
  // automatically", put back as chosen (and the slow time it built up
  // forgotten, so the next recording starts afresh).
  unguard() {
    this.valve.slow = 0;
    this.valve.fast = 0;
    if (!this.guarded) return;
    this.guarded = false;
    setShed(this.valve.least);
    this.valve.level = shedLevel();
    this.drawnAt = -Infinity;
    this.onGuard?.(null);
  }

  // The valve has stopped switching back and forth over a step and stays
  // below it: between two settings, that's advice and a question.
  settle() {
    this.settled = this.valve.settled;
    const between = settledBetween(ladderSteps(), this.settled);
    if (!between) return;
    this.advice = settleAdvice(between);
    this.onSettle?.(between);
  }

  // For a report: the setting and what's shed, the highest, whether it's
  // left alone, any advice, and the frame rate by view.
  report() {
    return {
      setting: this.setting,
      built: NAMES[this.built] ?? this.built,
      chosen: NAMES[this.chosen] ?? this.chosen,
      highest: NAMES[this.highest] ?? this.highest,
      fixed: this.fixed,
      shed: shedNames(),
      steps: stepCount(),
      advice: this.advice,
      screen: refreshText(this.refresh),
      target: this.target,
      slowFps: this.valve.slowFps,
      fastFps: this.valve.fastFps,
      views: this.table.list(),
      // The last frame's count, its parts apart (look/gpu.js frameDraws).
      lastDraws: this.draws,
    };
  }
}
