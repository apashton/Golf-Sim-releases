// Pieces of ground laid on the grass: bunkers (sand with a collar of longer
// grass), ponds (water with a muddy margin), and tufts of longer grass -
// and blob, the lobed outline bunkers and ponds are drawn from. Moved here
// from scenery.js, which still hands them on, unchanged but for the tufts'
// material: they have their own now, rather than sharing the tree cards'
// (so the trees' sway, when it comes, isn't theirs).

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { seeded, cutoutTexture } from "./trees.js";
import { edgeStrip, edgeMesh, LAYER } from "./grass.js";
import { bankMaterial, lipMaterial, sandFor, waterFor } from "./sandwater.js";
import { registerStep, isShed } from "./safety.js";
import { SHED_STEP, shedNests } from "./lienest.js";
import { withSceneryHooks } from "./glsl/hooks.js";
import { NOISE, GROUND_COLOUR, GROUND_KEY, groundUniforms, COUNTRY_GLSL } from "./glsl/ground.js";
import { glslLinear, PALETTE } from "./palette.js";
import { GRASS } from "./grass.js";
import { seasonalColor } from "./season.js";
import { UPKEEP } from "../sim/daylight.mjs";
import { TUFT_BLEND, tuftHeight, NEARER } from "../sim/tufts.mjs";
import { MOW_WIDTH } from "../sim/mowing.mjs";
import { cutUniforms, CUT_VERTEX_PARS, cutVertex, CUT_FRAGMENT_PARS, cutFragment, CUT_KEY } from "./cutline.js";
import { markTwin } from "./twins.js";
import { bunkerLook } from "../sim/bunkerlook.mjs";

// Every tuft mesh built (and still in a scene), so the safety valve on High
// can take them away and bring them back (look/safety.js, step 3): their
// visibility only.
const tufts = new Set();
// One step with the grass round the ball (look/lienest.js).
export const TUFTS_STEP = SHED_STEP;
registerStep(3, TUFTS_STEP, (on) => {
  shedNests(on);
  for (const m of tufts) {
    let root = m;
    while (root.parent) root = root.parent;
    if (!root.isScene && m.parent === null) tufts.delete(m);
    else m.visible = !on;
  }
});

// Before the tufts go altogether, the far ones thinned out first (the
// owner: "mix simple and complex objects together to still keep some of
// the illusion"): every tuft still near the camera and the ball, few far
// off, where the painted ground carries the look (sim/tufts.mjs tuftShare).
let tuftReach = 1;
registerStep(2.5, "far tufts thinned", (on) => (tuftReach = on ? NEARER : 1));
export const tuftReachNow = () => tuftReach;

// A hole's tufts let go of (course/holebuild.js disposeWorld): kept only
// for the valve's step, which took the rest away only as it stepped - with
// "don't adjust automatically", never (a hole's worth every hole).
export function forgetTufts(object) {
  tufts.delete(object);
}

// A tuft field's group (look/tuftfield.js), shown and hidden with the
// tufts by the safety valve.
export function keepTufts(object) {
  object.visible = !isShed(TUFTS_STEP);
  tufts.add(object);
  return object;
}

// The colour of the rough a tuft stands in, worked out where it stands
// with the ground's own recipe and numbers (look/glsl/ground.js, grass.js
// GRASS): the rough's, or the deep rough's (deep: 1). So a tuft is the
// colour of the patch it grows from - its light and dark patches, its hue,
// the wind's waves across it, its straw on a firm day and a shade darker
// after rain - rather than a lighter card on a dark patch.
const f = (v) => v.toFixed(4);
// A grass's colour as its ground has it (grass.js gLight): in today's
// season, each grass by its own shift (look/season.js), linear light.
export const tuftColour = (colour) => {
  const c = seasonalColor(colour);
  return `vec3(${f(c.r)}, ${f(c.g)}, ${f(c.b)})`;
};
// (base: its colour, a shader expression; amount, scale: its patches'.)
const mixed = (g, base, amount = f(g.patch), scale = f(g.patchScale)) => `gWindWaves(gRoughPatches(gGrassBase(${base}, w, ${amount}, ${scale}, ${f(g.tint)}), w, ${f(g.clumps)}), w, world, ${f(g.wind)})`;
// (i: its colour's place in tGrassCol - TUFT_GRASS.)
const recipe = (g, i) => mixed(g, `tGrassCol[${i}]`);
// The short grass (Ultra's grass across the hole: sim/holegrass.mjs) has no
// clumps or wind of its own in GRASS: its blades take the ground's colour
// and patches, a touch of tint, the wind lightly.
const SHORT = { patchScale: 0.03, tint: 0.5, clumps: 0, wind: 0.3 };

