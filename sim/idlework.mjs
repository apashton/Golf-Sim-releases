// Work done in the picture's quiet moments (the owner: "buffered loading
// when screen is paused, pre loading next load ... when the CPU/GPU aren't
// under full load they are utilised to make things smoother that are
// upcoming"): the next hole built while you're stood over the ball, its
// shaders and shapes sent to the graphics card - so moving on costs
// nothing when it comes. Pure: how much time there is to spare in a frame,
// and a queue of jobs run a step at a time within it.
//
// A job is a generator: each `yield` is a place it can stop and carry on
// from in a later frame. Yielding WAIT says it's waiting on something
// else (the graphics card building its shaders): nothing more of it this
// frame. Such a wait should give up after a while - a job finished at once
// (finish) runs straight through them. Yielding HEAVY says the step after
// it may hold the page for a while (a shader drawn for the first time:
// look/gpuprep.js): it's run only in a frame that can take that
// (heavyAllowed), the job waiting till one comes. It's never stopped
// part-way through a step, so a step should be short; a step longer than
// the time there is still runs (once a frame at most), its time taken off
// the next frames'.

// Milliseconds a frame can give:
//   rest     the picture resting (nothing moving, no frame being drawn -
//            sim/stillpicture.mjs): most of a frame
//   spare    while frames are drawn - only with the picture never resting
//            (its setting off), as a step can run longer than this: what's
//            left of a frame under its target, less a margin, never more
//            than this
//   margin   kept free in a drawn frame (the browser's own work)
//   pause    a pause that's there to load in (the scorecard after each
//            hole: course.js showHoleCard): most of a 60 Hz frame's worth
//            and more - the picture behind it isn't what's watched
//   between  between holes with the next one still being built - the cart
//            ride, watching the cart drive (course/buggy.js buildingBetween):
//            a resting frame's worth, moving picture or not. Nothing's
//            played meanwhile, and on the trickle a phone took minutes to
//            build the hole while its Next hole waited (the owner, 1
//            November 2026: "Huge pause/frozen loading next hole from the
//            golf cart")
//   trickle  what a drawn frame gives anyway once the work has had nothing
//            for `starve` ms - with the picture never resting, or a frame
//            never under its target (a machine running flat out), the next
//            hole was never built ahead, so moving on built it all at once,
//            every shader with it, in one frame: a freeze of seconds on a
//            Windows card (found playing a round headless: 27 shaders
//            built in the first frame of the next hole)
//   heavyStarve  how long (ms) work waits before a heavy step (HEAVY) may
//            run in a drawn frame, and the least between two of them: with
//            the picture never resting (recording, rain, the green's grid)
//            its hitch comes once in this long rather than every one at
//            once when the hole comes - a report's green: a dozen shapes
//            and three or four new shaders drawn in one step while
//            putting, 374 - 2112 ms each, seven steps running
export const IDLE = { rest: 12, spare: 4, margin: 3, pause: 40, between: 12, trickle: 2, starve: 15000, heavyStarve: 20000 };

// The most steps one frame runs, however quick they are.
const MAX_STEPS = 500;

// Yielded by a job waiting on something outside it.
export const WAIT = Symbol("wait");
// A step this long (ms) or more is kept for a report (noteSlow).
export const SLOW_STEP_MS = 50;
// Yielded by a job before a step that may hold the page for a while (a
// shader's first drawing): run only in a frame that can take it.
export const HEAVY = Symbol("heavy");

// Whether a frame can take a heavy step: one the picture rests in, or
// that's behind a card there to load in (IDLE.rest and over - nothing is
// being watched that a hold would spoil), or - the picture never resting -
// once work has been waiting IDLE.heavyStarve, and then one such step
// every IDLE.heavyStarve at most (sinceHeavy: ms since the queue last ran
// one, IdleQueue.sinceHeavy), so the hitches are spread out rather than
// one a frame. Never one with no time at all (anything that must stay
// smooth under way).
export function heavyAllowed({ budget = 0, starved = 0, sinceHeavy = Infinity } = {}) {
  if (!(budget > 0)) return false;
  return budget >= IDLE.rest || (starved >= IDLE.heavyStarve && sinceHeavy >= IDLE.heavyStarve);
}

