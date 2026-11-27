// The land shaped for a strategic hole on made-up hills
// (docs/COURSE-DESIGN-PLAN.md, phase 5): the hills aren't only eased flat
// round its green and tee, but built up or dug out the way the great
// courses' are -
//
//   a plateau green   raised a metre or two above the ground round it, its
//                     banks falling away (Seth Raynor's Short, a Double
//                     Plateau, Royal Dornoch's), the greenside bunkers dug
//                     into the banks; a shot that comes up short or runs
//                     off rolls down
//   a punchbowl       the green down in a hollow, the ground rising round
//                     it, so shots feed in
//   an elevated tee   the tee on a mound, looking down the hole - most
//                     often on a par 3
//   a shelf           where the drives land on a hole climbing the hill, a
//                     level step in the slope (as Perry Maxwell stepped his
//                     uphill fairways), so the next shot isn't from a slope
//   the Alps          on one hole of a course, a ridge across the fairway
//                     short of the green, hiding it from the second shot
//                     (Prestwick's 17th) - built where the land already
//                     rises most there (alpsFor)
//
// landformFor picks them for a hole (from its plan: a Short's green always
// raised, a Biarritz's never, the rest now and then), and landformFlats
// makes them into the shapes hillField (sim/imaginary.mjs) lays on the
// ground. They're kept on the hole on hills (layout.landform), placed from
// the hole's own green, tee and line, so the ground made again for a hole
// moved on the course map (courseField) is shaped the same. Pure.

import { YARD } from "./flight.mjs";
import { GOLFERS } from "./golfers.mjs";
import { makePath, pointAt, blobRadius, insideBlob } from "./course.mjs";
import { landingS, SIGHT } from "./sight.mjs";

// The shapes' sizes (metres): how high, how far round the green or tee
// the top reaches past its edge, and how wide the bank down from it.
export const LANDFORMS = {
  plateau: { lift: [0.8, 1.6], top: 5, bank: [9, 13] },
  bowl: { lift: [1, 1.6], top: 3, bank: [12, 16] },
  // (Banks no steeper than about 1 in 2.5 at their steepest, as a tee's
  // can be mown.)
  tee: { lift: [1, 2], par3: [1.5, 3], top: 9, bank: 12 },
  // A shelf where the drives land on a hole climbing at least `climb`
  // metres to there.
  shelf: { r: 22, climb: 4 },
  // The Alps' ridge: `before` metres short of the pin, `half` metres each
  // side of the line, as high as hides the flag from the second shot
  // (within lift), on 2 courses in 3 that have a hole for it.
  alps: { lift: [2.5, 4.5], top: 4, bank: 14, half: 28, before: 60, share: 2 / 3 },
};
// How wide a shape's bank is for its height (metres): no steeper than
// about 1 in 2.5 at its steepest (a smooth bank's steepest is 1.5 times
// its rise over its width).
const bankFor = (lift, least) => Math.max(least, Math.abs(lift) * 3.75);
// Each template's green: raised (and how much), or left as the ground
// has it.
const TEMPLATE_GREENS = { short: [1.4, 2.2], plateau: [1.1, 1.6], road: [0.7, 1.2], redan: [0.9, 1.5], eden: [0.6, 1] };
const LEVEL_GREENS = new Set(["biarritz", "long3", "carry"]);
// How much the shapes are for each size of hills: smaller on gentle ground.
const SCALE = { gentle: 0.7, rolling: 1, hilly: 1.15, mountain: 1.3 };

const between = (rand, [a, b]) => a + rand() * (b - a);
const r2 = (v) => Math.round(v * 100) / 100;

// The landform for a strategic hole (layout.plan), or null for a classic
// hole: { green: { lift, top, bank } (lift below 0 a punchbowl) or none,
// tee: { lift, top, bank } or none, shelf: { s } or none }. rand: its own
// randomness; hills: the ground's size; rise(s): how much higher the
// ground is s metres down the hole than at the tee (the hills before
// they're shaped), for the shelf.
export function landformFor(layout, rand, { hills = "rolling", rise = null } = {}) {
  const plan = layout?.plan;
  if (!plan || !SCALE[hills]) return null;
  const k = SCALE[hills];
  const out = {};
  const g = layout.green;
  const greenR = Math.max(g.rx ?? 12, g.rz ?? 10);
  // Water close round the green: no punchbowl (its banks would rise over
  // the pond's).
  const wet = (layout.water ?? []).some((w) => insideBlob(w, g.x, g.z, greenR + 25));
  const roll = rand();
  const bank = between(rand, LANDFORMS.plateau.bank);
  const template = TEMPLATE_GREENS[plan.template];
  const green = (lift, top, least) => ({ lift: r2(lift), top: r2(top), bank: r2(bankFor(lift, least)) });
  if (template) out.green = green(between(rand, template) * k, greenR + LANDFORMS.plateau.top, bank);
  else if (LEVEL_GREENS.has(plan.template) || LEVEL_GREENS.has(plan.kind)) rand();
  else if (roll < 0.35) out.green = green(between(rand, LANDFORMS.plateau.lift) * k, greenR + LANDFORMS.plateau.top, bank);
  else if (roll < 0.5 && !wet) out.green = green(-between(rand, LANDFORMS.bowl.lift) * k, greenR + LANDFORMS.bowl.top, between(rand, LANDFORMS.bowl.bank));
  else rand();
  // The tee up on a mound: most par 3s, now and then a longer hole.
  const teeRoll = rand();
  const teeLift = between(rand, layout.par === 3 ? LANDFORMS.tee.par3 : LANDFORMS.tee.lift);
  if (teeRoll < (layout.par === 3 ? 0.6 : 0.25)) out.tee = { lift: r2(teeLift * k), top: LANDFORMS.tee.top, bank: r2(bankFor(teeLift * k, LANDFORMS.tee.bank)) };
  // A shelf where the 10 handicap's drive lands, if the hole climbs there.
  if (layout.par > 3 && rise) {
    const path = makePath(layout.path);
    const s = Math.min(GOLFERS.mid.drive * YARD, path.length - 110 * YARD);
    if (s > 120 && rise(s) >= LANDFORMS.shelf.climb) out.shelf = { s: r2(s) };
  }
  return Object.keys(out).length ? out : null;
}

