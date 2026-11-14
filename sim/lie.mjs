// The lie: what the ball is sitting in, and the slope of the stance. The
// launch monitor reads a clean strike off a flat mat; this turns that into the
// shot the same swing would give from where the ball actually is.
//
// Grass and sand:
//   first cut    a little speed and spin lost; hardly noticeable
//   rough        grass between club and ball: less spin (flyers), lower
//                speed, a touch higher
//   deep rough   the grass grabs the hosel: much less speed, face shut (left),
//                spin gone, pops up
//   fairway bunker   picked clean: a little speed and spin lost
//   greenside bunker splashed out on a cushion of sand: well down on speed,
//                high, and still some spin
//   waste area   firm sandy ground with heather and scrub (a heathland or
//                links hole's: sim/wastearea.mjs) - the ball sits up and
//                the club can be grounded, no bunker's rules: picked off
//                it, a touch less speed and spin than off the fairway
//
// Stance, in degrees (the courses are flat to look at, but a lie still has
// one - see stanceAt). On the tee and the fairway a slope moves the line
// but hardly the carry (FAIR_CARRY):
//   side    + ball above feet: the lie angle turns the face left, so it goes
//           left and draws, more with more loft
//           - ball below feet: right and fades, and harder to strike cleanly
//   slope   + uphill: more loft - higher, more spin, shorter, a touch left
//           - downhill: less loft - lower, less spin, a touch right
//
// None of the grass or sand is the same twice: each is a range (LIE_RANGES),
// and each shot draws where in it it falls.
//
// All for a right-handed golfer. Pure functions; the tests pin the
// directions down.

import { straightCarry, AERO } from "./flight.mjs";
import { BAG } from "./clubs.mjs";
import { PLUG_EFFECT, WET_SAND } from "./sand.mjs";

// How each grass or sand changes the strike.
//   speed, spin  multipliers on ball speed and spin
//   launch       degrees added to the launch angle
//   pull         degrees the start line moves left (negative hla)
// The clean lies are always the same. The rest (LIE_RANGES) are a range,
// and a shot lands somewhere in it (applyLie's severity); what's here for
// them is the middle of the range for a 7 iron, for anything that wants
// one number (a test shot playing the lie longer, say).
export const LIE_EFFECT = {
  tee: { speed: 1, spin: 1, launch: 0, pull: 0 },
  fairway: { speed: 1, spin: 1, launch: 0, pull: 0 },
  fringe: { speed: 1, spin: 0.95, launch: 0, pull: 0 },
  green: { speed: 1, spin: 1, launch: 0, pull: 0 },
  semi: { speed: 0.959, spin: 0.8, launch: 0.35, pull: 0.15 },
  rough: { speed: 0.87, spin: 0.53, launch: 1.25, pull: 0.9 },
  deep: { speed: 0.755, spin: 0.4, launch: 3, pull: 3 },
  trees: { speed: 0.788, spin: 0.53, launch: 0, pull: 0 },
  bunker: { speed: 0.892, spin: 0.75, launch: 0.25, pull: 0 },
  greenside: { speed: 0.684, spin: 0.78, launch: 5, pull: 0 },
  // A waste area: picked off firm sand, now and then a little heavy.
  waste: { speed: 0.926, spin: 0.8, launch: 0.2, pull: 0 },
  // Off a cart path: a clean strike, picked off a hard surface - a touch
  // lower, a touch less spin.
  path: { speed: 1, spin: 0.95, launch: -0.3, pull: 0 },
};

