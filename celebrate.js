// A celebration when a hole (or a round) is finished: the banner over the
// picture, the confetti, fireworks and sparkle, the sound, the camera
// swinging round to the flag for the big ones, and for the bad ones the
// picture briefly losing its colour. What each score gets is decided in
// sim/celebration.mjs; this plays it.
//
// Everything is driven from the render loop's clock rather than CSS
// animations, so it keeps time with the 3D effects.

import * as THREE from "three";
import { CelebrationEffects } from "./look/celebrate.js";
import { celebrationFx } from "./celebrationfx.js";
import { esc } from "./util.js";
import { scoreWord, letterAt, depthShadow, wordFit } from "./sim/scoreword.mjs";

const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
// Overshoots and settles: a banner that pops.
const easeOutBack = (t, s = 1.9) => (t >= 1 ? 1 : 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2);
// A circling camera starts this far round from the side it was on (about
// 70 degrees), turning away from it: after a hole-out that side is the line
// the ball came in on, and the camera would sit right under the shot.
const ORBIT_START = 1.2;

export class Celebration {
  // view: the element over the 3D picture. canvas: the 3D canvas, which is
  // what's desaturated. scene: where the effects go. sounds: see sounds.js.
  constructor({ view, canvas, scene, sounds = null, high = true }) {
    this.canvas = canvas;
    this.view = view;
    this.sounds = sounds;
    this.effects = new CelebrationEffects(scene, { high });
    this.effects.onBurst = () => this.sounds?.play("pop", 0.5 * (this.desc?.volume ?? 1));
    this.banner = document.createElement("div");
    this.banner.className = "celebrate";
    this.banner.hidden = true;
    view.appendChild(this.banner);
    this.desc = null;
    this.age = 0;
    // Called when the banner has gone, so the overlay can show its own title.
    this.onBannerGone = () => {};
  }

  get active() {
    return !!this.desc;
  }
  // True while the camera should be framing the flag.
  get steering() {
    return !!this.desc?.camera;
  }
  // True while the banner is up (the bay view's own title makes way for it).
  get showing() {
    return !!this.desc && this.age < this.bannerTime;
  }

