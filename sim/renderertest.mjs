// The WebGPU test (renderertest.js runs it in the page): the same fly-round
// of the range drawn by each renderer in turn - today's WebGL, three.js's
// WebGPU renderer on WebGL 2, and the same on WebGPU - timed, so the owner
// can see on his own PC what the WebGPU port (docs/BACKLOG-GRAPHICS.md,
// "Finishing the WebGPU port", Step 4) would buy (the owner, 22 October
// 2026: "start the webgpu stuff for the range, and a testing mode to check
// back"). The two WebGPU renderer runs draw with the same node materials,
// so between them only the graphics card's interface differs; against
// WebGL, whatever isn't ported yet is drawn more plainly on the WebGPU
// renderer (each run says how much: sim/portcheck.mjs).
//
// Pure: the plan, the camera's tour, the frames' costs and the words.

import { RENDERERS } from "./rendererchoice.mjs";

export const RENDERER_TEST = Object.freeze({
  // The renderers, in the order they're run (sim/rendererchoice.mjs).
  order: ["webgl", "webgpu-gl", "webgpu"],
  // Before the clock starts, the camera visits every `rehearse` seconds of
  // the tour for a frame each, uncounted (everything it will see built,
  // its programs made), then is held `hold` seconds on the first view (its
  // picture taken); then `seconds` timed, the whole tour.
  rehearse: 2,
  hold: 1.5,
  seconds: 20,
  // The pictures kept for the card: this wide (and 9 / 16 of it high);
  // on WebGPU, read back from the card, waited for this long at most
  // (seconds).
  stillWidth: 480,
  stillWait: 3,
  // The runs kept.
  keep: 5,
});

// The fly-round: [seconds, camera [x, y, z], looking at [x, y, z]] in the
// range's world (the mat at the middle, the range down -z), back where it
// started. From the bay, up behind it, down the left over the target
// greens, low across the far end, high looking back.
export const TOUR = Object.freeze([
  [0, [0, 1.7, 5], [0, 0.5, -90]],
  [4, [0, 12, 30], [0, 0, -120]],
  [8, [25, 40, -40], [-10, 0, -180]],
  [12, [-30, 25, -150], [10, 0, -240]],
  [16, [0, 60, -260], [0, 0, -60]],
  [20, [0, 1.7, 5], [0, 0.5, -90]],
]);

// A Catmull-Rom spline through points, at u (0 - 1) between b and c.
const spline = (a, b, c, d, u) => {
  const u2 = u * u;
  const u3 = u2 * u;
  return b.map((_, i) => 0.5 * (2 * b[i] + (-a[i] + c[i]) * u + (2 * a[i] - 5 * b[i] + 4 * c[i] - d[i]) * u2 + (-a[i] + 3 * b[i] - 3 * c[i] + d[i]) * u3));
};

// Where the camera is, and what it's looking at, `t` seconds into the
// tour (round and round).
export function tourAt(t, tour = TOUR) {
  const span = tour.at(-1)[0];
  const s = ((t % span) + span) % span;
  let i = 0;
  while (i < tour.length - 2 && tour[i + 1][0] <= s) i++;
  const [t0] = tour[i];
  const [t1] = tour[i + 1];
  const u = (s - t0) / (t1 - t0 || 1);
  const at = (k) => tour[Math.min(tour.length - 1, Math.max(0, k))];
  const part = (j) => spline(at(i - 1)[j], at(i)[j], at(i + 1)[j], at(i + 2)[j], u);
  return { cam: part(1), look: part(2) };
}

// Each frame's cost to the PC: from when its work began - or when the
// graphics card finished the frame before, if that was later (it was
// still busy with that one) - to when the card finished it. The same on
// every renderer: on WebGL the card's finish is waited for there and then;
// on WebGPU it's told when it's done.
export class FrameCosts {
  constructor() {
    this.costs = [];
    this.lastDone = -Infinity;
  }

  add(start, done) {
    if (!Number.isFinite(start) || !Number.isFinite(done)) return;
    const from = Math.max(start, this.lastDone);
    this.lastDone = Math.max(this.lastDone, done);
    const cost = done - from;
    if (cost >= 0) this.costs.push(cost);
  }

  // { score, ms, slowest, frames }: score - frames a second at that cost;
  // ms - the average frame's; slowest - the slowest frame's; null with
  // none timed.
  result() {
    const n = this.costs.length;
    if (!n) return null;
    const ms = this.costs.reduce((a, c) => a + c, 0) / n;
    return { score: Math.round(1000 / Math.max(ms, 0.1)), ms: Math.round(ms * 10) / 10, slowest: Math.round(Math.max(...this.costs)), frames: n };
  }
}

