// The screen's refresh rate, and what the safety valve aims at from it
// (the owner: "set the automatic switching from your screen's refresh
// rate, measured on the first run"). The valve steps detail down when the
// picture is mostly well under the screen's own rate and back up when it's
// mostly close to it (sim/safetyvalve.mjs): on a 60 Hz projector that's
// the valve's own 40 and 55 frames a second; on a 50 Hz screen 33 and 46
// (it can never draw 55, so it would never step back up); on a 30 Hz
// television 20 and 28 (where 30 is as smooth as it can be, and would
// count as slow). Above 60 Hz it still aims at 60: a 144 Hz monitor's
// picture is smooth at 60, and chasing 144 would shed most of the detail
// for little.
//
// The Windows app is told the rate by Windows; a browser measures it, once
// for each screen, from the animation loop's timestamps while the picture
// isn't being drawn (nothing moving: app.js), when they come one a screen
// refresh apart. Pure: the measuring and the numbers; app.js and fps.js
// feed it.

import { SLOW_FPS, FAST_FPS } from "./safetyvalve.mjs";

// Rates screens run at: a measure this close to one (3%) is taken as it.
export const RATES = [24, 25, 30, 48, 50, 60, 72, 75, 85, 90, 100, 120, 144, 165, 170, 180, 200, 240, 360];
const SNAP = 0.03;
// What the valve aims at, at most (and what it aims at until a rate is known).
export const TOP_TARGET = 60;
// Intervals measured before saying a rate: about two seconds' worth.
export const SAMPLES = 120;

const clampRate = (hz) => (Number.isFinite(hz) && hz >= 20 && hz <= 400 ? hz : null);

// A measured rate (Hz) as a screen's: the standard rate it's within 3% of
// (59.94 is 60), else rounded.
export function snapRate(hz) {
  if (!clampRate(hz)) return null;
  for (const r of RATES) if (Math.abs(hz - r) / r <= SNAP) return r;
  return Math.round(hz);
}

// The screen's refresh rate (Hz) from animation frame intervals (ms) taken
// while the picture wasn't being drawn, or null if they don't agree enough
// to tell (the page was busy: frames late by a refresh or more). A late
// frame is a whole number of refreshes late, so the rate is from the
// shortest common interval: the quarter of the way up the sorted
// intervals, then the mean of all within 10% of it - at least half of
// them must be. min: how many it needs.
export function refreshFromIntervals(intervals, { min = SAMPLES * 0.75 } = {}) {
  const ok = (intervals ?? []).filter((d) => Number.isFinite(d) && d > 2 && d < 100).sort((a, b) => a - b);
  if (ok.length < min) return null;
  const guess = ok[Math.floor(ok.length / 4)];
  const near = ok.filter((d) => Math.abs(d - guess) <= guess * 0.1);
  if (near.length < ok.length / 2) return null;
  return snapRate(1000 / (near.reduce((s, d) => s + d, 0) / near.length));
}

// The frame rate the valve aims at for a screen's rate: the rate, up to
// TOP_TARGET (and TOP_TARGET while it isn't known).
export function targetFps(hz) {
  const r = clampRate(hz);
  return r ? Math.min(TOP_TARGET, r) : TOP_TARGET;
}

// The valve's two numbers for a target: its own (for 60) in proportion -
// under 40 sixtieths of it is slow, over 55 sixtieths room to step back up.
export function thresholds(target = TOP_TARGET) {
  return { slowFps: Math.round((target * SLOW_FPS) / TOP_TARGET), fastFps: Math.round((target * FAST_FPS) / TOP_TARGET) };
}

// A screen, for remembering its rate: its size and pixel ratio
// ("1920x1080@1"), or the Windows app's display id with it.
export function screenKey({ width = 0, height = 0, ratio = 1, id = null } = {}) {
  return `${id != null ? `${id}:` : ""}${Math.round(width)}x${Math.round(height)}@${Math.round(ratio * 100) / 100}`;
}

// The saved rates ({ screens: { key: { hz, how, at } } }: the setting
// "display"), tidied: only sensible rates, and at most 8 screens.
export function cleanDisplay(saved) {
  const out = { screens: {} };
  const list = Object.entries(saved?.screens ?? {})
    .filter(([k, v]) => typeof k === "string" && k.length <= 80 && snapRate(v?.hz) && (v.how === "app" || v.how === "measured"))
    .sort((a, b) => (b[1].at ?? 0) - (a[1].at ?? 0))
    .slice(0, 8);
  for (const [k, v] of list) out.screens[k] = { hz: snapRate(v.hz), how: v.how, at: Number.isFinite(v.at) ? v.at : 0 };
  return out;
}

// This screen's rate as kept: { hz, how } ("app": Windows said; "measured"),
// or null if it hasn't been measured on this screen yet.
export function knownRefresh(saved, key) {
  const s = cleanDisplay(saved).screens[key];
  return s ? { hz: s.hz, how: s.how } : null;
}

// The saved rates with this screen's set.
export function withRefresh(saved, key, hz, how = "measured", at = 0) {
  const out = cleanDisplay(saved);
  const r = snapRate(hz);
  if (!r) return out;
  out.screens[key] = { hz: r, how, at };
  return cleanDisplay(out);
}

// Collects the intervals while nothing's drawn and says the rate once it
// has enough that agree: tick(time) at the start of each loop with drawn:
// whether the picture was drawn in the one before (whose work may have
// made this one late, so that interval doesn't count). Gaps (a hidden
// window) don't count either.
export class RefreshMeter {
  constructor({ samples = SAMPLES } = {}) {
    this.samples = samples;
    this.reset();
  }

  reset() {
    this.last = null;
    this.intervals = [];
    this.hz = null;
  }

  // Returns the rate (Hz) once it's known, else null.
  tick(time, { drawn = false } = {}) {
    if (this.hz) return this.hz;
    const last = this.last;
    this.last = time;
    if (drawn || last === null || !Number.isFinite(time)) return null;
    const dt = time - last;
    if (dt > 0 && dt < 100) this.intervals.push(dt);
    if (this.intervals.length < this.samples) return null;
    this.hz = refreshFromIntervals(this.intervals, { min: this.samples * 0.75 });
    // Disagreeing: start again (the page was busy), keeping nothing.
    if (!this.hz) this.intervals = [];
    return this.hz;
  }
}

// In words, for the readout and a report: "60 Hz screen (from Windows)".
export function refreshText(known) {
  if (!known?.hz) return "screen's rate not measured yet";
  return `${known.hz} Hz screen (${known.how === "app" ? "from Windows" : "measured"})`;
}
