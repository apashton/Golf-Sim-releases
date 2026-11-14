// The ground of a hole rebuilt from a map: one mesh draped over the real
// terrain, coloured by what's where. The hole's lie raster (0.5 m cells, see
// lieRaster in sim/course.mjs) becomes two small textures, a channel per
// surface, and the grass shader blends them: rough underneath, deep rough
// and woods floor, fairway with its mowing stripes and a ragged first-cut
// edge, tees, fringes, greens and sand with crisp edges.
//
// The same recipe as the other grass (look/glsl/ground.js, as grass.js
// uses it): colour by world position, hue patches, blade detail close to.

import * as THREE from "three";
import { grassDetail, onLayer, LAYER, ROUGH_CLUMPS, DEEP_CLUMPS, GRASS } from "./grass.js";
import { NOISE, GROUND, GROUND_KEY, groundUniforms, mowingFor, leanNormal } from "./glsl/ground.js";
import { detailTextures } from "./textures.js";
import { LIE_CODES } from "../sim/course.mjs";
import { SAND_GLSL } from "./sandwater.js";
import { HIGH, PHONE } from "./quality.js";
import { PALETTE, glslLinear } from "./palette.js";
import { withSceneryHooks } from "./glsl/hooks.js";
import { markCupCut } from "./cupcut.js";
import { ringAxis, SKIRT } from "../sim/country.mjs";

// The palette's grass as shader constants, so a mapped hole is painted in
// exactly the colours of a designed one (test/palette.test.mjs checks) - in
// linear light, as the designed holes' grass is worked in (its colours are
// three.js colours), so the ground's recipe (look/glsl/ground.js) gives the
// same grass on both.
const P = PALETTE;
export const MAPPED_COLOURS = /* glsl */ `
  const vec3 P_ROUGH = ${glslLinear(P.rough[0])};
  const vec3 P_DEEP = ${glslLinear(P.deep)};
  const vec3 P_WOODS = ${glslLinear(P.woodsFloor)};
  const vec3 P_FAIRWAY = ${glslLinear(P.fairway[0])};
  const vec3 P_FAIRWAY_DARK = ${glslLinear(P.fairway[1])};
  const vec3 P_SEMI = ${glslLinear(P.firstCut[0])};
  const vec3 P_TEE = ${glslLinear(P.tee[0])};
  const vec3 P_TEE_DARK = ${glslLinear(P.tee[1])};
  const vec3 P_FRINGE = ${glslLinear(P.fringe)};
  const vec3 P_GREEN = ${glslLinear(P.green[0])};
  const vec3 P_GREEN_DARK = ${glslLinear(P.green[1])};
  const vec3 P_BANK = ${glslLinear(P.waterBank)};
  const vec3 P_MUD = ${glslLinear(P.waterMud)};
`;

const C = Object.fromEntries(LIE_CODES.map((l, i) => [l, i]));
// A number as a shader constant.
const f = (v) => v.toFixed(4);

