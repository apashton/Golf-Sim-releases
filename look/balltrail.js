// A fast ball's motion trail (sim/balltrail.mjs says how long and how
// strong): a faint white cone behind the ball, from its width at the ball
// to nothing, pointing back the way it came. It watches the ball itself -
// where it was drawn last and how long ago - so every mode's ball has one
// without telling it anything; a ball put somewhere new draws none.
//
// It hangs on the ball (shown and hidden with it, freed with it) but is
// placed in the world just before it's drawn, as the ball spins.

import * as THREE from "three";
import { trailLook, trailSpeed } from "../sim/balltrail.mjs";

// A cone along +z: its base (radius 1, full strength) at 0, its point
// (nothing) at 1.
let shape = null;
function trailShape() {
  if (shape) return shape;
  shape = new THREE.CylinderGeometry(0, 1, 1, 10, 4, true).rotateX(Math.PI / 2).translate(0, 0, 0.5);
  const pos = shape.attributes.position;
  const colour = new Float32Array(pos.count * 4);
  for (let i = 0; i < pos.count; i++) {
    const t = Math.min(1, Math.max(0, pos.getZ(i)));
    colour.set([1, 1, 1, Math.pow(1 - t, 1.5)], i * 4);
  }
  shape.setAttribute("color", new THREE.BufferAttribute(colour, 4));
  return shape;
}

const was = new THREE.Vector3();
const now = new THREE.Vector3();
const back = new THREE.Vector3();
const up = new THREE.Vector3(0, 1, 0);
const scale = new THREE.Vector3();

// Gives `ball` (a mesh of `radius`) its trail.
export function addBallTrail(ball, radius) {
  const material = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false });
  const trail = new THREE.Mesh(trailShape(), material);
  trail.name = "ball trail";
  trail.frustumCulled = false;
  trail.matrixAutoUpdate = false;
  // (Its geometry is shared by every ball's: not freed with one.)
  trail.userData.keepGeometry = true;
  let last = null;
  let at = 0;
  let shown = 0;
  trail.onBeforeRender = () => {
    ball.getWorldPosition(now);
    const t = performance.now() / 1000;
    if (!last) {
      last = now.clone();
      at = t;
    } else if (!now.equals(last)) {
      // Moved since it was last drawn: how fast, and which way.
      shown = trailSpeed(shown, now.distanceTo(last), t - at);
      back.subVectors(last, now);
      last.copy(now);
      at = t;
    } else if (t - at > 0.08) shown = 0;
    const look = back.lengthSq() > 0 ? trailLook(shown) : null;
    material.opacity = look ? look.opacity : 0;
    if (!look) return;
    ball.getWorldScale(scale);
    const r = radius * scale.x * 0.92;
    was.copy(now).add(back);
    trail.matrixWorld.lookAt(was, now, Math.abs(back.clone().normalize().y) > 0.99 ? new THREE.Vector3(1, 0, 0) : up);
    trail.matrixWorld.scale(scale.set(r, r, look.length));
    trail.matrixWorld.setPosition(now);
  };
  // Drawn after the ball, over the tracer.
  trail.renderOrder = 3;
  ball.add(trail);
  return trail;
}
