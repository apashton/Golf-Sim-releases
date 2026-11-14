// The picture's finish (sim/effects.mjs: the owner's "cheap graphical
// wins", each with a switch): the picture is drawn into a buffer that keeps
// its brightness and depth, and from those alone - no second drawing of
// the scene - a few small passes work out
//   - ambient occlusion: how tucked in each spot near the camera is (the
//     foot of a trunk, under a bunker's lip, along a wall), softened, and
//     the picture a little darker there (only near: it fades out by
//     AO.far; never below 1 - AO.strength);
//   - bloom: a soft glow from only what's brighter than BLOOM.threshold
//     (the sun on water, the ball in sunlight), at a quarter size;
//   - the far blur: the picture softened at half size, mixed in by
//     distance from DOF.near to DOF.far - only hills, far woods and sky,
//     beyond any hole's green;
//   - on Ultra, light shafts: the sky round the sun, where it shows
//     through the leaves and past the trunks, smeared out from the sun at
//     a quarter size, so rays stream from it (sim/ultra.mjs SHAFTS); and
//     a wider, softer glow round the sun's glints, over the bloom's;
//   - on Ultra in a flyover, depth of field: the camera focused on the
//     ball (setFocus), sharp from just by the camera to well down the
//     hole, and only nearer or further softened with the far blur's
//     picture (sim/ultra.mjs FOCUS);
//   - on Ultra, temporal anti-aliasing (TAA): the picture drawn from a
//     camera nudged a fraction of a pixel each frame and blended with the
//     frames before (sim/ultra.mjs TAA), so edges, leaves and far mowing
//     stripes are smooth and don't crawl - in place of FXAA;
// and one last pass puts them together, tone maps the picture as three.js
// would drawing straight to the screen, and finishes its colour on the
// screen's own scale: natural colour always (NATURAL), and with the Warm
// colour switch the warmer white balance, a little contrast and the
// vignette (GRADE; sim/colourgrade.mjs has both, and the same sums for
// the tests). FXAA, when on, smooths the edges of that finished picture
// on its way to the screen.
//
// Only made when an effect that needs it is on (sim/effects.mjs
// usesBuffer) and the graphics card can keep a buffer of half floats.
// Once made, the picture stays drawn through it for the session, whatever
// is switched off: drawn straight to the screen instead, every material's
// shader would have to be built again - a stutter. The safety valve sheds
// the far blur, the bloom and the occlusion first when the picture is slow
// (look/safety.js, of: "effects").
//
// The scenes' materials are built for drawing into the buffer (no tone
// mapping in them: this does it), so the loading screen's warm-up builds
// them that way (pictureTarget: look/warmup.js).

import * as THREE from "three";
import { FullScreenQuad } from "three/addons/postprocessing/Pass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
import { LEVEL, ULTRA } from "./quality.js";
import { partsInUse } from "../sim/effectparts.mjs";
import { registerStep } from "./safety.js";
import { loadSetting } from "../util.js";
import { effectsInUse, usesBuffer } from "../sim/effects.mjs";
import { SHAFTS, FOCUS, TAA, UPSCALE, focusRange, shaftsStrength, taaJitter, pictureSamples, upscaledSize } from "../sim/ultra.mjs";
import { sunDirection } from "./environment.js";
import { lens } from "./lens.js";
import { renderTarget, nodeKit } from "./gpu.js";
import { flyShare, pictureEased, pictureSuper } from "./renderscale.js";
import { GRADE, NATURAL } from "../sim/colourgrade.mjs";

export const AO = {
  // How far round each spot it looks (metres), how many samples, how much
  // darker the most tucked-in spot gets, and from how far to how far it
  // fades out.
  radius: 2.4,
  samples: 12,
  strength: 0.5,
  near: 60,
  far: 140,
  // (Shows the occlusion alone, for looking at it.)
  show: false,
};
// Ultra's (the owner: "a significant leap up from high"): more samples,
// further out round each spot and seen further off, a touch deeper - the
// foot of every tree and wall sits in the ground across the hole.
if (ULTRA) Object.assign(AO, { samples: 20, radius: 3, strength: 0.6, near: 90, far: 220 });
// Ultra's bounce light: the picture's own colours, spread wide, filling the
// shade where the occlusion darkens - green off the grass into a bunker's
// face, the sunlit fairway warming the shade beside it - so shade is
// coloured by what's round it, never flat grey. (strength: how much of
// the surroundings' colour the most tucked-in spot takes back.)
// cap: nothing brighter than this goes into it - the glare round the sun,
// and its disc, aren't light bounced off anything (look/environment.js
// SUN_DISC: a white blob round every tree near the sun).
export const BOUNCE = { strength: 0.35, cap: 3 };

// Bloom: what's brighter than this (before tone mapping, after the
// exposure) glows, by this much. Held back: above anything white in full
// sun (about 2.8 here - a pyramid of range balls glowed into a haze at
// 1.35), so only real highlights - the sun's glint on water, on the ball's
// shine - do.
// cap: no part of the source brighter than this (four times the
// threshold), so the bloom is a soft glow round a glint, never a hard white
// disc: the sun's glint on a pond or on the ball was thousands of times
// white in full sun (look/environment.js SUN_DISC), and spread wide at a
// quarter size it came out as one, flashing as the ball turned its dimples
// or the water rippled (the owner, 16 October 2026: "we keep getting white
// blobs ... flashing on screen").
export const BLOOM = { threshold: 3, strength: 0.3, cap: 12 };
// The far blur: none nearer than `near` metres, all of `amount` by `far`;
// the sky (no depth) gets `sky` of it.
export const DOF = { near: 420, far: 950, amount: 0.75, sky: 0.35 };
// The colour (sim/colourgrade.mjs, the same sums for the tests): natural
// colour always, and with the Warm colour switch the white balance, a
// little more contrast and the corners a touch darker.
export { GRADE, NATURAL };

