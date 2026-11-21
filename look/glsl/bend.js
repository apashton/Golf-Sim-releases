// The bend hook: every lit piece of scenery runs this once in its vertex
// shader, after the vertex is placed in its own frame (begin_vertex), so
// whatever grows can lean and sway in the wind - crowns, trunks, leaf
// cards, willow strands, tufts, dressing - without each material being
// edited. kind says what's being drawn ("crown", "trunk", "cards",
// "strands", "tuft", "dressing", "rock", "ground", "sand", "water", "path",
// "wall", "sign"), so only what grows bends, each by its own amount; the
// rest is left exactly as it was. Its uniforms are shared by every
// material (bendUniforms), set once a frame (updateBend, from
// scenery.js animateScenery with look/weatherlook.js's values).
//
// How far: sim/sway.mjs, whose numbers these are. A tree leans downwind and
// sways about the lean, its tip moving at most 2% of its height, its foot
// still; a gust rolls downwind along a tree line, its timing set by where
// each tree stands. Leaf cards flutter too (High, unless the safety valve
// has shed it); willow strands swing further; long grass, reeds, heather,
// flowers and gorse bend by how tall they are. Nothing moves in still air.
//
// What it has to work with, in the vertex shader: `transformed`, the vertex
// in the model's own frame (it moves it), and where the instance stands
// (batchingMatrix or instanceMatrix, and the mesh's modelMatrix).
//
// It's for the look only: a ball meets a tree as it stands, and the shadow
// map stays as drawn - it's drawn with three.js's own depth materials,
// which don't run this hook, and only when something in it changes
// (look/shadowwatch.js), which a uniform never does. Changing what it does
// must change BEND_KEY.

import * as THREE from "three";
import { HIGH } from "../quality.js";
import { registerStep } from "../safety.js";
import { SWAY_MAX, SWAY_LEAN, TREE_REF, PLANT_BEND, GUST_WAVE, swayStrength } from "../../sim/sway.mjs";

export const BEND_KEY = "b1";

// Shared by every material that runs the hook.
export const bendUniforms = {
  bendTime: { value: 0 },
  // The way the wind blows, world [x, z] (unit).
  bendDir: { value: new THREE.Vector2(1, 0) },
  // How strongly things bend now (sim/sway.mjs swayStrength): 0 - 1.
  bendStrength: { value: 0 },
  // How fast the gusts roll downwind (m/s).
  bendSpeed: { value: 2 },
  // Leaf cards flutter (1) or not (0).
  bendFlutter: { value: HIGH ? 1 : 0 },
};

const f = (v) => (Number.isInteger(v) ? `${v}.0` : `${v}`);

// Declarations (vertex): the uniforms, and the wave - how far along its lean-and-sway a spot is now, 0 - 1 of the most
// (sim/sway.mjs swayPush, gustAt).
export const BEND_PARS = `
uniform float bendTime;
uniform vec2 bendDir;
uniform float bendStrength;
uniform float bendSpeed;
uniform float bendFlutter;
float bendHash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}
float bendWave(vec3 foot, float rate) {
  float along = dot(foot.xz, bendDir);
  float k = 6.2831853 / ${f(GUST_WAVE)};
  float gust = 0.85 + 0.15 * sin(along * k - bendTime * k * bendSpeed);
  float swing = sin(bendTime * rate - along * 0.09 + bendHash(floor(foot.xz * 2.0)) * 6.2831853);
  return bendStrength * gust * (${f(SWAY_LEAN)} + ${f(1 - SWAY_LEAN)} * swing);
}
`;

// Where the instance stands, in the world (batchingMatrix is main()'s own,
// so this goes inside it).
const INSTANCE = `
  #if defined( USE_BATCHING )
    mat4 bM = modelMatrix * batchingMatrix;
  #elif defined( USE_INSTANCING )
    mat4 bM = modelMatrix * instanceMatrix;
  #else
    mat4 bM = modelMatrix;
  #endif`;

