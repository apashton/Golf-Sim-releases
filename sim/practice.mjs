// Keys for practising from the mat, where bay view hides the side panel's
// choices. Pure, so they can be tested.

// T on the range: the target steps through a few distances - none, 50 to
// 250 yards, then a random one each shot - and round again.
export const TARGET_STEPS = [0, 50, 100, 150, 200, 250, -1];

export function nextTarget(current) {
  const i = TARGET_STEPS.indexOf(current);
  if (i >= 0) return TARGET_STEPS[(i + 1) % TARGET_STEPS.length];
  // A distance picked in the panel between the steps: on to the next one up.
  return TARGET_STEPS.find((t) => t > current) ?? -1;
}

// What the toast says about the target (0 none, -1 random).
export function targetName(target) {
  if (target === 0) return "No target - free hitting";
  if (target === -1) return "Target: a random one each shot";
  return `Target: ${target} yds`;
}

// N in chipping practice: another distance from the list, never the same
// one again. random() is Math.random unless a test passes its own.
export function anotherDistance(list, current, random = Math.random) {
  const others = list.filter((d) => d !== current);
  return others.length ? others[Math.min(others.length - 1, Math.floor(random() * others.length))] : current;
}

// A practice distance as the player set it: one distance, or a random one
// between two limits each time (putting in feet, chipping in yards).
//   { mode: "fixed" | "random", value, min, max }
// A fresh one: in random mode a whole number between the limits (either
// way round), not the one just played when there's any choice; one distance
// stays as it is.
export function nextDistance({ mode = "fixed", value, min, max } = {}, current = value, random = Math.random) {
  if (mode !== "random") return value;
  const lo = Math.round(Math.min(min, max));
  const hi = Math.round(Math.max(min, max));
  if (!(Number.isFinite(lo) && Number.isFinite(hi))) return current ?? value;
  if (lo === hi) return lo;
  const choices = [];
  for (let d = lo; d <= hi; d++) if (d !== current) choices.push(d);
  return choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))];
}

// The distance setting in words: "10 ft", "6 - 20 ft at random".
export function distanceWords({ mode = "fixed", value, min, max } = {}, unit = "ft") {
  if (mode === "random") return `${Math.min(min, max)} - ${Math.max(min, max)} ${unit} at random`;
  return `${value} ${unit}`;
}
