// Chips: a short flight, a bounce or two on the approach or the green, then
// a roll-out at the green's speed that can find the hole.
//
// Same frame as the rest of the physics: x from the ball towards the hole,
// z to the golfer's right, metres inside and yards/feet at the edges.

import { simulateFlight, bounce, touchdown, skidDecel, SURFACES, YARD, RPM } from "./flight.mjs";
import { rollBall, rollingDecel, finishFeet, landNearCup, landedAt, HOLE_RADIUS } from "./putting.mjs";
import { greenOutline, FRINGE_WIDTH } from "./greenshape.mjs";

export const CHIP_DISTANCES = [10, 15, 20, 25, 30, 40, 50];

// Where the green starts and a sensible spot to land it, for a chip of a
// given length: the green begins about a third of the way there, and the
// default landing spot is a couple of yards on.
// With a hazard to chip over (a bunker or a pond: HAZARDS), the pin is cut
// a few yards onto the green, just past it - short-sided - so a chip that
// lands short is in it, and one that lands safely on runs past unless it
// comes down soft: a flop shot (FLOP).
export function chipLayout(holeYards, landingYards = null, stimp = 10, hazard = null) {
  const over = HAZARDS[hazard] && hazardFits(holeYards) ? hazard : null;
  const greenStartYards = over ? tenth(holeYards - pinOnYards(holeYards)) : Math.min(12, Math.max(2, Math.round(holeYards * 0.3)));
  const landing = landingYards ?? (over ? Math.min(holeYards - 1, greenStartYards + 1) : Math.min(holeYards - 2, greenStartYards + 2));
  const out = { holeYards, greenStartYards, landingYards: landing, stimp };
  if (over) out.hazard = { kind: over, from: Math.max(HAZARD.fromYards, Math.round(holeYards * HAZARD.fromShare * 10) / 10), to: tenth(greenStartYards - HAZARD.fringeYards), seed: 7 + holeYards };
  return out;
}

// ---- Something to chip over ------------------------------------------------------

// What can lie between the ball and the pin.
export const HAZARDS = { bunker: "A bunker", water: "Water" };
export const HAZARD = {
  // From this far in front of the ball (yards, or this share of the way,
  // whichever is further) to a strip of fringe before the green.
  fromYards: 2,
  fromShare: 0.2,
  fringeYards: 0.7,
  // The pin this far onto the green: 3.5 yds on a short chip, up to 5 on a
  // long one - too little for a lob wedge's usual chip to stop in, enough
  // for a flop.
  pinOn: [3.5, 5],
  // Metres either side of the line: it runs right across the approach.
  half: 11,
  // A chip shorter than this has no room for one.
  minYards: 8,
};
// The practice green's choice (chipping.js), and the hazard each chip gets
// from it: "mixed" puts one in front of about one chip in three, a bunker
// or water.
export const HAZARD_CHOICES = { none: "None", bunker: "A bunker", water: "Water", mixed: "Now and then - a bunker or water" };
export function hazardFor(choice, rand = Math.random) {
  if (HAZARDS[choice]) return choice;
  if (choice !== "mixed") return null;
  const r = rand();
  return r < 1 / 6 ? "bunker" : r < 1 / 3 ? "water" : null;
}

const tenth = (v) => Math.round(v * 10) / 10;
export const pinOnYards = (holeYards) => Math.round(Math.min(HAZARD.pinOn[1], Math.max(HAZARD.pinOn[0], 3 + holeYards * 0.04)) * 10) / 10;
export const hazardFits = (holeYards) => holeYards >= HAZARD.minYards;

// The hazard's edge, round its middle (physics frame, metres): an ellipse
// across the line, as long as the gap allows and no longer, with a gentle
// wave in its edge so it isn't drawn with a ruler. Never past its ends.
export function hazardShape(hz) {
  const from = hz.from * YARD;
  const to = hz.to * YARD;
  const cx = (from + to) / 2;
  const rx = (to - from) / 2;
  const rz = HAZARD.half;
  const phase = (hz.seed * 1.7) % 6.28;
  const radius = (phi) => {
    const e = (rx * rz) / Math.hypot(rz * Math.cos(phi), rx * Math.sin(phi));
    return e * (1 - 0.07 * (0.5 + 0.5 * Math.sin(phi * 3 + phase)) - 0.04 * (0.5 + 0.5 * Math.sin(phi * 7 + phase * 2)));
  };
  return { cx, cz: 0, radius };
}

