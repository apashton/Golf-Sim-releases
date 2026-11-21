// The approach challenge: nine approaches, one shot each, from the lies a
// round gives you - the fairway, the first cut, the rough, a fairway
// bunker, and the four slopes (ball above or below your feet, uphill,
// downhill) - each to a green of its own, and scored on how close it
// finishes against how far it was: the practice plans' approach combine
// (sim/practiceplan.mjs), so a score here reads like one there. The
// distances come from a band picked on the card (the approach ladder's,
// sim/ladder.mjs), spread across it. Everyone gets the same nine. Pure:
// approachchallenge.js plays it.

import { YARD } from "./flight.mjs";
import { FOOT } from "./putting.mjs";
import { FLAT, describeLie } from "./lie.mjs";
import { seeded, makePath, pointAt, nearest, surfaceAt, insideBlob, blobShape } from "./course.mjs";
import { APPROACH_BANDS, approachLayout, approachSpot } from "./ladder.mjs";

export const APPROACH_HOLES = 9;
// A shot's points: 100 holed, else 100 less in proportion to how far away
// it finished, nothing once that's this share of the distance (22 yds from
// 150) - the approach combine's. In the water or lost: nothing.
export const MISS_SHARE = 0.15;
export const HOLED_POINTS = 100;
export const MAX_SCORE = APPROACH_HOLES * HOLED_POINTS;

// The lies, the first always a clean one off the fairway; the rest shuffled
// for the game.
const SLOPE = 4;
export const APPROACH_LIES = [
  { lie: "fairway", stance: FLAT },
  { lie: "semi", stance: FLAT },
  { lie: "rough", stance: FLAT },
  { lie: "bunker", stance: FLAT },
  { lie: "fairway", stance: { side: SLOPE, slope: 0 } },
  { lie: "fairway", stance: { side: -SLOPE, slope: 0 } },
  { lie: "fairway", stance: { side: 0, slope: SLOPE } },
  { lie: "fairway", stance: { side: 0, slope: -SLOPE } },
  { lie: "rough", stance: { side: 0, slope: SLOPE } },
];

// "Rough - uphill (4°)".
export const lieText = ({ lie, stance }) => describeLie(lie, stance);

// A shot's points (see above): yards to the pin it was played from, feet
// from the hole where it finished.
export function approachPoints({ yards, feet, holed = false, lost = false }) {
  if (holed) return HOLED_POINTS;
  if (lost || !Number.isFinite(feet) || !(yards > 0)) return 0;
  const missYards = (feet * FOOT) / YARD;
  return Math.round(HOLED_POINTS * Math.max(0, 1 - missYards / (MISS_SHARE * yards)));
}

// How far away scores what: for the rings round the pin, feet - the
// distance that still scores 75, 50 and 25 from this far.
export function pointRings(yards, levels = [75, 50, 25]) {
  return levels.map((p) => ({ points: p, feet: ((1 - p / HOLED_POINTS) * MISS_SHARE * yards * YARD) / FOOT }));
}

// The game: nine holes, each { yards, lie, stance }, the same for everyone
// who plays this seed and band. The distances are spread evenly across the
// band (a little either way), in a shuffled order.
export function approachPlan(band, seed) {
  const b = APPROACH_BANDS[band] ?? APPROACH_BANDS.mixed;
  const lo = b.holes[0][0];
  const hi = b.holes[b.holes.length - 1][1];
  const rand = seeded(seed ^ 0x0a77c4);
  const step = (hi - lo) / APPROACH_HOLES;
  const yards = Array.from({ length: APPROACH_HOLES }, (_, i) => Math.round(lo + step * (i + 0.15 + rand() * 0.7)));
  shuffle(yards, rand);
  const lies = [APPROACH_LIES[0], ...shuffle(APPROACH_LIES.slice(1), rand)];
  return { band: b === APPROACH_BANDS[band] ? band : "mixed", holes: yards.map((y, i) => ({ yards: y, ...lies[i] })) };
}

function shuffle(list, rand) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

// One hole of the game: the layout (the approach ladder's straight par 4)
// and where the ball sits, on its lie - out to the side in the first cut or
// the rough (the side away from any water), or in a fairway bunker laid
// round the ball. Returns { layout, spot: [x, z] }.
export function approachHole(info, seed, number) {
  // The ladder's holes by number: its first has no water, its second may
  // have some down one side, its third in front. Off the fairway the ball
  // is out to one side: no water there.
  const like = number === 1 || info.lie !== "fairway" ? 1 : 2 + (number % 2);
  const layout = approachLayout(info.yards, seed, like);
  const centre = approachSpot(layout, info.yards);
  if (info.lie === "fairway") return { layout, spot: centre };
  const path = makePath(layout.path);
  const n = nearest(path, centre[0], centre[1]);
  const at = pointAt(path, n.s);
  // Square to the line: right of it is +d (course.mjs nearest).
  const across = [-at.dir[1], at.dir[0]];
  const offTo = (sign, off) => [centre[0] + across[0] * sign * off, centre[1] + across[1] * sign * off];
  const nearWater = (p) => layout.water.some((w) => insideBlob(w, p[0], p[1], 25));
  const rand = seeded(seed ^ 0xb0b);
  const first = rand() < 0.5 ? 1 : -1;
  if (info.lie === "bunker") {
    // A fairway bunker at the fairway's edge, the ball in the middle of it.
    for (const sign of [first, -first]) {
      for (let off = 6; off <= 30; off += 1) {
        const p = offTo(sign, off);
        if (surfaceAt(layout, p[0], p[1], path) === "fairway") continue;
        const spot = offTo(sign, off - 3);
        if (nearWater(spot)) break;
        layout.bunkers.push(blobShape(rand, spot[0], spot[1], Math.atan2(at.dir[1], at.dir[0]), 9, 4.5));
        if (surfaceAt(layout, spot[0], spot[1], path) === "bunker") return { layout, spot };
        layout.bunkers.pop();
        break;
      }
    }
    return { layout, spot: centre };
  }
  // The first cut or the rough: the middle of its band, out to one side.
  for (const sign of [first, -first]) {
    let inner = null;
    let outer = null;
    for (let off = 1; off <= 60; off += 0.5) {
      const p = offTo(sign, off);
      const on = surfaceAt(layout, p[0], p[1], path);
      if (on === info.lie) {
        inner ??= off;
        outer = off;
      } else if (inner != null) break;
    }
    if (inner == null) continue;
    const spot = offTo(sign, (inner + outer) / 2);
    if (!nearWater(spot)) return { layout, spot };
  }
  return { layout, spot: centre };
}
