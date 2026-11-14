// The sounds of the outdoors, playing all the time under the game: wind,
// birds, water and rain, each a layer of its own that can be turned off,
// all overlaid. On the course and the range the wind follows the day's
// (look/weatherlook.js): louder the stronger it is, its gusts on the same
// clock as the flags and trees; the rain hisses and patters while it
// rains, and the birds call less. The rules (when a gust comes, which bird calls, how loud the
// water is from here) are in ambience.mjs; this plays them.
//
// Built to run for hours: the wind and water are a handful of nodes made
// once per scene, their noise changed for a fresh stretch every few seconds
// (NoiseBed) so it never repeats; each bird call and bubble makes its own
// few nodes, which stop and are let go when it's over; at most a few calls
// at once. A timer looks ahead a fraction of a second and schedules what's
// due, so nothing depends on the frame rate and nothing stutters.

import { loopLength } from "./looplength.js";
import { windTarget, windGust, windStrength, gustShape, MAX_WIND_LEVEL, rainSound, rainDrops, birdRates, birdsToStart, birdPlace, birdCall as birdRecipe, callLength, fowlToStart, fowlCall, FOWL, distanceToWater, waterLevel, waterBlips, lapSwell } from "./ambience.mjs";
import { airCutoff, distanceGain, panFor, recordingVariation, between } from "./params.mjs";
import { noiseBuffers, bubble, birdCall, noise } from "./synth.js";
import { weatherLook } from "../look/weatherlook.js";

const TICK = 0.2; // seconds between looks ahead
const AHEAD = 0.15; // how far ahead sounds are scheduled
const MAX_WATER = 4; // stretches of water heard at once
// How loud the distant outdoor bed is (the Background volume on top): a
// bed, heard only when listened for.
const OUTDOOR_LEVEL = 0.35;
// A recording of rain against the made-up hiss, at the same rain: a
// levelled loop is fuller than the hiss, so well under it.
const RAIN_REC_GAIN = 2.4;

// How loud a bird is, near (the Background volume on top): well under the
// shots' sounds, however near one calls.
export const BIRD_LEVEL = 0.12;
// A duck or swan close by (the Background volume on top): a little louder
// than the birds in the trees, being out in the open.
const FOWL_LEVEL = 0.16;
// A crossfade between two stretches of noise (s), and the curves for it:
// equal power, so the level holds steady through it.
const XFADE = 0.5;
const FADE_IN = Float32Array.from({ length: 16 }, (_, i) => Math.sin(((i / 15) * Math.PI) / 2));
const FADE_OUT = FADE_IN.slice().reverse();

export class Ambience {
  // engine: engine.js's AudioEngine, for the context, the ambience bus, the
  // listener, the settings and the recordings.
  constructor(engine) {
    this.engine = engine;
    const ctx = (this.ctx = engine.ctx);
    // Everything here goes through the scene's fade (in when a scene shows,
    // out when it goes) to the ambience bus.
    this.scene = ctx.createGain();
    this.scene.gain.value = 0;
    this.scene.connect(engine.ambience);
    this.layers = {};
    for (const name of ["wind", "birds", "water", "rain", "outdoor"]) {
      const g = ctx.createGain();
      g.gain.value = engine.settings[name] ? 1 : 0;
      g.connect(this.scene);
      this.layers[name] = g;
    }
    this.scape = null;
    this.water = [];
    this.calls = 0;
    this.fowlCalls = 0;
    this.last = ctx.currentTime;
    this.startWind();
    this.startRain();
    this.timer = setInterval(() => this.tick(), TICK * 1000);
    this.timer?.unref?.();
  }

  // A layer on or off, with a fade.
  setLayer(name, on) {
    const g = this.layers[name];
    if (!g) return;
    const now = this.ctx.currentTime;
    g.gain.cancelScheduledValues(now);
    g.gain.setTargetAtTime(on ? 1 : 0, now, 0.4);
  }

