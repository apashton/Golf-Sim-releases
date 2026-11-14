// The renderer, whichever draws the game (sim/rendererchoice.mjs): every
// player's WebGLRenderer, or - behind the hidden ?renderer= switch -
// three.js's WebGPURenderer, for checking the WebGPU port a piece at a time.
// What the game asks of a renderer that the two answer differently is asked
// here, so the rest of the game needn't know which it has: making it, the
// graphics card's name, a card reset, a frame's draw calls, the shader
// programs built, drawing many things in one call, building shaders in the
// background, waiting for the card, and a picture to draw into.

import * as THREE from "three";
import { portSurvey } from "../sim/portcheck.mjs";
import { setTwinsActive } from "./twins.js";

// Whether the game is drawn by WebGPURenderer (with node materials): set as
// the renderer is made.
let nodes = false;
export const drawnWithNodes = () => nodes;
// The renderer made (for tools/picturecompare.mjs and the checks).
let made = null;
export const gameRenderer = () => made;
// The node versions of the game's own materials (look/nodetwins.js), on
// WebGPURenderer only: null on WebGL.
let kit = null;
export const nodeKit = () => kit;

// The renderer for `kind` ("webgl", "webgpu", "webgpu-gl"), ready to draw.
// WebGPURenderer is loaded only when asked for (it's large), and where it
// can't start at all the game is drawn with WebGL as always - the switch
// never leaves a blank picture.
export async function makeRenderer(kind, params = {}) {
  if (kind === "webgpu" || kind === "webgpu-gl") {
    try {
      plainSwizzle();
      const { WebGPURenderer } = await import("three/webgpu");
      const renderer = new WebGPURenderer({ ...params, forceWebGL: kind === "webgpu-gl" });
      await renderer.init();
      // (Before any scenery is made: each marked material made from here
      // has a program of its own - look/twins.js.)
      kit = await import("./nodetwins.js");
      setTwinsActive(true);
      await leaveOutUnported(renderer);
      nodes = true;
      made = renderer;
      return renderer;
    } catch (err) {
      console.error("WebGPURenderer couldn't start: drawn with WebGL", err);
    }
  }
  nodes = false;
  made = new THREE.WebGLRenderer(params);
  return made;
}

// three.js gives every texture view WebGPU's plain swizzle ("rgba": each
// colour where it is), in the form newer browsers take; an older one
// (Chromium 141: the headless browser the checks run in) takes only an
// earlier form and throws on it. Left out there, which is the same thing.
function plainSwizzle() {
  const proto = globalThis.GPUTexture?.prototype;
  if (!proto?.createView || proto.createView.plainSwizzle) return;
  const make = proto.createView;
  const without = (d) => {
    const { swizzle, ...rest } = d;
    return rest;
  };
  let strip = false;
  const createView = function (d) {
    if (d?.swizzle !== "rgba") return make.call(this, d);
    if (strip) return make.call(this, without(d));
    try {
      return make.call(this, d);
    } catch (err) {
      if (!(err instanceof TypeError)) throw err;
      strip = true;
      return make.call(this, without(d));
    }
  };
  createView.plainSwizzle = true;
  proto.createView = createView;
}

// What draws the game: "webgl", "webgpu", or "webgpu-gl" (WebGPURenderer on
// its WebGL 2, asked for or where the browser has no WebGPU).
export function rendererKind(renderer) {
  if (!renderer?.isWebGPURenderer) return "webgl";
  return renderer.backend?.isWebGPUBackend ? "webgpu" : "webgpu-gl";
}

// A shader of the game's own (ShaderMaterial) has no node material for
// WebGPURenderer to make from it; three.js would log an error for each and
// draw it in a blank material over everything. Left out instead, until it's
// ported (sim/portcheck.mjs counts what's left).
async function leaveOutUnported(renderer) {
  const lib = renderer.library;
  if (!lib?.fromMaterial) return;
  const { MeshBasicNodeMaterial } = await import("three/webgpu");
  const { uniform } = await import("three/tsl");
  // (Every pixel thrown away - its mask false. Told by a number the shader
  // can't know ahead: a mask false in its own words let the shader drop
  // its output altogether, and the WebGL 2 side warned of that every draw.)
  const shown = uniform(0);
  const from = lib.fromMaterial.bind(lib);
  lib.fromMaterial = (m) => {
    // A patched material or a shader of the game's own with a node
    // version (look/nodetwins.js): that.
    const twin = m.isNodeMaterial ? null : kit?.nodeFor(m, from);
    if (twin) return twin;
    const node = from(m);
    if (node) return node;
    const none = new MeshBasicNodeMaterial();
    none.maskNode = shown.greaterThan(0.5);
    return none;
  };
}

