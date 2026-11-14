// Where a drop can go, and the player choosing the spot in it (the owner,
// 1 November 2026: "unplayables need a lot of work... we need to make sure
// we can see the potential options before we choose them. And then in the
// options where, say, you can drop in line of where you entered the water,
// but as far back as you want, you need to be able to do that, you know,
// choose as far back as you want and place it wherever you want").
//
// Each relief option (sim/relief.mjs reliefOptions, penaltyOptions) has a
// relief area under the Rules of Golf, and the spot in it is the player's:
//   spot   stroke and distance (Rules 14.6, 17.1d(1), 19.2a): where the
//          last shot was played from - one place
//   line   back on the line (17.1d(2), 19.2b, 19.3): the line straight
//          back from the hole through the ball's spot (or where it last
//          crossed into the penalty area), as far back as wanted. The ball
//          is dropped on the line and may finish within a club-length of
//          where it touched (the 2023 Rules), never nearer the hole than
//          the ball's spot (or the crossing): a strip behind it, a
//          club-length either side of the line
//   disc   two club-lengths (17.1d(3) red areas, 19.2c): within two
//          club-lengths of the ball's spot (or the crossing), no nearer
//          the hole than it
// and keeps to the sand, or out of it, where an option says (a bunker's
// own drops: KEEP). The spot's moved with the arrows, a click or a finger
// on the ground (course/dropspot.js); here are where it may go, how a move
// takes it, and what it'd be like there - its lie, the trees over it and
// in the way, how far back and how far to go - before it's dropped.
//
// Pure, in the hole's frame (x down the hole, z to the right, metres).

import { distanceToPin } from "./courseplay.mjs";
import { CLUB_LENGTH, LINE_REACH, KEEP, spotAt, troubleToHole } from "./relief.mjs";
import { CLEAR } from "./treewarn.mjs";
import { LIE_NAMES } from "./lie.mjs";
import { YARD } from "./flight.mjs";
import { clamp } from "./mathutil.mjs";

// How far a press moves the spot (metres): back on the line a metre (ten
// with Shift), across it a quarter; within two club-lengths a quarter
// either way.
export const NUDGE = { back: 1, backBig: 10, across: 0.25, disc: 0.25 };
// How far back the line goes (metres past the ball): as far as anyone
// would want, and then some.
export const LINE_MOST = LINE_REACH + 100;
// A drop on the line is this far behind the ball at least (metres): the
// reference point has to be further from the hole than the ball.
export const LINE_LEAST = 0.3;

// An option's relief area: { kind: "spot" | "line" | "disc", ref, u (unit,
// from the hole out through ref), n (unit, across: to the left looking at
// the hole), width, least, most | radius, d0 (ref's distance to the hole),
// keep } - from the option's kind, its ref and keep (sim/relief.mjs).
export function areaFor(hole, o) {
  const cup = [hole.cup.x, hole.cup.z];
  const ref = o.ref ?? o.ball;
  const d0 = Math.hypot(ref[0] - cup[0], ref[1] - cup[1]);
  const u = d0 > 1e-6 ? [(ref[0] - cup[0]) / d0, (ref[1] - cup[1]) / d0] : [-1, 0];
  const n = [-u[1], u[0]];
  const keep = o.keep ?? "any";
  if (o.kind === "line" || o.kind === "outside") return { kind: "line", ref: [...ref], u, n, width: CLUB_LENGTH, least: LINE_LEAST, most: LINE_MOST, d0, keep };
  if (o.kind === "beside" || o.kind === "lateral") return { kind: "disc", ref: [...ref], u, n, radius: 2 * CLUB_LENGTH, d0, keep, cup };
  return { kind: "spot", ref: [...(o.ball ?? ref)], u, n, d0, keep };
}

// Where along and across an area a spot is: { back (metres behind ref,
// along u), across (metres to the left, along n) }.
export function areaCoords(area, at) {
  const dx = at[0] - area.ref[0];
  const dz = at[1] - area.ref[1];
  return { back: dx * area.u[0] + dz * area.u[1], across: dx * area.n[0] + dz * area.n[1] };
}

const fromCoords = (area, back, across) => [area.ref[0] + area.u[0] * back + area.n[0] * across, area.ref[1] + area.u[1] * back + area.n[1] * across];

