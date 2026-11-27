// What the course plan (sim/courseplan.mjs) holds beside its holes and
// shapes (the owner, 25 November 2026, "Do 1 to 4 please"):
//
//   card    the club's scorecard, pasted in (sim/course.mjs parseScorecard):
//           [{ par, yards, si }] by number - each hole set beside its card,
//           the suggestion led by it (sim/holefinder.mjs), and its pars and
//           stroke indexes built onto the holes;
//   sets    on a hole, which of its tee boxes are the White and the Red
//           ({ white: [x, z], red: [x, z] }, a box's middle): the Yellow is
//           the box its line starts on, as in the game (sim/tees.mjs: the
//           White behind it, the Red in front) - built as the hole's
//           layout.teeAt, as tools/realcourse.mjs sets a real course's;
//   burns   a burn drawn along its line ({ line, width, bridges: [{ from,
//           to }] }): built as the real links' stone-walled channel
//           (sim/burn.mjs), with a bridge wherever one of the map's paths
//           crosses it and wherever the player puts one.
//
// Pure, in the plan's metres (east and north of its origin).

import { insidePolygon, distanceToEdge, polygonCentroid } from "./terrain.mjs";
import { YARD } from "./flight.mjs";

const r2 = (v) => Math.round(v * 100) / 100;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const lineLength = (line) => line.reduce((s, p, i) => (i ? s + dist(line[i - 1], p) : 0), 0);
const pts = (l) => Array.isArray(l) && l.every((q) => Array.isArray(q) && q.length === 2 && q.every(Number.isFinite));
const spot = (p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite);

// ---- The card -------------------------------------------------------------------------

// A hole this far off its card's yards (a share) is flagged.
export const CARD_OFF = 0.05;

// A card as a plan keeps it: up to 18 holes, each { par 3 - 6, yards, si
// 1 - 18 or null }; anything else is null.
export function cleanCard(card) {
  if (!Array.isArray(card)) return null;
  const out = card.slice(0, 18).map((c) => ({
    par: [3, 4, 5, 6].includes(c?.par) ? c.par : null,
    yards: Number.isFinite(c?.yards) && c.yards >= 40 && c.yards <= 900 ? Math.round(c.yards) : null,
    si: Number.isInteger(c?.si) && c.si >= 1 && c.si <= 18 ? c.si : null,
  }));
  return out.some((c) => c.par || c.yards) ? out : null;
}

export function setCard(plan, card) {
  const clean = cleanCard(card);
  const { card: _old, ...rest } = plan;
  return clean ? { ...rest, card: clean } : rest;
}

// Hole `i` set beside its card: { yards, par, si, off (a share, + long, -
// short), long (more than CARD_OFF off), wrongPar (its par set by hand,
// not the card's: otherwise it's built with the card's) } - or null with
// no card for it.
export function besideCard(plan, i, length) {
  const c = plan.card?.[i];
  if (!c) return null;
  const yards = length / YARD;
  const off = c.yards ? (yards - c.yards) / c.yards : 0;
  const own = plan.holes[i]?.par ?? null;
  return { yards: c.yards, par: c.par, si: c.si, off: Math.round(off * 1000) / 1000, long: Math.abs(off) > CARD_OFF, wrongPar: !!c.par && own != null && own !== c.par };
}

// The card for the holes not kept (their numbers, in order), for the
// suggestion to fill: kept holes keep their numbers (courseplan.mjs
// suggestRest).
export function cardFor(card, keptNumbers, most = 18) {
  if (!card?.length) return null;
  const out = [];
  for (let n = 0; n < most; n++) if (!keptNumbers.has(n)) out.push(card[n] ?? { par: null, yards: null, si: null });
  return out;
}

// ---- Tee sets -------------------------------------------------------------------------

export const TEE_SETS = ["white", "yellow", "red"];
// Where the game takes a named box (sim/tees.mjs NAMED_REACH, NAMED_SIDE):
// this far along the line from the Yellow at most, this far to its side.
export const SET_REACH = { along: 120, side: 40 };

// Along and across a hole's first stretch, from its tee.
function alongHole(hole, p) {
  const [a, b] = hole.line;
  const len = dist(a, b) || 1;
  const d = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
  return { u: (p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1], v: Math.abs((p[0] - a[0]) * -d[1] + (p[1] - a[1]) * d[0]) };
}

