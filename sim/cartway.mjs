// Where the cart goes between holes (course/buggy.js; sim/buggy.mjs drives
// it): from a spot to wait in by the green just played, all the way to the
// next tee - the one the round's played from - parked beside its box,
// along the cart paths wherever they go its way (the owner, 1 November
// 2026: "Cart riding still needs another look at. It doesn't follow paths.
// It doesn't always get to the T. A few situations just ends up in random
// places, which makes no sense"). Before, it made a short drive of 18 - 65
// m on from the green (the owner, 28 October 2026: "don't put the buggy so
// close to the next hole so there is a small drive"), up beside the tee
// only when that was near - on most holes it stopped out on the grass
// somewhere short of it, and the paths were only a little cheaper ground.
//
// The ground between the green and the tee - and round the paths that join
// them - is read once into a field: a grid (a metre a cell, coarser on a
// long way: CART_WAY.cells) of what's there, how steep, and how far each
// spot is from the nearest tree's crown, from long grass and from anywhere
// a cart never goes (water, sand, greens, tee boxes). The cart paths drawn
// on the course are burnt into it along their lines (CART_WAY.brush either
// side): a path is a path whatever's under it (another hole's fairway it
// crosses, a bridge over a brook), the cheapest ground (CART_WAY.paved a
// metre against grass's 1: taken where it goes the cart's way, not round
// twice as far), and the cart may go along it however near the trees and
// long grass it runs - a path is laid clear of them already. Off the paths
// the cart keeps a berth of trees and long grass: none nearer than
// CART_BERTH.tree / .long (from the cart's middle to a crown's edge, or the
// long grass), dearer the nearer within .softTree / .softLong of them, so
// it keeps to the middle of open ground - but through a clear gap in the
// trees rather than a long way round (the owner, 3 November 2026: "I know
// we said keep a wide path around trees but there was a clear path through
// the trees that would be better"). And never across the fairway of the
// hole just played: round the back of its green (playedGround).
// With nowhere to wait, drive and park that far off them the berths narrow
// (CART_BERTH.tiers) - at the last across the long grass, where there's no
// way round, and only after that across the fairway just played - but never
// under a tree; with no way to the tee even so, no
// ride at all (the scorecard card) - never a stop somewhere short of it.
//
// Pure: the field is made from what the game reads off the ground (lie,
// height), the trees ([x, z, crown]) and the paths' lines, in the world's
// xz.

import { makePath, nearest } from "./course.mjs";

// What each lie costs a metre (a cart path cheapest, then short grass; the
// woods' floor a little more - clear ground among the trees, which are kept
// a berth from themselves; a green's collar and long grass only if nothing
// else - and long grass is kept a berth from anyway); the hole just
// played's fairway,
// and its first cut in front of its green, dearest of all ("inplay":
// playedGround); anything else (water, sand, greens, tee boxes) it never
// goes on.
const CODES = ["path", "fairway", "semi", "rough", "trees", "fringe", "deep", "hay", "inplay"];
const PRICE = [0.7, 1, 1, 1.1, 1.6, 8, 12, 25, 60];
const NEVER = 255;
const INPLAY = CODES.indexOf("inplay");
// Where it may stand still: a path or short grass.
const STANDS = 4;
const LONG = new Set(["deep", "hay"]);

// The hole just played as the cart sees it (the owner, 3 November 2026:
// "always drive around the back of the green if we need to cross over to
// the next hole, that's just etiquette to not drive down the fairway where
// other players would be ready with their shots"): its fairway, and its
// first cut in front of the middle of its green, read as "inplay" - not
// driven on at all till every narrower berth has found no way (the last of
// CART_BERTH.tiers), then the dearest ground there is, and never stood on -
// so the cart crosses the hole's line round the back of its green, nearer
// the long grass there if it must, rather than back down the hole. ownLie(x, z): the hole's own lie (not the other holes'), hole
// frame. Returns lie(x, z, l): l, or "inplay" there.
export function playedGround(L, ownLie) {
  const line = L?.path?.length >= 2 ? makePath(L.path) : null;
  const g = L?.green;
  if (!line || !g) return (x, z, l) => l;
  const back = nearest(line, g.x, g.z).s;
  return (x, z, l) => {
    const own = ownLie(x, z);
    if (own === "fairway") return "inplay";
    if (own === "semi" && nearest(line, x, z).s < back) return "inplay";
    return l;
  };
}

