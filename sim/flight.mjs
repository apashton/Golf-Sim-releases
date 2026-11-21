// Ball flight, bounce and roll for a full shot.
//
// Pure functions with no browser or Node dependencies, so the same code draws
// the shot in the browser and is checked by the tests in test/.
//
// Frame: x is straight down the target line, y is up, z is to the golfer's
// right. Everything inside is SI (metres, seconds, radians); the edges convert
// from the launch monitor's mph / degrees / rpm and back to yards.

export const MPH = 0.44704; // m/s
export const YARD = 0.9144; // m
export const RPM = (2 * Math.PI) / 60; // rad/s

const BALL_MASS = 0.04593; // kg
const BALL_RADIUS = 0.021335; // m
const BALL_AREA = Math.PI * BALL_RADIUS * BALL_RADIUS;
const G = 9.81;

// Air density from temperature, altitude and humidity, so a summer day or
// a trip to altitude carries further, as it does outside. Humid air is
// thinner than dry (water vapour is lighter than the air it displaces):
// on a warm day about half a percent at 100%, a yard or so on a drive.
// humidity: percent, 0 (dry air, as it always was) - 100.
export function airDensity({ temperatureC = 20, altitudeM = 0, humidity = 0 } = {}) {
  // (From below the Dead Sea to above any course; a height past where the
  // formula holds would give no air, or NaN.)
  altitudeM = Number.isFinite(altitudeM) ? Math.min(6000, Math.max(-500, altitudeM)) : 0;
  temperatureC = Number.isFinite(temperatureC) ? Math.min(60, Math.max(-40, temperatureC)) : 20;
  const pressure = 101325 * Math.pow(1 - 2.25577e-5 * altitudeM, 5.25588);
  const kelvin = temperatureC + 273.15;
  const h = Number.isFinite(humidity) ? Math.min(100, Math.max(0, humidity)) / 100 : 0;
  if (h === 0) return pressure / (287.05 * kelvin);
  // Water vapour's pressure (Tetens), its share of the air's.
  const vapour = h * 610.78 * Math.exp((17.27 * temperatureC) / (temperatureC + 237.3));
  return (pressure - vapour) / (287.05 * kelvin) + vapour / (461.495 * kelvin);
}

// Drag and lift coefficients from the spin ratio S = r*omega / v and the
// speed v (m/s). Drag rises with spin - steeply at a driver's low spin,
// levelling off by an iron's - and jumps as the ball slows through the
// dimpled ball's drag crisis (Reynolds number about 7.5e4 down to 5e4: 27
// down to 19 m/s), which is what brings a mid iron down steeply at the end
// of its flight. Lift rises with spin from the start, easing off as it
// goes, and a little with speed (held beyond 77 m/s, 172 mph).
//
// Model 5 (October 2026 - the owner: "these low spin shots acting
// differently in Square SIM, [other simulators] ... all react the same yet our SIM end
// up similar distance but completely different rollout versus flight path
// ... a less TrackMan only orientated approach"). Model 4's lift faded
// almost to nothing at a driver's low spin, and its drag hardly fell with
// it, so a 1500 rpm drive flew low and short (150 mph, 12 degrees: 219 yds,
// 17 yds high) and made it up rolling 45 yds; the Omni's own display
// carried the owner's lowest-spin drives 3-6% further than it. Fitted
// together to:
//   - the air as measured: lift about 0.10-0.12 at S = 0.05 and 0.155 at
//     0.095 (Bearman and Harvey, the ball makers' wind-tunnel patents,
//     Ferguson, McNally and McPhee 2022's fit to 1,040 measured shots), and
//     drag about 0.21 at 0.09 falling towards 0.16 with no spin - the
//     strong fall with spin that lets a low-spin drive carry;
//   - the owner's 25 Omni drives (1690 - 4280 rpm) with the carry its own
//     display showed - within half a percent on average (1% rms), the
//     lowest-spin ones 1-3% short (model 4: 2.5-6%);
//   - TrackMan's tour averages through the bag, carry, apex and landing
//     angle (the trajectory, not just the carry), and its driver
//     optimisation table as a guard rail.
// So at 150 mph and 12 degrees a 1500 rpm drive carries 237 yds, 21 high,
// landing at 28 degrees (model 4: 219, 17 high, at 24, then rolling 45);
// 2500 rpm 247, 29 high, at 36 - much as the published models fitted to
// measured flights have it. A tour drive (171 mph, 10.4 degrees, 2545 rpm)
// peaks at 34 yds and lands at 38, as TrackMan's does (model 4: 29, at
// 35). A high launch with low spin is the longest, as the Omni's own
// carries have it; a knuckleball at a normal launch (1000 rpm at 12
// degrees) falls 28 yds short. See test/flight.test.mjs and
// test/omnifit.test.mjs.
const smooth = (u) => {
  const c = Math.min(1, Math.max(0, u));
  return c * c * (3 - 2 * c);
};
// The drag spin adds: SPIN_DRAG a unit of spin ratio at first, levelling
// off over SPIN_DRAG_SCALE. The part of the drag the carry match's spin
// factor scales.
export const SPIN_DRAG = 1.013;
export const SPIN_DRAG_SCALE = 0.21674;
export const spinDrag = (spinRatio) => SPIN_DRAG * SPIN_DRAG_SCALE * (1 - Math.exp(-Math.max(0, spinRatio) / SPIN_DRAG_SCALE));
export function dragCoefficient(spinRatio, speed) {
  return 0.15354 + spinDrag(spinRatio) + 0.223 * (1 - smooth((speed - 18.6) / 8)) - 0.00014 * (Math.min(speed, 77) - 50);
}
export function liftCoefficient(spinRatio, speed = 50) {
  return 0.35242 * (1 - Math.exp(-Math.pow(Math.max(0, spinRatio) / 0.14495, 0.86106))) * (1 - 0.00541 * (Math.min(speed, 77) - 50));
}

