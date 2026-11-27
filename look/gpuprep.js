// Shapes and shaders sent to the graphics card in the quiet moments, a few
// objects at a time (sim/idlework.mjs), so the frame they're first seen in
// doesn't have to: a shape's first draw sends it all at once, and a
// shader's first draw holds the page while the card finishes building it
// (on a Windows card a tenth of a second for a small one, most of a second
// for a big one: grass, sand, water, a tree's crown) - and that stall came
// just when it was in view: the next hole's first frame, the first green,
// or mid-flight, as the camera followed the ball over grass and trees it
// hadn't looked at yet (the owner: "flyovers are a set path ... shots are
// mainly within a certain path, certainly for the first seconds"). Three
// kinds:
//
//   - the next hole built ahead (course.js prebuildNext): put in the scene
//     out of sight (hideInScene) and sent whole (sendSteps), shown when
//     it's played (showHidden);
//   - what's new on the hole on show (sendNewSteps): the grass grown round
//     the ball for each shot, and anything not drawn yet - nearest where
//     the camera's about to go first (the flight's or the flyover's path);
//   - a whole scene drawn once where nothing shows (drawAllSteps): the
//     opening mode's behind the loading screen, the round's first hole
//     behind the course's still - with the warmers (the tracers, a
//     celebration, the green's grid and shading, the grass round the ball)
//     that aren't in any scene until they're wanted.
//
// How: each step draws a batch - on a layer of its own, culling off, the
// hidden ones made visible a moment - with the scene's lights (put on that
// layer for the draw: a light the camera can't see lights nothing, and the
// shaders built would be unlit ones the picture never uses), fog and
// shadows, into what the picture is drawn into with nothing let through
// (an empty scissor) and nothing cleared. The picture itself never
// changes: each object is as it was before the next frame.
//
// A batch is a dozen shapes whose shaders have been drawn before - or one
// shape whose shader hasn't (sim/sendplan.mjs), a heavy step
// (sim/idlework.mjs HEAVY) run only in a frame that can take the hold:
// the picture resting, or behind a card. A report had a dozen shapes with
// three or four new shaders drawn in one step while putting, 374 - 2112 ms
// a step, seven steps running. For a heavy batch that casts shadows the
// sun's shadow map is drawn too, with just that batch in it, so the
// shadow pass's own shaders for that kind of shape are built there and
// then rather than in the next frame that casts; the map is drawn again
// whole in the next frame. Every program built is kept for the page's life
// (sim/keepprograms.mjs), so each first drawing is paid for once.

import * as THREE from "three";
import { pictureTarget } from "./effects.js";
import { planBatches } from "../sim/sendplan.mjs";
import { HEAVY } from "../sim/idlework.mjs";

// The layer the objects (and the lights) are drawn on while they're sent.
const PREP_LAYER = 31;
// The shapes sent already (by this or by being drawn after it).
const sent = new WeakSet();
// The shader programs drawn at least once by these steps: a first drawing
// is the heavy part (sim/sendplan.mjs). What a frame itself drew first
// isn't known here, so a program it built may be drawn once more by a
// step of its own: a step wasted at most, never a hold mistaken for a
// light one.
const drawn = new WeakSet();
// Materials drawn by a step that got no program (not visible, nothing of
// theirs drawn): not asked for again.
const unprogrammed = new WeakSet();
// Programs drawn for the first time since last asked, for the frame's
// facts (app.js noteFrame, sim/longframes.mjs).
let firstDraws = 0;
export function takeFirstDraws() {
  const n = firstDraws;
  firstDraws = 0;
  return n;
}

const drawable = (o) => (o.isMesh || o.isPoints || o.isLine || o.isSprite) && !!o.geometry && !!o.material;

// Whether any of o's materials has a program not drawn by a step yet - or
// none built yet (it gets one as it's drawn).
export function fresh(renderer, o) {
  const props = renderer.properties;
  for (const m of [o.material].flat()) {
    if (!m || unprogrammed.has(m)) continue;
    const p = props?.has?.(m) ? props.get(m).currentProgram : undefined;
    if (!p || !drawn.has(p)) return true;
  }
  return false;
}

