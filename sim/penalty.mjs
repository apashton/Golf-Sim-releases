// Penalty areas (the owner: "penalty stakes and lines"), as the Rules have
// them: water crossing the line of play is a yellow penalty area, water
// beside it a red one (a pond's own `penalty` says otherwise; a mapped
// course's lateral water hazard is red). Out of either the ball's dropped
// for a stroke:
//   yellow  back on the line - the hole, the spot it last crossed into the
//           area, and back from there as far as it takes to be clear
//   red     the same, or within two club-lengths of where it crossed, no
//           nearer the hole - whichever lie's better (fairway before first
//           cut before rough...), and then the nearer the hole
// look/hazards.js draws each area's stakes and painted line in its colour.

import { insideBlob, blobOutline, reachesGreen } from "./course.mjs";
import { greenZone } from "./greenfirst.mjs";

export const PENALTY = {
  // Two club-lengths (a driver's: about 0.9 m each).
  lateral: 1.8,
  // Back on the line: tried this far apart, up to this far.
  step: 1,
  most: 80,
  // How far a pond reaches over the line of play to be across it.
  across: 3,
  // How much further back than the first dry spot it looks for grass.
  further: 40,
};
// The grass a drop would rather be on.
const PLAYS = new Set(["fairway", "tee", "fringe", "semi", "rough", "path"]);

// The lies a drop's spot is judged by, best first.
const LIE_RANK = ["fairway", "tee", "fringe", "semi", "green", "rough", "waste", "path", "deep", "bunker", "greenside", "trees"];

// A penalty area's colour: "yellow" across the line of play, "red" beside it.
export function penaltyOf(w, L) {
  if (w.penalty === "red" || w.penalty === "yellow") return w.penalty;
  const pts = L.path ?? [];
  // Along the line of play, every few metres: does it pass over the water?
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1];
    const [bx, bz] = pts[i];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 3));
    for (let k = 0; k <= n; k++) if (insideBlob(w, ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n, PENALTY.across)) return "yellow";
  }
  return "red";
}

// The water a spot is in (a hole's layout's), or null.
export function waterAt(L, x, z) {
  return (L.water ?? []).find((w) => insideBlob(w, x, z)) ?? null;
}

// The drop for a ball that went into water at `crossed` (where it last
// was on dry land, [x, z]): { drop: [x, z], area: "red" | "yellow", how:
// "back on the line" | "lateral" }. lieAt: the hole's; cup: [x, z];
// area: the water's colour.
export function penaltyDrop({ lieAt, cup, crossed, area }) {
  const dry = (x, z) => lieAt(x, z) !== "water";
  const toCup = (x, z) => Math.hypot(x - cup[0], z - cup[1]);
  const dc = toCup(...crossed);
  // Back on the line: from the hole through the crossing, on back.
  const ux = (crossed[0] - cup[0]) / (dc || 1);
  const uz = (crossed[1] - cup[1]) / (dc || 1);
  // The first dry spot - or, a few metres further, the first on grass you'd
  // play from (not the trees, the long grass or sand just behind the
  // water: the owner, "it just put me in another awful place, which you
  // just never do").
  let back = null;
  let good = null;
  for (let d = PENALTY.step; d <= PENALTY.most; d += PENALTY.step) {
    const x = crossed[0] + ux * d;
    const z = crossed[1] + uz * d;
    if (!dry(x, z)) continue;
    back ??= [x, z];
    if (PLAYS.has(lieAt(x, z))) {
      good = [x, z];
      break;
    }
    if (d - Math.hypot(back[0] - crossed[0], back[1] - crossed[1]) > PENALTY.further) break;
  }
  back = good ?? back ?? [...crossed];
  if (area !== "red") return { drop: round(back), area: "yellow", how: "back on the line" };
  // Lateral: round the crossing, within two club-lengths, no nearer the hole.
  const rank = (x, z) => {
    const r = LIE_RANK.indexOf(lieAt(x, z));
    return r < 0 ? LIE_RANK.length : r;
  };
  let best = null;
  for (let ring = 1; ring <= 3; ring++) {
    const r = (PENALTY.lateral * ring) / 3;
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const x = crossed[0] + Math.cos(a) * r;
      const z = crossed[1] + Math.sin(a) * r;
      if (!dry(x, z) || toCup(x, z) < dc - 1e-9) continue;
      const score = [rank(x, z), toCup(x, z)];
      if (!best || score[0] < best.score[0] || (score[0] === best.score[0] && score[1] < best.score[1])) best = { at: [x, z], score };
    }
  }
  const backScore = [rank(...back), toCup(...back)];
  if (best && (best.score[0] < backScore[0] || (best.score[0] === backScore[0] && best.score[1] <= backScore[1]))) return { drop: round(best.at), area: "red", how: "lateral" };
  return { drop: round(back), area: "red", how: "back on the line" };
}

const round = ([x, z]) => [Math.round(x * 100) / 100, Math.round(z * 100) / 100];

// What a penalty's drop says (course.js).
export function penaltyWords({ area, how }) {
  const colour = area === "yellow" ? "yellow" : "red";
  return `In the ${colour} penalty area - one stroke, dropped ${how === "lateral" ? "within two club-lengths" : "back on the line"}`;
}

// Where each penalty area's stakes stand and its line is painted (hole
// frame): [{ colour, stakes: [[x, z], ...], line: [[x, z], ...] }] - the
// line just outside the water's edge, the stakes a little further out,
// STAKES.every metres apart round it - for water reaching onto a green,
// none on the green or its fringe, which it gives way to (sim/
// greenfirst.mjs; `dry`: look/hazards.js leaves the line off them too).
export const STAKES = { every: 9, out: 0.6, line: 0.15 };
export function penaltyMarks(L) {
  const zone = greenZone(L);
  return (L.water ?? []).map((w) => {
    const dry = reachesGreen(L, w);
    const line = blobOutline(w, 160, STAKES.line);
    const ring = blobOutline(w, 320, STAKES.out);
    const stakes = [];
    let since = STAKES.every;
    for (let i = 0; i < ring.length; i++) {
      const [x0, z0] = ring[i];
      const [x1, z1] = ring[(i + 1) % ring.length];
      since += Math.hypot(x1 - x0, z1 - z0);
      if (since >= STAKES.every && !(dry && zone.within(x0, z0))) {
        stakes.push([Math.round(x0 * 100) / 100, Math.round(z0 * 100) / 100]);
        since = 0;
      }
    }
    return { colour: penaltyOf(w, L), stakes, line, dry };
  });
}
