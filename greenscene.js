// Builds the ground, green, cup and surroundings for the putting and
// chipping modes, on a surface that can have humps and hollows.
//
// Works in world coordinates (see scenery.js): the golfer looks down -z.
// heightAt(wx, wz) gives the surface height anywhere.

import * as THREE from "three";
import { grassMaterial, edgeStrip, edgeMesh, rectangle, withRim, mowOptions, GRASS, LAYER } from "./look/grass.js";
import { mowingFor } from "./look/glsl/ground.js";
import { makeTrees, seeded } from "./look/trees.js";
import { makeBunker, makeFlag, makeGrassTufts } from "./scenery.js";
import { HIGH, ULTRA } from "./look/quality.js";
import { greenOutline, FRINGE_WIDTH } from "./sim/greenshape.mjs";
import { CupMark } from "./look/cupmark.js";
import { tuftChance } from "./sim/tufts.mjs";
import { greenRing, CLUBHOUSE_GAP } from "./sim/woods.mjs";
import { makeClubhouse } from "./look/club.js";
import { plotCorners } from "./sim/buildings.mjs";
import { edgeDressing } from "./sim/dressing.mjs";
import { makeDressing } from "./look/dressing.js";
import { countryScene, withCountry, setCountry } from "./look/country.js";
import { playReach } from "./sim/country.mjs";
import { cutOnlyNearCup } from "./look/cupcut.js";

// A mesh in rings round a centre, out to a wavy outline: fine enough
// everywhere to follow the contours, and shaped like a real green.
//   outline(angle) -> radius in metres
//   from, to: fractions of the outline (0..1 for the green, 1..beyond for a
//   collar round it) or absolute metres added with extra
//   clip(x, z): optional - true where the mesh mustn't reach (a bunker dug
//   right up to the green): a point there is drawn in along its own line
//   from the centre until it's just clear, so the edge follows the bunker
//   smoothly (dropping whole triangles left a row of teeth).
//   innerExtraAt(angle): optional, with inner 1 - innerExtra for each
//   spoke (a pond's turf line, down its bank).
// angles: the spokes' own angles (ascending, round from 0), in place of
// `segments` evenly spaced - so its edge runs through a shape's own outline
// points (holebuild.js rimAngles: a dug bunker's sand, meeting the ground
// cut to the same points).
export function ringMesh({ cx, cz, outline, inner = 0, outerExtra = 0, innerExtra = 0, innerExtraAt = null, rings, segments, angles = null, heightAt, lift, material, clip = null }) {
  if (angles) segments = angles.length;
  const spoke = angles ? (s) => angles[s] : (s) => (s / segments) * Math.PI * 2;
  const positions = [];
  const index = [];
  // Once clipped, a spoke stays clipped: further out along it, past what
  // clipped it, there may be ground outside it again (a bunker reaching
  // round a pond), and a ring there would stretch a sheet across it.
  const stop = clip ? new Float64Array(segments).fill(Infinity) : null;
  // Where each spoke starts: the centre - or, when the centre itself is
  // clipped (a bunker whose middle lies under a deeper one it overlaps),
  // where the spoke comes out of what clips it, found exactly, so the
  // edge there is a smooth line rather than a row of cut triangles.
  const from = new Float64Array(segments);
  if (clip && inner !== 1 && clip(cx, cz)) {
    for (let s = 0; s < segments; s++) {
      const a = spoke(s);
      const edge = outline(a);
      const [ca, sa] = [Math.cos(a), Math.sin(a)];
      const n = Math.max(8, Math.ceil(edge / 0.25));
      from[s] = edge;
      for (let k = 1; k <= n; k++) {
        const t = (edge * k) / n;
        if (clip(cx + ca * t, cz + sa * t)) continue;
        let lo = (edge * (k - 1)) / n;
        let hi = t;
        for (let j = 0; j < 12; j++) {
          const mid = (lo + hi) / 2;
          if (clip(cx + ca * mid, cz + sa * mid)) lo = mid;
          else hi = mid;
        }
        from[s] = hi;
        break;
      }
    }
  }
  const extra = innerExtraAt && inner === 1 ? Float64Array.from({ length: segments }, (_, s) => innerExtraAt(spoke(s))) : null;
  for (let r = 0; r <= rings; r++) {
    const f = r / rings;
    for (let s = 0; s < segments; s++) {
      const a = spoke(s);
      const edge = outline(a);
      const inEx = extra ? extra[s] : innerExtra;
      let rad = inner === 1 ? edge + inEx + (outerExtra - inEx) * f : from[s] + (edge - from[s]) * f;
      const [ca, sa] = [Math.cos(a), Math.sin(a)];
      if (stop && rad > stop[s]) rad = stop[s];
      else if (clip && clip(cx + ca * rad, cz + sa * rad)) {
        // Between the ring's inner edge (or where the spoke starts) and here.
        let lo = inner === 1 ? edge + inEx : from[s];
        let hi = rad;
        if (clip(cx + ca * lo, cz + sa * lo)) rad = lo;
        else {
          for (let k = 0; k < 12; k++) {
            const mid = (lo + hi) / 2;
            if (clip(cx + ca * mid, cz + sa * mid)) hi = mid;
            else lo = mid;
          }
          rad = lo;
        }
        stop[s] = rad;
      }
      const x = cx + ca * rad;
      const z = cz + sa * rad;
      positions.push(x, heightAt(x, z) + lift, z);
    }
  }
  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < segments; s++) {
      const a = r * segments + s;
      const b = r * segments + ((s + 1) % segments);
      const c = a + segments;
      const d = b + segments;
      index.push(a, b, c, b, d, c); // wound to face up
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  mesh.receiveShadow = true;
  return mesh;
}

