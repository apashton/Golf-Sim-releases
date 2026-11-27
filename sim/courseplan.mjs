// The course plan: a real course laid out before it's built (the owner,
// 23 November 2026: "Suggested layouts followed by finer tweaks... if the
// holes aren't known we need to allow the designer to let the user pick
// out tee boxes, greens, fairways etc, but all of that be easy and not
// arduous"). The map's greens, tees, fairways and bunkers, and its holes -
// the ones it has, or suggested (sim/holefinder.mjs) - as the player puts
// them right: shapes added with a tap (sim/groundpick.mjs finds their
// outlines on the ground), moved and taken away; holes drawn tee to green,
// bent, renumbered; ground out of bounds and walls and fences drawn. Then
// it's handed to the importer as a map (surveyFromPlan) and built as any
// course from the map is.
//
// A plan: { v, origin: { lat, lon }, greens, tees, fairways, bunkers:
// [outline, ...], holes: [{ line, par, set, mapped }] (in the order
// they're played: the first is the 1st), out: [outline, ...], walls:
// [{ line, kind: "wall" | "fence" }], burns: [{ line, width, bridges }],
// card: [{ par, yards, si }] (the club's, where it's pasted in) } - every
// outline and line in metres east and north of `origin` (terrain.mjs
// project). `par` null is from its length (or the card); `set` marks a
// hole the player has made or changed, `mapped` one the map has: both
// kept when the rest are suggested again; `sets` its White and Red tee
// boxes. (The card, tee sets and burns: sim/planextras.mjs.)
//
// Pure: the designer's page (courseplan.js) and the server both use it.

import { project, unproject, insidePolygon, distanceToEdge, polygonCentroid } from "./terrain.mjs";
import { suggestHoles, bestLine, parForLength, shapeInfo } from "./holefinder.mjs";
import { gridOver, boxOf, shapeMask } from "./cellmask.mjs";
import { corridor } from "./mapcourse.mjs";
import { cleanCard, cleanSets, cleanBurns, besideCard, cardFor } from "./planextras.mjs";

export const PLAN_VERSION = 1;
export const PLAN_LISTS = ["greens", "tees", "fairways", "bunkers"];
// The most holes a plan builds (as the importer does).
export const PLAN_MOST = 18;
// And the most a plan holds while it's worked on (a hole drawn before
// another's taken away; a 27-hole venue's, to pick 18 from).
export const PLAN_HOLD = 36;
// How deep a band out of bounds goes beyond the line it's drawn along
// (metres): past where any ball finishes (the real links': 110 m).
export const OUT_DEPTH = 120;
// A tap this near a shape picks it (metres).
export const NEAR = { tee: 12, green: 15, line: 10, outline: 12 };
// A fairway drawn along a line: this wide either side.
export const FAIRWAY_HALF = 16;

const r2 = (v) => Math.round(v * 100) / 100;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const lineLength = (line) => line.reduce((s, p, i) => (i ? s + dist(line[i - 1], p) : 0), 0);
const cleanLine = (line) => line.map((p) => [r2(p[0]), r2(p[1])]);

// Where a survey's metres are measured from: the middle of everything golf
// on it (its holes, outline, greens, tees and fairways) - the same on the
// server, which samples the ground in it, and the page.
export function surveyOrigin(survey) {
  let n = -Infinity, s = Infinity, e = -Infinity, w = Infinity;
  const take = ([lat, lon]) => {
    n = Math.max(n, lat);
    s = Math.min(s, lat);
    e = Math.max(e, lon);
    w = Math.min(w, lon);
  };
  for (const h of survey.holes ?? []) h.line.forEach(take);
  for (const list of [survey.outline, survey.greens, survey.tees, survey.fairways]) for (const r of list ?? []) r.forEach(take);
  if (!Number.isFinite(n)) {
    const b = survey.bounds;
    return b ? { lat: (b.north + b.south) / 2, lon: (b.east + b.west) / 2 } : null;
  }
  return { lat: Math.round(((n + s) / 2) * 1e7) / 1e7, lon: Math.round(((e + w) / 2) * 1e7) / 1e7 };
}

