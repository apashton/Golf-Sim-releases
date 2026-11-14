// Cart paths in 3D: a narrow strip of asphalt, concrete or gravel along the
// path's line (sim/paths.mjs pathLine - the same line play and the maps
// use), crowned a few centimetres over the grass, with low kerbs whose
// feet tuck into the turf so no seam shows, and on the higher graphics
// setting a band of worn, drier grass either side, so the path sits in
// the grass rather than on it.
//
// Nothing here flickers into the grass from far away: the path stands a few
// centimetres proud and has its own drawing layer (look/grass.js LAYER.path),
// above the fairway, tees and fringes; sim/paths.mjs keeps it off greens,
// sand and water.
//
// Colours are the palette's (look/palette.js). The detail - tyre-polished
// bands, patched repairs, the stones in asphalt and gravel, a concrete
// path's joints - is worked out in the shader, and on the higher setting a
// drawn surface (look/textures.js) adds the stones, pores and gravel with
// their bumps; all of it fades out as it gets smaller than a pixel, so it
// never shimmers on a projector.
// After rain a path is darker, with a sheen of the sky, and on the higher
// setting puddles (look/glsl/ground.js gWet).
// The lower graphics setting keeps the same strip and colours, without the
// fine grain, the brush marks, the puddles or the worn verge.

import * as THREE from "three";
import { NOISE, onLayer, LAYER } from "./grass.js";
import { ribbon } from "./ribbon.js";
import { PALETTE } from "./palette.js";
import { HIGH, ULTRA } from "./quality.js";

// How much the drawn stones and gravel tilt the light: twice as much on
// Ultra, so a path close by has real texture.
const RELIEF = ULTRA ? "1.2" : "0.6";
import { detailTextures, LEAN_UV } from "./textures.js";
import { withSceneryHooks } from "./glsl/hooks.js";
import { markTwin } from "./twins.js";
import { groundUniforms } from "./glsl/ground.js";
import { PATH_WIDTH, KERB, pathLine } from "../sim/paths.mjs";
import { drawnLines, finerNear, sunkUnder, openOver, drawnGap, JOIN, DRAWN } from "../sim/pathjoin.mjs";
import { vergeProfile } from "../sim/wear.mjs";
import { vergeGeometry, vergeMaterial } from "./wear.js";
import { bridgeSpans } from "../sim/bridges.mjs";
import { makeBridge } from "./bridges.js";

// A free end of a path (one that meets no other: sim/pathjoin.mjs head,
// tail) - not a rounded end with its kerb curled round it (the owner, 3
// November 2026: "do away with the rounded path end and have more of a
// gravel fade in/out to grass end wherever there is an end"): the strip
// runs on `past` metres beyond the line's end, and over its last few metres
// the tarmac breaks up into loose gravel (`gravel`: all gravel nearer the
// tip than the first, all tarmac past the second), its kerbs sink away
// (`kerb`, and laid down to the ground's level over `lift`), and the gravel
// thins out into the grass over the last `scatter` metres, a ragged edge
// that comes `taper` metres further back at its sides than its middle,
// where the carts run on. Metres from the tip (the rEnd attribute); none of
// it further than `reach` (past the rest, give or take the ragged edge).
export const END = { past: DRAWN.past, scatter: 1.8, gravel: [1.6, 4.5], kerb: [2.2, 4.5], lift: [1, 4.5], taper: 0.7, reach: 6.5, far: 99 };

// The strip across, from left to right: kerb foot (down in the grass), kerb
// top, the path's edge, its crown, and the same on the right. Heights are
// over the ground, metres.
const KERBED = (half) => [
  { off: -(half + 0.14), lift: -0.03 },
  { off: -(half + 0.02), lift: 0.06 },
  { off: -(half - 0.06), lift: 0.045 },
  { off: 0, lift: 0.05 },
  { off: half - 0.06, lift: 0.045 },
  { off: half + 0.02, lift: 0.06 },
  { off: half + 0.14, lift: -0.03 },
];
// Gravel has no kerb: its edge is scattered stones fraying into the grass.
const LOOSE = (half) => [
  { off: -(half + 0.12), lift: 0.004 },
  { off: -(half - 0.2), lift: 0.03 },
  { off: 0, lift: 0.035 },
  { off: half - 0.2, lift: 0.03 },
  { off: half + 0.12, lift: 0.004 },
];