// The switches as this page was built, and as they are now (the menu can
// change those that aren't built into the scene without a reload).
export const BUILT_WITH = effectsInUse(loadSetting("effects", {}), LEVEL);
let on = { ...BUILT_WITH };
// Ultra's wider glow round the glints: a third, wider spread of the
// bloom's brightest, added at this strength.
// Only what's brighter than `threshold` (twice the bloom's): glints, not
// the white of a cloud, which first had a fuzzy halo from it.
// cap: as the bloom's.
export const GLOW = { strength: 0.1, threshold: 6, cap: 24 };
// The picture's plain smaller copies (the far blur's source): nothing
// brighter than this goes in - far above anything drawn, the sun's disc
// included, and well inside a half float.
export const PICTURE_CAP = 1e4;
// What the safety valve has shed. (Ultra's two first: they're the dearest.)
const shed = { dof: false, bloom: false, ao: false, shafts: false, focus: false, taa: false };
registerStep(0.5, "flyover depth of field", (v) => (shed.focus = v), { of: "effects" });
// (The sun shafts before the smoothing over time: without it, leaves and
// the rays through them flicker - in a recording most of all, where the
// valve sheds more - and it costs a fraction of what the shafts do.)
registerStep(0.6, "sun shafts", (v) => (shed.shafts = v), { of: "effects" });
registerStep(0.75, "smoothing over time", (v) => (shed.taa = v), { of: "effects" });
registerStep(1, "the far blur", (v) => (shed.dof = v), { of: "effects" });
registerStep(2, "bloom", (v) => (shed.bloom = v), { of: "effects" });
registerStep(3, "ambient occlusion", (v) => (shed.ao = v), { of: "effects" });
// Temporal upscaling (sim/ultra.mjs UPSCALE: the Fewer pixels switch): only
// while smoothed over time - TAA builds the full-size picture.
const upscaling = () => !!on.taa && !shed.taa && !!on.upscale;

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// The occlusion, from depth: each spot's place in view space, its facing
// from its neighbours' depths (the smaller step each way, so an edge
// doesn't bend it), and samples in the half of a ball round it that faces
// out, each counted where the depth there is in front of it - but not if
// it's much further in front (a tree well in front of the ground behind it
// doesn't darken it).
const AO_FRAG = /* glsl */ `
  uniform sampler2D tDepth;
  uniform vec2 texel;
  uniform mat4 projection;
  uniform mat4 inverseProjection;
  uniform float radius;
  uniform float near;
  uniform float far;
  varying vec2 vUv;
  vec3 viewAt(vec2 uv) {
    float d = texture2D(tDepth, uv).r;
    vec4 p = inverseProjection * vec4(vec3(uv, d) * 2.0 - 1.0, 1.0);
    return p.xyz / p.w;
  }
  // A number 0 - 1 that changes from pixel to pixel without a pattern.
  float ign(vec2 p) {
    return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
  }
  void main() {
    float d = texture2D(tDepth, vUv).r;
    if (d >= 1.0) { gl_FragColor = vec4(1.0); return; }
    vec3 p = viewAt(vUv);
    float dist = -p.z;
    if (dist > far) { gl_FragColor = vec4(1.0); return; }
    vec3 l = viewAt(vUv - vec2(texel.x, 0.0));
    vec3 r = viewAt(vUv + vec2(texel.x, 0.0));
    vec3 b = viewAt(vUv - vec2(0.0, texel.y));
    vec3 t = viewAt(vUv + vec2(0.0, texel.y));
    vec3 dx = abs(r.z - p.z) < abs(p.z - l.z) ? r - p : p - l;
    vec3 dy = abs(t.z - p.z) < abs(p.z - b.z) ? t - p : p - b;
    vec3 n = normalize(cross(dx, dy));
    if (dot(n, p) > 0.0) n = -n;
    // A turn of its own for each pixel, so the samples' pattern blurs out.
    float spin = ign(gl_FragCoord.xy) * 6.2831853;
    vec3 helper = abs(n.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 tx = normalize(cross(helper, n));
    vec3 ty = cross(n, tx);
    float occluded = 0.0;
    for (int i = 0; i < SAMPLES; i++) {
      float k = (float(i) + 0.5) / float(SAMPLES);
      float a = spin + float(i) * 2.39996323;
      float rr = sqrt(k);
      vec2 disk = vec2(cos(a), sin(a)) * rr;
      vec3 dir = tx * disk.x + ty * disk.y + n * sqrt(max(0.0, 1.0 - rr * rr));
      vec3 s = p + dir * radius * (0.3 + 0.7 * k);
      vec4 c = projection * vec4(s, 1.0);
      vec2 suv = c.xy / c.w * 0.5 + 0.5;
      if (suv.x < 0.0 || suv.x > 1.0 || suv.y < 0.0 || suv.y > 1.0) continue;
      float there = viewAt(suv).z;
      float inFront = there - s.z;
      if (inFront > 0.04 + 0.004 * dist) occluded += smoothstep(0.0, 1.0, radius / max(abs(p.z - there), 1e-3));
    }
    float ao = pow(1.0 - occluded / float(SAMPLES), 1.6);
    ao = mix(ao, 1.0, smoothstep(near, far, dist));
    gl_FragColor = vec4(ao, ao, ao, 1.0);
  }
`;

// Softened, across a few pixels each way, but not across a jump in depth
// (so it doesn't bleed from a trunk onto the sky behind).
const BLUR_FRAG = /* glsl */ `
  uniform sampler2D tAO;
  uniform sampler2D tDepth;
  uniform vec2 texel;
  uniform vec2 dir;
  uniform mat4 inverseProjection;
  varying vec2 vUv;
  float zAt(vec2 uv) {
    float d = texture2D(tDepth, uv).r;
    vec4 p = inverseProjection * vec4(vec3(uv, d) * 2.0 - 1.0, 1.0);
    return p.z / p.w;
  }
  void main() {
    float z0 = zAt(vUv);
    float sum = 0.0;
    float weight = 0.0;
    for (int i = -3; i <= 3; i++) {
      vec2 uv = vUv + dir * texel * float(i) * 1.5;
      float w = exp(-float(i * i) / 8.0) * (1.0 - smoothstep(0.0, 0.03 * abs(z0) + 0.2, abs(zAt(uv) - z0)));
      sum += texture2D(tAO, uv).r * w;
      weight += w;
    }
    float ao = weight > 0.0 ? sum / weight : texture2D(tAO, vUv).r;
    gl_FragColor = vec4(ao, ao, ao, 1.0);
  }
`;

// A smaller copy of the picture: each pixel the average of the four under
// it, each held to `cap` (PICTURE_CAP: no cap to speak of) and never a
// number that isn't one (NaN; an infinite one is the cap): once in a buffer
// of half floats, the blurs spread such a pixel into a blob the screen
// shows white, black or red by the card and the channel.
// With `threshold` > 0, the bloom's (and the glow's) source instead, from
// the full picture at a quarter size: of the sixteen pixels under it, only
// those that aren't sky (depth 1), only what's brighter than the threshold,
// eased in so it doesn't start with an edge, and none brighter than the
// cap. One depth for all sixteen (from the half-size copy) let the sun's
// disc and the glare round it through every gap in a swaying crown - a
// white blob flashing on and off at the leaves' edges against the sun; and
// uncapped, a glint of the sun on water or the ball, thousands of times
// white in full sun, spread into a hard white disc. (A thin bright thing
// against the sky - the ball, a flag's pole - counts as at least a quarter
// of the sixteen, so a single glinting pixel doesn't bloom like a sheet of
// them, nor flicker.)
const DOWN_FRAG = /* glsl */ `
  uniform sampler2D tColor;
  uniform sampler2D tDepth;
  uniform vec2 texel;
  uniform float threshold;
  uniform float cap;
  uniform float exposure;
  varying vec2 vUv;
  vec3 held(vec3 c) {
    if (any(isnan(c))) return vec3(0.0);
    return clamp(c, vec3(0.0), vec3(cap));
  }
  void main() {
    if (threshold > 0.0) {
      vec3 sum = vec3(0.0);
      float n = 0.0;
      for (int i = 0; i < 4; i++) {
        for (int j = 0; j < 4; j++) {
          vec2 o = (vec2(float(i), float(j)) - 1.5) * texel;
          if (texture2D(tDepth, vUv + o).r >= 1.0) continue;
          sum += held(texture2D(tColor, vUv + o).rgb * exposure);
          n += 1.0;
        }
      }
      vec3 e = sum / max(n, 4.0);
      float peak = max(e.r, max(e.g, e.b));
      gl_FragColor = vec4(e * smoothstep(threshold, threshold * 1.6, peak), 1.0);
      return;
    }
    vec3 c = held(texture2D(tColor, vUv + texel * vec2(-0.5, -0.5)).rgb)
      + held(texture2D(tColor, vUv + texel * vec2(0.5, -0.5)).rgb)
      + held(texture2D(tColor, vUv + texel * vec2(-0.5, 0.5)).rgb)
      + held(texture2D(tColor, vUv + texel * vec2(0.5, 0.5)).rgb);
    gl_FragColor = vec4(c * 0.25, 1.0);
  }
`;

