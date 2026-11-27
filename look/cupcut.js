// The cup's hole cut only near the cup (sim/cupcut.mjs says why). A piece
// of ground drawn with a material that cuts the cup's hole (grass.js
// grassMaterial, mappedground.js, given the cup: markCupCut) is split once
// the hole's built (cutOnlyNearCup): its triangles within CUP_PATCH of the
// cup become a patch of their own, drawn with that material as before, and
// the rest is drawn with its twin without the cut (uncutOf) - so the
// graphics card can skip the hidden ground's pixels there. A piece nowhere
// near the cup just takes the twin. The very same triangles, their corners
// copied number for number, so nothing looks any different.

import * as THREE from "three";
import { markTwin } from "./twins.js";
import { CUP_PATCH, nearCup, splitCorners, ownCorners, cornersOf } from "../sim/cupcut.mjs";

// The define that leaves the cut out of a ground shader (grass.js,
// mappedground.js: their discard is inside #ifndef GROUND_UNCUT).
export const UNCUT = "GROUND_UNCUT";

// Marks a ground material as cutting the cup's hole: hole { x, z, r }
// (world). Returns the material.
export function markCupCut(material, hole) {
  if (hole && hole.r > 0) material.userData.cupCut = { x: hole.x, z: hole.z, r: hole.r };
  return material;
}

// A material's twin without the cut: the same in every other way - its
// drawing (layer, see-through, depth), its shader but for the cut, the
// very same uniforms (whatever changes them later - the country laid over
// it, the season - changes both), and on WebGPURenderer a node version of
// its own without the cup's mask (glsl/groundnode.js `uncut`). One a
// material, made the first time it's asked for; let go with it.
const twins = new WeakMap();
export function uncutOf(material) {
  let twin = twins.get(material);
  if (twin) return twin;
  twin = new material.constructor();
  // (Material.copy copies userData as JSON: its uniforms and pictures
  // aren't, so it's shared by hand below.)
  const data = material.userData;
  material.userData = {};
  try {
    twin.copy(material);
  } finally {
    material.userData = data;
  }
  twin.userData = { ...data };
  delete twin.userData.cupCut;
  delete twin.userData.twin;
  twin.userData.uncut = true;
  twin.onBeforeCompile = material.onBeforeCompile;
  if (Object.prototype.hasOwnProperty.call(material, "customProgramCacheKey")) twin.customProgramCacheKey = material.customProgramCacheKey;
  twin.defines = { ...(material.defines ?? {}), [UNCUT]: "" };
  if (data.twin) markTwin(twin, data.twin.kind, { ...data.twin.options, uncut: true });
  // (Let go together: the material may be on no mesh of its own.)
  if (!data.shared) twin.addEventListener("dispose", () => material.dispose());
  twins.set(material, twin);
  return twin;
}

// Whether a mesh's corners are where it's drawn (no turn or scale in its
// frame, nor its parents'), only moved: the cup's spot is then easily put
// in its frame.
function moveOnly(m) {
  const e = m.elements;
  return e[0] === 1 && e[5] === 1 && e[10] === 1 && e[1] === 0 && e[2] === 0 && e[4] === 0 && e[6] === 0 && e[8] === 0 && e[9] === 0 && e[3] === 0 && e[7] === 0 && e[11] === 0 && e[15] === 1;
}

// A geometry's corners at `corners` (sim/cupcut.mjs ownCorners: each once),
// every attribute copied number for number, with its triangles.
function patchGeometry(geo, own) {
  const out = new THREE.BufferGeometry();
  for (const [name, a] of Object.entries(geo.attributes)) out.setAttribute(name, new THREE.BufferAttribute(cornersOf(a.array, a.itemSize, own.vertices), a.itemSize, a.normalized));
  out.setIndex(new THREE.BufferAttribute(own.vertices.length > 65535 ? own.index : Uint16Array.from(own.index), 1));
  return out;
}

