// A map's tee boxes built level, and its bunkers cut into the land (the
// owner, 23 November 2026: "T-boxes not being flat. There's like too much
// smoothing going on with the land around ... T-boxes need to be flatter in
// general, with everything else compensating to hit the T-box rather than
// the ground around the T-box not being flat. Same with bunkers ... They're
// all a little bit too much sat on the land rather than being cut out of
// the land").
//
// A hole from a map stands on its survey (a LiDAR model at a metre, or the
// map tiles' 2.5 m), and a survey that fine still smooths what's built on
// it: a tee box's level top comes out as the slope of the ground round it,
// and a bunker's lip as a soft dip that starts a metre or two out in the
// grass. So, worked out from the ground as it stands before anything's
// shaped on it (groundShaping's groundBefore: the survey, and a green's own
// finer survey over its bank) the first time it's asked - the hole's made
// ready by then - nothing stored:
//   - each tee (the map's outlines, layout.tees) is a plate: the plane that
//     best fits the ground under it, its fall held to TEE_PLATE.fall - level
//     to the eye - and the ground round it banked to meet it, over a bank
//     as wide as the step needs (TEE_PLATE.bank);
//   - each plain bunker of the map's (not walled, not a pot, not a waste
//     area: those have their own shaping) has a lip: the grass round it
//     at the level of the ground a little way out (BUNKER_CUT.ring), held up
//     to its edge where the survey had it sagging in; inside the edge a face
//     dropping BUNKER_CUT.cut below the lip within BUNKER_CUT.face, then the
//     survey's own floor where that's deeper.
// Never on a green or its fringe (the green's own survey decides there: a
// putt's line is the green's), nor at the water's edge (a pond's bank is its
// own: sim/walls.mjs) - eased off over the EASE metres before either, so
// nothing steps up at their edges. A tee itself is level up to its edge all
// the same: its part has the last word (`last`), handed what the rest made
// of a spot - a pond's bank or the shore's never tilts it.
//
// Pure: each part { box, drop, at(x, z) } as groundShaping adds them up.

import { insidePolygon, distanceToEdge } from "../terrain.mjs";
import { smoothstep01, clamp } from "../mathutil.mjs";
import { insideDepth, shapeBounds, inBox } from "./shapes.mjs";
import { wallOf } from "../walls.mjs";
import { isPot, SINK, makePath, nearest, pointAt } from "../course.mjs";
import { madeSince } from "../maker.mjs";
import { flashLift } from "../hazardshapes.mjs";
import { CUT, facing, edgeOut } from "../bunkercut.mjs";

// A tee box's plate: its fall held to this (1 in 100 - level to the eye),
// its bank from `bank[0]` metres out to `bank[1]`, wider the further the
// plate stands off the ground at its edge (`perMetre` metres a metre). On
// ground so steep that a plate would stand more than `most` metres off it
// at an edge, its fall is let go a step at a time (`steps`) until it
// doesn't - a tee on a mountainside is terraced, not a cliff.
export const TEE_PLATE = { fall: 0.01, bank: [2, 6], perMetre: 1.6, sample: 1, most: 2, steps: [0.02, 0.04, 0.08, 0.16] };
// A tee ground on ground too steep for one level plate (a long line of
// tees at the back of a hole, white to red, down a slope) is tiers, each
// its own plate, a ramp `ramp` metres long between one and the next - as a
// course builds one, rather than one plate tilting from end to end: a tier
// for each of the hole's tees on it (their markers at least `apart` metres
// apart: the line's start and layout.teeAt), split midway between them;
// and a tier whose plate would stand more than TEE_PLATE.most off the
// ground halved, while it's longer than twice `least` metres - each split
// kept `clear` metres from any marker, so a tee is never on a ramp.
export const TEE_TIERS = { ramp: 3, apart: 6, least: 8, clear: 4.5 };
// Tee outlines that overlap or come within `join` metres of each other (a
// map often draws each tee of a tee ground on its own, over one another)
// are one tee ground, one plate - two plates over one patch of grass met in
// a step.
export const TEE_JOIN = 1;
// A bunker's cut: its lip's level from the ground `ring` metres outside its
// edge; the grass held up to it over `out` metres; its face `cut` metres
// down within `face` metres inside the edge. A lip sharpened, never a pit
// dug: the ground lowered `most` metres at most, held up `lift` at most
// (by a green built up over a drop, the lip's level all round is far
// below the bank's: cut to it, the face was a cliff).
export const BUNKER_CUT = { ring: [1.5, 3], out: 1.5, cut: 0.3, face: 0.6, sample: 1, most: 0.45, lift: 0.3 };
export const EASE = { green: 2, water: [1, 4] };
// How much of a change is made at a spot `green` metres beyond the green's
// fringe and `water` metres from the water's edge (0 on the green or its
// fringe, within EASE.water[0] of the water; 1 well clear of both).
export const easeOff = (green, water) => smoothstep01(clamp(green / EASE.green, 0, 1)) * smoothstep01(clamp((water - EASE.water[0]) / (EASE.water[1] - EASE.water[0]), 0, 1));

