// Ultra's own finish (docs/GRAPHICS-NEXT.md section 6), the sums behind it.
// Pure: look/renderscale.js, look/mirrors.js and look/effects.js do the
// drawing, and the same numbers are in their shaders.
//
//   - Supersampling: the 3D picture drawn at up to 1.5 times the screen's
//     own pixels and shrunk to fit, so leaves, flag poles and the far
//     edge of a fairway are smooth - never past a 4K picture's worth of
//     pixels, so a big screen gets less of it, or none.
//   - Reflections in ponds: the scene drawn again from under the water
//     for the ponds in view - one picture for each water level, at most
//     MIRROR.most of them - so the trees on their banks stand upside
//     down in them.
//   - Depth of field in flyovers: the camera focused on the ball, the
//     hole round it and ahead sharp, only what's right by the camera (and
//     well beyond) soft.
//   - Light shafts: rays from the sun through the leaves and round the
//     trunks when it's in or near the picture, none when it's behind.

import { clamp, smoothstep01 } from "./mathutil.mjs";

// Supersampling: how much bigger, at most; no more pixels than this in
// all (3840 × 2160); and less than `least` isn't worth drawing.
export const SUPER = { factor: 1.5, maxPixels: 3840 * 2160, least: 1.1 };

// The picture's multisampling - each pixel's edges worked out from `full`
// samples as it's drawn (and the leaves' and grass's cut-outs, by alpha to
// coverage) - with fewer, `light`, once it's also supersampled by at least
// `superAt` and smoothed over time (TAA): three ways of smoothing its edges
// at once, and the third barely showed. Measured on Golf Sim Links' 1st
// from the tee (the audit of 1 November 2026): with 2 the picture differed
// from 4's by no more than two frames of 4 differ from each other (leaves,
// the flag's pole, the sign's edges and the far treeline at three times
// the size), and the samples are the most memory the picture's drawing
// moves - none at all was a third quicker there, but visibly softer
// leaves. Without supersampling (a 4K screen, the safety valve's first
// step, the camera flying) or TAA, all 4 as before.
export const MSAA = { full: 4, light: 2, superAt: 1.4 };
export function pictureSamples({ supersample = 1, taa = false } = {}) {
  return taa && supersample >= MSAA.superAt ? MSAA.light : MSAA.full;
}

// How much bigger the picture is drawn for a window `width` × `height`
// CSS pixels at the screen's `ratio`: 1 (none) to SUPER.factor.
export function supersample({ width, height, ratio = 1 } = {}) {
  const w = Number(width);
  const h = Number(height);
  const r = Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
  if (!(w > 0 && h > 0)) return 1;
  const full = w * h * r * r;
  const room = Math.sqrt(SUPER.maxPixels / full);
  const f = Math.min(SUPER.factor, room);
  // (Rounded down, so it never goes over.)
  return f >= SUPER.least ? Math.floor(f * 100) / 100 : 1;
}

// While a recording's made (`rec`: its { width, height } in pixels), only
// as much bigger as the recording can use - the picture's own size fitted
// into it - so none is drawn only to be thrown away as it's scaled down
// (the owner's 1280 x 800 game screen into a 1080p recording: 1.35, where
// 1.5 drew 1920 x 1200 for 1080 lines). Supersampling was off while
// recording (with the encoder on it stalled the card, #325, #326); the
// recording guard (fps.js) sheds it first if the picture can't keep up.
export function recordingSupersample({ width, height, ratio = 1, rec = null } = {}) {
  const most = supersample({ width, height, ratio });
  const r = Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
  const w = Number(width) * r;
  const h = Number(height) * r;
  if (!(rec?.width > 0 && rec?.height > 0) || !(w > 0 && h > 0)) return 1;
  const fit = Math.min(rec.width / w, rec.height / h);
  const f = Math.min(most, fit);
  return f >= SUPER.least ? Math.floor(f * 100) / 100 : 1;
}

// Supersampling eased while the camera flies (the owner's report, 20
// October 2026: at Ultra's slowest moment it was 30% of the frame): a
// ball's flight followed, a flyover, the speed test's fly-through - the
// picture moving, where smooth edges show least - drawn at the screen's
// own pixels (`factor`), and in full again `hold` seconds after the
// camera stops. Never while recording: then as much as the recording can
// use, all through (recordingSupersample).
export const FLY = { factor: 1, hold: 0.3 };

// Whether this frame's picture is eased: `state` ({ eased, left }) kept
// from frame to frame; moving: the camera on one of those moves;
// recording: a session being recorded; dt: seconds since the last frame.
export function flyEase(state, { moving = false, recording = false, dt = 0 } = {}) {
  if (recording) {
    state.eased = false;
    state.left = 0;
  } else if (moving) {
    state.eased = true;
    state.left = FLY.hold;
  } else if (state.eased) {
    state.left -= Number.isFinite(dt) ? dt : 0;
    if (state.left <= 0) state.eased = false;
  }
  return state.eased;
}

