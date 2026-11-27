// A shot's flight, small enough to send to the other bays in an online game
// (sim/netgame.mjs): the path the course draws its tracer and moves its ball
// along - [x, y, z, t] points, the first `air` of them in the air, the rest
// along the ground - thinned to a few dozen points, rounded to the
// centimetre and the hundredth of a second. Drawn on the other bays the
// same way as a shot played there (course.js), so it looks the same.
// Pure.

export const MAX_AIR = 48;
export const MAX_GROUND = 24;
export const MAX_POINTS = MAX_AIR + MAX_GROUND;

const round = (v, k) => Math.round(v * k) / k;

// Every nth point of a stretch, always keeping its first and last.
function thin(points, max) {
  if (points.length <= max) return points;
  const out = [];
  const step = (points.length - 1) / (max - 1);
  for (let i = 0; i < max; i++) out.push(points[Math.round(i * step)]);
  return out;
}

// path: [[x, y, z, t]], air: how many of them are in the air.
// Returns { path, air } - the same shape, fewer points.
export function thinPath(path, air = path?.length ?? 0) {
  if (!Array.isArray(path) || path.length < 2) return null;
  const n = Math.max(1, Math.min(path.length, Math.round(air)));
  const flight = thin(path.slice(0, n), MAX_AIR);
  // The ground run carries on from the landing (its first point is the
  // flight's last).
  const ground = thin(path.slice(n - 1), MAX_GROUND).slice(1);
  const pts = [...flight, ...ground].map(([x, y, z, t]) => [round(x, 100), round(y, 100), round(z, 100), round(t, 100)]);
  return { path: pts, air: flight.length };
}

// Whether a path from another bay is one to draw.
export function okPath(p) {
  return (
    !!p &&
    Array.isArray(p.path) &&
    p.path.length >= 2 &&
    p.path.length <= MAX_POINTS &&
    Number.isInteger(p.air) &&
    p.air >= 1 &&
    p.air <= p.path.length &&
    p.path.every((q) => Array.isArray(q) && q.length === 4 && q.every((v) => Number.isFinite(v) && Math.abs(v) < 5000)) &&
    p.path.every((q, i) => i === 0 || q[3] >= p.path[i - 1][3])
  );
}
