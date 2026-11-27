// Divots and pitch marks on Ultra (sim/marks.mjs says where and how big):
// small shapes lying on the ground, pulled forward over it so they never
// sink into it - a divot a torn oval of bare soil along the line of the
// shot, a pitch mark a small dark dent with a pale rim of torn grass. And
// in the sand: a dent with a rim of thrown sand where a ball lands, the
// scooped scar a bunker shot leaves, a plugged ball's crater round it -
// in the course's sand, shaded darker in the dent and lighter on the rim.
// A hole's are in a group of its own, built again with the hole.

import * as THREE from "three";
import { ULTRA } from "./quality.js";
import { MOST_MARKS } from "../sim/marks.mjs";

let looks = null;
function materials() {
  if (looks) return looks;
  const flat = (color, opacity = 1) =>
    new THREE.MeshLambertMaterial({ color, transparent: opacity < 1, opacity, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  looks = {
    soil: flat(new THREE.Color(0x7a6040)),
    torn: flat(new THREE.Color(0x8d8a52), 0.9),
    dent: flat(new THREE.Color(0x24321c), 0.85),
    rim: flat(new THREE.Color(0x8fa05f), 0.7),
  };
  return looks;
}

// A torn-edged oval, 1 across and 1 long, lying flat.
function raggedOval(seed, points = 14) {
  const shape = new THREE.Shape();
  for (let i = 0; i <= points; i++) {
    const a = (i / points) * Math.PI * 2;
    const r = 0.5 * (0.8 + 0.2 * Math.abs(Math.sin(a * 3.7 + seed * 11.3)) + 0.08 * Math.sin(a * 9 + seed));
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, z);
    else shape.lineTo(x, z);
  }
  return new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2);
}

// The sand's marks in a course's sand: soft, each shaded by its corners'
// colours and see-through edges (the sand under them showing), never a
// hard disc on the sand.
const softSand = () => new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });

