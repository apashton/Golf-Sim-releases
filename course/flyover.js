// After a hole: the flyover, the highlights reel, replaying the last hole
// and the look down on the next.
// Part of CourseMode (course.js), split out of it: these methods are
// added to CourseMode.prototype there and run with `this` the course.

import { pickHighlights, strokeFacts, thinStroke } from "../sim/highlights.mjs";
import * as THREE from "three";
import { toWorld } from "../scenery.js";
import { makeShotTracer } from "../look/tracer.js";
import { tracerColour } from "../sim/tracer.mjs";
import { flyoverPlan, flyoverAt, lookDownFirst, lookDownPlan, lookDownAt, replayRing } from "../sim/flyover.mjs";
import { clearOfTrees } from "../view.js";
import { esc } from "../util.js";
import { onThisScreen } from "../sim/keywords.mjs";

// How long the replay card stays once a hole's finished (offerFlyover),
// before it fades away.
export const OFFER_SHOWN = 10000;
import { AFTER_FLYOVER, BALL_R, FLYOVER_CUT, CourseMode } from "../course.js";

// Holes kept parked for the replay of the hole just left (parkPlaying).
const KEPT_MAX = 1;

export class CourseFlyover {
  // ---- The flyover after a hole ---------------------------------------------------

  // How far the camera is from the ball while a flyover follows it: on
  // Ultra the picture's focused there (look/effects.js setFocus). null
  // otherwise - never while a shot's being played.
  focusDistance() {
    if (!this.flyover || !this.ball) return null;
    return this.camera.position.distanceTo(this.ball.position);
  }

  // A player's strokes on this hole, from their tracers (which keep each
  // stroke's flight and ground points): [{ tracer, putt, points }], the
  // points where the ball's centre went, the same points as the shot's
  // path, so a place along them is a place along the tracer.
  strokesOf(p) {
    return (this.tracers?.list ?? [])
      .filter((t) => t.userData.tracerOf === p)
      .map((t) => {
        const { air, ground } = t.userData.points;
        const pts = [...(air ?? []), ...(ground ?? []).slice(air ? 1 : 0)];
        return { tracer: t, putt: !!t.userData.putt, points: pts.map((v) => [v.x, v.y, v.z]) };
      });
  }

  // The hole is over: the flyover's card, for `p` (whoever just finished;
  // with friends any of them can be picked on it). With `auto` it's coming
  // by itself once the celebration's over, and the card says so. It never
  // holds up the next hole: once that's loaded the card stays, and J still
  // replays the hole just finished, until the next shot (keepLastHole).
  // The card itself fades out OFFER_SHOWN ms after the hole's finished
  // (the owner, 1 November 2026: "hangs around for too long... ensure it
  // fades out after 10 seconds after finishing the hole"); J still
  // replays the hole until the next shot.
  offerFlyover(p, { auto = false } = {}) {
    const r = this.round;
    r.lastFinisher = p;
    this.flyoverOffer = { slot: Math.max(0, r.players.indexOf(p)), auto };
    clearTimeout(this.offerTimer);
    this.offerEndsAt = performance.now() + OFFER_SHOWN;
    this.showOffer();
  }

  // The card fading away once its time's up (offerEndsAt), not shown again
  // for this hole - the next hole coming up included.
  fadeOffer() {
    this.offerEl.classList.add("fading");
    clearTimeout(this.offerFade);
    this.offerFade = setTimeout(() => {
      if (this.offerOver()) this.offerEl.hidden = true;
      this.offerEl.classList.remove("fading");
    }, 650);
  }
  offerOver() {
    return performance.now() >= (this.offerEndsAt ?? Infinity);
  }

