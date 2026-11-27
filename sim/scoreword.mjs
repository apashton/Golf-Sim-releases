// A hole's score in 3D letters, in place of a box (the owner: "Take
// birdie, albatross, hole in one, put them in 3D letters zooming in.
// Bigger and bolder for eagle, biggest and boldest for hole in one and
// albatross and condor. Doesn't need the text 3 on a par 4 etc." - and
// then: "Par should still be happy but the tamest of the celebrations.
// Bogey etc can get progressively worse, along with the progressive
// dullness to grey/black maxing out at +3 and more.").
//
// BIRDIE!, then EAGLE! bigger and bolder, then ALBATROSS!, CONDOR! and
// HOLE IN ONE! the biggest and boldest: solid letters with a side to them,
// each flying in out of the distance one after another - small and tipped
// back, then up, overshooting and settling - and the top ones giving a
// last punch once they're all in. PAR comes in the same way, smaller and
// with only a little bounce, still bright. Then each score over par is a
// little smaller, flatter and duller than the one before: BOGEY pale grey,
// sliding in with no bounce; DOUBLE BOGEY grey, dropped in with a thud and
// sagging; TRIPLE BOGEY and anything worse near black, falling in heavily
// and slumping. The page draws them (celebrate.js) and so does the
// recording (compositor.js), from the same numbers. Pure.

// Each kind of word, best to worst:
//  size      its height against the banner's ordinary title (1 a birdie's)
//  weight    the letters' boldness (font weight)
//  depth     how many layers make the letters' side - how deep they are
//  face      the front's colours, top to bottom
//  side      the side's colours, from the front to the back
//  glow      a glow round the letters, or none
//  glint     a glint running across the face (the gold ones)
//  rim       a faint light edge, so the darkest letters still read on a
//            darkened picture, or none
//  entry     how each letter arrives: "zoom" out of the distance, or
//            "drop" from above (rise: from how high, in letters' heights)
//  overshoot how far a zooming letter overshoots before it settles
//  stagger   seconds between one letter arriving and the next
//  zoom      seconds each letter takes to arrive
//  punch     how hard the whole word pulses once every letter is in
//  sag       once every letter is in, how far they lean (roll, degrees)
//            and sink (in letters' heights), over `time` seconds - or none
export const STYLES = {
  top: {
    size: 1.65, weight: 900, depth: 14, face: ["#ffffff", "#ffe887", "#ffb81c"], side: ["#e2620a", "#4a1500"],
    glow: "rgba(255, 186, 40, 0.85)", glint: true, rim: null, entry: "zoom", overshoot: 1.8, stagger: 0.07, zoom: 0.46, punch: 0.09, sag: null,
  },
  eagle: {
    size: 1.3, weight: 900, depth: 10, face: ["#fff7c8", "#ffd84a", "#f2a900"], side: ["#c27f00", "#4c2e00"],
    glow: "rgba(255, 200, 40, 0.55)", glint: true, rim: null, entry: "zoom", overshoot: 1.8, stagger: 0.06, zoom: 0.42, punch: 0.05, sag: null,
  },
  birdie: {
    size: 1, weight: 800, depth: 7, face: ["#ffffff", "#fff0e2", "#ffd3b4"], side: ["#f04a5c", "#7c0f1e"],
    glow: null, glint: false, rim: null, entry: "zoom", overshoot: 1.8, stagger: 0.05, zoom: 0.38, punch: 0, sag: null,
  },
  par: {
    size: 0.85, weight: 800, depth: 6, face: ["#ffffff", "#eaf5ff", "#c4e2ff"], side: ["#3d8fdf", "#123b6c"],
    glow: null, glint: false, rim: null, entry: "zoom", overshoot: 1, stagger: 0.05, zoom: 0.36, punch: 0, sag: null,
  },
  bogey: {
    size: 0.78, weight: 700, depth: 5, face: ["#eceff2", "#d0d6dc", "#b2bac3"], side: ["#6e7a87", "#2d343c"],
    glow: null, glint: false, rim: null, entry: "zoom", overshoot: 0, stagger: 0.05, zoom: 0.44, punch: 0, sag: null,
  },
  double: {
    size: 0.74, weight: 700, depth: 4, face: ["#c4c4c4", "#a9a9a9", "#8c8c8c"], side: ["#4a4a4a", "#1b1b1b"],
    glow: null, glint: false, rim: null, entry: "drop", rise: 1.1, overshoot: 0, stagger: 0.045, zoom: 0.34, punch: 0,
    sag: { roll: 3, sink: 0.04, time: 0.6 },
  },
  worse: {
    size: 0.7, weight: 700, depth: 4, face: ["#5a5a5a", "#3b3b3b", "#222222"], side: ["#151515", "#000000"],
    glow: null, glint: false, rim: "rgba(215, 215, 215, 0.5)", entry: "drop", rise: 1.5, overshoot: 0, stagger: 0.04, zoom: 0.3, punch: 0,
    sag: { roll: 7, sink: 0.1, time: 0.8 },
  },
};

