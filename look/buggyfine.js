// The cart on High and Ultra (look/buggy.js makeBuggy; the owner, 23
// October 2026: "a beefed up cart for high and ultra... Need to look a lot
// better"): a modern two-seat golf cart, not boxes. A moulded body - the
// nose sloping down from the dash to rounded headlamps, the rear over the
// back wheels, both cut round the wheels and rounded at every edge - in
// glossy cream with a green pinstripe; tyres with a rounded shoulder and
// tread on silver spoked rims; two padded seats and backs with grab rails;
// a dash with cup holders and a key; a proper steering wheel on its
// column; a canopy on raked struts with a lined underside and a clear
// windscreen; bumpers, headlamps and tail lamps; and two golf bags with
// pockets, straps, headcovers and irons. Its frame as makeBuggy's: x to
// its right, y up, z to its back (it drives along -z), standing on y = 0;
// the wheels and the screen where the plain cart has them.
//
// Built by finish rather than by part - glossy paint, satin plastic and
// cloth, rubber, metal, glass and the lamps - each finish one mesh, its
// colours in the vertices, so the whole cart is a handful of draws.

import * as THREE from "three";
import { mergeGeometries, toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { PALETTE } from "./palette.js";
import { withSceneryHooks } from "./glsl/hooks.js";
import { ULTRA } from "./quality.js";
import { RIDE, WHEELS } from "../sim/buggy.mjs";
import { smoothstep } from "../sim/mathutil.mjs";

const P = PALETTE;
// Smoother on Ultra: the curves' segments times this (set by fineCart).
let S = 1;
// The wheels: where they stand (x either side, z front and back), their
// radius and width (sim/buggy.mjs, where the ride turns them).
export { WHEELS };
// The cart's colours beyond the palette's: its paint, its trim, the
// seats' piping, the canopy's lining, the rims and the lamps.
// (Its cream a touch deeper than the plain cart's: glossy, it catches
// more of the sky.)
const C = {
  paint: "#ddd2b6",
  trim: P.cartTrim,
  seat: P.cartSeat,
  piping: "#d8cfb6",
  lining: "#d9d3c2",
  black: "#1d211f",
  rubber: "#232422",
  rim: "#c3c7c9",
  chrome: "#dfe3e6",
  head: "#fff4dc",
  tail: "#c42a22",
  badge: "#c9a54a",
};

// The materials, by finish (made once, shared by every cart).
let finishes = null;
function materials() {
  if (finishes) return finishes;
  finishes = {
    gloss: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.34, metalness: 0, envMapIntensity: 0.45 }),
    satin: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0, envMapIntensity: 0.4 }),
    rubber: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0, envMapIntensity: 0.2 }),
    metal: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, metalness: 0.85, envMapIntensity: 1 }),
    glass: new THREE.MeshStandardMaterial({ color: 0xdfeee8, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false, envMapIntensity: 1.2 }),
    lamp: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.2, metalness: 0, emissive: 0xffffff, emissiveIntensity: 0.35 }),
  };
  // (Shaded by the clouds passing over, as the tee's furniture is.)
  for (const [name, m] of Object.entries(finishes)) {
    m.name = `cart ${name}`;
    withSceneryHooks(m, "sign");
  }
  return finishes;
}

// The parts gathered by finish, each in its colour.
class Parts {
  constructor() {
    this.by = new Map();
    this.m = new THREE.Matrix4();
    this.q = new THREE.Quaternion();
    this.e = new THREE.Euler();
  }

