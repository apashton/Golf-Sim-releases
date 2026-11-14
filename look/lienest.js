// Grass round the ball: when the ball comes to rest in the first cut, the
// rough or the deep rough, a small patch of stylised blade clumps grows
// round it - densest by the ball, thinning out to nothing about 12 m away,
// taller in deep rough, in the ground's own colours (the same recipe the
// ground and the tufts are coloured by, look/glsl/ground.js), leaning with
// the wind's waves across the grass.
//
//   - none on a fairway, green, tee, fringe, sand, water, path or under the
//     trees, and thinning to nothing 2 m before a fringe (or a green);
//   - none within a metre of a cart path's edge (a links hole's tall grass
//     1.75 m), thickening back up beyond, as the long grass (sim/tufts.mjs
//     grassPathRoom): its blades never stand on or lean over a path;
//   - the top half of the ball always shows from the golfer's camera: a
//     clump is never taller than a third of the way up the ball plus a
//     gentle slope away from it (NEST.slope, shallower than any address
//     camera looks down), so right by the ball - within 10 cm - it stays
//     under a third of the ball's height, and it only reaches its full
//     height some way off;
//   - hidden in flight, High only, and shed by High's safety valve
//     (look/safety.js, step 3) along with the tufts.
//
// One draw call: the clumps are instances of one small mesh of blades,
// opaque (so hidden pixels are skipped early), casting no shadow. Built
// once when the ball settles.
//
// nestClumps is the placement, pure (no three.js, no page), for the tests.

import * as THREE from "three";
import { HIGH } from "./quality.js";
import { isShed } from "./safety.js";
import { withSceneryHooks } from "./glsl/hooks.js";
import { NOISE, GROUND_COLOUR, GROUND_KEY, groundUniforms } from "./glsl/ground.js";
import { glslLinear, PALETTE } from "./palette.js";
import { GRASS } from "./grass.js";
import { grassPathRoom, TALL_GRASS } from "../sim/tufts.mjs";
import { cutUniforms, CUT_VERTEX_PARS, cutVertex, CUT_FRAGMENT_PARS, cutFragment, CUT_KEY } from "./cutline.js";

// The lies blades grow in, and how tall they stand (metres) in each.
export const NEST = {
  lies: { semi: 0, rough: 1, deep: 2 },
  height: { semi: 0.045, rough: 0.09, deep: 0.17 },
  radius: 12,
  // None within this of a fringe or green: they stop at a clean line, as
  // the mower leaves it (the owner, 19 October 2026: "the line between
  // long grass and short grass can be clean"), not thinning out over a
  // couple of metres as they did.
  clear: 0.25,
  // How much taller a clump may be for each metre from the ball.
  slope: 0.3,
  // Within this of the ball, a third of its height at most.
  near: 0.1,
  // How many to try on High.
  count: 3500,
};

// Surfaces a clump stops short of (by NEST.clear).
const THIN_BEFORE = new Set(["fringe", "green"]);
// Round a clump, where it's looked at for them.
const AROUND = Array.from({ length: 6 }, (_, i) => [Math.cos((i * Math.PI) / 3), Math.sin((i * Math.PI) / 3)]);