// The nearest spot in the area to `at` (where it may go, whatever's there).
export function clampSpot(area, at) {
  if (area.kind === "spot") return [...area.ref];
  if (area.kind === "line") {
    const { back, across } = areaCoords(area, at);
    return fromCoords(area, clamp(back, area.least, area.most), clamp(across, -area.width, area.width));
  }
  // Two club-lengths round ref, and no nearer the hole: in the circle, then
  // out from the hole to ref's distance if it came in nearer (twice: the
  // one can push it a hair out of the other).
  let p = [...at];
  for (let i = 0; i < 2; i++) {
    const dx = p[0] - area.ref[0];
    const dz = p[1] - area.ref[1];
    const r = Math.hypot(dx, dz);
    if (r > area.radius) p = [area.ref[0] + (dx / r) * area.radius, area.ref[1] + (dz / r) * area.radius];
    const cx = p[0] - area.cup[0];
    const cz = p[1] - area.cup[1];
    const c = Math.hypot(cx, cz);
    if (c < area.d0 && c > 1e-9) p = [area.cup[0] + (cx / c) * area.d0, area.cup[1] + (cz / c) * area.d0];
  }
  return p;
}

// Whether a spot is in the area (a hair's leeway).
export function inArea(area, at, eps = 1e-6) {
  const c = clampSpot(area, at);
  return Math.hypot(c[0] - at[0], c[1] - at[1]) <= eps + 1e-9;
}

// The spot moved a press's worth: back (+1 further from the hole, -1
// nearer), right (+1 to the right looking at the hole, -1 left), big
// (Shift: ten metres back on the line). Kept in the area.
export function nudgeSpot(area, at, { back = 0, right = 0, big = false } = {}) {
  if (area.kind === "spot") return [...area.ref];
  const { back: b, across: a } = areaCoords(area, at);
  const along = area.kind === "line" ? (big ? NUDGE.backBig : NUDGE.back) : NUDGE.disc;
  const side = area.kind === "line" ? NUDGE.across : NUDGE.disc;
  return clampSpot(area, fromCoords(area, b + back * along, a - right * side));
}

// What the spot's like to drop at: { at, ok, why, lie, raw, under, chance,
// clear, back (metres behind ref on the line, else null), yards (to go) }.
// ok false where it can't be dropped: in the water, on the green, off the
// course, or out of the sand (or in it) where the option says otherwise -
// why says which. index: the hole's tree index (hole.treeIndex()).
export function spotCheck(hole, area, at, { index = hole.treeIndex?.() } = {}) {
  const yards = Math.round(distanceToPin(hole, at) / YARD);
  const back = area.kind === "line" ? Math.max(0, areaCoords(area, at).back) : null;
  const raw = hole.lieAt(at[0], at[1]);
  if (area.kind === "spot") return { at: [...at], ok: true, why: null, lie: raw, raw, under: false, chance: null, clear: null, back: null, yards };
  const s = spotAt(hole, at, index);
  const no = (why) => ({ at: [...at], ok: false, why, lie: raw, raw, under: false, chance: null, clear: null, back, yards });
  if (!s) return no(raw === "water" ? "Not in the water" : raw === "green" ? "Not on the green" : "Not somewhere it can be played");
  if (!(KEEP[area.keep] ?? KEEP.any)(s)) return no(area.keep === "sand" ? "It stays in the bunker (out of it is two strokes)" : "Out of the bunker, this one");
  const chance = troubleToHole(hole, at, s.lie, index);
  return { at: [...at], ok: true, why: null, lie: s.lie, raw, under: s.under, chance, clear: chance < CLEAR, back, yards };
}

// The spot's words while it's being chosen: "34 yds back - Rough - a clear
// way - 182 yds to go"; or why it can't go there.
export function spotWords(info) {
  if (!info.ok) return info.why;
  const parts = [];
  if (Number.isFinite(info.back)) {
    const n = Math.max(1, Math.round(info.back / YARD));
    parts.push(`${n} yd${n === 1 ? "" : "s"} back`);
  }
  parts.push(info.lie === "tee" ? "The tee" : (LIE_NAMES[info.lie] ?? info.lie));
  if (info.under) parts.push("under the trees");
  else if (info.clear === false) parts.push("trees in the way");
  else if (info.clear) parts.push("a clear way");
  parts.push(`${info.yards} yds to go`);
  return parts.join(" - ");
}

// What to draw of an area with the spot at `at` (hole frame): a line's
// stretch from just behind ref to a good way past the spot ({ from, to,
// width }), a disc's middle and reach and the line it mustn't come nearer
// than ({ at, radius, u }); null for one place.
export function areaShape(area, at) {
  if (area.kind === "line") {
    const back = at ? areaCoords(area, at).back : area.least;
    const to = Math.min(area.most, Math.max(60, back + 40));
    return { kind: "line", from: fromCoords(area, area.least, 0), to: fromCoords(area, to, 0), width: area.width, u: area.u, n: area.n, length: to };
  }
  if (area.kind === "disc") return { kind: "disc", at: [...area.ref], radius: area.radius, u: area.u, n: area.n };
  return null;
}

