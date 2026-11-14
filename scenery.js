// Scenery pieces shared by the range and the putting green.
//
// World frame (three.js): the golfer faces -z, +x is to their right, y is up.
// The physics frame (x downrange, z right) maps to world as
//   world.x = physics.z, world.z = -physics.x.

import * as THREE from "three";
import { seeded } from "./look/trees.js";
import { animateWater } from "./look/sandwater.js";
import { PALETTE } from "./look/palette.js";
import { HIGH, ULTRA } from "./look/quality.js";
import { addBallTrail } from "./look/balltrail.js";
import { SUN_DIR, animateSky } from "./look/environment.js";
import { flagPose, clothPoint } from "./sim/flagwind.mjs";
import { markReadable, weatherLook } from "./look/weatherlook.js";
import { updateBend } from "./look/glsl/bend.js";
import { animateWindsocks } from "./look/windsock.js";
import { markTwin } from "./look/twins.js";

export function toWorld(px, py, pz, out = new THREE.Vector3()) {
  return out.set(pz, py, -px);
}

// ---- Flags ---------------------------------------------------------------------

const flags = new Set();

export function makeFlag({ color = PALETTE.flag, height = 2.3 } = {}) {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, height, ULTRA ? 16 : 8),
    new THREE.MeshLambertMaterial({ color: PALETTE.pole }),
  );
  pole.position.y = height / 2;
  // On Ultra, close up: a rounded cap on the top, and the metal ferrule at
  // its foot that seats it in the cup.
  const fittings = [];
  if (ULTRA) {
    const metal = new THREE.MeshStandardMaterial({ color: 0xb9bcbf, metalness: 0.8, roughness: 0.35 });
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.016, 14, 8), new THREE.MeshLambertMaterial({ color: PALETTE.pole }));
    cap.position.y = height;
    const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.0125, 0.009, 0.06, 14), metal);
    ferrule.position.y = -0.03;
    fittings.push(cap, ferrule);
  }
  // The pole is far thinner than one cell of the scene's shadow map, so its
  // shadow came and went and the cloth's floated free of the cup. A
  // stand-in a few centimetres thick, never drawn, casts it instead.
  const shadowPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, height, 6),
    new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }),
  );
  shadowPole.position.y = height / 2;
  shadowPole.castShadow = true;
  // (Ultra: finer, so its folds are smooth close up.)
  const flagGeo = ULTRA ? new THREE.PlaneGeometry(0.55, 0.38, 24, 8) : new THREE.PlaneGeometry(0.55, 0.38, 10, 3);
  flagGeo.translate(0.275, 0, 0);
  // A true, matt red, only faintly self-lit. Cloth lets the light through,
  // so whichever face is seen is lit as the one facing the sun: from its
  // shaded side, against the sun, it was a dark maroon.
  const clothMat = new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide, emissive: color, emissiveIntensity: 0.15 });
  clothMat.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <normal_fragment_begin>",
      `#include <normal_fragment_begin>
      #if NUM_DIR_LIGHTS > 0
      if (dot(normal, directionalLights[0].direction) < 0.0) normal = -normal;
      #endif`,
    );
  };
  clothMat.customProgramCacheKey = () => "cloth-v1";
  // (Its node version, on WebGPURenderer: look/nodetwins.js.)
  markTwin(clothMat, "cloth");
  const flag = new THREE.Mesh(flagGeo, clothMat);
  flag.position.y = height - 0.21;
  // The cloth waves every frame, so it stays out of the sun's shadow map
  // (which is drawn only when something in it changes: look/shadowwatch.js)
  // and has a soft painted shadow of its own on the ground, following it
  // as it swings round, as the ball's does. The pole still casts, so the
  // flag's shadow runs from its cup.
  flag.castShadow = false;
  flag.userData.rest = Float32Array.from(flagGeo.attributes.position.array);
  flag.userData.phase = Math.random() * 10;
  const painted = clothShadow();
  flag.userData.shadow = painted;
  group.add(pole, shadowPole, flag, painted, ...fittings);
  placeClothShadow(flag);
  // Never lost in a thicker haze than a fair day's (look/weatherlook.js).
  markReadable(group);
  flags.add(flag);
  group.userData.flag = flag;
  // The two that never move with the wind (the range merges its flags'
  // poles: range.js).
  group.userData.poles = [pole, shadowPole];
  return group;
}

