// Walls: one stretch of a bunker's edge built as a wall standing straight
// up from the sand (stacked turf, or timber sleepers), or one stretch of a
// pond's bank built as a wall standing straight up out of the water
// (timber planks and posts, or brick) - a bulkhead, with the ground level
// right up to its top.
//
// A bunker or pond keeps its wall as `wall: { a: [t0, t1], h, m }`:
//   a  where it runs: from t0 to t1 round the shape's outline, each a
//      fraction (0 to 1) of the way round it by length, in the outline's
//      own order of points (edgeOf). t1 below t0 runs on through the
//      outline's start. Fractions rather than an angle or a spot, so the
//      wall moves and grows with its shape (moved, resized, drawn onto the
//      green) and works on any outline, however bent - a mapped lake, a
//      kidney bunker.
//   h  a bunker's: how far down the sand is at the wall's foot, below the
//      grass (0.6 to 1.8 m); a pond's: how far its top stands above the
//      water (0.25 to 1 m)
//   m  what it's built of: a bunker's 0 stacked turf, 1 timber sleepers; a
//      pond's 0 timber, 1 brick, 2 rock - a natural rock face, the cliff
//      the owner can choose for a stretch of a pond's bank (the owner: "a
//      reasonable drop off to the water, not a cliff face unless users
//      defines an area as cliff face"): elsewhere the hill comes down to
//      the water on a bank (holeedits.mjs POND_BANK), but along a wall it
//      keeps its height, so on steep ground a rock face stands as tall as
//      the hill there
// A shape without one has none - every bunker and pond made before walls
// existed, which look and play exactly as they did.
//
// Pure functions: the shaping of the ground and play (holeedits.mjs,
// courseplay.mjs), the 3D walls (look/walls.js), the maps and the hole
// builder all use these, so a wall is where it's drawn, everywhere.

import { blobOutline, makePath, nearest, isPot } from "./course.mjs";

// How wide (metres) a wall's face is in play: the ground drops the wall's
// full height over this, so a ball meets a wall, not a slope.
export const WALL_FACE = 0.1;
// A pot bunker's revetted face (course.mjs isPot), as they're built: sods
// stacked from a firm footing, each set back from the one below, so the
// face leans back about 65 degrees from level - never upright, which would
// fall in - with sand banked against its foot `kicker` metres up it, in a
// concave sweep `sweep` metres wide (the owner: "there's never really a
// steep edge to the bunker"; "the sand always having a concave 1 m edge
// at a minimum").
export const REVET = { angle: 65, kicker: 0.2, sweep: 1 };
// How far in (metres) from its top a wall's face reaches its foot: a pot's
// leaning face, or WALL_FACE.
export function faceRun(s) {
  if (!isPot(s)) return WALL_FACE;
  return Math.max(WALL_FACE, (s.wall.h - REVET.kicker) / Math.tan((REVET.angle * Math.PI) / 180));
}
// Over how far (metres) a wall eases back into the ordinary edge at each
// end, however long it is.
const TAPER = 1;
// The shortest wall, metres along the edge.
export const MIN_WALL = 2;

// What each kind of shape's wall can be: its heights, one step at a time
// (the builder's ladder), what it can be built of, and how much of the
// way round the edge it may run (and at most how long it's made at first).
export const WALLS = {
  bunker: {
    heights: [
      { name: "Low", h: 0.6 },
      { name: "Medium", h: 0.9 },
      { name: "Tall", h: 1.2 },
      { name: "Very tall", h: 1.5 },
      { name: "Pot face", h: 1.8 },
    ],
    kinds: [{ word: "Turf" }, { word: "Timber" }],
    span: [0.03, 0.8],
    first: { h: 1.2, m: 0, longest: 12 },
  },
  water: {
    heights: [
      { name: "0.25 m", h: 0.25 },
      { name: "0.5 m", h: 0.5 },
      { name: "0.75 m", h: 0.75 },
      { name: "1 m", h: 1 },
    ],
    kinds: [{ word: "Timber" }, { word: "Brick" }, { word: "Rock" }],
    span: [0.03, 0.6],
    first: { h: 0.5, m: 0, longest: 30 },
  },
};
// How high (or deep) a wall can be, metres.
export const wallHeights = (kind) => [WALLS[kind].heights[0].h, WALLS[kind].heights[WALLS[kind].heights.length - 1].h];

