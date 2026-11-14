// Cart paths between holes (the owner: "drawing cart paths from one hole to
// another"; and, 28 October 2026: "Cart paths should mainly be as per the
// hole creation. But the end of one hole finding it's way to the start of
// the new hole. It can from time to time end on a hole and start a fresh
// on a new hole, where the pathing would be substantial and not worth it.
// Carts can run over grass, but let's ensure the paths make sense both
// logistically and visually"): on a course whose holes are laid out
// together - a designed one by its routing, one from the map where its
// holes are - a path from where each hole's own path ends, past its green,
// on to where the next hole's starts, behind its tee: leaving the one and
// joining the other the way they run, and finding its way between them
// over the ground (sim/linkway.mjs) - round greens, tees, sand and water,
// off the line of every hole's play, out from under the trees where it
// can. Only where it's worth it (linkway.mjs LINK): where the two holes'
// paths meet already there's none, and where the way between them would
// be long, wander far round or cross a hole's play the one path ends and
// the next starts afresh - the carts go over the grass. (A hole with no
// path of its own there: from beside its green, to beside the next tee.)
// The course layout's map shows them, and a dot in the middle of each
// bends it where it's dragged (course.linkBends); the hole editor shows the
// ones to and from a hole, to drag one's bends about, give it more, put it
// back as worked out or have none (course.linkLines: drawLink - the owner,
// "Links can be adjusted on either hole in design"); play lays the ones to
// and from the hole being played as its own paths. On or off for the
// whole course: course.linkPaths. Never across a tee box (the owner: "cart
// paths when created have crossed over the tee box a few times") or any
// other hole's; a bend dragged where the path can't go isn't taken
// (bendLink). Pure.

import { clearedLayout } from "./treeclear.mjs";
import { coursePlaces, placeBearing } from "./imaginary.mjs";
import { lineLength } from "./routing.mjs";
import { blobRadius, TEE_REACH } from "./course.mjs";
import { holeFrame, polygonCentroid, polygonBounds } from "./terrain.mjs";
import { otherTeeBoxes, fewerPoints, pathLine, markLink, PATH_CLEAR, PATH_WIDTH, KERB, MAX_POINTS } from "./paths.mjs";
import { linkGrounds, linkWay, troubleAt, wetAt, stepsAlong, LINK } from "./linkway.mjs";
import { crossesWell } from "./bridges.mjs";
import { coursePaths, keepLast } from "./coursepaths.mjs";
import { besideRuns, onto, SHARE } from "./sharepaths.mjs";
import { lockFor } from "./pathlock.mjs";

// How far beside the green a path leaves it, where its hole has no path
// there (metres).
const OFF_GREEN = 9;
// How far a link path's middle keeps from a tee box's edge: its half
// width, its kerb, the clearance any path keeps from a tee, and a little.
export const TEE_MARGIN = PATH_WIDTH / 2 + KERB + PATH_CLEAR.tee + 0.4;
// It comes to the next tee this far out beside its boxes (metres past
// their side, its middle).
const BESIDE = 1;

const r1 = (v) => Math.round(v * 10) / 10;

// The green's size, roughly, either kind of hole.
function greenReach(L) {
  if (L?.green?.poly?.length > 2) {
    const g = L.green;
    let r = 0;
    for (const [x, z] of g.poly) r = Math.max(r, Math.hypot(x - g.x, z - g.z));
    return r;
  }
  return L?.green ? blobRadius(L.green, 0) : 12;
}

