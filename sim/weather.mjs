// The weather a shot flies in: the wind (how hard, where from, how gusty),
// the temperature and the sky - on the range as set there, on the course
// rolled for each round from the owner's choice (calm, breezy, windy,
// strong, or random) and the same for every hole of it. Pure: the course and the range
// fly their shots in it (sim/flight.mjs takes the wind), and the words and
// the arrow come from here.
//
// Directions are compass degrees, clockwise, where the wind comes FROM (a
// "westerly" is 270). A course hole points somewhere on the compass
// (holeBearing); a shot's bearing is its hole's plus its aim. The range's
// target line is due north, so its wind is set straight in golfer's terms:
// 0 is straight into you, 180 straight behind, 90 from the right.
//
// Wind is stronger higher up: it's given at 10 m (as forecasts give it) and
// scaled by (height / 10 m) ^ 0.2 - an open course's profile - so a high
// wedge feels more of it than a low punch; within 1.5 m of the ground it's
// held at that height's.

import { MPH, simulateFlight } from "./flight.mjs";
import { BAG } from "./clubs.mjs";
import { cleanTime, cleanClock, clockNow } from "./daylight.mjs";

export const WIND_PRESETS = {
  calm: { name: "Calm", mph: [0, 4] },
  breezy: { name: "Breezy", mph: [6, 12] },
  windy: { name: "Windy", mph: [12, 20] },
  strong: { name: "Strong wind", mph: [20, 30] },
};
export const WIND_CHOICES = ["calm", "breezy", "windy", "strong", "random"];
export const WIND_CHOICE_NAMES = { calm: "Calm", breezy: "Breezy", windy: "Windy", strong: "Strong wind", random: "Any - a surprise each round" };
export const TEMP_CHOICES = ["mild", "cool", "warm", "hot", "random"];
export const TEMP_CHOICE_NAMES = { cool: "Cool (8 °C)", mild: "Mild (18 °C)", warm: "Warm (26 °C)", hot: "Hot (33 °C)", random: "Any" };
const TEMPS = { cool: 8, mild: 18, warm: 26, hot: 33 };
// How much a gust or lull can change the wind from shot to shot (a share of
// its speed) and its direction (degrees either way), by how strong it is.
const GUST = { calm: 0.3, breezy: 0.25, windy: 0.2, strong: 0.15 };
const SWING = 12;
export const MAX_MPH = 40;

// A little seeded random: the same seed, the same round's weather.
export function seeded(seed) {
  let x = (Math.abs(Math.floor(seed)) % 2147483646) + 1;
  return () => {
    x = (x * 48271) % 2147483647;
    return (x - 1) / 2147483646;
  };
}

// ---- The sky --------------------------------------------------------------------

// The skies a round (or the range) can have. Fair - sunny spells - is the
// default, and always the sky on the practice greens and in the Challenges.
export const SKY_KINDS = ["clear", "fair", "cloudy", "overcast", "showers", "rain", "mist"];
export const SKY_CHOICES = ["fair", "clear", "cloudy", "overcast", "showers", "rain", "mist", "random"];
export const SKY_CHOICE_NAMES = {
  clear: "Clear",
  fair: "Fair - sunny spells",
  cloudy: "Cloudy",
  overcast: "Overcast",
  showers: "Showers",
  rain: "Rain",
  mist: "A misty morning",
  random: "Any - a surprise each round",
};
// How the toast says it: "Breezy: 9 mph from the south-west, 14 °C, sunny spells".
const SKY_WORDS = { clear: "clear skies", fair: "sunny spells", cloudy: "cloudy", overcast: "overcast", showers: "showers", rain: "rain", mist: "a misty morning" };

// How likely each sky is when it's rolled ("any"): mist only in a calm or
// a breeze (wind blows mist away), showers more likely the windier it is.
export function skyChances(preset = "calm") {
  const windy = preset === "windy" || preset === "strong";
  return {
    clear: 2,
    fair: 4,
    cloudy: 3,
    overcast: 2,
    showers: windy ? 3.5 : 1.5,
    rain: 1,
    mist: preset === "calm" || preset === "breezy" ? 1.5 : 0,
  };
}