// Spin decays through the flight by the air the ball goes through, as
// Smits and Smith measured it (dw/dt = -2e-5 (v / r) w): about 6% a second
// at a drive's launch speed, 4% on average over its flight - TrackMan's own
// figure - so a tour drive lands with about three-quarters of its spin.
// (Model 4 lost 1% a second, and landed a drive with 93% of it.)
const SPIN_DECAY_PER_M = 2e-5 / BALL_RADIUS;

// The air as this model has it, and the version of the model: the stats
// keep it with every shot, so carries recorded under an earlier model can
// be brought into line with this one (see carryNowFor). The physics
// scorecard (tools/physics-scorecard.mjs) tries changes to it.
// decay: spin lost a second (an earlier model's), decayPerM: a metre.
export const AERO = Object.freeze({ drag: dragCoefficient, lift: liftCoefficient, decay: 0, decayPerM: SPIN_DECAY_PER_M });
export const FLIGHT_MODEL = 5;
// Version 1, until September 2026: drag and lift that let 3-woods to
// 6-irons carry 5-6% too far and land 4-7 degrees too flat.
const AERO_1 = {
  drag: (s, v) => 0.22 + 0.2 * Math.min(s, 0.6) + 0.1 * Math.max(0, 1 - v / 40),
  lift: (s) => 0.32 * (1 - Math.exp(-s / 0.13)),
  decay: 0.01,
};
// Version 2, September - October 2026: fitted to the tour averages alone;
// about 4% short of the Omni (and TrackMan's normalised carries) on an
// efficient, low-spin drive.
const AERO_2 = {
  drag: (s, v) => 0.228 + 0.261 * Math.min(s, 0.346) + 0.223 * (1 - smooth((v - 18.6) / 8)) - 0.00153 * (Math.min(v, 77) - 50),
  lift: (s, v = 50) => 0.3 * (1 - Math.exp(-s / 0.113)) * (1 - 0.0118 * (Math.min(v, 77) - 50)),
  decay: 0.01,
};
// Versions 3 and 4, October 2026: fitted to TrackMan's tables and the
// owner's Omni drives, but with next to no lift at a driver's low spin
// (above) - version 3's spin decaying 1% a second, version 4's half by the
// second and half by the air.
const AERO_4_DRAG = (s, v) => 0.1999 + 0.3612 * Math.min(s, 0.3236) + 0.223 * (1 - smooth((v - 18.6) / 8)) - 0.00195 * (Math.min(v, 77) - 50);
const AERO_4_LIFT = (s, v = 50) => 0.2786 * (1 - Math.exp(-Math.pow(Math.max(0, s) / 0.1066, 1.286))) * (1 - 0.01479 * (Math.min(v, 77) - 50));
const AERO_3 = { drag: AERO_4_DRAG, lift: AERO_4_LIFT, decay: 0.01 };
const AERO_4 = { drag: AERO_4_DRAG, lift: AERO_4_LIFT, decay: 0.005, decayPerM: 0.005 / 40 };
const EARLIER = { 1: AERO_1, 2: AERO_2, 3: AERO_3, 4: AERO_4 };

// The carry adjustment (Menu -> Ball flight, sim/carryadjust.mjs): the
// air's drag multiplied by this for every flight that doesn't ask for
// particular air, so every club can go a little further or shorter without
// touching the model itself, which stays fitted to TrackMan's tour tables.
// The server keeps it, and every page that flies shots sets it here from
// the server's status (online, the host can have everyone on 1). 1 is off,
// and the default, so nothing else changes: the stats' carryNowFor and the
// physics tools pass their air explicitly and never see it.
export const CARRY_MATCH_LIMITS = Object.freeze([0.6, 1.3]);
// The carry match's second part (issue 142): how much more (or less) the
// drag rises with spin than the model has it - the owner's Omni carried a
// 1700 rpm drive about 4% further than flight model 3, a 2900 rpm one about
// the same and a 4200 rpm one shorter, so its carries changed more with
// spin. The spin part of the drag (spinDrag) times this; 1 is the model's.
export const CARRY_SPIN_LIMITS = Object.freeze([0.5, 3]);
let carryScale = 1;
let carrySpin = 1;
let matchedAero = AERO;

