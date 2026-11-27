// Rolling on a green: putts, and the roll-out of chips once they settle.
//
// Frame: x runs from the ball towards the hole, z is to the golfer's right,
// all in metres. A green is
//   stimp      speed in feet
//   uphill     overall slope along the line, percent, positive uphill
//   fallRight  overall slope across it, percent, positive falls to the right
//   contours   optional humps and hollows: [{ x, z, a, s }], a Gaussian of
//              height a metres and width s metres centred at (x, z); or a
//              tilt { x, z, tilt: [gx, gz], edge, lift, fade, reach, low }:
//              a plane rising by gx, gz per metre across a green whose
//              edge is `edge` round (x, z), easing back to level over
//              `fade` metres beyond it (see holeedits.mjs tiltContour)
//   terrain    optional real ground under it all: a height grid
//              (terrain.mjs), for holes rebuilt from a map
//   shaping    optional { height(x, z), gradient(x, z) } added to it all:
//              ground changed by hand, such as a dug bunker (holeedits.mjs)
// One contour can instead be a green shaped by hand (greensculpt.mjs):
//   { sculpt: 1, x0, z0, cell, nx, nz, T, W } - a smooth surface T
//   and how much it counts, W: 1 over the green and its fringe, easing to
//   nothing over the bank beyond. It takes the place of everything before
//   it in the list (and the terrain) where W is 1, and blends into it
//   where W fades; contours after it (a tilt, bumps) add on top as usual.
// Pure functions, shared by the browser and the tests.

import { MPH } from "./flight.mjs";
import { gridHeight, gridGradient } from "./terrain.mjs";
import { playCup, engageRadius, HOLE_RADIUS, BALL_RADIUS, PIN_RADIUS, PIN_HEIGHT } from "./cup.mjs";
import { mulberry32 } from "./mathutil.mjs";

export const FOOT = 0.3048;
export const INCH = 0.0254;
const G = 9.81;
// The regulation 4.25 inch cup, the ball and the flagstick (sim/cup.mjs).
export { HOLE_RADIUS, BALL_RADIUS, PIN_RADIUS };
// How near the pole's middle the ball's centre is when it touches it.
export const PIN_REACH = PIN_RADIUS + BALL_RADIUS;

// Cup sizes for practice. A double cup is the classic confidence builder, a
// small cup the precision one.
export const CUPS = {
  normal: { radius: HOLE_RADIUS, name: "Normal cup", short: "4¼ in" },
  double: { radius: HOLE_RADIUS * 2, name: "Double cup", short: "8½ in" },
  small: { radius: 1.25 * INCH, name: "Small cup", short: "2½ in" },
};

// A stimpmeter releases the ball at about 1.83 m/s.
const STIMP_SPEED = 1.83;

// Rolling deceleration on the flat for a given stimp reading in feet.
// (A stimp missing or nonsense reads as 10, an ordinary green, and any is
// kept between 4 and 16 - nothing slower than a shaggy fairway, nothing
// quicker than a major's: never a ball that rolls for ever, or not at all.)
export const STIMP_RANGE = [4, 16];
export function rollingDecel(stimp) {
  const s = Number.isFinite(stimp) && stimp > 0 ? Math.min(STIMP_RANGE[1], Math.max(STIMP_RANGE[0], stimp)) : 10;
  return (STIMP_SPEED * STIMP_SPEED) / (2 * s * FOOT);
}

// ---- The surface -------------------------------------------------------------

// A tilt's height at (x, z): its plane, full over the green and its fringe
// and easing to nothing across the fade beyond the green's edge. `edge` is
// that edge's radius at even steps round from the +x direction (turned by
// `turn`, for a tilt that has been turned round with its green); unless `low`, the
// plane never goes below the ground (a designed green's low edge sits at
// the grass). `tiers`: steps across the green on the plane, each [nx, nz,
// at, rise, width] - rising by `rise` going the way (nx, nz) across a face
// `width` wide centred `at` metres that way from (x, z) (course.mjs
// greenContours: a tier, a false front).
export function tierRise(tiers, dx, dz) {
  let h = 0;
  for (const [nx, nz, at, rise, width] of tiers) {
    const t = Math.min(1, Math.max(0, (nx * dx + nz * dz - at) / width + 0.5));
    h += rise * t * t * (3 - 2 * t);
  }
  return h;
}
function tiltHeight(b, x, z) {
  const dx = x - b.x;
  const dz = z - b.z;
  const d = Math.hypot(dx, dz);
  if (d >= b.reach) return 0;
  const n = b.edge.length;
  const t = ((((Math.atan2(dz, dx) + (b.turn ?? 0)) / (Math.PI * 2)) % 1) + 1) % 1 * n;
  const i = Math.floor(t);
  const u = t - i;
  const R = b.edge[i % n] * (1 - u) + b.edge[(i + 1) % n] * u;
  const out = (d - R) / b.fade;
  const w = out <= 0 ? 1 : out >= 1 ? 0 : 1 - out * out * (3 - 2 * out);
  const plane = b.tilt[0] * dx + b.tilt[1] * dz + (b.lift ?? 0) + (b.tiers ? tierRise(b.tiers, dx, dz) : 0);
  return (b.low ? plane : Math.max(0, plane)) * w;
}

