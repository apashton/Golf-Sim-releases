// Sand and water, worked out per pixel like the grass (grass.js) rather
// than from a stretched texture, so neither reads as a flat block of one
// colour.
//
// Sand:  colour drifting at a few scales (never a repeating tile), faint
//        rake lines (each bunker raked its own way) and wind ripples close
//        up, grain, and darker damp sand at the edges and low in the face
//        of a dug bunker (and all over after rain). A bunker lying flat is shaded as a bowl from its
//        edge, so the face turned to the sun catches it, the one turned
//        away is in shade, and a shaded lip shows. The lip is a thin shadowed line of turf, and outside it a collar of slightly
//        longer grass fades raggedly into whatever's round it (lipEdge).
// Water: darker out in the middle and lighter, greener and browner in the
//        shallows, a soft muddy margin rather than a seam at the bank,
//        two sets of ripples drifting across each other (so there's no
//        visible tile), darker gust patches racing downwind across them,
//        the sky's reflection, a dark band of the far bank's trees and
//        earth along its far side, glints where the sun catches the
//        ripples (when the sun's out), and rings where rain falls on it.
//
// Both need to know how far each spot is from the edge; sim/edgefield.mjs
// works that out on a small grid, passed in here as a texture. It's looked
// up by the mesh's own (object) x and z, so a bunker built once and turned
// or tilted into place (the range, the putting green) still lines up.
//
// On Standard graphics the fine detail (rake lines, grain, the water's
// second set of ripples, its glints and rain rings) is left out; the gust
// patches and the far bank's band stay.

import * as THREE from "three";
import { NOISE, grassMaterial, GRASS, LAYER, onLayer } from "./grass.js";
import { HIGH, ULTRA, PHONE } from "./quality.js";
import { mirrorUniforms } from "./mirrors.js";
import { SPLASH, addSplash, splashSize } from "../sim/ultra.mjs";
import { RIPPLE, WATER_LEE, WATER_RUN } from "../sim/mirrorreach.mjs";
import { rippleMap, RIPPLE_SIZE } from "../sim/ripplemap.mjs";
import { edgeFieldSteps, patchFieldSteps, nearField, joinField, lineField, cutField, packField, NEAR_RANGE, WALL_RANGE, CUT_RANGE } from "../sim/edgefield.mjs";
import { PALETTE, glsl, glslLinear, rgb, linearLum, WATER_LIT_CAP, WATER_LIT_FLOOR, WATER_LOW, WATER_BAND, WATER_SHEEN, BANK_PULL, BANK_LIGHT, BANK_BREAK } from "./palette.js";
import { withSceneryHooks } from "./glsl/hooks.js";
import { markTwin } from "./twins.js";
import { animateGround, groundUniforms, leanNormal } from "./glsl/ground.js";
import { detailTextures } from "./textures.js";

// A number as the shaders want it: a float, to three places.
const f3 = (v) => v.toFixed(3);

// Ranges the field is packed into (see packField): sand cares about the
// last metre or two, water about how far out the deep water starts.
const SAND_RANGE = [-2, 6];
const WATER_RANGE = [-2, 14];
const MAX_DEPTH = 2;

// The field for an outline, as a texture and where it lies.
// poly: [[x, z], ...] in the mesh's object space; heightAt(x, z) there too,
// for how deep a dug bowl is (optional). near: other outlines in the same
// space whose distance matters - the ponds a bunker runs into, or the
// bunkers running into a pond (see nearField).
// wall: a wall along part of the outline (a line of points, same space),
// for water: its muddy margin gives way to the wall there. join: the
// outlines of other bunkers laid over this one, drawn with it as one patch
// of sand (sim/edgefield.mjs joinField).
// patch: a bunker's whole patch of bunkers laid over each other - their
// outlines, poly's among them - for one field round them all (sim/
// edgefield.mjs patchField), in place of poly's own joined to theirs.
export function fieldTexture(poly, opts = {}) {
  const steps = fieldTextureSteps(poly, opts);
  for (;;) {
    const r = steps.next();
    if (r.done) return r.value;
  }
}
// The same a part a step (the field's points: sim/edgefield.mjs
// edgeFieldSteps), for a bunker built while the next hole's built ahead.
export function* fieldTextureSteps(poly, { cell = 0.25, pad = 1.5, heightAt = null, range = SAND_RANGE, near = null, wall = null, join = null, dry = null, patch = null } = {}) {
  const f = patch?.length > 1 ? yield* patchFieldSteps(patch, { cell, pad, heightAt }) : yield* edgeFieldSteps(poly, { cell, pad, heightAt });
  if (!(patch?.length > 1) && join?.length) joinField(f, join);
  const others = near?.length ? nearField(f, near) : null;
  const walled = wall?.length > 1 ? lineField(f, wall) : null;
  // (Water: none of it on a green or its fringe - `dry(x, z)`, how far
  // past them, in the outline's frame: sim/greenfirst.mjs.)
  const cut = dry && !heightAt ? cutField(f, dry) : null;
  const tex = new THREE.DataTexture(packField(f, range, MAX_DEPTH, others, walled, cut), f.nx, f.nz, THREE.RGBAFormat);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.NoColorSpace;
  tex.needsUpdate = true;
  // x0, z0, width, depth of the texture (grid points sit at texel centres).
  const box = new THREE.Vector4(f.x0 - f.cell / 2, f.z0 - f.cell / 2, f.nx * f.cell, f.nz * f.cell);
  return { texture: tex, box, range, near: !!others, wall: !!walled, cut: !!cut };
}

// What the shaders share: reading the field back.
const FIELD = /* glsl */ `
  uniform sampler2D sField;
  uniform vec4 sFieldBox;
  uniform vec2 sFieldRange;
  varying vec2 sLocal;
  // x: metres in from the edge (negative outside); y: metres below the rim.
  vec2 fieldAt(vec2 p) {
    vec4 t = texture2D(sField, (p - sFieldBox.xy) / sFieldBox.zw);
    return vec2(sFieldRange.x + t.r * (sFieldRange.y - sFieldRange.x), t.g * ${MAX_DEPTH.toFixed(1)});
  }
  // Metres to the nearest other outline (a pond, for sand; a bunker, for
  // water), negative inside it; a long way off when there's none.
  float nearAt(vec2 p) {
    float b = texture2D(sField, (p - sFieldBox.xy) / sFieldBox.zw).b;
    return ${NEAR_RANGE[0].toFixed(1)} + b * ${(NEAR_RANGE[1] - NEAR_RANGE[0]).toFixed(1)};
  }
  // Metres to a wall along the edge (a pond's), a long way off with none.
  float wallAt(vec2 p) {
    return texture2D(sField, (p - sFieldBox.xy) / sFieldBox.zw).a * ${WALL_RANGE.toFixed(1)};
  }
`;

// The sand's colours as shader constants (as written, not linear light).
const SAND = rgb(PALETTE.sand);
const DAMP = rgb(PALETTE.sandDamp).map((v, i) => v / SAND[i]);

