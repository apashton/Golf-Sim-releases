// The A² Golf video (docs/VIDEO-PLAN.md): the game plays its one video by
// itself and records it - the menu's Record the A² Golf video, or "record
// the show reel". sim/showreel.mjs is the video with nothing of the page:
// its scenes, captions and the shots it plays, each planned from where the
// course mode has the ball and how it's set up to hit it, in the physics
// the course flies it with. This plays them on the page:
//
//   - nothing kept: settings are held (util.js holdSettings), and anything
//     the page would send its server but its own shots and its recording is
//     stopped (guardFetch, sim/showreel.mjs reelMayWrite); the page reloads
//     at the end, everything as it was;
//   - nothing seen loading: the recording is held while each hole builds
//     and its first frames are drawn (videorec.js hold), and while a shot
//     is planned;
//   - each shot sent as a launch monitor's is (/api/test-shot, from the
//     video's own device), so the game plays it as any other;
//   - the four-ball online with no relay: this page is the pretend host,
//     the friends' shots fed in as their bays would send them, this bay's
//     taken by it (app.js reelNet);
//   - the course designer: the real hole editor over the game, worked by a
//     finger as a player would, drawn into the recording (compositor.js
//     setPage, domraster.js), its changed hole then played.

import { holdSettings, esc } from "./util.js";
import { mountHandEditor } from "./holeeditor.js";
import { REEL_ID } from "./sim/clips.mjs";
import {
  REEL_SCENES,
  REEL_CAPTIONS,
  REEL_COURSE,
  REEL_WEATHER,
  REEL_SEVERITY,
  REEL_PLAYER,
  REEL_HOST,
  REEL_LAYOUT,
  FOUR_ORDER,
  FOUR_PLAN,
  captionSeconds,
  planShot,
  planFourSteps,
  shotProblems,
  reelGame,
  hostTakes,
  friendId,
  bayOf,
  ballOf,
  friendEvent,
  towardsView,
  greenView,
  fourLane,
  FOUR_APART,
  DESIGN_STEPS,
  designSpot,
  designTeeShot,
  reelMayWrite,
  reelShotBody,
} from "./sim/showreel.mjs";

// Where the end is said across the reload.
const DONE_KEY = "golfsim.reelDone";
// The longest each wait may take (seconds of the video's clock), before
// it's given up on and noted.
const HOLE_SECONDS = 120;
const SHOT_SECONDS = 45;
const ARRIVE_SECONDS = 8;
// How long things stay up (seconds).
const OPEN_SECONDS = 3.5;
const LOOK_SECONDS = 1.6;
const AFTER_SHOT = 0.8;
const AFTER_HOLED = 3.2;
const END_SECONDS = 5;
// The course's pauses in play while it plays (course.js pace): shorter.
const REEL_PACE = 0.6;
// The friends strike their putts this far apart (seconds): "at similar
// times" (the owner), never quite together.
const PUTT_STAGGER = [0, 0.35, 0.7];

export class Showreel {
  // host:
  //   modes, video (videorec.js), view (the game's element), mode(),
  //   setMode(name)
  //   busy()           a round or game in progress it would end, or null
  //   playingOnline()  an online game this bay is in
  //   toast(text, ms), shots() (how many of its shots have come in)
  //   setPlayers(names), online(send) (this bay's changes to the four-ball,
  //   null: back to the server's), cover(on) (the course not drawn while
  //   the designer covers it), prepare(), reload(), openRecordings
  constructor(host) {
    this.host = host;
    this.state = "idle";
    this.waits = new Set();
    this.clock = 0;
    this.frameCount = 0;
    this.log = [];
    const view = host.view ?? document.body;
    // Its words on the page too, as the recording has them.
    this.captionEl = document.createElement("div");
    this.captionEl.className = "reel-caption";
    this.captionEl.hidden = true;
    this.cardEl = document.createElement("div");
    this.cardEl.className = "reel-card";
    this.cardEl.hidden = true;
    this.doneEl = document.createElement("div");
    this.doneEl.className = "corner-card reel-done";
    this.doneEl.hidden = true;
    view.append(this.captionEl, this.cardEl, this.doneEl);
    this.doneEl.addEventListener("click", (e) => {
      const act = e.target.closest("[data-reel]")?.dataset.reel;
      if (act === "folder") this.host.openRecordings?.();
      if (act) this.doneEl.hidden = true;
    });
  }