// A hole's tee boxes, in its own frame, as boxes { x0, x1, z0, z1 }: its own
// tee (a designed hole's 12 by 14 m; a mapped one's mapped box at its
// start, else the square that plays as tee) and the white and red (sim/
// paths.mjs otherTeeBoxes). Worked out once for a layout.
const zonesKept = new WeakMap();
export function teeZones(L) {
  if (!L?.path?.length) return [];
  const kept = zonesKept.get(L);
  if (kept) return kept;
  const R = TEE_REACH;
  let own = { x0: -6, x1: 6, z0: -7, z1: 7 };
  if (L.source === "map") {
    own = { x0: -R, x1: R, z0: -R, z1: R };
    for (const t of L.tees ?? []) {
      if (!Array.isArray(t) || t.length < 3) continue;
      const [cx, cz] = polygonCentroid(t);
      if (Math.hypot(cx, cz) > 8) continue;
      const b = polygonBounds(t);
      own = { x0: Math.min(own.x0, b.x0), x1: Math.max(own.x1, b.x1), z0: Math.min(own.z0, b.z0), z1: Math.max(own.z1, b.z1) };
    }
  }
  const zones = [own, ...otherTeeBoxes(L).map(([x, z]) => ({ x0: x - R, x1: x + R, z0: z - R, z1: z + R }))];
  zonesKept.set(L, zones);
  return zones;
}

// Does a line on the course's ground (course frame) come within `margin` of
// any of a hole's tee boxes (frame: the hole's, zones: teeZones)?
function crossesZones(line, frame, zones, margin = TEE_MARGIN) {
  if (line.length === 1) line = [line[0], line[0]];
  for (let i = 1; i < line.length; i++) {
    const [ax, az] = line[i - 1];
    const [bx, bz] = line[i];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az)));
    for (let k = 0; k <= n; k++) {
      const [x, z] = frame.toHole([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n]);
      for (const b of zones) if (x > b.x0 - margin && x < b.x1 + margin && z > b.z0 - margin && z < b.z1 + margin) return true;
    }
  }
  return false;
}

// The way in to a hole's tee from `from` (course frame), beside its boxes
// on the side it comes from: [...round, end] in the course frame - straight
// to beside them if that's clear, else round behind them (or in front, if
// it comes from ahead).
function toTee(from, frame, zones) {
  const [px, pz] = frame.toHole(from);
  const m = TEE_MARGIN;
  const X0 = Math.min(...zones.map((b) => b.x0)) - m;
  const X1 = Math.max(...zones.map((b) => b.x1)) + m;
  const own = zones[0];
  const side = pz >= 0 ? 1 : -1;
  // Beside the hole's own tee, about level with its middle.
  const face = (sd) => (sd > 0 ? Math.max(...zones.map((b) => b.z1)) + m + BESIDE : Math.min(...zones.map((b) => b.z0)) - m - BESIDE);
  const end = [Math.max(own.x0, Math.min(own.x1, -2)), face(side)];
  const out = (pts) => pts.map((q) => frame.toLocal(q));
  const direct = [from, frame.toLocal(end)];
  if (!crossesZones(direct, frame, zones)) return out([end]);
  if (px <= X0) return out([[X0 - 1, face(side)], end]);
  if (px >= X1) return out([[X1 + 1, face(side)], end]);
  // From level with them, round the far side: round behind them.
  return out([[X0 - 1, face(-side)], [X0 - 1, face(side)], end]);
}

// The paths, on the course's ground: [{ from, to, line: [[x, z]...],
// bend: [x, z] }] - from the end of hole index `from`'s path, by its
// green, to the start of `to`'s, behind its tee (linkEnds), the way the
// ground lets it (sim/linkway.mjs linkWay) - where one's worth laying
// (LINK): none where the two holes' paths are joined already, nor where
// the way between them would be long, wander far round, or cross a hole's
// play; the carts go over the grass. Empty when the course has them off.
// places: the holes' places, if known. refused: a bend of the owner's
// that would take it over a tee box, a green, sand or water (or with no
// way round them), so left out. quick: straight from end to end, round
// nothing - while a hole's dragged on the course's map. (Worked out once
// for a course as it is; and on its own places, as they were kept when
// first worked out, where they were and the course is as it was then:
// sim/pathlock.mjs.)
const laid = new WeakMap();
export function linkPaths(course, { places = null, always = false, quick = false } = {}) {
  const holes = course?.holes ?? [];
  if ((!course?.linkPaths && !always) || holes.length < 2) return [];
  const lock = places || quick || !course.linkPaths ? null : lockFor(course);
  if (lock) return lock.links;
  return layAll(course, { places, quick });
}

