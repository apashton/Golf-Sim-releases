// Reading a long putt: the line from the ball to the hole looked at a
// section at a time (25%, 50%, 75%, from behind the hole, side-on), the
// heights and slopes there, the line's profile from the ball to the hole,
// and the sums behind drawing the grid, the pace markers and the distance
// marks so they still read 60 ft away on a projector.
//
// Everything about the line is in the putting frame (putting.mjs): the ball
// at the origin, the hole `distance` metres along +x, z to the golfer's
// right, with heights from the green's own model (greenHeight and
// greenGradient). A course green is read through courseGreen's frame
// (puttguide.mjs), so the same functions serve both. A line is a list of
// [x, z] points from the ball to the hole: the straight one unless another
// is given. Pure, so the browser and the tests share it.

import { greenHeight, greenGradient, FOOT, INCH } from "./putting.mjs";

import { clamp, smoothstep } from "./mathutil.mjs";
const lerp = (a, b, k) => a + (b - a) * k;
export { smoothstep };

// ---- The line ------------------------------------------------------------------

export function straightLine(distance) {
  return [
    [0, 0],
    [distance, 0],
  ];
}

export function lineLength(line) {
  let s = 0;
  for (let i = 1; i < line.length; i++) s += Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]);
  return s;
}

// The point `s` metres along a line (held to the line) and which way it
// runs there: { p: [x, z], dir: [dx, dz] } with dir a unit vector.
export function pointAlong(line, s) {
  let left = Math.max(0, s);
  let dir = [1, 0];
  for (let i = 1; i < line.length; i++) {
    const [ax, az] = line[i - 1];
    const [bx, bz] = line[i];
    const seg = Math.hypot(bx - ax, bz - az);
    if (seg <= 0) continue;
    dir = [(bx - ax) / seg, (bz - az) / seg];
    if (left <= seg || i === line.length - 1) {
      const k = Math.min(1, left / seg);
      return { p: [ax + (bx - ax) * k, az + (bz - az) * k], dir };
    }
    left -= seg;
  }
  return { p: [...line[line.length - 1]], dir };
}

// ---- The stops -------------------------------------------------------------------

// Where the view of the line can stand, in the order the key steps through
// them: behind the ball (the normal view), on the line a quarter, half and
// three quarters of the way, behind the hole looking back, and side-on to
// the whole line - then round to behind the ball again.
export const STOPS = [
  { id: "ball", label: "Ball", name: "Behind the ball" },
  { id: "25", label: "25%", name: "25%", f: 0.25 },
  { id: "50", label: "50%", name: "50%", f: 0.5 },
  { id: "75", label: "75%", name: "75%", f: 0.75 },
  { id: "hole", label: "Hole", name: "Behind the hole", f: 1 },
  { id: "side", label: "Side", name: "Side-on" },
];

// The stops for a putt this long (metres): fewer on a short one, where the
// line is seen whole from behind the ball - behind the ball, the hole and
// side-on under 20 ft; with the halfway point from 20 ft; at thirds from
// 30 ft; at quarters (all of STOPS) from 40 ft. No distance: all of STOPS.
// Each stop is STOPS's own (or a third's, which STOPS hasn't).
const THIRDS = [
  { id: "33", label: "33%", name: "33%", f: 1 / 3 },
  { id: "67", label: "67%", name: "67%", f: 2 / 3 },
];
const stop = (id) => STOPS.find((s) => s.id === id);
export function getStopsForDistance(distance) {
  if (!(distance > 0)) return STOPS;
  const ft = distance / FOOT;
  if (ft >= 40) return STOPS;
  if (ft >= 30) return [stop("ball"), ...THIRDS, stop("hole"), stop("side")];
  if (ft >= 20) return [stop("ball"), stop("50"), stop("hole"), stop("side")];
  return [stop("ball"), stop("hole"), stop("side")];
}

// The stop `delta` on from `i` (back with a negative delta), going round.
export function stepStop(i, delta = 1, distance = 0) {
  const n = getStopsForDistance(distance).length;
  return (((Math.round(i) + delta) % n) + n) % n;
}

// ---- The figures at a stop --------------------------------------------------------

