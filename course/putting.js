// Putting guidance on a course's green: getting a putt ready, the ideal line, the putt lines, the flag and the distance markers; the green's grid and slope shading.
// Part of CourseMode (course.js), split out of it: these methods are
// added to CourseMode.prototype there and run with `this` the course.

import { playsLike } from "../sim/weather.mjs";
import * as THREE from "three";
import { distanceToPin } from "../sim/courseplay.mjs";
import { FOOT } from "../sim/putting.mjs";
import { GreenGrid, slopeShade } from "../greengrid.js";
import { distanceMarks, COURSE_MARKERS, slopeSmoothing } from "../sim/greenread.mjs";
import { setFlagLook, toWorld } from "../scenery.js";
import { flagFor, flagLook } from "../sim/flagstick.mjs";
import { grainWords } from "../sim/rolls.mjs";
import { clearGroup } from "../look/dispose.js";
import { clearOfTrees } from "../view.js";
import { courseGreen, lineFiguresSteps, lineText, feedbackText, idealLineSteps, idealText, Stepper } from "../sim/puttguide.mjs";
import { roughPutt } from "../sim/puttread.mjs";
import { holeProbe } from "../sim/holesite.mjs";
import { offload, canOffload } from "../look/offload.js";
import { puttLine } from "../puttline.js";
import { readsWords } from "../sim/netrules.mjs";
import { BALL_R, PUTT_BALL_R } from "../course.js";

// How long a putt's read is waited for from another core before it's
// worked out here after all (ms).
const READ_WAIT = 15_000;

export class CoursePutting {
  // On the green: the line from the ball to the cup as figures (how much
  // uphill or downhill, what it plays like) and the ideal line, kept by
  // where they're from - the figures first. Worked out on another core
  // (sim/puttread.mjs) where there is one, else a little each frame here
  // (update). (Worked out all at once, the figures stopped the picture for
  // most of a second on a phone as each ball came onto the green; a
  // little each frame, every frame there was held up for some seconds -
  // each try is a whole roll.) Off the green, none - unless the putter's
  // picked there (course.js putting): read rolling over its grass first
  // (sim/puttguide.mjs courseGreen).
  preparePutt() {
    const r = this.me;
    this.puttGuide = null;
    if (!r || r.done || !this.putting || this.round.done) {
      this.sections.setPutt(null);
      this.drawIdeal();
      return;
    }
    const hole = this.hole;
    const key = [this.course.id, this.round.index, r.ball[0].toFixed(3), r.ball[1].toFixed(3), hole.green.stimp].join(":");
    const known = this.ideals.get(key);
    const cg = known?.cg ?? courseGreen(hole, r.ball);
    const guide = known ?? { key, cg, fig: null, ideal: null };
    guide.from = [...r.ball];
    guide.struck = false;
    if (!(guide.fig && guide.ideal) && !guide.away?.length) this.readPutt(guide, r.ball);
    this.ideals.set(key, guide);
    this.puttGuide = guide;
    this.drawIdeal();
    // The line to look along a section at a time, in the putt's own frame
    // (heights from the hole's green); back to the view behind the ball,
    // wherever that is when it's asked for; never in a tree or a bank.
    this.sections.setPutt({
      green: cg.green,
      distance: cg.distance,
      toWorld: (x, y, z, out) => {
        const [hx, hz] = cg.toHole(x, z);
        return toWorld(hx, y, hz, out);
      },
      address: () => ({ position: this.camWant.clone(), look: this.lookWant.clone() }),
      adjust: (position, look) => {
        this.keepAboveGround(position, 0.8);
        clearOfTrees(this.cameraTrees, position, look);
      },
    });
  }

  // The putt's read set going (preparePutt): on another core where it can
  // be - the figures and then the ideal line, each back as it's done
  // (stepIdeal) - else here, a little each frame.
  readPutt(guide, ball) {
    const hole = this.hole;
    const site = canOffload() ? this.offloadSite() : null;
    guide.away = null;
    if (site) {
      const probe = holeProbe((x, z) => this.heightAt(x, z), (x, z) => hole.lieAt(x, z), hole.layout);
      const ask = { site, probe, ball: [...ball], cup: { x: hole.cup.x, z: hole.cup.z, r: hole.cup.r }, stimp: hole.green.stimp };
      guide.away = [];
      if (!guide.fig) guide.away.push({ part: "fig", job: offload("puttRead", { part: "figures", ...ask }, { quick: true }) });
      if (!guide.ideal) guide.away.push({ part: "ideal", job: offload("puttRead", { part: "ideal", ...ask }, { quick: true }) });
      guide.until = performance.now() + READ_WAIT;
    }
    this.readHere(guide);
  }

