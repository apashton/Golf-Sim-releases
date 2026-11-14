// Trees off other holes (the owner: "lots of trees on the neighbouring
// fairway ... a tree or two placed tactically is fine"). Each hole's trees
// are made in its own frame, knowing nothing of the holes beside it, so
// once the course is laid out (sim/imaginary.mjs coursePlaces) some land
// on another hole's fairway, green or tee, or right on its line of play.
// Here those are kept off, the same way for every view of the course, so
// a tree is either there for every hole (in each crop, played or not) or
// for none:
//   - a hole's own made trees (its layout's trees, as stored), the
//     backdrop and woods grown past them, and those planted by hand (its
//     edits, "t+") are dropped within CLEAR's margins of any OTHER hole's
//     fairways, greens and tees - or within their crown's reach, if that's
//     further (the owner: "The singular tree in a fairway is allowable, IF
//     it is part of that hole ... If it's part of a different hole it
//     should be removed"; a trunk 2 m off the next fairway hung its crown
//     a few metres over it, and read from there as a tree in it). The gap between two holes is left alone:
//     a thin row of trees there, or none, is the design's choice (the
//     owner: "that's the designer's choice"). The hole editor won't plant
//     or move a tree onto another hole's ground;
//   - its made trees are kept out of every other hole's tee lane too
//     (sim/teelane.mjs: the clear view from a tee down to its fairway),
//     as a hole's own are as it's made (the owner: "trees in front of
//     next hole tee box"): the trees round one green stood right in front
//     of the next tee. Hand-planted ones are the player's business;
//   - on the hole's own ground the usual rules hold (a tree planted by
//     hand where its own rules allow it stays: a tactical tree);
//   - a hole from a real course's map keeps its trees (they're real); a
//     course made up and put on hills (sim/imaginary.mjs) is built as a
//     map's is, but its trees are made: kept off as a designed course's
//     are, and off its own cart paths and tee boxes too (realTrees);
//   - and off every other hole's cart paths, and the paths between holes
//     (sim/linkpaths.mjs) where the course has them: no trunk within
//     TREE_GAP of a path's edge, as a hole keeps its own trees off its own
//     (the owner, 26 October 2026: "there's still some cart paths going
//     through trees. Whilst the cart doesn't go through the trees, the
//     cart paths do" - Golf Sim Links had 38 trunks on another hole's
//     path, Nine Oaks 13) - and a made tree's crown no further over a
//     path's edge, its own hole's paths as played included (sim/paths.mjs
//     CROWN_OVER; the owner, 28 October 2026: "ensure the paths make sense
//     both logistically and visually" - on the hills courses a sixth of
//     the paths' length ran on under the trees);
//   - each tree belongs to exactly one hole (the one whose layout has it):
//     shown on the others, changed only from its own.
// Pure; courses stored before this need nothing: it's worked out as they
// load.

import { signatureTree, withSignature } from "./signaturetree.mjs";
import { coursePlaces, toCourse } from "./imaginary.mjs";
import { holeShapes } from "./coursewide.mjs";
import { holeFrame, insidePolygon, insideOutline } from "./terrain.mjs";
import { withEdits } from "./holeedits.mjs";
import { courseOwners, ownShapesOnly } from "./owners.mjs";
import { validPath, TREE_GAP, clearOfPaths, pathGapFor } from "./paths.mjs";
import { coursePaths } from "./coursepaths.mjs";
import { linkPaths } from "./linkpaths.mjs";
import { teeSpots } from "./tees.mjs";
import { teeBoxes, SURROUND } from "./course.mjs";
import { crownReach, teeLane, inTeeLane } from "./teelane.mjs";
import { validLock, handKept, keptLayout } from "./treelock.mjs";

export const CLEAR = {
  // Metres kept clear round another hole's fairway, green and tee (a
  // crown's reach over its edge). No corridor round its line: the gap
  // between two holes may keep a narrow line of trees.
  fairway: 2,
  green: 4,
  tee: 3,
  // A made-up course's hole (realTrees): its own trees' trunks this far
  // off its cart paths' edges (as far as a designed hole's and any other
  // hole's: sim/paths.mjs TREE_GAP), and from where it's played off (its
  // tee boxes as the tee, above).
  path: TREE_GAP,
  teeSpot: 6,
};

// Whether a hole's trees are real - from a real course's map - and so
// stay where they are. A course made up and put on hills
// (sim/imaginary.mjs withHills) has its holes built as a map's are
// (sim/mapcourse.mjs), but its trees are made like a designed hole's: on
// Hillside Park and Nine Oaks Mountain they stood on the holes' cart
// paths, and one beside a tee.
export const realTrees = (course, L) => L?.source === "map" && course?.source?.kind !== "imaginary";

