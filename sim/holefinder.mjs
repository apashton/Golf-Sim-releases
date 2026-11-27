// Suggested holes for a course whose map has its greens and tees but not
// its holes. OpenStreetMap's holes are lines from tee to green (golf=hole),
// and most courses have their greens, tees, bunkers and fairways drawn long
// before anyone draws those: the importer used to turn such a course away.
// Here each green is given the tee that plays to it, the line bent down its
// fairway where the fairway bends, and the holes numbered by the walk from
// each green to the next tee. It's a start: the course plan (courseplan.js)
// shows it, and the player puts right whatever isn't.
//
// How a tee is told to play to a green, from what a map has:
//   - the distance: 70 - 620 m;
//   - a tee box is drawn longest along the line it's played on, a green
//     often along the line it's played into;
//   - a par 4 or 5 is played down a fairway: the line from the tee (bent
//     once where the fairway bends) runs over fairway from where a drive
//     lands to short of the green;
//   - a hole's tees stand in a row along its line, back to front;
//   - a line doesn't cross another green, or a building;
//   - and, numbering them, the next tee is a short walk from the last green
//     (the first near the clubhouse, where there is one).
// A green holds one hole, or two if it's a double green (big, or with two
// flags mapped on it) played into from different ways. A green nothing
// plays to is left out (a practice green).
//
// Pure, in metres east (x) and north (z) of the course's middle
// (terrain.mjs project).

import { insidePolygon, distanceToEdge, polygonArea, polygonCentroid } from "./terrain.mjs";
import { gridOver, boxOf, shapeMask } from "./cellmask.mjs";
import { YARD } from "./flight.mjs";

// What a hole can be, tee to green (metres).
export const HOLE_REACH = { least: 70, most: 620 };
// Past this a hole is played down a fairway.
const FAIRWAY_FROM = 215;
// A green this big (square metres) can be two holes' - a double green.
export const DOUBLE_GREEN = 1300;
// Two holes into one green come from ways this far apart (radians) at
// least.
const DOUBLE_APART = (55 * Math.PI) / 180;
// A hole's other tees: in a row along its line, this near it and this far
// behind (or in front of) the tee it's played from.
const ROW_SIDE = 13;
const ROW_BACK = 120;
// Where the drive lands, for a bend (metres from the tee).
const BEND_FROM = 150;
const BEND_TO = 330;
// The most holes one course is (as courseFromMap builds).
const MOST_HOLES = 18;
// What a short hole with nothing mown between tee and green earns.
const PAR3 = 0.55;
// The least a pairing can score and still be a hole.
const LEAST_SCORE = -0.6;

const r2 = (v) => Math.round(v * 100) / 100;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const parForLength = (metres) => {
  const yards = metres / YARD;
  return yards <= 250 ? 3 : yards <= 480 ? 4 : 5;
};

// A shape's middle, size and long way: { at, area, axis: [dx, dz] unit,
// long: how much longer than wide (1 round) }.
export function shapeInfo(poly) {
  const at = polygonCentroid(poly);
  const area = Math.abs(polygonArea(poly));
  let sxx = 0;
  let szz = 0;
  let sxz = 0;
  for (const [x, z] of poly) {
    const u = x - at[0];
    const v = z - at[1];
    sxx += u * u;
    szz += v * v;
    sxz += u * v;
  }
  const n = poly.length || 1;
  sxx /= n;
  szz /= n;
  sxz /= n;
  const tr = sxx + szz;
  const det = sxx * szz - sxz * sxz;
  const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
  const l1 = tr / 2 + disc;
  const l2 = Math.max(1e-9, tr / 2 - disc);
  const ang = 0.5 * Math.atan2(2 * sxz, sxx - szz);
  return { at, area, axis: [Math.cos(ang), Math.sin(ang)], long: Math.sqrt(l1 / l2) };
}

// How much of a line lies on fairway, from `from` metres along it to `to`
// (a share, 0 - 1): sampled every 4 m.
function onFairway(mask, line, from, to) {
  if (!mask || to <= from) return 0;
  let n = 0;
  let on = 0;
  let s0 = 0;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1];
    const b = line[i];
    const len = dist(a, b);
    for (let s = Math.max(from, s0); s < Math.min(to, s0 + len); s += 4) {
      const t = (s - s0) / (len || 1);
      n++;
      if (mask.at(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)) on++;
    }
    s0 += len;
  }
  return n ? on / n : 0;
}
const lineLength = (line) => line.reduce((s, p, i) => (i ? s + dist(line[i - 1], p) : 0), 0);

