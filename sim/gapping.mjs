// A gapping session on the range: five good balls with every club in the
// bag, the game picking each club in turn - shortest first, as a warm-up
// builds - so the stats page's gapping chart fills in, and at the end the
// carries side by side with the gaps and overlaps between them. Pure: the
// practice plan runs it in the sim (practiceplan.js), the tests feed it
// shots.
//
// Only a good full swing counts towards a club's five, as only those go
// into its numbers (sim/shotstats.mjs counts): a thin or fat one, a misread,
// a special shot or a mouse swing is said and hit again - up to `most`
// balls a club, so a bad day can't keep it on one club for ever.

import { CLUB_ORDER, CLUB_NAMES, BAG } from "./clubs.mjs";
import { median, bigGap } from "./shotstats.mjs";

// per: good balls a club; most: balls a club at most.
export const GAPPING = Object.freeze({ per: 5, most: 8 });

// A usual bag of thirteen clubs, for a player whose stats have none yet:
// no 4 iron and no 48° wedge.
export const USUAL_BAG = ["DR", "3W", "5W", "4H", "5I", "6I", "7I", "8I", "9I", "PW", "GW", "SW", "LW"];

const name = (c) => CLUB_NAMES[c]?.toLowerCase() ?? c;
const Name = (c) => CLUB_NAMES[c] ?? c;

// The clubs for a session, in the order they're hit (shortest first).
//   choice  "mine": the clubs the player's stats have shots with (the
//           usual bag when there are none); "all": every club in the bag
//   known   those clubs, by code
export function sessionClubs(choice = "mine", known = []) {
  const have = new Set(known);
  const list = choice === "all" ? CLUB_ORDER : have.size ? CLUB_ORDER.filter((c) => have.has(c)) : USUAL_BAG;
  return [...list].reverse();
}

// What keeps a shot out of a club's five, in words, or null when it counts.
//   strike   the stats' judgement: "good", "thin", "fat", "topped", "shank"
//   odd      the reading looked like no real strike (a misread)
//   swing    the swing it was taken as ("full", "partial"...)
//   special  a special shot said for it (punch, part swing...)
//   mouse    a mouse swing
export function whyNot({ strike = "good", odd = false, swing = "full", special = null, mouse = false } = {}) {
  if (mouse) return "a mouse swing isn't your real distance";
  if (odd) return "that looked like a misread";
  if (special) return "a special shot";
  if (swing && swing !== "full") return "that went as a part swing";
  if (strike && strike !== "good") return `${strike} - only good strikes count`;
  return null;
}

export class GappingRun {
  constructor(clubs, { per = GAPPING.per, most = GAPPING.most } = {}) {
    this.clubs = [...clubs];
    this.per = per;
    this.most = most;
    this.at = 0;
    this.tries = 0;
    this.balls = new Map(this.clubs.map((c) => [c, []]));
    this.skipped = [];
  }

  // The club being hit now, or null once every club is done.
  get club() {
    return this.clubs[this.at] ?? null;
  }
  get done() {
    return this.at >= this.clubs.length;
  }
  // Good balls so far with the club being hit.
  get count() {
    return this.balls.get(this.club)?.length ?? 0;
  }

  // A shot on the range: its club, carry and what the stats made of it
  // (whyNot's). Returns { counted, why, club, carry, n, clubDone, next,
  // finished } - next the club to hit now, when this one is done - or null
  // once the session is over.
  add({ club, carry, ...verdict } = {}) {
    if (this.done) return null;
    const want = this.club;
    if (club !== want) return { counted: false, why: `that was the ${name(club)} - the session's on the ${name(want)} (N skips it)`, club: want, wrongClub: true, n: this.count, clubDone: false, next: null, finished: false };
    this.tries++;
    const why = Number.isFinite(carry) ? whyNot(verdict) : "no carry for it";
    if (!why) this.balls.get(want).push(carry);
    const n = this.balls.get(want).length;
    const clubDone = n >= this.per || this.tries >= this.most;
    if (clubDone) this.moveOn();
    return { counted: !why, why, club: want, carry, n, clubDone, next: this.club, finished: this.done };
  }

  // On to the next club without finishing this one (one the player
  // doesn't carry, say). Returns { skipped, next, finished }.
  skip() {
    if (this.done) return null;
    const skipped = this.club;
    this.skipped.push(skipped);
    this.moveOn();
    return { skipped, next: this.club, finished: this.done };
  }

  moveOn() {
    this.at++;
    this.tries = 0;
  }

  // "Gapping: 7 iron, ball 3 of 5 · N skips": the overlay's line.
  note() {
    if (this.done) return "";
    return `Gapping: ${name(this.club)}, ball ${Math.min(this.count + 1, this.per)} of ${this.per} · club ${this.at + 1} of ${this.clubs.length} · N skips`;
  }

  summary(factor = null) {
    return gappingSummary(this.balls, { factor });
  }
}

// The session's carries, longest club first: rows { club, carry (the
// median), low, high, n }, and between each club and the next { from, to,
// diff, flag } - "overlap" when they go about the same distance (under 4
// yds apart, as the coaching notes have it), "gap" when it's well beyond
// the step the bag expects (shotstats.mjs bigGap, scaled by factor: how
// far this player hits against the bag - by default worked out from these
// carries, as the stats work it out from a player's clubs), else null.
export function gappingSummary(balls, { factor = null } = {}) {
  const rows = CLUB_ORDER.filter((c) => balls.get(c)?.length).map((club) => {
    const list = balls.get(club);
    return { club, carry: median(list), low: Math.min(...list), high: Math.max(...list), n: list.length };
  });
  factor ??= rows.length ? Math.min(1.35, Math.max(0.55, median(rows.map((r) => r.carry / BAG[r.club].carry)))) : 1;
  const gaps = [];
  for (let i = 0; i + 1 < rows.length; i++) {
    const [a, b] = [rows[i], rows[i + 1]];
    const diff = a.carry - b.carry;
    gaps.push({ from: a.club, to: b.club, diff, flag: diff < 4 ? "overlap" : bigGap(a.club, b.club, diff, factor) ? "gap" : null });
  }
  return { rows, gaps };
}

// The flagged gaps and overlaps in a few words each, for the end of the
// session: "A big gap: 5 wood to 5 iron, 34 yds".
export function gapWords(gaps) {
  return gaps
    .filter((g) => g.flag)
    .map((g) => (g.flag === "overlap" ? `Overlap: the ${name(g.from)} and ${name(g.to)} go about the same distance (${Math.round(Math.abs(g.diff))} yds apart)` : `A big gap: ${name(g.from)} to ${name(g.to)}, ${Math.round(g.diff)} yds`));
}

export { Name as gappingClubName };