  get active() {
    return this.state === "running";
  }
  // What's over the picture of its own (the command centre's mirror).
  get elements() {
    return [this.captionEl, this.cardEl];
  }

  // A key: while it plays, Esc stops it and nothing else gets through.
  key(e) {
    if (!this.active) return false;
    if (e.key === "Escape") this.stop("stopped by Esc");
    e.preventDefault?.();
    return true;
  }

  // The menu's item, or "record the show reel": started, or why not.
  offer() {
    if (this.state !== "idle") return { why: "The A² Golf video is already recording" };
    const h = this.host;
    const busy = h.busy?.();
    const why = busy ? `Finish ${busy} first (or end it in the menu)` : h.playingOnline?.() ? "Leave the online game first" : h.video?.recording ? "Stop the recording first (Shift + V)" : null;
    if (why) {
      h.toast(why, 3500);
      return { why };
    }
    void this.start();
    return { done: "video", short: "Recording the A² Golf video" };
  }

  stop(why = "stopped") {
    if (!this.active) return false;
    this.aborted = true;
    this.stopWhy = why;
    for (const w of [...this.waits]) w.resolve(false);
    return true;
  }

  // ---- Its clock ----------------------------------------------------------------------

  // The render loop's every frame (app.js).
  frame(dt) {
    this.frameCount++;
    if (!this.active) return;
    this.clock += Math.min(dt, 0.1);
    if (this.captionUntil != null && this.clock >= this.captionUntil) this.setCaption(null);
    for (const w of [...this.waits]) {
      let met = false;
      try {
        met = !!w.test();
      } catch {
        met = false;
      }
      if (met) w.resolve(true);
      else if (this.clock >= w.end) w.resolve(false);
    }
  }
  until(test, seconds) {
    if (this.aborted) return Promise.resolve(false);
    try {
      if (test()) return Promise.resolve(true);
    } catch {
      // Not yet.
    }
    return new Promise((resolve) => {
      // (By the video's clock alone, which runs with the game's frames -
      // held too: on a slow PC the game's ball flies as slowly, so a wait
      // in real time would end before it lands.)
      const w = {
        test,
        end: this.clock + seconds,
        resolve: (v) => {
          this.waits.delete(w);
          resolve(v);
        },
      };
      this.waits.add(w);
    });
  }
  // `seconds` of the video.
  hold(seconds) {
    return this.until(() => false, seconds).then(() => !this.aborted);
  }
  frames(n) {
    const at = this.frameCount;
    return this.until(() => this.frameCount >= at + n, 10);
  }
  note(where, what) {
    this.log.push({ at: Math.round(this.clock * 10) / 10, where, what });
    console.info(`[video] ${where}: ${what}`);
  }

  // ---- Its words ----------------------------------------------------------------------

  // A caption, a lower third: up for as long as its words take to read.
  // (In the designer, across the top: the editor under it keeps that band
  // clear, its buttons never under the words.)
  setCaption(c, { seconds = null } = {}) {
    const has = !!(c?.title || c?.lines?.length);
    const top = !!this.finger;
    this.captionUntil = has ? this.clock + (seconds ?? captionSeconds(c)) : null;
    this.host.video?.compositor?.setCaption(has ? { ...c, top } : null);
    this.captionEl.innerHTML = has ? `${c.title ? `<b>${esc(c.title)}</b>` : ""}${(c.lines ?? []).map((l) => `<span>${esc(l)}</span>`).join("")}` : "";
    this.captionEl.classList.toggle("top", top);
    this.captionEl.hidden = !has;
  }
  // A card over the whole picture (solid: nothing of the game through it).
  setCard(c) {
    const has = !!c?.title;
    this.host.video?.compositor?.setCard(has ? c : null);
    this.cardEl.classList.toggle("solid", !!c?.solid);
    this.cardEl.innerHTML = has ? `<h2>${esc(c.title)}</h2>${(c.lines ?? []).map((l) => `<p>${esc(l)}</p>`).join("")}` : "";
    this.cardEl.hidden = !has;
  }

