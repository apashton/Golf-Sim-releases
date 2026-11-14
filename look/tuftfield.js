// The tuft field: the tufts of longer grass all over a hole's rough and long
// grass (sim/holetufts.mjs places them, course/holescenery.js builds it),
// drawn two ways by how far each is from the camera (sim/tufts.mjs
// TUFT_LOD; the owner, 18 October 2026: "only the few metre of grass line
// closest to the player needs to be drawn decently. All other grass is
// behind grass or once in the air blending in. How low can we go with a
// grass object and therefore allow us to multiply the number of them"):
//
//   near   the tufts within 12 - 16 m of the camera (each its own point
//          between, so they don't change at a line): three splayed cards
//          of drawn blades (look/groundbits.js tuftMap), 24 corners each -
//          one draw for the whole field, of the tufts gathered round the
//          camera each time it has moved 4 m (gatherNear)
//   far    every other tuft: a single card, 4 corners and 2 triangles,
//          upright and turned to face the camera, as wide at its foot as a
//          near tuft and splaying as it rises, its blades worked out where
//          they're drawn (no picture, so a far tuft never thins to a dark
//          stub as a cut-out picture's smaller copies do). (A single
//          triangle on its point - 3 corners - was tried: narrow where a
//          tussock is thickest, a links hole's knee-high fescue read as a
//          pale haze rather than clumps.) A draw a 48 m square of the
//          field, as many of its tufts as the share at its distance and
//          the camera's height (tuftShare, heightShare), each tuft past its
//          share shrinking away rather than going at once, and the cards
//          widened as the field thins (fanWiden: more blades across) so it
//          still covers the ground.
//
// Each tuft is the colour of the ground it stands in, layer for layer, as
// before (look/groundbits.js TUFT_GROUND: the ground's own recipe, the
// country's picture, a dune's crest and hollow), lit like the ground (its
// normal straight up) with its shadows, and sways with the plants' bend.
// Both drawings read the tufts' numbers straight from the field's own
// arrays (sim/holetufts.mjs TUFT_STRIDE: where, colour code, width, turn,
// height, shade): 32 bytes a tuft on the graphics card, where an instance's
// matrix and colour were 80.
//
// The field's group is the course's world's: never moved or turned, so a
// tuft's numbers are where it stands.

import * as THREE from "three";
import { NOISE, GROUND_COLOUR, GROUND_KEY, groundUniforms, COUNTRY_GLSL } from "./glsl/ground.js";
import { BEND_PARS, bendUniforms } from "./glsl/bend.js";
import { withSceneryHooks } from "./glsl/hooks.js";
import { TUFT_GROUND, TUFT_COLOUR, tuftMap, hayMap, tuftUniforms, keepTufts, tuftReachNow, splayedTuft } from "./groundbits.js";
import { TUFT_FIELD, TUFT_LOD, TUFT_BLEND, GRASS_HEIGHT, tuftShare, heightShare } from "../sim/tufts.mjs";
import { TUFT_STRIDE } from "../sim/holetufts.mjs";
import { PLANT_BEND } from "../sim/sway.mjs";
import { cutUniforms, CUT_VERTEX_PARS, cutVertex, CUT_FRAGMENT_PARS, cutFragment, CUT_KEY } from "./cutline.js";
import { markTwin } from "./twins.js";
import { loadSetting, saveSetting } from "../util.js";

const f = (v) => (Number.isInteger(v) ? `${v}.0` : `${v}`);