// The paths between holes worked out afresh (as they'd be kept): none
// where the course has them off.
export const laidLinks = (course) => (course?.linkPaths && (course.holes?.length ?? 0) >= 2 ? layAll(course, {}) : []);

function layAll(course, { places = null, quick = false }) {
  const holes = course.holes;
  // (The course's own places worked out only if it isn't known as it is.)
  const key = JSON.stringify([quick, places ? places.map((p) => (p ? [p.x, p.z, p.heading] : null)) : null, course.linkBends ?? null, course.linkLines ?? null]);
  const layouts = holes.map((h) => h?.layout);
  const kept = laid.get(course)?.[key];
  if (kept && kept.layouts.length === layouts.length && kept.layouts.every((l, i) => l === layouts[i])) return kept.out;
  const out = layLinks(course, places ?? coursePlaces(course), quick, !!places);
  if (!laid.has(course)) laid.set(course, {});
  keepLast(laid.get(course), key, { layouts, out });
  return out;
}

function layLinks(course, places, quick, given) {
  const holes = course.holes;
  // (Joining each hole's paths as they're played: kept off the other
  // holes' ground.)
  const grounds = linkGrounds(course, places, coursePaths(course, given ? places : null));
  const out = [];
  for (let i = 0; i + 1 < holes.length; i++) {
    const A = grounds[i];
    const B = grounds[i + 1];
    if (!A || !B) continue;
    // The owner's own line for it (the hole editor), or none at all.
    const drawn = course.linkLines?.[String(holes[i].spec?.number ?? i + 1)];
    if (Array.isArray(drawn) && !drawn.length) continue;
    if (Array.isArray(drawn) && drawn.length >= 2 && drawn.every((q) => Array.isArray(q) && Number.isFinite(q[0]) && Number.isFinite(q[1]))) {
      const line = drawn.map(([x, z]) => [r1(x), r1(z)]);
      out.push({ from: i, to: i + 1, line, bend: halfway(line), hand: true });
      continue;
    }
    const ends = linkEnds(A, B, places[i + 1], grounds);
    if (ends.joined) continue;
    const { from, to, leave, arrive } = ends;
    const said = course.linkBends?.[String(holes[i].spec?.number ?? i + 1)];
    const bent = Array.isArray(said) && said.length === 2 && said.every(Number.isFinite) ? said : null;
    let line = null;
    let refused = false;
    if (quick) line = bent ? [from, bent, to] : [from, to];
    else {
      // The owner's bend: through it, if it's somewhere a path can go.
      if (bent) {
        const one = troubleAt(grounds, ...bent) ? null : linkWay(grounds, leave, bent);
        const two = one && linkWay(grounds, bent, arrive);
        if (one && two) line = [from, ...one.line, ...two.line.slice(1), to];
        else refused = true;
      }
      if (!line) {
        const way = linkWay(grounds, leave, arrive);
        const length = way ? way.length + Math.hypot(leave[0] - from[0], leave[1] - from[1]) + Math.hypot(arrive[0] - to[0], arrive[1] - to[1]) : Infinity;
        const straight = Math.hypot(to[0] - from[0], to[1] - from[1]);
        // Not worth it: the holes' paths end and start afresh.
        if (!way || length > LINK.most || length > straight * LINK.detour + LINK.slack || way.inPlay > LINK.playMost) continue;
        line = [from, ...way.line, to];
      }
      line = alongPaths(line, grounds);
    }
    line = line.filter((q, k) => k === 0 || Math.hypot(q[0] - line[k - 1][0], q[1] - line[k - 1][1]) > 0.05).map(([x, z]) => [r1(x), r1(z)]);
    // (The dot to bend it by: the owner's bend, or halfway along it.)
    const bend = bent && !refused ? [r1(bent[0]), r1(bent[1])] : halfway(line);
    out.push({ from: i, to: i + 1, line, bend, ...(refused ? { refused: true } : {}) });
  }
  return out;
}