export const cleanSky = (sky) => (SKY_KINDS.includes(sky) ? sky : "fair");

// A round that's wet underfoot: rain or showers. It plays with soft
// fairways for that round (wetGround), and the start of the round says so.
export const wetSky = (sky) => sky === "rain" || sky === "showers";

// The fairways a round plays on: soft in a wet round, whatever the owner's
// own setting (which isn't changed); otherwise that setting.
export function roundGround(ground = "normal", weather = null) {
  return weather && wetSky(weather.sky) ? "soft" : ground;
}

// Whether it's raining at the round's `shot`-th shot (counted over every
// player): always in rain; in showers, spells of rain and dry that change
// only between shots - a few shots of rain, a few more of dry - seeded by
// the round; never otherwise.
export function rainingAt(sky, seed = 1, shot = 0) {
  if (sky === "rain") return true;
  if (sky !== "showers") return false;
  // Spells of 3 to 6 shots, each wet or dry by the round's seed; about
  // four in ten wet, and never two long dry spells running.
  const r = seeded(Math.abs(Math.round(seed)) * 31 + 5);
  let at = 0;
  let wet = r() < 0.5;
  let dryRun = 0;
  for (;;) {
    const len = 3 + Math.floor(r() * 4);
    if (shot < at + len) return wet;
    at += len;
    dryRun = wet ? 0 : dryRun + 1;
    wet = dryRun >= 1 ? r() < 0.7 : r() < 0.3;
  }
}

// The round's weather from the owner's choices: { wind: { mph, from,
// gust }, temperatureC, preset, sky, seed }. seed: any number (the round's
// start). The sky is rolled after the wind and the air, so the same seed
// gives the same wind and temperature as it always has.
// altitudeM, humidity: the course's own air (the owner's settings: metres
// above the sea, and percent - 0 is dry air, as it always was), kept with
// the round's weather as they are.
// time: the time of day picked (sim/daylight.mjs TIME_CHOICES), kept with
// the round's weather so online every bay plays in the host's - from the
// clock, with the clock as it was when the round was rolled (`clock`: the
// hour and the day, sim/daylight.mjs clockNow; `now` the Date it's read
// from), so every bay's round keeps the host's time.
export function rollConditions({ wind = "calm", temp = "mild", sky = "fair", altitudeM = 0, humidity = 0, time = "any", now = new Date() } = {}, seed = Date.now()) {
  const r = seeded(seed);
  const keys = Object.keys(WIND_PRESETS);
  const preset = wind === "random" ? keys[Math.floor(r() * keys.length)] : WIND_PRESETS[wind] ? wind : "calm";
  const [lo, hi] = WIND_PRESETS[preset].mph;
  const mph = Math.round((lo + (hi - lo) * r()) * 10) / 10;
  const from = Math.round(r() * 360) % 360;
  const tk = temp === "random" ? Object.keys(TEMPS)[Math.floor(r() * 4)] : TEMPS[temp] != null ? temp : "mild";
  let kind = cleanSky(sky);
  const roll = r();
  if (sky === "random") {
    const chances = Object.entries(skyChances(preset));
    const total = chances.reduce((a, [, w]) => a + w, 0);
    let x = roll * total;
    kind = chances.find(([, w]) => (x -= w) < 0)?.[0] ?? "fair";
  }
  const t = cleanTime(time);
  return { preset, wind: { mph, from, gust: GUST[preset] }, temperatureC: TEMPS[tk], sky: kind, time: t, ...(t === "clock" ? { clock: clockNow(now) } : {}), seed: Math.floor(Math.abs(seed)) % 2147483646, ...courseAir({ altitudeM, humidity }) };
}

