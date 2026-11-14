// The phone's draw calls (the owner's list, 2 November 2026: "fewer draw
// calls on the phone, where the processor is the limit rather than the
// graphics card"). A phone's frame is mostly the page's own work of
// sending each piece to the graphics chip - its shader, its numbers, its
// draw - not the chip's drawing (sim/fewerdraws.mjs measured a hole of 180
// draws, half of them small pieces of ground: other holes' shapes in the
// crop, each bunker's sand and wall, the next tee's pieces). So once a hole
// is built (course/holebuild.js), on the phone the small and middle-sized
// pieces that never move and share a material are merged into one mesh
// each (look/merge.js): a draw for all of them, drawn the same.
//
// Left as they are: anything bigger than PIECES.most corners (the hole's
// own ground sheets, which are each drawn only when in view - merged, all
// of them would be drawn every frame), instanced and batched shapes (the
// trees, the tufts), anything see-through (drawn in order of distance),
// anything with numbers of its own (userData: looked up or changed one at
// a time, kept out of mirrors, its shadow near), anything drawn its own way
// (onBeforeRender) or hidden. Pure in what it picks (mergeable).

import * as THREE from "three";
import { mergePlaced } from "./merge.js";
import { PIECES, mergeable } from "../sim/fewerdraws.mjs";

export { PIECES };

const noBefore = THREE.Object3D.prototype.onBeforeRender;
const noAfter = THREE.Object3D.prototype.onAfterRender;

// The pieces of `root` (a hole's world, not moved from the scene's frame)
// worth merging, merged: one mesh for each set sharing a material and the
// way it's drawn, in `root`, the pieces taken out (their own shapes freed
// where nothing else draws them). Returns how many draws it saved.
export function mergeSmallPieces(root, { most = PIECES.most } = {}) {
  const buckets = new Map();
  const uses = new Map();
  root.traverse((o) => {
    if (o.geometry) uses.set(o.geometry, (uses.get(o.geometry) ?? 0) + 1);
  });
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!o.isMesh) return;
    const info = {
      mesh: true,
      instanced: !!(o.isInstancedMesh || o.isBatchedMesh || o.isSkinnedMesh || o.geometry?.isInstancedBufferGeometry),
      corners: o.geometry?.attributes?.position?.count ?? 0,
      materials: Array.isArray(o.material) ? o.material.length : 1,
      seeThrough: !!o.material?.transparent,
      ownData: Object.keys(o.userData).length > 0 || Object.keys(o.geometry?.userData ?? {}).length > 0,
      ownDrawing: o.onBeforeRender !== noBefore || o.onAfterRender !== noAfter || !o.frustumCulled,
      shown: shownIn(o, root),
      morphs: Object.keys(o.geometry?.morphAttributes ?? {}).length > 0,
    };
    if (!mergeable(info, most)) return;
    const attrs = Object.keys(o.geometry.attributes).sort().join(",");
    const key = `${o.material.uuid}|${o.castShadow ? 1 : 0}${o.receiveShadow ? 1 : 0}|${o.renderOrder}|${o.layers.mask}|${attrs}`;
    let b = buckets.get(key);
    if (!b) buckets.set(key, (b = []));
    b.push(o);
  });
  let saved = 0;
  for (const pieces of buckets.values()) {
    if (pieces.length < 2) continue;
    const merged = mergePlaced(pieces, { name: "merged pieces" });
    // (The world's frame is the scene's: what comes back goes straight in.)
    root.add(merged);
    for (const p of pieces) {
      p.removeFromParent();
      if ((uses.get(p.geometry) ?? 0) <= 1) p.geometry.dispose();
    }
    saved += pieces.length - merged.children.length;
  }
  return saved;
}

// Whether o and everything over it up to root is shown.
function shownIn(o, root) {
  for (let p = o; p && p !== root; p = p.parent) if (!p.visible || p.layers.mask === 0) return false;
  return true;
}