// The sand's colour (in linear light) at world position w, `edge` metres in
// from its edge and `depth` metres down a dug bowl. Shared with the mapped
// holes' ground (mappedground.js), which has no field and passes an edge
// worked out from its lie raster.
export const SAND_GLSL = /* glsl */ `
  // The drawn sand on High (SAND_TEX: look/textures.js), and how its
  // grains and stones lean, for the light (leanNormal).
  #ifdef SAND_TEX
  uniform sampler2D tSand;
  #endif
  vec2 sLean = vec2(0.0);
  // The course's sand and this bunker's look (sim/bunkerlook.mjs): its
  // tint, and how ragged its edge (x), how strongly raked (y), how many
  // footprints (z) and how stony (w) - as sand always was where no look's
  // given (a hole from a map); and how cleanly its turf is cut at its
  // edge (sCut.x) or how softly the grass thins out into it (sCut.y).
  // And whether it's a waste area (sWaste: sim/wastearea.mjs) - sandy
  // ground, not a bunker's sand.
  #ifdef SAND_LOOK
  uniform vec3 sTint;
  uniform vec4 sLook;
  uniform vec2 sCut;
  uniform float sWaste;
  #else
  const vec3 sTint = vec3(1.0);
  const vec4 sLook = vec4(0.0, 1.0, 1.0, 0.0);
  const vec2 sCut = vec2(0.0);
  const float sWaste = 0.0;
  #endif
  // The grass's hash and noise (grass.js), but kept to small numbers: the
  // sand's finest detail is on a 1.6 cm grid, and hundreds of metres out
  // that many cells overflows what a shader's floats can tell apart, so the
  // grain turned into stripes on far bunkers. It repeats every 4096 cells
  // (68 m of grain), which nobody will spot.
  float sHash(vec2 c) {
    return gHash(mod(c, 4096.0) * 0.001);
  }
  float sNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(sHash(i), sHash(i + vec2(1.0, 0.0)), u.x),
               mix(sHash(i + vec2(0.0, 1.0)), sHash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  // wet: 0-1, how near the water's edge (sand running into a pond darkens
  // to wet sand for its last metre, with no lip of turf along it). rakeDir:
  // the way this bunker's rake lines run (world, unit length).
  vec3 sandColour(vec2 w, float edge, float depth, float wet, vec2 rakeDir) {
    // Pale, warm sand, drifting in brightness and hue at three scales.
    vec3 col = ${glsl(PALETTE.sand)} * sTint;
    float big = gFbm(w * 0.09 + 3.0);
    float mid = gNoise(w * 0.7 + 11.0);
    col *= 0.9 + 0.2 * big + 0.08 * (mid - 0.5);
    col = mix(col, col * vec3(1.04, 1.0, 0.9), smoothstep(0.3, 0.75, gNoise(w * 0.23 + 29.0)));
    // Damp sand: darker and browner towards the lip (raggedly), and low in
    // the face of a dug bowl where water runs down and sits.
    // Kept light low in the face - the lighting shows the bowl's shape -
    // or on a projector a dug face reads as mud rather than damp sand.
    float ragged = 0.4 * gNoise(w * 1.7);
    // (Narrower along a clean-cut edge.)
    float damp = 1.0 - smoothstep(0.0, (0.7 + ragged) * (1.0 - 0.65 * sCut.x), edge);
    damp = max(damp * 0.85, smoothstep(0.35, 1.1, depth) * (1.0 - smoothstep(0.6, 2.2, edge)) * 0.5);
    damp *= (1.0 - wet) * (1.0 - 0.8 * sWaste);
    // After rain (the ground's gWet) it's all damp.
    damp = max(damp, 0.8 * gWet * (1.0 - wet));
    col = mix(col, col * vec3(${DAMP.map((v) => v.toFixed(3)).join(", ")}), damp);
    // By the water the sand turns to the pond's muddy margin, so the
    // pond's brown edge runs on along its edge through the bunker (the
    // owner: "shape the brown edge of the water into the portion of the
    // bunker") - wet sand first, then mud right at the water.
    col = mix(col, col * vec3(0.68, 0.64, 0.57), smoothstep(0.0, 0.5, wet));
    col = mix(col, ${glsl(PALETTE.waterMud)} * 1.12, smoothstep(0.35, 1.0, wet) * 0.9);
    #ifdef SAND_FINE
    // Rake lines, gently curving, and wind ripples across them: faint,
    // gone once they'd be only a few pixels apart (they'd shimmer as
    // stripes), and smoothed away by the water.
    float r = dot(w, rakeDir) / 0.22 + (gNoise(w * 0.25) - 0.5) * 4.0;
    float rw = fwidth(r);
    float rake = sin(r * 6.2832) * (1.0 - smoothstep(0.05, 0.15, rw)) * sLook.y;
    float windy = sNoise(vec2(dot(w, vec2(-0.6, 0.8)) * 5.0, dot(w, vec2(0.8, 0.6)) * 0.8));
    float fine = 1.0 - smoothstep(0.03, 0.2, fwidth(w.x * 5.0));
    // (Windblown sand - little raking left - ripples more.)
    float blown = 1.0 + 1.2 * max(0.0, 1.0 - sLook.y);
    col *= 1.0 + (0.02 * rake * (1.0 - damp) + 0.035 * blown * (windy - 0.5) * fine) * (1.0 - wet);
    // Grain: two soft noises at an angle to each other, never a grid of
    // squares. (Not on the phone, SAND_PHONE: under a pixel of its picture.)
    #ifndef SAND_PHONE
    float grain = sNoise(w * 60.0) + 0.5 * sNoise(mat2(0.8, -0.6, 0.6, 0.8) * w * 97.0) - 0.75;
    col *= 1.0 + 0.1 * grain * (1.0 - smoothstep(0.1, 0.6, fwidth(w.x * 60.0)));
    #endif
    #ifdef SAND_TEX
    {
      // Grains and the odd small stone, a metre a tile, over a broader
      // drift of the same turned against it (so neither repeats in
      // view), each fading out before it would shimmer; smoothed where
      // the sand's wet.
      float px = fwidth(w.x);
      vec3 s1 = texture2D(tSand, w).rgb;
      vec3 s2 = texture2D(tSand, mat2(0.8, -0.6, 0.6, 0.8) * w * 0.31 + 0.17).rgb;
      float k1 = (1.0 - smoothstep(0.004, 0.03, px)) * (1.0 - 0.6 * wet);
      float k2 = (1.0 - smoothstep(0.012, 0.09, px)) * (1.0 - 0.6 * wet);
      col *= mix(1.0, 0.55 + 0.6 * s1.r, k1) * mix(1.0, 0.7 + 0.4 * s2.r, k2);
      sLean = vec2(s1.g * 2.0 - 1.0, 1.0 - s1.b * 2.0) * k1;
    }
    #endif
    #endif
    // Coarse sand's small dark stones and grains, a few centimetres
    // across, fading out before they'd shimmer.
    if (sLook.w > 0.0) {
      vec2 sc = floor(w * 9.0);
      float stone = step(1.0 - 0.035 * sLook.w, sHash(sc + 13.0));
      float near = 1.0 - smoothstep(0.02, 0.08, fwidth(w.x * 9.0));
      col = mix(col, col * vec3(0.55, 0.52, 0.48), stone * near * (1.0 - wet) * 0.8);
    }
    // A waste area (sim/wastearea.mjs): sandy ground rather than a
    // bunker's sand - browner in drifts, paler blown sand between, its
    // stones bigger and greyer, and heather and wiry grass growing through
    // it in patches and tufts, thicker towards its edge, where it gives way
    // to the rough over a couple of metres rather than at a lip.
    if (sWaste > 0.0) {
      float drift = gFbm(w * 0.18 + 71.0);
      col *= mix(vec3(0.84, 0.8, 0.74), vec3(1.05, 1.02, 0.97), smoothstep(0.3, 0.7, drift));
      vec2 pc = floor(w * 3.2);
      vec2 pf = fract(w * 3.2) - 0.5 - (vec2(sHash(pc + 3.0), sHash(pc + 9.0)) - 0.5) * 0.4;
      float stone = step(0.9, sHash(pc + 23.0)) * (1.0 - smoothstep(0.12, 0.2, length(pf)));
      float seeStone = 1.0 - smoothstep(0.05, 0.25, fwidth(w.x * 3.2));
      col = mix(col, ${glsl(PALETTE.duneStone)} * (0.8 + 0.4 * sHash(pc + 5.0)), stone * seeStone * 0.85 * sWaste);
      float patchN = gNoise(w * 0.42 + 13.0) * 0.65 + gNoise(w * 1.7 + 5.0) * 0.35;
      float byEdge = 1.0 - smoothstep(0.0, 2.5, edge);
      float cover = smoothstep(0.6 - 0.32 * byEdge, 0.7 - 0.32 * byEdge, patchN);
      vec3 scrub = mix(${glsl(PALETTE.duneHeather)}, ${glsl(PALETTE.thinGrass)}, smoothstep(0.35, 0.65, gNoise(w * 0.25 + 91.0)));
      scrub *= 0.8 + 0.35 * gNoise(w * 6.0 + 1.0);
      col = mix(col, scrub, cover * 0.9 * sWaste * (1.0 - wet));
      vec2 tc = floor(w * 1.6);
      float tuft = step(0.86, sHash(tc + 41.0)) * (1.0 - smoothstep(0.1, 0.32, length(fract(w * 1.6) - 0.5)));
      col = mix(col, scrub * 0.7, tuft * (1.0 - smoothstep(0.03, 0.15, fwidth(w.x * 1.6))) * 0.8 * sWaste * (1.0 - wet));
    }
    // A ragged edge: the grass breaking into the sand in bays and
    // fingers (an eroded lip), with the shade of its overhang just inside
    // - wider and wilder the more ragged the bunker (none on a crisp one).
    if (sLook.x > 0.0) {
      float bite = sLook.x * (0.55 * gNoise(w * 0.8 + 41.0) + 0.45 * gNoise(w * 2.6 + 7.0)) * 0.9;
      float grassIn = 1.0 - smoothstep(bite - 0.08, bite + 0.04, edge);
      float shade = (1.0 - smoothstep(bite + 0.04, bite + 0.35, edge)) * sLook.x * 0.22;
      col *= 1.0 - shade * (1.0 - wet);
      col = mix(col, ${glsl(PALETTE.collar)} * (0.85 + 0.3 * gNoise(w * 3.3)), grassIn * step(0.02, bite) * (1.0 - wet));
    }
    // A clean-cut edge: the turf cut off where the sand starts - a thin
    // dark sliver of soil and turf, never quite even, and the shade of
    // the turf's edge just inside it.
    if (sCut.x > 0.0) {
      float sliver = 0.025 + 0.035 * gNoise(w * 4.0 + 17.0);
      float aa = max(fwidth(edge), 0.004);
      float cutLine = 1.0 - smoothstep(sliver - aa, sliver + aa, edge);
      float under = (1.0 - smoothstep(sliver, sliver + 0.22, edge)) * 0.28;
      col *= 1.0 - under * sCut.x * (1.0 - wet);
      col = mix(col, ${glsl(PALETTE.sandLip)} * 0.62, cutLine * sCut.x * (1.0 - wet));
    }
    // A soft edge: the grass thinning out into the sand in patches over a
    // hand's breadth to half a metre, no line between them.
    if (sCut.y > 0.0) {
      float reach = sCut.y * (0.18 + 0.4 * gNoise(w * 0.9 + 5.0));
      float thin = 1.0 - smoothstep(0.0, reach, edge + reach * 0.3 * (gNoise(w * 7.0 + 3.0) - 0.5));
      float patchy = mix(0.5, 1.0, step(0.42, gNoise(w * 11.0 + 9.0)));
      col = mix(col, ${glsl(PALETTE.collar)} * (0.8 + 0.35 * gNoise(w * 3.1)), thin * patchy * (1.0 - wet));
    }
    // The lip: a thin, shadowed line of turf and soil where the grass
    // breaks off into the sand, never quite straight - only right at the
    // top of a dug face (a wider band down a steep face read as a log
    // lying across it), and none where the sand runs into water (nor
    // along a soft edge; a cut edge's sliver is its own).
    float lip = (1.0 - smoothstep(0.0, 0.1 + 0.2 * ragged, edge)) * (1.0 - smoothstep(0.03, 0.12, depth)) * (1.0 - wet) * (1.0 - sWaste);
    col = mix(col, ${glsl(PALETTE.sandLip)}, lip * 0.7 * (1.0 - sCut.y) * (1.0 - 0.6 * sCut.x));
    return pow(col, vec3(2.2));
  }

  // Ultra's sand in relief (SAND_RELIEF): how high the surface stands at w,
  // metres - the rake's ridges (a few millimetres, along the rake lines,
  // curving with them) and footprints pressed into it here and there (in
  // pairs, a stride apart, each heading its own way), all gone where the
  // sand's wet or would only shimmer. Its slope tilts the light, so low sun
  // picks out every ridge and print.
  float sandHeight(vec2 w, vec2 rakeDir, float wet) {
    float r = dot(w, rakeDir) / 0.22 + (gNoise(w * 0.25) - 0.5) * 4.0;
    float h = 0.005 * sin(r * 6.2832) * sLook.y;
    vec2 cell = floor(w / 1.4);
    float has = sHash(cell + 7.0);
    if (has > 1.0 - 0.45 * sLook.z) {
      float a = sHash(cell + 3.0) * 6.2832;
      vec2 dir = vec2(cos(a), sin(a));
      vec2 side = vec2(-dir.y, dir.x);
      vec2 c = (cell + 0.5) * 1.4 + (vec2(sHash(cell + 1.0), sHash(cell + 5.0)) - 0.5) * 0.6;
      for (int f = 0; f < 2; f++) {
        vec2 foot = c + side * (f == 0 ? -0.11 : 0.11) + dir * (f == 0 ? -0.35 : 0.35);
        vec2 q = w - foot;
        vec2 l = vec2(dot(q, dir) / 0.14, dot(q, side) / 0.055);
        h -= 0.02 * (1.0 - smoothstep(0.55, 1.0, length(l)));
        // A little rim of sand pushed up round it.
        h += 0.004 * smoothstep(0.85, 1.0, length(l)) * (1.0 - smoothstep(1.0, 1.35, length(l)));
      }
    }
    return h * (1.0 - wet);
  }

  // A flat bunker shaded as a bowl from its edge: how steeply its face
  // falls at edge metres in from the rim - steepest at the lip, flat in
  // the middle - for tilting its normal in (the ball plays on it flat).
  float sandBowl(float edge) {
    return 1.8 * exp(-max(edge, 0.0) / 1.1);
  }
  // And the shade just inside its lip.
  float sandLipShade(float edge) {
    return 1.0 - 0.2 * exp(-max(edge, 0.0) / 0.35);
  }
`;

