// The picture's effects, each with a switch of its own (the owner's
// "cheap graphical wins": "implement all of these, each behind its own
// toggle", with "a sensible default preset (good-looking out of the box)"
// and "a one-click Performance preset that turns off the heavier effects
// (AO, bloom, DoF)"), kept between sessions. On top of the graphics
// setting (Standard, Medium, High: sim/graphics.mjs), not instead of it:
// that decides how much is built, these how it's finished.
//
// Pure: look/effects.js reads the saved switches through it, the menu
// draws them from EFFECTS, and the tests hold them to it.

// In the menu's order. Each:
//   id       the saved key and the menu's (effect-<id>)
//   label    a few words; help: one line, what changes on the screen
//   heavy    turned off by the Performance preset (and the first the
//            safety valve sheds when the picture is slow)
//   reload   built into the scene (its light, its textures): changing it
//            reloads the page, as the graphics setting does
//   notOn    graphics settings it isn't made on (Standard's ground is
//            built differently, without the detail textures)
//   cost     what it typically costs to draw: a COST_WORDS key (costWhen:
//            when, or what else it costs)
//   step     the safety valve's name for it (look/effects.js registerStep,
//            the same words), which the speed test measures it by (sim/
//            speedtest.mjs costs)
export const EFFECTS = [
  {
    id: "grade",
    label: "Warm colour and vignette",
    cost: "light",
    help: "A slightly warmer colour over the whole picture with a little more contrast, and the corners a touch darker, as a camera sees it.",
  },
  {
    id: "ao",
    label: "Ambient occlusion",
    cost: "heavy",
    step: "ambient occlusion",
    heavy: true,
    help: "A soft shade where things meet the ground near you - the foot of a trunk, under a bunker's lip, along a wall - so they sit in it rather than float.",
  },
  {
    id: "fxaa",
    label: "Smooth edges (FXAA)",
    cost: "light",
    help: "Smooths the jagged edges the picture's own smoothing misses: leaves, grass blades, thin flag poles.",
  },
  {
    id: "bloom",
    label: "Bloom",
    cost: "some",
    step: "bloom",
    heavy: true,
    help: "A soft glow round only the very brightest things - sun on water, the white of the ball in sunlight. Held back: nothing else glows.",
  },
  {
    id: "sky",
    label: "Detailed sky",
    cost: "light",
    help: "High, thin wisps of cloud across the sky above the cumulus, and the full number of clouds. Off: a plain sky with fewer clouds.",
  },
  {
    id: "haze",
    label: "Distance haze",
    cost: "none",
    help: "The air's haze, so far hills and woods fade into the sky. Off: a clearer day, the haze only right at the edge of the world.",
  },
  {
    id: "textures",
    label: "Sharp ground textures",
    cost: "some",
    costWhen: "and more of the graphics card's memory",
    reload: true,
    notOn: ["standard"],
    help: "Grass blades and sand grains you can see on the ground near the ball, as Standard has, on Low too. A² Golf reloads to change it.",
  },
  {
    id: "dof",
    label: "Blur the far distance",
    cost: "some",
    step: "the far blur",
    heavy: true,
    help: "The far hills and woods, beyond any green, softly out of focus, as a camera focused on the hole sees them.",
  },
  {
    id: "shafts",
    label: "Sun shafts and glow",
    cost: "heavy",
    costWhen: "when the sun's in the picture",
    step: "sun shafts",
    heavy: true,
    notOn: ["standard", "medium", "high"],
    help: "On Medium (the highest setting): rays of sunlight streaming through the leaves and round the trunks when the sun's in the picture, and a wider, softer glow round the sun's glints on water.",
  },
  {
    id: "focus",
    label: "Flyover depth of field",
    cost: "heavy",
    costWhen: "only in a hole's flyover - nothing while you play",
    step: "flyover depth of field",
    heavy: true,
    notOn: ["standard", "medium", "high"],
    help: "On Medium (the highest setting): in a hole's flyover the camera focuses on the ball, as a film camera's would: the ball, the trees along the hole and the green ahead stay sharp, and only the grass right by the camera and the far distance go softly out of focus. Never while you're playing a shot.",
  },
  {
    id: "taa",
    label: "Smooth edges over time (TAA)",
    cost: "some",
    costWhen: "in place of FXAA's",
    step: "smoothing over time",
    notOn: ["standard", "medium", "high"],
    help: "On Medium (the highest setting): each frame's drawn a fraction of a pixel to one side and blended with the last few, so leaves, flag poles and far mowing stripes are smooth and never crawl. In place of FXAA while it's on.",
  },
  {
    id: "upscale",
    label: "Fewer pixels, built up over time",
    cost: "saves",
    costWhen: "with Smooth edges over time on",
    notOn: ["standard", "medium", "high"],
    help: "On Medium (the highest setting), with Smooth edges over time: the picture drawn at two-thirds of its size each way and the full-size one built up from the last few frames, each nudged a fraction of a pixel - nearly as sharp, at under half the drawing. Off: every pixel drawn every frame.",
  },
  {
    id: "sway",
    label: "Camera sway",
    cost: "none",
    help: "The camera breathes very slightly, as if held, rather than standing dead still. It never moves the aim line enough to see.",
  },
  {
    id: "evening",
    label: "Late-afternoon light",
    cost: "none",
    reload: true,
    help: "A lower, warmer sun on the practice greens and in the Challenges: golden light, longer shadows, a warmer sky (a round and the range take their own Time of day, picked with the sky). Off: the sun higher, in the middle of the day. A² Golf reloads to change it.",
  },
  {
    id: "hardsun",
    label: "Harder sunlight",
    cost: "none",
    reload: true,
    help: "The sun stronger and the sky's light softer, as on a clear day: shade under a third as bright as the sun rather than half, so trees, slopes and bunker faces stand out (less so as the sun gets low, so an evening round isn't dark). Off: the softer, flatter light the game had. A² Golf reloads to change it.",
  },
  // The owner, 10 October 2026, of the next round of improvements:
  // "Everything has an on and off switch, so regardless of whether I can
  // run everything, others can".
  {
    id: "grassfield",
    label: "Grass all over the hole",
    cost: "heavy",
    costWhen: "and a longer wait while each hole's built",
    reload: true,
    notOn: ["standard"],
    help: "Tufts of longer grass all over every hole's rough and long grass, as thick far out as by the ball, see-through round the ball so you can always find it. Off: tufts only by the tee and round the green. A² Golf reloads to change it.",
  },
  {
    id: "fineleaves",
    label: "Finer leaves",
    cost: "some",
    costWhen: "with trees near you, and a moment longer to start",
    reload: true,
    notOn: ["standard", "medium"],
    help: "On Standard and Medium: the trees near you drawn with more, smaller leaves - their crowns, boughs and pine sprays - so a tree close by reads as leaves, not as cards of them. Off: fewer, larger cards, as before. A² Golf reloads to change it.",
  },
  {
    id: "clock",
    label: "Time of day from the clock",
    cost: "none",
    reload: true,
    help: "The sun where it would be at this time of day on the practice greens and in the Challenges: low and soft in the morning, high at midday, low and golden in the evening (a round and the range take their own Time of day, picked with the sky). In place of Late-afternoon light while it's on. A² Golf reloads to change it.",
  },
  {
    id: "seasons",
    label: "Seasons",
    cost: "none",
    reload: true,
    help: "The course in today's season: fresher, lighter greens in spring, the usual deep green in summer, golds, coppers and reds in the broadleaves in autumn, duller grass and dead brown leaves in winter. A² Golf reloads to change it.",
  },
  {
    id: "rainground",
    label: "Rain on the ground",
    cost: "some",
    costWhen: "only while it rains",
    notOn: ["standard"],
    help: "While it rains, drops splashing on the grass all round you, and rings spreading on the puddles. (Ponds ring in the rain either way.)",
  },
  {
    id: "wetshine",
    label: "Reflections on wet ground",
    cost: "light",
    costWhen: "only after rain",
    reload: true,
    notOn: ["standard"],
    help: "After rain the grass and paths shine with the sky's light, most where you look along them. A² Golf reloads to change it.",
  },
];
export const EFFECT_IDS = EFFECTS.map((e) => e.id);
// The safety valve's steps for the effects it sheds, by id.
export const EFFECT_STEPS = Object.fromEntries(EFFECTS.filter((e) => e.step).map((e) => [e.id, e.step]));