// The box (metres from the origin) the plan's ground covers: the course's
// shapes and outline, and `pad` round them.
export function surveyBox(survey, origin, pad = 60) {
  const local = (r) => r.map(([lat, lon]) => project(origin, lat, lon));
  const all = [...(survey.outline ?? []), ...(survey.greens ?? []), ...(survey.tees ?? []), ...(survey.fairways ?? []), ...(survey.holes ?? []).map((h) => h.line)].map(local);
  return boxOf(all, pad);
}

// The map's shapes in a plan's metres.
export function localShapes(survey, origin) {
  const local = (r) => r.map(([lat, lon]) => {
    const [x, z] = project(origin, lat, lon);
    return [r2(x), r2(z)];
  });
  const out = {};
  for (const k of ["greens", "tees", "fairways", "bunkers", "water", "woods", "buildings", "out", "outline", "clubhouses"]) out[k] = (survey[k] ?? []).map(local);
  out.pins = local(survey.pins ?? []);
  out.paths = (survey.paths ?? []).map((p) => local(p.line));
  out.walls = (survey.walls ?? []).map((w) => ({ line: local(w.line), kind: w.kind === "fence" ? "fence" : "wall" }));
  out.holes = (survey.holes ?? []).map((h) => ({ ref: h.ref, par: h.par, line: local(h.line) }));
  return out;
}

// What the finder is given: the plan's own shapes and the map's.
const finderInput = (plan, map) => ({ greens: plan.greens, tees: plan.tees, fairways: plan.fairways, pins: map?.pins ?? [], buildings: map?.buildings ?? [], outline: map?.outline ?? [] });

// A new plan from a survey (sim/osm.mjs parseOverpass): its shapes, and its
// holes as mapped - or, where it has none (or fewer than its greens could
// make), the rest suggested. Returns { plan, map } - map: the survey's
// other shapes in the plan's metres (water, woods, buildings, paths...),
// drawn under the plan and not changed by it.
export function planFromSurvey(survey, { most = PLAN_MOST } = {}) {
  const origin = surveyOrigin(survey);
  if (!origin) throw new Error("There's nothing golf on the map here to lay a course out from.");
  const map = localShapes(survey, origin);
  const plan = { v: PLAN_VERSION, origin, greens: map.greens, tees: map.tees, fairways: map.fairways, bunkers: map.bunkers, holes: [], out: [], walls: [], burns: [] };
  // The holes the map has, in their order (one of each number).
  const seen = new Set();
  const mapped = map.holes
    .filter((h) => (h.ref == null ? true : !seen.has(h.ref) && seen.add(h.ref)))
    .slice(0, most)
    .map((h) => ({ line: cleanLine(h.line), par: h.par ?? null, set: false, mapped: true }));
  plan.holes = mapped;
  if (mapped.length < Math.min(most, plan.greens.length)) {
    const more = suggestRest(plan, map, { keep: mapped.map((_, i) => i), most });
    plan.holes = more.holes;
  }
  return { plan, map };
}

// The green a hole's line ends on (its index), or -1.
export function greenOfHole(plan, hole) {
  const end = hole.line[hole.line.length - 1];
  let best = -1;
  let bd = NEAR.green;
  plan.greens.forEach((g, i) => {
    const d = insidePolygon(g, end[0], end[1]) ? 0 : distanceToEdge(g, end[0], end[1]);
    if (d <= bd) {
      bd = d;
      best = i;
    }
  });
  return best;
}

