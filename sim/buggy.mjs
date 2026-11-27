// The cart ride between holes (course/buggy.js draws it; the owner, 22
// October 2026: "end of a hole getting into a buggy that drives to the
// next hole the camera pans up to the screen which comes from the top of
// the buggy driving area and zoom in, it shows the current scorecard with
// the sides still showing the maps but blurred as it drives to the next
// hole (to allow for loading whilst blurred.) once hole is loaded user can
// click on next hole, or continue to watch the cart drive to the tee box
// before clicking next hole").
//
// A hole done, a cart waits by the green; the camera comes round behind
// it, gets in, and looks up at the screen hanging from the roof over the
// driver, closing in until the screen - the round's scorecard on it - fills
// the middle of the picture, the course round it blurred. The cart drives
// on to the next tee meanwhile, along the cart paths, and parks beside it
// (sim/cartway.mjs), and the next hole is finished behind the blur.
// Once it's ready, Next hole; or Watch the drive - out of the cart, the blur
// gone, following it.
//
// Pure: the cart's way and its speed along it, the camera's shots in the
// cart's own frame and when it's on each, and how blurred the picture is.
// The cart's frame: x to its right, y up, z to its back (it drives along
// -z, as a camera looks).

import { clamp } from "./mathutil.mjs";

export const RIDE = Object.freeze({
  // Driving: cruising speed (metres a second, about 16 mph), and how
  // quickly it gets up to it and stops. A long way to the tee is driven
  // quicker (rideSpeed): about `drive` seconds of it, up to `fastest`
  // (about 27 mph); a way longer than `most` metres is begun that far
  // short of the tee (trimWay), so it's always there in good time.
  speed: 7,
  accel: 2.4,
  drive: 27,
  fastest: 12,
  most: 360,
  // The camera, seconds: round behind the cart, into its seat, then up to
  // the screen closing in. The cart sets off while the camera's getting
  // in.
  approach: 1.8,
  board: 1.5,
  pan: 2.4,
  setOff: 2.6,
  // Out of the cart to follow it (Watch the drive), or back to the screen.
  ease: 1.6,
  // The blur round the screen at its strongest (CSS pixels at a picture
  // 1080 high).
  blur: 9,
  // The picture's width the camera narrows to at the screen (degrees).
  zoomFov: 40,
  // The front wheels turned at most this far either way (radians, about
  // 34 degrees), as a cart's steering goes.
  steerMost: 0.6,
  // Where the camera is in each of its shots, and what it looks at, in
  // the cart's frame (metres): getting in, behind and to the right; in
  // the seat (between the two), looking ahead; at the screen; following
  // the cart.
  shots: {
    board: { at: [2.7, 2.7, 7.2], look: [0, 1.0, -1.2] },
    seat: { at: [0, 1.36, 0.22], look: [0, 1.2, -12] },
    screen: { at: [0, 1.36, 0.22], look: [0, 1.5, -0.38] },
    chase: { at: [0, 3.6, 9.5], look: [0, 1.0, -7] },
  },
  // On to the next hole by itself (rideOnAt): this long into the ride
  // (seconds) with the cart parked by the tee, or, still driving then,
  // this long after it parks; the screen counts down the last of it.
  onAfter: 40,
  parked: 5,
  countdown: 10,
  // The screen: its middle in the cart's frame, its size (metres) - a
  // screen hanging on an arm from the front of the roof, in the middle,
  // facing back at the seats, tipped a little down to them; low enough
  // that the course shows all round it from the seat, not the roof.
  screen: { at: [0, 1.5, -0.38], w: 0.46, h: 0.27, tip: 0.12 },
});

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const ease = (t) => {
  const k = clamp01(t);
  return k * k * (3 - 2 * k);
};

// ---- The way -----------------------------------------------------------------------------

// Where the cart waits and the way it drives: sim/cartway.mjs (cartRide).

// How fast the cart drives a way `length` metres long (metres a second):
// RIDE.speed, or on a long way quicker - about RIDE.drive seconds of
// driving, never faster than RIDE.fastest - so it's at the tee before the
// ride goes on by itself (rideOnAt).
export function rideSpeed(length) {
  if (!(length > 0)) return RIDE.speed;
  return clamp(length / RIDE.drive, RIDE.speed, RIDE.fastest);
}

