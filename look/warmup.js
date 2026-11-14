// Shader programs built ahead of the moment they're first drawn. Building
// one stops the picture while the graphics card compiles it - a fraction of
// a second on a Windows card, a visible freeze - so a shader first needed
// at the strike (the tracer) or on coming into a scene (Challenges' ground)
// froze the picture just as it mattered. The modes' scenes are compiled as
// the page loads, behind the loading screen (app.js: the mode it opens in
// first, so its picture can be drawn soonest); this does the same for
// what's built later: the
// tracers of every style and look, a celebration's confetti and sparks
// (look/celebrate.js celebrationWarmers), and a scene's new scenery as it's
// built.
// The long frames in a report (sim/longframes.mjs) say if one still slips
// through ("new shaders").

import * as THREE from "three";
import { makeTracer, sharedTracerMaterial } from "./tracer.js";
import { markReadable } from "./weatherlook.js";
import { TRACER_STYLES, LOOKS } from "../sim/tracer.mjs";
import { pictureTarget } from "./effects.js";
import { buildsShadersInBackground, waitForCard } from "./gpu.js";

// A scene's programs compiled now, in the background where the graphics
// card can (compileAsync, KHR_parallel_shader_compile), or at once.
// `objects`: a group not in the scene, compiled with the scene's lights,
// fog and shadows (as it will be drawn there), or a list of them. Never
// throws: anything left is built as it's first drawn, as before.
// Resolves once they're all ready to draw without waiting (at once where
// the card can't say: there they're built by the time it's asked), for
// the loading screen to wait on (app.js); nothing else need wait.
// withScene: false for the objects alone, the scene's own asked for
// already (app.js: the opening mode's, as soon as it's built).
export function warmUp(renderer, scene, camera, objects = null, { withScene = true } = {}) {
  if (!renderer || !scene || !camera) return Promise.resolve();
  const waits = [];
  // (Built for what the picture is drawn into: the effects' buffer, when
  // the picture is finished through one, whose programs have no tone
  // mapping of their own - look/effects.js.)
  const into = pictureTarget();
  const one = (what, target) => {
    const before = renderer.getRenderTarget?.() ?? null;
    try {
      renderer.setRenderTarget?.(into);
      const done = renderer.compileAsync ? renderer.compileAsync(what, camera, target) : renderer.compile(what, camera, target);
      if (done?.then) waits.push(done.catch(() => {}));
    } catch {
      // Built as it's first drawn.
    } finally {
      renderer.setRenderTarget?.(before);
    }
  };
  if (withScene) one(scene, scene);
  for (const o of [objects].flat()) if (o) one(o, scene);
  // And their pictures sent to the graphics card now, not as each is
  // first seen: a texture first in view mid-flight (a tree's bark, the
  // far woods coming over a rise) stalled the frame it appeared in - the
  // speed test's slow start (the owner: "started off slow ... more
  // initial flexibility or smart loading of objects").
  uploadTextures(renderer, [...(withScene ? [scene] : []), ...[objects].flat()]);
  return Promise.all(waits).then(() => {});
}

// Every texture the objects' materials use (their maps, and a shader's
// uniforms), uploaded once each.
const sent = new WeakSet();
export function uploadTextures(renderer, roots) {
  if (!renderer?.initTexture) return 0;
  let n = 0;
  const send = (t) => {
    if (!t?.isTexture || sent.has(t) || t.isRenderTargetTexture || !t.image) return;
    sent.add(t);
    try {
      renderer.initTexture(t);
      n++;
    } catch {
      // Sent as it's first drawn.
    }
  };
  const seen = new Set();
  for (const root of roots) {
    root?.traverse?.((o) => {
      for (const m of [o.material].flat()) {
        if (!m || seen.has(m)) continue;
        seen.add(m);
        for (const v of Object.values(m)) send(v);
        for (const u of Object.values(m.uniforms ?? m.userData?.uniforms ?? {})) send(u?.value);
      }
    });
  }
  return n;
}

// Whether the graphics card builds shaders in the background
// (KHR_parallel_shader_compile on WebGL; always on WebGPU: look/gpu.js).
// Where it can't, a shader asked for is built in the way of the next frame
// drawn, so building a mode's ahead of time while the game is being played
// would freeze it just the same.
export function buildsInBackground(renderer) {
  return buildsShadersInBackground(renderer);
}

// Waits, there and then, for the graphics card to finish everything it's
// been asked to do. Where it can't build shaders in the background, the
// ones asked for are built in turn after the call returns - in the way of
// the next frames drawn, a picture that stands still just after the
// loading screen has gone. Called behind the loading screen, the wait is
// had there instead. (Reading back one pixel: the browser's finish()
// doesn't wait; WebGPU's compileAsync waits for itself: look/gpu.js.)
export function settle(renderer) {
  waitForCard(renderer);
}

// A tracer of every style in each look (look/tracer.js's shared materials:
// one program per style and look, whatever the player's colour), never
// drawn: for warmUp. Made once.
let tracers = null;
export function tracerWarmers() {
  if (tracers) return tracers;
  tracers = new THREE.Group();
  tracers.name = "tracer warm-up";
  const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 5), new THREE.Vector3(0, 0, 10)];
  for (const style of Object.keys(TRACER_STYLES)) {
    for (const look of Object.keys(LOOKS)) {
      const mesh = makeTracer(points, { segments: 8, radial: 3, style });
      if (!mesh) continue;
      mesh.material = sharedTracerMaterial(style, undefined, look);
      // As a shot's tracer is marked (look/tracer.js makeShotTracer) - its
      // bright look; the faint one it's switched to later isn't - so the
      // programs built here are the ones it will use.
      if (look === "last") markReadable(mesh);
      tracers.add(mesh);
    }
  }
  return tracers;
}