// Which way a bunker is raked: an angle (radians, world) from where it is.
export function rakeAngle(x, z) {
  const h = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return (h - Math.floor(h)) * Math.PI;
}

// Sand for one bunker. field: from fieldTexture(); layer: see grass.js.
// bowl: a bunker lying flat, shaded as a bowl from its edge (a dug one has
// its real shape). rake: the way its rake lines run (radians, world).
// look: the bunker's (sim/bunkerlook.mjs bunkerLook): its sand's tint and
// its edge, raking, prints and stones - as sand always was, without.
export function sandMaterial({ field, layer = LAYER.sand, bowl = false, rake = 0.64, look = null }) {
  const material = onLayer(new THREE.MeshLambertMaterial({ color: 0xffffff }), layer);
  const uniforms = {
    sField: { value: field.texture },
    sFieldBox: { value: field.box },
    sFieldRange: { value: new THREE.Vector2(...field.range) },
    sRake: { value: new THREE.Vector2(Math.cos(rake), Math.sin(rake)) },
    sTint: { value: new THREE.Vector3(...(look?.tint ?? [1, 1, 1])) },
    sLook: { value: new THREE.Vector4(look?.ragged ?? 0, look?.rake ?? 1, look?.prints ?? 1, look?.stones ?? 0) },
    sCut: { value: new THREE.Vector2(look?.cut ?? 0, look?.soft ?? 0) },
    sWaste: { value: look?.waste ? 1 : 0 },
    // The drawn sand (High: look/textures.js, shared by every bunker).
    ...(HIGH ? { tSand: detailTextures().tSand } : {}),
    // How wet the ground is (look/glsl/ground.js: shared, set once a frame).
    gWet: groundUniforms.gWet,
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 sWorld;\nvarying vec2 sLocal;\nvarying vec3 sTx;\nvarying vec3 sTz;")
      .replace(
        "#include <project_vertex>",
        // (sTx, sTz: the mesh's own x and z in view terms, for its bowl.)
        "#include <project_vertex>\nsWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;\nsLocal = transformed.xz;\nsTx = normalize(normalMatrix * vec3(1.0, 0.0, 0.0));\nsTz = normalize(normalMatrix * vec3(0.0, 0.0, 1.0));",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        ${HIGH ? (PHONE ? "#define SAND_FINE\n#define SAND_PHONE" : "#define SAND_FINE\n#define SAND_TEX") : ""}
        ${field.near ? "#define SAND_WET" : ""}
        ${bowl ? "#define SAND_BOWL" : ""}
        ${ULTRA ? "#define SAND_RELIEF" : ""}
        #define SAND_LOOK
        varying vec3 sWorld;
        varying vec3 sTx;
        varying vec3 sTz;
        uniform vec2 sRake;
        uniform float gWet;
        float sEdge = 0.0;
        float sWetNow = 0.0;
        ${FIELD}
        ${NOISE}
        ${SAND_GLSL}`,
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        {
          vec2 f = fieldAt(sLocal);
          sEdge = f.x;
          float wet = 0.0;
          #ifdef SAND_WET
          // The last metre or so before the water, raggedly.
          wet = 1.0 - smoothstep(0.0, 1.2, nearAt(sLocal) + 0.5 * (gNoise(sWorld.xz * 1.3) - 0.5));
          #endif
          diffuseColor.rgb *= sandColour(sWorld.xz, f.x, f.y, wet, sRake);
          sWetNow = wet;
          #ifdef SAND_BOWL
          diffuseColor.rgb *= mix(sandLipShade(f.x), 1.0, wet);
          #endif
        }`,
      )
      .replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
        #ifdef SAND_BOWL
        {
          // The bowl: the way in from the edge (the field's slope, two more
          // reads of it), and the face tilted towards it, steepest at the
          // lip - so one face catches the sun and the other is in shade.
          vec2 fg = vec2(fieldAt(sLocal + vec2(0.25, 0.0)).x, fieldAt(sLocal + vec2(0.0, 0.25)).x) - sEdge;
          fg /= 0.25;
          float fall = sandBowl(sEdge);
          normal = normalize(normal + (sTx * fg.x + sTz * fg.y) * fall);
        }
        #endif
        ${HIGH ? leanNormal("sLean", 0.5) : ""}
        #ifdef SAND_RELIEF
        {
          // (Only near enough to see it: past a few centimetres a pixel it
          // would only shimmer.)
          float near = 1.0 - smoothstep(0.004, 0.02, fwidth(sWorld.x));
          if (near > 0.0) {
            vec2 w = sWorld.xz;
            float e = 0.015;
            float h0 = sandHeight(w, sRake, sWetNow);
            vec2 g = vec2(sandHeight(w + vec2(e, 0.0), sRake, sWetNow) - h0, sandHeight(w + vec2(0.0, e), sRake, sWetNow) - h0) / e;
            normal = normalize(normal - (viewMatrix * vec4(g.x, 0.0, g.y, 0.0)).xyz * near * 2.6);
            // The bottom of a print a shade darker, in its own shadow.
            diffuseColor.rgb *= 1.0 + clamp(h0, -0.02, 0.0) * 12.0 * near;
          }
        }
        #endif`,
      );
  };
  material.customProgramCacheKey = () => `sand-v9-${ULTRA ? "u" : HIGH ? "h" : "s"}-${field.near ? "w" : "d"}${bowl ? "b" : ""}${PHONE ? "p" : ""}`;
  withSceneryHooks(material, "sand");
  // (Its node version, on WebGPURenderer: glsl/sandnode.js.)
  markTwin(material, "sand", { uniforms, near: !!field.near, bowl, high: HIGH });
  material.userData.field = field;
  material.userData.surface = true;
  return material;
}

// The collar of grass round a bunker, a touch longer and darker than the
// rough, for an edgeStrip (grass.js) along its outline.
export function lipMaterial(hole = null) {
  return grassMaterial({ ...GRASS.rough, light: PALETTE.collar, dark: PALETTE.collar, patch: 0.4, patchScale: 0.3, detail: 1, detailScale: 0.6, hole, edge: true, layer: LAYER.lip });
}

