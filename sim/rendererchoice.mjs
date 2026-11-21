// Which renderer draws the game. Every player: three.js's WebGLRenderer, as
// always. The WebGPU port (docs/BACKLOG-GRAPHICS.md, "Finishing the WebGPU port") is
// checked a piece at a time behind a hidden switch in the page's address,
// which nothing remembers - the next load without it is WebGL again:
//
//   ?renderer=webgpu     three.js's WebGPURenderer on WebGPU (on its own
//                        WebGL 2 where the browser has no WebGPU)
//   ?renderer=webgpu-gl  WebGPURenderer on its WebGL 2: the ported (node)
//                        materials without WebGPU, as the lower settings
//                        may one day be drawn
//
// On WebGPURenderer, what isn't ported yet draws plain (a patched material:
// its patch is left out) or not at all (a shader of the game's own) -
// look/gpu.js counts both, for the report and tools/picturecompare.mjs.

export const RENDERERS = Object.freeze({
  webgl: "WebGL",
  webgpu: "WebGPU",
  "webgpu-gl": "WebGPU renderer on WebGL 2",
});

// The renderer the address asks for: "webgl", "webgpu" or "webgpu-gl".
// Anything else, or nothing, is WebGL.
export function chooseRenderer(search = "") {
  let asked = null;
  try {
    asked = new URLSearchParams(search).get("renderer");
  } catch {
    // WebGL.
  }
  const kind = String(asked ?? "").trim().toLowerCase();
  return Object.hasOwn(RENDERERS, kind) ? kind : "webgl";
}

// What the report says drew the game: `drawn`, what did ("webgl",
// "webgpu", or "webgpu-gl": look/gpu.js rendererKind), and `asked`, what
// the address asked for - they differ where WebGPURenderer found no WebGPU
// (and drew on its WebGL 2), or couldn't start at all (WebGL, as always).
export function rendererName(drawn, asked = drawn) {
  if (drawn === "webgpu") return RENDERERS.webgpu;
  if (drawn === "webgpu-gl") return asked === "webgpu" ? `${RENDERERS["webgpu-gl"]} (no WebGPU here)` : RENDERERS["webgpu-gl"];
  return asked === "webgpu" || asked === "webgpu-gl" ? `${RENDERERS.webgl} (WebGPURenderer couldn't start)` : RENDERERS.webgl;
}
