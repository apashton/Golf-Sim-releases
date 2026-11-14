// The WebGPU test in the page (sim/renderertest.mjs says what it is): from
// the menu's Screens page, the same fly-round of the range drawn by WebGL,
// by three.js's WebGPU renderer on WebGL 2, and by it on WebGPU, timed.
// The renderer is chosen as the page loads (the hidden ?renderer= switch,
// sim/rendererchoice.mjs), so the run's plan is kept for the session and the
// page loads with each in turn, then comes back on WebGL as it was; the
// frame rates, a picture from each and what isn't ported yet are shown on a
// card and kept (the last few runs, and in a report to Claude). While it
// runs, as for the speed test, nothing else happens: keys but Esc do
// nothing, shots are ignored, and no setting is saved (util.js
// holdSettings).

import { RENDERER_TEST, tourAt, FrameCosts, newRendererPlan, rendererNext, rendererRehearsal, rendererStarted, rendererAfter, rendererCutShort, cleanRendererPlan, rendererWords, rendererLeftWords, rendererRunText, webgpuVerdict, withRendererRun, cleanRendererHistory } from "./sim/renderertest.mjs";
import { holdSettings, esc } from "./util.js";
import { rendererKind, waitForCard, frameDraws, portFacts } from "./look/gpu.js";
import { portLine } from "./sim/portcheck.mjs";

const PLAN_KEY = "golfsim.rendererTest";
const DONE_KEY = "golfsim.rendererTestDone";
const HISTORY_KEY = "golfsim.rendererTests";

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

// The page's address drawn by `kind` (none: WebGL, as every player has it).
export function addressFor(kind, href = location.href) {
  const url = new URL(href);
  if (!kind || kind === "webgl") url.searchParams.delete("renderer");
  else url.searchParams.set("renderer", kind);
  return url.toString();
}

export class RendererTest {
  // host:
  //   setMode(name), range: the range mode, renderer, asked: the renderer
  //   the address asked for (sim/rendererchoice.mjs)
  //   view: the picture's element (the caption and the card go over it)
  //   busy(): what a reload would end ("the round in progress"), or null
  //   quiet(): everything else stopped and hushed for the run
  //   go(href), toast(text, ms), facts(): { gpu } - the graphics card
  constructor(host) {
    this.host = host;
    this.running = false;
    this.plan = null;
    this.phase = null;
    this.caption = null;
    this.card = null;
    this.shownAt = 0;
  }

  // The runs kept, newest first.
  get history() {
    return cleanRendererHistory(read(localStorage, HISTORY_KEY));
  }

