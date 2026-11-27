// Ultra's clouds in three dimensions (sim/volclouds.mjs has the numbers):
// a dome round the camera, just inside its far plane, whose every pixel
// steps along its line of sight through the layer of cloud, gathering
// what cloud it passes - shaped by the drifting map the ground's cloud
// shadows come from (look/glsl/cloudshade.js), billowed by a 3D noise -
// and lighting each step by how much cloud lies between it and the sun.
// Drawn after the ground and the trees, which hide it, and before what's
// see-through. In place of the puffs (look/clouds.js), which come back if
// the safety valve sheds it.

import * as THREE from "three";
import { PALETTE } from "./palette.js";
import { cloudUniforms, CLOUD_SHADOW_TILE } from "./glsl/cloudshade.js";
import { VOL, tilingNoise3D, cloudThreshold } from "../sim/volclouds.mjs";
import { markTwin } from "./twins.js";

let noise = null;
function noiseTexture() {
  if (noise) return noise;
  const n = VOL.noise;
  noise = new THREE.Data3DTexture(tilingNoise3D(), n, n, n);
  noise.format = THREE.RedFormat;
  noise.type = THREE.UnsignedByteType;
  noise.wrapS = noise.wrapT = noise.wrapR = THREE.RepeatWrapping;
  noise.magFilter = noise.minFilter = THREE.LinearFilter;
  noise.unpackAlignment = 1;
  noise.needsUpdate = true;
  return noise;
}

const VERTEX = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp sampler3D;
  uniform sampler2D csMap;
  uniform vec2 csDrift;
  uniform float csLo;
  uniform sampler3D vNoise;
  uniform vec3 vSun;
  uniform vec3 vTop;
  uniform vec3 vBase;
  uniform vec3 vHaze;
  uniform float vDensity;
  uniform float vReach;
  uniform float vGrey;
  varying vec3 vWorld;

  const float BASE = ${VOL.base.toFixed(1)};
  const float TOP = ${VOL.top.toFixed(1)};
  const float REACH = ${VOL.reach.toFixed(1)};

  // How much cloud at p (0 - 1): where the map has cloud - read where this
  // spot's shadow falls, so the two go together - shaped into a flat base
  // and a rounded top, billowed by the noise.
  // far: 0 near to 1 a long way off, where the fine fraying is left out -
  // the steps are too far apart there to catch it, and it showed as grain.
  float cloudAt(vec3 p, float far) {
    // (Shifted by the same amount through the cloud's whole height - from
    // its middle - or a low sun shears every cloud into a long slab.)
    vec2 g = p.xz - vSun.xz * (${((VOL.base + VOL.top) / 2).toFixed(1)} / max(vSun.y, 0.1));
    vec3 q = vec3(p.x - csDrift.x, p.y, p.z - csDrift.y);
    // Their outlines billowed by the noise, not cut straight down.
    vec2 warp = vec2(texture(vNoise, q / 520.0).r, texture(vNoise, q / 520.0 + 0.5).r) - 0.5;
    float m = texture2D(csMap, (g + warp * 340.0 - csDrift) / ${CLOUD_SHADOW_TILE.toFixed(1)}).r;
    float cover = smoothstep(csLo, csLo + 0.22, m);
    if (cover <= 0.0) return 0.0;
    float h = (p.y - BASE) / (TOP - BASE);
    // A flat base and a rounded top, taller in the middle of a cloud than
    // at its edge.
    float shape = smoothstep(0.0, 0.1, h) * (1.0 - smoothstep(cover * 0.8 - 0.25, cover * 0.8 + 0.05, h));
    if (shape <= 0.0) return 0.0;
    float big = texture(vNoise, q / ${VOL.big.toFixed(1)}).r;
    float small = mix(texture(vNoise, q / ${VOL.small.toFixed(1)} + 0.37).r, 0.6, far);
    // Broken into separate heaps by the noise, their edges frayed.
    return clamp((cover * shape - (1.0 - big) * 0.85 - (1.0 - small) * 0.3) * 2.5, 0.0, 1.0);
  }

  void main() {
    vec3 dir = normalize(vWorld - cameraPosition);
    if (dir.y < 0.015) discard;
    float t0 = max(0.0, (BASE - cameraPosition.y) / dir.y);
    float t1 = min(REACH * vReach, (TOP - cameraPosition.y) / dir.y);
    if (t0 >= t1) discard;
    float len = t1 - t0;
    float stepLen = len / ${VOL.steps.toFixed(1)};
    // A different start along the line a pixel, so the steps don't show as
    // bands (smoothed away by the picture's own blending).
    float jitter = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    float trans = 1.0;
    vec3 col = vec3(0.0);
    for (int i = 0; i < ${VOL.steps}; i++) {
      float t = t0 + (float(i) + jitter) * stepLen;
      vec3 p = cameraPosition + dir * t;
      float far = smoothstep(2500.0, 6000.0, t);
      float d = cloudAt(p, far);
      if (d <= 0.001) continue;
      // Towards the sun: how much cloud is in the way.
      float shade = 0.0;
      for (int k = 1; k <= ${VOL.light}; k++) shade += cloudAt(p + vSun * (float(k) * 70.0), far);
      float lit = exp(-shade * 1.1);
      // Brighter the higher in the cloud (the sky's light from above), and
      // the sun's silver lining round the edges looking towards it.
      float up = clamp((p.y - BASE) / (TOP - BASE), 0.0, 1.0);
      float lining = pow(max(dot(dir, vSun), 0.0), 8.0) * (1.0 - d) * 0.6;
      vec3 c = mix(vBase, vTop, clamp(lit * 0.8 + up * 0.25 + lining - 0.1, 0.0, 1.0));
      // Further off, lost in the haze.
      c = mix(c, vHaze, smoothstep(REACH * vReach * ${(1 - VOL.fade).toFixed(2)}, REACH * vReach, t) * 0.85);
      float a = 1.0 - exp(-d * vDensity * min(stepLen, 120.0) * 0.03);
      col += trans * a * c;
      trans *= 1.0 - a;
      if (trans < 0.03) break;
    }
    float alpha = 1.0 - trans;
    if (alpha < 0.004) discard;
    // Faded out towards the horizon, as the puffs were.
    alpha *= smoothstep(0.015, 0.08, dir.y);
    gl_FragColor = vec4(col / max(1.0 - trans, 1e-4), alpha);
    #include <colorspace_fragment>
  }
