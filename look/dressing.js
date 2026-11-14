// What dresses a hole's rough (where: sim/dressing.mjs) - heather, gorse,
// rocks, wildflowers and reeds, and stumps and logs, bracken, fescue and
// lily pads - each kind one instanced (or batched) mesh, so a hole's few
// thousand pieces cost a handful of draws. The rocks (five shapes, in the
// hole's own stone, mossy on top), the feature boulders, the stumps and the
// fallen logs share one batch: one draw. Gorse and rocks are lumps
// with their colour in their vertices (dark gorse flecked with yellow
// flowers, grey stone); heather, wildflowers and reeds are cards, as the
// rough's grass tufts are (scenery.js).
//
// heightAt(wx, wz): the ground's height in the world frame; the lists are
// in the hole frame, [x, z] drawn at world (z, -x).

import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { seeded, cutoutTexture, foliageMaterial, cardsOn } from "./trees.js";
import { withSceneryHooks } from "./glsl/hooks.js";
import { markTwin } from "./twins.js";
import { HIGH } from "./quality.js";

// A lump: a sphere pushed in and out a little (the same push wherever a
// vertex is shared, so it doesn't split), flattened below its middle, with
// a colour at each vertex from colourAt(x, y, z, rand) - x, y, z on the
// unit sphere before the push.
function lump({ detail = 1, rough = 0.15, seed = 1, colourAt }) {
  const geo = new THREE.IcosahedronGeometry(1, detail);
  const pos = geo.attributes.position;
  const colours = new Float32Array(pos.count * 3);
  const pushes = new Map();
  const rand = seeded(seed);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const key = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
    if (!pushes.has(key)) pushes.set(key, { push: 1 + (rand() - 0.5) * 2 * rough, colour: colourAt(x, y, z, rand, c).clone() });
    const { push, colour } = pushes.get(key);
    pos.setXYZ(i, x * push, y < 0 ? y * push * 0.25 : y * push, z * push);
    colours.set([colour.r, colour.g, colour.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colours, 3));
  // Shared vertices joined, so it shades smooth rather than faceted.
  geo.deleteAttribute("normal");
  geo.deleteAttribute("uv");
  const smooth = mergeVertices(geo, 1e-3);
  smooth.computeVertexNormals();
  return smooth;
}

const GORSE = () =>
  lump({
    detail: 2,
    rough: 0.2,
    seed: 17,
    // Its dark heart, under the spiny cards (gorseTexture).
    colourAt: (x, y, z, rand, c) => (y > 0 && rand() < 0.12 ? c.setRGB(0.45, 0.42, 0.08) : c.setRGB(0.09 + rand() * 0.03, 0.17 + rand() * 0.04, 0.06)),
  });
// The rocks' shapes (sim/dressing.mjs ROCK_SHAPES), at size 1: vertex
// colours a shade of the stone (its colour is per instance, STONE_COLOURS),
// with moss on top now and then.
const mossy = (y, rand, c, v) => (y > 0.5 && rand() < 0.35 ? c.setRGB(v * 0.62, v * 0.86, v * 0.42) : c.setRGB(v, v * (0.97 + rand() * 0.05), v * (0.94 + rand() * 0.06)));
const stoneShade = (seed, rough = 0.22, detail = 2) =>
  lump({ detail, rough, seed, colourAt: (x, y, z, rand, c) => mossy(y, rand, c, (0.85 + rand() * 0.25) * (y > 0 ? 1 : 0.8)) });