// A hole's landform as shapes for hillField: [{ x, z, r, lift, top, bank }
// - a plateau (lift above 0) or hollow (below) on its green, a mound on its
// tee - and { x, z, r } a shelf, eased flat as a green's ground is].
// toWorld: a point of the hole (its own frame) on the hills' ground.
// toWorld: a point of the hole (its own frame) on the hills' ground. Each
// is placed where it was (`at`, kept when the hole's built on its hills -
// its rebuilt green's middle and line aren't quite the ones it was made
// from), else from the hole's green and line.
export function landformFlats(layout, landform, toWorld) {
  if (!landform) return [];
  const out = [];
  if (landform.green && layout.green) {
    const [x, z] = toWorld(landform.green.at ?? [layout.green.x, layout.green.z]);
    out.push({ x, z, r: 0, lift: landform.green.lift, top: landform.green.top, bank: landform.green.bank });
  }
  if (landform.tee) {
    const [x, z] = toWorld([0, 0]);
    out.push({ x, z, r: 0, lift: landform.tee.lift, top: landform.tee.top, bank: landform.tee.bank });
  }
  if (landform.shelf && (landform.shelf.at || layout.path?.length > 1)) {
    const [x, z] = toWorld(landform.shelf.at ?? pointAt(makePath(layout.path), landform.shelf.s).p);
    out.push({ x, z, r: LANDFORMS.shelf.r });
  }
  if (landform.ridge) {
    const [a, b] = landform.ridge.ends ?? ridgeEnds(layout, landform.ridge);
    const [x, z] = toWorld(a);
    const [x2, z2] = toWorld(b);
    out.push({ x, z, x2, z2, r: 0, lift: landform.ridge.lift, top: landform.ridge.top, bank: landform.ridge.bank });
  }
  return out;
}

// The ends of an Alps ridge (its own frame): `half` metres each side of the
// hole's line at s, square across it.
export function ridgeEnds(layout, ridge) {
  const { p, dir } = pointAt(makePath(layout.path), ridge.s);
  const n = [-dir[1], dir[0]];
  return [-1, 1].map((k) => [p[0] + n[0] * ridge.half * k, p[1] + n[1] * ridge.half * k]);
}

// The Alps for a course on hills: { i, ridge: { s, lift, top, bank, half }
// } - on the strategic par 4 or 5 (no template of its own, no water by its
// green, not the 1st) whose second shot needs the least ridge to hide the
// flag, if any
// needs no more than the most (LANDFORMS.alps); or null. layouts: the
// holes'; toWorld(i, p): a point of hole i on the ground; height(x, z):
// the ground as it's shaped so far; rand: the course's own randomness.
export function alpsFor(layouts, toWorld, height, { hills = "rolling", rand = Math.random } = {}) {
  const k = SCALE[hills];
  if (!k || rand() >= LANDFORMS.alps.share) return null;
  const A = LANDFORMS.alps;
  let best = null;
  for (const [i, L] of layouts.entries()) {
    // (Never the 1st: a gentle start.)
    if (i === 0 || !L?.plan || L.par === 3 || L.plan.template || !(L.path?.length > 1) || !L.pin) continue;
    const g = L.green;
    if ((L.water ?? []).some((w) => insideBlob(w, g.x, g.z, Math.max(g.rx ?? 12, g.rz ?? 10) + 25))) continue;
    const path = makePath(L.path);
    const s = path.length - A.before;
    const from = landingS(path.length);
    if (s - from < 35) continue;
    // How high the line from the second shot's eye to the top of the flag
    // passes over the crest.
    const eye = toWorld(i, pointAt(path, from).p);
    const flag = toWorld(i, L.pin);
    const h0 = height(...eye) + SIGHT.eye;
    const h1 = height(...flag) + SIGHT.flag;
    const d = Math.hypot(flag[0] - eye[0], flag[1] - eye[1]);
    let need = -Infinity;
    for (const ds of [-A.top, 0, A.top]) {
      const c = toWorld(i, pointAt(path, s + ds).p);
      const t = Math.hypot(c[0] - eye[0], c[1] - eye[1]) / d;
      need = Math.max(need, h0 + (h1 - h0) * t - height(...c));
    }
    const lift = Math.max(A.lift[0] * k, need + 0.4);
    if (lift > A.lift[1] * k) continue;
    if (!best || lift < best.ridge.lift) best = { i, ridge: { s: r2(s), lift: r2(lift), top: A.top, bank: r2(bankFor(lift, A.bank)), half: A.half } };
  }
  return best;
}

// How much of a shape's lift reaches d metres from its middle: all of it on
// its top, easing down its bank to none past it.
// (A ridge's distance is from the line between its ends.)
export function landProfile(f, d) {
  if (d <= f.top) return 1;
  if (d >= f.top + f.bank) return 0;
  const t = (d - f.top) / f.bank;
  return 1 - t * t * (3 - 2 * t);
}

// How far a green's edge is from its middle at most (for the tests).
export const greenReach = (g) => Math.max(...Array.from({ length: 24 }, (_, i) => blobRadius(g, (i / 24) * Math.PI * 2)));