// Takes root (a group not yet in the scene) into the scene out of sight.
// Returns what's needed to put its objects back as they were (showHidden).
export function hideInScene(scene, root) {
  const kept = new Map();
  root.traverse((o) => {
    kept.set(o, o.layers.mask);
    o.layers.mask = 0;
  });
  scene.add(root);
  return { root, kept };
}

// Its objects drawn as before (once it's the scene's own).
export function showHidden(hidden) {
  if (!hidden) return;
  for (const [o, mask] of hidden.kept) o.layers.mask = mask;
  hidden.kept.clear();
}

// Takes it out of the scene again (thrown away before it was shown).
export function dropHidden(scene, hidden) {
  if (!hidden) return;
  showHidden(hidden);
  scene.remove(hidden.root);
}

// The drawable objects a hidden group holds (those that were to be seen).
function hiddenList(hidden) {
  return [...hidden.kept].filter(([o, mask]) => drawable(o) && mask !== 0).map(([o]) => o);
}

// The steps that send a hidden group: `per` objects drawn each (one, for a
// shader not drawn before).
export function* sendSteps(renderer, scene, camera, hidden, per = 12) {
  yield* drawSteps(renderer, scene, camera, hiddenList(hidden), per);
}

// The steps that send what under root hasn't been sent: those nearest
// `near` (world [x, z] points: where the camera's going) first.
export function* sendNewSteps(renderer, scene, camera, root, { near = null, per = 12 } = {}) {
  const list = [];
  root.traverse((o) => {
    if (drawable(o) && (!sent.has(o.geometry) || fresh(renderer, o)) && o.layers.mask !== 0) list.push(o);
  });
  if (!list.length) return;
  if (near?.length) {
    const at = new THREE.Vector3();
    const gap = (o) => {
      o.getWorldPosition(at);
      let best = Infinity;
      for (const [x, z] of near) best = Math.min(best, (x - at.x) ** 2 + (z - at.z) ** 2);
      return best;
    };
    const d = new Map(list.map((o) => [o, gap(o)]));
    list.sort((a, b) => d.get(a) - d.get(b));
  }
  yield* drawSteps(renderer, scene, camera, list, per);
}

// The steps that draw everything under root once (whether it's showing or
// not: a tree drawn in full only near the camera, the rain), with the
// `warmers` (groups not in the scene, put in it out of sight for the
// draw) - where nothing shows: the opening mode behind the loading screen,
// the first hole behind the course's still. Objects hidden by a
// hideInScene of their own (the next hole, sent by its own steps) are
// left to those.
export function* drawAllSteps(renderer, scene, camera, root, { warmers = [], per = 12 } = {}) {
  const list = [];
  root.traverse((o) => {
    if (drawable(o) && o.layers.mask !== 0) list.push(o);
  });
  const hidden = [];
  for (const w of [warmers].flat()) if (w && !w.parent) hidden.push(hideInScene(scene, w));
  try {
    for (const h of hidden) list.push(...hiddenList(h));
    yield* drawSteps(renderer, scene, camera, list, per);
  } finally {
    for (const h of hidden) dropHidden(scene, h);
  }
}

function* drawSteps(renderer, scene, camera, list, per) {
  const cam = camera.clone();
  cam.layers.set(PREP_LAYER);
  // (Gone since it was listed - the hole moved on - or sent meanwhile, its
  // shader drawn: skipped.)
  const wanted = (o) => inScene(o, scene) && (!sent.has(o.geometry) || fresh(renderer, o));
  for (const b of planBatches(list, (o) => fresh(renderer, o), per)) {
    const batch = b.objects.filter(wanted);
    if (!batch.length) continue;
    // (A shader's first drawing: only in a frame that can take the hold.)
    if (b.heavy) yield HEAVY;
    drawOnce(renderer, scene, cam, batch.filter(wanted), b.heavy);
    // (What the step did, for a report's long frames: sim/idlework.mjs.)
    yield b.heavy ? "drawing a new shader for the first time" : "sending shapes to the card";
  }
}

function inScene(o, scene) {
  for (let p = o; p; p = p.parent) if (p === scene) return true;
  return false;
}

