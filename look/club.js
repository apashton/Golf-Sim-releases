// The club's built things beyond the signs: the furniture by each tee and
// the rakes by greenside bunkers (sim/furniture.mjs says where), and the
// clubhouse (sim/buildings.mjs). In the
// signs' family (look/signs.js) - painted timber, cream and dark green,
// a little metal - and the palette's (look/palette.js, CLUB): nothing
// black, nothing pure white.
//
// Each lot is merged into one mesh coloured by vertex, so a hole's
// furniture is one draw call however many pieces it has. It doesn't move,
// so where it's close to play it casts into the sun's shadow map, inside
// the box the hole's trees already give it (look/environment.js
// fitShadows): nothing here widens the map.

import * as THREE from "three";
import { markTwin } from "./twins.js";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { PALETTE } from "./palette.js";
import { withSceneryHooks } from "./glsl/hooks.js";
import { SUN_DIR } from "./environment.js";
import { boardFace } from "./signs.js";
import { makeFlag } from "../scenery.js";
import { CLUBHOUSE, footprintClear } from "../sim/buildings.mjs";
import { NET_FADE, NET_FROM, POLE_HIGH } from "../sim/furniture.mjs";

const P = PALETTE;

// ---- A kit of coloured parts, merged into one mesh ---------------------------------

// Parts are added in a local frame, placed by `at` (x, y, z), turned by
// `turn` about the upright and `tilt` ([rx, rz]), each painted one colour.
export class Kit {
  constructor() {
    this.parts = [];
    this.m = new THREE.Matrix4();
    this.q = new THREE.Quaternion();
    this.e = new THREE.Euler();
    // Where the next parts go (a piece's own frame): set by place().
    this.frame = new THREE.Matrix4();
  }

  // The frame the next parts are put in: at (x, y, z) in the world, turned
  // by `turn` about the upright.
  place(x, y, z, turn = 0) {
    this.frame.compose(new THREE.Vector3(x, y, z), this.q.setFromEuler(this.e.set(0, turn, 0)), new THREE.Vector3(1, 1, 1));
    return this;
  }

  add(geo, hex, { at = [0, 0, 0], turn = 0, tilt = [0, 0] } = {}) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const name of Object.keys(g.attributes)) if (name !== "position" && name !== "normal") g.deleteAttribute(name);
    this.m.compose(new THREE.Vector3(...at), this.q.setFromEuler(this.e.set(tilt[0], turn, tilt[1])), new THREE.Vector3(1, 1, 1));
    g.applyMatrix4(this.m);
    g.applyMatrix4(this.frame);
    const c = new THREE.Color(hex);
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) col.set([c.r, c.g, c.b], i * 3);
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    this.parts.push(g);
    return this;
  }

  box(w, h, d, hex, opts) {
    return this.add(new THREE.BoxGeometry(w, h, d), hex, opts);
  }

  cyl(rTop, rBottom, h, sides, hex, opts) {
    return this.add(new THREE.CylinderGeometry(rTop, rBottom, h, sides), hex, opts);
  }

  get empty() {
    return this.parts.length === 0;
  }

  // Everything added, as one mesh (null if nothing was).
  mesh(material = kitMaterial()) {
    if (this.empty) return null;
    const geo = mergeGeometries(this.parts);
    for (const p of this.parts) p.dispose();
    this.parts = [];
    return new THREE.Mesh(geo, material);
  }
}

// The one material every kit shares: matt, lit, coloured by vertex.
let kitMat = null;
export function kitMaterial() {
  kitMat ??= withSceneryHooks(new THREE.MeshLambertMaterial({ vertexColors: true }), "sign");
  return kitMat;
}

// ---- Furniture by the tee ---------------------------------------------------------------

