// A course reviewed the way the ranking panels judge one
// (docs/COURSE-DESIGN-PLAN.md; the owner: "can we improve the course
// designer with our improved knowledge?"): a score out of ten for each of
// what they look at, and under it notes on the holes, each saying what to
// change.
//
//   Shot options      a better side of the fairway to drive to, a hazard
//                     on the bold line, a green to play away from - and
//                     no hazard nobody ever finds
//   Variety           par 3s for different clubs, short and long par 4s,
//                     a par 5 to go for, holes turned every way round the
//                     compass, no two alike one after the other
//   Card and pacing   the par and its nines, the 1st and 18th, no run of
//                     par 3s or 5s, the stroke indexes
//   Challenge         what the course's golfers score (sim/golfers.mjs):
//                     its rating and slope, the hardest holes where they
//                     belong, the stroke indexes as the holes play
//   Routing and land  holes kept apart, short walks, and on hills the
//                     climbs and the flags seen (routing.mjs CLIMB,
//                     sim/sight.mjs) - for a course whose holes can be
//                     moved
//   Fair to everyone  the forward tees' length and carries over water, the
//                     greens' size for the shot in, the bogey golfer's
//                     share of wet balls
//
// Most of it is quick (reviewCourse, as the course stands); Shot options,
// Challenge and a little of Fair need each hole played in the head
// (holePlay - a second or two a hole, so the designer runs it in the
// background, reviewworker.js) and wait for it. Weighted as the rankings
// weigh them (PARTS): shot options and variety half the score between them.
// Pure.

import { YARD } from "./flight.mjs";
import { makePath, pointAt, nearest, surfaceAt, blobOutline } from "./course.mjs";
import { withEdits } from "./holeedits.mjs";
import { GOLFER_ORDER } from "./golfers.mjs";
import { lieGrid, evaluateHole, playRounds, sideBonus } from "./holeeval.mjs";
import { TEMPLATES } from "./architect.mjs";
import { teeSpots, teeYards } from "./tees.mjs";
import { coursePlaces, holeEnd, placeBearing } from "./imaginary.mjs";
import { canMoveHoles, crossings } from "./coursewide.mjs";
import { courseOwners } from "./owners.mjs";
import { CLIMB } from "./routing.mjs";
import { holeSight } from "./sight.mjs";
import { aimPosts } from "./aimpost.mjs";
import { unpackGrid, gridHeight, polygonArea, polygonCentroid } from "./terrain.mjs";

// What's judged, and how much of the score each is (as the rankings weigh
// them): name, weight, and a line saying what it asks.
export const PARTS = {
  choices: { name: "Shot options", weight: 25, says: "Does every hole ask a question - a better side to drive to, a hazard on the bold line, a green to play away from?" },
  variety: { name: "Variety", weight: 25, says: "Par 3s for different clubs, short and long par 4s, a par 5 to go for, holes played every way round the compass." },
  pace: { name: "Card and pacing", weight: 12.5, says: "The par and its nines, a gentle start and a strong finish, no runs of par 3s or 5s, the stroke indexes." },
  challenge: { name: "Challenge", weight: 12.5, says: "What the course's golfers score: its rating and slope, and the hardest holes where they belong." },
  routing: { name: "Routing and land", weight: 12.5, says: "Holes kept apart, short walks between them, and on hills easy climbs and flags in sight." },
  fair: { name: "Fair to everyone", weight: 12.5, says: "Forward tees of the right length with no long carries, greens big enough for the shot in." },
};
export const PART_ORDER = ["choices", "variety", "pace", "challenge", "routing", "fair"];
// The parts that need the holes played (holePlay).
export const PLAYED = new Set(["choices", "challenge"]);

// The rules of thumb (yards unless it says): where they come from is in
// docs/COURSE-DESIGN-PLAN.md.
export const REVIEW = {
  // Each par's usual lengths (the USGA's guide for men).
  pars: { 3: [0, 260], 4: [240, 490], 5: [450, 710] },
  // An 18-hole course's par, and each nine's.
  par: [69, 73],
  nine: [34, 37],
  // The par 3s from shortest to longest (Shoreacres' 130 to 215); two that
  // play alike: this close in length and way.
  par3Spread: 80,
  alike: { yards: 15, degrees: 30 },
  // A short par 4, a long one, and a par 5 to go for in two.
  shortFour: 350,
  longFour: 440,
  reachFive: 540,
  // Two holes in a row alike: this close in length and way.
  twin: { yards: 25, degrees: 45 },
  // Dog-legs one way more than the other by more than this.
  bends: 2,
  // The ways round the compass (of 8) an 18-hole course plays at least, a
  // 9-hole one; and the most holes in a row the same way.
  ways: { 18: 6, 9: 4 },
  run: 4,
  // The longest walk from a green to the next tee (metres).
  walk: 300,
  // The forward (red) tees: the longest carry over water from them (more
  // than `carryFix` a must).
  carry: 100,
  carryFix: 130,
  // A green smaller than this (square metres) for a long shot in.
  green: 250,
  // A hazard away from the green found in fewer rounds than this by every
  // golfer is in no one's way; a better side worth this many strokes to
  // the 10 handicap (real courses' are 0.03 - 0.08) is a choice off the
  // tee; the bogey golfer wet more often than this.
  found: 0.01,
  choice: 0.025,
  wet: 0.35,
  // A hole the scratch golfer averages this much over par on.
  overPar: 0.6,
  // The course's rating against its par (18 holes), and its slope.
  rating: [-3, 4],
  slope: [100, 150],
  // The stroke indexes against how hard the holes play (a rank
  // correlation).
  order: 0.5,
};

