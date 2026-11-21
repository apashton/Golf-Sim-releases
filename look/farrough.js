// The far rough's reach for this setting (sim/farrough.mjs), kept in the
// ground's shared uniforms (look/glsl/ground.js gFarRough) as the safety
// valve sheds the long grass or the far rough itself.

import { LEVEL } from "./quality.js";
import { registerStep, isShed } from "./safety.js";
import { groundUniforms } from "./glsl/ground.js";
import { farRoughRange } from "../sim/farrough.mjs";

export const FAR_ROUGH_STEP = "far rough";
// The long grass's own step (look/longgrass.js FIELD).
const LONG_GRASS_STEP = "long grass";

// Sets gFarRough: (start, full, fadeFrom, end), strength in gFarRoughK
// (0: off).
export function syncFarRough() {
  const longGrass = (LEVEL === "high" || LEVEL === "ultra") && !isShed(LONG_GRASS_STEP);
  const r = farRoughRange(LEVEL, { longGrass, shed: isShed(FAR_ROUGH_STEP) });
  groundUniforms.gFarRough.value = r ? [r.start, r.full, r.fadeFrom, r.end] : [0, 1, 2, 3];
  groundUniforms.gFarRoughK.value = r ? r.strength : 0;
}

// Shed late on Medium and up (a few shader instructions a ground pixel):
// after the extras, before the tufts.
registerStep(2.8, FAR_ROUGH_STEP, syncFarRough, { of: "medium" });
syncFarRough();