// The tee boxes a hole is played from: the one its line starts on, and
// those in a row with it along the line.
export function teesOfHole(plan, hole) {
  const [a, b] = hole.line;
  const len = dist(a, b) || 1;
  const dir = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
  const out = [];
  plan.tees.forEach((t, i) => {
    const [cx, cz] = polygonCentroid(t);
    const u = (cx - a[0]) * dir[0] + (cz - a[1]) * dir[1];
    const v = Math.abs((cx - a[0]) * -dir[1] + (cz - a[1]) * dir[0]);
    if (insidePolygon(t, a[0], a[1]) || (u >= -120 && u <= Math.min(90, len * 0.35) && v <= 13)) out.push(i);
  });
  return out;
}

// The holes not settled suggested afresh round the ones that are (`keep`:
// their indexes; by default, those the player has made or changed and
// those the map has - a short-game area's greens aren't new holes). Kept
// holes keep their numbers; the suggested fill the numbers between, in the
// order they're walked. Returns a new plan.
export function suggestRest(plan, map, { keep = null, most = PLAN_MOST } = {}) {
  const keepAt = (keep ?? plan.holes.map((h, i) => (h.set || h.mapped ? i : -1)).filter((i) => i >= 0)).filter((i) => plan.holes[i]);
  const kept = keepAt.map((i) => plan.holes[i]);
  const settled = kept.map((h) => {
    const [a, b] = [h.line[0], h.line[h.line.length - 1]];
    const len = dist(a, b) || 1;
    return { green: greenOfHole(plan, h), tees: teesOfHole(plan, h), dir: [(b[0] - a[0]) / len, (b[1] - a[1]) / len] };
  });
  const clubhouse = map?.clubhouses?.length ? polygonCentroid(map.clubhouses[0]) : null;
  // (With the club's card, the holes to fill led by theirs.)
  const card = cardFor(plan.card, new Set(keepAt), most);
  const found = suggestHoles(finderInput(plan, map), { keep: settled, clubhouse, most, card });
  const fresh = found.holes.map((h) => ({ line: h.line, par: null, set: false }));
  // Kept holes where they were; the new ones in the gaps, in their order.
  const holes = [];
  const keptAt = new Map(keepAt.map((i) => [i, plan.holes[i]]));
  const total = Math.min(most, keptAt.size + fresh.length);
  let f = 0;
  for (let n = 0; n < total; n++) holes.push(keptAt.get(n) ?? fresh[f++] ?? null);
  // Kept holes numbered past the end close up.
  for (const [i, h] of keptAt) if (i >= total) holes.push(h);
  return { ...plan, holes: holes.filter(Boolean).slice(0, most) };
}

// ---- Shapes ---------------------------------------------------------------------------

// The shape of a list at a spot (its index), or -1: inside it, or within
// `near` metres of its edge (the nearest).
export function shapeAt(plan, list, at, near = 4) {
  let best = -1;
  let bd = near;
  (plan[list] ?? []).forEach((poly, i) => {
    const d = insidePolygon(poly, at[0], at[1]) ? -1 : distanceToEdge(poly, at[0], at[1]);
    if (d <= bd) {
      bd = d;
      best = i;
    }
  });
  return best;
}

export function addShape(plan, list, poly) {
  if (!PLAN_LISTS.includes(list) || !Array.isArray(poly) || poly.length < 3) return plan;
  return { ...plan, [list]: [...plan[list], cleanLine(poly)] };
}

export function removeShape(plan, list, index) {
  if (!plan[list]?.[index]) return plan;
  return { ...plan, [list]: plan[list].filter((_, i) => i !== index) };
}

// A shape moved by [dx, dz] - and the ends of the holes on it with it (a
// green moved takes its holes' ends; a tee its holes' starts).
export function moveShape(plan, list, index, [dx, dz]) {
  const poly = plan[list]?.[index];
  if (!poly) return plan;
  const moved = poly.map(([x, z]) => [r2(x + dx), r2(z + dz)]);
  const next = { ...plan, [list]: plan[list].map((p, i) => (i === index ? moved : p)) };
  if (list === "greens" || list === "tees") {
    next.holes = plan.holes.map((h) => {
      const k = list === "greens" ? h.line.length - 1 : 0;
      const p = h.line[k];
      if (!insidePolygon(poly, p[0], p[1]) && distanceToEdge(poly, p[0], p[1]) > 2) return h;
      const line = h.line.slice();
      line[k] = [r2(p[0] + dx), r2(p[1] + dz)];
      return { ...h, line };
    });
  }
  return next;
}

