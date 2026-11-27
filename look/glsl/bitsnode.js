// Small things' patched materials as node materials, for WebGPURenderer
// (look/nodetwins.js): a flag's cloth, a pond's ducks and swans, the
// tees' sand-filled divots, High's rocks, the marks round the cup, golf
// pong's cups and the rain. The same sums as their WebGL patches and
// shaders.

import * as THREE from "three";
import { MeshBasicNodeMaterial, MeshLambertNodeMaterial } from "three/webgpu";
import { Fn, abs, attribute, batchColor, cameraPosition, cameraProjectionMatrix, cameraViewMatrix, cos, cross, dFdx, dFdy, distance, dot, float, floor, instanceColor, length, materialColor, max, min, mix, mod, modelWorldMatrix, normalViewGeometry, normalize, positionView, positionWorld, pow, reference, select, sign, sin, smoothstep, sqrt, step, toneMappingExposure, transpose, varying, vec2, vec3, vec4, vertexColor } from "three/tsl";
import { hazeSun } from "./haze.js";
import { gHash } from "./groundnode.js";
import { applyNodeHooks, ownMatrix } from "./nodehooks.js";
import { tHash, tNoise } from "./treenode.js";
import { forScreen, unNeutral } from "./skynode.js";

// A flag's cloth (scenery.js makeFlag): lit as the face turned to the sun,
// whichever face is seen - cloth lets the light through.
export function clothNodeMaterial(base = null) {
  const material = base ?? new MeshLambertNodeMaterial();
  material.userData = { ...material.userData };
  const sun = hazeSun() ?? new THREE.Vector3(0, 1, 0);
  const toSun = normalize(cameraViewMatrix.mul(vec4(sun.x, sun.y, sun.z, 0)).xyz);
  material.normalNode = select(dot(normalViewGeometry, toSun).lessThan(0), normalViewGeometry.negate(), normalViewGeometry);
  return material;
}

// A pond's ducks and swans (look/wildlife.js birdMaterial): each wandering
// slowly round where it sits and bobbing (not the dark water under it),
// by its own phase from where it is - moved before its copy's matrix, as
// on WebGL. time: the WebGL material's clock uniform; drift: how far.
export function birdNodeMaterial({ time, drift }, base = null) {
  const material = base ?? new MeshLambertNodeMaterial();
  material.userData = { ...material.userData };
  const t = reference("value", "float", time);
  material.positionNode = Fn((builder) => {
    const M = ownMatrix(builder.object);
    const geo = attribute("position", "vec3");
    const ph = M ? M[3].x.mul(0.37).add(M[3].z.mul(0.61)) : float(0);
    const moved = geo.add(vec3(sin(t.mul(0.11).add(ph)).mul(drift), sin(t.mul(1.6).add(ph.mul(3))).mul(0.012).mul(step(0.01, geo.y)), cos(t.mul(0.09).add(ph.mul(1.3))).mul(drift)));
    return M ? M.mul(vec4(moved, 1)).xyz : moved;
  })();
  applyNodeHooks(material, "sign");
  return material;
}

// The tees' divots (look/wear.js divotMaterial): sand, grainy, older ones
// grown over from the edge in, a rim of soil where the turf was cut, faded
// out at the edge and by 25 m. sand, soil, tee: their colours, linear.
export function divotNodeMaterial({ sand, soil, tee }, base = null) {
  const material = base ?? new MeshLambertNodeMaterial();
  material.userData = { ...material.userData };
  // (The unit circle the divot's stretched from, and how old it is.)
  const r = length(attribute("position", "vec3").xz);
  const old = attribute("dAge", "float");
  const w = positionWorld.xz;
  const grains = vec3(...sand).mul(float(0.9).add(gHash(floor(w.mul(90))).mul(0.2)));
  const grown = old.mul(smoothstep(0.35, 1, r.add(gHash(floor(w.mul(40))).mul(0.25))));
  let col = mix(grains, vec3(...tee), grown.mul(0.8));
  col = mix(col, vec3(...soil), smoothstep(0.78, 0.95, r).mul(float(1).sub(old.mul(0.6))));
  const own = vec4(materialColor);
  const fade = float(1).sub(smoothstep(0.92, 1, r)).mul(float(1).sub(smoothstep(18, 25, distance(positionWorld, cameraPosition))));
  material.colorNode = vec4(own.rgb.mul(col), own.a.mul(fade));
  applyNodeHooks(material, "wear");
  return material;
}

