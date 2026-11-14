// Hand edits to a hole (sim/holeedits.mjs): checking each edit and laying
// the list on the layout (applyEdits, withEdits, addEdit) - fairway edges,
// brooks and cart paths included.

import { liveLock, REGROW } from "../treelock.mjs";
import { groundEdited, validGroundEdit, GROUND_KINDS } from "../groundedit.mjs";
import { brookShape, validBrook, validBank, brookAt, brookLine, brookBed, BROOK_KINDS, BROOK_LENGTH } from "../brooks.mjs";
import { blobOutline, insideBlob, makePath, nearest, fairwayHalfWidth, wildWater, firstCutWidth, deepRoughFrom, EDGE_STEP, EDGE_FROM, EDGE_MARKS, fitGreenTilt, potBunker, isPot, restyleBunker } from "../course.mjs";
import { greenHeight } from "../putting.mjs";
import { TREE_KINDS } from "../lidartrees.mjs";
import { MOST_SHAPES } from "../treeshapes.mjs";
import { validSculpt, gridFromEdit, sculptCovers } from "../greensculpt.mjs";
import { validWall, cleanWall } from "../walls.mjs";
import { validPath, cleanPath, pathFits, pathAt, nearestOnPath, generatePath, gapToPaths, pathSeed, isLink, TREE_GAP, MAX_POINTS } from "../paths.mjs";
import { clamp } from "../mathutil.mjs";
import { DECOR, decorKind, decorTrees } from "../decor.mjs";
import { ADDED_CLEAR, BUMP, BUNKER_RESTYLES, DEPTHS, HANDLES, JOIN_REACH, MAX_BUMPS, MAX_EDITS, SIZES, TILTS, r2 } from "./common.mjs";
import { greenPoly, inBox, insideDepth, moveShape, newShape, pondGivesWay, reshapeShape, scaleShape, shapeAt, shapeBounds, shapeFits } from "./shapes.mjs";
import { crownOf, treeAt, treeSpotOk } from "./trees.mjs";
import { offCauseways, CAUSEWAY } from "../causeway.mjs";
import { DEFAULT_GREEN, pinOnGreen, reshapeGreen, tiltContour } from "./green.mjs";
import { fairwayAnchor, fairwayAt, onTheLine, sizeFairway, widenFairway } from "./fairway.mjs";
import { gapTo, greenGrid, joinBunker } from "./ground.mjs";

// ---- Applying the edits -----------------------------------------------------------

// (a: a fairway added by hand to a designed hole - the owner, 22 October
// 2026: "I couldn't create a second fairway... a fairway at the front and
// a fairway at the back" - layout.extraFairways.)
const SHAPE_EDITS = { b: "bunkers", "b+": "bunkers", "b-": "bunkers", w: "water", "w+": "water", "w-": "water", a: "extraFairways", "a+": "extraFairways", "a-": "extraFairways" };
const SHAPE_KINDS = { bunkers: "bunker", water: "water", extraFairways: "fairway" };
// How near a bend (metres) a press on a path picks the bend.
export const BEND_REACH = 0.4;

// Is an edit well formed? The designer only ever writes good ones, but a
// course file can be edited by hand or damaged, and a bad number must not
// wreck a hole (or stop it being played): an edit that isn't is left out.
const fin = (v) => typeof v === "number" && Number.isFinite(v);
const spot = (p) => Array.isArray(p) && p.length >= 2 && fin(p[0]) && fin(p[1]);
const spots = (ps) => Array.isArray(ps) && ps.length > 0 && ps.every(spot);
const treeKind = (k) => Number.isInteger(k) && k >= 0 && k < TREE_KINDS.length;
// The most spots one edit can carry: a planting of trees (an editor's
// stroke plants a few dozen), a fairway edge's line. A damaged file's or
// another PC's edit of 20,000 took the hole seconds to make.
export const MOST_SPOTS = 400;
export const MOST_EDGE = 200;
// How far from the hole's line an edit can be (metres): well past its trees
// and its neighbours, nowhere near a kilometre off.
export const EDIT_REACH = 400;

// Whether an edit's spots are on or around the hole: within EDIT_REACH of
// its box (its line and green).
function nearHole(e, box) {
  const ok = (q) => Array.isArray(q) && q[0] >= box.x0 && q[0] <= box.x1 && q[1] >= box.z0 && q[1] <= box.z1;
  if (Array.isArray(e.p) && !e.p.every(ok)) return false;
  if (e.at != null && !ok(e.at)) return false;
  return true;
}
function holeBox(base) {
  const pts = [...(Array.isArray(base.path) ? base.path : []), ...(base.green ? [[base.green.x, base.green.z]] : [])].filter((q) => Array.isArray(q) && fin(q[0]) && fin(q[1]));
  if (!pts.length) return { x0: -Infinity, x1: Infinity, z0: -Infinity, z1: Infinity };
  const xs = pts.map((q) => q[0]);
  const zs = pts.map((q) => q[1]);
  return { x0: Math.min(...xs) - EDIT_REACH, x1: Math.max(...xs) + EDIT_REACH, z0: Math.min(...zs) - EDIT_REACH, z1: Math.max(...zs) + EDIT_REACH };
}