// The spot a line crosses into shapes (other greens, buildings) at: how
// many of `polys` (with their boxes) it runs through, sampled every 3 m.
function crossings(line, list) {
  let n = 0;
  for (const s of list) {
    let hit = false;
    for (let i = 1; i < line.length && !hit; i++) {
      const a = line[i - 1];
      const b = line[i];
      const len = dist(a, b);
      const bx = s.box;
      if (Math.max(a[0], b[0]) < bx.x0 || Math.min(a[0], b[0]) > bx.x1 || Math.max(a[1], b[1]) < bx.z0 || Math.min(a[1], b[1]) > bx.z1) continue;
      for (let d = 0; d <= len; d += 3) {
        const t = d / (len || 1);
        if (insidePolygon(s.poly, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)) {
          hit = true;
          break;
        }
      }
    }
    if (hit) n++;
  }
  return n;
}

const boxed = (poly) => {
  let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
  for (const [x, z] of poly) {
    x0 = Math.min(x0, x);
    z0 = Math.min(z0, z);
    x1 = Math.max(x1, x);
    z1 = Math.max(z1, z);
  }
  return { x0, z0, x1, z1 };
};

// The best line from a tee to a green's target down the fairway: straight,
// or bent once where the drive lands, through the fairway's middle.
// Returns { line, fairway: share of it on fairway }.
export function bestLine(tee, target, mask, bendSpots) {
  const d = dist(tee, target);
  const straight = [tee, target];
  const span = (line) => [Math.min(BEND_FROM * 0.8, lineLength(line) * 0.35), lineLength(line) - 35];
  const share = (line) => onFairway(mask, line, ...span(line));
  let best = { line: straight, fairway: share(straight), score: share(straight) };
  if (!mask || d < FAIRWAY_FROM || best.fairway > 0.85) return best;
  const dir = [(target[0] - tee[0]) / d, (target[1] - tee[1]) / d];
  for (const p of bendSpots) {
    const u = (p[0] - tee[0]) * dir[0] + (p[1] - tee[1]) * dir[1];
    const v = Math.abs((p[0] - tee[0]) * -dir[1] + (p[1] - tee[1]) * dir[0]);
    const out = Math.hypot(u, v);
    if (out < BEND_FROM || out > Math.min(BEND_TO, d - 60) || v > Math.min(0.5 * u, 140)) continue;
    const line = [tee, p, target];
    const f = share(line);
    // A bend has to earn its place: a longer way round costs a little.
    const score = f - (0.6 * (lineLength(line) - d)) / d - 0.04;
    if (score > best.score) best = { line, fairway: f, score };
  }
  if (best.line.length === 3) best.line[1] = centred(best.line, mask);
  return best;
}

// A bend moved across to the middle of the fairway it's on (the lines put
// in by eye ran along a fairway's edge as often as down its middle:
// tools/realcourses/centurion-wip).
function centred(line, mask) {
  const [a, p, b] = line;
  const d1 = [p[0] - a[0], p[1] - a[1]];
  const d2 = [b[0] - p[0], b[1] - p[1]];
  const l1 = Math.hypot(...d1) || 1;
  const l2 = Math.hypot(...d2) || 1;
  const t = [d1[0] / l1 + d2[0] / l2, d1[1] / l1 + d2[1] / l2];
  const tl = Math.hypot(...t) || 1;
  const across = [-t[1] / tl, t[0] / tl];
  if (!mask.at(p[0], p[1])) return p.map(r2);
  let lo = 0;
  let hi = 0;
  while (lo > -80 && mask.at(p[0] + across[0] * (lo - 1), p[1] + across[1] * (lo - 1))) lo--;
  while (hi < 80 && mask.at(p[0] + across[0] * (hi + 1), p[1] + across[1] * (hi + 1))) hi++;
  const m = (lo + hi) / 2;
  return [r2(p[0] + across[0] * m), r2(p[1] + across[1] * m)];
}

// Spots a bend might be at: the fairways on a 9 m grid.
function fairwaySpots(mask) {
  if (!mask) return [];
  const out = [];
  const step = Math.max(1, Math.round(9 / mask.cell));
  for (let r = 0; r < mask.nz; r += step) {
    for (let c = 0; c < mask.nx; c += step) {
      if (mask.data[r * mask.nx + c]) out.push([mask.x0 + (c + 0.5) * mask.cell, mask.z0 + (r + 0.5) * mask.cell]);
    }
  }
  return out;
}

// Whether a spot is the course's own: inside its outline (or near it:
// a tee box by the fence), where the map has one.
export const OUTLINE_REACH = 25;
const ownSpot = (outline) => {
  const rings = (outline ?? []).filter((r) => r?.length >= 3);
  if (!rings.length) return () => true;
  return ([x, z]) => rings.some((r) => insidePolygon(r, x, z) || distanceToEdge(r, x, z) <= OUTLINE_REACH);
};