// What a stop shows about the line there, in metres and percent:
//   f, at, toGo        how far along it is: a fraction, metres from the
//                      ball, metres still to the hole
//   point              where, [x, z]
//   aboveBall          its height against the ball's (metres, + above)
//   aboveHole          and against the hole's
//   along              the slope there along the line, percent (+ uphill,
//                      towards the hole)
//   across             and across it, percent (+ rising to the right: it
//                      falls right to left)
//   rise, length       the whole line: the hole against the ball, its length
// Side-on, instead of a point: high and low, the line's highest and lowest
// points against the ball ({ d, h }). Behind the ball (the normal view),
// only rise and length.
export function sectionFigures(green, distance, stopIndex, { line = null, samples = 48, stops = getStopsForDistance(distance) } = {}) {
  const L = line ?? straightLine(distance);
  const length = lineLength(L);
  const stop = stops[stopIndex] ?? stops[0];
  const ball = L[0];
  const hole = L[L.length - 1];
  const hBall = greenHeight(green, ball[0], ball[1]);
  const hHole = greenHeight(green, hole[0], hole[1]);
  const out = { stop, index: stops.indexOf(stop), length, rise: hHole - hBall };
  if (stop.f == null) {
    if (stop.id === "side") {
      const prof = lineProfile(green, distance, { line: L, n: samples });
      out.high = prof.high;
      out.low = prof.low;
    }
    return out;
  }
  const at = stop.f * length;
  const { p, dir } = pointAlong(L, at);
  const h = greenHeight(green, p[0], p[1]);
  const [gx, gz] = greenGradient(green, p[0], p[1]);
  // The golfer's right, looking along the line.
  const right = [-dir[1], dir[0]];
  return Object.assign(out, {
    f: stop.f,
    at,
    toGo: length - at,
    point: p,
    aboveBall: h - hBall,
    aboveHole: h - hHole,
    along: (gx * dir[0] + gz * dir[1]) * 100,
    across: (gx * right[0] + gz * right[1]) * 100,
  });
}

// Feet and inches as the guide writes them (puttguide.mjs): whole feet from
// 3 ft, a tenth below; whole inches from 3 in, a tenth below.
const feet = (m) => {
  const f = Math.round((Math.abs(m) / FOOT) * 10) / 10;
  return f >= 3 ? `${Math.round(f)} ft` : `${f.toFixed(1)} ft`;
};
const inches = (m) => {
  const i = Math.round((Math.abs(m) / INCH) * 10) / 10;
  return i >= 3 ? `${Math.round(i)} in` : `${i.toFixed(1)} in`;
};
const size = (m) => (Math.abs(m) < 24 * INCH ? inches(m) : feet(m));

// "2.1 in above the ball", "0.4 in below the hole", "level with the ball".
export function heightAgainst(dh, what) {
  if (Math.abs(dh) < 0.05 * INCH) return `level with the ${what}`;
  return `${size(dh)} ${dh > 0 ? "above" : "below"} the ${what}`;
}

// "1.8% right-to-left, 0.6% uphill"; either part left out when it's under
// a twentieth of a percent, "flat" when both are.
export function slopeText(across, along) {
  const parts = [];
  if (Math.abs(across) >= 0.05) parts.push(`${Math.abs(across).toFixed(1)}% ${across > 0 ? "right-to-left" : "left-to-right"}`);
  if (Math.abs(along) >= 0.05) parts.push(`${Math.abs(along).toFixed(1)}% ${along > 0 ? "uphill" : "downhill"}`);
  return parts.length ? parts.join(", ") : "flat";
}

// Side-on: the line's highest and lowest points on the way, where they're
// a crest or a dip rather than just the ball or the hole - a line each.
function shapeLines(fig) {
  const { high, low, rise, length } = fig;
  const lines = [];
  const tol = 0.1 * INCH;
  const inside = (q) => q && q.d > 0.02 * length && q.d < 0.98 * length;
  if (inside(high) && high.h > Math.max(0, rise) + tol) lines.push(`Highest ${heightAgainst(high.h, "ball")}, ${feet(high.d)} out`);
  if (inside(low) && low.h < Math.min(0, rise) - tol) lines.push(`Lowest ${heightAgainst(low.h, "ball")}, ${feet(low.d)} out`);
  if (lines.length) return lines;
  if (Math.abs(rise) < 0.25 * INCH) return ["Level all the way"];
  return [rise > 0 ? "Lowest at the ball, highest at the hole" : "Highest at the ball, lowest at the hole"];
}

// What's said at a stop, with the guide lines: where it is, how high it is
// against the ball and against the hole, then the slope there. Each line
// is kept short - 48 characters at most, whatever the figures - so the
// game window, read from the mat, can show it big. Nothing behind the
// ball, the normal view (its line, the distance and the rise to the hole,
// is always shown).
//   "50% · 15 ft from the ball"
//   "2.1 in above the ball · 1.4 in above the hole"
//   "Slope here: 1.8% right-to-left, 0.6% uphill"
export function sectionLines(fig) {
  const id = fig.stop.id;
  if (id === "ball") return [];
  if (id === "side") return [`Side-on: the whole ${feet(fig.length)} line`, ...shapeLines(fig)];
  if (id === "hole") {
    return [`Behind the hole · ${feet(fig.length)} to the ball`, `The hole sits ${heightAgainst(fig.rise, "ball")}`, `At the hole: ${slopeText(fig.across, fig.along)}`];
  }
  return [
    `${fig.stop.name} · ${feet(fig.at)} from the ball`,
    `${heightAgainst(fig.aboveBall, "ball")} · ${heightAgainst(fig.aboveHole, "hole")}`,
    `Slope here: ${slopeText(fig.across, fig.along)}`,
  ];
}

