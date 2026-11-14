// A camera's picture turned and cropped (sim/camview.mjs) wherever it's
// shown: a <video> placed in its box, or a frame drawn on a canvas.
//
// A video is laid out absolutely in its box (which clips it), sized and
// turned so the kept part of its picture fits the box as object-fit:
// contain would fit the whole of it; laid out again when the box changes
// size, the picture's size is known or changes, or the view is changed.

import { cleanView, isPlain, placement, viewSize, containRect } from "./sim/camview.mjs";

const placed = new WeakMap();

// Shows `video` in its parent (the box) turned and cropped by `view`
// ({ rotate, crop }); a plain view puts the video back as it was.
export function showView(video, view) {
  if (!video) return;
  const box = video.parentElement;
  let p = placed.get(video);
  if (!p) {
    p = { view: null, observer: null };
    placed.set(video, p);
    video.addEventListener("loadedmetadata", () => layout(video));
    video.addEventListener("resize", () => layout(video));
    if (typeof ResizeObserver !== "undefined" && box) {
      p.observer = new ResizeObserver(() => layout(video));
      p.observer.observe(box);
    }
  }
  p.view = cleanView(view);
  if (box && getComputedStyle(box).position === "static") box.style.position = "relative";
  if (box) box.style.overflow = "hidden";
  layout(video);
}

function layout(video) {
  const p = placed.get(video);
  const box = video.parentElement;
  if (!p || !box) return;
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (isPlain(p.view) || !(vw > 0 && vh > 0)) {
    // As it was: the stylesheet's object-fit: contain.
    for (const k of ["position", "left", "top", "width", "height", "transform", "transformOrigin", "maxWidth", "maxHeight", "objectFit"]) video.style[k] = "";
    return;
  }
  const bw = box.clientWidth;
  const bh = box.clientHeight;
  const shown = viewSize(vw, vh, p.view);
  const dest = containRect(shown.w, shown.h, bw, bh);
  const at = placement(vw, vh, p.view, dest);
  Object.assign(video.style, {
    position: "absolute",
    left: "0px",
    top: "0px",
    width: `${at.w}px`,
    height: `${at.h}px`,
    maxWidth: "none",
    maxHeight: "none",
    objectFit: "fill",
    transformOrigin: "50% 50%",
    transform: `translate(${at.cx - at.w / 2}px, ${at.cy - at.h / 2}px) rotate(${at.rotate}deg)`,
  });
}

// Draws a camera's frame on a canvas: part `sub` of what's shown (its
// pixels, viewSize; the whole by default) filling `dest` { x, y, w, h },
// clipped to dest. The caller may clip further (rounded corners) first.
export function drawView(g, src, vw, vh, view, dest, sub = null) {
  if (!(vw > 0 && vh > 0)) return;
  const at = placement(vw, vh, view, dest, sub);
  g.save();
  g.beginPath();
  g.rect(dest.x, dest.y, dest.w, dest.h);
  g.clip();
  g.translate(at.cx, at.cy);
  g.rotate((at.rotate * Math.PI) / 180);
  g.drawImage(src, -at.w / 2, -at.h / 2, at.w, at.h);
  g.restore();
}

export { viewSize };
