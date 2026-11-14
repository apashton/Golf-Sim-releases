// Online play on a course: the other bays' shots flown on this one's hole (tracers), waiting for the others, and taking in the game's state from the server (applyNet).
// Part of CourseMode (course.js), split out of it: these methods are
// added to CourseMode.prototype there and run with `this` the course.

import * as THREE from "three";
import { toWorld } from "../scenery.js";
import { makeShotTracer } from "../look/tracer.js";
import { disposeTree } from "../look/dispose.js";
import { tracerColour, drawnHeight } from "../sim/tracer.mjs";
import { startNow, flightSpeed, landedWords } from "../sim/netflights.mjs";
import { handicapStrokes, standingsFor, holeWords } from "../sim/formats.mjs";
import { waitingFor, waitingWords, notReady, readyToGo } from "../sim/netgame.mjs";
import { okPath } from "../sim/netpath.mjs";
import { BALL_R, PUTT_BALL_R } from "../course.js";

// The longest a friend's shot, flown here as it was struck, waits down here
// for its bay to say where it finished (seconds) - a bay lost mid-shot.
const PARKED_MAX = 8;

export class CourseNetFlights {
  // Online: another bay's shot as a tracer in their colour, like this
  // bay's own (so the flyover follows it too). revealed: drawn whole.
  addRemoteTracer(p, flight, putt, { revealed = false } = {}) {
    // Drawn as this bay's are (pathDrawn); their ball flies along it.
    const place = ([x, y, z]) => toWorld(x, y + BALL_R, z);
    const drawn = this.pathDrawn(flight.path, flight.air);
    const t = this.tracers.add(makeShotTracer(drawn, flight.air, place, { colour: tracerColour(this.round.players.indexOf(p)), putt: !!putt }));
    t.userData.tracerOf = p;
    t.userData.made = { drawn, air: flight.air };
    t.userData.putt = !!putt;
    if (revealed) t.userData.revealAll();
    return t;
  }

  // Online: whether a player here is about to swing - the ball at rest,
  // the hole not finished for this bay (the "after your shot" setting).
  toHitHere() {
    const r = this.round;
    return !!(r && !r.done && !r.finished && !r.waiting && !this.flying && this.me && !this.me.remote && !this.me.done);
  }

  // Online: the other bays' shots waiting here that fly now - together
  // once nothing of this bay's is in the air, or each as it comes, by the
  // Friends' shots setting (sim/netflights.mjs). Flights started together
  // are one group: what's said as they land waits for the last of them.
  startRemoteFlights() {
    const waiting = this.remoteFlights.map((q) => ({ pid: q.p.netId, released: !!q.released }));
    const due = (this.round?.players ?? []).filter((p) => p.remote && !p.done && !p.inFlight).length;
    const now = startNow({
      mode: this.settings.friendsShots,
      waiting,
      flying: [...this.remoteFlying, ...this.remoteParked].map((f) => ({ pid: f.p.netId })),
      ownFlying: !!this.flying,
      toHit: this.toHitHere(),
      due,
      gathered: this.gathered,
      // (A friend watched here: theirs flies at once - course/watch.js.)
      watch: this.watching?.netId ?? null,
    });
    if (!now.length) return;
    const group = { left: now.length, landed: [] };
    const starting = now.map((i) => this.remoteFlights[i]);
    this.remoteFlights = this.remoteFlights.filter((q) => !starting.includes(q));
    for (const next of starting) {
      const { p, flight, putt } = next;
      const mat = new THREE.MeshLambertMaterial({ color: p.colour, emissive: p.colour, emissiveIntensity: 0.45 });
      const ball = new THREE.Mesh(new THREE.SphereGeometry(putt ? PUTT_BALL_R : BALL_R, 16, 12), mat);
      ball.userData.near = putt ? 3 : 12;
      this.world.add(ball);
      const speed = flightSpeed(p.netId, this.remoteFlights.map((q) => ({ pid: q.p.netId })));
      this.remoteFlying.push({ ...next, ball, tracer: this.addRemoteTracer(p, flight, putt), elapsed: 0, index: 0, speed, group });
    }
    this.gathered = 0;
  }