  // geo placed at `at`, turned by `rot` (x, y, z: radians, in that order);
  // `hex` its colour, or which colour for each corner's facing (normal =>
  // colour).
  add(finish, hex, geo, { at = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1] } = {}) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const name of Object.keys(g.attributes)) if (name !== "position" && name !== "normal") g.deleteAttribute(name);
    g.clearGroups();
    this.m.compose(new THREE.Vector3(...at), this.q.setFromEuler(this.e.set(...rot)), new THREE.Vector3(...scale));
    g.applyMatrix4(this.m);
    const c = new THREE.Color();
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3);
    const normal = new THREE.Vector3();
    if (typeof hex !== "function") c.set(hex);
    for (let i = 0; i < n; i++) {
      if (typeof hex === "function") c.set(hex(normal.fromBufferAttribute(g.attributes.normal, i)));
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    if (!this.by.has(finish)) this.by.set(finish, []);
    this.by.get(finish).push(g);
    return this;
  }

  // Both sides: the part as given and mirrored across the cart's middle
  // (x to -x).
  pair(finish, hex, geo, { at, rot = [0, 0, 0], scale = [1, 1, 1] }) {
    this.add(finish, hex, geo, { at, rot, scale });
    const mirrored = geo.clone().scale(-1, 1, 1);
    // (Its faces turned back out after the mirror.)
    flipFaces(mirrored);
    return this.add(finish, hex, mirrored, { at: [-at[0], at[1], at[2]], rot: [rot[0], -rot[1], -rot[2]], scale });
  }

  // Each finish one mesh.
  meshes() {
    const mats = materials();
    const out = [];
    for (const [finish, list] of this.by) {
      const mesh = new THREE.Mesh(mergeGeometries(list), mats[finish]);
      mesh.name = `cart ${finish}`;
      out.push(mesh);
    }
    return out;
  }
}

// A mirrored shape's faces wound the right way round again.
function flipFaces(g) {
  if (g.index) {
    const idx = g.index.array;
    for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
  } else {
    for (const name of Object.keys(g.attributes)) {
      const a = g.attributes[name];
      const k = a.itemSize;
      for (let i = 0; i < a.count; i += 3) {
        for (let j = 0; j < k; j++) {
          const v1 = a.array[(i + 1) * k + j];
          a.array[(i + 1) * k + j] = a.array[(i + 2) * k + j];
          a.array[(i + 2) * k + j] = v1;
        }
      }
    }
  }
}

// (Ultra's smoother curves where they show - the body, wheels, rings and
// tubes - not on every small rounded corner.)
const rbox = (w, h, d, r = 0.02) => new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2) * 0.999);
const v3 = (p) => new THREE.Vector3(...p);
const tube = (points, radius, segs = 24) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(v3)), segs * S, radius, 8 + 4 * (S - 1), false);
const cyl = (r, h, n = 16) => new THREE.CylinderGeometry(r, r, h, n * S);

// A side profile (in the cart's z and y) drawn by `draw(shape)`, extruded
// across the cart `width` wide with rounded edges; `narrow(z)`: how much
// narrower it is at z (a fraction of its width).
function profile(draw, width, round = 0.03, narrow = null) {
  const shape = new THREE.Shape();
  draw(shape);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: width - 2 * round,
    bevelEnabled: true,
    bevelThickness: round,
    bevelSize: round,
    bevelSegments: 3 * S,
    curveSegments: 12 * S,
  });
  // Shape x is the cart's z, its depth across the cart: turned so, and
  // centred.
  geo.rotateY(-Math.PI / 2);
  geo.translate((width - 2 * round) / 2, 0, 0);
  if (narrow) {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setX(i, pos.getX(i) * (1 - narrow(pos.getZ(i))));
  }
  // Smooth over its rounded edges and curves, sharp at its corners.
  return toCreasedNormals(geo, 0.6);
}

// A wheel arch cut up into a profile's bottom edge, `y` high, round the
// wheel at z a little clear of its tyre: drawn from the arch's front foot
// to its back one, or (`back`) the other way.
function arch(shape, z, y, back = false, clear = 0.1) {
  const r = WHEELS.r + clear;
  const dy = y - WHEELS.r;
  const half = Math.sqrt(r * r - dy * dy);
  const a = Math.atan2(dy, half);
  if (back) {
    shape.lineTo(z + half, y);
    shape.absarc(z, WHEELS.r, r, a, Math.PI - a, false);
  } else {
    shape.lineTo(z - half, y);
    shape.absarc(z, WHEELS.r, r, Math.PI - a, a, true);
  }
}

