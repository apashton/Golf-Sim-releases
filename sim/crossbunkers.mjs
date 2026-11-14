// Cross bunkers (the owner, 5 November 2026, from the graphics list:
// "fingered and cross bunkers"): a row of bunkers right across the
// fairway, as on the old links and the heathland courses - Muirfield's and
// Carnoustie's, Sunningdale's, Pine Valley's Hell's Half Acre - with tongues
// of grass between them and a face towards the tee. Laid by the course
// maker where they ask a question, not on every hole:
//   from the tee   where the long hitters' drives finish (past the
//                  scratch golfer's drive, sim/golfers.mjs): lay back
//                  short of it or carry it - with a gap at the end on the
//                  hole's better side (sim/architect.mjs), so the bold
//                  drive through it is the one that sets up the next shot;
//                  on a heathland or links hole now and then (CROSS.tee)
//   the second     on a three-shot par 5 (sim/architect.mjs's "cross" kind,
//   shot           the Long template's Hell's Half Acre), the bunker across
//                  the lay-up a row right across: carry it or stay short
// A heathland row's bunkers are fingered up their faces (sim/fingers.mjs),
// a links row's are pots with their revetted faces towards the tee, a
// parkland row's plain, flashed up their faces. Each is marked `cross` (so
// the hazards shaped after it - sim/hazardshapes.mjs - leave it as it
// was laid) and is otherwise a bunker like any other: played, dug and
// drawn as its outline is.
//
// Hole frame (sim/course.mjs), metres. Pure.

import { seeded, pointAt, nearest, insideBlob, blobOutline, blobShape, fairwayHalfWidth, potBunker, POT } from "./course.mjs";
import { fingerBunker } from "./fingers.mjs";
import { YARD } from "./flight.mjs";
import { GOLFERS } from "./golfers.mjs";

export const CROSS = {
  // A row from the tee: the chance a hole that suits it gets one, by its
  // bunker style (sim/course.mjs holeBunkerStyle) - only heathland and
  // links; where (yards past the scratch golfer's drive); the shortest par
  // 4 it's laid on (yards) and how far short of the green it stays at
  // least (yards).
  tee: { chance: { rugged: 0.45, links: 0.4 }, past: [10, 24], par4: 380, short: 105 },
  // A classic heathland par 5's row across the lay-up (sim/course.mjs
  // buildHole; a strategic one's is its kind's): its chance.
  second: { chance: 0.55 },
  // The gap left at its end on the better side (metres of fairway).
  gap: [8, 12],
  // How far past the fairway's edges a row runs (metres).
  over: 2.5,
  // Each bunker: half its length across the line and half its depth along
  // it (metres), and the grass between two (metres); a links row's pots
  // their own size (sim/course.mjs POT) with this much grass between.
  piece: { along: [3.4, 5.6], deep: [2.3, 3.4], grass: [1.6, 3] },
  potGrass: [3, 5.5],
  // A Long template's row (Hell's Half Acre): deeper.
  great: { deep: [4.2, 5.8] },
  // Staggered up and down the line (metres either way), the whole row
  // slanted across it a little (radians at most).
  stagger: 2.4,
  slant: 0.16,
  // Its faces flashed up towards the far side: the lip's height (metres)
  // and how far its back eases down.
  flash: { h: [0.15, 0.25], back: [2.4, 3] },
  // Fewer than this many bunkers, or less of the fairway's width covered,
  // and it's no row: none laid.
  least: 2,
  cover: 0.55,
};

const span = (rand, [a, b]) => a + rand() * (b - a);
const r3 = (v) => Math.round(v * 1000) / 1000;