export function validEdit(e) {
  if (!e || typeof e !== "object") return false;
  switch (e.k) {
    case "t+":
      return spots(e.p) && e.p.length <= MOST_SPOTS && e.p.every((q) => q[2] == null || fin(q[2])) && (e.kind == null || treeKind(e.kind)) && (e.w == null || (fin(e.w) && e.w >= 0.5 && e.w <= 2));
    case "tk":
      return spots(e.p) && (e.kind === null || treeKind(e.kind));
    case "tv":
      return spots(e.p) && (e.shape === null || (Number.isInteger(e.shape) && e.shape >= 0 && e.shape < MOST_SHAPES));
    case "t-":
      return spots(e.p);
    case "d+":
      return spots(e.p) && e.p.every((q) => q[2] == null || fin(q[2])) && decorKind(e.kind);
    case "d-":
      return spots(e.p);
    case "dm":
      return spots(e.p) && spot(e.d);
    case "tm":
      return spots(e.p) && spot(e.d);
    case "ts":
      return spots(e.p) && fin(e.f) && e.f > 0;
    case "b":
    case "w":
    case "a":
      return (
        spot(e.at) &&
        (e.d == null || spot(e.d)) &&
        (e.f == null || (fin(e.f) && e.f > 0)) &&
        (e.dig == null || fin(e.dig)) &&
        (e.join == null || (e.k === "b" && (e.join === 0 || e.join === 1))) &&
        (e.wall == null || e.wall === 0 || (e.k !== "a" && validWall(e.wall))) &&
        (e.dig == null || e.k !== "a") &&
        // A pond's or an added fairway's marks (course.mjs EDGE_MARKS): a
        // size for each.
        (e.h == null || (e.k !== "b" && Array.isArray(e.h) && e.h.length === EDGE_MARKS && e.h.every((v) => fin(v) && v > 0)))
      );
    case "b+":
    case "b-":
    case "w+":
    case "w-":
    case "a+":
    case "a-":
      return spot(e.at);
    case "g":
      return Array.isArray(e.h) && e.h.length === HANDLES && e.h.every(fin) && fin(e.f) && e.f > 0;
    case "pin":
      return spot(e.p);
    case "tilt":
      return fin(e.a) && Number.isInteger(e.n);
    case "bump":
      return spots(e.p) && fin(e.a);
    case "fw":
      return fin(e.f) && e.f > 0;
    case "edge":
      return EDGE_BANDS.includes(e.band) && spots(e.p) && e.p.length <= MOST_EDGE && (e.smooth === 1 ? e.a == null : fin(e.a) && Math.abs(e.a) <= 20) && fin(e.r) && e.r >= 3 && e.r <= 60;
    case "fwn":
      return e.on === 0 || e.on === 1;
    case "cw":
      // An island green's causeway shaped by hand (sim/causeway.mjs
      // causewayLook): its width, its ends' flare, the spot it's aimed at.
      return fin(e.w) && e.w >= CAUSEWAY.widths[0] && e.w <= CAUSEWAY.widths[1] && fin(e.e) && e.e >= CAUSEWAY.ends[0] && e.e <= CAUSEWAY.ends[1] && (e.to == null || spot(e.to));
    case "pots":
      return e.on === 1;
    case "tg":
      return e.on === 1;
    case "sig":
      // Its signature tree taken away (0) or back (1): sim/signaturetree.mjs.
      return e.on === 0 || e.on === 1;
    case "bstyle":
      return BUNKER_RESTYLES.includes(e.s);
    case "lk":
      return ["", "dunes", "green"].includes(e.look);
    case "f":
      return spot(e.at) && fin(e.f) && e.f > 0;
    case "f-":
      return spot(e.at);
    case "gh":
      return validSculpt(e);
    case "p+":
      return Array.isArray(e.p) && e.p.length >= 2 && e.p.length <= MAX_POINTS && e.p.every(spot) && (e.m == null || [0, 1, 2].includes(e.m));
    case "p-":
      return spot(e.at);
    case "p": {
      if (!spot(e.at)) return false;
      const ways = [e.d != null, e.add === 1, e.drop === 1, e.m != null].filter(Boolean).length;
      return ways === 1 && (e.d == null || spot(e.d)) && (e.m == null || [0, 1, 2].includes(e.m)) && (e.all == null || e.all === 1);
    }
    case "pa":
      return [-1, 0, 1].includes(e.s);
    case "r+":
      return validBrook({ p: e.p, kind: e.kind, w: e.w });
    case "r-":
      return spot(e.at);
    case "r":
      return (
        spot(e.at) &&
        (e.p == null || validBrook({ p: e.p })) &&
        (e.kind == null || (Number.isInteger(e.kind) && e.kind >= 0 && e.kind < BROOK_KINDS.length)) &&
        (e.w == null || fin(e.w)) &&
        (e.banks == null || (Array.isArray(e.banks) && e.banks.every(validBank))) &&
        (e.p != null || e.kind != null || e.w != null || e.banks != null)
      );
    case "gr":
    case "gt":
    case "gs":
      return validGroundEdit(e);
    default:
      return false;
  }
}

// What the "say how it is now" edits say: the green's shape, the tilt, the
// fairway's width, the pin. For the designer's buttons as well. Values out
// of range are brought back into it.
export function editState(edits = []) {
  const last = (k) => {
    for (let i = edits.length - 1; i >= 0; i--) if (edits[i]?.k === k && validEdit(edits[i])) return edits[i];
    return null;
  };
  const g = last("g");
  const tilt = last("tilt");
  return {
    green: g ? { h: g.h.map((v) => clamp(v, 0.5, 1.7)), f: clamp(g.f, 0.5, 1.8) } : DEFAULT_GREEN,
    greenEdited: !!g,
    tilt: tilt ? { a: tilt.a, n: clamp(tilt.n, 0, TILTS.length - 1) } : { a: 0, n: 0 },
    fw: last("fw")?.f ?? 1,
    pin: last("pin")?.p ?? null,
    sculpt: last("gh"),
  };
}

// The layout with its edits laid on. Worked out once per layout object.
const done = new WeakMap();
export function withEdits(layout) {
  if (!layout?.edits?.length) return layout;
  let out = done.get(layout);
  if (!out) {
    out = applyEdits(layout, layout.edits);
    done.set(layout, out);
  }
  return out;
}

