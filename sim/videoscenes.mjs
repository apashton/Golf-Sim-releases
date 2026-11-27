// Scenes for the recording: the recording's layouts (sim/videolayout.mjs)
// used as scenes - switched during a recording by voice ("scene swing
// review", "next scene"), by the mode (putting has its own scene, the range
// another), on the course once the ball's on the green (the Putting scene
// to begin with, as the putting green's), and at the end of a round (a
// Finish scene: the game picture whole, with the final score) - each change
// made with a transition: a cut, a dissolve, or a swipe. The recording is
// always the same size whatever the screens show (the compositor draws it
// off screen).
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
// The layout putts are played in when none is chosen: the Putting preset
// (videolayout.mjs ensurePutting) - the putting green's, and the course's
// on the green (the owner, 27 November 2026: "there needs to be a specific
// screen for putting with different stats").
export const PUTTING_ID = "putting";
// The scene settings that start on the Putting scene, until one's picked
// by hand (kept in chosen, so "Stay as it is" picked stays picked).
export const DEFAULTED = ["putting", "green"];
// The presets added to the layouts once (videorec.js, sim/videolayout.mjs
// ensurePutting): kept in offered once they're in, so one deleted stays
// deleted.
export const OFFERED = ["putting"];

const ID = /^[a-z0-9-]{1,24}$/;
const idOrNull = (v) => (typeof v === "string" && ID.test(v) ? v : null);

// { byMode: { range: id|null, ... }, finish: id|null, byPhase: { flight,
// after }, green: id|null, transition, seconds, chosen }
//   byMode   the scene each mode switches to (null: stay as it is) - the
//            putting green's the Putting scene until one's picked
//   finish   the scene a finished round switches to (null: none)
//   byPhase  the scene while the ball flies, and after it lands (null:
//            stay as it is) - back to the scene before when the next shot
//            is set up (sim/shotphase.mjs)
//   green    on the course, the scene while the ball's on the green (or
//            the putter's picked off it) - until one's picked, the scene
//            the owner picked for the putting green if there is one, else
//            the Putting scene; null: no change
//   chosen   which of DEFAULTED have been picked by hand ("putting": the
//            putting green's, "green": on the green's): a null there is
//            the owner's "stay as it is", never put back to the Putting
//            scene. (One kept before there was a Putting scene - null, as
//            every mode's was - wasn't picked, so it starts on it too.)
//   offered  which of OFFERED have been added to the layouts already
export function cleanScenes(s) {
  const src = s && typeof s === "object" ? s : {};
  const chosen = DEFAULTED.filter((k) => Array.isArray(src.chosen) && src.chosen.includes(k));
  const byMode = {};
  for (const m of MODES) byMode[m] = idOrNull(src.byMode?.[m]);
  // (The owner's own scene for putting, from before there was an On the
  // green: the course's greens start on it too.)
  const ownPutting = byMode.putting;
  if (!byMode.putting && !chosen.includes("putting")) byMode.putting = PUTTING_ID;
  const n = Number(src.seconds);
  return {
    byMode,
    finish: src.finish === null ? null : (idOrNull(src.finish) ?? FINISH_ID),
    byPhase: { flight: idOrNull(src.byPhase?.flight), after: idOrNull(src.byPhase?.after) },
    green: idOrNull(src.green) ?? (chosen.includes("green") ? null : (ownPutting ?? PUTTING_ID)),
    chosen,
    offered: OFFERED.filter((k) => Array.isArray(src.offered) && src.offered.includes(k)),
    transition: TRANSITIONS.includes(src.transition) ? src.transition : "dissolve",
    seconds: Number.isFinite(n) ? Math.min(SECONDS.max, Math.max(SECONDS.min, Math.round(n * 10) / 10)) : SECONDS.dflt,
  };
}

