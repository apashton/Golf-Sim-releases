// Draws the sun's shadow map only when something in it changes (see
// sim/shadowcheck.mjs), instead of every frame: every tree, leaf card, sign
// and wall was drawn into the 4096 (High) or 2048 (Standard) map sixty
// times a second although almost nothing moves. Once a frame, before the
// picture is drawn, it brings the scene's positions up to date, gathers
// every visible caster and compares them with the last frame's; the map is
// drawn only when they differ, or the scene is a different one.
//
// Anything that casts and moves every frame would have the map drawn every
// frame: the waving flag cloth has a painted shadow instead (scenery.js),
// celebration particles cast nothing, and a player's marker, kept about
// the same size on screen, is `userData.shadowLoose` (only where it stands
// counts).
//
// On High there's a second, near map (look/nearshadow.js): it's drawn when
// it moves on with the camera - on its own, the wide map left as it is -
// and with the wide one whenever a caster changes. (With a near map both
// lights' maps are drawn only when asked: shadow.autoUpdate off.)

// Small casters (`userData.shadowNear`: rocks, gorse, the players'
// markers) go in the near map only while there is one (sim/shadowcheck.mjs
// shadowPlan): left out of the wide map, which a change in them no longer
// redraws.

import { snapshot, shadowChanged, shadowPlan, shadowCause } from "../sim/shadowcheck.mjs";

// Ultra's near map is redrawn for a small caster's change at most every
// this many frames.
const SMALL_EVERY = 2;

// What changed, in words: "light" or a caster - by the first name found
// on it or what holds it - and how ("trees: changed").
function causeText(cause, casters) {
  if (!cause) return "nothing found changed";
  if (cause === "light") return "the sun's shadow fitted again";
  if (cause === "scene") return "a new scene";
  const o = casters.find((c) => c.id === cause.id)?.object;
  let name = "";
  for (let p = o; p && !name && !p.isScene; p = p.parent) name = p.name || p.userData?.kind || "";
  return `${name || o?.type || "something gone"}: ${cause.how}`;
}

// Leaves a small caster out of the wide map's drawing while `live()` (its
// light's frustum is the one three.js culls against for that map).
function keepOutOfWide(o, sun, live) {
  if (o.userData.wideHook === sun) return;
  o.userData.wideHook = sun;
  const wide = sun.shadow.getFrustum();
  const culled = (o.userData.wideCulled ??= o.frustumCulled);
  const own = Object.getPrototypeOf(o).intersectsFrustum;
  o.frustumCulled = true;
  o.intersectsFrustum = function (frustum) {
    if (frustum === wide && live()) return false;
    return culled ? own.call(this, frustum) : true;
  };
}

export class ShadowWatch {
  // ultra: small casters' changes redrawn at most every SMALL_EVERY frames.
  constructor(renderer, { ultra = false } = {}) {
    this.renderer = renderer;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    this.scene = null;
    this.before = null;
    this.spare = null;
    this.casters = [];
    this.small = [];
    this.smallBefore = null;
    this.smallSpare = null;
    this.smallPending = false;
    this.nearWaited = Infinity;
    this.nearLive = false;
    this.every = ultra ? SMALL_EVERY : 1;
    // Where the near map's light was last drawn from (its matrix), to the
    // last digit: kept in 32-bit numbers it never matched the light's own
    // (64-bit) ones, so the near map was drawn again every frame.
    this.nearAt = new Float64Array(16);
    // How many frames drew the map, and how many were checked.
    this.redraws = 0;
    this.nearRedraws = 0;
    this.frames = 0;
    // What made each map be drawn again ("trees: changed" ...), counted,
    // for a report: which object keeps a map being drawn (the owner, 20
    // October 2026: the triangles "constantly flicking between 865k ... and
    // 1.54 million").
    this.causes = new Map();
  }

  noteCause(map, why) {
    const key = `${map}: ${why}`;
    this.causes.set(key, (this.causes.get(key) ?? 0) + 1);
    // (Never more than a few hundred kinds kept.)
    if (this.causes.size > 300) this.causes.delete(this.causes.keys().next().value);
  }

  // For a report: frames checked, each map's redraws, and the commonest
  // causes, most first.
  report() {
    const causes = [...this.causes].sort((a, b) => b[1] - a[1]).slice(0, 6);
    return { frames: this.frames, wide: this.redraws, near: this.nearRedraws, causes };
  }