const edgeDistance = (poly, x, z) => {
  let d2 = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const pj = poly[j];
    const pi = poly[i];
    const dx = pi[0] - pj[0];
    const dz = pi[1] - pj[1];
    let t = ((x - pj[0]) * dx + (z - pj[1]) * dz) / (dx * dx + dz * dz || 1);
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
    const qx = x - pj[0] - dx * t;
    const qz = z - pj[1] - dz * t;
    const dist2 = qx * qx + qz * qz;
    if (dist2 < d2) d2 = dist2;
  }
  return Math.sqrt(d2);
};

const boxOf = (pts, pad) => {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const [x, z] of pts) {
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
  }
  return { x0: x0 - pad, x1: x1 + pad, z0: z0 - pad, z1: z1 + pad };
};
const inBox = (b, x, z) => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1;

const memo = new WeakMap();

// Every hole's play ground in course metres: [{ index, parts: [{ poly,
// margin, box }], path, box, paths, pathBox }] - paths its cart paths
// (with its edits), as sim/paths.mjs keeps them, and the box round them.
function playGrounds(course) {
  if (memo.has(course)) return memo.get(course);
  const places = coursePlaces(course) ?? [];
  // A hole from the map has its neighbours' shapes in its box too: each
  // hole's own only (sim/owners.mjs), so a hole's trees aren't kept off
  // its own fairway as if it were another's.
  const owners = (course?.holes ?? []).some((h) => h?.layout?.source === "map") ? courseOwners(course) : [];
  const out = [];
  (course?.holes ?? []).forEach((h, i) => {
    const L = h?.layout;
    if (!L?.path?.length || !places[i]) return;
    const to = (p) => toCourse(places[i], p);
    const edited = withEdits(L);
    let shapes;
    try {
      shapes = holeShapes(L.source === "map" ? ownShapesOnly(edited, owners[i], i) : edited);
    } catch {
      return;
    }
    const parts = [];
    const add = (polys, margin, lie) => {
      for (const p of polys ?? []) {
        if (!p || p.length < 3) continue;
        const poly = p.map(to);
        parts.push({ poly, margin, lie, box: boxOf(poly, margin) });
      }
    };
    add(shapes.fairways, CLEAR.fairway, "fairway");
    add(shapes.causeways, CLEAR.fairway, "fairway");
    add(shapes.greens, CLEAR.green, "green");
    out.push({ index: i, parts, L, edited, shapes, to });
  });
  // Then each hole's tees: a designed hole's boxes as they're played, kept
  // off the other holes' greens (sim/tees.mjs, by its otherGround - the
  // same greens otherGroundOf hands its layout).
  for (const g of out) {
    const { L, edited, shapes, to, parts } = g;
    const add = (polys) => {
      for (const p of polys ?? []) {
        if (!p || p.length < 3) continue;
        const poly = p.map(to);
        parts.push({ poly, margin: CLEAR.tee, lie: "tee", box: boxOf(poly, CLEAR.tee) });
      }
    };
    if (L.source === "map") add(shapes.tees);
    else {
      const greens = realTrees(course, L) || out.length < 2 ? [] : nearParts(course, g.index, out, (q) => q.lie === "green");
      add(playedTees(greens.length ? { ...edited, otherGround: greens } : edited));
    }
    const path = L.path.map(to);
    // Its tee lane, from its own fairways (a mapped hole's box has its
    // neighbours' too), in course metres.
    const fairways = shapes.fairways.filter((f) => f?.length > 2);
    const lane = teeLane({ ...L, fairways }, { insideFairway: (x, z) => fairways.some((f) => insidePolygon(f, x, z)) });
    const laneOut = lane && { ...lane, lines: lane.lines.map((ln) => ln.map(to)) };
    const all = [...path, ...parts.flatMap((q) => q.poly)];
    const paths = coursePathsOf(edited.paths, to);
    for (const k of ["L", "edited", "shapes", "to"]) delete g[k];
    Object.assign(g, { path, lane: laneOut, box: boxOf(all, CLEAR.green), paths, pathBox: pathsBox(paths) });
  }
  memo.set(course, out);
  return out;
}

