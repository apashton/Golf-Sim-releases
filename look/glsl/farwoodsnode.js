// The far woods (look/farwoods.js) as node materials, for WebGPURenderer
// (look/nodetwins.js): each tree a card from the atlas, turned to face the
// camera about its upright, spanning its tree's box and leaning downwind as
// a near tree does - lit as a crown is (on Medium and up from its picture's
// own normals) - the same sums as the WebGL shader. And the two programs
// the atlas is drawn with (look/treeatlas.js): each part's colour and
// texture lighter where it faces up and towards the viewer, and its
// normals - one material per texture, each part's tint, cut and crown
// read as it's drawn.

import * as THREE from "three";
import { MeshBasicNodeMaterial, MeshLambertNodeMaterial } from "three/webgpu";
import { attribute, cameraPosition, clamp, cameraViewMatrix, dot, float, max, mix, modelWorldMatrix, normalWorld, normalize, positionLocal, positionWorld, texture, uniform, varying, vec2, vec3, vec4 } from "three/tsl";
import { SWAY_MAX } from "../../sim/sway.mjs";
import { applyNodeHooks, bendDir, bendWave } from "./nodehooks.js";

export const FARWOODS_NODE_KEY = "fw1";

// atlas: look/treeatlas.js's ({ texture, normals }); lit: from its
// normals (Medium and up).
export function farWoodsNodeMaterial({ atlas, lit }) {
  const pos = attribute("position", "vec3");
  const box = attribute("fwBox", "vec3");
  const rect = attribute("fwRect", "vec4");
  // (three has already moved the card to its tree - the instance's own
  // matrix, a shift alone - by the time this runs: where it was moved
  // to, less where the card's corner was.)
  const at = positionLocal.sub(pos);
  const fwAt = modelWorldMatrix.mul(vec4(at, 1)).xyz;
  const to = normalize(vec3(cameraPosition.x.sub(fwAt.x), 0, cameraPosition.z.sub(fwAt.z)).add(vec3(1e-4, 0, 0)));
  const right = vec3(to.z, 0, to.x.negate());
  const t = pos.x.add(0.5);
  const up = clamp(pos.y, 0, 1);
  const lean = vec3(bendDir.x, 0, bendDir.y).mul(bendWave(fwAt, 1.25).mul(SWAY_MAX).mul(box.z).mul(up).mul(up));
  const material = new MeshLambertNodeMaterial({ alphaTest: 0.5, alphaToCoverage: true, side: THREE.DoubleSide });
  material.positionNode = at.add(right.mul(mix(box.x, box.y, t))).add(vec3(0, pos.y.mul(box.z), 0)).add(lean);
  // (The atlas as this renderer draws a picture: its top row first, where
  // WebGL's is its bottom - so its rows are read the other way up.)
  const atlasUv = rect.xy.add(vec2(t, pos.y).mul(rect.zw));
  const uv = varying(vec2(atlasUv.x, float(1).sub(atlasUv.y)));
  material.colorNode = texture(atlas.texture, uv);
  if (lit && atlas.normals) {
    const side = varying(right);
    const face = varying(to);
    const flip = varying(rect.z.lessThan(0).select(float(-1), float(1)));
    const nb = texture(atlas.normals.texture, uv).xyz.mul(2).sub(1);
    const nw = side.mul(nb.x.mul(flip)).add(vec3(0, 1, 0).mul(nb.y)).add(face.mul(nb.z));
    material.normalNode = normalize(cameraViewMatrix.mul(vec4(normalize(nw.add(vec3(0, 1e-4, 0))), 0)).xyz);
  } else {
    material.normalNode = normalize(cameraViewMatrix.mul(vec4(normalize(varying(to.mul(0.5).add(vec3(0, 0.85, 0)))), 0)).xyz);
  }
  applyNodeHooks(material, "farwoods", { bend: false });
  material.userData.farWoodsNode = FARWOODS_NODE_KEY;
  return material;
}

// What each part drawn into the atlas has set on it (look/treeatlas.js):
// object.userData.atlas = { tint (a Color), cut, radial, centre (a Vector3) }.
const partOf = (object) => object.userData.atlas;

// The atlas's colour, for parts in `map`: the part's colour, its vertex
// shading, its texture (cut out where the leaves are), lighter where it
// faces up and towards the viewer; unlit.
export function atlasPictureNodeMaterial(map) {
  const tint = uniform(new THREE.Color()).onObjectUpdate(({ object }) => partOf(object).tint);
  const cut = uniform(-1).onObjectUpdate(({ object }) => partOf(object).cut);
  const material = new MeshBasicNodeMaterial({ side: THREE.DoubleSide, vertexColors: true });
  const tex = texture(map);
  const shade = float(0.8).add(max(dot(normalize(normalWorld), normalize(vec3(0, 0.8, 0.6))), 0).mul(0.32));
  material.colorNode = vec4(tint.mul(shade).mul(tex.rgb), 1);
  material.maskNode = tex.a.greaterThanEqual(cut);
  material.toneMapped = false;
  material.fog = false;
  return material;
}

// The atlas's normals, for parts in `map`: each pixel's facing in the
// picture's frame as a colour, the part's own turned to the viewer and
// mixed by its radial with the way out from the crown's middle.
export function atlasFacingNodeMaterial(map) {
  const cut = uniform(-1).onObjectUpdate(({ object }) => partOf(object).cut);
  const radial = uniform(0).onObjectUpdate(({ object }) => partOf(object).radial);
  const centre = uniform(new THREE.Vector3()).onObjectUpdate(({ object }) => partOf(object).centre);
  const material = new MeshBasicNodeMaterial({ side: THREE.DoubleSide });
  const tex = texture(map);
  const own0 = normalize(normalWorld);
  const own = own0.z.lessThan(0).select(own0.negate(), own0);
  const out = normalize(positionWorld.sub(centre).add(vec3(0, 0, 1e-4)));
  const n = normalize(mix(own, out, radial));
  material.colorNode = vec4(n.mul(0.5).add(0.5), 1);
  material.maskNode = tex.a.greaterThanEqual(cut);
  material.toneMapped = false;
  material.fog = false;
  return material;
}
