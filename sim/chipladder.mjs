// The chipping ladder's green: one green for the whole game, with three
// pins on it and a spot to chip from for each - from the fringe, from the
// approach in front, and from the rough - at 10 to 30 yards and from
// different sides. The slopes are chosen at the start: flat, or the
// course's gentle, moderate or severe contours.
//
// The green is a short generated par 3 (course.mjs), so it's drawn and
// played exactly like a green on the course: the chips fly, bounce and roll
// by courseplay.mjs over the real fringe, rough and slopes. Pure and
// seeded: everyone who plays a game gets the same green, pins and spots.

import { YARD } from "./flight.mjs";
import { greenGradient, FOOT } from "./putting.mjs";
import { holeSpec, buildHole, seeded, makePath, surfaceAt, blobRadius, greenContours, insideBlob, GREEN_SLOPES } from "./course.mjs";

// How wild the green is. Flat has no slopes at all.
export const CHIP_GREENS = { flat: "Flat", gentle: "Gentle", moderate: "Moderate", severe: "Severe" };

// The three holes: where each is played from and how far from the pin
// (yards). Easiest first: a chip from the fringe, a longer one from the
// approach, and a long one out of the rough.
export const CHIP_HOLES = [
  { lie: "fringe", name: "From the fringe", yards: [10, 18] },
  { lie: "fairway", name: "From the approach", yards: [14, 27] },
  { lie: "rough", name: "From the rough", yards: [18, 30] },
];
// The lies that count as each (the first cut is rough, near enough).
const LIE_OK = { fringe: ["fringe"], fairway: ["fairway"], rough: ["rough", "semi"] };
// Nothing a chip should have to go over or through on its way.
const IN_THE_WAY = new Set(["water", "trees", "deep", "bunker", "greenside", "waste"]);
// A cup cut this close to the green's edge would be unfair.
const PIN_EDGE = 3.5;
// Humps added to the course's own, by how wild the green is (count, and
// height range in metres).
const EXTRA_HUMPS = { gentle: { count: 0, a: [0, 0] }, moderate: { count: 3, a: [0.06, 0.12] }, severe: { count: 6, a: [0.12, 0.2] } };
// Slope the pins are kept below, like a real hole location (2.5%) - or the
// green's own level's (course.mjs GREEN_SLOPES pin).
const PIN_SLOPE = 0.025;
// How sloping the green is on average (a share: 0.012 is 1.2%), kept
// between these for each choice, so a steeper choice is always a steeper
// green - left to chance, now and then a moderate green came out no
// steeper than a gentle one. (Real greens: about 1.5% for a gentle one,
// 2 - 3% with a tier, more with two and a false front.)
export const SLOPE_BANDS = { gentle: [0.012, 0.018], moderate: [0.021, 0.03], severe: [0.033, 0.048] };

// The green and its surrounds: a short par 3 with a large green, a couple
// of bunkers, no water. Contours are made for all three pins below.
export function chipGreenLayout(seed, complexity = "gentle") {
  const spec = holeSpec({
    number: 1,
    par: 3,
    yards: 125,
    seed,
    options: { dogleg: "none", fairway: "normal", bunkers: "some", water: "none", green: "large", contours: "gentle", trees: "normal" },
  });
  const layout = buildHole(spec);
  const rand = seeded(seed ^ 0x2c1b3c6d);
  const pins = chipPins(layout.green, rand);
  layout.pin = pins[0];
  layout.contours = chipContours(layout.green, pins, complexity in CHIP_GREENS ? complexity : "gentle", rand);
  return { layout, pins };
}

// Three pins spread round the green (a third of the way round from each
// other), none too near the edge, none too near another.
export function chipPins(g, rand) {
  const base = rand() * Math.PI * 2;
  return [0, 1, 2].map((i) => {
    const phi = base + (i * Math.PI * 2) / 3 + (rand() - 0.5) * 0.5;
    const R = blobRadius(g, phi);
    const r = Math.min(R - PIN_EDGE, (0.3 + rand() * 0.3) * R);
    return [r2(g.x + Math.cos(phi + g.rot) * r), r2(g.z + Math.sin(phi + g.rot) * r)];
  });
}