// A shape made bigger or smaller (k: 1.1 a tenth bigger each way) about its
// middle.
export function scaleShape(plan, list, index, k) {
  const poly = plan[list]?.[index];
  if (!poly) return plan;
  const [cx, cz] = polygonCentroid(poly);
  const scaled = poly.map(([x, z]) => [r2(cx + (x - cx) * k), r2(cz + (z - cz) * k)]);
  return { ...plan, [list]: plan[list].map((p, i) => (i === index ? scaled : p)) };
}

// A fairway along a line of taps, FAIRWAY_HALF either side (or `half`).
export function fairwayAlong(line, half = FAIRWAY_HALF) {
  const len = lineLength(line);
  if (line.length < 2 || len < 20) return null;
  return corridor(line, 0, len, half);
}

// Each par 4 and 5 with no fairway on its line given one along it (as the
// import would fill it in: from where a drive lands to short of the green)
// - drawn, so it can be changed. Returns { plan, added }.
export function fairwaysForHoles(plan) {
  let next = plan;
  let added = 0;
  for (const h of plan.holes) {
    const len = lineLength(h.line);
    const par = h.par ?? parForLength(len);
    if (par < 4 || len < 200) continue;
    const onLine = (poly) => {
      for (let s = len * 0.35; s < len - 30; s += 8) {
        const p = pointOn(h.line, s);
        if (insidePolygon(poly, p[0], p[1])) return true;
      }
      return false;
    };
    if (next.fairways.some(onLine)) continue;
    next = addShape(next, "fairways", corridor(h.line, Math.min(150, len * 0.35), len - 30, FAIRWAY_HALF));
    added++;
  }
  return { plan: next, added };
}

function pointOn(line, s) {
  let left = s;
  for (let i = 1; i < line.length; i++) {
    const len = dist(line[i - 1], line[i]);
    if (left <= len || i === line.length - 1) {
      const t = Math.min(1, left / (len || 1));
      return [line[i - 1][0] + (line[i][0] - line[i - 1][0]) * t, line[i - 1][1] + (line[i][1] - line[i - 1][1]) * t];
    }
    left -= len;
  }
  return line[line.length - 1];
}

// ---- Holes ----------------------------------------------------------------------------

// The fairways as the finder reads them (a mask), for bending a new hole's
// line down them.
function fairwayMask(plan) {
  const box = boxOf(plan.fairways, 30);
  if (!box) return { mask: null, spots: [] };
  const mask = shapeMask(plan.fairways, gridOver(box, 2));
  const spots = [];
  const step = Math.max(1, Math.round(9 / mask.cell));
  for (let r = 0; r < mask.nz; r += step) for (let c = 0; c < mask.nx; c += step) if (mask.data[r * mask.nx + c]) spots.push([mask.x0 + (c + 0.5) * mask.cell, mask.z0 + (r + 0.5) * mask.cell]);
  return { mask, spots };
}