const within = (v, [lo, hi], d = 1) => {
  const k = Number(v);
  return v === null || v === undefined || !Number.isFinite(k) || k <= 0 ? d : Math.min(hi, Math.max(lo, k));
};

// The model's air with its drag multiplied by k, and the part of it that
// comes from spin by `spin` first (AERO itself for 1 and 1).
export function aeroWithDrag(k, base = AERO, spin = 1) {
  const kk = k > 0 ? k : 1;
  const m = spin > 0 ? spin : 1;
  if (kk === 1 && m === 1) return base;
  return Object.freeze({ drag: (s, v) => kk * (base.drag(s, v) + (m - 1) * spinDrag(s)), lift: base.lift, decay: base.decay, decayPerM: base.decayPerM });
}

// Sets the carry match (a drag scale, kept within CARRY_MATCH_LIMITS, and a
// spin factor within CARRY_SPIN_LIMITS; 1, or anything that isn't a number,
// is off) and returns the drag scale now in force.
export function setCarryMatch(dragScale, spinScale = 1) {
  carryScale = within(dragScale, CARRY_MATCH_LIMITS);
  carrySpin = within(spinScale, CARRY_SPIN_LIMITS);
  matchedAero = aeroWithDrag(carryScale, AERO, carrySpin);
  return carryScale;
}
export const carryMatch = () => carryScale;
export const carrySpinMatch = () => carrySpin;

// How much further (a factor) this model carries a shot than an earlier
// one did (`from`: its FLIGHT_MODEL, 1 for a shot that kept none), from the
// launch monitor's numbers: carries recorded under it are multiplied by
// it, so a player's history and new shots compare fairly.
export function carryNowFor(ball, from = 1) {
  const old = EARLIER[from];
  if (!old) return 1;
  const then = straightCarry(ball, old);
  const now = straightCarry(ball, AERO);
  return then > 0.5 ? now / then : 1;
}

// What a carry in other air ({ temperatureC, altitudeM, humidity }) would
// have been at 20°C, sea level and in dry air, as a factor: a hot day or altitude carries
// further, so its carries are multiplied by this (under 1) before they're
// set against a club's normal distance.
export function seaLevelFactor(ball, air = {}) {
  const there = straightCarry(ball, AERO, air);
  const here = straightCarry(ball, AERO);
  return there > 0.5 ? here / there : 1;
}