// The course's shapes as the finder reads them. (outline: the course's
// own, where the map has it - a box fetched round a course takes in its
// neighbours' greens and tees too; theirs are left out.)
function readShapes({ greens = [], tees = [], fairways = [], pins = [], buildings = [], outline = [] }) {
  const own = ownSpot(outline);
  const g = greens.map((poly, i) => ({ i, poly, box: boxed(poly), ...shapeInfo(poly) })).filter((s) => s.area >= 60 && own(s.at));
  for (const s of g) {
    s.pins = pins.filter((p) => insidePolygon(s.poly, p[0], p[1]));
    s.room = s.pins.length >= 2 || s.area >= DOUBLE_GREEN ? 2 : 1;
  }
  const t = tees.map((poly, i) => ({ i, poly, ...shapeInfo(poly) })).filter((s) => s.area >= 8 && own(s.at));
  const box = boxOf([...greens, ...tees, ...fairways], 30);
  const mask = fairways.length && box ? shapeMask(fairways, gridOver(box, 2)) : null;
  const blocks = buildings.filter((b) => b.length >= 3).map((poly) => ({ poly, box: boxed(poly) }));
  return { g, t, mask, blocks };
}

// How much of the ground behind a tee (back along its line, either side)
// is fairway: a share, 0 - 1.
const BEHIND_TEE = { from: 12, to: 150, side: 22 };
const BESIDE = 1.6;
export function fairwayBehind(mask, at, way) {
  let n = 0;
  let on = 0;
  for (let u = BEHIND_TEE.from; u <= BEHIND_TEE.to; u += 6) {
    for (let v = -BEHIND_TEE.side; v <= BEHIND_TEE.side; v += 11) {
      n++;
      if (mask.at(at[0] - way[0] * u - way[1] * v, at[1] - way[1] * u + way[0] * v)) on++;
    }
  }
  return n ? on / n : 0;
}

// How well tee box `t` plays to green `g` - or null if it can't.
function pairing(t, g, ctx) {
  const d = dist(t.at, g.at);
  if (d < HOLE_REACH.least || d > HOLE_REACH.most) return null;
  if (insidePolygon(g.poly, t.at[0], t.at[1]) || distanceToEdge(g.poly, t.at[0], t.at[1]) < 12) return null;
  const dir = [(g.at[0] - t.at[0]) / d, (g.at[1] - t.at[1]) / d];
  let score = 0;
  // The tee box drawn along the line.
  if (t.long >= 1.25) score += 0.9 * (Math.abs(t.axis[0] * dir[0] + t.axis[1] * dir[1]) - 0.75) * Math.min(1, (t.long - 1) / 0.8);
  // The green drawn along the way into it.
  if (g.long >= 1.35 && g.room === 1) score += 0.3 * (Math.abs(g.axis[0] * dir[0] + g.axis[1] * dir[1]) - 0.6);
  // Down a fairway, if it's long enough to want one; not across another
  // green or through a building. (A bend down the fairway that takes the
  // line across one is weighed against the straight line: the real links'
  // 3rd bent through a shelter.)
  const others = ctx.g.filter((o) => o !== g);
  const byLine = (line, fairway) => {
    let v = 0;
    if (ctx.mask) {
      if (d >= FAIRWAY_FROM) v += 2.2 * fairway - 0.9;
      else v -= 0.4 * Math.max(0, fairway - 0.3);
      // A tee stands behind the fairway it's played down, not beside one
      // that runs on back past it (that's another hole's, played the
      // other way or from further back).
      const way = [(line[1][0] - t.at[0]) / (dist(line[1], t.at) || 1), (line[1][1] - t.at[1]) / (dist(line[1], t.at) || 1)];
      v -= BESIDE * fairwayBehind(ctx.mask, t.at, way);
    }
    // A short hole over rough or water, nothing mown between: a par 3.
    if (d >= 90 && d < FAIRWAY_FROM + 25 && (!ctx.mask || fairway < 0.35)) v += PAR3;
    const crossed = 1.2 * crossings(line, others) + 2 * crossings(line, ctx.blocks);
    return { line, fairway, v: v - crossed, crossed };
  };
  let way = bestLine(t.at, g.at, ctx.mask, ctx.spots);
  way = byLine(way.line, way.fairway);
  if (way.crossed > 0 && way.line.length > 2) {
    const straight = [t.at, g.at];
    const other = byLine(straight, onFairway(ctx.mask, straight, Math.min(BEND_FROM * 0.8, d * 0.35), d - 35));
    if (other.v > way.v) way = other;
  }
  const { line, fairway } = way;
  score += way.v;
  // Its other tees in a row behind it (a back tee is a sure sign of the
  // line).
  let row = 0;
  for (const o of ctx.t) {
    if (o === t) continue;
    const u = (o.at[0] - t.at[0]) * dir[0] + (o.at[1] - t.at[1]) * dir[1];
    const v = Math.abs((o.at[0] - t.at[0]) * -dir[1] + (o.at[1] - t.at[1]) * dir[0]);
    if (u < -ROW_BACK || u > Math.min(80, d * 0.3) || v > ROW_SIDE || Math.abs(u) < 4) continue;
    row++;
  }
  score += Math.min(0.45, 0.15 * row);
  // Lengths most holes are.
  if (d < 95) score -= (95 - d) / 60;
  if (d > 560) score -= (d - 560) / 80;
  return { t, g, d, dir, line, fairway, score };
}

