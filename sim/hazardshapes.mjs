// The course maker's bunkers and water, shaped further (the owner, 18 - 21
// October 2026: "the course maker's shapes and sizes - greenside bunkers
// curving round the green, more spread of sizes, natural lakes and
// wetland edges - and a raised lip on a bunker's far side"; "Yes to all
// 1-5"). After a hole's bunkers and water are placed and styled
// (sim/course.mjs buildHole, sim/architect.mjs), each from a randomness of
// its own, so nothing else on the hole moves for them:
//   - wraps: now and then a greenside bunker drawn out along an arc round
//     the green, the same way off its edge - one bunker, curving round it
//     (a bent blob: sim/course.mjs blobRadius);
//   - sizes: each a size of its own - a few small, most about as they
//     were, some big - and now and then a long one down a fairway's edge;
//   - flashed faces: a bunker's far side (the way play goes past it) climbs
//     to a raised lip of grass, its sand flashed up the face towards the
//     player, the grass easing back down behind - ground shaping, played
//     as drawn (sim/holeedits/ground.mjs), kept off the green and fringe;
//   - lakes: now and then a pond off the side of a hole is a natural lake,
//     longer and wider, pushed out to keep the fairway clear;
//   - wetland edges: a lake's (or a big pond's) far shore, away from play,
//     a marsh - shallow, muddy water a few metres out, thick with reeds
//     (look/sandwater.js, sim/dressing.mjs) - still water to play;
//   - fingered (5 November 2026, sim/fingers.mjs): on a heathland course
//     most of its bunkers, now and then a parkland one's, fingers of sand
//     reaching up its face the way play comes, capes of grass between -
//     its face flashed, if it wasn't.
// What's made is kept with the hole (its layout), so a course made before
// stays as it was. Pure.

import { seeded, blobRadius, blobOutline, insideBlob, nearest, pointAt, isPot } from "./course.mjs";
import { FINGERED, fingerBunker } from "./fingers.mjs";

export const HAZARDS = {
  // The chance a greenside bunker wraps round the green, by the hole's
  // bunker style (sim/course.mjs BUNKER_STYLES); how much longer it's
  // drawn out round it, from one at least `least` long (half, metres) to
  // `most` long in all.
  wrap: { classic: 0.4, modern: 0.6, rugged: 0.3, grow: [1.3, 1.8], least: 5, most: 32 },
  // Sizes: [chance, least, most] scale - small, as they were, big.
  sizes: [
    [0.22, 0.6, 0.78],
    [0.58, 0.9, 1.1],
    [0.2, 1.2, 1.5],
  ],
  // A long bunker down a fairway's edge: its chance, how much longer.
  long: { chance: 0.25, along: [1.5, 2], across: 0.85 },
  // A flashed face's chance by style; how high its lip stands over the
  // grass (metres) and how far its back eases down.
  flash: { classic: 0.45, modern: 0.65, rugged: 0.35, h: [0.25, 0.5], back: [1.6, 2.4] },
  // A side pond made a lake: its chance, how much longer and wider.
  lake: { chance: 0.5, along: [1.5, 2], across: [1.4, 1.8] },
  // A wetland edge: on a water this big (its longer radius, metres) - a
  // lake always, a big pond now and then - over this much of its far
  // shore (half the arc, radians), this wide.
  marsh: { from: 30, chance: 0.5, span: [0.6, 1.2], width: [4, 8] },
};

const span = (rand, [a, b]) => a + rand() * (b - a);
const r3 = (v) => Math.round(v * 1000) / 1000;

// Whether a bunker can be reshaped here (not a pot, a waste area, a walled
// one, one of a row across the fairway - sim/crossbunkers.mjs, shaped as
// a row - or a real one from a map).
const plain = (b) => !b.poly && !b.waste && !b.cross && !b.wall && !b.walls && !isPot(b);