export const CART_BERTH = Object.freeze({
  // Kept this far from anywhere it never goes (half its width and a
  // little), and parked a little further still (metres, from its middle).
  room: 1.4,
  parkRoom: 2,
  // The widest berths, then narrower where there's no other way: from its
  // middle to the nearest crown's edge (2.2 m: a clear gap between two
  // crowns 4.4 m apart, its sides 1.5 m off each), and to the nearest long
  // grass (metres) - at the last across the long grass where it must (long
  // 0: it's dear to drive on, and never parked in). Parked half a metre
  // further off than it drives. Only the very last crosses the fairway of
  // the hole just played (played: "inplay", playedGround).
  tiers: Object.freeze([
    Object.freeze({ tree: 2.2, long: 4 }),
    Object.freeze({ tree: 2.2, long: 2.5 }),
    Object.freeze({ tree: 1.4, long: 1 }),
    Object.freeze({ tree: 1.4, long: 0 }),
    Object.freeze({ tree: 1.4, long: 0, played: true }),
  ]),
  // Within this of a crown or long grass a metre costs more, `k` a metre
  // nearer: so it keeps to the middle of the open ground.
  softTree: 8,
  softLong: 7,
  k: 0.35,
  // The signs, the windsock, the club's furniture and the solid dressing
  // (sim/cartthings.mjs): kept this far from each one's edge (metres, from
  // the cart's middle: half its length and a little, so it doesn't clip one
  // turning past), on a path too - and parked `parkThing` off; dearer the
  // nearer within `softThing`, so it doesn't graze them.
  thing: 1.4,
  parkThing: 1.8,
  softThing: 3,
  // A slope adds `feel` times its grade to a metre's cost; steeper than
  // `steep` (rise over run) it won't drive; it parks no steeper than
  // `flat`.
  feel: 6,
  steep: 0.3,
  flat: 0.11,
});

// The ride (metres):
//   wait     where it waits, this far off its own green's edge (`near` the
//            best)
//   park     where it parks, this far from the middle of the tee box it's
//            going to (beyond park[1] only if there's nowhere nearer, and
//            never beyond parkFar); never further out in front of the box,
//            along the next hole's line, than `front` - unless more than
//            `side` off to one side of it
//   margin   the field reaches this far round the green, the tee and the
//            paths between them; `reach`: the paths within this of the way
//            from the green to the tee are in it
//   cells    the most cells the field has (bigger cells on a long way)
//   paved    what a metre of drawn cart path costs (grass is 1): a path
//            is taken where it's up to twice as far as the way over grass
//            (at 0.3, three times: back down the hole just played)
//   brush    a path's line is burnt in this far either side of its middle
//   follow   a ride's way costs this much a metre of its route's cost when
//            choosing where to wait (so it waits where the way on is good)
//   least    a drive at least about this long where it can be (the next tee
//            right by the green: it waits round the far side of the green,
//            rather than by the tee already, and drives round)
export const CART_WAY = Object.freeze({ wait: Object.freeze([5, 26]), near: 9, park: Object.freeze([5, 18]), parkFar: 26, front: 4, side: 9, margin: 30, reach: 60, cells: 90000, paved: 0.5, brush: 1, follow: 0.05, least: 25 });

// Each cell's squared distance (cells) to the nearest marked one: the exact
// Euclidean distance transform, a row and a column at a time (Felzenszwalb
// and Huttenlocher's).
function distances(marked, W, H) {
  const n = Math.max(W, H);
  const f = new Float64Array(n);
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const zs = new Float64Array(n + 1);
  const BIG = 1e12;
  const out = new Float64Array(W * H);
  for (let i = 0; i < W * H; i++) out[i] = marked[i] ? 0 : BIG;
  const line = (len, get, put) => {
    for (let q = 0; q < len; q++) f[q] = get(q);
    let k = 0;
    v[0] = 0;
    zs[0] = -BIG;
    zs[1] = BIG;
    for (let q = 1; q < len; q++) {
      let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * (q - v[k]));
      while (s <= zs[k]) {
        k--;
        s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * (q - v[k]));
      }
      k++;
      v[k] = q;
      zs[k] = s;
      zs[k + 1] = BIG;
    }
    k = 0;
    for (let q = 0; q < len; q++) {
      while (zs[k + 1] < q) k++;
      d[q] = (q - v[k]) ** 2 + f[v[k]];
    }
    for (let q = 0; q < len; q++) put(q, d[q]);
  };
  for (let x = 0; x < W; x++) line(H, (q) => out[q * W + x], (q, val) => (out[q * W + x] = val));
  for (let y = 0; y < H; y++) line(W, (q) => out[y * W + q], (q, val) => (out[y * W + q] = val));
  for (let i = 0; i < W * H; i++) out[i] = Math.sqrt(out[i]);
  return out;
}