// The muddy, damp margin round a pond, fading into the grass: an edgeStrip
// along its outline.
export function bankMaterial(hole = null) {
  return grassMaterial({ light: PALETTE.waterBank, dark: PALETTE.waterBank, stripeWidth: 0, patch: 0.35, patchScale: 0.4, detail: 0.6, detailScale: 0.5, tint: 0.3, hole, edge: true, layer: LAYER.bank });
}

// ---- Water ---------------------------------------------------------------------

// Ripples as a normal map, made of overlapping waves (sim/ripplemap.mjs).
let rippleTexture = null;
function ripples() {
  if (rippleTexture) return rippleTexture;
  const size = RIPPLE_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(size, size);
  img.data.set(rippleMap(size));
  ctx.putImageData(img, 0, 0);
  rippleTexture = new THREE.CanvasTexture(canvas);
  rippleTexture.wrapS = rippleTexture.wrapT = THREE.RepeatWrapping;
  rippleTexture.colorSpace = THREE.NoColorSpace;
  return rippleTexture;
}

// Every water material's clock, so their ripples can drift (animateWater,
// which moves the ground's own weather on too: look/glsl/ground.js);
// disposeSurface takes each out again when its hole or green is rebuilt.
// weather: the weather's values (look/weatherlook.js): the ripples run the
// way the wind blows, glassy in a calm and choppier the stronger it is, on
// the one gust clock. With no wind at all (weather.still, or none), they
// drift as they always have.
const waters = new Set();
// Shared by every water material: how far each set of ripples has drifted
// (in the ripple texture's own units) and how rough the water is.
const rippleUniforms = {
  wDriftA: { value: new THREE.Vector2() },
  wDriftB: { value: new THREE.Vector2() },
  wChop: { value: 1 },
  // The gust patches: how far they've travelled (world metres), the way
  // the wind blows, and how strong they are now (0 none).
  wGustOff: { value: new THREE.Vector2() },
  wWindDir: { value: new THREE.Vector2(1, 0) },
  wGustK: { value: 0 },
  // How much wind there is for a lee by the bank it blows off (WATER_LEE).
  wWindK: { value: 0 },
  // How much sun there is for glints (1 a fair day's), and how hard it's
  // raining (0 - 1) for the rings.
  wSun: { value: 1 },
  wRain: { value: 0 },
  // On Ultra, where balls have gone in (splashWater): each x, z, when (on
  // the water's clock) and how big - 0 none.
  wSplash: { value: Array.from({ length: SPLASH.most }, () => new THREE.Vector4()) },
};
let lastWater = null;
let splashes = [];

// A ball into the water at world x, z, coming down at `speed` m/s: rings
// spread from it on Ultra (sim/ultra.mjs splashRings).
export function splashWater(x, z, speed) {
  if (!ULTRA) return;
  splashes = addSplash(splashes, { x, z, time: lastWater ?? 0, size: splashSize(speed) });
  rippleUniforms.wSplash.value.forEach((v, i) => {
    const s = splashes[i];
    v.set(s?.x ?? 0, s?.z ?? 0, s?.time ?? 0, s?.size ?? 0);
  });
}
export function animateWater(time, weather = null) {
  // The ground's wind (and wet and dry) on the same clock.
  animateGround(time, weather);
  for (const u of waters) u.value = time;
  const dt = lastWater === null ? 0 : Math.min(0.25, Math.max(0, time - lastWater));
  lastWater = time;
  const { wDriftA, wDriftB, wChop } = rippleUniforms;
  const r = rippleDrift(weather);
  wDriftA.value.x += r.a[0] * dt;
  wDriftA.value.y += r.a[1] * dt;
  wDriftB.value.x += r.b[0] * dt;
  wDriftB.value.y += r.b[1] * dt;
  // Eased, so a gust ruffles the water rather than switching it.
  wChop.value += (r.chop - wChop.value) * Math.min(1, dt * 1.5);
  const look = waterLook(weather);
  const u = rippleUniforms;
  u.wGustOff.value.x += look.travel[0] * dt;
  u.wGustOff.value.y += look.travel[1] * dt;
  u.wWindDir.value.set(...look.dir);
  u.wGustK.value += (look.gust - u.wGustK.value) * Math.min(1, dt * 1.5);
  u.wWindK.value += (look.wind - u.wWindK.value) * Math.min(1, dt * 1.5);
  u.wSun.value = look.sun;
  u.wRain.value = look.rain;
}

// What the water shows of the weather, beyond its ripples (animateWater):
//   gust    how strong the darker gust patches are (0 in a calm or still
//           air; more the stronger the wind, and most in its gusts)
//   travel  how fast they race downwind (world metres a second, x and z)
//   dir     the way the wind blows
//   wind    how much wind there is for a lee by the bank it blows off (0
//           in still air, 1 from WATER_LEE.wind mph)
//   sun     how much the sun is out, for glints (0 none, 1 a fair day's)
//   rain    how hard it's raining, for rings (0 none)
export function waterLook(weather) {
  const sun = Math.max(0, Math.min(1, weather?.sun ?? 1));
  const rain = Math.max(0, Math.min(1, weather?.rain ?? 0));
  if (!weather || weather.still) return { gust: 0, travel: [0, 0], dir: [1, 0], wind: 0, sun, rain };
  const mph = Math.max(0, weather.mph ?? 0);
  const gusting = Math.max(0, weather.gusting ?? mph);
  const dir = weather.dir ?? [1, 0];
  // Nothing under 3 mph; full by 18 mph; and in a gust (the gust clock
  // runs 0.7 - 1.35) up to half as strong again, in a lull a third less.
  const base = Math.min(1, Math.max(0, (mph - 3) / 15));
  const surge = Math.max(0.65, Math.min(1.5, 1 + ((weather.gust ?? 1) - 1) * 1.4));
  const gust = Math.min(1, base * surge);
  // Cat's paws run with the wind, at about half its speed.
  const speed = gusting * 0.447 * 0.5;
  return { gust, travel: [dir[0] * speed, dir[1] * speed], dir: [dir[0], dir[1]], wind: Math.min(1, mph / WATER_LEE.wind), sun, rain };
}

// How the ripples drift and how rough the water is, for the weather's
// values: { a, b } each set's drift (texture units a second, world x and
// z), chop (1 as it always was). The first set runs downwind, the finer
// second across it a little, so no tile shows.
export function rippleDrift(weather) {
  if (!weather || weather.still) return { a: [0.012, 0.007], b: [-0.017, 0.011], chop: 1 };
  const mph = Math.max(0, weather.gusting ?? 0);
  const [dx, dz] = weather.dir;
  const speed = 0.004 + 0.0011 * mph;
  const turn = 0.45;
  const bx = dx * Math.cos(turn) - dz * Math.sin(turn);
  const bz = dx * Math.sin(turn) + dz * Math.cos(turn);
  // Glassy in a calm (a quarter of the usual ripple), full at 12 mph,
  // choppier beyond.
  const chop = 0.25 + 0.75 * Math.min(1, mph / 12) + 0.6 * Math.min(1, Math.max(0, (mph - 12) / 13));
  return { a: [dx * speed, dz * speed], b: [bx * speed * 1.4, bz * speed * 1.4], chop };
}