// A dent in the sand, 1 across, lying flat: rings out from its middle -
// damp and darker in the hollow, lightening up its side to a rim of thrown
// sand a little lighter than the sand round it, fading out into it `rim`
// (a share of its width) further on; every ring torn a little unevenly.
// sand: the course's sand colour. Stretched along x by `long` (a scoop's
// scar), its rim thrown `ahead` times as far ahead (+x) as behind.
function dentGeometry(sand, { rim = 0.4, seed = 1, long = 1, ahead = 1 } = {}) {
  const dark = sand.clone().multiplyScalar(0.62);
  const side = sand.clone().multiplyScalar(0.8);
  const light = sand.clone().lerp(new THREE.Color(1, 1, 1), 0.16);
  // [radius (of 0.5), colour, alpha]
  const rings = [
    [0, dark, 0.85],
    [0.22, dark, 0.8],
    [0.42, side, 0.6],
    [0.5, sand, 0.25],
    [0.5 + rim * 0.45, light, 0.6],
    [0.5 + rim, light, 0],
  ];
  const n = long > 1.5 ? 28 : 18;
  const pos = [];
  const col = [];
  const index = [];
  rings.forEach(([r, c, a], ri) => {
    for (let k = 0; k < n; k++) {
      const q = (k / n) * Math.PI * 2;
      // Torn: the further out, the more uneven.
      const tear = 1 + (ri / rings.length) * 0.28 * (Math.sin(q * 3 + seed * 1.7) * 0.6 + Math.sin(q * 7 + seed * 4.1) * 0.4);
      // (Ahead, eased round from the sides: no corner where it starts.)
      const reach = r > 0.5 ? 1 + (ahead - 1) * Math.max(0, Math.cos(q)) ** 2 : 1;
      const x = Math.cos(q) * r * tear * long * reach;
      pos.push(x, 0, Math.sin(q) * r * tear);
      col.push(c.r, c.g, c.b, a);
    }
  });
  for (let ri = 0; ri < rings.length - 1; ri++) {
    for (let k = 0; k < n; k++) {
      const a = ri * n + k;
      const b = ri * n + ((k + 1) % n);
      const c = a + n;
      const d = b + n;
      index.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(pos.map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 4));
  g.setIndex(index);
  return g;
}

export class Marks {
  // parent: the hole's group; place(x, z) -> THREE.Vector3: the ground there
  // in world terms (x, z in the hole's frame); surface(x, z): the same for
  // what's drawn there - the sand lies over the ground (sim/lifts.mjs); sand:
  // the course's sand colour (a THREE.Color).
  constructor(parent, place, { sand = new THREE.Color(0xdccb9d), surface = place } = {}) {
    this.group = new THREE.Group();
    this.group.name = "marks";
    this.place = place;
    this.surface = surface;
    this.count = 0;
    this.sandColour = sand;
    this.sand = ULTRA ? { soft: softSand() } : null;
    if (ULTRA) {
      parent.add(this.group);
      // One speck of each look, far under the ground, so their shaders are
      // built with the hole (look/warmup.js) and not at the first divot.
      const m = materials();
      const speck = new THREE.CircleGeometry(0.001, 3);
      // (The sand's with corners' colours, as its marks have: the shader
      // they're drawn with.)
      const sandSpeck = dentGeometry(sand).scale(0.001, 1, 0.001);
      for (const look of [...Object.values(m), ...Object.values(this.sand)]) {
        const s = new THREE.Mesh(look.vertexColors ? sandSpeck : speck, look);
        // (Out of sight, never drawn: built all the same, as three.js
        // builds every shader in the scene, seen or not.)
        s.position.y = -50;
        s.userData.warm = true;
        this.group.add(s);
      }
    }
  }

  // A divot struck from x, z (the hole's frame), the shot heading `aim`
  // (radians, the hole's frame), { length, width } metres.
  divot([x, z], aim, size) {
    if (!ULTRA || !size) return;
    const m = materials();
    const g = new THREE.Group();
    // Just ahead of where the ball sat: the club takes the turf after it.
    const ax = Math.cos(aim);
    const az = Math.sin(aim);
    const at = this.place(x + ax * size.length * 0.5, z + az * size.length * 0.5);
    const scar = new THREE.Mesh(raggedOval(this.count + 1), m.soil);
    scar.scale.set(size.length, 1, size.width);
    // A torn strip of turf thrown a little further on, lying askew.
    const thrown = new THREE.Mesh(raggedOval(this.count + 7), m.torn);
    thrown.scale.set(size.length * 0.6, 1, size.width * 0.8);
    thrown.position.set(size.length * 1.6, 0.004, (this.count % 2 ? 1 : -1) * size.width * 0.6);
    thrown.rotation.y = (this.count % 3) * 0.4 - 0.4;
    g.add(scar, thrown);
    g.position.copy(at);
    g.position.y += 0.006;
    // (The hole's frame turned into the world's: x along it is the world's -z.)
    const w = new THREE.Vector3(az, 0, -ax);
    g.rotation.y = Math.atan2(-w.z, w.x);
    this.add(g);
  }

  // A pitch mark `size` metres across where a ball landed at x, z.
  pitch([x, z], size) {
    if (!ULTRA || !(size > 0)) return;
    const m = materials();
    const g = new THREE.Group();
    const dent = new THREE.Mesh(new THREE.CircleGeometry(size * 0.5, 12).rotateX(-Math.PI / 2), m.dent);
    const rim = new THREE.Mesh(new THREE.RingGeometry(size * 0.5, size * 0.68, 14).rotateX(-Math.PI / 2), m.rim);
    rim.position.y = 0.001;
    g.add(dent, rim);
    g.position.copy(this.place(x, z));
    g.position.y += 0.004;
    this.add(g);
  }

  // Where a ball landed in sand at x, z: a dent `size` across, a rim of
  // the sand it threw round it.
  crater([x, z], size) {
    if (!ULTRA || !(size > 0)) return;
    this.dent([x, z], size, 0.4, this.count + 3);
  }

  // A plugged ball's crater at x, z (sim/marks.mjs eggFor: its size, how
  // wide its ring).
  egg([x, z], egg) {
    if (!ULTRA || !egg) return;
    this.dent([x, z], egg.size, egg.rim, this.count + 5);
  }

  dent([x, z], size, rim, seed) {
    const dent = new THREE.Mesh(dentGeometry(this.sandColour, { rim, seed }), this.sand.soft);
    dent.scale.set(size, 1, size);
    dent.rotation.y = seed;
    dent.position.copy(this.surface(x, z));
    dent.position.y += 0.005;
    this.add(dent);
  }

  // The sand a bunker shot took, struck from x, z heading `aim` (the
  // hole's frame): a long, shallow scoop just ahead of where the ball sat,
  // the sand it threw out lying further ahead than behind.
  scoop([x, z], aim, size) {
    if (!ULTRA || !size) return;
    const ax = Math.cos(aim);
    const az = Math.sin(aim);
    const scar = new THREE.Mesh(dentGeometry(this.sandColour, { rim: 0.7, seed: this.count + 2, long: size.length / size.width, ahead: 1.6 }), this.sand.soft);
    scar.scale.set(size.width, 1, size.width);
    scar.position.copy(this.surface(x + ax * size.length * 0.3, z + az * size.length * 0.3));
    scar.position.y += 0.005;
    const w = new THREE.Vector3(az, 0, -ax);
    scar.rotation.y = Math.atan2(-w.z, w.x);
    this.add(scar);
  }

  add(g) {
    this.count++;
    this.group.add(g);
    while (this.group.children.filter((c) => !c.userData.warm).length > MOST_MARKS) {
      const old = this.group.children.find((c) => !c.userData.warm);
      this.group.remove(old);
      old.traverse((o) => o.geometry?.dispose());
    }
  }
}
