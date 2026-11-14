// A bunker's sand (look/sandwater.js sandMaterial) as a node material, for
// WebGPURenderer (look/nodetwins.js): the same sums - its colour drifting at
// three scales, damp towards the lip and low in a dug face (and all over
// after rain), wet sand and mud where it runs into water, on High the rake
// lines, wind ripples, grain and the drawn sand, coarse sand's stones, a
// ragged edge and the lip, and a waste area's sandy ground (its drifts,
// stones and scrub: sim/wastearea.mjs) - read from the WebGL material's own
// field and uniforms. A bunker lying flat is shaded as a bowl from its edge, as on
// WebGL. Not yet: Ultra's sand in relief (prints and rake ridges in the
// light), and High's grains tilting the light.

import * as THREE from "three";
import { MeshLambertNodeMaterial } from "three/webgpu";
import { clamp, exp, float, fwidth, length, max, mix, mod, modelNormalMatrix, normalView, normalize, positionLocal, positionWorld, pow, reference, sin, smoothstep, step, texture, vec2, vec3, dot, floor, fract } from "three/tsl";
import { PALETTE, rgb } from "../palette.js";
import { NEAR_RANGE } from "../../sim/edgefield.mjs";
import { gHash, gNoise, gFbm, gWet } from "./groundnode.js";
import { applyNodeHooks } from "./nodehooks.js";

export const SAND_NODE_KEY = "sn2";

// (sandwater.js MAX_DEPTH: the field's depth channel's range.)
const MAX_DEPTH = 2;
const as3 = (hex) => vec3(...rgb(hex));
const SAND = rgb(PALETTE.sand);
const DAMP = vec3(...rgb(PALETTE.sandDamp).map((v, i) => v / SAND[i]));

// The grass's hash kept to small numbers (sandwater.js sHash).
const sHash = (c) => gHash(mod(c, 4096).mul(0.001));
function sNoise(p) {
  const i = floor(p);
  const f = fract(p);
  const u = f.mul(f).mul(float(3).sub(f.mul(2)));
  return mix(mix(sHash(i), sHash(i.add(vec2(1, 0))), u.x), mix(sHash(i.add(vec2(0, 1))), sHash(i.add(vec2(1, 1))), u.x), u.y);
}
// A 2 x 2 turn, as the GLSL's mat2(0.8, -0.6, 0.6, 0.8) * w (column-major).
const turn = (w) => vec2(w.x.mul(0.8).add(w.y.mul(0.6)), w.x.mul(-0.6).add(w.y.mul(0.8)));