// Where a hole tapped from `teeTap` to `greenTap` starts and ends: the
// middle of the tee box tapped (or the tap), and on the green its flag
// (a pin the map has on it) or its middle - or, a green another hole
// already plays into, the half away from that hole's way in.
export function holeEnds(plan, map, teeTap, greenTap) {
  const ti = shapeAt(plan, "tees", teeTap, NEAR.tee);
  const gi = shapeAt(plan, "greens", greenTap, NEAR.green);
  const tee = ti >= 0 ? polygonCentroid(plan.tees[ti]).map(r2) : teeTap.map(r2);
  if (gi < 0) return { tee, end: greenTap.map(r2), green: -1, teeIndex: ti };
  const g = plan.greens[gi];
  const pins = (map?.pins ?? []).filter((p) => insidePolygon(g, p[0], p[1]));
  const others = plan.holes.filter((h) => greenOfHole(plan, h) === gi);
  let end = polygonCentroid(g);
  if (pins.length) end = pins.slice().sort((a, b) => dist(a, tee) - dist(b, tee))[0];
  else if (others.length) {
    // A double green: the half along its long way the other hole isn't on.
    const info = shapeInfo(g);
    const half = Math.sqrt(info.area / Math.PI) * 0.45 * Math.min(1.6, info.long);
    const ends = [1, -1].map((k) => [info.at[0] + info.axis[0] * half * k, info.at[1] + info.axis[1] * half * k]);
    const theirs = others[0].line[others[0].line.length - 1];
    const pick = dist(ends[0], theirs) > dist(ends[1], theirs) ? ends[0] : ends[1];
    if (insidePolygon(g, pick[0], pick[1])) end = pick;
  }
  return { tee, end: end.map(r2), green: gi, teeIndex: ti };
}

// A hole from a tee to a green, its line bent once down the fairway where
// the fairway bends (holefinder.mjs bestLine). Added as hole `at` (the end,
// unless said) - the ones after it numbered on. Returns a new plan.
export function addHole(plan, map, teeTap, greenTap, at = plan.holes.length) {
  const { tee, end } = holeEnds(plan, map, teeTap, greenTap);
  if (dist(tee, end) < 40) return plan;
  const { mask, spots } = fairwayMask(plan);
  const { line } = bestLine(tee, end, mask, spots);
  const holes = plan.holes.slice();
  holes.splice(Math.max(0, Math.min(holes.length, at)), 0, { line: cleanLine(line), par: null, set: true });
  return { ...plan, holes: holes.slice(0, PLAN_HOLD) };
}

// A hole's line set by hand (dragged ends and bends).
export function setHoleLine(plan, i, line) {
  if (!plan.holes[i] || line.length < 2) return plan;
  return { ...plan, holes: plan.holes.map((h, k) => (k === i ? { ...h, line: cleanLine(line), set: true } : h)) };
}

export function setHolePar(plan, i, par) {
  if (!plan.holes[i]) return plan;
  const p = [3, 4, 5].includes(Number(par)) ? Number(par) : null;
  return { ...plan, holes: plan.holes.map((h, k) => (k === i ? { ...h, par: p, set: true } : h)) };
}

export function removeHole(plan, i) {
  return { ...plan, holes: plan.holes.filter((_, k) => k !== i) };
}

// A hole moved to another number (the ones between close up).
export function moveHoleTo(plan, from, to) {
  if (!plan.holes[from]) return plan;
  const holes = plan.holes.slice();
  const [h] = holes.splice(from, 1);
  holes.splice(Math.max(0, Math.min(holes.length, to)), 0, { ...h, set: true });
  return { ...plan, holes };
}

// Hole `i` made the 1st, the rest numbered on round from it in the same
// order (a suggestion walks the holes in order but can't know which is the
// first without a clubhouse on the map).
export function startAt(plan, i) {
  if (!plan.holes[i] || i === 0) return plan;
  return { ...plan, holes: [...plan.holes.slice(i), ...plan.holes.slice(0, i)] };
}

// A bend added to a hole's line where it's tapped (the nearest stretch).
export function bendAt(plan, i, at) {
  const h = plan.holes[i];
  if (!h) return plan;
  let best = 1;
  let bd = Infinity;
  for (let k = 1; k < h.line.length; k++) {
    const d = toSegment(h.line[k - 1], h.line[k], at);
    if (d < bd) {
      bd = d;
      best = k;
    }
  }
  const line = h.line.slice();
  line.splice(best, 0, at.map(r2));
  return setHoleLine(plan, i, line);
}

export function toSegment(a, b, p) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dz * t);
}

