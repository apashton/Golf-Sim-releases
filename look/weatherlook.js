// One set of weather values for the picture, updated once a frame beside
// animateScenery (app.js), for everything that shows the weather to read:
// the flags, the clouds, the water now; the sky, cloud shadows, grass and
// trees as they come. Each mode keeps its own sky and sun as it always has;
// they all read these.
//
//   time         seconds (the animation clock)
//   still        no wind at all: the practice greens and the Challenges,
//                where shots fly in still air (flags keep a gentle ripple,
//                nothing streams). A calm on the course or the range isn't
//                still: its flags hang limp.
//   mph          the wind's speed
//   yaw          the way it blows as a turn about the vertical, as a flag
//                is turned to stream (sim/weather.mjs flagYaw)
//   dir          [x, z]: the way it blows, in world metres (unit length)
//   gust         the gust clock (sim/weather.mjs gustEnvelope), 0.7 - 1.35;
//                1 in still air
//   gusting      mph × gust: the wind this moment
//   sun          how strong the sun is (1 a fair day)
//   cover        how much of the sky is cloud (0 - 1)
//   cloudShadow  how strong a cloud's shadow is (0 none)
//   wet, dry     how wet the ground is after rain, how dry on a firm day
//                (0 - 1; the wet factor is look/palette.js WET)
//   haze         how thick the haze is (1 a fair day's)
//   sky          the sky's kind (sim/weather.mjs SKY_KINDS)
//   shadow       how dark shadows are (1 a fair day's; never below 0.45)
//   rain         how hard it's raining now (0 - 1): eased in and out as a
//                shower comes and goes between shots
// The sky's values (sky, sun, cover, cloudShadow, wet, dry, haze, shadow,
// rain) come from the mode's sceneryWind().sky (the round's sky on the
// course, the range's own on the range) and are a fair day's in still air
// - the practice greens and the Challenges. The other parts only read them.

import { gustEnvelope, skyLook, MIN_SHADOW } from "../sim/weather.mjs";

export const weatherLook = {
  time: 0,
  still: true,
  mph: 0,
  yaw: 0,
  dir: [1, 0],
  gust: 1,
  gusting: 0,
  seed: 1,
  sun: 1,
  cover: 0.35,
  cloudShadow: 0,
  wet: 0,
  dry: 0,
  haze: 1,
  sky: "fair",
  shadow: 1,
  rain: 0,
};

// How fast the eased values follow (per second): a shower's rain and the
// wet it brings, the cloud shadows fading round a green.
const EASE = 0.6;
let lastTime = null;

// Once a frame: the time (seconds) and the mode's wind ({ mph, yaw, seed },
// or null for still air - the mode's sceneryWind()).
export function updateWeatherLook(time, wind = null) {
  const w = weatherLook;
  w.time = time;
  const mph = Math.max(0, wind?.mph ?? 0);
  w.still = !wind;
  w.mph = mph;
  if (Number.isFinite(wind?.yaw)) {
    w.yaw = wind.yaw;
    // The cloth runs out along its own +x, turned by yaw about the pole.
    w.dir = [Math.cos(wind.yaw), -Math.sin(wind.yaw)];
  }
  if (Number.isFinite(wind?.seed)) w.seed = wind.seed;
  w.gust = w.still ? 1 : gustEnvelope(time, w.seed);
  w.gusting = mph * w.gust;
  // The sky: { kind, raining, haze, dry, shade } (course.js, range.js).
  const sky = w.still ? null : wind.sky;
  const kind = sky?.kind ?? "fair";
  // (The round's own cloud: sim/weather.mjs skyLook with its seed.)
  const look = skyLook(kind, sky?.seed);
  const dt = lastTime === null || kind !== w.sky ? 1e3 : Math.min(1, Math.max(0, time - lastTime));
  lastTime = time;
  const ease = (from, to) => from + (to - from) * Math.min(1, dt * EASE);
  w.sky = kind;
  w.sun = look.sun;
  w.cover = look.cover;
  w.shadow = Math.max(MIN_SHADOW, look.shadow);
  w.haze = Number.isFinite(sky?.haze) ? sky.haze : look.haze;
  w.dry = Number.isFinite(sky?.dry) ? sky.dry : 0;
  w.rain = ease(w.rain, sky?.raining ? look.rain : 0);
  // Wet from the rain: all of the sky's in rain; in showers, drying a
  // little between them.
  w.wet = ease(w.wet, look.wet * (look.rain > 0 && !sky?.raining ? 0.7 : 1));
  // Cloud shadows: none in still air (the practice greens), faded out
  // round the flag while putting (shade 0).
  w.cloudShadow = ease(w.cloudShadow, w.still ? 0 : look.cloudShadow * (sky?.shade ?? 1));
  return w;
}

// The most haze anything marked readable may take, as a share of a fair
// day's: the ball, its tracer, the flag, the tee markers and the boards
// never fade into a thicker haze (a misty morning, when it comes) than a
// fair day's.
export const READABLE_HAZE = 1;

// Marks something as readable (READABLE_HAZE): the object and everything
// in it, and their materials, so the haze can leave them clear (the
// READABLE define: look/glsl/haze.js).
export function markReadable(object) {
  object.traverse?.((o) => {
    o.userData.readable = true;
    for (const m of [o.material].flat()) {
      if (!m) continue;
      m.userData.readable = true;
      if (!("READABLE" in (m.defines ?? {}))) {
        m.defines = { ...(m.defines ?? {}), READABLE: "" };
        m.needsUpdate = true;
      }
    }
  });
  return object;
}
