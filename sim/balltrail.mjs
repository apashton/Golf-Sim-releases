// A fast ball's motion trail (look/balltrail.js draws it): a short, faint
// streak behind the ball, as a camera's shutter catches a ball in flight -
// only when it's going fast (a drive off the face, a long iron), longer the
// faster, gone as it slows to the top of its flight and on the ground.
// Pure.

export const TRAIL = {
  // Metres a second: none below `from`, all of it from `full`.
  from: 25,
  full: 55,
  // Its strength at the ball at most (0 - 1).
  most: 0.45,
  // How long it is: the distance the ball goes in this long (seconds, a
  // fast shutter), never longer than `longest` metres.
  exposure: 0.014,
  longest: 1.1,
  // Faster than any golf ball: a jump (the ball put somewhere new), not a
  // flight - no trail.
  jump: 110,
  // How quickly the speed it's drawn for follows the ball's (per second):
  // frames come unevenly, so it's smoothed.
  follow: 18,
};

const smooth = (t) => {
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
};

// The trail for a ball going `speed` m/s: { length (metres), opacity }, or
// null for none.
export function trailLook(speed) {
  if (!(speed > TRAIL.from) || speed > TRAIL.jump) return null;
  return { length: Math.min(TRAIL.longest, speed * TRAIL.exposure), opacity: TRAIL.most * smooth((speed - TRAIL.from) / (TRAIL.full - TRAIL.from)) };
}

// The speed to draw for: `shown` (the last one drawn) eased towards the
// ball's own, `moved` metres in `dt` seconds. A jump starts again at 0.
export function trailSpeed(shown, moved, dt) {
  if (!(dt > 0)) return shown;
  const v = moved / dt;
  if (v > TRAIL.jump) return 0;
  const k = 1 - Math.exp(-TRAIL.follow * dt);
  return shown + (v - shown) * k;
}