// ---- The profile ------------------------------------------------------------------

// The line's heights from the ball to the hole, against the ball's:
// { points: [{ d, h }] (n + 1 of them, evenly spaced, metres), length,
// rise, high, low } - high and low the highest and lowest points.
export function lineProfile(green, distance, { line = null, n = 48 } = {}) {
  const L = line ?? straightLine(distance);
  const length = lineLength(L);
  const h0 = greenHeight(green, L[0][0], L[0][1]);
  const points = [];
  for (let i = 0; i <= n; i++) {
    const d = (length * i) / n;
    const { p } = pointAlong(L, d);
    points.push({ d, h: greenHeight(green, p[0], p[1]) - h0 });
  }
  let high = points[0];
  let low = points[0];
  for (const q of points) {
    if (q.h > high.h) high = q;
    if (q.h < low.h) low = q;
  }
  return { points, length, rise: points[n].h, high, low };
}

// The height scale for a profile, inches: from `lo` to `hi`, taking in the
// ball's level and the whole line, at least 2 in from top to bottom (so a
// flat green isn't blown up into hills), with a little room over and under.
export function profileScale(profile) {
  const hs = profile.points.map((q) => q.h / INCH);
  let hi = Math.max(0, ...hs);
  let lo = Math.min(0, ...hs);
  const span = hi - lo;
  if (span < 2) {
    const mid = (hi + lo) / 2;
    hi = mid + 1;
    lo = mid - 1;
  }
  const pad = (hi - lo) * 0.12;
  return { lo: lo - pad, hi: hi + pad };
}

// How a height is labelled on the profile's scale: "+2.5 in", "-1 in", "0".
function scaleLabel(inch) {
  const r = Math.round(inch * 2) / 2;
  if (Math.abs(r) < 0.25) return "0";
  return `${r > 0 ? "+" : "−"}${Math.abs(r) % 1 ? Math.abs(r).toFixed(1) : Math.abs(r).toFixed(0)} in`;
}

// The profile drawn as an SVG, the ball on the left and the hole on the
// right: height (inches, stretched to fit) against distance, a dashed line
// at the ball's level, the 25, 50 and 75% points marked, the hole's rise
// by it, and - looking from a stop - that point as a yellow dot (side-on,
// the whole line in yellow). `big`: the game screen's, with bigger type.
// Plain markup, colours written in, so it looks the same in the panel, the
// controls window and over the picture.
export function profileSvg(profile, { stop = 0, width = 320, height = 124, big = false, distance = 0, stops = getStopsForDistance(distance) } = {}) {
  const fs = big ? 20 : 11;
  const left = big ? 92 : 52;
  // The rise to the hole is written to the right of the hole, so there's
  // room kept there for it: "↓ 0.8 in" was cut to "↓ 0.8 i". About 0.6 em
  // a character, generously.
  const rise = profile.rise;
  const riseText = Math.abs(rise) < 0.25 * INCH ? "level" : `${rise > 0 ? "↑" : "↓"} ${size(rise)}`;
  const riseGap = big ? 12 : 7;
  const right = Math.max(big ? 86 : 50, Math.ceil(riseGap + riseText.length * 0.6 * fs + 3));
  const top = big ? 20 : 12;
  const bottom = big ? 34 : 20;
  const W = width - left - right;
  const H = height - top - bottom;
  const { lo, hi } = profileScale(profile);
  const L = profile.length || 1;
  const X = (d) => left + (d / L) * W;
  const Y = (inch) => top + ((hi - inch) / (hi - lo)) * H;
  const f = (v) => v.toFixed(1);
  const pts = profile.points.map((q) => `${f(X(q.d))},${f(Y(q.h / INCH))}`);
  const line = `M${pts.join(" L")}`;
  const area = `${line} L${f(X(L))},${f(top + H)} L${f(X(0))},${f(top + H)} Z`;
  const text = "#e7efe8";
  const faint = "rgba(231,239,232,0.55)";
  const stroke = big ? 3 : 2;
  const on = stops[stop] ?? stops[0];
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="The line's heights from the ball to the hole" font-family="system-ui, sans-serif" font-size="${fs}">`,
    `<path d="${area}" fill="rgba(94,227,138,0.22)" stroke="none"/>`,
    // The ball's level.
    `<line x1="${f(X(0))}" y1="${f(Y(0))}" x2="${f(X(L))}" y2="${f(Y(0))}" stroke="${faint}" stroke-width="1" stroke-dasharray="4 4"/>`,
  ];
  // The quarter marks.
  for (const q of [0.25, 0.5, 0.75]) {
    const x = f(X(q * L));
    parts.push(`<line x1="${x}" y1="${f(top)}" x2="${x}" y2="${f(top + H)}" stroke="${faint}" stroke-width="1" stroke-dasharray="2 3"/>`);
    parts.push(`<text x="${x}" y="${f(height - bottom / 4)}" fill="${faint}" text-anchor="middle">${q * 100}%</text>`);
  }
  // The scale, top and bottom.
  parts.push(`<text x="${f(left - 6)}" y="${f(top + fs * 0.35)}" fill="${faint}" text-anchor="end">${scaleLabel(hi)}</text>`);
  parts.push(`<text x="${f(left - 6)}" y="${f(top + H)}" fill="${faint}" text-anchor="end">${scaleLabel(lo)}</text>`);
  // The line itself: yellow side-on, when the whole of it is being looked at.
  parts.push(`<path d="${line}" fill="none" stroke="${on.id === "side" ? "#ffd23f" : text}" stroke-width="${stroke}" stroke-linejoin="round"/>`);
  // Ball and hole, and the rise to it.
  parts.push(`<circle cx="${f(X(0))}" cy="${f(Y(0))}" r="${big ? 7 : 4}" fill="#ffffff"/>`);
  parts.push(`<text x="${f(X(0))}" y="${f(height - bottom / 4)}" fill="${text}" text-anchor="start">Ball</text>`);
  parts.push(`<circle cx="${f(X(L))}" cy="${f(Y(rise / INCH))}" r="${big ? 7 : 4}" fill="#1a1714" stroke="#ffffff" stroke-width="${big ? 2 : 1.5}"/>`);
  parts.push(`<text x="${f(X(L) + riseGap)}" y="${f(Y(rise / INCH) + fs * 0.35)}" fill="${text}" font-weight="700">${riseText}</text>`);
  parts.push(`<text x="${f(X(L))}" y="${f(height - bottom / 4)}" fill="${text}" text-anchor="end">Hole</text>`);
  // Where the view stands.
  if (on.f != null) {
    const i = Math.round(on.f * (profile.points.length - 1));
    const q = profile.points[i];
    parts.push(`<circle cx="${f(X(q.d))}" cy="${f(Y(q.h / INCH))}" r="${big ? 9 : 5}" fill="#ffd23f" stroke="#1b1b1b" stroke-width="${big ? 2 : 1}"/>`);
  }
  parts.push("</svg>");
  return parts.join("");
}