// A far tuft's blades: how many across a tuft's width (few enough to stay
// blade by blade out to some 50 m, so a links hole's tall grass keeps its
// clumps), how wide each is at its foot (of the gap between two: the
// tussock all but solid there, its blades parting as they rise), and its
// shading - darker at the foot, lighter at the tips, as a near tuft's
// picture is, each blade lighter or darker by up to `vary` - and how much
// of
// the sky's grey the tips catch (sheen): standing grass looked across
// shows its blades' paler tops, as the ground under it is painted (look/
// glsl/ground.js gFarRoughLook). Set so the far tufts and the ground
// between them measure alike from the air (Golf Sim Links' 3rd on Ultra,
// from 20 m and 45 m up, where the old tufts were lighter, yellower
// flecks - 19 - 21% lighter) and are as light as the ground across the
// rough at a player's height. (aoLift: the share of the near tufts' lift
// for the ambient occlusion a far one takes - a card a few pixels across
// isn't darkened by it as a field of near tufts is. parkland: a parkland
// hole's rough and deep rough's tufts against a links hole's, which
// measured 8% lighter than their ground from the air where the links
// grasses' matched.)
// Too fine to draw blade by blade (far off, or seen from above), a card is
// its blades' share of it - as a tussock's dome, lower towards its sides
// by `dome` and thinning out over their outer part (from `sides` of the
// way out): as a block, its share the same right across, a drift of hay
// seen from a ball's flight was rows of pale bricks.
export const FAR_FAN = { blades: 8, width: 0.42, foot: 0.82, tip: 1.36, vary: 0.2, sheen: 0.05, aoLift: 0.5, parkland: 0.92, dome: 0.45, sides: 0.6 };
// Hay's seed heads (sim/hay.mjs: gone to seed): near, its own picture's
// heads (look/groundbits.js hayMap); far, a head over the top of `share`
// of its blades, `length` of the tuft's height and up to `width` of the
// gap between two blades across - and both as seed is, `tint` times the
// tuft's own colour: paler and warmer.
export const HAY_HEADS = { share: 0.7, length: 0.16, width: 0.3, tint: [1.2, 1.1, 0.86] };
const HEAD_TINT = `vec3(${HAY_HEADS.tint.map(f).join(", ")})`;
// The near tufts as the owner saw them (24 October 2026: "the front grass
// hurt itself by not spreading the gaps enough... a more aggressive floor
// texture and no shadows at the bottom of the grass might look better" -
// with no more grass to draw): each tuft's foot the very colour of the
// ground it stands in, its blades' own light and dark coming in only as
// they rise (`foot`: up to where, of its height); and the nearer the
// camera, the wider it spreads (`spread` times, at the camera, easing back
// to its own width by `from` to `to` metres off, well short of where it
// changes to its far card) so the ground between them is covered where
// it shows most. Its blades stand out by their light, not their shade:
// lighter than the ground towards their tips, the lightest as the sun
// catches them (`blades`: the darkest and lightest, of the ground's
// colour), the foot the ground's own (`base`) - with all of each blade the
// ground's colour, nothing of a tuft showed.
export const NEAR_TUFTS = { foot: 0.3, base: 1, blades: [0.88, 1.65], spread: 1.25, from: 3, to: 10 };
// A near tuft's card is 0.55 m wide at its foot and 1.35 times that at its
// top (splayedTuft): the far card's the same.
const FOOT = 0.55;
const SPLAY = 1.35;
const TOP = FOOT * SPLAY;

// The field's LOD as the safety valve has it (tuftReachNow): where the
// share starts to fall, where it's least, and the least (sim/tufts.mjs
// shareAt's numbers brought in by the reach).
const tLod = { value: new THREE.Vector3(TUFT_FIELD.near, TUFT_FIELD.far, TUFT_FIELD.least) };
function syncLod() {
  const r = Math.min(1, Math.max(0.1, tuftReachNow()));
  tLod.value.set(TUFT_FIELD.near * r, TUFT_FIELD.far * r, TUFT_FIELD.least * r * r);
}

