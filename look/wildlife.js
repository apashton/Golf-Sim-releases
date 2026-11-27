// Ducks and swans on the larger ponds (sim/furniture.mjs pondBirds says
// where): ducks brown with a grey-green head, swans cream - never black,
// never white (look/palette.js WILDLIFE). They bob and drift slowly about
// where they sit, worked out in the vertex shader from one time value, so
// the processor moves nothing each frame. One instanced draw per kind,
// about 150 triangles a duck; each has a dark patch of water under it in
// the same mesh rather than a shadow, so they cast nothing into the sun's
// shadow map (look/shadowwatch.js) however they move.

import * as THREE from "three";
import { PALETTE } from "./palette.js";
import { withSceneryHooks } from "./glsl/hooks.js";
import { markTwin } from "./twins.js";
import { Kit } from "./club.js";
import { BIRDS } from "../sim/furniture.mjs";

const P = PALETTE;

// Each bird in its own frame, swimming towards +z, the water at y = 0.
function duck() {
  const k = new Kit();
  k.add(new THREE.CircleGeometry(0.22, 10).rotateX(-Math.PI / 2).scale(0.8, 1, 1.25), P.birdShadow, { at: [0, 0.004, 0] });
  k.add(new THREE.SphereGeometry(0.17, 8, 6).scale(0.72, 0.55, 1), P.duck, { at: [0, 0.06, 0] });
  k.add(new THREE.ConeGeometry(0.06, 0.12, 5).rotateX(-Math.PI / 2 - 0.5), P.duck, { at: [0, 0.1, -0.17] });
  k.add(new THREE.SphereGeometry(0.075, 7, 5), P.duckHead, { at: [0, 0.2, 0.13] });
  k.box(0.045, 0.022, 0.075, P.beak, { at: [0, 0.19, 0.22] });
  return k.mesh().geometry;
}
function swan() {
  const k = new Kit();
  k.add(new THREE.CircleGeometry(0.5, 12).rotateX(-Math.PI / 2).scale(0.8, 1, 1.3), P.birdShadow, { at: [0, 0.004, 0] });
  k.add(new THREE.SphereGeometry(0.38, 10, 7).scale(0.72, 0.48, 1.08), P.swan, { at: [0, 0.12, -0.02] });
  k.add(new THREE.ConeGeometry(0.16, 0.3, 6).rotateX(-Math.PI / 2 - 0.6), P.swan, { at: [0, 0.22, -0.4] });
  k.cyl(0.045, 0.07, 0.6, 7, P.swan, { at: [0, 0.48, 0.27], tilt: [0.25, 0] });
  k.add(new THREE.SphereGeometry(0.075, 7, 5), P.swan, { at: [0, 0.79, 0.36] });
  k.box(0.05, 0.035, 0.12, P.swanBeak, { at: [0, 0.77, 0.46] });
  return k.mesh().geometry;
}

// Bob and drift, from a shared clock (onBeforeRender keeps it).
const time = { value: 0 };
let material = null;
function birdMaterial() {
  if (material) return material;
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uBirdTime = time;
    shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nuniform float uBirdTime;").replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
      #ifdef USE_INSTANCING
        float ph = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.61;
      #else
        float ph = 0.0;
      #endif
      // A slow wander round where it sits, and a little bob (not the
      // patch of dark water under it).
      transformed.x += sin(uBirdTime * 0.11 + ph) * ${(BIRDS.drift * 0.7).toFixed(2)};
      transformed.z += cos(uBirdTime * 0.09 + ph * 1.3) * ${(BIRDS.drift * 0.7).toFixed(2)};
      transformed.y += sin(uBirdTime * 1.6 + ph * 3.0) * 0.012 * step(0.01, position.y);`,
    );
  };
  m.customProgramCacheKey = () => "birds-v1";
  material = withSceneryHooks(m, "sign");
  // (Its node version, on WebGPURenderer: look/nodetwins.js.)
  markTwin(material, "birds", { time, drift: BIRDS.drift * 0.7 });
  return material;
}

// The birds (pondBirds), placed: place(x, z) -> [wx, y, wz] in the world
// (the water's level there), and the turn their frame needs to the world.
// A group of up to two instanced meshes; null if there are none.
// The clock the birds swim and bob by (seconds): the scenery's own, which
// stops while the picture rests (app.js, sim/stillpicture.mjs), so they
// don't jump when it's drawn again.
let clock = () => performance.now() / 1000;
export function setWildlifeClock(fn) {
  clock = fn;
}

export function makeBirds(birds, place, turn = 0) {
  if (!birds?.length) return null;
  const group = new THREE.Group();
  group.userData.birds = birds.length;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const one = new THREE.Vector3(1, 1, 1);
  for (const [kind, make] of [["duck", duck], ["swan", swan]]) {
    const mine = birds.filter((b) => b.kind === kind);
    if (!mine.length) continue;
    const mesh = new THREE.InstancedMesh(make(), birdMaterial(), mine.length);
    mine.forEach((b, i) => {
      const [x, y, z] = place(...b.at);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), b.heading + turn);
      mesh.setMatrixAt(i, m.compose(new THREE.Vector3(x, y, z), q, one));
    });
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.computeBoundingSphere();
    mesh.boundingSphere.radius += BIRDS.drift + 1;
    mesh.onBeforeRender = () => {
      time.value = clock();
    };
    group.add(mesh);
  }
  return group;
}
