// The tree-patch hook: each tree's crown in patches of its own - a few
// metres across, one a touch lighter and warmer, the next deeper and
// cooler - laid over its shape's own (look/trees.js CROWN_DEPTH.patch, the
// same on every tree of that shape) by where the tree stands, so two trees
// of one shape side by side are no longer the same tree twice (backlog 4:
// "more variation", for nothing - no more to draw). Its crown, its leaf
// cards and a willow's strands; anything else is left exactly as it was.
// The far woods' pictures (look/treeatlas.js) are of each shape as it is.
// And each tree mottled its own way (the owner, 27 October 2026: "find
// smart ways to vary even further"): from its seed, how strongly - some
// crowns near even, some boldly patched (TREE_PATCH.spread) - and how big
// its patches are (TREE_PATCH.sizes). Changing what it does must change
// TREE_PATCH_KEY.

import { BENDS } from "./bend.js";

// amount: lighter or darker at most, a share of its colour; size: a
// patch's width, metres (of the shape as made, before each tree's own
// size); warm: how much more of each of red, green and blue a lighter
// patch takes (and a darker one gives up) - yellower lit, bluer in shade.
// spread: each tree's amount between these shares of `amount`; sizes:
// its patches between these shares of `size`.
export const TREE_PATCH = { amount: 0.1, size: 7, warm: [1.1, 1, 0.6], spread: [0.45, 1.55], sizes: [0.7, 1.4] };
export const TREE_PATCH_KEY = "tp2";
export const PATCHED = new Set(["crown", "cards", "strands"]);

const f = (v) => (Number.isInteger(v) ? `${v}.0` : `${v}`);

// Where the tree stands, from its own matrix (as the bend hook has it).
const INSTANCE = `
  #if defined( USE_BATCHING )
    mat4 pM = modelMatrix * getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
  #elif defined( USE_INSTANCING )
    mat4 pM = modelMatrix * instanceMatrix;
  #else
    mat4 pM = modelMatrix;
  #endif`;

// The patches' sum, shared with the node version's description: the
// shape's own point p (metres) and the tree's seed s (0 - 1) to a value
// from -1 to 1.
export const PATCH_SUM = "sin(p.x * k + s * 6.2832) * sin(p.y * k * 0.8 + s * 11.0) * sin(p.z * k + s * 17.0)";
// A tree's own amount and patch size, from its seed: two more numbers
// drawn from it (0 - 1).
export const PATCH_OWN = { amount: [7.13, 0.37], size: [3.71, 0.61] };

export function treePatch(shader, kind) {
  if (!PATCHED.has(kind) || !BENDS[kind]) return shader;
  const P = TREE_PATCH;
  shader.vertexShader = shader.vertexShader.replace(
    "#include <project_vertex>",
    `#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
    {
      ${INSTANCE}
      vec3 pFoot = (pM * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
      float s = fract(sin(dot(floor(pFoot.xz * 4.0), vec2(12.9898, 78.233))) * 43758.5453);
      vec3 p = position;
      float pA = fract(s * ${f(PATCH_OWN.amount[0])} + ${f(PATCH_OWN.amount[1])});
      float pS = fract(s * ${f(PATCH_OWN.size[0])} + ${f(PATCH_OWN.size[1])});
      float k = ${f((2 * Math.PI) / P.size)} / mix(${f(P.sizes[0])}, ${f(P.sizes[1])}, pS);
      float pv = ${PATCH_SUM};
      vColor.rgb *= vec3(1.0) + ${f(P.amount)} * mix(${f(P.spread[0])}, ${f(P.spread[1])}, pA) * pv * vec3(${P.warm.map(f).join(", ")});
    }
    #endif
    #include <project_vertex>`,
  );
  return shader;
}
