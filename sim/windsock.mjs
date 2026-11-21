// A windsock by every course tee and the range's tee line: where it stands
// and how it flies (look/windsock.js draws it). Pure.
//
// Where: beside the tee sign (sim/signs.mjs signsFor), on its side of the
// hole (the cart path's side, else the left), a few metres back from it
// towards the tee, so from the golfer's own camera it stands in the upper
// corner of the picture, 8 - 16 m away - the one close wind cue in that
// view (the flag is a speck at 150 yards and more). Clear of the tee, the
// fairway, sand, water, the green, the cart path, the sign itself and the
// camera. None in the Challenges or on the practice greens: only the course
// (course.js) and the range (range.js) put one up.
//
// How: it hangs limp down its pole in a calm, fills and lifts as the wind
// rises, flies level from about 17 mph (a real sock's 15 knots), and
// swings round with the gusts (sockPose, sockPoint).
//
// Hole frame (sim/course.mjs): the tee at (0, 0), x down the hole, z to the
// right, metres.

import { makePath, surfaceAt } from "./course.mjs";
import { gapToPaths } from "./paths.mjs";
import { TEE_VIEW } from "./signs.mjs";

// The sock and its pole (metres).
export const SOCK = { pole: 4.2, length: 1.5, mouth: 0.2, tail: 0.08 };
// How far from the golfer's camera it may stand (metres), and the widest
// it may be off the camera's line down the hole and still be seen (a 50°
// camera on a 16:9 picture shows about 39° either side).
// (and at least `least` off it, clear of the line of play).
export const SOCK_VIEW = { near: 8, far: 16, angle: 0.64, least: 0.3 };
// Kept at least this far (metres) from the tee sign, the cart path, the
// middle of the tee.
export const SOCK_CLEAR = { sign: 3, path: 1.5, tee: 6 };

// What it never stands on.
const KEEP_OFF = new Set(["fairway", "tee", "bunker", "greenside", "waste", "water", "green", "fringe", "path"]);
const r2 = (v) => Math.round(v * 100) / 100;

// Where a hole's windsock stands, [x, z], given its tee sign (signsFor's
// `tee`, { at: [x, z] }) - or null with no tee sign, or nowhere clear.
export function windsockSpot(L, sign) {
  if (!sign?.at) return null;
  const path = makePath(L.path);
  const [sx, sz] = sign.at;
  const side = Math.sign(sz) || -1;
  let best = null;
  // Back from the sign towards the tee, on its side of the hole: nearest a
  // few metres behind it, in the golfer's view (off the line of play by
  // SOCK_VIEW.least - SOCK_VIEW.angle), where that's clear.
  const want = [sx - 6, sz];
  for (let x = 1; x <= sx; x += 0.5) {
    for (let out = 3; out <= Math.abs(sz) + 4; out += 0.5) {
      const z = side * out;
      const d = Math.hypot(x - TEE_VIEW[0], z - TEE_VIEW[1]);
      if (d < SOCK_VIEW.near || d > SOCK_VIEW.far) continue;
      if (Math.hypot(x - sx, z - sz) < SOCK_CLEAR.sign) continue;
      if (Math.hypot(x, z) < SOCK_CLEAR.tee) continue;
      const off = Math.abs(Math.atan2(z - TEE_VIEW[1], x - TEE_VIEW[0]));
      const seen = off >= SOCK_VIEW.least && off <= SOCK_VIEW.angle;
      const score = Math.hypot(x - want[0], z - want[1]) + (seen ? 0 : 100);
      if (best && score >= best.score) continue;
      if (KEEP_OFF.has(surfaceAt(L, x, z, path))) continue;
      if (gapToPaths(L.paths, x, z, SOCK_CLEAR.path + 0.01) <= SOCK_CLEAR.path) continue;
      best = { score, at: [r2(x), r2(z)] };
    }
  }
  return best ? best.at : null;
}

// The range's: beside the tee line, off to the right of the mats, at the
// edge of the tee camera's picture (world metres, as range.js lays out) -
// on a 16:10 screen as well as 16:9, from the golfer's eye (sim/eye.mjs).
export const RANGE_SOCK = [16, -18];

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
// Hanging this far (radians) off straight down in a dead calm.
const HANG = 0.1;

// How it flies in the wind this moment (mph, gusts and all):
//   lift   radians its line is raised from hanging straight down the pole
//          (pi/2: level)
//   fill   how full it is, 0 (a limp rag) - 1 (a full cone)
//   amp    how far the ripples along it throw it (metres)
//   speed  how fast they run (radians a second)
//   swing  how far (radians) the gusts swing it round either side
export function sockPose(mph) {
  const m = Math.max(0, Number.isFinite(mph) ? mph : 0);
  const up = smooth(0.5, 17, m);
  return {
    lift: HANG + (Math.PI / 2 - HANG) * up ** 0.85,
    fill: 0.2 + 0.8 * smooth(1, 15, m),
    amp: 0.012 + 0.05 * smooth(2, 9, m) * (1 - 0.6 * smooth(15, 28, m)),
    speed: Math.min(18, 3 + 0.55 * m),
    swing: 0.28 * smooth(3, 10, m) * (1 - 0.5 * smooth(18, 30, m)),
  };
}

// A point of the sock: u along it (0 its mouth at the pole, 1 its tail), a
// round it (radians), in its own frame - the mouth at the origin, +x the
// way the wind blows, y up. t: seconds (and its own phase).
export function sockPoint(u, a, pose, t) {
  const [cx, cy, cz] = sockAxis(u, pose, t);
  const taper = SOCK.mouth + (SOCK.tail - SOCK.mouth) * u;
  // A limp sock collapses towards its tail; a full one keeps its cone.
  const r = taper * (pose.fill + (1 - pose.fill) * (1 - u) * 0.6) * (1 + 0.25 * pose.amp * 10 * u * Math.sin(t * pose.speed * 1.3 - u * 9 + a * 2));
  // Round the axis: across it (z) and in the plane of its droop.
  const ang = sockAngle(u, pose);
  const nx = -Math.sin(ang);
  const ny = Math.cos(ang);
  return [cx + Math.cos(a) * r * nx, cy + Math.cos(a) * r * ny, cz + Math.sin(a) * r];
}

// Its line's angle from level at u (negative: pointing down): a limp sock
// sags more towards its tail.
function sockAngle(u, pose) {
  const lift = pose.lift * (1 - (1 - pose.fill) * 0.45 * u);
  return lift - Math.PI / 2;
}

// Its middle line at u: [x, y, z], summed out from the mouth, with a ripple
// running along it.
export function sockAxis(u, pose, t) {
  const n = Math.max(1, Math.ceil(u * 12));
  const du = u / n;
  let x = 0;
  let y = 0;
  for (let i = 0; i < n; i++) {
    const ang = sockAngle((i + 0.5) * du, pose);
    x += Math.cos(ang) * du * SOCK.length;
    y += Math.sin(ang) * du * SOCK.length;
  }
  const z = pose.amp * u * Math.sin(t * pose.speed - u * 6);
  return [x, y, z];
}
