// Driving the cart yourself between holes (the owner, 12 November 2026:
// "Allowing in theory the person to drive as they like across the
// course?"). The ride to the next tee drives itself (sim/buggy.mjs); an
// arrow key while it's watched takes the wheel, and from then the cart
// goes where it's steered, anywhere on the ground that's drawn round the
// hole (its crop: sim/holecrop.mjs) - not into water or sand, a tree or a
// sign - until Next hole.
//
// From key presses alone (the game hears a key go down, in either window,
// and a controller's as keys - not its coming up): ↑ and ↓ step the speed
// it holds (DRIVE.gears: back, stopped, steady, fast), ← and → turn the
// wheel for as long as they're held or repeated, and it centres itself
// DRIVE.hold seconds after the last.
//
// Pure: course/buggy.js draws it. Positions are the world's [x, z];
// `heading` is the angle of the way it faces, [cos, sin] in x and z, so a
// turn to the cart's right adds to it (its right is [-sin, cos]).

import { clamp } from "./mathutil.mjs";

export const DRIVE = Object.freeze({
  // The speeds it holds, m/s: backing, stopped, steady, fast (the ride's
  // own is about the steady one).
  gears: Object.freeze([-2.2, 0, 4.2, 7.5]),
  // How quickly it gets to the speed asked for, and how quickly it stops,
  // m/s².
  accel: 2.6,
  brake: 6,
  // Of its speed kept off the cart paths, and in long grass.
  grass: 0.85,
  longGrass: 0.5,
  // The front wheels' most (radians), less the faster it goes; how fast
  // the wheel is turned and centres; how long a press holds it (seconds:
  // longer than a held key takes to start repeating).
  lock: 0.52,
  lockFast: 0.2,
  turn: 2.4,
  centre: 3.2,
  hold: 0.6,
  // Wheelbase, metres (sim/buggy.mjs WHEELS).
  base: 1.68,
  // Within this of where the ride ends, by the next tee: there.
  arrive: 14,
  // Kept this far from a tree's trunk and a thing's edge.
  clear: 0.9,
});

// The wheel taken: the cart where the ride had got to. at: [x, z];
// facing: [fx, fz], any length; speed: m/s.
export function driveStart({ at, facing, speed = 0 }, D = DRIVE) {
  // (In the gear nearest what it was doing, never backing.)
  let gear = 1;
  for (let i = 1; i < D.gears.length; i++) if (Math.abs(D.gears[i] - speed) < Math.abs(D.gears[gear] - speed)) gear = i;
  return { x: at[0], z: at[1], heading: Math.atan2(facing[1], facing[0]), speed, gear, steer: 0, want: 0, until: 0, rolled: 0, hit: false };
}

// A key: "up" | "down" | "left" | "right", at time `t` (seconds, any
// clock the steps share).
export function driveKey(state, key, t, D = DRIVE) {
  if (key === "up") return { ...state, gear: Math.min(D.gears.length - 1, state.gear + 1) };
  if (key === "down") return { ...state, gear: Math.max(0, state.gear - 1) };
  if (key === "left" || key === "right") return { ...state, want: key === "right" ? 1 : -1, until: t + D.hold };
  return state;
}

// `dt` seconds on, at time `t`. ground: { blocked(x, z) -> true where it
// can't go, surface(x, z) -> "path" | "grass" | "long" }. Stopped dead by
// what's in the way (hit), where it was.
export function driveStep(state, dt, t, ground = {}, D = DRIVE) {
  const surface = ground.surface?.(state.x, state.z) ?? "grass";
  const share = surface === "path" ? 1 : surface === "long" ? D.longGrass : D.grass;
  const target = D.gears[state.gear] * (state.gear > 1 ? share : 1);
  const gap = target - state.speed;
  // (Slowing, or changing direction, is braking.)
  const rate = Math.abs(target) < Math.abs(state.speed) || Math.sign(target) !== Math.sign(state.speed || target) ? D.brake : D.accel;
  let speed = state.speed + clamp(gap, -rate * dt, rate * dt);
  // The wheel: turned towards what's held, centred once it's let go.
  const want = t < state.until ? state.want : 0;
  const fast = clamp(Math.abs(speed) / D.gears.at(-1), 0, 1);
  const lock = D.lock + (D.lockFast - D.lock) * fast;
  const aim = want * lock;
  const turnRate = want ? D.turn : D.centre;
  const steer = state.steer + clamp(aim - state.steer, -turnRate * dt, turnRate * dt);
  const heading = state.heading + (speed / D.base) * Math.tan(steer) * dt;
  const x = state.x + Math.cos(heading) * speed * dt;
  const z = state.z + Math.sin(heading) * speed * dt;
  if (speed !== 0 && ground.blocked?.(x, z)) {
    // (Stopped, and out of gear: ↑ or ↓ sets off again - backing out.)
    return { ...state, speed: 0, gear: 1, steer, hit: true };
  }
  return { ...state, x, z, heading, speed, steer, rolled: state.rolled + speed * dt, hit: false };
}

