// Many courses made, the best kept (docs/COURSE-DESIGN-PLAN.md, phase 6;
// the owner, 15 October 2026: "Do the many courses thing, keep the best").
//
// A new course's quick parts of the review (variety, the card, routing,
// fairness) already come out right from the course maker every time, so
// what tells one course from another is how its holes play: Shot options
// and Challenge (sim/coursereview.mjs holePlay - a second or so a hole).
// So the search plays every hole in the head, then for each hole the
// review marks down - no better side to drive to, nothing round a par 3's
// green anyone finds, a hazard nobody finds, too hard for its par, the
// bogey golfer always wet - tries `tries` other designs of it (the same
// par, length and choices, as the hole editor's New layout makes them),
// and keeps whichever makes the course score best. Every one tried is a
// course of its own (the others' holes as they are), so an 18-hole course
// with seven holes to look at and three tries each is the best of 22.
//
// The score it keeps the best by (searchScore) is the review's, weighted as
// the rankings weigh it, with the weakest holes counted again - a soft
// minimum, not a mean (Doak: "skip even one hole and you'd miss
// something"): a course with one poor hole loses to one with a few small
// things spread out.
//
// Every hole's play depends on that hole alone, so the course's holes and
// every design tried can all be played at once, on as many of the
// computer's cores as it has (searchrunner.js, with the review's own
// worker, reviewworker.js, several of it); only choosing between them -
// reviews, quick - goes in order. In two steps, so the page can do the
// playing round them: remakes (the designs to try, once the course's holes
// are played), then best (the best course of all of them). searchAll does
// the lot here, in order, for tests and tools. Only a designed course on
// flat ground (its holes can be made again where they are); on hills the
// course maker searches the flat course, then lays it on the hills, routed
// over them afresh (sim/searchkept.mjs forHills - and asSearched, a course
// made again from a search's record without searching). Pure.

import { rebuildHole, seeded } from "./course.mjs";
import { reviewCourse, holePlay, strokeIndexesFromPlay } from "./coursereview.mjs";
import { canMoveHoles, isHills } from "./coursewide.mjs";

export const SEARCH = {
  // At most this many holes made again (the most marked first).
  holes: 9,
  // A hole's own score: 10, less this for each mark against it (a note
  // worth a look 1, one to fix 2).
  perMark: 2.5,
  // The soft minimum: the weakest holes, the very weakest counting most
  // (half, then 0.3 and 0.2 - so one poor hole costs more than the same
  // marks spread over three)...
  weakest: [0.5, 0.3, 0.2],
  // ...this share of the search's score, the review's the rest.
  floor: 0.3,
};

// How hard to look (the course maker's Best holes choice): other designs
// tried for each hole the review marks down.
export const SEARCH_CHOICES = {
  best: { name: "Find the best - three more designs of each weak hole", tries: 3 },
  quick: { name: "Quicker - one more design of each weak hole", tries: 1 },
  off: { name: "Off - just make it", tries: 0 },
};

const r2 = (v) => Math.round(v * 100) / 100;

// Which courses it can search: designed, on flat ground.
export const canSearch = (course) => (course?.holes?.length ?? 0) > 0 && canMoveHoles(course) && !isHills(course);

// The marks against each hole in a review (n holes): a note worth a look
// 1, one to fix 2, on every hole it names.
export function holeMarks(review, n) {
  const marks = Array.from({ length: n }, () => 0);
  for (const note of review?.notes ?? []) {
    const w = note.level === "fix" ? 2 : note.level === "look" ? 1 : 0;
    if (w) for (const i of note.holes) if (i >= 0 && i < n) marks[i] += w;
  }
  return marks;
}

// The search's score for a course's review (n holes): the review's score
// with the weakest holes counted again (SEARCH.floor of it).
export function searchScore(review, n) {
  const holes = holeMarks(review, n).map((m) => Math.max(0, 10 - SEARCH.perMark * m));
  const worst = holes.sort((a, b) => a - b).slice(0, SEARCH.weakest.length);
  const w = SEARCH.weakest.slice(0, worst.length);
  const floor = worst.length ? worst.reduce((a, v, i) => a + v * w[i], 0) / w.reduce((a, b) => a + b, 0) : 10;
  return r2((1 - SEARCH.floor) * (review?.score ?? 0) + SEARCH.floor * floor);
}

// The seed of the k-th other design tried for hole i, from the search's
// seed: the same every time.
export function remakeSeed(seed, i, k) {
  return Math.floor(seeded(((seed >>> 0) ^ 0x5ea7c4) + (i + 1) * 7919 + (k + 1) * 104729)() * 2 ** 31);
}

// What the playing says, for the page: "Playing the holes in the head: 7
// of 18" (the course's own), then "Playing other designs of the holes
// marked down: 5 of 21".
export function searchWords({ stage, done, of }) {
  return stage === "remakes" ? `Playing other designs of the holes marked down: ${done} of ${of}` : `Playing the holes in the head: ${done} of ${of}`;
}