// A row of bunkers across the line `s` metres along it, in a style
// (holeBunkerStyle). open: the side (-1 left, 1 right) left with a gap at
// its end, 0 for none; great: a Long template's deeper row. rand: its own
// numbers. Laid into hole.bunkers - none where one would lie in water, on
// the green or (with `keepOff`) over another bunker - unless too little of
// it would be left (CROSS.least, CROSS.cover): then nothing. Returns the
// bunkers laid.
export function crossRow(hole, { s, path, style, open = 0, great = false, rand, half = null, keepOff = false }) {
  const at = pointAt(path, s);
  const [dx, dz] = at.dir;
  const way = Math.atan2(dz, dx);
  const f = hole.fairway;
  const left = fairwayHalfWidth(f, s, -1) || half || f.half;
  const right = fairwayHalfWidth(f, s, 1) || half || f.half;
  const gapW = span(rand, CROSS.gap);
  // From its left end to its right (metres across the line, + right).
  let a = -left - CROSS.over;
  let b = right + CROSS.over;
  if (open < 0) a = -left + gapW;
  if (open > 0) b = right - gapW;
  const slant = (rand() - 0.5) * 2 * CROSS.slant;
  const links = style === "links";
  // How many fit end to end (each about the middle of its size, the grass
  // between about the middle of its), then each its own size - all of them
  // and the grass between filling the row from end to end.
  const width = b - a;
  const mid = ([lo, hi]) => (lo + hi) / 2;
  const piece = links ? POT.r[0] + POT.r[1] : 2 * mid(CROSS.piece.along);
  const grassMid = mid(links ? CROSS.potGrass : CROSS.piece.grass);
  const n = Math.max(CROSS.least, Math.round((width + grassMid) / (piece + grassMid)));
  const grass = Array.from({ length: n - 1 }, () => span(rand, links ? CROSS.potGrass : CROSS.piece.grass));
  const weights = Array.from({ length: n }, () => 0.75 + rand() * 0.5);
  const room = Math.max(n * 2, width - grass.reduce((t, g) => t + g, 0));
  const total = weights.reduce((t, w) => t + w, 0);
  const pieces = [];
  for (let i = 0, c = a; i < n; i++) {
    const h = (room * weights[i]) / total / 2;
    const d = c + h;
    const along = (rand() - 0.5) * 2 * CROSS.stagger + d * Math.tan(slant);
    const x = at.p[0] + dx * along - dz * d;
    const z = at.p[1] + dz * along + dx * d;
    const deep = span(rand, great ? CROSS.great.deep : CROSS.piece.deep);
    const blob = blobShape(rand, x, z, way + Math.PI / 2 + slant + (rand() - 0.5) * 0.25, h, Math.min(deep, h));
    pieces.push({ blob, across: d, h });
    c = d + h + (grass[i] ?? 0);
  }
  const flash = () => ({ a: r3(way), h: r3(span(rand, CROSS.flash.h)), back: r3(span(rand, CROSS.flash.back)) });
  const shaped = pieces.map((p) => {
    const own = seeded(Math.floor(rand() * 2 ** 31) || 1);
    let out;
    if (links) out = potBunker(hole, p.blob, own);
    else if (style === "rugged") out = { ...fingerBunker(p.blob, "row", way, own), flash: flash() };
    else out = { ...p.blob, flash: flash() };
    return { ...out, cross: 1 };
  });
  const green = hole.green;
  const ok = shaped.filter((q) => {
    const edge = blobOutline(q, 64);
    if (edge.some(([x, z]) => insideBlob(green, x, z, 3) || Math.hypot(x, z) < 25 || (hole.water ?? []).some((w) => insideBlob(w, x, z, 1.5)))) return false;
    if (keepOff && (hole.bunkers ?? []).some((o) => !o.waste && edge.some(([x, z]) => insideBlob(o, x, z, 1)))) return false;
    return true;
  });
  // Enough of it, across enough of the fairway?
  const covered = ok.reduce((sum, q) => sum + 2 * (q.rx ?? 0), 0);
  if (ok.length < CROSS.least || covered < CROSS.cover * (left + right)) return [];
  hole.bunkers.push(...ok);
  return ok;
}

// A row from the tee (CROSS.tee) for a hole, now and then, from its own
// numbers (so nothing else on it moves): par 4s long enough and par 5s, of
// a heathland or links style; at the long hitters' finish, the gap at its
// end on `favoured`'s side. Drive bunkers already where it goes give way
// to it (it's the drive's hazard now); others it keeps off. Returns the
// bunkers laid ([] for none).
export function teeRow(hole, spec, { style, path, favoured = 0, half = null }) {
  const t = CROSS.tee;
  const rand = seeded(((spec.seed ?? 1) ^ 0xc2055) >>> 0 || 1);
  const roll = rand();
  if (!(roll < (t.chance[style] ?? 0)) || spec.par < 4 || (spec.par === 4 && spec.yards < t.par4)) return [];
  const s = (GOLFERS.scratch.drive + span(rand, t.past)) * YARD;
  if (s > hole.length - t.short * YARD || !(fairwayHalfWidth(hole.fairway, s) > 0)) return [];
  // Not across water.
  const at = pointAt(path, s);
  if ((hole.water ?? []).some((w) => [-30, -15, 0, 15, 30].some((d) => insideBlob(w, at.p[0] - at.dir[1] * d, at.p[1] + at.dir[0] * d, 6)))) return [];
  // The drive bunkers where it goes: given way.
  const g = hole.green;
  const before = hole.bunkers;
  hole.bunkers = before.filter((b) => {
    if (b.waste || b.cross || Math.hypot(b.x - g.x, b.z - g.z) < Math.max(g.rx, g.rz) + 25) return true;
    const n = nearest(path, b.x, b.z);
    return Math.abs(n.s - s) > 22 || Math.abs(n.d) > (hole.fairway.half ?? 20) + 14;
  });
  const side = favoured < 0 ? -1 : favoured > 0 ? 1 : rand() < 0.5 ? -1 : 1;
  const laid = crossRow(hole, { s, path, style, open: side, rand, half, keepOff: true });
  if (!laid.length) hole.bunkers = before;
  return laid;
}