// The hole whose line passes nearest a spot (its index), within `near`; -1.
export function holeAt(plan, at, near = NEAR.line) {
  let best = -1;
  let bd = near;
  plan.holes.forEach((h, i) => {
    for (let k = 1; k < h.line.length; k++) {
      const d = toSegment(h.line[k - 1], h.line[k], at);
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
  });
  return best;
}

// What the list beside the plan shows of each hole: { number, length
// (metres), yards, par (as set, else the card's, else by its length),
// green (its index), shared (the other hole's number on its green, or
// null), tees (how many boxes), set, card (beside its card: planextras.mjs
// besideCard, or null) }.
export function holeFacts(plan) {
  const greens = plan.holes.map((h) => greenOfHole(plan, h));
  return plan.holes.map((h, i) => {
    const length = lineLength(h.line);
    const other = greens.findIndex((g, k) => k !== i && g >= 0 && g === greens[i]);
    const card = besideCard(plan, i, length);
    return {
      number: i + 1,
      length: Math.round(length),
      yards: Math.round(length / 0.9144),
      par: h.par ?? card?.par ?? parForLength(length),
      parAuto: h.par == null,
      card,
      green: greens[i],
      shared: other >= 0 ? other + 1 : null,
      tees: teesOfHole(plan, h).length,
      set: !!h.set,
    };
  });
}

// What's missing or odd, for the plan to say: holes with no green at their
// end; greens and tees in no hole; holes crossing out of bounds.
export function planChecks(plan) {
  const facts = holeFacts(plan);
  const used = new Set(facts.map((f) => f.green));
  const teesUsed = new Set(plan.holes.flatMap((h) => teesOfHole(plan, h)));
  return {
    noGreen: facts.filter((f) => f.green < 0).map((f) => f.number),
    spareGreens: plan.greens.map((_, i) => i).filter((i) => !used.has(i)),
    spareTees: plan.tees.map((_, i) => i).filter((i) => !teesUsed.has(i)),
    tooShort: facts.filter((f) => f.length < 70).map((f) => f.number),
    offCard: facts.filter((f) => f.card && (f.card.long || f.card.wrongPar)).map((f) => f.number),
  };
}

// ---- Out of bounds, walls and fences ---------------------------------------------------

// The stretch of the course's outline between two spots on it (each
// snapped to its nearest point on the outline), the shorter way round - or
// the way through `via` (a third tap) where given. Null where either isn't
// near the outline (`near` metres: a tap's reach at the map's scale).
export function alongOutline(outline, a, b, via = null, near = NEAR.outline) {
  let best = null;
  for (const ring of outline ?? []) {
    const sa = snapTo(ring, a);
    const sb = snapTo(ring, b);
    if (sa.d > near || sb.d > near) continue;
    const n = ring.length;
    const walk = (from, to, step) => {
      const pts = [from.p];
      let k = step > 0 ? (from.seg + 1) % n : from.seg;
      for (let guard = 0; guard <= n; guard++) {
        const stop = step > 0 ? k === (to.seg + 1) % n : k === to.seg;
        if (stop) break;
        pts.push(ring[k]);
        k = (k + step + n) % n;
      }
      pts.push(to.p);
      return pts;
    };
    const fwd = sa.seg === sb.seg && sa.t <= sb.t ? [sa.p, sb.p] : walk(sa, sb, 1);
    const back = sa.seg === sb.seg && sa.t >= sb.t ? [sa.p, sb.p] : walk(sa, sb, -1);
    let line;
    if (via) {
      const near = (l) => Math.min(...l.slice(1).map((p, k) => toSegment(l[k], p, via)));
      line = near(fwd) <= near(back) ? fwd : back;
    } else line = lineLength(fwd) <= lineLength(back) ? fwd : back;
    if (!best || sa.d + sb.d < best.d) best = { line: cleanLine(line), d: sa.d + sb.d };
  }
  return best?.line ?? null;
}

function snapTo(ring, p) {
  let best = { d: Infinity };
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz || 1)));
    const q = [a[0] + dx * t, a[1] + dz * t];
    const d = dist(q, p);
    if (d < best.d) best = { d, seg: i, t, p: q };
  }
  return best;
}