  showOffer() {
    const r = this.round;
    // The next hole up: the last one's replay, until the next shot.
    const last = !this.flyoverOffer && this.lastHole && r && !r.done ? this.lastHole : null;
    const o = this.flyoverOffer ?? (last ? { slot: last.slot, auto: false } : null);
    if (!o || this.flyover || !r || !this.isActive || !this.offers || (this.offerOver() && !o.auto)) {
      this.offerEl.hidden = true;
      return;
    }
    // Just a Replay button (the owner, 1 November 2026: "Still not compact
    // enough, just replay would be enough") - with friends, Replay and each
    // one's name. (Its key label hidden on the phone by its style; the
    // flyover coming by itself says so, without the key there:
    // sim/keywords.mjs.)
    const buttons = this.multi
      ? `<span class="cc-label">Replay</span>` + r.players.map((p, i) => `<button data-slot="${i}" style="border-color:${p.colour}">${esc(p.name)}${i === o.slot ? " <kbd>J</kbd>" : ""}</button>`).join("")
      : `<button data-slot="0">Replay <kbd>J</kbd></button>`;
    this.offerEl.innerHTML = o.auto ? `<div class="cc-q">${esc(onThisScreen("Flyover of this hole next - Esc skips it"))}</div><div class="cc-buttons">${buttons}</div>` : `<div class="cc-buttons">${buttons}</div>`;
    this.offerEl.classList.toggle("just-replay", !o.auto);
    this.offerEl.classList.toggle("fading", false);
    // A ring round it running down to nothing as its time goes, gone as the
    // card fades (sim/flyover.mjs replayRing; style.css offer-ring).
    const ring = o.auto ? null : replayRing(performance.now(), this.offerEndsAt, OFFER_SHOWN);
    this.offerEl.classList.toggle("timed", !!ring);
    if (ring) {
      this.offerEl.style.setProperty("--offer-total", `${ring.total}ms`);
      this.offerEl.style.setProperty("--offer-at", `-${ring.elapsed}ms`);
    }
    this.offerEl.hidden = false;
    // (Faded at its time, wherever it's shown from - the next hole too.)
    clearTimeout(this.offerFade);
    if (!o.auto && Number.isFinite(this.offerEndsAt)) this.offerFade = setTimeout(() => this.fadeOffer(), Math.max(0, this.offerEndsAt - performance.now()));
  }

  hideOffer() {
    clearTimeout(this.offerTimer);
    clearTimeout(this.offerFade);
    this.flyoverOffer = null;
    this.offerEl.hidden = true;
  }

  // J or "flyover": the flyover, for the player on the offer (or whoever
  // finished last), while the hole just finished is still up; again, it
  // stops. Returns what happened, for the voice: { done } or { why }.
  toggleFlyover() {
    if (this.endLookDown()) return { done: "look down the hole stopped", short: "Look stopped" };
    if (this.flyover) {
      this.endFlyover();
      return { done: "flyover stopped", short: "Flyover stopped" };
    }
    return this.startFlyover();
  }

  // Esc or "skip the flyover": the one playing ends and the next hole
  // follows after the usual short wait; one still to come by itself isn't
  // played, and the hole's own wait carries on as if it had never been
  // due. False with neither, so Esc can go on to whatever else it does.
  skipFlyover() {
    // (And the look down the hole as it starts.)
    if (this.endLookDown()) return true;
    // (Between the highlights, while the next one's hole is built: they
    // stop there.)
    if (this.reel && !this.flyover) {
      this.endReel();
      return true;
    }
    if (this.flyover) {
      // (Esc in the highlights stops them all.)
      if (this.reel) this.reel.stop = true;
      this.endFlyover();
      return true;
    }
    if (!this.flyoverOffer?.auto) return false;
    this.flyoverOffer.auto = false;
    this.showOffer();
    return true;
  }

