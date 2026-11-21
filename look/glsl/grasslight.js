// The grass's own light (sim/grasslight.mjs: its shine looked across towards
// the sun, its colour fuller with the sun behind): a hook every kind of
// grass runs once in its fragment shader, after its lights are summed
// (look/glsl/hooks.js) - the mown ground and the rough, the tufts and the
// long grass on them, the grass round the ball - so each changes alike and a
// tuft stays the colour of the ground it stands in. Only the sun's light
// (reflectedLight.directDiffuse: its shadow already taken off, and a
// cloud's) is changed, so there's none of it in shade. The sun is the
// scene's first directional light (look/environment.js; High's near shadow
// map's light comes after it and has no light of its own).
//
// A ground material that paints more than grass (a mapped hole's, with its
// sand; a pond's bank, earth with turf over its top) says how much of each
// spot is grass before its lights (glGrass, 1 if it never says): none of
// the grass's light on the sand or the earth.
//
// Its strengths are uniforms shared by every material that runs it
// (grassLightUniforms: sim/grasslight.mjs GRASS_LIGHT), so they can be
// tried live. Changing what it does must change GRASSLIGHT_KEY, so every
// program using it is built again.

import * as THREE from "three";
import { GRASS_LIGHT, GRASS_KINDS } from "../../sim/grasslight.mjs";

export const GRASSLIGHT_KEY = "gl1";

const KINDS = new Set(GRASS_KINDS);
export const takesGrassLight = (kind) => KINDS.has(kind);

// glK: the shine's most, its tightness, the body's change; glTint: the
// shine's colour. (glSun: the way to the sun in the world, for the node
// version alone - look/glsl/nodehooks.js; look/environment.js keeps it
// where the sun is. WebGL reads the sun's own light.)
export const grassLightUniforms = {
  glK: { value: new THREE.Vector3(GRASS_LIGHT.sheen, GRASS_LIGHT.power, GRASS_LIGHT.body) },
  glTint: { value: new THREE.Vector3(...GRASS_LIGHT.tint) },
};
export const grassLightSun = { value: new THREE.Vector3(0, 1, 0) };

export const GRASSLIGHT_PARS = /* glsl */ `
uniform vec3 glK;
uniform vec3 glTint;
float glGrass = 1.0;
`;
// (The eye from here: three.js's own, as its lights have it. Level ground's
// up in the view's terms, as the tufts are lit: by the ground, not by a
// blade's face.)
export const GRASSLIGHT = /* glsl */ `
#if NUM_DIR_LIGHTS > 0
if ( glK.x > 0.0 || glK.z > 0.0 ) {
  vec3 glL = directionalLights[ 0 ].direction;
  vec3 glV = normalize( vViewPosition );
  vec3 glUp = normalize( ( viewMatrix * vec4( 0.0, 1.0, 0.0, 0.0 ) ).xyz );
  float glGraze = 1.0 - max( dot( glUp, glV ), 0.0 );
  float glGlance = max( dot( reflect( -glL, glUp ), glV ), 0.0 );
  float glSheen = glK.x * pow( glGlance, glK.y ) * glGraze * glGraze;
  float glLevel = dot( glV, glL ) - dot( glV, glUp ) * dot( glL, glUp );
  float glSun = dot( reflectedLight.directDiffuse, vec3( 0.2126, 0.7152, 0.0722 ) );
  reflectedLight.directDiffuse = reflectedLight.directDiffuse * ( 1.0 + glK.z * glLevel * glGrass ) + glTint * ( glSun * glSheen * glGrass );
}
#endif
`;

// Adds the hook to a grass material's shader (in onBeforeCompile); any
// other kind's is left as it is.
export function grassLight(shader, kind) {
  if (!takesGrassLight(kind)) return shader;
  Object.assign(shader.uniforms, grassLightUniforms);
  shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `#include <common>\n${GRASSLIGHT_PARS}`).replace("#include <lights_fragment_end>", `#include <lights_fragment_end>\n${GRASSLIGHT}`);
  return shader;
}
