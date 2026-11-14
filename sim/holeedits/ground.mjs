// Hand edits to a hole (sim/holeedits.mjs): the green shaped in detail,
// bunkers joined to it, and the ground in play - walls, pots, the shaping
// laid on the terrain (groundShaping), trees under the canopy.

import { validBrook, brookLevels, brookGround, brookBankReach, brookRoom, kindOf as brookKind } from "../brooks.mjs";
import { blobOutline, isPot, insideBlob } from "../course.mjs";
import { unpackMask, packMask } from "../terrain.mjs";
import { sculptContour } from "../greensculpt.mjs";
import { wallOf, wallAt, wallDistance, faceRun, REVET, WALL_FACE, edgeOf, insideEdge, pointAtT, spanOf, sunkPond, POND_SINK, shoreAt } from "../walls.mjs";
import { validPath, gapToPaths } from "../paths.mjs";
import { clamp, smoothstep01 } from "../mathutil.mjs";
import { GREEN_CLEAR, JOIN_GAP, POND_BANK, WATER_SHELF, r2 } from "./common.mjs";
import { inBox, insideDepth, moveShape, shapeBounds } from "./shapes.mjs";
import { flashLift } from "../hazardshapes.mjs";
import { greenZone } from "../greenfirst.mjs";

// ---- The green shaped in detail, and bunkers beside it ---------------------------------

// The green's grid of heights as a contour for play, against the green,
// sand and water as they are in L; null if the edit can't be read.
export function greenGrid(base, L, e) {
  const g = shapeBounds(L.green, 20);
  const near = (list) =>
    list.filter((s) => {
      const b = shapeBounds(s);
      return !(b.x1 < g.x0 || b.x0 > g.x1 || b.z1 < g.z0 || b.z0 > g.z1);
    });
  return sculptContour(e, L.green, near(L.bunkers), near(L.water), base);
}

// How far a bunker's sand is from the green's edge at its nearest, metres
// (negative where it runs under the green).
export function gapTo(green, s) {
  let gap = Infinity;
  for (const [x, z] of blobOutline(s, 48)) gap = Math.min(gap, -insideDepth(green, x, z));
  return gap;
}

// A bunker set beside the green: moved towards or away from it, along the
// line between their middles, until its sand is JOIN_GAP from the green's
// edge at its nearest - and then its side facing the green drawn onto that
// line too, so it meets the green (or keeps its strip of grass) all along
// that side, not just at one point. The points of its edge within a metre
// or so of the green go all the way; those a little further, part of the
// way, so its outline stays a smooth curve. `free` keeps it as it was
// before being drawn, to start again from when it's moved.
export const JOIN_PULL = { full: 1, fade: 1.5 };
export function joinBunker(green, s, join) {
  const want = JOIN_GAP[join];
  let out = s.free ? { ...s.free } : s;
  delete out.free;
  for (let i = 0; i < 8; i++) {
    const miss = gapTo(green, out) - want;
    if (Math.abs(miss) < 0.03) break;
    const dx = green.x - out.x;
    const dz = green.z - out.z;
    const d = Math.hypot(dx, dz) || 1;
    out = moveShape(out, (dx / d) * miss, (dz / d) * miss);
  }
  out = { ...out, join };
  const inward = (x, z) => {
    const e = 0.05;
    const gx = insideDepth(green, x + e, z) - insideDepth(green, x - e, z);
    const gz = insideDepth(green, x, z + e) - insideDepth(green, x, z - e);
    const l = Math.hypot(gx, gz) || 1;
    return [gx / l, gz / l];
  };
  let drawn = false;
  const poly = blobOutline(out, 96).map(([x, z]) => {
    const gap = -insideDepth(green, x, z);
    const w = 1 - smoothstep01((gap - want - JOIN_PULL.full) / JOIN_PULL.fade);
    if (w <= 0 || gap - want < 0.02) return [x, z];
    drawn = true;
    const aim = gap - (gap - want) * w;
    let [px, pz] = [x, z];
    for (let k = 0; k < 4; k++) {
      const miss = -insideDepth(green, px, pz) - aim;
      if (Math.abs(miss) < 0.01) break;
      const [ux, uz] = inward(px, pz);
      px += ux * miss;
      pz += uz * miss;
    }
    return [r2(px), r2(pz)];
  });
  return drawn ? { ...out, poly, free: out } : out;
}

