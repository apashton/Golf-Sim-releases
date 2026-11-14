// A pond's bank (look/sandwater.js bankSlopeMaterial) as a node material,
// for WebGPURenderer (look/nodetwins.js): the same sums - earth, or pale
// silt and gravel where it's gentle, faintly layered where it's a worn
// face, wet and dark towards the water with a stain along the waterline;
// an island green's bank turning to grass over its top.

import { MeshLambertNodeMaterial } from "three/webgpu";
import { abs, attribute, cameraPosition, cross, dFdx, dFdy, float, materialColor, mix, modelWorldMatrix, modelWorldMatrixInverse, normalize, normalWorld, positionWorld, pow, reference, sin, smoothstep, step, varying, vec3, vec4 } from "three/tsl";
import { PALETTE, BANK_LIGHT, BANK_PULL, BANK_BREAK, rgb } from "../palette.js";
import { gFbm, gNoise } from "./groundnode.js";
import { applyNodeHooks } from "./nodehooks.js";

export const BANK_NODE_KEY = "bk5";

const as3 = (hex) => vec3(...rgb(hex));

// uniforms: the WebGL material's (uLevel, uTop); top: an island green's
// bank, grass over its top; along: a brook's, each corner's own level and
// how far up to the turf (bBank), shaded under the turf's lip.
export function bankNodeMaterial({ uniforms: u, top = false, along = false }, base = null) {
  const material = base ?? new MeshLambertNodeMaterial();
  material.userData = { ...material.userData };
  const w = positionWorld.xz;
  const bank = along ? varying(attribute("bBank", "vec2"), "vBank") : null;
  const above = positionWorld.y.sub(along ? bank.x : reference("value", "float", u.uLevel));
  // (A brook's by its own smooth light, as on WebGL.)
  const n = along ? normalize(normalWorld) : normalize(cross(dFdx(positionWorld), dFdy(positionWorld)));
  // (A brook's silt only low down, as on WebGL: BANK_BREAK.)
  const flat = along ? smoothstep(0.86, 0.95, abs(n.y)).mul(float(1).sub(smoothstep(BANK_BREAK.silt, BANK_BREAK.silt + BANK_BREAK.siltFade, bank.y))) : smoothstep(0.86, 0.95, abs(n.y));
  const earth = as3(PALETTE.earthBank)
    .mul(float(0.95).add(gFbm(w.mul(0.8)).mul(0.3)))
    .mul(float(0.95).add(sin(above.mul(float(55).add(gNoise(w.mul(0.3)).mul(25))).add(gNoise(w.mul(0.7)).mul(6))).mul(0.05)));
  const silt = mix(as3(PALETTE.earthBank), as3(PALETTE.sand), 0.22).mul(float(0.84).add(gFbm(w.mul(1.7)).mul(0.2)));
  let col = mix(earth, silt, flat);
  col = col.mul(float(0.92).add(step(0.8, gNoise(w.mul(9))).mul(0.16)).add(flat.mul(0.1).mul(step(0.72, gNoise(w.mul(23).add(3))))));
  const wet = float(1).sub(smoothstep(0.02, float(0.1).add(gNoise(w.mul(1.3)).mul(0.08)), above));
  col = col.mul(mix(float(1), float(along ? 0.8 : 0.64), wet));
  col = col.mul(mix(float(1), float(0.82), float(1).sub(smoothstep(0, 0.02, above))));
  if (along) {
    col = col.mul(mix(float(1), float(0.86).add(gNoise(w.mul(6)).mul(0.08)), smoothstep(0.6, 0.95, bank.y))).mul(BANK_LIGHT);
    // (Broken up along it, as on WebGL: BANK_BREAK.)
    col = col.mul(float(1 - BANK_BREAK.runnels / 2).add(gNoise(w.mul(BANK_BREAK.runnelScale)).mul(BANK_BREAK.runnels)));
    const slump = smoothstep(BANK_BREAK.from, BANK_BREAK.to, gNoise(w.mul(BANK_BREAK.scale).add(7))).mul(BANK_BREAK.slump);
    material.maskNode = bank.y.lessThanEqual(float(0.62).sub(slump).add(gNoise(w.mul(2.7)).mul(0.3)).add(gNoise(w.mul(9)).mul(0.12)));
    // (Drawn a little towards the eye, as on WebGL: BANK_PULL.)
    const geo = attribute("position", "vec3");
    const toEye = normalize(cameraPosition.sub(modelWorldMatrix.mul(vec4(geo, 1)).xyz));
    material.positionNode = geo.add(modelWorldMatrixInverse.mul(vec4(toEye.mul(BANK_PULL), 0)).xyz);
  }
  if (top) {
    const grass = smoothstep(reference("value", "float", u.uTop).sub(0.2), reference("value", "float", u.uTop).sub(0.03), positionWorld.y.add(gNoise(w.mul(1.5)).sub(0.5).mul(0.05)));
    col = mix(col, as3(PALETTE.collar), grass);
  }
  const own = vec4(materialColor);
  material.colorNode = vec4(own.rgb.mul(pow(col, vec3(2.2))), own.a);
  applyNodeHooks(material, "ground");
  material.userData.bankNode = BANK_NODE_KEY;
  return material;
}
