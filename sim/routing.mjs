// A designed course's routing: where each hole sits on the course's ground
// (the owner: "it seems to like to just create a figure of eight at the
// moment can we just make that a bit more realistic to what golf courses
// are like ... normally hole nine or hole ten will be coming back towards
// the clubhouse, and then you have sort of a first bunch of holes that go
// out and come back, and then you have a last bunch of holes that go out
// and come back ... have them sort of flicking backwards and forwards
// between holes").
//
// Each nine - the whole course, for nine holes or fewer - goes out from the
// clubhouse and comes back to it: its first tee and its last green beside
// the clubhouse, the front nine on one side of it and the back nine on the
// other. Within a nine the holes mostly turn back alongside the one before
// - out, back, out - side by side with room between, as a parkland course
// goes, and never cross another hole (by the course map's own measure,
// below). It's found by a search, hole by hole, keeping the best few ways
// of carrying on (a beam): each scored for turning back alongside the hole
// before, heading out in the first half of the nine and home in the
// second, and keeping together; the nine whose last green comes home
// nearest the clubhouse wins. Another seed, another arrangement ("they
// might go in different arrangements"). Pure, and kept for the same holes
// and seed (the course map asks often).

import { holeFrame, insidePolygon, distanceToEdge } from "./terrain.mjs";
import { seeded, blobOutline } from "./course.mjs";
import { canSee, sightLines, SIGHT } from "./sight.mjs";

// ---- Holes that cross (the course map's measure: coursewide.mjs) -------------------

// How close two holes' lines of play may come (metres) - a fairway and the
// rough either side - before they're crossing; and how much of each end
// doesn't count (a green beside the next tee is how a course goes round).
export const CLEARANCE = 45;
export const END_ALLOWANCE = 25;

// How far apart two holes' lines must stay: CLEARANCE, less for short
// holes (half the shorter one's length, at least 12 m).
export const clearanceFor = (lenA, lenB) => Math.min(CLEARANCE, Math.max(12, 0.5 * Math.min(lenA, lenB)));

export const lineLength = (line) => {
  let d = 0;
  for (let i = 1; i < line.length; i++) {
    const dx = line[i][0] - line[i - 1][0];
    const dz = line[i][1] - line[i - 1][1];
    d += Math.sqrt(dx * dx + dz * dz);
  }
  return d;
};

// The line between `from` and `to` metres along a polyline.
export function trimmed(line, from, to) {
  const out = [];
  let s = 0;
  for (let i = 1; i < line.length; i++) {
    const [ax, az] = line[i - 1];
    const [bx, bz] = line[i];
    const len = Math.sqrt((bx - ax) * (bx - ax) + (bz - az) * (bz - az));
    if (s + len >= from && s <= to) {
      const k = len || 1;
      if (!out.length) {
        const d = Math.max(from, s);
        out.push([ax + ((bx - ax) * (d - s)) / k, az + ((bz - az) * (d - s)) / k]);
      }
      const d = Math.min(to, s + len);
      out.push([ax + ((bx - ax) * (d - s)) / k, az + ((bz - az) * (d - s)) / k]);
    }
    s += len;
  }
  return out;
}

// The line a hole is measured by: its line of play less a little at each
// end, in proportion for a short hole.
export function measuredLine(line, len = lineLength(line)) {
  const end = Math.min(END_ALLOWANCE, len * 0.25);
  return trimmed(line, end, Math.max(end + 1, len - end));
}

// The nearest two segments come: { d, at: [x, z] } (at: halfway between).
export function segGap([a, b], [c, d]) {
  const ix = (p, q, r, s) => {
    const den = (q[0] - p[0]) * (s[1] - r[1]) - (q[1] - p[1]) * (s[0] - r[0]);
    if (Math.abs(den) < 1e-9) return null;
    const t = ((r[0] - p[0]) * (s[1] - r[1]) - (r[1] - p[1]) * (s[0] - r[0])) / den;
    const u = ((r[0] - p[0]) * (q[1] - p[1]) - (r[1] - p[1]) * (q[0] - p[0])) / den;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t] : null;
  };
  const hit = ix(a, b, c, d);
  if (hit) return { d: 0, at: hit };
  const toSeg = (p, s0, s1) => {
    const dx = s1[0] - s0[0];
    const dz = s1[1] - s0[1];
    let t = ((p[0] - s0[0]) * dx + (p[1] - s0[1]) * dz) / (dx * dx + dz * dz || 1);
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
    const qx = s0[0] + dx * t;
    const qz = s0[1] + dz * t;
    const diffX = p[0] - qx;
    const diffZ = p[1] - qz;
    return { d: Math.sqrt(diffX * diffX + diffZ * diffZ), at: [(p[0] + qx) / 2, (p[1] + qz) / 2] };
  };
  const s1 = toSeg(a, c, d);
  let best = s1;
  const s2 = toSeg(b, c, d);
  if (s2.d < best.d) best = s2;
  const s3 = toSeg(c, a, b);
  if (s3.d < best.d) best = s3;
  const s4 = toSeg(d, a, b);
  if (s4.d < best.d) best = s4;
  return best;
}