// The rest of a geometry, the patch's triangles taken out (far: its
// corners in order, sim/cupcut.mjs splitCorners), in place: a new list of
// triangles for one with them, or its corners copied without them.
function keepFar(geo, far) {
  if (geo.index) {
    let top = 0;
    for (let i = 0; i < far.length; i++) if (far[i] > top) top = far[i];
    geo.setIndex(new THREE.BufferAttribute(top >= 65535 ? far : Uint16Array.from(far), 1));
  } else {
    for (const [name, a] of Object.entries(geo.attributes)) geo.setAttribute(name, new THREE.BufferAttribute(cornersOf(a.array, a.itemSize, far), a.itemSize, a.normalized));
  }
}

// Every piece of ground under `root` drawn with a material that cuts the
// cup's hole, cut only near the cup (above). A piece left as it was: one
// with groups or a part drawn (drawRange), interleaved or morphing corners,
// or turned in its frame; and one seen through (an edge fading into the
// ground under it), which is never split - drawn after the others in the
// order they're sorted in, its patch might change which goes over which -
// only given the twin if nowhere near the cup. Returns what it did:
// { pieces, uncut, split, patch } (the patch's triangles).
export function cutOnlyNearCup(root, reach = CUP_PATCH) {
  const out = { pieces: 0, uncut: 0, split: 0, patch: 0 };
  const meshes = [];
  root.traverse((o) => {
    if (o.isMesh && !o.isInstancedMesh && !o.isBatchedMesh && !Array.isArray(o.material) && o.material?.userData?.cupCut) meshes.push(o);
  });
  root.updateWorldMatrix(true, true);
  // (The twins made in the order their materials were, so the ground's
  // pieces are drawn in the same order among themselves as before:
  // sim/draworder.mjs goes by the material after its layer.)
  for (const m of [...new Set(meshes.map((o) => o.material))].sort((a, b) => a.id - b.id)) uncutOf(m);
  // (A shape on more than one mesh is split once.)
  const done = new Map();
  for (const mesh of meshes) {
    out.pieces++;
    const material = mesh.material;
    const geo = mesh.geometry;
    const pos = geo.attributes.position;
    const plain = !pos || pos.isInterleavedBufferAttribute || geo.groups.length || geo.drawRange.start !== 0 || geo.drawRange.count !== Infinity || Object.keys(geo.morphAttributes).length || !moveOnly(mesh.matrixWorld);
    if (plain) continue;
    const cup = material.userData.cupCut;
    const at = { x: cup.x - mesh.matrixWorld.elements[12], z: cup.z - mesh.matrixWorld.elements[14] };
    let split = done.get(geo);
    if (!split) {
      if (!geo.boundingBox) geo.computeBoundingBox();
      const b = geo.boundingBox;
      const away = at.x < b.min.x - reach || at.x > b.max.x + reach || at.z < b.min.z - reach || at.z > b.max.z + reach;
      const found = away ? { count: 0 } : nearCup(pos.array, geo.index?.array ?? null, at, reach);
      split = { found, patch: null };
      if (found.count && found.count < found.near.length && !material.transparent) {
        const parts = splitCorners(geo.index?.array ?? null, found.near);
        split.patch = patchGeometry(geo, ownCorners(parts.near));
        keepFar(geo, parts.far);
        out.split++;
        out.patch += found.count;
      }
      done.set(geo, split);
    }
    // Wholly near the cup (or seen through and reaching it): as it was.
    if (split.found.count && !split.patch) continue;
    if (split.patch) {
      const near = new THREE.Mesh(split.patch, material);
      near.name = mesh.name ? `${mesh.name} (round the cup)` : "round the cup";
      for (const k of ["castShadow", "receiveShadow", "renderOrder", "frustumCulled", "visible", "matrixAutoUpdate", "customDepthMaterial", "customDistanceMaterial"]) near[k] = mesh[k];
      near.layers.mask = mesh.layers.mask;
      near.position.copy(mesh.position);
      near.quaternion.copy(mesh.quaternion);
      near.scale.copy(mesh.scale);
      near.userData = { ...mesh.userData };
      delete near.userData.keepGeometry;
      // (Just after the piece it's from.)
      const parent = mesh.parent;
      parent.add(near);
      parent.children.splice(parent.children.indexOf(near), 1);
      parent.children.splice(parent.children.indexOf(mesh) + 1, 0, near);
      near.updateMatrixWorld(true);
    }
    mesh.material = uncutOf(material);
    out.uncut++;
  }
  return out;
}