// Which contour lists hold a shaped green: worked out once per list.
const sculpted = new WeakMap();
const hasSculpt = (list) => {
  if (!list?.length) return false;
  let v = sculpted.get(list);
  if (v == null) {
    v = list.some((b) => b?.sculpt);
    sculpted.set(list, v);
  }
  return v;
};

// A cubic B-spline through a grid: smooth everywhere (its slope as well as
// its height, so a rolling ball never feels a crease at a cell's edge) and
// never overshooting the heights it's made from. A shaped green's surface
// T and weight W share one grid, so both are read in one go: returns
// [T, dT/dx, dT/dz, W, dW/dx, dW/dz] at (x, z); beyond the grid, the edge
// values carry on.
export function sculptAt(s, x, z) {
  const fx = (x - s.x0) / s.cell;
  const fz = (z - s.z0) / s.cell;
  const ix = Math.floor(fx);
  const iz = Math.floor(fz);
  const wx = weights(fx - ix);
  const wz = weights(fz - iz);
  const { T, W, nx, nz } = s;
  let h = 0;
  let hx = 0;
  let hz = 0;
  let w = 0;
  let wgx = 0;
  let wgz = 0;
  const col = [0, 0, 0, 0];
  for (let i = 0; i < 4; i++) col[i] = Math.min(nx - 1, Math.max(0, ix + i - 1));
  for (let j = 0; j < 4; j++) {
    const row = Math.min(nz - 1, Math.max(0, iz + j - 1)) * nx;
    let ta = 0;
    let tb = 0;
    let wa = 0;
    let wb = 0;
    for (let i = 0; i < 4; i++) {
      const k = row + col[i];
      const t = T[k];
      const v = W[k];
      ta += wx[i] * t;
      tb += wx[i + 4] * t;
      wa += wx[i] * v;
      wb += wx[i + 4] * v;
    }
    h += wz[j] * ta;
    hx += wz[j] * tb;
    hz += wz[j + 4] * ta;
    w += wz[j] * wa;
    wgx += wz[j] * wb;
    wgz += wz[j + 4] * wa;
  }
  return [h, hx / s.cell, hz / s.cell, w, wgx / s.cell, wgz / s.cell];
}
function weights(t) {
  const u = 1 - t;
  const t2 = t * t;
  return [u * u * u / 6, (3 * t2 * t - 6 * t2 + 4) / 6, (-3 * t2 * t + 3 * t2 + 3 * t + 1) / 6, (t2 * t) / 6, -u * u / 2, (3 * t2 - 4 * t) / 2, (-3 * t2 + 2 * t + 1) / 2, t2 / 2];
}

// The ground as it is before a shaped green in the list: the overall
// slope, the terrain and the contours before it. [h, dh/dx, dh/dz].
function groundBefore(green, x, z, upto) {
  let h = ((green.uphill ?? 0) / 100) * x - ((green.fallRight ?? 0) / 100) * z;
  let gx = (green.uphill ?? 0) / 100;
  let gz = -(green.fallRight ?? 0) / 100;
  if (green.terrain) {
    h += gridHeight(green.terrain, x, z);
    const [tx, tz] = gridGradient(green.terrain, x, z);
    gx += tx;
    gz += tz;
  }
  for (let k = 0; k < upto; k++) {
    const b = green.contours[k];
    if (b.tilt) {
      h += tiltHeight(b, x, z);
      const e = 0.05;
      gx += (tiltHeight(b, x + e, z) - tiltHeight(b, x - e, z)) / (2 * e);
      gz += (tiltHeight(b, x, z + e) - tiltHeight(b, x, z - e)) / (2 * e);
    } else {
      const dx = x - b.x;
      const dz = z - b.z;
      const g = b.a * Math.exp(-(dx * dx + dz * dz) / (2 * b.s * b.s));
      h += g;
      gx -= (g / (b.s * b.s)) * dx;
      gz -= (g / (b.s * b.s)) * dz;
    }
  }
  return [h, gx, gz];
}

