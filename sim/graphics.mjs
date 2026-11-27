// The graphics settings - by their ids standard, medium, high and ultra,
// named Very low, Low, Standard and Medium since November 2026 (NAMES;
// below, as in the backlog's notes from before, the old names) - and what the game
// says about them: which one to build, which comes next on G, the highest
// the player allows, and what the picture is drawing now once the safety
// valve has stepped it down ("High → Medium"). Pure: look/quality.js reads
// the saved setting through it, fps.js and look/safety.js do the switching.
//
// Medium is what High was before there were three: the same picture. High
// is Medium with extras that are only counts and distances (3D trees out
// to 300 m, half as many again far woods, long grass round the ball), so
// the game can drop them between shots without reloading - High stepping
// down to Medium. Ultra is High and more, for faster cards than the
// owner's GTX 1070 (docs/GRAPHICS-NEXT.md): the long grass fuller and
// further out to begin with, dropped the same way - Ultra stepping down to
// High.

export const SETTINGS = ["standard", "medium", "high", "ultra"];
// What a player reads for each (the owner, 4 November 2026, from the
// graphics plan: the settings renamed one step down, to make room above
// for a new High and Ultra on WebGPU - docs/BACKLOG-GRAPHICS.md, step 6).
// Each keeps its id, so a player's setting is the same picture under its
// new name: what was Standard is Very low, Medium is Low, High is Standard
// and Ultra is Medium. FORMER: the names they had, for the note that says
// so once (formerNote).
export const NAMES = { standard: "Very low", medium: "Low", high: "Standard", ultra: "Medium" };
export const FORMER = { standard: "Standard", medium: "Medium", high: "High", ultra: "Ultra" };

// The note, once, for a player who chose a setting under its old name:
// what it's called now - "" for one never told before who has nothing
// saved, or once told.
export function formerNote(saved, told) {
  const s = saved?.setting ?? saved?.level;
  if (told || !SETTINGS.includes(s)) return "";
  return `The graphics settings have new names - your ${FORMER[s]} is now called ${NAMES[s]}, the same picture. Very low, Low, Standard and Medium today; a new High and Ultra come later.`;
}
// A first start, with nothing saved: Medium, the picture everyone had.
export const FIRST = "medium";
export const TOP = SETTINGS.at(-1);

const rank = (s) => SETTINGS.indexOf(s);
export const above = (a, b) => rank(a) > rank(b);
const known = (s) => SETTINGS.includes(s);

// The saved "graphics" setting, made sound:
//   setting  the one chosen (menu or G)
//   highest  the highest the game may use (null: no limit - the top, so a
//            setting added later is allowed too)
//   fixed    "Don't adjust automatically": the setting stays as chosen
//            whatever the frame rate
// Saved before Medium existed ({ level: "high" }), High is Medium - the
// same picture - and { level: "standard" } Standard. valve: false (what
// tools/lookshots.mjs sets, to measure a slow browser's picture) is fixed
// too. The setting is never above the highest.
export function readGraphics(saved = {}) {
  const s = saved && typeof saved === "object" ? saved : {};
  const old = s.level === "standard" ? "standard" : s.level === undefined ? null : "medium";
  const highest = known(s.highest) ? s.highest : TOP;
  let setting = known(s.setting) ? s.setting : (old ?? FIRST);
  if (above(setting, highest)) setting = highest;
  return { setting, highest, fixed: s.fixed === true || s.valve === false };
}

// The saved object with these changes, keeping what else is in it (the
// trees' and valve's flags), with level kept in the old terms for an
// older version of the game reading it.
function saving(saved, { setting, highest, fixed }) {
  const out = { ...(saved && typeof saved === "object" ? saved : {}), setting, highest: highest === TOP ? null : highest, fixed: !!fixed };
  out.level = setting === "standard" ? "standard" : "high";
  return out;
}

// Choosing a setting (the menu, G): above the highest raises the highest
// with it - choosing it says it's wanted.
export function chooseSetting(saved, setting) {
  const g = readGraphics(saved);
  if (!known(setting)) return saving(saved, g);
  return saving(saved, { ...g, setting, highest: above(setting, g.highest) ? setting : g.highest });
}

// Choosing the highest: a setting above it comes down to it.
export function chooseHighest(saved, highest) {
  const g = readGraphics(saved);
  if (!known(highest)) return saving(saved, g);
  return saving(saved, { ...g, highest, setting: above(g.setting, highest) ? highest : g.setting });
}

// "Don't adjust automatically" on or off.
export function chooseFixed(saved, fixed) {
  return saving(saved, { ...readGraphics(saved), fixed: !!fixed });
}

// G: the next setting up, and from the highest round to Standard.
export function nextSetting(setting, highest = TOP) {
  const i = rank(setting);
  return i < 0 || i >= rank(highest) ? SETTINGS[0] : SETTINGS[i + 1];
}