function body(p) {
  const W = 1.16;
  // The nose and dash: the dash's back face over the footwell, its top,
  // the hood sloping down to the nose, round over the front wheels.
  p.add(
    "gloss",
    C.paint,
    profile((s) => {
      s.moveTo(-0.56, 0.4);
      s.lineTo(-0.6, 0.86);
      s.quadraticCurveTo(-0.62, 0.96, -0.74, 0.958);
      s.quadraticCurveTo(-1.0, 0.94, -1.16, 0.8);
      s.quadraticCurveTo(-1.27, 0.72, -1.262, 0.56);
      s.lineTo(-1.25, 0.42);
      // (Along the bottom, round the front wheel.)
      arch(s, WHEELS.z[0], 0.4);
      s.lineTo(-0.56, 0.4);
    }, W, 0.03, (z) => 0.08 * smoothstep(-0.95, -1.3, z)),
  );
  // The back: the seat's base, the deck behind it for the bags, rounded
  // down at the back, over the back wheels.
  p.add(
    "gloss",
    C.paint,
    profile((s) => {
      s.moveTo(-0.02, 0.4);
      s.lineTo(-0.02, 0.72);
      s.quadraticCurveTo(-0.02, 0.76, 0.02, 0.76);
      s.lineTo(0.6, 0.76);
      s.lineTo(0.64, 0.86);
      s.lineTo(1.1, 0.86);
      s.quadraticCurveTo(1.28, 0.86, 1.28, 0.66);
      s.lineTo(1.27, 0.42);
      arch(s, WHEELS.z[1], 0.4, true);
      s.lineTo(-0.02, 0.4);
    }, W),
  );
  // A green pinstripe along each side, front and back.
  for (const [z0, z1, y] of [[-1.17, -0.62, 0.66], [0.05, 1.2, 0.66]]) {
    p.pair("satin", C.trim, rbox(0.012, 0.035, z1 - z0, 0.005), { at: [W / 2 + 0.003, y, (z0 + z1) / 2] });
  }
  // The sills between the wheels, the floor's ribbed mat, the dark chassis
  // under it all, and the axles.
  p.pair("satin", C.black, rbox(0.06, 0.1, 0.62, 0.02), { at: [0.55, 0.37, -0.28] });
  p.add("rubber", C.rubber, rbox(1.04, 0.03, 0.56, 0.01), { at: [0, 0.43, -0.29] });
  for (let i = 0; i < 9; i++) p.add("rubber", C.black, rbox(0.98, 0.012, 0.018, 0.005), { at: [0, 0.448, -0.52 + i * 0.058] });
  p.add("satin", C.black, rbox(0.96, 0.1, 2.3, 0.03), { at: [0, 0.32, 0.02] });
  for (const z of WHEELS.z) p.add("metal", C.black, cyl(0.03, 1.0, 8), { at: [0, WHEELS.r, z], rot: [0, 0, Math.PI / 2] });
  // Bumpers, front and back.
  p.add("rubber", C.rubber, rbox(1.2, 0.11, 0.09, 0.035), { at: [0, 0.38, -1.31] });
  p.add("rubber", C.rubber, rbox(1.2, 0.11, 0.09, 0.035), { at: [0, 0.38, 1.33] });
  // Headlamps in chrome rims on dark bezels on the nose, the club's badge
  // between them, and tail lamps. (The body's faces stand `round` out
  // from its profile.)
  for (const x of [-0.35, 0.35]) {
    p.add("satin", C.black, cyl(0.098, 0.03, 24), { at: [x, 0.64, -1.29], rot: [Math.PI / 2, 0, 0] });
    p.add("lamp", C.head, new THREE.SphereGeometry(0.076, 20 * S, 8 * S, 0, Math.PI * 2, 0, 0.9), { at: [x, 0.64, -1.27], rot: [-Math.PI / 2, 0, 0] });
    p.add("metal", C.chrome, new THREE.TorusGeometry(0.08, 0.011, 8, 28 * S), { at: [x, 0.64, -1.307] });
    p.add("satin", C.black, rbox(0.17, 0.08, 0.03, 0.012), { at: [x * 1.25, 0.66, 1.312] });
    p.add("lamp", C.tail, rbox(0.15, 0.06, 0.02, 0.008), { at: [x * 1.25, 0.66, 1.325] });
  }
  p.add("metal", C.badge, cyl(0.042, 0.012, 24), { at: [0, 0.68, -1.3], rot: [Math.PI / 2 - 0.25, 0, 0] });
  p.add("metal", C.badge, cyl(0.042, 0.012, 24), { at: [0, 0.66, 1.315], rot: [Math.PI / 2, 0, 0] });
  p.add("satin", C.trim, cyl(0.03, 0.012, 24), { at: [0, 0.66, 1.318], rot: [Math.PI / 2, 0, 0] });
  p.add("satin", C.trim, cyl(0.03, 0.012, 24), { at: [0, 0.68, -1.303], rot: [Math.PI / 2 - 0.25, 0, 0] });
  // Chrome kick plates along the floor's edges.
  p.pair("metal", C.chrome, rbox(0.06, 0.008, 0.5, 0.003), { at: [0.55, 0.427, -0.29] });
}