// What's left of the port in a scene (sim/portcheck.mjs): null on WebGL,
// where everything is drawn as it was made.
export function portFacts(scene) {
  return nodes && scene ? portSurvey(scene, THREE.Material.prototype.onBeforeCompile) : null;
}

// The graphics card's name and maker, for reports - read once, as the page
// starts (asking waits for the card to finish what it's doing).
export async function readCard(renderer) {
  const facts = { gpu: "", vendor: "" };
  try {
    if (rendererKind(renderer) === "webgpu") {
      const info = renderer.backend.device?.adapterInfo ?? (await navigator.gpu?.requestAdapter())?.info ?? {};
      facts.gpu = String(info.description || [info.vendor, info.architecture, info.device].filter(Boolean).join(" ") || "");
      facts.vendor = String(info.vendor ?? "");
      return facts;
    }
    const gl = renderer.isWebGPURenderer ? renderer.backend?.gl : renderer.getContext();
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    facts.gpu = String(gl.getParameter(dbg ? dbg.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? "");
    facts.vendor = String(gl.getParameter(dbg ? dbg.UNMASKED_VENDOR_WEBGL : gl.VENDOR) ?? "");
  } catch {
    // Left blank.
  }
  return facts;
}

// Calls `told(type, why)` when the graphics card resets the picture (the
// driver restarted it): "context-lost" and "context-restored" on WebGL,
// "device-lost" on WebGPU (which isn't given back: the page is reloaded).
export function onCardReset(renderer, told) {
  if (rendererKind(renderer) === "webgpu") {
    const was = renderer.onDeviceLost;
    renderer.onDeviceLost = (info) => {
      told("device-lost", info?.message ?? "");
      was?.call(renderer, info);
    };
    return;
  }
  renderer.domElement.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    told("context-lost", "");
  });
  renderer.domElement.addEventListener("webglcontextrestored", () => told("context-restored", ""));
}

// What the frame drew, counted over the whole frame (app.js resets the
// count as each frame starts): WebGL counts draw calls in `calls`;
// WebGPURenderer counts every render() there and its draws in `drawCalls`.
// Two parts of it are counted apart too (in `triangles` and `calls`), as
// the picture's own count jumped by them on each frame that drew them (the
// owner, 20 and 29 October 2026: "constantly flicking between 865k
// triangles and 1.54 million", "Triangle count flicker still happening"):
// shadows and shadowCalls, the shadow maps drawn again this frame
// (countShadowDraws), and reflections and reflectionCalls, Ultra's water
// drawn mirrored - every other frame while the camera's still
// (look/mirrors.js; countPart).
export function frameDraws(renderer) {
  const p = partsOf(renderer);
  return {
    calls: callsOf(renderer),
    triangles: renderer.info.render.triangles ?? 0,
    shadows: p.shadows.triangles,
    shadowCalls: p.shadows.calls,
    reflections: p.reflections.triangles,
    reflectionCalls: p.reflections.calls,
  };
}

const callsOf = (renderer) => {
  const r = renderer.info.render;
  return (renderer.isWebGPURenderer ? r.drawCalls : r.calls) ?? 0;
};
// Each renderer's parts, { triangles, calls } each, from each reset of its
// count.
const PARTS = ["shadows", "reflections"];
const parts = new WeakMap();
function partsOf(renderer) {
  let p = parts.get(renderer);
  if (!p) parts.set(renderer, (p = Object.fromEntries(PARTS.map((k) => [k, { triangles: 0, calls: 0 }]))));
  return p;
}

