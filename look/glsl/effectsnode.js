// The screen's effects (look/effects.js) for three.js's WebGPURenderer: each
// of its passes - the occlusion and its softening, the smaller copies and
// the bloom's and glow's sources, the plain blur, the sun shafts' source and
// rays, TAA and its upscaling, the last pass that puts them together, and
// FXAA - as a node material drawn over the whole of a buffer (three's
// QuadMesh), from the same uniforms object the WebGL pass reads, so
// effects.js sets them the same way for either renderer and each switch
// does the same on both. Loaded only on WebGPURenderer (look/nodetwins.js).
//
// The same sums as WebGL's, not three's own post nodes (GTAO, its bloom and
// depth of field draw a different picture: the compare tool holds the two
// renderers' pictures to each other). What differs between the renderers
// is said where it's done:
//   - three's node textures are read top-down (uv's y from the top) on both
//     of its backends; WebGL's passes work in a picture's own terms (y up),
//     so here each place is worked out that way and turned over to read
//     (at);
//   - WebGPU's depth runs 0 - 1 where WebGL's runs -1 - 1 before it's
//     stored (ndcZ), on WebGPU itself; WebGPURenderer on WebGL 2 is WebGL's;
//   - the pixel's place for the occlusion's turn (ign) counted from the
//     bottom, as gl_FragCoord is, so its pattern is WebGL's;
//   - "not a number" told by its bits: a shader on WebGPU may take it that
//     there are none, and drop an x != x.

import * as THREE from "three";
import { NodeMaterial, QuadMesh } from "three/webgpu";
import { Fn, If, Loop, abs, clamp, cos, cross, dot, exp, float, floatBitsToUint, fract, length, max, min, mix, mod, normalize, pow, reference, sRGBTransferOETF, screenCoordinate, screenSize, select, sin, smoothstep, sqrt, texture, uint, uv, vec2, vec3, vec4 } from "three/tsl";
import { fxaa } from "three/addons/tsl/display/FXAANode.js";
import { UPSCALE } from "../../sim/ultra.mjs";

// A float that isn't a number (NaN), by its bits; and one that's NaN or
// infinite (all the exponent's bits set).
const nan1 = (x) => floatBitsToUint(x).bitAnd(uint(0x7fffffff)).greaterThan(uint(0x7f800000));
const bad1 = (x) => floatBitsToUint(x).bitAnd(uint(0x7f800000)).equal(uint(0x7f800000));
const anyNan = (c) => nan1(c.x).or(nan1(c.y)).or(nan1(c.z));
const anyBad = (c) => bad1(c.x).or(bad1(c.y)).or(bad1(c.z));

// A pass's material: `build({ tex, U, P, at, ndcZ, fragCoord })` gives its
// colour. tex(name): the uniform's texture as a node, kept to the
// uniform's value each time the pass is drawn (sync, from effects.js run);
// U(name, type): the uniform's value; P: the pixel's place, y up; at(t, p):
// a texture read there.
function passMaterial(renderer, uniforms, build) {
  const syncs = [];
  const tex = (name) => {
    const t = texture(uniforms[name].value);
    syncs.push(() => {
      const v = uniforms[name].value;
      if (v && t.value !== v) t.value = v;
    });
    return t;
  };
  const U = (name, type) => reference("value", type, uniforms[name]);
  const flip = (p) => vec2(p.x, float(1).sub(p.y));
  const P = flip(uv());
  const at = (t, p) => t.sample(flip(p));
  const gpuDepth = renderer.coordinateSystem === THREE.WebGPUCoordinateSystem;
  const ndcZ = (d) => (gpuDepth ? d : d.mul(2).sub(1));
  const fragCoord = vec2(screenCoordinate.x, screenSize.y.sub(screenCoordinate.y));
  const material = new NodeMaterial();
  material.fragmentNode = Fn(() => build({ tex, U, P, at, ndcZ, fragCoord }))();
  material.depthTest = false;
  material.depthWrite = false;
  material.fog = false;
  material.lights = false;
  material.uniforms = uniforms;
  material.userData.sync = () => {
    for (const s of syncs) s();
  };
  return material;
}