// ---- The ground in play ------------------------------------------------------------

// Bunkers dug alike laid over each other (groundShaping): how far in from
// one's edge (metres) its depth has taken over from the other's, eased -
// one bowl whose floor changes depth gently, with no bank between them.
export const DIG_BLEND = 2;

// How far in from its edge a dug bunker's face reaches before the sand
// levels out (metres): steeper the deeper it's dug, and never more than
// most of the way across a small one.
export function faceWidth(b) {
  return clamp(b.dig * 1.4 + 0.4, 0.8, Math.max(0.8, Math.min(b.rx, b.rz) * 0.6));
}

// How far down (0 at the grass, 1 the floor) a walled bunker's edge is `e`
// metres in: its ordinary face (`face` metres wide) and the wall's straight
// drop, mixed by how much wall there is there (`wn`, easing in over the
// wall's ends). Mixing the two drops, not the width of the face - which
// held the whole drop back until the face was nearly as narrow as the
// wall's, then dropped it all at once within a hand's width - so the wall
// shrinks evenly to nothing at each end: a pot bunker's revetted face had
// a blade of sand standing across each of its ends.
export function wallFace(e, face, wn) {
  return smoothstep01(e / face) * (1 - wn) + smoothstep01(e / WALL_FACE) * wn;
}

// A pot bunker and the ground round it (the owner, with photos of real
// ones: "there's never really a steep edge to the bunker"; "ensure the face
// spans most of the hole, but lowers to surface level in one quarter, all
// land around it is smooth and not steep - think of the bunker in the
// centre and 3 m of land around it, further if a single bunker"):
//   - the revetted face runs most of the way round (POT.span), tallest
//     through its middle and lowering smoothly to the ground's level over
//     the last part at each end, so one quarter of the edge is open, the
//     grass there sloping gently into the sand;
//   - the ground round it is raised to the face's top, level for half a
//     metre behind it and easing smoothly down to the ground over `reach`
//     (3.5 m; 5 m with no other bunker within 8 m) - never steeper than
//     about 25 degrees;
//   - the face leans back at REVET.angle (sim/walls.mjs faceRun), however
//     tall it is at each spot, the ground 6 cm behind the face drawn over
//     it, the sand sweeping up to its foot in a concave curve a metre wide
//     (REVET);
//   - the sand nearly flat, `dig` down, a little deeper towards the
//     middle (a dished floor), its edge at the ground's own level all the
//     way round, and everywhere it meets the grass a smooth bank whose
//     lower half curves concavely up out of it over at least a metre -
//     never steep.
// Returns { b, box, hill(x, z, w), inside(w, x, z) } for potsPart.
function potGround(b, { dig, h, small, wall, byGreen, clear, green, shelf, others }) {
  const o = edgeOf(b);
  const span = spanOf(wall.a);
  const lift = Math.max(0, h - dig);
  const fTan = Math.tan((REVET.angle * Math.PI) / 180);
  // (The open edge's bank twice REVET.sweep wide: its lower half - where
  // it curves up out of the sand - a concave sweep of at least a metre.)
  const faceN = Math.max(2 * REVET.sweep, Math.min(small * 0.7, dig * 4 + 1));
  const dish = 0.08;
  const floorAt = (e) => -(dig + dish * smoothstep01(e / small));
  const alone = !others.some((x) => x !== b && Math.hypot(x.x - b.x, x.z - b.z) - Math.max(x.rx, x.rz) - Math.max(b.rx, b.rz) < 8);
  const reach = alone ? 5 : 3.5;
  // How tall the face is at `t` round the edge (0 to 1 of its height):
  // full through its middle, easing to nothing over the last 30% at each
  // end; nothing round the open part.
  const along = (t) => {
    const d = (((t - wall.a[0]) % 1) + 1) % 1;
    if (d >= span) return 0;
    const u = d / span;
    return smoothstep01(u / 0.3) * smoothstep01((1 - u) / 0.3);
  };
  // (Never onto the green: eased down to its edge.)
  const near = Math.max(clear, 3);
  const greenOff = (x, z) => (byGreen ? smoothstep01(-insideDepth(green, x, z) / near) : 1);
  return {
    b,
    box: shapeBounds(b, reach + 0.7),
    // Its own raised ground at (x, z), outside it.
    hill(x, z, w = wallAt(b, x, z)) {
      const out = -w.e;
      if (out >= reach + 0.5) return 0;
      const f = along(w.t);
      if (!f) return 0;
      return lift * f * (out < 0.5 ? 1 : 1 - smoothstep01((out - 0.5) / reach)) * greenOff(x, z);
    },
    // Inside it (the owner: "sand cannot curve like that, but the ground
    // needs to work around the sand"): the sand's edge stays at the
    // ground's own level all the way round - never climbing the raised
    // ground - and dips gently to the floor (`faceN`, its lower half a
    // concave sweep of at least a metre). Where the ground round it is
    // raised, the face takes the whole step down to the sand, as tall as
    // the ground is raised there and leaning back at REVET.angle, with
    // sand banked against its foot (REVET.kicker, curving away over
    // REVET.sweep) - so as the face lowers towards its ends, it simply
    // gets shorter, down to nothing; the sand never ramps up to meet it.
    inside(w, x, z) {
      const e = w.e;
      const p = pointAtT(o, w.t).p;
      const top = lift * along(w.t) * greenOff(p[0], p[1]);
      const off = byGreen ? smoothstep01(-insideDepth(green, x, z) / clear) : 1;
      // (Under a face the sand's at the floor's depth right to its foot;
      // as the face lowers to nothing, its edge rises to the ground's
      // level, and the bank widens to faceN.)
      const c = smoothstep01(top / 0.4);
      const sand = (d) => floorAt(d) * off * (c + (1 - c) * smoothstep01(d / faceN));
      if (top < 0.02) return sand(e) * shelf(x, z);
      const k = REVET.kicker * Math.min(1, top / 0.4);
      // Where the face meets the sand banked against it.
      let foot = (top + dig) / fTan;
      for (let i = 0; i < 2; i++) foot = Math.max(0, (top - sand(foot) - k) / fTan);
      const banked = sand(e) + (e < foot ? k : k * (1 - Math.min(1, (e - foot) / REVET.sweep)) ** 2);
      // (The ground 6 cm behind the face drawn over it.)
      const face = top - e * fTan - 0.06 * smoothstep01(e / 0.05);
      return Math.max(banked, face) * shelf(x, z);
    },
  };
}

