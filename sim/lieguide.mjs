// What a lie will do to a shot, said before it, and what it did, said
// after. Each lie off the fairway is a range (lie.mjs LIE_RANGES) and every
// shot draws where in it it falls, so the player plays for somewhere in
// the range and finds out afterwards how the lie treated them:
//
//   before  "Rough: expect 80–95% of your normal carry (your 7 iron's ~150
//           → 120–143 yds) · less spin, a bit left"
//   after   "The rough took 13% off: 150 yds at 100% → 131 yds (expected
//           80–95%: about the middle)"
//
// "At 100%" is the same launch monitor numbers flown with no lie at all:
// what that swing would have carried off the fairway. Pure, so the course,
// the range, the Challenges and the tests all share it.

import { applyLie, LIE_RANGES, LIE_NAMES, FLAT, exitFactor } from "./lie.mjs";
import { simulateFlight, YARD } from "./flight.mjs";
import { BAG, clubName } from "./clubs.mjs";

// Carry in yards, flown over flat ground in still air.
function carryOf(shot) {
  const at = simulateFlight(shot).landing.position;
  return Math.hypot(at[0], at[2]) / YARD;
}

// The bag's full swing with a club, as the launch monitor would read it.
export function fullSwing(club) {
  const b = BAG[club] ?? BAG["7I"];
  return { speedMph: b.speed, vla: b.vla, hla: 0, totalSpin: b.spin, spinAxis: 0 };
}

const flat = (stance) => !(stance?.side || stance?.slope);

// The share of its carry a swing keeps from this lie and stance, at the
// mild end of the lie's range and at the severe end: { mild, severe }
// (mild the larger). Null when there's nothing worth saying: a clean lie
// on a slope that hardly changes the carry - under 1.5%, so a fairway
// slope's most (lie.mjs FAIR_CARRY, 2%) is said, steadily.
export function carryRange(shot, { lie = "fairway", stance = FLAT, club = null } = {}) {
  const at100 = carryOf(shot);
  if (!(at100 > 0)) return null;
  const at = (severity) => carryOf(applyLie(shot, { lie, stance, club, severity })) / at100;
  const mild = at(0);
  const severe = at(1);
  if (!LIE_RANGES[lie] && Math.abs(1 - severe) < 0.015 && Math.abs(1 - mild) < 0.015) return null;
  return { mild: Math.max(mild, severe), severe: Math.min(mild, severe) };
}

// How a shot's lie treated it: `shot` as the launch monitor read it,
// `severity` the draw it was played with. { share, at100, carry, range,
// place, luck }: the share of its carry it kept, the carry at 100% (no
// lie) and with the lie (flat ground, yards), the lie's range for this
// very swing, and where in that range it fell - 0 the mild end, 1 the
// severe - with a word for it. Null where the lie has no range to speak of.
export function lieOutcome(shot, { lie = "fairway", stance = FLAT, club = null, severity = 0.5 } = {}) {
  const range = carryRange(shot, { lie, stance, club });
  if (!range) return null;
  const at100 = carryOf(shot);
  const carry = carryOf(applyLie(shot, { lie, stance, club, severity }));
  const share = carry / at100;
  const width = range.mild - range.severe;
  const place = width < 0.005 ? 0.5 : Math.min(1, Math.max(0, (range.mild - share) / width));
  return { share, at100, carry, range, place, luck: luckWord(place) };
}

// Where in the range it fell, in words - how the lie treated the shot, not
// how it was played.
export function luckWord(place) {
  if (place < 0.2) return "the kind end";
  if (place < 0.4) return "the kind side of the middle";
  if (place <= 0.6) return "about the middle";
  if (place <= 0.8) return "the heavy side of the middle";
  return "the bad end - unlucky";
}

// "80–95%": a range of shares, whole percentages.
export function rangeText(range) {
  const lo = Math.round(range.severe * 100);
  const hi = Math.round(range.mild * 100);
  return lo === hi ? `${lo}%` : `${lo}–${hi}%`;
}

