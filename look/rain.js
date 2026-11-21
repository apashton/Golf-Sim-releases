// Rain: thin, pale blue-grey streaks (PALETTE.rain, never white) falling in
// a box that follows whichever camera is drawing, slanting with the wind.
// One instanced mesh, moved entirely on the graphics card: each streak's
// place is worked out in the vertex shader from its own seed, the clock
// and the camera, so there's no work per streak on the CPU.
//
// Kept out of the way of play: at most RAIN_ALPHA opaque, sparse, faded out
// within 2 m of the camera (so nothing swells up as the chase camera
// passes through it) and again towards the box's edge, and drawn before
// the tracer (renderOrder 1 against its 2), which is drawn after other
// see-through things, so the tracer is never greyed by it. It's part of
// the 3D picture, so recordings show it.
//
// How hard it's raining is look/weatherlook.js's rain (0 - 1, eased as a
// shower comes and goes between shots): the streaks drawn and their
// strength both follow it. High draws 6000, Standard 1500; High sheds down
// to Standard's count first when the picture stays slow (look/safety.js).

import * as THREE from "three";
import { PALETTE } from "./palette.js";
import { HIGH } from "./quality.js";
import { registerStep, isShed } from "./safety.js";
import { lens, lensDrops, heatShimmer } from "./lens.js";
import { markTwin } from "./twins.js";

export const RAIN_COUNTS = { high: 6000, standard: 1500 };
// The most opaque a streak gets (at the heart of the box, in full rain).
export const RAIN_ALPHA = 0.3;
// Streaks fade out nearer the camera than this (metres), and are gone by
// RAIN_NEAR_GONE.
export const RAIN_NEAR = 2;
export const RAIN_NEAR_GONE = 1.2;
// The box round the camera (metres across, and high).
export const RAIN_BOX = [44, 26, 44];
// How fast rain falls (m/s), and how long a streak is (seconds of fall: a
// camera's blur).
const FALL = 9;
const STREAK = 0.045;

const meshes = new Set();
let shed = false;

// The safety valve's first step: rain down to Standard's count - a count
// switched, nothing rebuilt.
registerStep(1, "rain", (on) => {
  shed = on;
});

const VERTEX = /* glsl */ `
  attribute vec3 aSeed;
  uniform float uTime;
  uniform vec3 uBox;
  uniform vec3 uWind;
  uniform float uFall;
  varying float vAlpha;

  void main() {
    // Where this streak is now: falling (and blown) through a box that
    // wraps round the camera, so the rain stays put in the world as the
    // camera moves through it.
    vec3 vel = vec3(uWind.x, -uFall, uWind.z);
    // Each streak falls at its own pace, a little.
    vec3 p = aSeed * uBox + vel * uTime * (0.85 + 0.3 * aSeed.y);
    vec3 half_ = uBox * 0.5;
    p = mod(p - cameraPosition + half_, uBox) - half_ + cameraPosition;
    // The streak: from here back along its fall, a camera's blur long.
    vec3 tail = p - vel * ${STREAK.toFixed(3)};
    vec3 at = mix(p, tail, position.y + 0.5);
    vec4 mv = viewMatrix * vec4(at, 1.0);
    // About two pixels wide at any distance (a metre in 400 per metre off).
    vec4 a = viewMatrix * vec4(p, 1.0);
    vec4 b = viewMatrix * vec4(tail, 1.0);
    vec2 along = normalize((b.xy / max(0.1, -b.z)) - (a.xy / max(0.1, -a.z)) + vec2(1e-5, 0.0));
    vec2 side = vec2(-along.y, along.x);
    float d = -mv.z;
    mv.xy += side * position.x * max(0.008, d * 0.0025);
    gl_Position = projectionMatrix * mv;
    // Faded out close to the camera and towards the edge of the box.
    float r = length(p - cameraPosition);
    vAlpha = smoothstep(${RAIN_NEAR_GONE.toFixed(2)}, ${RAIN_NEAR.toFixed(2)}, r) * (1.0 - smoothstep(0.3 * uBox.x, 0.5 * uBox.x, r));
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uStrength;
  varying float vAlpha;

  void main() {
    gl_FragColor = vec4(uColor, vAlpha * uStrength * ${RAIN_ALPHA.toFixed(2)});
    #include <colorspace_fragment>
  }
`;

// A scene's rain (hidden until it rains). seed: any number.
export function makeRain({ count = HIGH ? RAIN_COUNTS.high : RAIN_COUNTS.standard, seed = 3 } = {}) {
  const quad = new THREE.PlaneGeometry(1, 1);
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.index = quad.index;
  geometry.setAttribute("position", quad.getAttribute("position"));
  const seeds = new Float32Array(count * 3);
  let x = seed;
  for (let i = 0; i < seeds.length; i++) seeds[i] = (x = (x * 16807) % 2147483647) / 2147483647;
  geometry.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 3));
  geometry.instanceCount = 0;
  const material = new THREE.ShaderMaterial({
    name: "Rain",
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uBox: { value: new THREE.Vector3(...RAIN_BOX) },
      uWind: { value: new THREE.Vector3() },
      uFall: { value: FALL },
      uColor: { value: new THREE.Color(PALETTE.rain) },
      uStrength: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    fog: false,
    // Each streak is turned to face the camera in the vertex shader, which
    // way round depends on the wind: both faces drawn.
    side: THREE.DoubleSide,
  });
  // (Its node version, on WebGPURenderer: glsl/bitsnode.js.)
  markTwin(material, "rain", { uniforms: material.uniforms, streak: STREAK, alpha: RAIN_ALPHA, near: RAIN_NEAR, gone: RAIN_NEAR_GONE });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "rain";
  mesh.frustumCulled = false;
  mesh.renderOrder = 1;
  mesh.visible = false;
  mesh.userData.rain = { max: count };
  meshes.add(mesh);
  return mesh;
}

// How many streaks to draw for a rain strength (0 - 1): fewer in a light
// shower, never more than Standard's once the valve has shed rain.
export function rainCount(max, strength, shedNow = false) {
  const cap = shedNow ? Math.min(max, RAIN_COUNTS.standard) : max;
  return Math.round(cap * Math.min(1, Math.max(0, strength)));
}

// Once a frame (look/environment.js animateSky): time (s), weather:
// look/weatherlook.js's values. The wind carries the rain across at about
// half its speed at head height (m/s a mph).
export function animateRain(time, weather) {
  const strength = weather?.rain ?? 0;
  // (Drops on the lens, for look/effects.js.)
  lens.rain = lensDrops(strength);
  lens.heat = heatShimmer(weather?.dry);
  lens.sun = Math.max(0, Math.min(1, weather?.sun ?? 1)) * (1 - Math.min(1, strength * 2));
  lens.time = time;
  const [dx, dz] = weather && !weather.still ? weather.dir : [0, 0];
  const wind = weather && !weather.still ? weather.gusting * 0.447 * 0.5 : 0;
  const nowShed = shed || isShed("rain");
  for (const m of meshes) {
    if (!m.parent) {
      meshes.delete(m);
      continue;
    }
    const n = rainCount(m.userData.rain.max, strength, nowShed);
    m.visible = n > 0 && strength > 0.01;
    m.geometry.instanceCount = n;
    const u = m.material.uniforms;
    u.uTime.value = time % 3600;
    u.uWind.value.set(dx * wind, 0, dz * wind);
    u.uStrength.value = Math.min(1, strength * 1.25);
  }
}
