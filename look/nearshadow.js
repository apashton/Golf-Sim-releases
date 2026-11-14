// High's near shadow map (sim/nearshadow.mjs says where it lies): a second,
// sharper map of the sun's shadows round where the camera is looking - the
// golfer, the ball at address, the flag, the bunker lips and the trees
// close by - laid over the wide map that covers the whole scene, and
// fading into it towards its edges (docs/GRAPHICS-NEXT.md section 5:
// "Softer, sharper shadows").
//
// It's a second directional light with no light of its own, only its
// shadow map: each scene gets one (addNearShadow, from look/environment.js)
// straight after the sun, so it's always the second shadow-casting light,
// and three.js's lighting (ShaderChunk.lights_fragment_begin, changed
// once, on High only, before any shader is built) takes the sun's shadow
// from the near map where it lies and from the wide map elsewhere. It's
// drawn only when it moves or something in it does (look/shadowwatch.js),
// and the safety valve can shed it (it stops moving, and moves off to
// nowhere: nothing to build again).

import * as THREE from "three";
import { EXTRA, ULTRA, LEVEL, PHONE } from "./quality.js";
import { registerStep } from "./safety.js";
import { NEAR as HIGH_NEAR, NEAR_ULTRA, nearFocus, nearCentre, softTaps } from "../sim/nearshadow.mjs";

// Ultra's map is bigger and reaches further (sim/nearshadow.mjs NEAR_ULTRA).
const NEAR = ULTRA ? NEAR_ULTRA : HIGH_NEAR;

// The sun's shadow, from the near map where it lies, else the wide one.
const SHADOW_LINE = "directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;";
const NEAR_SHADOW = /* glsl */ `{
		#if NUM_DIR_LIGHT_SHADOWS > 1 && UNROLLED_LOOP_INDEX == 1
		// (The near map's own light: no light, nor shadow, of its own.)
		#else
		float a2Shadow = 1.0;
		if ( directLight.visible && receiveShadow ) {
			float a2W = 0.0;
			#if NUM_DIR_LIGHT_SHADOWS > 1 && UNROLLED_LOOP_INDEX == 0
			vec3 a2Near = vDirectionalShadowCoord[ 1 ].xyz / vDirectionalShadowCoord[ 1 ].w;
			float a2Edge = min( min( a2Near.x, 1.0 - a2Near.x ), min( a2Near.y, 1.0 - a2Near.y ) );
			a2W = smoothstep( 0.0, ${(NEAR.fade * 0.5).toFixed(3)}, a2Edge ) * step( 0.0, a2Near.z ) * step( a2Near.z, 1.0 );
			#endif
			// The wide map only where the near one doesn't wholly cover the
			// spot: there its taps were taken and thrown away (mixed in by
			// nothing) - most of the ground in front of the camera.
			if ( a2W < 1.0 ) a2Shadow = getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] );
			#if NUM_DIR_LIGHT_SHADOWS > 1 && UNROLLED_LOOP_INDEX == 0
			if ( a2W > 0.0 ) a2Shadow = mix( a2Shadow, getShadow( directionalShadowMap[ 1 ], directionalLightShadows[ 1 ].shadowMapSize, directionalLightShadows[ 1 ].shadowIntensity, directionalLightShadows[ 1 ].shadowBias, directionalLightShadows[ 1 ].shadowRadius, vDirectionalShadowCoord[ 1 ] ), a2W );
			#endif
		}
		directLight.color *= a2Shadow;
		#endif
		}`;
