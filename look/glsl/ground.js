// The ground's recipe, once: the shader code every grass surface is coloured
// by - the designed holes' and the range's grass (look/grass.js), the
// ground of a hole rebuilt from a map (look/mappedground.js), the practice
// greens - so whatever is added to the ground lands on all of them at once
// and the two kinds of hole can't drift apart. Plain strings and numbers,
// no three.js, so the tests can read it.
//
//   NOISE   the hash, value noise and fractal noise everything is built from,
//           and the rough's light and dark patches (gRoughPatches)
//   GROUND  the layers a grass colour is built from, in the order they're
//           laid: the grass's own patches and hue (gGrassBase), the wind's
//           waves across long grass (gWindWaves), mowing stripes (gMow)
//           in a pattern (gMowing: mowingFor),
//           blades close up (gBlades) and the dulling with distance
//           (gDistance); and the weather's: straw on a firm day (gStraw,
//           a deeper green on a soft one), a shade darker after rain
//           (gWetGround), clover in the rough (in gRoughPatches), and on
//           High daisies and dandelions close up (gFlowers) and a second
//           scale of blades across the first (GROUND_FINE)
//   GROUND_COLOUR  the part of it a vertex shader can run too (no screen
//           derivatives): the tufts work out the colour of the rough they
//           stand in with it, once a vertex
//
// Its per-frame values (groundUniforms: the wind across the grass, how wet
// and how dry the ground is) are shared by every material that runs it,
// and set once a frame from the weather's values (animateGround, called
// with the water's: look/sandwater.js animateWater).
//
// Its colours are the palette's (look/palette.js), in linear light as the
// grass is worked in.
//
// Changing what it does must change GROUND_KEY, so every program using it
// is built again.

export const GROUND_KEY = "gr13";

import { PALETTE, WET, glslLinear } from "../palette.js";

// Clover's darker, bluer green, as a tint of the grass it grows in.
const CLOVER = "vec3(0.8, 0.95, 1.02)";

// Shared by every material that runs the chunk (plain arrays and numbers:
// three.js takes either for a uniform).
export const groundUniforms = {
  // The way the wind blows (world x, z), how far its waves have travelled
  // (metres), and how strong they are now (0 in a calm or still air).
  gWindDir: { value: [1, 0] },
  gWindOff: { value: 0 },
  gWindK: { value: 0 },
  // How wet the ground is after rain, and how dry on a firm day (0 - 1:
  // the weather's wet and dry).
  gWet: { value: 0 },
  gDry: { value: 0 },
  // How hard it's raining on the ground (0 - 1, none with the Rain on the
  // ground switch off), and the clock its drops splash by (seconds).
  gRain: { value: 0 },
  gTime: { value: 0 },
  // The far rough (sim/farrough.mjs, set by look/farrough.js): metres from
  // the camera it starts, is full, starts to fade and is gone; and how
  // strong (0: not drawn).
  gFarRough: { value: [0, 1, 2, 3] },
  gFarRoughK: { value: 0 },
};

// The Rain on the ground switch (sim/effects.mjs rainground), switched live
// (app.js liveEffects).
export const RAIN_GROUND = { on: true };

export const GROUND_PARS = /* glsl */ `
  uniform vec2 gWindDir;
  uniform float gWindOff;
  uniform float gWindK;
  uniform float gWet;
  uniform float gDry;
  uniform float gRain;
  uniform float gTime;
  uniform vec4 gFarRough;
  uniform float gFarRoughK;
`;

