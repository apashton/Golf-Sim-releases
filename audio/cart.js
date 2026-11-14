// The golf cart's sound on the ride between holes (course/buggy.js), from
// recordings of real carts (families.mjs): one rolling along ("cart") and
// an electric cart's low drive hum under it ("cart-motor"), each looping as
// it drives, and the clubs rattling in the bag now and then
// ("cart-rattle"). sim/buggy.mjs cartSound says how each sounds at each
// speed, on the path or the grass, and cartRattle when the clubs rattle.
// Heard from where the cart is - from the seat while the camera's in it,
// fading as it drives off while it's followed. Through the effects
// (audio/engine.js), so the Sound settings apply, and into a recording with
// the rest. With no recordings of a cart (or the recordings setting "made
// up only"), only its tyres, a faint band of noise; if there's no sound at
// all, nothing.

import { audio } from "./engine.js";
import { noiseBuffers } from "./synth.js";
import { cartSound, cartRattle, CART_SOUND } from "../sim/buggy.mjs";
import { loopLength } from "./looplength.js";

// How quickly it follows the cart, seconds (setTargetAtTime's).
const FOLLOW = 0.06;
// The rolling's level and muffling, from the path onto the grass and back
// (and pulling away), seconds.
const SURFACE = 0.25;
// Faded out at the ride's end over this, seconds.
const FADE = 0.35;

// Each loop's length, its end blended into its start: audio/looplength.js.

export class CartSound {
  constructor(engine = audio) {
    this.engine = engine;
    this.nodes = null;
  }

  // Ready to be heard (if sound's on): quiet until it moves.
  start() {
    if (this.nodes || !this.engine.ready) return;
    const ctx = this.engine.ctx;
    try {
      const gain = (value, to) => {
        const g = ctx.createGain();
        g.gain.value = value;
        g.connect(to);
        return g;
      };
      // Out: how loud from here, the air's muffling and its side.
      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (pan) pan.connect(this.engine.effects);
      const air = ctx.createBiquadFilter();
      air.type = "lowpass";
      air.frequency.value = 18000;
      air.connect(pan ?? this.engine.effects);
      const out = gain(0, air);
      const made = this.engine.settings?.recordings === "made";
      const bed = (family) => (made ? null : (this.engine.recordings?.pickBed(family) ?? null));
      // A loop of a recording, from somewhere in it, without a seam.
      const looping = (rec, to) => {
        if (!rec) return null;
        const src = ctx.createBufferSource();
        src.buffer = rec;
        src.loop = true;
        src.loopStart = 0;
        src.loopEnd = loopLength(rec);
        src.connect(to);
        src.start(ctx.currentTime, Math.random() * src.loopEnd);
        return src;
      };
      // The rolling, muffled on the grass.
      const roll = gain(0, out);
      const ground = ctx.createBiquadFilter();
      ground.type = "lowpass";
      ground.frequency.value = CART_SOUND.roll.path.cutoff;
      ground.connect(roll);
      const rollLoop = looping(bed("cart"), ground);
      // The motor's hum under it.
      const hum = gain(0, out);
      const humLoop = looping(bed("cart-motor"), hum);
      const all = [pan, air, out, roll, ground, hum];
      let tyres = null;
      let road = null;
      let noise = null;
      // No recordings: the tyres, noise filtered for the ground they're on.
      if (!rollLoop && !humLoop) {
        tyres = gain(0, out);
        road = ctx.createBiquadFilter();
        road.connect(tyres);
        noise = ctx.createBufferSource();
        noise.buffer = noiseBuffers(ctx).white;
        noise.loop = true;
        noise.connect(road);
        noise.start(ctx.currentTime, Math.random() * noise.buffer.duration);
        all.push(tyres, road);
      }
      this.nodes = { out, air, pan, roll, ground, rollLoop, hum, humLoop, tyres, road, noise, all, rattles: !made, rattle: null, at: ctx.currentTime };
    } catch {
      this.nodes = null;
    }
  }

  // Each frame of the ride: the cart going `speed` (metres a second),
  // speeding up or slowing (accel), on `surface`, at `at` (the world's).
  update({ speed = 0, accel = 0, surface = "grass", at = null } = {}) {
    const n = this.nodes;
    if (!n) return;
    const ctx = this.engine.ctx;
    const t = ctx.currentTime;
    const to = (param, value, follow = FOLLOW) => param.setTargetAtTime(value, t, follow);
    const s = cartSound(speed, { accel, surface });
    const where = at ? this.engine.spatial(at, CART_SOUND.near) : { gain: 1, cutoff: 18000, pan: 0 };
    to(n.out.gain, where.gain);
    to(n.air.frequency, where.cutoff);
    if (n.pan) to(n.pan.pan, where.pan);
    if (n.rollLoop) {
      to(n.roll.gain, s.roll.gain, SURFACE);
      to(n.rollLoop.playbackRate, s.roll.rate);
      to(n.ground.frequency, s.roll.cutoff, SURFACE);
    }
    if (n.humLoop) {
      to(n.hum.gain, s.hum.gain);
      to(n.humLoop.playbackRate, s.hum.rate);
    }
    if (n.road) {
      if (n.road.type !== s.tyres.type) n.road.type = s.tyres.type;
      to(n.road.frequency, s.tyres.freq);
      to(n.road.Q, s.tyres.q);
      to(n.tyres.gain, s.tyres.gain);
    }
    // The clubs in the bag, now and then.
    if (n.rattles) {
      const step = cartRattle(n.rattle, { speed, surface, dt: Math.max(0, t - n.at) });
      n.rattle = step.state;
      if (step.play) this.rattle(step.play, t);
    }
    n.at = t;
  }

  // One rattle of the clubs ({ gain, rate }), from where the cart is.
  rattle({ gain, rate }, t) {
    const n = this.nodes;
    const rec = this.engine.recordings?.pickBed("cart-rattle");
    if (!n || !rec) return;
    try {
      const ctx = this.engine.ctx;
      const g = ctx.createGain();
      g.gain.value = gain;
      g.connect(n.out);
      const src = ctx.createBufferSource();
      src.buffer = rec;
      src.playbackRate.value = rate;
      src.connect(g);
      src.onended = () => {
        src.disconnect();
        g.disconnect();
      };
      src.start(t + 0.01);
    } catch {
      // A nicety: never let it break the ride.
    }
  }

  // The ride over: faded out, and let go.
  stop() {
    const n = this.nodes;
    this.nodes = null;
    if (!n) return;
    try {
      const ctx = this.engine.ctx;
      const t = ctx.currentTime;
      n.out.gain.cancelScheduledValues(t);
      n.out.gain.setTargetAtTime(0, t, FADE / 4);
      for (const o of [n.rollLoop, n.humLoop, n.noise]) o?.stop(t + FADE + 0.1);
      const done = setTimeout(() => {
        for (const node of [n.rollLoop, n.humLoop, n.noise, ...n.all]) node?.disconnect();
      }, (FADE + 0.3) * 1000);
      done?.unref?.();
    } catch {
      // Gone already.
    }
  }
}