// The other holes' ground near hole `index` (within its reach), in its
// frame: [{ lie, poly }] - those of `grounds` (playGrounds' holes) that
// `which` takes.
function nearParts(course, index, grounds, which = () => true) {
  const L = course.holes[index].layout;
  const place = coursePlaces(course)?.[index];
  if (!L?.path?.length || !place) return [];
  const frame = holeFrame([place.x, place.z], place.heading);
  const r2 = (v) => Math.round(v * 10) / 10;
  const reach = 450;
  const mine = boxOf(L.path.map((p) => toCourse(place, p)), reach);
  const out = [];
  for (const g of grounds) {
    if (g.index === index) continue;
    for (const q of g.parts) {
      if (!which(q) || q.box.x1 < mine.x0 || q.box.x0 > mine.x1 || q.box.z1 < mine.z0 || q.box.z0 > mine.z1) continue;
      out.push({ lie: q.lie, poly: q.poly.map((p) => frame.toHole(p).map(r2)) });
    }
  }
  return out;
}

// A designed hole's tee as it's played: each of its tee boxes (sim/tees.mjs
// teeSpots, sim/course.mjs teeBoxes) with the first cut mown round it, in
// its frame - not the one stand-in box holeShapes has, so another hole's
// trees and long grass keep off the boxes behind and in front of it too
// (as the next tee's drawn from the hole before: sim/nexttee.mjs).
function playedTees(L) {
  if (!(L?.path?.length >= 2)) return [];
  const t = SURROUND.tee;
  return teeBoxes(teeSpots(L)).map(([x0, x1, z0, z1]) => [[x0 - t, z0 - t], [x1 + t, z0 - t], [x1 + t, z1 + t], [x0 - t, z1 + t]]);
}

// Cart paths in course metres (sim/paths.mjs's { p, w, m }), moved with
// `to`; and the box round them, as far out as a trunk is kept.
function coursePathsOf(paths, to) {
  return (paths ?? []).filter(validPath).map((p) => ({ ...p, p: p.p.map(to) }));
}
function pathsBox(paths) {
  if (!paths.length) return null;
  const widest = Math.max(...paths.map((p) => p.w ?? 2.4));
  return boxOf(paths.flatMap((p) => p.p), widest / 2 + pathGapFor(CROWN_MOST) + 1);
}
// (No crown reaches further than this, metres.)
const CROWN_MOST = 12;
// Whether a trunk at (x, z) stands on, or within TREE_GAP of, a path - or,
// its crown reaching `reach`, near enough for its crown to reach over one
// (sim/paths.mjs CROWN_OVER).
const onPaths = (paths, box, x, z, reach = 0) => !!box && inBox(box, x, z) && !clearOfPaths(paths, x, z, reach);

// The paths between holes (sim/linkpaths.mjs), where the course has them,
// in course metres: laid on the holes' play as it's played, so no hole's
// trees were made knowing of them - every hole's are kept off them.
const linkMemo = new WeakMap();
function courseLinks(course) {
  if (linkMemo.has(course)) return linkMemo.get(course);
  const paths = course?.linkPaths ? linkPaths(course).map((l) => ({ p: l.line, w: 2.4, m: 0, link: true })) : [];
  const out = { paths, box: pathsBox(paths) };
  linkMemo.set(course, out);
  return out;
}

// Whether a spot (course metres) is clear of every hole's play ground
// but `owner`'s - by its margin, or by `reach` (a tree's crown) if that's
// more - and, with `lanes`, out of their tee lanes; and whether a trunk
// there is clear of their cart paths and the paths between holes.
export function clearOfOthers(course, owner, x, z, reach = 0, { lanes = false } = {}) {
  const links = courseLinks(course);
  // (A made tree's crown kept off them too; one planted by hand, only its
  // trunk.)
  const crown = lanes ? reach : 0;
  if (onPaths(links.paths, links.box, x, z, crown)) return false;
  for (const g of playGrounds(course)) {
    if (g.index === owner) continue;
    if (lanes && inTeeLane(g.lane, x, z, reach)) return false;
    if (onPaths(g.paths, g.pathBox, x, z, crown)) return false;
    if (x < g.box.x0 - reach || x > g.box.x1 + reach || z < g.box.z0 - reach || z > g.box.z1 + reach) continue;
    for (const q of g.parts) {
      const m = Math.max(q.margin, reach);
      if (x < q.box.x0 - m || x > q.box.x1 + m || z < q.box.z0 - m || z > q.box.z1 + m) continue;
      if (insidePolygon(q.poly, x, z) || edgeDistance(q.poly, x, z) <= m) return false;
    }
  }
  return true;
}

