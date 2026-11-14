// How hard a made-up swing - the mouse on the swing pad, a game controller's
// stick - plays: a level each player picks (the owner, 23 October 2026: "I
// want to make it really work well with controller so the different users
// have fun and have a level of difficulty ... being able to tweak the
// difficulty whilst keeping it fun for a controller or mouse user is
// important").
//
// Every level has its own distances (the owner, 25 October 2026: "max
// distance does depend on pro settings tour being able to go 320. Pro 300,
// 20 yard steps down ... Beginner lowest distance would be 180 maxed out
// 220" - "cant have 320 drives on beginner level"): DRIVES is a level's
// longest drive, carry and roll, with Power (sim/skills.mjs) maxed; with
// no Power points it's DRIVE_FROM of that (Beginner's 180 of its 220), and
// each point a tenth of the way between. The rest of the bag goes with the
// driver (sim/madeshot.mjs reachOf); a full swing (100%) carries the club's
// distance at that, a part swing that share of it. Custom drives as one of
// the four (its `drive`). The levels also change the help:
//
//   faults  how much a crooked swing shows (start line and curve): 1 as
//           measured (as the old swing pad's Normal), less to forgive it,
//           more to punish it
//   mark    a mark on the swing pad where to stop for the flag
//   snap    within this many percent of the mark, the swing is taken as the
//           mark itself (0: never)
//   putt    on the green: "read" - the line read and the pace marked,
//           "pace" - only the pace marked, aimed where you aim, "none" -
//           neither: the green's yours to read
//   tempo   how much the swing's rhythm counts ("off", "light", "on",
//           "strict"): back three times as long as through is pure
//   over    how much harder each percent past a full swing makes it (an
//           overswing goes to 105%), and pulling too far past that
//           (madeshot.mjs BEYOND): hardly at all at Beginner, whose short
//           distances are price enough, softly at Amateur, more at Pro,
//           much more at Tour (the owner, 25 October 2026: "Beginner
//           should hardly be punished ... Amateur starts softly ... pro
//           ramps it up a bit more, tour is only for the well versed")
//   tooFar  where pulling too far starts (percent of the pull): later the
//           easier the level, so a finger overshooting at Beginner isn't
//           over the top
//   wobble  how far a finger (or a stick) can wander sideways at the
//           strike, and lean as it pushes up, before it counts at all
//           (shares of the full pull, and the lean's tan): a finger never
//           comes back up quite the way it went down
//   spread  the golfer's own spread (madeshot.mjs SPREAD), and mishit how
//           often one comes off the middle, against Amateur's as it was
//
// The owner, 29 October 2026, on the touch screen: "still way to harsh ...
// for beginners need to allow for more room on power and accuracy ...
// just make it overall a lot easier for touching on beginner and amateur.
// Pro and tour then get a bit harder and a bit more harsh on the
// penalties" - tuned with a finger's swings (madeuphcp.mjs FINGER,
// tools/swinglevels.mjs --finger).
//
// A player's level is theirs (Saved players), else the menu's; Custom is
// the menu's own set of the above. An online round's host can say none
// plays easier than a level (sim/netrules.mjs). Pure.

import { clamp } from "./mathutil.mjs";

export const TEMPOS = {
  off: { label: "Doesn't count", weight: 0, band: null },
  light: { label: "Counts a little", weight: 0.5, band: [1.6, 7] },
  on: { label: "Counts", weight: 1, band: [2, 5] },
  strict: { label: "Counts a lot", weight: 1.5, band: [2.4, 4] },
};
export const TEMPO_ORDER = ["off", "light", "on", "strict"];
export const PUTT_HELP = { read: "Line read and pace marked", pace: "Pace marked", none: "Neither - read it yourself" };
export const PUTT_ORDER = ["read", "pace", "none"];