export function lineGap(l1, l2) {
  let best = { d: Infinity, at: null };
  for (let i = 1; i < l1.length; i++) {
    for (let j = 1; j < l2.length; j++) {
      const g = segGap([l1[i - 1], l1[i]], [l2[j - 1], l2[j]]);
      if (g.d < best.d) best = g;
    }
  }
  return best;
}

// The same, quickly, for the search: squared distances, nothing made.
function pointSeg2(px, pz, ax, az, bx, bz) {
  const vx = bx - ax;
  const vz = bz - az;
  const l2 = vx * vx + vz * vz || 1;
  let t = ((px - ax) * vx + (pz - az) * vz) / l2;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const qx = ax + vx * t - px;
  const qz = az + vz * t - pz;
  return qx * qx + qz * qz;
}
const orient = (ax, az, bx, bz, cx, cz) => (bx - ax) * (cz - az) - (bz - az) * (cx - ax);
function segDist2(ax, az, bx, bz, cx, cz, dx, dz) {
  const o1 = orient(ax, az, bx, bz, cx, cz);
  const o2 = orient(ax, az, bx, bz, dx, dz);
  const o3 = orient(cx, cz, dx, dz, ax, az);
  const o4 = orient(cx, cz, dx, dz, bx, bz);
  if (((o1 > 0 && o2 < 0) || (o1 < 0 && o2 > 0)) && ((o3 > 0 && o4 < 0) || (o3 < 0 && o4 > 0))) return 0;
  return Math.min(pointSeg2(ax, az, cx, cz, dx, dz), pointSeg2(bx, bz, cx, cz, dx, dz), pointSeg2(cx, cz, ax, az, bx, bz), pointSeg2(dx, dz, ax, az, bx, bz));
}
// The gap between two lines. Two stretches whose boxes are further apart
// than the nearest found so far can't be nearer, so aren't measured; cap:
// further than this needn't be known (the answer is then cap).
function gapOf(l1, l2, cap = Infinity) {
  let best = cap * cap;
  for (let i = 1; i < l1.length; i++) {
    const ax = l1[i - 1][0];
    const az = l1[i - 1][1];
    const bx = l1[i][0];
    const bz = l1[i][1];
    const x0 = ax < bx ? ax : bx;
    const x1 = ax < bx ? bx : ax;
    const z0 = az < bz ? az : bz;
    const z1 = az < bz ? bz : az;
    for (let j = 1; j < l2.length; j++) {
      const cx = l2[j - 1][0];
      const cz = l2[j - 1][1];
      const dx = l2[j][0];
      const dz = l2[j][1];
      const gx = Math.max(0, x0 - (cx > dx ? cx : dx), (cx < dx ? cx : dx) - x1);
      const gz = Math.max(0, z0 - (cz > dz ? cz : dz), (cz < dz ? cz : dz) - z1);
      // (A hair's slack: the box's gap and the measure round differently.)
      if (gx * gx + gz * gz > best * (1 + 1e-9) + 1e-9) continue;
      const d = segDist2(ax, az, bx, bz, cx, cz, dx, dz);
      if (d < best) best = d;
      if (best === 0) return 0;
    }
  }
  return Math.sqrt(best);
}
const boxOf = (line) => {
  let x0 = Infinity;
  let z0 = Infinity;
  let x1 = -Infinity;
  let z1 = -Infinity;
  for (const [x, z] of line) {
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (z < z0) z0 = z;
    if (z > z1) z1 = z;
  }
  return { x0, z0, x1, z1 };
};
const boxGap = (a, b) => {
  const dx = Math.max(0, a.x0 - b.x1, b.x0 - a.x1);
  const dz = Math.max(0, a.z0 - b.z1, b.z0 - a.z1);
  return Math.sqrt(dx * dx + dz * dz);
};

// ---- The routing ---------------------------------------------------------------------

export const ROUTING = {
  // The clubhouse is at [0, 0]: each nine's first tee this far out from it
  // on its own side, and its last green to come home within homeReach.
  startOut: 30,
  homeReach: 90,
  // Side by side: lines this much further apart than they must be.
  room: 12,
  // Ways of carrying on kept at each hole, and headings tried.
  beam: 16,
  headings: 24,
  // A strategic course's (sim/architect.mjs: its holes have a plan): more
  // room between holes - fairways about 61 m apart, near the 70 yards
  // architects lay them out at - and its par 3s each played a different way.
  wideRoom: 16,
  par3Apart: 1.5,
  // ...and a little for each way round the compass (of 8) not yet played,
  // so the wind comes at every angle.
  newWay: 0.5,
  // A strategic course with a nine that won't come home laid out again
  // with the whole course turned by these (radians), in turn.
  turns: [0.5, -0.5, 1, -1, 1.6, -1.6, Math.PI],
  // A next tee at least this far (metres) from the edge of the green just
  // played - a short course's at least 0.6 of its walk to the next tee -
  // and what one nearer costs, all of it on the green, less as it's
  // further off (Golf Sim Links' 18th tee was 1.4 m from the 17th green;
  // Nine Oaks Mountain's 9th on the 8th).
  teeOff: 15,
  teeNear: 20,
};