const r3 = (v) => Math.round(v * 1000) / 1000;
const r2 = (v) => Math.round(v * 100) / 100;
import { clamp, smoothstep01 } from "./mathutil.mjs";
const fin = (v) => typeof v === "number" && Number.isFinite(v);

// ---- The outline, and places round it ----------------------------------------------

// A shape's outline, the one a wall's fractions are measured round: a
// mapped (or drawn-on) shape's own points, or a designed one's in 96
// steps - the same outline a bunker drawn onto the green is redrawn from
// (holeedits.mjs joinBunker), so its wall stays where it was. Its length
// all the way round, where each point is along it, and which way round it
// goes. Worked out once per shape.
const outlines = new WeakMap();
export function edgeOf(s) {
  let o = outlines.get(s);
  if (o) return o;
  const pts = s.poly ?? blobOutline(s, 96);
  const n = pts.length;
  const cum = [0];
  let area = 0;
  for (let i = 0; i < n; i++) {
    const [ax, az] = pts[i];
    const [bx, bz] = pts[(i + 1) % n];
    cum.push(cum[i] + Math.hypot(bx - ax, bz - az));
    area += ax * bz - bx * az;
  }
  let x0 = Infinity;
  let z0 = Infinity;
  let x1 = -Infinity;
  let z1 = -Infinity;
  for (const [x, z] of pts) {
    x0 = Math.min(x0, x);
    z0 = Math.min(z0, z);
    x1 = Math.max(x1, x);
    z1 = Math.max(z1, z);
  }
  // `turn` 1 if the points go anticlockwise (x across, z up), -1 if not:
  // which side of each piece of the outline is inside.
  o = { pts, cum, total: cum[n] || 1, turn: area >= 0 ? 1 : -1, box: { x0, z0, x1, z1 } };
  outlines.set(s, o);
  return o;
}

// The spot a fraction t of the way round an outline, and the way the
// outline runs there (unit), and which way is in (unit).
export function pointAtT(o, t) {
  const n = o.pts.length;
  const d = (((t % 1) + 1) % 1) * o.total;
  let i = 0;
  // (Few enough points that a straight search is quick.)
  while (i < n - 1 && o.cum[i + 1] < d) i++;
  const [ax, az] = o.pts[i];
  const [bx, bz] = o.pts[(i + 1) % n];
  const len = o.cum[i + 1] - o.cum[i] || 1;
  const u = clamp((d - o.cum[i]) / len, 0, 1);
  const dir = [(bx - ax) / len, (bz - az) / len];
  return { p: [ax + (bx - ax) * u, az + (bz - az) * u], dir, in: [-dir[1] * o.turn, dir[0] * o.turn], i };
}

// The nearest spot on an outline to (x, z): how far away it is, whether
// (x, z) is inside (even-odd), and its fraction of the way round.
export function nearestOnEdge(o, x, z) {
  const P = o.pts;
  const n = P.length;
  let best = Infinity;
  let bestT = 0;
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    // The piece from point j to point i (j is i's point before).
    const [ax, az] = P[j];
    const [bx, bz] = P[i];
    const dx = bx - ax;
    const dz = bz - az;
    const len2 = dx * dx + dz * dz;
    let u = len2 > 0 ? ((x - ax) * dx + (z - az) * dz) / len2 : 0;
    u = u < 0 ? 0 : u > 1 ? 1 : u;
    const qx = ax + dx * u - x;
    const qz = az + dz * u - z;
    const d2 = qx * qx + qz * qz;
    if (d2 < best) {
      best = d2;
      // Piece j runs from cum[j] (j = n - 1 wraps from the last point to
      // the first).
      bestT = (o.cum[j] + Math.sqrt(len2) * u) / o.total;
    }
    if (bz > z !== az > z && x < (dx * (z - bz)) / dz + bx) inside = !inside;
  }
  return { d: Math.sqrt(best), inside, t: bestT % 1 };
}