// Whether a box's middle can be a hole's White (behind its Yellow) or Red
// (in front of it).
export function setFits(hole, colour, at) {
  if (colour === "yellow") return true;
  const { u, v } = alongHole(hole, at);
  if (v > SET_REACH.side || Math.abs(u) > SET_REACH.along) return false;
  return colour === "white" ? u < -2 : colour === "red" ? u > 2 : false;
}

// The colour of tee box `box` (its outline) on hole `hole`: "yellow" where
// the line starts on it, "white" or "red" where the hole's set says, else
// null.
const onBox = (p, box) => spot(p) && (insidePolygon(box, p[0], p[1]) || distanceToEdge(box, p[0], p[1]) < 1);
export function boxColour(hole, box) {
  if (onBox(hole.line[0], box)) return "yellow";
  if (onBox(hole.sets?.white, box)) return "white";
  if (onBox(hole.sets?.red, box)) return "red";
  return null;
}

// A hole's White and Red kept only where they still fit (behind and in
// front of its Yellow).
function fitSets(hole) {
  const sets = {};
  for (const c of ["white", "red"]) if (spot(hole.sets?.[c]) && setFits(hole, c, hole.sets[c])) sets[c] = hole.sets[c];
  const { sets: _old, ...rest } = hole;
  return Object.keys(sets).length ? { ...rest, sets } : rest;
}

// Tee box `box` (an outline) of hole `i` given the next colour it can be:
// none - White - Red - Yellow, skipping what it can't be (the White only
// behind the Yellow, the Red in front). The Yellow is last and can't be
// taken off - every hole has one: making another box the Yellow moves the
// line's start onto it, and the old one's box is no colour. Returns {
// plan, colour }.
export function cycleTee(plan, i, box) {
  const h = plan.holes[i];
  if (!h || !Array.isArray(box) || box.length < 3) return { plan, colour: null };
  const now = boxColour(h, box);
  if (now === "yellow") return { plan, colour: "yellow" };
  const at = polygonCentroid(box).map(r2);
  const order = [null, "white", "red", "yellow"];
  let next = null;
  for (let k = 1; k <= order.length; k++) {
    const c = order[(order.indexOf(now) + k) % order.length];
    if (c === null || setFits(h, c, at)) {
      next = c;
      break;
    }
  }
  const sets = { ...(h.sets ?? {}) };
  for (const c of ["white", "red"]) if (onBox(sets[c], box)) delete sets[c];
  let hole = { ...h, sets, set: true };
  if (next === "white" || next === "red") hole.sets = { ...sets, [next]: at };
  if (next === "yellow") hole = { ...hole, line: [at, ...h.line.slice(1)] };
  hole = fitSets(hole);
  return { plan: { ...plan, holes: plan.holes.map((x, k) => (k === i ? hole : x)) }, colour: next };
}

export function cleanSets(sets) {
  if (!sets || typeof sets !== "object") return null;
  const out = {};
  for (const c of ["white", "red"]) if (spot(sets[c])) out[c] = sets[c];
  return Object.keys(out).length ? out : null;
}

// ---- Burns and bridges ------------------------------------------------------------------

// A burn's width (metres): the real links' is 2.8 m.
export const BURN_WIDTHS = { 2: "Narrow", 2.8: "Usual", 4: "Wide" };
export const BURN_WIDTH = 2.8;
// A bridge: its deck this wide, and reaching this far onto each bank.
export const BRIDGE = { width: 2.4, bank: 2.5, most: 40 };

export function addBurn(plan, line, width = BURN_WIDTH) {
  if (!pts(line) || line.length < 2 || lineLength(line) < 10) return plan;
  return { ...plan, burns: [...(plan.burns ?? []), { line: line.map((p) => p.map(r2)), width: burnWidth(width), bridges: [] }] };
}

const burnWidth = (w) => (Number.isFinite(w) ? Math.min(6, Math.max(1, w)) : BURN_WIDTH);

export function removeBurn(plan, i) {
  return { ...plan, burns: (plan.burns ?? []).filter((_, k) => k !== i) };
}

export function setBurnWidth(plan, i, width) {
  if (!plan.burns?.[i]) return plan;
  return { ...plan, burns: plan.burns.map((b, k) => (k === i ? { ...b, width: burnWidth(width) } : b)) };
}

// The nearest point on a line to `p`: { at, d, way (unit) }.
function nearestOn(line, p) {
  let best = { d: Infinity, at: line[0], way: [1, 0] };
  for (let k = 1; k < line.length; k++) {
    const a = line[k - 1];
    const b = line[k];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const l2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / l2));
    const q = [a[0] + dx * t, a[1] + dz * t];
    const d = dist(p, q);
    if (d < best.d) best = { d, at: q, way: [dx / Math.sqrt(l2), dz / Math.sqrt(l2)] };
  }
  return best;
}