// ---- The camera at a stop -----------------------------------------------------------

const DEG = Math.PI / 180;

// The pitch (radians, down positive) for a camera with `near` and `far`
// ahead of it ({ dist: horizontal metres, drop: metres below the camera }):
// `far` in the middle of the picture if it can be, looking down further if
// that's what keeps `near` well up in the picture (no lower than `keepNear`
// of the half field of view below the middle: clear of the guide lines and
// the numbers along the bottom in bay view) - never so far that `far` goes
// more than `keepFar` of it above.
export function framePitch(near, far, halfFov, keepNear = 0.35, keepFar = 0.8) {
  const aNear = Math.atan2(near.drop, near.dist);
  const aFar = Math.atan2(far.drop, far.dist);
  const c = Math.max(aFar, aNear - keepNear * halfFov);
  return Math.min(c, aFar + keepFar * halfFov);
}

// How far to the side of the line the camera stands behind the hole.
export const HOLE_SIDE = 0.5;

// How far behind a point of the line (and how high) the camera stands, with
// `ahead` metres of the line still in front of it: further back and higher
// the more there is to see, as the view behind the ball is for a long putt.
export function standOff(ahead) {
  return { back: 2.8 + Math.min(1.4, ahead * 0.06), up: 1.05 + Math.min(0.75, ahead * 0.045) };
}

