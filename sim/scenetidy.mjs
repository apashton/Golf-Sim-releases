// Tidying a recording's scene (the owner, 23 November 2026: "an overlay
// which cleans up all the boxes and keeps the same look ... make it easier
// to align and have boxes consistent"): one click and a scene's boxes line
// up and sit evenly apart, so a look's frames (sim/scenelook.mjs) read as
// one set. (The Recording panel's Tidy this scene and Tidy every scene.)
//
//   lined up       edges that nearly line up (within LINE_UP pixels of a
//                  1080p picture) line up exactly: a column's boxes the
//                  same width, a row's the same height
//   trimmed        boxes shown at the same time (any time of the shot:
//                  sim/shotphase.mjs) that overlap by a thin band along an
//                  edge - a sloppy drag - meet instead: the one drawn
//                  underneath gives way
//   evenly apart   boxes side by side or one above the other, near each
//                  other (under NEAR_GAPS gaps apart), exactly `gap` apart,
//                  a row or column of about the same size kept the same
//                  size; an edge near the picture's edge exactly `edge` in
//                  from it
//   over a picture a box over the game or a camera (inside it, drawn after
//                  it) near that picture's edge sits exactly its frame and
//                  a gap in from it (frameOf(picture) + gap); boxes over it
//                  near each other `gap` apart
//   one place      layers that take turns in one place (the YouTube
//                  column's second camera before the shot, the flight paths
//                  while it flies, the numbers after) end up in exactly the
//                  same place, so a look draws them one box (scenelook.mjs
//                  boxDrawers); so does a picture hidden under a copy of
//                  itself
//   left alone     a layer filling the whole picture (the background), one
//                  turned off, and a container's members (sim/container.mjs
//                  lays them out in it again after); groups stay groups
//
// Along each way (across, then down) it's worked out as a whole: every
// box's edges numbers, every rule above a sum they must make (this edge on
// that one; this one `gap` past that one; this one `edge` in), and the
// edges moved the least that makes them all true (least squares). A rule
// that can't be kept with the ones before it is let go, in that order - one
// place, the picture's edges, lining up, the gaps, the sizes - and so is
// one that would make a box smaller than a layer can be (MIN_SHARE) or put
// it out of the picture. It's done again until nothing moves, so tidying a
// tidy scene changes nothing.
//
// gap, edge and frameOf are in pixels of a 1080p picture. Pure: a layout
// (sim/videolayout.mjs) in, a layout out.

import { setLayer, MIN_SHARE } from "./videolayout.mjs";
import { PHASES, shownIn } from "./shotphase.mjs";
import { flowContainers, containerMembers } from "./container.mjs";

export const TIDY_GAP = 12;
export const TIDY_EDGE = 12;
// Edges this near (pixels of a 1080p picture) are lined up.
export const LINE_UP = 12;
// Boxes facing each other under this many gaps apart are put a gap apart;
// an edge under this many gaps further in than it should be from the
// picture's (or the picture it's over) is put where it should be.
export const NEAR_GAPS = 3;
// An overlap this share of the smaller box (along the way they overlap),
// or less, is a thin band - a sloppy drag - and trimmed.
export const THIN = 0.25;
// Layers taking turns whose places overlap this much (the shared part over
// the two together) are in one place.
export const SAME_PLACE = 0.8;
// Sizes this near (a share of the bigger) are a row's or column's same size.
const SAME_SIZE = 0.04;
// Rounds of tidying, at most, until nothing moves.
const PASSES = 12;
const PICTURES = ["game", "camera"];

const r4 = (v) => Math.round(v * 10000) / 10000;

// A layer that fills the whole picture: the background, left alone.
export const isBackground = (l) => l.x <= 0.002 && l.y <= 0.002 && l.w >= 0.996 && l.h >= 0.996;

// Whether two layers are ever shown at the same time.
export const shownTogether = (a, b) => PHASES.some((p) => shownIn(a.when ?? "always", p) && shownIn(b.when ?? "always", p));

