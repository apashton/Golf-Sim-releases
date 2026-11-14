// Long grass round the ball (sim/longgrass.mjs places it): clumps of
// tapering blades over the rough, the deep rough and a links hole's long
// grass, in the colour of the ground each stands in (the tufts' recipe,
// look/groundbits.js TUFT_GROUND - a links hole's straw and dune rough and
// darker long green too), each clump a touch lighter or darker, darker at
// the foot, leaning with the wind's waves as they pass. Four shapes of
// clump (sim/longgrass.mjs VARIANTS): straight fine blades, wider blades
// arching out, a tussock of short blades with a few tall, and stalks in
// seed among a few leaves - the longer blades bending as they go, in
// segments. A draw call a shape: each a small mesh, instanced, opaque (so
// hidden pixels are skipped early), casting no shadow. Built as each shot
// is set up; it stays through the shot.
//
// High grows a lighter field, Ultra the full one. Both are safety-valve
// steps (look/safety.js): Ultra's extra clumps first ("fuller long grass",
// down to High's - they're listed after High's, so it's only a count),
// then the field itself, first of High's extras.

import * as THREE from "three";
import { EXTRA, ULTRA } from "./quality.js";
import { registerStep, isShed } from "./safety.js";
import { syncFarRough } from "./farrough.js";
import { withSceneryHooks } from "./glsl/hooks.js";
import { NOISE, GROUND_COLOUR, GROUND_KEY, groundUniforms, COUNTRY_GLSL } from "./glsl/ground.js";
import { TUFT_GROUND, TUFT_COLOUR, tuftUniforms } from "./groundbits.js";
import { shareAt, heightShare, heightReach, NEARER, GRASS_HEIGHT } from "../sim/tufts.mjs";
import { HOLE_CHUNKS } from "../sim/holegrass.mjs";
import { LONG_BLEND } from "../sim/longgrass.mjs";
import { cutUniforms, CUT_VERTEX_PARS, cutVertex, CUT_FRAGMENT_PARS, cutFragment, CUT_KEY } from "./cutline.js";
export { HOLE_CHUNKS };

// Every field built and still in a scene, so the safety valve can thin or
// hide them.
const fields = new Set();
const FULLER = "fuller long grass";
const FIELD = "long grass";
registerStep(1, FULLER, () => fields.forEach(fit), { of: "ultra" });
registerStep(0.5, FIELD, () => {
  fields.forEach(fit);
  // The far rough starts nearer with no long grass to hand over from.
  syncFarRough();
}, { of: "high" });

// A field as the safety valve allows: all of it, High's share, or none.
function fit(mesh) {
  mesh.count = isShed(FULLER) ? mesh.userData.high : mesh.userData.all;
  mesh.visible = !isShed(FIELD) && mesh.count > 0;
}

// One blade, 1 m tall at most (scaled to each clump's height): from its
// foot at (x, z), facing `across`, out along `a` by `lean` at the tip,
// bending over as it goes (bend: how much of the lean comes in its upper
// half), `w` wide at the foot tapering to a point, in `segs` pieces.
// Pushes its triangles' corners and how far up each is (lUpIn).
function blade(pos, up, { x, z, a, across, w, h, lean, bend = 0, segs = 1 }) {
  const ox = Math.cos(a);
  const oz = Math.sin(a);
  const sx = Math.cos(across);
  const sz = Math.sin(across);
  const at = (t) => {
    // Out by the lean, more of it near the tip when it bends; the tip
    // drooping back down a little.
    const out = lean * ((1 - bend) * t + bend * t * t);
    const y = h * (t - bend * 0.25 * t * t * t);
    const half = (w / 2) * (1 - t);
    // (A little into the ground at its foot, so no gap shows where it
    // isn't flat.)
    return { cx: x + ox * out, cz: z + oz * out, y: t === 0 ? -0.02 : y, half };
  };
  for (let i = 0; i < segs; i++) {
    const p = at(i / segs);
    const q = at((i + 1) / segs);
    const a0 = [p.cx - sx * p.half, p.y, p.cz - sz * p.half];
    const a1 = [p.cx + sx * p.half, p.y, p.cz + sz * p.half];
    const b0 = [q.cx - sx * q.half, q.y, q.cz - sz * q.half];
    const b1 = [q.cx + sx * q.half, q.y, q.cz + sz * q.half];
    const t0 = Math.max(0, p.y);
    const t1 = q.y;
    if (i === segs - 1) {
      pos.push(...a0, ...a1, ...b0);
      up.push(t0, t0, t1);
    } else {
      pos.push(...a0, ...a1, ...b1, ...a0, ...b1, ...b0);
      up.push(t0, t0, t1, t0, t1, t1);
    }
  }
}