// The field's box and cell size for a ride (the world's xz): round the
// green (its middle, `reach` its size), the tee, and the paths' points
// near the way between them (CART_WAY.reach), CART_WAY.margin all round -
// cells a metre across, or as much bigger as keeps the field to
// CART_WAY.cells. paths: [[[x, z], ...]].
export function rideBox({ green, reach = 15, tee, paths = [], margin = CART_WAY.margin, cells = CART_WAY.cells }) {
  const m = [(green[0] + tee[0]) / 2, (green[1] + tee[1]) / 2];
  const half = Math.hypot(tee[0] - green[0], tee[1] - green[1]) / 2;
  let x0 = Math.min(green[0] - reach, tee[0]);
  let x1 = Math.max(green[0] + reach, tee[0]);
  let z0 = Math.min(green[1] - reach, tee[1]);
  let z1 = Math.max(green[1] + reach, tee[1]);
  for (const line of paths) {
    for (const [x, z] of line) {
      if (Math.hypot(x - m[0], z - m[1]) > half + CART_WAY.reach) continue;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      z0 = Math.min(z0, z);
      z1 = Math.max(z1, z);
    }
  }
  const box = { x0: x0 - margin, x1: x1 + margin, z0: z0 - margin, z1: z1 + margin };
  const area = (box.x1 - box.x0) * (box.z1 - box.z0);
  const cell = Math.max(1, Math.ceil(Math.sqrt(area / cells) * 4) / 4);
  return { box, cell };
}

// The ground in `box` ({ x0, x1, z0, z1 }, the world's xz) as a cart sees
// it, a `cell` metres apart: lie(x, z) what's there (sim/course.mjs's lies);
// height(x, z), or none for flat; trees [[x, z, crown]]; paths, the cart
// paths' lines [[[x, z], ...]] burnt in as path (CART_WAY.brush either
// side, or the cell's size if that's more); keepOff, shapes [[[x, z],
// ...]] it never goes in, paths or no (the tee boxes it's going to);
// things [[x, z, reach]], what stands on the ground that it keeps clear of,
// paths or no (sim/cartthings.mjs: the signs, the furniture, the rocks).
export function cartField(ground) {
  const it = cartFieldSteps(ground);
  let r = it.next();
  while (!r.done) r = it.next();
  return r.value;
}

