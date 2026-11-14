// The water's ripples as a normal map (look/sandwater.js ripples): many
// waves of many sizes and headings, the small ones weaker, so the surface
// doesn't read as a grid of bumps (whole numbers of waves across the tile
// keep it seamless). RGBA bytes, `size` square: the surface's normal, x in
// red and z in green (128 flat), up in blue. Pure, so how steep it ever
// gets (rippleMost) is known outside the browser too: what a pond's
// reflection can be bent by (sim/mirrorreach.mjs rippleBend).

import { seeded } from "./course.mjs";

export const RIPPLE_SIZE = 256;

export function rippleMap(size = RIPPLE_SIZE) {
  const data = new Uint8ClampedArray(size * size * 4);
  const rand = seeded(17);
  const waves = [];
  while (waves.length < 18) {
    const kx = Math.round((rand() - 0.5) * 36);
    const ky = Math.round((rand() - 0.5) * 36);
    const k = Math.hypot(kx, ky);
    if (k < 3) continue;
    waves.push({ kx, ky, phase: rand() * 6.28, amp: (4 + rand() * 4) / k });
  }
  const h = (x, y) => waves.reduce((a, w) => a + w.amp * Math.sin(((w.kx * x + w.ky * y) / size) * 6.2832 + w.phase), 0);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = h(x + 1, y) - h(x - 1, y);
      const dy = h(x, y + 1) - h(x, y - 1);
      const n = Math.hypot(dx * 0.4, dy * 0.4, 1);
      const i = (y * size + x) * 4;
      data[i] = ((-dx * 0.4) / n) * 127 + 128;
      data[i + 1] = ((-dy * 0.4) / n) * 127 + 128;
      data[i + 2] = (1 / n) * 127 + 128;
      data[i + 3] = 255;
    }
  }
  return data;
}

// The steepest the map's normals lean, as the water's shader reads them
// (red and green, each byte / 255 * 2 - 1): the length of that, at most.
let most = null;
export function rippleMost() {
  if (most != null) return most;
  const data = rippleMap();
  most = 0;
  for (let i = 0; i < data.length; i += 4) most = Math.max(most, Math.hypot((data[i] / 255) * 2 - 1, (data[i + 1] / 255) * 2 - 1));
  return most;
}
