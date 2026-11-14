// The detail textures (tools/textures.mjs draws them; public/textures):
// grass blades, bunker sand, four kinds of bark, and the paths' and walls'
// surfaces (asphalt, concrete, gravel, wood, brick), each a grey tile that
// repeats without a seam, with a normal map in its other two channels so
// the sun catches the blades, the grains and the bark's ridges. The
// palette and the shaders give the colour - each texture only adds detail
// about an average of 1, so every course, weather and season keeps its
// look.
//
// High graphics only: Standard keeps the shader-only detail it always had,
// and never loads them.
//
// Every material that uses one shares the same uniform (textureUniforms),
// so one load reaches them all. Until a texture has loaded the uniform
// holds a flat, neutral one (no detail, no lean): never a black ground.
// Cheap to draw: a texture read is one of the fastest things a graphics
// card does; they cost graphics memory (about 24 MB with their mipmaps)
// and almost no CPU.

import * as THREE from "three";
import { EXTRA, PHONE } from "./quality.js";

// Where they're served from (the server serves public/), and the bark's
// four kinds in their layer order (BARK_LAYER).
const DIR = "/textures/";
export const BARK_KINDS = ["furrowed", "plates", "birch", "plane"];
export const BARK_LAYER = Object.fromEntries(BARK_KINDS.map((k, i) => [k, i]));
// Paths' and walls' (look/paths.js, look/walls.js), in their layer order.
export const BUILT_KINDS = ["asphalt", "concrete", "gravel", "wood", "brick"];
export const BUILT_LAYER = Object.fromEntries(BUILT_KINDS.map((k, i) => [k, i]));

// A texture's three channels when flat and plain: brightness 0.75, no lean.
const NEUTRAL = [191, 128, 128, 255];

function neutral2D() {
  const t = new THREE.DataTexture(new Uint8Array(NEUTRAL), 1, 1);
  t.needsUpdate = true;
  return t;
}
function neutralArray(layers) {
  const data = new Uint8Array(4 * layers);
  for (let i = 0; i < layers; i++) data.set(NEUTRAL, i * 4);
  const t = new THREE.DataArrayTexture(data, 1, 1, layers);
  t.needsUpdate = true;
  return t;
}

// Shared by every material that uses them: { value } objects, so a
// texture swapped in on loading reaches every material at once.
export const textureUniforms = {
  tGrass: { value: null },
  tSand: { value: null },
  tBark: { value: null },
  tBuilt: { value: null },
};

// How a detail texture is sampled: repeating, mipmapped, filtered at
// grazing angles (a fairway seen from the tee: on High, as sharply as the
// graphics card can, almost free), its values as they are (not colours).
function detail(t) {
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = EXTRA ? 16 : 8;
  t.colorSpace = THREE.NoColorSpace;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

let started = false;
// Each load under way, settled (loaded or not), for detailTexturesSettled.
const loads = [];

// The uniforms, with the textures on their way (first call starts the
// loads). Safe to call any number of times; in a page without a document
// (the tests) the neutral ones stay.
export function detailTextures() {
  if (started) return textureUniforms;
  started = true;
  textureUniforms.tGrass.value = neutral2D();
  textureUniforms.tSand.value = neutral2D();
  textureUniforms.tBark.value = neutralArray(BARK_KINDS.length);
  textureUniforms.tBuilt.value = neutralArray(BUILT_KINDS.length);
  if (typeof document === "undefined" || typeof Image === "undefined") return textureUniforms;
  const loader = new THREE.TextureLoader();
  // (The phone's sand never reads its texture - look/sandwater.js
  // SAND_PHONE - so it isn't loaded there.)
  for (const [name, key] of PHONE ? [["grass", "tGrass"]] : [["grass", "tGrass"], ["sand", "tSand"]]) {
    loads.push(
      new Promise((settled) =>
        loader.load(
          `${DIR}${name}.png`,
          (t) => {
            textureUniforms[key].value = detail(t);
            settled();
          },
          undefined,
          () => {
            console.warn(`Couldn't load the ${name} texture: the shader's own detail stays`);
            settled();
          },
        ),
      ),
    );
  }
  loadLayers("bark", BARK_KINDS, "tBark", "the trunks stay plain");
  loadLayers("built", BUILT_KINDS, "tBuilt", "paths and walls keep their shader's own detail");
  return textureUniforms;
}

// A set of tiles (`${prefix}-${kind}.png`, all the same size) as one
// texture with a layer each - the bark's four kinds, the paths' and walls'
// five - once they're all in.
function loadLayers(prefix, kinds, key, otherwise) {
  const images = kinds.map((kind) => {
    const img = new Image();
    img.src = `${DIR}${prefix}-${kind}.png`;
    return img.decode().then(() => img);
  });
  const load = Promise.all(images)
    .then((list) => {
      const size = list[0].naturalWidth;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const data = new Uint8Array(size * size * 4 * list.length);
      list.forEach((img, i) => {
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        data.set(ctx.getImageData(0, 0, size, size).data, i * size * size * 4);
      });
      const t = new THREE.DataArrayTexture(data, size, size, list.length);
      textureUniforms[key].value = detail(t);
    })
    .catch(() => console.warn(`Couldn't load the ${prefix} textures: ${otherwise}`));
  loads.push(load);
}

// Resolves once every texture started has loaded or failed to, with the
// ones in use: the loading screen waits for them and sends them to the
// graphics card behind it (app.js), so the ground's and bark's detail is
// there in the first picture rather than arriving a moment into play.
export function detailTexturesSettled() {
  return Promise.all(loads).then(() => Object.values(textureUniforms).map((u) => u.value).filter(Boolean));
}

// GLSL: the lit normal tilted by a texture's lean, on any surface, from how
// the texture's co-ordinates `uv` change across the screen (no tangents
// needed): for after three.js's <normal_fragment_maps>, given the view
// position there (vViewPosition, every lit material's: declared after
// <common>, so passed in). k: how much.
export const LEAN_UV = /* glsl */ `
  vec3 leanUv(vec3 n, vec3 viewPos, vec2 uv, vec2 lean, float k) {
    vec3 q0 = dFdx(-viewPos);
    vec3 q1 = dFdy(-viewPos);
    vec2 s0 = dFdx(uv);
    vec2 s1 = dFdy(uv);
    vec3 q1p = cross(q1, n);
    vec3 q0p = cross(n, q0);
    vec3 T = q1p * s0.x + q0p * s1.x;
    vec3 B = q1p * s0.y + q0p * s1.y;
    float det = max(dot(T, T), dot(B, B));
    float sc = det == 0.0 ? 0.0 : inversesqrt(det);
    return normalize(n + (T * lean.x + B * lean.y) * sc * k);
  }
`;