// The pots on a hole, shaped together: inside one, its own shape (the one
// it's furthest into, where two overlap); round them, their raised ground
// blended where two reach the same spot - nearly the higher of the two,
// never one piled on the other - so the land between neighbours runs
// smoothly from one to the next.
function potsPart(pots) {
  let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
  for (let i = 0; i < pots.length; i++) {
    const b = pots[i].box;
    if (b.x0 < x0) x0 = b.x0;
    if (b.z0 < z0) z0 = b.z0;
    if (b.x1 > x1) x1 = b.x1;
    if (b.z1 > z1) z1 = b.z1;
  }
  const box = { x0, z0, x1, z1 };
  // (Near a pot's edge, the others' raised ground eases away to its own,
  // so its sand's edge is never lifted by a neighbour's: the ground works
  // round the sand.)
  const hills = (x, z) => {
    let sum = 0;
    let own = 0;
    let gap = Infinity;
    for (const p of pots) {
      if (!inBox(p.box, x, z)) continue;
      const w = wallAt(p.b, x, z);
      const v = p.hill(x, z, w);
      sum += v * v * v * v;
      if (-w.e < gap) {
        gap = -w.e;
        own = v;
      }
    }
    const all = Math.sqrt(Math.sqrt(sum));
    return gap < 1.5 ? own + (all - own) * smoothstep01(gap / 1.5) : all;
  };
  return {
    box,
    drop: 0.4,
    at: (x, z) => {
      let best = null;
      for (const p of pots) {
        if (!inBox(p.box, x, z)) continue;
        const w = wallAt(p.b, x, z);
        if (w.e > 0 && (!best || w.e > best.w.e)) best = { p, w };
      }
      return best ? best.p.inside(best.w, x, z) : hills(x, z);
    },
  };
}

