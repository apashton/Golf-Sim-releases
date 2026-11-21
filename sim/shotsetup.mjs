// The shot set up before a made-up swing (the owner, 23 October 2026: "how
// can we make it a bit more technical like the golf games out there which
// work with controller"): which way it curves, how high it flies and how
// much it spins - picked on the shot setup (a controller's Y, the swing
// pad's Shot button or the phone's Shot setup: shotsetupcard.js), then
// swung as any other. It lasts the one shot.
//
// On the card it's a ball and a bar (the owner, 30 October 2026: "We need
// a visual guide for the ball spin, a small element is free but extreme
// spins indicate the swing will penalise more if the shot is wrong. Height
// needs to be a vertical bar, same that an element is free but trying to
// go very high or low does the same indicator of risk of penalty"):
//
//   shape   -2 to 2 (tenths): a big curve left, a curve left, straight, a
//           curve right, a big curve right - the spin axis it's struck
//           with, and started off line the other way so it lands where
//           it's aimed. The ball's dot across (shape / 2).
//   spin    -1 to 1 (twentieths): less to more backspin. The dot down the
//           ball (more backspin struck lower). The dot stays on the ball,
//           so the most curve and the most spin aren't both had.
//   height  -2 to 2 (tenths): a punch (or bump and run near the green),
//           low, normal, high, very high (a flop with a wedge near the
//           green) - the launch, with less spin low and a little more
//           high, and a little less speed either end (a punch is a shorter
//           swing, a flop an open face), so each carries less than a
//           normal one. The bar.
//
// A little of each is free: within FREE of the way out from the middle,
// no price. Beyond it the risk climbs to 1 at the edge (setupRisk), shown
// on the card as it's picked, and the price with it (sim/skills.mjs
// setupHarshness). What each does to the ball is setupBall's; the shot it
// makes is madeshot.mjs's. Pure.

import { clamp } from "./mathutil.mjs";

// The rows each is between (a value between two is that far between them).
export const SHAPES = [
  { value: -2, axis: -20 },
  { value: -1, axis: -9 },
  { value: 0, axis: 0 },
  { value: 1, axis: 9 },
  { value: 2, axis: 20 },
];
export const HEIGHTS = [
  { value: -2, vla: 0.55, spin: 0.65, speed: 0.9 },
  { value: -1, vla: 0.78, spin: 0.85, speed: 0.96 },
  { value: 0, vla: 1, spin: 1, speed: 1 },
  { value: 1, vla: 1.2, spin: 1.08, speed: 0.98 },
  { value: 2, vla: 1.45, spin: 1.15, speed: 0.92 },
];
export const SPINS = [
  { value: -1, spin: 0.7 },
  { value: 0, spin: 1 },
  { value: 1, spin: 1.3 },
];
// A launch no club gets higher than, and the most backspin anyone puts on it.
const MOST_VLA = 55;
const MOST_SPIN = 11000;

// How far out from the middle (of the ball, of the bar) is free, and the
// risk past which it's high rather than some.
export const FREE = 0.25;
export const SOME_RISK = 0.5;
// The steps each moves in: a twentieth of the way to the edge.
const STEPS = 20;

export const PLAIN = Object.freeze({ shape: 0, height: 0, spin: 0 });

// (-0 is 0.)
const steps = (v, per) => Math.round(v * STEPS) / per || 0;

// A setup made sound: within the ball and the bar, in their steps; anything
// that isn't a number plain.
export function cleanSetup(s) {
  const num = (v) => (Number.isFinite(v) ? v : 0);
  let x = clamp(num(s?.shape) / 2, -1, 1);
  let y = clamp(num(s?.spin), -1, 1);
  const r = Math.hypot(x, y);
  if (r > 1) {
    x /= r;
    y /= r;
  }
  // (Rounded back out past the ball's edge: the step inside.)
  const out = Math.hypot(Math.round(x * STEPS), Math.round(y * STEPS)) > STEPS;
  const step = (v) => (out ? Math.trunc(v * STEPS) : Math.round(v * STEPS)) / STEPS;
  return { shape: steps(step(x), STEPS / 2), height: steps(clamp(num(s?.height) / 2, -1, 1), STEPS / 2), spin: steps(step(y), STEPS) };
}
export const isPlain = (s) => !s || (!s.shape && !s.height && !s.spin);

// A row's number at v, between the two rows either side.
function between(list, v, key) {
  const i = clamp(Math.floor(v - list[0].value), 0, list.length - 2);
  const [a, b] = [list[i], list[i + 1]];
  return a[key] + (b[key] - a[key]) * clamp((v - a.value) / (b.value - a.value), 0, 1);
}

