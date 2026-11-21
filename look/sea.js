// The sea beside a course (sim/coast.mjs says where): one flat sheet of
// water out to the horizon at the hole's sea level, cut back to the coast
// by a picture of how far each spot is from the water's edge, and drawn
// after the ground so its shore is wherever the ground (look/country.js,
// course.js) runs down under it. Grey-blue out deep, greener in the
// shallows and sandy at the edge; swell and ripples running with the wind
// (the ponds' own: look/sandwater.js); lines of surf coming in and white
// water at the edge; the sky in it, paling to the haze at the horizon (the
// scene's own fog; and seen low, mostly the sky it reflects: SEA_GRAZE).
// One draw.

import * as THREE from "three";
import { PALETTE, glsl } from "./palette.js";
import { HIGH } from "./quality.js";
import { NOISE, LAYER, onLayer } from "./grass.js";
import { withSceneryHooks } from "./glsl/hooks.js";
import { waterParts } from "./sandwater.js";
import { coastPixels, SEA_TEXEL } from "../sim/coast.mjs";

// How far the sheet reaches either way from the hole (past the camera's far
// limit from anywhere on the hole), and the picture of the coast under it:
// its size (metres) and pixels a side.
export const SEA = { sheet: 16000, size: 7000, n: 512 };

// Seen low - far out, or from the beach - a sea is mostly the sky it
// reflects, and of its swell you see the faces turned towards you, the
// backs hidden behind the crests: they reflect the sky higher up, bluer
// and darker than the haze at the horizon, so the horizon stays a crisp
// line with the sea a shade darker than the sky. So the lower it's seen
// (its slope towards the eye from `high` down to `low`), the more its
// swell's faces are tipped towards the eye (`tilt`) and the stronger the
// sky in it (`gain` times the reflection, against the sheen's tint close
// to). Without it, its deep water's colour carried on out until the haze
// took it, and a dark band lay between the sea and the haze - worst from
// up high (the backlog: "a thin dark band where the sea meets the haze at
// the horizon"); paled to the haze instead, it read as fog lying on the
// water (the owner: "it doesn't look realistic").
export const SEA_GRAZE = Object.freeze({ low: 0.02, high: 0.25, tilt: 0.05, gain: 1 });
const f = (v) => v.toFixed(3);

// The picture of the coast round [x, z] (world): how far each spot is from
// the water's edge (sim/coast.mjs coastPixels), for the sea's shader.
export function coastTexture(at, centre, { size = SEA.size, n = SEA.n } = {}) {
  const box = { x0: centre[0] - size / 2, z0: centre[1] - size / 2, size };
  const pixels = coastPixels(at, { box, n });
  const texture = new THREE.DataTexture(pixels, n, n, THREE.RedFormat, THREE.UnsignedByteType);
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return { texture, box: new THREE.Vector3(box.x0, box.z0, 1 / size) };
}