// The renderer's pixel ratio: the screen's own (`base`), times the safety
// valve's share (1, 0.85, 0.7 - never more), times the supersampling
// (`extra`, 1 when it's off or shed). Rounded, so the same numbers always
// give the same size.
export function pictureRatio(base, share = 1, extra = 1) {
  const b = Number.isFinite(base) && base > 0 ? base : 1;
  const s = Number.isFinite(share) && share > 0 ? Math.min(share, 1) : 1;
  const x = Number.isFinite(extra) && extra >= 1 ? extra : 1;
  return Math.round(b * s * x * 1000) / 1000;
}

// Reflections: at most this many water levels mirrored a frame, levels
// within `join` metres of each other sharing a picture (a pond's own
// edge varies a little), drawn at `scale` of the picture's size.
// keep: a frame's pictures are kept for the next (every other frame drawn
// afresh) while the camera's moved less than `move` metres and turned less
// than `turn` radians since they were drawn - a ball followed in flight
// moves it a metre or so a frame; a cut to another camera, far more.
export const MIRROR = { most: 2, join: 0.3, scale: 0.5, keep: { move: 3, turn: 0.06 } };

// Whether last frame's reflections do for this one: the camera `moved`
// metres and `turned` radians since they were drawn.
export function keepMirrors(moved, turned, keep = MIRROR.keep) {
  return moved < keep.move && turned < keep.turn;
}

// Which water levels get a picture this frame: waters [{ level, near }]
// (near: metres from the camera to the closest of it), those in view.
// Returns [{ level, members: [index...] }], nearest first, at most
// MIRROR.most; a pond whose level isn't among them has none this frame
// (it shows the far bank as it did without, worked out in its shader).
export function mirrorLevels(waters, { most = MIRROR.most, join = MIRROR.join } = {}) {
  const groups = [];
  const order = waters
    .map((w, i) => ({ ...w, i }))
    .filter((w) => Number.isFinite(w.level))
    .sort((a, b) => (a.near ?? Infinity) - (b.near ?? Infinity));
  for (const w of order) {
    const g = groups.find((g) => Math.abs(g.level - w.level) <= join);
    if (g) g.members.push(w.i);
    else if (groups.length < most) groups.push({ level: w.level, members: [w.i] });
  }
  return groups;
}

// Depth of field in a flyover: the ball and the hole round it and ahead
// sharp - from `near` of the focus distance (the camera's from the ball)
// out to `far` times it, and never nearer than `reach` metres - and only
// what all but touches the camera, or lies well past that, softened:
// full by `nearSoft` of the focus distance nearer, or `farSoft` of the far
// edge further, to `amount` of the far blur's own softening. (The first
// try was sharp only within 18% of the ball's distance and fully soft by
// 78% past it: with the camera 15 m behind the ball, the whole hole ahead
// and the sky - the owner, 15 October 2026: "the hole replay was fully
// blurred".)
export const FOCUS = { near: 0.45, nearSoft: 0.3, far: 6, reach: 160, farSoft: 2, amount: 0.55 };

// Where the picture's sharp, focused at `focus` metres: { near: [edge,
// soft], far: [edge, soft] } in metres - sharp from near's edge out to
// far's, fully soft `soft` metres past either. null with no focus.
export function focusRange(focus) {
  if (!(focus > 0)) return null;
  const far = Math.max(focus * FOCUS.far, FOCUS.reach);
  return { near: [focus * FOCUS.near, focus * FOCUS.nearSoft], far: [far, far * FOCUS.farSoft] };
}

// How blurred a spot `z` metres away is with the camera focused at
// `focus` metres (0 sharp, 1 the most, before FOCUS.amount): the same sum
// as the shader's.
export function focusBlur(z, focus) {
  const r = focusRange(focus);
  if (!r || !Number.isFinite(z)) return 0;
  return smoothstep01(Math.max(clamp((r.near[0] - z) / r.near[1], 0, 1), clamp((z - r.far[0]) / r.far[1], 0, 1)));
}

// Light shafts: how strong (0 - 1), from where the sun is in the picture
// - `x`, `y` its place on the screen (-1 to 1 across it), `ahead` whether
// it's in front of the camera at all. Full with the sun in the picture,
// fading out as it goes past the edge, none from behind.
// (The first try - 0.22 of all the sky within 0.7 of the picture round the
// sun - washed the whole picture milky: now only the brightest sky right
// round the sun feeds them.)
// cap: no part of the source brighter than this - the sun's disc in open
// sky overflowed the half floats the rays are summed in (and blacked out
// the picture).
export const SHAFTS = { strength: 0.08, decay: 0.95, samples: 40, reach: 0.35, fade: 0.6, floor: 1.2, cap: 6 };
export function shaftsStrength({ x, y, ahead }) {
  if (!ahead || !Number.isFinite(x) || !Number.isFinite(y)) return 0;
  const out = Math.max(Math.abs(x), Math.abs(y)) - 1;
  if (out <= 0) return 1;
  const t = Math.min(1, out / SHAFTS.fade);
  return 1 - t * t * (3 - 2 * t);
}