// For hole `index`: (x, z, reach) in its own frame -> whether a tree of
// its may stand there, its crown reaching `reach` metres (treeReach) -
// out of the other holes' tee lanes too, but for one planted by hand
// (made: false). Always true for a hole whose trees are real
// (realTrees), or with no course.
export function treeClearance(course, index) {
  const L = course?.holes?.[index]?.layout;
  const place = coursePlaces(course)?.[index];
  if (!L || !place || realTrees(course, L) || (course.holes?.length ?? 0) < 2) return () => true;
  return (x, z, reach = 0, made = true) => {
    const [cx, cz] = toCourse(place, [x, z]);
    return clearOfOthers(course, index, cx, cz, reach, { lanes: made });
  };
}

// How far a tree's crown reaches ([x, z, size, kind, width]: teelane.mjs
// crownReach), for keeping it off another hole's ground.
export const treeReach = (t) => (Array.isArray(t) ? crownReach(t) : 0);

// Hole `index`'s layout with its trees kept off the other holes: its made
// ones, and any planted by hand ("t+" edits, from before the editor
// stopped them going there).
export function clearedLayout(course, index, given = course?.holes?.[index]?.layout) {
  // (Its trees as kept, only while they're for the trees it has:
  // sim/treelock.mjs.)
  const layout = keptLayout(given);
  // (A hole with no trees - a links hole - still carries the other holes'
  // ground: its grass keeps off it, and it's drawn over its rough.)
  if (!layout?.trees?.length && !layout?.edits?.length) {
    const otherGround = layout ? otherGroundOf(course, index) : [];
    return otherGround.length ? { ...layout, otherGround } : layout;
  }
  const ok = treeClearance(course, index);
  const own = ownClear(course, layout, index);
  // Its signature tree among its made trees (sim/signaturetree.mjs), none
  // of theirs under it - kept off the other holes' play as they are.
  const sig = signatureTree(layout);
  const made = withSignature(layout.trees ?? [], sig);
  const trees = made.filter((t) => ok(t[0], t[1], treeReach(t)) && own(t[0], t[1], treeReach(t)));
  let changed = made !== (layout.trees ?? []) || trees.length !== (layout.trees ?? []).length;
  // Its trees kept as they first grew (sim/treelock.mjs), the same way:
  // one planted or moved by hand as one is.
  const lock = validLock(layout.treeLock);
  const keptOk = (t) => (handKept(t) ? ok(t[0], t[1], treeReach(t), false) : ok(t[0], t[1], treeReach(t)) && own(t[0], t[1], treeReach(t)));
  const lockTrees = lock ? lock.trees.filter(keptOk) : null;
  const treeLock = lockTrees && lockTrees.length !== lock.trees.length ? { ...lock, trees: lockTrees } : null;
  if (treeLock) changed = true;
  const edits = (layout.edits ?? []).map((e) => {
    if ((e?.k !== "t+" && e?.k !== "d+") || !Array.isArray(e.p)) return e;
    const p = e.p.filter((q) => ok(q[0], q[1], treeReach(q), false));
    if (p.length === e.p.length) return e;
    changed = true;
    return { ...e, p };
  });
  const otherGround = otherGroundOf(course, index);
  if (!changed && !otherGround.length) return layout;
  return { ...layout, ...(layout.trees ? { trees } : {}), ...(layout.edits ? { edits } : {}), ...(otherGround.length ? { otherGround } : {}), ...(treeLock ? { treeLock } : {}) };
}

// Hole `index`'s signature tree (sim/signaturetree.mjs), for the hole
// editor: { tree, off, standing } - tree: where it stands (as it would, if
// it's been taken away); off: taken away (the edit { k: "sig", on: 0 });
// standing: it's there, clear of the other holes' play. null: the hole has
// none.
export function holeSignature(course, index) {
  const L = course?.holes?.[index]?.layout;
  if (!L) return null;
  const off = (L.edits ?? []).some((e) => e?.k === "sig" && e.on === 0);
  const tree = signatureTree(off ? { ...L, edits: L.edits.filter((e) => e?.k !== "sig") } : L);
  if (!tree) return null;
  const standing = !off && (clearedLayout(course, index)?.trees ?? []).some((t) => t[0] === tree[0] && t[1] === tree[1] && t[3] === tree[3]);
  return { tree, off, standing };
}