// The lies that aren't the same twice. Out of grass or sand no two strikes
// are alike - how much grass gets between the face and the ball, how much
// sand the club takes - so each of these is a range of carry, as a share
// of what the same swing carries off the fairway, from its mild end
// (severity 0) to its severe end (severity 1), with how the ball comes off
// at each: spin (a multiplier), launch (degrees added) and pull (degrees
// left). The ball speed at each end is whatever gives that carry for a
// full swing with the club (speedFactor), so the range holds for every
// club; in between, everything moves in step.
//
// Why these (for a full swing, as coaches and launch monitors put it):
//   first cut     92-102%: mostly a clean strike; at its best a flyer -
//                 grass trapped on the face takes spin off and it comes
//                 out hot, flying a touch further and running on
//   rough         80-95%: always a flyer's lost spin, and the grass slows
//                 the club - "a club more" - and wraps the hosel, pulling
//                 it left the heavier it is
//   deep rough    60-80%: the grass grabs the club: speed gone, the face
//                 shut (well left), little spin, pops up
//   trees         60-85%: under the branches, off roots and needles - a
//                 cut-down swing and a thin or heavy strike
//   fairway bunker 80-95%: picked clean it's nearly a fairway shot; catch
//                 any sand first and it's well short - "a club more"
//   waste area   86-98%: firm sand the ball sits up on, so mostly a clean
//                strike - a touch of sand or scrub caught now and then
//                takes some off, and some spin
//   greenside bunker 45-70%: a splash, sand and all - the swing carries
//                 about half what it would off grass ("twice the swing
//                 for the distance"), more with a thin layer of sand,
//                 less with a thick one; high, with some spin
// (Rough and deep rough were 75-92% and 50-75%; the owner: "Rough could be
// a little bit less harsh and deep rough can be a little bit less harsh".)
export const LIE_RANGES = {
  semi: { carry: [1.02, 0.92], mild: { spin: 0.7, launch: 0.5, pull: 0 }, severe: { spin: 0.9, launch: 0.2, pull: 0.3 } },
  rough: { carry: [0.95, 0.8], mild: { spin: 0.45, launch: 1, pull: 0.3 }, severe: { spin: 0.6, launch: 1.5, pull: 1.5 } },
  deep: { carry: [0.8, 0.6], mild: { spin: 0.45, launch: 2, pull: 2 }, severe: { spin: 0.35, launch: 4, pull: 4 } },
  trees: { carry: [0.85, 0.6], mild: { spin: 0.6, launch: 0, pull: 0 }, severe: { spin: 0.45, launch: 0, pull: 0 } },
  bunker: { carry: [0.95, 0.8], mild: { spin: 0.85, launch: 0, pull: 0 }, severe: { spin: 0.65, launch: 0.5, pull: 0 } },
  greenside: { carry: [0.7, 0.45], mild: { spin: 0.9, launch: 4, pull: 0 }, severe: { spin: 0.65, launch: 6, pull: 0 } },
  waste: { carry: [0.98, 0.86], mild: { spin: 0.9, launch: 0, pull: 0 }, severe: { spin: 0.7, launch: 0.4, pull: 0 } },
};

// How the way out of the grass matters (the owner, 10 October 2026: "more
// realistic penalties for lofts in tall grass. Low angles get hurt more a
// 50° exit gets hurt less - still something but always the better side as
// right exit path"; docs/PHYSICS-PLAN.md phase 1). Grass hurts a shot by
// how much of it gets between the club and the ball and how much the ball
// must push through on its way out: about the grass's depth over the tan of
// the launch angle - at 12° nearly five times what it is at 45°. So the
// ranges above are for a launch of EXIT.ref degrees; a lower one pays
// more of them (speed, spin, the pull left - the hosel snagged - and a
// wider scatter either side), a higher one less, never below EXIT.floor of
// them, so even a flop from deep rough pays something; and the higher
// exit always comes out nearer its line.
//   power  how strongly the length of the way out counts, by grass (the
//          deeper, the more)
//   scatter degrees either way the start line wanders at the reference
//          launch, by grass
export const EXIT = {
  ref: 18,
  floor: 0.35,
  most: 1.8,
  grass: {
    semi: { power: 0.5, scatter: 0.5 },
    rough: { power: 0.75, scatter: 1.5 },
    deep: { power: 0.9, scatter: 3 },
  },
};

// How much of a grass lie's range a launch of `vla` degrees pays: 1 at the
// reference launch, more lower, less higher (EXIT.floor - EXIT.most); 1
// off the grass (sand, trees, the clean lies) or with no launch known.
export function exitFactor(lie, vla) {
  const g = EXIT.grass[lie];
  if (!g || !Number.isFinite(vla)) return 1;
  const way = (a) => 1 / Math.tan(rad(Math.min(60, Math.max(4, a))));
  return Math.min(EXIT.most, Math.max(EXIT.floor, (way(vla) / way(EXIT.ref)) ** g.power));
}

// The share of a full swing's carry a lie leaves, in the middle of its
// range: 1 for a clean lie. For playing the lie: a club suggestion, a
// test shot hit harder to make up for it.
export function middleCarry(lie) {
  const r = LIE_RANGES[lie];
  return r ? (r.carry[0] + r.carry[1]) / 2 : 1;
}