// Whether (x, z) is inside an outline (even-odd, as nearestOnEdge says it)
// - without finding the nearest spot, for asking it many times over (a
// putt rolling past a walled bunker: holeedits/ground.mjs).
export function insideEdge(o, x, z) {
  const b = o.box;
  if (x < b.x0 || x > b.x1 || z < b.z0 || z > b.z1) return false;
  const P = o.pts;
  let inside = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const [ax, az] = P[j];
    const [bx, bz] = P[i];
    if (bz > z !== az > z && x < ((bx - ax) * (z - bz)) / (bz - az) + bx) inside = !inside;
  }
  return inside;
}

// Is fraction t within the stretch a = [t0, t1] (running on through the
// start if t1 < t0)?
export function inSpan(t, [t0, t1]) {
  return t0 <= t1 ? t >= t0 && t <= t1 : t >= t0 || t <= t1;
}
// How much of the way round a stretch runs.
export const spanOf = ([t0, t1]) => (((t1 - t0) % 1) + 1) % 1;

// How far (metres) fraction t is into the stretch from its nearer end,
// along the outline: negative outside it.
function intoSpan(o, t, [t0, t1]) {
  const span = spanOf([t0, t1]);
  const from0 = (((t - t0) % 1) + 1) % 1;
  if (from0 <= span) return Math.min(from0, span - from0) * o.total;
  return -Math.min(from0 - span, 1 - from0) * o.total;
}

// ---- A wall's line --------------------------------------------------------------------

// Is a shape's wall well formed? A course file can be edited by hand or
// damaged: a wall that isn't is left off (the shape is drawn and played
// without it).
export function validWall(w) {
  if (!w || typeof w !== "object" || !Array.isArray(w.a) || w.a.length !== 2) return false;
  if (!w.a.every((t) => fin(t) && t >= 0 && t <= 1)) return false;
  return fin(w.h) && (w.m == null || w.m === 0 || w.m === 1 || w.m === 2);
}
// The shape's wall, if it has a good one - or, for a shape with several
// (a brook's walled banks: `walls`, sim/brooks.mjs), its first.
export const wallOf = (s) => (s?.wall && validWall(s.wall) ? s.wall : (s?.walls?.find?.(validWall) ?? null));

// A shape with several walls (`walls: [wall, ...]`, as a brook's walled
// banks are) seen as one shape per wall - the same shape with just that
// wall - so everything that works on a shape's wall (its line, drawing it,
// the ground along it) works on each. A shape with one wall is its own
// only view; one with none has none. Worked out once per shape.
const views = new WeakMap();
export function wallViews(s) {
  if (!s) return [];
  if (!Array.isArray(s.walls)) return s.wall && validWall(s.wall) ? [s] : [];
  let v = views.get(s);
  if (v) return v;
  v = s.walls.filter(validWall).map((wall) => {
    const one = { ...s, wall };
    delete one.walls;
    return one;
  });
  views.set(s, v);
  return v;
}

// The wall's line: the outline's points from t0 round to t1, in order,
// with the ends where they fall between points. Worked out once per shape
// (a moved shape is a new one). Null without a wall.
const lines = new WeakMap();
export function wallLine(s) {
  const wall = wallOf(s);
  if (!wall) return null;
  let line = lines.get(s);
  if (line) return line;
  const o = edgeOf(s);
  const [t0] = wall.a;
  const span = spanOf(wall.a);
  const n = o.pts.length;
  const start = pointAtT(o, t0);
  const pts = [start.p];
  const d0 = t0 * o.total;
  const d1 = d0 + span * o.total;
  // Every outline point strictly between the ends, going round.
  for (let k = 1; k <= n; k++) {
    const i = (start.i + k) % n;
    const d = o.cum[i] + (start.i + k >= n ? o.total : 0);
    if (d <= d0 + 1e-9) continue;
    if (d >= d1 - 1e-9) break;
    pts.push(o.pts[i]);
  }
  pts.push(pointAtT(o, t0 + span).p);
  let x0 = Infinity;
  let z0 = Infinity;
  let x1 = -Infinity;
  let z1 = -Infinity;
  const cum = [0];
  for (let i = 0; i < pts.length; i++) {
    const [x, z] = pts[i];
    x0 = Math.min(x0, x);
    z0 = Math.min(z0, z);
    x1 = Math.max(x1, x);
    z1 = Math.max(z1, z);
    if (i) cum.push(cum[i - 1] + Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]));
  }
  line = { pts, cum, length: cum[cum.length - 1], box: { x0, z0, x1, z1 } };
  lines.set(s, line);
  return line;
}

