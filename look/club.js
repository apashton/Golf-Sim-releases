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
import { CLUBHOUSE, footprintClear, outlineWalls, seenFrom, roofAt } from "../sim/buildings.mjs";
import { NET_FADE, NET_FROM, POLE_HIGH } from "../sim/furniture.mjs";
import { insidePolygon } from "../sim/terrain.mjs";

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

// What a building's faces are, for the shader (the `face` attribute): a
// plain colour; a wall with windows in it, under eaves; a wall with none; a
// roof; a mansard's slope with dormers in it; a wall with windows and no
// eaves over it (a pitched roof's gable end); a hall's wall (a kirk's: the
// look's `hall`), its windows tall and round-headed.
const FACE = { plain: 0, wall: 1, blank: 2, slate: 3, mansard: 4, end: 5, hall: 6 };

// Walls, windows, doors and roofs worked out in the shader - no textures,
// no extra geometry. Each face carries where a spot is on it (`win`:
// metres along it, metres up from its foot, its length, how high its
// windows may reach), what it is (FACE) and its building's own number
// (`seed`, 0 - 1: its door's colour).
// (The owner, 23 November 2026, of Saltpine Links' village: "detail and
// textures need improvement".)
// A wall is harled where it's pale - a rough-cast render, flecked and
// weathered, with dressed stone quoins at its corners (long and short in
// turn) and a dark painted base course along its foot - and otherwise
// coursed rubble: rows of uneven height, stones of uneven length, a touch
// lighter or darker each, with the mortar between them. Both go to a
// plain tone by the time a stone is under a pixel. Under eaves, the
// eaves' shadow along its top.
// Its windows are as the photographs of a Scottish town show them from a
// links (docs/REAL-COURSES.md, "Buildings"): tall sashes, taller than
// wide, a floor every 3.2 m and a bay every 2.8 m or so - a low cottage's
// shorter, in its one storey - each in a pale surround on a stone sill,
// two panes over two, its glass the grey of the sky it reflects: light
// against the wall, not dark holes in it. Under eaves, the middle bay of a
// wall 5 m or longer has the door: panelled, in the house's own colour, in
// a pale surround with a fanlight over it where the wall's tall enough.
// A roof is slate where it's grey - thin courses, slate by slate a little
// apart in tone - and pantiles where it's red: rolls across it, each lit
// on one side and shaded on the other, laid in courses up it. A mansard's
// slope has a dormer over each bay.
const FACADE_CHUNK = /* glsl */ `
  {
    float kind = floor(vFace + 0.5);
    // (Metres to a pixel here, near enough.)
    float px = max(fwidth(vWin.x) + fwidth(vWin.y), 1e-4);
    float soft = px * 0.6 + 0.01;
    float fine = 1.0 - smoothstep(0.06, 0.3, px);
    float near = 1.0 - smoothstep(0.02, 0.08, px);
    vec3 own = diffuseColor.rgb;
    float lum = dot(own, vec3(0.2126, 0.7152, 0.0722));
    if (kind == 1.0 || kind == 2.0 || kind == 5.0 || kind == 6.0) {
      float harl = smoothstep(0.5, 0.62, lum);
      // Coursed rubble: each row its own height, each stone its own length.
      float row = floor(vWin.y / 0.3);
      float rowH = 0.3;
      float len = 0.42 + 0.42 * bHash(vec2(row, 7.0));
      float off = bHash(vec2(row, 3.0));
      float sx = vWin.x / len + off;
      vec2 stoneAt = vec2(floor(sx), row);
      float tone = bHash(stoneAt) - 0.5;
      float jx = min(fract(sx), 1.0 - fract(sx)) * len;
      float jy = min(fract(vWin.y / rowH), 1.0 - fract(vWin.y / rowH)) * rowH;
      float mortar = max(1.0 - smoothstep(0.012, 0.012 + soft, jx), 1.0 - smoothstep(0.012, 0.012 + soft, jy));
      float stone = 1.0 + tone * 0.16 * fine + mortar * 0.14 * fine;
      // Harl: flecks, and broad weathering.
      float fleck = bHash(floor(vWin.xy / 0.045)) - 0.5;
      float patchy = bNoise(vWin.xy / 2.6) - 0.5;
      float render = 1.0 + fleck * 0.07 * near + patchy * 0.07;
      vec3 c = own * mix(stone * (1.0 + patchy * 0.09), render, harl);
      // (Each house a touch warmer or cooler than the next.)
      c *= vec3(1.0 + (vSeed - 0.5) * 0.06, 1.0, 1.0 - (vSeed - 0.5) * 0.06);
      // (Darker at its foot, where the weather splashes it.)
      c *= 0.9 + 0.1 * smoothstep(-1.0, 1.4, vWin.y);
      // A harled wall's quoins, its corners up to its eaves: long and short in turn.
      float ends = min(vWin.x, vWin.z - vWin.x);
      float qRow = floor(vWin.y / 0.3);
      float qLen = mod(qRow, 2.0) < 0.5 ? 0.56 : 0.32;
      float quoin = harl * (1.0 - smoothstep(qLen - soft, qLen + soft, ends)) * step(0.35, vWin.y) * (1.0 - smoothstep(vWin.w - soft, vWin.w + soft, vWin.y)) * step(0.5, vWin.w) * step(2.0, vWin.z);
      float qJoint = 1.0 - smoothstep(0.012, 0.012 + soft, min(fract(vWin.y / 0.3), 1.0 - fract(vWin.y / 0.3)) * 0.3);
      c = mix(c, DRESSED * (1.0 + (bHash(vec2(qRow, 11.0)) - 0.5) * 0.1 * fine) * (1.0 - qJoint * 0.12 * fine), quoin);
      // Its painted base course.
      c = mix(c, BASE_COURSE, harl * (1.0 - smoothstep(0.35 - soft, 0.35 + soft, vWin.y)));
      // The eaves' shadow along a wall's top.
      if (kind == 1.0) c *= 1.0 - 0.26 * smoothstep(vWin.w - 0.45, vWin.w, vWin.y) * step(0.5, vWin.w);
      diffuseColor.rgb = c;
    }
    if ((kind == 1.0 || kind == 5.0) && vWin.z > 2.2) {
      float h = vWin.w;
      // A low wall's one storey: shorter sashes in it.
      float low = step(h, 3.1);
      float floors = low > 0.5 ? 1.0 : max(1.0, floor((h - 0.5) / 3.2));
      float bays = max(1.0, floor(vWin.z / mix(2.8, 2.6, low)));
      float bay = vWin.z / bays;
      float bx = vWin.x / bay;
      float which = floor(bx);
      float fx = abs(fract(bx) - 0.5) * bay;
      float fl = floor(vWin.y / 3.2);
      float fy = vWin.y - fl * 3.2;
      float y0 = mix(0.95, 0.8, low);
      float y1 = mix(2.8, min(2.15, h - 0.45), low);
      float hw = mix(0.55, 0.45, low);
      float here = step(0.0, vWin.y) * step(fl, floors - 0.5) * step(2.4, h);
      float door = (kind == 1.0 && vWin.z >= 5.0 && fl < 0.5 && abs(which - floor(bays * 0.5)) < 0.5) ? here : 0.0;
      if (door > 0.5) {
        float top = min(2.15, h - 0.5);
        float fan = step(3.1, h);
        float inD = (1.0 - smoothstep(0.48 - soft, 0.48 + soft, fx)) * (1.0 - smoothstep(top - soft, top + soft, vWin.y));
        float outD = (1.0 - smoothstep(0.62 - soft, 0.62 + soft, fx)) * (1.0 - smoothstep(top + 0.14 + fan * 0.36 - soft, top + 0.14 + fan * 0.36 + soft, vWin.y));
        float light = fan * (1.0 - smoothstep(0.42 - soft, 0.42 + soft, fx)) * smoothstep(top + 0.1 - soft, top + 0.1 + soft, vWin.y) * (1.0 - smoothstep(top + 0.44 - soft, top + 0.44 + soft, vWin.y));
        vec3 paint = DOOR_COLOURS[int(clamp(floor(vSeed * 6.0), 0.0, 5.0))];
        // (Its panels: a stile down its middle, a rail across.)
        float panels = max(1.0 - smoothstep(0.03, 0.03 + soft, fx), 1.0 - smoothstep(0.03, 0.03 + soft, abs(vWin.y - top * 0.55)));
        paint *= 1.0 - panels * 0.3 * fine;
        diffuseColor.rgb = mix(diffuseColor.rgb, FRAME_COLOUR, outD * (1.0 - inD) * 0.85);
        diffuseColor.rgb = mix(diffuseColor.rgb, paint, inD);
        diffuseColor.rgb = mix(diffuseColor.rgb, GLASS_LOW, light);
      } else {
        float inX = 1.0 - smoothstep(hw - soft, hw + soft, fx);
        float inY = smoothstep(y0 - soft, y0 + soft, fy) * (1.0 - smoothstep(y1 - soft, y1 + soft, fy));
        float outX = 1.0 - smoothstep(hw + 0.16 - soft, hw + 0.16 + soft, fx);
        float outY = smoothstep(y0 - 0.16 - soft, y0 - 0.16 + soft, fy) * (1.0 - smoothstep(y1 + 0.16 - soft, y1 + 0.16 + soft, fy));
        float sillX = 1.0 - smoothstep(hw + 0.24 - soft, hw + 0.24 + soft, fx);
        float sillY = smoothstep(y0 - 0.26 - soft, y0 - 0.26 + soft, fy) * (1.0 - smoothstep(y0 - 0.14 - soft, y0 - 0.14 + soft, fy));
        float glass = inX * inY * here;
        // Two panes over two: the meeting rail, and a bar down the middle.
        // (Not small panes: rows of them read as an office block.)
        float mid = (y0 + y1) * 0.5;
        float bars = max(1.0 - smoothstep(0.035, 0.035 + soft, abs(fy - mid)), 1.0 - smoothstep(0.02, 0.02 + soft, fx));
        vec3 pane = mix(GLASS_LOW, GLASS_HIGH, smoothstep(y0, y1, fy));
        pane = mix(pane, FRAME_COLOUR, bars * fine);
        diffuseColor.rgb = mix(diffuseColor.rgb, DRESSED, sillX * sillY * here);
        diffuseColor.rgb = mix(diffuseColor.rgb, FRAME_COLOUR, outX * outY * here * 0.8);
        diffuseColor.rgb = mix(diffuseColor.rgb, pane, glass);
      }
    }
    if (kind == 6.0 && vWin.z > 2.2 && vWin.w > 4.0) {
      // A hall's windows: tall and round-headed, one storey, a bay every
      // 3.6 m, in dressed stone, leaded with a mullion and a transom.
      float bays = max(1.0, floor(vWin.z / 3.6));
      float bay = vWin.z / bays;
      float fx = abs(fract(vWin.x / bay) - 0.5) * bay;
      float hw = 0.5;
      float y0 = 1.4;
      float spring = vWin.w - 1.2 - hw;
      float up = max(vWin.y - spring, 0.0);
      float below = 1.0 - step(spring, vWin.y);
      float glass = max((1.0 - smoothstep(hw - soft, hw + soft, fx)) * smoothstep(y0 - soft, y0 + soft, vWin.y) * below, (1.0 - below) * (1.0 - smoothstep(hw - soft, hw + soft, length(vec2(fx, up)))));
      float edge = max((1.0 - smoothstep(hw + 0.18 - soft, hw + 0.18 + soft, fx)) * smoothstep(y0 - 0.22 - soft, y0 - 0.22 + soft, vWin.y) * below, (1.0 - below) * (1.0 - smoothstep(hw + 0.18 - soft, hw + 0.18 + soft, length(vec2(fx, up)))));
      float lead = max(1.0 - smoothstep(0.025, 0.025 + soft, fx), 1.0 - smoothstep(0.025, 0.025 + soft, abs(vWin.y - (y0 + spring) * 0.5)));
      vec3 pane = mix(GLASS_LOW, GLASS_HIGH, smoothstep(y0, spring + hw, vWin.y));
      pane = mix(pane, FRAME_COLOUR * 0.55, lead * fine);
      diffuseColor.rgb = mix(diffuseColor.rgb, DRESSED, edge * (1.0 - glass));
      diffuseColor.rgb = mix(diffuseColor.rgb, pane, glass);
    }
    if (kind == 3.0 || kind == 4.0) {
      // Slate: thin courses, slate by slate a little apart in tone.
      float course = floor(vWin.y / 0.26);
      float slate = bHash(vec2(floor(vWin.x / 0.3 + mod(course, 2.0) * 0.5), course)) - 0.5;
      float lap = 1.0 - smoothstep(0.0, 0.07, fract(vWin.y / 0.26));
      float patchy = bNoise(vWin.xy / 3.1) - 0.5;
      float slates = 1.0 + slate * 0.12 * fine - lap * 0.14 * fine + patchy * 0.08;
      // Pantiles: a roll every 0.33 m across, lit on one side and shaded on
      // the other; courses of 0.36 m up the slope, each tile a little apart.
      float red = smoothstep(1.3, 1.7, own.r / max(own.g, 0.01));
      float roll = fract(vWin.x / 0.33);
      float tcourse = floor(vWin.y / 0.36);
      float tile = bHash(vec2(floor(vWin.x / 0.33), tcourse)) - 0.5;
      float rolls = 1.0 - smoothstep(0.1, 0.45, px);
      float tlap = 1.0 - smoothstep(0.0, 0.12, fract(vWin.y / 0.36));
      // (Lit up one side of the roll, in shade down the other, darkest in the trough.)
      float shape = 0.24 * sin(6.2832 * roll) - 0.12 * (1.0 - smoothstep(0.0, 0.18, min(roll, 1.0 - roll)));
      float weathered = bNoise(vWin.xy / 1.4) - 0.5;
      float tiles = 1.0 + shape * rolls + tile * 0.16 * fine - tlap * 0.16 * fine + patchy * 0.12 + weathered * 0.08;
      // (And a slate a little greener where it's weathered: lichen.)
      vec3 lichen = mix(vec3(1.0), vec3(0.96, 1.03, 0.92), smoothstep(0.1, 0.4, weathered) * (1.0 - red));
      diffuseColor.rgb *= mix(slates, tiles, red) * lichen;
      // The gutter along its eaves: a dark line.
      diffuseColor.rgb *= 1.0 - 0.45 * (1.0 - smoothstep(0.08, 0.08 + soft, vWin.y)) * step(kind, 3.5);
    }
    if (kind == 4.0 && vWin.z > 2.2) {
      // A dormer over each bay: its front the wall's pale, a sash in it.
      float bays = max(1.0, floor(vWin.z / 2.8));
      float bay = vWin.z / bays;
      float fx = abs(fract(vWin.x / bay) - 0.5) * bay;
      float top = vWin.w - 0.45;
      float inX = 1.0 - smoothstep(0.5 - soft, 0.5 + soft, fx);
      float inY = smoothstep(0.4 - soft, 0.4 + soft, vWin.y) * (1.0 - smoothstep(top - soft, top + soft, vWin.y));
      float outX = 1.0 - smoothstep(0.7 - soft, 0.7 + soft, fx);
      float outY = smoothstep(0.22 - soft, 0.22 + soft, vWin.y) * (1.0 - smoothstep(top + 0.2 - soft, top + 0.2 + soft, vWin.y));
      vec3 pane = mix(GLASS_LOW, GLASS_HIGH, smoothstep(0.4, top, vWin.y));
      diffuseColor.rgb = mix(diffuseColor.rgb, FRAME_COLOUR, outX * outY * 0.85);
      diffuseColor.rgb = mix(diffuseColor.rgb, pane, inX * inY);
    }
  }
`;
const FACADE_COMMON = /* glsl */ `
  varying vec4 vWin;
  varying float vFace;
  varying float vSeed;
  float bHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float bNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(bHash(i), bHash(i + vec2(1.0, 0.0)), f.x), mix(bHash(i + vec2(0.0, 1.0)), bHash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
`;
let buildingMat = null;
function buildingMaterial() {
  if (buildingMat) return buildingMat;
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  const glsl = (hex) => {
    const c = new THREE.Color(hex);
    return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`;
  };
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec4 win;\nattribute float face;\nattribute float seed;\nvarying vec4 vWin;\nvarying float vFace;\nvarying float vSeed;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvWin = win;\nvFace = face;\nvSeed = seed;");
    const doors = `const vec3 DOOR_COLOURS[6] = vec3[6](${P.doors.map(glsl).join(", ")});`;
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${FACADE_COMMON}\nconst vec3 FRAME_COLOUR = ${glsl(P.windowFrame)};\nconst vec3 GLASS_LOW = ${glsl(P.window)};\nconst vec3 GLASS_HIGH = ${glsl(P.windowSky)};\nconst vec3 DRESSED = ${glsl(P.dressedStone)};\nconst vec3 BASE_COURSE = ${glsl(P.baseCourse)};\n${doors}`)
      .replace("#include <color_fragment>", `#include <color_fragment>\n${FACADE_CHUNK}`);
  };
  m.customProgramCacheKey = () => "buildings-v3";
  buildingMat = withSceneryHooks(m, "sign");
  return buildingMat;
}

