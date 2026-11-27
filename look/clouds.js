// The clouds: cumulus built from soft round puffs, lit from the real sun -
// bright tops, soft grey-blue bases - drifting on the wind, in two height
// bands. One instanced mesh for the whole sky (one draw call), where there
// were 34 flat sprites (18 on Standard) that never moved and were scattered
// differently on every load.
//
// Laid out from a seed (the round's, so a replay's sky is the same one),
// with as many showing as the day's sky has cloud (sim/weather.mjs
// skyLook cover). The puffs are sorted back to front a few times a second,
// so a grey base never draws over a bright top. They drift downwind and
// wrap round far out, where they've faded to nothing, to come back in on
// the far side. Tops are never brighter than PALETTE.cloud, never pure
// white, whatever the tone mapping (they aren't tone mapped).
//
// animateClouds (from look/environment.js animateSky) winds the drift on.

import * as THREE from "three";
import { PALETTE } from "./palette.js";
import { seeded } from "../sim/weather.mjs";
import { markTwin } from "./twins.js";

// How far out (metres, each way from the middle of the scene) a cloud goes
// before it wraps round; clouds fade out towards it, so a wrap is never seen.
export const CLOUD_WRAP = 6200;
const MIDDLE = [0, -300];
// Seconds between sorts, and how far the camera may move before one is due
// sooner (metres).
const SORT_EVERY = 0.25;
const SORT_MOVE = 40;

// How many clouds, and puffs in each: High, Standard.
export const CLOUD_COUNTS = { high: { clouds: 24, puffs: 8 }, standard: { clouds: 12, puffs: 5 } };

// How a puff is drawn (the owner, 29 October 2026: "Graphics wise the
// clouds on mobile look horrible"): its edge broken into billows by
// `billow` of its radius, thinning out over `soft` of the way in from it;
// fading, thinner and shrunk by up to `shrink` of it; its own roundness's
// light and shade `round` of what a ball's would be.
export const CLOUD_LOOK = { billow: 0.24, soft: 0.5, shrink: 0.3, round: 0.55 };

const meshes = new Set();

// The layout of the clouds and their puffs, from a seed: pure numbers, so
// the same seed is the same sky. Returns { clouds: [{ x, y, z, rank }],
// puffs: [{ cloud, x, y, z, r, shade }] } - puffs relative to their cloud;
// shade 0 at a cloud's base to 1 at its top; rank 0-1 decides which
// clouds show under a little cover (the lowest ranks show first).
export function cloudLayout(count, perCloud, seed = 1) {
  const r = seeded(seed * 104729 + 3);
  const clouds = [];
  const puffs = [];
  for (let i = 0; i < count; i++) {
    // More of them ahead, where the golfer looks (-z).
    const ahead = r() < 0.6;
    const angle = ahead ? -Math.PI / 2 + (r() - 0.5) * 2.2 : (i / count) * Math.PI * 2 + r() * 0.3;
    const dist = 2400 + r() * 2900;
    // Two bands: fat cumulus low, flatter, smaller ones higher up.
    const high = i % 3 === 2;
    const y = high ? 1150 + r() * 350 : 560 + r() * 320;
    const width = high ? 260 + r() * 260 : 380 + r() * 420;
    clouds.push({ x: Math.cos(angle) * dist + MIDDLE[0], y, z: Math.sin(angle) * dist + MIDDLE[1], rank: (i + r() * 0.8) / count, width });
    for (let k = 0; k < perCloud; k++) {
      // Along the cloud, a dome over a flat base, the biggest puffs in the
      // middle; the first puffs make the base.
      const along = perCloud === 1 ? 0 : (k / (perCloud - 1) - 0.5) * 2 * (0.75 + r() * 0.2);
      const dome = 1 - along * along;
      const base = k % 2 === 0;
      const rad = width * (0.17 + 0.13 * dome + r() * 0.06) * (base ? 0.95 : 0.8);
      const up = base ? rad * 0.35 : rad * (0.55 + dome * 0.7) * (high ? 0.6 : 1);
      puffs.push({
        cloud: i,
        x: along * width * 0.5,
        y: up,
        z: (r() - 0.5) * width * 0.35,
        r: rad,
        shade: Math.min(1, up / (width * 0.42)),
      });
    }
  }
  return { clouds, puffs };
}

// How many of the clouds show (a share, 0 - 1) for a sky's cover: none
// at all on a cloudless day, a few to plenty with sunny spells, all of
// them under an overcast. (It was some even on a clear day - 0.3 and up -
// so there were always clouds: the owner, "there doesn't always need to
// be clouds".)
export const cloudsShowing = (cover) => Math.min(1, 1.7 * Math.max(0, Number.isFinite(cover) ? cover : 0));