function seats(p) {
  // Two seat cushions and backs, piped in cream.
  for (const x of [-0.26, 0.26]) {
    p.add("satin", C.seat, rbox(0.5, 0.12, 0.52, 0.05), { at: [x, 0.82, 0.33] });
    p.add("satin", C.piping, rbox(0.51, 0.02, 0.53, 0.01), { at: [x, 0.84, 0.33] });
    // (The backs leaning back.)
    p.add("satin", C.seat, rbox(0.48, 0.44, 0.11, 0.045), { at: [x, 1.12, 0.64], rot: [0.16, 0, 0] });
    p.add("satin", C.piping, rbox(0.49, 0.018, 0.12, 0.008), { at: [x, 1.335, 0.675], rot: [0.16, 0, 0] });
  }
  // The seat backs' frame, and the grab rails at the seat's ends.
  p.add("metal", C.black, rbox(1.06, 0.05, 0.05, 0.02), { at: [0, 0.9, 0.7] });
  p.pair("metal", C.chrome, tube([[0.55, 0.77, 0.06], [0.585, 0.97, 0.16], [0.585, 1.0, 0.36], [0.575, 0.96, 0.56], [0.55, 0.86, 0.64]], 0.014), { at: [0, 0, 0] });
}

function dash(p) {
  // The dash's pod, its cup holders and the key.
  p.add("satin", C.black, rbox(1.02, 0.05, 0.2, 0.02), { at: [0, 0.965, -0.71] });
  for (const x of [0.16, 0.34]) {
    p.add("satin", C.trim, cyl(0.045, 0.02, 16), { at: [x, 0.985, -0.7] });
    p.add("rubber", C.black, cyl(0.036, 0.022, 16), { at: [x, 0.99, -0.7] });
  }
  p.add("metal", C.chrome, rbox(0.02, 0.04, 0.012, 0.004), { at: [-0.02, 0.92, -0.605] });
  // The pedals.
  for (const x of [-0.34, -0.18]) p.add("rubber", C.black, rbox(0.1, 0.02, 0.15, 0.008), { at: [x, 0.48, -0.5], rot: [-0.5, 0, 0] });
  // The steering wheel on its column, on the left, facing the driver.
  const col = [-0.27, 0.62, -0.66];
  const hub = [-0.27, 1.04, -0.5];
  p.add("metal", C.black, tube([col, [-0.27, 0.86, -0.59], hub], 0.022, 8), { at: [0, 0, 0] });
  const tilt = -0.95;
  p.add("satin", C.black, new THREE.TorusGeometry(0.17, 0.019, 10, 40 * S), { at: hub, rot: [tilt, 0, 0] });
  p.add("satin", C.black, cyl(0.045, 0.04, 16), { at: hub, rot: [tilt + Math.PI / 2, 0, 0] });
  for (const a of [Math.PI / 2, Math.PI * 1.2, Math.PI * 1.8]) {
    const spoke = rbox(0.15, 0.022, 0.012, 0.005).translate(0.08, 0, 0).rotateZ(a);
    p.add("satin", C.black, spoke, { at: hub, rot: [tilt, 0, 0] });
  }
  p.add("metal", C.chrome, cyl(0.022, 0.05, 12), { at: hub, rot: [tilt + Math.PI / 2, 0, 0] });
}

