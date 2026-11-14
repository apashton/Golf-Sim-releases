// The steps the picture may shed when it stays slow (the safety valve:
// sim/safetyvalve.mjs decides when, sim/graphics.mjs ladder the order).
// Each part of the picture with detail of its own to shed registers a step
// here, with the setting it belongs to and its place in that setting's
// order. On High, all of them; on Medium, Medium's and the picture's; on
// Standard, only the picture's - and on every setting the effects' first:
//   Ultra's supersampling (first: look/renderscale.js), before anything
//   Ultra's own (of: "ultra"): its grass across the hole drawn nearer the
//   camera only (0.4), then not at all (0.5), and the rest of its own
//   The picture's effects (of: "effects", look/effects.js), when on
//     1 the far blur
//     2 bloom
//     3 ambient occlusion
//   High's extras (of: "high") - shed, High is drawing Medium's picture
//     1 far woods down to Medium's count (look/country.js)
//     1.5 the crop's neighbour trees off (look/trees.js)
//     2 3D trees from 300 m to 220 m (look/trees.js)
//   Medium's (of: "medium", the default) - High's four from before there
//   were three settings
//     1 rain down to Standard's count
//     2 far trees from 220 m to 150 m
//     2.5 far tufts thinned: full near the camera, few far off (before
//       they go: the owner's "mix simple and complex objects together to
//       still keep some of the illusion")
//     3 grass round the ball and tufts off
//     4 leaf flutter off
//   The picture (of: "picture", look/renderscale.js)
//     1 the 3D picture drawn at 85% and stretched to fill
//     2 drawn at 70%
// A step's apply(on) may only switch counts, distances, visibility or the
// picture's size - never a shader or a buffer - so shedding one can't
// cause a hitch (the renderer takes up a new size just before it next
// draws, so no frame is shown blank). Medium's step 3 is the tufts and
// the grass round the ball together (look/groundbits.js registers it;
// look/lienest.js hides the grass).

import { LEVEL } from "./quality.js";
import { ladder } from "../sim/graphics.mjs";

const steps = [];
// Those in use on this setting, in the order they're shed.
let used = [];
let level = 0;

// order: where it goes in its setting's list above; name: for the readout
// and the report; apply(on): true to shed it, false to bring it back; of:
// the setting it belongs to ("high", "medium") or "picture". Registering a
// step already registered (by name) replaces it.
// first: shed before anything else, the effects too (Ultra's supersampling).
export function registerStep(order, name, apply, { of = "medium", first = false } = {}) {
  const at = steps.findIndex((s) => s.name === name);
  if (at >= 0) steps.splice(at, 1);
  steps.push({ order, name, apply, of, first });
  used = ladder(LEVEL, steps);
}

// How many steps there are on this setting.
export function stepCount() {
  return used.length;
}

// The steps in use, in order: [{ name, of }], for the words on the readout
// (sim/graphics.mjs settingText).
export function ladderSteps() {
  return used.map(({ name, of, order, first }) => ({ name, of, order, first }));
}

// How many are shed.
export function shedLevel() {
  return level;
}

// The names of the steps shed, first first.
export function shedNames() {
  return used.slice(0, level).map((s) => s.name);
}

// Sheds (or brings back) steps until `n` are shed.
export function setShed(n) {
  n = Math.max(0, Math.min(stepCount(), n));
  while (level < n) used[level++].apply(true);
  while (level > n) used[--level].apply(false);
}

// Whether a step is shed now: for parts built after it was (a new hole's
// tufts), so they're built as the valve has left things.
export function isShed(name) {
  return used.slice(0, level).some((s) => s.name === name);
}

// One step shed (on) or brought back (off) on its own, out of the ladder's
// order: for the speed test's costs (speedtest.js), which times the
// picture without each in turn. Only a step in use and not shed by the
// valve; true if it was.
export function shedOne(name, on) {
  const at = used.findIndex((s) => s.name === name);
  if (at < 0 || at < level) return false;
  used[at].apply(!!on);
  return true;
}