// How far (x, z) is from a shape's wall, metres (Infinity without one, or
// when it's further than `within`).
export function wallDistance(s, x, z, within = Infinity) {
  if (Array.isArray(s?.walls)) return Math.min(Infinity, ...wallViews(s).map((v) => wallDistance(v, x, z, within)));
  const line = wallLine(s);
  if (!line) return Infinity;
  const b = line.box;
  if (x < b.x0 - within || x > b.x1 + within || z < b.z0 - within || z > b.z1 + within) return Infinity;
  return lineDistance(line.pts, x, z);
}

// Distance from (x, z) to an open line through pts.
export function lineDistance(pts, x, z) {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const ax = pts[i - 1][0];
    const az = pts[i - 1][1];
    const dx = pts[i][0] - ax;
    const dz = pts[i][1] - az;
    const len2 = dx * dx + dz * dz;
    let u = len2 > 0 ? ((x - ax) * dx + (z - az) * dz) / len2 : 0;
    if (u < 0) u = 0;
    else if (u > 1) u = 1;
    const qx = ax + dx * u - x;
    const qz = az + dz * u - z;
    const d2 = qx * qx + qz * qz;
    if (d2 < best) best = d2;
  }
  return Math.sqrt(best);
}

// Where the wall is at (x, z), for shaping the ground: { e, dw, wn, t } -
// how far inside the shape (negative outside, measured to the outline the
// wall runs round), how far from the wall's line, how much of a wall the
// edge nearest is (1 along the wall, easing to 0 over its last metre at
// each end, 0 elsewhere), and the fraction round the outline of that
// nearest edge. Null without a wall.
export function wallAt(s, x, z) {
  // (Several: the one whose wall the nearest edge most is, then the nearer.)
  if (Array.isArray(s?.walls)) {
    let best = null;
    for (const v of wallViews(s)) {
      const a = wallAt(v, x, z);
      if (a && (!best || a.wn > best.wn + 1e-9 || (Math.abs(a.wn - best.wn) <= 1e-9 && a.dw < best.dw))) best = a;
    }
    return best;
  }
  const wall = wallOf(s);
  if (!wall) return null;
  const o = edgeOf(s);
  const near = nearestOnEdge(o, x, z);
  const e = near.inside ? near.d : -near.d;
  const into = intoSpan(o, near.t, wall.a);
  const taper = Math.min(TAPER, (spanOf(wall.a) * o.total) / 3);
  const wn = into <= 0 ? 0 : smoothstep01(into / taper);
  return { e, dw: wallDistance(s, x, z), wn, t: near.t };
}

// ---- Making and changing a wall ---------------------------------------------------------

// A wall tidied for a shape of `kind` ("bunker" or "water"): its height in
// range, its ends to three decimals, what it's made of. Null if it can't
// be one: too short (under MIN_WALL metres, or less than the least share
// of the way round) or too long (more than the most).
export function cleanWall(s, wall, kind) {
  if (!wall || !Array.isArray(wall.a) || wall.a.length !== 2 || !wall.a.every(fin) || !fin(wall.h)) return null;
  const spec = WALLS[kind];
  const [lo, hi] = wallHeights(kind);
  const a = wall.a.map((t) => r3(((t % 1) + 1) % 1));
  const span = spanOf(a);
  const o = edgeOf(s);
  if (span < spec.span[0] - 1e-9 || span > spec.span[1] + 1e-9 || span * o.total < MIN_WALL - 1e-6) return null;
  return { a, h: r2(clamp(wall.h, lo, hi)), m: Number.isInteger(wall.m) && wall.m > 0 && wall.m < spec.kinds.length ? wall.m : 0 };
}

// The fraction of the way round `s`'s outline nearest (x, z).
export function tNear(s, x, z) {
  return nearestOnEdge(edgeOf(s), x, z).t;
}