const r1 = (v) => Math.round(v * 10) / 10;
const r2 = (v) => Math.round(v * 100) / 100;
const round5 = (v) => Math.round(v / 5) * 5;
const parOf = (h) => h?.spec?.par ?? h?.layout?.par ?? 4;
const yardsOf = (h) => h?.spec?.yards ?? h?.layout?.yards ?? 0;
const sum = (list) => list.reduce((a, b) => a + b, 0);
const COMPASS = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
const sector = (deg) => Math.round((((deg % 360) + 360) % 360) / 45) % 8;
const turnBetween = (a, b) => {
  const d = Math.abs((((a - b) % 360) + 360) % 360);
  return Math.min(d, 360 - d);
};

// "Hole 3", "Holes 3 and 7", "Holes 3, 7 and 12" (indexes in).
export function holesWords(list) {
  const n = list.map((i) => i + 1);
  return n.length === 1 ? `Hole ${n[0]}` : `Holes ${n.slice(0, -1).join(", ")} and ${n.at(-1)}`;
}

// A hole's dog-leg: -1 left, 1 right, 0 straight - which way the green
// lies off the line the tee shot starts down.
export function bendOf(layout) {
  const path = layout?.path;
  if (!(path?.length > 1)) return 0;
  const p = makePath(path);
  const a = pointAt(p, Math.min(40, p.length * 0.2));
  const end = path.at(-1);
  // Right of travel is +z when heading +x (course.mjs nearest).
  const side = a.dir[0] * (end[1] - a.p[1]) - a.dir[1] * (end[0] - a.p[0]);
  return Math.abs(side) < 0.12 * p.length ? 0 : side > 0 ? 1 : -1;
}

// A hole's green's area (square metres).
export function greenArea(layout) {
  const g = layout?.green;
  if (!g) return 0;
  return Math.abs(polygonArea(g.poly ?? blobOutline(g, 48)));
}

const middleOf = (shape) => (shape.poly ? polygonCentroid(shape.poly) : [shape.x, shape.z]);
const greenMiddle = (L) => (L.green?.poly ? polygonCentroid(L.green.poly) : [L.green.x, L.green.z]);
// How far from the green's middle a hazard is round the green (metres).
const greenReach = (L) => Math.sqrt(greenArea(L) / Math.PI) + 14;
const byGreen = (L, shape) => {
  const [x, z] = middleOf(shape);
  const g = greenMiddle(L);
  return Math.hypot(x - g[0], z - g[1]) < greenReach(L);
};

// Where a hazard is, in words: "on the right, 240 yards out", "short of
// the green", "left of the green".
export function whereIs(layout, shape, path = makePath(layout.path)) {
  const [x, z] = middleOf(shape);
  const at = nearest(path, x, z);
  const g = greenMiddle(layout);
  const reach = greenReach(layout);
  if (byGreen(layout, shape)) {
    const gs = nearest(path, g[0], g[1]).s;
    if (Math.abs(at.d) < reach * 0.45) return at.s < gs ? "short of the green" : "over the green";
    return `${at.d < 0 ? "left" : "right"} of the green`;
  }
  const yards = round5(at.s / YARD);
  if (at.s < 1 && x < 0) return "behind the tee";
  if (yards < 30) return `${at.d < 0 ? "left" : "right"} of the tee`;
  return Math.abs(at.d) < 8 ? `in the middle, ${yards} yards out` : `on the ${at.d < 0 ? "left" : "right"}, ${yards} yards out`;
}

// ---- The quick part: the course as it stands -----------------------------------------

// The longest carry over water a golfer playing the forward (red) tee has
// to make (yards), or 0: water right across the line, with no way round
// near it - from the tee if it starts too near to lay up short of it, else
// from just short of it (its width along the line).
export function forwardCarry(layout) {
  const L = withEdits(layout);
  if (!L?.water?.length || !(L.path?.length > 1)) return 0;
  const path = makePath(L.path);
  const spots = teeSpots(L, { path });
  const red = spots.find((t) => t.colour === "red") ?? { ahead: 0 };
  const from = Math.max(0, red.ahead);
  const wetAcross = (s) => {
    const { p, dir } = pointAt(path, s);
    return [-20, -10, 0, 10, 20].every((d) => surfaceAt(L, p[0] - dir[1] * d, p[1] + dir[0] * d, path) === "water");
  };
  let most = 0;
  let start = -1;
  let across = false;
  const done = (end) => {
    if (start >= 0 && across) most = Math.max(most, start - from < LAY_UP ? end - from : end - start);
    start = -1;
    across = false;
  };
  for (let s = from; s < path.length; s += 2) {
    if (surfaceAt(L, ...pointAt(path, s).p, path) === "water") {
      if (start < 0) start = s;
      across ||= wetAcross(s);
    } else done(s);
  }
  done(path.length);
  return Math.round(most / YARD);
}
// Water starting nearer the tee than this (metres) can't be laid up short of.
const LAY_UP = 50;

// Heights on a hole on its ground (layout.terrain): its tee's, and its
// green's (the pin's) - in the same metres from hole to hole.
function heightsOf(layout) {
  if (!layout?.terrain || !layout.pin) return null;
  const grid = unpackGrid(layout.terrain);
  return { tee: gridHeight(grid, 0, 0), green: gridHeight(grid, layout.pin[0], layout.pin[1]) };
}

