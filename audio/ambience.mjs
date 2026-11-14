// The rules for the background sounds - wind, birds, water, rain - kept apart from
// the Web Audio code so they can be tested. Each decision takes the random
// source it uses, so the tests can pin it down.

import { between, count, vary, distanceGain } from "./params.mjs";

import { clamp } from "../sim/mathutil.mjs";

// ---- Wind ------------------------------------------------------------------------------

// Wind wanders: every few seconds a new level and brightness to drift
// towards. `strength` 0-1 (a still day to a breezy one); always subtle.
export function windTarget(strength = 0.35, rand = Math.random) {
  const s = clamp(strength, 0, 1);
  return {
    level: (0.09 + 0.3 * s) * between(rand, 0.55, 1.15),
    cutoff: between(rand, 280, 750) * (0.8 + 0.7 * s),
    // Seconds to drift there, and how long until the next change.
    glide: between(rand, 1.5, 4),
    next: between(rand, 2.5, 6),
  };
}

// How strong the background wind is for the day's wind (mph): quiet in a
// calm, fuller in a strong wind - windTarget's `strength`, 0 - 1.
export function windStrength(mph = 0) {
  return clamp(0.08 + (Math.max(0, mph) / 30) * 0.9, 0.08, 1);
}

// The wind's level and brightness this moment, from the gust clock (the
// flags' and trees' own: sim/weather.mjs gustEnvelope, 0.7 - 1.35) - so a
// gust heard is the gust seen, and since the clock never repeats, nor does
// the wind. Multipliers on windTarget's level and cutoff; the level never
// more than MAX_WIND_LEVEL, well under the shots.
export const MAX_WIND_LEVEL = 0.5;
export function gustShape(gust = 1) {
  const g = clamp(gust, 0.5, 1.5) - 1;
  return { level: clamp(1 + 2.2 * g, 0.3, 1.8), bright: clamp(1 + 1.4 * g, 0.5, 1.6) };
}

// ---- Rain -----------------------------------------------------------------------------

// The rain's hiss (0 - 1 how hard it's raining: look/weatherlook.js rain):
// its level, and how often a nearer drop patters (a second).
export function rainSound(rain = 0) {
  const r = clamp(rain, 0, 1);
  return { level: r > 0.01 ? 0.05 + 0.2 * r : 0, patter: r > 0.01 ? 4 + 18 * r : 0 };
}

// When the patter's drops go in the next `dt` seconds (seconds from now,
// sorted), `perSecond` of them on average.
export function rainDrops(dt, perSecond, rand = Math.random) {
  const n = Math.min(60, Math.floor(perSecond * dt + rand()));
  const out = [];
  for (let i = 0; i < n; i++) out.push(between(rand, 0, dt));
  return out.sort((a, b) => a - b);
}

// Whether a gust starts in the next `dt` seconds (about one every 25 s on
// a light day, more often when it's windier), and its shape if so.
export function windGust(dt, strength = 0.35, rand = Math.random) {
  const perSecond = (0.025 + 0.06 * clamp(strength, 0, 1));
  if (rand() >= 1 - Math.exp(-perSecond * dt)) return null;
  return {
    boost: between(rand, 1.5, 2.3),
    bright: between(rand, 1.4, 2),
    rise: between(rand, 0.8, 2.2),
    hold: between(rand, 0.3, 1.8),
    fall: between(rand, 2, 4.5),
  };
}

// ---- Birds ---------------------------------------------------------------------------------

// The birds, each a synthesized call: how often each calls (per minute at
// the middle density), and how far off it usually is (metres).
export const BIRDS = {
  chirp: { name: "Chirping", perMinute: 5, near: 15, far: 70 },
  warble: { name: "Warbling song", perMinute: 2.5, near: 20, far: 90 },
  whistle: { name: "Two-note whistle", perMinute: 2.5, near: 20, far: 80 },
  cuckoo: { name: "Distant cuckoo", perMinute: 0.7, near: 90, far: 220 },
  caw: { name: "Crow", perMinute: 0.5, near: 30, far: 100 },
};
export const BIRD_NAMES = Object.keys(BIRDS);
// At most this many calls at once, so the birds never pile up.
export const MAX_BIRD_CALLS = 5;

