// The outline of a practice green: a wavy ellipse, like a real green's.
//
// Shared by the picture (greenscene.js draws the putting and chipping
// greens with it) and the chipping physics (chipping.mjs), so a chip rolls
// at the green's speed exactly where the green is drawn, and off it where
// it isn't. Pure functions, no browser needed.

// Small seeded random (the same generator as look/trees.js, so a green's
// shape is exactly what it always was).
function seeded(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// An ellipse of half-widths rx (across) and rz (along), with a few gentle
// lobes. Returns the distance from the centre to the edge at angle a
// (radians, measured in the drawing's x/z plane).
export function greenOutline(rx, rz, seed) {
  const rand = seeded(seed);
  const lobes = 2 + Math.floor(rand() * 2);
  const phase = rand() * 6;
  const depth = 0.06 + rand() * 0.08;
  return (a) => {
    const ellipse = (rx * rz) / Math.hypot(rz * Math.cos(a), rx * Math.sin(a));
    return ellipse * (1 + Math.sin(a * lobes + phase) * depth + Math.sin(a * 5 + phase) * 0.03);
  };
}

// The collar of fringe drawn round a green, metres beyond its edge.
export const FRINGE_WIDTH = 1.6;
