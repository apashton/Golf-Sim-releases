// The speed test in the page (sim/speedtest.mjs says what it is): from the
// menu's Screens page, the same 30-second fly-through at Standard, Medium
// and High in turn, one score each. A setting needs a reload, so the run's
// plan is kept for the session (sessionStorage) and the page loads at each
// setting in turn; the owner's own graphics are put back at the end (or
// when Esc stops it), and the scores shown on a card and kept (the last
// few runs, in the setting "speedTests", and in a report to Claude). While
// it runs nothing else happens: no tips or toasts, keys but Esc do
// nothing, shots are ignored, and no setting is saved (util.js
// holdSettings).

import { SPEED_TEST, SpeedMeter, graphicsFor, newPlan, planNext, planAfter, cleanPlan, cleanHistory, withRun, runText, scoreWords, rehearsalTimes, costsFrom, momentWords, speedTestHole, combineHoles, holeName } from "./sim/speedtest.mjs";
import { ladderSteps, shedOne } from "./look/safety.js";
import { holdSettings, esc } from "./util.js";
import { waitForCard } from "./look/gpu.js";
// Each setting by its name.
import { NAMES } from "./sim/graphics.mjs";

const PLAN_KEY = "golfsim.speedTest";
const DONE_KEY = "golfsim.speedTestDone";
const HISTORY_KEY = "golfsim.speedTests";
const GRAPHICS_KEY = "golfsim.graphics";