// Height and slope of a green with a shaped part: everything before the
// shaped green in its list gives way to it where it counts (and isn't
// worked out at all where the shaped green alone counts - on the green,
// where a putt spends its time).
function sculptedSurface(green, x, z) {
  const list = green.contours;
  const at = list.findIndex((b) => b.sculpt);
  const [T, tx, tz, W, wx, wz] = sculptAt(list[at], x, z);
  let h;
  let gx;
  let gz;
  if (W > 1 - 1e-9 && Math.abs(wx) < 1e-9 && Math.abs(wz) < 1e-9) [h, gx, gz] = [T, tx, tz];
  else {
    [h, gx, gz] = groundBefore(green, x, z, at);
    if (W > 1e-12 || Math.abs(wx) > 1e-12 || Math.abs(wz) > 1e-12) {
      const d = T - h;
      gx += W * (tx - gx) + d * wx;
      gz += W * (tz - gz) + d * wz;
      h += W * d;
    }
  }
  for (let k = at + 1; k < list.length; k++) {
    const b = list[k];
    if (b.sculpt) continue;
    if (b.tilt) {
      h += tiltHeight(b, x, z);
      const e = 0.05;
      gx += (tiltHeight(b, x + e, z) - tiltHeight(b, x - e, z)) / (2 * e);
      gz += (tiltHeight(b, x, z + e) - tiltHeight(b, x, z - e)) / (2 * e);
    } else {
      const dx = x - b.x;
      const dz = z - b.z;
      const g = b.a * Math.exp(-(dx * dx + dz * dz) / (2 * b.s * b.s));
      h += g;
      gx -= (g / (b.s * b.s)) * dx;
      gz -= (g / (b.s * b.s)) * dz;
    }
  }
  if (green.shaping) {
    h += green.shaping.height(x, z);
    const [sx, sz] = green.shaping.gradient(x, z);
    gx += sx;
    gz += sz;
  }
  return [h, gx, gz];
}

// A green seen from somewhere else: `framed` { green, frame: [ox, oz,
// heading] } is the whole of another green (real ground and all), turned so
// (ox, oz) is the origin and `heading` runs along +x. Every course green is
// read this way (puttguide.mjs courseGreen, courseplay.mjs readPutt), so the
// read sees the whole of the ground the ball rolls on, not just part of it.
function toFramed(f, x, z) {
  const c = Math.cos(f.frame[2]);
  const s = Math.sin(f.frame[2]);
  return [f.frame[0] + x * c - z * s, f.frame[1] + x * s + z * c, c, s];
}

export function greenHeight(green, x, z) {
  if (green.framed) {
    const [wx, wz] = toFramed(green.framed, x, z);
    return greenHeight(green.framed.green, wx, wz);
  }
  // (A designed hole's rolls - sim/rolls.mjs - are under everything else.)
  const rolls = green.rolls ? green.rolls.height(x, z) : 0;
  if (hasSculpt(green.contours)) return sculptedSurface(green, x, z)[0] + rolls;
  let h = rolls + ((green.uphill ?? 0) / 100) * x - ((green.fallRight ?? 0) / 100) * z;
  if (green.terrain) h += gridHeight(green.terrain, x, z);
  if (green.shaping) h += green.shaping.height(x, z);
  for (const b of green.contours ?? []) {
    if (b.tilt) {
      h += tiltHeight(b, x, z);
      continue;
    }
    const dx = x - b.x;
    const dz = z - b.z;
    h += b.a * Math.exp(-(dx * dx + dz * dz) / (2 * b.s * b.s));
  }
  return h;
}

// Slope of the surface, [dh/dx, dh/dz] (0.02 = 2%).
export function greenGradient(green, x, z) {
  if (green.framed) {
    const [wx, wz, c, s] = toFramed(green.framed, x, z);
    const [gx, gz] = greenGradient(green.framed.green, wx, wz);
    return [gx * c + gz * s, -gx * s + gz * c];
  }
  const [rx, rz] = green.rolls ? green.rolls.gradient(x, z) : [0, 0];
  if (hasSculpt(green.contours)) {
    const [, gx, gz] = sculptedSurface(green, x, z);
    return [gx + rx, gz + rz];
  }
  let gx = rx + (green.uphill ?? 0) / 100;
  let gz = rz - (green.fallRight ?? 0) / 100;
  if (green.terrain) {
    const [tx, tz] = gridGradient(green.terrain, x, z);
    gx += tx;
    gz += tz;
  }
  if (green.shaping) {
    const [sx, sz] = green.shaping.gradient(x, z);
    gx += sx;
    gz += sz;
  }
  for (const b of green.contours ?? []) {
    if (b.tilt) {
      // Its slope, measured: the plane, the fade and the green's edge
      // all come into it.
      const e = 0.05;
      gx += (tiltHeight(b, x + e, z) - tiltHeight(b, x - e, z)) / (2 * e);
      gz += (tiltHeight(b, x, z + e) - tiltHeight(b, x, z - e)) / (2 * e);
      continue;
    }
    const dx = x - b.x;
    const dz = z - b.z;
    const e = (b.a * Math.exp(-(dx * dx + dz * dz) / (2 * b.s * b.s))) / (b.s * b.s);
    gx -= e * dx;
    gz -= e * dz;
  }
  return [gx, gz];
}

// Small seeded random so a green can be rebuilt exactly from its seed.
function seeded(seed) {
  return mulberry32(seed);
}

