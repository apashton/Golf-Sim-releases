// The club's furniture round a hole: where it stands, worked out from the
// hole every time it's drawn (as the signs are, sim/signs.mjs), so every
// hole ever saved has it and nothing is added to a course file.
//   - by the tee sign, on its side of the hole (the cart path's side, else
//     the left): a ball washer, a bin, a divot box and a bench - in the
//     upper corner of the golfer's picture from the tee, 8 - 20 m away,
//     where it gives the view a scale; clear of the windsock, the sign,
//     the line of play and the path
//   - a rake on the grass beside each greenside bunker, on its side away
//     from the green
//   - the tee markers' colour: the tee being played (the everyday yellow);
//     on a course from a map, its other tee boxes along the hole have a
//     pair of their own - white then blue further back, red further forward
// None of it takes part in play (like the signs, it doesn't stop a ball),
// and none of it is in the Challenges: only the course puts it up
// (course.js addClub, from addSignage, which the Challenges leave out).
//
// Pure functions, in the hole's frame (sim/course.mjs: the tee at (0, 0), x
// down the hole, z to the right, metres); look/club.js draws it.

import { makePath, surfaceAt, insideBlob, blobRadius } from "./course.mjs";
import { gapToPaths } from "./paths.mjs";
import { insidePolygon, polygonCentroid, polygonBounds } from "./terrain.mjs";
import { TEE_VIEW } from "./signs.mjs";

// The pieces of furniture by a tee, and roughly how big each is (metres
// across its widest), for keeping them apart.
export const TEE_FURNITURE = ["washer", "bin", "divots", "bench"];
export const FURNITURE_SIZE = { washer: 0.4, bin: 0.6, divots: 0.6, bench: 1.7, rake: 1.6 };
// How far each keeps from things (metres): the windsock, the tee sign, the
// cart path's edge, each other.
export const FURNITURE_CLEAR = { sock: 2.5, sign: 1.2, path: 0.8, apart: 0.5 };
// Never closer than this to the golfer's line down the hole, as seen from
// the camera at the tee (radians): clear of the line of play.
const OFF_LINE = 0.3;
// ...and no further out than the edge of its picture (a 50° camera on a
// 16:9 picture shows about 0.64 rad either side).
const IN_VIEW = 0.62;

// Surfaces none of it stands on.
const KEEP_OFF = new Set(["fairway", "tee", "bunker", "greenside", "waste", "water", "green", "fringe", "path"]);
const r2 = (v) => Math.round(v * 100) / 100;
const unit = (x, z) => {
  const l = Math.hypot(x, z) || 1;
  return [x / l, z / l];
};

// Each piece's spot beside the tee sign (sx, sz) on side s (-1 left, 1
// right): in a row on past it and out from the hole, so from the golfer's
// camera each stands clear of the sign rather than behind it; the bench
// last, turned to look back at the tee.
const SLOTS = {
  washer: (sx, sz, s) => [sx + 0.8, sz + s * 1.5],
  bin: (sx, sz, s) => [sx + 2.2, sz + s * 2.2],
  divots: (sx, sz, s) => [sx + 3.6, sz + s * 2.9],
  bench: (sx, sz, s) => [sx + 5.6, sz + s * 3.7],
};

