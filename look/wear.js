// Worn grass on a hole (where: sim/wear.mjs): tracks trodden by feet across
// the rough, patches of thin grass, sand-filled divots on the tees
// (makeDivots), and the strips along cart paths - each
// a see-through sheet of drier, browner grass laid over the ground, fading
// raggedly into the grass under it (grass.js edge material), with scuffs of
// bare soil where it's worn hardest.

import * as THREE from "three";
import { grassMaterial, GRASS, LAYER } from "./grass.js";
import { PALETTE } from "./palette.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { partRadius } from "../sim/wear.mjs";
import { NOISE } from "./glsl/ground.js";
import { onLayer } from "./grass.js";
import { withSceneryHooks } from "./glsl/hooks.js";
import { markTwin } from "./twins.js";

const LIFT = 0.004;

const materials = new Map();
function worn(kind) {
  if (!materials.has(kind)) {
    const look = {
      verge: { light: PALETTE.vergeWorn, worn: 0.6, tint: 0.9, layer: LAYER.verge },
      track: { light: PALETTE.trodden, worn: 0.4, tint: 0.7, layer: LAYER.wear },
      patch: { light: PALETTE.thinGrass, worn: 0.5, tint: 1, layer: LAYER.wear },
    }[kind];
    materials.set(
      kind,
      grassMaterial({ ...GRASS.rough, dark: look.light, patch: 0.45, patchScale: 0.25, soil: PALETTE.bareSoil, edge: true, ...look }),
    );
  }
  return materials.get(kind);
}

// A band along a line (hole frame [x, z] points): for each point, the
// columns across it - { off (metres right of the line), edge (1 solid, 0
// gone) } - which may differ from point to point. heightAt(wx, wz): world.
export function band(line, columnsAt, heightAt, lift = LIFT) {
  const n = line.length;
  const cols = columnsAt(0).length;
  const pos = new Float32Array(n * cols * 3);
  const edge = new Float32Array(n * cols);
  for (let i = 0; i < n; i++) {
    const a = line[Math.max(0, i - 1)];
    const b = line[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0];
    let dz = b[1] - a[1];
    const len = Math.hypot(dx, dz) || 1;
    dx /= len;
    dz /= len;
    const cs = columnsAt(i);
    for (let k = 0; k < cols; k++) {
      const hx = line[i][0] - dz * cs[k].off;
      const hz = line[i][1] + dx * cs[k].off;
      // Hole frame -> world: (x, z) -> (z, -x).
      const j = i * cols + k;
      pos[j * 3] = hz;
      pos[j * 3 + 1] = heightAt(hz, -hx) + lift;
      pos[j * 3 + 2] = -hx;
      edge[j] = cs[k].edge;
    }
  }
  const index = [];
  for (let i = 0; i + 1 < n; i++) {
    for (let k = 0; k + 1 < cols; k++) {
      const p = i * cols + k;
      const q = (i + 1) * cols + k;
      index.push(p, p + 1, q, q, p + 1, q + 1);
    }
  }
  return geometry(pos, edge, index);
}

function geometry(pos, edge, index) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("gEdgeIn", new THREE.BufferAttribute(edge, 1));
  geo.setIndex(index);
  geo.computeVertexNormals();
  // Faces up, whichever way it was wound.
  const nrm = geo.attributes.normal;
  if (nrm.count && nrm.getY(0) < 0) {
    for (let i = 0; i < index.length; i += 3) [index[i + 1], index[i + 2]] = [index[i + 2], index[i + 1]];
    geo.setIndex(index);
    geo.computeVertexNormals();
  }
  return geo;
}

// A patch: each of its parts (sim/wear.mjs) a soft-edged sheet - worn
// most in the middle, fading out over its outer half - so the shape shows
// but never a hard line.
export function patchGeometry(patch, heightAt, segments = 40) {
  const geos = patch.parts.map((part) => partGeometry(part, patch.strength, heightAt, segments));
  return geos.length === 1 ? geos[0] : mergeGeometries(geos);
}