// The steps the safety valve may take on a picture built at `built`, in
// the order they're taken: each setting's own extras from the top down
// (High's, then Medium's), then the whole picture drawn smaller.
//   steps: [{ name, of }] registered (look/safety.js); of: "high" or
//   "medium" for a setting's extras, "picture" for drawing it smaller
// Returns those in use, in order.
export function ladder(built, steps) {
  // The picture's effects (look/effects.js: the far blur, bloom, ambient
  // occlusion) go first, on every setting: they're the finish, not the
  // detail - after only a step marked `first` (Ultra's supersampling, the
  // dearest of all: look/renderscale.js). The picture's own size goes last.
  const group = (s) => (s.first ? 100 : s.of === "effects" ? 99 : s.of === "picture" ? -1 : rank(s.of));
  const used = (s) => s.of === "picture" || s.of === "effects" || (s.of !== "standard" && known(s.of) && !above(s.of, built));
  return steps.filter(used).sort((a, b) => group(b) - group(a) || a.order - b.order);
}

// What the picture is drawing now, in words, for the frame-rate readout
// and the reports:
//   built: the setting the picture was built at; steps: the ladder in use
//   (ladder()); shed: how many of them are shed; scale: the picture's size
//   (1, 0.85, 0.7)
// "High", "High (reduced)" (some of High's extras shed), "High → Medium"
// (all of them: it's drawing Medium's picture), "High → Medium (reduced)"
// (some of Medium's too), "Medium (reduced)", "Ultra → High"..., each
// with ", picture 85%" when drawn smaller.
export function settingText({ built, steps = [], shed = 0, scale = 1 }) {
  const now = settingNow({ built, steps, shed });
  const reduced = steps.slice(0, shed).some((s) => s.of === now);
  const name = `${NAMES[built] ?? built}${now !== built ? ` → ${NAMES[now]}` : ""}${reduced ? " (reduced)" : ""}`;
  return scale < 1 ? `${name}, picture ${Math.round(scale * 100)}%` : name;
}

// The setting the picture is drawing now: down one from `built` for each
// whose extras are all shed - never below Medium, since Standard is built
// differently, not reached by shedding. "high", "medium"...
export function settingNow({ built, steps = [], shed = 0 }) {
  const gone = steps.slice(0, shed);
  let now = built;
  while (above(now, "medium")) {
    const own = steps.filter((s) => s.of === now);
    if (!own.length || !own.every((s) => gone.includes(s))) break;
    now = SETTINGS[rank(now) - 1];
  }
  return now;
}

// How many of the ladder's steps are above `highest`: those stay shed
// (a High picture with Medium the highest draws Medium's).
export function shedForHighest(steps, highest) {
  return steps.filter((s) => s.of !== "picture" && above(s.of, highest)).length;
}

// The switch the valve settled on (sim/safetyvalve.mjs settled: the step
// it stopped going back and forth over), as the question it asks:
//   { upper, lower } setting names when it was between two settings
//   (High's last extra: High and Medium), or null when it was within one
//   (nothing to ask: it stays on the lower step).
export function settledBetween(steps, settled) {
  if (!Number.isInteger(settled) || settled < 1 || settled > steps.length) return null;
  const step = steps[settled - 1];
  if (step.of === "picture" || !known(step.of)) return null;
  const own = steps.filter((s) => s.of === step.of);
  if (own.at(-1) !== step) return null;
  // (Shedding Medium's own steps isn't Standard: that's built differently.)
  const lower = SETTINGS[rank(step.of) - 1];
  return lower && lower !== "standard" ? { upper: step.of, lower } : null;
}

// The question then, between shots.
export function settleQuestion({ upper, lower }) {
  return `The graphics keep switching between ${NAMES[upper]} and ${NAMES[lower]} on this PC. Make ${NAMES[lower]} the highest setting?`;
}

// What the readout says on the end of a slow picture (sim/framerate.mjs):
//   fixed: "Don't adjust automatically" - only that it's slow
//   spent: the valve has shed every step it has, so only a lower setting
//   is left; next: the setting G goes to (from High, round to Standard)
// Nothing while the valve still has steps to take, or on Standard.
export function slowWords({ built, fixed = false, spent = true, next = "standard" }) {
  if (fixed) return "slow picture";
  if (built === "standard" || !spent) return "";
  return next === "standard" ? `G for ${NAMES.standard}` : `${NAMES.standard} in the menu`;
}

// The advice once the valve has settled between two settings ({ upper,
// lower }: settledBetween), for the readout and the reports.
export function settleAdvice({ upper, lower }) {
  return `Kept switching ${NAMES[upper]} ↔ ${NAMES[lower]}: ${NAMES[lower]} as the highest setting would suit this PC`;
}