  startFlyover(slot = this.flyoverOffer?.slot ?? this.lastHole?.slot) {
    const r = this.round;
    // The next hole up and not a shot on it yet: the last hole, drawn again.
    if (r && !r.done && !r.finished && this.lastHole) return this.replayLastHole(slot);
    if (!r?.hole || !(r.done || r.finished)) return this.whyNot("A replay comes when the hole is finished");
    if (this.flying) return this.whyNot("Not while the ball's moving");
    // With no offer up, whoever holed out last.
    const p = r.players[slot] ?? r.lastFinisher ?? r.players[0];
    const plan = flyoverPlan(this.strokesOf(p));
    if (!plan.total) return this.whyNot("No strokes to fly over");
    this.endFlyover({ moveOn: false });
    // The wait for the next hole starts again when it ends.
    clearTimeout(this.nextTimer);
    // Played (by itself or asked for), it isn't still to come; and the card
    // stays for after it, to watch it again or follow someone else, until
    // the next hole - a long flyover would otherwise outlast it.
    if (this.flyoverOffer) this.flyoverOffer.auto = false;
    clearTimeout(this.offerTimer);
    this.celebration.clear();
    if (this.sections.showing) this.sections.reset();
    // Only this player's tracers, bright, drawn again as the ball goes.
    for (const t of this.tracers.list) t.visible = false;
    for (const s of plan.strokes) {
      s.tracer.userData.setLook("last");
      s.tracer.userData.hideAll();
    }
    this.flyover = { plan, t: 0, player: p, ball: this.ball.position.clone(), camWant: this.camWant.clone(), lookWant: this.lookWant.clone() };
    // It opens on the tee: a cut straight there, not the camera sweeping
    // back down the whole hole from the green, low over the ground and
    // through whatever trees stand in the way.
    this.stepFlyover(0);
    this.cutCamera();
    this.offerEl.hidden = true;
    this.onToast(this.multi ? `Flyover - ${p.name} - Esc skips` : "Flyover - Esc skips", 1500);
    this.render();
    return { done: "flyover", short: "Flyover" };
  }

  // ---- Replaying the last shot ----------------------------------------------------------

  // Q, or the touch strip's Replay, with no swing camera to replay it
  // (always so on the phone: the owner, 26 October 2026, "Replay doesnt
  // seem to work shot to shot, even though the button is there"): the last
  // stroke on this hole flown again with the flyover's camera, then back.
  // Again, it stops. Before a shot on the next hole, the last hole's
  // replay instead (J). Returns { done } or { why }, as toggleFlyover.
  replayLastShot() {
    if (this.flyover) {
      this.endFlyover();
      return { done: "replay stopped", short: "Replay stopped" };
    }
    const r = this.round;
    if (!r?.hole) return this.whyNot("No shot to replay yet");
    if (this.flying) return this.whyNot("Not while the ball's moving");
    const last = (this.tracers?.list ?? []).filter((t) => t.userData.tracerOf).at(-1);
    if (!last) return this.lastHole ? this.startFlyover() : this.whyNot("No shot on this hole to replay yet");
    const p = last.userData.tracerOf;
    const plan = flyoverPlan(this.strokesOf(p).filter((s) => s.tracer === last));
    if (!plan.total) return this.whyNot("No shot on this hole to replay yet");
    this.endLookDown();
    // (A hole just finished: its wait for the next starts again after.)
    clearTimeout(this.nextTimer);
    if (this.flyoverOffer) this.flyoverOffer.auto = false;
    clearTimeout(this.offerTimer);
    this.celebration.clear();
    if (this.sections.showing) this.sections.reset();
    // That stroke's tracer only, drawn again as the ball goes.
    for (const t of this.tracers.list) t.visible = false;
    last.visible = true;
    last.userData.setLook("last");
    last.userData.hideAll();
    this.flyover = { plan, t: 0, player: p, ball: this.ball.position.clone(), camWant: this.camWant.clone(), lookWant: this.lookWant.clone(), shot: true };
    this.stepFlyover(0);
    this.cutCamera();
    this.offerEl.hidden = true;
    this.onToast(this.multi ? `Replay - ${p.name}'s shot` : "Replay of your shot", 1500);
    this.render();
    return { done: "replay", short: "Replay" };
  }

  // ---- Replaying the last hole once the next is up -------------------------------------

  // The hole just finished, kept as the next one starts: which hole, its
  // layout (r.hole) and every stroke's path, by player - so J can draw it
  // again and follow the ball through it, until the next shot. Not online
  // (the other bays' changes come in against the hole being played).
  // The hole just finished, kept for the round's highlight reel (sim/
  // highlights.mjs): each stroke's flight, thinned, and what it did.
  keepForReel() {
    const r = this.round;
    if (!r?.hole || r.index < 0) return;
    const list = (this.tracers?.list ?? []).filter((t) => t.userData.made && t.userData.tracerOf);
    if (!list.length) return;
    const cup = [r.hole.cup.x, r.hole.cup.z];
    const strokes = list.map((t) => {
      const mine = list.filter((u) => u.userData.tracerOf === t.userData.tracerOf);
      const last = mine[mine.length - 1] === t;
      const kept = thinStroke(t.userData.made);
      return { player: r.players.indexOf(t.userData.tracerOf), putt: !!t.userData.putt, first: mine[0] === t, last, ...kept, facts: strokeFacts(kept, cup, { last }) };
    });
    const spec = this.course.holes[r.index].spec ?? {};
    r.reel = [...(r.reel ?? []).filter((h) => h.index !== r.index), { index: r.index, number: spec.number ?? r.index + 1, par: spec.par ?? 4, strokes }];
  }