// Water. field: from fieldTexture(outline, { range: WATER_RANGE }) - or
// null, when all of it is treated as open water some way from the bank.
// marsh: a wetland edge on its far shore (sim/hazardshapes.mjs), in the
// world: { x, z (the water's middle), dir: [x, z] (the way from there to
// the middle of the marsh), span (half its arc round, radians) } - its
// muddy margin and shallows four times as wide across it.
// run: running water - a burn or a brook - { dir: [x, z] (the world's,
// downstream), speed (m/s) }: shallow and clear, its ripples carried
// downstream (WATER_RUN).
export function waterMaterial({ field = null, layer = LAYER.water, edgeScale = 1, marsh = null, bank = null, run = null } = {}) {
  const material = onLayer(
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.26, metalness: 0, envMapIntensity: 0.16 }),
    layer,
  );
  // Pulled well forward: the polygon offset's pull grows with how steeply a
  // surface is seen, so the steep face of a bunker dug into a pond could
  // out-pull flat water and show a thread of sand through it.
  material.polygonOffsetFactor = -8;
  const time = { value: 0 };
  waters.add(time);
  // On Ultra, the trees and banks mirrored in it (look/mirrors.js).
  const mirror = ULTRA ? mirrorUniforms() : null;
  // (A brook's: its far bank where it is across it.)
  const brook = bank != null;
  const uniforms = {
    ...(mirror ?? {}),
    sField: { value: field?.texture ?? null },
    sFieldBox: { value: field?.box ?? new THREE.Vector4(0, 0, 1, 1) },
    sFieldRange: { value: new THREE.Vector2(...(field?.range ?? WATER_RANGE)) },
    wRipple: { value: ripples() },
    wTime: time,
    // (A narrow brook's edge read as if it were further off: its muddy
    // margin and its shallows as narrow as its width needs, not a pond's.)
    wEdgeScale: { value: edgeScale },
    wMarsh: { value: new THREE.Vector4(marsh?.x ?? 0, marsh?.z ?? 0, marsh?.dir?.[0] ?? 1, marsh?.dir?.[1] ?? 0) },
    wMarshArc: { value: new THREE.Vector2(Math.cos(marsh?.span ?? 1), Math.cos((marsh?.span ?? 1) * 0.7)) },
    // What its far bank mirrors (WATER_BAND): a pond's trees, or a brook's
    // own banks (bank: how high they stand over its water).
    wFarBank: { value: new THREE.Vector4(...(bank != null ? WATER_BAND.brook(bank.height, bank.across) : WATER_BAND.pond)) },
    // And how much of the sky's sheen it shows (WATER_SHEEN).
    wSheen: { value: new THREE.Vector3(...(bank != null ? WATER_SHEEN.brook : WATER_SHEEN.pond)) },
    // Running water's way and speed downstream (WATER_RUN).
    wFlow: { value: new THREE.Vector3(run?.dir?.[0] ?? 1, run?.dir?.[1] ?? 0, run?.speed ?? 0) },
    ...rippleUniforms,
  };
  // How rough it is now, for how far its reflection can be bent
  // (look/mirrors.js: sim/mirrorreach.mjs rippleBend).
  material.userData.ripple = { ...rippleUniforms, wTime: time };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\nvarying vec3 sWorld;\nvarying vec2 sLocal;\nvarying vec2 sAxis;${brook ? "\nattribute vec2 bAcross;\nattribute float bSide;\nvarying vec2 vAcross;\nvarying float vSide;" : ""}`)
      .replace(
        "#include <project_vertex>",
        // (sAxis: the mesh's own x in world terms, to turn the field's
        // slope into the world's. A brook's way across and how far from
        // its middle: course/holescenery.js drawBrook.)
        `#include <project_vertex>\nsWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;\nsLocal = transformed.xz;\nsAxis = normalize((modelMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xz + vec2(1e-6, 0.0));${brook ? "\nvAcross = bAcross;\nvSide = bSide;" : ""}`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        ${HIGH ? "#define WATER_FINE" : ""}
        ${field ? "#define WATER_FIELD" : ""}
        ${field?.near ? "#define WATER_SANDY" : ""}
        ${field?.wall ? "#define WATER_WALL" : ""}
        ${field?.cut ? "#define WATER_CUT" : ""}
        ${mirror ? "#define WATER_MIRROR" : ""}
        ${ULTRA ? "#define WATER_LIVING" : ""}
        ${field && marsh ? "#define WATER_MARSH" : ""}
        ${run ? "#define WATER_RUN" : ""}
        varying vec3 sWorld;
        ${brook ? "varying vec2 vAcross;\nvarying float vSide;" : ""}
        #ifdef WATER_RUN
        uniform vec3 wFlow;
        #endif
        #ifdef WATER_MARSH
        uniform vec4 wMarsh;
        uniform vec2 wMarshArc;
        #endif
        #ifdef WATER_LIVING
        uniform vec4 wSplash[${SPLASH.most}];
        // Light through the ripples, gathered into bright threads on the
        // bed of the shallows (a long-known trick of folded sine waves).
        float wCaustic(vec2 p, float t) {
          vec2 i = p;
          float c = 1.0;
          for (int n = 0; n < 3; n++) {
            float tt = t * (1.0 - 3.5 / float(n + 1));
            i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
            c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / 0.005), p.y / (cos(i.y + tt) / 0.005)));
          }
          c = 1.17 - pow(c / 3.0, 1.4);
          return pow(abs(c), 8.0);
        }
        #endif
        #ifdef WATER_MIRROR
        uniform sampler2D wMirror;
        uniform mat4 wMirrorMatrix;
        uniform float wMirrorK;
        #endif
        uniform sampler2D wRipple;
        uniform float wTime;
        uniform float wEdgeScale;
        uniform vec4 wFarBank;
        uniform vec3 wSheen;
        uniform vec2 wDriftA;
        uniform vec2 wDriftB;
        uniform float wChop;
        uniform vec2 wGustOff;
        uniform vec2 wWindDir;
        uniform float wGustK;
        uniform float wWindK;
        uniform float wSun;
        uniform float wRain;
        varying vec2 sAxis;
        ${FIELD}
        ${NOISE}
        float wShore;
        float wDeep;
        // How far in from the edge (metres, before it's made ragged), and
        // how strong a gust patch is here.
        float wEdgeD = 8.0;
        float wGp = 0.0;
        vec3 wGlint = vec3(0.0);
        float wShallowBed = 0.0;
        float wRing = 0.0;`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        #ifdef WATER_CUT
        // None on a green or its fringe, which it gives way to (sim/
        // greenfirst.mjs): its field's green says how far past them.
        if (texture2D(sField, (sLocal - sFieldBox.xy) / sFieldBox.zw).g * ${(2 * CUT_RANGE).toFixed(1)} - ${CUT_RANGE.toFixed(1)} < 0.0) discard;
        #endif
        {
          vec2 w = sWorld.xz;
          #ifdef WATER_FIELD
          float d = fieldAt(sLocal).x * wEdgeScale;
          wEdgeD = d;
          #else
          float d = 8.0;
          #endif
          #ifdef WATER_MARSH
          // Across a wetland edge, the shallows and mud four times as wide
          // (sim/hazardshapes.mjs marsh).
          float wMarshK = smoothstep(wMarshArc.x, wMarshArc.y, dot(normalize(w - wMarsh.xy + 1e-4), wMarsh.zw));
          d /= mix(1.0, 4.0, wMarshK);
          #endif
          // Raggedly, not in neat rings round the edge.
          d += (gNoise(w * 0.3) - 0.5) * 1.6;
          // Deep, dark water out in the middle; lighter, greener and
          // browner towards the bank, where the bed shows through; mud at
          // the very edge to meet the bank's.
          vec3 deep = ${glsl(PALETTE.waterDeep)};
          vec3 shallow = ${glsl(PALETTE.waterShallow)};
          vec3 mud = ${glsl(PALETTE.waterMud)};
          wDeep = smoothstep(0.3, 6.0, d);
          vec3 col = mix(shallow, deep, wDeep);
          col *= 0.9 + 0.2 * gNoise(w * 0.05 + 7.0);
          #ifdef WATER_RUN
          // Running water, shallow and clear: its stony bed through it,
          // tinted by the water, its own colour in its pools (WATER_RUN).
          {
            float pool = smoothstep(${f3(WATER_RUN.poolFrom)}, ${f3(WATER_RUN.poolTo)}, gNoise(w * 0.12 + 31.0));
            vec3 bed = ${glsl(PALETTE.runBed)} * (0.8 + 0.4 * gFbm(w * 2.2));
            bed *= mix(1.0, 0.62, smoothstep(0.62, 0.74, gNoise(w * 5.0 + 3.0)));
            col = mix(mix(bed, shallow, ${f3(WATER_RUN.tint)}), col, clamp(${f3(WATER_RUN.clear)} + wDeep * pool, 0.0, 1.0));
          }
          #endif
          // Looked down into, deep water isn't black: the light scattered
          // back up from inside it shows - a dark teal-green, lighter the
          // more steeply it's seen (from a chase camera or a drive's
          // height it was near black). Seen low, across it, as before.
          float wUp = dot(normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz), normalize(vViewPosition));
          col = mix(col, col * 1.5 + ${glsl(PALETTE.waterBody)}, smoothstep(0.25, 0.85, wUp) * wDeep);
          wShore = 1.0 - smoothstep(0.0, 0.9, d);
          // (Where a bunker runs into it, just the same: water over a
          // muddy bed with its brown margin, never sand showing under it -
          // the owner: "shouldn't see sand under the water". The sand turns
          // to the same mud along the water's edge: sandColour's wet.)
          #ifdef WATER_WALL
          // Along a wall there's no muddy margin, just water against the
          // wall - darker where it laps at it, in the wall's shade.
          float wallD = wallAt(sLocal);
          wShore *= smoothstep(0.2, 1.0, wallD);
          col *= mix(0.62, 1.0, smoothstep(0.0, 0.5, wallD));
          #endif
          col = mix(col, mud, wShore);
          #if defined(WATER_LIVING) && defined(WATER_FIELD)
          // Living water: the edge laps - a soft, wet line just out from
          // the mud, coming and going, and the water clearer over the bed
          // just past it.
          float lap = 0.65 + 0.22 * sin(wTime * 0.9 + gNoise(w * 0.4) * 6.0);
          float wLine = 1.0 - smoothstep(0.0, 0.18, abs(d - lap));
          col = mix(col, ${glsl(PALETTE.waterShallow)} * 1.35, wLine * 0.35);
          wShallowBed = smoothstep(0.4, 1.2, d) * (1.0 - smoothstep(1.5, 4.5, d));
          #endif
          diffuseColor.rgb *= pow(col, vec3(2.2));
        }`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        // The muddy margin is matt: no bright line of reflected sky.
        "#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.7, wShore);",
      )
      .replace(
        "#include <normal_fragment_maps>",
        `{
          // Ripples in world space: two sets, different sizes, drifting
          // different ways and bent by slow noise, so neither's tile shows. Calmer far away, where
          // they'd only shimmer, and in the margin.
          vec2 w = sWorld.xz;
          vec2 warp = vec2(gNoise(w * 0.035), gNoise(w * 0.035 + 13.0)) * 6.0;
          // (Each set drifted the way the wind blows: animateWater.)
          vec2 a = texture2D(wRipple, (w + warp) * 0.075 - wDriftA).xy * 2.0 - 1.0;
          #ifdef WATER_RUN
          // Running: finer, drawn out along the flow and carried
          // downstream (WATER_RUN), turned back to the world's way.
          {
            vec2 fd = wFlow.xy;
            vec2 fn = vec2(-fd.y, fd.x);
            vec2 fp = vec2((dot(w, fd) - wTime * wFlow.z) * ${f3(WATER_RUN.stretch)}, dot(w, fn));
            vec2 fa = texture2D(wRipple, (fp + warp) * ${f3(0.075 * WATER_RUN.scale)}).xy * 2.0 - 1.0;
            a = fd * fa.x + fn * fa.y;
          }
          #endif
          vec2 slope = a * ${f3(RIPPLE.coarse)};
          #ifdef WATER_FINE
          // (The second, finer set only on High: on Standard it sparkled
          // like sequins.)
          vec2 q = mat2(0.8, -0.6, 0.6, 0.8) * w;
          vec2 b = texture2D(wRipple, (q - warp.yx) * 0.21 - mat2(0.8, -0.6, 0.6, 0.8) * wDriftB).xy * 2.0 - 1.0;
          slope += b * ${f3(RIPPLE.fine)};
          #endif
          float far = smoothstep(0.005, 0.12, fwidth(w.x * 0.21));
          // In the lee of the bank the wind blows off, glassy, the wind's
          // ripples growing back over the open water (WATER_LEE): where the
          // way in from the nearest bank runs with the wind.
          float wLee = 0.0;
          ${brook ? "" : `#ifdef WATER_FIELD
          if (wWindK > 0.0) {
            vec2 lfs = vec2(fieldAt(sLocal + vec2(wFarBank.z, 0.0)).x, fieldAt(sLocal + vec2(0.0, wFarBank.z)).x) * wEdgeScale - wEdgeD;
            vec2 lgw = vec2(sAxis.x * lfs.x - sAxis.y * lfs.y, sAxis.y * lfs.x + sAxis.x * lfs.y);
            float offBank = dot(lgw / max(length(lgw), 1e-4), wWindDir);
            wLee = smoothstep(0.0, 0.6, offBank) * (1.0 - smoothstep(${f3(WATER_LEE.near)}, ${f3(WATER_LEE.reach)}, wEdgeD)) * wWindK * step(1e-4, length(lfs));
          }
          #endif`}
          // Gusts: darker, choppier patches - cat's paws - racing downwind,
          // longer along the wind than across it. None in a calm.
          if (wGustK > 0.0) {
            vec2 gq = (w - wGustOff) * 0.05;
            float gn = gNoise(vec2(dot(gq, wWindDir) * 0.55, dot(gq, vec2(-wWindDir.y, wWindDir.x))) + 17.0);
            wGp = smoothstep(0.52, 0.82, gn) * wGustK * (1.0 - wShore);
          }
          wGp *= 1.0 - wLee;
          slope *= (1.0 - 0.8 * far) * (1.0 - 0.9 * wShore) * wChop * (1.0 + ${f3(RIPPLE.gust)} * wGp) * (1.0 - ${f3(WATER_LEE.calm)} * wLee);
          #ifdef WATER_FINE
          // Rain: a ring spreading and fading where each drop lands, one
          // spot in each half-metre square, more of them the harder it rains.
          if (wRain > 0.0) {
            vec2 rc = w * 2.0;
            vec2 ci = floor(rc);
            float h = gHash(ci);
            vec2 dv = fract(rc) - 0.5 - (vec2(gHash(ci + 3.1), gHash(ci + 7.7)) - 0.5) * 0.4;
            float age = fract(wTime * 0.8 + h * 7.0);
            float rd = length(dv);
            float ring = (1.0 - smoothstep(0.0, 0.06, abs(rd - age * 0.42))) * (1.0 - age) * step(h, wRain * 0.85);
            slope += dv / max(rd, 1e-3) * ring * ${f3(RIPPLE.rain)} * (1.0 - far) * (1.0 - wShore);
          }
          #endif
          #ifdef WATER_LIVING
          // Where a ball's gone in: rings spreading out (sim/ultra.mjs
          // splashRings - the same sums).
          for (int si = 0; si < ${SPLASH.most}; si++) {
            vec4 sp = wSplash[si];
            float age = wTime - sp.z;
            if (sp.w <= 0.0 || age < 0.0 || age >= ${SPLASH.life.toFixed(2)}) continue;
            vec2 dv = w - sp.xy;
            float rd = length(dv);
            float fade = pow(1.0 - age / ${SPLASH.life.toFixed(2)}, 2.0) * sp.w;
            for (int ri = 0; ri < ${SPLASH.rings}; ri++) {
              float a = age - float(ri) * ${SPLASH.gap.toFixed(2)};
              if (a < 0.0) break;
              float r = a * ${SPLASH.speed.toFixed(2)} * (0.6 + 0.4 * sp.w);
              float k = fade * (1.0 - float(ri) * ${f3(RIPPLE.ringFade)});
              // A smooth bump a little wider as it spreads: its slope.
              float x = (rd - r) / (0.07 + 0.03 * a);
              slope += dv / max(rd, 1e-3) * (-x * exp(-x * x)) * k * ${f3(RIPPLE.splash)} * (1.0 - wShore);
              // (Its crest catches the sky: a faint sheen, so it shows
              // over dark water too.)
              wRing += exp(-x * x * 2.0) * k * (1.0 - wShore);
            }
          }
          #endif
          vec3 nw = normalize(vec3(-slope.x, 1.0, -slope.y));
          normal = normalize((viewMatrix * vec4(nw, 0.0)).xyz);
        }`,
      )
      .replace(
        "#include <lights_fragment_begin>",
        `#include <lights_fragment_begin>
        // The sun's broad sheen on the ripples, turned well down: at full
        // strength, looking towards the sun, it was a white blotch like
        // crumpled foil. (The glints below are the sparkle.)
        reflectedLight.directSpecular *= 0.35;
        #if defined(WATER_FINE) && (NUM_DIR_LIGHTS > 0) && defined(RE_Direct)
        {
          // Glints: tiny, bright catches of the sun on the ripples (none in
          // shadow - the sun's colour here already has its shadow in it).
          vec3 hv = normalize(directLight.direction + geometryViewDir);
          float g = pow(max(dot(normal, hv), 0.0), 1800.0);
          // Kept apart, so they stay sparse points of light over the capped
          // water (opaque_fragment, below), not part of a bright sheet: only
          // in one small patch of the water in ten, so from above, looking
          // towards the sun, the ripples sparkle rather than turning to foil.
          vec2 wCell = floor(sWorld.xz * 2.5);
          float wSparse = step(0.9, fract(sin(dot(wCell, vec2(12.9898, 78.233))) * 43758.5453));
          // Only with the sun out.
          wGlint = directLight.color * g * 2.0 * (1.0 - wShore) * wSparse * smoothstep(0.5, 0.9, wSun);
        }
        #endif`,
      )
      .replace(
        "#include <lights_fragment_end>",
        // Nor much of the sky's reflection in it, so the water meets the
        // bank without a pale rim; and less in the shallows, where the bed
        // shows through.
        `#include <lights_fragment_end>
        // The sky in it as a soft green-grey sheen, never a blue mirror: a
        // pond mirrors the trees and banks round it as much as the sky, so
        // the sky's colour is mostly taken out. None at the muddy margin,
        // nor the sun's sheen there, which at a low angle drew a pale kerb
        // round the pond.
        // (A brook's more of it, and bluer: WATER_SHEEN.)
        vec3 wSky = reflectedLight.indirectSpecular * wSheen.z;
        float wSkyLum = dot(wSky, vec3(0.2126, 0.7152, 0.0722));
        wSky = mix(vec3(wSkyLum), wSky, wSheen.x);
        // And never brighter than a sheen: the glow round the sun, caught
        // by the ripples, was a white blotch like crumpled foil.
        wSky *= min(1.0, wSheen.y / max(wSkyLum, 1e-4));
        reflectedLight.indirectSpecular = wSky * ${glsl(PALETTE.waterSheen)} * (1.0 - wShore) * (0.35 + 0.65 * wDeep);
        reflectedLight.directSpecular *= 1.0 - wShore;
        // Looking across it from low down, it would mirror the trees and
        // the far bank, not the pale sky the reflections are made from:
        // dimmer and greener there, rather than a white sheet.
        // Far off and seen almost edge on - a pond from the tee - that's
        // most of what it shows, so it reads as dark water, not a pale strip.
        // Judged by the water's true level, not the rippled normal, which
        // tilts towards the eye at a low angle and hid how low it was.
        // Close to, seen as low, it still shows the sky's sheen (WATER_LOW).
        float wLow = dot(normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz), geometryViewDir);
        float wLowK = smoothstep(${f3(WATER_LOW.from)}, mix(${f3(WATER_LOW.near)}, ${f3(WATER_LOW.far)}, smoothstep(${f3(WATER_LOW.nearAt)}, ${f3(WATER_LOW.farAt)}, length(vViewPosition))), wLow);
        reflectedLight.indirectSpecular *= mix(vec3(0.08, 0.11, 0.085), vec3(1.0), wLowK);
        // The sun's sheen too: seen that low, looking towards the sun, it
        // turned a far pond into a pale grey road.
        reflectedLight.directSpecular *= mix(0.15, 1.0, wLowK);
        // A gust patch is darker: its rougher surface catches less of the
        // sky, and less of the sun's sheen.
        reflectedLight.indirectSpecular *= 1.0 - 0.6 * wGp;
        reflectedLight.directSpecular *= 1.0 - 0.4 * wGp;
        reflectedLight.indirectDiffuse *= 1.0 - 0.15 * wGp;
        reflectedLight.directDiffuse *= 1.0 - 0.15 * wGp;
        // The far bank's trees and earth, mirrored along the far side: no
        // second picture of the scene, but worked out from how steeply the
        // water is seen and how far on the bank is that way - a band
        // along the far side, taller the lower the eye, and broken up by
        // the ripples.
        float wBand = 0.0;
        ${brook ? `{
          // A brook's: which way across it the eye looks, and how far on
          // the bank is that way, from how far from its middle this is.
          vec2 look = normalize(sWorld.xz - cameraPosition.xz + vec2(1e-4));
          float c = dot(look, normalize(vAcross + vec2(1e-6)));
          float halfW = wFarBank.w * 0.5;
          float on = c > 0.0 ? max(halfW - vSide, 0.0) / max(c, 0.05) : max(halfW + vSide, 0.0) / max(-c, 0.05);
          float along = on + dot(normal.xy, vec2(6.0, 4.0)) * wFarBank.y / 11.0;
          float tanLow = wLow / sqrt(max(1.0 - wLow * wLow, 1e-4));
          wBand = (1.0 - smoothstep(0.7, 1.35, tanLow * (along + wFarBank.x) / wFarBank.y)) * smoothstep(0.08, 0.35, abs(c)) * (1.0 - wShore);
          reflectedLight.indirectSpecular *= 1.0 - 0.85 * wBand;
          reflectedLight.directSpecular *= 1.0 - 0.8 * wBand;
        }` : ""}
        // (A pond's: from how far it is to its edge, and that distance's slope.)
        ${brook ? "#if 0" : "#ifdef WATER_FIELD"}
        {
          // The field's slope (pointing in from the edge), in world terms.
          vec2 fs = vec2(fieldAt(sLocal + vec2(wFarBank.z, 0.0)).x, fieldAt(sLocal + vec2(0.0, wFarBank.z)).x) * wEdgeScale - wEdgeD;
          vec2 gw = vec2(sAxis.x * fs.x - sAxis.y * fs.y, sAxis.y * fs.x + sAxis.x * fs.y);
          vec2 look = sWorld.xz - cameraPosition.xz;
          float towards = -dot(normalize(look + vec2(1e-4)), gw / max(length(gw), 1e-4));
          // Metres on to the bank, looking that way (and within the
          // field's reach, where it has a slope at all), nudged by the
          // ripples.
          float along = wEdgeD / wEdgeScale / max(towards, 0.05) + dot(normal.xy, vec2(6.0, 4.0)) * wFarBank.y / 11.0;
          float tanLow = wLow / sqrt(max(1.0 - wLow * wLow, 1e-4));
          wBand = (1.0 - smoothstep(0.7, 1.35, tanLow * (along + wFarBank.x) / wFarBank.y)) * smoothstep(0.08, 0.35, towards) * step(0.01, length(fs)) * (1.0 - wShore);
          reflectedLight.indirectSpecular *= 1.0 - 0.85 * wBand;
          reflectedLight.directSpecular *= 1.0 - 0.8 * wBand;
        }
        #endif`,
      )
      .replace(
        "#include <opaque_fragment>",
        // Seen from above - a chase camera high over a pond, looking towards
        // the sun - the sun's sheen off the ripples turned the whole pond to
        // bright silver foil, the brightest thing in the picture. However
        // it's lit, it's never brighter than the fairway would be in the
        // same light here (a share of it: WATER_LIT_CAP); its glints stay
        // sparse points on top.
        `{
          vec3 wLum = vec3(0.2126, 0.7152, 0.0722);
          float wLit = dot(outgoingLight, wLum);
          float wLight = dot(reflectedLight.directDiffuse + reflectedLight.indirectDiffuse, wLum) / max(dot(diffuseColor.rgb, wLum), 1e-4);
          float wCap = ${WATER_LIT_CAP.toFixed(3)} * dot(${glslLinear(PALETTE.fairway[0])}, wLum) * wLight;
          // On Ultra, the trees and banks round it mirrored in it
          // (look/mirrors.js): the picture drawn from under the water,
          // broken up by the ripples, more of it the lower it's seen, a
          // little darker than what it mirrors - and none at the muddy
          // margin. Where nothing's mirrored (the sky) it's as without.
          float wMirA = 0.0;
          #ifdef WATER_MIRROR
          if (wMirrorK > 0.0) {
            vec4 mc = wMirrorMatrix * vec4(sWorld, 1.0);
            vec3 nFlat = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
            vec2 muv = mc.xy / mc.w + (normal.xy - nFlat.xy) * ${f3(RIPPLE.mirror)};
            vec4 mir = texture2D(wMirror, clamp(muv, 0.001, 0.999));
            wMirA = mir.a * (1.0 - wShore) * wMirrorK;
            float wFres = mix(0.35, 0.8, 1.0 - smoothstep(0.02, 0.6, wLow));
            outgoingLight = mix(outgoingLight, mir.rgb * 0.7, wMirA * wFres * (1.0 - 0.5 * wGp));
          }
          #endif
          // The far bank's band: its trees and earth, dark but lit as the
          // water is - never black. (Not where they're mirrored for real.)
          outgoingLight = mix(outgoingLight, ${glslLinear(PALETTE.waterBankTrees)} * max(wLight, 0.2), wBand * 0.7 * (1.0 - wMirA));
          wLit = dot(outgoingLight, wLum);
          // Nor darker than a share of it (WATER_LIT_FLOOR): what's missing
          // made up in deep water's own dark teal, so on a calm day, seen
          // from the fairway or the ball's flight, it's dark water - not a
          // hole the picture's finish turns pure black.
          float wFloor = ${WATER_LIT_FLOOR.toFixed(3)} * dot(${glslLinear(PALETTE.fairway[0])}, wLum) * wLight;
          if (wLit < wFloor) outgoingLight += ${glslLinear(PALETTE.waterFloor)} * ((wFloor - wLit) / ${linearLum(PALETTE.waterFloor).toFixed(4)});
          wLit = dot(outgoingLight, wLum);
          if (wLit > wCap) outgoingLight *= wCap / wLit;
          #ifdef WATER_LIVING
          // Caustics: the sun's light, bent by the ripples, in moving
          // threads on the bed of the shallows - only in the sun, and only
          // near enough to see them (far off they'd only shimmer).
          {
            float near = 1.0 - smoothstep(0.004, 0.04, fwidth(sWorld.x * 0.7));
            float cK = wShallowBed * near * smoothstep(0.5, 0.9, wSun) * (1.0 - wGp);
            if (cK > 0.0) {
              vec2 cp = mod(sWorld.xz * 0.7, 6.2832) - 250.0;
              float cs = wCaustic(cp, wTime * 0.35 + 23.0);
              // (The sun's light on the bed, not the dark water's colour,
              // which hid them: the light reaching it, on the bed's own
              // colour.)
              vec3 cSun = reflectedLight.directDiffuse / max(dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722)), 1e-3);
              outgoingLight += cSun * vec3(0.85, 0.92, 0.75) * min(cs, 1.5) * 0.35 * cK;
            }
          }
          #endif
          #ifdef WATER_LIVING
          outgoingLight += vec3(0.85, 0.9, 0.88) * wCap * 0.45 * min(wRing, 1.0);
          #endif
          outgoingLight += wGlint;
        }
        #include <opaque_fragment>`,
      );
  };
  material.customProgramCacheKey = () => `water-v17-${ULTRA ? "u" : HIGH ? "h" : "s"}-${field ? (field.near ? "s" : "f") : "n"}${field?.wall ? "w" : ""}${field?.cut ? "c" : ""}${field && marsh ? "k" : ""}${mirror ? "m" : ""}${brook ? "b" : ""}${run ? "r" : ""}`;
  withSceneryHooks(material, "water");
  // (Its node version, on WebGPURenderer: glsl/waternode.js.)
  markTwin(material, "water", { uniforms, field: field ? { wall: !!field.wall, cut: !!field.cut } : null, marsh: !!(field && marsh), fine: HIGH, living: ULTRA, mirror: !!mirror, brook, run: !!run });
  material.userData.field = field;
  material.userData.time = time;
  material.userData.mirror = mirror;
  material.userData.surface = true;
  return material;
}