function read(store, key) {
  try {
    const raw = store.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function write(store, key, value) {
  try {
    if (value == null) store.removeItem(key);
    else store.setItem(key, JSON.stringify(value));
  } catch {
    // Not kept: the run can't go on across a reload (it ends on the next).
  }
}

// A hole's longest frames, the longest first (at most five).
const worstLong = (list = []) => [...(list ?? [])].sort((a, b) => b.ms - a.ms).slice(0, 5);

// Two frames: whatever was just put on screen has been painted.
const nextPaint = () =>
  new Promise((done) => {
    if (typeof requestAnimationFrame !== "function") return done();
    requestAnimationFrame(() => requestAnimationFrame(() => done()));
  });

export class SpeedTest {
  // host:
  //   setMode(name), course: the course mode (showSpeedTest), renderer
  //   view: the picture's element (the caption and the card go over it)
  //   busy(): what a reload would end ("the round in progress"), or null
  //   quiet(): everything else stopped and hushed for the run
  //   reload(), toast(text, ms)
  //   facts(): { gpu, hz, target } - the graphics card, the screen's rate
  //   and what the safety valve aims at (sim/refresh.mjs)
  constructor(host) {
    this.host = host;
    this.running = false;
    this.plan = null;
    this.meter = null;
    this.t0 = null;
    this.caption = null;
    this.card = null;
    this.shownAt = 0;
  }

  // The runs kept, newest first.
  get history() {
    return cleanHistory(read(localStorage, HISTORY_KEY));
  }

  // The menu row's words: the last run.
  note() {
    const last = this.history[0];
    if (!last) return "";
    const day = new Date(last.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    return `Last run ${day}: ${runText(last)}`;
  }

  // From the menu: a run, each setting in turn.
  offer() {
    const why = this.host.busy?.();
    if (why && !confirm(`The speed test reloads A² Golf for each setting, which ends ${why}. Run it now?`)) return "";
    const plan = newPlan(read(localStorage, GRAPHICS_KEY), Date.now());
    write(sessionStorage, PLAN_KEY, plan);
    this.load(plan);
    return "Speed test: about six minutes";
  }

  // The page loaded again at the plan's next setting.
  load(plan) {
    write(localStorage, GRAPHICS_KEY, graphicsFor(plan.keep, planNext(plan)));
    this.host.reload();
  }

  // After every load, once the loading screen has gone: a run under way
  // carries on, and one just finished (or stopped) says so.
  resume() {
    const done = read(sessionStorage, DONE_KEY);
    if (done) {
      write(sessionStorage, DONE_KEY, null);
      if (done.stopped) this.host.toast(done.stopped, 4000);
      else this.showResults(done);
      return;
    }
    const plan = cleanPlan(read(sessionStorage, PLAN_KEY));
    if (!plan) return;
    if (!planNext(plan)) return this.finish(plan);
    this.run(plan).catch((err) => {
      console.error("Speed test:", err);
      this.abort(`The speed test couldn't run: ${err?.message ?? err}`);
    });
  }

  async run(plan) {
    this.plan = plan;
    holdSettings();
    this.running = true;
    this.host.quiet?.();
    this.showCaption();
    this.host.setMode("course");
    // Every hole built first, out of sight (course.js prepareSpeedTest; the
    // owner: "pre build the necessary holes and area for each before
    // initiating the run"): moving on to the next is then a swap, nothing
    // built - and nothing holding the page - while the test runs.
    this.loading = true;
    try {
      // Each kind of hole's course made in a moment of its own, the card
      // painted before each (the three together held the page about 9 s
      // on the owner's PC: the owner's report, 20 October 2026).
      const holes = [];
      for (let i = 0; i < SPEED_TEST.holes.length; i++) {
        this.showLoading(SPEED_TEST.holes[i].name, i);
        await nextPaint();
        holes.push(speedTestHole(SPEED_TEST.holes[i].id));
      }
      this.prepared = await this.host.course.prepareSpeedTest(
        holes,
        () => this.clock(),
        async (i) => {
          this.showLoading(SPEED_TEST.holes[i].name, i);
          await nextPaint();
        },
      );
    } catch (err) {
      console.error("Speed test: couldn't build its holes first:", err);
      this.prepared = null;
    }
    // Each kind of hole in turn (SPEED_TEST.holes), timed on its own.
    this.holeResults = [];
    await this.flyHole(0);
  }

  // Hole i of SPEED_TEST.holes: built, its shaders ready, then a
  // rehearsal - a frame at each stretch of the path, uncounted, so
  // everything the camera will see is built, uploaded and compiled before
  // the clock starts (frame()) - and then `after` if given, else the
  // clock.
  async flyHole(i, after = null) {
    this.loading = true;
    this.holeAt = i;
    this.meter = null;
    this.t0 = null;
    // A small loading card while the hole is built (the owner: "switching
    // from hole to hole does pause for a little bit ... have a mini
    // loading screen there, just to make sure you know it's not frozen"),
    // painted before the build holds the page.
    // (Built already, it's swapped in, with no card: prepareSpeedTest.)
    const pre = this.prepared?.[i] ?? null;
    if (this.prepared) this.prepared[i] = null;
    if (!pre) {
      this.showLoading(SPEED_TEST.holes[i].name);
      await nextPaint();
    }
    try {
      const { course, index } = speedTestHole(SPEED_TEST.holes[i].id);
      await this.host.course.showSpeedTest(course, index, () => this.clock(), pre);
    } finally {
      this.showLoading(null);
    }
    this.rehearsal = rehearsalTimes();
    this.after = after;
    this.loading = false;
    this.updateCaption(true);
  }

  // Seconds into the fly-through (0 until its first frame): during the
  // rehearsal, the stretch it's at; while the costs are timed, held at
  // the run's slowest moment.
  clock() {
    if (this.rehearsal) return this.rehearsal[0] ?? 0;
    if (this.costs) return this.costs.at;
    return this.t0 === null ? 0 : (performance.now() - this.t0) / 1000;
  }

  // Each frame drawn while it runs (app.js), after the drawing: time (the
  // animation loop's ms) and started (performance.now() as the frame's
  // work began). The graphics card's work is waited for, so the frame's
  // time is all of it: by reading one pixel of the picture back, which
  // can't be done until it's drawn. (finish() is meant to wait too, but
  // in Chromium needn't: it came back in a few milliseconds from frames
  // that took more than a second to draw.)
  // long: the gap before this frame, when it was a long one
  // (sim/longframes.mjs: its length and what caused it), kept for the
  // results - a freeze while the camera flew, not the build behind the
  // loading card.
  frame(time, started, long = null) {
    if (!this.running || this.loading) return;
    if (long && !this.costs) (this.longs ??= []).push({ ms: long.ms, t: Math.round(this.clock() * 10) / 10, ready: !!this.rehearsal, causes: long.causes ?? [] });
    // (On WebGL; WebGPU can't be waited for there and then, so on it a
    // frame's work is the game's own and the frame rate says the rest.)
    waitForCard(this.host.renderer);
    const work = performance.now() - started;
    if (this.rehearsal) {
      // On to the next stretch; the clock starts after the last.
      this.rehearsal.shift();
      if (!this.rehearsal.length) {
        this.rehearsal = null;
        const after = this.after;
        this.after = null;
        if (after) after();
        else this.meter = new SpeedMeter();
      }
      this.updateCaption(true);
      return;
    }
    if (this.costs) return this.costFrame(work);
    if (!this.meter) return;
    if (this.t0 === null) this.t0 = performance.now();
    this.meter.frame(time, work);
    this.updateCaption();
    if (this.clock() >= SPEED_TEST.seconds) this.holeDone();
  }

  // A hole flown: on to the next kind, or the setting's done.
  holeDone() {
    const result = this.meter.result() ?? { score: 0, fps: 0, slowest: 0, work: 0, frames: 0 };
    delete result.curve;
    this.holeResults.push({ id: SPEED_TEST.holes[this.holeAt].id, ...result, long: worstLong(this.longs) });
    this.longs = [];
    this.meter = null;
    if (this.holeAt + 1 < SPEED_TEST.holes.length) {
      this.loading = true;
      this.flyHole(this.holeAt + 1).catch((err) => this.abort(`The speed test couldn't run: ${err?.message ?? err}`));
      return;
    }
    this.stepDone();
  }

  stepDone() {
    const result = combineHoles(this.holeResults);
    const plan = planAfter(this.plan, result);
    write(sessionStorage, PLAN_KEY, plan);
    // After the last (the highest) setting: what costs most there - on the
    // kind of hole it was slowest on, at its slowest moment.
    if (!planNext(plan) && Number.isFinite(result.worstAt) && ladderSteps().length) {
      const i = SPEED_TEST.holes.findIndex((h) => h.id === result.worstHole);
      if (i >= 0 && i !== this.holeAt) {
        this.loading = true;
        this.flyHole(i, () => this.startCosts(plan, result.worstAt)).catch((err) => this.abort(`The speed test couldn't run: ${err?.message ?? err}`));
        return;
      }
      return this.startCosts(plan, result.worstAt);
    }
    this.running = false;
    if (planNext(plan)) this.load(plan);
    else this.finish(plan);
  }

  // What costs most: the camera held at the run's slowest moment, the
  // whole picture timed, then each part the safety valve can shed shed
  // in turn and timed without it (look/safety.js shedOne), the whole
  // picture again between them so a drift in the card's speed doesn't
  // count against one part.
  startCosts(plan, at) {
    const names = ladderSteps().map((s) => s.name);
    const queue = [];
    names.forEach((name, i) => {
      if (i % 4 === 0) queue.push(null);
      queue.push(name);
    });
    queue.push(null);
    this.costs = { plan, at, queue, i: -1, phaseStart: 0, frames: [], whole: [], without: {} };
    this.nextCost();
  }

  nextCost() {
    const c = this.costs;
    const was = c.queue[c.i];
    if (was) shedOne(was, false);
    c.i++;
    if (c.i >= c.queue.length) return this.costsDone();
    const name = c.queue[c.i];
    if (name && !shedOne(name, true)) return this.nextCost();
    c.phaseStart = performance.now();
    c.frames = [];
    this.updateCaption(true);
  }

  costFrame(work) {
    const c = this.costs;
    const since = (performance.now() - c.phaseStart) / 1000;
    const { settle, measure } = SPEED_TEST.costs;
    if (since >= settle) c.frames.push(work);
    if (since < settle + measure) return this.updateCaption();
    const mean = c.frames.length ? c.frames.reduce((a, v) => a + v, 0) / c.frames.length : NaN;
    const name = c.queue[c.i];
    if (name) c.without[name] = mean;
    else if (Number.isFinite(mean)) c.whole.push(mean);
    this.nextCost();
  }

  costsDone() {
    const { plan, whole, without } = this.costs;
    this.costs = null;
    this.running = false;
    const base = whole.length ? whole.reduce((a, v) => a + v, 0) / whole.length : NaN;
    const results = plan.results.slice();
    results[results.length - 1] = { ...results.at(-1), costs: costsFrom(base, without).slice(0, 12) };
    const done = { ...plan, results };
    write(sessionStorage, PLAN_KEY, done);
    this.finish(done);
  }

  // Every setting measured: the run kept, the owner's graphics put back,
  // and the page as it was (the card says how it went).
  finish(plan) {
    const facts = this.host.facts?.() ?? {};
    const run = { at: Date.now(), gpu: facts.gpu ?? "", hz: facts.hz ?? null, results: plan.results };
    write(localStorage, HISTORY_KEY, withRun(read(localStorage, HISTORY_KEY), run));
    write(localStorage, GRAPHICS_KEY, plan.keep);
    write(sessionStorage, PLAN_KEY, null);
    write(sessionStorage, DONE_KEY, run);
    this.host.reload();
  }

  // While it runs (or is about to): Esc stops it; no other key does
  // anything. True when the key was its.
  key(e) {
    if (!this.running && !this.plan) return false;
    e.preventDefault();
    if (e.key === "Escape") this.abort("Speed test stopped - the graphics are as they were");
    return true;
  }

  abort(message) {
    const plan = cleanPlan(read(sessionStorage, PLAN_KEY)) ?? this.plan;
    this.running = false;
    write(sessionStorage, PLAN_KEY, null);
    if (plan) write(localStorage, GRAPHICS_KEY, plan.keep);
    write(sessionStorage, DONE_KEY, { stopped: message });
    this.host.reload();
  }

  // "Speed test · High · 12 of 30 s · Esc stops it", over the picture.
  // The loading card over the picture: the hole being built, or null to
  // take it away. Its spinner turns on the graphics card's side, so it
  // keeps turning while the page is busy building.
  // (ready: the hole's place while they're all built first - "Getting
  // ready: the links by the sea hole (2 of 3)...".)
  showLoading(name, ready = null) {
    this.loadingCard?.remove();
    this.loadingCard = null;
    if (!name || !this.host.view) return;
    const el = document.createElement("div");
    el.className = "speed-loading";
    const words = ready == null ? `Loading the ${esc(name.toLowerCase())} hole...` : `Getting ready: the ${esc(name.toLowerCase())} hole (${ready + 1} of ${SPEED_TEST.holes.length})...`;
    el.innerHTML = `<span class="speed-spinner" aria-hidden="true"></span><span>${words}</span>`;
    this.host.view.appendChild(el);
    this.loadingCard = el;
  }

  showCaption() {
    if (!this.host.view) return;
    this.caption = document.createElement("div");
    this.caption.className = "speed-caption";
    this.host.view.appendChild(this.caption);
    this.updateCaption(true);
  }

  updateCaption(now = false) {
    if (!this.caption || (!now && performance.now() - this.shownAt < 250)) return;
    this.shownAt = performance.now();
    const setting = planNext(this.plan);
    const step = `${(this.plan?.at ?? 0) + 1} of ${this.plan?.order.length ?? 3}`;
    const hole = SPEED_TEST.holes[this.holeAt ?? 0];
    const holeStep = `${hole.name} (${(this.holeAt ?? 0) + 1} of ${SPEED_TEST.holes.length})`;
    if (this.rehearsal || this.loading) {
      this.caption.textContent = `Speed test · ${NAMES[setting] ?? setting} (${step}) · ${holeStep} · getting ready · Esc stops it`;
      return;
    }
    if (this.costs) {
      const c = this.costs;
      const name = c.queue[c.i];
      const of = c.queue.filter(Boolean).length;
      const n = c.queue.slice(0, c.i + 1).filter(Boolean).length;
      this.caption.textContent = `Speed test · what costs most · ${hole.name} · ${name ? `dropping: ${name} (${n} of ${of})` : "the whole picture"} · Esc stops it`;
      return;
    }
    const secs = Math.min(SPEED_TEST.seconds, Math.floor(this.clock()));
    this.caption.textContent = `Speed test · ${NAMES[setting] ?? setting} (${step}) · ${holeStep} · ${secs} of ${SPEED_TEST.seconds} s · Esc stops it`;
  }

  // The card at the end: each setting's score and what it means here.
  showResults(run) {
    const facts = this.host.facts?.() ?? {};
    const target = facts.target ?? 60;
    this.host.toast(`Speed test: ${runText(run)}`, 5000);
    if (!this.host.view) return;
    this.card?.remove();
    const el = document.createElement("div");
    el.className = "corner-card speed-card";
    const rows = run.results
      .map((r) => {
        const each = SPEED_TEST.holes.map((h) => r.holes?.find((x) => x.id === h.id)?.score).map((v) => `<td>${Number.isFinite(v) ? esc(v) : ""}</td>`).join("");
        return `<tr><td>${esc(NAMES[r.setting] ?? r.setting)}</td><td><b>${Math.round(r.score)}</b><small class="speed-words">${esc(scoreWords(r.score, target))}</small></td>${each}<td>${Number.isFinite(r.start) ? esc(r.start) : ""}</td><td>${Number.isFinite(r.worst) ? esc(r.worst) : ""}</td></tr>`;
      })
      .join("");
    // The top setting's slowest moment, and what costs most there.
    const top = run.results.at(-1);
    const costs = (top?.costs ?? []).slice(0, SPEED_TEST.costs.show);
    const where = Number.isFinite(top?.worstAt) ? `${esc(NAMES[top.setting] ?? top.setting)}'s slowest moment was on the ${esc(holeName(top.worstHole ?? "parkland").toLowerCase())} hole, ${esc(momentWords(top.worstAt))} (${esc(top.worst)} a second).` : "";
    const costList = costs.length
      ? `<p>${where} What costs most there - how much each step the picture can drop when it's slow saves a frame:</p><ol class="speed-costs">${costs.map((c) => `<li>${esc(c.name)}: ${esc(c.ms)} ms a frame (${esc(Math.round(c.share * 100))}%)</li>`).join("")}</ol>`
      : where
        ? `<p>${where}</p>`
        : "";
    const screen = run.hz ? `your ${esc(run.hz)} Hz screen` : "your screen";
    // In the Windows app, the results can go straight to Claude.
    const canSend = typeof window.golfsimApp?.reportSend === "function";
    el.innerHTML = `<h3>Speed test</h3>
      <p>The same fly-through over a parkland hole, a links hole by the sea and a mountain hole at each setting: how many frames a second this PC can draw it (${esc(target)} is smooth on ${screen}).</p>
      <table><thead><tr><th>Setting</th><th>Frames a second</th>${SPEED_TEST.holes.map((h) => `<th>${esc(h.name)}</th>`).join("")}<th title="The first three seconds timed on any hole, after a rehearsal pass">At the start</th><th title="The slowest second after the start">Slowest</th></tr></thead><tbody>${rows}</tbody></table>
      ${costList}
      <div class="cc-buttons">${canSend ? `<button data-act="send" title="Files a report to Claude with these results in full, the graphics card and how the picture has run">Send to Claude</button>` : ""}<button data-act="close" class="primary">Close</button></div>`;
    el.addEventListener("click", (e) => {
      // (The owner: "Be good if I could send you the report from the
      // system" - the Windows app's Send report, with the run in it.)
      const send = e.target.closest("button[data-act='send']");
      if (send) {
        send.disabled = true;
        send.textContent = "Sending...";
        Promise.resolve(window.golfsimApp.reportSend(`Speed test results: ${runText(run)}`))
          .then((r) => {
            send.textContent = r?.ok ? `Sent (report ${r.number ?? ""})` : "Not sent";
            if (!r?.ok) this.host.toast(r?.error ?? "The report couldn't be sent", 5000);
          })
          .catch(() => {
            send.textContent = "Not sent";
            send.disabled = false;
          });
        return;
      }
      if (e.target.closest("button[data-act]")) {
        el.remove();
        this.card = null;
      }
    });
    this.host.view.appendChild(el);
    this.card = el;
  }
}
