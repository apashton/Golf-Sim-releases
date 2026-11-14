// The course designer's review (sim/coursereview.mjs): the course scored
// the way the ranking panels score one, and notes on its holes saying what
// to change - each with a way to the hole. The quick part's there at once;
// the holes are played in the head on another of the computer's cores
// (reviewworker.js), one at a time, and Shot options and Challenge fill in
// when they're done. A hole's play is kept for as long as the page is
// open, until the hole's changed.

import { reviewCourse, holePlay, playKey, ownHazards, strokeIndexesFromPlay, PARTS, PART_ORDER } from "./sim/coursereview.mjs";
import { esc } from "./util.js";

// Each hole's play by what it depends on (playKey).
const plays = new Map();
// Holes sent to be played, and who's waiting.
const asked = new Set();
const listeners = new Set();
let worker = null;
let broken = typeof Worker === "undefined";

function played(key, play) {
  asked.delete(key);
  pending.delete(key);
  if (play) plays.set(key, play);
  for (const f of listeners) f(key);
}

// Plays worked out elsewhere - the course maker's search (searchrunner.js)
// plays every hole of a new course - kept as the review's own, so it has
// them at once (list: holePlay by hole of the course as it is).
export function rememberPlays(c, list) {
  const own = ownHazards(c);
  c.holes.forEach((h, i) => {
    if (list?.[i]) plays.set(playKey(h.layout, own[i]), list[i]);
  });
}

function theWorker() {
  if (broken) return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL("reviewworker.js", import.meta.url), { type: "module" });
  } catch {
    broken = true;
    return null;
  }
  worker.onmessage = ({ data }) => {
    if (data.error) console.warn("A hole couldn't be played for the review:", data.error);
    played(data.key, data.play ?? null);
  };
  // (Couldn't load its code, or died: the rest played here, between
  // frames.)
  worker.onerror = (e) => {
    console.warn("The review worker stopped; playing the holes on the page instead:", e.message ?? e);
    broken = true;
    worker = null;
    const left = [...asked];
    asked.clear();
    for (const key of left) if (pending.has(key)) playHere(key, ...pending.get(key));
  };
  return worker;
}

// The holes sent, by key - [layout, own] - for playing them here if the
// worker stops.
const pending = new Map();
function playHere(key, layout, own) {
  asked.add(key);
  setTimeout(() => {
    let play = null;
    try {
      play = holePlay(layout, { own });
    } catch (err) {
      console.warn("A hole couldn't be played for the review:", err);
    }
    played(key, play);
  }, 30);
}

function ask(key, layout, own) {
  if (plays.has(key) || asked.has(key)) return;
  pending.set(key, [layout, own]);
  const w = theWorker();
  if (!w) return playHere(key, layout, own);
  asked.add(key);
  w.postMessage({ key, layout, own });
}

const LEVELS = { fix: "To fix", look: "Worth a look", good: "Good", info: "" };

// The review drawn in `el`, of the course as course() has it: openHole(i)
// goes to a hole; setStrokeIndexes(si) gives the holes stroke indexes.
// Returns { draw, stop }.
export function mountReview(el, { course, openHole, setStrokeIndexes }) {
  let keys = [];
  const draw = () => {
    const c = course();
    if (!c?.holes?.length) {
      el.innerHTML = "";
      return;
    }
    const own = ownHazards(c);
    keys = c.holes.map((h, i) => playKey(h.layout, own[i]));
    keys.forEach((k, i) => ask(k, c.holes[i].layout, own[i]));
    const have = keys.map((k) => plays.get(k));
    const done = have.filter(Boolean).length;
    const r = reviewCourse(c, { plays: have });
    const all = done === keys.length;
    const si = all ? strokeIndexesFromPlay(have) : null;
    const siSame = si && c.holes.every((h, i) => h.spec.si === si[i]);
    el.innerHTML = `
      <div class="review-top">
        <div class="review-score"><b>${r.score ?? "-"}</b><small>out of 10</small></div>
        <div>
          <p>Scored the way the ranking panels score a course: shot options and variety are half of it. Each note says what to change; a hole's button goes to it.</p>
          <p class="muted small">${
            all
              ? `Every hole played in the head by the course's four golfers - scratch, 10 handicap, bogey and a short hitter.`
              : `Playing the holes in the head: ${done} of ${keys.length} done. Shot options and Challenge come when they all are.`
          }</p>
          ${r.weakest.length ? `<p class="small">Most to look at: ${r.weakest.map((i) => goButton(i)).join(" ")}</p>` : ""}
        </div>
      </div>
      <div class="review-parts">${PART_ORDER.map((key) => partHtml(key, r.parts[key], key === "pace" && si && !siSame)).join("")}</div>`;
    for (const b of el.querySelectorAll("button[data-hole]")) b.addEventListener("click", () => openHole(Number(b.dataset.hole)));
    el.querySelector("#si-from-play")?.addEventListener("click", () => setStrokeIndexes(si));
  };
  const onPlay = (key) => {
    if (keys.includes(key)) draw();
  };
  listeners.add(onPlay);
  draw();
  return {
    draw,
    stop: () => listeners.delete(onPlay),
  };
}

const goButton = (i) => `<button class="go" data-hole="${i}" title="Go to hole ${i + 1}">Hole ${i + 1}</button>`;

function partHtml(key, part, offerSi) {
  const p = PARTS[key];
  const score = part.fixed ? "" : part.waiting ? `<span class="muted">playing...</span>` : `<b>${part.score}</b><small>/10</small>`;
  const bar = part.score == null ? "" : `<span class="review-bar"><span style="width:${part.score * 10}%"></span></span>`;
  const order = { fix: 0, look: 1, info: 2, good: 3 };
  const notes = [...part.notes].sort((a, b) => order[a.level] - order[b.level]);
  const body = part.fixed
    ? `<p class="muted small">A course from the map: its holes are where they really are.</p>`
    : notes.length
      ? `<ul class="review-notes">${notes
          .map((n) => `<li class="review-${n.level}">${LEVELS[n.level] ? `<span class="review-level">${LEVELS[n.level]}</span> ` : ""}${esc(n.text)}${n.holes.length && (n.each || n.holes.length <= 3) ? ` ${n.holes.map(goButton).join(" ")}` : ""}</li>`)
          .join("")}</ul>`
      : part.waiting
        ? ""
        : `<p class="muted small">Nothing to say.</p>`;
  return `<section class="review-part">
      <h3>${esc(p.name)} <span class="review-part-score">${score}</span></h3>
      ${bar}
      <p class="muted small">${esc(p.says)}</p>
      ${body}
      ${offerSi ? `<button id="si-from-play">Set the stroke indexes from how the holes play</button>` : ""}
    </section>`;
}
