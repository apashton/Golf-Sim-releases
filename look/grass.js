// Grass: a lit material whose colour comes from world position rather than
// texture coordinates, so it looks the same on a 3 km range floor as on a
// green, and never smears when stretched over a big mesh.
//
// Layers:
//   mowing stripes  two shades in bands a few metres wide, in a chosen
//                   direction, their edges gently wavering as a mower's do
//   patches         slow noise so the ground isn't one flat colour
//   tint            drier, yellower patches and lusher, bluer ones, so the
//                   colour varies in hue and not just in brightness
//   blades          a fine tiling texture for close up, faded out with distance
//
// The layers themselves are the ground's one recipe (look/glsl/ground.js),
// which the ground of a hole rebuilt from a map is coloured by too.
//
// Surfaces lie a centimetre or two apart - rough, fairway, fringe, green -
// which a depth buffer can't tell apart a couple of hundred metres away, so
// they would flicker through each other as the camera moves. Each gets a
// drawing layer instead (onLayer), so the one on top always wins.
//
// A surface's edge can be softened with edgeStrip(): a band along its
// outline, drawn in the same grass, that fades raggedly into whatever is
// underneath - fairway into rough - instead of stopping at a hard line.

import * as THREE from "three";
import { PALETTE } from "./palette.js";
import { withSceneryHooks } from "./glsl/hooks.js";
import { HIGH, LEVEL, ULTRA, PHONE } from "./quality.js";
import { loadSetting } from "../util.js";
import { effectsInUse } from "../sim/effects.mjs";
import { seasonalColor, upkeepShare } from "./season.js";
import { NOISE, GROUND, GROUND_KEY, groundUniforms, holeToWorld, leanNormal } from "./glsl/ground.js";
import { GRAIN_LOOK } from "../sim/rolls.mjs";
import { detailTextures } from "./textures.js";
import { NEAR_FLOOR } from "../sim/tufts.mjs";
import { markTwin } from "./twins.js";
import { markCupCut } from "./cupcut.js";
import { outSide, outwardNormals } from "../sim/bandline.mjs";
// (Sets the far rough's reach in the ground's uniforms.)
import "./farrough.js";

// The Sharp ground textures switch (sim/effects.mjs textures), as this page
// was built: a third, finer layer of blades close up (look/glsl/ground.js
// GROUND_HERO). Medium and High only.
const HERO = HIGH && effectsInUse(loadSetting("effects", {}), LEVEL).textures;
// The Reflections on wet ground switch (sim/effects.mjs wetshine): after
// rain the turf's sheen of the sky, most seen along it, and puddles lying
// in it (Ultra has those either way). Medium and up.
const SHINE = HIGH && effectsInUse(loadSetting("effects", {}), LEVEL).wetshine;
const PUDDLES = ULTRA || SHINE;

let detailTexture = null;

// Ground layers, bottom to top. Water is over sand: where a bunker runs
// into a pond the ball plays from the water (lieAt in sim/course.mjs), and
// on one layer the two flickered through each other. A cart path lies over
// the fairway, tees and fringes it may cross or run beside (never a green:
// sim/paths.mjs keeps it off them), with the worn grass along its edges
// (verge) just under it. Worn grass in the rough - tracks and thin patches
// (look/wear.js) - is kept off the fairway, so it's drawn over it: a hole
// from a map is all one sheet on the fairway's layer, and it must show on
// that.
// The first cut (semi) lies between the rough (and deep rough) and the
// fairway; the fairway's own soft edge, with its clean-up pass, a touch
// over the fairway it lies along (fairwayEdge).
// Divots on a tee (look/wear.js makeDivots) lie just over it.
// Along the top of a wall (look/walls.js), a strip of
// the ground's own grass (apron) lies a step over the rough it's laid on,
// and under everything else.
export const LAYER = { rough: 0, apron: 0.25, deep: 0.5, semi: 0.75, fairway: 1, fairwayEdge: 1.1, wear: 1.5, fringe: 2, tee: 2, divot: 2.1, verge: 2.2, path: 2.5, green: 3, lip: 4, sand: 5, bank: 4, water: 6 };

