// Strategic holes (docs/COURSE-DESIGN-PLAN.md, phase 1; the owner: "work
// out a strategy to emulate and generate amazing courses"). A classic hole
// (course.mjs buildHole) puts its bunkers and water at set distances along
// the line; one here is planned the way the great courses' holes are,
// round where golfers' shots finish (sim/golfers.mjs):
//
//   a better side   every par 4 and 5 has a side of the fairway that sets
//                   up the next shot - inside a dog-leg's corner, along the
//                   water, past the bunker in the middle - and the green
//                   is turned to open from there and guarded from the
//                   other side, so the safe tee shot leaves the harder way
//                   in (Max Behr's "line of charm"; "a hard par, an easy
//                   bogey")
//   hazards where   the drive bunkers sit where the scratch and 10
//   shots finish    handicap golfers' drives finish (250 and 223 yds), on
//                   the bold line; the shorter hitter plays short of them,
//                   or round, on a fairway widest where their drives land
//   a pin to match  the pin mostly tucked behind the guarding bunker, now
//                   and then at the back, the middle or the open front
//
// The kinds of hole (KINDS) are the plan's shapes: a dog-leg to cut, a
// hazard down one side, a bunker in the middle, a diagonal carry over
// water, a short par 4, a par 5 to go for or to lay up on, and par 3s from
// a short one ringed by sand to a long one open at the front. The hole's
// own choices (its bunkers, water, dog-leg, fairway, green, trees) say
// which and how much, as for a classic hole.
//
// Its randomness is its own (spec.seed ^ 0xa4c1), the shapes laid out as a
// classic hole's are (blobs, a smoothed line), so play, drawing, the
// course map and the hand tools treat it as any other designed hole. Pure.

import { shapeHazards } from "./hazardshapes.mjs";
import { crossRow, teeRow } from "./crossbunkers.mjs";
import { linksWaste } from "./wastearea.mjs";
import { YARD } from "./flight.mjs";
import { GOLFERS } from "./golfers.mjs";
import {
  seeded,
  makePath,
  pointAt,
  nearest,
  smooth,
  blobShape,
  blobRadius,
  insideBlob,
  greenContours,
  wildWater,
  potBunker,
  styleBunkers,
  holeBunkerStyle,
  burnFor,
  wasteAreas,
  dressHole,
  fairwayHalfWidth,
  DEFAULT_OPTIONS,
  LINKS_TREES,
  FAIRWAY_WIDTH,
  GREEN_SIZE,
} from "./course.mjs";

// The kinds of strategic hole, by par: what each asks, in a line (for the
// designer's card).
export const KINDS = {
  corner: { name: "Dog-leg", blurb: "Cut the corner over the sand for a shorter, straighter way in; round it is safe but longer." },
  flank: { name: "Side hazard", blurb: "The bold drive goes down the side with the trouble, for the open way into the green." },
  centre: { name: "Bunker in the middle", blurb: "A bunker in the middle of the long hitters' landing: pick a side, or lay back short of it." },
  open: { name: "Breather", blurb: "Wide and open, with run-up room in front of the green: a chance to get one back." },
  cape: { name: "Cape", blurb: "A diagonal carry over water: the more you bite off, the shorter the second." },
  short4: { name: "Short par 4", blurb: "Lay up to the open side for a pitch in, or go for the green past the sand." },
  go: { name: "Par 5 to go for", blurb: "Reachable in two past the trouble short of the green; or lay up to the open side." },
  cross: { name: "Three-shot par 5", blurb: "A bunker across the fairway at the lay-up: carry it with the second, or stay short." },
  carry: { name: "Over water", blurb: "All carry over water to a green that opens on the far side." },
  lateral: { name: "Water alongside", blurb: "Water down one side of the green; the safe miss is the other way." },
  short3: { name: "Short par 3", blurb: "A small green ringed by sand: a short iron that has to be right." },
  long3: { name: "Long par 3", blurb: "A long one, open at the front so it can be run on." },
  angled: { name: "Angled green", blurb: "A green turned across the line, guarded at its narrow front: the pin decides the shot." },
  guarded: { name: "Guarded par 3", blurb: "Sand either side of the front: the middle is the play, the pin the dare." },
};

// The classic holes the great courses' architects built again and again
// (C.B. Macdonald and Seth Raynor's "templates", and a few since), for a
// hole's Template choice: each a kind of strategic hole (KINDS) made the
// template's way - its green, its bunkers, its pin. pars: the pars it's
// for (on another it's left out); yards: its usual length, which the course
// maker gives it (sim/sequence.mjs).
export const TEMPLATES = {
  redan: { name: "Redan", pars: [3], yards: [175, 225], kind: "angled", blurb: "North Berwick's 15th: a long green turned across the line, falling away from its front corner, a deep bunker guarding its narrow front." },
  eden: { name: "Eden", pars: [3], yards: [150, 180], kind: "guarded", blurb: "St Andrews' 11th: a green tilting hard to the front, a small deep bunker in front and a big one to the side." },
  biarritz: { name: "Biarritz", pars: [3], yards: [205, 240], kind: "long3", blurb: "A green 60 yards long with a deep swale across its middle: front pin or back, a different club." },
  short: { name: "Short", pars: [3], yards: [120, 150], kind: "short3", blurb: "A small green ringed by sand: hit it or play from the bunkers." },
  road: { name: "Road", pars: [4], yards: [400, 465], kind: "flank", blurb: "St Andrews' 17th: a shallow green across the line, a deep pot bunker cutting into its front and trouble behind." },
  narrows: { name: "Narrows", pars: [4], yards: [380, 440], kind: "flank", blurb: "The fairway pinched by a bunker in the middle short of the green: lay up short of it or carry it." },
  bottle: { name: "Bottle", pars: [4], yards: [380, 455], kind: "centre", blurb: "Bunkers on a diagonal split the fairway: the far side is longer to reach and better to play from." },
  cape: { name: "Cape", pars: [4], yards: [360, 440], kind: "cape", blurb: "Mid Ocean's 5th: a diagonal carry - the more you bite off, the shorter the second." },
  principal: { name: "Principal's Nose", pars: [4, 5], yards: [400, 560], kind: "centre", blurb: "St Andrews' 16th: a cluster of bunkers in the middle where the long drives finish - go either side, or lay back." },
  drivable: { name: "Drivable par 4", pars: [4], yards: [240, 280], kind: "short4", blurb: "Drivable by the long hitters past the sand to a narrow green; lay up for a pitch from the open side." },
  long: { name: "Long", pars: [5], yards: [550, 620], kind: "cross", blurb: "Pine Valley's 7th: a great bunker right across the fairway a hundred yards short of the green." },
  reachable: { name: "Par 5 to go for", pars: [5], yards: [480, 530], kind: "go", blurb: "Augusta's 13th and 15th: reachable in two past trouble short of the green - or lay up." },
  plateau: { name: "Double plateau", pars: [4], yards: [370, 440], kind: "flank", blurb: "A big green of three levels and a bunker in the middle of the fairway short of it: the pin's level decides the shot." },
};

