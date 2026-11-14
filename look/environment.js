// Sky, sun, clouds, distant hills, haze, and the reflections they give shiny
// things (the ball, water) - and how each of them changes with the sky of
// the day (setSky; the numbers are sim/weather.mjs skyLook's).

import * as THREE from "three";
import { addNearShadow } from "./nearshadow.js";
import { Sky } from "three/addons/objects/Sky.js";
import { HIGH, LEVEL, ULTRA, PHONE } from "./quality.js";
import { loadSetting } from "../util.js";
import { effectsInUse } from "../sim/effects.mjs";
import { sunAt, hourOf, dayOn, USUAL_SUN } from "../sim/daylight.mjs";
import { duskFor, tint, DUSK_SHARE } from "../sim/dusk.mjs";
import { PALETTE } from "./palette.js";
import { makeHills } from "./backdrop.js";
import { makeClouds, skyClouds, layClouds, animateClouds, cloudReach, CLOUD_COUNTS } from "./clouds.js";
import { installHaze, hazeSkyChunk, hazeSkyUniform, HazeFog } from "./glsl/haze.js";
import { READABLE_HAZE } from "./weatherlook.js";
import { animateCloudShade, cloudUniforms } from "./glsl/cloudshade.js";
import { makeVolumeClouds, skyVolumeClouds } from "./volclouds.js";
import { makeMotes } from "./motes.js";
import { registerStep } from "./safety.js";
import { makeRain, animateRain } from "./rain.js";
import { skyLook, cleanSky, sunlight, skyExposure, MIN_SHADOW, MIST_HAZE, SUN_ELEVATION as SKY_SUN_ELEVATION } from "../sim/weather.mjs";
import { drawnWithNodes, nodeKit } from "./gpu.js";
import { markTwin } from "./twins.js";

// The golfer faces -z (world). An azimuth of 215 puts the sun ahead and to
// the left, part way up the sky: the view down the hole is lit from in
// front, so shadows run back towards the golfer, trees and flags show a
// bright rim, and the water catches glints of sun. (Behind the golfer's
// left shoulder would be about 325.)
// The Late-afternoon light switch (sim/effects.mjs evening), as this page
// was built: the sun lower (longer shadows, the sky warmer towards it), its
// light more golden, and round behind the golfer's left shoulder, lighting
// the hole from behind as the evening's broadcasts have it - not low in
// front, in the golfer's eyes, where its glare washed out the left of the
// picture. Its strength stays the day's (sim/weather.mjs), so the picture
// is no darker for it.
const BUILT_WITH = effectsInUse(loadSetting("effects", {}), LEVEL);
const EVENING = BUILT_WITH.evening;
export const EVENING_ELEVATION = 21;
// Or, with Time of day from the clock on, the sun where it is at this hour
// on today's day (sim/daylight.mjs sunAt, dayOn: never below a low golden
// light), in place of the evening's.
const CLOCK = BUILT_WITH.clock ? sunAt(hourOf(new Date()), dayOn(new Date())) : null;
// Rounds and the range their own (sim/daylight.mjs roundClock, holeSun:
// setSun at a round's start and each hole), the usual afternoon until
// then. The sun as it is now.
const sunNow = {
  elevation: CLOCK ? CLOCK.elevation : EVENING ? EVENING_ELEVATION : SKY_SUN_ELEVATION,
  azimuth: CLOCK ? CLOCK.azimuth : EVENING ? 305 : USUAL_SUN.azimuth,
  colour: CLOCK ? CLOCK.colour : EVENING ? 0xffd6a3 : USUAL_SUN.colour,
};
// The sun's and the sky's strength: harder sunlight (sim/weather.mjs
// HARD_SUN - the sun stronger, the sky's fill weaker, shade under a third
// of the sun rather than over half; the sky's cut eased the lower the sun
// stands, so a round at dusk isn't dark) with its switch on; the cloud
// shade (look/glsl/cloudshade.js SUN_SHARE) takes the same at the usual
// height.
let LIGHT = sunlight({ hard: BUILT_WITH.hardsun, elevation: sunNow.elevation });

export function sunDirection(elevation = sunNow.elevation, azimuth = sunNow.azimuth) {
  return new THREE.Vector3().setFromSphericalCoords(
    1,
    THREE.MathUtils.degToRad(90 - elevation),
    THREE.MathUtils.degToRad(azimuth),
  );
}

// The direction to the sun now, one vector moved where the sun goes (the
// flag's and the windsock's painted shadows, the club's: scenery.js,
// look/windsock.js, look/club.js).
export const SUN_DIR = sunDirection();