// The cloth's painted shadow: a soft patch on the ground where the sun
// puts the cloth's shadow, in the flag's own frame (the ground taken as
// level with its foot).
// (The sun now: moved where each round's sun is - look/environment.js setSun.)
const SUN = SUN_DIR;
let clothShadowMap = null;
function clothShadow() {
  if (!clothShadowMap) {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(0.5, "rgba(0,0,0,0.75)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    clothShadowMap = new THREE.CanvasTexture(canvas);
  }
  const mat = new THREE.MeshBasicMaterial({
    map: clothShadowMap, transparent: true, depthWrite: false, opacity: 0.32,
    polygonOffset: true, polygonOffsetFactor: -10, polygonOffsetUnits: -16,
  });
  // setFlagLook fades it with the flag, from this.
  mat.userData.baseOpacity = mat.opacity;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), mat);
  mesh.renderOrder = 2;
  return mesh;
}

// Puts the cloth's painted shadow where the sun casts the cloth: its middle
// carried down the sun's line to the ground, stretched along that line
// (the sun is part way up the sky) and turned with the cloth.
function placeClothShadow(flag) {
  const painted = flag.userData.shadow;
  if (!painted) return;
  const yaw = flag.rotation.y;
  // How far it's lifted from hanging down the pole (sim/flagwind.mjs).
  const lift = flag.userData.lift ?? Math.PI / 2;
  const out = Math.sin(lift);
  // The cloth's middle: half its width out from the pole (less as it
  // hangs), turned with it, and lower as it hangs.
  const cx = Math.cos(yaw) * 0.275 * out;
  const cz = -Math.sin(yaw) * 0.275 * out;
  const h = flag.position.y - 0.275 * Math.cos(lift);
  const t = h / SUN.y;
  painted.position.set(cx - SUN.x * t, 0.02, cz - SUN.z * t);
  // Its width across the sun's line, and its depth stretched along it: a
  // hanging cloth throws a narrow shadow.
  const across = Math.abs(Math.cos(yaw - Math.atan2(SUN.x, SUN.z)));
  painted.rotation.y = Math.atan2(SUN.x, SUN.z);
  painted.scale.set(0.12 + (0.08 + 0.5 * across) * out, 1, 0.38 / Math.max(0.3, SUN.y) * 0.7 + 0.2 * (1 - across) * out + 0.3 * (1 - out));
}

// Shows a flag (from makeFlag) as sim/flagstick.mjs flagLook says: raised
// by `lift` metres above where it stands, at `opacity`, or not at all.
// While it fades it casts no shadow (a solid shadow under a ghost of a
// flag looked wrong). Only the flag itself changes: the cup, and anything
// placed from the hole's position, is drawn on its own.
export function setFlagLook(group, { visible, lift, opacity }) {
  if (!group) return;
  group.userData.baseY ??= group.position.y;
  group.visible = visible;
  group.position.y = group.userData.baseY + lift;
  const fading = opacity < 1;
  group.traverse((o) => {
    o.userData.casts ??= o.castShadow;
    o.castShadow = o.userData.casts && !fading;
    const m = o.material;
    if (!m || m.colorWrite === false) return;
    // The cloth's painted shadow fades with it, from its own strength.
    if (m.userData.baseOpacity != null) {
      m.opacity = m.userData.baseOpacity * opacity;
      return;
    }
    if (m.transparent !== fading) {
      m.transparent = fading;
      m.needsUpdate = true;
    }
    m.opacity = opacity;
    m.depthWrite = !fading;
  });
}