// What's by the tee: [{ kind, at: [x, z], face: [fx, fz] }] - each faces
// `face` (towards the tee's camera; the bench, towards the tee). sign:
// signsFor's `tee` ({ at }); sock: the windsock's spot ([x, z]) or null.
export function teeFurniture(L, sign, sock = null, path = makePath(L.path)) {
  if (!sign?.at) return [];
  const [sx, sz] = sign.at;
  const side = Math.sign(sz) || -1;
  const out = [];
  const clear = (kind, x, z) => {
    if (KEEP_OFF.has(surfaceAt(L, x, z, path))) return false;
    const half = FURNITURE_SIZE[kind] / 2;
    if (gapToPaths(L.paths, x, z, FURNITURE_CLEAR.path + half + 0.01) <= FURNITURE_CLEAR.path + half) return false;
    if (sock && Math.hypot(x - sock[0], z - sock[1]) < FURNITURE_CLEAR.sock + half) return false;
    if (Math.hypot(x - sx, z - sz) < FURNITURE_CLEAR.sign + half) return false;
    const off = Math.abs(Math.atan2(z - TEE_VIEW[1], x - TEE_VIEW[0]));
    if (off < OFF_LINE || off > IN_VIEW) return false;
    // (Its own footprint off the sand and water too, not just its middle.)
    for (const [dx, dz] of [[half, 0], [-half, 0], [0, half], [0, -half]]) if (KEEP_OFF.has(surfaceAt(L, x + dx, z + dz, path))) return false;
    return out.every((o) => Math.hypot(o.at[0] - x, o.at[1] - z) >= (FURNITURE_SIZE[o.kind] + FURNITURE_SIZE[kind]) / 2 + FURNITURE_CLEAR.apart);
  };
  for (const kind of TEE_FURNITURE) {
    const [x0, z0] = SLOTS[kind](sx, sz, side);
    // Moved a little at a time, if it's in the way; left out if nowhere
    // near is clear.
    // (Out, then on down the hole, then back towards the tee.)
    const tries = [];
    for (const a of [0, 1.5, 3, -1.5]) for (let o = 0; o <= 2; o += 0.5) tries.push([a, o]);
    for (const [a, o] of tries) {
      const x = x0 + a;
      const z = z0 + side * o;
      if (!clear(kind, x, z)) continue;
      // The bench looks back at the tee; the rest at the golfer's camera.
      const face = kind === "bench" ? unit(-x, -z) : unit(TEE_VIEW[0] - x, TEE_VIEW[1] - z);
      out.push({ kind, at: [r2(x), r2(z)], face: face.map(r2) });
      break;
    }
  }
  return out;
}

// Whether a bunker is a greenside one (as sim/course.mjs plays it: its
// middle within 15 m of the green's edge).
export function isGreenside(L, b) {
  const g = L.green;
  return Math.hypot(b.x - g.x, b.z - g.z) < Math.max(g.rx ?? 0, g.rz ?? 0) + 15;
}

// A rake beside each greenside bunker: on the grass a metre out from its
// edge, on the side away from the green (or round from there to the first
// clear spot), lying along the edge. [{ at: [x, z], along: [ax, az] }].
export function bunkerRakes(L, path = makePath(L.path)) {
  const out = [];
  for (const b of L.bunkers ?? []) {
    if (!isGreenside(L, b)) continue;
    const away = Math.atan2(b.z - L.green.z, b.x - L.green.x);
    for (const turn of [0, 0.5, -0.5, 1, -1, 1.5, -1.5, 2, -2, 2.6, -2.6]) {
      const a = away + turn;
      // Out from its middle to its edge, then a metre on.
      const local = a - (b.rot ?? 0);
      const r = b.poly ? edgeAlong(b, a) : blobRadius(b, local);
      const d = r + 1;
      const x = b.x + Math.cos(a) * d;
      const z = b.z + Math.sin(a) * d;
      const along = [-Math.sin(a), Math.cos(a)];
      const ends = [-0.8, 0, 0.8].map((k) => [x + along[0] * k, z + along[1] * k]);
      if (ends.some(([ex, ez]) => KEEP_OFF.has(surfaceAt(L, ex, ez, path)) || (L.bunkers ?? []).some((o) => insideBlob(o, ex, ez, 0.3)))) continue;
      if (gapToPaths(L.paths, x, z, 1.01) <= 1) continue;
      if (out.some((o) => Math.hypot(o.at[0] - x, o.at[1] - z) < 2)) continue;
      out.push({ at: [r2(x), r2(z)], along: along.map(r2) });
      break;
    }
  }
  return out;
}

// How far out from a mapped bunker's middle its edge is, heading `a`.
function edgeAlong(b, a) {
  let r = 0.25;
  while (r < 60 && insidePolygon(b.poly, b.x + Math.cos(a) * r, b.z + Math.sin(a) * r)) r += 0.25;
  return r;
}

// The colour of the tee being played. The game has one tee per hole: the
// club's everyday one, yellow - unless a course says otherwise (a hole's
// card `tee`, one of the marker colours).
export const TEE_COLOURS = ["white", "yellow", "red", "blue"];
export function playedTee(info = {}) {
  return TEE_COLOURS.includes(info.tee) ? info.tee : "yellow";
}