// What the ground shows of the weather, from its values (look/
// weatherlook.js):
//   wind   how strong the waves across the long grass are: none in a calm
//          (under 3 mph) or still air, full by 20 mph, and stronger in a
//          gust than a lull
//   speed  how fast they travel downwind, metres a second
//   dir    the way the wind blows
//   wet    how wet the ground is (0 - 1): every grass a shade darker, by
//          palette.js WET at its wettest
//   dry    how dry (0 - 1): straw in the fairways and rough - none while
//          it's wet
export function groundLook(weather) {
  const wet = clamp01(weather?.wet);
  const dry = clamp01(weather?.dry) * (1 - wet);
  if (!weather || weather.still) return { wind: 0, speed: 0, dir: [1, 0], wet, dry };
  const mph = Math.max(0, weather.mph ?? 0);
  const base = Math.min(1, Math.max(0, (mph - 3) / 17));
  const surge = Math.max(0.6, Math.min(1.4, 1 + ((weather.gust ?? 1) - 1) * 1.3));
  const wind = Math.min(1, base * surge);
  // A wave in the grass runs at about two thirds of the wind's speed.
  const speed = Math.max(0, weather.gusting ?? mph) * 0.447 * 0.65;
  return { wind, speed, dir: weather.dir ?? [1, 0], wet, dry };
}
const clamp01 = (v) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);

// Once a frame (with the water's clock): the waves move on, and ease to the
// wind's strength so a gust sweeps in rather than switching on.
let last = null;
export function animateGround(time, weather) {
  const dt = last === null ? 0 : Math.min(0.25, Math.max(0, time - last));
  last = time;
  const look = groundLook(weather);
  const u = groundUniforms;
  u.gWindDir.value = look.dir;
  u.gWindOff.value += look.speed * dt;
  u.gWindK.value += (look.wind - u.gWindK.value) * Math.min(1, dt * 1.2);
  if (u.gWindK.value < 0.002 && look.wind === 0) u.gWindK.value = 0;
  u.gWet.value = look.wet;
  u.gDry.value = look.dry;
  u.gRain.value = RAIN_GROUND.on ? clamp01(weather?.rain) : 0;
  u.gTime.value = time % 600;
  for (const fn of groundWatchers) fn(u);
  return look;
}

// The node ground (groundnode.js) reads the same wind, wet and rain.
const groundWatchers = new Set();
export function watchGround(fn) {
  groundWatchers.add(fn);
  return fn;
}

// How a hole is mown (sim/mowing.mjs, pure, so the neighbours and the
// designer share it).
export { FAIRWAY_MOWS, GREEN_MOWS, mowingFor } from "../../sim/mowing.mjs";

// A direction in the hole's frame (x down the hole, z to its right) in
// world terms (x = hole z, z = -hole x).
export const holeToWorld = ([x, z]) => [z, -x];

export const NOISE = /* glsl */ `
  float gHash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float gNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(gHash(i), gHash(i + vec2(1.0, 0.0)), u.x),
               mix(gHash(i + vec2(0.0, 1.0)), gHash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float gFbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * gNoise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }
  // The rough's light and dark patches: soft-edged, irregular stretches of
  // darker, lusher grass and of paler, drier grass, a few metres to twenty
  // or so across (the size they'd be from where a player stands), with
  // clumps within them. k: how strong (0 none; the rough 1, deep rough more).
  // Used by the designed holes' grass and the mapped holes' ground alike.
  vec3 gRoughPatches(vec3 grass, vec2 w, float k) {
    float big = gFbm(w * 0.07 + 41.0);
    float clump = gNoise(w * 0.45 + 7.0);
    float drift = gNoise(w * 0.16 + 3.0);
    float wobble = (clump - 0.5) * 0.14 + (drift - 0.5) * 0.1;
    float darkP = smoothstep(0.46, 0.62, big + wobble);
    float lightP = smoothstep(0.52, 0.66, 1.0 - big + wobble);
    grass *= 1.0 - k * 0.36 * darkP;
    grass *= mix(vec3(1.0), vec3(0.93, 1.0, 1.06), k * darkP);
    grass = mix(grass, grass * vec3(1.24, 1.17, 0.92), k * lightP);
    grass *= 1.0 + k * 0.18 * (clump - 0.5);
    // Clover: small patches, a metre or two across, of a darker, bluer
    // green, in the rough's lusher stretches (from the clumps' own noise,
    // no more reads of it).
    float clover = smoothstep(0.66, 0.74, clump) * (1.0 - lightP) * smoothstep(0.45, 0.65, drift);
    grass = mix(grass, grass * ${CLOVER}, min(k, 1.0) * clover);
    // And broad swathes, lighter and darker over forty metres or so - the
    // lighter drier and goldier, the darker lusher and bluer, so from the
    // air the rough and long grass change shade across the hole in
    // patches, tufts and ground alike (the owner: "the grass to change in
    // shades of colour in patches and across areas").
    float swathe = gFbm(w * 0.022 + 13.0) - 0.44;
    grass *= 1.0 + k * 0.24 * swathe;
    float kk = min(k, 1.5);
    grass = mix(grass, grass * vec3(1.1, 1.04, 0.8), kk * 0.55 * smoothstep(0.02, 0.2, swathe));
    grass = mix(grass, grass * vec3(0.9, 1.0, 1.08), kk * 0.5 * smoothstep(-0.02, -0.18, swathe));
    return grass;
  }
`;

