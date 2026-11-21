// What WebGL draws as points sized in their shader - the sand and spray a
// ball throws up (look/sprays.js) and Ultra's motes in the sunlight (look/
// motes.js) - as node materials for WebGPURenderer (look/nodetwins.js).
// WebGPU draws a point one pixel across, whatever size it's asked for, so
// on WebGPURenderer each bit is a small square of two triangles instead,
// one copy of it for each point (three's own way, its sprites: an
// instanced quad), placed and sized in the same sums as WebGL's point -
// as many pixels across as WebGL's gl_PointSize - and drawn round and soft
// across it as WebGL's point is across gl_PointCoord. The geometry they're
// drawn with: quadCopies (look/sprays.js, look/motes.js make it there).

import * as THREE from "three";
import { MeshBasicNodeMaterial } from "three/webgpu";
import { attribute, cameraPosition, cameraProjectionMatrix, cameraViewMatrix, clamp, cos, dot, float, length, max, mod, modelViewMatrix, normalize, positionGeometry, pow, reference, screenSize, sin, smoothstep, uv, varying, vec3, vec4 } from "three/tsl";

// The clip position of a square `pixels` across round a point at `view`
// (view space): the corner of the quad (its own -0.5 - 0.5) moved out on
// the picture by its share of the pixels, as a point's square lies.
function squareAround(view, pixels) {
  const clip = cameraProjectionMatrix.mul(view);
  const offset = positionGeometry.xy.mul(pixels).mul(2).div(screenSize).mul(clip.w);
  return vec4(clip.xy.add(offset), clip.z, clip.w);
}

// The sand and spray (look/sprays.js VERTEX, FRAGMENT): each bit at its
// place (aAt, in the spray's own frame), its colour, size (metres), alpha
// and how soft its edge; uniforms: { uScale } (pixels a metre at a metre
// off, set as it's drawn). Not tone mapped in itself, as WebGL's isn't
// drawn into the effects' buffer (on the screen, the frame's tone mapping
// does what its own did).
export function sprayNodeMaterial(uniforms) {
  const material = new MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
  material.fog = false;
  const scale = reference("value", "float", uniforms.uScale);
  const mv = modelViewMatrix.mul(vec4(attribute("aAt", "vec3"), 1));
  const pixels = clamp(attribute("aSize", "float").mul(scale).div(max(float(0.05), mv.z.negate())), 1, 96);
  material.vertexNode = squareAround(mv, pixels);
  const colour = varying(attribute("aColor", "vec3"), "vSprayColor");
  const alpha = varying(attribute("aAlpha", "float"), "vSprayAlpha");
  const soft = varying(attribute("aSoft", "float"), "vSpraySoft");
  const d = length(uv().sub(0.5)).mul(2);
  const a = alpha.mul(float(1).sub(smoothstep(float(1).sub(soft), 1, d)));
  material.colorNode = vec4(colour, a);
  material.maskNode = a.greaterThanEqual(0.01);
  material.uniforms = uniforms;
  material.userData.spriteNode = "spray1";
  return material;
}

// Ultra's motes (look/motes.js VERTEX, FRAGMENT): each from its place
// (mBase) and seed (mSeed), drifting and wrapped round the camera, glowing
// looking towards the sun; uniforms: the WebGL material's (mTime, mSun,
// mBox, mSunny, mScale), so whatever moves them moves these.
export function moteNodeMaterial(uniforms) {
  const material = new MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  material.fog = false;
  const U = (name, type) => reference("value", type, uniforms[name]);
  const time = U("mTime", "float");
  const box = U("mBox", "float");
  const seed = attribute("mSeed", "vec4");
  const drift = vec3(sin(time.mul(0.4).add(seed.x.mul(6.3))), sin(time.mul(0.3).add(seed.y.mul(6.3))), cos(time.mul(0.37).add(seed.z.mul(6.3)))).mul(0.35);
  const p = attribute("mBase", "vec3").add(vec3(0.18, 0.03, 0.11).mul(time)).add(drift);
  const rel = mod(p.sub(cameraPosition).add(box.mul(0.5)), box).sub(box.mul(0.5));
  const mv = cameraViewMatrix.mul(vec4(cameraPosition.add(rel), 1));
  const d = length(rel);
  const towards = max(dot(normalize(rel), U("mSun", "vec3")), 0);
  const glow = varying(
    pow(towards, 6)
      .mul(1.6)
      .add(0.08)
      .mul(float(1).sub(smoothstep(box.mul(0.3), box.mul(0.5), d)))
      .mul(smoothstep(0.6, 1.5, d))
      .mul(seed.w.mul(0.5).add(0.5)),
    "vMoteGlow",
  );
  material.vertexNode = squareAround(mv, clamp(float(90).div(max(mv.z.negate(), 0.5)), 1, 4).mul(U("mScale", "float")));
  const a = float(1).sub(smoothstep(0.2, 0.5, length(uv().sub(0.5)))).mul(glow).mul(U("mSunny", "float"));
  material.colorNode = vec4(vec3(1, 0.94, 0.78).mul(a), a);
  material.maskNode = a.greaterThanEqual(0.01);
  material.uniforms = uniforms;
  material.userData.spriteNode = "mote1";
  return material;
}