// What a strategic hole is, in a line for the designer: its template or
// kind, what it asks, its better side, and on hills what its land does
// (sim/landforms.mjs) - "" for a classic hole.
export function holeStory(layout) {
  const plan = layout?.plan;
  if (!plan) return "";
  const t = TEMPLATES[plan.template];
  const k = KINDS[plan.kind];
  if (!t && !k) return "";
  const side = layout.par > 3 && (plan.favoured === -1 || plan.favoured === 1) ? ` The better side of the fairway: the ${plan.favoured < 0 ? "left" : "right"}.` : "";
  const land = landStory(layout.landform);
  return `${t ? `${t.name}: ${t.blurb}` : `${k.name}: ${k.blurb}`}${side}${land ? ` ${land}` : ""}`;
}

// What a hole's land does, on hills (layout.landform).
function landStory(lf) {
  if (!lf) return "";
  const out = [];
  if (lf.ridge) out.push("The Alps: a ridge across the fairway short of the green hides it from the second shot, as at Prestwick's 17th.");
  if (lf.green?.lift > 0) out.push("Its green is up on a plateau: short or off the side runs back down the bank.");
  if (lf.green?.lift < 0) out.push("A punchbowl green, down in a hollow: shots feed in off its banks.");
  if (lf.shelf) out.push("The drive lands on a level shelf in the climb.");
  if (lf.tee) out.push("Played from a raised tee.");
  return out.join(" ");
}

// How many drive-zone bunkers and greenside bunkers a hole's Bunkers choice
// gives it.
const SAND = { none: [0, 0], few: [1, 1], some: [2, 2], lots: [3, 3] };
// How much wider than a classic hole's its fairway is: room to choose a
// side.
const WIDER = 1.15;
// The green slope levels (course.mjs GREEN_SLOPES), mildest first.
const LEVELS = ["gentle", "moderate", "severe"];

// Where the course's golfers' drives finish (metres).
const drives = () => ({ scratch: GOLFERS.scratch.drive * YARD, mid: GOLFERS.mid.drive * YARD, bogey: GOLFERS.bogey.drive * YARD });

const pick = (rand, list) => list[Math.floor(rand() * list.length)];
const between = (rand, a, b) => a + rand() * (b - a);
const sign = (rand) => (rand() < 0.5 ? -1 : 1);

