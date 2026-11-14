// An unplayable ball (Rules of Golf, Rule 19): anywhere but in the water,
// the player may call the ball unplayable and, for one penalty stroke,
// play from one of three places:
//   back    stroke and distance (19.2a): where the last shot was played
//           from - after a tee shot, back to the tee
//   line    back on the line (19.2b): behind the ball, on the line from
//           the hole through it, as far back as wanted (and within a
//           club-length of the spot chosen there, no nearer the hole)
//   beside  within two club-lengths of the ball (19.2c), no nearer the hole
// In a bunker (19.3) the line and two club-lengths drops stay in the
// bunker, and a fourth - back on the line outside it - costs two strokes.
// And a ball in a penalty area's water (Rule 17.1d), for its penalty
// stroke (penaltyOptions): back where it was played from, back on the
// line from the hole through where it last crossed into the area, or - a
// red area - within two club-lengths of that crossing, no nearer the hole.
// Each relief area's spot is the player's to choose (sim/reliefarea.mjs:
// how far back, and where in it); these are where the game suggests.
//
// Within each relief area the player chooses where, so this chooses as a
// good player would: the best lie on offer, out from under the trees,
// with a way to the hole - and, back on the line, no further back than
// that takes. The ball's placed there (a drop that stays where it's
// dropped). Pure: given the hole (courseplay.mjs prepareHole) and where
// the ball is; course.js shows the choices and moves the ball.

import { distanceToPin, suggestClub, typicalShot, faceAhead, clubClearsFace } from "./courseplay.mjs";
import { lineTrouble, underCrown, CLEAR } from "./treewarn.mjs";
import { LIE_NAMES } from "./lie.mjs";
import { YARD } from "./flight.mjs";

// A club-length (metres): the longest club in the bag but the putter, a
// driver of 45 inches.
export const CLUB_LENGTH = 1.14;
// How far back on the line it looks, and in what steps (metres).
export const LINE_REACH = 200;
const LINE_STEP = 1;
export const BUNKERS = new Set(["bunker", "greenside"]);
// Where a drop would rather finish, best first. Never in the water, nor on
// the green (an unplayable ball is never that near).
const LIE_RANK = { fairway: 0, fringe: 1, semi: 1, rough: 2, waste: 2, path: 3, deep: 4, bunker: 5, greenside: 5, trees: 6 };
// Good enough to stop looking further back on the line: grass no worse
// than the rough, or the sand when the drop has to stay in it.
const GOOD_RANK = 2;

// Whether the ball can be called unplayable here, and if not why: not in
// the water (that's a penalty area: its own drop), not on the green.
export function canDeclare(lie) {
  if (lie === "water") return { ok: false, why: "In the water the penalty drop is taken already" };
  if (lie === "green") return { ok: false, why: "On the green there's always a putt" };
  return { ok: true };
}

// What a spot offers as a drop: its lie (a teeing ground is the short grass
// it is: a dropped ball isn't teed up), its rank, and whether a crown is
// right over it. Null where no drop can go.
export function spotAt(hole, at, index) {
  const raw = hole.lieAt(at[0], at[1]);
  if (raw === "water" || raw === "green" || !(raw in LIE_RANK || raw === "tee")) return null;
  const lie = raw === "tee" ? "fairway" : raw;
  return { at, lie, rank: LIE_RANK[lie], under: underCrown(hole, at, index) };
}

