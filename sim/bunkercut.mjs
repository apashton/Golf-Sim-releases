// The course maker's second round's bunkers (sim/maker.mjs), cut into the
// land as the two newest courses taught (the owner, 23 November 2026, of
// the map courses' bunkers: "They're all a little bit too much sat on the
// land rather than being cut out of the land" - sim/holeedits/cuts.mjs;
// and Saltpine Links' made land, tools/madeland/land.mjs: a steep face
// towards play, a long gentle back). A hole made at round 2 or later
// (madeSince) has every plainly dug bunker - each dug a little as every
// bunker is (course.mjs sinkShape), or as deep as it's dug by hand - cut so:
//   - its face is the side towards the shot: by the green, the side towards
//     the green; out on the hole, its far side along the line of play (the
//     face seen from the tee, the one a shot out has to clear); a flashed
//     one's where its flash is (hazardshapes.mjs). How much a spot's edge
//     faces that way, 0 (its back) to 1 (its face): `facing`;
//   - the grass round it held up to a lip at its edge (CUT.lip: highest on
//     its face, a little at its back), easing back down to the ground over
//     CUT.out - never on the green or its fringe, into water or another
//     bunker;
//   - inside, its face dropping from the lip to the sand: steep and sharp
//     at the lip on its face (CUT.face metres to the floor), long and
//     gentle at its back (CUT.back) - the sand's floor `dig` below the grass
//     round it, so (dig + lip) below the lip;
//   - but a fingered bunker's fingers and the capes of grass between
//     them (sim/fingers.mjs), a metre or two across, dug as every bunker
//     is - a soft face, no lip (inFinger): cut, a face down each side of
//     one stood it up as a cliff.
// And its pots (course.mjs isPot) revetted as the photographs show them:
// sods stacked nearly upright (CUT.revet degrees, as a real course's
// surveyed faces: walls.mjs REVET_SURVEY), in thinner courses (look/
// walls.js). Worked out as a hole's made ready (courseplay.mjs playLayout),
// so play and the picture agree and nothing stored changes; a hole made
// before (no layout.maker) is dug and drawn as it always was.
//
// Pure: for the page, the server and the tests.

import { madeSince } from "./maker.mjs";
import { isPot, sinkShape, SINK, makePath, nearest, pointAt } from "./course.mjs";
import { clamp, smoothstep01 } from "./mathutil.mjs";
import { insideDepth } from "./holeedits/shapes.mjs";

export const CUT = {
  // The grass held up at its edge: at its back, at its face (metres).
  lip: [0.06, 0.2],
  // How far out (metres) the grass held up eases back down to the ground.
  out: 1.6,
  // How wide its face is at least towards the shot, and its back (metres):
  // wider the deeper it's dug, never more than CUT.most of its width.
  face: 0.55,
  back: 1.7,
  most: 0.6,
  // A shot that meets the face drops back down it, to its foot and this
  // much further back (metres; courseplay.mjs faceShot).
  settle: 0.5,
  // A pot's revetted face: how far it leans back from level (degrees).
  revet: 78,
  // A fingered bunker's fingers and capes (inFinger): dug as any bunker
  // is where they move its edge this far (metres) from its body's, eased
  // into the cut where less.
  finger: 0.8,
};

const r2 = (v) => Math.round(v * 100) / 100;
const r3 = (v) => Math.round(v * 1000) / 1000;

// A hole's layout with its bunkers as they're played and drawn at round 2
// (above): each plain one dug (sinkShape, or as deep as dug by hand) and
// given its `cut` - the way its face looks: `a` (radians, the hole's frame)
// or `g` (the green's middle, which it faces from wherever it is) - each
// pot its `revet`. The layout as it was if it isn't one of round 2's, or
// is from a map (sim/holeedits/cuts.mjs cuts those).
export function cutShapes(layout) {
  if (!madeSince(layout) || layout.source === "map" || !layout.bunkers?.length) return layout;
  const g = layout.green;
  let path = null;
  const lineWay = (x, z) => {
    path ??= makePath(layout.path);
    const p = pointAt(path, nearest(path, x, z).s);
    return Math.atan2(p.dir[1], p.dir[0]);
  };
  let changed = false;
  const bunkers = layout.bunkers.map((b) => {
    const out = cutBunker(b, g, lineWay);
    if (out !== b) changed = true;
    return out;
  });
  return changed ? { ...layout, bunkers } : layout;
}