// A note: { part, level - "fix", "look", "good" or "info" - holes (by
// index), text, each: the same said of each of its holes, scored as one
// on each (partScore) }.
const note = (part, level, holes, text, each = false) => ({ part, level, holes, text, ...(each ? { each } : {}) });

// The card's notes: its par, its order, its stroke indexes.
function cardNotes(course) {
  const holes = course.holes;
  const n = holes.length;
  const pars = holes.map(parOf);
  const out = [];
  const allThrees = pars.every((p) => p === 3);
  if (allThrees) out.push(note("pace", "good", [], "A par 3 course: every hole a tee shot to a green."));
  // Each hole's par for its length.
  holes.forEach((h, i) => {
    const [lo, hi] = REVIEW.pars[parOf(h)] ?? [0, Infinity];
    const y = yardsOf(h);
    if (y > hi) out.push(note("pace", "look", [i], `${holesWords([i])}: a par ${parOf(h)} of ${y} yards plays as a par ${parOf(h) + 1} for most golfers (par ${parOf(h)}s run up to ${hi}): make it shorter, or its par ${parOf(h) + 1}.`));
    else if (y < lo) out.push(note("pace", "look", [i], `${holesWords([i])}: a par ${parOf(h)} of ${y} yards is short for its par (par ${parOf(h)}s from about ${lo}): make it longer, or its par ${parOf(h) - 1}.`));
  });
  if (!allThrees && n >= 18) {
    const par = sum(pars);
    const out9 = sum(pars.slice(0, 9));
    const in9 = sum(pars.slice(9, 18));
    if (par < REVIEW.par[0] || par > REVIEW.par[1]) out.push(note("pace", "look", [], `Par ${par}: most of the great courses are par 70 to 72.`));
    else out.push(note("pace", "good", [], `Par ${par}, ${out9} out and ${in9} in.`));
    for (const [k, v] of [["front", out9], ["back", in9]]) {
      if (v < REVIEW.nine[0] || v > REVIEW.nine[1]) out.push(note("pace", "look", [], `The ${k} nine is par ${v}: a nine is usually par 34 to 37.`));
    }
    if (pars.slice(0, 9).join() === pars.slice(9, 18).join()) out.push(note("pace", "look", [], "Both nines have their pars in the same order: the back nine plays the front again. Swap a couple of holes round."));
  }
  if (!allThrees && n >= 6) {
    if (pars[0] === 3) out.push(note("pace", "look", [0], "A par 3 first: a par 4 or 5 of middling length is the gentle handshake most great courses start with."));
    if (pars[n - 1] === 3) out.push(note("pace", "look", [n - 1], `A par 3 to finish: the last hole's the round's last word - a long par 4, or a par 5 to go for.`));
    for (let i = 2; i < n; i++) {
      if (pars[i] !== 4 && pars[i] === pars[i - 1] && pars[i] === pars[i - 2]) out.push(note("pace", "fix", [i - 2, i - 1, i], `${holesWords([i - 2, i - 1, i])}: three par ${pars[i]}s in a row. Move one of them.`));
    }
    for (let i = 1; i < n; i++) {
      if (pars[i] === 3 && pars[i - 1] === 3 && pars[i + 1] !== 3 && pars[i - 2] !== 3) out.push(note("pace", "look", [i - 1, i], `${holesWords([i - 1, i])}: two par 3s together - fine now and then (Cypress Point's 15th and 16th), better apart.`));
    }
  }
  // The stroke indexes: each number once, 1 to the number of holes.
  const sis = holes.map((h) => h.spec?.si);
  const set = sis.filter(Number.isFinite);
  if (!set.length) out.push(note("pace", "look", [], "No stroke indexes: handicap strokes go to the longest holes for their par. Give each hole one (1 the hardest), or set them from how the holes play below."));
  else {
    const missing = [];
    for (let k = 1; k <= n; k++) if (!set.includes(k)) missing.push(k);
    const twice = [...new Set(set.filter((v, i) => set.indexOf(v) !== i))];
    if (missing.length || twice.length || set.length < n) {
      const bits = [];
      if (twice.length) bits.push(`${twice.join(", ")} given twice`);
      if (missing.length) bits.push(`${missing.join(", ")} missing`);
      out.push(note("pace", "fix", [], `The stroke indexes need each of 1 to ${n} once${bits.length ? ` (${bits.join("; ")})` : ""}.`));
    }
  }
  return out;
}

