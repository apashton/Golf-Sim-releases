// A pond's water (look/sandwater.js waterMaterial) as a node material, for
// WebGPURenderer (look/nodetwins.js): its colour the same sums - dark out
// deep, lighter, greener and browner in the shallows, a muddy margin (none
// along a wall; four times as wide across a marsh), lighter looked down
// into - its ripples the same two drifting sets with the gust patches
// racing downwind, glassy in the lee of the bank the wind blows off, and,
// on High, rain's rings; running water (a burn, a brook) shallow and
// clear, its ripples carried downstream; none of it on a green it
// gives way to. Lit as WebGL's is - three's own standard material (a
// "physical" one would read properties off the material on the mesh, the
// WebGL one, which hasn't them) with the water's own changes to its light
// (WaterLighting): the sun's sheen turned down, the sky in it a soft
// green-grey sheen, dimmer and greener seen low across it, less in a gust,
// the far bank's trees and earth a band along its far side, never brighter
// than the fairway would be in the same light nor darker than a share of
// it, and on High the glints. And Ultra's: its living water - the edge
// lapping, the light's threads on the bed of the shallows, a ball's rings
// spreading - and the trees and banks mirrored in it (look/mirrors.js:
// its picture, drawn from under the water, read as WebGL's water reads
// it).

import * as THREE from "three";
import { MeshStandardNodeMaterial, PhysicalLightingModel } from "three/webgpu";
import { abs, attribute, cameraPosition, clamp, cameraViewMatrix, cos, diffuseColor, dot, exp, float, floor, fract, fwidth, length, materialRoughness, max, min, mix, mod, modelWorldMatrix, normalView, normalize, positionLocal, positionView, positionViewDirection, positionWorld, pow, reference, select, sin, smoothstep, sqrt, step, texture, varying, vec2, vec3, vec4 } from "three/tsl";
import { PALETTE, WATER_LIT_CAP, WATER_LIT_FLOOR, WATER_LOW, linearLum, rgb } from "../palette.js";
import { CUT_RANGE, WALL_RANGE } from "../../sim/edgefield.mjs";
import { RIPPLE, WATER_LEE, WATER_RUN } from "../../sim/mirrorreach.mjs";
import { SPLASH } from "../../sim/ultra.mjs";
import { gFbm, gHash, gNoise } from "./groundnode.js";
import { applyNodeHooks } from "./nodehooks.js";

export const WATER_NODE_KEY = "wn11";

const as3 = (hex) => vec3(...rgb(hex));
const lin3 = (hex) => vec3(...rgb(hex).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)));
const LUMA = vec3(0.2126, 0.7152, 0.0722);
const turn = (w) => vec2(w.x.mul(0.8).add(w.y.mul(0.6)), w.x.mul(-0.6).add(w.y.mul(0.8)));

// The water's changes to three's light (sandwater.js: its light loop and
// what comes after): w holds the water's own numbers where it's drawn.
class WaterLighting extends PhysicalLightingModel {
  constructor(w) {
    super();
    this.w = w;
    this.glint = vec3(0).toVar("wGlint");
  }

  start(builder) {
    super.start(builder);
    // (Begun before the lights: each adds its glints.)
    this.glint.assign(vec3(0));
  }

  direct(input, builder) {
    super.direct(input, builder);
    if (!this.w.fine) return;
    // Glints: tiny, bright catches of the sun on the ripples (none in
    // shadow: the light's colour has its shadow in it), only in one small
    // patch in ten, and only with the sun out.
    const { lightDirection, lightColor } = input;
    const hv = normalize(lightDirection.add(positionViewDirection));
    const g = pow(max(dot(normalView, hv), 0), 1800);
    this.glint.addAssign(lightColor.mul(g).mul(2).mul(this.w.sparse).mul(float(1).sub(this.w.shore)).mul(smoothstep(0.5, 0.9, this.w.sun)));
  }