// The burn at a spot (its index), within `near` metres; -1.
export function burnAt(plan, at, near = 8) {
  let best = -1;
  let bd = near;
  (plan.burns ?? []).forEach((b, i) => {
    const d = nearestOn(b.line, at).d;
    if (d < bd) {
      bd = d;
      best = i;
    }
  });
  return best;
}

// A bridge straight across a burn where it's tapped (the nearest point on
// its line), its deck reaching BRIDGE.bank onto either bank.
export function addBridge(plan, i, at) {
  const b = plan.burns?.[i];
  if (!b) return plan;
  const n = nearestOn(b.line, at);
  const half = b.width / 2 + BRIDGE.bank;
  const across = [-n.way[1], n.way[0]];
  const from = [n.at[0] - across[0] * half, n.at[1] - across[1] * half].map(r2);
  const to = [n.at[0] + across[0] * half, n.at[1] + across[1] * half].map(r2);
  return { ...plan, burns: plan.burns.map((x, k) => (k === i ? { ...x, bridges: [...x.bridges, { from, to }] } : x)) };
}

export function removeBridges(plan, i) {
  if (!plan.burns?.[i]) return plan;
  return { ...plan, burns: plan.burns.map((x, k) => (k === i ? { ...x, bridges: [] } : x)) };
}

// Where two lines cross: [{ at, a (unit way of the first there), b (of
// the second) }].
function crossingsOf(A, B) {
  const out = [];
  for (let i = 1; i < A.length; i++) {
    for (let j = 1; j < B.length; j++) {
      const [p, p2, q, q2] = [A[i - 1], A[i], B[j - 1], B[j]];
      const r = [p2[0] - p[0], p2[1] - p[1]];
      const s = [q2[0] - q[0], q2[1] - q[1]];
      const den = r[0] * s[1] - r[1] * s[0];
      if (Math.abs(den) < 1e-9) continue;
      const t = ((q[0] - p[0]) * s[1] - (q[1] - p[1]) * s[0]) / den;
      const u = ((q[0] - p[0]) * r[1] - (q[1] - p[1]) * r[0]) / den;
      if (t < 0 || t > 1 || u < 0 || u > 1) continue;
      const rl = Math.hypot(...r) || 1;
      const sl = Math.hypot(...s) || 1;
      out.push({ at: [p[0] + r[0] * t, p[1] + r[1] * t], a: [r[0] / rl, r[1] / rl], b: [s[0] / sl, s[1] / sl] });
    }
  }
  return out;
}

// Every bridge over a burn: the player's, and one wherever a path of the
// map (`paths`: lines in the plan's metres) crosses it - its deck along
// the path, long enough to reach BRIDGE.bank past both banks however
// slant it crosses (to BRIDGE.most at most). [{ from, to, path: true? }].
export function bridgesOf(burn, paths = []) {
  const out = (burn.bridges ?? []).map((b) => ({ from: b.from, to: b.to }));
  for (const line of paths) {
    if (!pts(line) || line.length < 2) continue;
    for (const c of crossingsOf(burn.line, line)) {
      // A bridge put there by hand already.
      if (out.some((b) => dist(b.from, c.at) + dist(b.to, c.at) < dist(b.from, b.to) + 1)) continue;
      const sin = Math.abs(c.a[0] * c.b[1] - c.a[1] * c.b[0]);
      const half = Math.min(BRIDGE.most / 2, (burn.width / 2) / Math.max(0.25, sin) + BRIDGE.bank);
      out.push({ from: [c.at[0] - c.b[0] * half, c.at[1] - c.b[1] * half].map(r2), to: [c.at[0] + c.b[0] * half, c.at[1] + c.b[1] * half].map(r2), path: true });
    }
  }
  return out;
}

export function cleanBurns(burns) {
  if (!Array.isArray(burns)) return [];
  return burns
    .filter((b) => pts(b?.line) && b.line.length >= 2)
    .slice(0, 12)
    .map((b) => ({
      line: b.line,
      width: burnWidth(b.width),
      bridges: (Array.isArray(b.bridges) ? b.bridges : []).filter((x) => spot(x?.from) && spot(x?.to) && dist(x.from, x.to) >= 1 && dist(x.from, x.to) <= BRIDGE.most).map((x) => ({ from: x.from, to: x.to })),
    }));
}
