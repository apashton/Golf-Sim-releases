// A car park (sim/carparks.mjs): its asphalt laid on the ground as it lies -
// cut into cells, each corner at the ground's own height, so it follows a
// slope or a bank - its bays marked out in white, and cars parked in some
// of them. Two meshes for everything on a hole: the surface and its lines
// (on the paths' layer, over the turf), and the cars.

import * as THREE from "three";
import { Kit } from "./club.js";
import { PALETTE } from "./palette.js";
import { onLayer, LAYER } from "./grass.js";
import { CARPARK, CAR_COLOURS, carparkCells, carparksOf } from "../sim/carparks.mjs";

// Its pieces' sizes (metres) and colours.
export const CARPARK_LOOK = {
  // How far the asphalt lies over the ground, and its lines over that.
  lift: 0.05,
  line: 0.1,
  lineLift: 0.02,
  lineColour: "#d8d8d2",
  // A car: its body's length, width and height, how far it stands off the
  // ground; its cabin's; its wheels'.
  body: [4.25, 1.78, 0.62],
  clear: 0.22,
  cabin: [2.25, 1.6, 0.56],
  cabinBack: 0.25,
  wheel: 0.32,
  glass: "#2b3440",
  tyre: "#1b1c1e",
};

let surfaceMat = null;
function surfaceMaterial() {
  surfaceMat ??= onLayer(new THREE.MeshLambertMaterial({ vertexColors: true }), LAYER.path);
  return surfaceMat;
}

// A hole's car parks: groundAt(x, z) the ground's height as it's drawn
// (hole frame). A group, or null for none.
export function makeCarparks(L, groundAt) {
  const parks = carparksOf(L);
  if (!parks.length) return null;
  const T = CARPARK_LOOK;
  const pos = [];
  const col = [];
  const asphalt = new THREE.Color(PALETTE.path);
  const white = new THREE.Color(T.lineColour);
  // Hole frame -> world: (x, z) -> (z, -x). A flat piece [[x, z], ...] at
  // the ground's height at each corner, `up` over it, facing up.
  const piece = (pts, up, c, shade = 1) => {
    const w = pts.map(([x, z]) => [z, groundAt(x, z) + up, -x]);
    for (let i = 1; i + 1 < w.length; i++) {
      // (Wound to face up, whichever way the corners came.)
      const [a, b, d] = [w[0], w[i], w[i + 1]];
      const n = (b[2] - a[2]) * (d[0] - a[0]) - (b[0] - a[0]) * (d[2] - a[2]);
      for (const p of n >= 0 ? [a, b, d] : [a, d, b]) {
        pos.push(...p);
        col.push(c.r * shade, c.g * shade, c.b * shade);
      }
    }
  };
  const cars = new Kit();
  for (const park of parks) {
    // Its asphalt: each cell a touch lighter or darker than the next, as
    // worn tarmac is.
    for (const cell of carparkCells(park.poly)) {
      const [x, z] = cell[0];
      const speck = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
      const worn = 0.94 + 0.1 * (speck - Math.floor(speck));
      piece(cell, T.lift, asphalt, worn);
    }
    // Its bays' lines: one down each side of every bay, the length of it.
    const lined = new Set();
    for (const [x, z, turn, car] of park.bays ?? []) {
      const [fx, fz] = [Math.cos(turn), Math.sin(turn)];
      const [sx, sz] = [-fz, fx];
      for (const s of [-1, 1]) {
        const [mx, mz] = [x + (sx * s * CARPARK.wide) / 2, z + (sz * s * CARPARK.wide) / 2];
        // (A line two bays share is laid once.)
        const key = `${Math.round(mx * 5)},${Math.round(mz * 5)}`;
        if (lined.has(key)) continue;
        lined.add(key);
        // (In two lengths, so it follows the ground.)
        for (const [a, b] of [[-0.5, 0], [0, 0.5]]) {
          const ends = [a, b].map((k) => [mx + fx * k * CARPARK.deep, mz + fz * k * CARPARK.deep]);
          piece([[ends[0][0] - (sx * T.line) / 2, ends[0][1] - (sz * T.line) / 2], [ends[1][0] - (sx * T.line) / 2, ends[1][1] - (sz * T.line) / 2], [ends[1][0] + (sx * T.line) / 2, ends[1][1] + (sz * T.line) / 2], [ends[0][0] + (sx * T.line) / 2, ends[0][1] + (sz * T.line) / 2]], T.lift + T.lineLift, white);
        }
      }
      if (!car) continue;
      // A car in it: a body, a cabin set a little back, four wheels.
      const colour = CAR_COLOURS[(car - 1) % CAR_COLOURS.length];
      // (The hole frame's direction (fx, fz) is the world's (fz, -fx): the
      // kit's +x turned to it.)
      cars.place(z, groundAt(x, z) + T.lift, -x, Math.atan2(fx, fz));
      const [bl, bw, bh] = T.body;
      const [cl, cw, ch] = T.cabin;
      cars.box(bl, bh, bw, colour, { at: [0, T.clear + bh / 2, 0] });
      cars.box(cl, ch, cw, T.glass, { at: [-T.cabinBack, T.clear + bh + ch / 2, 0] });
      cars.box(cl - 0.5, 0.05, cw - 0.1, colour, { at: [-T.cabinBack, T.clear + bh + ch, 0] });
      for (const ex of [-1, 1]) for (const ez of [-1, 1]) cars.cyl(T.wheel, T.wheel, 0.2, 10, T.tyre, { at: [ex * (bl / 2 - 0.8), T.wheel, ez * (bw / 2 - 0.08)], tilt: [Math.PI / 2, 0] });
    }
  }
  if (!pos.length) return null;
  const group = new THREE.Group();
  group.name = "car parks";
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const surface = new THREE.Mesh(geo, surfaceMaterial());
  surface.receiveShadow = true;
  group.add(surface);
  const parked = cars.mesh();
  if (parked) {
    parked.castShadow = true;
    parked.receiveShadow = true;
    group.add(parked);
  }
  return group;
}
