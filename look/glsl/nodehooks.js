// The scenery hooks as node materials (Three's TSL), the same sums as
// bend.js, cloudshade.js and seethrough.js. The game still draws with the
// WebGL hooks (hooks.js). These are for a node material on the WebGPU
// renderer, which never runs onBeforeCompile. Not wired into the picture
// yet: applyNodeHooks() is what will be, once the ground shader has a node
// version too. Changing the sums here must change NODE_HOOKS_KEY.

import * as THREE from "three";
import {
  Fn,
  attribute,
  batchIndirectIndex,
  bitAnd,
  clamp,
  cos,
  dot,
  float,
  floor,
  fract,
  instancedBufferAttribute,
  int,
  ivec2,
  length,
  mat4,
  materialColor,
  max,
  min,
  mix,
  modelWorldMatrix,
  modelWorldMatrixInverse,
  positionView,
  positionWorld,
  screenCoordinate,
  sin,
  smoothstep,
  texture,
  textureLoad,
  textureSize,
  uniform,
  uniformArray,
  varying,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import { watchBend, BENDS } from "./bend.js";
import { TREE_PATCH, PATCHED, PATCH_OWN } from "./treepatch.js";
import { watchCloudShade, cloudUniforms, CLOUD_SHADOW_TILE, SUN_SHARE } from "./cloudshade.js";
import { BAYER, SEE_THROUGH } from "../../sim/seethrough.mjs";
import { GUST_WAVE, PLANT_BEND, SWAY_LEAN, SWAY_MAX, TREE_REF } from "../../sim/sway.mjs";

export const NODE_HOOKS_KEY = "nh2";

export const bendTime = uniform(0);
export const bendDir = uniform(vec2(1, 0));
const bendStrength = uniform(0);
const bendSpeed = uniform(2);
const bendFlutter = uniform(0);
const csMap = texture(cloudUniforms.csMap.value);
const csDrift = uniform(vec2(0, 0));
const csStrength = uniform(0);
const csLo = uniform(0.5);

watchBend((u) => {
  bendTime.value = u.bendTime.value;
  bendDir.value.copy(u.bendDir.value);
  bendStrength.value = u.bendStrength.value;
  bendSpeed.value = u.bendSpeed.value;
  bendFlutter.value = u.bendFlutter.value;
});
watchCloudShade((u) => {
  csDrift.value.copy(u.csDrift.value);
  csStrength.value = u.csStrength.value;
  csLo.value = u.csLo.value;
});

export function bendHash(p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))).mul(43758.5453));
}

export function bendWave(foot, rate) {
  const along = dot(foot.xz, bendDir);
  const k = float(6.2831853 / GUST_WAVE);
  const gust = float(0.85).add(float(0.15).mul(sin(along.mul(k).sub(bendTime.mul(k).mul(bendSpeed)))));
  const swing = sin(bendTime.mul(rate).sub(along.mul(0.09)).add(bendHash(floor(foot.xz.mul(2))).mul(6.2831853)));
  return bendStrength.mul(gust).mul(float(SWAY_LEAN).add(float(1 - SWAY_LEAN).mul(swing)));
}

// The per-tree matrix inside a BatchedMesh, the same layout three.js uses,
// read from its own matrices (three builds a batch's program for it alone:
// a new texture as it grows, a new program).
function batchMatrix(batch) {
  const tex = batch._matricesTexture;
  const size = int(textureSize(textureLoad(tex), 0).x);
  const j = batchIndirectIndex.mul(4);
  const x = int(j).mod(size);
  const y = int(j).div(size);
  return mat4(
    textureLoad(tex, ivec2(x, y)),
    textureLoad(tex, ivec2(x.add(1), y)),
    textureLoad(tex, ivec2(x.add(2), y)),
    textureLoad(tex, ivec2(x.add(3), y)),
  );
}