// The fairway's and the tee's short grass in the shade of the mowing
// stripe each clump stands in, as the ground under it is mown - not all
// of it the light stripe's (the graphics list's third) - so the stripes
// run on through the blades. The fairway's pattern and grass are the
// hole's, set with its ground (useShortGrass: course/holebuild.js a
// designed hole's, course.js buildMappedGround a mapped one's); the tee's
// are the same on every hole.
const tShort = {
  tShortLight: { value: new THREE.Color() },
  tShortDark: { value: new THREE.Color() },
  // The stripes: the way they change (x, y), how wide (z), their kind
  // (w: gMowing's).
  tShortMow: { value: new THREE.Vector4() },
  // x: 1 on a hole made from a map (its ground's stripes are worked out
  // in the hole's frame: look/mappedground.js); y, z: the patches
  // (gGrassBase's amount and size).
  tShortLook: { value: new THREE.Vector3() },
  // The tufts' own grasses' colours (TUFT_GROUND's codes: tintTuftGrass).
  tGrassCol: { value: Array.from({ length: 11 }, () => new THREE.Color()) },
};
// Each of the tufts' grasses (TUFT_GROUND's codes, tGrassCol's place) and
// which part of the course it is (sim/daylight.mjs UPKEEP.share): set in
// the round's season and upkeep (look/season.js) as each hole is built
// (useShortGrass), so a dry round's tufts brown off with the ground under
// them. (5, the fairway's, is tShortLight's and tShortDark's; 10 is the
// tee's dark stripe.)
const TUFT_GRASS = [
  [PALETTE.rough[0], "rough"],
  [PALETTE.deep, "rough"],
  [PALETTE.fescue, "rough"],
  [PALETTE.duneRough, "rough"],
  [PALETTE.longGreen, "rough"],
  [PALETTE.fairway[0], "fairway"],
  [PALETTE.firstCut[0], "fairway"],
  [PALETTE.fringe, "green"],
  [GRASS.tee.light, "green"],
  [PALETTE.hay, "rough"],
  [GRASS.tee.dark, "green"],
];
export function tintTuftGrass() {
  TUFT_GRASS.forEach(([colour, part], i) => tShort.tGrassCol.value[i].copy(seasonalColor(colour, "grass", UPKEEP.share[part])));
}
// A hole's fairway: grassMaterial's options for it (light, dark,
// stripeWidth, mow, mowDir, patch, patchScale), mowDir in the world - or,
// with hole, in the hole's frame, as a mapped hole's ground has it.
export function useShortGrass({ light, dark, stripeWidth, mow = 0, mowDir = null, stripeAngle = Math.PI / 2, patch, patchScale = SHORT.patchScale }, { hole = false } = {}) {
  // (A fairway's share of the round's upkeep: look/season.js.)
  tShort.tShortLight.value.copy(seasonalColor(light, "grass", UPKEEP.share.fairway));
  tShort.tShortDark.value.copy(seasonalColor(dark, "grass", UPKEEP.share.fairway));
  const [dx, dz] = mowDir ?? [Math.cos(stripeAngle), Math.sin(stripeAngle)];
  const n = Math.hypot(dx, dz) || 1;
  tShort.tShortMow.value.set(dx / n, dz / n, stripeWidth, mow);
  tShort.tShortLook.value.set(hole ? 1 : 0, patch, patchScale);
  tintTuftGrass();
}
useShortGrass({ ...GRASS.fairway, stripeWidth: MOW_WIDTH.fairway });
const TEE = GRASS.tee;
const SHORT_GLSL = /* glsl */ `
  uniform vec3 tGrassCol[11];
  uniform vec3 tShortLight;
  uniform vec3 tShortDark;
  uniform vec4 tShortMow;
  uniform vec3 tShortLook;
  // How soft a stripe's edge is at world, in stripes width metres wide:
  // about as the ground's is there (gMow: a pixel and a half), from how
  // far off the camera is and how low it looks across.
  float tStripeSoft(vec3 world, float width) {
    vec3 to = cameraPosition - world;
    float d = max(length(to), 0.01);
    return clamp(1.5 * d * 0.0012 / max(abs(to.y) / d, 0.1) / width, 0.02, 0.5);
  }
  // The fairway's stripe at w (0 light, 1 dark).
  float tFairStripe(vec2 w, vec3 world) {
    vec2 p = tShortLook.x > 0.5 ? vec2(-w.y, w.x) : w;
    return gMowingAt(p, tShortMow.xy, tShortMow.z, tShortMow.w, vec2(0.0), tStripeSoft(world, tShortMow.z));
  }
  // The tee's: GRASS.tee's on a designed hole; a mapped hole's ground's
  // (look/mappedground.js), down the hole and unwavering.
  float tTeeStripe(vec2 w, vec3 world) {
    float e = tStripeSoft(world, ${f(TEE.stripeWidth)});
    if (tShortLook.x > 0.5) return gMowSoft(-w.y / ${f(TEE.stripeWidth)}, e);
    return gMowingAt(w, vec2(${f(Math.cos(TEE.stripeAngle))}, ${f(Math.sin(TEE.stripeAngle))}), ${f(TEE.stripeWidth)}, 0.0, vec2(0.0), e);
  }
`;
const FAIRWAY = mixed({ ...SHORT, ...GRASS.fairway }, "mix(tShortLight, tShortDark, tFairStripe(w, world))", "tShortLook.y", "tShortLook.z");
const TEE_GRASS = mixed({ ...SHORT, ...TEE }, "mix(tGrassCol[8], tGrassCol[10], tTeeStripe(w, world))");
// Codes: 0 rough, 1 deep, 2 fescue, 3 dune rough, 4 long green - and for the
// grass across the hole, 5 fairway, 6 first cut, 7 fringe, 8 tee; 9 hay
// (sim/hay.mjs HAY.code).
export const TUFT_GROUND = /* glsl */ `
  ${SHORT_GLSL}
  vec3 tuftGround(vec2 w, vec3 world, float deep) {
    return gWetGround(deep > 8.5 ? ${recipe(GRASS.hay, 9)} : deep > 7.5 ? ${TEE_GRASS} : deep > 6.5 ? ${recipe({ ...SHORT, ...GRASS.fringe }, 7)} : deep > 5.5 ? ${recipe({ ...SHORT, ...GRASS.semi }, 6)} : deep > 4.5 ? ${FAIRWAY} : deep > 3.5 ? ${recipe(GRASS.longGreen, 4)} : deep > 2.5 ? ${recipe(GRASS.duneRough, 3)} : deep > 1.5 ? ${recipe(GRASS.fescue, 2)} : deep > 0.5 ? ${recipe(GRASS.deep, 1)} : ${recipe(GRASS.rough, 0)});
  }
`;

