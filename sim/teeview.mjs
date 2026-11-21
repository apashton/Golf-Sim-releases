// The golfer's camera where the ground rises ahead (a course from a map):
// looking along the slope at a bank a few metres high, the picture was a
// dark bank with the ball below it, under the numbers (Harding 1). This
// finds the view that shows the most of the ground ahead with the ball
// still in the picture, clear of the numbers: the camera raised by a few
// metres at most, and it looking lower where it must. Pure.
//
// ground: [[d, h], ...] the ground's height (metres, from the ball's foot)
// d metres ahead along the aim, nearest first; back, up: where the camera
// sits behind and above the ball; pitch: where it looks now (radians, up
// is +); fov: the picture's height (degrees); ballMax: how far below the
// middle of the picture the ball may be (degrees; BALL_LOW of it unless
// given); maxLift: the most the camera may rise (metres).
//
// Returns { lift, pitch, seen, shown }: how much higher the camera goes,
// the pitch it looks at, how far ahead the ground can be seen, and how many
// of the ground's points are in the picture (not hidden behind a rise).

const RAD = Math.PI / 180;

// How far below the picture's middle the ball may be, as a share of the
// picture's half height (the numbers along the bottom below it): 21° of a
// 60° picture, as it was worked out - whatever the lens (sim/eye.mjs).
export const BALL_LOW = Math.tan(21 * RAD) / Math.tan(30 * RAD);

export function teeView({ ground, back = 4.5, up = 2.2, pitch = 0, fov = 60, ballMax = null, maxLift = 3, step = 0.25 } = {}) {
  const half = (fov / 2) * RAD;
  const ballLimit = ballMax != null ? ballMax * RAD : Math.atan(BALL_LOW * Math.tan(half));
  // Margin so the ground isn't at the very top edge.
  const top = half - 3 * RAD;
  let best = null;
  for (let lift = 0; lift <= maxLift + 1e-9; lift += step) {
    const camY = up + lift;
    // The ball below the level of the camera, and how low the camera may
    // look with it still clear of the numbers.
    const ballBelow = Math.atan2(camY, back);
    const p = Math.min(pitch, ballLimit - ballBelow);
    // The farthest ground seen: in the picture (below its top), and not
    // hidden behind a rise nearer the camera.
    let highest = -Infinity;
    let seen = 0;
    let shown = 0;
    for (const [d, h] of ground) {
      if (d <= 0) continue;
      const a = Math.atan2(h - camY, d + back);
      if (a >= highest - 1e-9) {
        if (a - p <= top) {
          seen = d;
          shown++;
        }
        highest = Math.max(highest, a);
      }
    }
    // A higher camera only when it shows usefully more of the ground.
    if (!best || shown > best.shown + 1) best = { lift, pitch: p, seen, shown };
  }
  return best;
}