export const GROUND_COLOUR = /* glsl */ `
  ${GROUND_PARS}
  const vec3 G_STRAW = ${glslLinear(PALETTE.straw)};
  const float G_WET = ${WET.toFixed(4)};
  float gLuma(vec3 c) {
    return dot(c, vec3(0.2126, 0.7152, 0.0722));
  }
  // Straw on a firm day (gDry): patches (p, a patch value, 0 - 1) of this
  // grass turn the palette's straw at the grass's own brightness, so the
  // steps between the grasses hold. k: how much this grass takes (1 the
  // fairways and rough, 0 a green).
  vec3 gStraw(vec3 grass, float p, float k) {
    float s = gDry * k * smoothstep(0.48, 0.74, p);
    return mix(grass, G_STRAW * (gLuma(grass) / gLuma(G_STRAW)) * 1.06, s * 0.6);
  }
  // After rain (gWet): every grass alike a shade darker, by the palette's
  // one wet factor, so the steps between them hold.
  vec3 gWetGround(vec3 grass) {
    return grass * mix(1.0, G_WET, gWet);
  }

  // How a mower's line wavers: in stripes (add it to a stripe coordinate).
  float gWaver(vec2 w) {
    return (gNoise(w * 0.045) - 0.5) * 0.3;
  }

  // Two-tone mowing stripes along t (in stripes: one light and one dark
  // band to each whole number): 0 light, 1 dark, the edges e stripes soft.
  float gMowSoft(float t, float e) {
    return smoothstep(0.5 - e, 0.5 + e, abs(fract(t) - 0.5) * 2.0);
  }

  // gMowing's stripes (in GROUND), in a vertex shader too: their edges e
  // stripes soft - where the ground's are a pixel and a half (gMow) - for
  // Ultra's short grass across the hole, each clump the shade of the
  // stripe it stands in (look/groundbits.js).
  float gMowingAt(vec2 w, vec2 dir, float width, float kind, vec2 centre, float e) {
    float wv = gWaver(w);
    if (kind > 1.5) return gMowSoft(length(w - centre) / width + wv, e);
    vec2 s = w - centre;
    float a = gMowSoft(dot(s, dir) / width + wv, e);
    if (kind > 0.5) a = 0.5 * (a + gMowSoft(dot(s, vec2(-dir.y, dir.x)) / width + wv * 0.8, e));
    return a;
  }

  // A grass's own variety, at world position w: patches (how strong:
  // amount; how big: patchScale, per metre), a broad drift over a couple of
  // hundred metres so a long view down the hole isn't one flat block of
  // green, patches a few paces to a few tens of metres across (the size a
  // stretch of rough fills seen from the tee), and its hue - dry,
  // straw-coloured patches and lush, bluer ones (how much: tint).
  vec3 gGrassBase(vec3 grass, vec2 w, float amount, float patchScale, float tint) {
    float n = gFbm(w * patchScale);
    grass *= 1.0 + amount * (n - 0.5) * 2.0;
    grass *= mix(vec3(0.8, 0.86, 0.95), vec3(1.14, 1.1, 0.88), gNoise(w * 0.006 + 31.0));
    grass *= 1.0 + amount * 0.55 * (gNoise(w * 0.06 + 5.0) + 0.6 * gNoise(w * 0.17 + 9.0) - 0.8) * 1.25;
    float parched = gFbm(w * patchScale * 0.55 + 17.0);
    float dry = smoothstep(0.42, 0.78, parched);
    // A soft day: a deeper green, the drier patches greened over.
    grass = mix(grass, grass * vec3(1.1, 1.03, 0.7), dry * tint * (1.0 - 0.7 * gWet));
    float lush = gNoise(w * patchScale * 2.7 + 5.0);
    grass *= mix(vec3(1.0), vec3(0.9, 1.0, 1.06), lush * tint);
    // A firm day: straw in the same drier patches - on the fairways, tees
    // and fringes and in the rough (the grasses with some hue of their
    // own), never on a green (tint 0.2).
    return gStraw(grass, parched, smoothstep(0.3, 0.45, tint));
  }

  // The wind across long grass: soft, lighter bands - the grass bent over,
  // showing its paler side - running downwind, long across the wind and
  // wandering, at most 6% brighter, stronger in a gust, and gone beyond
  // about 300 m (world: the point's world position; k: how long the grass
  // is, 1 the rough's). None in a calm.
  vec3 gWindWaves(vec3 grass, vec2 w, vec3 world, float k) {
    if (gWindK * k <= 0.0) return grass;
    float u = dot(w, gWindDir) - gWindOff;
    float v = dot(w, vec2(-gWindDir.y, gWindDir.x));
    float b = min(1.0, smoothstep(0.5, 0.85, gNoise(vec2(u * 0.085, v * 0.022) + 23.0)) * gWindK * k);
    // (A links hole's long grass - k over 1.5 - shows them further and
    // stronger: the wind running across the dunes.)
    float reach = max(1.0, k * 0.8);
    b *= 1.0 - smoothstep(200.0 * reach, 300.0 * reach, distance(world.xz, cameraPosition.xz));
    vec3 pale = vec3(dot(grass, vec3(0.2126, 0.7152, 0.0722)));
    return mix(grass, mix(grass, pale, 0.3 + 0.08 * max(0.0, k - 1.0)) * (1.0 + 0.045 * max(1.0, k)), b);
  }
`;