// An outline drawn in by `d` metres all round (each corner along its
// mitre), for a mansard's top: [[x, z], ...] corner for corner - or null
// where that won't do (a corner too sharp, a side too short, the outline
// too thin to take it).
export function insetOutline(poly, d) {
  const n = poly.length;
  let area = 0;
  for (let i = 0, j = n - 1; i < n; j = i++) area += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1];
  if (Math.abs(area) < 8) return null;
  const turn = area > 0 ? 1 : -1;
  const out = [];
  for (let i = 0; i < n; i++) {
    const p = poly[(i + n - 1) % n];
    const v = poly[i];
    const q = poly[(i + 1) % n];
    const l1 = Math.hypot(v[0] - p[0], v[1] - p[1]);
    const l2 = Math.hypot(q[0] - v[0], q[1] - v[1]);
    if (l1 < 1e-6 || l2 < 1e-6) return null;
    // (Each side's way in: to the left as it runs, counter-clockwise.)
    const n1 = [(-(v[1] - p[1]) / l1) * turn, ((v[0] - p[0]) / l1) * turn];
    const n2 = [(-(q[1] - v[1]) / l2) * turn, ((q[0] - v[0]) / l2) * turn];
    const k = 1 + n1[0] * n2[0] + n1[1] * n2[1];
    if (k < 0.25) return null;
    out.push([v[0] + ((n1[0] + n2[0]) * d) / k, v[1] + ((n1[1] + n2[1]) * d) / k]);
  }
  let inner = 0;
  for (let i = 0, j = n - 1; i < n; j = i++) inner += out[j][0] * out[i][1] - out[i][0] * out[j][1];
  // (Still the same way round, and most of it left.)
  if (inner * turn <= 0 || Math.abs(inner) < Math.abs(area) * 0.35) return null;
  return out;
}