// The scenes with a change made by hand (the Recording panel's Scenes
// page, videorec.js setScenes): the putting green's or on the green's
// changed - to "Stay as it is" too - is kept as picked from then on
// (chosen). patch: { byMode: { mode: id|null }, byPhase, green, finish,
// transition, seconds }, any of them.
export function withScenes(scenes, patch = {}) {
  const was = cleanScenes(scenes);
  const chosen = new Set(was.chosen);
  if (patch.byMode && "putting" in patch.byMode && patch.byMode.putting !== was.byMode.putting) chosen.add("putting");
  if ("green" in patch && patch.green !== was.green) chosen.add("green");
  return cleanScenes({
    ...was,
    ...patch,
    byMode: { ...was.byMode, ...(patch.byMode ?? {}) },
    byPhase: { ...was.byPhase, ...(patch.byPhase ?? {}) },
    chosen: [...chosen],
  });
}

// A scene chosen only if it's still one of the layouts.
const have = (layouts, id) => (id && layouts.some((l) => l.id === id) ? id : null);

// The layouts as they're saved (videorec.js): the scene to start on is
// the one last picked - by hand, by voice, or chosen to record in - while
// it's still there, never one the game switched to (a mode's, a shot's,
// the green's, the finish's), even when a layer of that one is changed.
export function keptLayouts(store, picked) {
  const active = have(store.layouts, picked) ?? store.active;
  return active === store.active ? store : { ...store, active };
}

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

// The scene a putt is played in, or null (none set, or it's gone): on the
// course, the On the green scene; on the putting green, its own.
export function greenScene(scenes, mode, layouts) {
  if (mode === "course") return have(layouts, scenes.green);
  if (mode === "putting") return have(layouts, scenes.byMode?.putting);
  return null;
}

// What the recording should switch to as the shot's time changes, or the
// ball comes onto the green or goes off it (videorec.js followShot): {
// to: id|null, base, key }. was: the key it gave last time ("green", or
// the shot's time). now: { phase (sim/shotphase.mjs), green (a
// putt's being played: on the course's green, or the putting green - app.js
// info putting), putt (the shot is a putt) }. Where there's a scene for
// putts (greenScene), the green has it - once the shot before has had its
// time (a putt struck, or the next shot set up: an approach that finished
// on the green keeps its After it lands scene), and through a putt's own
// time after it's struck even once the hole's over - and a putt never
// switches to the shot scenes (it neither flies nor lands). Back to the
// scene from before as the next shot off the green is set up. Without a
// scene for putts, as phaseStep. was null: starting afresh (the mode just
// changed - videorec.js modeChanged): the shot's own time is taken as
// what it was, so the green's scene comes in if it's due and the shot's
// time doesn't switch again in the new mode.
export function shotStep(scenes, layouts, { mode, was = "address", now, active, base = null }) {
  const g = greenScene(scenes, mode, layouts);
  const state = (s, prev) => {
    if (!g) return s.phase;
    if (s.green && (s.putt || s.phase === "address")) return "green";
    if (s.putt && s.phase !== "address" && prev === "green") return "green";
    return s.putt ? "address" : s.phase;
  };
  if (was == null) was = state({ ...now, green: false }, null);
  const key = state(now, was);
  if (was === key) return { to: null, base, key };
  if (key === "green") return { to: g === active ? null : g, base: base ?? active, key };
  return { ...phaseStep(scenes, layouts, { was, now: key, active, base }), key };
}

// What the recording switches to as the mode changes (videorec.js
// modeChanged): { to, base, shown } - to: the scene to be on (it may be the
// one showing). The new mode's scene; or, with none for it, back to the
// scene from before a mode's scene was switched to, if that's still what
// shows (so the putting green's scene doesn't follow you to the range).
// active: what shows - or, with a shot's or the green's scene showing, the
// one it switched from; base: the scene from before a mode's; shown: the
// mode's scene switched to.
export function modeStep(scenes, layouts, { mode, active, base = null, shown = null }) {
  const want = sceneForMode(scenes, mode, layouts);
  if (want) return { to: want, base: base ?? (want === active ? null : active), shown: want };
  if (base && shown === active && have(layouts, base)) return { to: base, base: null, shown: null };
  return { to: active, base: null, shown: null };
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
