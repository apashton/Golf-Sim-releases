// Reflections in ponds, on Ultra (docs/GRAPHICS-NEXT.md section 6): the
// trees on the banks and the banks themselves stand upside down in the
// water. Before the picture's drawn, the scene is drawn again from under
// each water level in view - a camera mirrored in its surface, clipped at
// it, at half the picture's size (sim/ultra.mjs MIRROR) - and each pond's
// water (look/sandwater.js) takes its colour from that where something's
// mirrored, broken up by its ripples and more the lower it's seen.
//
// Only what stands round the water is mirrored - not the grass and tufts
// on the ground (userData.noMirror), too small to show in it - and not the
// sky (nor its clouds) - a pond here shows the sky only as the soft green-grey sheen it
// always has, never as a blue mirror - and not the water itself. Where
// nothing's mirrored (the sky's part), and on a pond with no picture this
// frame (a third level, or out of view), the water looks as it did without:
// the far bank's dark band worked out in its own shader.
//
// Nor anything that couldn't show in the water from where the camera is
// (sim/mirrorreach.mjs): a still surface shows a thing only where the line
// from the eye to its mirror image crosses the water, between the eye and
// the thing. Each object's box is asked of the ponds in the level's
// picture (where each reads its picture: pondRect); and of a big sheet of
// ground - a links hole's rolling dunes, over a million triangles from end
// to end, all drawn again for a pond on it - only the run of its rows that
// could show is drawn. What a pond shows is as it was, pixel for pixel
// (Links by the Sea's 1st, seven views); its picture a quarter to a third
// lighter from up in the air, less low down, where a pond's far side
// reaches back to the horizon.
//
// Drawn the way the picture is, into a buffer of half floats, so the
// scene's materials are the ones already built for the picture's buffer
// (look/effects.js): no shader built again. So only while the picture
// goes through it - every effect switched off, no reflections. The safety
// valve sheds them (of: "ultra") before Ultra's other extras.

import * as THREE from "three";
import { ULTRA } from "./quality.js";
import { registerStep } from "./safety.js";
import { pictureTarget } from "./effects.js";
import { MIRROR, mirrorLevels, keepMirrors } from "../sim/ultra.mjs";
import { mayShow, mirrorSource, sheetRows, rowRange, ROW_BLOCK, rippleBend } from "../sim/mirrorreach.mjs";
import { renderTarget } from "./gpu.js";

let shed = false;
if (ULTRA) registerStep(1, "pond reflections", (on) => (shed = on), { of: "ultra" });

// Every water material made with a mirror's uniforms (mirrorUniforms):
// those of materials no longer drawn are simply never set again.
const all = new Set();

// The uniforms a pond's water reads its reflection through: the picture,
// the matrix from the world to it, and whether there is one (0 or 1).
export function mirrorUniforms() {
  const u = { wMirror: { value: null }, wMirrorMatrix: { value: new THREE.Matrix4() }, wMirrorK: { value: 0 } };
  all.add(u);
  return u;
}

// Up to MIRROR.most pictures, made as they're first needed.
const targets = [];
function targetFor(i, width, height) {
  let t = targets[i];
  if (!t) {
    t = renderTarget(width, height, { type: THREE.HalfFloatType });
    targets[i] = t;
  } else if (t.width !== width || t.height !== height) t.setSize(width, height);
  return t;
}