  // The round's highlights (sim/highlights.mjs pickHighlights), played one
  // after another, each on its own hole with the flyover's camera: the
  // round card's Watch highlights (W). Esc stops them.
  watchHighlights() {
    const r = this.round;
    if (!r?.finished) return this.whyNot("The highlights come at the end of a round");
    if (this.flying || this.flyover) return this.whyNot("Not while the ball's moving");
    const clips = pickHighlights(r.reel ?? [], { names: this.multi ? r.players.map((p) => p.name) : null });
    if (!clips.length) return this.whyNot("No highlights this round - a holed putt, a chip-in or a long drive makes one");
    this.reel = { clips, k: 0, now: { hole: r.hole, index: r.index } };
    this.celebration.clear();
    this.playClip();
    return { done: "highlights", short: "Highlights" };
  }
  playClip() {
    const reel = this.reel;
    const r = this.round;
    const c = reel.clips[reel.k];
    const st = r.reel.find((h) => h.index === c.index)?.strokes[c.stroke];
    const p = r.players[st?.player];
    if (!st || !p) return this.endReel();
    if (this.sections.showing) this.sections.reset();
    // Its hole built a slice at a time while the last clip's picture stays
    // (buildAhead): built in one go, the reel stood frozen between clips.
    this.buildAhead(c.index)
      .then((pre) => {
        if (this.reel !== reel || this.round !== r) return this.dropPre(pre);
        r.index = c.index;
        r.hole = pre.hole;
        this.swapIn(pre);
        this.showClip(reel, c, st, p);
      })
      .catch((err) => {
        console.error("Couldn't draw the highlight's hole:", err);
        if (this.reel === reel) this.endReel();
      });
  }
  // A highlight's stroke flown over, its hole drawn.
  showClip(reel, c, st, p) {
    const r = this.round;
    // Only this clip's stroke on its hole: the tracers go from hole to hole
    // with the hole's group (swapIn), so the round's last hole's strokes
    // and the clips before stayed - and every clip flew them all again on
    // its own hole (the owner, 5 November 2026: "it played the shots. But
    // all on the same hole, not each holes shots").
    this.tracers?.clear();
    const place = ([x, y, z]) => toWorld(x, y + BALL_R, z);
    const t = this.tracers.add(makeShotTracer(st.drawn, st.air, place, { colour: tracerColour(st.player), putt: st.putt }));
    t.userData.tracerOf = p;
    t.userData.putt = st.putt;
    t.userData.revealAll();
    const plan = flyoverPlan(this.strokesOf(p));
    if (!plan.total) return this.nextClip();
    for (const s of plan.strokes) {
      s.tracer.userData.setLook("last");
      s.tracer.userData.hideAll();
    }
    this.flyover = { plan, t: 0, player: p, ball: this.ball.position.clone(), camWant: this.camWant.clone(), lookWant: this.lookWant.clone(), reel: true };
    this.stepFlyover(0);
    this.cutCamera();
    this.offerEl.hidden = true;
    this.onToast(`${c.words} (${reel.k + 1} of ${reel.clips.length}) - Esc stops`, Math.max(3000, plan.total * 1000));
    this.render();
  }
  nextClip() {
    const reel = this.reel;
    if (!reel) return;
    reel.k++;
    if (reel.k < reel.clips.length && !reel.stop) return this.playClip();
    this.endReel();
  }
  // Back to where the round finished, its card again.
  endReel() {
    const reel = this.reel;
    this.reel = null;
    this.onRoundCard?.(this.roundCards());
    if (!reel) return;
    // The round's last hole drawn back a slice at a time, behind the card
    // (buildAhead); a new round started meanwhile has its own.
    const r = this.round;
    this.buildAhead(reel.now.index, reel.now.hole)
      .then((pre) => {
        if (this.round !== r || this.reel) return this.dropPre(pre);
        r.hole = reel.now.hole;
        r.index = reel.now.index;
        this.swapIn(pre);
        // (The last clip's stroke not left on the round's last hole.)
        this.tracers?.clear();
        this.sections.attach(this.world);
        this.newPosition(true);
        this.showOffer();
        this.render();
      })
      .catch((err) => {
        console.error("Couldn't draw the last hole back:", err);
        if (this.round === r) this.backFromLastHole({ now: reel.now });
      });
  }