// A strategic course on hills (docs/COURSE-DESIGN-PLAN.md, phase 5): how
// its holes go over the ground (metres; the architects' rules of thumb).
// Each broken costs the way round it's found by (ROUTING's scores); none
// is ruled out, as the holes must still fit.
export const CLIMB = {
  // Most climb on the walk from a green to the next tee.
  walk: 5,
  // Most a par 3 climbs, and any other hole (a climbing hole's drives land
  // on a shelf: sim/landforms.mjs).
  par3Up: 10,
  holeUp: 15,
  // Most the last hole of the round climbs, home to the clubhouse.
  home: 8,
  // Within this much a hole plays level; no more than inARow holes in a row
  // climbing (or falling); and the holes about a third each up, down and
  // level.
  level: 2,
  inARow: 3,
  // A par 3 played down from high ground - one at least (Stanley
  // Thompson's).
  par3Down: 4,
  // What a hole costs (as ROUTING's scores) if the flag can't be seen from
  // where its second shot's played, or its drive's landing from the tee
  // (sim/sight.mjs): MacKenzie's "minimum of blindness".
  blind: 3,
  blindTee: 2.5,
};

const round1 = (v) => Math.round(v * 10) / 10;
const round3 = (v) => Math.round(v * 1000) / 1000;
const median = (list) => {
  const s = [...list].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};

// How far a hole's green is from its tee, as the crow flies.
const reach = (line) => {
  const dx = line.end[0] - line.path[0][0];
  const dz = line.end[1] - line.path[0][1];
  return Math.sqrt(dx * dx + dz * dz);
};

// A hole's line of play, and its green (its edge, if it has one), in its
// own frame.
function holeLine(hole) {
  const path = hole?.layout?.path?.length > 1 ? hole.layout.path : [[0, 0], [300, 0]];
  const end = hole?.layout?.pin ?? path[path.length - 1];
  const sight = sightLines({ path, par: hole?.spec?.par ?? hole?.layout?.par });
  const green = hole?.layout?.green ? blobOutline(hole.layout.green, 32) : null;
  // (How far its edge reaches from the pin.)
  // (A loop rather than Math.max over a mapped copy: no arrays made.)
  let greenReach = 0;
  if (green) {
    greenReach = -Infinity;
    for (let i = 0; i < green.length; i++) {
      const dx = green[i][0] - end[0];
      const dz = green[i][1] - end[1];
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d > greenReach) greenReach = d;
    }
  }
  return { path, end, len: Math.max(1, lineLength(path)), sight, green, greenReach };
}

// The holes in nines: one for nine holes or fewer, else the front half and
// the back.
export function ninesOf(count) {
  if (count <= 9) return [Array.from({ length: count }, (_, i) => i)];
  const front = Math.ceil(count / 2);
  return [Array.from({ length: front }, (_, i) => i), Array.from({ length: count - front }, (_, i) => front + i)];
}

const kept = new Map();

// Each hole's place: { x, z, heading } - its tee in metres east and north
// of the clubhouse, and the way it plays (radians, 0 east, anticlockwise).
// holes: the course's holes ({ layout: { path, pin } }). seed: which of
// the arrangements. ground: for a strategic course on hills, the ground's
// height (x, z) - the holes routed over it (CLIMB) - and groundKey, which
// ground it is (for keeping the routing).
export function routeHoles(holes, { seed = 1, ground = null, groundKey = null } = {}) {
  const lines = holes.map(holeLine);
  // A strategic course routed its way (ROUTING.wideRoom, par3Apart).
  const strategic = holes.some((h) => h?.layout?.plan);
  const pars = holes.map((h) => h?.spec?.par ?? h?.layout?.par ?? null);
  const hills = strategic && typeof ground === "function" ? ground : null;
  // (Kept by exactly what it's routed from - each hole's line, pin, green
  // and sight lines as they are, not rounded: a routing kept for nearly the
  // same holes was one a fresh load wouldn't make.)
  const key = JSON.stringify([seed, strategic, strategic ? pars : 0, lines.map((h) => [h.path, h.end, h.green, h.sight]), hills ? groundKey : 0]);
  const keep = !hills || groundKey != null;
  if (keep && kept.has(key)) return kept.get(key).map((p) => ({ ...p }));
  const out = route(lines, seed, strategic ? pars : null, hills);
  if (keep) {
    if (kept.size > 24) kept.delete(kept.keys().next().value);
    kept.set(key, out);
  }
  return out.map((p) => ({ ...p }));
}