// The same for a shot launching at `vla`: out of grass, a low one keeps
// less of its carry and a high one more (exitFactor) - roughly, as its
// speed loss scales.
export function middleCarryFor(lie, vla) {
  const share = middleCarry(lie);
  return 1 - (1 - share) * exitFactor(lie, vla);
}

// A severity for one shot: 0 the mild end, 1 the severe. Two draws
// averaged, so the middle of the range is the likeliest and either end is
// rare - as it is outside. `rand` for tests and replays.
export function drawSeverity(rand = Math.random) {
  return Math.min(1, Math.max(0, (rand() + rand()) / 2));
}

// The club a shot was probably hit with, when it isn't known: the bag's
// club launching nearest to it.
function bagClub(club, vla) {
  if (BAG[club]) return club;
  if (!Number.isFinite(vla)) return "7I";
  let best = "7I";
  for (const c of Object.keys(BAG)) if (Math.abs(BAG[c].vla - vla) < Math.abs(BAG[best].vla - vla)) best = c;
  return best;
}

// The ball speed multiplier that gives an end of a lie's range its carry,
// for a full swing with `club` (the bag's). Worked out once per lie, end
// and club: a couple of dozen quick flights.
const factors = new Map();
export function speedFactor(lie, end, club) {
  const r = LIE_RANGES[lie];
  if (!r) return LIE_EFFECT[lie]?.speed ?? 1;
  const c = bagClub(club);
  const key = `${lie}:${end}:${c}`;
  if (factors.has(key)) return factors.get(key);
  const b = BAG[c];
  const e = r[end];
  // With the model's own air: a factor, the same whatever carry match is in
  // force (and worked out once, whenever that is).
  const want = straightCarry({ speedMph: b.speed, vla: b.vla, totalSpin: b.spin }, AERO) * r.carry[end === "mild" ? 0 : 1];
  const carry = (k) => straightCarry({ speedMph: b.speed * k, vla: b.vla + e.launch, totalSpin: b.spin * e.spin }, AERO);
  let lo = 0.2;
  let hi = 1.4;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (carry(mid) < want) lo = mid;
    else hi = mid;
  }
  const k = (lo + hi) / 2;
  factors.set(key, k);
  return k;
}

// What a lie does to one strike: { speed, spin, launch, pull } at this
// severity (0 mild - 1 severe) with this club. The clean lies are always
// the same.
// launch: the shot's own launch angle - out of grass, a lower one pays
// more of the range and a higher one less (exitFactor); left out, the
// range as it is. wander: which way and how far this strike wanders, -1
// (left) to 1 (right) - the caller's draw (a shot's own seed, so a replay
// goes the same way); scatter is it in degrees.
export function lieEffect(lie, { severity = 0.5, club = null, vla = null, launch = null, wander = 0 } = {}) {
  const r = LIE_RANGES[lie];
  if (!r) return { ...(LIE_EFFECT[lie] ?? LIE_EFFECT.fairway), scatter: 0 };
  const s = Math.min(1, Math.max(0, severity));
  const c = bagClub(club, vla);
  const mix = (a, b) => a + (b - a) * s;
  const base = {
    speed: mix(speedFactor(lie, "mild", c), speedFactor(lie, "severe", c)),
    spin: mix(r.mild.spin, r.severe.spin),
    launch: mix(r.mild.launch, r.severe.launch),
    pull: mix(r.mild.pull, r.severe.pull),
  };
  const m = exitFactor(lie, launch);
  const g = EXIT.grass[lie];
  if (!g || launch == null) return { ...base, scatter: 0 };
  const way = Math.min(1, Math.max(-1, Number(wander) || 0));
  return {
    speed: 1 - (1 - base.speed) * m,
    spin: Math.max(0.12, 1 - (1 - base.spin) * m),
    launch: base.launch,
    pull: base.pull * m ** 1.2,
    scatter: way * g.scatter * m,
  };
}

export const LIE_NAMES = {
  tee: "Tee",
  fairway: "Fairway",
  fringe: "Fringe",
  green: "Green",
  semi: "First cut",
  rough: "Rough",
  deep: "Deep rough",
  trees: "Trees",
  bunker: "Fairway bunker",
  greenside: "Greenside bunker",
  waste: "Waste area",
  path: "Cart path",
};