// The sun for a round's hole or the range (sim/daylight.mjs holeSun,
// sunFor: the time of day picked with the sky - any, one of its own, or the
// clock's - where the round's clock has got to): every scene's light (its direction, colour and strength:
// harder or not, by the sun's height), its sky (where the sun is, how
// bright the sky is for it), its clouds lit from it, the ball's and the
// near shadows' direction, all moved without a reload; the sky's
// reflection is baked again by the next setSky (a round's start calls it
// straight after). (The haze's warmer side, a touch - 5% - stays where the
// page was built with it.) Before any round, and on the practice greens
// and in the Challenges, Time of day from the clock's or Late-afternoon
// light's sun, as the page was built.
export function setSun({ elevation, azimuth, colour }) {
  if (elevation === sunNow.elevation && azimuth === sunNow.azimuth && colour === sunNow.colour) return;
  Object.assign(sunNow, { elevation, azimuth, colour });
  LIGHT = sunlight({ hard: BUILT_WITH.hardsun, elevation });
  SUN_DIR.copy(sunDirection());
  for (const env of envs) {
    env.light.color.setHex(colour);
    env.light.userData.sun.copy(SUN_DIR);
    env.light.position.copy(env.light.target.position).addScaledVector(SUN_DIR, 300);
    const look = env.look ?? skyLook(env.kind);
    env.light.intensity = LIGHT.sun * look.sun;
    env.fill.intensity = LIGHT.sky * look.skyLight;
    const u = env.sky.material.uniforms;
    u.sunPosition.value.copy(SUN_DIR);
    if (u.skyExposure) u.skyExposure.value = skyExposure(elevation);
    if (env.clouds) env.clouds.material.uniforms.uSun.value.copy(SUN_DIR);
    if (env.volume) env.volume.material.uniforms.vSun.value.copy(SUN_DIR);
    if (env.motes) env.motes.material.uniforms.mSun.value.copy(SUN_DIR);
    // Dawn and dusk on its sky, haze and clouds (applyDusk).
    applyDusk(env);
    // (Its reflection baked again by the next setSky, or useSun as it
    // comes on show: bakedSun.)
  }
}

// Dawn and dusk (sim/dusk.mjs duskFor): as the sun gets low, the sky's
// horizon on its side warms and the far side turns pink and mauve
// (duskSky), the haze warms (its colour: hazeColour), and the clouds'
// tops turn peach and their bases mauve-grey - less of it under a grey
// sky. Moved with the sun (setSun), the day's sky (setSky) and the mist
// (animateSky).
const CLOUD_TOP = new THREE.Color(PALETTE.cloud);
// The sky's fill light's colour (addEnvironment).
const SKY_FILL = 0xd8ecff;
const CLOUD_SHADE = new THREE.Color(PALETTE.cloudShade);
const CLOUD_SLATE = new THREE.Color(PALETTE.cloudSlate);
const duskColour = new THREE.Color();
function applyDusk(env) {
  const grey = env.look?.grey ?? 0;
  const dusk = duskFor(sunNow, grey);
  env.dusk = dusk;
  // The sunlight and the sky's light a little weaker as the day ends, the
  // sky's warmer (its blue gone from the shade).
  const look = env.look ?? skyLook(env.kind);
  env.light.intensity = LIGHT.sun * look.sun * (1 - DUSK_SHARE.dimSun * dusk.k);
  env.fill.intensity = LIGHT.sky * look.skyLight * (1 - DUSK_SHARE.dimSky * dusk.k);
  env.fill.color.set(SKY_FILL).lerp(duskColour.setHex(dusk.colours.fill), dusk.k * DUSK_SHARE.fill);
  const u = env.sky.material.uniforms;
  if (u.duskK) {
    u.duskK.value = dusk.k;
    u.duskGlow.value.fromArray(tint(dusk.colours.glow));
    u.duskMid.value.fromArray(tint(dusk.colours.mid));
    u.duskFar.value.fromArray(tint(dusk.colours.far));
  }
  hazeColour(env);
  const clouds = dusk.k * DUSK_SHARE.clouds;
  const top = (c) => c.copy(CLOUD_TOP).lerp(duskColour.setHex(dusk.colours.top), clouds);
  const base = (c) => c.copy(CLOUD_SHADE).lerp(CLOUD_SLATE, grey * 0.8).lerp(duskColour.setHex(dusk.colours.base), clouds);
  if (env.clouds) {
    top(env.clouds.material.uniforms.uTop.value);
    base(env.clouds.material.uniforms.uBase.value);
  }
  if (env.volume) {
    const v = env.volume.material.uniforms;
    top(v.vTop.value);
    base(v.vBase.value);
    v.vHaze.value.copy(env.fog.color);
  }
}
// A scene's haze colour: the palette's, paler in mist, warmer at dawn and
// dusk (the hills and far trees fade into it, and the sky's lowest band).
function hazeColour(env) {
  env.fog.color.set(PALETTE.fog).lerp(MIST_COLOUR, env.mist ?? 0);
  if (env.dusk?.k > 0) env.fog.color.lerp(duskColour.setHex(env.dusk.colours.haze), env.dusk.k * DUSK_SHARE.haze);
}

// The sun the page was built with: Time of day from the clock's,
// Late-afternoon light's, or the usual afternoon - the practice greens'
// and the Challenges' (they pick none of their own).
export const BASE_SUN = Object.freeze({ ...sunNow });
const sunKey = () => `${sunNow.elevation}|${sunNow.azimuth}|${sunNow.colour}`;