// A place in view space from the depth there (y-up place p).
const viewFrom = (depth, inverse, at, ndcZ) => (p) => {
  const d = at(depth, p).r;
  const q = inverse.mul(vec4(p.mul(2).sub(1), ndcZ(d), 1));
  return q.xyz.div(q.w);
};

// Each pass by its name in look/effects.js (make): its uniforms and
// defines as WebGL's take them.
const PASSES = {
  // The occlusion (AO_FRAG).
  ao: (k, { SAMPLES }) => {
    const depth = k.tex("tDepth");
    const texel = k.U("texel", "vec2");
    const projection = k.U("projection", "mat4");
    const radius = k.U("radius", "float");
    const near = k.U("near", "float");
    const far = k.U("far", "float");
    const viewAt = viewFrom(depth, k.U("inverseProjection", "mat4"), k.at, k.ndcZ);
    const d = k.at(depth, k.P).r;
    const out = float(1).toVar();
    If(d.lessThan(1), () => {
      const p = viewAt(k.P).toVar();
      const dist = p.z.negate();
      If(dist.lessThanEqual(far), () => {
        const l = viewAt(k.P.sub(vec2(texel.x, 0)));
        const r = viewAt(k.P.add(vec2(texel.x, 0)));
        const b = viewAt(k.P.sub(vec2(0, texel.y)));
        const t = viewAt(k.P.add(vec2(0, texel.y)));
        const dx = select(abs(r.z.sub(p.z)).lessThan(abs(p.z.sub(l.z))), r.sub(p), p.sub(l));
        const dy = select(abs(t.z.sub(p.z)).lessThan(abs(p.z.sub(b.z))), t.sub(p), p.sub(b));
        const n0 = normalize(cross(dx, dy));
        const n = select(dot(n0, p).greaterThan(0), n0.negate(), n0).toVar();
        // A turn of its own for each pixel (WebGL's, by its place from the
        // bottom).
        const spin = fract(float(52.9829189).mul(fract(dot(k.fragCoord, vec2(0.06711056, 0.00583715))))).mul(6.2831853);
        const helper = select(abs(n.y).lessThan(0.9), vec3(0, 1, 0), vec3(1, 0, 0));
        const tx = normalize(cross(helper, n)).toVar();
        const ty = cross(n, tx).toVar();
        const occluded = float(0).toVar();
        Loop(SAMPLES, ({ i }) => {
          const fi = float(i);
          const kk = fi.add(0.5).div(SAMPLES);
          const a = spin.add(fi.mul(2.39996323));
          const rr = sqrt(kk);
          const disk = vec2(cos(a), sin(a)).mul(rr);
          const dir = tx.mul(disk.x).add(ty.mul(disk.y)).add(n.mul(sqrt(max(float(0), float(1).sub(rr.mul(rr))))));
          const s = p.add(dir.mul(radius).mul(kk.mul(0.7).add(0.3))).toVar();
          const c = projection.mul(vec4(s, 1));
          const suv = c.xy.div(c.w).mul(0.5).add(0.5).toVar();
          If(suv.x.greaterThanEqual(0).and(suv.x.lessThanEqual(1)).and(suv.y.greaterThanEqual(0)).and(suv.y.lessThanEqual(1)), () => {
            const there = viewAt(suv).z.toVar();
            If(there.sub(s.z).greaterThan(dist.mul(0.004).add(0.04)), () => {
              occluded.addAssign(smoothstep(0, 1, radius.div(max(abs(p.z.sub(there)), 1e-3))));
            });
          });
        });
        const ao = pow(float(1).sub(occluded.div(SAMPLES)), 1.6);
        out.assign(mix(ao, float(1), smoothstep(near, far, dist)));
      });
    });
    return vec4(out, out, out, 1);
  },

  // The occlusion softened one way, not across a jump in depth (BLUR_FRAG).
  blur: (k) => {
    const ao = k.tex("tAO");
    const depth = k.tex("tDepth");
    const texel = k.U("texel", "vec2");
    const dir = k.U("dir", "vec2");
    const viewAt = viewFrom(depth, k.U("inverseProjection", "mat4"), k.at, k.ndcZ);
    const z0 = viewAt(k.P).z.toVar();
    let sum = float(0);
    let weight = float(0);
    for (let i = -3; i <= 3; i++) {
      const q = k.P.add(dir.mul(texel).mul(i * 1.5));
      const w = float(Math.exp(-(i * i) / 8)).mul(float(1).sub(smoothstep(0, abs(z0).mul(0.03).add(0.2), abs(viewAt(q).z.sub(z0)))));
      sum = sum.add(k.at(ao, q).r.mul(w));
      weight = weight.add(w);
    }
    const out = select(weight.greaterThan(0), sum.div(weight), k.at(ao, k.P).r);
    return vec4(out, out, out, 1);
  },

  // A smaller copy, or the bloom's and glow's source (DOWN_FRAG).
  down: (k) => {
    const colour = k.tex("tColor");
    const depth = k.tex("tDepth");
    const texel = k.U("texel", "vec2");
    const threshold = k.U("threshold", "float");
    const cap = k.U("cap", "float");
    const exposure = k.U("exposure", "float");
    const held = (c) => select(anyNan(c), vec3(0), clamp(c, vec3(0), vec3(cap)));
    const out = vec4(0, 0, 0, 1).toVar();
    If(threshold.greaterThan(0), () => {
      const sum = vec3(0).toVar();
      const n = float(0).toVar();
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          const q = k.P.add(vec2(i - 1.5, j - 1.5).mul(texel));
          If(k.at(depth, q).r.lessThan(1), () => {
            sum.addAssign(held(k.at(colour, q).rgb.mul(exposure)));
            n.addAssign(1);
          });
        }
      }
      const e = sum.div(max(n, 4));
      const peak = max(e.r, max(e.g, e.b));
      out.assign(vec4(e.mul(smoothstep(threshold, threshold.mul(1.6), peak)), 1));
    }).Else(() => {
      const c = held(k.at(colour, k.P.add(texel.mul(vec2(-0.5, -0.5)))).rgb)
        .add(held(k.at(colour, k.P.add(texel.mul(vec2(0.5, -0.5)))).rgb))
        .add(held(k.at(colour, k.P.add(texel.mul(vec2(-0.5, 0.5)))).rgb))
        .add(held(k.at(colour, k.P.add(texel.mul(vec2(0.5, 0.5)))).rgb));
      out.assign(vec4(c.mul(0.25), 1));
    });
    return out;
  },

  // A plain blur one way (SOFT_FRAG).
  soft: (k) => {
    const colour = k.tex("tColor");
    const texel = k.U("texel", "vec2");
    const dir = k.U("dir", "vec2");
    const o1 = dir.mul(texel).mul(1.3846153846);
    const o2 = dir.mul(texel).mul(3.2307692308);
    const sum = k
      .at(colour, k.P)
      .rgb.mul(0.227027027)
      .add(k.at(colour, k.P.add(o1)).rgb.add(k.at(colour, k.P.sub(o1)).rgb).mul(0.3162162162))
      .add(k.at(colour, k.P.add(o2)).rgb.add(k.at(colour, k.P.sub(o2)).rgb).mul(0.0702702703));
    return vec4(sum, 1);
  },

  // The shafts' source (SHAFT_SRC_FRAG).
  shaftSrc: (k, { FLOOR, CAP }) => {
    const colour = k.tex("tColor");
    const depth = k.tex("tDepth");
    const sun = k.U("sun", "vec2");
    const aspect = k.U("aspect", "float");
    const reach = k.U("reach", "float");
    const exposure = k.U("exposure", "float");
    const fullTexel = k.U("fullTexel", "vec2");
    let sky = float(0);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) sky = sky.add(select(k.at(depth, k.P.add(vec2(i - 1.5, j - 1.5).mul(fullTexel))).r.lessThan(1), float(0), float(1 / 16)));
    const skyV = sky.toVar();
    const out = vec4(0, 0, 0, 1).toVar();
    If(skyV.greaterThan(0), () => {
      const q = k.P.sub(sun).mul(vec2(aspect, 1));
      const near = float(1).sub(clamp(length(q).div(reach), 0, 1));
      const c0 = k.at(colour, k.P).rgb.mul(exposure);
      const c = max(min(select(anyNan(c0), vec3(0), c0), vec3(CAP)).sub(vec3(FLOOR)), vec3(0));
      out.assign(vec4(c.mul(near).mul(near).mul(near).mul(skyV), 1));
    });
    return out;
  },

  // The rays (SHAFT_FRAG).
  shaft: (k, { SAMPLES, DECAY }) => {
    const src = k.tex("tSrc");
    const sun = k.U("sun", "vec2");
    const step = k.P.sub(sun).div(SAMPLES);
    const q = vec2(k.P).toVar();
    const fall = float(1).toVar();
    const sum = vec3(0).toVar();
    Loop(SAMPLES, () => {
      q.subAssign(step);
      sum.addAssign(k.at(src, q).rgb.mul(fall));
      fall.mulAssign(DECAY);
    });
    return vec4(sum.div(SAMPLES), 1);
  },

  // TAA's blend (TAA_FRAG).
  taa: (k) => taaPass(k, false),
  // Temporal upscaling's (TAAU_FRAG).
  taau: (k) => taaPass(k, true),

  // On to the screen (OUT_FRAG).
  out: (k) => outPass(k),
};

