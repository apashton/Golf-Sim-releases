// The grass colour as a node material: the same recipe as look/glsl/ground.js
// and the fragment block in look/grass.js. The game still draws with the
// WebGL shader. This is what a node material will use once the renderer
// switches. It does not yet draw puddle reflections, rain-drop glints, wet
// sheen, or the country picture. Those need the lit colour and the country
// map, which the notes for the next patch name. Changing the sums here must
// change GROUND_NODE_KEY.

import * as THREE from "three";
import { MeshLambertNodeMaterial } from "three/webgpu";
import {
  abs,
  attribute,
  cameraPosition,
  cameraViewMatrix,
  clamp,
  distance,
  dot,
  float,
  floor,
  fract,
  fwidth,
  length,
  max,
  min,
  mix,
  normalize,
  normalView,
  positionWorld,
  reference,
  sin,
  smoothstep,
  texture,
  transpose,
  uniform,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import { onLayer } from "../grass.js";
import { PALETTE, WET, rgb } from "../palette.js";
import { watchGround } from "./ground.js";
import { applyNodeHooks } from "./nodehooks.js";
import { GRAIN_LOOK } from "../../sim/rolls.mjs";
import { NEAR_FLOOR } from "../../sim/tufts.mjs";
import { HIGH } from "../quality.js";

export const GROUND_NODE_KEY = "gn2";

const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lin3 = (hex) => vec3(...rgb(hex).map(lin));
const STRAW = lin3(PALETTE.straw);
const DAISY = lin3(PALETTE.daisy);
const DANDELION = lin3(PALETTE.dandelion);
const CLOVER = vec3(0.8, 0.95, 1.02);
const LUMA = vec3(0.2126, 0.7152, 0.0722);

const gWindDir = uniform(new THREE.Vector2(1, 0));
const gWindOff = uniform(0);
const gWindK = uniform(0);
export const gWet = uniform(0);
const gDry = uniform(0);
const gFarRough = uniform(new THREE.Vector4(0, 1, 2, 3));
const gFarRoughK = uniform(0);

watchGround((u) => {
  const dir = u.gWindDir.value;
  gWindDir.value.set(dir[0], dir[1]);
  gWindOff.value = u.gWindOff.value;
  gWindK.value = u.gWindK.value;
  gWet.value = u.gWet.value;
  gDry.value = u.gDry.value;
  const far = u.gFarRough.value;
  gFarRough.value.set(far[0], far[1], far[2], far[3]);
  gFarRoughK.value = u.gFarRoughK.value;
});

export function gHash(p) {
  const q = fract(p.mul(vec2(123.34, 456.21)));
  const q2 = q.add(dot(q, q.add(45.32)));
  return fract(q2.x.mul(q2.y));
}

export function gNoise(p) {
  const i = floor(p);
  const f = fract(p);
  const u = f.mul(f).mul(float(3).sub(f.mul(2)));
  const a = mix(gHash(i), gHash(i.add(vec2(1, 0))), u.x);
  const b = mix(gHash(i.add(vec2(0, 1))), gHash(i.add(vec2(1, 1))), u.x);
  return mix(a, b, u.y);
}

export function gFbm(p) {
  return gNoise(p).mul(0.5).add(gNoise(p.mul(2.03)).mul(0.25)).add(gNoise(p.mul(2.03 * 2.03)).mul(0.125));
}

function gLuma(c) {
  return dot(c, LUMA);
}

function gStraw(grass, p, k) {
  const s = gDry.mul(k).mul(smoothstep(0.48, 0.74, p));
  const straw = STRAW.mul(gLuma(grass).div(gLuma(STRAW))).mul(1.06);
  return mix(grass, straw, s.mul(0.6));
}

export function gWetGround(grass) {
  return grass.mul(mix(float(1), float(WET), gWet));
}

export function gRoughPatches(grass, w, k) {
  const big = gFbm(w.mul(0.07).add(41));
  const clump = gNoise(w.mul(0.45).add(7));
  const drift = gNoise(w.mul(0.16).add(3));
  const wobble = clump.sub(0.5).mul(0.14).add(drift.sub(0.5).mul(0.1));
  const darkP = smoothstep(0.46, 0.62, big.add(wobble));
  const lightP = smoothstep(0.52, 0.66, float(1).sub(big).add(wobble));
  let out = grass.mul(float(1).sub(k.mul(0.36).mul(darkP)));
  out = out.mul(mix(vec3(1, 1, 1), vec3(0.93, 1, 1.06), k.mul(darkP)));
  out = mix(out, out.mul(vec3(1.24, 1.17, 0.92)), k.mul(lightP));
  out = out.mul(float(1).add(k.mul(0.18).mul(clump.sub(0.5))));
  const clover = smoothstep(0.66, 0.74, clump).mul(float(1).sub(lightP)).mul(smoothstep(0.45, 0.65, drift));
  out = mix(out, out.mul(CLOVER), min(k, float(1)).mul(clover));
  const swathe = gFbm(w.mul(0.022).add(13)).sub(0.44);
  out = out.mul(float(1).add(k.mul(0.24).mul(swathe)));
  const kk = min(k, float(1.5));
  out = mix(out, out.mul(vec3(1.1, 1.04, 0.8)), kk.mul(0.55).mul(smoothstep(0.02, 0.2, swathe)));
  out = mix(out, out.mul(vec3(0.9, 1, 1.08)), kk.mul(0.5).mul(smoothstep(-0.02, -0.18, swathe)));
  return out;
}

export function gGrassBase(grass, w, amount, patchScale, tint) {
  const n = gFbm(w.mul(patchScale));
  let out = grass.mul(float(1).add(amount.mul(n.sub(0.5)).mul(2)));
  out = out.mul(mix(vec3(0.8, 0.86, 0.95), vec3(1.14, 1.1, 0.88), gNoise(w.mul(0.006).add(31))));
  out = out.mul(float(1).add(amount.mul(0.55).mul(gNoise(w.mul(0.06).add(5)).add(gNoise(w.mul(0.17).add(9)).mul(0.6)).sub(0.8)).mul(1.25)));
  const parched = gFbm(w.mul(patchScale).mul(0.55).add(17));
  const dry = smoothstep(0.42, 0.78, parched);
  out = mix(out, out.mul(vec3(1.1, 1.03, 0.7)), dry.mul(tint).mul(float(1).sub(gWet.mul(0.7))));
  const lush = gNoise(w.mul(patchScale).mul(2.7).add(5));
  out = out.mul(mix(vec3(1, 1, 1), vec3(0.9, 1, 1.06), lush.mul(tint)));
  return gStraw(out, parched, smoothstep(0.3, 0.45, tint));
}

export function gWindWaves(grass, w, world, k) {
  const u = dot(w, gWindDir).sub(gWindOff);
  const across = vec2(gWindDir.y.negate(), gWindDir.x);
  const v = dot(w, across);
  let b = min(float(1), smoothstep(0.5, 0.85, gNoise(vec2(u.mul(0.085), v.mul(0.022)).add(23))).mul(gWindK).mul(k));
  const reach = max(float(1), k.mul(0.8));
  b = b.mul(float(1).sub(smoothstep(reach.mul(200), reach.mul(300), distance(world.xz, cameraPosition.xz))));
  const pale = vec3(gLuma(grass));
  const lifted = mix(grass, pale, float(0.3).add(float(0.08).mul(max(float(0), k.sub(1))))).mul(float(1).add(float(0.045).mul(max(float(1), k))));
  const waved = mix(grass, lifted, b);
  return mix(grass, waved, gWindK.mul(k).greaterThan(0).toFloat());
}

function gMow(t) {
  const e = clamp(fwidth(t).mul(1.5), 0.02, 0.5);
  return smoothstep(float(0.5).sub(e), float(0.5).add(e), abs(fract(t).sub(0.5)).mul(2));
}

function gWaver(w) {
  return gNoise(w.mul(0.045)).sub(0.5).mul(0.3);
}

function gMowing(w, dir, width, kind, centre) {
  const wv = gWaver(w);
  const rings = gMow(length(w.sub(centre)).div(width).add(wv));
  const s = w.sub(centre);
  const a = gMow(dot(s, dir).div(width).add(wv));
  const checked = a.add(gMow(dot(s, vec2(dir.y.negate(), dir.x)).div(width).add(wv.mul(0.8)))).mul(0.5);
  const striped = mix(a, checked, kind.greaterThan(0.5).toFloat());
  return mix(striped, rings, kind.greaterThan(1.5).toFloat());
}

// GLSL mat2(a, b, c, d) is column-major. Turns a vec2 by it.
function mul2(a, b, c, d, v) {
  return vec2(v.x.mul(a).add(v.y.mul(c)), v.x.mul(b).add(v.y.mul(d)));
}

function gFarRoughLook(grass, w, world, k, fineOn) {
  const fine = fineOn ? float(1).sub(smoothstep(0.08, 0.35, fwidth(w.x.mul(2.6)))) : float(0);
  // (Height and all, as ground.js's: from the air the rough under the
  // camera is standing grass too.)
  const dist = distance(world, cameraPosition);
  const on = smoothstep(gFarRough.x, gFarRough.y, dist).mul(float(1).sub(smoothstep(gFarRough.z, gFarRough.w, dist)));
  const a = on.mul(gFarRoughK).mul(min(k, float(1.5)));
  const c = mix(float(0.5), gNoise(w.mul(2.6).add(13)), fine).mul(0.45).add(gNoise(w.mul(0.9).add(41)).mul(0.55));
  let top = smoothstep(0.3, 0.72, c);
  const toEye = normalize(cameraPosition.sub(world));
  const graze = float(1).sub(smoothstep(0.04, 0.45, toEye.y));
  top = mix(top, float(1), graze.mul(0.55));
  let col = grass.mul(mix(float(0.78), float(1.12), top));
  const wave = float(0.5).add(float(0.5).mul(sin(dot(world.xz, gWindDir).mul(1.7).sub(gWindOff.mul(1.7)).add(world.x.mul(0.3)))));
  col = mix(col, vec3(gLuma(col)).mul(1.12), float(0.25).mul(wave).mul(gWindK).mul(top));
  const mixed = mix(grass, col, a);
  return mix(grass, mixed, on.mul(k).mul(gFarRoughK).greaterThan(0).toFloat());
}

function gFlowers(grass, w, k) {
  const show = k.mul(float(1).sub(smoothstep(0.006, 0.016, fwidth(w.x))));
  const cell = floor(w.div(0.3));
  const f = fract(w.div(0.3));
  const h = gHash(cell.add(71.3));
  const drift = gHash(floor(w.div(7)).add(5.1));
  const at = vec2(0.25, 0.25).add(vec2(fract(h.mul(37.1)), fract(h.mul(91.7))).mul(0.5));
  const r = length(f.sub(at)).mul(0.3);
  const bloom = float(1).sub(smoothstep(0.012, 0.018, r)).mul(show);
  let flower = mix(DANDELION, DAISY, fract(h.mul(13.7)).lessThan(0.55).toFloat());
  flower = mix(flower, DANDELION, float(1).sub(smoothstep(0.003, 0.005, r)));
  const painted = mix(grass, flower, bloom);
  const keep = show.greaterThan(0).and(h.greaterThanEqual(float(1).sub(float(0.3).mul(smoothstep(0.35, 0.85, drift)))));
  return mix(grass, painted, keep.toFloat());
}

function gDistance(grass, world) {
  const far = smoothstep(150, 800, distance(world.xz, cameraPosition.xz));
  return mix(grass, vec3(gLuma(grass)), far.mul(0.3));
}

// Blade texture reads. Returns { grass, lean } where lean is world xz.
function gBlades(grass, w, detail, scale, strength, tex, fine, hero) {
  const t1 = texture(detail, w.div(scale)).rgb;
  let d = t1.r;
  const fade = float(1).sub(smoothstep(0.02, 0.25, fwidth(w.x.div(scale))));
  let lean = vec2(0, 0);
  if (tex) lean = vec2(t1.g.mul(2).sub(1), float(1).sub(t1.b.mul(2))).mul(strength).mul(fade);
  if (fine) {
    const turned = mul2(0.8, 0.6, -0.6, 0.8, w).div(scale.mul(0.37)).add(0.31);
    const t2 = texture(detail, turned).rgb;
    const fineK = float(1).sub(smoothstep(0.02, 0.25, fwidth(w.x.div(scale.mul(0.37)))));
    d = mix(d, d.mul(t2.r).mul(1.35), fineK);
    if (tex) {
      const l2 = mul2(0.8, -0.6, 0.6, 0.8, vec2(t2.g.mul(2).sub(1), float(1).sub(t2.b.mul(2))));
      lean = lean.add(l2.mul(strength).mul(fineK).mul(0.6));
    }
    if (hero) {
      const heroScale = scale.mul(0.16);
      const heroK = float(1).sub(smoothstep(0.03, 0.2, fwidth(w.x.div(heroScale))));
      const t3uv = mul2(0.28, -0.96, 0.96, 0.28, w).div(heroScale).add(0.67);
      const t3 = texture(detail, t3uv).rgb;
      d = mix(d, d.mul(float(0.55).add(t3.r.mul(0.75))), heroK.mul(fineK));
      if (tex) {
        const l3 = mul2(0.28, 0.96, -0.96, 0.28, vec2(t3.g.mul(2).sub(1), float(1).sub(t3.b.mul(2))));
        lean = lean.add(l3.mul(strength).mul(heroK).mul(fineK).mul(0.45));
      }
    }
  }
  if (tex) grass = grass.mul(float(1).add(float(0.045).mul(strength).mul(fade)));
  grass = grass.mul(mix(float(1), float(0.45).add(d.mul(0.75)), strength.mul(fade)));
  const gone = float(1).sub(fade);
  const s7 = scale.mul(7);
  const s40 = scale.mul(40);
  const midK = float(1).sub(smoothstep(0.04, 0.3, fwidth(w.x.div(s7))));
  const farK = float(1).sub(smoothstep(0.04, 0.3, fwidth(w.x.div(s40))));
  const tm = texture(detail, mul2(0.6, 0.8, -0.8, 0.6, w).div(s7).add(0.53)).r;
  const tf = texture(detail, mul2(0.8, -0.6, 0.6, 0.8, w).div(s40).add(0.17)).r;
  const macro = mix(float(1).add(tf.sub(0.5).mul(0.55).mul(farK)), float(1).add(tm.sub(0.5).mul(0.8)), midK);
  grass = grass.mul(mix(float(1), macro, gone.mul(float(0.5).add(float(0.5).mul(min(strength, float(1)))))));
  return { grass, lean, d, fade };
}

function leanNormal(lean) {
  const n = normalView;
  let lx = cameraViewMatrix.mul(vec4(1, 0, 0, 0)).xyz;
  let lz = cameraViewMatrix.mul(vec4(0, 0, 1, 0)).xyz;
  lx = normalize(lx.sub(n.mul(dot(n, lx))));
  lz = normalize(lz.sub(n.mul(dot(n, lz))));
  return normalize(n.add(lx.mul(lean.x).add(lz.mul(lean.y)).mul(0.7)));
}

// A node material for one grass surface. Options match grassMaterial.
// fine / hero / tex follow the graphics setting the WebGL shader was built
// with (High's second blade scale, the sharp third scale, the blade lean).
// A texture uniform the WebGL material keeps ({ value }), followed as it
// changes (a new hole's country picture: country.js setCountry).
function heldTexture(held, uv) {
  const node = texture(held.value, uv);
  node.onRenderUpdate(() => {
    if (held.value && node.value !== held.value) node.value = held.value;
  });
  return node;
}

// The country picture over the grass (look/glsl/ground.js COUNTRY_GLSL):
// its colour keeping half the grass's own light and dark near to, and
// only a faint grain over the other holes' mown ground, sand and water
// (on High: their map, gCourseMap). u: the material's country uniforms.
export function gCountry(grass, world, u, fine) {
  const box = reference("value", "vec3", u.gCountryBox);
  const uv = world.xz.sub(box.xy).mul(box.z);
  const c = heldTexture(u.gCountryMap, uv);
  const paint = c.rgb.div(max(c.a, 1e-4));
  const l = dot(paint, LUMA);
  const g = dot(grass, LUMA);
  const near = float(1).sub(smoothstep(150, 400, distance(world.xz, cameraPosition.xz)));
  const grain = clamp(g.div(max(l, 1e-4)), 0.5, 1.6);
  const mown = fine ? heldTexture(u.gCourseMap, uv).r : float(0);
  const even = float(1).add(clamp(grain.sub(1), -0.06, 0.06).mul(near));
  const grained = mix(mix(paint, paint.mul(grain), near.mul(0.5)), paint.mul(even), mown);
  return mix(grass, grained, c.a.mul(c.a.greaterThan(0.001).toFloat()));
}

export function grassNodeMaterial({
  light = "#6aa640",
  dark = "#5c9637",
  stripeWidth = 8,
  stripeAngle = Math.PI / 2,
  mow = 0,
  mowDir = null,
  centre = null,
  cleanup = false,
  rim = false,
  patch = 0.22,
  patchScale = 0.03,
  detailScale = 1.2,
  detail = 0.8,
  detailMap,
  tint = 0.5,
  hole = null,
  edge = false,
  layer = 3,
  worn = 0,
  soil = "#7d6a4b",
  clumps = 0,
  settle = false,
  wind = 0,
  dune = 0,
  grain = null,
  fine = HIGH,
  hero = false,
  tex = false,
  puddleDark = false,
  country = null,
  // The twin of a ground material drawn away from the cup: no cut.
  uncut = false,
} = {}) {
  const material = onLayer(new MeshLambertNodeMaterial({ color: 0xffffff }), layer);
  if (edge) Object.assign(material, { transparent: true, depthWrite: false });
  const gLight = uniform(new THREE.Color(light));
  const gDark = uniform(new THREE.Color(dark));
  const gStripeWidth = uniform(stripeWidth);
  const dir = mowDir ?? [Math.cos(stripeAngle), Math.sin(stripeAngle)];
  const len = Math.hypot(dir[0], dir[1]) || 1;
  const gStripeDir = uniform(new THREE.Vector2(dir[0] / len, dir[1] / len));
  const gMowKind = uniform(mow);
  const gMowCentre = uniform(new THREE.Vector2(...(centre ?? [0, 0])));
  const gPatch = uniform(patch);
  const gPatchScale = uniform(patchScale);
  const gDetailScale = uniform(detailScale);
  const gDetailStrength = uniform(detail);
  const gTint = uniform(tint);
  const gHole = uniform(new THREE.Vector3(hole?.x ?? 0, hole?.z ?? 0, hole?.r ?? 0));
  const gWorn = uniform(worn);
  const gSoil = uniform(new THREE.Color(soil));
  const gClumps = uniform(clumps);
  const gWindy = uniform(wind);
  const gDune = uniform(dune);
  const gGrain = uniform(new THREE.Vector3(...(grain ? [...new THREE.Vector2(...grain).normalize().toArray(), GRAIN_LOOK.sheen] : [1, 0, 0])));
  // (detailMap: a texture, or a uniform holding one - High's blade texture,
  // swapped in when it's loaded - followed as it changes.)
  const held = detailMap?.isTexture ? null : detailMap;
  const map = texture((held ? held.value : detailMap) ?? new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1));
  if (held) map.onRenderUpdate(() => {
    if (held.value && map.value !== held.value) map.value = held.value;
  });

  const world = positionWorld;
  const w = world.xz;
  let stripe = cleanup ? float(0.62) : mix(float(0), gMowing(w, gStripeDir, gStripeWidth, gMowKind, gMowCentre), gStripeWidth.greaterThan(0).toFloat());
  if (rim) {
    const gRim = attribute("gRimIn", "float");
    stripe = mix(stripe, float(0.62), float(1).sub(smoothstep(0.55, 0.8, gRim)));
  }
  const farEase = smoothstep(settle ? 25 : 90, settle ? 110 : 240, distance(world, cameraPosition));
  const patchK = mix(gPatch, min(gPatch, float(0.2)), farEase);
  const clumpK = mix(gClumps, min(gClumps, float(0.6)), farEase);
  let grass = gGrassBase(mix(gLight, gDark, stripe), w, patchK, gPatchScale, gTint);
  grass = mix(grass, gRoughPatches(grass, w, clumpK), gClumps.greaterThan(0).toFloat());
  const look = normalize(w.sub(cameraPosition.xz).add(vec2(1e-4, 1e-4)));
  const gk = dot(look, gGrain.xy).mul(float(0.75).add(float(0.5).mul(gNoise(w.mul(0.35).add(17)))));
  grass = grass.mul(float(1).add(gGrain.z.mul(gk)));
  {
    const nW = normalize(transpose(cameraViewMatrix).mul(vec4(normalView, 0)).xyz);
    const steep = smoothstep(0.06, 0.32, float(1).sub(abs(nW.y)));
    const crest = smoothstep(0.7, 2.6, world.y);
    const hollow = float(1).sub(smoothstep(-0.5, 0.25, world.y));
    const thin = max(steep.mul(0.85), crest.mul(0.6)).mul(float(0.75).add(float(0.5).mul(gNoise(w.mul(0.35).add(61)))));
    const duned = mix(mix(grass, grass.mul(vec3(1.22, 1.12, 0.84)), gDune.mul(0.55).mul(thin)), grass.mul(vec3(0.86, 1.05, 0.88)), gDune.mul(0.5).mul(hollow));
    grass = mix(grass, duned, gDune.greaterThan(0).toFloat());
  }
  grass = mix(grass, gWindWaves(grass, w, world, gWindy), gWindy.greaterThan(0).toFloat());
  if (fine) grass = gFarRoughLook(grass, w, world, gWindy, true);
  const blades = gBlades(grass, w, map, gDetailScale, gDetailStrength, tex, fine, hero);
  grass = blades.grass;
  // Under the long grass close to, its blades bolder (sim/tufts.mjs NEAR_FLOOR).
  const floorK = float(NEAR_FLOOR.boost).mul(blades.fade).mul(blades.d.sub(NEAR_FLOOR.mean)).mul(float(1).sub(smoothstep(NEAR_FLOOR.from, NEAR_FLOOR.to, distance(world, cameraPosition))));
  grass = grass.mul(float(1).add(floorK.mul(gClumps.greaterThan(0.5).toFloat())));
  if (fine) grass = mix(grass, gFlowers(grass, w, min(gClumps, float(1))), gClumps.greaterThan(0).toFloat());
  if (edge && worn > 0) {
    const gEdge = attribute("gEdgeIn", "float");
    const scuff = gNoise(w.mul(1.1).add(11)).mul(0.55).add(gNoise(w.mul(3.7).add(3)).mul(0.45));
    const bare = smoothstep(0.7, 0.92, scuff.add(gEdge.mul(0.12))).mul(gWorn).mul(gEdge);
    const dryer = gWorn.mul(gEdge).mul(float(0.45).add(float(0.55).mul(gNoise(w.mul(0.7).add(23)))));
    grass = mix(grass, grass.mul(vec3(1.12, 1.04, 0.74)), dryer);
    const soilCol = gSoil.mul(float(0.8).add(float(0.4).mul(gNoise(w.mul(7).add(2))))).mul(mix(float(1), float(0.7).add(blades.d.mul(0.5)), blades.fade));
    grass = mix(grass, soilCol, bare);
  }
  if (settle) grass = mix(grass, mix(gLight, gDark, 0.5).mul(0.92), farEase.mul(0.75));
  // The country picture laid over it (look/country.js withCountry), before
  // the wet and the distance go over both.
  if (country) grass = gCountry(grass, world, country, fine);
  grass = gWetGround(grass);
  if (puddleDark) {
    const pn = gNoise(w.mul(0.09).add(31)).mul(0.7).add(gNoise(w.mul(0.6).add(5)).mul(0.3));
    const soak = smoothstep(float(0.78).sub(gWet.mul(0.2)), float(0.88).sub(gWet.mul(0.2)), pn).mul(gWet);
    grass = grass.mul(float(1).sub(float(0.3).mul(soak)));
  }
  grass = gDistance(grass, world);
  material.colorNode = grass;
  if (tex) material.normalNode = leanNormal(blades.lean);
  applyNodeHooks(material, "ground");
  // The cup's hole: only in the patch round the cup (look/cupcut.js - the
  // rest of the ground is drawn by its twin, made `uncut`).
  if (hole && !uncut) {
    material.maskNode = gHole.z.lessThanEqual(0).or(distance(w, gHole.xy).greaterThanEqual(gHole.z));
  }
  if (edge) {
    const gEdge = attribute("gEdgeIn", "float");
    const cut = float(0.2).add(gNoise(w.mul(0.35)).mul(0.45)).add(gNoise(w.mul(1.7)).mul(0.2));
    const wornFade = smoothstep(0.12, 0.55, gEdge.mul(float(0.2).add(gNoise(w.mul(1.3).add(7))).add(gNoise(w.mul(3.4)).mul(0.45))));
    const lineFade = smoothstep(cut.sub(0.14), cut.add(0.14), gEdge);
    material.opacityNode = worn > 0 ? wornFade : lineFade;
  }
  material.userData.groundNode = GROUND_NODE_KEY;
  return material;
}