// One bunker as round 2 has it (cutShapes): `g` the hole's green,
// lineWay(x, z) the line of play's way there.
export function cutBunker(b, g, lineWay) {
  if (!b || b.poly || b.waste) return b;
  if (isPot(b)) return b.revet ? b : { ...b, revet: CUT.revet };
  if (b.wall || b.walls) return b;
  const s = b.dig ? b : sinkShape(b, g);
  if (!s.dig) return b;
  if (b.cut) return s;
  const byGreen = !!g && Math.hypot(b.x - g.x, b.z - g.z) < Math.max(g.rx ?? 0, g.rz ?? 0) + Math.max(b.rx, b.rz) + SINK.near;
  const cut = b.flash ? { a: r3(b.flash.a) } : byGreen ? { g: [r2(g.x), r2(g.z)] } : { a: r3(lineWay(b.x, b.z)) };
  return { ...s, cut };
}

// The way out from a bunker's middle at (x, z) - its edge's there, near
// enough: straight out from its middle (as its edge is measured: course.mjs
// blobRadius), or for one bent round an arc (a bunker wrapped round a
// green) as it lies round the arc. [dx, dz], of length 1.
export function outward(b, x, z) {
  const dx = x - b.x;
  const dz = z - b.z;
  if (b.bend > 0 && !b.poly) {
    const rot = b.rot ?? 0;
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    // In its own frame (x along, z across; the arc's middle at (0, R)).
    const u = dx * c + dz * s;
    const v = -dx * s + dz * c;
    const R = 1 / b.bend;
    const a = Math.atan2(u, R - v);
    // Where it would be were it straight, and the way out there carried
    // round the arc.
    const us = a * R;
    const vs = R - Math.hypot(u, R - v);
    const l = Math.hypot(us, vs) || 1;
    const ou = (us / l) * Math.cos(a) - (vs / l) * Math.sin(a);
    const ov = (us / l) * Math.sin(a) + (vs / l) * Math.cos(a);
    return [ou * c - ov * s, ou * s + ov * c];
  }
  const l = Math.hypot(dx, dz) || 1;
  return [dx / l, dz / l];
}

// How much the edge at (x, z) is the bunker's face (1) or its back (0),
// as Saltpine's are carved (tools/madeland/land.mjs): 0.5 + 0.8 cos of
// the angle between the way out there and the way the face looks. `out`:
// the way out, if it's known (a map's outline's own: edgeOut).
export function facing(b, x, z, out = null) {
  const c = b.cut;
  if (!c) return 0.5;
  const [nx, nz] = out ?? outward(b, x, z);
  let dx;
  let dz;
  if (c.g) {
    dx = c.g[0] - x;
    dz = c.g[1] - z;
    const l = Math.hypot(dx, dz) || 1;
    dx /= l;
    dz /= l;
  } else {
    dx = Math.cos(c.a);
    dz = Math.sin(c.a);
  }
  return clamp(0.5 + 0.8 * (nx * dx + nz * dz), 0, 1);
}