function roof(p) {
  const top = 1.98;
  // The canopy: a moulded shell arched front to back, green above and
  // lined in cream under.
  const canopy = profile((s) => {
    s.moveTo(-0.9, top - 0.03);
    s.quadraticCurveTo(0.06, top + 0.07, 1.02, top - 0.03);
    s.lineTo(1.02, top - 0.06);
    s.quadraticCurveTo(0.06, top + 0.04, -0.9, top - 0.06);
    s.lineTo(-0.9, top - 0.03);
  }, 1.32);
  p.add("satin", (n) => (n.y < -0.3 ? C.lining : C.trim), canopy);
  // Struts: the front pair raked back from the dash, the back pair up
  // from the deck.
  p.pair("metal", C.black, tube([[0.53, 0.92, -0.66], [0.545, 1.4, -0.72], [0.56, top - 0.03, -0.82]], 0.024, 12), { at: [0, 0, 0] });
  p.pair("metal", C.black, tube([[0.54, 0.86, 0.9], [0.55, 1.4, 0.92], [0.56, top - 0.03, 0.94]], 0.024, 12), { at: [0, 0, 0] });
  // The windscreen in its frame, between the front struts.
  const glass = new THREE.PlaneGeometry(1.02, 0.86);
  p.add("glass", 0xffffff, glass, { at: [0, 1.46, -0.775], rot: [-0.12, 0, 0] });
  p.add("rubber", C.black, rbox(1.06, 0.03, 0.025, 0.01), { at: [0, 1.03, -0.725] });
  p.add("rubber", C.black, rbox(1.06, 0.03, 0.025, 0.01), { at: [0, 1.89, -0.83] });
  // The screen's arm down from the roof, and its case.
  const sc = RIDE.screen;
  p.add("metal", C.black, tube([[0, top - 0.02, sc.at[2] - 0.05], [0, sc.at[1] + sc.h / 2, sc.at[2] - 0.03]], 0.018, 4), { at: [0, 0, 0] });
  p.add("satin", C.black, rbox(sc.w + 0.06, sc.h + 0.06, 0.04, 0.015), { at: [sc.at[0], sc.at[1], sc.at[2] - 0.025], rot: [sc.tip, 0, 0] });
}