// Draws `material` above anything on a lower layer, at any distance. The
// green is left where it is and the layers under it are pushed back, because
// what's drawn on a green - the grid's lines, rings round the hole - are
// lines, which a polygon offset doesn't move: pulling the green forward
// would hide them. Sand and water are pulled forward over the grass.
// The layer's also kept for the order things are drawn in: the ground's
// layers after what stands on them, top first (sim/draworder.mjs - the
// rough, under all the rest, only worked out where it shows).
export function onLayer(material, layer) {
  const back = LAYER.green - layer;
  if (back !== 0) Object.assign(material, { polygonOffset: true, polygonOffsetFactor: back, polygonOffsetUnits: back * 2 });
  material.userData.groundLayer = layer;
  return material;
}

// Greyscale speckle around 1.0, tiled at about a metre. Multiplied in, it
// reads as individual blades near the camera.
export function grassDetail() {
  if (detailTexture) return detailTexture;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgb(200,200,200)";
  ctx.fillRect(0, 0, size, size);
  // Short strokes in random directions, lighter and darker.
  for (let i = 0; i < 9000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const a = Math.random() * Math.PI;
    const len = 2 + Math.random() * 5;
    const v = 150 + Math.random() * 100;
    ctx.strokeStyle = `rgba(${v},${v},${v},0.55)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }
  detailTexture = new THREE.CanvasTexture(canvas);
  detailTexture.wrapS = detailTexture.wrapT = THREE.RepeatWrapping;
  detailTexture.anisotropy = 8;
  detailTexture.colorSpace = THREE.NoColorSpace;
  return detailTexture;
}

// The noise the ground is built from (look/glsl/ground.js), for the other
// surfaces that use it: sand and water, paths, walls.
export { NOISE };

// light / dark: the two stripe colours. stripeWidth in metres (0 = none).
// stripeAngle: 0 stripes run down the range (along world z), PI/2 across it.
// patch: how strong the colour patches are. detailScale: metres per tile of
// the blade texture.
export function grassMaterial({
  light = "#6aa640",
  dark = "#5c9637",
  stripeWidth = 8,
  stripeAngle = Math.PI / 2,
  patch = 0.22,
  patchScale = 0.03,
  detailScale = 1.2,
  detail = 0.8,
  tint = 0.5,
  hole = null,
  edge = false,
  layer = LAYER.green,
  // Worn grass (an edge material only): how much bare soil shows through,
  // most where the edge is strongest, in small scuffs; soil its colour.
  worn = 0,
  soil = "#7d6a4b",
  // Light and dark patches, as the rough has (gRoughPatches): how strong.
  clumps = 0,
  // The long grass and deep rough strip beside a hole: past GRASS_EASE.to
  // it settles towards its plain colour (GRASS_EASE.settle), so from a
  // flyover it reads as even rough beside the fairway, as on the map.
  settle = false,
  // How much the wind's waves show in it (gWindWaves): long grass, 1.
  wind = 0,
  // A links hole's dune grass (0 - 1): paler and sandier up the dunes'
  // faces and crests, greener down in the hollows, from the ground's own
  // slope and height.
  dune = 0,
  // The mowing pattern (gMowing): 0 stripes, 1 checked, 2 rings round
  // centre ([world x, z]); mowDir, the way the stripes change ([world x,
  // z]), in place of stripeAngle.
  mow = 0,
  mowDir = null,
  centre = null,
  // An edge material only: drawn as the clean-up pass round the edge, one
  // shade, rather than in stripes.
  cleanup = false,
  // A clean-up ring just inside the edge, from each vertex's gRimIn: its
  // metres in from the edge (withRim).
  rim = false,
  // A green's grain ([world x, z], the way it grows: sim/rolls.mjs
  // greenGrain), seen as real grain is: lighter and shinier looking
  // down-grain, darker looking into it (GRAIN_LOOK.sheen); or none.
  grain = null,
  // How much wet turf shines after rain (0 - 1): mown grass most; the
  // rough's longer blades far less (GRASS's shine).
  shine = 1,
} = {}) {
  const material = onLayer(new THREE.MeshLambertMaterial({ color: 0xffffff }), layer);
  // An edge is drawn over the ground it fades into, never hiding what's on top.
  if (edge) Object.assign(material, { transparent: true, depthWrite: false });
  // Whether it cuts a cup's hole: only a material given one has the cut in
  // its shader at all (a shader that can leave pixels out loses the
  // graphics card's early depth test) - and once the hole's built, only
  // the patch round the cup is drawn with it (look/cupcut.js).
  const cut = !!hole && hole.r > 0;
  markCupCut(material, hole);
  const uniforms = {
    // (In the round's season and upkeep, its share of it by the part of the
    // course: look/season.js.)
    gLight: { value: seasonalColor(light, "grass", upkeepShare(layer)) },
    gDark: { value: seasonalColor(dark, "grass", upkeepShare(layer)) },
    gStripeWidth: { value: stripeWidth },
    gStripeDir: { value: mowDir ? new THREE.Vector2(...mowDir).normalize() : new THREE.Vector2(Math.cos(stripeAngle), Math.sin(stripeAngle)) },
    gMowKind: { value: mow },
    gMowCentre: { value: new THREE.Vector2(...(centre ?? [0, 0])) },
    gPatch: { value: patch },
    gPatchScale: { value: patchScale },
    // On High the drawn blade texture, shared by all (look/textures.js);
    // on Standard the speckle made here.
    gDetail: HIGH ? detailTextures().tGrass : { value: grassDetail() },
    gDetailScale: { value: detailScale },
    gDetailStrength: { value: detail },
    gTint: { value: tint },
    // A cup cut out of the surface: world x, world z, radius (0 = none).
    gHole: { value: new THREE.Vector3(hole?.x ?? 0, hole?.z ?? 0, hole?.r ?? 0) },
    gWorn: { value: worn },
    gSoil: { value: new THREE.Color(soil) },
    gClumps: { value: clumps },
    gWindy: { value: wind },
    gDune: { value: dune },
    gGrain: { value: new THREE.Vector3(...(grain ? [...new THREE.Vector2(...grain).normalize().toArray(), GRAIN_LOOK.sheen] : [1, 0, 0])) },
    gShine: { value: shine },
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms, groundUniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>\nvarying vec3 gWorld;${edge ? "\nattribute float gEdgeIn;\nvarying float gEdge;" : ""}${rim ? "\nattribute float gRimIn;\nvarying float gRim;" : ""}`,
      )
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>\ngWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;${edge ? "\ngEdge = gEdgeIn;" : ""}${rim ? "\ngRim = gRimIn;" : ""}`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 gWorld;
        uniform vec3 gLight;
        uniform vec3 gDark;
        uniform float gStripeWidth;
        uniform vec2 gStripeDir;
        uniform float gMowKind;
        uniform vec2 gMowCentre;
        uniform float gPatch;
        uniform float gPatchScale;
        uniform sampler2D gDetail;
        uniform float gDetailScale;
        uniform float gDetailStrength;
        uniform float gTint;
        uniform vec3 gHole;
        uniform float gWorn;
        uniform vec3 gSoil;
        uniform float gClumps;
        uniform float gWindy;
        uniform float gDune;
        uniform vec3 gGrain;
        uniform float gShine;
        ${edge ? "varying float gEdge;" : ""}
        ${rim ? "varying float gRim;" : ""}
        ${HIGH ? (PHONE ? "#define GROUND_FINE\n#define GROUND_PHONE" : "#define GROUND_FINE\n#define GROUND_TEX") : ""}
        ${HERO ? "#define GROUND_HERO" : ""}
        ${PUDDLES ? "#define GROUND_PUDDLES" : ""}
        ${SHINE && !settle ? "#define GROUND_SHINE" : ""}
        ${NOISE}
        ${GROUND}
        float gPuddle = 0.0;
        float gDrops = 0.0;`,
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        {
          vec2 w = gWorld.xz;
          float stripe = 0.0;
          // Soft-edged bands, their edges wavering as a mower's do, in the
          // hole's pattern.
          if (gStripeWidth > 0.0) stripe = gMowing(w, gStripeDir, gStripeWidth, gMowKind, gMowCentre);
          ${cleanup ? "stripe = G_CLEANUP;" : ""}
          ${rim ? "stripe = mix(stripe, G_CLEANUP, 1.0 - smoothstep(0.55, 0.8, gRim));" : ""}
          // Far off - from high in a flyover - the long grass's and deep
          // rough's strongest patches eased (to the rough's), so round a
          // links hole its long grass isn't a dark, blotched band beside
          // the fairways (the owner: "a dark streaky band"). Close to, as
          // ever. (No more lookups: only how strong.)
          float gFarEase = smoothstep(${(settle ? GRASS_EASE.from : GRASS_EASE.fromAll).toFixed(1)}, ${(settle ? GRASS_EASE.to : GRASS_EASE.toAll).toFixed(1)}, distance(gWorld, cameraPosition));
          float gPatchK = mix(gPatch, min(gPatch, ${GRASS_EASE.patch.toFixed(2)}), gFarEase);
          float gClumpK = mix(gClumps, min(gClumps, ${GRASS_EASE.clumps.toFixed(2)}), gFarEase);
          vec3 grass = gGrassBase(mix(gLight, gDark, stripe), w, gPatchK, gPatchScale, gTint);
          if (gClumps > 0.0) grass = gRoughPatches(grass, w, gClumpK);
          if (gGrain.z > 0.0) {
            // The grain: blades lying away from the eye catch the sky and
            // look silvery and light, lying towards it show their darker
            // sides - so a green reads lighter down-grain, darker into it,
            // a little patchily, as the grass leans more in some spots.
            vec2 look = normalize(gWorld.xz - cameraPosition.xz + vec2(1e-4));
            float k = dot(look, gGrain.xy) * (0.75 + 0.5 * gNoise(w * 0.35 + 17.0));
            grass *= 1.0 + gGrain.z * k;
          }
          ${
            dune > 0
              ? `          if (gDune > 0.0) {
            // Up a dune's face and over its crest the grass thins over the
            // sand, paler; down in a swale it's lusher and greener. (The
            // ground's normal in the world, from the drawn one.)
            vec3 nW = normalize((vec4(vNormal, 0.0) * viewMatrix).xyz);
            float steep = smoothstep(0.06, 0.32, 1.0 - abs(nW.y));
            float crest = smoothstep(0.7, 2.6, gWorld.y);
            float hollow = 1.0 - smoothstep(-0.5, 0.25, gWorld.y);
            float thin = max(steep * 0.85, crest * 0.6) * (0.75 + 0.5 * gNoise(w * 0.35 + 61.0));
            grass = mix(grass, grass * vec3(1.22, 1.12, 0.84), gDune * 0.55 * thin);
            grass = mix(grass, grass * vec3(0.86, 1.05, 0.88), gDune * 0.5 * hollow);
          }`
              : ""
          }
          if (gWindy > 0.0) grass = gWindWaves(grass, w, gWorld, gWindy);
          // Past the long grass, the rough read as standing grass (look/farrough.js).
          ${HIGH ? "grass = gFarRoughLook(grass, w, gWorld, gWindy);" : ""}
          float d;
          float fade;
          grass = gBlades(grass, w, gDetail, gDetailScale, gDetailStrength, d, fade);
          // Under the long grass close to, its blades bolder (NEAR_FLOOR).
          if (gClumps > 0.5) grass *= 1.0 + ${NEAR_FLOOR.boost.toFixed(2)} * fade * (d - ${NEAR_FLOOR.mean.toFixed(3)}) * (1.0 - smoothstep(${NEAR_FLOOR.from.toFixed(1)}, ${NEAR_FLOOR.to.toFixed(1)}, distance(gWorld, cameraPosition)));
          #ifdef GROUND_FINE
          // Daisies and dandelions in the rough, close up (not on the
          // phone: a pixel's too big for one).
          #ifndef GROUND_PHONE
          if (gClumps > 0.0) grass = gFlowers(grass, w, min(gClumps, 1.0));
          #endif
          #endif
          ${
            edge
              ? `// Worn: scuffs of bare soil through the grass, most where it's
          // worn hardest (the middle of a track, next to the path), and the
          // grass round them drier and browner - never an even stripe.
          if (gWorn > 0.0) {
            float scuff = 0.55 * gNoise(w * 1.1 + 11.0) + 0.45 * gNoise(w * 3.7 + 3.0);
            float bare = smoothstep(0.7, 0.92, scuff + gEdge * 0.12) * gWorn * gEdge;
            // Drier and paler as it wears, unevenly.
            float dryer = gWorn * gEdge * (0.45 + 0.55 * gNoise(w * 0.7 + 23.0));
            grass = mix(grass, grass * vec3(1.12, 1.04, 0.74), dryer);
            vec3 soil = gSoil * (0.8 + 0.4 * gNoise(w * 7.0 + 2.0)) * mix(1.0, 0.7 + d * 0.5, fade);
            grass = mix(grass, soil, bare);
          }`
              : ""
          }
          // And the long grass and deep rough far off settle towards their
          // own plain colour - as the country picture paints the long
          // grass past them - rather than a dark, blotched band (their
          // patches, the far macro grain and the dunes' hollows together).
          ${settle ? `grass = mix(grass, mix(gLight, gDark, 0.5) * ${GRASS_EASE.flat.toFixed(2)}, gFarEase * ${GRASS_EASE.settle.toFixed(2)});` : ""}
          // A shade darker after rain.
          grass = gWetGround(grass);
          ${
            PUDDLES
              ? `// On Ultra (or with wet reflections), after rain: puddles lying in the turf - in patches,
          // more and bigger the wetter it is, ragged at their edges; never
          // on the green with the cup.
          if (gWet > 0.05 && gHole.z <= 0.0) {
            float pn = 0.7 * gNoise(w * 0.09 + 31.0) + 0.3 * gNoise(w * 0.6 + 5.0);
            gPuddle = smoothstep(0.86 - 0.2 * gWet, 0.9 - 0.2 * gWet, pn) * smoothstep(0.05, 0.4, gWet);
            // The grass at a puddle's edge darker, soaked.
            grass *= 1.0 - 0.3 * smoothstep(0.78 - 0.2 * gWet, 0.88 - 0.2 * gWet, pn) * gWet;
          }`
              : ""
          }
          ${
            HIGH
              ? `// While it rains (the Rain on the ground switch): drops splashing
          // on the turf near the camera - in half-metre cells, each its own
          // time, a ring spreading and fading - more the harder it rains.
          if (gRain > 0.02) {
            vec2 dc = floor(gWorld.xz * 2.0);
            vec2 df = fract(gWorld.xz * 2.0) - 0.5;
            float dh = fract(sin(dot(dc, vec2(12.9898, 78.233))) * 43758.5453);
            float dt = fract(gTime * 1.7 + dh * 7.0);
            vec2 dat = (vec2(fract(dh * 7.13), fract(dh * 3.71)) - 0.5) * 0.5;
            float dr = length(df - dat);
            float near = 1.0 - smoothstep(10.0, 28.0, distance(cameraPosition.xz, gWorld.xz));
            gDrops = (1.0 - smoothstep(0.0, 0.025, abs(dr - dt * 0.24))) * (1.0 - dt) * step(dh, gRain * 0.8) * near;
          }`
              : ""
          }
          diffuseColor.rgb *= gDistance(grass, gWorld);
          ${
            cut
              ? `// The cup's hole - only in the patch round the cup (look/cupcut.js:
          // anywhere else the twin without it is drawn, GROUND_UNCUT).
          #ifndef GROUND_UNCUT
          if (gHole.z > 0.0 && distance(gWorld.xz, gHole.xy) < gHole.z) discard;
          #endif`
              : ""
          }
          ${
            edge
              ? `// A ragged, soft line where it gives way to the ground beneath.
          float cut = 0.2 + 0.45 * gNoise(w * 0.35) + 0.2 * gNoise(w * 1.7);
          // Worn grass fades in softly and in clumps - thin here, thick
          // there - rather than to a ragged line.
          diffuseColor.a *= gWorn > 0.0
            ? smoothstep(0.12, 0.55, gEdge * (0.2 + 1.0 * gNoise(w * 1.3 + 7.0) + 0.45 * gNoise(w * 3.4)))
            : smoothstep(cut - 0.14, cut + 0.14, gEdge);`
              : ""
          }
        }`,
      )
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>\n${HIGH ? leanNormal("gLean") : ""}`)
      .replace(
        "#include <opaque_fragment>",
        // A puddle: the grass under it dim, the sky in it - the haze's
        // pale grey-blue, more of it the lower it's seen - and the sun's
        // glint off it.
        `#if defined(GROUND_PUDDLES) && defined(USE_FOG)
        if (gPuddle > 0.0) {
          vec3 pv = normalize(cameraPosition - gWorld);
          float pf = 0.3 + 0.7 * pow(1.0 - max(pv.y, 0.0), 4.0);
          vec3 sky = fogColor * 1.05;
          outgoingLight = mix(outgoingLight, mix(outgoingLight * 0.45, sky, pf), gPuddle);
        }
        #endif
        // The drops' rings: a glint of the sky's light, faint on the turf,
        // clear on a puddle.
        #ifdef USE_FOG
        if (gDrops > 0.0) outgoingLight = mix(outgoingLight, fogColor * 1.15, gDrops * mix(0.22, 0.7, gPuddle));
        #endif
        // Wet turf's sheen: the sky's light off it, little looking down on
        // it, more looking along it (a Fresnel rise), in patches as water
        // lies unevenly in a sward. (Not on the long grass and deep rough,
        // which don't lie flat to shine: a hundred metres off in the rain
        // they went a pale grey under it, and the trees on them read as
        // standing on a fairway. And the rough far less than mown grass
        // (gShine): it did the same along the show reel's 15th in the rain.)
        #if defined(GROUND_SHINE) && defined(USE_FOG)
        if (gWet > 0.02) {
          vec3 sv = normalize(cameraPosition - gWorld);
          float graze = pow(1.0 - max(sv.y, 0.0), 5.0);
          float lies = 0.55 + 0.45 * gNoise(gWorld.xz * 0.21 + 11.0);
          float sheen = gWet * (0.04 + 0.42 * graze) * lies * gShine;
          outgoingLight = mix(outgoingLight, fogColor * 1.08, sheen);
        }
        #endif
        #include <opaque_fragment>`,
      );
  };
  // Materials sharing onBeforeCompile code need distinct cache keys only if
  // the code differs; the uniforms carry the differences here.
  material.customProgramCacheKey = () => `grass-v12${dune > 0 ? "d" : ""}-${GROUND_KEY}-${ULTRA ? "u" : HIGH ? "h" : "s"}${HERO ? "-hero" : ""}${PHONE ? "-p" : ""}${edge ? "-edge" : ""}${cleanup ? "-clean" : ""}${rim ? "-rim" : ""}${SHINE ? "-shine" : ""}${settle ? "-st" : ""}${cut ? "-cup" : ""}-r1`;
  // Its node version on WebGPURenderer (look/glsl/groundnode.js), from the
  // same choices and this material's own colours and texture.
  markTwin(material, "grass", {
    light: uniforms.gLight.value,
    dark: uniforms.gDark.value,
    stripeWidth,
    stripeAngle,
    mow,
    mowDir,
    centre,
    cleanup,
    rim,
    patch,
    patchScale,
    detailScale,
    detail,
    detailMap: uniforms.gDetail,
    tint,
    hole,
    edge,
    layer,
    worn,
    soil,
    clumps,
    settle,
    wind,
    dune,
    grain,
    fine: HIGH,
    hero: HERO,
    tex: HIGH,
    puddleDark: PUDDLES,
  });
  // The cloud-shade and bend hooks every lit piece of scenery runs.
  return withSceneryHooks(material, "ground");
}