// Temporal anti-aliasing (TAA): each frame drawn from a camera nudged by
// a fraction of a pixel, in turn round TAA.frames places (a Halton
// sequence, so they cover the pixel evenly), and blended into the frames
// before - `blend` of what came before kept - where they agree; where
// they don't (something moved), the earlier ones held to what this frame
// could be, so nothing smears. A resting check (the picture paused) isn't
// nudged, so a still picture settles and stays still.
export const TAA = { frames: 8, blend: 0.9 };

// The Halton sequence's i-th number in base b (0 - 1).
export function halton(i, b) {
  let f = 1;
  let r = 0;
  for (let n = i + 1; n > 0; n = Math.floor(n / b)) {
    f /= b;
    r += f * (n % b);
  }
  return r;
}

// The nudge for frame n, in pixels (-0.5 - 0.5 each way); none when still.
// Upscaling (UPSCALE), over more frames - more places in each of the
// picture's pixels for the full-size one to be built from - and never
// still: unnudged, it'd stay at the picture's own size.
export function taaJitter(n, { still = false, upscale = false } = {}) {
  if (still && !upscale) return [0, 0];
  const frames = upscale ? UPSCALE.frames : TAA.frames;
  const i = ((n % frames) + frames) % frames;
  return [halton(i, 2) - 0.5, halton(i, 3) - 0.5];
}

// Temporal upscaling (the owner's list, 2 November 2026: "draw fewer pixels
// and build the rest from earlier frames"; the Temporal upscaling switch,
// on Ultra with smoothing over time): the 3D picture drawn at `share` of
// its size each way (0.67: under half its pixels), nudged a different
// fraction of a pixel each frame, and TAA building the full-size picture
// from it - each frame's sample counted most at the pixel it lands on
// (sharp: how fast it falls off, a pixel of the drawn picture away) and
// this frame's share of each pixel never under `least`, so a change
// still shows. On Ultra's supersampled picture (SUPER) about the pixels of
// the screen's own size drawn, for the supersampled look; on the phone
// (no supersampling), two-thirds of its own.
export const UPSCALE = { share: 0.67, frames: 16, sharp: 2.2, least: 0.04, most: 0.3 };
// The picture's size for a w x h one, upscaled (or not).
export function upscaledSize(w, h, on = true) {
  const k = on ? UPSCALE.share : 1;
  return [Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k))];
}
// This frame's share of a pixel whose nearest sample is d pixels (of the
// drawn picture) off it, with history to blend with (blend: TAA's) - the
// shader's sum (look/effects.js TAAU_FRAG).
export function upscaleShare(d, blend = TAA.blend) {
  const w = Math.exp(-UPSCALE.sharp * d * d);
  return Math.min(UPSCALE.most, Math.max(UPSCALE.least, (1 - blend) * 2.5 * w));
}

// Living water: where a ball goes in, rings spread out over the pond -
// SPLASH.rings of them, `gap` seconds apart, running out at `speed` metres a
// second (faster for a bigger splash) and gone by `life` seconds. At most
// SPLASH.most at once, the oldest giving way. The same sums are in the
// water's shader (look/sandwater.js).
export const SPLASH = { most: 4, life: 5, speed: 0.8, rings: 3, gap: 0.55 };

// The splashes with one more: list [{ x, z, time, size }] (size 0 - 1, how
// big a splash), the newest last; those over (`time` past their life) left
// out.
export function addSplash(list, splash) {
  const live = list.filter((s) => splash.time - s.time < SPLASH.life);
  const size = Math.min(1, Math.max(0, Number(splash.size) || 0));
  return [...live, { ...splash, size }].slice(-SPLASH.most);
}

// The size of a splash for a ball going in at `speed` m/s: 0.3 for a ball
// rolling in, 1 for one coming down hard.
export function splashSize(speed) {
  const s = Number.isFinite(speed) ? speed : 0;
  return Math.min(1, 0.3 + s / 40);
}

// A splash's rings `age` seconds after it: [{ r, k }] each ring's radius
// (metres) and strength (0 - 1), those not yet started left out.
export function splashRings(age, size = 1) {
  if (!(age >= 0) || age >= SPLASH.life) return [];
  const fade = (1 - age / SPLASH.life) ** 2;
  const out = [];
  for (let i = 0; i < SPLASH.rings; i++) {
    const a = age - i * SPLASH.gap;
    if (a < 0) break;
    out.push({ r: a * SPLASH.speed * (0.6 + 0.4 * size), k: fade * size * (1 - i * 0.25) });
  }
  return out;
}