// Which way a new wall on a bunker or pond (defaultWall) faces: "green" if
// the shape is within 40 m of the green's edge, otherwise a bunker's
// "far" side (down the hole) or a pond's "fairway" side.
export function wallFacing(L, s, kind) {
  const o = edgeOf(s);
  const g = L.green;
  const gOutline = g.poly ?? blobOutline(g, 48);
  let gap = Infinity;
  for (const [x, z] of o.pts) {
    for (const [gx, gz] of gOutline) gap = Math.min(gap, Math.hypot(x - gx, z - gz));
  }
  return gap < 40 ? "green" : kind === "water" ? "fairway" : "far";
}

// A new wall for a bunker or pond on hole L: centred on the side that
// faces the green if the shape is near it (within 40 m of its edge) - a
// green built up to the wall - otherwise, for a bunker, on its far side
// along the hole (the side a shot out has to go over), and for a pond on
// the side nearest the line of play. Up to a third of the way round, and
// no longer than a bunker's or pond's first wall is made.
export function defaultWall(L, s, kind) {
  const o = edgeOf(s);
  const g = L.green;
  let mid;
  if (wallFacing(L, s, kind) === "green") mid = tNear(s, g.x, g.z);
  else {
    const path = makePath(L.path);
    let best = -Infinity;
    o.pts.forEach(([x, z], i) => {
      const n = nearest(path, x, z);
      // (A pond across the hole: where the ball comes to it, from the tee.)
      const score = kind === "water" ? -Math.abs(n.d) - 0.05 * n.s : n.s;
      if (score > best) {
        best = score;
        mid = o.cum[i] / o.total;
      }
    });
  }
  const spec = WALLS[kind];
  const span = Math.min(1 / 3, spec.first.longest / o.total, spec.span[1]);
  const wall = { a: [mid - span / 2, mid + span / 2], h: spec.first.h, m: spec.first.m };
  return cleanWall(s, wall, kind);
}

// A wall with one end (which 0 or 1) slid round the edge to the point
// nearest (x, z), or (which "move") the whole wall slid round by as much
// as the spot `from` has moved to (x, z). Tidied (cleanWall); null if that
// would make it too short or too long.
export function wallFromDrag(s, wall, which, x, z, kind, from = null) {
  const t = tNear(s, x, z);
  let a;
  if (which === "move") {
    const t0 = tNear(s, from[0], from[1]);
    let dt = t - t0;
    if (dt > 0.5) dt -= 1;
    if (dt < -0.5) dt += 1;
    a = [wall.a[0] + dt, wall.a[1] + dt];
  } else a = which === 0 ? [t, wall.a[1]] : [wall.a[0], t];
  return cleanWall(s, { ...wall, a }, kind);
}

// ---- A pond's water, and the wall's ends -----------------------------------------------

// A pond on a designed hole that lies below the grass, on a bank of its
// own down to the water inside its outline (the owner, 19 October 2026:
// "the drawn looks the connection to the surrounding ground, lips in
// bunkers and ponds. Less flat feel to both"): every one, not only those
// with a wall - a sheet of water laid flat on flat grass read as painted
// on. drop: how far below the grass the water lies; bank: how far in from
// its edge the bank reaches the water, easing out underneath it. A brook,
// a links burn (a channel of its own) and a mapped lake (on its real
// ground) aren't.
export const POND_SINK = { drop: 0.35, bank: 2.4 };
export const sunkPond = (w) => !!w && !w.brook && !w.burn && !w.poly;

