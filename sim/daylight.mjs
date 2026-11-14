// The light of the day and the year. The sun on the course: each round's
// own time of day (TIME_CHOICES, picked beside the sky), its clock moving
// on as it's played, a quarter of an hour a hole, and done by dusk
// (roundClock, holeSun); the clock's sun for the practice greens and the
// Challenges (sunAt; the "Time of day from the clock" switch, sim/
// effects.mjs). And the seasons ("Seasons": today's season), each round's
// own season and upkeep (roundSeason). Pure.

import { duskAmount, mixHex, DUSK_COLOURS, DUSK_SHARE } from "./dusk.mjs";

// A day of golf: up at `rise`, highest at `noon`, down at `set` (hours,
// clock time), `top` degrees up at noon. This one a long summer's day, for
// a round at a time of its own (morning, midday...); a round from the
// clock plays on today's (dayOn). Never lower in the picture than `least`,
// so the last of the light is low and golden rather than dark.
export const DAYLIGHT = { rise: 6, noon: 13, set: 20, top: 48, least: 9 };

// The low sun's warm colour, the high sun's near-white, and the morning's a
// touch cooler and pinker than the evening's.
const EVENING = [0xff, 0xd6, 0xa3];
const MIDDAY = [0xff, 0xf1, 0xdc];
const MORNING = [0xff, 0xe0, 0xc4];

// The sun at `hour` (a decimal: 14.5 for half past two) on `day`:
// { elevation, azimuth } in degrees and its colour as a number (0xrrggbb).
// Its height a half-sine each side of noon (as near the real sun's as the
// picture needs), its last few degrees eased onto `least`. Its bearing the
// picture's (look/environment.js: 180 straight down the hole, 90 to the
// right, 270 to the left, 0 behind): the morning's on the right, the
// afternoon's on the left, coming round to the front only as it climbs - a
// low sun is never in front, in the golfer's eyes, where its glare washes
// out the picture: under 30 degrees it's always to the side or behind
// (`turn`: a round's own few degrees round, kept to that).
export function sunAt(hour, day = DAYLIGHT, turn = 0) {
  const least = DAYLIGHT.least;
  const h = Math.min(day.set, Math.max(day.rise, Number.isFinite(hour) ? hour : day.noon));
  // 0 at sunrise, 1 at noon, 0 at sunset.
  const from = h <= day.noon ? (h - day.rise) / (day.noon - day.rise) : (day.set - h) / (day.set - day.noon);
  const raw = day.top * Math.sin((Math.max(0, from) * Math.PI) / 2);
  const elevation = raw < 2 * least ? least + (raw * raw) / (4 * least) : raw;
  // How far round from straight ahead: well behind the shoulder when low,
  // ahead and to the side once high.
  let round = 150 - 130 * smooth((elevation - 18) / 26) + (Number.isFinite(turn) ? turn : 0);
  if (elevation < 30) round = Math.max(round, 92);
  round = Math.min(175, Math.max(15, round));
  const azimuth = 180 + (h <= day.noon ? -round : round);
  const low = h <= day.noon ? MORNING : EVENING;
  const k = Math.min(1, Math.max(0, (elevation - least) / (40 - least)));
  const c = low.map((v, i) => Math.round(v + (MIDDAY[i] - v) * k));
  // At dawn and dusk (sim/dusk.mjs), deeper still: towards orange.
  const dusk = DUSK_COLOURS[h <= day.noon ? "morning" : "evening"].sun;
  const colour = mixHex((c[0] << 16) | (c[1] << 8) | c[2], dusk, duskAmount(elevation) * DUSK_SHARE.sun);
  return { elevation: Math.round(elevation * 10) / 10, azimuth: Math.round(azimuth * 10) / 10, colour };
}
const smooth = (t) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

// Where a round from the clock is played: the middle of the UK (the
// owner's), for today's sunrise and sunset.
export const PLACE = { latitude: 52.5 };