// The country round a practice green (look/country.js): past its ring of
// trees, fields, hedgerows and woods, and the shade under the trees. Kept
// for the last few greens drawn, as they're drawn again and again.
const countries = new Map();
function greenCountry(green, seed, treeSeed, crowns, groundY, near = {}) {
  const key = `${seed}:${treeSeed}:${green.cx}:${green.cz}`;
  let made = countries.get(key);
  if (!made) {
    made = countryScene({
      box: { x0: green.cx - 1200, z0: green.cz - 1200, size: 2400 },
      past: playReach({ line: [[green.cx, green.cz]], reach: 120 }),
      seed: seed * 7919 + treeSeed,
      character: "parkland",
      trees: crowns.map((t) => [t.x, t.z, t.r]),
      groundY,
      near,
    });
    countries.set(key, made);
    while (countries.size > 4) {
      const [old, m] = countries.entries().next().value;
      countries.delete(old);
      m.map.texture.dispose();
    }
  }
  // (The far woods' mesh is shared by every drawing of this green: it's
  // never disposed with the scene - keepGeometry.)
  if (made.woods) made.woods.userData.keepGeometry = true;
  return made;
}

// A square of ground, draped over the surface.
export function groundPatch(size, step, heightAt, lift, material, cx = 0, cz = 0, heights = null) {
  return groundMesh(sheetGeometry({ size, step, cx, cz }), heightAt, lift, material, heights);
}

// The same over a rectangle w by d metres (x, z), its middle at cx, cz.
export function groundRect(w, d, step, heightAt, lift, material, cx = 0, cz = 0, heights = null) {
  return groundMesh(sheetGeometry({ w, d, step, cx, cz }), heightAt, lift, material, heights);
}