// The scene's water, sky and clouds: looked for again when the scene
// changes (a new hole), when something not to be mirrored is added
// (mirrorsChanged: a shot's long grass and grass across the hole, which
// were otherwise drawn in the water for up to a second as each shot was
// set up), or now and then (a pond added to the same scene).
const found = new WeakMap();
let generation = 0;
export function mirrorsChanged() {
  generation++;
}
function partsOf(scene) {
  let f = found.get(scene);
  // (A new hole is built into the same group: still the same number of
  // children, so a water no longer in the scene says it's time to look
  // again - otherwise a new hole's ponds had no reflection for up to a
  // second.)
  if (f && f.gen === generation && f.count === scene.children.length && --f.fresh > 0 && f.waters.every((w) => w.parent)) return f;
  const waters = [];
  const hide = [];
  // Everything else drawn: each asked whether it could show (mayShow);
  // and the big sheets of ground among them, by their rows (rowsOf).
  const others = [];
  const sheets = [];
  const walk = (o) => {
    // (And the grass and tufts: too small and low to show in the water,
    // and drawing them all again cost the most of a reflection - the
    // owner's Ultra speed test put the reflections first, 5.2 ms a frame.)
    if (o.isSky || o.name === "clouds" || o.userData.noMirror) return hide.push(o);
    if (o.isMesh && o.material?.userData?.mirror) {
      if (o.userData.mirrorLevel === undefined) {
        o.geometry.computeBoundingBox();
        o.userData.mirrorBox = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);
        o.userData.mirrorLevel = o.userData.mirrorBox.max.y;
      }
      return waters.push(o);
    }
    if (o.isMesh || o.isPoints || o.isLine || o.isSprite) {
      // (Many drawn at once: their own box round them all, worked out
      // again as they're looked for.)
      if (o.isInstancedMesh || o.isBatchedMesh) o.computeBoundingBox?.();
      // (Not one with others under it: they'd go with it, and may reach
      // past its box.)
      if (!o.children.length) others.push(o);
      if (rowsOf(o)) sheets.push(o);
    }
    for (const c of o.children) walk(c);
  };
  walk(scene);
  // (A sheet's run is set on its geometry: one drawn twice keeps all of
  // it.)
  const uses = new Map();
  for (const o of sheets) uses.set(o.geometry, (uses.get(o.geometry) ?? 0) + 1);
  for (let k = sheets.length - 1; k >= 0; k--) if (uses.get(sheets[k].geometry) > 1) sheets.splice(k, 1);
  f = { waters, hide, others, sheets, count: scene.children.length, fresh: 60, gen: generation };
  found.set(scene, f);
  return f;
}

// A big sheet of ground's rows (sim/mirrorreach.mjs sheetRows), kept on
// its geometry while its triangles stay the same - indexed or not (a sheet
// cut round what's dug is three corners a triangle); null for anything
// else (instanced, or under SHEET triangles).
const SHEET = 20000;
function rowsOf(o) {
  const geo = o.geometry;
  const pos = geo?.attributes?.position;
  if (!o.isMesh || o.isInstancedMesh || o.isBatchedMesh || !pos || pos.isInterleavedBufferAttribute || (geo.index ? geo.index.count : pos.count) < SHEET * 3) return null;
  const of = geo.index ?? pos;
  const kept = geo.userData.mirrorRows;
  if (kept && kept.of === of && kept.version === of.version) return kept.rows;
  const rows = sheetRows(geo.index?.array ?? null, pos.array);
  geo.userData.mirrorRows = { of, version: of.version, rows };
  return rows;
}