// Where the camera stands and what it looks at for a stop: { cam: [x, y,
// z], look: [x, y, z] } in the putting frame, heights from the green (y up,
// absolute) - or null behind the ball, which is each mode's own view.
//   25, 50, 75%   on the line at that point, a little behind and above it,
//                 looking towards the hole with the point in the picture
//   hole          behind the hole on the line (half a metre to the golfer's
//                 right of it, so the flagstick isn't in the middle of the
//                 picture), looking back at the ball
//   side          off to the golfer's right of the middle of the line, far
//                 enough for the whole of it to fit across the picture, low,
//                 looking across it so its rise and fall show - the ball on
//                 the left, the hole on the right, as in the profile
// fovDeg is the camera's vertical field of view, aspect its width / height.
export function sectionPose(stopIndex, { green, distance, line = null, fovDeg = 45, aspect = 16 / 9, stops = getStopsForDistance(distance) }) {
  const stop = stops[stopIndex];
  if (!stop || stop.id === "ball") return null;
  const L = line ?? straightLine(distance);
  const length = lineLength(L);
  const h = (x, z) => greenHeight(green, x, z);
  const halfFov = (fovDeg / 2) * DEG;
  const ball = L[0];
  const hole = L[L.length - 1];
  if (stop.id === "side") {
    const cx = hole[0] - ball[0];
    const cz = hole[1] - ball[1];
    const chord = Math.hypot(cx, cz) || 1;
    const u = [cx / chord, cz / chord];
    const right = [-u[1], u[0]];
    const mid = [(ball[0] + hole[0]) / 2, (ball[1] + hole[1]) / 2];
    const halfAcross = Math.atan(Math.tan(halfFov) * aspect);
    const margin = Math.max(0.9, 0.12 * chord);
    const off = Math.max(2.5, (chord / 2 + margin) / Math.tan(halfAcross));
    const cam = [mid[0] + right[0] * off, mid[1] + right[1] * off];
    const prof = lineProfile(green, distance, { line: L, n: 24 });
    const h0 = h(ball[0], ball[1]);
    const top = h0 + prof.high.h;
    const y = Math.max(h(cam[0], cam[1]), top) + 0.45 + 0.035 * off;
    const midY = h0 + (prof.high.h + prof.low.h) / 2;
    return { cam: [cam[0], y, cam[1]], look: [mid[0], midY, mid[1]] };
  }
  if (stop.id === "hole") {
    const { p, dir } = pointAlong(L, length);
    const back = 2.4 + Math.min(1.2, length * 0.05);
    const up = 1.1 + Math.min(0.8, length * 0.045);
    const cam = [p[0] + dir[0] * back - dir[1] * HOLE_SIDE, p[1] + dir[1] * back + dir[0] * HOLE_SIDE];
    const hH = h(p[0], p[1]);
    const y = Math.max(h(cam[0], cam[1]), hH) + up;
    const to = [ball[0] - cam[0], ball[1] - cam[1]];
    const far = Math.hypot(to[0], to[1]) || 1;
    const pitch = framePitch({ dist: Math.hypot(back, HOLE_SIDE), drop: y - hH }, { dist: far, drop: y - (h(ball[0], ball[1]) + 0.05) }, halfFov);
    return { cam: [cam[0], y, cam[1]], look: [cam[0] + to[0], y - Math.tan(pitch) * far, cam[1] + to[1]] };
  }
  const at = stop.f * length;
  const { p, dir } = pointAlong(L, at);
  const { back, up } = standOff(length - at);
  const cam = [p[0] - dir[0] * back, p[1] - dir[1] * back];
  const hP = h(p[0], p[1]);
  const y = Math.max(h(cam[0], cam[1]), hP) + up;
  const to = [hole[0] - cam[0], hole[1] - cam[1]];
  const far = Math.hypot(to[0], to[1]) || 1;
  const pitch = framePitch({ dist: Math.hypot(p[0] - cam[0], p[1] - cam[1]), drop: y - hP }, { dist: far, drop: y - (h(hole[0], hole[1]) + 0.05) }, halfFov);
  return { cam: [cam[0], y, cam[1]], look: [cam[0] + to[0], y - Math.tan(pitch) * far, cam[1] + to[1]] };
}

// Moving between stops: how long it takes for a move `metres` long
// (seconds), the eased progress at time `t`, and how far the camera rises
// over the straight path between the two at progress `k`, so a long move
// sweeps over the green rather than skimming it.
export function moveTime(metres) {
  return clamp(0.7 + 0.05 * metres, 0.7, 1.7);
}
export function moveEase(t, duration) {
  const k = clamp(t / duration, 0, 1);
  return k * k * (3 - 2 * k);
}
export function moveArc(k, metres) {
  return 4 * k * (1 - k) * Math.min(1.2, 0.06 * metres);
}

// ---- Distance marks -----------------------------------------------------------------

// Where the distance marks go on a putt `distanceFt` feet long: every 5 ft
// to 30 ft, every 10 ft beyond, and none within 2 ft of the hole (whose own
// distance is in the guide line).
export function distanceMarks(distanceFt) {
  const out = [];
  for (let ft = 5; ft < distanceFt - 2 + 1e-9; ft += ft < 30 ? 5 : 10) out.push(ft);
  return out;
}
// Every mark with a label drawn for it: to 150 ft, further than any putt
// on any green.
export const MARK_FEET = distanceMarks(152);

// A distance label `depth` metres from the camera: its height on screen
// (pixels of a 1080-line picture) and how opaque - smaller and fainter
// close to, so the ones by the ball stay quiet, full size from 10 m.
export const LABEL = { nearPx: 28, farPx: 50, near: 3.5, far: 10, nearAlpha: 0.45, farAlpha: 0.95, minPx: 30, fill: 0.85 };
export function labelLook(depth) {
  const k = smoothstep(LABEL.near, LABEL.far, depth);
  return { px: lerp(LABEL.nearPx, LABEL.farPx, k), alpha: lerp(LABEL.nearAlpha, LABEL.farAlpha, k) };
}