// A mode coming on show in its own light (app.js setMode): the sun moved
// there, and its scene's sky reflection baked again if it was baked under
// another - only the scene on show, as it's shown.
export function useSun(scene, sun = BASE_SUN) {
  setSun(sun ?? BASE_SUN);
  const env = scene?.userData.env;
  if (env && env.bakedSun !== sunKey()) rebake(env);
}
// The sun as it is now (for the tests and the tools).
export const sunState = () => ({ ...sunNow });

// The haze's own fog chunk, in before any program is compiled.
installHaze(sunDirection());

// Every scene's sky, sun and haze (addEnvironment), for animateSky.
const envs = new Set();
// The fair sky's reflection, shared by every scene until its own sky
// changes (setSky), by renderer.
const fairBakes = new WeakMap();

// Adds sky, light and haze to a scene. Returns the sun light; once the scene
// is built, fitShadows() sizes its shadow to cover everything.
export function addEnvironment(scene, renderer, { haze = 0.00105, hills = true, clouds = true, rain = true, shadowSize = 80 } = {}) {
  const sun = sunDirection();

  const sky = new Sky();
  sky.scale.setScalar(20000);
  // (Each change below is made at a line of three.js's own sky shader: one
  // it no longer has would leave that change out without a word - said.)
  for (const a of missingSkyAnchors(sky.material.fragmentShader)) console.warn(`The sky: three.js's sky shader has no "${a.slice(0, 60)}" - what's changed there is left out.`);
  dimSunDisc(sky.material);
  driftingClouds(sky.material);
  cirrusStreaks(sky.material);
  greyingSky(sky.material);
  duskSky(sky.material);
  skyExposed(sky.material, skyExposure(sunNow.elevation));
  hazyHorizon(sky.material, sun);
  // Drawn after everything solid, so only where nothing's in front of it
  // (sim/draworder.mjs).
  sky.material.userData.drawLast = true;
  const u = sky.material.uniforms;
  u.turbidity.value = 3.2;
  u.rayleigh.value = 1.1;
  // The glow round the sun: a little less of it, and closer in, so the
  // sky ahead of a high sun is a pale blue rather than white.
  u.mieCoefficient.value = SUN_GLOW.amount;
  u.mieDirectionalG.value = SUN_GLOW.closeness;
  u.sunPosition.value.copy(sun);
  // Its node version on WebGPURenderer (look/glsl/skynode.js): the same
  // sums, reading these uniforms.
  markTwin(sky.material, "sky", { uniforms: u, sun: sun.clone().normalize(), disc: SUN_DISC / (760 * 80) });

  // Reflections of this sky, for the shiny things only (see applyReflections):
  // as scene.environment it would also lighten every matte surface. Every
  // scene starts under the same fair sky, so it's baked once and shared:
  // baking it for each of the five scenes held the load up for nothing.
  if (!fairBakes.has(renderer)) fairBakes.set(renderer, bakeSky(renderer, sky));
  scene.userData.envMap = fairBakes.get(renderer);
  scene.add(sky);

  // Haze: the far trees and hills fade into a soft blue-grey past a few
  // hundred metres, as they do on a summer morning, so the hole stands out
  // from the country round it and nothing ends at a fog wall; thinner
  // higher up, warmer towards the sun (look/glsl/haze.js). The sky's lowest
  // band fades into the same colour.
  scene.fog = new HazeFog(PALETTE.fog, haze);
  sky.material.uniforms.hazeColor.value = scene.fog.color;
  // (On WebGPURenderer, the same haze as the scene's fog node.)
  nodeKit()?.hazeScene(scene);

  // A strong, soft fill from the sky (and a little olive bounce from the
  // grass): shade is never black, and trunks read as brown, not holes.
  const fill = new THREE.HemisphereLight(SKY_FILL, 0x6b7550, LIGHT.sky);
  scene.add(fill);
  const light = new THREE.DirectionalLight(sunNow.colour, LIGHT.sun);
  light.position.copy(sun).multiplyScalar(300);
  light.castShadow = true;
  // (Ultra's half as big again: sharper shadows over the whole hole. The
  // phone's half the size each way: as sharp on its picture - PHONE.)
  const size = (ULTRA ? 6144 : HIGH ? 4096 : 2048) / (PHONE ? 2 : 1);
  light.shadow.mapSize.set(size, size);
  light.shadow.bias = -0.0004;
  light.shadow.normalBias = 0.02;
  const c = light.shadow.camera;
  c.left = -shadowSize;
  c.right = shadowSize;
  c.top = shadowSize;
  c.bottom = -shadowSize;
  c.near = 1;
  c.far = 900;
  scene.add(light, light.target);
  light.userData.sun = sun.clone();
  // On High, a sharper map of the sun's shadows round where the camera's
  // looking, over the wide one (look/nearshadow.js); the wide map is then
  // drawn only when asked (look/shadowwatch.js).
  const near = addNearShadow(scene, light);
  if (near) light.shadow.autoUpdate = false;

  if (hills) scene.add(makeHills());
  const cloudMesh = clouds ? makeClouds({ ...CLOUD_COUNTS[HIGH ? "high" : "standard"], sun, seed: 1 }) : null;
  if (cloudMesh) scene.add(cloudMesh);
  // On Ultra, clouds in three dimensions in their place (look/volclouds.js),
  // the puffs back if the safety valve sheds them. Not on the phone: each
  // pixel's steps start at its own random point along the line, smoothed
  // away only on a picture as fine as a PC's - on the phone's smaller one
  // (sim/phonepicture.mjs), stepped smaller still when it's slow, they
  // showed as speckle all over every cloud (the owner, 1 November 2026:
  // "horrible clouds still... fine on pc"), and they were the heaviest
  // thing Ultra drew there. The puffs, as on High.
  const volume = clouds && ULTRA && !PHONE ? makeVolumeClouds(sun) : null;
  if (volume) {
    scene.add(volume);
    volumes.add(volume);
    if (cloudMesh) cloudMesh.visible = volumeShed;
    volume.visible = !volumeShed;
    volume.userData.puffs = cloudMesh;
  }
  // What setSky changes, kept with the scene. A fair day to begin with.
  // Rain, hidden until it rains (look/rain.js; look/weatherlook.js rain).
  if (rain) scene.add(makeRain());
  // On Ultra, pollen and dust in the sunlight (look/motes.js).
  const motes = ULTRA && clouds ? makeMotes(sun) : null;
  if (motes) scene.add(motes);
  const env = { scene, renderer, sky, light, near, fill, clouds: cloudMesh, volume, motes, fog: scene.fog, kind: "fair", seed: 1, bakedSun: sunKey() };
  scene.userData.env = env;
  envs.add(env);
  skyVeil(sky.material, skyLook("fair"));
  if (cloudMesh) skyClouds(cloudMesh, skyLook("fair"));
  if (volume) skyVolumeClouds(volume, skyLook("fair"));
  applyDusk(env);
  return { light, sun };
}

