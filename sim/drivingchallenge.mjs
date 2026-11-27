// The driving challenge: nine tee shots, each scored for how far it went
// and where it finished. Pure, so the rules can be tested; the game itself
// is drivingchallenge.js.
//
// Every hole is made from the game's seed in units of a drive: 1 is the
// player's own average driver distance (carry and roll). So everyone plays
// the same nine holes, each drawn to their own length - a fairway a fifth
// of a drive wide is 50 yards across for someone who hits it 250 and 40
// for someone who hits it 200. Points are the distance as a percentage of
// the player's own average, so a long hitter and a short one play on level
// terms: an average drive down the middle is 100 whoever hits it.

import { YARD, simulateShot } from "./flight.mjs";
import { seeded, makePath, pointAt, nearest, insideBlob, blobRadius, greenContours, surfaceAt, fairwayHalfWidth } from "./course.mjs";

export const DRIVING_HOLES = 9;
// When nothing else is known about a player's driving (yards).
export const DEFAULT_DRIVE = 230;
// The shortest and longest averages a hole is drawn for.
export const DRIVE_LIMITS = [120, 360];
// How many warm-up drives set an average, and how many range drives are
// looked back over.
export const WARMUP_DRIVES = 3;
const RANGE_DRIVES = 10;

// The average a hole's shape is written for: the fairway's wobble is
// measured against it (course.mjs fairwayHalfWidth's `stretch`).
const REF_YARDS = 250;

// A dog-leg's wood: how far before the corner it starts, and how much
// rough there is between it and the fairway (drives).
const WOOD_BEFORE = 0.25;
const WOOD_GAP = 0.008;

// How generous the fairways are: the option picked on the card, each with
// its own personal best.
export const FAIRWAYS = {
  standard: { name: "Standard fairways", width: 1 },
  generous: { name: "Generous fairways", width: 1.25 },
  tight: { name: "Tight fairways", width: 0.8 },
};

// The kinds of hole. `half` is half the fairway's width and `gap` how much
// rough there is beyond it before the trees, both in drives.
export const KINDS = {
  open: { name: "Wide open", half: 0.11, gap: 0.15, shape: "straight" },
  straight: { name: "Straight", half: 0.075, gap: 0.1, shape: "straight" },
  narrow: { name: "Narrow", half: 0.048, gap: 0.07, shape: "straight" },
  draw: { name: "Dog-leg left", half: 0.068, gap: 0.09, shape: "draw" },
  fade: { name: "Dog-leg right", half: 0.068, gap: 0.09, shape: "fade" },
  layup: { name: "Fairway runs out", half: 0.08, gap: 0.1, shape: "layup" },
};

// The nine holes of a game, before shuffling: a couple wide open, a couple
// narrow, one bending each way, one to lay up on, and one more of the
// shaped ones.
const MIX = ["open", "open", "straight", "narrow", "narrow", "draw", "fade", "layup"];

// ---- Scoring ----------------------------------------------------------------------

// What each place a drive can finish is worth. Off the fairway the points
// for distance lose `minus` (never going below nothing); in the trees, the
// water or lost, a flat score that's always the worst of all.
export const LIE_POINTS = {
  fairway: { name: "Fairway", minus: 0 },
  semi: { name: "First cut", minus: 15 },
  rough: { name: "Rough", minus: 40 },
  bunker: { name: "Bunker", minus: 50 },
  deep: { name: "Deep rough", minus: 60 },
  trees: { name: "Trees", flat: -25 },
  lost: { name: "Lost", flat: -50 },
  water: { name: "Water", flat: -50 },
};
// Other surfaces a drive could just reach count as one of those.
const SAME_AS = { tee: "fairway", fringe: "fairway", green: "fairway", greenside: "bunker", path: "fairway", waste: "rough" };

// The points for one drive.
//   lie      where it finished (course.mjs surfaceAt), penalty from playShot
//   along    yards down the hole (along the centreline, so round a dog-leg)
//   average  the player's average drive, yards
// Returns { points, percent, lie, name }.
// The most a drive can count for, as a share of the player's average: a
// drive a fifth longer than usual is a great one, and beyond that an
// average typed in too low can't keep paying.
export const MAX_PERCENT = 120;