// What both drawings share in their vertex shaders: the tuft's numbers,
// where it changes from near to far, its colour as the ground's under it,
// and the plants' bend.
const VERTEX_PARS = /* glsl */ `
  attribute vec3 tFoot;
  attribute float tDeep;
  attribute vec4 tLook;
  uniform vec4 tuftClear;
  varying vec3 tGround;
  varying float tSee;
  varying float tFar;
  varying float tHay;
  ${CUT_VERTEX_PARS}
  ${NOISE}
  ${GROUND_COLOUR}
  ${TUFT_GROUND}
  ${COUNTRY_GLSL}
  ${TUFT_COLOUR}
  ${BEND_PARS}
  // Where a tuft turned turn (0 - pi, its own random) changes from near to
  // far (sim/tufts.mjs tuftSwitch).
  float tSwitchAt(float turn) {
    return ${f(TUFT_LOD.near)} + ${f(TUFT_LOD.out - TUFT_LOD.near)} * fract(turn * 0.3183099);
  }
  // Pushed downwind by how high up it is (metres over its foot), squared,
  // rippling as it goes: the plants' bend (look/glsl/bend.js PLANT).
  vec3 tBend(vec3 foot, float up, float along) {
    float ripple = 1.0 + 0.25 * sin(bendTime * 4.3 + bendHash(foot.xz) * 6.2831853 + along * 3.0);
    return vec3(bendDir.x, 0.0, bendDir.y) * (bendWave(foot, 2.1) * ripple * ${f(PLANT_BEND)} * up * up);
  }
`;
// Once a vertex of a tuft that's drawn: its colour, how far off, and how
// see-through by the ball.
const VERTEX_LOOK = /* glsl */ `
  // (Each tuft a touch lighter or darker than the ground round it - a far
  // one twice as much, its blades' own light and dark being too fine to
  // show: tVary.)
  tGround = tColourAt(tAtW, tDeep) * mix(1.0, tLook.w, tVary);
  tFar = smoothstep(${f(TUFT_BLEND.from)}, ${f(TUFT_BLEND.to)}, tD);
  tHay = tDeep > 8.5 ? 1.0 : 0.0;
  tSee = tuftClear.w > 0.5 ? 1.0 - smoothstep(tuftClear.z * 0.5, tuftClear.z, distance(tAtW.xz, tuftClear.xy)) : 0.0;
`;
// A culled tuft's corners put outside the picture: nothing is drawn. (And
// where each corner is, for the mower's line: look/cutline.js.)
const CULL = `#include <project_vertex>\nif (tCull > 0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);\n${cutVertex("modelMatrix * vec4(transformed, 1.0)")}`;
// How much lighter a far-off tuft is than its colour (look/groundbits.js
// tuftLift: more with the ambient occlusion on, fading as it does).
const LIFT = "tuftLift.x * (1.0 + tuftLift.y * (1.0 - smoothstep(tuftLift.z, tuftLift.w, length(vViewPosition))))";
const FAR_LIFT = `tuftLift.x * (1.0 + ${FAR_FAN.aoLift} * tuftLift.y * (1.0 - smoothstep(tuftLift.z, tuftLift.w, length(vViewPosition))))`;

let nearMat = null;
function nearMaterial() {
  if (nearMat) return nearMat;
  nearMat = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, alphaTest: 0.5, map: tuftMap() });
  nearMat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, groundUniforms, bendUniforms, tuftUniforms, cutUniforms, { tHayMap: { value: hayMap() } });
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${VERTEX_PARS}`)
      .replace(
        "#include <begin_vertex>",
        `vec3 transformed = vec3(0.0);
        float tCull = 0.0;
        {
          vec3 tAtW = (modelMatrix * vec4(tFoot, 1.0)).xyz;
          float tD = distance(tAtW, cameraPosition);
          tCull = tD > tSwitchAt(tLook.y) ? 1.0 : 0.0;
          float tVary = 1.0;
          if (tCull < 0.5) {
            // Its cards turned and sized as the tuft is (width, height,
            // width), stood at its foot.
            float c = cos(tLook.y);
            float s = sin(tLook.y);
            float tSpread = mix(${f(NEAR_TUFTS.spread)}, 1.0, smoothstep(${f(NEAR_TUFTS.from)}, ${f(NEAR_TUFTS.to)}, tD));
            vec3 p = position * vec3(tLook.x * tSpread, tLook.z, tLook.x * tSpread);
            transformed = tFoot + vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
            transformed += tBend(tAtW, max(0.0, p.y), position.x);
            ${VERTEX_LOOK}
          }
        }`,
      )
      .replace("#include <project_vertex>", CULL);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 tGround;\nvarying float tSee;\nvarying float tFar;\nvarying float tHay;\nuniform vec4 tuftLift;\nuniform sampler2D tHayMap;\n${CUT_FRAGMENT_PARS}`)
      // Round the ball, just see-through enough for it to show (look/
      // groundbits.js's tufts); and cut off at the mower's line.
      .replace(
        "#include <alphatest_fragment>",
        `#include <alphatest_fragment>
        if (tSee > 0.0 && fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) < tSee * 0.55) discard;
        ${cutFragment("true")}`,
      )
      .replace(
        "#include <map_fragment>",
        // The blades' picture (hay's its own) only as lighter and darker
        // blades round the ground's colour, shaded down at the foot;
        // further off eased towards the ground's colour as it is. Hay's
        // seed heads as seed (HAY_HEADS).
        `vec4 tPic = texture2D(map, vMapUv);
        vec4 tHayPic = texture2D(tHayMap, vMapUv);
        if (tHay > 0.5) tPic = tHayPic;
        diffuseColor *= tPic;
        float tShade = mix(${f(NEAR_TUFTS.blades[0])}, ${f(NEAR_TUFTS.blades[1])}, smoothstep(0.1, 0.5, diffuseColor.g));
        tShade = mix(${f(NEAR_TUFTS.base)}, tShade, smoothstep(0.0, ${f(NEAR_TUFTS.foot)}, vMapUv.y));
        diffuseColor.rgb = tGround * mix(tShade, ${LIFT}, tFar * ${TUFT_BLEND.most.toFixed(3)});
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * ${HEAD_TINT}, tHay * smoothstep(0.08, 0.3, tPic.b - tPic.g));`,
      )
      .replace("#include <normal_fragment_begin>", "#include <normal_fragment_begin>\n  normal = normalize( vNormal );");
  };
  nearMat.customProgramCacheKey = () => `tuftnear-v4-${CUT_KEY}-${GROUND_KEY}`;
  withSceneryHooks(nearMat, "tuftnear");
  // (Its node version, on WebGPURenderer: glsl/tuftnode.js.)
  markTwin(nearMat, "tuftnear", { uniforms: { ...tuftUniforms, ...cutUniforms }, hay: hayMap(), heads: HAY_HEADS, near: NEAR_TUFTS });
  nearMat.userData.shared = true;
  return nearMat;
}

