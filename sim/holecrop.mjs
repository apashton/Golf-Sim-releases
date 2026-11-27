// The crop built for one hole (docs/COURSE-LOD-PLAN.md, stage 2): a circle
// pushed forward along the hole's tee-to-green line (CROP.behind behind the
// tee, the rest ahead), radius
// max(CROP.radius.min, half the hole's length + CROP.radius.pad), grown to
// take in the walk from this green to the next tee so a later buggy stays
// on drawn ground; it fades out over CROP.fade at its edge. (A box round
// the hole cut neighbours off in straight, ragged lines.) `box` is the
// circle's bounding square, for the ground built under it. Neighbour
// shapes are clipped to that box. Each one gets a tier from how far it
// sits past this hole's own ground. The next hole's parts, if the crop
// reaches them, are tier 1 whatever that distance. Pure: nothing is drawn
// here, and courseNeighbours is left as it is until a later stage asks
// for the crop.

import { coursePlaces, toCourse } from "./imaginary.mjs";
import { holeFrame } from "./terrain.mjs";
import { courseNeighbours, NEIGHBOURS } from "./neighbours.mjs";
import { lineDistance, boxDistance } from "./country.mjs";
import { TIERS } from "./coursetiers.mjs";

export const CROP = {
  // How far past the hole's own bounds the crop reaches, by preset.
  // (sim/coursetiers.mjs: the one table.)
  pad: TIERS.pad,
  // The walk to the next tee: this far either side of that line is in
  // the crop even when the pad doesn't reach it.
  corridor: 150,
  // Parts fade into the painted picture over this many metres inside
  // the crop's edge.
  fade: 80,
  // The circle: radius max(min, half the hole's length + pad), metres.
  radius: { min: 600, pad: 400 },
  // The circle is pushed forward along the tee-to-green line so only this
  // much lies behind the tee (nobody hits backwards; you see far ahead):
  // about 600 m past the green for most holes.
  behind: 200,
  // The walk to the next tee is covered this far past its tee.
  teeMargin: 60,
  // The circle's edge as a polygon, for clipping shapes to it.
  sides: 96,
  // Neighbour parts this close to this hole's own ground (metres past
  // it; 0 or less is on it) are tier 1. Standard has none, except the
  // next hole, which is always tier 1.
  t1: TIERS.t1,
};

const SHAPES = ["fairways", "greens", "tees", "bunkers", "water", "woods", "causeways"];

export const presetPad = (preset = "high") => CROP.pad[preset] ?? CROP.pad.high;
export const presetT1 = (preset = "high") => CROP.t1[preset] ?? CROP.t1.high;

// The hole's own bounds in its frame: its line and its pin.
export function holeBounds(layout) {
  const path = layout?.path?.length ? layout.path : [[0, 0]];
  let x0 = Infinity;
  let x1 = -Infinity;
  let z0 = Infinity;
  let z1 = -Infinity;
  for (const [x, z] of path) {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    z0 = Math.min(z0, z);
    z1 = Math.max(z1, z);
  }
  const pin = layout?.pin;
  if (pin) {
    x0 = Math.min(x0, pin[0]);
    x1 = Math.max(x1, pin[0]);
    z0 = Math.min(z0, pin[1]);
    z1 = Math.max(z1, pin[1]);
  }
  return { x0, x1, z0, z1 };
}

export const expandBox = (box, pad) => ({ x0: box.x0 - pad, x1: box.x1 + pad, z0: box.z0 - pad, z1: box.z1 + pad });

export function unionBox(a, b) {
  if (!b) return a;
  return { x0: Math.min(a.x0, b.x0), x1: Math.max(a.x1, b.x1), z0: Math.min(a.z0, b.z0), z1: Math.max(a.z1, b.z1) };
}

// The box round the line from `a` to `b`, grown by `half` on every side.
export function corridorBox(a, b, half) {
  return {
    x0: Math.min(a[0], b[0]) - half,
    x1: Math.max(a[0], b[0]) + half,
    z0: Math.min(a[1], b[1]) - half,
    z1: Math.max(a[1], b[1]) + half,
  };
}

