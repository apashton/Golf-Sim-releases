// Dawn and dusk (the owner, 31 October 2026: "we need to change from blue
// as evening sets in or morning rises"). As the sun gets low the sky stops
// being a plain blue: the horizon on the sun's side warms - gold and orange
// in the evening, a paler peach-pink in the morning - with a dusky band of
// pink and mauve on the far side, the sky overhead a touch deeper; round
// the sun itself, a warm glow. The haze warms with it, the clouds' sunlit
// tops turn peach and their bases mauve-grey, and the sunlight itself
// deepens towards orange. A grey sky takes less of it. Pure: the amounts
// and colours look/environment.js puts on the sky, haze and clouds, and
// sim/daylight.mjs sunAt on the light.

// How much of it at a sun `elevation` degrees up (the picture's: never
// under 9, the last of the light): none from DUSK.from up, all of it at
// DUSK.full and under, coming in slowly (to DUSK.power) - so the colours
// gather over the last hour or so of the day and are strongest as it ends,
// and fade as the morning's sun climbs.
export const DUSK = Object.freeze({ from: 22, full: 9.5, power: 1.5 });

export function duskAmount(elevation) {
  if (!Number.isFinite(elevation)) return 0;
  const t = Math.min(1, Math.max(0, (DUSK.from - elevation) / (DUSK.from - DUSK.full)));
  return Math.pow(t * t * (3 - 2 * t), DUSK.power);
}

// The colours (sRGB hex), the evening's and the morning's:
//   glow    the horizon on the sun's side, and round the sun
//   mid     higher up on the sun's side, into the blue (a pale gold: the
//           sky there goes orange, gold, pale, blue - not through grey)
//   far     the horizon on the far side (the band of pink and mauve)
//   haze    the haze, the hills and far trees fading into it
//   top     the clouds' sunlit tops
//   base    the clouds' shaded bases
//   sun     the sunlight at its lowest
//   fill    the sky's light in the shade
// with how much of each it takes at its fullest (DUSK_SHARE): the band
// low in the sky, the glow round the sun, the sky overhead deeper, the
// haze, the clouds, the sunlight's colour, the sunlight and the sky's
// light weaker (dimSun, dimSky), and the sky's light's colour.
export const DUSK_COLOURS = Object.freeze({
  evening: { glow: 0xff9448, mid: 0xffd088, far: 0xc4a0c0, haze: 0xe9c4a0, top: 0xffc48e, base: 0x9d90a8, sun: 0xffbc80, fill: 0xf0dccf },
  morning: { glow: 0xffaa88, mid: 0xffd4bc, far: 0xa8acd2, haze: 0xdfcacb, top: 0xffcfc0, base: 0xa6a2bd, sun: 0xffc6a6, fill: 0xe4dde9 },
});
export const DUSK_SHARE = Object.freeze({ band: 0.85, glow: 0.6, deepen: 0.18, haze: 0.7, clouds: 0.85, sun: 0.65, dimSun: 0.25, dimSky: 0.2, fill: 0.5 });

// Which side of noon a sun is (sim/daylight.mjs sunAt: the morning's on the
// right, under 180 degrees; the afternoon's on the left).
export const isMorning = (azimuth) => Number.isFinite(azimuth) && azimuth < 180;

// The dusk for a sun ({ elevation, azimuth }) under a sky `grey` (0 - 1,
// sim/weather.mjs skyLook's): { k, morning, colours } - k its amount (less
// under a grey sky: an overcast evening only darkens).
export function duskFor({ elevation, azimuth } = {}, grey = 0) {
  const g = Math.min(1, Math.max(0, Number.isFinite(grey) ? grey : 0));
  const morning = isMorning(azimuth);
  return { k: duskAmount(elevation) * (1 - 0.75 * g), morning, colours: morning ? DUSK_COLOURS.morning : DUSK_COLOURS.evening };
}

// sRGB hex to linear light [r, g, b], and the same scaled to a luminance of
// 1 (a tint the sky takes at its own brightness).
const lin = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
export const linear = (hex) => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255].map((v) => lin(v / 255));
export function tint(hex) {
  const [r, g, b] = linear(hex);
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return [r / l, g / l, b / l];
}

// A colour (hex) drawn towards another by t (0 - 1), in sRGB: for the
// light's, the haze's and the clouds' colours.
export function mixHex(a, b, t) {
  const k = Math.min(1, Math.max(0, t));
  const ch = (s) => Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * k);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}