// A plain blur, one way at a time (nine taps, weights of a bell curve).
const SOFT_FRAG = /* glsl */ `
  uniform sampler2D tColor;
  uniform vec2 texel;
  uniform vec2 dir;
  varying vec2 vUv;
  void main() {
    vec3 sum = texture2D(tColor, vUv).rgb * 0.2270270270;
    vec2 o1 = dir * texel * 1.3846153846;
    vec2 o2 = dir * texel * 3.2307692308;
    sum += (texture2D(tColor, vUv + o1).rgb + texture2D(tColor, vUv - o1).rgb) * 0.3162162162;
    sum += (texture2D(tColor, vUv + o2).rgb + texture2D(tColor, vUv - o2).rgb) * 0.0702702703;
    gl_FragColor = vec4(sum, 1.0);
  }
`;

// The shafts' source, at a quarter size: only the sky (no depth: what the
// leaves and trunks hide is left dark, so the rays come through the gaps),
// and only round the sun - more the nearer to it. How much of each pixel
// is sky, from sixteen of the full picture's depths: from one, a gap
// between leaves was sky or not by where that frame's nudge put it, and
// the rays through a crown flickered.
const SHAFT_SRC_FRAG = /* glsl */ `
  uniform sampler2D tColor;
  uniform sampler2D tDepth;
  uniform vec2 sun;
  uniform float aspect;
  uniform float reach;
  uniform float exposure;
  uniform vec2 fullTexel;
  varying vec2 vUv;
  void main() {
    float sky = 0.0;
    for (int i = 0; i < 4; i++) {
      for (int j = 0; j < 4; j++) {
        vec2 o = (vec2(float(i), float(j)) - 1.5) * fullTexel;
        sky += texture2D(tDepth, vUv + o).r < 1.0 ? 0.0 : 1.0 / 16.0;
      }
    }
    if (sky <= 0.0) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
    vec2 q = (vUv - sun) * vec2(aspect, 1.0);
    float near = 1.0 - clamp(length(q) / reach, 0.0, 1.0);
    // Only what's brighter than the sky's usual blue (FLOOR): the glare
    // round the sun - and no brighter than CAP: the sun's own disc, seen
    // in open sky, is so bright that summed into the rays it overflowed
    // the buffer's half floats, and every ray (each runs to the sun) took
    // it, blacking out the whole picture.
    vec3 c = texture2D(tColor, vUv).rgb * exposure;
    // (Never a number that isn't one: every ray to the sun would carry it.)
    if (any(isnan(c))) c = vec3(0.0);
    c = max(min(c, vec3(CAP)) - vec3(FLOOR), vec3(0.0));
    gl_FragColor = vec4(c * near * near * near * sky, 1.0);
  }
`;

// The rays: each pixel the source summed along the line towards the sun,
// fading as it goes (the shafts' decay).
const SHAFT_FRAG = /* glsl */ `
  uniform sampler2D tSrc;
  uniform vec2 sun;
  varying vec2 vUv;
  void main() {
    vec2 step = (vUv - sun) / float(SAMPLES);
    vec2 uv = vUv;
    float fall = 1.0;
    vec3 sum = vec3(0.0);
    for (int i = 0; i < SAMPLES; i++) {
      uv -= step;
      sum += texture2D(tSrc, uv).rgb * fall;
      fall *= DECAY;
    }
    gl_FragColor = vec4(sum / float(SAMPLES), 1.0);
  }
`;

// TAA's blend: this frame, and the frames before (tHist) where this spot
// was last frame (from its depth and last frame's camera), held within
// what this frame's neighbours span - so a moving ball or a camera cut
// doesn't smear - in a light-weighted way, so a bright pixel doesn't
// flicker. sky: the far plane for spots with no depth.
const TAA_FRAG = /* glsl */ `
  uniform sampler2D tCur;
  uniform sampler2D tHist;
  uniform sampler2D tDepth;
  uniform mat4 invViewProj;
  uniform mat4 prevViewProj;
  uniform vec2 texel;
  uniform float blend;
  varying vec2 vUv;
  // A colour fit to keep: a number that isn't one (NaN) dropped, nothing
  // infinite (tame makes a NaN of it) - once in the history it stayed, a
  // blob on the screen until the camera cut.
  vec3 sane(vec3 c) { return any(isnan(c)) ? vec3(0.0) : clamp(c, vec3(0.0), vec3(6.0e4)); }
  vec3 tame(vec3 c) { return c / (1.0 + max(c.r, max(c.g, c.b))); }
  vec3 untame(vec3 c) { return c / max(1.0 - max(c.r, max(c.g, c.b)), 1e-3); }
  void main() {
    vec3 cur = tame(sane(texture2D(tCur, vUv).rgb));
    vec3 lo = cur;
    vec3 hi = cur;
    for (int i = -1; i <= 1; i++) {
      for (int j = -1; j <= 1; j++) {
        if (i == 0 && j == 0) continue;
        vec3 n = tame(sane(texture2D(tCur, vUv + vec2(float(i), float(j)) * texel).rgb));
        lo = min(lo, n);
        hi = max(hi, n);
      }
    }
    float d = texture2D(tDepth, vUv).r;
    vec4 world = invViewProj * vec4(vec3(vUv, min(d, 0.99999)) * 2.0 - 1.0, 1.0);
    world /= world.w;
    vec4 prev = prevViewProj * vec4(world.xyz, 1.0);
    vec2 puv = prev.xy / prev.w * 0.5 + 0.5;
    float k = blend;
    if (puv.x < 0.0 || puv.x > 1.0 || puv.y < 0.0 || puv.y > 1.0) k = 0.0;
    vec3 hist = clamp(tame(sane(texture2D(tHist, puv).rgb)), lo, hi);
    gl_FragColor = vec4(untame(mix(cur, hist, k)), 1.0);
  }
`;

// Temporal upscaling's TAA (sim/ultra.mjs UPSCALE): the picture drawn
// smaller (inner pixels), nudged by `jitter` of its pixels this frame, and
// the full-size picture built from it and the frames before - this
// frame's sample counted most at the full-size pixel it lands on (its
// share: upscaleShare), the history held within what the drawn picture's
// pixels round it span, as TAA's. Fresh (no history, blend 0): this frame
// alone, smoothly scaled up.
const TAAU_FRAG = /* glsl */ `
  uniform sampler2D tCur;
  uniform sampler2D tHist;
  uniform sampler2D tDepth;
  uniform mat4 invViewProj;
  uniform mat4 prevViewProj;
  uniform vec2 inner;
  uniform vec2 jitter;
  uniform float blend;
  varying vec2 vUv;
  vec3 sane(vec3 c) { return any(isnan(c)) ? vec3(0.0) : clamp(c, vec3(0.0), vec3(6.0e4)); }
  vec3 tame(vec3 c) { return c / (1.0 + max(c.r, max(c.g, c.b))); }
  vec3 untame(vec3 c) { return c / max(1.0 - max(c.r, max(c.g, c.b)), 1e-3); }
  void main() {
    // Where this pixel is on the drawn picture, unnudged; the drawn pixel
    // whose sample lies nearest it (each drawn pixel shows the scene a
    // nudge's worth along), and how far off that sample is.
    vec2 ip = vUv * inner;
    vec2 cell = floor(ip - jitter);
    vec2 d = ip - (cell + 0.5 + jitter);
    vec2 cuv = (cell + 0.5) / inner;
    vec3 near = tame(sane(texture2D(tCur, cuv).rgb));
    vec3 lo = near;
    vec3 hi = near;
    for (int i = -1; i <= 1; i++) {
      for (int j = -1; j <= 1; j++) {
        if (i == 0 && j == 0) continue;
        vec3 n = tame(sane(texture2D(tCur, cuv + vec2(float(i), float(j)) / inner).rgb));
        lo = min(lo, n);
        hi = max(hi, n);
      }
    }
    float depth = texture2D(tDepth, vUv).r;
    vec4 world = invViewProj * vec4(vec3(vUv, min(depth, 0.99999)) * 2.0 - 1.0, 1.0);
    world /= world.w;
    vec4 prev = prevViewProj * vec4(world.xyz, 1.0);
    vec2 puv = prev.xy / prev.w * 0.5 + 0.5;
    bool had = blend > 0.0 && puv.x >= 0.0 && puv.x <= 1.0 && puv.y >= 0.0 && puv.y <= 1.0;
    if (!had) {
      gl_FragColor = vec4(untame(tame(sane(texture2D(tCur, (ip - jitter) / inner).rgb))), 1.0);
      return;
    }
    vec3 hist = clamp(tame(sane(texture2D(tHist, puv).rgb)), lo, hi);
    float share = clamp((1.0 - blend) * 2.5 * exp(-${UPSCALE.sharp.toFixed(2)} * dot(d, d)), ${UPSCALE.least.toFixed(3)}, ${UPSCALE.most.toFixed(3)});
    gl_FragColor = vec4(untame(mix(hist, near, share)), 1.0);
  }
`;