// A copy's own matrix in an InstancedMesh, read from its matrices as
// three.js's own instancing reads them (one buffer kept for each mesh).
const copies = new WeakMap();
function instanceMatrix(mesh) {
  let buffer = copies.get(mesh);
  if (!buffer) {
    buffer = new THREE.InstancedInterleavedBuffer(mesh.instanceMatrix.array, 16, 1);
    copies.set(mesh, buffer);
  }
  const column = (k) => instancedBufferAttribute(buffer, "vec4", 16, k * 4);
  return mat4(column(0), column(1), column(2), column(3));
}

// The matrix of the batch's tree or the copy being drawn (`o`: the mesh
// being built), or null on a plain mesh.
export function ownMatrix(o) {
  if (o?.isBatchedMesh) return batchMatrix(o);
  if (o?.isInstancedMesh && o.instanceMatrix?.isInstancedBufferAttribute) return instanceMatrix(o);
  return null;
}

// Where the batch's tree or the copy a vertex belongs to stands, in the
// mesh's own frame (its matrix's place), or nought on a plain mesh: worked
// out as each mesh is built, as bendFor is.
export function copyPlace() {
  return Fn((builder) => {
    const M = ownMatrix(builder.object);
    return M ? vec3(M[3].x, M[3].y, M[3].z) : vec3(0);
  })();
}

// Where the vertex goes, in the mesh's own frame (what positionNode must
// return). M: a batched tree's or a copy's own matrix (or null), so the
// bend matches the WebGL hook, which runs before that matrix is applied -
// and the vertex is put where that matrix puts it (three has already, but
// positionNode starts again from the bare shape).
function bendPosition(kind, M) {
  const geo = attribute("position", "vec3");
  const placed = M ? M.mul(vec4(geo, 1)).xyz : geo;
  const bM = M ? modelWorldMatrix.mul(M) : modelWorldMatrix;
  const foot = M ? modelWorldMatrix.mul(M.mul(vec4(0, 0, 0, 1))).xyz : modelWorldMatrix.mul(vec4(0, 0, 0, 1)).xyz;
  const yAxis = vec3(bM[1].x, bM[1].y, bM[1].z);
  const world = modelWorldMatrix.mul(vec4(placed, 1)).xyz;
  const back = (push) => modelWorldMatrixInverse.mul(vec4(world.add(push), 1)).xyz;
  if (kind === "tuft" || kind === "dressing") {
    const height = max(float(0), geo.y).mul(length(yAxis));
    const ripple = float(1).add(float(0.25).mul(sin(bendTime.mul(4.3).add(bendHash(foot.xz).mul(6.2831853)).add(geo.x.mul(3)))));
    const push = vec3(bendDir.x, 0, bendDir.y).mul(bendWave(foot, 2.1).mul(ripple).mul(PLANT_BEND).mul(height).mul(height));
    return back(push);
  }
  const bH = length(yAxis).mul(TREE_REF);
  const bY = max(float(0), world.y.sub(foot.y));
  const bT = clamp(bY.div(bH), 0, 1);
  let push = vec3(bendDir.x, 0, bendDir.y).mul(bendWave(foot, 1.25).mul(SWAY_MAX).mul(bH).mul(bT).mul(bT));
  if (kind === "cards") {
    const bF = bendHash(geo.xz.mul(3.7).add(geo.y));
    push = push.add(
      vec3(
        sin(bendTime.mul(7).add(bF.mul(6.2831853))),
        float(0.6).mul(sin(bendTime.mul(5.3).add(bF.mul(12)))),
        cos(bendTime.mul(6.1).add(bF.mul(9))),
      ).mul(float(0.05).mul(bendStrength).mul(bendFlutter)),
    );
  } else if (kind === "strands") {
    const hang = clamp(float(1).sub(bY.div(bH.mul(0.6))), 0, 1);
    push = push.add(
      vec3(bendDir.x, 0, bendDir.y).mul(
        bendStrength.mul(hang).mul(0.35).mul(float(0.6).add(float(0.4).mul(sin(bendTime.mul(1.7).add(bendHash(foot.xz).mul(6.2831853)))))),
      ),
    );
  }
  return back(push);
}

