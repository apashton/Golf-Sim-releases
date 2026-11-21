// The course maker's search for the best course (sim/coursesearch.mjs) on
// the page: every hole of the new course played in the head, then other
// designs of the holes the review marks down, all at once on several of
// the computer's cores - the review's own worker (reviewworker.js), as many
// of it as there are cores to spare - and the best course of them all kept.
// Where a worker can't start, the holes are played here, one at a time
// between frames. Stopped part-way, it keeps the best so far (or, before
// every hole's been played, the course as made).

import { holePlay } from "./sim/coursereview.mjs";
import { remakes, best } from "./sim/coursesearch.mjs";

// How many workers: every core but one, four at most.
const poolSize = () => Math.max(1, Math.min(4, (globalThis.navigator?.hardwareConcurrency || 2) - 1));

// Hole layouts played (sim/coursereview.mjs holePlay): their plays, in
// order (null for one that couldn't be, or wasn't before stopped()).
// onEach(done, of) as each comes back.
function playAll(layouts, { onEach = () => {}, stopped = () => false } = {}) {
  const plays = layouts.map(() => null);
  if (!layouts.length) return Promise.resolve(plays);
  return new Promise((resolve) => {
    const queue = layouts.map((_, i) => i);
    const workers = [];
    let busy = 0;
    let done = 0;
    let settled = false;
    const end = () => {
      if (settled) return;
      settled = true;
      for (const w of workers) w.terminate();
      resolve(plays);
    };
    const took = (i, play) => {
      plays[i] = play ?? null;
      busy--;
      onEach(++done, layouts.length);
      feed();
    };
    // Here, between frames: one at a time.
    const playHere = (i) => {
      busy++;
      setTimeout(() => {
        let play = null;
        try {
          play = holePlay(layouts[i]);
        } catch (err) {
          console.warn("A hole couldn't be played for the search:", err);
        }
        took(i, play);
      }, 20);
    };
    function feed() {
      if (settled) return;
      if (stopped() || !queue.length) {
        if (!busy) end();
        return;
      }
      if (!workers.length) {
        if (!busy) playHere(queue.shift());
        return;
      }
      for (const w of workers) {
        if (w.job != null || !queue.length) continue;
        w.job = queue.shift();
        busy++;
        w.postMessage({ key: w.job, layout: layouts[w.job], own: null });
      }
    }
    if (typeof Worker !== "undefined") {
      for (let k = 0; k < poolSize(); k++) {
        let w;
        try {
          w = new Worker(new URL("reviewworker.js", import.meta.url), { type: "module" });
        } catch {
          break;
        }
        w.job = null;
        w.onmessage = ({ data }) => {
          if (data.error) console.warn("A hole couldn't be played for the search:", data.error);
          w.job = null;
          took(data.key, data.play);
        };
        // (It couldn't load, or died: its hole goes back in the queue, for
        // the others - or here, if none's left.)
        w.onerror = (e) => {
          console.warn("A search worker stopped:", e.message ?? e);
          workers.splice(workers.indexOf(w), 1);
          w.terminate();
          if (w.job != null) {
            queue.unshift(w.job);
            busy--;
            w.job = null;
          }
          feed();
        };
        workers.push(w);
      }
    }
    feed();
  });
}

// The best course from the one made (designed, flat - sim/coursesearch.mjs
// canSearch): { course, plays, review, record }, or null if it was stopped
// before every hole had been played. onProgress({ stage, done, of }):
// stage "holes" (the course's own) then "remakes" (the other designs).
export async function findBest(course, { seed = 1, tries = 3, siFromPlay = false, onProgress = () => {}, stopped = () => false } = {}) {
  const n = course.holes.length;
  onProgress({ stage: "holes", done: 0, of: n });
  const plays = await playAll(
    course.holes.map((h) => h.layout),
    { onEach: (done, of) => onProgress({ stage: "holes", done, of }), stopped },
  );
  if (plays.some((p) => !p)) return null;
  const designs = remakes(course, plays, { seed, tries });
  onProgress({ stage: "remakes", done: 0, of: designs.length });
  const played = await playAll(
    designs.map((t) => t.layout),
    { onEach: (done, of) => onProgress({ stage: "remakes", done, of }), stopped },
  );
  return best(course, plays, designs.map((t, i) => ({ ...t, play: played[i] })), { seed, tries, siFromPlay, stopped: stopped() });
}
