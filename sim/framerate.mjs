// The frame rate, for the readout on the picture (Shift + F): how many
// frames a second the picture is drawing, how long a frame takes, and the
// slowest frame lately - a stutter shows as a worst frame far longer than
// the usual one, even when the average looks fine. Pure: it's given the
// animation loop's timestamps (milliseconds), so it can be tested.

// Averaged over about a second; the worst frame kept for a few seconds, so
// a hitch is still up long enough to be read.
export const AVERAGE_MS = 1000;
export const WORST_MS = 5000;
// A gap longer than this isn't a slow frame: the window was hidden or
// minimised and the loop stopped. Measuring starts again after it.
export const GAP_MS = 1000;
// Below this, the picture is slow: the readout says what to do about it
// (the same line the safety valve counts as slow, sim/safetyvalve.mjs, on a
// 60 Hz screen; on a slower one the valve's own slow mark, sim/refresh.mjs
// thresholds, is passed in).
export const LOW_FPS = 40;

export class FrameMeter {
  constructor({ averageMs = AVERAGE_MS, worstMs = WORST_MS, gapMs = GAP_MS } = {}) {
    this.averageMs = averageMs;
    this.worstMs = worstMs;
    this.gapMs = gapMs;
    this.reset();
  }

  reset() {
    this.last = null;
    // [time the frame ended, how long it took], oldest first.
    this.frames = [];
  }

  // A frame drawn at time (ms, as requestAnimationFrame gives it).
  tick(time) {
    if (!Number.isFinite(time)) return;
    const last = this.last;
    this.last = time;
    if (last === null) return;
    const dt = time - last;
    if (dt <= 0) return;
    if (dt > this.gapMs) {
      this.frames = [];
      return;
    }
    this.frames.push([time, dt]);
    const keep = time - Math.max(this.worstMs, this.averageMs);
    let drop = 0;
    while (drop < this.frames.length && this.frames[drop][0] <= keep) drop++;
    if (drop) this.frames.splice(0, drop);
  }

  // { fps, ms, worst, span }: frames a second and the average frame (ms)
  // over the last second, the longest frame (ms) in the last few seconds,
  // and how many ms of frames the average is from (short just after
  // starting). null until there are frames to go on.
  stats() {
    if (!this.frames.length) return null;
    const now = this.last;
    let sum = 0;
    let count = 0;
    let worst = 0;
    for (const [t, dt] of this.frames) {
      if (t > now - this.averageMs) {
        sum += dt;
        count++;
      }
      if (t > now - this.worstMs) worst = Math.max(worst, dt);
    }
    if (!count) return null;
    const ms = sum / count;
    return { fps: 1000 / ms, ms, worst, span: sum };
  }
}

// Whether the picture is slow: below `low` (LOW_FPS on a 60 Hz screen) for
// a whole second's worth of frames.
export function isSlow(stats, averageMs = AVERAGE_MS, low = LOW_FPS) {
  return !!stats && stats.span >= averageMs * 0.9 && stats.fps < low;
}

// The readout's words: "60 fps · 16.7 ms · worst 34 ms", with what to do on
// the end while it's slow; under it what the last frame took to draw and
// the setting in use ("212 draws · 1.24M triangles · High → Medium"), and
// any advice under that.
//   slow: the words for a slow picture ("G for Standard", "slow picture":
//         sim/graphics.mjs slowWords), shown only while it's slow (isSlow)
//   draws: the last frame's { calls, triangles, shadows, shadowCalls,
//          reflections, reflectionCalls } (look/gpu.js frameDraws), and
//          shadowRate and reflectionRate how many frames in the last
//          second drew a shadow map again, or the water's reflections
//   picture: the 3D picture's size as drawn ("961 × 433")
//   setting: the setting in use, in words (sim/graphics.mjs settingText)
//   advice: a line of its own (the graphics kept switching back and forth)
//   low: what counts as slow (the safety valve's mark for this screen)
//   aim: the frame rate aimed at, said when it isn't 60 ("aims at 50 fps")
export function frameRateText(stats, { slow = "", draws = null, shadowRate = 0, reflectionRate = 0, picture = "", setting = "", advice = "", low = LOW_FPS, aim = 60 } = {}) {
  const under = [draws ? drawText(draws, shadowRate, reflectionRate) : "", picture ? `picture ${picture}` : "", setting, aim !== 60 ? `aims at ${aim} fps` : ""].filter(Boolean).join(" · ");
  const lines = [under, advice]
    .filter(Boolean)
    .map((l) => `\n${l}`)
    .join("");
  if (!stats) return `- fps${lines}`;
  const fps = Math.round(stats.fps);
  const text = `${fps} fps · ${stats.ms.toFixed(1)} ms · worst ${Math.round(stats.worst)} ms`;
  return (slow && isSlow(stats, AVERAGE_MS, low) ? `${text} · ${slow}` : text) + lines;
}

