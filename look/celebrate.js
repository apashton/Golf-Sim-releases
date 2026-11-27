// The 3D side of a celebration: confetti fluttering down round the flag -
// fired up over it by two confetti cannons either side of the green, out
// of the cup, or raining in from above, with gold and silver foil among it
// flashing as it turns, and paper streamers curling down - fireworks
// bursting in the sky beyond it (balls of sparks, rings, gold willows
// drooping, glitter crackling out), and a ring of sparkles rising from the
// cup. Not the same every time (sim/celebration.mjs celebrationStyle: the
// owner, 16 October 2026, "the graphics a little bit? Just another version
// of it"). Everything is sized to how far the camera is from the flag,
// so it reads the same close up or from across the green, and everything is
// thrown away (geometry, materials, texture) when it's cleared, so nothing
// builds up on the graphics card from hole to hole.

import * as THREE from "three";
import { particleCounts, celebrationStyle } from "../sim/celebration.mjs";
import { PALETTE, num } from "./palette.js";

// The palette's (look/palette.js): cream, never pure white - only the ball is.
const CONFETTI_COLOURS = PALETTE.confetti.map(num);
// Gold, silver and rose gold foil, flashing as it turns to the light.
const FOIL_COLOURS = PALETTE.foil.map(num);
// Strong colours, so the sparks show against a daytime sky.
const FIREWORK_COLOURS = PALETTE.fireworks.map((hex) => new THREE.Color(hex));
// A willow's long trails: gold.
const WILLOW = new THREE.Color(PALETTE.willow);
// What a spark starts as, for a moment: cream-hot.
const HOT = new THREE.Color(PALETTE.cream);
// Each spark is drawn as a short streak: its head and a few points behind.
const TRAIL = 4;

// A soft round dot for the sparks, made in code (no image files).
function glowTexture() {
  const n = 32;
  const data = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const r = Math.hypot(x + 0.5 - n / 2, y + 0.5 - n / 2) / (n / 2);
      const a = r < 0.35 ? 1 : Math.max(0, 1 - (r - 0.35) / 0.65) ** 1.5;
      const i = (y * n + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = 255;
      data[i + 3] = Math.round(255 * a);
    }
  }
  const tex = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
  tex.needsUpdate = true;
  return tex;
}

// A seeded random, so a celebration looks the same each time it's captured.
function random(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

const up = new THREE.Vector3(0, 1, 0);
const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const tmpV = new THREE.Vector3();
const tmpS = new THREE.Vector3();
const tmpC = new THREE.Color();

// The sparks' and the fireworks' material, and the confetti's.
function pointsMaterial(size, map) {
  return new THREE.PointsMaterial({
    size,
    map,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    sizeAttenuation: true,
    toneMapped: false,
    fog: false,
  });
}
function confettiMaterial() {
  return new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false, fog: false });
}
// The streamers': their colour in each corner, shaded as they twist.
function streamerMaterial() {
  return new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, vertexColors: true, toneMapped: false, fog: false });
}
// A piece's colour as it turns: brightest face-on to the camera - and
// foil much brighter, but only as it catches the light, so it flashes.
const shadeFor = (facing, foil) => (foil ? 0.3 + 1.5 * facing ** 6 : 0.45 + 0.55 * facing);

// A celebration's parts, tiny and never drawn, for building their shaders
// as the page loads (look/warmup.js) rather than as the ball drops for the
// first birdie of the day. Made once, and kept, so their shaders are too.
// Each made as the real ones are, down to the sparks' colours with their
// see-through (four numbers, not three): any difference is another shader,
// built as the ball drops - and dropped again with the celebration, so
// built again at every one.
let warmers = null;
export function celebrationWarmers() {
  if (warmers) return warmers;
  warmers = new THREE.Group();
  warmers.name = "celebration warm-up";
  const confetti = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 0.62), confettiMaterial(), 1);
  confetti.setColorAt(0, new THREE.Color(0xffffff));
  confetti.castShadow = false;
  warmers.add(confetti);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0], 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute([1, 1, 1, 1], 4));
  warmers.add(new THREE.Points(geo, pointsMaterial(1, glowTexture())));
  const ribbon = new THREE.BufferGeometry();
  ribbon.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0, 0, 0, 0], 3));
  ribbon.setAttribute("color", new THREE.Float32BufferAttribute([1, 1, 1, 1, 1, 1, 1, 1, 1], 3));
  const streamer = new THREE.Mesh(ribbon, streamerMaterial());
  streamer.castShadow = false;
  warmers.add(streamer);
  return warmers;
}