// The same a step at a time (sim/idlework.mjs: each yield a place it can
// stop and carry on from), about `per` cells of the grid read a step - read
// in the picture's quiet moments while the hole's played (course/buggy.js
// prepareRide), so it's there when the hole ends: a few milliseconds a step.
export function* cartFieldSteps({ lie, height = null, trees = [], paths = [], keepOff = [], things = [], box, cell = 1, per = 850 }) {
  const W = Math.max(1, Math.ceil((box.x1 - box.x0) / cell));
  const H = Math.max(1, Math.ceil((box.z1 - box.z0) / cell));
  const n = W * H;
  const x0 = box.x0 + cell / 2;
  const z0 = box.z0 + cell / 2;
  const code = new Uint8Array(n);
  const never = new Uint8Array(n);
  const long = new Uint8Array(n);
  const green = new Uint8Array(n);
  const paved = new Uint8Array(n);
  const hts = new Float64Array(n);
  const rows = Math.max(1, Math.round(per / W));
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const k = j * W + i;
      const x = x0 + i * cell;
      const z = z0 + j * cell;
      const l = lie(x, z);
      const c = l == null || l === "" ? 3 : CODES.indexOf(l);
      code[k] = c < 0 ? NEVER : c;
      never[k] = c < 0 ? 1 : 0;
      long[k] = LONG.has(l) ? 1 : 0;
      green[k] = l === "green" ? 1 : 0;
      if (height) hts[k] = height(x, z);
    }
    if ((j + 1) % rows === 0) yield "reading the ground for the cart";
  }
  // The paths burnt in: every cell within the brush of a line's middle.
  const brush = Math.max(CART_WAY.brush, cell * 0.75);
  for (const line of paths) {
    for (let s = 1; s < (line?.length ?? 0); s++) {
      const [ax, az] = line[s - 1];
      const [bx, bz] = line[s];
      const dx = bx - ax;
      const dz = bz - az;
      const len2 = dx * dx + dz * dz || 1;
      const i0 = Math.max(0, Math.floor((Math.min(ax, bx) - brush - box.x0) / cell));
      const i1 = Math.min(W - 1, Math.floor((Math.max(ax, bx) + brush - box.x0) / cell));
      const j0 = Math.max(0, Math.floor((Math.min(az, bz) - brush - box.z0) / cell));
      const j1 = Math.min(H - 1, Math.floor((Math.max(az, bz) + brush - box.z0) / cell));
      for (let j = j0; j <= j1; j++) {
        const z = z0 + j * cell;
        for (let i = i0; i <= i1; i++) {
          const x = x0 + i * cell;
          const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / len2));
          if (Math.hypot(x - ax - dx * t, z - az - dz * t) > brush) continue;
          const k = j * W + i;
          paved[k] = 1;
          code[k] = 0;
          never[k] = 0;
          long[k] = 0;
          green[k] = 0;
        }
      }
    }
  }
  // Where it never goes, paths or no.
  for (const poly of keepOff) {
    if (!(poly?.length > 2)) continue;
    let px0 = Infinity, px1 = -Infinity, pz0 = Infinity, pz1 = -Infinity;
    for (const [x, z] of poly) {
      px0 = Math.min(px0, x); px1 = Math.max(px1, x); pz0 = Math.min(pz0, z); pz1 = Math.max(pz1, z);
    }
    const i0 = Math.max(0, Math.floor((px0 - box.x0) / cell));
    const i1 = Math.min(W - 1, Math.floor((px1 - box.x0) / cell));
    const j0 = Math.max(0, Math.floor((pz0 - box.z0) / cell));
    const j1 = Math.min(H - 1, Math.floor((pz1 - box.z0) / cell));
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        if (!inside(poly, x0 + i * cell, z0 + j * cell)) continue;
        const k = j * W + i;
        paved[k] = 0;
        code[k] = NEVER;
        never[k] = 1;
      }
    }
  }
  yield "the cart's paths";
  // (To the edge of the nearest marked cell, not its middle.)
  const scale = (a) => {
    for (let k = 0; k < n; k++) a[k] = a[k] > 0 ? (a[k] - 0.5) * cell : 0;
    return a;
  };
  const neverGap = scale(distances(never, W, H));
  yield "the cart's room";
  const longGap = scale(distances(long, W, H));
  yield "the cart's room";
  const greenGap = scale(distances(green, W, H));
  yield "the cart's room";
  // How far from the nearest crown's edge (only as far as it matters).
  const FAR = CART_BERTH.softTree + 2;
  const treeGap = new Float64Array(n).fill(FAR);
  gapsFrom(treeGap, trees, FAR, box, cell, W, H, 3);
  yield "the cart's room";
  // How far from the nearest thing's edge (only as far as it matters).
  const thingGap = new Float64Array(n).fill(CART_BERTH.softThing + 2);
  gapsFrom(thingGap, things, CART_BERTH.softThing + 2, box, cell, W, H);
  yield "the cart's room";
  // How steep (rise over run, over 3 m).
  const grade = new Float64Array(n);
  if (height) {
    const s = Math.max(1, Math.round(1.5 / cell));
    const at = (i, j) => hts[Math.max(0, Math.min(H - 1, j)) * W + Math.max(0, Math.min(W - 1, i))];
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) {
        const g = Math.hypot(at(i + s, j) - at(i - s, j), at(i, j + s) - at(i, j - s)) / (2 * s * cell);
        grade[j * W + i] = Number.isFinite(g) ? g : 0;
      }
    }
  }
  return {
    W,
    H,
    cell,
    box,
    code,
    paved,
    neverGap,
    longGap,
    greenGap,
    treeGap,
    thingGap,
    grade,
    // A cell's middle, and the cell at a spot (-1 off the field).
    at: (k) => [x0 + (k % W) * cell, z0 + Math.floor(k / W) * cell],
    cellAt: (x, z) => {
      const i = Math.floor((x - box.x0) / cell);
      const j = Math.floor((z - box.z0) / cell);
      return i < 0 || j < 0 || i >= W || j >= H ? -1 : j * W + i;
    },
  };
}