// Each piece in its own frame, its front towards +z, standing on y = 0.
const PIECES = {
  // A bench: timber slats on a dark green painted frame.
  bench(k) {
    for (const z of [-0.12, 0.0, 0.12]) k.box(1.6, 0.035, 0.1, P.timber, { at: [0, 0.45, z] });
    for (const y of [0.62, 0.76]) k.box(1.6, 0.09, 0.03, P.timber, { at: [0, y, -0.2] });
    for (const x of [-0.7, 0.7]) {
      k.box(0.06, 0.45, 0.06, P.signBoard, { at: [x, 0.22, 0.14] });
      k.box(0.06, 0.85, 0.06, P.signBoard, { at: [x, 0.42, -0.2] });
      k.box(0.06, 0.04, 0.42, P.signBoard, { at: [x, 0.42, -0.03] });
    }
  },
  // A ball washer: a dark green paddle box on a cream post, a timber
  // handle on top.
  washer(k) {
    k.box(0.07, 0.85, 0.07, P.paint, { at: [0, 0.42, 0] });
    k.box(0.24, 0.28, 0.14, P.signBoard, { at: [0, 0.98, 0] });
    k.box(0.04, 0.16, 0.04, P.timber, { at: [0.06, 1.18, 0] });
    k.box(0.12, 0.035, 0.035, P.paint, { at: [0.06, 1.27, 0] });
  },
  // A bin: dark green, a cream band, a timber lid.
  bin(k) {
    k.cyl(0.22, 0.2, 0.62, 10, P.signBoard, { at: [0, 0.31, 0] });
    k.cyl(0.225, 0.225, 0.06, 10, P.paint, { at: [0, 0.5, 0] });
    k.cyl(0.24, 0.24, 0.04, 10, P.timber, { at: [0, 0.64, 0] });
  },
  // A divot box: a timber box of sand and seed on a short post, its lid
  // painted cream.
  divots(k) {
    k.box(0.08, 0.5, 0.08, P.timber, { at: [0, 0.25, 0] });
    k.box(0.46, 0.26, 0.34, P.timber, { at: [0, 0.62, 0] });
    k.box(0.5, 0.04, 0.38, P.paint, { at: [0, 0.77, -0.02], tilt: [-0.12, 0] });
  },
  // A rake lying on the grass, along +x: a cream handle, a dark green head
  // with its teeth.
  rake(k) {
    k.cyl(0.016, 0.016, 1.5, 6, P.paint, { at: [0.15, 0.03, 0], tilt: [0, Math.PI / 2] });
    k.box(0.05, 0.035, 0.5, P.signBoard, { at: [-0.62, 0.035, 0] });
    for (let i = -4; i <= 4; i++) k.box(0.02, 0.05, 0.015, P.metal, { at: [-0.66, 0.03, i * 0.055], tilt: [0, -1.2] });
  },
};

// A hole's furniture (sim/furniture.mjs holeFurniture): the pieces by the
// tee and the rakes, placed on the ground - groundAt(x, z) its height
// there (hole frame) - as one mesh; null if there's none.
export function makeFurniture({ tee = [], rakes = [] }, groundAt) {
  const k = new Kit();
  // Hole frame -> world: (x, y, z) -> (z, y, -x); a direction faced (hole
  // frame) -> a turn about the upright, as the signs are placed.
  const turnTo = ([fx, fz]) => Math.atan2(fz, -fx);
  for (const f of tee) {
    const [x, z] = f.at;
    k.place(z, groundAt(x, z), -x, turnTo(f.face));
    PIECES[f.kind]?.(k);
  }
  for (const r of rakes) {
    const [x, z] = r.at;
    // Its handle along the bunker's edge (the piece lies along its own +x).
    k.place(z, groundAt(x, z), -x, Math.atan2(r.along[0], r.along[1]));
    PIECES.rake(k);
  }
  const mesh = k.mesh();
  if (!mesh) return null;
  mesh.castShadow = true;
  // (Small: the near shadow map's only, where there is one - shadowwatch.js.)
  mesh.userData.shadowNear = true;
  mesh.receiveShadow = true;
  return mesh;
}

// ---- The clubhouse ------------------------------------------------------------------------

// A soft dark patch for a building's painted shadow (one per page).
let shadowTex = null;
function shadowTexture() {
  if (!shadowTex) {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.fillRect(0, 0, size, size);
    // A rounded square, fading out over its outer quarter.
    for (let i = 0; i < 12; i++) {
      const inset = (i / 12) * (size * 0.25);
      ctx.fillStyle = `rgba(0,0,0,${0.09})`;
      ctx.beginPath();
      ctx.roundRect(inset, inset, size - inset * 2, size - inset * 2, size * 0.12);
      ctx.fill();
    }
    shadowTex = new THREE.CanvasTexture(canvas);
  }
  return shadowTex;
}
let shadowMat = null;
function paintedShadowMaterial() {
  shadowMat ??= new THREE.MeshBasicMaterial({ map: shadowTexture(), color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -10, polygonOffsetUnits: -16 });
  return shadowMat;
}

// A painted shadow: the soft patch, `w` x `d` metres, lying at (x, y, z)
// turned `turn`, pushed away from the sun as far as something `high`
// metres tall would throw it.
// (The sun now: moved where each round's sun is - look/environment.js setSun.)
const SUN = SUN_DIR;
export function paintedShadow(w, d, high, turn = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), paintedShadowMaterial());
  m.scale.set(w, 1, d);
  m.rotation.y = turn;
  const k = (high * 0.45) / Math.max(SUN.y, 0.2);
  m.userData.offset = [-SUN.x * k, -SUN.z * k];
  m.position.set(m.userData.offset[0], 0.04, m.userData.offset[1]);
  m.renderOrder = 2;
  return m;
}