// A course from a map: its other tee boxes along this hole (mapped tees
// whose middle is within 90 m of this one, back or forward along the line
// of play and close to it), each with a pair of markers of its own colour:
// behind the played tee white, then blue; in front of it red.
// [{ colour, markers: [[x, z], [x, z]] }].
export function otherTees(L) {
  if (L.source !== "map") return [];
  const boxes = [];
  for (const t of L.tees ?? []) {
    if (!Array.isArray(t) || t.length < 3) continue;
    // The one being played from.
    if (insidePolygon(t, 0, 0)) continue;
    const [cx, cz] = polygonCentroid(t);
    if (Math.abs(cx) > 90 || Math.abs(cz) > 18 + Math.abs(cx) * 0.15) continue;
    boxes.push({ t, cx, cz });
  }
  const back = boxes.filter((b) => b.cx < 0).sort((a, b) => b.cx - a.cx);
  const front = boxes.filter((b) => b.cx >= 0).sort((a, b) => a.cx - b.cx);
  const colour = (list, colours) => list.map((b, i) => ({ ...b, colour: colours[Math.min(i, colours.length - 1)] }));
  return [...colour(back, ["white", "blue"]), ...colour(front, ["red"])].map(({ t, cx, cz, colour: c }) => {
    // Across the box's front third, either side of its middle (as wide as
    // it is, up to the played tee's 4.6 m).
    const bb = polygonBounds(t);
    const x = Math.min(bb.x1 - 1, cx + 0.8);
    const half = Math.min(2.3, Math.max(0.8, (bb.z1 - bb.z0) / 2 - 0.6));
    return { colour: c, markers: [[r2(x), r2(cz - half)], [r2(x), r2(cz + half)]] };
  });
}

// Everything the club puts round a hole: { tee, rakes } (teeFurniture,
// bunkerRakes).
export function holeFurniture(L, { sign = null, sock = null } = {}) {
  const path = makePath(L.path);
  return { tee: teeFurniture(L, sign, sock, path), rakes: bunkerRakes(L, path) };
}

// ---- The range as a practice ground ----------------------------------------------------
//
// World metres, as range.js lays the range out: the tee line at z = 0,
// the range away down -z, x across (+x to the right).

// The ball-stop poles: down both sides at the front of the woods, every
// POLE_STEP metres, POLE_HIGH tall, with netting between them from
// NET_FROM up; across the far end on a mounded bank.
export const POLE_STEP = 25;
export const POLE_HIGH = 12;
export const POLE_X = 42.5;
export const NET_FROM = 0.6;
// The far end's bank: its middle (z), how deep and how high.
export const END_BANK = { z: -318, depth: 9, high: 2.6, half: POLE_X };
// The netting fades out as a camera comes within NET_FADE.far metres and
// is gone inside NET_FADE.near, as the target boards do, so the chase
// camera never sees it swell up across the picture.
export const NET_FADE = { near: 15, far: 40 };

// How opaque the netting is from a camera `d` metres away (0 - 1 of its
// own opacity).
export function netFade(d) {
  const t = Math.min(1, Math.max(0, (d - NET_FADE.near) / (NET_FADE.far - NET_FADE.near)));
  return t * t * (3 - 2 * t);
}

// The poles and the runs of netting: { poles: [[x, z, high]], nets:
// [[[x0, z0], [x1, z1]]] }. blocked(x, z): true where a pole mustn't
// stand (the pond, a yardage board): it moves in towards the range a
// little, or is left out and the net runs on to the next.
export function rangeNets(blocked = () => false) {
  const poles = [];
  const nets = [];
  for (const side of [-1, 1]) {
    let last = null;
    for (let z = -5; z >= END_BANK.z + END_BANK.depth / 2; z -= POLE_STEP) {
      let at = null;
      for (let o = 0; o <= 4; o += 0.5) {
        const x = side * (POLE_X - o);
        if (!blocked(x, z)) {
          at = [x, z];
          break;
        }
      }
      if (!at) continue;
      poles.push([...at, POLE_HIGH]);
      if (last) nets.push([last, at]);
      last = at;
    }
    // On to the far end's corner.
    const corner = [side * END_BANK.half, END_BANK.z];
    poles.push([...corner, POLE_HIGH]);
    if (last) nets.push([last, corner]);
  }
  // Across the far end, on the bank.
  const n = 4;
  let last = [-END_BANK.half, END_BANK.z];
  for (let i = 1; i <= n; i++) {
    const at = [-END_BANK.half + (2 * END_BANK.half * i) / n, END_BANK.z];
    if (i < n) poles.push([...at, POLE_HIGH]);
    nets.push([last, at]);
    last = at;
  }
  return { poles, nets };
}