  // The scene on screen changed (another mode, the next hole): fade what
  // was playing out, change over, and fade the new scene in.
  setScape(scape) {
    if (scape === this.scape) return;
    const first = this.scape === null;
    this.scape = scape;
    const now = this.ctx.currentTime;
    const g = this.scene.gain;
    g.cancelScheduledValues(now);
    if (first) {
      g.setValueAtTime(0, now);
    } else {
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(0, now + 0.3);
    }
    g.setTargetAtTime(1, now + 0.35, 0.8);
    // The old water goes with the fade; the new starts under it.
    const old = this.water;
    this.water = [];
    setTimeout(() => {
      for (const w of old) w.stop();
    }, 400);
    for (const w of this.pickWater(scape)) this.water.push(new WaterVoice(this, w, now + 0.35));
    this.windUntil = 0;
    this.pickWind(now + 0.35);
    this.pickRain(now + 0.35);
    this.pickOutdoor(now + 0.35);
  }

  // The recordings have arrived (or changed): the wind and water
  // playing now choose again between them and the made-up ones.
  recordingsChanged() {
    if (!this.scape) return;
    const now = this.ctx.currentTime;
    for (const w of this.water) w.fadeOut();
    this.water = this.pickWater(this.scape).map((w) => new WaterVoice(this, w, now));
    this.pickWind(now);
    this.pickRain(now);
    this.pickOutdoor(now);
  }

  // The quiet, distant outdoor bed under the wind (the owner: "several quiet
  // beds layered together, each looping at a different length, so they
  // never line back up the same way"): one of the outdoor recordings,
  // looping from a random point, a touch higher or lower - its length its
  // own, so it and the wind's never come round together. Recordings only:
  // with none, there's no bed (the wind's own never repeats). With each
  // scene a new one, crossfading.
  pickOutdoor(t) {
    const ctx = this.ctx;
    const old = this.outdoorRec;
    this.outdoorRec = null;
    if (old) {
      old.gain.gain.setTargetAtTime(0, t, 0.6);
      setTimeout(() => {
        try {
          old.src.stop();
        } catch {
          // Already stopped.
        }
        old.gain.disconnect();
      }, Math.max(0, t - ctx.currentTime + 3.5) * 1000);
    }
    const rec = this.engine.settings.recordings === "made" ? null : this.engine.recordings.pickBed("outdoor");
    if (!rec) return;
    const src = ctx.createBufferSource();
    src.buffer = rec;
    src.loop = true;
    // (Round without a seam: audio/looplength.js.)
    src.loopStart = 0;
    src.loopEnd = loopLength(rec);
    src.playbackRate.value = recordingVariation().rate;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(OUTDOOR_LEVEL, t, 0.6);
    src.connect(gain).connect(this.layers.outdoor);
    src.start(t, Math.random() * loopLength(rec));
    this.outdoorRec = { src, gain };
  }

  // The biggest few stretches of water, if a scene has more than can
  // sensibly play at once.
  pickWater(scape) {
    const list = [...(scape?.water ?? [])];
    const size = (w) => {
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
      for (const [x, z] of w.points) (x0 = Math.min(x0, x)), (x1 = Math.max(x1, x)), (z0 = Math.min(z0, z)), (z1 = Math.max(z1, z));
      return (x1 - x0) * (z1 - z0);
    };
    return list.sort((a, b) => size(b) - size(a)).slice(0, MAX_WATER);
  }

  tick() {
    const ctx = this.ctx;
    if (ctx.state !== "running") return;
    const now = ctx.currentTime;
    const dt = Math.min(1, Math.max(0, now - this.last));
    this.last = now;
    const s = this.engine.settings;
    const at = now + AHEAD;
    for (const bed of this.windBeds) bed.tick(at);
    if (s.wind) this.windTick(now, dt);
    this.rainTick(now, at, dt, s.rain);
    if (s.birds && this.scape?.birds !== false) this.birdTick(at, dt);
    if (s.birds && this.scape?.birds !== false && this.scape?.fowl?.length) this.fowlTick(at, dt);
    for (const w of this.water) w.tick(at, dt, s.water);
  }

  stop() {
    clearInterval(this.timer);
    this.scene.disconnect();
    for (const w of this.water) w.stop();
    for (const bed of this.windBeds) bed.stop();
    this.rainBed?.stop();
    for (const rec of [this.windRec, this.rainRec]) {
      try {
        rec?.src.stop();
      } catch {
        // Already stopped.
      }
    }
  }

  // ---- Wind -----------------------------------------------------------------------