// The kind of word for each tier of a hole's score (sim/celebration.mjs):
// a triple bogey is as dull as it gets, and anything worse looks the same.
const KIND = { ace: "top", albatross: "top", eagle: "eagle", birdie: "birdie", par: "par", bogey: "bogey", double: "double", worse: "worse" };

// How deep each layer of the side is, as shares of the letters' height:
// down and a little to the right, as if lit from above and to the left.
const LAYER = { dx: 0.0055, dy: 0.011 };

// The word for a finished hole's celebration (sim/celebration.mjs
// celebrationFor), or null for the round's and the games' own banners,
// which keep their box. { text, kind (a STYLES key), ...its STYLES }.
export function scoreWord(desc) {
  if (!desc || desc.round || !desc.title) return null;
  const kind = KIND[desc.tier];
  if (!kind) return null;
  return { text: String(desc.title).toUpperCase(), kind, ...STYLES[kind] };
}

const clamp01 = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : v);
const easeOut = (u) => 1 - (1 - u) ** 3;
// Overshoots by s and settles (no overshoot at all with s 0).
const easeOutBack = (u, s) => (u >= 1 ? 1 : 1 + (s + 1) * (u - 1) ** 3 + s * (u - 1) ** 2);
// Which way and how far each letter leans as a word sags: no two alike,
// so the word looks to have given up rather than tipped over.
const SAG = [-1, 0.55, -0.35, 0.85, -0.6, 0.3, -0.9, 0.7];

// Seconds until the whole word is in.
export const landed = (word) => (Math.max(1, [...word.text].length) - 1) * word.stagger + word.zoom;

// Letter i of the word, `t` seconds after it began: { scale, tilt (degrees
// tipped back from upright), down (how far below its place, in shares of
// the letters' height - above it while less than 0), roll (degrees leaned
// over, clockwise), alpha }. Before its turn it's unseen; then it zooms in
// out of the distance (overshooting by the word's own amount and settling)
// or drops in from above, quicker as it falls; once every letter is in,
// the top words give a punch and the worst sag where they landed.
export function letterAt(word, i, t) {
  const u = clamp01((t - i * word.stagger) / word.zoom);
  const alpha = clamp01(u * 3.5);
  let scale = 1;
  let tilt = 0;
  let down;
  if (word.entry === "drop") {
    down = -(word.rise ?? 1) * (1 - u * u);
  } else {
    scale = 0.06 + 0.94 * easeOutBack(u, word.overshoot ?? 1.8);
    tilt = 72 * (1 - easeOut(u));
    down = -0.55 * (1 - easeOut(u));
  }
  const after = t - landed(word);
  const punch = word.punch > 0 && after > 0 ? 1 + word.punch * Math.sin(Math.min(1, after / 0.32) * Math.PI) : 1;
  let roll = 0;
  if (word.sag && after > 0) {
    const k = easeOut(clamp01(after / word.sag.time));
    const lean = SAG[i % SAG.length];
    roll = word.sag.roll * lean * k;
    down += word.sag.sink * (0.4 + 0.6 * Math.abs(lean)) * k;
  }
  return { scale: scale * punch, tilt, down, roll, alpha };
}

// The side's layers, front to back: each one's offset (in shares of the
// letters' height) and colour.
export function depthLayers(word) {
  const out = [];
  const [a, b] = word.side;
  for (let k = 1; k <= word.depth; k++) {
    out.push({ dx: LAYER.dx * k, dy: LAYER.dy * k, colour: mix(a, b, word.depth > 1 ? (k - 1) / (word.depth - 1) : 0) });
  }
  return out;
}

// How far the darkest letters' rim spreads, in letters' heights.
export const RIM_EM = 0.12;

// The side as CSS text-shadows (em), with a soft shadow under it all, the
// glow round the gold words and the rim round the darkest.
export function depthShadow(word) {
  const layers = depthLayers(word).map((l) => `${l.dx.toFixed(4)}em ${l.dy.toFixed(4)}em 0 ${l.colour}`);
  const last = depthLayers(word).at(-1) ?? { dx: 0, dy: 0 };
  layers.push(`${(last.dx + 0.02).toFixed(4)}em ${(last.dy + 0.05).toFixed(4)}em 0.12em rgba(0, 0, 0, 0.55)`);
  if (word.glow) layers.push(`0 0 0.45em ${word.glow}`);
  if (word.rim) layers.push(`0 0 ${RIM_EM}em ${word.rim}`);
  return layers.join(", ");
}

// The word's size so it fits across `width` (px), at most its own `em`
// (px): its letters about `perChar` em wide each.
export function wordFit(word, width, em, perChar = 0.72) {
  const n = Math.max(1, [...word.text].length);
  return Math.max(0, Math.min(em * word.size, (width * 0.92) / (n * perChar)));
}

// Two "#rrggbb" colours mixed, k of the way from a to b.
export function mix(a, b, k) {
  const p = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * clamp01(k)).toString(16).padStart(2, "0")).join("")}`;
}