// How a surface takes a landing. steepLoss is how much more speed a steeper
// landing loses (0.45 unless given). Fairway, firm, soft and rough were
// fitted (with the ball flight above) so full shots release as they do
// outside: on a normal fairway a tour driver runs out about 20 yards, an
// amateur's about 15, a 3-wood 13, a 5-iron 8-9, a 7-iron 4-5, a wedge
// next to nothing; firm ground about half as much again for the long clubs,
// soft about half as much, rough 5 to 7 yards for a driver (see
// test/flight.test.mjs).
export const SURFACES = {
  // (Refitted with flight model 5, whose drives land steeper, with less
  // spin left, and its low-spin ones further on: a tour drive landing at
  // 38 degrees runs out about 20 yds, as ShotLink's fairway drives do; a
  // 1500 rpm drive landing at 28 about 34 (model 4 flew it lower and
  // shorter, and it ran 45); a 7-iron 4-5, a wedge 2. Firm, soft, rough
  // and the first cut were fitted alongside it: firm about 1.6 times the
  // fairway's run-out, soft and the first cut half, rough a third - and a
  // tour wedge still spins back on soft ground.)
  fairway: { restitution: 0.2605, tangentialKeep: 0.6676, steepLoss: 0.3595, spinBite: 0.00006016, rollDecel: 1.5 },
  firm: { restitution: 0.32, tangentialKeep: 0.6823, steepLoss: 0.0603, spinBite: 0.0001029, rollDecel: 1.2 },
  soft: { restitution: 0.32, tangentialKeep: 0.7071, steepLoss: 0.7677, spinBite: 0.00006065, rollDecel: 3 },
  rough: { restitution: 0.15, tangentialKeep: 0.6869, steepLoss: 0.698, spinBite: 0.00004211, rollDecel: 5.5 },
  // The course's first cut releases about half as far as the fairway (a
  // driver about 10 yards against 21), and deep rough (and the trees) grabs
  // the ball: it barely moves once it lands. Their roll matches the
  // course's (course.mjs LIES).
  semi: { restitution: 0.15, tangentialKeep: 0.6941, steepLoss: 0.537, spinBite: 0.0000488, rollDecel: 3.8 },
  deep: { restitution: 0.1, tangentialKeep: 0.62, steepLoss: 0.9, spinBite: 0.00005, rollDecel: 9 },
  // Short game: a chip lands on the approach or on the green, then rolls.
  approach: { restitution: 0.28, tangentialKeep: 0.66, spinBite: 0.00012, spinFree: 1900, rollDecel: 1.6, softTouch: 2.5 },
  // Fitted both to chips - the classic carry:roll ratios, about 1:1 for a
  // sand wedge, 1:2 pitching wedge, 1:5 7-iron - and to full approaches
  // (GREEN_RELEASE in test/flight.test.mjs): a tour 7-iron (7000 rpm,
  // landing at 50 degrees) stops within a few yards and a tour wedge checks
  // back a yard, while a 7-iron at 3000 rpm (a flyer, landing at 42) runs
  // on 13-24 yards and a wedge at 3000 about 10. The first 1900 rpm
  // (spinFree) don't grip: a green turns a low-spinning ball over into a
  // roll instead of pulling it up, so spin checks a ball by what it has
  // beyond that. (Fitted to chips alone, it charged every rpm the same and
  // a 3000 rpm approach stopped nearly dead.) Putting, chipping and the
  // course roll a green at its own stimp; the rollDecel here (a stimp of
  // 10) is only for anything that has none.
  green: { restitution: 0.25, tangentialKeep: 0.66, steepLoss: 0.38, spinBite: 0.00012, spinFree: 1900, rollDecel: 0.55, softTouch: 2 },
  // A cart path: hard, so a ball comes off it high and fast and spin barely
  // grips - a driver pitching on one runs on well past where it would on
  // the fairway, and a wedge hops forward instead of checking. (It keeps
  // 90% of the ball's pace along it: with flight model 5's steeper
  // landings 86% left a drive pitching on it short of twice the
  // fairway's run.)
  path: { restitution: 0.4, tangentialKeep: 0.9, steepLoss: 0.2, spinBite: 0.00003, rollDecel: 1 },
  // Sand: the ball digs in, gives back next to nothing of its drop, and
  // spin can't grip. How much of its pace along the ground it keeps goes by
  // how steeply it comes in - all of the steepness counts (steepLoss 1): one
  // dropping in at 50 degrees stays by its pitch mark, as good as plugged,
  // while one coming in low skids on a couple of yards, a skimmer a few more.
  // (Once a flat 0.15 whatever the angle, so a thinned 5-iron stopped as dead
  // as a wedge.) Its roll matches the course's bunkers (course.mjs LIES).
  sand: { restitution: 0.05, tangentialKeep: 0.42, steepLoss: 1, spinBite: 0, softTouch: 1, rollDecel: 14 },
  // A waste area (sim/wastearea.mjs): firm, packed sand with heather and
  // scrub through it - the ball doesn't dig in as in a bunker but kicks up
  // off it, lower than off a fairway, the scrub taking its pace and most
  // of its spin's grip, and runs on a little (between the first cut's and
  // the rough's). Its roll matches the course's (course.mjs LIES).
  waste: { restitution: 0.17, tangentialKeep: 0.66, steepLoss: 0.55, spinBite: 0.00003, rollDecel: 5 },
};

// Launch monitor numbers to an initial state.
//   speedMph   ball speed
//   vla        vertical launch angle, degrees, up is positive
//   hla        horizontal launch angle, degrees, right is positive
//   totalSpin  rpm
//   spinAxis   degrees, positive tilts the axis so the ball curves right
export function launchState({ speedMph, vla, hla, totalSpin, spinAxis }) {
  // (Anything not a number - a direction or axis left out - as nothing:
  // straight, no spin, never a flight of NaN.)
  const fin = (x) => (Number.isFinite(x) ? x : 0);
  speedMph = Math.max(0, fin(speedMph));
  vla = fin(vla);
  hla = fin(hla);
  totalSpin = fin(totalSpin);
  spinAxis = fin(spinAxis);
  const v = speedMph * MPH;
  // A launch at or below level (a topped ball driven into the turf) leaves
  // as the lowest skimmer, half a degree up - the same floor the lie puts
  // on it (lie.mjs) - so it never flies underground, whichever screen
  // (range, course, shot data, chipping, warm-up drives) flies it.
  const up = (Math.max(0.5, vla ?? 0) * Math.PI) / 180;
  const side = (hla * Math.PI) / 180;
  const velocity = [
    v * Math.cos(up) * Math.cos(side),
    v * Math.sin(up),
    v * Math.cos(up) * Math.sin(side),
  ];
  // Pure backspin about the horizontal axis perpendicular to the start line
  // (pointing to the golfer's right when the ball starts straight), then tilted
  // by the spin axis. Omega x v then gives lift upwards and, with a positive
  // tilt, to the right.
  const tilt = (spinAxis * Math.PI) / 180;
  const w = totalSpin * RPM;
  const rightX = -Math.sin(side);
  const rightZ = Math.cos(side);
  const omega = [
    w * Math.cos(tilt) * rightX,
    -w * Math.sin(tilt),
    w * Math.cos(tilt) * rightZ,
  ];
  return { position: [0, 0, 0], velocity, omega };
}

function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function length(a) {
  return Math.hypot(a[0], a[1], a[2]);
}

