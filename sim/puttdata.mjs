// What one putt's numbers say, for the shot data screen's putting view: the
// same boxes as a full swing (so a stream's layout never moves), filled
// with what matters on the green - the pace (how far that stroke rolls on
// a flat green), the start line and where it takes the ball at the hole,
// the putter's face, path and strike, and how the putt finished when the
// sim knows (the putting green, a course green: the stats' target).
//
// A putt's result comes from the stats (server/stats.mjs, the "strike"
// event): its target in yards { d, f, long, made } - the putt's length, how
// far from the hole it finished, how far past (+) or short, and whether it
// dropped. Shown in feet.
//
// Pure, so it can be tested.

import { flatRoll, aimOffset } from "./puttguide.mjs";
import { FOOT, INCH, HOLE_RADIUS } from "./putting.mjs";
import { YARD } from "./flight.mjs";

const has = (v) => typeof v === "number" && Number.isFinite(v);
const round = (v, dp = 1) => (has(v) ? Math.round(v * 10 ** dp) / 10 ** dp : null);

export const isPutt = (entry) => entry?.club === "PT";
// A cup's half width, in inches: a start line inside it at the hole is on
// line.
export const CUP_HALF_IN = HOLE_RADIUS / INCH;

// Everything the putting view shows for one putt. stimp: the green's pace
// the flat roll is worked out on. result: the stats' target, when known.
export function puttReport(entry, { stimp = 10, result = null } = {}) {
  const ball = entry?.ball ?? {};
  const c = entry?.clubData ?? null;
  const speed = round(ball.speedMph);
  const roll = has(ball.speedMph) && ball.speedMph > 0 ? flatRoll(ball.speedMph, stimp) / FOOT : null;
  const face = round(c?.faceToTarget);
  const path = round(c?.path);
  const res = puttResult(result);
  // The start line at the hole (or, with no hole known, where the roll
  // ends): inches right (+) of dead centre.
  const along = res?.feet ?? roll;
  const atHole = has(ball.hla) && has(along) ? aimOffset(ball.hla, along * FOOT) / INCH : null;
  return {
    stimp,
    ball: { speed, start: round(ball.hla), launch: round(ball.vla), spin: has(ball.totalSpin) ? Math.round(ball.totalSpin) : null },
    roll: round(roll),
    club: c && {
      speed: round(c.speedMph),
      face,
      path,
      facePath: has(face) && has(path) ? round(face - path) : null,
      loft: round(c.loft),
      attack: round(c.angleOfAttack),
      impactH: round(c.impactHorizontal),
      impactV: round(c.impactVertical),
    },
    atHole: round(atHole),
    onLine: has(atHole) ? Math.abs(atHole) <= CUP_HALF_IN : null,
    // The roll against the putt's length: feet past (+) or short on the
    // flat - the pace, with the slopes taken away.
    pace: has(roll) && res ? round(roll - res.feet) : null,
    result: res,
  };
}

// The stats' target, in feet: { feet (the putt's length), made, leave (how
// far from the hole it finished), long (past + / short -) }, or null.
export function puttResult(tg) {
  if (!tg || !has(tg.d) || tg.d <= 0) return null;
  const ft = (yd) => (has(yd) ? round((yd * YARD) / FOOT) : null);
  return { feet: ft(tg.d), made: !!tg.made, leave: tg.made ? 0 : ft(tg.f), long: tg.made ? 0 : ft(tg.long) };
}

// The result in words for the big tile: "Holed", "2.1 ft long", "8 in short".
export function resultWords(res) {
  if (!res) return null;
  if (res.made) return "Holed";
  const long = res.long;
  const leave = res.leave;
  if (!has(leave)) return "Missed";
  const size = leave < 1 ? `${Math.round(leave * 12)} in` : `${leave.toFixed(1)} ft`;
  if (!has(long) || Math.abs(long) < Math.min(0.2, leave / 2)) return `${size} by`;
  return `${size} ${long > 0 ? "long" : "short"}`;
}

// The start line at the hole in words: "on line", "1.5 in right".
export function lineWords(atHole) {
  if (!has(atHole)) return null;
  if (Math.abs(atHole) <= CUP_HALF_IN) return Math.abs(atHole) < 0.5 ? "dead centre" : `on line, ${Math.abs(atHole).toFixed(1)} in ${atHole > 0 ? "right" : "left"}`;
  return `${Math.abs(atHole).toFixed(1)} in ${atHole > 0 ? "right" : "left"} - outside the cup`;
}

// The session's putts together: how many, how many holed, the averages of
// the stroke, how often the start line was on the cup, and the average
// miss (feet from the hole) when they didn't drop.
export function puttSummary(reports) {
  const avg = (get) => {
    const v = reports.map(get).filter(has);
    return v.length ? round(v.reduce((a, b) => a + b, 0) / v.length) : null;
  };
  const known = reports.filter((r) => r.result);
  const lines = reports.filter((r) => r.onLine !== null);
  const misses = known.filter((r) => !r.result.made && has(r.result.leave));
  return {
    putts: reports.length,
    known: known.length,
    made: known.filter((r) => r.result.made).length,
    onLine: lines.filter((r) => r.onLine).length,
    lines: lines.length,
    speed: avg((r) => r.ball.speed),
    roll: avg((r) => r.roll),
    start: avg((r) => r.ball.start),
    face: avg((r) => r.club?.face),
    path: avg((r) => r.club?.path),
    impactH: avg((r) => r.club?.impactH),
    leave: misses.length ? round(misses.reduce((a, r) => a + r.result.leave, 0) / misses.length) : null,
  };
}