// Calls per minute for each bird: `density` 0-1 (the setting: few to lots),
// `dusk` 0-1 (quieter and rarer as the light goes) and `rain` 0-1 (fewer
// in the rain).
export function birdRates(density = 0.5, dusk = 0, rain = 0) {
  // A few at the bottom of the slider, about the listed rates in the
  // middle, twice as many at the top.
  const k = densityScale(density) * (1 - 0.75 * clamp(dusk, 0, 1)) * (1 - 0.75 * clamp(rain, 0, 1));
  const out = {};
  for (const [id, b] of Object.entries(BIRDS)) out[id] = b.perMinute * Math.max(0, k);
  return out;
}

// Which birds start calling in the next `dt` seconds, given `busy` calls
// already going: each by its own rate, independently, so two can start
// together - and now and then one answers another a moment later.
// Returns [{ bird, delay }].
export function birdsToStart(dt, rates, busy = 0, rand = Math.random) {
  const out = [];
  for (const id of BIRD_NAMES) {
    if (busy + out.length >= MAX_BIRD_CALLS) break;
    const rate = (rates[id] ?? 0) / 60;
    if (rate > 0 && rand() < 1 - Math.exp(-rate * dt)) {
      out.push({ bird: id, delay: between(rand, 0, dt) });
      // An answer, from the same kind of bird somewhere else.
      if (busy + out.length < MAX_BIRD_CALLS && id !== "cuckoo" && rand() < 0.15) out.push({ bird: id, delay: between(rand, 0.3, 1.6) });
    }
  }
  return out;
}

// Where a call comes from: how far (metres) and left-right (-1 to 1).
export function birdPlace(bird, rand = Math.random) {
  const b = BIRDS[bird] ?? BIRDS.chirp;
  return { distance: between(rand, b.near, b.far), pan: between(rand, -0.85, 0.85) };
}

// A bird's call as a list of notes, each { at, dur, from, to, gain } -
// start (s), length, the pitch it glides from and to (Hz), and loudness -
// plus what the voice is: wave, trill (a warble's flutter: { rate, depth }),
// buzz (a crow's rasp, Hz) and formants (Hz), harmonic (a second partial's
// share).
export function birdCall(bird, rand = Math.random) {
  const notes = [];
  if (bird === "chirp") {
    const n = count(rand, 2, 6);
    const base = between(rand, 3200, 5200);
    const up = rand() < 0.5;
    let at = 0;
    for (let i = 0; i < n; i++) {
      const f = vary(rand, base, 0.08);
      const dur = between(rand, 0.035, 0.085);
      notes.push({ at, dur, from: up ? f * 0.75 : f * 1.15, to: up ? f * 1.15 : f * 0.7, gain: between(rand, 0.5, 0.85) });
      at += dur + between(rand, 0.04, 0.12);
    }
    return { bird, wave: "sine", notes };
  }
  if (bird === "warble") {
    const n = count(rand, 5, 10);
    let f = between(rand, 2400, 3800);
    let at = 0;
    for (let i = 0; i < n; i++) {
      const dur = between(rand, 0.06, 0.16);
      const next = Math.min(5200, Math.max(1900, f * between(rand, 0.78, 1.3)));
      notes.push({ at, dur, from: f, to: next, gain: between(rand, 0.45, 0.8) });
      f = next;
      at += dur + between(rand, 0.005, 0.05);
    }
    return { bird, wave: "sine", trill: { rate: between(rand, 22, 40), depth: between(rand, 0.02, 0.06) }, notes };
  }
  if (bird === "whistle") {
    // Two notes, high then low ("tea-cher") or low then high, said a few times.
    const hi = between(rand, 2600, 3700);
    const lo = hi * between(rand, 0.72, 0.84);
    const down = rand() < 0.7;
    const reps = count(rand, 2, 4);
    const dur = between(rand, 0.13, 0.22);
    let at = 0;
    for (let i = 0; i < reps; i++) {
      const [a, b] = down ? [hi, lo] : [lo, hi];
      notes.push({ at, dur, from: a * 1.02, to: a * 0.98, gain: 0.7 });
      notes.push({ at: at + dur + 0.04, dur: dur * 1.2, from: b, to: b * 0.97, gain: 0.6 });
      at += dur * 2.2 + 0.04 + between(rand, 0.12, 0.25);
    }
    return { bird, wave: "sine", notes };
  }
  if (bird === "cuckoo") {
    const f = between(rand, 620, 780);
    const reps = count(rand, 2, 4);
    const period = between(rand, 0.75, 1);
    for (let i = 0; i < reps; i++) {
      notes.push({ at: i * period, dur: between(rand, 0.18, 0.24), from: f * 1.01, to: f, gain: 1 });
      notes.push({ at: i * period + between(rand, 0.28, 0.34), dur: between(rand, 0.24, 0.32), from: f * 0.8, to: f * 0.79, gain: 0.85 });
    }
    return { bird, wave: "sine", harmonic: 0.15, notes };
  }
  // A crow: one to four harsh, falling caws.
  const reps = count(rand, 1, 4);
  const f = between(rand, 380, 540);
  let at = 0;
  for (let i = 0; i < reps; i++) {
    const dur = between(rand, 0.24, 0.42);
    notes.push({ at, dur, from: vary(rand, f, 0.05), to: f * between(rand, 0.78, 0.9), gain: between(rand, 0.75, 1) });
    at += dur + between(rand, 0.18, 0.4);
  }
  return { bird: "caw", wave: "sawtooth", buzz: between(rand, 45, 75), formants: [between(rand, 1100, 1450), between(rand, 2300, 2800)], notes };
}