export function inHazard(hz, x, z) {
  const s = hazardShape(hz);
  const dx = x - s.cx;
  const dz = z - s.cz;
  return Math.hypot(dx, dz) <= s.radius(Math.atan2(dz, dx));
}

// Its outline, physics frame: [[x, z], ...].
export function hazardOutline(hz, n = 64) {
  const s = hazardShape(hz);
  return Array.from({ length: n }, (_, i) => {
    const phi = (i / n) * Math.PI * 2;
    const r = s.radius(phi);
    return [s.cx + Math.cos(phi) * r, s.cz + Math.sin(phi) * r];
  });
}

// A flop: the lob wedge's face laid wide open, swung hard - it goes up
// steeply and comes down soft, rolling a yard or two where the usual lob
// wedge chip runs five.
export const FLOP = { vla: 48, spin: 3500 };

// The green as chipping.js draws it, in the physics frame (x towards the
// hole, z to the right, metres): it starts at the green's front and runs to
// well past the hole, a wavy ellipse (greenshape.mjs) with a collar of
// fringe round it; a strip of approach leads up to it, and rough is all
// round. `across` and `along` are its half-widths.
export const APPROACH = { behind: 6, halfWidth: 9 };
export function chipGreen(layout) {
  const front = layout.greenStartYards * YARD;
  const back = (layout.holeYards + Math.max(8, layout.holeYards * 0.35)) * YARD;
  const along = (back - front) / 2;
  return { front, centre: front + along, along, across: Math.max(9, along * 0.75), seed: 23 };
}

// What a chip is on at (x, z): "green", "fringe" (the collar round the
// green, and the approach leading up to it - they play the same), the
// hazard's "bunker" or "water", or "rough" (beyond them all).
export function chipGround(layout) {
  const g = chipGreen(layout);
  // The drawing's outline is in its own x (across) and z (back towards
  // the player) - see scenery.js toWorld.
  const edge = greenOutline(g.across, g.along, g.seed);
  return (x, z) => {
    const dx = z;
    const dz = g.centre - x;
    const d = Math.hypot(dx, dz);
    const r = edge(Math.atan2(dz, dx));
    if (d < r) return "green";
    if (layout.hazard && inHazard(layout.hazard, x, z)) return layout.hazard.kind;
    // The landing spots start at the green's front (greenStartYards); the
    // wavy edge drawn there sits up to half a metre further on, so across
    // the front the green starts at the spots, as it always has.
    if (x >= g.front && dz > 0 && d < r + FRINGE_WIDTH && Math.abs(z) < g.across / 2) return "green";
    if (d < r + FRINGE_WIDTH) return "fringe";
    if (x < g.front + 1 && x > -APPROACH.behind && Math.abs(z) <= APPROACH.halfWidth) return "fringe";
    return "rough";
  };
}

// How each of those takes a bounce and slows a rolling ball (the green's
// roll is its stimp).
// Sand takes a ball in where it lands and stops it in a yard or so.
const SAND = { restitution: 0.04, tangentialKeep: 0.3, steepLoss: 1, spinBite: 0, rollDecel: 14 };
const CHIP_SURFACES = { green: SURFACES.green, fringe: SURFACES.approach, rough: SURFACES.rough, bunker: SAND, water: { ...SAND, rollDecel: 200 } };

// Landing spots worth offering: from the front of the green to near the hole.
export function landingChoices(holeYards) {
  const { greenStartYards } = chipLayout(holeYards);
  const out = [];
  for (let y = greenStartYards; y <= holeYards - 1; y++) out.push(y);
  return out;
}

