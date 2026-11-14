// How far what grows moves in the wind (look/glsl/bend.js does it on the
// graphics card; these are its numbers, and the same sums in plain
// JavaScript for the tests). For the look only: a ball meets a tree as it
// stands (sim/treehits.mjs knows nothing of this), and the shadow map
// keeps the trees still.
//
// A tree leans downwind and sways about that lean; its tip moves at most
// SWAY_MAX of the tree's height, in the strongest gust. The trunk bends
// more the higher up it is (as the square of the height), so its foot
// stays put. A gust rolls downwind along a tree line at the wind's own
// speed: its timing depends on where each tree stands. In still air (the
// practice greens, the Challenges) nothing moves.
//
// Long grass, reeds, heather, flowers and the rest of the rough's plants
// bend the same way, by how tall they are (PLANT_BEND a metre, as the
// square of the height), so a reed swings further than a sprig of heather.
// Pure.

// The most a tree's tip moves, as a share of its height.
export const SWAY_MAX = 0.02;
// The wind (mph, gusts and all) at which it's that much.
export const SWAY_FULL_MPH = 28;
// Of the movement, how much is a steady lean downwind (the rest swings
// either side of it): at the top of a swing the lean and the swing add up
// to the whole, at the bottom the tree stands nearly straight.
export const SWAY_LEAN = 0.55;
// The model height the sums measure against: a tree of scale 1 is drawn
// about 10 m tall (sim/treeshapes.mjs), so a tree's height share is its
// height over 10 m of its scale.
export const TREE_REF = 10;
// A plant's bend: metres of movement for a metre of height, squared, in
// the strongest wind.
export const PLANT_BEND = 0.1;
// How fast the gust waves roll along (metres of wavelength each way).
export const GUST_WAVE = 160;

// How strongly things bend now, 0 - 1: the wind this moment (mph, gusts
// and all) - nothing in still air.
export function swayStrength(mph, still = false) {
  if (still || !(mph > 0)) return 0;
  return Math.min(1, mph / SWAY_FULL_MPH);
}

// The local gust over a spot `along` metres downwind (0.7 - 1), rolling
// downwind at `speed` m/s: what the shader's bendWave takes.
export function gustAt(along, time, speed) {
  const k = (2 * Math.PI) / GUST_WAVE;
  return 0.85 + 0.15 * Math.sin(along * k - time * k * speed);
}

// How far a point `y` metres up a tree of scale `scale` is pushed
// downwind (metres): strength (swayStrength), the local gust (gustAt) and
// the swing (-1 - 1, a sine). As the shader does it.
export function swayPush(strength, gust, swing, y, scale) {
  const H = TREE_REF * scale;
  const t = Math.min(1, Math.max(0, y / H));
  return strength * gust * (SWAY_LEAN + (1 - SWAY_LEAN) * swing) * SWAY_MAX * H * t * t;
}

// A plant's push `y` metres up (metres).
export function plantPush(strength, gust, swing, y) {
  return strength * gust * (SWAY_LEAN + (1 - SWAY_LEAN) * swing) * PLANT_BEND * Math.max(0, y) ** 2;
}
