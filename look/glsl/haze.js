// The haze: three.js's fog chunk replaced, once, before any program is
// compiled (look/environment.js imports this first thing), so everything
// hazed gets it - ground, trees, hills, water, signs - without a material
// being edited.
//
// What it does that plain fog didn't:
// - It thins with height: the haze is thickest down in the valley, so a
//   ridge or a treeline stands out over the hazier low ground in front of
//   it (the average height along the line of sight, against HAZE_HEIGHT).
// - It's a touch warmer and brighter looking towards the sun, cooler
//   looking away (the palette's hazeSun and hazeShade, against its fog).
// - It's measured along the line of sight, not the depth into the screen,
//   so it doesn't thin towards the edges of the picture.
// - Anything marked readable (look/weatherlook.js markReadable: the ball,
//   its tracer, the flag, the tee markers, the boards) never takes more
//   than a fair day's haze, however thick the day's is (a misty morning).
//
// The scene's fog is a HazeFog: `near` carries the day's density and `far`
// the most a readable thing may take (three.js hands those two to the
// shader as fogNear and fogFar; nothing else about linear fog is used).
// The sky's lowest band is blended into the same colour by the same rule
// (look/environment.js), so the hills fade into the horizon.

import * as THREE from "three";
import { PALETTE, rgb } from "../palette.js";

// The haze halves in thickness about every HAZE_HEIGHT metres up (as an
// average over the line of sight), down to (1 - HAZE_THIN) of its
// ground-level thickness.
export const HAZE_HEIGHT = 120;
export const HAZE_THIN = 0.6;

// The warm and cool tints, as multipliers on the fog colour.
const tint = (hex) => {
  const f = rgb(PALETTE.fog);
  return rgb(hex).map((c, i) => c / f[i]);
};
const vec = (a) => `vec3(${a.map((v) => v.toFixed(4)).join(", ")})`;
export const HAZE_WARM = tint(PALETTE.hazeSun);
export const HAZE_COOL = tint(PALETTE.hazeShade);

// The haze colour looking along a unit direction `dir` (world), for a
// fogColor, as GLSL: shared by the fog chunk and the sky's low band.
export const HAZE_TINT = /* glsl */ `
vec3 hazeTint( vec3 fogCol, vec3 dir ) {
  float toSun = dot( dir, hazeSunDir ) * 0.5 + 0.5;
  return fogCol * mix( ${vec(HAZE_COOL)}, ${vec(HAZE_WARM)}, toSun * toSun );
}
`;

// The sun's direction (look/environment.js sunDirection): a uniform, not
// written into the shader. Written in, every shader with haze - nearly all
// of them - read differently whenever the sun had moved since the last
// start (with Time of day from the clock on, every minute of the day), so
// the graphics card's compiled programs kept from one start to the next
// (electron/main.mjs) never matched, and every start compiled them all
// again: 20 seconds and more of a start on Ultra on the owner's card, and
// a third of that after dark, when the sun stands still at sunset.
// Given to every material with haze from three.js's own uniforms
// (installHaze) and to the sky's (hazeSkyUniform), it's set once, as the
// sun line was.
const SUN_LINE = "uniform vec3 hazeSunDir;";

const PARS_VERTEX = /* glsl */ `
#ifdef USE_FOG
  varying float vFogDepth;
  varying vec3 vFogRay;
#endif
`;

const VERTEX = /* glsl */ `
#ifdef USE_FOG
  vFogDepth = - mvPosition.z;
  // From the camera to here, in world directions (the view's rotation undone).
  vFogRay = ( vec4( mvPosition.xyz, 0.0 ) * viewMatrix ).xyz;
#endif
`;

function parsFragment() {
  return /* glsl */ `
#ifdef USE_FOG
  uniform vec3 fogColor;
  varying float vFogDepth;
  varying vec3 vFogRay;
  #ifdef FOG_EXP2
    uniform float fogDensity;
  #else
    uniform float fogNear;
    uniform float fogFar;
  #endif
  ${SUN_LINE}
  ${HAZE_TINT}
#endif
`;
}

