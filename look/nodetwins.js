// The node versions of the game's patched materials and shaders, for
// three.js's WebGPURenderer (look/twins.js: what a marked material is).
// Loaded only on WebGPURenderer (look/gpu.js makeRenderer), with three.js's
// WebGPU build. As the renderer comes to draw a marked material it asks for
// a node material to build its program from (look/gpu.js: the library's
// fromMaterial): its node version, made once, from what it was made with -
// the material itself still on the mesh, so its drawing state (blending,
// depth, which side) is its own, and nothing about the WebGL picture
// changes. A kind with no node version yet is drawn as before: plain, or
// not at all (sim/portcheck.mjs counts them).

import * as THREE from "three";
import { MeshBasicNodeMaterial, PMREMGenerator } from "three/webgpu";
import { Fn, abs, clamp, distance, cameraPosition, dot, exp, exp2, float, fract, fwidth, length, materialOpacity, max, min, mix, neutralToneMapping, output, positionWorld, reference, sRGBTransferEOTF, sRGBTransferOETF, toneMappingExposure, vec2, vec3, vec4 } from "three/tsl";
import { grassNodeMaterial } from "./glsl/groundnode.js";
import { skyNodeMaterial } from "./glsl/skynode.js";
import { cloudNodeMaterial } from "./glsl/cloudnode.js";
import { volumeCloudNodeMaterial } from "./glsl/volcloudnode.js";
import { forScreen, unNeutral } from "./glsl/skynode.js";
import { sandNodeMaterial } from "./glsl/sandnode.js";
import { waterNodeMaterial } from "./glsl/waternode.js";
import { foliageNodeMaterial, crownNodeMaterial, barkNodeMaterial } from "./glsl/treenode.js";
import { farWoodsNodeMaterial, atlasPictureNodeMaterial, atlasFacingNodeMaterial } from "./glsl/farwoodsnode.js";
import { tuftsNodeMaterial, tuftNearNodeMaterial, tuftFarNodeMaterial } from "./glsl/tuftnode.js";
import { HAZE_COOL, HAZE_HEIGHT, HAZE_THIN, HAZE_WARM, hazeSun } from "./glsl/haze.js";
import { applyNodeHooks } from "./glsl/nodehooks.js";
import { clothNodeMaterial, birdNodeMaterial, divotNodeMaterial, rockNodeMaterial, cupMarkNodeMaterial, cupHoleNodeMaterial, rainNodeMaterial } from "./glsl/bitsnode.js";
import { pathNodeMaterial } from "./glsl/pathnode.js";
import { bankNodeMaterial } from "./glsl/banknode.js";
// The screen's effects' passes (look/effects.js on WebGPURenderer).
export { effectPass, fxaaPass, effectQuad, straightToScreen } from "./glsl/effectsnode.js";
// The sand and spray a ball throws up, and Ultra's motes: copies of a
// square where WebGL draws points (look/sprays.js, look/motes.js).
export { sprayNodeMaterial, moteNodeMaterial } from "./glsl/spritenode.js";

