// The Camera sway switch (sim/effects.mjs sway): the camera breathes very
// slightly, as if held, rather than standing dead still. Only for the
// drawing - the camera is put back the moment the frame is drawn, so the
// game's own aim, the views and the recording's numbers never see it - and
// far too small to move the aim line on the screen by a pixel or two: a
// centimetre or so, and a few hundredths of a degree, wandering slowly
// (three slow waves that never line up the same way twice).

import * as THREE from "three";

export const SWAY = { on: false, metres: 0.012, degrees: 0.045 };

const pos = new THREE.Vector3();
const quat = new THREE.Quaternion();
const turn = new THREE.Euler();
const nudge = new THREE.Quaternion();

// How far it has drifted at `t` seconds, each part -1 to 1.
export function swayAt(t) {
  const w = (a, b, c) => 0.5 * Math.sin(t * a) + 0.3 * Math.sin(t * b + 1.7) + 0.2 * Math.sin(t * c + 4.1);
  return { x: w(0.83, 1.37, 0.29), y: w(0.61, 1.11, 0.23), yaw: w(0.47, 0.97, 0.19), pitch: w(0.71, 1.29, 0.31) };
}

// Draws with the camera swayed (draw()), and puts it back.
export function drawSwayed(camera, seconds, draw) {
  if (!SWAY.on || !camera) return draw();
  const s = swayAt(seconds);
  pos.copy(camera.position);
  quat.copy(camera.quaternion);
  const rad = THREE.MathUtils.degToRad(SWAY.degrees);
  camera.translateX(s.x * SWAY.metres);
  camera.translateY(s.y * SWAY.metres);
  nudge.setFromEuler(turn.set(s.pitch * rad, s.yaw * rad, 0, "YXZ"));
  camera.quaternion.multiply(nudge);
  camera.updateMatrixWorld();
  try {
    draw();
  } finally {
    camera.position.copy(pos);
    camera.quaternion.copy(quat);
    camera.updateMatrixWorld();
  }
}