// Integrates the flight until the ball comes back to the ground.
// Returns the sampled path and the state at landing.
export function simulateFlight(shot, env = {}) {
  const rho = airDensity(env);
  // A 20 ms step is plenty for RK4 here: a step four times finer moves a
  // carry by under a hundredth of a yard, and this runs three times faster
  // (the bunker-face helper and the course's club search fly many shots).
  const dt = 0.02;
  let { position: p, velocity: v, omega } = launchState(shot);
  const spin0 = length(omega);
  const axis = spin0 > 0 ? omega.map((c) => c / spin0) : [0, 0, 1];
  // The wind (m/s, in the shot's frame): one vector, or a function of the
  // height above the launch (m) - wind is stronger higher up
  // (sim/weather.mjs) - and of where the ball is (x along, z across, m) and
  // when (s), for a wind that changes through the flight.
  const still = [0, 0, 0];
  const windAt = typeof env.wind === "function" ? env.wind : () => env.wind ?? still;
  const path = [[...p, 0]];
  let t = 0;
  let apex = 0;
  const ground = env.groundAt ?? (() => 0);
  // The air: this model's, with the owner's carry match on it, unless
  // particular air is asked for (stats.mjs brings shots recorded under an
  // older model into line with this one).
  const { drag, lift, decay = 0, decayPerM = 0 } = env.aero ?? matchedAero;
  // Anything in the way (the course's trees: treehits.mjs), asked about
  // each step: obstacle(from, to, velocity, t, dt) gives null, or where the
  // ball goes on from instead { position, velocity, spin } - spin a factor
  // on what it had - and the flight carries on from there.
  const obstacle = env.obstacle;
  let spinKept = 1;
  // The air gone through so far (m), to the start of this step, and the
  // spin left at a time and that much air.
  let through = 0;
  let stepFrom = 0;
  const spinAt = (time, air) => spin0 * spinKept * Math.exp(-decay * time - decayPerM * air);
  const accel = (pos, vel, time) => {
    const wind = windAt(pos[1], pos[0], pos[2], time) ?? still;
    const rel = [vel[0] - wind[0], vel[1] - wind[1], vel[2] - wind[2]];
    const speed = length(rel);
    const spin = spinAt(time, through + length(vel) * (time - stepFrom));
    if (speed < 1e-6) return [0, -G, 0];
    const s = (BALL_RADIUS * spin) / speed;
    const q = (0.5 * rho * BALL_AREA * speed * speed) / BALL_MASS;
    const cd = drag(s, speed);
    const cl = lift(s, speed);
    const liftDir = cross(axis, rel);
    const liftLen = length(liftDir) || 1;
    return [0, 1, 2].map(
      (i) => -q * cd * (rel[i] / speed) + q * cl * (liftDir[i] / liftLen) - (i === 1 ? G : 0),
    );
  };
  // RK4: a few hundred steps per shot.
  while (t < 20) {
    stepFrom = t;
    const k1v = accel(p, v, t);
    const k1p = v;
    const v2 = v.map((c, i) => c + (k1v[i] * dt) / 2);
    const k2v = accel(p, v2, t + dt / 2);
    const k2p = v2;
    const v3 = v.map((c, i) => c + (k2v[i] * dt) / 2);
    const k3v = accel(p, v3, t + dt / 2);
    const k3p = v3;
    const v4 = v.map((c, i) => c + k3v[i] * dt);
    const k4v = accel(p, v4, t + dt);
    const k4p = v4;
    let np = p.map((c, i) => c + ((k1p[i] + 2 * k2p[i] + 2 * k3p[i] + k4p[i]) * dt) / 6);
    let nv = v.map((c, i) => c + ((k1v[i] + 2 * k2v[i] + 2 * k3v[i] + k4v[i]) * dt) / 6);
    // (The air gone through: the ball's speed at the step's ends. Its
    // own, not through the wind's: a few percent either way of a spin
    // loss that's a few percent itself.)
    const airWas = through;
    through += ((length(v) + length(nv)) / 2) * dt;
    t += dt;
    if (obstacle) {
      const met = obstacle(p, np, nv, t, dt);
      if (met) {
        np = met.position;
        nv = met.velocity;
        spinKept *= met.spin ?? 1;
      }
    }
    // The ground: flat at launch height, or env.groundAt(x, z) - metres
    // relative to the launch point, in the shot's frame - on real terrain.
    // Not in the first moment off the ground (it starts on it), unless it's
    // already coming down: a skimmer launched barely above level lands
    // within a few hundredths of a second.
    const g1 = ground(np[0], np[2]);
    if (np[1] < g1 && (t > 0.05 || nv[1] < 0)) {
      // Interpolate back to the exact moment it crossed the ground.
      const g0 = ground(p[0], p[2]);
      const f = Math.min(1, Math.max(0, (p[1] - g0) / (p[1] - g0 - (np[1] - g1))));
      const hit = p.map((c, i) => c + (np[i] - c) * f);
      hit[1] = g0 + (g1 - g0) * f;
      const hv = v.map((c, i) => c + (nv[i] - c) * f);
      path.push([...hit, t - dt + dt * f]);
      return {
        path,
        // (Its time the moment it crossed, as its place is - not the end of
        // the step.)
        landing: { position: hit, velocity: hv, spin: spinAt(t, airWas + (through - airWas) * f), time: t - dt + dt * f },
        apex,
      };
    }
    p = np;
    v = nv;
    apex = Math.max(apex, p[1]);
    // A point every step (every 20 ms) for the tracer and the face checks.
    path.push([...p, t]);
  }
  return { path, landing: { position: p, velocity: v, spin: 0, time: t }, apex };
}