// A seed head on a stalk's top: a narrow, pointed spike of seed.
function seedHead(pos, up, { x, z, across, h }) {
  const sx = Math.cos(across) * 0.009;
  const sz = Math.sin(across) * 0.009;
  const y0 = h * 0.86;
  const y1 = h * 0.93;
  pos.push(x, y0, z, x + sx, y1, z + sz, x, h, z, x, y0, z, x, h, z, x - sx, y1, z - sz);
  up.push(1, 1, 1, 1, 1, 1);
}

// Each clump shape (sim/longgrass.mjs VARIANTS), 1 m tall at most, normals
// up so it lights like the ground.
function clumpGeometry(v) {
  const pos = [];
  const up = [];
  let s = 29 + v * 7919;
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  const ring = (n, b, r0, r1) => {
    const a = (b / n) * Math.PI * 2 + rand() * 0.6;
    const r = r0 + rand() * (r1 - r0);
    return { a, x: Math.cos(a) * r, z: Math.sin(a) * r, across: a + Math.PI / 2 + (rand() - 0.5) };
  };
  if (v === 0) {
    // Fine: seven thin, straight blades, leaning out a little.
    for (let b = 0; b < 7; b++) blade(pos, up, { ...ring(7, b, 0.015, 0.05), w: 0.004 + rand() * 0.003, h: 0.6 + rand() * 0.4, lean: 0.02 + rand() * 0.06 });
  } else if (v === 1) {
    // Arched: five wider blades curving out and over.
    for (let b = 0; b < 5; b++) blade(pos, up, { ...ring(5, b, 0.01, 0.04), w: 0.008 + rand() * 0.004, h: 0.55 + rand() * 0.35, lean: 0.18 + rand() * 0.2, bend: 0.8, segs: 3 });
  } else if (v === 2) {
    // Tussock: a dense ring of short blades and a few tall ones.
    for (let b = 0; b < 7; b++) blade(pos, up, { ...ring(7, b, 0.01, 0.06), w: 0.005 + rand() * 0.003, h: 0.3 + rand() * 0.25, lean: 0.06 + rand() * 0.1, bend: 0.5, segs: 2 });
    for (let b = 0; b < 3; b++) blade(pos, up, { ...ring(3, b, 0.005, 0.03), w: 0.006 + rand() * 0.003, h: 0.85 + rand() * 0.15, lean: 0.08 + rand() * 0.12, bend: 0.6, segs: 2 });
  } else {
    // In seed: four thin stalks, each with its head, among three leaves.
    for (let b = 0; b < 4; b++) {
      const r = ring(4, b, 0.005, 0.04);
      const h = 0.88 + rand() * 0.12;
      const lean = 0.03 + rand() * 0.08;
      blade(pos, up, { ...r, w: 0.003, h: h * 0.88, lean: lean * 0.88, segs: 2 });
      seedHead(pos, up, { x: r.x + Math.cos(r.a) * lean, z: r.z + Math.sin(r.a) * lean, across: r.across, h });
    }
    for (let b = 0; b < 3; b++) blade(pos, up, { ...ring(3, b, 0.01, 0.04), w: 0.007 + rand() * 0.003, h: 0.4 + rand() * 0.2, lean: 0.12 + rand() * 0.12, bend: 0.8, segs: 3 });
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("lUpIn", new THREE.Float32BufferAttribute(up, 1));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(new Array(pos.length / 3).fill([0, 1, 0]).flat(), 3));
  return geo;
}

