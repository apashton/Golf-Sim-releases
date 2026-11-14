// Walls in 3D (sim/walls.mjs): one stretch of a bunker's edge built as a
// wall standing straight up out of the sand - stacked turf or timber
// sleepers - or of a pond's bank, standing straight up out of the water -
// timber planks between posts under a cap beam, brick under a stone
// coping, or a natural face of bedded rock (a cliff to the water).
//
// Each wall is a face of upright quads along the wall's line, from the
// ground at its top down to a little below its foot (buried in the sand or
// under the water), and its top: a lip of turf hanging over a turf wall,
// the sleepers' tops, a cap beam and posts, or a coping. The pattern -
// courses of turf and soil, sleepers, planks, brick and mortar - is worked
// out in the shader from how far along the wall and how far down it each
// spot is (on the higher setting with drawn wood grain, brick faces and
// turf over it: look/textures.js), and fades to its average colour as it
// gets smaller than a pixel, so a wall seen from the tee never shimmers on
// a projector. Pond walls are darker and wet for a hand's width above the
// water, with a green scum above that.
//
// The ground can't carry a straight drop - every ground mesh is a grid,
// and a triangle across the wall's line would be a ramp in front of it - so
// the course trims the ground meshes back to the wall's line (trimAlongWall,
// or on real ground cuts them clear of it, cutAlongWall) and lays a strip of
// the ground's own grass along its top (landStrip), which meets the wall
// exactly. Colours are the palette's (look/palette.js). On
// the lower graphics setting the courses, sleepers, planks and bricks are
// the same; only the grain, the per-brick colour and the scum's fading are
// left out.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { NOISE, onLayer, LAYER, grassMaterial, GRASS } from "./grass.js";
import { PALETTE, glsl } from "./palette.js";
import { HIGH } from "./quality.js";
import { detailTextures, LEAN_UV } from "./textures.js";
import { withSceneryHooks } from "./glsl/hooks.js";
import { wallOf, wallAt, wallLine, wallStrip, outlineStrip, wallReach, wallDistance, footSpot, faceRun, REVET, edgeOf, nearestOnEdge, inSpan } from "../sim/walls.mjs";
import { cutOver } from "./dugground.js";
import { rockRelief, rockBed, rockCrack, rockLean, rockFall } from "../sim/rockface.mjs";
import { rockLump } from "./dressing.js";

// Hole frame -> world: (x, z) -> (z, -x); a direction likewise.
const W = ([x, z]) => [z, -x];

// Which look a wall has: a bunker's 0 turf, 1 sleepers; a pond's 0 planks,
// 1 brick, 2 rock.
export const WALL_LOOKS = ["turf", "sleepers", "planks", "brick", "rock"];
export const lookOf = (kind, wall) => (kind === "water" ? (["planks", "brick", "rock"][wall.m ?? 0] ?? "planks") : wall.m === 1 ? "sleepers" : "turf");

