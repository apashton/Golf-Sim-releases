// The loading screen's stages, in the order the page goes through them, and
// how far along each one puts the bar. The page used to show its top bar
// half filled in over a blank picture, freeze for the length of the load,
// then draw everything at once; now a loading screen is up from the first
// paint, says which part is being built, and goes once the first whole
// picture has been drawn. Pure: given the stages reached, it says what the
// bar shows; loading.js draws it, app.js says when each stage starts.
//
// The weights are rough shares of a load measured headlessly (each mode's
// scenery, the shaders, the first picture): they only need to keep the bar
// moving evenly rather than jumping or stalling.

export const MODE_STAGES = ["range", "putting", "chipping", "course", "challenges"];

export const STAGES = {
  start: { words: "Starting the graphics", weight: 1 },
  range: { words: "Building the driving range", weight: 5 },
  putting: { words: "Laying out the putting green", weight: 2 },
  chipping: { words: "Building the chipping green", weight: 3 },
  course: { words: "Getting the course ready", weight: 4 },
  challenges: { words: "Setting up the Challenges", weight: 4 },
  setup: { words: "Setting up", weight: 3 },
  // The shaders' two parts, under the same words: waiting for the card to
  // build the opening picture's shaders (shaders), then each drawn once
  // where nothing shows (drawing). Apart in the load's times, so a report
  // says which of them takes the time (a report's "shaders 22.0 s" of a
  // 34.2 s start couldn't).
  shaders: { words: "Preparing the picture", weight: 1 },
  drawing: { words: "Preparing the picture", weight: 1 },
  round: { words: "Laying out the hole", weight: 6 },
  textures: { words: "Bringing in the textures", weight: 1 },
  picture: { words: "Drawing the first picture", weight: 3 },
};

// The stages of this load, in order. round: a round starts as the page
// loads (a course picked from the designer).
export function loadPlan({ round = false } = {}) {
  const ids = ["start", ...MODE_STAGES, "setup", "shaders", ...(round ? ["round"] : []), "drawing", "textures", "picture"];
  return ids.map((id) => ({ id, ...STAGES[id] }));
}

// How far along the bar is, 0 to 1, at the start of stage `id` (with
// `within` of that stage done, 0 to 1). A stage not in the plan leaves it
// where it was: never backwards.
export function progressAt(plan, id, within = 0) {
  let total = 0;
  for (let i = 0; i < plan.length; i++) total += plan[i].weight;
  total = total || 1;

  let before = 0;
  for (let i = 0; i < plan.length; i++) {
    const p = plan[i];
    if (p.id === id) return Math.min(1, (before + p.weight * clamp01(within)) / total);
    before += p.weight;
  }
  return null;
}

// The order the modes' shaders are prepared in: the one on screen first,
// the rest in the usual order.
export function warmOrder(modes, first) {
  const list = [...modes];
  return list.includes(first) ? [first, ...list.filter((m) => m !== first)] : list;
}

// The pictures behind the loading screen's bar (public/loadingshots, taken
// from the game itself by tools/loadingshots.mjs): the game rather than a
// blank while it's built, with a line on what each shows. mode: the mode
// it's of - the loading screen shows one of the mode the game is opening
// in, where there is one.
export const LOADING_SHOTS = [
  { file: "range.jpg", mode: "range", title: "The Driving Range", line: "every ball's flight, with its tracer, carry and spin" },
  { file: "course-tee.jpg", mode: "course", title: "Your Courses", line: "real-looking holes from a scorecard - or from the map, on its real ground" },
  { file: "course-fairway.jpg", mode: "course", title: "A Round, Shot by Shot", line: "the wind in the flags, the lie, and the club for the shot" },
  { file: "putting.jpg", mode: "putting", title: "The Putting Green", line: "read the slopes on the grid, then roll it in with real cup physics" },
  { file: "pong.jpg", mode: "putting", title: "Golf Pong", line: "on a real green - one against one, three side by side, or four-way" },
  { file: "chipping.jpg", mode: "chipping", title: "The Chipping Green", line: "land it on the spot and let it run up to the hole" },
];

// The picture for a load: one of the mode's (any, if it has none), never
// the one shown last time when there's another.
export function loadingShot(mode, last = null, rand = Math.random, shots = LOADING_SHOTS) {
  const own = shots.filter((s) => s.mode === mode);
  const pool = (own.length ? own : shots).filter((s) => s.file !== last);
  const list = pool.length ? pool : own.length ? own : shots;
  return list.length ? list[Math.floor(rand() * list.length) % list.length] : null;
}

// Where the session notes the game has started (app.js, once Who's playing
// has been asked or passed by): a reload while it runs finds it; a new
// start of the game doesn't (it's the window's, gone when it closes).
export const STARTED_KEY = "a2-who-asked";

// Whether this load is the game starting, not a reload while it runs.
// store: sessionStorage (none, or one that can't be read: a start).
export function freshStart(store = globalThis.sessionStorage) {
  try {
    return store?.getItem(STARTED_KEY) !== "1";
  } catch {
    return true;
  }
}

// The mode the page opens in: the address's ?mode= (the designer's "Play"),
// else, as the game starts (fresh), the range - whatever was played last
// (the owner: "I'd like to always open on the range") - and on a reload
// while it runs (a graphics change, the speed test, a page that hung) the
// one it was in.
export function startingMode(search, saved, modes = MODE_STAGES, { fresh = false } = {}) {
  const asked = new URLSearchParams(search ?? "").get("mode");
  if (asked && modes.includes(asked)) return asked;
  if (fresh) return "range";
  return modes.includes(saved) ? saved : "range";
}

// What a report says about the last load (electron/report.mjs): how long
// until the game could be played, the stages that took longest, and the
// longest the picture stood still meanwhile. times: [[id, ms from the page
// starting]] in order, with "done" last; longest: ms.
export function loadSummary(times, longest = 0) {
  const list = (Array.isArray(times) ? times : []).filter((t) => Array.isArray(t) && Number.isFinite(t[1]));
  const done = list.find(([id]) => id === "done");
  if (!done) return null;
  const stages = [];
  for (let i = 0; i < list.length - 1; i++) {
    const [id, at] = list[i];
    if (id === "done") break;
    stages.push([id, Math.max(0, Math.round(list[i + 1][1] - at))]);
  }
  return {
    ms: Math.round(done[1]),
    longest: Math.round(Number(longest) || 0),
    slowest: [...stages].sort((a, b) => b[1] - a[1]).slice(0, 3),
  };
}

function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v) || 0));
}