// Whether a job's being run straight through now (finish, runAll): nothing
// it waits on can come while it runs, so a wait should give up at once
// (and what it waited for be done there and then).
let hurrying = 0;
export function hurried() {
  return hurrying > 0;
}
function straightThrough(it) {
  hurrying++;
  try {
    let r = it.next();
    while (!r.done) r = it.next();
    return r.value;
  } finally {
    hurrying--;
  }
}

// The time a frame can give to the queue now.
//   resting   the picture isn't being drawn (nothing's moving)
//   busy      something that must stay smooth is under way (a ball in the
//             air or rolling, a flyover, a shot coming in): nothing
//   frameMs   how long the last drawn frame took
//   targetMs  how long a frame may take (1000 / the screen's rate)
//   rests     whether the picture rests at all (sim/stillpicture.mjs's
//             setting): if it does, the work waits for it to
//   pause     a card is up that's there to load behind: the most of all,
//             whatever's moving behind it
//   between   between holes, the next still being built (the cart ride):
//             IDLE.between, whatever's moving - but nothing while busy
//   starved   how long (ms) the work's been waiting with nothing given it
//             (IdleQueue's starved): from IDLE.starve on, never less than
//             IDLE.trickle - but still nothing while busy
export function idleBudget({ resting = false, busy = false, frameMs = 0, targetMs = 1000 / 60, rests = true, pause = false, between = false, starved = 0 } = {}) {
  if (pause) return IDLE.pause;
  if (busy) return 0;
  if (resting) return IDLE.rest;
  if (between) return IDLE.between;
  const floor = starved >= IDLE.starve ? IDLE.trickle : 0;
  if (rests || !(frameMs > 0) || !(targetMs > 0)) return floor;
  return Math.max(floor, Math.min(IDLE.spare, targetMs - frameMs - IDLE.margin));
}

// The jobs waiting, run a step at a time in the time given.
export class IdleQueue {
  // now(): milliseconds, for the budget (performance.now in the page).
  constructor({ now = () => Date.now() } = {}) {
    this.now = now;
    this.jobs = [];
    // Time a step overran by, owed by the frames after it.
    this.owed = 0;
  }

  // Adds a job: id (another of the same id is replaced), steps (a
  // generator, or a function making one: made when it first runs),
  // done(result) when it finishes, failed(err) if a step throws, and
  // after: not started before this time (now()'s ms) - a moment's grace
  // for what's just begun on screen - and priority: higher goes first (what
  // the next shot needs before the next hole).
  // Returns the job, whose `cancelled` and `finished` say how it went.
  add({ id, steps, done = () => {}, failed = () => {}, after = 0, priority = 0 }) {
    this.cancel(id);
    const job = { id, steps, done, failed, after, priority, it: null, cancelled: false, finished: false, ran: 0 };
    const at = this.jobs.findIndex((j) => j.priority < priority);
    if (at < 0) this.jobs.push(job);
    else this.jobs.splice(at, 0, job);
    return job;
  }

  has(id) {
    return this.jobs.some((j) => j.id === id);
  }

  // Hands a job over: taken out of the queue with its steps as they stand
  // (started, if they weren't), for the caller to run on - a hole wanted
  // before it was built ahead, finished a slice at a time behind a card
  // (course.js nextHole) rather than all at once (finish). Returns the
  // job ({ it, done, failed, ... }) or null.
  take(id) {
    const job = this.jobs.find((j) => j.id === id) ?? null;
    if (!job) return null;
    this.jobs = this.jobs.filter((x) => x !== job);
    job.it ??= typeof job.steps === "function" ? job.steps() : job.steps;
    return job;
  }