// Flies and rolls a chip. Returns the full path ([x, y, z, t] points), where
// it first touched down, and how it finished against the hole.
// A chip is played from off the green, so the flag is in: the ball can hit
// the pole in the cup (sim/cup.mjs) - a firm one knocks back off it, and
// it helps a moderate one drop. `pin: false` plays it to an empty cup, for
// comparison; `hole: false` to a green with no hole at all (the
// landing-zone game, and working out where to land it) - it can't drop,
// and its finish is measured from where the hole would be.
// A ball coming down on or by the hole - in the air, or hopping - is the
// cup's from the moment it's within reach and low (putting.mjs landNearCup):
// it can dunk, land on the rim, or clatter off the back edge and out.
export function simulateChip(shot, layout, holeRadius = HOLE_RADIUS, { pin = true, hole: withHole = true } = {}) {
  const flight = simulateFlight(shot);
  const spot = { x: layout.holeYards * YARD, z: 0, r: holeRadius };
  const hole = withHole ? spot : null;
  const green = { stimp: layout.stimp, uphill: 0, fallRight: 0 };
  const groundAt = chipGround(layout);
  const path = [...flight.path];
  // How much of the path is in the air before it first comes down (the cup
  // can take a ball still in the air, and then it lands in its model).
  let flightPoints = path.length;
  const stimpDecel = rollingDecel(layout.stimp);
  // The roll: at the green's speed on the green, slower on the fringe and
  // approach, much slower in the rough - and faster still while a skulled
  // one is skidding (flight.mjs skidDecel), so it can't run on for ever.
  const friction = (x, z, speed) => {
    const on = groundAt(x, z);
    return (on === "green" ? stimpDecel : CHIP_SURFACES[on].rollDecel) + skidDecel(speed);
  };

  let p = [...flight.landing.position];
  let v = [...flight.landing.velocity];
  let spinRpm = flight.landing.spin / RPM;
  let t = flight.landing.time;
  let since = path[0]?.[3] ?? 0;
  const firstBounce = [p[0], p[2]];
  // What the cup did to it, over every visit, for its sound.
  const cup = { lipTime: null, pinTime: null, events: [] };
  const note = (w) => {
    cup.events.push(...(w.cupEvents ?? []));
    if (w.holed) return;
    if (w.lipTime != null) cup.lipTime = w.lipTime;
    if (w.pinTime != null && cup.pinTime == null) cup.pinTime = w.pinTime;
  };

  const result = (holed, rest, how, cupSpeed = null, cupTime = null) => {
    const finish = holed ? { leaveFeet: 0, longFeet: 0, rightFeet: 0 } : finishFeet(rest, spot);
    const lipped = !holed && cup.lipTime != null;
    // Where it finished: "green", "fringe", "rough", "bunker" or "water"
    // (in the water it's lost: `water`).
    const finishedIn = holed ? "green" : groundAt(rest[0], rest[1]);
    return {
      finishedIn,
      ...(finishedIn === "water" ? { water: true } : {}),
      path,
      flightPoints,
      holed,
      lipped,
      ...(lipped ? { lipTime: cup.lipTime } : {}),
      ...(holed && cupSpeed != null ? { cupSpeed } : {}),
      ...(holed && cupTime != null ? { cupTime } : {}),
      ...(!holed && cup.pinTime != null ? { pinTime: cup.pinTime } : {}),
      ...(cup.events.length ? { cupEvents: cup.events } : {}),
      how,
      rest,
      firstBounce,
      carryYards: firstBounce[0] / YARD,
      carryOfflineYards: firstBounce[1] / YARD,
      landingMissYards: Math.hypot(firstBounce[0] / YARD - layout.landingYards, firstBounce[1] / YARD),
      totalYards: rest[0] / YARD,
      ...finish,
    };
  };

  // Bounces, each on whatever it lands on - unless it comes down on or by
  // the hole, when the cup has it.
  let w = null;
  let airborne = true;
  // A touchdown the cup has just handed back, to bounce as any other.
  let handed = false;
  for (let n = 0; n < 8; n++) {
    w = hole && !handed ? landNearCup({ p, v, t, spinRpm }, since, green, hole, { friction, pin }) : null;
    handed = false;
    if (w) {
      // Its fall from where the cup took it is the cup's.
      while (path.length > 1 && path[path.length - 1][3] > w.from) path.pop();
      path.push(...w.path);
      note(w);
      if (airborne) flightPoints = landedAt(path, w.grounded);
      if (!w.landed) break;
      // Down on the green by the hole (off the pin, perhaps): it bounces.
      ({ t, spinRpm } = w);
      p = [w.p[0], 0, w.p[2]];
      v = [...w.v];
      w = null;
      handed = true;
      airborne = false;
    }
    const under = groundAt(p[0], p[2]);
    // Down in the water: that's where it stays.
    if (under === "water") return result(false, [p[0], p[2]], "in the water");
    const surface = CHIP_SURFACES[under];
    const b = bounce(p, v, spinRpm, t, surface);
    if (!b) {
      // Too soft to bounce, but touching down still takes pace off (and
      // spin can check it) - the same touchdown as every other full shot.
      v = touchdown(v, spinRpm, surface);
      break;
    }
    airborne = false;
    since = t;
    path.push(...b.path);
    ({ p, v, spinRpm, t } = b);
  }
  if (w) {
    if (w.holed) return result(true, [hole.x, hole.z], airborne && w.firstTouch !== "green" ? "in on the fly" : "rolled in", w.cupSpeed, w.cupTime);
    if (w.stopped) return result(false, [w.p[0], w.p[2]], "");
    p = [w.p[0], 0, w.p[2]];
    v = [w.v[0], 0, w.v[2]];
    t = w.t;
  }

  const roll = rollBall({ p: [p[0], p[2]], v: [v[0], v[2]], t }, green, hole, { frictionAt: friction, pin });
  note(roll);
  for (const [x, z, tt, y] of roll.path) path.push([x, y ?? 0, z, tt]);
  const wet = !roll.holed && groundAt(roll.rest[0], roll.rest[1]) === "water";
  return result(roll.holed, roll.rest, roll.holed ? "rolled in" : wet ? "rolled into the water" : "", roll.cupSpeed, roll.cupTime);
}

