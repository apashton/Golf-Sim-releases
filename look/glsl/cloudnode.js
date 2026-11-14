// The sky's clouds (look/clouds.js) as a node material, for WebGPURenderer
// (look/nodetwins.js): each puff a soft ball facing the camera, drifted and
// wrapped round the middle of the scene, lit towards the sun - the same
// sums, reading the WebGL material's own uniforms and the puffs' attributes
// (sorted back to front as ever, on the CPU). The WebGL clouds aren't tone
// mapped; WebGPURenderer tone maps the whole picture, so each colour is the
// one that comes out of that as it (skynode.js unNeutral). (Where a puff's
// edge is see-through it's blended before the tone mapping here, after it
// on WebGL: a shade apart there.)

import { NodeMaterial } from "three/webgpu";
import {
  Discard,
  Fn,
  If,
  attribute,
  cameraPosition,
  cameraProjectionMatrix,
  cameraViewMatrix,
  clamp,
  dot,
  float,
  floor,
  length,
  max,
  mix,
  normalize,
  positionGeometry,
  reference,
  smoothstep,
  sqrt,
  toneMappingExposure,
  varyingProperty,
  vec3,
  vec4,
} from "three/tsl";
import { forScreen, unNeutral } from "./skynode.js";
import { gNoise } from "./groundnode.js";
import { CLOUD_LOOK } from "../clouds.js";

export const CLOUD_NODE_KEY = "cl2";

export function cloudNodeMaterial({ uniforms: u }) {
  const U = (name, type) => reference("value", type, u[name]);
  const uDrift = U("uDrift", "vec2");
  const uMiddle = U("uMiddle", "vec2");
  const uWrap = U("uWrap", "float");
  const uShowing = U("uShowing", "float");
  const uSize = U("uSize", "float");
  const uReach = U("uReach", "float");
  const uSun = U("uSun", "vec3");
  const uTop = U("uTop", "color");
  const uBase = U("uBase", "color");
  const uOpacity = U("uOpacity", "float");
  const aCloud = attribute("aCloud", "vec3");
  const aPuff = attribute("aPuff", "vec4");
  const aLook = attribute("aLook", "vec2");

  const vUv = varyingProperty("vec2", "vCloudUv");
  const vShade = varyingProperty("float", "vCloudShade");
  const vAlpha = varyingProperty("float", "vCloudAlpha");
  const vSun = varyingProperty("vec2", "vCloudSun");
  const vSeed = varyingProperty("vec2", "vCloudSeed");

  const material = new NodeMaterial();
  material.vertexNode = Fn(() => {
    // (Each puff's billows its own: from where it sits in its cloud.)
    vSeed.assign(aPuff.xz.mul(0.031).add(aCloud.xz.mul(0.0007)));
    // The cloud's place, drifted and wrapped round the middle of the scene
    // (GLSL's mod: floored).
    const span = uWrap.mul(2.0);
    const shifted = aCloud.xz.add(uDrift).sub(uMiddle).add(uWrap);
    const c = shifted.sub(floor(shifted.div(span)).mul(span)).sub(uWrap).add(uMiddle);
    const centre = vec3(c.x, aCloud.y, c.y);
    const p = centre.add(aPuff.xyz.mul(uSize));
    const mv = cameraViewMatrix.mul(vec4(p, 1.0)).toVar();
    mv.assign(vec4(mv.xy.add(positionGeometry.xy.mul(aPuff.w).mul(2.0).mul(uSize)), mv.z, mv.w));
    vUv.assign(positionGeometry.xy);
    vShade.assign(aLook.x.add(float(0.25).mul(dot(normalize(aPuff.xyz.add(vec3(0.0, 1.0, 0.0))), uSun))));
    const sunView = cameraViewMatrix.mul(vec4(uSun, 0.0)).xyz;
    vSun.assign(normalize(sunView.xy.add(1e-4)));
    const d = length(centre.xz.sub(cameraPosition.xz));
    const far = float(1.0).sub(smoothstep(uWrap.mul(uReach).mul(0.72), uWrap.mul(uReach).mul(0.95), d));
    const shown = clamp(uShowing.sub(aLook.y).mul(10.0), 0.0, 1.0);
    vAlpha.assign(far.mul(shown));
    return cameraProjectionMatrix.mul(mv);
  })();

  material.colorNode = Fn(() => {
    const q = vUv.mul(2.0);
    const r = length(q);
    If(r.greaterThan(1.0).or(vAlpha.lessThanEqual(0.0)), () => {
      Discard();
    });
    // Its edge broken into billows; fading, thinner and shrunk a little
    // (look/clouds.js CLOUD_LOOK).
    const billows = gNoise(q.mul(2.6).add(vSeed.mul(40.0))).mul(0.65).add(gNoise(q.mul(6.1).add(vSeed.mul(73.0))).mul(0.35));
    const edge = float(1 - CLOUD_LOOK.billow).add(billows.mul(CLOUD_LOOK.billow));
    const body = float(1.0).sub(r.div(edge));
    const gone = float(1.0).sub(vAlpha).mul(CLOUD_LOOK.shrink);
    const a = smoothstep(gone, gone.add(CLOUD_LOOK.soft), body).mul(vAlpha).mul(uOpacity);
    If(a.lessThanEqual(0.003), () => {
      Discard();
    });
    const n = vec3(q, sqrt(max(float(0.0), float(1.0).sub(r.mul(r)))));
    const towards = dot(n, normalize(vec3(vSun.mul(0.7), 0.6))).mul(0.5).add(0.5);
    const lit = clamp(vShade.mul(0.55).add(n.y.mul(0.25).add(towards.mul(0.45)).sub(0.35).mul(CLOUD_LOOK.round)).add(0.3), 0.0, 1.0);
    // (Into a buffer, as WebGL draws it there: as it is.)
    const shade = mix(uBase, uTop, lit);
    return vec4(forScreen(unNeutral(shade, toneMappingExposure), shade), a);
  })();

  material.transparent = true;
  material.depthWrite = false;
  material.fog = false;
  material.userData.cloudNode = CLOUD_NODE_KEY;
  return material;
}