// How hand changes shape the ground, for play (courseplay.mjs prepareHole
// hands it to the green, so every height and slope includes it):
//   - a bunker dug by hand has its sand dug `dig` metres below the grass
//     round it, with a face as steep as its depth needs. The grass round it
//     is left as it was - on a designed hole's flat ground as on real
//     ground - and so are the green and its fringe: next to the green the
//     sand is dug to full depth only a fringe's width off it;
//   - a bunker with a wall (sim/walls.mjs) has its sand that far down at
//     the wall's foot, the floor falling towards it from the rest of the
//     bunker, and drops straight down there - over WALL_FACE, not a slope -
//     easing back into the ordinary face over the wall's last metre at
//     each end. Beside the green the wall drops right at the green's edge
//     (never inside it);
//   - a pond with a wall on a designed hole lies its wall's height below
//     the grass, with a straight drop at the wall and a natural bank
//     elsewhere - all inside its outline, which plays as water anyway, so
//     the green or fairway beside it stays exactly where it was;
//   - on real ground, water moved or made by hand gets its bed dug out below
//     the lowest point of its edge, so it lies flat; and beside a pond's
//     wall the ground is built up to the wall's top (never cut down), with
//     a straight drop into the water.
// Returns null if the hole needs none of it; else { height(x, z),
// gradient(x, z), sunk(x, z), wallAt(x, z), hardAt(x, z) } - the last two
// say where a wall's face is (where a rolling ball stops dead) and where
// its top is hard (timber sleepers, a pond wall's cap).
export function groundShaping(layout, terrain = null, baseHeight = null, groundBefore = baseHeight) {
  const mapped = layout.source === "map";
  const parts = [];
  // The walls, for wallAt and hardAt: { s, box, hard } - `hard` how far
  // out from the edge its hard top reaches (0: none).
  const walls = [];
  const green = layout.green;
  // Water reaching onto a green digs nothing on it or its fringe (sim/
  // greenfirst.mjs): its pieces below are each made to give way to them.
  const zone = greenZone(layout);
  const wet = (w, part) => ({ ...part, at: zone.giveWay(w, part.box, part.at, part.drop, (x, z) => insideDepth(w, x, z)) });
  const pots = [];
  // Every plainly dug bunker, joined into one part below: where two lie
  // over each other they're dug as one bowl, not both (a bunker wrapped
  // round the green is several laid along an arc: sim/hazardshapes.mjs) -
  // as far down its face as the furthest in of them, as deep as theirs
  // blended (DIG_BLEND) - and a flashed face lifts it as much as the
  // highest. (Dug as deep as the deeper, the deeper's face ran on inside
  // the other as a little bank down from that one's floor to its own, a
  // line across the sand: the owner, "the outside line of the bunkers is
  // the total bunker".)
  const digs = [];
  for (const b of layout.bunkers) {
    const wall = wallOf(b);
    if (!b.dig && !wall) continue;
    const face = b.dig ? faceWidth(b) : 0.8;
    const box = shapeBounds(b, 0.1);
    // Near the green (its bounds reach this bunker): kept off it.
    const gb = shapeBounds(green, GREEN_CLEAR);
    const byGreen = !(box.x1 < gb.x0 || box.x0 > gb.x1 || box.z1 < gb.z0 || box.z0 > gb.z1);
    // Set to meet the green, its face drops straight off the green's
    // edge; set just off it, off the collar of grass between.
    const clear = b.join === 1 ? 0.3 : b.join === 0 ? JOIN_GAP[0] : GREEN_CLEAR;
    // Running into a pond: the sand shelves up to the water's edge rather
    // than dropping away under it (the flat water lay over the hollow like
    // a lid).
    const ponds = layout.water.filter((w) => {
      const wb = shapeBounds(w, WATER_SHELF);
      return !(box.x1 < wb.x0 || box.x0 > wb.x1 || box.z1 < wb.z0 || box.z0 > wb.z1);
    });
    const shelf = (x, z) => {
      let off = 1;
      for (const w of ponds) off *= smoothstep01(-insideDepth(w, x, z) / WATER_SHELF);
      return off;
    };
    if (!wall) {
      // (One dug a little as every bunker is - course.mjs sinkShape - not
      // at all across the green's fringe, which plays as fringe over any
      // of its sand there: only past it, over 0.8 m.)
      const offGreen = (x, z) => (!byGreen ? 1 : b.sunk ? smoothstep01((-insideDepth(green, x, z) - GREEN_CLEAR) / 0.8) : smoothstep01(-insideDepth(green, x, z) / clear));
      // A flashed face (sim/hazardshapes.mjs flashLift): its far side's
      // sand climbing to a raised lip, the grass easing back down behind -
      // never on the green or its fringe, nor into water. Its box reaches
      // out over that back slope.
      const lift = b.flash
        ? (x, z, e) => {
            const up = flashLift(b, x, z, e);
            if (up <= 0) return 0;
            const g = -insideDepth(green, x, z);
            return up * smoothstep01((g - GREEN_CLEAR) / 1.2) * shelf(x, z);
          }
        : null;
      digs.push({
        box: lift ? shapeBounds(b, (b.flash.back ?? 2) + 0.2) : box,
        drop: b.dig,
        // e: metres in from its edge; down: 0 at its edge to 1 on its
        // floor (its face, eased off the green and up to a pond).
        dig: (x, z) => {
          const e = insideDepth(b, x, z);
          return { e, down: e <= 0 ? 0 : smoothstep01(e / face) * offGreen(x, z) * shelf(x, z) };
        },
        lift,
      });
      continue;
    }
    const dig = b.dig ?? 0;
    const h = wall.h;
    const small = Math.min(b.rx, b.rz);
    // The floor: the wall's full depth for half a metre out from its foot
    // (where a ball comes to rest), then rising gently - 1 in 3 - to the
    // depth the rest of the bunker is dug, eased where they meet.
    const floorAt = (dw) => {
      const over = h - dig - Math.max(0, dw - 0.5) / 3;
      const k = 0.2;
      return dig + (over >= k ? over : over <= -k ? 0 : ((over + k) * (over + k)) / (4 * k));
    };
    walls.push({ s: b, box, hard: wall.m === 1 ? 0.2 : 0, run: faceRun(b) });
    // A pot (course.mjs isPot): shaped with the ground round it, all the
    // pots on the hole together, after this loop (potGround).
    if (isPot(b)) {
      pots.push(potGround(b, { dig, h, small, wall, byGreen, clear, green, shelf, others: layout.bunkers }));
      continue;
    }
    parts.push({
      box,
      drop: Math.max(dig, h),
      at: (x, z) => {
        // (Outside it, nothing: known without the wall's own sums - this is
        // asked at every step of a putt rolling by.)
        if (!insideEdge(edgeOf(b), x, z)) return 0;
        const w = wallAt(b, x, z);
        if (w.e <= 0) return 0;
        const floor = floorAt(w.dw);
        // The ordinary face for a floor that deep, and the wall's, blended
        // over the wall's ends (wallFace).
        const faceN = clamp(floor * 1.4 + 0.4, 0.8, Math.max(0.8, small * 0.6));
        let off = 1;
        if (byGreen) {
          const g = -insideDepth(green, x, z);
          off = smoothstep01(g / clear) * (1 - w.wn) + smoothstep01(g / WALL_FACE) * w.wn;
        }
        return -floor * wallFace(w.e, faceN, w.wn) * off * shelf(x, z);
      },
    });
  }
  if (pots.length) parts.push(potsPart(pots));
  // A brook (sim/brooks.mjs), on any hole: its banks sloping down to its
  // water and its bed below it, its water running downhill with the ground
  // (from the ground as it was: groundBefore, asked for only once the hole
  // is made); along a walled stretch of bank, the grass level right up to
  // the edge.
  for (const w of layout.water) {
    if (!w.brook || !validBrook(w.brook)) continue;
    let shape = null;
    // Under a cart path crossing it, the ground's left as it was (a
    // culvert carries the water under): eased back over a metre either side.
    const paths = (layout.paths ?? []).filter(validPath);
    const culvert = paths.length ? (x, z) => Math.min(1, Math.max(0, gapToPaths(paths, x, z, 2) / 1.2)) : () => 1;
    const ground = (x, z) => {
      if (!shape) {
        const lv = brookLevels(w, groundBefore);
        const wallsAt = w.walls ? (px, pz) => wallAt(w, px, pz)?.wn ?? 0 : () => 0;
        // (Its banks short of the hole's bunkers: brookRoom.)
        shape = brookGround(w, { level: lv.at, groundAt: groundBefore, wallsAt, room: brookRoom(w, layout.bunkers, insideBlob) });
      }
      const d = shape(x, z);
      return d && culvert(x, z) * d;
    };
    if (w.walls) walls.push({ s: w, box: shapeBounds(w, 0.5), hard: 0.3 });
    const k = brookKind(w.brook);
    parts.push(wet(w, { box: shapeBounds(w, brookBankReach(w.brook) + 1), drop: k.drop + 1.5, at: ground }));
  }
  // A pond on a designed hole: lowered inside its outline - with no wall,
  // on a bank rolling over from the grass at its edge and down past the
  // water (POND_SINK: the water its drop below the grass, the bank reaching
  // as deep again under it by `bank` metres in; sim/walls.mjs pondLevel).
  // Only ground inside the water changes, which plays as water wherever it
  // is.
  if (!mapped) {
    for (const w of layout.water) {
      if (!sunkPond(w) || wallOf(w)) continue;
      const deep = POND_SINK.drop * 2;
      parts.push(
        wet(w, {
          box: shapeBounds(w, 0.1),
          drop: deep + 0.1,
          at: (x, z) => {
            const e = insideDepth(w, x, z);
            // (Its bank wide and gentle in places, short and steep in
            // others: sim/walls.mjs shoreAt.)
            return e <= 0 ? 0 : -deep * smoothstep01(Math.min(1, e / shoreAt(w, Math.atan2(z - w.z, x - w.x)).bank));
          },
        }),
      );
    }
  }
  // A pond with a wall on a designed hole: lowered inside its outline.
  if (!mapped) {
    for (const w of layout.water) {
      const wall = wallOf(w);
      if (!wall || w.brook) continue;
      const h = wall.h;
      const bank = clamp(1.5 * h + 0.3, 0.6, 1.8);
      walls.push({ s: w, box: shapeBounds(w, 0.5), hard: 0.3 });
      parts.push(
        wet(w, {
          box: shapeBounds(w, 0.1),
          drop: h + 0.4,
          at: (x, z) => {
            const a = wallAt(w, x, z);
            if (a.e <= 0) return 0;
            // Steepest at the top, levelling out under the water.
            const u = Math.min(1, a.e / (bank + (WALL_FACE - bank) * a.wn));
            return -(h + 0.3 + 0.1 * a.wn) * (1 - (1 - u) * (1 - u));
          },
        }),
      );
    }
  }
  // Water on real ground lies flat, with its bed dug below its lowest edge:
  // every pond and lake, not only those moved or added by hand - real ones
  // read from map tiles or a noisy survey are seldom level, and on a slope
  // the water, drawn flat at its lowest edge, sank under the ground and
  // showed as mud. Only ground inside the water changes, which plays as
  // water wherever it is - but beside a wall, the ground is built up to
  // the wall's top. Where the edge stands higher than the water (a pond on
  // a slope), the ground round it is eased down to the water on a bank
  // (POND_BANK) - except along a wall, which keeps its straight drop.
  if (mapped && terrain && baseHeight) {
    for (const w of layout.water) {
      if (!w.poly || w.brook) continue;
      const edge = w.poly.map(([x, z]) => baseHeight(x, z));
      const level = Math.min(...edge) - 0.5;
      // The bank (POND_BANK): from just above the water's own level (as
      // pondLevel draws it) at the edge, rising gently away from it; how
      // far out it can reach, and the ground eased down to it there, never
      // raised. e: how far inside the edge; wn: how much of a wall's there.
      const foot = Math.min(...edge) - 0.05 + POND_BANK.foot;
      const tall = Math.max(...edge) - foot;
      const reach = tall > 0 ? (3 * tall) / POND_BANK.rise + 6 : 0;
      const banked = (h, e, wn) => {
        const out = Math.max(0, -e);
        if (!reach || out >= reach || wn >= 1) return h;
        const over = h - (foot + POND_BANK.rise * out);
        if (over <= 0) return h;
        const r = Math.min(2, POND_BANK.ease + 0.15 * out);
        const cut = over < r ? (over * over) / (2 * r) : over - r / 2;
        // (Faded out over the far half of its reach: on a hill steeper than
        // the bank, it stops there rather than cutting a step.)
        return h - cut * (1 - wn) * (1 - smoothstep01(2 * (out / reach) - 1));
      };
      const wall = wallOf(w);
      // The wall's top: its height above the water (which lies just under
      // the lowest point of the edge, as it's drawn), and how far back from
      // it the ground is held up to it.
      const top = Math.min(...edge) - 0.05 + (wall?.h ?? 0);
      const terrace = wall ? 3 + 2 * wall.h : 0;
      if (wall) walls.push({ s: w, box: shapeBounds(w, 0.5), hard: 0.3 });
      const own = shapeBounds(w);
      parts.push(wet(w, {
        box: shapeBounds(w, Math.max(wall ? terrace : 0, reach) + 0.1),
        drop: Math.max(...edge) - level + 1,
        at: (x, z) => {
          const h = baseHeight(x, z);
          // (Quickly, away from the pond: nothing to change where even
          // the nearest the pond could be leaves the ground under the bank
          // and clear of a wall's terrace.)
          const far = Math.hypot(Math.max(own.x0 - x, 0, x - own.x1), Math.max(own.z0 - z, 0, z - own.z1));
          if (far > 0 && (!wall || far >= terrace) && (far >= reach || h <= foot + POND_BANK.rise * far)) return 0;
          const a = wall ? wallAt(w, x, z) : null;
          const e = a ? a.e : insideDepth(w, x, z);
          // (Neither the bank's cut nor the terrace by a wall reaching a
          // green or its fringe: sim/greenfirst.mjs heldBack.)
          const raise = zone.heldBack(a ? Math.max(0, top - h) * (1 - smoothstep01(a.dw / terrace)) * a.wn : 0, x, z);
          const cut = zone.heldBack(banked(h, e, a ? a.wn : 0) - h, x, z);
          if (e <= 0) return raise + cut;
          // Steeply in from the edge, so the water comes right up to it:
          // the ground that plays as water is under water. Straight down
          // at a wall.
          const s = smoothstep01(e / (a ? 0.8 + (WALL_FACE - 0.8) * a.wn : 0.8));
          const from = h + cut + raise;
          return from > level ? from - h + (level - from) * s : raise * (1 - s) + cut;
        },
      }));
    }
  }
  if (digs.length) {
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    for (let i = 0; i < digs.length; i++) {
      const b = digs[i].box;
      if (b.x0 < x0) x0 = b.x0;
      if (b.z0 < z0) z0 = b.z0;
      if (b.x1 > x1) x1 = b.x1;
      if (b.z1 > z1) z1 = b.z1;
    }
    const box = { x0, z0, x1, z1 };
    parts.push({
      box,
      drop: Math.max(...digs.map((d) => d.drop ?? 0)),
      at: (x, z) => {
        let down = 0;
        let weight = 0;
        let deep = 0;
        let up = 0;
        for (const d of digs) {
          if (!inBox(d.box, x, z)) continue;
          const { e, down: dn } = d.dig(x, z);
          if (dn > down) down = dn;
          if (e > 0) {
            const w = smoothstep01(e / DIG_BLEND);
            weight += w;
            deep += w * d.drop;
          }
          if (d.lift) up = Math.max(up, d.lift(x, z, e));
        }
        return (weight > 0 ? -(deep / weight) * down : 0) + up;
      },
    });
  }
  if (!parts.length) return null;
  const height = (x, z) => {
    let h = 0;
    for (const p of parts) if (inBox(p.box, x, z)) h += p.at(x, z);
    return h;
  };
  const e = 0.1;
  const REACH = 14;
  const wide = parts.filter((p) => p.drop > 0).map((p) => ({ drop: p.drop, box: { x0: p.box.x0 - REACH, z0: p.box.z0 - REACH, x1: p.box.x1 + REACH, z1: p.box.z1 + REACH } }));
  return {
    height,
    // How far anything drawn coarsely over the ground near here (the
    // distant ground under the hole, every dozen metres) must drop to stay
    // below what's been dug.
    // ⚡ Bolt: Replaced reduce with for loop for performance
    sunk: (x, z) => {
      let m = 0;
      for (let i = 0; i < wide.length; i++) {
        const p = wide[i];
        if (inBox(p.box, x, z) && p.drop > m) m = p.drop;
      }
      return m;
    },
    gradient: (x, z) => {
      if (!parts.some((p) => inBox(p.box, x, z))) return [0, 0];
      return [(height(x + e, z) - height(x - e, z)) / (2 * e), (height(x, z + e) - height(x, z - e)) / (2 * e)];
    },
    // On a wall's face (or right by it, where the slope play feels is
    // already the wall's): a rolling ball meeting it stops dead.
    wallAt: (x, z) => {
      for (const w of walls) {
        // (A pot's face leans back: all of it, out to its foot.)
        const r = Math.max(0.35, w.run + 0.1);
        if (!inBox(w.box, x, z) || wallDistance(w.s, x, z, r + 0.15) > r + 0.1) continue;
        const a = wallAt(w.s, x, z);
        if (a.wn > 0.5 && a.e > -0.15 && a.e < r) return true;
      }
      return false;
    },
    // On a wall's hard top: timber sleepers along a bunker, a pond wall's
    // cap - a ball pitching there kicks as off a path.
    hardAt: (x, z) => {
      for (const w of walls) {
        if (!w.hard || !inBox(w.box, x, z) || wallDistance(w.s, x, z, 0.5) > w.hard + 0.05) continue;
        const a = wallAt(w.s, x, z);
        if (a.wn > 0.3 && a.e <= 0.02 && a.e > -w.hard) return true;
      }
      return false;
    },
  };
}

