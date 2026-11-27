// The ground round each tree's foot (sim/treefoot.mjs says how big and
// what's in it), on High and up: a patch of darker soil strewn with fallen
// leaves, twigs or rust-brown needles, ragged at its edge where the grass
// takes over, laid over the ground under the trunk - so a tree stands in
// the ground rather than on pristine turf. One mesh for every tree's,
// draped on the ground, one picture painted once and turned a different
// way under each tree.

import * as THREE from "three";
import { LAYER, onLayer } from "./grass.js";
import { withSceneryHooks } from "./glsl/hooks.js";
import { FOOT, FOOT_TINTS, footPatch } from "../sim/treefoot.mjs";
import { PHONE } from "./quality.js";

// The same scatter every time.
function seeded(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
}

let picture = null;
function footPicture() {
  if (picture) return picture;
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const rand = seeded(0xf007);
  const c = size / 2;
  // The bare soil: dark in the middle, fading out over a ragged edge made
  // of many soft blots, so no circle shows.
  for (let i = 0; i < 160; i++) {
    const a = rand() * Math.PI * 2;
    const d = Math.pow(rand(), 0.7) * c * 0.78;
    const r = c * (0.08 + rand() * 0.16) * (1 - (d / c) * 0.5);
    const g = ctx.createRadialGradient(c + Math.cos(a) * d, c + Math.sin(a) * d, 0, c + Math.cos(a) * d, c + Math.sin(a) * d, r);
    const v = 40 + rand() * 22;
    const a0 = 0.34 + rand() * 0.2;
    // (No gradient where there's no real canvas: the tests'.)
    if (!g) continue;
    g.addColorStop(0, `rgba(${v + 22},${v + 10},${v - 6},${a0})`);
    g.addColorStop(1, `rgba(${v + 22},${v + 10},${v - 6},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  // Fallen leaves: small ellipses in browns, tans and a few still green,
  // thicker near the trunk.
  for (let i = 0; i < 900; i++) {
    const a = rand() * Math.PI * 2;
    const d = Math.pow(rand(), 0.85) * c * 0.86;
    const fade = 1 - Math.pow(d / (c * 0.86), 2);
    if (rand() > fade + 0.15) continue;
    const pick = rand();
    const [r, g, b] = pick < 0.45 ? [118, 82, 44] : pick < 0.75 ? [150, 112, 60] : pick < 0.9 ? [92, 64, 38] : [98, 110, 52];
    const k = 0.8 + rand() * 0.4;
    ctx.save();
    ctx.translate(c + Math.cos(a) * d, c + Math.sin(a) * d);
    ctx.rotate(rand() * Math.PI);
    ctx.fillStyle = `rgba(${r * k},${g * k},${b * k},${0.6 + rand() * 0.35})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, 3 + rand() * 4, 1.6 + rand() * 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Twigs, and a few roots running out from the middle.
  ctx.lineCap = "round";
  for (let i = 0; i < 70; i++) {
    const a = rand() * Math.PI * 2;
    const d = rand() * c * 0.7;
    const x = c + Math.cos(a) * d;
    const y = c + Math.sin(a) * d;
    const t = rand() * Math.PI;
    const l = 6 + rand() * 16;
    ctx.strokeStyle = `rgba(${60 + rand() * 30},${44 + rand() * 20},${28},${0.55 + rand() * 0.3})`;
    ctx.lineWidth = 1 + rand() * 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(t) * l, y + Math.sin(t) * l);
    ctx.stroke();
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + rand() * 0.6;
    ctx.strokeStyle = "rgba(58,40,24,0.55)";
    ctx.lineWidth = 7 - i * 0.4;
    ctx.beginPath();
    ctx.moveTo(c, c);
    const l = c * (0.22 + rand() * 0.18);
    const bend = (rand() - 0.5) * 0.5;
    ctx.quadraticCurveTo(c + Math.cos(a + bend) * l * 0.6, c + Math.sin(a + bend) * l * 0.6, c + Math.cos(a) * l, c + Math.sin(a) * l);
    ctx.stroke();
  }
  picture = new THREE.CanvasTexture(canvas);
  picture.colorSpace = THREE.SRGBColorSpace;
  picture.anisotropy = 4;
  return picture;
}

// The patches for trees placed as [{ x, z, kind (name), width, seed }],
// draped on groundY(x, z): one mesh, or null for none.
// (On the phone - quality.js PHONE - fewer rings and sides (FOOT_MESH):
// a patch two to six metres across is a few dozen of its pixels, and every
// tree's together were 57,000 triangles on the range.)
export const FOOT_MESH = { pc: { seg: 20, rings: [0, 0.35, 0.7, 1] }, phone: { seg: 12, rings: [0, 0.5, 1] } };
export function makeTreeFeet(trees, groundY, { phone = PHONE } = {}) {
  if (!trees.length) return null;
  const { seg: SEG, rings: RINGS } = FOOT_MESH[phone ? "phone" : "pc"];
  const per = 1 + SEG * (RINGS.length - 1);
  const pos = new Float32Array(trees.length * per * 3);
  const uv = new Float32Array(trees.length * per * 2);
  const col = new Float32Array(trees.length * per * 3);
  const index = [];
  trees.forEach((t, n) => {
    const p = footPatch(t.kind, t.width, t.seed);
    const tint = FOOT_TINTS[p.litter];
    const base = n * per;
    const put = (j, x, z, u, v) => {
      pos.set([x, groundY(x, z) + FOOT.lift, z], (base + j) * 3);
      uv.set([u, v], (base + j) * 2);
      col.set(tint, (base + j) * 3);
    };
    put(0, t.x, t.z, 0.5, 0.5);
    for (let ri = 1; ri < RINGS.length; ri++) {
      for (let s = 0; s < SEG; s++) {
        const a = (s / SEG) * Math.PI * 2;
        const rr = RINGS[ri] * p.r;
        put(1 + (ri - 1) * SEG + s, t.x + Math.cos(a) * rr, t.z + Math.sin(a) * rr, 0.5 + Math.cos(a + p.turn) * RINGS[ri] * 0.5, 0.5 + Math.sin(a + p.turn) * RINGS[ri] * 0.5);
      }
    }
    // The middle fan, then the rings out.
    for (let s = 0; s < SEG; s++) index.push(base, base + 1 + ((s + 1) % SEG), base + 1 + s);
    for (let ri = 1; ri < RINGS.length - 1; ri++) {
      const i0 = base + 1 + (ri - 1) * SEG;
      const i1 = i0 + SEG;
      for (let s = 0; s < SEG; s++) {
        const s1 = (s + 1) % SEG;
        index.push(i0 + s, i0 + s1, i1 + s, i1 + s, i0 + s1, i1 + s1);
      }
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();
  // Faces up, whichever way it was wound.
  const nor = geo.attributes.normal;
  for (let i = 0; i < nor.count; i++) if (nor.getY(i) < 0) nor.setXYZ(i, -nor.getX(i), -nor.getY(i), -nor.getZ(i));
  const material = withSceneryHooks(onLayer(new THREE.MeshLambertMaterial({ map: footPicture(), vertexColors: true, transparent: true, depthWrite: false }), LAYER.wear), "ground");
  const mesh = new THREE.Mesh(geo, material);
  mesh.name = "tree feet";
  mesh.renderOrder = -10 + LAYER.wear;
  mesh.receiveShadow = true;
  return mesh;
}