// What the sea (look/sea.js) shares with every pond: the ripple picture,
// their drift, chop and gusts (rippleUniforms), and a clock of its own
// wound on with theirs (animateWater) - taken out again by disposeSurface.
export function waterParts() {
  const time = { value: 0 };
  waters.add(time);
  return { ripple: ripples(), uniforms: rippleUniforms, time };
}

// Water for an outline in the mesh's object space; sand: the outlines of
// any bunkers running into it, in the same space.
// wall: the line of a wall along its edge (sim/walls.mjs), same space.
// dry: how far a point (same space) is past any green's fringe, which the
// water gives way to (sim/greenfirst.mjs, waterDry), or null. marsh: its
// wetland edge (marshLook), or null. bank: a brook's { height, across } -
// its banks' height over its water (sim/brooks.mjs brookBankHeight) and its
// width, what's mirrored along its far side - or null (a pond's trees).
export function waterFor(poly, layer = LAYER.water, sand = null, wall = null, edgeScale = 1, dry = null, { marsh = null, bank = null, run = null } = {}) {
  return waterMaterial({ field: fieldTexture(poly, { cell: edgeScale > 1 ? 0.25 : 0.5, pad: 1, range: WATER_RANGE, near: sand, wall, dry }), layer, edgeScale, marsh, bank, run });
}