// Low timber dividers between the bays on the tee line (x of each), and
// how deep and high they are, from just in front of the mats back.
export const DIVIDERS = { at: [-14, -10, -6, -2, 2, 6, 10, 14], z0: 0.6, z1: 2.1, high: 0.6 };
// The hitting mats along the tee line (BAYS: the ball's x in each bay),
// each a stance and hitting mat in one (MAT, metres: across the tee line,
// back from the ball's row, and in front of it): the ball sits towards one
// side of it with the golfer's feet on the rest - on the right-hand side
// of the mat for a right-hander, as they look down the range, on the left
// for a left-hander (the owner, 18 October 2026: "the ball on the hitting
// mat needs to sit on the right hand side of the mat if right handed and
// left if lefthanded") - `ballIn` metres from that edge. The pyramid of
// balls stands on the other side, away from the stance, PYRAMID_X from
// the ball: nearer the divider (2 m along) than the mat.
export const BAYS = [-12, -8, -4, 0, 4, 8, 12];
export const MAT = { wide: 1.5, deep: 1.5, front: 0.35, ballIn: 0.4 };
export const PYRAMID_X = 1.55;
// Where a bay's mat and pyramid stand for a hand ("right" or "left"), from
// the ball (x along the tee line, + to the golfer's right as they look
// down the range; z back from the ball, the range being down -z): { side
// (the ball's side of its mat: +1 the right), mat: { x, z (its middle),
// outline (its corners) }, pyramid: { x, z } }. A left-hander's is the
// right-hander's mirrored - and the bays stand symmetrically about the
// tee line's middle, so mirroring them all across it lays every bay for
// the other hand (range.js layBays). Pure.
export function bayLayout(hand = "right") {
  const side = hand === "left" ? -1 : 1;
  const x = -side * (MAT.wide / 2 - MAT.ballIn);
  const z = MAT.deep / 2 - MAT.front;
  const outline = [
    [x - MAT.wide / 2, -MAT.front],
    [x + MAT.wide / 2, -MAT.front],
    [x + MAT.wide / 2, MAT.deep - MAT.front],
    [x - MAT.wide / 2, MAT.deep - MAT.front],
  ];
  return { side, mat: { x, z, outline }, pyramid: { x: side * PYRAMID_X, z: 0.9 } };
}
// The ball-picker, parked out on the field at the edge of the mown strip,
// turned a little: clear of every target, bunker and where drives land.
export const PICKER = { at: [31, -128], turn: 0.5 };

// The target greens' shapes, one each, in turn: { kind, r(θ) } - the
// green's edge `r(θ)` metres out from its flag at angle θ (world: θ = 0
// along +x, π/2 along -z, as a shape lies on the ground).
export const TARGET_KINDS = ["kidney", "peanut", "oval", "kidney", "peanut"];
// The fringe round each green, its ragged edge, and the raised bank
// beyond it (metres), and how high the green stands on it. A look only:
// the range plays flat.
export const TARGET_BANK = { fringe: 1.6, ragged: 0.45, slope: 3.6, high: 0.4 };

export function targetShape(i, radius) {
  const kind = TARGET_KINDS[i % TARGET_KINDS.length];
  const rx = radius;
  const rz = radius * 0.85;
  const turn = [0.3, -0.4, 0.15, 2.6, 0.9][i % 5];
  const ellipse = (t, a, b) => (a * b) / Math.hypot(b * Math.cos(t), a * Math.sin(t));
  let r;
  if (kind === "peanut") {
    // Two round lobes, one bigger, joined at a waist.
    const lobes = [
      [-0.42 * rx, 0, 0.62 * rx],
      [0.45 * rx, 0, 0.55 * rx],
    ];
    r = (t) => {
      const [c, s] = [Math.cos(t - turn), Math.sin(t - turn)];
      let best = 0;
      for (const [cx, cz, cr] of lobes) {
        // Where the ray from the middle leaves this lobe.
        const b = c * cx + s * cz;
        const disc = b * b - (cx * cx + cz * cz - cr * cr);
        if (disc >= 0) best = Math.max(best, b + Math.sqrt(disc));
      }
      return best;
    };
  } else if (kind === "kidney") {
    // An oval with a bite out of one side.
    r = (t) => {
      const u = t - turn;
      const d = Math.atan2(Math.sin(u - Math.PI / 2), Math.cos(u - Math.PI / 2));
      return ellipse(u, rx * 1.05, rz) * (1 - 0.3 * Math.exp(-(d * d) / 0.22));
    };
  } else {
    r = (t) => ellipse(t - turn, rx, rz) * (1 + 0.05 * Math.sin(3 * t + i));
  }
  // The fringe's ragged edge, and the bank beyond.
  const fringe = (t) => r(t) + TARGET_BANK.fringe + TARGET_BANK.ragged * (0.6 * Math.sin(7 * t + i * 1.3) + 0.4 * Math.sin(13 * t + i * 2.1));
  const bank = (t) => fringe(t) + TARGET_BANK.slope;
  return { kind, r, fringe, bank, reach: Math.max(...Array.from({ length: 72 }, (_, k) => bank((k / 72) * Math.PI * 2))) };
}

