// The pin of the day (the owner: "cup positions that change day to day"):
// with the course's Pin positions set to change daily, each hole's cup is
// cut somewhere new each day - front, middle or back, left or right - as a
// greenkeeper would: well in from the edge, on ground gentle enough round
// the cup, clear of the sand and the water. The same for everyone playing
// that day (it comes from the day and the hole), so an online round's
// players putt at the same cup. The hole's own pin otherwise.

import { insideBlob } from "./course.mjs";
import { insideDepth } from "./holeedits.mjs";
import { mulberry32 } from "./mathutil.mjs";

// edge: metres in from the green's edge (about four paces); hazard: metres
// clear of a bunker's or a pond's edge; round: how far round the cup the
// slope is looked at; slope: the steepest it may be there (or as steep as
// round the hole's own pin, on a green where nowhere's that gentle); tries:
// spots looked at before keeping the hole's own pin.
// The course's Pin positions setting (course.js): its choices.
export const PIN_CHOICES = { fixed: "Each hole's own", daily: "Change every day" };

export const PIN_DAY = { edge: 3.2, hazard: 3, round: 0.9, slope: 0.03, tries: 80 };

// A UTC day, "2026-10-10", from a time (ms) - the day a round started.
export const dayOf = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);

function seeded(seed) {
  return mulberry32(seed);
}
function hashText(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

// The steepest the ground is round (x, z): gradientAt(x, z) -> [gx, gz].
function steepest(gradientAt, x, z, r) {
  let most = Math.hypot(...gradientAt(x, z));
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    most = Math.max(most, Math.hypot(...gradientAt(x + Math.cos(a) * r, z + Math.sin(a) * r)));
  }
  return most;
}

// Hole L's pin on `day` ("2026-10-10"; key: what else tells this hole
// from another course's - the course's id and the hole's number):
// [x, z]. gradientAt: the green's slope (a prepared hole's). The day's
// spot is picked from a part of the green - front, middle or back, its
// left, middle or right - then the first spot in that part that suits;
// failing that, any that suits; failing that, the hole's own pin.
export function dayPin(L, gradientAt, { day, key = "" }) {
  const g = L.green;
  const own = L.pin;
  if (!g || !own || g.poly) return own;
  const rand = seeded(hashText(`${day}|${key}|${L.number ?? ""}`));
  const limit = Math.max(PIN_DAY.slope, steepest(gradientAt, own[0], own[1], PIN_DAY.round) + 0.002);
  const hazards = [...(L.bunkers ?? []), ...(L.water ?? [])];
  const suits = (x, z) =>
    insideDepth(g, x, z) >= PIN_DAY.edge && !hazards.some((h) => insideBlob(h, x, z, PIN_DAY.hazard)) && steepest(gradientAt, x, z, PIN_DAY.round) <= limit;
  // The part of the green for today: along the line of play (front, middle,
  // back) and across it.
  const along = Math.floor(rand() * 3) - 1;
  const across = Math.floor(rand() * 3) - 1;
  const R = Math.max(g.rx, g.rz);
  const c = Math.cos(g.rot ?? 0);
  const s = Math.sin(g.rot ?? 0);
  for (let pass = 0; pass < 2; pass++) {
    for (let k = 0; k < PIN_DAY.tries; k++) {
      // In today's part first (its middle a third of the way out, the
      // green's frame turned by its lie), then anywhere on it.
      const u = pass === 0 ? along * 0.45 * R + (rand() - 0.5) * 0.5 * R : (rand() * 2 - 1) * R;
      const v = pass === 0 ? across * 0.4 * R + (rand() - 0.5) * 0.5 * R : (rand() * 2 - 1) * R;
      const x = g.x + u * c - v * s;
      const z = g.z + u * s + v * c;
      if (suits(x, z)) return [Math.round(x * 100) / 100, Math.round(z * 100) / 100];
    }
  }
  return own;
}
