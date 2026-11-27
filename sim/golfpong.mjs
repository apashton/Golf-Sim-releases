// Golf pong (the owner: "a 1 v 1 game, playable online or versus a bot...
// holes like this, or all in a big horizontal line. Green can change in
// shape and shouldn't be flat but must be fair from both perspectives, so
// mirror image"). On a real practice green (the owner: "would like this on
// a 'normal' green with trees around, bunkers, clubhouse etc in the
// background. Backboard not needed. But even playing field is a must for
// all players, so if 3 players might need them all side by side on an
// identical part of the green"): a rack of six cups cut in the green for
// each player; take turns putting; a cup holed is covered (the ball rolls
// over it after that); the first to hole six wins. No backboard: a putt
// that runs past rolls on down the green, so pace matters - and one that
// runs right off the green is gone.
//
// Two players face each other from either end of a patch of the green
// (x along it from player 0's end, x = -L/2, to player 1's; z across it,
// metres - player 0 putts towards +x, with +z on their right, putting.mjs's
// frame), each putting at the other's rack. Everything is the same turned
// half a turn about the middle: the slopes, the racks, where each putts
// from, the green round them. So player 1, looking down the green from
// their end, sees exactly what player 0 sees from theirs.
//
// Four-way pong (the owner: "could have 4 way pong too?"): a rack in front
// of each of four sides of a square patch, each player putting from their
// own side at anyone else's cups; the same turned a quarter turn.
//
// Three can't be fair round a green that way, so they play side by side:
// a lane each, all putting the same way at a rack of their own at the far
// end, the ground the same lane to lane - the slopes repeat across the
// green every lane's width, so each lane, and its neighbours either side,
// are the same as every other's.
//
// Everyone at once (the owner: "add the everyone-putts-at-once option for
// pong. They need to wait before Thier second shot, unless a race option
// is ticked where speed also matters and players can keep retaking as
// they want"): rounds, each player putting once a round, all at the same
// time - or, racing, no rounds at all.
//
// Pure: putting.js draws and plays it, netgame.mjs plays it online.

import { rollBall, greenGradient, idealPutt, HOLE_RADIUS, FOOT } from "./putting.mjs";
import { seeded } from "./course.mjs";
import { MPH } from "./flight.mjs";