// The last `most` metres of a way ([[x, z], ...]): where the cart begins
// on a way too long to drive in good time - partway along it, so it still
// ends by the tee. A way no longer is as it was.
export function trimWay(points, most = RIDE.most) {
  if (points.length < 2) return points;
  let left = most;
  for (let i = points.length - 1; i > 0; i--) {
    const [ax, az] = points[i - 1];
    const [bx, bz] = points[i];
    const d = Math.hypot(bx - ax, bz - az);
    if (d >= left) {
      const k = d > 0 ? left / d : 0;
      return [[bx + (ax - bx) * k, bz + (az - bz) * k], ...points.slice(i)];
    }
    left -= d;
  }
  return points;
}

// A way measured along: its points and the distance to each.
export function measureWay(points) {
  const cum = [0];
  for (let i = 1; i < points.length; i++) cum.push(cum[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  return { points, cum, length: cum.at(-1) };
}

function pointAt(way, s) {
  const { points, cum, length } = way;
  const d = Math.max(0, Math.min(length, s));
  let i = 1;
  while (i < cum.length - 1 && cum[i] < d) i++;
  const span = cum[i] - cum[i - 1] || 1;
  const k = (d - cum[i - 1]) / span;
  const a = points[i - 1];
  const b = points[i];
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
}

// Where the cart is `s` metres along its way, and the way it faces: along
// the way, turning through a bend over a few metres rather than at once
// (the line from a little behind to a little ahead).
export function wayAt(way, s) {
  const at = pointAt(way, s);
  const back = pointAt(way, s - 2.5);
  const ahead = pointAt(way, s + 3.5);
  let fx = ahead[0] - back[0];
  let fz = ahead[1] - back[1];
  const f = Math.hypot(fx, fz);
  if (f < 1e-6) {
    const a = way.points[0];
    const b = way.points.at(-1);
    fx = b[0] - a[0];
    fz = b[1] - a[1];
  }
  const n = Math.hypot(fx, fz) || 1;
  return { at, facing: [fx / n, fz / n] };
}

// How far along a way of `length` the cart has gone `t` seconds after
// setting off: up to speed, along, slowing to a stop at its end.
export function driven(t, length, { speed = RIDE.speed, accel = RIDE.accel } = {}) {
  if (!(t > 0) || !(length > 0)) return 0;
  let v = speed;
  let up = v / accel;
  let upD = (v * v) / (2 * accel);
  // Too short to get up to speed: up and straight back down.
  if (2 * upD > length) {
    v = Math.sqrt(accel * length);
    up = v / accel;
    upD = length / 2;
  }
  const cruise = (length - 2 * upD) / v;
  if (t < up) return 0.5 * accel * t * t;
  if (t < up + cruise) return upD + v * (t - up);
  const down = t - up - cruise;
  if (down >= up) return length;
  return length - 0.5 * accel * (up - down) * (up - down);
}

// The seconds a drive along `length` takes.
export function driveTime(length, { speed = RIDE.speed, accel = RIDE.accel } = {}) {
  if (!(length > 0)) return 0;
  const upD = (speed * speed) / (2 * accel);
  if (2 * upD > length) return 2 * Math.sqrt(length / accel);
  return (2 * speed) / accel + (length - 2 * upD) / speed;
}

// How fast it's going `t` seconds after setting off (metres a second):
// driven's own rate - up to speed, along, slowing to a stop - for its
// motor (a recording of a real cart) and its tyres (audio/cart.js).
export function driveSpeed(t, length, { speed = RIDE.speed, accel = RIDE.accel } = {}) {
  if (!(t > 0) || !(length > 0)) return 0;
  let v = speed;
  let up = v / accel;
  if ((v * v) / accel > length) {
    v = Math.sqrt(accel * length);
    up = v / accel;
  }
  const cruise = (length - v * up) / v;
  if (t < up) return accel * t;
  if (t < up + cruise) return v;
  const down = t - up - cruise;
  return down >= up ? 0 : accel * (up - down);
}

// ---- The wheels ----------------------------------------------------------------------------

// Where they stand in the cart's frame (x either side, z front and back -
// the front at -z), their radius and width: both carts draw them there
// (look/buggy.js, look/buggyfine.js).
export const WHEELS = Object.freeze({ x: 0.56, z: Object.freeze([-0.82, 0.86]), r: 0.22, w: 0.17 });

// How far round a wheel has turned `rolled` metres along (radians about
// its axle, the cart's x): driving along -z, its top rolls forward.
export const wheelSpin = (rolled, r = WHEELS.r) => -rolled / r;

// The front wheels' turn `s` metres along the way (radians, + to the
// left): the way the cart's turning there - its facing a metre either
// side (wayAt) - over its wheelbase, as a car's steering does it, up to
// RIDE.steerMost either way.
export function wheelSteer(way, s, base = WHEELS.z[1] - WHEELS.z[0]) {
  const yaw = (u) => {
    const [fx, fz] = wayAt(way, u).facing;
    return Math.atan2(-fx, -fz);
  };
  const d = 1;
  const turn = yaw(s + d) - yaw(s - d);
  const k = Math.atan2(Math.sin(turn), Math.cos(turn)) / (2 * d);
  return clamp(Math.atan(base * k), -RIDE.steerMost, RIDE.steerMost);
}

// ---- Its sound -----------------------------------------------------------------------------

// The cart's sound (audio/cart.js), from recordings of real carts (the
// game's own in public/soundpack, from the owner's downloads, or the
// owner's own in the sounds folder), three kinds together:
//   roll    the "cart" sounds: a cart rolling along, looping as it drives -
//           a touch higher and louder the faster it goes, duller and
//           quieter on the grass than on the path
//   hum     the "cart-motor" sounds: an electric cart's low drive hum under
//           it, louder pulling away, eased right off coasting to a stop
//   rattle  the "cart-rattle" sounds: the clubs knocking together in the
//           bag on the back, now and then - never on a beat (cartRattle)
// Silent standing still (no engine ticking over). Quiet: the owner, 27
// October 2026, of the made-up motor whine it had at first: "Cart noise is
// awful. Can we find some actual cart noises and keep it subtle on the
// sound." With no recordings (or Recordings set to made-up sounds only),
// only the tyres: a faint hiss on the path, a duller swish through the
// grass.
//   gain         its level at full speed, steady
//   rate         how fast it's played, from standing to full speed (1 as
//                recorded)
//   pull, coast  its level pulling away and slowing, against a steady speed
//   path, grass  the roll by the ground: muffled above this (Hz), and this
//                much of its level
//   tyres        with no recordings: a band of noise by the ground, its
//                filter swept with speed
// Levels 0 - 1 (the effects' bus; a strike is about 1). The game's own
// recordings are levelled alike (about -25 LUFS), so at these the cart
// from its seat sits a little over the quiet outdoor bed (audio/layers.js)
// at the usual volumes - heard, but some 25 dB under a strike.
export const CART_SOUND = Object.freeze({
  roll: { gain: 0.28, rate: [0.86, 1.06], pull: 1.15, coast: 0.8, path: { cutoff: 12000, gain: 1 }, grass: { cutoff: 2200, gain: 0.8 } },
  hum: { gain: 0.13, rate: [0.8, 1.12], pull: 1.5, coast: 0.35 },
  tyres: {
    path: { type: "bandpass", gain: 0.035, from: 600, to: 1700, q: 0.7 },
    grass: { type: "lowpass", gain: 0.05, from: 260, to: 700, q: 0.9 },
  },
  // Heard at full strength within this of the camera (metres): from the
  // seat, and fading as it drives off (audio/engine.js spatial).
  near: 6,
});

// What the cart sounds like going `speed` (metres a second), its speed
// rising (accel > 0) or falling, on `surface` ("path", or anything else
// as grass): { roll: { rate, gain, cutoff }, hum: { rate, gain },
// tyres: { type, freq, q, gain } }.
export function cartSound(speed, { accel = 0, surface = "grass" } = {}) {
  const v = clamp01(speed / RIDE.speed);
  const moving = speed > 0.05;
  const path = surface === "path";
  // Pulling away: louder. Slowing: the motor eased off, quieter.
  const load = (L) => (accel > 0 ? 1 + (L.pull - 1) * clamp01(accel / RIDE.accel) : accel < 0 ? L.coast : 1);
  const rate = (L) => L.rate[0] + (L.rate[1] - L.rate[0]) * v;
  const R = CART_SOUND.roll;
  const ground = path ? R.path : R.grass;
  const H = CART_SOUND.hum;
  const T = path ? CART_SOUND.tyres.path : CART_SOUND.tyres.grass;
  return {
    roll: { rate: rate(R), gain: moving ? R.gain * ground.gain * Math.sqrt(v) * load(R) : 0, cutoff: ground.cutoff },
    hum: { rate: rate(H), gain: moving ? H.gain * Math.sqrt(v) * load(H) : 0 },
    tyres: { type: T.type, freq: T.from + (T.to - T.from) * v, q: T.q, gain: moving ? T.gain * v : 0 },
  };
}

// The clubs rattling in the bag (cartRattle): now and then as the cart
// goes over the bumps - by chance, so never on a beat (the owner: "the golf
// club rattling should be Inconsistent") - more often on the grass and the
// faster it goes, and sometimes as it pulls away or stops.
//   every     seconds between them on average at full speed, by the ground
//             (half as often at half speed)
//   slowest   none slower than this (metres a second), but for setting off
//             and stopping
//   moving    faster than this, it's moving: crossing it is setting off or
//             stopping
//   start, stop   the chance of one as it sets off, and as it stops
//   least     never sooner than this after the last (seconds)
//   gain      one's level at full speed, at random between these (most of a
//             roll's at a crawl)
//   rate      played this fast, at random between these (1 as recorded)
export const CART_RATTLE = Object.freeze({
  every: { path: 14, grass: 6 },
  slowest: 1.2,
  moving: 0.3,
  start: 0.5,
  stop: 0.4,
  least: 1.6,
  gain: [0.09, 0.22],
  rate: [0.9, 1.1],
});

// One step of the ride's rattles: `state` from the last step (null to
// begin), the cart going `speed` on `surface` for the `dt` seconds since.
// Gives the next state, and play: null, or a rattle to play now
// ({ gain, rate }).
export function cartRattle(state, { speed = 0, surface = "grass", dt = 0 } = {}, rand = Math.random) {
  const C = CART_RATTLE;
  const was = state?.moving ?? false;
  const moving = speed > C.moving;
  const since = (state?.since ?? Infinity) + dt;
  const v = clamp01(speed / RIDE.speed);
  let chance = 0;
  if (moving !== was) chance = moving ? C.start : C.stop;
  else if (speed > C.slowest) chance = 1 - Math.exp((-dt * v) / (surface === "path" ? C.every.path : C.every.grass));
  if (since < C.least || !(chance > 0) || rand() >= chance) return { state: { moving, since }, play: null };
  const between = ([a, b]) => a + (b - a) * rand();
  return { state: { moving, since: 0 }, play: { gain: between(C.gain) * (0.6 + 0.4 * v), rate: between(C.rate) } };
}

// ---- The camera ----------------------------------------------------------------------------

// The camera's shot `t` seconds into the ride: easing `from` one shot `to`
// another, `k` of the way (0 - 1, eased). "start" is where the camera was
// as the ride began; "held", where it was when the player last chose
// (Watch the drive, or back to the screen). watch: null, or { on, at }:
// the last choice - following the cart (on) or back at the screen - and
// when it was made.
// look: how far the camera's turned to look at the new shot's subject (0 -
// 1) - from where it was, sooner than it gets there, so the cart's never
// out of the picture on the way round to it.
export function rideShot(t, watch = null) {
  if (watch && t >= watch.at) {
    const u = (t - watch.at) / RIDE.ease;
    return { from: "held", to: watch.on ? "chase" : "screen", k: ease(u), look: ease(u * 1.6) };
  }
  const { approach, board, pan } = RIDE;
  if (t < approach) return { from: "start", to: "board", k: ease(t / approach), look: ease((t / approach) * 1.8) };
  if (t < approach + board) {
    const k = ease((t - approach) / board);
    return { from: "board", to: "seat", k, look: k };
  }
  const k = ease((t - approach - board) / pan);
  return { from: "seat", to: "screen", k, look: k };
}

// How a ride begins (the owner, 29 October 2026: "Don't zoom in on the
// cart by default, watch the cart and allow the user to click to see the
// scorecard and then it'll zoom in"): from where the camera was out to
// follow the cart, the screen not come up (from 0) - its Scorecard (or a
// tap on the picture) takes the camera into the cart and up to it.
export const rideStart = () => ({ on: true, at: 0, from: 0 });

// How much of the way to the screen the camera is (0 - 1): for its
// narrowing to it, the blur round it and the scorecard coming up on it.
export function screenAmount(t, watch = null) {
  const at = (u) => {
    const { approach, board, pan } = RIDE;
    return ease((u - approach - board) / pan);
  };
  if (!watch || t < watch.at) return at(t);
  const was = watch.from ?? 1;
  const k = ease((t - watch.at) / RIDE.ease);
  return watch.on ? was * (1 - k) : was + (1 - was) * k;
}

// The blur round the screen, CSS pixels for a picture `height` high: none
// until the camera's most of the way there.
export function rideBlur(amount, height = 1080) {
  const k = clamp01((amount - 0.35) / 0.65);
  return Math.round(RIDE.blur * ease(k) * (height / 1080) * 10) / 10;
}

// The picture's width at the screen: from the game's own (fov) to the
// zoom, as far as the camera's got there.
export function rideFov(fov, amount) {
  return fov + (Math.min(fov, RIDE.zoomFov) - fov) * clamp01(amount);
}

// The scorecard on the screen: shown once the camera's nearly there
// (0 - 1, its opacity).
export const cardShown = (amount) => ease((amount - 0.7) / 0.3);

// The picture's centre moved for play (sim/viewoffset.mjs: a golfer down
// one side of the net - a share of the picture's width), as the ride has
// it: slid back to the middle as the camera closes in on the screen, so
// the screen's in the middle of the picture - not drawn off to the side
// and cut off at the edge, its card with it (the owner's projector, 26
// October 2026: "All drawn a bit offline").
export const rideCentre = (share, amount) => share * (1 - clamp01(amount));

// The card over the screen: its middle (x, y) and its scale, for the
// screen's box in a picture w x h (x0, y0, x1, y1, CSS pixels) and the
// card's own size - as big as fits the screen, and never past the
// picture's edges (`margin` of it clear all round), where it would put
// scroll bars on the window.
// (`fill`: a narrow picture - a phone held upright - where the screen is a
// sliver of it and a card its size can't be read: the card as big as the
// picture has room for, over the screen's middle still. cardNarrow says
// when; the card's own layout is narrower there too - style.css.)
export const CARD_NARROW = 640;
export const cardNarrow = (w) => w > 0 && w < CARD_NARROW;
// (And a short one - a phone held sideways: the card as it's laid out
// for a wide picture, but as big as the picture has room for too. At the
// screen's size its buttons were a few millimetres high.)
export const CARD_SHORT = 520;
export const cardFills = (w, h) => cardNarrow(w) || (h > 0 && h < CARD_SHORT);
// (`top`: pixels kept clear at the top of the picture - on a short one the
// top bar's handle hangs there, over where the card would begin: CARD_TOP.)
export const CARD_TOP = 58;
export const cardTop = (w, h) => (cardFills(w, h) && !cardNarrow(w) ? CARD_TOP : 0);
export function cardFit(box, size, w, h, margin = 0.02, fill = false, top = 0) {
  const mx = w * margin;
  const my = h * margin;
  const room = Math.min((w - 2 * mx) / size.w, (h - top - 2 * my) / size.h);
  const scale = Math.max(0.05, fill ? room : Math.min((box.x1 - box.x0) / size.w, (box.y1 - box.y0) / size.h, room));
  const hw = (size.w * scale) / 2;
  const hh = (size.h * scale) / 2;
  return {
    x: clamp((box.x0 + box.x1) / 2, mx + hw, w - mx - hw),
    y: clamp((box.y0 + box.y1) / 2, top + my + hh, h - my - hh),
    scale,
  };
}

// ---- On by itself -----------------------------------------------------------------------------

// When the ride goes on to the next hole without Next hole being pressed
// (the owner, 26 October 2026: "after about 40 seconds, just auto load
// next hole so you don't have to press it. But let the car drive there.
// If the car doesn't get there in 40 seconds, then give it 5 seconds of
// the car being parked up"): seconds into the ride - RIDE.onAfter with
// the cart parked by then, else RIDE.parked after it parks. arrive: when
// it parks, seconds into the ride (RIDE.setOff and its drive: driveTime).
// (Built or not then: what's left of the next hole is finished behind the
// loading card - the ride never waits on it for good.)
export function rideOnAt(arrive, { after = RIDE.onAfter, parked = RIDE.parked } = {}) {
  return arrive <= after ? after : arrive + parked;
}

// ---- The words -------------------------------------------------------------------------------

// The screen's line under the scorecard: "Hole 5 · par 4 · 386 yds -
// getting it ready..." until the next hole's built, then "ready" - "at the
// tee" once the cart's parked there (arrived) - and,
// in the last RIDE.countdown seconds before it goes on by itself (left),
// how long, built or not: "Hole 5 · par 4 · 386 yds - next hole in 8 s".
export function rideWords({ number, par, yards, ready, arrived = false, left = null }) {
  const hole = `Hole ${number} · par ${par}${Number.isFinite(yards) ? ` · ${yards} yds` : ""}`;
  if (Number.isFinite(left)) return `${hole} - next hole in ${Math.max(1, Math.ceil(left))} s`;
  if (!ready) return `${hole} - getting it ready...`;
  return arrived ? `${hole} - at the tee` : `${hole} - ready`;
}