// One wheel at the origin, its axle along x: drawn four times, each
// turned as it rolls and the front two steered (look/buggy.js
// turnWheels) - so its rim's spokes on both faces, the same wheel either
// side of the cart.
function wheel(p) {
  // A tyre: a rounded shoulder each side, the tread between; turned on
  // the x axis.
  const R = WHEELS.r;
  const half = WHEELS.w / 2;
  const tyre = new THREE.LatheGeometry(
    [
      [0.135, -half + 0.012],
      [0.165, -half],
      [R - 0.025, -half + 0.004],
      [R - 0.006, -half + 0.022],
      [R, -half + 0.05],
      [R, half - 0.05],
      [R - 0.006, half - 0.022],
      [R - 0.025, half - 0.004],
      [0.165, half],
      [0.135, half - 0.012],
    ].map(([r, y]) => new THREE.Vector2(r, y)),
    32 * S,
  ).rotateZ(Math.PI / 2);
  p.add("rubber", C.rubber, tyre);
  // The tread: low blocks round it, staggered either side of the middle.
  const n = 28;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const side = i % 2 ? 1 : -1;
    p.add("rubber", C.rubber, new THREE.BoxGeometry(WHEELS.w / 2 - 0.02, 0.008, 0.03), { at: [side * 0.03, Math.sin(a) * (R + 0.002), Math.cos(a) * (R + 0.002)], rot: [-a + Math.PI / 2, 0, 0] });
  }
  // The rim: dark inside, and on each face a silver lip, six spokes and a
  // hub cap, set a little in from the tyre's wall.
  p.add("satin", C.black, cyl(0.134, 0.09, 24), { rot: [0, 0, Math.PI / 2] });
  for (const out of [-1, 1]) {
    p.add("metal", C.rim, new THREE.TorusGeometry(0.128, 0.013, 8, 32 * S), { at: [out * 0.058, 0, 0], rot: [0, Math.PI / 2, 0] });
    for (let i = 0; i < 6; i++) {
      const spoke = rbox(0.018, 0.1, 0.03, 0.007).translate(0, 0.075, 0).rotateX((i / 6) * Math.PI * 2);
      p.add("metal", C.rim, spoke, { at: [out * 0.055, 0, 0] });
    }
    p.add("metal", C.rim, cyl(0.05, 0.02, 20), { at: [out * 0.055, 0, 0], rot: [0, 0, Math.PI / 2] });
    p.add("metal", C.chrome, new THREE.SphereGeometry(0.032, 16 * S, 6 * S, 0, Math.PI * 2, 0, 1.1), { at: [out * 0.058, 0, 0], rot: [0, 0, -out * Math.PI / 2] });
  }
}

// A golf bag standing in the well behind the seats: its body, collar,
// pocket and strap in its colour; three woods in knitted headcovers and a
// few irons. `lean`: how far back it leans (radians).
function bag(p, x, colour, cover, lean = 0.26) {
  const parts = [];
  const put = (finish, hex, geo, at, rot = [0, 0, 0]) => parts.push({ finish, hex, geo, at, rot });
  const H = 0.82;
  const body = new THREE.LatheGeometry(
    [
      [0, 0],
      [0.095, 0],
      [0.115, 0.03],
      [0.118, 0.12],
      [0.112, H - 0.12],
      [0.12, H - 0.1],
      [0.13, H - 0.02],
      [0.12, H],
      [0.0, H],
    ].map(([r, y]) => new THREE.Vector2(r, y)),
    20 * S,
  );
  put("satin", colour, body, [0, 0, 0]);
  put("satin", C.black, new THREE.TorusGeometry(0.124, 0.014, 6, 20 * S), [0, H, 0], [Math.PI / 2, 0, 0]);
  put("satin", C.black, cyl(0.12, 0.05, 20), [0, 0.025, 0]);
  // Its pocket and strap face out (the cart's back).
  put("satin", colour, rbox(0.15, 0.34, 0.05, 0.02), [0, 0.32, 0.11]);
  put("satin", C.black, rbox(0.16, 0.02, 0.06, 0.008), [0, 0.5, 0.11]);
  put("satin", C.piping, rbox(0.035, 0.6, 0.012, 0.005), [-0.06, 0.4, 0.12], [0, 0, 0.18]);
  // Woods in their covers.
  const sock = new THREE.LatheGeometry(
    [
      [0.0, 0],
      [0.035, 0.0],
      [0.05, 0.05],
      [0.055, 0.1],
      [0.045, 0.15],
      [0.0, 0.17],
    ].map(([r, y]) => new THREE.Vector2(r, y)),
    12 * S,
  );
  [
    [-0.05, 0.03, 0.12],
    [0.04, 0.05, 0.08],
    [0.0, -0.05, 0.06],
  ].forEach(([dx, dz, up], i) => {
    put("satin", i === 1 ? C.piping : cover, sock, [dx, H + up, dz], [0.12 * (i - 1), 0, -0.1 * (i - 1)]);
    put("satin", C.black, cyl(0.007, up + 0.02, 6), [dx, H + up / 2, dz]);
  });
  // Irons: grips up out of the bag, then the heads under them hidden in it.
  for (const [dx, dz, up] of [[0.06, -0.02, 0.1], [0.08, 0.03, 0.08], [-0.07, -0.04, 0.09], [0.02, 0.07, 0.07]]) {
    put("rubber", C.black, cyl(0.011, 0.16, 8), [dx, H + up, dz]);
  }
  // (Leaning back into the well.)
  const m = new THREE.Matrix4().makeRotationX(lean).setPosition(x, 0.88, 1.04);
  for (const q of parts) {
    const local = new THREE.Matrix4().compose(v3(q.at), new THREE.Quaternion().setFromEuler(new THREE.Euler(...q.rot)), new THREE.Vector3(1, 1, 1));
    const geo = q.geo.clone().applyMatrix4(local).applyMatrix4(m);
    p.add(q.finish, q.hex, geo);
  }
}