// On to the screen: the far blur mixed in by distance, the picture a
// little darker where it's tucked in, the bloom added, the colour graded,
// then tone mapped (three.js's own Neutral, with the renderer's exposure)
// and turned to sRGB as three.js does for the screen - here, since three.js
// leaves both out when drawing into a buffer, as this does on its way to
// FXAA. Last, the vignette.
const OUT_FRAG = /* glsl */ `
  uniform sampler2D tColor;
  uniform sampler2D tDepth;
  uniform sampler2D tAO;
  uniform sampler2D tBloom;
  uniform sampler2D tBlur;
  uniform sampler2D tShafts;
  uniform float shaftsStrength;
  uniform sampler2D tGlow;
  uniform float glowStrength;
  uniform sampler2D tBounce;
  uniform float bounceStrength;
  uniform float focusAmount;
  uniform vec2 focusNear;
  uniform vec2 focusFar;
  uniform mat4 inverseProjection;
  uniform float aoStrength;
  uniform float bloomStrength;
  uniform float dofAmount;
  uniform float dofSky;
  uniform vec2 dofRange;
  uniform float grade;
  uniform vec3 warm;
  uniform vec2 natural;
  uniform vec3 naturalHue;
  uniform float contrast;
  uniform float vignette;
  uniform float aspect;
  uniform float exposure;
  uniform float show;
  uniform float lensRain;
  uniform float lensTime;
  uniform float heat;
  uniform sampler2D tClouds;
  uniform float cloudsOn;
  uniform vec2 cloudTexel;
  varying vec2 vUv;
  vec3 neutral(vec3 color) {
    const float StartCompression = 0.8 - 0.04;
    const float Desaturation = 0.15;
    color *= exposure;
    float x = min(color.r, min(color.g, color.b));
    float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
    color -= offset;
    float peak = max(color.r, max(color.g, color.b));
    if (peak < StartCompression) return color;
    float d = 1. - StartCompression;
    float newPeak = 1. - d * d / (peak + d - StartCompression);
    color *= newPeak / peak;
    float g = 1. - 1. / (Desaturation * (peak - newPeak) + 1.);
    return mix(color, vec3(newPeak), g);
  }
  // A colour's hue, degrees (sim/colourgrade.mjs hueOf).
  float hueOf(vec3 c) {
    float mx = max(c.r, max(c.g, c.b));
    float d = mx - min(c.r, min(c.g, c.b));
    if (d < 1e-5) return 0.0;
    float h = mx == c.r ? mod((c.g - c.b) / d, 6.0) : mx == c.g ? (c.b - c.r) / d + 2.0 : (c.r - c.g) / d + 4.0;
    return h * 60.0;
  }
  vec3 toSRGB(vec3 c) {
    return mix(pow(c, vec3(0.41666)) * 1.055 - vec3(0.055), c * 12.92, vec3(lessThanEqual(c, vec3(0.0031308))));
  }
  void main() {
    vec3 col = texture2D(tColor, vUv).rgb;
    // (A pixel that isn't a number - from nowhere now, but white, black or
    // red by the card if ever one is - black.)
    if (any(isnan(col)) || any(isinf(col))) col = vec3(0.0);
    // Ultra's 3D clouds, worked out at a quarter of the pixels: laid into
    // the sky (where nothing's drawn in front - the ground and the trees
    // hide them), softened over a few of their pixels so their grain
    // doesn't show. (They're stored with their cover already applied.)
    if (cloudsOn > 0.5 && texture2D(tDepth, vUv).r >= 1.0) {
      vec2 ct = cloudTexel * 0.6;
      vec4 c = 0.25 * (texture2D(tClouds, vUv + ct) + texture2D(tClouds, vUv - ct) + texture2D(tClouds, vUv + vec2(ct.x, -ct.y)) + texture2D(tClouds, vUv + vec2(-ct.x, ct.y)));
      col = col * (1.0 - c.a) + c.rgb;
    }
    // Ultra, on a hot, dry day: the air shimmering over the far ground -
    // the picture there wavering a little, rising, from about 150 m out,
    // never the sky.
    if (heat > 0.0) {
      float hd = texture2D(tDepth, vUv).r;
      if (hd < 1.0) {
        vec4 hp = inverseProjection * vec4(vec3(vUv, hd) * 2.0 - 1.0, 1.0);
        float hz = -hp.z / hp.w;
        float hk = smoothstep(150.0, 450.0, hz) * heat;
        if (hk > 0.0) {
          vec2 hw = vec2(sin(vUv.y * 420.0 - lensTime * 6.0 + sin(vUv.x * 37.0) * 2.0), sin(vUv.y * 310.0 - lensTime * 4.3 + vUv.x * 55.0));
          vec2 huv = vUv + hw * vec2(0.0009, 0.0006) * hk;
          // (Only from what's also far: never a near tree bent into it.)
          if (texture2D(tDepth, huv).r < 1.0) col = texture2D(tColor, huv).rgb;
        }
      }
    }
    if (dofAmount > 0.0 || focusAmount > 0.0) {
      float d = texture2D(tDepth, vUv).r;
      float k;
      // (The sky no softer in a flyover than the far blur has it.)
      if (d >= 1.0) k = dofSky * max(dofAmount, focusAmount);
      else {
        vec4 p = inverseProjection * vec4(vec3(vUv, d) * 2.0 - 1.0, 1.0);
        float z = -p.z / p.w;
        k = smoothstep(dofRange.x, dofRange.y, z) * dofAmount;
        // In a flyover: sharp from just by the camera, past the ball, to
        // well down the hole; soft only nearer or further (sim/ultra.mjs
        // focusBlur).
        if (focusAmount > 0.0) {
          float t = max(clamp((focusNear.x - z) / focusNear.y, 0.0, 1.0), clamp((z - focusFar.x) / focusFar.y, 0.0, 1.0));
          k = max(k, t * t * (3.0 - 2.0 * t) * focusAmount);
        }
      }
      col = mix(col, texture2D(tBlur, vUv).rgb, k);
    }
    // Ultra, in heavy rain: drops on the lens, each a little bulge that
    // shows the picture behind it bent and upside down, sliding a little
    // and drying away, a few at a time.
    if (lensRain > 0.0) {
      vec2 lq = vUv * vec2(aspect, 1.0) * 5.0;
      vec2 lc = floor(lq);
      vec2 lf = fract(lq) - 0.5;
      float lh = fract(sin(dot(lc, vec2(12.9898, 78.233))) * 43758.5453);
      float life = fract(lensTime * 0.12 + lh * 7.0);
      vec2 at = (vec2(fract(lh * 17.0), fract(lh * 31.0)) - 0.5) * 0.6 - vec2(0.0, life * 0.12);
      float lr = 0.07 + 0.07 * fract(lh * 53.0);
      vec2 dv = (lf - at) / vec2(lr, lr * 1.15);
      float dd = dot(dv, dv);
      float here = step(lh, lensRain * 0.5) * smoothstep(0.0, 0.04, life) * (1.0 - smoothstep(0.6, 1.0, life));
      if (dd < 1.0 && here > 0.0) {
        vec2 bulge = dv * sqrt(1.0 - dd);
        vec3 bent = texture2D(tColor, vUv - bulge * 0.04).rgb;
        // A brighter rim where it catches the light.
        bent *= 1.0 + 0.25 * smoothstep(0.6, 0.95, dd);
        col = mix(col, bent, here * (1.0 - smoothstep(0.85, 1.0, dd)));
      }
    }
    float ao = texture2D(tAO, vUv).r;
    // Ultra: the shade filled a little with its surroundings' colour.
    col += texture2D(tBounce, vUv).rgb * bounceStrength * (1.0 - ao);
    // (For looking at: the occlusion alone.)
    if (show > 0.5) col = vec3(ao);
    col *= mix(1.0, ao, aoStrength);
    col += texture2D(tBloom, vUv).rgb * bloomStrength / max(exposure, 1e-3);
    col += texture2D(tShafts, vUv).rgb * shaftsStrength / max(exposure, 1e-3);
    col += texture2D(tGlow, vUv).rgb * glowStrength / max(exposure, 1e-3);
    if (grade > 0.5) col *= warm;
    col = clamp(neutral(col), 0.0, 1.0);
    // On the screen's own scale from here (sim/colourgrade.mjs): natural
    // colour - the saturation brought down towards what a camera sees
    // outdoors, most where a colour's strongest (NATURAL) - then, with the
    // Warm colour switch, a little more contrast about the middle of what's
    // shown (about a middle of 0.5 in linear light it took 0.02 off
    // everything, and all darker than about 37 of 255 came out black) and
    // the corners a touch darker.
    vec3 s = toSRGB(col);
    float sl = dot(s, vec3(0.2126, 0.7152, 0.0722));
    float smx = max(s.r, max(s.g, s.b));
    float ssat = smx > 1e-4 ? (smx - min(s.r, min(s.g, s.b))) / smx : 0.0;
    float sveg = 1.0 - smoothstep(naturalHue.y, naturalHue.z, abs(mod(hueOf(s) - naturalHue.x + 540.0, 360.0) - 180.0));
    s = mix(vec3(sl), s, max(0.0, natural.x * (1.0 + natural.y * ssat * ssat * sveg)));
    if (grade > 0.5) {
      s = (s - 0.5) * contrast + 0.5;
      vec2 q = (vUv - 0.5) * vec2(aspect, 1.0);
      float r = length(q) / length(vec2(aspect, 1.0) * 0.5);
      s *= 1.0 - vignette * smoothstep(0.45, 1.0, r);
    }
    gl_FragColor = vec4(clamp(s, 0.0, 1.0), 1.0);
  }
`;