// Which area a click or tap on the ground at `at` is for, with the
// choices shown: the nearest within `within` metres of its area (a line's
// strip, a disc), or -1. areas: one per option (spot areas never).
export function areaNear(areas, at, within = 6) {
  let best = -1;
  let gap = within;
  areas.forEach((a, k) => {
    if (!a || a.kind === "spot") return;
    const c = clampSpot(a, at);
    const d = Math.hypot(c[0] - at[0], c[1] - at[1]);
    if (d <= gap) {
      gap = d;
      best = k;
    }
  });
  return best;
}

// Where the camera stands to show the spot being chosen: behind it, out
// from the hole (so the hole, and the ball or the water, are ahead past
// it), up a little - further back and higher on the line, which runs on a
// long way. Turned `turn` radians round the spot (to get a tree out of the
// way). Returns { cam, look } ([x, z]) and how high above the spot.
export const SPOT_VIEW = { line: { back: 11, up: 5.5, ahead: 22 }, disc: { back: 7, up: 4, ahead: 14 } };
export function spotView(area, at, { turn = 0, back = null, up = null } = {}) {
  const v = area.kind === "line" ? SPOT_VIEW.line : SPOT_VIEW.disc;
  const b = back ?? v.back;
  const a = Math.atan2(area.u[1], area.u[0]) + turn;
  const ux = Math.cos(a);
  const uz = Math.sin(a);
  return { cam: [at[0] + ux * b, at[1] + uz * b], look: [at[0] - ux * v.ahead, at[1] - uz * v.ahead], up: up ?? v.up };
}

// The camera for the spot clear of the trees, if it can be: tried behind
// it, round either side, and nearer and lower (under the crowns, in the
// woods), the first with no crown in the way of the spot nor round the
// camera - else, deep in the woods, up over the treetops looking down on
// it (its mark's seen through the leaves). trees: [{ x, z, r, top }] (hole frame;
// r a crown's reach, top its height, as the camera keeps clear of them -
// view.js); ground(x, z): the height there. A crown over the spot itself
// doesn't count: it's what's being looked under.
const VIEW_TURNS = [0, 0.45, -0.45, 0.9, -0.9, 1.4, -1.4];
const VIEW_STEPS = { line: [[11, 5.5], [7, 3.2], [4.5, 2]], disc: [[7, 4], [4.5, 2.6], [3, 1.8]] };
export function clearSpotView(area, at, { trees = [], ground = () => 0 } = {}) {
  const spotY = ground(at[0], at[1]) + 0.2;
  const near = trees.filter((t) => Number.isFinite(t.r) && Math.hypot(t.x - at[0], t.z - at[1]) < 40 && Math.hypot(t.x - at[0], t.z - at[1]) > t.r);
  let best = null;
  for (const [back, up] of VIEW_STEPS[area.kind === "line" ? "line" : "disc"]) {
    for (const turn of VIEW_TURNS) {
      const v = spotView(area, at, { turn, back, up });
      const camY = Math.max(ground(v.cam[0], v.cam[1]), spotY) + up;
      let n = 0;
      const dx = at[0] - v.cam[0];
      const dz = at[1] - v.cam[1];
      const len2 = dx * dx + dz * dz || 1;
      for (const t of near) {
        const top = Number.isFinite(t.top) ? t.top : Infinity;
        if (Math.hypot(t.x - v.cam[0], t.z - v.cam[1]) < t.r + 0.5 && camY < top) {
          n += 2;
          continue;
        }
        const k = Math.max(0, Math.min(1, ((t.x - v.cam[0]) * dx + (t.z - v.cam[1]) * dz) / len2));
        const y = camY + (spotY - camY) * k;
        if (Math.hypot(v.cam[0] + dx * k - t.x, v.cam[1] + dz * k - t.z) < t.r * 0.85 && y < top) n++;
      }
      if (!best || n < best.n) best = { ...v, n };
      if (n === 0) return best;
    }
  }
  // (Over the tops: a little behind, high enough to clear the tallest near.)
  const tops = near.filter((t) => Number.isFinite(t.top) && Math.hypot(t.x - at[0], t.z - at[1]) < 15).map((t) => t.top - spotY);
  const up = Math.max(OVER_TOPS, ...tops.map((h) => h + 6));
  return { cam: [at[0] + area.u[0] * 4, at[1] + area.u[1] * 4], look: [at[0] - area.u[0] * 3, at[1] - area.u[1] * 3], up, n: best.n, over: true };
}
// How high over the spot the camera goes at least, up over the woods.
const OVER_TOPS = 24;