// The plan for a hole: its kind, its better side and its shapes, from its
// spec and choices. rand: the hole's own randomness.
export function planHole(spec, o, rand) {
  const par = spec.par;
  const yards = spec.yards;
  const L = yards * YARD;
  const [fwSand, greenSand] = SAND[o.bunkers] ?? SAND.some;
  // Water as asked; "auto" now and then, either side alike.
  let water = o.water;
  if (water === "auto") {
    const r = rand();
    water = r < 0.75 ? "none" : par === 3 ? pick(rand, ["front", "left", "right"]) : sign(rand) < 0 ? "left" : "right";
  }
  const w = water === "left" ? -1 : water === "right" ? 1 : 0;
  const bendAsked = o.dogleg === "left" ? -1 : o.dogleg === "right" ? 1 : 0;

  let kind;
  if (par === 3) {
    if (water === "front") kind = "carry";
    else if (w) kind = "lateral";
    else if (yards <= 150) kind = "short3";
    else if (yards >= 200) kind = "long3";
    else kind = pick(rand, ["angled", "angled", "guarded"]);
  } else if (par === 4) {
    if (water === "front") kind = "cape";
    else if (w) kind = "flank";
    else if (yards <= 345) kind = "short4";
    else if (bendAsked) kind = "corner";
    else if (o.dogleg === "none") kind = pick(rand, ["flank", "centre", "open", "flank"]);
    else if (yards >= 440) kind = pick(rand, ["open", "flank", "corner"]);
    else kind = pick(rand, ["corner", "corner", "flank", "centre", "open"]);
  } else {
    if (water === "front") kind = "go";
    else if (w) kind = "flank";
    else if (bendAsked) kind = "corner";
    else if (yards <= 530) kind = pick(rand, ["go", "corner", "flank"]);
    else kind = pick(rand, ["cross", "cross", "corner", "centre"]);
  }

  // A template asked for makes it that kind of hole (on a par it's for).
  const template = TEMPLATES[o.template]?.pars.includes(par) ? o.template : null;
  if (template) kind = TEMPLATES[template].kind;

  // The better side: inside a dog-leg, along the water (the bold line), or
  // either side.
  let favoured = sign(rand);
  if ((kind === "corner" || kind === "cape") && bendAsked) favoured = bendAsked;
  if (kind === "flank" && w) favoured = w;
  if (kind === "lateral") favoured = -w;

  const D = drives();
  const plan = { kind, template, favoured, water, par, L, D, fwSand, greenSand, bends: [], hazards: [], guards: [], shape: null };

  // ---- The line -------------------------------------------------------------
  if (par === 3) plan.heading = (rand() - 0.5) * 0.12;
  else plan.heading = (rand() - 0.5) * 0.06;
  if (kind === "corner" || kind === "cape") {
    const c = favoured;
    // (Never before the tee: a short par 4's corner at least a third of the
    // way along, not 130 yards from a green that's nearer than that.)
    const at = Math.max(L / 3, Math.min(L - 130 * YARD, Math.max(0.5 * L, D.mid + between(rand, kind === "cape" ? 15 : 10, 30) * YARD)));
    plan.bends.push({ at, turn: c * between(rand, kind === "cape" ? 0.45 : 0.3, kind === "cape" ? 0.65 : 0.5) });
    plan.corner = at;
    // A par 5's line turns back again towards the green.
    if (par === 5 && L - at > 220 * YARD && rand() < 0.5) plan.bends.push({ at: L - between(rand, 120, 150) * YARD, turn: -c * between(rand, 0.15, 0.3) });
  } else if (par > 3 && o.dogleg !== "none" && kind !== "short4") {
    // Past the long hitters' drives the line turns gently towards the
    // better side, so the bold line is the shorter way home too.
    const at = kind === "cross" ? L - between(rand, 130, 150) * YARD : D.scratch + between(rand, 15, 30) * YARD;
    if (at < L - 100 * YARD) plan.bends.push({ at, turn: favoured * (kind === "open" ? between(rand, 0.08, 0.16) : between(rand, 0.22, 0.38)) });
  }

  // ---- The fairway's width along it -------------------------------------------
  const Y = YARD;
  if (par > 3) {
    if (kind === "centre") plan.shape = [[D.scratch - 70 * Y, 1], [D.scratch - 35 * Y, 1.3], [D.scratch + 15 * Y, 1.3], [D.scratch + 50 * Y, 1]];
    else if (kind === "corner" || kind === "cape") plan.shape = [[plan.corner - 60 * Y, 1.05], [plan.corner - 10 * Y, 1.25], [plan.corner + 40 * Y, 1.05]];
    else if (kind === "open") plan.shape = [[0, 1.3]];
    else plan.shape = [[D.bogey - 40 * Y, 1], [D.bogey, 1.15], [D.scratch + 10 * Y, 1.05], [D.scratch + 50 * Y, 1]];
    // A par 5's lay-up: wide, short of the green.
    if (par === 5) plan.shape = [...plan.shape.filter(([s]) => s < L - 140 * Y), [L - 130 * Y, 1], [L - 95 * Y, 1.2], [L - 60 * Y, 1.05]];
  }

  // ---- The drive zone's hazards --------------------------------------------------
  // Each: { type, s, side, inset, along, across, turn } - s along the line,
  // side -1/0/+1, inset how far its inner edge comes into the fairway
  // (metres; less than 0 short of its edge), along and across its half
  // sizes, turn its slant off the line (radians).
  const f = favoured;
  const H = plan.hazards;
  const bunker = (s, side, inset, along = between(rand, 11, 16), across = between(rand, 4, 6), extra = {}) =>
    H.push({ type: "bunker", s, side, inset, along, across, turn: (rand() - 0.5) * 0.2, ...extra });
  const n = fwSand;
  if (kind === "flank") {
    if (w) H.push({ type: "water", s: (D.bogey + D.scratch) / 2 + between(rand, 0, 20) * Y, side: w, inset: -between(rand, 2, 5), along: between(rand, 45, 65), across: between(rand, 12, 17), turn: 0 });
    if (n >= 1 && !w) bunker(D.mid + between(rand, 0, 15) * Y, f, between(rand, 3, 5));
    if (n >= 2) bunker(D.scratch + between(rand, 2, 12) * Y, -f, between(rand, 2, 4));
    if (n >= 3 || (n >= 1 && w)) bunker(D.bogey - between(rand, 10, 20) * Y, w ? -f : f, between(rand, 1, 3));
  } else if (kind === "centre") {
    if (n >= 1) bunker(D.scratch - between(rand, 5, 20) * Y, 0, 0, between(rand, 7, 10), between(rand, 5, 7), { centre: (rand() - 0.5) * 4 });
    if (n >= 2) bunker(D.scratch + between(rand, 5, 12) * Y, f, between(rand, 2, 4));
    if (n >= 3) bunker(D.bogey - between(rand, 5, 15) * Y, -f, between(rand, 1, 3));
  } else if (kind === "corner") {
    const c = plan.bends[0].turn > 0 ? 1 : -1;
    if (n >= 1) bunker(plan.corner - between(rand, 15, 25) * Y, c, between(rand, 4, 6));
    if (n >= 2) bunker(plan.corner + between(rand, 3, 10) * Y, c, between(rand, 1, 3));
    if (n >= 3) bunker(plan.corner + between(rand, 5, 15) * Y, -c, between(rand, 2, 4));
  } else if (kind === "cape") {
    const c = plan.bends[0].turn > 0 ? 1 : -1;
    // The water across the inside of the corner, on the slant: the more of
    // it carried, the more of the hole cut off. (Without water, sand: a run
    // of bunkers coming further into the fairway the further along.)
    if (water !== "none") H.push({ type: "water", s: plan.corner - between(rand, 15, 30) * Y, side: c, inset: between(rand, 0, 4), along: between(rand, 40, 55), across: between(rand, 15, 21), turn: c * between(rand, 0.45, 0.65) });
    else for (let i = 0; i < 3; i++) bunker(plan.corner - (38 - 15 * i) * Y, c, 2 + 5 * i, between(rand, 8, 11), between(rand, 4, 5.5));
    if (n >= 2) bunker(plan.corner + between(rand, 5, 15) * Y, -c, between(rand, 2, 4));
    if (n >= 3) bunker(D.bogey - between(rand, 5, 15) * Y, -c, between(rand, 1, 2));
  } else if (kind === "open") {
    if (n >= 2) bunker(D.scratch + between(rand, 0, 10) * Y, f, between(rand, 1, 3));
    if (n >= 3) bunker(D.mid - between(rand, 10, 20) * Y, -f, -between(rand, 0, 2));
  } else if (kind === "short4") {
    // Short of the green on the go line, and a wide lay-up the other side.
    if (n >= 1) bunker(L - between(rand, 35, 55) * Y, -f, between(rand, 3, 6), between(rand, 9, 13), between(rand, 4, 6));
    if (n >= 2) bunker(L - between(rand, 70, 85) * Y, -f, between(rand, 1, 3));
    if (n >= 3) bunker(Math.min(D.scratch, L - 100 * Y), f, -between(rand, 0, 2));
  } else if (kind === "go") {
    if (n >= 1) bunker(D.mid + between(rand, 0, 20) * Y, -f, between(rand, 2, 4));
    if (n >= 2) bunker(L - between(rand, 40, 60) * Y, -f, between(rand, 2, 5));
    if (n >= 3) bunker(D.scratch + between(rand, 0, 10) * Y, f, between(rand, 1, 3));
  } else if (kind === "cross") {
    if (n >= 1) bunker(D.mid + between(rand, 0, 20) * Y, f, between(rand, 3, 5));
    // Right across the fairway where the second shots finish.
    if (n >= 1) bunker(L - between(rand, 105, 125) * Y, 0, 0, between(rand, 5, 7), 0, { full: true });
    if (n >= 3) bunker(L - between(rand, 45, 60) * Y, -f, between(rand, 2, 4));
  }
  // Short of the green on the side away from the better one: the approach
  // from there carries it, the one from the better side doesn't.
  if (["flank", "centre", "corner", "cape"].includes(kind) && greenSand >= 2) bunker(L - between(rand, 28, 45) * Y, -f, between(rand, 6, 9), between(rand, 8, 12), between(rand, 4, 5.5), { approach: true });

  // ---- The green ----------------------------------------------------------------
  // How big: with the length of the shot in (the 10 handicap's), as
  // architects size them - about 3,000 sq ft for a wedge, 7,500 for a long
  // iron (Brauer, from the USGA's rating data) - and the hole's choice.
  const approach = par === 3 ? yards : par === 4 ? Math.max(70, yards - GOLFERS.mid.drive) : Math.max(90, yards - GOLFERS.mid.drive * 1.9);
  const sqft = Math.min(7500, Math.max(3000, 3000 + 36 * (approach - 110)));
  const k = GREEN_SIZE[o.green] ?? 1;
  const area = sqft * 0.0929 * k * k;
  // Turned across the line, opening from the better side: most strategic
  // greens 20 - 40 degrees; an open hole's or a long par 3's barely.
  const turnBy = {
    angled: between(rand, 0.5, 0.75),
    long3: between(rand, 0, 0.2),
    open: between(rand, 0, 0.2),
    short3: between(rand, 0, 0.3),
    guarded: between(rand, 0.1, 0.35),
  };
  const turn = -f * (turnBy[kind] ?? between(rand, 0.3, 0.6));
  // Deeper than wide (the golfer's spread is: sim/golfers.mjs), more so
  // the more it's turned.
  const aspect = 1.2 + Math.abs(turn) * 0.9 + rand() * 0.15;
  plan.green = { area, aspect, turn };

  // The bunkers round it: at angles from its own axis (0 its back, PI its
  // front, + to its right), the first guarding the front of the side away
  // from the better one.
  const G = plan.guards;
  const g = greenSand + (kind === "short3" && greenSand ? 1 : 0);
  const guard = (phi, extra = {}) => G.push({ phi: phi + (rand() - 0.5) * 0.2, along: between(rand, 7, 11), across: between(rand, 3.2, 4.6), gap: between(rand, 4, 5.5), ...extra });
  const frontOpen = kind === "long3" || kind === "open" || (par === 4 && yards >= 440);
  if (kind === "short3") [Math.PI * 0.68, -Math.PI * 0.68, Math.PI * 0.3, -Math.PI * 0.3, 0].slice(0, g).forEach((p) => guard(p));
  else if (frontOpen) [-f * Math.PI * 0.52, f * Math.PI * 0.45, 0].slice(0, g).forEach((p) => guard(p));
  else if (kind === "guarded") [Math.PI * 0.74, -Math.PI * 0.74, 0].slice(0, g).forEach((p) => guard(p));
  else if (kind === "carry") [f * Math.PI * 0.25, -f * Math.PI * 0.45, 0].slice(0, Math.max(0, g - 1)).forEach((p) => guard(p));
  else if (kind === "lateral") [-f * Math.PI * 0.3, f * Math.PI * 0.75, 0].slice(0, Math.max(0, g - 1)).forEach((p) => guard(p));
  else [-f * Math.PI * 0.72, -f * Math.PI * 0.4, f * Math.PI * 0.3].slice(0, g).forEach((p, i) => guard(p, i === 0 ? { along: between(rand, 9, 13), across: between(rand, 3.8, 5) } : {}));

  // Water at the green: in front of a par 3 (or a par 5 to go for), or
  // alongside it.
  if (kind === "carry" || (kind === "go" && water === "front")) plan.greenWater = { front: true, shift: -f * between(rand, 3, 7), across: between(rand, 22, 30), deep: between(rand, 9, 13) };
  if (kind === "lateral") plan.greenWater = { side: w, across: between(rand, 9, 13), along: between(rand, 26, 36) };
  // Water asked for on a hole whose kind - a template's - has none of its
  // own (a Short, a Drivable par 4, a Long): put in all the same, in front
  // of a par 3's green or beside it, or along a longer hole's drives, well
  // short of its green. (Found making the ready-made courses strategic: a
  // Lakes course asked for water on seven holes and got three ponds.) Not
  // by a green whose own slopes run off it - a Redan's, an Eden's, a
  // Biarritz's - where a pond's bank can't meet its water.
  if (water !== "none" && !plan.greenWater && !H.some((h) => h.type === "water") && !SLOPED_GREENS.includes(template)) {
    if (par === 3) plan.greenWater = water === "front" ? { front: true, shift: -f * between(rand, 3, 7), across: between(rand, 22, 30), deep: between(rand, 9, 13) } : { side: w, across: between(rand, 9, 13), along: between(rand, 26, 36) };
    else {
      const s = Math.min((D.bogey + D.scratch) / 2 + between(rand, 0, 20) * Y, L - 120 * Y);
      if (s > 100 * Y) H.push({ type: "water", s, side: w || f, inset: -between(rand, 2, 5), along: between(rand, 35, 50), across: between(rand, 12, 17), turn: 0 });
    }
  }

  // The pin: tucked behind the guard, at the back, in the middle or at the
  // open front.
  const r = rand();
  plan.pin = r < 0.4 ? "tucked" : r < 0.6 ? "back" : r < 0.8 ? "middle" : "open";
  if (template) shapeTemplate(template, plan, rand);
  return plan;
}