// A batch drawn where nothing shows: into what the picture is drawn into
// (the effects' buffer, or the screen - so the programs built are the ones
// it'll use), with nothing let through (an empty scissor) and nothing
// cleared; the shadow map left as it is - unless the batch is a shader's
// first drawing and casts (heavy): then the map is drawn with the batch
// alone in it, and marked to be drawn again whole in the next frame. Every
// object (and light) put back as it was.
function drawOnce(renderer, scene, cam, batch, heavy = false) {
  if (!batch.length) return;
  const undo = [];
  for (const o of batch) {
    undo.push([o, "mask", o.layers.mask], [o, "culled", o.frustumCulled]);
    o.layers.mask = 1 << PREP_LAYER;
    o.frustumCulled = false;
    // (Hidden ones too - a tree drawn in full only near the camera, the
    // rain - and whatever hides them: nothing else is on this layer.)
    for (let p = o; p && p !== scene; p = p.parent) {
      if (p.visible) continue;
      undo.push([p, "visible", false]);
      p.visible = true;
    }
  }
  // The scene's lights seen by the camera, so the shaders are the lit ones.
  const lights = [];
  scene.traverse((o) => {
    if (o.isLight) lights.push(o);
  });
  for (const l of lights) {
    undo.push([l, "mask", l.layers.mask]);
    l.layers.enable(PREP_LAYER);
  }
  // The shadow map drawn with the batch: a shader's first drawing that
  // casts (its kind's shadow shader built now) - and whenever a light has
  // no map yet (before the first frame: a shadow sampler with no map
  // behind it is a mismatch some cards warn of on every draw).
  const casting = (heavy && batch.some((o) => o.castShadow)) || lights.some((l) => l.castShadow && l.shadow && !l.shadow.map);
  const before = renderer.getRenderTarget();
  const into = pictureTarget();
  const shadows = renderer.shadowMap.autoUpdate;
  const needed = renderer.shadowMap.needsUpdate;
  const lightNeeded = lights.map((l) => l.shadow?.needsUpdate ?? false);
  const auto = renderer.autoClear;
  const scissor = new THREE.Vector4();
  const was = into ? { s: into.scissor.clone(), t: into.scissorTest } : { s: renderer.getScissor(scissor).clone(), t: renderer.getScissorTest() };
  try {
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = casting;
    if (casting) for (const l of lights) if (l.shadow && l.castShadow) l.shadow.needsUpdate = true;
    renderer.autoClear = false;
    if (into) {
      into.scissor.set(0, 0, 0, 0);
      into.scissorTest = true;
      renderer.setRenderTarget(into);
    } else {
      renderer.setRenderTarget(null);
      renderer.setScissor(0, 0, 0, 0);
      renderer.setScissorTest(true);
    }
    renderer.render(scene, cam);
    for (const o of batch) {
      sent.add(o.geometry);
      for (const m of [o.material].flat()) {
        if (!m) continue;
        const p = renderer.properties?.has?.(m) ? renderer.properties.get(m).currentProgram : null;
        if (!p) unprogrammed.add(m);
        else if (!drawn.has(p)) {
          drawn.add(p);
          firstDraws++;
        }
      }
    }
  } catch {
    // Sent as it's first drawn, as before.
  } finally {
    if (into) {
      into.scissor.copy(was.s);
      into.scissorTest = was.t;
    } else {
      renderer.setScissor(was.s);
      renderer.setScissorTest(was.t);
    }
    renderer.shadowMap.autoUpdate = shadows;
    // (The map holds the batch alone: drawn again whole next frame.)
    renderer.shadowMap.needsUpdate = needed || casting;
    lights.forEach((l, i) => {
      if (l.shadow) l.shadow.needsUpdate = lightNeeded[i] || (casting && l.castShadow);
    });
    renderer.autoClear = auto;
    renderer.setRenderTarget(before);
    for (const [o, what, v] of undo.reverse()) {
      if (what === "mask") o.layers.mask = v;
      else if (what === "culled") o.frustumCulled = v;
      else o.visible = v;
    }
  }
}
