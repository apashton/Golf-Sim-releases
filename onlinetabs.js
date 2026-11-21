// The Online tab's sections (the owner, 1 November 2026: "course play is
// one thing and then online is another tab up at the top, and online can
// then go into courses, it can go into seasons, it can go into ladders"):
// the Online play panel (netplay.js OnlinePanel) opened from the top bar's
// Online, with
//   play     Play now: host a game or join one, the lobby (as it was)
//   ladders  the online match ladders - live, or by post - shown, made
//            and joined (course/matchladder.js renderLadderInto, "online")
//   seasons  an online season played together: made by the bay that runs
//            it, its events played from the lobby, its standings for all
//            (netseasons.js, sim/netseason.mjs)
//   rules    the host's rules for everyone in an online game - line reads,
//            mouse and controller, skill points, carry adjustments (moved
//            here from the course panel: they're only for online)
// Here: the section strip and the Host rules' boxes.

import { esc } from "./util.js";
import { READ_CHOICES, READ_NAMES, DEFAULT_READS, MADE_UP, MADE_UP_ORDER, DEFAULT_MADE_UP, CARRY_RULES, CARRY_RULE_ORDER, DEFAULT_CARRY_RULE, SKILLS_RULES, SKILLS_RULE_ORDER, DEFAULT_SKILLS_RULE } from "./sim/netrules.mjs";

export const ONLINE_TABS = [
  ["play", "Play now"],
  ["ladders", "Ladders"],
  ["seasons", "Seasons"],
  ["rules", "Host rules"],
];
export const onlineTab = (t) => (ONLINE_TABS.some(([id]) => id === t) ? t : "play");

// The strip: each section a button, the one shown pressed; badges: a
// count by a section's name (what's waiting on the ladders).
export function tabsHtml(tab, badges = {}) {
  return `<div class="online-tabs" role="tablist">${ONLINE_TABS.map(([id, name]) => {
    const n = badges[id];
    return `<button role="tab" data-act="tab" data-tab="${id}" aria-selected="${id === tab}" class="${id === tab ? "on" : ""}">${esc(name)}${n ? ` <span class="online-badge">${n}</span>` : ""}</button>`;
  }).join("")}</div>`;
}

// The host's rules, as the course's settings have them (s), each a box
// whose change is setRule(key, value) - for the next game this bay hosts;
// the others see them in the lobby before the start.
export const RULES = [
  { key: "reads", label: "Line reads", help: "How many times in the round each player may see a putt's ideal line before striking it (T on the green spends one). Once they're gone the green is theirs to read; the line after a putt still shows", choices: READ_CHOICES.map((v) => [String(v), READ_NAMES[v]]), value: (s) => String(s.reads ?? DEFAULT_READS) },
  { key: "madeUp", label: "Mouse and controller", help: "To keep it fair on players swinging for real on a launch monitor: the mouse's, a finger's and a controller's swings never at an easier level than this (a player's own if it's harder)", choices: MADE_UP_ORDER.map((v) => [v, MADE_UP[v].label]), value: (s) => s.madeUp ?? DEFAULT_MADE_UP },
  { key: "skills", label: "Skill points", help: "Each player's own skill points on their swing pad and controller swings (Menu, Swing pad & controller, Skill points), or none - every made-up swing as its level has it", choices: SKILLS_RULE_ORDER.map((v) => [v, SKILLS_RULES[v]]), value: (s) => s.skills ?? DEFAULT_SKILLS_RULE },
  { key: "carry", label: "Carry adjustments", help: "Each bay's carry adjustment (Menu, Ball flight) as it has it, shown to everyone - or everyone on A² Golf's own carries, the adjustments set aside till the game ends", choices: CARRY_RULE_ORDER.map((v) => [v, CARRY_RULES[v]]), value: (s) => s.carry ?? DEFAULT_CARRY_RULE },
];

// Each a row: its name and what it does, its box at the right.
export function rulesHtml(s = {}) {
  const boxes = RULES.map((r) => {
    const v = r.value(s);
    return `<label class="online-rule" title="${esc(r.help)}"><span class="online-rule-text"><b>${esc(r.label)}</b><small>${esc(r.help)}.</small></span><select data-rule="${r.key}">${r.choices.map(([c, name]) => `<option value="${esc(c)}" ${c === v ? "selected" : ""}>${esc(name)}</option>`).join("")}</select></label>`;
  }).join("");
  return `<p class="online-intro">The rules for everyone in a game this bay hosts - the others see them in the lobby before the start.</p><div class="online-card online-rules">${boxes}</div>`;
}