  // Two bands of noise, both sides moving independently: a low rumble and
  // a breathier layer of air above it, their level and brightness
  // wandering.
  startWind() {
    const ctx = this.ctx;
    const { brown, hiss } = noiseBuffers(ctx);
    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = "lowpass";
    this.windFilter.frequency.value = 450;
    this.windFilter.Q.value = 0.4;
    this.windLevel = ctx.createGain();
    this.windLevel.gain.value = 0;
    this.windLevel.connect(this.layers.wind);
    // The made-up wind, faded out while a recording of the owner's plays.
    this.windSynth = ctx.createGain();
    this.windSynth.connect(this.windLevel);
    this.windFilter.connect(this.windSynth);
    this.airFilter = ctx.createBiquadFilter();
    this.airFilter.type = "bandpass";
    this.airFilter.frequency.value = 1200;
    this.airFilter.Q.value = 0.5;
    const airGain = ctx.createGain();
    airGain.gain.value = 0.12;
    this.airFilter.connect(airGain).connect(this.windSynth);
    const now = ctx.currentTime;
    this.windBeds = [new NoiseBed(ctx, brown, this.windFilter, now), new NoiseBed(ctx, hiss, this.airFilter, now)];
    this.windNext = now;
    this.windUntil = 0;
  }

  // With each scene, the wind is the made-up one or one of the owner's
  // recordings (looping, a touch higher or lower), crossfading between.
  // Either way the level wanders and gusts the same.
  pickWind(t) {
    const ctx = this.ctx;
    const rec = this.engine.recordings.pick("wind");
    const old = this.windRec;
    this.windRec = null;
    if (old) {
      old.gain.gain.setTargetAtTime(0, t, 0.4);
      setTimeout(() => {
        try {
          old.src.stop();
        } catch {
          // Already stopped.
        }
        old.gain.disconnect();
      }, Math.max(0, t - ctx.currentTime + 2.5) * 1000);
    }
    if (rec) {
      const src = ctx.createBufferSource();
      src.buffer = rec;
      src.loop = true;
      src.loopStart = 0;
      src.loopEnd = loopLength(rec);
      src.playbackRate.value = recordingVariation().rate;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.gain.setTargetAtTime(1.6, t, 0.4);
      src.connect(gain).connect(this.windLevel);
      src.start(t, Math.random() * loopLength(rec));
      this.windRec = { src, gain };
    }
    this.windSynth.gain.setTargetAtTime(rec ? 0 : 1, t, 0.4);
  }

  windTick(now, dt) {
    const level = this.windLevel.gain;
    const bright = this.windFilter.frequency;
    // The day's wind (the course, the range): as strong as it is, gusting
    // with the flags and trees, wandering a little underneath.
    if (!weatherLook.still) {
      const strength = windStrength(weatherLook.mph);
      if (now >= this.windNext || this.windStrength !== strength) {
        this.windBase = windTarget(strength);
        this.windStrength = strength;
        this.windNext = now + this.windBase.next;
        this.airFilter.frequency.setTargetAtTime(between(Math.random, 900, 1800), now, this.windBase.glide / 3);
      }
      const g = gustShape(weatherLook.gust);
      level.cancelScheduledValues(now);
      bright.cancelScheduledValues(now);
      level.setTargetAtTime(Math.min(MAX_WIND_LEVEL, this.windBase.level * g.level), now, 0.4);
      bright.setTargetAtTime(this.windBase.cutoff * g.bright, now, 0.4);
      this.windUntil = 0;
      return;
    }
    this.windStrength = null;
    const strength = this.scape?.wind ?? 0.35;
    // A gust: up, hold, and slowly away again.
    const gust = now > this.windUntil ? windGust(dt, strength) : null;
    if (gust) {
      const base = this.windBase ?? windTarget(strength);
      const t0 = now + 0.05;
      level.cancelScheduledValues(t0);
      bright.cancelScheduledValues(t0);
      level.setTargetAtTime(base.level * gust.boost, t0, gust.rise / 3);
      bright.setTargetAtTime(base.cutoff * gust.bright, t0, gust.rise / 3);
      const down = t0 + gust.rise + gust.hold;
      level.setTargetAtTime(base.level, down, gust.fall / 3);
      bright.setTargetAtTime(base.cutoff, down, gust.fall / 3);
      this.windUntil = down + gust.fall;
      this.windNext = this.windUntil;
      return;
    }
    if (now < this.windNext || now < this.windUntil) return;
    const w = windTarget(strength);
    this.windBase = w;
    level.cancelScheduledValues(now);
    bright.cancelScheduledValues(now);
    level.setTargetAtTime(w.level, now, w.glide / 3);
    bright.setTargetAtTime(w.cutoff, now, w.glide / 3);
    this.airFilter.frequency.setTargetAtTime(between(Math.random, 900, 1800), now, w.glide / 3);
    this.windNext = now + w.next;
  }