// The next hole's tee in hole `index`'s frame, or null on the last hole.
export function nextTeeInFrame(course, index) {
  const holes = course?.holes ?? [];
  const next = index + 1;
  if (!holes[index]?.layout || !holes[next]?.layout) return null;
  const places = coursePlaces(course);
  if (!places?.[index] || !places[next]) return null;
  const mine = holeFrame([places[index].x, places[index].z], places[index].heading);
  return mine.toHole(toCourse(places[next], [0, 0]));
}

// The hole's line from tee to green: its middle (halfway along it) and
// its length.
export function lineMiddle(path) {
  if (!path?.length) return { mid: [0, 0], length: 0 };
  let length = 0;
  for (let i = 1; i < path.length; i++) length += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
  let at = length / 2;
  for (let i = 1; i < path.length; i++) {
    const d = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
    if (at <= d) {
      const k = d ? at / d : 0;
      return { mid: [path[i - 1][0] + (path[i][0] - path[i - 1][0]) * k, path[i - 1][1] + (path[i][1] - path[i - 1][1]) * k], length };
    }
    at -= d;
  }
  return { mid: [path[0][0], path[0][1]], length };
}

// { box, circle, bounds, pad, corridor, green, nextTee } in the hole's own
// frame. circle { x, z, r }: radius max(radius.min, half the line's length
// + radius.pad), its centre on the tee-to-green direction (the line's end,
// not the cup) placed so CROP.behind lies behind the tee and the rest ahead;
// grown so the green and the next tee lie inside it with teeMargin and the
// edge's fade to spare. box: the circle's bounding square.
export function cropBoxFor(layout, { pad = CROP.radius.pad, min = CROP.radius.min, corridor = CROP.corridor, nextTee = null, pin = null } = {}) {
  const bounds = holeBounds(layout);
  const path = layout?.path?.length ? layout.path : [[0, 0]];
  const green = pin ?? layout?.pin ?? path.at(-1) ?? null;
  const { length } = lineMiddle(path);
  let r = Math.max(min, length / 2 + pad);
  const tee = path[0];
  const end = path.at(-1);
  const chord = Math.hypot(end[0] - tee[0], end[1] - tee[1]);
  const dir = chord > 1e-6 ? [(end[0] - tee[0]) / chord, (end[1] - tee[1]) / chord] : [1, 0];
  const mid = [tee[0] + dir[0] * (r - CROP.behind), tee[1] + dir[1] * (r - CROP.behind)];
  for (const p of [path[0], path.at(-1), green, nextTee]) {
    if (p) r = Math.max(r, Math.hypot(p[0] - mid[0], p[1] - mid[1]) + CROP.teeMargin + CROP.fade);
  }
  const circle = { x: mid[0], z: mid[1], r };
  const box = { x0: mid[0] - r, x1: mid[0] + r, z0: mid[1] - r, z1: mid[1] + r };
  return { box, circle, bounds, pad, corridor, green, nextTee };
}

// Optimized: Use squared distances to avoid Math.hypot for circular checks
export const pointInBox = (x, z, box) => {
  if (box.r != null) {
    const dx = x - box.x;
    const dz = z - box.z;
    return dx * dx + dz * dz <= box.r * box.r;
  }
  return x >= box.x0 && x <= box.x1 && z >= box.z0 && z <= box.z1;
};

// 1 inside the crop, easing to 0 over `fade` metres at its edge, 0 outside:
// a circle ({ x, z, r }) or a box. Smooth (no kink where it starts).
export function edgeFade(x, z, box, fade = CROP.fade) {
  // Optimized: Calculate squared distance first and add fast returns before calculating square root
  let d;
  if (box.r != null) {
    const dx = x - box.x;
    const dz = z - box.z;
    const distSq = dx * dx + dz * dz;
    if (distSq >= box.r * box.r) return 0;
    const fadeRadius = box.r - fade;
    if (fadeRadius >= 0 && distSq <= fadeRadius * fadeRadius) return 1;
    d = box.r - Math.sqrt(distSq);
  } else {
    d = Math.min(x - box.x0, box.x1 - x, z - box.z0, box.z1 - z);
  }

  if (d >= fade) return 1;
  if (d <= 0) return 0;
  const t = d / fade;
  return t * t * (3 - 2 * t);
}