// One material per kind and width of path, for the whole page (they share
// one shader).
const materials = new Map();
export function pathMaterial(m = 0, half = PATH_WIDTH / 2) {
  const kind = [0, 1, 2].includes(m) ? m : 0;
  const key = `${kind}:${half.toFixed(2)}`;
  if (materials.has(key)) return materials.get(key);
  const material = onLayer(new THREE.MeshLambertMaterial({ color: 0xffffff }), LAYER.path);
  const base = [PALETTE.path, PALETTE.pathConcrete, PALETTE.pathGravel][kind];
  const uniforms = {
    rBase: { value: new THREE.Color(base) },
    rKerb: { value: new THREE.Color(PALETTE.pathEdge) },
    // What a free end breaks up into (END).
    rGravel: { value: new THREE.Color(PALETTE.pathGravel) },
    rHalf: { value: half },
    // How wet the ground is (look/glsl/ground.js: shared, set once a frame).
    gWet: groundUniforms.gWet,
    rSheen: { value: new THREE.Color(PALETTE.skyHorizon) },
    // High: the drawn asphalt, concrete or gravel (look/textures.js, shared).
    ...(HIGH ? { tBuilt: detailTextures().tBuilt } : {}),
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        attribute float rAcross;
        attribute float rAlong;
        attribute float rOpen;
        attribute float rEnd;
        varying float vAcross;
        varying float vAlong;
        varying float vOpen;
        varying float vEnd;
        varying vec3 rWorld;`,
      )
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
        vAcross = rAcross;
        vAlong = rAlong;
        vOpen = rOpen;
        vEnd = rEnd;
        rWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        #define PATH_KIND ${kind}
        ${HIGH ? "#define BUILT_FINE" : ""}
        uniform vec3 rBase;
        uniform vec3 rKerb;
        uniform vec3 rGravel;
        uniform float rHalf;
        uniform float gWet;
        uniform vec3 rSheen;
        varying float vAcross;
        varying float vAlong;
        varying float vOpen;
        varying float vEnd;
        varying vec3 rWorld;
        ${HIGH ? `#define PATH_TEX\nuniform sampler2DArray tBuilt;\nvec2 pLean = vec2(0.0);\n${LEAN_UV}` : ""}
        ${NOISE}`,
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        {
          vec2 w = rWorld.xz;
          float a = abs(vAcross);
          // How many pixels a centimetre covers here: fine detail fades out
          // once it's smaller than that.
          float px = fwidth(w.x) + fwidth(w.y);
          vec3 col = rBase;
          // Broad weathering: lighter and darker patches a few metres across.
          col *= 0.93 + 0.14 * gFbm(w * 0.22 + 7.0);
          #if PATH_KIND == 0
            // Asphalt: two paler bands polished by tyres, and here and there
            // a darker patched repair.
            float band = exp(-pow((a - 0.55) / 0.22, 2.0));
            col *= 1.0 + 0.08 * band;
            float repair = smoothstep(0.66, 0.7, gNoise(w * 0.11 + 3.0));
            col *= 1.0 - 0.1 * repair;
            #if defined(BUILT_FINE) && !defined(PATH_TEX)
              // The stones in it, close up (the drawn surface has its own).
              float grain = gHash(floor(w * 45.0));
              col *= 1.0 + (grain - 0.5) * 0.16 * (1.0 - smoothstep(0.015, 0.05, px));
            #endif
          #elif PATH_KIND == 1
            // Concrete: a joint across it every three metres.
            float j = abs(fract(vAlong / 3.0 + 0.5) - 0.5) * 3.0;
            float jw = max(fwidth(vAlong) * 1.2, 0.012);
            col *= 1.0 - 0.28 * (1.0 - smoothstep(jw * 0.5, jw * 1.5, j)) * (1.0 - smoothstep(0.08, 0.3, px));
            #ifdef BUILT_FINE
              // Faint brush marks across it.
              float brush = gNoise(vec2(vAlong * 40.0, vAcross * 1.5));
              col *= 1.0 + (brush - 0.5) * 0.06 * (1.0 - smoothstep(0.01, 0.04, px));
            #endif
          #else
            // Gravel: stones of every shade, thinning out into the grass
            // at a ragged edge.
            float stones = gHash(floor(w * 22.0));
            #if defined(BUILT_FINE) && !defined(PATH_TEX)
              col *= 1.0 + (stones - 0.5) * 0.3 * (1.0 - smoothstep(0.03, 0.09, px));
            #endif
            col *= 0.95 + 0.1 * gNoise(w * 3.0);
            float fray = rHalf - 0.1 + 0.22 * gNoise(w * 2.3) + 0.08 * (stones - 0.5);
            // (Not where another path runs on from beneath it: one surface.)
            if (a > fray + vOpen * 4.0) discard;
          #endif
          // A free end (END): the tarmac breaks up into loose gravel, its
          // edges fraying as gravel's do, and the gravel thins out into the
          // grass past the line's end - a ragged edge, never a rounded end.
          float loose = 0.0;
          float tip = ${END.far.toFixed(1)};
          if (vEnd < ${END.reach.toFixed(1)}) {
            tip = vEnd + 1.1 * (gNoise(w * 1.3 + 5.0) - 0.5) + 0.4 * (gNoise(w * 4.1 + 2.0) - 0.5) - ${END.taper.toFixed(2)} * (a / rHalf) * (a / rHalf);
            float stone = gHash(floor(w * 22.0));
            // (Single stones only close up: further off, a smooth ragged
            // edge, never a speckle of squares.)
            float grain = mix(0.5, stone, 1.0 - smoothstep(0.008, 0.025, px));
            if (grain > smoothstep(0.0, ${END.scatter.toFixed(2)}, tip)) discard;
            #if PATH_KIND != 2
              loose = 1.0 - smoothstep(${END.gravel[0].toFixed(2)}, ${END.gravel[1].toFixed(2)}, tip);
              vec3 gravel = rGravel * (0.84 + 0.1 * gNoise(w * 3.0));
              #if defined(BUILT_FINE) && !defined(PATH_TEX)
                gravel *= 1.0 + (stone - 0.5) * 0.3 * (1.0 - smoothstep(0.03, 0.09, px));
              #endif
              col = mix(col, gravel, loose);
              float frayEnd = rHalf - 0.1 + 0.22 * gNoise(w * 2.3) + 0.08 * (stone - 0.5);
              if (a > mix(rHalf + 0.3, frayEnd, loose)) discard;
            #endif
          }
          #ifdef PATH_TEX
          {
            // The drawn surface (a metre a tile, laid along the path, so a
            // concrete path's brush marks run across it), fading out before
            // it would shimmer, and leaning for the light.
            float k = 1.0 - smoothstep(0.008, 0.06, px);
            vec3 t = texture(tBuilt, vec3(vAcross, vAlong, float(PATH_KIND))).rgb;
            float amount = PATH_KIND == 0 ? 0.8 : PATH_KIND == 1 ? 0.55 : 0.95;
            #if PATH_KIND != 2
              // (Gravel's own at a free end.)
              if (loose > 0.0) {
                t = mix(t, texture(tBuilt, vec3(vAcross, vAlong, 2.0)).rgb, loose);
                amount = mix(amount, 0.95, loose);
              }
            #endif
            col *= mix(1.0, 0.45 + 0.75 * t.r, k * amount);
            pLean = vec2(t.g * 2.0 - 1.0, 1.0 - t.b * 2.0) * k * amount;
          }
          #endif
          #if PATH_KIND != 2
            // The kerbs: concrete, a shade off the path, never white; its
            // outer face a touch darker where the grass shades it.
            // None where another path runs on from beneath it (sim/
            // pathjoin.mjs: the kerb laid flat there, as tarmac).
            // Sinking away at a free end (END).
            float kerb = smoothstep(rHalf - 0.05, rHalf - 0.03, a) * (1.0 - vOpen) * smoothstep(${END.kerb[0].toFixed(2)}, ${END.kerb[1].toFixed(2)}, tip);
            vec3 k = rKerb * (0.95 + 0.1 * gNoise(w * 1.3 + 11.0));
            k *= 1.0 - 0.18 * smoothstep(rHalf + 0.04, rHalf + 0.13, a);
            col = mix(col, k, kerb);
          #endif
          if (gWet > 0.0) {
            // After rain: darker, and a sheen of the sky low down the
            // view; on High, puddles in the middle of a kerbed path -
            // darker still and showing more of the sky, never black.
            vec3 toEye = normalize(cameraPosition - rWorld);
            float sheen = pow(1.0 - clamp(toEye.y, 0.0, 1.0), 4.0);
            col *= 1.0 - 0.28 * gWet;
            float pool = 0.0;
            #if defined(BUILT_FINE) && PATH_KIND != 2
              pool = smoothstep(0.6, 0.68, gNoise(w * 0.45 + 19.0)) * (1.0 - smoothstep(rHalf - 0.35, rHalf - 0.15, a)) * gWet * (1.0 - loose);
              col *= 1.0 - 0.3 * pool;
            #endif
            col = mix(col, rSheen, clamp(sheen * (0.25 + 0.45 * pool) * gWet, 0.0, 0.6));
          }
          diffuseColor.rgb *= col;
        }`,
      )
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>${HIGH ? `\nnormal = leanUv(normal, vViewPosition, vec2(vAcross, vAlong), pLean, ${RELIEF});` : ""}`);
  };
  material.customProgramCacheKey = () => `path-v6-${kind}-${ULTRA ? "u" : HIGH ? "h" : "s"}`;
  withSceneryHooks(material, "path");
  // (Its node version, on WebGPURenderer: glsl/pathnode.js.)
  markTwin(material, "path", { uniforms, kind, high: HIGH, relief: Number(RELIEF), end: END });
  materials.set(key, material);
  return material;
}

// A hole's cart paths as one group: every path drawn on it - its own, those
// between holes and the next hole's (course/holescenery.js addPaths), in
// the hole's frame - so those that meet join as one (sim/pathjoin.mjs). L:
// the layout (with its edits laid on) and those paths; heightAt(wx, wz):
// the ground in world terms that the path is laid on; `step`: how far apart
// the points along it are (closer on real ground, to follow it);
// keepVerge(x, z) (hole frame): whether worn grass shows there (not on a
// fairway or tee a path crosses).
// wet(x, z), waterAt(x, z) (hole frame): whether it's water there, and the
// water's height - where a path crosses water it goes over on a bridge
// (sim/bridges.mjs, look/bridges.js), its asphalt stopping where the
// bridge's timber starts.
// under(x, z) (hole frame): where a tee box is - the tee drawn on top
// there: nothing of a path (no path is made or moved onto one, but one
// from before might lie there).
export function makePaths(L, heightAt, { step = 1, keepVerge = () => true, wet = null, waterAt = () => null, under = null } = {}) {
  const group = new THREE.Group();
  // Paths meeting end to end are one path, one strip (chainPaths). Where
  // one runs into another's side, the widest is over the narrower, which
  // sinks under it there with no end of its own; its kerb opens where the
  // other runs on from beneath it. Each strip's line as the grass keeps off
  // it (sim/pathjoin.mjs drawnLines: its kinks taken out and its tight
  // bends eased, so its inner edge doesn't fold over; a free end run on
  // into the grass).
  const { chains, plan, lines } = drawnLines(L.paths, { step });
  chains.forEach((chain, i) => {
    const { half, head, tail } = plan.entries[i];
    const m = [0, 1, 2].includes(chain.m) ? chain.m : 0;
    const drawn = lines[i];
    const line = finerNear(plan, i, drawn);
    const columns = m === 2 ? LOOSE(half) : KERBED(half);
    const geo = ribbon(line, columns, heightAt);
    endRibbon(geo, columns, half, head, tail);
    joinRibbon(geo, columns, plan, i, heightAt, half);
    if (under) dropWhere(geo, (wx, wz) => under(-wz, wx));
    // Over water, a bridge - each part of a joined path its own - the strip
    // stopping where its deck starts.
    if (wet) {
      for (const part of chain.parts) {
        const spans = bridgeSpans(part, wet);
        if (!spans.length) continue;
        const deck = onDeck(part, spans);
        dropWhere(geo, (wx, wz) => deck(-wz, wx));
        for (const b of spans) group.add(makeBridge(part, b, heightAt, waterAt));
      }
    }
    const mesh = new THREE.Mesh(geo, pathMaterial(m, half));
    mesh.receiveShadow = true;
    group.add(mesh);
    if (HIGH) {
      // The verge: worn, browner grass from just outside the kerb's foot,
      // fading away (grass.js edge material: 1 solid, 0 gone) - never
      // quite solid, so it reads as grass worn thin rather than a stripe
      // painted along the path. How far out it reaches changes along the
      // path (sim/wear.mjs vergeProfile): wider where carts pull on and
      // off near its ends, wandering between, each side its own. It fades
      // away - never cut off square - where the path crosses a fairway or
      // tee, passes another path or fades out at its end (fadeVerge).
      for (const side of [-1, 1]) {
        const widths = vergeProfile(drawn, (i + 1) * 97 + (side > 0 ? 13 : 0)).map((f) => 0.7 * f);
        const g = vergeGeometry(drawn, half + 0.1, widths, side, heightAt);
        fadeVerge(g, drawn, head, tail, (x, z) => keepVerge(x, z) && !under?.(x, z), (x, z) => drawnGap(plan, x, z, { skip: i }));
        if (!g.index.count) continue;
        const v = new THREE.Mesh(g, vergeMaterial());
        v.renderOrder = -10 + LAYER.verge;
        v.receiveShadow = true;
        group.add(v);
      }
    }
  });
  return group;
}

// Whether (x, z) (hole frame) is on the deck of one of a path's bridges
// (sim/bridges.mjs bridgeSpans) - along it from just past where the timber
// starts to just short of where it ends, and within its reach across.
function onDeck(path, spans) {
  const { pts, cum } = pathLine(path);
  const reach = (path.w ?? PATH_WIDTH) / 2 + 0.6;
  const near = spans.map((b) => {
    const ks = [];
    for (let k = 1; k < pts.length; k++) if (cum[k] >= b.from - 1 && cum[k - 1] <= b.to + 1) ks.push(k);
    return { b, ks };
  });
  return (x, z) => {
    for (const { b, ks } of near) {
      let best = Infinity;
      let s = 0;
      for (const k of ks) {
        const [ax, az] = pts[k - 1];
        const dx = pts[k][0] - ax;
        const dz = pts[k][1] - az;
        const l2 = dx * dx + dz * dz || 1;
        const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
        const d = Math.hypot(x - ax - dx * t, z - az - dz * t);
        if (d < best) {
          best = d;
          s = cum[k - 1] + (cum[k] - cum[k - 1]) * t;
        }
      }
      if (best < reach && s > b.from + 0.05 && s < b.to - 0.05) return true;
    }
    return false;
  };
}

// How far each point of a strip (its rAlong) is from a free end's tip,
// metres (END.far where it has none near).
function fromTips(along, head, tail) {
  let total = 0;
  for (let j = 0; j < along.count; j++) total = Math.max(total, along.getX(j));
  return (j) => Math.min(END.far, head ? along.getX(j) : END.far, tail ? total - along.getX(j) : END.far);
}

// A path's strip at its free ends (END): how far each point is from the
// tip (rEnd, for the shader), and its kerbs and crown laid down to a few
// centimetres over the ground there, as loose gravel lies.
function endRibbon(geo, columns, half, head, tail) {
  const pos = geo.attributes.position;
  const cols = columns.length;
  const end = new Float32Array(pos.count).fill(END.far);
  geo.setAttribute("rEnd", new THREE.BufferAttribute(end, 1));
  if (!(head || tail)) return;
  const tip = fromTips(geo.attributes.rAlong, head, tail);
  let changed = false;
  for (let j = 0; j < pos.count; j++) {
    const e = tip(j);
    end[j] = e;
    if (e >= END.lift[1]) continue;
    const c = columns[j % cols];
    const t = smoothstepJS(END.lift[0], END.lift[1], e);
    // (Its kerb's foot level with the grass, its top and crown just over.)
    const flat = Math.abs(c.off) > half + 0.1 ? 0 : Math.abs(c.off) > half ? 0.01 : 0.02;
    pos.setY(j, pos.getY(j) + (flat - c.lift) * (1 - t));
    changed = true;
  }
  if (changed) {
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }
}

const smoothstepJS = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// A verge (look/wear.js vergeGeometry along `line`, four columns across)
// faded away rather than cut off: to nothing over a couple of metres where
// it leaves the grass it's kept to (keep(x, z), hole frame - not a fairway,
// tee or tee box), within a little of another path (gap(x, z): metres from
// its edge) and towards a free end's tip. Triangles faded right out are
// left out.
function fadeVerge(geo, line, head, tail, keep, gap) {
  const pos = geo.attributes.position;
  const edge = geo.attributes.gEdgeIn;
  const cols = 4;
  const n = line.length;
  const kept = new Float32Array(pos.count);
  for (let j = 0; j < pos.count; j++) kept[j] = keep(-pos.getZ(j), pos.getX(j)) ? 1 : 0;
  // From the tips: the verge's points are the line's, a column each across.
  let total = 0;
  const along = line.map((p, i) => (i ? (total += Math.hypot(p[0] - line[i - 1][0], p[1] - line[i - 1][1])) : 0));
  const weight = new Float32Array(pos.count);
  for (let i = 0; i < n; i++) {
    const e = Math.min(head ? along[i] : END.far, tail ? total - along[i] : END.far);
    const atEnd = smoothstepJS(0.3, END.lift[1], e);
    for (let k = 0; k < cols; k++) {
      const j = i * cols + k;
      // Kept, averaged over a couple of metres along it and across.
      let sum = 0;
      let count = 0;
      for (let di = -3; di <= 3; di++) {
        const ii = i + di;
        if (ii < 0 || ii >= n) continue;
        for (let dk = -1; dk <= 1; dk++) {
          const kk = k + dk;
          if (kk < 0 || kk >= cols) continue;
          sum += kept[ii * cols + kk];
          count++;
        }
      }
      const g = gap(-pos.getZ(j), pos.getX(j));
      const clear = g === Infinity ? 1 : smoothstepJS(KERB, KERB + 0.6, g);
      // (A point that isn't kept is gone, whatever's round it.)
      weight[j] = kept[j] * (sum / count) * clear * atEnd;
    }
  }
  for (let j = 0; j < pos.count; j++) edge.setX(j, edge.getX(j) * weight[j]);
  edge.needsUpdate = true;
  const index = geo.index.array;
  const out = [];
  for (let t = 0; t < index.length; t += 3) if (weight[index[t]] > 0.01 || weight[index[t + 1]] > 0.01 || weight[index[t + 2]] > 0.01) out.push(index[t], index[t + 1], index[t + 2]);
  geo.setIndex(out);
}

// Path i's strip joined to the others of the plan (sim/pathjoin.mjs): sunk
// under a path over it (and left out well inside it), its kerb laid flat
// where a path under it runs on (rOpen: the shader draws it as tarmac).
// columns: its cross-section (KERBED or LOOSE).
function joinRibbon(geo, columns, plan, i, base, half) {
  const pos = geo.attributes.position;
  const cols = columns.length;
  const open = new Float32Array(pos.count);
  // The height the kerb's laid flat to: the strip's own at its edge.
  const flat = columns.length === 7 ? columns[2].lift : columns[1].lift;
  const deep = new Uint8Array(pos.count);
  let changed = false;
  for (let j = 0; j < pos.count; j++) {
    const wx = pos.getX(j);
    const wz = pos.getZ(j);
    const x = -wz;
    const z = wx;
    const c = columns[j % cols];
    const edge = Math.abs(c.off) > half;
    if (sunkUnder(plan, i, x, z)) {
      // Its tarmac just under the other's (no step to catch the light
      // where they meet), its edges and kerbs right down under the other's
      // kerb.
      const y = base(wx, wz) + (edge ? JOIN.deep : JOIN.sunk);
      if (pos.getY(j) > y) pos.setY(j, y);
      deep[j] = drawnGap(plan, x, z, { to: i }) < -0.3 ? 1 : 0;
      changed = true;
      continue;
    }
    if (!edge) continue;
    const o = openOver(plan, i, x, z);
    if (o <= 0) continue;
    open[j] = o;
    pos.setY(j, pos.getY(j) + (flat - c.lift) * o);
    changed = true;
  }
  geo.setAttribute("rOpen", new THREE.BufferAttribute(open, 1));
  if (!changed) return;
  // (Wholly inside the path over it: left out.)
  const index = geo.index.array;
  const keep = [];
  for (let t = 0; t < index.length; t += 3) if (!(deep[index[t]] && deep[index[t + 1]] && deep[index[t + 2]])) keep.push(index[t], index[t + 1], index[t + 2]);
  geo.setIndex(keep);
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

// Leaves out the triangles whose middle is where `off(wx, wz)` says.
function dropWhere(geo, off) {
  const pos = geo.attributes.position;
  const index = geo.index.array;
  const keep = [];
  for (let i = 0; i < index.length; i += 3) {
    const [a, b, c] = [index[i], index[i + 1], index[i + 2]];
    const mx = (pos.getX(a) + pos.getX(b) + pos.getX(c)) / 3;
    const mz = (pos.getZ(a) + pos.getZ(b) + pos.getZ(c)) / 3;
    if (!off(mx, mz)) keep.push(a, b, c);
  }
  geo.setIndex(keep);
}
