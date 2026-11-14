// The picture's size: the safety valve's last two steps, on any setting
// (look/safety.js) draw the 3D picture at 85%, then 70%, of its pixels and
// let the browser stretch it to fill the window - the biggest saving there
// is, and the least visible. Only the 3D canvas changes: the words, the
// numbers and the hole map are the page's own, over the top, and stay
// sharp. The shares and the sums are in sim/safetyvalve.mjs.
//
// A step only says what size it wants. The renderer takes it up at the
// start of the next frame, before it draws (applyPictureScale, from the
// main loop): resizing a canvas clears it, and resizing one just drawn
// would show - and record - a blank frame. The valve only steps between
// shots, so the change never comes mid-swing or mid-flight.
//
// Every size goes through here: the screen's own pixel ratio (setBase, at
// the start and on every resize, as a window moves to a screen of another
// scale) times the share. A resize keeps the share (three.js's setSize
// uses the pixel ratio already set), so it can't undo a step.
//
// On Ultra the picture is also drawn bigger than the screen - up to half
// as big again, never past 4K's pixels (sim/ultra.mjs supersample) - and
// shrunk to fit: smooth edges on leaves, poles and far fairways. It's the
// first thing the valve sheds. While recording, only as much bigger as the
// recording can use (recordingSupersample). While the camera flies, not
// recording, it's eased (sim/ultra.mjs FLY): the screen effects draw into
// a second, smaller set of buffers kept beside the full ones (look/
// effects.js) - nothing resized, so no hitch either way.

import { registerStep } from "./safety.js";
import { ULTRA } from "./quality.js";
import { PICTURE_STEPS, pictureScale } from "../sim/safetyvalve.mjs";
import { supersample, recordingSupersample, pictureRatio, FLY } from "../sim/ultra.mjs";

let renderer = null;
let base = 1;
// The share the steps want, and the share the renderer is drawing at.
let wanted = 1;
let drawn = 1;
// Ultra's supersampling (sim/ultra.mjs supersample): how much bigger for
// this window, whether the valve has shed it, and what's drawn now.
let size = null;
let superShed = false;
let superDrawn = 1;
// Recording (videorec.js): the recording's size ({ width, height }
// pixels), or null. While it's made the picture's drawn only as much
// bigger as the recording can use - with the encoder on, supersampling is
// the dearest step (it once stalled the card), and the recording guard
// (fps.js) sheds it first if the picture can't keep up.
let recording = null;
// (None in the phone app: its picture's a budget of pixels, sim/
// phonepicture.mjs.)
let superAllowed = true;
const superWanted = () => (ULTRA && superAllowed && !superShed && size ? (recording ? recordingSupersample({ ...size, ratio: base, rec: recording }) : supersample({ ...size, ratio: base })) : 1);
const ratioNow = () => pictureRatio(base, drawn, superDrawn);

// The renderer, its full-size pixel ratio and the window's size (CSS
// pixels: { width, height }, for the supersampling); supersampling false:
// never drawn bigger than that.
export function usePictureRenderer(r, ratio, win = null, { supersampling = true } = {}) {
  renderer = r;
  superAllowed = supersampling;
  base = ratio;
  size = win;
  drawn = wanted;
  superDrawn = superWanted();
  r.setPixelRatio(ratioNow());
}

// The screen's full-size pixel ratio and the window's size, again (a
// resize): the share kept, the supersampling worked out for the new size.
export function setPictureBase(ratio, win = size) {
  if (!renderer) return;
  const sized = win && (!size || win.width !== size.width || win.height !== size.height);
  if (ratio === base && !sized) return;
  base = ratio;
  size = win;
  superDrawn = superWanted();
  renderer.setPixelRatio(ratioNow());
}

// Before a frame is drawn: the size the steps want, if it's changed.
// Returns true when the picture was resized (for the long frames).
export function applyPictureScale() {
  const sup = superWanted();
  if (!renderer || (wanted === drawn && sup === superDrawn)) return false;
  drawn = wanted;
  superDrawn = sup;
  renderer.setPixelRatio(ratioNow());
  return true;
}

// The share the picture is drawn at (1 full size), and the full-size ratio.
export function pictureShare() {
  return drawn;
}
export function pictureBase() {
  return base;
}
// How much bigger it's drawn (1: no supersampling).
export function pictureSuper() {
  return superDrawn;
}

// The camera flying (sim/ultra.mjs flyEase, from app.js each frame, before
// the drawing): the picture eased, where there's supersampling to ease.
let flying = false;
export function setPictureFlying(on) {
  flying = !!on;
}
// The share of the picture's pixels, each way, drawn while the camera
// flies: below 1 only on Ultra, supersampling, not recording - the size of
// the smaller buffers (look/effects.js).
export function flyShare() {
  return ULTRA && !recording && superDrawn > FLY.factor ? FLY.factor / superDrawn : 1;
}
// Whether this frame is drawn eased (into the smaller buffers).
export function pictureEased() {
  return flying && flyShare() < 1;
}
// This frame's picture against its full size, each way (1 not eased): for
// what's drawn so many pixels across, kept the same size on screen.
export function easedShare() {
  return pictureEased() ? flyShare() : 1;
}

// While a session is recording (rec: the recording's { width, height }
// pixels; null when it stops), supersampled only as much as it can use.
// The graphics setting is left as it is. Takes effect on the next frame
// (applyPictureScale).
export function setPictureRecording(rec) {
  recording = rec?.width > 0 && rec?.height > 0 ? { width: rec.width, height: rec.height } : null;
}

// Ultra's supersampling: the first thing the valve sheds, before the
// effects (it's the dearest of all) - and only between shots, as every
// step, taken up before the next frame is drawn.
registerStep(0.5, "supersampling", (on) => (superShed = on), { of: "ultra", first: true });

// The valve's picture steps, after every setting's own (sim/graphics.mjs
// ladder): shed, the picture at that step's share; back, at the one before
// it.
PICTURE_STEPS.forEach((step, i) => {
  registerStep(
    1 + i,
    step.name,
    (on) => {
      wanted = pictureScale(on ? i + 1 : i, 0);
    },
    { of: "picture" },
  );
});