let pass = null;
// White and black one-pixel textures, for what's off.
let white = null;
let black = null;

// The buffer the scenes' materials are built for: the picture's, while it's
// drawn that way; else null (the screen). (The full set's: the smaller
// set's the same kind of buffer, so they're built for both.)
export function pictureTarget() {
  return pass ? pass.full.picture : null;
}

// Whether the next frame is drawn through here.
export function effectsOn() {
  return !!pass;
}

// The switches now (the menu: those that don't need a reload). Turning on
// the first that needs the buffer makes it, if it can be (one stutter as
// the materials are built for it; the reload ones wait for theirs).
export function setEffects(next, renderer) {
  on = { ...on, ...next };
  if (!pass && usesBuffer(on) && renderer) make(renderer);
}

// Whether the graphics card can keep the buffer at all (WebGL 2, and
// drawing into half floats): without it, none of the screen's effects.
export function canFinish(renderer) {
  // (WebGPURenderer: always, on WebGPU and on its own WebGL 2.)
  if (renderer.isWebGPURenderer) return true;
  return !!(renderer.capabilities?.isWebGL2 && (renderer.extensions.has("EXT_color_buffer_float") || renderer.extensions.has("EXT_color_buffer_half_float")));
}

// Made for the renderer once, if an effect that needs it is on.
export function useEffects(renderer) {
  if (pass || !usesBuffer(on)) return;
  make(renderer);
}

const pixel = (rgba) => {
  const t = new THREE.DataTexture(new Uint8Array(rgba), 1, 1);
  // (On WebGPURenderer read smoothly, as the buffers they stand in for
  // are: a pass's texture is changed between the two, and WebGPU binds a
  // texture read only point by point another way.)
  if (nodeKit()) t.magFilter = t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
};

// The buffers a picture's drawn through, for one `w` x `h` pixels: the
// picture itself (4x multisampled - the full set's 2x while it's
// supersampled and smoothed over time: fit - half floats, its depth kept) and,
// smaller by 2^k each way, the effects' own:
//   clouds  Ultra's 3D clouds, worked out at half the picture's size each
//           way (a quarter of the pixels) and laid into its sky
//   a, b    the occlusion (half size, 8 bits)
//   h1, h2  the far blur (half); q1, q2 the bloom (quarter)
//   s1, s2  the shafts (quarter): their source, and the rays
//   g1, g2  the glow (quarter); n1, n2 Ultra's bounce light (an eighth)
//   t1, t2  TAA's history, two in turn (full size)
//   ldr     the finished picture for FXAA (full, 8 bits)
// Two sets: the full picture's, and on Ultra a smaller one drawn into
// while the camera flies (look/renderscale.js flyShare).
// With temporal upscaling (sim/ultra.mjs UPSCALE) the picture's drawn
// smaller than the rest: it and what's worked out from its depth (the
// clouds, the occlusion: DRAWN) at its size, the rest at the full size TAA
// builds.
const PARTS = [["clouds", 1], ["a", 1, THREE.UnsignedByteType], ["b", 1, THREE.UnsignedByteType], ["h1", 1], ["h2", 1], ["q1", 2], ["q2", 2], ["s1", 2], ["s2", 2], ["g1", 2], ["g2", 2], ["n1", 3], ["n2", 3], ["t1", 0], ["t2", 0], ["ldr", 0, THREE.UnsignedByteType]];
const DRAWN = new Set(["clouds", "a", "b"]);
function targetSet(w, h, upscale = false) {
  const [iw, ih] = upscaledSize(w, h, upscale);
  const set = { picture: renderTarget(iw, ih, { samples: 4, type: THREE.HalfFloatType, depthTexture: new THREE.DepthTexture(iw, ih) }), upscale };
  for (const [name, k, type = THREE.HalfFloatType] of PARTS) {
    const [bw, bh] = DRAWN.has(name) ? [iw, ih] : [w, h];
    set[name] = renderTarget(Math.max(1, bw >> k), Math.max(1, bh >> k), { type, depthBuffer: false });
  }
  return set;
}
function sizeSet(set, w, h, upscale = false) {
  const [iw, ih] = upscaledSize(w, h, upscale);
  set.upscale = upscale;
  set.picture.setSize(iw, ih);
  for (const [name, k] of PARTS) {
    const [bw, bh] = DRAWN.has(name) ? [iw, ih] : [w, h];
    set[name].setSize(Math.max(1, bw >> k), Math.max(1, bh >> k));
  }
}
function disposeSet(set) {
  set.picture.depthTexture?.dispose();
  set.picture.dispose();
  for (const [name] of PARTS) set[name].dispose();
}
// Made on the graphics card now (a frame that can take it: a resize, the
// load), not on its first use mid-flight.
function readySet(renderer, set) {
  if (!renderer.initRenderTarget) return;
  renderer.initRenderTarget(set.picture);
  // (Only those the switches that are on draw into - sim/effectparts.mjs:
  // the rest take no memory until their effect's first used.)
  const use = partsInUse(on, { ultra: ULTRA });
  for (const [name] of PARTS) if (use.has(name)) renderer.initRenderTarget(set[name]);
}

