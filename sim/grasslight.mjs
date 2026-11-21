// How grass takes the sun, by where you stand (the owner, 20 November 2026:
// "a solid round of graphic improvements ... use any new ideas, tricks and
// fundamentals considering this is a golf game"). Grass isn't paint: its
// blades shine. Looked across towards the sun it's paler and brighter - the
// sun glancing off thousands of blades, most the lower the sun and the
// further down the hole - and each blade shows its shaded side, so its own
// colour is a little thinner; with the sun behind you it's at its fullest
// and greenest, every blade's lit side towards you and its shadow hidden
// behind it. Flat paint was the same from everywhere, which is what read as
// a carpet.
//
// Every kind of grass takes it alike - the mown ground, the rough, the
// tufts and long grass standing on them, the grass round the ball
// (GRASS_KINDS: look/glsl/hooks.js) - so a tuft is still the colour of the
// ground it stands in from wherever it's seen. Only the sun's own light is
// changed (look/glsl/grasslight.js, after the lights are summed), so shade
// - a tree's, a cloud's - has none of it. Looking straight down (a flyover
// from high up, the map views) there's none either: the lean of the blades
// tells only when they're looked across.
//
// The same sums here, in plain JS, for the tests. Pure.

// sheen: the most the sun's light on the grass is raised by its shine (as a
//   share of its own brightness: looked along the ground, straight down the
//   sun's glance); power: how tightly the shine keeps to that line (the
//   higher, the narrower);
// tint: the shine's colour against the grass's own brightness - the sun's
//   light, warm and pale, not the grass's green;
// body: how much fuller the grass's own colour is with the sun square behind
//   you along the ground, and as much thinner looking square into it.
// (Measured on Golf Sim Links' 1st on a summer afternoon, the sun 38 degrees
// up and ahead to one side: the grass 1 - 2.5% lighter and a little paler
// from the tee - it tells with a low sun, looked into or away from.)
export const GRASS_LIGHT = { sheen: 0.45, power: 4, tint: [1.0, 0.97, 0.84], body: 0.12 };

// The scenery kinds (look/glsl/hooks.js withSceneryHooks) that are grass.
export const GRASS_KINDS = ["ground", "tuft", "tuftnear", "tuftfar", "longgrass", "nest"];

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = (a) => {
  const l = Math.hypot(...a) || 1;
  return a.map((v) => v / l);
};

// What the sun's light on a patch of grass is multiplied by, and what's
// added of its brightness as shine: { body, sheen }.
//   toEye: from the grass to the eye; toSun: from the grass to the sun;
//   up: the ground's up (all unit vectors, any one frame).
export function grassLight(toEye, toSun, up = [0, 1, 0], k = GRASS_LIGHT) {
  const v = unit(toEye);
  const l = unit(toSun);
  const u = unit(up);
  // How nearly along the ground it's looked: 0 straight down, 1 flat.
  const graze = 1 - Math.max(0, dot(u, v));
  // The sun's glance off level ground, against the way to the eye.
  const d = dot(l, u);
  const glance = [2 * d * u[0] - l[0], 2 * d * u[1] - l[1], 2 * d * u[2] - l[2]];
  const sheen = k.sheen * Math.max(0, dot(glance, v)) ** k.power * graze * graze;
  // The eye and the sun over the ground (their level parts alone): +1 the
  // sun square behind, -1 looking square into it, nought from overhead.
  const level = dot(v, l) - dot(v, u) * dot(l, u);
  return { body: 1 + k.body * level, sheen };
}