export class CelebrationEffects {
  // scene: where to put them. high: High graphics (Standard draws fewer).
  constructor(scene, { high = true, seed = 7 } = {}) {
    this.scene = scene;
    this.high = high;
    this.seed = seed;
    this.group = null;
    this.parts = [];
    this.onBurst = () => {};
  }

  get active() {
    return this.parts.length > 0;
  }

  // desc: from celebrationFor(). focus: the cup (world). camera: where it
  // will look from (for sizing and placing the fireworks). groundAt(x, z):
  // the ground height, for confetti to settle on.
  start(desc, { focus, camera, cameraAt = camera.position, groundAt = () => focus.y }) {
    this.clear();
    const counts = particleCounts(desc, { high: this.high });
    if (!counts.confetti && !counts.fireworks && !counts.sparkle) return;
    this.group = new THREE.Group();
    this.group.name = "celebration";
    this.scene.add(this.group);
    this.texture = glowTexture();
    const rand = random(this.seed++);
    // This time's version: cannons or a shower, foil, which fireworks.
    const style = celebrationStyle(desc.level, rand);
    // How big things should be: 1 when the camera is 6 m from the flag.
    const scale = THREE.MathUtils.clamp(cameraAt.distanceTo(focus) / 6, 0.4, 6);
    const ctx = { focus: focus.clone(), cameraAt: cameraAt.clone(), scale, rand, groundAt, style, level: desc.level };
    ctx.cannons = style.cannons ? this.cannonsAt(ctx) : [];
    this.style = style;
    if (counts.sparkle) this.parts.push(this.sparkle(ctx, counts.sparkle, desc.sparkle));
    if (counts.confetti) this.parts.push(this.confetti(ctx, counts.confetti, desc.level));
    if (counts.streamers) this.parts.push(this.streamers(ctx, counts.streamers));
    for (const c of ctx.cannons) for (const delay of c.volleys) this.parts.push(this.puff(ctx, c, delay));
    for (let i = 0; i < counts.fireworks; i++) {
      // The first goes up quickly; the rest follow at uneven intervals.
      this.parts.push(this.firework(ctx, counts.perBurst, 0.5 + i * (desc.level >= 3 ? 0.62 : 0.8) + rand() * 0.3, i, style.bursts[i % style.bursts.length] ?? "peony"));
    }
  }

  update(dt, camera) {
    if (!this.parts.length) return false;
    this.parts = this.parts.filter((p) => {
      const alive = p.update(dt, camera);
      if (!alive) p.dispose();
      return alive;
    });
    if (!this.parts.length) this.clear();
    return this.parts.length > 0;
  }

  // Takes everything away and frees it.
  clear() {
    for (const p of this.parts) p.dispose();
    this.parts = [];
    if (this.group) {
      this.scene.remove(this.group);
      this.group = null;
    }
    this.texture?.dispose();
    this.texture = null;
  }

  pointsMaterial(size) {
    return pointsMaterial(size, this.texture);
  }

  // ---- The confetti cannons -------------------------------------------------

  // Where the two cannons stand: either side of the flag as the camera
  // sees it, a little towards it, on the ground; each aimed up over the
  // flag, firing a moment apart - an ace's twice. [{ at, aim, volleys }]
  cannonsAt({ focus, cameraAt, scale, groundAt, level }) {
    const toCam = new THREE.Vector3().copy(cameraAt).sub(focus).setY(0);
    const reach = Math.max(1.5, toCam.length());
    toCam.normalize();
    const across = new THREE.Vector3(-toCam.z, 0, toCam.x);
    const over = focus.clone().add(new THREE.Vector3(0, scale * 3.4, 0));
    return [-1, 1].map((side, i) => {
      const at = focus.clone().addScaledVector(across, side * reach * 0.55).addScaledVector(toCam, reach * 0.2);
      at.y = groundAt(at.x, at.z) + 0.05 * scale;
      const aim = over.clone().sub(at).normalize();
      const first = 0.05 + i * 0.14;
      return { at, aim, volleys: level >= 3 ? [first, first + 1.1] : [first] };
    });
  }