// The layout tidied: { layout, moved } - moved, how many layers changed.
export function tidyLayout(layout, { gap = TIDY_GAP, edge = TIDY_EDGE, frameOf = () => 0, W = 1920, H = 1080 } = {}) {
  if (!layout || !Array.isArray(layout.layers)) return { layout, moved: 0 };
  const k = H / 1080;
  const o = { W, H, k, gap: Math.max(0, gap) * k, edge: Math.max(0, edge) * k, frameOf: (l) => Math.max(0, Number(frameOf(l)) || 0) * k };
  let cur = layout;
  for (let i = 0; i < PASSES; i++) {
    const next = tidyPass(cur, o);
    if (next === cur) break;
    cur = next;
  }
  if (cur.layers.some((l) => l.kind === "box" && l.fill && l.group)) cur = flowContainers(cur, { W, H });
  const before = new Map(layout.layers.map((l) => [l.id, l]));
  const moved = cur.layers.filter((l) => {
    const b = before.get(l.id);
    return !b || b.x !== l.x || b.y !== l.y || b.w !== l.w || b.h !== l.h;
  }).length;
  return { layout: moved ? cur : layout, moved };
}

// ---- One round -----------------------------------------------------------------------

// A box: { l (its layer), i (where it's drawn), r: [left, right, top,
// bottom] in pixels }. Along a way (ax 0 across, 1 down): its low and high
// edges are r[2 ax] and r[2 ax + 1].
const lo = (b, ax) => b.r[2 * ax];
const hi = (b, ax) => b.r[2 * ax + 1];
const size = (b, ax) => hi(b, ax) - lo(b, ax);
const mid = (b, ax) => (lo(b, ax) + hi(b, ax)) / 2;
// How much two boxes overlap along a way (less than 0: how far apart).
const overlap = (a, b, ax) => Math.min(hi(a, ax), hi(b, ax)) - Math.max(lo(a, ax), lo(b, ax));
// a inside b, give or take tol.
const inside = (a, b, tol) => a.r[0] >= b.r[0] - tol && a.r[1] <= b.r[1] + tol && a.r[2] >= b.r[2] - tol && a.r[3] <= b.r[3] + tol;
const area = (b) => size(b, 0) * size(b, 1);
const shared = (a, b) => Math.max(0, overlap(a, b, 0)) * Math.max(0, overlap(a, b, 1));
const iou = (a, b) => {
  const s = shared(a, b);
  return s > 0 ? s / (area(a) + area(b) - s) : 0;
};
const bounds = (list) => ({ r: [Math.min(...list.map((b) => b.r[0])), Math.max(...list.map((b) => b.r[1])), Math.min(...list.map((b) => b.r[2])), Math.max(...list.map((b) => b.r[3]))] });

