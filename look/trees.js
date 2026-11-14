// Trees in several kinds (sim/treeshapes.mjs KINDS), batched so a couple of
// thousand cost a handful of draw calls, each with a light far version. On High they wear leaf cards over a solid crown; on
// Standard the faceted crowns alone, which are cheaper. Each kind comes in
// several lopsided crown shapes (TREE_SHAPES), and each tree is turned,
// tilted and spread its own way, so no two stand alike.

import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { HIGH, LEVEL, EXTRA, ULTRA, PHONE } from "./quality.js";
import { PALETTE } from "./palette.js";
import { smoothstep } from "../sim/mathutil.mjs";
import { THICK, treeForm, crownBound, hashNumbers, levelHull } from "../sim/treehits.mjs";
import { OFFSHOOT_KINDS, SPRAY_KINDS, BOUGH_KINDS, OFFSHOOTS, BOUGH_SORTS, boughsOf, boughDome, limbPath, kitPlans, treeOffshoots, treeSprays, snagOffshoots, sprayCore } from "../sim/offshoots.mjs";
import { standShade, treeOpenness, treeShift } from "../sim/treelooks.mjs";
import { treeShapes, pineRings, trunkAt, trunkRadius, trunkFlare, flareHeight, branchAt, branchRadius, TREE_SHAPES, KINDS, KIND, TIERED, shapeCount, shapeBatch } from "../sim/treeshapes.mjs";
import { FAR_FROM as PC_FAR, CLOSE_FROM as PC_CLOSE, FRONT_FROM as PC_FRONT, FRONT_MAX as PC_FRONT_MAX, CLOSE_LOOK, HOLE_TOP, NEAR_IN_CROP, BURIED, phoneTable, chooseFar, chooseClose, chooseBoughs, buriedTrees, farTooClose, shouldDecide, pathsFor, partShown } from "../sim/treelod.mjs";
import { registerStep } from "./safety.js";
import { setNeighbourShed, neighbourShed } from "../sim/coursetiers.mjs";
import { withSceneryHooks } from "./glsl/hooks.js";
import { markTwin } from "./twins.js";
import { detailTextures, BARK_LAYER } from "./textures.js";
import { makeTreeFeet } from "./treefoot.js";
import { loadBake, saveBake, geometryData, geometryFrom } from "./bake.js";
import { fingerprint } from "../sim/bakefile.mjs";
import { dilatePixels } from "../sim/dilate.mjs";
import { SEASON, seasonal } from "./season.js";
import { shootEnds, SHOOT_ENDS } from "./shootends.js";
import { LEAF_PICTURES } from "./leafpictures.js";
export { SHOOT_ENDS };
import { loadSetting } from "../util.js";
import { effectsInUse } from "../sim/effects.mjs";

// Ultra's closest trees' looks (sim/treelod.mjs), as shader numbers.
const n3 = (v) => Number(v).toFixed(3);
const BARK_LOOK = CLOSE_LOOK.bark;
const LEAVES_LOOK = CLOSE_LOOK.leaves;

// Deterministic randomness so the scenery is the same every visit.
export function seeded(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function jitter(geo, amount, rand) {
  const pos = geo.attributes.position;
  // Move shared positions together so the faces stay closed.
  const moved = new Map();
  for (let i = 0; i < pos.count; i++) {
    const key = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
    if (!moved.has(key)) moved.set(key, [(rand() - 0.5) * amount, (rand() - 0.5) * amount, (rand() - 0.5) * amount]);
    const [dx, dy, dz] = moved.get(key);
    pos.setXYZ(i, pos.getX(i) + dx, pos.getY(i) + dy, pos.getZ(i) + dz);
  }
  geo.computeVertexNormals();
  return geo;
}


// One tier of a pine: not a cone on a flat plate (seen from the tee, every
// tier's underside was a hard, dark octagon) but a spread of branches - a
// many-sided shape turned on a profile that rises from a ragged, drooping
// rim to the top, and underneath slopes back up to the trunk, as the
// branches do. The rim's radius changes round the tree.
function pineTier(r, h, rand, sides = 12, simple = false) {
  // (A low tree's simpler: under, the rim, halfway up, the tip.)
  const profile = (
    simple
      ? [
          [0.12, -h * 0.28],
          [r, -h * 0.46],
          [r * 0.45, h * 0.06],
          [0.001, h * 0.5],
        ]
      : [
          [0.12, -h * 0.28], // under the branches, at the trunk
          [r * 0.45, -h * 0.4],
          [r * 0.88, -h * 0.5],
          [r, -h * 0.46], // the rim's drooping tips
          [r * 0.62, -h * 0.1],
          [r * 0.3, h * 0.22],
          [0.001, h * 0.5],
        ]
  ).map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.LatheGeometry(profile, sides).toNonIndexed();
  // A ragged rim: each branch sticking out further or less.
  const reach = Array.from({ length: sides + 1 }, () => 0.8 + rand() * 0.35);
  reach[sides] = reach[0];
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const a = (Math.atan2(x, z) + Math.PI * 2) % (Math.PI * 2);
    const f = (a / (Math.PI * 2)) * sides;
    const k = Math.floor(f);
    const t = f - k;
    const out = reach[k] * (1 - t) + reach[(k + 1) % sides] * t;
    // Most at the rim, none at the trunk or the tip.
    const w = Math.min(1, Math.hypot(x, z) / r);
    const m = 1 + (out - 1) * w;
    pos.setXYZ(i, x * m, pos.getY(i) - (out - 1) * w * h * 0.25, z * m);
  }
  g.computeVertexNormals();
  return g;
}

function pineCrown(tiers, rand, sides = 12, simple = false) {
  const geo = mergeGeometries(
    tiers.map(([r, h, y, dx, dz]) => {
      const g = pineTier(r, h, rand, sides, simple);
      // A tier fuller on one side than the other.
      g.scale(0.88 + rand() * 0.24, 1, 0.88 + rand() * 0.24);
      g.rotateY(rand() * Math.PI);
      g.translate(dx, y, dz);
      jitter(g, 0.25, rand);
      // Rounded shading over the branches, not flat planes.
      g.deleteAttribute("normal");
      g.deleteAttribute("uv");
      const joined = mergeVertices(g, 1e-3);
      joined.computeVertexNormals();
      return joined.toNonIndexed();
    }),
  );
  // Each tier shaded in three patches of its own - and darker where it
  // faces down (UNDER_SHELL): its underside is in the tree's own shade, and
  // lit it read as a smooth, pale plate under the needles.
  const shaded = shadeParts(geo, tiers.length * 3, rand, { low: 1, high: 10 });
  const nor = shaded.attributes.normal;
  const col = shaded.attributes.color;
  for (let i = 0; i < col.count; i++) {
    const k = 1 - UNDER_SHELL * Math.max(0, -nor.getY(i));
    col.setXYZ(i, col.getX(i) * k, col.getY(i) * k, col.getZ(i) * k);
  }
  return shaded;
}
// How much darker a tier's underside, facing straight down.
export const UNDER_SHELL = 0.45;


// How much flatter a crown's lump is underneath than on top (its leaf
// cards follow it: cardsOn).
export const FLAT_UNDER = 0.75;

// Rounded shading rather than facets, on every setting: on Standard, where
// no leaf cards cover the crown, faceted it read as a grey boulder; on High
// its flat facets showed through the cards underneath, as a blocky base.
// tuck: each lump a little smaller about its own middle, inside its leaf
// cards (TUCK), or null.
// drawn: the detail whose randomness it takes from `rand` - a crown made
// coarser since (CROWN_UNDER) draws what the finer one did, and shapes
// itself from a sequence of its own, so every shape after it in the same
// stream is made exactly as it was.
export function broadleafCrown(spheres, rand, smooth = true, detail = 2, tuck = null, drawn = detail) {
  const geo = mergeGeometries(
    spheres.map(([x, y, z, r]) => {
      // Finer than it was (detail 1 left big flat facets, darkest underneath,
      // where the leaf cards are thinnest - a blocky underside seen from the
      // tee), and rounded over its corners. (A low tree's is coarser:
      // lowGeometry.)
      const g = new THREE.IcosahedronGeometry(r, detail); // already non-indexed
      // Each lump a little squashed or stretched, flatter underneath.
      const squash = [0.85 + rand() * 0.3, 0.8 + rand() * 0.3, 0.85 + rand() * 0.3];
      g.scale(...squash);
      // (Made coarser than it was: the finer one's bumps drawn and let go.)
      const own = drawn !== detail ? (jitter(new THREE.IcosahedronGeometry(r, drawn), 0.35, rand), seeded(Math.round((x * 31 + y * 17 + z * 13 + r * 7) * 1000) >>> 0)) : rand;
      const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) if (pos.getY(i) < 0) pos.setY(i, pos.getY(i) * FLAT_UNDER);
      if (tuck) g.scale(tuck.across, tuck.up, tuck.across);
      g.translate(x, y, z);
      jitter(g, 0.35, own);
      if (!smooth) return g;
      // The corners the faces share, joined, so normals round over them.
      g.deleteAttribute("normal");
      g.deleteAttribute("uv");
      const joined = mergeVertices(g, 1e-3);
      joined.computeVertexNormals();
      return joined.toNonIndexed();
    }),
  );
  return massLit(shadeParts(geo, spheres.length, rand, { low: 3, high: 8 }), spheres);
}

// The crown lit as one mass, as its leaves are (crownDepth's `round`): each
// corner's light turned from its own lump's middle towards the whole
// crown's (the owner, 12 November 2026: the lumps under the leaves "still
// in a few cases stick out a bit too much"). Lit each as a ball of its
// own, a lump showed between the leaves as a ball - a bright side, a dark
// side - where the leaves over it were lit as part of the tree.
export const CROWN_MASS = 0.8;
function massLit(geo, spheres, k = CROWN_MASS) {
  const nor = geo.attributes.normal;
  if (!nor || spheres.length < 2 || k <= 0) return geo;
  const pos = geo.attributes.position;
  let [cx, cy, cz, w] = [0, 0, 0, 0];
  for (const [x, y, z, r] of spheres) {
    const m = r * r * r;
    cx += x * m;
    cy += y * m;
    cz += z * m;
    w += m;
  }
  const out = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    out.set(pos.getX(i) - cx / w, pos.getY(i) - cy / w, pos.getZ(i) - cz / w).normalize();
    n.set(nor.getX(i), nor.getY(i), nor.getZ(i)).lerp(out, k).normalize();
    nor.setXYZ(i, n.x, n.y, n.z);
  }
  return geo;
}

// ---- Leaves ----------------------------------------------------------------------
//
// On High quality each crown also gets "cards": small flat quads textured
// with a cluster of leaves (or pine needles) cut out by alpha. Hundreds of
// them give a tree a ragged, leafy outline instead of a faceted blob, for a
// few thousand triangles per kind. Their normals point out from the crown's
// centre so they light as a round mass, not as flat cards.

// A canvas cut-out as a texture whose see-through pixels still carry the
// foliage colour. Canvases store transparent pixels as black, and when the
// texture is shrunk for distance that black bleeds into the edges and the
// leaves turn to dark smudges. A DataTexture keeps the colour: each edge
// pixel its own (the canvas gives it unmixed), and the see-through ones the
// leaves' own average - not a fixed fill, which, lighter and yellower than
// the leaves, came through as a pale rim round every leaf once the picture
// was shrunk (the owner, 16 October 2026: "Trees are bleeding light").
// fill: the colour where there are no leaves at all to average.
// The canvases read back here are painted with willReadFrequently, which
// keeps them off the graphics card: reading one back from the card waited
// for it to finish everything else first, a long stop in the page's load.
export function cutoutTexture(canvas, fill) {
  return pictureTexture(cutoutPixels(canvas, fill), canvas.width, canvas.height);
}

// The pixels cutoutTexture makes a texture of: rows bottom-up.
function cutoutPixels(canvas, fill) {
  const { width: w, height: h } = canvas;
  const src = canvas.getContext("2d").getImageData(0, 0, w, h).data;
  const [r, g, b] = cutoutFill(src, fill);
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    // Rows bottom-up, as textures expect.
    const from = (h - 1 - y) * w * 4;
    const to = y * w * 4;
    for (let x = 0; x < w * 4; x += 4) {
      const a = src[from + x + 3];
      // (Below CUTOUT_KEEP the canvas's colour is too coarse to trust.)
      const own = a >= CUTOUT_KEEP;
      data[to + x] = own ? src[from + x] : r;
      data[to + x + 1] = own ? src[from + x + 1] : g;
      data[to + x + 2] = own ? src[from + x + 2] : b;
      data[to + x + 3] = a;
    }
  }
  return data;
}

// A leaf picture's texture from its pixels (w by h, rows bottom-up).
function pictureTexture(data, w, h) {
  const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

// The alpha below which a cut-out pixel takes the leaves' average colour.
export const CUTOUT_KEEP = 8;
// The leaves' average colour (of the pixels solid enough to count), in a
// canvas's RGBA pixels; fill if there are none.
export function cutoutFill(px, fill) {
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 200) continue;
    r += px[i];
    g += px[i + 1];
    b += px[i + 2];
    n++;
  }
  return n ? [Math.round(r / n), Math.round(g / n), Math.round(b / n)] : fill;
}

// Foliage is drawn from both sides, and three.js lights a card's back face
// with its normal flipped - facing into the tree, or into the ground for a
// grass tuft - so half of every card came out nearly black. Leaves and
// grass let light through, so both faces keep the outward normal.
// kind: for the bend hook (look/glsl/bend.js): "cards" for a tree's leaf
// cards, "strands" for a willow's, "dressing" for the rough's plants.
//
// On Medium and up, sunlight through the leaves (LEAVES_THROUGH, in the
// sun's own light loop): looking towards the sun through them, a leaf the
// sun reaches glows a warmer, lighter green, as a real one does lit from
// behind - a little, and none in shade.
// grid: how many pictures its map holds across and up (the leaf atlas's:
// ATLAS) - each leaf's patch of shade close up is a 14th of one's.
export function foliageMaterial(options, kind = "cards", grid = [1, 1]) {
  const mat = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, alphaTest: 0.45, ...options });
  const leafGrid = `#define LEAF_GRID vec2(${(14 * grid[0]).toFixed(1)}, ${(14 * grid[1]).toFixed(1)})`;
  mat.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <normal_fragment_begin>",
      "#include <normal_fragment_begin>\n  normal = normalize( vNormal );",
    );
    if (HIGH) {
      // (On the phone - quality.js PHONE - none of the closest leaves' own:
      // each leaf's shade, the light through the crown's far side and the
      // glint are finer than its picture shows, and were worked out on
      // every leaf pixel of every tree.)
      shader.fragmentShader = litThroughLeaves(shader.fragmentShader.replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>\n        ${CLOSE_LEAVES_NEAR}`), LEAVES_THROUGH);
      if (!PHONE) shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", `#include <map_fragment>\n${CLOSE_LEAVES_SHADE}`).replace("#include <common>", `#include <common>\n${leafGrid}`);
    }
  };
  mat.customProgramCacheKey = () => (HIGH ? `foliage-v7-close-${grid[0]}x${grid[1]}${PHONE ? "-p" : ""}` : "foliage-v1");
  withSceneryHooks(mat, kind);
  // (Its node version, on WebGPURenderer: glsl/treenode.js.)
  return markTwin(mat, "foliage", { kind, high: HIGH, grid });
}

// How much of the sun's light comes through a leaf, at its most (of the
// leaf's colour, looking straight into the sun), before the extra the
// closest leaves get (sim/treelod.mjs CLOSE_LOOK.leaves). Subtle: a leaf
// square to the sun takes its colour times the sun's light over pi
// (three.js shares a lit face's light out over the half of the sky it
// takes it from), so a leaf lit from behind is well under half as bright
// as one lit from the front - it was 0.3, then 0.12 (when, with the close
// leaves' extra, leaves looked into the sun shone up to four times as
// bright as the same leaves in full sun) - and only where the sun reaches
// it (LEAVES_THROUGH): the owner, 16 October 2026, "Trees are bleeding
// light", then "any bleeding light on trees needs to be subtle not strong".
export const TRANSLUCENT = 0.07;

// Ultra's and High's closest leaves (sim/treelod.mjs CLOSE_LOOK.leaves): how
// close (fNear, 0 - 1), each leaf its own shade (as the map's read), and,
// in the sun's light, light through the crown's shaded side and a waxy
// glint.
// (On the phone none: fNear 0 - foliageMaterial.)
const CLOSE_LEAVES_NEAR = PHONE ? "float fNear = 0.0;" : `float fNear = 1.0 - smoothstep(${n3(LEAVES_LOOK.full)}, ${n3(LEAVES_LOOK.fade)}, length(vViewPosition));`;
// The light through the leaves, in three.js's light loop (litThroughLeaves),
// where directLight is the sun's light with its shadow taken off: a leaf in
// shade - deep in its crown, under another tree - gets none, and the glow
// lies where the sun does, along a crown's thin edge, on a leaf on its
// own. Added as a glow before the lights (totalEmissiveRadiance), as it
// was, it lit every leaf of a crown facing the camera alike, shaded or not,
// and the whole crown bled light. Most looking straight into the sun (the
// fourth power of how nearly), none side on - close up too, where the lobe
// was widened.
const LEAVES_THROUGH = /* glsl */ `
		{
			float fBack = max( dot( -geometryViewDir, directLight.direction ), 0.0 );
			float fLobe = fBack * fBack;
			fLobe *= fLobe;
			reflectedLight.directDiffuse += diffuseColor.rgb * vec3( 1.0, 1.0, 0.8 ) * directLight.color * ( ( ${n3(TRANSLUCENT)} + ${n3(LEAVES_LOOK.through)} * fNear ) * fLobe );
			if ( fNear > 0.0 ) {
				// The sun on the leaf's back comes through it; and a waxy glint.
				float fThrough = max( -dot( normal, directLight.direction ), 0.0 );
				float fGlint = pow( max( dot( reflect( -directLight.direction, normal ), geometryViewDir ), 0.0 ), 36.0 );
				reflectedLight.directDiffuse += directLight.color * fNear * ( diffuseColor.rgb * vec3( 1.0, 1.0, 0.75 ) * ${n3(LEAVES_LOOK.behind)} * fThrough + mix( diffuseColor.rgb, vec3( 1.0 ), 0.4 ) * ${n3(LEAVES_LOOK.glint)} * fGlint );
			}
		}`;

// Puts `glsl` into three.js's light loop, right after the sun's light is
// used (RE_Direct, in lights_fragment_begin's directional lights - the
// chunk as it stands: look/nearshadow.js's on High and Ultra), where
// directLight is that light with its shadow taken off; the chunk, so
// changed, in place of its include.
let loopWarned = false;
export function litThroughLeaves(fragmentShader, glsl) {
  const chunk = THREE.ShaderChunk.lights_fragment_begin;
  const call = "RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );";
  const block = chunk.indexOf("DirectionalLight directionalLight;");
  const at = block < 0 ? -1 : chunk.indexOf(call, block);
  if (at < 0) {
    if (!loopWarned) console.warn("Light through the leaves: three.js's lighting isn't as expected; none.");
    loopWarned = true;
    return fragmentShader;
  }
  const end = at + call.length;
  return fragmentShader.replace("#include <lights_fragment_begin>", `${chunk.slice(0, end)}\n${glsl}${chunk.slice(end)}`);
}
const CLOSE_LEAVES_SHADE = `#ifdef USE_MAP
        {
          ${CLOSE_LEAVES_NEAR}
          // (Gone where a leaf's patch is smaller than a few pixels, where
          // it was only sparkle that changed every frame.)
          float fSmall = 1.0 - smoothstep(0.25, 0.5, length(fwidth(vMapUv * LEAF_GRID)));
          if (fNear * fSmall > 0.0) {
            vec2 fCell = floor(vMapUv * LEAF_GRID);
            float fH = fract(sin(dot(fCell, vec2(12.9898, 78.233))) * 43758.5453);
            diffuseColor.rgb *= mix(vec3(1.0), vec3(1.0 - ${n3(LEAVES_LOOK.shade / 2)} + ${n3(LEAVES_LOOK.shade)} * fH, 1.0 - ${n3(LEAVES_LOOK.shade / 2.5)} + ${n3(LEAVES_LOOK.shade * 0.8)} * fH, 1.0 - ${n3(LEAVES_LOOK.shade / 2)} + ${n3(LEAVES_LOOK.shade * 0.6)} * (1.0 - fH)), fNear * fSmall);
          }
        }
        #endif`;

// How much finer than their 256 (blossom 128) grid the leaf cards' pictures
// are painted. Ultra's are 1024, so a leaf in the front row has a midrib
// and a serrated edge. High stays at twice (512). The phone's at half
// those (quality.js PHONE: a leaf card's never that many of its pixels) -
// a quarter of the painting as the page starts, and of the memory.
const LEAF_SCALE = (ULTRA ? 4 : 2) / (PHONE ? 2 : 1);

// One leaf, tip to the right before it's turned. len and wid are on the
// 256 grid. lobes 0 is a plain oval; 3 is a broad oak-like edge. Its shade
// laid on the leaves already painted under it, and its veins, only where
// there's leaf (source-atop): neither adds to what's cut out.
function paintLeaf(ctx, x, y, ang, len, wid, lobes, v) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  const n = 22;
  const outline = () => {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const bulge = Math.sin(t * Math.PI);
      const lobe = lobes ? 0.7 + 0.3 * Math.max(0, Math.sin(t * lobes * Math.PI)) : 1;
      ctx.lineTo(t * len, wid * bulge * lobe);
    }
    for (let i = n; i >= 0; i--) {
      const t = i / n;
      const bulge = Math.sin(Math.max(t, 0.001) * Math.PI);
      const lobe = lobes ? 0.7 + 0.3 * Math.max(0, Math.sin(t * lobes * Math.PI)) : 1;
      ctx.lineTo(t * len, -wid * bulge * lobe);
    }
    ctx.closePath();
  };
  // Its shadow on the leaves beneath it (LEAF_PAINT.shade), a little down
  // and along from it.
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  ctx.translate(len * 0.05, len * 0.06);
  outline();
  ctx.fillStyle = `rgba(18,30,12,${LEAF_PAINT.shade})`;
  ctx.fill();
  ctx.restore();
  outline();
  ctx.fillStyle = `rgb(${(v * 0.42) | 0},${(v * 0.7) | 0},${(v * 0.3) | 0})`;
  ctx.fill();
  ctx.fillStyle = `rgb(${(v * 0.6) | 0},${(v * 0.95) | 0},${(v * 0.42) | 0})`;
  ctx.save();
  ctx.translate(len * 0.14, 0);
  ctx.scale(0.66, 0.5);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = `rgba(${Math.min(255, v * 0.75) | 0},${Math.min(255, v) | 0},${(v * 0.35) | 0},0.8)`;
  ctx.lineWidth = Math.max(0.45, len * 0.02);
  ctx.beginPath();
  ctx.moveTo(len * 0.08, 0);
  ctx.lineTo(len * 0.88, 0);
  ctx.stroke();
  // Its side veins, finer, off the midrib towards the tip.
  ctx.globalCompositeOperation = "source-atop";
  ctx.lineWidth = Math.max(0.3, len * 0.011);
  ctx.beginPath();
  for (const t of LEAF_PAINT.veins) {
    const reach = wid * Math.sin(t * Math.PI) * 0.62;
    for (const side of [-1, 1]) {
      ctx.moveTo(len * t, 0);
      ctx.lineTo(len * (t + 0.11), side * reach);
    }
  }
  ctx.stroke();
  ctx.restore();
}

// How a leaf's painted (paintLeaf): the shadow it lays on those under it
// (its alpha), and where along it its side veins leave the midrib.
export const LEAF_PAINT = { shade: 0.22, veins: [0.28, 0.46, 0.64] };

// A horse chestnut's hand, painted: hand(x, y, ang, reach, v) - its stalk
// back from (x, y), and five to seven leaflets fanned from there about
// `ang`, each widest near its tip and drawn in to the stalk, ribbed with
// side veins, the middle one longest; the outer ones first (shorter,
// darker, under). CHESTNUT_LEAF says how.
function chestnutHand(ctx, rand) {
  const C = CHESTNUT_LEAF;
  const leaflet = (len, wid, v) => {
    const n = 18;
    // Its half width along it: nothing at the stalk, most at C.widest of
    // the way out, a short point at the tip.
    const half = (t) => wid * (t < C.widest ? Math.pow(t / C.widest, 1.35) : Math.pow(Math.max(0, (1 - t) / (1 - C.widest)), 0.55));
    const outline = () => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let i = 1; i <= n; i++) ctx.lineTo((i / n) * len, half(i / n));
      for (let i = n; i >= 0; i--) ctx.lineTo((i / n) * len, -half(i / n));
      ctx.closePath();
    };
    // Its shadow on what's under it (as paintLeaf).
    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    ctx.translate(len * 0.04, len * 0.05);
    outline();
    ctx.fillStyle = `rgba(18,30,12,${LEAF_PAINT.shade})`;
    ctx.fill();
    ctx.restore();
    outline();
    ctx.fillStyle = `rgb(${(v * 0.42) | 0},${(v * 0.7) | 0},${(v * 0.3) | 0})`;
    ctx.fill();
    // Lighter down its middle (so the picture's average is the other
    // broadleaves': LEAF_AVERAGE).
    ctx.save();
    ctx.translate(len * 0.16, 0);
    ctx.scale(0.72, 0.52);
    outline();
    ctx.fillStyle = `rgb(${(v * 0.6) | 0},${(v * 0.95) | 0},${(v * 0.42) | 0})`;
    ctx.fill();
    ctx.restore();
    // Its midrib, and the close ribs off it either side.
    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    ctx.strokeStyle = `rgba(${Math.min(255, v * 0.78) | 0},${Math.min(255, v * 1.02) | 0},${(v * 0.36) | 0},0.85)`;
    ctx.lineWidth = Math.max(0.5, len * 0.022);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len * 0.94, 0);
    ctx.stroke();
    ctx.strokeStyle = `rgba(${(v * 0.3) | 0},${(v * 0.5) | 0},${(v * 0.2) | 0},0.45)`;
    ctx.lineWidth = Math.max(0.35, len * 0.011);
    ctx.beginPath();
    for (let k = 0; k < C.ribs; k++) {
      const t = 0.2 + (k / C.ribs) * 0.68;
      for (const side of [-1, 1]) {
        ctx.moveTo(len * t, 0);
        ctx.lineTo(len * (t + 0.09), side * half(t + 0.09) * 0.86);
      }
    }
    ctx.stroke();
    ctx.restore();
  };
  const hand = (x, y, ang, reach, v) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    // Its stalk, back from where the leaflets meet.
    ctx.strokeStyle = `rgb(${(v * 0.5) | 0},${(v * 0.62) | 0},${(v * 0.28) | 0})`;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-reach * 0.5, 0);
    ctx.stroke();
    const n = C.leaflets[0] + Math.floor(rand() * (C.leaflets[1] - C.leaflets[0] + 1));
    // The outer leaflets first (shorter, darker, under), the middle one last.
    const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => Math.abs(b - (n - 1) / 2) - Math.abs(a - (n - 1) / 2));
    for (const i of order) {
      const u = n > 1 ? (i / (n - 1)) * 2 - 1 : 0;
      const len = reach * (1 - C.shorter * u * u) * (0.94 + rand() * 0.12);
      ctx.save();
      ctx.rotate(u * C.fan + (rand() - 0.5) * 0.08);
      leaflet(len, len * C.wide, v * (1 - 0.14 * Math.abs(u)) * (0.95 + rand() * 0.1));
      ctx.restore();
    }
    ctx.restore();
  };
  return hand;
}

// A horse chestnut's leaf picture (leafCanvas "chestnut"), on the 256 grid:
// how many hands, how far a leaflet reaches from the stalk's end, how many
// leaflets a hand, how far they fan either side of the middle one
// (radians), how much shorter the outermost are, a leaflet's half width of
// its length and where along it it's widest, its ribs a side, and how far
// from the middle of the card the hands' stalk ends lie (of the card).
export const CHESTNUT_LEAF = { hands: 16, reach: [44, 62], leaflets: [5, 7], fan: 1.75, shorter: 0.42, wide: 0.19, widest: 0.66, ribs: 7, spread: 0.33 };

// Its whorl's picture (leafCanvas "chestnutwhorl"): rings of hands round the
// middle, each [how many, how far out their stalks end (of the card), a
// leaflet's reach (of the card), their shade, where the first points].
export const CHESTNUT_WHORL = { rings: [[6, 0.1, 0.4, 100, 0.2], [4, 0.04, 0.27, 138, 0.9]] };

// A clump filling the card, with sky between the leaves. spread is how far
// out from the middle they go, as a share of the card.
// Painted darkest first, so the lighter leaves lie on top: a clump lit
// on its outside, shadowed within.
function clump(ctx, size, rand, { count, len, wid, lobes = 0, v0, v1, spread = 0.34 }) {
  const leaves = [];
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2;
    const d = size * spread * Math.sqrt(rand());
    const L = len[0] + rand() * (len[1] - len[0]);
    leaves.push([size / 2 + Math.cos(a) * d, size / 2 + Math.sin(a) * d, rand() * Math.PI * 2, L, L * wid, lobes, v0 + rand() * (v1 - v0)]);
  }
  leaves.sort((p, q) => p[6] - q[6]);
  for (const leaf of leaves) paintLeaf(ctx, ...leaf);
}

// A leaf picture's pixels let go of once they're on the graphics card -
// nothing reads them after, and the leaf atlas's are 33.5 MB on Ultra
// (8.4 on High), kept in the page for nothing (the owner's report, 20
// October 2026) - and painted again if the card resets the picture, as
// it forgets them (repaintTreePictures: app.js).
const repaints = new Map();
function keptOnCard(tex, repaint) {
  repaints.set(tex, repaint);
  tex.onUpdate = () => {
    tex.image.data = null;
  };
  return tex;
}
// After the graphics card reset the picture: every leaf picture painted
// again, to be sent to it again before it's next drawn.
export function repaintTreePictures() {
  for (const [tex, repaint] of repaints) {
    tex.image.data = repaint();
    tex.needsUpdate = true;
  }
}

let leafTextures = null;
function leafTexture(kind) {
  leafTextures ??= {};
  if (leafTextures[kind]) return leafTextures[kind];
  const tex = keptOnCard(cutoutTexture(leafCanvas(kind), leafFill(kind)), () => cutoutPixels(leafCanvas(kind), leafFill(kind)));
  if (kind === "willow") {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
  }
  leafTextures[kind] = tex;
  return tex;
}

// The colour a kind's leaf picture takes where there are no leaves.
const leafFill = (kind) => (kind === "pine" || LEAF_PICTURES[kind]?.needles ? [60, 95, 45] : kind === "willow" ? [110, 130, 60] : [80, 115, 50]);