export function drivePoints({ lie, penalty = null, along, average }) {
  const percent = Math.max(0, Math.round((100 * along) / average));
  const key = penalty ? (penalty.kind === "water" ? "water" : "lost") : (SAME_AS[lie] ?? (lie in LIE_POINTS ? lie : "rough"));
  const rule = LIE_POINTS[key];
  const points = rule.flat ?? Math.max(0, Math.min(percent, MAX_PERCENT) - rule.minus);
  return { points, percent, lie: key, name: rule.name };
}

// How good a whole game is, 0-1, for the size of the celebration: nine
// average drives all on the fairway is as good as it gets.
export function driveShare(total) {
  return Math.max(0, Math.min(1, total / (DRIVING_HOLES * 100)));
}

// ---- A player's average drive ------------------------------------------------------

export function clampDrive(yards) {
  return Math.round(Math.max(DRIVE_LIMITS[0], Math.min(DRIVE_LIMITS[1], yards)));
}

// A drive under this share of the middle one of its set is a mishit (a
// top or a duff), not the player's drive: it's left out of the average, so
// one bad swing can't draw all nine holes short (or, before topped balls
// stopped rolling for ever, 40% long).
export const MISHIT_SHARE = 0.7;

// The drives that count towards an average: the last ten, less any mishit.
export function countedDrives(totals) {
  const list = totals.filter((t) => Number.isFinite(t) && t > 0).slice(-RANGE_DRIVES);
  if (!list.length) return [];
  const sorted = [...list].sort((a, b) => a - b);
  const mid = sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
  return list.filter((t) => t >= mid * MISHIT_SHARE);
}

// Whether the last of these drives was left out as a mishit.
export function lastIsMishit(totals) {
  const last = totals[totals.length - 1];
  return Number.isFinite(last) && last > 0 && !countedDrives(totals).includes(last);
}

// The average of some drives (yards), or null with too few to go on:
// warm-ups need three that count (a mishit means another drive); the
// range the last ten, at least three of them counting.
export function averageDrive(totals, min = WARMUP_DRIVES) {
  const list = countedDrives(totals);
  if (list.length < min) return null;
  return clampDrive(list.reduce((a, t) => a + t, 0) / list.length);
}

// Where a player's average comes from: "typed", "last" (their last
// warm-up's), "stats" (their own driver numbers on record), "range" (this
// session's range drives), or "warmup" (three drives before their first
// hole). What they picked counts, if it can be had. Otherwise, playing
// alone, the range if there's a session there (with friends the range
// can't tell whose drives they were, and everyone would get the same
// holes); otherwise their last warm-up; otherwise their stats, which do
// know whose drives they were; otherwise a warm-up.
//   d      what's kept for the player: { how, yards, last }
//   range  whether the range has an average this session
//   alone  whether they're the only player
//   stats  whether their stats have a driver average
export function averageSource(d = {}, { range = false, alone = true, stats = false } = {}) {
  if (d.how === "typed" && d.yards) return "typed";
  if (d.how === "range" && range) return "range";
  if (d.how === "stats" && stats) return "stats";
  if (d.how === "warmup") return "warmup";
  if (d.how === "last" && d.last) return "last";
  if (alone && range) return "range";
  if (d.last) return "last";
  return stats ? "stats" : "warmup";
}

// Full drives on record before the stats' average is offered: fewer is too
// few to draw nine holes to.
export const STATS_DRIVES = 5;

// A player's average drive from their stats page's numbers (server/stats.mjs
// report: clubs[].club, n, totalMedian - the driver's full swings from a
// good lie, club not in doubt, struck well, carry and roll: the typical
// one, so a few topped drives on record don't pull it down), or null with
// too few drives.
export function statsDrive(report) {
  const dr = report?.clubs?.find?.((c) => c.club === "DR");
  const total = dr?.totalMedian ?? dr?.total;
  if (!dr || !(dr.n >= STATS_DRIVES) || !Number.isFinite(total) || total <= 0) return null;
  return clampDrive(total);
}

