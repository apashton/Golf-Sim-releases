// The horizon: the country beyond the far woods steps back into the haze in
// layers - a skyline band of treelines, poplar rows and the odd farmhouse
// roof, barn or church spire; the hills behind it, from seeded noise,
// smoothly shaded and patched with fields and woods; and a taller, bluer
// ridge far behind those, still inside the camera's far limit. Each course
// has its own seed (setBackdrop), so courses look different. By the sea
// (sim/coast.mjs), only on the land: out to sea the hills sink under the
// water, they come down to the shore where it meets them, and the skyline
// stands only on land. Scenery only: none of it casts or catches a shadow.

import * as THREE from "three";
import { PALETTE } from "./palette.js";
import { HIGH } from "./quality.js";
import { hillHeight, valueNoise, hash2, RIDGE_FAR } from "../sim/country.mjs";

// Where the layers stand from the backdrop's centre (metres).
export const LAYERS = {
  skyline: [1000, 1300],
  hills: { inner: 900, outer: 2600 },
  ridge: { inner: 3300, outer: RIDGE_FAR },
};

// A ring of ground from `inner` to `outer`, its height h(a, t) (t 0 at the
// inner edge, 1 at the outer), coloured by colour(x, z, t, out). Smoothly
// shaded: one shared vertex at each point. shore(x, z, h): its height by
// the sea (ashore).
function ring({ inner, outer, segments, rings, h, colour, shore = null }) {
  const pos = [];
  const col = [];
  const index = [];
  const c = new THREE.Color();
  for (let j = 0; j <= rings; j++) {
    const t = j / rings;
    const r = inner + (outer - inner) * t;
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      pos.push(x, shore ? shore(x, z, h(a, t)) : h(a, t), z);
      colour(x, z, t, c);
      col.push(c.r, c.g, c.b);
    }
  }
  const row = segments + 1;
  for (let j = 0; j < rings; j++) {
    for (let i = 0; i < segments; i++) {
      const a = j * row + i;
      const b = a + row;
      // (Facing up: round the ring one way, outwards the other.)
      index.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
}

// The hills: a kilometre or two out, soft and bluish in the haze, patched
// with fields and woods nearer, bluer further.
function hills(seed, shore) {
  const { inner, outer } = LAYERS.hills;
  const near = new THREE.Color(PALETTE.hillsNear);
  const far = new THREE.Color(PALETTE.hillsFar);
  const field = new THREE.Color(PALETTE.hillsField);
  const wood = new THREE.Color(PALETTE.hillsWood);
  const geo = ring({
    inner,
    outer,
    segments: HIGH ? 200 : 128,
    rings: HIGH ? 10 : 6,
    h: (a, t) => hillHeight(a, t, seed),
    shore,
    colour: (x, z, t, c) => {
      const n = valueNoise(x, z, 260, seed);
      const w = valueNoise(x, z, 140, seed ^ 0x55);
      c.copy(near);
      if (n > 0.55) c.lerp(field, 0.6);
      if (w > 0.62) c.lerp(wood, 0.7);
      c.lerp(far, Math.min(1, t * 1.15));
    },
  });
  return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
}

// The far ridge: taller, bluer, paler, all but lost in the haze.
function ridge(seed, shore) {
  const { inner, outer } = LAYERS.ridge;
  const colour = new THREE.Color(PALETTE.ridgeFar);
  const geo = ring({
    inner,
    outer,
    segments: HIGH ? 128 : 96,
    rings: 3,
    h: (a, t) => hillHeight(a + 1.7, t, seed ^ 0x2d9, { top: 420 }) - 10,
    shore,
    colour: (x, z, t, c) => c.copy(colour),
  });
  return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
}

// The skyline band's picture: a treeline along its foot with poplar rows,
// and now and then a farmhouse roof, a barn or a church spire standing in
// it, painted once on a canvas for the seed. Hazed blue-greens, never black.
export function paintSkyline(ctx, w, h, seed, { far = false } = {}) {
  let s = seed >>> 0 || 1;
  const rand = () => ((s = (Math.imul(s ^ (s >>> 15), 0x2c1b3c6d) + 0x6d2b79f5) >>> 0) / 4294967296);
  ctx.clearRect(0, 0, w, h);
  const trees = far ? PALETTE.skylineTreesFar : PALETTE.skylineTrees;
  const shade = (hex, k) => {
    const c = new THREE.Color(hex).multiplyScalar(k);
    return `rgb(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)})`;
  };
  // Buildings first, so the trees stand round them.
  for (let x = 40 + rand() * 200; x < w - 60; x += 260 + rand() * 520) {
    const kind = rand();
    const base = h - 4;
    if (kind < 0.18) {
      // A church: its nave and a spire.
      ctx.fillStyle = shade(PALETTE.skylineWall, 0.92);
      ctx.fillRect(x, base - 26, 34, 26);
      ctx.fillStyle = shade(PALETTE.skylineSpire, 1);
      ctx.fillRect(x + 30, base - 46, 12, 46);
      ctx.beginPath();
      ctx.moveTo(x + 28, base - 46);
      ctx.lineTo(x + 36, base - 92 - rand() * 18);
      ctx.lineTo(x + 44, base - 46);
      ctx.fill();
    } else if (kind < 0.55) {
      // A farmhouse: pale walls, a pitched roof.
      const bw = 26 + rand() * 18;
      ctx.fillStyle = shade(PALETTE.skylineWall, 0.95);
      ctx.fillRect(x, base - 18, bw, 18);
      ctx.fillStyle = shade(PALETTE.skylineRoof, 1);
      ctx.beginPath();
      ctx.moveTo(x - 3, base - 18);
      ctx.lineTo(x + bw / 2, base - 32);
      ctx.lineTo(x + bw + 3, base - 18);
      ctx.fill();
    } else if (kind < 0.8) {
      // A barn: long, low, a darker roof.
      const bw = 40 + rand() * 30;
      ctx.fillStyle = shade(PALETTE.skylineRoof, 0.85);
      ctx.fillRect(x, base - 20, bw, 20);
      ctx.beginPath();
      ctx.moveTo(x - 2, base - 20);
      ctx.lineTo(x + bw / 2, base - 30);
      ctx.lineTo(x + bw + 2, base - 20);
      ctx.fill();
    }
  }
  // The treeline: a ragged, rolling top of crowns, thicker in places, gaps
  // in others, now and then a row of poplars.
  let x = 0;
  while (x < w) {
    const gap = rand() < 0.1;
    const run = gap ? 20 + rand() * 60 : 80 + rand() * 260;
    const poplars = !gap && rand() < 0.22;
    for (let px = x; px < Math.min(w, x + run); px += poplars ? 7 + rand() * 3 : 5 + rand() * 6) {
      if (gap && rand() < 0.85) continue;
      const tall = poplars ? 58 + rand() * 22 : 18 + rand() * 26 + 10 * Math.sin(px / 47);
      const r = poplars ? 4.5 : 7 + rand() * 7;
      ctx.fillStyle = shade(trees, 0.88 + rand() * 0.22);
      ctx.beginPath();
      if (poplars) ctx.ellipse(px, h - tall / 2 - 2, r, tall / 2, 0, 0, Math.PI * 2);
      else ctx.arc(px, h - tall + r, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(px - r, h - tall + r, r * 2, tall - r);
    }
    x += run;
  }
  // The foot: solid, so no sky shows under it.
  ctx.fillStyle = shade(trees, 0.92);
  ctx.fillRect(0, h - 6, w, 6);
}

// The skyline's pictures, painted once a course (a canvas each is the
// costly part; the band itself is made again for each hole by the sea).
const pictures = new Map();
function skylinePicture(seed, far) {
  const key = `${seed}|${far}`;
  let tex = pictures.get(key);
  if (tex) return tex;
  const w = 2048;
  const h = 128;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  paintSkyline(canvas.getContext("2d"), w, h, seed, { far });
  tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(4, 1);
  tex.anisotropy = 4;
  tex.userData.seed = seed;
  pictures.set(key, tex);
  return tex;
}

// land(x, z): whether the band may stand there (by the sea, only on land);
// it's left out over the rest.
function skyline(seed, radius, far, land = null) {
  const tex = skylinePicture(seed, far);
  // 52 m from its foot (a little into the ground) to the top of a spire.
  const tall = 52;
  const segments = HIGH ? 160 : 112;
  const geo = new THREE.CylinderGeometry(radius, radius, tall, segments, 1, true);
  geo.translate(0, tall / 2 - 6, 0);
  // Lit from above, as the ground round it is.
  const n = geo.attributes.normal;
  for (let i = 0; i < n.count; i++) n.setXYZ(i, -n.getX(i) * 0.35, 0.94, -n.getZ(i) * 0.35);
  const turn = hash2(seed, radius | 0, 3) * Math.PI * 2;
  if (land) {
    // (Its faces go round in order, two to each step round.)
    const index = geo.index.array;
    const kept = [];
    for (let k = 0; k < segments; k++) {
      const a = ((k + 0.5) / segments) * Math.PI * 2 + turn;
      if (land(Math.sin(a) * radius, Math.cos(a) * radius)) kept.push(...index.slice(k * 6, k * 6 + 6));
    }
    if (!kept.length) {
      geo.dispose();
      return null;
    }
    geo.setIndex(kept);
  }
  const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, alphaToCoverage: true, side: THREE.DoubleSide }));
  mesh.rotation.y = turn;
  return mesh;
}