// How the ball comes out of each lie, in a few words.
const FEEL = {
  semi: "less spin - it can fly",
  rough: "less spin, a bit left",
  deep: "little spin, pops up and left",
  trees: "less spin",
  bunker: "less spin",
  greenside: "comes out high and soft",
  waste: "sits up on firm sand - a touch less spin",
};

// "Rough", "Rough and the slope", "The slope" - what's doing it.
function whatName(lie, stance) {
  const name = LIE_NAMES[lie] ?? lie;
  if (!LIE_RANGES[lie]) return "The slope";
  return flat(stance) ? name : `${name} and the slope`;
}
const lower = (s) => s[0].toLowerCase() + s.slice(1);

// The line before a shot, or "" if the lie and stance change nothing.
//   club   the club in hand
//   full   how far the player's full swing with it carries (their own, or
//          the bag's), yards; own - whether it's their own
//   swing  the swing they're about to make, as the launch monitor would
//          read it (a full one by default); plan - what it carries off the
//          fairway, yards, when it's less than a full swing
// Out of grass, what the launch does to it (sim/lie.mjs exitFactor): ""
// near the reference launch; a low one, that it pays more and a more
// lofted club gets out cleaner; a high one, that it pays less.
export function exitWords(lie, vla) {
  const m = exitFactor(lie, vla);
  if (m >= 1.15) return "low out of the grass: more lost, and pulled - a more lofted club gets out cleaner";
  if (m <= 0.8) return "high out of the grass: less lost, and on line";
  return "";
}

export function beforeLine(lie, stance = FLAT, { club = "7I", full = null, own = false, swing = null, plan = null } = {}) {
  if (lie === "green" || club === "PT") return "";
  const range = carryRange(swing ?? fullSwing(club), { lie, stance, club });
  if (!range) return "";
  const pct = rangeText(range);
  const yds = (y) => {
    const [lo, hi] = [Math.round(y * range.severe), Math.round(y * range.mild)];
    return lo === hi ? `${lo} yds` : `${lo}–${hi} yds`;
  };
  let scale = "";
  if (plan != null) scale = ` (a ${Math.round(plan)}-yd swing → ${yds(plan)})`;
  else if (full != null) scale = ` (${own ? "your" : "a"} ${clubName(club).toLowerCase()}'s ~${Math.round(full)} → ${yds(full)})`;
  const feel = FEEL[lie] && LIE_RANGES[lie] ? ` · ${FEEL[lie]}` : "";
  const exit = exitWords(lie, (swing ?? fullSwing(club)).vla);
  return `${whatName(lie, stance)}: expect ${pct} of your normal carry${scale}${feel}${exit ? ` · ${exit}` : ""}`;
}

// The line after a shot, from lieOutcome. `carry`: what it actually
// carried where it was played, when that isn't flat ground - "at 100%" is
// then scaled to the same ground. "" when there's nothing to say.
export function afterLine(lie, stance, outcome, { carry = null } = {}) {
  if (!outcome) return "";
  const got = carry ?? outcome.carry;
  const at100 = got / outcome.share;
  const who = LIE_RANGES[lie] ? `The ${lower(whatName(lie, stance))}` : "The slope";
  const change = Math.round((1 - outcome.share) * 100);
  const did = change > 0 ? `took ${change}% off` : change < 0 ? `added ${-change}% - a flyer` : "took nothing off";
  return `${who} ${did}: ${Math.round(at100)} yds at 100% → ${Math.round(got)} yds (expected ${rangeText(outcome.range)}: ${outcome.luck})`;
}

// A player's own full carry with a club from their stats report (the
// server's /api/stats/player), once they've enough good full swings with
// it from a fair lie to go on; null until then.
export const OWN_SHOTS = 5;
export function ownFullCarry(report, club) {
  const c = report?.clubs?.find?.((x) => x.club === club);
  const yards = c?.carryMedian ?? c?.carry;
  return c && c.n >= OWN_SHOTS && Number.isFinite(yards) && yards > 0 ? yards : null;
}
