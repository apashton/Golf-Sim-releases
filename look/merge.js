// Things that never move, merged into one mesh per material: one draw call
// for every piece that shares a material, where each piece (and each face
// of a box with a material per face) was a draw call of its own. The
// range's distance boards, hitting mats, rubber tees and ball baskets were
// most of its draw calls from the tee. The pieces are built as before and
// passed here placed; what comes back is drawn the same, but cheaper.
//
// Kept apart, as a mesh each: pieces with different materials, shadows
// (cast, received) or draw order, and pieces whose shapes carry different
// data (with and without texture co-ordinates). An instanced mesh's
// instances are merged in as copies of its shape. A piece's own userData
// isn't kept, so nothing that's looked up or changed one piece at a time
// (a board that fades) should be merged with others.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// The pieces of `roots` (Object3Ds, placed in one frame - not yet in a
// scene, or all in the same one), merged into a group of meshes, one per
// material and shadow setting, in the same frame. `name` names the group.
// The roots are left as they were (their shapes and materials are not
// freed: the materials are the merged meshes' own).
export function mergeStatic(roots, { name = "merged" } = {}) {
  const buckets = new Map();
  const add = (geo, material, o) => {
    const attrs = Object.keys(geo.attributes).sort().join(",");
    const key = `${material.uuid}|${o.castShadow ? 1 : 0}${o.receiveShadow ? 1 : 0}|${o.renderOrder}|${attrs}`;
    let b = buckets.get(key);
    if (!b) buckets.set(key, (b = { material, cast: o.castShadow, receive: o.receiveShadow, order: o.renderOrder, readable: false, parts: [] }));
    b.parts.push(geo);
    if (o.userData.readable) b.readable = true;
  };
  const m = new THREE.Matrix4();
  for (const root of [roots].flat()) {
    if (!root) continue;
    root.updateMatrixWorld(true);
    // The frame they're merged into: the root's parent's, if it has one.
    const inv = root.parent ? new THREE.Matrix4().copy(root.parent.matrixWorld).invert() : new THREE.Matrix4();
    root.traverse((o) => {
      if (!o.isMesh || o.isSkinnedMesh || o.isBatchedMesh || !o.visible) return;
      const copies = [];
      if (o.isInstancedMesh) {
        for (let i = 0; i < o.count; i++) {
          o.getMatrixAt(i, m);
          copies.push(new THREE.Matrix4().multiplyMatrices(o.matrixWorld, m));
        }
      } else copies.push(o.matrixWorld.clone());
      for (const world of copies) {
        const at = new THREE.Matrix4().multiplyMatrices(inv, world);
        for (const [geo, material] of pieces(o.geometry, o.material)) {
          geo.applyMatrix4(at);
          add(geo, material, o);
        }
      }
    });
  }
  const group = new THREE.Group();
  group.name = name;
  for (const b of buckets.values()) {
    const geo = b.parts.length === 1 ? b.parts[0] : mergeGeometries(b.parts);
    if (b.parts.length > 1) for (const p of b.parts) p.dispose();
    if (!geo) continue;
    geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, b.material);
    mesh.castShadow = b.cast;
    mesh.receiveShadow = b.receive;
    mesh.renderOrder = b.order;
    if (b.readable) mesh.userData.readable = true;
    group.add(mesh);
  }
  return group;
}

// A shape as [shape, material] pieces, each its own copy without an index:
// one per group for a mesh with a material per group (a box's faces),
// else the whole shape.
function pieces(geometry, material) {
  const flat = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  flat.morphAttributes = {};
  if (!Array.isArray(material)) {
    flat.clearGroups();
    return [[flat, material]];
  }
  const out = [];
  const groups = flat.groups.length ? flat.groups : [{ start: 0, count: flat.attributes.position.count, materialIndex: 0 }];
  for (const g of groups) {
    const mat = material[g.materialIndex];
    if (!mat) continue;
    const part = new THREE.BufferGeometry();
    for (const [nameOf, attr] of Object.entries(flat.attributes)) {
      const size = attr.itemSize;
      part.setAttribute(nameOf, new THREE.BufferAttribute(attr.array.slice(g.start * size, (g.start + g.count) * size), size, attr.normalized));
    }
    out.push([part, mat]);
  }
  flat.dispose();
  return out;
}

// How many draw calls a set of objects takes, as three.js draws them: one
// per mesh, or one per material group of a mesh with a material per group.
// (For the tests, and for saying what a merge saved.)
export function drawCount(roots) {
  let n = 0;
  for (const root of [roots].flat()) {
    root?.traverse((o) => {
      if (!o.isMesh || !o.visible) return;
      n += Array.isArray(o.material) ? Math.max(1, o.geometry.groups.length) : 1;
    });
  }
  return n;
}

// Pieces that stand in different groups (a flag's pole in each flag, a lip
// round each bunker), merged in the world's frame, as mergeStatic does: each
// is taken out of its group, where it is in the world, and what comes back
// goes in the scene (or anything else not moved from the world's frame).
// The groups keep what's left of them (a flag's waving cloth, a bunker's
// sand), so whatever moves or is looked up one at a time stays as it was.
export function mergePlaced(pieces, options) {
  const holder = new THREE.Group();
  for (const p of pieces) if (p) holder.attach(p);
  const merged = mergeStatic(holder, options);
  holder.clear();
  return merged;
}