function partGeometry(part, strength, heightAt, segments) {
  const rings = [0, 0.3, 0.55, 0.75, 0.9, 1];
  const fade = [1, 0.92, 0.72, 0.45, 0.2, 0];
  const pos = [];
  const edge = [];
  pos.push(part.z, heightAt(part.z, -part.x) + LIFT, -part.x);
  edge.push(strength);
  for (let ri = 1; ri < rings.length; ri++) {
    for (let s = 0; s < segments; s++) {
      const t = (s / segments) * Math.PI * 2;
      const rr = partRadius(part, t) * rings[ri];
      const hx = part.x + Math.cos(t) * rr;
      const hz = part.z + Math.sin(t) * rr;
      pos.push(hz, heightAt(hz, -hx) + LIFT, -hx);
      edge.push(fade[ri] * strength);
    }
  }
  const index = [];
  const at = (ri, s) => (ri === 0 ? 0 : 1 + (ri - 1) * segments + (s % segments));
  for (let s = 0; s < segments; s++) index.push(0, at(1, s + 1), at(1, s));
  for (let ri = 1; ri + 1 < rings.length; ri++) {
    for (let s = 0; s < segments; s++) index.push(at(ri, s), at(ri, s + 1), at(ri + 1, s), at(ri + 1, s), at(ri, s + 1), at(ri + 1, s + 1));
  }
  return geometry(new Float32Array(pos), new Float32Array(edge), index);
}

// A trodden track: worn hardest down its middle, fading out to each side,
// and faded in at its ends rather than starting square.
export function trackGeometry({ pts, w }, heightAt) {
  const n = pts.length;
  const half = w / 2;
  return band(
    pts,
    (i) => {
      const ends = Math.min(1, Math.min(i, n - 1 - i) / 3);
      // Worn harder in some stretches than others.
      const e = ends * (0.65 + 0.25 * Math.sin(i * 0.37 + pts.length) * Math.sin(i * 0.11));
      return [
        { off: -half * 1.8, edge: 0 },
        { off: -half * 0.7, edge: e * 0.6 },
        { off: 0, edge: e },
        { off: half * 0.7, edge: e * 0.6 },
        { off: half * 1.8, edge: 0 },
      ];
    },
    heightAt,
  );
}

function sheet(geo, kind) {
  const m = new THREE.Mesh(geo, worn(kind));
  const layer = kind === "verge" ? LAYER.verge : LAYER.wear;
  m.renderOrder = -10 + layer;
  m.receiveShadow = true;
  return m;
}

// A hole's worn grass as one group: { lines, patches } from sim/wear.mjs -
// a mesh for all its patches and one for all its tracks (a draw each, not
// one per patch).
export function makeWear({ lines = [], patches = [] }, heightAt) {
  const group = new THREE.Group();
  const one = (geos, kind) => {
    if (!geos.length) return;
    group.add(sheet(geos.length === 1 ? geos[0] : mergeGeometries(geos), kind));
    if (geos.length > 1) for (const g of geos) g.dispose();
  };
  one(patches.map((p) => patchGeometry(p, heightAt)), "patch");
  one(lines.filter((l) => l.pts.length >= 2).map((l) => trackGeometry(l, heightAt)), "track");
  return group;
}

// A path's worn verge, one side: from just outside the kerb (inner, metres
// from the path's middle) out to a width that changes along it (widths[i]
// metres, from sim/wear.mjs vergeProfile), browner and patchier nearest the
// path. `side` -1 left, 1 right.
export function vergeGeometry(line, inner, widths, side, heightAt) {
  return band(
    line,
    (i) => {
      const w = widths[i];
      const cols = [
        { off: side * inner, edge: 0.85 },
        { off: side * (inner + w * 0.35), edge: 0.6 },
        { off: side * (inner + w * 0.7), edge: 0.3 },
        { off: side * (inner + w), edge: 0 },
      ];
      return cols;
    },
    heightAt,
  );
}
export const vergeMaterial = () => worn("verge");

// ---- Divots on the tees -----------------------------------------------------------------

