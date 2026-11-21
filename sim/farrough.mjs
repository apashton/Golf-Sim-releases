// The far rough (look/farrough.js, drawn in look/glsl/ground.js
// gFarRough): past where the 3D long grass thins out (sim/longgrass.mjs),
// the rough and deep rough painted to read as standing grass - darker
// gaps between tufts, paler tops that show most when looked across at a
// low angle, and a sway of brightness with the same wind waves as the
// long grass - so the clumps hand over to a ground that looks as tall
// rather than to a flat carpet. Pure: where it starts and ends.

import { LONG_GRASS } from "./longgrass.mjs";
import { smoothstep } from "./mathutil.mjs";

export const FAR_ROUGH = {
  // It starts this share of the way out to the long grass's radius (where
  // the clumps are thinning), fading in over `fadeIn` of that start
  // (never under minFade metres)...
  share: 0.6,
  fadeIn: 0.5,
  minFade: 4,
  // ...or, with no long grass (Medium, or High's shed by the safety
  // valve), from just past the ball (LONG_GRASS.full).
  near: LONG_GRASS.full,
  // Gone by `end` metres, fading out over its last `fadeOut` share.
  end: 150,
  fadeOut: 0.3,
  // How strong at most (0 - 1).
  strength: 1,
};

// Where it lies on a graphics setting ("standard", "medium", "high",
// "ultra"), metres from the camera: { start, full, fadeFrom, end,
// strength }, or null where it isn't drawn (Standard, or shed).
// longGrass: whether the 3D long grass is growing (false when shed).
export function farRoughRange(level, { longGrass = true, shed = false } = {}) {
  if (shed || level === "standard" || !level) return null;
  const radius = longGrass ? LONG_GRASS.radius[level] : undefined;
  const start = radius ? radius * FAR_ROUGH.share : FAR_ROUGH.near;
  const full = start + Math.max(FAR_ROUGH.minFade, start * FAR_ROUGH.fadeIn);
  const end = FAR_ROUGH.end;
  return { start, full, fadeFrom: end * (1 - FAR_ROUGH.fadeOut), end, strength: FAR_ROUGH.strength };
}

// How much of it shows at d metres (0 - 1), as the shader works it out.
export function farRoughWeight(range, d) {
  if (!range) return 0;
  return smoothstep(range.start, range.full, d) * (1 - smoothstep(range.fadeFrom, range.end, d)) * range.strength;
}
