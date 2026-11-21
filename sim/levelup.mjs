// Up a level by itself (the owner, 29 October 2026: "somebody should be
// able to get pars and birdies fairly easy ... and then eventually once
// they're getting two good scores, then we can rank, we can put them up
// into a new level and increase the difficulty a little bit"): a round on
// the course played with made-up swings (the swing pad, a controller) at a
// player's own level is a good one when it's finished, at least MIN_HOLES
// holes and no more over par a hole than the level's GOOD; GOOD_ROUNDS of
// them at the level and the player goes up one - Beginner to Amateur to
// Pro to Tour (Tour's the top, Custom isn't ranked). The count's kept for
// each player ({ name: { level, good } }, the mouseSwing setting's climb)
// and starts again at each level: a level changed by hand - back down
// again, say - starts afresh. Pure.

import { RANKED, cleanLevel, levelName } from "./swinglevels.mjs";

// Over par a hole, at most, for a good round at each level (+6 over 18
// holes at Beginner, +2.7 - say +2 - at Amateur, level par or better at Pro).
export const GOOD = Object.freeze({ beginner: 0.35, amateur: 0.15, pro: 0 });
export const GOOD_ROUNDS = 2;
export const MIN_HOLES = 9;

// The level above (null at the top, and for Custom).
export function nextLevel(level) {
  const i = RANKED.indexOf(cleanLevel(level));
  return i >= 0 && i < RANKED.length - 1 ? RANKED[i + 1] : null;
}

// Whether a round counts as a good one at `level`: { scores, pars,
// complete } as the course keeps a round (null scores: holes not played).
export function goodRound(level, { scores = [], pars = [], complete = false } = {}) {
  const limit = GOOD[cleanLevel(level)];
  if (limit == null || !complete) return false;
  let holes = 0;
  let over = 0;
  for (let i = 0; i < scores.length; i++) {
    if (!Number.isFinite(scores[i]) || !Number.isFinite(pars[i])) continue;
    holes++;
    over += scores[i] - pars[i];
  }
  return holes >= MIN_HOLES && over <= limit * holes + 1e-9;
}

export const cleanClimb = (c) => (c && typeof c === "object" && !Array.isArray(c) ? c : {});

// After a round: { climb, up, good, count } - the count kept (climb, a new
// object), the level to move up to (or null), whether this one was good
// and how many good ones there are now at the level (0 again after going
// up). level: the player's own level, as they played the round.
export function countRound(climb, { name, level, round }) {
  const all = { ...cleanClimb(climb) };
  const key = cleanLevel(level);
  const was = all[name]?.level === key ? (all[name].good ?? 0) : 0;
  const good = goodRound(key, round);
  const count = was + (good ? 1 : 0);
  const next = nextLevel(key);
  if (good && next && count >= GOOD_ROUNDS) {
    all[name] = { level: next, good: 0 };
    return { climb: all, up: next, good, count: 0 };
  }
  all[name] = { level: key, good: count };
  return { climb: all, up: null, good, count };
}

// What's said: "Two good rounds at Beginner - Anna moves up to Amateur: a
// little harder from here (back down any time: Menu, Swing pad &
// controller, Level)", or a good round on the way: "A good round at
// Beginner - one more and Anna moves up to Amateur".
export function climbWords(name, from, { up, good, count }) {
  if (up) return `${GOOD_ROUNDS === 2 ? "Two" : GOOD_ROUNDS} good rounds at ${levelName(from)} - ${name} moves up to ${levelName(up)}: a little harder from here (back down any time: Menu, Swing pad & controller, Level)`;
  if (!good) return "";
  const next = nextLevel(from);
  if (!next) return "";
  const left = GOOD_ROUNDS - count;
  return `A good round at ${levelName(from)} - ${left === 1 ? "one more" : `${left} more`} and ${name} moves up to ${levelName(next)}`;
}

// How far a player is towards the next level: { level, next, good, need } -
// the good rounds at their level so far (none after a change of level),
// need: GOOD_ROUNDS; next null at the top and for Custom.
export function climbOf(climb, name, level) {
  const key = cleanLevel(level);
  const c = cleanClimb(climb)[name];
  return { level: key, next: nextLevel(key), good: c?.level === key ? (c.good ?? 0) : 0, need: GOOD_ROUNDS };
}

// It in words, for Your level, the menu's Level and Saved players: "1 of 2
// good rounds towards Amateur", "Tour is the top level", "Moving up to
// Amateur by itself is off" (on: the setting); nothing for Custom. short:
// "1 of 2 to Amateur".
export function progressWords({ level, next, good, need }, { on = true, short = false } = {}) {
  if (level === "custom") return "";
  if (!next) return short ? "the top level" : `${levelName(level)} is the top level`;
  if (!on) return short ? "stays put" : `Moving up to ${levelName(next)} by itself is off`;
  return short ? `${good} of ${need} to ${levelName(next)}` : `${good} of ${need} good rounds towards ${levelName(next)}`;
}
