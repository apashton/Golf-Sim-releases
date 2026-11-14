// Each hole's cart paths as they're played on the course with the others
// (the owner, 28 October 2026: "Cart paths should mainly be as per the
// hole creation ... let's ensure the paths make sense both logistically
// and visually"). A hole's path is laid out knowing only its own hole
// (sim/paths.mjs generatePath), so here and there one ran onto another
// hole's ground: Nine Oaks' 7th through the 6th green's bunkers, Golf Sim
// Links' 8th past the 7th green and the 2nd and its 17th over the 18th
// tee, Links by the Sea's 1st over the 2nd tee. Each is kept as it was
// made - over its brooks on bridges, as a hole is made now (sim/paths.mjs
// generatePath: a path the hole maker laid round them before is laid
// again) - but where it comes nearer another hole's green, tee boxes, sand or
// water than a path may (paths.mjs PATH_CLEAR) - but for water it crosses
// straight over on a bridge (sim/bridges.mjs crossesWell: the owner,
// "Don't forget you can build bridges"; a hole built as a map's crosses its
// neighbours' water on a bridge, as made): there it goes round them where
// the way round is short (sim/linkway.mjs linkWay), else it ends short of
// them and starts again past them (a piece left shorter than a path can be
// is dropped). And where two holes' paths run side by side a few metres
// apart, they share one (sim/sharepaths.mjs: "Can also play smart and
// share cart paths over small distances", the owner). A hole whose paths
// were drawn or changed by hand keeps them as they are. Pure; worked out
// once for a course as it is.

import { coursePlaces } from "./imaginary.mjs";
import { linkGrounds, linkWay, nearTrouble, LINK } from "./linkway.mjs";
import { groundTrouble, wetness, brookPaths, pathLine, validPath, cleanPath, fewerPoints, PATH_LENGTH, PATH_WIDTH, MAX_POINTS, WIDTHS } from "./paths.mjs";
import { crossesWell } from "./bridges.mjs";
import { besideRuns, onto, offPlay } from "./sharepaths.mjs";
import { stepsAlong } from "./linkway.mjs";
import { lockFor } from "./pathlock.mjs";
import { lineLength } from "./routing.mjs";

// Round what's in the way: from DETOUR.widen metres before it to as far
// past, the way round no longer than `most` times that stretch and
// `slack` metres more, nor across more of a hole's play than a path
// between holes may be (LINK.playMost). An end of it cut off by what's in
// the way, shorter than `stub` metres, is left out: no scrap of path on
// its own past the next tee.
export const DETOUR = { widen: 4, most: 1.8, slack: 25, stub: 25 };

// The edits that draw or change a hole's paths by hand (holeedits).
const BY_HAND = new Set(["p+", "p-", "p", "pa"]);
export const handPaths = (L) => (L?.edits ?? []).some((e) => BY_HAND.has(e?.k));

const inBox = (b, x, z) => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1;

// A hole's paths as its hole is made now, where the path it has is the one
// the hole maker laid round its brooks before they could be bridged
// (sim/course.mjs buildHole lays it from the hole's seed): laid again,
// over them. Else its own. (Never one drawn or changed by hand.)
const relaidKept = new WeakMap();
function relaid(L, spec) {
  if (!L?.water?.some((w) => w.brook) || L.paths?.length !== 1 || handPaths(L) || !Number.isFinite(spec?.seed)) return L?.paths;
  if (relaidKept.has(L)) return relaidKept.get(L);
  const { path, round } = brookPaths({ ...L, paths: [] }, spec.options?.paths ?? "auto", (spec.seed ^ 0x9a7b) >>> 0 || 1);
  const same = (a, b) => !!a && !!b && JSON.stringify(a.p) === JSON.stringify(b.p);
  const out = same(round, L.paths[0]) && path && !same(path, round) ? [{ ...path, w: L.paths[0].w ?? path.w, m: L.paths[0].m ?? path.m }] : L.paths;
  relaidKept.set(L, out);
  return out;
}

