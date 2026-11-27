// A links hole's ground, drawn (sim/linksground.mjs says where): tall,
// pale marram grass along the dune crests, swaying with the wind; rabbit
// scrapes in the dune faces; blown sand lying over the turf downwind of
// the bunkers; and pebbles and broken shells round them. Hole frame in,
// world out: (x, z) -> (z, -x). groundY(wx, wz): the ground.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { foliageMaterial, cutoutTexture } from "./trees.js";
import { LAYER, onLayer } from "./grass.js";
import { withSceneryHooks } from "./glsl/hooks.js";

function seeded(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
}

// ---- Marram ---------------------------------------------------------------------

let marramMap = null;
// Long, narrow blades curving out from a tuft, rolled and pale - greyer
// green below, bleached straw at the tips - with a few seed heads.
function marramTexture() {
  if (marramMap) return marramMap;
  const w = 128;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const rand = seeded(0x3a4a);
  ctx.lineCap = "round";
  for (let i = 0; i < 26; i++) {
    const x0 = w / 2 + (rand() - 0.5) * 22;
    const lean = (rand() - 0.5) * 1.6;
    const len = h * (0.55 + rand() * 0.42);
    const tipX = x0 + lean * len * 0.45;
    const tipY = h - len;
    const g = ctx.createLinearGradient(0, h, 0, tipY);
    if (g) {
      g.addColorStop(0, "rgb(118,128,92)");
      g.addColorStop(0.55, "rgb(176,178,128)");
      g.addColorStop(1, "rgb(222,206,150)");
      ctx.strokeStyle = g;
    }
    ctx.lineWidth = 1.6 + rand() * 1.8;
    ctx.beginPath();
    ctx.moveTo(x0, h);
    ctx.quadraticCurveTo(x0 + lean * len * 0.08, h - len * 0.55, tipX, tipY);
    ctx.stroke();
  }
  for (let i = 0; i < 3; i++) {
    const x = w / 2 + (rand() - 0.5) * 30;
    ctx.strokeStyle = "rgb(196,184,134)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.lineTo(x + (rand() - 0.5) * 10, 8);
    ctx.stroke();
    ctx.fillStyle = "rgb(214,198,140)";
    ctx.beginPath();
    ctx.ellipse(x + (rand() - 0.5) * 10, 18, 3, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  marramMap = cutoutTexture(canvas, [180, 176, 128]);
  return marramMap;
}

// Three cards round a clump, a metre tall at size 1.
function tuftCards() {
  const card = new THREE.PlaneGeometry(0.7, 1).translate(0, 0.5, 0);
  const geo = mergeGeometries([0, 1, 2].map((i) => card.clone().rotateY((i / 3) * Math.PI)));
  const nor = geo.attributes.normal;
  for (let i = 0; i < nor.count; i++) nor.setXYZ(i, 0, 1, 0);
  return geo;
}

function marramMesh(list, groundY) {
  if (!list.length) return null;
  const mesh = new THREE.InstancedMesh(tuftCards(), foliageMaterial({ map: marramTexture(), alphaTest: 0.4 }, "dressing"), list.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const c = new THREE.Color();
  const up = new THREE.Vector3(0, 1, 0);
  const rand = seeded(list.length + 7);
  list.forEach(([x, z, size, turn], i) => {
    const wx = z;
    const wz = -x;
    q.setFromAxisAngle(up, turn);
    s.set(size * (0.85 + rand() * 0.3), size, size * (0.85 + rand() * 0.3));
    p.set(wx, groundY(wx, wz) - 0.03, wz);
    mesh.setMatrixAt(i, m.compose(p, q, s));
    // Greener or more bleached, clump to clump.
    const k = rand();
    mesh.setColorAt(i, c.setRGB(0.9 + k * 0.2, 0.92 + k * 0.14, 0.86 + k * 0.1));
  });
  mesh.name = "marram";
  mesh.receiveShadow = true;
  mesh.computeBoundingSphere();
  return mesh;
}

// ---- Decals: rabbit scrapes, blown sand -------------------------------------------

const pictures = {};
function decalPicture(kind) {
  if (pictures[kind]) return pictures[kind];
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const rand = seeded(kind === "rabbit" ? 0x7ab : 0xd71f);
  const c = size / 2;
  const blot = (x, y, r, rgb, a) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    if (!g) return;
    g.addColorStop(0, `rgba(${rgb},${a})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  };
  if (kind === "rabbit") {
    // Sandy spoil fanned out downhill, the burrow's dark mouth uphill.
    for (let i = 0; i < 40; i++) blot(c + (rand() - 0.5) * 70, c + 20 + rand() * 60, 14 + rand() * 26, "196,170,118", 0.35 + rand() * 0.3);
    for (let i = 0; i < 10; i++) blot(c + (rand() - 0.5) * 30, c - 30 + (rand() - 0.5) * 18, 10 + rand() * 12, "40,30,20", 0.5);
    blot(c, c - 32, 22, "18,13,9", 0.9);
  } else {
    // Sand blown over the turf: soft, rippled tongues.
    for (let i = 0; i < 60; i++) blot(c + (rand() - 0.5) * 150, c + (rand() - 0.5) * 90, 12 + rand() * 30, "214,196,150", 0.18 + rand() * 0.2);
    ctx.strokeStyle = "rgba(170,150,108,0.25)";
    for (let i = 0; i < 14; i++) {
      ctx.lineWidth = 1 + rand() * 2;
      ctx.beginPath();
      const y = c - 50 + i * 7 + (rand() - 0.5) * 3;
      ctx.moveTo(c - 70 + rand() * 20, y);
      ctx.bezierCurveTo(c - 20, y - 6, c + 20, y + 6, c + 70 - rand() * 20, y);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  pictures[kind] = tex;
  return tex;
}

// Each [x, z, size, turn] a picture laid over the ground (draped on it),
// size metres across its middle, one mesh for all of a kind.
function decals(list, groundY, kind, lift = 0.018) {
  if (!list.length) return null;
  const SEG = 12;
  const per = 1 + SEG * 2;
  const pos = new Float32Array(list.length * per * 3);
  const uv = new Float32Array(list.length * per * 2);
  const index = [];
  list.forEach(([x, z, size, turn], n) => {
    const base = n * per;
    const cx = z;
    const cz = -x;
    const put = (j, wx, wz, u, v) => {
      pos.set([wx, groundY(wx, wz) + lift, wz], (base + j) * 3);
      uv.set([u, v], (base + j) * 2);
    };
    put(0, cx, cz, 0.5, 0.5);
    for (let ring = 1; ring <= 2; ring++) {
      for (let s = 0; s < SEG; s++) {
        const a = (s / SEG) * Math.PI * 2;
        const r = (ring / 2) * size;
        put(1 + (ring - 1) * SEG + s, cx + Math.cos(a) * r, cz + Math.sin(a) * r, 0.5 + Math.cos(a - turn) * 0.25 * ring, 0.5 + Math.sin(a - turn) * 0.25 * ring);
      }
    }
    for (let s = 0; s < SEG; s++) index.push(base, base + 1 + ((s + 1) % SEG), base + 1 + s);
    for (let s = 0; s < SEG; s++) {
      const a0 = base + 1 + s;
      const a1 = base + 1 + ((s + 1) % SEG);
      index.push(a0, a1, a0 + SEG, a0 + SEG, a1, a1 + SEG);
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geo.setIndex(index);
  geo.computeVertexNormals();
  const nor = geo.attributes.normal;
  for (let i = 0; i < nor.count; i++) if (nor.getY(i) < 0) nor.setXYZ(i, -nor.getX(i), -nor.getY(i), -nor.getZ(i));
  const material = withSceneryHooks(onLayer(new THREE.MeshLambertMaterial({ map: decalPicture(kind), transparent: true, depthWrite: false }), LAYER.wear), "ground");
  const mesh = new THREE.Mesh(geo, material);
  mesh.name = kind === "rabbit" ? "rabbit scrapes" : "blown sand";
  mesh.renderOrder = -10 + LAYER.wear;
  mesh.receiveShadow = true;
  return mesh;
}

// ---- Pebbles and shells -------------------------------------------------------------

function pebbleMesh(list, groundY) {
  if (!list.length) return null;
  const geo = new THREE.IcosahedronGeometry(1, 0).scale(1, 0.45, 0.8);
  const mesh = new THREE.InstancedMesh(geo, withSceneryHooks(new THREE.MeshLambertMaterial({ color: 0xffffff }), "rock"), list.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const c = new THREE.Color();
  const up = new THREE.Vector3(0, 1, 0);
  const rand = seeded(list.length * 13 + 1);
  list.forEach(([x, z, size, turn, shell], i) => {
    const wx = z;
    const wz = -x;
    q.setFromAxisAngle(up, turn);
    // A shell: flat and white (a cockle's half); a pebble: grey to brown.
    s.set(size, size * (shell ? 0.35 : 1), size * (shell ? 1 : 0.9));
    p.set(wx, groundY(wx, wz) + size * 0.15, wz);
    mesh.setMatrixAt(i, m.compose(p, q, s));
    const v = rand();
    mesh.setColorAt(i, shell ? c.setRGB(0.95, 0.92 - v * 0.08, 0.86 - v * 0.12) : c.setRGB(0.42 + v * 0.3, 0.4 + v * 0.26, 0.36 + v * 0.22));
  });
  mesh.name = "pebbles";
  mesh.receiveShadow = true;
  mesh.computeBoundingSphere();
  return mesh;
}

// Everything (sim/linksground.mjs linksGround's), as one group. high: the
// rabbit scrapes and pebbles too (small, for High and up).
export function makeLinksGround(ground, groundY, { high = true } = {}) {
  const group = new THREE.Group();
  group.name = "links ground";
  for (const m of [
    marramMesh(ground.marram, groundY),
    decals(ground.drifts, groundY, "drift", 0.016),
    high ? decals(ground.rabbit, groundY, "rabbit", 0.02) : null,
    high ? pebbleMesh(ground.pebbles, groundY) : null,
  ]) {
    if (m) group.add(m);
  }
  return group;
}