// Each cell's distance from its middle to the nearest edge of circles
// [[x, z, r]] into gap, where that's nearer than it holds (out to far; r
// `r0` where it's not given).
function gapsFrom(gap, circles, far, box, cell, W, H, r0 = 0) {
  const x0 = box.x0 + cell / 2;
  const z0 = box.z0 + cell / 2;
  for (const [cx, cz, r = r0] of circles) {
    const reach = r + far;
    const i0 = Math.max(0, Math.floor((cx - reach - box.x0) / cell));
    const i1 = Math.min(W - 1, Math.ceil((cx + reach - box.x0) / cell));
    const j0 = Math.max(0, Math.floor((cz - reach - box.z0) / cell));
    const j1 = Math.min(H - 1, Math.ceil((cz + reach - box.z0) / cell));
    for (let j = j0; j <= j1; j++) {
      const dz = z0 + j * cell - cz;
      for (let i = i0; i <= i1; i++) {
        const g = Math.hypot(x0 + i * cell - cx, dz) - r;
        const k = j * W + i;
        if (g < gap[k]) gap[k] = g;
      }
    }
  }
}

// Whether (x, z) is inside a polygon [[x, z], ...].
function inside(poly, x, z) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
}

// A metre's cost at cell k with berths b (Infinity where it can't go): on a
// drawn path, CART_WAY.paved (dearer up a slope), however near the trees
// or long grass beside it - but never within CART_BERTH.thing of a sign,
// the furniture or a rock, path or no, and dearer the nearer within
// softThing.
export function cartCost(F, k, b) {
  const c = F.code[k];
  const B = CART_BERTH;
  const thing = F.thingGap?.[k] ?? Infinity;
  if (thing < B.thing) return Infinity;
  const near = B.k * Math.max(0, B.softThing - thing);
  if (F.paved?.[k]) return CART_WAY.paved * (1 + B.feel * Math.min(F.grade[k], B.steep)) + near;
  if (c === NEVER || (c === INPLAY && !b.played) || F.neverGap[k] < B.room || F.treeGap[k] < b.tree || F.longGap[k] < b.long || F.grade[k] > B.steep) return Infinity;
  return PRICE[c] * (1 + B.feel * F.grade[k]) + B.k * (Math.max(0, B.softTree - F.treeGap[k]) + Math.max(0, B.softLong - F.longGap[k])) + near;
}

// Whether it may stand still at cell k with berths b: on a path or short
// grass, nearly flat, and a little further off everything than it drives -
// on a drawn path, only clear of anywhere it never goes; never within
// CART_BERTH.parkThing of a sign, the furniture or a rock.
export function cartStands(F, k, b) {
  const B = CART_BERTH;
  if ((F.thingGap?.[k] ?? Infinity) < B.parkThing) return false;
  if (F.paved?.[k]) return F.neverGap[k] >= B.room && F.grade[k] <= B.flat;
  return F.code[k] < STANDS && F.neverGap[k] >= B.parkRoom && F.treeGap[k] >= b.tree + 0.5 && F.longGap[k] >= Math.max(b.long, 0.5) + 0.5 && F.grade[k] <= B.flat;
}

// How much worse a spot is to stand in: sloping, rough rather than a path,
// and nearer a crown or long grass than it might be.
function standWorse(F, k) {
  if (F.paved?.[k]) return F.grade[k] * 80 - 4;
  return F.grade[k] * 80 + (F.code[k] === 0 ? -3 : F.code[k] === 3 ? 1 : 0) + Math.max(0, 7 - F.treeGap[k]) * 1.5 + Math.max(0, 6 - F.longGap[k]) * 1.5;
}

// A binary heap of cells by cost (typed arrays, grown as needed).
function cellHeap() {
  let keys = new Float64Array(1024);
  let vals = new Int32Array(1024);
  let size = 0;
  return {
    get size() {
      return size;
    },
    push(d, k) {
      if (size === keys.length) {
        const nk = new Float64Array(size * 2);
        nk.set(keys);
        keys = nk;
        const nv = new Int32Array(size * 2);
        nv.set(vals);
        vals = nv;
      }
      let c = size++;
      while (c > 0) {
        const p = (c - 1) >> 1;
        if (keys[p] <= d) break;
        keys[c] = keys[p];
        vals[c] = vals[p];
        c = p;
      }
      keys[c] = d;
      vals[c] = k;
    },
    // The cheapest: [cost, cell] into `out`.
    pop(out) {
      out[0] = keys[0];
      out[1] = vals[0];
      const d = keys[--size];
      const k = vals[size];
      let c = 0;
      for (;;) {
        const l = 2 * c + 1;
        if (l >= size) break;
        const r = l + 1;
        const m = r < size && keys[r] < keys[l] ? r : l;
        if (keys[m] >= d) break;
        keys[c] = keys[m];
        vals[c] = vals[m];
        c = m;
      }
      keys[c] = d;
      vals[c] = k;
      return out;
    },
  };
}