function tidyPass(layout, o) {
  const { W, H, k, gap, edge, frameOf } = o;
  const span = [W, H];
  const least = [MIN_SHARE * W, MIN_SHARE * H];
  const lineUp = LINE_UP * k;
  const near = Math.max(NEAR_GAPS * gap, lineUp);
  const members = new Set();
  for (const l of layout.layers) if (l.kind === "box" && l.fill && l.group) for (const m of containerMembers(layout, l.id)) members.add(m.id);
  const boxes = [];
  layout.layers.forEach((l, i) => {
    if (l.on === false || isBackground(l) || members.has(l.id)) return;
    boxes.push({ l, i, r: [l.x * W, (l.x + l.w) * W, l.y * H, (l.y + l.h) * H] });
  });
  const n = boxes.length;
  if (!n) return layout;
  const start = boxes.map((b) => [...b.r]);
  const tog = boxes.map((a) => boxes.map((b) => shownTogether(a.l, b.l)));

  // A picture hidden under a copy of itself (shown at the same time, a
  // picture drawn over it covering it, nearly the same place): one place.
  const dupe = new Set();
  const dupes = [];
  for (let a = 0; a < n; a++)
    for (let b = a + 1; b < n; b++) {
      if (!tog[a][b] || !PICTURES.includes(boxes[b].l.kind)) continue;
      if (inside(boxes[a], boxes[b], lineUp) && iou(boxes[a], boxes[b]) >= SAME_PLACE) {
        dupes.push([a, b]);
        dupe.add(`${a},${b}`);
      }
    }
  const isDupe = (a, b) => dupe.has(`${Math.min(a, b)},${Math.max(a, b)}`);

  // What each box is over: the smallest box drawn before it, shown with it
  // and holding it - with room for it inside its frame and a gap each side
  // (one that can't fit in it is a box beside it, overlapping it on
  // purpose) - or -1, the picture itself.
  const fits = (b, P) => [0, 1].every((ax) => size(b, ax) <= size(P, ax) - 2 * (frameOf(P.l) + gap) + 0.5);
  const parent = boxes.map((b, j) => {
    let best = -1;
    for (let p = 0; p < j; p++) {
      const P = boxes[p];
      if (!tog[p][j] || isDupe(p, j) || !inside(b, P, lineUp) || area(P) < area(b) * 1.2 || !fits(b, P)) continue;
      if (best < 0 || area(P) < area(boxes[best])) best = p;
    }
    return best;
  });
  const siblings = (a, b) => parent[a] === parent[b];
  const nested = (a, b) => inside(boxes[a], boxes[b], 0.5) || inside(boxes[b], boxes[a], 0.5);

  // Which way a pair overlapping in both ways overlaps by a thin band (the
  // thinner, for its sizes), or -1.
  const thinWay = (A, B) => {
    let way = -1;
    let best = Infinity;
    for (const ax of [0, 1]) {
      const depth = overlap(A, B, ax);
      const limit = THIN * Math.min(size(A, ax), size(B, ax));
      if (depth <= limit && depth / limit < best) {
        best = depth / limit;
        way = ax;
      }
    }
    return way;
  };

  // Trimmed: a thin overlap between boxes shown together - the one drawn
  // underneath gives way, so they meet (the gap is made below).
  for (let a = 0; a < n; a++)
    for (let b = a + 1; b < n; b++) {
      if (!tog[a][b] || !siblings(a, b) || isDupe(a, b) || nested(a, b)) continue;
      const A = boxes[a];
      const B = boxes[b];
      if (overlap(A, B, 0) <= 0.5 || overlap(A, B, 1) <= 0.5) continue;
      const ax = thinWay(A, B);
      if (ax < 0) continue;
      const at = mid(A, ax) < mid(B, ax) ? 2 * ax + 1 : 2 * ax;
      const to = at === 2 * ax + 1 ? lo(B, ax) : hi(B, ax);
      const r = [...A.r];
      r[at] = to;
      if (r[2 * ax + 1] - r[2 * ax] >= least[ax]) A.r = r;
    }

  // Facing: shown together, over the same thing, side by side or one above
  // the other (overlapping the other way), near or overlapping thinly, with
  // nothing between them. [ax, first, second].
  const facing = [];
  for (let a = 0; a < n; a++)
    for (let b = a + 1; b < n; b++) {
      if (!tog[a][b] || !siblings(a, b) || isDupe(a, b) || nested(a, b)) continue;
      const A = boxes[a];
      const B = boxes[b];
      const ox = overlap(A, B, 0);
      const oy = overlap(A, B, 1);
      let ax = -1;
      if (ox > 0.5 && oy > 0.5) ax = thinWay(A, B);
      else if (ox > 0.5 && -oy < near) ax = 1;
      else if (oy > 0.5 && -ox < near) ax = 0;
      if (ax < 0) continue;
      const [f, s] = mid(A, ax) <= mid(B, ax) ? [a, b] : [b, a];
      const F = boxes[f];
      const S = boxes[s];
      const pa = 1 - ax;
      const pLo = Math.max(lo(F, pa), lo(S, pa));
      const pHi = Math.min(hi(F, pa), hi(S, pa));
      const between = boxes.some((C, c) => c !== a && c !== b && tog[c][a] && tog[c][b] && siblings(c, a) && lo(C, ax) >= hi(F, ax) - 0.5 && hi(C, ax) <= lo(S, ax) + 0.5 && Math.min(hi(C, pa), pHi) - Math.max(lo(C, pa), pLo) > 0.5);
      if (!between) facing.push([ax, f, s]);
    }

  // Sets: boxes shown at one time of the shot only (not always), together,
  // touching or near - the column's numbers after the shot, its two flight
  // paths. Sets that take turns in nearly the same place are one place.
  const set = boxes.map((_, j) => j);
  const root = (j) => (set[j] === j ? j : (set[j] = root(set[j])));
  const when = (j) => boxes[j].l.when ?? "always";
  const join = (a, b) => {
    if (when(a) === "always" || when(a) !== when(b)) return;
    set[root(a)] = root(b);
  };
  for (const [, f, s] of facing) join(f, s);
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if (siblings(a, b) && shared(boxes[a], boxes[b]) > 0) join(a, b);
  const sets = new Map();
  boxes.forEach((b, j) => {
    if (when(j) === "always") return;
    const s = root(j);
    if (!sets.has(s)) sets.set(s, []);
    sets.get(s).push(j);
  });
  const setList = [...sets.values()];

  // The rules, each way: each among boxes over the same thing (g, its
  // index; -1 the picture), or one box's edge from the place it's over
  // (base: that place's edge, once it's settled, and how far in).
  const rows = [[], []];
  const add = (ax, pri, g, t, rhs, base = null) => rows[ax].push({ pri, g, t, rhs, base, n: rows[ax].length });
  const v = (j, end) => 2 * j + end; // a box's low (0) or high (1) edge

  // One place.
  for (const [a, b] of dupes) if (siblings(a, b)) for (const ax of [0, 1]) for (const end of [0, 1]) add(ax, 0, parent[a], [[v(a, end), 1], [v(b, end), -1]], 0);
  for (let x = 0; x < setList.length; x++)
    for (let y = x + 1; y < setList.length; y++) {
      const S1 = setList[x];
      const S2 = setList[y];
      if (parent[S1[0]] !== parent[S2[0]] || tog[S1[0]][S2[0]]) continue;
      if (iou(bounds(S1.map((j) => boxes[j])), bounds(S2.map((j) => boxes[j]))) < SAME_PLACE) continue;
      for (const ax of [0, 1])
        for (const end of [0, 1]) {
          const pick = (S) => S.reduce((m, j) => ((end ? hi(boxes[j], ax) > hi(boxes[m], ax) : lo(boxes[j], ax) < lo(boxes[m], ax)) ? j : m), S[0]);
          add(ax, 0, parent[S1[0]], [[v(pick(S1), end), 1], [v(pick(S2), end), -1]], 0);
        }
    }

  // In from the picture's edge (`edge`), or the picture it's over (its
  // frame and a gap), where it's near it.
  boxes.forEach((b, j) => {
    const p = parent[j];
    const inset = p < 0 ? edge : frameOf(boxes[p].l) + gap;
    for (const ax of [0, 1]) {
      const pLo = p < 0 ? 0 : lo(boxes[p], ax);
      const pHi = p < 0 ? span[ax] : hi(boxes[p], ax);
      if (lo(b, ax) - pLo < inset + near) add(ax, 1, p, [[v(j, 0), 1]], inset, p < 0 ? null : { p, end: 0, d: inset });
      if (pHi - hi(b, ax) < inset + near) add(ax, 1, p, [[v(j, 1), 1]], span[ax] - inset, p < 0 ? null : { p, end: 1, d: -inset });
    }
  });

  // Lined up: the same edge of boxes over the same thing, each run of them
  // no wider than LINE_UP.
  for (const ax of [0, 1])
    for (const end of [0, 1]) {
      const groups = new Map();
      boxes.forEach((b, j) => {
        if (!groups.has(parent[j])) groups.set(parent[j], []);
        groups.get(parent[j]).push(j);
      });
      for (const list of groups.values()) {
        const sorted = [...list].sort((a, b) => boxes[a].r[2 * ax + end] - boxes[b].r[2 * ax + end] || a - b);
        let run = [];
        const flush = () => {
          for (let q = 1; q < run.length; q++) add(ax, 2, parent[run[0]], [[v(run[q], end), 1], [v(run[0], end), -1]], 0);
          run = [];
        };
        for (const j of sorted) {
          if (run.length && boxes[j].r[2 * ax + end] - boxes[run[0]].r[2 * ax + end] > lineUp) flush();
          run.push(j);
        }
        flush();
      }
    }

  // Evenly apart, and a row's or column's about-the-same sizes the same.
  for (const [ax, f, s] of facing) add(ax, 3, parent[f], [[v(s, 0), 1], [v(f, 1), -1]], gap);
  for (const [ax, f, s] of facing) {
    const a = size(boxes[f], ax);
    const b = size(boxes[s], ax);
    if (Math.abs(a - b) <= Math.min(lineUp, Math.max(2 * k, SAME_SIZE * Math.max(a, b)))) add(ax, 4, parent[f], [[v(f, 1), 1], [v(f, 0), -1], [v(s, 1), -1], [v(s, 0), 1]], 0);
  }

  // Solved a level at a time - the boxes on the picture itself, then those
  // over each of them with the place they're over settled (a box over the
  // game never moves the game) - each way; then put where it says.
  const depth = (j) => (j < 0 ? -1 : 1 + depth(parent[j]));
  const levels = [...new Set(parent)].sort((a, b) => depth(a) - depth(b) || a - b);
  const done = boxes.map((b) => [...b.r]);
  for (const g of levels) {
    const list = boxes.map((_, j) => j).filter((j) => parent[j] === g);
    const local = new Map(list.map((j, q) => [j, q]));
    for (const ax of [0, 1]) {
      const x0 = list.flatMap((j) => [lo(boxes[j], ax), hi(boxes[j], ax)]);
      const was = list.flatMap((j) => [start[j][2 * ax], start[j][2 * ax + 1]]);
      const cons = rows[ax]
        .filter((c) => c.g === g)
        .sort((a, b) => a.pri - b.pri || a.n - b.n)
        .map((c) => ({ ...c, t: c.t.map(([e, a]) => [2 * local.get(e >> 1) + (e & 1), a]), rhs: c.base ? done[c.base.p][2 * ax + c.base.end] + c.base.d : c.rhs }));
      const { x: solvedX, kept } = solveWay(x0, cons, least[ax], span[ax]);
      const x = settle(solvedX, was, kept, k);
      list.forEach((j, q) => {
        done[j][2 * ax] = x[2 * q];
        done[j][2 * ax + 1] = x[2 * q + 1];
      });
    }
  }
  let out = layout;
  let changed = false;
  boxes.forEach((b, j) => {
    const [x0, x1, y0, y1] = done[j];
    const x = r4(x0 / W);
    const y = r4(y0 / H);
    const w = r4(r4(x1 / W) - x);
    const h = r4(r4(y1 / H) - y);
    if (x === b.l.x && y === b.l.y && w === b.l.w && h === b.l.h) return;
    out = setLayer(out, b.l.id, { x, y, w, h });
    const now = out.layers.find((l) => l.id === b.l.id);
    if (now.x !== b.l.x || now.y !== b.l.y || now.w !== b.l.w || now.h !== b.l.h) changed = true;
  });
  return changed ? out : layout;
}