// Every flag in the mode's wind ({ mph, yaw }: yaw the flag's turn about
// the pole to stream the way it blows), on the one gust clock
// (look/weatherlook.js): limp in a calm, lifting and flapping in a breeze,
// streaming taut in a strong wind and surging in its gusts
// (sim/flagwind.mjs) - or, with no wind at all (the practice greens, the
// Challenges), rippling gently as it always has. And the sky's clouds and
// the water's ripples drifting the way it blows, and everything that grows
// swaying in it (look/glsl/bend.js: nothing in still air). Called once a
// frame, after the weather's values (updateWeatherLook).
const flagAt = new THREE.Vector3();
// camera: the camera the scene is drawn from (a calm's limp flags hang
// broadside to it).
export function animateScenery(time, wind = null, camera = null) {
  // The water's ripples and the sky's clouds, with the weather's values.
  animateWater(time, weatherLook);
  animateSky(time, weatherLook);
  // Trees, grass and plants sway (a few uniforms, shared by every material
  // that bends; the shadow map isn't touched).
  updateBend(weatherLook);
  // The windsocks by the tees (look/windsock.js).
  animateWindsocks(time, weatherLook);
  const pose = flagPose(wind ? weatherLook.gusting : null);
  for (const flag of flags) {
    let root = flag;
    while (root.parent) root = root.parent;
    if (!root.isScene) continue; // built but not shown, or removed
    const pos = flag.geometry.attributes.position;
    const rest = flag.userData.rest;
    // Each flag eases to the pose, so a gust lifts it rather than jerking it.
    const lift = (flag.userData.lift ??= pose.lift);
    flag.userData.lift = lift + (pose.lift - lift) * 0.06;
    const now = { ...pose, lift: flag.userData.lift };
    const t = time + flag.userData.phase / pose.speed;
    for (let i = 0; i < pos.count; i++) {
      const [x, y, z] = clothPoint(rest[i * 3], rest[i * 3 + 1], now, t);
      pos.setXYZ(i, x, y, z);
    }
    // Turned on its pole to stream downwind (smoothly, as it swings round).
    // Hanging limp in a calm, it has no way to point, and seen edge on it
    // all but vanished from the tee: there, it hangs broadside to the
    // camera, turning to the wind as it picks up (by 5 mph).
    if (wind && Number.isFinite(wind.yaw)) {
      let want = wind.yaw;
      const calm = 1 - Math.min(1, Math.max(0, (weatherLook.gusting - 1) / 4));
      if (camera && calm > 0) {
        flag.getWorldPosition(flagAt);
        // Broadside: the cloth (which runs out along cos yaw, -sin yaw)
        // across the line of sight to the camera, whichever way is nearer
        // the wind's.
        let side = Math.atan2(camera.position.x - flagAt.x, camera.position.z - flagAt.z);
        if (Math.cos(side - wind.yaw) < 0) side += Math.PI;
        want += Math.atan2(Math.sin(side - want), Math.cos(side - want)) * calm;
      }
      const d = Math.atan2(Math.sin(want - flag.rotation.y), Math.cos(want - flag.rotation.y));
      flag.rotation.y += d * 0.08;
    }
    // Its painted shadow with it.
    placeClothShadow(flag);
    pos.needsUpdate = true;
    flag.geometry.computeVertexNormals();
  }
}

// Stops animating flags that were thrown away (the putting green rebuilds).
export function forgetFlags(group) {
  group.traverse((o) => flags.delete(o));
}

// ---- Ball ----------------------------------------------------------------------