// The hole's bunkers and water shaped further, in place: hole (buildHole's,
// before its trees), spec, style (holeBunkerStyle), path (its centreline,
// with cumulative lengths), greenShape, approach (the way play comes onto
// the green, radians), halfWidthBase (the fairway's half width). Returns
// the hole.
// fairway: false leaves the drive zone's bunkers their size (a strategic
// hole's, put where they're meant: sim/architect.mjs); lakes: false leaves
// its water where and as big as it is.
export function shapeHazards(hole, spec, { style, path, greenShape, approach, halfWidthBase, fairway = true, lakes = true }) {
  if (style === "links" || !hole.bunkers) return hole;
  const seed = (spec.seed ?? 1) >>> 0;
  const L = hole.length;
  const greenside = (b) => Math.hypot(b.x - greenShape.x, b.z - greenShape.z) < Math.max(greenShape.rx, greenShape.rz) + 20;
  // Kept clear of the green (and a couple of metres round it), the tee
  // and water; inside the hole.
  // (`gap`: how near the green it may come - 2 m, or as near as it was.)
  const clear = (b, gap = 2) => {
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      const r = blobRadius(b, a);
      const x = b.x + Math.cos(a + b.rot) * r;
      const z = b.z + Math.sin(a + b.rot) * r;
      if (insideBlob(greenShape, x, z, gap) || Math.hypot(x, z) < 22 || (hole.water ?? []).some((w) => insideBlob(w, x, z)) || x > L + 40) return false;
    }
    return true;
  };
  // The same, round every point of its outline as it's drawn (a fingered
  // one's narrow fingers fall between clear's few).
  const clearFine = (b, gap = 2) =>
    !blobOutline(b, 96).some(([x, z]) => insideBlob(greenShape, x, z, gap) || Math.hypot(x, z) < 22 || (hole.water ?? []).some((w) => insideBlob(w, x, z)) || x > L + 40);
  // How near the green a bunker's edge comes (metres off it).
  const offGreen = (b) => {
    let least = Infinity;
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      const r = blobRadius(b, a);
      least = Math.min(least, -insideDepthOf(greenShape, b.x + Math.cos(a + b.rot) * r, b.z + Math.sin(a + b.rot) * r));
    }
    return least;
  };
  // (A fairway bunker kept off the middle of the fairway: the centreline
  // well outside it.)
  const offLine = (b) => {
    const n = nearest(path, b.x, b.z);
    const at = pointAt(path, n.s).p;
    return !insideBlob(b, at[0], at[1], halfWidthBase * 0.35);
  };

  // Sizes, and the odd long one down a fairway's edge.
  {
    const rand = seeded((seed ^ 0x51ce5) >>> 0 || 1);
    hole.bunkers = hole.bunkers.map((b) => {
      const k = rand();
      const along = rand();
      const across = rand();
      const longOne = rand();
      if (!plain(b) || (!fairway && !greenside(b))) return b;
      let pick = 0;
      for (let i = 0, acc = 0; i < HAZARDS.sizes.length; i++) {
        acc += HAZARDS.sizes[i][0];
        if (k < acc) {
          pick = i;
          break;
        }
      }
      const [, lo, hi] = HAZARDS.sizes[pick];
      const s = lo + along * (hi - lo);
      let out = { ...b, rx: r3(b.rx * s), rz: r3(b.rz * (lo + across * (hi - lo))) };
      if (!greenside(b) && longOne < HAZARDS.long.chance) out = { ...out, rx: r3(out.rx * span(() => along, HAZARDS.long.along)), rz: r3(out.rz * HAZARDS.long.across) };
      // (Grown into the green, the tee, water or the fairway's middle: as
      // it was.)
      return s > 1 || out.rx > b.rx ? (clear(out) && (greenside(b) || offLine(out)) ? out : b) : out;
    });
  }

  // Wraps round the green: a greenside bunker drawn out along an arc round
  // the green's middle, as far off its edge as it was - one bunker, bent
  // (sim/course.mjs blobRadius's bend).
  {
    const rand = seeded((seed ^ 0x3a7a9) >>> 0 || 1);
    const chance = HAZARDS.wrap[style] ?? 0;
    hole.bunkers = hole.bunkers.map((b) => {
      const roll = rand();
      const grow = span(rand, HAZARDS.wrap.grow);
      // (Not a small one: a partner beside a bigger.)
      if (!plain(b) || !greenside(b) || roll >= chance || b.rx < HAZARDS.wrap.least) return b;
      const d = Math.hypot(b.x - greenShape.x, b.z - greenShape.z);
      const phi0 = Math.atan2(b.z - greenShape.z, b.x - greenShape.x);
      // Following the green's own edge, as far off it as it is here: bent
      // round the circle through three points that far off it - its middle
      // and either end (an oval green curves more at its ends than its
      // sides). Drawn out less, if it must be, to stay off the green.
      const edge = (phi) => blobRadius(greenShape, phi - greenShape.rot);
      const gap = d - edge(phi0);
      const off = (phi) => [greenShape.x + Math.cos(phi) * (edge(phi) + gap), greenShape.z + Math.sin(phi) * (edge(phi) + gap)];
      for (const k of [1, 0.75, 0.5]) {
        const along = Math.min(HAZARDS.wrap.most, b.rx * 2 * (1 + (grow - 1) * k));
        const half = along / 2 / d;
        const [p0, p1, p2] = [off(phi0 - half), [b.x, b.z], off(phi0 + half)];
        const c = circleThrough(p0, p1, p2);
        // (Curving the green's way round it, not away.)
        if (!c || (c[0] - b.x) * (greenShape.x - b.x) + (c[1] - b.z) * (greenShape.z - b.z) <= 0) break;
        let rot = Math.atan2(p2[1] - p0[1], p2[0] - p0[0]);
        // Its own +z side (rot's left) the inside of the curve.
        if (-Math.sin(rot) * (c[0] - b.x) + Math.cos(rot) * (c[1] - b.z) < 0) rot += Math.PI;
        const wrapped = { ...b, rot: r3(rot), rx: r3(along / 2), bend: r3(1 / Math.hypot(c[0] - b.x, c[1] - b.z)), wrap: 1 };
        if (clear(wrapped, Math.max(0.5, Math.min(2, offGreen(b) - 0.3)))) return wrapped;
      }
      return b;
    });
  }

  // Flashed faces: towards the way play comes past each.
  {
    const rand = seeded((seed ^ 0xf1a54) >>> 0 || 1);
    const chance = HAZARDS.flash[style] ?? 0;
    hole.bunkers = hole.bunkers.map((b) => {
      const roll = rand();
      const h = span(rand, HAZARDS.flash.h);
      const back = span(rand, HAZARDS.flash.back);
      if (!plain(b) || roll >= chance) return b;
      const dir = pointAt(path, nearest(path, b.x, b.z).s).dir;
      const a = greenside(b) ? approach : Math.atan2(dir[1], dir[0]);
      return { ...b, flash: { a: r3(a), h: r3(h), back: r3(back) } };
    });
  }

  // Fingered (sim/fingers.mjs): its fingers up its face, towards the way
  // play comes past it (its flash's, if it has one) - each kept off the
  // green (as near as it was, 2 m at most), the tee, water and, a fairway
  // bunker's, the fairway's middle; shorter if they must be, else none.
  // Flashed if it wasn't: heathland's fingers climb a face of sand.
  {
    const rand = seeded((seed ^ 0xf19e5) >>> 0 || 1);
    const chance = FINGERED.chance[style] ?? 0;
    hole.bunkers = hole.bunkers.map((b) => {
      const roll = rand();
      const own = Math.floor(rand() * 2 ** 31) || 1;
      const h = span(rand, FINGERED.flash.h);
      const back = span(rand, FINGERED.flash.back);
      if (!plain(b) || b.fingered || roll >= chance || Math.max(b.rx, b.rz) < FINGERED.least || (!greenside(b) && !FINGERED.fairway[style])) return b;
      const dir = pointAt(path, nearest(path, b.x, b.z).s).dir;
      const towards = b.flash ? b.flash.a : greenside(b) ? approach : Math.atan2(dir[1], dir[0]);
      const gap = greenside(b) ? Math.max(0.5, Math.min(2, offGreen(b) - 0.3)) : 2;
      const shaped = fingerBunker(b, style, towards, seeded(own));
      for (const k of [1, 0.7, 0.45]) {
        const out = k === 1 ? shaped : { ...shaped, fingered: { ...shaped.fingered, len: r3(shaped.fingered.len * k) } };
        if (!clearFine(out, gap) || (!greenside(b) && !offLine(out))) continue;
        // (Its face's lip gentler and its back longer than a plain one's:
        // bending round every finger, a steep one's slope was more than
        // the grass laid over it could follow, and the ground showed
        // through in dark streaks.)
        const f = out.flash;
        return { ...out, flash: f ? { a: f.a, h: r3(Math.min(f.h, h)), back: r3(Math.max(f.back, back)) } : { a: r3(towards), h: r3(h), back: r3(back) } };
      }
      return b;
    });
  }

  // Lakes, and wetland edges on the far shore.
  {
    const rand = seeded((seed ^ 0x1a4e5) >>> 0 || 1);
    hole.water = (hole.water ?? []).map((w) => {
      const roll = rand();
      const along = span(rand, HAZARDS.lake.along);
      const across = span(rand, HAZARDS.lake.across);
      const marshRoll = rand();
      const half = span(rand, HAZARDS.marsh.span);
      const width = span(rand, HAZARDS.marsh.width);
      if (w.poly || w.brook || w.burn || w.wall || w.walls) return w;
      let out = w;
      // Off to the side of the hole (not across it in front of a green):
      // a lake, pushed out from the line by as much as it's grown across.
      const n = nearest(path, w.x, w.z);
      const at = pointAt(path, n.s);
      const sideways = Math.abs(Math.cos(w.rot - Math.atan2(at.dir[1], at.dir[0]))) > 0.7;
      if (lakes && sideways && roll < HAZARDS.lake.chance) {
        const sign = Math.sign((w.x - at.p[0]) * -at.dir[1] + (w.z - at.p[1]) * at.dir[0]) || 1;
        // (Clear of the green, the tee and every bunker, and the fairway's
        // middle: as big as it can be of the size drawn, else smaller.)
        const dry = [greenShape, { x: 0, z: 0, rot: 0, rx: 9, rz: 9 }, ...hole.bunkers.filter((b) => !b.poly)];
        for (const k of [1, 0.7, 0.45]) {
          const ga = 1 + (along - 1) * k;
          const gc = 1 + (across - 1) * k;
          const push = w.rz * (gc - 1);
          const lake = { ...w, rx: r3(w.rx * ga), rz: r3(w.rz * gc), x: r3(w.x - at.dir[1] * sign * push), z: r3(w.z + at.dir[0] * sign * push), wild: 1, lake: 1 };
          const pathAt = (q) => pointAt(path, Math.max(0, Math.min(L, n.s + q))).p;
          const fair = [-1, -0.5, 0, 0.5, 1].every((q) => !insideBlob(lake, ...pathAt(q * lake.rx), halfWidthBase * 0.5));
          if (!blobOutlineHits(lake, dry) && fair && lake.x + lake.rx < L + 60) {
            out = lake;
            break;
          }
        }
      }
      // Its far shore, away from the line of play, a marsh.
      if (Math.max(out.rx, out.rz) >= HAZARDS.marsh.from && (out.lake || marshRoll < HAZARDS.marsh.chance)) {
        const away = Math.atan2(out.z - at.p[1], out.x - at.p[0]);
        out = { ...out, marsh: { a: r3(away), span: r3(half), width: r3(width) } };
      }
      return out;
    });
  }
  return hole;
}