// The course's contours for this green, softened until all three pins sit
// on fairly flat spots. Flat: none.
export function chipContours(g, pins, complexity, rand) {
  if (complexity === "flat") return [];
  // (Every pin kept off the tiers' faces and on a fair spot.)
  const bumps = greenContours(rand, g, pins, complexity);
  // A bigger green than most, so more to read on the steeper ones: extra
  // humps and hollows, kept off the pins.
  const extra = EXTRA_HUMPS[complexity];
  for (let i = 0, tries = 0; i < extra.count && tries < 200; tries++) {
    const phi = rand() * Math.PI * 2;
    const r = rand() * blobRadius(g, phi) * 0.95;
    const x = g.x + Math.cos(phi + g.rot) * r;
    const z = g.z + Math.sin(phi + g.rot) * r;
    const s = 2.2 + rand() * 2;
    const a = (rand() < 0.5 ? -1 : 1) * (extra.a[0] + rand() * (extra.a[1] - extra.a[0]));
    if (pins.some((p) => Math.hypot(p[0] - x, p[1] - z) < s * 1.6)) continue;
    bumps.push({ x: r2(x), z: r2(z), a: Math.round(a * 1000) / 1000, s: r2(s) });
    i++;
  }
  easePins(bumps, pins, GREEN_SLOPES[complexity].pin);
  // Then into its band: a green too gentle for its choice gets another
  // hump (away from the pins); one too steep is eased all over.
  const [lo, hi] = SLOPE_BANDS[complexity];
  const size = complexity === "gentle" ? [0.05, 0.1] : extra.a;
  for (let tries = 0; tries < 80; tries++) {
    const m = meanSlope(g, bumps);
    if (m > hi) {
      for (const b of bumps) {
        if (b.tilt) scaleTilt(b, 0.95);
        else b.a = Math.round(b.a * 0.93 * 1000) / 1000;
      }
    } else if (m < lo) {
      const phi = rand() * Math.PI * 2;
      const r = rand() * blobRadius(g, phi) * 0.9;
      const x = g.x + Math.cos(phi + g.rot) * r;
      const z = g.z + Math.sin(phi + g.rot) * r;
      const sz = 2.2 + rand() * 2;
      const a = (rand() < 0.5 ? -1 : 1) * (size[0] + rand() * (size[1] - size[0]));
      if (pins.some((p) => Math.hypot(p[0] - x, p[1] - z) < sz * 1.8)) continue;
      bumps.push({ x: r2(x), z: r2(z), a: Math.round(a * 1000) / 1000, s: r2(sz) });
      easePins(bumps, pins, GREEN_SLOPES[complexity].pin);
    } else break;
  }
  return bumps;
}

// Only the humps doing the tilting at a pin are eased, so the rest of the
// green keeps the slopes asked for - and if the humps aren't what tilts it,
// the green's own tilt.
function easePins(bumps, pins, most = PIN_SLOPE) {
  for (let i = 0; i < 60; i++) {
    const steep = pins.filter((p) => pinSlope({ contours: bumps }, p) > most);
    if (!steep.length) break;
    for (const p of steep) {
      const pull = bumps.map((b) => (b.tilt ? 0 : pinSlope({ contours: [b] }, p)));
      const top = Math.max(...pull);
      if (top < 0.004) for (const b of bumps) b.tilt && scaleTilt(b, 0.92);
      bumps.forEach((b, k) => {
        if (!b.tilt && pull[k] >= top * 0.3) b.a = Math.round(b.a * 0.88 * 1000) / 1000;
      });
    }
  }
}

// The green's tilt (course.mjs greenContours' first contour) made `k` as
// steep: its plane, its tiers and how far it's lifted.
function scaleTilt(b, k) {
  b.tilt = b.tilt.map((v) => Math.round(v * k * 1e5) / 1e5);
  b.lift = Math.round(b.lift * k * 1000) / 1000;
  if (b.tiers) b.tiers = b.tiers.map(([nx, nz, at, rise, width]) => [nx, nz, at, Math.round(rise * k * 1000) / 1000, width]);
}

// The green's average slope (a share), over a grid across it.
export function meanSlope(g, contours) {
  let sum = 0;
  let n = 0;
  const R = Math.max(g.rx, g.rz) + 2;
  for (let x = g.x - R; x <= g.x + R; x += 1.5) {
    for (let z = g.z - R; z <= g.z + R; z += 1.5) {
      if (!insideBlob(g, x, z)) continue;
      sum += pinSlope({ contours }, [x, z]);
      n++;
    }
  }
  return n ? sum / n : 0;
}

export function pinSlope(green, [x, z]) {
  const [gx, gz] = greenGradient(green, x, z);
  return Math.hypot(gx, gz);
}

// Every part of the line from the ball to the pin is fair: nothing in the
// way. `allowSand` for when there's no other way.
function clearLine(layout, path, from, to, allowSand) {
  const n = 24;
  for (let i = 1; i < n; i++) {
    const k = i / n;
    const l = surfaceAt(layout, from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k, path);
    if (IN_THE_WAY.has(l) && !(allowSand && (l === "bunker" || l === "greenside"))) return false;
  }
  return true;
}

// Angle between two directions, 0..pi.
const apart = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

