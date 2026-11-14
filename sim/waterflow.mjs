// Which way running water runs (look/sandwater.js waterMaterial run, its
// ripples carried downstream: sim/mirrorreach.mjs WATER_RUN) - a links
// burn's or a brook's: along its length (the long axis of its outline or
// line, in the hole's frame), towards its lower end by `heightAt` (a
// brook's water falls along it; a burn lies level, its ground beside it
// says which way the land runs), as found if the two ends are level.
// Returns { dir: [x, z] (the world's: hole (x, z) -> (z, -x)), speed }.
// Pure.

import { WATER_RUN } from "./mirrorreach.mjs";

export function runOf(points, { heightAt = null, speed = WATER_RUN.speed } = {}) {
  const pts = (points ?? []).filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (pts.length < 2) return null;
  const n = pts.length;
  const cx = pts.reduce((a, p) => a + p[0], 0) / n;
  const cz = pts.reduce((a, p) => a + p[1], 0) / n;
  let sxx = 0;
  let szz = 0;
  let sxz = 0;
  for (const [x, z] of pts) {
    sxx += (x - cx) ** 2;
    szz += (z - cz) ** 2;
    sxz += (x - cx) * (z - cz);
  }
  // The long axis: the covariance's larger eigenvector.
  const angle = 0.5 * Math.atan2(2 * sxz, sxx - szz);
  let ax = Math.cos(angle);
  let az = Math.sin(angle);
  if (heightAt) {
    // Its two ends along that axis: downstream is the lower.
    let lo = Infinity;
    let hi = -Infinity;
    let a = null;
    let b = null;
    for (const p of pts) {
      const t = (p[0] - cx) * ax + (p[1] - cz) * az;
      if (t < lo) [lo, a] = [t, p];
      if (t > hi) [hi, b] = [t, p];
    }
    const ha = heightAt(a[0], a[1]);
    const hb = heightAt(b[0], b[1]);
    if (Number.isFinite(ha) && Number.isFinite(hb) && ha < hb - 1e-3) [ax, az] = [-ax, -az];
  }
  // (Hole (x, z) -> the world's (z, -x).)
  return { dir: [az, -ax], speed };
}
