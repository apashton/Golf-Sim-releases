// The order the solid things in a picture are drawn in (the renderer's
// opaque sort: app.js setOpaqueSort). The graphics card skips working out a
// pixel's colour when something nearer has already been drawn there, so
// what's drawn first should be what hides the most:
//
//   - first everything that stands on the ground - trees, tufts, the grass
//     across the hole, signs, the golfer - as three.js would (its draw
//     order, renderOrder first, then the material, then near to far);
//   - then the ground's layers, top first: water and sand, the green, the
//     tee and fringe, the fairway, the first cut, and the rough last. A
//     hole's rough is one big sheet under all the rest (course/holebuild.js),
//     and drawn first - as it was, by being made first - every pixel of
//     fairway, green and tee had its colour worked out twice, the rough's
//     (the ground's recipe, with its noise and every tap of its soft
//     shadows) thrown away under the fairway's. Drawn last, the rough is
//     only worked out where it shows;
//   - the sky last of all: only where nothing's in front of it (it's drawn
//     at the far plane and doesn't write its depth), not under the trees,
//     the hills and the far woods along the horizon.
//
// Nothing looks different: which layer shows is decided by depth (each a
// centimetre or two apart, pushed apart further by their polygon offsets:
// look/grass.js onLayer), not by the order - only how much is worked out
// and thrown away.
//
// The layer comes from the material (userData.groundLayer, set by
// look/grass.js onLayer, which every ground layer goes through; look/grass.js
// LAYER's numbers, higher on top), the sky from userData.drawLast
// (look/environment.js). Pure: test/draworder.test.mjs.

// Where the ground's layers come among the rest, and the sky's.
export const GROUND_RANK = 10;
export const SKY_RANK = 1000;
// The highest layer there is (look/grass.js LAYER.water): the top of the
// ground's layers is drawn first.
export const TOP_LAYER = 6;

// A material's place in the order: 0 for what stands on the ground, then
// the ground's layers top first, then the sky.
export function drawRank(material) {
  const u = material?.userData;
  if (!u) return 0;
  if (u.drawLast) return SKY_RANK;
  const layer = u.groundLayer;
  return Number.isFinite(layer) ? GROUND_RANK + Math.max(0, TOP_LAYER - layer) : 0;
}

// The opaque sort (three.js's painterSortStable, with the rank after the
// renderOrder): renderOrder still comes first, so anything given one keeps
// its place.
export function opaqueOrder(a, b) {
  if (a.groupOrder !== b.groupOrder) return a.groupOrder - b.groupOrder;
  if (a.renderOrder !== b.renderOrder) return a.renderOrder - b.renderOrder;
  const ra = drawRank(a.material);
  const rb = drawRank(b.material);
  if (ra !== rb) return ra - rb;
  if (a.material.id !== b.material.id) return a.material.id - b.material.id;
  if ((a.materialVariant ?? 0) !== (b.materialVariant ?? 0)) return (a.materialVariant ?? 0) - (b.materialVariant ?? 0);
  if (a.z !== b.z) return a.z - b.z;
  return a.id - b.id;
}