const VERTEX = /* glsl */ `
  attribute vec3 aCloud;
  attribute vec4 aPuff;
  attribute vec2 aLook;
  uniform vec2 uDrift;
  uniform vec2 uMiddle;
  uniform float uWrap;
  uniform float uShowing;
  uniform float uSize;
  uniform float uReach;
  uniform vec3 uSun;
  varying vec2 vUv;
  varying float vShade;
  varying float vAlpha;
  varying vec2 vSun;
  varying vec2 vSeed;

  void main() {
    // (Each puff's billows its own: from where it sits in its cloud.)
    vSeed = aPuff.xz * 0.031 + aCloud.xz * 0.0007;
    // The cloud's place, drifted and wrapped round the middle of the scene.
    vec2 c = aCloud.xz + uDrift - uMiddle;
    c = mod(c + uWrap, 2.0 * uWrap) - uWrap + uMiddle;
    vec3 centre = vec3(c.x, aCloud.y, c.y);
    vec3 p = centre + aPuff.xyz * uSize;
    vec4 mv = viewMatrix * vec4(p, 1.0);
    mv.xy += position.xy * aPuff.w * 2.0 * uSize;
    gl_Position = projectionMatrix * mv;
    vUv = position.xy;
    // Lit: tops brighter than bases, and the side towards the sun.
    vShade = aLook.x + 0.25 * dot(normalize(aPuff.xyz + vec3(0.0, 1.0, 0.0)), uSun);
    vec3 sunView = (viewMatrix * vec4(uSun, 0.0)).xyz;
    vSun = normalize(sunView.xy + 1e-4);
    // Faded out far away (before the wrap), and in or out with the cover.
    float d = length(centre.xz - cameraPosition.xz);
    float far = 1.0 - smoothstep(0.72 * uWrap * uReach, 0.95 * uWrap * uReach, d);
    float shown = clamp((uShowing - aLook.y) * 10.0, 0.0, 1.0);
    vAlpha = far * shown;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uBase;
  uniform float uOpacity;
  varying vec2 vUv;
  varying float vShade;
  varying float vAlpha;
  varying vec2 vSun;
  varying vec2 vSeed;

  // (The ground's noise: look/glsl/ground.js gHash, gNoise.)
  float cHash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float cNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(cHash(i), cHash(i + vec2(1.0, 0.0)), u.x), mix(cHash(i + vec2(0.0, 1.0)), cHash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  void main() {
    vec2 q = vUv * 2.0;
    float r = length(q);
    if (r > 1.0 || vAlpha <= 0.0) discard;
    // Its edge broken into small billows (CLOUD_LOOK.billow), not a drawn
    // circle: on a phone's picture each puff read as a hard white ball.
    float edge = ${(1 - CLOUD_LOOK.billow).toFixed(2)} + ${CLOUD_LOOK.billow.toFixed(2)} * (0.65 * cNoise(q * 2.6 + vSeed * 40.0) + 0.35 * cNoise(q * 6.1 + vSeed * 73.0));
    float body = 1.0 - r / edge;
    // Thinning out to its edge over CLOUD_LOOK.soft of the way in; and as
    // it fades (out far off, or in and out with the day's cover) thinner as
    // a whole and shrunk a little from its edge (CLOUD_LOOK.shrink). With
    // hard-rimmed puffs a cloud half faded was a ghost of rings, each puff's
    // outline over the next; shrunk away alone, it broke into separate
    // little balls.
    float gone = (1.0 - vAlpha) * ${CLOUD_LOOK.shrink.toFixed(2)};
    float a = smoothstep(gone, gone + ${CLOUD_LOOK.soft.toFixed(2)}, body) * vAlpha * uOpacity;
    if (a <= 0.003) discard;
    // Lit on the side towards the sun and on top, over the cloud's own
    // shading from base to top - each puff's own roundness held back
    // (CLOUD_LOOK.round), so a cloud is lit as one, not as a heap of balls.
    vec3 n = vec3(q, sqrt(max(0.0, 1.0 - r * r)));
    float towards = dot(n, normalize(vec3(vSun * 0.7, 0.6))) * 0.5 + 0.5;
    float lit = clamp(vShade * 0.55 + (n.y * 0.25 + towards * 0.45 - 0.35) * ${CLOUD_LOOK.round.toFixed(2)} + 0.3, 0.0, 1.0);
    gl_FragColor = vec4(mix(uBase, uTop, lit), a);
    #include <colorspace_fragment>
  }
`;