// Does a reshaped green leave the hole's sand and water alone? Not over any
// water that can't give way to it (a brook, a pond with a wall:
// pondGivesWay), and not over a bunker's middle or more of its edge than a
// bunker may cover (see shapeFits) - more than it did before, anyway, for a
// bunker that was already that close.
function greenFits(L, before) {
  const g = greenPoly(L);
  const g0 = greenPoly(before);
  if (L.water.some((w) => !pondGivesWay(w) && (insideDepth(L.green, w.x, w.z) > 0 || g.some(([x, z]) => insideDepth(w, x, z) > 0)))) return false;
  // Nor up to a cart path (which keeps a couple of metres off the green).
  if ((L.paths ?? []).some((p) => validPath(p) && !pathFits({ ...L, bunkers: [], water: [], tees: [] }, p))) return false;
  for (const b of L.bunkers) {
    if (insideDepth(L.green, b.x, b.z) > 0) return false;
    const share = (pts) => pts.filter(([x, z]) => insideDepth(b, x, z) > 0).length / pts.length;
    if (share(g) > Math.max(0.25, share(g0) + 0.02)) return false;
  }
  return true;
}

// Applies a list of edits to a layout; returns a new layout (without an
// edits list: it is the result). Also on it, for play and the designer:
//   applied    per edit, whether it did anything (false: left out)
//   handTrees  [x, z, crown] for trees planted or moved by hand, whose
//              ground plays as trees
//   clearedCrowns  [x, z, crown] where real (LiDAR) trees were taken away,
//              whose ground no longer does
// A reshaped green goes on only if it keeps clear of the sand and water as
// they end up, and doesn't stop any other change from fitting (a pond put
// in by hand, say): otherwise the green stays as it was and its edit is
// left out.
export function applyEdits(base, edits = []) {
  const state = editState(edits);
  if (!state.greenEdited) return applyOnce(base, edits, state, false);
  const kept = applyOnce(base, edits, state, false);
  const grown = applyOnce(base, edits, state, true);
  const lost = edits.some((e, i) => e?.k !== "g" && kept.applied[i] && !grown.applied[i]);
  if (!lost && greenFits(grown, kept)) return grown;
  kept.applied = kept.applied.map((ok, i) => (edits[i]?.k === "g" ? false : ok));
  return kept;
}