// How likely the shot a player would play from here to the hole is to be
// stopped: the club for the distance, along the line to the pin, against
// the trees (sim/treewarn.mjs) - and, in a dug bunker, 1 if it doesn't
// clear the face. Under CLEAR it gets away.
// (A full swing from further out than a pitch, so the flight is the club's
// own, worked out once: sim/courseplay.mjs swingFor keeps them.)
export function troubleToHole(hole, at, lie, index) {
  const aim = Math.atan2(hole.cup.z - at[1], hole.cup.x - at[0]);
  const distance = distanceToPin(hole, at);
  const yards = distance / YARD;
  const face = BUNKERS.has(lie) ? faceAhead(hole, at, aim) : null;
  const club = suggestClub(distance, lie, { face });
  if (face && !clubClearsFace(face, club, lie, undefined, 0, yards)) return 1;
  if (!index?.list.length) return 0;
  return lineTrouble(hole, at, aim, typicalShot(club, lie, undefined, yards > 60 ? null : yards), index, CLEAR).chance;
}
const wayToHole = (hole, at, lie, index) => troubleToHole(hole, at, lie, index) < CLEAR;

// The best of some spots: the best lie, then out from under a crown, then
// a way to the hole (looked for among the best couple of dozen: it flies a
// shot) - the first that has one, the earliest given (the nearest the hole,
// or the least far back); with none, the most open.
function bestOf(hole, spots, index, { tries = 24 } = {}) {
  if (!spots.length) return null;
  const sorted = spots.map((s, i) => ({ ...s, i })).sort((a, b) => a.rank - b.rank || Number(a.under) - Number(b.under) || a.i - b.i);
  const top = sorted.filter((s) => s.rank === sorted[0].rank && s.under === sorted[0].under).slice(0, tries);
  let open = null;
  for (const s of top) {
    s.chance = troubleToHole(hole, s.at, s.lie, index);
    s.clear = s.chance < CLEAR;
    if (s.clear) return s;
    if (!open || s.chance < open.chance - 0.05) open = s;
  }
  return open;
}

// Within two club-lengths of the ball and no nearer the hole: rings round
// it, the nearest the hole first (so a tie goes to the shortest way in).
function besideSpots(hole, ball, index, keep) {
  const d0 = distanceToPin(hole, ball);
  const out = [];
  const reach = 2 * CLUB_LENGTH;
  for (const r of [reach * 0.25, reach * 0.5, reach * 0.75, reach]) {
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      const at = [ball[0] + Math.cos(a) * r, ball[1] + Math.sin(a) * r];
      if (distanceToPin(hole, at) < d0 - 1e-6) continue;
      const s = spotAt(hole, at, index);
      if (s && keep(s)) out.push(s);
    }
  }
  return out.sort((a, b) => distanceToPin(hole, a.at) - distanceToPin(hole, b.at));
}

// Back on the line from the hole through the ball: the first spot (on it,
// or a club-length either side) good enough and with a way to the hole,
// as far back as that takes; failing that the first good enough one,
// else the best it passed. keep: which spots may be used. In the bunker
// (stay) only spots on the line in that bunker, the first with a way out
// over the face (it stops where the line leaves the sand).
// (Metres along the line it looks for a way to the hole from a good lie.)
const LOOK_FOR_WAY = 30;
function lineSpot(hole, ball, index, { keep, stay = false }) {
  const dx = ball[0] - hole.cup.x;
  const dz = ball[1] - hole.cup.z;
  const len = Math.hypot(dx, dz) || 1;
  const ux = dx / len;
  const uz = dz / len;
  const passed = [];
  let first = null;
  for (let d = LINE_STEP; d <= LINE_REACH; d += LINE_STEP) {
    if (first && d - first.back >= LOOK_FOR_WAY) return first;
    const ref = [ball[0] + ux * d, ball[1] + uz * d];
    const onLine = spotAt(hole, ref, index);
    if (stay && !(onLine && keep(onLine))) break;
    const spots = stay ? [ref] : [ref, [ref[0] - uz * CLUB_LENGTH, ref[1] + ux * CLUB_LENGTH], [ref[0] + uz * CLUB_LENGTH, ref[1] - ux * CLUB_LENGTH]];
    for (const at of spots) {
      const s = at === ref ? onLine : spotAt(hole, at, index);
      if (!s || !keep(s)) continue;
      s.back = d;
      passed.push(s);
      if (s.under || (!stay && s.rank > GOOD_RANK)) continue;
      first ??= s;
      s.clear = wayToHole(hole, s.at, s.lie, index);
      if (s.clear) return s;
    }
  }
  return first ?? bestOf(hole, passed, index);
}