  // ---- Playing it ---------------------------------------------------------------------

  // from: a scene's id to start at, the ones before it left out (for
  // checking one part: window.golfsim.reel.start({ from: "designer" })).
  async start({ from = null } = {}) {
    if (this.state !== "idle") return false;
    const h = this.host;
    this.state = "running";
    this.aborted = false;
    this.stopWhy = null;
    this.log = [];
    this.startedWall = Date.now();
    document.body.classList.add("reel-on");
    // Nothing kept from here on (see the top).
    holdSettings();
    this.guardFetch();
    h.prepare();
    // Its opening card from the first frame, before anything else shows.
    this.setCard({ ...REEL_CAPTIONS.open, solid: true });
    const c = h.modes.course;
    Object.assign(c.settings, REEL_COURSE);
    c.fixedSeverity = REEL_SEVERITY;
    c.pace = REEL_PACE;
    c.offers = false;
    c.holdOnHole = true;
    h.setPlayers([REEL_PLAYER]);
    if (h.mode() !== "course") h.setMode("course");
    const rec = h.video;
    this.recorded = false;
    this.fileBefore = rec?.lastFile ?? null;
    if (rec?.supported) {
      rec.compositor.setReelLayout(REEL_LAYOUT);
      rec.compositor.setCard({ ...REEL_CAPTIONS.open, solid: true, instant: true });
      this.recorded = await rec.start({ reel: true, video: REEL_ID, quiet: true }).catch(() => false);
    }
    if (!this.recorded) this.note("recording", rec?.supported ? "the recording didn't start" : "recording isn't supported here");
    try {
      await this.run(from);
    } catch (err) {
      this.note("video", `failed: ${err?.message ?? err}`);
    }
    return this.end();
  }

  async run(from = null) {
    // The title, recorded, over everything.
    await this.hold(OPEN_SECONDS);
    const first = Math.max(0, REEL_SCENES.findIndex((s) => s.id === from));
    for (const scene of REEL_SCENES.slice(first)) {
      if (this.aborted) break;
      try {
        if (scene.four) await this.fourBall(scene);
        else if (scene.designer) await this.designer(scene);
        else if (scene.id === "end") await this.ending();
        else await this.solo(scene);
      } catch (err) {
        this.note(scene.id, `failed: ${err?.message ?? err}`);
      }
    }
  }

  // Off the recording while `fn` runs (a hole building, a shot planned):
  // held, and carried on from where it stopped.
  async offAir(fn) {
    const held = this.host.video?.hold(true) ?? false;
    try {
      return await fn();
    } finally {
      if (held) this.host.video.hold(false);
    }
  }

  // A course as it comes with the game (never the player's own copy).
  async courseOf(id) {
    const r = await fetch(`/api/reel/course/${encodeURIComponent(id)}`);
    if (!r.ok) throw new Error(`no course ${id}`);
    return r.json();
  }

  // The round's hole `number` built, the player on it ready to hit: no
  // card, flyover or look down it, nothing flying or being set up.
  holeReady(number) {
    const c = this.host.modes.course;
    const r = c.round;
    return !!(r?.hole && !c.switching && r.index === number - 1 && c.me && !c.flying && !c.settingUp && !c.lookDown && !c.flyover && !c.holeCard && !c.ride);
  }
  readyToHit() {
    const c = this.host.modes.course;
    const p = c.me;
    return !!(c.round?.hole && p && !p.done && !c.round.done && !c.flying && !c.settingUp && !c.switching && !c.relief);
  }