// The variety notes: the par 3s, 4s and 5s, the templates, the dog-legs,
// and (where its holes can be moved) the ways the holes play.
function varietyNotes(course, bearings) {
  const holes = course.holes;
  const n = holes.length;
  const out = [];
  if (n < 6) return out;
  const pars = holes.map(parOf);
  const yards = holes.map(yardsOf);
  const of = (par) => holes.map((h, i) => i).filter((i) => pars[i] === par);
  const threes = of(3);
  const fours = of(4);
  const fives = of(5);
  if (threes.length >= 2 && threes.length < n) {
    const ys = threes.map((i) => yards[i]);
    const lo = Math.min(...ys);
    const hi = Math.max(...ys);
    const want = threes.length >= 3 ? REVIEW.par3Spread : REVIEW.par3Spread / 2;
    const span = hi === lo ? `The par 3s are all ${lo} yards` : threes.length === 2 ? `The two par 3s are ${lo} and ${hi} yards` : `The par 3s run only ${lo} to ${hi} yards`;
    if (hi - lo < want) out.push(note("variety", "look", threes, `${span}: make one shorter or longer, so each takes a different club - the great sets span ${REVIEW.par3Spread} yards or more (Shoreacres': 130 to 215).`));
    else out.push(note("variety", "good", threes, `The par 3s run ${lo} to ${hi} yards: a different club for each.`));
    if (bearings) {
      for (let a = 0; a < threes.length; a++) {
        for (let b = a + 1; b < threes.length; b++) {
          const [i, j] = [threes[a], threes[b]];
          if (Math.abs(yards[i] - yards[j]) <= REVIEW.alike.yards && turnBetween(bearings[i], bearings[j]) <= REVIEW.alike.degrees) {
            out.push(note("variety", "look", [i, j], `${holesWords([i, j])}: par 3s of about ${round5((yards[i] + yards[j]) / 2)} yards played the same way, so in any wind they play alike. Change one's length by 30 yards or more, or turn it.`));
          }
        }
      }
    }
  }
  if (fours.length >= 3) {
    const short = fours.filter((i) => yards[i] <= REVIEW.shortFour);
    const long = fours.filter((i) => yards[i] >= REVIEW.longFour);
    if (!short.length) out.push(note("variety", "look", [], `No short par 4 (${REVIEW.shortFour} yards or less): one gives the long hitter a dare and everyone else a pitch in - a Drivable par 4 is 240 to 280.`));
    if (long.length < (fours.length >= 6 ? 2 : 1)) out.push(note("variety", "look", [], `${long.length ? "Only one long par 4" : "No long par 4"} (${REVIEW.longFour} yards or more): ${fours.length >= 6 ? "a couple" : "one"} asks for the long iron in.`));
    if (short.length && long.length >= (fours.length >= 6 ? 2 : 1)) out.push(note("variety", "good", [], `Par 4s from ${Math.min(...fours.map((i) => yards[i]))} to ${Math.max(...fours.map((i) => yards[i]))} yards: drives and irons of every length.`));
  }
  if (fives.length) {
    const reach = fives.filter((i) => yards[i] <= REVIEW.reachFive);
    if (!reach.length) out.push(note("variety", "look", fives, `No par 5 to go for in two (the shortest is ${Math.min(...fives.map((i) => yards[i]))} yards): one of 480 to ${REVIEW.reachFive} makes the second shot a choice - go for it past the trouble, or lay up.`));
    else out.push(note("variety", "good", reach, `${holesWords(reach)}: a par 5 to go for in two.`));
  }
  // The same template twice, the same way round.
  const seen = new Map();
  holes.forEach((h, i) => {
    const plan = h.layout?.plan;
    if (!plan?.template || !TEMPLATES[plan.template]) return;
    const key = `${plan.template}:${plan.favoured ?? 0}`;
    seen.set(key, [...(seen.get(key) ?? []), i]);
  });
  for (const [key, list] of seen) {
    if (list.length > 1) out.push(note("variety", "look", list, `${holesWords(list)}: the same ${TEMPLATES[key.split(":")[0]].name} ${list.length > 2 ? `${list.length} times` : "twice"}, the same way round. Change one's template, or turn it the other way.`));
  }
  // Dog-legs: as many left as right.
  const bends = holes.map((h) => (parOf(h) > 3 ? bendOf(withEdits(h.layout)) : 0));
  const left = bends.filter((b) => b < 0).length;
  const right = bends.filter((b) => b > 0).length;
  if (Math.abs(left - right) > REVIEW.bends) out.push(note("variety", "look", [], `${right} dog-legs to the right, ${left} to the left: turn one or two of the ${right > left ? "right" : "left"}-handers the other way, so a fade and a draw are each favoured somewhere.`));
  // Two in a row alike.
  for (let i = 1; i < n; i++) {
    if (pars[i] !== pars[i - 1] || Math.abs(yards[i] - yards[i - 1]) > REVIEW.twin.yards || bends[i] !== bends[i - 1]) continue;
    if (bearings && turnBetween(bearings[i], bearings[i - 1]) > REVIEW.twin.degrees) continue;
    const shape = bends[i] ? `both bending ${bends[i] < 0 ? "left" : "right"}` : "both straight";
    out.push(note("variety", "look", [i - 1, i], `${holesWords([i - 1, i])}: two par ${pars[i]}s of about ${round5((yards[i] + yards[i - 1]) / 2)} yards one after the other, ${shape}${bearings ? " and played the same way" : ""}. Make one shorter or longer, or bend it.`));
  }
  if (bearings) {
    const ways = new Set(bearings.map(sector)).size;
    const want = n >= 18 ? REVIEW.ways[18] : REVIEW.ways[9];
    if (ways < want) out.push(note("variety", "look", [], `The holes play only ${ways} of the 8 ways round the compass: the wind comes from much the same way all round. Turn a few (the Course layout) - Muirfield's two loops play every way.`));
    else out.push(note("variety", "good", [], `The holes play ${ways} of the 8 ways round the compass: the wind comes at every angle.`));
    for (let i = 0; i < n; ) {
      let j = i + 1;
      while (j < n && turnBetween(bearings[j], bearings[i]) <= 45 / 2 + 1e-9) j++;
      if (j - i >= REVIEW.run) {
        const list = Array.from({ length: j - i }, (_, k) => i + k);
        out.push(note("variety", "look", list, `Holes ${i + 1} to ${j} all play ${COMPASS[sector(bearings[i])]}: turn one, so the run breaks.`));
      }
      i = j;
    }
  }
  return out;
}