// Cheapest ways from cell `s` over the whole field (Dijkstra, eight ways),
// a step at a time (yields every `per` cells settled): each cell's cost,
// its length (metres) and the cell it's reached from (the next towards s).
function* waysFrom(F, s, b, per = 4000) {
  const n = F.W * F.H;
  const g = new Float64Array(n).fill(Infinity);
  const len = new Float64Array(n).fill(Infinity);
  const from = new Int32Array(n).fill(-1);
  const prices = new Float64Array(n).fill(NaN);
  const price = (k) => (Number.isNaN(prices[k]) ? (prices[k] = cartCost(F, k, b)) : prices[k]);
  const heap = cellHeap();
  const top = [0, 0];
  g[s] = 0;
  len[s] = 0;
  heap.push(0, s);
  const done = new Uint8Array(n);
  let settled = 0;
  while (heap.size) {
    const [d, k] = heap.pop(top);
    if (done[k]) continue;
    done[k] = 1;
    if (++settled % per === 0) yield "the cart's way";
    const i = k % F.W;
    const j = (k - i) / F.W;
    const here = price(k);
    for (let dj = -1; dj <= 1; dj++) {
      for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const a = i + di;
        const c = j + dj;
        if (a < 0 || c < 0 || a >= F.W || c >= F.H) continue;
        const kk = c * F.W + a;
        if (done[kk]) continue;
        const there = price(kk);
        if (!Number.isFinite(there)) continue;
        // (Not cutting a corner it can't go over.)
        if (di && dj && (!Number.isFinite(price(j * F.W + a)) || !Number.isFinite(price(c * F.W + i)))) continue;
        const step = (di && dj ? Math.SQRT2 : 1) * F.cell;
        const nd = d + (step * (here + there)) / 2;
        if (nd < g[kk]) {
          g[kk] = nd;
          len[kk] = len[k] + step;
          from[kk] = k;
          heap.push(nd, kk);
        }
      }
    }
  }
  return { g, len, from, price };
}

// What the straight line from a to b costs over the field (Infinity if it
// crosses anywhere it can't go).
function lineCost(F, a, b, price) {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n = Math.max(1, Math.ceil(d / (F.cell / 2)));
  let sum = 0;
  for (let i = 0; i <= n; i++) {
    const k = F.cellAt(a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n);
    const c = k < 0 ? Infinity : price(k);
    if (!Number.isFinite(c)) return Infinity;
    sum += c * (i === 0 || i === n ? 0.5 : 1);
  }
  return (sum * d) / n;
}

// Where it could park by the tee ([x, z], the box's middle; ahead: the next
// hole's line from it, a unit [x, z], or null) with berths b, the best
// first: standing ground CART_WAY.park from the box's middle (parkFar at
// most), never out in front of it on the line of play, on a path if
// there's one there, beside the box rather than far off, on the green's
// side of it. Those at least 4 m apart.
function parkSpots(F, { tee, ahead, green }, b) {
  const W = CART_WAY;
  const out = [];
  const r = W.parkFar + F.cell;
  const i0 = Math.max(0, Math.floor((tee[0] - r - F.box.x0) / F.cell));
  const i1 = Math.min(F.W - 1, Math.floor((tee[0] + r - F.box.x0) / F.cell));
  const j0 = Math.max(0, Math.floor((tee[1] - r - F.box.z0) / F.cell));
  const j1 = Math.min(F.H - 1, Math.floor((tee[1] + r - F.box.z0) / F.cell));
  for (let j = j0; j <= j1; j++) {
    for (let i = i0; i <= i1; i++) {
      const k = j * F.W + i;
      const [x, z] = F.at(k);
      const d = Math.hypot(x - tee[0], z - tee[1]);
      if (d < W.park[0] || d > W.parkFar || !cartStands(F, k, b)) continue;
      if (ahead) {
        const along = (x - tee[0]) * ahead[0] + (z - tee[1]) * ahead[1];
        const side = Math.abs((x - tee[0]) * ahead[1] - (z - tee[1]) * ahead[0]);
        if (along > W.front && side < W.side) continue;
      }
      const score = standWorse(F, k) + Math.abs(d - 10) * 0.3 + Math.max(0, d - W.park[1]) * 1.5 + 0.01 * Math.hypot(x - green[0], z - green[1]);
      out.push({ k, x, z, score });
    }
  }
  out.sort((a, c) => a.score - c.score);
  const apart = [];
  for (const p of out) {
    if (apart.length >= 3) break;
    if (apart.some((o) => Math.hypot(o.x - p.x, o.z - p.z) < 4)) continue;
    apart.push(p);
  }
  return apart;
}