// A better rock (High and up; the owner: "More rocky areas. And good
// quality"): a fine sphere pushed in and out by noise at a few sizes, then
// cleaved by a few planes - the flat broken faces real stone has - its
// underside flattened into the ground; darker down in its hollows, mossy
// on top now and then. rough: how lumpy; planes: how many cleaved faces.
function noise3(seed) {
  const h = (x, y, z) => {
    let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1440670441) + Math.imul(seed, 2246822519)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  };
  const s = (t) => t * t * (3 - 2 * t);
  return (x, y, z) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const iz = Math.floor(z);
    const fx = s(x - ix);
    const fy = s(y - iy);
    const fz = s(z - iz);
    const l = (a, b, t) => a + (b - a) * t;
    const c = (dy, dz) => l(h(ix, iy + dy, iz + dz), h(ix + 1, iy + dy, iz + dz), fx);
    return l(l(c(0, 0), c(1, 0), fy), l(c(0, 1), c(1, 1), fy), fz) * 2 - 1;
  };
}
export function rockLump(seed, { rough = 0.22, planes = 3 } = {}) {
  const geo = new THREE.IcosahedronGeometry(1, 3);
  geo.deleteAttribute("normal");
  geo.deleteAttribute("uv");
  const g = mergeVertices(geo, 1e-4);
  const pos = g.attributes.position;
  const n = noise3(seed);
  const rand = seeded(seed * 7 + 3);
  const cuts = Array.from({ length: planes }, () => {
    const a = rand() * Math.PI * 2;
    const up = (rand() - 0.3) * 1.2;
    const v = new THREE.Vector3(Math.cos(a), up, Math.sin(a)).normalize();
    return { v, at: 0.55 + rand() * 0.25 };
  });
  const p = new THREE.Vector3();
  const pushes = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    const push = 1 + rough * (0.65 * n(p.x * 1.4, p.y * 1.4, p.z * 1.4) + 0.25 * n(p.x * 3.3 + 5, p.y * 3.3, p.z * 3.3) + 0.1 * n(p.x * 7 + 9, p.y * 7, p.z * 7));
    p.multiplyScalar(push);
    for (const c of cuts) {
      const d = p.dot(c.v) - c.at;
      if (d > 0) p.addScaledVector(c.v, -d * 0.92);
    }
    if (p.y < 0) p.y *= 0.3;
    pushes[i] = push;
    pos.setXYZ(i, p.x, p.y, p.z);
  }
  g.computeVertexNormals();
  const nor = g.attributes.normal;
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    // Darker where pushed in (its hollows and cracks) and underneath;
    // moss on its upward faces now and then.
    const hollow = Math.min(1, Math.max(0, (1 + rough * 0.4 - pushes[i]) / (rough * 1.2)));
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    // (Its shade varying broadly over it, never vertex to vertex: that
    // read as camouflage.)
    const broad = 0.94 + 0.12 * n(x * 0.9 + 3, y * 0.9, z * 0.9);
    const v = (0.98 - 0.3 * hollow) * (y > 0 ? 1 : 0.8) * broad;
    const moss = Math.max(0, Math.min(1, (nor.getY(i) - 0.7) * 4)) * Math.max(0, Math.min(1, (n(x * 1.3 + 11, y * 1.3, z * 1.3) - 0.35) * 4));
    col.set([v * (1 - 0.3 * moss), v * (1 - 0.12 * moss), v * (0.97 - 0.48 * moss)], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
}

// The rocks' surface (High and up): grain and speckle in the stone, light
// and dark mottling, a fine bumpy surface catching the sun, and pale
// lichen spotting its tops - worked out where each pixel is, so it never
// stretches however big the rock.
function rockMaterial() {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  if (!HIGH) return m;
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 rWorld;")
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
        {
          vec4 rw = vec4(transformed, 1.0);
          #ifdef USE_BATCHING
          rw = batchingMatrix * rw;
          #endif
          #ifdef USE_INSTANCING
          rw = instanceMatrix * rw;
          #endif
          rWorld = (modelMatrix * rw).xyz;
        }`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 rWorld;
        float rH;
        float rHash(vec3 p) {
          p = fract(p * 0.3183099 + 0.1);
          p *= 17.0;
          return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }
        float rNoise(vec3 x) {
          vec3 i = floor(x);
          vec3 f = fract(x);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(rHash(i), rHash(i + vec3(1, 0, 0)), f.x), mix(rHash(i + vec3(0, 1, 0)), rHash(i + vec3(1, 1, 0)), f.x), f.y),
                     mix(mix(rHash(i + vec3(0, 0, 1)), rHash(i + vec3(1, 0, 1)), f.x), mix(rHash(i + vec3(0, 1, 1)), rHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
        }`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        {
          float big = rNoise(rWorld * 1.7);
          float mid = rNoise(rWorld * 6.3 + 3.0);
          float fine = rNoise(rWorld * 23.0 + 7.0);
          rH = 0.55 * mid + 0.45 * fine;
          diffuseColor.rgb *= 0.88 + 0.2 * big + 0.08 * (mid - 0.5) + 0.06 * (fine - 0.5);
          // A touch warmer: weathered stone, never blue-grey.
          diffuseColor.rgb *= vec3(1.04, 1.0, 0.93);
          // Specks: darker grains and the odd pale one.
          float speck = rHash(floor(rWorld * 40.0));
          diffuseColor.rgb *= speck > 0.94 ? 1.1 : speck < 0.06 ? 0.86 : 1.0;
          // Lichen on what faces up: pale grey-green and mustard spots.
          vec3 nW = normalize((vec4(vNormal, 0.0) * viewMatrix).xyz);
          float lich = smoothstep(0.5, 0.9, nW.y) * smoothstep(0.62, 0.78, rNoise(rWorld * 2.2 + 11.0));
          vec3 lichen = rNoise(rWorld * 0.9 + 5.0) > 0.5 ? vec3(0.62, 0.64, 0.5) : vec3(0.66, 0.58, 0.28);
          diffuseColor.rgb = mix(diffuseColor.rgb, lichen * (0.9 + 0.2 * fine), lich * 0.45);
        }`,
      )
      .replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
        {
          // The surface's fine bumps, from the same noise (as a bump map
          // does: its slope across the screen).
          vec3 dpx = dFdx(-vViewPosition);
          vec3 dpy = dFdy(-vViewPosition);
          float hx = dFdx(rH);
          float hy = dFdy(rH);
          vec3 r1 = cross(dpy, normal);
          vec3 r2 = cross(normal, dpx);
          float det = dot(dpx, r1);
          vec3 grad = sign(det) * (hx * r1 + hy * r2);
          normal = normalize(abs(det) * normal - grad * 0.12);
        }`,
      );
  };
  m.customProgramCacheKey = () => "rock-v4";
  return m;
}

