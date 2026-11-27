// A windsock: a pole, and a striped cone of cloth on a swivel at its top
// that hangs limp in a calm, fills and lifts as the wind rises, flies level
// in a strong wind and swings round with the gusts (sim/windsock.mjs
// sockPose). Matt orange-red with a cream band (look/palette.js), never
// neon or white.
//
// The cloth moves every frame, so like a flag's it stays out of the sun's
// shadow map (look/shadowwatch.js: drawn only when something in it
// changes) and has a soft painted shadow of its own on the ground; the
// pole, which doesn't move, casts. A few dozen vertices moved on the
// processor once a frame (animateWindsocks, from scenery.js
// animateScenery), as a flag's are.

import * as THREE from "three";
import { PALETTE } from "./palette.js";
import { SUN_DIR } from "./environment.js";
import { SOCK, sockPose, sockPoint } from "../sim/windsock.mjs";

// Rings along the sock and sides round it.
const RINGS = 10;
const SIDES = 10;
// The cream band, as a share of the way along the sock.
const BAND = [0.36, 0.6];

const socks = new Set();
// (The sun now: moved where each round's sun is - look/environment.js setSun.)
const SUN = SUN_DIR;

let shadowMap = null;
function softShadow() {
  if (!shadowMap) {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(0.5, "rgba(0,0,0,0.7)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    shadowMap = new THREE.CanvasTexture(canvas);
  }
  return shadowMap;
}

// A windsock standing at the group's origin (place the group on the
// ground). Its cloth is animated by animateWindsocks.
export function makeWindsock({ seed = 1 } = {}) {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, SOCK.pole, 8), new THREE.MeshLambertMaterial({ color: PALETTE.pole }));
  pole.position.y = SOCK.pole / 2;
  pole.castShadow = true;
  // The cloth: a tube of RINGS x SIDES quads, each its band's colour.
  const quads = RINGS * SIDES;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(quads * 6 * 3), 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(quads * 6 * 3), 3));
  const colours = new Float32Array(quads * 6 * 3);
  const red = new THREE.Color(PALETTE.windsock);
  const cream = new THREE.Color(PALETTE.windsockBand);
  for (let i = 0; i < RINGS; i++) {
    const mid = (i + 0.5) / RINGS;
    const c = mid > BAND[0] && mid < BAND[1] ? cream : red;
    for (let k = 0; k < SIDES * 6; k++) colours.set([c.r, c.g, c.b], ((i * SIDES) * 6 + k) * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colours, 3));
  // Wherever it swings, within this of the top of the pole.
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), SOCK.length + SOCK.mouth + 0.3);
  const cloth = new THREE.Mesh(
    geo,
    // Matt, lit from whichever side is seen (cloth lets light through), a
    // little self-lit as the flags are.
    new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, emissive: PALETTE.windsock, emissiveIntensity: 0.1 }),
  );
  cloth.position.y = SOCK.pole - 0.08;
  cloth.castShadow = false;
  cloth.frustumCulled = true;
  const painted = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: softShadow(), transparent: true, depthWrite: false, opacity: 0.26, polygonOffset: true, polygonOffsetFactor: -10, polygonOffsetUnits: -16 }),
  );
  painted.renderOrder = 2;
  group.add(pole, cloth, painted);
  group.userData.sock = { cloth, painted, phase: (seed % 97) * 0.37, yaw: null, lift: null };
  socks.add(group);
  pose(group, sockPose(0), 0, 0);
  return group;
}

// Moves a sock's cloth to a pose, turned by yaw (world, as a flag streams:
// its +x downwind), at time t.
function pose(group, p, yaw, t) {
  const s = group.userData.sock;
  const pos = s.cloth.geometry.attributes.position;
  const nor = s.cloth.geometry.attributes.normal;
  const ring = [];
  const middle = [];
  for (let i = 0; i <= RINGS; i++) {
    const u = i / RINGS;
    const r = Array.from({ length: SIDES }, (_, k) => sockPoint(u, (k / SIDES) * Math.PI * 2, p, t + s.phase));
    ring.push(r);
    // Its middle (the mean of the ring), for the normals out from it.
    middle.push(r.reduce((a, q) => [a[0] + q[0] / SIDES, a[1] + q[1] / SIDES, a[2] + q[2] / SIDES], [0, 0, 0]));
  }
  let n = 0;
  const put = (i, k) => {
    const q = ring[i][k % SIDES];
    const c = middle[i];
    const l = Math.hypot(q[0] - c[0], q[1] - c[1], q[2] - c[2]) || 1;
    pos.setXYZ(n, q[0], q[1], q[2]);
    nor.setXYZ(n, (q[0] - c[0]) / l, (q[1] - c[1]) / l, (q[2] - c[2]) / l);
    n++;
  };
  for (let i = 0; i < RINGS; i++) {
    for (let k = 0; k < SIDES; k++) {
      put(i, k);
      put(i + 1, k);
      put(i, k + 1);
      put(i, k + 1);
      put(i + 1, k);
      put(i + 1, k + 1);
    }
  }
  pos.needsUpdate = true;
  nor.needsUpdate = true;
  s.cloth.rotation.y = yaw;
  // Its painted shadow: the cloth's middle carried down the sun's line to
  // the ground, longer the further it flies out.
  const mid = sockPoint(0.5, 0, { ...p, amp: 0 }, 0);
  const cx = Math.cos(yaw) * mid[0];
  const cz = -Math.sin(yaw) * mid[0];
  const h = s.cloth.position.y + mid[1];
  const k = h / SUN.y;
  s.painted.position.set(cx - SUN.x * k, 0.03, cz - SUN.z * k);
  s.painted.rotation.y = yaw;
  const out = Math.sin(p.lift);
  s.painted.scale.set(0.25 + SOCK.length * out * 0.9, 1, 0.3 + 0.25 * p.fill);
  s.lift = p.lift;
}

// Once a frame (scenery.js animateScenery): every sock shown flies in the
// wind this moment (look/weatherlook.js: gusting, yaw, still), swinging
// round with its gusts and easing to its pose, so a gust lifts it rather
// than jerking it.
export function animateWindsocks(time, w) {
  for (const group of socks) {
    let root = group;
    while (root.parent) root = root.parent;
    const s = group.userData.sock;
    if (!root.isScene) {
      // Thrown away with its hole: forgotten.
      if (s.shown) socks.delete(group);
      continue;
    }
    s.shown = true;
    const mph = w.still ? 0 : w.gusting;
    const p = sockPose(mph);
    // Eased, as a flag's lift is.
    s.lift = s.lift == null ? p.lift : s.lift + (p.lift - s.lift) * 0.05;
    const want = (Number.isFinite(w.yaw) ? w.yaw : 0) + p.swing * Math.sin(time * 0.55 + s.phase) * (0.6 + 0.4 * Math.sin(time * 1.7 + s.phase * 3));
    if (s.yaw == null) s.yaw = want;
    const d = Math.atan2(Math.sin(want - s.yaw), Math.cos(want - s.yaw));
    s.yaw += d * 0.04;
    pose(group, { ...p, lift: s.lift }, s.yaw, time);
  }
}

// How many socks are being flown (for the tests).
export const windsockCount = () => socks.size;