// Which side of a line is out: the side away from the course - its outline,
// where the map has one; else the side with fewer of its greens and tees.
// +1 left of the line's way, -1 right.
export function outSide(plan, map, line) {
  let score = 0;
  for (let k = 1; k < line.length; k++) {
    const a = line[k - 1];
    const b = line[k];
    const len = dist(a, b) || 1;
    const left = [-(b[1] - a[1]) / len, (b[0] - a[0]) / len];
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    for (const d of [8, 30]) {
      const pl = [mid[0] + left[0] * d, mid[1] + left[1] * d];
      const pr = [mid[0] - left[0] * d, mid[1] - left[1] * d];
      if (map?.outline?.length) {
        const inL = map.outline.some((r) => insidePolygon(r, pl[0], pl[1]));
        const inR = map.outline.some((r) => insidePolygon(r, pr[0], pr[1]));
        score += (inR ? 1 : 0) - (inL ? 1 : 0);
      }
    }
  }
  if (score === 0) {
    // Fewer greens and tees within 150 m on the out side.
    const sideOf = (p) => {
      let s = 0;
      for (let k = 1; k < line.length; k++) {
        const a = line[k - 1];
        const b = line[k];
        if (toSegment(a, b, p) > 150) continue;
        s += Math.sign((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]));
      }
      return Math.sign(s);
    };
    for (const poly of [...plan.greens, ...plan.tees]) score -= sideOf(polygonCentroid(poly));
  }
  return score >= 0 ? 1 : -1;
}

// A band out of bounds beyond a line: its own outline, from the line to
// OUT_DEPTH metres out on `side` (+1 left, -1 right).
export function outBand(line, side, depth = OUT_DEPTH) {
  if (line.length < 2) return null;
  const n = line.length;
  const normal = (k) => {
    const a = line[Math.max(0, k - 1)];
    const b = line[Math.min(n - 1, k + 1)];
    const len = dist(a, b) || 1;
    return [(-(b[1] - a[1]) / len) * side, ((b[0] - a[0]) / len) * side];
  };
  const far = line.map((p, k) => {
    const m = normal(k);
    return [p[0] + m[0] * depth, p[1] + m[1] * depth];
  });
  return cleanLine([...line, ...far.reverse()]);
}

// Out of bounds beyond a line drawn (or along the outline between taps).
export function addOut(plan, map, line) {
  if (!line || line.length < 2 || lineLength(line) < 10) return plan;
  const band = outBand(line, outSide(plan, map, line));
  return band ? { ...plan, out: [...plan.out, band] } : plan;
}

export function removeOut(plan, i) {
  return { ...plan, out: plan.out.filter((_, k) => k !== i) };
}

export function addWall(plan, line, kind = "wall") {
  if (!line || line.length < 2 || lineLength(line) < 2) return plan;
  return { ...plan, walls: [...plan.walls, { line: cleanLine(line), kind: kind === "fence" ? "fence" : "wall" }] };
}

export function removeWall(plan, i) {
  return { ...plan, walls: plan.walls.filter((_, k) => k !== i) };
}

