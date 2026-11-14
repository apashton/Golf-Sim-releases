// The putting green's practice choices that aren't about rolling the ball:
// a random green within realistic limits (how severe a green to roll), the
// aim from the mat (turned a step at a time, said in cups at the hole), and
// the words for both. Pure, for the tests; public/putting.js uses it.

import { HOLE_RADIUS, FOOT, INCH } from "./putting.mjs";

// ---- A random green ------------------------------------------------------------------

// How severe a random green may be. A real pin is cut where the green is
// under about 3% - steeper and a ball won't stop by the hole - so even
// "severe" stays inside that, and the panel's own choices stop at 4%.
//   up        the most up or down hill, per cent
//   side      the most side slope, per cent
//   contours  the humps and hollows it may have (putting.mjs CONTOUR_NAMES)
export const SEVERITY = ["flat", "gentle", "moderate", "severe", "any"];
export const SEVERITY_NAMES = { flat: "Flat", gentle: "Gentle", moderate: "Moderate", severe: "Severe", any: "Any" };
export const SEVERITY_LIMITS = {
  flat: { up: 0, side: 0, contours: ["none"] },
  gentle: { up: 1, side: 1, contours: ["none", "gentle"] },
  moderate: { up: 2, side: 2, contours: ["none", "gentle", "moderate"] },
  severe: { up: 3, side: 3, contours: ["gentle", "moderate", "severe"] },
  any: { up: 3, side: 3, contours: ["none", "gentle", "moderate", "severe"] },
};
// The panel's slopes run to 4% either way, in halves.
export const MAX_SLOPE = 4;
export const clampSlope = (v) => Math.max(-MAX_SLOPE, Math.min(MAX_SLOPE, Math.round((Number(v) || 0) * 2) / 2));

// A new green within the severity's limits: its slopes in half per cents,
// its contours one of those allowed, and a seed for the contours' shapes.
// "Severe" always has some slope to it, so it never comes out flat.
export function randomGreen(severity = "moderate", rand = Math.random) {
  const lim = SEVERITY_LIMITS[severity] ?? SEVERITY_LIMITS.moderate;
  const half = (most) => (most ? Math.round((rand() * 2 - 1) * most * 2) / 2 : 0);
  let uphill = half(lim.up);
  let fallRight = half(lim.side);
  if (severity === "severe" && Math.abs(uphill) + Math.abs(fallRight) < 1.5) {
    // A severe green with little slope: tilt it the way it leans.
    if (Math.abs(fallRight) >= Math.abs(uphill)) fallRight = fallRight >= 0 ? 1.5 : -1.5;
    else uphill = uphill >= 0 ? 1.5 : -1.5;
  }
  const contours = lim.contours[Math.min(lim.contours.length - 1, Math.floor(rand() * lim.contours.length))];
  return { uphill: uphill + 0, fallRight: fallRight + 0, contours, seed: Math.floor(rand() * 1e6) };
}

// A flat green: no slope, no contours.
export const FLAT_GREEN = Object.freeze({ uphill: 0, fallRight: 0, contours: "none" });

// Whether a green has any slope or contour to it.
export const isFlat = (g) => Math.abs(g.uphill ?? 0) < 0.25 && Math.abs(g.fallRight ?? 0) < 0.25 && (g.contours ?? "none") === "none";

// ---- The aim ---------------------------------------------------------------------------

// The mat points at the hole to begin with. ← → turn the aim a quarter of
// a degree (Shift: a whole one), as on the course's greens, up to 15°
// either way - 7 ft off at 30 ft, more than any read needs.
export const AIM_STEP_DEG = 0.25;
export const AIM_BIG_STEP_DEG = 1;
export const AIM_MAX_DEG = 15;

export function clampAim(deg) {
  const d = Math.round((Number(deg) || 0) / AIM_STEP_DEG) * AIM_STEP_DEG;
  return Math.max(-AIM_MAX_DEG, Math.min(AIM_MAX_DEG, d)) + 0;
}
// A step of the aim: dir +1 right, -1 left.
export function nudgeAim(deg, dir, big = false) {
  return clampAim((Number(deg) || 0) + Math.sign(dir) * (big ? AIM_BIG_STEP_DEG : AIM_STEP_DEG));
}

// Where the aim points level with the hole: metres right of it (negative
// left), and back.
export const aimOffset = (deg, distance) => Math.tan((deg * Math.PI) / 180) * distance;
export const aimFromOffset = (offset, distance) => (distance > 0 ? (Math.atan2(offset, distance) * 180) / Math.PI : 0);
// An aim said in cups (a regulation hole's width, 4¼ in) right of the
// hole at the hole's distance - what the read says to aim.
export const CUP = 2 * HOLE_RADIUS;
export const aimForCups = (cups, distance) => clampAim(aimFromOffset(cups * CUP, distance));

// The ball starts on the mat's line turned `hla` degrees (the launch
// monitor's, right positive); with the mat aimed `aim` degrees right of
// the hole, that's hla + aim off the line to the hole, the frame the green
// and the putt are worked out in.
export const startLine = (hlaDeg, aimDeg) => (Number(hlaDeg) || 0) + (Number(aimDeg) || 0);
// And the other way: a line off the hole, as it must be struck off the mat.
export const matLine = (lineDeg, aimDeg) => (Number(lineDeg) || 0) - (Number(aimDeg) || 0);

// "Aim: straight at the hole", "Aim: 8 in left of the hole (2 cups, 1.3°)".
export function aimWords(deg, distance) {
  if (Math.abs(deg) < AIM_STEP_DEG / 2) return "Aim: straight at the hole";
  const off = Math.abs(aimOffset(deg, distance));
  const side = deg > 0 ? "right" : "left";
  const size = off < 24 * INCH ? `${Math.round(off / INCH)} in` : `${(off / FOOT).toFixed(1).replace(/\.0$/, "")} ft`;
  const cups = off / CUP;
  const cupWords = cups >= 0.75 ? `${cups < 10 ? (Math.round(cups * 2) / 2).toString() : Math.round(cups)} ${Math.round(cups * 2) / 2 === 1 ? "cup" : "cups"}, ` : "";
  return `Aim: ${size} ${side} of the hole (${cupWords}${Math.abs(deg).toFixed(2).replace(/0$/, "").replace(/\.0$/, "")}°)`;
}

// A green in words, for the voice and the toasts: "flat", "1% uphill,
// breaks right 2%, gentle contours".
export function greenWords(g, names = {}) {
  if (isFlat(g)) return "flat";
  const parts = [];
  if (Math.abs(g.uphill) >= 0.25) parts.push(`${fmtPct(g.uphill)} ${g.uphill > 0 ? "uphill" : "downhill"}`);
  if (Math.abs(g.fallRight) >= 0.25) parts.push(`breaks ${g.fallRight > 0 ? "right" : "left"} ${fmtPct(g.fallRight)}`);
  if ((g.contours ?? "none") !== "none") parts.push(`${(names[g.contours] ?? g.contours).toLowerCase()} contours`);
  return parts.join(", ");
}
const fmtPct = (v) => `${Math.abs(v).toFixed(1).replace(/\.0$/, "")}%`;