// A plane fitted to [x, z, h] samples (least squares), its fall held to
// `fall`: { cx, cz, a, gx, gz } - its height at (cx, cz), its slope.
export function fitPlane(samples, fall = Infinity) {
  const n = samples.length;
  if (!n) return null;
  let cx = 0, cz = 0, ch = 0;
  for (const [x, z, h] of samples) {
    cx += x;
    cz += z;
    ch += h;
  }
  cx /= n;
  cz /= n;
  ch /= n;
  let sxx = 0, sxz = 0, szz = 0, sxh = 0, szh = 0;
  for (const [x, z, h] of samples) {
    const dx = x - cx, dz = z - cz, dh = h - ch;
    sxx += dx * dx;
    sxz += dx * dz;
    szz += dz * dz;
    sxh += dx * dh;
    szh += dz * dh;
  }
  const det = sxx * szz - sxz * sxz;
  let gx = det > 1e-9 ? (sxh * szz - szh * sxz) / det : 0;
  let gz = det > 1e-9 ? (szh * sxx - sxh * sxz) / det : 0;
  const g = Math.hypot(gx, gz);
  if (g > fall) {
    gx *= fall / g;
    gz *= fall / g;
  }
  return { cx, cz, a: ch, gx, gz };
}
export const planeAt = (p, x, z) => p.a + p.gx * (x - p.cx) + p.gz * (z - p.cz);

// Points `step` apart over a box.
function* grid(box, step) {
  for (let x = box.x0; x <= box.x1; x += step) for (let z = box.z0; z <= box.z1; z += step) yield [x, z];
}

const validOutline = (t) => Array.isArray(t) && t.length >= 3 && t.every((q) => Array.isArray(q) && q.length >= 2 && Number.isFinite(q[0]) && Number.isFinite(q[1]));