export const GROUND = /* glsl */ `
  ${GROUND_COLOUR}

  // The far rough (sim/farrough.mjs; fragment shaders only - GROUND, not
  // GROUND_COLOUR, which the long grass's vertices run): past where the 3D long grass thins,
  // the rough read as standing grass - its colours the long grass's own
  // (look/longgrass.js: a clump's foot 0.7 of the ground's colour, its tips
  // 1.15) - darker in the gaps between tufts, the tops paler and showing
  // more when looked across low, and the long grass's own wave
  // (the same sine down the wind) brightening it as it passes. k: how long
  // the grass is (gWindWaves's k: 1 the rough's).
  vec3 gFarRoughLook(vec3 grass, vec2 w, vec3 world, float k) {
    // (The finer tufts' blur worked out first: derivatives only outside a branch.)
    float fine = 1.0 - smoothstep(0.08, 0.35, fwidth(w.x * 2.6));
    if (gFarRoughK <= 0.0 || k <= 0.0) return grass;
    // (By the distance from the camera, height and all: seen from the air -
    // a flyover, a drive followed up - the rough under the camera is
    // standing grass too, as the tufts on it are, not a flat carpet between
    // them.)
    float dist = distance(world, cameraPosition);
    float gFarRoughOn = smoothstep(gFarRough.x, gFarRough.y, dist) * (1.0 - smoothstep(gFarRough.z, gFarRough.w, dist));
    float a = gFarRoughOn;
    // (Near the camera, inside the long grass, none of it runs.)
    if (gFarRoughOn > 0.0) {
      a *= gFarRoughK * min(k, 1.5);
      // Tufts and gaps: two scales of noise, the finer gone before it shimmers.
      float c = mix(0.5, gNoise(w * 2.6 + 13.0), fine) * 0.45 + gNoise(w * 0.9 + 41.0) * 0.55;
      float top = smoothstep(0.3, 0.72, c);
      // Looked across low, the tops hide the gaps.
      vec3 toEye = normalize(cameraPosition - world);
      float graze = 1.0 - smoothstep(0.04, 0.45, toEye.y);
      top = mix(top, 1.0, graze * 0.55);
      vec3 col = grass * mix(0.78, 1.12, top);
      // The long grass's wave, down the wind, its tips' paler side.
      float wave = 0.5 + 0.5 * sin(dot(world.xz, gWindDir) * 1.7 - gWindOff * 1.7 + world.x * 0.3);
      col = mix(col, vec3(gLuma(col)) * 1.12, 0.25 * wave * gWindK * top);
      grass = mix(grass, col, a);
    }
    return grass;
  }

  // Two-tone mowing stripes along t (gMowSoft), soft-edged and blurred
  // out far away, where they'd shimmer: their edges a pixel and a half.
  float gMow(float t) {
    return gMowSoft(t, clamp(fwidth(t) * 1.5, 0.02, 0.5));
  }

  // Mowing: stripes width metres wide changing along dir (unit length),
  // wavering as a mower's line does. kind 0: one way; 1: checked, a second
  // set across the first (three shades where they cross); 2: rings round
  // centre, as a range's target greens are mown. 0 light, 1 dark.
  float gMowing(vec2 w, vec2 dir, float width, float kind, vec2 centre) {
    float wv = gWaver(w);
    if (kind > 1.5) return gMow(length(w - centre) / width + wv);
    // (Stripes start from centre too: a neighbour's from its own tee, as
    // when it's played; a played hole's tee is the origin.)
    vec2 s = w - centre;
    float a = gMow(dot(s, dir) / width + wv);
    if (kind > 0.5) a = 0.5 * (a + gMow(dot(s, vec2(-dir.y, dir.x)) / width + wv * 0.8));
    return a;
  }

  // A clean-up pass: the tone of the band a mower leaves going round the
  // edge (of a fairway, inside a green's fringe), between the two stripes.
  const float G_CLEANUP = 0.62;

  // Blades, fading out as they get smaller than a pixel: the blade texture
  // (tiled every scale metres) multiplied in, by strength. d: the blade
  // texture's value here; fade: how much of the blades still shows.
  // On High (GROUND_FINE) a second scale of blades, finer and turned
  // against the first, so grass close to - at address, under the putting
  // camera - stops reading as felt; inside the same fade.
  // With the blade texture (GROUND_TEX, High: look/textures.js) the
  // blades also lean, from the texture's normal map: gLean, how far across
  // world x and z, for gLeanNormal to tilt the lit normal by - so the sun
  // catches the blades rather than lighting a painted carpet.
  vec2 gLean = vec2(0.0);
  vec3 gBlades(vec3 grass, vec2 w, sampler2D detail, float scale, float strength, out float d, out float fade) {
    vec3 t1 = texture2D(detail, w / scale).rgb;
    d = t1.r;
    fade = 1.0 - smoothstep(0.02, 0.25, fwidth(w.x / scale));
    #ifdef GROUND_TEX
    // (The texture's rows run down the picture; its v runs up it.)
    gLean = vec2(t1.g * 2.0 - 1.0, 1.0 - t1.b * 2.0) * strength * fade;
    #endif
    #ifdef GROUND_FINE
    // (Not on the phone, GROUND_PHONE: too fine for its picture.)
    #ifndef GROUND_PHONE
    mat2 turn = mat2(0.8, 0.6, -0.6, 0.8);
    vec3 t2 = texture2D(detail, turn * w / (scale * 0.37) + 0.31).rgb;
    float fine = 1.0 - smoothstep(0.02, 0.25, fwidth(w.x / (scale * 0.37)));
    d = mix(d, d * t2.r * 1.35, fine);
    #ifdef GROUND_TEX
    gLean += transpose(turn) * vec2(t2.g * 2.0 - 1.0, 1.0 - t2.b * 2.0) * strength * fine * 0.6;
    #endif
    #ifdef GROUND_HERO
    // The Sharp ground textures switch (sim/effects.mjs textures): a third,
    // finer layer still, the cut grass's own blades, only in the last few
    // metres round the camera - at address, round the ball - and gone
    // before it would shimmer. Skipped where it doesn't show.
    float heroScale = scale * 0.16;
    float hero = 1.0 - smoothstep(0.03, 0.2, fwidth(w.x / heroScale));
    if (hero > 0.0) {
      mat2 turn3 = mat2(0.28, -0.96, 0.96, 0.28);
      vec3 t3 = texture2D(detail, turn3 * w / heroScale + 0.67).rgb;
      d = mix(d, d * (0.55 + t3.r * 0.75), hero * fine);
      #ifdef GROUND_TEX
      gLean += transpose(turn3) * vec2(t3.g * 2.0 - 1.0, 1.0 - t3.b * 2.0) * strength * hero * fine * 0.45;
      #endif
    }
    #endif
    #endif
    #endif
    #ifdef GROUND_TEX
    // (Leaning blades scatter the sun a little: as bright as before, on
    // average.)
    grass *= 1.0 + 0.045 * strength * fade;
    #endif
    grass *= mix(1.0, 0.45 + d * 0.75, strength * fade);
    // Past where the blades are too small to draw, the same picture
    // larger - tufts and runs of grass seven times the size, then forty -
    // so the ground keeps a grain however far off, never smooth smears of
    // colour (the owner, of a links hole from above: "far too blocky").
    // Each fades in as the one before fades out, and out before it would
    // shimmer.
    float gone = 1.0 - fade;
    if (gone > 0.0) {
      float s7 = scale * 7.0;
      float s40 = scale * 40.0;
      float midK = 1.0 - smoothstep(0.04, 0.3, fwidth(w.x / s7));
      float farK = 1.0 - smoothstep(0.04, 0.3, fwidth(w.x / s40));
      float tm = texture2D(detail, mat2(0.6, 0.8, -0.8, 0.6) * w / s7 + 0.53).r;
      float tf = texture2D(detail, mat2(0.8, -0.6, 0.6, 0.8) * w / s40 + 0.17).r;
      float macro = mix(1.0 + (tf - 0.5) * 0.55 * farK, 1.0 + (tm - 0.5) * 0.8, midK);
      grass *= mix(1.0, macro, gone * (0.5 + 0.5 * min(strength, 1.0)));
    }
    return grass;
  }

  // Daisies (cream, never white) and dandelions (yellow) in the rough,
  // close up only: a flower or none in each cell of a small grid, in
  // drifts some metres across, and gone before a flower would be under a
  // pixel. Hashes only, no noise. k: how much of the rough is here.
  vec3 gFlowers(vec3 grass, vec2 w, float k) {
    float show = k * (1.0 - smoothstep(0.006, 0.016, fwidth(w.x)));
    if (show <= 0.0) return grass;
    vec2 cell = floor(w / 0.3);
    vec2 f = fract(w / 0.3);
    float h = gHash(cell + 71.3);
    float drift = gHash(floor(w / 7.0) + 5.1);
    if (h < 1.0 - 0.3 * smoothstep(0.35, 0.85, drift)) return grass;
    vec2 at = 0.25 + 0.5 * vec2(fract(h * 37.1), fract(h * 91.7));
    float r = length(f - at) * 0.3;
    float bloom = (1.0 - smoothstep(0.012, 0.018, r)) * show;
    vec3 flower = fract(h * 13.7) < 0.55 ? ${glslLinear(PALETTE.daisy)} : ${glslLinear(PALETTE.dandelion)};
    // A daisy's yellow heart.
    flower = mix(flower, ${glslLinear(PALETTE.dandelion)}, 1.0 - smoothstep(0.003, 0.005, r));
    return mix(grass, flower, bloom);
  }

  // Duller with distance - a third less colourful by 800 m - so the
  // playing ground is the greenest thing in view and the country beyond
  // melts into the haze rather than running on as a bright carpet.
  // (Luminance weights as written: the colours are linear.)
  vec3 gDistance(vec3 grass, vec3 world) {
    float far = smoothstep(150.0, 800.0, distance(world.xz, cameraPosition.xz));
    return mix(grass, vec3(dot(grass, vec3(0.2126, 0.7152, 0.0722))), far * 0.3);
  }
`;