// What each effect typically costs, said under its switch with what the
// speed test measured it at here, if it has (the owner, 26 October 2026:
// "on all versions show the typical effect of each of the effects, so
// someone can choose effectively what to save on"). Of each frame's time,
// on a typical graphics card at the setting it's made on: a rough guide -
// the speed test says what it is on this one.
export const COST_WORDS = {
  saves: "less than nothing: it saves more than half the picture's drawing",
  none: "next to nothing (only the colours or the light change)",
  light: "light, about 1 to 3% of each frame",
  some: "some, about 4 to 8% of each frame",
  heavy: "heavy, about 10 to 20% of each frame",
};
// The line: "Typical cost: heavy, about 10 to 20% of each frame. Measured
// here: 2.4 ms a frame (11%) at Medium's slowest moment (the highest setting)." runs: the speed
// test's kept runs, newest first (cleanHistory) - the newest that measured
// it (one run with it off can't: it's left out of that run's costs).
export function costNote(id, runs = []) {
  const e = EFFECTS.find((x) => x.id === id);
  if (!e?.cost) return "";
  const typical = `Typical cost: ${COST_WORDS[e.cost]}${e.costWhen ? `, ${e.costWhen}` : ""}.`;
  const m = e.step ? measuredCost(runs, e.step) : null;
  return m ? `${typical} Measured here: ${m.ms} ms a frame (${Math.round(m.share * 100)}%) at Medium's slowest moment (the highest setting).` : typical;
}
function measuredCost(runs, step) {
  for (const run of Array.isArray(runs) ? runs : [])
    for (const r of run?.results ?? []) {
      const c = r?.costs?.find((x) => x.name === step);
      if (c && Number.isFinite(c.ms)) return c;
    }
  return null;
}
const byId = Object.fromEntries(EFFECTS.map((e) => [e.id, e]));

