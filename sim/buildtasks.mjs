// The parts of building a hole that are nothing but arithmetic on plain
// data, by name - run on another of the computer's cores (buildworker.js,
// look/offload.js) or, where that can't be, here as they always were. The
// same answer either way: each takes plain data and gives plain data back.

import { countryParts } from "./countryparts.mjs";
import { holeTuftsFrom } from "./holetufts.mjs";
import { sheetReadings } from "./sheetreadings.mjs";
import { holeGrassFrom } from "./holegrass.mjs";
import { puttReadFrom } from "./puttread.mjs";

// (holeGrass: Ultra's grass across the hole, placed as each shot is set
// up - the one task that comes every shot rather than every hole; and
// puttRead: a putt's read on a course's green, each time a ball's on it.)
export const TASKS = { countryParts, holeTufts: holeTuftsFrom, sheetReadings, holeGrass: holeGrassFrom, puttRead: puttReadFrom };

// The typed arrays in an answer (a picture's pixels, the tufts' numbers -
// a few levels down at most): handed over from the worker rather than
// copied.
export function transfers(value, depth = 4, out = new Set()) {
  if (!value || typeof value !== "object" || depth < 0) return [...out];
  if (ArrayBuffer.isView(value)) {
    if (value.buffer instanceof ArrayBuffer) out.add(value.buffer);
    return [...out];
  }
  for (const v of Array.isArray(value) ? value : Object.values(value)) transfers(v, depth - 1, out);
  return [...out];
}

// A task run here, by name.
export function runTask(name, input) {
  const task = TASKS[name];
  if (!task) throw new Error(`No build task "${name}"`);
  return task(input);
}
