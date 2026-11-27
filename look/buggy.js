// The cart that takes the players on to the next tee (sim/buggy.mjs says
// what the ride is; course/buggy.js drives it): a two-seat golf cart in the
// club's colours - a cream body, dark green roof and seats, two bags on
// the back - with a screen hanging from the front of its roof over the
// driver, facing the seats. On Standard and Medium plain shapes, as the
// tee's furniture is (look/club.js Kit), merged into one mesh; on High and
// Ultra a proper golf cart, moulded and fitted out (look/buggyfine.js).
// The screen a part of its own either way, so the ride can find where it is
// in the picture; and its four wheels four of one wheel, each turned as it
// rolls and the front two steered (turnWheels). No one in it: the camera
// gets in. Its frame as the ride's: x to its right, y up, z to its back
// (it drives along -z), standing on y = 0.

import * as THREE from "three";
import { Kit, kitMaterial } from "./club.js";
import { PALETTE } from "./palette.js";
import { EXTRA } from "./quality.js";
import { fineCart, wheelSet } from "./buggyfine.js";
import { RIDE, WHEELS, wheelSpin } from "../sim/buggy.mjs";

const P = PALETTE;

export function makeBuggy({ fine = EXTRA } = {}) {
  const group = new THREE.Group();
  group.name = "cart";
  const S = RIDE.screen;
  if (fine) group.add(fineCart());
  else group.add(plainCart(), plainWheels());
  // The screen itself: dark, lit from within (not by the sun).
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(S.w, S.h), new THREE.MeshBasicMaterial({ color: P.cartScreen }));
  screen.name = "cart screen";
  screen.position.set(S.at[0], S.at[1], S.at[2]);
  // (Tipped with its case, face down towards the seats; a hair in front
  // of the case's face.)
  screen.rotation.x = S.tip;
  group.add(screen);
  group.userData.screen = screen;
  const wheels = [];
  group.traverse((o) => o.userData.wheels && wheels.push(o));
  group.userData.wheels = wheels;
  return group;
}

// Its wheels turned for `rolled` metres along and the front two steered
// `steer` radians, + to the left (sim/buggy.mjs wheelSpin, wheelSteer):
// each about its axle, then the front ones about the upright.
const turned = { m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(0, 0, 0, "YXZ"), at: new THREE.Vector3(), one: new THREE.Vector3(1, 1, 1) };
export function turnWheels(buggy, rolled = 0, steer = 0) {
  const { m, q, e, at, one } = turned;
  const spin = wheelSpin(rolled);
  let i = 0;
  for (const x of [-WHEELS.x, WHEELS.x]) {
    for (const z of WHEELS.z) {
      e.set(spin, z === WHEELS.z[0] ? steer : 0, 0, "YXZ");
      m.compose(at.set(x, WHEELS.r, z), q.setFromEuler(e), one);
      for (const w of buggy.userData.wheels) w.setMatrixAt(i, m);
      i++;
    }
  }
  for (const w of buggy.userData.wheels) w.instanceMatrix.needsUpdate = true;
}

// The sky's reflection on the cart: the scene's, each time it's put in one
// (the one it had may have gone with an earlier hole's weather).
export function cartReflections(buggy, scene) {
  const map = scene.userData.envMap ?? null;
  buggy.traverse((o) => {
    const m = o.material;
    if (!m?.isMeshStandardMaterial || m.envMap === map) return;
    m.envMap = map;
    m.needsUpdate = true;
  });
}