// The leaf cards' pictures side by side in one (the owner, 19 October
// 2026: "improve efficiency of the trees to then increase complexity and
// overall look at the same or only slightly more triangle cost"): every
// kind's but the willow's hanging strands, which repeat down the strand.
// So every tree's leaf cards are one batch, one draw call a pass, where
// each kind's picture was a batch of its own - seven, and each again in
// every shadow map and pond reflection. Each card's picture is moved into
// its kind's cell (toAtlas). A cell's mipmaps are its own (they halve in
// step, cells a power of two), and a card reads half a pixel in from its
// cell's edge, so its neighbours don't bleed in close to.
// (A third row since: a kind with leaves no other's are like has a picture
// of its own - a horse chestnut's hands. Still one batch, one draw.)
// (And a fourth: a holly's, a hawthorn's and a beech's leaves, a spruce's,
// a Scots pine's and a cedar's needles - look/leafpictures.js. Sixteen
// cells, all used: the most this plan allows, docs/TREE-LOOKS-PLAN.md.)
export const ATLAS = { cols: 4, rows: 4, kinds: ["pine", "leaf", "birch", "willowleaf", "poplar", "bush", "oak", "plane", "chestnut", "chestnutwhorl", ...Object.keys(LEAF_PICTURES)] };
let atlasMap = null;
function leafAtlas() {
  if (atlasMap) return atlasMap;
  const { data, w, h } = atlasPixels();
  atlasMap = keptOnCard(pictureTexture(data, w, h), () => atlasPixels().data);
  return atlasMap;
}
// The atlas's pixels (rows bottom-up), every kind's picture painted into
// its cell.
function atlasPixels() {
  const cell = 256 * LEAF_SCALE;
  const w = cell * ATLAS.cols;
  const h = cell * ATLAS.rows;
  const data = new Uint8Array(w * h * 4);
  // (Any cell left over: no leaves, in their usual fill. A byte at a time:
  // a little array set at every pixel took a third of a second.)
  const [r, g, b] = leafFill("leaf");
  for (let i = 0; i < w * h * 4; i += 4) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
  ATLAS.kinds.forEach((kind, i) => {
    const px = cutoutPixels(leafCanvas(kind), leafFill(kind));
    const x0 = (i % ATLAS.cols) * cell;
    const y0 = Math.floor(i / ATLAS.cols) * cell;
    for (let y = 0; y < cell; y++) data.set(px.subarray(y * cell * 4, (y + 1) * cell * 4), ((y0 + y) * w + x0) * 4);
    leafBoxes[kind] = leafBox(px, cell);
  });
  return { data, w, h };
}

// The leaf cards fitted to their leaves (the graphics backlog's "leaf
// cards' own shapes"; the owner, 20 October 2026, "Work on 2 and 3"): a
// broadleaf's leaf picture fills only half to two thirds of its card, the
// rest clear - and the graphics card shades every pixel of a card, clear
// or not, through some 30 layers of them in a wood (leaf cards were 63% of
// what it drew at Parkland's slowest moment). So each card is cut down to
// the box round its picture's leaves (LEAF_CUT and up, FIT of the card more
// each side, for the blur of its mipmaps far off): still two triangles,
// every leaf where it was, a third to a half fewer pixels shaded.
export const FIT = 0.025;
// The box round each kind's leaves, [u0, v0, u1, v1] across its card (v
// up), found as the atlas is painted (atlasPixels); none for a picture with
// no leaves.
const leafBoxes = {};
export function leafBox(px, size) {
  const least = Math.ceil(LEAF_CUT * 255);
  let [x0, y0, x1, y1] = [size, size, -1, -1];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (px[(y * size + x) * 4 + 3] < least) continue;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
  }
  if (x1 < 0) return null;
  return [Math.max(0, x0 / size - FIT), Math.max(0, y0 / size - FIT), Math.min(1, (x1 + 1) / size + FIT), Math.min(1, (y1 + 1) / size + FIT)];
}
// A card geometry's cards (PlaneGeometry's four corners each, uv 0 - 1
// across it) cut down to `box` of each: every corner moved to the box's,
// everything it carries - where it is, its normal, its colour, its uv -
// read off the card at that spot, so the picture stays where it was on it.
// (How far its cards reach, measured first: the room a tree is given -
// crownBound, which cameras keep clear of and the far woods round the
// range and greens stand back from - stays as it was.)
const CARD_UV = [[0, 1], [1, 1], [0, 0], [1, 0]];
export function fitCards(geo, box) {
  if (!geo || !box) return geo;
  reachOf(geo);
  const [u0, v0, u1, v1] = box;
  const at = [[u0, v1], [u1, v1], [u0, v0], [u1, v0]];
  const uv = geo.attributes.uv;
  const all = Object.values(geo.attributes);
  for (let q = 0; q + 3 < uv.count; q += 4) {
    if (!CARD_UV.every(([u, v], c) => uv.getX(q + c) === u && uv.getY(q + c) === v)) continue;
    for (const a of all) {
      for (let j = 0; j < a.itemSize; j++) {
        const [tl, tr, bl, br] = [0, 1, 2, 3].map((c) => a.getComponent(q + c, j));
        at.forEach(([u, v], c) => {
          const top = tl + (tr - tl) * u;
          const bottom = bl + (br - bl) * u;
          a.setComponent(q + c, j, bottom + (top - bottom) * v);
        });
      }
    }
  }
  for (const a of all) a.needsUpdate = true;
  geo.boundingBox = null;
  geo.boundingSphere = null;
  return geo;
}

// Which leaf picture a tree of kind `name` and shape `si` wears: its kind's
// - but the two plane-tree shapes of the broadleaf (PLANE_SHAPES, mottled
// bark) their own lobed hands.
const leafPictureOf = (name, si) => (name === "leaf" && PLANE_SHAPES.has(si) ? "plane" : LOOK[name].texture);

// Which batch a kind's leaf picture is drawn in, and with what texture:
// the atlas's for those in it.
const cardKey = (texture) => (ATLAS.kinds.includes(texture) ? "leaves" : texture);
const cardMap = (texture) => (ATLAS.kinds.includes(texture) ? leafAtlas() : leafTexture(texture));

// A solid crown told which leaf picture its kind wears (fCell: its cell's
// corner in the atlas, a number pair a corner), so the crown's own surface
// is drawn in those leaves (leafyCrown) - what shows of it between the leaf
// cards is leaves over the dark of the tree, not a block of colour.
export function wearing(geo, texture) {
  if (!geo) return geo;
  const i = Math.max(0, ATLAS.kinds.indexOf(texture));
  const n = geo.attributes.position.count;
  const a = new Float32Array(n * 2);
  for (let k = 0; k < n; k++) {
    a[k * 2] = (i % ATLAS.cols) / ATLAS.cols;
    a[k * 2 + 1] = Math.floor(i / ATLAS.cols) / ATLAS.rows;
  }
  geo.setAttribute("fCell", new THREE.BufferAttribute(a, 2));
  return geo;
}

// A card geometry's pictures moved into its kind's cell of the atlas, once
// (its uv from 0 - 1 across the card, as PlaneGeometry made it) - its
// cards fitted to their leaves first (fitCards).
export function toAtlas(geo, texture, cellPixels = 256 * LEAF_SCALE) {
  const i = ATLAS.kinds.indexOf(texture);
  if (!geo || i < 0 || geo.userData.atlas) return geo;
  leafAtlas();
  fitCards(geo, leafBoxes[texture]);
  const uv = geo.attributes.uv;
  const inset = 0.5 / cellPixels;
  const col = i % ATLAS.cols;
  const row = Math.floor(i / ATLAS.cols);
  for (let k = 0; k < uv.count; k++) uv.setXY(k, (col + inset + uv.getX(k) * (1 - 2 * inset)) / ATLAS.cols, (row + inset + uv.getY(k) * (1 - 2 * inset)) / ATLAS.rows);
  uv.needsUpdate = true;
  geo.userData.atlas = texture;
  return geo;
}

// A kind's leaf picture, painted: on a 256 grid, at twice that (LEAF_SCALE)
// or more on the canvas, so a tree seen from the address or the putting
// camera has crisp leaves.
function leafCanvas(kind) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size * LEAF_SCALE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.scale(LEAF_SCALE, LEAF_SCALE);
  const rand = seeded(kind === "pine" ? 5 : kind === "willow" ? 13 : kind === "oak" ? 9 : kind === "birch" ? 17 : kind === "poplar" ? 23 : kind === "bush" ? 29 : kind === "willowleaf" ? 31 : kind === "plane" ? 41 : kind === "chestnut" ? 43 : kind === "chestnutwhorl" ? 47 : (LEAF_PICTURES[kind]?.seed ?? 37));
  if (LEAF_PICTURES[kind]) {
    // One of the later kinds' own (look/leafpictures.js).
    LEAF_PICTURES[kind].paint(ctx, size, rand, { paintLeaf, dilate: dilateCutout });
  } else if (kind === "willow") {
    // A dense ribbon of hanging leaves. It tiles down the strand, and the
    // leaves overlap, so the fall is a curtain rather than a string of dots.
    const n = 5;
    for (let col = 0; col < 3; col++) {
      const x = size * (0.2 + col * 0.3);
      for (let i = 0; i < n; i++) {
        const y = (i / n) * size;
        const ang = Math.PI / 2 + (rand() - 0.5) * 0.15;
        const L = size / n + 20 + rand() * 6;
        const w = 6.5;
        const v = 138 + rand() * 55;
        const px = x + (rand() - 0.5) * 12;
        paintLeaf(ctx, px, y, ang, L, w, 0, v);
        paintLeaf(ctx, px + (rand() - 0.5) * 16, y + L * 0.32, ang + (rand() - 0.5) * 0.2, L * 0.75, w * 0.8, 0, v - 15);
        if (y + L > size - 2) paintLeaf(ctx, px, y - size, ang, L, w, 0, v);
      }
    }
    dilateCutout(ctx, 1);
  } else if (kind === "pine") {
    // Feathers: a stem with needles off both sides. A burst from one point
    // reads as a tuft of grass. Several feathers overlap so the dark cone
    // behind the cards doesn't show through.
    for (let t = 0; t < 8; t++) {
      const ang = rand() * Math.PI * 2;
      const x0 = size * (0.3 + rand() * 0.4);
      const y0 = size * (0.3 + rand() * 0.4);
      const reach = size * (0.22 + rand() * 0.1);
      const x1 = x0 + Math.cos(ang) * reach;
      const y1 = y0 + Math.sin(ang) * reach;
      ctx.strokeStyle = "rgb(78,58,34)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      for (let i = 1; i <= 18; i++) {
        const f = i / 18;
        const x = x0 + (x1 - x0) * f;
        const y = y0 + (y1 - y0) * f;
        const nlen = 14 + rand() * 18;
        const v = 90 + rand() * 60;
        for (const side of [-1, 1]) {
          const a = ang + side * (0.5 + rand() * 0.2);
          ctx.strokeStyle = `rgb(${(v * 0.38) | 0},${(v * 0.7) | 0},${(v * 0.3) | 0})`;
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.cos(a) * nlen, y + Math.sin(a) * nlen);
          ctx.stroke();
        }
      }
    }
    dilateCutout(ctx, 1);
  } else if (kind === "oak") {
    // A clump of broad oak leaves, not a filled green disk and not a long
    // twig (a twig across the card reads as a hanging strand once the card
    // is turned). Sky shows between the leaves. The cards are a little
    // fewer and larger (LOOK.oak) so the crown stays full.
    const leaf = (x, y, ang, len) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      const lobes = 3;
      const wid = len * 0.62;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let i = 1; i <= 28; i++) {
        const t = i / 28;
        const bulge = Math.sin(t * Math.PI);
        const lobe = 0.7 + 0.3 * Math.max(0, Math.sin(t * lobes * Math.PI));
        ctx.lineTo(t * len, wid * bulge * lobe);
      }
      for (let i = 28; i >= 0; i--) {
        const t = i / 28;
        const bulge = Math.sin(Math.max(t, 0.001) * Math.PI);
        const lobe = 0.7 + 0.3 * Math.max(0, Math.sin(t * lobes * Math.PI));
        ctx.lineTo(t * len, -wid * bulge * lobe);
      }
      ctx.closePath();
      const v = 100 + rand() * 70;
      ctx.fillStyle = `rgb(${(v * 0.4) | 0},${(v * 0.68) | 0},${(v * 0.28) | 0})`;
      ctx.fill();
      ctx.fillStyle = `rgb(${(v * 0.58) | 0},${(v * 0.94) | 0},${(v * 0.4) | 0})`;
      ctx.save();
      ctx.translate(len * 0.14, 0);
      ctx.scale(0.68, 0.52);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = `rgba(${Math.min(255, v * 0.8) | 0},${Math.min(255, v) | 0},${(v * 0.32) | 0},0.85)`;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(len * 0.08, 0);
      ctx.lineTo(len * 0.88, 0);
      ctx.stroke();
      ctx.restore();
    };
    for (let i = 0; i < 22; i++) {
      const a = rand() * Math.PI * 2;
      const d = size * 0.34 * Math.sqrt(rand());
      leaf(size / 2 + Math.cos(a) * d, size / 2 + Math.sin(a) * d, rand() * Math.PI * 2, 34 + rand() * 28);
    }
    dilateCutout(ctx, 2);
  } else if (kind === "birch") {
    // A tuft of small pointed leaves. Many small cards (birchCards) overlap
    // into a light crown; a filled card would read as a green lump.
    clump(ctx, size, rand, { count: 26, len: [18, 32], wid: 0.52, v0: 165, v1: 225, spread: 0.4 });
    dilateCutout(ctx, 1);
  } else if (kind === "plane") {
    // A plane's (and a maple's): broad hands of five pointed lobes on long
    // stalks, a vein out to each lobe - so the plane-tree shapes
    // (PLANE_SHAPES) aren't in the other broadleaves' ovals.
    const hand = (x, y, ang, size, v) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.beginPath();
      const n = 60;
      for (let i = 0; i <= n; i++) {
        // Round from the stalk, the lobes' tips at ±0, ±0.4, ±0.8 of a turn's half.
        const t = -Math.PI * 0.92 + (i / n) * Math.PI * 1.84;
        const lobe = Math.pow(Math.abs(Math.cos(t * 2.5)), 0.7);
        const r = size * (0.38 + 0.62 * lobe) * (0.75 + 0.25 * Math.cos(t * 0.5));
        const px = Math.cos(t) * r;
        const py = Math.sin(t) * r;
        if (i) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      }
      ctx.lineTo(-size * 0.12, 0);
      ctx.closePath();
      ctx.fillStyle = `rgb(${(v * 0.42) | 0},${(v * 0.7) | 0},${(v * 0.3) | 0})`;
      ctx.fill();
      // Lighter over its middle, as the other broadleaves' (paintLeaf): so
      // its picture's average is theirs (LEAF_AVERAGE).
      ctx.save();
      ctx.scale(0.66, 0.66);
      ctx.fillStyle = `rgb(${(v * 0.6) | 0},${(v * 0.95) | 0},${(v * 0.42) | 0})`;
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = `rgba(${Math.min(255, v * 0.75) | 0},${Math.min(255, v) | 0},${(v * 0.35) | 0},0.8)`;
      ctx.lineWidth = 0.8;
      for (const t of [0, 0.4, -0.4, 0.8, -0.8]) {
        ctx.beginPath();
        ctx.moveTo(-size * 0.1, 0);
        ctx.lineTo(Math.cos(t * Math.PI) * size * 0.85, Math.sin(t * Math.PI) * size * 0.85);
        ctx.stroke();
      }
      // Its stalk.
      ctx.beginPath();
      ctx.moveTo(-size * 0.1, 0);
      ctx.lineTo(-size * 0.55, 0);
      ctx.stroke();
      ctx.restore();
    };
    for (let i = 0; i < 18; i++) {
      const a = rand() * Math.PI * 2;
      const d = size * 0.34 * Math.sqrt(rand());
      hand(size / 2 + Math.cos(a) * d, size / 2 + Math.sin(a) * d, rand() * Math.PI * 2, 17 + rand() * 11, 100 + rand() * 70);
    }
    dilateCutout(ctx, 2);
  } else if (kind === "chestnut") {
    // A horse chestnut's: big hands of five to seven leaflets from the end
    // of one stalk (chestnutHand) - nothing like a plane's one lobed blade,
    // and big enough to read as hands from the tee (CHESTNUT_LEAF).
    // Painted darkest first, as a clump is.
    const C = CHESTNUT_LEAF;
    const hand = chestnutHand(ctx, rand);
    const hands = [];
    for (let i = 0; i < C.hands; i++) {
      const a = rand() * Math.PI * 2;
      const d = size * C.spread * Math.sqrt(rand());
      hands.push([size / 2 + Math.cos(a) * d, size / 2 + Math.sin(a) * d, rand() * Math.PI * 2, C.reach[0] + rand() * (C.reach[1] - C.reach[0]), 96 + rand() * 78]);
    }
    hands.sort((p, q) => p[4] - q[4]);
    for (const h of hands) hand(...h);
    dilateCutout(ctx, 2);
  } else if (kind === "chestnutwhorl") {
    // The end of one of its shoots, from above: its leaves' hands all
    // round, their stalks from the middle, the leaflets out to the card's
    // edge with the sky between their tips - worn by its shoot ends,
    // a shallow umbrella of triangles, not a flat card. An inner ring of
    // smaller, lighter hands over an outer one.
    const W = CHESTNUT_WHORL;
    const hand = chestnutHand(ctx, rand);
    const mid = size / 2;
    for (const [n, stalk, reach, v0, turn] of W.rings) {
      for (let i = 0; i < n; i++) {
        const a = turn + (i / n) * Math.PI * 2 + (rand() - 0.5) * 0.25;
        hand(mid + Math.cos(a) * size * stalk, mid + Math.sin(a) * size * stalk, a, size * reach * (0.94 + rand() * 0.1), v0 + rand() * 30);
      }
    }
    dilateCutout(ctx, 2);
  } else if (kind === "poplar") {
    clump(ctx, size, rand, { count: 48, len: [22, 40], wid: 0.42, v0: 90, v1: 155, spread: 0.4 });
    dilateCutout(ctx, 1);
  } else if (kind === "bush") {
    clump(ctx, size, rand, { count: 36, len: [18, 34], wid: 0.7, v0: 110, v1: 175, spread: 0.4 });
    dilateCutout(ctx, 1);
  } else if (kind === "willowleaf") {
    // The dome, not the curtain: narrow leaves in a clump. No long twig.
    clump(ctx, size, rand, { count: 20, len: [36, 64], wid: 0.2, v0: 130, v1: 190, spread: 0.32 });
    dilateCutout(ctx, 1);
  } else {
    // A broadleaf that isn't an oak: plain ovals, big enough to read.
    clump(ctx, size, rand, { count: 30, len: [28, 50], wid: 0.46, v0: 100, v1: 170, spread: 0.38 });
    dilateCutout(ctx, 2);
  }
  return canvas;
}

// A pixel of colour just outside each leaf, at a low alpha, so the small
// versions of the card (and alpha-to-coverage) don't fringe dark. The
// canvas is already scaled; this works in its pixels (sim/dilate.mjs: only
// the see-through pixels with leaves round them looked at closely - the
// same picture as before, in less time).
function dilateCutout(ctx, radius) {
  const { width: w, height: h } = ctx.canvas;
  const img = ctx.getImageData(0, 0, w, h);
  dilatePixels(img.data, img.data, w, h, radius);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.putImageData(img, 0, 0);
  ctx.restore();
}

// A horse chestnut's candle, painted in the cell from x0 across (size
// square): its green stem, then florets up it - the widest ring a third of
// the way up, none below a tenth, a point at the top - the lower ones
// first so the upper lie over them.
function paintCandle(ctx, x0, size, rand) {
  const mid = x0 + size / 2;
  const base = size * 0.97;
  const top = size * 0.04;
  ctx.strokeStyle = "rgb(150,185,120)";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(mid, base);
  ctx.lineTo(mid, top + 6);
  ctx.stroke();
  const half = (t) => size * 0.27 * (t < 0.3 ? 0.4 + 0.6 * (t / 0.3) : Math.pow((1 - t) / 0.7, 0.75));
  for (let i = 0; i < 190; i++) {
    const t = 0.05 + 0.95 * (i / 190);
    const w = half(t);
    const px = mid + (rand() * 2 - 1) * w;
    const py = base + (top - base) * t + (rand() - 0.5) * 3;
    const r = 2.5 + rand() * 1.6 - t * 0.9;
    const v = 226 + rand() * 29;
    ctx.fillStyle = `rgb(${v},${v},${(v - 6) | 0})`;
    for (let k = 0; k < 4; k++) {
      const b = (k / 4) * Math.PI * 2 + rand() * 1.5;
      ctx.beginPath();
      ctx.arc(px + Math.cos(b) * r * 0.9, py + Math.sin(b) * r * 0.9, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = rand() < 0.5 ? "rgb(235,200,90)" : "rgb(225,120,135)";
    ctx.beginPath();
    ctx.arc(px, py, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
  }
}

let blossomMap = null;
// Small white florets (tinted each shrub's colour), the leaves showing
// between them.
// Beside them (the picture's second cell, BLOSSOM_CELLS): a horse
// chestnut's candle - an upright spike of small white flowers, widest a
// third of the way up and drawn to a point, each floret with a speck of
// yellow or pink at its heart. One picture still, so a tree in flower and
// a shrub in bloom are the same batch.
export const BLOSSOM_CELLS = 2;
function blossomTexture() {
  if (blossomMap) return blossomMap;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size * LEAF_SCALE * BLOSSOM_CELLS;
  canvas.height = size * LEAF_SCALE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.scale(LEAF_SCALE, LEAF_SCALE);
  paintCandle(ctx, size, size, seeded(67));
  const rand = seeded(61);
  // Separate florets, each five petals round a darker eye, scattered over
  // a round clump.
  for (let i = 0; i < 110; i++) {
    const a = rand() * Math.PI * 2;
    const d = size * 0.4 * Math.sqrt(rand());
    const px = size / 2 + Math.cos(a) * d;
    const py = size / 2 + Math.sin(a) * d;
    const v = 220 + rand() * 35;
    const r = 2.4 + rand() * 1.4;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    for (let k = 0; k < 5; k++) {
      const b = (k / 5) * Math.PI * 2 + rand();
      ctx.beginPath();
      ctx.arc(px + Math.cos(b) * r, py + Math.sin(b) * r, r * 0.85, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgb(120,110,80)";
    ctx.beginPath();
    ctx.arc(px, py, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  blossomMap = cutoutTexture(canvas, [200, 200, 200]);
  return blossomMap;
}

// Cards scattered over spheres [x, y, z, r]: each a quad facing outwards,
// twisted at random, with normals from the sphere's centre.
export function cardsOn(spheres, perSphere, size, rand, fill = 0) {
  const geos = [];
  for (const [cx, cy, cz, r] of spheres) {
    for (let i = 0; i < perSphere; i++) {
      // Even-ish spread over the sphere (Fibonacci), jittered.
      const t = (i + 0.5) / perSphere;
      const phi = Math.acos(1 - 2 * t) + (rand() - 0.5) * 0.3;
      const theta = i * 2.39996 + rand() * 0.5;
      const dir = new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta));
      const s = size * r * (0.8 + rand() * 0.5);
      const g = new THREE.PlaneGeometry(s, s);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rand() * Math.PI * 2));
      g.applyQuaternion(q);
      // fill pulls some cards into the lump (a birch), so the crown is a
      // mass of leaves rather than a shell with the dark middle showing.
      // No extra draw from rand when fill is 0: every other kind stays put.
      let shell = 0.85 + rand() * 0.25;
      if (fill) shell -= fill * rand();
      // Under the lump, as flat as its solid crown is there (FLAT_UNDER):
      // round, the cards hung below it, leaves in the air with nothing
      // behind them.
      if (dir.y < 0) shell /= Math.hypot(dir.x, dir.z, dir.y / FLAT_UNDER);
      const at = dir.clone().multiplyScalar(r * shell).add(new THREE.Vector3(cx, cy, cz));
      g.translate(at.x, at.y, at.z);
      // Normals out from the sphere centre, for round shading.
      const pos = g.attributes.position;
      const nor = g.attributes.normal;
      for (let k = 0; k < pos.count; k++) {
        const n = new THREE.Vector3(pos.getX(k) - cx, pos.getY(k) - cy, pos.getZ(k) - cz).normalize();
        nor.setXYZ(k, n.x, n.y, n.z);
      }
      geos.push(g);
    }
  }
  return shadeParts(mergeGeometries(geos), geos.length, rand, { low: 3, high: 8.5 });
}

// A silver birch's leaves: a loose cloud in each lump, not a shell of cards.
// A shell reads as bubbles, and the dark crown shows through the gaps.
function birchCards(spheres, perSphere, size, rand) {
  const geos = [];
  for (const [cx, cy, cz, r] of spheres) {
    for (let i = 0; i < perSphere; i++) {
      const a = rand() * Math.PI * 2;
      const rr = r * (0.15 + 0.9 * Math.pow(rand(), 0.5));
      const yb = (rand() - 0.28) * r;
      const s = size * r * (0.7 + rand() * 0.5);
      const g = new THREE.PlaneGeometry(s, s * (0.8 + rand() * 0.3));
      const dir = new THREE.Vector3(Math.cos(a), 0.25 + rand() * 0.55, Math.sin(a)).normalize();
      // (Spun about its own face, before it's turned to face out.)
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rand() * Math.PI));
      g.applyQuaternion(q);
      g.translate(cx + Math.cos(a) * rr, cy + yb, cz + Math.sin(a) * rr);
      const pos = g.attributes.position;
      const nor = g.attributes.normal;
      for (let k = 0; k < pos.count; k++) {
        const n = new THREE.Vector3(pos.getX(k) - cx, (pos.getY(k) - cy) * 0.5 + 0.45, pos.getZ(k) - cz).normalize();
        nor.setXYZ(k, n.x, n.y, n.z);
      }
      geos.push(g);
    }
  }
  return shadeParts(mergeGeometries(geos), geos.length, rand, { low: 3, high: 8.5 });
}

// A Scots pine's ragged top (the owner, 12 November 2026, to a review of
// every kind - docs/TREE-REVIEW.md: it was a tidy cone on a pole): two
// plates of needles more, drawn only - a ball meets the tree as its shape
// has it (sim/treehits.mjs) - one out past the rim of its lowest tier and
// a little under it, one smaller on the other side higher up, a different
// way round for each shape: a flat, lopsided head, as the real one has.
// Their needles from a sequence of their own (ragged), so no other kind's
// move. Near and close up; its distant version, a few pixels tall, as it was. [r, h, y, dx, dz] each, as its tiers.
export const SCOTS_RAG = { out: [0.8, 0.62], size: [0.62, 0.45], drop: [0.55, -0.35] };
function scotsRag(tiers, turn, R = SCOTS_RAG) {
  const [r, h, y, dx, dz] = tiers[0];
  const top = tiers.at(-1);
  return [
    [r * R.size[0], h * 0.8, y - R.drop[0], dx + Math.cos(turn) * r * R.out[0], dz + Math.sin(turn) * r * R.out[0]],
    [r * R.size[1], h * 0.7, (y + top[2]) / 2 - R.drop[1], dx - Math.cos(turn + 0.5) * r * R.out[1], dz - Math.sin(turn + 0.5) * r * R.out[1]],
  ];
}
// (A conifer's needle cards with a Scots pine's ragged plates after them.)
function ragged(name, k, si, cards, tiers, opts, tag) {
  if (name !== "scots" || !cards) return cards;
  const extra = scotsRag(tiers, ((k * 7 + si * 13) % 20) * 0.314);
  const lumps = extra.map(([r, , y, dx, dz]) => [dx, y, dz, r]);
  return mergeGeometries([cards, crownDepth(pineCards(extra, seeded(0x5c07 + tag * 101 + si * 31), opts), lumps)]);
}

function pineCards(tiers, rand, { every = 1, grow = 1, deep = null, under = 0 } = {}) {
  // Rings of needle cards round each tier, drooping outwards (the rings
  // a ball meets: sim/treeshapes.mjs pineRings), and the odd gap where a
  // branch is missing. With gaps in the solid crown (leafyCrown) the
  // needles carry the tree's shape. (A low tree's: one card in `every`,
  // `grow` times the size - lowGeometry. A close-up one's: more of them,
  // smaller, and `deep` [from, to] - spread that share of the way out
  // along its branches, not only round their tips: CONIFER_CLOSE. And with
  // `under`, needles under each tier and where tiers too far apart meet,
  // that many times as many: underCards, joinCards.)
  const rings = pineRings(tiers);
  const geos = [];
  for (const [r, y, nAll, dx, dz] of rings) {
    const n = Math.max(3, Math.round(nAll / every));
    for (let i = 0; i < n; i++) {
      if (rand() < 0.12) continue;
      const a = (i / n) * Math.PI * 2 + rand() * 0.4;
      const s = (1.5 + r * 0.45) * (0.8 + rand() * 0.4) * 1.28 * grow;
      const g = new THREE.PlaneGeometry(s, s * 0.8);
      g.rotateX(-Math.PI / 2 + 0.55 + rand() * 0.2); // lying out and down
      g.translate(0, 0, r * (deep ? deep[0] + rand() * (deep[1] - deep[0]) : 0.55 + rand() * 0.15));
      g.rotateY(-a);
      g.translate(dx, y - 0.6 + rand() * 0.4, dz);
      const pos = g.attributes.position;
      const nor = g.attributes.normal;
      for (let k = 0; k < pos.count; k++) {
        const n2 = new THREE.Vector3(pos.getX(k) - dx, 0.6, pos.getZ(k) - dz).normalize();
        nor.setXYZ(k, n2.x, n2.y, n2.z);
      }
      geos.push(g);
    }
  }
  const cards = shadeParts(mergeGeometries(geos), geos.length, rand, { low: 1, high: 10 });
  if (!under) return cards;
  const join = joinCards(tiers, { count: under / every, grow });
  return mergeGeometries([cards, underCards(tiers, { count: under / every, grow }), ...(join ? [join] : [])]);
}

// Needles where a conifer's tiers meet (the owner, 15 October 2026: "the
// spruce is a bit gappy"): with no solid core, a spruce's tiers - six or
// seven, small, up a tall trunk - read as separate puffs with sky and the
// trunk between them, its rings of cards too far apart for their cards to
// meet. Where two rings (by height, any tier's) are more than `gap` of
// their cards' depth apart, a ring between them, half way in height and
// width, set a little further in (`from`, `to` of its radius) to cover the
// trunk there; `perMetre` cards to a metre of its radius, over `least`.
// (Only a spruce's upper tiers have such gaps: a pine's, Scots pine's and
// column's cards are big enough to meet.) Randomness of its own, as
// underCards'.
export const JOIN = { gap: 0.45, from: 0.3, to: 0.65, perMetre: 2.5, least: 4 };
export const needleCardDepth = (r) => (1.5 + r * 0.45) * 1.28 * 0.8;
function joinCards(tiers, { count = 1, grow = 1 } = {}) {
  const rand = seeded(Math.round(tiers.reduce((a, [r, h, y]) => a + r * 131 + h * 17 + y * 7, 0) * 1000) ^ 0x701e);
  const rings = pineRings(tiers).sort((a, b) => a[1] - b[1]);
  const geos = [];
  for (let j = 1; j < rings.length; j++) {
    const [ra, ya, , dxa, dza] = rings[j - 1];
    const [rb, yb, , dxb, dzb] = rings[j];
    const r = (ra + rb) / 2;
    if (yb - ya <= JOIN.gap * needleCardDepth(r)) continue;
    const [y, dx, dz] = [(ya + yb) / 2, (dxa + dxb) / 2, (dza + dzb) / 2];
    const n = Math.max(JOIN.least, Math.round((JOIN.least + r * JOIN.perMetre) * count));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand() * 0.5;
      const s = (1.5 + r * 0.45) * (0.8 + rand() * 0.4) * 1.28 * grow;
      const g = new THREE.PlaneGeometry(s, s * 0.8);
      g.rotateX(-Math.PI / 2 + 0.55 + rand() * 0.2); // lying out and down, as the rings' do
      g.translate(0, 0, r * (JOIN.from + rand() * (JOIN.to - JOIN.from)));
      g.rotateY(-a);
      g.translate(dx, y - 0.6 + rand() * 0.4, dz);
      const pos = g.attributes.position;
      const nor = g.attributes.normal;
      for (let k = 0; k < pos.count; k++) {
        const n2 = new THREE.Vector3(pos.getX(k) - dx, 0.6, pos.getZ(k) - dz).normalize();
        nor.setXYZ(k, n2.x, n2.y, n2.z);
      }
      geos.push(g);
    }
  }
  return geos.length ? shadeParts(mergeGeometries(geos), geos.length, rand, { low: 1, high: 10 }) : null;
}