// A path between holes that runs right beside one there already runs on it
// (sim/sharepaths.mjs: "share cart paths over small distances", the
// owner) - eased onto it and off it again - and kept to a path's points.
function alongPaths(line, grounds) {
  let out = stepsAlong(line, 1);
  let moved = false;
  for (const g of grounds) {
    for (const p of g?.paths ?? []) {
      // (A run on it already, or along it, the way it was found.)
      for (const run of besideRuns(out, p, { near: SHARE.snap, min: SHARE.snapMin })) {
        if (run.gap < 0.3) continue;
        const next = onto(out, p, run, SHARE.snap);
        if (next.length < 2 || next.some(([x, z]) => troubleAt(grounds, x, z, true))) continue;
        out = next;
        moved = true;
      }
    }
  }
  if (!moved) return line;
  const all = out;
  for (let tol = 0.15; out.length > MAX_POINTS - 2; tol *= 1.4) out = fewerPoints(all, tol);
  return out;
}

// The point halfway along a line.
function halfway(line) {
  const len = lineLength(line);
  let s = 0;
  for (let i = 1; i < line.length; i++) {
    const d = Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]);
    if (s + d >= len / 2) {
      const t = d > 0 ? (len / 2 - s) / d : 0;
      return [r1(line[i - 1][0] + (line[i][0] - line[i - 1][0]) * t), r1(line[i - 1][1] + (line[i][1] - line[i - 1][1]) * t)];
    }
    s += d;
  }
  return line[line.length - 1];
}

// Where the path between hole A and the next, B, starts and ends (grounds:
// linkGrounds; place: B's): from the end of A's path by its green to the
// start of B's behind its tee - leaving the one, and coming to the other,
// the way that path runs (leave, arrive: LINK.lead on) - or, where a hole
// has no path there, from beside its green (on the side nearest the next
// tee) and to beside the next tee's boxes, on the side it comes from.
// { joined: true } where A's paths and B's meet already, by A's green and
// B's tee.
export function linkEnds(A, B, place, grounds) {
  const near = (g, at, within) => g.paths.flatMap((p) => p.filter(([x, z]) => Math.hypot(x - at[0], z - at[1]) <= within));
  const reach = greenReach(A.L);
  const byGreen = near(A, A.pin, reach + 60);
  const byTee = near(B, B.tee, 60);
  for (const [ax, az] of byGreen) for (const [bx, bz] of byTee) if (Math.hypot(ax - bx, az - bz) <= LINK.joined) return { joined: true };
  // A path's ends near a spot, each with the way the path runs out of it.
  const endsNear = (g, at, within) => {
    const out = [];
    for (const p of g.paths) {
      if (p.length < 2) continue;
      for (const [q, next] of [
        [p[0], p[Math.min(3, p.length - 1)]],
        [p[p.length - 1], p[Math.max(0, p.length - 4)]],
      ]) {
        if (Math.hypot(q[0] - at[0], q[1] - at[1]) > within) continue;
        const l = Math.hypot(q[0] - next[0], q[1] - next[1]) || 1;
        out.push({ at: q, dir: [(q[0] - next[0]) / l, (q[1] - next[1]) / l] });
      }
    }
    return out;
  };
  const tee = B.tee;
  const nearest = (list, p) => list.reduce((a, b) => (Math.hypot(b.at[0] - p[0], b.at[1] - p[1]) < Math.hypot(a.at[0] - p[0], a.at[1] - p[1]) ? b : a));
  const outs = endsNear(A, A.pin, reach + 45);
  const ins = endsNear(B, tee, 45);
  const frame = holeFrame(tee, place.heading);
  const zones = teeZones(B.L);
  let from = outs.length ? nearest(outs, tee) : null;
  if (!from) {
    // Off the green on the side nearest the next tee (and never on that
    // tee itself, where a green is right by it: nearer the green, or
    // further round it).
    const pin = A.pin;
    const toward = Math.atan2(tee[1] - pin[1], tee[0] - pin[0]);
    let start = null;
    for (const turn of [0, 0.6, -0.6, 1.2, -1.2, 1.8, -1.8]) {
      for (let off = OFF_GREEN; off >= 2 && !start; off -= 1) {
        const q = [pin[0] + Math.cos(toward + turn) * (reach + off), pin[1] + Math.sin(toward + turn) * (reach + off)];
        if (!crossesZones([q], frame, zones)) start = q;
      }
      if (start) break;
    }
    from = { at: start ?? [pin[0] + Math.cos(toward) * (reach + OFF_GREEN), pin[1] + Math.sin(toward) * (reach + OFF_GREEN)], dir: null };
  }
  const to = ins.length ? nearest(ins, from.at) : { at: toTee(from.at, frame, zones).at(-1), dir: null };
  // On a little the way each path runs, where that's clear.
  const on = (e) => {
    if (!e.dir) return e.at;
    const q = [e.at[0] + e.dir[0] * LINK.lead, e.at[1] + e.dir[1] * LINK.lead];
    return troubleAt(grounds, ...q) ? e.at : q;
  };
  return { from: from.at, to: to.at, leave: on(from), arrive: on(to) };
}