// A designed pond's bank, all the way round it (the owner, 23 October
// 2026: "water edges look very different and are often smooth due to
// water erosion"): not the same everywhere - in stretches the grass rolls
// gently down nearly to the water, in others the water has worn it back
// to a short, steep bank of earth under a lip of turf. At angle `a` round
// it (from its middle, in the hole's frame): `bank`, how far in from its
// edge the ground takes to reach its bed (POND_SINK.bank on average, the
// water about halfway); `turf`, how far above the water the grass comes
// down (sim/holeedits/ground.mjs digs it, course/holebuild.js draws it);
// and `steep`, 0 - 1, how worn it is there. Smooth all the way round, its
// own for each pond.
export const SHORE = { wide: 1.45, narrow: 0.45, turf: [0.03, 0.34] };
export function shoreAt(w, a) {
  const p = (w.phase ?? 0) * 6.283 + (w.x ?? 0) * 0.137 + (w.z ?? 0) * 0.291;
  const n = 0.5 + 0.32 * Math.sin(2 * a + p) + 0.18 * Math.sin(3 * a + 1.7 * p + 1) + 0.1 * Math.sin(5 * a + 2.3 * p + 2);
  const steep = Math.min(1, Math.max(0, n));
  return {
    bank: POND_SINK.bank * (SHORE.wide + (SHORE.narrow - SHORE.wide) * steep),
    turf: SHORE.turf[0] + (SHORE.turf[1] - SHORE.turf[0]) * steep ** 1.5,
    steep,
  };
}
// How far below the grass a designed hole's pond lies: its wall's height,
// or POND_SINK's.
export const pondDrop = (w) => (wallOf(w)?.h ?? (sunkPond(w) ? POND_SINK.drop : 0));

// The level a pond's water lies at: on a designed hole, the grass is at 0
// and a pond lies below it (pondDrop: its wall's height, or POND_SINK's -
// the grass round it isn't touched, so a green or fairway beside it stays
// where it was); on real ground, just under the lowest point of its edge,
// as the ground was before anything was built up by hand (baseHeight: the
// ground without hand shaping).
export function pondLevel(L, w, baseHeight = null) {
  if (L.source === "map" && w.poly && baseHeight) return Math.min(...w.poly.map(([x, z]) => baseHeight(x, z))) - 0.05;
  const drop = pondDrop(w);
  return drop ? -drop : 0;
}

// Points along a stretch of a shape's outline (fractions a = [t0, t1], as
// a wall's), at least every `step` metres, each with the way in (unit, into
// the sand or the water) and how far along the stretch it is - for
// drawing a wall, and the strips of ground along it.
export function outlineStrip(s, a, step = 0.25) {
  const o = edgeOf(s);
  // (Its start brought round into 0 - 1: a stretch reaching back past the
  // outline's start - wallReach's, past a wall's end - began at a fraction
  // below 0, and the walk round the outline stopped before it had started,
  // leaving a straight line from end to end across the bunker: the grass
  // laid along a pot's wall lay across the pit, through its sand.)
  const t0 = ((a[0] % 1) + 1) % 1;
  const span = spanOf(a) || 1;
  const d0 = t0 * o.total;
  const d1 = d0 + span * o.total;
  const n = o.pts.length;
  // The outline's own points in the stretch, and the ends.
  const start = pointAtT(o, t0);
  const raw = [start.p];
  for (let k = 1; k <= n; k++) {
    const i = (start.i + k) % n;
    const d = o.cum[i] + (start.i + k >= n ? o.total : 0);
    if (d <= d0 + 1e-9) continue;
    if (d >= d1 - 1e-9) break;
    raw.push(o.pts[i]);
  }
  raw.push(pointAtT(o, t0 + span).p);
  const out = [];
  for (let i = 0; i < raw.length; i++) {
    const [ax, az] = raw[i];
    if (i > 0) {
      const [px, pz] = raw[i - 1];
      const len = Math.hypot(ax - px, az - pz);
      if (len < 1e-6) continue;
      const k = Math.ceil(len / step);
      for (let j = 1; j < k; j++) out.push([px + ((ax - px) * j) / k, pz + ((az - pz) * j) / k]);
    }
    out.push([ax, az]);
  }
  // Inward: square to the line, to the inside of the outline; and how far
  // along each point is.
  let along = 0;
  return out.map((p, i) => {
    const q0 = out[Math.max(0, i - 1)];
    const q1 = out[Math.min(out.length - 1, i + 1)];
    const dx = q1[0] - q0[0];
    const dz = q1[1] - q0[1];
    const l = Math.hypot(dx, dz) || 1;
    if (i > 0) along += Math.hypot(p[0] - out[i - 1][0], p[1] - out[i - 1][1]);
    return { p, in: [(-dz / l) * o.turn, (dx / l) * o.turn], along };
  });
}