// How far a drive goes on flat ground, carry and roll, as the range would
// measure it: for the warm-up drives.
export function driveTotal(ball) {
  return simulateShot(ball, { surface: "fairway" }).total;
}

// ---- The holes, in drives -----------------------------------------------------------

// Rounds the corners of a line (Chaikin), keeping the ends. Only ever
// averages points, so it gives the same shape at any size.
function smooth(points, rounds = 3) {
  let pts = points;
  for (let r = 0; r < rounds; r++) {
    const out = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i];
      const [bx, bz] = pts[i + 1];
      if (i > 0) out.push([ax * 0.75 + bx * 0.25, az * 0.75 + bz * 0.25]);
      if (i < pts.length - 2) out.push([ax * 0.25 + bx * 0.75, az * 0.25 + bz * 0.75]);
    }
    out.push(pts[pts.length - 1]);
    pts = out;
  }
  return pts;
}

const deg = (d) => (d * Math.PI) / 180;
const r4 = (v) => Math.round(v * 1e4) / 1e4;

// The nine holes for a game, in drives: the same for everyone with this
// seed. Each is { number, kind, seed, length, path, fairway, treeLine,
// water, bunkers, trees, green, shape, aim, target, full, layupAt }.
export function drivingHoles(seed, fairways = "standard") {
  const rand = seeded(seed ^ 0x2c1b3c6d);
  const kinds = [...MIX, rand() < 0.5 ? "draw" : "fade"];
  // Shuffled, but never starting on the hardest: the first hole's a
  // straight one to settle in.
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
  }
  const first = kinds.findIndex((k) => k === "open" || k === "straight");
  [kinds[0], kinds[first]] = [kinds[first], kinds[0]];
  const width = (FAIRWAYS[fairways] ?? FAIRWAYS.standard).width;
  return kinds.map((kind, i) => {
    const u = unitHole(kind, Math.floor(rand() * 2 ** 31), i + 1, width);
    u.layback = laybackOf(u);
    return u;
  });
}