const CONTOUR_LEVELS = {
  none: null,
  gentle: { count: 5, a: [0.03, 0.07] },
  moderate: { count: 6, a: [0.06, 0.12] },
  severe: { count: 7, a: [0.1, 0.19] },
};
export const CONTOUR_NAMES = { none: "Flat plane", gentle: "Gentle", moderate: "Moderate", severe: "Severe" };

// Humps and hollows scattered over the area of a putt of the given length.
// Like a real hole location, the area round the cup is kept fairly flat.
export function makeContours(level, seed, length, base = {}) {
  const spec = CONTOUR_LEVELS[level];
  if (!spec) return [];
  const rand = seeded(seed);
  const bumps = [];
  for (let i = 0; i < spec.count; i++) {
    const sign = rand() < 0.5 ? -1 : 1;
    bumps.push({
      x: -3 + rand() * (length + 7),
      z: (rand() - 0.5) * 12,
      a: sign * (spec.a[0] + rand() * (spec.a[1] - spec.a[0])),
      s: 1.8 + rand() * 2.4,
    });
  }
  // Soften the bumps until the slope at the hole is no more than 2.5%.
  for (let i = 0; i < 20; i++) {
    const [gx, gz] = greenGradient({ ...base, contours: bumps }, length, 0);
    if (Math.hypot(gx, gz) <= 0.025) break;
    for (const b of bumps) b.a *= 0.85;
  }
  return bumps;
}

// ---- Rolling -----------------------------------------------------------------

// Rolls a ball until it stops or drops.
//   start       { p: [x, z], v: [vx, vz], t }  position, velocity (m/s), time
//   hole        { x, z, r } or null
//   frictionAt  optional (x, z, speed) => deceleration, for surfaces other
//               than the green (the fringe a chip lands on) and for a full
//               shot's roll-out, which slows faster while it's still going
//               fast (flight.mjs skidDecel); defaults to the stimp
//   stopPastX   optional: stop following it once it's this far along x
//               (the read only needs to know where it passes the hole)
//   wallAt      optional (x, z) => true on a wall's face (a bunker's wall,
//               sim/walls.mjs). A ball can't roll up a wall as it would up
//               a slope - read as a slope, a quick one in the sand climbed
//               a 1.5 m wall and ran off onto the grass. There, where the
//               ground rises steeper than WALL_STEEP, what speed it has
//               into the wall is lost (a tenth comes back off it) and half
//               its speed along it; and the wall's steepness isn't felt,
//               so it doesn't slide down one either: it drops and lands
//               dead at the foot.
//   pin         optional: the flagstick is in (a chip or a pitch, played
//               from off the green - a putt never has it). The ball can
//               meet the pole in the cup (sim/cup.mjs).
// Once the ball comes within reach of the hole, the cup takes over: a ball
// in three dimensions riding the rim, falling in, meeting the wall, the
// floor or the pin, and either staying in or coming back out onto the
// green, when this roll carries on (cupVisit, sim/cup.mjs).
// Returns { holed, lipped, rest: [x, z], path: [[x, z, t, y?], ...], time }
// - y, where it's given, the ball's height above the green (negative down
// in the cup, positive hopping out of it; 0 when left out) - and for its
// sound: for a lip-out lipTime, when it last touched the rim or the wall;
// for a holed ball cupSpeed, how fast it was going as it dropped (m/s),
// and cupTime, when it reached the bottom; for one knocked back off the
// pin, pinTime, when it hit it; and cupEvents, each touch of the rim,
// wall, floor or pin: [{ kind, t, speed }] (speed how fast into it).
export const WALL_STEEP = 2.5;
// `hole` may also be a list of holes (golf pong's cups, sim/golfpong.mjs):
// the ball drops in whichever it reaches, and a holed result says which
// (holeIndex).
// Grain on a green (the owner: a setting, on by default; docs/PHYSICS-
// PLAN.md phase 2): the blades lie one way, so a ball rolling down-grain
// runs a little faster and one into it a little slower (speed: the share
// of the green's slowing, either way), and every ball is eased a little
// down-grain (push, m/s/s) - about an inch on a 15 ft putt across it.
export const GRAIN = { speed: 0.08, push: 0.01 };

// The grain at a spot: [down-grain x, z (a unit vector), how much (0 - 1)]
// in the green's own frame, or null where there's none.
export function grainAt(green, x, z) {
  if (green.framed) {
    const [wx, wz, c, s] = toFramed(green.framed, x, z);
    const g = grainAt(green.framed.green, wx, wz);
    return g && [g[0] * c + g[1] * s, -g[0] * s + g[1] * c, g[2]];
  }
  if (!green.grain) return null;
  const m = green.grain.at(x, z);
  return m > 0 ? [green.grain.dir[0], green.grain.dir[1], m] : null;
}