// Loft by club, degrees; for anything else, a guess from the launch angle.
const LOFT = { DR: 10.5, "3W": 15, "5W": 18, "4H": 21, "4I": 22, "5I": 25, "6I": 28, "7I": 32, "8I": 36, "9I": 40, PW: 45, AW: 48, GW: 52, SW: 56, LW: 60 };
export const loftOf = (club, vla = 15) => LOFT[club] ?? Math.min(60, Math.max(9, vla * 1.6));

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

// The tee and the fairway: a sloping stance there still moves the line -
// above the feet it starts left and draws, below it fades - but its carry
// stays within this share of the same strike off a flat lie (the owner:
// "Fairways should be 98 to 100%. There shouldn't really be any difference
// to that"). Off them, the slope costs what it costs, on top of the grass.
export const FAIR_CARRY = [0.98, 1];
const FAIR_LIES = new Set(["tee", "fairway"]);

// The ball speed that keeps a sloping tee or fairway stance's carry within
// FAIR_CARRY of the flat lie's: the two carries from quick straight flights
// and, when the stance's is outside, its speed scaled to the nearer edge
// (near here carry goes as a power of speed, found from one flight more).
function fairSpeed(flat, out) {
  const fly = (speedMph) => straightCarry({ ...out, speedMph });
  const level = straightCarry(flat);
  if (!(level > 0)) return out.speedMph;
  let speed = out.speedMph;
  for (let i = 0; i < 2; i++) {
    const got = fly(speed);
    const want = Math.min(FAIR_CARRY[1], Math.max(FAIR_CARRY[0], got / level)) * level;
    if (!(got > 0) || Math.abs(want - got) <= level * 0.0005) break;
    const power = Math.log(fly(speed * 1.05) / got) / Math.log(1.05);
    if (!(power > 0.2)) break;
    speed *= (want / got) ** (1 / power);
  }
  return speed;
}

// shot: { speedMph, vla, hla, totalSpin, spinAxis } as the launch monitor
// sent it. Returns the shot from this lie and stance.
// severity: where in the lie's range this strike falls, 0 (mild) to 1
// (severe) - drawSeverity for a real shot; the middle when it's left out,
// for anything planning a shot rather than playing one. It also moves the
// speed a sloping stance costs, from half to half as much again.
// wander: -1 to 1, which way and how far out of grass the strike wanders
// (lieEffect); 0, none, for anything planning a shot.
// In sand (sim/sand.mjs): plug, a plugged ball ("egg" or "buried") - less
// speed, most of the spin gone, lower; wet, how wet the sand is (0 - 1) -
// a touch hotter, less spin.
export function applyLie(shot, { lie = "fairway", stance = FLAT, club = null, severity = 0.5, wander = 0, plug = null, wet = 0 } = {}) {
  const e = lieEffect(lie, { severity, club, vla: shot.vla, launch: shot.vla, wander });
  const strike = 0.5 + Math.min(1, Math.max(0, severity));
  let speed = shot.speedMph * e.speed;
  let vla = (shot.vla ?? 0) + e.launch;
  let hla = (shot.hla ?? 0) - e.pull + (e.scatter ?? 0);
  let spin = (shot.totalSpin ?? 0) * e.spin;
  if (SANDS.has(lie)) {
    const p = PLUG_EFFECT[plug];
    if (p) {
      speed *= p.speed;
      spin *= p.spin;
      vla += p.launch;
    }
    const w = Math.min(1, Math.max(0, wet));
    speed *= 1 + (WET_SAND.speed - 1) * w;
    spin *= 1 + (WET_SAND.spin - 1) * w;
  }
  let axis = shot.spinAxis ?? 0;

  const side = stance.side ?? 0;
  const slope = stance.slope ?? 0;
  if (side) {
    // The lie angle tilts the face: it points left of target by about
    // atan(tan(tilt) * sin(loft)) with the ball above the feet, right below.
    const loft = loftOf(club, shot.vla);
    const turn = deg(Math.atan(Math.tan(rad(Math.abs(side))) * Math.sin(rad(loft))));
    const dir = side > 0 ? -1 : 1; // above: left
    hla += dir * turn * 0.8;
    axis += dir * turn * 1.2; // draw (negative axis) above, fade below
    // Below the feet is the harder strike.
    if (side < 0) speed *= 1 - 0.008 * strike * Math.abs(side);
  }
  if (slope) {
    // Up: the slope adds loft. Down: takes it away.
    vla += slope * 0.8;
    spin *= 1 + 0.025 * slope;
    speed *= 1 - 0.005 * strike * Math.abs(slope);
    hla -= slope * 0.2;
  }
  const out = {
    ...shot,
    speedMph: speed,
    vla: Math.max(0.5, vla),
    hla,
    totalSpin: Math.max(0, spin),
    spinAxis: axis,
  };
  if (FAIR_LIES.has(lie) && (side || slope)) out.speedMph = fairSpeed(shot, out);
  return out;
}