// Which labels stay longest where they'd crowd each other: every 40 ft (0),
// then every 20 (1), every 10 (2), then the 5s between (3).
export function markRank(ft) {
  return ft % 40 === 0 ? 0 : ft % 20 === 0 ? 1 : ft % 10 === 0 ? 2 : 3;
}
// How a distance label is drawn where the line runs away into the distance
// and the marks crowd together: 5 ft of the line there is `px5` pixels long
// on screen, and a label reaches `reach` times its height along the line
// (1 where the line runs up the picture; its width over its height where
// the line runs across, side-on). Each takes no more than LABEL.fill of the
// room (so they shrink steadily into the distance), but is never smaller
// than LABEL.minPx: where they'd have to be, the 5s make way, then the 10s,
// then the 20s, so none overlaps another. { px (its height), alpha }, from
// labelLook at `depth` metres.
export function labelFit(ft, depth, px5, reach = 1) {
  const look = labelLook(depth);
  const room = px5 / Math.max(1, reach);
  // How much each rank shows: by whether its gap (5, 10, 20 ft) has room.
  const shows = [5, 10, 20].map((gapFt) => smoothstep(1, 1.3, (room * gapFt) / 5 / LABEL.minPx));
  const px = Math.min(look.px, Math.max(LABEL.minPx, LABEL.fill * room));
  const rank = markRank(ft);
  return { px, alpha: look.alpha * (rank === 0 ? 1 : shows[3 - rank]) };
}

// ---- The grid on screen ---------------------------------------------------------------

// The grid's lines are drawn a set number of pixels wide wherever they are
// (pixels of a 1080-line picture, so the same share of any screen); the
// finer lines fade out where the grid packs together in the distance, the
// 2 ft ones first, then every other one of the rest, leaving every 8 ft;
// the pace markers grow with distance.
export const GRID = {
  spacing: 3 * FOOT,
  widthPx: 2.3,
  majorPx: 3.1,
  tickPx: 3.6,
  tickHalf: 0.25,
  lineAlpha: 0.42,
  farAlpha: 0.15,
  // Even the 8 ft lines, packed tighter than this (pixels apart), fade down
  // to `packedAlpha`: at the far end of a long putt from a low camera.
  packedFrom: 4,
  packedTo: 9,
  packedAlpha: 0.35,
  // Pixels between neighbouring lines at which the finer ones start to go,
  // and are gone.
  lodTo: 11,
  lodFrom: 6,
};

// Which lines go first as the grid packs together: every 8 ft from the line
// through the ball stays (0), every 4 ft between goes next (1), the 2 ft
// lines between those go first (2). `i` counts lines from the one through
// the ball, either way.
export function lineLevel(i) {
  const k = ((Math.round(i) % 4) + 4) % 4;
  return k === 0 ? 0 : k === 2 ? 1 : 2;
}
// A marker's piece of line (between two crossings), counted from the ball
// the same way: one in each 8 ft stays longest, one more in each 4 ft next,
// so a thinned grid keeps a marker between each two lines still showing.
export function pieceLevel(k) {
  const m = ((Math.round(k) % 4) + 4) % 4;
  return m === 1 ? 0 : m === 3 ? 1 : 2;
}
// How much of a line (or marker) of that level shows, with neighbouring 2 ft
// lines `px` pixels apart on screen.
export function lodWeight(level, px) {
  if (level <= 0) return lerp(GRID.packedAlpha, 1, smoothstep(GRID.packedFrom, GRID.packedTo, 4 * px));
  return smoothstep(GRID.lodFrom, GRID.lodTo, level === 1 ? 2 * px : px);
}
// How many 2 ft steps apart the lines that still show are, with the 2 ft
// lines `px` pixels apart: 1, 2 or 4.
export function visibleStep(px) {
  if (lodWeight(2, px) >= 0.5) return 1;
  return lodWeight(1, px) >= 0.5 ? 2 : 4;
}

// Radians per pixel of a 1080-line picture, for a vertical field of view.
export function radPerPx(fovDeg) {
  return (2 * Math.tan((fovDeg * Math.PI) / 360)) / 1080;
}
// How long a short piece of ground `w` ([x, y, z], metres) looks on screen,
// in pixels of a 1080-line picture, seen from `dist` metres away along
// `ray` (a unit vector from it to the camera).
export function spanPx(w, ray, dist, fovDeg) {
  const d = w[0] * ray[0] + w[1] * ray[1] + w[2] * ray[2];
  const across = Math.hypot(w[0] - d * ray[0], w[1] - d * ray[1], w[2] - d * ray[2]);
  return across / (dist * radPerPx(fovDeg));
}

