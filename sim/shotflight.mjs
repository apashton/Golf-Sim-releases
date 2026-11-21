// The flight a mode really flew, for the recording's Flight path layer and
// the command centre's Flight path boxes (flightdraw.js): the owner, 16
// October 2026, "ball flight views on the overlay for scenes aren't the
// actual ball flights, they are generic". They were the launch monitor's
// numbers flown again in still air; each mode now hands over its own -
// the wind, the lie, the air and, on a course, the ground it flew over.
// Pure.
//
// The drawing wants a shot's own frame: [along, up, across, t] metres,
// along the aim from where it was hit, right across it. The range and the
// chipping green fly in that frame already; the course and the
// Challenges' holes fly in the hole's ([x, height above the ground, z, t]),
// turned here to the shot's by where it was hit from and its aim.

import { YARD } from "./flight.mjs";

// path: the mode's [[x, y, z, t]]; flightPoints: how many of them are in
// the air; from: [x, z] where it was hit (hole frame only); aim: its aim,
// radians (hole frame only). Returns { path, flightPoints, carry, total,
// offline } in the shot's frame (yards for the numbers), or null for no
// flight to draw - with its apex (yards above the ground it flew over),
// hang time (seconds) and descent angle (degrees) from the path too.
export function shotFlight({ path, flightPoints, from = null, aim = null } = {}) {
  if (!Array.isArray(path) || path.length < 2) return null;
  let out = path;
  if (from && Number.isFinite(aim)) {
    // The inverse of courseplay.mjs toHole: hole x, z back to along and
    // across the aim.
    const c = Math.cos(aim);
    const s = Math.sin(aim);
    out = path.map(([x, y, z, t]) => {
      const dx = x - from[0];
      const dz = z - from[1];
      return [dx * c + dz * s, y, -dx * s + dz * c, t];
    });
  }
  const air = Math.max(2, Math.min(out.length, Number.isFinite(flightPoints) ? flightPoints : out.length));
  const land = out[air - 1];
  const before = out[air - 2];
  const rest = out.at(-1);
  const flat = Math.hypot(land[0] - before[0], land[2] - before[2]);
  return {
    path: out,
    flightPoints: air,
    carry: Math.hypot(land[0], land[2]) / YARD,
    total: Math.hypot(rest[0], rest[2]) / YARD,
    offline: rest[2] / YARD,
    apex: Math.max(0, ...out.slice(0, air).map((p) => p[1])) / YARD,
    hangTime: Number.isFinite(land[3]) ? land[3] : null,
    descentAngle: flat > 1e-6 ? (Math.atan2(before[1] - land[1], flat) * 180) / Math.PI : null,
  };
}