// The cart's ride from the green ([x, z] its middle, `reach` its size) to
// the next tee ([x, z], the middle of the box the round plays from; ahead:
// the next hole's line from it, a unit [x, z], or null) over a field
// (cartField - covering both, and the paths between: rideBox): { way:
// [[x, z], ...] from where it waits to where it parks, tier: which of
// CART_BERTH.tiers it keeps, atTee: true (it always parks by the tee),
// paved: how much of its way is along a drawn path (0 - 1) } - or null,
// no way there (no ride).
//   Where it parks: beside the tee box, on standing ground (a path if
// there's one there), never out in front of it on the line of play
// (parkSpots). Where it waits: on standing ground CART_WAY.wait off the
// edge of its own green (about CART_WAY.near), flat, as far off trees and
// long grass as it can be, and where the way on to the tee is good - a
// drive of CART_WAY.least at least where it can be. Its
// way: the cheapest over the field - along the paths wherever they go its
// way - pulled into straight legs where that's no dearer (so not across a
// path's bends).
export function cartRide(F, spec) {
  const it = cartRideSteps(F, spec);
  let r = it.next();
  while (!r.done) r = it.next();
  return r.value;
}

// The same a step at a time (yields as it goes: sim/idlework.mjs).
export function* cartRideSteps(F, { green, reach = 15, tee, ahead = null }) {
  const W = CART_WAY;
  const n = F.W * F.H;
  for (const [tier, b] of CART_BERTH.tiers.entries()) {
    // Where it might wait: by its own green, not another's.
    const waits = [];
    for (let k = 0; k < n; k++) {
      const gg = F.greenGap[k];
      if (gg < W.wait[0] || gg > W.wait[1] || !cartStands(F, k, b)) continue;
      const [x, z] = F.at(k);
      if (Math.hypot(x - green[0], z - green[1]) > reach + W.wait[1] + 2 * F.cell) continue;
      waits.push({ k, score: Math.abs(gg - W.near) * 0.4 + standWorse(F, k) });
    }
    if (!waits.length) continue;
    for (const park of parkSpots(F, { tee, ahead, green }, b)) {
      const ways = yield* waysFrom(F, park.k, b);
      let best = null;
      for (const w of waits) {
        const g = ways.g[w.k];
        if (!Number.isFinite(g)) continue;
        const score = w.score + W.follow * g + Math.max(0, W.least - ways.len[w.k]) * 0.5;
        if (!best || score < best.score) best = { k: w.k, score };
      }
      if (!best) continue;
      // Its way there, from where it waits to the tee, pulled tight: from
      // each point on to the farthest in a straight line no dearer than
      // the way round to it.
      const cells = [];
      for (let k = best.k; k >= 0; k = ways.from[k]) cells.push(k);
      const pts = cells.map((k) => F.at(k));
      const out = [pts[0]];
      let i = 0;
      while (i < pts.length - 1) {
        let j = pts.length - 1;
        while (j > i + 1 && !(lineCost(F, pts[i], pts[j], ways.price) <= (ways.g[cells[i]] - ways.g[cells[j]]) * 1.03 + 0.5)) j--;
        out.push(pts[j]);
        i = j;
      }
      // (flow: every cell's way on to where it parks - for a cart handed
      // back partway, and for showing the way: cartWayFrom, cartGuide.)
      return { way: out, tier, atTee: true, paved: pavedShare(F, out), flow: { F, park: park.k, from: ways.from, g: ways.g, len: ways.len, price: ways.price } };
    }
  }
  return null;
}

// ---- From anywhere on to the tee (the owner, 13 November 2026: "Have an auto
// drive button, but also a guidance on which way to go to the next tee") -------

