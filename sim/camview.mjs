// A camera's picture turned and cropped: a webcam hung on its side, or one
// that sees more than the swing (the ceiling, the net's frame), shown
// upright and cut down to the part that matters - the same in the camera
// boxes, the replays, the swing replay on the projector and the recording.
//
//   rotate  0, 90, 180 or 270: degrees clockwise the picture is turned
//   crop    { x, y, w, h }: the part of the turned picture kept, as shares
//           of it (0 - 1 from its top left); the whole of it by default
//
// Pure: the page code (camview.js) places a <video> or draws on a canvas by
// placement().

export const ROTATIONS = [0, 90, 180, 270];
// No crop smaller than this share of the picture either way.
export const MIN_CROP = 0.1;
export const FULL = Object.freeze({ x: 0, y: 0, w: 1, h: 1 });

import { clamp } from "./mathutil.mjs";
const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

export function cleanCrop(c) {
  if (!c || typeof c !== "object") return { ...FULL };
  const w = clamp(num(c.w, 1), MIN_CROP, 1);
  const h = clamp(num(c.h, 1), MIN_CROP, 1);
  const x = clamp(num(c.x, 0), 0, 1 - w);
  const y = clamp(num(c.y, 0), 0, 1 - h);
  const r = (v) => Math.round(v * 10000) / 10000;
  return { x: r(x), y: r(y), w: r(w), h: r(h) };
}

export function cleanView(v) {
  const src = v && typeof v === "object" ? v : {};
  const rotate = ROTATIONS.includes(Number(src.rotate)) ? Number(src.rotate) : 0;
  return { rotate, crop: cleanCrop(src.crop) };
}

export const isPlain = (v) => {
  const c = cleanView(v);
  return c.rotate === 0 && c.crop.x === 0 && c.crop.y === 0 && c.crop.w === 1 && c.crop.h === 1;
};

// The next way round (a quarter turn clockwise). The crop was of the old
// way round: it's turned with the picture, so the same part stays kept.
export function turned(v) {
  const c = cleanView(v);
  const k = c.crop;
  return { rotate: (c.rotate + 90) % 360, crop: cleanCrop({ x: 1 - k.y - k.h, y: k.x, w: k.h, h: k.w }) };
}

// The picture's size once turned (vw x vh as the camera sends it).
export function turnedSize(vw, vh, rotate) {
  return rotate % 180 ? { w: vh, h: vw } : { w: vw, h: vh };
}

// The size of what's shown: the crop of the turned picture, in the
// camera's pixels.
export function viewSize(vw, vh, view) {
  const v = cleanView(view);
  const t = turnedSize(vw, vh, v.rotate);
  return { w: v.crop.w * t.w, h: v.crop.h * t.h };
}

// Where the whole of what's shown fits in a box bw x bh, letterboxed, as
// object-fit: contain does: { x, y, w, h } in the box.
export function containRect(sw, sh, bw, bh) {
  if (!(sw > 0 && sh > 0 && bw > 0 && bh > 0)) return { x: 0, y: 0, w: Math.max(0, bw), h: Math.max(0, bh) };
  const s = Math.min(bw / sw, bh / sh);
  const w = sw * s;
  const h = sh * s;
  return { x: (bw - w) / 2, y: (bh - h) / 2, w, h };
}

// How to draw the camera's picture (vw x vh) so that part `sub` of what's
// shown - { sx, sy, sw, sh } in what's-shown pixels (viewSize), the whole
// of it by default - fills `dest` { x, y, w, h }: the picture, as the camera
// sends it, drawn w x h with its middle at (cx, cy) and turned `rotate`
// degrees clockwise about it. Anything outside dest is to be clipped.
export function placement(vw, vh, view, dest, sub = null) {
  const v = cleanView(view);
  const t = turnedSize(vw, vh, v.rotate);
  const shown = { w: v.crop.w * t.w, h: v.crop.h * t.h };
  const s0 = sub ?? { sx: 0, sy: 0, sw: shown.w, sh: shown.h };
  if (!(s0.sw > 0 && s0.sh > 0 && dest.w > 0 && dest.h > 0)) return { cx: dest.x + dest.w / 2, cy: dest.y + dest.h / 2, w: 0, h: 0, rotate: v.rotate };
  const s = Math.min(dest.w / s0.sw, dest.h / s0.sh);
  // The middle of what's to fill dest, in the turned picture's pixels.
  const mx = v.crop.x * t.w + s0.sx + s0.sw / 2;
  const my = v.crop.y * t.h + s0.sy + s0.sh / 2;
  return {
    cx: dest.x + dest.w / 2 - (mx - t.w / 2) * s,
    cy: dest.y + dest.h / 2 - (my - t.h / 2) * s,
    w: vw * s,
    h: vh * s,
    rotate: v.rotate,
  };
}

// Where a point of the camera's picture (px, py, its pixels as sent) ends
// up for a placement: for the tests.
export function placePoint(p, vw, vh, px, py) {
  const a = (p.rotate * Math.PI) / 180;
  const s = p.w / vw;
  const x = (px - vw / 2) * s;
  const y = (py - vh / 2) * s;
  return [p.cx + x * Math.cos(a) - y * Math.sin(a), p.cy + x * Math.sin(a) + y * Math.cos(a)];
}

// "Turned 90°, cropped" - for the settings row.
export function viewWords(view) {
  const v = cleanView(view);
  const parts = [];
  if (v.rotate) parts.push(`turned ${v.rotate}°`);
  if (v.crop.w < 1 || v.crop.h < 1) parts.push(`cropped to ${Math.round(v.crop.w * 100)}% x ${Math.round(v.crop.h * 100)}%`);
  return parts.join(", ") || "as it comes";
}

// ---- Drawing the crop (the Cameras panel's Crop editor) -------------------------------

// The crop between two points (shares of the turned picture), at least
// MIN_CROP each way.
export function cropFromPoints(ax, ay, bx, by) {
  const x0 = clamp(Math.min(ax, bx), 0, 1);
  const y0 = clamp(Math.min(ay, by), 0, 1);
  const x1 = clamp(Math.max(ax, bx), 0, 1);
  const y1 = clamp(Math.max(ay, by), 0, 1);
  return cleanCrop({ x: Math.min(x0, 1 - MIN_CROP), y: Math.min(y0, 1 - MIN_CROP), w: Math.max(MIN_CROP, x1 - x0), h: Math.max(MIN_CROP, y1 - y0) });
}

// Moved by (dx, dy), kept inside the picture at the same size.
export function moveCrop(c, dx, dy) {
  const k = cleanCrop(c);
  return cleanCrop({ ...k, x: k.x + dx, y: k.y + dy });
}

// The corner that stays put while `corner` ("tl", "tr", "bl", "br") is
// dragged.
export function fixedCorner(c, corner) {
  const k = cleanCrop(c);
  return [corner.includes("l") ? k.x + k.w : k.x, corner.startsWith("t") ? k.y + k.h : k.y];
}
