// Trees see-through near the camera. The owner, looking from the ball
// under a tree: "this is ball view... But can only see a tree trunk. Need
// to make the trunk translucent". The camera there is a hand's width above
// the ball, so a trunk the ball has come to rest behind fills the picture.
//
// So a trunk (and its branches) thins out as the camera comes within
// SEE_THROUGH.trunk.far metres of it, down to a ghost of itself - a share
// `least` of its pixels still drawn, so it's plain there's a tree there and
// which side of it the gap is - inside `near`. Leaf cards, willow strands,
// blossom and High's leafy crown do the same only when they all but touch
// the lens: a few metres off they're the low branches the ball view is for.
//
// It's drawn in the trees' own shaders, from each pixel's distance to the
// camera, as a screen-door: a share of the pixels in a fixed 4 x 4 pattern
// left out (see-through) and the rest drawn as before, solid. Nothing is
// sorted or blended, the processor does nothing each frame, and the shadow
// map - drawn with three.js's own depth materials, which don't run it - is
// left exactly as it is: the trunk still casts its shadow.

export const SEE_THROUGH = {
  trunk: { near: 2, far: 5, least: 0.25 },
  leaves: { near: 0.5, far: 1.5, least: 0 },
};

// The share of a part's pixels drawn (0 - 1) with the camera `d` metres
// from it: all of them from `far` out, easing down to `least` at `near`.
export function seeThrough(d, { near, far, least }) {
  const t = Math.min(1, Math.max(0, (d - near) / (far - near)));
  return least + (1 - least) * t * t * (3 - 2 * t);
}

// The 4 x 4 ordered pattern: which pixels go first as a part thins out.
// Each cell's threshold is (BAYER[i] + 0.5) / 16; a pixel is drawn while
// the share is above its cell's, so a half share is every other pixel, a
// quarter one in four, evenly spread - it reads as see-through, not as
// holes.
export const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

// Whether the pixel at screen (x, y) is drawn at a share `cover`.
export function drawnAt(x, y, cover) {
  return cover > (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
}

const f = (v) => (Number.isInteger(v) ? `${v}.0` : `${v}`);

// The fragment shader's half of it, after the alpha test: `vViewPosition`
// is the pixel from the camera (three.js's lit materials have it).
export function seeThroughGlsl(fade) {
  return `{
    float stD = length(vViewPosition);
    if (stD < ${f(fade.far)}) {
      float stT = clamp((stD - ${f(fade.near)}) / ${f(fade.far - fade.near)}, 0.0, 1.0);
      float stCover = ${f(fade.least)} + ${f(1 - fade.least)} * stT * stT * (3.0 - 2.0 * stT);
      const float stBayer[16] = float[16](${BAYER.map(f).join(", ")});
      ivec2 stP = ivec2(gl_FragCoord.xy) & 3;
      if (stCover <= (stBayer[stP.y * 4 + stP.x] + 0.5) / 16.0) discard;
    }
  }`;
}