// The tee boxes in a row along a hole (its line from tee box `t`): the
// boxes behind and in front of it, near the line.
function rowOf(t, dir, d, list) {
  return list.filter((o) => {
    if (o === t) return true;
    const u = (o.at[0] - t.at[0]) * dir[0] + (o.at[1] - t.at[1]) * dir[1];
    const v = Math.abs((o.at[0] - t.at[0]) * -dir[1] + (o.at[1] - t.at[1]) * dir[0]);
    return u >= -ROW_BACK && u <= Math.min(90, d * 0.35) && v <= ROW_SIDE;
  });
}

// The club's card, where it's given: how far a hole's length (metres) is
// off its card's yards (a share, to CARD.cap at most), and what that's
// worth - in pairings' score, choosing the holes (CARD.weight a share), and
// in metres of walk, numbering them (CARD.route).
export const CARD = { cap: 0.3, weight: 4, route: 400 };
export const offCard = (metres, c) => (c?.yards > 0 ? Math.min(CARD.cap, Math.abs(metres / YARD - c.yards) / c.yards) : 0);
// The least the holes can be off the card, each hole any number's (assign).
export function cardCost(lengths, card) {
  if (!card?.length || !lengths.length) return 0;
  const cost = lengths.map((m) => card.map((c) => offCard(m, c)));
  // (More holes than the card: the rest cost the most.)
  for (const row of cost) while (row.length < lengths.length) row.push(CARD.cap);
  return assign(cost).reduce((sum, j, i) => sum + cost[i][j], 0);
}

// The holes' order: the walk from each green to the next tee as short as
// it goes (the first tee near the clubhouse, and on 18 holes the 9th green
// and 10th tee back by it, where there's a clubhouse) - and, given the
// club's card ([{ par, yards }] by number), each hole as long as the
// card's of its number from one of its tees (holes' `lengths`, metres,
// one from each box of its row): the order is the walk's, and the card
// says where it starts - the 1st where no clubhouse can say. Returns the
// order.
export function routeHoles(holes, clubhouse = null, card = null) {
  const n = holes.length;
  if (n < 2) return holes.map((_, i) => i);
  const walk = (a, b) => dist(holes[a].green, holes[b].tee);
  const byCard = card?.length && holes.every((h) => h.lengths?.length);
  const offOf = (h, c) => Math.min(...h.lengths.map((m) => offCard(m, c)));
  const cost = (order, withCard = false) => {
    let c = 0;
    for (let k = 1; k < n; k++) c += walk(order[k - 1], order[k]);
    if (withCard) for (let k = 0; k < Math.min(n, card.length); k++) c += CARD.route * offOf(holes[order[k]], card[k]);
    if (clubhouse) {
      c += 0.6 * dist(clubhouse, holes[order[0]].tee) + 0.4 * dist(holes[order[n - 1]].green, clubhouse);
      if (n === 18) c += 0.25 * (dist(holes[order[8]].green, clubhouse) + dist(clubhouse, holes[order[9]].tee));
    }
    return c;
  };
  let best = null;
  const tried = [];
  for (let s = 0; s < n; s++) {
    // Nearest next tee from each green.
    const order = [s];
    const left = new Set(holes.map((_, i) => i).filter((i) => i !== s));
    while (left.size) {
      const last = order[order.length - 1];
      let pick = -1;
      for (const j of left) if (pick < 0 || walk(last, j) < walk(last, pick)) pick = j;
      order.push(pick);
      left.delete(pick);
    }
    // Then better: one hole moved elsewhere, or two swapped, while that
    // shortens it.
    let c = cost(order);
    for (let pass = 0, better = true; better && pass < 40; pass++) {
      better = false;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (i === j) continue;
          const moved = order.slice();
          const [h] = moved.splice(i, 1);
          moved.splice(j, 0, h);
          const mc = cost(moved);
          const swapped = order.slice();
          [swapped[i], swapped[j]] = [swapped[j], swapped[i]];
          const sc = cost(swapped);
          if (mc < c - 1e-6 || sc < c - 1e-6) {
            const take = mc <= sc ? moved : swapped;
            order.splice(0, n, ...take);
            c = Math.min(mc, sc);
            better = true;
          }
        }
      }
    }
    if (!best || c < best.c) best = { order: order.slice(), c };
    tried.push(order.slice());
  }
  if (!byCard) return best.order;
  // With the card: of every order tried (one from each first hole), and
  // each started from any of its holes, the one the card and the walk
  // say.
  let start = null;
  for (const order of tried) {
    for (let r = 0; r < n; r++) {
      const turned = [...order.slice(r), ...order.slice(0, r)];
      const c = cost(turned, true);
      if (!start || c < start.c - 1e-6) start = { order: turned, c };
    }
  }
  return start.order;
}

