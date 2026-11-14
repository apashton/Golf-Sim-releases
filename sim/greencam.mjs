// The close look at the green. The owner: "On any shots where the ball is
// rolling onto the green, the camera should really zoom in a lot closer so
// the user can see how it's performing on the green. It's quite difficult
// to see on a chip, and if you want to see how close you are."
//
// A shot's whole path is known when it's struck, so this works out, once,
// when the camera should close in - a beat before the ball first runs on
// the green - and where it should stand to watch it run to a stop by the
// pin: near the pin, low, a little to one side of the line it's played
// along (so the view still faces the way it was hit), near enough that
// where it stops and the pin fill the picture, with the ball running into
// it - and, for a ball still running up from further back (a chip-and-run
// from the front of the green), following it in from just behind, so it's
// always in front of the camera. Pure: the course, the ladders, the
// chipping green and the range share it, each in its own ground frame.

import { clamp } from "./mathutil.mjs";
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const len = (v) => Math.hypot(v[0], v[1]);

// How the camera stands for it, metres:
//   back        how far behind the middle of where it stops and the pin -
//               more for a stop further from the pin (perSpan), and for a
//               run on the green that ends near, enough to see it come
//               (touchBehind, up to touchMost back); never more than
//               maxBack: it's a close look, not the chase
//   side        how far to one side of the line, for each metre back
//   up          how high, for each metre back (within minUp - maxUp)
//   trail       how far behind a ball it follows in, for each metre back
//               (at least minBack)
//   lead        seconds before the ball meets the green that the camera
//               sets off, so it's there as the ball arrives
//   onGround    how low a point of the path is to be on the ground (m)
//   ahead       the least the camera looks ahead of itself, along the line
export const GREEN_VIEW = Object.freeze({ minBack: 4.5, maxBack: 12, perSpan: 1.25, touchBehind: 3, touchMost: 9, side: 0.22, upPerBack: 0.36, minUp: 1.3, maxUp: 4.5, trail: 0.6, lead: 0.6, onGround: 0.1, ahead: 2 });

// When the ball first runs on the green: { t, index, at: [x, z] }, the time
// (seconds into the path) the camera should set off, the point of the path
// where the ball first meets the green on the ground, and that point - or
// null if it never does.
//   path         [[x, h, z, t]]: h the height above the ground
//   flightPoints where its flight ends (its first touch of the ground)
//   onGreen(x, z) true on the green
export function greenEntry(path, { flightPoints = 0, onGreen = () => false, view = GREEN_VIEW } = {}) {
  if (!Array.isArray(path) || path.length < 2) return null;
  const from = Math.max(0, Math.min(path.length - 1, (flightPoints || 1) - 1));
  for (let i = from; i < path.length; i++) {
    const [x, h, z, t] = path[i];
    if (h <= view.onGround && onGreen(x, z)) {
      // Never before the ball's on its way down (its highest point): a
      // chase of the climb, then the green.
      let top = 0;
      for (let j = 1; j < from; j++) if (path[j][1] > path[top][1]) top = j;
      return { t: Math.max(path[top][3], t - view.lead), index: i, at: [x, z] };
    }
  }
  return null;
}

// Where the camera stands to watch the ball on the green, in the ground
// frame: { cam: [x, z], up, look: [x, z], dir: [x, z], back }.
//   from   where it was hit from
//   touch  where it first meets the green
//   rest   where it stops
//   pin    the hole
// It looks at the middle of where the ball stops and the pin; while the
// ball's running, a mode follows it in and looks between it and that
// (greenFollow).
export function greenView({ from, touch, rest, pin }, view = GREEN_VIEW) {
  // The way it's played: from where it was hit to where it stops (to the
  // pin, for one that stops where it was hit from).
  let d = sub(rest, from);
  if (len(d) < 0.5) d = sub(pin, from);
  if (len(d) < 1e-6) d = [1, 0];
  const n = len(d);
  d = [d[0] / n, d[1] / n];
  const look = [(rest[0] + pin[0]) / 2, (rest[1] + pin[1]) / 2];
  // Enough of the green for where it stops and the pin; the run on too,
  // when it came on near.
  const span = Math.max(len(sub(rest, pin)), 2);
  const toTouch = (look[0] - touch[0]) * d[0] + (look[1] - touch[1]) * d[1];
  const run = toTouch + view.touchBehind <= view.touchMost ? toTouch + view.touchBehind : 0;
  const back = clamp(Math.max(span * view.perSpan + 3, run), view.minBack, view.maxBack);
  const up = clamp(back * view.upPerBack, view.minUp, view.maxUp);
  // A little to the right of the line (a right-hander's side).
  const side = back * view.side;
  const cam = [look[0] - d[0] * back - d[1] * side, look[1] - d[1] * back + d[0] * side];
  return { cam, up, look, dir: d, back };
}

// Where the camera stands and looks while the ball runs, in the ground
// frame: { cam: [x, z], look: [x, z] }. It stands where greenView put it -
// or, while the ball is still short of that by less than its trail (or
// behind it: a chip running up from the front of the green), that trail
// behind the ball along the line, following it in. So the ball is always
// in front of the camera, never coming up from behind it. `up` stays the
// pose's.
export function greenFollow(ball, pose, view = GREEN_VIEW) {
  const { cam, dir, back } = pose;
  const trail = clamp(back * view.trail, view.minBack, Math.max(view.minBack, back));
  const along = (ball[0] - cam[0]) * dir[0] + (ball[1] - cam[1]) * dir[1];
  const slide = Math.max(0, trail - along);
  const at = [cam[0] - dir[0] * slide, cam[1] - dir[1] * slide];
  return { cam: at, look: greenLook(ball, { ...pose, cam: at }, 0.45, view) };
}

// Where to look while the ball runs: between the ball and the middle of
// where it stops and the pin, so both stay in the picture - but never back
// at a ball that hasn't reached the camera yet: always at least `ahead`
// metres in front of it along the line.
export function greenLook(ball, pose, k = 0.45, view = GREEN_VIEW) {
  const { look, cam, dir } = pose;
  let p = [ball[0] + (look[0] - ball[0]) * k, ball[1] + (look[1] - ball[1]) * k];
  if (cam && dir) {
    const along = (p[0] - cam[0]) * dir[0] + (p[1] - cam[1]) * dir[1];
    if (along < view.ahead) {
      // Slid along the line to `ahead` in front of the camera.
      const shift = view.ahead - along;
      p = [p[0] + dir[0] * shift, p[1] + dir[1] * shift];
    }
  }
  return p;
}