// The carry alone (metres) of a straight shot - no side angle or spin
// tilt - in still air, at 20°C and sea level unless `air` ({ temperatureC,
// altitudeM, humidity }) says otherwise, with this model's aerodynamics (and the
// owner's carry match) unless others are given. It's the same flight as simulateFlight, step for step,
// but worked out with plain numbers instead of lists and without keeping
// the path, which makes it several times faster: carryNowFor needs two of
// these for every old shot in a player's stats. test/flight.test.mjs holds
// the two to the same answer.
export function straightCarry({ speedMph, vla, totalSpin = 0 }, { drag, lift, decay = 0, decayPerM = 0 } = matchedAero, air = {}) {
  const dt = 0.02;
  const k = (0.5 * airDensity(air) * BALL_AREA) / BALL_MASS;
  const up = (Math.max(0.5, vla ?? 0) * Math.PI) / 180;
  let x = 0;
  let y = 0;
  let vx = speedMph * MPH * Math.cos(up);
  let vy = speedMph * MPH * Math.sin(up);
  const spin0 = Math.abs(totalSpin * RPM);
  // Backspin lifts; spin the other way (a negative number) pushes down.
  const turn = totalSpin < 0 ? -1 : 1;
  // The pull of the air and gravity at a velocity (ux, uy) and time tt,
  // left in ax and ay.
  let ax = 0;
  let ay = 0;
  // The air gone through to the start of the step (as simulateFlight).
  let through = 0;
  let stepFrom = 0;
  const accel = (ux, uy, tt) => {
    const speed = Math.hypot(ux, uy);
    if (speed < 1e-6) {
      ax = 0;
      ay = -G;
      return;
    }
    const s = (BALL_RADIUS * spin0 * Math.exp(-decay * tt - decayPerM * (through + speed * (tt - stepFrom)))) / speed;
    const q = k * speed;
    const cd = drag(s, speed);
    const cl = lift(s, speed) * turn;
    ax = -q * cd * ux - q * cl * uy;
    ay = -q * cd * uy + q * cl * ux - G;
  };
  let t = 0;
  while (t < 20) {
    stepFrom = t;
    accel(vx, vy, t);
    const k1x = ax;
    const k1y = ay;
    const v2x = vx + (k1x * dt) / 2;
    const v2y = vy + (k1y * dt) / 2;
    accel(v2x, v2y, t + dt / 2);
    const k2x = ax;
    const k2y = ay;
    const v3x = vx + (k2x * dt) / 2;
    const v3y = vy + (k2y * dt) / 2;
    accel(v3x, v3y, t + dt / 2);
    const k3x = ax;
    const k3y = ay;
    const v4x = vx + k3x * dt;
    const v4y = vy + k3y * dt;
    accel(v4x, v4y, t + dt);
    const nx = x + ((vx + 2 * v2x + 2 * v3x + v4x) * dt) / 6;
    const ny = y + ((vy + 2 * v2y + 2 * v3y + v4y) * dt) / 6;
    const nvy = vy + ((k1y + 2 * k2y + 2 * k3y + ay) * dt) / 6;
    const nvx = vx + ((k1x + 2 * k2x + 2 * k3x + ax) * dt) / 6;
    through += ((Math.hypot(vx, vy) + Math.hypot(nvx, nvy)) / 2) * dt;
    vx = nvx;
    t += dt;
    // Back on the (flat) ground, by the same rule as simulateFlight.
    if (ny < 0 && (t > 0.05 || nvy < 0)) return x + (nx - x) * Math.min(1, Math.max(0, y / (y - ny)));
    x = nx;
    y = ny;
    vy = nvy;
  }
  return x;
}

// Bounces and roll-out after landing. Heuristic rather than first-principles:
// the ground model is tuned so a driver releases, a mid iron checks a little
// and a wedge stops close to its pitch mark, which is what a player expects.
// How much of its forward speed a ball keeps when it hits the ground: a steep
// landing loses more, and backspin bites. Negative means it spins back.
export function contactKeep(vh, vy, spinRpm, surface) {
  const steep = Math.atan2(vy, vh);
  const keep = surface.tangentialKeep * (1 - (surface.steepLoss ?? 0.45) * Math.sin(steep)) - surface.spinBite * bitingSpin(spinRpm, surface) * Math.sin(steep) ** 2;
  return Math.max(-0.08, Math.min(0.95, keep));
}

