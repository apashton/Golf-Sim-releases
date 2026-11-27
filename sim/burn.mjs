// A real course's burn and its bridges: a step of making a course from its
// map (tools/realcourse.mjs, docs/REAL-COURSES.md), and of building one
// from the course plan, where the player draws the burn (sim/planbuild.mjs;
// tools/realsteps/burn.mjs re-exports it). The map draws a
// burn as a string of water areas, each twice over (as a golf water hazard
// and as natural water) and split wherever a way crosses it; made as they
// are, it was a winding ditch between painted lines and stakes, a muddy
// margin round it and a timber wall across it where a bridge's parapet ran
// along a piece's edge. Here it's made what the photographs show: one
// straight-sided channel walled in stone through the turf, as wide all
// along, with no stakes or lines (its walls mark it) - and the bridges over
// it put back by hand (the map's ways over it aren't tagged as bridges:
// cut at the water, what's left of each is shorter than a cart path's
// least, sim/paths.mjs pathsFromLines, and none of them is drawn).
//
// The course's definition says (tools/realcourses/<name>.json; the plan
// makes one the same):
//   burn     { line: [[lat, lon], ...] its middle, width (metres), walls
//            (what they're built of, as a map says it: "stone"), marks
//            (false: no stakes or painted line) }
//   bridges  [{ from, to: [lat, lon] its deck's ends, width (metres), look
//            ("arch" or "flat": sim/bridges.mjs) }]
//
// And a course with more than one channel - a brook, a river along its
// edge, ditches across its fairways - gives each the same way:
//   brooks   [{ what, line, width, kind ("brook", "ditch", "stream"),
//            natural (true: no walls, its width wandering), marks }] - or
//            "map": every way of the course's map tagged waterway, its
//            width, kind and marks as its tags say (brookChannels).
//
// Each step takes the course's holes, the definition and helpers -
// { placed(L), prepareHole } as tools/realcourse.mjs has them: placed(L)
// gives { geoOf(x, z), toHole(lat, lon) -> [x, z], toCourse, fromCourse }
// in hole L's own frame - and returns the holes, each changed only where
// its ground reaches the burn or a bridge.

import { brookShape, brookLine, BROOK_KINDS, BROOK_LENGTH, BROOK_WIDTH } from "./brooks.mjs";
import { BUILT } from "./walls.mjs";
import { validHandBridge } from "./bridges.mjs";

export const BURN = {
  // How far in from the edge of a hole's ground the burn and its bridges
  // stop (metres): its channel's banks are drawn and dug on the hole's own
  // ground, not off its edge.
  clip: 1,
  // A water area of the map lying along the burn - every point of its
  // outline within half the burn's width and this (metres) of its middle -
  // is a piece of it: the map's outlines stray up to 4.6 m from the line
  // through their middles on Auld Grey Links, the estuary beyond
  // thousands.
  along: 3.5,
  // The most dots a brook is drawn through (sim/brooks.mjs validBrook).
  dots: 40,
  // How far its water's edge keeps off a green's (metres): the map's own
  // water comes within 0.17 m of the 1st green there. Its line's moved
  // away where it would come nearer - the green comes first (sim/
  // greenfirst.mjs), and water reaching onto one gives way to it, leaving
  // a gap in the burn - its dots up to `shift` metres either side.
  green: 0.2,
  shift: 8,
};

const r2 = (v) => Math.round(v * 100) / 100;
const inset = (r, k) => ({ x0: r.x0 + k, x1: r.x1 - k, z0: r.z0 + k, z1: r.z1 - k });
const inBox = (b, x, z) => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1;
const lengthOf = (pts) => pts.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]), 0);

// Distance from (x, z) to a line through pts.
function lineGap(pts, x, z) {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1];
    const dx = pts[i][0] - ax;
    const dz = pts[i][1] - az;
    const l2 = dx * dx + dz * dz;
    const k = l2 > 0 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)) : 0;
    best = Math.min(best, Math.hypot(ax + dx * k - x, az + dz * k - z));
  }
  return best;
}