  // (After three's lights and its sum of them, outgoingLight: the parts
  // changed here and the sum worked out again.)
  finish(builder) {
    super.finish(builder);
    const { reflectedLight: r, outgoingLight } = builder.context;
    const { shore, deep, low, gust, band, mirror, living } = this.w;
    // The sun's broad sheen turned well down: the glints are the sparkle.
    r.directSpecular.mulAssign(0.35);
    // The sky in it as a soft green-grey sheen, never a blue mirror, never
    // brighter than a sheen; none at the muddy margin, less in the
    // shallows; nor the sun's sheen at the margin.
    // (A brook's more of it, and bluer: WATER_SHEEN.)
    const sky = r.indirectSpecular.mul(this.w.sheen.z);
    const skyLum = dot(sky, LUMA);
    const soft = mix(vec3(skyLum), sky, this.w.sheen.x).mul(min(float(1), this.w.sheen.y.div(max(skyLum, 1e-4))));
    r.indirectSpecular.assign(soft.mul(as3(PALETTE.waterSheen)).mul(float(1).sub(shore)).mul(deep.mul(0.65).add(0.35)));
    r.directSpecular.mulAssign(float(1).sub(shore));
    // Seen low across it: the trees and far bank, not the pale sky - close
    // to, still the sky's sheen (WATER_LOW).
    const lowK = smoothstep(WATER_LOW.from, mix(float(WATER_LOW.near), float(WATER_LOW.far), smoothstep(WATER_LOW.nearAt, WATER_LOW.farAt, length(positionView))), low);
    r.indirectSpecular.mulAssign(mix(vec3(0.08, 0.11, 0.085), vec3(1), lowK));
    r.directSpecular.mulAssign(mix(float(0.15), float(1), lowK));
    // A gust patch is darker.
    r.indirectSpecular.mulAssign(float(1).sub(gust.mul(0.6)));
    r.directSpecular.mulAssign(float(1).sub(gust.mul(0.4)));
    r.indirectDiffuse.mulAssign(float(1).sub(gust.mul(0.15)));
    r.directDiffuse.mulAssign(float(1).sub(gust.mul(0.15)));
    // The far bank's band.
    r.indirectSpecular.mulAssign(float(1).sub(band.mul(0.85)));
    r.directSpecular.mulAssign(float(1).sub(band.mul(0.8)));
    // Never brighter than the fairway in the same light (a share of it),
    // the band's trees and earth lit as the water is; the glints on top.
    let out = r.directDiffuse.add(r.indirectDiffuse).add(r.directSpecular).add(r.indirectSpecular);
    const light = dot(r.directDiffuse.add(r.indirectDiffuse), LUMA).div(max(dot(diffuseColor.rgb, LUMA), 1e-4));
    const cap = float(WATER_LIT_CAP).mul(dot(lin3(PALETTE.fairway[0]), LUMA)).mul(light);
    // On Ultra, the trees and banks round it mirrored in it (look/
    // mirrors.js): broken up by the ripples, more the lower it's seen, a
    // little darker than what it mirrors, none at the muddy margin - and
    // where nothing's mirrored (the sky) as without. The far bank's band
    // not where they're mirrored for real.
    let mirA = float(0);
    if (mirror) {
      mirA = mirror.a.mul(float(1).sub(shore)).mul(mirror.k);
      const fres = mix(float(0.35), float(0.8), float(1).sub(smoothstep(0.02, 0.6, low)));
      out = mix(out, mirror.rgb.mul(0.7), mirA.mul(fres).mul(float(1).sub(gust.mul(0.5))));
    }
    out = mix(out, lin3(PALETTE.waterBankTrees).mul(max(light, 0.2)), band.mul(0.7).mul(float(1).sub(mirA)));
    // Nor darker than a share of it (WATER_LIT_FLOOR), made up in deep
    // water's own dark teal: dark water, not a hole.
    const floorLit = float(WATER_LIT_FLOOR).mul(dot(lin3(PALETTE.fairway[0]), LUMA)).mul(light);
    out = out.add(lin3(PALETTE.waterFloor).mul(max(floorLit.sub(dot(out, LUMA)), 0).div(linearLum(PALETTE.waterFloor))));
    const lit = dot(out, LUMA);
    out = out.mul(select(lit.greaterThan(cap), cap.div(max(lit, 1e-6)), float(1)));
    if (living) {
      // Caustics: the sun's light on the bed of the shallows in moving
      // threads - only in the sun, only near enough to see them - the light
      // reaching the bed, on its own colour.
      const sunOnBed = r.directDiffuse.div(max(dot(diffuseColor.rgb, LUMA), 1e-3));
      out = out.add(sunOnBed.mul(vec3(0.85, 0.92, 0.75)).mul(min(living.caustic, 1.5)).mul(0.35).mul(living.causticK));
      // A ball's rings: their crests catch the sky, a faint sheen.
      out = out.add(vec3(0.85, 0.9, 0.88).mul(cap).mul(0.45).mul(min(living.ring, 1)));
    }
    out = out.add(this.glint);
    outgoingLight.assign(out);
  }
}

