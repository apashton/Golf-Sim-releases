// The other holes' surfaces and trees inside one hole's crop
// (docs/COURSE-LOD-PLAN.md, stages 4 and 5). Fairways, greens, tees,
// bunkers and water become low meshes on the far ground. Where the course
// height field already has a neighbour's shape, the mesh only lifts clear
// of the sheet. On a flat field a tier 1 green still gets a crown and its
// bunkers a shallow dip. Tier 1 trees are drawn in 3D, at most treeCap of
// them, the walk to the next tee first. Tier 2 stays the painted cards.
// Nothing is drawn on the hole being played. Pure.

import { edgeFade } from "./holecrop.mjs";
import { outlinesMeet } from "./course.mjs";

export const SURFACE = {
  // How far a shape sits above the far sheet, so it shows over the picture.
  lift: 0.08,
  green: 0.1,
  // A tier 1 green, highest at its middle.
  crown: 0.3,
  // A tier 1 bunker: this much lower at its middle than at its rim. The
  // rim stays above the sheet, so the dip is visible.
  dip: 0.12,
  // A bunker's rim, over its fairway and green (lift, green) by enough
  // that neither shows through it: each shape follows the ground only at
  // its own corners, metres apart, so at the same lift a fairway lay over
  // its sand in bites (seen from above Nine Oaks 2 and 3, the holes
  // beside them).
  bunker: 0.16,
  water: 0.05,
  // A shape this far onto the hole's own ground is cut off there; it
  // fades out (surfaceAlpha) on the way in, so the cut doesn't show.
  own: 0.95,
  // A tree any way onto the hole's own ground is dropped.
  ownTree: 0,
  // Tier 1 trees are drawn in 3D only this far (a share of the crop's
  // radius) from its centre; past that they stay the painted cards, which
  // read softer far off than a crowd of small dark 3D crowns. The walk
  // to the next tee is exempt: those few are real trees.
  treeReach: 0.55,
  // 3D neighbour trees, at most. The walk, then the next hole, then the nearer.
  treeCap: 90,
  // Of those, this many along the walk to the next tee are real trees,
  // not the light far crowns.
  walkTrees: 24,
  walk: 80,
  // Other holes' grass is this much darker at the crop's edge than at its
  // centre (toneAt), so it sits back with distance.
  tone: 0.1,
};

const treeKey = (x, z) => `${Math.round(x * 10)},${Math.round(z * 10)}`;

// The part of a polygon where own(x, z) <= limit. own is 1 on the hole
// being played and 0 clear of it. Points are found along each edge.
export function clipOutside(poly, own, limit = SURFACE.own) {
  if (!poly || poly.length < 3 || !own) return poly ?? [];
  const inside = (p) => own(p[0], p[1]) <= limit;
  const cross = (a, b) => {
    let lo = inside(a) ? a : b;
    let hi = inside(a) ? b : a;
    for (let i = 0; i < 14; i++) {
      const m = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2];
      if (inside(m)) lo = m;
      else hi = m;
    }
    return [lo[0], lo[1]];
  };
  let out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ain = inside(a);
    const bin = inside(b);
    if (ain && bin) out.push([b[0], b[1]]);
    else if (ain && !bin) out.push(cross(a, b));
    else if (!ain && bin) {
      out.push(cross(a, b));
      out.push([b[0], b[1]]);
    }
  }
  return out.length >= 3 ? out : [];
}

// Metres above the far sheet at (x, z). Crown and dip are strongest at
// the shape's middle. fade is 1 inside the crop and 0 at its edge.
export function liftAt(pts, { lift = SURFACE.lift, crown = 0, dip = 0, fade = 1 } = {}) {
  let cx = 0;
  let cz = 0;
  for (const p of pts) {
    cx += p[0];
    cz += p[1];
  }
  cx /= pts.length;
  cz /= pts.length;
  let r = 1;
  for (const p of pts) r = Math.max(r, Math.hypot(p[0] - cx, p[1] - cz));
  return (x, z) => {
    const k = Math.max(0, 1 - Math.hypot(x - cx, z - cz) / r);
    return Math.max(0.02, (lift + (crown - dip) * k) * fade);
  };
}

const nearSegment = (a, b, x, z, reach) => {
  if (!a || !b) return false;
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const l2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2));
  return Math.hypot(x - (a[0] + dx * t), z - (a[1] + dz * t)) <= reach;
};

// The tier 1 trees actually drawn: faded at the crop's edge, inside the
// 3D reach except along the walk to the next tee, that walk first, then
// the next hole, then the nearer ones, and no more than treeCap. walk:
// close enough to that walk to be a real tree.
export function pickTrees(crop, own = () => 0) {
  const box = crop?.circle ?? crop?.box;
  if (!box) return [];
  const out = [];
  for (const h of crop.neighbours ?? []) {
    if (h.tier !== "t1") continue;
    (h.trees ?? []).forEach((t, i) => {
      if (own(t[0], t[1]) > SURFACE.ownTree) return;
      const fade = edgeFade(t[0], t[1], box);
      if (fade <= 0.5) return;
      const walk = !!(h.nextHole && nearSegment(crop.green, crop.nextTee, t[0], t[1], SURFACE.walk));
      if (!walk && !treeIn3D(t, crop)) return;
      out.push({ at: t, form: h.forms?.[i] ?? null, fade, walk, next: !!h.nextHole, dist: h.dist ?? 0 });
    });
  }
  out.sort((a, b) => b.walk - a.walk || b.next - a.next || a.dist - b.dist);
  const kept = out.slice(0, SURFACE.treeCap);
  let walks = 0;
  for (const t of kept) {
    if (!t.walk) continue;
    if (walks >= SURFACE.walkTrees) t.walk = false;
    else walks++;
  }
  return kept;
}

