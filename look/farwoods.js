// The far woods: thousands of trees out in the country (sim/country.mjs
// farWoods places them), each a flat picture of one of the course's own
// trees - every kind and shape, drawn once into an atlas as the page loads
// (look/treeatlas.js) - that turns to face the camera, all in one
// instanced draw, and on Medium and up is lit by the sun from the side
// it's on, from the picture's own normals. Each may be mirrored, stretched
// a little and tinted, so the sixty-odd pictures go further. Their edges
// use alpha to coverage under the picture's antialiasing, so they don't
// shimmer; they lean with the wind as the near trees do (look/glsl/bend.js's
// numbers); they cast nothing into the shadow map (a soft shadow is painted
// under each in the country's picture instead: look/country.js), and the
// haze takes them as it takes the hills.

import * as THREE from "three";
import { withSceneryHooks } from "./glsl/hooks.js";
import { markTwin } from "./twins.js";
import { BEND_PARS, bendUniforms } from "./glsl/bend.js";
import { SWAY_MAX } from "../sim/sway.mjs";
import { KINDS, shapeCount } from "../sim/treeshapes.mjs";
import { cardFor } from "../sim/faratlas.mjs";
import { standShade } from "../sim/treelooks.mjs";
import { treeAtlas, bakeTreeAtlas } from "./treeatlas.js";
import { HIGH } from "./quality.js";

const f = (v) => (Number.isInteger(v) ? `${v}.0` : `${v}`);

let material = null;
function farMaterial() {
  if (material) return material;
  const atlas = treeAtlas();
  // Medium and up: each pixel lit by the sun from the side it's on, from
  // the picture's own normals (look/treeatlas.js).
  const lit = HIGH && !!atlas.normals;
  material = new THREE.MeshLambertMaterial({ map: atlas.texture, alphaTest: 0.5, alphaToCoverage: true, side: THREE.DoubleSide });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, bendUniforms);
    if (lit) shader.uniforms.fwNormals = { value: atlas.normals.texture };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${BEND_PARS}\nattribute vec3 fwBox;\nattribute vec4 fwRect;\nvec3 fwRight;${lit ? "\nvarying vec3 fwSide;\nvarying vec3 fwFace;\nvarying float fwFlip;" : ""}`)
      // Turned to face the camera about its upright, and lit as a crown
      // is - from above and from the side it faces.
      .replace(
        "#include <beginnormal_vertex>",
        `vec3 fwAt = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        vec3 fwTo = cameraPosition - fwAt;
        fwTo.y = 0.0;
        fwTo = normalize(fwTo + vec3(0.0001, 0.0, 0.0));
        fwRight = vec3(fwTo.z, 0.0, -fwTo.x);
        vec3 objectNormal = normalize(fwTo * 0.5 + vec3(0.0, 0.85, 0.0));`,
      )
      // The card spans the tree's box (fwBox: its left and right edges
      // across from the trunk, and its height, metres), leaning downwind
      // as a near tree does: its foot still, its top by the square of the
      // height (bend.js, sim/sway.mjs).
      .replace(
        "#include <begin_vertex>",
        `float fwT = position.x + 0.5;
        vec3 transformed = fwRight * mix(fwBox.x, fwBox.y, fwT) + vec3(0.0, position.y * fwBox.z, 0.0);
        float fwUp = clamp(position.y, 0.0, 1.0);
        transformed += vec3(bendDir.x, 0.0, bendDir.y) * (bendWave(fwAt, 1.25) * ${f(SWAY_MAX)} * fwBox.z * fwUp * fwUp);${
          lit
            ? `
        // (The card's own directions, for its picture's normals below:
        // across it, out of it towards the camera, and whether its
        // picture reads right to left.)
        fwSide = fwRight;
        fwFace = fwTo;
        fwFlip = fwRect.z < 0.0 ? -1.0 : 1.0;`
            : ""
        }`,
      )
      // Its own picture's rectangle in the atlas (du negative: mirrored).
      // (Before the card is placed: three.js works out co-ordinates first.)
      .replace("#include <uv_vertex>", `#include <uv_vertex>\nvMapUv = fwRect.xy + vec2(position.x + 0.5, position.y) * fwRect.zw;`);
    // Each pixel's facing from the picture's normals - a crown as a
    // rounded mass, the trunk its own - turned to where the card stands,
    // so the sun lights each tree from the side it's on as the camera
    // stands, and the sky its top: a far wood has depth, and the far tree
    // line isn't one flat band. (Ultra had a round crown made up in the
    // shader; the pictures' own are every setting's from Medium up.)
    if (lit) {
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform sampler2D fwNormals;\nvarying vec3 fwSide;\nvarying vec3 fwFace;\nvarying float fwFlip;")
        .replace(
          "#include <normal_fragment_begin>",
          `#include <normal_fragment_begin>
          {
            vec3 nb = texture2D(fwNormals, vMapUv).xyz * 2.0 - 1.0;
            nb.x *= fwFlip;
            vec3 nw = fwSide * nb.x + vec3(0.0, 1.0, 0.0) * nb.y + fwFace * nb.z;
            normal = normalize((viewMatrix * vec4(normalize(nw + vec3(0.0, 0.0001, 0.0)), 0.0)).xyz);
          }`,
        );
    }
  };
  material.customProgramCacheKey = () => `farwoods-3${lit ? "-lit" : ""}`;
  withSceneryHooks(material, "farwoods");
  // (Its node version, on WebGPURenderer: glsl/farwoodsnode.js.)
  return markTwin(material, "farwoods", { atlas, lit });
}