// Each hole's paths (its layout's, in its own frame), kept off the other
// holes' ground: the same list where nothing needed changing. places: the
// holes' places, if not the course's own (coursePlaces - worked out only
// if the course isn't known as it is). On the course's own places, as its
// paths were kept when first worked out, where they were and it's as it was
// then (sim/pathlock.mjs).
export function coursePaths(course, places = null) {
  const lock = places ? null : lockFor(course);
  if (!lock) return workedPaths(course, places);
  const layouts = (course?.holes ?? []).map((h) => h?.layout);
  const had = locked.get(course);
  if (had && had.lock === lock && had.layouts.every((l, i) => l === layouts[i])) return had.out;
  const out = layouts.map((L, i) => lock.holes[i] ?? L?.paths);
  locked.set(course, { lock, layouts, out });
  return out;
}
const locked = new WeakMap();

// The same, worked out afresh (as they'd be kept).
const kept = new WeakMap();
export function workedPaths(course, places = null) {
  const holes = course?.holes ?? [];
  const layouts = holes.map((h) => h?.layout);
  const key = places ? JSON.stringify(places.map((p) => (p ? [p.x, p.z, p.heading] : null))) : "";
  const had = kept.get(course)?.[key];
  if (had && had.layouts.length === layouts.length && had.layouts.every((l, i) => l === layouts[i])) return had.out;
  places ??= coursePlaces(course);
  let out = layouts.map((L) => L?.paths);
  if (holes.length >= 2) {
    const grounds = linkGrounds(course, places);
    out = layouts.map((L, i) => {
      const g = grounds[i];
      if (!g || !L.paths?.length || handPaths(L)) return L?.paths;
      const own = relaid(L, holes[i]?.spec);
      let changed = own !== L.paths;
      const paths = [];
      for (const p of own) {
        const pieces = validPath(p) ? keptOff(p, g, grounds) : null;
        if (!pieces) paths.push(p);
        else {
          changed = true;
          paths.push(...pieces);
        }
      }
      return changed ? paths : L.paths;
    });
    out = shared(out, grounds, layouts);
  }
  if (!kept.has(course)) kept.set(course, {});
  keepLast(kept.get(course), key, { layouts, out });
  return out;
}

// A course's results kept by key: the last two only (each set of places
// tried - the routing being dragged about in the designer - made another).
export function keepLast(store, key, value, most = 2) {
  delete store[key];
  store[key] = value;
  const keys = Object.keys(store);
  for (const k of keys.slice(0, Math.max(0, keys.length - most))) delete store[k];
}

