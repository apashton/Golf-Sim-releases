// The levels side by side, so it's plain which a player is on and what it
// means (the owner, 30 October 2026: "Make it more clear what setting the
// user is using, the fact that beginner and amateur are more friendly with
// mistakes and pro and tour as less, but you get less distance with
// beginner and amateur, and more with pro and tour. I think at the moment
// when starting a game that should be an option online and private to
// move that option if the user wants to"): how forgiving each is, out of
// four, and how far it hits - the two going opposite ways - in words for
// the levels card (levelcard.js), the swing pad's level, the card before a
// round and the online lobby. The levels themselves are swinglevels.mjs's.
// Pure.

import { LEVELS, RANKED, DRIVES, DEFAULT_CUSTOM, cleanLevel, cleanCustom, levelName, driveTotal } from "./swinglevels.mjs";

// The trade, said once.
export const TRADE = "Beginner and Amateur forgive mistakes but hit shorter; Pro and Tour punish mistakes but hit further.";

// How forgiving, out of four, and its words.
export const FORGIVE = { beginner: 4, amateur: 3, pro: 2, tour: 1 };
export const FORGIVE_WORDS = { 4: "Very forgiving", 3: "Forgiving", 2: "Mistakes cost", 1: "Mistakes cost the most" };

// A level's facts: { id, name, forgive (1 - 4), forgiveWords, reach (1 - 4:
// how far it hits against the others), drive: { from, most } (yards: no
// Power points to Power maxed), line ("Very forgiving · drives 180-220
// yds") }. Custom: as forgiving as the ranked level its slider's nearest,
// as far as the level whose distances it plays (custom: the menu's set).
export function levelFacts(level, custom = DEFAULT_CUSTOM) {
  const id = cleanLevel(level);
  let like = id;
  let drive = id;
  if (id === "custom") {
    const c = cleanCustom(custom);
    like = RANKED.reduce((best, k) => (Math.abs(LEVELS[k].faults - c.faults) < Math.abs(LEVELS[best].faults - c.faults) ? k : best), RANKED[0]);
    drive = c.drive;
  }
  const forgive = FORGIVE[like];
  const from = Math.round(driveTotal(drive, 0));
  const most = DRIVES[drive];
  return { id, name: levelName(id), forgive, forgiveWords: FORGIVE_WORDS[forgive], reach: RANKED.indexOf(drive) + 1, drive: { from, most }, line: `${FORGIVE_WORDS[forgive]} · drives ${from}-${most} yds` };
}

// The level a player plays at, where a host's rule can lift it: { id (what
// they play at), own (theirs), raised (the rule lifted it), name, words }.
// floor: a RANKED level or null.
export function levelTag(own, floor = null) {
  const mine = cleanLevel(own);
  let id = mine;
  if (floor && RANKED.includes(floor) && (mine === "custom" || RANKED.indexOf(mine) < RANKED.indexOf(floor))) id = floor;
  const raised = id !== mine;
  return { id, own: mine, raised, name: levelName(id), words: raised ? `${levelName(id)} (the host's rule - ${levelName(mine)} otherwise)` : levelName(id) };
}

// The card before a round: who plays at which level - one player, the
// level and what it means ("Your level: Beginner - very forgiving, drives
// 180-220 yds"); more, each's ("Levels: Anna Beginner · Ben Pro"). players:
// [{ name, level }] (only those swinging with the mouse, a finger or a
// controller); "" for none.
export function levelsLine(players = [], custom = DEFAULT_CUSTOM) {
  const list = (Array.isArray(players) ? players : []).filter((p) => p && p.name);
  if (!list.length) return "";
  if (list.length === 1) {
    const f = levelFacts(list[0].level, custom);
    return `Your level: ${f.name} - ${f.line.charAt(0).toLowerCase()}${f.line.slice(1).replace(" · ", ", ")}`;
  }
  return `Levels: ${list.map((p) => `${p.name} ${levelName(p.level)}`).join(" · ")}`;
}