// A small seeded random (so the same rest gives the same patch).
function random(seed) {
  let s = seed | 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Where the clumps go round a ball at rest. ball: [x, z]; lieAt(x, z): the
// lie there (same frame); cap: the most a clump may stand right by the
// ball, metres over the ground (a third of the way up the ball, from its
// foot); radius: how far out they go; count: how many to try; heights:
// how tall they stand in each lie (a links hole's own: course.js); paths:
// the hole's cart paths (its own and those between holes), kept off.
// Returns [{ x, z, h, lie, turn, d }] - h the clump's height (metres), lie
// its code (NEST.lies), turn radians, d metres from the ball.
export function nestClumps({ ball, lieAt, cap, seed = 1, radius = NEST.radius, count = NEST.count, heights = NEST.height, paths = null }) {
  const [bx, bz] = ball;
  if (!(lieAt(bx, bz) in NEST.lies)) return [];
  const rand = random(seed);
  // How far each spot is from a fringe or green, on a half-metre grid
  // (read once a cell: a lie is worked out for each clump itself).
  const cell = 0.5;
  const n = Math.ceil((radius + NEST.clear) / cell);
  const side = 2 * n + 1;
  const thin = new Uint8Array(side * side);
  for (let i = 0; i < side; i++) {
    for (let j = 0; j < side; j++) thin[i * side + j] = THIN_BEFORE.has(lieAt(bx + (i - n) * cell, bz + (j - n) * cell)) ? 1 : 0;
  }
  const steps = Math.ceil(NEST.clear / cell) + 1;
  const toThin = (x, z) => {
    const ci = Math.round((x - bx) / cell) + n;
    const cj = Math.round((z - bz) / cell) + n;
    let best = Infinity;
    for (let di = -steps; di <= steps; di++) {
      for (let dj = -steps; dj <= steps; dj++) {
        const i = ci + di;
        const j = cj + dj;
        if (i < 0 || j < 0 || i >= side || j >= side || !thin[i * side + j]) continue;
        best = Math.min(best, Math.hypot(bx + (i - n) * cell - x, bz + (j - n) * cell - z));
      }
    }
    return best;
  };
  const out = [];
  for (let k = 0; k < count; k++) {
    // Densest by the ball: most of them in the first few metres.
    const d = radius * Math.pow(rand(), 1.6);
    const a = rand() * Math.PI * 2;
    const x = bx + Math.cos(a) * d;
    const z = bz + Math.sin(a) * d;
    const turn = rand() * Math.PI * 2;
    const size = 0.7 + rand() * 0.5;
    const keep = rand();
    const lie = lieAt(x, z);
    if (!(lie in NEST.lies)) continue;
    // Stopping at a clean line short of a fringe or green (looked at
    // round the clump where the grid says one's near), and thinning
    // towards the patch's edge.
    if (toThin(x, z) < NEST.clear + cell && AROUND.some(([dx, dz]) => THIN_BEFORE.has(lieAt(x + dx * NEST.clear, z + dz * NEST.clear)))) continue;
    const fade = 1 - Math.max(0, (d - radius * 0.6) / (radius * 0.4));
    // And before a cart path.
    const byPath = grassPathRoom(paths, x, z, heights[lie] > TALL_GRASS);
    if (keep > fade * byPath || byPath <= 0) continue;
    const h = Math.min(heights[lie] * size, cap + NEST.slope * Math.max(0, d - NEST.near));
    out.push({ x, z, h, lie: NEST.lies[lie], turn, d });
  }
  return out;
}

// ---- Drawing ------------------------------------------------------------------------

// Every nest built and still wanted, so the safety valve can hide them:
// step 3, with the tufts (look/groundbits.js registers it, as one step).
const nests = new Set();
export const SHED_STEP = "no grass round the ball or tufts";
export function shedNests(on) {
  for (const m of nests) m.visible = !on && m.userData.wanted;
}

// The colour of the ground a clump stands in, by its lie: the first cut's,
// the rough's or the deep rough's recipe with their numbers (grass.js
// GRASS), as the tufts are (look/groundbits.js) - or on a links hole
// (course.js gives them these codes) its dune rough (3), its long fescue
// (4) or its darker long green (5).
const f4 = (v) => v.toFixed(4);
const recipe = (g, colour) => `gWindWaves(gRoughPatches(gGrassBase(${glslLinear(colour)}, w, ${f4(g.patch)}, ${f4(g.patchScale)}, ${f4(g.tint)}), w, ${f4(g.clumps)}), w, world, ${f4(g.wind)})`;
export const NEST_GROUND = /* glsl */ `
  vec3 nestGround(vec2 w, vec3 world, float lie) {
    return gWetGround(lie > 4.5 ? ${recipe(GRASS.longGreen, PALETTE.longGreen)} : lie > 3.5 ? ${recipe(GRASS.fescue, PALETTE.fescue)} : lie > 2.5 ? ${recipe(GRASS.duneRough, PALETTE.duneRough)} : lie > 1.5 ? ${recipe(GRASS.deep, PALETTE.deep)} : lie > 0.5 ? ${recipe(GRASS.rough, PALETTE.rough[0])} : ${recipe(GRASS.semi, PALETTE.firstCut[0])});
  }
`;

// One clump: a few thin, tapering blades leaning out a little, 1 m tall
// (scaled to each clump's height), normals up so it lights like the
// ground. nUpIn: how far up the blade.
function clumpGeometry() {
  const pos = [];
  const uv = [];
  const blades = 7;
  const rand = random(17);
  for (let b = 0; b < blades; b++) {
    const a = (b / blades) * Math.PI * 2 + rand() * 0.6;
    const r = 0.012 + rand() * 0.03;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const w = 0.0035 + rand() * 0.002;
    const across = a + Math.PI / 2 + (rand() - 0.5);
    // (Across and out in metres: only the height is scaled per clump.)
    const lean = 0.008 + rand() * 0.025;
    const h = 0.65 + rand() * 0.35;
    const cx = Math.cos(across) * w;
    const cz = Math.sin(across) * w;
    pos.push(x - cx, 0, z - cz, x + cx, 0, z + cz, x + Math.cos(a) * lean, h, z + Math.sin(a) * lean);
    uv.push(0, 0, h);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("nUpIn", new THREE.Float32BufferAttribute(uv, 1));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(new Array(pos.length / 3).fill([0, 1, 0]).flat(), 3));
  return geo;
}

let material = null;
function nestMaterial() {
  if (material) return material;
  material = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, groundUniforms, cutUniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        attribute float nLie;
        attribute float nUpIn;
        varying vec3 nGround;
        varying float nUp;
        // The rough's and deep rough's (not the first cut's: NEST.lies 0),
        // cut off at the mower's line.
        varying float nRough;
        ${CUT_VERTEX_PARS}
        ${NOISE}
        ${GROUND_COLOUR}
        ${NEST_GROUND}`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        {
          // Where the clump stands, and its colour, once a vertex.
          vec3 world = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          nGround = nestGround(world.xz, world, nLie);
          nUp = nUpIn;
          nRough = nLie > 0.5 ? 1.0 : 0.0;
          // Leaning with the wind's waves as they pass (gWindOff: how far
          // they've run), the tips most - by up to a third of the clump's
          // height; still in a calm.
          float tall = length(instanceMatrix[1].xyz);
          float wave = 0.5 + 0.5 * sin(dot(world.xz, gWindDir) * 1.7 - gWindOff * 1.7 + world.x * 0.3);
          vec3 lean = vec3(gWindDir.x, 0.0, gWindDir.y) * gWindK * (0.12 + 0.2 * wave) * tall * nUpIn * nUpIn;
          // (The lean is in world terms; the clump is turned and scaled.)
          mat3 toLocal = inverse(mat3(instanceMatrix));
          transformed += toLocal * lean;
        }`,
      )
      .replace("#include <project_vertex>", `#include <project_vertex>\n${cutVertex("modelMatrix * instanceMatrix * vec4(transformed, 1.0)")}`);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 nGround;\nvarying float nUp;\nvarying float nRough;\n${CUT_FRAGMENT_PARS}`)
      .replace(
        "#include <map_fragment>",
        // Cut off at the mower's line (the rough's); darker at the foot,
        // where the blades shade each other, lighter at the tips.
        `#include <map_fragment>
        ${cutFragment("nRough > 0.5")}
        diffuseColor.rgb = nGround * mix(0.72, 1.15, nUp);`,
      )
      .replace("#include <normal_fragment_begin>", "#include <normal_fragment_begin>\n  normal = normalize( vNormal );");
  };
  material.customProgramCacheKey = () => `nest-v2-${CUT_KEY}-${GROUND_KEY}`;
  withSceneryHooks(material, "nest");
  material.userData.shared = true;
  return material;
}

// The nest round a ball: an InstancedMesh (empty on Standard, or where the
// ball isn't in the first cut, rough or deep rough). place(x, z) -> [wx,
// wy, wz]: the ground there in world terms (x, z in lieAt's frame);
// turn: how the frame is turned about the vertical against the world's.
export function makeNest(clumps, place) {
  if (!HIGH || !clumps.length) return null;
  const mesh = new THREE.InstancedMesh(clumpGeometry(), nestMaterial(), clumps.length);
  // (Not in a pond's reflection: look/mirrors.js.)
  mesh.userData.noMirror = true;
  const lies = new Float32Array(clumps.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const s = new THREE.Vector3();
  clumps.forEach((c, i) => {
    q.setFromAxisAngle(up, c.turn);
    s.set(1, c.h, 1);
    m.compose(new THREE.Vector3(...place(c.x, c.z)), q, s);
    mesh.setMatrixAt(i, m);
    lies[i] = c.lie;
  });
  mesh.geometry.setAttribute("nLie", new THREE.InstancedBufferAttribute(lies, 1));
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  mesh.userData.wanted = true;
  mesh.visible = !isShed(SHED_STEP);
  nests.add(mesh);
  return mesh;
}

// A nest for warming up (app.js warmers, look/gpuprep.js drawAllSteps): one
// clump, never shown, so the nest's shader is built and drawn behind the
// loading screen rather than at the round's first address in the rough.
// Null on Standard, which grows none.
export function nestWarmers() {
  const mesh = makeNest([{ x: 0, z: 0, h: 0.2, turn: 0, lie: 1 }], () => [0, 0, 0]);
  // (Not one of the nests the valve shows and hides.)
  if (mesh) nests.delete(mesh);
  return mesh;
}

// Shows or hides a nest (hidden in flight), as the safety valve allows.
export function showNest(mesh, on) {
  if (!mesh) return;
  mesh.userData.wanted = on;
  mesh.visible = on && !isShed(SHED_STEP);
}

// Takes a nest away for good.
export function dropNest(mesh) {
  if (!mesh) return;
  nests.delete(mesh);
  mesh.parent?.remove(mesh);
  mesh.geometry.dispose();
}