// A water's wetland edge (sim/hazardshapes.mjs: { a, span, width }, the
// hole's frame) as waterMaterial takes it, in the world - or null.
export function marshLook(w) {
  if (!w?.marsh) return null;
  return { x: w.z, z: -w.x, dir: [Math.sin(w.marsh.a), -Math.cos(w.marsh.a)], span: w.marsh.span };
}

// The bank of a pond lowered below the grass (sim/walls.mjs): earth -
// darker and wet towards the water, a dark stain along the waterline, the
// worn faces faintly layered - where the turf (drawn over it) stops short
// of the water. level: the water's height. top (an island green's bank,
// which has no turf drawn over it): the grass's height, the bank turning
// to grass over its top few centimetres to meet the fringe.
// along: a brook's bank (course/holescenery.js drawBrook), its water's level
// falling along it - each corner's own (bBank.x), with how far up from the
// water to the turf it is (bBank.y, 0 - 1): shaded under the turf's lip.
export function bankSlopeMaterial(level, top = null, { along = false } = {}) {
  const material = onLayer(new THREE.MeshLambertMaterial({ color: 0xffffff }), LAYER.bank);
  // (A brook's well forward of the grass under it, seen low too.)
  if (along) Object.assign(material, { polygonOffsetFactor: -4, polygonOffsetUnits: -8 });
  const grassTop = top != null;
  const uniforms = { uLevel: { value: level }, uTop: { value: top ?? 0 } };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\nvarying vec3 sWorld;${along ? "\nattribute vec2 bBank;\nvarying vec2 vBank;\nvarying vec3 vBankN;" : ""}`)
      .replace(
        "#include <project_vertex>",
        // (A brook's drawn a little towards the eye, BANK_PULL: across the
        // curve of a cut bank, the straight sides of the grass laid down
        // it rode over the earth and cut it into teeth.)
        `#include <project_vertex>\nsWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;${along ? `\nvBank = bBank;\nvBankN = normalize(mat3(modelMatrix) * objectNormal);\nmvPosition.xyz += normalize(-mvPosition.xyz) * ${BANK_PULL.toFixed(3)};\ngl_Position = projectionMatrix * mvPosition;` : ""}`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform float uLevel;
        uniform float uTop;
        varying vec3 sWorld;
        ${along ? "varying vec2 vBank;\nvarying vec3 vBankN;" : ""}
        ${NOISE}`,
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        {
          vec2 w = sWorld.xz;
          float above = sWorld.y - ${along ? "vBank.x" : "uLevel"};
          // How flat it is here: a gentle shore shelves into the water over
          // pale silt and gravel; a steep one is a worn face of darker
          // earth, faintly layered.
          // (A brook's by its own smooth light: by each triangle's, its foot
          // turned pale silt and back a triangle at a time, in teeth.)
          vec3 n = ${along ? "normalize(vBankN)" : "normalize(cross(dFdx(sWorld), dFdy(sWorld)))"};
          float gentle = smoothstep(0.86, 0.95, abs(n.y));
          ${along ? `// (A brook's silt only low down: BANK_BREAK.)
          gentle *= 1.0 - smoothstep(${BANK_BREAK.silt.toFixed(3)}, ${(BANK_BREAK.silt + BANK_BREAK.siltFade).toFixed(3)}, vBank.y);` : ""}
          vec3 earth = ${glsl(PALETTE.earthBank)} * (0.95 + 0.3 * gFbm(w * 0.8));
          earth *= 0.95 + 0.05 * sin(above * (55.0 + 25.0 * gNoise(w * 0.3)) + gNoise(w * 0.7) * 6.0);
          vec3 silt = mix(${glsl(PALETTE.earthBank)}, ${glsl(PALETTE.sand)}, 0.22) * (0.84 + 0.2 * gFbm(w * 1.7));
          vec3 col = mix(earth, silt, gentle);
          // Grit and pebbles.
          col *= 0.92 + 0.16 * step(0.8, gNoise(w * 9.0)) + 0.1 * gentle * step(0.72, gNoise(w * 23.0 + 3.0));
          // Wet and dark towards the water, the wet reaching higher in
          // places; a darker stain right along the waterline.
          float wet = 1.0 - smoothstep(0.02, 0.1 + 0.08 * gNoise(w * 1.3), above);
          col *= mix(1.0, ${along ? "0.8" : "0.64"}, wet);
          col *= mix(1.0, 0.82, 1.0 - smoothstep(0.0, 0.02, above));
          ${along ? `// A little shade under the turf's lip; and the turf breaking over
          // its top in ragged bites, the grass under it showing through, so
          // there's no hard line where the earth begins.
          col *= mix(1.0, 0.86 + 0.08 * gNoise(w * 6.0), smoothstep(0.6, 0.95, vBank.y));
          // Broken up along it (BANK_BREAK): runnels down its face, and in
          // stretches the turf slumped most of the way down.
          col *= ${(1 - BANK_BREAK.runnels / 2).toFixed(3)} + ${BANK_BREAK.runnels.toFixed(3)} * gNoise(w * ${BANK_BREAK.runnelScale.toFixed(2)});
          float slump = ${BANK_BREAK.slump.toFixed(3)} * smoothstep(${BANK_BREAK.from.toFixed(3)}, ${BANK_BREAK.to.toFixed(3)}, gNoise(w * ${BANK_BREAK.scale.toFixed(3)} + 7.0));
          if (vBank.y > 0.62 - slump + 0.3 * gNoise(w * 2.7) + 0.12 * gNoise(w * 9.0)) discard;
          // Lighter than a pond's: a brook's cut bank, steep and facing away
          // from the sun, was black.
          col *= ${BANK_LIGHT.toFixed(2)};` : ""}
          ${grassTop ? `// Grass over the top of the bank.
          float grass = smoothstep(uTop - 0.2, uTop - 0.03, sWorld.y + 0.05 * (gNoise(w * 1.5) - 0.5));
          col = mix(col, ${glsl(PALETTE.collar)}, grass);` : ""}
          diffuseColor.rgb *= pow(col, vec3(2.2));
        }`,
      );
  };
  material.customProgramCacheKey = () => `pond-bank-v6${grassTop ? "-top" : ""}${along ? "-along" : ""}`;
  withSceneryHooks(material, "ground");
  markTwin(material, "pondbank", { uniforms, top: grassTop, along });
  material.userData.surface = true;
  return material;
}