// A tuft's or a clump's whole colour where it stands (world: its foot,
// deep: its colour code): the ground's under it (TUFT_GROUND) with
// everything the ground has on top of its grass - a links hole's dune
// crest and hollow, the country picture's patches (heather, sand, stony
// ground, the woods floor) - and duller with distance. The tuft field's
// tufts (look/tuftfield.js) and the long grass round the ball (look/
// longgrass.js) both use it, so from the air they're the colour of the
// ground between them. (After NOISE, GROUND_COLOUR, TUFT_GROUND and
// COUNTRY_GLSL.)
export const TUFT_COLOUR = /* glsl */ `
  vec3 tColourAt(vec3 world, float deep) {
    vec3 g = tuftGround(world.xz, world, deep);
    if (deep > 1.5 && deep < 4.5) {
      float dune = deep > 3.5 ? 0.7 : 1.0;
      float crest = smoothstep(0.7, 2.6, world.y) * 0.6;
      float hollow = 1.0 - smoothstep(-0.5, 0.25, world.y);
      g = mix(g, g * vec3(1.22, 1.12, 0.84), dune * 0.55 * crest);
      g = mix(g, g * vec3(0.86, 1.05, 0.88), dune * 0.5 * hollow);
    }
    g = gCountry(g, world);
    float far = smoothstep(150.0, 800.0, distance(world.xz, cameraPosition.xz));
    return mix(g, vec3(dot(g, vec3(0.2126, 0.7152, 0.0722))), far * 0.3);
  }
`;

