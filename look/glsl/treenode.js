// The trees' patched materials (look/trees.js) as node materials, for
// WebGPURenderer (look/nodetwins.js): the leaf cards (foliageMaterial) lit
// from their outward face on both sides, as on WebGL; and the leafy crown
// under them (leafyCrown) - clumps of darker and lighter leaves, small gaps
// cut where the sky shows through (eased over a pixel by alpha to
// coverage), toned down far off, a far tree's merged trunk in its bark's
// colour, and the underside lit a little from within. The same sums, and
// both swaying in the wind (glsl/nodehooks.js applyNodeHooks). On High the
// cards' sunlight through the leaves (in their own lighting, where the
// sun's light is used with its shadow taken off) and the closest leaves'
// shades of their own, as WebGL's (trees.js foliageMaterial).

import { MeshLambertNodeMaterial, PhongLightingModel } from "three/webgpu";
import { attribute, clamp, cross, dFdx, dFdy, diffuseColor, dot, float, floor, fract, fwidth, inverseSqrt, materialColor, materialOpacity, max, min, mix, normalView, normalViewGeometry, normalize, positionView, positionViewDirection, pow, reflect, select, sin, smoothstep, texture, uv, varying, vec2, vec3, vec4, length, vertexColor } from "three/tsl";
import { applyNodeHooks, copyPlace } from "./nodehooks.js";
import { CLOSE_LOOK } from "../../sim/treelod.mjs";
import { TRANSLUCENT } from "../trees.js";

export const TREE_NODE_KEY = "tr2";

const LEAVES = CLOSE_LOOK.leaves;
const BARK = CLOSE_LOOK.bark;
// How close (trees.js CLOSE_LEAVES_NEAR: 1 near to, 0 past the fade).
const leafNear = () => float(1).sub(smoothstep(LEAVES.full, LEAVES.fade, length(positionView)));

// High's leaves lit as WebGL's are (trees.js LEAVES_THROUGH): three's own
// lighting for a matt material, and with each light (the sun: its shadow
// already taken off) a little through the leaf, most looking straight into
// it, more on the closest leaves - and on those the sun on a leaf's back
// coming through it, and a waxy glint.
class LeafLighting extends PhongLightingModel {
  constructor() {
    super(false);
  }

  direct(input, builder) {
    super.direct(input, builder);
    const { lightDirection, lightColor, reflectedLight } = input;
    const near = leafNear();
    const view = positionViewDirection;
    const back = max(dot(view.negate(), lightDirection), 0);
    const lobe = back.mul(back).mul(back).mul(back);
    const leaf = diffuseColor.rgb;
    reflectedLight.directDiffuse.addAssign(leaf.mul(vec3(1, 1, 0.8)).mul(lightColor).mul(float(TRANSLUCENT).add(near.mul(LEAVES.through)).mul(lobe)));
    const through = max(dot(normalView, lightDirection).negate(), 0);
    const glint = pow(max(dot(reflect(lightDirection.negate(), normalView), view), 0), 36);
    reflectedLight.directDiffuse.addAssign(lightColor.mul(near).mul(leaf.mul(vec3(1, 1, 0.75)).mul(LEAVES.behind).mul(through).add(mix(leaf, vec3(1), 0.4).mul(LEAVES.glint).mul(glint))));
  }
}

// A leaf card's material (options: the bend kind it sways as; high: High's
// light through the leaves and close shades; grid: its picture's cells,
// trees.js foliageMaterial): lit from its outward face on both sides.
// base: three's own node version of the WebGL material (its texture,
// colour and the rest), to build on.
export function foliageNodeMaterial({ kind = "cards", high = false, grid = [1, 1] }, base = null) {
  const material = base ?? new MeshLambertNodeMaterial();
  material.userData = { ...material.userData };
  material.normalNode = normalViewGeometry;
  if (high) {
    // The closest leaves each a shade of their own (trees.js
    // CLOSE_LEAVES_SHADE): none where a leaf's patch is a few pixels.
    const cells = uv().mul(vec2(14 * grid[0], 14 * grid[1]));
    const small = float(1).sub(smoothstep(0.25, 0.5, length(fwidth(cells))));
    const cell = floor(cells);
    const h = fract(sin(dot(cell, vec2(12.9898, 78.233))).mul(43758.5453));
    const S = LEAVES.shade;
    const own = vec3(h.mul(S).add(1 - S / 2), h.mul(S * 0.8).add(1 - S / 2.5), float(1).sub(h).mul(S * 0.6).add(1 - S / 2));
    const picture = vec4(materialColor);
    material.colorNode = vec4(picture.rgb.mul(mix(vec3(1), own, leafNear().mul(small))), picture.a);
    material.setupLightingModel = () => new LeafLighting();
  }
  applyNodeHooks(material, kind);
  material.userData.treeNode = TREE_NODE_KEY;
  return material;
}

