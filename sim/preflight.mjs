// A shot's first moments, got ready before it's hit (the owner: "use the
// nondraw period we have between shots to preload the first bit of the
// upcoming flight path"). Two things made a drive's first frames jerky:
//
// - At the strike, the trees along the whole flight were switched from
//   their far version to their near one (sim/treelod.mjs), and so the whole
//   shadow map was drawn again, on the very frame the ball set off. Now
//   which trees are near is decided at address, for where the ball is
//   likely to go - a fan of lines along the aim, as far as the club goes
//   and a little further (shotFan) - while the ball sits there waiting, and
//   at the strike the plan is that fan and the flight together
//   (withFlight). A shot inside the fan changes no tree, so nothing is
//   switched and the shadow map isn't drawn again as the ball sets off.
// - Working the shot out (its flight, its tracer, the hole's map) takes a
//   moment, and the first frame after it was late: the ball was shown that
//   much of the way along, metres from the tee. Now its clock starts on
//   the first frame drawn, and a late frame in its first moments slows it
//   for that frame rather than jumping it along (flightStep).
//
// Pure: plain numbers. Points are the physics frame's [x, z] (x down the
// hole, z to the right; the aim an angle from x towards z), and the plans
// come out as world [x, z] points (world x = z, world z = -x), as the
// flight's own plan does (course.js treePath).

// The fan: lines `spread` degrees either side of the aim (`lines` of them
// in all), each as long as the club carries times `reach` plus `extra`
// metres (the ball runs on); kept while the aim stays within `recentre`
// degrees of its middle. On the phone (`phoneLines`) none: there the fan
// kept every tree a shot might pass near - on the range all of its woods,
// both sides, to the end bank - its whole time at address, for trees a
// few of its pixels tall; the flight alone, from the strike, costs no
// stutter there (measured on the phone's picture) and the range at
// address draws half the triangles.
export const FAN = { spread: 14, lines: 5, reach: 1.25, extra: 25, recentre: 7, phoneLines: 0 };

// A shot's first moments: none of its clock passes on the first frame
// (the ball's first picture is on its spot), then never more than `step`
// seconds a frame until it's `seconds` along.
export const START = { seconds: 0.5, step: 1 / 30 };

const RAD = Math.PI / 180;
const toWorld = (x, z) => [z, -x];

// The fan's lines for a ball at `from` aimed along `aim` (radians), to
// `length` metres: world paths, each [start, end].
export function shotFan(from, aim, length, { spread = FAN.spread, lines = FAN.lines } = {}) {
  const [x, z] = from;
  const out = [];
  for (let i = 0; i < lines; i++) {
    const a = aim + (lines > 1 ? (i / (lines - 1) - 0.5) * 2 * spread * RAD : 0);
    out.push([toWorld(x, z), toWorld(x + Math.cos(a) * length, z + Math.sin(a) * length)]);
  }
  return out;
}

// How far the fan reaches for a club that carries `carry` metres.
export const fanLength = (carry) => carry * FAN.reach + FAN.extra;

// The angle between two aims, in degrees (0 - 180).
function apart(a, b) {
  const d = Math.abs(((a - b) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return Math.min(d, 2 * Math.PI - d) / RAD;
}

// The plan at address: `kept` (the last one, or null) while the ball is on
// the same spot (any string or number saying where it lies), the aim
// within FAN.recentre of its middle and the club no longer than it was got
// ready for - the same object, so nothing is decided again; otherwise a new
// one. At the same spot it never gets shorter (a shorter club after a
// longer one keeps the trees as they are). Returns { spot, aim, length,
// paths }.
export function readyFan(kept, { spot, from, aim, length, phone = false }) {
  const same = kept && kept.spot === spot;
  if (same && length <= kept.length && apart(aim, kept.aim) <= FAN.recentre) return kept;
  const middle = same && apart(aim, kept.aim) <= FAN.recentre ? kept.aim : aim;
  const len = same ? Math.max(length, kept.length) : length;
  return { spot, aim: middle, length: len, paths: shotFan(from, middle, len, phone ? { lines: FAN.phoneLines } : {}) };
}

// The plan while a shot flies: the fan it was got ready with, and the
// flight itself (a world path). Without a fan, the flight alone.
export function withFlight(fan, flight) {
  return fan?.length ? [...fan, flight] : flight;
}

// How far a flight's clock goes on in a frame of `dt` seconds, `elapsed`
// seconds into it (first: the first frame since it was struck).
export function flightStep(elapsed, dt, { first = false } = {}) {
  if (first) return 0;
  return elapsed < START.seconds ? Math.min(dt, START.step) : dt;
}