// Light through the ripples, gathered into bright threads on the bed of
// the shallows (WebGL's wCaustic: folded sine waves).
function caustic(p, t) {
  let i = p;
  let c = float(1);
  for (let n = 0; n < 3; n++) {
    const tt = t.mul(1 - 3.5 / (n + 1));
    i = p.add(vec2(cos(tt.sub(i.x)).add(sin(tt.add(i.y))), sin(tt.sub(i.y)).add(cos(tt.add(i.x)))));
    c = c.add(float(1).div(length(vec2(p.x.div(sin(i.x.add(tt)).div(0.005)), p.y.div(cos(i.y.add(tt)).div(0.005))))));
  }
  const cc = float(1.17).sub(pow(c.div(3), 1.4));
  return pow(abs(cc), 8);
}

// The picture a pond's mirrored in (look/mirrors.js), as a texture node
// kept to its uniform: the reflections set the uniform to this frame's
// picture as they draw it; until there's one, a clear pixel (nothing
// mirrored).
let clear = null;
function mirrorPicture(u) {
  if (!clear) {
    clear = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
    clear.magFilter = clear.minFilter = THREE.LinearFilter;
    clear.needsUpdate = true;
  }
  const node = texture(u.wMirror.value ?? clear);
  let value = u.wMirror.value;
  Object.defineProperty(u.wMirror, "value", {
    configurable: true,
    enumerable: true,
    get: () => value,
    set: (t) => {
      value = t;
      if (t) node.value = t;
    },
  });
  return node;
}