// trees.js leafyCrown's hash and noise, in three dimensions (a rock's
// too: dressing.js rockMaterial).
export function tHash(p0) {
  const p = fract(p0.mul(0.3183099).add(0.1)).mul(17);
  return fract(p.x.mul(p.y).mul(p.z).mul(p.x.add(p.y).add(p.z)));
}
export function tNoise(x) {
  const i = floor(x);
  const f0 = fract(x);
  const f = f0.mul(f0).mul(float(3).sub(f0.mul(2)));
  const h = (dx, dy, dz) => tHash(i.add(vec3(dx, dy, dz)));
  const a = mix(mix(h(0, 0, 0), h(1, 0, 0), f.x), mix(h(0, 1, 0), h(1, 1, 0), f.x), f.y);
  const b = mix(mix(h(0, 0, 1), h(1, 0, 1), f.x), mix(h(0, 1, 1), h(1, 1, 1), f.x), f.y);
  return mix(a, b, f.z);
}

// gaps: its sky gaps cut (CROWN_GAPS { top, under }), or null; bark: a far
// tree's, its trunk merged in (fBark); glow: CROWN_UNDER_GLOW.
// leaves: the crown's surface in its kind's leaves (look/trees.js
// CROWN_LEAVES, as WebGL's leafyCrown): { map (the leaf atlas), cols, rows,
// span, between, bright, fade, average } - the cell from the crown's fCell.
export function crownNodeMaterial({ gaps = null, bark = false, glow = 0.12, leaves = null }, base = null) {
  const material = base ?? new MeshLambertNodeMaterial();
  material.userData = { ...material.userData };
  // (Where it is in the tree, and a share of where the tree stands - a
  // copy's or a batch's - as WebGL's: each tree's clumps its own.)
  const at = attribute("position", "vec3").add(varying(copyPlace(), "vCrownAt").mul(0.37));
  const under = clamp(attribute("normal", "vec3").y.negate(), 0, 1);
  const clumps = tNoise(at.mul(1.6)).mul(0.6).add(tNoise(at.mul(4.3)).mul(0.4));
  // Its colour and its vertex colours together (three would put them on
  // after this: the bark goes over both).
  let col = materialColor.rgb.mul(vertexColor().rgb);
  col = col.mul(mix(clumps.mul(0.4).add(0.78), float(0.97), smoothstep(45, 90, length(positionView))));
  if (leaves?.map) {
    // Its leaf picture laid over it from the side it faces most.
    const p = varying(attribute("position", "vec3"), "vCrownLeafAt");
    const n = varying(attribute("normal", "vec3"), "vCrownFace").abs();
    const q = select(n.y.greaterThanEqual(n.x).and(n.y.greaterThanEqual(n.z)), p.xz, select(n.x.greaterThanEqual(n.z), p.zy, p.xy)).div(leaves.span);
    const cell = vec2(1 / leaves.cols, 1 / leaves.rows);
    const at2 = varying(attribute("fCell", "vec2"), "vCrownCell").add(fract(q).mul(0.96).add(0.02).mul(cell));
    const leaf = texture(leaves.map, at2).grad(dFdx(q).mul(cell), dFdy(q).mul(cell));
    const worn = mix(vec3(leaves.between), leaf.rgb.div(vec3(...leaves.average)).mul(leaves.bright), smoothstep(0.2, 0.6, leaf.a));
    col = col.mul(mix(worn, vec3(1), smoothstep(leaves.fade[0], leaves.fade[1], length(positionView))));
  }
  let glowK = under;
  if (bark) {
    const b = attribute("fBark", "vec4");
    col = mix(col, b.rgb, b.a);
    glowK = glowK.mul(float(1).sub(b.a));
  }
  material.colorNode = vec4(col, 1);
  material.emissiveNode = col.mul(glow).mul(glowK);
  if (gaps) {
    const cut = float(gaps.top).add(under.mul(gaps.under - gaps.top));
    const edge = fwidth(clumps).add(1e-4);
    const cover = smoothstep(cut.sub(edge), cut.add(edge), clumps);
    material.opacityNode = materialOpacity.mul(cover);
    material.maskNode = cover.greaterThan(0);
  }
  applyNodeHooks(material, "crown");
  // (Its vertex colours already in: not again.)
  material.userData.ownShaping = ["vertexColors"];
  material.vertexColors = false;
  material.userData.treeNode = TREE_NODE_KEY;
  return material;
}