function route(lines, seed, pars = null, ground = null) {
  const n = lines.length;
  if (!n) return [];
  const rand = seeded(seed * 7919 + n);
  // Sizes for the course: a chip and putt's holes go closer together.
  const typical = median(lines.map((h) => h.len));
  const spacing = clearanceFor(typical, typical) + (pars ? ROUTING.wideRoom : ROUTING.room);
  const walk = Math.min(35, Math.max(12, typical * 0.1 + 10));
  const teeOff = Math.min(ROUTING.teeOff, walk * 0.6);
  const homeReach = Math.min(ROUTING.homeReach, Math.max(30, typical * 0.3));
  // The way the front nine goes out; the back nine the other way.
  let outward = rand() * Math.PI * 2;
  const nines = ninesOf(n);
  if (ground && pars) outward = outwardOnHills(outward, nines, lines, { spacing, walk, teeOff, homeReach, rand, clubhouse: [0, 0], pars, ground });
  // The course laid out going out one way. A strategic course with a nine
  // that won't come home is laid out again with the whole course turned
  // (ROUTING.turns), the first way that brings every nine home kept - as
  // it was if none does.
  const laid = (out0) => {
    const placed = []; // [{ i, line (course), measured }]
    const places = new Array(n);
    let loose = 0;
    for (const [k, nine] of nines.entries()) {
      const out = out0 + k * Math.PI;
      const opts = { out, spacing, walk, teeOff, homeReach, placed, rand, clubhouse: [0, 0], pars, ground, home: k === nines.length - 1 };
      let best = routeNine(nine, lines, opts);
      // A strategic course's nine that won't come home: tried again with a
      // little less room between holes, then (on hills) as it'd go on the
      // flat.
      if (pars && best.loose) {
        for (const more of [{ spacing: spacing - ROUTING.wideRoom + ROUTING.room }, ...(ground ? [{ ground: null }] : [])]) {
          const again = routeNine(nine, lines, { ...opts, ...more });
          if (!again.loose) {
            best = again;
            break;
          }
        }
      }
      if (best.loose) loose++;
      for (const step of best) {
        places[step.i] = { x: round1(step.tee[0]), z: round1(step.tee[1]), heading: round3(step.heading) };
        const rise = ground ? ground(step.end[0], step.end[1]) - ground(step.tee[0], step.tee[1]) : 0;
        placed.push({ i: step.i, line: step.line, measured: step.measured, box: step.box, len: lines[step.i].len, heading: step.heading, rise });
      }
    }
    return { places, loose };
  };
  const first = laid(outward);
  if (!pars || !first.loose) return first.places;
  for (const turn of ROUTING.turns) {
    const again = laid(outward + turn);
    if (!again.loose) return again.places;
  }
  return first.places;
}

// One nine's holes, out and home: the steps [{ i, tee, heading, line,
// measured, box, end }] of the best way found. Its first hole and its last
// are put down first, side by side at the clubhouse - the first heading
// out, the last coming home - and the holes between are searched for, from
// the first green round to the last tee. A few ways of putting the two
// down are tried (the seed picks which), and the best nine kept - marked
// loose if none came round to a last hole beside the clubhouse.
function routeNine(nine, lines, opts) {
  const { rand } = opts;
  const total = nine.length;
  const kit = nineKit(lines, opts);
  if (total <= 2) return shortNine(nine, kit);
  const firstI = nine[0];
  const lastI = nine[total - 1];
  // The ways tried: the first hole out on one side, the last home from the
  // other - a V from the clubhouse, more or less open - so the holes
  // between go round from one arm to the other.
  const tries = [];
  for (const sideOf of [1, -1]) for (const open of [0.5, 0.75, 1]) tries.push({ sideOf, lean1: open, lean9: open * (0.8 + rand() * 0.4), taste: rand() });
  tries.sort((a, b) => a.taste - b.taste);
  for (const t of tries) Object.assign(t, nineEnds(nine, t, kit));
  // On hills, the ways whose first and last holes go best over the ground
  // tried first (the 18th not a big climb home).
  if (opts.ground) {
    for (const t of tries) t.climb = endsCost(t, kit);
    tries.sort((a, b) => a.taste + a.climb - (b.taste + b.climb));
  }
  let best = null;
  let firstFits = null;
  for (const t of tries) {
    // Enough tried once one's found: the seed's taste picks among them.
    if (best && tries.indexOf(t) >= 3) break;
    const { first, last } = t;
    if (kit.clash(first, lines[firstI].len, [{ ...last, len: lines[lastI].len }]) < 0) continue;
    if (kit.clash(first, lines[firstI].len, opts.placed) < 0) continue;
    firstFits ??= first;
    if (kit.clash(last, lines[lastI].len, opts.placed) < 0) continue;
    const middle = searchMiddle(nine.slice(1, -1), first, last, kit);
    if (!middle) continue;
    // On hills, the first hole's and the last's climbs too.
    const hills = kit.hillCost(first, kit.clubhouse, []) + kit.hillCost(last, null, [first, ...middle.steps], { home: opts.home });
    const score = middle.score - hills;
    if (!best || score > best.score) best = { score, steps: [first, ...middle.steps, last] };
  }
  if (best) return best.steps;
  // No way round to a last hole put down beside the clubhouse: the holes
  // searched for from the first on, the last coming home as near as it can
  // - crossing nothing unless nothing else will do (the course map says
  // so, to move apart or let cross).
  return Object.assign(freeNine(nine, firstFits ?? fallbackNine(nine.slice(0, 1), kit)[0], kit), { loose: true });
}