// The places the ball can be played from, in the order offered:
//   [{ kind: "back" | "line" | "beside" | "outside", strokes, ball, lie,
//      back (metres back on the line), clear (a way to the hole), title,
//      detail }]
// Each is there only if the hole has somewhere for it.
//   ball, lie   where the ball is and its lie
//   from        where the last shot was played from, and its lie: [x, z],
//               "tee"... (stroke and distance); null if not known
export function reliefOptions(hole, { ball, lie, from = null, fromLie = null }) {
  if (!canDeclare(lie).ok) return [];
  const index = hole.treeIndex?.();
  const sand = BUNKERS.has(lie);
  const out = [];
  if (from) {
    out.push({ kind: "back", strokes: 1, pens: 1, ball: [...from], lie: fromLie ?? hole.lieAt(from[0], from[1]), back: null, clear: null, ref: [...from], keep: "any" });
  }
  const keepHere = sand ? KEEP.sand : KEEP.any;
  const line = lineSpot(hole, ball, index, { keep: keepHere, stay: sand });
  if (line) out.push({ kind: "line", strokes: 1, pens: 1, ball: line.at, lie: line.lie, back: line.back, clear: line.clear ?? null, ref: [...ball], keep: sand ? "sand" : "any" });
  const beside = bestOf(hole, besideSpots(hole, ball, index, keepHere), index);
  if (beside) out.push({ kind: "beside", strokes: 1, pens: 1, ball: beside.at, lie: beside.lie, back: null, clear: beside.clear ?? null, ref: [...ball], keep: sand ? "sand" : "any" });
  if (sand) {
    const outside = lineSpot(hole, ball, index, { keep: KEEP.out });
    if (outside) out.push({ kind: "outside", strokes: 2, pens: 2, ball: outside.at, lie: outside.lie, back: outside.back, clear: outside.clear ?? null, ref: [...ball], keep: "out" });
  }
  return out.map((o) => ({ ...o, ...reliefWords(hole, o, { ball, sand }) }));
}

// Which spots a relief area keeps to (by name, so an option carries it):
// anywhere a drop can go, in the sand (a bunker's own drops), out of it.
export const KEEP = {
  any: () => true,
  sand: (s) => BUNKERS.has(s.lie),
  out: (s) => !BUNKERS.has(s.lie),
};

// A ball in a penalty area's water (Rule 17.1d) - its penalty stroke
// counted already (course.js settle), so `strokes` (more to add) is 0 and
// `pens` the one it costs: where it can be played from, as reliefOptions
// gives them -
//   back     stroke and distance (17.1d(1)): where it was played from
//   line     back on the line (17.1d(2)): the hole, where it last crossed
//            into the area, and back from there as far as wanted
//   lateral  a red area only (17.1d(3)): within two club-lengths of that
//            crossing, no nearer the hole
// Never back in the water (that area or another). crossed: [x, z] where it
// last crossed onto it; area: "yellow" | "red"; from, fromLie as
// reliefOptions has them.
export function penaltyOptions(hole, { crossed, area = "yellow", from = null, fromLie = null }) {
  const index = hole.treeIndex?.();
  const out = [];
  const red = area === "red";
  if (from) out.push({ kind: "back", strokes: 0, pens: 1, ball: [...from], lie: fromLie ?? hole.lieAt(from[0], from[1]), back: null, clear: null, ref: [...from], keep: "any" });
  const line = lineSpot(hole, crossed, index, { keep: KEEP.any });
  if (line) out.push({ kind: "line", strokes: 0, pens: 1, ball: line.at, lie: line.lie, back: line.back, clear: line.clear ?? null, ref: [...crossed], keep: "any" });
  if (red) {
    const lateral = bestOf(hole, besideSpots(hole, crossed, index, KEEP.any), index);
    if (lateral) out.push({ kind: "lateral", strokes: 0, pens: 1, ball: lateral.at, lie: lateral.lie, back: null, clear: lateral.clear ?? null, ref: [...crossed], keep: "any" });
  }
  return out.map((o) => ({ ...o, water: area, ...reliefWords(hole, o, { ball: crossed, water: area }) }));
}

