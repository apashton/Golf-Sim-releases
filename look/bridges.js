// A timber bridge taking a cart path over water (sim/bridges.mjs says where
// and what pieces): a deck of weathered planks, and posts, rails and the
// beams under the deck in the timber the signs and their rails are made of
// (look/signs.js, look/palette.js CLUB), so it looks as if the same
// greenkeeper built it. Two instanced boxes for the lot: a bridge costs two
// draws however long it is. And a hole's bridges placed by hand - a real
// course's small stone arch over its burn, plain stone slabs - all in one
// mesh (makeHandBridges, below).

import * as THREE from "three";
import { CLUB } from "./palette.js";
import { withSceneryHooks } from "./glsl/hooks.js";
import { NOISE } from "./glsl/ground.js";
import { bridgePieces } from "../sim/bridges.mjs";

let mats = null;
function materials() {
  const m = (c) => withSceneryHooks(new THREE.MeshLambertMaterial({ color: c }), "sign");
  mats ??= { deck: m(CLUB.timberWeathered), frame: m(CLUB.timber) };
  return mats;
}

const box = new THREE.BoxGeometry(1, 1, 1);

// Boxes ({ a, b, w, h }, hole frame) as one instanced mesh, in world terms
// (hole (x, y, z) -> world (z, y, -x)). Each a touch lighter or darker, as
// timber is.
function boxes(list, material, seed) {
  const mesh = new THREE.InstancedMesh(box, material, list.length);
  const m = new THREE.Matrix4();
  const X = new THREE.Vector3();
  const Y = new THREE.Vector3();
  const Z = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const c = new THREE.Color();
  let r = seed >>> 0 || 1;
  const rand = () => ((r = (Math.imul(r, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  list.forEach(({ a, b, w, h }, i) => {
    const A = new THREE.Vector3(a[2], a[1], -a[0]);
    const B = new THREE.Vector3(b[2], b[1], -b[0]);
    const len = A.distanceTo(B) || 0.01;
    X.subVectors(B, A).normalize();
    // Across it: level, unless it stands upright (a post).
    Z.crossVectors(X, Math.abs(X.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : up).normalize();
    Y.crossVectors(Z, X).normalize();
    m.makeBasis(X.multiplyScalar(len), Y.multiplyScalar(h), Z.multiplyScalar(w));
    m.setPosition(A.add(B).multiplyScalar(0.5));
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, c.setScalar(0.88 + rand() * 0.2));
  });
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// The bridge on `span` of `path`. heightAt(wx, wz): the ground as the path
// is laid on it (world); waterAt(x, z): the water's height there (hole
// frame), or null where it's dry.
export function makeBridge(path, span, heightAt, waterAt) {
  const { planks, frame } = bridgePieces(path, span, (x, z) => heightAt(z, -x), waterAt);
  const group = new THREE.Group();
  const { deck, frame: timber } = materials();
  const seed = Math.round(span.from * 100) + 7;
  if (planks.length) group.add(boxes(planks, deck, seed));
  if (frame.length) group.add(boxes(frame, timber, seed + 1));
  group.userData.bridge = true;
  return group;
}

// ---- Bridges placed by hand -------------------------------------------------------------

// A hole's bridges placed by hand (sim/bridges.mjs handBridgeShape: the
// small stone arch over a real course's burn, plain flat slabs where its
// paths cross it): every one of them one mesh, in one material - its
// stone's pattern worked out in the shader from how far along and down
// (or across) each spot is: rough rubble of grey-buff stones on its faces
// and parapets, each its own shade with dark joints between; big pale
// flagstones on its deck; the arch's underside darker. Each blurs to its
// average far off, so it never shimmers. Colours from the course's
// photographs of the bridge (map-cache/photos/agl: in sun, nearly end on,
// and under cloud, nearly side on): the rubble a grey-brown between the two
// lights (some 140, 132, 118 out of 255), the flags pale buff (180, 166,
// 143), the joints dark. On WebGPURenderer it's drawn plain, in the same
// colours per stone kind, without the stones' pattern (look/twins.js).
export const HAND_STONE = { rubble: "#8c8576", rubbleLight: "#a39b8a", flags: "#b4a68f", under: "#6f695e", joint: "#4f4a42" };

// The joints' shade against the stone's (linear light).
const JOINT = new THREE.Color(HAND_STONE.joint).r / new THREE.Color(HAND_STONE.rubble).r;

let handMat = null;
function handMaterial() {
  if (handMat) return handMat;
  const material = new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors: true, side: THREE.DoubleSide });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec2 bUv;\nattribute float bKind;\nvarying vec2 vBUv;\nvarying float vBKind;")
      .replace("#include <project_vertex>", "#include <project_vertex>\nvBUv = bUv;\nvBKind = bKind;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec2 vBUv;
        varying float vBKind;
        ${NOISE}
        // Stones as cells of a jittered grid (cell: their size, metres):
        // x how far in from the cell's edge (a fraction of a cell), y the
        // stone's own shade (0 - 1).
        vec2 bStones(vec2 p, vec2 cell) {
          vec2 q = p / cell;
          vec2 i = floor(q);
          vec2 f = fract(q);
          float d1 = 8.0;
          float d2 = 8.0;
          vec2 id = vec2(0.0);
          for (int y = -1; y <= 1; y++) {
            for (int x = -1; x <= 1; x++) {
              vec2 g = vec2(float(x), float(y));
              vec2 o = vec2(gHash(i + g), gHash(i + g + 17.3)) * 0.8 + 0.1;
              vec2 r = g + o - f;
              float d = dot(r, r);
              if (d < d1) {
                d2 = d1;
                d1 = d;
                id = i + g;
              } else if (d < d2) d2 = d;
            }
          }
          return vec2(sqrt(d2) - sqrt(d1), gHash(id + 3.1));
        }`,
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        {
          // Rubble's stones a hand or two across; flags bigger.
          bool flags = vBKind > 0.5 && vBKind < 1.5;
          vec2 cell = flags ? vec2(0.62, 0.5) : vec2(0.3, 0.2);
          vec2 st = bStones(vBUv, cell);
          float px = max(max(fwidth(vBUv.x), fwidth(vBUv.y)), 1e-4) / min(cell.x, cell.y);
          float bNear = 1.0 - smoothstep(0.08, 0.3, px);
          float tone = flags ? 0.86 + 0.24 * st.y : 0.78 + 0.4 * st.y;
          tone *= 0.9 + 0.2 * gNoise(vBUv * (flags ? 5.0 : 9.0));
          // The joints: dark, narrow on the deck.
          float joint = 1.0 - smoothstep(flags ? 0.03 : 0.06, flags ? 0.07 : 0.14, st.x);
          // (Far off, its average: the joints' share darkening it a little.)
          float k = mix(0.92, tone * mix(1.0, ${JOINT.toFixed(3)}, joint), bNear);
          diffuseColor.rgb *= k;
        }`,
      );
  };
  material.customProgramCacheKey = () => "hand-bridge-v1";
  handMat = withSceneryHooks(material, "wall");
  return handMat;
}

// Every bridge placed by hand on a hole (shapes: sim/bridges.mjs
// handBridgeShape's) as one mesh, world frame - or null for none.
export function makeHandBridges(shapes) {
  const pos = [];
  const col = [];
  const uv = [];
  const kind = [];
  const index = [];
  const tint = [new THREE.Color(HAND_STONE.rubble), new THREE.Color(HAND_STONE.flags), new THREE.Color(HAND_STONE.under)];
  const light = new THREE.Color(HAND_STONE.rubbleLight);
  for (const shape of shapes) {
    for (const strip of shape.strips ?? []) {
      const rows = strip.rows;
      if (rows.length < 2) continue;
      const m = rows[0].length;
      if (m < 2 || rows.some((row) => row.length !== m)) continue;
      const base = pos.length / 3;
      for (const row of rows) {
        for (const [x, y, z, u, v] of row) {
          // (Hole frame to world: (x, z) -> (z, -x).)
          pos.push(z, y, -x);
          // (The rubble paler near its top, where the light and weather
          // catch it.)
          const c = strip.kind === 0 ? tint[0].clone().lerp(light, Math.max(0, 0.35 - v * 0.25)) : tint[strip.kind] ?? tint[0];
          col.push(c.r, c.g, c.b);
          uv.push(u, v);
          kind.push(strip.kind);
        }
      }
      for (let i = 0; i + 1 < rows.length; i++) {
        for (let j = 0; j + 1 < m; j++) {
          const a = base + i * m + j;
          const b = a + m;
          index.push(a, b, a + 1, a + 1, b, b + 1);
        }
      }
    }
  }
  if (!index.length) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  geo.setAttribute("bUv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute("bKind", new THREE.Float32BufferAttribute(kind, 1));
  geo.setIndex(index);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, handMaterial());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = "bridges by hand";
  mesh.userData.bridge = true;
  return mesh;
}