// A band along a closed outline, fading from the surface (at the outline) to
// nothing `width` metres outside it. points: [[wx, wz], ...] in order, either
// way round. heightAt(wx, wz) for the ground; lift raises it off the ground.
// Use it with grassMaterial({ ...sameGrass, edge: true }), on the same layer.
export function edgeStrip(points, width, heightAt = () => 0, lift = 0) {
  return edgeBand(points, [{ off: 0, edge: 1 }, { off: width, edge: 0 }], heightAt, lift);
}

// A band along a closed outline, in columns across it: for each point, the
// same columns (an array) or its own (a function of the point's index) -
// { off: metres out from the outline (negative: in), edge: how solid (1
// solid, 0 gone; an edge material's gEdgeIn) }. Each laid out along the
// point's way out (sim/bandline.mjs outwardNormals).
export function edgeBand(points, columns, heightAt = () => 0, lift = 0) {
  const n = points.length;
  const out = outSide(points);
  const normals = outwardNormals(points, out);
  const colsAt = typeof columns === "function" ? columns : () => columns;
  const across = points.map((_, i) => colsAt(i));
  const cols = across[0].length;
  const pos = [];
  const edge = [];
  const index = [];
  for (let i = 0; i < n; i++) {
    const [x, z] = points[i];
    const [ux, uz] = normals[i];
    for (const c of across[i]) {
      const ox = x + ux * c.off;
      const oz = z + uz * c.off;
      pos.push(ox, heightAt(ox, oz) + lift, oz);
      edge.push(c.edge);
    }
    for (let k = 0; k + 1 < cols; k++) {
      const a = i * cols + k;
      const b = ((i + 1) % n) * cols + k;
      // Wound to face up: anticlockwise seen from above (the columns run
      // outwards whatever their order).
      const outward = across[i][k + 1].off > across[i][k].off;
      if ((out > 0) === outward) index.push(a, a + 1, b, b, a + 1, b + 1);
      else index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("gEdgeIn", new THREE.Float32BufferAttribute(edge, 1));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
}

// Each vertex's metres in from a surface's edge, for a clean-up ring
// (grassMaterial({ rim: true })): the surface round (cx, cz) (world) out
// to outline(angle) metres.
export function withRim(mesh, cx, cz, outline) {
  const pos = mesh.geometry.attributes.position;
  const rim = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    const dx = pos.getX(i) - cx;
    const dz = pos.getZ(i) - cz;
    rim[i] = outline(Math.atan2(dz, dx)) - Math.hypot(dx, dz);
  }
  mesh.geometry.setAttribute("gRimIn", new THREE.BufferAttribute(rim, 1));
  return mesh;
}

// A mowing pattern (look/glsl/ground.js mowingFor: its fairway's or its
// green's) as grassMaterial's options.
export function mowOptions(pattern) {
  return { mow: pattern.kind, mowDir: holeToWorld(pattern.dir) };
}

// The outline of a rectangle, x0 - x1 by z0 - z1 (world), as points every
// `step` metres or so round it - for an edgeStrip that follows the ground
// under it all the way along, not only at its corners.
export function rectangle(x0, z0, x1, z1, step = 1) {
  const pts = [];
  const side = (ax, az, bx, bz) => {
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / step));
    for (let i = 0; i < n; i++) pts.push([ax + ((bx - ax) * i) / n, az + ((bz - az) * i) / n]);
  };
  side(x0, z0, x1, z0);
  side(x1, z0, x1, z1);
  side(x1, z1, x0, z1);
  side(x0, z1, x0, z0);
  return pts;
}