// Which way a drop beside the ball went, looking at the hole from it.
function sideOf(hole, ball, at) {
  const fx = hole.cup.x - ball[0];
  const fz = hole.cup.z - ball[1];
  const cross = fx * (at[1] - ball[1]) - fz * (at[0] - ball[0]);
  return Math.abs(cross) < 0.05 * Math.hypot(fx, fz) ? "behind" : cross > 0 ? "right" : "left";
}

// The words for a choice: { title, detail, done } - "Back to the tee",
// "412 yds to go"; done for the message once taken.
export function reliefWords(hole, o, { ball, sand = false, water = null } = {}) {
  const lie = o.lie === "tee" ? "the tee" : (LIE_NAMES[o.lie] ?? o.lie).toLowerCase();
  const yards = Math.round(distanceToPin(hole, o.ball) / YARD);
  const way = o.clear === false ? ", trees in the way" : o.clear ? ", a clear way" : "";
  const n = Number.isFinite(o.back) ? Math.max(1, Math.round(o.back / YARD)) : null;
  const back = n == null ? "" : `${n} yd${n === 1 ? "" : "s"} back`;
  const pens = (o.pens ?? o.strokes) === 2 ? "two penalty strokes" : "one penalty stroke";
  if (water && o.kind === "line") {
    return { title: "Back on the line", detail: `${back} from where it went in, ${lie}${way}`, done: `dropped back on the line, ${back} - ${pens}` };
  }
  if (o.kind === "lateral") {
    const side = ball ? sideOf(hole, ball, o.ball) : "";
    const where = side === "behind" ? "behind it" : side ? `to the ${side}` : "beside it";
    return { title: "Within two club-lengths of where it went in", detail: `${cap(where)}, ${lie}${way}`, done: `dropped within two club-lengths of where it went in - ${pens}` };
  }
  if (o.kind === "back") {
    const title = o.lie === "tee" ? "Back to the tee" : "Back where you played from";
    return { title, detail: `${o.lie === "tee" ? "" : `${cap(lie)}, `}${yards} yds to go`, done: `${o.lie === "tee" ? "back to the tee" : "back where it was played from"} - ${pens}` };
  }
  if (o.kind === "line") {
    return { title: sand ? "Back on the line, in the bunker" : "Back on the line", detail: `${back}, ${lie}${way}`, done: `dropped back on the line, ${back} - ${pens}` };
  }
  if (o.kind === "outside") {
    return { title: "Out of the bunker, back on the line", detail: `${back}, ${lie}${way} - two strokes`, done: `dropped out of the bunker, back on the line - ${pens}` };
  }
  const side = ball ? sideOf(hole, ball, o.ball) : "";
  const where = side === "behind" ? "behind it" : side ? `to the ${side}` : "beside it";
  return { title: sand ? "Two club-lengths, in the bunker" : "Within two club-lengths", detail: `${cap(where)}, ${lie}${way}`, done: `dropped within two club-lengths, ${where} - ${pens}` };
}