// A gable: the triangle under a pitched roof, `width` along x, from `depth`
// deep (z, about 0) at its foot up to `high` at its ridge.
function gable(width, depth, high) {
  const s = new THREE.Shape([new THREE.Vector2(-depth / 2, 0), new THREE.Vector2(depth / 2, 0), new THREE.Vector2(0, high)]);
  return new THREE.ExtrudeGeometry(s, { depth: width, bevelEnabled: false }).rotateY(-Math.PI / 2).translate(width / 2, 0, 0);
}

// A pitched roof over a box `width` x `depth` (x, z; ridge along x), from
// its eaves to `rise` above them, overhanging all round.
function pitchedRoof(k, width, depth, rise, hex, { at = [0, 0, 0], over = 0.45, thick = 0.16 } = {}) {
  const a = Math.atan2(rise, depth / 2);
  const len = Math.hypot(depth / 2, rise) + over;
  for (const s of [1, -1]) {
    // Each slope from its eave up to the ridge.
    const mz = (s * depth) / 4 + (s * over) / 2 * Math.cos(a);
    const my = rise / 2 - (over / 2) * Math.sin(a);
    k.box(width + over * 2, thick, len, hex, { at: [at[0], at[1] + my + thick / 2, at[2] + mz], tilt: [s * a, 0] });
  }
  // A ridge capping.
  k.box(width + over * 2, 0.14, 0.3, hex, { at: [at[0], at[1] + rise + thick * 0.8, at[2]] });
}

// Flowers in a bed (High): little coloured heads scattered over it,
// seeded so a bed always grows the same.
function flowerBed(k, x0, z0, x1, z1, y, seed, high) {
  k.box(x1 - x0, 0.5, z1 - z0, P.soil, { at: [(x0 + x1) / 2, y - 0.2, (z0 + z1) / 2] });
  // Box hedges round its edge.
  const h = 0.38;
  const t = 0.34;
  k.box(x1 - x0 + t, h, t, P.hedge, { at: [(x0 + x1) / 2, y + h / 2 - 0.05, z0] });
  k.box(x1 - x0 + t, h, t, P.hedge, { at: [(x0 + x1) / 2, y + h / 2 - 0.05, z1] });
  k.box(t, h, z1 - z0, P.hedge, { at: [x0, y + h / 2 - 0.05, (z0 + z1) / 2] });
  k.box(t, h, z1 - z0, P.hedge, { at: [x1, y + h / 2 - 0.05, (z0 + z1) / 2] });
  let r = seed * 9301 + 49297;
  const rand = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  if (!high) {
    // Standard: the bed's colour as patches of ground, no flower heads.
    const n = 4;
    for (let i = 0; i < n; i++) {
      const cx = x0 + ((i + 0.5) / n) * (x1 - x0);
      k.box(((x1 - x0) / n) * 0.8, 0.06, (z1 - z0) * 0.6, P.flowers[i % P.flowers.length], { at: [cx, y + 0.06, (z0 + z1) / 2] });
    }
    return;
  }
  const head = new THREE.OctahedronGeometry(0.11, 0);
  const area = (x1 - x0) * (z1 - z0);
  for (let i = 0; i < area * 3.2; i++) {
    const x = x0 + 0.3 + rand() * (x1 - x0 - 0.6);
    const z = z0 + 0.3 + rand() * (z1 - z0 - 0.6);
    // In drifts: the colour goes with where along the bed it is.
    const c = P.flowers[Math.floor(((x - x0) / (x1 - x0)) * 3 + rand() * 1.6) % P.flowers.length];
    k.add(head, c, { at: [x, y + 0.12 + rand() * 0.1, z] });
  }
}

