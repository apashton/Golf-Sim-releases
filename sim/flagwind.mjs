// How a flag flies in the wind, for the picture (scenery.js): it hangs limp
// in a calm, lifts and flaps in a breeze (8 - 12 mph), and streams out taut
// in a strong wind, surging in its gusts - given the wind this moment
// (mph, gusts and all: look/weatherlook.js gusting). Pure.
//
// { lift, amp, speed }:
//   lift   radians the cloth is raised from hanging straight down the pole
//          (pi/2: straight out)
//   amp    how far its flapping throws the free end (metres, on a 0.55 m cloth)
//   speed  how fast the flapping runs along it (radians a second)
//
// With no wind at all - the practice greens and the Challenges, where
// shots fly in still air - a flag keeps the gentle ripple it always had:
// straight out, rippling lightly.

export const STILL_AIR = { lift: Math.PI / 2, amp: 0.035, speed: 4 };
// How far a limp flag is held off hanging straight down (radians).
const LIMP = 0.45;

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function flagPose(mph) {
  if (mph == null || !Number.isFinite(mph)) return STILL_AIR;
  const m = Math.max(0, mph);
  // Drooping in a calm - hanging well down, but held off the pole enough to
  // read as a flag from the tee rather than a sliver - half out in a
  // breeze, straight out from about 20 mph.
  const lift = LIMP + (Math.PI / 2 - LIMP) * smooth(1, 20, m) ** 0.8;
  // The flapping: barely a stir in a calm, fullest in a breeze, and tighter
  // (small, fast) once it's streaming taut.
  const amp = 0.01 + 0.085 * smooth(1, 9, m) * (1 - 0.55 * smooth(14, 30, m));
  const speed = Math.min(16, 2.5 + 0.45 * m);
  return { lift, amp, speed };
}

// Where a point of the cloth is drawn: its place on the flat cloth (x out
// from the pole, 0 - 0.55 m; y up it, about -0.19 - 0.19 m), the pose, and
// the time (s) plus the flag's own phase. [x, y, z] in the flag's frame.
export function clothPoint(x, y, pose, t) {
  const along = x / 0.55;
  const wave = Math.sin(t * pose.speed - x * 9 + y * 2) * pose.amp * along;
  return [x * Math.sin(pose.lift), y - x * Math.cos(pose.lift), wave];
}