function unitHole(kind, seed, number, width) {
  const rand = seeded(seed);
  const K = KINDS[kind];
  const length = 1.5 + rand() * 0.2;
  const h0 = (rand() - 0.5) * 0.06;
  const bend = K.shape === "draw" ? -1 : K.shape === "fade" ? 1 : 0;
  // A dog-leg turns soon enough that a straight drive runs out of fairway
  // well short of a full one: to go the distance it has to curve with the
  // hole.
  const corner = 0.58 + rand() * 0.05;
  const turn = deg(33 + rand() * 5) * bend;
  let raw;
  if (bend) {
    const c = [Math.cos(h0) * corner, Math.sin(h0) * corner];
    const rest = length - corner;
    raw = [[0, 0], [c[0] * 0.5, c[1] * 0.5], c, [c[0] + Math.cos(h0 + turn) * rest, c[1] + Math.sin(h0 + turn) * rest]];
  } else {
    raw = [0, 0.35, 0.7, 1].map((k) => [Math.cos(h0) * length * k, Math.sin(h0) * length * k]);
  }
  // A dog-leg's corner is rounded less, so the bend is a real one.
  const pts = smooth(raw, bend ? 2 : 3).map(([x, z]) => [r4(x), r4(z)]);
  const path = makePath(pts);
  const half = K.half * width * (0.92 + rand() * 0.16);
  const treeLine = half + K.gap * (0.9 + rand() * 0.2);
  // Where the fairway ends: at the green, or short of the water on a hole
  // to lay up on.
  const layupAt = K.shape === "layup" ? 0.8 + rand() * 0.08 : null;
  const fairway = { from: 0.3, to: layupAt ?? null, half, phase: rand() * 6 };

  const water = [];
  const bunkers = [];
  if (layupAt) {
    // A pond right across the hole, from a little past the end of the
    // fairway to about a full drive: go for it and it's wet.
    const at = pointAt(path, layupAt + 0.1);
    water.push(blob(rand, at.p, Math.atan2(at.dir[1], at.dir[0]) + Math.PI / 2, treeLine * 1.15, 0.06));
  } else if (kind === "straight" || kind === "narrow" ? rand() < 0.5 : false) {
    // Water down one side of the landing area.
    const sign = rand() < 0.5 ? -1 : 1;
    const at = pointAt(path, 0.95);
    const off = half + 0.03 + 0.035;
    water.push(blob(rand, [at.p[0] - at.dir[1] * sign * off, at.p[1] + at.dir[0] * sign * off], Math.atan2(at.dir[1], at.dir[0]), 0.18, 0.035));
  }
  if (kind === "open" || kind === "straight" || bend) {
    // A bunker or two on the fairway's edge where drives come down; on a
    // dog-leg, on the outside of the corner, for the straight one.
    const n = kind === "open" ? 1 : 1 + Math.floor(rand() * 2);
    for (let i = 0; i < n; i++) {
      const s = 0.8 + rand() * 0.2;
      const at = pointAt(path, s);
      const sign = bend ? (i === 0 ? -bend : bend) : rand() < 0.5 ? -1 : 1;
      const off = half * (0.95 + rand() * 0.2);
      bunkers.push(blob(rand, [at.p[0] - at.dir[1] * sign * off, at.p[1] + at.dir[0] * sign * off], Math.atan2(at.dir[1], at.dir[0]), 0.04 + rand() * 0.015, 0.016 + rand() * 0.006));
    }
  }

  // Inside a dog-leg's corner, a wood of tall trees right up to the edge of
  // the fairway, from well before the corner to the green. Nothing carries
  // it (see woodStop), so a straight drive can't cut the corner: it's the
  // draw or fade round it, or play short.
  const wood = bend ? { side: bend, from: r4(corner - WOOD_BEFORE), gap: WOOD_GAP } : null;

  // Trees down both sides beyond the rough, two rows deep.
  const trees = [];
  if (wood) {
    const seen = [];
    for (let s = wood.from; s < length + 0.05; s += 0.032) {
      const at = pointAt(path, Math.min(s, length));
      const edge = half * 1.15 + WOOD_GAP;
      for (let off = edge + 0.014; off < treeLine + 0.09; off += 0.034) {
        const tx = at.p[0] - at.dir[1] * bend * off + (rand() - 0.5) * 0.012;
        const tz = at.p[1] + at.dir[0] * bend * off + (rand() - 0.5) * 0.012;
        const size = 2 + rand() * 0.8;
        const n = nearest(path, tx, tz);
        if (Math.sign(n.d) !== bend || Math.abs(n.d) < edge + 0.008) continue;
        if (seen.some(([x, z]) => Math.hypot(x - tx, z - tz) < 0.022)) continue;
        seen.push([tx, tz]);
        trees.push([r4(tx), r4(tz), Math.round(size * 100) / 100]);
      }
    }
  }
  for (let s = 0.06; s < length + 0.08; s += 0.03) {
    const at = pointAt(path, Math.min(s, length));
    for (const sign of [-1, 1]) {
      // The wood has its own trees.
      if (wood && sign === bend && s >= wood.from) continue;
      for (let row = 0; row < 2; row++) {
        const off = treeLine + 0.012 + row * 0.035 + rand() * 0.03;
        const tx = at.p[0] - at.dir[1] * sign * off + (rand() - 0.5) * 0.015;
        const tz = at.p[1] + at.dir[0] * sign * off + (rand() - 0.5) * 0.015;
        const size = 0.85 + rand() * 0.7;
        if (water.some((w) => insideBlob(w, tx, tz, 0.012))) continue;
        // Inside a dog-leg's corner a row can come in nearer the other leg.
        if (Math.abs(nearest(path, tx, tz).d) < treeLine + 0.008) continue;
        trees.push([r4(tx), r4(tz), Math.round(size * 100) / 100]);
      }
    }
  }

  // The green, at the end, in metres (it isn't scored, so it stays its real
  // size for everyone); the pin as a share of the way to its edge.
  const end = pointAt(path, path.length);
  const green = {
    rot: Math.atan2(end.dir[1], end.dir[0]),
    rx: 13 + rand() * 3,
    rz: 10.5 + rand() * 3,
    lobes: 2 + Math.floor(rand() * 2),
    phase: rand() * 6,
    depth: 0.05 + rand() * 0.09,
  };
  const pinPhi = rand() * Math.PI * 2;
  const pinShare = 0.15 + rand() * 0.45;

  // Where to go, and the way to get there: straight down the middle a full
  // drive, round the corner (starting down the first leg) or short of the
  // water.
  const full = layupAt ? layupAt - 0.04 : 1;
  const target = pointAt(path, full).p;
  const aim = bend ? h0 : Math.atan2(target[1], target[0]);
  return {
    number,
    kind,
    seed,
    length: path.length,
    path: pts,
    fairway,
    treeLine,
    water,
    bunkers,
    trees,
    green,
    pinPhi,
    pinShare,
    shape: K.shape,
    aim,
    target,
    full,
    layupAt,
    corner: bend ? corner : null,
    wood,
  };
}