// Sand-filled divots (sim/wear.mjs teeDivots, stripDivots) as one
// instanced draw: small ellipses of sand, grainy, fresh ones paler and
// older ones grown over at the edges, with a thin rim of soil where the
// turf was cut. They fade out by 25 m (so a tee seen from down the hole
// doesn't speckle), cast nothing, and lie on their own drawing layer just
// over the tee (grass.js LAYER.divot). High only (course.js, range.js).
let divotMat = null;
function divotMaterial() {
  if (divotMat) return divotMat;
  divotMat = onLayer(new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, depthWrite: false }), LAYER.divot);
  divotMat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float dAge;\nvarying vec2 dLocal;\nvarying float dOld;\nvarying vec3 dWorld;")
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
        dLocal = position.xz;
        dOld = dAge;
        dWorld = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec2 dLocal;
        varying float dOld;
        varying vec3 dWorld;
        ${NOISE}`,
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        {
          // dLocal: the unit circle the divot is stretched from.
          float r = length(dLocal);
          vec2 w = dWorld.xz;
          vec3 sand = ${glslColour(PALETTE.divotSand)} * (0.9 + 0.2 * gHash(floor(w * 90.0)));
          vec3 soil = ${glslColour(PALETTE.bareSoil)};
          // Older ones grown over from the edge in.
          float grown = dOld * smoothstep(0.35, 1.0, r + 0.25 * gHash(floor(w * 40.0)));
          vec3 col = mix(sand, ${glslColour(PALETTE.tee[1])}, grown * 0.8);
          col = mix(col, soil, smoothstep(0.78, 0.95, r) * (1.0 - dOld * 0.6));
          diffuseColor.rgb *= col;
          diffuseColor.a *= (1.0 - smoothstep(0.92, 1.0, r)) * (1.0 - smoothstep(18.0, 25.0, distance(dWorld, cameraPosition)));
        }`,
      );
  };
  divotMat.customProgramCacheKey = () => "divot-v1";
  withSceneryHooks(divotMat, "wear");
  // (Its node version, on WebGPURenderer: glsl/bitsnode.js.)
  const lin = (hex) => new THREE.Color(hex).toArray();
  markTwin(divotMat, "divots", { sand: lin(PALETTE.divotSand), soil: lin(PALETTE.bareSoil), tee: lin(PALETTE.tee[1]) });
  divotMat.userData.shared = true;
  return divotMat;
}

// A colour as a linear-light shader constant (three.js colours are).
function glslColour(hex) {
  const c = new THREE.Color(hex);
  return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`;
}

// divots: from sim/wear.mjs; place(x, z) -> [wx, wy, wz]: the ground in
// world terms (x, z in the divots' frame); frameRot: the line of play's
// angle in that frame (0: along +x, a hole's; PI / 2: along z, the range's).
export function makeDivots(divots, place, { frameRot = 0 } = {}) {
  if (!divots.length) return null;
  const geo = new THREE.CircleGeometry(1, 14).rotateX(-Math.PI / 2);
  const mesh = new THREE.InstancedMesh(geo, divotMaterial(), divots.length);
  // (Not in a pond's reflection: look/mirrors.js.)
  mesh.userData.noMirror = true;
  const age = new Float32Array(divots.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  divots.forEach((d, i) => {
    const a = d.rot + frameRot;
    const [x0, y0, z0] = place(d.x, d.z);
    const [x1, , z1] = place(d.x + Math.cos(a), d.z + Math.sin(a));
    // The circle's x along the divot's long axis, in world terms.
    q.setFromAxisAngle(up, -Math.atan2(z1 - z0, x1 - x0));
    m.compose(new THREE.Vector3(x0, y0 + LIFT, z0), q, new THREE.Vector3(d.len / 2, 1, d.w / 2));
    mesh.setMatrixAt(i, m);
    age[i] = d.age;
  });
  geo.setAttribute("dAge", new THREE.InstancedBufferAttribute(age, 1));
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  mesh.renderOrder = -10 + LAYER.divot;
  return mesh;
}