// The parts of a line inside a box: runs of points, each cut where it
// crosses the box's edge.
export function clipLine(pts, box) {
  const runs = [];
  let run = [];
  const cut = ([ax, az], [bx, bz]) => {
    // (Liang-Barsky: how far along a-b it's inside, t0 to t1.)
    let t0 = 0;
    let t1 = 1;
    const dx = bx - ax;
    const dz = bz - az;
    for (const [p, q] of [[-dx, ax - box.x0], [dx, box.x1 - ax], [-dz, az - box.z0], [dz, box.z1 - az]]) {
      if (p === 0) {
        if (q < 0) return null;
        continue;
      }
      const t = q / p;
      if (p < 0) t0 = Math.max(t0, t);
      else t1 = Math.min(t1, t);
      if (t0 > t1) return null;
    }
    return [t0, t1];
  };
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const t = cut(a, b);
    if (!t) {
      if (run.length > 1) runs.push(run);
      run = [];
      continue;
    }
    const at = (k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    if (!run.length) run.push(at(t[0]));
    run.push(at(t[1]));
    if (t[1] < 1) {
      if (run.length > 1) runs.push(run);
      run = [];
    }
  }
  if (run.length > 1) runs.push(run);
  return runs;
}

// A line kept to `most` points, its ends and as many between, evenly by
// count (the burn's are evenly spaced already).
function thinned(pts, most) {
  if (pts.length <= most) return pts;
  return Array.from({ length: most }, (_, i) => pts[Math.round((i * (pts.length - 1)) / (most - 1))]);
}

// The nearest spot on an outline's edge to (x, z): { x, z, d, inside }.
function nearestOnOutline(poly, x, z) {
  let best = { d: Infinity, x, z };
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, az] = poly[j];
    const [bx, bz] = poly[i];
    const dx = bx - ax;
    const dz = bz - az;
    const l2 = dx * dx + dz * dz;
    const k = l2 > 0 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)) : 0;
    const d = Math.hypot(ax + dx * k - x, az + dz * k - z);
    if (d < best.d) best = { d, x: ax + dx * k, z: az + dz * k };
    if (bz > z !== az > z && x < (dx * (z - bz)) / dz + bx) inside = !inside;
  }
  return { ...best, inside };
}

// A brook's dots moved, a little at a time, until its water keeps
// BURN.green off every green (outlines, hole frame): each dot near where
// it comes too close pushed straight away from the green there, the most
// at the nearest, none BURN.shift metres along.
export function clearOfGreens(brook, greens) {
  if (!greens.length) return brook;
  let b = brook;
  for (let pass = 0; pass < 16; pass++) {
    const line = brookLine(b);
    const half = BROOK_KINDS[b.kind ?? 0].half * (b.w ?? 1);
    const push = b.p.map(() => ({ k: 0, v: [0, 0] }));
    let short = false;
    for (const [x, z] of line.pts) {
      for (const g of greens) {
        const q = nearestOnOutline(g, x, z);
        const clear = (q.inside ? -q.d : q.d) - half;
        if (clear >= BURN.green - 1e-3) continue;
        short = true;
        const need = (BURN.green - clear) * 1.2 + 0.01;
        let [ux, uz] = [x - q.x, z - q.z];
        const l = Math.hypot(ux, uz) || 1;
        [ux, uz] = q.inside ? [-ux / l, -uz / l] : [ux / l, uz / l];
        b.p.forEach(([px, pz], k) => {
          const by = need * Math.max(0, 1 - Math.hypot(px - x, pz - z) / BURN.shift);
          if (by > push[k].k) push[k] = { k: by, v: [ux * by, uz * by] };
        });
      }
    }
    if (!short) return b;
    b = { ...b, p: b.p.map(([px, pz], k) => [r2(px + push[k].v[0]), r2(pz + push[k].v[1])]) };
  }
  return b;
}

// Is water shape `w` a piece of the burn along `line` (hole frame)?
export function alongBurn(w, line, reach) {
  return Array.isArray(w?.poly) && w.poly.length > 2 && w.poly.every(([x, z]) => lineGap(line, x, z) <= reach);
}

// The burn as a brook through `pts` (hole frame): as wide as it's given,
// even all along, walled both sides its whole length in what its walls are
// built of, its colour as the Rules give it (penaltyOf: yellow where it
// crosses the line of play, red beside it - not a brook's yellow always),
// and with no stakes or line if it's to have none; kept off the greens
// (outlines: clearOfGreens).
// (kind: "brook", "ditch" or "stream" - sim/brooks.mjs BROOK_KINDS; a brook
// unless said. natural: its width wanders a little, as a brook's own does -
// a channel nobody walled.)
export function burnBrook(pts, burn, greens = []) {
  const m = BUILT.water[String(burn.walls ?? "").toLowerCase()];
  const kind = Math.max(0, BROOK_KINDS.findIndex((k) => k.id === burn.kind));
  const half = BROOK_KINDS[kind].half;
  const w = Math.min(BROOK_WIDTH[1], Math.max(BROOK_WIDTH[0], (burn.width ?? 2 * half) / (2 * half)));
  const brook = { p: thinned(pts, BURN.dots).map(([x, z]) => [r2(x), r2(z)]), kind, w, ...(burn.natural ? {} : { even: true }) };
  if (m != null) brook.banks = [{ side: 0, s: [0, 1], m }, { side: 1, s: [0, 1], m }];
  const shape = brookShape(clearOfGreens(brook, greens));
  delete shape.penalty;
  if (burn.marks === false) shape.marks = false;
  return shape;
}