// A sheet's grid, flat: { size, step, cx, cz } (groundPatch's) or { w, d,
// step, cx, cz } (groundRect's) - three.js's PlaneGeometry(w, d, nx, nz),
// turned flat (rotateX(-pi / 2)) and moved (translate(cx, 0, cz)), but
// made straight into its lists, number for number as those make them:
// each corner turned and moved by the same sums, kept as 32-bit numbers
// between, as a mesh keeps them. (Made the long way round - lists of
// plain numbers, turned and moved a corner at a time, normals and all -
// a hole's sheets were a few tenths of a second of the page as the hole
// was built ahead: the owner's report, 20 October 2026.)
const FLAT = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
export function sheetGeometry({ size, w = size, d = size, step, cx = 0, cz = 0 }) {
  const square = size != null;
  const nx = square ? Math.round(size / step) : Math.max(1, Math.round(w / step));
  const nz = square ? nx : Math.max(1, Math.round(d / step));
  const move = new THREE.Matrix4().makeTranslation(cx, 0, cz);
  const cols = nx + 1;
  const count = cols * (nz + 1);
  const pos = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  const v = new THREE.Vector3();
  const across = w / nx;
  const down = d / nz;
  for (let iy = 0, k = 0; iy <= nz; iy++) {
    const y = iy * down - d / 2;
    for (let ix = 0; ix <= nx; ix++, k++) {
      v.set(Math.fround(ix * across - w / 2), Math.fround(-y), 0).applyMatrix4(FLAT);
      v.set(Math.fround(v.x), Math.fround(v.y), Math.fround(v.z)).applyMatrix4(move);
      pos[k * 3] = v.x;
      pos[k * 3 + 1] = v.y;
      pos[k * 3 + 2] = v.z;
      uv[k * 2] = ix / nx;
      uv[k * 2 + 1] = 1 - iy / nz;
    }
  }
  // Every normal the same: straight up out of the plane, turned and moved.
  const n = new THREE.Vector3(0, 0, 1).applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(FLAT));
  n.set(Math.fround(n.x), Math.fround(n.y), Math.fround(n.z)).applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(move));
  const nor = new Float32Array(count * 3);
  for (let k = 0; k < count * 3; k += 3) {
    nor[k] = n.x;
    nor[k + 1] = n.y;
    nor[k + 2] = n.z;
  }
  const index = new (count - 1 >= 65535 ? Uint32Array : Uint16Array)(nx * nz * 6);
  for (let iy = 0, t = 0; iy < nz; iy++) {
    for (let ix = 0; ix < nx; ix++) {
      const a = ix + cols * iy;
      const b = ix + cols * (iy + 1);
      const c = ix + 1 + cols * (iy + 1);
      const e = ix + 1 + cols * iy;
      index[t++] = a;
      index[t++] = b;
      index[t++] = e;
      index[t++] = b;
      index[t++] = c;
      index[t++] = e;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setIndex(new THREE.BufferAttribute(index, 1));
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return geo;
}

// Where a sheet's corners are (world x and z, in order), for their heights
// to be read elsewhere (sim/sheetreadings.mjs): exactly where it'll have
// them.
export function sheetXZ(spec) {
  const geo = sheetGeometry(spec);
  const pos = geo.attributes.position;
  const xs = new Float32Array(pos.count);
  const zs = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    xs[i] = pos.getX(i);
    zs[i] = pos.getZ(i);
  }
  geo.dispose();
  return { xs, zs };
}

// Laid on the ground (heightAt, or each corner's height read already:
// heights), `lift` over it.
function groundMesh(geo, heightAt, lift, material, heights) {
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, (heights ? heights[i] : heightAt(pos.getX(i), pos.getZ(i))) + lift);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  mesh.receiveShadow = true;
  return mesh;
}

// A wavy outline, like a real green's: sim/greenshape.mjs, shared with the
// chipping physics so a chip plays the green that's drawn.
export { greenOutline };

// Liner colours tell the cups apart at a glance.
export const CUP_RIMS = { normal: 0xffffff, double: 0xf2c14e, small: 0xe5484d };

// How the cup's wall is drawn, from the surface down (metres). A real cup
// has about an inch of soil above the liner, but from above that inch is
// seen edge-on as a thin dark lip; drawn at its full inch it reads as a dark
// band round the hole, so only a sliver of it is drawn. The liner then runs
// well down so the hole reads as crisp and white-lined, with the dark below
// giving it depth. (The physics keeps its own real depths, sim/cup.mjs.)
export const CUP_LOOK = { lip: 0.007, linerTo: 0.055, floor: 0.104 };

