// A cart path (look/paths.js pathMaterial) as a node material, for
// WebGPURenderer (look/nodetwins.js): the same sums - broad weathering;
// asphalt's tyre-polished bands, patched repairs and stones close up,
// concrete's joints every three metres and its brush marks, gravel's
// stones thinning out into the grass at a ragged edge; on High the drawn
// surface (its texture by kind, leaning for the light); the kerbs; a free
// end breaking up into gravel that thins out into the grass; and after
// rain darker, with a sheen of the sky low down the view and, on
// High, puddles down the middle of a kerbed path.

import { MeshLambertNodeMaterial } from "three/webgpu";
import { abs, attribute, cameraPosition, clamp, cross, dFdx, dFdy, dot, exp, float, floor, fract, fwidth, inverseSqrt, materialColor, max, mix, normalViewGeometry, normalize, positionView, positionWorld, pow, reference, select, smoothstep, texture, vec2, vec3, vec4 } from "three/tsl";
import { gFbm, gHash, gNoise, gWet } from "./groundnode.js";
import { applyNodeHooks } from "./nodehooks.js";

export const PATH_NODE_KEY = "pn3";

// uniforms: the WebGL material's (rBase, rKerb, rGravel, rHalf, rSheen,
// tBuilt on High); kind: 0 asphalt, 1 concrete, 2 gravel; high: High's
// detail; relief: how far the drawn surface leans the light (paths.js
// RELIEF); end: how a free end fades out (paths.js END).
export function pathNodeMaterial({ uniforms: u, kind = 0, high = false, relief = 1, end: E = null }, base = null) {
  const material = base ?? new MeshLambertNodeMaterial();
  material.userData = { ...material.userData };
  const U = (name, type) => reference("value", type, u[name]);
  const half = U("rHalf", "float");
  const across = attribute("rAcross", "float");
  const along = attribute("rAlong", "float");
  // (Where another path runs on from beneath it: its kerb laid flat and
  // drawn as tarmac - sim/pathjoin.mjs.)
  const open = attribute("rOpen", "float");
  // (How far from a free end's tip: paths.js END.)
  const fromTip = attribute("rEnd", "float");
  const w = positionWorld.xz;
  const a = abs(across);
  const px = fwidth(w.x).add(fwidth(w.y));
  let col = U("rBase", "color").mul(float(0.93).add(gFbm(w.mul(0.22).add(7)).mul(0.14)));
  const tex = high && u.tBuilt;
  let mask = null;
  if (kind === 0) {
    const band = exp(pow(a.sub(0.55).div(0.22), 2).negate());
    col = col.mul(band.mul(0.08).add(1)).mul(float(1).sub(smoothstep(0.66, 0.7, gNoise(w.mul(0.11).add(3))).mul(0.1)));
    if (high && !tex) col = col.mul(float(1).add(gHash(floor(w.mul(45))).sub(0.5).mul(0.16).mul(float(1).sub(smoothstep(0.015, 0.05, px)))));
  } else if (kind === 1) {
    const j = abs(fract(along.div(3).add(0.5)).sub(0.5)).mul(3);
    const jw = max(fwidth(along).mul(1.2), 0.012);
    col = col.mul(float(1).sub(float(1).sub(smoothstep(jw.mul(0.5), jw.mul(1.5), j)).mul(float(1).sub(smoothstep(0.08, 0.3, px))).mul(0.28)));
    if (high) col = col.mul(float(1).add(gNoise(vec2(along.mul(40), across.mul(1.5))).sub(0.5).mul(0.06).mul(float(1).sub(smoothstep(0.01, 0.04, px)))));
  } else {
    const stones = gHash(floor(w.mul(22)));
    if (high && !tex) col = col.mul(float(1).add(stones.sub(0.5).mul(0.3).mul(float(1).sub(smoothstep(0.03, 0.09, px)))));
    col = col.mul(float(0.95).add(gNoise(w.mul(3)).mul(0.1)));
    const fray = half.sub(0.1).add(gNoise(w.mul(2.3)).mul(0.22)).add(stones.sub(0.5).mul(0.08));
    mask = a.lessThanEqual(fray.add(open.mul(4)));
  }
  // A free end: the tarmac breaks up into loose gravel, its edges fraying
  // as gravel's do, and the gravel thins out into the grass past the
  // line's end.
  let loose = float(0);
  let tip = float(99);
  if (E) {
    tip = fromTip.add(gNoise(w.mul(1.3).add(5)).sub(0.5).mul(1.1)).add(gNoise(w.mul(4.1).add(2)).sub(0.5).mul(0.4)).sub(a.div(half).pow(2).mul(E.taper));
    const stone = gHash(floor(w.mul(22)));
    const grain = mix(float(0.5), stone, float(1).sub(smoothstep(0.008, 0.025, px)));
    let keep = grain.lessThanEqual(smoothstep(0, E.scatter, tip));
    if (kind !== 2) {
      loose = float(1).sub(smoothstep(E.gravel[0], E.gravel[1], tip));
      let gravel = U("rGravel", "color").mul(float(0.84).add(gNoise(w.mul(3)).mul(0.1)));
      if (high && !tex) gravel = gravel.mul(float(1).add(stone.sub(0.5).mul(0.3).mul(float(1).sub(smoothstep(0.03, 0.09, px)))));
      col = mix(col, gravel, loose);
      const frayEnd = half.sub(0.1).add(gNoise(w.mul(2.3)).mul(0.22)).add(stone.sub(0.5).mul(0.08));
      keep = keep.and(a.lessThanEqual(mix(half.add(0.3), frayEnd, loose)));
    }
    mask = mask ? mask.and(keep) : keep;
  }
  let lean = null;
  if (tex) {
    // The drawn surface: a metre a tile, laid along the path, fading out
    // before it would shimmer, and leaning for the light.
    const k = float(1).sub(smoothstep(0.008, 0.06, px));
    const held = u.tBuilt;
    const t = texture(held.value, vec2(across, along)).depth(float(kind));
    t.onRenderUpdate(() => {
      if (held.value && t.value !== held.value) t.value = held.value;
    });
    let amount = float([0.8, 0.55, 0.95][kind]);
    let tt = t;
    if (E && kind !== 2) {
      // (Gravel's own at a free end.)
      const g = texture(held.value, vec2(across, along)).depth(float(2));
      g.onRenderUpdate(() => {
        if (held.value && g.value !== held.value) g.value = held.value;
      });
      tt = mix(t, g, loose);
      amount = mix(amount, float(0.95), loose);
    }
    col = col.mul(mix(float(1), tt.r.mul(0.75).add(0.45), k.mul(amount)));
    lean = vec2(tt.g.mul(2).sub(1), float(1).sub(tt.b.mul(2))).mul(k).mul(amount);
  }
  if (kind !== 2) {
    // The kerbs: a shade off the path, darker on the outer face.
    // (Sinking away at a free end.)
    let kerb = smoothstep(half.sub(0.05), half.sub(0.03), a).mul(float(1).sub(open));
    if (E) kerb = kerb.mul(smoothstep(E.kerb[0], E.kerb[1], tip));
    const k = U("rKerb", "color").mul(float(0.95).add(gNoise(w.mul(1.3).add(11)).mul(0.1))).mul(float(1).sub(smoothstep(half.add(0.04), half.add(0.13), a).mul(0.18)));
    col = mix(col, k, kerb);
  }
  {
    // After rain: darker, the sky's sheen low down the view; on High,
    // puddles down the middle of a kerbed path.
    const toEye = normalize(cameraPosition.sub(positionWorld));
    const sheen = pow(float(1).sub(clamp(toEye.y, 0, 1)), 4);
    let wet = col.mul(float(1).sub(gWet.mul(0.28)));
    let pool = float(0);
    if (high && kind !== 2) {
      pool = smoothstep(0.6, 0.68, gNoise(w.mul(0.45).add(19))).mul(float(1).sub(smoothstep(half.sub(0.35), half.sub(0.15), a))).mul(gWet).mul(float(1).sub(loose));
      wet = wet.mul(float(1).sub(pool.mul(0.3)));
    }
    wet = mix(wet, U("rSheen", "color"), clamp(sheen.mul(pool.mul(0.45).add(0.25)).mul(gWet), 0, 0.6));
    col = select(gWet.greaterThan(0), wet, col);
  }
  const own = vec4(materialColor);
  material.colorNode = vec4(own.rgb.mul(col), own.a);
  if (mask) material.maskNode = mask;
  if (lean) {
    // (textures.js LEAN_UV: tilted from how the path's co-ordinates change
    // across the screen.)
    const n = normalViewGeometry;
    const uv = vec2(across, along);
    const q0 = dFdx(positionView);
    const q1 = dFdy(positionView);
    const s0 = dFdx(uv);
    const s1 = dFdy(uv);
    const q1p = cross(q1, n);
    const q0p = cross(n, q0);
    const T = q1p.mul(s0.x).add(q0p.mul(s1.x));
    const B = q1p.mul(s0.y).add(q0p.mul(s1.y));
    const det = max(dot(T, T), dot(B, B));
    const sc = select(det.equal(0), float(0), inverseSqrt(det));
    material.normalNode = normalize(n.add(T.mul(lean.x).add(B.mul(lean.y)).mul(sc).mul(relief)));
  }
  applyNodeHooks(material, "path");
  material.userData.pathNode = PATH_NODE_KEY;
  return material;
}