// Today's day of golf at PLACE (DAYLIGHT's numbers, for the date): sunrise
// and sunset from the sun's height in the year, in clock time - British
// Summer Time's hour ahead when the clocks have gone forward - and noon's
// height (no more than DAYLIGHT's: a midsummer midday sun flattens the
// picture). 31 October: up about 7:00, down about 16:40, 22 degrees up.
export function dayOn(date = new Date(), place = PLACE) {
  const rad = Math.PI / 180;
  const year = date.getFullYear();
  const n = Math.floor((Date.UTC(year, date.getMonth(), date.getDate()) - Date.UTC(year, 0, 1)) / 864e5) + 1;
  const decl = -23.44 * Math.cos(((2 * Math.PI) / 365) * (n + 10));
  // The sun ahead of the clock or behind it through the year (minutes).
  const b = ((2 * Math.PI) / 365) * (n - 81);
  const ahead = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
  // Summer time: the clock's offset from its winter one.
  const winter = Math.max(new Date(year, 0, 1).getTimezoneOffset(), new Date(year, 6, 1).getTimezoneOffset());
  const summer = (winter - date.getTimezoneOffset()) / 60;
  // (A little west of Greenwich, as the middle of the country is.)
  const noon = 12 + summer + 0.1 - ahead / 60;
  const lat = place.latitude * rad;
  const d = decl * rad;
  const cos = (Math.sin(-0.833 * rad) - Math.sin(lat) * Math.sin(d)) / (Math.cos(lat) * Math.cos(d));
  const half = Math.acos(Math.min(1, Math.max(-1, cos))) / rad / 15;
  const two = (v) => Math.round(v * 100) / 100;
  return { rise: two(noon - half), noon: two(noon), set: two(noon + half), top: two(Math.min(DAYLIGHT.top, 90 - place.latitude + decl)) };
}

// The hour of a Date, as sunAt takes it.
export const hourOf = (date) => date.getHours() + date.getMinutes() / 60;

// The round's clock (the owner, 31 October 2026: "The time should shift as
// the round progresses, think 15 mins a hole... if already late... work
// backwards so the that 18th/9th ends towards dusk. Obviously can't play in
// the dark."): a quarter of an hour a hole, the first tee no sooner than
// half an hour after sunrise, the last hole done a quarter of an hour
// before sunset.
export const HOLE_HOURS = 0.25;
export const FIRST_LIGHT = 0.5;
export const DUSK = 0.25;

// The times of day a round can be played at (picked beside the sky, or
// rolled: weight, how often), each its first tee on the day (`tee`: hours
// after the first light, or about noon, or done by dusk; a range, the
// round's seed picking in it):
//   morning    soon after the first light: a low sun behind the golfer
//   midday     the round about noon: the high sun
//   afternoon  after noon: the light as it always was, lower through the
//              back nine
//   late       done by dusk: the last holes low and golden
export const TIMES_OF_DAY = Object.freeze({
  morning: { weight: 0.2, tee: [0.5, 2] },
  midday: { weight: 0.25, tee: [-0.5, 0.5] },
  afternoon: { weight: 0.35, tee: [0.5, 2] },
  late: { weight: 0.2, tee: [0, 0.5] },
});
// The afternoon as it always was (the speed test's, and before a round).
export const USUAL_SUN = Object.freeze({ time: "afternoon", elevation: 38, azimuth: 215, colour: 0xfff1dc });

// The time of day to play in, picked with the sky (the owner, 31 October
// 2026: "Time of day pickable" - the course's Weather on the course, the
// range's Weather on the range): any (a surprise each round - or each
// visit, on the range), one of TIMES_OF_DAY, or the clock's (now, on
// today's day).
export const TIME_CHOICES = ["any", "morning", "midday", "afternoon", "late", "clock"];
export const TIME_CHOICE_NAMES = {
  any: "Any - a surprise each round",
  morning: "Morning",
  midday: "Midday",
  afternoon: "Afternoon",
  late: "Late afternoon",
  clock: "From the clock",
};
export const cleanTime = (t) => (TIME_CHOICES.includes(t) ? t : "any");

// The clock now, for a round from the clock: { hour, day } (kept with the
// round's weather, so online every bay plays to the host's).
export const clockNow = (date = new Date()) => ({ hour: Math.round(hourOf(date) * 100) / 100, day: dayOn(date) });