  // A step that took SLOW_STEP_MS or more: kept with its job and what it
  // said it did (the label it yielded: "building the trees") - the
  // slowest since takeSlowest last asked, for that frame's long-frame
  // facts (app.js, sim/longframes.mjs).
  noteSlow(id, r, ms) {
    const what = typeof r?.value === "string" ? r.value : r?.value === WAIT ? "waiting" : r?.done ? "finishing" : "";
    if (!this.slowest || ms > this.slowest.ms) this.slowest = { id, what, ms: Math.round(ms) };
  }
  takeSlowest() {
    const s = this.slowest ?? null;
    this.slowest = null;
    return s;
  }

  // Stops a job before its next step (and lets it tidy up: its generator's
  // finally blocks run).
  cancel(id) {
    for (const j of this.jobs.filter((x) => x.id === id)) {
      j.cancelled = true;
      try {
        j.it?.return?.();
      } catch {
        // Gone either way.
      }
    }
    this.jobs = this.jobs.filter((x) => x.id !== id);
  }

  get idle() {
    return this.jobs.length === 0;
  }

  // Ms since a heavy step last ran (Infinity if none has): for
  // heavyAllowed's spacing.
  sinceHeavy() {
    return this.heavyAt == null ? Infinity : this.now() - this.heavyAt;
  }

  // How long (ms) there's been work ready to run - since the queue last
  // had none (0 if none is): for idleBudget's trickle, and for
  // heavyAllowed. (Not reset as a step runs: from IDLE.starve on, the
  // trickle goes on every frame until the work's done. Reset each step, it
  // gave one step then waited another 15 s - the next hole never built
  // ahead while recording, so moving on finished it all at once: a long
  // freeze. A job held at a heavy step is ready: it's waiting for a frame
  // that can take it.)
  starved() {
    if (!this.next(true)) {
      this.fedAt = null;
      return 0;
    }
    this.fedAt ??= this.now();
    return this.now() - this.fedAt;
  }

  // The first job that can run now (not waiting this frame, and not held
  // at a heavy step unless heavy steps may run: heavy).
  next(heavy = this.heavy) {
    const t = this.now();
    return this.jobs.find((j) => !(j.after > t) && !(j.waitingUntil != null && j.waitingUntil === this.frame) && (heavy || !j.heavyWait)) ?? null;
  }

  // Runs steps, the first job's first, for up to `budget` ms (less what's
  // owed). heavy: whether this frame can take a heavy step (heavyAllowed).
  // forgive: nothing owed from before (the page has been let go since:
  // RestRunner). Returns how many steps ran.
  run(budget, { heavy = false, forgive = false } = {}) {
    this.frame = (this.frame ?? 0) + 1;
    this.heavy = !!heavy;
    if (forgive) this.owed = 0;
    // (Steps that did something - not a wait on another core - this run.)
    this.lastWorked = 0;
    let left = budget - this.owed;
    this.owed = Math.max(0, -left);
    if (left <= 0 || !this.next()) return 0;
    const start = this.now();
    let steps = 0;
    for (;;) {
      const job = this.next();
      if (!job) break;
      let r;
      const t0 = this.now();
      try {
        job.it ??= typeof job.steps === "function" ? job.steps() : job.steps;
        // (Resumed at its heavy step: that's the step run now.)
        if (job.heavyWait) this.heavyAt = t0;
        job.heavyWait = false;
        r = job.it.next();
      } catch (err) {
        this.jobs = this.jobs.filter((x) => x !== job);
        job.finished = true;
        job.failed(err);
        continue;
      }
      steps++;
      this.lastWorked++;
      const took = this.now() - t0;
      job.ran += took;
      // (A slow one noted: which job, and what the step said it did.)
      if (took >= SLOW_STEP_MS) this.noteSlow(job.id, r, took);
      if (r.done) {
        this.jobs = this.jobs.filter((x) => x !== job);
        job.finished = true;
        job.done(r.value);
      } else if (r.value === WAIT) {
        // Its turn over this frame; the others carry on.
        job.waitingUntil = this.frame;
        this.lastWorked--;
      } else if (r.value === HEAVY) {
        // Its next step waits for a frame that can take it (this one, if
        // it can); the others carry on.
        job.heavyWait = true;
      }
      const used = this.now() - start;
      // (A clock that doesn't move - steps quicker than it ticks - still
      // stops somewhere.)
      if (used >= left || steps >= MAX_STEPS) {
        this.owed = Math.max(0, Math.min(budget * 4, used - left));
        break;
      }
    }
    return steps;
  }

