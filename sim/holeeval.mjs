// What a hole asks of a golfer (docs/COURSE-DESIGN-PLAN.md, phase 0): the
// hole played in the head, the way a sensible golfer plays it - from
// wherever the ball is, every reasonable target (the pin, either side of
// it, the middle of the green, down the fairway at several lengths and
// either side), each tried with the same few dozen swings
// (sim/golfers.mjs), and the one that leaves the fewest strokes taken.
// What's left from where a ball finishes is worked out the same way, until
// it's round the green, where the strokes-gained table's own short game
// and putting take over (sim/strokesgained.mjs expected, for the golfer's
// handicap).
//
// So a bunker a golfer can't reach costs them nothing, and one on the line
// they'd take costs them strokes or sends them round it; a green turned
// across one side of the fairway makes that side the better one to drive
// to. The course maker uses it to check its holes ask something
// (sim/architect.mjs); it's fast (a lie grid over the hole, every place
// worked out once), not exact: the ball finishes where it's aimed give or
// take the golfer's spread, with no wind, no slopes and no trees in the
// air. Pure.

import { YARD } from "./flight.mjs";
import { surfaceAt, makePath, pointAt, nearest, fairwayHalfWidth, insideBlob, seeded } from "./course.mjs";
import { insidePolygon } from "./terrain.mjs";
import { withEdits } from "./holeedits.mjs";
import { expected, levelFactor } from "./strokesgained.mjs";
import { GOLFERS, reachFrom, shotSet, spreadFor } from "./golfers.mjs";

// From this close in (yards) a golfer's short game takes over: the table's
// strokes from here, by lie.
export const SHORT_GAME = 40;
// How many shots ahead it looks at most (a long par 5 for a short hitter).
const DEPTH = 6;
// Short-sided: a pitch or chip that has to go over sand or water to the
// pin plays harder than the table's same distance in the open (strokes, a
// scratch golfer's - more for a higher handicap, as the table's are).
export const OVER = { sand: 0.1, water: 0.25 };
// The lie grid: a cell this size (metres) over the hole, finer round the green.
const CELL = 2.5;
const FINE = 1;
// The grid of what's already worked out (metres).
const MEMO = 3;
// How many swings each target is tried with.
const SWINGS = 24;

const CODES = ["rough", "semi", "fairway", "deep", "trees", "tee", "fringe", "green", "bunker", "greenside", "water", "path", "waste"];
const CODE = Object.fromEntries(CODES.map((l, i) => [l, i]));

// The hole's lies on a grid, so a shot's finish is looked up rather than
// tested against every shape: a coarse grid over the whole hole and a fine
// one round the green. far: the lie beyond the grid.
export function lieGrid(layout, { cell = CELL, fine = FINE } = {}) {
  const L = withEdits(layout);
  const path = makePath(L.path);
  const mapped = L.source === "map";
  const margin = (mapped ? 60 : (L.treeLine ?? 45) + 20);
  let x0 = Infinity;
  let x1 = -Infinity;
  let z0 = Infinity;
  let z1 = -Infinity;
  for (const [x, z] of L.path) {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    z0 = Math.min(z0, z);
    z1 = Math.max(z1, z);
  }
  x0 -= margin;
  x1 += margin;
  z0 -= margin;
  z1 += margin;
  const grid = (gx0, gz0, gx1, gz1, c) => {
    const nx = Math.ceil((gx1 - gx0) / c);
    const nz = Math.ceil((gz1 - gz0) / c);
    const lie = new Uint8Array(nx * nz);
    for (let iz = 0; iz < nz; iz++) {
      for (let ix = 0; ix < nx; ix++) lie[iz * nx + ix] = CODE[surfaceAt(L, gx0 + (ix + 0.5) * c, gz0 + (iz + 0.5) * c, path)] ?? 0;
    }
    return { x0: gx0, z0: gz0, nx, nz, c, lie };
  };
  const coarse = grid(x0, z0, x1, z1, cell);
  const g = greenMiddle(L);
  const R = greenRadius(L) + 22;
  const near = grid(g[0] - R, g[1] - R, g[0] + R, g[1] + R, fine);
  const far = mapped ? CODE.deep : CODE.trees;
  const look = (q, x, z) => {
    const ix = Math.floor((x - q.x0) / q.c);
    const iz = Math.floor((z - q.z0) / q.c);
    return ix < 0 || iz < 0 || ix >= q.nx || iz >= q.nz ? -1 : q.lie[iz * q.nx + ix];
  };
  return {
    layout: L,
    path,
    coarse,
    near,
    at(x, z) {
      let c = look(near, x, z);
      if (c < 0) c = look(coarse, x, z);
      return CODES[c < 0 ? far : c];
    },
  };
}