const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// Where the camera goes to show the drops (course.js): low down, behind
// them and round to the right of the line from the hole, so marks along
// the line don't stand behind one another and fall to the left of the
// ball - and far enough back that all of them fit in the left part of the
// picture, clear of the card on its right.
//   spots       [x, z] of the ball and the drops to show (hole frame)
//   cup         [x, z] of the hole
//   halfWidth   half the picture's width as an angle (radians)
//   behind, side  how far behind the spots to start (metres) and how far
//               round to the right of the line (radians)
// Returns { cam: [x, z], look: [x, z] }, the look point as far off as the
// spots' middle. Angles are positive to the right (towards +z, looking
// down +x).
export function dropsView({ spots, cup, halfWidth, behind = 7, side = 0.45 }) {
  const n = spots.length;
  const cx = spots.reduce((a, q) => a + q[0], 0) / n;
  const cz = spots.reduce((a, q) => a + q[1], 0) / n;
  const toCup = Math.atan2(cup[1] - cz, cup[0] - cx);
  const heading = toCup - side;
  const hx = Math.cos(heading);
  const hz = Math.sin(heading);
  const spread = Math.max(1, ...spots.map((q) => Math.hypot(q[0] - cx, q[1] - cz)));
  // The spots between the left edge and a little left of the middle.
  const room = halfWidth * 0.85;
  let d = behind + spread;
  let lo = 0;
  let hi = 0;
  for (let i = 0; i < 8; i++) {
    const px = cx - hx * d;
    const pz = cz - hz * d;
    const angles = spots.map((q) => {
      let a = Math.atan2(q[1] - pz, q[0] - px) - heading;
      while (a > Math.PI) a -= 2 * Math.PI;
      while (a < -Math.PI) a += 2 * Math.PI;
      return a;
    });
    lo = Math.min(...angles);
    hi = Math.max(...angles);
    if (hi - lo <= room) break;
    d *= ((hi - lo) / room) * 1.15;
  }
  const cam = [cx - hx * d, cz - hz * d];
  // Turned so the spots' middle sits left of the picture's middle.
  const yaw = heading + (lo + hi) / 2 + halfWidth * 0.45;
  return { cam, look: [cam[0] + Math.cos(yaw) * d, cam[1] + Math.sin(yaw) * d] };
}

// How many trees stand in the way of a camera at `cam` looking at
// `target` ([x, z], hole frame): the camera inside a trunk, or the
// straight line to the target passing through one. trees: [{ x, z, r }]
// (hole frame; r the crown's reach - a trunk is taken as a fraction of
// it). A tree right by the target (the ball lying against it) doesn't
// count: it's what's being looked at.
export function treesInView(cam, target, trees) {
  let n = 0;
  const dx = target[0] - cam[0];
  const dz = target[1] - cam[1];
  const len2 = dx * dx + dz * dz || 1;
  for (const t of trees) {
    const trunk = Math.max(0.6, t.r * 0.18);
    if (Math.hypot(t.x - target[0], t.z - target[1]) < trunk + 1.5) continue;
    if (Math.hypot(t.x - cam[0], t.z - cam[1]) < Math.max(1.2, t.r * 0.45)) {
      n += 2;
      continue;
    }
    const k = Math.max(0, Math.min(1, ((t.x - cam[0]) * dx + (t.z - cam[1]) * dz) / len2));
    if (Math.hypot(t.x - cam[0] - dx * k, t.z - cam[1] - dz * k) < trunk) n++;
  }
  return n;
}

// dropsView's camera tried round the drops - either side of the line,
// further round, nearer and further back - for one with no tree in the
// way of the ball; failing that the one with fewest.
export function clearDropsView({ spots, cup, halfWidth, trees = [], behind = 7, side = 0.45 }) {
  let best = null;
  for (const b of [behind, behind + 5, behind - 3]) {
    for (const s of [side, -side, side * 2, -side * 2, side * 0.4, -side * 0.4, side * 3, -side * 3]) {
      const v = dropsView({ spots, cup, halfWidth, behind: Math.max(3, b), side: s });
      const n = treesInView(v.cam, spots[0], trees);
      if (n === 0) return v;
      if (!best || n < best.n) best = { ...v, n };
    }
  }
  return { cam: best.cam, look: best.look };
}