// A spot to chip from for one hole: the right lie, the right distance from
// its pin, a clear line in, and coming from a different side from the
// holes before it (`taken`: their directions out from the pin). Tries hard
// first, then eases off, so there's always somewhere.
export function chipStart(layout, pin, kind, rand, taken = [], path = makePath(layout.path)) {
  const [lo, hi] = kind.yards;
  const ok = LIE_OK[kind.lie];
  const passes = [
    { spread: 1.0, sand: false },
    { spread: 0.6, sand: false },
    { spread: 0, sand: false },
    { spread: 0, sand: true },
  ];
  for (const pass of passes) {
    for (let t = 0; t < 300; t++) {
      const a = rand() * Math.PI * 2;
      if (taken.some((b) => apart(a, b) < pass.spread)) continue;
      const [dx, dz] = [Math.cos(a), Math.sin(a)];
      let d;
      if (kind.lie === "fringe") {
        // The middle of the fringe, straight out from the pin.
        let e = 0;
        while (e < 60 && surfaceAt(layout, pin[0] + dx * e, pin[1] + dz * e, path) === "green") e += 0.1;
        d = e + 0.8;
      } else {
        d = (lo + rand() * (hi - lo)) * YARD;
      }
      if (d < lo * YARD || d > hi * YARD) continue;
      const at = [pin[0] + dx * d, pin[1] + dz * d];
      if (!ok.includes(surfaceAt(layout, at[0], at[1], path))) continue;
      if (!clearLine(layout, path, at, pin, pass.sand)) continue;
      return { at: [r2(at[0]), r2(at[1])], from: a };
    }
  }
  // Never needed in practice: straight in front of the pin, down the line
  // the hole is played.
  const g = layout.green;
  const a = g.rot + Math.PI;
  const d = ((lo + hi) / 2) * YARD;
  return { at: [r2(pin[0] + Math.cos(a) * d), r2(pin[1] + Math.sin(a) * d)], from: a };
}

// The whole game: the green, and for each of the three holes its pin, the
// spot to chip from, the lie there and the distance.
export function chipGame(seed, complexity = "gentle") {
  const { layout, pins } = chipGreenLayout(seed, complexity);
  const path = makePath(layout.path);
  // Which pin each kind of chip goes to: the way round that gives every
  // hole a proper spot (a pin near the front suits the fringe, one at the
  // back the rough).
  let best = null;
  for (const order of ORDERS) {
    const taken = [];
    const holes = CHIP_HOLES.map((kind, i) => {
      const pin = pins[order[i]];
      const start = chipStart(layout, pin, kind, seeded(seed + 101 * (i + 1) + order[i]), taken, path);
      taken.push(start.from);
      const lie = surfaceAt(layout, start.at[0], start.at[1], path);
      const yards = Math.round(Math.hypot(pin[0] - start.at[0], pin[1] - start.at[1]) / YARD);
      return { number: i + 1, kind: kind.lie, name: kind.name, pin, start: start.at, lie, yards, fits: LIE_OK[kind.lie].includes(lie) };
    });
    // Every lie right first, then the three coming from as different sides
    // as they can (up to a sixth of the way round is plenty).
    let spread = Math.PI / 3;
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) spread = Math.min(spread, apart(taken[i], taken[j]));
    const score = holes.filter((h) => h.fits).length * 10 + spread;
    if (!best || score > best.score) best = { holes, score };
    if (score >= 30 + Math.PI / 3 - 1e-9) break;
  }
  return { layout, holes: best.holes.map(({ fits, ...h }) => h) };
}
const ORDERS = [[0, 1, 2], [1, 2, 0], [2, 0, 1], [0, 2, 1], [1, 0, 2], [2, 1, 0]];

// The layout for one hole: the game's green with that hole's pin.
export const holeLayout = (game, i) => ({ ...game.layout, pin: game.holes[i].pin });

// ---- Clubs and test chips -------------------------------------------------------

// A club to suggest: run it along the ground from the fringe, a gap wedge
// from the approach, and loft it out of the rough.
export function chipClub(kind, yards) {
  if (kind === "fringe") return yards > 14 ? "9I" : "PW";
  if (kind === "fairway") return yards > 20 ? "PW" : "GW";
  return yards > 24 ? "GW" : "SW";
}

// How far a chip with each club carries, as a share of the whole distance
// (the old carry-to-roll rule of thumb: sand wedge 1:1, pitching wedge 1:2,
// and so on). Rough takes some pace off the roll, so it needs a bit more.
const CARRY_SHARE = { LW: 0.6, SW: 0.5, GW: 0.42, AW: 0.38, PW: 0.34, "9I": 0.26, "8I": 0.21, "7I": 0.17 };
export function plannedChipCarry(club, yards, lie) {
  const share = (CARRY_SHARE[club] ?? 0.5) + (lie === "rough" || lie === "semi" ? 0.1 : 0);
  return yards * Math.min(0.9, share);
}

// Feet from the hole of where a chip finished (0 if it went in; lost in
// water or out of bounds, Infinity).
export function chipFeet(pin, res) {
  if (res.penalty) return Infinity;
  if (res.holed) return 0;
  return Math.hypot(res.rest[0] - pin[0], res.rest[1] - pin[1]) / FOOT;
}

function r2(v) {
  return Math.round(v * 100) / 100;
}