// A pace marker: an arrow MARKER.length long and MARKER.width wide lying on
// the green. Drawn from afar, it's
//   scale     made bigger with distance so it stays about MARKER.px long
//             on screen (never smaller than close to; at most maxScale)
//   stretch   drawn longer towards the camera where the view is low, as
//             words on a road are painted long, so it keeps its shape
//             rather than squashing flat (up to maxStretch)
// each held to the room its piece of the grid has: `room` metres across
// the view and `roomDeep` along it, for a footprint `across` by `deep`
// metres at scale 1. `dist` from the camera, which is `up` metres above it.
// ---- The putt's channel ---------------------------------------------------------------

// The grid, its markers and the slope shading are drawn in full only in a
// channel along the putt - from just behind the ball to a little past the
// hole, wide enough for the break a putt that long might take - and very
// faint beyond it, so the rest of the green doesn't crowd the read.
//   u across the putt, v along it (+v back towards the player; the hole at
//   v = -distance), metres; distance: ball to hole.
// Returns 1 in the channel, CHANNEL.outside well clear of it, smoothly
// between over CHANNEL.soft metres.
// And nothing at all right round the hole (within CHANNEL.clear metres,
// fading in over the next CHANNEL.clearSoft), so the cup and its ring are
// never hidden under the grid.
export const CHANNEL = { behind: 0.9, past: 1.2, half: 0.75, perMetre: 0.1, maxHalf: 2.6, soft: 0.6, outside: 0.1, clear: 0.2, clearSoft: 0.25 };
export function channelWeight(u, v, distance) {
  if (!(distance > 0)) return 1;
  const toHole = Math.hypot(u, v + distance);
  if (toHole < CHANNEL.clear + CHANNEL.clearSoft) {
    const c = Math.max(0, (toHole - CHANNEL.clear) / CHANNEL.clearSoft);
    return c * c * (3 - 2 * c);
  }
  const half = Math.min(CHANNEL.maxHalf, CHANNEL.half + CHANNEL.perMetre * distance);
  const out = Math.max(0, Math.abs(u) - half, v - CHANNEL.behind, -(distance + CHANNEL.past) - v);
  const t = Math.min(1, out / CHANNEL.soft);
  const k = t * t * (3 - 2 * t);
  return 1 + (CHANNEL.outside - 1) * k;
}

// ---- Course greens: the markers kept to the putt, and the real slope ---------------

// A course green's grid covers the whole green, whichever way the putt runs,
// so it had a marker on every piece of line there - thousands of them, all
// but a hundred or so outside the putt's channel. Each of those was faint,
// but together they speckled the whole green, and on real ground every one
// showed a different slope. On a course green only the markers the channel
// shows more than a trace of are kept (weight at least `minWeight`, see
// channelWeight), and never more than `cap` of them - the ones showing most
// first - so a long putt's grid can't grow into a haze. The lines stay, as
// faint as ever beyond the channel. The practice green keeps them all: its
// grid is only the width of the putt's own ground.
export const COURSE_MARKERS = { minWeight: 0.2, cap: 900 };
// Which markers stay, by how much of each the channel shows (`weights`, in
// order): their indices, in that same order.
export function pickMarkers(weights, { minWeight = COURSE_MARKERS.minWeight, cap = COURSE_MARKERS.cap } = {}) {
  const keep = [];
  weights.forEach((w, i) => {
    if (w >= minWeight) keep.push(i);
  });
  if (keep.length <= cap) return keep;
  return keep
    .sort((a, b) => weights[b] - weights[a] || a - b)
    .slice(0, cap)
    .sort((a, b) => a - b);
}