// High's rocks (look/dressing.js rockMaterial): grain and speckle in the
// stone, light and dark mottling, warmer, pale lichen on what faces up,
// and a fine bumpy surface catching the sun - where each pixel is in the
// world. (The lichen goes over the stone's colours, which three multiplies
// in after this - its vertex colours, a copy's or a batch's own - so it's
// laid on divided by them.)
export function rockNodeMaterial(base = null) {
  const material = base ?? new MeshLambertNodeMaterial();
  material.userData = { ...material.userData };
  const at = positionWorld;
  const big = tNoise(at.mul(1.7));
  const mid = tNoise(at.mul(6.3).add(3));
  const fine = tNoise(at.mul(23).add(7));
  const height = mid.mul(0.55).add(fine.mul(0.45));
  const speck = tHash(floor(at.mul(40)));
  let stone = float(0.88).add(big.mul(0.2)).add(mid.sub(0.5).mul(0.08)).add(fine.sub(0.5).mul(0.06));
  stone = vec3(stone).mul(vec3(1.04, 1, 0.93)).mul(select(speck.greaterThan(0.94), float(1.1), select(speck.lessThan(0.06), float(0.86), float(1))));
  const up = normalize(transpose(cameraViewMatrix).mul(vec4(normalViewGeometry, 0)).xyz).y;
  const lich = smoothstep(0.5, 0.9, up).mul(smoothstep(0.62, 0.78, tNoise(at.mul(2.2).add(11))));
  const lichen = select(tNoise(at.mul(0.9).add(5)).greaterThan(0.5), vec3(0.62, 0.64, 0.5), vec3(0.66, 0.58, 0.28)).mul(fine.mul(0.2).add(0.9));
  const own = vec4(materialColor);
  material.colorNode = Fn((builder) => {
    const o = builder.object;
    let after = vec3(1);
    if (builder.material?.vertexColors === true && builder.geometry?.hasAttribute?.("color")) after = after.mul(vertexColor().rgb);
    if (o?.isBatchedMesh && o._colorsTexture) after = after.mul(batchColor.rgb);
    if (o?.instanceColor) after = after.mul(instanceColor);
    return vec4(mix(own.rgb.mul(stone), lichen.div(max(after, vec3(1e-3))), lich.mul(0.45)), own.a);
  })();
  // The fine bumps, from the same noise (as a bump map does: its slope
  // across the screen).
  const n = normalViewGeometry;
  const dpx = dFdx(positionView);
  const dpy = dFdy(positionView);
  const r1 = cross(dpy, n);
  const r2 = cross(n, dpx);
  const det = dot(dpx, r1);
  const grad = sign(det).mul(r1.mul(dFdx(height)).add(r2.mul(dFdy(height))));
  material.normalNode = normalize(n.mul(abs(det)).sub(grad.mul(0.12)));
  applyNodeHooks(material, "rock");
  return material;
}

// The marks round the cup (look/cupmark.js): a soft glow round its edge
// and a circle closing in on it, from the disc's own uniforms (sized each
// frame by CupMark.update). WebGL draws them past the tone mapping, in the
// screen's colours: here the colour the frame's tone mapping will turn
// into that (glsl/skynode.js unNeutral).
export function cupMarkNodeMaterial({ uniforms: u }) {
  const U = (name, type) => reference("value", type, u[name]);
  const d = length(attribute("position", "vec3").xy).mul(U("uScale", "float"));
  const cup = U("uCup", "float");
  const r0 = cup.add(U("uRingIn", "float"));
  const w = U("uRingW", "float");
  const ring = smoothstep(r0.sub(w.mul(0.1)), r0, d).mul(pow(float(1).sub(smoothstep(r0, r0.add(w), d)), 1.5));
  const pw = U("uPulseW", "float");
  const pulse = U("uPulseA", "float").mul(float(1).sub(smoothstep(pw.mul(0.35), pw.mul(0.5), abs(d.sub(U("uPulseR", "float"))))));
  const glow = U("uGlowA", "float").mul(ring);
  const rgb = mix(U("uRingColor", "color"), U("uPulseColor", "color"), pulse.div(max(0.001, max(pulse, glow))));
  const a = max(glow, pulse);
  const material = new MeshBasicNodeMaterial();
  material.colorNode = vec4(forScreen(unNeutral(min(rgb, vec3(0.999)), toneMappingExposure), rgb), a);
  material.maskNode = d.greaterThanEqual(cup).and(a.greaterThanEqual(0.01));
  return material;
}