// The country past the trees, and the woods floor (look/country.js): one
// picture over the ground, read once a pixel - fields, hedgerows, tracks,
// wood patches and ponds out past where a ball can finish, the woods floor
// beyond a designed hole's tree lines, and under every tree's crown its
// soft shade and leaf litter (never more than a fifth darker). Its colours
// are premultiplied by how much each covers, so the ground underneath
// shows through where it's clear: ground * (1 - a) + colour. gWorld is the
// ground's world position, as the grass shaders have it.
// The lit normal tilted by a detail texture's lean (gBlades' gLean, the
// sand's sLean): world x and z turned into the view's terms and taken
// along the surface, so it works on a slope as on the flat. For after
// three.js's <normal_fragment_maps>. lean: the vec2's name; k: how much.
export function leanNormal(lean, k = 0.7) {
  return /* glsl */ `
    {
      vec3 lx = (viewMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz;
      vec3 lz = (viewMatrix * vec4(0.0, 0.0, 1.0, 0.0)).xyz;
      lx = normalize(lx - normal * dot(normal, lx));
      lz = normalize(lz - normal * dot(normal, lz));
      normal = normalize(normal + (lx * ${lean}.x + lz * ${lean}.y) * ${k.toFixed(3)});
    }`;
}

export const COUNTRY_KEY = "co3";
export const COUNTRY_GLSL = /* glsl */ `
  uniform sampler2D gCountryMap;
  uniform sampler2D gCourseMap;
  uniform vec3 gCountryBox;
  vec3 gCountry(vec3 grass, vec3 world) {
    vec2 uv = (world.xz - gCountryBox.xy) * gCountryBox.z;
    vec4 c = texture2D(gCountryMap, uv);
    if (c.a <= 0.001) return grass;
    // Its colour, but keeping half the grass's own light and dark - its
    // blades and tufts - so a patch painted in a picture metres a pixel
    // never lies over the grass as a smooth smear (the owner: "far too
    // blocky").
    vec3 paint = c.rgb / c.a;
    float l = dot(paint, vec3(0.2126, 0.7152, 0.0722));
    float g = dot(grass, vec3(0.2126, 0.7152, 0.0722));
    // (Near to; the far country's fields as they were.)
    float near = 1.0 - smoothstep(150.0, 400.0, distance(world.xz, cameraPosition.xz));
    float grain = clamp(g / max(l, 1e-4), 0.5, 1.6);
    // The course's other holes' mown ground, sand and water (sim/
    // neighbours.mjs paintNeighbours's mown): the grass under them is the
    // rough's - its light and dark patches, a links hole's paler crests
    // and lusher hollows, the far rough's standing tufts - and half of
    // that came through, so from the air their fairways looked like dunes.
    // There only a faint, short grain is kept (a few per cent of the
    // grass's light and dark, close to): a hole drawn plain, as the hole
    // being played and the map have it. (No noise of its own: the near
    // rough's lookups a pixel are capped - test/noisecount.test.mjs; and
    // only where the other holes are painted at all, Medium and up:
    // GROUND_FINE.)
    float mown = 0.0;
    #ifdef GROUND_FINE
    mown = texture2D(gCourseMap, uv).r;
    #endif
    float even = 1.0 + clamp(grain - 1.0, -0.06, 0.06) * near;
    vec3 grained = mix(mix(paint, paint * grain, 0.5 * near), paint * even, mown);
    return mix(grass, grained, c.a);
  }
`;