// The tee plates' part, or null. base(x, z): the ground before anything's
// shaped on it (asked only once the hole's ready: the first time a height
// is); ease(x, z): how much of a change is made there (easeOff - by the
// green and the water).
export function teePlatesPart(layout, base, ease) {
  if (layout.source !== "map" || !base) return null;
  const outlines = (layout.tees ?? []).filter(validOutline);
  if (!outlines.length) return null;
  // The hole's tees' markers (the line's start; a map's named boxes).
  const markers = [[0, 0], ...Object.values(layout.teeAt ?? {}).filter((t) => Array.isArray(t) && Number.isFinite(t[0]) && Number.isFinite(t[1]))];
  let plates = null;
  const make = () =>
    teeGrounds(outlines).flatMap((polys) => {
      const inside = (x, z) => polys.some((q) => insidePolygon(q, x, z));
      const box = spanning(polys.map((poly) => shapeBounds({ poly }, 0)));
      const samples = [];
      for (const [x, z] of grid(box, TEE_PLATE.sample)) if (inside(x, z)) samples.push([x, z, base(x, z)]);
      // (A sliver of a tee: its corners.)
      if (samples.length < 3) for (const poly of polys) for (const [x, z] of poly) samples.push([x, z, base(x, z)]);
      // Its long way (the samples' own), and how far along it each lies.
      const axis = longWay(samples);
      const along = ([x, z]) => x * axis[0] + z * axis[1];
      const us = samples.map(along);
      const u0 = Math.min(...us);
      const u1 = Math.max(...us);
      // How far outside it (x, z) is (0 inside).
      const outside = (x, z) => (inside(x, z) ? 0 : Math.min(...polys.map((q) => distanceToEdge(q, x, z))));
      // Its tees: the markers on it, or by it (a marker a step off a
      // map's outline is still teed from beside it).
      const marks = markers.filter(([x, z]) => outside(x, z) <= TEE_TIERS.clear).map(along);
      // A tier from a to b: its plate (1 in 100), and how far that stands
      // off the ground under it.
      const fitOf = (a, b, fall = TEE_PLATE.fall) => {
        const mine = samples.filter((p, i) => us[i] >= a - 1e-9 && us[i] <= b + 1e-9);
        const list = mine.length >= 3 ? mine : samples;
        const plane = fitPlane(list, fall);
        return { plane, off: list.reduce((o, [x, z, h]) => Math.max(o, Math.abs(planeAt(plane, x, z) - h)), 0) };
      };
      // Tiers: one a tee, then halved where they need to be.
      const queue = [];
      const ends = [u0, ...tierCuts(u0, u1, marks), u1];
      for (let k = 0; k < ends.length - 1; k++) queue.push([ends[k], ends[k + 1]]);
      const spans = [];
      while (queue.length) {
        const [a, b] = queue.shift();
        const fit = fitOf(a, b);
        const c = fit.off > TEE_PLATE.most && b - a > 2 * TEE_TIERS.least ? splitAt(a, b, marks) : null;
        if (c == null) spans.push([a, b, fit]);
        else queue.unshift([a, c], [c, b]);
      }
      spans.sort((p, q) => p[0] - q[0]);
      const cuts = spans.slice(1).map(([a]) => a);
      const n = spans.length;
      const from = spans.map(([a]) => a);
      const to = spans.map(([, b]) => b);
      const tierOf = (u) => {
        let k = 0;
        while (k < cuts.length && u >= cuts[k]) k++;
        return k;
      };
      let off = 0;
      const tiers = [];
      for (const [a, b, fit] of spans) {
        // (Still standing too far off on a tier as short as they come: its
        // fall let go a step at a time.)
        let { plane, off: o } = fit;
        for (const fall of TEE_PLATE.steps) {
          if (o <= TEE_PLATE.most) break;
          ({ plane, off: o } = fitOf(a, b, fall));
        }
        off = Math.max(off, o);
        tiers.push(plane);
      }
      // Its height at (x, z): its tier's plate - and across a cut between
      // two, a ramp.
      const plateAt = (x, z) => {
        if (n === 1) return planeAt(tiers[0], x, z);
        const u = clamp(along([x, z]), u0, u1);
        const k = tierOf(u);
        // (The nearer cut: the one below it or above it.)
        const below = k > 0 ? u - from[k] : Infinity;
        const above = k < n - 1 ? to[k] - u : Infinity;
        const [c, lo, hi] = below <= above ? [from[k], tiers[k - 1], tiers[k]] : [to[k], tiers[k], tiers[k + 1]];
        if (Math.abs(u - c) >= TEE_TIERS.ramp / 2) return planeAt(tiers[k], x, z);
        const t = smoothstep01(clamp((u - c) / TEE_TIERS.ramp + 0.5, 0, 1));
        return planeAt(lo, x, z) + (planeAt(hi, x, z) - planeAt(lo, x, z)) * t;
      };
      // Its bank as wide as the step to the ground needs.
      const bank = bankFor(off);
      return [{ outside, plateAt, tiers: n, bank, box: spanning(polys.map((poly) => shapeBounds({ poly }, TEE_PLATE.bank[1]))) }];
    });
  return {
    box: spanning(outlines.map((poly) => shapeBounds({ poly }, TEE_PLATE.bank[1]))),
    drop: 0,
    // (The last word: `made`, what the ground's other parts made of the
    // spot, is made up too - a pond's bank doesn't tilt a tee.)
    last: true,
    at: (x, z, made = 0) => {
      plates ??= make();
      // How much of a plate it's on (inside one: wholly it), out to its
      // bank's foot - the bank as wide as the step down (or up) to the
      // ground there needs, the ground as the rest made it, so a pond's
      // bank falling away from a tee is met gently too. On the banks of
      // two (tees on two levels a few metres apart), the step's each's
      // shared by how near it is: from one plate's edge to the other's.
      const ground = base(x, z) + made;
      let weight = 0;
      let sum = 0;
      let shares = 0;
      let near = Infinity;
      for (const p of plates) {
        if (!inBox(p.box, x, z)) continue;
        const o = p.outside(x, z);
        if (o >= TEE_PLATE.bank[1]) continue;
        const d = p.plateAt(x, z) - ground;
        if (o <= 0) return d;
        const w = 1 - smoothstep01(o / Math.max(p.bank, bankFor(Math.abs(d))));
        if (w <= 0) continue;
        weight = Math.max(weight, w);
        near = Math.min(near, o);
        sum += (w / o) * d;
        shares += w / o;
      }
      if (weight <= 0) return 0;
      // (Its bank eased off by the green and the water - wholly from a
      // metre out, the tee's own edge always where the tee is.)
      const k = 1 - (1 - ease(x, z)) * smoothstep01(Math.min(near, 1));
      return k ? k * weight * (sum / shares) : 0;
    },
  };
}