// push: [x, z] m/s/s, a steady push on the rolling ball (a strong wind:
// sim/weather.mjs groundPush), or null.
export function rollBall(start, green, holes, { frictionAt = null, maxTime = 40, stopPastX = null, wallAt = null, pin = false, push = null } = {}) {
  const onGreen = rollingDecel(green.stimp);
  // (A course putt from off the green carries its grass with it:
  // puttguide.mjs courseGreen.)
  const friction = frictionAt ?? green.frictionAt ?? (() => onGreen);
  const dt = 0.002;
  const list = Array.isArray(holes) ? holes : holes ? [holes] : [];
  let hole = list[0] ?? null;
  const reach = hole ? engageRadius(hole.r) : 0;
  let p = [...start.p];
  let v = [...start.v];
  let t = start.t ?? 0;
  const path = [[p[0], p[1], t]];
  const visits = { lipped: false, lipTime: null, pinTime: null, events: [] };
  const end = t + maxTime;
  let step = 0;

  const done = (holed, rest, extra = {}) => {
    // A holed ball's path already ends where it lies in the cup.
    if (!holed) path.push([rest[0], rest[1], t]);
    const out = { holed, lipped: !holed && visits.lipped, rest, path, time: t };
    if (out.lipped) out.lipTime = visits.lipTime;
    if (holed) Object.assign(out, extra);
    if (!holed && visits.pinTime != null) out.pinTime = visits.pinTime;
    if (visits.events.length) out.cupEvents = visits.events;
    return out;
  };

  while (t < end) {
    let [gx, gz] = greenGradient(green, p[0], p[1]);
    const steep = Math.hypot(gx, gz);
    if (wallAt && steep > WALL_STEEP && wallAt(p[0], p[1])) {
      // Up the slope is into the wall.
      const nx = gx / steep;
      const nz = gz / steep;
      const into = v[0] * nx + v[1] * nz;
      if (into > 0) {
        const ax = v[0] - into * nx;
        const az = v[1] - into * nz;
        v = [ax * 0.5 - 0.1 * into * nx, az * 0.5 - 0.1 * into * nz];
      }
      gx = 0;
      gz = 0;
    }
    // Down the slope for a rolling (not sliding) ball: 5/7 g sin.
    let sx = (-5 / 7) * G * gx;
    let sz = (-5 / 7) * G * gz;
    const speed = Math.hypot(v[0], v[1]);
    let f = friction(p[0], p[1], speed);
    // The grain: faster down it, slower into it, and eased along it.
    const grain = green.grain || green.framed ? grainAt(green, p[0], p[1]) : null;
    if (grain) {
      if (speed > 1e-4) f *= 1 - GRAIN.speed * grain[2] * ((v[0] * grain[0] + v[1] * grain[1]) / speed);
      sx += GRAIN.push * grain[2] * grain[0];
      sz += GRAIN.push * grain[2] * grain[1];
    }
    if (push) {
      sx += push[0];
      sz += push[1];
    }
    const slope = Math.hypot(sx, sz);
    if (speed < 0.01 && slope <= f) break;
    const fx = speed > 1e-4 ? (-f * v[0]) / speed : 0;
    const fz = speed > 1e-4 ? (-f * v[1]) / speed : 0;
    const nv = [v[0] + (fx + sx) * dt, v[1] + (fz + sz) * dt];
    // Friction can only stop the ball, never reverse it within one step.
    if (nv[0] * v[0] + nv[1] * v[1] < 0 && slope <= f) {
      v = [0, 0];
      break;
    }
    v = nv;
    const was = p;
    p = [p[0] + v[0] * dt, p[1] + v[1] * dt];
    t += dt;

    // Within reach of the hole: from where it came within reach, the cup
    // has it.
    if (list.length > 1) hole = list.find((h) => (p[0] - h.x) ** 2 + (p[1] - h.z) ** 2 < reach * reach) ?? hole;
    if (hole && (p[0] - hole.x) ** 2 + (p[1] - hole.z) ** 2 < reach * reach) {
      const u = entering(was, p, hole, reach);
      p = [was[0] + (p[0] - was[0]) * u, was[1] + (p[1] - was[1]) * u];
      t -= (1 - u) * dt;
      path.push([p[0], p[1], t]);
      const w = cupVisit({ p: [p[0], BALL_RADIUS, p[1]], v: [v[0], 0, v[1]], t }, green, hole, { friction, pin, maxTime: end - t });
      noteVisit(visits, w);
      for (let i = 1; i < w.path.length; i++) path.push(w.path[i]);
      t = w.t;
      if (w.holed) return done(true, [hole.x, hole.z], { cupSpeed: w.cupSpeed, cupTime: w.cupTime, ...(list.length > 1 ? { holeIndex: list.indexOf(hole) } : {}) });
      p = [w.p[0], w.p[2]];
      if (w.stopped) return done(false, p);
      v = [w.v[0], w.v[2]];
      continue;
    }
    if (++step % 5 === 0) path.push([p[0], p[1], t]);
    if (stopPastX != null && p[0] > stopPastX) break;
  }
  return done(false, p);
}