// The cups, as a rack of six at one end, in a formation (the owner: "add
// options for different shape formations"): each cup's place in units of
// the spacing between cups - u from the back of the rack towards whoever
// putts at it, v across it.
const R3 = Math.sqrt(3) / 2;
export const LAYOUTS = {
  triangle: { name: "Triangle, point to you", at: [[0, -1], [0, 0], [0, 1], [R3, -0.5], [R3, 0.5], [2 * R3, 0]] },
  pyramid: { name: "Triangle, flat side to you", at: [[0, 0], [R3, -0.5], [R3, 0.5], [2 * R3, -1], [2 * R3, 0], [2 * R3, 1]] },
  line: { name: "In a line across", at: [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map((v) => [0, v]) },
  rows: { name: "Two rows of three", at: [[0, -1], [0, 0], [0, 1], [R3, -1.5], [R3, -0.5], [R3, 0.5]].map(([u, v]) => [u, v + (u ? 0.5 : 0)]) },
  zigzag: { name: "Zigzag", at: [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map((v, i) => [i % 2 ? R3 : 0, v]) },
  arrow: { name: "Arrow, opening to you", at: [[0, -0.5], [0, 0.5], [0.8, -1.2], [0.8, 1.2], [1.6, -1.9], [1.6, 1.9]] },
  // (Rounded, so the cup across from the first is exactly in the middle.)
  ring: { name: "Ring", at: Array.from({ length: 6 }, (_, i) => [1 - Math.cos((i * Math.PI) / 3), Math.sin((i * Math.PI) / 3)].map((v) => Math.round(v * 1e6) / 1e6)) },
};
// How far apart the cups are (the owner: "gaps between the shapes to be
// wider"): centre to centre, metres - the gap between cups that much less
// a cup's width (10.8 cm).
export const SPACINGS = {
  close: { name: "Close (3½ in gaps)", m: 0.2 },
  wider: { name: "Wider (7½ in gaps)", m: 0.3 },
  wide: { name: "Wide (1 ft gaps)", m: 0.41 },
};
// How far it is from where a player putts to their end of the green's
// patch at the other end (two players, or three in lanes).
export const LENGTHS = {
  mat: { name: "11 ft", m: 11 * FOOT },
  long: { name: "18 ft", m: 18 * FOOT },
  green: { name: "25 ft", m: 25 * FOOT },
};
// Humps and hollows: how many on each half (each with its twin on the
// other), how high (m) and how wide.
export const SLOPES = {
  flat: { name: "Flat", count: 0 },
  gentle: { name: "Gentle", count: 3, a: [0.004, 0.01] },
  moderate: { name: "Moderate", count: 4, a: [0.008, 0.02] },
  severe: { name: "Severe", count: 5, a: [0.014, 0.03] },
};
export const SPEEDS = { slow: { name: "Slow (8)", stimp: 8 }, medium: { name: "Medium (10)", stimp: 10 }, fast: { name: "Fast (12)", stimp: 12 } };
// Four players: how big the patch is, across.
export const SIZES = {
  small: { name: "8 ft across", m: 8 * FOOT },
  medium: { name: "12 ft across", m: 12 * FOOT },
  large: { name: "16 ft across", m: 16 * FOOT },
};
export const PLAYER_COUNTS = [2, 3, 4];
export const DEFAULT_SETUP = { players: 2, layout: "triangle", spacing: "wider", length: "mat", size: "small", slopes: "gentle", speed: "medium" };

// Where each player putts from: this far in from their end.
export const START_IN = 0.75;
// The back of a rack: this far in from the end of the patch.
const RACK_IN = 0.3;
// The green runs on this far past each end of the patch (and round the
// four-way one) before its edge, where a ball's off the green and gone.
export const RUN_OUT = 2;
// Two players: the green this far either side of the racks.
const SIDE = 1.5;
// Three: each lane this much wider than its rack, and the green running a
// whole lane past the outside ones.
const LANE_ROOM = 1;
// The steepest a cup's ground may be.
const CUP_SLOPE = 0.025;

const pick = (table, key, value) => (table[value] ? value : DEFAULT_SETUP[key]);

// A point turned k of n parts of a turn about the middle (n 2: a half
// turn each; n 4: a quarter).
export function turned([x, z], k, n) {
  const a = (2 * Math.PI * k) / n;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x * c - z * s, x * s + z * c];
}

// A table from its setup ({ players, layout, length, size, slopes, speed,
// seed }): the same setup and seed make the same table on every bay.
//   { n, lanes, H, L, width, laneWidth, cups: [rack per player], starts:
//     [[x, z] per player], headings: [radians per player], targets:
//     [racks each player putts at], green, onMat(x, z, player), area,
//     setup }
// Two or four: cups[p] is player p's own rack, by their end - the one the
// others putt at; player 0's end is at -x and they face +x, player p's is
// player 0's turned p of n parts of a turn. Three (lanes): cups[p] is the
// rack at the far end of player p's own lane, the one they putt at.
// onMat: whether a ball there is still in play on the green (a ball in a
// lane may wander a whole lane over, and no further).
export function pongTable(setup = {}) {
  const n = PLAYER_COUNTS.includes(setup.players) ? setup.players : 2;
  const lanes = n === 3;
  const s = {
    players: n,
    layout: pick(LAYOUTS, "layout", setup.layout),
    // (A table from before spacings: as it was, close.)
    spacing: setup.spacing === undefined ? "close" : pick(SPACINGS, "spacing", setup.spacing),
    length: pick(LENGTHS, "length", setup.length),
    size: pick(SIZES, "size", setup.size),
    slopes: pick(SLOPES, "slopes", setup.slopes),
    speed: pick(SPEEDS, "speed", setup.speed),
    seed: Number.isFinite(setup.seed) ? setup.seed >>> 0 : 1,
  };
  const H = n === 4 ? SIZES[s.size].m / 2 : LENGTHS[s.length].m / 2;
  // A rack at the -x end, centred across: player 0's own (two or four), or
  // turned half a turn, the far end of a lane (three). Its cups as far
  // apart as asked, or as far as fits (rackFit).
  const back = H - RACK_IN;
  const { spread, depth, half, startX } = rackFit(LAYOUTS[s.layout].at, SPACINGS[s.spacing].m, { n, H, back });
  const width = Math.max(0.8, 2 * half + 0.3);
  const laneWidth = width + LANE_ROOM;
  const laneZ = (p) => (p - (n - 1) / 2) * laneWidth;
  const rackAtStart = LAYOUTS[s.layout].at.map(([u, v]) => [-back + u * spread, 0 - v * spread]);
  const start0 = [startX, 0];
  let cups;
  let starts;
  let headings;
  let targets;
  if (lanes) {
    const far = rackAtStart.map((c) => turned(c, 1, 2));
    cups = Array.from({ length: n }, (_, p) => far.map(([x, z]) => [x, z + laneZ(p)]));
    starts = Array.from({ length: n }, (_, p) => [start0[0], laneZ(p)]);
    headings = Array(n).fill(0);
    targets = Array.from({ length: n }, (_, p) => [p]);
  } else {
    cups = Array.from({ length: n }, (_, p) => rackAtStart.map((c) => turned(c, p, n)));
    starts = Array.from({ length: n }, (_, p) => turned(start0, p, n));
    headings = Array.from({ length: n }, (_, p) => (2 * Math.PI * p) / n);
    targets = Array.from({ length: n }, (_, p) => Array.from({ length: n }, (_, q) => q).filter((q) => q !== p));
  }

  // The green in play: two, a stretch along the patch and either side of
  // it; four, round (the same every quarter turn); three, the lanes and a
  // lane's width past the outside ones - each player's ball in play a
  // whole lane over from their own and no further, so the outside lanes
  // play as the middle one.
  const XR = H + RUN_OUT;
  const halfAcross = n === 2 ? width / 2 + SIDE : 1.5 * laneWidth + laneWidth * (n - 1) / 2;
  const area = n === 4 ? { round: true, r: XR } : { x: XR, z: halfAcross };
  const onMat = (x, z, player = null) => {
    if (n === 4) return x * x + z * z <= XR * XR;
    if (Math.abs(x) > XR) return false;
    if (lanes && player != null) return Math.abs(z - laneZ(player)) <= 1.5 * laneWidth;
    return Math.abs(z) <= halfAcross;
  };

  // The slopes: bumps scattered over the patch, each with its twins turned
  // round with the rest (two, four) or copied every lane's width across
  // (three), so the ground is the same from every end or in every lane.
  const rand = seeded(s.seed ^ 0x90e6);
  const spec = SLOPES[s.slopes];
  const bumps = [];
  const count = n === 4 ? Math.ceil(spec.count / 2) : spec.count;
  for (let i = 0; i < count; i++) {
    const x = (rand() - 0.5) * 2 * H;
    const z = (rand() - 0.5) * (lanes ? laneWidth : n === 2 ? width + 0.4 : 2 * H);
    const a = (rand() < 0.5 ? -1 : 1) * (spec.a[0] + rand() * (spec.a[1] - spec.a[0]));
    const sd = 0.25 + rand() * 0.45;
    if (lanes) {
      // Every lane's width, from four past one side to four past the
      // other: further out than any ball in play feels.
      for (let k = -4; k <= n + 3; k++) bumps.push({ x, z: z + laneZ(0) + k * laneWidth, a, s: sd });
    } else {
      for (let p = 0; p < n; p++) {
        const [bx, bz] = turned([x, z], p, n);
        bumps.push({ x: bx, z: bz, a, s: sd });
      }
    }
  }
  let k = 1;
  const bumpsAt = (x, z) => {
    let h = 0;
    let gx = 0;
    let gz = 0;
    for (const b of bumps) {
      const dx = x - b.x;
      const dz = z - b.z;
      const e = k * b.a * Math.exp(-(dx * dx + dz * dz) / (2 * b.s * b.s));
      h += e;
      gx -= (e * dx) / (b.s * b.s);
      gz -= (e * dz) / (b.s * b.s);
    }
    return [h, gx, gz];
  };
  const shaping = {
    height: (x, z) => bumpsAt(x, z)[0],
    gradient: (x, z) => {
      const [, gx, gz] = bumpsAt(x, z);
      return [gx, gz];
    },
  };
  const green = { stimp: SPEEDS[s.speed].stimp, shaping };
  // Soften the bumps until no cup sits on more than a gentle slope.
  for (let i = 0; i < 30; i++) {
    const worst = Math.max(...cups[0].map(([x, z]) => Math.hypot(...greenGradient(green, x, z))));
    if (worst <= CUP_SLOPE) break;
    k *= 0.85;
  }
  return {
    n,
    lanes,
    H,
    L: 2 * H,
    width,
    laneWidth,
    cups,
    starts,
    headings,
    targets,
    green,
    onMat,
    area,
    // No backboard: nothing stops a ball but the green itself.
    wallAt: () => false,
    setup: s,
  };
}

// How far apart a rack's cups can be: the spacing asked for, or less until
// the rack fits - with two or four, each player putts from in front of
// their own rack, so a deep rack moves their spot forward, never more than
// a little past a quarter of the way down the patch; and four's racks must
// keep clear of each other at the corners. Three's racks are at the far
// end of their own lanes: any spacing fits. Returns { spread, depth (m
// from the back of the rack to its front cup), half (m from the middle
// across to an outside cup's edge), startX (player 0's spot) }.
export function rackFit(at, spacing, { n, H, back }) {
  const R = HOLE_RADIUS + 0.02;
  const uMax = Math.max(...at.map(([u]) => u));
  const vMax = Math.max(...at.map(([, v]) => Math.abs(v)));
  const shape = (s) => {
    const depth = uMax * s;
    const half = vMax * s + R;
    const startX = n === 3 ? -H + START_IN : Math.max(-H + START_IN, -back + depth + 0.1);
    return { spread: s, depth, half, startX };
  };
  const fits = ({ depth, half, startX }) => {
    if (n === 2) return startX <= -0.45 * H;
    if (n === 4) return startX <= -0.3 * H && half < back - depth - R - 0.05;
    return true;
  };
  let s = spacing;
  while (!fits(shape(s)) && s > 0.16) s *= 0.97;
  return shape(s);
}

// The way a player faces: their heading, turned `deg` right (+z is right
// of +x), as a unit vector.
export function facing(table, player, deg = 0) {
  const a = table.headings[player] + (deg * Math.PI) / 180;
  return [Math.cos(a), Math.sin(a)];
}

// The aim (degrees right of straight ahead) at a point, from the player's
// spot.
export function aimAt(table, player, [x, z]) {
  const [sx, sz] = table.starts[player];
  const [fx, fz] = facing(table, player);
  const dx = x - sx;
  const dz = z - sz;
  // Along and to the right of the way they face.
  const along = dx * fx + dz * fz;
  const right = -dx * fz + dz * fx;
  return (Math.atan2(right, along) * 180) / Math.PI;
}

// A putt: player `player` strikes { speedMph, hla } (the launch monitor's,
// hla right of where they aimed), aimed aimDeg right of straight ahead, at
// the open cups of the racks they putt at (cups: the match's, each rack's
// true/false). It drops in whichever it reaches. Returns { rack, cup: the
// one holed, or null; holed, off (it ran off the green), rest, path, ...
// as rollBall }.
export function pongPutt(table, player, { speedMph, hla = 0 }, aimDeg, cups) {
  const targets = [];
  for (const q of table.targets[player]) table.cups[q].forEach((c, i) => cups[q]?.[i] && targets.push({ q, i, hole: { x: c[0], z: c[1], r: HOLE_RADIUS } }));
  const holes = targets.map((t) => t.hole);
  const [vx, vz] = facing(table, player, aimDeg + hla);
  const v = speedMph * MPH;
  const r = rollBall({ p: [...table.starts[player]], v: [vx * v, vz * v], t: 0 }, table.green, holes, { maxTime: 30 });
  const hit = r.holed ? targets[holes.length > 1 ? r.holeIndex : 0] : null;
  // Off the green: it stops there (it's gone).
  if (!r.holed) {
    const k = r.path.findIndex(([x, z]) => !table.onMat(x, z, player));
    if (k > 0) return { ...r, path: r.path.slice(0, k + 1), rest: [r.path[k][0], r.path[k][1]], rack: null, cup: null, off: true };
  }
  return { ...r, rack: hit?.q ?? null, cup: hit?.i ?? null, off: false };
}

// ---- The match -----------------------------------------------------------------

// A match of two, three or four: each rack (cups[p][i] true while it's
// there - two or four, player p's own, the one the others putt at; three,
// the one at the end of player p's lane), whose turn it is, how many each
// has holed, whose racks are cleared (nothing left to putt at there), every
// putt so far, and the winner (null till then).
// together: everyone putts at once - rounds (round: which; putted: who has
// this round; turn: the first still to putt, for the screen), each player
// once a round, the next round once everyone still playing has (gone: who
// isn't, online). race (with together): no rounds - anyone putts again
// whenever they like, so speed matters too.
export function newMatch({ players = 2, first = 0, cups = 6, together = false, race = false } = {}) {
  const n = PLAYER_COUNTS.includes(players) ? players : 2;
  const f = Number.isInteger(first) && first >= 0 && first < n ? first : 0;
  const m = { n, cups: Array.from({ length: n }, () => Array(cups).fill(true)), turn: f, first: f, putts: [], holed: Array(n).fill(0), out: Array(n).fill(false), winner: null };
  if (!together) return m;
  return { ...m, together: true, race: !!race, round: 1, putted: Array(n).fill(false), gone: Array(n).fill(false) };
}

// (Two players: the rack putted at is always the other's; three, their
// own lane's.)
const rackOf = (m, putt) => (putt.rack ?? (m.n === 2 ? 1 - putt.player : m.n === 3 ? putt.player : null));

// Why a putt can't count (null if it can): the game's over, it isn't that
// player's turn (all at once: they've putted this round and must wait for
// the others - never, racing), or the cup it says it holed isn't there.
// (All at once, a cup that was there when it was struck and another ball
// took while it rolled is no reason: it counts as a miss - playPutt.)
export function refusePutt(m, putt = {}) {
  if (m.winner != null) return "The match is over";
  if (m.together) {
    if (!Number.isInteger(putt.player) || putt.player < 0 || putt.player >= m.n || m.gone?.[putt.player]) return "Not in the game";
    if (!m.race && m.putted[putt.player]) return "Wait for the others";
  } else if (putt.player !== m.turn) return "Not your turn";
  if (putt.cup != null) {
    const rack = rackOf(m, putt);
    // (Three: only their own lane's; otherwise anyone's but their own.)
    if (!Number.isInteger(rack) || rack < 0 || rack >= m.n || (m.n === 3 ? rack !== putt.player : rack === putt.player)) return "No such rack";
    const there = m.together ? Number.isInteger(putt.cup) && putt.cup >= 0 && putt.cup < m.cups[rack].length : Number.isInteger(putt.cup) && m.cups[rack][putt.cup];
    if (!there) return "No such cup";
  }
  return null;
}

// The match after a putt (checked with refusePutt): the cup holed covered;
// the turn on to the next player - or the winner, the first to hole six
// (with two, that's clearing the other's rack). All at once, putts count
// in the order they're settled: a cup already taken by another ball is a
// miss (taken), the first to hole all their cups wins, and once everyone
// still playing has putted, the next round (not racing).
export function playPutt(m, putt) {
  let rack = putt.cup != null ? rackOf(m, putt) : null;
  const taken = rack != null && !!m.together && !m.cups[rack]?.[putt.cup];
  if (taken) rack = null;
  const cup = taken ? null : (putt.cup ?? null);
  const out = { ...m, cups: m.cups.map((r) => [...r]), holed: [...m.holed], out: [...m.out], putts: [...m.putts, { player: putt.player, cup, ...(rack != null && m.n === 4 ? { rack } : {}), ...(putt.off ? { off: true } : {}), ...(taken ? { taken: true } : {}) }] };
  if (rack != null) {
    out.cups[rack][cup] = false;
    out.holed[putt.player]++;
    if (!out.cups[rack].some(Boolean)) out.out[rack] = true;
  }
  if (out.holed[putt.player] >= out.cups[0].length) out.winner = putt.player;
  else if (!m.together) out.turn = (putt.player + 1) % out.n;
  else if (!m.race) {
    out.putted = [...m.putted];
    out.putted[putt.player] = true;
    if (out.putted.every((v, p) => v || out.gone[p])) {
      out.putted = Array(out.n).fill(false);
      out.round = m.round + 1;
    }
    out.turn = stillToPutt(out)[0] ?? out.first;
  }
  return out;
}

// All at once: who's still to putt this round, in order from the first
// (none racing, or once it's won).
export function stillToPutt(m) {
  if (!m.together || m.race || m.winner != null) return [];
  return Array.from({ length: m.n }, (_, k) => (m.first + k) % m.n).filter((p) => !m.putted[p] && !m.gone[p]);
}

// All at once: a player gone from the game (online, their bay's left and
// the host carries on) - the rounds don't wait for them. (In turn: as it
// always was.)
export function leaveMatch(m, player) {
  if (!m.together || !Number.isInteger(player) || player < 0 || player >= m.n || m.gone[player]) return m;
  const out = { ...m, gone: [...m.gone], putted: [...m.putted] };
  out.gone[player] = true;
  // (Everyone else has putted already: on to the next round.)
  if (!m.race && out.gone.some((g) => !g) && out.putted.every((v, p) => v || out.gone[p])) {
    out.putted = Array(out.n).fill(false);
    out.round = m.round + 1;
  }
  out.turn = stillToPutt(out)[0] ?? out.first;
  return out;
}

// All at once, against bots: when each of `count` bots putts after a round
// starts (seconds) - a short random moment each, between lo and hi, never
// two together (each in a slot of its own, the slots in a random order).
export function botMoments(count, rand = Math.random, [lo, hi] = [0.3, 1.2]) {
  const span = (hi - lo) / Math.max(1, count);
  const gap = Math.min(0.15, span / 2);
  const slots = Array.from({ length: count }, (_, k) => k);
  for (let k = count - 1; k > 0; k--) {
    const j = Math.floor(rand() * (k + 1));
    [slots[k], slots[j]] = [slots[j], slots[k]];
  }
  return slots.map((k) => lo + k * span + rand() * (span - gap));
}
// Racing: how long a bot takes over its next putt once its own ball has
// stopped (seconds).
export const botAgain = (rand = Math.random) => 0.3 + rand() * 0.5;

// Cups left in a player's rack; holed by a player.
export const cupsLeft = (m, p) => m.cups[p].filter(Boolean).length;
export const holedBy = (m, p) => m.holed?.[p] ?? 0;

// ---- The bot -----------------------------------------------------------------------

// How well the bot putts: its pace off by about `speed` (a share) and its
// line by about `aim` degrees, one time in three more.
export const BOT_LEVELS = {
  easy: { name: "Beginner", speed: 0.17, aim: 2.4 },
  club: { name: "Club golfer", speed: 0.09, aim: 1.2 },
  pro: { name: "Pro", speed: 0.045, aim: 0.55 },
};

function gauss(rand) {
  const u = Math.max(1e-9, rand());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

// The bot's putt: it picks the nearest cup still there in a rack it putts
// at (now and then another), reads it as a good putter would - the putt
// that would finish a foot or so past, against the green's real slopes -
// and strikes it as well as its level does. player: whose putt (all at
// once, any bot's; in turn, whoever's turn it is). -> { aimDeg, speedMph,
// hla, rack, cup }
export function botPutt(table, m, level = "club", rand = Math.random, player = m.turn) {
  const [sx, sz] = table.starts[player];
  const open = [];
  for (const q of table.targets[player]) table.cups[q].forEach((c, i) => m.cups[q][i] && open.push([q, i, Math.hypot(c[0] - sx, c[1] - sz)]));
  open.sort((a, b) => a[2] - b[2]);
  const [rack, cup, distance] = open[open.length > 1 && rand() < 0.25 ? 1 : 0];
  const [cx, cz] = table.cups[rack][cup];
  const heading = Math.atan2(cz - sz, cx - sx);
  // The green seen from the ball, looking at the cup.
  const framed = { stimp: table.green.stimp, framed: { green: table.green, frame: [sx, sz, heading] } };
  // (A foot or so past: nothing stops it behind the cups.)
  const read = idealPutt(framed, distance, 0.3);
  // (A level, or { speed, aim } of its own: none at all for the read.)
  const skill = typeof level === "object" && level ? level : BOT_LEVELS[level] ?? BOT_LEVELS.club;
  return {
    aimDeg: aimAt(table, player, [cx, cz]),
    speedMph: Math.max(0.3, read.speedMph * (1 + skill.speed * gauss(rand))),
    hla: read.hla + skill.aim * gauss(rand),
    rack,
    cup,
  };
}

// Where a player aims to start with: the middle of a rack's cups still
// there - the other's, with four the one across, else the nearest with
// cups left; with three, their own lane's.
export function startAim(table, m, player) {
  const mid = (q) => {
    const open = table.cups[q].filter((c, i) => m.cups[q][i]);
    return open.length ? [open.reduce((a, c) => a + c[0], 0) / open.length, open.reduce((a, c) => a + c[1], 0) / open.length] : null;
  };
  if (table.lanes) {
    const own = mid(player);
    return own ? Math.round(aimAt(table, player, own) * 4) / 4 : 0;
  }
  const [sx, sz] = table.starts[player];
  const order = Array.from({ length: m.n }, (_, k) => (player + m.n / 2 + k) % m.n).filter((q) => q !== player && mid(q));
  const across = order[0] === (player + m.n / 2) % m.n ? order[0] : order.sort((a, b) => Math.hypot(mid(a)[0] - sx, mid(a)[1] - sz) - Math.hypot(mid(b)[0] - sx, mid(b)[1] - sz))[0];
  if (across == null) return 0;
  return Math.round(aimAt(table, player, mid(across)) * 4) / 4;
}

// What a putt did, for the screen: "Holed! 3 left", "Lipped out", "Off the
// green", "Missed" - all at once, "Beaten to that cup" (another ball took
// it while this one rolled: a miss).
// owner: whose cup it was (four-way: there's a choice).
export function puttWords(r, left, owner = null) {
  if (r.taken) return "Beaten to that cup - a miss";
  if (r.cup != null && owner) return left ? `Holed one of ${owner}'s - ${left} left there` : `Holed ${owner}'s last cup`;
  if (r.cup != null) return left ? `Holed! ${left} cup${left === 1 ? "" : "s"} left` : "Holed - that's the last one!";
  if (r.off) return "Off the green";
  if (r.lipped) return "Lipped out!";
  return "Missed";
}