// A tree's part: pushed downwind by its height up the tree (squared), the
// foot still - trunks, crowns, cards and strands alike, so they move as
// one.
const TREE = (extra = "") => `
{
  ${INSTANCE}
  vec3 bFoot = (bM * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  float bH = length(bM[1].xyz) * ${f(TREE_REF)};
  float bY = max(0.0, (bM * vec4(transformed, 1.0)).y - bFoot.y);
  float bT = clamp(bY / bH, 0.0, 1.0);
  vec3 bPush = vec3(bendDir.x, 0.0, bendDir.y) * (bendWave(bFoot, 1.25) * ${f(SWAY_MAX)} * bH * bT * bT);
  ${extra}
  transformed += inverse(mat3(bM)) * bPush;
}
`;

// Leaf cards flutter: each corner its own way, a few centimetres, in the
// wind this moment.
const FLUTTER = `
  float bF = bendHash(transformed.xz * 3.7 + transformed.y);
  bPush += vec3(sin(bendTime * 7.0 + bF * 6.2831853), 0.6 * sin(bendTime * 5.3 + bF * 12.0), cos(bendTime * 6.1 + bF * 9.0)) * (0.05 * bendStrength * bendFlutter);
`;

// A willow's strands swing further, the lower the more (they hang from its
// dome).
const STRANDS = `
  float bHang = clamp(1.0 - bY / (bH * 0.6), 0.0, 1.0);
  bPush += vec3(bendDir.x, 0.0, bendDir.y) * (bendStrength * bHang * 0.35 * (0.6 + 0.4 * sin(bendTime * 1.7 + bendHash(bFoot.xz) * 6.2831853)));
`;

// A plant in the rough: bent by how tall it is, rippling as it goes.
const PLANT = `
{
  ${INSTANCE}
  vec3 bFoot = (bM * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  float bY = max(0.0, transformed.y) * length(bM[1].xyz);
  float bRipple = 1.0 + 0.25 * sin(bendTime * 4.3 + bendHash(bFoot.xz) * 6.2831853 + transformed.x * 3.0);
  vec3 bPush = vec3(bendDir.x, 0.0, bendDir.y) * (bendWave(bFoot, 2.1) * bRipple * ${f(PLANT_BEND)} * bY * bY);
  transformed += inverse(mat3(bM)) * bPush;
}
`;

// The code for each kind; any kind not here (ground, sand, water, paths,
// walls, signs, rocks) is left exactly as it was.
export const BENDS = {
  trunk: TREE(),
  crown: TREE(),
  cards: TREE(FLUTTER),
  strands: TREE(STRANDS),
  tuft: PLANT,
  dressing: PLANT,
};

// Adds the hook to a shader (in onBeforeCompile).
export function bend(shader, kind) {
  const code = BENDS[kind] ?? "";
  if (!code) return shader;
  Object.assign(shader.uniforms, bendUniforms);
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", `#include <common>\n${BEND_PARS}`)
    .replace("#include <begin_vertex>", `#include <begin_vertex>\n${code}`);
  return shader;
}

// Leaf flutter is the safety valve's last step (look/safety.js): shed, the
// cards keep swaying with their tree but stop fluttering. A uniform only -
// no shader or buffer changes.
let flutterShed = false;
registerStep(4, "leaf flutter", (on) => {
  flutterShed = on;
});

// Once a frame, from the weather's values (look/weatherlook.js): the time,
// the way the wind blows, how strongly (mph, gusts and all) - none in still
// air. The node hooks watch this, so they move with the same numbers.
const bendWatchers = new Set();
export function watchBend(fn) {
  bendWatchers.add(fn);
  return fn;
}

export function updateBend(w) {
  const u = bendUniforms;
  u.bendTime.value = w.time;
  u.bendDir.value.set(w.dir[0], w.dir[1]);
  u.bendStrength.value = swayStrength(w.gusting, w.still);
  u.bendSpeed.value = Math.max(2, (w.mph ?? 0) * 0.447);
  u.bendFlutter.value = HIGH && !flutterShed ? 1 : 0;
  for (const fn of bendWatchers) fn(u);
  return u;
}