  // A frame of the other bays' shots flying.
  stepRemoteFlight(dt) {
    // Held for friends still to play (the together setting), and how long.
    this.gathered = this.remoteFlights.length && !this.flying ? (this.gathered ?? 0) + dt : 0;
    if (this.remoteFlights.length) this.startRemoteFlights();
    // Down here, still to hear where it finished from its bay: not for
    // ever (a bay lost mid-shot) - finished without its words.
    for (const f of [...this.remoteParked]) {
      f.parked += dt;
      if (f.parked > PARKED_MAX) this.finishRemoteFlight(f);
    }
    for (const f of [...this.remoteFlying]) {
      f.elapsed += dt * f.speed;
      const path = f.flight.path;
      while (f.index < path.length - 1 && path[f.index + 1][3] <= f.elapsed) f.index++;
      const a = path[f.index];
      const b = path[Math.min(f.index + 1, path.length - 1)];
      const k = Math.min(1, Math.max(0, (f.elapsed - a[3]) / (b[3] - a[3] || 1)));
      const x = a[0] + (b[0] - a[0]) * k;
      const z = a[2] + (b[2] - a[2]) * k;
      toWorld(x, drawnHeight(f.tracer.userData.path, f.index, k) + (f.putt ? PUTT_BALL_R : BALL_R), z, f.ball.position);
      f.ball.scale.setScalar(Math.min(12, Math.max(1, f.ball.position.distanceTo(this.camera.position) / f.ball.userData.near)));
      f.tracer.userData.reveal(f.index, k);
      if (f.elapsed >= path.at(-1)[3]) this.endRemoteFlight(f);
    }
    // Waiting on the others: watch them (the middle of those in the air).
    const up = this.remoteFlying;
    if (this.round?.waiting && up.length) {
      this.lookWant.set(0, 0, 0);
      for (const f of up) this.lookWant.add(f.ball.position);
      this.lookWant.divideScalar(up.length);
    }
  }

  endRemoteFlight(f) {
    if (!this.remoteFlying.includes(f)) return;
    this.remoteFlying = this.remoteFlying.filter((g) => g !== f);
    f.tracer.userData.revealAll();
    // Flown as it was struck, and down here before its bay has said where
    // it finished: the ball waits where it came to rest for that (remoteLanded).
    if (!f.final) {
      f.parked = 0;
      this.remoteParked.push(f);
      return;
    }
    this.finishRemoteFlight(f);
  }

  // A friend's shot down and its words in: the ball gives way to their
  // marker, and what's said.
  finishRemoteFlight(f) {
    this.remoteParked = this.remoteParked.filter((g) => g !== f);
    this.world.remove(f.ball);
    f.ball.geometry.dispose();
    f.ball.material.dispose();
    // Still to fly: the marker waits for the last of this player's.
    if (![...this.remoteFlights, ...this.remoteFlying, ...this.remoteParked].some((q) => q.p === f.p)) f.p.inFlight = false;
    this.drawMarkers();
    // Where it finished - with the others that flew in with it, once the
    // last of them is down.
    f.group.landed.push({ name: f.p.name, text: f.text });
    if (--f.group.left === 0) {
      const words = landedWords(f.group.landed);
      if (words) this.onToast(words, f.group.landed.length > 1 ? 3500 : 2600);
    }
    // The last of them down: what was waiting for it (applyNet).
    if (!this.remoteFlights.length && !this.remoteFlying.length && !this.remoteParked.length && this.whenLanded) {
      const then = this.whenLanded;
      this.whenLanded = null;
      then();
    }
  }

  // Online: a friend's shot that's been flying here since it was struck
  // has landed at their bay - where it finished and its words (a shot or
  // holed with its swing, k): said as it comes down here, or now if it's
  // down already.
  remoteLanded(p, k, text) {
    const f = [...this.remoteFlying, ...this.remoteFlights, ...this.remoteParked].find((q) => q.p === p && q.k === k);
    if (!f) {
      if (text) this.onToast(`${p.name}: ${text}`, 2600);
      return;
    }
    f.text = text;
    f.final = true;
    if (this.remoteParked.includes(f)) this.finishRemoteFlight(f);
  }

  // Online: `then` once none of the other bays' shots is flying here or
  // waiting to - now, or as the last of them lands.
  afterRemoteFlights(then) {
    if (!this.remoteFlying.length && !this.remoteFlights.length && !this.remoteParked.length) return then();
    this.whenLanded = then;
  }

  // A new hole (or round): the other bays' flights still to show go.
  clearRemoteFlights() {
    this.whenLanded = null;
    // (Watching a friend ends with the hole: course/watch.js.)
    if (this.watching) {
      this.watching = null;
      this.renderWatch();
    }
    for (const f of [...this.remoteFlying, ...this.remoteParked]) {
      this.world?.remove(f.ball);
      // (Each ball its own shape and colour: freed with it.)
      disposeTree(f.ball);
    }
    this.remoteFlying = [];
    this.remoteParked = [];
    this.remoteFlights = [];
    this.gathered = 0;
    for (const p of this.round?.players ?? []) p.inFlight = false;
  }

