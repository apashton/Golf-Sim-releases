// Cropping a picture layer (the game, a camera) the way OBS does (the
// owner, 1 November 2026: "enable cutting some of the screen so even though
// it draws a 4:3 picture we might pick a specific 3:3 section of the
// screen to share. OBS used holding alt and then moving the line"): an
// edge dragged with Alt cuts the picture there - the box gets smaller on
// that side and the picture in it stays exactly where it was, the same
// size, rather than being squeezed or re-centred. Dragged back out, it
// shows more again, up to the picture's own edge.
//
// It's kept as the layer's zoom and pan (sim/videolayout.mjs coverSource:
// the part of the source a box shows is the biggest of its shape, made
// smaller by zoom and moved by pan), so a crop needs nothing new in a
// layout or a scenes file. Pure: videopanel.js is the designer.

import { coverSource, ZOOM_LIMITS } from "./videolayout.mjs";

import { clamp } from "./mathutil.mjs";

// The zoom and pan that show source rectangle S (with the same shape as a
// box) in a box: { zoom, panX, panY }, or null when it's more than the
// zoom can do.
export function viewOf(S, srcW, srcH) {
  const a = S.sw / S.sh;
  const baseW = Math.min(srcW, srcH * a);
  const zoom = baseW / S.sw;
  if (zoom > ZOOM_LIMITS.max + 1e-6) return null;
  const panX = srcW - S.sw > 0.5 ? clamp((2 * S.sx) / (srcW - S.sw) - 1, -1, 1) : 0;
  const panY = srcH - S.sh > 0.5 ? clamp((2 * S.sy) / (srcH - S.sh) - 1, -1, 1) : 0;
  const r = (v) => Math.round(v * 10000) / 10000;
  return { zoom: r(clamp(zoom, ZOOM_LIMITS.min, ZOOM_LIMITS.max)), panX: r(panX), panY: r(panY) };
}

// An edge (or corner) dragged with Alt: the box from R0 to R1 (pixels of the
// recording), the picture in it left where it was. srcW x srcH: the
// source's size. Returns { rect, zoom, panX, panY } - rect pulled back to
// the picture's own edge if it was dragged out past it - or null when it
// can't be cut that small.
export function cropDrag(layer, srcW, srcH, R0, R1) {
  if (!(srcW > 0 && srcH > 0 && R0.w > 0 && R0.h > 0 && R1.w > 0 && R1.h > 0)) return null;
  const S = coverSource(srcW, srcH, R0.w, R0.h, layer);
  // Source pixels to each of the box's (the same both ways: never stretched).
  const k = S.sw / R0.w;
  const r = { ...R1 };
  let sx = S.sx + (r.x - R0.x) * k;
  let sy = S.sy + (r.y - R0.y) * k;
  let sw = r.w * k;
  let sh = r.h * k;
  // Not past the picture's own edges.
  if (sx < 0) {
    r.x -= sx / k;
    r.w += sx / k;
    sw += sx;
    sx = 0;
  }
  if (sy < 0) {
    r.y -= sy / k;
    r.h += sy / k;
    sh += sy;
    sy = 0;
  }
  if (sx + sw > srcW) {
    r.w -= (sx + sw - srcW) / k;
    sw = srcW - sx;
  }
  if (sy + sh > srcH) {
    r.h -= (sy + sh - srcH) / k;
    sh = srcH - sy;
  }
  if (!(r.w > 1 && r.h > 1)) return null;
  const v = viewOf({ sx, sy, sw, sh }, srcW, srcH);
  return v ? { rect: r, ...v } : null;
}

// How much of the source is cut off each side, as shares of it: { left,
// right, top, bottom } (0 - 1).
export function cropAmounts(layer, srcW, srcH, R) {
  if (!(srcW > 0 && srcH > 0 && R.w > 0 && R.h > 0)) return { left: 0, right: 0, top: 0, bottom: 0 };
  const S = coverSource(srcW, srcH, R.w, R.h, layer);
  const r = (v) => Math.max(0, Math.round(v * 1000) / 1000);
  return { left: r(S.sx / srcW), right: r((srcW - S.sx - S.sw) / srcW), top: r(S.sy / srcH), bottom: r((srcH - S.sy - S.sh) / srcH) };
}

// Cut to the shares asked ({ left, right, top, bottom }, each 0 to under
// 1), the picture left where it is and the same size on screen - the box
// shrinking or growing round it - and kept inside the recording (W x H),
// made smaller to fit if need be. Returns { rect, zoom, panX, panY } or
// null.
export function cropTo(layer, srcW, srcH, R, want, { W = 1920, H = 1080 } = {}) {
  if (!(srcW > 0 && srcH > 0 && R.w > 0 && R.h > 0)) return null;
  const now = cropAmounts(layer, srcW, srcH, R);
  const c = { ...now, ...want };
  for (const key of ["left", "right", "top", "bottom"]) c[key] = clamp(Number(c[key]) || 0, 0, 0.95);
  if (c.left + c.right > 0.95 || c.top + c.bottom > 0.95) return null;
  const S = coverSource(srcW, srcH, R.w, R.h, layer);
  let k = S.sw / R.w;
  const T = { sx: c.left * srcW, sy: c.top * srcH, sw: srcW * (1 - c.left - c.right), sh: srcH * (1 - c.top - c.bottom) };
  let w = T.sw / k;
  let h = T.sh / k;
  // Too big for the picture: smaller, round its middle.
  const fit = Math.min(1, W / w, H / h);
  const mx = R.x + (T.sx + T.sw / 2 - S.sx) / k;
  const my = R.y + (T.sy + T.sh / 2 - S.sy) / k;
  w *= fit;
  h *= fit;
  k /= fit;
  const rect = { x: clamp(mx - w / 2, 0, W - w), y: clamp(my - h / 2, 0, H - h), w, h };
  const v = viewOf(T, srcW, srcH);
  return v ? { rect, ...v } : null;
}

// The whole picture again: nothing cut, the box the source's shape, as
// tall as it is (narrower or wider round its middle), inside the recording.
export function wholePicture(srcW, srcH, R, { W = 1920, H = 1080 } = {}) {
  if (!(srcW > 0 && srcH > 0 && R.w > 0 && R.h > 0)) return null;
  let h = R.h;
  let w = (h * srcW) / srcH;
  const fit = Math.min(1, W / w, H / h);
  w *= fit;
  h *= fit;
  const rect = { x: clamp(R.x + R.w / 2 - w / 2, 0, W - w), y: clamp(R.y + R.h / 2 - h / 2, 0, H - h), w, h };
  return { rect, zoom: 1, panX: 0, panY: 0 };
}
