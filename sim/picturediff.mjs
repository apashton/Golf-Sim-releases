// How far apart two pictures are, in numbers: the same view drawn by WebGL
// and by WebGPURenderer (tools/picturecompare.mjs), so each piece of the
// WebGPU port is checked against today's picture before it's merged - by a
// number, not by eye (docs/BACKLOG-GRAPHICS.md, "Finishing the WebGPU port").
//
// A picture: { width, height, data } - data its pixels' red, green, blue and
// alpha, a byte each, row by row from the top (as a canvas's ImageData).
// Alpha is left out: the game's picture is opaque. A pixel's difference is
// the largest of its three colours' differences, in levels of 0 - 255.

// The square the worst patch is found in, in pixels.
export const TILE = 32;

// What counts as the same picture once a piece is ported: on average under
// a level apart, and almost nothing a visible step (16 levels) apart. A
// starting point, to be settled on the first pieces ported (Step 5).
export const PORT_MATCH = Object.freeze({ mean: 1, over16: 0.005 });

const pixelDiff = (a, b, i) => Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2]));

// The numbers: mean (the average pixel's difference), over3 and over16 (the
// share of pixels more than 3 - just visible side by side - and 16 levels
// apart), max, psnr (in decibels, Infinity when the same), and the worst
// tile (where they differ most: { x, y, width, height, mean }).
export function pictureDiff(a, b, { tile = TILE } = {}) {
  if (!a || !b || a.width !== b.width || a.height !== b.height) throw new Error("pictures of different sizes");
  const { width, height } = a;
  const n = width * height;
  if (!n) throw new Error("an empty picture");
  const A = a.data;
  const B = b.data;
  if (A.length < n * 4 || B.length < n * 4) throw new Error("too few pixels");
  const across = Math.ceil(width / tile);
  const down = Math.ceil(height / tile);
  const tiles = new Float64Array(across * down);
  let sum = 0;
  let squares = 0;
  let over3 = 0;
  let over16 = 0;
  let max = 0;
  for (let y = 0; y < height; y++) {
    const row = Math.floor(y / tile) * across;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const d = pixelDiff(A, B, i);
      sum += d;
      for (let c = 0; c < 3; c++) {
        const e = A[i + c] - B[i + c];
        squares += e * e;
      }
      if (d > 3) over3++;
      if (d > 16) over16++;
      if (d > max) max = d;
      tiles[row + Math.floor(x / tile)] += d;
    }
  }
  let worst = 0;
  let worstMean = -1;
  for (let t = 0; t < tiles.length; t++) {
    const tx = (t % across) * tile;
    const ty = Math.floor(t / across) * tile;
    const area = Math.min(tile, width - tx) * Math.min(tile, height - ty);
    const mean = tiles[t] / area;
    if (mean > worstMean) {
      worstMean = mean;
      worst = t;
    }
  }
  const wx = (worst % across) * tile;
  const wy = Math.floor(worst / across) * tile;
  const mse = squares / (n * 3);
  return {
    width,
    height,
    mean: sum / n,
    over3: over3 / n,
    over16: over16 / n,
    max,
    psnr: mse === 0 ? Infinity : 10 * Math.log10((255 * 255) / mse),
    worst: { x: wx, y: wy, width: Math.min(tile, width - wx), height: Math.min(tile, height - wy), mean: worstMean },
  };
}

// Whether the numbers say the same picture (PORT_MATCH, or as given).
export function samePicture(stats, limits = PORT_MATCH) {
  return !!stats && stats.mean <= limits.mean && stats.over16 <= limits.over16;
}

// A picture of where they differ: the first picture faint and grey, and red
// over it where the second differs - brighter the further apart (`gain`
// times the difference).
export function diffPicture(a, b, { gain = 4 } = {}) {
  const { width, height } = a;
  const out = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < out.length; i += 4) {
    const grey = (a.data[i] * 0.3 + a.data[i + 1] * 0.59 + a.data[i + 2] * 0.11) * 0.35;
    const d = Math.min(255, pixelDiff(a.data, b.data, i) * gain);
    out[i] = Math.max(grey, d);
    out[i + 1] = grey * (1 - d / 255);
    out[i + 2] = grey * (1 - d / 255);
    out[i + 3] = 255;
  }
  return { width, height, data: out };
}

// Two pictures side by side (a's left), the same height.
export function sideBySide(a, b) {
  if (a.height !== b.height) throw new Error("pictures of different heights");
  const width = a.width + b.width;
  const data = new Uint8ClampedArray(width * a.height * 4);
  for (let y = 0; y < a.height; y++) {
    data.set(a.data.subarray(y * a.width * 4, (y + 1) * a.width * 4), y * width * 4);
    data.set(b.data.subarray(y * b.width * 4, (y + 1) * b.width * 4), (y * width + a.width) * 4);
  }
  return { width, height: a.height, data };
}

const pct = (v) => `${(v * 100).toFixed(v < 0.1 ? 2 : 1)}%`;

// One line for the tool's table: "mean 4.2, 31.0% over 3, 12.5% over 16,
// max 201, worst at 448,256 (37.1)".
export function diffLine(stats) {
  const w = stats.worst;
  return `mean ${stats.mean.toFixed(2)}, ${pct(stats.over3)} over 3, ${pct(stats.over16)} over 16, max ${stats.max}, worst at ${w.x},${w.y} (${w.mean.toFixed(1)})`;
}
