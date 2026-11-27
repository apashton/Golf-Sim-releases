// A background box's own settings as a container (sim/container.mjs lays
// out its group in it): how, the gap between and the padding round them
// (1080p pixels), and for a grid how many across. No imports, so the
// layout's cleaning (sim/videolayout.mjs) can use it. Pure.

export const FILL_HOW = ["down", "across", "grid"];
export const FILL_HOW_NAMES = { down: "Down it", across: "Across it", grid: "A grid" };
// The gap and padding a container starts with, and the most either can be
// (1080p pixels).
export const FILL_START = { gap: 10, pad: 10, cols: 2 };
export const FILL_MAX = 200;

const num = (v, lo, hi, d) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};

// A container's settings made sensible, or null for none.
export function cleanFill(f) {
  if (!f || typeof f !== "object" || !FILL_HOW.includes(f.how)) return null;
  return { how: f.how, gap: Math.round(num(f.gap, 0, FILL_MAX, FILL_START.gap)), pad: Math.round(num(f.pad, 0, FILL_MAX, FILL_START.pad)), cols: Math.round(num(f.cols, 1, 8, FILL_START.cols)) };
}