// The material: the long grass round the ball's (thin: fewer with the
// camera high above it - sim/longgrass.mjs LONG_BLEND), or Ultra's grass
// across the hole's, thinned by its chunks' counts (heightShare) instead.
const materials = {};
const g = (v) => (Number.isInteger(v) ? `${v}.0` : `${v}`);
function grassMaterial(thin = true) {
  const key = thin ? "thin" : "hole";
  if (materials[key]) return materials[key];
  const material = (materials[key] = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide }));
  const H = GRASS_HEIGHT;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, groundUniforms, tuftUniforms, cutUniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        attribute float lCode;
        attribute float lShade;
        attribute float lUpIn;
        // The ground's normal at the clump's foot (world): lit as the
        // slope it stands on, not as level ground.
        attribute vec3 lNorm;
        varying vec3 lGround;
        varying float lUp;
        varying float lWave;
        varying float lFar;
        // The rough's (its colour codes below the hole grass's short
        // grass, 5 - 8: sim/holegrass.mjs), cut off at the mower's line.
        varying float lRough;
        ${CUT_VERTEX_PARS}
        ${NOISE}
        ${GROUND_COLOUR}
        ${TUFT_GROUND}
        ${COUNTRY_GLSL}
        ${TUFT_COLOUR}`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        {
          // Where the clump stands, and its colour, once a vertex: the
          // ground's under it, layer for layer, as the tufts'
          // (look/groundbits.js TUFT_COLOUR: a links hole's dune crest and
          // hollow, the country picture's heather and sand too).
          vec3 world = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          lGround = tColourAt(world, lCode) * lShade;
          lUp = lUpIn;
          lRough = lCode < 4.5 || lCode > 8.5 ? 1.0 : 0.0;
          // How far off: its own light and dark eased into the ground's
          // colour (sim/longgrass.mjs LONG_BLEND).
          lFar = max(smoothstep(${g(LONG_BLEND.from)}, ${g(LONG_BLEND.to)}, distance(world, cameraPosition)), smoothstep(${g(LONG_BLEND.up[0])}, ${g(LONG_BLEND.up[1])}, cameraPosition.y - world.y));${
            thin
              ? `
          // With the camera high above, fewer (sim/tufts.mjs heightShare),
          // each by its own random, shrinking away.
          float t = clamp((cameraPosition.y - world.y - ${g(H.from)}) / ${g(H.to - H.from)}, 0.0, 1.0);
          float keep = 1.0 - ${g(1 - H.least)} * t * t * (3.0 - 2.0 * t);
          float rank = fract(sin(dot(world.xz, vec2(12.9898, 78.233))) * 43758.5453);
          float lGrow = clamp((keep - rank) / (0.15 * keep), 0.0, 1.0);`
              : `
          float lGrow = 1.0;`
          }
          // Leaning with the wind's waves as they pass, the tips most - by
          // up to a third of the clump's height; still in a calm.
          float tall = length(instanceMatrix[1].xyz);
          float wave = 0.5 + 0.5 * sin(dot(world.xz, gWindDir) * 1.7 - gWindOff * 1.7 + world.x * 0.3);
          vec3 lean = vec3(gWindDir.x, 0.0, gWindDir.y) * gWindK * (0.12 + 0.2 * wave) * tall * lUpIn * lUpIn;
          // (A taller clump - a links hole's - shows the wave's sheen most.)
          lWave = wave * gWindK * clamp(tall * 1.6, 0.2, 1.0);
          // (The lean is in world terms; the clump is turned and scaled.)
          transformed += inverse(mat3(instanceMatrix)) * lean;
          transformed *= lGrow;
        }`,
      )
      .replace("#include <normal_vertex>", "transformedNormal = normalize((viewMatrix * modelMatrix * vec4(lNorm, 0.0)).xyz);\n#include <normal_vertex>")
      .replace("#include <project_vertex>", `#include <project_vertex>\n${cutVertex("modelMatrix * instanceMatrix * vec4(transformed, 1.0)")}`);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 lGround;\nvarying float lUp;\nvarying float lWave;\nvarying float lFar;\nvarying float lRough;\n${CUT_FRAGMENT_PARS}`)
      .replace(
        "#include <map_fragment>",
        // Cut off at the mower's line (the rough's); darker at the foot,
        // where the blades shade each other, lighter at the tips - from
        // further off eased into the ground's colour.
        `#include <map_fragment>
        ${cutFragment("lRough > 0.5")}
        diffuseColor.rgb = lGround * mix(mix(0.7, 1.15, lUp), ${g(LONG_BLEND.lift)}, lFar * ${g(LONG_BLEND.most)});
        // Bent over by a passing wave, the tips show their paler side.
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722))) * 1.12, 0.35 * lWave * lUp * lUp * (1.0 - lFar));`,
      )
      .replace("#include <normal_fragment_begin>", "#include <normal_fragment_begin>\n  normal = normalize( vNormal );");
  };
  material.customProgramCacheKey = () => `longgrass-v7${thin ? "" : "-hole"}-${CUT_KEY}-${GROUND_KEY}`;
  withSceneryHooks(material, "longgrass");
  material.userData.shared = true;
  return material;
}

// The shapes' meshes, made once.
const shapes = [];
const shapeOf = (v) => (shapes[v] ??= clumpGeometry(v));

// The field: a group of an InstancedMesh a clump shape, or null (on
// Standard and Medium, or with nothing to grow). clumps: sim/longgrass.mjs
// longGrassClumps's; high: how many of them are High's (listed first -
// each shape's mesh keeps them first too); place(x, z) -> [wx, wy, wz]:
// the ground there in world terms (x, z in the clumps' frame).
// slope(x, z): the ground's normal there, world [x, y, z] (sim/holegrass.mjs
// groundNormal) - each clump lit as the slope it stands on - or none: level.
export function makeLongGrass({ clumps, high }, place, slope = null) {
  if (!EXTRA || !clumps.length) return null;
  const group = new THREE.Group();
  group.userData.longGrass = true;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const byShape = new Map();
  clumps.forEach((c, i) => {
    const v = c.v ?? 0;
    if (!byShape.has(v)) byShape.set(v, []);
    byShape.get(v).push([c, i < high]);
  });
  for (const [v, list] of byShape) {
    const mesh = new THREE.InstancedMesh(shapeOf(v).clone(), grassMaterial(), list.length);
    // (Not in a pond's reflection: look/mirrors.js.)
    mesh.userData.noMirror = true;
    const codes = new Float32Array(list.length);
    const shades = new Float32Array(list.length);
    const norms = new Float32Array(list.length * 3);
    list.forEach(([c], i) => {
      q.setFromAxisAngle(up, c.turn);
      s.set(1, c.h, 1);
      m.compose(p.fromArray(place(c.x, c.z)), q, s);
      mesh.setMatrixAt(i, m);
      codes[i] = c.code;
      shades[i] = c.shade ?? 1;
      norms.set(slope ? slope(c.x, c.z) : [0, 1, 0], i * 3);
    });
    mesh.geometry.setAttribute("lCode", new THREE.InstancedBufferAttribute(codes, 1));
    mesh.geometry.setAttribute("lShade", new THREE.InstancedBufferAttribute(shades, 1));
    mesh.geometry.setAttribute("lNorm", new THREE.InstancedBufferAttribute(norms, 3));
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    // Culled whole, by the field's own spread.
    mesh.computeBoundingSphere();
    mesh.userData.all = list.length;
    mesh.userData.high = list.filter(([, isHigh]) => isHigh).length;
    fields.add(mesh);
    fit(mesh);
    group.add(mesh);
  }
  return group;
}

// A field for warming up (app.js warmers, look/gpuprep.js drawAllSteps):
// one clump of each shape, never shown, so the long grass's shader is
// built and drawn behind the loading screen rather than as the first shot
// of a round is set up - on Ultra that first drawing held the page for
// seconds (a report: 10 s, "3 new shaders (longgrass, ..., nest)"). Null
// on Standard and Medium, which grow none.
export function longGrassWarmers() {
  const clumps = [0, 1, 2, 3].map((v) => ({ x: 0, z: 0, turn: 0, h: 0.5, code: 0, v, shade: 1 }));
  const group = makeLongGrass({ clumps, high: clumps.length }, () => [0, 0, 0]);
  // (Not one of the fields the valve fits.)
  if (group) for (const mesh of group.children) fields.delete(mesh);
  // And Ultra's grass across the hole's, which isn't thinned by height.
  if (group && ULTRA) {
    const hole = new THREE.InstancedMesh(shapeOf(0).clone(), grassMaterial(false), 1);
    hole.setMatrixAt(0, new THREE.Matrix4());
    hole.geometry.setAttribute("lCode", new THREE.InstancedBufferAttribute(new Float32Array([0]), 1));
    hole.geometry.setAttribute("lNorm", new THREE.InstancedBufferAttribute(new Float32Array([0, 1, 0]), 3));
    hole.geometry.setAttribute("lShade", new THREE.InstancedBufferAttribute(new Float32Array([1]), 1));
    group.add(hole);
  }
  return group;
}

// Ultra's grass across the hole (sim/holegrass.mjs places it): the same
// blades and colours, more kinds of grass. A safety-valve step of Ultra's
// own, shed before its others (it's the dearest after the supersampling).
const HOLE = "grass across the hole";
const holeFields = new Set();
registerStep(0.5, HOLE, (on) => holeFields.forEach((m) => (m.visible = !on && m.userData.full > 0)), { of: "ultra" });

// Drawn in square chunks (sim/holegrass.mjs HOLE_CHUNKS: metres a side), so
// the graphics card only draws the ones in view; and a chunk far from the
// camera draws only a share of its clumps (shuffled, so the share is spread
// evenly), down to `least` of them past `far` metres - blades a few
// centimetres tall are lost in the ground's own texture out there.
// The share of a chunk's clumps drawn `d` metres from the camera (reach:
// the safety valve's, below).
export function chunkShare(d, reach = 1) {
  return shareAt(d, HOLE_CHUNKS, reach);
}
// The share of a chunk centred at `centre` drawn with the camera at `cam`
// (both world [x, y, z] vectors): by its distance, its reach and its count
// cut back the higher the camera is over it.
export function chunkDrawn(cam, centre, reach = 1) {
  const up = cam.y - centre.y;
  return chunkShare(cam.distanceTo(centre), reach * heightReach(up)) * heightShare(up);
}

// Before the grass across the hole goes, it's drawn nearer the camera only
// (sim/tufts.mjs NEARER): full round the ball and where the camera is,
// thinning out to next to none half as far as before - the ground's own
// grass texture carrying the look beyond.
let holeReach = 1;
registerStep(0.4, "grass across the hole nearer", (on) => (holeReach = on ? NEARER : 1), { of: "ultra" });

// The field drawn: a group of an InstancedMesh a chunk (sim/holegrass.mjs
// holeGrassField: by shape and 32 m square, each already shuffled and
// placed), made a few thousand clumps a step (holeGrassSteps: the quiet
// moments' work as a shot is set up, course.js growHoleGrass - a step a
// few milliseconds, so none holds a frame; a chunk's matrices go to the
// card only once it's shown) or all at once (makeHoleGrass). Nothing below
// Ultra, or with nothing to grow.
export const GRASS_STEP = 2000;
export function* holeGrassSteps(field, group, per = GRASS_STEP) {
  if (!ULTRA || !field?.n) return;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  let since = 0;
  for (const ch of field.chunks) {
    const count = ch.to - ch.from;
    if (count <= 0) continue;
    const mesh = new THREE.InstancedMesh(shapeOf(ch.v).clone(), grassMaterial(false), count);
    // (Not in a pond's reflection: look/mirrors.js.)
    mesh.userData.noMirror = true;
    const codes = new Float32Array(count);
    const shades = new Float32Array(count);
    // (The ground's slope at each clump's foot; level for a field made
    // without - sim/holegrass.mjs holeGrassField norm.)
    const norms = field.norm ? field.norm.slice(ch.from * 3, ch.to * 3) : new Float32Array(count * 3).map((_, j) => (j % 3 === 1 ? 1 : 0));
    for (let i = 0; i < count; i++) {
      const k = ch.from + i;
      q.setFromAxisAngle(up, field.turn[k]);
      s.set(1, field.h[k], 1);
      m.compose(p.set(field.pos[k * 3], field.pos[k * 3 + 1], field.pos[k * 3 + 2]), q, s);
      mesh.setMatrixAt(i, m);
      codes[i] = field.code[k];
      shades[i] = field.shade[k];
      if (++since >= per) {
        since = 0;
        yield;
      }
    }
    mesh.userData.full = count;
    mesh.userData.centre = new THREE.Vector3(ch.centre[0], ch.centre[1], ch.centre[2]);
    // Thinned with the camera's distance, as it's drawn - and seen from
    // high up, far fewer and not as far out (sim/tufts.mjs heightShare,
    // heightReach).
    mesh.onBeforeRender = (renderer, scene, camera) => {
      mesh.count = Math.max(1, Math.round(mesh.userData.full * chunkDrawn(camera.position, mesh.userData.centre, holeReach)));
    };
    mesh.geometry.setAttribute("lCode", new THREE.InstancedBufferAttribute(codes, 1));
    mesh.geometry.setAttribute("lShade", new THREE.InstancedBufferAttribute(shades, 1));
    mesh.geometry.setAttribute("lNorm", new THREE.InstancedBufferAttribute(norms, 3));
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    mesh.visible = !isShed(HOLE);
    holeFields.add(mesh);
    group.add(mesh);
  }
}

// The field's group, made all at once - or null (below Ultra, or nothing
// to grow).
export function makeHoleGrass(field) {
  if (!ULTRA || !field?.n) return null;
  const group = new THREE.Group();
  group.userData.holeGrass = true;
  for (const _ of holeGrassSteps(field, group));
  return group;
}

// A hole's grass let go of with the hole (course/holebuild.js
// disposeWorld): the grass across it had been kept, a field a hole, until
// another shot's was grown on the same hole.
export function forgetGrass(object) {
  holeFields.delete(object);
  fields.delete(object);
}

export function dropHoleGrass(group) {
  if (!group) return;
  group.parent?.remove(group);
  for (const mesh of group.children) {
    holeFields.delete(mesh);
    mesh.geometry.dispose();
  }
}

// Takes a field away for good.
export function dropLongGrass(group) {
  if (!group) return;
  group.parent?.remove(group);
  for (const mesh of group.children) {
    fields.delete(mesh);
    mesh.geometry.dispose();
  }
}