// Where on its green a hole is played to: its own flag where the map has
// one (the nearest of a double green's two to its own side), else the
// green's middle - or, a double green's, the middle of its half on the side
// the hole's own line comes from, along the green.
function targetOn(g, from, sharedWith) {
  if (g.pins.length === 1) return g.pins[0];
  if (g.pins.length > 1) return g.pins.slice().sort((a, b) => dist(a, from) - dist(b, from))[0];
  if (!sharedWith) return g.at;
  // A double green's two halves along its long way: this hole the half
  // whose end its own tee is nearer, against the other hole's.
  const half = Math.sqrt(g.area / Math.PI) * 0.45 * Math.min(1.6, g.long);
  const ends = [
    [g.at[0] + g.axis[0] * half, g.at[1] + g.axis[1] * half],
    [g.at[0] - g.axis[0] * half, g.at[1] - g.axis[1] * half],
  ];
  const mine = dist(ends[0], from) - dist(ends[1], from);
  const theirs = dist(ends[0], sharedWith) - dist(ends[1], sharedWith);
  const pick = mine < theirs ? 0 : 1;
  const p = ends[pick];
  return insidePolygon(g.poly, p[0], p[1]) ? p : g.at;
}

// The best way of giving each green a tee (the Hungarian method): rows
// are the greens' places for a hole (a double green has two), columns the
// tee boxes and then one "none" for each place. cost[i][j]: what it costs
// (lower is better). Returns, for each row, its column.
export function assign(cost) {
  const n = cost.length;
  if (!n) return [];
  const m = cost[0].length;
  const INF = 1e18;
  const u = new Float64Array(n + 1);
  const v = new Float64Array(m + 1);
  const p = new Int32Array(m + 1);
  const way = new Int32Array(m + 1);
  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Float64Array(m + 1).fill(INF);
    const done = new Uint8Array(m + 1);
    do {
      done[j0] = 1;
      const i0 = p[j0];
      let delta = INF;
      let j1 = 0;
      const row = cost[i0 - 1];
      for (let j = 1; j <= m; j++) {
        if (done[j]) continue;
        const cur = row[j - 1] - u[i0] - v[j];
        if (cur < minv[j]) {
          minv[j] = cur;
          way[j] = j0;
        }
        if (minv[j] < delta) {
          delta = minv[j];
          j1 = j;
        }
      }
      for (let j = 0; j <= m; j++) {
        if (done[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else minv[j] -= delta;
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0);
  }
  const out = new Array(n).fill(-1);
  for (let j = 1; j <= m; j++) if (p[j]) out[p[j] - 1] = j - 1;
  return out;
}

// What a green having a hole is worth beside its pairing's own score: a
// green on a course is far likelier to be played to than not.
const GREEN_WANTS = 0.5;
// The cost of a pairing that can't be.
const NEVER = 1e6;
const angleOf = (a, b) => Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1])));
// Two holes off one row of tees going this near the same way are one hole
// played from two of its tees.
const SAME_WAY = (35 * Math.PI) / 180;
// ...unless they're further apart along it than one bank of tees: a back
// or forward tee is its own hole's.
const BANK = 30;
const alongOf = (p, o) => (o.at[0] - p.t.at[0]) * p.dir[0] + (o.at[1] - p.t.at[1]) * p.dir[1];
// Two holes' lines running side by side this near, the same way there,
// this far (metres), are one fairway taken twice.
const ALONGSIDE = { near: 22, far: 90 };
// Whether hole p can't be played beside hole q: q teeing off p's row of
// tees the same way (two holes can tee off one bank of tees the ways they
// go - only not the same way, nor from a bank of their own along it), both
// coming into one green the same way, their lines one fairway taken
// twice, or across each other.
function clashing(p, q, free) {
  const sameRow = q.g !== p.g && rowOf(p.t, p.dir, p.d, free).includes(q.t) && (angleOf(q.dir, p.dir) < SAME_WAY || Math.abs(alongOf(p, q.t)) > BANK);
  const sameWay = q.g === p.g && angleOf(q.dir, p.dir) < DOUBLE_APART;
  return sameRow || sameWay || alongside(p, q);
}

