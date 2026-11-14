// The see-through hook: a tree's trunk thins to a ghost of itself as the
// camera comes up to it, and its leaves as they all but touch the lens
// (sim/seethrough.mjs, whose numbers and pattern these are). A material
// asks for it with userData.seeThrough - "trunk" or "leaves" - set by
// look/trees.js; anything else is left exactly as it was. Solid crowns
// (Standard's, and the far trees') don't ask: they're sorted near to far
// so the graphics card can skip what's behind them, and a shader that can
// leave pixels out loses that. Changing what it does must change
// SEE_THROUGH_KEY.

import { SEE_THROUGH, seeThroughGlsl } from "../../sim/seethrough.mjs";

export const SEE_THROUGH_KEY = "st1";

export function seeThrough(shader, part) {
  const fade = SEE_THROUGH[part];
  if (!fade) return shader;
  shader.fragmentShader = shader.fragmentShader.replace("#include <alphatest_fragment>", `#include <alphatest_fragment>\n${seeThroughGlsl(fade)}`);
  return shader;
}