// The spin that grips. On most ground all of it; a green (spinFree) takes
// the first couple of thousand rpm in the contact itself - friction turns
// a low-spinning ball over into a roll rather than pulling it up - so only
// the spin beyond that checks the ball.
function bitingSpin(spinRpm, surface) {
  const free = surface.spinFree ?? 0;
  return Math.sign(spinRpm) * Math.max(0, Math.abs(spinRpm) - free);
}

// On the short game's surfaces (a green and the approach, which have a
// softTouch), a gentle contact takes less: what a bounce loses along the
// ground scales with how hard the ball comes down, up to softTouch (m/s),
// as the last touchdown's does. So a chip just quick enough to hop again
// keeps the pace one just too slow to hop would, instead of losing far
// more - without it, landing a yard further on could finish five yards
// shorter. (The full-shot surfaces keep their fitted roll-outs.)
function softKeep(keep, vy, surface) {
  if (surface.softTouch == null) return keep;
  const soft = Math.min(1, Math.max(0, vy) / surface.softTouch);
  return 1 - (1 - keep) * soft;
}

// One bounce: the ball arrives at the ground at p with velocity v and spin,
// loses speed to the surface and hops. Heuristic rather than first-principles,
// tuned so a driver releases, a mid iron checks a little and a wedge stops
// close to its pitch mark. Returns null when it's too slow to bounce again
// (it rolls from here), or { p, v, spinRpm, t, path } after the hop.
// `slope`, [dh/dx, dh/dz], for ground that isn't level (a hole rebuilt from
// a map): the bounce is then taken against the slope (see bounceOnSlope).
export function bounce(p, v, spinRpm, t, surface, slope = null) {
  if (slope && (slope[0] || slope[1])) return bounceOnSlope(p, v, spinRpm, t, surface, slope);
  const G = 9.81;
  const vh = Math.hypot(v[0], v[2]);
  const vy = -v[1];
  if (vy < 1.2 || vh < 0.01) return null;
  const dir = [v[0] / vh, v[2] / vh];
  const keep = softKeep(contactKeep(vh, vy, spinRpm, surface), vy, surface);
  const newVh = vh * keep;
  const newVy = vy * surface.restitution;
  const nv = [dir[0] * newVh, newVy, dir[1] * newVh];
  // Short ballistic hop, ignoring air forces at these speeds.
  const hopTime = (2 * newVy) / G;
  const dt = 0.01;
  const steps = Math.max(1, Math.ceil(hopTime / dt));
  const path = [];
  for (let i = 1; i <= steps; i++) {
    const tt = (hopTime * i) / steps;
    path.push([p[0] + nv[0] * tt, Math.max(0, newVy * tt - 0.5 * G * tt * tt), p[2] + nv[2] * tt, t + tt]);
  }
  return {
    p: [p[0] + nv[0] * hopTime, 0, p[2] + nv[2] * hopTime],
    v: [nv[0], -newVy, nv[2]],
    // The ground takes most of the spin. Spin that has pulled the ball back
    // (keep below zero) is topspin to a ball now going backwards: its sign
    // turns with the ball, so on the next bounce it carries it on back
    // rather than stopping it dead.
    spinRpm: (keep < 0 ? -1 : 1) * spinRpm * 0.45,
    t: t + hopTime,
    path,
  };
}

// The same bounce on sloping ground. What counts is how the ball meets the
// slope, not the horizontal: into a bank it comes in steeper, so it checks
// and hops up short; down a slope it comes in shallower and skips on. The
// speed into the slope and along it take the place of the vertical and
// horizontal, the hop comes back down onto the same slope, and heights in
// the path are above it.
function bounceOnSlope(p, v, spinRpm, t, surface, [gx, gz]) {
  const G = 9.81;
  const nl = Math.hypot(gx, 1, gz);
  const n = [-gx / nl, 1 / nl, -gz / nl]; // straight up out of the slope
  const vn = v[0] * n[0] + v[1] * n[1] + v[2] * n[2];
  const vin = -vn; // speed into the slope
  const vt = [v[0] - vn * n[0], v[1] - vn * n[1], v[2] - vn * n[2]]; // along it
  const along = Math.hypot(vt[0], vt[1], vt[2]);
  if (vin < 1.2 || along < 0.01) return null;
  // (Soft ground holds a ball as on the flat - a slope of nothing at all
  // bounces just as the flat does.)
  const keep = softKeep(contactKeep(along, vin, spinRpm, surface), vin, surface);
  const out = vin * surface.restitution;
  const nv = [vt[0] * keep + n[0] * out, vt[1] * keep + n[1] * out, vt[2] * keep + n[2] * out];
  // Back down onto the slope: n . (nv t - g t^2 / 2 up) = 0.
  const hopTime = (2 * out) / (G * n[1]);
  const dt = 0.01;
  const steps = Math.max(1, Math.ceil(hopTime / dt));
  const path = [];
  for (let i = 1; i <= steps; i++) {
    const tt = (hopTime * i) / steps;
    const dx = nv[0] * tt;
    const dz = nv[2] * tt;
    path.push([p[0] + dx, Math.max(0, nv[1] * tt - 0.5 * G * tt * tt - (gx * dx + gz * dz)), p[2] + dz, t + tt]);
  }
  return {
    p: [p[0] + nv[0] * hopTime, 0, p[2] + nv[2] * hopTime],
    v: [nv[0], nv[1] - G * hopTime, nv[2]],
    spinRpm: (keep < 0 ? -1 : 1) * spinRpm * 0.45,
    t: t + hopTime,
    path,
  };
}