  // Before the scene is drawn: updates its world matrices (so the render
  // needn't: see render()) and says whether to draw the map this frame.
  check(scene) {
    scene.updateMatrixWorld();
    const casters = this.casters;
    const small = this.small;
    casters.length = 0;
    small.length = 0;
    const found = [];
    let light = null;
    let sun = null;
    let near = null;
    scene.traverseVisible((o) => {
      if (o.isDirectionalLight && o.userData.nearShadow) {
        near = o;
        return;
      }
      if (o.isDirectionalLight && o.castShadow && !light) {
        sun = o;
        light = { matrix: o.matrixWorld.elements, target: o.target.matrixWorld.elements, projection: o.shadow.camera.projectionMatrix.elements };
        return;
      }
      if (!o.castShadow || !(o.isMesh || o.isLine || o.isPoints)) return;
      if (o.userData.shadowNear) found.push(o);
      (o.userData.shadowNear ? small : casters).push({
        id: o.id,
        object: o,
        matrix: o.matrixWorld.elements,
        version: (o.instanceMatrix?.version ?? 0) + (o._matricesTexture?.version ?? 0) + (o.userData.shadowVersion ?? 0),
        count: o.isInstancedMesh || o.isBatchedMesh ? (o.count ?? o.instanceCount ?? 1) : 1,
        loose: !!o.userData.shadowLoose,
      });
    });
    // Whether the small casters are the near map's alone: there's one, and
    // it lies somewhere (not yet placed, or shed by the safety valve: in
    // the wide map with the rest).
    const live = !!near && near.userData.centre != null;
    const routed = live !== this.nearLive;
    this.nearLive = live;
    if (sun && near) {
      const self = this;
      for (const o of found) keepOutOfWide(o, sun, () => self.nearLive);
    }
    // Two lists kept, swapped each frame, so nothing is allocated.
    const now = snapshot(casters, light, this.spare ?? []);
    const changed = scene !== this.scene || routed || shadowChanged(this.before, now);
    // (Why, worked out only on a frame that draws it.)
    const wideWhy = changed ? (scene !== this.scene ? "a new scene" : routed ? "the near map came or went" : causeText(shadowCause(this.before, now, !!light), casters)) : null;
    this.spare = this.before;
    this.before = now;
    const smallNow = snapshot(small, null, this.smallSpare ?? []);
    const smallChanged = this.smallPending || shadowChanged(this.smallBefore, smallNow);
    const smallWhy = smallChanged && !this.smallPending ? causeText(shadowCause(this.smallBefore, smallNow, false), small) : null;
    if (smallWhy) this.smallWhy = smallWhy;
    this.smallSpare = this.smallBefore;
    this.smallBefore = smallNow;
    this.scene = scene;
    this.frames++;
    // (WebGPURenderer has no switch for every light's map at once - its
    // shadowMap.autoUpdate: each light's own says, so the sun's is turned
    // off here and its map drawn only when asked, as on WebGL.)
    if (this.renderer.isWebGPURenderer && sun) sun.shadow.autoUpdate = false;
    // The near map moved on: drawn again on its own.
    let moved = false;
    if (near) {
      const m = near.matrixWorld.elements;
      for (let i = 0; i < 16; i++) {
        if (this.nearAt[i] !== m[i]) moved = true;
        this.nearAt[i] = m[i];
      }
    }
    const plan = shadowPlan({ wide: changed, small: smallChanged, moved, near: live, waited: this.nearWaited, every: this.every });
    this.smallPending = plan.pending;
    this.nearWaited = plan.near || plan.wide ? 1 : this.nearWaited + 1;
    if (plan.wide) {
      this.redraws++;
      this.noteCause("wide", wideWhy ?? `a small thing, with no near map (${this.smallWhy ?? "?"})`);
      this.renderer.shadowMap.needsUpdate = true;
      if (sun) sun.shadow.needsUpdate = true;
      if (near) near.shadow.needsUpdate = true;
    } else if (plan.near) {
      this.nearRedraws++;
      this.noteCause("near", moved ? "moved with the camera" : (this.smallWhy ?? "a small thing changed"));
      this.renderer.shadowMap.needsUpdate = true;
      near.shadow.needsUpdate = true;
    }
    return plan.wide || plan.near;
  }

  // Draws the scene with its matrices as check() left them.
  render(scene, camera) {
    const auto = scene.matrixWorldAutoUpdate;
    scene.matrixWorldAutoUpdate = false;
    try {
      this.renderer.render(scene, camera);
    } finally {
      scene.matrixWorldAutoUpdate = auto;
    }
  }
}