// A tree's own patches (treepatch.js TREE_PATCH): from where it stands and
// the shape's own point, worked out a corner at a time.
function patchFor() {
  const P = TREE_PATCH;
  return varying(
    Fn((builder) => {
      const M = ownMatrix(builder.object);
      const foot = M ? modelWorldMatrix.mul(M.mul(vec4(0, 0, 0, 1))).xyz : modelWorldMatrix.mul(vec4(0, 0, 0, 1)).xyz;
      const s = fract(sin(dot(floor(foot.xz.mul(4)), vec2(12.9898, 78.233))).mul(43758.5453));
      const p = attribute("position", "vec3");
      // (Its own amount and patch size: treepatch.js PATCH_OWN.)
      const pA = fract(s.mul(PATCH_OWN.amount[0]).add(PATCH_OWN.amount[1]));
      const pS = fract(s.mul(PATCH_OWN.size[0]).add(PATCH_OWN.size[1]));
      const k = float((2 * Math.PI) / P.size).div(mix(float(P.sizes[0]), float(P.sizes[1]), pS));
      const pv = sin(p.x.mul(k).add(s.mul(6.2832))).mul(sin(p.y.mul(k).mul(0.8).add(s.mul(11)))).mul(sin(p.z.mul(k).add(s.mul(17))));
      const amount = mix(float(P.spread[0]), float(P.spread[1]), pA).mul(P.amount);
      return vec3(1).add(vec3(...P.warm).mul(pv.mul(amount)));
    })(),
    "vTreePatch",
  );
}

// How much of a sunlit patch remains under the clouds. The share the GLSL
// takes off the sun (cloudshade.js) comes to this on the whole lit colour.
function cloudDim() {
  const n = texture(csMap, positionWorld.xz.sub(csDrift).div(CLOUD_SHADOW_TILE)).r;
  const shade = smoothstep(csLo, csLo.add(0.2), n).mul(min(float(0.95), csStrength.div(SUN_SHARE)));
  return float(1).sub(shade.mul(SUN_SHARE));
}

// Kept pixels of a trunk or a crown as the camera comes up to it. maskNode
// discards where this is false. The 4 x 4 pattern is seethrough.mjs.
function seeThroughMask(part) {
  const fade = SEE_THROUGH[part];
  const bayer = uniformArray(
    BAYER.map((v) => (v + 0.5) / 16),
    "float",
  );
  const d = length(positionView);
  const t = clamp(d.sub(fade.near).div(fade.far - fade.near), 0, 1);
  const cover = float(fade.least).add(float(1 - fade.least).mul(t).mul(t).mul(float(3).sub(t.mul(2))));
  const p = bitAnd(ivec2(screenCoordinate.xy), ivec2(3));
  const threshold = bayer.element(p.y.mul(4).add(p.x));
  return d.greaterThanEqual(fade.far).or(cover.greaterThan(threshold));
}

// The bend for whatever mesh the material is drawn on, worked out as each
// is built (three builds an instanced or batched mesh's program for it
// alone): a batch's tree's matrix, a copy's, or neither.
function bendFor(kind) {
  return Fn((builder) => bendPosition(kind, ownMatrix(builder.object)))();
}

// Puts the three hooks on a node material. bend: false leaves the bend
// out (a node version that places its own corners: glsl/tuftnode.js,
// farwoodsnode.js). The WebGL material is left to hooks.js.
export function applyNodeHooks(material, kind, { bend = true } = {}) {
  if (material.userData.nodeHooks) return material;
  material.userData.nodeHooks = kind;
  if (bend && BENDS[kind]) material.positionNode = bendFor(kind);
  const base = material.colorNode ?? materialColor;
  // (Its alpha kept: a picture's see-through parts, cut out by alphaTest.)
  const own = PATCHED.has(kind) && BENDS[kind] ? vec3(base).mul(patchFor()) : vec3(base);
  material.colorNode = vec4(own.mul(cloudDim()), vec4(base).a);
  if (SEE_THROUGH[material.userData.seeThrough]) material.maskNode = seeThroughMask(material.userData.seeThrough);
  return material;
}

export const NODE_BENDS = Object.keys(BENDS);