// How far (x, z) is inside a blob's edge (negative outside), along the
// line from its middle (as sim/holeedits/shapes.mjs insideDepth).
function insideDepthOf(shape, x, z) {
  const dx = x - shape.x;
  const dz = z - shape.z;
  const c = Math.cos(-(shape.rot ?? 0));
  const s = Math.sin(-(shape.rot ?? 0));
  const u = dx * c - dz * s;
  const v = dx * s + dz * c;
  return blobRadius(shape, Math.atan2(v, u)) - Math.hypot(u, v);
}

// The middle of the circle through three points [x, z], or null if they
// lie on a line.
function circleThrough([ax, az], [bx, bz], [cx, cz]) {
  const d = 2 * (ax * (bz - cz) + bx * (cz - az) + cx * (az - bz));
  if (Math.abs(d) < 1e-9) return null;
  const a2 = ax * ax + az * az;
  const b2 = bx * bx + bz * bz;
  const c2 = cx * cx + cz * cz;
  return [(a2 * (bz - cz) + b2 * (cz - az) + c2 * (az - bz)) / d, (a2 * (cx - bx) + b2 * (ax - cx) + c2 * (bx - ax)) / d];
}

// Whether any of a shape's edge lies in any of `others`.
function blobOutlineHits(shape, others) {
  for (let i = 0; i < 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    // (Its own wilder edge: blobRadius has its bays and spits.)
    const r = blobRadius(shape, a);
    const x = shape.x + Math.cos(a + shape.rot) * r;
    const z = shape.z + Math.sin(a + shape.rot) * r;
    if (others.some((o) => insideBlob(o, x, z, 2))) return true;
  }
  return false;
}