// Where a pond could show something: the water it reads its picture over,
// as the camera sees it on the screen, grown by what its ripples bend the
// picture now (`bend`, a share of the picture: waterBend, and two of its
// pixels more, as it's read smoothed from its neighbours), turned back
// onto the water. Seen low and far, a few pixels up reach a long way back
// across the water - past the horizon, to the camera's far limit.
// { x0, z0, x1, z1 } in the world.
const clipPt = new THREE.Vector4();
const nearPt = new THREE.Vector3();
const farPt = new THREE.Vector3();
function pondRect(water, camera, level, bend) {
  const b = water.userData.mirrorBox;
  // On the screen (-1 to 1): all of it if any corner's behind the camera.
  let n0 = [1, 1];
  let n1 = [-1, -1];
  for (const x of [b.min.x, b.max.x]) {
    for (const z of [b.min.z, b.max.z]) {
      clipPt.set(x, level, z, 1).applyMatrix4(viewProjection);
      if (clipPt.w <= 1e-6) {
        n0 = [-1, -1];
        n1 = [1, 1];
        break;
      }
      for (const k of [0, 1]) {
        const v = (k ? clipPt.y : clipPt.x) / clipPt.w;
        n0[k] = Math.min(n0[k], v);
        n1[k] = Math.max(n1[k], v);
      }
    }
  }
  const grow = bend * 2;
  const lo = n0.map((v) => Math.max(-1, Math.max(-1, v) - grow));
  const hi = n1.map((v) => Math.min(1, Math.min(1, v) + grow));
  if (lo[0] > hi[0] || lo[1] > hi[1]) return null;
  // Its edge, back onto the water: where the ray meets the water, or as far
  // as the camera sees along it.
  const out = { x0: Infinity, z0: Infinity, x1: -Infinity, z1: -Infinity };
  const take = (nx, ny) => {
    nearPt.set(nx, ny, -1).unproject(camera);
    farPt.set(nx, ny, 1).unproject(camera).sub(nearPt);
    let t = farPt.y < -1e-9 ? (level - nearPt.y) / farPt.y : Infinity;
    if (!(t > 0) || t > 1) t = 1;
    const x = nearPt.x + farPt.x * t;
    const z = nearPt.z + farPt.z * t;
    out.x0 = Math.min(out.x0, x);
    out.x1 = Math.max(out.x1, x);
    out.z0 = Math.min(out.z0, z);
    out.z1 = Math.max(out.z1, z);
  };
  const N = 16;
  for (let i = 0; i <= N; i++) {
    const u = lo[0] + ((hi[0] - lo[0]) * i) / N;
    const v = lo[1] + ((hi[1] - lo[1]) * i) / N;
    take(u, lo[1]);
    take(u, hi[1]);
    take(lo[0], v);
    take(hi[0], v);
  }
  return out;
}

// An object's box in the world now, kept on it while it hasn't moved.
const moved = new THREE.Matrix4();
function worldBox(o) {
  const local = o.isInstancedMesh || o.isBatchedMesh ? o.boundingBox : (o.geometry?.boundingBox ?? (o.geometry?.computeBoundingBox(), o.geometry?.boundingBox));
  if (!local) return null;
  let kept = o.userData.mirrorWorld;
  if (!kept || kept.local !== local || !moved.copy(o.matrixWorld).equals(kept.matrix)) {
    kept = { local, matrix: o.matrixWorld.clone(), box: local.clone().applyMatrix4(o.matrixWorld) };
    o.userData.mirrorWorld = kept;
  }
  return kept.box;
}

// The run of a big sheet's triangles that could show in water at `level`
// within `rects`, from where the eye is: [first, end) - or null for all of
// it. (Its rows run along its own z: the ground that could show, a box in
// the world, turned into its own frame.)
const toLocal = new THREE.Matrix4();
const corner = new THREE.Vector3();
function sheetRun(o, rects, level) {
  const box = worldBox(o);
  if (!box) return null;
  let z0 = Infinity;
  let z1 = -Infinity;
  toLocal.copy(o.matrixWorld).invert();
  for (const rect of rects) {
    const src = mirrorSource(rect, eyeAt, level, box.max.y);
    if (!src) continue;
    for (const x of [src.x0, src.x1]) {
      for (const z of [src.z0, src.z1]) {
        corner.set(x, level, z).applyMatrix4(toLocal);
        z0 = Math.min(z0, corner.z);
        z1 = Math.max(z1, corner.z);
      }
    }
  }
  if (!(z1 >= z0)) return [0, 0];
  const run = rowRange(rowsOf(o), z0, z1);
  // (Hardly any left out: all of it, as it was.)
  return run[1] - run[0] > rowsOf(o).count - ROW_BLOCK ? null : run;
}

const frustum = new THREE.Frustum();
const viewProjection = new THREE.Matrix4();
const mirrored = new THREE.PerspectiveCamera();
const normal = new THREE.Vector3(0, 1, 0);
const onPlane = new THREE.Vector3();
const eye = new THREE.Vector3();
const view = new THREE.Vector3();
const look = new THREE.Vector3();
const target = new THREE.Vector3();
const turn = new THREE.Matrix4();
const plane = new THREE.Plane();
const clip = new THREE.Vector4();
const q = new THREE.Vector4();
const size = new THREE.Vector2();
const clearColour = new THREE.Color();
const eyeAt = new THREE.Vector3();

