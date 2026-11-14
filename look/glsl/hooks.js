// The scenery hooks - the cloud shade (cloudshade.js), the bend (bend.js),
// a tree's own patches (treepatch.js) and, for a tree that asks for it,
// the see-through (seethrough.js) -
// added to a material once: after its own onBeforeCompile, if
// it has one, with its program cache key extended by the hooks' own and
// the kind, so a program is built again whenever a hook changes. Every lit
// piece of scenery goes through here (ground, sand, water, paths, walls,
// trunks, crowns, leaf cards, tufts, dressing, signs).

// The node versions of these three hooks, for the WebGPU renderer, live in
// nodehooks.js. This file is the WebGL path and is what the game runs today.
import { cloudShade, CLOUDSHADE_KEY } from "./cloudshade.js";
import { bend, BEND_KEY } from "./bend.js";
import { seeThrough, SEE_THROUGH_KEY } from "./seethrough.js";
import { treePatch, TREE_PATCH_KEY } from "./treepatch.js";
import { markTwin } from "../twins.js";

export { cloudShade, bend };
export const HOOKS_KEY = `${CLOUDSHADE_KEY}-${BEND_KEY}-${SEE_THROUGH_KEY}-${TREE_PATCH_KEY}`;

export function withSceneryHooks(material, kind) {
  if (material.userData.hooks) return material;
  material.userData.hooks = kind;
  const own = material.onBeforeCompile;
  const ownKey = Object.prototype.hasOwnProperty.call(material, "customProgramCacheKey") ? material.customProgramCacheKey : null;
  const plain = own === material.constructor.prototype.onBeforeCompile || !Object.prototype.hasOwnProperty.call(material, "onBeforeCompile");
  material.onBeforeCompile = (shader, renderer) => {
    if (!plain) own.call(material, shader, renderer);
    bend(shader, kind);
    treePatch(shader, kind);
    cloudShade(shader);
    seeThrough(shader, material.userData.seeThrough);
  };
  material.customProgramCacheKey = () => `${ownKey ? ownKey.call(material) : plain ? "" : own.toString()}|${kind}${material.userData.seeThrough ? `+${material.userData.seeThrough}` : ""}|${HOOKS_KEY}`;
  // Where the hooks are its only patch: on WebGPURenderer, three's own node
  // version of it with the hooks' (look/nodetwins.js "hooked").
  if (plain && !material.userData.twin) markTwin(material, "hooked", { kind });
  return material;
}
