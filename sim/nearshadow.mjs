// Where High's near shadow map lies (look/nearshadow.js): a sharp map
// NEAR.span metres across, round the ground just ahead of the camera, laid
// over the wide map that covers the whole scene (look/environment.js
// fitShadows) and fading into it towards its edges, so there's never a
// line where shadows sharpen. It moves only when the camera has gone on
// further than NEAR.move from where it lies (each move redraws it), and
// not while a ball flies (the chase camera would move it every frame;
// the wide map covers the flight). Pure.

export const NEAR = {
  // The map: pixels a side, metres across, and how deep along the sun.
  size: 2048,
  span: 90,
  depth: 500,
  // How far ahead of the camera its middle is, on the level.
  ahead: 22,
  // How far the camera's spot goes before it moves.
  move: 14,
  // Over what share of its half-width it fades into the wide map.
  fade: 0.3,
};

// Ultra's (the owner: "a significant leap up from high"): twice the pixels
// over nearly twice the ground, centred further on, so sharp shadows reach
// on down the hole - a little finer than High's near the camera too.
export const NEAR_ULTRA = { ...NEAR, size: 4096, span: 160, ahead: 45, move: 20 };

// Shadows that soften the further above what casts them (look/nearshadow.js
// a2SoftShadow): sharp at a trunk's foot, soft from a crown high above. Each
// setting's taps of the map: `search` pairs to find how high the shade is,
// `filter` to blur it by that. Ultra's twelve keep it grain-free; High
// (from 13 October 2026, in place of three.js's plain five-tap blur, its
// soft kind gone from three.js) a cheaper eight. None below High.
export const SOFT_TAPS = {
  high: { search: 3, filter: 8 },
  ultra: { search: 6, filter: 12 },
};
// The phone (the graphics audit, 1 November 2026): Ultra's soft shadows
// with High's taps. Its picture is a thousand-odd pixels across on a
// six-inch screen, its shadow maps half the size each way, so a penumbra
// is a pixel or two there - and Ultra's smoothing over time (TAA) takes
// out the little grain fewer taps leave. Every lit pixel took 24 taps of
// each map; 14 now.
export function softTaps(level, phone = false) {
  if (phone && level === "ultra") return SOFT_TAPS.high;
  return SOFT_TAPS[level] || null;
}

// The spot the near map wants: on the level, NEAR.ahead in front of a camera
// at `pos` looking along `dir` ([x, y, z] each); straight down, just under
// it.
export function nearFocus(pos, dir, ahead = NEAR.ahead) {
  const flat = Math.hypot(dir[0], dir[2]);
  if (flat < 1e-6) return [pos[0], pos[2]];
  return [pos[0] + (dir[0] / flat) * ahead, pos[2] + (dir[2] / flat) * ahead];
}

// Where it should lie now: `focus` [x, z], or null to stay where it is
// (`at`: where it lies, or null for nowhere yet) - moving only once the
// focus has gone NEAR.move from it, so it's redrawn now and then, not
// every frame.
export function nearCentre(focus, at, move = NEAR.move) {
  if (!at) return [focus[0], focus[1]];
  return Math.hypot(focus[0] - at[0], focus[1] - at[1]) > move ? [focus[0], focus[1]] : null;
}

// How much the near map counts at a spot: u, v its place across the map
// (0 - 1 each way): all of it in the middle, fading to none at its edges.
export function nearWeight(u, v, fade = NEAR.fade) {
  const edge = Math.min(u, 1 - u, v, 1 - v);
  if (edge <= 0) return 0;
  const t = Math.min(1, edge / (fade * 0.5));
  return t * t * (3 - 2 * t);
}