  keepLastHole(slot) {
    const r = this.round;
    this.lastHole = null;
    if (!r?.hole || r.index < 0 || r.net) return;
    const strokes = (this.tracers?.list ?? []).filter((t) => t.userData.made && t.userData.tracerOf).map((t) => ({ player: t.userData.tracerOf, putt: !!t.userData.putt, ...t.userData.made }));
    if (!strokes.length) return;
    this.lastHole = { index: r.index, number: this.course.holes[r.index].spec?.number ?? r.index + 1, hole: r.hole, strokes, slot: slot ?? Math.max(0, r.players.indexOf(r.lastFinisher ?? r.players[0])) };
  }

  dropLastHole() {
    // (Nor is the hole left kept for it - nor for nothing, with no replay
    // offered: its memory and the card's let go.)
    if (!this.flyover?.lastHole) this.dropKept();
    if (!this.lastHole) return;
    this.lastHole = null;
    if (!this.flyoverOffer) this.offerEl.hidden = true;
  }

  // The hole on show, parked rather than thrown away as the next one comes
  // (showHole), so the replay of the hole just left (J) and the way back
  // from it attach the same group instead of building it again. Off the
  // scene, not drawn: only which group is on the scene changes. One is
  // kept - all the replay needs - and none once it's no longer offered
  // (dropLastHole) or the round's over. (Drawing the hole just left in its
  // place beside the next tee was tried and taken out: it drew two holes'
  // ground and dressing over each other, and twice the scene each frame.)
  parkPlaying() {
    const r = this.round;
    if (!r || r.index < 0 || !this.world || this.world.children.length === 0) return;
    const key = this.prebuildKey(r.index);
    // The hole's tracers go with it (a J replay lays its strokes down again):
    // taken out of its group and freed now, while they're still its.
    this.tracers?.clear();
    this.scene.remove(this.world);
    this.keptHoles ??= new Map();
    const prev = this.keptHoles.get(key);
    if (prev && prev.world !== this.world) this.disposeWorld(prev);
    const snap = {};
    for (const k of CourseMode.KEPT_FIELDS) snap[k] = this[k];
    this.keptHoles.set(key, snap);
    this.world = new THREE.Group();
    this.scene.add(this.world);
    for (const k of CourseMode.KEPT_FIELDS) {
      if (k === "world") continue;
      this[k] = k === "countryMats" || k === "waterLevels" || k === "sceneSteps" ? [] : null;
    }
    this.trimKept(key);
  }

  trimKept(keep) {
    for (const [k, of] of [...(this.keptHoles ?? [])]) {
      if (this.keptHoles.size <= KEPT_MAX) break;
      if (k === keep) continue;
      this.keptHoles.delete(k);
      this.disposeWorld(of);
    }
  }

  takeKept(index) {
    const key = this.prebuildKey(index);
    const kept = this.keptHoles?.get(key);
    if (!kept) return null;
    this.keptHoles.delete(key);
    return kept;
  }

  // A kept hole on show again: its fields back, and what its building did
  // to the scene as a whole (its horizon, its shadows' reach, the tufts'
  // country) done again - not left as the hole it replaces had them.
  restoreKept(kept) {
    const stand = { world: this.world, shade: this.shade, splat: this.splat, countryPicture: this.countryPicture, cutField: this.cutField };
    this.scene.remove(this.world);
    this.disposeWorld(stand);
    for (const k of CourseMode.KEPT_FIELDS) {
      if (k === "world") this.world = kept.world;
      else this[k] = kept[k] ?? (k === "countryMats" || k === "waterLevels" || k === "sceneSteps" ? [] : null);
    }
    if (!this.world.parent) this.scene.add(this.world);
    if (this.tracers) this.tracers.parent = this.world;
    for (const fn of this.sceneSteps) fn();
  }