// Needles under a conifer's tiers (the owner, 15 October 2026: "Pine still
// shows an 'under carriage' - could this be textured to remove the blocky
// look underneath?"): needle cards lying out under each tier, drooping a
// little, from near the trunk most of the way to its rim, so seen from
// beside or below - from the tee, under the trees lining a hole - it's
// needles, not the solid tier's smooth underside. With randomness of their
// own (the usual cards stay exactly as they were), a little smaller than
// the rings' and darker (`shade`): the underside of a tree is in its own
// shade. `perMetre`: how many to a metre of a tier's radius; `from`, `to`:
// how far out along it, as a share; `size`: of the rings' cards.
export const UNDER = { perMetre: 2.6, from: 0.3, to: 0.75, size: 0.8, shade: 0.72 };

function underCards(tiers, { count = 1, grow = 1 } = {}) {
  const rand = seeded(Math.round(tiers.reduce((a, [r, h, y]) => a + r * 131 + h * 17 + y * 7, 0) * 1000) ^ 0x0d0e);
  const geos = [];
  for (const [r, h, y, dx, dz] of tiers) {
    const n = Math.max(3, Math.round(r * UNDER.perMetre * count));
    for (let i = 0; i < n; i++) {
      if (rand() < 0.1) continue;
      const a = (i / n) * Math.PI * 2 + rand() * 0.5;
      const t = UNDER.from + rand() * (UNDER.to - UNDER.from);
      const size = (1.5 + r * 0.45) * (0.8 + rand() * 0.4) * 1.28 * UNDER.size * grow;
      const g = new THREE.PlaneGeometry(size, size * 0.8);
      g.rotateX(-Math.PI / 2 + 0.15 + rand() * 0.2); // lying out, drooping a little
      g.translate(0, 0, r * t);
      g.rotateY(-a);
      // Just under the tier's underside there (pineTier's profile: from
      // 0.28 of its height under the middle at the trunk to half under at
      // the rim).
      g.translate(dx, y - h * (0.3 + 0.22 * t) - 0.1, dz);
      const pos = g.attributes.position;
      const nor = g.attributes.normal;
      for (let k = 0; k < pos.count; k++) {
        const n2 = new THREE.Vector3(pos.getX(k) - dx, -0.5, pos.getZ(k) - dz).normalize();
        nor.setXYZ(k, n2.x, n2.y, n2.z);
      }
      geos.push(g);
    }
  }
  const geo = shadeParts(mergeGeometries(geos), geos.length, rand, { low: 1, high: 10 });
  const col = geo.attributes.color;
  for (let i = 0; i < col.count; i++) col.setXYZ(i, col.getX(i) * UNDER.shade, col.getY(i) * UNDER.shade, col.getZ(i) * UNDER.shade);
  return geo;
}

// The colours a tree may be, by kind: each a hue, saturation and lightness
// range (HSL, 0-1) and how often it's picked. A wood of one green looks
// painted; real ones mix darker and fresher trees, blue-grey conifers,
// yellower ones, the odd silvery or copper-leaved one, and now and then one
// turning early. (Each tint a number on its tree's instance, so more of
// them cost nothing: the owner, 27 October 2026, "greater variety without
// affecting overall resource usage".)
export const TREE_TINTS = {
  // (Spruces and Scots pines are kinds of their own now: a pine is dark
  // green, blue-grey or deep.)
  pine: [
    { name: "dark green", hue: [0.292, 0.347], sat: [0.35, 0.45], light: [0.24, 0.32], weight: 4 },
    { name: "blue-grey", hue: [0.4, 0.46], sat: [0.18, 0.3], light: [0.3, 0.38], weight: 1.5 },
    { name: "deep", hue: [0.31, 0.36], sat: [0.3, 0.4], light: [0.18, 0.24], weight: 1 },
    { name: "yellow-green", hue: [0.25, 0.29], sat: [0.3, 0.4], light: [0.27, 0.33], weight: 0.9 },
  ],
  leaf: [
    { name: "mid green", hue: [0.236, 0.292], sat: [0.38, 0.5], light: [0.3, 0.4], weight: 4 },
    { name: "fresh", hue: [0.2, 0.25], sat: [0.48, 0.6], light: [0.36, 0.44], weight: 2 },
    { name: "deep", hue: [0.27, 0.33], sat: [0.35, 0.45], light: [0.22, 0.29], weight: 2 },
    { name: "olive", hue: [0.15, 0.2], sat: [0.35, 0.45], light: [0.3, 0.37], weight: 1.2 },
    { name: "silvery", hue: [0.24, 0.3], sat: [0.12, 0.22], light: [0.38, 0.46], weight: 0.8 },
    { name: "copper beech", hue: [0.96, 1.0], sat: [0.25, 0.38], light: [0.2, 0.27], weight: 0.25 },
    { name: "lime", hue: [0.19, 0.23], sat: [0.5, 0.6], light: [0.38, 0.45], weight: 0.7 },
    { name: "blue-green", hue: [0.3, 0.36], sat: [0.26, 0.36], light: [0.26, 0.33], weight: 0.9 },
    { name: "turning", hue: [0.09, 0.13], sat: [0.5, 0.62], light: [0.34, 0.42], weight: 0.12 },
  ],
  // A silver birch's small leaves: fresh, light, a little yellow.
  birch: [
    { name: "fresh", hue: [0.19, 0.24], sat: [0.45, 0.58], light: [0.38, 0.46], weight: 3 },
    { name: "mid", hue: [0.23, 0.27], sat: [0.38, 0.5], light: [0.33, 0.4], weight: 2 },
    { name: "turning", hue: [0.12, 0.16], sat: [0.5, 0.6], light: [0.38, 0.45], weight: 0.3 },
    { name: "deep", hue: [0.24, 0.29], sat: [0.35, 0.45], light: [0.28, 0.34], weight: 1 },
  ],
  // A willow's: soft yellow-green, silvery beneath.
  willow: [
    { name: "yellow-green", hue: [0.17, 0.22], sat: [0.4, 0.55], light: [0.38, 0.46], weight: 3 },
    { name: "silvery", hue: [0.2, 0.26], sat: [0.18, 0.3], light: [0.4, 0.47], weight: 1.5 },
  ],
  // A poplar's: deep and glossy, or fresher.
  poplar: [
    { name: "deep", hue: [0.26, 0.31], sat: [0.35, 0.45], light: [0.24, 0.3], weight: 2 },
    { name: "fresh", hue: [0.22, 0.26], sat: [0.42, 0.54], light: [0.32, 0.4], weight: 1.5 },
    { name: "silvery", hue: [0.22, 0.28], sat: [0.14, 0.24], light: [0.36, 0.43], weight: 0.6 },
  ],
  // A bush: dark evergreens, a glossy holly-green, a yellower green, a
  // golden privet, a blue-grey juniper, now and then a purple-leaved one
  // (a berberis or smoke bush) or a silvery one.
  bush: [
    { name: "dark", hue: [0.28, 0.34], sat: [0.3, 0.42], light: [0.2, 0.27], weight: 3 },
    { name: "glossy", hue: [0.3, 0.36], sat: [0.35, 0.48], light: [0.24, 0.3], weight: 2 },
    { name: "yellow-green", hue: [0.2, 0.24], sat: [0.35, 0.48], light: [0.28, 0.35], weight: 1.5 },
    { name: "golden", hue: [0.14, 0.18], sat: [0.5, 0.62], light: [0.36, 0.44], weight: 0.6 },
    { name: "blue-grey", hue: [0.42, 0.48], sat: [0.14, 0.24], light: [0.3, 0.37], weight: 0.8 },
    { name: "purple-leaved", hue: [0.93, 0.99], sat: [0.25, 0.38], light: [0.2, 0.27], weight: 0.4 },
    { name: "silvery", hue: [0.24, 0.3], sat: [0.1, 0.18], light: [0.4, 0.47], weight: 0.4 },
  ],
  // A Scots pine's needles: yellower and greyer than a pine's.
  scots: [
    { name: "yellow-green", hue: [0.22, 0.27], sat: [0.28, 0.38], light: [0.27, 0.34], weight: 3 },
    { name: "grey-green", hue: [0.27, 0.32], sat: [0.18, 0.28], light: [0.28, 0.34], weight: 1.5 },
  ],
  // A spreading oak's: mid, deep or a little olive.
  oak: [
    { name: "mid green", hue: [0.22, 0.28], sat: [0.35, 0.47], light: [0.27, 0.36], weight: 3 },
    { name: "deep", hue: [0.26, 0.31], sat: [0.32, 0.42], light: [0.22, 0.28], weight: 2 },
    { name: "olive", hue: [0.16, 0.21], sat: [0.32, 0.42], light: [0.28, 0.34], weight: 1 },
    { name: "fresh", hue: [0.2, 0.24], sat: [0.42, 0.52], light: [0.32, 0.4], weight: 1 },
  ],
  // A yew's or a cypress's: a very dark blue-green, never black.
  column: [
    { name: "yew", hue: [0.36, 0.42], sat: [0.25, 0.36], light: [0.15, 0.19], weight: 3 },
    { name: "cypress", hue: [0.3, 0.36], sat: [0.28, 0.38], light: [0.16, 0.2], weight: 1.5 },
  ],
  // A spruce's: blue-green.
  spruce: [
    { name: "blue-green", hue: [0.38, 0.45], sat: [0.2, 0.32], light: [0.23, 0.3], weight: 3 },
    { name: "dark", hue: [0.33, 0.39], sat: [0.25, 0.35], light: [0.2, 0.26], weight: 1.5 },
    { name: "silver-blue", hue: [0.45, 0.5], sat: [0.15, 0.25], light: [0.32, 0.38], weight: 0.6 },
  ],
  // A snag has no leaves (its bark is look/palette.js barkSnag); this is
  // only what a far one's twigs are tinted.
  snag: [
    { name: "bare twigs", hue: [0.07, 0.12], sat: [0.1, 0.18], light: [0.3, 0.38], weight: 1 },
  ],
  // A beech's: a clear, bright mid-green - and about one in eight a copper
  // beech, its leaves a deep red-purple.
  beech: [
    { name: "bright", hue: [0.21, 0.26], sat: [0.45, 0.56], light: [0.3, 0.38], weight: 3 },
    { name: "deep", hue: [0.24, 0.29], sat: [0.36, 0.46], light: [0.25, 0.31], weight: 1.5 },
    { name: "copper", hue: [0.93, 0.98], sat: [0.24, 0.34], light: [0.16, 0.21], weight: 0.65 },
  ],
  // A horse chestnut's: a heavy, dark green. (A little lighter than it
  // was - 0.22 - 0.28 and 0.27 - 0.33: from a tee its shaded side came out
  // near black, a third as bright as the trees beside it.)
  chestnut: [
    { name: "dark", hue: [0.27, 0.32], sat: [0.38, 0.48], light: [0.25, 0.31], weight: 3 },
    { name: "mid", hue: [0.25, 0.29], sat: [0.42, 0.52], light: [0.3, 0.36], weight: 1.5 },
  ],
  // A cedar's: a dark blue-green, or a little silvery.
  cedar: [
    { name: "blue-green", hue: [0.36, 0.43], sat: [0.18, 0.28], light: [0.21, 0.27], weight: 3 },
    { name: "silvery", hue: [0.4, 0.47], sat: [0.12, 0.2], light: [0.3, 0.36], weight: 1 },
  ],
  // A holly's: very dark and glossy, now and then a variegated one.
  holly: [
    { name: "dark glossy", hue: [0.29, 0.35], sat: [0.32, 0.44], light: [0.16, 0.21], weight: 3 },
    { name: "variegated", hue: [0.17, 0.22], sat: [0.3, 0.42], light: [0.3, 0.36], weight: 0.4 },
  ],
  // A hawthorn's: a fresh mid-green, or greyer on a windswept one.
  hawthorn: [
    { name: "fresh", hue: [0.21, 0.26], sat: [0.4, 0.5], light: [0.28, 0.35], weight: 3 },
    { name: "grey-green", hue: [0.24, 0.29], sat: [0.24, 0.34], light: [0.27, 0.33], weight: 1.2 },
  ],
};

// The accent trees: gold and copper, turning early (makeTrees) - about one
// broadleaf in 80.
export const ACCENT = { share: 0.0125 };
TREE_TINTS.accent = [
  { name: "gold", hue: [0.11, 0.14], sat: [0.5, 0.62], light: [0.36, 0.43], weight: 1.2 },
  { name: "copper", hue: [0.03, 0.065], sat: [0.42, 0.55], light: [0.27, 0.33], weight: 1 },
];

// The broadleaves the seasons change (look/season.js), and their leaves
// in autumn (gold, copper, rust, red) and the dead brown a beech or an oak
// holds through winter.
const DECIDUOUS = new Set([KIND.leaf, KIND.birch, KIND.willow, KIND.poplar, KIND.oak, KIND.beech, KIND.chestnut, KIND.hawthorn]);
TREE_TINTS.autumn = [
  ...TREE_TINTS.accent,
  { name: "rust", hue: [0.07, 0.095], sat: [0.5, 0.62], light: [0.3, 0.36], weight: 1 },
  { name: "red", hue: [0.0, 0.025], sat: [0.45, 0.6], light: [0.28, 0.34], weight: 0.5 },
  { name: "turning", hue: [0.15, 0.19], sat: [0.45, 0.55], light: [0.32, 0.38], weight: 1.1 },
];
TREE_TINTS.dead = [{ name: "dead leaves", hue: [0.05, 0.1], sat: [0.3, 0.42], light: [0.24, 0.3], weight: 1 }];

// A flowering shrub's blossom (sim/treeshapes.mjs shrubShape), one colour
// a shrub, HSL ranges as TREE_TINTS: pinks, magenta, white, lilac, red,
// broom's yellow, the odd orange.
export const BLOSSOMS = [
  { name: "pink", hue: [0.93, 0.97], sat: [0.55, 0.75], light: [0.72, 0.8], weight: 3 },
  { name: "magenta", hue: [0.87, 0.92], sat: [0.55, 0.7], light: [0.55, 0.65], weight: 1.5 },
  { name: "white", hue: [0.1, 0.16], sat: [0.1, 0.3], light: [0.9, 0.95], weight: 2 },
  { name: "lilac", hue: [0.74, 0.8], sat: [0.35, 0.55], light: [0.7, 0.78], weight: 1.5 },
  { name: "red", hue: [0.98, 1.0], sat: [0.6, 0.75], light: [0.45, 0.52], weight: 1 },
  { name: "yellow", hue: [0.13, 0.16], sat: [0.75, 0.9], light: [0.55, 0.62], weight: 1.2 },
  { name: "orange", hue: [0.06, 0.09], sat: [0.7, 0.85], light: [0.55, 0.62], weight: 0.4 },
];

// A tree's colour: a tint picked by its weight, then a point in its ranges.
export function treeTint(kind, rand, out = new THREE.Color(), list = TREE_TINTS[kind]) {
  let pick = rand() * list.reduce((a, t) => a + t.weight, 0);
  const t = list.find((x) => (pick -= x.weight) < 0) ?? list[0];
  const within = ([a, b]) => a + rand() * (b - a);
  return out.setHSL(within(t.hue) % 1, within(t.sat), within(t.light));
}