function disposeLayers(group) {
  for (const o of group.children) {
    o.geometry.dispose();
    o.material.dispose();
  }
  group.clear();
}

// By the sea: the hills' height at (x, z) (the group's own frame) out to
// sea and near the shore - sunk under the water, and coming down to it.
// shore: { at(x, z) (the world's), level, centre }.
function ashore(shore) {
  if (!shore) return null;
  const [cx, cz] = shore.centre;
  return (x, z, h) => {
    const d = shore.at(x + cx, z + cz);
    if (d < 0) return shore.level - 30;
    return Math.min(h, shore.level + 1.5 + d * 0.16);
  };
}

function fill(group, seed, shore = null) {
  disposeLayers(group);
  // Older courses' skyline pictures go, but for a few (each scene - the
  // range's, the course's - may still have its own).
  for (const [key, tex] of pictures) {
    if (pictures.size <= 6) break;
    if (tex.userData.seed === seed || tex.userData.seed === seed + 101) continue;
    tex.dispose();
    pictures.delete(key);
  }
  const height = ashore(shore);
  group.add(hills(seed, height));
  group.add(ridge(seed, height));
  // One skyline band on Standard, two on High - by the sea, only on land.
  const land = shore ? (x, z) => shore.at(x + shore.centre[0], z + shore.centre[1]) > 80 : null;
  const bands = HIGH ? LAYERS.skyline : LAYERS.skyline.slice(0, 1);
  bands.forEach((r, i) => {
    const band = skyline(seed + i * 101, r, i > 0, land);
    if (band) group.add(band);
  });
  for (const o of group.children) {
    o.castShadow = false;
    o.receiveShadow = false;
  }
  group.userData.seed = seed;
  group.userData.shore = shore;
}

// The horizon's layers in one group, for a scene (look/environment.js adds
// it), centred a little down the range.
export function makeHills(seed = 7) {
  const group = new THREE.Group();
  group.name = "backdrop";
  fill(group, seed);
  group.position.z = -300;
  return group;
}

// A course's own horizon (its seed), centred on the hole being played
// ([x, z] world): rebuilt only when the seed changes - or, by the sea, for
// each hole (shore: { at(x, z), level }: sim/coast.mjs coastHere's coast
// in the world, and the hole's sea level), as the sea lies differently
// round each.
export function setBackdrop(scene, { seed, centre = null, shore = null }) {
  const group = scene.getObjectByName("backdrop");
  if (!group) return;
  const by = shore ? { ...shore, centre: centre ?? [group.position.x, group.position.z] } : null;
  if (group.userData.seed !== seed || by || group.userData.shore) fill(group, seed, by);
  if (centre) group.position.set(centre[0], 0, centre[1]);
}
