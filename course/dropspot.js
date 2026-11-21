// A drop's spot chosen in its relief area (sim/reliefarea.mjs has the
// Rules): the area drawn on the ground - the line back from the hole
// through the ball (or where it went into the water) and a club-length
// either side, or the two club-lengths round it - and the spot in it,
// moved with the arrows (Shift: ten metres back on the line), a click or
// a finger on the ground, the D-pad; the card says what it's like there
// (its lie, the trees, how far back and to go) before Drop here, and the
// camera looks from behind it to the hole. Choosing among the choices, a
// click or tap near one's area picks it there.
// Part of CourseMode (course.js), split out of it: these methods are
// added to CourseMode.prototype there and run with `this` the course.

import * as THREE from "three";
import { toWorld } from "../scenery.js";
import { areaFor, areaNear, areaShape, clampSpot, nudgeSpot, spotCheck, spotWords, clearSpotView } from "../sim/reliefarea.mjs";
import { PALETTE } from "../look/palette.js";
import { shared } from "../look/dispose.js";
import { esc } from "../util.js";

// Where it can't go, the spot's mark in red.
const NO_GO = "#ff5a4f";
// The ground found under the pointer: looked for this far out (metres),
// in steps growing with the distance.
const GROUND_MOST = 900;

export class CourseDropSpot {
  // The card while a spot's chosen: what it is, where the spot is and
  // what's there, how to move it, Drop here and Back.
  spotCard(rel, who) {
    const o = rel.options[rel.pick.k];
    const info = rel.pick.info;
    const touch = document.body.classList.contains("touch-play");
    const line = rel.pick.area.kind === "line";
    const how = touch ? "drag on the picture, or ▲ ▼ ◀ ▶" : line ? "↑ ↓ further back or nearer (Shift + ↑ ten metres), ← → across, or click the ground" : "the arrows move it, or click the ground";
    const what = line ? `As far back on the line as you like, a club-length either side - ${how}` : `Anywhere within two club-lengths, no nearer the hole - ${how}`;
    const ok = !!info?.ok;
    return (
      `<div class="cc-q">${who}${esc(o.title)}</div>` +
      `<div class="cc-why">${esc(what)}</div>` +
      `<div class="rp-spot${ok ? "" : " rp-no"}">${esc(info ? spotWords(info) : "")}</div>` +
      `<div class="cc-buttons"><button data-relief="drop" class="primary"${ok ? "" : " disabled"}><kbd>Enter</kbd> Drop here</button><button data-relief="back"><kbd>Esc</kbd> Back to the choices</button></div>`
    );
  }

  // The spot moved to `at` (kept in its area), and everything showing it
  // brought up to date.
  moveDrop(at) {
    const pick = this.relief?.pick;
    if (!pick || !at) return false;
    pick.at = clampSpot(pick.area, at);
    pick.info = spotCheck(this.hole, pick.area, pick.at);
    this.showDrop({ camera: true });
    return true;
  }

  // An arrow's step (sim/reliefarea.mjs nudgeSpot).
  nudgeDrop(move) {
    const pick = this.relief?.pick;
    if (!pick) return false;
    return this.moveDrop(nudgeSpot(pick.area, pick.at, move));
  }

  // Enter, or Drop here: dropped where the spot is - if it can go there.
  dropHere() {
    const rel = this.relief;
    const pick = rel?.pick;
    if (!pick) return false;
    if (!pick.info?.ok) {
      this.onToast(pick.info?.why ?? "It can't be dropped there", 2000);
      return true;
    }
    return this.takeRelief(pick.k, pick.at);
  }

  // The card, the marks, the map and (eased) the camera, for the spot.
  showDrop({ camera = false } = {}) {
    this.showRelief();
    this.drawReliefMarks();
    this.drawMaps();
    if (camera) this.placeCamera(false);
    this.render();
  }

  // The camera while a spot's chosen: behind it, out from the hole, a
  // little up - the hole, and the ball or the water, ahead past it - from
  // round to one side, or nearer and under the crowns, if a tree's in the
  // way (sim/reliefarea.mjs clearSpotView).
  overSpot() {
    const { area, at } = this.relief.pick;
    // (The camera's trees in the hole's frame: a world x, z is the hole's z, -x.)
    const trees = (this.cameraTrees ?? []).filter((t) => Number.isFinite(t.r)).map((t) => ({ x: -t.z, z: t.x, r: t.r, top: t.top }));
    const best = clearSpotView(area, at, { trees, ground: (x, z) => this.heightAt(x, z) });
    const y = this.heightAt(at[0], at[1]);
    toWorld(best.cam[0], Math.max(this.heightAt(best.cam[0], best.cam[1]), y) + best.up, best.cam[1], this.camWant);
    toWorld(best.look[0], this.heightAt(best.look[0], best.look[1]) + 0.4, best.look[1], this.lookWant);
  }