// The clubhouse, its terrace, flagpole, board, benches, bag stand and
// flower beds edged with box hedges (sim/buildings.mjs CLUBHOUSE): one
// design, used behind the practice greens and past a course's last green.
// The group's origin is the middle of its front wall on the ground, its
// front towards +z; turned by `turn` about the upright. Parts reach a
// metre and a half below the ground, so it stands on a slope without a
// gap under it.
//   cast: whether it casts into the sun's shadow map (where it's inside
//     the map's box already: the practice greens); else `painted` gives it
//     a painted shadow instead
//   board: the words on its board ("Practice Green"), or null
//   high: flower heads in the beds (Standard: coloured ground)
// Three draws: the building and all its furniture, the board's face, the
// flag's cloth (and the painted shadow, if it has one). The flag flies in
// the mode's wind as every flag does (scenery.js animateScenery).
export function makeClubhouse({ turn = 0, cast = true, painted = false, board = null, high = true, seed = 1 } = {}) {
  const C = CLUBHOUSE;
  const W = C.width;
  const D = C.depth;
  const E = C.eaves;
  const sunk = 1.5;
  const k = new Kit();
  k.place(0, 0, 0, 0);
  // The walls, on a stone plinth.
  k.box(W, E + sunk, D, P.render, { at: [0, (E - sunk) / 2, -D / 2] });
  k.box(W + 0.12, 0.55 + sunk, D + 0.12, P.stone, { at: [0, (0.55 - sunk) / 2, -D / 2] });
  // The gables, the roof and two chimneys.
  k.add(gable(W, D, C.ridge - E), P.render, { at: [0, E, -D / 2] });
  pitchedRoof(k, W, D, C.ridge - E, P.roofSlate, { at: [0, E, -D / 2] });
  for (const x of [-W * 0.3, W * 0.32]) k.box(0.9, 2.4, 0.9, P.brick, { at: [x, C.ridge - 0.3, -D / 2 - 1.2] });
  // Windows: deep blue-grey panes with cream sills, two floors across the
  // front, two each side; glazed doors onto the terrace.
  const pane = (x, y, z, w, h, turnTo = 0) => {
    k.box(w, h, 0.08, P.window, { at: [x, y, z], turn: turnTo });
    k.box(w + 0.2, 0.1, 0.18, P.paint, { at: [x - (turnTo ? 0 : 0), y - h / 2 - 0.05, z], turn: turnTo });
  };
  for (const x of [-7.2, -4.4, 4.4, 7.2]) pane(x, 1.65, 0.03, 1.4, 1.5);
  for (const x of [-7.2, -4.4, -1.5, 1.5, 4.4, 7.2]) pane(x, 3.9, 0.03, 1.3, 1.3);
  k.box(3.2, 2.5, 0.08, P.window, { at: [0, 1.25, 0.03] });
  k.box(3.5, 0.18, 0.14, P.timber, { at: [0, 2.55, 0.06] });
  for (const x of [-1.65, 0, 1.65]) k.box(0.12, 2.5, 0.12, P.timber, { at: [x, 1.25, 0.06] });
  for (const s of [-1, 1]) for (const z of [-3, -7]) pane((s * (W / 2 + 0.03)), 1.75, z, 1.4, 1.4, Math.PI / 2);
  // The terrace: stone flags on a low base, a timber rail along its front
  // with a gap to the steps.
  const T = C.terrace;
  const top = 0.35;
  k.box(W + 1, top + sunk, T, P.flagstone, { at: [0, (top - sunk) / 2, T / 2] });
  for (const s of [-1, 1]) {
    k.box(W / 2 - 1.6, 0.08, 0.08, P.timber, { at: [s * (W / 4 + 1.05), top + 0.85, T - 0.1] });
    k.box(W / 2 - 1.6, 0.08, 0.08, P.timber, { at: [s * (W / 4 + 1.05), top + 0.45, T - 0.1] });
    for (let i = 0; i < 4; i++) k.box(0.12, 0.95, 0.12, P.timber, { at: [s * (1.6 + i * ((W / 2 - 1.2) / 3)), top + 0.45, T - 0.1] });
    k.box(0.08, 0.08, T, P.timber, { at: [s * (W / 2 + 0.45), top + 0.85, T / 2] });
  }
  for (let i = 0; i < 2; i++) k.box(3.2, 0.18, 0.4, P.flagstone, { at: [0, top - 0.18 * (i + 1) + 0.09, T + 0.2 + i * 0.4] });
  // A path of flags out to the front, between the beds.
  k.box(2.4, 0.06, C.front - T - 0.6, P.flagstone, { at: [0, 0.02, (T + C.front) / 2 + 0.3] });
  // Benches on the terrace, looking out.
  for (const x of [-5.5, 5.5]) {
    k.place(x, top, T - 1.2, 0);
    PIECES.bench(k);
  }
  k.place(0, 0, 0, 0);
  // Flower beds edged with box hedges, either side of the path.
  flowerBed(k, -W / 2 + 0.5, T + 0.9, -1.8, C.front - 0.4, 0.05, seed, high);
  flowerBed(k, 1.8, T + 0.9, W / 2 - 0.5, C.front - 0.4, 0.05, seed + 1, high);
  // A bag stand beside the terrace: a timber rack, a few bags leaning in it.
  k.box(2.2, 0.08, 0.5, P.timber, { at: [W / 2 + 2, 0.75, 1] });
  for (const x of [-1, 1]) k.box(0.08, 0.8, 0.5, P.timber, { at: [W / 2 + 2 + x, 0.4, 1] });
  P.bags.slice(0, 3).forEach((c, i) => {
    k.cyl(0.13, 0.13, 0.95, 8, c, { at: [W / 2 + 1.3 + i * 0.7, 0.55, 1.15], tilt: [-0.22, 0] });
    k.cyl(0.14, 0.14, 0.1, 8, P.paint, { at: [W / 2 + 1.3 + i * 0.7, 1.02, 1.05], tilt: [-0.22, 0] });
  });
  // The flagpole, its finial; the board's posts and frame.
  const fx = -W / 2 - 2.5;
  const fz = T - 0.5;
  k.cyl(0.045, 0.075, C.flag + sunk, 8, P.pole, { at: [fx, (C.flag - sunk) / 2, fz] });
  k.add(new THREE.SphereGeometry(0.1, 8, 4), P.paint, { at: [fx, C.flag + 0.05, fz] });
  const BW = 2.6;
  const BH = 0.9;
  const bx = W / 2 + 1.5;
  const bz = C.front - 1;
  if (board) {
    for (const x of [-BW * 0.38, BW * 0.38]) k.box(0.1, 1.7 + sunk, 0.1, P.timber, { at: [bx + x, (1.7 - sunk) / 2, bz - 0.1] });
    k.box(BW + 0.1, BH + 0.1, 0.07, P.signBoard, { at: [bx, 0.75 + BH / 2, bz - 0.02] });
    k.box(BW + 0.2, 0.05, 0.2, P.timberGrain, { at: [bx, 0.75 + BH + 0.08, bz - 0.06] });
  }
  const group = new THREE.Group();
  const body = k.mesh();
  body.castShadow = cast;
  body.receiveShadow = true;
  group.add(body);
  if (board) {
    const face = boardFace(board, BW, BH);
    face.position.set(bx, 0.75 + BH / 2, bz + 0.02);
    group.add(face);
  }
  // The club's flag: a flag's cloth (scenery.js makeFlag) on this pole,
  // without its own pole, and with no painted shadow (it flies high, far
  // from the ground).
  const flag = makeFlag({ color: P.clubFlag, height: 2.3 });
  for (const o of [...flag.children]) if (o !== flag.userData.flag) flag.remove(o);
  const scale = 3.2;
  flag.scale.setScalar(scale);
  flag.position.set(fx, C.flag - 2.3 * scale + 0.1, fz);
  group.add(flag);
  if (painted) {
    const sh = paintedShadow(W + 4, D + T + 3, C.ridge, 0);
    // (In the group's own frame: the sun's offset turned back by its turn.)
    const [ox, oz] = sh.userData.offset;
    const c = Math.cos(-turn);
    const s = Math.sin(-turn);
    sh.position.set(ox * c + oz * s, 0.05, (T - D) / 2 - ox * s + oz * c);
    group.add(sh);
  }
  group.rotation.y = turn;
  return group;
}

