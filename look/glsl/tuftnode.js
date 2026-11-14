// The tufts of longer grass as node materials, for WebGPURenderer (look/
// nodetwins.js): the range's and a hole's scattered tufts (look/
// groundbits.js tuftMaterial), and a hole's tuft field, near and far (look/
// tuftfield.js). The same sums: each tuft the colour of the ground it
// stands in, layer for layer (groundbits.js TUFT_GROUND and TUFT_COLOUR -
// the ground's recipe for its grass, a links hole's dune crest and hollow,
// the country picture's patches, duller far off), worked out once a corner
// at its foot; the blades' picture only lighter and darker round that
// (eased towards it further off); see-through round the ball; cut off at
// the mower's line; lit as the ground is, its normal straight up on both
// faces; and swaying with the plants' bend. The far field's cards are
// placed, faced to the camera and thinned out as on WebGL, their blades
// worked out where they're drawn.

import { MeshLambertNodeMaterial } from "three/webgpu";
import {
  Fn,
  If,
  abs,
  attribute,
  cameraPosition,
  clamp,
  cos,
  distance,
  dot,
  float,
  floor,
  fract,
  fwidth,
  instanceIndex,
  length,
  materialColor,
  max,
  min,
  mix,
  modelWorldMatrix,
  modelWorldMatrixInverse,
  normalViewGeometry,
  positionLocal,
  positionView,
  positionWorld,
  pow,
  reference,
  screenCoordinate,
  select,
  sin,
  smoothstep,
  step,
  texture,
  uv,
  varying,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import { GRASS } from "../grass.js";
import { TUFT_BLEND, TUFT_LOD, TUFT_FIELD, GRASS_HEIGHT } from "../../sim/tufts.mjs";
import { PLANT_BEND } from "../../sim/sway.mjs";
import { CUT } from "../../sim/mowncut.mjs";
import { gCountry, gGrassBase, gRoughPatches, gWetGround, gWindWaves } from "./groundnode.js";
import { applyNodeHooks, bendDir, bendHash, bendTime, bendWave } from "./nodehooks.js";

export const TUFT_NODE_KEY = "tn5";

const LUMA = vec3(0.2126, 0.7152, 0.0722);

// A texture uniform the WebGL material keeps ({ value }), followed as it
// changes (a hole's country picture, its mower's line).
function held(u, at) {
  const node = texture(u.value, at);
  node.onRenderUpdate(() => {
    if (u.value && node.value !== u.value) node.value = u.value;
  });
  return node;
}

// A grass's colour as its ground has it - in the round's season and
// upkeep, tinted again as each hole is built (groundbits.js TUFT_GRASS,
// tintTuftGrass: tGrassCol, `i` its place) - and its recipe (groundbits.js
// recipe); u the tufts' uniforms.
const grassColour = (u, i) => reference(`value.${i}`, "color", u.tGrassCol);
const recipe = (g, i) => (w, world, u) =>
  gWindWaves(gRoughPatches(gGrassBase(grassColour(u, i), w, float(g.patch), float(g.patchScale), float(g.tint)), w, float(g.clumps)), w, world, float(g.wind));
// The tufts' codes: 0 rough, 1 deep, 2 fescue, 3 dune rough, 4 long green,
// 9 hay (sim/hay.mjs). (5 - 8, the short grass across a hole on Ultra, are
// the long grass's - look/longgrass.js - never a tuft's.)
const CODES = [
  [8.5, recipe(GRASS.hay, 9)],
  [3.5, recipe(GRASS.longGreen, 4)],
  [2.5, recipe(GRASS.duneRough, 3)],
  [1.5, recipe(GRASS.fescue, 2)],
  [0.5, recipe(GRASS.deep, 1)],
];
const ROUGH = recipe(GRASS.rough, 0);

// A tuft's whole colour where it stands (groundbits.js tColourAt): world
// its foot, deep its colour code; u the tufts' uniforms (the country's).
// (Each code's recipe only where it's that code's tuft.)
function tColourAt(world, deep, u) {
  return Fn(() => {
    const w = world.xz;
    const g = vec3(0).toVar();
    let chain = null;
    for (const [above, make] of CODES) {
      const pick = deep.greaterThan(above);
      chain = chain ? chain.ElseIf(pick, () => g.assign(make(w, world, u))) : If(pick, () => g.assign(make(w, world, u)));
    }
    chain.Else(() => g.assign(ROUGH(w, world, u)));
    g.assign(gWetGround(g));
    // A links hole's crest and hollow.
    const dune = select(deep.greaterThan(3.5), float(0.7), float(1)).mul(deep.greaterThan(1.5).and(deep.lessThan(4.5)).toFloat());
    const crest = smoothstep(0.7, 2.6, world.y).mul(0.6);
    const hollow = float(1).sub(smoothstep(-0.5, 0.25, world.y));
    g.assign(mix(g, g.mul(vec3(1.22, 1.12, 0.84)), dune.mul(0.55).mul(crest)));
    g.assign(mix(g, g.mul(vec3(0.86, 1.05, 0.88)), dune.mul(0.5).mul(hollow)));
    g.assign(gCountry(g, world, u, false));
    const far = smoothstep(150, 800, distance(world.xz, cameraPosition.xz));
    return mix(g, vec3(dot(g, LUMA)), far.mul(0.3));
  })();
}

// Pushed downwind by how high up it is (metres over its foot), squared,
// rippling as it goes: the plants' bend (glsl/bend.js PLANT).
function tBend(foot, up, along) {
  const ripple = float(1).add(float(0.25).mul(sin(bendTime.mul(4.3).add(bendHash(foot.xz).mul(6.2831853)).add(along.mul(3)))));
  return vec3(bendDir.x, 0, bendDir.y).mul(bendWave(foot, 2.1).mul(ripple).mul(PLANT_BEND).mul(up).mul(up));
}

// Where a tuft turned `turn` changes from near to far (sim/tufts.mjs
// tuftSwitch).
const tSwitchAt = (turn) => float(TUFT_LOD.near).add(float(TUFT_LOD.out - TUFT_LOD.near).mul(fract(turn.mul(0.3183099))));

// How see-through by the ball (tuftClear: x, z, radius, on), at its foot.
function tSeeAt(foot, u) {
  const c = reference("value", "vec4", u.tuftClear);
  const k = float(1).sub(smoothstep(c.z.mul(0.5), c.z, distance(foot.xz, c.xy)));
  return select(c.w.greaterThan(0.5), k, float(0));
}

// How much lighter a far-off tuft is than its colour (groundbits.js
// tuftLift); share: of the occlusion's part (a far card's FAR_FAN.aoLift).
function tLift(u, share = 1) {
  const l = reference("value", "vec4", u.tuftLift);
  return l.x.mul(float(1).add(l.y.mul(share).mul(float(1).sub(smoothstep(l.z, l.w, length(positionView))))));
}

// The pixels kept: a scatter left out round the ball, and none past the
// mower's line (look/cutline.js gMown).
function tKeep(see, u) {
  const ign = fract(float(52.9829189).mul(fract(dot(screenCoordinate.xy, vec2(0.06711056, 0.00583715)))));
  const open = see.lessThanEqual(0).or(ign.greaterThanEqual(see.mul(0.55)));
  const box = reference("value", "vec4", u.gCutBox);
  const at = positionWorld.xz.sub(box.xy).mul(box.zw);
  const inside = box.z.greaterThan(0).and(at.x.greaterThanEqual(0)).and(at.y.greaterThanEqual(0)).and(at.x.lessThanEqual(1)).and(at.y.lessThanEqual(1));
  const into = held(u.gCutMap, clamp(at, 0, 1)).r.mul(255).sub(127.5).div(127.5).mul(CUT.range);
  return open.and(inside.not().or(into.lessThanEqual(0)));
}

// The blades' picture only as lighter and darker blades round the ground's
// colour, shaded down at the foot; further off eased towards the ground's
// colour as it is (groundbits.js tuftMaterial, tuftfield.js nearMaterial).
// hay: { on, map, tint } - hay's own picture where it's on, its seed heads
// (painted bluer than any blade: groundbits.js HAY_HEAD_MARK) as seed.
// near: the near tufts' look (tuftfield.js NEAR_TUFTS) - all but the
// ground's colour at the foot, the blades' light and dark coming in as they
// rise, lighter at their tips; without it, shaded down at the foot as the
// scattered tufts are.
function pictureColour(ground, far, u, hay = null, near = null) {
  let pic = vec4(materialColor);
  if (hay) pic = select(hay.on, texture(hay.map, uv()), pic);
  const bladeShade = (lo, hi) => mix(float(lo), float(hi), smoothstep(0.1, 0.5, pic.g));
  const shade = near ? mix(float(near.base), bladeShade(...near.blades), smoothstep(0, near.foot, uv().y)) : bladeShade(0.8, 1.25).mul(mix(float(0.62), float(1.06), smoothstep(0, 0.55, uv().y)));
  let col = ground.mul(mix(shade, tLift(u), far.mul(TUFT_BLEND.most)));
  if (hay) col = mix(col, col.mul(vec3(...hay.tint)), hay.on.toFloat().mul(smoothstep(0.08, 0.3, pic.b.sub(pic.g))));
  return vec4(col, pic.a);
}

// Lit as the ground is: straight up on both faces.
function finish(material, kind, see, u) {
  material.normalNode = normalViewGeometry;
  material.maskNode = tKeep(see, u);
  applyNodeHooks(material, kind, { bend: false });
  material.userData.tuftNode = TUFT_NODE_KEY;
  return material;
}

// The scattered tufts (groundbits.js makeGrassTufts: an InstancedMesh, each
// copy's foot in tFootAt). base: three's own node version (its picture).
export function tuftsNodeMaterial({ uniforms: u }, base = null) {
  const material = base ?? new MeshLambertNodeMaterial();
  material.userData = { ...material.userData };
  const foot = modelWorldMatrix.mul(vec4(attribute("tFootAt", "vec3"), 1)).xyz;
  const deep = attribute("tDeep", "float");
  // (positionLocal is the copy's own place here: three has put it there.)
  const world = modelWorldMatrix.mul(vec4(positionLocal, 1)).xyz;
  const up = max(float(0), world.y.sub(foot.y));
  const push = tBend(foot, up, attribute("position", "vec3").x);
  material.positionNode = positionLocal.add(modelWorldMatrixInverse.mul(vec4(push, 0)).xyz);
  const ground = varying(tColourAt(foot, deep, u), "vTuftGround");
  const far = varying(smoothstep(TUFT_BLEND.from, TUFT_BLEND.to, distance(foot, cameraPosition)), "vTuftFar");
  const see = varying(tSeeAt(foot, u), "vTuftSee");
  material.colorNode = pictureColour(ground, far, u);
  return finish(material, "tuft", see, u);
}

// The tuft field's numbers (sim/holetufts.mjs TUFT_STRIDE): foot, code,
// look (width, turn, height, shade).
const field = () => ({ tFoot: attribute("tFoot", "vec3"), tDeep: attribute("tDeep", "float"), tLook: attribute("tLook", "vec4") });

// The field's near tufts (tuftfield.js nearMaterial): three splayed cards
// a tuft, placed and turned where they're drawn; past its own switch, a
// tuft's corners all put at its foot (nothing to draw).
export function tuftNearNodeMaterial({ uniforms: u, hay, heads, near: N }, base = null) {
  const material = base ?? new MeshLambertNodeMaterial();
  material.userData = { ...material.userData };
  const { tFoot, tDeep, tLook } = field();
  const at = modelWorldMatrix.mul(vec4(tFoot, 1)).xyz;
  const d = distance(at, cameraPosition);
  const cull = d.greaterThan(tSwitchAt(tLook.y));
  const c = cos(tLook.y);
  const s = sin(tLook.y);
  const position = attribute("position", "vec3");
  // (Spread wider the nearer the camera.)
  const spread = N ? mix(float(N.spread), float(1), smoothstep(N.from, N.to, d)) : float(1);
  const p = position.mul(vec3(tLook.x.mul(spread), tLook.z, tLook.x.mul(spread)));
  const placed = tFoot.add(vec3(p.x.mul(c).add(p.z.mul(s)), p.y, p.x.negate().mul(s).add(p.z.mul(c)))).add(tBend(at, max(float(0), p.y), position.x));
  material.positionNode = select(cull, tFoot, placed);
  const ground = varying(tColourAt(at, tDeep, u).mul(tLook.w), "vTuftGround");
  const far = varying(smoothstep(TUFT_BLEND.from, TUFT_BLEND.to, d), "vTuftFar");
  const see = varying(tSeeAt(at, u), "vTuftSee");
  const isHay = varying(tDeep.greaterThan(8.5).toFloat(), "vTuftHay").greaterThan(0.5);
  material.colorNode = pictureColour(ground, far, u, hay ? { on: isHay, map: hay, tint: heads.tint } : null, N ?? null);
  return finish(material, "tuftnear", see, u);
}

// The field's far tufts (tuftfield.js farMaterial): a card each, upright
// and faced to the camera, as many as the share at its distance and the
// camera's height (each past it shrinking away), widened as the field
// thins; its blades worked out where they're drawn. lod: the field's LOD
// as the safety valve has it; fan: FAR_FAN; card: its foot and splay;
// heads: hay's seed heads (tuftfield.js HAY_HEADS).
export function tuftFarNodeMaterial({ uniforms: u, lod, fan: F, card, heads: HD }) {
  const material = new MeshLambertNodeMaterial({ color: 0xffffff });
  const { tFoot, tDeep, tLook } = field();
  const tField = attribute("tField", "vec3");
  const L = reference("value", "vec3", lod);
  const H = GRASS_HEIGHT;
  const shareAt = (dist) => {
    const t = clamp(dist.sub(L.x).div(L.y.sub(L.x)), 0, 1);
    return max(L.z, float(1).sub(float(1).sub(L.z).mul(t).mul(t).mul(float(3).sub(t.mul(2)))));
  };
  const heightShare = (up) => {
    const t = clamp(up.sub(H.from).div(H.to - H.from), 0, 1);
    return float(1).sub(float(1 - H.least).mul(t).mul(t).mul(float(3).sub(t.mul(2))));
  };
  const at = modelWorldMatrix.mul(vec4(tFoot, 1)).xyz;
  const d = distance(at, cameraPosition);
  // (Never less than the field keeps: sim/tufts.mjs KEPT_FAR.)
  const share = max(shareAt(d).mul(heightShare(cameraPosition.y.sub(at.y))), tField.z.mul(L.z).div(TUFT_FIELD.least));
  // Its place in the field, shrinking away as the share passes it.
  const rank = instanceIndex.toFloat().add(0.5).div(tField.x);
  const grow = clamp(share.sub(rank).div(share.mul(0.15).add(1e-4)), 0, 1);
  const cull = d.lessThanEqual(tSwitchAt(tLook.y)).or(grow.lessThanEqual(0));
  const to = cameraPosition.sub(at);
  // (Less so seen from above: TUFT_LOD.above.)
  const k = mix(clamp(float(1).div(max(share, 1e-3)), 1, TUFT_LOD.widen), float(1), smoothstep(TUFT_LOD.above[0], TUFT_LOD.above[1], to.y.div(max(length(to), 1e-3))));
  const l = length(to.xz);
  const side = select(l.greaterThan(0.01), vec3(to.z.negate(), 0, to.x).div(max(l, 0.01)), vec3(cos(tLook.y), 0, sin(tLook.y)));
  const position = attribute("position", "vec3");
  const rise = position.y.mul(tField.y).mul(tLook.z).mul(grow);
  const placed = tFoot.add(side.mul(position.x.mul(card.foot).mul(tLook.x).mul(k))).add(vec3(0, rise, 0)).add(tBend(at, rise, position.x));
  material.positionNode = select(cull, tFoot, placed);
  const fanAt = varying(vec3(position.x.mul(k), position.y, position.x.mul(2)), "vTuftFan");
  const turn = varying(tLook.y, "vTuftTurn");
  // (A parkland hole's rough and deep rough: FAR_FAN.parkland.)
  const tint = mix(float(1), tLook.w, 2).mul(select(tDeep.lessThan(1.5), float(F.parkland), float(1)));
  const ground = varying(tColourAt(at, tDeep, u).mul(tint), "vTuftGround");
  const far = varying(smoothstep(TUFT_BLEND.from, TUFT_BLEND.to, d), "vTuftFar");
  const see = varying(tSeeAt(at, u), "vTuftSee");
  const hay = varying(tDeep.greaterThan(8.5).toFloat(), "vTuftHay");

  // Up the tuft (0 its foot, 1 its top), and which blade's line, splaying
  // out as they rise.
  const v = clamp(fanAt.y, 0, 1);
  const a = fanAt.x.div(float(1).add(float(card.splay - 1).mul(v)));
  // (And how far across it, -1 to 1.)
  const across = fanAt.z.div(float(1).add(float(card.splay - 1).mul(v)));
  const t = a.mul(F.blades).add(0.5);
  const dt = fwidth(t);
  const dv = fwidth(v).add(1e-4);
  const cell = floor(t);
  // Each blade its own: set a little aside, its height (the outer ones
  // shorter), its shade.
  const h = fract(sin(cell.mul(12.9898).add(turn.mul(78.233))).mul(43758.5453));
  const h2 = fract(h.mul(37.17).add(0.13));
  const h3 = fract(h.mul(91.71).add(0.71));
  const off = fract(t).sub(0.5).sub(h.sub(0.5).mul(0.36));
  const top = float(0.62).add(h2.mul(0.38)).mul(float(1).sub(min(float(1), abs(a).mul(1.6)).mul(0.3)));
  const width = float(F.width).mul(pow(max(float(0), float(1).sub(v.div(top))), 0.6));
  let cover = clamp(width.sub(abs(off)).div(max(dt, 1e-4)).add(0.5), 0, 1).mul(clamp(top.sub(v).div(dv).add(0.5), 0, 1));
  // Hay: a seed head over the top of most of its blades, swelling and
  // narrowing to its tip.
  const headed = hay.mul(step(fract(h.mul(53.13).add(0.37)), HD.share));
  const along = clamp(v.sub(top).div(HD.length).add(1), 0, 1);
  const headWidth = float(HD.width).mul(pow(max(float(0), sin(along.mul(3.14159265))), 0.7));
  const head = headed.mul(clamp(headWidth.sub(abs(off)).div(max(dt, 1e-4)).add(0.5), 0, 1));
  cover = max(cover, head);
  // Too fine to draw blade by blade, far off: their share of the card, as
  // a tussock's dome (FAR_FAN.dome, sides) - hay's heads, their share of
  // its top.
  const blur = smoothstep(0.3, 1, dt);
  const dome = float(1).sub(across.mul(across).mul(F.dome));
  const mean = float(2 * F.width).mul(float(1).sub(smoothstep(0.15, 1, v.div(dome)))).mul(float(1).sub(smoothstep(F.sides, 1, abs(across))));
  cover = mix(cover, mean, blur);
  const seed = mix(head, hay.mul(HD.share * 0.6).mul(smoothstep(0.5, 0.85, v.div(dome))), blur);
  const shade = mix(float(F.foot), float(F.tip), pow(v, 0.8)).mul(mix(float(1).add(float(F.vary).mul(h3.mul(2).sub(1))), float(1), blur));
  const lit = ground.mul(mix(shade, tLift(u, F.aoLift), far.mul(TUFT_BLEND.most)));
  const col = mix(lit, lit.mul(vec3(...HD.tint)), seed);
  material.colorNode = vec4(mix(col, vec3(dot(col, LUMA)), v.mul(F.sheen)), cover);
  finish(material, "tuftfar", see, u);
  material.maskNode = material.maskNode.and(cover.greaterThanEqual(0.01));
  return material;
}