  // desc: from celebrationFor() or roundCelebration(). focus: the cup.
  // camera: the scene's camera. away: which way from the flag the camera
  // should stand (it keeps its side). groundAt(x, z): world ground height.
  play(desc, { focus, camera, away, groundAt = () => focus.y }) {
    this.clear();
    this.desc = desc;
    this.age = 0;
    this.focus = focus.clone();
    this.groundAt = groundAt;
    this.bannerTime = Math.max(2.5, desc.hold - 0.6);
    // Where the camera goes, for the scores that move it.
    const c = desc.camera;
    const dir = away.clone().setY(0);
    if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1);
    dir.normalize();
    this.angle0 = Math.atan2(dir.z, dir.x) + (c?.orbit ? ORBIT_START : 0);
    let cameraAt = camera.position;
    if (c) {
      this.camPos = new THREE.Vector3();
      this.camLook = new THREE.Vector3();
      this.frame(0);
      cameraAt = this.camPos;
    }
    // (The confetti, streamers, cannons, fireworks and sparkle only with
    // the celebration effects on: celebrationfx.js.)
    if (celebrationFx.on) this.effects.start(desc, { focus: this.focus, camera, cameraAt, groundAt });
    this.showBanner(desc);
    this.sounds?.play(desc.sound, desc.volume);
    this.update(0, camera);
  }

  // Where the camera should be, t seconds in: off the flag on the side it
  // was already, circling slowly for the best scores.
  frame(t) {
    const c = this.desc.camera;
    const a = this.angle0 + (c.orbit ?? 0) * t;
    const p = this.camPos.set(this.focus.x + Math.cos(a) * c.distance, 0, this.focus.z + Math.sin(a) * c.distance);
    p.y = Math.max(this.focus.y + c.height, this.groundAt(p.x, p.z) + 1.2);
    this.camLook.copy(this.focus).add(new THREE.Vector3(0, c.lookUp, 0));
  }

  // Steers the course camera while the celebration wants it.
  steer(camWant, lookWant) {
    if (!this.steering) return false;
    this.frame(this.age);
    camWant.copy(this.camPos);
    lookWant.copy(this.camLook);
    return true;
  }

  // The banner. When the camera frames the flag against the sky it goes
  // above; otherwise the camera is still looking at the cup, with the
  // flagstick running up the middle of the picture, so it goes below, over
  // the green the ball has just rolled across. Duller scores fade the
  // lettering, never the box, so nothing behind shows through the words.
  showBanner(desc) {
    const b = this.banner;
    // A hole's score: its word in 3D letters, no box (sim/scoreword.mjs) -
    // the round's and the games' banners keep theirs.
    this.word = scoreWord(desc);
    this.letters = null;
    b.style.fontSize = "";
    b.style.setProperty("--w3-face", "");
    b.style.setProperty("--w3-body", "");
    if (this.word) return this.showWord(desc, this.word);
    b.className = `celebrate ${desc.banner.style}${desc.level >= 3 ? " top" : ""}${desc.camera ? "" : " low"}`;
    b.style.setProperty("--size", desc.banner.size);
    b.style.setProperty("--fade", desc.banner.opacity);
    b.innerHTML = `<div class="celebrate-box">
      <div class="celebrate-title">${esc(desc.title)}</div>
      ${desc.subtitle ? `<div class="celebrate-sub${desc.wrap ? " wrap" : ""}">${esc(desc.subtitle)}</div>` : ""}
      ${desc.detail ? `<div class="celebrate-detail">${esc(desc.detail)}</div>` : ""}
    </div>`;
    b.hidden = false;
  }

  // The word: a letter a span, each with its face over its side, sized to
  // fit across the picture; a line under it in a pill, if there's one.
  showWord(desc, word) {
    const b = this.banner;
    b.className = ["celebrate", "word3d", word.kind, word.glint ? "glint" : "", desc.camera ? "" : "low"].filter(Boolean).join(" ");
    const width = this.view?.clientWidth || globalThis.innerWidth || 1280;
    const em = Math.min(140, Math.max(30, width * 0.064));
    b.style.fontSize = `${wordFit(word, width, em).toFixed(1)}px`;
    b.style.setProperty("--w3-face", `linear-gradient(180deg, ${word.face[0]} 0%, ${word.face[1]} 52%, ${word.face[2]} 100%)`);
    b.style.setProperty("--w3-body", word.side[0]);
    const letters = [...word.text].map((ch) => (ch === " " ? `<span class="w3 gap"></span>` : `<span class="w3" data-ch="${esc(ch)}">${esc(ch)}</span>`)).join("");
    b.innerHTML = `<div class="word3d-line" style="font-weight: ${word.weight}; text-shadow: ${depthShadow(word)}">${letters}</div>
      ${desc.subtitle ? `<div class="celebrate-sub word3d-sub">${esc(desc.subtitle)}</div>` : ""}`;
    this.letters = [...b.querySelectorAll(".w3")];
    this.placeLetters(0);
    b.hidden = false;
  }
  // Each letter as it is `t` seconds in (sim/scoreword.mjs letterAt).
  placeLetters(t) {
    if (!this.word || !this.letters) return;
    this.letters.forEach((el, i) => {
      if (el.classList.contains("gap")) return;
      const l = letterAt(this.word, i, t);
      el.style.transform = `translateY(${l.down.toFixed(3)}em) rotate(${l.roll.toFixed(2)}deg) perspective(4em) rotateX(${l.tilt.toFixed(1)}deg) scale(${l.scale.toFixed(3)})`;
      el.style.opacity = l.alpha.toFixed(3);
    });
  }

  // Each frame: the effects, the banner's entrance and exit, the colour.
  update(dt, camera) {
    if (!this.desc) {
      this.effects.update(dt, camera);
      return;
    }
    const d = this.desc;
    this.age += dt;
    const t = this.age;
    this.effects.update(dt, camera);

    // The banner: gold and bright boxes pop in, a neat one slides up, the
    // rest just fade in. All fade out before the next hole.
    // (A hole's word arrives a letter at a time instead: placeLetters.)
    const style = this.word ? "word" : d.banner.style;
    const inTime = style === "gold" ? 0.55 : style === "bright" ? 0.4 : 0.35;
    const k = Math.min(1, t / inTime);
    let scale = 1;
    let rise = 0;
    if (style === "gold") scale = 0.3 + 0.7 * easeOutBack(k, 2.2);
    else if (style === "bright") scale = 0.6 + 0.4 * easeOutBack(k, 1.6);
    else if (style === "neat") rise = (1 - smooth(k)) * 0.6;
    const out = 1 - smooth((t - this.bannerTime) / 0.5);
    const opacity = this.word ? out : Math.min(smooth(k * 1.5), out);
    this.placeLetters(t);
    // A glint running across the gold lettering (and the gold words').
    const shine = style === "gold" || this.word?.glint ? ((t * 45) % 260) - 80 : 0;
    this.banner.style.opacity = String(opacity);
    this.banner.style.transform = `translate(-50%, -50%) translateY(${rise}em) scale(${scale})`;
    if (shine) this.banner.style.setProperty("--shine", `${shine}%`);
    // As it is this frame, for the recording (bannerFrame).
    this.look = { opacity, scale, rise, shine };
    if (out <= 0 && !this.banner.hidden) {
      this.banner.hidden = true;
      this.onBannerGone();
    }

    // The colour draining out of the picture, and coming back.
    if (d.desaturate > 0) {
      const holdTo = d.desaturate > 0.7 ? 2.2 : 1.4;
      const back = d.desaturate > 0.7 ? 2 : 1.8;
      const amount = t < 0.4 ? smooth(t / 0.4) : 1 - smooth((t - holdTo) / back);
      this.setFilter(amount);
    }
    // Over by itself once the effects have finished, unless the camera is
    // still circling a hole's flag (the next hole ends that).
    if (t >= this.bannerTime + 0.5 && !this.effects.active && (!d.camera || d.round)) this.clear();
  }

  setFilter(amount) {
    const d = this.desc;
    if (!d || amount <= 0.001) {
      this.canvas.style.filter = "";
      return;
    }
    this.canvas.style.filter = `saturate(${(1 - d.desaturate * amount).toFixed(3)}) brightness(${(1 - d.dim * amount).toFixed(3)})`;
  }

  // The banner as the recording draws it (compositor.js drawBanner): its
  // words and style, where it sits, and how far into its entrance or exit
  // it is this frame - or null when none is up. (The banner itself is over
  // the picture, not in it, so a recording would otherwise miss it.)
  bannerFrame() {
    const d = this.desc;
    if (!d || this.banner.hidden || !this.look || !(this.look.opacity > 0.01)) return null;
    // A score's word: its letters drawn as they are on the page, the same
    // time into their flight (compositor.js drawScoreWord).
    const word = this.word ? { word: this.word, age: this.age } : {};
    return { title: d.title, subtitle: d.subtitle ?? "", detail: d.detail ?? "", style: d.banner.style, size: d.banner.size, fade: d.banner.opacity, top: d.level >= 3, low: !d.camera, ...this.look, ...word };
  }

  // Stops everything at once: the next hole, N, a new round, another mode.
  // The sound too, so a fanfare doesn't play on over what comes next.
  clear() {
    this.effects.clear();
    this.sounds?.stopAll();
    this.desc = null;
    this.look = null;
    this.word = null;
    this.letters = null;
    this.age = 0;
    this.banner.hidden = true;
    this.banner.innerHTML = "";
    this.canvas.style.filter = "";
  }
}