function applyOnce(base, edits, state, reshape) {
  const path = makePath(base.path);
  // (A layout missing a list - a damaged file - has none of that.)
  const L = { ...base, bunkers: (base.bunkers ?? []).slice(), water: (base.water ?? []).slice(), extraFairways: (base.extraFairways ?? []).slice(), trees: (base.trees ?? []).slice(), decor: (base.decor ?? []).slice(), paths: (base.paths ?? []).filter((p) => validPath(p) && !isLink(p)) };
  // (The paths between holes, if it has them to play: put back once its own
  // edits are done - those work on its own paths alone.)
  const links = (base.paths ?? []).filter(isLink);
  delete L.edits;
  const applied = [];
  const hand = new Set(); // trees placed by hand
  const cleared = [];
  const handShapes = new Set();
  const handPaths = new Set(); // paths put in or changed by hand
  const realTrees = base.source === "map" && base.treesFrom === "lidar";
  const isReal = (t) => realTrees && t[3] != null && !hand.has(t);

  // The ground of the whole hole raised, lowered, tilted or smoothed
  // (groundedit.mjs): first, so everything else lies on it as it ends up.
  // Only a hole with ground of its own (from the map, or given hills).
  const ground = base.terrain ? groundEdited(base.terrain, edits, { length: base.length ?? path.length ?? 1 }) : { terrain: null, applied: new Set() };
  if (ground.applied.size) L.terrain = ground.terrain;

  // The green, then the pin on it: first, so every other edit is checked
  // against the green as it ends up.
  if (reshape) L.green = reshapeGreen(base.green, state.green);
  if (reshape || state.pin) L.pin = pinOnGreen(L.green, state.pin ?? base.pin, 1.2);
  // The cup is never put in sand or water.
  let pinOk = true;
  if (state.pin && [...L.bunkers, ...L.water].some((s) => insideDepth(s, L.pin[0], L.pin[1]) > -0.5)) {
    pinOk = false;
    L.pin = reshape ? pinOnGreen(L.green, base.pin, 1.2) : base.pin;
  }

  // The green shaped in detail: checked it can be read now, and that it
  // still lies over the green (a designed hole made longer moves its green
  // well away; the designer then asks before letting it go). Laid on once
  // the sand and water round it are where they end up.
  const sculpt = state.sculpt && gridFromEdit(state.sculpt) && sculptCovers(state.sculpt, L.green) ? state.sculpt : null;

  // The fairways of a hole from a map or on hills, each made narrower or
  // wider on its own or taken away ("f", "f-") as the edits come, so what
  // follows (trees) finds them as they are by then; each found by its spot
  // as it was made. `old`: an older "fw", for the hole's own fairway along
  // its line, laid on once all the edits are.
  const fairways = base.source === "map" ? (base.fairways ?? []) : [];
  const sized = new Map();
  const gone = new Set();
  const fairwaysNow = (old = 1) => {
    const keep = fairways.map((_, i) => i).filter((i) => !gone.has(i));
    L.fairways = keep.map((i) => (sized.has(i) ? sizeFairway(fairways[i], sized.get(i)) : old !== 1 && onTheLine(fairways[i], path) ? widenFairway(fairways[i], path, old) : fairways[i]));
    L.fairwayAt = keep.map((i) => fairwayAnchor(fairways[i]));
  };

  const box = holeBox(base);
  for (const e of edits) {
    if (!validEdit(e) || !nearHole(e, box)) {
      applied.push(false);
      continue;
    }
    let ok = true;
    const list = SHAPE_EDITS[e.k];
    const kind = SHAPE_KINDS[list];
    // (Fairways added by hand on a designed hole only: a map's fairways are
    // its own outlines, "f".)
    if (list === "extraFairways" && base.source === "map") ok = false;
    else if (list) {
      const shapes = L[list];
      if (e.k.length === 1) {
        const i = shapeAt(shapes, e.at);
        if (i < 0) ok = false;
        else {
          // One drawn onto the green (joinBunker) is worked on as it was
          // before, and drawn onto it again where it ends up.
          let s = shapes[i].free ? { ...shapes[i].free } : shapes[i];
          // (A brook is changed by its line, not as a pond is: "r".)
          if (s.brook && (e.d || e.f || e.h || e.wall != null)) ok = false;
          if (ok && e.d) s = moveShape(s, e.d[0], e.d[1]);
          if (e.f) {
            const [lo, hi] = SIZES[kind];
            const big = Math.max(s.rx, s.rz) * e.f;
            if ((e.f > 1 && big > hi) || (e.f < 1 && big < lo)) ok = false;
            else s = scaleShape(s, e.f);
          }
          // Reshaped by its marks: pulled in or pushed out round its edge
          // (shapes.mjs reshapeShape).
          if (ok && e.h) s = reshapeShape(s, e.h);
          if (e.dig != null) {
            s = { ...s };
            const dig = clamp(e.dig, 0, DEPTHS[DEPTHS.length - 1].dig);
            if (dig > 0) s.dig = dig;
            else delete s.dig;
          }
          // Set to meet the green or sit just off it: moved to suit. One
          // already set that's moved or resized keeps to the green - unless
          // it's taken well away from it, when it's a bunker like any other.
          let joined = false;
          if (ok && e.join != null) {
            s = joinBunker(L.green, s, e.join);
            joined = true;
          } else if (ok && s.join != null) {
            if ((e.d || e.f) && gapTo(L.green, s) > JOIN_REACH) {
              s = { ...s };
              delete s.join;
            } else s = joinBunker(L.green, s, s.join);
          }
          // A wall along part of its edge (sim/walls.mjs), put on, changed
          // or taken away - on the shape as it ends up (drawn onto the
          // green, say), and on the one it was drawn from, so it keeps the
          // wall when it's moved. One too short or too long for this
          // shape isn't made.
          if (ok && e.wall != null) {
            const wall = e.wall === 0 ? null : cleanWall(s, e.wall, kind);
            if (e.wall !== 0 && !wall) ok = false;
            else {
              const put = (x) => {
                const out = { ...x };
                if (wall) out.wall = wall;
                else delete out.wall;
                return out;
              };
              s = put(s);
              if (s.free) s.free = put(s.free);
            }
          }
          // Checked only if it moved or grew: one that was already too
          // close to something can still be dug or made smaller.
          // (And if a wall's put on it: a pond over the green with a wall
          // would have it across the green - pondGivesWay.)
          if (ok && (e.d || (e.f && e.f > 1) || e.h || joined || (e.wall != null && e.wall !== 0)) && !shapeFits(L, s, kind) && (joined || shapeFits(L, shapes[i], kind))) ok = false;
          if (ok) {
            shapes[i] = s;
            if (e.d || e.f || e.h) handShapes.add(s);
          }
        }
      } else if (e.k[1] === "+") {
        const s = newShape(L, kind, e.at[0], e.at[1]);
        if (shapeFits(L, s, kind)) {
          shapes.push(s);
          handShapes.add(s);
        } else ok = false;
      } else {
        const i = shapeAt(shapes, e.at);
        if (i < 0) ok = false;
        else shapes.splice(i, 1);
      }
    } else if (e.k === "t+") {
      let n = 0;
      for (const [x, z, s = 1] of e.p) {
        if (!treeSpotOk(L, x, z, path) || L.trees.some((t) => Math.hypot(t[0] - x, t[1] - z) < 1.5)) continue;
        // (A spread of its own: a links planting's, sim/linksplanting.mjs.)
        const t = e.kind != null ? [r2(x), r2(z), clamp(s, 0.3, 6), e.kind, e.w ?? 1] : [r2(x), r2(z), clamp(s, 0.4, 6)];
        L.trees.push(t);
        hand.add(t);
        n++;
      }
      ok = n > 0;
    } else if (e.k === "t-" || e.k === "tm" || e.k === "ts" || e.k === "tk" || e.k === "tv") {
      const taken = new Set();
      for (const [x, z] of e.p) {
        const i = treeAt(L.trees, x, z, taken);
        if (i >= 0) taken.add(i);
      }
      let n = 0;
      const gone = [];
      for (const i of taken) {
        const t = L.trees[i];
        const real = isReal(t);
        if (e.k === "t-") {
          gone.push(i);
          if (real) cleared.push([t[0], t[1], crownOf(t) + 0.5]);
          n++;
        } else if (e.k === "tm") {
          const x = r2(t[0] + e.d[0]);
          const z = r2(t[1] + e.d[1]);
          if (!treeSpotOk(L, x, z, path)) continue;
          const moved = [x, z, ...t.slice(2)];
          if (real) cleared.push([t[0], t[1], crownOf(t) + 0.5]);
          L.trees[i] = moved;
          hand.add(moved);
          n++;
        } else if (e.k === "tv") {
          // One of its kind's shapes (treehits.mjs treeForm's seventh
          // number: it then stands upright, as wide both ways), or its own.
          if ((t[6] ?? null) === e.shape) continue;
          const made = [t[0], t[1], t[2] ?? 1, t[3] ?? null, t[4] ?? 1, t[5] ?? null, e.shape, ...t.slice(7)];
          if (hand.has(t) || !real) hand.add(made);
          L.trees[i] = made;
          n++;
        } else if (e.k === "tk") {
          // One kind (its own shape and size still: variants of it), or
          // back to growing as its hole has it. A real tree found in LiDAR
          // keeps its spread; it's still where it was.
          if ((t[3] ?? null) === e.kind) continue;
          const made = e.kind === null ? [t[0], t[1], t[2] ?? 1] : [t[0], t[1], t[2] ?? 1, e.kind, t[4] ?? 1];
          if (hand.has(t) || !real) hand.add(made);
          L.trees[i] = made;
          n++;
        } else {
          const s = clamp(r2((t[2] ?? 1) * e.f), 0.4, 6);
          if (s === (t[2] ?? 1)) continue;
          const grown = [t[0], t[1], s, ...t.slice(3)];
          if (hand.has(t)) hand.add(grown);
          L.trees[i] = grown;
          n++;
        }
      }
      if (gone.length) {
        const drop = new Set(gone);
        L.trees = L.trees.filter((_, i) => !drop.has(i));
      }
      ok = n > 0;
    } else if (e.k === "p+" || e.k === "p-" || e.k === "p" || e.k === "pa") {
      ok = pathEdit(L, e, handPaths);
    } else if (e.k === "r+" || e.k === "r-" || e.k === "r") {
      ok = brookEdit(L, e, handShapes);
    } else if (e.k === "bump") {
      ok = e.p.some(([x, z]) => insideDepth(L.green, x, z) > -4);
    } else if (e.k === "gh") ok = e === state.sculpt ? sculpt !== null : true;
    else if (e.k === "g") ok = reshape;
    else if (e.k === "pin") ok = pinOk;
    else if (GROUND_KINDS.includes(e.k)) ok = !!base.terrain;
    else if (e.k === "f" || e.k === "f-") {
      const i = fairwayAt(fairways, e.at);
      ok = i >= 0 && !gone.has(i);
      if (ok) {
        if (e.k === "f-") gone.add(i);
        else sized.set(i, clamp(e.f, 0.5, 1.8));
        fairwaysNow();
      }
    } else if (e.k === "edge") ok = edgeEdit(L, e, path);
    // The hole's trees grown afresh (sim/treelock.mjs liveLock): nothing
    // to lay on - its trees as kept are let go, below.
    else if (e.k === REGROW) ok = true;
    // (Its signature tree, worked out from the hole's edits where its made
    // trees are kept off the others' play: sim/signaturetree.mjs.)
    else if (e.k === "sig") ok = true;
    else if (e.k === "pots") {
      // Every bunker the hole has now (drawn by hand, not from a map) made
      // a links pot bunker: small, round, deep and turf-faced (sim/
      // course.mjs potBunker) - the owner's courses made before pots came.
      // (Not a waste area: sim/wastearea.mjs.)
      const turn = L.bunkers.filter((b) => !b.poly && !isPot(b) && !b.waste);
      ok = turn.length > 0;
      if (ok) {
        L.bunkers = L.bunkers.map((b) => {
          if (b.poly || isPot(b) || b.waste) return b;
          const pot = potBunker(L, b);
          if (handShapes.has(b)) handShapes.add(pot);
          return pot;
        });
      }
    } else if (e.k === "bstyle") {
      // Every bunker drawn by hand (not from a map, nor a links pot, nor a
      // waste area, which isn't one: sim/wastearea.mjs) given a style's
      // shape (sim/course.mjs restyleBunker) - the owner: "they all look a
      // bit similar".
      let changed = false;
      L.bunkers = L.bunkers.map((b) => {
        if (b.poly || isPot(b) || b.waste) return b;
        const r = restyleBunker(b, e.s, L);
        if (JSON.stringify(r) === JSON.stringify(b)) return b;
        changed = true;
        if (handShapes.has(b)) handShapes.add(r);
        return r;
      });
      ok = changed;
    } else if (e.k === "lk") {
      // A real links course from a map: its marram, rabbit scrapes,
      // pebbles, blown sand and rock drawn over its real ground, and its
      // long grass a links hole's (a designed hole's look is its own).
      ok = base.source === "map" && (L.links || "") !== e.look;
      if (ok) {
        if (e.look) L.links = e.look;
        else delete L.links;
      }
    } else if (e.k === "d+") {
      // Decor placed by hand (sim/decor.mjs): where a tree may stand.
      let n = 0;
      for (const [x, z, s = 1] of e.p) {
        if (!treeSpotOk(L, x, z, path) || L.decor.some((d) => Math.hypot(d[0] - x, d[1] - z) < 0.6)) continue;
        L.decor.push([r2(x), r2(z), e.kind, clamp(s, DECOR.minSize, DECOR.maxSize)]);
        n++;
      }
      ok = n > 0;
    } else if (e.k === "d-" || e.k === "dm") {
      let n = 0;
      for (const [x, z] of e.p) {
        let best = -1;
        let bd = DECOR.near;
        L.decor.forEach((d, i) => {
          const dd = Math.hypot(d[0] - x, d[1] - z);
          if (dd <= bd) {
            bd = dd;
            best = i;
          }
        });
        if (best < 0) continue;
        if (e.k === "d-") L.decor.splice(best, 1);
        else {
          const nx = r2(L.decor[best][0] + e.d[0]);
          const nz = r2(L.decor[best][1] + e.d[1]);
          if (!treeSpotOk(L, nx, nz, path)) continue;
          L.decor[best] = [nx, nz, ...L.decor[best].slice(2)];
        }
        n++;
      }
      ok = n > 0;
    } else if (e.k === "fwn") {
      ok = base.source !== "map" && !!L.fairway && !!L.fairway.natural !== !!e.on;
      if (ok) L.fairway = { ...L.fairway, natural: !!e.on };
    } else if (e.k === "cw") {
      // Its shape as a whole (the last one stands): as made, it's none.
      if (e.w === CAUSEWAY.width && e.e === 1 && !e.to) delete L.causeway;
      else L.causeway = { w: r2(e.w), e: r2(e.e), ...(e.to ? { to: [r2(e.to[0]), r2(e.to[1])] } : {}) };
    } else if (!["tilt", "fw"].includes(e.k)) ok = false;
    applied.push(ok);
  }

  // Nothing left standing in sand or water moved there by hand, or on the
  // green as it's been reshaped. A real tree that goes this way stops
  // playing as trees, like one taken away. (A fairway added by hand keeps
  // a tree planted on it by hand: below.)
  const handList = [...handShapes].filter((s) => !L.extraFairways.includes(s));
  const pathList = L.paths.filter((p) => handPaths.has(p));
  if (handList.length || reshape || pathList.length) {
    L.trees = L.trees.filter((t) => {
      const [x, z] = t;
      const under =
        handList.some((s) => inBox(shapeBounds(s, 1), x, z) && insideDepth(s, x, z) > -0.5) ||
        (reshape && insideDepth(L.green, x, z) > -2) ||
        (pathList.length > 0 && gapToPaths(pathList, x, z, TREE_GAP + 0.01) <= TREE_GAP);
      if (under && isReal(t)) cleared.push([x, z, crownOf(t) + 0.5]);
      return !under;
    });
  }
  // Mark moved or new water: on real ground, the ground under it is dug out
  // so it lies flat (see groundShaping).
  L.water = L.water.map((w) => (handShapes.has(w) ? { ...w, hand: 1 } : w));
  // New water given a wild edge too (sim/course.mjs wildWater).
  L.water = wildWater(L).water;

  // The green's slopes: the tilt and any bumps and hollows, on top of what
  // it had.
  const extra = [];
  const tilt = tiltContour(L.green, state.tilt.a, state.tilt.n, base.source === "map");
  if (tilt) extra.push(tilt);
  let bumps = 0;
  for (const e of edits) {
    if (e?.k !== "bump" || !validEdit(e)) continue;
    for (const [x, z] of e.p) {
      if (bumps >= MAX_BUMPS || insideDepth(L.green, x, z) <= -4) continue;
      extra.push({ x: r2(x), z: r2(z), a: clamp(e.a, -0.08, 0.08), s: BUMP.s });
      bumps++;
    }
  }
  const shaped = sculpt ? greenGrid(base, L, sculpt) : null;
  if (extra.length || reshape || shaped) {
    // (The green's own tilt, as it was made - course.mjs greenContours -
    // laid over the green as it's been reshaped, so none of it is left on
    // the bank.)
    const own = reshape ? (base.contours ?? []).map((c) => (c?.green && c.tilt ? fitGreenTilt(c, L.green, base.source === "map") : c)) : base.contours ?? [];
    L.contours = [...own, ...(shaped ? [shaped] : []), ...extra];
    // A designed hole's green sits on flat ground: lift it back up if
    // hollows would sink any of it below the grass round it.
    if (base.source !== "map") {
      const b = shapeBounds(L.green);
      let low = 0;
      for (let x = b.x0; x <= b.x1; x += 1.5) {
        for (let z = b.z0; z <= b.z1; z += 1.5) {
          if (insideDepth(L.green, x, z) > 0) low = Math.min(low, greenHeight({ contours: L.contours }, x, z));
        }
      }
      if (low < -0.02) L.contours.push({ x: L.green.x, z: L.green.z, a: r2((0.02 - low) / 0.75), s: r2(Math.max(L.green.rx, L.green.rz) * 1.4) });
    }
  }

  // The fairway's width: a designed hole's one fairway; on a hole from a
  // map or on hills (an "fw" from before each of its fairways had its own)
  // its own fairway, along its line - not one sized on its own since, nor
  // a neighbour's beside it, which it stretched out sideways.
  const fw = clamp(state.fw, 0.5, 1.8);
  if (base.source === "map") {
    if (fw !== 1 || sized.size || gone.size) fairwaysNow(fw);
  } else if (fw !== 1) L.fairway = { ...L.fairway, half: r2(base.fairway.half * fw) };

  // Nothing stands on or by an island green's causeway to land (sim/
  // causeway.mjs): a tree or decor put there before the green became an
  // island goes while it is one (as the edits left the water and green).
  L.trees = offCauseways(L, L.trees);
  L.decor = offCauseways(L, L.decor);
  // A fairway added by hand is cleared of the hole's own trees (a tree
  // planted on it by hand stays: it was put there).
  if (L.extraFairways.length) L.trees = L.trees.filter((t) => hand.has(t) || !L.extraFairways.some((f) => insideBlob(f, t[0], t[1], ADDED_CLEAR)));
  // Bushes placed by hand are its trees too (drawn and played as bushes).
  if (L.decor.length) L.trees = [...L.trees, ...decorTrees(L.decor)];
  if (links.length) L.paths = [...L.paths, ...links];
  L.applied = applied;
  if (!L.extraFairways.length) delete L.extraFairways;
  L.handTrees = L.trees.filter((t) => hand.has(t)).map((t) => [t[0], t[1], r2(crownOf(t) * 0.85)]);
  L.clearedCrowns = cleared;
  // Its trees as kept let go if it's been told to grow them afresh since.
  if (L.treeLock && !liveLock(L.treeLock, edits)) delete L.treeLock;
  return L;
}