// Whether two holes' lines cross, away from their ends (the tenth of each
// at either end left out: holes tee off by another's green, and share
// greens). Neither course it's held to has two holes crossing; the
// suggestion for the real links had six, every one a hole wrong.
const ENDS = 0.1;
function across(a, b) {
  const trim = (line) => {
    const len = lineLength(line);
    const from = pointOn(line, len * ENDS);
    const to = pointOn(line, len * (1 - ENDS));
    const mid = [];
    let s = 0;
    for (let i = 1; i < line.length - 1; i++) {
      s += dist(line[i - 1], line[i]);
      if (s > len * ENDS && s < len * (1 - ENDS)) mid.push(line[i]);
    }
    return [from, ...mid, to];
  };
  const side = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  const A = trim(a);
  const B = trim(b);
  for (let i = 1; i < A.length; i++) {
    for (let j = 1; j < B.length; j++) {
      const [p, q, r, t] = [A[i - 1], A[i], B[j - 1], B[j]];
      if (side(p, q, r) !== side(p, q, t) && side(r, t, p) !== side(r, t, q)) return true;
    }
  }
  return false;
}

// The holes chosen made better as a whole: a hole given another tee, two
// holes' tees swapped, or a hole given another green, none clashing, while
// the whole comes out higher - the pairings' scores, less CROSSED for each
// two holes whose lines cross and, where the club's card is given,
// CARD.weight for each share a hole is off it (any hole any number's:
// cardCost). (The walk from green to tee was tried as a third: on neither
// course it's held to did it find more holes.)
const CROSSED = 0.5;
function madeBetter(chosen, { pairOf, free, places, ruled, intoKept, card }) {
  const n = chosen.length;
  if (n < 2) return chosen;
  const ok = (p) => p && !ruled.has(`${p.t.i}:${p.g.i}`) && !intoKept(p);
  const fits = (list, i, p) => list.every((q, k) => k === i || (!clashing(p, q, free) && !clashing(q, p, free)));
  let list = chosen.slice();
  // Which two cross, kept and worked out again only for the holes changed.
  let cross = list.map((p, i) => list.map((q, j) => i !== j && across(p.line, q.line)));
  const crossings = (m) => m.reduce((sum, row) => sum + row.filter(Boolean).length, 0) / 2;
  const value = (l, m) => l.reduce((sum, p) => sum + p.score, 0) - CROSSED * crossings(m) - (card ? CARD.weight * cardCost(l.map((p) => lineLength(p.line)), card) : 0);
  let best = value(list, cross);
  const tryChange = (changes) => {
    const next = list.slice();
    for (const [i, p] of changes) next[i] = p;
    const m = cross.map((row) => row.slice());
    for (const [i] of changes) for (let j = 0; j < n; j++) if (j !== i) m[i][j] = m[j][i] = across(next[i].line, next[j].line);
    const v = value(next, m);
    if (v <= best + 1e-6 || !changes.every(([i, p]) => fits(next, i, p))) return false;
    list = next;
    cross = m;
    best = v;
    return true;
  };
  for (let pass = 0, moved = true; moved && pass < 12; pass++) {
    moved = false;
    for (let i = 0; i < n; i++) {
      // Another tee.
      for (const t of free) {
        if (list.some((q) => q.t === t)) continue;
        const p = pairOf(list[i].g, t);
        if (ok(p) && tryChange([[i, p]])) moved = true;
      }
      // Two holes' tees swapped.
      for (let j = i + 1; j < n; j++) {
        const x = pairOf(list[i].g, list[j].t);
        const y = pairOf(list[j].g, list[i].t);
        if (ok(x) && ok(y) && tryChange([[i, x], [j, y]])) moved = true;
      }
      // Another green, with room for a hole.
      for (const g of new Set(places)) {
        if (g === list[i].g || places.filter((x) => x === g).length <= list.filter((q) => q.g === g).length) continue;
        const p = pairOf(g, list[i].t);
        if (ok(p) && tryChange([[i, p]])) moved = true;
      }
    }
  }
  return list;
}