export const LEVELS = {
  beginner: { label: "Beginner", help: "the flag's and the shot's marks on the pad, near enough counts, a wobble forgiven, putts read for you, rhythm doesn't count", faults: 0.25, mark: true, snap: 12, putt: "read", tempo: "off", over: 0.1, tooFar: 118, wobble: { start: 0.08, slant: 0.2 }, spread: 0.6, mishit: 0.2 },
  amateur: { label: "Amateur", help: "the flag's and the shot's marks on the pad, near enough counts, putts' pace marked, rhythm counts a little", faults: 0.5, mark: true, snap: 6, putt: "pace", tempo: "light", over: 0.35, tooFar: 112, wobble: { start: 0.045, slant: 0.11 }, spread: 0.8, mishit: 0.5 },
  pro: { label: "Pro", help: "no marks - your own distances and reads, rhythm counts, overdoing it costs", faults: 1.35, mark: false, snap: 0, putt: "none", tempo: "on", over: 1.15, tooFar: 108, wobble: { start: 0.01, slant: 0.02 }, spread: 1.2, mishit: 1.25 },
  tour: { label: "Tour", help: "every fault shows, rhythm counts a lot, overdoing it costs dearly", faults: 2, mark: false, snap: 0, putt: "none", tempo: "strict", over: 1.8, tooFar: 108, wobble: { start: 0, slant: 0 }, spread: 1.6, mishit: 1.6 },
  custom: { label: "Custom", help: "the help picked below" },
};
export const LEVEL_ORDER = ["beginner", "amateur", "pro", "tour", "custom"];
// Easiest first: the ones an online host can hold everyone to.
export const RANKED = ["beginner", "amateur", "pro", "tour"];
export const DEFAULT_LEVEL = "beginner";
export const DEFAULT_CUSTOM = Object.freeze({ faults: 1, mark: true, snap: false, putt: "pace", tempo: "on", drive: "amateur" });
// A level's longest drive (yards, carry and roll on a fairway, still air)
// with Power maxed, and the share of it with no Power points.
export const DRIVES = Object.freeze({ beginner: 220, amateur: 260, pro: 300, tour: 320 });
export const DRIVE_FROM = 180 / 220;
// A level's drive (yards, carry and roll) with `power` of the way from its
// shortest to its longest (0 to 1: Power's ranks out of ten). `drive`: a
// RANKED level, as levelHelp gives it.
export function driveTotal(drive, power = 0) {
  const most = DRIVES[drive] ?? DRIVES[DEFAULT_CUSTOM.drive];
  return most * (DRIVE_FROM + (1 - DRIVE_FROM) * clamp(Number(power) || 0, 0, 1));
}
// The forgiveness slider's ends: as forgiving as Beginner, harsher than Tour.
export const FAULTS = [0.25, 2.5];
// Custom's tooFar, wobble, spread and mishit: the ranked levels', between
// the two whose faults its slider sits between.
function byFaults(f) {
  const at = RANKED.map((k) => LEVELS[k]);
  const up = at.findIndex((l, j) => j > 0 && f <= l.faults);
  const i = Math.max(0, Math.min(at.length - 2, (up < 0 ? at.length - 1 : up) - 1));
  const [a, b] = [at[i], at[i + 1]];
  const t = clamp((f - a.faults) / (b.faults - a.faults), 0, 1);
  const mix = (x, y) => x + (y - x) * t;
  return { tooFar: mix(a.tooFar, b.tooFar), wobble: { start: mix(a.wobble.start, b.wobble.start), slant: mix(a.wobble.slant, b.wobble.slant) }, spread: mix(a.spread, b.spread), mishit: mix(a.mishit, b.mishit) };
}

// The old "How forgiving" (easy, normal, hard), as a level.
const OLD_HELP = { easy: "beginner", normal: "amateur", hard: "pro" };
export const cleanLevel = (v) => (Object.hasOwn(LEVELS, v) ? v : (OLD_HELP[v] ?? DEFAULT_LEVEL));

export function cleanCustom(c) {
  const d = DEFAULT_CUSTOM;
  const f = Number(c?.faults);
  return {
    faults: Number.isFinite(f) ? clamp(Math.round(f * 20) / 20, FAULTS[0], FAULTS[1]) : d.faults,
    mark: typeof c?.mark === "boolean" ? c.mark : d.mark,
    snap: typeof c?.snap === "boolean" ? c.snap : d.snap,
    putt: Object.hasOwn(PUTT_HELP, c?.putt) ? c.putt : d.putt,
    tempo: Object.hasOwn(TEMPOS, c?.tempo) ? c.tempo : d.tempo,
    drive: Object.hasOwn(DRIVES, c?.drive) ? c.drive : d.drive,
  };
}

// The help a level gives: { level, faults, mark, snap, putt, tempo: { key,
// weight, band }, over, tooFar, wobble, spread, mishit, drive } - drive:
// the level whose distances it plays (DRIVES). custom: the menu's Custom
// set.
export function levelHelp(level, custom = DEFAULT_CUSTOM) {
  const key = cleanLevel(level);
  let l;
  if (key === "custom") {
    const c = cleanCustom(custom);
    // As harsh on an overswing as the forgiveness says the rest is.
    l = { ...c, ...byFaults(c.faults), snap: c.snap ? LEVELS.beginner.snap : 0, over: clamp(c.faults * 0.85, 0.1, 2) };
  } else l = { ...LEVELS[key], drive: key };
  return { level: key, faults: l.faults, mark: l.mark, snap: l.snap, putt: l.putt, tempo: { key: l.tempo, ...TEMPOS[l.tempo] }, over: l.over, tooFar: l.tooFar, wobble: { ...l.wobble }, spread: l.spread, mishit: l.mishit, drive: l.drive };
}

// A player's own level: theirs (players: { name: level }) or the menu's.
export function playerLevel(name, { level = DEFAULT_LEVEL, players = {} } = {}) {
  const own = players?.[name];
  return cleanLevel(own != null && own !== "" ? own : level);
}

// No easier than the host's floor (a RANKED level, or null for none): a
// level below it plays as the floor, and so does Custom, which isn't ranked.
export function levelAtLeast(level, floor) {
  const key = cleanLevel(level);
  if (!floor || !RANKED.includes(floor)) return key;
  if (key === "custom") return floor;
  return RANKED.indexOf(key) >= RANKED.indexOf(floor) ? key : floor;
}

// "Pro", "Custom".
export const levelName = (level) => LEVELS[cleanLevel(level)].label;