  // The menu row's words: the last run.
  note() {
    const last = this.history[0];
    if (!last) return "";
    const day = new Date(last.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    return `Last run ${day}: ${rendererRunText(last)}`;
  }

  // From the menu: a run, each renderer in turn.
  offer() {
    const why = this.host.busy?.();
    if (why && !confirm(`The WebGPU test reloads A² Golf for each way of drawing, which ends ${why}. Run it now?`)) return "";
    const plan = newRendererPlan(Date.now());
    write(sessionStorage, PLAN_KEY, plan);
    this.load(plan);
    return "WebGPU test: about two minutes";
  }

  // The page loaded again, drawn by the plan's next renderer.
  load(plan) {
    this.host.go(addressFor(rendererNext(plan)));
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
    let plan = cleanRendererPlan(read(sessionStorage, PLAN_KEY));
    if (!plan) return;
    plan = rendererCutShort(plan);
    if (!rendererNext(plan)) return this.finish(plan);
    // (Loaded by hand without the switch the plan asked for: loaded again
    // with it.)
    if ((this.host.asked ?? "webgl") !== rendererNext(plan)) return this.load(plan);
    try {
      this.run(plan);
    } catch (err) {
      console.error("WebGPU test:", err);
      this.abort(`The WebGPU test couldn't run: ${err?.message ?? err}`);
    }
  }

  run(plan) {
    this.plan = rendererStarted(plan);
    write(sessionStorage, PLAN_KEY, this.plan);
    holdSettings();
    this.running = true;
    this.host.quiet?.();
    this.host.setMode("range");
    this.flyRange(this.host.range);
    this.showCaption();
    // The camera at each stretch of the tour for a frame, uncounted -
    // everything it'll see built and its programs made before the clock
    // starts - then held still on the first view for its picture.
    this.phase = { name: "rehearse", times: rendererRehearsal(), since: performance.now() };
    this.updateCaption(true);
  }

  // The range's camera on the tour while the test runs (after the range's
  // own update, which would have it back at the mat).
  flyRange(range) {
    if (!range || range.rendererTestFlying) return;
    const own = range.update.bind(range);
    range.rendererTestFlying = true;
    range.update = (dt) => {
      own(dt);
      if (!this.running) return;
      const { cam, look } = tourAt(this.tourTime());
      range.camera.position.set(...cam);
      range.look?.set(...look);
      range.camera.lookAt(...look);
    };
  }

  // Seconds into the tour: the stretch being rehearsed, 0 while held, and
  // then the clock.
  tourTime() {
    const p = this.phase;
    if (!p) return 0;
    if (p.name === "rehearse") return p.times[0] ?? 0;
    if (p.name === "timed") return (performance.now() - p.since) / 1000;
    return 0;
  }

  // Each frame drawn while it runs (app.js), after the drawing: started -
  // performance.now() as the frame's work began. Timed to the end of the
  // graphics card's work (sim/renderertest.mjs FrameCosts): on WebGL by
  // reading back a pixel, there and then; on WebGPU the card says when
  // it's done.
  frame(started) {
    if (!this.running || !this.phase) return;
    const p = this.phase;
    const renderer = this.host.renderer;
    if (p.name === "rehearse") {
      waitForCard(renderer);
      p.times.shift();
      if (!p.times.length) this.phase = { name: "hold", since: performance.now() };
      return this.updateCaption(true);
    }
    if (p.name === "hold") {
      if ((performance.now() - p.since) / 1000 < RENDERER_TEST.hold) return;
      // Its picture, then the clock (on WebGPU read back from the card,
      // which takes a moment: not timed).
      const start = (still) => {
        this.still = still;
        this.costs = new FrameCosts();
        this.pending = 0;
        this.phase = { name: "timed", since: performance.now() };
        this.updateCaption(true);
      };
      if (rendererKind(renderer) !== "webgpu") return start(picture(renderer.domElement));
      // (Without it, if the card's slow to give it back.)
      this.phase = { name: "still" };
      let started = false;
      const once = (still) => {
        if (started) return;
        started = true;
        start(still);
      };
      gpuPicture(renderer).then(once, () => once(null));
      setTimeout(() => once(null), RENDERER_TEST.stillWait * 1000);
      return;
    }
    if (p.name !== "timed") return;
    const costs = this.costs;
    if (rendererKind(renderer) === "webgpu") {
      const queue = renderer.backend?.device?.queue;
      if (queue) {
        this.pending++;
        queue.onSubmittedWorkDone().then(
          () => {
            costs.add(started, performance.now());
            this.pending--;
          },
          () => this.pending--,
        );
      }
    } else {
      waitForCard(renderer);
      costs.add(started, performance.now());
    }
    this.updateCaption();
    if ((performance.now() - p.since) / 1000 >= RENDERER_TEST.seconds) {
      this.phase = { name: "done" };
      this.draws = frameDraws(renderer);
      this.stepDone().catch((err) => this.abort(`The WebGPU test couldn't run: ${err?.message ?? err}`));
    }
  }

  // A renderer flown: its result kept, and on to the next (or the end).
  async stepDone() {
    // The last frames' work told of first (WebGPU), a second at most.
    const by = performance.now() + 1000;
    while (this.pending > 0 && performance.now() < by) await new Promise((r) => setTimeout(r, 20));
    const plan = this.plan;
    const asked = rendererNext(plan);
    const renderer = this.host.renderer;
    const survey = portFacts(this.host.range?.scene);
    const result = {
      asked,
      drawn: rendererKind(renderer),
      ...(this.costs.result() ?? { score: 0, ms: 0, slowest: 0, frames: 0 }),
      calls: this.draws?.calls ?? null,
      triangles: this.draws?.triangles ?? null,
      gpu: this.host.facts?.().gpu ?? "",
      port: survey ? { ...survey.counts, line: portLine(survey) } : null,
      still: this.still ?? null,
    };
    this.running = false;
    const next = rendererAfter(plan, result);
    write(sessionStorage, PLAN_KEY, next);
    if (rendererNext(next)) this.load(next);
    else this.finish(next);
  }

  // Every renderer timed: the run kept (without its pictures), and the
  // page back on WebGL (the card says how it went).
  finish(plan) {
    const run = { at: plan.at, gpu: plan.results.find((r) => r.gpu)?.gpu ?? "", results: plan.results };
    write(localStorage, HISTORY_KEY, withRendererRun(read(localStorage, HISTORY_KEY), run));
    write(sessionStorage, PLAN_KEY, null);
    write(sessionStorage, DONE_KEY, run);
    this.host.go(addressFor("webgl"));
  }

  // While it runs (or is about to): Esc stops it; no other key does
  // anything. True when the key was its.
  key(e) {
    if (!this.running && !this.plan) return false;
    e.preventDefault();
    if (e.key === "Escape") this.abort("WebGPU test stopped");
    return true;
  }

  abort(message) {
    this.running = false;
    write(sessionStorage, PLAN_KEY, null);
    write(sessionStorage, DONE_KEY, { stopped: message });
    this.host.go(addressFor("webgl"));
  }

  // "WebGPU test · WebGPU (3 of 3) · 12 of 20 s · Esc stops it", over the
  // picture.
  showCaption() {
    if (!this.host.view) return;
    this.caption = document.createElement("div");
    this.caption.className = "speed-caption";
    this.host.view.appendChild(this.caption);
  }

  updateCaption(now = false) {
    if (!this.caption || (!now && performance.now() - this.shownAt < 250)) return;
    this.shownAt = performance.now();
    const kind = rendererNext(this.plan);
    const step = `${(this.plan?.results.length ?? 0) + 1} of ${this.plan?.order.length ?? 3}`;
    const what = `WebGPU test · ${rendererWords(kind)} (${step})`;
    if (this.phase?.name !== "timed") {
      this.caption.textContent = `${what} · getting ready · Esc stops it`;
      return;
    }
    const secs = Math.min(RENDERER_TEST.seconds, Math.floor((performance.now() - this.phase.since) / 1000));
    this.caption.textContent = `${what} · ${secs} of ${RENDERER_TEST.seconds} s · Esc stops it`;
  }

  // The card at the end: each renderer's frame rate, its picture, and
  // what isn't drawn as it should be yet.
  showResults(run) {
    this.host.toast(`WebGPU test: ${rendererRunText(run)}`, 5000);
    if (!this.host.view) return;
    this.card?.remove();
    const el = document.createElement("div");
    el.className = "corner-card speed-card renderer-card";
    const num = (v) => (Number.isFinite(v) ? esc(v) : "");
    const rows = run.results
      .map((r) => {
        if (r.failed) return `<tr><td>${esc(rendererWords(r.asked))}</td><td colspan="5">Didn't finish - the page started again part way through</td></tr>`;
        const fell = r.drawn && r.drawn !== r.asked ? `<small class="speed-words">drawn by ${esc(rendererWords(r.drawn))} here</small>` : "";
        return `<tr><td>${esc(rendererWords(r.asked))}${fell}</td><td><b>${num(r.score)}</b></td><td>${num(r.ms)}</td><td>${num(r.slowest)}</td><td>${num(r.calls)}</td><td>${esc(rendererLeftWords(r.port))}</td></tr>`;
      })
      .join("");
    const pictures = run.results
      .filter((r) => r.still)
      .map((r) => `<figure><img src="${esc(r.still)}" alt=""><figcaption>${esc(rendererWords(r.asked))}</figcaption></figure>`)
      .join("");
    const verdict = webgpuVerdict(run);
    const canSend = typeof window.golfsimApp?.reportSend === "function";
    el.innerHTML = `<h3>WebGPU test</h3>
      ${verdict ? `<p class="renderer-verdict">${esc(verdict)}.</p>` : ""}
      <p>The same 20-second flight round the range, drawn three ways. The new renderer draws the whole range as WebGL does - the screen's effects too - so its two rows, on WebGL 2 and on WebGPU, say what WebGPU itself does on this PC, and against WebGL what the new renderer would.</p>
      <table><thead><tr><th>Drawn by</th><th>Frames a second</th><th title="The average frame's time, to the end of the graphics card's work">ms a frame</th><th title="The slowest frame">Slowest ms</th><th title="Draw calls in a frame">Draws</th><th title="Of the picture's materials: drawn plainly for now, or left out">Not yet made for it</th></tr></thead><tbody>${rows}</tbody></table>
      ${pictures ? `<div class="renderer-pictures">${pictures}</div>` : ""}
      <div class="cc-buttons">${canSend ? `<button data-act="send" title="Files a report to Claude with these results, the graphics card and how the picture has run">Send to Claude</button>` : ""}<button data-act="close" class="primary">Close</button></div>`;
    el.addEventListener("click", (e) => {
      const send = e.target.closest("button[data-act='send']");
      if (send) {
        send.disabled = true;
        send.textContent = "Sending...";
        Promise.resolve(window.golfsimApp.reportSend(`WebGPU test results: ${rendererRunText(run)}${verdict ? ` - ${verdict}` : ""}`))
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

// The picture just drawn, small, as a JPEG (in the same moment as the
// drawing: the canvas is cleared once it's been shown). Null where the
// canvas can't be read.
function picture(canvas) {
  try {
    const w = RENDERER_TEST.stillWidth;
    const h = Math.round((w * 9) / 16);
    const small = document.createElement("canvas");
    small.width = w;
    small.height = h;
    const ctx = small.getContext("2d");
    // (Cropped to 16:9 from the middle.)
    const cw = canvas.width;
    const ch = canvas.height;
    const sw = Math.min(cw, (ch * 16) / 9);
    const sh = (sw * 9) / 16;
    ctx.drawImage(canvas, (cw - sw) / 2, (ch - sh) / 2, sw, sh, 0, 0, w, h);
    return small.toDataURL("image/jpeg", 0.8);
  } catch {
    return null;
  }
}

// The same on WebGPU: the picture just drawn copied off the card (its
// canvas's texture, in the same moment as the drawing) and read back.
async function gpuPicture(renderer) {
  const device = renderer.backend?.device;
  const texture = renderer.domElement.getContext("webgpu")?.getCurrentTexture?.();
  if (!device || !texture) return null;
  const { width, height } = texture;
  const row = Math.ceil((width * 4) / 256) * 256;
  const buffer = device.createBuffer({ size: row * height, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
  try {
    const enc = device.createCommandEncoder();
    enc.copyTextureToBuffer({ texture }, { buffer, bytesPerRow: row }, [width, height]);
    device.queue.submit([enc.finish()]);
    await buffer.mapAsync(GPUMapMode.READ);
    const src = new Uint8Array(buffer.getMappedRange());
    const image = new ImageData(width, height);
    const out = image.data;
    // (Most cards' canvases are blue-green-red: put back in order.)
    const [r, b] = String(texture.format).startsWith("bgra") ? [2, 0] : [0, 2];
    for (let y = 0; y < height; y++) {
      for (let x = 0, i = y * row, o = y * width * 4; x < width; x++, i += 4, o += 4) {
        out[o] = src[i + r];
        out[o + 1] = src[i + 1];
        out[o + 2] = src[i + b];
        out[o + 3] = 255;
      }
    }
    buffer.unmap();
    const full = document.createElement("canvas");
    full.width = width;
    full.height = height;
    full.getContext("2d").putImageData(image, 0, 0);
    return picture(full);
  } finally {
    buffer.destroy();
  }
}