let dimples = null;
function dimpleTexture() {
  if (dimples) return dimples;
  const w = 512;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  // Rows of dimples, fewer towards the poles where the texture is squeezed,
  // and stretched sideways there to stay round on the sphere.
  const rows = 18;
  for (let row = 0; row < rows; row++) {
    const v = (row + 0.5) / rows;
    const across = Math.max(6, Math.round(36 * Math.sin(v * Math.PI)));
    const ry = (h / rows) * 0.42;
    const rx = Math.min((w / across) * 0.42, ry * (36 / across));
    for (let i = 0; i < across; i++) {
      const x = ((i + (row % 2) * 0.5) / across) * w;
      const y = v * h;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(rx / ry, 1);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, ry);
      g.addColorStop(0, "#808080");
      g.addColorStop(0.75, "#e0e0e0");
      g.addColorStop(1, "#ffffff");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, ry, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  dimples = new THREE.CanvasTexture(canvas);
  dimples.wrapS = THREE.RepeatWrapping;
  return dimples;
}

// The ball drawn at radius r, whatever size it was made at (sim/ballsize.mjs
// ballDrawRadius: real size on the ground, larger only in the air).
// Returns r.
export function sizeBall(ball, r) {
  const made = ball?.geometry?.parameters?.radius;
  if (made) ball.scale.setScalar(r / made);
  return r;
}

export function makeBall(radius) {
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 20),
    // The sky's reflection kept soft: at full strength the white ball read
    // as pale blue.
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.32, bumpMap: dimpleTexture(), bumpScale: 1.5, envMapIntensity: 0.45 }),
  );
  // Its shadow is a BallShadow, not the sun's shadow map, which is spread
  // over the whole scene and too coarse to catch something this small.
  // On High and up, a faint streak behind it when it's going fast
  // (look/balltrail.js).
  if (HIGH) addBallTrail(ball, radius);
  // Never lost in a thicker haze than a fair day's (look/weatherlook.js).
  return markReadable(ball);
}

// The ball's shadow: a soft ellipse on the ground, where the sun would put
// it, stretched along the sun's direction as a real one is. Drawn every
// frame at any height or distance - softer and fainter the higher the ball,
// never gone - so you can always see how high it is and where it's coming
// down. Add .mesh to the scene once; call update() each frame.
let ballShadowTexture = null;
export class BallShadow {
  constructor(sun, radius) {
    if (!ballShadowTexture) {
      const size = 64;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d");
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(0.45, "rgba(0,0,0,0.85)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      ballShadowTexture = new THREE.CanvasTexture(canvas);
    }
    this.sun = sun.clone().normalize();
    this.radius = radius;
    // Longer along the sun's line: 1 / sin(elevation).
    this.stretch = 1 / Math.max(0.2, this.sun.y);
    // Pulled forward harder than anything on the ground (water is the
    // strongest, see look/sandwater.js), so it shows on sand and water too.
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        map: ballShadowTexture, transparent: true, depthWrite: false,
        polygonOffset: true, polygonOffsetFactor: -10, polygonOffsetUnits: -16,
      }),
    );
    this.mesh.rotation.y = Math.atan2(this.sun.x, this.sun.z);
    this.mesh.renderOrder = 2;
  }

  // ball: its position; groundAt(x, z): the height of the surface drawn
  // there (sand and water lie a little above the grass); radius if the ball
  // has changed size.
  update(ball, groundAt = () => 0, radius = this.radius) {
    this.radius = radius;
    const g0 = groundAt(ball.x, ball.z);
    const height = Math.max(0, ball.y - this.radius - g0);
    // Holed, or otherwise below the surface: no shadow.
    if (ball.y < g0 - this.radius * 0.5 || !Number.isFinite(ball.y)) {
      this.mesh.visible = false;
      return;
    }
    const t = (ball.y - g0) / this.sun.y;
    const x = ball.x - this.sun.x * t;
    const z = ball.z - this.sun.z * t;
    const g = groundAt(x, z);
    this.mesh.visible = true;
    this.mesh.position.set(x, g + 0.01, z);
    const size = this.radius * 2.6 + height * 0.02;
    this.mesh.scale.set(size, 1, size * this.stretch);
    // Fainter under cloud, as every shadow is (never below 0.45 of a fair day's).
    this.mesh.material.opacity = (0.6 - 0.35 * Math.min(1, height / 40)) * weatherLook.shadow;
  }
}

// ---- Labels and signs ------------------------------------------------------------

// The range's yardage boards are the same family as the course's signs
// (look/signs.js): a dark green painted board, cream lettering and border,
// timber posts and rail.
export { makeSign } from "./look/signs.js";

// ---- Sand and water ----------------------------------------------------------------

