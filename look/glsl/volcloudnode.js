// Ultra's clouds in three dimensions (look/volclouds.js) as a node material,
// for WebGPURenderer (look/nodetwins.js): the same march along each line
// of sight through the layer of cloud - shaped by the drifting map the
// ground's cloud shadows come from, billowed by the 3D noise, each step lit
// by how much cloud lies between it and the sun, lost in the haze further
// off - reading the WebGL material's own uniforms. Drawn, as on WebGL,
// into the screen's effects' quarter-size buffer and laid into the sky
// there (look/effects.js); straight to the screen (no effects), the colour
// that comes out of the frame's tone mapping as WebGL's untone-mapped one
// (skynode.js forScreen).

import * as THREE from "three";
import { MeshBasicNodeMaterial } from "three/webgpu";
import { Break, Discard, Fn, If, Loop, Return, cameraPosition, clamp, dot, exp, float, fract, max, min, mix, normalize, positionWorld, pow, reference, screenCoordinate, screenSize, smoothstep, texture, texture3D, toneMappingExposure, vec2, vec3, vec4 } from "three/tsl";
import { forScreen, unNeutral } from "./skynode.js";
import { CLOUD_SHADOW_TILE } from "./cloudshade.js";
import { VOL } from "../../sim/volclouds.mjs";

export const VOLUME_CLOUD_NODE_KEY = "vc1";

export function volumeCloudNodeMaterial({ uniforms: u }) {
  const U = (name, type) => reference("value", type, u[name]);
  const csDrift = U("csDrift", "vec2");
  const csLo = U("csLo", "float");
  const sun = U("vSun", "vec3");
  const reach = float(VOL.reach).mul(U("vReach", "float"));
  const map = texture(u.csMap.value);
  const noise = texture3D(u.vNoise.value);
  const BASE = VOL.base;
  const TOP = VOL.top;

  // How much cloud at p (0 - 1), as WebGL's cloudAt: a function of its
  // own, so a spot with no cloud over it is done with at once.
  const cloudAt = Fn(([p, far]) => {
    const g = p.xz.sub(sun.xz.mul(float((BASE + TOP) / 2).div(max(sun.y, 0.1))));
    const q = vec3(p.x.sub(csDrift.x), p.y, p.z.sub(csDrift.y)).toVar();
    const warp = vec2(noise.sample(q.div(520)).r, noise.sample(q.div(520).add(0.5)).r).sub(0.5);
    const m = map.sample(g.add(warp.mul(340)).sub(csDrift).div(CLOUD_SHADOW_TILE)).r;
    const cover = smoothstep(csLo, csLo.add(0.22), m).toVar();
    If(cover.lessThanEqual(0), () => {
      Return(float(0));
    });
    const h = p.y.sub(BASE).div(TOP - BASE);
    const shape = smoothstep(0, 0.1, h).mul(float(1).sub(smoothstep(cover.mul(0.8).sub(0.25), cover.mul(0.8).add(0.05), h))).toVar();
    If(shape.lessThanEqual(0), () => {
      Return(float(0));
    });
    const big = noise.sample(q.div(VOL.big)).r;
    const small = mix(noise.sample(q.div(VOL.small).add(0.37)).r, float(0.6), far);
    return clamp(cover.mul(shape).sub(float(1).sub(big).mul(0.85)).sub(float(1).sub(small).mul(0.3)).mul(2.5), 0, 1);
  }).setLayout({
    name: "volumeCloudAt",
    type: "float",
    inputs: [
      { name: "p", type: "vec3" },
      { name: "far", type: "float" },
    ],
  });

  const material = new MeshBasicNodeMaterial({ side: THREE.BackSide, transparent: true, depthWrite: false });
  material.fog = false;
  material.colorNode = Fn(() => {
    const dir = normalize(positionWorld.sub(cameraPosition)).toVar();
    If(dir.y.lessThan(0.015), () => {
      Discard();
    });
    const t0 = max(float(0), float(BASE).sub(cameraPosition.y).div(dir.y)).toVar();
    const t1 = min(reach, float(TOP).sub(cameraPosition.y).div(dir.y)).toVar();
    If(t0.greaterThanEqual(t1), () => {
      Discard();
    });
    const stepLen = t1.sub(t0).div(VOL.steps).toVar();
    // (A different start along the line a pixel: WebGL's, by its place
    // from the bottom.)
    const frag = vec2(screenCoordinate.x, screenSize.y.sub(screenCoordinate.y));
    const jitter = fract(float(52.9829189).mul(fract(dot(frag, vec2(0.06711056, 0.00583715))))).toVar();
    const trans = float(1).toVar();
    const col = vec3(0).toVar();
    const vBase = U("vBase", "color");
    const vTop = U("vTop", "color");
    const vHaze = U("vHaze", "color");
    const density = U("vDensity", "float");
    Loop(VOL.steps, ({ i }) => {
      const t = t0.add(float(i).add(jitter).mul(stepLen)).toVar();
      const p = cameraPosition.add(dir.mul(t)).toVar();
      const far = smoothstep(2500, 6000, t).toVar();
      const d = cloudAt(p, far).toVar();
      If(d.greaterThan(0.001), () => {
        // Towards the sun: how much cloud is in the way.
        let shade = float(0);
        for (let k = 1; k <= VOL.light; k++) shade = shade.add(cloudAt(p.add(sun.mul(k * 70)), far));
        const lit = exp(shade.mul(-1.1));
        const up = clamp(p.y.sub(BASE).div(TOP - BASE), 0, 1);
        const lining = pow(max(dot(dir, sun), 0), 8).mul(float(1).sub(d)).mul(0.6);
        const c0 = mix(vBase, vTop, clamp(lit.mul(0.8).add(up.mul(0.25)).add(lining).sub(0.1), 0, 1));
        const c = mix(c0, vHaze, smoothstep(reach.mul(1 - VOL.fade), reach, t).mul(0.85));
        const a = float(1).sub(exp(d.mul(density).mul(min(stepLen, 120)).mul(-0.03))).toVar();
        col.addAssign(c.mul(trans).mul(a));
        trans.mulAssign(float(1).sub(a));
      });
      If(trans.lessThan(0.03), () => {
        Break();
      });
    });
    const alpha = float(1).sub(trans).toVar();
    If(alpha.lessThan(0.004), () => {
      Discard();
    });
    const shown = col.div(max(float(1).sub(trans), 1e-4));
    return vec4(forScreen(unNeutral(min(shown, vec3(0.999)), toneMappingExposure), shown), alpha.mul(smoothstep(0.015, 0.08, dir.y)));
  })();
  material.userData.volumeCloudNode = VOLUME_CLOUD_NODE_KEY;
  return material;
}