  // A cannon going off: a puff of smoke from its mouth, spreading and
  // thinning out.
  puff({ scale, rand }, cannon, delay) {
    const count = 26;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 4);
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 4).setUsage(THREE.DynamicDrawUsage));
    const mat = this.pointsMaterial(scale * 0.32);
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    points.castShadow = false;
    this.group.add(points);
    const dir = [];
    for (let i = 0; i < count; i++) {
      tmpV.set(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(0.9).add(cannon.aim).normalize();
      dir.push(tmpV.clone().multiplyScalar(scale * (0.4 + rand() * 0.9)));
    }
    const life = 1.1;
    let age = -delay;
    return {
      update: (dt) => {
        age += dt;
        if (age < 0) return true;
        const t = age / life;
        const e = 1 - (1 - Math.min(1, t)) ** 3;
        for (let i = 0; i < count; i++) {
          pos.set([cannon.at.x + dir[i].x * e, cannon.at.y + dir[i].y * e + scale * 0.25 * t, cannon.at.z + dir[i].z * e], i * 3);
          col.set([0.93, 0.92, 0.88, t >= 1 ? 0 : 0.5 * (1 - t) ** 1.5], i * 4);
        }
        geo.attributes.position.needsUpdate = true;
        geo.attributes.color.needsUpdate = true;
        return age < life;
      },
      dispose: () => {
        this.group?.remove(points);
        geo.dispose();
        mat.dispose();
      },
      kind: "puff",
      count,
    };
  }

  // A piece fired from one of the cannons: up over the flag, spreading.
  // Into pos/vel at i; its wait.
  fromCannon(cannons, rand, scale, i, pos, vel) {
    const c = cannons[i % cannons.length];
    const volley = c.volleys[Math.floor(rand() * c.volleys.length)];
    pos.set([c.at.x, c.at.y + 0.05 * scale, c.at.z], i * 3);
    tmpV.set(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(0.55).add(c.aim).normalize();
    const speed = scale * (9 + rand() * 4.5);
    vel.set([tmpV.x * speed, tmpV.y * speed, tmpV.z * speed], i * 3);
    return volley + rand() * 0.12;
  }

  // ---- Confetti --------------------------------------------------------------

  // Paper squares - some gold and silver foil - fired up over the flag by
  // the cannons, out of the cup (eagle and better) or raining in from
  // above it, fluttering and drifting as they fall and settling flat on the
  // grass.
  confetti({ focus, cameraAt, scale, rand, groundAt, style = {}, cannons = [] }, count, level) {
    const geo = new THREE.PlaneGeometry(1, 0.62);
    const mat = confettiMaterial();
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    mesh.frustumCulled = false;
    // Nothing in a celebration casts into the sun's shadow map: it moves
    // every frame, and the map is drawn only when a caster changes
    // (look/shadowwatch.js).
    mesh.castShadow = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.group.add(mesh);
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const axis = new Float32Array(count * 3);
    const spin = new Float32Array(count * 2); // angle, rate
    const sway = new Float32Array(count * 3); // phase, rate, amount
    const size = new Float32Array(count);
    const wait = new Float32Array(count);
    const landed = new Uint8Array(count);
    const base = [];
    // Round the flag and in front of it, wider than it is deep so it fills
    // the picture without coming right up to the camera.
    const toCam = new THREE.Vector3().copy(cameraAt).sub(focus).setY(0);
    const reach = Math.max(1.5, toCam.length());
    toCam.normalize();
    const across = new THREE.Vector3(-toCam.z, 0, toCam.x);
    const centre = focus.clone().addScaledVector(toCam, reach * 0.2);
    // Where each comes from: the cup, the cannons, the sky (with no shower,
    // all that's not from the cup is from the cannons).
    const popper = style.popper ?? level >= 2;
    const fromCup = popper ? Math.floor(count * (cannons.length ? 0.25 : 0.35)) : 0;
    const fromCannons = cannons.length ? Math.floor((count - fromCup) * (style.shower === false ? 1 : 0.55)) : 0;
    const foil = new Uint8Array(count);
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand());
      const x = centre.x + (across.x * Math.cos(a) * 1.1 + toCam.x * Math.sin(a) * 0.55) * r * reach;
      const z = centre.z + (across.z * Math.cos(a) * 1.1 + toCam.z * Math.sin(a) * 0.55) * r * reach;
      if (i >= fromCup && i < fromCup + fromCannons) {
        wait[i] = this.fromCannon(cannons, rand, scale, i, pos, vel);
      } else if (i < fromCup) {
        // Out of the cup like a party popper.
        pos.set([focus.x, focus.y + 0.05, focus.z], i * 3);
        const speed = scale * (3.5 + rand() * 3);
        const spread = 0.25 + rand() * 0.45;
        vel.set([Math.cos(a) * spread * speed, speed, Math.sin(a) * spread * speed], i * 3);
        wait[i] = rand() * 0.25;
      } else {
        // Raining down: a quarter already in the picture, the rest from
        // higher up, so it keeps coming for several seconds.
        const h = rand() < 0.25 ? 1.2 + rand() * 1.8 : 3 + rand() * 6;
        pos.set([x, focus.y + scale * h, z], i * 3);
        vel.set([0, -scale * 0.6, 0], i * 3);
      }
      tmpV.set(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
      axis.set([tmpV.x, tmpV.y, tmpV.z], i * 3);
      spin.set([rand() * Math.PI * 2, 5 + rand() * 9], i * 2);
      sway.set([rand() * Math.PI * 2, 1.5 + rand() * 2.5, scale * (0.25 + rand() * 0.45)], i * 3);
      size[i] = scale * (0.065 + rand() * 0.045);
      // Foil, or paper - mostly gold for an ace.
      foil[i] = rand() < (style.foil ?? 0) ? 1 : 0;
      const gold = style.gold && rand() < 0.45;
      const colour = foil[i] || gold ? FOIL_COLOURS[gold ? 0 : Math.floor(rand() * FOIL_COLOURS.length)] : CONFETTI_COLOURS[Math.floor(rand() * CONFETTI_COLOURS.length)];
      base.push(new THREE.Color(colour));
      tmpM.makeScale(0, 0, 0);
      mesh.setMatrixAt(i, tmpM);
      mesh.setColorAt(i, base[i]);
    }
    const gravity = 9.8 * scale;
    const terminal = scale * 1.1; // paper doesn't fall fast
    const drag = gravity / terminal;
    const piece = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const flat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    let age = 0;
    const life = 30; // normally cleared with the hole long before this
    return {
      update: (dt, camera) => {
        age += dt;
        const fade = Math.min(1, Math.max(0, life - age)); // shrinks away at the very end
        for (let i = 0; i < count; i++) {
          if (age < wait[i]) continue;
          const k = i * 3;
          const ground = groundAt(pos[k], pos[k + 2]) + 0.004 * scale + (i % 7) * 0.0008 * scale;
          if (!landed[i]) {
            vel[k + 1] -= gravity * dt;
            // Flung up out of the cup it flies freely; falling, it flutters.
            const damp = Math.exp(-(vel[k + 1] > 0 ? 1.2 : drag) * dt);
            for (let j = 0; j < 3; j++) vel[k + j] *= damp;
            const s = Math.sin(age * sway[k + 1] + sway[k]) * sway[k + 2];
            const c = Math.cos(age * sway[k + 1] * 0.7 + sway[k]) * sway[k + 2];
            pos[k] += (vel[k] + s) * dt;
            pos[k + 1] += vel[k + 1] * dt;
            pos[k + 2] += (vel[k + 2] + c) * dt;
            spin[i * 2] += spin[i * 2 + 1] * dt;
            if (pos[k + 1] <= ground && vel[k + 1] < 0) {
              landed[i] = 1;
              pos[k + 1] = ground;
            }
          }
          if (landed[i]) {
            // Lying flat, turned whichever way it fell.
            tmpQ.setFromAxisAngle(up, spin[i * 2]).multiply(flat);
          } else {
            tmpQ.setFromAxisAngle(tmpV.set(axis[k], axis[k + 1], axis[k + 2]), spin[i * 2]);
          }
          piece.set(pos[k], pos[k + 1], pos[k + 2]);
          tmpM.compose(piece, tmpQ, tmpS.setScalar(size[i] * fade));
          mesh.setMatrixAt(i, tmpM);
          // Catches the light as it turns: brightest face-on to the camera
          // (foil flashing).
          if (camera) {
            const facing = Math.abs(normal.set(0, 0, 1).applyQuaternion(tmpQ).dot(tmpV.copy(camera.position).sub(piece).normalize()));
            const shade = landed[i] ? (foil[i] ? 0.9 : 0.8) : shadeFor(facing, foil[i]);
            mesh.setColorAt(i, tmpC.copy(base[i]).multiplyScalar(shade));
          }
        }
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        return age < life;
      },
      dispose: () => {
        this.group?.remove(mesh);
        geo.dispose();
        mat.dispose();
        mesh.dispose();
      },
      kind: "confetti",
      count,
    };
  }

  // ---- Streamers -------------------------------------------------------------

  // Paper ribbons: fired up over the flag by the cannons (or, with none,
  // drifting down from above it), each trailing out behind its head as it
  // flies, twisting and curling as it falls, and lying along the grass
  // where it lands. One mesh for all of them, each a strip of quads.
  streamers({ focus, cameraAt, scale, rand, groundAt, style = {}, cannons = [] }, count) {
    const K = 12; // points along each
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * K * 2 * 3);
    const col = new Float32Array(count * K * 2 * 3);
    const index = [];
    for (let i = 0; i < count; i++) {
      for (let j = 0; j < K - 1; j++) {
        const a = (i * K + j) * 2;
        index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    geo.setIndex(index);
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
    const mat = streamerMaterial();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.castShadow = false;
    this.group.add(mesh);
    // Each one's head (where it flies), and the points trailing it.
    const head = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const pts = new Float32Array(count * K * 3);
    const wait = new Float32Array(count);
    const seg = new Float32Array(count);
    const width = new Float32Array(count);
    const twist = new Float32Array(count * 2); // phase, rate
    const sway = new Float32Array(count * 3);
    const landed = new Uint8Array(count);
    const foil = new Uint8Array(count);
    const base = [];
    const toCam = new THREE.Vector3().copy(cameraAt).sub(focus).setY(0);
    const reach = Math.max(1.5, toCam.length());
    toCam.normalize();
    const across = new THREE.Vector3(-toCam.z, 0, toCam.x);
    for (let i = 0; i < count; i++) {
      if (cannons.length) wait[i] = this.fromCannon(cannons, rand, scale, i, head, vel);
      else {
        const a = rand() * Math.PI * 2;
        const r = Math.sqrt(rand()) * reach * 0.8;
        head.set([focus.x + across.x * Math.cos(a) * r + toCam.x * Math.sin(a) * r * 0.4, focus.y + scale * (2.5 + rand() * 4), focus.z + across.z * Math.cos(a) * r + toCam.z * Math.sin(a) * r * 0.4], i * 3);
        vel.set([0, -scale * 0.4, 0], i * 3);
        wait[i] = rand() * 1.5;
      }
      for (let j = 0; j < K; j++) pts.set([head[i * 3], head[i * 3 + 1] - j * 0.001, head[i * 3 + 2]], (i * K + j) * 3);
      seg[i] = scale * (0.06 + rand() * 0.04);
      width[i] = scale * (0.032 + rand() * 0.016);
      twist.set([rand() * Math.PI * 2, 4 + rand() * 6], i * 2);
      sway.set([rand() * Math.PI * 2, 1.2 + rand() * 1.8, scale * (0.2 + rand() * 0.35)], i * 3);
      foil[i] = rand() < (style.foil ?? 0) * 1.5 ? 1 : 0;
      const gold = style.gold && rand() < 0.45;
      base.push(new THREE.Color(foil[i] || gold ? FOIL_COLOURS[gold ? 0 : Math.floor(rand() * FOIL_COLOURS.length)] : CONFETTI_COLOURS[Math.floor(rand() * CONFETTI_COLOURS.length)]));
    }
    const gravity = 9.8 * scale;
    const terminal = scale * 0.75; // a ribbon falls slower than a square
    const drag = gravity / terminal;
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const dir = new THREE.Vector3();
    const side = new THREE.Vector3();
    const twistAxis = new THREE.Vector3();
    const view = new THREE.Vector3();
    let age = 0;
    const life = 30;
    return {
      update: (dt, camera) => {
        age += dt;
        const fade = Math.min(1, Math.max(0, life - age));
        for (let i = 0; i < count; i++) {
          const k = i * 3;
          const ground = groundAt(head[k], head[k + 2]) + 0.006 * scale;
          if (age >= wait[i] && !landed[i]) {
            vel[k + 1] -= gravity * dt;
            const damp = Math.exp(-(vel[k + 1] > 0 ? 1.4 : drag) * dt);
            for (let j = 0; j < 3; j++) vel[k + j] *= damp;
            const sx = Math.sin(age * sway[k + 1] + sway[k]) * sway[k + 2];
            const sz = Math.cos(age * sway[k + 1] * 0.8 + sway[k]) * sway[k + 2];
            head[k] += (vel[k] + sx) * dt;
            head[k + 1] += vel[k + 1] * dt;
            head[k + 2] += (vel[k + 2] + sz) * dt;
            if (head[k + 1] <= ground && vel[k + 1] < 0) {
              head[k + 1] = ground;
              landed[i] = 1;
            }
          }
          // The trail: each point a segment's length behind the one before,
          // sagging as it goes (all the way down once the head's landed),
          // never through the ground.
          const p0 = (i * K) * 3;
          pts[p0] = head[k];
          pts[p0 + 1] = head[k + 1];
          pts[p0 + 2] = head[k + 2];
          for (let j = 1; j < K; j++) {
            const q = (i * K + j) * 3;
            a.set(pts[q - 3], pts[q - 2], pts[q - 1]);
            b.set(pts[q], pts[q + 1] - (age >= wait[i] ? terminal * (landed[i] ? 1.2 : 0.35) * dt : 0), pts[q + 2]);
            dir.subVectors(b, a);
            const d = dir.length();
            if (d > 1e-6) b.copy(a).addScaledVector(dir, seg[i] / d);
            b.y = Math.max(b.y, ground);
            pts[q] = b.x;
            pts[q + 1] = b.y;
            pts[q + 2] = b.z;
          }
          // The strip: across each point, turning about it as it goes.
          const shown = age >= wait[i] ? fade : 0;
          for (let j = 0; j < K; j++) {
            const q = (i * K + j) * 3;
            a.set(pts[q], pts[q + 1], pts[q + 2]);
            if (j < K - 1) dir.set(pts[q + 3] - a.x, pts[q + 4] - a.y, pts[q + 5] - a.z);
            else dir.set(a.x - pts[q - 3], a.y - pts[q - 2], a.z - pts[q - 1]);
            dir.normalize();
            const phi = twist[i * 2] + j * 0.7 + (landed[i] ? 0 : age * twist[i * 2 + 1]);
            twistAxis.set(Math.cos(phi), landed[i] ? 0 : Math.sin(phi) * 0.6, Math.sin(phi));
            side.crossVectors(dir, twistAxis);
            if (landed[i] || side.lengthSq() < 1e-6) side.set(-dir.z, 0, dir.x);
            side.normalize().multiplyScalar(width[i] * 0.5 * shown);
            const v = (i * K + j) * 2 * 3;
            pos[v] = a.x - side.x;
            pos[v + 1] = a.y - side.y;
            pos[v + 2] = a.z - side.z;
            pos[v + 3] = a.x + side.x;
            pos[v + 4] = a.y + side.y;
            pos[v + 5] = a.z + side.z;
            // Brightest where the ribbon faces the camera (foil flashing).
            let shade = foil[i] ? 0.9 : 0.8;
            if (camera && !landed[i]) {
              const n = tmpV.crossVectors(dir, side).normalize();
              shade = shadeFor(Math.abs(n.dot(view.copy(camera.position).sub(a).normalize())), foil[i]);
            }
            const c = base[i];
            col.set([c.r * shade, c.g * shade, c.b * shade, c.r * shade, c.g * shade, c.b * shade], v);
          }
        }
        geo.attributes.position.needsUpdate = true;
        geo.attributes.color.needsUpdate = true;
        return age < life;
      },
      dispose: () => {
        this.group?.remove(mesh);
        geo.dispose();
        mat.dispose();
      },
      kind: "streamers",
      count,
    };
  }

  // ---- Fireworks -------------------------------------------------------------

  // One rocket: it climbs from low in the picture, then bursts into sparks
  // that spread, droop under gravity, twinkle and fade - a ball of them
  // ("peony"), a flat ring, a gold willow whose long trails droop and
  // linger, or glitter that crackles out (sim/celebration.mjs BURSTS).
  // Placed from where
  // the camera is, beyond the flag and high in the frame, so it's always in
  // the sky and in view; it keeps that place in the picture while the camera
  // circles the flag, rather than drifting off the edge.
  firework({ rand, focus, groundAt }, count, delay, index, kind = "peony") {
    const geo = new THREE.BufferGeometry();
    const n = count * TRAIL;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 4);
    const head = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 4).setUsage(THREE.DynamicDrawUsage));
    const mat = this.pointsMaterial(1);
    const points = new THREE.Points(geo, mat);
    points.name = "firework";
    points.frustumCulled = false;
    points.castShadow = false;
    points.visible = false;
    this.group.add(points);
    const main = FIREWORK_COLOURS[(index * 2 + Math.floor(rand() * 2)) % FIREWORK_COLOURS.length];
    const second = FIREWORK_COLOURS[(index * 3 + 1) % FIREWORK_COLOURS.length];
    const tint = [];
    for (let i = 0; i < count; i++) tint.push(kind === "willow" ? WILLOW : kind === "crackle" ? (rand() < 0.6 ? HOT : WILLOW) : rand() < 0.72 ? main : second);
    // How each kind flies: how long a spark lasts, how fast it slows, how
    // hard it droops, how long its streak, when it starts to twinkle, and
    // how hard it's thrown out.
    const how = {
      peony: { life: [1.5, 0.7], damp: 2.4, droop: 1.1, lag: 0.04, twinkle: 0.55, throw: 1 },
      ring: { life: [1.4, 0.5], damp: 2.4, droop: 0.9, lag: 0.05, twinkle: 0.6, throw: 1 },
      willow: { life: [2.6, 0.8], damp: 3.1, droop: 1.7, lag: 0.11, twinkle: 2, throw: 0.8 },
      crackle: { life: [1, 0.5], damp: 2.8, droop: 1, lag: 0.02, twinkle: 0.2, throw: 0.9 },
    }[kind] ?? { life: [1.5, 0.7], damp: 2.4, droop: 1.1, lag: 0.04, twinkle: 0.55, throw: 1 };
    const life = new Float32Array(count);
    for (let i = 0; i < count; i++) life[i] = how.life[0] + rand() * how.life[1];
    // A ring's plane: facing the camera, tipped a little one way or another.
    const ringU = new THREE.Vector3(1, 0, 0);
    const ringV = new THREE.Vector3(0, 1, 0);
    // Either side of the banner, alternately, in the sky; far enough in
    // that a whole burst stays in the picture (and out from behind the hole
    // map on the right in bay view).
    const side = (index % 2 ? 1 : -1) * (0.42 + rand() * 0.18);
    const height = 0.12 + rand() * 0.4;
    const far = 1.5 + rand() * 1.2;
    let age = -delay;
    let phase = "wait";
    // Where it climbs from and bursts, in the camera's frame; and how far
    // the burst is raised to keep it clear of the ground there.
    let toCam = null;
    let fromCam = null;
    let lift = 0;
    const from = new THREE.Vector3();
    const to = new THREE.Vector3();
    let radius = 1;
    const rocketTime = 0.55;
    return {
      update: (dt, camera) => {
        age += dt;
        if (age < 0) return true;
        if (phase === "wait") {
          // Place it in the frame as the camera stands now.
          const d = Math.max(8, camera.position.distanceTo(focus)) * far;
          const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * d;
          const halfW = halfH * camera.aspect;
          toCam = new THREE.Vector3(side * halfW, height * halfH, -d);
          fromCam = new THREE.Vector3(side * halfW * 0.9, -halfH * 0.2, -d);
          to.copy(toCam).applyMatrix4(camera.matrixWorld);
          lift = Math.max(0, groundAt(to.x, to.z) + halfH * 0.5 - to.y);
          radius = halfH * 0.36;
          points.material.size = radius * 0.2;
          points.visible = true;
          phase = "rocket";
        }
        // Where that is in the world with the camera where it is now.
        to.copy(toCam).applyMatrix4(camera.matrixWorld);
        to.y += lift;
        from.copy(fromCam).applyMatrix4(camera.matrixWorld);
        from.y = Math.max(from.y, groundAt(from.x, from.z));
        if (phase === "rocket") {
          // A bright point climbing, with a short tail.
          const k = Math.min(1, age / rocketTime);
          const e = 1 - (1 - k) * (1 - k);
          col.fill(0);
          for (let j = 0; j < TRAIL * 2; j++) {
            tmpV.copy(from).lerp(to, Math.max(0, e - j * 0.02));
            pos.set([tmpV.x, tmpV.y, tmpV.z], j * 3);
            col.set([1, 0.85, 0.6, 1 - j / (TRAIL * 2)], j * 4);
          }
          if (k >= 1) {
            phase = "burst";
            age = 0;
            this.onBurst(index);
            if (kind === "ring") {
              // Across the picture, tipped up to a third of the way over.
              ringU.setFromMatrixColumn(camera.matrixWorld, 0);
              ringV.setFromMatrixColumn(camera.matrixWorld, 1);
              const tip = (rand() - 0.5) * 1.2;
              const towards = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 2);
              ringV.multiplyScalar(Math.cos(tip)).addScaledVector(towards, Math.sin(tip));
            }
            for (let i = 0; i < count; i++) {
              if (kind === "ring") {
                // Round the ring, evenly, a little ragged.
                const a = (i / count) * Math.PI * 2 + rand() * 0.05;
                tmpV.copy(ringU).multiplyScalar(Math.cos(a)).addScaledVector(ringV, Math.sin(a)).multiplyScalar(radius * 2.6 * (0.93 + rand() * 0.1));
              } else {
                // A direction evenly over the sphere.
                const z = rand() * 2 - 1;
                const a = rand() * Math.PI * 2;
                const r = Math.sqrt(1 - z * z);
                tmpV.set(r * Math.cos(a), z, r * Math.sin(a)).multiplyScalar(radius * 2.6 * how.throw * (0.75 + rand() * 0.35));
              }
              vel.set([tmpV.x, tmpV.y, tmpV.z], i * 3);
            }
          }
        } else if (phase === "burst") {
          // Each spark's head is kept relative to the middle of the burst.
          const damp = Math.exp(-how.damp * dt);
          let alive = false;
          for (let i = 0; i < count; i++) {
            const k = i * 3;
            vel[k + 1] -= radius * how.droop * dt;
            for (let j = 0; j < 3; j++) {
              vel[k + j] *= damp;
              head[k + j] += vel[k + j] * dt;
            }
            const t = age / life[i];
            let a = t < 1 ? (1 - t) ** 1.2 : 0;
            // Twinkling as it dies away (glitter from the start, crackling).
            if (t > how.twinkle && a > 0) a *= kind === "crackle" ? (Math.sin(age * 57 + i * 2.3) > 0.2 ? 1 : 0.1) : 0.4 + 0.6 * Math.abs(Math.sin(age * 40 + i * 1.7));
            const c = tint[i];
            const hot = Math.max(0, 1 - age * 4); // cream-hot for a moment
            const r = c.r + (HOT.r - c.r) * hot;
            const g = c.g + (HOT.g - c.g) * hot;
            const b = c.b + (HOT.b - c.b) * hot;
            // The streak: the head, then points back along its path.
            for (let j = 0; j < TRAIL; j++) {
              const p = (i * TRAIL + j) * 3;
              const lag = j * how.lag;
              pos.set([to.x + head[k] - vel[k] * lag, to.y + head[k + 1] - vel[k + 1] * lag, to.z + head[k + 2] - vel[k + 2] * lag], p);
              col.set([r, g, b, a * (1 - j / TRAIL) ** 1.3], (i * TRAIL + j) * 4);
            }
            if (a > 0) alive = true;
          }
          if (!alive) return false;
        }
        geo.attributes.position.needsUpdate = true;
        geo.attributes.color.needsUpdate = true;
        return true;
      },
      dispose: () => {
        this.group?.remove(points);
        geo.dispose();
        mat.dispose();
      },
      kind: "firework",
      count,
    };
  }

  // ---- Sparkle ---------------------------------------------------------------

  // A ring of glints round the cup that rises and spreads, twinkling; a
  // second ring follows for a birdie and better.
  sparkle({ focus, scale, rand }, count, amount) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 4);
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 4).setUsage(THREE.DynamicDrawUsage));
    const mat = this.pointsMaterial(scale * (0.12 + 0.12 * amount));
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    points.castShadow = false;
    this.group.add(points);
    const rings = amount >= 0.6 ? 2 : 1;
    const angle = new Float32Array(count);
    const lift = new Float32Array(count);
    const ring = new Uint8Array(count);
    const phase = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      angle[i] = (i / count) * Math.PI * 2 * 3 + rand() * 0.3;
      lift[i] = 0.5 + rand();
      ring[i] = i % rings;
      phase[i] = rand() * Math.PI * 2;
    }
    const reach = scale * (0.3 + amount * 0.9);
    const duration = 1.6 + amount * 1.2;
    let age = 0;
    return {
      update: (dt) => {
        age += dt;
        for (let i = 0; i < count; i++) {
          const t = Math.max(0, age - ring[i] * 0.35) / duration;
          const e = 1 - (1 - Math.min(1, t)) ** 3;
          const r = 0.08 + reach * e;
          pos.set(
            [focus.x + Math.cos(angle[i]) * r, focus.y + 0.03 + scale * 0.5 * lift[i] * e * amount, focus.z + Math.sin(angle[i]) * r],
            i * 3,
          );
          const twinkle = 0.55 + 0.45 * Math.sin(age * 22 + phase[i]);
          const a = t <= 0 || t >= 1 ? 0 : Math.min(1, t * 8) * (1 - t) * twinkle;
          col.set([1, 0.92, 0.6 + 0.4 * (i % 2), a], i * 4);
        }
        geo.attributes.position.needsUpdate = true;
        geo.attributes.color.needsUpdate = true;
        return age < duration + 0.4;
      },
      dispose: () => {
        this.group?.remove(points);
        geo.dispose();
        mat.dispose();
      },
      kind: "sparkle",
      count,
    };
  }
}