// Which way it faces, [fx, fz].
export const driveFacing = (state) => [Math.cos(state.heading), Math.sin(state.heading)];

// Whether it's by the next tee: within DRIVE.arrive of where the ride ends.
export function driveArrived(state, end, D = DRIVE) {
  return !!end && Math.hypot(state.x - end[0], state.z - end[1]) <= D.arrive;
}

// What stops it, from what the ride knows of the ground (course/buggy.js
// cartGroundIn: lie(x, z) and trees [x, z, crown]; rideThingsIn: [x, z,
// r]) and the crop's circle, all in the world's xz: water and sand, a
// tree's trunk, a sign or a bench, and the edge of the drawn ground.
export function driveGround({ lie = null, trees = [], things = [], circle = null } = {}, D = DRIVE) {
  const NO = new Set(["water", "sand", "bunker"]);
  const LONG = new Set(["deep", "long", "hay", "fescue", "longGreen", "trees"]);
  const posts = [...trees.map(([x, z]) => [x, z, D.clear]), ...things.map(([x, z, r]) => [x, z, (r ?? 0.3) + D.clear * 0.6])];
  return {
    blocked(x, z) {
      if (circle && Math.hypot(x - circle.x, z - circle.z) > circle.r) return true;
      if (lie && NO.has(lie(x, z))) return true;
      for (const [px, pz, r] of posts) if (Math.abs(x - px) < r && Math.abs(z - pz) < r && Math.hypot(x - px, z - pz) < r) return true;
      return false;
    },
    surface(x, z) {
      const l = lie ? lie(x, z) : "rough";
      return l === "path" ? "path" : LONG.has(l) ? "long" : "grass";
    },
  };
}

// The bar's words while it's driven: the hole it's going to, and the keys
// (none said where no keys are shown).
export function driveWords({ number, par, yards, arrived = false, keys = true }) {
  const hole = `Hole ${number} · par ${par}${Number.isFinite(yards) ? ` · ${yards} yds` : ""}`;
  if (arrived) return `${hole} - at the tee`;
  return keys ? `${hole} - driving: ↑ ↓ speed · ← → steer` : `${hole} - you're driving`;
}
// And before: that it can be.
export const DRIVE_HINT = "↑ to drive it yourself";
// (And that it'll drive itself: the bar's Auto drive.)
export const AUTO_HINT = "The cart drives itself to the next tee";

// ---- Which way to the next tee (the owner, 13 November 2026: "a guidance on
// which way to go to the next tee") ---------------------------------------------

// turn: seconds a cart handed back to Auto drive takes to turn onto its
// way; every: seconds between readings of the way to go; near: metres
// from where it parks at which there's no more pointing.
export const GUIDE = Object.freeze({ turn: 1.1, every: 0.2, near: 14 });

// The arrow's turn on the screen, degrees clockwise from straight up, for
// a picture looking along `forward` (the camera's, in the world's xz - it
// follows the cart from behind, so up the screen is the way it's going)
// from `at` to `to`: 0 straight on, 90 to the right, 180 behind.
export function guideTurn(forward, at, to) {
  const dx = to[0] - at[0];
  const dz = to[1] - at[1];
  const fl = Math.hypot(forward[0], forward[1]);
  if (Math.hypot(dx, dz) < 1e-6 || fl < 1e-6) return 0;
  const fx = forward[0] / fl;
  const fz = forward[1] / fl;
  // (To the right of a view along (fx, fz): (-fz, fx).)
  const deg = (Math.atan2(dx * -fz + dz * fx, dx * fx + dz * fz) * 180) / Math.PI;
  return Math.round(deg);
}

// Its words: how far there is to go, in yards - along the way a cart goes,
// or (off the ground the ride knows) as the crow flies.
export function guideWords({ left, on = true }) {
  const yards = Math.max(0, Math.round((left * 1.09361) / 5) * 5);
  return on ? `${yards} yds to the tee` : `tee ${yards} yds off`;
}
