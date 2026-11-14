// My stats' "Wrong club?" review (the owner, 10 November 2026: "I find too
// often I forget to change the club selection, so I have tons of shots,
// many very obvious in the wrong club's stats. Maybe need to find a better
// way to update, clean out, or mark as misattributed shots"): the shots
// in a player's history that flew like another club than the one they
// were recorded with - found again over the whole history with what the
// player's clubs do now, not as they looked when each shot was hit - and
// grouped into runs: the shots of one sitting, one club selected, all
// flying like the same other club (a session with the 7 iron left
// selected), each run moved, kept or taken out in one go.
//
//   - Which shots: full swings from a fair lie, with the ball's numbers,
//     the player hasn't answered about (a yes to the club, or another club
//     picked), including those waiting for an answer and those settled by
//     being left unanswered (a "quiet" distance that fits another club no
//     longer counts as the club's normal: shotstats.mjs quietFits).
//   - Twice over: suspects found against the player's clubs, then again
//     against their clubs without the suspects in them, so a club whose
//     numbers had a session of another club's shots in it is judged by its
//     own.
//   - A run: one after another in time (within RUN_GAP of each other),
//     the same club selected, flying like the same club or the one next to
//     it in the bag, with no shot of the selected club between them that
//     flew like itself. Two or more; the rest are single shots.
//   - Moved by itself: shots the game put right as they were recorded
//     (OBVIOUS), the latest first, to put back if one wasn't.
// Pure: server/stats.mjs gives it the player's history; the stats page
// draws it (public/stats.js) and answers it (/api/stats/answers, marks).

import { profiles, clubCheck, goodLie, removed, median, CLUB_ORDER } from "./shotstats.mjs";

// Shots further apart than this aren't one sitting.
export const RUN_GAP = 2 * 3600 * 1000;
// How many single shots and moved shots are listed (the rest counted).
export const LIST_MOST = 40;

// A shot the player has answered about: a yes, or a club they picked.
const answered = (s) => s.ans === "yes" || (s.ans === "changed" && !s.auto);
const candidate = (s) =>
  s.sw === "full" && goodLie(s.lie) && !s.un && s.m !== "calibration" && s.rec !== "x" && !removed(s) && s.r && Number.isFinite(s.r.carry) && s.b && Number.isFinite(s.b.v) && s.b.sp > 0 && !answered(s);
const numbers = (s) => ({ club: s.c, sw: "full", carry: s.r.carry, vla: s.b.v, spin: s.b.sp, speed: s.b.s });

// The candidates that flew like another club, against a profile:
// [{ shot, looksLike, sure }].
function suspects(list, prof) {
  const out = [];
  for (const s of list) {
    // (An auto-moved shot is judged as the club it was moved to: kept as
    // that, it's listed with the moved ones.)
    const q = clubCheck(numbers(s), { ...prof, accepted: new Map() });
    if (q && !s.auto) out.push({ shot: s, looksLike: q.looksLike, sure: !!q.sure });
  }
  return out;
}

const near = (a, b) => Math.abs(CLUB_ORDER.indexOf(a) - CLUB_ORDER.indexOf(b)) <= 1;
const mostOf = (list) => {
  const n = new Map();
  for (const x of list) n.set(x, (n.get(x) ?? 0) + 1);
  return [...n].sort((a, b) => b[1] - a[1] || CLUB_ORDER.indexOf(a[0]) - CLUB_ORDER.indexOf(b[0]))[0][0];
};
const row = (s, looksLike, sure) => ({ id: s.id, t: s.t, club: s.c, looksLike, sure, carry: Math.round(s.r.carry), vla: s.b?.v ?? null, spin: s.b?.sp ?? null, speed: s.b?.s ?? null });

// The review: { runs: [{ club, looksLike, n, sure, carry, from, to, shots }],
// singles: [row], moreSingles, moved: [row with sel], moreMoved, mixed:
// [clubs whose own numbers are out of the bag's order] }.
export function wrongClubReview(shots) {
  const list = (shots ?? []).filter(candidate);
  let prof = profiles(shots ?? []);
  let found = suspects(list, prof);
  if (found.length) {
    const out = new Set(found.map((f) => f.shot.id));
    prof = profiles((shots ?? []).filter((s) => !out.has(s.id)));
    found = suspects(list, prof);
  }
  const mixed = CLUB_ORDER.filter((c) => prof.clubs[c]?.mixed);
  const sus = new Map(found.map((f) => [f.shot.id, f]));
  // Runs: each club's candidates in time order.
  const byClub = new Map();
  for (const s of [...list].sort((a, b) => a.t - b.t)) {
    if (!byClub.has(s.c)) byClub.set(s.c, []);
    byClub.get(s.c).push(s);
  }
  const groups = [];
  for (const shotsOf of byClub.values()) {
    let run = null;
    for (const s of shotsOf) {
      const f = sus.get(s.id);
      if (!f) {
        // A shot of the club that flew like itself ends a run.
        run = null;
        continue;
      }
      const last = run?.at(-1);
      if (last && s.t - last.shot.t <= RUN_GAP && near(f.looksLike, mostOf(run.map((x) => x.looksLike)))) run.push(f);
      else groups.push((run = [f]));
    }
  }
  const runs = [];
  const singles = [];
  for (const g of groups) {
    const looksLike = mostOf(g.map((x) => x.looksLike));
    if (g.length >= 2) {
      runs.push({
        club: g[0].shot.c,
        looksLike,
        n: g.length,
        sure: g.filter((x) => x.sure).length,
        carry: Math.round(median(g.map((x) => x.shot.r.carry))),
        from: g[0].shot.t,
        to: g.at(-1).shot.t,
        shots: g.map((x) => row(x.shot, x.looksLike, x.sure)),
      });
    } else singles.push(row(g[0].shot, g[0].looksLike, g[0].sure));
  }
  runs.sort((a, b) => b.n - a.n || b.to - a.to);
  singles.sort((a, b) => b.t - a.t);
  const moved = (shots ?? [])
    .filter((s) => s.auto && !removed(s) && s.r)
    .sort((a, b) => b.t - a.t)
    .map((s) => ({ ...row(s, s.c, true), sel: s.sel ?? null }));
  return {
    runs,
    singles: singles.slice(0, LIST_MOST),
    moreSingles: Math.max(0, singles.length - LIST_MOST),
    moved: moved.slice(0, LIST_MOST),
    moreMoved: Math.max(0, moved.length - LIST_MOST),
    mixed,
  };
}

// A run in words: "14 shots, Tue 4 Nov, 7 iron selected - they flew like
// your driver (236 yds carry, the middle of them)".
export function runWords(run, clubName = (c) => c, when = (t) => new Date(t).toDateString()) {
  return `${run.n} shots, ${when(run.from)}, ${clubName(run.club).toLowerCase()} selected - they flew like your ${clubName(run.looksLike).toLowerCase()} (${run.carry} yds carry, the middle of them)`;
}