const sane = (c) => select(anyNan(c), vec3(0), clamp(c, vec3(0), vec3(6.0e4)));
const tame = (c) => c.div(max(c.r, max(c.g, c.b)).add(1));
const untame = (c) => c.div(max(float(1).sub(max(c.r, max(c.g, c.b))), 1e-3));

function taaPass(k, upscale) {
  const cur = k.tex("tCur");
  const hist = k.tex("tHist");
  const depth = k.tex("tDepth");
  const invViewProj = k.U("invViewProj", "mat4");
  const prevViewProj = k.U("prevViewProj", "mat4");
  const blend = k.U("blend", "float");
  const neighbours = (centre, step) => {
    const first = tame(sane(k.at(cur, centre).rgb)).toVar();
    const lo = vec3(first).toVar();
    const hi = vec3(first).toVar();
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        const n = tame(sane(k.at(cur, centre.add(step(i, j))).rgb));
        lo.assign(min(lo, n));
        hi.assign(max(hi, n));
      }
    }
    return { first, lo, hi };
  };
  // Where this spot was last frame, from its depth and last frame's camera.
  const d = k.at(depth, k.P).r;
  const world0 = invViewProj.mul(vec4(k.P.mul(2).sub(1), k.ndcZ(min(d, 0.99999)), 1));
  const world = world0.xyz.div(world0.w);
  const prev = prevViewProj.mul(vec4(world, 1));
  const puv = prev.xy.div(prev.w).mul(0.5).add(0.5).toVar();
  const inside = puv.x.greaterThanEqual(0).and(puv.x.lessThanEqual(1)).and(puv.y.greaterThanEqual(0)).and(puv.y.lessThanEqual(1));
  if (!upscale) {
    const texel = k.U("texel", "vec2");
    const { first, lo, hi } = neighbours(k.P, (i, j) => vec2(i, j).mul(texel));
    const kk = select(inside, blend, float(0));
    const h = clamp(tame(sane(k.at(hist, puv).rgb)), lo, hi);
    return vec4(untame(mix(first, h, kk)), 1);
  }
  const inner = k.U("inner", "vec2");
  const jitter = k.U("jitter", "vec2");
  const ip = k.P.mul(inner).toVar();
  const cell = ip.sub(jitter).floor();
  const dd = ip.sub(cell.add(0.5).add(jitter));
  const cuv = cell.add(0.5).div(inner).toVar();
  const out = vec4(0, 0, 0, 1).toVar();
  If(blend.greaterThan(0).and(inside), () => {
    const { first, lo, hi } = neighbours(cuv, (i, j) => vec2(i, j).div(inner));
    const h = clamp(tame(sane(k.at(hist, puv).rgb)), lo, hi);
    const share = clamp(float(1).sub(blend).mul(2.5).mul(exp(float(-UPSCALE.sharp).mul(dot(dd, dd)))), UPSCALE.least, UPSCALE.most);
    out.assign(vec4(untame(mix(h, first, share)), 1));
  }).Else(() => {
    out.assign(vec4(untame(tame(sane(k.at(cur, ip.sub(jitter).div(inner)).rgb))), 1));
  });
  return out;
}