// ---- Buildings on a course from a map ------------------------------------------------

// Window bands worked out in the shader, on the walls only: each wall
// carries (along it, up from its foot, its length, its eaves) and gets
// rows of deep blue-grey panes, a bay every 3 m or so, a floor every 3 m,
// none within a metre of a corner or under the eaves. No textures, no
// extra geometry.
const WINDOW_CHUNK = `
  if (vWin.y > -10.0 && vWin.z > 2.5) {
    float bays = max(1.0, floor(vWin.z / 3.2));
    float fx = fract(vWin.x / (vWin.z / bays));
    float fy = fract(vWin.y / 3.0);
    float pane = step(0.3, fx) * step(fx, 0.7) * step(0.32, fy) * step(fy, 0.78)
      * step(0.6, vWin.y) * step(vWin.y, vWin.w - 0.5);
    diffuseColor.rgb = mix(diffuseColor.rgb, WINDOW_COLOUR, pane);
  }
`;
let buildingMat = null;
function buildingMaterial() {
  if (buildingMat) return buildingMat;
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  const c = new THREE.Color(P.window);
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec4 win;\nvarying vec4 vWin;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvWin = win;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec4 vWin;\nconst vec3 WINDOW_COLOUR = vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)});`)
      .replace("#include <color_fragment>", `#include <color_fragment>\n${WINDOW_CHUNK}`);
  };
  m.customProgramCacheKey = () => "buildings-v1";
  buildingMat = withSceneryHooks(m, "sign");
  return buildingMat;
}