// The cup: a thin dark lip of soil, a bright liner, dark walls below it, a
// floor 10 cm down, tilted to sit square to the surface.
export function makeCup(radius, normal, style = "normal") {
  const cup = new THREE.Group();
  const wall = (top, bottom, material) =>
    cup.add(
      new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, top - bottom, 48, 1, true).translate(0, (top + bottom) / 2, 0),
        material,
      ),
    );
  const { lip, linerTo, floor } = CUP_LOOK;
  // (From just above the surface, so no crack of green shows at the edge.)
  wall(0.001, -lip, new THREE.MeshLambertMaterial({ color: 0x2e241b, side: THREE.BackSide }));
  // The liner glows a little of its own colour, so the side the sun doesn't
  // reach stays white rather than going grey as it did.
  const liner = CUP_RIMS[style] ?? CUP_RIMS.normal;
  wall(-lip, -linerTo, new THREE.MeshLambertMaterial({ color: liner, emissive: liner, emissiveIntensity: 0.55, side: THREE.BackSide }));
  wall(-linerTo, -floor, new THREE.MeshLambertMaterial({ color: 0x2a2622, side: THREE.BackSide }));
  cup.add(
    new THREE.Mesh(
      new THREE.CircleGeometry(radius, 48).rotateX(-Math.PI / 2).translate(0, -floor, 0),
      new THREE.MeshLambertMaterial({ color: 0x1a1714 }),
    ),
  );
  // On Ultra, close up: the cut edge's crumbled soil and roots just inside
  // the lip, and the ferrule's socket in the middle of the floor.
  if (ULTRA) {
    const soil = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.998, radius * 0.998, 0.012, 48, 1, true).translate(0, -0.008, 0),
      new THREE.MeshLambertMaterial({ color: 0x4a3a28, side: THREE.BackSide }),
    );
    const socket = new THREE.Mesh(new THREE.CircleGeometry(0.016, 16).rotateX(-Math.PI / 2).translate(0, -floor + 0.001, 0), new THREE.MeshBasicMaterial({ color: 0x050505 }));
    cup.add(soil, socket);
  }
  // A thin painted ring on the grass round the non-standard cups, so the
  // challenge is obvious from the tee end.
  if (style !== "normal") {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius + 0.02, radius + 0.045, 48).rotateX(-Math.PI / 2).translate(0, 0.004, 0),
      new THREE.MeshBasicMaterial({ color: CUP_RIMS[style], transparent: true, opacity: 0.85 }),
    );
    cup.add(ring);
  }
  cup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
  return cup;
}