// Ultra's 3D clouds, every scene's: shed by the safety valve, the puffs
// come back in their place (and the ground's cloud shadows go back to
// where they always were).
const volumes = new Set();
let volumeShed = false;
if (ULTRA) {
  registerStep(0.75, "3D clouds", (on) => {
    volumeShed = on;
    for (const v of volumes) {
      v.visible = !on;
      if (v.userData.puffs) v.userData.puffs.visible = on;
    }
    if (on) cloudUniforms.csLo.value = 0.5;
  }, { of: "ultra" });
}

// One baker for each renderer, kept: its blur shader is built as it's
// made, and letting it go (dispose) threw that shader away - every new sky
// (a round's weather, each of the speed test's settings) built it again
// there and then, the picture stopped while the graphics card did (the
// owner: "freezes where the webcams would pause").
const bakers = new WeakMap();
function bakerFor(renderer) {
  if (!bakers.has(renderer)) bakers.set(renderer, new THREE.PMREMGenerator(renderer));
  return bakers.get(renderer);
}

// The sky's reflection, baked (a PMREM of the sky alone).
function bakeSky(renderer, sky) {
  // (On WebGPURenderer, its own baker: look/nodetwins.js.)
  const pmrem = drawnWithNodes() ? nodeKit()?.skyBaker(renderer) : bakerFor(renderer);
  if (!pmrem) return null;
  // (Baking: the horizon's band keeps the sky's own brightness - see
  // hazyHorizon.)
  sky.material.uniforms.skyBaking.value = 1;
  const skyScene = new THREE.Scene();
  const parent = sky.parent;
  skyScene.add(sky);
  // (Its render target kept with it: that's what's freed when the sky's
  // baked again - freeing the texture alone left the target's buffers.)
  const target = pmrem.fromScene(skyScene);
  const texture = target.texture;
  if (typeof target.dispose === "function") texture.userData.bakedTarget = target;
  parent?.add(sky);
  sky.material.uniforms.skyBaking.value = 0;
  return texture;
}

// Gives a scene the day's sky (sim/weather.mjs SKY_KINDS): the one sun
// weaker under cloud and the sky's fill stronger, so the picture loses
// contrast rather than brightness; shadows softer and fainter, never below
// MIN_SHADOW; the blue greyed towards an overcast. Called when a round
// starts (course.js) or the range's sky is changed - never during play,
// since it bakes the sky's reflection again. The practice greens and the
// Challenges never call it: they're always fair.
// seed: the round's, so its clouds are laid out the same way in a replay.
export function setSky(scene, kind, seed = null) {
  const env = scene?.userData.env;
  if (!env) return;
  kind = cleanSky(kind);
  if (Number.isFinite(seed) && seed !== env.seed) {
    env.seed = seed;
    if (env.clouds) layClouds(env.clouds, seed);
  }
  // The day's own cloud (sim/weather.mjs skyCover: from the seed, the
  // round's - none at all to plenty), so the same sky with another seed is
  // drawn again too.
  const look = skyLook(kind, env.seed);
  const key = `${kind}|${look.cover}|${look.veil}|${look.cirrus}`;
  if (env.lookKey === key && env.bakedSun === sunKey()) return;
  env.kind = kind;
  env.lookKey = key;
  env.look = look;
  env.light.intensity = LIGHT.sun * look.sun;
  env.fill.intensity = LIGHT.sky * look.skyLight;
  env.light.shadow.intensity = Math.max(MIN_SHADOW, look.shadow);
  env.light.shadow.radius = look.softness;
  // The near map's the same, its finer pixels blurred a little more for
  // the same softness under cloud.
  if (env.near) {
    env.near.shadow.intensity = env.light.shadow.intensity;
    env.near.shadow.radius = look.softness * 1.5;
  }
  env.sky.material.uniforms.skyGrey.value = look.grey;
  skyVeil(env.sky.material, look);
  // The round's own high cirrus (sim/weather.mjs skyLook cirrus), with the
  // Detailed sky switch on.
  env.sky.material.userData.cirrusK = look.cirrus ?? 1;
  env.sky.material.uniforms.cirrus.value = cirrusOn ? CIRRUS * env.sky.material.userData.cirrusK : 0;
  if (env.clouds) skyClouds(env.clouds, look);
  if (env.volume) skyVolumeClouds(env.volume, look);
  applyDusk(env);
  rebake(env);
}