// How far along a step from `a` to `b` (0 to 1) the ball first comes
// within `reach` of the hole's middle.
function entering(a, b, hole, reach) {
  const ex = b[0] - a[0];
  const ez = b[1] - a[1];
  const fx = a[0] - hole.x;
  const fz = a[1] - hole.z;
  const A = ex * ex + ez * ez;
  const C = fx * fx + fz * fz - reach * reach;
  if (C <= 0 || A < 1e-18) return 0;
  const B = 2 * (fx * ex + fz * ez);
  const disc = Math.max(0, B * B - 4 * A * C);
  return Math.min(1, Math.max(0, (-B - Math.sqrt(disc)) / (2 * A)));
}

// What a visit to the cup adds up to, over however many a roll makes.
function noteVisit(visits, w) {
  visits.events.push(...w.cupEvents);
  if (w.lipTime != null) {
    visits.lipped = true;
    visits.lipTime = w.lipTime;
  }
  if (w.pinTime != null && visits.pinTime == null) visits.pinTime = w.pinTime;
}

// The ball near the hole, in three dimensions (sim/cup.mjs playCup), in
// the green's own frame.
//   s        { p: [x, y, z], v: [vx, vy, vz], w?, t } - y the ball's
//            centre above the green (BALL_RADIUS sitting on it); w its
//            spin, rolling if left out
//   friction (x, z, speed) => the rolling deceleration there
// Returns { holed, stopped, landed, p, v (as s, where it left off), t, path: [[x,
// z, t, y]], cupEvents, cupSpeed and cupTime if holed, firstTouch and
// grounded (when it first touched anything but the flagstick) }; one
// that stayed out has lipTime if it touched the rim or the wall (the last
// time it did) and pinTime if it hit the pin (the first time).
export function cupVisit(s, green, hole, { friction = null, pin = false, maxTime = 4, landing = false } = {}) {
  const drag = friction ?? (() => rollingDecel(green.stimp));
  const grad = greenGradient(green, hole.x, hole.z);
  const r = playCup(
    { p: [s.p[0] - hole.x, s.p[1], s.p[2] - hole.z], v: s.v, w: s.w, t: s.t },
    hole,
    { grad, pin, landing, drag: (x, z, speed) => drag(x + hole.x, z + hole.z, speed), maxTime: Math.min(4, maxTime) },
  );
  const holed = r.end === "holed";
  const out = {
    holed,
    stopped: r.end === "rest",
    landed: r.end === "landed",
    p: [r.s.p[0] + hole.x, r.s.p[1], r.s.p[2] + hole.z],
    v: r.s.v,
    w: r.s.w,
    t: r.t,
    path: r.path.map(([x, z, t, y]) => [x + hole.x, z + hole.z, t, y]),
    cupEvents: r.events,
    firstTouch: r.firstTouch,
    grounded: r.grounded,
  };
  if (holed) {
    out.cupSpeed = r.dropSpeed ?? Math.hypot(...s.v);
    out.cupTime = r.events.find((e) => e.kind === "bottom")?.t ?? r.capturedAt;
  } else {
    const touches = r.events.filter((e) => e.kind === "rim" || e.kind === "wall");
    if (touches.length) out.lipTime = touches[touches.length - 1].t;
    const pinHit = r.events.find((e) => e.kind === "pin");
    if (pinHit) out.pinTime = pinHit.t;
  }
  return out;
}