// A nine's first hole and last, for a way of putting them down ({ sideOf,
// lean1, lean9 }): the first heading out from beside the clubhouse on one
// side, the last coming home to its green beside it on the other.
function nineEnds(nine, { sideOf, lean1, lean9 }, kit) {
  const half = kit.spacing / 2;
  const firstI = nine[0];
  const lastI = nine[nine.length - 1];
  const tee1 = kit.at(kit.start, kit.out + (sideOf * Math.PI) / 2, half);
  const h1 = kit.out + sideOf * lean1;
  const first = kit.climbed({ i: firstI, tee: tee1, heading: h1, ...kit.lay(firstI, tee1, h1) });
  const green9 = kit.at(kit.start, kit.out - (sideOf * Math.PI) / 2, half);
  const h9 = kit.out + Math.PI - sideOf * lean9;
  const tee9 = kit.teeFor(lastI, green9, h9);
  const last = kit.climbed({ i: lastI, tee: tee9, heading: h9, ...kit.lay(lastI, tee9, h9) });
  return { first, last };
}

// On hills, what a nine's first and last holes cost (CLIMB).
const endsCost = ({ first, last }, kit) => kit.hillCost(first, kit.clubhouse, []) + kit.hillCost(last, null, [], { home: kit.lastNine });

// On hills, which way a strategic course goes out from the clubhouse: the
// way the seed picked (outward), or that turned by eighths of a circle -
// whichever has the nines' first and last holes, those beside the
// clubhouse, going best over the ground (CLIMB: their climbs, the 18th's
// home, what can be seen from their tees).
function outwardOnHills(outward, nines, lines, base) {
  let best = outward;
  let least = Infinity;
  for (let k = 0; k < 8; k++) {
    const o = outward + (k * Math.PI) / 4;
    let cost = 0;
    for (const [j, nine] of nines.entries()) {
      if (nine.length <= 2) continue;
      const kit = nineKit(lines, { ...base, out: o + j * Math.PI, placed: [], home: j === nines.length - 1 });
      let fewest = Infinity;
      for (const sideOf of [1, -1]) for (const open of [0.5, 0.75, 1]) fewest = Math.min(fewest, endsCost(nineEnds(nine, { sideOf, lean1: open, lean9: open }, kit), kit));
      cost += fewest;
    }
    if (cost < least - 1e-9) {
      least = cost;
      best = o;
    }
  }
  return best;
}

// A nine searched for from its first hole on, its second half pulled
// home, its last green as near the clubhouse as it'll go.
function freeNine(nine, first, kit) {
  const { lines, spacing, walk, placed, rand, clubhouse, homeReach } = kit;
  const total = nine.length;
  const left = new Array(nine.length);
  for (let k = 0; k < nine.length; k++) {
    let d = 0;
    for (let j = k + 1; j < nine.length; j++) {
      d += lines[nine[j]].len * 0.8 + walk;
    }
    left[k] = d;
  }
  const keepOff = (spacing * 0.6) ** 2;
  let beam = [{ steps: [first], score: 0 }];
  for (let k = 1; k < total; k++) {
    const i = nine[k];
    const len = lines[i].len;
    const next = [];
    const loose = [];
    for (const state of beam) {
      const prev = state.steps[k - 1];
      const others = placed.slice();
      for (let s = 0; s < state.steps.length; s++) {
        const st = state.steps[s];
        others.push({ measured: st.measured, box: st.box, len: lines[st.i].len });
      }
      for (const [turnBy, d] of kit.steps) {
        const tee = kit.at(prev.end, prev.heading + turnBy, d);
        const near = kit.teeNear(prev, tee);
        for (let h = 0; h < ROUTING.headings; h++) {
          const heading = kit.out + (h - ROUTING.headings / 2) * kit.turn;
          const cand = kit.lay(i, tee, heading);
          const roomLeft = kit.clash(cand, len, others);
          if (roomLeft < 0) continue;
          const now = kit.home(cand.end);
          const step = kit.climbed({ i, tee, heading, ...cand });
          // Kept as a way out if all else is boxed in: crossing nothing,
          // nearest home.
          loose.push({ steps: [...state.steps, step], score: state.score - now / spacing - 20 - near });
          if (cand.measured.some((p) => kit.side(p) < -spacing * 0.4)) continue;
          if (cand.measured.some((p, j) => j && pointSeg2(clubhouse[0], clubhouse[1], cand.measured[j - 1][0], cand.measured[j - 1][1], p[0], p[1]) < keepOff)) continue;
          let score = state.score - near;
          const back = -Math.cos(heading - prev.heading);
          score += back * 3;
          if (back > 0.5) score += 2 * Math.exp(-(((gapOf(cand.measured, prev.measured) - spacing) / (spacing * 0.5)) ** 2));
          const was = kit.home(prev.end);
          score += ((k < total / 2 ? now - was : was - now) / Math.max(60, len)) * 1.2;
          if (now > left[k] + homeReach) score -= ((now - left[k] - homeReach) / spacing) * 3;
          let maxHome = -Infinity;
          for (let m = 0; m < cand.line.length; m++) {
            const h = kit.home(cand.line[m]);
            if (h > maxHome) maxHome = h;
          }
          score -= (maxHome / (spacing * 30)) * 0.8;
          score += Math.min(1, roomLeft / spacing) * 0.3 + rand() * 0.25;
          if (k === total - 1) score -= (Math.max(0, now - homeReach * 0.5) / Math.max(20, spacing)) * 4;
          score -= kit.sameWay(i, heading, state.steps);
          score -= kit.hillCost(step, prev.end, state.steps, { home: k === total - 1 && kit.lastNine });
          next.push({ steps: [...state.steps, step], score });
        }
      }
    }
    const pool = next.length ? next : loose;
    if (!pool.length) {
      // Truly boxed in: back alongside, crossing.
      const state = beam[0];
      const prev = state.steps[k - 1];
      const tee = kit.at(prev.end, prev.heading + Math.PI / 2, spacing);
      const heading = prev.heading + Math.PI;
      pool.push({ steps: [...state.steps, { i, tee, heading, ...kit.lay(i, tee, heading) }], score: state.score - 100 });
    }
    pool.sort((a, b) => b.score - a.score);
    const seen = new Set();
    beam = [];
    for (const st of pool) {
      const l = st.steps[st.steps.length - 1];
      const tag = `${Math.round(l.end[0] / 25)},${Math.round(l.end[1] / 25)},${Math.round(l.heading / 0.5)}`;
      if (seen.has(tag)) continue;
      seen.add(tag);
      beam.push(st);
      if (beam.length >= ROUTING.beam) break;
    }
  }
  return beam[0].steps;
}