// The circle's edge as a polygon (convex), for clipping.
const circlePoly = (c, n = CROP.sides) => Array.from({ length: n }, (_, k) => {
  const a = (k / n) * Math.PI * 2;
  return [c.x + Math.cos(a) * c.r, c.z + Math.sin(a) * c.r];
});

// A polygon clipped to a convex one (counter-clockwise), Sutherland-Hodgman.
function clipConvex(poly, clip) {
  let out = poly.map((p) => [p[0], p[1]]);
  for (let i = 0; i < clip.length && out.length >= 3; i++) {
    const a = clip[i];
    const b = clip[(i + 1) % clip.length];
    const side = (p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
    const cross = (p, q) => {
      const sp = side(p);
      const t = sp / (sp - side(q));
      return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
    };
    const next = [];
    for (let k = 0; k < out.length; k++) {
      const p = out[k];
      const q = out[(k + 1) % out.length];
      const pin = side(p) >= 0;
      const qin = side(q) >= 0;
      if (pin && qin) next.push(q);
      else if (pin && !qin) next.push(cross(p, q));
      else if (!pin && qin) {
        next.push(cross(p, q));
        next.push(q);
      }
    }
    out = next;
  }
  return out.length >= 3 ? out : [];
}

const insideEdge = (p, edge, box) => {
  if (edge === 0) return p[0] >= box.x0;
  if (edge === 1) return p[0] <= box.x1;
  if (edge === 2) return p[1] >= box.z0;
  return p[1] <= box.z1;
};

const crossEdge = (a, b, edge, box) => {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  if (edge < 2) {
    const x = edge === 0 ? box.x0 : box.x1;
    const t = dx === 0 ? 0 : (x - a[0]) / dx;
    return [x, a[1] + dz * t];
  }
  const z = edge === 2 ? box.z0 : box.z1;
  const t = dz === 0 ? 0 : (z - a[1]) / dz;
  return [a[0] + dx * t, z];
};

// A polygon clipped to the box. [] when it misses the box.
export function clipPolygon(poly, box) {
  if (!poly || poly.length < 3 || !box) return [];
  if (box.r != null) return clipConvex(poly, circlePoly(box));
  let out = poly.map((p) => [p[0], p[1]]);
  for (let edge = 0; edge < 4; edge++) {
    if (out.length < 3) return [];
    const next = [];
    for (let i = 0; i < out.length; i++) {
      const a = out[i];
      const b = out[(i + 1) % out.length];
      const ain = insideEdge(a, edge, box);
      const bin = insideEdge(b, edge, box);
      if (ain && bin) next.push(b);
      else if (ain && !bin) next.push(crossEdge(a, b, edge, box));
      else if (!ain && bin) {
        next.push(crossEdge(a, b, edge, box));
        next.push(b);
      }
    }
    out = next;
  }
  return out.length >= 3 ? out : [];
}

// The part of a line that lies in the box, as points in order.
export function clipLine(line, box) {
  if (!line?.length || !box) return [];
  const out = [];
  const push = (p) => {
    const last = out.at(-1);
    if (!last || Math.hypot(last[0] - p[0], last[1] - p[1]) > 1e-6) out.push([p[0], p[1]]);
  };
  if (line.length === 1) {
    if (pointInBox(line[0][0], line[0][1], box)) push(line[0]);
    return out;
  }
  for (let i = 1; i < line.length; i++) {
    const seg = box.r != null ? clipSegmentCircle(line[i - 1], line[i], box) : clipSegment(line[i - 1], line[i], box);
    if (!seg) continue;
    push(seg[0]);
    push(seg[1]);
  }
  return out;
}

// The part of a segment inside a circle, or null.
function clipSegmentCircle(a, b, c) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const fx = a[0] - c.x;
  const fz = a[1] - c.z;
  const A = dx * dx + dz * dz;
  const B = 2 * (fx * dx + fz * dz);
  const C = fx * fx + fz * fz - c.r * c.r;
  if (A === 0) return C <= 0 ? [a, b] : null;
  const disc = B * B - 4 * A * C;
  if (disc < 0) return null;
  const s = Math.sqrt(disc);
  const t0 = Math.max(0, (-B - s) / (2 * A));
  const t1 = Math.min(1, (-B + s) / (2 * A));
  if (t1 < t0) return null;
  return [[a[0] + t0 * dx, a[1] + t0 * dz], [a[0] + t1 * dx, a[1] + t1 * dz]];
}