// Kept sensible (a round saved with its weather, the range's settings).
// Weather saved before there were skies reads as a fair day.
export function cleanConditions(c) {
  const w = c?.wind ?? {};
  const mph = Number.isFinite(Number(w.mph)) ? Math.min(MAX_MPH, Math.max(0, Number(w.mph))) : 0;
  const from = Number.isFinite(Number(w.from)) ? ((Number(w.from) % 360) + 360) % 360 : 0;
  const gust = Number.isFinite(Number(w.gust)) ? Math.min(0.5, Math.max(0, Number(w.gust))) : 0;
  const t = Number(c?.temperatureC);
  const seed = Number(c?.seed);
  return {
    preset: typeof c?.preset === "string" ? c.preset : null,
    wind: { mph, from, gust },
    temperatureC: Number.isFinite(t) ? Math.min(45, Math.max(-10, t)) : 20,
    sky: cleanSky(c?.sky),
    time: cleanTime(c?.time),
    ...(cleanClock(c?.clock) ? { clock: cleanClock(c.clock) } : {}),
    seed: Number.isFinite(seed) ? Math.floor(Math.abs(seed)) : 1,
    ...courseAir(c ?? {}),
  };
}

// A course's altitude (0 - 3500 m) and humidity (0 - 100%), kept sensible:
// only those set (anything else, or 0, is sea level and dry air).
export function courseAir({ altitudeM, humidity } = {}) {
  const out = {};
  const alt = Number(altitudeM);
  const hum = Number(humidity);
  if (Number.isFinite(alt) && alt > 0) out.altitudeM = Math.min(3500, Math.round(alt));
  if (Number.isFinite(hum) && hum > 0) out.humidity = Math.min(100, Math.round(hum));
  return out;
}

// Where a course hole points (compass degrees): the hole's own, if its map
// gave one, or one of its own from its number - so a round's wind comes
// from different sides on different holes, as it does on a real course.
export function holeBearing(hole) {
  const b = Number(hole?.layout?.bearing ?? hole?.bearing);
  if (Number.isFinite(b)) return ((b % 360) + 360) % 360;
  const n = Number(hole?.layout?.number ?? hole?.number ?? 1);
  return Math.round((n * 137.508) % 360);
}

// This shot's wind, gusts and all: { mph, from } - varying from shot to
// shot by the round's gustiness (seeded by the shot, so the same shot
// meets the same gust).
export function gustFor(wind, seed) {
  if (!wind || !(wind.mph > 0)) return { mph: 0, from: wind?.from ?? 0 };
  const r = seeded(seed);
  const g = wind.gust ?? 0;
  return { mph: Math.max(0, wind.mph * (1 + g * (2 * r() - 1))), from: (wind.from + SWING * (2 * r() - 1) + 360) % 360 };
}

// The wind against a shot going `bearing`: how much is into it (mph; into
// is +, helping -) and across it (mph; from the left is +, pushing right).
export function components(wind, bearing) {
  const rel = ((wind.from - bearing) * Math.PI) / 180;
  return { head: wind.mph * Math.cos(rel), cross: -wind.mph * Math.sin(rel) };
}

// For sim/flight.mjs: the wind in the shot's frame (x along it, y up, z to
// the right; m/s), as a function of the height above the launch.
export function windField(wind, bearing) {
  if (!wind || !(wind.mph > 0)) return undefined;
  const { head, cross } = components(wind, bearing);
  // Blowing: into the shot is -x; from the left pushes right, +z.
  const base = [-head * MPH, 0, cross * MPH];
  return (h) => {
    const k = Math.pow(Math.max(1.5, h) / 10, 0.2);
    return [base[0] * k, 0, base[2] * k];
  };
}