  // Every step of every job, now (a hole wanted before it was ready).
  finish(id = null) {
    for (const job of [...this.jobs]) {
      if (id != null && job.id !== id) continue;
      try {
        job.it ??= typeof job.steps === "function" ? job.steps() : job.steps;
        const value = straightThrough(job.it);
        this.jobs = this.jobs.filter((x) => x !== job);
        job.finished = true;
        job.done(value);
      } catch (err) {
        this.jobs = this.jobs.filter((x) => x !== job);
        job.finished = true;
        job.failed(err);
      }
    }
  }
}

// A generator run to its end at once (a hole built the usual way).
export function runAll(steps) {
  return straightThrough(steps);
}

// The quiet moments' work run between the frames too while the picture
// rests (the owner, 1 November 2026: "Some times where we get a loading
// screen, need to see how we can really reduce the loading time of a hole
// on mobile"). Run only from the frame loop, the work had a resting frame's
// IDLE.rest each time a frame came - and while nothing's drawn the frames
// can come slowly: in a page measured with nothing on screen changing, once
// a second, so the next hole took over nine minutes to build ahead where its
// steps were under four seconds' work (and the cart's ground, read first,
// a third of a second's, took a minute and a quarter). This runs it in
// slices of its own (`slice` ms, a resting frame's worth) one after another,
// the page let go between each (schedule: a task posted, not a frame), for
// as long as canRun() says the picture's resting and there's work - so the
// time a phone stands still over the ball goes on the next hole, whatever
// the frames do. A slice with nothing to run (every job waiting on another
// core or the card) tries again after `backoff` ms.
//   queue: the IdleQueue; canRun(): resting, nothing moving, the page
//   shown; schedule(fn, ms): fn run as its own task after ms (0: as soon as
//   the page is free).
export const REST_RUN = { slice: IDLE.rest, backoff: 30 };

export class RestRunner {
  constructor({ queue, canRun = () => false, schedule, slice = REST_RUN.slice, backoff = REST_RUN.backoff }) {
    Object.assign(this, { queue, canRun, schedule, slice, backoff });
    this.pending = false;
    // Slices run and steps taken, for a report.
    this.slices = 0;
    this.steps = 0;
  }

  // From the frame loop each frame (and whenever the picture may have come
  // to rest): starts the slices if there's work and they can run.
  poke() {
    if (this.pending || this.queue.idle || !this.canRun()) return false;
    this.pending = true;
    this.schedule(() => this.tick(), 0);
    return true;
  }

  tick() {
    this.pending = false;
    if (this.queue.idle || !this.canRun()) return;
    // (Resting: a heavy step's hold spoils nothing. Nothing owed: the page
    // was let go between this slice and the last.)
    const steps = this.queue.run(this.slice, { heavy: true, forgive: true });
    this.slices++;
    this.steps += steps;
    if (this.queue.idle) return;
    this.pending = true;
    // (Only waits this slice - every job waiting on another core or the
    // card: a moment before asking again, not straight away for ever.)
    this.schedule(() => this.tick(), this.queue.lastWorked > 0 ? 0 : this.backoff);
  }
}
