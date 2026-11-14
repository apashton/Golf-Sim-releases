// Small number helpers shared by the pure modules in public/sim: clamping a
// value into a range and the smooth 0..1 ease (smoothstep) used for blending
// edges. Pure; no browser or Node dependencies.

/** v limited to [lo, hi]. */
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Hermite ease of t already in 0..1 (clamped): 0 at 0, 1 at 1, flat at both ends. */
export const smoothstep01 = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/** 0 at or below a, 1 at or above b, a smooth (Hermite) ease between. */
export const smoothstep = (a, b, v) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** A seeded stream of numbers in [0, 1) (mulberry32): the same seed, the same
 *  numbers, everywhere - the courses are made from it, so it never changes. */
export function mulberry32(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