// What the searches share for one nine.
function nineKit(lines, { out, spacing, walk, teeOff = ROUTING.teeOff, homeReach, placed, rand, clubhouse, pars = null, ground = null, home = false }) {
  const ux = Math.cos(out);
  const uz = Math.sin(out);
  const at = (p, a, d) => [p[0] + Math.cos(a) * d, p[1] + Math.sin(a) * d];
  const lay = (i, tee, heading) => {
    const f = holeFrame(tee, heading);
    const line = lines[i].path.map(f.toLocal);
    const measured = measuredLine(line, lines[i].len);
    return { line, measured, box: boxOf(measured), end: f.toLocal(lines[i].end) };
  };
  // Where a hole's tee goes for its green to be at `green`, playing `heading`.
  const teeFor = (i, green, heading) => {
    const f = holeFrame([0, 0], heading);
    const e = f.toLocal(lines[i].end);
    return [green[0] - e[0], green[1] - e[1]];
  };
  // What a tee at `p` costs for being near a placed hole's green (step:
  // { i, tee, heading, end }) - nothing from teeOff off its edge out.
  const teeNear = (step, p) => {
    const { green: g, greenReach } = lines[step.i];
    if (!g) return 0;
    const dx = p[0] - step.end[0];
    const dz = p[1] - step.end[1];
    if (dx * dx + dz * dz > (greenReach + teeOff) * (greenReach + teeOff)) return 0;
    const [x, z] = holeFrame(step.tee, step.heading).toHole(p);
    const off = insidePolygon(g, x, z) ? 0 : distanceToEdge(g, x, z);
    return off < teeOff ? ROUTING.teeNear * (1 - off / teeOff) : 0;
  };
  // How a hole sits with others: -1 if it crosses one (the course map's
  // measure, with a little room), else the room it leaves (up to spacing).
  const clash = (cand, len, others) => {
    let worst = spacing;
    for (const o of others) {
      const need = clearanceFor(len, o.len) + 4;
      if (boxGap(cand.box, o.box) - need >= worst) continue;
      // (Only nearer than need + worst changes anything.)
      const g = gapOf(cand.measured, o.measured, need + worst) - need;
      if (g < 0) return -1;
      if (g < worst) worst = g;
    }
    return worst;
  };
  // A strategic course's par 3 played the way another par 3 already is
  // (within about 25 degrees): what it costs, against those placed and
  // those in `steps`.
  const sector = (h) => ((Math.round(h / (Math.PI / 4)) % 8) + 8) % 8;
  const sameWay = (i, heading, steps) => {
    if (!pars) return 0;
    let cost = 0;
    const others = [...placed, ...steps];
    if (pars[i] === 3) for (const o of others) if (o.i !== i && pars[o.i] === 3 && Number.isFinite(o.heading) && Math.cos(heading - o.heading) > 0.9) cost += ROUTING.par3Apart;
    if (!others.some((o) => Number.isFinite(o.heading) && sector(o.heading) === sector(heading))) cost -= ROUTING.newWay;
    return cost;
  };
  // On hills (a strategic course's): a step with its climb (rise, tee to
  // green), and what it costs (CLIMB) - the walk up to its tee from `from`
  // (the green before, or the clubhouse), its climb, and how it goes with
  // the holes before it (the nines before, then `before`, in order). home:
  // the last hole of the round.
  const climbed = (step) => {
    if (!ground) return step;
    const f = holeFrame(step.tee, step.heading);
    const { from, land } = lines[step.i].sight;
    return { ...step, rise: ground(step.end[0], step.end[1]) - ground(step.tee[0], step.tee[1]), from: f.toLocal(from), land: land && f.toLocal(land) };
  };
  const over = (v, limit) => (v > limit ? ((v - limit) / 2.5) * 1.5 : 0);
  const way = (rise) => (rise > CLIMB.level ? 1 : rise < -CLIMB.level ? -1 : 0);
  const walkUp = (from, to) => (ground && from ? over(ground(to[0], to[1]) - ground(from[0], from[1]), CLIMB.walk) : 0);
  const hillCost = (step, from, before, { home = false } = {}) => {
    if (!ground) return 0;
    const rise = step.rise ?? 0;
    const earlier = [...placed, ...before];
    let cost = walkUp(from, step.tee);
    cost += over(rise, pars?.[step.i] === 3 ? CLIMB.par3Up : CLIMB.holeUp);
    if (home) cost += over(rise, CLIMB.home);
    const w = way(rise);
    if (w) {
      let run = 1;
      for (let k = earlier.length - 1; k >= 0 && way(earlier[k].rise ?? 0) === w; k--) run++;
      if (run > CLIMB.inARow) cost += (run - CLIMB.inARow) * 1.5;
    }
    const same = earlier.filter((o) => way(o.rise ?? 0) === w).length + 1;
    cost += Math.max(0, same - Math.ceil((earlier.length + 1) / 3) - 1) * 0.25;
    if (pars?.[step.i] === 3 && rise < -CLIMB.par3Down && !earlier.some((o) => pars[o.i] === 3 && (o.rise ?? 0) < -CLIMB.par3Down)) cost -= 1;
    // What can be seen: the flag for the second shot, the drive's landing.
    // (Looked at every 8 m: the hills' smallest rises are 80 m across.)
    if (step.from && !canSee(ground, step.from, step.end, { step: 8 })) cost += CLIMB.blind;
    if (step.land && !canSee(ground, step.tee, step.land, { top: SIGHT.landing, step: 8 })) cost += CLIMB.blindTee;
    return cost;
  };
  return {
    lines,
    pars,
    sameWay,
    climbed,
    hillCost,
    walkUp,
    lastNine: home,
    out,
    spacing,
    walk,
    homeReach,
    placed,
    rand,
    clubhouse,
    at,
    lay,
    teeFor,
    teeNear,
    clash,
    start: [clubhouse[0] + ux * ROUTING.startOut, clubhouse[1] + uz * ROUTING.startOut],
    side: (p) => (p[0] - clubhouse[0]) * ux + (p[1] - clubhouse[1]) * uz,
    home: (p) => {
      const dx = p[0] - clubhouse[0];
      const dz = p[1] - clubhouse[1];
      return Math.sqrt(dx * dx + dz * dz);
    },
    turn: (Math.PI * 2) / ROUTING.headings,
    // Ways from one green to the next tee, against the hole before's
    // heading: to the side (to come back alongside), on, and between.
    steps: [
      [Math.PI / 2, spacing * 0.95],
      [-Math.PI / 2, spacing * 0.95],
      [Math.PI / 4, walk * 1.3],
      [-Math.PI / 4, walk * 1.3],
      [0, walk],
      [(Math.PI * 3) / 4, walk * 1.3],
      [(-Math.PI * 3) / 4, walk * 1.3],
    ],
  };
}