// A tee's bank: how wide, for a step of `step` metres between its plate and
// the ground.
const bankFor = (step) => clamp(TEE_PLATE.bank[0] + step * TEE_PLATE.perMetre, TEE_PLATE.bank[0], TEE_PLATE.bank[1]);

// Where a tee ground from u0 to u1 (metres along it) is cut between its
// tees: midway between markers (us) that are TEE_TIERS.apart or more apart.
export function tierCuts(u0, u1, us = []) {
  const marks = [...us].filter((u) => u > u0 && u < u1).sort((a, b) => a - b);
  const apart = marks.filter((u, i) => i === 0 || u - marks[i - 1] >= TEE_TIERS.apart);
  return apart.slice(1).map((u, i) => (apart[i] + u) / 2);
}

// Where a tier from a to b is halved: as near its middle as keeps
// TEE_TIERS.clear from every marker (us) and TEE_TIERS.least from each end
// - or null where nowhere does.
export function splitAt(a, b, us = []) {
  const mid = (a + b) / 2;
  const ok = (c) => c - a >= TEE_TIERS.least && b - c >= TEE_TIERS.least && us.every((u) => Math.abs(u - c) >= TEE_TIERS.clear);
  for (let d = 0; d <= (b - a) / 2; d += 0.5) {
    if (ok(mid - d)) return mid - d;
    if (ok(mid + d)) return mid + d;
  }
  return null;
}

// The tee outlines in their tee grounds: [[outline, ...], ...] - those that
// overlap or come within TEE_JOIN metres of one another together.
export function teeGrounds(outlines) {
  const boxes = outlines.map((poly) => shapeBounds({ poly }, TEE_JOIN));
  const meet = (i, j) => {
    const [a, b] = [boxes[i], boxes[j]];
    if (a.x0 > b.x1 || b.x0 > a.x1 || a.z0 > b.z1 || b.z0 > a.z1) return false;
    const near = (p, q) => q.some(([x, z]) => insidePolygon(p, x, z) || distanceToEdge(p, x, z) <= TEE_JOIN);
    return near(outlines[i], outlines[j]) || near(outlines[j], outlines[i]);
  };
  const group = outlines.map((_, i) => i);
  const root = (i) => (group[i] === i ? i : (group[i] = root(group[i])));
  for (let i = 0; i < outlines.length; i++) for (let j = i + 1; j < outlines.length; j++) if (root(i) !== root(j) && meet(i, j)) group[root(j)] = root(i);
  const out = new Map();
  outlines.forEach((poly, i) => {
    const r = root(i);
    if (!out.has(r)) out.set(r, []);
    out.get(r).push(poly);
  });
  return [...out.values()];
}

// The long way through a spread of [x, z, ...] points (their principal
// axis), as [dx, dz] of length 1.
function longWay(pts) {
  const n = pts.length;
  const cx = pts.reduce((s, p) => s + p[0], 0) / n;
  const cz = pts.reduce((s, p) => s + p[1], 0) / n;
  let sxx = 0, sxz = 0, szz = 0;
  for (const [x, z] of pts) {
    sxx += (x - cx) ** 2;
    sxz += (x - cx) * (z - cz);
    szz += (z - cz) ** 2;
  }
  const a = 0.5 * Math.atan2(2 * sxz, sxx - szz);
  return [Math.cos(a), Math.sin(a)];
}

// The box round a list of boxes.
function spanning(boxes) {
  let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
  for (const b of boxes) {
    x0 = Math.min(x0, b.x0);
    z0 = Math.min(z0, b.z0);
    x1 = Math.max(x1, b.x1);
    z1 = Math.max(z1, b.z1);
  }
  return { x0, z0, x1, z1 };
}

// Which bunkers are cut so: a map's plain ones.
export const cutBunker = (b) => !!b && !b.dig && !wallOf(b) && !b.walls && !b.waste && !b.surveyed && !isPot(b);

// How far a bunker's cut reaches (metres): `out` outside its edge (its
// grass held up, a flashed face's back easing down) and `face` inside it.
// A course put on hills by the course maker at its second round or since
// (sim/maker.mjs) has its bunkers cut as its flat holes' are (sim/
// bunkercut.mjs): a face steep towards the shot and long at its back - and
// a flashed one's sand flashed up its face as its flat hole's was (sim/
// imaginary.mjs carries it).
export function cutReach(layout, b) {
  const made = madeSince(layout);
  return {
    out: Math.max(BUNKER_CUT.out, made && b.flash ? (b.flash.back ?? 2) + 0.2 : 0),
    face: made ? Math.max(BUNKER_CUT.face, CUT.back) : BUNKER_CUT.face,
  };
}