// Counts the parts apart from each reset of the renderer's count, and what
// the shadow maps draw (WebGL: three.js draws them in its shadowMap.render,
// as each render() starts). WebGPURenderer draws its maps its own way:
// none said.
export function countShadowDraws(renderer) {
  const info = renderer.info;
  const reset = info.reset.bind(info);
  info.reset = () => {
    for (const part of Object.values(partsOf(renderer))) {
      part.triangles = 0;
      part.calls = 0;
    }
    reset();
  };
  const map = renderer.shadowMap;
  if (renderer.isWebGPURenderer || typeof map?.render !== "function") return;
  const own = map.render.bind(map);
  map.render = (...args) => {
    const triangles = info.render.triangles;
    const calls = callsOf(renderer);
    own(...args);
    const s = partsOf(renderer).shadows;
    s.triangles += info.render.triangles - triangles;
    s.calls += callsOf(renderer) - calls;
  };
}

// What draw() adds to the frame's count, kept as its part ("reflections"),
// less any shadow map drawn in it (the shadows' own).
export function countPart(renderer, part, draw) {
  const p = partsOf(renderer);
  const info = renderer.info.render;
  const triangles = info.triangles;
  const calls = callsOf(renderer);
  const shadows = { ...p.shadows };
  try {
    return draw();
  } finally {
    p[part].triangles += info.triangles - triangles - (p.shadows.triangles - shadows.triangles);
    p[part].calls += callsOf(renderer) - calls - (p.shadows.calls - shadows.calls);
  }
}

// three.js's list of the shader programs it has built (sim/keepprograms.mjs
// keeps each). WebGPURenderer keeps its own (pipelines, cached for the
// page): nothing to list or keep.
export function programList(renderer) {
  return renderer.isWebGPURenderer ? [] : (renderer.info.programs ?? []);
}
export function programCount(renderer) {
  return renderer.isWebGPURenderer ? (renderer.info.memory?.programs ?? 0) : (renderer.info.programs?.length ?? 0);
}

// Whether many things can be drawn in one call (the trees' batches,
// look/trees.js): on WebGL, and WebGPURenderer's WebGL 2, where the card has
// WEBGL_multi_draw. WebGPU has no such call: three.js draws a batch there a
// call for each thing in it (the range from above took 1514 calls a frame,
// against 108 on WebGL), so its trees go one instanced mesh per kind and
// shape (235 calls).
export function drawsManyAtOnce(renderer) {
  try {
    const kind = rendererKind(renderer);
    if (kind === "webgpu") return false;
    if (kind === "webgpu-gl") return !!renderer.hasFeature?.("WEBGL_multi_draw");
    return !!renderer?.extensions?.has?.("WEBGL_multi_draw");
  } catch {
    return false;
  }
}

// Whether shaders are built in the background (look/warmup.js): WebGPU
// always builds them so; WebGL where the card can (KHR_parallel_shader_compile).
export function buildsShadersInBackground(renderer) {
  try {
    if (rendererKind(renderer) === "webgpu") return true;
    const ext = renderer?.isWebGPURenderer ? renderer.backend?.extensions : renderer?.extensions;
    return !!ext?.has?.("KHR_parallel_shader_compile");
  } catch {
    return false;
  }
}

// Waits, there and then, for the card to finish what it's been asked to do
// (look/warmup.js settle): on WebGL by reading back one pixel (the
// browser's finish() doesn't wait). WebGPU's compileAsync resolves only
// once its pipelines are built: nothing to wait for here.
const pixel = new Uint8Array(4);
export function waitForCard(renderer) {
  try {
    if (rendererKind(renderer) === "webgpu") return;
    const gl = renderer.isWebGPURenderer ? renderer.backend?.gl : renderer?.getContext?.();
    gl?.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
  } catch {
    // Had as the next frame is drawn.
  }
}

// A picture to draw into, for the renderer drawing the game: three's
// RenderTarget on WebGPURenderer, its WebGL one on WebGL.
export function renderTarget(width, height, options = {}) {
  return nodes ? new THREE.RenderTarget(width, height, options) : new THREE.WebGLRenderTarget(width, height, options);
}

// Points sized in their own shader (look/sprays.js, look/motes.js): WebGL
// draws them as points, as many pixels across as the shader says; WebGPU
// draws a point one pixel across. So on WebGPURenderer each is a copy of a
// small square instead (three's own way: an instanced quad, placed and
// sized in look/glsl/spritenode.js): this is the square, `count` copies of
// it, for the caller's own attributes for each copy
// (InstancedBufferAttribute).
export function quadCopies(count) {
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  geo.instanceCount = count;
  return geo;
}