// A hole's path kept off the other holes' ground: null if it's clear, else
// the pieces it comes to (hole frame, as layout.paths keeps them). round:
// going round what's in the way where it can (else only ended short of it).
function keptOff(p, g, grounds, round = true, depth = 0) {
  const half = Math.min(WIDTHS[1], Math.max(WIDTHS[0], p.w ?? PATH_WIDTH)) / 2;
  const others = grounds.filter((o) => o && o.index !== g.index);
  const line = pathLine(p).pts.map((q) => g.frame.toLocal(q));
  // (A hole built as a map's crosses its neighbours' water on a bridge -
  // its map has their water too: sim/bridges.mjs - as it was made.)
  const bridged = g.L.source === "map";
  const dry = (o, x, z) => {
    const t = groundTrouble(o.L, ...o.frame.toHole([x, z]), half, 0);
    return !!t && t !== "water";
  };
  const bad = line.map(([x, z]) => others.some((o) => nearTrouble(o, x, z) && dry(o, x, z)));
  // Over their water on a bridge, where it crosses it straight over; not
  // along it.
  if (!bridged) {
    const wet = line.map(([x, z]) => others.reduce((m, o) => (m === 2 || !nearTrouble(o, x, z) ? m : Math.max(m, wetness(o.L, ...o.frame.toHole([x, z]), half, 0))), 0));
    for (let i = 0; i < wet.length; i++) {
      if (!wet[i]) continue;
      let j = i;
      while (j + 1 < wet.length && wet[j + 1]) j++;
      if (!crossesWell(wet.slice(i, j + 1))) for (let k = i; k <= j; k++) bad[k] = true;
      i = j;
    }
  }
  if (!bad.includes(true)) return null;
  // The stretches in the way, each widened, and joined where they meet.
  const runs = [];
  for (let k = 0; k < line.length; k++) {
    if (!bad[k]) continue;
    const s = Math.max(0, k - DETOUR.widen);
    let e = k;
    while (e + 1 < line.length && bad[e + 1]) e++;
    const end = Math.min(line.length - 1, e + DETOUR.widen);
    if (runs.length && s <= runs[runs.length - 1][1]) runs[runs.length - 1][1] = end;
    else runs.push([s, end]);
    k = e;
  }
  // (Each piece with whether it's the path's own start or end.)
  const pieces = [];
  let piece = [];
  let head = true;
  let k = 0;
  for (const [s, e] of runs) {
    if (s > k) piece.push(...line.slice(k, s + 1));
    const ends = s === 0 || e === line.length - 1;
    const way = !ends && round && piece.length ? linkWay(grounds, line[s], line[e]) : null;
    if (way && way.length <= (e - s) * DETOUR.most + DETOUR.slack && way.inPlay <= LINK.playMost) piece.push(...way.line.slice(1, -1));
    else {
      pieces.push({ run: piece, head, tail: false });
      piece = [];
      head = false;
    }
    k = e;
  }
  if (k < line.length - 1) piece.push(...line.slice(k));
  pieces.push({ run: piece, head, tail: true });
  const out = [];
  for (const { run, head: first, tail } of pieces) {
    if (run.length < 2 || lineLength(run) < PATH_LENGTH[0]) continue;
    if ((first || tail) && pieces.length > 1 && lineLength(run) < DETOUR.stub) continue;
    let pts = run.map((q) => g.frame.toHole(q));
    for (let tol = 0.15; pts.length > MAX_POINTS; tol *= 1.5) pts = fewerPoints(run.map((q) => g.frame.toHole(q)), tol);
    if (pts.length > MAX_POINTS * 0.6) pts = fewerPoints(pts, 0.15);
    const made = cleanPath({ p: pts, w: p.w, m: p.m });
    if (!validPath(made) || pathLine(made).length < PATH_LENGTH[0]) continue;
    // (Its line drawn smooth through the points kept can still clip what
    // it went round: then cut there, as it is.)
    const again = depth < 2 ? keptOff(made, g, grounds, false, depth + 1) : null;
    out.push(...(again ?? [made]));
  }
  return out;
}

// Where two holes' paths run side by side (sim/sharepaths.mjs besideRuns),
// the one nearer the holes' play runs along the other's there - if the
// way onto it and back is clear (as keptOff keeps a path). Each hole's
// paths, the same list where none moved.
// (Two paths nearer than this, middle to middle, are one already.)
const SHARED = 1;
function shared(out, grounds, layouts) {
  const lines = [];
  out.forEach((ps, i) => {
    const g = grounds[i];
    if (!g) return;
    (ps ?? []).forEach((p, k) => {
      if (validPath(p)) lines.push({ i, k, p, pts: pathLine(p).pts.map((q) => g.frame.toLocal(q)) });
    });
  });
  const boxOf = (pts) => {
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    for (const [x, z] of pts) [x0, z0, x1, z1] = [Math.min(x0, x), Math.min(z0, z), Math.max(x1, x), Math.max(z1, z)];
    return { x0, z0, x1, z1 };
  };
  const meet = (a, b, r) => a.x0 - r <= b.x1 && b.x0 - r <= a.x1 && a.z0 - r <= b.z1 && b.z0 - r <= a.z1;
  let changed = false;
  for (let round = 0; round < 12; round++) {
    let moved = false;
    for (const a of lines) a.box = boxOf(a.pts);
    pairs: for (const a of lines) {
      for (const b of lines) {
        if (a.i >= b.i || !meet(a.box, b.box, 12)) continue;
        for (const run of besideRuns(a.pts, b.pts)) {
          // (Already one there.)
          if (run.gap < SHARED) continue;
          // (Kept: the one further off the two holes' play.)
          const plays = [grounds[a.i], grounds[b.i]];
          const keepA = offPlay(a.pts, run.a0, run.a1, plays) >= offPlay(b.pts, Math.min(run.b0, run.b1), Math.max(run.b0, run.b1), plays);
          const [guest, host] = keepA ? [b, a] : [a, b];
          if (handPaths(layouts[guest.i])) continue;
          const mine = keepA ? besideRuns(b.pts, a.pts).find((r) => r.gap >= SHARED && r.a0 <= Math.max(run.b0, run.b1) && r.a1 >= Math.min(run.b0, run.b1)) : run;
          if (!mine) continue;
          const pts = onto(guest.pts, host.pts, mine);
          const made = fitShared(pts, guest, grounds);
          if (!made) continue;
          guest.p = made;
          guest.pts = pathLine(made).pts.map((q) => grounds[guest.i].frame.toLocal(q));
          guest.box = boxOf(guest.pts);
          changed = moved = true;
          break pairs;
        }
      }
    }
    if (!moved) break;
  }
  if (!changed) return out;
  return out.map((ps, i) => {
    const mine = lines.filter((l) => l.i === i);
    if (!mine.length || mine.every((l) => l.p === ps[l.k])) return ps;
    const next = [...ps];
    for (const l of mine) next[l.k] = l.p;
    return next;
  });
}

