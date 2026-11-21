// A timber bridge taking a cart path over water (sim/bridges.mjs says where
// and what pieces): a deck of weathered planks, and posts, rails and the
// beams under the deck in the timber the signs and their rails are made of
// (look/signs.js, look/palette.js CLUB), so it looks as if the same
// greenkeeper built it. Two instanced boxes for the lot: a bridge costs two
// draws however long it is.

import * as THREE from "three";
import { CLUB } from "./palette.js";
import { withSceneryHooks } from "./glsl/hooks.js";
import { bridgePieces } from "../sim/bridges.mjs";

let mats = null;
function materials() {
  const m = (c) => withSceneryHooks(new THREE.MeshLambertMaterial({ color: c }), "sign");
  mats ??= { deck: m(CLUB.timberWeathered), frame: m(CLUB.timber) };
  return mats;
}

const box = new THREE.BoxGeometry(1, 1, 1);

// Boxes ({ a, b, w, h }, hole frame) as one instanced mesh, in world terms
// (hole (x, y, z) -> world (z, y, -x)). Each a touch lighter or darker, as
// timber is.
function boxes(list, material, seed) {
  const mesh = new THREE.InstancedMesh(box, material, list.length);
  const m = new THREE.Matrix4();
  const X = new THREE.Vector3();
  const Y = new THREE.Vector3();
  const Z = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const c = new THREE.Color();
  let r = seed >>> 0 || 1;
  const rand = () => ((r = (Math.imul(r, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  list.forEach(({ a, b, w, h }, i) => {
    const A = new THREE.Vector3(a[2], a[1], -a[0]);
    const B = new THREE.Vector3(b[2], b[1], -b[0]);
    const len = A.distanceTo(B) || 0.01;
    X.subVectors(B, A).normalize();
    // Across it: level, unless it stands upright (a post).
    Z.crossVectors(X, Math.abs(X.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : up).normalize();
    Y.crossVectors(Z, X).normalize();
    m.makeBasis(X.multiplyScalar(len), Y.multiplyScalar(h), Z.multiplyScalar(w));
    m.setPosition(A.add(B).multiplyScalar(0.5));
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, c.setScalar(0.88 + rand() * 0.2));
  });
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// The bridge on `span` of `path`. heightAt(wx, wz): the ground as the path
// is laid on it (world); waterAt(x, z): the water's height there (hole
// frame), or null where it's dry.
export function makeBridge(path, span, heightAt, waterAt) {
  const { planks, frame } = bridgePieces(path, span, (x, z) => heightAt(z, -x), waterAt);
  const group = new THREE.Group();
  const { deck, frame: timber } = materials();
  const seed = Math.round(span.from * 100) + 7;
  if (planks.length) group.add(boxes(planks, deck, seed));
  if (frame.length) group.add(boxes(frame, timber, seed + 1));
  group.userData.bridge = true;
  return group;
}