// Box blur of one channel, `r` cells each way, in place.
function blur(ch, nx, nz, r) {
  if (r <= 0) return;
  const tmp = new Float32Array(ch.length);
  for (let z = 0; z < nz; z++) {
    let acc = 0;
    for (let x = -r; x <= r; x++) acc += ch[z * nx + Math.min(nx - 1, Math.max(0, x))];
    for (let x = 0; x < nx; x++) {
      tmp[z * nx + x] = acc / (2 * r + 1);
      acc += ch[z * nx + Math.min(nx - 1, x + r + 1)] - ch[z * nx + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < nx; x++) {
    let acc = 0;
    for (let z = -r; z <= r; z++) acc += tmp[Math.min(nz - 1, Math.max(0, z)) * nx + x];
    for (let z = 0; z < nz; z++) {
      ch[z * nx + x] = acc / (2 * r + 1);
      acc += tmp[Math.min(nz - 1, z + r + 1) * nx + x] - tmp[Math.max(0, z - r) * nx + x];
    }
  }
}

// The raster as three RGBA textures:
//   A: fairway, fringe, green, sand    B: tee, deep rough, water, woods
//   C: sand and water again, blurred wider (see below); the first cut
export function splatTextures(raster) {
  const { nx, nz } = raster;
  // Under a cart path, the ground it runs over (the path is drawn on top,
  // look/paths.js): a path across a fairway has fairway either side of it,
  // not a strip of rough.
  const lie = raster.beneath ? raster.lie.map((c, i) => (c === C.path ? raster.beneath[i] : c)) : raster.lie;
  const n = nx * nz;
  const chans = Array.from({ length: 9 }, () => new Float32Array(n));
  const which = {
    [C.fairway]: 0,
    [C.fringe]: 1,
    [C.green]: 2,
    [C.bunker]: 3,
    [C.greenside]: 3,
    // (A waste area - a heathland hole's put on hills - painted as sand.)
    [C.waste]: 3,
    [C.tee]: 4,
    [C.deep]: 5,
    [C.water]: 6,
    [C.trees]: 7,
    [C.semi]: 8,
  };
  for (let i = 0; i < n; i++) {
    const k = which[lie[i]];
    if (k !== undefined) chans[k][i] = 1;
  }
  // Softer where grass meets grass, crisper for greens and sand. Sand and
  // water also get a wider-blurred copy, whose spread tells the shader how
  // far from the edge it is, for damp sand at the lip, a darker collar of
  // grass round it and a muddy margin round water. Their edges are drawn
  // from the crisp copies: a wide blur pulls corners and narrow necks in,
  // and the drawn sand would stop short of where the ball plays from sand.
  const cells = (m) => Math.round(m / raster.cell);
  const wideSand = Float32Array.from(chans[3]);
  const wideWater = Float32Array.from(chans[6]);
  blur(wideSand, nx, nz, cells(1));
  blur(wideWater, nx, nz, cells(1.5));
  blur(chans[0], nx, nz, cells(1.5));
  blur(chans[5], nx, nz, cells(3));
  blur(chans[7], nx, nz, cells(2));
  for (const k of [1, 2, 3, 4, 6, 8]) blur(chans[k], nx, nz, 1);
  const pack = (a, b, c, d) => {
    const data = new Uint8Array(n * 4);
    for (let i = 0; i < n; i++) {
      data[i * 4] = a[i] * 255;
      data[i * 4 + 1] = b[i] * 255;
      data[i * 4 + 2] = c[i] * 255;
      data[i * 4 + 3] = d[i] * 255;
    }
    const t = new THREE.DataTexture(data, nx, nz, THREE.RGBAFormat);
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.colorSpace = THREE.NoColorSpace;
    t.needsUpdate = true;
    return t;
  };
  const none = new Float32Array(n);
  return [pack(chans[0], chans[1], chans[2], chans[3]), pack(chans[4], chans[5], chans[6], chans[7]), pack(wideSand, wideWater, chans[8], none)];
}

// The material. region: the raster's box in the hole frame; hole: the cup
// (world x, z, r); layer: see grass.js; mowing: how the hole is mown
// (look/glsl/ground.js mowingFor).
export function mappedGroundMaterial({ splat, raster, hole = null, layer = LAYER.fairway, mowing = mowingFor(1) }) {
  const material = onLayer(new THREE.MeshLambertMaterial({ color: 0xffffff }), layer);
  // (The cup's hole cut only where it's given one, and once the hole's
  // built only round the cup: look/cupcut.js.)
  const cut = !!hole && hole.r > 0;
  markCupCut(material, hole);
  const uniforms = {
    gSplatA: { value: splat[0] },
    gSplatB: { value: splat[1] },
    gSplatC: { value: splat[2] },
    // x0, z0, width, depth of the raster (texel centres at +half a cell).
    gRegion: { value: new THREE.Vector4(raster.x0 - raster.cell / 2, raster.z0 - raster.cell / 2, raster.nx * raster.cell, raster.nz * raster.cell) },
    // The drawn blades and sand on High (look/textures.js, shared).
    gDetail: HIGH ? detailTextures().tGrass : { value: grassDetail() },
    ...(HIGH ? { tSand: detailTextures().tSand } : {}),
    gHole: { value: new THREE.Vector3(hole?.x ?? 0, hole?.z ?? 0, hole?.r ?? 0) },
    // The fairway's and the green's mowing: the way the stripes change (in
    // the hole's frame) and their kind (gMowing).
    gMowFair: { value: new THREE.Vector3(...mowing.fairway.dir, mowing.fairway.kind) },
    gMowGreen: { value: new THREE.Vector3(...mowing.green.dir, mowing.green.kind) },
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms, groundUniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 gWorld;")
      .replace("#include <project_vertex>", "#include <project_vertex>\ngWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 gWorld;
        uniform sampler2D gSplatA;
        uniform sampler2D gSplatB;
        uniform sampler2D gSplatC;
        uniform vec4 gRegion;
        uniform sampler2D gDetail;
        uniform vec3 gHole;
        uniform vec3 gMowFair;
        uniform vec3 gMowGreen;
        ${HIGH ? (PHONE ? "#define SAND_FINE\n#define GROUND_FINE\n#define SAND_PHONE\n#define GROUND_PHONE" : "#define SAND_FINE\n#define GROUND_FINE\n#define SAND_TEX\n#define GROUND_TEX") : ""}
        ${NOISE}
        ${GROUND}
        ${SAND_GLSL}
        ${MAPPED_COLOURS}
        // Two-tone mowing stripes: bands \`width\` metres wide across s.
        float mow(float s, float width) {
          return gMow(s / width);
        }`,
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        {
          vec2 w = gWorld.xz;
          // The hole's frame: x down the hole, z to the right.
          vec2 hp = vec2(-gWorld.z, gWorld.x);
          vec2 uv = (hp - gRegion.xy) / gRegion.zw;
          vec4 A = texture2D(gSplatA, uv);
          vec4 B = texture2D(gSplatB, uv);
          vec4 C = texture2D(gSplatC, uv);
          float n1 = gNoise(w * 0.35);
          float n2 = gNoise(w * 1.7);

          // The rough, as a designed hole's (grass.js GRASS.rough).
          vec3 col = gGrassBase(P_ROUGH, w, ${f(GRASS.rough.patch)}, ${f(GRASS.rough.patchScale)}, ${f(GRASS.rough.tint)});
          col = gRoughPatches(col, w, ${f(ROUGH_CLUMPS)});

          // Deep rough and the floor of the woods, ragged at the edges.
          float deep = smoothstep(0.35, 0.65, B.g + (n1 - 0.5) * 0.5);
          float dp = gFbm(w * 0.05);
          vec3 deepCol = gStraw(P_DEEP * (1.0 + 0.45 * (dp - 0.5)), dp, 1.0);
          col = mix(col, gRoughPatches(deepCol, w, ${DEEP_CLUMPS.toFixed(2)}), deep);
          float woods = smoothstep(0.3, 0.7, B.a + (n2 - 0.5) * 0.3);
          col = mix(col, P_WOODS, woods);
          // The wind's waves across it (not under the trees).
          col = gWindWaves(col, w, gWorld, 1.0 - woods);
          // Past the long grass, read as standing grass (look/farrough.js).
          ${HIGH ? "col = gFarRoughLook(col, w, gWorld, (1.0 - woods) * (1.0 + 0.3 * deep));" : ""}
          // Rough, deep rough or woods, before the mown grass goes over it
          // (for the flowers, below).
          float roughHere = 1.0 - woods;

          // The first cut along the fairway: its own band, a step between
          // the rough and the fairway, ragged where it meets the rough.
          vec3 semi = P_SEMI * (0.9 + 0.2 * n1) * (0.96 + 0.08 * n2);
          col = mix(col, semi, smoothstep(0.3, 0.55, C.b + (n1 - 0.5) * 0.3));

          // Fairway: stripes in the hole's pattern, a clean-up pass one
          // mower wide inside its edge, and a short, slightly ragged edge
          // onto the first cut.
          float cut = 0.35 + 0.25 * n1 + 0.1 * n2;
          float fw = smoothstep(cut - 0.08, cut + 0.08, A.r);
          float fStripe = gMowing(hp, gMowFair.xy, 10.0, gMowFair.z, vec2(0.0));
          fStripe = mix(fStripe, G_CLEANUP, smoothstep(0.5, 0.56, A.r) * (1.0 - smoothstep(0.88, 0.94, A.r)));
          vec3 fair = mix(P_FAIRWAY, P_FAIRWAY_DARK, fStripe);
          float fp = gFbm(w * 0.03);
          fair *= 1.0 + 0.18 * (fp - 0.5) * 2.0;
          // Straw on a firm day, as a designed fairway's (gGrassBase).
          fair = gStraw(fair, fp, 1.0);
          col = mix(col, fair, fw);
          roughHere *= 1.0 - fw;

          // Tees, fringe, greens: crisp, but not one flat colour each, and
          // with the raster's half-metre steps nudged off their grid.
          float jig = (n2 - 0.5) * 0.08;
          vec3 tee = mix(P_TEE, P_TEE_DARK, mow(hp.x, 1.5));
          tee *= 1.0 + 0.1 * (gFbm(w * 0.12 + 4.0) - 0.5) * 2.0;
          float teeHere = smoothstep(0.4, 0.6, B.r + jig);
          col = mix(col, tee, teeHere);
          vec3 fringe = P_FRINGE * (1.0 + 0.12 * (gFbm(w * 0.1 + 9.0) - 0.5) * 2.0);
          float fringeHere = smoothstep(0.4, 0.6, A.g + jig);
          col = mix(col, fringe, fringeHere);
          roughHere *= (1.0 - teeHere) * (1.0 - fringeHere);
          // The green in its pattern, with a clean-up ring just inside the
          // fringe.
          float gStripe = gMowing(hp, gMowGreen.xy, 1.4, gMowGreen.z, vec2(0.0));
          gStripe = mix(gStripe, G_CLEANUP, 1.0 - smoothstep(0.82, 0.92, A.b));
          vec3 green = mix(P_GREEN, P_GREEN_DARK, gStripe);
          green *= 1.0 + 0.1 * (gFbm(w * 0.08) - 0.5) * 2.0;
          float greenHere = smoothstep(0.45, 0.55, A.b + jig * 0.5);
          col = mix(col, green, greenHere);
          roughHere *= 1.0 - greenHere;

          // The muddy margin round water, fading into the grass, and the
          // mud under it.
          float bank = smoothstep(0.12, 0.45, C.g + (n1 - 0.5) * 0.25);
          col = mix(col, P_BANK, bank * 0.8);
          col = mix(col, P_MUD, smoothstep(0.45, 0.6, B.b));

          // Sand (already in linear light): a darker collar of grass just
          // outside it, and how far in from its edge each spot is. Halfway
          // up either channel is the edge; the wide one runs about 1.25 m
          // each way of it, the crisp one 0.75 m, and the crisp one has the
          // say at corners, where the wide one falls short.
          float sandEdge = smoothstep(0.45, 0.55, A.a);
          col *= 1.0 - 0.25 * smoothstep(0.08, 0.45, C.r) * (1.0 - sandEdge);
          // All the grass a shade darker after rain (the sand has its own
          // damp, sandColour).
          col = gWetGround(col);
          float sandIn = max((C.r - 0.5) * 2.5, (A.a - 0.5) * 1.5);
          // Sand running into water darkens to wet sand for its last metre
          // or so (the wide water channel reaches about 1.5 m out).
          float wet = smoothstep(0.04, 0.35, C.g + (n2 - 0.5) * 0.1);
          // (Raked all one way: the raster doesn't tell one bunker from
          // the next.)
          col = mix(col, sandColour(w, sandIn, 0.0, wet, vec2(0.8, 0.6)), sandEdge);
          // Blades close up (not on sand), fading as they shrink below a pixel.
          float d;
          float fade;
          col = gBlades(col, w, gDetail, 1.0, 0.8 * (1.0 - sandEdge), d, fade);
          // The sand's grains lean too, where it's sand.
          gLean += sLean * sandEdge;
          #ifdef GROUND_FINE
          // Daisies and dandelions in the rough, close up (none in the
          // semi or under the trees, on sand or by water).
          roughHere *= (1.0 - smoothstep(0.3, 0.55, C.b)) * (1.0 - sandEdge) * (1.0 - bank);
          if (roughHere > 0.02) col = gFlowers(col, w, roughHere);
          #endif
          // Duller with distance, as the other grass.
          diffuseColor.rgb *= gDistance(col, gWorld);
          ${
            cut
              ? `// The cup's hole - only in the patch round the cup (look/cupcut.js).
          #ifndef GROUND_UNCUT
          if (gHole.z > 0.0 && distance(gWorld.xz, gHole.xy) < gHole.z) discard;
          #endif`
              : ""
          }
        }`,
      )
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>\n${HIGH ? leanNormal("gLean") : ""}`);
  };
  material.customProgramCacheKey = () => `mapped-ground-v9-${GROUND_KEY}-${HIGH ? "h" : "s"}${PHONE ? "p" : ""}${cut ? "-cup" : ""}`;
  return withSceneryHooks(material, "ground");
}

