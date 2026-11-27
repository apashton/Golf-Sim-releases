// How the finished picture's colour is set (look/effects.js, the last pass
// on to the screen): the same sums here, in plain JS, so the tests can hold
// the colours to how they really come out.
//
// Tone mapped (three.js's Neutral, with the renderer's exposure) and turned
// to sRGB, then on the screen's own scale:
//   - natural colour (NATURAL): the saturation brought down towards what a
//     camera sees outdoors, most where a colour's strongest - the owner, 31
//     October: "the colour scheme is just a bit strong ... a more realistic
//     look". Neutral's toe takes away most of a dark colour's weakest part
//     (the blue in grass), so grass came out a neon green at 83 - 93% of
//     full saturation, where a fairway in the sun photographs at 50 - 60%;
//   - with the Warm colour switch on (GRADE): a touch warmer (white
//     balance, before the tone mapping), a little more contrast about the
//     middle of what's shown, and the corners a touch darker. (The contrast
//     was about a middle of 0.5 in linear light, which took 0.02 off
//     everything: all darker than about 37 of 255 on the screen came out
//     pure black - the shade under trees, calm ponds.)
// Pure.

export const GRADE = { warm: [1.03, 1.0, 0.955], contrast: 1.04, vignette: 0.22 };
// saturation: all colours' share kept; vibrance: how much less of it again
// the more saturated a colour already is (by its saturation squared: a
// full-strength colour keeps saturation * (1 + vibrance) of it, the sky's
// mild blue most of its own) - only for the colours of the grass, the
// leaves and the sand: hues within `near` degrees of `hue` (yellow-green),
// none past `far`, so the sky's blue and a flag's red keep theirs.
export const NATURAL = { saturation: 0.97, vibrance: -0.45, hue: 90, near: 40, far: 80 };

const LUMA = [0.2126, 0.7152, 0.0722];
const lumaOf = (c) => c[0] * LUMA[0] + c[1] * LUMA[1] + c[2] * LUMA[2];

// three.js's Neutral tone mapping (Khronos PBR Neutral), as the shader has it.
export function neutral(rgb, exposure = 1) {
  const start = 0.8 - 0.04;
  const desat = 0.15;
  let c = rgb.map((v) => v * exposure);
  const x = Math.min(...c);
  const offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
  c = c.map((v) => v - offset);
  const peak = Math.max(...c);
  if (peak < start) return c;
  const d = 1 - start;
  const newPeak = 1 - (d * d) / (peak + d - start);
  c = c.map((v) => (v * newPeak) / peak);
  const g = 1 - 1 / (desat * (peak - newPeak) + 1);
  return c.map((v) => v + (newPeak - v) * g);
}

export const toSRGB = (v) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

// Saturation of an sRGB colour (0 - 1): (max - min) / max.
export function saturationOf(s) {
  const mx = Math.max(...s);
  return mx > 1e-4 ? (mx - Math.min(...s)) / mx : 0;
}

// Its hue, degrees (0 red, 120 green, 240 blue).
export function hueOf([r, g, b]) {
  const mx = Math.max(r, g, b);
  const d = mx - Math.min(r, g, b);
  if (d < 1e-5) return 0;
  const h = mx === r ? (((g - b) / d) % 6 + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return h * 60;
}

const smoothstep = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// How much of the vibrance a hue takes (1 the grass's, 0 the sky's).
export function vegetation(h, { hue = NATURAL.hue, near = NATURAL.near, far = NATURAL.far } = {}) {
  const d = Math.abs(((h - hue + 540) % 360) - 180);
  return 1 - smoothstep(near, far, d);
}

// Natural colour on an sRGB colour (0 - 1 each).
export function naturalColour(s, natural = NATURAL) {
  const { saturation, vibrance } = { ...NATURAL, ...natural };
  const l = lumaOf(s);
  const st = saturationOf(s);
  const k = Math.max(0, saturation * (1 + vibrance * st * st * vegetation(hueOf(s), { ...NATURAL, ...natural })));
  return s.map((v) => l + (v - l) * k);
}

// A colour in the picture (linear light, before tone mapping) as it's
// shown: sRGB 0 - 1 each (vignette left out: the middle of the screen).
export function finishColour(rgb, { exposure = 1.1, grade = true, natural = NATURAL } = {}) {
  let c = grade ? rgb.map((v, i) => v * GRADE.warm[i]) : rgb.slice();
  c = neutral(c, exposure).map(clamp01);
  let s = naturalColour(c.map(toSRGB), natural);
  if (grade) s = s.map((v) => (v - 0.5) * GRADE.contrast + 0.5);
  return s.map(clamp01);
}