// The sea's material for a coast picture (coastTexture's). surf: how big
// the surf runs (1 a breezy day's).
export function seaMaterial(coast) {
  // The same depth as the ground it meets (the far ground's rough: look/
  // grass.js onLayer), so where the beach runs under the water is exact.
  const material = onLayer(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.12, metalness: 0, envMapIntensity: 0.5 }), LAYER.rough);
  const { ripple, uniforms: ripples, time } = waterParts();
  const uniforms = {
    sCoast: { value: coast.texture },
    sCoastBox: { value: coast.box },
    sTexel: { value: SEA_TEXEL },
    wRipple: { value: ripple },
    wTime: time,
    ...ripples,
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 sWorld;")
      .replace("#include <project_vertex>", "#include <project_vertex>\nsWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        ${HIGH ? "#define SEA_FINE" : ""}
        varying vec3 sWorld;
        uniform sampler2D sCoast;
        uniform vec3 sCoastBox;
        uniform float sTexel;
        uniform sampler2D wRipple;
        uniform float wTime;
        uniform vec2 wDriftA;
        uniform vec2 wDriftB;
        uniform float wChop;
        uniform float wGustK;
        ${NOISE}
        float sFoam = 0.0;
        float sDepth = 0.0;
        float sGraze = 0.0;
        // Metres to the water's edge here (+ on land).
        float seaCoast(vec2 w) {
          return (texture2D(sCoast, (w - sCoastBox.xy) * sCoastBox.z).r * 255.0 - 128.0) * sTexel;
        }`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        {
          vec2 w = sWorld.xz;
          float d = seaCoast(w);
          // None over the land: the ground hides it there anyway, but for
          // a hollow lower than the sea, and past the ground's edge.
          if (d > 3.0) discard;
          // (The edge made a little ragged, as the shore's own is.)
          float depth = max(0.0, -d + (gNoise(w * 0.09) - 0.5) * 3.0);
          sDepth = depth;
          vec3 deep = ${glsl(PALETTE.seaDeep)};
          vec3 shallow = ${glsl(PALETTE.seaShallow)};
          vec3 sandy = ${glsl(PALETTE.seaSand)};
          vec3 col = mix(shallow, deep, smoothstep(6.0, 180.0, depth));
          col = mix(sandy, col, smoothstep(0.0, 16.0, depth));
          // Broad patches - weed, sandbanks, cloud shadow on the swell.
          col *= 0.9 + 0.2 * gNoise(w * 0.0035 + 3.0);
          // The surf: lines of white water running in to the shore, broken
          // up, bigger the windier it is - and the swash at the very edge,
          // spreading up the sand and drawing back.
          float surf = clamp(0.35 + 0.55 * wChop, 0.3, 1.2);
          float zone = (1.0 - smoothstep(12.0, 45.0 * surf, depth)) * smoothstep(1.0, 4.0, depth);
          // (Each line's own spacing and timing along the shore, so they
          // don't run in as neat rings.)
          float along = gNoise(w * 0.011 + 5.0);
          float wave = depth / mix(13.0, 21.0, along) + wTime * 0.08 + gNoise(w * 0.02) * 1.1;
          float f = fract(wave);
          float crest = smoothstep(0.8, 0.92, f) * (1.0 - smoothstep(0.92, 0.985, f));
          float broken = smoothstep(0.42, 0.78, gNoise(w * vec2(0.05, 0.05) + vec2(wTime * 0.03, 0.0)) * 0.7 + gNoise(w * 0.17) * 0.3);
          sFoam = crest * zone * broken * min(1.0, surf);
          float reach = 2.5 + 2.5 * (0.5 + 0.5 * sin(wTime * 0.55 + gNoise(w * 0.025) * 6.283));
          float swash = 1.0 - smoothstep(0.0, reach, depth);
          sFoam = max(sFoam, swash * (0.6 + 0.3 * gNoise(w * 0.4)));
          // Old foam left in streaks over the surf zone.
          sFoam = max(sFoam, zone * 0.25 * smoothstep(0.6, 0.85, gNoise(w * vec2(0.03, 0.11) + 9.0)));
          col = mix(col, ${glsl(PALETTE.seaFoam)}, sFoam);
          diffuseColor.rgb *= pow(col, vec3(2.2));
        }`,
      )
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.85, sFoam);")
      .replace(
        "#include <normal_fragment_maps>",
        `{
          // Swell and ripples, the ponds' own pictures at a sea's sizes,
          // running with the wind; calmer far off, where they'd only
          // shimmer, and flat where it's white water.
          vec2 w = sWorld.xz;
          vec2 a = texture2D(wRipple, w * 0.012 - wDriftA * 0.4).xy * 2.0 - 1.0;
          vec2 slope = a * 0.12;
          float far = smoothstep(0.004, 0.08, fwidth(w.x * 0.05));
          #ifdef SEA_FINE
          vec2 q = mat2(0.8, -0.6, 0.6, 0.8) * w;
          vec2 b = texture2D(wRipple, q * 0.06 - wDriftB).xy * 2.0 - 1.0;
          slope += b * 0.07 * (1.0 - far);
          #endif
          slope *= (0.55 + 0.6 * wChop) * (1.0 - 0.75 * far) * (1.0 - 0.8 * sFoam) * (1.0 + 0.6 * wGustK);
          vec3 nw = normalize(vec3(-slope.x, 1.0, -slope.y));
          // Seen low, the faces turned towards the eye (SEA_GRAZE).
          vec3 sEye = normalize(cameraPosition - sWorld);
          sGraze = 1.0 - smoothstep(${f(SEA_GRAZE.low)}, ${f(SEA_GRAZE.high)}, sEye.y);
          vec2 sToward = normalize(sEye.xz + vec2(1e-5));
          nw = normalize(nw + vec3(sToward.x, 0.0, sToward.y) * ${f(SEA_GRAZE.tilt)} * sGraze);
          normal = normalize((viewMatrix * vec4(nw, 0.0)).xyz);
        }`,
      )
      .replace(
        "#include <lights_fragment_end>",
        `#include <lights_fragment_end>
        // The sky in it, a cool grey-blue sheen - stronger seen low
        // (SEA_GRAZE), none in the white water.
        reflectedLight.indirectSpecular *= mix(${glsl(PALETTE.seaSheen)}, vec3(${f(SEA_GRAZE.gain)}), sGraze) * (1.0 - sFoam);
        reflectedLight.directSpecular *= 0.5 * (1.0 - sFoam);`,
      );
  };
  material.customProgramCacheKey = () => `sea-v3-${HIGH ? "h" : "s"}`;
  withSceneryHooks(material, "water");
  // (Freed as a pond's is: look/sandwater.js disposeSurface.)
  material.userData.field = coast;
  material.userData.time = time;
  material.userData.surface = true;
  return material;
}

// The sea for a hole: at(x, z) the coast (sim/coast.mjs coastHere's, the
// world's x and z), level its height, centre where the hole's scenery is
// centred. Returns the mesh: flat, lit, catching no shadow and casting
// none, drawn after the ground.
export function makeSea({ at, level, centre }) {
  const coast = coastTexture(at, centre);
  const geo = new THREE.PlaneGeometry(SEA.sheet, SEA.sheet, 8, 8).rotateX(-Math.PI / 2);
  geo.deleteAttribute("uv");
  const mesh = new THREE.Mesh(geo, seaMaterial(coast));
  mesh.position.set(centre[0], level, centre[1]);
  mesh.receiveShadow = false;
  mesh.castShadow = false;
  // After the ground, so it's drawn only where the ground leaves it room.
  mesh.renderOrder = 1;
  mesh.name = "sea";
  return mesh;
}