const FRAGMENT = /* glsl */ `
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float hazeDensity = fogDensity;
  #else
    float hazeDensity = fogNear;
    #ifdef READABLE
      hazeDensity = min( hazeDensity, fogFar );
    #endif
  #endif
  float hazeDist = length( vFogRay );
  vec3 hazeDir = vFogRay / max( hazeDist, 1e-3 );
  float hazeY = max( 0.0, cameraPosition.y + 0.5 * vFogRay.y );
  float hazeThin = 1.0 - ${HAZE_THIN.toFixed(3)} * ( 1.0 - exp2( - hazeY / ${HAZE_HEIGHT.toFixed(1)} ) );
  float hazeD = hazeDensity * hazeThin * hazeDist;
  float fogFactor = 1.0 - exp( - hazeD * hazeD );
  gl_FragColor.rgb = mix( gl_FragColor.rgb, hazeTint( fogColor, hazeDir ), fogFactor );
#endif
`;

let installed = null;

// Replaces the fog chunks (once; `sun` the direction to the sun), and
// gives every one of three.js's own materials with fog the sun's direction
// (its ShaderLib uniforms, which each material's are copied from as its
// program is made; and the fog's own uniforms, for a material made from
// them). Our own ShaderMaterials don't take the haze.
export function installHaze(sun) {
  if (installed) return;
  installed = sun.clone().normalize();
  THREE.ShaderChunk.fog_pars_vertex = PARS_VERTEX;
  THREE.ShaderChunk.fog_vertex = VERTEX;
  THREE.ShaderChunk.fog_pars_fragment = parsFragment();
  THREE.ShaderChunk.fog_fragment = FRAGMENT;
  for (const lib of [...Object.values(THREE.ShaderLib ?? {}).map((l) => l?.uniforms), THREE.UniformsLib?.fog]) {
    if (lib?.fogColor) lib.hazeSunDir = { value: installed.clone() };
  }
}

// The direction to the sun the haze was installed with (its tint's warm
// side), for the node version on WebGPURenderer (look/nodetwins.js).
export const hazeSun = () => installed;

// The sky's own GLSL for its lowest band (look/environment.js): the sun's
// uniform and the tint - the same text whatever the sun (hazeSkyUniform
// gives it the sun).
export function hazeSkyChunk() {
  return `${SUN_LINE}\n${HAZE_TINT}`;
}
// The sky's sun for its band: its material's uniform.
export const hazeSkyUniform = (sun) => ({ value: sun.clone().normalize() });

// The Distance haze switch (sim/effects.mjs haze): off, every scene's haze
// is this much of the day's - a clearer day, the far edge still hidden.
export const HAZE_OFF = 0.5;
let hazeScale = 1;
// (Held loosely: a hole's scene let go takes its haze with it.)
const hazes = new Set();
// Every scene's haze at `k` of the day's (1, or HAZE_OFF), now.
export function setHazeScale(k) {
  hazeScale = k;
  for (const ref of hazes) {
    const f = ref.deref();
    if (f) f.setHaze(f.times, f.readable);
    else hazes.delete(ref);
  }
}

// A scene's haze: `density` a fair day's (the exponential fog's density);
// set the day's with setHaze.
export class HazeFog extends THREE.Fog {
  constructor(color, density) {
    super(color, density * hazeScale, density * hazeScale);
    this.isHazeFog = true;
    this.fair = density;
    this.times = 1;
    this.readable = 1;
    hazes.add(new WeakRef(this));
  }

  // times: the day's haze against a fair day's (look/weatherlook.js haze);
  // readable: the most a readable thing may take, the same way. (Times the
  // Distance haze switch's scale.)
  setHaze(times, readable = 1) {
    this.times = times;
    this.readable = readable;
    this.near = this.fair * times * hazeScale;
    this.far = this.fair * Math.min(times, readable) * hazeScale;
  }

  // The density now, for anything working the haze out itself.
  get density() {
    return this.near;
  }

  clone() {
    return new HazeFog(this.color, this.fair);
  }
}

// How much haze a thing `distance` metres off (at mean height `y` along
// the line of sight) takes, at `density`: the same rule as the shader, for
// the tests and anything placed by it.
export function hazeAmount(density, distance, y = 0) {
  const thin = 1 - HAZE_THIN * (1 - 2 ** (-Math.max(0, y) / HAZE_HEIGHT));
  const d = density * thin * distance;
  return 1 - Math.exp(-d * d);
}