// The reflection of a scene's sky now, on everything shiny that had the
// old: baked under the sun as it is (bakedSun).
function rebake(env) {
  const { scene } = env;
  const old = scene.userData.envMap;
  const next = bakeSky(env.renderer, env.sky);
  scene.userData.envMap = next;
  scene.traverse((o) => {
    for (const m of [o.material].flat()) if (m && m.envMap === old) m.envMap = next;
  });
  // (Not the shared fair one: the other scenes still show it.)
  if (old && old !== fairBakes.get(env.renderer)) (old.userData?.bakedTarget ?? old).dispose();
  env.bakes = (env.bakes ?? 0) + 1;
  env.bakedSun = sunKey();
}

// The sun's own disc, dimmed. three.js's sky draws it at 760 times its
// brightest glare (sundiscColor: vSunE * Fex held to 80 - some 60,000 in the
// picture's units, where white in full sun is about 2.8). Tone mapped, the
// sky's disc is white either way; but everything shiny reflects this sky
// (the ball, the range balls, a pond: applyReflections' baked envMap), and
// a glint of a disc that bright was thousands of times white in full sun -
// through the bloom (look/effects.js) a hard white blob, flashing as the
// ball turned its dimples to the sun or a pond rippled; blurred into the
// far distance, a disc three times its size; in Ultra's bounce light, a
// white blob round every tree near the sun (the owner, 16 October 2026:
// "we keep getting white blobs ... flashing on screen"). SUN_DISC is its
// brightness now: many times anything else in the sky, so still the sun,
// and its glints bloom softly.
export const SUN_DISC = 100;

// The lines of three.js's sky shader (three/addons/objects/Sky.js) that
// the sky's changes are made at (dimSunDisc, driftingClouds,
// cirrusStreaks, greyingSky, duskSky, skyExposed, hazyHorizon) - and which
// of them a shader doesn't have (test/skyanchors.test.mjs holds the
// installed three.js to them).
export const SKY_ANCHORS = [
  "uniform float time;",
  "#include <colorspace_fragment>",
  "vec3 sundiscColor = ( 760.0 * sundisc ) * min( vSunE * Fex, 80.0 );",
  "vec3 texColor = ( Lin + L0 ) * 0.04 + sundiscColor + vec3( 0.0, 0.0003, 0.00075 );",
  "gl_FragColor = vec4( texColor, 1.0 );",
  "cloudUV += time * cloudSpeed;",
];
export const missingSkyAnchors = (src) => SKY_ANCHORS.filter((a) => !String(src ?? "").includes(a));
// (The line as three.js has it, scaled: where the sun is low its disc
// dims and reddens as it did.)
const DISC_LINE = "vec3 sundiscColor = ( 760.0 * sundisc ) * min( vSunE * Fex, 80.0 );";
function dimSunDisc(material) {
  if (!material.fragmentShader.includes(DISC_LINE)) {
    console.warn("The sun's disc: three.js's sky isn't as expected; drawn as it has it.");
    return;
  }
  material.fragmentShader = material.fragmentShader.replace(DISC_LINE, `vec3 sundiscColor = ( 760.0 * sundisc ) * min( vSunE * Fex, 80.0 ) * ${(SUN_DISC / (760 * 80)).toExponential(4)};`);
}

// The sky shader's own noise clouds: only a thin, high veil now (the
// clouds proper are look/clouds.js), thicker the more cloud there is.
function skyVeil(material, look) {
  const u = material.uniforms;
  u.cloudCoverage.value = look.veil;
  u.cloudDensity.value = 0.12 + 0.1 * look.veil;
  u.cloudElevation.value = 0.8;
}