// The tufts' own material: cut-out blades lit like the ground they stand
// in (both faces keep the upward normal they're given), in the colour of
// the rough they stand in (TUFT_GROUND) - the blade texture only lighter
// and darker round it - with the shared cloud-shade and bend hooks
// (look/glsl/hooks.js): they sway with the plants' bend.
let tuftMat = null;
// Where tufts turn see-through for the ball (world x, z, radius metres, on
// 0/1): a knee-high field of them would otherwise hide a ball lying in it.
const tuftClear = { value: new THREE.Vector4(0, 0, 1.3, 0) };
export function setTuftClear(x, z, on = true) {
  tuftClear.value.set(x, z, tuftClear.value.z, on ? 1 : 0);
}
// The country's picture under the hole (look/country.js: a links hole's
// sand, heather, greener and stony patches over its rough, the woods floor,
// the shade under trees), as the ground under the tufts has it, so a tuft
// is the colour of the patch it grows in (the owner: "the ground below to
// join with the colour of the grass above it"). Set with the ground's
// (course.js addCountry); none until then.
const tuftCountry = {
  gCountryMap: { value: (() => {
    const t = new THREE.DataTexture(new Uint8Array(4), 1, 1);
    t.needsUpdate = true;
    return t;
  })() },
  gCountryBox: { value: new THREE.Vector3(0, 0, 1) },
  // (The other holes' mown ground: look/country.js countryTexture.)
  gCourseMap: { value: null },
};
const noMown = (() => {
  const t = new THREE.DataTexture(new Uint8Array(4), 1, 1);
  t.needsUpdate = true;
  return t;
})();
tuftCountry.gCourseMap.value = noMown;
// How much lighter a far tuft's colour is than the ground's (TUFT_BLEND
// lift; and more with the ambient occlusion on, which darkens a field of
// tufts as a whole - each a crevice to it - where the open ground beside
// isn't). The occlusion switch is live (app.js liveEffects: setTuftAO).
// (x: the lift; y: the occlusion's share more, 0 with it off; z, w: from
// how far to how far the occlusion fades out - look/effects.js AO.)
const tuftLift = { value: new THREE.Vector4(TUFT_BLEND.lift, TUFT_BLEND.ao - 1, 60, 140) };
export function setTuftAO(on, near = 60, far = 140) {
  tuftLift.value.set(TUFT_BLEND.lift, on ? TUFT_BLEND.ao - 1 : 0, near, far);
}
// The tufts' shared uniforms, for the tuft field's own materials (look/
// tuftfield.js) and the long grass's (look/longgrass.js): where they turn
// see-through, how far ones are lifted, the country's picture under them
// and the hole's short grass.
export const tuftUniforms = { tuftClear, tuftLift, ...tuftCountry, ...tShort };
export function setTuftCountry(map) {
  if (!map) return;
  tuftCountry.gCountryMap.value = map.texture;
  tuftCountry.gCountryBox.value.set(map.box.x0, map.box.z0, 1 / map.box.size);
  tuftCountry.gCourseMap.value = map.mown ?? noMown;
}
function tuftMaterial() {
  if (tuftMat) return tuftMat;
  tuftMat = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, alphaTest: 0.5, map: tuftMap() });
  tuftMat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, groundUniforms, tuftUniforms, cutUniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        {
          // How near the ball: see-through there (below).
          #ifdef USE_INSTANCING
          vec3 tFoot = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          #else
          vec3 tFoot = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          #endif
          tSee = tuftClear.w > 0.5 ? 1.0 - smoothstep(tuftClear.z * 0.5, tuftClear.z, distance(tFoot.xz, tuftClear.xy)) : 0.0;
        }`,
      )
      .replace(
        "#include <common>",
        `#include <common>
        uniform vec4 tuftClear;
        varying float tSee;
        attribute float tDeep;
        varying vec3 tGround;
        varying float tFar;
        ${CUT_VERTEX_PARS}
        ${NOISE}
        ${GROUND_COLOUR}
        ${TUFT_GROUND}
        ${COUNTRY_GLSL}`,
      )
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
        // (Where this part of it is, for the mower's line: look/cutline.js.)
        #ifdef USE_INSTANCING
        ${cutVertex("modelMatrix * instanceMatrix * vec4(transformed, 1.0)")}
        #else
        ${cutVertex("modelMatrix * vec4(transformed, 1.0)")}
        #endif
        {
          // Where the tuft stands (its own origin), once a vertex.
          #ifdef USE_INSTANCING
          vec3 world = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          #else
          vec3 world = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          #endif
          tGround = tuftGround(world.xz, world, tDeep);
          // Everything the ground under it has on top of its grass, so
          // from any height the two are one colour: on a links hole, paler
          // over a dune's crest and lusher down in a swale (as grass.js
          // gDune: 1 the dunes' grasses, 0.7 the green links' long grass);
          // the country's picture's patches; and duller with distance.
          if (tDeep > 1.5 && tDeep < 4.5) {
            float dune = tDeep > 3.5 ? 0.7 : 1.0;
            float crest = smoothstep(0.7, 2.6, world.y) * 0.6;
            float hollow = 1.0 - smoothstep(-0.5, 0.25, world.y);
            tGround = mix(tGround, tGround * vec3(1.22, 1.12, 0.84), dune * 0.55 * crest);
            tGround = mix(tGround, tGround * vec3(0.86, 1.05, 0.88), dune * 0.5 * hollow);
          }
          tGround = gCountry(tGround, world);
          float far = smoothstep(150.0, 800.0, distance(world.xz, cameraPosition.xz));
          tGround = mix(tGround, vec3(dot(tGround, vec3(0.2126, 0.7152, 0.0722))), far * 0.3);
          // How far off, for easing its own light and dark (below).
          tFar = smoothstep(${TUFT_BLEND.from.toFixed(1)}, ${TUFT_BLEND.to.toFixed(1)}, distance(world, cameraPosition));
        }`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 tGround;\nvarying float tSee;\nvarying float tFar;\nuniform vec4 tuftLift;\n${CUT_FRAGMENT_PARS}`)
      // Round the ball, just see-through enough for it to show - a scatter
      // of pixels left out, as a tree's trunk is near the camera - and no
      // shorter: a ball down in the long grass is a hard lie, and looks it
      // (the owner: "only just enough translucency to be able to see the
      // ball").
      .replace(
        "#include <alphatest_fragment>",
        `#include <alphatest_fragment>
        if (tSee > 0.0 && fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) < tSee * 0.55) discard;
        // Cut off at the mower's line: a tuft is the rough's.
        ${cutFragment("true")}`,
      )
      .replace(
        "#include <map_fragment>",
        // The blades' texture only as lighter and darker blades round the
        // ground's colour (its middling blade is about 0.3 green, in linear
        // light); each tuft a touch lighter or darker by its instance
        // colour, grey, which three.js multiplies in next.
        `#include <map_fragment>
        float tShade = mix(0.8, 1.25, smoothstep(0.1, 0.5, diffuseColor.g));
        #ifdef USE_MAP
        // Shaded down at its foot, among its own blades.
        tShade *= mix(0.62, 1.06, smoothstep(0.0, 0.55, vMapUv.y));
        #endif
        // Further off, its own light and dark eased towards the ground's
        // colour as it is: close to, every blade and the shade among them;
        // from the air, one with the ground it grows from.
        float tLift = tuftLift.x * (1.0 + tuftLift.y * (1.0 - smoothstep(tuftLift.z, tuftLift.w, distance(vViewPosition, vec3(0.0)))));
        diffuseColor.rgb = tGround * mix(tShade, tLift, tFar * ${TUFT_BLEND.most.toFixed(3)});`,
      )
      .replace("#include <normal_fragment_begin>", "#include <normal_fragment_begin>\n  normal = normalize( vNormal );");
  };
  tuftMat.customProgramCacheKey = () => `tuft-v7-${CUT_KEY}-${GROUND_KEY}`;
  withSceneryHooks(tuftMat, "tuft");
  // (Its node version, on WebGPURenderer: glsl/tuftnode.js.)
  markTwin(tuftMat, "tufts", { uniforms: { ...tuftUniforms, ...cutUniforms } });
  tuftMat.userData.shared = true;
  return tuftMat;
}

// A blob outline: an ellipse with a few lobes, so shapes don't look stamped.
export function blob(rx, rz, seed, points = 48) {
  const rand = seeded(seed);
  const lobes = 2 + Math.floor(rand() * 2);
  const phase = rand() * 6;
  const depth = 0.08 + rand() * 0.1;
  const shape = new THREE.Shape();
  for (let i = 0; i <= points; i++) {
    const a = (i / points) * Math.PI * 2;
    const r = 1 + Math.sin(a * lobes + phase) * depth + Math.sin(a * 5 + phase) * 0.04;
    const x = Math.cos(a) * rx * r;
    const y = Math.sin(a) * rz * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  return shape;
}

// A bunker: sand (see look/sandwater.js) with a collar of longer grass
// fading out round it, lying flat at height y - or (waste) a waste area's
// sandy ground and scrub, with no collar (sim/wastearea.mjs).
export function makeBunker(rx, rz, { seed = 1, y = 0.03, waste = false } = {}) {
  return bunkerFrom(blob(rx, rz, seed), { y, waste });
}

// The same from an outline already worked out ([[x, z], ...], lying flat in
// the group's own space) - one the physics plays too (the chipping green's
// hazard: sim/chipping.mjs hazardOutline).
export function bunkerOutline(outline, { y = 0.03 } = {}) {
  return bunkerFrom(shapeOf(outline), { y });
}
export function pondOutline(outline) {
  return pondFrom(shapeOf(outline));
}
// A shape whose points (x, y) are an outline's (x, -z): built lying flat.
function shapeOf(outline) {
  const shape = new THREE.Shape();
  outline.forEach(([x, z], i) => (i ? shape.lineTo(x, -z) : shape.moveTo(x, -z)));
  shape.closePath();
  return shape;
}

function bunkerFrom(shape, { y, waste = false }) {
  const group = new THREE.Group();
  // Built lying flat, so the mesh's own x and z are the outline's.
  const outline = shape.getPoints().slice(0, -1).map((p) => [p.x, -p.y]);
  const look = waste ? bunkerLook({ waste: 1 }) : null;
  const sand = new THREE.Mesh(new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2), sandFor(outline, null, LAYER.sand, null, { look }));
  sand.position.y = y + 0.012;
  const lip = waste ? null : edgeMesh(edgeStrip(outline, 0.9, () => y + 0.004), lipMaterial(), LAYER.lip);
  for (const m of [sand, lip]) {
    if (!m) continue;
    m.receiveShadow = true;
    group.add(m);
  }
  group.userData.outline = outline;
  // (The range merges its bunkers' lips: range.js.)
  group.userData.lip = lip;
  return group;
}

// A few thousand tufts of longer grass, each two crossed blades cards, for
// texture where the camera is close to the ground.
let tuftTexture = null;
export function tuftMap() {
  if (tuftTexture) return tuftTexture;
  // Fine blades of many widths, each a curve tapering to its tip, darker
  // where it leaves the ground and catching the light towards the tip, a
  // few bent over, and here and there a stalk in seed (the owner: "the
  // grass tuffs probably need to be better quality").
  const w = 256;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const rand = seeded(23);
  const blade = (x, lean, top, width, v) => {
    const g = ctx.createLinearGradient(0, h, 0, top);
    if (g) {
      g.addColorStop(0, `rgb(${v * 0.38},${v * 0.6},${v * 0.27})`);
      g.addColorStop(0.6, `rgb(${v * 0.6},${v * 0.95},${v * 0.42})`);
      g.addColorStop(1, `rgb(${v * 0.78},${v * 1.05},${v * 0.55})`);
      ctx.fillStyle = g;
    } else ctx.fillStyle = `rgb(${v * 0.6},${v * 0.95},${v * 0.42})`;
    ctx.beginPath();
    ctx.moveTo(x - width, h);
    ctx.quadraticCurveTo(x + lean * 0.25 - width * 0.4, (h + top) / 2, x + lean, top);
    ctx.quadraticCurveTo(x + lean * 0.25 + width * 0.4, (h + top) / 2, x + width, h);
    ctx.fill();
  };
  // Behind, the shorter, darker ones; in front, the taller and lighter.
  for (let i = 0; i < 110; i++) {
    const front = i / 110;
    const x = w * (0.12 + rand() * 0.76);
    const lean = (rand() - 0.5) * (40 + 50 * rand());
    const top = h * (0.04 + rand() * (0.6 - 0.25 * front));
    blade(x, lean, top, 1.2 + rand() * 2.6, 95 + rand() * 70 + front * 45);
  }
  for (let i = 0; i < 5; i++) {
    const x = w * (0.25 + rand() * 0.5);
    const lean = (rand() - 0.5) * 30;
    ctx.strokeStyle = "rgb(150,160,90)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.quadraticCurveTo(x + lean * 0.3, h * 0.5, x + lean, h * 0.04);
    ctx.stroke();
    ctx.fillStyle = "rgb(176,170,104)";
    ctx.beginPath();
    ctx.ellipse(x + lean, h * 0.08, 2.4, 9, lean * 0.01, 0, Math.PI * 2);
    ctx.fill();
  }
  tuftTexture = cutoutTexture(canvas, [70, 110, 45]);
  return tuftTexture;
}

// Hay's own picture (sim/hay.mjs, the owner's third length of grass, gone
// to seed): fewer, finer leaves and many stalks, each with its head - a
// narrow spike of seed or a looser, nodding plume. The heads are painted
// bluer than any blade (HAY_HEAD_MARK), so the tufts' shader knows them
// and colours them as seed (look/tuftfield.js HAY_HEADS) where the rest
// is only lighter and darker round the ground's colour.
let hayTexture = null;
export const HAY_HEAD_MARK = [196, 168, 236];
export function hayMap() {
  if (hayTexture) return hayTexture;
  const w = 256;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const rand = seeded(29);
  const [hr, hg, hb] = HAY_HEAD_MARK;
  for (let i = 0; i < 60; i++) {
    const x = w * (0.14 + rand() * 0.72);
    const lean = (rand() - 0.5) * (50 + 50 * rand());
    const top = h * (0.3 + rand() * 0.4);
    const width = 1 + rand() * 2;
    const v = 100 + rand() * 80;
    ctx.fillStyle = `rgb(${v * 0.6},${v * 0.95},${v * 0.42})`;
    ctx.beginPath();
    ctx.moveTo(x - width, h);
    ctx.quadraticCurveTo(x + lean * 0.25 - width * 0.4, (h + top) / 2, x + lean, top);
    ctx.quadraticCurveTo(x + lean * 0.25 + width * 0.4, (h + top) / 2, x + width, h);
    ctx.fill();
  }
  for (let i = 0; i < 26; i++) {
    const x = w * (0.18 + rand() * 0.64);
    const lean = (rand() - 0.5) * 70;
    const tip = h * (0.03 + rand() * 0.2);
    const tx = x + lean;
    ctx.strokeStyle = `rgb(${150 + rand() * 30},${160 + rand() * 25},${90 + rand() * 20})`;
    ctx.lineWidth = 1.1 + rand() * 0.6;
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.quadraticCurveTo(x + lean * 0.3, h * 0.5, tx, tip);
    ctx.stroke();
    ctx.fillStyle = `rgb(${hr},${hg},${hb})`;
    if (rand() < 0.6) {
      // A spike: narrow, pointed, along the stalk's last lean.
      const len = 14 + rand() * 12;
      ctx.beginPath();
      ctx.ellipse(tx, tip + len * 0.4, 2 + rand() * 1.4, len * 0.55, lean * 0.006, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // A plume: small spikelets hanging off a few short branches, nodding
      // over to one side.
      const side = rand() < 0.5 ? -1 : 1;
      for (let s = 0; s < 7; s++) {
        const t = s / 6;
        const sx = tx + side * (2 + 9 * t) + (rand() - 0.5) * 3;
        const sy = tip + 3 + 18 * t + (rand() - 0.5) * 4;
        ctx.beginPath();
        ctx.ellipse(sx, sy, 1.4 + rand() * 0.8, 3 + rand() * 2, side * (0.4 + 0.5 * t), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  hayTexture = cutoutTexture(canvas, [90, 115, 60]);
  return hayTexture;
}

// A tuft of three cards round its middle, each bent outward as it rises
// (in `segs` pieces), so it splays as a real tussock does - for the
// fields (makeTuftField); height metres. Normals straight up, as before.
export function splayedTuft(height, segs = 3) {
  const cards = [];
  for (let c = 0; c < 3; c++) {
    const g = new THREE.PlaneGeometry(0.55, height, 1, segs).translate(0, height / 2, 0);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const t = pos.getY(i) / height;
      // Its top leaning out a fifth of its height, the sides fanning a
      // little wider too.
      pos.setZ(i, pos.getZ(i) + t * t * height * 0.2);
      pos.setX(i, pos.getX(i) * (1 + 0.35 * t));
    }
    g.rotateY((c / 3) * Math.PI * 2);
    cards.push(g);
  }
  const geo = mergeGeometries(cards);
  const nor = geo.attributes.normal;
  for (let i = 0; i < nor.count; i++) nor.setXYZ(i, 0, 1, 0);
  return geo;
}

// place(rand) -> [x, z] (or [x, z, deep], deep 1 for a tuft in deep
// rough, 2 in a brown links hole's long grass, 3 in its rough, 4 in a
// green links hole's long grass) or null to skip; groundY(x, z) for the
// height.
export function makeGrassTufts(count, place, { groundY = () => 0, seed = 31, height = 0.35 } = {}) {
  const blade = new THREE.PlaneGeometry(0.5, height).translate(0, height / 2, 0);
  const cross = blade.clone().rotateY(Math.PI / 2);
  const geo = mergeGeometries([blade, cross]);
  // Normals straight up so tufts light like the ground they stand in.
  const nor = geo.attributes.normal;
  for (let i = 0; i < nor.count; i++) nor.setXYZ(i, 0, 1, 0);
  const mesh = new THREE.InstancedMesh(
    geo,
    tuftMaterial(),
    count,
  );
  // (Too small and low to show in a pond: left out of its reflection,
  // look/mirrors.js - drawing every tuft again there cost more than all
  // the rest of it.)
  mesh.userData.noMirror = true;
  const deep = new Float32Array(count);
  geo.setAttribute("tDeep", new THREE.InstancedBufferAttribute(deep, 1));
  // (Each tuft's foot, for its node version - glsl/tuftnode.js - which
  // can't read a copy's own matrix as WebGL's shader does.)
  const feet = new Float32Array(count * 3);
  geo.setAttribute("tFootAt", new THREE.InstancedBufferAttribute(feet, 3));
  const rand = seeded(seed);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const color = new THREE.Color();
  let n = 0;
  for (let tries = 0; n < count && tries < count * 4; tries++) {
    const at = place(rand);
    if (!at) continue;
    const [x, z] = at;
    deep[n] = Number(at[2] ?? 0) || 0;
    const s = 0.8 + rand() * 0.4;
    q.setFromAxisAngle(up, rand() * Math.PI);
    // Its height by the stand of grass it's in (sim/tufts.mjs tuftHeight).
    // (As many draws as before, so the tufts stand where they always have.)
    const tall = tuftHeight(x, z, rand(), rand(), seed);
    rand();
    m.compose(new THREE.Vector3(x, groundY(x, z), z), q, new THREE.Vector3(s, tall, s));
    feet.set([x, m.elements[13], z], n * 3);
    mesh.setMatrixAt(n, m);
    // Each a touch lighter or darker than the rough round it (grey: the
    // colour is the ground's, tuftMaterial).
    mesh.setColorAt(n, color.setScalar(0.94 + rand() * 0.12));
    n++;
  }
  mesh.count = n;
  // Off while High's safety valve has shed them (look/safety.js).
  mesh.visible = !isShed(TUFTS_STEP);
  tufts.add(mesh);
  return mesh;
}

// A pond: water that reflects the sky, with a muddy margin fading into
// the grass round it.
export function makePond(rx, rz, { seed = 3 } = {}) {
  return pondFrom(blob(rx, rz, seed));
}

function pondFrom(shape) {
  const group = new THREE.Group();
  const outline = shape.getPoints().slice(0, -1).map((p) => [p.x, -p.y]);
  const bank = edgeMesh(edgeStrip(outline, 1.2, () => 0.025), bankMaterial(), LAYER.bank);
  const water = new THREE.Mesh(new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2), waterFor(outline));
  water.position.y = 0.04;
  bank.receiveShadow = water.receiveShadow = true;
  group.add(bank, water);
  group.userData.outline = outline;
  return group;
}
