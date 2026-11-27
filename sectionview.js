// Looking along a putt's line a section at a time, on the putting green and
// the course's greens (the owner: "allow the user to view the putt from
// 25% 50% 75% etc. so that they can visualise each section"). The key (I),
// or the buttons in the panel, step the camera from behind the ball to 25%,
// 50% and 75% of the way, behind the hole looking back, side-on to the
// whole line, and back (sim/greenread.mjs STOPS and sectionPose), moving
// smoothly between them. At each stop: the section's figures for the guide
// lines, a yellow line along the putt on the green with a ring where the
// view stands, and the line's profile - small in the panel always, big over
// the picture while looking from a stop.
//
// The mode gives it the putt (setPutt): the green and the distance in the
// putting frame, how to take a point of that frame into the world, and its
// own view behind the ball to come back to. Each frame, drive() moves or
// holds the camera and says whether it did; when it didn't, the mode's own
// camera is in charge as before.

import * as THREE from "three";
import { STOPS, getStopsForDistance, stepStop, sectionPose, sectionFigures, sectionLines, lineProfile, profileSvg, moveTime, moveEase, moveArc } from "./sim/greenread.mjs";
import { greenHeight } from "./sim/putting.mjs";
import { Ribbons, ribbonMaterial, PLAIN } from "./greengrid.js";
import { esc } from "./util.js";

// The page's yellow (the accent): the line being looked along, and where
// the view stands on it - here and on the profile.
const YELLOW = 0xffd23f;

export class SectionView {
  // camera: the mode's. view: the picture's element, for the big profile.
  constructor({ camera, view = null }) {
    this.camera = camera;
    this.stop = 0;
    this.putt = null;
    this.move = null;
    this.hold = null;
    this.look = new THREE.Vector3();
    this.active = true;
    this.onChange = () => {};
    this.onPick = () => {};
    // The line and the ring, on the green while looking from a stop.
    this.group = new THREE.Group();
    this.group.visible = false;
    this.big = null;
    if (view && typeof document !== "undefined") {
      this.big = document.createElement("div");
      this.big.className = "green-profile";
      this.big.hidden = true;
      view.appendChild(this.big);
    }
    this.panelEl = null;
  }

  // Into the mode's world, which is built afresh for each green or hole.
  attach(world) {
    world.add(this.group);
  }

  // The putt to look along, or null (none: off the green, the hole over).
  //   green, distance   the putting frame (sim/putting.mjs): the ball at the
  //                     origin, the hole `distance` metres along +x
  //   toWorld(x, y, z, out)  a point of that frame (y a height) in the world
  //   address()         the mode's own view behind the ball: { position, look }
  //   adjust(position, look)  optional: keeps a camera spot clear (the course's
  //                     trees and hills)
  // Always starts behind the ball.
  setPutt(putt) {
    this.putt = putt;
    this.stop = 0;
    this.move = null;
    this.hold = null;
    this.figures = new Map();
    this.profile = putt ? lineProfile(putt.green, putt.distance, { n: 64 }) : null;
    this.build();
    this.render();
  }

  // Looking from a stop, or on the way to or from one.
  get showing() {
    return this.stop !== 0 || !!this.move;
  }

  // The next stop (or the one before, with delta -1). The stop it goes to,
  // or null with no putt to look along.
  step(delta = 1) {
    if (!this.putt) return null;
    this.go(stepStop(this.stop, delta, this.putt.distance));
    return this.putt ? getStopsForDistance(this.putt.distance)[this.stop] : STOPS[this.stop];
  }

  // Moves smoothly to a stop from wherever the camera is now.
  go(stop) {
    const stops = this.putt ? getStopsForDistance(this.putt.distance) : STOPS;
    if (!this.putt || stop < 0 || stop >= stops.length) return;
    if (stop === this.stop && !this.move) return;
    const to = this.poseFor(stop);
    this.camera.updateMatrixWorld();
    const from = { position: this.camera.position.clone(), ...angles(this.camera.getWorldDirection(new THREE.Vector3())) };
    const towards = to.look.clone().sub(to.position);
    const metres = from.position.distanceTo(to.position);
    this.move = { from, to: { ...to, ...angles(towards) }, t: 0, duration: moveTime(metres), metres };
    this.stop = stop;
    this.hold = stop === 0 ? null : to;
    this.build();
    this.render();
    this.onChange();
  }

  // Straight back behind the ball, with no move: a putt has been struck
  // (the mode puts its own camera back).
  reset() {
    if (!this.showing) return;
    this.stop = 0;
    this.move = null;
    this.hold = null;
    this.build();
    this.render();
    this.onChange();
  }

  // The camera at a stop, worked out again (the picture changed shape).
  refresh() {
    if (!this.putt || !this.hold || this.move) return;
    this.hold = this.poseFor(this.stop);
  }