// The wind through a flight (docs/PHYSICS-PLAN.md phase 5): windField's,
// and on top of it -
//   ground(x, z): the ground's height (m) under the ball (the shot's
//     frame, from the launch): the profile goes by the height above the
//     ground under the ball, not above the tee - a drive off a high tee
//     meets the stronger wind it's really in;
//   gusts: the gusts come and go during the flight (the owner: "Only with
//     windy. Setting." - only at FLIGHT_GUSTS.mph and up), so a ball can be
//     caught by one at its peak;
//   shelter(x, z): 0 - 1, how sheltered the spot is by trees upwind - the
//     wind weaker close to the ground there, recovering higher up;
//   a little turbulence, more the windier.
// seed: the shot's, so the same shot always meets the same wind.
// Returns (h, x, z, t) -> [x, y, z] m/s, or undefined with no wind.
export const FLIGHT_GUSTS = { mph: 12, period: 3.2 };
export function flightWind(wind, bearing, { seed = 1, ground = null, gusts = false, shelter = null } = {}) {
  if (!wind || !(wind.mph > 0)) return undefined;
  const { head, cross } = components(wind, bearing);
  const base = [-head * MPH, 0, cross * MPH];
  const r = seeded(seed * 7 + 3);
  const ph = [r(), r(), r(), r(), r()].map((v) => v * Math.PI * 2);
  const g = Math.min(0.5, Math.max(0, wind.gust ?? 0.2));
  const gusting = gusts && wind.mph >= FLIGHT_GUSTS.mph;
  // Turbulence: a few per cent, more the windier (4% at 10 mph, 8% at 30).
  const turb = 0.02 + 0.002 * Math.min(30, wind.mph);
  return (h, x = 0, z = 0, t = 0) => {
    const above = ground ? h - ground(x, z) : h;
    let k = Math.pow(Math.max(1.5, above) / 10, 0.2);
    if (gusting) k *= 1 + g * (0.65 * Math.sin((2 * Math.PI * t) / FLIGHT_GUSTS.period + ph[0]) + 0.35 * Math.sin((2 * Math.PI * t) / (FLIGHT_GUSTS.period * 0.41) + ph[1]));
    if (shelter) k *= 1 - 0.45 * shelter(x, z) * Math.max(0, 1 - above / 15);
    const wob = turb * Math.sin(1.7 * t + ph[2] + x * 0.05);
    const side = turb * Math.sin(2.3 * t + ph[3] + z * 0.05);
    return [base[0] * k * (1 + wob) - base[2] * side, 0, base[2] * k * (1 + wob) + base[0] * side];
  };
}

// The push of a strong wind on a ball rolling on the ground (m/s/s, the
// hole's frame: x along the hole's own bearing, z to its right): the air
// just above the turf is a quarter of what blows at 10 m, and only from
// FLIGHT_GUSTS.mph up is it worth anything - a links green in a gale.
export function groundPush(wind, bearing) {
  if (!wind || !(wind.mph >= FLIGHT_GUSTS.mph)) return null;
  const { head, cross } = components(wind, bearing);
  const v = Math.hypot(head, cross) * MPH * 0.25;
  if (!(v > 0)) return null;
  const a = 0.0093 * v * v;
  const n = Math.hypot(head, cross);
  return [(-head / n) * a, (cross / n) * a];
}

// "12 mph, into and from the left" - for a shot going `bearing`.
export function windWords(wind, bearing) {
  if (!wind || wind.mph < 1) return "Calm";
  const { head, cross } = components(wind, bearing);
  const parts = [];
  if (Math.abs(head) >= wind.mph * 0.38) parts.push(head > 0 ? "into you" : "helping");
  if (Math.abs(cross) >= wind.mph * 0.38) parts.push(cross > 0 ? "from the left" : "from the right");
  return `${Math.round(wind.mph)} mph${parts.length ? `, ${parts.join(" and ")}` : ""}`;
}

// The arrow's angle on screen (degrees clockwise from straight up the
// screen, the way the shot goes): the way the wind is blowing.
export function arrowAngle(wind, bearing) {
  return (((wind.from + 180 - bearing) % 360) + 360) % 360;
}

// What a distance plays like in this wind and air: as the game's own flight
// model flies it - the club that carries about that far (its bag ball,
// sim/clubs.mjs), flown in still air at 20 °C and in this wind and
// temperature, and the distance scaled by how much shorter (or longer) it
// went. Into the wind costs a high-spinning short iron more than a driver;
// warm air helps only a little. (Worked out once for each club, mph of wind
// into the shot and degree: playsLikeFactor.)
export function playsLike(yards, wind, bearing, temperatureC = 20) {
  if (!Number.isFinite(yards)) return yards;
  const { head } = wind && wind.mph > 0 ? components(wind, bearing) : { head: 0 };
  return yards * playsLikeFactor(yards, head, Number.isFinite(temperatureC) ? temperatureC : 20);
}

