// A recording made to go round on a loop without a seam (audio/cart.js's
// loops): its last LOOP_JOIN seconds blended into its start, and the loop
// played up to where that last stretch begins - so where the loop goes back
// to its start, the sound carries on from where it was, never a click. A
// loop made for it (the game's own: built round a circle, its first
// LOOP_JOIN seconds repeated on the end) blends the same sound into itself;
// any other recording, two stretches of it, at an even level. Either way
// it covers the few samples a decoder gets wrong at a file's very start
// and end (Opus's, or Vorbis's near-silence on the end).

import { clamp } from "./mathutil.mjs";

export const LOOP_JOIN = 0.05;

// Blends `channels` (Float32Arrays of a recording at `rate`, changed in
// place) and gives the loop's length in samples (all of it, if it's too
// short to blend).
export function joinLoop(channels, rate, seconds = LOOP_JOIN) {
  const n = channels[0]?.length ?? 0;
  const x = Math.round(seconds * rate);
  if (!(x > 1) || n < 4 * x) return n;
  const end = n - x;
  // How alike the start and the last stretch are: 1, the same sound (a
  // loop with its start repeated on the end); 0, unrelated. Their blend's
  // level kept even for either.
  let ab = 0;
  let aa = 0;
  let bb = 0;
  for (const d of channels) {
    for (let i = 0; i < x; i++) {
      ab += d[i] * d[end + i];
      aa += d[i] * d[i];
      bb += d[end + i] * d[end + i];
    }
  }
  const alike = aa > 0 && bb > 0 ? clamp(ab / Math.sqrt(aa * bb), 0, 1) : 0;
  for (const d of channels) {
    for (let i = 0; i < x; i++) {
      const a = i / x;
      const b = 1 - a;
      d[i] = (d[i] * a + d[end + i] * b) / Math.sqrt(a * a + b * b + 2 * alike * a * b);
    }
  }
  return end;
}
