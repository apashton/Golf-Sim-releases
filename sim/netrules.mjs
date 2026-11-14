// An online round's own rules, set by the host for everyone (the course
// panel's, sent with the round's start: sim/netgame.mjs):
//
//   - Line reads: how many times each player may see a putt's ideal line
//     before striking it, all round ("any": as many as they like, as off
//     line). Spent one at a time (T on the green); once they're gone, the
//     green is the player's to read. The line after a putt still shows.
//   - Made-up swings (the owner: "some kind of handicap to help the real
//     life users. As mouse or keyboard play in theory are a lot easier";
//     and "pitted a launch monitor user against a controller user needs to
//     feel fair"): the mouse's and a controller's swings are made harder
//     than a real swing on a launch monitor: the swing's level no easier
//     than `floor` (sim/swinglevels.mjs: a player's own level if it's that
//     hard or harder, else the floor; Custom plays as the floor). (A test
//     shot, which players no longer have, isn't played online at all.)
//   - Carry adjustments (the owner: "during online play this must be shared
//     if someone has upped their distance and the option for online play to
//     remove that option"): each bay flies its own shots, so a bay's carry
//     adjustment (Menu -> Ball flight, sim/carryadjust.mjs) changes its
//     distances. Every bay's is shown to everyone; or the host has everyone
//     play A-Squared Golf's own carries for the game ("own").
//   - Skill points (sim/skills.mjs): each player's own on their made-up
//     swings, or none - everyone's swing as their level has it ("off").
//
// Pure: course.js and app.js use them, and test/netrules.test.mjs.

import { carryPercentWords } from "./carryadjust.mjs";

// Line reads a player may spend in a round; "any" is no limit.
export const READ_CHOICES = ["any", 0, 1, 2, 3, 5, 9];
export const READ_NAMES = { any: "As many as they like", 0: "None", 1: "1 a round", 2: "2 a round", 3: "3 a round", 5: "5 a round", 9: "9 a round" };
export const DEFAULT_READS = 3;

// A host's choice as sent (a number or "any"), made sound. None at all (a
// host from before these rules): no limit.
export function cleanReads(v) {
  if (v === "any" || v == null) return "any";
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n <= 18 ? n : DEFAULT_READS;
}

// Whether reads are counted at all.
export const readsLimited = (reads) => reads !== "any" && Number.isInteger(reads);

// How much harder made-up swings are: the swing's level no easier than
// `floor` (sim/swinglevels.mjs RANKED). (The keys are the ones bays have
// always sent; "tour" is new, and a bay from before it plays it as
// "fair".)
export const MADE_UP = {
  off: { label: "As each player has them", floor: null },
  fair: { label: "Amateur level or harder", floor: "amateur" },
  tough: { label: "Pro level or harder", floor: "pro" },
  tour: { label: "Tour level", floor: "tour" },
};
export const MADE_UP_ORDER = ["off", "fair", "tough", "tour"];
export const DEFAULT_MADE_UP = "fair";
// (None at all - a host from before these rules: as they were.)
export const cleanMadeUp = (v) => (v == null ? "off" : Object.hasOwn(MADE_UP, v) ? v : DEFAULT_MADE_UP);

// Carry adjustments in an online game: each bay's own, shown to everyone,
// or A-Squared Golf's own carries for everyone. (None at all - a host from
// before this rule: each bay's own.)
export const CARRY_RULES = { bays: "Each bay's own, shown to everyone", own: "Everyone on A² Golf's own carries" };
export const CARRY_RULE_ORDER = ["bays", "own"];
export const DEFAULT_CARRY_RULE = "bays";
export const cleanCarryRule = (v) => (v === "own" ? "own" : "bays");

// Skill points in an online game: each player's own, or none. (None at
// all - a host from before this rule: each player's own.)
export const SKILLS_RULES = { on: "Each player's own skill points", off: "No skill points - each swing as its level has it" };
export const SKILLS_RULE_ORDER = ["on", "off"];
export const DEFAULT_SKILLS_RULE = "on";
export const cleanSkillsRule = (v) => (v === "off" ? "off" : "on");