// A designed hole's edge moved by the brush (an "edge" edit): its hand
// changes along the line (sim/course.mjs edgeAdj: the fairway's in
// L.fairway.adj, the rough's in L.edges), each spot the brush went moving
// its side's edge by e.a, easing off over e.r metres either way along the
// line - or, smoothing, each edge drawn towards the mean of its neighbours
// within e.r, wobble and all. Within EDGE_LIMITS of how it was made.
// Whether it changed anything.
export const EDGE_BANDS = ["fw", "cut", "deep"];
export const EDGE_LIMITS = { fw: [-30, 25], cut: [-4, 15], deep: [-45, 45] };
function edgeEdit(L, e, path) {
  if (L.source === "map" || !L.fairway) return false;
  const n = Math.ceil((path.length - EDGE_FROM + 40) / EDGE_STEP) + 1;
  const was = e.band === "fw" ? L.fairway.adj : L.edges?.[e.band];
  const adj = { from: EDGE_FROM, step: EDGE_STEP, l: Array.from({ length: n }, (_, i) => was?.l?.[i] ?? 0), r: Array.from({ length: n }, (_, i) => was?.r?.[i] ?? 0) };
  const sAt = (k) => EDGE_FROM + k * EDGE_STEP;
  // The edge as it is with these changes: where it lies, at station k.
  const total = (k, side) => {
    const s = sAt(k);
    if (e.band === "fw") return fairwayHalfWidth({ ...L.fairway, adj }, s, side);
    const H = { ...L, edges: { ...L.edges, [e.band]: adj } };
    return e.band === "cut" ? firstCutWidth(H, s, side) : deepRoughFrom(H, s, side);
  };
  const [lo, hi] = EDGE_LIMITS[e.band];
  let changed = 0;
  for (const [x, z] of e.p) {
    const at = nearest(path, x, z);
    const side = at.d < 0 ? -1 : 1;
    const list = side < 0 ? adj.l : adj.r;
    const k0 = Math.max(0, Math.floor((at.s - e.r - EDGE_FROM) / EDGE_STEP));
    const k1 = Math.min(n - 1, Math.ceil((at.s + e.r - EDGE_FROM) / EDGE_STEP));
    // (The fairway only changes where there is one.)
    const there = (k) => e.band !== "fw" || (sAt(k) >= L.fairway.from && sAt(k) <= L.fairway.to);
    const now = e.smooth === 1 ? Array.from({ length: n }, (_, k) => (k >= k0 - 4 && k <= k1 + 4 ? total(k, side) : 0)) : null;
    for (let k = k0; k <= k1; k++) {
      if (!there(k)) continue;
      const d = Math.abs(sAt(k) - at.s);
      if (d > e.r) continue;
      const w = 0.5 + 0.5 * Math.cos((Math.PI * d) / e.r);
      let step;
      if (now) {
        let sum = 0;
        let count = 0;
        for (let j = k - 3; j <= k + 3; j++) {
          if (j < 0 || j >= n || !there(j)) continue;
          sum += now[j];
          count++;
        }
        step = 0.6 * w * (sum / count - now[k]);
      } else step = e.a * w;
      const next = clamp(list[k] + step, lo, hi);
      changed += Math.abs(next - list[k]);
      list[k] = r2(next);
    }
  }
  if (changed < 0.05) return false;
  if (e.band === "fw") L.fairway = { ...L.fairway, adj };
  else L.edges = { ...L.edges, [e.band]: adj };
  return true;
}