function make(renderer) {
  if (pass || !canFinish(renderer)) return;
  white = pixel([255, 255, 255, 255]);
  black = pixel([0, 0, 0, 255]);
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const full = targetSet(size.x, size.y);
  const { picture } = full;
  // (On WebGPURenderer each pass's node version, from the same uniforms:
  // look/glsl/effectsnode.js.)
  const kit = nodeKit();
  const shader = (name, fragmentShader, uniforms, defines = {}) =>
    kit ? kit.effectPass(name, uniforms, defines, renderer) : new THREE.ShaderMaterial({ defines, uniforms, vertexShader: VERT, fragmentShader, depthTest: false, depthWrite: false });
  const ao = shader(
    "ao",
    AO_FRAG,
    {
      tDepth: { value: picture.depthTexture },
      texel: { value: new THREE.Vector2() },
      projection: { value: new THREE.Matrix4() },
      inverseProjection: { value: new THREE.Matrix4() },
      radius: { value: AO.radius },
      near: { value: AO.near },
      far: { value: AO.far },
    },
    { SAMPLES: AO.samples },
  );
  const blur = shader("blur", BLUR_FRAG, {
    tAO: { value: null },
    tDepth: { value: picture.depthTexture },
    texel: { value: new THREE.Vector2() },
    dir: { value: new THREE.Vector2(1, 0) },
    inverseProjection: { value: new THREE.Matrix4() },
  });
  const down = shader("down", DOWN_FRAG, { tColor: { value: null }, tDepth: { value: picture.depthTexture }, texel: { value: new THREE.Vector2() }, threshold: { value: 0 }, cap: { value: PICTURE_CAP }, exposure: { value: 1 } });
  const soft = shader("soft", SOFT_FRAG, { tColor: { value: null }, texel: { value: new THREE.Vector2() }, dir: { value: new THREE.Vector2(1, 0) } });
  const out = shader("out", OUT_FRAG, {
    tColor: { value: picture.texture },
    tDepth: { value: picture.depthTexture },
    tAO: { value: white },
    tBloom: { value: black },
    tBlur: { value: picture.texture },
    tShafts: { value: black },
    shaftsStrength: { value: 0 },
    tGlow: { value: black },
    glowStrength: { value: 0 },
    tBounce: { value: black },
    bounceStrength: { value: 0 },
    focusAmount: { value: 0 },
    focusNear: { value: new THREE.Vector2(0, 1) },
    focusFar: { value: new THREE.Vector2(1e9, 1) },
    inverseProjection: { value: new THREE.Matrix4() },
    aoStrength: { value: 0 },
    bloomStrength: { value: 0 },
    dofAmount: { value: 0 },
    dofSky: { value: DOF.sky },
    dofRange: { value: new THREE.Vector2(DOF.near, DOF.far) },
    grade: { value: 0 },
    warm: { value: new THREE.Vector3(...GRADE.warm) },
    natural: { value: new THREE.Vector2(NATURAL.saturation, NATURAL.vibrance) },
    naturalHue: { value: new THREE.Vector3(NATURAL.hue, NATURAL.near, NATURAL.far) },
    contrast: { value: GRADE.contrast },
    vignette: { value: GRADE.vignette },
    aspect: { value: 1 },
    exposure: { value: 1 },
    show: { value: 0 },
    lensRain: { value: 0 },
    lensTime: { value: 0 },
    heat: { value: 0 },
    tClouds: { value: black },
    cloudsOn: { value: 0 },
    cloudTexel: { value: new THREE.Vector2(1, 1) },
  });
  const shaftSrc = shader(
    "shaftSrc",
    SHAFT_SRC_FRAG,
    { tColor: { value: null }, tDepth: { value: picture.depthTexture }, sun: { value: new THREE.Vector2() }, aspect: { value: 1 }, reach: { value: SHAFTS.reach }, exposure: { value: 1 }, fullTexel: { value: new THREE.Vector2(1, 1) } },
    { FLOOR: SHAFTS.floor.toFixed(3), CAP: SHAFTS.cap.toFixed(3) },
  );
  const shaft = shader("shaft", SHAFT_FRAG, { tSrc: { value: null }, sun: { value: new THREE.Vector2() } }, { SAMPLES: SHAFTS.samples, DECAY: SHAFTS.decay.toFixed(4) });
  const taa = shader("taa", TAA_FRAG, {
    tCur: { value: picture.texture },
    tHist: { value: null },
    tDepth: { value: picture.depthTexture },
    invViewProj: { value: new THREE.Matrix4() },
    prevViewProj: { value: new THREE.Matrix4() },
    texel: { value: new THREE.Vector2() },
    blend: { value: TAA.blend },
  });
  const taau = shader("taau", TAAU_FRAG, {
    tCur: { value: picture.texture },
    tHist: { value: null },
    tDepth: { value: picture.depthTexture },
    invViewProj: { value: new THREE.Matrix4() },
    prevViewProj: { value: new THREE.Matrix4() },
    inner: { value: new THREE.Vector2(1, 1) },
    jitter: { value: new THREE.Vector2() },
    blend: { value: TAA.blend },
  });
  const fxaa = kit ? kit.fxaaPass(THREE.UniformsUtils.clone(FXAAShader.uniforms)) : new THREE.ShaderMaterial({ ...FXAAShader, uniforms: THREE.UniformsUtils.clone(FXAAShader.uniforms), depthTest: false, depthWrite: false });
  pass = {
    renderer,
    size,
    // The two sets of buffers (targetSet): the full picture's, and the
    // smaller one while the camera flies (made in fit, where there's
    // supersampling to ease) - and the one this frame draws through, its
    // buffers also at the top level here (picture, a, b, ...: useSet).
    full,
    fly: null,
    flySize: new THREE.Vector2(),
    set: null,
    ...full,
    taa,
    taau,
    taaFrame: 0,
    taaFresh: true,
    // The history TAA wrote last (in either set).
    hist: null,
    prevViewProj: new THREE.Matrix4(),
    ao,
    blur,
    down,
    soft,
    shaftSrc,
    shaft,
    out,
    fxaa,
    quad: kit ? kit.effectQuad(out) : new FullScreenQuad(out),
    kit,
  };
}