function rockShapes() {
  if (HIGH) {
    return [
      rockLump(23, { rough: 0.24, planes: 2 }).scale(1, 0.75, 0.9),
      rockLump(29, { rough: 0.16, planes: 3 }).scale(1.3, 0.32, 1),
      rockLump(31, { rough: 0.14, planes: 5 }).scale(0.95, 0.8, 0.8),
      mergeGeometries([rockLump(37, { rough: 0.22, planes: 3 }).scale(0.6, 0.7, 0.55).translate(-0.38, 0, 0.05), rockLump(41, { rough: 0.22, planes: 3 }).scale(0.55, 0.62, 0.5).translate(0.36, 0, -0.04)]),
      rockLump(43, { rough: 0.32, planes: 4 }).scale(2, 0.38, 1.25),
    ];
  }
  const boulder = stoneShade(23).scale(1, 0.75, 0.9);
  const slab = stoneShade(29, 0.12).scale(1.3, 0.32, 1);
  const block = stoneShade(31, 0.1, 1).scale(0.95, 0.8, 0.8);
  const a = stoneShade(37, 0.18).scale(0.6, 0.7, 0.55).translate(-0.38, 0, 0.05);
  const b = stoneShade(41, 0.18).scale(0.55, 0.62, 0.5).translate(0.36, 0, -0.04);
  const split = mergeGeometries([a, b]);
  const outcrop = stoneShade(43, 0.35).scale(2, 0.38, 1.25);
  return [boulder, slab, block, split, outcrop];
}
export const STONE_COLOURS = {
  granite: [0.5, 0.48, 0.47],
  sandstone: [0.62, 0.5, 0.37],
  limestone: [0.63, 0.61, 0.56],
  basalt: [0.3, 0.31, 0.32],
};
const BARK = [0.4, 0.32, 0.24];
// A stump (cut end pale) and a fallen log, at size 1, bark shades in their
// vertex colours (the bark's colour per instance).
function woodShapes() {
  const shade = (geo, endAt) => {
    geo.deleteAttribute("uv");
    const pos = geo.attributes.position;
    const nor = geo.attributes.normal;
    const col = new Float32Array(pos.count * 3);
    const rand = seeded(pos.count);
    for (let i = 0; i < pos.count; i++) {
      const end = endAt(pos, nor, i);
      const v = 0.85 + rand() * 0.25;
      col.set(end ? [1.9, 1.75, 1.3] : [v, v, v], i * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return geo;
  };
  const stump = shade(new THREE.CylinderGeometry(0.36, 0.46, 0.55, 9, 1).translate(0, 0.2, 0), (pos, nor, i) => nor.getY(i) > 0.9);
  const log = shade(new THREE.CylinderGeometry(0.24, 0.3, 3.2, 8, 2).rotateZ(Math.PI / 2).translate(0, 0.18, 0), (pos, nor, i) => Math.abs(nor.getX(i)) > 0.9);
  return [stump, log];
}

// A lily pad (a disc with a notch, lying flat), and pads with a cream or a
// pink flower: vertex colours carry the lot.
function lilyShapes() {
  const pad = () => {
    const g = new THREE.CircleGeometry(1, 14, 0.25, Math.PI * 2 - 0.5).rotateX(-Math.PI / 2);
    g.deleteAttribute("uv");
    const col = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < g.attributes.position.count; i++) col.set(i === 0 ? [0.22, 0.36, 0.14] : [0.3, 0.46, 0.18], i * 3);
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  };
  const flower = (rgb) => {
    const petals = new THREE.ConeGeometry(0.32, 0.28, 7, 1, true).rotateX(Math.PI).translate(0, 0.16, 0.15);
    petals.deleteAttribute("uv");
    const col = new Float32Array(petals.attributes.position.count * 3);
    for (let i = 0; i < petals.attributes.position.count; i++) col.set(rgb, i * 3);
    petals.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return mergeGeometries([pad().toNonIndexed(), petals.toNonIndexed()]);
  };
  return [pad().toNonIndexed(), flower([0.95, 0.9, 0.74]), flower([0.95, 0.66, 0.74])];
}

// One batched mesh of several shapes: place(piece, matrix, colour) sets
// where it stands and its tint and returns which shape it is (or false to
// leave it out).
function batch(geos, material, list, place, { shadows = false } = {}) {
  if (!list.length) return null;
  const vertices = geos.reduce((a, g) => a + g.attributes.position.count, 0);
  const indices = geos.reduce((a, g) => a + (g.index ? g.index.count : 0), 0);
  const mesh = new THREE.BatchedMesh(list.length, vertices, Math.max(1, indices), material);
  const ids = geos.map((g) => mesh.addGeometry(g));
  const m = new THREE.Matrix4();
  const colour = new THREE.Color();
  for (const piece of list) {
    colour.setRGB(1, 1, 1);
    const shape = place(piece, m, colour);
    if (shape === false) continue;
    const id = mesh.addInstance(ids[shape]);
    mesh.setMatrixAt(id, m);
    mesh.setColorAt(id, colour);
  }
  mesh.castShadow = shadows;
  // (Small: the near shadow map's only, where there is one - shadowwatch.js.)
  mesh.userData.shadowNear = shadows;
  mesh.receiveShadow = true;
  return mesh;
}

// Cards round a point, `n` of them, each w wide and h high.
function star(n, w, h) {
  const card = new THREE.PlaneGeometry(w, h).translate(0, h / 2, 0);
  const geo = mergeGeometries(Array.from({ length: n }, (_, i) => card.clone().rotateY((i / n) * Math.PI)));
  const nor = geo.attributes.normal;
  for (let i = 0; i < nor.count; i++) nor.setXYZ(i, 0, 1, 0);
  return geo;
}

// A gorse bush's shape at size 1: a few lumps making a low, uneven dome
// (x, y, z, radius, metres), its leaf cards scattered over them as a
// tree's crown's are (trees.js cardsOn) - small, facing every way, so it
// reads as a spiky mound from any side rather than a few flat sheets.
const GORSE_LUMPS = [
  [0, 0.45, 0, 0.6],
  [0.42, 0.35, 0.15, 0.45],
  [-0.4, 0.33, -0.1, 0.48],
  [0.1, 0.38, -0.42, 0.42],
  [-0.1, 0.4, 0.42, 0.42],
  // A skirt of lower lumps, so no gap shows at its foot.
  [0.5, 0.12, -0.25, 0.35],
  [-0.45, 0.12, 0.3, 0.35],
  [0.15, 0.12, 0.55, 0.33],
  [-0.2, 0.12, -0.55, 0.33],
];

let gorseMap = null;
// A clump of spiny dark-green shoots, thick with small yellow flowers, its
// edge ragged with spines.
function gorseTexture() {
  if (gorseMap) return gorseMap;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const rand = seeded(41);
  const inside = (x, y, r) => Math.hypot(x - size / 2, y - size / 2) < size * r;
  // Tufts of foliage filling it (thin strokes alone vanish at a
  // distance, as the texture's mipmaps average them away)...
  for (let i = 0; i < 420; i++) {
    const x = rand() * size;
    const y = rand() * size;
    if (!inside(x, y, 0.36)) continue;
    ctx.fillStyle = `rgb(${28 + rand() * 22},${55 + rand() * 30},${18 + rand() * 12})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 3 + rand() * 4, 2 + rand() * 3, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  // ...spines over them, pointing out from the middle and past the edge...
  for (let i = 0; i < 1100; i++) {
    const x = rand() * size;
    const y = rand() * size;
    if (!inside(x, y, 0.42)) continue;
    const a = Math.atan2(y - size / 2, x - size / 2) + (rand() - 0.5) * 1.6;
    const len = 4 + rand() * 7;
    ctx.strokeStyle = `rgb(${30 + rand() * 25},${60 + rand() * 30},${20 + rand() * 12})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }
  // ...and flowers.
  for (let i = 0; i < 240; i++) {
    const x = rand() * size;
    const y = rand() * size;
    if (!inside(x, y, 0.4)) continue;
    ctx.fillStyle = `rgb(${225 + rand() * 30},${180 + rand() * 40},${20 + rand() * 30})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.6 + rand() * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  gorseMap = cutoutTexture(canvas, [60, 80, 30]);
  return gorseMap;
}

let heatherMap = null;
// Dense fine sprigs, brown-green at the base, purple with flowers along
// their upper half.
function heatherTexture() {
  if (heatherMap) return heatherMap;
  const w = 128;
  const h = 64;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const rand = seeded(19);
  for (let i = 0; i < 70; i++) {
    const x = w * (0.04 + rand() * 0.92);
    const edge = Math.min(x, w - x) / (w / 2);
    const top = h * (0.08 + (1 - edge) * 0.45 + rand() * 0.25);
    const lean = (rand() - 0.5) * 14;
    ctx.strokeStyle = `rgb(${70 + rand() * 30},${68 + rand() * 25},${38 + rand() * 15})`;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.quadraticCurveTo(x + lean * 0.4, (h + top) / 2, x + lean, top);
    ctx.stroke();
    for (let k = 0; k < 7; k++) {
      const f = rand() * 0.55;
      const px = x + lean * (1 - f * 0.8) + (rand() - 0.5) * 3;
      const py = top + (h - top) * f;
      const v = rand();
      ctx.fillStyle = v < 0.7 ? `rgb(${128 + rand() * 30},${84 + rand() * 22},${118 + rand() * 28})` : `rgb(${100 + rand() * 20},${92 + rand() * 18},${58})`;
      ctx.beginPath();
      ctx.arc(px, py, 1.3 + rand() * 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  heatherMap = cutoutTexture(canvas, [110, 80, 100]);
  return heatherMap;
}

// Crossed cards, standing on the ground: width w, height h.
function crossed(w, h) {
  const card = new THREE.PlaneGeometry(w, h).translate(0, h / 2, 0);
  const geo = mergeGeometries([card, card.clone().rotateY(Math.PI / 2)]);
  // Normals straight up, so they light like the ground they stand in.
  const nor = geo.attributes.normal;
  for (let i = 0; i < nor.count; i++) nor.setXYZ(i, 0, 1, 0);
  return geo;
}

let flowerMap = null;
// A few thin stems with small white heads - tinted each patch's colour.
function flowerTexture() {
  if (flowerMap) return flowerMap;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const rand = seeded(29);
  for (let i = 0; i < 7; i++) {
    const x = size * (0.12 + rand() * 0.76);
    const top = size * (0.1 + rand() * 0.45);
    const lean = (rand() - 0.5) * 16;
    ctx.strokeStyle = "rgb(40,70,28)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, size);
    ctx.quadraticCurveTo(x + lean * 0.3, (size + top) / 2, x + lean, top);
    ctx.stroke();
    ctx.fillStyle = "rgb(250,250,244)";
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(x + lean + Math.cos(a) * 4, top + Math.sin(a) * 4, 3.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgb(235,200,70)";
    ctx.beginPath();
    ctx.arc(x + lean, top, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  flowerMap = cutoutTexture(canvas, [60, 90, 40]);
  return flowerMap;
}

let reedMap = null;
// Tall narrow blades, some bent over, and a few brown seed heads.
function reedTexture() {
  if (reedMap) return reedMap;
  const w = 64;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const rand = seeded(37);
  for (let i = 0; i < 16; i++) {
    const x = w * (0.15 + rand() * 0.7);
    const top = h * (0.02 + rand() * 0.35);
    const lean = (rand() - 0.5) * 22;
    const v = 120 + rand() * 80;
    ctx.fillStyle = `rgb(${v * 0.62},${v * 0.8},${v * 0.4})`;
    ctx.beginPath();
    ctx.moveTo(x - 1.6, h);
    ctx.quadraticCurveTo(x + lean * 0.2, (h + top) / 2, x + lean, top);
    ctx.quadraticCurveTo(x + lean * 0.2 + 0.8, (h + top) / 2, x + 1.6, h);
    ctx.fill();
  }
  for (let i = 0; i < 3; i++) {
    const x = w * (0.25 + rand() * 0.5);
    const top = h * (0.04 + rand() * 0.12);
    ctx.fillStyle = "rgb(90,60,35)";
    ctx.beginPath();
    ctx.ellipse(x, top + 14, 3, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgb(80,95,50)";
    ctx.fillRect(x - 0.7, top + 26, 1.4, h - top - 26);
  }
  reedMap = cutoutTexture(canvas, [80, 100, 50]);
  return reedMap;
}

let brackenMap = null;
// Bracken fronds: arching stems with rows of leaflets either side.
function brackenTexture() {
  if (brackenMap) return brackenMap;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const rand = seeded(53);
  for (let f = 0; f < 5; f++) {
    const x0 = size * (0.2 + rand() * 0.6);
    const lean = (rand() - 0.5) * 50;
    const top = size * (0.05 + rand() * 0.25);
    const v = 150 + rand() * 60;
    ctx.strokeStyle = ctx.fillStyle = `rgb(${v * 0.55},${v * 0.8},${v * 0.35})`;
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const x = x0 + lean * t * t;
      const y = size - (size - top) * t;
      const len = (1 - t) * 16 + 3;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(x + side * len * 0.5, y + 2, len * 0.5, 2.2, side * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x0, size);
    ctx.quadraticCurveTo(x0 + lean * 0.3, (size + top) / 2, x0 + lean, top);
    ctx.stroke();
  }
  brackenMap = cutoutTexture(canvas, [80, 110, 50]);
  return brackenMap;
}

let fescueMap = null;
// Fine grey-green blades, and nodding golden seed heads on thin stems.
function fescueTexture() {
  if (fescueMap) return fescueMap;
  const w = 64;
  const h = 128;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const rand = seeded(59);
  for (let i = 0; i < 22; i++) {
    const x = w * (0.1 + rand() * 0.8);
    const top = h * (0.35 + rand() * 0.4);
    const lean = (rand() - 0.5) * 16;
    const v = 130 + rand() * 60;
    ctx.strokeStyle = `rgb(${v * 0.7},${v * 0.82},${v * 0.55})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.quadraticCurveTo(x + lean * 0.3, (h + top) / 2, x + lean, top);
    ctx.stroke();
  }
  for (let i = 0; i < 7; i++) {
    const x = w * (0.15 + rand() * 0.7);
    const top = h * (0.04 + rand() * 0.25);
    const lean = (rand() - 0.5) * 18;
    ctx.strokeStyle = "rgb(170,160,95)";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.quadraticCurveTo(x + lean * 0.4, (h + top) / 2, x + lean, top);
    ctx.stroke();
    ctx.fillStyle = `rgb(${205 + rand() * 30},${165 + rand() * 25},${70 + rand() * 25})`;
    for (let k = 0; k < 5; k++) {
      ctx.beginPath();
      ctx.ellipse(x + lean + (rand() - 0.5) * 5, top + k * 3.2, 1.8, 3, lean * 0.02, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  fescueMap = cutoutTexture(canvas, [150, 150, 90]);
  return fescueMap;
}

// sim/dressing.mjs FLOWER_COLOURS, in order.
export const FLOWER_TINTS = [
  [1, 1, 0.96], // white
  [1, 0.86, 0.25], // yellow
  [0.72, 0.46, 0.88], // purple
  [0.5, 0.62, 1], // blue
  [1, 0.62, 0.78], // pink
  [0.92, 0.25, 0.22], // red (poppies)
  [1, 0.6, 0.2], // orange
  [0.82, 0.68, 0.95], // lilac
  [1, 0.95, 0.78], // cream
];

// One instanced mesh of `geo` for each piece: place(piece, matrix, colour)
// sets where it stands and its tint, or returns false to leave it out.
function instances(geo, material, list, place, { shadows = false } = {}) {
  if (!list.length) return null;
  const mesh = new THREE.InstancedMesh(geo, material, list.length);
  const m = new THREE.Matrix4();
  const colour = new THREE.Color();
  let n = 0;
  for (const piece of list) {
    colour.setRGB(1, 1, 1);
    if (place(piece, m, colour) === false) continue;
    mesh.setMatrixAt(n, m);
    mesh.setColorAt(n, colour);
    n++;
  }
  mesh.count = n;
  mesh.castShadow = shadows;
  // (Small: the near shadow map's only, where there is one - shadowwatch.js.)
  mesh.userData.shadowNear = shadows;
  mesh.receiveShadow = true;
  return mesh;
}

// The dressing's meshes. high: wildflowers and reeds too (they're cards,
// see-through, and only worth it with the rest of High's detail).
export function makeDressing(d, heightAt, { high = true, seed = 1 } = {}) {
  const group = new THREE.Group();
  const rand = seeded(seed);
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const at = new THREE.Vector3();
  const size = new THREE.Vector3();
  const stand = (m, x, z, turn, sx, sy, sz, sink = 0) => {
    const wx = z;
    const wz = -x;
    at.set(wx, heightAt(wx, wz) - sink, wz);
    q.setFromAxisAngle(up, turn);
    m.compose(at, q, size.set(sx, sy, sz));
  };
  // Rocks, and gorse's dark heart under its swaying cards, stand still.
  const solid = withSceneryHooks(new THREE.MeshLambertMaterial({ vertexColors: true }), "rock");
  const stone = withSceneryHooks(rockMaterial(), "rock");
  // (High's surface's node version, on WebGPURenderer: glsl/bitsnode.js.
  // Plain, it's the hooks' alone.)
  if (HIGH) markTwin(stone, "rock");
  const add = (mesh, name) => {
    if (!mesh) return;
    mesh.name = name;
    group.add(mesh);
  };
  add(
    instances(star(3, 0.95, 0.42), foliageMaterial({ map: heatherTexture(), alphaTest: 0.45 }, "dressing"), d.heather ?? [], ([x, z, s, turn], m, c) => {
      stand(m, x, z, turn, s * 1.6, (0.55 + s) * (0.7 + rand() * 0.5), s * 1.6, 0.02);
      // Most in flower; now and then a browner, older clump.
      const v = 0.8 + rand() * 0.3;
      if (rand() < 0.2) c.setRGB(v * 0.9, v * 0.85, v * 0.6);
      else c.setRGB(v, v * (0.92 + rand() * 0.1), v);
    }),
    "heather",
  );
  add(
    instances(
      GORSE(),
      solid,
      d.gorse ?? [],
      ([x, z, s, turn], m, c) => {
        // Its dark heart, inside the cards.
        stand(m, x, z, turn, s * 0.8, s * 0.6, s * 0.78, 0.08);
        c.setScalar(0.85 + rand() * 0.25);
      },
      { shadows: true },
    ),
    "gorse",
  );
  // Its spiny, flowering outside: small cards over its lumps. Each bush
  // its own green - fresher, darker or yellower.
  const spines = seeded(seed + 1);
  add(
    instances(cardsOn(GORSE_LUMPS, 24, 0.75, seeded(43)), foliageMaterial({ map: gorseTexture(), vertexColors: true, alphaTest: 0.45 }, "dressing"), d.gorse ?? [], ([x, z, s, turn], m, c) => {
      stand(m, x, z, turn, s * (0.9 + spines() * 0.25), s * (0.8 + spines() * 0.3), s * (0.9 + spines() * 0.25), 0.05);
      c.setHSL(0.18 + spines() * 0.08, 0.25 + spines() * 0.3, 0.78 + spines() * 0.2);
    }),
    "gorse-spines",
  );
  // Rocks of five shapes in the hole's own stone, the feature boulders by
  // the tees, and stumps and fallen logs: one batch.
  const stoneRGB = STONE_COLOURS[d.stone] ?? STONE_COLOURS.granite;
  const solids = [
    ...(d.rocks ?? []).map((r) => ["rock", r]),
    ...(d.boulders ?? []).map((r) => ["rock", r]),
    ...(d.stumps ?? []).map((r) => ["wood", r]),
  ];
  add(
    batch(
      [...rockShapes(), ...woodShapes()],
      stone,
      solids,
      ([what, [x, z, s, turn, shape]], m, c) => {
        if (what === "wood") {
          stand(m, x, z, turn, s, s, s, shape ? 0.05 : 0.03);
          const v = 0.85 + rand() * 0.25;
          c.setRGB(BARK[0] * v, BARK[1] * v, BARK[2] * v);
          return 5 + (shape ? 1 : 0);
        }
        // Half sunk, some flatter than others.
        stand(m, x, z, turn, s * (0.8 + rand() * 0.5), s * (0.45 + rand() * 0.35) * 1.3, s * (0.7 + rand() * 0.4), s * 0.2);
        const v = 0.9 + rand() * 0.2;
        c.setRGB(stoneRGB[0] * v, stoneRGB[1] * v, stoneRGB[2] * v);
        return Number.isInteger(shape) ? shape % 5 : 0;
      },
      { shadows: true },
    ),
    "rocks",
  );
  if (high) {
    add(
      instances(crossed(0.45, 0.38), foliageMaterial({ map: flowerTexture(), alphaTest: 0.5 }, "dressing"), d.flowers ?? [], ([x, z, s, turn, hue], m, c) => {
        stand(m, x, z, turn, s, s * (0.8 + rand() * 0.5), s);
        // Each flower a shade of its own: a little lighter or darker,
        // warmer or cooler than the rest of its patch.
        const [r, g, b] = FLOWER_TINTS[hue] ?? FLOWER_TINTS[0];
        const v = 0.86 + rand() * 0.2;
        const warm = (rand() - 0.5) * 0.12;
        c.setRGB(Math.min(1, r * v * (1 + warm)), Math.min(1, g * v), Math.min(1, b * v * (1 - warm)));
      }),
      "flowers",
    );
    add(
      instances(crossed(0.6, 1.5), foliageMaterial({ map: reedTexture(), alphaTest: 0.5 }, "dressing"), d.reeds ?? [], ([x, z, s, turn], m, c) => {
        // Rooted just under the water's surface, drawn from the bank's
        // height nearby (the water itself is flat, a little lower).
        stand(m, x, z, turn, s, s * (0.8 + rand() * 0.4), s, 0.15);
        c.setRGB(0.9 + rand() * 0.15, 0.9 + rand() * 0.15, 0.85 + rand() * 0.1);
      }),
      "reeds",
    );
    // Bracken at the woods' edges, green to russet.
    add(
      instances(star(4, 1.2, 0.75), foliageMaterial({ map: brackenTexture(), alphaTest: 0.45 }, "dressing"), d.bracken ?? [], ([x, z, s, turn, russet], m, c) => {
        stand(m, x, z, turn, s, s * (0.8 + rand() * 0.4), s, 0.03);
        const r = russet ?? 0;
        c.setRGB(0.62 + 0.4 * r, 0.8 - 0.28 * r, 0.42 - 0.14 * r);
      }),
      "bracken",
    );
    // Fescue, with golden seed heads.
    add(
      instances(crossed(0.55, 0.75), foliageMaterial({ map: fescueTexture(), alphaTest: 0.45 }, "dressing"), d.fescue ?? [], ([x, z, s, turn], m, c) => {
        stand(m, x, z, turn, s, s * (0.8 + rand() * 0.5), s, 0.02);
        const v = 0.88 + rand() * 0.2;
        c.setRGB(v, v * 0.97, v * 0.9);
      }),
      "fescue",
    );
    // Lily pads, on the water (its level with each pad; else the ground's).
    const lilyMat = withSceneryHooks(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), "rock");
    add(
      batch(lilyShapes(), lilyMat, d.lilies ?? [], ([x, z, s, turn, flower, level], m, c) => {
        stand(m, x, z, turn, s, s, s);
        if (Number.isFinite(level)) m.elements[13] = level + 0.02;
        const v = 0.9 + rand() * 0.2;
        c.setRGB(v, v, v);
        return flower === 1 || flower === 2 ? flower : 0;
      }),
      "lilies",
    );
  }
  return group;
}