// How much further off a template green its water is kept (metres).
export const GREEN_WATER_CLEAR = 8;
// The templates whose greens' own slopes run off them: no water added by
// them (planHole).
const SLOPED_GREENS = ["redan", "eden", "biarritz"];

// A template's own green, bunkers and pin, over its kind's plan.
//   greenStyle  its green's slopes (course.mjs greenContours style): level,
//               at least this wild
//   pinAt       where on the green its pin goes ([along, across], as
//               PIN_ZONES), when a zone won't do
function shapeTemplate(name, plan, rand) {
  const f = plan.favoured;
  const Y = YARD;
  const { L, D } = plan;
  const g = plan.green;
  const sand = plan.greenSand;
  const guard = (phi, along, across, gap = between(rand, 3.5, 5)) => ({ phi, along, across, gap });
  const bunker = (s, side, inset, along, across, extra = {}) => plan.hazards.push({ type: "bunker", s, side, inset, along, across, turn: 0, ...extra });
  const take = (list) => list.slice(0, sand);
  switch (name) {
    case "redan":
      // Turned 35 - 45 degrees, long and narrow, falling away from its
      // front corner on the open side to its back on the guarded one.
      g.turn = -f * between(rand, 0.62, 0.8);
      g.aspect = between(rand, 2, 2.4);
      g.area *= 1.15;
      plan.greenStyle = { away: true, tilt: [0.02, 0.028], cross: 0.2, tiers: [], level: "moderate" };
      plan.guards = take([guard(-f * Math.PI * 0.6, between(rand, 11, 14), between(rand, 4.5, 5.5), between(rand, 2.5, 3.5)), guard(-f * Math.PI * 0.28, 8, 3.5), guard(f * Math.PI * 0.88, 7, 3.5, between(rand, 9, 13))]);
      plan.pin = rand() < 0.6 ? "tucked" : "back";
      break;
    case "eden":
      // Square on, tilting hard to the front; the Strath bunker small and
      // deep in front, the Hill bunker to one side, trouble behind.
      g.turn = (rand() - 0.5) * 0.3;
      g.aspect = 1.25;
      plan.greenStyle = { tilt: [0.024, 0.03], cross: 0.25, level: "moderate" };
      plan.guards = sand ? [guard(Math.PI - f * 0.12, 4, 3, 2.5), guard(-f * Math.PI * 0.7, 9, 4.2), guard(f * 0.2, 10, 3.5, 4)].slice(0, sand + 1) : [];
      plan.pin = rand() < 0.5 ? "back" : "tucked";
      break;
    case "biarritz":
      // Long - 50 to 65 yards - with a swale a metre deep across its middle.
      g.turn = 0;
      g.aspect = between(rand, 2.5, 2.8);
      g.area *= 1.3;
      {
        const dip = between(rand, 0.75, 0.95);
        plan.greenStyle = { tilt: [0.008, 0.012], tiers: [[0, -0.15, -dip, 8], [0, 0.15, dip, 8]], level: "severe" };
      }
      plan.guards = take([guard(Math.PI / 2, between(rand, 14, 18), between(rand, 3.5, 4.2)), guard(-Math.PI / 2, between(rand, 14, 18), between(rand, 3.5, 4.2)), guard(f * Math.PI * 0.85, 7, 3.5)]);
      plan.pinAt = rand() < 0.5 ? [0.62, 0] : [-0.6, 0.1];
      break;
    case "short":
      g.area *= 0.8;
      g.aspect = 1.15;
      plan.greenStyle = { level: "moderate" };
      plan.guards = (sand >= 2 ? [0.68, -0.68, 0.3, -0.3, 0] : [0.7, -0.7, 0]).slice(0, sand ? 5 : 0).map((k) => guard(Math.PI * k, between(rand, 6, 9), between(rand, 3, 4), between(rand, 3, 4)));
      break;
    case "road":
      // A shallow green lying across the line, longest from the better
      // side; the Road bunker cutting into its front, more trouble behind.
      g.turn = -f * between(rand, 1, 1.25);
      g.aspect = between(rand, 2.1, 2.5);
      plan.greenStyle = { level: "moderate" };
      plan.guards = take([guard(-f * Math.PI * 0.62, 5.5, 3.5, 1.5), guard(f * Math.PI * 0.35, 12, 3, 4), guard(-f * Math.PI * 0.9, 7, 3.5)]);
      plan.pin = "tucked";
      break;
    case "narrows":
      // A bunker in the middle of the fairway short of the green, the
      // fairway pinched round it.
      g.turn = -f * between(rand, 0.1, 0.25);
      if (plan.fwSand) bunker(L - between(rand, 35, 55) * Y, 0, 0, between(rand, 6, 8), between(rand, 4.5, 6), { centre: (rand() - 0.5) * 3 });
      plan.shape = [...(plan.shape ?? []).filter(([s]) => s < L - 85 * Y), [L - 75 * Y, 1], [L - 45 * Y, 0.65], [L - 25 * Y, 0.9]];
      break;
    case "bottle":
      // Its bunkers on a diagonal across the middle: short on the plain
      // side, long on the better one.
      plan.hazards = plan.hazards.filter((h) => h.approach);
      for (let i = 0; i < Math.max(2, plan.fwSand + 1); i++) {
        const t = i / Math.max(1, plan.fwSand);
        bunker(D.bogey - 5 * Y + t * (D.scratch + 15 * Y - D.bogey), 0, 0, between(rand, 6, 8), between(rand, 4, 5), { share: -f * 0.55 + t * f });
      }
      plan.shape = [[D.bogey - 40 * Y, 1], [D.bogey - 10 * Y, 1.35], [D.scratch + 25 * Y, 1.35], [D.scratch + 55 * Y, 1]];
      break;
    case "principal":
      // The nose: three bunkers together in the middle where long drives
      // finish.
      plan.hazards = plan.hazards.filter((h) => !(h.side === 0 && !h.full));
      if (plan.fwSand) {
        const s0 = D.scratch - between(rand, 10, 20) * Y;
        bunker(s0, 0, 0, 5, 4, { centre: -5 * f });
        bunker(s0 + 7, 0, 0, 5, 4, { centre: 0 });
        bunker(s0 + 2, 0, 0, 5, 4, { centre: 5 * f });
      }
      break;
    case "drivable":
      // A narrow green on the diagonal, sand on the go line; a wide lay-up.
      g.turn = -f * between(rand, 0.6, 0.8);
      g.aspect = between(rand, 2.2, 2.5);
      g.area *= 0.85;
      plan.guards = take([guard(-f * Math.PI * 0.6, between(rand, 9, 12), 4.5, 2.5), guard(f * Math.PI * 0.35, 8, 3.5), guard(-f * Math.PI * 0.3, 7, 3.5)]);
      plan.shape = [[L - 140 * Y, 1.1], [L - 110 * Y, 1.35], [L - 65 * Y, 1.3], [L - 40 * Y, 0.9]];
      plan.pin = "tucked";
      break;
    case "long":
      // Hell's Half Acre: the cross bunker bigger and a little closer in,
      // and a wide landing for the drive.
      for (const h of plan.hazards) if (h.full) Object.assign(h, { s: L - between(rand, 95, 110) * Y, along: between(rand, 8, 10) });
      plan.shape = [[D.bogey - 30 * Y, 1.05], [D.mid, 1.3], [D.scratch + 25 * Y, 1.3], [D.scratch + 55 * Y, 1], ...(plan.shape ?? []).filter(([s]) => s > L - 140 * Y)];
      break;
    case "plateau":
      // A big green of three levels: raised at the back and on the better
      // side; a bunker in the fairway's middle short of it.
      g.area *= 1.25;
      g.aspect = 1.4;
      g.turn = -f * 0.2;
      plan.greenStyle = { tiers: [[0, 0.2, between(rand, 0.45, 0.6), 7], [(f * Math.PI) / 2, 0.25, between(rand, 0.4, 0.55), 6]], level: "moderate" };
      if (plan.fwSand) bunker(L - between(rand, 65, 75) * Y, 0, 0, between(rand, 5, 7), between(rand, 4, 5), { centre: (rand() - 0.5) * 4 });
      plan.pinAt = rand() < 0.5 ? [0.6, -0.35] : [-0.45, -0.4];
      break;
    default:
      break;
  }
}