// The rehearsal: the tour's times the camera visits before the clock.
export function rendererRehearsal(step = RENDERER_TEST.rehearse, tour = TOUR) {
  const out = [];
  for (let t = 0; t < tour.at(-1)[0]; t += step) out.push(t);
  return out;
}

// A run: when it began and each renderer's result so far (started: the
// renderer it was flying, until its result is in).
export function newRendererPlan(at) {
  return { at, order: [...RENDERER_TEST.order], results: [], started: null };
}

// The renderer to run next, or null when every one's been run.
export function rendererNext(plan) {
  return plan?.order?.[plan.results?.length ?? 0] ?? null;
}

// The plan as a renderer starts its flight.
export function rendererStarted(plan) {
  return { ...plan, started: rendererNext(plan) };
}

// The plan with a renderer's result in.
export function rendererAfter(plan, result) {
  return { ...plan, started: null, results: [...plan.results, result] };
}

// The page loaded again part way through a renderer's flight (the
// graphics card reset under it, or the page stopped): that one put down as
// not finished, so a renderer that can't get through the flight isn't
// tried again and again. The plan as it was otherwise.
export function rendererCutShort(plan) {
  if (!plan?.started || plan.started !== rendererNext(plan)) return plan;
  return rendererAfter(plan, { asked: plan.started, drawn: null, failed: true });
}

// A plan read back from the session: as it should be, or null.
export function cleanRendererPlan(plan) {
  if (!plan || !Number.isFinite(plan.at) || !Array.isArray(plan.order) || !Array.isArray(plan.results)) return null;
  if (!plan.order.every((k) => Object.hasOwn(RENDERERS, k))) return null;
  if (plan.results.length > plan.order.length) return null;
  return plan;
}

// A renderer's name for the card and the report.
export const rendererWords = (kind) => RENDERERS[kind] ?? kind;

// What of the picture the new renderer doesn't draw as WebGL does yet, for
// the card: a run's port counts (sim/portcheck.mjs) - "nothing" when it
// draws all of it, "2 plain, 1 not drawn" otherwise; "as always" for WebGL
// (no counts: everything drawn as it was made).
export function rendererLeftWords(port) {
  if (!port) return "as always";
  const plain = Number(port.plain) || 0;
  const missing = Number(port.missing) || 0;
  return plain || missing ? `${plain} plain, ${missing} not drawn` : "nothing";
}

// The run in a line: "WebGL 66 · WebGPU renderer on WebGL 2 58 · WebGPU 71
// frames a second".
export function rendererRunText(run) {
  const parts = (run?.results ?? []).map((r) => `${rendererWords(r.asked)} ${r.failed ? "didn't finish" : Number.isFinite(r.score) ? r.score : "-"}`);
  return parts.length ? `${parts.join(" · ")} frames a second` : "";
}

// What the two that draw the same things - the WebGPU renderer on WebGL 2
// and on WebGPU - say about WebGPU: "WebGPU 12% faster" / "slower" /
// "about the same"; "" when either didn't run as asked.
export function webgpuVerdict(run) {
  const gl = run?.results?.find((r) => r.asked === "webgpu-gl" && r.drawn === "webgpu-gl");
  const gpu = run?.results?.find((r) => r.asked === "webgpu" && r.drawn === "webgpu");
  if (!gl?.ms || !gpu?.ms) return "";
  const gain = gl.ms / gpu.ms - 1;
  if (Math.abs(gain) < 0.05) return "WebGPU about the same as WebGL 2 for the same picture";
  return `WebGPU ${Math.round(Math.abs(gain) * 100)}% ${gain > 0 ? "faster" : "slower"} than WebGL 2 for the same picture`;
}

// The runs kept, newest first, with a new one (no pictures: those are for
// the card).
export function withRendererRun(history, run, keep = RENDERER_TEST.keep) {
  const plain = { ...run, results: (run.results ?? []).map(({ still, ...r }) => r) };
  return [plain, ...(Array.isArray(history) ? history : [])].slice(0, keep);
}

// Runs read back from storage: well formed, newest first.
export function cleanRendererHistory(list) {
  return (Array.isArray(list) ? list : []).filter((r) => r && Number.isFinite(r.at) && Array.isArray(r.results)).sort((a, b) => b.at - a.at);
}