function blob(rand, [x, z], rot, rx, rz) {
  return { x, z, rot, rx, rz, lobes: 2 + Math.floor(rand() * 2), phase: rand() * 6, depth: 0.05 + rand() * 0.09 };
}

// ---- A hole drawn for one player ------------------------------------------------------

// A hole in drives turned into a course layout (course.mjs's shape, in
// metres) for a player who averages `yards`. Everything that decides the
// score - the line of the hole, the fairway, the rough, water, bunkers and
// trees - is the hole multiplied by the same number, so it's exactly the
// same shape for everyone. `drive` carries what the game shows: the kind,
// the shape needed, the aim and the target line.
export function scaleHole(u, yards) {
  const k = yards * YARD;
  const P = ([x, z]) => [x * k, z * k];
  const blobAt = (b) => ({ ...b, x: b.x * k, z: b.z * k, rx: b.rx * k, rz: b.rz * k });
  const path = u.path.map(P);
  const end = path[path.length - 1];
  const green = { ...u.green, x: end[0], z: end[1] };
  const pinR = u.pinShare * blobRadius(green, u.pinPhi);
  const pin = [green.x + Math.cos(u.pinPhi + green.rot) * pinR, green.z + Math.sin(u.pinPhi + green.rot) * pinR];
  const length = u.length * k;
  const to = u.fairway.to != null ? u.fairway.to * k : length - blobRadius(green, Math.PI) * 0.8;
  const target = P(u.target);
  return {
    number: u.number,
    par: 4,
    yards: Math.round(u.length * yards),
    si: null,
    length,
    path,
    tee: { x: 0, z: 0, heading: Math.atan2(path[1][1], path[1][0]) },
    fairway: { from: u.fairway.from * k, to, half: u.fairway.half * k, phase: u.fairway.phase, stretch: k / (REF_YARDS * YARD) },
    treeLine: u.treeLine * k,
    // The rough's bands (first cut, deep rough, how far into the trees a
    // ball's lost) grow and shrink with the hole too, so a miss by the same
    // share of a drive finds the same rough for everyone.
    bandScale: yards / REF_YARDS,
    wood: u.wood ? { side: u.wood.side, from: u.wood.from * k, gap: u.wood.gap * k } : null,
    green,
    pin,
    contours: greenContours(seeded(u.seed), green, pin, "gentle"),
    bunkers: u.bunkers.map(blobAt),
    water: u.water.map(blobAt),
    trees: u.trees.map(([x, z, size]) => [x * k, z * k, size]),
    drive: {
      kind: u.kind,
      shape: u.shape,
      average: yards,
      aim: u.aim,
      target,
      line: targetLine(u).map(P),
      full: Math.round(u.full * yards),
      layback: u.layback != null ? Math.round(u.layback * yards) : null,
      layup: u.layupAt != null ? Math.round(u.layupAt * yards) : null,
      width: Math.round(u.fairway.half * 2 * yards),
    },
  };
}

// ---- The wood inside a dog-leg -------------------------------------------------------