// One material per look for the whole page.
const faces = new Map();
export function wallMaterial(look) {
  if (faces.has(look)) return faces.get(look);
  const kind = WALL_LOOKS.indexOf(look);
  const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
  // High: the drawn wood, brick and turf (look/textures.js, shared).
  const uniforms = HIGH ? { tBuilt: detailTextures().tBuilt, tGrass: detailTextures().tGrass } : {};
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        attribute float wAlong;
        attribute float wDown;
        attribute float wUp;
        varying float vAlong;
        varying float vDown;
        varying float vUp;
        varying vec3 vWorldW;
        #if ${kind} == 4
          attribute float wBed;
          attribute float wCrack;
          attribute float wRelief;
          varying float vBed;
          varying float vCrack;
          varying float vRelief;
        #endif`,
      )
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
        vAlong = wAlong;
        vDown = wDown;
        vUp = wUp;
        vWorldW = (modelMatrix * vec4(transformed, 1.0)).xyz;
        #if ${kind} == 4
          vBed = wBed;
          vCrack = wCrack;
          vRelief = wRelief;
        #endif`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        #define WALL_KIND ${kind}
        ${HIGH ? `#define BUILT_FINE\n#define WALL_TEX\nuniform sampler2DArray tBuilt;\nuniform sampler2D tGrass;\nvec2 wLean = vec2(0.0);\nvec2 wUv = vec2(0.0);\n${LEAN_UV}` : ""}
        varying float vAlong;
        varying float vDown;
        varying float vUp;
        varying vec3 vWorldW;
        #if WALL_KIND == 4
          varying float vBed;
          varying float vCrack;
          varying float vRelief;
        #endif
        ${NOISE}
        // A soft band from a to b, never narrower than a pixel or so, so a
        // gap or joint far off blurs into its neighbours rather than
        // flickering on and off.
        float band(float x, float a, float b, float px) {
          return smoothstep(a - px, a + px, x) * (1.0 - smoothstep(b - px, b + px, x));
        }`,
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        {
          // Metres per pixel here, down the wall and along it.
          float pd = max(fwidth(vDown), 1e-4);
          float pa = max(fwidth(vAlong), 1e-4);
          vec3 col;
          #if WALL_KIND == 0
            // Stacked turf: courses 11 cm tall, each the grassy edge of a
            // sod over its soil, the lines between them wavering,
            // each course's foot in shadow where the one above steps back.
            float wob = (gNoise(vec2(vAlong * 1.3, floor(vDown / 0.11) * 7.0)) - 0.5) * 0.03;
            float c = (vDown + wob) / 0.11;
            float course = floor(c);
            float f = fract(c);
            float sod = gHash(vec2(course, floor(vAlong / 0.45 + course * 0.37)));
            vec3 turf = mix(${glsl(PALETTE.sod[0])}, ${glsl(PALETTE.sod[1])}, sod);
            turf *= 0.85 + 0.3 * gNoise(vec2(vAlong * 4.0, vDown * 9.0));
            vec3 soil = ${glsl(PALETTE.sodSeam)} * (0.85 + 0.25 * gNoise(vec2(vAlong * 6.0, vDown * 20.0)));
            float seamPx = pd / 0.11;
            // (The soil most of each course: a revetted face reads brown,
            // its grass a thin line along each sod's top.)
            float seam = smoothstep(0.36 - seamPx, 0.46 + seamPx, f);
            col = mix(turf, soil, seam);
            col *= 1.0 - 0.28 * smoothstep(0.8, 1.0, f);
            // From far off, the courses blur to their average rather than
            // shimmer.
            vec3 avg = mix(${glsl(PALETTE.sod[0])}, ${glsl(PALETTE.sodSeam)}, 0.33) * 0.92;
            col = mix(col, avg, smoothstep(0.02, 0.06, pd));
            // The top course runs into the grass along the top.
            col = mix(col, ${glsl(PALETTE.collar)}, 1.0 - smoothstep(0.03, 0.12, vDown));
          #elif WALL_KIND == 1
            // Railway sleepers laid flat, 22 cm each, dark gaps between,
            // butt joints staggered course to course; bleached grey-brown
            // near the top, darker and greener low down.
            float c = vDown / 0.22;
            float course = floor(c);
            float f = fract(c);
            float run = vAlong / 2.6 + course * 0.47;
            float piece = floor(run);
            float tone = gHash(vec2(course, piece));
            col = mix(${glsl(PALETTE.timber)}, ${glsl(PALETTE.timberWeathered)}, 0.3 + 0.5 * tone);
            #ifdef BUILT_FINE
              float grain = gNoise(vec2(vAlong * 1.2, vDown * 45.0 + piece * 3.0));
              col *= 0.88 + 0.24 * grain * (1.0 - smoothstep(0.01, 0.04, pd));
            #endif
            float gap = 1.0 - band(f, 0.05, 1.0, pd / 0.22);
            float joint = 1.0 - band(fract(run), 0.004, 0.996, pa / 2.6);
            col *= 1.0 - 0.6 * max(gap, joint) * (1.0 - smoothstep(0.03, 0.08, max(pd, pa)));
            col = mix(col, col * vec3(0.8, 0.86, 0.72), 1.0 - smoothstep(0.1, 0.35, vUp));
          #elif WALL_KIND == 2
            // Planks 20 cm wide with dark gaps, each its own shade.
            float c = vDown / 0.2;
            float course = floor(c);
            float f = fract(c);
            float tone = gHash(vec2(course, floor(vAlong / 3.6 + course * 0.31)));
            col = mix(${glsl(PALETTE.timber)}, ${glsl(PALETTE.timberWeathered)}, 0.25 + 0.5 * tone);
            #ifdef BUILT_FINE
              float grain = gNoise(vec2(vAlong * 1.5, vDown * 50.0 + course * 2.0));
              col *= 0.9 + 0.2 * grain * (1.0 - smoothstep(0.01, 0.04, pd));
            #endif
            float gap = 1.0 - band(f, 0.05, 1.0, pd / 0.2);
            col *= 1.0 - 0.55 * gap * (1.0 - smoothstep(0.03, 0.08, pd));
          #elif WALL_KIND == 3
            // Brick in running bond: 22.5 by 7.5 cm with a centimetre of
            // mortar, every other course half a brick along.
            float row = floor(vDown / 0.085);
            float fr = fract(vDown / 0.085);
            float along = vAlong / 0.235 + 0.5 * mod(row, 2.0);
            float fa = fract(along);
            vec3 brick = ${glsl(PALETTE.brick)};
            #ifdef BUILT_FINE
              brick *= 0.86 + 0.28 * gHash(vec2(row, floor(along)));
            #endif
            float mortar = 1.0 - band(fr, 0.12, 1.0, pd / 0.085) * band(fa, 0.043, 1.0, pa / 0.235);
            col = mix(brick, ${glsl(PALETTE.mortar)}, mortar);
            // Far off, brick and mortar blur to their mix.
            col = mix(col, mix(${glsl(PALETTE.brick)}, ${glsl(PALETTE.mortar)}, 0.2), smoothstep(0.01, 0.03, max(pd, pa)));
          #else
            // Rock (sim/rockface.mjs): its beds and cracks as its shape has
            // them - each bed its own grey-brown under broad blotches of
            // weathering and streaks stained down the face; a faint parting
            // here and there at the foot of a bed, the cracks dark down in
            // them; darker the further back the face lies, as recesses are -
            // blurring far off to the face's average.
            float course = floor(vBed);
            float f = fract(vBed);
            col = mix(${glsl(PALETTE.duneStone)}, ${glsl(PALETTE.stone)}, gHash(vec2(course, 4.0)));
            col *= 0.74 + 0.4 * gNoise(vec2(vAlong * 0.15, vDown * 0.3 + 5.0));
            col *= 0.86 + 0.2 * gNoise(vec2(vAlong * 1.1, vDown * 0.07));
            col *= 0.93 + 0.12 * gNoise(vec2(vAlong * 3.0, vDown * 3.0));
            // (The partings only faintly, and not all along: bedding shows in
            // the beds' own shades and their ledges, not drawn lines.)
            float pb = max(fwidth(vBed), 1e-4);
            float parting = (1.0 - band(f, 0.025, 1.0, pb)) * step(0.55, gNoise(vec2(vAlong * 0.5, course * 3.7)));
            float crack = smoothstep(0.35, 0.95, vCrack);
            col *= 1.0 - 0.15 * parting * (1.0 - smoothstep(0.03, 0.09, max(pd, pa))) - 0.25 * crack;
            // Pale lichen here and there, and the odd darker stain.
            col = mix(col, ${glsl(PALETTE.coping)}, 0.35 * smoothstep(0.62, 0.8, gNoise(vec2(vAlong * 0.9, vDown * 0.9 + 3.0))));
            col *= 1.0 - 0.18 * smoothstep(0.6, 0.85, gNoise(vec2(vAlong * 0.4 + 7.0, vDown * 0.12)));
            col *= 0.66 + 0.34 * smoothstep(0.0, 0.5, vRelief);
            col = mix(col, mix(${glsl(PALETTE.duneStone)}, ${glsl(PALETTE.stone)}, 0.5) * 0.8, smoothstep(0.08, 0.22, max(pd, pa)));
          #endif
          #if defined(WALL_TEX) && WALL_KIND != 4
          {
            // (Rock has its own: the drawn concrete read as blocks.)
            // The drawn surface: the turf's blades, each timber's grain
            // (shifted piece to piece, so no two match), the brick's
            // pitted face - fading before it would shimmer, and leaning
            // for the light.
            float k = 1.0 - smoothstep(0.004, 0.03, max(pd, pa));
            vec3 t;
            #if WALL_KIND == 0
              wUv = vec2(vAlong, vDown) / 0.8;
              t = texture2D(tGrass, wUv).rgb;
            #elif WALL_KIND == 3
              wUv = vec2(vAlong, vDown) * 2.0;
              t = texture(tBuilt, vec3(wUv, 4.0)).rgb;
            #else
              wUv = vec2(vAlong + course * 0.37, vDown * 2.0 + course * 0.29);
              t = texture(tBuilt, vec3(wUv, 3.0)).rgb;
            #endif
            // (Brick's face is plain from a distance: it carries more.)
            float amount = WALL_KIND == 3 ? 0.85 : 0.5;
            col *= mix(1.0, 0.45 + 0.75 * t.r, k * amount);
            wLean = vec2(t.g * 2.0 - 1.0, 1.0 - t.b * 2.0) * k * 0.8;
          }
          #endif
          // Broad weathering over the whole wall.
          col *= 0.92 + 0.16 * gNoise(vWorldW.xz * 0.3 + vWorldW.y);
          #if WALL_KIND >= 2
            // A pond's wall: dark and wet for a hand's width above the
            // water, a green scum above that, and dark below it.
            float wet = 1.0 - smoothstep(0.0, 0.08, vUp);
            #ifdef BUILT_FINE
              float scum = (1.0 - smoothstep(0.05, 0.16, vUp)) * (0.6 + 0.4 * gNoise(vec2(vAlong * 3.0, 1.0)));
            #else
              float scum = 1.0 - step(0.13, vUp);
            #endif
            col = mix(col, ${glsl(PALETTE.algae)}, 0.55 * scum);
            col *= 1.0 - 0.5 * wet;
          #else
            // A bunker's wall is darker where it meets the sand.
            col *= 1.0 - 0.25 * (1.0 - smoothstep(0.0, 0.15, vUp));
          #endif
          diffuseColor.rgb *= pow(col, vec3(2.2));
        }`,
      )
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>${HIGH ? "\nnormal = leanUv(normal, vViewPosition, wUv, wLean, 0.6);" : ""}`);
  };
  material.customProgramCacheKey = () => `wall-v3-${look}-${HIGH ? "h" : "s"}`;
  withSceneryHooks(material, "wall");
  faces.set(look, material);
  return material;
}

// Timber (sleeper tops, posts, a cap beam) and stone (a coping): plain
// lit colours per piece, shaded a little each.
let pieceMaterial = null;
function piecesMaterial() {
  pieceMaterial ??= withSceneryHooks(new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors: true, side: THREE.DoubleSide }), "wall");
  return pieceMaterial;
}

// A wall's face: upright quads along `strip` (sim/walls.mjs outlineStrip,
// hole frame), from topAt(i) down to bottomAt(i) (world heights), its foot
// `lean` metres further in than its top (a turf wall steps back as it goes
// up; or lean(i), at each point). refAt(i): the height its wetness and
// shading is measured from - the water, or the sand at its foot.
export function faceGeometry(strip, topAt, bottomAt, refAt, lean = 0) {
  const n = strip.length;
  const pos = new Float32Array(n * 2 * 3);
  const nrm = new Float32Array(n * 2 * 3);
  const along = new Float32Array(n * 2);
  const down = new Float32Array(n * 2);
  const up = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    const { p, in: dir } = strip[i];
    const top = topAt(i);
    const bottom = Math.min(bottomAt(i), top - 0.01);
    const ref = refAt(i);
    const [tx, tz] = W(p);
    const k = typeof lean === "function" ? lean(i) : lean;
    const [bx, bz] = W([p[0] + dir[0] * k, p[1] + dir[1] * k]);
    const [nx, nz] = W(dir);
    // Facing in, tipped up a little if it leans.
    const tip = k / Math.max(0.1, top - bottom);
    const l = Math.hypot(nx, nz, tip) || 1;
    for (const [k, x, y, z] of [
      [0, tx, top, tz],
      [1, bx, bottom, bz],
    ]) {
      const j = i * 2 + k;
      pos.set([x, y, z], j * 3);
      nrm.set([nx / l, tip / l, nz / l], j * 3);
      along[j] = strip[i].along;
      down[j] = top - y;
      up[j] = y - ref;
    }
  }
  const index = [];
  for (let i = 0; i < n - 1; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    index.push(a, b, c, c, b, d);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(nrm, 3));
  geo.setAttribute("wAlong", new THREE.BufferAttribute(along, 1));
  geo.setAttribute("wDown", new THREE.BufferAttribute(down, 1));
  geo.setAttribute("wUp", new THREE.BufferAttribute(up, 1));
  geo.setIndex(facing(index, pos, nrm));
  return geo;
}

// A rock face (sim/rockface.mjs): along `strip` as faceGeometry, a mesh of
// rows `row` metres apart down it, each point standing out over the water
// by the rock's relief there and the face leaning back as it does there
// (rockLean), lit by its own shape. It carries, for the paint, which bed
// each point is in, how much of a crack, and how far out it stands.
export function rockFaceGeometry(strip, topAt, bottomAt, refAt, seed = 0, row = 0.25) {
  const n = strip.length;
  let tallest = 0;
  for (let i = 0; i < n; i++) tallest = Math.max(tallest, topAt(i) - bottomAt(i));
  const rows = Math.max(2, Math.ceil(tallest / row) + 1);
  const count = n * rows;
  const pos = new Float32Array(count * 3);
  const nrm = new Float32Array(count * 3);
  const attrs = { wAlong: new Float32Array(count), wDown: new Float32Array(count), wUp: new Float32Array(count), wBed: new Float32Array(count), wCrack: new Float32Array(count), wRelief: new Float32Array(count) };
  for (let i = 0; i < n; i++) {
    const { p, in: dir, along } = strip[i];
    const top = topAt(i);
    const bottom = Math.min(bottomAt(i), top - 0.01);
    const ref = refAt(i);
    const [nx, nz] = W(dir);
    const lean = rockLean(along, seed);
    for (let r = 0; r < rows; r++) {
      const t = r / (rows - 1);
      const y = top - t * (top - bottom);
      const down = top - y;
      const relief = rockRelief(along, down, seed);
      const out = lean * t + relief;
      const [x, z] = W([p[0] + dir[0] * out, p[1] + dir[1] * out]);
      const j = i * rows + r;
      pos.set([x, y, z], j * 3);
      nrm.set([nx, 0, nz], j * 3);

      attrs.wAlong[j] = along;
      attrs.wDown[j] = down;
      attrs.wUp[j] = y - ref;
      attrs.wBed[j] = rockBed(along, down, seed);
      attrs.wCrack[j] = rockCrack(along, down, seed);
      attrs.wRelief[j] = relief;
    }
  }
  const index = [];
  for (let i = 0; i < n - 1; i++) {
    for (let r = 0; r < rows - 1; r++) {
      const a = i * rows + r;
      const b = a + 1;
      const c = a + rows;
      const d = c + 1;
      index.push(a, b, c, c, b, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  for (const [name, a] of Object.entries(attrs)) geo.setAttribute(name, new THREE.BufferAttribute(a, 1));
  // Wound to face out over the water, then lit by its own shape.
  geo.setIndex(facing(index, pos, nrm));
  geo.computeVertexNormals();
  return geo;
}

// A triangle list wound so its faces point the way the normals do (front
// faces only are drawn).
function facing(index, pos, nrm) {
  if (index.length < 3) return index;
  const v = (i) => new THREE.Vector3(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
  const [a, b, c] = index;
  const n = v(b).sub(v(a)).cross(v(c).sub(v(a)));
  const want = new THREE.Vector3(nrm[a * 3], nrm[a * 3 + 1], nrm[a * 3 + 2]);
  if (n.dot(want) >= 0) return index;
  const out = index.slice();
  for (let i = 0; i < out.length; i += 3) [out[i + 1], out[i + 2]] = [out[i + 2], out[i + 1]];
  return out;
}

// A strip of ground along `strip`, from offsets[0] to the last (metres in
// from the line: negative is out, on the land side), each point at
// heightAt(x, z, i) (hole frame; i the strip point it's across from) +
// lift, facing up.
export function stripGeometry(strip, offsets, heightAt, lift = 0) {
  const n = strip.length;
  const cols = offsets.length;
  const pos = new Float32Array(n * cols * 3);
  for (let i = 0; i < n; i++) {
    const { p, in: dir } = strip[i];
    for (let k = 0; k < cols; k++) {
      const q = [p[0] + dir[0] * offsets[k], p[1] + dir[1] * offsets[k]];
      const [x, z] = W(q);
      pos.set([x, heightAt(q[0], q[1], i) + lift, z], (i * cols + k) * 3);
    }
  }
  const index = [];
  for (let i = 0; i < n - 1; i++) {
    for (let k = 0; k < cols - 1; k++) {
      const a = i * cols + k;
      const b = (i + 1) * cols + k;
      index.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();
  // Facing up.
  const nrm = geo.attributes.normal;
  let upness = 0;
  for (let i = 0; i < nrm.count; i++) upness += nrm.getY(i);
  if (upness < 0) {
    for (let i = 0; i < index.length; i += 3) [index[i + 1], index[i + 2]] = [index[i + 2], index[i + 1]];
    geo.setIndex(index);
    geo.computeVertexNormals();
  }
  return geo;
}

// Boxes for the pieces along a wall's top (hole frame in, world out), with
// a colour each: { at: [x, z], along: [ux, uz] (unit), long, wide, y0, y1,
// colour }. One mesh for them all.
function piecesGeometry(pieces) {
  const pos = [];
  const nrm = [];
  const col = [];
  const index = [];
  for (const b of pieces) {
    const [ux, uz] = b.along;
    const [vx, vz] = [-uz, ux];
    const corner = (su, sv) => [b.at[0] + ux * su * b.long * 0.5 + vx * sv * b.wide * 0.5, b.at[1] + uz * su * b.long * 0.5 + vz * sv * b.wide * 0.5];
    const c = new THREE.Color(b.colour);
    // Top, and the four sides.
    const faceOf = (quad, normal) => {
      const base = pos.length / 3;
      for (const q of quad) {
        pos.push(...q);
        nrm.push(...normal);
        col.push(c.r, c.g, c.b);
      }
      index.push(base, base + 1, base + 2, base, base + 2, base + 3);
    };
    const P = (su, sv, y) => {
      const [x, z] = W(corner(su, sv));
      return [x, y, z];
    };
    const dirW = (hx, hz) => {
      const [x, z] = W([hx, hz]);
      return [x, 0, z];
    };
    faceOf([P(-1, -1, b.y1), P(-1, 1, b.y1), P(1, 1, b.y1), P(1, -1, b.y1)], [0, 1, 0]);
    faceOf([P(1, -1, b.y0), P(1, -1, b.y1), P(1, 1, b.y1), P(1, 1, b.y0)], dirW(ux, uz));
    faceOf([P(-1, 1, b.y0), P(-1, 1, b.y1), P(-1, -1, b.y1), P(-1, -1, b.y0)], dirW(-ux, -uz));
    faceOf([P(1, 1, b.y0), P(1, 1, b.y1), P(-1, 1, b.y1), P(-1, 1, b.y0)], dirW(vx, vz));
    faceOf([P(-1, -1, b.y0), P(-1, -1, b.y1), P(1, -1, b.y1), P(1, -1, b.y0)], dirW(-vx, -vz));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  // Wound either way; the normals say which way each faces, and both
  // sides are drawn (a box seen from outside only ever shows its outsides).
  geo.setIndex(index);
  return geo;
}

// A little shading per piece: a hash of where it is.
const shade = (hex, x, z, amount = 0.12) => {
  const h = Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1;
  const c = new THREE.Color(hex);
  return c.multiplyScalar(1 - amount + 2 * amount * h).getHex();
};

// A pond's Rock wall edge (sim/rockface.mjs): its face - a point every 12
// cm along it and down it on the higher setting, 20 cm otherwise - from
// the ground at its top to under the water, and the rock fallen from it
// lying in the water at its foot (rockFall). Meshes, world frame.
function rockFace(s, heightAt, level) {
  const seed = Math.round((s.x ?? 0) * 7 + (s.z ?? 0) * 13);
  const step = HIGH ? 0.12 : 0.2;
  const strip = wallStrip(s, step);
  const total = strip[strip.length - 1].along;
  const at = (q, d) => [q.p[0] + q.in[0] * d, q.p[1] + q.in[1] * d];
  const top = strip.map((q) => heightAt(...at(q, -0.06)));
  const out = [];
  // Where the ground stands over the water: the face, in stretches.
  let run = [];
  const flush = () => {
    if (run.length >= 2) {
      const geo = rockFaceGeometry(
        run.map((i) => strip[i]),
        (j) => top[run[j]],
        () => level - 0.3,
        () => level,
        seed,
        step,
      );
      const face = new THREE.Mesh(geo, wallMaterial("rock"));
      face.castShadow = true;
      face.receiveShadow = true;
      out.push(face);
    }
    run = [];
  };
  strip.forEach((_, i) => (top[i] - level > 0.04 ? run.push(i) : flush()));
  flush();
  // Fallen rock: lumps of the stone, half in the water, clear of the face.
  const tall = Math.max(0, ...top) - level;
  const fall = rockFall(total, tall, seed);
  if (fall.length) {
    const shapes = [11, 17, 23, 29].map((sd, i) => rockLump(sd, { rough: 0.2 + 0.04 * i, planes: 2 + i }));
    const stone = new THREE.Color(PALETTE.duneStone);
    const parts = [];
    for (const b of fall) {
      let i = 0;
      while (i < strip.length - 1 && strip[i].along < b.along) i++;
      const q = strip[i];
      // (Out past the face at the water there, however it stands out.)
      const foot = Math.max(0, heightAt(...at(q, -0.06)) - level);
      const clear = rockRelief(b.along, foot, seed) + rockLean(b.along, seed) + b.size * 0.55;
      const [x, z] = W(at(q, Math.max(b.out, clear)));
      const g = shapes[b.shape % shapes.length].clone();
      // (Standing well up out of the water: sunk only a little.)
      g.scale(b.size, b.size * 0.85, b.size * 0.95);
      g.rotateY(b.turn);
      g.translate(x, level - b.size * 0.12, z);
      const col = g.attributes.color;
      for (let v = 0; v < col.count; v++) col.setXYZ(v, col.getX(v) * stone.r, col.getY(v) * stone.g, col.getZ(v) * stone.b);
      parts.push(g);
    }
    const rocks = new THREE.Mesh(mergeGeometries(parts), withSceneryHooks(new THREE.MeshLambertMaterial({ vertexColors: true }), "rock"));
    rocks.castShadow = true;
    rocks.receiveShadow = true;
    out.push(rocks);
  }
  return out;
}

// Everything for one wall: its face and top, as a group, plus `strip` (the
// line, hole frame) for cutting the ground along it. For a bunker (`kind`
// "bunker") or a pond ("water"):
//   heightAt(x, z)   the ground as play has it (hole frame), to find the
//                    wall's top (the ground just behind it) and the sand
//                    at its foot
//   level            a pond's water level (or, a brook's, its level at
//                    (x, z): a function)
//   faceIn(p, i)     optional: how much further in (metres) the face stands
//                    at strip point p - where a bunker's sand is drawn onto
//                    the green, the wall stands at the green's edge
export function makeWall(s, kind, { heightAt, level = 0, faceIn = null }) {
  const wall = wallOf(s);
  if (!wall) return null;
  const look = lookOf(kind, wall);
  const strip = wallStrip(s, 0.25).map((q, i) => {
    const k = faceIn ? faceIn(q.p, i) : 0;
    return k ? { ...q, p: [q.p[0] + q.in[0] * k, q.p[1] + q.in[1] * k] } : q;
  });
  const at = (q, k) => [q.p[0] + q.in[0] * k, q.p[1] + q.in[1] * k];
  const top = strip.map((q) => heightAt(...at(q, -0.06)));
  const pond = kind === "water";
  // (A pot's face leans back as revetting is built - sim/walls.mjs
  // faceRun - its foot that much further in.)
  const leans = pond ? 0 : faceRun(s);
  // (A brook's water falls along it: its level a function of where.)
  const levelAt = typeof level === "function" ? level : () => level;
  const foot = strip.map((q) => (pond ? levelAt(...q.p) : heightAt(...at(q, Math.max(0.25, leans + 0.05)))));
  const group = new THREE.Group();
  // The face: down to a little under the sand (or the water), leaning back
  // as it goes up if it's turf.
  // (A bunker's all the way to its ends, however little it drops there:
  // the sand by it is drawn at its foot, a few centimetres under the
  // collar - sim/bunkerlook.mjs rimTuck - and where the face stopped
  // short, the sky showed through the slit at each end.)
  const keep = strip.map((_, i) => !pond || top[i] - foot[i] > 0.04);
  const runs = [];
  let run = null;
  keep.forEach((k, i) => {
    if (k) (run ??= []).push(i);
    else if (run) {
      runs.push(run);
      run = null;
    }
  });
  if (run) runs.push(run);
  for (const r of runs) {
    if (r.length < 2) continue;
    const part = r.map((i) => strip[i]);
    if (look === "rock") continue;
    const geo = faceGeometry(
      part,
      (j) => top[r[j]],
      (j) => foot[r[j]] - (pond ? 0.3 : 0.1),
      (j) => foot[r[j]],
      // (A pot's, at the angle it's built at however tall it is there: it
      // dies away towards its ends.)
      look !== "turf" ? 0 : leans > 0.1 ? (j) => Math.max(0.08, Math.min(leans, (top[r[j]] - foot[r[j]]) / Math.tan((REVET.angle * Math.PI) / 180))) : 0.08,
    );
    const face = new THREE.Mesh(geo, wallMaterial(look));
    face.castShadow = true;
    face.receiveShadow = true;
    group.add(face);
  }
  // Its top.
  const pieces = [];
  const dirAt = (i) => {
    const a = strip[Math.max(0, i - 1)].p;
    const b = strip[Math.min(strip.length - 1, i + 1)].p;
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  };
  if (look === "rock") {
    // A rock face, shaped (sim/rockface.mjs), and rock fallen from it; no
    // top: the grass runs to the rock's edge.
    for (const m of rockFace(s, heightAt, levelAt(...strip[Math.floor(strip.length / 2)].p))) group.add(m);
  } else if (look === "turf" && leans > 0.1) {
    // (A pot's: none - the ground's own grass, laid up to the wall
    // (landStrip), runs straight over its top course, as on a links; a
    // lip of the collar's brighter grass stood out round it as a band.)
  } else if (look === "turf") {
    // A lip of turf over the top course, hanging a few centimetres out.
    const geo = stripGeometry(strip, [0.06, 0, -0.22], (x, z, i) => top[i], 0.012);
    const lipTop = geo.attributes.position;
    // The outer edge droops.
    for (let i = 0; i < strip.length; i++) lipTop.setY(i * 3, lipTop.getY(i * 3) - 0.035);
    geo.computeVertexNormals();
    const lip = new THREE.Mesh(geo, turfLip());
    lip.receiveShadow = true;
    lip.castShadow = true;
    group.add(lip);
  } else {
    // Sleepers' tops, a cap beam, a coping: lengths along the top, each a
    // piece of its own shade. Posts along a timber pond wall.
    const len = look === "sleepers" ? 1.3 : look === "brick" ? 0.9 : 1.8;
    const wide = look === "sleepers" ? 0.22 : look === "brick" ? 0.3 : 0.25;
    const out = look === "brick" ? 0.03 : 0.02;
    const tall = look === "sleepers" ? 0.02 : 0.08;
    const colour = look === "brick" ? PALETTE.coping : PALETTE.timberWeathered;
    const total = strip[strip.length - 1].along;
    for (let d = 0; d < total - 0.05; d += len) {
      const i0 = strip.findIndex((q) => q.along >= d);
      const i1 = Math.max(i0 + 1, strip.findIndex((q) => q.along >= Math.min(total, d + len)));
      const a = strip[i0];
      const b = strip[Math.min(strip.length - 1, i1 < 0 ? strip.length - 1 : i1)];
      const mid = [(a.p[0] + b.p[0]) / 2, (a.p[1] + b.p[1]) / 2];
      const dir = [(b.p[0] - a.p[0]), (b.p[1] - a.p[1])];
      const l = Math.hypot(...dir) || 1;
      const inn = a.in;
      const centre = [mid[0] - inn[0] * (wide / 2 - out), mid[1] - inn[1] * (wide / 2 - out)];
      const y = Math.max(top[i0], top[Math.min(top.length - 1, i1 < 0 ? top.length - 1 : i1)]);
      pieces.push({ at: centre, along: [dir[0] / l, dir[1] / l], long: l + 0.01, wide, y0: y - 0.12, y1: y + tall, colour: shade(colour, centre[0], centre[1]) });
    }
    if (look === "planks") {
      // Posts every 1.8 m, standing a little proud of the planks and the
      // cap.
      for (let d = 0.3; d < total; d += 1.8) {
        const i = strip.findIndex((q) => q.along >= d);
        if (i < 0) break;
        const q = strip[i];
        const c = [q.p[0] + q.in[0] * -0.05, q.p[1] + q.in[1] * -0.05];
        pieces.push({ at: c, along: dirAt(i), long: 0.16, wide: 0.16, y0: foot[i] - 0.3, y1: top[i] + 0.12, colour: shade(PALETTE.timber, c[0], c[1], 0.15) });
      }
    }
    const mesh = new THREE.Mesh(piecesGeometry(pieces), piecesMaterial());
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  group.userData.strip = strip;
  return group;
}

// The turf along a turf wall's top: the collar's grass, with its patches
// and speckle (as look/sandwater.js lipMaterial), but solid. A plain flat
// colour here read as a straight-edged ledge in the grass above the wall.
let lipMat = null;
function turfLip() {
  if (lipMat) return lipMat;
  lipMat = grassMaterial({ ...GRASS.rough, light: PALETTE.collar, dark: PALETTE.collar, patch: 0.4, patchScale: 0.3, detail: 1, detailScale: 0.6, layer: LAYER.lip });
  return lipMat;
}

// Takes out of a ground mesh (world coordinates) every triangle with a
// corner on the low side of a wall within `reach` metres of its line - the
// triangles that would lie across the wall as a ramp. The ground on the
// high side is laid again exactly up to the wall by landStrip.
// (Only along the wall itself: past its ends the edge is an ordinary one,
// and cutting round them left a hole in the bank there.)
export function cutAlongWall(geo, s, reach, inside) {
  const wall = wallOf(s);
  if (!wall) return geo;
  const o = edgeOf(s);
  return cutOver(geo, (wx, wz) => {
    const x = -wz;
    const z = wx;
    return wallDistance(s, x, z, reach) <= reach && inside(x, z) && inSpan(nearestOnEdge(o, x, z).t, wall.a);
  });
}

// The same, but trimmed along the wall's line itself rather than losing
// whole triangles (which left a staircase of lighter and darker grass
// beside the wall): a triangle reaching across the wall keeps its corners
// on the high side, and those on the low side are brought onto the wall's
// line, just on its high side, and laid on the ground there again
// (`heightAt(wx, wz) + lift`, as the mesh was made). They're moved as new
// corners of that triangle alone, so the triangles round them - down under
// the sand - stay where they were. A triangle with no corner on the high
// side goes, as does one reaching past the wall's end into the bunker.
export function trimAlongWall(geo, s, reach, inside, heightAt, lift = 0) {
  return trimAlongWalls(geo, [s], reach, () => inside, heightAt, lift);
}

// trimAlongWall for each of `shapes` in turn (`inside(s)` its inside), the
// very same - but each wall looks only at the triangles with a corner near
// it, in their order, rather than the whole mesh (most of a hole's ground,
// for every one of a links hole's dozen pots: each pass, and the mesh's
// corners re-listed after it, was a third of a second of the page held as
// a hole was built ahead - the owner's report, 20 October 2026). The
// triangles are kept in their places (`slots`) as walls take some out and
// bring others' corners up to their line, and listed again only once, at
// the end.
export function trimAlongWalls(geo, shapes, reach, insideOf, heightAt, lift = 0) {
  const walled = shapes.filter((s) => wallOf(s));
  if (!walled.length) return geo;
  const slots = Int32Array.from(geo.index.array);
  const tris = slots.length / 3;
  const gone = new Uint8Array(tris);
  // Which triangles have a corner near each wall's line (its box and 2.5 m
  // round it, as `far` below has it), from where the corners first are;
  // and those a wall has changed, which later walls look at again too.
  const near = nearWalls(geo.attributes.position, slots, walled.map((s) => wallLine(s)?.box ?? null));
  const changed = new Set();
  walled.forEach((s, w) => {
    const all = near[w] ? [...new Set([...near[w], ...changed])].sort((a, b) => a - b) : Array.from({ length: tris }, (_, t) => t);
    wallPass(geo, s, reach, insideOf(s), heightAt, lift, slots, gone, all, changed);
  });
  const keep = [];
  for (let t = 0; t < tris; t++) if (!gone[t]) keep.push(slots[t * 3], slots[t * 3 + 1], slots[t * 3 + 2]);
  geo.setIndex(keep);
  geo.computeBoundingSphere();
  return geo;
}

// For each wall's box (null: none), the triangles (by slot, in order) with
// a corner inside it or within 2.5 m of it - each corner tried against
// every box once, as bits, thirty boxes at a time - or null for no box.
function nearWalls(pos, slots, boxes) {
  const tris = slots.length / 3;
  const lists = boxes.map((b) => (b ? [] : null));
  const n = pos.count;
  for (let from = 0; from < boxes.length; from += 30) {
    const group = boxes.slice(from, from + 30);
    const bits = new Int32Array(n);
    for (let i = 0; i < n; i++) {
      const x = -pos.getZ(i);
      const z = pos.getX(i);
      let m = 0;
      group.forEach((b, k) => {
        if (b && !(x < b.x0 - 2.5 || x > b.x1 + 2.5 || z < b.z0 - 2.5 || z > b.z1 + 2.5)) m |= 1 << k;
      });
      bits[i] = m;
    }
    for (let t = 0; t < tris; t++) {
      let m = bits[slots[t * 3]] | bits[slots[t * 3 + 1]] | bits[slots[t * 3 + 2]];
      while (m) {
        const k = 31 - Math.clz32(m & -m);
        lists[from + k].push(t);
        m &= m - 1;
      }
    }
  }
  return lists;
}

// One wall's turn (trimAlongWalls): the triangles `list` (slots, in order)
// looked at, each kept as it is, taken out (`gone`) or with its corners on
// the wall's low side brought onto its line as new corners of its own.
function wallPass(geo, s, reach, inside, heightAt, lift, slots, gone, list, changed) {
  const wall = wallOf(s);
  const o = edgeOf(s);
  const pos = geo.attributes.position;
  const hole = (i) => [-pos.getZ(i), pos.getX(i)];
  // Each corner within a couple of metres of the wall: whether it's in the
  // shape, and whether it's on the wall's low side.
  const seen = new Map();
  // (A corner nowhere near the wall: far from it, without asking.)
  const box = wallLine(s)?.box;
  const FAR = { d: Infinity, inside: false, low: false };
  const where = (i) => {
    const px = pos.getX(i);
    const pz = pos.getZ(i);
    if (box && (-pz < box.x0 - 2.5 || -pz > box.x1 + 2.5 || px < box.z0 - 2.5 || px > box.z1 + 2.5)) return FAR;
    if (seen.has(i)) return seen.get(i);
    const [x, z] = hole(i);
    const d = wallDistance(s, x, z, 2.5);
    const inn = d <= 2.5 && inside(x, z);
    const w = { d, inside: inn, low: inn && inSpan(nearestOnEdge(o, x, z).t, wall.a) };
    seen.set(i, w);
    return w;
  };
  const inWall = (i) => where(i).low;
  const near = (i) => where(i).low && where(i).d <= reach;
  // A triangle reaching across the wall's line, however far its corners are
  // from it.
  const across = (tri) => tri.some(near) || (tri.some((i) => where(i).low) && tri.some((i) => where(i).d <= 2.5 && !where(i).inside));
  const pts = wallLine(s).pts;
  const onLine = ([x, z]) => {
    let best = Infinity;
    let at = null;
    for (let k = 1; k < pts.length; k++) {
      const [ax, az] = pts[k - 1];
      const [bx, bz] = pts[k];
      const dx = bx - ax;
      const dz = bz - az;
      const len2 = dx * dx + dz * dz || 1;
      const u = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / len2));
      const d = (ax + dx * u - x) ** 2 + (az + dz * u - z) ** 2;
      if (d < best) {
        best = d;
        at = [ax + dx * u, az + dz * u];
      }
    }
    // A couple of centimetres on past the line, onto the high side.
    const d = Math.sqrt(best) || 1;
    return W([at[0] + ((at[0] - x) / d) * 0.02, at[1] + ((at[1] - z) / d) * 0.02]);
  };
  const names = Object.keys(geo.attributes);
  const added = names.map(() => []);
  const moved = [];
  let next = pos.count;
  // (Quickly, a triangle with every corner well clear of the wall's box
  // kept as it is, as it would be: across finds each corner FAR.)
  const far = box ? (i) => {
    const px = pos.getX(i);
    const pz = pos.getZ(i);
    return -pz < box.x0 - 2.5 || -pz > box.x1 + 2.5 || px < box.z0 - 2.5 || px > box.z1 + 2.5;
  } : () => false;
  for (const t of list) {
    if (gone[t]) continue;
    const tri = [slots[t * 3], slots[t * 3 + 1], slots[t * 3 + 2]];
    if (far(tri[0]) && far(tri[1]) && far(tri[2])) continue;
    if (!across(tri)) continue;
    // Nothing on the high side, or a corner down in the bunker past the
    // wall's end (brought up to the wall, it would stand over the sand).
    if (tri.every((i) => inside(...hole(i))) || tri.some((i) => inside(...hole(i)) && !inWall(i))) {
      gone[t] = 1;
      continue;
    }
    // Nor one that, brought up to the wall, would reach in over the sand
    // past the wall's end - a corner brought to the wall's end, the
    // triangle from there cut across the curve of the edge beyond it, a
    // blade of grass standing over the sand (landStrip lays the ground
    // there again).
    const at = tri.map((i) => (inWall(i) ? fromWorld(onLine(hole(i))) : hole(i)));
    if (pastWallEnd(o, wall, at)) {
      gone[t] = 1;
      continue;
    }
    tri.forEach((i, c) => {
      if (!inWall(i)) return;
      names.forEach((n, k) => {
        const a = geo.attributes[n];
        for (let e = 0; e < a.itemSize; e++) added[k].push(a.array[i * a.itemSize + e]);
      });
      moved.push([next, onLine(hole(i))]);
      slots[t * 3 + c] = next++;
      changed.add(t);
    });
  }
  if (moved.length) {
    names.forEach((n, k) => {
      const a = geo.attributes[n];
      const arr = new a.array.constructor(a.array.length + added[k].length);
      arr.set(a.array);
      arr.set(added[k], a.array.length);
      geo.setAttribute(n, new THREE.BufferAttribute(arr, a.itemSize, a.normalized));
    });
    const p = geo.attributes.position;
    for (const [i, [wx, wz]] of moved) p.setXYZ(i, wx, heightAt(wx, wz) + lift, wz);
  }
}

// Whether a triangle (hole frame, its corners) reaches more than a few
// centimetres in over a shape's edge anywhere but along its wall (`o` its
// edgeOf): tried at its middle and along its sides.
export function pastWallEnd(o, wall, corners) {
  const at = (x, z) => {
    const near = nearestOnEdge(o, x, z);
    return near.inside && near.d > 0.05 && !inSpan(near.t, wall.a);
  };
  const [a, b, c] = corners;
  if (at((a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3)) return true;
  for (const [p, q] of [[a, b], [b, c], [c, a]]) {
    for (const f of [0.25, 0.5, 0.75]) if (at(p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f)) return true;
  }
  return false;
}
const fromWorld = ([wx, wz]) => [-wz, wx];

// The ground along a wall's top on the land side, from the wall out to
// `width` metres, running on `ext` metres past each end: in the ground's
// own material, so it can't be told from the ground it covers, and
// meeting the wall exactly where the cut ground (cutAlongWall) wouldn't.
// `inward` lays it on the low side instead (a pond's bank past the wall's
// ends, on real ground, where nothing else covers the cut).
export function landStrip(s, { width, ext = 1, heightAt, lift = 0, material, faceIn = null, inward = false }) {
  const a = wallReach(s, ext);
  if (!a) return null;
  const strip = outlineStrip(s, a, 0.3).map((q) => {
    const k = faceIn ? faceIn(q.p) : 0;
    return k ? { ...q, p: [q.p[0] + q.in[0] * k, q.p[1] + q.in[1] * k] } : q;
  });
  const cols = [0, -0.1, -width * 0.35, -width * 0.7, -width].map((c) => (inward ? -c : c));
  const mesh = new THREE.Mesh(stripGeometry(strip, cols, heightAt, lift), material);
  mesh.receiveShadow = true;
  return mesh;
}

// The ground's height for sand or a bank drawn next to a wall (hole frame):
// by the wall, the height at its foot, so nothing drawn climbs the face.
// `taper` (a bunker's sand): only as far down as the wall drops there -
// none at its very ends, where it eases into the ordinary edge (sim/
// walls.mjs wallAt's wn), so the sand meets the edge beyond them; dropped
// to the foot right to the end, a notch opened at each end of a pot's
// wall, the sky showing through it.
export function besideWall(s, heightAt, { taper = false } = {}) {
  if (!wallOf(s)) return heightAt;
  return (x, z) => {
    const q = footSpot(s, x, z);
    if (!q) return heightAt(x, z);
    const h = heightAt(x, z);
    const foot = Math.min(h, heightAt(q[0], q[1]));
    return taper ? h + (foot - h) * wallAt(s, x, z).wn : foot;
  };
}