// A brook edit ("r+", "r-" or "r", sim/brooks.mjs) made on L: a new brook
// drawn, one taken away, or one drawn through new points, made another
// kind or width, or its banks walled. Its water made again from its line;
// one that would leave the hole unplayable (brookFits) isn't made. Returns
// whether it was done.
function brookEdit(L, e, hand) {
  if (e.k === "r+") {
    const s = brookShape({ p: e.p, kind: e.kind ?? 0, w: e.w ?? 1 });
    if (!brookFits(L, s)) return false;
    L.water.push(s);
    hand.add(s);
    clearForBrook(L, s);
    return true;
  }
  const i = brookAt(L.water, e.at[0], e.at[1], 3);
  if (i < 0) return false;
  if (e.k === "r-") {
    L.water.splice(i, 1);
    return true;
  }
  const next = { ...L.water[i].brook };
  if (e.p) next.p = e.p;
  if (e.kind != null) next.kind = e.kind;
  if (e.w != null) next.w = e.w;
  if (e.banks) {
    if (e.banks.length) next.banks = e.banks;
    else delete next.banks;
  }
  const s = brookShape(next);
  // (Its banks alone change nothing a brook could be in the way of.)
  if ((e.p || e.kind != null || e.w != null) && !brookFits(L, s)) return false;
  L.water[i] = s;
  hand.add(s);
  clearForBrook(L, s);
  return true;
}