// A mapped hole's buildings (sim/buildings.mjs raiseBuildings), in the
// hole's frame; groundAt(x, z) the ground's height there. One mesh for
// all their walls and roofs, one for their painted shadows (they cast
// nothing into the sun's map, so it's never widened). The group carries
// what the chase camera keeps clear of (view.js keepClear). Null if none.
export function makeBuildings(raised, groundAt) {
  if (!raised?.length) return null;
  const pos = [];
  const col = [];
  const win = [];
  const shadow = [];
  const keep = [];
  const NOWIN = [0, -100, 0, 0];
  const tri = (a, b, c, hex, w = [NOWIN, NOWIN, NOWIN], out = null) => {
    // Wound to face `out` (a direction), whichever way the corners came.
    if (out) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
      const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
      if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] < 0) {
        [b, c] = [c, b];
        w = [w[0], w[2], w[1]];
      }
    }
    const k = new THREE.Color(P[hex] ?? hex);
    for (const p of [a, b, c]) {
      pos.push(...p);
      col.push(k.r, k.g, k.b);
    }
    for (const q of w) win.push(...q);
  };
  const quad = (a, b, c, d, hex, w, out) => {
    tri(a, b, c, hex, w ? [w[0], w[1], w[2]] : undefined, out);
    tri(a, c, d, hex, w ? [w[0], w[2], w[3]] : undefined, out);
  };
  for (const b of raised) {
    // Hole frame -> world: (x, z) -> (z, -x).
    const poly = b.poly.map(([x, z]) => [z, -x]);
    const base = Math.min(...b.poly.map(([x, z]) => groundAt(x, z)));
    const foot = base - 1.5;
    const top = base + (b.roof === "flat" ? b.ridge : b.eaves);
    const eaves = top - base;
    // Its outline's winding, for the walls' outward side.
    let area = 0;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) area += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1];
    const turn = area > 0 ? 1 : -1;
    for (let i = 0; i < poly.length; i++) {
      const [x0, z0] = poly[i];
      const [x1, z1] = poly[(i + 1) % poly.length];
      const len = Math.hypot(x1 - x0, z1 - z0);
      if (len < 0.05) continue;
      const out = [((z1 - z0) / len) * -turn, 0, ((x1 - x0) / len) * turn];
      quad([x0, foot, z0], [x1, foot, z1], [x1, top, z1], [x0, top, z0], b.walls, [
        [0, -1.5, len, eaves],
        [len, -1.5, len, eaves],
        [len, eaves, len, eaves],
        [0, eaves, len, eaves],
      ], out);
    }
    // The roof, over the outline's box (in the world: the hole frame's box
    // turned the same way).
    const bx = b.box;
    const [cx, cz] = [bx.cz, -bx.cx];
    const [ax, az] = [bx.az, -bx.ax];
    const [vx, vz] = [-az, ax];
    const hl = bx.length / 2;
    const hw = bx.width / 2;
    const at = (u, v, y) => [cx + ax * u + vx * v, y, cz + az * u + vz * v];
    const up = [0, 1, 0];
    if (b.roof === "flat") {
      const tris = THREE.ShapeUtils.triangulateShape(poly.map(([x, z]) => new THREE.Vector2(x, z)), []);
      for (const [i, j, k] of tris) tri([poly[i][0], top, poly[i][1]], [poly[j][0], top, poly[j][1]], [poly[k][0], top, poly[k][1]], b.roofColour, undefined, up);
    } else {
      const o = 0.35;
      const ridgeY = base + b.ridge;
      const eaveY = top - o * ROOF_PITCH_LOOK;
      const L2 = hl + o;
      const W2 = hw + o;
      if (b.roof === "pitched") {
        for (const s of [1, -1]) quad(at(-L2, s * W2, eaveY), at(L2, s * W2, eaveY), at(L2, 0, ridgeY), at(-L2, 0, ridgeY), b.roofColour, null, [vx * s, 1, vz * s]);
        // The gables, in the walls' colour.
        for (const s of [1, -1]) tri(at(s * hl, -hw, top), at(s * hl, hw, top), at(s * hl, 0, ridgeY), b.walls, undefined, [ax * s, 0, az * s]);
      } else {
        // Hipped: a ridge along the middle, short of each end by the half-width.
        const r = Math.max(0, hl - hw);
        for (const s of [1, -1]) {
          quad(at(-L2, s * W2, eaveY), at(L2, s * W2, eaveY), at(r, 0, ridgeY), at(-r, 0, ridgeY), b.roofColour, null, [vx * s, 1, vz * s]);
          tri(at(s * L2, -W2, eaveY), at(s * L2, W2, eaveY), at(s * r, 0, ridgeY), b.roofColour, undefined, [ax * s, 1, az * s]);
        }
      }
    }
    // Its painted shadow: the box, a little bigger, pushed away from the sun.
    const k = (b.ridge * 0.45) / Math.max(SUN.y, 0.2);
    const [ox, oz] = [-SUN.x * k, -SUN.z * k];
    const sq = [[-hl - 1, -hw - 1], [hl + 1, -hw - 1], [hl + 1, hw + 1], [-hl - 1, hw + 1]].map(([u, v]) => at(u, v, 0));
    shadow.push({ pts: sq.map(([x, , z]) => [x + ox, z + oz]) });
    keep.push(...footprintClear(poly, base + b.ridge));
  }
  const group = new THREE.Group();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  geo.setAttribute("win", new THREE.Float32BufferAttribute(win, 4));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, buildingMaterial());
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  group.add(mesh);
  // The painted shadows, one mesh.
  const sp = [];
  const uv = [];
  for (const { pts } of shadow) {
    const [a, b, c, d] = pts;
    for (const [p, t] of [[a, [0, 0]], [b, [1, 0]], [c, [1, 1]], [a, [0, 0]], [c, [1, 1]], [d, [0, 1]]]) {
      // (On the ground at each corner: world (x, z) is (-z, x) in the hole.)
      sp.push(p[0], groundAt(-p[1], p[0]) + 0.05, p[1]);
      uv.push(...t);
    }
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
  sg.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  const painted = new THREE.Mesh(sg, paintedShadowMaterial());
  painted.renderOrder = 2;
  group.add(painted);
  group.userData.keepClear = keep;
  return group;
}
// How far an eave drops over its overhang, per metre (the roof's pitch).
const ROOF_PITCH_LOOK = 0.7;