// The paths to and from hole `index` in its own frame, as its layout keeps
// paths (sim/paths.mjs: { p, w, m }), for play to lay with the hole's own.
export function linkPathsFor(course, index, { places = null } = {}) {
  const all = linkPaths(course, { places });
  if (!all.length) return [];
  const place = (places ?? coursePlaces(course))?.[index];
  if (!place) return [];
  const f = holeFrame([place.x, place.z], place.heading);
  return all
    .filter((l) => l.from === index || l.to === index)
    .map((l) => ({ p: l.line.map((q) => f.toHole(q).map((v) => Math.round(v * 100) / 100)), w: 2.4, m: 0, link: true }));
}

// The owner's bend for the path on from hole `number`: [x, z] on the
// course's ground, or null to take it out. A bend where a path can't go -
// on a tee box, a green, sand or water, or with no way round them to it -
// isn't made: the course comes back as it was, with `refused` set.
export function bendLink(course, number, at) {
  const bends = { ...(course.linkBends ?? {}) };
  if (at) bends[String(number)] = [r1(at[0]), r1(at[1])];
  else delete bends[String(number)];
  const out = { ...course, linkBends: bends };
  if (!Object.keys(bends).length) delete out.linkBends;
  // A bend dragged for one drawn in the hole editor (or taken out there):
  // worked out again, through the bend - the last word on it.
  if (at && course.linkLines?.[String(number)]) {
    const lines = { ...course.linkLines };
    delete lines[String(number)];
    if (Object.keys(lines).length) out.linkLines = lines;
    else delete out.linkLines;
  }
  if (at) {
    const from = course.holes.findIndex((h, i) => String(h.spec?.number ?? i + 1) === String(number));
    if (linkPaths(out, { always: true }).some((l) => l.from === from && l.refused)) return { ...course, refused: true };
  }
  return out;
}

// The paths between holes to and from hole `index`, in its own frame, for
// the hole editor to change: [{ number (the hole the path leaves), other
// (the hole at its other end), leaves (from this hole), line, hand (drawn by
// the owner) }] - and { removed: true, line: null } for one the owner took
// out. None on a course with them off.
export function holeLinks(course, index) {
  const holes = course?.holes ?? [];
  if (!course?.linkPaths || holes.length < 2) return [];
  const place = coursePlaces(course)?.[index];
  if (!place) return [];
  const frame = holeFrame([place.x, place.z], place.heading);
  const num = (i) => holes[i]?.spec?.number ?? i + 1;
  const out = linkPaths(course)
    .filter((l) => l.from === index || l.to === index)
    .map((l) => ({ number: num(l.from), other: num(l.from === index ? l.to : l.from), leaves: l.from === index, line: l.line.map((q) => frame.toHole(q).map(r1)), hand: !!l.hand }));
  for (const [from, to] of [[index - 1, index], [index, index + 1]]) {
    if (from < 0 || to >= holes.length) continue;
    const drawn = course.linkLines?.[String(num(from))];
    if (Array.isArray(drawn) && !drawn.length) out.push({ number: num(from), other: num(from === index ? to : from), leaves: from === index, line: null, removed: true });
  }
  return out;
}