// The holes between a nine's first and last: from the first's green round
// to the last's tee, never crossing. { steps, score } or null.
function searchMiddle(middle, first, last, kit) {
  const { lines, spacing, walk, placed, rand, clubhouse } = kit;
  const fixed = [...placed, { measured: first.measured, box: first.box, len: lines[first.i].len }, { measured: last.measured, box: last.box, len: lines[last.i].len }];
  const goal = last.tee;
  const total = middle.length;
  // How far the holes still to come could carry it, at most.
  const left = new Array(middle.length);
  for (let k = 0; k < middle.length; k++) {
    let d = 0;
    for (let j = k + 1; j < middle.length; j++) {
      d += lines[middle[j]].len * 0.85 + walk;
    }
    left[k] = d + walk * 1.8;
  }
  const keepOff = (spacing * 0.6) ** 2;
  let beam = [{ steps: [], score: 0 }];
  for (let k = 0; k < total; k++) {
    const i = middle[k];
    const len = lines[i].len;
    const next = [];
    for (const state of beam) {
      const prev = state.steps[k - 1] ?? first;
      const others = fixed.slice();
      for (let s = 0; s < state.steps.length; s++) {
        const st = state.steps[s];
        others.push({ measured: st.measured, box: st.box, len: lines[st.i].len });
      }
      for (const [turnBy, d] of kit.steps) {
        const tee = kit.at(prev.end, prev.heading + turnBy, d);
        // Its tee clear of the green before.
        const near = kit.teeNear(prev, tee);
        for (let h = 0; h < ROUTING.headings; h++) {
          const heading = kit.out + (h - ROUTING.headings / 2) * kit.turn;
          const cand = kit.lay(i, tee, heading);
          const dxGoal = cand.end[0] - goal[0];
          const dzGoal = cand.end[1] - goal[1];
          const toGoal = Math.sqrt(dxGoal * dxGoal + dzGoal * dzGoal);
          // Can the rest still reach the last hole's tee?
          if (toGoal > left[k]) continue;
          // Its own side of the clubhouse, and not over it.
          if (cand.measured.some((p) => kit.side(p) < -spacing * 0.4)) continue;
          if (cand.measured.some((p, j) => j && pointSeg2(clubhouse[0], clubhouse[1], cand.measured[j - 1][0], cand.measured[j - 1][1], p[0], p[1]) < keepOff)) continue;
          const roomLeft = kit.clash(cand, len, others);
          if (roomLeft < 0) continue;
          let score = state.score - near;
          // Back alongside the hole before (the owner's "flicking
          // backwards and forwards").
          const back = -Math.cos(heading - prev.heading);
          score += back * 3;
          if (back > 0.5) score += 2 * Math.exp(-(((gapOf(cand.measured, prev.measured) - spacing) / (spacing * 0.5)) ** 2));
          // Out for the first half (a little), then round towards the last
          // tee - always with room in hand to get there, as holes coming
          // back alongside each other don't go straight.
          const was = prev === first ? kit.home(first.end) : kit.home(prev.end);
          if (k < total / 2) score += ((kit.home(cand.end) - was) / Math.max(60, len)) * 0.4;
          else score -= (toGoal / Math.max(spacing, left[k])) * 1.5;
          const margin = left[k] - toGoal;
          if (margin < spacing * 3) score -= ((spacing * 3 - margin) / spacing) * 1.2;
          // A strategic course's: the hole before the last of the middle
          // ends about that hole's length from the last tee - not near it,
          // or the hole after can't come back to it.
          if (kit.pars && k === total - 2) score -= (Math.max(0, Math.abs(toGoal - reach(lines[middle[k + 1]])) - walk * 1.5) / spacing) * 4;
          // Together, not strung out.
          let maxHome = -Infinity;
          for (let m = 0; m < cand.line.length; m++) {
            const h = kit.home(cand.line[m]);
            if (h > maxHome) maxHome = h;
          }
          score -= (maxHome / (spacing * 30)) * 0.8;
          score += Math.min(1, roomLeft / spacing) * 0.3 + rand() * 0.25;
          if (k === total - 1) {
            // The walk on to the last hole's tee - not too near this
            // green - and turning back for it.
            score -= (Math.max(0, toGoal - walk * 1.2) / walk) * 3;
            score -= kit.teeNear({ i, tee, heading, end: cand.end }, goal);
            score += -Math.cos(last.heading - heading) * 3;
          }
          score -= kit.sameWay(i, heading, [first, last, ...state.steps]);
          const step = kit.climbed({ i, tee, heading, ...cand });
          score -= kit.hillCost(step, prev.end, [first, ...state.steps]);
          // ...and the walk on, up to the last hole's tee.
          if (k === total - 1) score -= kit.walkUp(step.end, last.tee);
          next.push({ steps: [...state.steps, step], score });
        }
      }
    }
    if (!next.length) return null;
    next.sort((a, b) => b.score - a.score);
    const seen = new Set();
    beam = [];
    for (const st of next) {
      const l = st.steps[st.steps.length - 1];
      const tag = `${Math.round(l.end[0] / 25)},${Math.round(l.end[1] / 25)},${Math.round(l.heading / 0.5)}`;
      if (seen.has(tag)) continue;
      seen.add(tag);
      beam.push(st);
      if (beam.length >= ROUTING.beam) break;
    }
  }
  return beam[0] ?? null;
}

// A nine of one or two holes: out, and back alongside.
function shortNine(nine, kit) {
  const half = kit.spacing / 2;
  const tee1 = kit.at(kit.start, kit.out + Math.PI / 2, half);
  const steps = [{ i: nine[0], tee: tee1, heading: kit.out, ...kit.lay(nine[0], tee1, kit.out) }];
  if (nine.length > 1) {
    const h = kit.out + Math.PI;
    const tee = kit.teeFor(nine[1], kit.at(kit.start, kit.out - Math.PI / 2, half), h);
    steps.push({ i: nine[1], tee, heading: h, ...kit.lay(nine[1], tee, h) });
  }
  return steps;
}

// When nothing fits: each hole back alongside the one before.
function fallbackNine(nine, kit) {
  const steps = [];
  let prev = null;
  for (const i of nine) {
    const tee = prev ? kit.at(prev.end, prev.heading + Math.PI / 2, kit.spacing) : kit.start;
    const heading = prev ? prev.heading + Math.PI : kit.out;
    prev = { i, tee, heading, ...kit.lay(i, tee, heading) };
    steps.push(prev);
  }
  return steps;
}