// ---- Ducks and swans ---------------------------------------------------------------------

// The ducks and swans on a scene's ponds (sim/furniture.mjs pondBirds,
// placed in the world): each calls now and then from where it sits, heard
// from the camera - louder nearer, from its side, and not at all from
// further than `far` metres. Ducks quack a few times together; swans,
// rarer, grunt or give a soft honk. perMinute is each bird's at the middle
// of the How many birds setting.
export const FOWL = {
  duck: { perMinute: 0.8, far: 80, ref: 12 },
  swan: { perMinute: 0.3, far: 100, ref: 15 },
};
// At most this many calls from the water at once.
export const MAX_FOWL_CALLS = 2;

// The How many birds setting (0-1) as a multiple of the usual rates: a few
// at the bottom, twice as many at the top.
export function densityScale(density = 0.5) {
  return 0.15 + 1.85 * Math.pow(clamp(density, 0, 1), 1.2);
}

// Which of the birds on the water start calling in the next `dt` seconds,
// heard from `from` ([x, y, z]): only those near enough to hear, each by
// its own rate, with `busy` calls already going. fowl: [{ kind, at: [x, y,
// z] }]. Returns [{ i, delay }] (i: which bird).
export function fowlToStart(dt, fowl, from, density = 0.5, busy = 0, rand = Math.random) {
  const out = [];
  if (!fowl?.length || !from) return out;
  const k = densityScale(density);
  for (const [i, b] of fowl.entries()) {
    if (busy + out.length >= MAX_FOWL_CALLS) break;
    const f = FOWL[b.kind];
    if (!f || Math.hypot(b.at[0] - from[0], b.at[2] - from[2]) > f.far) continue;
    const rate = (f.perMinute * k) / 60;
    if (rand() < 1 - Math.exp(-rate * dt)) out.push({ i, delay: between(rand, 0, dt) });
  }
  return out;
}

// A made-up call for a duck or swan, in birdCall's form (synth.js plays
// it): a duck's two to four nasal quacks, falling; a swan's one or two
// low, soft grunts.
export function fowlCall(kind, rand = Math.random) {
  const notes = [];
  if (kind === "swan") {
    const reps = count(rand, 1, 2);
    const f = between(rand, 260, 340);
    let at = 0;
    for (let i = 0; i < reps; i++) {
      const dur = between(rand, 0.22, 0.4);
      notes.push({ at, dur, from: vary(rand, f, 0.04), to: f * between(rand, 0.85, 0.95), gain: between(rand, 0.6, 0.85) });
      at += dur + between(rand, 0.25, 0.5);
    }
    return { bird: "swan", wave: "sawtooth", buzz: between(rand, 25, 35), formants: [between(rand, 600, 800), between(rand, 1300, 1600)], notes };
  }
  const reps = count(rand, 2, 4);
  const f = between(rand, 430, 560);
  let at = 0;
  for (let i = 0; i < reps; i++) {
    const dur = between(rand, 0.11, 0.17);
    // Each quack a touch lower and softer than the one before.
    notes.push({ at, dur, from: f * (1 - 0.04 * i), to: f * (0.78 - 0.04 * i), gain: 1 - 0.15 * i });
    at += dur + between(rand, 0.06, 0.16);
  }
  return { bird: "duck", wave: "sawtooth", buzz: between(rand, 55, 80), formants: [between(rand, 950, 1250), between(rand, 2100, 2600)], notes };
}