// Bunkers a brook runs through go, as they do for a burn (course.mjs
// burnFor): sand cut in two by water, or lying in its banks.
function clearForBrook(L, s) {
  const bed = brookBed(s);
  const box = shapeBounds(bed, 2);
  L.bunkers = L.bunkers.filter((b) => {
    const bb = shapeBounds(b);
    if (bb.x1 < box.x0 || bb.x0 > box.x1 || bb.z1 < box.z0 || bb.z0 > box.z1) return true;
    return !blobOutline(b, 24).some(([x, z]) => insideDepth(bed, x, z) > 0) && insideDepth(bed, b.x, b.z) <= 0;
  });
}

// Would this brook leave the hole playable? As any water (shapeFits) - the
// tee clear, the cup and green out of it - and a sensible length.
export function brookFits(L, s) {
  const len = brookLine(s.brook).length;
  if (len < BROOK_LENGTH[0] || len > BROOK_LENGTH[1]) return false;
  // (It can cross a cart path: the path goes over it, on the ground left
  // as it was - brookGround's culvert.)
  return shapeFits(L, s, "water", { paths: false });
}

// What a cart path edit ("p+", "p-", "p" or "pa") would do to L as it is:
// { i, next } - the place in L.paths of the path it changes (-1 for a new
// one) and the path it becomes (null: taken away) - or null if it finds
// nothing to do. Not yet checked it fits (pathEdit does that); the
// designer uses it to show where a path being dragged would go, and why
// it can't. A path is found by where it runs (the one passing nearest
// `at`, within 3 m), a bend on it by where it is (within BEND_REACH).
export function pathChange(L, e) {
  const paths = L.paths ?? [];
  if (e.k === "pa") {
    if (e.s === 0) return paths.length ? { i: -2, next: null } : null;
    const p = generatePath({ ...L, paths: [] }, e.s < 0 ? "left" : "right", pathSeed(L));
    return p ? { i: -2, next: p } : null;
  }
  if (e.k === "p+") return { i: -1, next: cleanPath({ p: e.p, m: e.m ?? 0 }) };
  const i = pathAt(paths, e.at, 3);
  if (i < 0) return null;
  if (e.k === "p-") return { i, next: null };
  const was = paths[i];
  const bend = was.p.findIndex(([x, z]) => Math.hypot(x - e.at[0], z - e.at[1]) <= BEND_REACH);
  let next;
  if (e.d) {
    const [dx, dz] = e.d;
    next = { ...was, p: was.p.map((q, k) => (bend < 0 || e.all || k === bend ? [q[0] + dx, q[1] + dz] : q)) };
  } else if (e.add) {
    if (was.p.length >= MAX_POINTS) return null;
    const pts = was.p.slice();
    pts.splice(nearestOnPath(was, e.at[0], e.at[1]).point + 1, 0, [e.at[0], e.at[1]]);
    next = { ...was, p: pts };
  } else if (e.drop) {
    if (bend < 0 || was.p.length <= 2) return null;
    next = { ...was, p: was.p.filter((_, k) => k !== bend) };
  } else next = { ...was, m: e.m };
  return { i, next: cleanPath(next) };
}