// The sky's lowest band blended into the haze's colour, by the haze's own
// rule (look/glsl/haze.js), so the hills fade into the horizon instead of
// sitting as a grey band under a near-white sky. hazeBand: how high it
// reaches (a sine of the angle up), more on a hazier day.
function hazyHorizon(material, sun) {
  material.uniforms.hazeColor = { value: new THREE.Color(PALETTE.fog) };
  material.uniforms.hazeBand = { value: 0.07 };
  material.uniforms.skyBaking = { value: 0 };
  material.uniforms.hazeSunDir = hazeSkyUniform(sun);
  material.fragmentShader = material.fragmentShader
    .replace("uniform float time;", `uniform float time;\nuniform vec3 hazeColor;\nuniform float hazeBand;\nuniform float skyBaking;\n${hazeSkyChunk()}`)
    .replace(
      "#include <colorspace_fragment>",
      `#include <colorspace_fragment>
			float hazeLow = 1.0 - smoothstep( -0.02, hazeBand, direction.y );
			vec3 hazeSky = hazeTint( hazeColor, direction );
			#ifndef TONE_MAPPING
				// Baking the reflection (not tone mapped): the sky is far brighter
				// than the haze colour, so the band keeps the sky's own brightness,
				// or everything shiny would reflect a dark horizon. (Not drawing
				// the picture into the effects' buffer - not tone mapped either,
				// but tone mapped afterwards, as the screen is: look/effects.js.)
				if ( skyBaking > 0.5 ) {
					vec3 hazeW = vec3( 0.2126, 0.7152, 0.0722 );
					hazeSky *= max( 1.0, dot( gl_FragColor.rgb, hazeW ) / max( 1e-4, dot( hazeSky, hazeW ) ) );
				}
			#endif
			gl_FragColor.rgb = mix( gl_FragColor.rgb, hazeSky, hazeLow * hazeLow * ( 3.0 - 2.0 * hazeLow ) );`,
    );
}

// The Detailed sky switch (sim/effects.mjs sky): high cirrus - long, thin
// streaks brushed out one way, far above the cumulus, in patches with
// clear sky between - drawn by the sky's own noise (no texture), drifting
// with the veil a little slower, lit by the sky and the sun as the veil
// is, fading out towards the horizon. setCirrus turns them on and off.
const CIRRUS = 0.38;
let cirrusOn = BUILT_WITH.sky;
function cirrusStreaks(material) {
  material.uniforms.cirrus = { value: cirrusOn ? CIRRUS : 0 };
  material.fragmentShader = material.fragmentShader.replace("uniform float time;", "uniform float time;\nuniform float cirrus;").replace(
    "gl_FragColor = vec4( texColor, 1.0 );",
    `if ( cirrus > 0.0 && direction.y > 0.0 ) {
				vec2 cu = direction.xz / max( direction.y, 0.02 ) * 0.45 - cloudDrift * 600.0;
				// Turned to the streaks' way, then stretched along it.
				vec2 r = mat2( 0.94, 0.34, -0.34, 0.94 ) * cu;
				float n = noise( r * vec2( 0.35, 5.0 ) ) * 0.55 + noise( r * vec2( 0.8, 13.0 ) + 3.1 ) * 0.3 + noise( r * vec2( 0.15, 1.6 ) + 7.7 ) * 0.4;
				float cpatch = smoothstep( 0.42, 0.72, noise( cu * 0.09 + 1.3 ) * 0.6 + 0.5 );
				float streak = smoothstep( 0.52, 0.86, n * 0.5 + 0.5 ) * cpatch;
				streak *= smoothstep( 0.015, 0.2, direction.y );
				vec3 lit = Lin * 0.04 + vSunE * Fex * 0.22 * 0.04 * 1.1 + vec3( 0.0, 0.0003, 0.00075 );
				texColor = mix( texColor, mix( texColor, lit, Fex ), streak * cirrus );
			}
			gl_FragColor = vec4( texColor, 1.0 );`,
  );
}
export function setCirrus(on) {
  cirrusOn = !!on;
  for (const m of skies) m.uniforms.cirrus.value = on ? CIRRUS * (m.userData.cirrusK ?? 1) : 0;
}

// The sky's light at this sun's height (sim/weather.mjs skyExposure): a
// deeper blue the higher the sun, not washed pale. Only the sky's own
// light - not the sun's disc, nor the veil and cirrus drawn over it, which
// keep theirs - and less of it the greyer the sky, so an overcast one
// stays a light grey.
const SKY_LINE = "vec3 texColor = ( Lin + L0 ) * 0.04 + sundiscColor + vec3( 0.0, 0.0003, 0.00075 );";
function skyExposed(material, exposure) {
  material.uniforms.skyExposure = { value: exposure };
  if (!material.fragmentShader.includes(SKY_LINE)) {
    console.warn("The sky's exposure: three.js's sky isn't as expected; drawn as it has it.");
    return;
  }
  material.fragmentShader = material.fragmentShader
    .replace("uniform float time;", "uniform float time;\nuniform float skyExposure;")
    .replace(SKY_LINE, "vec3 texColor = ( ( Lin + L0 ) * 0.04 + vec3( 0.0, 0.0003, 0.00075 ) ) * mix( skyExposure, 1.0, skyGrey ) + sundiscColor;");
}
// three.js's mieCoefficient and mieDirectionalG: how much glow round the
// sun, and how close in.
export const SUN_GLOW = { amount: 0.0015, closeness: 0.9 };

