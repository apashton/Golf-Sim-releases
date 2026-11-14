// A penalty area's marking round a hole's water (sim/penalty.mjs
// penaltyMarks): slim painted stakes a few strides apart, and a painted
// line on the grass just outside the edge - red beside play, yellow across
// it. Scenery: a ball goes through a stake as through the flagstick's
// shadow.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { PALETTE } from "./palette.js";
import { LAYER, onLayer, edgeStrip } from "./grass.js";
import { cutOver } from "./dugground.js";
import { withSceneryHooks } from "./glsl/hooks.js";

const stake = new THREE.BoxGeometry(0.045, 0.75, 0.045).translate(0, 0.33, 0);
const COLOUR = { red: PALETTE.penaltyRed, yellow: PALETTE.penaltyYellow };
let stakeMat = null;
const lineMats = {};

// marks: penaltyMarks's; groundAt(x, z): the ground's height (hole frame);
// onGreen(x, z): on a green or its fringe, where no line's painted for
// water reaching onto a green (its mark's `dry`: sim/greenfirst.mjs).
// Returns a group (empty with no water).
export function penaltyMarking(marks, groundAt, onGreen = null) {
  const group = new THREE.Group();
  group.name = "penalty areas";
  const parts = [];
  for (const m of marks) {
    const c = new THREE.Color(COLOUR[m.colour] ?? COLOUR.red);
    for (const [x, z] of m.stakes) {
      // (Leaning a touch, as stakes knocked in by hand do.)
      const g = stake.clone().rotateZ(((x * 7.31 + z * 3.17) % 1) * 0.08 - 0.04).translate(z, groundAt(x, z), -x);
      g.deleteAttribute("uv");
      const n = g.attributes.position.count;
      g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(n * 3).map((_, i) => [c.r, c.g, c.b][i % 3]), 3));
      parts.push(g.index ? g.toNonIndexed() : g);
    }
    if (m.line.length > 2) {
      lineMats[m.colour] ??= onLayer(new THREE.MeshLambertMaterial({ color: COLOUR[m.colour] ?? COLOUR.red }), LAYER.path);
      let geo = edgeStrip(m.line.map(([x, z]) => [z, -x]), 0.1, (wx, wz) => groundAt(-wz, wx), 0.02);
      if (onGreen && m.dry && m.line.some(([x, z]) => onGreen(x, z))) geo = cutOver(geo, (wx, wz) => onGreen(-wz, wx));
      const strip = new THREE.Mesh(geo, lineMats[m.colour]);
      strip.receiveShadow = true;
      group.add(strip);
    }
  }
  if (parts.length) {
    stakeMat ??= withSceneryHooks(new THREE.MeshLambertMaterial({ vertexColors: true }), "sign");
    const mesh = new THREE.Mesh(mergeGeometries(parts), stakeMat);
    mesh.castShadow = true;
    group.add(mesh);
  }
  return group;
}