const factors = new Map();
export function playsLikeFactor(yards, headMph, temperatureC = 20) {
  const head = Math.round(Math.max(-40, Math.min(40, headMph)));
  const temp = Math.round(Math.max(-10, Math.min(45, temperatureC)));
  if (head === 0 && temp === 20) return 1;
  const club = Object.keys(BAG).reduce((best, c) => (Math.abs(BAG[c].carry - yards) < Math.abs(BAG[best].carry - yards) ? c : best), "7I");
  const key = `${club}|${head}|${temp}`;
  if (!factors.has(key)) {
    const b = BAG[club];
    const shot = { speedMph: b.speed, vla: b.vla, hla: 0, totalSpin: b.spin, spinAxis: 0 };
    const still = simulateFlight(shot, {}).landing.position[0];
    const now = simulateFlight(shot, { temperatureC: temp, wind: windField({ mph: Math.abs(head), from: head >= 0 ? 0 : 180 }, 0) }).landing.position[0];
    factors.set(key, now > 1 ? still / now : 1);
  }
  return factors.get(key);
}

// A wind strong enough to keep a shot out of the club's numbers (its carry
// isn't the club's).
export const windy = (wind) => !!wind && wind.mph >= 4;

// An arrow for an angle (arrowAngle): one of eight, as text.
export function windArrow(deg) {
  return ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"][Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

// "from the south-west" - where a wind comes from, in words.
export function compassWords(from) {
  const names = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
  return names[Math.round((((from % 360) + 360) % 360) / 45) % 8];
}

// The round's weather in a line: "Breezy: 9 mph from the south-west,
// 18 °C, sunny spells". With `soft`, a wet round says it plays soft (the
// start-of-round toast).
export function conditionsWords(c, { soft = false } = {}) {
  if (!c) return "";
  const name = WIND_PRESETS[c.preset]?.name ?? "Wind";
  const wind = c.wind.mph >= 1 ? `${Math.round(c.wind.mph)} mph from the ${compassWords(c.wind.from)}` : "no wind";
  const sky = SKY_WORDS[c.sky] ? `, ${SKY_WORDS[c.sky]}` : "";
  const wet = soft && wetSky(c.sky) ? " - the fairways play soft today" : "";
  return `${name}: ${wind}, ${Math.round(c.temperatureC)} °C${sky}${wet}`;
}

// A flag's turn about its pole (radians, three.js y) to stream the way the
// wind blows, for a hole pointing `bearing` in the scene's frame (x down
// the hole mapped to world -z, right to world +x: scenery.js toWorld).
export function flagYaw(wind, bearing) {
  const rel = ((wind.from + 180 - bearing) * Math.PI) / 180;
  return Math.atan2(Math.cos(rel), Math.sin(rel));
}

// ---- The gust clock ---------------------------------------------------------------

// How strong the wind is from moment to moment, for what's seen (and later
// heard) - flags, clouds, water, grass and trees all on the one clock, so a
// gust seen in the flag is the gust on the pond. A multiplier on the wind's
// speed: between GUST_LOW and GUST_HIGH, smooth (no jumps, no corners), the
// same for the same seed, and never repeating: a sum of slow waves whose
// lengths share no common multiple, squeezed smoothly into the range, with
// the surges above the mean a little stronger than the lulls below it. It
// has nothing to do with how a ball flies (gustFor is that).
export const GUST_LOW = 0.7;
export const GUST_HIGH = 1.35;
// The waves: seconds from crest to crest, and weight.
const GUST_WAVES = [
  [31.7, 1],
  [13.3, 0.8],
  [7.1, 0.6],
  [3.73, 0.35],
  [1.91, 0.18],
];
const gustPhases = new Map();

// time: seconds; seed: any number (the round's, or the range's).
export function gustEnvelope(time, seed = 1) {
  let waves = gustPhases.get(seed);
  if (!waves) {
    const r = seeded(seed * 7919 + 17);
    // Each wave's length stretched a little by the seed too, so two seeds
    // aren't the same gusts shifted.
    waves = GUST_WAVES.map(([len, w]) => [(2 * Math.PI) / (len * (0.9 + 0.2 * r())), r() * 2 * Math.PI, w]);
    gustPhases.set(seed, waves);
    if (gustPhases.size > 64) gustPhases.delete(gustPhases.keys().next().value);
  }
  let s = 0;
  let total = 0;
  for (const [k, phase, w] of waves) {
    s += w * Math.sin(k * time + phase);
    total += w;
  }
  // -1..1, pushed a little towards the surges.
  const x = s / total;
  const shaped = Math.tanh(1.8 * x + 0.35 * x * x);
  const mid = (GUST_HIGH + GUST_LOW) / 2;
  const half = (GUST_HIGH - GUST_LOW) / 2;
  return mid + half * shaped;
}

// ---- How each sky looks ---------------------------------------------------------------

// The one sun and the light from the sky, on a fair day (look/environment.js
// lights every scene with these): the sun's strength, the sky's fill, and
// how high the sun stands (degrees).
export const SUN_LIGHT = 2.6;
export const SKY_LIGHT = 1.9;
export const SUN_ELEVATION = 38;
// Harder sunlight (sim/effects.mjs hardsun; look/environment.js lights with
// it): the sun stronger and the sky's fill weaker by these, so level
// ground in the sun is about as bright as it was (sunlight, shadeShare)
// and shade is under a third of it rather than over half - as on a clear
// day, where the game's light read as a bright overcast (the owner, 16
// October 2026: "need to have another go at lighting"). The sky's cut is
// the full HARD_SUN.sky with the sun at its usual height (SUN_ELEVATION)
// or higher, and less the lower the sun stands - with Time of day from the
// clock on (sim/daylight.mjs), a round at dusk has the sun 9 degrees up,
// lighting level ground hardly at all, and the sky's fill is nearly all
// the ground's light: cut by half, the evening was dark.
export const HARD_SUN = { sun: 1.5, sky: 0.55 };
const sinOf = (degrees) => Math.sin((degrees * Math.PI) / 180);
// The sun's and the sky's strength on a fair day, harder or not, with the
// sun `elevation` degrees up.
export function sunlight({ hard = false, elevation = SUN_ELEVATION } = {}) {
  if (!hard) return { sun: SUN_LIGHT, sky: SKY_LIGHT };
  const height = Math.min(1, Math.max(0, sinOf(elevation) / sinOf(SUN_ELEVATION)));
  return { sun: SUN_LIGHT * HARD_SUN.sun, sky: SKY_LIGHT * (1 - (1 - HARD_SUN.sky) * height) };
}
// The sky's own exposure (look/environment.js skyExposed). three.js's sky
// grows brighter with the sun's height (its sunIntensity: three times a
// dusk sun's at 38 degrees), so at the usual 38 degrees and the clock's 48
// the sky came out bright enough for the tone map to wash it to a pale
// grey-blue - the deep blue of a dusk sun gone (found 18 October 2026,
// retaking the loading pictures). As a camera exposed for the ground
// would have it, the higher the sun the deeper the sky's blue: the sky's
// light scaled by the dusk sun's (SKY_EXPOSURE.from degrees) over this
// sun's, to SKY_EXPOSURE.power - never brighter, so a dusk sky is as it
// was. The clouds keep their own light, so they stand out white.
export const SKY_EXPOSURE = { from: 9, power: 1 };
// three.js's sunIntensity at the sun's height (its EE, cutoff and
// steepness).
export function skySunIntensity(elevation) {
  const zenith = Math.acos(Math.min(1, Math.max(-1, sinOf(elevation))));
  return 1000 * Math.max(0, 1 - Math.exp(-(1.6110731556870734 - zenith) / 1.5));
}
export function skyExposure(elevation = SUN_ELEVATION) {
  const here = skySunIntensity(elevation);
  if (!(here > 0)) return 1;
  return Math.min(1, Math.pow(skySunIntensity(SKY_EXPOSURE.from) / here, SKY_EXPOSURE.power));
}
// How bright shade on level ground is against the same ground in the sun
// (0 - 1) on a fair day: the sky's fill against the sky's and the sun's
// at its height together.
export function shadeShare(light = sunlight(), elevation = SUN_ELEVATION) {
  const level = light.sun * sinOf(elevation);
  return light.sky / (light.sky + level);
}
// Shadows never fade below this share of a fair day's, the ball's included.
export const MIN_SHADOW = 0.45;
// A cloud's shadow on the ground dims the light on flat grass by at most
// this much (much less than a tree's shadow does).
export const MAX_CLOUD_SHADOW = 0.1;
// A misty morning's haze, at its thickest, against a fair day's.
export const MIST_HAZE = 2.4;

// Every number the picture takes from the sky, by kind:
//   cover        how much of the sky is cloud (0 - 1)
//   sun          the sun's strength (1 a fair day)
//   skyLight     the sky's fill light (1 a fair day): up under cloud, so
//                the picture loses contrast rather than brightness
//   shadow       how dark shadows are (1 a fair day; never below MIN_SHADOW)
//   softness     how soft their edges are (1 a fair day)
//   haze         how thick the haze is (1 a fair day)
//   cloudShadow  how much the clouds' shadows dim flat grass at their
//                darkest (0 none; at most MAX_CLOUD_SHADOW)
//   wet          how wet the ground is (0 - 1)
//   rain         how hard it rains while it's raining (0 none)
//   grey         how far the blue sky is greyed (0 - 1)
//   veil         the thin high veil of cloud (the sky's own noise clouds)
const LOOKS = {
  clear: { cover: 0.12, sun: 1.04, skyLight: 0.98, shadow: 1, softness: 1, haze: 0.85, cloudShadow: 0, wet: 0, rain: 0, grey: 0, veil: 0.15 },
  fair: { cover: 0.35, sun: 1, skyLight: 1, shadow: 1, softness: 1, haze: 1, cloudShadow: 0.08, wet: 0, rain: 0, grey: 0, veil: 0.3 },
  cloudy: { cover: 0.62, sun: 0.82, skyLight: 1.1, shadow: 0.8, softness: 1.6, haze: 1.1, cloudShadow: 0.1, wet: 0, rain: 0, grey: 0.22, veil: 0.45 },
  overcast: { cover: 0.95, sun: 0.45, skyLight: 1.32, shadow: 0.5, softness: 2.6, haze: 1.3, cloudShadow: 0, wet: 0, rain: 0, grey: 0.88, veil: 0.8 },
  showers: { cover: 0.78, sun: 0.66, skyLight: 1.22, shadow: 0.62, softness: 2, haze: 1.2, cloudShadow: 0.06, wet: 0.7, rain: 0.6, grey: 0.45, veil: 0.55 },
  rain: { cover: 1, sun: 0.4, skyLight: 1.4, shadow: 0.45, softness: 3, haze: 1.55, cloudShadow: 0, wet: 1, rain: 1, grey: 0.95, veil: 0.85 },
  mist: { cover: 0.3, sun: 0.72, skyLight: 1.2, shadow: 0.6, softness: 2, haze: MIST_HAZE, cloudShadow: 0, wet: 0.25, rain: 0, grey: 0.3, veil: 0.4 },
};

// How much of the sky is cloud on the day (0 - 1): rolled from the round's
// seed within each sky's own range (the owner, 31 October 2026: "there
// doesn't always need to be clouds... Sometimes should be few clouds
// sometimes more") - a clear day from none at all to a few, sunny spells
// from a few to plenty, a cloudy day broken or nearly covered - the same
// for every hole of the round and, online, the host's (the seed's). With
// no seed (the practice greens, the Challenges), the sky's usual.
export const COVER_RANGE = Object.freeze({ clear: [0, 0.14], fair: [0.12, 0.58], cloudy: [0.5, 0.8], overcast: [0.92, 0.98], showers: [0.65, 0.88], rain: [1, 1], mist: [0.12, 0.45] });

export function skyCover(kind = "fair", seed = null) {
  const k = cleanSky(kind);
  if (!Number.isFinite(seed)) return LOOKS[k].cover;
  const [lo, hi] = COVER_RANGE[k];
  return lo + (hi - lo) * seeded(Math.abs(Math.round(seed)) * 104729 + 61)();
}

// Every number the picture takes from the sky (LOOKS), for a round's seed:
// its own cover (skyCover), the clouds' shadows on the ground as many as
// its clouds, its own thin high veil (a quarter to one and a half times
// the sky's usual, less the less cloud the day has, and none at all on a
// nearly cloudless one - the sky's noise shows patches of it even when
// it's thin) and its own high cirrus streaks (cirrus: a share of the
// Detailed sky's - none on about three rounds in ten, else 0.4 - 1.3).
// (The last one kept: asked for every frame.)
let lastLook = { key: null, look: null };
export function skyLook(kind = "fair", seed = null) {
  const k = cleanSky(kind);
  const look = LOOKS[k];
  if (!Number.isFinite(seed)) return look;
  const key = `${k}|${Math.round(seed)}`;
  if (lastLook.key === key) return lastLook.look;
  const cover = skyCover(k, seed);
  const r = seeded(Math.abs(Math.round(seed)) * 7907 + 13);
  const thin = Math.min(1, look.veil * (0.25 + 1.25 * r()) * Math.min(1, cover / look.cover));
  const veil = thin < 0.03 ? 0 : thin;
  const c = r();
  const cirrus = c < 0.3 ? 0 : 0.4 + (0.9 * (c - 0.3)) / 0.7;
  const cloudShadow = look.cover > 0 ? Math.min(MAX_CLOUD_SHADOW, (look.cloudShadow * cover) / look.cover) : look.cloudShadow;
  lastLook = { key, look: Object.freeze({ ...look, cover, veil, cirrus, cloudShadow }) };
  return lastLook.look;
}

// How bright flat, sunlit grass is under a sky, against a fair day's (the
// sun's share at its height and the sky's fill, both straight down), wet
// ground darkened by `wet` (look/palette.js WET): a sky may take a little
// off, never much. inShadow: under the darkest of a cloud's shadow
// (look/glsl/cloudshade.js dims the sun's share by the same rule).
export function flatGrassBrightness(kind, wetFactor = 1, { inShadow = false } = {}) {
  const sun = (l) => SUN_LIGHT * l.sun * Math.sin((SUN_ELEVATION * Math.PI) / 180);
  const light = (l) => sun(l) + SKY_LIGHT * l.skyLight;
  const l = skyLook(kind);
  const fair = light(LOOKS.fair);
  const wet = 1 - (1 - wetFactor) * l.wet;
  const shade = inShadow ? Math.min(0.95, l.cloudShadow / (sun(LOOKS.fair) / fair)) * sun(l) : 0;
  return ((light(l) - shade) * wet) / fair;
}

// How thick the haze is on a round's `hole` (0 the first) in a sky at a
// temperature: hot days hazier, cool days crisper; a misty morning's
// lifts over the first few holes, to a hazy day's by the fourth.
export function hazeFor(kind, temperatureC = 18, hole = 0) {
  const l = skyLook(kind);
  let haze = l.haze;
  if (cleanSky(kind) === "mist") haze = 1.3 + (MIST_HAZE - 1.3) * Math.max(0, 1 - Math.max(0, hole) / 3);
  const t = Number.isFinite(temperatureC) ? temperatureC : 18;
  return haze * Math.min(1.25, Math.max(0.85, 1 + (t - 18) * 0.015));
}

// How dry the ground looks (0 - 1): a hot, bright day's firm, browner
// grass; none in the wet.
export function dryFor(kind, temperatureC = 18) {
  const l = skyLook(kind);
  const heat = Math.min(1, Math.max(0, (temperatureC - 22) / 11));
  return heat * (l.cover < 0.5 ? 1 : 0.5) * (1 - l.wet);
}