// The last touchdown, too soft to bounce: it still takes some pace off (the
// more so the harder it comes down), and the ball rolls from here. On a
// slope (`slope` as for bounce) it's how hard it comes down into the slope
// that counts, and it rolls on along it.
export function touchdown(v, spinRpm, surface, slope = null) {
  if (slope && (slope[0] || slope[1])) {
    const [gx, gz] = slope;
    const nl = Math.hypot(gx, 1, gz);
    const n = [-gx / nl, 1 / nl, -gz / nl];
    const vn = v[0] * n[0] + v[1] * n[1] + v[2] * n[2];
    const vt = [v[0] - vn * n[0], v[1] - vn * n[1], v[2] - vn * n[2]];
    const along = Math.hypot(vt[0], vt[1], vt[2]);
    if (along <= 0.01) return vt;
    const keep = Math.max(0, contactKeep(along, -vn, spinRpm, surface));
    const soft = Math.min(1, Math.max(0, -vn) / (surface.softTouch ?? 2));
    const k = 1 - (1 - keep) * soft;
    return [vt[0] * k, vt[1] * k, vt[2] * k];
  }
  const vh = Math.hypot(v[0], v[2]);
  if (vh <= 0.01) return v;
  const keep = Math.max(0, contactKeep(vh, -v[1], spinRpm, surface));
  const soft = Math.min(1, Math.max(0, -v[1]) / (surface.softTouch ?? 2));
  const k = 1 - (1 - keep) * soft;
  return [v[0] * k, 0, v[2] * k];
}

// A ball still going fast along the ground isn't rolling yet: it skids and
// hops through the grass and loses pace far quicker than a rolling ball.
// Full shots are rolling well under ROLL_SPEED by the time they settle, so
// this changes nothing for them; a topped, thinned or skulled ball that
// comes in flat at 20-40 m/s now pulls up instead of rolling on for
// hundreds of yards (a topped drive about two-thirds as far as a good one).
// Extra slowing (m/s per second) on top of the grass's own, at `speed` m/s.
export const ROLL_SPEED = 8;
export function skidDecel(speed) {
  return 0.5 * Math.max(0, speed - ROLL_SPEED);
}

// Bounces and roll-out after landing on the range.
export function simulateGround(landing, surfaceName = "fairway") {
  const surface = SURFACES[surfaceName] ?? SURFACES.fairway;
  const path = [];
  let p = [...landing.position];
  let v = [...landing.velocity];
  let spinRpm = landing.spin / RPM;
  let t = landing.time;
  const dt = 0.01;

  for (let n = 0; n < 6; n++) {
    const b = bounce(p, v, spinRpm, t, surface);
    if (!b) {
      v = touchdown(v, spinRpm, surface);
      break;
    }
    path.push(...b.path);
    ({ p, v, spinRpm, t } = b);
  }

  // Roll along the ground, slowing at the surface's steady rate (plus the
  // skid while it's still going fast).
  let vh = Math.hypot(v[0], v[2]);
  const dir = vh > 0 ? [v[0] / vh, v[2] / vh] : [1, 0];
  if (vh > 0) {
    const sign = Math.sign(v[0] * dir[0] + v[2] * dir[1]) || 1;
    // (A surface with no slowing of its own would roll for ever: a minute
    // is far longer than any real roll.)
    const end = t + 60;
    while (vh > 0.02 && t < end) {
      vh = Math.max(0, vh - (surface.rollDecel + skidDecel(vh)) * dt);
      p = [p[0] + sign * dir[0] * vh * dt, 0, p[2] + sign * dir[1] * vh * dt];
      t += dt;
      if (Math.round(t / dt) % 3 === 0) path.push([...p, t]);
    }
  }
  path.push([...p, t]);
  return { path, rest: p, time: t };
}

// Everything the range needs from one shot.
export function simulateShot(shot, { surface = "fairway", ...env } = {}) {
  const flight = simulateFlight(shot, env);
  const ground = simulateGround(flight.landing, surface);
  const land = flight.landing;
  const landVh = Math.hypot(land.velocity[0], land.velocity[2]);
  return {
    path: [...flight.path, ...ground.path],
    flightPoints: flight.path.length,
    carry: Math.hypot(land.position[0], land.position[2]) / YARD,
    carryOffline: land.position[2] / YARD,
    total: Math.hypot(ground.rest[0], ground.rest[2]) / YARD,
    offline: ground.rest[2] / YARD,
    apex: flight.apex / YARD,
    hangTime: land.time,
    descentAngle: (Math.atan2(-land.velocity[1], landVh) * 180) / Math.PI,
    rest: ground.rest,
  };
}
