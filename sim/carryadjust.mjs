// The carry adjustment: Menu -> Ball flight -> Carry adjustment, "carry N%
// further (or shorter)". It's a scale on the air's drag (flight.mjs
// setCarryMatch), set as the share a typical drive (REF_DRIVE) carries
// further than A-Squared Golf's own with it; other clubs change by about as
// much. The slider runs CARRY_PERCENT either way; 0 is off (A-Squared Golf's
// own carries, which match TrackMan's tour tables: test/flight.test.mjs).
//
// The server keeps it (calibration/omni-signs.json, under "carry"; the
// folder's name is from before). An adjustment from the old calibration
// page may also have a spin part (drag that rises faster with spin): it's
// kept as it is until the slider is moved.
//
// Online, each bay's percent is shared with everyone (netgame.mjs), and the
// host can have everyone play A-Squared Golf's own carries for the round.
//
// Pure: the menu, the server and the online game share it, and
// test/carryadjust.test.mjs covers it.

import { straightCarry, aeroWithDrag, CARRY_MATCH_LIMITS, CARRY_SPIN_LIMITS, FLIGHT_MODEL } from "./flight.mjs";

const fin = (v) => typeof v === "number" && Number.isFinite(v);
const r3 = (v) => Math.round(v * 1000) / 1000;
const r2 = (v) => Math.round(v * 100) / 100;

export const REF_DRIVE = Object.freeze({ speedMph: 145, vla: 13, totalSpin: 3000 });
export const CARRY_PERCENT = Object.freeze({ min: -10, max: 12, step: 0.5 });

// The adjustment as the server keeps it: { scale, spin?, fm, at, n }, or
// null when there's none - a scale of 1 (and no spin part), or one outside
// CARRY_MATCH_LIMITS, is none.
export function cleanCarry(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  // Made against another flight model (none kept: before model 3): it was a
  // correction to that model's carries, not this one's, so it goes.
  if (raw.fm !== FLIGHT_MODEL) return null;
  const [lo, hi] = CARRY_MATCH_LIMITS;
  const scale = raw.scale;
  const [slo, shi] = CARRY_SPIN_LIMITS;
  const spin = fin(raw.spin) && raw.spin >= slo && raw.spin <= shi ? r2(raw.spin) : 1;
  if (!fin(scale) || scale < lo || scale > hi || (Math.abs(scale - 1) < 5e-4 && spin === 1)) return null;
  return {
    scale: r3(scale),
    // The spin part (1: the model's own; only the old calibration made one).
    ...(spin !== 1 ? { spin } : {}),
    fm: FLIGHT_MODEL,
    at: typeof raw.at === "string" ? raw.at.slice(0, 40) : null,
    n: fin(raw.n) && raw.n >= 0 ? Math.round(raw.n) : null,
  };
}

// The share (percent) a drive carries further at a drag scale (and spin
// part), to a tenth.
export function carryPercentOf(scale, spin = 1) {
  if (!fin(scale) || (scale === 1 && spin === 1)) return 0;
  const own = straightCarry(REF_DRIVE, aeroWithDrag(1));
  return own > 0 ? Math.round((straightCarry(REF_DRIVE, aeroWithDrag(scale, undefined, spin)) / own - 1) * 1000) / 10 : 0;
}

// The drag scale that carries a drive `percent` further (null: off, for 0
// or anything that isn't a number); within CARRY_MATCH_LIMITS.
export function scaleForCarryPercent(percent) {
  const p = Number(percent);
  if (!Number.isFinite(p) || Math.abs(p) < 0.05) return null;
  const want = Math.min(CARRY_PERCENT.max, Math.max(CARRY_PERCENT.min, p)) / 100;
  const own = straightCarry(REF_DRIVE, aeroWithDrag(1));
  let [lo, hi] = CARRY_MATCH_LIMITS;
  // Less drag carries further: the share falls as the scale rises.
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (straightCarry(REF_DRIVE, aeroWithDrag(mid)) / own - 1 > want) lo = mid;
    else hi = mid;
  }
  return r3((lo + hi) / 2);
}

// A percent as it's shared online: a number within CARRY_PERCENT, to a
// tenth (0 for anything else).
export function cleanCarryPercent(v) {
  const p = Number(v);
  if (!Number.isFinite(p)) return 0;
  return Math.round(Math.min(CARRY_PERCENT.max, Math.max(CARRY_PERCENT.min, p)) * 10) / 10;
}

// "+3% carry" / "−2.5% carry", or "" for none.
export function carryPercentWords(p) {
  const v = cleanCarryPercent(p);
  if (!v) return "";
  return `${v > 0 ? "+" : "−"}${Math.abs(v)}% carry`;
}