// The ball as the setup strikes it: { speedMph, vla, hla, totalSpin,
// spinAxis } with its speed, launch, spin and curve changed (the start
// line is the swing's).
export function setupBall(ball, setup) {
  const s = cleanSetup(setup);
  return {
    ...ball,
    speedMph: ball.speedMph * between(HEIGHTS, s.height, "speed"),
    vla: Math.min(MOST_VLA, ball.vla * between(HEIGHTS, s.height, "vla")),
    totalSpin: Math.min(MOST_SPIN, ball.totalSpin * between(HEIGHTS, s.height, "spin") * between(SPINS, s.spin, "spin")),
    spinAxis: (ball.spinAxis ?? 0) + between(SHAPES, s.shape, "axis"),
  };
}

// The risk the setup takes: { ball, height } each 0 (free) to 1 (the
// edge), and how much of the ball's is the curve's (curve, 0 - 1: the
// rest is the spin's).
export const riskOf = (reach) => clamp((reach - FREE) / (1 - FREE), 0, 1);
export function setupRisk(setup) {
  const s = cleanSetup(setup);
  const x = s.shape / 2;
  const far = x * x + s.spin * s.spin;
  return { ball: riskOf(Math.sqrt(far)), height: riskOf(Math.abs(s.height) / 2), curve: far ? (x * x) / far : 0 };
}
// Where it sits on the card: the ball's dot ({ x, y }, -1 to 1 across and
// down from the middle) and the bar's marker (0 at the top, 1 at the foot).
export function dotOf(setup) {
  const s = cleanSetup(setup);
  return { x: s.shape / 2, y: s.spin };
}
export const barOf = (setup) => (1 - cleanSetup(setup).height / 2) / 2;
// And back: the setup with its dot, or its bar's marker, put there.
export const withDot = (setup, x, y) => cleanSetup({ ...cleanSetup(setup), shape: x * 2, spin: y });
export const withBar = (setup, t) => cleanSetup({ ...cleanSetup(setup), height: (1 - 2 * t) * 2 });

// Its warning on the card: "free", "some" or "high", and the words for it.
export const riskTone = (risk) => (!(risk > 0) ? "free" : risk <= SOME_RISK ? "some" : "high");
export const RISK_WORDS = { free: "Free", some: "Some risk", high: "High risk" };

// Its words: "Straight", "Draw", "Big fade", for a right-hander (a
// left-hander's draw curves right).
export function shapeName(shape, hand = "right") {
  const v = Number(shape) || 0;
  if (!v) return "Straight";
  const left = v < 0;
  const draw = hand === "left" ? !left : left;
  const a = Math.abs(v);
  const name = a > 1.4 ? (draw ? "Hook" : "Slice") : a > 0.6 ? (draw ? "Draw" : "Fade") : draw ? "Slight draw" : "Slight fade";
  return `${name} (curves ${left ? "left" : "right"})`;
}
// near: the green's close (a part swing near it), so a punch is a bump and
// run and a very high shot with a wedge a flop.
export function heightName(height, { near = false, wedge = false } = {}) {
  const h = Number(height) || 0;
  if (h < -1.4) return near ? "Bump and run" : "Punch";
  if (h < -0.6) return "Low";
  if (h < 0) return "A little low";
  if (!h) return "Normal height";
  if (h <= 0.6) return "A little high";
  if (h <= 1.4) return "High";
  return near && wedge ? "Flop" : "Very high";
}
export function spinName(spin) {
  const v = Number(spin) || 0;
  if (!v) return "Normal spin";
  const more = v > 0 ? "more" : "less";
  return Math.abs(v) > 0.5 ? `${more[0].toUpperCase()}${more.slice(1)} spin` : `A little ${more} spin`;
}

// The setup in a few words for the swing pad: "Punch, draw", or "" when
// it's a plain shot.
export function setupWords(setup, opts = {}) {
  const s = cleanSetup(setup);
  if (isPlain(s)) return "";
  const parts = [];
  if (s.height) parts.push(heightName(s.height, opts));
  if (s.shape) parts.push(shapeName(s.shape, opts.hand).replace(/ \(.*\)$/, "").toLowerCase());
  if (s.spin) parts.push(spinName(s.spin).toLowerCase());
  const words = parts.join(", ");
  return words[0].toUpperCase() + words.slice(1);
}
