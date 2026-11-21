// The picture drawn wider than the screen while a recording wants the game
// centred on the target line (sim/viewoffset.mjs wideFrame): set by app.js
// resize, used as each frame's scene is drawn (drawWide) and by what reads
// the canvas back - the recording (compositor.js), a course's still
// (course.js pictureDrawn) - to take the part they want.

let frame = null;

// The wide frame now (sim/viewoffset.mjs wideFrame), or null: drawn as the
// screen is.
export function setWideFrame(next) {
  frame = next ?? null;
}
export function wideFrame() {
  return frame;
}

// Draws with the camera's window widened for the drawing alone - the
// markers, labels and clicks worked out from the camera meanwhile see the
// screen's own window, as ever - then put back.
export function drawWide(camera, draw) {
  if (!frame || !camera?.setViewOffset) return draw();
  const r = frame.render;
  camera.setViewOffset(r.fullWidth, r.fullHeight, r.x, r.y, r.width, r.height);
  try {
    return draw();
  } finally {
    const n = frame.normal;
    camera.setViewOffset(n.fullWidth, n.fullHeight, n.x, n.y, n.width, n.height);
  }
}

// The part of the canvas the screen shows, in its own pixels: { sx, sw }
// (the whole of it when the picture isn't drawn wide).
export function screenPart(canvas) {
  const W = canvas?.width ?? 0;
  if (!frame) return { sx: 0, sw: W };
  return { sx: frame.screen.x * W, sw: frame.screen.w * W };
}