export const FLAT = Object.freeze({ side: 0, slope: 0 });
const SANDS = new Set(["bunker", "greenside"]);

// ---- The stance at a spot on a hole ------------------------------------------------

// Smooth noise, so a ball a few yards away sits on much the same slope.
function hash(ix, iz, seed) {
  let h = (ix * 374761393 + iz * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise(x, z, seed) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const u = fx * fx * (3 - 2 * fx);
  const v = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz, seed);
  const b = hash(ix + 1, iz, seed);
  const c = hash(ix, iz + 1, seed);
  const d = hash(ix + 1, iz + 1, seed);
  return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1; // -1..1
}

// How much slope each surface tends to have, degrees at most.
const UNEVEN = { fairway: 4, semi: 5, rough: 6, deep: 7, trees: 7, bunker: 3, greenside: 4, fringe: 2, waste: 5 };
const CELL = 14; // metres: the size of a bump

// The stance at (x, z) on a hole: a lie on the tee or green is flat;
// elsewhere the ground rolls a little, same for everyone who plays the hole.
// Slopes under two degrees count as flat, so many lies are.
export function stanceAt(seed, x, z, lie) {
  const most = UNEVEN[lie];
  if (!most) return FLAT;
  const shape = (n) => {
    const v = n * most * 1.4;
    if (Math.abs(v) < 2) return 0;
    return Math.round(Math.max(-most, Math.min(most, v)));
  };
  return {
    side: shape(noise(x / CELL, z / CELL, seed ^ 0x5eed)),
    slope: shape(noise(x / CELL + 91.7, z / CELL - 13.3, seed ^ 0xbeef)),
  };
}

// "Ball above your feet (4°), slight downhill" - or "" for a flat lie.
export function describeStance(stance) {
  const parts = [];
  const size = (v) => (Math.abs(v) < 3 ? "slightly " : "");
  if (stance.side > 0) parts.push(`ball ${size(stance.side)}above your feet (${stance.side}°)`);
  if (stance.side < 0) parts.push(`ball ${size(stance.side)}below your feet (${-stance.side}°)`);
  if (stance.slope > 0) parts.push(`${size(stance.slope)}uphill (${stance.slope}°)`);
  if (stance.slope < 0) parts.push(`${size(stance.slope)}downhill (${-stance.slope}°)`);
  const text = parts.join(", ");
  return text ? text[0].toUpperCase() + text.slice(1) : "";
}

// The whole lie in words: "Rough - ball above your feet (4°)".
export function describeLie(lie, stance = FLAT) {
  const s = describeStance(stance);
  return s ? `${LIE_NAMES[lie] ?? lie} - ${s[0].toLowerCase()}${s.slice(1)}` : (LIE_NAMES[lie] ?? lie);
}

// The stance from the real slope of the ground, on a hole rebuilt from a
// map: gradient [dh/dx, dh/dz] in the hole's frame, aim in radians (0 down
// x). A right-handed golfer stands on the left of the line, so ground
// rising to the right of it puts the ball above their feet; rising along it
// is an uphill lie. Whole degrees; under one counts as flat.
export function stanceFromSlope([gx, gz], aim) {
  const along = gx * Math.cos(aim) + gz * Math.sin(aim);
  const right = -gx * Math.sin(aim) + gz * Math.cos(aim);
  const d = (v) => {
    const a = Math.round((Math.atan(v) * 180) / Math.PI);
    return Math.abs(a) < 1 ? 0 : Math.max(-12, Math.min(12, a));
  };
  return { side: d(right), slope: d(along) };
}