// The middle of a hole's green and roughly how far its edge is from there.
function greenMiddle(L) {
  const g = L.green;
  if (g?.poly) {
    let x = 0;
    let z = 0;
    for (const p of g.poly) {
      x += p[0];
      z += p[1];
    }
    return [x / g.poly.length, z / g.poly.length];
  }
  return [g.x, g.z];
}
function greenRadius(L) {
  const g = L.green;
  if (g?.poly) {
    const [cx, cz] = greenMiddle(L);
    return Math.max(...g.poly.map(([x, z]) => Math.hypot(x - cx, z - cz)));
  }
  return Math.max(g.rx, g.rz);
}

// A hole as `golfer` (GOLFERS, or its key) plays it: { expected, target,
// lines } - the strokes they take on average from the tee, where they aim
// the tee shot, and every tee target tried with what it leaves ({ at,
// value }, best first). grid: the hole's lieGrid (made if not given).
export function evaluateHole(layout, golfer = "mid", { grid = lieGrid(layout), from = null } = {}) {
  const g = typeof golfer === "string" ? GOLFERS[golfer] : golfer;
  const play = player(grid, g);
  const tee = from ?? [0, 0];
  const lines = play.choices(tee[0], tee[1], "tee", 0);
  return { expected: lines.length ? 1 + lines[0].value : play.value(tee[0], tee[1], "tee", 0), target: lines[0]?.at ?? null, lines, play };
}