// ---- The range as a practice ground -----------------------------------------------------

// The ball-stop netting: fine grey-green mesh, never white, see-through;
// on High a fine weave is drawn in the shader, on Standard it's a plain
// tint. It fades out as the camera comes near (sim/furniture.mjs netFade:
// gone inside 15 m, whole from 40 m), worked out per pixel from the
// camera's distance, so nothing swells up across the chase camera's
// picture and the processor does nothing each frame. It casts no shadow.
function netMaterial(high) {
  const m = new THREE.MeshBasicMaterial({ color: P.net, transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide });
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vNetWorld;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvNetWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vNetWorld;")
      .replace(
        "#include <alphatest_fragment>",
        `#include <alphatest_fragment>
        {
          float d = distance(cameraPosition, vNetWorld);
          float k = clamp((d - ${NET_FADE.near.toFixed(1)}) / ${(NET_FADE.far - NET_FADE.near).toFixed(1)}, 0.0, 1.0);
          diffuseColor.a *= k * k * (3.0 - 2.0 * k);
          ${
            high
              ? `// The weave: 10 cm squares, faded to the plain tint where they'd shimmer.
          vec2 cell = vec2(vNetWorld.x + vNetWorld.z, vNetWorld.y) / 0.1;
          vec2 w = fwidth(cell);
          vec2 g = abs(fract(cell) - 0.5) / max(w, vec2(1e-4));
          float line = 1.0 - clamp(min(g.x, g.y) - 0.5, 0.0, 1.0);
          float far = clamp(max(w.x, w.y) * 2.0 - 0.5, 0.0, 1.0);
          diffuseColor.a *= mix(0.35 + 0.9 * line, 1.0, far);`
              : ""
          }
        }`,
      );
  };
  m.customProgramCacheKey = () => `net-v1-${high ? "high" : "plain"}`;
  // Its node version on WebGPURenderer (look/nodetwins.js).
  return markTwin(m, "net", { high, fade: NET_FADE });
}