function bags(p) {
  // A ribbed mat on the deck the bags stand on.
  p.add("rubber", C.rubber, rbox(1.0, 0.012, 0.44, 0.005), { at: [0, 0.893, 0.89] });
  for (let i = 0; i < 6; i++) p.add("rubber", C.black, new THREE.BoxGeometry(0.94, 0.008, 0.016), { at: [0, 0.9, 0.72 + i * 0.068] });
  // The bag rack: a bar across behind the seats, and the bags' strap.
  p.add("metal", C.black, rbox(1.0, 0.04, 0.04, 0.015), { at: [0, 1.36, 0.92] });
  p.add("metal", C.black, rbox(0.04, 0.5, 0.04, 0.015), { at: [-0.44, 1.12, 0.9] });
  p.add("metal", C.black, rbox(0.04, 0.5, 0.04, 0.015), { at: [0.44, 1.12, 0.9] });
  bag(p, -0.24, P.bags[0], P.bags[1]);
  bag(p, 0.24, P.bags[1], P.bags[3]);
  p.add("satin", C.black, rbox(0.86, 0.05, 0.015, 0.008), { at: [0, 1.27, 1.06], rot: [0.26, 0, 0] });
}

// Four of one wheel, a draw for them all: each wheel an instance, placed
// and turned by look/buggy.js turnWheels (its 0 - 3: left front, left
// back, right front, right back), standing still to begin with.
export function wheelSet(geometry, material, name) {
  const set = new THREE.InstancedMesh(geometry, material, 4);
  set.name = name;
  set.userData.wheels = true;
  const m = new THREE.Matrix4();
  let i = 0;
  for (const x of [-WHEELS.x, WHEELS.x]) for (const z of WHEELS.z) set.setMatrixAt(i++, m.makeTranslation(x, WHEELS.r, z));
  set.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  set.computeBoundingBox();
  set.computeBoundingSphere();
  return set;
}

// The cart's body, roof, wheels and bags (not its screen): a group of a
// mesh for each finish, and the wheels' (wheelSet: four of one wheel, a
// draw for each of its finishes). `smooth`: its curves smoother (Ultra).
export function fineCart({ smooth = ULTRA } = {}) {
  S = smooth ? 2 : 1;
  const p = new Parts();
  body(p);
  seats(p);
  dash(p);
  roof(p);
  bags(p);
  const group = new THREE.Group();
  group.name = "cart body";
  const shade = (mesh) => {
    const solid = mesh.material.name !== "cart glass";
    mesh.castShadow = solid;
    mesh.receiveShadow = solid;
    mesh.userData.shadowNear = solid;
    return mesh;
  };
  for (const mesh of p.meshes()) group.add(shade(mesh));
  const w = new Parts();
  wheel(w);
  for (const mesh of w.meshes()) group.add(shade(wheelSet(mesh.geometry, mesh.material, `cart wheels ${mesh.name.slice(5)}`)));
  return group;
}