// The routing notes, for a course whose holes can be moved: crossings,
// walks, and on hills the climbs and what's seen.
function routingNotes(course, places) {
  const holes = course.holes;
  const n = holes.length;
  const out = [];
  for (const c of crossings(course)) {
    if (c.ok) continue;
    out.push(note("routing", "fix", [c.a, c.b], `${holesWords([c.a, c.b])} come within ${c.d} m of each other: move one away on the Course layout, or let them cross there.`));
  }
  const ends = holes.map((h, i) => holeEnd(h, places[i]));
  let longest = 0;
  for (let i = 0; i + 1 < n; i++) {
    const d = Math.hypot(places[i + 1].x - ends[i][0], places[i + 1].z - ends[i][1]);
    longest = Math.max(longest, d);
    if (d > REVIEW.walk) out.push(note("routing", "look", [i, i + 1], `From the ${ordinal(i + 1)} green to the ${ordinal(i + 2)} tee is a ${Math.round(d / 10) * 10} m walk: bring the tee nearer the green (the Course layout).`));
  }
  if (n > 1 && longest <= REVIEW.walk) out.push(note("routing", "good", [], `Every walk from a green to the next tee is ${Math.round(longest / 10) * 10} m or less.`));
  // On its ground: the climbs, and what's seen.
  const heights = holes.map((h) => heightsOf(withEdits(h.layout)));
  if (heights.every(Boolean)) {
    const climbs = heights.map((h) => h.green - h.tee);
    let steep = 0;
    holes.forEach((h, i) => {
      const most = parOf(h) === 3 ? CLIMB.par3Up : CLIMB.holeUp;
      if (climbs[i] > most) {
        steep++;
        out.push(note("routing", "look", [i], `${holesWords([i])} climbs ${Math.round(climbs[i])} m from tee to green (${parOf(h) === 3 ? "a par 3" : "a hole"} climbs ${most} m at most): turn it across the slope, or play it the other way.`));
      }
      if (i + 1 < n) {
        const walk = heights[i + 1].tee - heights[i].green;
        if (walk > CLIMB.walk) {
          steep++;
          out.push(note("routing", "look", [i, i + 1], `A ${Math.round(walk)} m climb from the ${ordinal(i + 1)} green to the ${ordinal(i + 2)} tee: put the tee lower, or nearer the green.`));
        }
      }
    });
    if (n >= 9 && climbs.at(-1) > CLIMB.home) out.push(note("routing", "look", [n - 1], `The last hole climbs ${Math.round(climbs.at(-1))} m: an easy walk home is kinder (${CLIMB.home} m at most).`));
    for (let i = 0; i < n; ) {
      const way = Math.sign(Math.abs(climbs[i]) > CLIMB.level ? climbs[i] : 0);
      let j = i + 1;
      while (way && j < n && Math.sign(Math.abs(climbs[j]) > CLIMB.level ? climbs[j] : 0) === way) j++;
      if (way && j - i > CLIMB.inARow) out.push(note("routing", "look", Array.from({ length: j - i }, (_, k) => i + k), `Holes ${i + 1} to ${j} all ${way > 0 ? "climb" : "fall"}: break the run with one played ${way > 0 ? "down" : "up"} or across the slope.`));
      i = j;
    }
    let blind = 0;
    holes.forEach((h, i) => {
      const L = withEdits(h.layout);
      const seen = holeSight(L);
      // (Each blind shot with an aiming post to play over: sim/aimpost.mjs.)
      const posted = (shot) => aimPosts(L).some((p) => p.shot === shot);
      if (L.landform?.ridge) {
        out.push(note("routing", "good", [i], `${holesWords([i])}: the Alps - blind to the green on purpose, over the ridge, as at Prestwick's 17th${posted("approach") ? ", with a post on the ridge to aim over" : ""}.`));
        return;
      }
      if (!seen.approach) {
        blind++;
        out.push(note("routing", "look", [i], `${holesWords([i])}: the flag can't be seen from where the second shot's played${parOf(h) === 3 ? " (the tee)" : ""}. Turn the hole, or move its green out of the hollow.`));
      } else if (!seen.tee) {
        blind++;
        out.push(note("routing", "look", [i], `${holesWords([i])}: a blind tee shot - the landing can't be seen from the tee${posted("tee") ? " (a post on the rise shows the line)" : ""}. Now and then it's a thrill; turn the hole if there are several.`));
      }
    });
    if (!blind) out.push(note("routing", "good", [], "Every flag and landing can be seen: MacKenzie's \"minimum of blindness\"."));
    if (!steep) out.push(note("routing", "good", [], "No steep climbs, on the holes or between them."));
  }
  return out;
}