// Raised ground: the target greens' banks and the far end's mound, one
// mesh in the range's grass. banks: [{ x, z, reach, height(dx, dz) }] -
// a square of ground round (x, z), `reach` either way, at height(dx, dz);
// where that's nothing it dips just under the fairway, and ground wholly
// outside is left out.
export function makeBanks(banks, material, cell = 0.8) {
  const pos = [];
  for (const b of banks) {
    const n = Math.ceil((2 * b.reach) / cell);
    const step = (2 * b.reach) / n;
    const hx = b.halfX ?? b.reach;
    const nx = Math.ceil((2 * hx) / cell);
    const sx = (2 * hx) / nx;
    const h = [];
    for (let j = 0; j <= n; j++) for (let i = 0; i <= nx; i++) h.push(b.height(-hx + i * sx, -b.reach + j * step));
    const at = (i, j) => [b.x - hx + i * sx, h[j * (nx + 1) + i] > 0.001 ? h[j * (nx + 1) + i] : -0.05, b.z - b.reach + j * step];
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < nx; i++) {
        const k = [h[j * (nx + 1) + i], h[j * (nx + 1) + i + 1], h[(j + 1) * (nx + 1) + i], h[(j + 1) * (nx + 1) + i + 1]];
        if (Math.max(...k) <= 0.001) continue;
        const [a, c, d, e] = [at(i, j), at(i + 1, j), at(i, j + 1), at(i + 1, j + 1)];
        pos.push(...a, ...d, ...c, ...c, ...d, ...e);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  const merged = mergeVertices(geo);
  merged.computeVertexNormals();
  const mesh = new THREE.Mesh(merged, material);
  mesh.receiveShadow = true;
  return mesh;
}

// The range's practice-ground props (sim/furniture.mjs): the ball-stop
// poles (one instanced draw; they don't move, so they cast into the map),
// the netting between them (one draw, no shadow), and the bay dividers
// and the parked ball-picker (one merged draw, casting).
export function makePracticeGround({ poles, nets, dividers, picker, high = true }) {
  const group = new THREE.Group();
  const pole = new THREE.CylinderGeometry(0.07, 0.1, 1, 6).translate(0, 0.5, 0);
  const pm = new THREE.InstancedMesh(pole, withSceneryHooks(new THREE.MeshLambertMaterial({ color: P.netPole }), "sign"), poles.length);
  const m = new THREE.Matrix4();
  poles.forEach(([x, z, h, y = 0], i) => pm.setMatrixAt(i, m.makeScale(1, h + 1, 1).setPosition(x, y - 1, z)));
  pm.castShadow = true;
  pm.receiveShadow = true;
  pm.computeBoundingSphere();
  group.add(pm);
  // The netting: a sheet between each pair of poles, from NET_FROM to just
  // under their tops (each on the ground at its ends).
  const pos = [];
  for (const [[x0, z0, y0 = 0], [x1, z1, y1 = 0]] of nets) {
    const top = POLE_HIGH - 0.3;
    const a = [x0, y0 + NET_FROM, z0];
    const b = [x1, y1 + NET_FROM, z1];
    const c = [x1, y1 + top, z1];
    const d = [x0, y0 + top, z0];
    pos.push(...a, ...b, ...c, ...a, ...c, ...d);
  }
  const ng = new THREE.BufferGeometry();
  ng.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  const net = new THREE.Mesh(ng, netMaterial(high));
  net.renderOrder = 1;
  group.add(net);
  // The dividers: a timber frame with boarded sides, low enough to see
  // over.
  const k = new Kit();
  for (const x of dividers.at) {
    k.place(x, 0, 0, 0);
    const len = dividers.z1 - dividers.z0;
    const mid = (dividers.z0 + dividers.z1) / 2;
    k.box(0.06, dividers.high - 0.15, len - 0.1, P.timberWeathered, { at: [0, (dividers.high - 0.15) / 2 + 0.05, mid] });
    k.box(0.1, 0.06, len + 0.1, P.timber, { at: [0, dividers.high, mid] });
    for (const z of [dividers.z0, dividers.z1]) k.box(0.1, dividers.high, 0.1, P.timber, { at: [0, dividers.high / 2, z] });
  }
  // The ball-picker: a little utility tractor with a cage over its seat,
  // a gang of picker discs behind it.
  const [px, pz] = picker.at;
  k.place(px, 0, pz, picker.turn);
  k.box(1.3, 0.7, 2.2, P.signBoard, { at: [0, 0.75, 0] });
  k.box(1.25, 0.5, 0.9, P.signBoard, { at: [0, 1.0, -0.7] });
  k.box(0.8, 0.12, 0.6, P.timberGrain, { at: [0, 1.15, 0.45] });
  for (const [x, z] of [[-0.6, -0.4], [0.6, -0.4], [-0.6, 1.0], [0.6, 1.0]]) k.box(0.06, 1.6, 0.06, P.metal, { at: [x, 1.9, z + 0.3] });
  k.box(1.4, 0.06, 1.6, P.metal, { at: [0, 2.7, 0.6] });
  for (const [x, z, r] of [[-0.72, -0.75, 0.33], [0.72, -0.75, 0.33], [-0.72, 0.8, 0.4], [0.72, 0.8, 0.4]]) k.cyl(r, r, 0.26, 10, P.tyre, { at: [x, r, z], tilt: [0, Math.PI / 2] });
  k.box(3.2, 0.08, 0.1, P.metal, { at: [0, 0.45, 1.8] });
  for (let i = 0; i < 6; i++) k.cyl(0.24, 0.24, 0.36, 8, P.pickerGang, { at: [-1.3 + i * 0.52, 0.24, 2.3], tilt: [0, Math.PI / 2] });
  const props = k.mesh();
  props.castShadow = true;
  props.receiveShadow = true;
  group.add(props);
  return group;
}