// A shade for each part of a crown - a vertex colour, multiplied into the
// tree's own: each leaf clump or lump a little lighter or darker, warmer or
// cooler, the lower ones darker (less light gets in), so no crown is one
// flat colour.
function shadeParts(geo, parts, rand, { low = 0, high = 10 } = {}) {
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const per = pos.count / parts;
  for (let p = 0; p < parts; p++) {
    const b = 0.84 + rand() * 0.28;
    const warm = (rand() - 0.5) * 0.08;
    for (let i = Math.floor(p * per); i < Math.floor((p + 1) * per); i++) {
      const up = Math.min(1, Math.max(0, (pos.getY(i) - low) / (high - low)));
      const k = b * (0.82 + 0.22 * up);
      col[i * 3] = Math.min(1, k * (1 + warm));
      col[i * 3 + 1] = Math.min(1, k);
      col[i * 3 + 2] = Math.min(1, k * (1 - warm));
    }
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return geo;
}

// ---- Trunks ----------------------------------------------------------------------

// A trunk for one tree shape (sim/treeshapes.mjs): tapering up its middle,
// bent or not, and any low branches, as tubes. Its bark's colour is the
// tree's own (look/palette.js); the vertex colours (every trunk has them)
// mark it. style:
//   "birch"  a silver birch's - white, with dark marks across it and
//            darker, rougher bark at its foot
//   "scots"  a Scots pine's - grey-brown and furred low down, turning to
//            its orange bark (its own colour) up the trunk
//   null     plain
// bark: its bark texture's kind (look/textures.js BARK_KINDS: furrowed,
// plates, birch, plane), for High's textured bark.
// A trunk stands in the shade of its own crown (the owner, 12 November 2026,
// to the trees' looks: "where's the improvements" - from the tee the
// trunks were the brightest, most orange thing in a wood: evenly lit poles,
// where under a canopy they're the darkest): from `foot` of its bark's
// colour near the ground, where the light gets in under the crown, down to
// `crown` by `to` of the way up, and cooler all the way, more as it darkens
// (`cool`, foot to crown: less of its red, more of its blue - shade is
// skylight). Its branches, inside the
// crown, at `crown`. In its corners' colours: nothing more to draw.
export const TRUNK_SHADE = { foot: 0.82, crown: 0.5, from: 0, to: 0.5, cool: [0.02, 0.05] };
// (A birch's white bark stays pale in shade: lightly.)
export const TRUNK_SHADE_PALE = { foot: 0.98, crown: 0.8, from: 0, to: 0.5, cool: [0.01, 0.05] };
const paleShade = (t) => trunkShade(t, TRUNK_SHADE_PALE);
export function trunkShade(t, S = TRUNK_SHADE) {
  const k = smoothstep(S.from, S.to, t);
  const f = S.foot + (S.crown - S.foot) * k;
  const c = S.cool[0] + (S.cool[1] - S.cool[0]) * k;
  return [f * (1 - c), f, f * (1 + c)];
}

// Moss and algae at a trunk's foot (the owner, 12 November 2026: "the
// intricate details of a tree ... closer to realism but cheap"): green on
// one side of it - `arc` of the way round, a side of its own for each
// tree, by how it's turned - from the ground to `high` metres, strongest
// at the ground, in its bark's own corners' colours: `tint` of its red,
// green and blue at its strongest. Nothing more to draw.
export const TRUNK_MOSS = { high: 1.5, arc: 0.42, tint: [0.72, 1.12, 0.6] };
function mossAt(metres, side, M = TRUNK_MOSS) {
  // (side: 0 to 1 round the trunk; its mossy side centred on a half.)
  const up = 1 - smoothstep(M.high * 0.25, M.high, metres);
  const round = 1 - smoothstep(M.arc * 0.4, M.arc, Math.abs(side - 0.5));
  const k = up * round;
  return k <= 0 ? null : M.tint.map((v) => 1 + (v - 1) * k);
}

// light: the trunk a tree wears beyond close up (High and Ultra, TRUNK_NEAR):
// the same shape in fewer rings and sides - past CLOSE_FROM it's a few
// pixels wide, and the full one is drawn with its limbs close up.
export const TRUNK_NEAR = { rings: 4, fine: 8, sides: 6, fineSides: 7, flare: [0, 0.2, 0.56, 1], branch: [3, 4] };
export function trunkGeometry(plan, style = null, bark = "furrowed", light = false, bare = false) {
  // (bare: a dead tree, with no crown to shade it.)
  // (A birch's white bark and a beech's smooth grey: lightly.)
  const shadeOf = style === true || style === "birch" || style === "smooth" ? paleShade : trunkShade;
  const under = bare ? null : shadeOf;
  const inCrown = bare ? null : () => shadeOf(1);
  if (style === true) style = "birch";
  const layer = BARK_LAYER[bark] ?? 0;
  const rand = seeded(Math.round(plan.height * 1000 + plan.a * 100));
  const fine = style === "birch" || style === "scots" || style === "plane";
  let shade = null;
  let branchShade = null;
  if (style === "birch") {
    const marks = Array.from({ length: 12 * 7 }, () => (rand() < 0.2 ? 0.28 + rand() * 0.2 : 1));
    shade = (t, k, ring) => (t < 0.12 ? 0.45 + t * 3 : marks[(ring % 12) * 7 + (k % 7)]);
    branchShade = () => 0.85;
  } else if (style === "plane") {
    // A plane's: flaking in patches of cream, olive and grey over brown.
    const patches = Array.from({ length: 12 * 7 }, () => {
      const r = rand();
      return r < 0.25 ? [1.45, 1.42, 1.2] : r < 0.45 ? [1.1, 1.15, 0.9] : r < 0.6 ? [1.15, 1.15, 1.15] : [1, 1, 1];
    });
    shade = (t, k, ring) => patches[(ring % 12) * 7 + (k % 7)];
  } else if (style === "scots") {
    // Grey-brown below, orange above, blending over the middle of it.
    const grey = [0.62, 0.66, 0.78];
    const flakes = Array.from({ length: 12 * 7 }, () => 0.9 + rand() * 0.18);
    shade = (t, k, ring) => {
      const up = Math.min(1, Math.max(0, (t - 0.3) / 0.35));
      const f = flakes[(ring % 12) * 7 + (k % 7)];
      return grey.map((g) => (g + (1 - g) * up) * f);
    };
    branchShade = () => [1, 0.97, 0.95];
  }
  // Rings close together over its root flare (sim/treeshapes.mjs
  // trunkFlare), then evenly up the rest.
  // (A plain trunk's lean and bend, Ultra's 7 rings over it show as well
  // as 10 did; one patterned ring by ring - birch, Scots pine, plane - keeps
  // its rings for its pattern.)
  // (Its bark's own marks, and the moss at its foot over them.)
  const marks = shade;
  const mossy = (t, k, ring, sides) => {
    const v = marks ? marks(t, k, ring) : 1;
    const m = mossAt(t * plan.height, (k + 0.5) / sides);
    if (!m) return v;
    const [r, g, b] = Array.isArray(v) ? v : [v, v, v];
    return [r * m[0], g * m[1], b * m[2]];
  };
  const rings = light ? (fine ? TRUNK_NEAR.fine : TRUNK_NEAR.rings) : fine ? (ULTRA ? 18 : 12) : ULTRA ? 7 : 6;
  const flareT = Math.min(0.5, flareHeight(plan) / plan.height);
  const ts = (light ? TRUNK_NEAR.flare : [0, 0.08, 0.2, 0.36, 0.56, 0.78, 1]).map((f) => f * flareT);
  for (let i = 1; i <= rings; i++) ts.push(flareT + (1 - flareT) * (i / rings));
  // (Ultra's 12 sides round, its branches 6: 16 and 7 were twice High's
  // triangles for what its bark's relief shows anyway.)
  const sides = light ? (fine ? TRUNK_NEAR.fineSides : TRUNK_NEAR.sides) : ULTRA ? 12 : 10;
  const [bRings, bSides] = light ? TRUNK_NEAR.branch : ULTRA ? [6, 6] : [4, 5];
  const parts = [tube((t) => trunkAt(plan, t), (t) => trunkRadius(plan, t), ts.length - 1, sides, (t, k, ring) => mossy(t, k, ring, sides), layer, { ts, flare: (t, q) => trunkFlare(plan, t, q), under })];
  // A clump's other stems (sim/treeshapes.mjs CLUMP_MORE) drawn as trunks:
  // as many sides and rings, in its bark's pattern - each its own stretch
  // of it - and no flare (they leave from inside the first's).
  let stems = 0;
  for (const br of plan.branches) {
    if (br.stem) {
      const k = ++stems * 5;
      parts.push(tube((t) => branchAt(plan, br, t), (t) => branchRadius(br, t), rings, sides, shade ? (t, s, ring) => shade(t, s, ring + k) : null, layer, { under }));
    } else parts.push(tube((t) => branchAt(plan, br, t), (t) => branchRadius(br, t), bRings, bSides, branchShade, layer, { under: inCrown }));
  }
  return mergeGeometries(parts);
}

// How big a tile of bark texture is on a trunk, in metres round it and up
// it.
const BARK_TILE = 1.2;

// A tube along a path at(t) (t 0 - 1) with radius radius(t): `rings` rings
// of `sides` sides. Non-indexed, normals out from the line. With its bark
// texture's co-ordinates (fBarkUv: a whole number of tiles round it, so
// there's no seam, and metres up it over BARK_TILE) and kind (fBarkKind,
// `layer`).
// ts: where each ring is (t, rings + 1 of them; else evenly spread);
// flare(t, q): how much wider round it at angle q (the trunk's root flare).
function tube(at, radius, rings, sides, shade = null, layer = 0, { ts = null, flare = null, under = null } = {}) {
  const tAt = (i) => (ts ? ts[i] : i / rings);
  const pos = [];
  const nor = [];
  const col = [];
  const uvs = [];
  const kinds = [];
  const ring = (t) => {
    const c = at(t);
    const n = at(Math.min(1, t + 0.02));
    const p = at(Math.max(0, t - 0.02));
    const dir = new THREE.Vector3(n[0] - p[0], n[1] - p[1], n[2] - p[2]).normalize();
    // Two directions across the line.
    const ref = Math.abs(dir.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const u = new THREE.Vector3().crossVectors(dir, ref).normalize();
    const v = new THREE.Vector3().crossVectors(dir, u).normalize();
    const r0 = radius(t);
    const len = Math.hypot(n[0] - p[0], n[1] - p[1], n[2] - p[2]) || 1;
    return Array.from({ length: sides }, (_, k) => {
      const q = (k / sides) * Math.PI * 2;
      const o = u.clone().multiplyScalar(Math.cos(q)).addScaledVector(v, Math.sin(q));
      const r = flare ? r0 * flare(t, q) : r0;
      // Leaning back towards the line where it narrows going up (the
      // flare), so the light falls on it as on a spreading foot.
      let nn = o;
      if (flare) {
        const ahead = radius(Math.min(1, t + 0.02)) * flare(Math.min(1, t + 0.02), q);
        const behind = radius(Math.max(0, t - 0.02)) * flare(Math.max(0, t - 0.02), q);
        nn = o.clone().addScaledVector(dir, (behind - ahead) / len).normalize();
      }
      return { p: [c[0] + o.x * r, c[1] + o.y * r, c[2] + o.z * r], n: [nn.x, nn.y, nn.z] };
    });
  };
  const all = Array.from({ length: rings + 1 }, (_, i) => ring(tAt(i)));
  // Up it: metres along the line to each ring. Round it: tiles enough to
  // keep the bark about square at its foot.
  const tile = ULTRA ? 0.68 : BARK_TILE;
  const round = Math.max(1, Math.round((2 * Math.PI * radius(0)) / tile));
  const up = [0];
  for (let i = 1; i <= rings; i++) {
    const [x0, y0, z0] = at(tAt(i - 1));
    const [x1, y1, z1] = at(tAt(i));
    up.push(up[i - 1] + Math.hypot(x1 - x0, y1 - y0, z1 - z0));
  }
  for (let i = 0; i < rings; i++) {
    for (let k = 0; k < sides; k++) {
      const a = all[i][k];
      const b = all[i][(k + 1) % sides];
      const c = all[i + 1][k];
      const d = all[i + 1][(k + 1) % sides];
      // The bark's shade over this patch (1 as it is; or [r, g, b]).
      const v = shade ? shade((tAt(i) + tAt(i + 1)) / 2, k, i) : 1;
      const [cr, cg, cb] = Array.isArray(v) ? v : [v, v, v];
      // (And the shade of its own crown, ring by ring: TRUNK_SHADE.)
      const [s0, s1] = under ? [under(tAt(i)), under(tAt(i + 1))] : [null, null];
      const u0 = (k / sides) * round;
      const u1 = ((k + 1) / sides) * round;
      const v0 = up[i] / tile;
      const v1 = up[i + 1] / tile;
      // Wound to face out (it faced in: only the far half's inside was
      // drawn, so a trunk's foot curved the wrong way where it met the
      // ground).
      for (const [q, u, w, sh] of [[a, u0, v0, s0], [b, u1, v0, s0], [c, u0, v1, s1], [b, u1, v0, s0], [d, u1, v1, s1], [c, u0, v1, s1]]) {
        pos.push(...q.p);
        nor.push(...q.n);
        if (sh) col.push(cr * sh[0], cg * sh[1], cb * sh[2]);
        else col.push(cr, cg, cb);
        uvs.push(u, w);
        kinds.push(layer);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  geo.setAttribute("fBarkUv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute("fBarkKind", new THREE.Float32BufferAttribute(kinds, 1));
  return geo;
}

// The closest trunks (sim/treelod.mjs CLOSE_LOOK.bark), on High and Ultra: the bark's
// furrows sunk in - where the view meets the bark is moved along it by how
// deep the bark is there, twice over (offset mapping), in the bark's own
// directions round and up the trunk (from how its co-ordinates change
// across the screen).
const CLOSE_BARK = `
          float bNear = 1.0 - smoothstep(${n3(BARK_LOOK.full)}, ${n3(BARK_LOOK.fade)}, length(vViewPosition));
          if (bNear > 0.0) {
            vec3 n0 = normalize(vNormal);
            vec3 p0 = dFdx(-vViewPosition);
            vec3 p1 = dFdy(-vViewPosition);
            vec2 u0 = dFdx(vBark.xy);
            vec2 u1 = dFdy(vBark.xy);
            vec3 p1n = cross(p1, n0);
            vec3 p0n = cross(n0, p0);
            vec3 bT = p1n * u0.x + p0n * u1.x;
            vec3 bB = p1n * u0.y + p0n * u1.y;
            float bDet = max(dot(bT, bT), dot(bB, bB));
            float bS = bDet == 0.0 ? 0.0 : inversesqrt(bDet);
            vec3 bV = normalize(vViewPosition);
            vec2 bView = vec2(dot(bV, bT * bS), dot(bV, bB * bS)) / max(dot(bV, n0), 0.25);
            for (int j = 0; j < 2; j++) {
              float h = texture(tBark, vec3(bUv, layer)).r;
              bUv += bView * (h - 0.55) * ${n3(BARK_LOOK.depth)} * bNear * 0.5;
            }
          }`;

// High's textured bark (look/textures.js): the trunk's bark texture, of
// its kind, multiplied into its colour, and its ridges, plates or flakes
// tilting the lit normal so the sun catches them - fading out as a tile
// gets small on screen, so a far trunk never shimmers. Set before the
// scenery hooks (withSceneryHooks runs it first).
function barkLook(material) {
  if (!HIGH) return material;
  const uniforms = { tBark: detailTextures().tBark };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec2 fBarkUv;\nattribute float fBarkKind;\nvarying vec3 vBark;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvBark = vec3(fBarkUv, fBarkKind);");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform sampler2DArray tBark;\nvarying vec3 vBark;\nvec2 bLean = vec2(0.0);")
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        {
          float px = max(fwidth(vBark.x), fwidth(vBark.y));
          float k = 1.0 - smoothstep(0.03, 0.2, px);
          float layer = floor(vBark.z + 0.5);
          vec2 bUv = vBark.xy;
          ${CLOSE_BARK}
          vec3 t = texture(tBark, vec3(bUv, layer)).rgb;
          vec3 tHi = texture(tBark, vec3(fract(bUv * 2.15), layer)).rgb;
          t = mix(t, min(t, tHi), bNear * 0.65);
          diffuseColor.rgb *= mix(1.0, 0.42 + 0.78 * t.r, k * 0.9);
          // (Close up, darker down in the cracks.)
          diffuseColor.rgb *= 1.0 - ${n3(BARK_LOOK.cracks)} * bNear * (1.0 - smoothstep(0.15, 0.6, t.r));
          bLean = vec2(t.g * 2.0 - 1.0, 1.0 - t.b * 2.0) * k * (1.0 + ${n3(BARK_LOOK.lean)} * bNear);
        }`,
      )
      .replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
        {
          // Round the trunk and up it, in view terms, from how the bark's
          // co-ordinates change across the screen.
          vec3 q0 = dFdx(-vViewPosition);
          vec3 q1 = dFdy(-vViewPosition);
          vec2 s0 = dFdx(vBark.xy);
          vec2 s1 = dFdy(vBark.xy);
          vec3 q1p = cross(q1, normal);
          vec3 q0p = cross(normal, q0);
          vec3 T = q1p * s0.x + q0p * s1.x;
          vec3 B = q1p * s0.y + q0p * s1.y;
          float det = max(dot(T, T), dot(B, B));
          float sc = det == 0.0 ? 0.0 : inversesqrt(det);
          normal = normalize(normal + (T * bLean.x + B * bLean.y) * sc * 0.8);
        }`,
      );
  };
  material.customProgramCacheKey = () => "bark-v4-ultra";
  return material;
}

// ---- The solid crown's look ---------------------------------------------------------

// The crown under the leaf cards (High): not a solid mass but leafy - a
// dappled pattern of darker and lighter clumps with small gaps where the
// sky shows through (CROWN_GAPS: the share of it cut away on top, and
// underneath, where a real crown is thinnest - seen from the tee, a solid
// one read as a block under every tree, but cut away as it was, a third
// on top and most of it underneath, the sky showed through the crown in
// large gaps: the owner, 21 October 2026, "the large visible gaps or
// leaves without a branch ruin the look");
// and the underside lit a little from within, as sunlight comes through
// leaves. Seen through, the cards and the other side of the crown fill in.
// bark: a far tree's (farGeometry), whose trunk is merged in and marked
// with its bark's colour (fBark).
// How much the underside is lit from within (of its colour), over the
// ground's light, which is all an underside gets: a little. It was 0.36,
// three and a half times that light - the underside of every crown down
// the hole glowed, flat and pale (the owner, 16 October 2026: "any
// bleeding light on trees needs to be subtle not strong").
const CROWN_UNDER_GLOW = 0.12;
// Where the crown's clumps (0 - 1) are cut away for its gaps: below `top`
// on its top, below `under` on its underside (it was 0.42 and 0.72).
export const CROWN_GAPS = { top: 0.2, under: 0.32 };
// The crown's surface in its kind's leaves (the owner, 11 November 2026:
// "Can the crown have a texture, opaque with minimal gaps ... so that the
// bits seen aren't block colour?"): its leaf picture laid over it, `span`
// metres a repeat, from whichever side it faces most - the leaves in their
// own light and dark, and `between` (of the crown's colour) where the
// picture has none: the dark of the tree behind them. Faded out from
// `fade[0]` to `fade[1]` metres, where it would only shimmer. One texture
// read a pixel, from the atlas the leaf cards read already: no picture
// more, no draw more.
export const CROWN_LEAVES = { span: 2.6, between: 0.6, bright: 1.1, fade: [70, 130], average: [0.243, 0.445, 0.119] };
function leafyCrown(material, gaps, bark = false) {
  if (gaps) material.alphaToCoverage = true;
  const leaves = gaps ? leafAtlas() : null;
  material.onBeforeCompile = (shader) => {
    if (leaves) shader.uniforms.tLeaves = { value: leaves };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\nvarying vec3 tLocal;\nvarying float tUnder;${leaves ? "\nattribute vec2 fCell;\nvarying vec2 vCell;\nvarying vec3 tAt;\nvarying vec3 tFace;" : ""}${bark ? "\nattribute vec4 fBark;\nvarying vec4 vBark;" : ""}`)
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        tLocal = position;
        #ifdef USE_INSTANCING
          tLocal += instanceMatrix[3].xyz * 0.37;
        #endif
        #ifdef USE_BATCHING
          tLocal += batchingMatrix[3].xyz * 0.37;
        #endif
        ${bark ? "vBark = fBark;" : ""}
        ${leaves ? "vCell = fCell; tAt = position; tFace = normal;" : ""}
        tUnder = clamp(-normal.y, 0.0, 1.0);`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 tLocal;
        varying float tUnder;
        ${leaves ? "uniform sampler2D tLeaves;\nvarying vec2 vCell;\nvarying vec3 tAt;\nvarying vec3 tFace;" : ""}
        ${bark ? "varying vec4 vBark;" : ""}
        float tHash(vec3 p) {
          p = fract(p * 0.3183099 + 0.1);
          p *= 17.0;
          return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }
        float tNoise(vec3 x) {
          vec3 i = floor(x);
          vec3 f = fract(x);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(tHash(i), tHash(i + vec3(1, 0, 0)), f.x), mix(tHash(i + vec3(0, 1, 0)), tHash(i + vec3(1, 1, 0)), f.x), f.y),
                     mix(mix(tHash(i + vec3(0, 0, 1)), tHash(i + vec3(1, 0, 1)), f.x), mix(tHash(i + vec3(0, 1, 1)), tHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
        }`,
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        float clumps = tNoise(tLocal * 1.6) * 0.6 + tNoise(tLocal * 4.3) * 0.4;
        ${
          gaps
            ? `// The gaps' edges eased over a pixel (alpha to coverage), not cut
        // hard - a hard edge crawled as the crown swayed.
        float tCut = ${n3(CROWN_GAPS.top)} + ${n3(CROWN_GAPS.under - CROWN_GAPS.top)} * tUnder;
        float tEdge = fwidth(clumps) + 1e-4;
        float tCover = smoothstep(tCut - tEdge, tCut + tEdge, clumps);
        if (tCover <= 0.0) discard;
        diffuseColor.a *= tCover;`
            : ""
        }
        // (Toned down beyond about 60 m, where it read as noise.)
        diffuseColor.rgb *= mix(0.78 + 0.4 * clumps, 0.97, smoothstep(45.0, 90.0, length(vViewPosition)));
        ${
          leaves
            ? `// Its kind's leaves over it (CROWN_LEAVES), from the side it faces most.
        vec3 tAbs = abs(tFace);
        vec2 tQ = (tAbs.y >= tAbs.x && tAbs.y >= tAbs.z ? tAt.xz : tAbs.x >= tAbs.z ? tAt.zy : tAt.xy) / ${n3(CROWN_LEAVES.span)};
        vec2 tCellSize = vec2(${n3(1 / ATLAS.cols)}, ${n3(1 / ATLAS.rows)});
        vec2 tUv = vCell + (0.02 + fract(tQ) * 0.96) * tCellSize;
        vec4 tLeaf = textureGrad(tLeaves, tUv, dFdx(tQ) * tCellSize, dFdy(tQ) * tCellSize);
        vec3 tWorn = mix(vec3(${n3(CROWN_LEAVES.between)}), tLeaf.rgb / vec3(${CROWN_LEAVES.average.map(n3).join(", ")}) * ${n3(CROWN_LEAVES.bright)}, smoothstep(0.2, 0.6, tLeaf.a));
        diffuseColor.rgb *= mix(tWorn, vec3(1.0), smoothstep(${n3(CROWN_LEAVES.fade[0])}, ${n3(CROWN_LEAVES.fade[1])}, length(vViewPosition)));`
            : ""
        }`,
      )
      .replace(
        "#include <alphamap_fragment>",
        `#include <alphamap_fragment>
        ${bark ? "diffuseColor.rgb = mix(diffuseColor.rgb, vBark.rgb, vBark.a);" : ""}`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += diffuseColor.rgb * ${n3(CROWN_UNDER_GLOW)} * tUnder${bark ? " * (1.0 - vBark.a)" : ""};`,
      );
  };
  material.customProgramCacheKey = () => `leafy-crown-v6-${gaps ? "g" : "s"}${bark ? "b" : ""}`;
  withSceneryHooks(material, "crown");
  // (Its node version, on WebGPURenderer: glsl/treenode.js.)
  return markTwin(material, "crown", { gaps: gaps ? CROWN_GAPS : null, bark, glow: CROWN_UNDER_GLOW, leaves: leaves ? { map: leaves, cols: ATLAS.cols, rows: ATLAS.rows, ...CROWN_LEAVES } : null });
}

export { TREE_SHAPES };

// A tree's thickness (treehits.mjs THICK) as a share of the way from the
// sparsest to the thickest, and the usual thickness's share - where a
// tree is drawn as it always was.
const thickShare = (t) => Math.min(1, Math.max(0, (t - THICK[0]) / (THICK[1] - THICK[0])));
const AVERAGE_SHARE = thickShare(1);
// On High the solid crown sits inside its leaf cards, as the usual tree's
// always did (0.82 across, 0.92 up), but each lump smaller about its own
// middle, made so (broadleafCrown). It was shrunk as a whole towards the
// foot of the trunk, by each tree's thickness (a sparse one's 0.72
// across) - on a tall tree the crown sank below its top leaves, up to
// nearly two lumps' radius - and close up it was shrunk again to half the
// leaves' (the owner, 21 October 2026: "the large visible gaps or leaves
// without a branch ruin the look"). (Nearer them, 0.95, half its cards
// were inside it, and its smooth side showed between the rest.) A sparse
// tree shows by its lighter, yellower green (THICK_LIGHT).
export const TUCK = { across: 0.82, up: 0.92 };
// The solid crown's colour, of its leaves': the shadowed middle of the
// tree, under them - darker than it was (0.95), so where it shows between
// the leaves it reads as the shade inside the tree, not a smooth, sunlit
// ball under them.
export const CROWN_SHADE = 0.68;
// (A kind's own, where its heavy shade wants the dark of the tree behind
// its leaves rather than a paler lump: LOOK's `under` - a horse chestnut's.)
const crownShade = (name) => LOOK[name]?.under ?? CROWN_SHADE;

// How far a shape's geometry reaches from the foot of its trunk, model
// units: level (r) and up or down (y). Worked out once per geometry, from
// every point of it, so a camera keeps clear of the leaves as they are
// drawn - cards, willow strands and blossom included - rather than of a
// rough size for the kind, which a big real tree's cards overran by metres.
function reachOf(geo, across = 1, up = 1) {
  if (!geo) return { r: 0, y: 0 };
  if (!geo.userData.reach) {
    const pos = geo.attributes.position;
    let r = 0;
    let y = 0;
    for (let i = 0; i < pos.count; i++) {
      r = Math.max(r, Math.hypot(pos.getX(i), pos.getZ(i)));
      y = Math.max(y, Math.abs(pos.getY(i)));
    }
    geo.userData.reach = { r, y };
  }
  const { r, y } = geo.userData.reach;
  return { r: r * across, y: y * up };
}
// And a shape's outline seen from above - the hull round every point of
// it (sim/treehits.mjs levelHull), its corners as x, z, x, z... - so a tree
// spread more one way than the other is given room for its leaves as
// they're spread (crownBound). Worked out once, the first time a tree of
// it is (and before its numbers are let go of: letGoOfShapes).
function hullOf(geo) {
  if (!geo) return null;
  if (!geo.userData.hull) {
    const pos = geo.attributes.position;
    const level = [];
    for (let i = 0; i < pos.count; i++) level.push([pos.getX(i), pos.getZ(i)]);
    geo.userData.hull = Float32Array.from(levelHull(level).flat());
  }
  return geo.userData.hull;
}
// How much lighter the sparsest tree's green is than the thickest's (HSL
// lightness): enough to tell a thin tree from a thick one at a glance.
const THICK_LIGHT = 0.14;
// And how much bluer (hue, of a turn) the thickest is than the sparsest.
const THICK_HUE = 0.035;

// How each kind is drawn: its bark, its leaf cards' texture, and how many
// cards (a lump's worth) at what size.
// (The newer kinds' cards are the pine's needles or the broadleaf's leaves,
// so they join the same batches: no more draw calls.)
// A broadleaf's cards half as many again as they were, each 0.87 the size
// (the owner, 19 October 2026: "improve efficiency of the trees to then
// increase complexity and overall look at the same or only slightly more
// triangle cost"): finer, fuller leaves round a solid crown of a third the
// triangles (CROWN_UNDER) - the crown was most of a broadleaf's.
const LOOK = {
  // (A beech keeps its finer crown too - its leaves are sparse, and the
  // coarser one's flat faces showed between them as dark hexagons.)
  // (A bush keeps its finer crown, crownDetail 1, and wears no shoot ends:
  // its lumps are well under a metre, and a coarse one's faces stood too
  // far inside its leaves - test/treegaps.test.mjs.)
  pine: { bark: "bark", texture: "pine", tex: "plates" },
  leaf: { bark: "bark", texture: "leaf", cards: 24, size: 1.22, boughs: true, ends: { near: 5, close: 8, droop: 0.4, under: -0.7, radius: [0.5, 0.7] } },
  birch: { bark: "barkBirch", texture: "birch", cards: 46, closeCards: 30, size: 1.18, drawn: { cards: 30, size: 1.18 }, trunk: "birch", tex: "birch" },
  willow: { bark: "barkWillow", texture: "willowleaf", cards: 24, size: 1.13, under: 0.85, ends: { near: 3, close: 5, droop: 0.5, up: 0.1 } },
  poplar: { bark: "barkPoplar", texture: "poplar", cards: 36, closeCards: 27, size: 1.3, drawn: { cards: 27, size: 1.22 }, ends: { near: 3, close: 5, droop: -0.3, up: 1.6, radius: [0.36, 0.48] } },
  bush: { bark: "bark", texture: "bush", cards: 21, size: 1.22, crownDetail: 1 },
  scots: { bark: "barkScots", texture: "scots", trunk: "scots", tex: "plates" },
  oak: { bark: "barkOak", texture: "oak", cards: 21, size: 1.35, ends: { near: 3.5, close: 6, droop: 0.22, up: 0.55 } },
  column: { bark: "bark", texture: "pine", tex: "plates" },
  spruce: { bark: "bark", texture: "spruce", tex: "plates" },
  snag: { bark: "barkSnag", texture: null },
  // The latest kinds wear the leaves nearest their own (no more pictures
  // in the atlas, no more draws, and none their boughs' families didn't
  // wear already: kitLeaves): a beech and a holly the broadleaf's (a
  // holly's dark and glossy by its colours), a hawthorn the oak's small
  // lobed ones, a cedar the pine's needles - and each its own colours,
  // outline and trunk. (A horse chestnut wore the plane's broad lobed
  // leaves; it has its own hands of leaflets now, a cell of the atlas's
  // third row, and its candles in flower: candleCards.) A
  // beech's and a holly's smooth grey bark the plane's smooth texture,
  // without its flaking patches.
  beech: { bark: "barkBeech", texture: "beech", trunk: "smooth", cards: 44, closeCards: 26, size: 1.36, drawn: { cards: 26, size: 1.2 }, under: 0.82, tex: "plane", ends: { near: 4.5, close: 7, droop: 0.12, up: 1.3, radius: [0.46, 0.62] } },
  chestnut: { bark: "barkChestnut", texture: "chestnut", cards: 22, size: 1.42, under: 0.58, ends: { near: 6, close: 8, droop: 0.34, picture: "chestnutwhorl" } },
  cedar: { bark: "barkCedar", texture: "cedar", tex: "plates" },
  holly: { bark: "barkHolly", texture: "holly", cards: 24, size: 1.0, under: 0.85, tex: "plane", ends: { near: 3.5, close: 6, droop: 0.2, up: 0.3 } },
  hawthorn: { bark: "barkHawthorn", texture: "hawthorn", cards: 34, closeCards: 20, size: 1.15, drawn: { cards: 20, size: 1.0 }, under: 0.8, ends: { near: 6, close: 9, droop: 0.4, up: 0.3, under: -0.9 } },
};
const tiered = (name) => TIERED.has(KIND[name]);
// How finely a broadleaf's solid crown is made where its leaf cards cover
// it (Medium and up: IcosahedronGeometry's detail, 80 triangles a lump,
// not 180) - Standard's, all there is of it, as fine as ever.
// (Coarser since - 20 a lump, IcosahedronGeometry's detail 0 - the owner,
// 11 November 2026, of the horse chestnut drawn both ways: "this improved
// tree is much better, with eventually less triangles": the crown's own
// surface wears its leaves now (CROWN_LEAVES), so its facets don't show
// between the leaf cards, and what it saved is spent on a kind's shoot
// ends. A kind can ask for finer: LOOK's crownDetail.)
const CROWN_UNDER = 0;
// (What it was: the detail whose randomness it still draws, broadleafCrown.)
const CROWN_WAS = 1;
const PLANE_SHAPES = new Set([3, 5, 7]);

// Every shape's geometry, made once (the shapes are the same everywhere):
// [kind][shape] -> { trunk, crown, cards, strands }.
//
// Kept as a hole is (look/bake.js), for this graphics setting by this
// version of the game, with their low versions (lowGeometries): made again
// each time the page started - a few seconds of a phone's start, every
// time it opens a place - when they're the same every time. Asked for as the page starts (treeShapesKept,
// app.js, before anything's built), and taken as they were if they're
// there; made and kept if not.
let built = null;
let shapesBake = null;
let shapesAsked = null;
// (Each kind's count of shapes in it too: kept with fewer, a tree of a shape
// added since had no picture in the far woods.)
const shapeInputs = () => ({ kinds: KINDS, shapes: KINDS.map((_, k) => shapeCount(k)), high: HIGH, extra: EXTRA, ultra: ULTRA, phone: PHONE, leafScale: LEAF_SCALE, atlas: [ATLAS.cols, ATLAS.rows, ATLAS.kinds.length], blossomCells: BLOSSOM_CELLS, candles: CANDLES, haws: HAWS, pictures: Object.keys(LEAF_PICTURES), ends: [SHOOT_ENDS, KINDS.map((n) => LOOK[n].ends ?? null)], crowns: KINDS.map((n) => LOOK[n].crownDetail ?? null), crownLeaves: 1, ...(FINE ? { fine: FINE_LEAVES.more } : {}) });
export function treeShapesKept() {
  shapesAsked ??= loadBake(LEVEL, fingerprint(["tree shapes", shapeInputs()]))
    .then((b) => (shapesBake = b))
    .catch(() => null);
  return shapesAsked;
}
// A shape's parts as plain data, and back - with which leaf picture's cell
// its cards were moved into (toAtlas), so they aren't moved again.
export const shapeData = (sh) => Object.fromEntries(Object.entries(sh).map(([k, g]) => [k, g ? { geometry: geometryData(g), atlas: g.userData.atlas ?? null, ...(g.userData.blossomCell != null ? { blossomCell: g.userData.blossomCell } : {}), ...(g.userData.cardCorners != null ? { cardCorners: g.userData.cardCorners } : {}) } : null]));
export function shapeFrom(data) {
  return Object.fromEntries(
    Object.entries(data).map(([k, d]) => {
      if (!d) return [k, null];
      const g = geometryFrom(d.geometry);
      if (d.atlas) g.userData.atlas = d.atlas;
      if (d.blossomCell != null) g.userData.blossomCell = d.blossomCell;
      if (d.cardCorners != null) g.userData.cardCorners = d.cardCorners;
      return [k, g];
    }),
  );
}
// The near shapes (shapeGeometry) and the low ones (lowGeometries), each
// taken from the file if it's there or made and kept in it.
let shapesFound = 0;
function keptOrMade(name, make) {
  const kept = shapesBake?.find(name, shapeInputs());
  // (Both found: nothing to write, the file let go of now.)
  if (kept && ++shapesFound === 2 && !shapesBake.changed) shapesBake = null;
  if (kept) return kept.map((shapes) => shapes.map(shapeFrom));
  const made = make();
  shapesBake?.keep(name, shapeInputs(), made.map((shapes) => shapes.map(shapeData)));
  return made;
}
// The file written with what was made, once, a while after the page is up
// (app.js) - its parts handed to another core to write, not copied
// (look/bake.js saveBake) - and let go of (what's taken from it is a
// copy). One not made by then (the low shapes, on a page with no far
// trees yet) is made and kept the next time. Used every start, so never
// the least lately used.
export function keepTreeShapes() {
  const bake = shapesBake;
  shapesBake = null;
  if (bake?.changed) saveBake(bake);
}
function shapeGeometry() {
  built ??= keptOrMade("tree shapes", makeShapes);
  return built;
}
// (For the tests: every kind's near shapes, as kept.)
export const nearShapes = () => shapeGeometry();
// A shape's randomness: its batch's (sim/treeshapes.mjs shapeBatch) - the
// first, MORE_SHAPES and COMMON_SHAPES each one sequence, as they always
// were - or, for a shape added since (the commonest kinds' third, the
// clumps), a sequence of its own from `base`, so one added later changes
// none of the rest.
function streamOf(k, si, streams, base) {
  const batch = shapeBatch(k, si);
  return streams[batch] ?? seeded(base + k * 997 + si * 31);
}
function makeShapes() {
  const first = seeded(0x51a9e);
  // The shapes added since (sim/treeshapes.mjs MORE_SHAPES): randomness of
  // their own, so the first ones are drawn just as they were.
  const more = seeded(0x51a9f);
  // (And the commonest kinds' added since those, sim/treeshapes.mjs
  // COMMON_SHAPES: their own again, so none of the rest change.)
  const common = seeded(0x51aa0);
  const all = treeShapes();
  const made = KINDS.map((name, k) =>
    all[name].map((sh, si) => {
      const rand = streamOf(k, si, [first, more, common], 0x51ab0);
      const look = LOOK[name];
      // Close up (High and Ultra: sim/treelod.mjs CLOSE_FROM), every kind:
      // its own randomness, so the usual parts stay exactly as they were.
      const close = EXTRA ? seeded(0xc105e + KINDS.indexOf(name) * 997 + si * 31) : null;
      if (tiered(name)) {
        const layer = BARK_LAYER[look.tex] ?? 0;
        const trunk = trunkGeometry(sh.trunk, look.trunk, look.tex);
        const core = HIGH ? coniferCore(sh, layer) : null;
        const lumps = sh.tiers.map(([r, , y, dx, dz]) => [dx, y, dz, r]);
        const usual = { trunk: core ? mergeGeometries([trunk, core]) : trunk, crown: wearing(pineCrown(sh.tiers, rand), look.texture), cards: HIGH ? ragged(name, k, si, crownDepth(pineCards(sh.tiers, rand, { under: 1 }), lumps), sh.tiers, { under: 1 }, 1) : null };
        // Near, wearing its sprays (BOUGH_LEVELS): its needles on its tiers
        // drawn in as close up (sprayCore), as many of them as close up
        // keeps of its own (HEART_CARDS).
        if (EXTRA && SPRAY_KINDS.has(k)) usual.cardsHeart = ragged(name, k, si, crownDepth(pineCards(sprayCore(sh.tiers, k), heartRand(k, si), { under: 1, every: 1 / heartShare(k) }), lumps), sh.tiers, { under: 1 }, 2);
        if (!close) return usual;
        // (Beyond close up its trunk lighter - TRUNK_NEAR - the full one
        // drawn with its limbs.)
        const lightTrunk = trunkGeometry(sh.trunk, look.trunk, look.tex, true);
        usual.trunkNear = core ? mergeGeometries([lightTrunk, core]) : lightTrunk;
        // Its branches and trunk up through the tiers, and finer needles
        // spread along the branches, darker in its heart and underneath -
        // a kind that wears sprays (sim/offshoots.mjs SPRAY_KINDS) on its
        // tiers drawn in (sprayCore), a share fewer: its sprays make the
        // rest, and its outline.
        const fine = coniferFine();
        const sprays = SPRAY_KINDS.has(k);
        const tiers = sprays ? sprayCore(sh.tiers, k) : sh.tiers;
        const every = sprays ? fine.every / (SPRAY_LOOK.coreCardsOf[k] ?? SPRAY_LOOK.coreCards) : fine.every;
        return { ...usual, limbs: withTrunk(usual.trunk, coniferLimbs({ ...sh, tiers }, close, layer)), cardsClose: ragged(name, k, si, crownDepth(pineCards(tiers, close, { ...fine, every, deep: CONIFER_CLOSE.deep, under: 1 }), lumps), sh.tiers, { ...fine, every: every * 1.3, deep: CONIFER_CLOSE.deep, under: 1 }, 3) };
      }
      // A snag: its trunk and bare branches, nothing else - close up, its
      // twigs, broken stubs and splintered top (snagLimbs).
      if (sh.snag) return { trunk: trunkGeometry(sh.trunk, null, "furrowed", false, true), crown: null, cards: null, limbs: close ? snagLimbs(sh.trunk, close, BARK_LAYER.furrowed ?? 0) : null };
      // A willow's dome wears leaf cards; its curtain hangs in strands.
      const dome = name === "willow" ? sh.spheres.slice(0, sh.spheres.length - sh.curtain) : sh.spheres;
      // (Three of the broadleaf's shapes are planes, their bark mottled: the
      // parkland one, sim/treeshapes.mjs parkLeaf, among them.)
      const bark = name === "leaf" && PLANE_SHAPES.has(si) ? ["plane", "plane"] : [look.trunk, look.tex];
      // Close up: its branches, and more leaf cards, smaller - some on
      // its twigs.
      const place = name === "birch" ? birchCards : cardsOn;
      const birch = name === "birch";
      const wood = close ? limbsGeometry(sh.trunk, dome, close, BARK_LAYER[bark[1]] ?? 0, birch ? 0.85 : null, seeded(0x7e1c + KINDS.indexOf(name) * 997 + si * 31), { plain: !birch, limbs: !birch }) : null;
      // Its heart, near: its boughs worn at every distance (BOUGH_LEVELS).
      const heart = EXTRA && OFFSHOOT_KINDS.has(k) ? heartRand(k, si) : null;
      // Its shoot ends (LOOK's `ends`, look/shootends.js), Medium and up:
      // those close up, the near ones the first of them - randomness of
      // their own, so its leaf cards stay as they were.
      const E = HIGH && look.ends ? { ...SHOOT_ENDS, ...look.ends } : null;
      const endsOf = (n) => (E ? crownDepth(shootEnds(dome, seeded(0x3401 + k * 997 + si * 31), Math.round(n * dome.length), E), dome) : null);
      // (Beyond close up its trunk lighter - TRUNK_NEAR - the full one
      // drawn with its limbs. Not a birch: its trunk carries its branches,
      // its bark's marks ring by ring.)
      // (With its boughs under the crown, where its kind has them: BOUGHS.)
      const withBoughs = (trunk, light) => {
        const b = look.boughs ? boughsGeometry(sh.trunk, dome, BARK_LAYER[bark[1]] ?? 0, light) : null;
        return b ? mergeGeometries([trunk, b]) : trunk;
      };
      const fullTrunk = birch ? birchTrunk(sh.trunk, dome, bark) : withBoughs(trunkGeometry(sh.trunk, ...bark), false);
      const lightTrunk = wood?.geometry && !birch ? withBoughs(trunkGeometry(sh.trunk, ...bark, true), true) : null;
      const worn = (cards, n) => withEnds(cards, cards ? endsOf(n) : null, leafPictureOf(name, si), E?.picture ?? leafPictureOf(name, si));
      // (Close up a kind's finer leaves are counted from LOOK's `closeCards`
      // where it has one: the kinds given more leaves near - a beech 44 a lump
      // for 26 - would be half as many again close up, where a tree already
      // has four times its near leaves; on the top setting every tree within
      // 120 m is drawn so, and a close-up beech went from 6,500 triangles to
      // 8,474.)
      // (A kind given more leaves since - LOOK's `drawn`, what it had - draws
      // what it did from the randomness every kind shares, so no other
      // kind's leaves move, and its own from a sequence of its own.)
      if (HIGH && look.drawn) place(dome, look.drawn.cards, look.drawn.size, rand, look.fill || 0);
      const ownCards = look.drawn ? seeded(0x1eaf + k * 997 + si * 31) : rand;
      return withShootEnds({
        trunk: fullTrunk,
        trunkNear: lightTrunk,
        crown: wearing(broadleafCrown(dome, rand, true, HIGH ? (look.crownDetail ?? CROWN_UNDER) : 2, HIGH ? TUCK : null, HIGH ? CROWN_WAS : 2), leafPictureOf(name, si)),
        cards: HIGH ? crownDepth(place(dome, look.cards, look.size, ownCards, look.fill || 0), dome) : null,
        limbs: lightTrunk ? withTrunk(fullTrunk, wood.geometry) : (wood?.geometry ?? null),
        // (A kind that wears boughs, sim/offshoots.mjs, has them on its
        // smaller heart of leaves, coreOf: its boughs make the rest.)
        cardsClose: close ? crownDepth(closeCards(coreOf(k, dome), place, fineCount(Math.round((look.closeCards ?? look.cards) * (ULTRA ? 4.2 : 2.4) * (OFFSHOOT_KINDS.has(k) ? coreLook(k).cards : 1))), fineSize(look.size * (ULTRA ? 0.48 : 0.64) * (OFFSHOOT_KINDS.has(k) ? coreLook(k).size : 1)), close, look.fill || 0, wood.tips), dome) : null,
        // And its solid crown close up, as small (in place of its usual one)
        // - not a birch's, which has none, nor one whose heart is as big as
        // its crown (a bush's: its sprigs add to it). Near as well: its
        // boughs are worn at every distance (BOUGH_LEVELS).
        core: (close || heart) && OFFSHOOT_KINDS.has(k) && !birch && OFFSHOOTS[boughsOf(k)].core < 1 ? wearing(broadleafCrown(coreOf(k, dome), close ?? heart, true, HIGH ? (look.crownDetail ?? CROWN_UNDER) : 2, HIGH ? TUCK : null, HIGH ? CROWN_WAS : 2), leafPictureOf(name, si)) : null,
        // Its heart's leaf cards near, as many as close up keeps of its own
        // (HEART_CARDS), the same size to its lumps.
        cardsHeart: heart ? crownDepth(place(coreOf(k, dome), Math.max(3, Math.round(look.cards * heartShare(k))), look.size * heartSize(k), heart, look.fill || 0), dome) : null,
        strands: name === "willow" ? willowStrands(sh, rand) : null,
        // A flowering shrub's blossom, over its upper lumps, just outside
        // their leaves so they don't hide it (High).
        // And a horse chestnut's candles, standing on its crown (candleCards:
        // randomness of their own, so its leaves stay as they were).
        blossom: !HIGH ? null : sh.flowering ? toBlossomCell(cardsOn(upper(sh.spheres).map(([x, y, z, r]) => [x, y, z, r * 1.12]), 22, 0.65, rand), 0) : k === KIND.chestnut ? candleCards(dome, seeded(0xca4d1e + si * 31)) : k === KIND.hawthorn ? toBlossomCell(cardsOn(dome.map(([x, y, z, r]) => [x, y, z, r * 1.1]), HAWS.cards, HAWS.size, seeded(0x4a35 + si * 31)), 0) : null,
      }, worn, E ?? SHOOT_ENDS);
    }),
  );
  // Each kind's leaf cards read from its cell of the leaf atlas (ATLAS).
  made.forEach((shapes, k) => shapes.forEach((sh, si) => [sh.cards, sh.cardsClose, sh.cardsHeart].forEach((g) => toAtlas(g, leafPictureOf(KINDS[k], si)))));
  return made;
}
// A tree wearing boughs further off (BOUGH_LEVELS): its heart's leaves near
// and far, a share of its usual ones - the share it keeps close up
// (coreLook, SPRAY_LOOK.coreCardsOf) times HEART_CARDS - and randomness of
// its own, so its usual parts stay as they were.
export const HEART_CARDS = 1;
const heartShare = (k) => (SPRAY_KINDS.has(k) ? (SPRAY_LOOK.coreCardsOf[k] ?? SPRAY_LOOK.coreCards) : coreLook(k).cards) * HEART_CARDS;
const heartRand = (k, si) => seeded(0x4ea27 + k * 997 + si * 31);
// (Its cards as close up, a little bigger on a heart drawn in - not on a
// heart as big as its crown, a bush's, where they'd reach past its room.)
const heartSize = (k) => (OFFSHOOTS[boughsOf(k)].core < 1 ? coreLook(k).size : 1);

// A close-up broadleaf with a solid crown (every kind but the birch): a
// plain limb from high on its trunk into the middle of each lump, its
// crown as full as near to and hiding the rest of it (the owner, 21
// October 2026: "The level of detail needs for branch's should be very low
// even close up. But the large visible gaps or leaves without a branch
// ruin the look") - its forks, skirts and twigs, and the sprays of leaves
// round their ends, went with the crown tucked in to half its leaves'
// width for them to show. Each limb `rings` along, `sides` round. A birch
// has no solid crown - its leaves a loose cloud in each lump - so near to
// as well it has a plain limb into each lump's middle, in its trunk's
// shape (birchTrunk), and close up its forks and twigs off them.
export const PLAIN_LIMB = { rings: 2, sides: 4 };

// A close-up broadleaf's twigs (the owner, 20 October 2026: "more detailed
// trees"): a spray off the end of each limb, up and out round the lump's
// top, and a few off the outer half of each fork - out to its leaves, so
// the wood branches on finer and finer to them rather than stopping short
// in the middle of a lump. Each thin and straight, 3-sided in 1 ring (6
// triangles): `tip` off a limb's end and `fork` off each fork (one fewer
// in a lump under `small` across), ending `out` of the way from the lump's
// middle to its leaves. And a share of its finer leaf cards (`leaves`) is
// taken off the lump's surface and gathered round the twigs' ends
// (closeCards): its edge breaks into twigs in leaf, its middle's thinner
// and the wood shows - in the same number of cards.
export const TWIGS = { tip: 3, fork: 2, small: 1.4, out: [0.72, 0.9], leaves: 0.35 };

// A birch's trunk with a plain limb into each lump of its leaf cloud
// (PLAIN_LIMB), in its bark - a little darker, as its own branches are -
// so near to, too, none of its leaves is without a branch.
// A tree's close-up limbs with its full trunk in their shape (its trunk
// beyond close up is the lighter one, TRUNK_NEAR): userData.trunk, the
// trunk's triangles of it.
// Boughs from the trunk out under the crown (the owner, 12 November 2026,
// to the plain broadleaf: "a couple of trees look bad" - it was a ball on a
// stick: nothing between its trunk and its crown at any distance but close
// up). For a kind that asks (LOOK's `boughs`): up to `most` of them, each
// from the trunk `below` metres under its lowest leaves, bowing up and out
// to the underside of one of its lower, outer lumps - spread round the
// tree - as thick at its start as `thick` of the trunk there. In the
// trunk's own shape and bark: no part or draw more. light: beyond close up,
// in fewer rings and sides (TRUNK_NEAR.branch).
export const BOUGHS = { most: 4, below: [2.4, 4.2], thick: 0.5, tip: 0.32, into: 0.85, least: 0.3 };
function boughsGeometry(plan, dome, layer, light = false, B = BOUGHS) {
  if (!dome.length) return null;
  // Its lowest leaves, and the lumps low and out enough to hold a bough.
  const base = Math.min(...dome.map(([, y, , r]) => y - r * 0.8));
  const outer = dome
    .filter(([x, y, z, r]) => Math.hypot(x, z) > r * 0.45 && y - r < base + 2.5)
    .map((l) => ({ l, a: Math.atan2(l[2], l[0]) }))
    .sort((p, q) => p.a - q.a);
  if (!outer.length) return null;
  // Spread round: every (n / most)th of them by angle.
  const n = Math.min(B.most, outer.length);
  const picks = Array.from({ length: n }, (_, i) => outer[Math.floor((i * outer.length) / n)].l);
  const [rings, sides] = light ? TRUNK_NEAR.branch : [5, 5];
  const parts = picks.map(([x, y, z, r], i) => {
    const y0 = Math.max(base * B.least, base - B.below[0] - (B.below[1] - B.below[0]) * ((i * 0.618) % 1));
    const t0 = Math.min(0.95, y0 / plan.height);
    const from = trunkAt(plan, t0);
    const to = [x, y - r * B.into, z];
    // (Bowing: up first, then out.)
    const mid = [from[0] + (to[0] - from[0]) * 0.35, from[1] + (to[1] - from[1]) * 0.7, from[2] + (to[2] - from[2]) * 0.35];
    const at = (t) => [0, 1, 2].map((k) => (1 - t) * (1 - t) * from[k] + 2 * t * (1 - t) * mid[k] + t * t * to[k]);
    const r0 = trunkRadius(plan, t0) * B.thick;
    return tube(at, (t) => r0 * (1 - (1 - B.tip) * t), rings, sides, null, layer, { under: (t) => trunkShade(0.45 + 0.55 * t) });
  });
  return mergeGeometries(parts);
}

function withTrunk(trunk, limbs) {
  const geo = mergeGeometries([trunk, limbs]);
  geo.userData.trunk = (trunk.index ? trunk.index.count : trunk.attributes.position.count) / 3;
  return geo;
}

function birchTrunk(plan, dome, bark) {
  const limbs = limbsGeometry(plan, dome, null, BARK_LAYER[bark[1]] ?? 0, 0.85, null, { plain: true }).geometry;
  const trunk = trunkGeometry(plan, ...bark);
  return limbs ? mergeGeometries([trunk, limbs]) : trunk;
}

// A tree's branches: from high on its trunk up and out into each lump of
// its crown, ending in the lump's middle - plain (PLAIN_LIMB), or a
// birch's close up, each with a shorter fork off it towards the lump's
// edge, and twigs off both (TWIGS: from their own randomness, twig, so the
// rest is as it was) - tubes in the trunk's bark (its kind: layer;
// birch's a little darker: shade), so they go in the trunks' batch. plan:
// the trunk's (sim/treeshapes.mjs); dome: the lumps with leaf cards.
// plain: the limbs alone; limbs: false, all but them (a birch's close up:
// its trunk carries them). { geometry, tips }: tips, where each twig ends
// ([x, y, z, its lump]), for its leaves (none, plain).
export function limbsGeometry(plan, dome, rand, layer, shade, twig, { plain = false, limbs = true } = {}) {
  const across = 1;
  const up = 1;
  const parts = [];
  const tips = [];
  const shadeOf = shade == null ? null : () => shade;
  // `n` twigs from `from` out to lump k's leaves (where they are, not
  // tucked in), fanned `spread` either side of heading `a`, rising `rise`
  // (-1 down to 1 up); `rb` thick where they start.
  const twigs = (from, k, a, spread, n, rise, rb) => {
    const [cx, cy, cz, r] = dome[k];
    for (let i = 0; i < n; i++) {
      const b = a + (n > 1 ? (i / (n - 1) - 0.5) * 2 * spread : 0) + (twig() - 0.5) * 0.6;
      const h = rise[0] + twig() * (rise[1] - rise[0]);
      const o = r * (TWIGS.out[0] + twig() * (TWIGS.out[1] - TWIGS.out[0]));
      const flat = Math.sqrt(1 - h * h) * o;
      const to = [cx + Math.cos(b) * flat, cy + h * o, cz + Math.sin(b) * flat];
      parts.push(tube(line(from, to), (t) => Math.max(0.008, rb * (1 - 0.7 * t)), 1, 3, shadeOf, layer));
      tips.push([...to, k]);
    }
  };
  for (const [k, [x, y, z, r]] of dome.entries()) {
    // From the highest point on the trunk a little below the lump, up and
    // out in a gentle curve, rising early (sim/offshoots.mjs limbPath: an
    // offshoot's socket is on it).
    const limb = limbPath(plan, [x * across, y * up, z * across]);
    if (!limb) continue;
    const { at, end, r0 } = limb;
    if (plain) {
      parts.push(tube(at, (t) => Math.max(0.025, r0 * (1 - 0.75 * t)), PLAIN_LIMB.rings, PLAIN_LIMB.sides, shadeOf, layer));
      continue;
    }
    // (Its gentle curve in 3 rings, and each fork - straight - in 2, for
    // its taper: a third fewer triangles than 4 and 3, the wood being half
    // of a close-up tree's.) (Not when its trunk carries it: a birch's.)
    if (limbs) parts.push(tube(at, (t) => Math.max(0.025, r0 * (1 - 0.75 * t)), 3, 5, shadeOf, layer));
    // Its fork, from two thirds along out towards the lump's edge.
    const from = at(0.65);
    const a = rand() * Math.PI * 2;
    const tip = [end[0] + Math.cos(a) * r * across * 0.6, end[1] + r * up * (0.2 + rand() * 0.4), end[2] + Math.sin(a) * r * across * 0.6];
    parts.push(tube((t) => [0, 1, 2].map((i) => from[i] + (tip[i] - from[i]) * t), (t) => Math.max(0.015, r0 * 0.4 * (1 - 0.7 * t)), 2, 4, shadeOf, layer));
    // And a second, from a third along, out and down the other way - the
    // crown's lower skirt held up on it, so seen from beside or below (the
    // front row from the tee) the limbs show through its underside.
    const low = at(0.35);
    const b = a + Math.PI * (0.7 + rand() * 0.6);
    const tip2 = [end[0] + Math.cos(b) * r * across * 0.75, end[1] - r * up * (0.15 + rand() * 0.25), end[2] + Math.sin(b) * r * across * 0.75];
    const skirt = (t) => [0, 1, 2].map((i) => low[i] + (tip2[i] - low[i]) * t + (i === 1 ? Math.sin(t * Math.PI) * r * 0.25 : 0));
    parts.push(tube(skirt, (t) => Math.max(0.015, r0 * 0.5 * (1 - 0.7 * t)), 3, 4, shadeOf, layer));
    // Its twigs: a spray off the limb's end all round, up into the lump's
    // top; off each fork's outer half, out its way (the skirt's down).
    const fewer = r * across < TWIGS.small ? 1 : 0;
    const rt = Math.max(0.012, r0 * 0.22);
    twigs(end, k, twig() * Math.PI * 2, Math.PI * (1 - 1 / TWIGS.tip), TWIGS.tip - fewer, [0.35, 0.85], rt);
    const fork = (s) => [0, 1, 2].map((i) => from[i] + (tip[i] - from[i]) * s);
    twigs(fork(0.55 + twig() * 0.3), k, a, 0.7, TWIGS.fork - fewer, [0, 0.5], rt * 0.8);
    twigs(skirt(0.55 + twig() * 0.3), k, b, 0.7, TWIGS.fork - fewer, [-0.45, 0.1], rt * 0.8);
  }
  return { geometry: parts.length ? mergeGeometries(parts) : null, tips };
}

// A close-up broadleaf's finer leaf cards: `n` a lump, `size` of its
// radius, placed over it as ever (place: cardsOn, or birchCards' cloud) -
// but TWIGS.leaves of them in sprays round its twigs' ends (tips:
// limbsGeometry), each facing out from the lump's middle as the rest do.
export function closeCards(dome, place, n, size, rand, fill, tips) {
  const geos = [];
  dome.forEach((lump, k) => {
    const own = tips.filter((t) => t[3] === k);
    // (n: as many on every lump, or each lump's own.)
    const m = Array.isArray(n) ? n[k] : n;
    const each = own.length ? Math.max(1, Math.round((m * TWIGS.leaves) / own.length)) : 0;
    geos.push(place([lump], m - each * own.length, size, rand, fill));
    if (each) geos.push(sprays(lump, own, each, size, rand));
  });
  return mergeGeometries(geos);
}

// `each` leaf cards round each of `tips` ([x, y, z]) in a lump [x, y, z, r],
// within a card's width of it: facing out from the lump's middle, tilted
// and turned at random, lit as the lump's other cards are.
function sprays(lump, tips, each, size, rand) {
  const [cx, cy, cz, r] = lump;
  const geos = [];
  for (const [tx, ty, tz] of tips) {
    for (let i = 0; i < each; i++) {
      const s = size * r * (0.7 + rand() * 0.45);
      const at = new THREE.Vector3(tx + (rand() - 0.5) * s * 1.4, ty + (rand() - 0.5) * s, tz + (rand() - 0.5) * s * 1.4);
      const out = at.clone().sub(new THREE.Vector3(cx, cy, cz)).normalize();
      const dir = out.clone().add(new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(0.9)).normalize();
      const g = new THREE.PlaneGeometry(s, s);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rand() * Math.PI * 2));
      g.applyQuaternion(q);
      g.translate(at.x, at.y, at.z);
      const pos = g.attributes.position;
      const nor = g.attributes.normal;
      for (let v = 0; v < pos.count; v++) {
        const nv = new THREE.Vector3(pos.getX(v) - cx, pos.getY(v) - cy, pos.getZ(v) - cz).normalize();
        nor.setXYZ(v, nv.x, nv.y, nv.z);
      }
      geos.push(g);
    }
  }
  return shadeParts(mergeGeometries(geos), geos.length, rand, { low: 3, high: 8.5 });
}

// A close-up tree's boughs (sim/offshoots.mjs: the owner, 27 October 2026,
// "have a few static tree shapes and then the offshoots are connected to
// the tree shapes ... smaller bits drawn to make them all different"),
// drawn: a small kit, each one's bough and twigs in bark (the trunks'
// batch) and its clumps of leaf cards (the leaves' batch, in each leaf
// picture they're worn in), made once and shared by every tree that wears
// them - each tree its own of them, an instance of the kit's in the
// batches it's in already. cards: how many cards in its end clump, each
// side clump and the inner one, and their size (metres); out: how far
// each card's light is turned out along the bough, from out from its
// clump's middle (as a crown's are turned out from the crown's:
// CROWN_DEPTH.round); inner, under: how much darker a clump is on its
// side towards the tree, and underneath; coreCards, coreSize: a close-up
// tree's heart of leaves (coreOf) has this share of its usual finer
// cards, this much bigger, so they cover it as they did its lumps.
// A birch's (birch): smaller cards, its clumps loose clouds of them hanging
// from its twigs (clumpCards' `cloud`), in its own bark.
// Finer leaves (the Finer leaves switch, sim/effects.mjs fineleaves: High
// and Ultra; the owner's list, 2 November 2026: "finer leaf cards on High
// and Ultra ... with a switch"): a close-up tree's leaf and needle cards
// `more` times as many - its heart's, its boughs' and its sprays' - each
// smaller by its square root, so they cover about as much as they did:
// as many pixels, in smaller pieces. Nearer and further trees are as
// they were (too small for it to show).
export const FINE_LEAVES = { more: 1.6 };
export const FINE = EXTRA && !!effectsInUse(loadSetting("effects", {}), LEVEL).fineleaves;
const fineCount = (n) => (FINE ? Math.max(1, Math.round(n * FINE_LEAVES.more)) : n);
const fineSize = (size) => (FINE ? size / Math.sqrt(FINE_LEAVES.more) : size);
export const OFFSHOOT_LOOK = {
  cards: { ultra: { end: 18, side: 12, inner: 8, size: 0.8 }, high: { end: 11, side: 7, inner: 5, size: 1.0 } },
  out: 0.5,
  inner: 0.8,
  under: 0.86,
  coreCards: 0.6,
  coreSize: 1.15,
  birch: { cards: { ultra: { end: 25, side: 17, inner: 12, size: 0.46 }, high: { end: 20, side: 14, inner: 10, size: 0.62 } }, coreCards: 0.55, coreSize: 1.1 },
  // A poplar's: upright clumps (style), half again as tall as they're wide.
  poplar: { cards: { ultra: { end: 14, side: 9, inner: 7, size: 0.62 }, high: { end: 9, side: 6, inner: 4, size: 0.78 } }, coreCards: 0.6, coreSize: 1.15, style: "upright" },
  // A bush's sprigs: small clumps of small cards, on its lumps as they are,
  // which keep most of their own.
  bush: { cards: { ultra: { end: 7, side: 5, inner: 4, size: 0.36 }, high: { end: 5, side: 3, inner: 3, size: 0.46 } }, coreCards: 0.7, coreSize: 1.05, style: "shell" },
  // A willow's: each clump a curtain of strands hanging from it (end: how
  // many strands, each a few cards one under the next; size: a card's
  // width).
  willow: { cards: { ultra: { end: 5, side: 4, inner: 3, size: 0.62 }, high: { end: 4, side: 3, inner: 2, size: 0.78 } }, coreCards: 0.65, coreSize: 1.1, style: "curtain" },
  // A small broadleaf's (a holly's, a hawthorn's): a broadleaf's, fewer
  // and smaller to its smaller clumps.
  small: { cards: { ultra: { end: 12, side: 8, inner: 6, size: 0.5 }, high: { end: 8, side: 5, inner: 4, size: 0.62 } }, coreCards: 0.62, coreSize: 1.12 },
};
// A conifer's sprays (SPRAY_LOOK): needle cards lying out along each
// spray and drooping, a little smaller than a close-up conifer's own
// (size: metres), on a tier keeping `coreCards` of its own close-up ones.
// (A Scots pine's and a column conifer's tiers aren't drawn in,
// sim/offshoots.mjs SPRAY_CORE: more of their own - a column nearly all,
// its few sprays adding to its dense column.)
export const SPRAY_LOOK = { cards: { ultra: { end: 7, side: 4, inner: 4, size: 1.15 }, high: { end: 4, side: 3, inner: 3, size: 1.4 } }, coreCards: 0.7, coreCardsOf: { [KIND.scots]: 0.8, [KIND.column]: 0.95 } };
const lookOf = (sort) => (sort === "conifer" ? SPRAY_LOOK : (OFFSHOOT_LOOK[sort] ?? OFFSHOOT_LOOK));
const offshootCards = (sort = "broad") => {
  const c = lookOf(sort).cards[ULTRA ? "ultra" : "high"];
  return FINE ? { ...c, end: fineCount(c.end), side: fineCount(c.side), inner: fineCount(c.inner), size: fineSize(c.size) } : c;
};
// A close-up tree's heart of leaves (coreOf): the share of its usual finer
// cards it keeps, and how much bigger they are.
const coreLook = (k) => {
  const L = lookOf(boughsOf(k));
  return { cards: L.coreCards, size: L.coreSize };
};
const kits = {};
export function offshootKit(sort = "broad") {
  if (kits[sort]) return kits[sort];
  const plans = kitPlans(sort);
  const L = offshootCards(sort);
  const R = OFFSHOOTS[sort].radius;
  const birch = sort === "birch";
  const conifer = sort === "conifer";
  const bare = sort === "snag";
  const layer = BARK_LAYER[birch ? "birch" : conifer ? "plates" : "furrowed"] ?? 0;
  const bark = plans.map((p) => {
    const [a, m, b] = p.branch;
    const at = (t) => [0, 1, 2].map((i) => (1 - t) * (1 - t) * a[i] + 2 * t * (1 - t) * m[i] + t * t * b[i]);
    // (A birch's a little darker, as its own branches are.)
    const shade = birch ? () => 0.85 : null;
    const parts = [tube(at, (t) => R.base + (R.tip - R.base) * t, 3, birch || bare ? 3 : 4, shade, layer)];
    for (const [f, to] of p.twigs) parts.push(tube(line(f, to), (t) => R.twig + (R.twigTip - R.twig) * t, 1, 3, shade, layer));
    return mergeGeometries(parts);
  });
  const leaves = bare ? {} : kitLeaves(sort, L, KIT_SEED[sort] ?? 0x0ff5c);
  kits[sort] = { bark, leaves };
  return kits[sort];
}
const KIT_SEED = { birch: 0xb1f5c, conifer: 0xc0f5c, poplar: 0x9f5c, bush: 0xb5f5c, willow: 0x3f5c, small: 0x5a5f5c };
// A kit's leaves: each of its plans' clumps of cards (L: how many to a
// clump, how big), in every leaf picture its kinds wear - the same clumps
// in each.
function kitLeaves(sort, L, seed) {
  const pictures = new Set();
  for (const k of BOUGH_KINDS) if (boughsOf(k) === sort) for (let si = 0; si < treeShapes()[KINDS[k]].length; si++) pictures.add(leafPictureOf(KINDS[k], si));
  const style = sort === "birch" ? "cloud" : (lookOf(sort).style ?? "shell");
  const clumps = kitPlans(sort).map((p, i) => (sort === "conifer" ? sprayCards(p, L, seeded(seed + i * 131)) : style === "curtain" ? curtainCards(p, L, seeded(seed + i * 131)) : clumpCards(p, L, seeded(seed + i * 131), style)));
  // (Each picture's a copy of its own, its own userData too - three.js's
  // clone shares it, and toAtlas, finding the first picture's mark on it,
  // left the rest reading the whole atlas.)
  return Object.fromEntries([...pictures].map((picture) => [picture, clumps.map((g) => toAtlas(Object.assign(g.clone(), { userData: {} }), picture))]));
}
// How many cards a bough's clump c (of all) has: L.counts', one a clump
// (from its end in), if it has them; else its end's, its inner one's, or a
// side one's.
const clumpCount = (L, c, all) => (L.counts ? (L.counts[c] ?? 0) : c === 0 ? L.end : c === all - 1 ? L.inner : L.side);

// A tree's own boughs further off (the owner, 28 October 2026: "400m or so
// needs to have the same overall shape as up close"): on High and Ultra,
// where a tree close up wears boughs, every tree that's drawn near, not
// close up - out to the edge of the hole's ground - wears the same ones,
// from its seed, on the same heart of leaves (coreOf), so its outline is
// the same at any distance: each of them only its clumps' leaves (no
// wood: a dead tree's, its bare boughs as close up), a few cards a clump
// (counts, from its end in), `grow` times a close-up one's on High,
// nearer its clump's middle (spread, of its radius) so they reach no
// further past it than the close-up ones do - inside the room the camera
// keeps clear of. And its low version (far: the far-only neighbours, and
// past FAR_FROM when the safety valve sheds the trees' distance) wears
// them too, as one or two cards. Each its own kit, made once, shared by
// every tree of its sort (boughKit). (Medium and Standard, with no
// close-up trees, draw every tree in its shape, near and far.)
export const BOUGH_LEVELS = {
  mid: { counts: [3, 2, 2, 1], grow: 1.2, spread: [0.15, 0.65], bush: { counts: [2, 1, 1, 1], grow: 1 }, willow: { counts: [2, 1, 1, 0] }, conifer: { counts: [2, 1, 1, 1], grow: 1 } },
  far: { counts: [1, 1, 0, 0], grow: 1.25, spread: [0, 0.35], willow: { counts: [1, 1, 0, 0], grow: 1.2 }, conifer: { counts: [1, 1, 0, 0], grow: 1.1 } },
};
const levelKits = {};
export function boughKit(sort, level = "mid") {
  const key = `${sort}:${level}`;
  if (levelKits[key]) return levelKits[key];
  const B = BOUGH_LEVELS[level];
  const own = B[sort] ?? {};
  const close = lookOf(sort).cards.high;
  const grow = own.grow ?? B.grow;
  const L = { counts: own.counts ?? B.counts, spread: own.spread ?? B.spread, size: close.size * grow };
  levelKits[key] = { leaves: sort === "snag" ? {} : kitLeaves(sort, L, ((KIT_SEED[sort] ?? 0x0ff5c) ^ (level === "far" ? 0xfa2 : 0x41d)) >>> 0) };
  return levelKits[key];
}

// An offshoot's clumps of leaf cards (plan: sim/offshoots.mjs
// offshootPlan's): spread through each clump as a crown's are over its
// lumps (cardsOn), lit as it is - out from the clump's middle, turned out
// along the offshoot - each card shaded its own way, and darker on the
// clump's side towards the tree and underneath. style: "shell", as a
// crown's; "cloud", a birch's - a loose cloud through the clump, longer
// than it's wide (hanging), its cards lit out and up as a birch's crown's
// are (birchCards); "upright", a poplar's - as a shell, half again as tall
// as it's wide.
function clumpCards(plan, L, rand, style = "shell") {
  const cloud = style === "cloud";
  const upright = style === "upright";
  const base = new THREE.Vector3(...plan.branch[0]);
  const geos = [];
  const counts = [];
  const centre = new THREE.Vector3();
  const nv = new THREE.Vector3();
  const out = new THREE.Vector3();
  plan.clumps.forEach(([cx, cy, cz, r], c) => {
    const n = clumpCount(L, c, plan.clumps.length);
    centre.set(cx, cy, cz);
    out.copy(centre).sub(base).normalize();
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const phi = Math.acos(1 - 2 * t) + (rand() - 0.5) * 0.4;
      const theta = i * 2.39996 + rand() * 0.7;
      const dir = new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta));
      const s = L.size * (0.8 + rand() * 0.5);
      const g = new THREE.PlaneGeometry(s, cloud ? s * (0.8 + rand() * 0.3) : s);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rand() * Math.PI * 2));
      g.applyQuaternion(q);
      const at = dir.clone().multiplyScalar(r * (L.spread ? L.spread[0] + (L.spread[1] - L.spread[0]) * (cloud ? Math.sqrt(rand()) : rand()) : cloud ? 0.15 + 0.85 * Math.sqrt(rand()) : 0.3 + rand() * 0.7)).add(centre);
      // (A birch's hanging: nearly twice as deep as it's wide; a poplar's
      // upright.)
      if (cloud) at.y = cy + (at.y - cy) * 1.8;
      if (upright) at.y = cy + (at.y - cy) * 1.5;
      g.translate(at.x, at.y, at.z);
      const pos = g.attributes.position;
      const nor = g.attributes.normal;
      for (let k = 0; k < pos.count; k++) {
        if (cloud) nv.set(pos.getX(k) - cx, (pos.getY(k) - cy) * 0.5 + 0.45 * r, pos.getZ(k) - cz).normalize().lerp(out, OFFSHOOT_LOOK.out * 0.6).normalize();
        else nv.set(pos.getX(k) - cx, pos.getY(k) - cy, pos.getZ(k) - cz).normalize().lerp(out, OFFSHOOT_LOOK.out).normalize();
        nor.setXYZ(k, nv.x, nv.y, nv.z);
      }
      geos.push(g);
      counts.push(c);
    }
  });
  const geo = shadeParts(mergeGeometries(geos), geos.length, rand, { low: 3, high: 8.5 });
  // Darker towards the tree and underneath, each card by its own clump.
  const pos = geo.attributes.position;
  const col = geo.attributes.color;
  const per = pos.count / geos.length;
  for (let i = 0; i < pos.count; i++) {
    const [cx, cy, cz] = plan.clumps[counts[Math.floor(i / per)]];
    centre.set(cx, cy, cz);
    out.copy(centre).sub(base).normalize();
    nv.set(pos.getX(i) - cx, pos.getY(i) - cy, pos.getZ(i) - cz).normalize();
    const k = (OFFSHOOT_LOOK.inner + (1 - OFFSHOOT_LOOK.inner) * (0.5 + 0.5 * nv.dot(out))) * (OFFSHOOT_LOOK.under + (1 - OFFSHOOT_LOOK.under) * (0.5 + 0.5 * nv.y));
    col.setXYZ(i, col.getX(i) * k, col.getY(i) * k, col.getZ(i) * k);
  }
  return geo;
}

// A willow's curtains (plan: sim/offshoots.mjs offshootPlan's, its clumps
// hanging from its twigs): from each clump, strands of leaf cards hanging
// one under the next, bowing out a little as they fall, facing out from
// the bough's foot - lit out and a little up, as its own strands are
// (willowStrands); L.end, L.side, L.inner strands from the end clump, each
// side one and the inner one, a card L.size wide.
function curtainCards(plan, L, rand) {
  const base = new THREE.Vector3(...plan.branch[0]);
  const geos = [];
  plan.clumps.forEach(([cx, cy, cz, r], c) => {
    const n = clumpCount(L, c, plan.clumps.length);
    const face = Math.atan2(cz - base.z, cx - base.x);
    for (let i = 0; i < n; i++) {
      const a = face + (i - (n - 1) / 2) * 0.45 + (rand() - 0.5) * 0.3;
      const px = cx + Math.cos(a) * r * (0.3 + rand() * 0.5);
      const pz = cz + Math.sin(a) * r * (0.3 + rand() * 0.5);
      const w = L.size * (0.85 + rand() * 0.3);
      const h = w * 1.15;
      const cards = 2 + Math.floor(rand() * 2);
      let top = cy + r * (0.4 + rand() * 0.4);
      for (let k = 0; k < cards; k++) {
        const g = new THREE.PlaneGeometry(w * (1 - k * 0.12), h);
        g.translate(0, top - h / 2, 0);
        g.rotateY(-a + Math.PI / 2);
        const bow = r * 0.12 * k;
        g.translate(px + Math.cos(a) * bow, 0, pz + Math.sin(a) * bow);
        const nor = g.attributes.normal;
        for (let m = 0; m < nor.count; m++) {
          const nrm = new THREE.Vector3(Math.cos(a), 0.25, Math.sin(a)).normalize();
          nor.setXYZ(m, nrm.x, nrm.y, nrm.z);
        }
        geos.push(g);
        top -= h * 0.82;
      }
    }
  });
  return shadeParts(mergeGeometries(geos), geos.length, rand, { low: 0.4, high: 7 });
}

// A conifer's spray's needles (plan: sim/offshoots.mjs offshootPlan's): cards
// lying out along the spray and drooping (as a tier's ring's lie out and
// down: pineCards), spread through each clump flatter than it's wide, lit
// out from the spray and up, each shaded its own way and darker under it
// and towards the trunk.
function sprayCards(plan, L, rand) {
  const base = new THREE.Vector3(...plan.branch[0]);
  const geos = [];
  const out = new THREE.Vector3();
  const nv = new THREE.Vector3();
  plan.clumps.forEach(([cx, cy, cz, r], c) => {
    const n = clumpCount(L, c, plan.clumps.length);
    out.set(cx - base.x, 0, cz - base.z).normalize();
    const a = Math.atan2(out.z, out.x);
    for (let i = 0; i < n; i++) {
      const s = L.size * (0.8 + rand() * 0.4);
      const g = new THREE.PlaneGeometry(s, s * 0.8);
      // Lying out and down, turned a little either way off the spray.
      g.rotateX(-Math.PI / 2 + 0.45 + rand() * 0.25);
      g.translate(0, 0, s * 0.2);
      g.rotateY(-(a + (rand() - 0.5) * 1.1) + Math.PI / 2);
      const q = rand() * Math.PI * 2;
      const d = r * (L.spread ? L.spread[0] + (L.spread[1] - L.spread[0]) * Math.sqrt(rand()) : Math.sqrt(rand()));
      g.translate(cx + Math.cos(q) * d, cy + (rand() - 0.6) * r * 0.5, cz + Math.sin(q) * d);
      const pos = g.attributes.position;
      const nor = g.attributes.normal;
      for (let k = 0; k < pos.count; k++) {
        nv.set(pos.getX(k) - base.x, 0, pos.getZ(k) - base.z).normalize();
        nv.y = 0.6;
        nv.normalize();
        nor.setXYZ(k, nv.x, nv.y, nv.z);
      }
      geos.push(g);
    }
  });
  const geo = shadeParts(mergeGeometries(geos), geos.length, rand, { low: 1, high: 10 });
  // Darker under the spray and nearer the trunk.
  const pos = geo.attributes.position;
  const col = geo.attributes.color;
  const reach = Math.max(1e-3, ...plan.clumps.map(([x, , z]) => Math.hypot(x - base.x, z - base.z)));
  for (let i = 0; i < pos.count; i++) {
    const t = Math.min(1, Math.hypot(pos.getX(i) - base.x, pos.getZ(i) - base.z) / reach);
    const k = OFFSHOOT_LOOK.inner + (1 - OFFSHOOT_LOOK.inner) * t;
    col.setXYZ(i, col.getX(i) * k, col.getY(i) * k, col.getZ(i) * k);
  }
  return geo;
}

// A close-up tree's heart of leaves: its shape's lumps, each as big as
// OFFSHOOT.core of itself for a kind that wears boughs (its boughs make
// the rest of its crown); any other kind's, as they are.
function coreOf(k, dome) {
  return OFFSHOOT_KINDS.has(k) ? dome.map(([x, y, z, r]) => [x, y, z, r * OFFSHOOTS[boughsOf(k)].core]) : dome;
}

// A tree's own boughs (sim/offshoots.mjs treeOffshoots, from its seed, as
// a ball meets them), as instances of its sort's kits, at every distance
// (BOUGH_LEVELS): close up (`close`: it has close-up parts) each bough in
// the trunks' batch in its bark and its clumps in the leaves' (roles
// "limbs", "cardsClose"); near, its clumps' few cards (role "cards"); far,
// one or two (role "far") - in its leaves' colour, as dark as its crown is
// where they are and their lump's own shade (crownDepth), shown and hidden
// with its other parts of each. A dead tree's bare boughs: its wood alone,
// near and close up alike ("trunk"). trunk, cards: { color, key } of its
// bark and its leaves.
const crownFrames = new Map();
function boughParts(p, name, trunk, cards, close) {
  const sort = boughsOf(p.kind);
  const O = OFFSHOOTS[sort];
  const shape = treeShapes()[name][p.shape];
  const out = { close: [], near: [], far: [] };
  if (sort === "snag") {
    const bark = offshootKit(sort).bark;
    for (const o of snagOffshoots(shape, p.seed)) out.near.push({ role: "trunk", geometry: bark[o.kit], matrix: p.matrix.clone().multiply(new THREE.Matrix4().fromArray(o.matrix)), color: trunk.color, key: trunk.key });
    return out;
  }
  // (A conifer's tiers, as lumps, for how dark its crown is where they go;
  // a willow's dome, not its curtain.)
  const dome = shape.tiers ? shape.tiers.map(([r, , y, dx, dz]) => [dx, y, dz, r]) : boughDome(shape);
  const key = `${p.kind}:${p.shape}`;
  if (!crownFrames.has(key)) crownFrames.set(key, crownFrame(dome));
  const frame = crownFrames.get(key);
  const picture = leafPictureOf(name, p.shape);
  const kit = close ? offshootKit(sort) : null;
  const mid = boughKit(sort, "mid").leaves[picture];
  const far = boughKit(sort, "far").leaves[picture];
  const local = new THREE.Matrix4();
  // (Where they grow is the same on every setting, inside the room its
  // lumps give it - inside the camera's, crownBound - as a ball meets them:
  // sim/treehits.mjs.)
  const boughs = sort === "conifer" ? treeSprays({ trunk: shape.trunk, tiers: shape.tiers }, p.seed, { kind: p.kind, toward: p.open }) : treeOffshoots({ trunk: shape.trunk, dome }, p.seed, { kind: p.kind, toward: p.open });
  for (const o of boughs) {
    const matrix = p.matrix.clone().multiply(local.fromArray(o.matrix));
    const [x, y, z] = o.clumps[0];
    const k = depthAt(frame, x, y, z);
    const [tr, tg, tb] = frame.tints ? patchAt(frame, x, y, z) : [1, 1, 1];
    // (And its own shade: OFFSHOOT.shade.)
    const light = 1 + o.shade * O.shade.light;
    const warm = o.shade * O.shade.warm;
    const color = cards.color.clone();
    color.setRGB(color.r * k * tr * light * (1 + warm), color.g * k * tg * light, color.b * k * 1.03 * tb * light * (1 - warm));
    if (kit) {
      out.close.push({ role: "limbs", geometry: kit.bark[o.kit], matrix, color: trunk.color, key: trunk.key });
      out.close.push({ role: "cardsClose", geometry: kit.leaves[picture][o.kit], matrix, color, key: cards.key });
    }
    out.near.push({ role: "cards", geometry: mid[o.kit], matrix, color, key: cards.key });
    out.far.push({ role: "far", geometry: far[o.kit], matrix, color, key: cards.key });
  }
  return out;
}

// A conifer close up (the owner, 15 October 2026: "yes build them all" -
// the pines, spruce and column had none): a whorl of branches from the
// trunk under each tier, rising off it a little and drooping out to the
// needles at its rim, most with a twig off to the side (its trunk carried
// on up through the tiers is its usual version's too: coniferCore); about
// three times the needle cards (twice on High) at three fifths the size,
// spread along the branches - `deep` of the way out - not only round their
// tips (it has no solid tiers, close up or not: nearParts). Its arms:
// `arms` per tier, more on a wider one, reaching `reach` of the tier's
// radius.
export const CONIFER_CLOSE = {
  arms: [5, 9],
  reach: [0.72, 0.88],
  cards: { ultra: { every: 1 / 3, grow: 0.6 }, high: { every: 1 / 2, grow: 0.72 } },
  deep: [0.3, 0.78],
};

// A close-up conifer's needle cards (CONIFER_CLOSE), finer with the Finer
// leaves switch (FINE_LEAVES): closer together along its branches, each
// smaller.
const coniferFine = () => {
  const c = CONIFER_CLOSE.cards[ULTRA ? "ultra" : "high"];
  return FINE ? { ...c, every: c.every / FINE_LEAVES.more, grow: fineSize(c.grow) } : c;
};

// A point `t` (0 - 1) of the way along a line through `pts`, by length.
function along(pts) {
  const lens = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
  const total = lens.at(-1) || 1;
  return (t) => {
    const d = Math.min(1, Math.max(0, t)) * total;
    let i = 1;
    while (i < pts.length - 1 && lens[i] < d) i++;
    const k = (d - lens[i - 1]) / (lens[i] - lens[i - 1] || 1);
    return [0, 1, 2].map((j) => pts[i - 1][j] + (pts[i][j] - pts[i - 1][j]) * k);
  };
}
const line = (a, b) => (t) => [0, 1, 2].map((j) => a[j] + (b[j] - a[j]) * t);

// A conifer's close-up branches and the rest of its trunk (CONIFER_CLOSE):
// tubes in its bark (layer), for the trunks' batch. sh: its shape (sim/
// treeshapes.mjs: trunk plan and tiers [r, h, y, dx, dz]).
function coniferLimbs(sh, rand, layer) {
  const { trunk: plan, tiers } = sh;
  const parts = [];
  const top = trunkAt(plan, 1);
  for (const [r, h, y, dx, dz] of tiers) {
    // From under the tier: on the trunk where it's that high, else on the
    // trunk carried up through the tiers.
    const base = y - h * 0.3;
    const from = base <= top[1] ? trunkAt(plan, Math.max(0, base / plan.height)) : [dx, base, dz];
    const n = Math.round(Math.min(CONIFER_CLOSE.arms[1], Math.max(CONIFER_CLOSE.arms[0], r * 2.4)));
    const a0 = rand() * Math.PI * 2;
    const r0 = Math.min(0.09, 0.03 + r * 0.018);
    for (let i = 0; i < n; i++) {
      const a = a0 + (i / n) * Math.PI * 2 + (rand() - 0.5) * 0.5;
      const len = r * (CONIFER_CLOSE.reach[0] + rand() * (CONIFER_CLOSE.reach[1] - CONIFER_CLOSE.reach[0]));
      const end = [dx + Math.cos(a) * len, base - h * (0.1 + rand() * 0.1), dz + Math.sin(a) * len];
      const mid = [from[0] + (end[0] - from[0]) * 0.45, Math.max(from[1], end[1]) + h * 0.08, from[2] + (end[2] - from[2]) * 0.45];
      const at = (t) => [0, 1, 2].map((j) => (1 - t) * (1 - t) * from[j] + 2 * t * (1 - t) * mid[j] + t * t * end[j]);
      // (Thin, among the needles: 3-sided, its droop in 2 rings, a twig
      // - straight - in 1: half the triangles of 4 and 3, for the conifers'
      // whorls were most of their close-up wood.)
      parts.push(tube(at, (t) => Math.max(0.012, r0 * (1 - 0.8 * t)), 2, 3, null, layer));
      if (rand() < 0.7) {
        const start = at(0.5);
        const b = a + (rand() < 0.5 ? -1 : 1) * (0.5 + rand() * 0.4);
        const l = len * 0.35;
        parts.push(tube(line(start, [start[0] + Math.cos(b) * l, start[1] - h * 0.06, start[2] + Math.sin(b) * l]), (t) => Math.max(0.01, r0 * 0.45 * (1 - 0.7 * t)), 1, 3, null, layer));
      }
    }
  }
  return mergeGeometries(parts);
}

// A conifer's trunk on up (High and Ultra: its trunk geometry carries it,
// for its usual and its close-up versions alike): from the top of its trunk
// as planned - which stops low on a pine, spruce or column, where the solid
// tiers hid the rest - through the middle of each tier above, to within the
// top tier's needles, thinner as it goes; so between the needles there's a
// trunk and the dark inside of the tree, not a smooth cone. A tube in its
// bark (layer), or null where there's nothing above the trunk.
function coniferCore(sh, layer) {
  const { trunk: plan, tiers } = sh;
  const top = trunkAt(plan, 1);
  const tip = tiers.reduce((best, t) => (t[2] + t[1] * 0.5 > best[2] + best[1] * 0.5 ? t : best));
  const pts = [top, ...[...tiers].sort((a, b) => a[2] - b[2]).filter((t) => t[2] > top[1] + 0.3).map(([, , y, dx, dz]) => [dx, y, dz])];
  const tipY = tip[2] + tip[1] * 0.2;
  if (tipY > pts.at(-1)[1] + 0.3) pts.push([tip[3], tipY, tip[4]]);
  if (pts.length < 2) return null;
  const r1 = trunkRadius(plan, 1);
  return tube(along(pts), (t) => Math.max(0.02, r1 * (1 - 0.85 * t)), Math.max(2, (pts.length - 1) * 2), 6, null, layer);
}

// A dead snag close up: a twig or two off the outer half of each bare
// branch, the broken stubs of branches long gone down its trunk, and
// splinters standing up round its broken top - tubes in its bark (layer),
// for the trunks' batch, within the reach of its branches as drawn.
function snagLimbs(plan, rand, layer) {
  const parts = [];
  for (const br of plan.branches) {
    const twigs = rand() < 0.6 ? 2 : 1;
    for (let i = 0; i < twigs; i++) {
      const t = 0.55 + rand() * 0.3;
      const from = branchAt(plan, br, t);
      const b = br.b + (rand() - 0.5) * 1.6;
      const l = br.len * (0.18 + rand() * 0.12);
      const end = [from[0] + Math.cos(b) * l * 0.6, from[1] + l * (0.6 + rand() * 0.35), from[2] + Math.sin(b) * l * 0.6];
      const rb = branchRadius(br, t) * 0.55;
      parts.push(tube(line(from, end), (s) => Math.max(0.012, rb * (1 - 0.75 * s)), 2, 4, null, layer));
    }
  }
  const stubs = 3 + Math.floor(rand() * 3);
  for (let i = 0; i < stubs; i++) {
    const t = 0.15 + rand() * 0.6;
    const from = trunkAt(plan, t);
    const a = rand() * Math.PI * 2;
    const rt = trunkRadius(plan, t);
    const l = rt + 0.15 + rand() * 0.3;
    parts.push(tube(line(from, [from[0] + Math.cos(a) * l, from[1] + l * (0.2 + rand() * 0.4), from[2] + Math.sin(a) * l]), (s) => rt * 0.35 * (1 - 0.5 * s), 2, 5, null, layer));
  }
  const top = trunkAt(plan, 1);
  const splinters = 3 + Math.floor(rand() * 3);
  for (let i = 0; i < splinters; i++) {
    const a = (i / splinters) * Math.PI * 2 + rand() * 0.6;
    const from = [top[0] + Math.cos(a) * plan.r1 * 0.6, top[1] - 0.15, top[2] + Math.sin(a) * plan.r1 * 0.6];
    const tall = 0.2 + rand() * 0.3;
    parts.push(tube(line(from, [from[0] + Math.cos(a) * 0.06, from[1] + tall, from[2] + Math.sin(a) * 0.06]), (s) => Math.max(0.006, plan.r1 * 0.35 * (1 - s)), 2, 3, null, layer));
  }
  return mergeGeometries(parts);
}

// A crown's depth: its leaf cards darker the further in towards the
// crown's heart and the lower under it - little light gets in there - and
// the outer, upper ones the lightest, so a crown reads as a rounded mass
// with hollows and an underside rather than one flat green. Multiplied into
// the cards' own shades (shadeParts). It was the close-up cards' alone (the
// front row's, seen down the hole: sim/treelod.mjs FRONT_FROM); every
// tree's cards have it now - the usual ones, the low versions' and so the
// far woods' pictures (treePictureParts) - the owner, 17 October 2026,
// having asked for trees that read as round rather than flat green clumps.
// round: how far each card's light is turned from its own lump's middle to
// the whole crown's - lit as one rounded mass in the sun, as the far woods'
// pictures are (look/treeatlas.js RADIAL), rather than each lump a ball of
// its own (19 October 2026: the overall look, at no cost).
// patch: how much each lump of a crown is a shade of its own - one a touch
// yellower, the next deeper or bluer, as a real tree's crown is in patches
// (19 October 2026: "more variation"), the same in its near, close-up and
// low versions (from the lump, not the randomness that shapes them).
export const CROWN_DEPTH = { heart: 0.62, under: 0.72, round: 0.5, patch: 0.09 };
// A crown's middle, reach and height (its lumps': dome), and each lump's
// own shade (CROWN_DEPTH.patch), for crownDepth and an offshoot's
// colour (offshootParts).
function crownFrame(dome) {
  let cx = 0;
  let cy = 0;
  let cz = 0;
  for (const [x, y, z] of dome) {
    cx += x / dome.length;
    cy += y / dome.length;
    cz += z / dome.length;
  }
  let reach = 0;
  let lo = Infinity;
  let hi = -Infinity;
  for (const [x, y, z, r] of dome) {
    reach = Math.max(reach, Math.hypot(x - cx, y - cy, z - cz) + r);
    lo = Math.min(lo, y - r);
    hi = Math.max(hi, y + r);
  }
  // (Warm: more red, less blue, a little lighter; cool the other way.)
  const tints =
    CROWN_DEPTH.patch && dome.length > 1
      ? dome.map(([x, y, z]) => {
          const h = Math.abs(Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453) % 1;
          const t = (h * 2 - 1) * CROWN_DEPTH.patch;
          return [1 + t * 1.2, 1 + t * 0.5, 1 - t * 1.4];
        })
      : null;
  return { cx, cy, cz, reach, lo, hi, tints, dome };
}
// How much darker at (x, y, z): deep in the crown and low in it.
function depthAt(f, x, y, z) {
  const out = Math.min(1, Math.hypot(x - f.cx, y - f.cy, z - f.cz) / (f.reach || 1));
  const up = Math.min(1, Math.max(0, (y - f.lo) / (f.hi - f.lo || 1)));
  return (CROWN_DEPTH.heart + (1 - CROWN_DEPTH.heart) * out ** 1.5) * (CROWN_DEPTH.under + (1.08 - CROWN_DEPTH.under) * up);
}
// The shade of the lump whose middle (x, y, z) is nearest, of its size.
function patchAt(f, x, y, z) {
  let best = 0;
  let d = Infinity;
  for (let j = 0; j < f.dome.length; j++) {
    const [lx, ly, lz, r] = f.dome[j];
    const e = Math.hypot(x - lx, y - ly, z - lz) / (r || 1);
    if (e < d) {
      d = e;
      best = j;
    }
  }
  return f.tints[best];
}
function crownDepth(geo, dome) {
  if (!geo || !dome.length) return geo;
  const f = crownFrame(dome);
  const pos = geo.attributes.position;
  const col = geo.attributes.color;
  for (let i = 0; i < pos.count; i++) {
    const k = depthAt(f, pos.getX(i), pos.getY(i), pos.getZ(i));
    col.setXYZ(i, Math.min(1, col.getX(i) * k), Math.min(1, col.getY(i) * k), Math.min(1, col.getZ(i) * k * 1.03));
  }
  // Each lump's own shade (CROWN_DEPTH.patch): warmer and lighter, or
  // cooler and deeper, by a hash of where it is - each card by the lump
  // it's nearest the middle of.
  if (f.tints) {
    for (let i = 0; i < pos.count; i++) {
      const [tr, tg, tb] = patchAt(f, pos.getX(i), pos.getY(i), pos.getZ(i));
      col.setXYZ(i, Math.min(1, col.getX(i) * tr), Math.min(1, col.getY(i) * tg), Math.min(1, col.getZ(i) * tb));
    }
  }
  const nor = geo.attributes.normal;
  if (nor) {
    const n = new THREE.Vector3();
    const r = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      r.set(pos.getX(i) - f.cx, pos.getY(i) - f.cy, pos.getZ(i) - f.cz).normalize();
      n.set(nor.getX(i), nor.getY(i), nor.getZ(i)).lerp(r, CROWN_DEPTH.round).normalize();
      nor.setXYZ(i, n.x, n.y, n.z);
    }
  }
  return geo;
}

// Blossom cards' pictures moved into cell `cell` of the blossom picture
// (blossomTexture: 0 a shrub's florets, 1 a horse chestnut's candle), half
// a pixel in from its edge - their uv as PlaneGeometry made it, once.
export function toBlossomCell(geo, cell, cellPixels = 128 * LEAF_SCALE) {
  if (!geo || geo.userData.blossomCell != null) return geo;
  const uv = geo.attributes.uv;
  const inset = 0.5 / cellPixels;
  for (let k = 0; k < uv.count; k++) uv.setX(k, (cell + inset + uv.getX(k) * (1 - 2 * inset)) / BLOSSOM_CELLS);
  uv.needsUpdate = true;
  geo.userData.blossomCell = cell;
  return geo;
}

// A horse chestnut's candles (the owner, 11 November 2026: the trees "more
// distinctive from each other ... without dramatically increasing triangle
// or draw amounts"): upright spikes of white flowers standing on the
// outside of its crown, up from `from` of the way round a lump from its
// side (0) to its top (1), `out` of its radius from its middle (just
// clear of its leaves) - each two crossed cards, so one shows from any
// side, leaning a little out; `most` a tree, at least `apart` metres from
// each other, only where a lump's surface is the crown's outside. 4
// triangles a candle: 96 a tree at most, of its 2,800 or so, in the
// shrubs' blossom batch - no draw more where a hole has a shrub in bloom,
// one where it hasn't.
// (Smaller than they were - 1.35 by 0.8 m - and no longer all lit as if
// from above: from a tee they stood out of a shaded crown as flat cream
// cut-outs, and shone through the haze on a far tree. `lit` is how far
// each one's lighting leans out with the side of the crown it stands on
// (0 straight up, 1 with the crown's own side), `low` the shade of one
// low on a lump's side against one on its top.)
export const CANDLES = { most: 24, apart: 1.25, from: 0.12, out: 1.07, height: 1.12, width: 0.62, sunk: 0.12, lean: 0.22, share: 0.8, pink: 0.14, lit: 0.55, low: 0.74 };
function candleCards(dome, rand) {
  const C = CANDLES;
  const spots = [];
  for (const [cx, cy, cz, r] of dome) {
    const n = Math.max(6, Math.round(r * r * 3.2));
    for (let i = 0; i < n; i++) {
      const y = C.from + (1 - C.from) * ((i + rand()) / n);
      const a = i * 2.39996 + rand() * 0.8;
      const h = Math.sqrt(Math.max(0, 1 - y * y));
      const dir = [h * Math.cos(a), y, h * Math.sin(a)];
      const at = [cx + dir[0] * r * C.out, cy + dir[1] * r * C.out, cz + dir[2] * r * C.out];
      // (Inside another lump: in the leaves, not on the outside.)
      if (dome.some(([x2, y2, z2, r2]) => (x2 !== cx || y2 !== cy || z2 !== cz) && Math.hypot(at[0] - x2, at[1] - y2, at[2] - z2) < r2 * 1.04)) continue;
      spots.push({ at, dir, pick: rand() });
    }
  }
  spots.sort((p, q) => p.pick - q.pick);
  const kept = [];
  for (const s of spots) {
    if (kept.length >= C.most) break;
    if (kept.every((k) => Math.hypot(k.at[0] - s.at[0], k.at[1] - s.at[1], k.at[2] - s.at[2]) >= C.apart)) kept.push(s);
  }
  if (!kept.length) return null;
  const up = new THREE.Vector3(0, 1, 0);
  const geos = [];
  for (const { at, dir } of kept) {
    const size = 0.85 + rand() * 0.35;
    const turn = rand() * Math.PI;
    // Leaning out with the crown's side, upright on its top.
    const out = new THREE.Vector3(dir[0], 0, dir[2]);
    const axis = out.lengthSq() > 1e-6 ? new THREE.Vector3().crossVectors(up, out.normalize()) : new THREE.Vector3(1, 0, 0);
    const lean = new THREE.Quaternion().setFromAxisAngle(axis.normalize(), C.lean * (1 - dir[1]));
    // (Lit more from above than its place on the crown is - one on the
    // tree's shaded side lit as the leaves there came out grey, not white -
    // but with its side of the tree: C.lit.)
    const light = new THREE.Vector3(dir[0] * C.lit, 1, dir[2] * C.lit).normalize();
    // (And the lower ones a little duller: less sky reaches them.)
    const shade = (0.9 + rand() * 0.1) * (C.low + (1 - C.low) * dir[1]);
    for (const q of [0, Math.PI / 2]) {
      const g = new THREE.PlaneGeometry(C.width * size, C.height * size);
      g.translate(0, C.height * size * 0.5 - C.sunk, 0);
      g.rotateY(turn + q);
      g.applyQuaternion(lean);
      g.translate(at[0], at[1], at[2]);
      // Lit as the crown's outside is, there - not edge on to the sun.
      const nor = g.attributes.normal;
      for (let k = 0; k < nor.count; k++) nor.setXYZ(k, light.x, light.y, light.z);
      g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(nor.count * 3).fill(shade), 3));
      geos.push(g);
    }
  }
  return toBlossomCell(mergeGeometries(geos), 1);
}
// A shape's parts with its shoot ends (look/shootends.js) among its leaf
// cards - its usual ones and its near heart's, and more close up
// (worn(cards, a lump's worth): withEnds).
function withShootEnds(parts, worn, E) {
  if (parts.cards) parts.cards = worn(parts.cards, E.near);
  if (parts.cardsHeart) parts.cardsHeart = worn(parts.cardsHeart, E.near);
  if (parts.cardsClose) parts.cardsClose = worn(parts.cardsClose, E.close);
  return parts;
}
// A tree's leaf cards with its shoot ends after them: one geometry, each in
// its own cell of the atlas (so toAtlas, later, leaves it be).
function withEnds(cards, ends, picture, endPicture) {
  if (!cards || !ends) return cards;
  toAtlas(cards, picture);
  toAtlas(ends, endPicture);
  const g = mergeGeometries([cards, ends]);
  g.userData.atlas = picture;
  // (How many of its corners are its cards' - four a card: the rest are
  // its shoot ends', seven each.)
  g.userData.cardCorners = cards.attributes.position.count;
  return g;
}

// A hawthorn's blossom and fruit, on its upper lumps as a flowering shrub's
// is, but small and all over it (the blossom picture's florets, in the
// tree's own colour for the time of year): `cards` a lump at `size` of
// its radius; in spring `may` of
// them white with blossom (now and then pink), from summer `haws` of them
// set with red haws, more in autumn.
export const HAWS = { cards: 5, size: 0.36, may: 0.9, pink: 0.12, haws: 0.55, autumn: 0.85, dull: 0.5 };
// What a tree of `kind` wears in the blossom batch in `season`, from its own
// seed: { color, on } - or null for a kind with none of its own (a
// flowering shrub's is its shape's).
function bloomOf(kind, own, season) {
  if (kind === KIND.chestnut) {
    const rand = seeded(own ^ 0xca4d1e);
    const color = candleColor(rand);
    return { color, on: (season === "summer" || season === "spring") && rand() < CANDLES.share };
  }
  if (kind === KIND.hawthorn) {
    const rand = seeded(own ^ 0x4a35);
    const color = new THREE.Color();
    if (season === "spring") {
      if (rand() < HAWS.pink) color.setHSL(0.94 + rand() * 0.03, 0.5, 0.82);
      else color.setHSL(0.14, 0.2 + rand() * 0.15, 0.93);
      return { color, on: rand() < HAWS.may };
    }
    // (Haws are small and deep red among the leaves: the florets' picture
    // in a dark red, not a tree in red blossom.)
    color.setHSL((0.985 + rand() * 0.03) % 1, 0.62 + rand() * 0.12, (0.36 + rand() * 0.07) * HAWS.dull);
    return { color, on: rand() < (season === "autumn" ? HAWS.autumn : HAWS.haws) };
  }
  return null;
}

// A horse chestnut's candles' colour: cream white, or now and then a red
// horse chestnut's pink (CANDLES.pink of them).
function candleColor(rand, out = new THREE.Color()) {
  return rand() < CANDLES.pink ? out.setHSL(0.955 + rand() * 0.03, 0.5 + rand() * 0.15, 0.7 + rand() * 0.06) : out.setHSL(0.13 + rand() * 0.03, 0.3 + rand() * 0.2, 0.9 + rand() * 0.04);
}

// The upper half of a crown's lumps (blossom is where the light is).
function upper(spheres) {
  const mid = spheres.reduce((a, s) => a + s[1], 0) / spheres.length;
  return spheres.filter((s) => s[1] >= mid - 0.05);
}

// A willow's hanging curtain: narrow strands from inside the dome's
// leaves, bowing out and down to just off the ground. The top of each
// one sits in the crown, so the fall reads as part of the tree.
function willowStrands(sh, rand) {
  const geos = [];
  const dome = sh.spheres.slice(0, sh.spheres.length - sh.curtain);
  for (const [x, y, z, r] of dome) {
    const face = Math.atan2(z, x);
    const n = 7;
    for (let i = 0; i < n; i++) {
      const ang = face + (i - (n - 1) / 2) * 0.24 + (rand() - 0.5) * 0.2;
      const px = x + Math.cos(ang) * r * (0.5 + rand() * 0.28);
      const pz = z + Math.sin(ang) * r * (0.5 + rand() * 0.28);
      const top = y + r * (0.2 + rand() * 0.35);
      const full = top - (0.4 + rand() * 0.45);
      // Some falls only part of the way, so the join under the crown is a
      // thick curtain and the long ones aren't the only leaves.
      const height = rand() < 0.4 ? full * (0.28 + rand() * 0.3) : full;
      const bottom = top - height;
      if (height < 1.2) continue;
      const width = 0.95 + rand() * 0.5;
      const g = new THREE.PlaneGeometry(width, height, 1, 5);
      const pos = g.attributes.position;
      const bow = r * (0.18 + rand() * 0.3);
      for (let k = 0; k < pos.count; k++) {
        const t = pos.getY(k) / height + 0.5;
        pos.setX(k, pos.getX(k) * (0.82 + 0.35 * t));
        pos.setZ(k, Math.sin((1 - t) * Math.PI * 0.55) * bow);
      }
      g.translate(0, (top + bottom) / 2, 0);
      g.rotateY(-ang + Math.PI / 2);
      g.translate(px, 0, pz);
      const uv = g.attributes.uv;
      const repeats = Math.max(2, height / 0.9);
      for (let k = 0; k < uv.count; k++) uv.setY(k, uv.getY(k) * repeats);
      const nor = g.attributes.normal;
      for (let k = 0; k < pos.count; k++) {
        const nrm = new THREE.Vector3(pos.getX(k), 0.25, pos.getZ(k)).normalize();
        nor.setXYZ(k, nrm.x, nrm.y, nrm.z);
      }
      geos.push(g);
    }
  }
  return geos.length ? shadeParts(mergeGeometries(geos), geos.length, rand, { low: 0.4, high: 7 }) : null;
}

// ---- Low versions -------------------------------------------------------------------

// Each shape's low version: a tree far off (past sim/treelod.mjs FAR_FROM,
// on Medium and Standard - on High and Ultra none inside the hole's ground,
// NEAR_IN_CROP) and a neighbouring hole's beyond its few real ones on
// those. The owner (15 October 2026): "the lowest versions are so poor they
// need to be redone to be lower triangles but not these big horrible chunky
// models. Make sure we re do all our tree types". So no lumps: each kind's
// own leaves, crown and bark - in the near trees' own batches and
// materials, so it lights, sways, takes its colour and the season's as
// they do - in a fraction of the triangles:
//   broadleaves (leaf, oak, poplar, bush, willow): a small solid core under
//     a quarter of the leaf cards at nearly twice the size; a birch the
//     cards alone, as near
//   conifers (pine, Scots pine, column, spruce): six-sided tiers of three
//     bands under a third of the needle cards, half as big again
//   a snag: its trunk and bigger branches, thin
// and a plain six-sided trunk. Without leaf cards (Standard) the core is a
// little rounder, as it's all there is. (Two crossed photos were tried: one
// arm went black against the light, they didn't sway, and they lost each
// tree's own colour and the season's.) [trunk, crown, cards]: the crown or
// cards null where it has none.
export const LOW = { cardShare: 0.25, cardGrow: 1.9, birchGrow: 1.8, pineEvery: 3, pineGrow: 1.5, sides: 6, rings: 3 };

function lowGeometry(name, sh, rand, k = KIND[name], si = 0) {
  const look = LOOK[name];
  const layer = BARK_LAYER[look.tex ?? "furrowed"] ?? 0;
  // (In its crown's shade, as near: TRUNK_SHADE - not a dead tree's, which has none.)
  const lowShade = name === "birch" || name === "beech" ? paleShade : trunkShade;
  const post = (plan, rings, sides, wide = 1.05, under = lowShade) => tube((t) => trunkAt(plan, t), (t) => trunkRadius(plan, t) * wide, rings, sides, null, layer, { under });
  if (sh.snag) {
    const limbs = sh.trunk.branches.map((br) => tube((t) => branchAt(sh.trunk, br, t), (t) => branchRadius(br, t) * 1.2, 1, 4, null, layer));
    return { trunk: mergeGeometries([post(sh.trunk, LOW.rings, LOW.sides, 1.1, null), ...limbs]), crown: null, cards: null };
  }
  // (A clump's stems, each as its trunk: sim/treeshapes.mjs CLUMP_MORE.)
  const stems = sh.trunk.branches.filter((br) => br.stem).map((br) => tube((t) => branchAt(sh.trunk, br, t), (t) => branchRadius(br, t) * 1.05, LOW.rings, LOW.sides, null, layer, { under: lowShade }));
  const trunk = stems.length ? mergeGeometries([post(sh.trunk, LOW.rings, LOW.sides), ...stems]) : post(sh.trunk, LOW.rings, LOW.sides);
  if (tiered(name)) {
    const lumps = sh.tiers.map(([r, , y, dx, dz]) => [dx, y, dz, r]);
    const low = { trunk, crown: wearing(pineCrown(sh.tiers, rand, LOW.sides, true), look.texture), cards: HIGH ? crownDepth(pineCards(sh.tiers, rand, { every: LOW.pineEvery, grow: LOW.pineGrow }), lumps) : null };
    // Wearing its sprays far off too (BOUGH_LEVELS): on its tiers drawn
    // in, as near.
    if (EXTRA && SPRAY_KINDS.has(k)) {
      const heart = heartRand(k, si);
      const tiers = sprayCore(sh.tiers, k);
      low.crownHeart = wearing(pineCrown(tiers, heart, LOW.sides, true), look.texture);
      low.cardsHeart = crownDepth(pineCards(tiers, heart, { every: LOW.pineEvery / heartShare(k), grow: LOW.pineGrow }), lumps);
    }
    return low;
  }
  // (Its low version as it was: a kind given more leaves since keeps what
  // it had here - LOOK's `drawn`.)
  const was = look.drawn ?? look;
  const per = Math.max(3, Math.round((was.cards ?? 12) * LOW.cardShare));
  // (A willow's curtain, its strands near to, half as many cards as its dome.)
  const hang = name === "willow" ? sh.curtain ?? 0 : 0;
  const dome = sh.spheres.slice(0, sh.spheres.length - hang);
  const curtain = sh.spheres.slice(sh.spheres.length - hang);
  const leaves = (spheres, n, r = rand) => cardsOn(spheres, n, was.size * LOW.cardGrow * (r === rand ? 1 : heartSize(k)), r, look.fill || 0);
  const cards = !HIGH ? null : crownDepth(name === "birch" ? birchCards(sh.spheres, per + 1, was.size * LOW.birchGrow, rand) : curtain.length ? mergeGeometries([leaves(dome, per), leaves(curtain, Math.max(2, per >> 1))]) : leaves(dome, per), dome);
  // (A birch has no solid crown near to: none far off either.)
  const crown = name === "birch" && HIGH ? null : wearing(broadleafCrown(sh.spheres, rand, true, HIGH ? 0 : 1, HIGH ? TUCK : null), leafPictureOf(name, si));
  if (!EXTRA || !OFFSHOOT_KINDS.has(k)) return { trunk, crown, cards };
  // Wearing its boughs far off too (BOUGH_LEVELS): its heart, as near.
  const heart = heartRand(k, si);
  const core = coreOf(k, dome);
  const few = Math.max(2, Math.round(per * heartShare(k)));
  const cardsHeart = crownDepth(name === "birch" ? birchCards(core, few + 1, was.size * LOW.birchGrow * heartSize(k), heart) : curtain.length ? mergeGeometries([leaves(core, few, heart), leaves(curtain, Math.max(2, per >> 1), heart)]) : leaves(core, few, heart), dome);
  const crownHeart = name === "birch" || OFFSHOOTS[boughsOf(k)].core >= 1 ? null : wearing(broadleafCrown([...core, ...curtain], heart, true, 0, TUCK), leafPictureOf(name, si));
  return { trunk, crown, cards, cardsHeart, crownHeart };
}

// Every shape's low version, made once: [kind][shape].
let lowBuilt = null;
export function lowGeometries() {
  lowBuilt ??= keptOrMade("low tree shapes", makeLow);
  return lowBuilt;
}
function makeLow() {
  const first = seeded(0xfa4);
  const more = seeded(0xfa5);
  const common = seeded(0xfa6);
  const all = treeShapes();
  const made = KINDS.map((name, k) => all[name].map((sh, si) => lowGeometry(name, sh, streamOf(k, si, [first, more, common], 0xfab0), k, si)));
  made.forEach((shapes, k) => shapes.forEach((sh, si) => [sh.cards, sh.cardsHeart].forEach((g) => toAtlas(g, leafPictureOf(KINDS[k], si)))));
  return made;
}

// What a tree is drawn with, low: [role ("far"), geometry, matrix, colour,
// material key] - the keys its near parts use (its bark, the solid crowns,
// its leaf picture), so they're drawn in the same batches.
function lowParts(p, low, name) {
  const out = [["far", low.trunk, p.matrix, new THREE.Color(PALETTE[LOOK[name].bark]), "bark"]];
  if (low.cards) {
    if (low.crown) out.push(["far", low.crown, p.matrix, p.color.clone().multiplyScalar(crownShade(name)), "crown"]);
    const picture = leafPictureOf(name, p.shape);
    out.push(["far", low.cards, p.matrix, cardColor(p.color, picture), cardKey(picture)]);
  } else if (low.crown) out.push(["far", low.crown, p.matrix, p.color, "crown"]);
  return out;
}

// ---- Placing them --------------------------------------------------------------

// Trees are drawn in a few batches, one per material (trunks, crowns, each
// kind of leaf card, willow strands, blossom, far trees), with three.js's
// BatchedMesh: each tree outside the view is dropped on its own and the
// rest drawn in one call - a handful of draw calls a pass however many
// trees, where one instanced mesh per kind and shape took 72-150 and drew
// the trees behind the camera too. It needs the graphics card to draw many
// things in one call (WEBGL_multi_draw; app.js checks, and the report says);
// without it, or with the graphics setting's trees: "instanced", they're
// drawn the old way, one instanced mesh per kind and shape.
let batching = true;
export function setTreeBatching(on) {
  batching = !!on;
}
export function treeBatching() {
  return batching;
}

// Where far trees start (sim/treelod.mjs FAR_FROM: 300 m on High and
// Ultra, 220 m on Medium, 150 m on Standard), and the safety valve's steps
// that bring them in (look/safety.js): counts and visibility only, taking
// effect at the next cut. High's is always shed before Medium's and brought
// back after it, so each sets the distance its own way.
// (Nearer on the phone: sim/treelod.mjs PHONE_REACH.)
const [FAR_FROM, CLOSE_FROM, FRONT_FROM, FRONT_MAX] = [PC_FAR, PC_CLOSE, PC_FRONT, PC_FRONT_MAX].map((t) => (PHONE ? phoneTable(t) : t));
let farFrom = FAR_FROM[LEVEL];
registerStep(2, "3D trees to 220 m", (on) => (farFrom = on ? FAR_FROM.medium : FAR_FROM.high), { of: "high" });
// On High and Ultra no low trees at all inside the hole's ground (sim/
// treelod.mjs NEAR_IN_CROP) - until the steps above bring the distance in.
const nearInCrop = () => !PHONE && !!NEAR_IN_CROP[LEVEL] && farFrom === FAR_FROM[LEVEL];
// Whether the neighbouring holes' trees in a hole's crop are real trees
// (course/holescenery.js), not the low version.
export function neighboursInFull() {
  return nearInCrop();
}
// Neighbour trees in the crop (course/holescenery.js cropSurfaceSteps).
// Shed: they hide at once, and the next hole built draws only the next
// hole as tier 1 (sim/coursetiers.mjs). Visibility only, so no hitch.
const neighbourGroups = new Set();
export function watchNeighbourTrees(group) {
  if (!group) return group;
  neighbourGroups.add(group);
  group.visible = !neighbourShed();
  return group;
}
registerStep(1.5, "no neighbour trees", (on) => {
  setNeighbourShed(on);
  for (const g of neighbourGroups) g.visible = !on;
}, { of: "high" });
// How near the camera a tree is drawn close up (sim/treelod.mjs
// CLOSE_FROM: 120 m on Ultra, 45 m on High, none below), and the safety
// valve's steps: Ultra's to High's distance, then High's none at all -
// taking effect at the next cut, as the far trees' do.
let closeOff = false;
let closeNearer = false;
const closeFrom = () => (!EXTRA || closeOff ? 0 : ULTRA && !closeNearer ? CLOSE_FROM.ultra : CLOSE_FROM.high);
// The hole's front row close up from further off (sim/treelod.mjs
// FRONT_FROM, FRONT_MAX): Ultra's, High's, or none - shed with the rest.
const frontFrom = () => (!closeFrom() ? 0 : ULTRA && !closeNearer ? FRONT_FROM.ultra : FRONT_FROM.high);
const frontMax = () => (ULTRA && !closeNearer ? FRONT_MAX.ultra : FRONT_MAX.high);
// The hole in play's own trees at their best wherever they are (sim/
// treelod.mjs HOLE_TOP): on Ultra, until its close-ups are shed.
const holeTop = () => !PHONE && ULTRA && !!HOLE_TOP.ultra && closeFrom() === CLOSE_FROM.ultra;
registerStep(2, "close-up trees to 45 m", (on) => (closeNearer = on), { of: "ultra" });
registerStep(0.75, "no close-up trees", (on) => (closeOff = on), { of: "high" });
registerStep(2, "simpler far trees", (on) => {
  farFrom = on ? FAR_FROM.standard : FAR_FROM.medium;
});
// And then only the trees along where the camera's going in full (100 m
// of the shot's or the flyover's path, sim/treelod.mjs), the rest their
// light far version - shed alongside the far tufts (look/groundbits.js),
// before anything is switched off.
registerStep(2.6, "3D trees only near the shot", (on) => {
  farFrom = on ? FAR_FROM.least : FAR_FROM.standard;
});

// positions: [x, z, scale, kind, width] in world metres; y is found with
// groundY(x, z). Each tree takes its form (sim/treehits.mjs treeForm) -
// its kind, height, spread, turn, shape (sim/treeshapes.mjs), lean and how
// thick its leaves are - from forms (a course's trees: then drawn exactly
// as a ball in the air meets them), or else worked out from where it
// stands. A sparse tree's leaves a lighter green, and on High the solid
// crown inside its leaf cards smaller, so more of the sky shows through;
// a thick one darker and fuller. seed: its colour, one of its kind's tints
// (TREE_TINTS).
// Where a leaf card's picture is cut out (its alpha): the trees' own, and
// the far woods' pictures of them, drawn the same (look/treeatlas.js:
// cut at 0.45 there, the far tree line was thinner and darker than the
// trees in front of it - backlog, "the trees, next").
export const LEAF_CUT = 0.2;
function leafCard(kind, hook = "cards") {
  const grid = cardKey(kind) === "leaves" ? [ATLAS.cols, ATLAS.rows] : [1, 1];
  return foliageMaterial({ map: cardMap(kind), vertexColors: true, alphaToCoverage: true, alphaTest: LEAF_CUT }, hook, grid);
}

export function makeTrees(positions, { groundY = () => 0, seed = 11, shadows = true, forms = null, farOnly = false, front = null, own = null, facing = null } = {}) {
  const group = new THREE.Group();
  const leafy = HIGH;
  // Far-only neighbours never become full trees, so their near geometry
  // is not built. The hole's own trees still build every shape, once.
  const geos = farOnly ? null : shapeGeometry();
  const lowGeos = farOnly ? lowGeometries() : null;
  // Each tree: its kind, shape, matrix, colour and thickness.
  const q = new THREE.Quaternion();
  const tilt = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const axis = new THREE.Vector3();
  // The ground round each one's foot (look/treefoot.js), on High and up.
  const feet = [];
  // How open each stands (sim/treelooks.mjs): its colour lighter and
  // warmer in the open, darker and cooler deep in a wood.
  const open = treeOpenness(positions);
  const placed = positions.map((p, i) => {
    const f = forms?.[i] ?? treeForm(p);
    const [x, z] = p;
    const shape = Number.isInteger(f.shape) ? f.shape % ((farOnly ? lowGeos : geos)[f.kind]?.length ?? TREE_SHAPES) : 0;
    q.setFromAxisAngle(up, f.yaw ?? 0);
    tilt.setFromAxisAngle(axis.set(Math.cos(f.leanA ?? 0), 0, Math.sin(f.leanA ?? 0)), f.lean ?? 0);
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, groundY(x, z) - 0.2, z), tilt.clone().multiply(q), new THREE.Vector3(f.w * (f.sx ?? 1), f.h, f.w * (f.sz ?? 1)));
    const thick = thickShare(f.thick ?? 1);
    // Its colours its own, from its seed (sim/treehits.mjs treeForm), not
    // from its place among the trees drawn with it: so the same tree is the
    // same colour from its own hole and the next, and whatever trees are
    // added or cleared round it - each from a sequence of its own, so its
    // blossom or its turning early changes none of the rest.
    const own = f.seed ?? hashNumbers([x, z]);
    let tint = treeTint(KINDS[f.kind] ?? "leaf", seeded(own ^ 0x71a7));
    // Now and then (a few on a course) a broadleaf or oak turning gold or
    // copper early.
    const accent = seeded(own ^ 0x90d)();
    if ((f.kind === KIND.leaf || f.kind === KIND.oak) && accent < ACCENT.share) tint = treeTint("accent", seeded(own ^ 0xacce57));
    // In today's season (look/season.js, the Seasons switch), a
    // broadleaf's leaves: autumn's turned gold, copper and red, winter's
    // dead brown, or its green moved for the season.
    if (SEASON && DECIDUOUS.has(f.kind)) {
      const seasons = seeded(own ^ 0x5ea5);
      const r = seasons();
      if (r < SEASON.turn) tint = treeTint("autumn", seasons);
      else if (r < SEASON.turn + SEASON.brown) tint = treeTint("dead", seasons);
      else seasonal(tint, "leaves");
    }
    // Sparse trees a fresher, yellower green and lighter; thick ones bluer
    // and darker. (Bare crowns on Standard a little richer: seen without
    // their leaves' texture they came out grey.)
    const color = tint.clone().offsetHSL(THICK_HUE * (thick - AVERAGE_SHARE), leafy ? 0 : 0.1, THICK_LIGHT * (AVERAGE_SHARE - thick));
    // And by where it stands (sim/treelooks.mjs): the stand's cast, shared
    // with the trees round it and the far woods past them, and how open it
    // is - its own colour moved a little further, for nothing.
    const shift = treeShift(standShade(x, z), open[i]);
    color.offsetHSL(shift.hue, shift.sat, shift.light);
    // A flowering shrub's blossom colour.
    // (A horse chestnut's candles: cream or pink - and most of them in
    // flower, in spring and as the course always looks; none in autumn.)
    // (And a hawthorn's: white with may blossom in spring, red with haws
    // from summer on - bloomOf.)
    const bloom = bloomOf(f.kind, own, SEASON?.name ?? "summer");
    const blossom = bloom ? bloom.color : treeTint("bush", seeded(own ^ 0xb10550), new THREE.Color(), BLOSSOMS);
    const flowers = !bloom || bloom.on;
    // How far its leaves reach, as drawn below, and so the room a camera
    // must give it: a circle round the foot of its trunk and a height
    // (crownBound). Always the full-detail tree's, near or far.
    const sh = farOnly ? null : geos[f.kind]?.[shape];
    // (A snag's is its bare branches'.)
    // (And its heart's, where it wears boughs: BOUGH_LEVELS.)
    // (Not a horse chestnut's candles: they stand in its leaves' reach, and
    // the room it's given stays what it was.)
    const reaching = sh ? [sh.crown, sh.cards, sh.cardsHeart, HIGH ? sh.strands : null, f.kind === KIND.chestnut || f.kind === KIND.hawthorn ? null : sh.blossom, sh.crown ? null : sh.trunk] : [];
    const parts = sh ? reaching.map((g) => reachOf(g)) : [{ r: 0.65, y: 0.9 }];
    // (Its outline from above too, for a crown spread more one way than the
    // other - not one wearing its boughs, High and Ultra: they grow all
    // round it, in the room its lumps give it, as far out any way.)
    const outline = !!sh && !(EXTRA && BOUGH_KINDS.has(f.kind));
    const reach = { r: Math.max(0, ...parts.map((a) => a.r)), y: Math.max(0, ...parts.map((a) => a.y)), ...(outline ? { hull: reaching.flatMap((g) => (g ? [...hullOf(g)] : [])) } : {}) };
    const bound = crownBound(f, reach);
    const foot = groundY(x, z) - 0.2;
    feet.push({ x, z, kind: KINDS[f.kind], width: f.w ?? 1, seed: own });
    // (Its own seed: its boughs, offshootParts, as a ball meets them.)
    return { kind: f.kind, shape, matrix: m, color, thick, blossom, flowers, seed: own, open: f.open ?? null, crown: { x, z, r: bound.r, top: foot + bound.top }, height: bound.top };
  });
  // Which are buried in a wood, hidden from where they're seen - the hole's
  // line of play (facing: world [x, z] points), or with none every side
  // (sim/treelod.mjs buriedTrees): on High, drawn in their shape further
  // off, wearing their boughs only as the camera's going near (TreeDetail).
  if (!farOnly && EXTRA && BURIED.on[LEVEL] && batching) {
    const buried = buriedTrees(Float32Array.from(placed.flatMap((p) => [p.crown.x, p.crown.z, p.height, p.crown.r])), { facing });
    placed.forEach((p, i) => (p.buried = buried[i] === 1));
  }
  // Every tree's leaves as a camera must keep clear of them, in the order
  // given: { x, z, r, top } in world metres (view.js clearOfTrees).
  group.userData.crowns = placed.map((p) => p.crown);
  // How many of each kind, by name: the far woods past them take after
  // them (sim/country.mjs farMix).
  group.userData.kinds = {};
  for (const p of placed) group.userData.kinds[KINDS[p.kind]] = (group.userData.kinds[KINDS[p.kind]] ?? 0) + 1;
  const look = {
    // With leaf cards round it, the solid crown is the shadowed middle. On
    // Standard the crown is all there is: a little greyed, so it lands in
    // the same hue and brightness as High's leaves. Vertex colours: each
    // part of a crown shaded its own way (shadeParts). Leafy, with gaps, on
    // High (under the cards); mottled but whole on Standard.
    leafMat: leafyCrown(new THREE.MeshLambertMaterial({ color: leafy ? 0x9aa890 : 0xdce5d0, vertexColors: true }), leafy),
    // (Every kind's leaves one material, the atlas's: ATLAS.)
    cardMats: {
      leaves: leafCard("leaf"),
      willow: leafCard("willow", "strands"),
      blossom: foliageMaterial({ map: blossomTexture(), vertexColors: true, alphaToCoverage: true, alphaTest: LEAF_CUT }),
    },
  };
  // Leaves see-through where they all but touch the camera, and High's
  // leafy crown with them (look/glsl/seethrough.js); Standard's solid one
  // is left whole.
  for (const m of Object.values(look.cardMats)) m.userData.seeThrough = "leaves";
  if (leafy) look.leafMat.userData.seeThrough = "leaves";
  if (farOnly || batching) batchTrees(group, placed, geos, look, shadows && !farOnly, farOnly, front, own);
  else instanceTrees(group, placed, geos, look, shadows);
  // (Kept beside the trees, not among them: the scene adds it - userData.feet.)
  if (HIGH && !farOnly) group.userData.feet = makeTreeFeet(feet, groundY);
  return group;
}

// What each tree is drawn with, near: [role, geometry, matrix, colour,
// material key], for either way of drawing them.
function nearParts(p, sh, name) {
  const out = [["trunk", sh.trunk, p.matrix, new THREE.Color(PALETTE[LOOK[name].bark]), `bark`]];
  if (sh.cards) {
    // A birch has no solid lump under the leaves. That lump read as a dark
    // green mass on the trunk; the white bark and the leaf cloud are the tree.
    // Nor has a conifer (pine, Scots pine, spruce, column) its solid tiers
    // (the owner, 15 October 2026: "Pine still shows an 'under carriage' ...
    // it's the cone stuff that's the issue ... I honestly think removing the
    // core would be best"): tucked in as a broadleaf's crown is, their sunlit
    // sides showed between the needles as smooth, pale plates, and tucked
    // further and darkened, as an olive spine up the middle. Its needles -
    // round each tier and under it (underCards) - and its trunk carried up
    // through them (coniferCore) are the tree. (On Standard, with no needle
    // cards, the tiers are all there is: below.)
    // (Just inside the leaves: TUCK.)
    // (A kind's own, where its heavy shade wants the dark of the tree
    // behind its leaves, not a paler lump: LOOK's `under`.)
    if (name !== "birch" && !tiered(name)) out.push(["crown", sh.crown, p.matrix, p.color.clone().multiplyScalar(crownShade(name)), "crown"]);
    // Leaves carry the colour; the texture is already green, so the tint
    // is lightened towards white.
    const picture = leafPictureOf(name, p.shape);
    out.push(["cards", sh.cards, p.matrix, cardColor(p.color, picture), cardKey(picture)]);
    // A willow's curtain of hanging strands (High).
    if (HIGH && sh.strands) out.push(["strands", sh.strands, p.matrix, p.color.clone().lerp(new THREE.Color(1, 1, 0.9), 0.4), "willow"]);
    if (sh.blossom && p.flowers !== false) out.push(["blossom", sh.blossom, p.matrix, p.blossom, "blossom"]);
  } else if (sh.crown) out.push(["crown", sh.crown, p.matrix, p.color, "crown"]);
  return out;
}

// The batches: one BatchedMesh per material, every tree an instance in
// those it's drawn with near, and its low version's parts in the same
// batches (lowParts), shown or hidden as sim/treelod.mjs decides
// (updateTreeDetail). Near to begin with.
function batchTrees(group, placed, geos, look, shadows, farOnly = false, front = null, own = null) {
  const low = lowGeometries();
  const batches = new Map();
  // Every instance: its batch, geometry, matrix and colour; by tree.
  const trees = placed.map((p) => treeInstances(p, geos, low, farOnly));
  // (The kinds of these trees on the shelves: shapeShelves.)
  const kinds = [...new Set(placed.map((p) => p.kind))];
  const materialFor = (key) =>
    key === "bark" ? barkMaterial() : key === "crown" ? look.leafMat : look.cardMats[key];
  for (const t of trees) {
    for (const part of farOnly ? t.far : partsOf(t)) {
      let b = batches.get(part.key);
      if (!b) batches.set(part.key, (b = { key: part.key, material: materialFor(part.key), geometries: new Map(), parts: [] }));
      if (!b.geometries.has(part.geometry)) b.geometries.set(part.geometry, -1);
      b.parts.push(part);
    }
  }
  for (const b of batches.values()) {
    // Drawn from the shelf of every shape (shapeShelves) - or, should one
    // of its shapes not be on it, with copies of its own.
    const shelf = shapeShelves(kinds).get(b.key);
    const onShelf = !!shelf && [...b.geometries.keys()].every((g) => shelf.ids.has(g));
    const mesh = onShelf ? new ShelfBatch(b.parts.length, shelf, b.material) : ownBatch(b);
    if (onShelf) for (const g of b.geometries.keys()) b.geometries.set(g, shelf.ids.get(g));
    // Named for the near parts it draws, if any (a conifer, first of the
    // kinds, puts only its low version in the crowns' batch).
    mesh.userData.role = (b.parts.find((part) => part.role !== "far") ?? b.parts[0]).role;
    for (const part of b.parts) {
      const id = mesh.addInstance(b.geometries.get(part.geometry));
      mesh.setMatrixAt(id, part.matrix);
      mesh.setColorAt(id, part.color);
      // (A buried tree in its shape to begin with: TreeDetail.)
      mesh.setVisibleAt(id, farOnly || partShown(part.role, { boughs: false }, part));
      part.mesh = mesh;
      part.id = id;
    }
    // Sorted near to far each frame only where that saves the graphics card
    // work: solid crowns with nothing cut out of them (Standard's), whose
    // hidden pixels are then skipped. Leaves with gaps
    // cut in them gain nothing from it, and sorting costs three times the
    // culling on the processor.
    mesh.sortObjects = b.key === "crown" && !HIGH;
    // Blossom casts nothing (as before): it sits over leaves that do.
    mesh.castShadow = shadows && b.key !== "blossom";
    if (b.key === "blossom") mesh.userData.blossom = true;
    if (b.key === "bark") mesh.userData.trunk = true;
    group.add(mesh);
  }
  // Far-only neighbours are not switched to full trees as the camera
  // comes closer (stages 4 and 5): they stay the light crown.
  if (!farOnly) group.userData.detail = new TreeDetail(group, placed, trees, front, own);
}

// A batch with its own copy of each of its shapes (b.geometries: each
// one's id in it set as it's added).
function ownBatch(b) {
  let vertices = 0;
  let indices = 0;
  for (const g of b.geometries.keys()) {
    vertices += g.attributes.position.count;
    indices += g.index ? g.index.count : 0;
  }
  const mesh = new THREE.BatchedMesh(b.parts.length, vertices, Math.max(1, indices), b.material);
  for (const g of b.geometries.keys()) b.geometries.set(g, mesh.addGeometry(g));
  return mesh;
}

// One copy of every tree shape for every group of trees (the owner, 20
// October 2026: "Work on 2 and 3" - memory saved, nothing to be seen). A
// batch of trees (three.js's BatchedMesh) keeps the shapes it draws in
// buffers of its own, and each group of trees - the hole's own, its
// neighbours', the next hole's built ahead, the range's - had batches of
// its own: the same shapes copied again and again (9 - 14 MB of them twice
// over for each hole on Ultra), in the page and on the graphics card, and
// sent to the card again with every hole. Now every batch of a material
// draws from one shelf of the shapes drawn with it - near, close up and
// far - and keeps only its own trees' places and colours. [key] -> {
// store, ids }: a batch holding the shapes (never drawn itself), and each
// shape's id in it. A material whose shapes won't share one buffer (they
// always do) has no shelf: its batches keep their own copies.
//
// Only the kinds in use (the owner, 12 November 2026: "pickup the trees
// saving plan and execute"): the shelves hold the kinds of tree the game
// has drawn or been told it will (wantTreeKinds: a course's, as it loads -
// sim/coursekinds.mjs) - the range's and the greens' as they're built, each
// course's as it loads - and grow in place when another's wanted (a batch
// reads its shelf's shapes as they are now: ShelfBatch). A kind on no
// shelf has its shapes let go of too once the far woods' pictures are
// drawn and a course has said what it grows, and is made again if one's
// wanted after all (kindsBack). Grown, never shrunk: a kind put on them
// stays for the rest of the session.
let shelves = null;
// The kinds on the shelves, and the bough kits' sorts (sim/offshoots.mjs
// BOUGH_SORTS); the kinds a course has asked for before they were made;
// whether one has (so a kind on no shelf can be let go of); the kinds let
// go of that way.
const shelfKinds = new Set();
const shelfSorts = new Set();
const askedKinds = new Set();
let kindsDeclared = false;
const goneKinds = new Set();
const ALL_KINDS = KINDS.map((_, k) => k);

// The kinds a course grows (sim/coursekinds.mjs courseTreeKinds), as it
// loads: put on the shelves now (or as they're first made), rather than
// when a hole's trees first meet one. True if the shelves grew.
export function wantTreeKinds(kinds) {
  kindsDeclared = true;
  for (const k of kinds) askedKinds.add(k);
  if (!shelves || !batching) return false;
  const grew = growShelves(kinds);
  letGoOfShapes();
  return grew;
}
// (For the tests and the report: the kinds on the shelves, and let go of;
// the bytes the shelves hold - as many again on the graphics card.)
export const kindsOnShelves = () => [...shelfKinds].sort((a, b) => a - b);
export const kindsLetGo = () => [...goneKinds].sort((a, b) => a - b);
export function treeShelfBytes() {
  let bytes = 0;
  for (const { store } of shelves?.values() ?? []) {
    const g = store.geometry;
    for (const a of Object.values(g.attributes)) bytes += a.array.byteLength;
    if (g.index) bytes += g.index.array.byteLength;
  }
  return bytes;
}

// The shelves, with `kinds` on them (every kind if none's given).
function shapeShelves(kinds = ALL_KINDS) {
  if (!shelves) {
    shelves = new Map();
    growShelves([...askedKinds, ...kinds]);
    letGoOfShapes();
  } else if (kinds.some((k) => !shelfKinds.has(k))) {
    growShelves(kinds);
    letGoOfShapes();
  }
  return shelves;
}

// The shelves grown to hold `kinds` (those not on them yet): their shapes
// near, close up and far, and the kits of their boughs' sorts. True if they
// grew.
function growShelves(kinds) {
  const add = [...new Set(kinds)].filter((k) => KINDS[k] != null && !shelfKinds.has(k));
  if (!add.length) return false;
  kindsBack(add);
  const sorts = EXTRA ? [...new Set(add.filter((k) => BOUGH_KINDS.has(k)).map(boughsOf))].filter((s) => !shelfSorts.has(s)) : [];
  for (const [key, list] of shelfParts(add, sorts)) {
    const shelf = shelves.get(key);
    const fresh = [...list].filter((g) => !shelf?.ids.has(g));
    if (!fresh.length) continue;
    try {
      if (shelf) addToShelf(shelf, fresh);
      else {
        const b = { geometries: new Map(fresh.map((g) => [g, -1])), parts: [null] };
        shelves.set(key, { store: ownBatch(b), ids: b.geometries });
      }
    } catch (e) {
      console.warn(`Trees: the ${key} shapes kept in each batch (${e.message})`);
    }
  }
  for (const k of add) shelfKinds.add(k);
  for (const s of sorts) shelfSorts.add(s);
  return true;
}

// Every part the shapes of `kinds` are drawn with, by batch - and every
// bough of `sorts`' kits: [key] -> Set of shapes.
function shelfParts(kinds, sorts) {
  const geos = shapeGeometry();
  const low = lowGeometries();
  const lists = new Map();
  const put = (key, g) => {
    if (!lists.has(key)) lists.set(key, new Set());
    lists.get(key).add(g);
  };
  for (const kind of kinds) {
    geos[kind].forEach((_, shape) => {
      // (With a seed: its heart and boughs as a tree wears them, BOUGH_LEVELS
      // - and buried in a wood, its usual crown and cards too.)
      for (const buried of [false, true]) {
        const tree = { kind, shape, matrix: new THREE.Matrix4(), color: new THREE.Color(), thick: 1, blossom: new THREE.Color(), seed: 1, buried };
        for (const part of partsOf(treeInstances(tree, geos, low, false))) put(part.key, part.geometry);
      }
    });
  }
  // The boughs' kits, for the trees that wear them: every one of each, as
  // each tree has its own of them - close up, near and far (BOUGH_LEVELS).
  for (const sort of sorts) {
    for (const kitOf of [offshootKit(sort), boughKit(sort, "mid"), boughKit(sort, "far")]) {
      if (kitOf.bark) for (const g of kitOf.bark) put("bark", g);
      for (const [picture, geos] of Object.entries(kitOf.leaves)) for (const g of geos) put(cardKey(picture), g);
    }
  }
  return lists;
}

// More shapes onto a shelf: its store made room for them (three.js's
// setGeometrySize: its buffers made again, larger, with what they held -
// each shape where it was) and them added at its end.
function addToShelf(shelf, geos) {
  const store = shelf.store;
  let vertices = 0;
  let indices = 0;
  for (const g of geos) {
    vertices += g.attributes.position.count;
    indices += g.index ? g.index.count : 0;
  }
  store.setGeometrySize(store._maxVertexCount + vertices, store._maxIndexCount + indices);
  for (const g of geos) shelf.ids.set(g, store.addGeometry(g));
}

// The shapes of `kinds` let go of (goneKinds) made again: every shape made
// afresh as it first was (makeShapes, makeLow - the same every time), and
// theirs taken back into the very same shapes, so whatever holds them -
// the far woods' pictures' parts, a tree's reach - still does.
function kindsBack(kinds) {
  const back = kinds.filter((k) => goneKinds.has(k));
  if (!back.length) return;
  const near = makeShapes();
  const low = makeLow();
  const refill = (into, from) =>
    into.forEach((sh, si) => {
      for (const [part, g] of Object.entries(sh)) {
        const f = from[si]?.[part];
        if (!g || !f) continue;
        for (const [name, a] of Object.entries(f.attributes)) g.setAttribute(name, a);
        if (f.index) g.setIndex(f.index);
        g.userData.gone = false;
        g.userData.idle = false;
      }
    });
  for (const k of back) {
    refill(built[k], near[k]);
    if (lowBuilt) refill(lowBuilt[k], low[k]);
    goneKinds.delete(k);
  }
}

// The shapes' own numbers let go of (the owner, 21 October 2026, "1-3"):
// once the trees are drawn from the shelves and the far woods' pictures
// have been drawn (farPicturesDrawn), nothing reads them again - each is
// kept on its shelf - so their lists are emptied, about 25 MB on Ultra.
// How far each reaches is measured first (makeTrees asks it of every
// tree). Drawn the old way (one instanced mesh per kind and shape), they
// stay. Read back from the shelves (shapesBack) for the far woods'
// pictures to be drawn again after the graphics card resets.
let picturesDrawn = false;
export function farPicturesDrawn() {
  picturesDrawn = true;
  letGoOfShapes();
}
function letGoOfShapes() {
  if (!picturesDrawn || !shelves || !batching || !built) return;
  // (And its outline from above, hullOf - below High, where no tree wears
  // boughs: makeTrees.)
  for (const shapes of built) {
    for (const sh of shapes) {
      for (const g of [sh.crown, sh.cards, sh.cardsHeart, sh.strands, sh.blossom, sh.trunk]) {
        if (!g) continue;
        reachOf(g);
        if (!EXTRA) hullOf(g);
      }
    }
  }
  const empty = (g) => {
    for (const [name, a] of Object.entries(g.attributes)) g.setAttribute(name, new THREE.BufferAttribute(new a.array.constructor(0), a.itemSize, a.normalized));
    if (g.index) g.setIndex(new THREE.BufferAttribute(new g.index.array.constructor(0), 1));
  };
  for (const { ids } of shelves.values()) {
    for (const g of ids.keys()) {
      if (g.userData.onShelf) continue;
      g.userData.onShelf = true;
      empty(g);
    }
  }
  // A kind's parts no tree is drawn with - on High and Ultra a broadleaf's
  // usual crown and cards, where it wears its heart and boughs instead
  // (BOUGH_LEVELS): 11 MB, kept only for their reach, known now.
  for (const k of shelfKinds) {
    for (const sh of [...built[k], ...(lowBuilt?.[k] ?? [])]) {
      for (const g of Object.values(sh)) {
        if (!g || g.userData.onShelf || g.userData.idle) continue;
        g.userData.idle = true;
        empty(g);
      }
    }
  }
  // A kind on no shelf, once a course has said what it grows
  // (wantTreeKinds): its shapes let go of too (kindsBack makes them again).
  if (!kindsDeclared) return;
  for (const k of ALL_KINDS) {
    if (shelfKinds.has(k) || goneKinds.has(k)) continue;
    for (const sh of [...built[k], ...(lowBuilt?.[k] ?? [])]) {
      for (const g of Object.values(sh)) {
        if (!g || g.userData.onShelf || g.userData.gone || g.userData.idle) continue;
        g.userData.gone = true;
        empty(g);
      }
    }
    goneKinds.add(k);
  }
}
// Every shape let go of read back from its shelf: the same numbers, its
// corners numbered from 0 again.
export function shapesBack() {
  // (A kind on no shelf made again: kindsBack.)
  kindsBack([...goneKinds]);
  for (const { store, ids } of shelves?.values() ?? []) {
    const held = store.geometry;
    for (const [g, id] of ids) {
      if (!g.userData.onShelf) continue;
      const r = store.getGeometryRangeAt(id);
      for (const [name, a] of Object.entries(held.attributes)) g.setAttribute(name, new THREE.BufferAttribute(a.array.slice(r.vertexStart * a.itemSize, (r.vertexStart + r.vertexCount) * a.itemSize), a.itemSize, a.normalized));
      if (held.index) g.setIndex(new THREE.BufferAttribute(held.index.array.slice(r.indexStart, r.indexStart + r.indexCount).map((v) => v - r.vertexStart), 1));
      g.userData.onShelf = false;
    }
  }
}

// A batch drawing from a shelf: its shapes the shelf's - shared, not
// copied - and only its trees' places and colours its own, all it lets go
// of when it's done with (look/dispose.js, course/holebuild.js
// disposeWorld). (three.js's BatchedMesh, its shapes' buffers and their
// table pointed at the shelf's: tests/treeshelf.test.mjs holds three.js's
// own names for them to what this expects.)
// Its shapes, their table and where the next would go are its shelf's as
// they are now, read each time - so a shelf grown since it was made
// (growShelves: its buffers made again) is drawn from as it is.
const SHARED = ["geometry", "_geometryInfo", "_geometryCount", "_nextVertexStart", "_nextIndexStart"];
class ShelfBatch extends THREE.BatchedMesh {
  constructor(count, shelf, material) {
    const s = shelf.store;
    super(count, s._maxVertexCount, s._maxIndexCount, material);
    this.shelf = shelf;
    this._geometryInitialized = true;
  }
  dispose() {
    // (Its own let go of - its trees' places and colours - and its shelf's
    // shapes left as they are.)
    this.shelf = null;
    this._own.geometry = new THREE.BufferGeometry();
    super.dispose();
  }
}
for (const name of SHARED) {
  Object.defineProperty(ShelfBatch.prototype, name, {
    get() {
      return this.shelf ? this.shelf.store[name] : this._own?.[name];
    },
    set(v) {
      // (What three.js's batch sets as it's made, kept as its own until
      // it's on its shelf - and again once it's let go of.)
      if (!this._own) Object.defineProperty(this, "_own", { value: {}, writable: true });
      if (!this.shelf) this._own[name] = v;
    },
  });
}

// A tree's parts as instances: near, close up (if its shape has them) and
// far - each { role, geometry, matrix, color, key }, key its batch's.
function treeInstances(p, geos, low, farOnly) {
  const name = KINDS[p.kind];
  const sh = farOnly ? null : geos[p.kind][p.shape];
  const lo = low[p.kind][p.shape];
  // Wearing its own boughs at every distance (BOUGH_LEVELS: High and Ultra,
  // every kind) - on its heart of leaves, near and far as close up.
  const wears = EXTRA && p.seed != null && BOUGH_KINDS.has(p.kind);
  const near = sh ? nearParts(p, sh, name).map(([role, geometry, matrix, color, key]) => ({ role, geometry, matrix, color, key })) : [];
  // Close up (sim/treelod.mjs CLOSE_FROM): its branches in the trunks'
  // batch and its finer cards in its cards' - no draw call more - in their
  // colours. (Its solid crown as near to: PLAIN_LIMB. A snag's close up is
  // its twigs, stubs and splinters.)
  const cards = near.find((n) => n.role === "cards");
  const trunk = near.find((n) => n.role === "trunk");
  // And a kind that wears boughs: its smaller crown in place of its usual
  // one (core) - at every distance, if it wears them there - and its own
  // boughs (boughParts).
  const crown = near.find((n) => n.role === "crown");
  // (One buried in a wood, on High - sim/treelod.mjs buriedTrees - has
  // both: its heart and boughs, `worn`, while it wears them and close up;
  // and further off while it doesn't, `plain`, its low version's crown and
  // cards - hidden behind the trees in front of it, and already on the
  // shelves, so no shape more is kept for it.)
  const buried = wears && !!p.buried && !!sh;
  if (buried) {
    if (crown) Object.assign(crown, { worn: true, geometry: sh.core ?? crown.geometry });
    if (cards && sh.cardsHeart) Object.assign(cards, { worn: true, geometry: sh.cardsHeart });
    // (A willow's own curtain with its heart: its low version has one.)
    for (const part of near) if (part.role === "strands") part.worn = true;
    for (const [role, geometry, matrix, color, key] of lowParts(p, lo, name).slice(1)) near.push({ role: role === "far" ? (key === "crown" ? "crown" : "cards") : role, geometry, matrix, color, key, plain: true });
  } else if (wears) {
    if (crown && sh.core) crown.geometry = sh.core;
    if (cards && sh.cardsHeart) cards.geometry = sh.cardsHeart;
  } else if (crown && sh?.core) crown.nearOnly = true;
  const picture = leafPictureOf(name, p.shape);
  const boughs = wears ? boughParts(p, name, { color: trunk?.color ?? new THREE.Color(PALETTE[LOOK[name].bark]), key: "bark" }, { color: cards?.color ?? cardColor(p.color, picture), key: cardKey(picture) }, !farOnly && !!sh.limbs && (cards ? !!sh.cardsClose : true)) : null;
  if (sh) near.push(...(boughs?.near ?? []).map((b) => (buried ? { ...b, worn: true } : b)));
  // (Its trunk lighter beyond close up, where its shape has one -
  // TRUNK_NEAR: the full one's in its limbs' shape.)
  const lightTrunk = !farOnly && sh.limbs && sh.trunkNear && trunk;
  const close =
    !farOnly && sh.limbs
      ? [
          { ...trunk, role: "limbs", geometry: sh.limbs },
          ...(sh.cardsClose && cards ? [{ ...cards, role: "cardsClose", geometry: sh.cardsClose }] : []),
          ...(!wears && crown && sh.core ? [{ ...crown, role: "core", geometry: sh.core, nearOnly: false }] : []),
          ...(boughs?.close ?? []),
        ]
      : null;
  if (lightTrunk) Object.assign(trunk, { geometry: sh.trunkNear, nearOnly: true });
  // (Far off - past where its boughs could be loaded - a buried tree in
  // its shape.)
  const far = lowParts(p, wears && !buried ? { ...lo, crown: lo.crownHeart ?? lo.crown, cards: lo.cardsHeart ?? lo.cards } : lo, name).map(([role, geometry, matrix, color, key]) => ({ role, geometry, matrix, color, key }));
  if (lo.cards && !buried) far.push(...boughs?.far ?? []);
  return { near, close, far };
}

// A tree's every part, any detail: near, close up if it has those, and
// far.
function partsOf(t) {
  return t.close ? [...t.near, ...t.close, ...t.far] : [...t.near, ...t.far];
}

// One bark material for every trunk: each trunk's bark (white for a
// birch) is its instance colour; vertex colours carry its marks.
function barkMaterial() {
  return trunkMaterial(new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors: true }));
}

// A trunk's material, either way of drawing them: High's bark, the
// scenery hooks, and see-through as the camera comes up to it (the owner,
// from the ball behind one: "can only see a tree trunk. Need to make the
// trunk translucent" - look/glsl/seethrough.js).
function trunkMaterial(material) {
  material.userData.seeThrough = "trunk";
  const trunk = withSceneryHooks(barkLook(material), "trunk");
  // (Its node version on High, the bark's: glsl/treenode.js. Plain, it's
  // the hooks' alone.)
  return HIGH ? markTwin(trunk, "bark", { tBark: detailTextures().tBark }) : trunk;
}

// The average colour of the leaf cards' textures where there are leaves
// (leafTexture): what a High tree's leaves look like from far off.
export const LEAF_AVERAGE = { leaf: "#87b261", pine: "#7dba6f", oak: "#87b261", birch: "#a4c878", poplar: "#7eaa58", bush: "#8fb868", willowleaf: "#9cb86a", willow: "#9cb86a", plane: "#87b261", chestnut: "#87b261", chestnutwhorl: "#87b261", holly: "#87b261", hawthorn: "#87b261", beech: "#87b261", spruce: "#7dba6f", scots: "#7dba6f", cedar: "#7dba6f" };

// Which leaf picture a kind is drawn with. The far crown is coloured as
// that picture looks from a distance, not as one shared green.
export function leafPicture(kind) {
  return LOOK[KINDS[kind]].texture ?? (TIERED.has(kind) ? "pine" : "leaf");
}

// A High tree's leaf-card colour, from its own (crown) colour: the cards
// look (their colour times the texture's average green) as bright and as
// saturated as they always did, but in the tree's own hue - multiplied
// straight into the green texture, every tree's leaves came out nearly the
// same green, and High's woods were less varied than Standard's. So the
// colour is what, times the texture, gives that look. texture: "leaf" or
// "pine" (LEAF_AVERAGE).
const WHITE_ISH = new THREE.Color(1, 1, 0.95);
const hslOf = { h: 0, s: 0, l: 0 };
export function cardColor(color, texture = "leaf", out = new THREE.Color()) {
  const tex = new THREE.Color(LEAF_AVERAGE[texture] ?? LEAF_AVERAGE.leaf);
  const was = color.clone().lerp(WHITE_ISH, 0.45).multiply(tex);
  was.getHSL(hslOf);
  const { s: sat, l: light } = hslOf;
  color.getHSL(hslOf);
  out.setHSL(hslOf.h, sat, light);
  return out.setRGB(out.r / tex.r, out.g / tex.g, out.b / tex.b);
}

// ---- Pictures of them, for the far woods ---------------------------------------------

// Every kind and shape as it's drawn near, for its picture in the far woods
// (look/treeatlas.js draws each once, from the side): [kind][shape] ->
// [{ geometry, matrix, color, map }], each part as nearParts has it - the
// trunk in its bark's colour, the solid crown just inside its leaf cards
// on High, the cards in their texture, a willow's strands, a shrub's
// blossom - in a colour of its kind's own (TREE_TINTS), each shape its
// own, so the woods vary as a course's trees do. map: the part's texture,
// or null; role: "trunk", "crown", "cards", "strands" or "blossom" (the
// atlas lights a crown's parts as a rounded mass: look/treeatlas.js). The
// colours are what the materials multiply together (their own colour, the
// part's, the texture's), so the picture is the tree.
export function treePictureParts() {
  const geos = shapeGeometry();
  const first = seeded(0xa71a5);
  const more = seeded(0xa71a6);
  const common = seeded(0xa71a7);
  const crownMat = new THREE.Color(HIGH ? 0x9aa890 : 0xdce5d0);
  const none = new THREE.Matrix4();
  return KINDS.map((name, k) =>
    geos[k].map((sh, si) => {
      const rand = streamOf(k, si, [first, more, common], 0xa71b0);
      const tint = treeTint(name, rand);
      const color = HIGH ? tint : tint.clone().offsetHSL(0, 0.1, 0);
      const blossom = treeTint("bush", rand, new THREE.Color(), BLOSSOMS);
      // (A horse chestnut's candles their own cream: randomness of its own.)
      if (k === KIND.chestnut) candleColor(seeded(0xca4d1e + si * 31 + 7), blossom);
      const parts = [{ role: "trunk", geometry: sh.trunk, matrix: none, color: new THREE.Color(PALETTE[LOOK[name].bark]), map: null }];
      // Each shape wearing boughs as a tree does near (BOUGH_LEVELS) - its
      // heart, and a set of its own from a seed of the shape's - so the far
      // woods' trees have the near ones' outlines.
      const wears = EXTRA && BOUGH_KINDS.has(k);
      const picture = leafPictureOf(name, si);
      const boughs = wears ? boughParts({ kind: k, shape: si, matrix: none, seed: hashNumbers([k, si, 0xb0]) }, name, { color: parts[0].color, key: "bark" }, { color: cardColor(color, picture), key: cardKey(picture) }, false).near : [];
      parts.push(...boughs.filter((b) => b.role === "trunk").map((b) => ({ role: "trunk", geometry: b.geometry, matrix: b.matrix, color: b.color, map: null })));
      if (sh.cards) {
        if (name !== "birch") parts.push({ role: "crown", geometry: (wears && sh.core) || sh.crown, matrix: none, color: color.clone().multiplyScalar(crownShade(name)).multiply(crownMat), map: null });
        parts.push({ role: "cards", geometry: (wears && sh.cardsHeart) || sh.cards, matrix: none, color: cardColor(color, picture), map: cardMap(picture) });
        parts.push(...boughs.filter((b) => b.role === "cards").map((b) => ({ role: "cards", geometry: b.geometry, matrix: b.matrix, color: b.color, map: cardMap(picture) })));
        if (sh.strands) parts.push({ role: "strands", geometry: sh.strands, matrix: none, color: color.clone().lerp(new THREE.Color(1, 1, 0.9), 0.4), map: leafTexture("willow") });
        // (A hawthorn's blossom and haws come and go with the season: its
        // picture in the far woods is its leaves.)
        if (sh.blossom && k !== KIND.hawthorn) parts.push({ role: "blossom", geometry: sh.blossom, matrix: none, color: blossom, map: blossomTexture() });
      } else if (sh.crown) parts.push({ role: "crown", geometry: sh.crown, matrix: none, color: color.clone().multiply(crownMat), map: null });
      return parts;
    }),
  );
}

// The old way: one instanced mesh per kind and shape and part.
function instanceTrees(group, placed, geos, look, shadows) {
  const barkMats = new Map();
  const barkOf = (name) => {
    const key = LOOK[name].bark;
    if (!barkMats.has(key)) barkMats.set(key, trunkMaterial(new THREE.MeshLambertMaterial({ color: PALETTE[key], vertexColors: true })));
    return barkMats.get(key);
  };
  const matOf = { crown: look.leafMat, ...look.cardMats };
  for (let k = 0; k < KINDS.length; k++) {
    const name = KINDS[k];
    for (let si = 0; si < geos[k].length; si++) {
      // (Those in flower and those not - a horse chestnut's candles - apart:
      // each mesh's trees all have the same parts.)
      for (const inFlower of [true, false]) {
        const mine = placed.filter((p) => p.kind === k && p.shape === si && (p.flowers !== false) === inFlower);
        if (!mine.length) continue;
        const sh = geos[k][si];
        const lists = mine.map((p) => nearParts(p, sh, name));
        lists[0].forEach(([role, geometry, , , key], j) => {
          const mesh = new THREE.InstancedMesh(geometry, role === "trunk" ? barkOf(name) : matOf[key], mine.length);
          mesh.userData.role = role;
          mesh.userData.kind = name;
          lists.forEach((parts, i) => {
            const [, , matrix, color] = parts[j];
            mesh.setMatrixAt(i, matrix);
            if (role !== "trunk") mesh.setColorAt(i, color);
          });
          if (role === "trunk") mesh.userData.trunk = true;
          if (role === "blossom") mesh.userData.blossom = true;
          mesh.castShadow = shadows && role !== "blossom";
          group.add(mesh);
        });
      }
    }
  }
}

// Every piece of every tree as drawn: { role ("trunk", "crown", "cards",
// "strands", "blossom" or "far"), tree (its index), kind (its name),
// geometry, matrix, colour, visible }, for either way of drawing them -
// for the tests, and anything that needs to know what's drawn where.
export function treeParts(group) {
  const out = [];
  const detail = group.userData.detail;
  if (detail) {
    detail.trees.forEach((t, tree) => {
      for (const part of partsOf(t)) {
        out.push({ role: part.role, tree, kind: KINDS[detail.placed[tree].kind], geometry: part.geometry, matrix: part.mesh.getMatrixAt(part.id, new THREE.Matrix4()), color: part.mesh.getColorAt(part.id, new THREE.Color()), visible: part.mesh.getVisibleAt(part.id), nearOnly: !!part.nearOnly, mesh: part.mesh, id: part.id });
      }
    });
    return out;
  }
  for (const mesh of group.children) {
    if (!mesh.isInstancedMesh) continue;
    for (let i = 0; i < mesh.count; i++) {
      const color = new THREE.Color();
      if (mesh.instanceColor) mesh.getColorAt(i, color);
      else color.copy(mesh.material.color);
      out.push({ role: mesh.userData.role, kind: mesh.userData.kind, geometry: mesh.geometry, matrix: mesh.getMatrixAt(i, new THREE.Matrix4()), color, visible: true, mesh, id: i });
    }
  }
  return out;
}

// ---- Near and far ------------------------------------------------------------------

// Every group of batched trees built (and not yet thrown away), so the frame
// can decide near and far for the scene it's drawing.
const details = new Set();

// A hole's trees let go of (course/holebuild.js disposeWorld, for each of
// the hole's objects): no longer kept for the safety valve's steps, or for
// near and far. (Each hole's neighbouring trees were kept for good: a few
// MB a hole on Ultra, every hole played - the owner's report, 20 October
// 2026.)
export function forgetTrees(object) {
  neighbourGroups.delete(object);
  const d = object.userData?.detail;
  if (d) details.delete(d);
}

// Which of a group's trees are drawn far: decided by sim/treelod.mjs, and
// shown by hiding one set of instances and showing the other - visibility
// only, never a buffer rebuilt.
class TreeDetail {
  constructor(group, placed, trees, front = null, own = null) {
    this.group = group;
    // The hole's front row (sim/treelod.mjs frontRow): close up from further off.
    this.front = front;
    // The hole in play's own trees (not its backdrop): at their best
    // wherever they are, on Ultra (sim/treelod.mjs HOLE_TOP).
    this.own = own;
    this.placed = placed;
    this.trees = trees;
    this.centres = new Float32Array(placed.length * 2);
    placed.forEach((p, i) => {
      this.centres[i * 2] = p.crown.x;
      this.centres[i * 2 + 1] = p.crown.z;
    });
    this.far = new Uint8Array(placed.length);
    // Which are close up (only those with close-up parts).
    this.close = new Uint8Array(placed.length);
    this.hasClose = trees.some((t) => t.close);
    // Which are buried in a wood (sim/treelod.mjs buriedTrees), and of
    // those which wear their boughs further off: the camera's going near.
    this.buried = Uint8Array.from(placed, (p) => (p.buried ? 1 : 0));
    this.boughs = new Uint8Array(placed.length);
    this.hasBuried = this.buried.some((b) => b);
    this.plan = null;
    this.decided = false;
    details.add(this);
  }

  // Near or far for each tree, for a camera at [x, z] and a plan (a path
  // of [x, z] points) or none - and, with `closeToo` (a cut or a planned
  // move starting), which are close up, from `stand` (where the player
  // stands: the ball at address; else the camera). Returns how many
  // changed.
  decide(camera, plan, closeToo = true, stand = camera, look = null) {
    const top = this.own && holeTop() ? this.own : null;
    const changed = new Set(chooseFar(this.centres, pathsFor(camera, plan), this.far, { distance: nearInCrop() ? Infinity : farFrom, never: top }));
    if (this.hasClose && closeToo) for (const i of chooseClose(this.centres, stand, this.close, { distance: closeFrom(), front: this.front, frontDistance: frontFrom(), max: frontMax(), always: top, ahead: look ? { dir: look } : null })) changed.add(i);
    // (A buried tree's boughs as its close-ups are: at a cut or as a planned
    // move starts - the shot's likely flights at address, its flight as
    // it's struck - so they're there before the ball is.)
    if (this.hasBuried && closeToo) for (const i of chooseBoughs(this.centres, pathsFor(camera, plan), this.buried, this.boughs)) changed.add(i);
    const meshes = new Set();
    for (const i of changed) {
      const t = this.trees[i];
      const now = { far: this.far[i] === 1, close: !!t.close && this.close[i] === 1, boughs: this.boughs[i] === 1 };
      for (const part of partsOf(t)) {
        part.mesh.setVisibleAt(part.id, partShown(part.role, now, part));
        meshes.add(part.mesh);
      }
    }
    // The shadow map is drawn again for it (look/shadowwatch.js).
    for (const m of meshes) m.userData.shadowVersion = (m.userData.shadowVersion ?? 0) + 1;
    this.decided = true;
    return changed.size;
  }
}

// Once a frame, before the scene is drawn: decides near and far for its
// trees when it's time (sim/treelod.mjs shouldDecide) - at a cut, when a
// planned move starts (plan: the new path, world [x, z] points; a new
// array for a new move), or when the camera has come too close to a far
// tree. stand: where the player stands ([x, z] world: the ball at address,
// kept through its shot), for which trees are close up - null for the
// camera's own place. Returns how many trees changed.
export function updateTreeDetail(scene, camera, { cut = false, plan = null, stand = null } = {}) {
  let changed = 0;
  const at = [camera.position.x, camera.position.z];
  // The way it looks, level - for which trees are behind the player
  // (sim/treelod.mjs CLOSE_BEHIND); none looking steeply down (a view from
  // above sees all round).
  // (From its turn as it is now - its matrix is last frame's at a cut.)
  const q = camera.quaternion;
  const fwd = q ? [-2 * (q.x * q.z + q.w * q.y), -(1 - 2 * (q.x * q.x + q.y * q.y))] : null;
  const look = fwd && Math.hypot(fwd[0], fwd[1]) > 0.5 ? fwd : null;
  for (const d of details) {
    let root = d.group;
    while (root.parent) root = root.parent;
    // Out of its scene - the hole just played kept for a replay, or one
    // built ahead and not on show yet - left as it is till it's back. (A
    // hole thrown away is forgotten as it's let go of: forgetTrees. Once
    // forgotten here, a kept hole shown again never changed its trees.)
    if (!root.isScene) continue;
    if (root !== scene) continue;
    const newPlan = plan !== d.plan;
    d.plan = plan;
    const tooClose = farTooClose(d.centres, d.far, at[0], at[1], { distance: farFrom });
    // (Close-ups only at a cut or a new plan: a camera merely come near a
    // far tree changes no close-up while it's watched.)
    if (shouldDecide({ cut: cut || !d.decided, newPlan, tooClose })) changed += d.decide(at, plan, cut || !d.decided || newPlan, stand ?? at, look);
  }
  return changed;
}