// High's and Ultra's shadows soften the further above what casts them: sharp at a
// trunk's foot, by the ball, under the flag; soft from a crown high above
// (as the sun's own disc does). The map can only say whether a depth is
// shaded, not how deep what shades it is, so it asks twice over a wider
// patch: still shaded with the spot lifted 1.5 m towards the sun, and 6 m?
// The more of each, the further up the shade comes from, the wider the
// final blur - Ultra twelve taps, High eight (sim/nearshadow.mjs SOFT_TAPS),
// against three.js's plain five.
// range: the map's depth in metres (its camera's far - near).
const softShadow = ({ search, filter }) => /* glsl */ `
#if defined( SHADOWMAP_TYPE_PCF )
float a2SoftShadow( sampler2DShadow map, vec2 size, float intensity, float bias, float radius, vec4 coord, float range ) {
	coord.xyz /= coord.w;
	coord.z += bias;
	if ( !( coord.x >= 0.0 && coord.x <= 1.0 && coord.y >= 0.0 && coord.y <= 1.0 && coord.z <= 1.0 ) ) return 1.0;
	vec2 texel = vec2( 1.0 ) / size;
	float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
	float search = radius * 3.0 * texel.x;
	float up1 = 0.0;
	float up2 = 0.0;
	for ( int k = 0; k < ${search}; k ++ ) {
		vec2 o = vogelDiskSample( k, ${search}, phi ) * search;
		up1 += 1.0 - texture( map, vec3( coord.xy + o, coord.z - 1.5 / range ) );
		up2 += 1.0 - texture( map, vec3( coord.xy + o, coord.z - 6.0 / range ) );
	}
	float soft = clamp( 0.35 + 0.45 * up1 / ${search}.0 + 0.6 * up2 / ${search}.0, 0.35, 1.4 );
	float r = radius * soft * texel.x;
	float s = 0.0;
	for ( int k = 0; k < ${filter}; k ++ ) s += texture( map, vec3( coord.xy + vogelDiskSample( k, ${filter}, phi ) * r, coord.z ) );
	return mix( 1.0, s / ${filter}.0, intensity );
}
#else
float a2SoftShadow( sampler2D map, vec2 size, float intensity, float bias, float radius, vec4 coord, float range ) {
	return getShadow( map, size, intensity, bias, radius, coord );
}
#endif
`;
// The wide map's depth and the near map's, metres (environment.js's sun:
// 1 to 900; the near map's NEAR.depth).
const WIDE_RANGE = 899;
if (EXTRA) {
  const chunk = THREE.ShaderChunk.lights_fragment_begin;
  let near = NEAR_SHADOW;
  const taps = softTaps(LEVEL, PHONE);
  if (taps) {
    near = near
      .replace("if ( a2W < 1.0 ) a2Shadow = getShadow(", "if ( a2W < 1.0 ) a2Shadow = a2SoftShadow(")
      .replace("directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] );", `directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ], ${WIDE_RANGE.toFixed(1)} );`)
      .replace("a2Shadow = mix( a2Shadow, getShadow(", "a2Shadow = mix( a2Shadow, a2SoftShadow(")
      .replace("directionalLightShadows[ 1 ].shadowRadius, vDirectionalShadowCoord[ 1 ] ), a2W );", `directionalLightShadows[ 1 ].shadowRadius, vDirectionalShadowCoord[ 1 ], ${(NEAR.depth - 1).toFixed(1)} ), a2W );`);
    const pars = THREE.ShaderChunk.shadowmap_pars_fragment;
    const end = pars.lastIndexOf("#endif");
    if (near.split("a2SoftShadow(").length === 3 && end > 0) THREE.ShaderChunk.shadowmap_pars_fragment = pars.slice(0, end) + softShadow(taps) + pars.slice(end);
    else {
      console.warn("Soft shadows: three.js's shadows aren't as expected; High's instead.");
      near = NEAR_SHADOW;
    }
  }
  if (chunk.includes(SHADOW_LINE)) THREE.ShaderChunk.lights_fragment_begin = chunk.replace(SHADOW_LINE, near);
  else console.warn("Near shadows: three.js's lighting isn't as expected; the wide map only.");
}

// Shed by the safety valve: the near map stops following the camera and
// lies nowhere, so the wide map shows everywhere.
let shed = false;
const lights = new Set();
registerStep(1.5, "near shadows", (on) => {
  shed = on;
  for (const ref of lights) {
    const near = ref.deref();
    if (!near) {
      lights.delete(ref);
      continue;
    }
    near.userData.centre = null;
    if (on) park(near);
  }
}, { of: "high" });

// The near map's light for a scene, after its sun (on High; else null).
export function addNearShadow(scene, sun) {
  if (!EXTRA) return null;
  const near = new THREE.DirectionalLight(0xffffff, 0);
  near.castShadow = true;
  // (The phone's half the size each way: as sharp on its picture.)
  near.shadow.mapSize.set(NEAR.size / (PHONE ? 2 : 1), NEAR.size / (PHONE ? 2 : 1));
  near.shadow.bias = sun.shadow.bias;
  near.shadow.normalBias = 0.02;
  near.shadow.autoUpdate = false;
  near.userData.nearShadow = true;
  near.userData.sun = sun.userData.sun;
  near.userData.centre = null;
  const c = near.shadow.camera;
  c.left = c.bottom = -NEAR.span / 2;
  c.right = c.top = NEAR.span / 2;
  c.near = 1;
  c.far = NEAR.depth;
  c.updateProjectionMatrix();
  park(near);
  scene.add(near, near.target);
  lights.add(new WeakRef(near));
  return near;
}

// Off where it covers nothing (the wide map everywhere).
function park(near) {
  near.target.position.set(0, -1e5, 0);
  near.position.set(0, -1e5 + 1, 0);
  near.target.updateMatrixWorld();
  near.updateMatrixWorld();
}

const fwd = new THREE.Vector3();
// Once a frame before the shadow check: the scene's near map moved on to
// where the camera's looking, if it's gone far enough (not while `hold`:
// a ball in the air).
export function followNearShadow(scene, camera, { hold = false } = {}) {
  const near = scene.userData.env?.near;
  if (!near || shed || hold) return false;
  camera.getWorldDirection(fwd);
  const focus = nearFocus([camera.position.x, camera.position.y, camera.position.z], [fwd.x, fwd.y, fwd.z], NEAR.ahead);
  const at = nearCentre(focus, near.userData.centre, NEAR.move);
  if (!at) return false;
  near.userData.centre = at;
  // Its middle at the camera's height less a little (the ground about
  // there), the light back along the sun from it.
  const y = camera.position.y - 2;
  near.target.position.set(at[0], y, at[1]);
  near.position.set(at[0], y, at[1]).addScaledVector(near.userData.sun, NEAR.depth / 2);
  near.target.updateMatrixWorld();
  near.updateMatrixWorld();
  return true;
}