// Builds everything round a green into `group`.
//   heightAt(wx, wz), normalAt(wx, wz)
//   green: { cx, cz, rx, rz, seed }  centre and size of the putting surface
//   hole:  { x, z, r, style }        world position and radius of the cup,
//          or null for a green with no hole (holeWorld, cup and flag null)
//   approach: optional { from, to, width } a strip of fairway (world z)
//     leading up to the green, for chipping
//   treeSeed: the ring of trees' own seed, one per green (default seed)
// Returns { holeWorld, inside(wx, wz), cup, flag } where inside says if a point is on the green;
// the flag, for the putting green to take out (sim/flagstick.mjs).
export function buildGreenScene(group, { heightAt, normalAt, green, hole, approach = null, seed = 5, treeSeed = seed }) {
  const rand = seeded(seed);
  // No hole at all (chipping's landing-zone game): no cup, no flag, no cut.
  const cut = hole ? { x: hole.x, z: hole.z, r: hole.r } : null;
  const outline = greenOutline(green.rx, green.rz, green.seed ?? 21);
  const segments = HIGH ? 180 : 120;
  const rings = Math.ceil(Math.max(green.rx, green.rz) / (HIGH ? 0.18 : 0.3));

  // Rough: a fine patch round the green that follows the contours, and a
  // coarse sheet beyond it for the distance.
  // (With the country past the trees painted over it: greenCountry.)
  const rough = withCountry(grassMaterial({ ...GRASS.rough, hole: cut }));
  group.add(groundPatch(90, HIGH ? 0.5 : 1, heightAt, -0.03, rough, green.cx, green.cz));
  // Out to the country, its ground held level past the green's
  // surrounds as it always was within them.
  const level = (x, z) => {
    const d = Math.hypot(x - green.cx, z - green.cz);
    const k = d > 340 ? 340 / d : 1;
    return heightAt(green.cx + (x - green.cx) * k, green.cz + (z - green.cz) * k);
  };
  group.add(groundPatch(2400, 24, level, -0.09, rough, green.cx, green.cz));

  if (approach) {
    const strip = new THREE.PlaneGeometry(approach.width, approach.from - approach.to, Math.ceil(approach.width / 0.5), Math.ceil((approach.from - approach.to) / 0.5));
    strip.rotateX(-Math.PI / 2).translate(0, 0, (approach.from + approach.to) / 2);
    const pos = strip.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, heightAt(pos.getX(i), pos.getZ(i)) - 0.02);
    strip.computeVertexNormals();
    const fairway = { ...GRASS.fairway, stripeWidth: 3, stripeAngle: Math.PI / 2, hole: cut };
    const mesh = new THREE.Mesh(strip, grassMaterial(fairway));
    mesh.receiveShadow = true;
    group.add(mesh);
    // Its edges fade raggedly into the rough, as a course's fairway does,
    // rather than running as straight lines up to the green.
    const w = approach.width / 2;
    group.add(edgeMesh(edgeStrip(rectangle(-w, approach.to, w, approach.from), 3, (x, z) => heightAt(x, z) - 0.02), grassMaterial({ ...fairway, edge: true }), LAYER.fairway));
  }

  group.add(
    ringMesh({
      cx: green.cx, cz: green.cz, outline, inner: 1, innerExtra: -0.05, outerExtra: FRINGE_WIDTH,
      rings: 4, segments, heightAt, lift: -0.012,
      material: grassMaterial({ ...GRASS.fringe, hole: cut }),
    }),
  );
  // Mown in a pattern of its own (from the seed), with a clean-up ring
  // just inside the fringe.
  group.add(
    withRim(
      ringMesh({
        cx: green.cx, cz: green.cz, outline, rings, segments, heightAt, lift: 0,
        material: grassMaterial({ ...GRASS.green, stripeWidth: 1.4, hole: cut, ...mowOptions(mowingFor(seed).green), rim: true }),
      }),
      green.cx, green.cz, outline,
    ),
  );

  // Cup and flag.
  let holeWorld = null;
  let cup = null;
  let cupMark = null;
  let flag = null;
  if (hole) {
    holeWorld = new THREE.Vector3(hole.x, heightAt(hole.x, hole.z), hole.z);
    const normal = normalAt(hole.x, hole.z);
    cup = makeCup(hole.r, normal, hole.style);
    cup.position.copy(holeWorld);
    group.add(cup);
    // The yellow glow and closing circle that point it out (look/cupmark.js),
    // clear of a coloured cup's painted ring.
    cupMark = new CupMark({ at: holeWorld, normal, radius: hole.r, ringIn: hole.style && hole.style !== "normal" ? 0.05 : 0 });
    group.add(cupMark.mesh);
    flag = makeFlag({ height: 2.2 });
    flag.position.copy(holeWorld).add(new THREE.Vector3(0, -0.1, 0));
    group.add(flag);
  }

  // Bunkers either side of the green, lying on the ground.
  const bunkers = [];
  for (const [side, along, bseed] of [
    [1, 0.3, 31],
    [-1, -0.25, 32],
  ]) {
    const a = side > 0 ? 0 : Math.PI;
    const edge = outline(a);
    const bx = green.cx + side * (edge + 4.5);
    const bz = green.cz + along * green.rz * 1.6;
    const brx = 2.6 + rand();
    const bunker = makeBunker(brx, 1.6 + rand() * 0.6, { seed: bseed, y: 0 });
    bunker.position.set(bx, heightAt(bx, bz) - 0.01, bz);
    // What the tufts keep clear of: its widest reach, lobes and all.
    bunkers.push({ x: bx, z: bz, r: brx * 1.25 + 1.2 });
    bunker.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normalAt(bx, bz));
    bunker.rotateY(rand() * Math.PI);
    group.add(bunker);
  }

  // Trees all round at a distance, in clumps with gaps, thicker behind the
  // hole, one gap left where the clubhouse stands (sim/woods.mjs
  // greenRing, seeded per green; addClubhouse).
  const trees = greenRing({ cx: green.cx, cz: green.cz, reach: Math.max(green.rx, green.rz), seed: treeSeed, count: HIGH ? 160 : 90 });
  const ring = makeTrees(trees, { seed, groundY: heightAt });
  group.add(ring);
  if (ring.userData.feet) group.add(ring.userData.feet);
  const country = greenCountry(green, seed, treeSeed, ring.userData.crowns, level, ring.userData.kinds);
  setCountry(rough, country.map);
  if (country.woods) group.add(country.woods);
  // Its surrounds dressed as a course's rough is: heather, gorse, rocks and
  // wildflowers, in a ring between the tufts and the trees, clear of the
  // approach and the sand (sim/dressing.mjs edgeDressing, in the hole
  // frame: world (x, z) is (z, -x) there).
  const inner = Math.max(green.rx, green.rz) + 9;
  const outer = inner + 12;
  const surroundLie = (hx, hz) => {
    const [wx, wz] = [hz, -hx];
    const d = Math.hypot(wx - green.cx, wz - green.cz);
    if (d < inner || d > outer) return "fairway";
    if (approach && Math.abs(wx) < approach.width / 2 + 4 && wz > approach.to - 4) return "fairway";
    if (bunkers.some((b) => Math.hypot(wx - b.x, wz - b.z) < b.r + 2)) return "fairway";
    return "rough";
  };
  const dressed = edgeDressing({
    lieAt: surroundLie,
    zones: [{ x0: -green.cz - outer, x1: -green.cz + outer, z0: green.cx - outer, z1: green.cx + outer }],
    trees: trees.map(([x, z]) => [-z, x]),
    seed: treeSeed,
    heather: 4,
    gorse: 3,
    rocks: 6,
    flowers: 3,
  });
  group.add(makeDressing(dressed, heightAt, { high: HIGH, seed: treeSeed }));
  // Tufts of longer grass in the rough round the green.
  if (HIGH) {
    group.add(
      // (Fewer than there were: the ring as a whole takes about 1800 at
      // the course's thinning, where 3000 filled it to the brim.)
      makeGrassTufts(
        1800,
        (r) => {
          const a = r() * Math.PI * 2;
          const out = r() * 16;
          // Few right by the fringe, fullest a few metres out and thinning
          // again past about 6 m, as round a course's greens: at full
          // density all the way out it stood round the green as a hedge.
          if (r() > tuftChance(out)) return null;
          const d = outline(a) + 2.2 + out;
          const x = green.cx + Math.cos(a) * d;
          const z = green.cz + Math.sin(a) * d;
          if (approach && Math.abs(x) < approach.width / 2 + 1 && z < approach.from && z > approach.to) return null;
          // Never in the sand, nor right at its edge.
          if (bunkers.some((b) => Math.hypot(x - b.x, z - b.z) < b.r)) return null;
          return [x, z];
        },
        { seed: seed + 1, groundY: heightAt },
      ),
    );
  }

  addClubhouse(group, { green, heightAt, seed: treeSeed });

  const inside = (wx, wz) => {
    const dx = wx - green.cx;
    const dz = wz - green.cz;
    return Math.hypot(dx, dz) < outline(Math.atan2(dz, dx)) - 0.1;
  };
  // The cup's hole cut only round the cup, the rest of the ground drawn
  // without it (look/cupcut.js).
  if (cut) cutOnlyNearCup(group);
  return { holeWorld, inside, cup, cupMark, flag };
}

// The practice greens' clubhouse (look/club.js makeClubhouse): behind the
// hole in the gap left for it in the ring of trees (sim/woods.mjs
// CLUBHOUSE_GAP), its front wall this far out from the green's middle past
// the green's reach, turned to face the green - in the upper third of the
// putting and chipping views. Its board reads "Practice Green". It's well
// inside the box the ring of trees gives the sun's shadow map, so it casts.
export const CLUBHOUSE_OUT = 42;
export function addClubhouse(group, { green, heightAt, seed = 1 }) {
  const a = CLUBHOUSE_GAP.angle;
  const d = Math.max(green.rx, green.rz) + CLUBHOUSE_OUT;
  const x = green.cx + Math.cos(a) * d;
  const z = green.cz + Math.sin(a) * d;
  const turn = Math.atan2(-Math.cos(a), -Math.sin(a));
  // On the lowest of its plot's corners (its plinth reaches down past the
  // rest).
  const y = Math.min(...plotCorners(x, z, turn).map(([px, pz]) => heightAt(px, pz)), heightAt(x, z));
  const house = makeClubhouse({ turn, cast: true, board: "Practice Green", high: HIGH, seed });
  house.position.set(x, y, z);
  group.add(house);
  return house;
}