// The plain cart (Standard and Medium): boxes and cylinders, one mesh.
function plainCart() {
  const k = new Kit();
  k.place(0, 0, 0, 0);
  // The floor and frame between the wheels (plainWheels).
  k.box(1.04, 0.14, 2.3, P.cartTrim, { at: [0, 0.34, 0.02] });
  // The body: the nose over the front wheels, a floor for the feet, the
  // seat box and the deck at the back over the rear wheels.
  k.box(1.16, 0.46, 0.62, P.cartBody, { at: [0, 0.6, -0.92] });
  k.box(1.1, 0.12, 0.5, P.cartBody, { at: [0, 0.88, -0.98], tilt: [-0.28, 0] });
  k.box(1.12, 0.09, 0.5, P.cartTrim, { at: [0, 0.44, -0.4] });
  k.box(1.14, 0.36, 0.62, P.cartBody, { at: [0, 0.6, 0.32] });
  k.box(1.14, 0.42, 0.5, P.cartBody, { at: [0, 0.62, 0.92] });
  for (const x of [-0.6, 0.6]) k.box(0.05, 0.12, 0.5, P.cartTrim, { at: [x, 0.42, 0.86] });
  for (const x of [-0.6, 0.6]) k.box(0.05, 0.12, 0.62, P.cartTrim, { at: [x, 0.42, -0.92] });
  // The bench seat and its back.
  k.box(1.06, 0.1, 0.54, P.cartSeat, { at: [0, 0.83, 0.3] });
  k.box(1.06, 0.48, 0.09, P.cartSeat, { at: [0, 1.12, 0.6], tilt: [-0.16, 0] });
  // The roof on four posts.
  for (const x of [-0.54, 0.54]) {
    k.box(0.05, 1.3, 0.05, P.metal, { at: [x, 1.36, -0.66], tilt: [0.12, 0] });
    k.box(0.05, 1.12, 0.05, P.metal, { at: [x, 1.4, 0.84] });
  }
  k.box(1.24, 0.06, 1.86, P.cartTrim, { at: [0, 1.98, 0.08] });
  k.box(1.28, 0.08, 0.06, P.cartTrim, { at: [0, 1.96, -0.86] });
  k.box(1.28, 0.08, 0.06, P.cartTrim, { at: [0, 1.96, 1.02] });
  // The steering wheel on its column, on the left.
  k.cyl(0.025, 0.025, 0.55, 6, P.metal, { at: [-0.26, 0.88, -0.6], tilt: [0.62, 0] });
  k.cyl(0.15, 0.15, 0.03, 16, P.cartTrim, { at: [-0.27, 1.02, -0.5], tilt: [0.95, 0] });
  // Two bags on the back.
  for (const [x, c] of [[-0.24, P.bags[0]], [0.24, P.bags[1]]]) {
    k.cyl(0.12, 0.12, 0.9, 10, c, { at: [x, 1.05, 1.12], tilt: [-0.25, 0] });
    k.cyl(0.13, 0.13, 0.12, 10, P.cartTrim, { at: [x, 1.52, 1.24], tilt: [-0.25, 0] });
  }
  // The screen's arm down from the roof, and its case.
  const S = RIDE.screen;
  k.box(0.05, 1.96 - S.at[1] - S.h / 2, 0.05, P.cartTrim, { at: [0, (1.96 + S.at[1] + S.h / 2) / 2, S.at[2] - 0.02] });
  k.box(S.w + 0.05, S.h + 0.05, 0.035, P.cartTrim, { at: [S.at[0], S.at[1], S.at[2] - 0.02], tilt: [S.tip, 0] });
  const body = k.mesh(kitMaterial());
  body.castShadow = true;
  body.receiveShadow = true;
  body.userData.shadowNear = true;
  body.name = "cart body";
  return body;
}

// The plain cart's wheels: a tyre, its hub, and three bars across the hub
// on each side so it's seen to turn - one wheel drawn four times
// (wheelSet).
function plainWheels() {
  const k = new Kit();
  k.place(0, 0, 0, 0);
  const { r, w } = WHEELS;
  k.cyl(r, r, w, 14, P.tyre, { tilt: [0, Math.PI / 2] });
  k.cyl(0.1, 0.1, w + 0.01, 10, P.metal, { tilt: [0, Math.PI / 2] });
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) k.box(0.012, 0.17, 0.03, P.cartTrim, { at: [side * (w / 2 + 0.008), 0, 0], tilt: [(i * Math.PI) / 3, 0] });
  const wheel = k.mesh(kitMaterial());
  const set = wheelSet(wheel.geometry, wheel.material, "cart wheels");
  set.castShadow = true;
  set.receiveShadow = true;
  set.userData.shadowNear = true;
  return set;
}

// The screen's corners in the world (for where it is in the picture).
const CORNERS = [
  [-0.5, 0.5],
  [0.5, 0.5],
  [0.5, -0.5],
  [-0.5, -0.5],
];
export function screenCorners(buggy, out = CORNERS.map(() => new THREE.Vector3())) {
  const screen = buggy.userData.screen;
  const { w, h } = RIDE.screen;
  screen.updateWorldMatrix(true, false);
  CORNERS.forEach(([x, y], i) => out[i].set(x * w, y * h, 0).applyMatrix4(screen.matrixWorld));
  return out;
}