  dropKept() {
    for (const of of this.keptHoles?.values() ?? []) this.disposeWorld(of);
    this.keptHoles?.clear();
  }

  // J with the next hole up: the last hole drawn again (a moment's load),
  // its strokes laid back down, and the flyover along them; when it ends
  // (or a shot comes), this hole is drawn back as it was.
  replayLastHole(slot) {
    const r = this.round;
    const last = this.lastHole;
    if (this.flying) return this.whyNot("Not while the ball's moving");
    const p = r.players[slot] ?? r.players[last.slot] ?? r.players[0];
    if (!last.strokes.some((s) => s.player === p)) return this.whyNot(`No strokes of ${p.name}'s to replay`);
    const now = { hole: r.hole, index: r.index };
    this.endLookDown();
    this.celebration.clear();
    if (this.sections.showing) this.sections.reset();
    const kept = this.takeKept(last.index);
    this.parkPlaying();
    r.hole = last.hole;
    r.index = last.index;
    if (kept) this.restoreKept(kept);
    else this.buildHoleScene();
    const place = ([x, y, z]) => toWorld(x, y + BALL_R, z);
    for (const s of last.strokes) {
      const t = this.tracers.add(makeShotTracer(s.drawn, s.air, place, { colour: tracerColour(r.players.indexOf(s.player)), putt: s.putt }));
      t.userData.tracerOf = s.player;
      t.userData.putt = s.putt;
      t.userData.revealAll();
    }
    const plan = flyoverPlan(this.strokesOf(p));
    if (!plan.total) {
      this.backFromLastHole({ now });
      return this.whyNot("No strokes to replay");
    }
    for (const t of this.tracers.list) t.visible = false;
    for (const s of plan.strokes) {
      s.tracer.userData.setLook("last");
      s.tracer.userData.hideAll();
    }
    this.flyover = { plan, t: 0, player: p, ball: this.ball.position.clone(), camWant: this.camWant.clone(), lookWant: this.lookWant.clone(), lastHole: true, now };
    this.stepFlyover(0);
    this.cutCamera();
    this.offerEl.hidden = true;
    this.onToast(`Replay of hole ${last.number}${this.multi ? ` - ${p.name}` : ""} - Esc skips`, 1800);
    this.render();
    return { done: "replay", short: "Replay" };
  }

  // The last hole's replay over: this hole drawn back, the ball and the
  // view where they were, and the card up again to watch it once more.
  backFromLastHole(fo) {
    const r = this.round;
    if (!r) return;
    const kept = this.takeKept(fo.now.index);
    this.parkPlaying();
    r.hole = fo.now.hole;
    r.index = fo.now.index;
    if (kept) this.restoreKept(kept);
    else this.buildHoleScene();
    this.sections.attach(this.world);
    this.newPosition(true);
    this.showOffer();
    this.render();
  }

  // Look down the hole first (the setting; sim/flyover.mjs lookDownPlan):
  // as the hole starts, a four-second crane from behind the tee over the
  // landing area to the green, kept above the ground and clear of the
  // trees as the flyover is, then a cut back to the tee. Never in the
  // Challenges, which draw their holes without this mode.
  startLookDown() {
    this.lookDown = null;
    const L = this.hole?.layout;
    if (!lookDownFirst({ on: this.settings.lookDown, challenge: this.challenge ?? null, path: L?.path })) return;
    const path = L.path.map(([x, z]) => [z, -x]);
    this.lookDown = { plan: lookDownPlan(path, (x, z) => this.worldHeight(x, z), this.pinWorld.toArray()), t: 0, cam: new THREE.Vector3(), look: new THREE.Vector3() };
    this.stepLookDown(0);
  }