// A ball in the air coming down near the hole: a chip or a pitch landing
// on it, or a bounce hopping into it. The cup has it from the moment it
// comes within reach of the hole on its way down (from as high as the
// flagstick's top, so it can hit the pole) - so it can land in the cup, on
// the rim, or on the green just short and hop into the back of the cup,
// or hit the flag - and a ball that lands clear of it is left to its
// usual bounce.
//   land   { p: [x, 0, z], v: [vx, vy, vz], t, spinRpm } where and how it
//          touches down (y is the height of the ball's bottom, 0 on the
//          ground; spinRpm its backspin)
//   since  when it last left the ground (or was struck): how far back its
//          fall can be traced
// Returns null if it lands clear of the hole; otherwise when the cup took
// it (from), and the visit (cupVisit) with its path as [x, y, z, t]
// points, as the flight's are. A visit that ends `landed` - after the pin,
// the rim or nothing at all, the ball comes down on the green hard enough
// to bounce - leaves it touching down there (p, v, t, and spinRpm its
// backspin) for the caller to bounce as it would anywhere.
export const DUNK_HEIGHT = PIN_HEIGHT + 0.1;
export function landNearCup(land, since, green, hole, { friction = null, pin = false } = {}) {
  const reach = engageRadius(hole.r);
  const [lx, , lz] = land.p;
  const [vx, vy, vz] = land.v;
  // Traced back from where it lands, gravity alone (air makes little odds
  // over the last couple of metres of a fall): the first moment it was
  // within reach.
  const fall = -vy;
  const back = Math.max(0, land.t - since);
  // How long before landing it was at DUNK_HEIGHT.
  const high = fall > 0 ? (-fall + Math.sqrt(fall * fall + 2 * G * DUNK_HEIGHT)) / G : 0;
  const from = Math.min(back, high > 0 ? high : back);
  const at = (tau) => [lx - vx * tau, fall * tau - 0.5 * G * tau * tau, lz - vz * tau];
  let tau = null;
  const stepT = 0.0005;
  for (let k = Math.ceil(from / stepT); k >= 0; k--) {
    const q = at(k * stepT);
    if (q[1] < 0) continue;
    if ((q[0] - hole.x) ** 2 + (q[2] - hole.z) ** 2 < reach * reach) {
      tau = k * stepT;
      break;
    }
  }
  if (tau == null) return null;
  const q = at(tau);
  const v = [vx, vy + G * tau, vz];
  // Its backspin, about the level line square to where it's going.
  const vh = Math.hypot(vx, vz);
  const spin = ((land.spinRpm ?? 0) * Math.PI) / 30;
  const w = vh > 1e-9 ? [(-vz / vh) * spin, 0, (vx / vh) * spin] : [0, 0, 0];
  const visit = cupVisit({ p: [q[0], Math.max(0, q[1]) + BALL_RADIUS, q[2]], v, w, t: land.t - tau }, green, hole, { friction, pin, landing: true });
  const out = { from: land.t - tau, ...visit, path: visit.path.map(([x, z, t, y]) => [x, y, z, t]) };
  // Came down on the green by the hole, to bounce there as anywhere else:
  // where, how fast, and with what backspin left (rpm).
  if (visit.landed) {
    const [ux, , uz] = visit.v;
    const h = Math.hypot(ux, uz);
    out.spinRpm = h > 1e-9 ? ((visit.w[0] * -uz + visit.w[2] * ux) / h) * (30 / Math.PI) : 0;
  }
  return out;
}

// Where in a shot's path ([x, y, z, t] points) a ball the cup took from
// the air first came down (landNearCup's grounded, `t`): how many points
// are in the air: all of them if it never touched down.
export function landedAt(path, t) {
  if (t == null) return path.length;
  const i = path.findIndex((q) => q[3] >= t - 1e-9);
  return i < 0 ? path.length : i + 1;
}

// The fastest a ball rolling dead centre at the hole can arrive at its edge
// and be sure to drop (m/s), for a cup of the given radius: what the cup
// model makes of it, measured (and remembered) - the first pace that
// doesn't drop. (Just above it are a few that still rattle in off the back
// edge, and a few that don't: see test/cup.test.mjs.) About 1.3 - 1.6 m/s
// for a regulation hole in Holmes' and Penner's accounts; more for a
// bigger cup.
const captured = new Map();
export function captureSpeed(radius = HOLE_RADIUS) {
  if (captured.has(radius)) return captured.get(radius);
  const drops = (speed) => centredPutt(speed, radius).holed;
  // Up in tenths, back a tenth and up in hundredths to the first miss,
  // then halving between.
  let lo = 0.3;
  while (lo < 6 && drops(lo + 0.1)) lo += 0.1;
  while (drops(lo + 0.01)) lo += 0.01;
  let hi = lo + 0.01;
  for (let i = 0; i < 6; i++) {
    const mid = (lo + hi) / 2;
    if (drops(mid)) lo = mid;
    else hi = mid;
  }
  captured.set(radius, lo);
  return lo;
}

// A ball rolling at `speed` m/s as it reaches the hole's edge, `offset`
// metres off the line through its middle, on a green of `stimp` sloping
// `uphill` % along the line (the hole at the origin; for the tests and
// captureSpeed).
export function puttAtCup(speed, offset = 0, radius = HOLE_RADIUS, { stimp = 10, uphill = 0, pin = false } = {}) {
  // Started a few centimetres short: build its pace back up by as much as
  // the green takes off over them, so it's `speed` at the edge.
  const back = 0.05;
  const x0 = -Math.sqrt(Math.max(0, (radius + back) ** 2 - offset * offset));
  const decel = rollingDecel(stimp) + (5 / 7) * G * (uphill / 100);
  const run = Math.max(0, -x0 - Math.sqrt(Math.max(0, radius * radius - offset * offset)));
  const v = Math.sqrt(Math.max(0, speed * speed + 2 * decel * run));
  return rollBall({ p: [x0, offset], v: [v, 0], t: 0 }, { stimp, uphill }, { x: 0, z: 0, r: radius }, { pin });
}
const centredPutt = (speed, radius) => puttAtCup(speed, 0, radius);