// The owner's own line for the path on from hole `number` ([[x, z]...] on
// the course's ground, at least two points), [] for none there, or null to
// have it worked out again. A line over a tee box, a green or sand, or
// along water rather than straight over it, isn't taken: the course comes
// back as it was, with `refused` set.
export function drawLink(course, number, line) {
  const lines = { ...(course.linkLines ?? {}) };
  if (line == null) delete lines[String(number)];
  else lines[String(number)] = line.map(([x, z]) => [r1(x), r1(z)]);
  const out = { ...course, linkLines: lines };
  if (!Object.keys(lines).length) delete out.linkLines;
  if (line?.length >= 2 && !linkFits(course, out.linkLines[String(number)])) return { ...course, refused: true };
  return out;
}

// Whether a path between holes can go along `line` (course frame): clear of
// every hole's tees, greens and sand but right by its ends, and over water
// only straight across on a bridge.
export function linkFits(course, line) {
  const grounds = linkGrounds(course, coursePlaces(course), coursePaths(course));
  const pts = pathLine({ p: line.length > MAX_POINTS ? fewerPoints(line, 0.3) : line }).pts;
  const [a, b] = [line[0], line[line.length - 1]];
  const flags = [];
  for (const [x, z] of stepsAlong(pts, 0.5)) {
    flags.push(wetAt(grounds, x, z));
    if (Math.hypot(x - a[0], z - a[1]) <= 2.5 || Math.hypot(x - b[0], z - b[1]) <= 2.5) continue;
    if (troubleAt(grounds, x, z, true)) return false;
  }
  return crossesWell(flags, 0.5);
}

// Hole `index`'s layout to play, its own cart paths kept off the other
// holes' ground (sim/coursepaths.mjs), with the paths from the hole before
// it and on to the next (linkPathsFor) laid with them, where the course
// has them - and the way it points on the compass from where it
// lies on the course (imaginary.mjs placeBearing), so the round's wind
// blows the same way across every hole: off the sea, by the sea. What the
// course plays (course.js), and what the game's video plans its shots on
// (sim/showreel.mjs).
// Its made trees kept off the other holes too (sim/treeclear.mjs), so
// the hole is played with the trees every other hole shows of it.
export function withLinks(course, index) {
  const L = clearedLayout(course, index);
  if (!L) return L;
  const links = course.linkPaths ? linkPathsFor(course, index) : [];
  // Its own paths kept off the other holes' ground (sim/coursepaths.mjs).
  const stored = course.holes[index].layout;
  const own = L.paths === stored?.paths ? coursePaths(course)[index] : L.paths;
  const place = coursePlaces(course)[index];
  const bearing = place && Number.isFinite(place.heading) ? placeBearing(place) : undefined;
  if (!links.length && own === L.paths && bearing === undefined) return L;
  // (The paths between holes marked as such: the hole's own edits leave
  // them be - a path edit, "pa", never takes one with it, and a bunker the
  // designer accepts where one runs is accepted when it's played too, the
  // link laid round the hole as edited: holeedits/apply.mjs, linkway.mjs
  // linkGrounds.)
  for (const l of links) markLink(l);
  return { ...L, ...(links.length || own !== L.paths ? { paths: [...(own ?? []), ...links] } : {}), ...(bearing !== undefined ? { bearing } : {}) };
}