// The sky greyed towards an overcast one: its colour drawn towards its own
// brightness (a little lifted, so a grey sky is a light one), by skyGrey.
function greyingSky(material) {
  material.uniforms.skyGrey = { value: 0 };
  material.fragmentShader = material.fragmentShader
    .replace("uniform float time;", "uniform float time;\nuniform float skyGrey;")
    .replace(
      "gl_FragColor = vec4( texColor, 1.0 );",
      `float skyLum = dot( texColor, vec3( 0.2126, 0.7152, 0.0722 ) );
			texColor = mix( texColor, vec3( 0.93, 0.96, 1.0 ) * ( skyLum * 0.8 + 0.12 ), skyGrey );
			gl_FragColor = vec4( texColor, 1.0 );`,
    );
}

// Dawn and dusk in the sky (applyDusk; sim/dusk.mjs): low down, the
// horizon takes duskGlow on the sun's side and duskFar on the other (each a
// tint at the sky's own brightness, a little brighter towards the sun),
// overhead a touch deeper, and a warm glow round the sun - by duskK (0 by
// day). After the greying: an overcast evening takes less (duskFor).
// (The node version: look/glsl/skynode.js, the same sums.)
export const DUSK_GLSL = /* glsl */ `
			if ( duskK > 0.0 ) {
				vec2 dFlat = normalize( direction.xz + vec2( 1e-5 ) );
				vec2 sFlat = normalize( vSunDirection.xz + vec2( 1e-5 ) );
				float dSide = dot( dFlat, sFlat ) * 0.5 + 0.5;
				float dWarm = dSide * dSide;
				float dLow = 1.0 - smoothstep( 0.0, 0.5, max( direction.y, 0.0 ) );
				float dLum = dot( texColor, vec3( 0.2126, 0.7152, 0.0722 ) );
				vec3 dTint = mix( duskFar, duskGlow, dWarm );
				// Higher up, into the blue: a pale gold on the sun's side, the far
				// side's colour paler on the other (not through grey).
				dTint = mix( mix( mix( vec3( 1.0 ), duskFar, 0.4 ), duskMid, dWarm ), dTint, dLow * dLow );
				vec3 dBand = dTint * dLum * ( 0.95 + 0.3 * dWarm * dSide );
				texColor = mix( texColor, dBand, duskK * pow( dLow, 1.5 ) * mix( 0.7, 1.0, dWarm ) * ${DUSK_SHARE.band.toFixed(3)} );
				texColor *= 1.0 - duskK * ${DUSK_SHARE.deepen.toFixed(3)} * ( 1.0 - dLow );
				// Round the sun, its glow turned gold.
				float dNear = pow( max( dot( direction, vSunDirection ), 0.0 ), 8.0 );
				texColor = mix( texColor, duskGlow * dLum, dNear * duskK * ${DUSK_SHARE.glow.toFixed(3)} );
			}
			gl_FragColor = vec4( texColor, 1.0 );`;
function duskSky(material) {
  material.uniforms.duskK = { value: 0 };
  material.uniforms.duskGlow = { value: new THREE.Vector3(1, 1, 1) };
  material.uniforms.duskMid = { value: new THREE.Vector3(1, 1, 1) };
  material.uniforms.duskFar = { value: new THREE.Vector3(1, 1, 1) };
  material.fragmentShader = material.fragmentShader
    .replace("uniform float time;", "uniform float time;\nuniform float duskK;\nuniform vec3 duskGlow;\nuniform vec3 duskMid;\nuniform vec3 duskFar;")
    .replace("gl_FragColor = vec4( texColor, 1.0 );", DUSK_GLSL.trimStart());
}

// ---- The clouds drift with the wind -------------------------------------------------------

// Every sky's shader, wound on by animateSky (once a frame, from
// animateScenery); the clouds are look/clouds.js's.
const skies = new Set();

// The sky's own noise clouds were drawn but frozen (its clock stood at 0),
// and would only have drifted one fixed way. They drift downwind now, by
// an offset wound on each frame (cloudDrift, in the shader's own cloud
// units), and billow slowly on their clock.
function driftingClouds(material) {
  material.uniforms.cloudDrift = { value: new THREE.Vector2() };
  material.fragmentShader = material.fragmentShader
    .replace("uniform float time;", "uniform float time;\nuniform vec2 cloudDrift;")
    .replace("cloudUV += time * cloudSpeed;", "cloudUV -= cloudDrift;");
  skies.add(material);
}

// How fast the noise veil drifts, in the sky shader's cloud units a
// second per mph of wind (and a little in a calm, as high cloud moves when
// the air on the ground is still): it crosses its own width in about a
// minute in a 10 mph wind.
const SKY_DRIFT = 1.6e-6;
// The clouds move at the wind's own speed, metres a second a mph (they're
// kilometres off, so it reads as a slow drift).
const CLOUD_DRIFT = 0.447;

const MIST_COLOUR = new THREE.Color(PALETTE.mist);