// How long a call lasts, seconds.
export function callLength(call) {
  return call.notes.reduce((end, n) => Math.max(end, n.at + n.dur), 0);
}

// ---- Water -------------------------------------------------------------------------------

// The water near a scene, as outlines in the world's ground plane
// ([[x, z], ...], at least three points each) and its surface height.
// A long thin one is a stream (it babbles), anything rounder a pond (it laps).
export function waterKind(points) {
  if (!points || points.length < 3) return "pond";
  let area = 0;
  let perimeter = 0;
  for (let i = 0; i < points.length; i++) {
    const [x0, z0] = points[i];
    const [x1, z1] = points[(i + 1) % points.length];
    area += x0 * z1 - x1 * z0;
    perimeter += Math.hypot(x1 - x0, z1 - z0);
  }
  area = Math.abs(area) / 2;
  // 1 for a circle, small for a long thin strip.
  const round = perimeter > 0 ? (4 * Math.PI * area) / (perimeter * perimeter) : 1;
  return round < 0.22 ? "stream" : "pond";
}

// How far (metres, along the ground) a point is from a stretch of water's
// edge, and the nearest point on it; 0 inside it.
export function distanceToWater(points, x, z) {
  let best = Infinity;
  let at = points[0] ?? [x, z];
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [ax, az] = points[j];
    const [bx, bz] = points[i];
    if (az > z !== bz > z && x < ((bx - ax) * (z - az)) / (bz - az) + ax) inside = !inside;
    const dx = bx - ax;
    const dz = bz - az;
    const len2 = dx * dx + dz * dz;
    const t = len2 > 0 ? clamp(((x - ax) * dx + (z - az) * dz) / len2, 0, 1) : 0;
    const px = ax + dx * t;
    const pz = az + dz * t;
    const d = Math.hypot(x - px, z - pz);
    if (d < best) {
      best = d;
      at = [px, pz];
    }
  }
  return { distance: inside ? 0 : best, point: inside ? [x, z] : at };
}

// How loud a stretch of water is heard from `distance` metres away (and
// `height` above it): clear from the bank, still there from the fairway
// beside it (where a following camera usually is), gone from the far side
// of a long hole.
export function waterLevel(distance, height = 0, kind = "pond") {
  const d = Math.hypot(Math.max(0, distance), Math.max(0, height));
  const g = distanceGain(d, kind === "stream" ? 13 : 10);
  // Fade right out rather than hang on as a faint hiss.
  const fade = clamp((220 - d) / 80, 0, 1);
  return g * fade;
}

// When the bubbles and trickles of a stretch of water go in the next `dt`
// seconds: a stream babbles, a pond now and then. Seconds from now, sorted.
export function waterBlips(dt, kind = "pond", rand = Math.random) {
  const perSecond = kind === "stream" ? 9 : 1.6;
  const n = Math.min(40, Math.floor(perSecond * dt + rand()));
  const out = [];
  for (let i = 0; i < n; i++) out.push(between(rand, 0, dt));
  return out.sort((a, b) => a - b);
}

// The lapping: a swell every second or so, stronger on a pond.
export function lapSwell(kind = "pond", rand = Math.random) {
  const stream = kind === "stream";
  return {
    peak: between(rand, stream ? 0.7 : 0.55, 1),
    trough: between(rand, stream ? 0.5 : 0.2, stream ? 0.7 : 0.45),
    rise: between(rand, stream ? 0.15 : 0.3, stream ? 0.4 : 0.8),
    fall: between(rand, stream ? 0.2 : 0.4, stream ? 0.5 : 1.1),
  };
}