// ---- Solving one way ------------------------------------------------------------------

// The edges x0 moved the least that keeps the rules (each { t: [[edge,
// coefficient]...], rhs }: the sum of coefficient x edge must be rhs),
// taken in order: one that can't be kept with those before it is let go,
// and so is one that would make a box (edges 2j and 2j + 1) smaller than
// `least` or put it outside 0 - span. Returns { x: the edges, kept: the
// rules that hold }.
function solveWay(x0, cons, least, span) {
  let active = cons;
  for (let tries = 0; tries <= cons.length; tries++) {
    const { x, kept, holds } = project(x0, active, span);
    let bad = -1;
    for (let j = 0; j < x.length / 2 && bad < 0; j++) if (x[2 * j + 1] - x[2 * j] < least - 1e-6 || x[2 * j] < -0.5 || x[2 * j + 1] > span + 0.5) bad = j;
    if (bad < 0) return { x, kept: holds };
    // Let go the last rule kept that moves that box.
    const drop = [...kept].reverse().find((c) => c.t.some(([e]) => e === 2 * bad || e === 2 * bad + 1)) ?? kept.at(-1);
    if (!drop) break;
    active = active.filter((c) => c !== drop);
  }
  return { x: [...x0], kept: [] };
}

// The nearest point to x0 where every rule kept holds (an orthonormal
// basis of the rules, made one at a time: a rule that adds nothing new is
// already kept by those before it - it holds too - or can't be with them,
// and is let go). Nearest, as a box is moved: a box moved whole costs the
// distance it goes; made bigger or smaller, the change as a share of its
// size (of the picture's) - so a box would rather move than change size
// (the player's box moved down from the game's edge, not squashed), and
// when boxes must give up room each gives a like share of its own.
function project(x0, cons, span) {
  const n = x0.length;
  // Each box as its middle and its size (z), scaled by what moving each
  // costs (y = z x scale).
  const z0 = new Float64Array(n);
  const scale = new Float64Array(n);
  for (let j = 0; j < n / 2; j++) {
    const a = x0[2 * j];
    const b = x0[2 * j + 1];
    z0[2 * j] = (a + b) / 2;
    z0[2 * j + 1] = b - a;
    scale[2 * j] = 1;
    scale[2 * j + 1] = Math.sqrt(span / Math.max(1, b - a));
  }
  const basis = [];
  const kept = [];
  const holds = [];
  for (const c of cons) {
    const row = new Float64Array(n);
    for (const [e, a] of c.t) {
      const j = e >> 1;
      row[2 * j] += a;
      row[2 * j + 1] += (e & 1 ? 0.5 : -0.5) * a;
    }
    for (let j = 0; j < n; j++) row[j] /= scale[j];
    let rhs = c.rhs;
    let first = 0;
    for (let j = 0; j < n; j++) first += row[j] * row[j];
    for (const q of basis) {
      let d = 0;
      for (let j = 0; j < n; j++) d += row[j] * q.v[j];
      if (d === 0) continue;
      for (let j = 0; j < n; j++) row[j] -= d * q.v[j];
      rhs -= d * q.r;
    }
    let norm = 0;
    for (let j = 0; j < n; j++) norm += row[j] * row[j];
    if (!(norm > 1e-12 * first)) {
      if (Math.abs(rhs) < 1e-6) holds.push(c);
      continue;
    }
    norm = Math.sqrt(norm);
    for (let j = 0; j < n; j++) row[j] /= norm;
    basis.push({ v: row, r: rhs / norm });
    kept.push(c);
    holds.push(c);
  }
  const y0 = z0.map((v, j) => v * scale[j]);
  const y = Float64Array.from(y0);
  for (const q of basis) {
    let d = -q.r;
    for (let j = 0; j < n; j++) d += q.v[j] * y0[j];
    if (d) for (let j = 0; j < n; j++) y[j] -= d * q.v[j];
  }
  const x = new Array(n);
  for (let j = 0; j < n / 2; j++) {
    const m = y[2 * j] / scale[2 * j];
    const s = y[2 * j + 1] / scale[2 * j + 1];
    x[2 * j] = m - s / 2;
    x[2 * j + 1] = m + s / 2;
  }
  return { x, kept, holds };
}