// The wall's line as outlineStrip gives it. Null without a wall.
export function wallStrip(s, step = 0.25) {
  const wall = wallOf(s);
  return wall ? outlineStrip(s, wall.a, step) : null;
}

// The stretch a wall runs along, and `ext` metres more at each end (for the
// strip of grass along its top, which runs on a little past its ends).
export function wallReach(s, ext) {
  const wall = wallOf(s);
  if (!wall) return null;
  const o = edgeOf(s);
  const dt = Math.min(ext / o.total, (1 - spanOf(wall.a)) / 2 - 0.001);
  return [wall.a[0] - dt, wall.a[0] + spanOf(wall.a) + dt];
}

// Where the ground drawn at (x, z) should take its height from, next to a
// wall: right by the wall on its low side (or on the line itself), the
// ground `inset` metres in from it - its foot - so sand or a bank drawn
// there never climbs the face; null anywhere else. (By default: as far in
// as the face leans, and a little more.)
export function footSpot(s, x, z, reach = null, inset = null) {
  if (Array.isArray(s?.walls)) {
    for (const v of wallViews(s)) {
      const q = footSpot(v, x, z, reach, inset);
      if (q) return q;
    }
    return null;
  }
  const wall = wallOf(s);
  // (A pot's face leans back: its foot further in.)
  inset ??= Math.max(0.25, faceRun(s) + 0.05);
  reach ??= inset + 0.05;
  if (!wall || wallDistance(s, x, z, reach) > reach) return null;
  const o = edgeOf(s);
  const near = nearestOnEdge(o, x, z);
  if (!inSpan(near.t, wall.a)) return null;
  const e = near.inside ? near.d : -near.d;
  if (e < -0.05) return null;
  const at = pointAtT(o, near.t);
  const k = Math.max(e, inset);
  return [at.p[0] + at.in[0] * k, at.p[1] + at.in[1] * k];
}

// ---- Walls from a map ----------------------------------------------------------------

// What a wall mapped in OpenStreetMap is built of, as a pond's or a
// bunker's wall is (`m`): a pond's timber (0) or brick (1), a bunker's turf
// (0) or timber (1).
const BUILT = {
  water: { wood: 0, timber: 0, brick: 1, stone: 1, concrete: 1, masonry: 1 },
  bunker: { wood: 1, timber: 1, turf: 0, sod: 0 },
};

// Shapes (bunkers or ponds, `kind`) with the walls mapped along them put
// on: a line (hole frame, { line, material, height }) with at least 70% of
// it within 2.5 m of a shape's edge is that shape's wall, running round
// the edge between where its ends fall. Its height from the map (brought
// into range), else a pond's half a metre or a bunker's 1.2 m. One wall to
// a shape; shapes without one are returned as they were.
export function wallsFromLines(shapes, lines, kind) {
  if (!lines?.length) return shapes;
  return shapes.map((s) => {
    const o = edgeOf(s);
    for (const w of lines) {
      const pts = [];
      for (let i = 1; i < w.line.length; i++) {
        const [ax, az] = w.line[i - 1];
        const [bx, bz] = w.line[i];
        const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 0.5));
        for (let k = 0; k < n; k++) pts.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n]);
      }
      pts.push(w.line[w.line.length - 1]);
      const b = o.box;
      if (!pts.some(([x, z]) => x > b.x0 - 3 && x < b.x1 + 3 && z > b.z0 - 3 && z < b.z1 + 3)) continue;
      const close = pts.filter(([x, z]) => nearestOnEdge(o, x, z).d <= 2.5).length;
      if (close < pts.length * 0.7) continue;
      // Round the edge from one end to the other, the way the line goes.
      let t0 = tNear(s, ...pts[0]);
      let t1 = tNear(s, ...pts[pts.length - 1]);
      const tm = tNear(s, ...pts[Math.floor(pts.length / 2)]);
      if (!inSpan(tm, [t0, t1])) [t0, t1] = [t1, t0];
      const spec = WALLS[kind];
      const m = BUILT[kind][String(w.material ?? "").toLowerCase()] ?? spec.first.m;
      const wall = cleanWall(s, { a: [t0, t1], h: w.height ?? spec.first.h, m }, kind);
      if (wall) return { ...s, wall };
    }
    return s;
  });
}