// Bunkers, ponds, and tufts of longer grass are built in look/groundbits.js
// (and blob, the outline they're drawn from); here for the modes that
// always found them here.
export { blob, makeBunker, makeGrassTufts, makePond, bunkerOutline, pondOutline } from "./look/groundbits.js";

// ---- Range balls ---------------------------------------------------------------------

// Balls lying about the range, thickest where most shots finish. surfaceY
// (x, z): the height of what's drawn there, or null where a ball shouldn't
// lie (in the pond, in a bunker, on a target green).
export function makeRangeBalls(count, { seed = 5, width = 60, from = 40, to = 240, surfaceY = () => 0 } = {}) {
  const rand = seeded(seed);
  // (Twenty faces, not a sphere's eighty: the nearest lies 37 m off, a
  // pixel or two across on any screen - 2,200 of them were the range's
  // biggest triangle count after its trees.)
  const mesh = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(0.03, 0),
    new THREE.MeshLambertMaterial({ color: 0xf2f2ec }),
    count,
  );
  const m = new THREE.Matrix4();
  let n = 0;
  for (let i = 0; i < count; i++) {
    // Sums of randoms bunch up in the middle distances and near the line.
    const d = from + ((rand() + rand() + rand()) / 3) * (to - from);
    const x = ((rand() + rand() - 1) * width) / 1.4;
    const y = surfaceY(x, -d * 0.9144);
    if (y == null) continue;
    m.makeTranslation(x, y + 0.03, -d * 0.9144);
    mesh.setMatrixAt(n++, m);
  }
  mesh.count = n;
  return mesh;
}

// A pyramid of range balls beside each hitting mat (the owner: "the golf ball
// buckets look bad in the range, do a ball pyramid. And ensure ball size is
// same as the one on the mat"): a square stack, `layers` balls a side at the
// bottom and one on top, each ball resting in the hollow of the four under
// it, the same size and the same dimpled white as the ball being hit
// (makeBall: on the range drawn larger than life, so it can be followed).
// Each ball turned its own way, so the dimples don't line up. Built of plain
// meshes sharing one material, so every mat's pyramid merges into one draw
// call (look/merge.js).
export const PYRAMID_LAYERS = 4;
let pyramidLook = null;
export function ballPyramidSpots(radius, layers = PYRAMID_LAYERS) {
  const d = 2 * radius;
  // Each layer up sits d / sqrt(2) higher: in the hollow between four.
  const rise = d / Math.SQRT2;
  const spots = [];
  for (let k = 0; k < layers; k++) {
    const n = layers - k;
    const off = ((n - 1) * d) / 2;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) spots.push([i * d - off, radius + k * rise, j * d - off]);
  }
  return spots;
}
// Its balls: `fine`, the player's own bay's, as round as the one on the
// mat; the other bays', four metres and more off - and on the phone, whose
// picture makes even the nearest one a few pixels across - coarser
// (PYRAMID_BALL): seven pyramids of thirty fine balls were 74,000
// triangles.
export const PYRAMID_BALL = { fine: [16, 12], coarse: [10, 7] };
export function makeBallPyramid(radius, seed = 9, layers = PYRAMID_LAYERS, { fine = true } = {}) {
  pyramidLook ??= {
    geos: {},
    material: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.32, bumpMap: dimpleTexture(), bumpScale: 1.5, envMapIntensity: 0.45 }),
  };
  const [w, h] = PYRAMID_BALL[fine ? "fine" : "coarse"];
  const geo = (pyramidLook.geos[`${radius}:${w}`] ??= new THREE.SphereGeometry(radius, w, h));
  const group = new THREE.Group();
  const rand = seeded(seed);
  for (const [x, y, z] of ballPyramidSpots(radius, layers)) {
    const ball = new THREE.Mesh(geo, pyramidLook.material);
    ball.position.set(x, y, z);
    ball.rotation.set(rand() * Math.PI * 2, rand() * Math.PI * 2, rand() * Math.PI * 2);
    ball.castShadow = true;
    ball.receiveShadow = true;
    group.add(ball);
  }
  return group;
}