// The strokes a golfer takes from a spot (in the head): the memory of what's
// worked out shared by every question asked of the same hole and golfer.
function player(grid, golfer) {
  const L = grid.layout;
  const { path } = grid;
  const pin = L.pin;
  const level = golfer.handicap;
  const swings = shotSet(SWINGS);
  const memo = new Map();
  const aims = new Map();
  const pinS = nearest(path, pin[0], pin[1]).s;
  const gMid = greenMiddle(L);

  const yardsToPin = (x, z) => Math.hypot(pin[0] - x, pin[1] - z) / YARD;

  const factor = levelFactor(level);
  // What lies between a spot round the green and the pin: 0 open ground,
  // 1 sand, 2 water (worked out once per metre of ground).
  const between = new Map();
  function overHazard(x, z) {
    const kx = Math.floor(x);
    const kz = Math.floor(z);
    const key = kx * 100003 + kz;
    let v = between.get(key);
    if (v !== undefined) return v;
    v = 0;
    const dx = pin[0] - (kx + 0.5);
    const dz = pin[1] - (kz + 0.5);
    const len = Math.hypot(dx, dz);
    for (let t = 2; t < len - 1; t += 1.5) {
      const l = grid.at(kx + 0.5 + (dx / len) * t, kz + 0.5 + (dz / len) * t);
      if (l === "water") {
        v = 2;
        break;
      }
      if (l === "bunker" || l === "greenside") v = 1;
    }
    between.set(key, v);
    return v;
  }
  // Round the green: the table's short game, and more if short-sided.
  function shortGame(x, z, lie, d) {
    const e = expected(lie, d, level);
    if (lie === "green" || lie === "bunker" || lie === "greenside" || lie === "water") return e;
    const over = overHazard(x, z);
    return e + (over === 2 ? OVER.water : over === 1 ? OVER.sand : 0) * factor;
  }

  // Strokes from a spot to holing out (not counting a stroke to get there).
  function value(x, z, lie, depth) {
    const d = yardsToPin(x, z);
    if (lie === "green") return expected("green", d, level);
    if (d <= SHORT_GAME) return shortGame(x, z, lie, d);
    if (depth >= DEPTH) return expected(lie, d, level);
    const kx = Math.floor(x / MEMO);
    const kz = Math.floor(z / MEMO);
    const key = (kx * 100003 + kz) * 16 + CODE[lie];
    const known = memo.get(key);
    if (known !== undefined) return known;
    // (While it's being worked out, the table's guess stands in, so a shot
    // that comes back here doesn't go round for ever.)
    memo.set(key, expected(lie, d, level));
    const cx = (kx + 0.5) * MEMO;
    const cz = (kz + 0.5) * MEMO;
    const list = choices(cx, cz, lie, depth);
    const v = list.length ? 1 + list[0].value : expected(lie, d, level);
    memo.set(key, v);
    if (list.length) aims.set(key, list[0].at);
    return v;
  }

  // Where the golfer aims from a spot (worked out as its strokes are), or
  // null round the green, where the short game takes over.
  function aimFrom(x, z, lie, depth) {
    if (lie === "green" || yardsToPin(x, z) <= SHORT_GAME || depth >= DEPTH) return null;
    value(x, z, lie, depth);
    return aims.get((Math.floor(x / MEMO) * 100003 + Math.floor(z / MEMO)) * 16 + CODE[lie]) ?? null;
  }

  // What a shot at `target` from (x, z) leaves on average: where each swing
  // finishes - off line and long or short by the golfer's spread
  // (sim/golfers.mjs spreadFor), a miss two thirds of the way and twice as
  // far off line - with a stroke more and a drop for water.
  function leaves(x, z, target, depth) {
    const shot = aimed(x, z, target);
    let sum = 0;
    for (const s of swings) {
      const [ox, oz] = shot(s);
      const lie = grid.at(ox, oz);
      if (lie === "water") {
        const [px, pz, pl] = dropFrom(ox, oz, x, z);
        sum += 1 + value(px, pz, pl, depth + 1);
      } else sum += value(ox, oz, lie, depth + 1);
    }
    return sum / swings.length;
  }

  // A shot from (x, z) at `target`: where each swing finishes.
  function aimed(x, z, target) {
    const dx = target[0] - x;
    const dz = target[1] - z;
    const dist = Math.hypot(dx, dz) || 1;
    const ux = dx / dist;
    const uz = dz / dist;
    const { across, along } = spreadFor(golfer, dist / YARD);
    return (s) => {
      const missed = s.m < golfer.miss;
      const d = dist * (missed ? 0.66 : 1) + s.b * along * YARD;
      const off = s.a * across * YARD * (missed ? 2 : 1);
      return [x + ux * d - uz * off, z + uz * d + ux * off];
    };
  }

  // Out of the water: back along the line it came in on, to dry land.
  function dropFrom(ox, oz, x, z) {
    const dx = x - ox;
    const dz = z - oz;
    const len = Math.hypot(dx, dz) || 1;
    for (let t = 2; t < len; t += 3) {
      const px = ox + (dx / len) * t;
      const pz = oz + (dz / len) * t;
      const lie = grid.at(px, pz);
      if (lie !== "water") return [px, pz, lie === "green" || lie === "tee" ? "fringe" : lie];
    }
    return [x, z, "rough"];
  }

  // Every reasonable target from (x, z), each with what it leaves, best
  // first: from the tee every length and line down the hole, after that
  // fewer (the next shot's choices matter less to which tee shot is best).
  function choices(x, z, lie, depth) {
    const reach = reachFrom(golfer, lie) * YARD;
    const out = [];
    const d = Math.hypot(pin[0] - x, pin[1] - z);
    const add = (t) => {
      const far = Math.hypot(t[0] - x, t[1] - z);
      if (far < 8 * YARD || far > reach + 0.5) return;
      out.push({ at: t, value: leaves(x, z, t, depth) });
    };
    const tee = depth === 0;
    const atGreen = d <= reach;
    if (atGreen) {
      // At the green: the pin, either side, short of it, the middle.
      const ux = (pin[0] - x) / d;
      const uz = (pin[1] - z) / d;
      add(pin);
      for (const k of [-10, -5, 5, 10]) add([pin[0] - uz * k, pin[1] + ux * k]);
      add([pin[0] - ux * 6, pin[1] - uz * 6]);
      add(gMid);
    }
    // Down the hole, at several lengths, and either side (short of the
    // green: a lay-up).
    const s0 = nearest(path, x, z).s;
    const lengths = new Set();
    if (!atGreen) for (const f of tee ? [1, 0.88, 0.75, 0.6, 0.45] : [1, 0.85, 0.7, 0.5]) lengths.add(Math.floor(s0 + reach * f));
    for (const y of tee ? [70, 100, 130] : [90, 120]) lengths.add(Math.round(pinS - y * YARD));
    const across = tee ? [0, -0.5, 0.5, -1, 1, -1.6, 1.6] : atGreen ? [0, -0.6, 0.6] : [0, -0.6, 0.6, -1.2, 1.2];
    for (const s of lengths) {
      if (s <= s0 + 15 || s >= pinS - 25) continue;
      const at = pointAt(path, s);
      const half = Math.max(8, fairwayHalfWidth(L.fairway ?? { from: 0, to: 0 }, s) || 12);
      for (const k of across) add([at.p[0] - at.dir[1] * half * k, at.p[1] + at.dir[0] * half * k]);
    }
    out.sort((a, b) => a.value - b.value);
    return out;
  }

  return { value, choices, leaves, yardsToPin, aimFrom, aimed, dropFrom, swings };
}

