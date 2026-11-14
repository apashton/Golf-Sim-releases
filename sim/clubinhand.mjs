// The club in hand: one for the whole program.
//
// The owner picked the driver in one mode, opened calibration and was shown
// a 9 iron - the range had kept a club of its own, as had chipping, the
// course and the Challenges. Now there is one club in hand, stored once
// (the "app" setting's club), and every way of changing club changes it.
// Each mode takes it up when it can use it; when it can't (a driver on the
// chipping green, off the fairway) it says so and plays its nearest club
// for now, leaving the club in hand as it was, so going back to the range
// still finds the driver. Changing club in that mode is picking a club, so
// that does become the club in hand.
//
// What a mode can use is clubForMode's (sim/voice.mjs), the same rules a
// spoken club goes by.

import { CLUB_ORDER } from "./clubs.mjs";
import { clubForMode } from "./voice.mjs";

// Whether a club can be the club in hand: one of the bag's, not the putter
// (the putter comes with the putting green and a course's green, and
// leaves the club in hand alone for when the player walks off it).
export function holdable(club, order = CLUB_ORDER) {
  return typeof club === "string" && club !== "PT" && order.includes(club);
}

// The club in the list nearest the one asked for, by place in the bag; a
// tie goes to the longer club (a driver on the chipping green is the 7 iron,
// the least lofted chipping club). Null for an empty list.
export function nearestClub(club, allowed, order = CLUB_ORDER) {
  if (!allowed?.length) return null;
  if (allowed.includes(club)) return club;
  const at = order.indexOf(club);
  if (at < 0) return allowed[0];
  let best = null;
  let gap = Infinity;
  for (const c of order) {
    if (!allowed.includes(c)) continue;
    const d = Math.abs(order.indexOf(c) - at);
    if (d < gap) [best, gap] = [c, d];
  }
  return best ?? allowed[0];
}

// What the mode on show plays with, given the club in hand (held):
//   { club, why }
// club: the club the mode should have now - null when there's nothing to
// set (the course before a round, the Challenges at the cards). why: said
// briefly when it isn't the club in hand ("Chipping clubs: 7 iron to lob
// wedge - using the 7 iron"), empty otherwise (the putter on a green needs
// no saying).
// chipClubs: the chipping green's clubs. course: { round, onGreen, lie,
// current } - current is the club the course has for this shot (its
// suggestion), kept in preference to the nearest when the club in hand
// won't do (off the fairway, a 7 iron beats a 3 wood for a driver).
// challenge: { game, clubs, onGreen, current }, the same for the game in
// play. name: a club's name on screen.
export function clubInHand(mode, held, { chipClubs = [], course = {}, challenge = {}, name = (c) => c, order = CLUB_ORDER } = {}) {
  const none = { club: null, why: "" };
  const lower = (c) => String(name(c)).toLowerCase();
  const instead = (why, club) => ({ club, why: club ? `${why} - using the ${lower(club)}` : why });
  if (mode === "putting") return { club: "PT", why: "" };
  if (mode === "range") return holdable(held, order) ? { club: held, why: "" } : { club: order[0], why: "" };
  if (mode === "chipping") {
    if (chipClubs.includes(held)) return { club: held, why: "" };
    const ok = clubForMode("chipping", held, { chipClubs, name });
    return instead(ok.why, nearestClub(held, chipClubs, order));
  }
  if (mode === "course") {
    if (!course.round) return none;
    if (course.onGreen) return { club: "PT", why: "" };
    const ok = clubForMode("course", held, { course, name });
    if (ok.club) return { club: held, why: "" };
    const allowed = order.filter((c) => clubForMode("course", c, { course, name }).club);
    const fallback = allowed.includes(course.current) ? course.current : nearestClub(held, allowed, order);
    return instead(ok.why, fallback);
  }
  if (mode === "challenges") {
    const { game, clubs = [], onGreen = false, current = null } = challenge;
    if (!game) return none;
    if (onGreen) return { club: "PT", why: "" };
    if (clubs.includes(held)) return { club: held, why: "" };
    const ok = clubForMode("challenges", held, { challenge, name });
    const fallback = clubs.includes(current) ? current : nearestClub(held, clubs, order);
    return instead(ok.why, fallback);
  }
  return none;
}