let farMat = null;
function farMaterial() {
  if (farMat) return farMat;
  // (Its blades' edges by alpha to coverage, under the picture's
  // antialiasing: a share of a pixel where a blade only covers that.)
  farMat = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, alphaToCoverage: true });
  farMat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, groundUniforms, bendUniforms, tuftUniforms, cutUniforms, { tLod });
    const H = GRASS_HEIGHT;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        ${VERTEX_PARS}
        attribute vec3 tField;
        uniform vec3 tLod;
        varying vec3 tFan;
        varying float tVar;
        // The share of the field drawn d metres off (sim/tufts.mjs shareAt)
        // and with the camera up metres above it (heightShare).
        float tShareAt(float d) {
          float t = clamp((d - tLod.x) / (tLod.y - tLod.x), 0.0, 1.0);
          return max(tLod.z, 1.0 - (1.0 - tLod.z) * t * t * (3.0 - 2.0 * t));
        }
        float tHeightShare(float up) {
          float t = clamp((up - ${f(H.from)}) / ${f(H.to - H.from)}, 0.0, 1.0);
          return 1.0 - ${f(1 - H.least)} * t * t * (3.0 - 2.0 * t);
        }`,
      )
      .replace(
        "#include <begin_vertex>",
        `vec3 transformed = vec3(0.0);
        float tCull = 0.0;
        {
          vec3 tAtW = (modelMatrix * vec4(tFoot, 1.0)).xyz;
          float tD = distance(tAtW, cameraPosition);
          // (Never less than the field keeps - sim/tufts.mjs KEPT_FAR -
          // brought in as the safety valve brings in the least.)
          float tShare = max(tShareAt(tD) * tHeightShare(cameraPosition.y - tAtW.y), tField.z * tLod.z / ${f(TUFT_FIELD.least)});
          // Its place in the field (the square's tufts are in no order:
          // sim/holetufts.mjs), shrinking away as the share passes it.
          float tRank = (float(gl_InstanceID) + 0.5) / tField.x;
          float tGrow = clamp((tShare - tRank) / (0.15 * tShare + 1e-4), 0.0, 1.0);
          tCull = tD <= tSwitchAt(tLook.y) || tGrow <= 0.0 ? 1.0 : 0.0;
          float tVary = 2.0;
          if (tCull < 0.5) {
            // Facing the camera, upright; the fewer there are, the wider,
            // more blades across (sim/tufts.mjs fanWiden).
            float tK = clamp(1.0 / max(tShare, 1e-3), 1.0, ${f(TUFT_LOD.widen)});
            vec3 tTo = cameraPosition - tAtW;
            float tL = length(tTo.xz);
            // (Less so seen from above: TUFT_LOD.above.)
            tK = mix(tK, 1.0, smoothstep(${f(TUFT_LOD.above[0])}, ${f(TUFT_LOD.above[1])}, tTo.y / max(length(tTo), 1e-3)));
            vec3 tSide = tL > 0.01 ? vec3(-tTo.z, 0.0, tTo.x) / tL : vec3(cos(tLook.y), 0.0, sin(tLook.y));
            float tUp = position.y * tField.y * tLook.z * tGrow;
            transformed = tFoot + tSide * (position.x * ${f(FOOT)} * tLook.x * tK) + vec3(0.0, tUp, 0.0);
            transformed += tBend(tAtW, tUp, position.x);
            tFan = vec3(position.x * tK, position.y, position.x * 2.0);
            tVar = tLook.y;
            ${VERTEX_LOOK}
            // (A parkland hole's rough and deep rough: FAR_FAN.parkland.)
            if (tDeep < 1.5) tGround *= ${f(FAR_FAN.parkland)};
          }
        }`,
      )
      .replace("#include <project_vertex>", CULL);
    const F = FAR_FAN;
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 tGround;\nvarying float tSee;\nvarying float tFar;\nvarying float tHay;\nvarying vec3 tFan;\nvarying float tVar;\nuniform vec4 tuftLift;\n${CUT_FRAGMENT_PARS}`)
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        {
          // Up the tuft (0 its foot, 1 its top), and which blade's line,
          // splaying out as they rise.
          float tv = clamp(tFan.y, 0.0, 1.0);
          float ta = tFan.x / (1.0 + ${f(SPLAY - 1)} * tv);
          // (And how far across it, -1 to 1.)
          float tAcross = tFan.z / (1.0 + ${f(SPLAY - 1)} * tv);
          float tt = ta * ${f(F.blades)} + 0.5;
          float tdt = fwidth(tt);
          float tdv = fwidth(tv) + 1e-4;
          float tcell = floor(tt);
          // Each blade its own: set a little aside, its height (the outer
          // ones shorter), its shade.
          float th = fract(sin(tcell * 12.9898 + tVar * 78.233) * 43758.5453);
          float th2 = fract(th * 37.17 + 0.13);
          float th3 = fract(th * 91.71 + 0.71);
          float tOff = fract(tt) - 0.5 - (th - 0.5) * 0.36;
          float tTop = (0.62 + 0.38 * th2) * (1.0 - 0.3 * min(1.0, abs(ta) * 1.6));
          float tW = ${f(F.width)} * pow(max(0.0, 1.0 - tv / tTop), 0.6);
          float tCov = clamp((tW - abs(tOff)) / max(tdt, 1e-4) + 0.5, 0.0, 1.0) * clamp((tTop - tv) / tdv + 0.5, 0.0, 1.0);
          // Hay: a seed head over the top of most of its blades, swelling
          // and narrowing to its tip (HAY_HEADS).
          float tHd = tHay * step(fract(th * 53.13 + 0.37), ${f(HAY_HEADS.share)});
          float tHu = clamp((tv - tTop) / ${f(HAY_HEADS.length)} + 1.0, 0.0, 1.0);
          float tHw = ${f(HAY_HEADS.width)} * pow(max(0.0, sin(3.14159265 * tHu)), 0.7);
          float tHc = tHd * clamp((tHw - abs(tOff)) / max(tdt, 1e-4) + 0.5, 0.0, 1.0);
          tCov = max(tCov, tHc);
          // Too fine to draw blade by blade, far off: their share of the
          // card there, as a tussock's dome (FAR_FAN.dome, sides) - hay's
          // heads, their share of its top.
          float tBlur = smoothstep(0.3, 1.0, tdt);
          float tDome = 1.0 - ${f(F.dome)} * tAcross * tAcross;
          float tMean = ${f(2 * FAR_FAN.width)} * (1.0 - smoothstep(0.15, 1.0, tv / tDome)) * (1.0 - smoothstep(${f(F.sides)}, 1.0, abs(tAcross)));
          tCov = mix(tCov, tMean, tBlur);
          float tSeed = mix(tHc, tHay * ${f(HAY_HEADS.share * 0.6)} * smoothstep(0.5, 0.85, tv / tDome), tBlur);
          if (tSee > 0.0 && fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) < tSee * 0.55) discard;
          if (tCov < 0.01) discard;
          ${cutFragment("true")}
          float tShade = mix(${f(F.foot)}, ${f(F.tip)}, pow(tv, 0.8)) * mix(1.0 + ${f(F.vary)} * (2.0 * th3 - 1.0), 1.0, tBlur);
          vec3 tCol = tGround * mix(tShade, ${FAR_LIFT}, tFar * ${TUFT_BLEND.most.toFixed(3)});
          tCol = mix(tCol, tCol * ${HEAD_TINT}, tSeed);
          diffuseColor.rgb = mix(tCol, vec3(dot(tCol, vec3(0.2126, 0.7152, 0.0722))), ${f(F.sheen)} * tv);
          diffuseColor.a = tCov;
        }`,
      )
      .replace("#include <normal_fragment_begin>", "#include <normal_fragment_begin>\n  normal = normalize( vNormal );");
  };
  farMat.customProgramCacheKey = () => `tuftfar-v4-${CUT_KEY}-${GROUND_KEY}`;
  withSceneryHooks(farMat, "tuftfar");
  markTwin(farMat, "tuftfar", { uniforms: { ...tuftUniforms, ...cutUniforms }, lod: tLod, fan: FAR_FAN, card: { foot: FOOT, splay: SPLAY }, heads: HAY_HEADS });
  farMat.userData.shared = true;
  return farMat;
}

// The far card: its foot across (0, 0), 1 wide, its top at height 1 and
// SPLAY wide (scaled to the tuft as it's drawn); straight up its normal,
// as the ground's. tField: the square's tufts in all, the field's height,
// and the share of them it keeps at any distance (sim/tufts.mjs KEPT_FAR).
function farGeometry(full, height, keep = 0) {
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, -0.5 * SPLAY, 1, 0, 0.5 * SPLAY, 1, 0], 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
  geo.setAttribute("tField", new THREE.Float32BufferAttribute([full, height, keep, full, height, keep, full, height, keep, full, height, keep], 3));
  geo.setIndex([0, 1, 2, 2, 1, 3]);
  return geo;
}

// A tuft's numbers (sim/holetufts.mjs TUFT_STRIDE) as a drawing's
// per-tuft attributes, read straight from `data`.
function tuftAttributes(geo, data) {
  const buffer = new THREE.InstancedInterleavedBuffer(data, TUFT_STRIDE);
  geo.setAttribute("tFoot", new THREE.InterleavedBufferAttribute(buffer, 3, 0));
  geo.setAttribute("tDeep", new THREE.InterleavedBufferAttribute(buffer, 1, 3));
  geo.setAttribute("tLook", new THREE.InterleavedBufferAttribute(buffer, 4, 4));
  return buffer;
}

// A square's box (the tufts' feet), for its bounding sphere and how near
// the camera comes.
function boxOf(data) {
  const box = new THREE.Box3();
  const p = new THREE.Vector3();
  for (let k = 0; k < data.length; k += TUFT_STRIDE) box.expandByPoint(p.set(data[k], data[k + 1], data[k + 2]));
  return box;
}

// The share of a square's tufts to send to be drawn: as many as the
// nearest of them could want (the shader thins each by its own distance) -
// and never fewer than its field keeps (keep: sim/tufts.mjs keptShare),
// brought in as the safety valve brings in the least.
const nearest = new THREE.Vector3();
export function squareShare(box, camera, reach = 1, keep = 0) {
  const d = box.clampPoint(camera, nearest).distanceTo(camera);
  const r = Math.min(1, Math.max(0.1, reach));
  return Math.max(tuftShare(d, reach) * heightShare(camera.y - box.max.y), keep * r * r);
}

// Every field built and still in a scene, for updateTuftFields.
const fields = new Set();

// The field's group from its squares (sim/holetufts.mjs fieldTufts's, on
// the page or another core); height: a tuft's, metres (its tall share
// times this); keep: the share of its far tufts drawn however far off
// (sim/tufts.mjs keptShare: a parkland hole's long grass and hay).
export function tuftFieldMesh(squares, { height = 0.4, keep = 0 } = {}) {
  const group = new THREE.Group();
  group.name = "tuft field";
  const material = farMaterial();
  const list = [];
  for (const sq of squares) {
    const full = sq.data.length / TUFT_STRIDE;
    if (!full) continue;
    const box = boxOf(sq.data);
    const geo = farGeometry(full, height, keep);
    tuftAttributes(geo, sq.data);
    geo.instanceCount = full;
    // (Sized for its tallest, widest tuft.)
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    sphere.radius += height * 2 + TOP * TUFT_LOD.widen;
    geo.boundingSphere = sphere;
    const mesh = new THREE.Mesh(geo, material);
    mesh.name = "far tufts";
    mesh.receiveShadow = true;
    mesh.userData.noMirror = true;
    mesh.userData.full = full;
    mesh.onBeforeRender = (renderer, scene, camera) => {
      geo.instanceCount = Math.min(full, Math.max(1, Math.ceil(full * squareShare(box, camera.position, tuftReachNow(), keep))));
    };
    group.add(mesh);
    list.push({ data: sq.data, box, cells: null });
  }
  const near = nearMesh(height);
  group.add(near.mesh);
  const field = { group, squares: list, near, anchor: null };
  group.userData.field = field;
  // (Forgotten once its drawings are freed: a hole let go of.)
  if (list.length) {
    fields.add(field);
    group.children[0].geometry.addEventListener("dispose", () => fields.delete(field));
  }
  keepTufts(group);
  return group;
}

// How many pieces each blade of a near tuft bends in (look/groundbits.js
// splayedTuft): two - 12 triangles a tuft - or three, 18, as it was. On
// trial (docs/DRAW-COST.md), and a switch for the owner to try in the game
// (12 November 2026: "Have an option switch please I'll try in game" -
// Menu, Graphics, Lighter long grass round you): kept as the setting
// lightTufts, on as it starts, changed where it stands (setLightTufts).
export const NEAR_BENDS = { light: 2, full: 3 };
let lightTufts = loadSetting("lightTufts", true) !== false;
export const tuftsLight = () => lightTufts;
function nearShape(near) {
  const base = splayedTuft(near.height, lightTufts ? NEAR_BENDS.light : NEAR_BENDS.full);
  near.geo.setIndex(base.index);
  for (const name of ["position", "normal", "uv"]) near.geo.setAttribute(name, base.attributes[name]);
}
export function setLightTufts(on) {
  lightTufts = !!on;
  saveSetting("lightTufts", lightTufts);
  for (const field of fields) nearShape(field.near);
  return lightTufts;
}

// The near drawing: the splayed tuft (look/groundbits.js splayedTuft, its
// field's height) over a buffer of the tufts gathered round the camera.
function nearMesh(height) {
  const geo = new THREE.InstancedBufferGeometry();
  const near = { geo, height, mesh: null, data: null, buffer: null, n: 0 };
  nearShape(near);
  near.mesh = new THREE.Mesh(geo, nearMaterial());
  near.mesh.name = "near tufts";
  near.mesh.receiveShadow = true;
  near.mesh.userData.noMirror = true;
  // (Placed in its shader, round the camera: never culled by its shape.)
  near.mesh.frustumCulled = false;
  near.mesh.visible = false;
  sizeNear(near, 4096);
  return near;
}
function sizeNear(near, count) {
  near.data = new Float32Array(count * TUFT_STRIDE);
  near.buffer = tuftAttributes(near.geo, near.data);
  near.buffer.setUsage(THREE.DynamicDrawUsage);
  near.geo.instanceCount = 0;
}

// The tufts of a square in 8 m cells (an 8 m cell lies in one 48 m
// square), worked out the first time the camera comes near.
const CELL = 8;
const cellKey = (i, j) => (i + 32768) * 65536 + (j + 32768);
function cellsOf(sq) {
  if (sq.cells) return sq.cells;
  const lists = new Map();
  const { data } = sq;
  for (let k = 0, i = 0; k < data.length; k += TUFT_STRIDE, i++) {
    const key = cellKey(Math.floor(data[k] / CELL), Math.floor(data[k + 2] / CELL));
    let l = lists.get(key);
    if (!l) lists.set(key, (l = []));
    l.push(k);
  }
  sq.cells = new Map([...lists].map(([key, l]) => [key, Int32Array.from(l)]));
  return sq.cells;
}

// The tufts within reach of the camera gathered into the near drawing,
// once it has moved TUFT_LOD.move metres since the last time: every tuft
// that could be near before it moves that far again.
const gathered = new THREE.Vector3();
export function gatherNear(field, at) {
  const { near } = field;
  if (field.anchor && field.anchor.distanceToSquared(at) < TUFT_LOD.move * TUFT_LOD.move) return near.n;
  field.anchor = (field.anchor ?? new THREE.Vector3()).copy(at);
  const R = TUFT_LOD.out + TUFT_LOD.move;
  const R2 = R * R;
  let n = 0;
  const reach = (box) => box.clampPoint(at, gathered).distanceToSquared(at) <= R2;
  for (const sq of field.squares) {
    if (!reach(sq.box)) continue;
    const cells = cellsOf(sq);
    const { data } = sq;
    for (let i = Math.floor((at.x - R) / CELL); i <= Math.floor((at.x + R) / CELL); i++) {
      for (let j = Math.floor((at.z - R) / CELL); j <= Math.floor((at.z + R) / CELL); j++) {
        const list = cells.get(cellKey(i, j));
        if (!list) continue;
        for (const k of list) {
          const dx = data[k] - at.x;
          const dy = data[k + 1] - at.y;
          const dz = data[k + 2] - at.z;
          if (dx * dx + dy * dy + dz * dz > R2) continue;
          if ((n + 1) * TUFT_STRIDE > near.data.length) grow(near);
          near.data.set(data.subarray(k, k + TUFT_STRIDE), n * TUFT_STRIDE);
          n++;
        }
      }
    }
  }
  near.n = n;
  near.geo.instanceCount = n;
  near.buffer.clearUpdateRanges();
  near.buffer.addUpdateRange(0, n * TUFT_STRIDE);
  near.buffer.needsUpdate = true;
  near.mesh.visible = n > 0;
  return n;
}
// (More room: a new buffer, the old one freed with its drawing.)
function grow(near) {
  const old = near.data;
  const geo = new THREE.InstancedBufferGeometry();
  geo.setIndex(near.geo.index);
  for (const name of ["position", "normal", "uv"]) geo.setAttribute(name, near.geo.attributes[name]);
  const was = near.geo;
  near.geo = geo;
  near.mesh.geometry = geo;
  sizeNear(near, Math.ceil((old.length / TUFT_STRIDE) * 1.6));
  near.data.set(old);
  // (Its shared shape stays: only the old tufts' buffer goes.)
  was.index = null;
  for (const name of ["position", "normal", "uv"]) was.deleteAttribute(name);
  was.dispose();
}

// Once a frame, before the picture's drawn: each field's near tufts round
// the camera, and the share the safety valve allows (course.js).
export function updateTuftFields(camera) {
  syncLod();
  for (const field of fields) {
    let root = field.group;
    while (root.parent) root = root.parent;
    if (!root.isScene) {
      // Taken off the course (another hole): forgotten.
      if (!field.group.parent) fields.delete(field);
      continue;
    }
    gatherNear(field, camera.position);
  }
}

// A field for warming up (app.js warmers, look/gpuprep.js): a tuft of
// each drawing, never shown, so both shaders are built behind the loading
// screen rather than at a round's first hole.
export function tuftFieldWarmers() {
  const data = new Float32Array([0, 0, 0, 0, 1, 0.5, 1, 1]);
  const group = tuftFieldMesh([{ data, centre: [0, 0, 0] }], { height: 0.4 });
  const field = group.userData.field;
  fields.delete(field);
  field.near.data.set(data);
  field.near.n = 1;
  field.near.geo.instanceCount = 1;
  field.near.mesh.visible = true;
  group.visible = true;
  return group;
}