// The presets: Default turns everything on; Performance the same but for
// the heavier effects. A Standard PC starts on Performance.
//
// The phone (the app's page, window.pocket - set before the game's code,
// pocket/start.js) starts on Performance whatever its setting, and there
// Performance also leaves out what a six-inch screen can't show (PHONE_OFF:
// the grass blades and sand grains near the ball, tufts all over the hole
// far out, the sky's shine on wet ground, the finer leaves) - each a frame's work for a
// phone's graphics chip, the first a texture's loading and memory too.
// Each is still its own switch.
export const ON_PHONE = typeof globalThis !== "undefined" && !!globalThis.pocket;
export const PHONE_OFF = ["textures", "grassfield", "fineleaves", "wetshine"];
export const PRESETS = ["default", "performance"];
export const PRESET_NAMES = { default: "Default", performance: "Performance", custom: "Your own" };
export function presetSwitches(preset, phone = ON_PHONE) {
  return Object.fromEntries(EFFECTS.map((e) => [e.id, preset === "performance" ? !e.heavy && !(phone && PHONE_OFF.includes(e.id)) : true]));
}
export const firstPreset = (level, phone = ON_PHONE) => (phone || level === "standard" ? "performance" : "default");

// Which preset a set of switches is, or "custom".
// Only the switches made at the graphics setting count (`level`; none
// given, all of them): on High, Ultra's own are never seen, so they can't
// make Performance "Your own".
export function presetOf(on, level = null) {
  const ids = EFFECT_IDS.filter((id) => !level || madeOn(id, level));
  return PRESETS.find((p) => ids.every((id) => !!on[id] === presetSwitches(p)[id])) ?? "custom";
}

// The saved "effects" setting, made sound: { on: { id: true/false } } for
// every effect - those never saved from the preset this graphics setting
// starts on - and the preset that is.
export function readEffects(saved, level = "medium") {
  const s = saved && typeof saved === "object" ? saved : {};
  const base = presetSwitches(PRESETS.includes(s.preset) ? s.preset : firstPreset(level));
  const kept = s.on && typeof s.on === "object" ? s.on : {};
  const on = Object.fromEntries(EFFECT_IDS.map((id) => [id, typeof kept[id] === "boolean" ? kept[id] : base[id]]));
  return { on, preset: presetOf(on, level) };
}

// What's saved: every switch, and the preset they make.
const saving = (on, level = null) => ({ on: { ...on }, preset: presetOf(on, level) });

// One switch changed.
export function setEffect(saved, id, value, level) {
  const { on } = readEffects(saved, level);
  if (!(id in byId)) return saving(on, level);
  return saving({ ...on, [id]: !!value }, level);
}

// A preset chosen: every switch set from it.
export function choosePreset(saved, preset, level) {
  if (!PRESETS.includes(preset)) return saving(readEffects(saved, level).on, level);
  return saving(presetSwitches(preset), level);
}

// Whether going from one set of switches to another needs the page
// reloaded (a change to something built into the scene).
export function needsReload(before, after) {
  return EFFECTS.some((e) => e.reload && !!before?.[e.id] !== !!after?.[e.id]);
}

// Whether an effect is made at this graphics setting at all.
export const madeOn = (id, level) => !(byId[id]?.notOn ?? []).includes(level);

// What's actually used: the switch, where it's made.
export function effectsInUse(saved, level) {
  const { on } = readEffects(saved, level);
  return Object.fromEntries(EFFECT_IDS.map((id) => [id, on[id] && madeOn(id, level)]));
}

// The effects drawn over the finished picture (the picture buffer,
// look/effects.js): with none of them on, the picture goes straight to the
// screen as it always did.
export const SCREEN_EFFECTS = ["grade", "ao", "fxaa", "bloom", "dof", "shafts", "focus", "taa"];
export const usesBuffer = (on) => SCREEN_EFFECTS.some((id) => on?.[id]);