// Sand for an outline in the mesh's object space; heightAt for a dug bowl;
// water: the outlines of any ponds it runs into, in the same space.
// Lying flat (no heightAt), it's shaded as a bowl; each is raked its own
// way, by where its outline lies.
// join: the outlines of other bunkers laid over this one - one patch of
// sand with them, raked the same way as rakeFrom (the first of them), so
// neither their lips nor a change in the rake lines shows where they meet.
// patch: the outlines of a whole patch laid over each other, poly's among
// them - one field round them all, for one material the whole patch shares
// (course/holebuild.js), so it's one bunker to look at.
export function sandFor(poly, heightAt = null, layer = LAYER.sand, water = null, options = {}) {
  const steps = sandForSteps(poly, heightAt, layer, water, options);
  for (;;) {
    const r = steps.next();
    if (r.done) return r.value;
  }
}
// The same a part a step (its field: fieldTextureSteps).
export function* sandForSteps(poly, heightAt = null, layer = LAYER.sand, water = null, { join = null, rakeFrom = poly, look = null, patch = null } = {}) {
  const [x, z] = rakeFrom[0] ?? [0, 0];
  const field = yield* fieldTextureSteps(poly, { cell: 0.25, pad: 1, heightAt, near: water, join, patch });
  return sandMaterial({ field, layer, bowl: !heightAt, rake: rakeAngle(x + rakeFrom.length * 0.37, z), look });
}

// Frees a sand or water material, with its field, and stops its ripples
// being wound on. Anything else is left alone, so a rebuild can call it on
// every material it clears away.
export function disposeSurface(material) {
  // Anything else made for one hole that says how to free it (a sign's
  // painted face).
  if (material?.userData?.dispose) return material.userData.dispose();
  if (!material?.userData?.surface) return;
  material.userData.field?.texture.dispose();
  waters.delete(material.userData.time);
  // (Its program stays on the card for the next hole: every program built
  // does, sim/keepprograms.mjs.)
  material.dispose();
}
