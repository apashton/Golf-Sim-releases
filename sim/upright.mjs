// The phone held upright (docs/ANDROID-PLAN.md, Upright play - the owner,
// 29 October 2026: "I don't believe we can play in vertical mode on phone?
// Might be something we sort though"; begun 4 November 2026: "Ok safe to
// work on the portrait mobile mode please"). The app turns with the phone
// (or is kept one way: TURN_WAYS); held upright, the picture is the top of
// the screen and the swing pad and the buttons are under it, under the
// thumb (upright.js, upright.css). Pure.

// A picture taller than it's wide sees less across at the same lens, so
// the lens is widened (the camera pulled back) till it shows as much across
// as a picture this wide for its height would - but never past MAX_LENS,
// where the edges would stretch.
export const TALL_FROM = 1.1;
export const MAX_LENS = 85;

const DEG = Math.PI / 180;

// The lens (vertical, degrees) for a picture `aspect` wide for its height,
// from the lens it has on a wide one: the same on a wide picture.
export function tallLens(lens, aspect) {
  if (!(lens > 0) || !(aspect > 0) || aspect >= TALL_FROM) return lens;
  const wide = (2 * Math.atan((Math.tan((lens * DEG) / 2) * TALL_FROM) / aspect)) / DEG;
  return Math.min(Math.max(lens, MAX_LENS), wide);
}

// A camera fitted to its picture: its aspect, and the lens it has (kept
// the first time, in its userData) widened for a tall picture. Returns the
// lens it's drawn with. (A lens set while it's drawn - the cart ride's - is
// the mode's own to put back: course/buggy.js.)
export function fitLens(camera, aspect) {
  if (!camera) return null;
  camera.userData ??= {};
  camera.userData.lens ??= camera.fov;
  camera.aspect = aspect;
  camera.fov = tallLens(camera.userData.lens, aspect);
  camera.updateProjectionMatrix?.();
  return camera.fov;
}

// Whether a screen this size is held upright.
export const isUpright = (w, h) => w > 0 && h > w;

// How the app turns with the phone (Menu -> Screens, in the app only): as
// it's held, or kept sideways or upright whichever way it's held - so a
// tilt while swinging never turns it.
export const TURN_WAYS = ["both", "sideways", "upright"];
export const TURN_NAMES = {
  both: "As the phone's held - sideways or upright",
  sideways: "Sideways only",
  upright: "Upright only",
};
export const cleanTurn = (v) => (TURN_WAYS.includes(v) ? v : "both");