// The quick notes for being fair to everyone: the forward tees, the greens.
function fairNotes(course) {
  const holes = course.holes;
  const out = [];
  let forward = 0;
  let carries = 0;
  holes.forEach((h, i) => {
    const L = withEdits(h.layout);
    if (!(L?.path?.length > 1)) return;
    const path = makePath(L.path);
    forward += teeYards(yardsOf(h), teeSpots(L, { path }), "red");
    const carry = forwardCarry(L);
    if (carry > REVIEW.carry) {
      carries++;
      out.push(note("fair", carry > REVIEW.carryFix ? "fix" : "look", [i], `${holesWords([i])}: a ${carry}-yard carry over water from the forward tee - more than many golfers can carry (${REVIEW.carry} at most). Move the water, or give a way round it.`));
    }
    const area = greenArea(L);
    const longShot = (parOf(h) === 3 && yardsOf(h) > 160) || (parOf(h) === 4 && yardsOf(h) > 420);
    if (area && area < REVIEW.green && longShot) out.push(note("fair", "look", [i], `${holesWords([i])}: a green of only ${Math.round(area / 10) * 10} m² for a long shot in: make it bigger, or the hole shorter.`));
  });
  if (!carries && holes.some((h) => (h.layout?.water ?? []).length)) out.push(note("fair", "good", [], `No carry over water from the forward tees of more than ${REVIEW.carry} yards.`));
  // (The forward tees' boxes go where tees.mjs puts them, so their length
  // is told, not judged.)
  if (holes.length >= 9) out.push(note("fair", "info", [], `${forward.toLocaleString("en-GB")} yards from the forward (red) tees.`));
  return out;
}

const ordinal = (k) => `${k}${k % 100 >= 11 && k % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][k % 10] ?? "th"}`;

// ---- Played in the head --------------------------------------------------------------

// Which of each hole's bunkers and water are its own ({ bunkers, water }
// [index]), for a hole from the map - its box has its neighbours' too
// (sim/owners.mjs) - or null (a designed hole's are all its own).
export function ownHazards(course) {
  const holes = course?.holes ?? [];
  if (!holes.some((h) => h.layout?.source === "map")) return holes.map(() => null);
  const owners = courseOwners(course);
  return holes.map((h, i) => {
    const L = h.layout;
    if (L?.source !== "map" || !owners[i]) return null;
    const of = (list) => (L[list] ?? []).map((_, k) => k).filter((k) => (owners[i][list]?.[k] ?? i) === i);
    return { bunkers: of("bunkers"), water: of("water") };
  });
}

// A hole played in the head by each of the course's golfers (GOLFERS) -
// plain data, so it can come back from a worker: { costs: { scratch, ... }
// strokes on average; side: the better side of the fairway and what it's
// worth to the 10 handicap ({ side, bonus }, null on a par 3); found: { bunkers,
// water } [{ scratch, ... }] - how often each finds each hazard; dead:
// { bunkers, water } [index] - the hazards away from the green no one
// finds that change nothing either (none aims round them) }. (Round the
// green a hazard no one finds in the head still frames the green and
// takes the misses the head leaves out - wind, a bad bounce.) own: the
// hole's own hazards (ownHazards), the only ones judged dead.
export function holePlay(layout, { rounds = 120, own = null } = {}) {
  const L = withEdits(layout);
  const grid = lieGrid(L);
  const costs = {};
  const found = { bunkers: L.bunkers.map(() => ({})), water: L.water.map(() => ({})) };
  const results = {};
  let side = null;
  for (const k of GOLFER_ORDER) {
    const result = evaluateHole(L, k, { grid });
    results[k] = result;
    costs[k] = r2(result.expected);
    const r = playRounds(L, k, { grid, result, rounds });
    r.bunkers.forEach((v, i) => (found.bunkers[i][k] = r2(v)));
    r.water.forEach((v, i) => (found.water[i][k] = r2(v)));
    if (k === "mid" && L.par > 3) {
      const s = sideBonus(L, k, { grid, result });
      side = { side: s.side, bonus: r2(s.bonus) };
    }
  }
  // A hazard nobody finds might still be doing its job - golfers laying up
  // short of it or aiming away from it: it's dead only if the hole plays
  // the same without it.
  const dead = { bunkers: [], water: [] };
  for (const kind of ["bunkers", "water"]) {
    found[kind].forEach((f, i) => {
      if ((own && !own[kind].includes(i)) || Object.values(f).some((v) => v >= REVIEW.found) || byGreen(L, L[kind][i])) return;
      const without = { ...L, [kind]: L[kind].filter((_, j) => j !== i) };
      const g = lieGrid(without);
      const same = ["scratch", "mid", "bogey"].every((k) => {
        const b = evaluateHole(without, k, { grid: g });
        const a = results[k];
        const moved = a.target && b.target ? Math.hypot(a.target[0] - b.target[0], a.target[1] - b.target[1]) : 0;
        return a.expected - b.expected < 0.02 && moved < 6;
      });
      if (same) dead[kind].push(i);
    });
  }
  return { costs, side, found, dead };
}

// What a hole's play depends on (its layout, and which hazards are its
// own), as a short string: the same for the same hole, so a hole's play is
// kept until it's changed (not its number or stroke index, which change
// nothing in it).
export function playKey(layout, own = null) {
  const text = JSON.stringify([layout ? { ...layout, si: undefined, number: undefined } : null, own]);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `p1-${text.length}-${h.toString(36)}`;
}

// How hard a hole plays for handicap strokes: what the bogey golfer
// drops to the scratch golfer on it.
const handicapHard = (play) => play.costs.bogey - play.costs.scratch;