// The hole played `rounds` times by `golfer`, each shot aimed where the
// golfer's best choice is and finishing where one of their swings sends it
// (picked at random, seeded, so the same every time), up to the short game
// round the green: how often a ball finishes in each bunker and water
// ({ bunkers: [share], water: [share] }, by the layout's order), and how
// often the green's hit with the shot that gets there (greens). A hazard no
// golfer ever finds isn't in play.
export function playRounds(layout, golfer = "mid", { grid = lieGrid(layout), result = evaluateHole(layout, golfer, { grid }), rounds = 200, seed = 7 } = {}) {
  const L = grid.layout;
  const { play } = result;
  const rand = seeded(seed);
  const found = { bunkers: L.bunkers.map(() => 0), water: L.water.map(() => 0) };
  let greens = 0;
  for (let r = 0; r < rounds; r++) {
    const hit = { bunkers: new Set(), water: new Set() };
    let x = 0;
    let z = 0;
    let target = result.target;
    for (let depth = 0; target && depth < DEPTH; depth++) {
      let [ox, oz] = play.aimed(x, z, target)(play.swings[Math.floor(rand() * play.swings.length)]);
      L.bunkers.forEach((b, i) => inside(b, ox, oz) && hit.bunkers.add(i));
      L.water.forEach((w, i) => inside(w, ox, oz) && hit.water.add(i));
      let lie = grid.at(ox, oz);
      if (lie === "green") greens++;
      if (lie === "water") [ox, oz, lie] = play.dropFrom(ox, oz, x, z);
      x = ox;
      z = oz;
      target = play.aimFrom(x, z, lie, depth + 1);
    }
    for (const k of ["bunkers", "water"]) for (const i of hit[k]) found[k][i]++;
  }
  return { bunkers: found.bunkers.map((v) => v / rounds), water: found.water.map((v) => v / rounds), greens: greens / rounds };
}

const inside = (shape, x, z) => (shape.poly ? insidePolygon(shape.poly, x, z) : insideBlob(shape, x, z));

// What each of the course's golfers (GOLFERS) takes on a hole: { scratch,
// mid, bogey, short } - strokes from the tee on average.
export function holeCosts(layout, { grid = lieGrid(layout), golfers = Object.keys(GOLFERS) } = {}) {
  const out = {};
  for (const k of golfers) out[k] = evaluateHole(layout, k, { grid }).expected;
  return out;
}

// The tee shots worth playing: the targets within `margin` strokes of the
// best, as distinct lines (more than `apart` metres between them) - one
// line is a hole with one way to play it, two or three a hole with a
// choice.
export function teeLines(result, { margin = 0.1, apart = 15 } = {}) {
  const best = result.lines[0]?.value ?? 0;
  const kept = [];
  for (const l of result.lines) {
    if (l.value - best > margin) break;
    if (kept.every((k) => Math.hypot(k.at[0] - l.at[0], k.at[1] - l.at[1]) > apart)) kept.push(l);
  }
  return kept;
}

// Which side of the fairway is the better one to play the next shot from,
// where `golfer`'s tee shot finishes: { side, bonus, at } - side -1 left,
// +1 right (as the hole's z), bonus how many strokes the better side saves
// over the other (0 when there's nothing in it), at how far down the hole
// (metres). Read a little either side of there too, so one spot's luck
// doesn't decide it. The heart of a strategic hole: a corner to cut, a
// green turned to one side or guarded on one, makes one side of the
// fairway the place to be.
export function sideBonus(layout, golfer = "mid", { grid = lieGrid(layout), result = evaluateHole(layout, golfer, { grid }), across = 0.6 } = {}) {
  const { path } = grid;
  const L = grid.layout;
  const t = result.target ?? pointAt(path, Math.min(path.length * 0.6, 220 * YARD)).p;
  const s = nearest(path, t[0], t[1]).s;
  let diff = 0;
  let n = 0;
  for (const ds of [-12, 0, 12]) {
    const at = pointAt(path, s + ds);
    const half = fairwayHalfWidth(L.fairway ?? { from: 0, to: 0 }, s + ds) || 12;
    const v = (k) => result.play.value(at.p[0] - at.dir[1] * half * k, at.p[1] + at.dir[0] * half * k, "fairway", 1);
    diff += v(-across) - v(across);
    n++;
  }
  const bonus = Math.abs(diff / n);
  return { side: bonus < 0.01 ? 0 : diff > 0 ? 1 : -1, bonus, at: s };
}

// What one hazard costs: the hole as each golfer plays it with and without
// the bunker or water `kind` [index] - the strokes it adds for each ({
// scratch, mid, ... }). A hazard that costs nobody anything (nor moves
// anyone's tee shot) is only decoration.
export function hazardCost(layout, kind, index, { golfers = Object.keys(GOLFERS) } = {}) {
  const L = withEdits(layout);
  const without = { ...L, [kind]: L[kind].filter((_, i) => i !== index) };
  const gridWith = lieGrid(L);
  const gridWithout = lieGrid(without);
  const out = {};
  for (const k of golfers) {
    const a = evaluateHole(L, k, { grid: gridWith });
    const b = evaluateHole(without, k, { grid: gridWithout });
    const moved = a.target && b.target ? Math.hypot(a.target[0] - b.target[0], a.target[1] - b.target[1]) : 0;
    out[k] = { strokes: a.expected - b.expected, moved };
  }
  return out;
}
