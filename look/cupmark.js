// Marks round the cup so it can be found from anywhere: a soft yellow glow
// on the grass round its edge, breathing in and out, never thinner on
// screen than a few pixels (so it still shows from the far end of a long
// putt or from the fairway), and a faint yellow circle closing in from 2 ft
// to the hole, again and again,
// pointing it out - starting further out when seen from far away, so it's
// always a few dozen pixels across as it starts.
//
// One flat disc laid on the green at the cup, tilted to the slope there,
// drawn by a shader (what's drawn where is worked out from the distance to
// the cup's middle); update(camera, dt) each frame sizes both by how far
// the camera is.

import * as THREE from "three";
import { CUP_MARK } from "../sim/cupmark.mjs";
import { markTwin } from "./twins.js";

const VERT = /* glsl */ `
varying vec2 vLocal;
void main() {
  vLocal = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const FRAG = /* glsl */ `
uniform float uScale;
uniform float uCup;
uniform float uRingIn;
uniform float uRingW;
uniform vec3 uRingColor;
uniform float uGlowA;
uniform float uPulseR;
uniform float uPulseW;
uniform float uPulseA;
uniform vec3 uPulseColor;
varying vec2 vLocal;
void main() {
  float d = length(vLocal) * uScale;
  if (d < uCup) discard;
  // Soft edges a tenth of their width, so neither shimmers.
  float r0 = uCup + uRingIn;
  // A glow: full at the cup's edge, fading out across its width.
  float ring = smoothstep(r0 - uRingW * 0.1, r0, d) * pow(1.0 - smoothstep(r0, r0 + uRingW, d), 1.5);
  float pulse = uPulseA * (1.0 - smoothstep(uPulseW * 0.35, uPulseW * 0.5, abs(d - uPulseR)));
  vec4 col = vec4(uRingColor, uGlowA * ring);
  // The pulse over the glow where they meet.
  col.rgb = mix(col.rgb, uPulseColor, pulse / max(0.001, max(pulse, col.a)));
  col.a = max(col.a, pulse);
  if (col.a < 0.01) discard;
  gl_FragColor = col;
  #include <colorspace_fragment>
}
`;

export class CupMark {
  // at: the cup's middle (world Vector3, on the surface); normal: the
  // green's up there; radius: the cup's (metres); ringIn: how far outside
  // the cup's edge the glow starts (clear of a coloured cup's painted
  // ring).
  constructor({ at, normal = new THREE.Vector3(0, 1, 0), radius, ringIn = 0 }) {
    this.radius = radius;
    this.time = 0;
    this.uniforms = {
      uScale: { value: 1 },
      uCup: { value: radius },
      uRingIn: { value: ringIn },
      uRingW: { value: CUP_MARK.ringMin },
      uRingColor: { value: new THREE.Color(CUP_MARK.ringColor) },
      uGlowA: { value: CUP_MARK.glowLow },
      uPulseR: { value: CUP_MARK.pulseFrom },
      uPulseW: { value: CUP_MARK.pulseMin },
      uPulseA: { value: 0 },
      uPulseColor: { value: new THREE.Color(CUP_MARK.pulseColor) },
    };
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -4,
    });
    // (Its node version, on WebGPURenderer: glsl/bitsnode.js.)
    markTwin(material, "cupmark", { uniforms: this.uniforms });
    // A unit disc in its own x-y plane, turned to lie on the green.
    this.mesh = new THREE.Mesh(new THREE.CircleGeometry(1, 64), material);
    this.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal.clone().normalize());
    this.mesh.position.copy(at).addScaledVector(normal, 0.004);
    this.mesh.renderOrder = 2;
    this.mesh.frustumCulled = false;
  }

  // Sized for how far the camera is, and the pulse moved on by dt seconds.
  update(camera, dt = 0) {
    if (!camera) return;
    this.time += dt;
    const dist = camera.position.distanceTo(this.mesh.position);
    // How steeply it's seen: a ring seen low along the green is squashed.
    const sinUp = dist > 1e-6 ? (camera.position.y - this.mesh.position.y) / dist : 1;
    const look = CUP_MARK.look(dist, camera.fov, this.time, this.radius, sinUp);
    const u = this.uniforms;
    u.uRingW.value = look.ringW;
    u.uGlowA.value = look.glowA;
    u.uPulseR.value = look.pulseR;
    u.uPulseW.value = look.pulseW;
    u.uPulseA.value = look.pulseA;
    // Big enough for the furthest thing drawn on it.
    const reach = Math.max(this.radius + u.uRingIn.value + look.ringW, look.pulseFrom + look.pulseW) * 1.05;
    u.uScale.value = reach;
    this.mesh.scale.setScalar(reach);
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