// A grid mesh over part of the hole frame, following heightAt(x, z) (hole
// frame), `spacing` metres apart, in world terms (x = hole z, z = -hole x).
export function terrainMesh(box, spacing, heightAt, material, lift = 0) {
  const nx = Math.max(2, Math.ceil((box.x1 - box.x0) / spacing) + 1);
  const nz = Math.max(2, Math.ceil((box.z1 - box.z0) / spacing) + 1);
  const pos = new Float32Array(nx * nz * 3);
  for (let iz = 0; iz < nz; iz++) {
    for (let ix = 0; ix < nx; ix++) {
      const x = Math.min(box.x1, box.x0 + ix * spacing);
      const z = Math.min(box.z1, box.z0 + iz * spacing);
      const i = (iz * nx + ix) * 3;
      pos[i] = z;
      pos[i + 1] = heightAt(x, z) + lift;
      pos[i + 2] = -x;
    }
  }
  const index = [];
  for (let iz = 0; iz < nz - 1; iz++) {
    for (let ix = 0; ix < nx - 1; ix++) {
      const a = iz * nx + ix;
      const b = a + 1;
      const c = a + nx;
      const d = c + 1;
      index.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();
  // Facing up, whichever way the frame turned the triangles.
  const nrm = geo.attributes.normal;
  let up = 0;
  for (let i = 0; i < nrm.count; i += 97) up += nrm.getY(i);
  if (up < 0) {
    for (let i = 0; i < index.length; i += 3) [index[i + 1], index[i + 2]] = [index[i + 2], index[i + 1]];
    geo.setIndex(index);
    geo.computeVertexNormals();
  }
  const mesh = new THREE.Mesh(geo, material);
  mesh.receiveShadow = true;
  return mesh;
}

// The ring of ground round a mapped hole's box `r` (sim/country.mjs
// SKIRT): a grid on ringAxis's lines, `spacing` apart as the hole's own
// mesh is, out SKIRT.ring metres from the box, with nothing inside it.
// heightAt(x, z) in the hole frame, as for terrainMesh.
export function skirtRing(r, spacing, heightAt, material) {
  const xs = ringAxis(r.x0, r.x1, spacing, SKIRT.ring);
  const zs = ringAxis(r.z0, r.z1, spacing, SKIRT.ring);
  const nx = xs.length;
  const nz = zs.length;
  const pos = new Float32Array(nx * nz * 3);
  for (let iz = 0; iz < nz; iz++) {
    for (let ix = 0; ix < nx; ix++) {
      const i = (iz * nx + ix) * 3;
      pos[i] = zs[iz];
      pos[i + 1] = heightAt(xs[ix], zs[iz]);
      pos[i + 2] = -xs[ix];
    }
  }
  // (A cell is wholly inside the box or wholly outside it: the box's edges
  // are lines of the grid.)
  const inX = (ix) => xs[ix] >= r.x0 && xs[ix + 1] <= r.x1;
  const inZ = (iz) => zs[iz] >= r.z0 && zs[iz + 1] <= r.z1;
  const index = [];
  for (let iz = 0; iz < nz - 1; iz++) {
    for (let ix = 0; ix < nx - 1; ix++) {
      if (inX(ix) && inZ(iz)) continue;
      const a = iz * nx + ix;
      const b = a + 1;
      const c = a + nx;
      const d = c + 1;
      index.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();
  // Facing up, whichever way the frame turned the triangles (as
  // terrainMesh).
  const nrm = geo.attributes.normal;
  let up = 0;
  for (let i = 0; i < nrm.count; i += 97) up += nrm.getY(i);
  if (up < 0) {
    for (let i = 0; i < index.length; i += 3) [index[i + 1], index[i + 2]] = [index[i + 2], index[i + 1]];
    geo.setIndex(index);
    geo.computeVertexNormals();
  }
  const mesh = new THREE.Mesh(geo, material);
  mesh.receiveShadow = true;
  return mesh;
}

// The height of a terrainMesh (above) at (x, z), hole frame: the ground as
// the mesh draws it, straight across each triangle, rather than as the
// ground data has it. Something laid over the mesh - a cart path - is laid
// no lower than this, or the mesh's flat triangles could poke up through it
// in a hollow.
export function terrainMeshHeight(box, spacing, heightAt) {
  const nx = Math.max(2, Math.ceil((box.x1 - box.x0) / spacing) + 1);
  const nz = Math.max(2, Math.ceil((box.z1 - box.z0) / spacing) + 1);
  // (Each corner's height worked out once, as it's first asked for: a
  // course's far trees ask for thousands of spots.)
  const kept = new Float32Array(nx * nz).fill(NaN);
  const at = (ix, iz) => {
    const k = iz * nx + ix;
    if (Number.isNaN(kept[k])) kept[k] = heightAt(Math.min(box.x1, box.x0 + ix * spacing), Math.min(box.z1, box.z0 + iz * spacing));
    return kept[k];
  };
  // (The last row and column are at the box's edge, nearer than a
  // spacing on - as terrainMesh lays them.)
  const X = (ix) => Math.min(box.x1, box.x0 + ix * spacing);
  const Z = (iz) => Math.min(box.z1, box.z0 + iz * spacing);
  return (x, z) => {
    if (x < box.x0 || z < box.z0 || x > box.x1 || z > box.z1) return heightAt(x, z);
    const ix = Math.min(nx - 2, Math.floor((x - box.x0) / spacing));
    const iz = Math.min(nz - 2, Math.floor((z - box.z0) / spacing));
    const u = (x - X(ix)) / (X(ix + 1) - X(ix) || 1);
    const v = (z - Z(iz)) / (Z(iz + 1) - Z(iz) || 1);
    // Each square is two triangles, split corner to corner (a, c, b) and
    // (b, c, d), as terrainMesh builds it.
    if (u + v <= 1) {
      const a = at(ix, iz);
      return a + (at(ix + 1, iz) - a) * u + (at(ix, iz + 1) - a) * v;
    }
    const d = at(ix + 1, iz + 1);
    return d + (at(ix, iz + 1) - d) * (1 - u) + (at(ix + 1, iz) - d) * (1 - v);
  };
}