// The cell of a ride's flow (cartRide's `flow`) a cart at `at` ([x, z]) goes
// on from: its own, where the ride could have gone over it; else the
// nearest it could - within `reach` metres, the straight line to it not
// through anything that stops a cart (blocked(x, z), sampled each metre:
// sim/freedrive.mjs driveGround's) - or -1, none.
export const CART_JOIN = Object.freeze({ reach: 90, tries: 60, ahead: 22 });
function joinCell(flow, at, blocked = null, reach = CART_JOIN.reach) {
  const { F, g, len } = flow;
  const k0 = F.cellAt(at[0], at[1]);
  if (k0 >= 0 && Number.isFinite(g[k0])) return k0;
  const near = [];
  const n = F.W * F.H;
  for (let k = 0; k < n; k++) {
    if (!Number.isFinite(g[k])) continue;
    const [x, z] = F.at(k);
    const d = Math.hypot(x - at[0], z - at[1]);
    // (The nearest, a little the dearer for a longer way on from it.)
    if (d <= reach) near.push({ k, d, score: d + len[k] * 0.15 });
  }
  near.sort((a, b) => a.score - b.score);
  for (const c of near.slice(0, CART_JOIN.tries)) {
    if (!blocked) return c.k;
    const [x, z] = F.at(c.k);
    const steps = Math.max(1, Math.ceil(c.d));
    let clear = true;
    // (From a metre on: where it stands may be at something's edge.)
    for (let i = 1; i <= steps && clear; i++) clear = !blocked(at[0] + ((x - at[0]) * i) / steps, at[1] + ((z - at[1]) * i) / steps);
    if (clear) return c.k;
  }
  return -1;
}

// A cart's way from `at` on to where the ride parks by the tee, over the
// ride's flow: [[x, z], ...] from `at` itself - along the cheapest way
// from there, pulled into straight legs as the ride's own is - or null,
// no way from there (it's driven nearer first).
export function cartWayFrom(flow, at, { blocked = null, reach = CART_JOIN.reach } = {}) {
  if (!flow) return null;
  const { F, from, g, price } = flow;
  const k0 = joinCell(flow, at, blocked, reach);
  if (k0 < 0) return null;
  const cells = [];
  for (let k = k0; k >= 0 && cells.length <= F.W * F.H; k = from[k]) cells.push(k);
  const pts = cells.map((k) => F.at(k));
  const out = [pts[0]];
  let i = 0;
  while (i < pts.length - 1) {
    let j = pts.length - 1;
    while (j > i + 1 && !(lineCost(F, pts[i], pts[j], price) <= (g[cells[i]] - g[cells[j]]) * 1.03 + 0.5)) j--;
    out.push(pts[j]);
    i = j;
  }
  // (From where it is, not the middle of its cell.)
  if (Math.hypot(out[0][0] - at[0], out[0][1] - at[1]) > 0.5) out.unshift([at[0], at[1]]);
  else out[0] = [at[0], at[1]];
  return out.length > 1 ? out : [out[0], F.at(flow.park)];
}

// Which way to go from `at`: { to: [x, z] - a point `ahead` metres on
// along the way to the tee from there (the way a cart would be driven:
// round the sand and the trees, along the paths), left: metres still to
// go, on: true } - or, off the ground the ride was worked out over,
// straight at where it parks: { to, left, on: false }.
export function cartGuide(flow, at, { ahead = CART_JOIN.ahead } = {}) {
  if (!flow) return null;
  const { F, from, g, len } = flow;
  const park = F.at(flow.park);
  const k0 = F.cellAt(at[0], at[1]);
  if (k0 < 0 || !Number.isFinite(g[k0])) return { to: park, left: Math.hypot(park[0] - at[0], park[1] - at[1]), on: false };
  let k = k0;
  while (from[k] >= 0 && len[k0] - len[k] < ahead) k = from[k];
  return { to: F.at(k), left: len[k0], on: true };
}

// How much of a way (metres) runs along a drawn path, 0 - 1.
export function pavedShare(F, way) {
  let all = 0;
  let on = 0;
  for (let i = 1; i < way.length; i++) {
    const d = Math.hypot(way[i][0] - way[i - 1][0], way[i][1] - way[i - 1][1]);
    const steps = Math.max(1, Math.ceil(d / 0.5));
    for (let s = 0; s < steps; s++) {
      const t = (s + 0.5) / steps;
      const k = F.cellAt(way[i - 1][0] + (way[i][0] - way[i - 1][0]) * t, way[i - 1][1] + (way[i][1] - way[i - 1][1]) * t);
      all += d / steps;
      if (k >= 0 && F.paved?.[k]) on += d / steps;
    }
  }
  return all > 0 ? on / all : 0;
}