  stepLookDown(dt) {
    const ld = this.lookDown;
    ld.t += dt;
    const at = lookDownAt(ld.plan, ld.t);
    if (at.done) {
      this.endLookDown();
      return;
    }
    ld.cam.set(...at.cam);
    this.keepAboveGround(ld.cam, 3);
    clearOfTrees(this.cameraTrees, ld.cam, ld.look.set(...at.look));
    this.camera.position.copy(ld.cam);
    this.camera.lookAt(ld.look);
    this.camera.updateMatrixWorld();
  }

  // Ends it (cut short, or over): straight back to the view from the tee.
  // True if there was one.
  endLookDown() {
    if (!this.lookDown) return false;
    this.lookDown = null;
    this.cutCamera();
    return true;
  }

  // The camera straight to where it wants to be and looking where it
  // wants to look: a cut, rather than easing there.
  cutCamera() {
    this.camera.position.copy(this.camWant);
    this.look.copy(this.lookWant);
    this.camera.lookAt(this.look);
  }

  whyNot(why) {
    this.onToast(why, 1800);
    return { why };
  }

  // A frame of the flyover: the ball along its stroke, its tracer drawn as
  // far, the camera behind - above the ground and clear of the trees.
  stepFlyover(dt) {
    const fo = this.flyover;
    fo.t += dt;
    const at = flyoverAt(fo.plan, fo.t);
    if (at.done) {
      this.endFlyover();
      return;
    }
    fo.plan.strokes.forEach((s, i) => {
      const u = s.tracer.userData;
      if (i < at.stroke) u.revealAll();
      else if (i > at.stroke) u.hideAll();
      else if (at.reveal === "all") u.revealAll();
      else if (at.reveal) u.reveal(at.reveal.index, at.reveal.k);
      else u.hideAll();
    });
    this.ball.position.set(...at.ball);
    const putt = fo.plan.strokes[at.stroke].putt;
    this.camWant.set(...at.cam);
    this.lookWant.set(...at.look);
    const clearance = putt ? 0.6 : 2;
    this.keepAboveGround(this.camWant, clearance);
    this.camWant.y = Math.max(this.camWant.y, this.worldHeight(this.camWant.x, this.camWant.z) + clearance);
    clearOfTrees(this.cameraTrees, this.camWant, this.ball.position);
    // A stroke played from somewhere else (back to the tee after an
    // unplayable ball, a drop): cut to it rather than sweep down the hole.
    if (fo.stroke != null && at.stroke !== fo.stroke) {
      const prev = fo.plan.strokes[fo.stroke]?.points.at(-1);
      const start = fo.plan.strokes[at.stroke].points[0];
      if (prev && Math.hypot(start[0] - prev[0], start[2] - prev[2]) > FLYOVER_CUT) {
        this.camera.position.copy(this.camWant);
        this.look.copy(this.lookWant);
      }
    }
    fo.stroke = at.stroke;
  }

  // The flyover's over (or cut short): every tracer back as it was, the
  // ball back where it lay, the camera back to the view it left - and,
  // unless something else is moving things on (`moveOn` false), the usual
  // short wait before the next hole, with the card up to watch again.
  endFlyover({ moveOn = true } = {}) {
    const fo = this.flyover;
    if (!fo) return;
    this.flyover = null;
    // A clip of the round's highlights: on to the next.
    if (fo.reel) {
      this.nextClip();
      return;
    }
    // The last hole drawn again for its replay: back to this one.
    if (fo.lastHole) {
      this.backFromLastHole(fo);
      return;
    }
    for (const t of this.tracers?.list ?? []) {
      t.visible = true;
      t.userData.revealAll();
    }
    this.tracers?.restyle();
    this.ball.position.copy(fo.ball);
    this.camWant.copy(fo.camWant);
    this.lookWant.copy(fo.lookWant);
    // And back to that view with a cut too: cut short on the tee, it
    // would otherwise sweep the length of the hole back to the green.
    this.cutCamera();
    const r = this.round;
    if (moveOn && r?.done && !r.finished) {
      clearTimeout(this.nextTimer);
      this.nextTimer = setTimeout(() => {
        if (this.round !== r || this.flying || this.flyover || !r.done) return;
        if (this.isActive) this.moveOn();
        else this.moveOnWhenBack = true;
      }, this.paced(AFTER_FLYOVER * 1000));
      this.showOffer();
    }
    this.render();
  }
}