`;

// The 3D clouds for a scene, around its camera (a mesh to add to the
// scene). sun: the direction to the sun.
export function makeVolumeClouds(sun) {
  const material = new THREE.ShaderMaterial({
    name: "VolumeClouds",
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      ...cloudUniforms,
      vNoise: { value: noiseTexture() },
      vSun: { value: sun.clone().normalize() },
      vTop: { value: new THREE.Color(PALETTE.cloud) },
      vBase: { value: new THREE.Color(PALETTE.cloudShade) },
      vHaze: { value: new THREE.Color(PALETTE.fog) },
      vDensity: { value: 1 },
      vReach: { value: 1 },
      vGrey: { value: 0 },
    },
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    fog: false,
    toneMapped: false,
  });
  // Its node version on WebGPURenderer (look/glsl/volcloudnode.js), reading
  // these uniforms.
  markTwin(material, "volclouds", { uniforms: material.uniforms });
  // Just inside the camera's far plane (6000 m), wherever the camera is.
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(5200, 32, 16), material);
  mesh.name = "clouds";
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  mesh.userData.volumeClouds = true;
  mesh.userData.lo = cloudThreshold(0.35);
  mesh.onBeforeRender = (renderer, scene, camera) => {
    camera.getWorldPosition(mesh.position);
    mesh.updateMatrixWorld();
    // This scene's sky's, for the ground's shadows too (one scene's on
    // show at a time; the ground's drawn before the clouds, so it takes
    // it from the frame before).
    cloudUniforms.csLo.value = mesh.userData.lo;
  };
  return mesh;
}

// The day's sky on them (sim/weather.mjs skyLook's): how much of it is
// cloud (which moves the ground's shadows with it), how thick, how grey
// underneath.
export function skyVolumeClouds(mesh, look) {
  const u = mesh.material.uniforms;
  mesh.userData.lo = cloudThreshold(look.cover);
  u.vDensity.value = 0.8 + 1.4 * look.cover;
  u.vBase.value.set(PALETTE.cloudShade).lerp(new THREE.Color(PALETTE.cloudSlate), look.grey * 0.8);
  u.vGrey.value = look.grey;
}
