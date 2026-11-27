// The course's season and upkeep (sim/daylight.mjs): each round its own -
// spring, summer or autumn, or with the Seasons switch on (sim/effects.mjs
// seasons) today's season on most rounds and the one either side on the
// rest - and kept lush to dry (roundSeason; set at a round's start,
// setCourseSeason). Before a round, today's season with the switch on, as
// the page was built; summer with it off. Read as each
// hole is built (its grass, tufts and trees), so a round's own reaches all
// of it. The practice greens, the range and the Challenges keep the course
// as it always looks (summer, as kept).

import * as THREE from "three";
import { loadSetting } from "../util.js";
import { effectsInUse } from "../sim/effects.mjs";
import { seasonOf, SEASONS, seasonShift, UPKEEP } from "../sim/daylight.mjs";
import { LEVEL } from "./quality.js";

const BY_DATE = effectsInUse(loadSetting("effects", {}), LEVEL).seasons ? seasonOf(new Date()) : null;
// Today's season with the switch on (roundSeason leans on it), else null.
export const SEASON_TODAY = BY_DATE;
const seasonFor = (name) => (name === "summer" ? null : { name, ...SEASONS[name] });
// null in summer - the course as it always looks.
export let SEASON = seasonFor(BY_DATE ?? "summer");
// How it's kept (-1 lush - 1 dry; 0 as it always looks).
export let UPKEEP_NOW = 0;

// A round's season and upkeep (sim/daylight.mjs roundSeason).
export function setCourseSeason({ season = "summer", upkeep = 0 } = {}) {
  SEASON = seasonFor(season);
  UPKEEP_NOW = Math.min(1, Math.max(-1, Number.isFinite(upkeep) ? upkeep : 0));
}

// How much of the upkeep each part of the course takes, by its layer (look/
// grass.js LAYER): the greens, tees and fringes watered, the fairways
// more, the rough and long grass all of it (UPKEEP.share).
export function upkeepShare(layer) {
  if (!Number.isFinite(layer)) return UPKEEP.share.rough;
  if (layer >= 2) return UPKEEP.share.green;
  if (layer >= 0.75) return UPKEEP.share.fairway;
  return UPKEEP.share.rough;
}

// A colour moved for the season and the upkeep, in place (and returned): by
// its grass shift, or `part` ("leaves"); the upkeep times `share` (grass
// only). Only greens change.
const hsl = { h: 0, s: 0, l: 0 };
export function seasonal(color, part = "grass", share = 1) {
  const keep = part === "grass" ? UPKEEP_NOW * share : 0;
  if (!SEASON && !keep) return color;
  color.getHSL(hsl);
  // (Only greens: sand, soil and stone stay as they are.)
  if (hsl.h < 0.14 || hsl.h > 0.5) return color;
  let hsla = [hsl.h, hsl.s, hsl.l];
  if (SEASON) hsla = seasonShift(hsla, SEASON[part]);
  if (keep) hsla = seasonShift(hsla, (keep > 0 ? UPKEEP.dry : UPKEEP.lush).map((v) => v * Math.abs(keep)));
  return color.setHSL(hsla[0], hsla[1], hsla[2]);
}

// (For callers with a colour string or number.)
export const seasonalColor = (c, part, share) => seasonal(new THREE.Color(c), part, share);