// three.js's neutral tone mapping, as WebGL's last pass has it.
const neutral = (c0, exposure) => {
  const color = c0.mul(exposure).toVar();
  const x = min(color.r, min(color.g, color.b));
  const offset = select(x.lessThan(0.08), x.sub(x.mul(x).mul(6.25)), float(0.04));
  color.subAssign(offset);
  const peak = max(color.r, max(color.g, color.b)).toVar();
  const START = 0.8 - 0.04;
  const out = vec3(color).toVar();
  If(peak.greaterThanEqual(START), () => {
    const d = 1 - START;
    const newPeak = float(1).sub(float(d * d).div(peak.add(d - START)));
    const scaled = color.mul(newPeak.div(peak));
    const g = float(1).sub(float(1).div(float(0.15).mul(peak.sub(newPeak)).add(1)));
    out.assign(mix(scaled, vec3(newPeak), g));
  });
  return out;
};
// A colour's hue, degrees (sim/colourgrade.mjs hueOf).
const hueOf = (c) => {
  const mx = max(c.r, max(c.g, c.b));
  const d = mx.sub(min(c.r, min(c.g, c.b)));
  const h = select(mx.equal(c.r), mod(c.g.sub(c.b).div(max(d, 1e-5)), 6), select(mx.equal(c.g), c.b.sub(c.r).div(max(d, 1e-5)).add(2), c.r.sub(c.g).div(max(d, 1e-5)).add(4)));
  return select(d.lessThan(1e-5), float(0), h.mul(60));
};
// (On the screen's scale: three's own sRGB curve, the same sums as WebGL's toSRGB.)
const toSRGB = (c) => sRGBTransferOETF(c);