// Typical launch and spin for a chip with each club, for test chips.
export const CHIP_CLUBS = {
  LW: { vla: 33, spin: 4600 },
  SW: { vla: 27, spin: 3600 },
  GW: { vla: 24, spin: 3200 },
  AW: { vla: 23, spin: 3100 },
  PW: { vla: 22, spin: 3000 },
  "9I": { vla: 19, spin: 2600 },
  "8I": { vla: 16, spin: 2200 },
  "7I": { vla: 13, spin: 1900 },
};

// The ball speed that carries a chip with this club a given number of yards.
// `flop`: the lob wedge's flop (FLOP) instead of the club's usual chip.
export function chipForCarry(club, carryYards, { flop = false } = {}) {
  const c = flop ? FLOP : (CHIP_CLUBS[club] ?? CHIP_CLUBS.SW);
  let lo = 3;
  let hi = 90;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    const f = simulateFlight({ speedMph: mid, vla: c.vla, hla: 0, totalSpin: c.spin, spinAxis: 0 });
    if (f.landing.position[0] / YARD < carryYards) lo = mid;
    else hi = mid;
  }
  return { speedMph: (lo + hi) / 2, vla: c.vla, hla: 0, totalSpin: c.spin, spinAxis: 0 };
}

// ---- Where to land it --------------------------------------------------------------
//
// Where a chip with each club has to land to finish at the hole, on this
// green at this speed. Worked out with the chip's own physics rather than a
// rule of thumb: the club's usual launch and spin (CHIP_CLUBS), the ball
// speed searched for until it stops at the hole - so a sand wedge on a slow
// green lands well on and a 7 iron on a quick one barely makes the fringe,
// and landing on the spot leaves it by the pin.

// How the search goes: ball speeds a step apart from a dribble up, until one
// finishes past the hole, then halved down between the last two.
const PLAN_START_MPH = 4;
const PLAN_STEP_MPH = 4;
const PLAN_MAX_MPH = 110;
const PLAN_HALVINGS = 10;

// Where a chip at this speed with this club lands and finishes, yards.
function flyPlan(club, speedMph, layout, flop = false) {
  const c = flop ? FLOP : (CHIP_CLUBS[club] ?? CHIP_CLUBS.SW);
  const r = simulateChip({ speedMph, vla: c.vla, hla: 0, totalSpin: c.spin, spinAxis: 0 }, layout, HOLE_RADIUS, { hole: false });
  return { speedMph, carry: r.carryYards, finish: r.rest[0] / YARD };
}

// A step at a time (each yield is one chip flown), for a page that can't
// stop for the whole search: the plan for one club.
//   { club, ok: true, landingYards, rollYards, speedMph, onGreenYards }
//     landingYards  where to land it; rollYards the rest of the way
//     onGreenYards  how far onto the green that is (below 0: short of it,
//                   on the approach)
//   { club, ok: false, why }  when no chip with it stops at the hole
// Over a hazard, the lob wedge that can't stop it by the hole with its usual
// chip is played as a flop (FLOP): its plan then says `flop: true`.
export function* landingPlanSteps(layout, club) {
  const plan = yield* clubPlanSteps(layout, club, false);
  if (plan.ok || !layout.hazard || club !== "LW") return plan;
  const flop = yield* clubPlanSteps(layout, club, true);
  return flop.ok ? { ...flop, flop: true } : plan;
}