// Whether (x, z) is in a dog-leg's wood: on the inside of the bend, beyond
// a thin strip of rough along the fairway's edge (the edge as it wobbles,
// so the trees follow it).
export function inWood(layout, x, z, path = makePath(layout.path)) {
  const w = layout.wood;
  if (!w) return false;
  const n = nearest(path, x, z);
  if (n.s < w.from || Math.sign(n.d) !== w.side) return false;
  // (Never nearer than most of the fairway's width, where its end rounds off.)
  const half = Math.max(fairwayHalfWidth(layout.fairway, n.s, Math.sign(n.d) || 1), layout.fairway.half * 0.9);
  return Math.abs(n.d) > half + w.gap;
}

// A drive (courseplay.mjs playShot's result) that goes into the wood,
// in the air or along the ground, stops there: the trees are too tall to
// carry at any length of drive, which is what makes the corner something
// to bend the ball round rather than fly over. The ball drops where it
// went in. Anything else comes back as it was.
export function woodStop(layout, res, path = makePath(layout.path)) {
  if (!layout.wood) return res;
  const pts = res.path;
  for (let i = 1; i < pts.length; i++) {
    const [x, y, z, t] = pts[i];
    if (!inWood(layout, x, z, path)) continue;
    const fall = Math.sqrt((2 * Math.max(0, y)) / 9.81);
    return {
      ...res,
      path: [...pts.slice(0, i + 1), [x, 0, z, t + fall + 0.05]],
      flightPoints: Math.min(res.flightPoints, i + 1),
      rest: [x, z],
      lie: "trees",
      holed: false,
      penalty: null,
      wood: true,
    };
  }
  return res;
}

// How far down a dog-leg's first leg a straight drive can go and still
// be safely on the fairway (drives): the "play it short" distance.
// Measured on the hole drawn at any size, since the shape's the same.
export function laybackOf(u) {
  if (!u.wood) return null;
  const L = scaleHole(u, REF_YARDS);
  const path = makePath(L.path);
  const k = REF_YARDS * YARD;
  const ok = (d) => {
    // Straight down the aim, with room either side and a bit of run.
    for (const side of [-0.5, 0, 0.5]) {
      for (const extra of [0, 0.04]) {
        const r = (d + extra) * k;
        const x = Math.cos(u.aim) * r - Math.sin(u.aim) * side * L.fairway.half;
        const z = Math.sin(u.aim) * r + Math.cos(u.aim) * side * L.fairway.half;
        if (surfaceAt(L, x, z, path) !== "fairway") return false;
      }
    }
    return true;
  };
  let d = 0.5;
  while (d < 1 && ok(d + 0.01)) d += 0.01;
  return r4(d);
}

// The line a drive should take, in drives, from the tee to the target:
// straight, or starting down the first leg of a dog-leg and curving round
// with it (a draw left, a fade right). Points for drawing it.
export function targetLine(u, n = 24) {
  const [tx, tz] = u.target;
  const reach = Math.hypot(tx, tz);
  // Where it's aimed at, half way: on the aim line.
  const c = [Math.cos(u.aim) * reach * 0.55, Math.sin(u.aim) * reach * 0.55];
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const b = 2 * (1 - t) * t;
    const d = t * t;
    pts.push([b * c[0] + d * tx, b * c[1] + d * tz]);
  }
  return pts;
}

// Yards down the hole to where a ball finished: along the centreline, so a
// drive round a dog-leg counts in full.
export function alongHole(layout, rest, path = makePath(layout.path)) {
  return nearest(path, rest[0], rest[1]).s / YARD;
}

// What to tell the player about a hole: its kind and what it asks for.
export function holeAdvice(drive) {
  switch (drive.shape) {
    case "draw":
      return `Needs a draw for full distance - or straight, no more than ${drive.layback} yds`;
    case "fade":
      return `Needs a fade for full distance - or straight, no more than ${drive.layback} yds`;
    case "layup":
      return `Fairway runs out at ${drive.layup} yds, water beyond - lay up`;
    default:
      return drive.kind === "narrow" ? "Narrow - keep it on the short grass" : drive.kind === "open" ? "Wide open - let it go" : "Straight away - find the fairway";
  }
}

// The short word for a hole's shape, for the list down the side.
export function shapeWord(shape, kind) {
  if (shape === "draw") return "Draw";
  if (shape === "fade") return "Fade";
  if (shape === "layup") return "Lay up";
  return KINDS[kind]?.name ?? "Straight";
}
