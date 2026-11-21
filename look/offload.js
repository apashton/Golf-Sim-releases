// Parts of building a hole worked out on another of the computer's cores
// (buildworker.js running sim/buildtasks.mjs), so the page goes on drawing
// while they're made - or here, as they always were, where there's no
// worker to be had (it couldn't start, or failed) or the answer's wanted
// before it's back. The same answer either way.

import { runTask } from "../sim/buildtasks.mjs";

// Up to two workers - a hole's country and its tufts worked out side by
// side - and never more than the computer has cores to spare.
const CORES = (typeof navigator !== "undefined" && navigator.hardwareConcurrency) || 2;
const MOST = Math.max(1, Math.min(2, CORES - 1));
const workers = [];
// The quick tasks that come every shot (a shot's grass across the hole:
// course.js growHoleGrass) get a worker of their own where there's a core
// for it beyond the two, so they never queue behind a hole's country or
// tufts being built ahead; with fewer cores they share.
const QUICK_OWN = CORES >= 4;
let quick = null;
let broken = typeof Worker === "undefined";
let nextId = 1;
const waiting = new Map();

function giveUp(why) {
  broken = true;
  for (const job of waiting.values()) {
    job.error = why;
    job.done = true;
  }
  waiting.clear();
  for (const w of workers) w.terminate();
  workers.length = 0;
  quick?.terminate();
  quick = null;
}

function startWorker() {
  const worker = new Worker(new URL("../buildworker.js", import.meta.url), { type: "module" });
  worker.busy = 0;
  worker.onmessage = ({ data }) => {
    worker.busy = Math.max(0, worker.busy - 1);
    const job = waiting.get(data.id);
    if (!job) return;
    waiting.delete(data.id);
    if (data.error) job.error = new Error(data.error);
    else job.value = data.value;
    job.done = true;
  };
  // (A worker that couldn't load its code, or died: everything here from
  // now on.)
  worker.onerror = (e) => {
    console.warn("The build worker stopped; building on the page instead:", e.message ?? e);
    giveUp(new Error("worker stopped"));
  };
  return worker;
}

// The least busy worker, a new one if they're all busy and there's room.
function theWorker() {
  if (broken) return null;
  let w = workers.reduce((a, b) => (b.busy < a.busy ? b : a), workers[0]);
  if ((!w || w.busy > 0) && workers.length < MOST) {
    try {
      w = startWorker();
    } catch (err) {
      giveUp(err);
      return null;
    }
    workers.push(w);
  }
  return w;
}

// The quick tasks' own worker (or, without a core for it, the least busy).
function quickWorker() {
  if (broken) return null;
  if (!QUICK_OWN) return theWorker();
  if (!quick) {
    try {
      quick = startWorker();
    } catch (err) {
      giveUp(err);
      return null;
    }
  }
  return quick;
}

// Whether work can go to the worker at all.
export function canOffload() {
  return !broken;
}

// Starts task `name` (sim/buildtasks.mjs) on `input` (plain data) on the
// worker - a quick one (every shot's) on the quick tasks' own. Returns its
// job: { done, value, error } - done once it's back (or couldn't go);
// answer(job) has its answer either way.
export function offload(name, input, { quick: isQuick = false } = {}) {
  const job = { name, input, done: false, value: undefined, error: null, started: performance.now() };
  const w = isQuick ? quickWorker() : theWorker();
  if (!w) {
    job.error = new Error("no worker");
    job.done = true;
    return job;
  }
  const id = nextId++;
  job.id = id;
  waiting.set(id, job);
  try {
    w.postMessage({ id, task: name, input });
    w.busy++;
  } catch (err) {
    // (Something in the input that can't be sent: done here.)
    waiting.delete(id);
    job.error = err;
    job.done = true;
  }
  return job;
}

// A job's answer: the worker's if it's back, else worked out here and now
// (and the worker's, when it comes, ignored).
export function answer(job) {
  if (job.done && !job.error) return kept(job, job.value);
  if (!job.done) waiting.delete(job.id);
  else if (job.error?.message !== "no worker" && job.error?.message !== "worker stopped") console.warn(`Built ${job.name} on the page instead:`, job.error);
  return kept(job, runTask(job.name, job.input));
}

// A job's answer, kept with its hole if it asked to be (job.keep: look/
// bake.js), once.
function kept(job, value) {
  const keep = job.keep;
  job.keep = null;
  keep?.(value);
  return value;
}

// A job's answer if the worker's is back, else null (and the worker's, when
// it comes, ignored) - for an answer worked out another way on the page.
export function result(job) {
  if (job.done && !job.error) return kept(job, job.value);
  if (!job.done) waiting.delete(job.id);
  else if (job.error?.message !== "no worker" && job.error?.message !== "worker stopped") console.warn(`Built ${job.name} on the page instead:`, job.error);
  return null;
}