function alongside(p, q) {
  let run = 0;
  const len = lineLength(p.line);
  for (let s = 0; s <= len; s += 6) {
    const near = nearLine(q.line, pointOn(p.line, s), true);
    if (near.d <= ALONGSIDE.near && angleOf(wayOn(p.line, s), near.way) < SAME_WAY) {
      run += 6;
      if (run >= ALONGSIDE.far) return true;
    }
  }
  return false;
}
// The way a line goes `s` metres along it (a unit vector).
function wayOn(line, s) {
  let left = s;
  for (let i = 1; i < line.length; i++) {
    const len = dist(line[i - 1], line[i]);
    if (left <= len || i === line.length - 1) return [(line[i][0] - line[i - 1][0]) / (len || 1), (line[i][1] - line[i - 1][1]) / (len || 1)];
    left -= len;
  }
  return [1, 0];
}
function pointOn(line, s) {
  let left = s;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1];
    const b = line[i];
    const len = dist(a, b);
    if (left <= len || i === line.length - 1) {
      const t = Math.min(1, left / (len || 1));
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
    left -= len;
  }
  return line[line.length - 1];
}
// How near a spot is to a line (and, asked, the way the line goes there).
function nearLine(line, p, withWay = false) {
  let best = Infinity;
  let way = [1, 0];
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1];
    const b = line[i];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz || 1)));
    const d = Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dz * t);
    if (d < best) {
      best = d;
      const len = Math.hypot(dx, dz) || 1;
      way = [dx / len, dz / len];
    }
  }
  return withWay ? { d: best, way } : best;
}