// Liang-Barsky. Null when the segment misses the box.
function clipSegment(a, b, box) {
  let t0 = 0;
  let t1 = 1;
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const p = [-dx, dx, -dz, dz];
  const q = [a[0] - box.x0, box.x1 - a[0], a[1] - box.z0, box.z1 - a[1]];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return null;
      continue;
    }
    const t = q[i] / p[i];
    if (p[i] < 0) {
      if (t > t1) return null;
      if (t > t0) t0 = t;
    } else {
      if (t < t0) return null;
      if (t < t1) t1 = t;
    }
  }
  return [[a[0] + t0 * dx, a[1] + t0 * dz], [a[0] + t1 * dx, a[1] + t1 * dz]];
}

// Metres past this hole's own ground (0 on its edge, negative on it):
// the same edge ownArea uses, as a distance.
export function pastPlay(layout, x, z) {
  if (layout?.source === "map" && layout.region) return boxDistance(layout.region, x, z) - NEIGHBOURS.boxOwn;
  const edge = (layout?.treeLine ?? 40) + NEIGHBOURS.own;
  const pin = layout?.pin ?? layout?.path?.at(-1) ?? [0, 0];
  const path = layout?.path ?? [[0, 0]];
  return Math.min(lineDistance(path, x, z) - edge, Math.hypot(x - pin[0], z - pin[1]) - NEIGHBOURS.greenOwn, Math.hypot(x, z) - NEIGHBOURS.teeOwn);
}

// "t1" near this hole and for the next hole; "t2" for the rest of the crop.
export function tierFor(dist, { preset = "high", nextHole = false, shed = false } = {}) {
  if (nextHole) return "t1";
  const near = shed ? 0 : presetT1(preset);
  if (near > 0 && dist <= near) return "t1";
  return "t2";
}

const nearest = (pts, layout) => {
  let best = Infinity;
  for (const [x, z] of pts) best = Math.min(best, pastPlay(layout, x, z));
  return best;
};

// One neighbour clipped to the crop, or null when none of it falls inside.
// `dist` is how far its nearest kept part sits past this hole's ground.
export function cropNeighbour(neighbour, layout, crop, { preset = "high", nextHole = false, shed = false } = {}) {
  const box = crop.circle ?? crop.box ?? crop;
  if (!neighbour || !box) return null;
  const shapes = {};
  let dist = Infinity;
  for (const key of SHAPES) {
    const kept = [];
    for (const poly of neighbour[key] ?? []) {
      const clipped = clipPolygon(poly, box);
      if (clipped.length < 3) continue;
      kept.push(clipped);
      dist = Math.min(dist, nearest(clipped, layout));
    }
    shapes[key] = kept;
  }
  const trees = [];
  const forms = [];
  (neighbour.trees ?? []).forEach((t, i) => {
    if (!pointInBox(t[0], t[1], box)) return;
    trees.push(t);
    if (neighbour.forms) forms.push(neighbour.forms[i]);
    dist = Math.min(dist, pastPlay(layout, t[0], t[1]));
  });
  const decor = (neighbour.decor ?? []).filter((d) => pointInBox(d[0], d[1], box));
  const path = clipLine(neighbour.path, box);
  if (path.length) dist = Math.min(dist, nearest(path, layout));
  const anyShape = SHAPES.some((key) => shapes[key].length);
  if (!anyShape && !trees.length && !path.length && !decor.length) return null;
  const pin = neighbour.pin && pointInBox(neighbour.pin[0], neighbour.pin[1], box) ? neighbour.pin : path.at(-1) ?? null;
  return {
    ...neighbour,
    ...shapes,
    trees,
    forms,
    decor,
    path,
    pin,
    tier: tierFor(dist, { preset, nextHole, shed }),
    dist,
    nextHole,
  };
}