// The rules of a round as the host sent them ({ reads, madeUp, carry,
// skills }), made sound; none (an offline round): no limits.
export function roundRules(round) {
  if (!round) return { reads: "any", madeUp: "off", carry: "bays", skills: "on" };
  return { reads: cleanReads(round.reads), madeUp: cleanMadeUp(round.madeUp), carry: cleanCarryRule(round.carry), skills: cleanSkillsRule(round.skills) };
}

// The level a made-up swing can't be easier than under the rules (null:
// none).
export const levelFloor = (madeUp) => MADE_UP[madeUp]?.floor ?? null;

// The host's rules for the next game, sent to the lobby before the start
// (sim/netgame.mjs rules) so everyone sees them - the easiest level anyone
// plays at among them: a course round's { reads, madeUp, skills, carry },
// another game's { carry }; made sound, none: null.
export function cleanLobbyRules(r) {
  if (!r || typeof r !== "object") return null;
  const carry = cleanCarryRule(r.carry);
  return r.madeUp === undefined ? { carry } : { reads: cleanReads(r.reads), madeUp: cleanMadeUp(r.madeUp), skills: cleanSkillsRule(r.skills), carry };
}
// ...in a line (rulesWords; another game's, its carry rule).
export const lobbyRulesWords = (r) => (r.madeUp === undefined ? carryRuleWords(r.carry) : rulesWords(r));

// Spending a read: a player's reads { left, at } (at: the putt it was
// spent on) and this putt's key. Returns { reads, spent, words } - spent
// whether the line shows for this putt now.
export function spendRead(reads, key) {
  if (reads.at === key) return { reads, spent: true, words: "Already read - the line's showing" };
  if (!(reads.left > 0)) return { reads, spent: false, words: "No line reads left this round" };
  const left = reads.left - 1;
  return { reads: { left, at: key }, spent: true, words: `Line read - ${left ? `${left} left` : "that was the last"}` };
}

// The line under the putt's figures: "Line reads: 2 left - T to read this putt".
export function readsWords(reads, key) {
  if (reads.at === key) return `Line read (${reads.left} left)`;
  return reads.left > 0 ? `Line reads: ${reads.left} left - T to read this putt` : "No line reads left - the green's yours to read";
}

// Each bay's carry adjustment in a game (sim/netgame.mjs bays), in a line
// for everyone: "Carry adjustments: Sam's bay +3% carry, Ann's bay −2%
// carry" - null when no bay has one, or when the game's host has everyone
// on A² Golf's own carries.
export function bayCarryWords(g) {
  if (!g || (g.started && cleanCarryRule(g.round?.carry) === "own")) return null;
  const list = Object.values(g.bays ?? {})
    .filter((b) => carryPercentWords(b.carry))
    .map((b) => `${b.name} ${carryPercentWords(b.carry)}`);
  return list.length ? `Carry adjustments: ${list.join(", ")}` : null;
}

// The carry rule in a few words: "each bay's carry adjustment shown" /
// "everyone on A² Golf's own carries".
export const carryRuleWords = (carry) => (cleanCarryRule(carry) === "own" ? "everyone on A² Golf's own carries" : "each bay's carry adjustment shown");

// The rules in a line, for the host's panel and everyone at the start:
// "3 line reads each (T on the green); mouse and controller at Amateur
// level or harder; each bay's carry adjustment shown" (the carry part
// only when it's given).
export function rulesWords({ reads, madeUp, carry, skills }) {
  const r = reads === "any" ? "line reads as they like" : reads === 0 ? "no line reads" : `${reads} line read${reads === 1 ? "" : "s"} each (T on the green)`;
  const m = madeUp === "off" ? "mouse and controller as they are" : `mouse and controller at ${MADE_UP[madeUp].label.toLowerCase()}`;
  // (Skill points said only when they're off.)
  const sk = skills === "off" ? "; no skill points" : "";
  return carry === undefined ? `${r}; ${m}${sk}` : `${r}; ${m}${sk}; ${carryRuleWords(carry)}`;
}