// The suggestion. course: { greens, tees, fairways, pins, buildings } (outlines
// [[x, z], ...] and spots) and clubhouse ([x, z] or null); keep: holes
// already settled - [{ green: index, tees: [indexes], dir }] - whose greens
// and tees aren't offered again. Returns { holes: [{ green, tees (the tee
// boxes in its row, back to front), tee (the one it's played from), line,
// length, par, shared }], practice: [greens nothing plays to], spare: [tee
// boxes in no hole's row] } - holes in the order they're played.
//
// Every green is given a tee at once, the best way for the course as a
// whole (assign): taking each pairing best first gave a par 3's tee to the
// long hole beyond it, and that hole's tee to the next. Then where two
// holes share a row of tees, or a double green's two holes come in the
// same way, the weaker pairing is ruled out and it's done again.
export function suggestHoles(course, { keep = [], clubhouse = null, most = MOST_HOLES, card = null } = {}) {
  card = Array.isArray(card) && card.some((c) => c?.yards > 0) ? card : null;
  const ctx = readShapes(course);
  ctx.spots = fairwaySpots(ctx.mask);
  const room = new Map(ctx.g.map((s) => [s.i, s.room]));
  const used = new Set();
  const into = new Map(); // green -> [ways in] of the holes kept
  for (const k of keep) {
    if (room.has(k.green)) room.set(k.green, room.get(k.green) - 1);
    for (const t of k.tees ?? []) used.add(t);
    if (k.dir) into.set(k.green, [...(into.get(k.green) ?? []), k.dir]);
  }
  const free = ctx.t.filter((t) => !used.has(t.i));
  const places = [];
  for (const g of ctx.g) for (let k = 0; k < (room.get(g.i) ?? 0); k++) places.push(g);
  // Every pairing worth a look, by green and tee.
  const scored = new Map();
  const pairOf = (g, t) => {
    const key = `${t.i}:${g.i}`;
    if (!scored.has(key)) {
      const p = pairing(t, g, { ...ctx, t: free });
      scored.set(key, p && p.score > LEAST_SCORE ? p : null);
    }
    return scored.get(key);
  };
  const ruled = new Set();
  const intoKept = (p) => (into.get(p.g.i) ?? []).some((w) => angleOf(w, p.dir) < DOUBLE_APART);
  let chosen = [];
  for (let round = 0; round < 400; round++) {
    const cost = places.map((g, pi) => {
      const row = new Array(free.length + places.length).fill(NEVER);
      free.forEach((t, j) => {
        const p = pairOf(g, t);
        if (p && !ruled.has(`${t.i}:${g.i}`)) row[j] = -(p.score + GREEN_WANTS);
      });
      row[free.length + pi] = 0;
      return row;
    });
    const picks = assign(cost);
    chosen = [];
    picks.forEach((j, pi) => {
      if (j < 0 || j >= free.length) return;
      const p = pairOf(places[pi], free[j]);
      if (p) chosen.push(p);
    });
    // Where two holes clash, the weaker is ruled out.
    let clash = null;
    const weaker = (x) => {
      if (!clash || x.score < clash.score) clash = x;
    };
    for (const p of chosen) {
      for (const q of chosen) if (q !== p && clashing(p, q, free)) weaker(p.score < q.score ? p : q);
      // A kept hole's way into this green.
      if (intoKept(p)) weaker(p);
    }
    if (!clash) break;
    ruled.add(`${clash.t.i}:${clash.g.i}`);
  }
  // No more than a course's holes: the weakest left out.
  chosen.sort((a, b) => b.score - a.score);
  chosen = chosen.slice(0, Math.max(0, most - keep.length));
  // Then made better as a whole.
  chosen = madeBetter(chosen, { pairOf, free, places, ruled, intoKept, card });
  // Each hole's row of tees: the boxes along its line, none another hole
  // tees off from, each box the row of the hole whose line it's nearest.
  const starts = new Set(chosen.map((p) => p.t));
  const off = (p, o) => Math.abs((o.at[0] - p.t.at[0]) * -p.dir[1] + (o.at[1] - p.t.at[1]) * p.dir[0]);
  const rows = new Map(chosen.map((p) => [p, rowOf(p.t, p.dir, p.d, free).filter((o) => o === p.t || !starts.has(o))]));
  for (const p of chosen) {
    rows.set(
      p,
      rows.get(p).filter((o) => o === p.t || chosen.every((q) => q === p || !rows.get(q).includes(o) || off(p, o) <= off(q, o))),
    );
  }
  for (const p of chosen) for (const o of rows.get(p)) used.add(o.i);
  // Each hole played from the middle of its row of tees (the everyday
  // tee; the ones behind are the back tees, in front the forward ones).
  const made = chosen.map((h) => {
    const along = (o) => (o.at[0] - h.t.at[0]) * h.dir[0] + (o.at[1] - h.t.at[1]) * h.dir[1];
    const row = rows.get(h).slice().sort((a, b) => along(a) - along(b));
    const tee = row[Math.floor((row.length - 1) / 2)];
    return { g: h.g, row, tee, dir: h.dir, score: h.score };
  });
  const order = routeHoles(
    made.map((h) => ({ tee: h.tee.at, green: h.g.at, ...(card ? { lengths: h.row.map((o) => lineLength(bestLine(o.at, h.g.at, ctx.mask, ctx.spots).line)) } : {}) })),
    clubhouse,
    card,
  );
  const ordered = order.map((i) => made[i]);
  // With the card, each hole played from the tee of its row whose length
  // to its green is the card's for its number.
  if (card) {
    ordered.forEach((h, k) => {
      if (!(card[k]?.yards > 0) || h.row.length < 2) return;
      const lengthFrom = (o) => lineLength(bestLine(o.at, h.g.at, ctx.mask, ctx.spots).line);
      h.tee = h.row.reduce((a, o) => (offCard(lengthFrom(o), card[k]) < offCard(lengthFrom(a), card[k]) ? o : a), h.tee);
    });
  }
  // Lines, now that each hole's neighbour on a double green is known.
  const out = ordered.map((h, k) => {
    const partner = ordered.find((o, j) => j !== k && o.g === h.g);
    const target = targetOn(h.g, h.tee.at, partner?.tee.at ?? null);
    const { line } = bestLine(h.tee.at, target, ctx.mask, ctx.spots);
    const clean = line.map((p) => [r2(p[0]), r2(p[1])]);
    const length = lineLength(clean);
    return {
      green: h.g.i,
      tees: h.row.map((o) => o.i),
      tee: h.tee.i,
      line: clean,
      length: Math.round(length),
      par: parForLength(length),
      shared: partner ? ordered.indexOf(partner) : null,
      sure: Math.round(h.score * 100) / 100,
    };
  });
  const greensUsed = new Set([...out.map((h) => h.green), ...keep.map((k) => k.green)]);
  return {
    holes: out,
    practice: ctx.g.filter((g) => !greensUsed.has(g.i)).map((g) => g.i),
    spare: ctx.t.filter((t) => !used.has(t.i)).map((t) => t.i),
  };
}

// The clubhouse among a course's buildings: one the map names or calls a
// clubhouse, else the biggest. [x, z] or null.
export function clubhouseOf(buildings = [], named = []) {
  const say = named.findIndex((n) => /club\s*house|clubhouse|pavilion/i.test(n ?? ""));
  const pick = say >= 0 ? buildings[say] : buildings.slice().sort((a, b) => Math.abs(polygonArea(b)) - Math.abs(polygonArea(a)))[0];
  return pick?.length >= 3 ? polygonCentroid(pick) : null;
}

// (For the tests: the finder's own steps.)
export const finderParts = { readShapes, pairing, fairwaySpots, rowOf };