// The solved edges, with those that hardly moved (under half a pixel of a
// 1080p picture) left where they were - so a tidy scene, kept in shares
// rounded to a pixel's fraction, isn't moved by its rounding. Edges lined up
// with each other (by the rules that hold) move together: left only if
// they all were together.
function settle(x, was, cons, k) {
  const n = x.length;
  const up = x.map((_, j) => j);
  const find = (j) => (up[j] === j ? j : (up[j] = find(up[j])));
  for (const c of cons) if (c.pri <= 2 && c.rhs === 0 && c.t.length === 2 && c.t[0][1] === -c.t[1][1]) up[find(c.t[0][0])] = find(c.t[1][0]);
  const classes = new Map();
  for (let j = 0; j < n; j++) {
    const r = find(j);
    if (!classes.has(r)) classes.set(r, []);
    classes.get(r).push(j);
  }
  const out = [...x];
  for (const list of classes.values()) {
    const together = list.every((j) => Math.abs(was[j] - was[list[0]]) < 1e-6);
    const still = list.every((j) => Math.abs(x[j] - was[j]) < 0.5 * k);
    if (together && still) for (const j of list) out[j] = was[j];
    else if (list.length > 1) {
      const v = list.reduce((t, j) => t + x[j], 0) / list.length;
      for (const j of list) out[j] = v;
    }
  }
  return out;
}