// The grasses, in the colours of look/palette.js. Green, then fairway, then
// rough are each a clear step darker and duller than the last, so they tell
// apart on a projector.
const P = PALETTE;
// How strong the rough's and deep rough's light and dark patches are
// (gRoughPatches); the mapped holes' ground uses the same.
export const ROUGH_CLUMPS = 1;
export const DEEP_CLUMPS = 1.25;

// How far off (from the camera, height and all: from straight above too)
// the strongest grasses' patches ease (grass.js's shader: the
// long grass and deep rough seen from a flyover), metres, and to what: the
// patch amount and the clumps' strength at most, past "to".
export const GRASS_EASE = { fromAll: 90, toAll: 240, from: 25, to: 110, patch: 0.2, clumps: 0.6, flat: 0.92, settle: 0.75 };
// (fromAll, toAll: every other grass's - the rough's patches kept further
// out; from, to: the strip's, settle: true; flat: the plain colour's brightness, of its palette colour; settle: how
// far the long grass and deep rough go to it, past "to".)

export const GRASS = {
  // (shine: how much wet grass shines - the rough's longer blades a
  // quarter as much as mown grass.)
  rough: { light: P.rough[0], dark: P.rough[1], stripeWidth: 0, patch: 0.35, patchScale: 0.02, detailScale: 0.9, tint: 0.7, clumps: ROUGH_CLUMPS, wind: 1, shine: 0.25, layer: LAYER.rough },
  // Deep rough: darker, longer and patchier than the rough it sits in.
  deep: { light: P.deep, dark: P.deep, stripeWidth: 0, patch: 0.45, patchScale: 0.05, detailScale: 0.7, detail: 1, tint: 0.8, clumps: DEEP_CLUMPS, wind: 1, settle: true, layer: LAYER.deep },
  // A brown links hole (course.mjs trees "dunes"): its rough olive khaki,
  // and its long grass past it, playing as deep rough, straw - both
  // patchy with darker clumps, the long grass blowing more.
  duneRough: { light: P.duneRough, dark: P.duneRough, stripeWidth: 0, patch: 0.2, patchScale: 0.03, detailScale: 0.9, detail: 1, tint: 0.6, clumps: ROUGH_CLUMPS * 0.8, wind: 2, dune: 1, shine: 0.25, layer: LAYER.rough },
  fescue: { light: P.fescue, dark: P.fescueDry, stripeWidth: 0, patch: 0.22, patchScale: 0.035, detailScale: 0.6, detail: 1, tint: 0.6, clumps: DEEP_CLUMPS * 0.7, wind: 2.6, dune: 1, settle: true, layer: LAYER.deep },
  // Hay (sim/hay.mjs): paler than the fescue, gone to seed, blowing most.
  hay: { light: P.hay, dark: P.hayDry, stripeWidth: 0, patch: 0.25, patchScale: 0.03, detailScale: 0.6, detail: 1, tint: 0.55, clumps: DEEP_CLUMPS * 0.6, wind: 3.2, dune: 1, settle: true, layer: LAYER.deep },
  // A green links hole's long grass: darker, thicker patches of green.
  longGreen: { light: P.longGreen, dark: P.longGreen, stripeWidth: 0, patch: 0.65, patchScale: 0.035, detailScale: 0.7, detail: 1, tint: 0.9, clumps: DEEP_CLUMPS * 1.3, wind: 2.3, dune: 0.7, settle: true, layer: LAYER.deep },
  fairway: { light: P.fairway[0], dark: P.fairway[1], stripeWidth: 9, stripeAngle: Math.PI / 2, patch: 0.18, layer: LAYER.fairway },
  // The first cut: between the fairway and the rough, a little patchy.
  semi: { light: P.firstCut[0], dark: P.firstCut[1], stripeWidth: 0, patch: 0.26, patchScale: 0.03, detailScale: 0.8, tint: 0.6, clumps: 0.35, wind: 0.5, shine: 0.6, layer: LAYER.semi },
  green: { light: P.green[0], dark: P.green[1], stripeWidth: 3, stripeAngle: 0, patch: 0.1, patchScale: 0.08, detailScale: 0.5, detail: 0.5, tint: 0.2, layer: LAYER.green },
  fringe: { light: P.fringe, dark: P.fringe, stripeWidth: 0, patch: 0.12, detailScale: 0.7, layer: LAYER.fringe },
  tee: { light: P.tee[0], dark: P.tee[1], stripeWidth: 1.5, stripeAngle: 0, patch: 0.1, layer: LAYER.tee },
};

// A soft edge (edgeStrip) as a mesh. Edges are see-through, so three.js
// sorts them among the other see-through things by where the mesh sits -
// and an edge built in world coordinates sits at the world's centre, which
// once the camera is down the range is behind it: they were drawn last,
// over labels, rings and markers. Drawn first instead, lowest layer first,
// so a collar still lies over the fairway's edge under it.
export function edgeMesh(geo, material, layer = LAYER.fairway) {
  const mesh = new THREE.Mesh(geo, material);
  mesh.renderOrder = -10 + layer;
  mesh.receiveShadow = true;
  return mesh;
}
