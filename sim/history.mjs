// The frames before, read sharply (the highest setting's picture is this
// frame blended with those before: look/effects.js TAA). While the camera
// moves - a ball followed up, a flyover, a walk to the ball - each pixel's
// history lies between last frame's pixels, and reading it the plain way
// (the four round it, mixed) blurs it a little more every frame: a moving
// picture went soft, and sharpened only once it stopped. Read with a
// Catmull-Rom curve over the sixteen round it instead - the standard cure -
// what was sharp stays sharp as it moves: the curve's small negative
// weights take back what the mixing spread. Still, the history is read at a
// pixel's own middle, where the curve is that pixel alone: nothing changes.
//
// Five reads stand in for sixteen: the graphics card's own mixing of two
// pixels makes the middle two of each four one read (at their weights'
// balance point), and the four corner reads - the faintest - are left out,
// the rest scaled to sum to one. The same sums here, in plain JS, as the
// shader's (look/glsl/history.js; look/glsl/effectsnode.js on
// WebGPURenderer), for the tests. Pure.

// The curve's four weights for a spot `f` of the way (0 - 1) from one
// pixel's middle to the next: the pixel before, the two it lies between,
// the one after.
export function curveWeights(f) {
  return [f * (-0.5 + f * (1 - 0.5 * f)), 1 + f * f * (-2.5 + 1.5 * f), f * (0.5 + f * (2 - 1.5 * f)), f * f * (-0.5 + 0.5 * f)];
}

// The five reads for a spot (fx, fy) of the way from a pixel's middle to
// the next each way: [{ x, y, w }], x and y in pixels from that first
// pixel's middle, w summing to one.
export function historyTaps(fx, fy) {
  const [x0, x1, x2, x3] = curveWeights(fx);
  const [y0, y1, y2, y3] = curveWeights(fy);
  const x12 = x1 + x2;
  const y12 = y1 + y2;
  const mx = x2 / x12;
  const my = y2 / y12;
  const taps = [
    { x: mx, y: my, w: x12 * y12 },
    { x: -1, y: my, w: x0 * y12 },
    { x: 2, y: my, w: x3 * y12 },
    { x: mx, y: -1, w: x12 * y0 },
    { x: mx, y: 2, w: x12 * y3 },
  ];
  const sum = taps.reduce((a, t) => a + t.w, 0);
  return taps.map((t) => ({ ...t, w: t.w / sum }));
}

// A picture (rows of numbers) read at (x, y) pixels - a pixel's middle at
// whole numbers - the plain way, as the graphics card mixes the four round
// it (the edge's pixels held past it).
export function readMixed(pic, x, y) {
  const at = (i, j) => pic[Math.max(0, Math.min(pic.length - 1, j))][Math.max(0, Math.min(pic[0].length - 1, i))];
  const i = Math.floor(x);
  const j = Math.floor(y);
  const fx = x - i;
  const fy = y - j;
  return (at(i, j) * (1 - fx) + at(i + 1, j) * fx) * (1 - fy) + (at(i, j + 1) * (1 - fx) + at(i + 1, j + 1) * fx) * fy;
}

// And with the curve: its five reads, each mixed by the card.
export function readSharp(pic, x, y) {
  const i = Math.floor(x);
  const j = Math.floor(y);
  return Math.max(0, historyTaps(x - i, y - j).reduce((a, t) => a + t.w * readMixed(pic, i + t.x, j + t.y), 0));
}