// A round's clock: { time, start, day, holes, turn } - its time of day (the
// choice, or rolled from the seed), its first tee (hours, clock time) on
// its day, its holes, and the sun's own few degrees round (sunAt turn).
// Every round starts late enough to have the light and early enough to be
// done by dusk: from the clock, now - or, if there isn't time left before
// dark, as much earlier as it takes for the last hole to finish as the
// light goes (on a winter's evening, the round played that afternoon). A
// day too short for every hole starts at first light. `at`: the clock's
// { hour, day } (clockNow; the host's, online).
export function roundClock(choice = "any", seed = 1, holes = 18, at = null) {
  let x = (Math.abs(Math.floor(Number.isFinite(seed) ? seed : 1)) * 69069 + 12345) % 2147483647 || 1;
  const r = () => (x = (x * 48271) % 2147483647) / 2147483647;
  const times = Object.entries(TIMES_OF_DAY);
  let pick = r() * times.reduce((a, [, t]) => a + t.weight, 0);
  const rolled = (times.find(([, t]) => (pick -= t.weight) < 0) ?? times[times.length - 1])[0];
  const t = cleanTime(choice);
  const time = t === "any" ? rolled : t;
  const clock = time === "clock" ? cleanClock(at) ?? clockNow() : null;
  const day = clock ? clock.day : DAYLIGHT;
  const n = Math.max(1, Math.floor(holes) || 1);
  const first = day.rise + FIRST_LIGHT;
  const last = Math.max(first, day.set - DUSK - n * HOLE_HOURS);
  const span = ([a, b]) => a + (b - a) * r();
  const tee = TIMES_OF_DAY[time]?.tee;
  const want = clock
    ? clock.hour
    : time === "morning"
    ? first + span(tee)
    : time === "midday"
    ? day.noon - (n * HOLE_HOURS) / 2 + span(tee)
    : time === "afternoon"
    ? day.noon + span(tee)
    : last - span(tee);
  const turn = Math.round(span([-12, 12]) * 10) / 10;
  const start = Math.round(Math.min(last, Math.max(first, want)) * 100) / 100;
  return { time, start, day, holes: n, turn };
}

// A clock kept with a round's weather, made sensible (or null).
export function cleanClock(c) {
  const d = c?.day;
  const ok = (v) => Number.isFinite(Number(v));
  if (!c || !ok(c.hour) || !d || !["rise", "noon", "set", "top"].every((k) => ok(d[k]))) return null;
  const rise = Math.min(12, Math.max(0, Number(d.rise)));
  const set = Math.min(24, Math.max(rise + 1, Number(d.set)));
  const noon = Math.min(set - 0.5, Math.max(rise + 0.5, Number(d.noon)));
  return { hour: Math.min(24, Math.max(0, Number(c.hour))), day: { rise, noon, set, top: Math.min(DAYLIGHT.top, Math.max(5, Number(d.top))) } };
}

// The hour hole `i` of the round (0, its first) is played at: half way
// through its quarter of an hour.
export const holeHour = (clock, i = 0) => clock.start + (Math.min(clock.holes - 1, Math.max(0, i)) + 0.5) * HOLE_HOURS;

// The sun on hole `i` of the round: { time, hour, elevation, azimuth, colour }.
export function holeSun(clock, i = 0) {
  const hour = holeHour(clock, i);
  return { time: clock.time, hour: Math.round(hour * 100) / 100, ...sunAt(hour, clock.day, clock.turn) };
}

// The sun for a time picked (TIME_CHOICES) and a seed, played as one hole:
// the range's each visit, and the first hole's of a round of one.
export const sunFor = (choice = "any", seed = 1, at = null) => holeSun(roundClock(choice, seed, 1, at), 0);

// A round's times for its card: "11:49am - 4:19pm" - its first tee, and
// the end of the last of the `holes` it got through (its clock's quarter of
// an hour a hole) - or null without a clock.
export function roundTimes(clock, holes = clock?.holes) {
  if (!clock || !Number.isFinite(clock.start)) return null;
  const n = Math.min(clock.holes ?? 18, Math.max(1, Math.floor(holes) || 1));
  return `${clockWords(clock.start)} - ${clockWords(clock.start + n * HOLE_HOURS)}`;
}

// A clock time for people: 14.75 -> "2:45pm".
export function clockWords(hour) {
  const m = Math.round((((hour % 24) + 24) % 24) * 60);
  const h = Math.floor(m / 60) % 24;
  return `${h % 12 || 12}:${String(m % 60).padStart(2, "0")}${h < 12 ? "am" : "pm"}`;
}