// Where a pin goes on a green for its plan: { u, v } along the green's
// axis (+ to its back) and across it (+ to its right), shares of its size.
const PIN_ZONES = { tucked: [0.05, -0.55], back: [0.55, -0.2], middle: [0.05, 0], open: [-0.35, 0.3] };
// How far a pin's kept from the green's edge (metres).
const PIN_EDGE = 4.5;

// The pin on `green` for `plan`.
export function pinFor(green, plan, rand) {
  const [u0, v0] = plan.pinAt ?? PIN_ZONES[plan.pin] ?? PIN_ZONES.middle;
  const u = (u0 + (rand() - 0.5) * 0.2) * green.rx;
  const v = (v0 * plan.favoured + (rand() - 0.5) * 0.15) * green.rz;
  const phi = Math.atan2(v, u);
  const most = Math.max(0, blobRadius(green, phi) - PIN_EDGE);
  const r = Math.min(Math.hypot(u, v), most);
  const a = green.rot + phi;
  return [round2(green.x + Math.cos(a) * r), round2(green.z + Math.sin(a) * r)];
}

// A strategic hole's layout from its spec: the same shape of layout as a
// classic hole's (course.mjs buildHole), planned (planHole), with
// layout.plan saying what kind of hole it is and which side is the better.
export function strategicHole(spec) {
  const o = { ...DEFAULT_OPTIONS, ...spec.options };
  const rand = seeded((spec.seed ^ 0xa4c1) >>> 0 || 1);
  const plan = planHole(spec, o, rand);
  const L = spec.yards * YARD;
  const f = plan.favoured;

  // The line: straight, or turning at the plan's bends.
  const raw = [[0, 0]];
  let heading = plan.heading;
  let x = 0;
  let z = 0;
  let s = 0;
  for (const b of [...plan.bends, { at: L, turn: 0 }]) {
    const len = b.at - s;
    x += Math.cos(heading) * len;
    z += Math.sin(heading) * len;
    raw.push([x, z]);
    heading += b.turn;
    s = b.at;
  }
  let path = makePath(smooth(raw));
  const k = L / path.length;
  path = makePath(path.points.map(([px, pz]) => [px * k, pz * k]));

  // The green, turned to open from the better side.
  const end = pointAt(path, path.length);
  const approach = Math.atan2(end.dir[1], end.dir[0]);
  const { area, aspect, turn } = plan.green;
  const rx = Math.sqrt((area / Math.PI) * aspect);
  const rz = Math.sqrt(area / Math.PI / aspect);
  const green = blobShape(rand, end.p[0], end.p[1], approach + turn, rx, rz);
  const pin = pinFor(green, plan, rand);
  const style = plan.greenStyle ?? null;
  const level = LEVELS.indexOf(style?.level) > LEVELS.indexOf(o.contours) ? style.level : o.contours;
  const contours = greenContours(rand, green, pin, level, { style });
  const front = blobRadius(green, Math.PI - turn);

  // The fairway, wider where the plan says.
  const half = (FAIRWAY_WIDTH[o.fairway] * YARD * WIDER) / 2;
  const fairway =
    plan.par === 3
      ? { from: Math.max(0, L - front - 25 * YARD), to: L - front * 0.8, half: half * 0.7, phase: rand() * 6, natural: true }
      : { from: Math.min(90 * YARD, L * 0.22), to: L - front * 0.8, half, phase: rand() * 6, natural: true, shape: plan.shape };
  const widest = half * Math.max(1, ...(plan.shape ?? []).map(([, w]) => w));
  const treeLine = widest + (22 + rand() * 12) * YARD * (o.trees === "heavy" ? 0.8 : o.trees === "light" || LINKS_TREES[o.trees] ? 1.25 : 1);

  const hole = {
    number: spec.number,
    par: spec.par,
    yards: spec.yards,
    si: spec.si,
    length: L,
    path: path.points,
    tee: { x: 0, z: 0, heading: Math.atan2(path.points[1][1], path.points[1][0]) },
    fairway,
    treeLine,
    green,
    pin,
    contours,
    bunkers: [],
    water: [],
    trees: [],
    plan: { kind: plan.kind, favoured: f, ...(plan.template ? { template: plan.template } : {}) },
  };
  // A template green's slopes, kept so the green keeps them on hills
  // (sim/imaginary.mjs withHills).
  if (style) hole.greenStyle = { ...style, level };
  const links = !!LINKS_TREES[o.trees];
  if (links) hole.links = LINKS_TREES[o.trees];

  // A point s along the line, d across it (+ right), and the line's way there.
  const at = (s, d) => {
    const p = pointAt(path, Math.max(0, Math.min(path.length, s)));
    return { x: p.p[0] - p.dir[1] * d, z: p.p[1] + p.dir[0] * d, dir: Math.atan2(p.dir[1], p.dir[0]) };
  };
  // A hazard's middle: its inner edge `inset` into the fairway's edge.
  const place = (h) => {
    if (h.side === 0) return at(h.s, h.share != null ? h.share * (fairwayHalfWidth(fairway, h.s) || half) : (h.centre ?? 0));
    const edge = fairwayHalfWidth(fairway, h.s, h.side) || half;
    return at(h.s, h.side * (edge - h.inset + h.across));
  };
  const onGreen = (b) => insideBlob(green, b.x, b.z, 2);

  // Water first, so the sand keeps out of it.
  for (const h of plan.hazards.filter((q) => q.type === "water")) {
    const p = place(h);
    hole.water.push(blobShape(rand, p.x, p.z, p.dir + h.turn, h.along, h.across));
  }
  const gw = plan.greenWater;
  // A template's green has slopes of its own running off it (a Redan's
  // falling away, a Biarritz's swale): its water kept further off, clear
  // of them, so the pond's edge meets its water.
  const clear = style ? GREEN_WATER_CLEAR : 0;
  if (gw?.front) {
    const p = at(L - front - gw.deep - between(rand, 4, 9) - clear, gw.shift);
    hole.water.push(blobShape(rand, p.x, p.z, approach + Math.PI / 2, gw.across, gw.deep));
  } else if (gw?.side) {
    const a = approach + (gw.side * Math.PI) / 2;
    const r = blobRadius(green, gw.side * (Math.PI / 2) - turn) + gw.across + between(rand, 4, 7) + clear;
    hole.water.push(blobShape(rand, green.x + Math.cos(a) * r - Math.cos(approach) * 8, green.z + Math.sin(a) * r - Math.sin(approach) * 8, approach, gw.along, gw.across));
  }
  hole.water = wildWater(hole).water;
  const wet = (b) => hole.water.some((w) => insideBlob(w, b.x, b.z, 3));

  // The drive zone's bunkers. (One right across the fairway is a row of
  // them, laid once the rest are shaped: rows, below. Till then it stands
  // as the one long bunker it always was, marked, so the rest of the hole -
  // the bunkers round its green, their styles, a links hole's pots - comes
  // out just as it did.)
  const rows = [];
  for (const h of plan.hazards.filter((q) => q.type === "bunker")) {
    if (h.s < 40 || h.s > L - 20) continue;
    if (h.full) {
      const p = at(h.s, 0);
      const across = (fairwayHalfWidth(fairway, h.s) || half) * 0.95;
      const b = blobShape(rand, p.x, p.z, p.dir + Math.PI / 2, across, h.along);
      if (!wet(b)) {
        hole.bunkers.push({ ...b, fullRow: 1 });
        rows.push(h);
      }
      continue;
    }
    const p = place(h);
    const b = blobShape(rand, p.x, p.z, p.dir + h.turn, h.along, h.across);
    if (!wet(b) && !onGreen(b)) hole.bunkers.push(b);
  }
  // Round the green.
  for (const q of plan.guards) {
    const r = blobRadius(green, q.phi) + q.gap + q.across;
    const a = green.rot + q.phi;
    const b = blobShape(rand, green.x + Math.cos(a) * r, green.z + Math.sin(a) * r, a + Math.PI / 2, q.along, q.across);
    if (!wet(b)) hole.bunkers.push(b);
  }

  // Shaped in the course's style (course.mjs BUNKER_STYLES): kidneys,
  // rugged fingers or big sweeping ones, a small one now and then beside a
  // greenside bunker - none moved or added in the drive zone.
  if (!links) styleBunkers(hole, spec, holeBunkerStyle(o), { path, greenShape: green, halfWidthBase: half, clusters: false });
  // A links hole's bunkers are pots: each drive-zone one a pair of them.
  if (links) {
    const pots = [];
    const potRand = seeded((spec.seed ^ 0x9077) >>> 0 || 1);
    const g = green;
    for (const b of hole.bunkers) {
      const greenside = Math.hypot(b.x - g.x, b.z - g.z) < Math.max(g.rx, g.rz) + 15;
      if (greenside) pots.push(potBunker(hole, b, potRand));
      else {
        const c = Math.cos(b.rot);
        const sn = Math.sin(b.rot);
        const reach = Math.min(b.rx * 0.6, 6);
        pots.push(potBunker(hole, { ...b, x: b.x - c * reach, z: b.z - sn * reach }, potRand), potBunker(hole, { ...b, x: b.x + c * reach, z: b.z + sn * reach }, potRand));
      }
    }
    hole.bunkers = pots.filter((b) => !wet(b) && !onGreen(b));
    // And now and then a burn winding across (course.mjs burnFor) - not
    // where the plan has water already.
    if (!hole.water.length) burnFor(hole, spec, { path, halfWidthBase: half, greenShape: green });
    // And now and then a waste area out in its rough (sim/wastearea.mjs).
    linksWaste(hole, spec, { path, halfWidthBase: widest, greenShape: green });
  } else if (holeBunkerStyle(o) === "rugged") {
    // A heathland hole's waste areas (wasteAreas), brought in beside the
    // fairway (withinTrees).
    wasteAreas(hole, spec, { path, halfWidthBase: widest, greenShape: green });
    hole.bunkers = hole.bunkers.map((b) => (b.waste ? withinTrees(b, path, widest, treeLine) : b));
  }
  // Cross bunkers (sim/crossbunkers.mjs): the one right across the lay-up
  // a row of them, carried or laid up short of; and on a heathland or links
  // hole that asks the drive a question down one side, now and then a row
  // where the long hitters' drives finish, its gap at the better side's
  // end. Each from a randomness of its own.
  const bunkerStyle = holeBunkerStyle(o);
  hole.bunkers = hole.bunkers.filter((b) => !b.fullRow);
  rows.forEach((h, i) => {
    const great = plan.template === "long";
    crossRow(hole, { s: h.s, path, style: bunkerStyle, rand: seeded((spec.seed ^ (0xc205 + i)) >>> 0 || 1), half, great });
  });
  if (!rows.length && (plan.kind === "flank" || plan.kind === "go") && !plan.hazards.some((q) => q.type === "water")) teeRow(hole, spec, { style: bunkerStyle, path, favoured: f, half });

  // Wraps round the green, its greenside bunkers' sizes, flashed faces and
  // wetland edges (sim/hazardshapes.mjs) - the drive zone's bunkers and the
  // water where the plan put them.
  if (!links) shapeHazards(hole, spec, { style: bunkerStyle, path, greenShape: green, approach, halfWidthBase: half, fairway: false, lakes: false });

  return dressHole(hole, spec, { rand, path, approach, links });
}

// A waste area brought in beside the fairway (widest, its half-width at
// its widest), as heathland's runs right up to it (Pine Valley's): its
// inner edge a metre off the fairway's edge, no more than WASTE_DEEP deep
// and short of the tree line - kept off the ground between holes, where a
// neighbour's cart path runs. Where it lies along the hole kept.
const WASTE_DEEP = 12;
function withinTrees(area, path, widest, treeLine) {
  const n = nearest(path, area.x, area.z);
  const side = n.d < 0 ? -1 : 1;
  const rz = Math.max(4, Math.min(area.rz, WASTE_DEEP / 2, (treeLine - widest - 1) / 2));
  const off = widest + 1 + rz;
  const at = pointAt(path, n.s);
  return { ...area, rz: round2(rz), x: round2(at.p[0] - at.dir[1] * side * off), z: round2(at.p[1] + at.dir[0] * side * off) };
}

function round2(v) {
  return Math.round(v * 100) / 100;
}