// The stroke indexes as the holes play (plays: holePlay by hole): the
// hole where the bogey golfer drops most to the scratch golfer 1; on 18
// holes the front nine the odd ones, the back the even (as the course
// maker's: coursemaker.mjs strokeIndexes).
export function strokeIndexesFromPlay(plays) {
  const n = plays.length;
  const halves = n <= 9 ? [[0, n, (k) => k + 1]] : [[0, 9, (k) => 2 * k + 1], [9, n, (k) => 2 * k + 2]];
  const si = [];
  for (const [a, b, at] of halves) {
    const order = plays
      .map((p, i) => [i, handicapHard(p)])
      .slice(a, b)
      .sort((x, y) => y[1] - x[1]);
    order.forEach(([i], k) => (si[i] = at(k)));
  }
  return si;
}

// Rank correlation (Spearman's) of two lists of numbers.
export function rankCorrelation(a, b) {
  const ranks = (list) => {
    const order = list.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]);
    const r = [];
    order.forEach(([, i], k) => (r[i] = k));
    return r;
  };
  const ra = ranks(a);
  const rb = ranks(b);
  const n = a.length;
  if (n < 3) return 1;
  const d2 = sum(ra.map((v, i) => (v - rb[i]) ** 2));
  return 1 - (6 * d2) / (n * (n * n - 1));
}

// The notes the holes' play gives (plays: holePlay by hole, all of them).
function playedNotes(course, plays) {
  const holes = course.holes;
  const n = holes.length;
  const out = [];
  const pars = holes.map(parOf);
  // Shot options.
  let choices = 0;
  let asked = 0;
  let deadCount = 0;
  const noQuestion = [];
  const unguarded = [];
  holes.forEach((h, i) => {
    const p = plays[i];
    const L = withEdits(h.layout);
    const path = makePath(L.path);
    if (pars[i] > 3 && L.plan?.kind === "open") out.push(note("choices", "info", [i], `${holesWords([i])}: a breather, as it was planned - wide open, a chance to get one back.`));
    else if (pars[i] > 3) {
      asked++;
      if (p.side?.bonus >= REVIEW.choice) choices++;
      else noQuestion.push(i);
    } else {
      const guarded = ["bunkers", "water"].some((k) => p.found[k].some((f) => Object.values(f).some((v) => v >= 0.05)));
      if (!guarded) unguarded.push(i);
    }
    for (const kind of ["bunkers", "water"]) {
      for (const k of p.dead[kind]) {
        deadCount++;
        const what = kind === "water" ? "the water" : "the bunker";
        const s = nearest(path, ...middleOf(L[kind][k])).s / YARD;
        const move = pars[i] === 3 ? "Move it nearer the line or the green" : s < 300 ? "Move it to where drives finish (200 to 250 yards out)" : pars[i] === 5 && s < path.length / YARD - 120 ? "Move it to where second shots finish" : "Move it nearer the green or the line";
        out.push(note("choices", "look", [i], `${holesWords([i])}: nobody finds ${what} ${whereIs(L, L[kind][k], path)}, and nobody plays round it either. ${move}, or take it out.`));
      }
    }
  });
  if (noQuestion.length) {
    const one = noQuestion.length === 1;
    out.push(note("choices", "look", noQuestion, `${holesWords(noQuestion)} ${one ? "asks" : "ask"} no question off the tee: neither side of the fairway is better to play in from. Turn ${one ? "the" : "a"} green to open from one side, or guard one side of it with a bunker, so where you drive matters.`, true));
  }
  if (unguarded.length) out.push(note("choices", "look", unguarded, `${holesWords(unguarded)}: nothing round the green that anyone finds - a bunker or water on one side makes the pin matter and gives a side to miss on.`, true));
  if (asked) out.push(note("choices", choices / asked >= 0.6 ? "good" : "info", [], `${choices} of the ${asked} par 4s and 5s have a better side of the fairway to drive to.`));
  if (!deadCount) out.push(note("choices", "good", [], "Every hazard is in someone's way."));
  // Challenge: rating and slope (an 18-hole course's).
  const k18 = 18 / n;
  const total = (g) => sum(plays.map((p) => p.costs[g]));
  const scratch = total("scratch");
  const bogey = total("bogey");
  const par = sum(pars);
  const slope = Math.round(5.381 * (bogey - scratch) * k18);
  const over = (scratch - par) * k18;
  if (over < REVIEW.rating[0]) out.push(note("challenge", "look", [], `It plays easy: the scratch golfer averages ${r1(scratch)} against a par of ${par}. Tighten a few holes - a bunker on the bold line, a green turned across it.`));
  else if (over > REVIEW.rating[1]) out.push(note("challenge", "look", [], `It plays hard: the scratch golfer averages ${r1(scratch)} against a par of ${par}. Ease a few holes - wider fairways, fewer forced carries.`));
  if (slope < REVIEW.slope[0]) out.push(note("challenge", "look", [], `A slope of about ${slope}: little between the good golfer and the average one. Hazards where the shorter hitters' shots finish would bring it up (113 is standard).`));
  else if (slope > REVIEW.slope[1]) out.push(note("challenge", "look", [], `A slope of about ${slope}: very hard on the average golfer. Give the shorter hitters ways round (113 is standard).`));
  out.push(note("challenge", over >= REVIEW.rating[0] && over <= REVIEW.rating[1] && slope >= REVIEW.slope[0] && slope <= REVIEW.slope[1] ? "good" : "info", [], `The scratch golfer averages about ${r1(scratch)}, the 10 handicap ${r1(total("mid"))}, the bogey golfer ${r1(bogey)}: a slope of about ${slope}.`));
  // The hardest holes where they belong (for the 10 handicap, against par).
  if (n >= 9) {
    const hard = plays.map((p, i) => [i, p.costs.mid - pars[i]]).sort((a, b) => b[1] - a[1]);
    const top3 = hard.slice(0, 3).map(([i]) => i);
    const early = top3.filter((i) => i < 2);
    if (early.length) out.push(note("challenge", "look", early, `${holesWords(early)} ${early.length > 1 ? "are" : "is"} among the three hardest holes: a gentler start lets golfers find their swing - save the hardest for later.`));
    if (n >= 18) {
      const third = hard.slice(0, 6).map(([i]) => i);
      if (!third.some((i) => i >= n - 4)) out.push(note("challenge", "look", [], `None of the last four holes is among the hardest third: a strong finish - a hard 17th, an 18th to win or lose on - is what's remembered.`));
    }
    holes.forEach((h, i) => {
      const o = plays[i].costs.scratch - pars[i];
      if (o > REVIEW.overPar) out.push(note("challenge", "look", [i], `${holesWords([i])}: even the scratch golfer averages ${r2(plays[i].costs.scratch)} on this par ${pars[i]}. Make it shorter or wider, or its par ${pars[i] + 1}.`));
    });
  }
  // The stroke indexes as the holes play.
  const sis = holes.map((h) => h.spec?.si);
  if (sis.every(Number.isFinite) && n >= 9) {
    // (Each nine on its own on 18 holes: the front's are the odd ones,
    // the back's the even, however hard either nine is.)
    const nines = n > 9 ? [[0, 9], [9, n]] : [[0, n]];
    const rho = sum(nines.map(([a, b]) => rankCorrelation(sis.slice(a, b).map((v) => -v), plays.slice(a, b).map(handicapHard)))) / nines.length;
    if (rho < REVIEW.order) out.push(note("pace", "look", [], `The stroke indexes don't follow how the holes play for the bogey golfer against the scratch golfer: set them from play (below) so handicap strokes fall where they're needed.`));
  }
  // Fair: the bogey golfer's wet balls.
  holes.forEach((h, i) => {
    const wet = Math.max(0, ...plays[i].found.water.map((f) => f.bogey ?? 0));
    if (wet > REVIEW.wet) out.push(note("fair", "look", [i], `${holesWords([i])}: the bogey golfer finds the water in ${Math.round(wet * 10)} rounds in 10. Give them a way round - more room away from it, or the green open on the safe side.`));
  });
  return out;
}

