// Ultra: motes of pollen and dust drifting in the air round the camera,
// caught by the sun - bright specks looking towards it, all but gone
// looking away - and none in rain or under a grey sky (look/lens.js sun).
// One draw of points in a box that moves with the camera, each wrapped
// round inside it as it drifts, so there are always some near.

import * as THREE from "three";
import { lens } from "./lens.js";
import { easedShare } from "./renderscale.js";
import { nodeKit, quadCopies } from "./gpu.js";

const BOX = 24;
const COUNT = 420;

const VERTEX = /* glsl */ `
  uniform float mTime;
  uniform vec3 mSun;
  uniform float mBox;
  uniform float mScale;
  attribute vec4 mSeed;
  varying float mGlow;
  void main() {
    // Drifting slowly, wandering, each its own way; wrapped round the camera.
    vec3 p = position + vec3(0.18, 0.03, 0.11) * mTime + 0.35 * vec3(sin(mTime * 0.4 + mSeed.x * 6.3), sin(mTime * 0.3 + mSeed.y * 6.3), cos(mTime * 0.37 + mSeed.z * 6.3));
    vec3 rel = mod(p - cameraPosition + mBox * 0.5, mBox) - mBox * 0.5;
    vec3 world = cameraPosition + rel;
    vec4 mv = viewMatrix * vec4(world, 1.0);
    gl_Position = projectionMatrix * mv;
    float d = length(rel);
    // Light scattered forwards: they show against the sun.
    vec3 toCam = normalize(-rel);
    float towards = max(dot(-toCam, mSun), 0.0);
    mGlow = (0.08 + pow(towards, 6.0) * 1.6) * (1.0 - smoothstep(mBox * 0.3, mBox * 0.5, d)) * smoothstep(0.6, 1.5, d) * (0.5 + 0.5 * mSeed.w);
    // (Pixels of the picture they're drawn into: the same size on screen
    // in a smaller one, while the camera flies - look/renderscale.js.)
    gl_PointSize = clamp(90.0 / max(-mv.z, 0.5), 1.0, 4.0) * mScale;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform float mSunny;
  varying float mGlow;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float a = (1.0 - smoothstep(0.2, 0.5, length(c))) * mGlow * mSunny;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vec3(1.0, 0.94, 0.78) * a, a);
  }
`;

export function makeMotes(sun) {
  const pos = new Float32Array(COUNT * 3);
  const seed = new Float32Array(COUNT * 4);
  let s = 12345;
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < COUNT; i++) {
    pos.set([(rand() - 0.5) * BOX, (rand() - 0.5) * BOX * 0.5, (rand() - 0.5) * BOX], i * 3);
    seed.set([rand(), rand(), rand(), rand()], i * 4);
  }
  const uniforms = {
    mTime: { value: 0 },
    mSun: { value: sun.clone().normalize() },
    mBox: { value: BOX },
    mSunny: { value: 1 },
    mScale: { value: 1 },
  };
  // On WebGPURenderer, which draws a point a pixel across: a copy of a
  // small square for each mote (look/gpu.js quadCopies), placed and sized
  // as WebGL's points are (look/glsl/spritenode.js).
  const kit = nodeKit();
  if (kit) {
    const geo = quadCopies(COUNT);
    geo.setAttribute("mBase", new THREE.InstancedBufferAttribute(pos, 3));
    geo.setAttribute("mSeed", new THREE.InstancedBufferAttribute(seed, 4));
    return moving(new THREE.Mesh(geo, kit.moteNodeMaterial(uniforms)));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("mSeed", new THREE.BufferAttribute(seed, 4));
  const material = new THREE.ShaderMaterial({
    name: "Motes",
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
  });
  return moving(new THREE.Points(geo, material));
}

// The motes as they're drawn: named, never culled (they're always round
// the camera), and moved on by the lens's clock.
function moving(points) {
  const { material } = points;
  points.name = "motes";
  points.frustumCulled = false;
  points.onBeforeRender = () => {
    material.uniforms.mTime.value = lens.time;
    material.uniforms.mSunny.value = lens.sun * lens.sun;
    material.uniforms.mScale.value = easedShare();
  };
  return points;
}
