// The swing pad's two lines for a shot on the course (the owner, 29
// October 2026: "guidance for distance needs to be easy on beginner, flag
// distance, advised distance. The advised distance would compensate for
// rough, etc. So it would be one line for the flag if it was on a flat,
// one line for the adjusted distance you need to do it because of wind,
// etc."): the flag's distance, and what it plays like here - longer into
// the wind and in cold air, shorter with it and in warm (weather.mjs
// playsLike, the caddie's rule), longer uphill and shorter downhill about
// a yard for a yard (the course's riseToPin, as its club suggestion has
// it) - and the carry each wants: short of the flag to let it run (as the
// test shot plans it, courseplay.mjs plannedCarry - though not held to
// the bag's numbers: the pad holds its marks to the player's own full
// swing) and, for the shot as it plays, out of the rough as much more as
// the lie takes off (lie.mjs middleCarryFor). sim/madeshot.mjs planMark
// turns the carries into the pad's marks. Pure.

import { playsLike } from "./weather.mjs";
import { middleCarryFor, LIE_NAMES } from "./lie.mjs";
import { BAG } from "./clubs.mjs";

// The carry that ends at a flag `yards` away: most of the way, letting it
// run; near the green, less.
export const carryToFlag = (yards) => Math.max(8, yards * (yards < 60 ? 0.7 : 0.95));

// What a few yards' difference is put down to, by the least it takes.
const WIND_SAYS = 2;
const RISE_SAYS = 2;
const AIR_SAYS = 2;
const LIE_SAYS = 0.03;

// The shot's two distances: { flagYards, playsYards, playYards, flat,
// carry, why } - playsYards what the flag plays like (the wind, the air,
// the slope), playYards what to play it as from this lie (more out of the
// rough: the pad's line's yards); flat the carry for the flag on the flat
// in still air, carry for the shot as it plays; why what makes them
// differ, in a word or two each ("into the wind", "wind behind",
// "uphill", "downhill", "cold", "warm", and the lie's name: "rough",
// "fairway bunker"...), the biggest first.
//   flagYards    to the pin; riseYards: how much higher it is (yards, -
//                below)
//   lie, club    the ball's and the club in hand (its launch: how much a
//                grass lie takes)
//   wind, bearing, temperatureC   the round's weather and the way the
//                shot goes (weather.mjs)
export function shotGuide({ flagYards, riseYards = 0, lie = "fairway", club = "7I", wind = null, bearing = 0, temperatureC = 20 } = {}) {
  if (!(flagYards > 0)) return null;
  const rise = Number(riseYards) || 0;
  const level = flagYards + rise;
  const windy = playsLike(level, wind, bearing, 20);
  const plays = playsLike(level, wind, bearing, Number.isFinite(temperatureC) ? temperatureC : 20);
  const vla = (BAG[club] ?? BAG["7I"]).vla;
  const keep = middleCarryFor(lie, vla) || 1;
  const why = [];
  if (Math.abs(windy - level) >= WIND_SAYS) why.push({ word: windy > level ? "into the wind" : "wind behind", yards: Math.abs(windy - level) });
  if (Math.abs(rise) >= RISE_SAYS) why.push({ word: rise > 0 ? "uphill" : "downhill", yards: Math.abs(rise) });
  if (Math.abs(plays - windy) >= AIR_SAYS) why.push({ word: plays > windy ? "cold" : "warm", yards: Math.abs(plays - windy) });
  if (1 - keep >= LIE_SAYS) why.push({ word: (LIE_NAMES[lie] ?? "the lie").toLowerCase(), yards: plays * (1 / keep - 1) });
  why.sort((a, b) => b.yards - a.yards);
  return { flagYards, playsYards: plays, playYards: plays / keep, flat: carryToFlag(flagYards), carry: carryToFlag(plays) / keep, why: why.map((w) => w.word) };
}