let lastSky = null;
// time: seconds; weather: look/weatherlook.js's values.
export function animateSky(time, weather) {
  const dt = lastSky === null ? 0 : Math.min(0.25, Math.max(0, time - lastSky));
  lastSky = time;
  const still = !weather || weather.still;
  const mph = still ? 0 : weather.gusting;
  const [dx, dz] = still ? [1, 0] : weather.dir;
  const sky = SKY_DRIFT * (mph + 1) * dt;
  // The day's haze on every scene (only the one on show is drawn), and
  // the sky's low band deeper into it on a hazier day. A misty morning's is
  // paler, and its far clouds are lost in it; as it lifts (sim/weather.mjs
  // hazeFor) the colour goes back with the thickness.
  const haze = weather?.haze ?? 1;
  const mist = weather?.sky === "mist" ? Math.min(1, Math.max(0, (haze - 1) / (MIST_HAZE - 1))) : 0;
  for (const env of envs) {
    env.fog.setHaze(haze, READABLE_HAZE);
    if (mist !== env.mist) {
      env.mist = mist;
      hazeColour(env);
      if (env.volume) env.volume.material.uniforms.vHaze.value.copy(env.fog.color);
    }
    env.sky.material.uniforms.hazeBand.value = 0.07 * Math.min(2.5, Math.sqrt(haze));
    if (env.clouds) env.clouds.material.uniforms.uReach.value = cloudReach(haze);
    if (env.volume) env.volume.material.uniforms.vReach.value = cloudReach(haze);
  }
  for (const m of skies) {
    m.uniforms.time.value = time;
    m.uniforms.cloudDrift.value.x += dx * sky;
    m.uniforms.cloudDrift.value.y += dz * sky;
  }
  animateRain(time, weather);
  // The clouds, and their shadows on the ground in step with them (none in
  // still air: the practice greens and the Challenges).
  const step = still ? 0 : CLOUD_DRIFT * mph * dt;
  animateCloudShade(step, [dx, dz], still ? 0 : weather.cloudShadow ?? 0);
  if (step > 0) animateClouds(step, [dx, dz]);
}

// Gives the sky's reflection to the standard (shiny) materials under root.
export function applyReflections(scene, root = scene) {
  root.traverse((o) => {
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of mats) {
      if (m.isMeshStandardMaterial && !m.envMap) {
        m.envMap = scene.userData.envMap;
        m.needsUpdate = true;
      }
    }
  });
}

// Sizes the sun's shadow to cover everything under root that casts one -
// every tree, flag and sign - so shadows are always there wherever the
// camera goes, and never switch on and off or change sharpness as it moves.
// One fixed map, not one that follows the ball: some detail is traded for
// that, which is why the ball has its own shadow (BallShadow). Call it
// whenever the scene is (re)built.
export function fitShadows(light, root, margin = 30) {
  const box = new THREE.Box3();
  const part = new THREE.Box3();
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!o.castShadow) return;
    if (o.isInstancedMesh || o.isBatchedMesh) {
      // (Every instance a batch holds, shown or not: a far tree shown later
      // must be inside the map too.)
      if (o.isInstancedMesh ? o.count === 0 : !o.instanceCount) return;
      o.computeBoundingBox();
      if (o.boundingBox.isEmpty()) return;
      part.copy(o.boundingBox);
    } else if (o.geometry) {
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      part.copy(o.geometry.boundingBox);
    } else return;
    box.union(part.applyMatrix4(o.matrixWorld));
  });
  if (box.isEmpty()) return;
  // Down to the ground, and out far enough for the longest shadows to land.
  box.min.y = Math.min(box.min.y, 0) - 1;
  box.min.x -= margin;
  box.min.z -= margin;
  box.max.x += margin;
  box.max.z += margin;

  const centre = box.getCenter(new THREE.Vector3());
  const reach = box.getSize(new THREE.Vector3()).length() / 2 + 20;
  light.target.position.copy(centre);
  light.position.copy(centre).addScaledVector(light.userData.sun, reach);
  light.target.updateMatrixWorld();
  light.updateMatrixWorld();

  // The box's corners as the sun sees them give the shadow camera's extent.
  const cam = light.shadow.camera;
  cam.position.copy(light.position);
  cam.lookAt(centre);
  cam.updateMatrixWorld();
  const toLight = cam.matrixWorld.clone().invert();
  const lo = new THREE.Vector3(Infinity, Infinity, Infinity);
  const hi = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
  const p = new THREE.Vector3();
  for (let i = 0; i < 8; i++) {
    p.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).applyMatrix4(toLight);
    lo.min(p);
    hi.max(p);
  }
  cam.left = lo.x;
  cam.right = hi.x;
  cam.bottom = lo.y;
  cam.top = hi.y;
  cam.near = Math.max(0.5, -hi.z - 1);
  cam.far = -lo.z + 1;
  cam.updateProjectionMatrix();
  // Offset against acne in step with the texel size, which is bigger now.
  const texel = Math.max(hi.x - lo.x, hi.y - lo.y) / light.shadow.mapSize.x;
  light.shadow.normalBias = Math.max(0.02, texel * 0.7);
  light.shadow.needsUpdate = true;
  return { texel, box };
}