  // ---- Rain -----------------------------------------------------------------------

  // A hiss of fine noise (a band high up) and, over it, the patter of the
  // nearer drops: silent until it rains.
  startRain() {
    const ctx = this.ctx;
    const { hiss } = noiseBuffers(ctx);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1400;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 7500;
    this.rainLevel = ctx.createGain();
    this.rainLevel.gain.value = 0;
    this.rainLevel.connect(this.layers.rain);
    // The made-up rain, faded out while a recording plays.
    this.rainSynth = ctx.createGain();
    hp.connect(lp).connect(this.rainSynth).connect(this.rainLevel);
    this.rainIn = hp;
    this.rainBed = null;
    this.rainRec = null;
  }

  // With each scene, the rain is the made-up hiss and patter or one of the
  // recordings of rain (looping from a random point, a touch higher or
  // lower), crossfading between; silent either way until it rains.
  pickRain(t) {
    const ctx = this.ctx;
    const rec = this.engine.recordings.pick("rain");
    const old = this.rainRec;
    this.rainRec = null;
    if (old) {
      old.gain.gain.setTargetAtTime(0, t, 0.4);
      setTimeout(() => {
        try {
          old.src.stop();
        } catch {
          // Already stopped.
        }
        old.gain.disconnect();
      }, Math.max(0, t - ctx.currentTime + 2.5) * 1000);
    }
    if (rec) {
      const src = ctx.createBufferSource();
      src.buffer = rec;
      src.loop = true;
      src.loopStart = 0;
      src.loopEnd = loopLength(rec);
      src.playbackRate.value = recordingVariation().rate;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.gain.setTargetAtTime(RAIN_REC_GAIN, t, 0.4);
      src.connect(gain).connect(this.rainLevel);
      src.start(t, Math.random() * loopLength(rec));
      this.rainRec = { src, gain };
    }
    this.rainSynth.gain.setTargetAtTime(rec ? 0 : 1, t, 0.4);
  }

  rainTick(now, at, dt, on) {
    const { level, patter } = rainSound(weatherLook.rain);
    const g = this.rainLevel.gain;
    g.cancelScheduledValues(now);
    g.setTargetAtTime(level, now, 0.6);
    // The noise only runs while there's rain to hear (and no recording).
    if (level > 0 && !this.rainBed && !this.rainRec) this.rainBed = new NoiseBed(this.ctx, noiseBuffers(this.ctx).hiss, this.rainIn, at);
    if (this.rainBed && ((level === 0 && g.value < 0.002) || this.rainRec)) {
      this.rainBed.stop();
      this.rainBed = null;
    }
    this.rainBed?.tick(at);
    if (!on || !patter || this.rainRec) return;
    for (const d of rainDrops(dt, patter)) {
      noise(this.ctx, this.layers.rain, at + d, { gain: between(Math.random, 0.02, 0.06), decay: between(Math.random, 0.008, 0.02), type: "bandpass", freq: between(Math.random, 2500, 6000), q: 1.5 });
    }
  }

  // ---- Birds ----------------------------------------------------------------------

  birdTick(at, dt) {
    const rates = birdRates(this.engine.settings.birdDensity, this.scape?.dusk ?? 0, weatherLook.rain);
    for (const { bird, delay } of birdsToStart(dt, rates, this.calls)) this.birdCall(bird, at + delay);
  }

  // The ducks and swans on the ponds near the camera.
  fowlTick(at, dt) {
    const fowl = this.scape.fowl;
    const L = this.engine.listener;
    for (const { i, delay } of fowlToStart(dt, fowl, L.pos, this.engine.settings.birdDensity, this.fowlCalls)) this.fowlCall(fowl[i], at + delay);
  }