// How much (x, z) is in, or beside, one of a fingered bunker's fingers
// or the capes of grass between them (sim/fingers.mjs): 0 (none - its
// body, its back, a bunker without fingers) to 1. A finger's a metre or
// two across, its sides its edge (fingeredDepth), and a cape's as narrow:
// a steep cut face and a lip down each side of one stood its sand up as a
// cliff, so there it's dug as every bunker is - its old soft face, no lip
// (ground.mjs cutDig, face.mjs faceWidthAt) - and the rest of it cut.
// Measured by how far its edge there is from its body's (it without its
// fingers): in a finger or beside one, its finger is its nearest edge, its
// body's metres away; by a cape, the cape's nearer than its body's; full
// from CUT.finger. (Its edge measured to its nearest edge, its body's along
// the line from its middle: smooth across a finger and the grass beside
// it, where an angle round it stepped at a finger's side.) e: insideDepth
// (b, x, z), if it's known.
const BODIES = new WeakMap();
const BODY_KEYS = ["x", "z", "rot", "rx", "rz", "lobes", "phase", "depth", "bend", "edge"];
function bodyOf(b) {
  const kept = BODIES.get(b);
  if (kept && BODY_KEYS.every((k) => kept[k] === b[k])) return kept;
  const { fingered: _f, ...body } = b;
  BODIES.set(b, body);
  return body;
}
export function inFinger(b, x, z, e = insideDepth(b, x, z)) {
  if (!b?.fingered || b.poly) return 0;
  return smoothstep01(Math.abs(e - insideDepth(bodyOf(b), x, z)) / CUT.finger);
}

// The lip at a spot `f` (facing) round it: how far the grass is held up at
// its edge (metres).
export const cutLip = (f) => CUT.lip[0] + (CUT.lip[1] - CUT.lip[0]) * f;

// How wide its face is (metres) at a spot `f` round it: CUT.face towards
// the shot, CUT.back away from it - wider for a deeper drop (its sand `dig`
// below the grass, `lip` above), and never more than CUT.most of its
// smaller width (at least 0.8 m).
export function cutWidth(b, f) {
  const drop = (b.dig ?? 0) + cutLip(f);
  const most = Math.max(0.8, Math.min(b.rx ?? 99, b.rz ?? 99) * CUT.most);
  const face = Math.min(most, Math.max(CUT.face, drop * 1.2));
  const back = Math.min(most, Math.max(CUT.back, drop * 3.5));
  return back + (face - back) * f;
}

// How far down its face a spot `e` metres in is: 0 at the lip, 1 on the
// floor - sharp at the lip on its face (falling fastest there, levelling
// onto the floor), a gentle S at its back.
export function cutDown(b, e, f) {
  if (e <= 0) return 0;
  const t = Math.min(1, e / cutWidth(b, f));
  const soft = t * t * (3 - 2 * t);
  const sharp = 1 - (1 - t) * (1 - t);
  return soft + (sharp - soft) * f;
}

// How high (metres) the grass is held up `out` metres outside its edge
// (out >= 0), at a spot `f` round it: its lip, easing down to the ground
// over CUT.out.
export const cutRaise = (out, f) => (out >= CUT.out ? 0 : cutLip(f) * (1 - smoothstep01(out / CUT.out)));

// The way out of a map's outline at (x, z) (a poly bunker on a course put
// on hills: its nearest side's, outwards) - kept with the outline.
const SIDES = new WeakMap();
export function edgeOut(poly, x, z) {
  let turn = SIDES.get(poly);
  if (turn === undefined) {
    let area = 0;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) area += (poly[j][0] - poly[i][0]) * (poly[j][1] + poly[i][1]);
    // (Clockwise or not, as the x and z axes lie: the outward side.)
    turn = area > 0 ? 1 : -1;
    SIDES.set(poly, turn);
  }
  let best = Infinity;
  let n = [0, 0];
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, az] = poly[j];
    const ex = poly[i][0] - ax;
    const ez = poly[i][1] - az;
    const len2 = ex * ex + ez * ez || 1e-12;
    const t = clamp(((x - ax) * ex + (z - az) * ez) / len2, 0, 1);
    const d = (x - ax - ex * t) ** 2 + (z - az - ez * t) ** 2;
    if (d < best) {
      best = d;
      const l = Math.sqrt(len2);
      n = [(ez / l) * turn, (-ex / l) * turn];
    }
  }
  return n;
}
