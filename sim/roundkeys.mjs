// Starting and leaving a course round from the mat, and whether the app
// opens in bay view. Pure, so they can be tested; course.js and app.js use
// them.

// The course N starts: the one picked in the course panel, else the one
// last played, else the first there is. Null when there are no courses yet
// (or the list hasn't arrived from the server).
export function pickNextCourse(list, picked, lastPlayed) {
  const courses = Array.isArray(list) ? list : [];
  const id = picked || lastPlayed;
  return courses.find((c) => c.id === id) ?? courses[0] ?? null;
}

// What bay view says when no round is going: how to start one. keys:
// whether there's a keyboard to name keys on (not the phone app, where
// the card over the picture says it and its button starts the round).
export function idleNote(course, { keys = true } = {}) {
  if (!keys) return "";
  return course ? `Press N to play ${course.name}` : "Make a course in the course designer";
}

// After a round, what starts the next: N, or with no keyboard the touch
// strip's Start round. again: it's the same course.
export function playAgainNote(name, { again = false, keys = true } = {}) {
  return `${keys ? "Press N" : "Start round"} to play ${name}${again ? " again" : ""}`;
}

// A button's words with its key ("Next hole (N)"), or without where
// there's no keyboard (the phone app).
export const keyed = (label, key, keys = true) => (keys ? `${label} (${key})` : label);

// What N does in course mode:
//   "clear" - the round is over and its celebration is still showing: the
//             first N clears it, so the result can be read first
//   "start" - no round going (or the last one over): start one
//   "hole"  - this hole is finished: on to the next
//   "turn"  - with friends, the pause after a shot: the next player's turn now
//   null    - nothing (a shot is still in the air, or mid-hole)
export function nextAction({ round, flying = false, celebrationShowing = false, multi = false }) {
  if (flying) return null;
  if (!round || round.finished) return round?.finished && celebrationShowing ? "clear" : "start";
  if (round.done) return "hole";
  if (multi && round.pending) return "turn";
  return null;
}

// Whether anyone has finished a hole in this round.
export function anyScores(round) {
  return !!round?.players?.some((p) => (p.scores ?? []).some((s) => s != null));
}

// A round that's been played into - a shot hit, or a hole finished - and
// isn't over. Only then does leaving it (a new round, the course designer,
// a reload) ask first.
export function roundUnderway(round) {
  if (!round || round.finished) return false;
  return anyScores(round) || round.players.some((p) => p.strokes > 0);
}

// The menu's Restart the round and End the round (the owner, 16 October
// 2026: "Need to be able to restart and finish a round in the menu
// somewhere"): for a round of this bay's own - online, the panel's Leave
// the game - Restart whenever there's one (a finished one played again),
// End only while it isn't over. (A Postal ladder match's round is one go:
// it can be ended - the holes not played lost - but not restarted.)
export const canRestartRound = (round) => Boolean(round) && !round.net && !round.ladder?.postal && !round.postSeason;
export const canEndRound = (round) => Boolean(round) && !round.net && !round.finished;

// Whether to start in bay view. The app's "Start in bay view" setting
// arrives as ?bay=1 or ?bay=0 and wins; without it, bay view is as it was
// last left.
export function startInBay(flag, lastLeft) {
  if (flag === "1") return true;
  if (flag === "0") return false;
  return !!lastLeft;
}

// The address's query with the bay flag taken off (keeping anything else,
// such as the designer's ?mode=course&course=...), so a reload keeps
// whatever the player has chosen since. "" when nothing is left; null when
// there was no flag to take off.
export function withoutBayFlag(search) {
  const params = new URLSearchParams(search);
  if (!params.has("bay")) return null;
  params.delete("bay");
  const rest = params.toString();
  return rest ? `?${rest}` : "";
}

// ---- The course's screen before a round -------------------------------------------
// With no round going, the course shows the first hole of the course N
// plays, the camera craning slowly down it and back, behind a card that
// says what to do (the owner: "a better temp screen before we hit n to
// start a new course, currently it's a blank screen (slightly cloudy) and
// looks a bit odd"). These say what's on the card; course.js draws it.

