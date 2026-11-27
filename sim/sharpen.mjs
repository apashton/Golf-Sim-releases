// A sharper picture (the owner, 20 November 2026: "a solid round of graphic
// improvements ... a new leap in improved quality"): the finished picture's
// fine detail - grass blades, leaves, a bunker's lip, the far tree line -
// brought back where smoothing took it. The highest setting draws two
// thirds of the pixels each way and builds the picture up over time
// (sim/ultra.mjs UPSCALE, TAA), which leaves it soft; a card's own
// smoothing softens the others a little too.
//
// The sum is AMD's contrast-adaptive sharpening (CAS), in the form that
// doesn't scale the picture: each pixel against its four neighbours, by
// how much room they leave before a colour would clip - so flat ground
// and hard edges are left nearly alone (no bright rims round a trunk
// against the sky) and soft detail gets the most. Worked on the picture's
// light folded into 0 - 1 (tame: look/effects.js TAA's), so the sun's glint
// doesn't ring. Never the sky (a cloud's own grain isn't detail), and none
// where the far blur softens on purpose (look/effects.js).
//
// The same sums here, in plain JS, as the last pass's shader (look/
// effects.js OUT_FRAG; look/glsl/effectsnode.js on WebGPURenderer), for
// the tests. Pure.

// How much: the weight each neighbour is taken off with at the most (CAS's
// own runs from 1/8 to 1/5; a lone pixel's difference from those round it
// grows 1 / (1 - 4 x weight) times - twice at 1/8), by how the picture was
// smoothed: built up from fewer pixels, smoothed over time at full size,
// or drawn whole (the card's own smoothing, FXAA).
// (eased: the highest setting's picture while the camera flies - a ball
// followed, a flyover - drawn smaller still and never at rest, so the
// softest of all: sim/ultra.mjs FLY.)
export const SHARPEN = { eased: 0.16, upscaled: 0.125, taa: 0.09, plain: 0.055 };

// The weight for a picture: `taa` smoothed over time, `upscale` built up
// from fewer pixels, `eased` drawn smaller while the camera flies.
export const sharpenFor = ({ taa = false, upscale = false, eased = false } = {}) => (taa ? (eased ? SHARPEN.eased : upscale ? SHARPEN.upscaled : SHARPEN.taa) : SHARPEN.plain);

// How far off a pixel's four neighbours are read, across and up, as a
// share of the picture: one pixel of the *screen*, not of the picture read
// - the highest setting's is drawn up to half as big again as the screen
// and shrunk to fit (sim/ultra.mjs SUPER), and detail sharpened a pixel of
// that apart is lost again in the shrinking. Never nearer than one of the
// picture's own (drawn smaller than the screen - the safety valve's last
// steps, the eased picture while the camera flies - its pixels are the
// coarser).
//   source: the picture read, [w, h] pixels; full: the canvas drawn to,
//   [w, h] pixels; supersample: how many of the canvas's pixels make one of
//   the screen's, each way (1: none).
export function sharpenStep({ source, full, supersample = 1 }) {
  const k = Math.max(1, supersample);
  return [Math.max(1 / source[0], k / full[0]), Math.max(1 / source[1], k / full[1])];
}

// A light (any size, linear) folded into 0 - 1, and back.
export const tame = (c) => {
  const m = Math.max(c[0], c[1], c[2]);
  return c.map((v) => v / (1 + m));
};
export const untame = (c) => {
  const m = Math.max(c[0], c[1], c[2]);
  return c.map((v) => v / Math.max(1 - m, 1e-3));
};

// One pixel sharpened: c its own colour, n, s, w, e its neighbours' (each
// [r, g, b], 0 - 1, tamed), weight the most each neighbour is taken off
// with (SHARPEN).
export function cas(c, n, s, w, e, weight) {
  return c.map((v, i) => {
    const mn = Math.min(v, n[i], s[i], w[i], e[i]);
    const mx = Math.max(v, n[i], s[i], w[i], e[i]);
    // The room before clipping, as a share of the brightest: none at an
    // edge already at full contrast, all of it on soft detail.
    const amp = Math.sqrt(Math.min(1, Math.max(0, Math.min(mn, 1 - mx) / Math.max(mx, 1e-4))));
    const wgt = -amp * weight;
    return Math.min(0.999, Math.max(0, (v + (n[i] + s[i] + w[i] + e[i]) * wgt) / (1 + 4 * wgt)));
  });
}