// Keeps the full set the drawing buffer's size (the pixel ratio and the
// safety valve's picture share go through it), and the smaller set its
// share of it (flyShare: none where there's nothing to ease, while
// recording, or with supersampling shed) - both only when they change.
function fit() {
  const { renderer, full, size } = pass;
  const now = renderer.getDrawingBufferSize(new THREE.Vector2());
  // (Upscaled - drawn smaller and built up over time - only while smoothed
  // over time: upscaling.)
  const up = upscaling();
  if (now.x !== size.x || now.y !== size.y || full.upscale !== up) {
    size.copy(now);
    sizeSet(full, now.x, now.y, up);
    readySet(renderer, full);
    pass.taaFresh = true;
    pass.hist = null;
  }
  // The full picture's multisampling: lighter while it's supersampled and
  // smoothed over time (sim/ultra.mjs pictureSamples). Only changes as
  // either does (the valve's steps, between shots; a resize): the buffer
  // made again then, at once rather than on its first use.
  // (Upscaled, it's drawn smaller than it's supersampled: by that much less.)
  const samples = pictureSamples({ supersample: pictureSuper() * (up ? UPSCALE.share : 1), taa: !!on.taa && !shed.taa });
  if (full.picture.samples !== samples) {
    full.picture.samples = samples;
    full.picture.dispose();
    renderer.initRenderTarget?.(full.picture);
    pass.taaFresh = true;
  }
  const share = flyShare();
  const w = Math.max(1, Math.round(now.x * share));
  const h = Math.max(1, Math.round(now.y * share));
  if (share >= 1) {
    if (pass.fly) {
      disposeSet(pass.fly);
      pass.fly = null;
      pass.hist = null;
    }
  } else if (!pass.fly) {
    pass.fly = targetSet(w, h, up);
    pass.flySize.set(w, h);
    readySet(renderer, pass.fly);
  } else if (pass.flySize.x !== w || pass.flySize.y !== h || pass.fly.upscale !== up) {
    sizeSet(pass.fly, w, h, up);
    pass.flySize.set(w, h);
    pass.hist = null;
    readySet(renderer, pass.fly);
  }
}

// The set this frame draws through: its buffers put where the drawing
// reads them (pass.picture, pass.a ...), and the materials that read the
// picture or its depth pointed at its own. A switch of sets is only that -
// nothing resized or built - and TAA's history is read from whichever set
// wrote it (by where on the picture, so a set of another size will do).
function useSet(set) {
  if (pass.set === set) return;
  pass.set = set;
  Object.assign(pass, set);
  const { picture, ao, blur, down, out, shaftSrc, taa, taau } = pass;
  for (const m of [ao, blur, down, out, shaftSrc, taa, taau]) m.uniforms.tDepth.value = picture.depthTexture;
  taa.uniforms.tCur.value = picture.texture;
  taau.uniforms.tCur.value = picture.texture;
  out.uniforms.tBlur.value = picture.texture;
}

function run(material, target) {
  const { renderer, quad, kit } = pass;
  quad.material = material;
  renderer.setRenderTarget(target);
  if (!kit) return quad.render(renderer);
  // (WebGPURenderer: the pass's textures as its uniforms say, and the last
  // drawn to the screen as it is - look/glsl/effectsnode.js.)
  material.userData.sync?.();
  if (target) quad.render(renderer);
  else kit.straightToScreen(renderer, () => quad.render(renderer));
}

// The occlusion, softened, into pass.a.
function occlusion(camera) {
  const { a, b, ao, blur } = pass;
  ao.uniforms.projection.value.copy(camera.projectionMatrix);
  ao.uniforms.inverseProjection.value.copy(camera.projectionMatrixInverse);
  blur.uniforms.inverseProjection.value.copy(camera.projectionMatrixInverse);
  ao.uniforms.texel.value.set(1 / a.width, 1 / a.height);
  blur.uniforms.texel.value.set(1 / a.width, 1 / a.height);
  run(ao, a);
  blur.uniforms.tAO.value = a.texture;
  blur.uniforms.dir.value.set(1, 0);
  run(blur, b);
  blur.uniforms.tAO.value = b.texture;
  blur.uniforms.dir.value.set(0, 1);
  run(blur, a);
  return a.texture;
}

// A blur of `from` one way into `two`, then the other way back into `one`
// (never reading what's being drawn: `from` may be `one`'s texture, never
// `two`'s), returning `one`'s texture.
function soften(from, one, two, spread = 1) {
  const { soft } = pass;
  soft.uniforms.texel.value.set(spread / one.width, spread / one.height);
  soft.uniforms.tColor.value = from;
  soft.uniforms.dir.value.set(1, 0);
  run(soft, two);
  soft.uniforms.tColor.value = two.texture;
  soft.uniforms.dir.value.set(0, 1);
  run(soft, one);
  return one.texture;
}

// Draws a frame: draw() draws the scene (into the buffer), then whatever's
// on, and on to the screen.
// TAA's frame: whether it's a resting check (the picture paused: not
// nudged, so it settles still) and whether the camera cut (what came
// before is dropped). From app.js, each frame drawn.
let taaStill = false;
export function setTaaFrame({ still = false, cut = false } = {}) {
  taaStill = still;
  if (cut && pass) pass.taaFresh = true;
}

// In a flyover on Ultra, how far away the ball is (metres): the camera
// focused there (sim/ultra.mjs focusBlur). null: no focus, nothing blurred
// for it - while a shot's being played, always.
let focus = null;
export function setFocus(metres) {
  focus = Number.isFinite(metres) && metres > 0 ? metres : null;
}

// Where the sun is in the picture: uv (0 - 1) and how strong the shafts
// are for it (sim/ultra.mjs shaftsStrength).
const sunAt = new THREE.Vector3();
const facing = new THREE.Vector3();
function sunInPicture(camera) {
  const dir = sunDirection();
  camera.getWorldDirection(facing);
  sunAt.copy(camera.position).addScaledVector(dir, 1000).project(camera);
  const k = shaftsStrength({ x: sunAt.x, y: sunAt.y, ahead: facing.dot(dir) > 0 });
  return { u: sunAt.x * 0.5 + 0.5, v: sunAt.y * 0.5 + 0.5, k };
}

// The rays from the sun into pass.s1, or null when there are none (the
// sun behind, or well out of the picture).
// src: the picture to take the sky's light from (TAA's, steadied, when
// it's on).
function shafts(camera, exposure, src, srcAt = pass.picture) {
  const { picture, s1, s2, shaftSrc, shaft } = pass;
  const sun = sunInPicture(camera);
  if (sun.k <= 0) return null;
  shaftSrc.uniforms.tColor.value = src;
  shaftSrc.uniforms.fullTexel.value.set(1 / srcAt.width, 1 / srcAt.height);
  shaftSrc.uniforms.sun.value.set(sun.u, sun.v);
  shaftSrc.uniforms.aspect.value = picture.width / Math.max(1, picture.height);
  shaftSrc.uniforms.exposure.value = exposure;
  run(shaftSrc, s2);
  shaft.uniforms.tSrc.value = s2.texture;
  shaft.uniforms.sun.value.set(sun.u, sun.v);
  run(shaft, s1);
  return { texture: s1.texture, k: sun.k };
}