function outPass(k) {
  const colour = k.tex("tColor");
  const depth = k.tex("tDepth");
  const aoT = k.tex("tAO");
  const bloomT = k.tex("tBloom");
  const blurT = k.tex("tBlur");
  const shaftsT = k.tex("tShafts");
  const glowT = k.tex("tGlow");
  const bounceT = k.tex("tBounce");
  const cloudsT = k.tex("tClouds");
  const U = k.U;
  const inverse = U("inverseProjection", "mat4");
  const exposure = U("exposure", "float");
  const lensTime = U("lensTime", "float");
  const aspect = U("aspect", "float");
  const P = k.P;
  const viewZ = (p, d) => {
    const q = inverse.mul(vec4(p.mul(2).sub(1), k.ndcZ(d), 1));
    return q.z.div(q.w).negate();
  };
  const col = k.at(colour, P).rgb.toVar();
  // (A pixel that isn't a number: black.)
  If(anyBad(col), () => col.assign(vec3(0)));
  // Ultra's 3D clouds, laid into the sky.
  If(U("cloudsOn", "float").greaterThan(0.5).and(k.at(depth, P).r.greaterThanEqual(1)), () => {
    const ct = U("cloudTexel", "vec2").mul(0.6);
    const c = k
      .at(cloudsT, P.add(ct))
      .add(k.at(cloudsT, P.sub(ct)))
      .add(k.at(cloudsT, P.add(vec2(ct.x, ct.y.negate()))))
      .add(k.at(cloudsT, P.add(vec2(ct.x.negate(), ct.y))))
      .mul(0.25);
    col.assign(col.mul(float(1).sub(c.a)).add(c.rgb));
  });
  // Ultra, on a hot, dry day: the air shimmering over the far ground.
  const heat = U("heat", "float");
  If(heat.greaterThan(0), () => {
    const hd = k.at(depth, P).r;
    If(hd.lessThan(1), () => {
      const hk = smoothstep(150, 450, viewZ(P, hd)).mul(heat).toVar();
      If(hk.greaterThan(0), () => {
        const hw = vec2(sin(P.y.mul(420).sub(lensTime.mul(6)).add(sin(P.x.mul(37)).mul(2))), sin(P.y.mul(310).sub(lensTime.mul(4.3)).add(P.x.mul(55))));
        const huv = P.add(hw.mul(vec2(0.0009, 0.0006)).mul(hk)).toVar();
        If(k.at(depth, huv).r.lessThan(1), () => col.assign(k.at(colour, huv).rgb));
      });
    });
  });
  // The far blur, and a flyover's focus.
  const dofAmount = U("dofAmount", "float");
  const focusAmount = U("focusAmount", "float");
  If(dofAmount.greaterThan(0).or(focusAmount.greaterThan(0)), () => {
    const d = k.at(depth, P).r;
    const kk = float(0).toVar();
    If(d.greaterThanEqual(1), () => {
      kk.assign(U("dofSky", "float").mul(max(dofAmount, focusAmount)));
    }).Else(() => {
      const z = viewZ(P, d).toVar();
      const range = U("dofRange", "vec2");
      kk.assign(smoothstep(range.x, range.y, z).mul(dofAmount));
      If(focusAmount.greaterThan(0), () => {
        const fn = U("focusNear", "vec2");
        const ff = U("focusFar", "vec2");
        const t = max(clamp(fn.x.sub(z).div(fn.y), 0, 1), clamp(z.sub(ff.x).div(ff.y), 0, 1));
        kk.assign(max(kk, t.mul(t).mul(float(3).sub(t.mul(2))).mul(focusAmount)));
      });
    });
    col.assign(mix(col, k.at(blurT, P).rgb, kk));
  });
  // Ultra, in heavy rain: drops on the lens.
  const lensRain = U("lensRain", "float");
  If(lensRain.greaterThan(0), () => {
    const lq = P.mul(vec2(aspect, 1)).mul(5);
    const lc = lq.floor();
    const lf = fract(lq).sub(0.5);
    const lh = fract(sin(dot(lc, vec2(12.9898, 78.233))).mul(43758.5453)).toVar();
    const life = fract(lensTime.mul(0.12).add(lh.mul(7))).toVar();
    const lat = vec2(fract(lh.mul(17)), fract(lh.mul(31))).sub(0.5).mul(0.6).sub(vec2(0, life.mul(0.12)));
    const lr = fract(lh.mul(53)).mul(0.07).add(0.07);
    const dv = lf.sub(lat).div(vec2(lr, lr.mul(1.15))).toVar();
    const dd = dot(dv, dv).toVar();
    const here = select(lh.lessThanEqual(lensRain.mul(0.5)), float(1), float(0)).mul(smoothstep(0, 0.04, life)).mul(float(1).sub(smoothstep(0.6, 1, life))).toVar();
    If(dd.lessThan(1).and(here.greaterThan(0)), () => {
      const bulge = dv.mul(sqrt(float(1).sub(dd)));
      const bent = k.at(colour, P.sub(bulge.mul(0.04))).rgb.mul(smoothstep(0.6, 0.95, dd).mul(0.25).add(1));
      col.assign(mix(col, bent, here.mul(float(1).sub(smoothstep(0.85, 1, dd)))));
    });
  });
  const ao = k.at(aoT, P).r.toVar();
  col.addAssign(k.at(bounceT, P).rgb.mul(U("bounceStrength", "float")).mul(float(1).sub(ao)));
  If(U("show", "float").greaterThan(0.5), () => col.assign(vec3(ao)));
  col.mulAssign(mix(float(1), ao, U("aoStrength", "float")));
  const lit = max(exposure, 1e-3);
  col.addAssign(k.at(bloomT, P).rgb.mul(U("bloomStrength", "float")).div(lit));
  col.addAssign(k.at(shaftsT, P).rgb.mul(U("shaftsStrength", "float")).div(lit));
  col.addAssign(k.at(glowT, P).rgb.mul(U("glowStrength", "float")).div(lit));
  const grade = U("grade", "float").greaterThan(0.5);
  If(grade, () => col.mulAssign(U("warm", "vec3")));
  const mapped = clamp(neutral(col, exposure), 0, 1);
  // On the screen's own scale from here (sim/colourgrade.mjs).
  const s = toSRGB(mapped).toVar();
  const natural = U("natural", "vec2");
  const naturalHue = U("naturalHue", "vec3");
  const sl = dot(s, vec3(0.2126, 0.7152, 0.0722));
  const smx = max(s.r, max(s.g, s.b));
  const ssat = select(smx.greaterThan(1e-4), smx.sub(min(s.r, min(s.g, s.b))).div(max(smx, 1e-4)), float(0));
  const sveg = float(1).sub(smoothstep(naturalHue.y, naturalHue.z, abs(mod(hueOf(s).sub(naturalHue.x).add(540), 360).sub(180))));
  s.assign(mix(vec3(sl), s, max(float(0), natural.x.mul(natural.y.mul(ssat).mul(ssat).mul(sveg).add(1)))));
  If(grade, () => {
    s.assign(s.sub(0.5).mul(U("contrast", "float")).add(0.5));
    const q = P.sub(0.5).mul(vec2(aspect, 1));
    const r = length(q).div(length(vec2(aspect, 1).mul(0.5)));
    s.mulAssign(float(1).sub(U("vignette", "float").mul(smoothstep(0.45, 1, r))));
  });
  return vec4(clamp(s, 0, 1), 1);
}

