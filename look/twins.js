// A material's node version for three.js's WebGPURenderer (the WebGPU port:
// docs/BACKLOG-GRAPHICS.md, "Finishing the WebGPU port"). A patched
// material - or a shader of the game's own - is marked with what it is and
// the options it was made with (markTwin); on WebGPURenderer only,
// look/nodetwins.js makes its node version from that as the renderer comes
// to draw it, and the material itself is left as it is, so the WebGL
// picture never changes for it. Small and loaded everywhere: the node
// versions, and three.js's WebGPU build, are loaded only on WebGPURenderer
// (look/gpu.js makeRenderer).

// Whether the node versions are made (on WebGPURenderer: look/gpu.js).
let active = false;
export const twinsActive = () => active;
export function setTwinsActive(on) {
  active = !!on;
}

let made = 0;

// Marks `material` as a `kind` of node version (look/nodetwins.js
// TWIN_KINDS), made from `options` (what it was made with, and anything of
// its own - a uniform it moves - the node version should follow). On
// WebGPURenderer each marked material also gets a program of its own: its
// node version's uniforms are its own, not the first such material's.
export function markTwin(material, kind, options = {}) {
  material.userData.twin = { kind, options };
  if (active) {
    const id = ++made;
    const own = Object.prototype.hasOwnProperty.call(material, "customProgramCacheKey") ? material.customProgramCacheKey : null;
    material.customProgramCacheKey = () => `${own ? own.call(material) : ""}#twin${id}`;
  }
  return material;
}
