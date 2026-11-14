// The picture's centre moved left or right of the screen's: for a golfer
// who hits down one side of the net, the target line (the middle of the 3D
// view - where the ball starts, and what the camera looks along) drawn
// that far over. A share of the picture's width, -0.45 (well over to the
// left) to 0.45 (well over to the right); 0 in the middle. Pure.

export const OFFSET_LIMIT = 0.45;

export function cleanOffset(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.round(Math.max(-OFFSET_LIMIT, Math.min(OFFSET_LIMIT, n)) * 100) / 100;
}

// The camera's view window (three.js setViewOffset) for a picture w x h
// pixels with its centre moved `share` of its width: the same size, slid
// the other way - or null for none.
export function viewWindow(w, h, share) {
  const s = cleanOffset(share);
  if (!s || !(w > 0) || !(h > 0)) return null;
  return { fullWidth: w, fullHeight: h, x: -s * w, y: 0, width: w, height: h };
}

// "12% right", "centred".
export function offsetWords(share) {
  const s = cleanOffset(share);
  if (!s) return "centred";
  return `${Math.round(Math.abs(s) * 100)}% ${s > 0 ? "right" : "left"}`;
}

// While a recording wants the game's picture centred on the target line
// (sim/videolayout.mjs, the game layer's `centred`; the owner: "Can we
// enable the screen to be centred on game screen even if off center in
// play"): the picture drawn wider than the screen by the centre's share,
// on the side away from it, so one drawing holds both the screen's view
// and the centred one - the screen showing its part as it always did (the
// canvas slid left by `left` pixels when the extra is on that side), the
// recording taking the centred part. Instead of drawing the scene twice,
// a share more pixels: 12% for a centre moved 12%.
//
// For a picture w x h (CSS pixels) with its centre moved `share`: { width,
// extra, left, render (three.js setViewOffset for the drawing: the
// centred view's frustum, the window wider), normal (the screen's own
// window, as viewWindow), screen and centred (each { x, w }: where in the
// drawn picture, as shares of its width) } - or null with no share.
export function wideFrame(w, h, share) {
  const s = cleanOffset(share);
  if (!s || !(w > 0) || !(h > 0)) return null;
  const extra = Math.round(Math.abs(s) * w);
  const width = w + extra;
  return {
    width,
    extra,
    left: s > 0 ? 0 : -extra,
    render: { fullWidth: w, fullHeight: h, x: s > 0 ? -extra : 0, y: 0, width, height: h },
    normal: { fullWidth: w, fullHeight: h, x: s > 0 ? -extra : extra, y: 0, width: w, height: h },
    screen: { x: s > 0 ? 0 : extra / width, w: w / width },
    centred: { x: s > 0 ? extra / width : 0, w: w / width },
  };
}