// The drawn wall or fence, or band out of bounds, at a spot (index), or -1.
export function wallAt(plan, at, near = 5) {
  let best = -1;
  let bd = near;
  plan.walls.forEach((w, i) => {
    for (let k = 1; k < w.line.length; k++) {
      const d = toSegment(w.line[k - 1], w.line[k], at);
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
  });
  return best;
}
export const outAt = (plan, at) => plan.out.findIndex((p) => insidePolygon(p, at[0], at[1]));

// ---- To the importer ------------------------------------------------------------------

// The survey the importer builds from (sim/mapcourse.mjs courseFromMap):
// the map's own, with the plan's greens, tees, fairways and bunkers, its
// holes as the map's hole lines, and its out of bounds, walls and fences
// beside the map's.
export function surveyFromPlan(survey, plan) {
  const { origin } = plan;
  const geo = (p) => {
    const g = unproject(origin, p[0], p[1]);
    return [Math.round(g.lat * 1e8) / 1e8, Math.round(g.lon * 1e8) / 1e8];
  };
  const ring = (r) => r.map(geo);
  // (Its pars and stroke indexes the card's, where there's one.)
  const holes = plan.holes.slice(0, PLAN_MOST).map((h, i) => ({ ref: i + 1, par: h.par ?? plan.card?.[i]?.par ?? null, handicap: plan.card?.[i]?.si ?? null, name: null, line: h.line.map(geo) }));
  let bounds = null;
  for (const h of holes) {
    for (const [lat, lon] of h.line) {
      bounds ??= { north: lat, south: lat, east: lon, west: lon };
      bounds.north = Math.max(bounds.north, lat);
      bounds.south = Math.min(bounds.south, lat);
      bounds.east = Math.max(bounds.east, lon);
      bounds.west = Math.min(bounds.west, lon);
    }
  }
  // The map's flags, only on the plan's greens.
  const pins = (survey.pins ?? []).filter(([lat, lon]) => {
    const [x, z] = project(origin, lat, lon);
    return plan.greens.some((g) => insidePolygon(g, x, z));
  });
  return {
    ...survey,
    holes,
    greens: plan.greens.map(ring),
    tees: plan.tees.map(ring),
    fairways: plan.fairways.map(ring),
    bunkers: plan.bunkers.map(ring),
    pins,
    out: [...(survey.out ?? []), ...plan.out.map(ring)],
    walls: [...(survey.walls ?? []), ...plan.walls.map((w) => ({ line: w.line.map(geo), material: null, height: null, kind: w.kind }))],
    greenRefs: [],
    teeRefs: [],
    bounds,
  };
}

// A plan as the course keeps it (course.source.plan), checked: anything
// else is null.
export function cleanPlan(p) {
  if (!p || typeof p !== "object" || !p.origin || !Number.isFinite(p.origin.lat) || !Number.isFinite(p.origin.lon)) return null;
  const pts = (l) => Array.isArray(l) && l.every((q) => Array.isArray(q) && q.length === 2 && q.every(Number.isFinite));
  const polys = (list) => (Array.isArray(list) ? list.filter((r) => pts(r) && r.length >= 3) : []);
  const card = cleanCard(p.card);
  return {
    v: PLAN_VERSION,
    origin: { lat: p.origin.lat, lon: p.origin.lon },
    greens: polys(p.greens),
    tees: polys(p.tees),
    fairways: polys(p.fairways),
    bunkers: polys(p.bunkers),
    holes: (Array.isArray(p.holes) ? p.holes : []).filter((h) => pts(h?.line) && h.line.length >= 2).slice(0, PLAN_HOLD).map((h) => {
        const sets = cleanSets(h.sets);
        return { line: h.line, par: [3, 4, 5].includes(h.par) ? h.par : null, set: !!h.set, ...(h.mapped ? { mapped: true } : {}), ...(sets ? { sets } : {}) };
      }),
    out: polys(p.out),
    walls: (Array.isArray(p.walls) ? p.walls : []).filter((w) => pts(w?.line) && w.line.length >= 2).map((w) => ({ line: w.line, kind: w.kind === "fence" ? "fence" : "wall" })),
    burns: cleanBurns(p.burns),
    ...(card ? { card } : {}),
  };
}

// The holes of a plan that are the same as a course's holes were built
// from (each hole's line within a metre at both ends): their hand changes
// can be kept when it's built again. [old index or -1, ...] by new hole.
export function sameHoles(before, after) {
  return after.holes.map((h) => {
    const a = h.line[0];
    const b = h.line[h.line.length - 1];
    return (before?.holes ?? []).findIndex((o) => dist(o.line[0], a) < 1 && dist(o.line[o.line.length - 1], b) < 1);
  });
}

// (For the tests.)
export const planParts = { fairwayMask, pointOn, snapTo };
