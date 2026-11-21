// The sky as a node material, for WebGPURenderer (look/nodetwins.js): three's
// sky shader (three/addons/objects/Sky.js) with the game's own changes to it
// (look/environment.js) - the dimmer sun disc, the light at the sun's height,
// the veil drifting downwind, the cirrus, the greying, dawn and dusk and the
// hazy horizon -
// the same sums, reading the WebGL sky material's own uniforms, so whatever
// moves them (animateSky, setCirrus, the weather) moves this too.
//
// The WebGL sky is tone mapped and turned to the screen's colours in its own
// shader, and its horizon band mixed in after that. WebGPURenderer tone maps
// the whole picture afterwards, every material alike; so the band is mixed
// in the screen's colours here too, and the colour drawn is the one that
// comes out of that tone mapping as it (unNeutral: the curve undone).
// Drawn into a buffer (the screen's effects', a pond's reflection) it's
// left as WebGL leaves it there - not tone mapped, its band mixed in as it
// is - for the effects' last pass to tone map (intoBuffer).

import { NodeMaterial } from "three/webgpu";
import {
  Fn,
  If,
  Loop,
  select,
  sqrt,
  acos,
  add,
  cameraPosition,
  clamp,
  cos,
  dot,
  exp,
  float,
  floor,
  fract,
  max,
  min,
  mix,
  modelViewProjection,
  mul,
  neutralToneMapping,
  normalize,
  positionWorld,
  pow,
  reference,
  sRGBTransferEOTF,
  sRGBTransferOETF,
  smoothstep,
  sub,
  toneMappingExposure,
  uniform,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import { HAZE_COOL, HAZE_WARM } from "./haze.js";
import { DUSK_SHARE } from "../../sim/dusk.mjs";

export const SKY_NODE_KEY = "sky3";

// Whether what's drawn now goes into a buffer of the game's own (1) - the
// screen's effects' (look/effects.js), a pond's reflection (look/
// mirrors.js) - rather than to the screen (0): as on WebGL, nothing drawn
// into one is tone mapped or put in the screen's colours (the effects' last
// pass does both), so a node version that undoes the screen's tone mapping
// for itself (unNeutral) leaves its colour as it is there. Read for each
// thing as it's drawn.
export const intoBuffer = uniform(0).onObjectUpdate(({ renderer }) => (renderer?.getRenderTarget?.() ? 1 : 0));
// `screen` (made to come out of the frame's tone mapping as WebGL's
// screen colour) where the picture goes to the screen; `buffer` (as WebGL
// draws into a buffer) where it goes into one.
export const forScreen = (screen, buffer) => select(intoBuffer.greaterThan(0.5), buffer, screen);

// three.js's neutral tone mapping undone: the colour that, at `exposure`,
// it turns into `o` (its curve is one-to-one: its offset by the darkest
// channel, then the brightest compressed past 0.76 and the rest drawn
// towards it). The renderer's tone mapping is NeutralToneMapping (app.js).
const START = 0.8 - 0.04;
const DESATURATION = 0.15;
const unOffset = (m) => {
  // The darkest channel before the offset: m = x - offset(x).
  const x = select(m.lessThan(0.04), sqrt(max(m, 0.0).div(6.25)), m.add(0.04));
  return x.sub(m);
};
export const unNeutral = Fn(([o, exposure]) => {
  const newPeak = max(o.r, max(o.g, o.b));
  const d = float(1.0 - START);
  const peak = d.mul(d).div(max(float(1.0).sub(newPeak), 1e-4)).sub(d).add(START);
  const g = float(1.0).sub(float(1.0).div(float(DESATURATION).mul(peak.sub(newPeak)).add(1.0)));
  const squeezed = o.sub(vec3(newPeak).mul(g)).div(max(float(1.0).sub(g), 1e-4)).mul(peak.div(max(newPeak, 1e-4)));
  const cc = select(newPeak.lessThan(START), o, squeezed);
  const offset = unOffset(min(cc.r, min(cc.g, cc.b)));
  return cc.add(offset).div(exposure);
});

// sun: the direction to the sun the haze was installed with; uniforms: the
// WebGL sky material's; disc: the sun disc's scale (environment.js
// SUN_DISC / (760 * 80)).
export function skyNodeMaterial({ uniforms: u, sun, disc }) {
  const U = (name, type) => reference("value", type, u[name]);
  const turbidity = U("turbidity", "float");
  const rayleigh = U("rayleigh", "float");
  const mieCoefficient = U("mieCoefficient", "float");
  const mieDirectionalG = U("mieDirectionalG", "float");
  const sunPosition = U("sunPosition", "vec3");
  const cloudScale = U("cloudScale", "float");
  const cloudSpeed = U("cloudSpeed", "float");
  const cloudCoverage = U("cloudCoverage", "float");
  const cloudDensity = U("cloudDensity", "float");
  const cloudElevation = U("cloudElevation", "float");
  const showSunDisc = U("showSunDisc", "float");
  const time = U("time", "float");
  const cloudDrift = U("cloudDrift", "vec2");
  const cirrus = U("cirrus", "float");
  const skyExposure = U("skyExposure", "float");
  const skyGrey = U("skyGrey", "float");
  const hazeColor = U("hazeColor", "color");
  const hazeBand = U("hazeBand", "float");
  const skyBaking = U("skyBaking", "float");
  const duskK = U("duskK", "float");
  const duskGlow = U("duskGlow", "vec3");
  const duskMid = U("duskMid", "vec3");
  const duskFar = U("duskFar", "vec3");

  const material = new NodeMaterial();

  // Drawn at the far plane, as the WebGL sky is.
  material.vertexNode = Fn(() => {
    const position = modelViewProjection;
    position.z.assign(position.w);
    return position;
  })();

  const gradient = Fn(([i]) => {
    const p = fract(i.xyx.mul(vec3(0.1031, 0.103, 0.0973))).toVar();
    p.addAssign(dot(p, p.yzx.add(33.33)));
    return fract(p.xx.add(p.yz).mul(p.zy)).mul(2.0).sub(1.0);
  });
  const noise = Fn(([p]) => {
    const i = floor(p);
    const f = fract(p);
    const w = f.mul(f).mul(f).mul(f.mul(f.mul(6.0).sub(15.0)).add(10.0));
    const a = dot(gradient(i), f);
    const b = dot(gradient(i.add(vec2(1.0, 0.0))), f.sub(vec2(1.0, 0.0)));
    const c = dot(gradient(i.add(vec2(0.0, 1.0))), f.sub(vec2(0.0, 1.0)));
    const d = dot(gradient(i.add(vec2(1.0, 1.0))), f.sub(vec2(1.0, 1.0)));
    return mix(mix(a, b, w.x), mix(c, d, w.x), w.y).mul(1.6);
  });
  const fbm = Fn(([position, drift]) => {
    const p = vec2(position).toVar();
    const result = float(0.0).toVar();
    const amplitude = float(1.0).toVar();
    Loop(4, () => {
      result.addAssign(amplitude.mul(noise(p)));
      amplitude.mulAssign(0.5);
      p.assign(p.mul(2.0).add(drift));
    });
    return result;
  });

  material.colorNode = Fn(() => {
    // (The vertex shader's sums: the same at every corner.)
    const e = float(2.718281828459045);
    const totalRayleigh = vec3(5.804542996261093e-6, 1.3562911419845635e-5, 3.0265902468824876e-5);
    const MieConst = vec3(1.8399918514433978e14, 2.7798023919660528e14, 4.0790479543861094e14);
    const cutoffAngle = float(1.6110731556870734);
    const steepness = float(1.5);
    const EE = float(1000.0);
    const vSunDirection = normalize(sunPosition);
    const zenithAngleCos = clamp(vSunDirection.y, -1, 1);
    const vSunE = EE.mul(max(0.0, float(1.0).sub(pow(e, cutoffAngle.sub(acos(zenithAngleCos)).div(steepness).negate()))));
    const sunfade = float(1.0).sub(clamp(float(1.0).sub(exp(sunPosition.y.div(450000.0))), 0, 1));
    const rayleighCoefficient = rayleigh.sub(float(1.0).mul(float(1.0).sub(sunfade)));
    const vBetaR = totalRayleigh.mul(rayleighCoefficient);
    const vBetaM = float(0.434).mul(float(0.2).mul(turbidity).mul(10e-18)).mul(MieConst).mul(mieCoefficient);

    const pi = float(3.141592653589793);
    const rayleighZenithLength = float(8.4e3);
    const mieZenithLength = float(1.25e3);
    const sunAngularDiameterCos = float(0.9999566769464484);
    const THREE_OVER_SIXTEENPI = float(0.05968310365946075);
    const ONE_OVER_FOURPI = float(0.07957747154594767);

    const direction = normalize(positionWorld.sub(cameraPosition));
    const zenithAngle = acos(max(0.0, direction.y));
    const inverse = float(1.0).div(cos(zenithAngle).add(float(0.15).mul(pow(float(93.885).sub(zenithAngle.mul(180.0).div(pi)), -1.253))));
    const sR = rayleighZenithLength.mul(inverse);
    const sM = mieZenithLength.mul(inverse);
    const Fex = exp(mul(vBetaR, sR).add(mul(vBetaM, sM)).negate());
    const cosTheta = dot(direction, vSunDirection);
    const rc = cosTheta.mul(0.5).add(0.5);
    const betaRTheta = vBetaR.mul(THREE_OVER_SIXTEENPI.mul(float(1.0).add(pow(rc, 2.0))));
    const g2 = pow(mieDirectionalG, 2.0);
    const inv = float(1.0).div(pow(float(1.0).sub(float(2.0).mul(mieDirectionalG).mul(cosTheta)).add(g2), 1.5));
    const betaMTheta = vBetaM.mul(ONE_OVER_FOURPI.mul(float(1.0).sub(g2).mul(inv)));
    const ratio = vSunE.mul(add(betaRTheta, betaMTheta).div(add(vBetaR, vBetaM)));
    const Lin = pow(ratio.mul(sub(1.0, Fex)), vec3(1.5)).toVar();
    Lin.mulAssign(mix(vec3(1.0), pow(ratio.mul(Fex), vec3(0.5)), clamp(pow(sub(1.0, vSunDirection.y), 5.0), 0.0, 1.0)));
    const L0 = vec3(0.1).mul(Fex);

    // The sun's disc dimmer (environment.js dimSunDisc).
    const sundisc = clamp(cosTheta.sub(sunAngularDiameterCos).mul(50000.0), 0.0, 1.0).mul(showSunDisc);
    const sundiscColor = float(760.0).mul(sundisc).mul(min(vSunE.mul(Fex), 80.0)).mul(disc);
    // The sky's own light at the sun's height (skyExposed).
    const texColor = add(Lin, L0).mul(0.04).add(vec3(0.0, 0.0003, 0.00075)).mul(mix(skyExposure, 1.0, skyGrey)).add(sundiscColor).toVar();

    If(direction.y.greaterThan(0.0).and(cloudCoverage.greaterThan(0.0)), () => {
      const elevation = mix(1.0, 0.1, cloudElevation);
      const cloudUV = direction.xz.div(direction.y.mul(elevation)).toVar();
      cloudUV.mulAssign(cloudScale);
      // Drifting downwind (driftingClouds), not on its clock.
      cloudUV.subAssign(cloudDrift);
      const evolve = time.mul(cloudSpeed).mul(300.0);
      const cloudNoise = clamp(fbm(cloudUV.mul(1000.0), evolve).mul(0.7).add(0.5), 0.0, 1.0).toVar();
      const region = noise(cloudUV.mul(300.0)).mul(0.37).add(0.5);
      const cov = clamp(cloudCoverage.add(region.sub(0.5).mul(0.6)), 0.0, 1.0);
      const threshold = sub(1.0, cov).toVar();
      const cloudMask = smoothstep(threshold, threshold.add(0.3), cloudNoise).toVar();
      const horizonFade = smoothstep(0.0, add(0.03, mul(0.06, cloudElevation)), direction.y);
      cloudMask.mulAssign(horizonFade);
      const dayFactor = smoothstep(-0.08, 0.3, vSunDirection.y);
      const sunColor = vSunE.mul(Fex).mul(0.22).mul(0.04).toVar();
      const skyAmbient = Lin.mul(0.04).add(vec3(0.0, 0.0003, 0.00075));
      const depth = max(0.0, cloudNoise.sub(threshold)).toVar();
      const beer = exp(depth.mul(-4.0)).toVar();
      const powder = sub(1.0, beer.mul(beer));
      const shade = mix(0.45, 1.0, clamp(beer.mul(powder).mul(2.6), 0.0, 1.0));
      const silver = clamp(float(0.51).div(pow(sub(1.49, cosTheta.mul(1.4)), 1.5)), 0.0, 3.0);
      const edge = cloudMask.mul(sub(1.0, cloudMask)).mul(4.0);
      const cloudColor = skyAmbient.add(sunColor.mul(shade)).toVar();
      cloudColor.addAssign(sunColor.mul(silver).mul(edge).mul(0.6));
      cloudColor.mulAssign(max(dayFactor, 0.03));
      const alpha = sub(1.0, exp(depth.mul(cloudDensity).mul(-12.0))).mul(horizonFade).toVar();
      texColor.subAssign(L0.mul(0.04).mul(alpha));
      const cloudAerial = mix(texColor, cloudColor, Fex);
      texColor.assign(mix(texColor, cloudAerial, alpha));
    });

    // High cirrus (cirrusStreaks).
    If(cirrus.greaterThan(0.0).and(direction.y.greaterThan(0.0)), () => {
      const cu = direction.xz.div(max(direction.y, 0.02)).mul(0.45).sub(cloudDrift.mul(600.0));
      // (GLSL's mat2(0.94, 0.34, -0.34, 0.94) * cu: column-major.)
      const r = vec2(cu.x.mul(0.94).add(cu.y.mul(-0.34)), cu.x.mul(0.34).add(cu.y.mul(0.94)));
      const n = noise(r.mul(vec2(0.35, 5.0)))
        .mul(0.55)
        .add(noise(r.mul(vec2(0.8, 13.0)).add(3.1)).mul(0.3))
        .add(noise(r.mul(vec2(0.15, 1.6)).add(7.7)).mul(0.4));
      const cpatch = smoothstep(0.42, 0.72, noise(cu.mul(0.09).add(1.3)).mul(0.6).add(0.5));
      const streak = smoothstep(0.52, 0.86, n.mul(0.5).add(0.5)).mul(cpatch).mul(smoothstep(0.015, 0.2, direction.y));
      const lit = Lin.mul(0.04).add(vSunE.mul(Fex).mul(0.22 * 0.04 * 1.1)).add(vec3(0.0, 0.0003, 0.00075));
      texColor.assign(mix(texColor, mix(texColor, lit, Fex), streak.mul(cirrus)));
    });

    // Greyed towards an overcast sky (greyingSky).
    const skyLum = dot(texColor, vec3(0.2126, 0.7152, 0.0722));
    texColor.assign(mix(texColor, vec3(0.93, 0.96, 1.0).mul(skyLum.mul(0.8).add(0.12)), skyGrey));

    // Dawn and dusk (environment.js DUSK_GLSL): the horizon warm on the
    // sun's side, pink and mauve on the other, overhead a touch deeper, a
    // warm glow round the sun.
    If(duskK.greaterThan(0.0), () => {
      const dFlat = normalize(direction.xz.add(vec2(1e-5)));
      const sFlat = normalize(vSunDirection.xz.add(vec2(1e-5)));
      const dSide = dot(dFlat, sFlat).mul(0.5).add(0.5);
      const dWarm = dSide.mul(dSide);
      const dLow = float(1.0).sub(smoothstep(0.0, 0.5, max(direction.y, 0.0)));
      const dLum = dot(texColor, vec3(0.2126, 0.7152, 0.0722));
      const dTint0 = mix(duskFar, duskGlow, dWarm);
      // Higher up, into the blue: a pale gold on the sun's side, the far
      // side's colour paler on the other.
      const dTint = mix(mix(mix(vec3(1.0), duskFar, 0.4), duskMid, dWarm), dTint0, dLow.mul(dLow));
      const dBand = dTint.mul(dLum).mul(float(0.95).add(dWarm.mul(dSide).mul(0.3)));
      texColor.assign(mix(texColor, dBand, duskK.mul(pow(dLow, 1.5)).mul(mix(0.7, 1.0, dWarm)).mul(DUSK_SHARE.band)));
      texColor.mulAssign(float(1.0).sub(duskK.mul(DUSK_SHARE.deepen).mul(float(1.0).sub(dLow))));
      // Round the sun, its glow turned gold.
      const dNear = pow(max(dot(direction, vSunDirection), 0.0), 8.0);
      texColor.assign(mix(texColor, duskGlow.mul(dLum), dNear.mul(duskK).mul(DUSK_SHARE.glow)));
    });

    // Tone mapped and in the screen's colours, as the WebGL sky's own
    // shader leaves it, then its lowest band into the haze (hazyHorizon).
    const shown = sRGBTransferOETF(neutralToneMapping(texColor, toneMappingExposure));
    const hazeLow = float(1.0).sub(smoothstep(-0.02, hazeBand, direction.y));
    const toSun = dot(direction, vec3(sun.x, sun.y, sun.z)).mul(0.5).add(0.5);
    const hazeSky = hazeColor.mul(mix(vec3(...HAZE_COOL), vec3(...HAZE_WARM), toSun.mul(toSun)));
    const band = hazeLow.mul(hazeLow).mul(float(3.0).sub(hazeLow.mul(2.0)));
    const banded = mix(shown, hazeSky, band);
    // Baking its reflection (look/environment.js bakeSky): as it is, not
    // tone mapped, and the band keeping the sky's own brightness, as WebGL's
    // does - or everything shiny would reflect a dark horizon.
    const LUMA = vec3(0.2126, 0.7152, 0.0722);
    const bakedHaze = hazeSky.mul(max(float(1.0), dot(texColor, LUMA).div(max(dot(hazeSky, LUMA), 1e-4))));
    const baked = mix(texColor, bakedHaze, band);
    // (Back out of the screen's colours and the tone mapping: the renderer
    // puts it through both.)
    // (Just under white: the curve never quite reaches it.)
    const drawn = unNeutral(min(sRGBTransferEOTF(banded), vec3(0.999)), toneMappingExposure);
    // (Into a buffer, as WebGL's: not tone mapped, the band as it is.)
    const buffered = mix(texColor, hazeSky, band);
    return vec4(select(skyBaking.greaterThan(0.5), baked, forScreen(drawn, buffered)), 1.0);
  })();

  material.side = 1; // BackSide
  material.depthWrite = false;
  material.fog = false;
  material.userData.skyNode = SKY_NODE_KEY;
  // (Drawn last of the solid things, as on WebGL: sim/draworder.mjs.)
  material.userData.drawLast = true;
  return material;
}
