// The green comes first (the owner, 20 October 2026, of a map whose big
// pond ran across a green: "Green always takes priority over anything
// else ... the green is fully drawn. Would allow for an island green").
// Water - a pond, a lake, a burn, a brook - that reaches onto a green
// (course.mjs reachesGreen) gives way to the green and its fringe: play
// has them as green and fringe (course.mjs surfaceAt, lieRaster), the
// ground under them isn't dug for it (holeedits groundShaping: giveWay),
// and it's drawn cut round them, its muddy shore along the fringe's edge
// (look/sandwater.js waterFor, `dry`: waterDry). So a pond can lie all
// round a green: an island green. Water that stops short of the green -
// a pond held up to it by a wall - is left just as it was; but no
// water's bank, cut into the ground beside it, ever digs into a green or
// its fringe (heldBack). Where that leaves a green with water all round,
// cut off from land, a causeway of fairway runs to the nearest land (sim/
// causeway.mjs), and it's kept to as the green and its fringe are: in
// everything below, "the greens" have it too.
import { FRINGE, reachesGreen } from "./course.mjs";
import { causeways, causewayPast, causewayBounds } from "./causeway.mjs";
import { insideDepth, shapeBounds } from "./holeedits/shapes.mjs";
import { smoothstep01 } from "./mathutil.mjs";

export { reachesGreen };

// How far past the fringe the water's digging takes to reach its full
// depth: at least GREEN_BANK metres - a short bank from the green's collar
// down into the water - and further the deeper it digs, no steeper than
// GREEN_RISE (a pond's bank cut down a hillside below a green standing
// metres over the water eases down from it, not off a cliff).
// Inside the water's own edge the ground is under the water anyway, and
// plays as water: there it goes down to the water's bed over GREEN_BANK
// metres past the fringe, whatever the depth - eased into that over the
// first WATER_IN metres in from its edge, so the ground's never stepped.
export const GREEN_BANK = 1;
export const GREEN_RISE = 0.45;
export const WATER_IN = 0.8;
export const greenEase = (depth) => Math.max(GREEN_BANK, Math.abs(depth) / GREEN_RISE);

// A hole's greens as shapes: its green, and on a hole from a map any others
// (outlines).
export function greenShapes(L) {
  if (!L?.green) return [];
  return [L.green, ...(L.greens ?? []).map((poly) => ({ poly }))];
}

// A hole's greens and their fringes - and an island green's causeway
// (sim/causeway.mjs) - made once to be asked often:
//   past(x, z): metres past the fringe's edge, or the causeway's (negative
//     on either, or the green) - Infinity where it's further than `reach`
//     (quickly, by their boxes);
//   within(x, z): on a green or its fringe;
//   dig(x, z, depth): how much of digging `depth` metres deep for water
//     there is there - none on the green and its fringe, all of it once
//     far enough past (greenEase);
//   meets(box, grow): could anything in a box come within `grow` metres
//     of them - by their boxes, so maybe; false means certainly not;
//   heldBack(v, x, z): a bank's cut (or a raise) of v metres at (x, z),
//     beside water whether or not it reaches a green, kept off them;
//   giveWay(w, box, at, drop, inWater): a piece of the ground's shaping
//     for water w (at(x, z): how much it raises or lowers the ground, by
//     up to `drop` metres; inWater(x, z): how far inside its edge) made to
//     leave them be - if w reaches onto a green, else as it was.
export function greenZone(L) {
  const shapes = greenShapes(L);
  const ways = causeways(L);
  const boxes = [...shapes.map((g) => shapeBounds(g, FRINGE)), ...ways.map((c) => causewayBounds(c))];
  const past = (x, z, reach = Infinity) => {
    let d = Infinity;
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      const out = Math.hypot(Math.max(b.x0 - x, 0, x - b.x1), Math.max(b.z0 - z, 0, z - b.z1));
      if (out >= reach) continue;
      d = Math.min(d, i < shapes.length ? -insideDepth(shapes[i], x, z) - FRINGE : causewayPast(ways[i - shapes.length], x, z));
    }
    return d;
  };
  const meets = (a, grow = 0) => boxes.some((b) => a.x0 - grow <= b.x1 && a.x1 + grow >= b.x0 && a.z0 - grow <= b.z1 && a.z1 + grow >= b.z0);
  const dig = (x, z, depth = 0) => {
    const ease = greenEase(depth);
    return smoothstep01(past(x, z, ease) / ease);
  };
  return {
    layout: L,
    shapes,
    ways,
    past,
    within: (x, z) => past(x, z, 1e-6) <= 0,
    dig,
    meets,
    heldBack: (v, x, z) => (v ? v * dig(x, z, v) : v),
    giveWay: (w, box, at, drop, inWater) =>
      reachesGreen(L, w) && meets(box, greenEase(drop))
        ? (x, z) => {
            const h = at(x, z);
            if (!h) return h;
            const dry = dig(x, z, h);
            if (dry >= 1) return h;
            const k = smoothstep01(inWater(x, z) / WATER_IN);
            return h * (k ? dry + (dig(x, z) - dry) * k : dry);
          }
        : at,
  };
}

// For drawing a piece of water `w`: how far a point is past the greens'
// fringes, in the world's x and z (the hole's x is -wz, its z wx) - for
// the water to stop at (look/sandwater.js waterFor) - or null if it
// doesn't reach onto a green.
export function waterDry(zone, w) {
  if (!reachesGreen(zone.layout, w)) return null;
  return (wx, wz) => zone.past(-wz, wx);
}