// Each kind's node version: (options, material, from) -> a node material
// (from: three's own conversion of a material as it is). One that leaves
// part of it out says so (userData.partialTwin): it's counted as still
// plain (sim/portcheck.mjs).
export const TWIN_KINDS = {
  // A material whose only patch is the scenery hooks (glsl/hooks.js):
  // three's own node version of it, with the hooks' - its sway in the
  // wind among them.
  hooked: ({ kind }, material, from) => {
    const node = from?.(material);
    if (!node) return null;
    // (Its own userData: three's copy shares the material's.)
    node.userData = { ...material.userData };
    applyNodeHooks(node, kind);
    return node;
  },
  // (With the country picture laid over it, where it has one: look/
  // country.js withCountry.)
  grass: (o, m) => grassNodeMaterial({ ...o, country: m?.userData?.country ?? null }),
  sky: (o) => skyNodeMaterial(o),
  clouds: (o) => cloudNodeMaterial(o),
  // Ultra's clouds in three dimensions (look/volclouds.js).
  volclouds: (o) => volumeCloudNodeMaterial(o),
  net: (o) => netNodeMaterial(o),
  sand: (o) => sandNodeMaterial(o),
  water: (o, m) => waterNodeMaterial({ ...o, envMap: m?.envMap ?? null }),
  farwoods: (o) => farWoodsNodeMaterial(o),
  // (From three's own copy of each: their textures and colours.)
  foliage: (o, m, from) => foliageNodeMaterial(o, from?.(m)),
  crown: (o, m, from) => crownNodeMaterial(o, from?.(m)),
  bark: (o, m, from) => barkNodeMaterial(o, from?.(m)),
  // The tufts in the rough: the range's and a hole's scattered ones, and a
  // hole's tuft field near and far (their blades' picture from three's own
  // copy).
  tufts: (o, m, from) => tuftsNodeMaterial(o, from?.(m)),
  tuftnear: (o, m, from) => tuftNearNodeMaterial(o, from?.(m)),
  tuftfar: (o) => tuftFarNodeMaterial(o),
  // Small things (glsl/bitsnode.js): a flag's cloth, a pond's birds, the
  // tees' divots, High's rocks, the marks round the cup, golf pong's cups,
  // the rain.
  cloth: (o, m, from) => clothNodeMaterial(from?.(m)),
  birds: (o, m, from) => birdNodeMaterial(o, from?.(m)),
  divots: (o, m, from) => divotNodeMaterial(o, from?.(m)),
  rock: (o, m, from) => rockNodeMaterial(from?.(m)),
  cupmark: (o) => cupMarkNodeMaterial(o),
  cuphole: (o) => cupHoleNodeMaterial(o),
  rain: (o) => rainNodeMaterial(o),
  // A hole's cart paths (glsl/pathnode.js).
  path: (o, m, from) => pathNodeMaterial(o, from?.(m)),
  // A pond's bank, its earth and silt (look/sandwater.js bankSlopeMaterial).
  pondbank: (o, m, from) => bankNodeMaterial(o, from?.(m)),
};

// The range's ball-stop netting (look/club.js netMaterial): faded out as
// the camera comes near (fade: sim/furniture.mjs NET_FADE), and on High a
// fine weave of 10 cm squares, faded to the plain tint where it'd shimmer.
function netNodeMaterial({ high, fade }) {
  const m = new MeshBasicNodeMaterial();
  const d = distance(cameraPosition, positionWorld);
  const k = clamp(d.sub(fade.near).div(fade.far - fade.near), 0.0, 1.0);
  let alpha = materialOpacity.mul(k.mul(k).mul(float(3.0).sub(k.mul(2.0))));
  if (high) {
    const cell = vec2(positionWorld.x.add(positionWorld.z), positionWorld.y).div(0.1);
    const w = fwidth(cell);
    const g = abs(fract(cell).sub(0.5)).div(max(w, vec2(1e-4)));
    const line = float(1.0).sub(clamp(min(g.x, g.y).sub(0.5), 0.0, 1.0));
    const far = clamp(max(w.x, w.y).mul(2.0).sub(0.5), 0.0, 1.0);
    alpha = alpha.mul(mix(float(0.35).add(line.mul(0.9)), float(1.0), far));
  }
  m.opacityNode = alpha;
  return m;
}

// What a node version takes from the material it stands for: its drawing
// as it was made (the material's own state is what the renderer draws it
// with; these shape the program).
const SHAPING = ["transparent", "opacity", "alphaTest", "side", "vertexColors", "depthWrite", "depthTest", "flatShading", "fog", "toneMapped", "premultipliedAlpha", "alphaToCoverage", "dithering"];

const twins = new WeakMap();

// The node version of `material` (look/twins.js markTwin), made once; null
// for a kind with none yet. Its drawing kept as the material's is each time
// it's asked for (as its program's built): a board fading in and out turns
// see-through and back (look/fadeboard.js), and is built again each way.
export function nodeFor(material, from = null) {
  const twin = material.userData?.twin;
  const make = twin && TWIN_KINDS[twin.kind];
  if (!make) return null;
  let node = twins.get(material);
  if (!node) {
    node = make(twin.options ?? {}, material, from);
    if (!node) return null;
    node.name = material.name;
    twins.set(material, node);
    twin.made = true;
    twin.partial = !!node.userData?.partialTwin;
  }
  // (Less any the node version has dealt with itself.)
  const own = node.userData?.ownShaping ?? [];
  for (const key of SHAPING) if (key in material && !own.includes(key)) node[key] = material[key];
  return node;
}