// The bunkers' cuts part, or null.
export function bunkerCutsPart(layout, base, ease) {
  if (layout.source !== "map" || !base) return null;
  const C = BUNKER_CUT;
  const bunkers = (layout.bunkers ?? []).filter(cutBunker);
  if (!bunkers.length) return null;
  const made = madeSince(layout);
  // (Round 2's: which way each one's face looks - sim/bunkercut.mjs.)
  const g = layout.green;
  let path = null;
  const faceOf = (b) => {
    if (!made) return null;
    if (b.flash) return { a: b.flash.a };
    const byGreen = !!g && Number.isFinite(g.x) && Math.hypot(b.x - g.x, b.z - g.z) < Math.max(g.rx ?? 0, g.rz ?? 0) + Math.max(b.rx ?? 0, b.rz ?? 0) + SINK.near;
    if (byGreen) return { g: [g.x, g.z] };
    if (!(layout.path?.length >= 2)) return null;
    path ??= makePath(layout.path);
    const d = pointAt(path, nearest(path, b.x, b.z).s).dir;
    return { a: Math.atan2(d[1], d[0]) };
  };
  let cuts = null;
  const make = () =>
    bunkers.flatMap((b) => {
      const ring = [];
      for (const [x, z] of grid(shapeBounds(b, C.ring[1]), C.sample)) {
        const e = insideDepth(b, x, z);
        if (e <= -C.ring[0] && e >= -C.ring[1]) ring.push([x, z, base(x, z)]);
      }
      // (The lip may lean with the ground, as much as it leans.)
      const lip = fitPlane(ring);
      const cut = faceOf(b);
      const reach = cutReach(layout, b);
      return lip ? [{ b, lip, box: shapeBounds(b, reach.out + 0.1), out: reach.out, faced: cut ? { ...b, cut } : null, flash: made && b.flash ? b : null }] : [];
    });
  return {
    box: spanning(bunkers.map((b) => shapeBounds(b, cutReach(layout, b).out + 0.1))),
    drop: C.cut,
    at: (x, z) => {
      cuts ??= make();
      // (Inside one: its own face and floor, the deepest of any it's in -
      // never held up by a neighbour's lip. Outside them all: the most any
      // holds it up.)
      let inside = null;
      let up = 0;
      let k = null;
      for (const c of cuts) {
        if (!inBox(c.box, x, z)) continue;
        const e = insideDepth(c.b, x, z);
        if (e < -c.out) continue;
        const h = base(x, z);
        k ??= ease(x, z);
        if (!k) return 0;
        // (Round 2's: how much the edge here is its face - its outline's
        // own way out - its face that much steeper and its back that much
        // longer; a flashed one's sand climbing its far side and the grass
        // behind easing down. Its grass held up to the plane, not above it
        // as a flat hole's is: a ball by its face on the hills has no
        // face to clear in play, only the ground.)
        const f = c.faced ? facing(c.faced, x, z, edgeOut(c.b.poly, x, z)) : null;
        const flash = c.flash ? flashLift(c.flash, x, z, e) : 0;
        const lip = planeAt(c.lip, x, z);
        if (e <= 0) {
          // Outside: held up to the lip, fading out over `out` metres.
          const held = -e < C.out ? clamp(lip - h, 0, C.lift) * (1 - smoothstep01(-e / C.out)) : 0;
          up = Math.max(up, held + flash);
        } else {
          // Inside: from the lip - or the grass, where that stands higher
          // at the edge, so there's never a step there - down its face to
          // the floor: the survey's where that's deeper than the cut, else
          // the cut below the lip.
          const top = Math.max(Math.min(lip, h + C.lift), h);
          const floor = Math.max(Math.min(h, lip - C.cut), h - C.most);
          const p = f == null ? smoothstep01(e / C.face) : faceDown(c.b, e, f);
          const target = top + (floor - top) * p + flash;
          inside = inside == null ? target - h : Math.min(inside, target - h);
        }
      }
      return k * (inside ?? up);
    },
  };
}

// Round 2's face on a map's bunker `b` (sim/bunkercut.mjs cutDown): how
// far down it a spot `e` metres in is, at a spot `f` round it - sharp and
// BUNKER_CUT.face wide towards the shot, a gentle S CUT.back wide at its
// back (never more than CUT.most of its smaller width).
function faceDown(b, e, f) {
  const most = Math.max(BUNKER_CUT.face, Math.min(b.rx ?? 99, b.rz ?? 99) * CUT.most);
  const t = Math.min(1, e / Math.min(most, CUT.back + (BUNKER_CUT.face - CUT.back) * f));
  const soft = t * t * (3 - 2 * t);
  return soft + (1 - (1 - t) * (1 - t) - soft) * f;
}