  // One duck's quacks or a swan's grunt, from where it sits on the water:
  // one of the recordings of its kind, or made up. preview: the Sound
  // panel's button, as a bird's.
  fowlCall(bird, t, { preview = false } = {}) {
    const L = this.engine.listener;
    const d = Math.hypot(bird.at[0] - L.pos[0], bird.at[1] - L.pos[1], bird.at[2] - L.pos[2]);
    const chain = this.engine.chain({
      gain: FOWL_LEVEL * distanceGain(d, FOWL[bird.kind]?.ref ?? 12),
      cutoff: airCutoff(d),
      pan: d < 2 ? 0 : panFor(L.pos, L.right, bird.at),
      to: preview ? this.engine.ambience : this.layers.birds,
    });
    let end;
    const rec = this.engine.recordings.pick(bird.kind === "swan" ? "swans" : "ducks");
    if (rec) {
      const v = recordingVariation();
      end = this.engine.playBuffer(rec, chain.input, t, { rate: v.rate, gain: v.gain });
    } else {
      const call = fowlCall(bird.kind);
      end = Math.max(birdCall(this.ctx, chain.input, t, call), t + callLength(call));
    }
    this.fowlCalls++;
    this.engine.release(chain, end, () => this.fowlCalls--);
  }

  // One call, from somewhere round about: a synthesized bird, or one of the
  // recordings now and then. preview: the Sound panel's button,
  // straight to the Background volume, whether or not the birds are on
  // or a scene is showing.
  birdCall(bird, t, { preview = false } = {}) {
    const ctx = this.ctx;
    const place = birdPlace(bird);
    const chain = this.engine.chain({
      gain: BIRD_LEVEL * distanceGain(place.distance, 25),
      cutoff: airCutoff(place.distance),
      pan: place.pan,
      to: preview ? this.engine.ambience : this.layers.birds,
    });
    let end;
    const rec = this.engine.recordings.pick("birds");
    if (rec) {
      const v = recordingVariation();
      end = this.engine.playBuffer(rec, chain.input, t, { rate: v.rate, gain: v.gain * 1.4 });
    } else {
      const call = birdRecipe(bird);
      end = birdCall(ctx, chain.input, t, call);
      end = Math.max(end, t + callLength(call));
    }
    this.calls++;
    this.engine.release(chain, end, () => this.calls--);
  }
}

// ---- Water ----------------------------------------------------------------------------

// One stretch of water: gentle lapping (a band of noise, swelling and falling)
// and now and then a bubble or a trickle; a stream babbles faster and
// brighter. Heard from where the camera is, louder nearer, from its side.
class WaterVoice {
  constructor(amb, water, t) {
    this.amb = amb;
    this.water = water;
    const ctx = (this.ctx = amb.ctx);
    const engine = amb.engine;
    const stream = water.kind === "stream";
    this.level = ctx.createGain();
    this.level.gain.value = 0;
    this.pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (this.pan) this.level.connect(this.pan).connect(amb.layers.water);
    else this.level.connect(amb.layers.water);
    this.lap = ctx.createGain();
    this.lap.gain.value = 0.4;
    this.lap.connect(this.level);
    // A recording of water, looping - a stream's babbling for a stream, the
    // lapping of still water for a pond or lake, never the one for the
    // other - or the synthesized sound of its kind.
    const rec = engine.recordings.pick(stream ? "stream" : "water");
    if (rec) {
      this.src = ctx.createBufferSource();
      this.src.buffer = rec;
      this.src.loop = true;
      this.src.loopStart = 0;
      this.src.loopEnd = loopLength(rec);
      this.src.playbackRate.value = recordingVariation().rate;
      this.src.connect(this.lap);
      this.recorded = true;
    } else {
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = stream ? between(Math.random, 1300, 2000) : between(Math.random, 500, 800);
      band.Q.value = stream ? 0.7 : 0.9;
      const soft = ctx.createBiquadFilter();
      soft.type = "lowpass";
      soft.frequency.value = stream ? 3500 : 1600;
      const g = ctx.createGain();
      g.gain.value = stream ? 0.3 : 0.7;
      band.connect(soft).connect(g).connect(this.lap);
      this.bed = new NoiseBed(ctx, noiseBuffers(ctx).hiss, band, t);
    }
    if (this.src) this.src.start(t, Math.random() * (this.recorded ? loopLength(this.src.buffer) : this.src.buffer.duration));
    this.nextSwell = t;
    this.nearest = null;
  }