// The haze (look/glsl/haze.js) as the scene's fog node: the same sums - the
// day's density (the fog's near), thinner with height along the line of
// sight, warmer towards the sun - read from the scene's HazeFog each frame.
// And mixed in where WebGL's is: after the picture's tone mapping and its
// colour for the screen (three's fog chunk comes last there), so a far
// hill or wood takes the same share of haze as on WebGL rather than paling
// - the colour as it will be shown worked out here, the haze mixed into
// that, and the curve undone (glsl/skynode.js unNeutral) for the frame's
// own tone mapping to put back. A readable thing (look/weatherlook.js
// markReadable: the ball, its tracer, the flag, the tee markers, the
// boards) takes no more than the fog's far, a fair day's - picked for each
// material as it's built.
export function hazeFogNode(fog) {
  const near = reference("near", "float", fog);
  const far = reference("far", "float", fog);
  const density = Fn((builder) => (builder.material?.userData?.readable ? min(near, far) : near))();
  const colour = reference("color", "color", fog);
  const sun = hazeSun() ?? new THREE.Vector3(0, 1, 0);
  const ray = positionWorld.sub(cameraPosition);
  const dist = length(ray);
  const dir = ray.div(max(dist, 1e-3));
  const y = max(float(0), cameraPosition.y.add(ray.y.mul(0.5)));
  const thin = float(1).sub(float(HAZE_THIN).mul(float(1).sub(exp2(y.negate().div(HAZE_HEIGHT)))));
  const d = density.mul(thin).mul(dist);
  const factor = float(1).sub(exp(d.mul(d).negate()));
  const toSun = dot(dir, vec3(sun.x, sun.y, sun.z)).mul(0.5).add(0.5);
  const warmth = mix(vec3(...HAZE_COOL), vec3(...HAZE_WARM), toSun.mul(toSun));
  return Fn(() => {
    const shown = sRGBTransferOETF(neutralToneMapping(output.rgb, toneMappingExposure));
    // (The haze's colour as the screen has it, as WebGL's fog colour is
    // handed over - three converts it - and tinted there, as its is.)
    const hazed = mix(shown, sRGBTransferOETF(colour).mul(warmth), factor);
    // (Into a buffer - the screen's effects', a pond's reflection - as
    // WebGL mixes it there: the colour as it is, the fog's as it is.)
    const buffered = mix(output.rgb, colour.mul(warmth), factor);
    return vec4(forScreen(unNeutral(min(sRGBTransferEOTF(hazed), vec3(0.999)), toneMappingExposure), buffered), output.a);
  })();
}

// The sky's reflection's baker on WebGPURenderer (look/environment.js
// bakeSky), one kept for each renderer, as WebGL's is: the sky drawn into
// it by its node version (glsl/skynode.js, which bakes as WebGL's does).
const bakers = new WeakMap();
export function skyBaker(renderer) {
  if (!bakers.has(renderer)) bakers.set(renderer, new PMREMGenerator(renderer));
  return bakers.get(renderer);
}

// Every scene drawn with its haze: its fog node made from its HazeFog
// (once; the WebGL fog chunk does it on the other renderer).
export function hazeScene(scene) {
  if (scene?.fog?.isHazeFog && !scene.fogNode) scene.fogNode = hazeFogNode(scene.fog);
}

// The far woods' atlas drawn on WebGPURenderer (look/treeatlas.js): its two
// programs as node materials, one of each for each texture its parts use.
const atlasMaterials = new Map();
export function atlasPicture(map) {
  const key = `p${map.uuid}`;
  if (!atlasMaterials.has(key)) atlasMaterials.set(key, atlasPictureNodeMaterial(map));
  return atlasMaterials.get(key);
}
export function atlasFacing(map) {
  const key = `f${map.uuid}`;
  if (!atlasMaterials.has(key)) atlasMaterials.set(key, atlasFacingNodeMaterial(map));
  return atlasMaterials.get(key);
}