// A shape's lift stays whole to the crop's edge (fade 1): lowering it
// sank it into the sheet in ragged patches. It fades out by its alpha
// instead (surfaceAlpha). edge: the least fade over its corners, so the
// drawing knows to cut it finer where the alpha changes.
const keepPoly = (poly, own, box) => {
  const clipped = clipOutside(poly, own);
  if (clipped.length < 3) return null;
  const fades = clipped.map(([x, z]) => edgeFade(x, z, box));
  if (Math.max(...fades) <= 0.02) return null;
  return { pts: clipped, fade: 1, edge: Math.min(...fades) };
};

// How solid a crop shape is at (x, z): fading out over the crop's edge
// (a circle) and onto the hole's own ground, into the painted picture
// beneath, which shows the same shapes.
export function surfaceAlpha(crop, own = () => 0) {
  const box = crop?.circle ?? crop?.box;
  return (x, z) => (box ? edgeFade(x, z, box) : 1) * Math.max(0, Math.min(1, 1 - own(x, z)));
}

// Whether a tier 1 tree is drawn in 3D (and its card held back).
export function treeIn3D(t, crop) {
  const c = crop?.circle;
  return !c || Math.hypot(t[0] - c.x, t[1] - c.z) <= c.r * SURFACE.treeReach;
}

// A colour factor for other holes' grass at (x, z): 1 at the crop's
// centre, 1 - SURFACE.tone at its edge.
export function toneAt(crop) {
  const c = crop?.circle;
  if (!c) return () => 1;
  return (x, z) => {
    const t = Math.min(1, Math.max(0, (Math.hypot(x - c.x, z - c.z) - c.r * 0.25) / (c.r * 0.75)));
    return 1 - SURFACE.tone * t * t * (3 - 2 * t);
  };
}

// { fairway, green, tee, bunker, water, trees } from a holeCrop() result.
// shaped: the course field already has the neighbour's ground, so a green
// is not crowned again and a bunker is not dipped again. trees are the
// tier 1 ones pickTrees keeps.
export function cropSurfaces(crop, { own = () => 0, shaped = false } = {}) {
  const empty = { fairway: [], green: [], tee: [], bunker: [], water: [], trees: [] };
  const box = crop?.circle ?? crop?.box;
  if (!box) return empty;
  const put = (list, polys, spec) => {
    for (const poly of polys ?? []) {
      const kept = keepPoly(poly, own, box);
      if (kept) list.push({ ...kept, ...spec });
    }
  };
  for (const h of crop.neighbours ?? []) {
    const near = h.tier === "t1" && !shaped;
    // Each with its hole's own mowing (sim/mowing.mjs, in this frame), so
    // it's striped as when that hole is played.
    put(empty.fairway, [...(h.fairways ?? []), ...(h.causeways ?? [])], { lift: SURFACE.lift, crown: 0, dip: 0, links: h.links ?? null, number: h.number ?? null, mowing: h.mowing ?? null });
    put(empty.green, h.greens, { lift: SURFACE.green, crown: near ? SURFACE.crown : 0, dip: 0, number: h.number ?? null, mowing: h.mowing ?? null });
    put(empty.tee, h.tees, { lift: SURFACE.lift, crown: 0, dip: 0, number: h.number ?? null });
    put(empty.bunker, h.bunkers, { lift: SURFACE.bunker, crown: 0, dip: near ? SURFACE.dip : 0 });
    // (Its water reaching onto a green stopping short of its greens'
    // fringes, which it gives way to: sim/greenfirst.mjs - and of an island
    // green's causeway, `ways`.)
    for (const w of h.water ?? []) {
      const reaches = (h.greens ?? []).some((g) => outlinesMeet(g, w));
      put(empty.water, [w], { lift: SURFACE.water, crown: 0, dip: 0, dry: reaches ? h.greens : [], ways: reaches ? (h.causeways ?? []) : [] });
    }
  }
  empty.trees = pickTrees(crop, own);
  return empty;
}

// Hole-frame keys of the trees drawn in 3D, so their painted cards can be
// left out (they'd show through the 3D tree). Trees past the cap stay cards.
export function heldTreeKeys(crop, own = () => 0) {
  const held = new Set();
  for (const t of pickTrees(crop, own)) held.add(treeKey(t.at[0], t.at[1]));
  return held;
}

// Neighbour holes with those trees taken out of the card list.
export function withoutHeldTrees(holes, held) {
  if (!held?.size || !holes) return holes;
  return holes.map((h) => {
    const trees = [];
    const forms = [];
    (h.trees ?? []).forEach((t, i) => {
      if (held.has(treeKey(t[0], t[1]))) return;
      trees.push(t);
      if (h.forms) forms.push(h.forms[i]);
    });
    return { ...h, trees, forms };
  });
}