// Over a hazard a chip can come up short of the hole whatever its speed (in
// the bunker or the water) or jump from short to long (over it and running
// on): a plan that can't finish within this of the hole is none.
const PLAN_MISS_YARDS = 0.75;

function* clubPlanSteps(layout, club, flop) {
  const target = layout.holeYards;
  let below = flyPlan(club, PLAN_START_MPH, layout, flop);
  yield;
  if (below.finish >= target) return { club, ok: false, why: "runs past the hole even from the softest chip" };
  let above = null;
  for (let s = PLAN_START_MPH + PLAN_STEP_MPH; s <= PLAN_MAX_MPH; s += PLAN_STEP_MPH) {
    const f = flyPlan(club, s, layout, flop);
    yield;
    if (f.finish >= target) {
      above = f;
      break;
    }
    below = f;
  }
  if (!above) return { club, ok: false, why: "can't get it to the hole" };
  for (let i = 0; i < PLAN_HALVINGS; i++) {
    const f = flyPlan(club, (below.speedMph + above.speedMph) / 2, layout, flop);
    yield;
    if (f.finish >= target) above = f;
    else below = f;
  }
  const best = Math.abs(below.finish - target) <= Math.abs(above.finish - target) ? below : above;
  if (layout.hazard) {
    if (Math.abs(best.finish - target) > PLAN_MISS_YARDS) return { club, ok: false, why: best.finish < target ? "can't carry it and stop it" : "can't stop it by the hole" };
    // Carried onto the green, not dropped on the strip of fringe past the
    // hazard: a touch short of that and it's in.
    if (best.carry < layout.greenStartYards) return { club, ok: false, why: "has to land short, by the hazard" };
  }
  const landingYards = Math.round(best.carry * 10) / 10;
  return {
    club,
    ok: true,
    landingYards,
    rollYards: Math.round((target - landingYards) * 10) / 10,
    speedMph: best.speedMph,
    onGreenYards: Math.round((landingYards - layout.greenStartYards) * 10) / 10,
  };
}

// The same, all at once.
export function landingPlan(layout, club) {
  const steps = landingPlanSteps(layout, club);
  for (;;) {
    const r = steps.next();
    if (r.done) return r.value;
  }
}

// Every chipping club's plan, a step at a time: { [club]: plan }. `first`
// is worked out before the rest (the club in hand, so its spot is up first).
export function* landingPlansSteps(layout, first = null) {
  const clubs = Object.keys(CHIP_CLUBS);
  const order = first && clubs.includes(first) ? [first, ...clubs.filter((c) => c !== first)] : clubs;
  const plans = {};
  for (const club of order) plans[club] = yield* landingPlanSteps(layout, club);
  return plans;
}

// A comfortable margin onto the green for the first bounce - about a pace:
// the fringe and the approach take a bounce less predictably than the
// green, and right on its edge a foot either way is a different bounce.
export const SAFE_ON_YARDS = 0.75;
// Beyond a chip, a pitch: running more than this share of the way on the
// ground asks too much of the green's speed.
export const MAX_ROLL_SHARE = 0.7;

// The club to chip with, from the plans: the least lofted that still lands
// safely on the green and doesn't run most of the way - get it on and
// rolling, the old rule - or, when none does, the one landing furthest on.
export function recommendClub(plans) {
  const ok = Object.values(plans ?? {}).filter((p) => p?.ok);
  if (!ok.length) return null;
  // Least lofted first: CHIP_CLUBS runs from the lob wedge down.
  const byLoft = Object.keys(CHIP_CLUBS).reverse();
  const inOrder = byLoft.map((c) => ok.find((p) => p.club === c)).filter(Boolean);
  const good = inOrder.find((p) => p.onGreenYards >= SAFE_ON_YARDS && p.rollYards <= MAX_ROLL_SHARE * (p.landingYards + p.rollYards));
  if (good) return good.club;
  return inOrder.reduce((a, b) => (b.onGreenYards > a.onGreenYards ? b : a)).club;
}
