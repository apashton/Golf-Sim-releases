// The cloud-shade hook: every lit piece of scenery (ground, sand, water,
// paths, walls, trunks, crowns, leaf cards, dressing, signs) runs this once
// in its fragment shader, after its lights are summed, so a cloud's shadow
// can dim the sun on all of them alike without each material being edited.
// It dims the sun under the clouds' drifting shadows (look/environment.js
// animateSky winds them on with the clouds). Its uniforms are shared by
// every material (cloudUniforms), set once a frame from look/weatherlook.js.
//
// What a filled-in hook has to work with, in the fragment shader:
//   csWorld          the fragment's world position (a varying set here,
//                    instances and batches included)
//   reflectedLight   the light summed so far: scale directDiffuse and
//                    directSpecular for the sun's share
// Changing what it does must change CLOUDSHADE_KEY, so every program using
// it is built again.

import * as THREE from "three";
import { sunlight, SUN_ELEVATION } from "../../sim/weather.mjs";
import { LEVEL } from "../quality.js";
import { loadSetting } from "../../util.js";
import { effectsInUse } from "../../sim/effects.mjs";

export const CLOUDSHADE_KEY = "cs2";

// The clouds' shadows: soft blobs 150 m and more across, from a small
// tiling noise texture (one read a pixel), swept downwind with the clouds
// (csDrift, metres) and as strong as the day's sky makes them
// (csStrength: look/weatherlook.js cloudShadow - the share of a flat,
// sunlit patch of grass's light they take away at their darkest; the sun's
// own share is dimmed by that over its part of the whole).
export const CLOUD_SHADOW_TILE = 2600; // metres the texture repeats over
const SIZE = 64;

// A smooth, tiling noise: random values on a coarse grid, smoothly
// interpolated (it wraps at the edges, so it tiles), 0 - 1.
export function cloudShadowNoise(size = SIZE, cells = 8, seed = 11) {
  let x = seed;
  const rand = () => ((x = (x * 16807) % 2147483647) / 2147483647);
  const grid = Array.from({ length: cells * cells }, rand);
  const at = (i, j) => grid[((j + cells) % cells) * cells + ((i + cells) % cells)];
  const out = new Uint8Array(size * size);
  const s = (t) => t * t * (3 - 2 * t);
  for (let v = 0; v < size; v++) {
    for (let u = 0; u < size; u++) {
      const fx = (u / size) * cells;
      const fy = (v / size) * cells;
      const i = Math.floor(fx);
      const j = Math.floor(fy);
      const tx = s(fx - i);
      const ty = s(fy - j);
      const a = at(i, j) + (at(i + 1, j) - at(i, j)) * tx;
      const b = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * tx;
      out[v * size + u] = Math.round((a + (b - a) * ty) * 255);
    }
  }
  return out;
}

function noiseTexture() {
  const t = new THREE.DataTexture(cloudShadowNoise(), SIZE, SIZE, THREE.RedFormat, THREE.UnsignedByteType);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

// A flat, sunlit patch's light is this much the sun's (the rest the sky's
// fill), on a fair day - with the sun as this page was built, harder or
// not (sim/effects.mjs hardsun; sim/weather.mjs sunlight): the sun's part
// is dimmed by strength / this, so the whole is dimmed by strength. The
// node hooks (nodehooks.js) use the same share.
const LIGHT = sunlight({ hard: effectsInUse(loadSetting("effects", {}), LEVEL).hardsun });
export const SUN_SHARE = (LIGHT.sun * Math.sin((SUN_ELEVATION * Math.PI) / 180)) / (LIGHT.sun * Math.sin((SUN_ELEVATION * Math.PI) / 180) + LIGHT.sky);

// Shared by every material that runs the hook.
export const cloudUniforms = {
  csMap: { value: noiseTexture() },
  csDrift: { value: new THREE.Vector2() },
  csStrength: { value: 0 },
  // Where on the map cloud starts (0.5 as it always was; on Ultra the
  // day's, so the shadows go with its 3D clouds: look/volclouds.js).
  csLo: { value: 0.5 },
};

// Declarations (fragment), and the code that runs after the lights.
export const CLOUDSHADE_PARS = /* glsl */ `
uniform sampler2D csMap;
uniform vec2 csDrift;
uniform float csStrength;
uniform float csLo;
`;
export const CLOUDSHADE = /* glsl */ `
if ( csStrength > 0.0 ) {
  float csN = texture2D( csMap, ( csWorld.xz - csDrift ) / ${CLOUD_SHADOW_TILE.toFixed(1)} ).r;
  float csShade = smoothstep( csLo, csLo + 0.2, csN ) * min( 0.95, csStrength / ${SUN_SHARE.toFixed(4)} );
  reflectedLight.directDiffuse *= 1.0 - csShade;
  reflectedLight.directSpecular *= 1.0 - csShade;
}
`;

// Winds the shadows on with the clouds (metres; [dx, dz] the way the wind
// blows) and sets how strong they are. The node hooks watch this.
const cloudWatchers = new Set();
export function watchCloudShade(fn) {
  cloudWatchers.add(fn);
  return fn;
}

export function animateCloudShade(step, [dx, dz], strength) {
  const d = cloudUniforms.csDrift.value;
  d.x = (d.x + dx * step) % CLOUD_SHADOW_TILE;
  d.y = (d.y + dz * step) % CLOUD_SHADOW_TILE;
  cloudUniforms.csStrength.value = strength;
  for (const fn of cloudWatchers) fn(cloudUniforms);
}

// Adds the hook to a shader (in onBeforeCompile).
export function cloudShade(shader) {
  Object.assign(shader.uniforms, cloudUniforms);
  if (!CLOUDSHADE && !CLOUDSHADE_PARS) return shader;
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nvarying vec3 csWorld;")
    // (From the view position, so an instance or a batch's own place is in it.)
    .replace("#include <project_vertex>", "#include <project_vertex>\ncsWorld = (vec4(mvPosition.xyz, 0.0) * viewMatrix).xyz + cameraPosition;");
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", `#include <common>\nvarying vec3 csWorld;\n${CLOUDSHADE_PARS}`)
    .replace("#include <lights_fragment_end>", `#include <lights_fragment_end>\n${CLOUDSHADE}`);
  return shader;
}