  // Each frame: moves the camera between stops, or holds it at one. True
  // while it has the camera; false behind the ball with no move going,
  // when the mode's own camera is in charge.
  drive(dt) {
    const m = this.move;
    if (m) {
      m.t += dt;
      const k = moveEase(m.t, m.duration);
      this.camera.position.lerpVectors(m.from.position, m.to.position, k);
      this.camera.position.y += moveArc(k, m.metres);
      // Turning as it goes: round and up or down, never rolling.
      let dYaw = m.to.yaw - m.from.yaw;
      dYaw = Math.atan2(Math.sin(dYaw), Math.cos(dYaw));
      const yaw = m.from.yaw + dYaw * k;
      const pitch = m.from.pitch + (m.to.pitch - m.from.pitch) * k;
      const far = m.from.far + (m.to.far - m.from.far) * k;
      this.look.set(Math.cos(pitch) * Math.sin(yaw), Math.sin(pitch), Math.cos(pitch) * Math.cos(yaw)).multiplyScalar(far).add(this.camera.position);
      this.camera.lookAt(this.look);
      if (m.t >= m.duration) {
        this.move = null;
        if (this.stop === 0) {
          // Home: exactly the mode's own view again.
          const a = this.putt.address();
          this.camera.position.copy(a.position);
          this.look.copy(a.look);
          this.camera.lookAt(this.look);
          this.render();
        }
      }
      return true;
    }
    if (this.stop === 0 || !this.hold) return false;
    this.camera.position.copy(this.hold.position);
    this.look.copy(this.hold.look);
    this.camera.lookAt(this.look);
    return true;
  }

  // Where the camera stands and looks at a stop, in the world.
  poseFor(stop) {
    if (stop === 0) {
      const a = this.putt.address();
      return { position: a.position.clone(), look: a.look.clone() };
    }
    const { green, distance } = this.putt;
    const p = sectionPose(stop, { green, distance, fovDeg: this.camera.fov, aspect: this.camera.aspect || 16 / 9 });
    const position = this.putt.toWorld(p.cam[0], p.cam[1], p.cam[2], new THREE.Vector3());
    const look = this.putt.toWorld(p.look[0], p.look[1], p.look[2], new THREE.Vector3());
    this.putt.adjust?.(position, look);
    return { position, look };
  }

  // The figures at the stop being looked from (sim/greenread.mjs), kept.
  figuresAt(stop = this.stop) {
    if (!this.putt) return null;
    if (!this.figures.has(stop)) this.figures.set(stop, sectionFigures(this.putt.green, this.putt.distance, stop));
    return this.figures.get(stop);
  }

  // What's said at this stop, for the guide lines (none behind the ball).
  lines() {
    if (!this.putt || this.stop === 0) return [];
    return sectionLines(this.figuresAt());
  }

  // The yellow line along the putt, from just in front of the ball to the
  // edge of the cup, and a ring on it where the view stands: on the green
  // while looking from a stop. One draw.
  build() {
    for (const o of this.group.children) o.geometry.dispose();
    this.group.clear();
    this.group.visible = !!this.putt && this.stop !== 0;
    if (!this.putt || this.stop === 0) return;
    const { green, distance, toWorld } = this.putt;
    const at = (x, z) => toWorld(x, greenHeight(green, x, z) + 0.012, z, new THREE.Vector3()).toArray();
    const r = new Ribbons();
    const from = Math.min(0.04, distance / 4);
    const to = Math.max(from + 0.01, distance - 0.075);
    const n = Math.max(2, Math.ceil((to - from) / 0.1));
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push(at(from + ((to - from) * i) / n, 0));
    r.add(pts, PLAIN);
    const stops = this.putt ? getStopsForDistance(this.putt.distance) : STOPS;
    const f = stops[this.stop].f;
    if (f != null && f < 1) {
      const cx = f * distance;
      const ring = [];
      for (let i = 0; i <= 40; i++) {
        const a = (i / 40) * Math.PI * 2;
        ring.push(at(cx + Math.cos(a) * 0.22, Math.sin(a) * 0.22));
      }
      r.add(ring, PLAIN);
    }
    const mesh = r.mesh(ribbonMaterial(YELLOW, { widthPx: 3 }));
    mesh.renderOrder = 3;
    this.group.add(mesh);
  }

  // The panel's part: a button for each stop and the profile. `pick(stop)`
  // is the mode's say on a button (it knows whether now's the time).
  panel(el, pick) {
    this.panelEl = el;
    this.onPick = pick;
    if (!el) return;
    el.innerHTML = `
      <h3>The line <small>(I steps through, Shift + I back)</small></h3>
      <div class="line-stops">${(this.putt ? getStopsForDistance(this.putt.distance) : STOPS).map((s, i) => `<button data-stop="${i}" title="${esc(s.name)}">${esc(s.label)}</button>`).join("")}</div>
      <div class="line-profile"></div>`;
    for (const b of el.querySelectorAll("[data-stop]")) {
      b.addEventListener("click", (e) => {
        // A button mustn't keep the keyboard: Space would press it again.
        e.currentTarget.blur();
        this.onPick(Number(b.dataset.stop));
      });
    }
    this.render();
  }

  // Shown or hidden with the mode.
  setActive(on) {
    this.active = on;
    this.render();
  }

  // The panel's buttons and profile, and the big profile over the picture.
  render() {
    const el = this.panelEl;
    if (el) {
      el.hidden = !this.putt;
      for (const b of el.querySelectorAll("[data-stop]")) b.classList.toggle("active", Number(b.dataset.stop) === this.stop);
      const box = el.querySelector(".line-profile");
      if (box) box.innerHTML = this.profile ? profileSvg(this.profile, { stop: this.stop, distance: this.putt.distance }) : "";
    }
    if (this.big) {
      const show = this.active && !!this.putt && this.stop !== 0;
      this.big.hidden = !show;
      if (show) this.big.innerHTML = profileSvg(this.profile, { stop: this.stop, width: 640, height: 230, big: true, distance: this.putt.distance });
    }
  }
}

// Which way a direction points: round from +z towards +x (yaw), up from
// level (pitch), and how far (far).
function angles(v) {
  const flat = Math.hypot(v.x, v.z);
  return { yaw: Math.atan2(v.x, v.z), pitch: Math.atan2(v.y, flat), far: Math.max(1, v.length()) };
}
