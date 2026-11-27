// What a ball throws up, on Medium and up (sim/sprays.mjs works each one
// out): sand puffing up where it lands in a bunker, sand blasted out by a
// bunker shot, a splash of drops and a burst of white where it goes into
// water - each a few dozen grains or drops flying off and falling back, as
// points drawn round and soft, a cloud of dust or foam over them - and
// the bank splashed dark where it went in close, drying over a minute or
// two. A hole's are in a group of its own, built again with the hole;
// step() moves them on each frame.

import * as THREE from "three";
import { HIGH } from "./quality.js";
import { sprayPoint, sprayLife, SPRAY } from "../sim/sprays.mjs";
import { nodeKit, quadCopies } from "./gpu.js";

// Round and soft: a grain or drop's edge a little blurred, a cloud's
// mostly; each bit its own colour, size (metres) and alpha; as many pixels
// across as its size is at its distance (uScale: pixels a metre at one
// metre off, from the camera that draws it).
const VERTEX = `
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aAlpha;
  attribute float aSoft;
  uniform float uScale;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vSoft;
  void main() {
    vColor = aColor;
    vAlpha = aAlpha;
    vSoft = aSoft;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(aSize * uScale / max(0.05, -mv.z), 1.0, 96.0);
    gl_Position = projectionMatrix * mv;
  }
`;
const FRAGMENT = `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vSoft;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = vAlpha * (1.0 - smoothstep(1.0 - vSoft, 1.0, d));
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const SOFT = { grain: 0.35, drop: 0.3, dust: 1, foam: 1 };

let material = null;
function sprayMaterial() {
  if (material) return material;
  // (On WebGPURenderer, its node version for copies of a square: look/
  // glsl/spritenode.js.)
  const kit = nodeKit();
  material = kit ? kit.sprayNodeMaterial({ uScale: { value: 600 } }) : new THREE.ShaderMaterial({ vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms: { uScale: { value: 600 } }, transparent: true, depthWrite: false });
  return material;
}

// The bits drawn, from their attributes ({ name: BufferAttribute }, the
// places as "position"): points on WebGL; on WebGPURenderer, which draws a
// point a pixel across, a copy of a small square for each (look/gpu.js
// quadCopies), the places as "aAt".
function sprayBits(n, attributes) {
  if (!nodeKit()) {
    const geo = new THREE.BufferGeometry();
    for (const [name, a] of Object.entries(attributes)) geo.setAttribute(name, a);
    return new THREE.Points(geo, sprayMaterial());
  }
  const geo = quadCopies(n);
  for (const [name, a] of Object.entries(attributes)) {
    const copy = new THREE.InstancedBufferAttribute(a.array, a.itemSize);
    copy.setUsage(a.usage);
    geo.setAttribute(name === "position" ? "aAt" : name, copy);
  }
  return new THREE.Mesh(geo, sprayMaterial());
}
let wetLook = null;
const drawn = new THREE.Vector2();

export class Sprays {
  // parent: the hole's group; sand: the course's sand colour (a
  // THREE.Color), for the sand it throws.
  constructor(parent, { sand = new THREE.Color(0xdccb9d) } = {}) {
    this.sand = sand;
    this.group = new THREE.Group();
    this.group.name = "sprays";
    this.live = [];
    this.wets = [];
    if (!HIGH) return;
    parent.add(this.group);
    // A speck, far under the ground, so the shader's built with the hole
    // (look/warmup.js) and not at the first splash.
    const s = sprayBits(1, Object.fromEntries([["position", 3], ["aColor", 3], ["aSize", 1], ["aAlpha", 1], ["aSoft", 1]].map(([name, size]) => [name, new THREE.Float32BufferAttribute(new Array(size).fill(0), size)])));
    s.position.y = -50;
    s.userData.warm = true;
    this.group.add(s);
  }

  // A spray (sim/sprays.mjs) thrown from `spot` (a world THREE.Vector3):
  // sand in the course's sand, water's drops and foam their own.
  throw(spot, spray) {
    if (!HIGH || !spray?.parts?.length) return;
    const colour = spray.kind === "sand" ? this.sand : null;
    const n = spray.parts.length;
    const position = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const alpha = new Float32Array(n);
    const soft = new Float32Array(n);
    const grain = colour ?? new THREE.Color(0xdfe8ea);
    spray.parts.forEach((p, i) => {
      // A cloud lighter than the grains; foam white; drops the sky's grey.
      const c = p.kind === "dust" ? grain.clone().multiplyScalar(0.95) : p.kind === "foam" ? new THREE.Color(0xe8eeee) : p.kind === "drop" ? new THREE.Color(0xc9d6d8) : grain.clone().multiplyScalar(0.82 + ((i * 7) % 5) * 0.05);
      col.set([c.r, c.g, c.b], i * 3);
      size[i] = p.size;
      soft[i] = SOFT[p.kind] ?? 0.4;
    });
    const points = sprayBits(n, {
      position: new THREE.BufferAttribute(position, 3).setUsage(THREE.DynamicDrawUsage),
      aColor: new THREE.BufferAttribute(col, 3),
      aSize: new THREE.BufferAttribute(size, 1).setUsage(THREE.DynamicDrawUsage),
      aAlpha: new THREE.BufferAttribute(alpha, 1).setUsage(THREE.DynamicDrawUsage),
      aSoft: new THREE.BufferAttribute(soft, 1),
    });
    points.position.copy(spot);
    // (Its bits move: never culled by a box made before they did.)
    points.frustumCulled = false;
    points.renderOrder = 5;
    points.onBeforeRender = (renderer, scene, camera) => {
      renderer.getDrawingBufferSize(drawn);
      if (camera.isPerspectiveCamera) material.uniforms.uScale.value = drawn.y / (2 * Math.tan((camera.fov * Math.PI) / 360));
    };
    this.group.add(points);
    const s = { points, spray, t: 0, life: sprayLife(spray) };
    this.live.push(s);
    this.place(s);
  }

  // The bank splashed dark at `spot` (world), `r` metres across at most.
  wet(spot, r) {
    if (!HIGH || !(r > 0)) return;
    wetLook ??= new THREE.MeshLambertMaterial({ color: 0x2c2a1e, vertexColors: true, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    const mat = wetLook.clone();
    // Darkest in the middle, fading out to nothing at its torn edge.
    const geo = new THREE.CircleGeometry(r * 0.5, 18, 0, Math.PI * 2).rotateX(-Math.PI / 2);
    const p = geo.attributes.position;
    const col = new Float32Array(p.count * 4);
    for (let i = 0; i < p.count; i++) {
      const d = Math.hypot(p.getX(i), p.getZ(i)) / (r * 0.5);
      const a = Math.atan2(p.getZ(i), p.getX(i));
      if (d > 0.5) p.setXYZ(i, p.getX(i) * (1 + 0.25 * Math.sin(a * 5 + r * 9)), p.getY(i), p.getZ(i) * (1 + 0.25 * Math.sin(a * 5 + r * 9)));
      col.set([1, 1, 1, 1 - d * d], i * 4);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 4));
    const patch = new THREE.Mesh(geo, mat);
    patch.position.copy(spot);
    patch.position.y += 0.01;
    // A splash's patch isn't round: drawn out a little one way.
    patch.scale.set(1, 1, 0.7);
    patch.rotation.y = (spot.x * 7.1 + spot.z * 3.3) % Math.PI;
    this.group.add(patch);
    this.wets.push({ patch, t: 0 });
  }

  place(s) {
    const { position, aAt, aAlpha: alpha, aSize: size } = s.points.geometry.attributes;
    // (Copies of a square on WebGPURenderer: their places in aAt.)
    const pos = aAt ?? position;
    s.spray.parts.forEach((p, i) => {
      const q = sprayPoint(p, s.t);
      pos.setXYZ(i, q.x, q.y, q.z);
      alpha.setX(i, q.alpha);
      size.setX(i, q.size);
    });
    pos.needsUpdate = true;
    alpha.needsUpdate = true;
    size.needsUpdate = true;
  }

  // Whether any spray's bits are still flying (the picture mustn't rest
  // on them: app.js pictureMoving).
  get busy() {
    return this.live.length > 0;
  }

  // On by dt seconds: each spray's bits along, those done let go; each wet
  // patch drying.
  step(dt) {
    if (!this.live.length && !this.wets.length) return;
    for (const s of this.live) {
      s.t += dt;
      if (s.t < s.life) this.place(s);
    }
    for (const s of this.live.filter((q) => q.t >= q.life)) {
      this.group.remove(s.points);
      s.points.geometry.dispose();
    }
    this.live = this.live.filter((q) => q.t < q.life);
    for (const w of this.wets) {
      w.t += dt;
      w.patch.material.opacity = 0.4 * Math.max(0, 1 - w.t / SPRAY.wet.dry);
    }
    for (const w of this.wets.filter((q) => q.t >= SPRAY.wet.dry)) {
      this.group.remove(w.patch);
      w.patch.geometry.dispose();
      w.patch.material.dispose();
    }
    this.wets = this.wets.filter((q) => q.t < SPRAY.wet.dry);
  }
}