// A cart path put in, taken out or changed by hand, on L as it is so far.
// Every path that results is checked as any path is (sim/paths.mjs
// pathFits: never on a green, a tee, sand or water); one that doesn't fit
// isn't made. Returns whether it was done; paths made or changed go in
// `hand`, so the trees in their way can be cleared.
function pathEdit(L, e, hand) {
  const change = pathChange(L, e);
  if (!change) return false;
  const { i, next } = change;
  // (A path can cross a brook, over a culvert.)
  if (next && !pathFits({ ...L, paths: [], water: L.water.filter((w) => !w.brook) }, next)) return false;
  if (i === -2) L.paths = next ? [next] : [];
  else if (i === -1) L.paths = [...L.paths, next];
  else L.paths = next ? L.paths.map((q, k) => (k === i ? next : q)) : L.paths.filter((_, k) => k !== i);
  if (next) hand.add(next);
  return true;
}

// A layout with one more edit. The "say how it is now" kinds replace any
// earlier one, and a bunker or pond moved again straight after is kept as
// one move, so the list stays short.
export function addEdit(layout, e) {
  let edits = (layout.edits ?? []).slice();
  if (["g", "pin", "tilt", "fw", "gh", "gt", "fwn", "cw", "sig"].includes(e.k)) edits = edits.filter((x) => x?.k !== e.k);
  // A fairway sized again, or taken away: its earlier sizes go.
  if ((e.k === "f" || e.k === "f-") && Array.isArray(e.at)) edits = edits.filter((x) => !(x?.k === "f" && Array.isArray(x.at) && x.at[0] === e.at[0] && x.at[1] === e.at[1]));
  const prev = edits[edits.length - 1];
  if ((e.k === "b" || e.k === "w" || e.k === "a") && prev?.k === e.k && e.dig == null && prev.dig == null && e.wall == null && prev.wall == null && !e.f && !prev.f && prev.d && e.d) {
    const moved = [prev.at[0] + prev.d[0], prev.at[1] + prev.d[1]];
    if (Math.hypot(moved[0] - e.at[0], moved[1] - e.at[1]) < 0.05) {
      edits[edits.length - 1] = { ...prev, d: [r2(prev.d[0] + e.d[0]), r2(prev.d[1] + e.d[1])] };
      return { ...layout, edits };
    }
  }
  // A path's bend (or the whole path) dragged again straight after: one
  // move. A path made for the hole again, or its surface changed again:
  // only the last counts.
  if (e.k === "p" && e.d && prev?.k === "p" && prev.d && (prev.all ?? 0) === (e.all ?? 0)) {
    const moved = [prev.at[0] + prev.d[0], prev.at[1] + prev.d[1]];
    if (Math.hypot(moved[0] - e.at[0], moved[1] - e.at[1]) < 0.05) {
      edits[edits.length - 1] = { ...prev, d: [r2(prev.d[0] + e.d[0]), r2(prev.d[1] + e.d[1])] };
      return { ...layout, edits };
    }
  }
  if ((e.k === "pa" && prev?.k === "pa") || (e.k === "p" && e.m != null && prev?.k === "p" && prev.m != null && prev.at[0] === e.at[0] && prev.at[1] === e.at[1])) {
    edits[edits.length - 1] = e;
    return { ...layout, edits };
  }
  // Deeper, deeper again: one change of depth.
  if (e.k === "b" && e.dig != null && e.wall == null && !e.d && !e.f && prev?.k === "b" && prev.dig != null && prev.wall == null && !prev.d && !prev.f && prev.at[0] === e.at[0] && prev.at[1] === e.at[1]) {
    edits[edits.length - 1] = e;
    return { ...layout, edits };
  }
  // A wall changed again straight after, on the same bunker or pond: only
  // the last counts (it says the whole wall).
  const wallOnly = (x) => x.wall != null && x.dig == null && !x.d && !x.f && x.join == null;
  if ((e.k === "b" || e.k === "w") && wallOnly(e) && prev?.k === e.k && wallOnly(prev) && prev.at[0] === e.at[0] && prev.at[1] === e.at[1]) {
    edits[edits.length - 1] = e;
    return { ...layout, edits };
  }
  if (edits.length >= MAX_EDITS) return layout;
  return { ...layout, edits: [...edits, e] };
}