  // A click or a finger on the picture, with the card up: the spot moved
  // there (and dragged on with it); among the choices, the one whose area
  // it's near picked, with the spot there. Mouse and touch alike, set up
  // the first time the card's up.
  dropPointer() {
    if (this.dropPointerOn) return;
    const canvas = this.renderer?.domElement;
    if (!canvas?.addEventListener) return;
    this.dropPointerOn = true;
    let drag = null;
    canvas.addEventListener("pointerdown", (e) => {
      const rel = this.relief;
      if (!rel || !this.isActive || this.flying || rel.player !== this.me || (e.pointerType === "mouse" && e.button !== 0)) return;
      const at = this.groundAtPointer(e);
      if (!at) return;
      if (rel.pick) this.moveDrop(at);
      else {
        const k = areaNear(rel.options.map((o) => areaFor(this.hole, o)), at);
        if (k < 0) return;
        this.chooseRelief(k, at);
      }
      drag = e.pointerId;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // (Gone already.)
      }
    });
    canvas.addEventListener("pointermove", (e) => {
      if (drag !== e.pointerId || !this.relief?.pick) return;
      const at = this.groundAtPointer(e);
      if (at) this.moveDrop(at);
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
      canvas.addEventListener(type, (e) => {
        if (drag === e.pointerId) drag = null;
      });
    }
  }

  // The ground under a pointer on the picture, in the hole's frame ([x, z]),
  // or null (the sky): along the camera's ray until it goes under the
  // ground, then found to a few centimetres.
  groundAtPointer(e) {
    const canvas = this.renderer.domElement;
    // (The picture as the screen shows it: the canvas can be drawn wider
    // than that for a centred recording - widepicture.js - its view
    // the screen's part still.)
    const box = (canvas.parentElement ?? canvas).getBoundingClientRect();
    if (!box.width || !box.height) return null;
    const ndc = new THREE.Vector2(((e.clientX - box.left) / box.width) * 2 - 1, -((e.clientY - box.top) / box.height) * 2 + 1);
    const ray = (this.groundRay ??= new THREE.Raycaster());
    this.camera.updateMatrixWorld();
    ray.setFromCamera(ndc, this.camera);
    const { origin: o, direction: d } = ray.ray;
    const below = (t) => o.y + d.y * t <= this.worldHeight(o.x + d.x * t, o.z + d.z * t);
    let t0 = 0;
    for (let t = 1; t <= GROUND_MOST; t += Math.max(1, t * 0.02)) {
      if (below(t)) {
        let lo = t0;
        let hi = t;
        for (let i = 0; i < 12; i++) {
          const mid = (lo + hi) / 2;
          if (below(mid)) hi = mid;
          else lo = mid;
        }
        // (World x, z to the hole's: x = -z, z = x.)
        return [-(o.z + d.z * hi), o.x + d.x * hi];
      }
      t0 = t;
    }
    return null;
  }

  // The marks while a spot's chosen: its area, brighter, and the spot - a
  // ring and a ball on the ground, its number over it (red where it
  // can't go).
  drawDrop() {
    const { k, area, at, info } = this.relief.pick;
    this.addAreaShape(area, at, { faint: false });
    this.addDropMark(at, String(k + 1), info?.ok !== false, { ball: true });
  }