// uniforms: the WebGL material's; field: { wall, cut } what its field
// holds, or null (all open water); marsh: a wetland edge (its field's);
// fine: High's second set of ripples, rain's rings and the glints; living,
// mirror: Ultra's (its uniforms' wSplash and wMirror...); envMap: the sky's
// reflection on the WebGL material (three draws a material's reflection
// only if its node version has one too; the one drawn is the WebGL
// material's own, so a new sky's is followed).
export function waterNodeMaterial({ uniforms: u, field = null, marsh = false, fine = false, living = false, mirror = false, brook = false, run = false, envMap = null }) {
  const U = (name, type) => reference("value", type, u[name]);
  const local = positionLocal.xz;
  const w = positionWorld.xz;
  const box = field ? U("sFieldBox", "vec4") : null;
  const range = field ? U("sFieldRange", "vec2") : null;
  const at = (p) => texture(u.sField.value, p.sub(box.xy).div(box.zw));
  const edgeAt = (p) => range.x.add(at(p).r.mul(range.y.sub(range.x)));

  // How far in from the edge (metres, before it's made ragged).
  const edgeD = field ? edgeAt(local).mul(U("wEdgeScale", "float")) : float(8);
  let d = edgeD;
  if (marsh) {
    // Across a wetland edge, the shallows and mud four times as wide.
    const m = U("wMarsh", "vec4");
    const arc = U("wMarshArc", "vec2");
    d = d.div(mix(float(1), float(4), smoothstep(arc.x, arc.y, dot(normalize(w.sub(m.xy).add(1e-4)), m.zw))));
  }
  d = d.add(gNoise(w.mul(0.3)).sub(0.5).mul(1.6));
  const wDeep = smoothstep(0.3, 6, d);
  let col = mix(as3(PALETTE.waterShallow), as3(PALETTE.waterDeep), wDeep);
  col = col.mul(float(0.9).add(gNoise(w.mul(0.05).add(7)).mul(0.2)));
  if (run) {
    // Running water, shallow and clear: its stony bed through it, its own
    // colour in its pools (WATER_RUN), as on WebGL.
    const pool = smoothstep(WATER_RUN.poolFrom, WATER_RUN.poolTo, gNoise(w.mul(0.12).add(31)));
    const bed = as3(PALETTE.runBed).mul(float(0.8).add(gFbm(w.mul(2.2)).mul(0.4))).mul(mix(float(1), float(0.62), smoothstep(0.62, 0.74, gNoise(w.mul(5).add(3)))));
    col = mix(mix(bed, as3(PALETTE.waterShallow), WATER_RUN.tint), col, clamp(float(WATER_RUN.clear).add(wDeep.mul(pool)), 0, 1));
  }
  // Looked down into, the light scattered back up from inside it.
  const upView = normalize(cameraViewMatrix.mul(vec4(0, 1, 0, 0)).xyz);
  const toEye = normalize(positionView.negate());
  const wUp = dot(upView, toEye);
  col = mix(col, col.mul(1.5).add(as3(PALETTE.waterBody)), smoothstep(0.25, 0.85, wUp).mul(wDeep));
  let wShore = float(1).sub(smoothstep(0, 0.9, d));
  if (field?.wall) {
    const wallD = at(local).a.mul(WALL_RANGE);
    wShore = wShore.mul(smoothstep(0.2, 1, wallD));
    col = col.mul(mix(float(0.62), float(1), smoothstep(0, 0.5, wallD)));
  }
  col = mix(col, as3(PALETTE.waterMud), wShore);
  // Living water (Ultra, with a field): the edge laps - a soft, wet line
  // just out from the mud, coming and going - and the bed of the shallows
  // just past it, where the light's threads show.
  let shallowBed = float(0);
  if (living && field) {
    const lap = sin(U("wTime", "float").mul(0.9).add(gNoise(w.mul(0.4)).mul(6))).mul(0.22).add(0.65);
    const line = float(1).sub(smoothstep(0, 0.18, abs(d.sub(lap))));
    col = mix(col, as3(PALETTE.waterShallow).mul(1.35), line.mul(0.35));
    shallowBed = smoothstep(0.4, 1.2, d).mul(float(1).sub(smoothstep(1.5, 4.5, d)));
  }

  // The ripples: two sets drifting their own ways, calmer far off and in
  // the margin; gust patches darker and choppier, racing downwind; on
  // High, a ring where each drop of rain lands.
  const ripple = u.wRipple.value;
  const warp = vec2(gNoise(w.mul(0.035)), gNoise(w.mul(0.035).add(13))).mul(6);
  let slope = texture(ripple, w.add(warp).mul(0.075).sub(U("wDriftA", "vec2"))).xy.mul(2).sub(1).mul(RIPPLE.coarse);
  if (run) {
    // Running: finer, drawn out along the flow and carried downstream
    // (WATER_RUN), turned back to the world's way.
    const flow = U("wFlow", "vec3");
    const fd = flow.xy;
    const fn = vec2(fd.y.negate(), fd.x);
    const fp = vec2(dot(w, fd).sub(U("wTime", "float").mul(flow.z)).mul(WATER_RUN.stretch), dot(w, fn));
    const fa = texture(ripple, fp.add(warp).mul(0.075 * WATER_RUN.scale)).xy.mul(2).sub(1);
    slope = fd.mul(fa.x).add(fn.mul(fa.y)).mul(RIPPLE.coarse);
  }
  if (fine) {
    const b = texture(ripple, turn(w).sub(warp.yx).mul(0.21).sub(turn(U("wDriftB", "vec2")))).xy.mul(2).sub(1);
    slope = slope.add(b.mul(RIPPLE.fine));
  }
  const far = smoothstep(0.005, 0.12, fwidth(w.x.mul(0.21)));
  const wind = U("wWindDir", "vec2");
  // In the lee of the bank the wind blows off, glassy (WATER_LEE), as on WebGL.
  let wLee = float(0);
  if (field && !brook) {
    const step0 = U("wFarBank", "vec4").z;
    const scale = U("wEdgeScale", "float");
    const lfs = vec2(edgeAt(local.add(vec2(step0, 0))), edgeAt(local.add(vec2(0, step0)))).mul(scale).sub(edgeD);
    const axis = normalize(modelWorldMatrix.mul(vec4(1, 0, 0, 0)).xz.add(vec2(1e-6, 0)));
    const lgw = vec2(axis.x.mul(lfs.x).sub(axis.y.mul(lfs.y)), axis.y.mul(lfs.x).add(axis.x.mul(lfs.y)));
    const offBank = dot(lgw.div(max(length(lgw), 1e-4)), wind);
    wLee = smoothstep(0, 0.6, offBank).mul(float(1).sub(smoothstep(WATER_LEE.near, WATER_LEE.reach, edgeD))).mul(U("wWindK", "float")).mul(step(1e-4, length(lfs)));
  }
  const gq = w.sub(U("wGustOff", "vec2")).mul(0.05);
  const gn = gNoise(vec2(dot(gq, wind).mul(0.55), dot(gq, vec2(wind.y.negate(), wind.x))).add(17));
  const gK = U("wGustK", "float");
  const wGp = smoothstep(0.52, 0.82, gn).mul(gK).mul(float(1).sub(wShore)).mul(gK.greaterThan(0).toFloat()).mul(float(1).sub(wLee));
  slope = slope.mul(float(1).sub(far.mul(0.8))).mul(float(1).sub(wShore.mul(0.9))).mul(U("wChop", "float")).mul(float(1).add(wGp.mul(RIPPLE.gust))).mul(float(1).sub(wLee.mul(WATER_LEE.calm)));
  if (fine) {
    const rain = U("wRain", "float");
    const time = U("wTime", "float");
    const rc = w.mul(2);
    const ci = floor(rc);
    const h = gHash(ci);
    const dv = fract(rc).sub(0.5).sub(vec2(gHash(ci.add(3.1)), gHash(ci.add(7.7))).sub(0.5).mul(0.4));
    const age = fract(time.mul(0.8).add(h.mul(7)));
    const rd = length(dv);
    const ring = float(1).sub(smoothstep(0, 0.06, abs(rd.sub(age.mul(0.42))))).mul(float(1).sub(age)).mul(step(h, rain.mul(0.85)));
    slope = slope.add(dv.div(max(rd, 1e-3)).mul(ring).mul(RIPPLE.rain).mul(float(1).sub(far)).mul(float(1).sub(wShore)).mul(rain.greaterThan(0).toFloat()));
  }
  // Where a ball's gone in (Ultra): rings spreading out (sim/ultra.mjs
  // splashRings - the same sums), their crests a faint sheen (ring).
  let ring = float(0);
  if (living) {
    const time = U("wTime", "float");
    const splashes = reference("value", "vec4", u.wSplash);
    for (let si = 0; si < SPLASH.most; si++) {
      const sp = splashes.element(si);
      const age = time.sub(sp.z);
      const live = sp.w.greaterThan(0).and(age.greaterThanEqual(0)).and(age.lessThan(SPLASH.life)).toFloat();
      const dv = w.sub(sp.xy);
      const rd = length(dv);
      const fade = pow(max(float(1).sub(age.div(SPLASH.life)), 0), 2).mul(sp.w).mul(live);
      for (let ri = 0; ri < SPLASH.rings; ri++) {
        // (A ring not yet started counts nothing: WebGL's loop stops
        // there. Its sums kept to numbers all the same.)
        const a0 = age.sub(ri * SPLASH.gap);
        const on = a0.greaterThanEqual(0).toFloat();
        const a = max(a0, 0);
        const radius = a.mul(SPLASH.speed).mul(sp.w.mul(0.4).add(0.6));
        const k = fade.mul(1 - ri * RIPPLE.ringFade).mul(on);
        const x = rd.sub(radius).div(a.mul(0.03).add(0.07));
        slope = slope.add(dv.div(max(rd, 1e-3)).mul(x.negate().mul(exp(x.mul(x).negate()))).mul(k).mul(RIPPLE.splash).mul(float(1).sub(wShore)));
        ring = ring.add(exp(x.mul(x).mul(-2)).mul(k).mul(float(1).sub(wShore)));
      }
    }
  }
  const nw = normalize(vec3(slope.x.negate(), 1, slope.y.negate()));
  const normal = normalize(cameraViewMatrix.mul(vec4(nw, 0)).xyz);

  const material = new MeshStandardNodeMaterial({ color: 0xffffff });
  if (envMap) material.envMap = envMap;
  material.colorNode = pow(max(col, vec3(0)), vec3(2.2));
  material.normalNode = normal;
  // The muddy margin is matt: no bright line of reflected sky.
  material.roughnessNode = mix(materialRoughness, float(0.7), wShore);

  // The far bank's band: how steeply the water's seen and how far on the
  // bank is that way, broken up by the ripples.
  const wLow = dot(upView, toEye);
  let band = float(0);
  const tanLow = wLow.div(sqrt(max(float(1).sub(wLow.mul(wLow)), 1e-4)));
  const fb = U("wFarBank", "vec4");
  if (brook) {
    // A brook's: which way across it the eye looks, and how far on the
    // bank is that way, from how far from its middle this is (its own
    // values a corner: course/holescenery.js drawBrook).
    const across = normalize(varying(attribute("bAcross", "vec2"), "vAcross").add(1e-6));
    const side = varying(attribute("bSide", "float"), "vSide");
    const c = dot(normalize(w.sub(cameraPosition.xz).add(1e-4)), across);
    const halfW = fb.w.mul(0.5);
    const on = select(c.greaterThan(0), max(halfW.sub(side), 0).div(max(c, 0.05)), max(halfW.add(side), 0).div(max(c.negate(), 0.05)));
    const along = on.add(dot(normal.xy, vec2(6, 4)).mul(fb.y).div(11));
    band = float(1).sub(smoothstep(0.7, 1.35, tanLow.mul(along.add(fb.x)).div(fb.y))).mul(smoothstep(0.08, 0.35, abs(c))).mul(float(1).sub(wShore));
  } else if (field) {
    // (A pond's: from how far it is to its edge, and that distance's slope.)
    const scale = U("wEdgeScale", "float");
    const fs = vec2(edgeAt(local.add(vec2(fb.z, 0))), edgeAt(local.add(vec2(0, fb.z)))).mul(scale).sub(edgeD);
    const axis = normalize(modelWorldMatrix.mul(vec4(1, 0, 0, 0)).xz.add(vec2(1e-6, 0)));
    const gw = vec2(axis.x.mul(fs.x).sub(axis.y.mul(fs.y)), axis.y.mul(fs.x).add(axis.x.mul(fs.y)));
    const look = w.sub(cameraPosition.xz);
    const towards = dot(normalize(look.add(1e-4)), gw.div(max(length(gw), 1e-4))).negate();
    const along = edgeD.div(scale).div(max(towards, 0.05)).add(dot(normal.xy, vec2(6, 4)).mul(fb.y).div(11));
    band = float(1).sub(smoothstep(0.7, 1.35, tanLow.mul(along.add(fb.x)).div(fb.y))).mul(smoothstep(0.08, 0.35, towards)).mul(step(0.01, length(fs))).mul(float(1).sub(wShore));
  }
  const cell = floor(w.mul(2.5));
  const sparse = step(0.9, fract(sin(dot(cell, vec2(12.9898, 78.233))).mul(43758.5453)));
  // Ultra: the trees and banks mirrored (look/mirrors.js) - its picture,
  // read where WebGL's water reads it, through the matrix it was drawn
  // with, bent by the ripples.
  let mirrored = null;
  if (mirror) {
    const pic = mirrorPicture(u);
    const mc = U("wMirrorMatrix", "mat4").mul(vec4(positionWorld, 1));
    const at = clamp(mc.xy.div(mc.w).add(normal.xy.sub(upView.xy).mul(RIPPLE.mirror)), 0.001, 0.999);
    // (Read top-down, as three reads every picture: WebGL's from the bottom.)
    const mir = pic.sample(vec2(at.x, float(1).sub(at.y)));
    mirrored = { rgb: mir.rgb, a: mir.a, k: U("wMirrorK", "float") };
  }
  // Ultra: the light's threads on the bed (only near and in the sun).
  let livingLight = null;
  if (living) {
    const near = float(1).sub(smoothstep(0.004, 0.04, fwidth(positionWorld.x.mul(0.7))));
    const causticK = shallowBed.mul(near).mul(smoothstep(0.5, 0.9, U("wSun", "float"))).mul(float(1).sub(wGp));
    const cp = mod(w.mul(0.7), 6.2832).sub(250);
    livingLight = { caustic: caustic(cp, U("wTime", "float").mul(0.35).add(23)), causticK, ring };
  }
  const lighting = { shore: wShore, deep: wDeep, low: wLow, gust: wGp, band, sparse, sun: U("wSun", "float"), sheen: U("wSheen", "vec3"), fine, mirror: mirrored, living: livingLight };
  material.setupLightingModel = () => new WaterLighting(lighting);
  if (field?.cut) material.maskNode = at(local).g.mul(2 * CUT_RANGE).sub(CUT_RANGE).greaterThanEqual(0);
  applyNodeHooks(material, "water");
  material.userData.waterNode = WATER_NODE_KEY;
  return material;
}