// Hole `index`'s own ground: (x, z, reach) in its frame -> whether one of
// its made trees, its crown reaching `reach`, may stand there - its crown
// not reaching over the hole's paths as they're played (sim/coursepaths.mjs:
// kept off the other holes' ground; sim/paths.mjs CROWN_OVER) - and, on a
// made-up course's hole built as a map's (realTrees), not on its tee
// boxes, which the map builder leaves the trees it's given on. (A real
// map's are real.) Hand-planted ones stay.
function ownClear(course, L, index) {
  if (realTrees(course, L)) return () => true;
  const played = (course?.holes?.length ?? 0) >= 2 && course.holes[index]?.layout?.paths === L?.paths ? coursePaths(course)[index] : L?.paths;
  const paths = (played ?? []).filter(validPath);
  if (L?.source !== "map") return (x, z, reach = 0) => clearOfPaths(paths, x, z, reach);
  const tees = (L.tees ?? []).filter((t) => t?.length > 2);
  return (x, z, reach = 0) =>
    Math.hypot(x, z) > CLEAR.teeSpot &&
    !tees.some((t) => insidePolygon(t, x, z) || edgeDistance(t, x, z) <= CLEAR.tee) &&
    clearOfPaths(paths, x, z, reach);
}

// Other holes' fairways, greens and tees near hole `index`, in its frame
// ([{ lie, poly }]): plain data riding with its layout, so what's laid
// when it's made ready to play (courseplay.mjs bushes) keeps off them.
const groundMemo = new WeakMap();
export function otherGroundOf(course, index) {
  const L = course?.holes?.[index]?.layout;
  const place = coursePlaces(course)?.[index];
  if (!L?.path?.length || !place || realTrees(course, L) || (course.holes?.length ?? 0) < 2) return [];
  let byHole = groundMemo.get(course);
  if (!byHole) groundMemo.set(course, (byHole = new Map()));
  if (byHole.has(index)) return byHole.get(index);
  const out = nearParts(course, index, playGrounds(course));
  byHole.set(index, out);
  return out;
}

// Every hole's own trees (as played: kept off the others, hand edits laid
// on) in course metres, each with its one owner: [{ at: [x, z], owner,
// tree }]. Each is resolved from its owner's layout through that hole's
// place on the course, the same way for every hole's crop
// (sim/neighbours.mjs courseNeighbours), so a tree stands in one spot on
// the course whichever hole it's seen from. Stored courses keep their
// trees in their own hole's frame; this is the course-wide view of them.
export function courseTrees(course, withEdits) {
  const places = coursePlaces(course) ?? [];
  const out = [];
  (course?.holes ?? []).forEach((h, i) => {
    if (!h?.layout || !places[i]) return;
    const L = withEdits ? withEdits(clearedLayout(course, i)) : clearedLayout(course, i);
    for (const t of L.trees ?? []) out.push({ at: toCourse(places[i], [t[0], t[1]]), owner: i, tree: t });
  });
  return out;
}

// Decor (sim/dressing.mjs heather, gorse, rocks, flowers; links ground
// scatter; dune patches) is laid by each hole from its own lies, which
// know nothing of the holes beside it - so it landed on their fairways.
// For hole `index`: a lieAt (its frame) that reads another hole's
// fairway, green or tee as that, and this hole's own lies elsewhere, so
// the dressing's own clearances (a few metres round each) keep it off
// every hole's play ground. Decor on those surfaces only comes from the
// designer.
export function lieWithOthers(course, index, lieAt) {
  const L = course?.holes?.[index]?.layout;
  const place = coursePlaces(course)?.[index];
  if (!L || !place || (course.holes?.length ?? 0) < 2) return lieAt;
  const grounds = playGrounds(course).filter((g) => g.index !== index);
  return (x, z) => {
    const [cx, cz] = toCourse(place, [x, z]);
    for (const g of grounds) {
      if (!inBox(g.box, cx, cz)) continue;
      for (const q of g.parts) if (inBox(q.box, cx, cz) && insideOutline(q.poly, cx, cz)) return q.lie;
    }
    return lieAt(x, z);
  };
}

// The other holes' decor placed by hand (sim/decor.mjs), in hole `index`'s
// frame, within `reach` of its line: [[x, z, kind, size]]. Each where its
// own hole has it on the course, so it's the same from every hole. (Only
// holes with some to place are worked through.)
export function othersDecor(course, index, reach = 700) {
  const places = coursePlaces(course) ?? [];
  const me = places[index];
  const L = course?.holes?.[index]?.layout;
  if (!me || !L?.path?.length) return [];
  const frame = holeFrame([me.x, me.z], me.heading);
  const out = [];
  (course.holes ?? []).forEach((h, j) => {
    if (j === index || !places[j] || !h?.layout?.edits?.some((e) => e?.k === "d+")) return;
    const edited = withEdits(clearedLayout(course, j));
    for (const d of edited?.decor ?? []) {
      const [x, z] = frame.toHole(toCourse(places[j], [d[0], d[1]]));
      if (Math.abs(x) > L.path.at(-1)[0] + reach || Math.abs(z) > reach) continue;
      out.push([x, z, ...d.slice(2)]);
    }
  });
  return out;
}