// uniforms: the WebGL material's (sField, sFieldBox, sFieldRange, sRake,
// sTint, sLook, sCut, sWaste, tSand on High); near: the field knows a pond;
// bowl: a flat bunker shaded as a bowl; high: High's fine detail.
export function sandNodeMaterial({ uniforms: u, near = false, bowl = false, high = false }) {
  const fieldMap = u.sField.value;
  const box = reference("value", "vec4", u.sFieldBox);
  const range = reference("value", "vec2", u.sFieldRange);
  const rakeDir = reference("value", "vec2", u.sRake);
  const tint = reference("value", "vec3", u.sTint);
  const look = reference("value", "vec4", u.sLook);
  const cut = u.sCut ? reference("value", "vec2", u.sCut) : vec2(0, 0);
  const waste = u.sWaste ? reference("value", "float", u.sWaste) : float(0);
  const at = (p) => texture(fieldMap, p.sub(box.xy).div(box.zw));
  const fieldAt = (p) => {
    const t = at(p);
    return vec2(range.x.add(t.r.mul(range.y.sub(range.x))), t.g.mul(MAX_DEPTH));
  };
  const nearAt = (p) => float(NEAR_RANGE[0]).add(at(p).b.mul(NEAR_RANGE[1] - NEAR_RANGE[0]));

  const local = positionLocal.xz;
  const w = positionWorld.xz;
  const f = fieldAt(local);
  const edge = f.x;
  const depth = f.y;
  const wet = near ? float(1).sub(smoothstep(0, 1.2, nearAt(local).add(gNoise(w.mul(1.3)).sub(0.5).mul(0.5)))) : float(0);

  // sandColour (sandwater.js SAND_GLSL).
  let col = vec3(...SAND).mul(tint);
  const big = gFbm(w.mul(0.09).add(3));
  const mid = gNoise(w.mul(0.7).add(11));
  col = col.mul(float(0.9).add(big.mul(0.2)).add(mid.sub(0.5).mul(0.08)));
  col = mix(col, col.mul(vec3(1.04, 1.0, 0.9)), smoothstep(0.3, 0.75, gNoise(w.mul(0.23).add(29))));
  const ragged = gNoise(w.mul(1.7)).mul(0.4);
  let damp = float(1).sub(smoothstep(0, float(0.7).add(ragged).mul(float(1).sub(cut.x.mul(0.65))), edge));
  damp = max(damp.mul(0.85), smoothstep(0.35, 1.1, depth).mul(float(1).sub(smoothstep(0.6, 2.2, edge))).mul(0.5));
  damp = damp.mul(float(1).sub(wet)).mul(float(1).sub(waste.mul(0.8)));
  damp = max(damp, gWet.mul(0.8).mul(float(1).sub(wet)));
  col = mix(col, col.mul(DAMP), damp);
  col = mix(col, col.mul(vec3(0.68, 0.64, 0.57)), smoothstep(0, 0.5, wet));
  col = mix(col, as3(PALETTE.waterMud).mul(1.12), smoothstep(0.35, 1, wet).mul(0.9));
  if (high) {
    const r = dot(w, rakeDir).div(0.22).add(gNoise(w.mul(0.25)).sub(0.5).mul(4));
    const rake = sin(r.mul(6.2832)).mul(float(1).sub(smoothstep(0.05, 0.15, fwidth(r)))).mul(look.y);
    const windy = sNoise(vec2(dot(w, vec2(-0.6, 0.8)).mul(5), dot(w, vec2(0.8, 0.6)).mul(0.8)));
    const fine = float(1).sub(smoothstep(0.03, 0.2, fwidth(w.x.mul(5))));
    const blown = float(1).add(max(float(0), float(1).sub(look.y)).mul(1.2));
    col = col.mul(float(1).add(rake.mul(0.02).mul(float(1).sub(damp)).add(blown.mul(0.035).mul(windy.sub(0.5)).mul(fine)).mul(float(1).sub(wet))));
    const grain = sNoise(w.mul(60)).add(sNoise(turn(w).mul(97)).mul(0.5)).sub(0.75);
    col = col.mul(float(1).add(grain.mul(0.1).mul(float(1).sub(smoothstep(0.1, 0.6, fwidth(w.x.mul(60)))))));
    if (u.tSand) {
      // (Followed as it changes: the drawn sand is swapped in once it's
      // loaded - look/textures.js.)
      const held = u.tSand;
      const follow = (node) => {
        node.onRenderUpdate(() => {
          if (held.value && node.value !== held.value) node.value = held.value;
        });
        return node;
      };
      const px = fwidth(w.x);
      const now = held.value ?? new THREE.DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1);
      const s1 = follow(texture(now, w));
      const s2 = follow(texture(now, turn(w).mul(0.31).add(0.17)));
      const k1 = float(1).sub(smoothstep(0.004, 0.03, px)).mul(float(1).sub(wet.mul(0.6)));
      const k2 = float(1).sub(smoothstep(0.012, 0.09, px)).mul(float(1).sub(wet.mul(0.6)));
      col = col.mul(mix(float(1), s1.r.mul(0.6).add(0.55), k1)).mul(mix(float(1), s2.r.mul(0.4).add(0.7), k2));
    }
  }
  // Coarse sand's stones.
  {
    const sc = floor(w.mul(9));
    const stone = step(float(1).sub(look.w.mul(0.035)), sHash(sc.add(13)));
    const nearK = float(1).sub(smoothstep(0.02, 0.08, fwidth(w.x.mul(9))));
    const stony = mix(col, col.mul(vec3(0.55, 0.52, 0.48)), stone.mul(nearK).mul(float(1).sub(wet)).mul(0.8));
    col = mix(col, stony, look.w.greaterThan(0).toFloat());
  }
  // A waste area: browner drifts, bigger greyer stones, heather and wiry
  // grass through it in patches and tufts, thicker towards its edge.
  {
    const drift = gFbm(w.mul(0.18).add(71));
    let ground = col.mul(mix(vec3(0.84, 0.8, 0.74), vec3(1.05, 1.02, 0.97), smoothstep(0.3, 0.7, drift)));
    const pc = floor(w.mul(3.2));
    const pf = fract(w.mul(3.2)).sub(0.5).sub(vec2(sHash(pc.add(3)), sHash(pc.add(9))).sub(0.5).mul(0.4));
    const stone = step(0.9, sHash(pc.add(23))).mul(float(1).sub(smoothstep(0.12, 0.2, length(pf))));
    const seeStone = float(1).sub(smoothstep(0.05, 0.25, fwidth(w.x.mul(3.2))));
    ground = mix(ground, as3(PALETTE.duneStone).mul(float(0.8).add(sHash(pc.add(5)).mul(0.4))), stone.mul(seeStone).mul(0.85));
    const patchN = gNoise(w.mul(0.42).add(13)).mul(0.65).add(gNoise(w.mul(1.7).add(5)).mul(0.35));
    const byEdge = float(1).sub(smoothstep(0, 2.5, edge));
    const cover = smoothstep(float(0.6).sub(byEdge.mul(0.32)), float(0.7).sub(byEdge.mul(0.32)), patchN);
    let scrub = mix(as3(PALETTE.duneHeather), as3(PALETTE.thinGrass), smoothstep(0.35, 0.65, gNoise(w.mul(0.25).add(91))));
    scrub = scrub.mul(float(0.8).add(gNoise(w.mul(6).add(1)).mul(0.35)));
    ground = mix(ground, scrub, cover.mul(0.9).mul(float(1).sub(wet)));
    const tc = floor(w.mul(1.6));
    const tuft = step(0.86, sHash(tc.add(41))).mul(float(1).sub(smoothstep(0.1, 0.32, length(fract(w.mul(1.6)).sub(0.5)))));
    ground = mix(ground, scrub.mul(0.7), tuft.mul(float(1).sub(smoothstep(0.03, 0.15, fwidth(w.x.mul(1.6))))).mul(0.8).mul(float(1).sub(wet)));
    col = mix(col, ground, waste.greaterThan(0).toFloat());
  }
  // A ragged edge: grass biting into the sand, with its shade just inside.
  {
    const bite = gNoise(w.mul(0.8).add(41)).mul(0.55).add(gNoise(w.mul(2.6).add(7)).mul(0.45)).mul(look.x).mul(0.9);
    const grassIn = float(1).sub(smoothstep(bite.sub(0.08), bite.add(0.04), edge));
    const shade = float(1).sub(smoothstep(bite.add(0.04), bite.add(0.35), edge)).mul(look.x).mul(0.22);
    let bitten = col.mul(float(1).sub(shade.mul(float(1).sub(wet))));
    bitten = mix(bitten, as3(PALETTE.collar).mul(float(0.85).add(gNoise(w.mul(3.3)).mul(0.3))), grassIn.mul(step(0.02, bite)).mul(float(1).sub(wet)));
    col = mix(col, bitten, look.x.greaterThan(0).toFloat());
  }
  // A clean-cut edge: a sliver of soil and turf, the turf's shade inside.
  {
    const sliver = float(0.025).add(gNoise(w.mul(4).add(17)).mul(0.035));
    const aa = max(fwidth(edge), 0.004);
    const cutLine = float(1).sub(smoothstep(sliver.sub(aa), sliver.add(aa), edge));
    const under = float(1).sub(smoothstep(sliver, sliver.add(0.22), edge)).mul(0.28);
    col = col.mul(float(1).sub(under.mul(cut.x).mul(float(1).sub(wet))));
    col = mix(col, as3(PALETTE.sandLip).mul(0.62), cutLine.mul(cut.x).mul(float(1).sub(wet)));
  }
  // A soft edge: the grass thinning out into the sand.
  {
    const reach = cut.y.mul(float(0.18).add(gNoise(w.mul(0.9).add(5)).mul(0.4)));
    const thin = float(1).sub(smoothstep(0, max(reach, 1e-4), edge.add(reach.mul(0.3).mul(gNoise(w.mul(7).add(3)).sub(0.5)))));
    const patchy = mix(float(0.5), float(1), step(0.42, gNoise(w.mul(11).add(9))));
    col = mix(col, as3(PALETTE.collar).mul(float(0.8).add(gNoise(w.mul(3.1)).mul(0.35))), thin.mul(patchy).mul(float(1).sub(wet)).mul(cut.y.greaterThan(0).toFloat()));
  }
  // The lip.
  const lip = float(1).sub(smoothstep(0, ragged.mul(0.2).add(0.1), edge)).mul(float(1).sub(smoothstep(0.03, 0.12, depth))).mul(float(1).sub(wet)).mul(float(1).sub(waste));
  col = mix(col, as3(PALETTE.sandLip), lip.mul(0.7).mul(float(1).sub(cut.y)).mul(float(1).sub(cut.x.mul(0.6))));
  let colour = pow(col, vec3(2.2));

  const material = new MeshLambertNodeMaterial({ color: 0xffffff });
  if (bowl) {
    // Shaded as a bowl from its edge: its lip in shade, its faces tilted
    // in, steepest at the lip.
    colour = colour.mul(mix(float(1).sub(exp(max(edge, 0).negate().div(0.35)).mul(0.2)), float(1), wet));
    const fg = vec2(fieldAt(local.add(vec2(0.25, 0))).x.sub(edge), fieldAt(local.add(vec2(0, 0.25))).x.sub(edge)).div(0.25);
    const fall = exp(max(edge, 0).negate().div(1.1)).mul(1.8);
    const tx = normalize(modelNormalMatrix.mul(vec3(1, 0, 0)));
    const tz = normalize(modelNormalMatrix.mul(vec3(0, 0, 1)));
    material.normalNode = normalize(normalView.add(tx.mul(fg.x).add(tz.mul(fg.y)).mul(fall)));
  }
  material.colorNode = clamp(colour, 0, 1e3);
  applyNodeHooks(material, "sand");
  material.userData.sandNode = SAND_NODE_KEY;
  return material;
}