// The holes the review of a course (its holes' plays known) marks down,
// most first (SEARCH.holes at most), and the designs to try of each:
// [{ hole, k, seed, layout }] - each the hole made again as the hole
// editor's New layout makes it (the same par, length and choices).
export function remakes(course, plays, { seed = 1, tries = SEARCH_CHOICES.best.tries } = {}) {
  const n = course.holes.length;
  if (!tries || !canSearch(course) || plays.length < n || plays.some((p) => !p)) return [];
  const review = reviewCourse(course, { plays });
  return holeMarks(review, n)
    .map((m, i) => [i, m])
    .filter(([, m]) => m > 0)
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, SEARCH.holes)
    .flatMap(([i]) =>
      Array.from({ length: tries }, (_, k) => {
        const s = remakeSeed(seed, i, k);
        return { hole: i, k, seed: s, layout: rebuildHole(course, i, { seed: s }).holes[i].layout };
      }),
    );
}

// The best course of them all: the course (its holes' plays), then each
// hole marked down in turn, each of its designs tried that's been played
// (tried: remakes, each with its { play }) kept if it makes the course
// score better (searchScore) - and, with siFromPlay, the stroke indexes set
// from how its holes play (for when they weren't typed in). Out: { course,
// plays, review, record } - the course carrying the record as `search`:
// the seed, the scores before and after, each hole tried with its designs'
// seeds and the one kept (null: none was better).
export function best(course, plays, tried = [], { seed = 1, tries = SEARCH_CHOICES.best.tries, siFromPlay = false, stopped = false } = {}) {
  const n = course.holes.length;
  let top = course;
  let topPlays = plays.slice();
  let review = reviewCourse(top, { plays: topPlays });
  let score = searchScore(review, n);
  const before = { review: review.score, search: score };
  const holes = [];
  for (const i of [...new Set(tried.map((t) => t.hole))]) {
    const mine = tried.filter((t) => t.hole === i && t.play);
    let kept = null;
    for (const t of mine) {
      const old = top.holes[i];
      const holesNow = top.holes.slice();
      // (As rebuildHole makes it: its spec with the new seed, its mowing
      // kept.)
      holesNow[i] = { spec: { ...old.spec, seed: t.seed }, layout: old.layout?.mow ? { ...t.layout, mow: old.layout.mow } : t.layout };
      const next = { ...top, holes: holesNow };
      const nextPlays = topPlays.slice();
      nextPlays[i] = t.play;
      const r = reviewCourse(next, { plays: nextPlays });
      const sc = searchScore(r, n);
      if (sc > score) [top, topPlays, review, score, kept] = [next, nextPlays, r, sc, t.seed];
    }
    holes.push({ hole: i + 1, tried: mine.map((t) => t.seed), kept });
  }
  let si = false;
  if (siFromPlay && n >= 9 && topPlays.length === n && topPlays.every(Boolean)) {
    const order = strokeIndexesFromPlay(topPlays);
    if (top.holes.some((h, i) => h.spec.si !== order[i])) {
      top = { ...top, holes: top.holes.map((h, i) => ({ ...h, spec: { ...h.spec, si: order[i] }, layout: { ...h.layout, si: order[i] } })) };
      review = reviewCourse(top, { plays: topPlays });
      score = searchScore(review, n);
      si = true;
    }
  }
  const record = { seed, tries, before, after: { review: review.score, search: score }, holes, si, ...(stopped ? { stopped: true } : {}) };
  return { course: { ...top, search: record }, plays: topPlays, review, record };
}

// What the search did, in a player's words (record: best's): "The best of
// 22 courses: every hole played in the head, and other designs tried for
// the 7 holes the review marked down. Kept new designs of holes 10, 12, 16
// and 17 - its review's score from 8.8 to 9.4. ..."
const listWords = (list) => (list.length < 2 ? list.join("") : `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`);
export function searchSaid(record, { hills = false } = {}) {
  if (!record) return "";
  const designs = record.holes.reduce((a, h) => a + h.tried.length, 0);
  const kept = record.holes.filter((h) => h.kept != null).map((h) => h.hole).sort((a, b) => a - b);
  const parts = [];
  if (!record.holes.length) parts.push("Every hole played in the head: the review marked none of them down, so the course is as first made.");
  else {
    parts.push(`The best of ${1 + designs} courses: every hole played in the head, and other designs tried for the ${record.holes.length === 1 ? "hole" : `${record.holes.length} holes`} the review marked down${record.stopped ? " (stopped part-way)" : ""}.`);
    parts.push(kept.length ? `Kept ${kept.length === 1 ? `a new design of hole ${kept[0]}` : `new designs of holes ${listWords(kept)}`} - the review's score from ${record.before.review} to ${record.after.review}.` : `None of them was better, so the holes are as first made (the review's score ${record.after.review}).`);
  }
  if (record.si) parts.push("The stroke indexes are set from how the holes play.");
  if (hills) parts.push("Then laid on the hills - the Review plays the holes again as they are there.");
  return parts.join(" ");
}

// The whole search here, in order (tests, tools): best(...) of the course.
export function searchAll(course, { seed = 1, tries = SEARCH_CHOICES.best.tries, siFromPlay = false } = {}) {
  const plays = course.holes.map((h) => holePlay(h.layout));
  const tried = remakes(course, plays, { seed, tries }).map((t) => ({ ...t, play: holePlay(t.layout) }));
  return best(course, plays, tried, { seed, tries, siFromPlay });
}