// A hole's path laid along `pts` (course frame) as its layout keeps it, if
// it's clear of every hole's greens, tees and sand and crosses water only
// on a bridge (a hole built as a map's as it was) - else null.
function fitShared(pts, line, grounds) {
  const g = grounds[line.i];
  const half = Math.min(WIDTHS[1], Math.max(WIDTHS[0], line.p.w ?? PATH_WIDTH)) / 2;
  const bridged = g.L.source === "map";
  const flags = [];
  for (const [x, z] of stepsAlong(pts, 1)) {
    let wet = 0;
    for (const o of grounds) {
      if (!o || !nearTrouble(o, x, z)) continue;
      const h = o.frame.toHole([x, z]);
      const t = groundTrouble(o.L, ...h, half, 0);
      if (t && t !== "water") return null;
      if (!bridged) wet = Math.max(wet, wetness(o.L, ...h, half, 0));
    }
    flags.push(wet);
  }
  if (!crossesWell(flags)) return null;
  let hole = pts.map((q) => g.frame.toHole(q));
  for (let tol = 0.15; hole.length > MAX_POINTS; tol *= 1.4) hole = fewerPoints(pts.map((q) => g.frame.toHole(q)), tol);
  const made = cleanPath({ p: hole, w: line.p.w, m: line.p.m });
  return validPath(made) && pathLine(made).length >= PATH_LENGTH[0] ? made : null;
}

// Whether (x, z) in hole `index`'s frame is on another hole's water - where
// a path played on it goes over on a bridge (look/paths.js), as its own
// water does - or null if no other hole's water is near it. (Worked out
// once for a course as it is.)
const othersKept = new WeakMap();
export function othersWater(course, index) {
  let byHole = othersKept.get(course);
  if (!byHole) othersKept.set(course, (byHole = new Map()));
  if (byHole.has(index)) return byHole.get(index);
  const grounds = (course?.holes?.length ?? 0) >= 2 ? linkGrounds(course, coursePlaces(course)) : [];
  const me = grounds[index];
  const wet = me ? grounds.filter((o) => o && o.index !== index && o.L.water?.length && meets(o.box, me.box)) : [];
  const out = wet.length
    ? (x, z) => {
        const q = me.frame.toLocal([x, z]);
        return wet.some((o) => nearTrouble(o, ...q) && wetness(o.L, ...o.frame.toHole(q), 0, 0) === 2);
      }
    : null;
  byHole.set(index, out);
  return out;
}
const meets = (a, b) => a.x0 <= b.x1 && b.x0 <= a.x1 && a.z0 <= b.z1 && b.z0 <= a.z1;