  // Online, on to the next hole together (the owner: "people move on to
  // the next hole at the same time and can't skip on to the next hole when
  // the other one's not finished ... it needs to be a joint thing"): asked
  // to go on from a finished hole - Next hole, the scorecard's or the cart
  // ride's time up, a shot - this bay says it's ready, and goes once every
  // bay is (sim/netgame.mjs readyToGo; applyNet goes on). True while it
  // waits, the card staying up saying who for.
  holdForOthers() {
    const r = this.round;
    if (!r?.net || !r.done || r.index < 0 || r.onlyHole != null || r.index + 1 >= this.course.holes.length) return false;
    if (r.readyFor !== r.index) {
      r.readyFor = r.index;
      r.readyAt = Date.now();
      this.netSend?.({ type: "ready", bay: r.net.bay, hole: r.index });
    }
    if (!this.netGame || readyToGo(this.netGame, r.index, r.net.bay)) {
      r.holding = false;
      return false;
    }
    r.holding = true;
    this.showHolding();
    return true;
  }

  // Who it's waiting for to go on ("Waiting for Sam to be ready"), or null
  // when it isn't.
  holdingWords() {
    const r = this.round;
    if (!r?.holding || !this.netGame) return null;
    const names = notReady(this.netGame, r.index, r.net.bay);
    return names.length ? `${waitingWords(names)} to be ready` : "Ready - going on...";
  }

  // Said where the next hole's asked for: the scorecard's button, the cart's
  // screen, the command centre's - or, with no card up, the round's line.
  showHolding() {
    const words = this.holdingWords();
    if (!words) return;
    const b = this.holeCard?.el.querySelector("button[data-act=next]");
    if (b) {
      b.disabled = true;
      b.textContent = words;
    }
    if (this.ride) this.updateRideCard();
    else this.renderBetween();
    if (!this.holeCard && !this.ride) {
      this.round.message = words;
      this.render();
    }
  }

  // Online: this bay's players have all finished the hole but others
  // haven't - say so and wait (applyNet moves on). True when waiting.
  waitForOthers() {
    const r = this.round;
    if (!r?.net || r.done || !r.players.every((q) => q.remote || q.done)) return false;
    r.waiting = true;
    r.pending = false;
    r.message = waitingWords(waitingFor(this.netGame, r.index, r.net.bay));
    this.render();
    return true;
  }