  // The read's parts not on their way from another core worked out here,
  // a little each frame.
  readHere(guide) {
    const { cg } = guide;
    const away = (part) => guide.away?.some((a) => a.part === part);
    guide.figJob = guide.fig || away("fig") ? null : (guide.figJob ?? new Stepper(lineFiguresSteps(cg.green, cg.distance)));
    guide.job = guide.ideal || away("ideal") ? null : (guide.job ?? new Stepper(idealLineSteps(cg.green, cg.distance, { holeRadius: this.hole.cup.r })));
  }

  // The read's parts from another core taken in as they come back - any
  // that couldn't be done there (no core after all, a hole that wasn't
  // this one, too long in coming) worked out here instead.
  takeRead(g) {
    let took = false;
    const late = performance.now() > g.until;
    for (const a of [...g.away]) {
      if (!a.job.done && !late) continue;
      g.away.splice(g.away.indexOf(a), 1);
      const ok = a.job.done && !a.job.error;
      if (!ok && a.job.error && !["no worker", "worker stopped"].includes(a.job.error.message)) console.warn("The putt's read was worked out on the page instead:", a.job.error);
      if (ok && a.part === "fig") g.fig ??= a.job.value;
      if (ok && a.part === "ideal") g.ideal ??= a.job.value;
      took ||= ok;
      if (!ok) this.readHere(g);
    }
    if (!took) return;
    if (g.ideal) {
      this.drawIdeal();
      this.render();
    }
    this.onChange?.();
  }

  // A little more of the figures' and then the ideal line's search, each
  // frame, until they're done; the words over the picture follow.
  stepIdeal() {
    const g = this.puttGuide;
    if (g?.away?.length) this.takeRead(g);
    if (g?.figJob) {
      if (!g.figJob.run(4)) return;
      g.fig = g.figJob.value;
      g.figJob = null;
      this.onChange?.();
      return;
    }
    if (!g?.job) return;
    if (!g.job.run(4)) return;
    g.ideal = g.job.value;
    g.job = null;
    this.drawIdeal();
    this.render();
    this.onChange?.();
  }

  // The steady test putt here, { speedMph, hla } (sim/courseplay.mjs
  // readPutt: the same ideal line), from the putt's own read: until that's
  // there, straight at the hole at what it plays like (sim/puttread.mjs
  // roughPutt: { feet, hla, rough }) once the figures are in - or, with
  // now (a swing's begun), at its distance even before them - else null.
  // Never the read finished at once: on a phone that held the swing up
  // for seconds. The swing pad's flag mark.
  plannedPutt({ now = false } = {}) {
    const g = this.puttGuide;
    if (!g || g.struck || !this.putting || this.flying) return null;
    if (g.ideal) return { speedMph: g.ideal.speedMph, hla: g.ideal.hla };
    return g.fig || now ? roughPutt(g.fig, g.cg.distance) : null;
  }

  // The read's ideal line if it's in, for a test putt from this ball (else
  // the test putt reads it itself).
  puttIdealNow(ball) {
    const g = this.puttGuide;
    if (!g?.ideal || g.struck || g.from[0] !== ball[0] || g.from[1] !== ball[1]) return null;
    return g.ideal;
  }

  // The putt's figures now, finished at once if they're still being
  // worked out (the putt's been struck before they were) - or, still on
  // their way from another core, worked out here.
  puttFigures() {
    const g = this.puttGuide;
    if (!g) return null;
    if (g.away?.length) this.takeRead(g);
    if (!g.fig && g.away?.some((a) => a.part === "fig")) {
      g.away = g.away.filter((a) => a.part !== "fig");
      this.readHere(g);
    }
    if (g.figJob) {
      g.fig = g.figJob.finish();
      g.figJob = null;
    }
    return g.fig;
  }

  // Whether the ideal line shows: before the putt with the setting at
  // "before and after"; after it, at either.
  get idealShowing() {
    const g = this.puttGuide;
    if (!g?.ideal || puttLine.level === "off") return false;
    if (g.struck) return !this.flying;
    // Online with line reads counted: before the putt only once one's been
    // spent on it (T), whatever the setting.
    if (this.me?.reads) return this.me.reads.at === g.key && !this.flying && !this.me.done;
    return puttLine.level === "always" && !this.flying && !this.me?.done;
  }