// The camera mirrored in the water at `level`, its picture clipped at the
// surface (three.js's Reflector, for a level surface); the world-to-picture
// matrix into `matrix`. False when the camera's under the water.
function mirrorCamera(camera, level, matrix) {
  onPlane.set(camera.position.x, level, camera.position.z);
  eye.setFromMatrixPosition(camera.matrixWorld);
  view.subVectors(onPlane, eye);
  if (view.dot(normal) > 0) return false;
  view.reflect(normal).negate().add(onPlane);
  turn.extractRotation(camera.matrixWorld);
  look.set(0, 0, -1).applyMatrix4(turn).add(eye);
  target.subVectors(onPlane, look).reflect(normal).negate().add(onPlane);
  mirrored.position.copy(view);
  mirrored.up.set(0, 1, 0).applyMatrix4(turn).reflect(normal);
  mirrored.lookAt(target);
  mirrored.near = camera.near;
  mirrored.far = camera.far;
  mirrored.layers.mask = camera.layers.mask;
  // (Its picture's depth as the camera's: on WebGPU 0 - 1, not WebGL's -1 -
  // 1 - and set before it's drawn, or WebGPURenderer works its projection
  // out again, without the tilt below.)
  mirrored.coordinateSystem = camera.coordinateSystem;
  const gpuDepth = camera.coordinateSystem === THREE.WebGPUCoordinateSystem;
  mirrored.updateMatrixWorld();
  mirrored.projectionMatrix.copy(camera.projectionMatrix);
  mirrored.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
  matrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
  matrix.multiply(mirrored.projectionMatrix).multiply(mirrored.matrixWorldInverse);
  // Nothing under the water: the near plane tilted to the surface.
  plane.setFromNormalAndCoplanarPoint(normal, onPlane).applyMatrix4(mirrored.matrixWorldInverse);
  clip.set(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
  const p = mirrored.projectionMatrix.elements;
  q.set((Math.sign(clip.x) + p[8]) / p[0], (Math.sign(clip.y) + p[9]) / p[5], -1, (1 + p[10]) / p[14]);
  clip.multiplyScalar((gpuDepth ? 1 : 2) / clip.dot(q));
  p[2] = clip.x;
  p[6] = clip.y;
  p[10] = gpuDepth ? clip.z : clip.z + 1;
  p[14] = clip.w;
  return true;
}

// The reflections kept a frame (sim/ultra.mjs MIRROR.keep): the camera
// where they were last drawn, and the way it looked.
const last = { scene: null, at: new THREE.Vector3(), look: new THREE.Vector3(), kept: true, width: 0, height: 0, bend: 0 };
const lookNow = new THREE.Vector3();

// Before the picture's drawn (app.js, inside the camera's sway): each
// water level in view drawn mirrored, and the ponds told which is theirs -
// or last frame's kept, every other frame, while the camera's hardly moved
// since (a ball followed in flight moves it a metre or so a frame): each
// pond reads the picture through the matrix it was drawn with, so what's
// mirrored stays where it was in the world, and the scene's drawn again
// for the water half as often.
export function drawMirrors(renderer, scene, camera) {
  if (!ULTRA || shed || !scene || !pictureTarget()) return forget();
  camera.updateMatrixWorld();
  renderer.getDrawingBufferSize(size);
  lookNow.set(0, 0, -1).transformDirection(camera.matrixWorld);
  // (Kept from the frame before only while the water's no rougher than it
  // was drawn for: a gust or a splash bends it further.)
  const parts = partsOf(scene);
  const bend = parts.waters.length ? waterBend(parts.waters[0]) : 0;
  if (!last.kept && last.scene === scene && last.width === size.x && last.height === size.y && bend <= last.bend && keepMirrors(last.at.distanceTo(camera.position), last.look.angleTo(lookNow))) {
    last.kept = true;
    return;
  }
  for (const u of all) u.wMirrorK.value = 0;
  last.scene = null;
  const { waters, hide, others, sheets } = parts;
  if (!waters.length) return;
  viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  frustum.setFromProjectionMatrix(viewProjection);
  const seen = waters.filter((w) => w.visible && frustum.intersectsBox(w.userData.mirrorBox));
  if (!seen.length) return;
  const groups = mirrorLevels(seen.map((w) => ({ level: w.userData.mirrorLevel, near: w.userData.mirrorBox.distanceToPoint(camera.position) })));
  const width = Math.max(1, Math.round(size.x * MIRROR.scale));
  const height = Math.max(1, Math.round(size.y * MIRROR.scale));
  const before = renderer.getRenderTarget();
  const background = scene.background;
  const alpha = renderer.getClearAlpha();
  renderer.getClearColor(clearColour);
  const shown = [...waters, ...hide].map((o) => o.visible);
  for (const o of [...waters, ...hide]) o.visible = false;
  eyeAt.setFromMatrixPosition(camera.matrixWorld);
  scene.background = null;
  // Nothing mirrored: clear, so the water knows where (the alpha).
  renderer.setClearColor(0x000000, 0);
  groups.forEach((g, i) => {
    const members = g.members.map((k) => seen[k]);
    const u = members[0].material.userData.mirror;
    if (!mirrorCamera(camera, g.level, u.wMirrorMatrix.value)) return;
    // What can't show in this level's water left out of its picture
    // (always: what can't be trusted to its box - frustumCulled off), and
    // of each big sheet of ground only the rows that can.
    const rects = members.map((w) => pondRect(w, camera, g.level, bend + 2 / Math.min(width, height))).filter(Boolean);
    const out = others.filter((o) => o.visible && o.frustumCulled !== false && !mayShow(worldBox(o), eyeAt, g.level, rects));
    for (const o of out) o.visible = false;
    const ranges = [];
    for (const o of sheets) {
      if (!o.visible || o.frustumCulled === false) continue;
      const run = sheetRun(o, rects, g.level);
      if (!run) continue;
      if (run[0] >= run[1]) {
        o.visible = false;
        out.push(o);
        continue;
      }
      const r = o.geometry.drawRange;
      ranges.push([r, r.start, r.count]);
      const from = Math.max(r.start, run[0] * 3);
      const to = Math.min(r.start + r.count, run[1] * 3);
      r.start = from;
      r.count = Math.max(0, to - from);
    }
    const t = targetFor(i, width, height);
    renderer.setRenderTarget(t);
    renderer.clear();
    renderer.render(scene, mirrored);
    for (const o of out) o.visible = true;
    for (const [r, start, count] of ranges.reverse()) {
      r.start = start;
      r.count = count;
    }
    for (const w of members) {
      const m = w.material.userData.mirror;
      m.wMirror.value = t.texture;
      m.wMirrorMatrix.value.copy(u.wMirrorMatrix.value);
      m.wMirrorK.value = 1;
    }
  });
  [...waters, ...hide].forEach((o, i) => (o.visible = shown[i]));
  scene.background = background;
  renderer.setClearColor(clearColour, alpha);
  renderer.setRenderTarget(before);
  Object.assign(last, { scene, kept: false, width: size.x, height: size.y, bend });
  last.at.copy(camera.position);
  last.look.copy(lookNow);
}

// The most the water's ripples can bend where it reads its picture, as
// rough as it is now (look/sandwater.js keeps how rough on each water's
// material: its chop, gusts, rain and splashes, on its clock) - so a calm
// pond's reach is little more than the pond, a gale's what it needs.
function waterBend(water) {
  const u = water.material.userData.ripple;
  if (!u) return rippleBend({ chop: 1.6, gust: 1, rain: 1, splashes: [{ time: 0, size: 1 }, { time: 0, size: 1 }, { time: 0, size: 1 }, { time: 0, size: 1 }], now: 0.01 });
  const splashes = u.wSplash.value.map((v) => ({ time: v.z, size: v.w }));
  return rippleBend({ chop: u.wChop.value, gust: u.wGustK.value, rain: u.wRain.value, splashes, now: u.wTime.value });
}

// No reflections this frame: none kept either.
function forget() {
  for (const u of all) u.wMirrorK.value = 0;
  last.scene = null;
}
