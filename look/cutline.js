// The mower's line on the graphics card (sim/mowncut.mjs): the hole's field
// of how far each spot is into its mown ground, as a one-channel picture,
// and the shaders' few lines that leave out any part of a blade of the
// rough's grass standing over mown ground - so the long grass, the tufts
// and the grass round the ball end in a neat line along every edge a
// mower makes, however a blade leans or a clump stands (the owner: "The
// mower cut is a neat line"). The rough's edge where nothing's mown - the
// deep rough's, round sand, water, paths and trees - isn't touched.
//
// One field at a time: the course's scene sets its hole's before it's
// drawn and takes it away after (course.js useCut), so no other mode's
// grass is cut by it.

import * as THREE from "three";
import { CUT } from "../sim/mowncut.mjs";

const none = new THREE.DataTexture(new Uint8Array([0]), 1, 1, THREE.RedFormat, THREE.UnsignedByteType);
none.needsUpdate = true;

// gCutBox: the picture's corner (world x, z) and 1 / its size each way; z
// below 0 with no field.
export const cutUniforms = {
  gCutMap: { value: none },
  gCutBox: { value: new THREE.Vector4(0, 0, -1, -1) },
};

// The hole's field as a picture: { texture, box } (dispose the texture
// when the hole goes). field: sim/mowncut.mjs mownField's, or null.
export function cutPicture(field) {
  if (!field) return null;
  const texture = new THREE.DataTexture(field.data, field.nx, field.nz, THREE.RedFormat, THREE.UnsignedByteType);
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  // Read between cells, so the line runs straight across them.
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return { texture, box: [field.x0, field.z0, 1 / (field.nx * field.cell), 1 / (field.nz * field.cell)] };
}

// The field the grass is cut by from now on (a hole's cutPicture), or none.
export function useCut(picture) {
  cutUniforms.gCutMap.value = picture?.texture ?? none;
  if (picture) cutUniforms.gCutBox.value.set(...picture.box);
  else cutUniforms.gCutBox.value.set(0, 0, -1, -1);
}

// In a vertex shader: where the vertex is, for the fragments between.
export const CUT_VERTEX_PARS = "varying vec2 vCutAt;";
export const cutVertex = (world) => `vCutAt = (${world}).xz;`;

// In a fragment shader: how far into the mown ground (metres, below 0 in
// the rough), and the line itself - `rough` true for a blade of the rough's
// grass, which isn't drawn past it. (A field's byte: 128 on the line, the
// range either side.)
export const CUT_FRAGMENT_PARS = /* glsl */ `
  uniform sampler2D gCutMap;
  uniform vec4 gCutBox;
  varying vec2 vCutAt;
  float gMown() {
    if (gCutBox.z <= 0.0) return -1.0;
    vec2 uv = (vCutAt - gCutBox.xy) * gCutBox.zw;
    if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return -1.0;
    return (texture2D(gCutMap, uv).r * 255.0 - 127.5) / 127.5 * ${CUT.range.toFixed(2)};
  }
`;
export const cutFragment = (rough) => `if ((${rough}) && gMown() > 0.0) discard;`;
// Bumped with the shaders' look (their program keys).
export const CUT_KEY = "cut1";