// The burn on every hole whose ground it crosses: the map's water along
// it gone (both copies of every piece, and with them the timber wall a
// bridge's parapet made on one), and in its place the burn as a brook
// (burnBrook) as far as the hole's ground goes - one for each stretch of it
// on the hole's ground at least a brook's shortest long. A hole it
// doesn't cross, or crosses for less than that, is left as it was.
export function burnChannel(holes, def, helpers) {
  const burn = def?.burn;
  if (!Array.isArray(burn?.line) || burn.line.length < 2) return holes;
  return holes.map((h) => {
    const L = h.layout;
    if (!L?.geo || !L.region) return h;
    const { toHole } = helpers.placed(L);
    const line = burn.line.map(([lat, lon]) => toHole(lat, lon));
    const runs = clipLine(line, inset(L.region, BURN.clip)).filter((run) => lengthOf(run) >= BROOK_LENGTH[0]);
    if (!runs.length) return h;
    const reach = (burn.width ?? 2 * BROOK_KINDS[Math.max(0, BROOK_KINDS.findIndex((k) => k.id === burn.kind))].half) / 2 + BURN.along;
    const water = (L.water ?? []).filter((w) => !alongBurn(w, line, reach));
    const greens = [L.green?.poly, ...(L.greens ?? [])].filter((g) => Array.isArray(g) && g.length > 2);
    const brooks = runs.map((run) => burnBrook(run, burn, greens)).filter((s) => brookLine(s.brook).length >= BROOK_LENGTH[0]);
    return { ...h, layout: { ...L, water: [...water, ...brooks] } };
  });
}

// The bridges placed by hand on every hole whose ground has them (both
// ends of the deck on it): layout.bridges, [{ p: its deck's ends (hole
// frame), w, look }] (sim/bridges.mjs validHandBridge). A hole with none is
// left as it was.
export function handBridges(holes, def, helpers) {
  const list = def?.bridges ?? [];
  if (!list.length) return holes;
  return holes.map((h) => {
    const L = h.layout;
    if (!L?.geo || !L.region) return h;
    const { toHole } = helpers.placed(L);
    const box = inset(L.region, BURN.clip);
    const bridges = list
      .map((b) => ({ p: [toHole(...b.from), toHole(...b.to)].map(([x, z]) => [r2(x), r2(z)]), w: b.width, look: b.look ?? "arch" }))
      .filter((b) => validHandBridge(b) && b.p.every(([x, z]) => inBox(box, x, z)));
    if (!bridges.length) return h;
    return { ...h, layout: { ...L, bridges } };
  });
}

// A course's other channels (the definition's `brooks`): each made as the
// burn is (burnChannel), one after another. list: [{ line, width, kind,
// natural, walls, marks }].
export function brookChannels(holes, list, helpers) {
  let out = holes;
  for (const burn of list ?? []) out = burnChannel(out, { burn }, helpers);
  return out;
}

// The channels a map draws as lines: its ways tagged waterway (the game's
// importer reads water only as areas, so they're no part of the course
// until this). -> [{ what, line: [[lat, lon], ...], width, kind, natural,
// marks }].
export function mapBrooks(map) {
  const kinds = { river: "stream", stream: "brook", ditch: "ditch", drain: "ditch", brook: "brook" };
  const out = [];
  for (const el of map?.elements ?? []) {
    const t = el.tags ?? {};
    if (el.type !== "way" || !kinds[t.waterway] || t.tunnel || !Array.isArray(el.geometry) || el.geometry.length < 2) continue;
    const width = parseFloat(t.width);
    out.push({ what: t.name ?? t.waterway, line: el.geometry.map((g) => [g.lat, g.lon]), ...(Number.isFinite(width) ? { width } : {}), kind: kinds[t.waterway], natural: true, ...(t.marks === "no" ? { marks: false } : {}) });
  }
  return out;
}
