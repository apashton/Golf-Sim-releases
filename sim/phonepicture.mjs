// The picture's size in the phone app (the owner, 24 October 2026: "What
// resolution is the phone app in. Should be in much lower resolution as
// phones are smaller screen. Getting low FPS"). On a PC the picture is
// drawn at up to twice the screen's pixels on Medium and up (app.js
// fullPixelRatio: sharp on a high-DPI monitor) - and a phone's screen is
// "high-DPI", two and a half to three and a half device pixels to each of
// the page's, so on Medium a phone drew some 1.5 million pixels a frame
// (1830 x 824 on a 915 x 412 page) on a phone's graphics chip.
//
// In the app the picture is drawn at a budget of pixels for the setting
// instead (PHONE_PIXELS), whatever the screen's own: a phone's screen is
// small enough that a picture under its own pixels, stretched to fit, still
// looks sharp, and the words and numbers over it are the page's own, drawn
// at the screen's (only the 3D picture is drawn smaller). Never more than
// the screen has, never less than PHONE_RATIO.least of the page's pixels
// (a tablet's big page), in steps of 0.05. The safety valve's picture
// steps (look/renderscale.js) still take it smaller again when it's slow.
//
// Pure: app.js and look/renderscale.js use it; test/phonepicture.test.mjs.

import { clamp } from "./mathutil.mjs";

// The 3D picture's pixels a frame, by graphics setting: on a 915 x 412
// page, Standard about 0.9 of the page's pixels each way (824 x 371),
// Medium 1.05 (961 x 433), High 1.25, Ultra 1.45 - against 2 (1830 x 824)
// for Medium and up before.
export const PHONE_PIXELS = { standard: 330_000, medium: 450_000, high: 600_000, ultra: 800_000 };
export const PHONE_RATIO = { least: 0.6, most: 2, step: 0.05 };

// The pixel ratio for the picture: dpr the screen's (devicePixelRatio);
// width and height the picture's on the page (CSS pixels); setting the
// graphics setting it's built at.
export function phonePixelRatio({ dpr = 1, width = 0, height = 0, setting = "medium" } = {}) {
  const screen = Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
  const page = Number(width) * Number(height);
  if (!(page > 0)) return Math.min(screen, 1);
  const budget = PHONE_PIXELS[setting] ?? PHONE_PIXELS.medium;
  const want = Math.sqrt(budget / page);
  const r = clamp(Math.min(screen, want), PHONE_RATIO.least, PHONE_RATIO.most);
  return Math.round(Math.floor(r / PHONE_RATIO.step + 1e-9) * PHONE_RATIO.step * 100) / 100;
}

// "961 x 433": the picture's pixels as drawn, for the frame rate's line.
export const pictureSizeText = (width, height) => `${Math.round(width)} × ${Math.round(height)}`;