  // Louder as the camera comes near, from its side; lapping and bubbles
  // scheduled a moment ahead.
  tick(at, dt, on) {
    if (this.dead) return;
    this.bed?.tick(at);
    const engine = this.amb.engine;
    const L = engine.listener;
    const w = this.water;
    const { distance, point } = distanceToWater(w.points, L.pos[0], L.pos[2]);
    const level = on ? waterLevel(distance, L.pos[1] - w.y, w.kind) : 0;
    this.level.gain.setTargetAtTime(level * (this.recorded ? 0.7 : 1), at, 0.3);
    if (this.pan) this.pan.pan.setTargetAtTime(distance < 2 ? 0 : panFor(L.pos, L.right, [point[0], w.y, point[1]]), at, 0.3);
    if (level < 0.004 || this.recorded) return;
    // The lapping: a swell every second or so.
    if (at >= this.nextSwell) {
      const s = lapSwell(w.kind);
      const g = this.lap.gain;
      g.setTargetAtTime(s.peak, at, s.rise / 3);
      g.setTargetAtTime(s.trough, at + s.rise, s.fall / 3);
      this.nextSwell = at + s.rise + s.fall;
    }
    // Bubbles and trickles, each a tiny rising tone.
    for (const d of waterBlips(dt, w.kind)) {
      const stream = w.kind === "stream";
      const f = between(Math.random, stream ? 700 : 350, stream ? 2200 : 1100);
      bubble(this.ctx, this.level, at + d, { gain: between(Math.random, 0.05, stream ? 0.18 : 0.14), freq: f, to: f * between(Math.random, 1.5, 2.6), decay: between(Math.random, 0.012, 0.035) });
    }
  }

  // Away quietly (the recordings came in): no click.
  fadeOut() {
    this.dead = true;
    this.level.gain.cancelScheduledValues(this.ctx.currentTime);
    this.level.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
    setTimeout(() => this.stop(), 800);
  }

  stop() {
    this.dead = true;
    try {
      this.src?.stop();
    } catch {
      // Never started, or already stopped.
    }
    this.bed?.stop();
    this.level.disconnect();
    this.pan?.disconnect();
  }
}

// ---- Noise that never repeats ----------------------------------------------------------

// A never-ending stretch of noise for the background, into `out`: a few
// seconds of a long noise buffer from a random point, then a crossfade to
// another random point, and so on. A plain loop would come round to the
// same stretch every few seconds, and be heard doing it for hours however
// much the level wandered over it. One or two sources at a time, each let
// go when it's done. tick(t) from the timer, a moment ahead.
class NoiseBed {
  constructor(ctx, buffer, out, t) {
    this.ctx = ctx;
    this.buffer = buffer;
    this.out = out;
    this.cur = null;
    this.next = t;
    this.tick(t);
  }

  tick(t) {
    if (this.stopped || t < this.next) return;
    const ctx = this.ctx;
    t = Math.max(t, ctx.currentTime);
    const src = ctx.createBufferSource();
    src.buffer = this.buffer;
    // Looping only as a safety net: it's moved on well before it gets round.
    src.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    src.connect(gain).connect(this.out);
    const first = !this.cur;
    // The very first starts under the scene's own fade in.
    if (first) gain.gain.value = 1;
    else gain.gain.setValueCurveAtTime(FADE_IN, t, XFADE);
    src.start(t, Math.random() * this.buffer.duration);
    const old = this.cur;
    if (old) {
      old.gain.gain.setValueCurveAtTime(FADE_OUT, t, XFADE);
      old.src.onended = () => old.gain.disconnect();
      old.src.stop(t + XFADE + 0.05);
    }
    this.cur = { src, gain };
    this.next = t + between(Math.random, 3, 8);
  }

  stop() {
    this.stopped = true;
    const cur = this.cur;
    this.cur = null;
    if (!cur) return;
    try {
      cur.src.stop();
    } catch {
      // Already stopped.
    }
    cur.gain.disconnect();
  }
}