// How high the ground is drawn at (dx, dz) from a target's flag (world
// offsets): the bank's height, easing down from the fringe's edge to
// nothing, and down into any bunker beside it ({ x, z, r }: offsets and
// reach). The green and fringe stand at TARGET_BANK.high.
export function bankHeight(shape, dx, dz, bunkers = []) {
  const t = Math.atan2(-dz, dx);
  const d = Math.hypot(dx, dz);
  const f = shape.fringe(t);
  const b = shape.bank(t);
  let h;
  if (d <= f) h = 1;
  else if (d >= b) h = 0;
  else {
    const k = 1 - (d - f) / (b - f);
    h = k * k * (3 - 2 * k);
  }
  for (const s of bunkers) h *= Math.min(1, Math.max(0, (Math.hypot(dx - s.x, dz - s.z) - s.r) / 1.5));
  return h * TARGET_BANK.high;
}

// ---- Ducks and swans ------------------------------------------------------------------

// On larger ponds (at least BIRDS.pond m² of water): a few ducks, or a
// pair of swans on a big one; fewer ducks on Standard. Each well inside
// the water, and paddling clear of where a ball comes down: at least
// BIRDS.clear metres from the line of play and the green (on the range,
// from the mown strip). None in the Challenges (only the course and the
// range put them on).
export const BIRDS = { pond: 120, swans: 500, edge: 2.2, clear: 14, apart: 1.6, drift: 1.2 };

// birds for a list of ponds: ponds [{ x, z, area, inside(x, z) }];
// clearOf(x, z): true where a bird may be (clear of where balls land).
// Returns [{ kind: "duck" | "swan", at: [x, z], heading }] in the ponds'
// own frame. Seeded: the same pond, the same birds.
export function pondBirds(ponds, { clearOf = () => true, seed = 1, high = true } = {}) {
  let r = (seed * 2654435761) >>> 0 || 1;
  const rand = () => {
    r ^= r << 13;
    r ^= r >>> 17;
    r ^= r << 5;
    return (r >>> 0) / 4294967296;
  };
  const out = [];
  for (const p of ponds) {
    if (!(p.area >= BIRDS.pond)) continue;
    const swans = p.area >= BIRDS.swans && rand() < 0.5;
    const want = swans ? 2 : high ? 3 + Math.floor(rand() * 3) : 2;
    const kind = swans ? "swan" : "duck";
    // Room round each bird: its drift and the pond's edge.
    const room = BIRDS.edge + BIRDS.drift;
    const ok = (x, z) => {
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        if (!p.inside(x + Math.cos(a) * room, z + Math.sin(a) * room)) return false;
      }
      return p.inside(x, z) && clearOf(x, z);
    };
    const reach = Math.sqrt(p.area / Math.PI) * 1.6;
    // Swans together, ducks in a loose group: the first wherever it's
    // clear, the rest near it.
    const mine = [];
    for (let tries = 0; tries < 400 && mine.length < want; tries++) {
      const lead = mine[0];
      const spread = lead ? (swans ? 2.5 : 4) : reach;
      const cx = lead ? lead.at[0] : p.x;
      const cz = lead ? lead.at[1] : p.z;
      const x = cx + (rand() * 2 - 1) * spread;
      const z = cz + (rand() * 2 - 1) * spread;
      if (!ok(x, z)) continue;
      if (mine.some((b) => Math.hypot(b.at[0] - x, b.at[1] - z) < (swans ? 1.4 : BIRDS.apart))) continue;
      mine.push({ kind, at: [Math.round(x * 100) / 100, Math.round(z * 100) / 100], heading: Math.round(rand() * 628) / 100 });
    }
    out.push(...mine);
  }
  return out;
}