// ---- The review ------------------------------------------------------------------------

// A part's score out of 10 from its notes (n: the course's holes): a note
// on the course, or on two or more holes together, 1 off (2 to fix); one
// on a hole (or said of each of several), its share of the course's holes
// for each (a hole with more than one counted as two at most) - so a part
// with a few holes to look at on 18 still scores well, and one with
// something on most of them doesn't.
const weightOf = (note) => (note.level === "fix" ? 2 : note.level === "look" ? 1 : 0);
export function partScore(notes, n = 18) {
  let off = 0;
  const holes = new Map();
  for (const note of notes) {
    const w = weightOf(note);
    if (!w) continue;
    if (note.holes.length === 1 || note.each) for (const i of note.holes) holes.set(i, (holes.get(i) ?? 0) + w);
    else off += w;
  }
  for (const w of holes.values()) off += (10 * Math.min(2, w)) / Math.max(1, n);
  return r1(Math.max(0, 10 - off));
}

// The course reviewed: { parts: { key: { score, notes, waiting } }, score,
// notes, weakest } - waiting: a part that needs the holes played and
// hasn't them yet (its score null); score: out of 10, weighted as PARTS,
// of the parts that have one; weakest: the holes with the most to look at
// ([index], most first). plays: holePlay by hole, where it's been worked
// out (the played parts wait for every hole's).
export function reviewCourse(course, { plays = [] } = {}) {
  const holes = course?.holes ?? [];
  const notes = [];
  if (holes.length) {
    notes.push(...cardNotes(course));
    const movable = canMoveHoles(course);
    let places = null;
    if (movable) {
      try {
        places = coursePlaces(course);
      } catch {
        places = null;
      }
    }
    notes.push(...varietyNotes(course, places ? places.map(placeBearing) : null));
    if (places) notes.push(...routingNotes(course, places));
    notes.push(...fairNotes(course));
  }
  const played = holes.length > 0 && holes.every((h, i) => plays[i]);
  if (played) notes.push(...playedNotes(course, plays));
  const parts = {};
  for (const key of PART_ORDER) {
    const list = notes.filter((n) => n.part === key);
    const waiting = PLAYED.has(key) && !played;
    const fixed = key === "routing" && !(canMoveHoles(course) && holes.length);
    parts[key] = { score: waiting || fixed ? null : partScore(list, holes.length), notes: list, waiting, fixed };
  }
  const scored = PART_ORDER.filter((k) => parts[k].score != null);
  const weight = sum(scored.map((k) => PARTS[k].weight));
  const score = weight ? r1(sum(scored.map((k) => parts[k].score * PARTS[k].weight)) / weight) : null;
  const count = holes.map(() => 0);
  for (const n of notes) for (const i of n.holes) if (n.level === "fix" || n.level === "look") count[i] += n.level === "fix" ? 2 : 1;
  const weakest = count
    .map((c, i) => [i, c])
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, 3)
    .map(([i]) => i);
  return { parts, score, notes, weakest };
}