// The crop's box alone, without clipping neighbours. The far ground (stage
// 3) only needs the box.
export function cropBoxOf(course, index, { preset = "high" } = {}) {
  const layout = course?.holes?.[index]?.layout;
  if (!layout?.path?.length) return null;
  return cropBoxFor(layout, { nextTee: nextTeeInFrame(course, index), pin: layout.pin });
}

const middleOf = (path) => {
  let x = 0;
  let z = 0;
  for (const p of path) {
    x += p[0];
    z += p[1];
  }
  return [x / path.length, z / path.length];
};

// How far courseNeighbours has to look to be sure it has every hole the
// crop might cut into.
function reachFor(box, path) {
  const mid = middleOf(path);
  let reach = 0;
  for (const p of [[box.x0, box.z0], [box.x1, box.z0], [box.x0, box.z1], [box.x1, box.z1]]) reach = Math.max(reach, Math.hypot(p[0] - mid[0], p[1] - mid[1]));
  return reach + 80;
}

// The other holes' lines, and the walk from this green to the next tee,
// in this hole's frame. Cheap: no clipping. The crop's ground uses them
// to stay fine along play and coarse everywhere else.
export function neighbourPaths(course, index) {
  const holes = course?.holes ?? [];
  const places = coursePlaces(course);
  const layout = holes[index]?.layout;
  if (!layout?.path?.length || !places?.[index]) return [];
  const mine = holeFrame([places[index].x, places[index].z], places[index].heading);
  const out = [];
  holes.forEach((h, i) => {
    const path = h?.layout?.path;
    if (i === index || !path?.length || !places[i]) return;
    out.push(path.map((p) => mine.toHole(toCourse(places[i], p))));
  });
  const next = nextTeeInFrame(course, index);
  const pin = layout.pin ?? layout.path.at(-1);
  if (pin && next) out.push([pin, next]);
  return out;
}

// The crop for hole `index`: its box, and the other holes clipped into
// it. woods: false leaves out the made-up woods past a designed hole's
// own trees (those stay with the far woods until stage 5).
export function holeCrop(course, index, { preset = "high", woods = false, shed = false } = {}) {
  const layout = course?.holes?.[index]?.layout;
  const pad = presetPad(preset);
  if (!layout?.path?.length) return { box: null, bounds: null, pad, corridor: CROP.corridor, green: null, nextTee: null, preset, neighbours: [], nextIndex: null };
  const nextIndex = index + 1 < (course.holes?.length ?? 0) ? index + 1 : null;
  const nextTee = nextTeeInFrame(course, index);
  const spec = cropBoxFor(layout, { nextTee, pin: layout.pin });
  const raw = courseNeighbours(course, index, { reach: reachFor(spec.box, layout.path), woods });
  const neighbours = [];
  for (const n of raw) {
    const cropped = cropNeighbour(n, layout, spec, { preset, nextHole: n.index === nextIndex, shed });
    if (cropped) neighbours.push(cropped);
  }
  return { ...spec, preset, neighbours, nextIndex };
}

// Other holes' fairways, greens and tees in hole `index`'s crop, for its
// links dunes to level under (sim/rolls.mjs calmField): they lie on their
// own shaped ground, as when they're played. null off links.
export function calmShapes(course, index) {
  const layout = course?.holes?.[index]?.layout;
  if (!layout?.links || layout.source === "map") return null;
  const out = [];
  for (const h of holeCrop(course, index, { woods: false }).neighbours) out.push(...(h.fairways ?? []), ...(h.greens ?? []), ...(h.tees ?? []));
  return out.length ? out.map((p) => p.map(([x, z]) => [Math.round(x * 10) / 10, Math.round(z * 10) / 10])) : null;
}