// The trees mask of a mapped hole's real-tree canopy with the crowns of
// trees taken away (or moved) by hand cleared, so their ground stops
// playing as trees. Where a crown overlapped a tree still standing
// (`standing`: [x, z] of the real trees left), only the ground nearer the
// one that's gone is cleared. Returns a new canopy (the old one if nothing
// changes).
export function clearCrowns(canopy, crowns, standing = []) {
  if (!canopy?.trees || !crowns?.length) return canopy;
  const { x0, z0, cell, nx, nz } = canopy;
  const mask = unpackMask(canopy.trees, nx * nz);
  for (const [x, z, r] of crowns) {
    const near = standing.filter((t) => Math.abs(t[0] - x) < r * 2 + 20 && Math.abs(t[1] - z) < r * 2 + 20 && (t[0] !== x || t[1] !== z));
    for (let iz = Math.max(0, Math.floor((z - r - z0) / cell)); iz <= Math.min(nz - 1, Math.ceil((z + r - z0) / cell)); iz++) {
      for (let ix = Math.max(0, Math.floor((x - r - x0) / cell)); ix <= Math.min(nx - 1, Math.ceil((x + r - x0) / cell)); ix++) {
        const cx = x0 + ix * cell;
        const cz = z0 + iz * cell;
        const d = Math.hypot(cx - x, cz - z);
        if (d > r) continue;
        if (near.some((t) => Math.hypot(cx - t[0], cz - t[1]) < d)) continue;
        mask[iz * nx + ix] = 0;
      }
    }
  }
  return { ...canopy, trees: packMask(mask) };
}

// Under the crown of a tree planted or moved by hand? For play: the ground
// there plays as trees (where it would otherwise be rough).
export function underHandTree(handTrees, x, z) {
  for (const [tx, tz, r] of handTrees) if (Math.abs(tx - x) <= r && Math.abs(tz - z) <= r && Math.hypot(tx - x, tz - z) <= r) return true;
  return false;
}