// The readout on the phone, closed (the owner, 25 October 2026: "Fps box
// on mobile needs shrinking and avoiding other things. Maybe as extreme as
// just the FPS number but clicking on you can see the rest?"): the frame
// rate alone - "51 fps", "- fps" before there's a second to go on, "Resting"
// while the picture isn't redrawn. A tap opens the whole readout.
export function frameRateShort(stats, { resting = false } = {}) {
  if (resting) return "Resting";
  return stats ? `${Math.round(stats.fps)} fps` : "- fps";
}

// "212 draws · 1.24M triangles": what the last frame took to draw - the
// picture's own draws and triangles, without the shadow maps' (shadows)
// or the water's reflections (reflections, on Ultra): a frame that drew a
// map again, or the reflections (every other frame while the camera's
// still), jumped by them, and the count flicked between the two (the
// owner, 20 and 29 October 2026: "constantly flicking between 865k
// triangles and 1.54 million", "Triangle count flicker still
// happening"). How often each is drawn is said instead, while it is
// (rate, reflectionRate: frames a second).
const times = (n) => `${n} time${n === 1 ? "" : "s"} a second`;
export function drawText({ calls = 0, triangles = 0, shadows = 0, shadowCalls = 0, reflections = 0, reflectionCalls = 0 } = {}, rate = 0, reflectionRate = 0) {
  const n = Math.max(0, triangles - shadows - reflections);
  const c = Math.max(0, calls - shadowCalls - reflectionCalls);
  const t = n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : `${Math.round(n)}`;
  const again = rate > 0 ? ` · shadows drawn again ${times(Math.round(rate))}` : "";
  const water = reflectionRate > 0 ? ` · reflections drawn ${times(Math.round(reflectionRate))}` : "";
  return `${Math.round(c)} draws · ${t} triangles${again}${water}`;
}

// How many of the frames in the last `span` ms drew a shadow map again (or
// the water's reflections): times, those frames' (oldest first, trimmed
// here as they age).
export function shadowRate(times, now, span = 1000) {
  while (times.length && now - times[0] > span) times.shift();
  return times.length * (1000 / span);
}

// ---- The frame rate by view ------------------------------------------------------

// The views a report's table is kept by, in the order it lists them.
export const VIEWS = ["range tee", "range chase", "session view", "course address", "course flight", "green", "flyover", "putting", "chipping", "challenges"];

// Which view a frame was drawn in, from the mode and what it's doing:
//   mode     "range", "course", "putting", "chipping" or "challenges"
//   flying   a shot under way (the chase camera, or watching it go)
//   session  the range's session view
//   flyover  the course's flyover
//   green    the course's ball on the green
// null for anything else (no view to keep it by).
export function viewOf({ mode, flying = false, session = false, flyover = false, green = false } = {}) {
  if (mode === "range") return session ? "session view" : flying ? "range chase" : "range tee";
  if (mode === "course") return flyover ? "flyover" : green ? "green" : flying ? "course flight" : "course address";
  if (mode === "putting" || mode === "chipping" || mode === "challenges") return mode;
  return null;
}

// Frame times, draw calls and triangles kept by view and by whether a
// recording was being made, for a report: collected as the game is played,
// a few additions a frame. Frames after a long gap (a hidden window) aren't
// counted, nor the first of a view (its build, or a camera cut).
export class ViewTable {
  constructor({ gapMs = GAP_MS } = {}) {
    this.gapMs = gapMs;
    this.rows = new Map();
    this.last = null;
    this.lastKey = null;
  }

  // A frame drawn at time (ms) in view (VIEWS, or null), recording or not,
  // with its draw calls and triangles; setting: the setting in use, in
  // words ("High", "High → Medium", "Standard": sim/graphics.mjs
  // settingText).
  add(time, view, recording, { calls = 0, triangles = 0, setting = "" } = {}) {
    const last = this.last;
    this.last = time;
    const key = view ? `${view}|${recording ? 1 : 0}` : null;
    const same = key === this.lastKey;
    this.lastKey = key;
    if (!key || last === null || !same) return;
    const dt = time - last;
    if (!(dt > 0) || dt > this.gapMs) return;
    let r = this.rows.get(key);
    if (!r) this.rows.set(key, (r = { view, recording: !!recording, frames: 0, ms: 0, worst: 0, calls: 0, triangles: 0, settings: new Set() }));
    r.frames++;
    r.ms += dt;
    r.worst = Math.max(r.worst, dt);
    r.calls += calls;
    r.triangles += triangles;
    if (setting) r.settings.add(setting);
  }

  // Every view seen: { view, recording, frames, fps, ms, worst, calls,
  // triangles, settings }, averages per frame, in VIEWS order (recording off
  // first).
  list() {
    return [...this.rows.values()]
      .map((r) => ({
        view: r.view,
        recording: r.recording,
        frames: r.frames,
        fps: (1000 * r.frames) / r.ms,
        ms: r.ms / r.frames,
        worst: r.worst,
        calls: r.calls / r.frames,
        triangles: r.triangles / r.frames,
        settings: [...r.settings].join(", "),
      }))
      .sort((a, b) => VIEWS.indexOf(a.view) - VIEWS.indexOf(b.view) || a.recording - b.recording);
  }
}