// The season of a Date (northern months: March to May spring, and so on).
export function seasonOf(date) {
  const m = date.getMonth();
  return m >= 2 && m <= 4 ? "spring" : m >= 5 && m <= 7 ? "summer" : m >= 8 && m <= 10 ? "autumn" : "winter";
}

// How each season changes the course:
//   grass   the grass's colour moved in HSL (hue, saturation, lightness)
//   leaves  the broadleaves' leaves moved the same way
//   turn    the share of broadleaves turned gold, copper or red
//   brown   the share holding only dead brown leaves (winter's)
// Summer is the course as it always looks.
export const SEASONS = {
  spring: { grass: [0.012, 0.06, 0.03], leaves: [0.02, 0.06, 0.05], turn: 0, brown: 0 },
  summer: { grass: [0, 0, 0], leaves: [0, 0, 0], turn: 0, brown: 0 },
  autumn: { grass: [-0.01, -0.06, -0.01], leaves: [-0.01, -0.04, 0], turn: 0.4, brown: 0.05 },
  winter: { grass: [-0.018, -0.16, -0.035], leaves: [-0.02, -0.12, -0.03], turn: 0, brown: 0.6 },
};

// Each round its own season and upkeep (the owner, 31 October 2026,
// choosing "courses with their own season and upkeep"): from the round's
// seed, spring, summer or autumn (ROUND_SEASONS: how often) - or, with the
// Seasons switch on (`today`, from the date), today's season on most rounds
// and the one either side of it on the rest (TODAY_LEAN), so a late-autumn
// round can still look like the end of summer - and how the course is
// kept, `upkeep`
// from -1 (lush: well watered, a deeper, fresher green) through 0 (as it
// always looks) to 1 (dry: the grass yellower and paler, browning off) -
// rolled within UPKEEP.spread, and drier on a links (UPKEEP.links), in
// summer, with firm fairways; lusher in spring, after rain or showers, with
// soft ones.
export const ROUND_SEASONS = Object.freeze({ spring: 0.3, summer: 0.45, autumn: 0.25 });
export const TODAY_LEAN = Object.freeze({ today: 0.6, before: 0.2, after: 0.2 });
const YEAR = ["spring", "summer", "autumn", "winter"];
export const UPKEEP = Object.freeze({
  spread: 0.6,
  links: 0.3,
  season: { spring: -0.2, summer: 0.2, autumn: 0, winter: -0.1 },
  sky: { rain: -0.45, showers: -0.3, mist: -0.1 },
  ground: { firm: 0.3, soft: -0.3 },
  // The grass's colour moved in HSL by a fully dry course (dry) and a
  // fully lush one (lush), and how much of it each part of the course
  // takes (share): the greens, tees and fringes watered (a little), the
  // fairways more, the rough all of it.
  dry: [-0.045, -0.18, 0.045],
  lush: [0.012, 0.05, -0.03],
  share: { green: 0.15, fairway: 0.6, rough: 1 },
});

export function roundSeason(seed, { links = false, sky = "fair", ground = "normal", today = null } = {}) {
  let x = (Math.abs(Math.floor(Number.isFinite(seed) ? seed : 1)) * 16807 + 97) % 2147483647 || 1;
  const r = () => (x = (x * 48271) % 2147483647) / 2147483647;
  const at = YEAR.indexOf(today);
  const names = at >= 0
    ? [[today, TODAY_LEAN.today], [YEAR[(at + 3) % 4], TODAY_LEAN.before], [YEAR[(at + 1) % 4], TODAY_LEAN.after]]
    : Object.entries(ROUND_SEASONS);
  let pick = r() * names.reduce((a, [, w]) => a + w, 0);
  const season = (names.find(([, w]) => (pick -= w) < 0) ?? names[names.length - 1])[0];
  const U = UPKEEP;
  const upkeep = (2 * r() - 1) * U.spread + (links ? U.links : 0) + U.season[season] + (U.sky[sky] ?? 0) + (U.ground[ground] ?? 0);
  return { season, upkeep: Math.round(Math.min(1, Math.max(-1, upkeep)) * 1000) / 1000 };
}

// A colour moved by a season's [hue, saturation, lightness]: hsl in, hsl
// out, each 0 - 1 (hue wrapping round).
export function seasonShift([h, s, l], [dh, ds, dl]) {
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const hue = h + dh;
  return [hue - Math.floor(hue), clamp(s + ds), clamp(l + dl)];
}