// Whether (x, z) (the hole's frame) is in a water's wetland edge: how far
// into it (0 at its outer reach, 1 well in) - by how near the edge it is
// (insideDepth: metres in from the water's edge) and how far round its far
// shore. 0 for a water with none.
export function marshAt(w, x, z, depthIn) {
  const m = w?.marsh;
  if (!m || !(depthIn > 0)) return 0;
  const a = Math.atan2(z - w.z, x - w.x);
  let off = Math.abs(a - m.a);
  off = Math.min(off, Math.PI * 2 - off);
  const round = 1 - smooth((off - m.span * 0.7) / (m.span * 0.3));
  const width = 1 - smooth((depthIn - m.width * 0.75) / (m.width * 0.25));
  return Math.max(0, round) * Math.max(0, width);
}
function smooth(t) {
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
}

// A flashed face's ground (sim/holeedits/ground.mjs): how far above the
// grass it lifts the ground at (x, z) for bunker b with flash { a, h, back
// } - its sand climbing its far side to a lip `h` over the grass at the
// edge, the grass behind it easing back down over `back` metres, tapering
// round its sides. depthIn: metres in from its edge (negative outside).
// The same height either side of the edge all the way round: the sand's
// rim and the grass lip laid over it are both on the edge, and a step
// there showed as a crack (or a line of sky) along the top of the face.
export function flashLift(b, x, z, depthIn) {
  const f = b.flash;
  if (!f) return 0;
  const dx = Math.cos(f.a);
  const dz = Math.sin(f.a);
  // How far along towards the far side, as a share of the way to its edge
  // that way.
  const reach = flashReach(b);
  const t = ((x - b.x) * dx + (z - b.z) * dz) / reach;
  const lip = f.h * smooth((t - 0.15) / 0.85) ** 1.3;
  if (depthIn >= 0) return lip;
  return lip * (1 - smooth(-depthIn / f.back));
}
// How far a flashed bunker's edge is from its middle the way its face is:
// its blob's, a fingered one's without its fingers (a finger's tip or a
// cape there would stretch or squash the whole face). Once a bunker.
const FLASH_REACH = new WeakMap();
function flashReach(b) {
  let r = FLASH_REACH.get(b);
  if (r === undefined) {
    r = blobRadius(b.fingered ? { ...b, fingered: null } : b, b.flash.a - b.rot) || 1;
    FLASH_REACH.set(b, r);
  }
  return r;
}