  // The ideal line on the green: a dashed line from the ball into the cup,
  // and a bead level with the hole where to aim to start it on it.
  drawIdeal() {
    if (!this.idealGroup) return;
    clearGroup(this.idealGroup);
    const g = this.puttGuide;
    if (!this.idealShowing || !g.ideal.path.length) return;
    const lift = (x, z) => this.heightAt(x, z) + 0.01;
    const pts = g.ideal.path.map(([x, z]) => {
      const [hx, hz] = g.cg.toHole(x, z);
      return toWorld(hx, lift(hx, hz), hz);
    });
    // See-through (though it isn't), so it's drawn with the tracers and
    // after them: over the putts' lines left on the green, not under.
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.1, gapSize: 0.07, transparent: true }));
    line.computeLineDistances();
    line.renderOrder = 3;
    this.idealGroup.add(line);
    const [ax, az] = g.cg.toHole(g.cg.distance, g.ideal.aim);
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), new THREE.MeshBasicMaterial({ color: 0x4cc9f0 }));
    toWorld(ax, lift(ax, az) + 0.02, az, bead.position);
    this.idealGroup.add(bead);
  }

  // The guide lines for the green: the slope and plays-like before a putt,
  // how the last putt's pace compared after it (always), and the ideal
  // line with it on.
  puttLines() {
    const p = this.me;
    const r = this.round;
    if (!p || !r?.hole || r.finished) return [];
    const g = this.puttGuide;
    const lines = [];
    // What it plays like only with that help on (puttline.js): otherwise
    // the pace is the player's to judge, and said after the putt.
    if (g?.fig && !p.done) lines.push(lineText(g.fig, { playsLike: puttLine.playsLike }));
    // Which way the green's grain runs along this putt (sim/rolls.mjs).
    if (g && !p.done && !g.struck && this.hole?.green.grain) lines.push(`Grain: ${grainWords(this.hole.green.grain, g.cg.heading)}`);
    // Online with line reads counted: how many are left, before the putt.
    if (g && !p.done && !g.struck && p.reads) lines.push(readsWords(p.reads, g.key));
    if (p.puttFeedback && !this.flying) lines.push(feedbackText(p.puttFeedback));
    if (this.idealShowing) lines.push(idealText(g.ideal));
    // Looking from a stop along the line: where it is, its heights, its slope.
    if (!this.flying) lines.push(...this.sections.lines());
    return lines;
  }

  // The putter picked off the green, or put away again (course.js
  // setClub): set up for the putt as on the green - its read and ideal
  // line, the flag, the others' balls putting-size, the low view behind
  // the ball - or for the shot again. (The grid and the slope shading stay
  // the green's own: course/holescenery.js.)
  puttingChanged() {
    this.showFlag();
    this.drawMarkers();
    this.showGrid();
    this.showShade();
    this.preparePutt();
    this.placeCamera(false);
  }

  // The grid over the green, while it's read (course.js greenRead:
  // putting, on the green or off it, or on the fringe with any club):
  // squared to the line from the ball to the hole, or (alongAim) to the
  // aim - the aim turned and left there a moment (sim/greenread.mjs
  // regridDue).
  showGrid({ alongAim = false } = {}) {
    if (this.grid) {
      this.world.remove(this.grid.group);
      this.grid.dispose();
      this.grid = null;
    }
    if (!this.greenRead || !this.settings.grid) return;
    // Squared to the putt, from the ball towards the hole, and big enough to
    // cover the whole green whichever way that points.
    const L = this.hole.layout;
    const r = this.me;
    const ball = toWorld(r.ball[0], 0, r.ball[1]);
    const toCup = Math.hypot(this.hole.cup.x - r.ball[0], this.hole.cup.z - r.ball[1]) || 1;
    const cup = alongAim ? toWorld(r.ball[0] + Math.cos(r.aim) * toCup, 0, r.ball[1] + Math.sin(r.aim) * toCup) : toWorld(this.hole.cup.x, 0, this.hole.cup.z);
    this.gridAim = r.aim;
    this.aimTurnedAt = performance.now();
    const g = toWorld(L.green.x, 0, L.green.z);
    const reach = Math.hypot(g.x - ball.x, g.z - ball.z) + Math.max(L.green.rx, L.green.rz) + 1;
    this.grid = new GreenGrid({
      heightAt: this.worldHeight,
      gradientAt: this.worldGradient,
      inside: (wx, wz) => this.hole.onGreen(-wz, wx),
      bounds: { x0: -reach, x1: reach, z0: -reach, z1: reach },
      origin: [ball.x, ball.z],
      toward: [cup.x, cup.z],
      stimp: this.settings.stimp,
      // A distance mark every 5 ft to the hole, then every 10.
      marks: distanceMarks(distanceToPin(this.hole, r.ball) / FOOT),
      // Markers only along the putt: over a whole green they speckled it
      // everywhere, faint as each one was. On real ground each reads the
      // slope smoothed over a couple of metres, so it shows the way the
      // green falls rather than the survey's roughness (sim/greenread.mjs).
      keep: COURSE_MARKERS,
      smooth: slopeSmoothing(this.hole.green.terrain?.cell),
      // Coloured by how steep, or plain (puttline.js gridColours).
      colours: () => puttLine.gridColours,
    });
    this.world.add(this.grid.group);
  }

  // The green tinted by how steep it is (greengrid.js slopeShade), while
  // it's read (greenRead) and the setting's on: made the first time it's
  // wanted on a hole, and kept with it.
  showShade() {
    const on = !!this.settings.shade && this.greenRead;
    if (on && !this.shade && this.hole) {
      const g = this.hole.layout.green;
      const r = Math.max(g.rx ?? 0, g.rz ?? 0, 8) + 1.5;
      // The green's box, world terms (hole frame x down, z right -> world z, -x).
      const bounds = { x0: g.z - r, x1: g.z + r, z0: -g.x - r, z1: -g.x + r };
      const cell = Math.max(0.3, (2 * r) / 120);
      this.shade = slopeShade({ heightAt: this.worldHeight, gradientAt: this.worldGradient, inside: (wx, wz) => this.hole.onGreen(-wz, wx), bounds, cell });
      this.world.add(this.shade);
    }
    if (this.shade) {
      this.shade.visible = on;
      // Faint beyond this putt's channel, as the grid is.
      if (on) {
        const r = this.me;
        const ball = r?.ball ? toWorld(r.ball[0], 0, r.ball[1]) : null;
        const cup = toWorld(this.hole.cup.x, 0, this.hole.cup.z);
        this.shade.userData.setChannel(ball ? [ball.x, ball.z] : null, [cup.x, cup.z]);
      }
    }
  }

  // The flag for the player to play (sim/flagstick.mjs): in for a shot
  // from off the green, and for a putt from beyond 15 ft until it's
  // struck; not there at all for a putt from closer in. `struck`: the shot
  // has just been played, so a pulled flag starts lifting out (update).
  showFlag(struck = false) {
    const p = this.me;
    if (!p?.ball || !this.hole) return;
    this.flagPlan = flagFor({ putting: this.putting, distance: distanceToPin(this.hole, p.ball) });
    this.flagSince = struck && this.flagPlan === "pulled" ? 0 : null;
    setFlagLook(this.flag, flagLook(this.flagPlan, this.flagSince));
  }

  // The other players' balls: a small ball in each one's colour where it
  // lies, on a thin stick with a bead on top so it can be picked out from
  // down the fairway. Putting, with the camera down by the ball, just the
  // ball, putting-size, so nothing stands in the line - and the ball alone
  // for a friend watched from behind it (course/watch.js). Nobody's marker
  // shows before they've teed off, or once they've finished.
  drawMarkers() {
    if (!this.markers) return;
    for (const m of this.markers.children) m.traverse((o) => (o.geometry?.dispose(), o.material?.dispose()));
    this.markers.clear();
    const r = this.round;
    if (!this.multi) return;
    const green = this.putting;
    r.players.forEach((p, i) => {
      // (Another bay's ball still flying is drawn as it flies.)
      if (i === r.turn || p.done || !p.strokes || p.inFlight) return;
      // A scramble: a ball each for the shots hit from the team's ball,
      // one for the team's ball itself.
      if (r.scr && !this.scrambleMarker(i)) return;
      const mat = new THREE.MeshLambertMaterial({ color: p.colour, emissive: p.colour, emissiveIntensity: 0.35 });
      const rad = green ? PUTT_BALL_R : BALL_R;
      const g = new THREE.Group();
      const bead = new THREE.Mesh(new THREE.SphereGeometry(rad, 16, 12), mat);
      bead.position.y = rad;
      bead.castShadow = true;
      // Kept about the same size on screen as the camera moves (update):
      // only where it stands redraws the shadow map (look/shadowwatch.js).
      bead.userData.shadowLoose = true;
      bead.userData.shadowNear = true;
      g.add(bead);
      if (!green && p !== this.watching) {
        const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.4, 6), mat);
        stick.position.y = 0.7;
        const top = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), mat);
        top.position.y = 1.45;
        g.add(stick, top);
      }
      toWorld(p.ball[0], this.heightAt(...p.ball), p.ball[1], g.position);
      // How near it keeps its size from (see update): a ball on the green
      // has to show from across it.
      g.userData.near = green ? 3 : 12;
      this.markers.add(g);
    });
  }
}