  // A round on hole `number` of `course`, built off the recording with its
  // first frames drawn. net: the four-ball's.
  async startHole(course, number, net = null) {
    const c = this.host.modes.course;
    return this.offAir(async () => {
      if (net) await c.startRound(null, number, net, { course });
      else await c.startRound(course.id, number, null, { weather: REEL_WEATHER, course });
      const ok = await this.until(() => this.holeReady(number), HOLE_SECONDS);
      if (!ok) throw new Error(`${course.name} hole ${number} wasn't ready`);
      // Its shaders built and its first pictures drawn, off the recording,
      // and any card over it (the opening one) gone as it comes back on.
      await this.frames(45);
      this.setCard(null);
      return true;
    });
  }

  // A shot as a launch monitor sends it, then the wait for it to come in.
  async send(shot) {
    const before = this.host.shots();
    const res = await fetch("/api/test-shot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(reelShotBody(shot)) });
    if (!res.ok) throw new Error(`the server refused the shot (${res.status})`);
    if (!(await this.until(() => this.host.shots() > before, ARRIVE_SECONDS))) throw new Error("the shot never came in");
    await this.frames(1);
  }

  // This bay's player's next shot of `kind`, planned from where the course
  // has them and how they're set up (off the recording), and checked. opts:
  // the planner's (lo, hi, apart). The plan, or null.
  async planNext(kind, opts = {}) {
    const c = this.host.modes.course;
    if (!(await this.until(() => this.readyToHit(), SHOT_SECONDS))) {
      this.note(kind, "never ready to hit");
      return null;
    }
    const p = c.me;
    const hole = c.round.hole;
    const seed = c.course.holes[c.round.index]?.spec?.seed ?? c.round.index + 1;
    const plan = await this.offAir(() => planShot(kind, hole, p.ball, p.lie, { seed, up: { club: p.club, aim: p.aim, stance: p.stance }, ...opts }));
    if (!plan) {
      this.note(kind, `no ${kind} found from ${p.lie}`);
      return null;
    }
    const problems = shotProblems(kind, plan.result, { hole, lo: opts.lo, hi: opts.hi });
    if (problems.length) this.note(kind, problems.join("; "));
    return plan;
  }
  // The next shot planned (planNext) and played, the ball watched to rest.
  async playShot(kind, opts = {}) {
    const plan = await this.planNext(kind, opts);
    return plan && this.strike(plan);
  }
  // A planned shot played, and the ball watched to rest. The plan, or null.
  // cutAway: once the ball's at rest, the game moving on (its camera going
  // to the ball for the next shot) kept off the recording - the next
  // scene's camera cuts in straight from the shot's.
  async strike(plan, { cutAway = false } = {}) {
    const c = this.host.modes.course;
    const p = c.me;
    const kind = plan.kind;
    const strokes = p.strokes;
    await this.send(plan.shot);
    // Struck (the course counts it as it flies), then at rest and the game
    // moved on from it (the next shot set up, or the hole over).
    if (!(await this.until(() => p.strokes > strokes, ARRIVE_SECONDS))) {
      this.note(kind, "the game never played it");
      return null;
    }
    const movedOn = () => !c.flying && (p.done || c.round?.done || this.readyToHit());
    if (cutAway) {
      await this.until(() => !c.flying, SHOT_SECONDS);
      // The game's own moment on where it finished (its pause before
      // moving on: settingUp, or online the turn pending), then off.
      await this.until(() => !(c.settingUp || c.round?.pending), 2);
      await this.offAir(() => this.until(movedOn, SHOT_SECONDS));
    } else await this.until(movedOn, SHOT_SECONDS);
    // What it did against what was planned (the owner: "Sense check all
    // the shots for anything unusual").
    const off = p.done ? (plan.result.holed ? 0 : Infinity) : Math.hypot(p.ball[0] - plan.result.rest[0], p.ball[1] - plan.result.rest[1]);
    if (!(off < 0.5) || !!p.done !== !!plan.result.holed) this.note(kind, `played differently from its plan (${p.done ? "holed" : `${off.toFixed(1)} m off`})`);
    return plan;
  }

  // A hole of its own: its shots in turn from the tee.
  async solo(scene) {
    const course = await this.courseOf(scene.course);
    await this.startHole(course, scene.hole);
    this.setCaption(REEL_CAPTIONS[scene.id] ?? null);
    await this.hold(LOOK_SECONDS);
    const c = this.host.modes.course;
    for (const kind of scene.play) {
      if (this.aborted) return;
      const plan = await this.playShot(kind);
      if (!plan) return;
      if (c.me?.done) break;
      await this.hold(AFTER_SHOT);
    }
    // Its cheer, or a moment to see where the last one finished.
    await this.hold(c.me?.done ? AFTER_HOLED : 1.4);
  }

  // ---- The four-ball ------------------------------------------------------------------

  // Four friends online on one hole (the owner: "show the drives coming
  // towards the camera (would never see it this way in game) show the
  // second shot by one of the player from their viewpoint. But all the
  // other 3 players already shoot before the player in view. Lastly show
  // the green with all 4 putts going at similar times").
  async fourBall(scene) {
    const h = this.host;
    const c = h.modes.course;
    const course = await this.courseOf(scene.course);
    this.game = reelGame(course);
    h.online((ev) => this.fromHere(ev));
    try {
      await this.startHole(course, scene.hole, { bay: REEL_HOST.bay, game: this.game, courseUrl: `/api/reel/course/${encodeURIComponent(course.id)}` });
      const hole = c.round.hole;
      const h0 = c.round.index;
      const par = c.course.holes[h0].spec.par;
      const seed = c.course.holes[h0].spec?.seed ?? h0 + 1;
      const tee = [...c.me.ball];
      // The four's shots, planned off the recording a shot at a time (the
      // page answering between them).
      const four = await this.offAir(async () => {
        const steps = planFourSteps(hole, seed, tee);
        for (let s = steps.next(); ; s = steps.next()) {
          if (s.done) return s.value;
          if (!(await this.frames(1)) && this.aborted) return {};
        }
      });
      for (const name of FOUR_ORDER) for (const s of four[name] ?? []) if (s.problems?.length) this.note(`${name} ${s.kind}`, s.problems.join("; "));
      const friends = FOUR_ORDER.filter((n) => n !== REEL_PLAYER);
      if (friends.some((n) => (four[n] ?? []).length < 3 || four[n].some((s) => !s.result))) throw new Error("the friends' shots couldn't all be planned");
      const send = (name, k) => this.friendShot(name, four[name][k], { hole, h: h0, par });

      // 1. The drives, from down the fairway: each coming at the camera.
      const rests = FOUR_ORDER.map((n) => four[n][0].result.rest);
      c.holdView(towardsView(tee, rests), { cut: true });
      await this.offAir(() => this.frames(20));
      // (Alex's drive planned first, off the recording: once the friends
      // have swung, nothing's held.)
      const drive = await this.planNext(FOUR_PLAN.drives[REEL_PLAYER].kind, { side: FOUR_PLAN.drives[REEL_PLAYER].side ?? 0, take: four[REEL_PLAYER]?.[0]?.take ?? 0 });
      this.setCaption(REEL_CAPTIONS.friends);
      await this.hold(1.2);
      const start = this.clock;
      const at = (s) => this.until(() => this.clock - start >= s, 10);
      friends.forEach((name) => {
        const k = FOUR_ORDER.indexOf(name);
        void at(FOUR_PLAN.stagger[k]).then(() => !this.aborted && send(name, 0));
      });
      await at(FOUR_PLAN.stagger[FOUR_ORDER.indexOf(REEL_PLAYER)]);
      if (drive) await this.strike(drive);
      await this.until(() => this.allDown(), SHOT_SECONDS);
      await this.hold(1.2);

      // 2. Alex's second, from Alex's own view: the other three play
      // theirs first, flying in towards the green ahead.
      c.holdView(null);
      await this.offAir(() => this.frames(10));
      this.setCaption(REEL_CAPTIONS.second);
      await this.hold(1.4);
      for (const name of friends) {
        send(name, 1);
        await this.hold(1.1);
      }
      await this.until(() => this.allDown(), SHOT_SECONDS);
      await this.hold(0.8);
      const [lo, hi] = FOUR_PLAN.approaches[REEL_PLAYER];
      const apart = friends.map((n) => four[n][1].result.rest);
      const approach = await this.planNext("approach", { lo, hi, apart, apartDeg: FOUR_APART, fan: fourLane(hole, tee, REEL_PLAYER), take: four[REEL_PLAYER]?.[1]?.take ?? 0 });
      if (approach) await this.strike(approach, { cutAway: true });

      // 3. The green, low: all four putts at once - cut to straight from
      // the approach (the game's own camera going to the player's ball
      // for the putt kept off the recording).
      await this.offAir(async () => {
        await this.until(() => this.allDown(), SHOT_SECONDS);
        await this.until(() => this.readyToHit(), SHOT_SECONDS);
        const balls = [...friends.map((n) => four[n][1].result.rest), [...c.me.ball]];
        c.holdView(greenView([hole.cup.x, hole.cup.z], balls), { cut: true });
        await this.frames(10);
      });
      const putt = await this.planNext("putt");
      this.setCaption(REEL_CAPTIONS.putts);
      await this.hold(1.4);
      const putts = this.clock;
      friends.forEach((name, i) => {
        void this.until(() => this.clock - putts >= PUTT_STAGGER[i], 10).then(() => !this.aborted && send(name, 2));
      });
      if (putt) await this.strike(putt);
      await this.until(() => this.allDown(), SHOT_SECONDS);
      await this.hold(AFTER_HOLED);
    } finally {
      c.holdView(null);
      h.online(null);
      this.game = null;
    }
  }
  // Nothing of anyone's in the air or rolling here.
  allDown() {
    const c = this.host.modes.course;
    return !c.flying && !c.remoteFlying?.length && !c.remoteFlights?.length;
  }
  // A friend's planned shot, as their bay would send it to the host.
  friendShot(name, plan, { hole, h, par }) {
    const game = this.game;
    if (!game || !plan?.result) return;
    const pid = friendId(game, name);
    const ev = friendEvent({ hole, par, pid, h, at: ballOf(game, pid, h), plan });
    this.take(ev, bayOf(game, name));
  }
  // This bay's own changes to the four-ball (course.js netSend).
  fromHere(ev) {
    this.take(ev, REEL_HOST.bay);
    return Promise.resolve({ ok: true });
  }
  take(ev, bay) {
    if (!this.game) return;
    const r = hostTakes(this.game, ev, bay);
    if (r.why) {
      this.note("online", `${ev.type} from ${bay} refused: ${r.why}`);
      return;
    }
    this.game = r.game;
    this.host.modes.course.applyNet(this.game);
  }

  // ---- The designer -------------------------------------------------------------------

  // The hole editor over the game, used as a player would (the owner:
  // "Show a quick demo of the course designer showing how easy to amend
  // holes even with the multiple options"), then its changed hole played.
  async designer(scene) {
    const h = this.host;
    const comp = h.video?.compositor;
    let course = await this.courseOf(scene.course);
    const index = scene.hole - 1;
    const spec = course.holes[index].spec;
    await this.designerStyles();
    const el = document.createElement("div");
    el.className = "reel-designer";
    el.innerHTML = `<div class="reel-hand"></div>`;
    // The finger on the page (the recording draws its own: compositor.js
    // setTouch).
    const finger = document.createElement("div");
    finger.className = "reel-finger";
    finger.hidden = true;
    document.body.append(el, finger);
    this.finger = { el: finger, x: innerWidth / 2, y: innerHeight * 0.7, down: false };
    const played = { want: false };
    mountHandEditor(el.querySelector(".reel-hand"), {
      key: `a2-golf-video#${index}`,
      base: "a2-golf-video",
      number: spec.number,
      stands: spec.seed ?? index + 1,
      layout: () => course.holes[index].layout,
      save: (layout) => {
        const holes = course.holes.slice();
        holes[index] = { ...course.holes[index], layout };
        course = { ...course, holes };
      },
      play: () => (played.want = true),
      forget: true,
    });
    const canvas = el.querySelector("#big");
    // (Its taps are the video's own, not a real pointer's: nothing to
    // capture.)
    if (canvas) canvas.setPointerCapture = () => {};
    comp?.setPage(el);
    comp?.setTouch(() => (this.finger?.el.hidden ? null : this.finger));
    // (Nothing of the course shows behind it: not drawn meanwhile.)
    h.cover?.(true);
    try {
      // Drawn once, its icons loaded, off the recording (no card over it).
      await this.offAir(() => (this.setCard(null), this.frames(30)));
      this.setCaption(REEL_CAPTIONS.designer, { seconds: 4 });
      await this.hold(1.2);
      for (const step of DESIGN_STEPS) {
        if (this.aborted) return;
        await this.designStep(el, step, () => course.holes[index].layout);
        await this.hold(0.9);
      }
      // Play this hole.
      await this.tap(el.querySelector("#hand-play"));
      await this.until(() => played.want, 3);
    } finally {
      h.cover?.(false);
      comp?.setPage(null);
      comp?.setTouch(null);
      el.remove();
      finger.remove();
      this.finger = null;
    }
    if (this.aborted) return;
    // The hole as changed, from its tee: its tee shot (onto the green on
    // a par 3).
    await this.startHole(course, scene.hole);
    this.setCaption(null);
    await this.hold(LOOK_SECONDS);
    await this.playShot(designTeeShot(spec.par));
    await this.hold(1.6);
  }
  // The designer's styles, on the game page for the editor (designer.css).
  designerStyles() {
    if (document.querySelector('link[data-reel="designer"]')) return Promise.resolve();
    return new Promise((resolve) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "designer.css";
      link.dataset.reel = "designer";
      link.onload = link.onerror = () => resolve();
      document.head.appendChild(link);
    });
  }
  // A design step: its tool and mode picked, then a tap, a rub or its
  // buttons.
  async designStep(el, step, layout) {
    this.setCaption({ lines: [step.said] }, { seconds: 3 });
    await this.tap(el.querySelector(`[data-tool="${step.tool}"]`));
    await this.hold(0.5);
    if (step.mode) {
      await this.tap(el.querySelector(`[data-mode="${step.mode}"]`));
      await this.hold(0.4);
    }
    const canvas = el.querySelector("#big");
    const spot = (at) => canvas.pointFor(designSpot(layout(), at));
    if (step.tap) await this.tapMap(canvas, spot(step.tap));
    if (step.rub) await this.rubMap(canvas, step.rub.map(spot));
    for (let k = 0; k < (step.styles ?? 0); k++) {
      const styles = [...el.querySelectorAll("[data-style]")];
      await this.tap(styles[(k + 1) % Math.max(1, styles.length)]);
      await this.hold(1.1);
    }
  }
  // The finger moved to (x, y) over `seconds`, eased.
  async moveFinger(x, y, seconds = 0.45) {
    const f = this.finger;
    if (!f) return;
    f.el.hidden = false;
    const from = { x: f.x, y: f.y };
    const t0 = this.clock;
    await this.until(() => {
      const u = Math.min(1, (this.clock - t0) / seconds);
      const e = u * u * (3 - 2 * u);
      f.x = from.x + (x - from.x) * e;
      f.y = from.y + (y - from.y) * e;
      f.el.style.left = `${f.x}px`;
      f.el.style.top = `${f.y}px`;
      return u >= 1;
    }, seconds + 2);
  }
  press(down) {
    if (!this.finger) return;
    this.finger.down = down;
    this.finger.el.classList.toggle("down", down);
  }
  // A button tapped as a finger would.
  async tap(button) {
    if (!button) return;
    const r = button.getBoundingClientRect();
    await this.moveFinger(r.left + r.width / 2, r.top + r.height / 2);
    this.press(true);
    await this.hold(0.15);
    button.click();
    this.press(false);
  }
  pointer(canvas, type, [x, y]) {
    canvas.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 7, pointerType: "touch", isPrimary: true, bubbles: true, cancelable: true, buttons: type === "pointerup" ? 0 : 1 }));
  }
  async tapMap(canvas, at) {
    await this.moveFinger(...at);
    this.press(true);
    this.pointer(canvas, "pointerdown", at);
    await this.hold(0.12);
    this.pointer(canvas, "pointerup", at);
    this.press(false);
  }
  async rubMap(canvas, points) {
    await this.moveFinger(...points[0]);
    this.press(true);
    this.pointer(canvas, "pointerdown", points[0]);
    for (let i = 1; i < points.length; i++) {
      const [ax, ay] = points[i - 1];
      const [bx, by] = points[i];
      for (let k = 1; k <= 12; k++) {
        const q = [ax + ((bx - ax) * k) / 12, ay + ((by - ay) * k) / 12];
        await this.moveFinger(q[0], q[1], 0.05);
        this.pointer(canvas, "pointermove", q);
      }
    }
    this.pointer(canvas, "pointerup", points.at(-1));
    this.press(false);
  }

  // ---- The end ------------------------------------------------------------------------

  async ending() {
    this.setCaption(null);
    this.setCard({ ...REEL_CAPTIONS.end, solid: true });
    await this.hold(END_SECONDS);
  }

  // Its recording finished, what became of it kept for after the reload,
  // and the page loaded again: everything as it was.
  async end() {
    this.state = "ending";
    for (const w of [...this.waits]) w.resolve(false);
    const h = this.host;
    const c = h.modes.course;
    c.holdView?.(null);
    h.online(null);
    // (Its round isn't one of the player's: never saved.)
    if (c.round) c.round.saved = true;
    let file = null;
    let why = null;
    if (this.recorded) {
      h.toast("Saving the A² Golf video...", 4000);
      try {
        await h.video.stop();
        const last = h.video.lastFile;
        file = last && last !== this.fileBefore ? (last.file ?? null) : null;
        if (!file) why = "the recording wasn't finished";
      } catch (err) {
        why = err.message;
      }
    } else why = "it couldn't be recorded here";
    const done = { file, why, stopped: this.stopWhy, seconds: Math.round((Date.now() - this.startedWall) / 1000), log: this.log };
    console.info("[video] ended", done);
    try {
      sessionStorage.setItem(DONE_KEY, JSON.stringify(done));
    } catch {
      // Not said after the reload.
    }
    this.result = done;
    h.reload();
    return done;
  }

  // After the reload: where the recording went (or why there isn't one).
  static saidAfter() {
    try {
      const raw = sessionStorage.getItem(DONE_KEY);
      if (!raw) return null;
      sessionStorage.removeItem(DONE_KEY);
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  // shown: settles when the game's loading screen has gone (the card's
  // under it till then) - its 20 seconds count from there.
  showDone(done, { folder = false, shown = null } = {}) {
    if (!done) return;
    const head = `The A² Golf video ${done.stopped ? "was stopped" : "is finished"}.`;
    const where = done.file ? `In the recordings folder: <b>${esc(done.file)}</b>` : `It wasn't recorded: ${esc(done.why ?? "the recording didn't start")}`;
    this.doneEl.innerHTML = `
      <div class="cc-q">${head}</div>
      <div class="cc-why">${where}</div>
      <div class="cc-why">Everything is back as it was - nothing it did was kept.</div>
      <div class="cc-buttons">${folder && done.file ? `<button data-reel="folder">Open the folder</button>` : ""}<button data-reel="close">OK</button></div>`;
    this.doneEl.hidden = false;
    clearTimeout(this.doneTimer);
    const wait = () => (this.doneTimer = setTimeout(() => (this.doneEl.hidden = true), 20000));
    if (shown) shown.then(wait);
    else wait();
  }

  // Nothing it does reaches the server's keeping (sim/showreel.mjs
  // reelMayWrite): stopped before it's sent, answered as if done.
  guardFetch() {
    if (this.realFetch) return;
    const real = window.fetch;
    this.realFetch = real;
    window.fetch = function (input, init) {
      const url = typeof input === "string" ? input : (input?.url ?? String(input));
      const method = init?.method ?? input?.method ?? "GET";
      if (!reelMayWrite(method, url)) {
        console.info(`[video] not kept: ${method} ${url}`);
        return Promise.resolve(new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } }));
      }
      return real.call(this ?? window, input, init);
    };
  }
}