// A kind's name (sim/treeshapes.mjs KINDS) as its index; the old painted
// woods' names (a mapped course's own woods may still give them) as the
// kind nearest them.
const OLD = { beech: "leaf", conifer: "spruce" };
const kindIndex = (name) => Math.max(0, KINDS.indexOf(OLD[name] ?? name));

// The stand's cast on a far tree's colour (a multiplier near 1): its
// lightness offset as a share of a leaf's own (about 0.35 in HSL), and its
// hue offset as warmth (yellower is warmer).
const FAR_CAST = { light: 1 / 0.35, warm: 2 };

// The trees ({ x, z, h, w, kind, shape, tint, flip, stretch, scale } in
// world terms: sim/country.mjs farWoods; shape, flip and stretch made up
// from tint if not given; scale, if given, sizes it as its 3D tree:
// sim/neighbours.mjs farTree) as one instanced mesh, standing on groundY(x, z).
export function makeFarWoods(trees, { groundY = () => 0 } = {}) {
  const n = trees.length;
  if (!n) return null;
  const { cells } = treeAtlas();
  // The card: a unit square, its foot at the middle of its bottom edge
  // (stretched over each tree's box in the shader).
  const geo = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
  const box = new Float32Array(n * 3);
  const rect = new Float32Array(n * 4);
  const mesh = new THREE.InstancedMesh(geo, farMaterial(), n);
  const m = new THREE.Matrix4();
  const c = new THREE.Color();
  trees.forEach((t, i) => {
    const k = kindIndex(t.kind);
    const tint = Number.isFinite(t.tint) ? t.tint : 0.5;
    const shape = Number.isInteger(t.shape) ? t.shape % shapeCount(k) : Math.floor(tint * 997) % shapeCount(k);
    const flip = t.flip ?? tint * 7919 % 1 < 0.5;
    const cell = cells[k][shape];
    const card = cardFor(cell.fit, cell.box, flip);
    // (A little into the ground, so no gap shows on a slope.) A tree with
    // a scale is as tall as its 3D self (its picture's height in model
    // units, times that).
    const h = (Number.isFinite(t.scale) ? cell.box.h * t.scale : t.h) + 0.6;
    const stretch = t.stretch ?? 1;
    m.makeTranslation(t.x, groundY(t.x, t.z) - 0.6, t.z);
    mesh.setMatrixAt(i, m);
    box.set([card.x0 * h * stretch, card.x1 * h * stretch, h], i * 3);
    rect.set(card.rect, i * 4);
    // A little lighter or darker, warmer or cooler, than its picture.
    // (A shade darker on the whole than the picture: lit flat, facing the
    // camera and the sky, a card caught more light than a far tree's round
    // crown does.)
    // And the stand's cast where it stands (sim/treelooks.mjs), as the 3D
    // trees in front of it have: a stand carries on into the woods.
    const stand = standShade(t.x, t.z);
    const l = (0.78 + tint * 0.2) * (1 + stand.light * FAR_CAST.light);
    const warm = (((tint * 31) % 1) - 0.5) * 0.08 - stand.hue * FAR_CAST.warm;
    mesh.setColorAt(i, c.setRGB(l * (1 + warm), l, l * (1 - warm)));
  });
  geo.setAttribute("fwBox", new THREE.InstancedBufferAttribute(box, 3));
  geo.setAttribute("fwRect", new THREE.InstancedBufferAttribute(rect, 4));
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  // Its bounds are the trees' own spread, worked out once (an instanced
  // mesh is otherwise culled by its one quad's).
  mesh.computeBoundingSphere();
  mesh.frustumCulled = false;
  mesh.userData.farWoods = true;
  // The pictures are drawn as the page loads (app.js); if they somehow
  // weren't, they're drawn now, before the woods are first seen.
  mesh.onBeforeRender = (renderer) => bakeTreeAtlas(renderer);
  return mesh;
}
