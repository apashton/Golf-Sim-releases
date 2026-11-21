// What the hole builder plants on a links hole (the owner, 10 October
// 2026: links-only planting, a soft cap): not parkland trees but what grows
// on a links - gorse in thickets, a hawthorn bent low by the wind, sea
// buckthorn, a stunted pine - each a kind of tree the game draws
// (sim/treeshapes.mjs), at the size and spread that makes it so. Past
// LINKS_CAP on a hole the builder says so, but still plants: a links hole
// is mostly open. Pure.

import { KIND } from "./treeshapes.mjs";

export const LINKS_PLANTS = [
  { id: "gorse", name: "Gorse thicket", kind: KIND.bush, size: [0.5, 0.75], width: 1.35, clump: 3 },
  { id: "hawthorn", name: "Wind-bent hawthorn", kind: KIND.leaf, size: [0.36, 0.48], width: 1.5, clump: 1 },
  { id: "buckthorn", name: "Sea buckthorn", kind: KIND.bush, size: [0.8, 1.05], width: 1.15, clump: 1 },
  { id: "pine", name: "Stunted pine", kind: KIND.scots, size: [0.36, 0.5], width: 1.25, clump: 1 },
];
export const DEFAULT_LINKS_PLANT = "gorse";
export const LINKS_CAP = 30;

export const linksPlant = (id) => LINKS_PLANTS.find((p) => p.id === id) ?? LINKS_PLANTS[0];

// A size for one of `plant`, from a random number.
export const plantSize = (plant, r) => Math.round((plant.size[0] + r * (plant.size[1] - plant.size[0])) * 100) / 100;

// The planting edit (sim/holeedits.mjs "t+") for `plant` at the spots
// [[x, z], ...]: a thicket's few round each spot, each its size.
export function linksPlanting(plant, spots, rand = Math.random) {
  const p = [];
  for (const [x, z] of spots) {
    for (let i = 0; i < plant.clump; i++) {
      const a = rand() * Math.PI * 2;
      const d = i === 0 ? 0 : 1.6 + rand() * 1.2;
      p.push([Math.round((x + Math.cos(a) * d) * 100) / 100, Math.round((z + Math.sin(a) * d) * 100) / 100, plantSize(plant, rand())]);
    }
  }
  return { k: "t+", p, kind: plant.kind, w: plant.width };
}

// What the builder says with `count` trees and bushes on a links hole: ""
// up to the cap, else a word that it's getting crowded.
export function linksPlantNote(count) {
  return count > LINKS_CAP ? `A links hole is mostly open: ${count} trees and bushes here now - about ${LINKS_CAP} is plenty.` : "";
}