// The other courses there are, played most lately first (never-played ones
// after, by name), up to `max`: the card's "Also here". Not the one N plays.
export function otherCourses(list, nextId, max = 3) {
  const courses = (Array.isArray(list) ? list : []).filter((c) => c && c.id !== nextId);
  const when = (c) => {
    const t = Date.parse(c.played ?? "");
    return Number.isFinite(t) ? t : -Infinity;
  };
  return courses
    .map((c, i) => ({ c, i, t: when(c) }))
    .sort((a, b) => b.t - a.t || a.i - b.i)
    .slice(0, Math.max(0, max))
    .map(({ c }) => c);
}

// Where the course, players and game are picked, said for the screen the
// card is on: "panel" (one window, the side panel showing), "bay" (one
// window in bay view: B brings the panel back) or "controls" (separate
// windows: the controls window has it).
export const INTRO_WHERE = {
  panel: "Course, players and game: in the side panel",
  bay: "Course, players and game: in the side panel (B leaves bay view)",
  controls: "Course, players and game: in the controls window",
};

// The card's words. next: the course N plays (a list entry: name, holes,
// par, yards, best, bestBy), or null; list: every course; players: their
// names; format: the game's name (sim/formats.mjs FORMAT_NAMES); first:
// the first hole's { par, yards } if known; where: INTRO_WHERE's key;
// voice: whether voice is on (its show reel words are then worth saying);
// wake: its wake word in a word ("Caddie"), said first, or null; tees:
// the tees the round will be played from (sim/tees.mjs), and yards the
// course's length from them, if known (else the card's).
// Every key and phrase named here is one the game has (bay.js SHORTCUTS,
// sim/voicecmd.mjs). keys: false where there's no keyboard (the phone
// app): no keys named, no key badge (key, "N" or null). levels: { line,
// count } - who plays at which level with the mouse, a finger or a
// controller (sim/levelchoice.mjs levelsLine) and how many - given back as
// levels: { line, button } to change them before the round, or null.
export function introCard({ next = null, list = [], players = [], format = "", first = null, where = "panel", voice = false, wake = null, tees = null, yards = null, keys = true, levels = null } = {}) {
  const hint = [INTRO_WHERE[where] ?? INTRO_WHERE.panel, ...(keys ? ["R P C X: the other modes", "H: all the keys"] : [])];
  if (!next) {
    return {
      title: "No courses yet",
      lines: ["Open the course designer, type in a scorecard, and it designs the holes for you."],
      button: null,
      key: null,
      others: [],
      hint: hint.join(" · "),
    };
  }
  const n = (v) => (Number.isFinite(v) ? Math.round(v).toLocaleString("en-GB") : null);
  const length = n(yards) ?? n(next.yards);
  const facts = [next.holes ? `${next.holes} ${next.holes === 1 ? "hole" : "holes"}` : null, Number.isFinite(next.par) ? `par ${next.par}` : null, length ? `${length} yds` : null, tees ? `${tees} tees` : null].filter(Boolean);
  const names = (Array.isArray(players) ? players : []).filter(Boolean);
  const who = names.length > 1 ? `${names.join(", ")} - ${String(format || "stroke play").toLowerCase()}` : (names[0] ?? "One player");
  const best = Number.isFinite(next.best) ? `best round ${next.best}${next.bestBy ? ` (${next.bestBy})` : ""}` : "not played yet";
  const lines = [facts.join(" · "), `${who} · ${best}`];
  if (first && Number.isFinite(first.par)) lines.push(`Hole 1: par ${first.par}${n(first.yards) ? `, ${n(first.yards)} yds` : ""}`);
  if (voice) hint.push(`Say "${wake ? `${wake}, ` : ""}play the show reel" to watch the game play itself`);
  return {
    title: next.name,
    lines: lines.filter(Boolean),
    levels: levels?.line ? { line: levels.line, button: levels.count > 1 ? "Change levels" : "Change level" } : null,
    button: keyed("Start a round", "N", keys),
    key: keys ? "N" : null,
    others: otherCourses(list, next.id).map((c) => c.name),
    hint: hint.join(" · "),
  };
}