// scene: the one draw() draws - its 3D clouds (look/volclouds.js), if it
// has them, are drawn on their own at a quarter of the pixels and laid
// into the sky here, rather than worked out for every pixel of it.
export function drawWithEffects(camera, draw, scene = null) {
  fit();
  // (Eased while the camera flies: look/renderscale.js pictureEased.)
  useSet(pass.fly && pictureEased() ? pass.fly : pass.full);
  const { renderer, picture, h1, h2, q1, q2, ldr, down, out, fxaa } = pass;
  const before = renderer.getRenderTarget();
  const vol = scene?.userData.env?.volume;
  const lowClouds = !!(vol && vol.visible && vol.parent);
  if (lowClouds) vol.visible = false;
  renderer.setRenderTarget(picture);
  // TAA: the camera nudged a fraction of a pixel for the drawing alone.
  const useTaa = !!on.taa && !shed.taa;
  // (Upscaled: the picture drawn smaller, its set's - fit.)
  const up = useTaa && !!pass.set.upscale;
  const unjittered = useTaa ? camera.projectionMatrix.clone() : null;
  const [jx, jy] = useTaa ? taaJitter(pass.taaFrame++, { still: taaStill, upscale: up }) : [0, 0];
  if (useTaa) {
    camera.projectionMatrix.elements[8] += (jx * 2) / picture.width;
    camera.projectionMatrix.elements[9] += (jy * 2) / picture.height;
  }
  draw();
  if (useTaa) camera.projectionMatrix.copy(unjittered);
  if (lowClouds) {
    vol.visible = true;
    const clear = renderer.getClearColor(new THREE.Color());
    const alpha = renderer.getClearAlpha();
    renderer.setRenderTarget(pass.clouds);
    renderer.setClearColor(0x000000, 0);
    renderer.clear(true, false, false);
    renderer.render(vol, camera);
    renderer.setClearColor(clear, alpha);
    renderer.setRenderTarget(picture);
  }
  out.uniforms.tClouds.value = lowClouds ? pass.clouds.texture : black;
  out.uniforms.cloudsOn.value = lowClouds ? 1 : 0;
  out.uniforms.cloudTexel.value.set(1 / pass.clouds.width, 1 / pass.clouds.height);
  const exposure = renderer.toneMappingExposure;
  const useAO = on.ao && !shed.ao;
  const useBloom = on.bloom && !shed.bloom;
  const useDof = on.dof && !shed.dof;
  const useShafts = !!on.shafts && !shed.shafts;
  const useFocus = !!on.focus && !shed.focus && focus !== null;
  const u = out.uniforms;
  u.tAO.value = useAO ? occlusion(camera) : white;
  u.aoStrength.value = useAO ? AO.strength : 0;
  u.show.value = useAO && AO.show ? 1 : 0;
  const useBounce = ULTRA && useAO;
  // TAA: this frame blended with those before, into the history; the
  // last pass then reads that instead of the picture - and so do the
  // bloom, the glow, the far blur and the sun shafts, worked out from it
  // rather than from this frame's nudged picture, which made them shimmer
  // through the leaves.
  u.tColor.value = picture.texture;
  // (What's read from here on: the picture, or TAA's full-size one.)
  let steadyAt = picture;
  if (useTaa) {
    const { t1, t2 } = pass;
    // Upscaled: TAA builds the full-size picture (TAAU_FRAG).
    const taa = up ? pass.taau : pass.taa;
    const viewProj = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    taa.uniforms.invViewProj.value.copy(viewProj).invert();
    taa.uniforms.prevViewProj.value.copy(pass.taaFresh ? viewProj : pass.prevViewProj);
    // (Last frame's, from this set or the other: never t1, written now.)
    taa.uniforms.tHist.value = (pass.hist ?? t2).texture;
    if (up) {
      taa.uniforms.inner.value.set(picture.width, picture.height);
      taa.uniforms.jitter.value.set(jx, jy);
    } else taa.uniforms.texel.value.set(1 / picture.width, 1 / picture.height);
    taa.uniforms.blend.value = pass.taaFresh || !pass.hist ? 0 : TAA.blend;
    run(taa, t1);
    u.tColor.value = t1.texture;
    steadyAt = t1;
    pass.t1 = pass.set.t1 = t2;
    pass.t2 = pass.set.t2 = t1;
    pass.hist = t1;
    pass.prevViewProj.copy(viewProj);
    pass.taaFresh = false;
  } else {
    pass.taaFresh = true;
    pass.hist = null;
  }
  const steady = u.tColor.value;
  if (useBloom || useDof || useFocus || useShafts || useBounce) {
    // The picture at half size: the far blur's source, and the bloom's.
    down.uniforms.tColor.value = steady;
    down.uniforms.texel.value.set(1 / steadyAt.width, 1 / steadyAt.height);
    down.uniforms.threshold.value = 0;
    down.uniforms.cap.value = PICTURE_CAP;
    run(down, h1);
  }
  if (useBounce) {
    // The picture at an eighth, spread wide (from the half-size copy,
    // before the far blur's taken it).
    const { n1, n2 } = pass;
    down.uniforms.tColor.value = h1.texture;
    down.uniforms.texel.value.set(1 / h1.width, 1 / h1.height);
    down.uniforms.threshold.value = 0;
    down.uniforms.cap.value = BOUNCE.cap;
    run(down, n1);
    soften(n1.texture, n1, n2, 2);
    u.tBounce.value = soften(n1.texture, n1, n2, 3);
  } else u.tBounce.value = black;
  u.bounceStrength.value = useBounce ? BOUNCE.strength : 0;
  // Ultra: drops on the lens in heavy rain (look/lens.js).
  u.lensRain.value = ULTRA ? lens.rain : 0;
  u.lensTime.value = lens.time;
  u.heat.value = ULTRA ? lens.heat : 0;
  if (u.heat.value > 0) u.inverseProjection.value.copy(camera.projectionMatrixInverse);
  if (useDof || useFocus) {
    // (h1 to h2 one way, back to h1 the other: h1 holds it.) A flyover's
    // focus mixes in the same softened picture.
    u.tBlur.value = soften(h1.texture, h1, h2, 1.5);
    u.inverseProjection.value.copy(camera.projectionMatrixInverse);
  }
  u.dofAmount.value = useDof ? DOF.amount : 0;
  u.focusAmount.value = useFocus ? FOCUS.amount : 0;
  const range = useFocus ? focusRange(focus) : null;
  if (range) {
    u.focusNear.value.set(...range.near);
    u.focusFar.value.set(...range.far);
  }
  if (useBloom) {
    // Only the brightest, at a quarter size, spread wide - from the full
    // picture, each pixel's own depth telling the sky from a glint.
    down.uniforms.tColor.value = steady;
    down.uniforms.texel.value.set(1 / steadyAt.width, 1 / steadyAt.height);
    down.uniforms.threshold.value = BLOOM.threshold;
    down.uniforms.cap.value = BLOOM.cap;
    down.uniforms.exposure.value = exposure;
    run(down, q1);
    soften(q1.texture, q1, q2, 1);
    u.tBloom.value = soften(q1.texture, q1, q2, 2);
  } else u.tBloom.value = black;
  u.bloomStrength.value = useBloom ? BLOOM.strength : 0;
  // Ultra's wider glow round the glints comes with the shafts: only the
  // very brightest, spread wider than the bloom.
  if (useShafts) {
    const { g1, g2 } = pass;
    down.uniforms.tColor.value = steady;
    down.uniforms.texel.value.set(1 / steadyAt.width, 1 / steadyAt.height);
    down.uniforms.threshold.value = GLOW.threshold;
    down.uniforms.cap.value = GLOW.cap;
    down.uniforms.exposure.value = exposure;
    run(down, g1);
    soften(g1.texture, g1, g2, 2);
    u.tGlow.value = soften(g1.texture, g1, g2, 4);
  } else u.tGlow.value = black;
  u.glowStrength.value = useShafts ? GLOW.strength : 0;
  const rays = useShafts ? shafts(camera, exposure, steady, steadyAt) : null;
  u.tShafts.value = rays ? rays.texture : black;
  u.shaftsStrength.value = rays ? SHAFTS.strength * rays.k : 0;
  u.grade.value = on.grade ? 1 : 0;
  // (Read each frame: the numbers can be tried out live.)
  u.natural.value.set(NATURAL.saturation, NATURAL.vibrance);
  u.naturalHue.value.set(NATURAL.hue, NATURAL.near, NATURAL.far);
  u.contrast.value = GRADE.contrast;
  u.aspect.value = picture.width / Math.max(1, picture.height);
  u.exposure.value = exposure;
  if (on.fxaa && !useTaa) {
    run(out, ldr);
    fxaa.uniforms.tDiffuse.value = ldr.texture;
    fxaa.uniforms.resolution.value.set(1 / ldr.width, 1 / ldr.height);
    run(fxaa, before);
  } else run(out, before);
}