// Real ground (LiDAR) is kept as heights a metre or so apart, joined
// straight between; its slope jumps at every one of those joins, and the
// survey's own roughness adds more. A marker reading the slope right where
// it is showed that - neighbours a couple of feet apart coloured and running
// differently - rather than the way the green really falls. So on real
// ground a marker reads the slope smoothed over a couple of cells: a
// weighted average of the slope at 5 x 5 points `radius` metres either side
// at most (weights 1 4 6 4 1 each way, so the middle counts most). Points off
// the green are left out (the bank beside it isn't the green's slope); the
// middle always counts. With no radius, the slope right there.
export function smoothGradient(gradientAt, x, z, radius, inside = null) {
  if (!(radius > 0)) return gradientAt(x, z);
  const W = [1, 4, 6, 4, 1];
  let sx = 0;
  let sz = 0;
  let sw = 0;
  for (let i = -2; i <= 2; i++) {
    for (let j = -2; j <= 2; j++) {
      const px = x + (i * radius) / 2;
      const pz = z + (j * radius) / 2;
      if ((i || j) && inside && !inside(px, pz)) continue;
      const w = W[i + 2] * W[j + 2];
      const [gx, gz] = gradientAt(px, pz);
      sx += w * gx;
      sz += w * gz;
      sw += w;
    }
  }
  return [sx / sw, sz / sw];
}
// How far to smooth the slope for the markers, for ground kept as heights
// `cell` metres apart: two cells (on Harding Park's 1 m survey, a smaller
// radius still left neighbouring markers a colour apart), never less than
// three grid squares, never more than SMOOTH_MAX - further would start to
// hide break a putt does feel. Nothing to smooth on a green that's worked
// out rather than surveyed (no cell): its slopes are already smooth. The
// ball itself still rolls on the ground as it is; this is only the read.
export const SMOOTH_MAX = 3;
export function slopeSmoothing(cell) {
  return cell > 0 ? clamp(2 * cell, 3 * GRID.spacing, SMOOTH_MAX) : 0;
}
// A marker's slope is read at SLOPE_SAMPLES + 1 points evenly along its
// piece of line when the grid is made (smoothing each every frame would cost
// too much), and between them as it runs: `samples` [[gx, gz], ...] from one
// end to the other, `t` 0 - 1 along it.
export const SLOPE_SAMPLES = 8;
export function slopeAlong(samples, t) {
  const n = samples.length - 1;
  if (n <= 0) return samples[0];
  const k = clamp(t, 0, 1) * n;
  const i = Math.min(n - 1, Math.floor(k));
  const f = k - i;
  const a = samples[i];
  const b = samples[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}

// (Bigger and brighter on the projector - the owner, twice: "still need
// bigger and brighter circle identifiers": px 22 -> 30, the far ones
// fading to half rather than a third.)
export const MARKER = { length: 0.115, width: 0.084, px: 30, maxScale: 4.5, lean: 0.4, maxStretch: 3.2, fill: 0.8, near: 8, far: 16, farAlpha: 0.5 };

// The grid turned to a new aim (the owner: "need to redraw gridline when
// moving the screen left or right"): squared to the putt as it's first
// shown, it's drawn again along the aim once the aim has been turned and
// then left alone for `settle` seconds - not at every nudge while an arrow
// is held. Turns smaller than `turn` (radians) leave it be.
export const REGRID = { settle: 2, turn: 0.002 };
export function regridDue({ builtAim, aim, still }) {
  if (builtAim == null || aim == null) return false;
  return Math.abs(aim - builtAim) > REGRID.turn && still >= REGRID.settle;
}
// The markers fade with distance from the camera, as the lines do (GRID
// lineAlpha to farAlpha): in full out to MARKER.near metres, down to
// MARKER.farAlpha by MARKER.far - the owner: "the far markers faded, so I
// (look along the line a section at a time) is the way to see the far part
// of the putt". From a stop along the line they're near again.
export function markerFade(dist) {
  return lerp(1, MARKER.farAlpha, smoothstep(MARKER.near, MARKER.far, dist));
}
export function markerLook({ dist, up, fovDeg = 45, across = MARKER.width, deep = MARKER.length, room = Infinity, roomDeep = Infinity }) {
  let scale = clamp((MARKER.px * radPerPx(fovDeg) * dist) / MARKER.length, 1, MARKER.maxScale);
  scale = Math.max(1, Math.min(scale, (MARKER.fill * room) / across));
  const sinUp = clamp(up / Math.max(dist, 1e-6), 1e-3, 1);
  let stretch = clamp(MARKER.lean / sinUp, 1, MARKER.maxStretch);
  stretch = Math.max(1, Math.min(stretch, (MARKER.fill * roomDeep) / (deep * scale)));
  return { scale, stretch };
}

// ---- Slope shading ----------------------------------------------------------------------

// The pace markers' colours by slope (percent): flat blue, through green,
// yellow and orange, to red.
export const SLOPE_STOPS = [
  [0, "#8fd3ff"],
  [1, "#5ee38a"],
  [2, "#f5d547"],
  [3, "#ff9a3c"],
  [4.5, "#ff4d4d"],
];
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

// The slope shading's colour at `percent`: [r, g, b, a], sRGB 0-1. Clear
// under SHADE.from, then the markers' colours, more opaque as it steepens,
// up to SHADE.alpha at SHADE.full percent - a tint, never a coat of paint.
export const SHADE = { from: 0.75, full: 3.5, alpha: 0.5 };
export function shadeColor(percent) {
  const p = Math.abs(percent);
  let c = rgb(SLOPE_STOPS[SLOPE_STOPS.length - 1][1]);
  if (p <= SLOPE_STOPS[0][0]) c = rgb(SLOPE_STOPS[0][1]);
  else {
    for (let i = 1; i < SLOPE_STOPS.length; i++) {
      if (p <= SLOPE_STOPS[i][0]) {
        const [p0, h0] = SLOPE_STOPS[i - 1];
        const [p1, h1] = SLOPE_STOPS[i];
        const a = rgb(h0);
        const b = rgb(h1);
        const k = (p - p0) / (p1 - p0);
        c = a.map((v, j) => lerp(v, b[j], k));
        break;
      }
    }
  }
  return [...c, SHADE.alpha * smoothstep(SHADE.from, SHADE.full, p)];
}
