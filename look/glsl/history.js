// The frames before read sharply (sim/history.mjs): TAA's history at a spot
// between its pixels, with a Catmull-Rom curve in five reads - so a moving
// picture keeps its detail. For a fragment shader with tame and sane
// already in it (look/effects.js TAA_FRAG, TAAU_FRAG): each read is folded
// into 0 - 1 before the curve's weights, so the sun's glint doesn't ring.
// size: the history's own, in pixels.
export const HISTORY_GLSL = /* glsl */ `
  vec3 histAt(sampler2D tex, vec2 uv, vec2 size) {
    vec2 pos = uv * size;
    vec2 c = floor(pos - 0.5) + 0.5;
    vec2 f = pos - c;
    vec2 w0 = f * (-0.5 + f * (1.0 - 0.5 * f));
    vec2 w1 = 1.0 + f * f * (-2.5 + 1.5 * f);
    vec2 w2 = f * (0.5 + f * (2.0 - 1.5 * f));
    vec2 w3 = f * f * (-0.5 + 0.5 * f);
    vec2 w12 = w1 + w2;
    vec2 t12 = (c + w2 / w12) / size;
    vec2 t0 = (c - 1.0) / size;
    vec2 t3 = (c + 2.0) / size;
    float wc = w12.x * w12.y;
    float wl = w0.x * w12.y;
    float wr = w3.x * w12.y;
    float wd = w12.x * w0.y;
    float wu = w12.x * w3.y;
    vec3 s = tame(sane(texture2D(tex, t12).rgb)) * wc
      + tame(sane(texture2D(tex, vec2(t0.x, t12.y)).rgb)) * wl
      + tame(sane(texture2D(tex, vec2(t3.x, t12.y)).rgb)) * wr
      + tame(sane(texture2D(tex, vec2(t12.x, t0.y)).rgb)) * wd
      + tame(sane(texture2D(tex, vec2(t12.x, t3.y)).rgb)) * wu;
    return max(s / (wc + wl + wr + wd + wu), vec3(0.0));
  }
`;