  // Online: the game as the host has it now (netplay.js) - where the other
  // bays' balls are on this hole, their finished holes' scores, and on
  // once everyone has finished. quiet: no toasts (a new hole catching up).
  applyNet(game, { quiet = false } = {}) {
    const r = this.round;
    if (!r?.net || !game?.round || game.round.id !== r.id) return;
    this.netGame = game;
    let moved = false;
    for (const p of r.players) {
      if (!p.remote) continue;
      const q = game.players.find((x) => x.id === p.netId);
      const prog = game.progress?.[p.netId] ?? [];
      prog.forEach((at, h) => {
        if (at?.done) p.scores[h] = at.score;
      });
      const at = prog[r.index];
      const dropped = !!q?.dropped;
      // A shot of theirs as it was struck (a flying event): flown here now
      // in their colour - where it finished, and the words, come with the
      // shot or holed that follows (remoteLanded), not flown again then.
      const air = at?.air;
      if (!quiet && air && air.k > (p.netAir ?? 0) && okPath(air.flight)) {
        p.netAir = air.k;
        p.inFlight = true;
        this.remoteFlights.push({ p, k: air.k, flight: air.flight, putt: air.putt, text: null, final: false, released: !!this.flying });
      }
      if (at && (at.seq ?? 0) > (p.netSeq ?? 0)) {
        p.netSeq = at.seq;
        p.strokes = at.strokes;
        if (Array.isArray(at.ball)) p.ball = at.ball;
        p.lie = at.done ? "cup" : at.lie;
        p.done = !!at.done;
        moved = true;
        // Its flight: flown here in their colour, with its tracer (after
        // any shot of this bay's in the air) - the toast when it lands.
        // Catching up on a new hole, just its tracer. Already flying here
        // since it was struck: its words, for when it's down.
        if (!quiet && at.k != null && at.k <= (p.netAir ?? 0)) {
          this.remoteLanded(p, at.k, at.text);
        } else if (okPath(at.flight)) {
          if (quiet) this.addRemoteTracer(p, at.flight, at.putt, { revealed: true });
          else {
            p.inFlight = true;
            if (at.k != null) p.netAir = at.k;
            // (Arriving while a ball of this bay's is in the air: shown
            // once it lands, whoever's next here.)
            this.remoteFlights.push({ p, k: at.k, flight: at.flight, putt: at.putt, text: at.text, final: true, released: !!this.flying });
          }
        } else if (!quiet && at.text) {
          // A move with no flight (a ball called unplayable and dropped)
          // while their last shot is still to land here: said as that one
          // lands, so it isn't told before the shot it follows is seen.
          const held = [...this.remoteParked, ...this.remoteFlying, ...this.remoteFlights].filter((f) => f.p === p).at(-1);
          if (held) held.text = held.text ? `${held.text}; ${at.text}` : at.text;
          else this.onToast(`${p.name}: ${at.text}`, 2600);
        }
      }
      if (dropped && !p.done) {
        p.done = true;
        moved = true;
      }
    }
    // A scramble: the team balls as every bay has them; a bay waiting on
    // another's teammate or captain plays on once they have.
    if (r.scr) {
      this.scrambleNet();
      moved = true;
      if (!r.done && !r.pending && !this.flying && !r.players.every((q) => q.done)) {
        const was = r.turn;
        const waited = r.waiting;
        const next = this.whoseTurn();
        if (r.scrWait) {
          r.waiting = true;
          r.message = this.scrambleWaitWords();
          this.render();
        } else if (waited || next !== was || (r.pick != null && this.pickEl.hidden)) {
          r.waiting = false;
          this.passTurn(true);
        }
      }
    }
    if (moved) this.drawMarkers();
    // Everyone's finished the hole: on (after a moment to see the scores) -
    // once the other bays' last shots have landed here, so the putt that
    // finished the hole is seen to drop before what the hole meant is said
    // and the next hole comes.
    if (!r.done && r.players.every((q) => q.done)) {
      r.done = true;
      r.waiting = false;
      r.message = "";
      this.afterRemoteFlights(() => {
        if (this.round !== r) return;
        const g = this.game();
        const words = g.shown ? holeWords(r.format, r.players, g.holes, g.hs, r.index, r.teamOf) : null;
        if (words && !quiet) this.onToast(words, 4500);
        clearTimeout(this.nextTimer);
        this.nextTimer = setTimeout(() => {
          if (this.round !== r || this.flying) return;
          if (this.isActive) this.moveOn();
          else this.moveOnWhenBack = true;
        }, this.paced(3500));
      });
    } else if (r.waiting) {
      r.message = waitingWords(waitingFor(game, r.index, r.net.bay));
    }
    // Ready and waiting for the others to go on together: on once they all
    // are - else who for still (and said again if the host never heard,
    // the connection lost a while).
    if (r.done && r.holding) {
      if (readyToGo(game, r.index, r.net.bay)) return this.nextHole();
      if ((game.ready?.[r.net.bay] ?? -1) < r.index && Date.now() - (r.readyAt ?? 0) > 5000) {
        r.readyAt = Date.now();
        this.netSend?.({ type: "ready", bay: r.net.bay, hole: r.index });
      }
      this.showHolding();
    }
    this.render();
  }

  // The game with friends (sim/formats.mjs): each player's handicap
  // strokes, and the standings from the scores so far. shown: worth
  // showing over the plain totals (a game other than stroke play, or
  // handicaps making it net).
  game() {
    const r = this.round;
    // A match ladder's match at the bay: its own holes and strokes
    // (course/matchladder.js).
    if (r?.ladder && !r.ladder.bot && r.players.length === 2) return this.ladderGame();
    // (Each hole's length from the round's tees: the course's rating with it.)
    const holes = this.course.holes.map((h, i) => ({ par: h.spec.par, yards: this.yardsOf(i), si: Number.isFinite(h.spec.si) ? h.spec.si : null }));
    const hs = handicapStrokes(r.players, holes, { on: r.handicaps, format: r.format });
    const st = standingsFor(r.format, r.players, holes, hs, r.teamOf);
    const shown = this.multi && (r.format !== "stroke" || hs.some((x) => x.courseHandicap != null));
    return { holes, hs, st, shown };
  }
}