  // A mark at `at`: a ring on the ground in the flag's yellow (red: it
  // can't go there), its label over it, seen through anything in the way;
  // and a ball where it'd be dropped.
  addDropMark(at, label, ok = true, { ball = false } = {}) {
    const [x, z] = at;
    const y = this.heightAt(x, z);
    const colour = ok ? PALETTE.accent : NO_GO;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.62, 32).rotateX(-Math.PI / 2), this.dropLook(colour, 0.9));
    ring.position.copy(toWorld(x, y + 0.05, z));
    ring.renderOrder = 4;
    this.reliefGroup.add(ring);
    if (ball) {
      this.dropBallLook ??= shared(new THREE.MeshBasicMaterial({ color: 0xffffff }));
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), this.dropBallLook);
      b.position.copy(toWorld(x, y + 0.11, z));
      this.reliefGroup.add(b);
    }
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = colour;
    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(64, 64, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#1b1b1b";
    ctx.font = "bold 76px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 64, 68);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sprite.scale.set(0.9, 0.9, 1);
    sprite.position.copy(toWorld(x, y + 1.3, z));
    sprite.renderOrder = 6;
    this.reliefGroup.add(sprite);
  }

  // The flat marks' look in a colour (kept: there are only a few).
  dropLook(colour, opacity) {
    this.dropLooks ??= new Map();
    const key = `${colour}|${opacity}`;
    if (!this.dropLooks.has(key)) {
      this.dropLooks.set(key, shared(new THREE.MeshBasicMaterial({ color: colour, transparent: true, opacity, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -10, polygonOffsetUnits: -16 })));
    }
    return this.dropLooks.get(key);
  }

  // A relief area drawn on the ground (sim/reliefarea.mjs areaShape): the
  // line back - its middle, its club-length edges and a tick every ten
  // yards - or the two club-lengths' half circle and the line through the
  // ball it mustn't come nearer the hole than. Faint among the choices.
  addAreaShape(area, at, { faint = false } = {}) {
    const shape = areaShape(area, at);
    if (!shape) return;
    const strong = this.dropLook(PALETTE.accent, faint ? 0.45 : 0.85);
    const soft = this.dropLook(PALETTE.accent, faint ? 0.25 : 0.5);
    if (shape.kind === "line") {
      const { from, u, n, width, length } = shape;
      const along = (d, s) => [from[0] + u[0] * d + n[0] * s, from[1] + u[1] * d + n[1] * s];
      const steps = Math.max(2, Math.ceil(length / 1.5));
      const line = (s) => Array.from({ length: steps + 1 }, (_, i) => along((length * i) / steps, s));
      this.reliefGroup.add(this.groundRibbon(line(0), faint ? 0.12 : 0.18, strong));
      if (!faint) {
        this.reliefGroup.add(this.groundRibbon(line(width), 0.07, soft));
        this.reliefGroup.add(this.groundRibbon(line(-width), 0.07, soft));
        const YD = 0.9144;
        for (let d = 10 * YD; d < length; d += 10 * YD) this.reliefGroup.add(this.groundRibbon([along(d, -width), along(d, width)], 0.07, soft));
      }
      return;
    }
    const { at: c, radius, u } = shape;
    const a0 = Math.atan2(u[1], u[0]);
    const arc = Array.from({ length: 33 }, (_, i) => {
      const a = a0 - Math.PI / 2 + (Math.PI * i) / 32;
      return [c[0] + Math.cos(a) * radius, c[1] + Math.sin(a) * radius];
    });
    this.reliefGroup.add(this.groundRibbon(arc, faint ? 0.06 : 0.09, strong));
    this.reliefGroup.add(this.groundRibbon([arc[0], arc.at(-1)], faint ? 0.05 : 0.07, soft));
  }

  // A strip `width` wide along a line (hole frame) laid on the ground.
  groundRibbon(points, width, look) {
    const pos = [];
    const idx = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[Math.max(0, i - 1)];
      const b = points[Math.min(points.length - 1, i + 1)];
      let dx = b[0] - a[0];
      let dz = b[1] - a[1];
      const len = Math.hypot(dx, dz) || 1;
      dx /= len;
      dz /= len;
      const [x, z] = points[i];
      for (const s of [-1, 1]) {
        const px = x - dz * s * (width / 2);
        const pz = z + dx * s * (width / 2);
        const w = toWorld(px, this.heightAt(px, pz) + 0.05, pz);
        pos.push(w.x, w.y, w.z);
      }
      if (i) idx.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    const mesh = new THREE.Mesh(g, look);
    mesh.renderOrder = 4;
    return mesh;
  }

  // What the hole's map shows of it (course.js mapExtras): each choice's
  // place, numbered as the card has them - or the spot being chosen, and
  // its area's line or circle.
  dropMapExtras() {
    const rel = this.relief;
    if (!rel) return { drops: [] };
    if (!rel.pick) return { drops: rel.options.map((o, k) => ({ at: o.ball, label: String(k + 1) })) };
    const { k, area, at } = rel.pick;
    const shape = areaShape(area, at);
    return {
      drops: [{ at, label: String(k + 1) }],
      dropArea: shape?.kind === "line" ? { line: [shape.from, shape.to] } : shape?.kind === "disc" ? { at: shape.at, radius: shape.radius } : null,
    };
  }
}