// A mansard: how deep its slate slope (m) on a flat-topped building `high`
// to its top, and how far it leans in - or null for one too low for it.
export const MANSARD = { least: 6.5, share: 0.26, low: 1.9, high: 2.7, lean: 0.85 };
export const mansardBand = (high) => (high >= MANSARD.least ? Math.min(MANSARD.high, Math.max(MANSARD.low, high * MANSARD.share)) : 0);

// Chimney stacks (the look's `chimneys`): on a roof at least `least` m
// up, one at each end of its ridge (a flat top's longer side) and one
// every `every` m or so between - a party wall a house; each `thick` m
// along the ridge, standing `over` m above it, with a pot every `pot` m.
export const CHIMNEYS = { least: 5.5, area: 30, every: 8.5, thick: 0.6, over: 1.25, pot: 0.62, potSize: 0.3, potHigh: 0.5, cope: 0.07, copeHigh: 0.12 };
// A pitched roof's finish (metres): flush with its gables (`flush` past
// the wall), with a skew up each - `wide` across, standing `proud` of the
// roof, its face `out` past the gable's and down it `drop` (so seen from an
// angle there's no sky between them) - and a ridge capping `cap` either
// side of the ridge, `capHigh` above it.
export const SKEW = { flush: 0, wide: 0.28, proud: 0.12, out: 0.03, drop: 0.3, cap: 0.16, capHigh: 0.09 };
// Dormers (the look's `dormers`): in a pitched roof with a storey in it -
// its ridge at least `rise` m over eaves no higher than `eaves` - one every
// `every` m or so along each slope, `in` m clear of each gable: its front
// `wide` across and `high` to its own eaves, standing `back` m in from the
// wall below, under a little gabled roof `peak` higher at its ridge; a
// window in its front, `frame` of frame round the glass.
export const DORMERS = { rise: 3.2, eaves: 3.8, every: 4.6, in: 2.4, wide: 1.9, high: 1.45, back: 1.1, peak: 0.75, frame: 0.16, sill: 0.3 };
// Whether a wall's colour is pale enough to be harled render (the shader's
// own test, on its linear brightness): its skews and copes dressed stone.
const harled = (hex) => {
  const c = new THREE.Color(P[hex] ?? hex);
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b > 0.56;
};
// A ridge's capping: its roof's colour, a shade darker.
const ridgeCap = (hex) => `#${new THREE.Color(P[hex] ?? hex).multiplyScalar(0.82).getHexString()}`;