// A pass's node material, by its name in look/effects.js, reading
// `uniforms` (as the WebGL pass would) with WebGL's `defines`.
export function effectPass(name, uniforms, defines, renderer) {
  const make = PASSES[name];
  if (!make) throw new Error(`no node version of the "${name}" pass`);
  const numbers = Object.fromEntries(Object.entries(defines ?? {}).map(([k, v]) => [k, Number(v)]));
  return passMaterial(renderer, uniforms, (k) => make(k, numbers));
}

// FXAA (three's own TSL version of the same shader WebGL's FXAAShader is)
// from the finished picture, `uniforms` as WebGL's take them (tDiffuse; its
// texel size is read off the picture).
export function fxaaPass(uniforms) {
  const t = texture(uniforms.tDiffuse.value);
  const material = new NodeMaterial();
  material.fragmentNode = fxaa(t);
  material.depthTest = false;
  material.depthWrite = false;
  material.fog = false;
  material.lights = false;
  material.uniforms = uniforms;
  material.userData.sync = () => {
    const v = uniforms.tDiffuse.value;
    if (v && t.value !== v) t.value = v;
  };
  return material;
}

// What the passes are drawn over: three's quad for the whole buffer.
export const effectQuad = (material) => new QuadMesh(material);

// Draws `draw` to the screen as it is: WebGPURenderer otherwise tone maps
// and converts what's drawn to the screen, which the last pass has done
// (as three's own post-processing does it).
export function straightToScreen(renderer, draw) {
  const toneMapping = renderer.toneMapping;
  const space = renderer.outputColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.outputColorSpace = THREE.ColorManagement.workingColorSpace;
  try {
    draw();
  } finally {
    renderer.toneMapping = toneMapping;
    renderer.outputColorSpace = space;
  }
}

// (For the checks.)
export const EFFECT_PASSES = Object.keys(PASSES);
