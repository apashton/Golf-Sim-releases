// Scenes for the recording: the recording's layouts (sim/videolayout.mjs)
// used as scenes - switched during a recording by voice ("scene swing
// review", "next scene"), by the mode (putting has its own scene, the range
// another), and at the end of a round (a Finish scene: the game picture
// whole, with the final score) - each change made with a transition: a
// cut, a dissolve, or a swipe. The recording is always the same size
// whatever the screens show (the compositor draws it off screen).
//
// Pure: videorec.js keeps them, compositor.js draws the transitions.

export const MODES = ["range", "putting", "chipping", "course", "challenges"];
export const MODE_NAMES = { range: "Range", putting: "Putting", chipping: "Chipping", course: "Course", challenges: "Challenges" };
export const TRANSITIONS = ["cut", "dissolve", "swipe-left", "swipe-right", "swipe-up", "swipe-down"];
export const TRANSITION_NAMES = {
  cut: "Cut",
  dissolve: "Dissolve",
  "swipe-left": "Swipe left",
  "swipe-right": "Swipe right",
  "swipe-up": "Swipe up",
  "swipe-down": "Swipe down",
};
export const SECONDS = { min: 0.2, max: 3, dflt: 0.8 };
// The layout the end of a round switches to when none is chosen: the
// Finish preset (videolayout.mjs), added to the layouts if it's missing.
export const FINISH_ID = "finish";

const ID = /^[a-z0-9-]{1,24}$/;
const idOrNull = (v) => (typeof v === "string" && ID.test(v) ? v : null);

// { byMode: { range: id|null, ... }, finish: id|null, byPhase: { flight,
// after }, transition, seconds }
//   byMode   the scene each mode switches to (null: stay as it is)
//   finish   the scene a finished round switches to (null: none)
//   byPhase  the scene while the ball flies, and after it lands (null:
//            stay as it is) - back to the scene before when the next shot
//            is set up (sim/shotphase.mjs)
export function cleanScenes(s) {
  const src = s && typeof s === "object" ? s : {};
  const byMode = {};
  for (const m of MODES) byMode[m] = idOrNull(src.byMode?.[m]);
  const n = Number(src.seconds);
  return {
    byMode,
    finish: src.finish === null ? null : (idOrNull(src.finish) ?? FINISH_ID),
    byPhase: { flight: idOrNull(src.byPhase?.flight), after: idOrNull(src.byPhase?.after) },
    transition: TRANSITIONS.includes(src.transition) ? src.transition : "dissolve",
    seconds: Number.isFinite(n) ? Math.min(SECONDS.max, Math.max(SECONDS.min, Math.round(n * 10) / 10)) : SECONDS.dflt,
  };
}

// A scene chosen only if it's still one of the layouts.
const have = (layouts, id) => (id && layouts.some((l) => l.id === id) ? id : null);

export function sceneForMode(scenes, mode, layouts) {
  return have(layouts, scenes.byMode?.[mode]);
}
export function finishScene(scenes, layouts) {
  return have(layouts, scenes.finish);
}

// The scene for a time of the shot ("flight", "after"), or null: none set
// (or it's gone), or before the shot.
export function phaseScene(scenes, phase, layouts) {
  return phase === "flight" || phase === "after" ? have(layouts, scenes.byPhase?.[phase]) : null;
}

// What the recording should switch to as the shot's time changes from
// `was` to `now`: { to: id|null, base } - base is the scene to go back to
// once the next shot is set up (kept from before the first switch). to
// null: stay as it is.
export function phaseStep(scenes, layouts, { was, now, active, base = null }) {
  if (was === now) return { to: null, base };
  const want = phaseScene(scenes, now, layouts);
  if (want) return { to: want === active ? null : want, base: base ?? active };
  // Nothing for this time: back to where it was, if it was switched.
  if (base && (now === "address" || !phaseScene(scenes, now, layouts))) return { to: base === active ? null : base, base: null };
  return { to: null, base };
}

// The next or previous scene round the list (dir 1 or -1).
export function stepScene(layouts, active, dir) {
  if (!layouts.length) return null;
  const i = Math.max(0, layouts.findIndex((l) => l.id === active));
  return layouts[(i + dir + layouts.length) % layouts.length].id;
}

// A scene by what was said: its name ("swing review"), or its place in
// the list ("scene two"). Words are compared loosely: case, punctuation
// and a trailing "scene" or "layout" don't matter.
const NUMBERS = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const plain = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\b(scene|layout|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
export function findScene(layouts, words) {
  const w = plain(words);
  if (!w) return null;
  const k = NUMBERS.indexOf(w) >= 0 ? NUMBERS.indexOf(w) : /^\d+$/.test(w) ? Number(w) - 1 : -1;
  if (k >= 0) return layouts[k]?.id ?? null;
  return layouts.find((l) => plain(l.name) === w)?.id ?? layouts.find((l) => plain(l.name).startsWith(w) || w.startsWith(plain(l.name)))?.id ?? null;
}

// Where each picture goes at time t (0 - 1) of a transition: { from, to }
// - the old scene's last picture and the new scene's live one - each { x, y
// } (shares of the picture it's moved by) and alpha. The new one is drawn
// first, the old over it.
export function transitionFrame(kind, t) {
  const k = Math.min(1, Math.max(0, t));
  const e = k * k * (3 - 2 * k);
  const still = { x: 0, y: 0, alpha: 1 };
  if (kind === "dissolve") return { to: still, from: { x: 0, y: 0, alpha: 1 - e } };
  const dir = { "swipe-left": [-1, 0], "swipe-right": [1, 0], "swipe-up": [0, -1], "swipe-down": [0, 1] }[kind];
  // A cut: straight to the new.
  if (!dir) return { to: still, from: { x: 0, y: 0, alpha: 0 } };
  // The old slides off one way as the new slides in behind it from the
  // other side.
  // (+ 0: no -0s.)
  return {
    from: { x: dir[0] * e + 0, y: dir[1] * e + 0, alpha: 1 },
    to: { x: -dir[0] * (1 - e) + 0, y: -dir[1] * (1 - e) + 0, alpha: 1 },
  };
}