// High's textured bark (trees.js barkLook): the trunk's bark of its kind
// (tBark: the WebGL material's texture uniform, followed as the drawn
// bark's swapped in) multiplied into its colour, fading out as a tile gets
// small on screen; the closest trunks' furrows sunk in (offset mapping,
// twice over, in the bark's own directions round and up the trunk - from
// how its co-ordinates change across the screen) and darker down in the
// cracks; and its ridges tilting the lit normal. Then the trunk's hooks:
// its sway, the cloud shade and see-through by the camera.
export function barkNodeMaterial({ tBark }, base = null) {
  const material = base ?? new MeshLambertNodeMaterial();
  material.userData = { ...material.userData };
  const sample = (at, layer) => {
    const node = texture(tBark.value, at).depth(layer);
    node.onRenderUpdate(() => {
      if (tBark.value && node.value !== tBark.value) node.value = tBark.value;
    });
    return node;
  };
  const barkUv = attribute("fBarkUv", "vec2");
  const layer = floor(attribute("fBarkKind", "float").add(0.5));
  const k = float(1).sub(smoothstep(0.03, 0.2, max(fwidth(barkUv.x), fwidth(barkUv.y))));
  const near = float(1).sub(smoothstep(BARK.full, BARK.fade, length(positionView)));
  // Round the trunk and up it, in view terms (trees.js CLOSE_BARK).
  const n0 = normalViewGeometry;
  const p0 = dFdx(positionView);
  const p1 = dFdy(positionView);
  const u0 = dFdx(barkUv);
  const u1 = dFdy(barkUv);
  const p1n = cross(p1, n0);
  const p0n = cross(n0, p0);
  const T = p1n.mul(u0.x).add(p0n.mul(u1.x));
  const B = p1n.mul(u0.y).add(p0n.mul(u1.y));
  const det = max(dot(T, T), dot(B, B));
  const sc = select(det.equal(0), float(0), inverseSqrt(det));
  const V = normalize(positionView.negate());
  const view = vec2(dot(V, T.mul(sc)), dot(V, B.mul(sc))).div(max(dot(V, n0), 0.25));
  let at = barkUv;
  for (let j = 0; j < 2; j++) at = at.add(view.mul(sample(at, layer).r.sub(0.55)).mul(BARK.depth).mul(near).mul(0.5));
  const t0 = sample(at, layer).rgb;
  const t = mix(t0, min(t0, sample(fract(at.mul(2.15)), layer).rgb), near.mul(0.65));
  const shade = mix(float(1), t.r.mul(0.78).add(0.42), k.mul(0.9)).mul(float(1).sub(near.mul(BARK.cracks).mul(float(1).sub(smoothstep(0.15, 0.6, t.r)))));
  const own = vec4(materialColor);
  material.colorNode = vec4(own.rgb.mul(shade), own.a);
  const lean = vec2(t.g.mul(2).sub(1), float(1).sub(t.b.mul(2))).mul(k).mul(near.mul(BARK.lean).add(1));
  material.normalNode = normalize(n0.add(T.mul(lean.x).add(B.mul(lean.y)).mul(sc).mul(0.8)));
  applyNodeHooks(material, "trunk");
  material.userData.treeNode = TREE_NODE_KEY;
  return material;
}