// How a finish relates to the hole, in feet: how far away, how far past
// (negative = short), how far right.
export function finishFeet(rest, hole) {
  return {
    leaveFeet: Math.hypot(rest[0] - hole.x, rest[1] - hole.z) / FOOT,
    longFeet: (rest[0] - hole.x) / FOOT,
    rightFeet: (rest[1] - hole.z) / FOOT,
  };
}

// Rolls a putt. speedMph and hla (degrees, right positive) come from the
// launch monitor; distance is where the hole is, in metres along x.
// (holeRadius null: no hole there at all - the distance challenge's target
// zone - the finish measured from that spot all the same.)
export function simulatePutt({ speedMph, hla = 0 }, green, distance, holeRadius = HOLE_RADIUS) {
  const angle = (hla * Math.PI) / 180;
  const speed = speedMph * MPH;
  const hole = { x: distance, z: 0, r: holeRadius ?? 0 };
  const r = rollBall({ p: [0, 0], v: [speed * Math.cos(angle), speed * Math.sin(angle)], t: 0 }, green, holeRadius == null ? [] : hole);
  const finish = r.holed ? { leaveFeet: 0, longFeet: 0, rightFeet: 0 } : finishFeet(r.rest, hole);
  return { ...r, ...finish };
}

// The putt that finishes `pastFeet` beyond the hole: the "read" to show a
// player what the green is doing. Searches aim and pace against the same
// physics the putt uses, so the read is always consistent with the result.
export function idealPutt(green, distance, pastFeet = 1.5, options = {}) {
  return runSteps(idealPuttSteps(green, distance, pastFeet, options));
}

// The same search a roll at a time: a generator that yields after each
// roll and returns { speedMph, hla }, so it can be spread over a few frames
// (puttguide.mjs Stepper) rather than holding one up.
export function* idealPuttSteps(green, distance, pastFeet = 1.5, { narrow = true } = {}) {
  const target = distance + pastFeet * FOOT;
  let hla = 0;
  let speedMph = 2;
  for (let round = 0; round < 6; round++) {
    // After the first round, look only near the last answer, and stop once
    // it has settled - going back to the full search if it's pushed to the
    // edge of where it looked. (Each roll costs a little, and a new putt
    // shouldn't keep the player waiting.)
    const near = narrow && round > 0;
    const was = [speedMph, hla];
    // Pace: bisect on how far along the line it finishes.
    let lo = near ? speedMph * 0.85 : 0.2;
    let hi = near ? speedMph * 1.18 : 25;
    for (let i = 0; i < (near ? 16 : 20); i++) {
      const mid = (lo + hi) / 2;
      if (rollFree({ speedMph: mid, hla }, green)[0] < target) lo = mid;
      else hi = mid;
      yield;
    }
    speedMph = (lo + hi) / 2;
    // Aim: bisect on which side of the hole it passes.
    let aLo = near ? hla - 3 : -30;
    let aHi = near ? hla + 3 : 30;
    for (let i = 0; i < (near ? 16 : 20); i++) {
      const mid = (aLo + aHi) / 2;
      if (sideAtHole({ speedMph, hla: mid }, green, distance) < 0) aLo = mid;
      else aHi = mid;
      yield;
    }
    hla = (aLo + aHi) / 2;
    if (near) {
      const edge = Math.abs(speedMph - was[0] * 0.85) < 1e-3 || Math.abs(speedMph - was[0] * 1.18) < 1e-3 || Math.abs(hla - was[1]) > 2.99;
      if (edge) return yield* idealPuttSteps(green, distance, pastFeet, { narrow: false });
    }
    // Settled - pace and line no longer moving - so it's done.
    if (round > 0 && Math.abs(speedMph - was[0]) < 0.004 && Math.abs(hla - was[1]) < 0.01) break;
  }
  return { speedMph, hla };
}

// Runs a step-at-a-time search straight through to its answer.
export function runSteps(steps) {
  for (;;) {
    const r = steps.next();
    if (r.done) return r.value;
  }
}

function rollNoHole({ speedMph, hla }, green, stopPastX = null) {
  const a = (hla * Math.PI) / 180;
  const v = speedMph * MPH;
  return rollBall({ p: [0, 0], v: [v * Math.cos(a), v * Math.sin(a)], t: 0 }, green, null, { stopPastX });
}

// Where a putt stops if there were no hole in the way.
function rollFree(shot, green) {
  return rollNoHole(shot, green).rest;
}

// Lateral position (m) when the ball reaches the hole's distance along x,
// or where it stopped if it came up short.
function sideAtHole(shot, green, distance) {
  // Only as far as just past the hole: what it does after doesn't matter.
  const { path } = rollNoHole(shot, green, distance + 0.05);
  for (let i = 1; i < path.length; i++) {
    if (path[i][0] >= distance) {
      const a = path[i - 1];
      const b = path[i];
      const f = (distance - a[0]) / (b[0] - a[0] || 1);
      return a[1] + (b[1] - a[1]) * f;
    }
  }
  return path[path.length - 1][1];
}