// A mapped hole's buildings (sim/buildings.mjs raiseBuildings), in the
// hole's frame; groundAt(x, z) the ground's height there. One mesh for
// all their walls and roofs, one for their painted shadows (they cast
// nothing into the sun's map, so it's never widened). The group carries
// what the chase camera keeps clear of (view.js keepClear). Null if none.
// seenFrom: for buildings only ever looked at from one place - the ones
// beyond the hole's ground - the box they're seen from ({ x0, x1, z0, z1 },
// the hole's frame): only the walls and roof slopes that face it are
// built (sim/buildings.mjs seenFrom).
export function makeBuildings(raised, groundAt, { seenFrom: from = null } = {}) {
  if (!raised?.length) return null;
  // (The hole's frame -> the world: (x, z) -> (z, -x).)
  const eyes = from ? [[from.x0, from.z0], [from.x1, from.z0], [from.x1, from.z1], [from.x0, from.z1]].map(([x, z]) => [z, -x]) : null;
  // A face at world (x, z), facing (nx, nz): built unless nobody can see it.
  const shown = (x, z, nx, nz) => !eyes || seenFrom(eyes, [x, z], [nx, nz]);
  const pos = [];
  const col = [];
  const win = [];
  const face = [];
  const seeds = [];
  const shadow = [];
  const keep = [];
  const NOWIN = [0, 0, 0, 0];
  // (Each building's own number, 0 - 1, from where it stands: its door's colour.)
  let seed = 0;
  const tri = (a, b, c, hex, w = [NOWIN, NOWIN, NOWIN], out = null, kind = FACE.plain) => {
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
      face.push(kind);
      seeds.push(seed);
    }
    for (const q of w) win.push(...q);
  };
  const quad = (a, b, c, d, hex, w, out, kind) => {
    tri(a, b, c, hex, w ? [w[0], w[1], w[2]] : undefined, out, kind);
    tri(a, c, d, hex, w ? [w[0], w[2], w[3]] : undefined, out, kind);
  };
  // A box standing on (x, z) points a..d (a quad, round) from y0 to y1: its
  // four sides and its top.
  const box = (corners, y0, y1, hex, kind = FACE.blank) => {
    const mid = [corners.reduce((s, p) => s + p[0], 0) / 4, corners.reduce((s, p) => s + p[1], 0) / 4];
    for (let i = 0; i < 4; i++) {
      const p = corners[i];
      const q = corners[(i + 1) % 4];
      const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
      const out = [(p[0] + q[0]) / 2 - mid[0], 0, (p[1] + q[1]) / 2 - mid[1]];
      quad([p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y1, q[1]], [p[0], y1, p[1]], hex, [[0, 0, len, 0], [len, 0, len, 0], [len, y1 - y0, len, 0], [0, y1 - y0, len, 0]], out, kind);
    }
    quad([corners[0][0], y1, corners[0][1]], [corners[1][0], y1, corners[1][1]], [corners[2][0], y1, corners[2][1]], [corners[3][0], y1, corners[3][1]], hex, null, [0, 1, 0], FACE.plain);
  };
  for (const b of raised) {
    seed = (((Math.sin(b.box.cx * 12.9898 + b.box.cz * 78.233) * 43758.5453) % 1) + 1) % 1;
    // Hole frame -> world: (x, z) -> (z, -x).
    const poly = b.poly.map(([x, z]) => [z, -x]);
    const base = Math.min(...b.poly.map(([x, z]) => groundAt(x, z)));
    const foot = base - 1.5;
    const flat = b.roof === "flat";
    const top = base + (flat ? b.ridge : b.eaves);
    // A flat-topped one's mansard, where it's built with one: its top
    // storey a slate slope leaning in to a smaller flat top.
    let band = flat && b.mansard ? mansardBand(top - base) : 0;
    const inner = band ? insetOutline(poly, MANSARD.lean) : null;
    if (!inner) band = 0;
    const wallTop = top - band;
    const eaves = wallTop - base;
    const inOf = new Map(poly.map((p, i) => [p, inner?.[i]]));
    // Its walls, each facing out of it (sim/buildings.mjs outlineWalls).
    for (const wall of outlineWalls(poly)) {
      const [x0, z0] = wall.a;
      const [x1, z1] = wall.b;
      const len = wall.len;
      const out = [wall.out[0], 0, wall.out[1]];
      if (!shown((x0 + x1) / 2, (z0 + z1) / 2, out[0], out[2])) continue;
      // (A building with no windows - a shed, a hoarding: the look's
      // windows: false - gets plain walls. A pitched roof's gable end has
      // no eaves over it: no eaves' shadow, no door.)
      const across = Math.abs(((x1 - x0) * b.box.az - (z1 - z0) * b.box.ax) / Math.max(len, 1e-6));
      const kind = b.windows === false ? FACE.blank : b.hall ? FACE.hall : b.roof === "pitched" && across < 0.5 ? FACE.end : FACE.wall;
      quad([x0, foot, z0], [x1, foot, z1], [x1, wallTop, z1], [x0, wallTop, z0], b.walls, [[0, -1.5, len, eaves], [len, -1.5, len, eaves], [len, eaves, len, eaves], [0, eaves, len, eaves]], out, kind);
      if (band) {
        const ia = inOf.get(wall.a);
        const ib = inOf.get(wall.b);
        const slope = Math.hypot(band, MANSARD.lean);
        quad([x0, wallTop, z0], [x1, wallTop, z1], [ib[0], top, ib[1]], [ia[0], top, ia[1]], b.roofColour, [[0, 0, len, slope], [len, 0, len, slope], [len, slope, len, slope], [0, slope, len, slope]], [out[0], 0.4, out[2]], b.windows === false ? FACE.slate : FACE.mansard);
      }
      // ...and on up to the roof, where the roof passes over it. A sloping
      // roof is built over the outline's box, the walls along the outline
      // itself: a wall in from the box's edge stopped short of the roof,
      // with open air between (the owner, 21 November 2026: "still visible
      // gaps between the roof and front of the building"). In lengths of a
      // couple of metres, so it follows a ridge or a hip above it; an end
      // wall's is its gable.
      if (!flat) {
        const n = Math.max(1, Math.ceil(len / 2));
        const along = (t) => [x0 + (x1 - x0) * t, z0 + (z1 - z0) * t];
        // (The world's (x, z) is the hole frame's (-z, x), where roofAt asks.)
        const under = ([x, z]) => base + Math.max(eaves, roofAt(b, -z, x));
        for (let k = 0; k < n; k++) {
          const pa = along(k / n);
          const pb = along((k + 1) / n);
          const ya = under(pa);
          const yb = under(pb);
          if (ya - top < 0.02 && yb - top < 0.02) continue;
          const [ua, ub] = [(k / n) * len, ((k + 1) / n) * len];
          quad([pa[0], top, pa[1]], [pb[0], top, pb[1]], [pb[0], yb, pb[1]], [pa[0], ya, pa[1]], b.walls, [[ua, eaves, len, 0], [ub, eaves, len, 0], [ub, yb - base, len, 0], [ua, ya - base, len, 0]], out, FACE.blank);
        }
      }
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
    if (flat) {
      const cap = inner ?? poly;
      const tris = THREE.ShapeUtils.triangulateShape(cap.map(([x, z]) => new THREE.Vector2(x, z)), []);
      for (const [i, j, k] of tris) tri([cap[i][0], top, cap[i][1]], [cap[j][0], top, cap[j][1]], [cap[k][0], top, cap[k][1]], b.roofColour, undefined, up);
    } else {
      const o = 0.35;
      const ridgeY = base + b.ridge;
      const eaveY = top - o * ROOF_PITCH_LOOK;
      // (A pitched roof stops at its gables, finished with skews; a hipped
      // one overhangs all round.)
      const L2 = hl + (b.roof === "pitched" ? SKEW.flush : o);
      const W2 = hw + o;
      const rake = Math.hypot(W2, ridgeY - eaveY);
      // (Each slope and end only where it's seen from: `shown`.)
      const faces = (p, nx, nz) => shown(p[0], p[2], nx, nz);
      const side = (s) => faces(at(0, s * W2, 0), vx * s, vz * s);
      const end = (s, u) => faces(at(s * u, 0, 0), ax * s, az * s);
      // (Where a spot is on a slope: along its eaves, up its rake.)
      const slate = (u0, u1) => [[0, 0, 2 * L2, 0], [2 * L2, 0, 2 * L2, 0], [L2 + u1, rake, 2 * L2, 0], [L2 + u0, rake, 2 * L2, 0]];
      if (b.roof === "pitched") {
        for (const s of [1, -1]) if (side(s)) quad(at(-L2, s * W2, eaveY), at(L2, s * W2, eaveY), at(L2, 0, ridgeY), at(-L2, 0, ridgeY), b.roofColour, slate(-L2, L2), [vx * s, 1, vz * s], FACE.slate);
        // (Its gables are its end walls, run up to the roof above.) Along
        // each gable's top, a skew: a coping of dressed stone - or of the
        // wall's own stone where it isn't harled - standing proud of the
        // roof; along the ridge, its capping.
        const skew = harled(b.walls) ? "dressedStone" : b.walls;
        const roofAtV = (v) => eaveY + (ridgeY - eaveY) * (1 - Math.abs(v) / W2);
        for (const s of [1, -1]) {
          if (!end(s, L2)) continue;
          const [ui, uo] = [s * (hl - SKEW.wide), s * (hl + SKEW.out)];
          for (const [v0, v1] of [[-W2, 0], [0, W2]]) {
            const [y0, y1] = [roofAtV(v0) + SKEW.proud, roofAtV(v1) + SKEW.proud];
            quad(at(ui, v0, y0), at(uo, v0, y0), at(uo, v1, y1), at(ui, v1, y1), skew, null, [0, 1, 0], FACE.plain);
            quad(at(uo, v0, y0 - SKEW.proud - SKEW.drop), at(uo, v1, y1 - SKEW.proud - SKEW.drop), at(uo, v1, y1), at(uo, v0, y0), skew, null, [ax * s, 0, az * s], FACE.plain);
          }
        }
        // (The capping's feet on the slopes, a touch into them: no sky under it.)
        const cap = ridgeCap(b.roofColour);
        const capFoot = ridgeY - ((ridgeY - eaveY) * SKEW.cap) / W2 - 0.01;
        for (const s of [1, -1]) if (side(s)) quad(at(-L2, s * SKEW.cap, capFoot), at(L2, s * SKEW.cap, capFoot), at(L2, 0, ridgeY + SKEW.capHigh), at(-L2, 0, ridgeY + SKEW.capHigh), cap, null, [vx * s, 1, vz * s], FACE.plain);
      } else if (b.roof === "octagon") {
        // Tented: a slope up from each of its eight walls to a point over
        // its middle, overhanging them all round.
        const grow = (hl + o) / hl;
        const eave = poly.map(([x, z]) => [cx + (x - cx) * grow, eaveY, cz + (z - cz) * grow]);
        const tip = [cx, ridgeY, cz];
        for (let i = 0; i < eave.length; i++) {
          const p = eave[i];
          const q = eave[(i + 1) % eave.length];
          const [mx, mz] = [(p[0] + q[0]) / 2 - cx, (p[2] + q[2]) / 2 - cz];
          if (!shown(cx + mx, cz + mz, mx, mz)) continue;
          const len = Math.hypot(q[0] - p[0], q[2] - p[2]);
          const up8 = Math.hypot(Math.hypot(mx, mz), ridgeY - eaveY);
          const k = Math.hypot(mx, mz) || 1;
          tri(p, q, tip, b.roofColour, [[0, 0, len, 0], [len, 0, len, 0], [len / 2, up8, len, 0]], [mx / k, 1, mz / k], FACE.slate);
        }
      } else {
        // Hipped: a ridge along the middle, short of each end by the half-width.
        const r = Math.max(0, hl - hw);
        for (const s of [1, -1]) {
          if (side(s)) quad(at(-L2, s * W2, eaveY), at(L2, s * W2, eaveY), at(r, 0, ridgeY), at(-r, 0, ridgeY), b.roofColour, slate(-r, r), [vx * s, 1, vz * s], FACE.slate);
          if (end(s, L2)) tri(at(s * L2, -W2, eaveY), at(s * L2, W2, eaveY), at(s * r, 0, ridgeY), b.roofColour, [[0, 0, 2 * W2, 0], [2 * W2, 0, 2 * W2, 0], [W2, rake, 2 * W2, 0]], [ax * s, 1, az * s], FACE.slate);
        }
      }
      // Its dormers (the look's `dormers`), where a pitched roof has a
      // storey in it: along each slope that's seen, each a little gabled
      // box standing out of the tiles, its front set back from the wall
      // below, a window in it.
      if (b.dormers && b.roof === "pitched" && b.ridge - b.eaves >= DORMERS.rise && b.eaves <= DORMERS.eaves && hl > DORMERS.in + DORMERS.wide) {
        const D = DORMERS;
        const slope = (ridgeY - eaveY) / W2;
        const run = 2 * (hl - D.in);
        const count = Math.max(1, Math.round(run / D.every));
        const half = D.wide / 2;
        const tiles = ridgeCap(b.roofColour);
        for (const s of [1, -1]) {
          if (!side(s)) continue;
          const out = [vx * s, 0, vz * s];
          // (Its front v0 in from the wall; its own eaves and ridge; where
          // each meets the roof's slope behind it.)
          const v0 = hw - D.back;
          const roofY = (v) => eaveY + (W2 - v) * slope;
          const y0 = roofY(v0);
          const yE = y0 + D.high;
          const yR = yE + D.peak;
          const vE = Math.max(0.2, W2 - (yE - eaveY) / slope);
          const vR = Math.max(0.1, W2 - (yR - eaveY) / slope);
          for (let k = 0; k < count; k++) {
            const u = count === 1 ? 0 : -run / 2 + (run * (k + 0.5)) / count;
            const P = (du, v, y) => at(u + du, s * v, y);
            // Its front, and the gable over it.
            quad(P(-half, v0, y0 - 0.1), P(half, v0, y0 - 0.1), P(half, v0, yE), P(-half, v0, yE), b.walls, null, out, FACE.plain);
            tri(P(-half, v0, yE), P(half, v0, yE), P(0, v0, yR), b.walls, undefined, out, FACE.plain);
            // Its window: a pale frame, the glass a touch proud of it.
            const [f0, f1] = [y0 + D.sill, yE - 0.08];
            quad(P(-half + 0.22, v0 + 0.02, f0), P(half - 0.22, v0 + 0.02, f0), P(half - 0.22, v0 + 0.02, f1), P(-half + 0.22, v0 + 0.02, f1), "windowFrame", null, out, FACE.plain);
            quad(P(-half + 0.22 + D.frame, v0 + 0.04, f0 + D.frame), P(half - 0.22 - D.frame, v0 + 0.04, f0 + D.frame), P(half - 0.22 - D.frame, v0 + 0.04, f1 - D.frame), P(-half + 0.22 + D.frame, v0 + 0.04, f1 - D.frame), "window", null, out, FACE.plain);
            // Its cheeks, back to the slope.
            for (const e of [1, -1]) tri(P(e * half, v0, y0), P(e * half, v0, yE), P(e * half, vE, yE), b.walls, undefined, [ax * e, 0, az * e], FACE.plain);
            // Its own roof: two slopes from its ridge, a little over its front and cheeks.
            for (const e of [1, -1]) quad(P(e * (half + 0.12), v0 + 0.15, yE - 0.06), P(0, v0 + 0.15, yR), P(0, vR, yR), P(e * (half + 0.12), vE, yE - 0.06), tiles, null, [ax * e, 1.2, az * e], FACE.plain);
          }
        }
      }
    }
    // Its chimney stacks (the look's `chimneys`): across the ridge at each
    // end of it and at each party wall between, a row of pots on each.
    if (b.chimneys && b.windows !== false && b.ridge >= CHIMNEYS.least && b.area >= CHIMNEYS.area) {
      const C = CHIMNEYS;
      const reach = hl - C.thick / 2 - (flat ? 0.2 : 0.1);
      const count = Math.max(2, Math.round((2 * reach) / C.every) + 1);
      // (Across a flat top: a good part of its width; on a ridge, astride it.)
      const half = flat ? Math.min(1.6, Math.max(0.7, (hw - band * 0.4) * 0.5)) : Math.min(0.75, hw * 0.4);
      const y0 = flat ? top - 0.1 : base + b.ridge - 0.75;
      const y1 = (flat ? top : base + b.ridge) + C.over;
      for (let k = 0; k < count; k++) {
        const u = count === 1 ? 0 : -reach + (2 * reach * k) / (count - 1);
        const stack = [[u - C.thick / 2, -half], [u + C.thick / 2, -half], [u + C.thick / 2, half], [u - C.thick / 2, half]].map(([p, q]) => at(p, q, 0)).map(([x, , z]) => [x, z]);
        // (On the building: a stack along the middle of an L or a U drawn
        // from its whole outline could stand in the air in its yard.)
        if (!stack.every(([x, z]) => insidePolygon(poly, x, z))) continue;
        box(stack, y0, y1, b.walls);
        // (Its cope: a slab a little wider than the stack, on its top.)
        const cope = [[u - C.thick / 2 - C.cope, -half - C.cope], [u + C.thick / 2 + C.cope, -half - C.cope], [u + C.thick / 2 + C.cope, half + C.cope], [u - C.thick / 2 - C.cope, half + C.cope]].map(([p, q]) => at(p, q, 0)).map(([x, , z]) => [x, z]);
        box(cope, y1 - 0.02, y1 + C.copeHigh, "dressedStone", FACE.plain);
        const pots = Math.max(1, Math.round((2 * half) / C.pot));
        for (let q = 0; q < pots; q++) {
          const v = pots === 1 ? 0 : -half + C.pot / 2 + ((2 * half - C.pot) * q) / (pots - 1);
          const hp = C.potSize / 2;
          const pot = [[u - hp, v - hp], [u + hp, v - hp], [u + hp, v + hp], [u - hp, v + hp]].map(([p, r]) => at(p, r, 0)).map(([x, , z]) => [x, z]);
          box(pot, y1 + C.copeHigh, y1 + C.copeHigh + C.potHigh, "chimneyPot", FACE.plain);
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
  geo.setAttribute("face", new THREE.Float32BufferAttribute(face, 1));
  geo.setAttribute("seed", new THREE.Float32BufferAttribute(seeds, 1));
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