// A golf pong cup (look/cuphole.js): a disc over its opening, each pixel
// where its line of sight would meet the inside of a real cup - the soil
// under the grass, the white liner, the dark wall, the floor - and whether
// the sun reaches that spot past the rim. depths: cuphole.js CUP_DEPTHS.
export function cupHoleNodeMaterial({ uniforms: u, depths: D }) {
  const U = (name, type) => reference("value", type, u[name]);
  const R = U("cR", "float");
  const sun = U("cSun", "vec3");
  const centre = modelWorldMatrix.mul(vec4(0, 0, 0, 1)).xyz;
  const dir = normalize(positionWorld.sub(cameraPosition));
  const p = positionWorld.xz.sub(centre.xz);
  const down = max(dir.y.negate(), 1e-4);
  // Where the line of sight meets the wall: |p + t dir.xz| = R.
  const a = max(dot(dir.xz, dir.xz), 1e-8);
  const b = dot(p, dir.xz).mul(2);
  const c = dot(p, p).sub(R.mul(R));
  const tWall = b.negate().add(sqrt(max(b.mul(b).sub(a.mul(c).mul(4)), 0))).div(a.mul(2));
  const dWall = tWall.mul(down);
  const sunlit = (q, d) => float(1).sub(smoothstep(R.mul(0.97), R, length(q.add(sun.xz.div(max(sun.y, 0.05)).mul(d)))));
  const q = p.add(dir.xz.mul(tWall));
  const face = max(dot(q.negate().div(R), normalize(sun.xz.add(1e-5))), 0);
  const base = select(dWall.lessThan(D.soil), U("cSoil", "color"), select(dWall.lessThan(D.liner), U("cLiner", "color"), U("cWall", "color")));
  const sky = mix(float(0.55), float(0.12), smoothstep(0, D.floor, dWall));
  const wall = base.mul(sky.add(sunlit(q, dWall).mul(face.mul(0.65).add(0.35)).mul(0.9)));
  const qf = p.add(dir.xz.mul(float(D.floor).div(down)));
  const bottom = U("cFloor", "color").mul(sunlit(qf, D.floor).mul(0.6).add(0.1));
  const material = new MeshBasicNodeMaterial();
  material.colorNode = vec4(select(dWall.lessThan(D.floor), wall, bottom).mul(U("cLight", "float")), 1);
  return material;
}

// The rain (look/rain.js): each streak falling, blown, through a box that
// wraps round the camera, placed in its own sums (from its seed, the clock
// and the camera) and turned to face the camera about two pixels wide;
// faded close to the camera and towards the box's edge. WebGL draws it
// past the tone mapping: here the colour the frame's tone mapping turns
// into that. streak: its length in seconds of fall; alpha: the most opaque
// a streak gets; near, gone: where it fades out close to.
export function rainNodeMaterial({ uniforms: u, streak, alpha, near, gone }) {
  const U = (name, type) => reference("value", type, u[name]);
  const box = U("uBox", "vec3");
  const wind = U("uWind", "vec3");
  const seed = attribute("aSeed", "vec3");
  const position = attribute("position", "vec3");
  const vel = vec3(wind.x, U("uFall", "float").negate(), wind.z);
  const half = box.mul(0.5);
  const fallen = seed.mul(box).add(vel.mul(U("uTime", "float")).mul(seed.y.mul(0.3).add(0.85)));
  const p = mod(fallen.sub(cameraPosition).add(half), box).sub(half).add(cameraPosition);
  const tail = p.sub(vel.mul(streak));
  const mv = cameraViewMatrix.mul(vec4(mix(p, tail, position.y.add(0.5)), 1));
  const a = cameraViewMatrix.mul(vec4(p, 1));
  const b = cameraViewMatrix.mul(vec4(tail, 1));
  const along = normalize(b.xy.div(max(0.1, b.z.negate())).sub(a.xy.div(max(0.1, a.z.negate()))).add(vec2(1e-5, 0)));
  const side = vec2(along.y.negate(), along.x);
  const xy = mv.xy.add(side.mul(position.x).mul(max(0.008, mv.z.negate().mul(0.0025))));
  const material = new MeshBasicNodeMaterial();
  material.vertexNode = cameraProjectionMatrix.mul(vec4(xy, mv.z, mv.w));
  const r = length(p.sub(cameraPosition));
  const fade = varying(smoothstep(gone, near, r).mul(float(1).sub(smoothstep(box.x.mul(0.3), box.x.mul(0.5), r))), "vRainFade");
  material.colorNode = vec4(forScreen(unNeutral(min(U("uColor", "color"), vec3(0.999)), toneMappingExposure), U("uColor", "color")), fade.mul(U("uStrength", "float")).mul(alpha));
  return material;
}