// The sky's clouds, for addEnvironment. sun: the direction to the sun.
export function makeClouds({ clouds = 24, puffs = 8, sun = new THREE.Vector3(0, 1, 0), seed = 1 } = {}) {
  const quad = new THREE.PlaneGeometry(1, 1);
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.index = quad.index;
  geometry.setAttribute("position", quad.getAttribute("position"));
  const n = clouds * puffs;
  const aCloud = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
  const aPuff = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
  const aLook = new THREE.InstancedBufferAttribute(new Float32Array(n * 2), 2);
  for (const a of [aCloud, aPuff, aLook]) a.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("aCloud", aCloud);
  geometry.setAttribute("aPuff", aPuff);
  geometry.setAttribute("aLook", aLook);
  geometry.instanceCount = n;
  const material = new THREE.ShaderMaterial({
    name: "Clouds",
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uDrift: { value: new THREE.Vector2() },
      uMiddle: { value: new THREE.Vector2(...MIDDLE) },
      uWrap: { value: CLOUD_WRAP },
      uShowing: { value: cloudsShowing(0.35) },
      uSize: { value: 1 },
      // How far out clouds are seen, as a share of the wrap: less in a
      // thick haze (a misty morning's far clouds are lost in it).
      uReach: { value: 1 },
      uSun: { value: sun.clone().normalize() },
      uTop: { value: new THREE.Color(PALETTE.cloud) },
      uBase: { value: new THREE.Color(PALETTE.cloudShade) },
      uOpacity: { value: 0.95 },
    },
    transparent: true,
    depthWrite: false,
    fog: false,
    toneMapped: false,
  });
  // Its node version on WebGPURenderer (look/glsl/cloudnode.js), reading
  // these uniforms.
  markTwin(material, "clouds", { uniforms: material.uniforms });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "clouds";
  mesh.frustumCulled = false;
  mesh.userData.clouds = { count: clouds, perCloud: puffs, sortedAt: -Infinity, at: new THREE.Vector3(Infinity, 0, 0), sorts: 0 };
  layClouds(mesh, seed);
  mesh.onBeforeRender = (renderer, scene, camera) => sortPuffs(mesh, camera);
  meshes.add(mesh);
  return mesh;
}

// Lays the clouds out again from a seed (a new round's).
export function layClouds(mesh, seed = 1) {
  const c = mesh.userData.clouds;
  c.layout = cloudLayout(c.count, c.perCloud, seed);
  c.seed = seed;
  c.sortedAt = -Infinity;
}

// The day's sky on the clouds: how many show, how big and heavy they are.
// look: sim/weather.mjs skyLook's.
export function skyClouds(mesh, look) {
  const u = mesh.material.uniforms;
  u.uShowing.value = cloudsShowing(look.cover);
  // Heavier skies: bigger, more solid clouds with darker bases.
  u.uSize.value = 1 + 0.55 * Math.max(0, look.cover - 0.35);
  u.uOpacity.value = 0.9 + 0.08 * look.cover;
  // (The palette's cloudShade drawn towards a rain cloud's slate by the
  // sky's grey.)
  u.uBase.value.set(PALETTE.cloudShade).lerp(new THREE.Color(PALETTE.cloudSlate), look.grey * 0.8);
}

// Back to front from the camera, so the nearer puff always draws over the
// further (a grey base never over a bright top) - a few times a second,
// or sooner if the camera has moved far.
function sortPuffs(mesh, camera) {
  const c = mesh.userData.clouds;
  const now = performance.now() / 1000;
  const cam = camera.getWorldPosition(tmp);
  if (now - c.sortedAt < SORT_EVERY && cam.distanceToSquared(c.at) < SORT_MOVE * SORT_MOVE) return;
  c.sortedAt = now;
  c.at.copy(cam);
  c.sorts++;
  const u = mesh.material.uniforms;
  const size = u.uSize.value;
  const [dx, dz] = [u.uDrift.value.x, u.uDrift.value.y];
  const W = CLOUD_WRAP;
  const wrap = (v, m) => ((((v - m + W) % (2 * W)) + 2 * W) % (2 * W)) - W + m;
  const { clouds, puffs } = c.layout;
  const centres = clouds.map((k) => [wrap(k.x + dx, MIDDLE[0]), k.y, wrap(k.z + dz, MIDDLE[1])]);
  const order = puffs.map((p, i) => {
    const k = centres[p.cloud];
    const x = k[0] + p.x * size - cam.x;
    const y = k[1] + p.y * size - cam.y;
    const z = k[2] + p.z * size - cam.z;
    return [x * x + y * y + z * z, i];
  });
  order.sort((a, b) => b[0] - a[0]);
  const g = mesh.geometry;
  const ac = g.getAttribute("aCloud").array;
  const ap = g.getAttribute("aPuff").array;
  const al = g.getAttribute("aLook").array;
  order.forEach(([, i], j) => {
    const p = puffs[i];
    const k = clouds[p.cloud];
    ac.set([k.x, k.y, k.z], j * 3);
    ap.set([p.x, p.y, p.z, p.r], j * 4);
    al.set([p.shade, k.rank], j * 2);
  });
  for (const name of ["aCloud", "aPuff", "aLook"]) g.getAttribute(name).needsUpdate = true;
}
const tmp = new THREE.Vector3();

// How far out the clouds are seen in a haze `times` a fair day's.
export const cloudReach = (times) => 1 / (1 + 0.6 * Math.max(0, times - 1));

// Winds every sky's clouds on by `step` metres downwind ([dx, dz] a unit
// direction), kept within one wrap so the numbers stay small.
export function animateClouds(step, [dx, dz]) {
  for (const m of meshes) {
    if (!m.parent) {
      meshes.delete(m);
      continue;
    }
    const d = m.material.uniforms.uDrift.value;
    d.x = (d.x + dx * step) % (2 * CLOUD_WRAP);
    d.y = (d.y + dz * step) % (2 * CLOUD_WRAP);
  }
}
