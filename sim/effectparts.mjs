// Which of the screen effects' buffers (look/effects.js PARTS) the switches
// that are on will draw into. Only those are made on the graphics card up
// front; the rest cost nothing until their effect is first used (a switch
// turned on in the menu, a flyover's focus), when the card makes them then.
// (They were all made whatever was on: at 4K on High that was TAA's two
// full-size histories and the 3D clouds' buffer, some 150 MB, never drawn.)
//   on     the effects' switches (sim/effects.mjs effectsInUse)
//   ultra  the Ultra setting: its 3D clouds and bounce light
export function partsInUse(on = {}, { ultra = false } = {}) {
  const parts = new Set();
  const add = (...names) => names.forEach((n) => parts.add(n));
  if (ultra) add("clouds");
  if (on.ao) add("a", "b");
  if (on.ao && ultra) add("n1", "n2");
  // (The half-size copy: the far blur's, and what the bloom, the shafts and
  // the bounce light are worked out beside.)
  if (on.dof || on.bloom || on.shafts || (on.ao && ultra)) add("h1");
  if (on.dof) add("h2");
  if (on.bloom) add("q1", "q2");
  if (on.shafts) add("s1", "s2", "g1", "g2");
  if (on.taa) add("t1", "t2");
  else if (on.fxaa) add("ldr");
  return parts;
}

// A buffer's size in megabytes: w x h over 2^k each way, half floats (8
// bytes a pixel) or bytes (4).
export const partMegabytes = (w, h, k, bytes = false) => (Math.max(1, w >> k) * Math.max(1, h >> k) * (bytes ? 4 : 8)) / 2 ** 20;
