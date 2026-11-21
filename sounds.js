// Short sounds for finishing a hole. The good ones are a real crowd round
// the green (the owner, 16 October 2026: "more of like a crowd cheer than a
// fake synthesized noise"), bigger the better the score: applause for a
// birdie, two cheers with applause under them for an eagle, and the whole
// gallery roaring for an ace or an albatross - recordings, the game's own
// (public/soundpack's applause, crowd and roar) or the owner's in the
// sounds folder's. With recordings
// off (the Sound panel), they're made up instead: a fanfare for an ace, a
// smaller one for an eagle, a rising arpeggio for a birdie. A par gets a
// soft chime, and a bogey and worse low, muffled tones that get quieter and
// duller, synthesized with WebAudio. Plus the pop of a firework, a crowd
// cheering a new record in practice, and a heartbeat while a streak closes
// on the best.
//
// They play through the game's sound engine (audio/engine.js): its audio
// context, which starts on the first key press or click (the Windows app is
// allowed from the start), and its effects bus, so the Sound settings - on
// and off, the volumes - apply to them as to every other sound. They have
// their own on/off too, the engine's Celebrations setting (the course's
// and Challenges' Sounds box). If there's no audio at all, every call
// quietly does nothing.

import { audio } from "./audio/engine.js";
import { celebrationFx } from "./celebrationfx.js";
import { soundWithEffects, CROWDS } from "./sim/celebration.mjs";

// Note frequencies, Hz.
const NOTE = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196,
  G4: 392, C5: 523.25, E5: 659.25, G5: 783.99, B5: 987.77, C6: 1046.5, E6: 1318.51, G6: 1567.98,
};

export class Sounds {
  // enabled: this set of sounds on or off by itself (sound as a whole is
  // the engine's setting). engine: the sound engine (the page's own).
  constructor({ enabled = true, engine = audio } = {}) {
    this.enabled = enabled;
    this.engine = engine;
    // The buses of the sounds still playing, so they can be cut short.
    this.live = new Set();
    // Celebrations turned off: whatever is playing stops too.
    engine.watch?.((s) => !s.celebrations && this.stopAll());
  }

  get ctx() {
    return this.engine.ctx;
  }

  setEnabled(on) {
    this.enabled = on;
    if (on) this.unlock();
    else this.stopAll();
  }

  unlock() {
    if (this.enabled) this.engine.unlock();
  }

  get on() {
    return this.enabled && this.engine.settings?.celebrations !== false && !!this.engine.ready;
  }

  // Plays one of the sounds below at a volume 0-1. Never throws. With the
  // celebration effects off, only the crowd: the rest stay quiet, and the
  // crowd with no recording is the made-up cheer, not a fanfare.
  play(name, volume = 1) {
    if (!this.enabled || this.engine.settings?.celebrations === false) return;
    const crowdOnly = !celebrationFx.on;
    if (!soundWithEffects(name, !crowdOnly)) return;
    try {
      if (!this.engine.ready) return;
      const ctx = this.engine.ctx;
      const recipe = RECIPES[name];
      if (!recipe) return;
      const bus = ctx.createGain();
      bus.gain.value = Math.max(0, Math.min(1, volume)) * 0.85;
      bus.connect(this.engine.celebrations);
      // A recipe may say how long it lasts (a cheer, a recording).
      const lasts = recipe(this, bus, ctx.currentTime + 0.02, { crowdOnly });
      this.live.add(bus);
      // Let the bus go once it has played out.
      setTimeout(
        () => {
          this.live.delete(bus);
          bus.disconnect();
        },
        Math.max(5, (Number(lasts) || 0) + 0.5) * 1000,
      )?.unref?.();
    } catch {
      // Sound is a nicety; never let it break the game.
    }
  }

  // A crowd: "big" roars for a new record, "small" cheers each success on a
  // record run after it. A recording from the crowd folder when there is
  // one (a small cheer is its first couple of seconds, faded out).
  cheer(size = "big") {
    this.play(size === "big" ? "cheerBig" : "cheerSmall", size === "big" ? 1 : 0.75);
  }

  // A heartbeat, beat after beat until stopped (or changed): bpm beats a
  // minute at gain (0 - 1), starting after `delay` seconds - once the last
  // try's celebration has had its moment. Not cut short by a celebration
  // being cleared (the next putt's strike): it plays on through the try.
  heartbeat({ bpm = 90, gain = 0.7, delay = 0 } = {}) {
    if (!this.on || !celebrationFx.on) return this.stopHeartbeat();
    const ctx = this.ctx;
    const h = (this.beat ??= { bus: null, next: 0, timer: null });
    h.period = 60 / Math.max(30, Math.min(200, bpm));
    h.gain = Math.max(0, Math.min(1, gain));
    try {
      if (!h.bus) {
        h.bus = ctx.createGain();
        h.bus.connect(this.engine.celebrations);
        h.next = ctx.currentTime + Math.max(0, delay);
      }
      h.bus.gain.setTargetAtTime(h.gain * 0.9, ctx.currentTime, 0.2);
    } catch {
      return;
    }
    // Beats are laid down a little ahead of time, so a busy frame never
    // leaves a gap.
    if (!h.timer) {
      h.timer = setInterval(() => {
        try {
          if (!this.on) return this.stopHeartbeat();
          while (h.next < ctx.currentTime + 0.3) {
            if (h.next >= ctx.currentTime - 0.05) RECIPES.heartbeat(this, h.bus, h.next, h.period);
            h.next += h.period;
          }
        } catch {
          this.stopHeartbeat();
        }
      }, 100);
      h.timer.unref?.();
    }
  }

  stopHeartbeat() {
    const h = this.beat;
    if (!h) return;
    this.beat = null;
    clearInterval(h.timer);
    try {
      const now = this.ctx.currentTime;
      h.bus?.gain.cancelScheduledValues(now);
      h.bus?.gain.setTargetAtTime(0, now, 0.08);
      setTimeout(() => h.bus?.disconnect(), 600)?.unref?.();
    } catch {
      // Already gone.
    }
  }

  get heartbeatOn() {
    return !!this.beat;
  }

  // Cuts short everything still playing, with a quick fade rather than a
  // click: the celebration it belonged to has been cleared (N, a new shot,
  // another mode), so its fanfare shouldn't carry on over what comes next.
  stopAll() {
    const ctx = this.ctx;
    if (!ctx || !this.live.size) return;
    const now = ctx.currentTime;
    for (const bus of this.live) {
      try {
        bus.gain.cancelScheduledValues(now);
        bus.gain.setValueAtTime(bus.gain.value, now);
        bus.gain.linearRampToValueAtTime(0, now + 0.08);
        setTimeout(() => bus.disconnect(), 150)?.unref?.();
      } catch {
        // Already gone.
      }
    }
    this.live.clear();
  }

  // ---- Building blocks -------------------------------------------------------

  // One note: an oscillator through an optional low-pass filter, with a
  // quick attack and an exponential fade.
  tone(out, at, { freq, type = "sine", dur = 0.4, gain = 0.3, attack = 0.01, glideTo = null, cutoff = null, cutoffTo = null, vibrato = 0 }) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, at + dur);
    let node = osc;
    if (cutoff) {
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.setValueAtTime(cutoff, at);
      if (cutoffTo) f.frequency.exponentialRampToValueAtTime(cutoffTo, at + Math.min(dur, 0.3));
      node.connect(f);
      node = f;
    }
    if (vibrato) {
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = 5.5;
      depth.gain.value = freq * vibrato;
      lfo.connect(depth).connect(osc.frequency);
      lfo.start(at);
      lfo.stop(at + dur + 0.05);
    }
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(gain, at + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    node.connect(env).connect(out);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }

  // A bell: a sine and its inharmonic partial, ringing on.
  bell(out, at, freq, gain = 0.25, dur = 1.2) {
    this.tone(out, at, { freq, dur, gain, attack: 0.005 });
    this.tone(out, at, { freq: freq * 2.76, dur: dur * 0.5, gain: gain * 0.35, attack: 0.005 });
  }

  // A brass-ish note: a sawtooth whose filter opens as it's blown.
  brass(out, at, freq, dur, gain = 0.22) {
    this.tone(out, at, { freq, type: "sawtooth", dur, gain, attack: 0.04, cutoff: 700, cutoffTo: 3200, vibrato: dur > 0.5 ? 0.006 : 0 });
    this.tone(out, at, { freq: freq * 1.003, type: "sawtooth", dur, gain: gain * 0.6, attack: 0.05, cutoff: 600, cutoffTo: 2400 });
  }

  // A wall of voices: noise in a band, swelling in, wavering as a crowd
  // does, and dying away - dur seconds.
  roar(out, at, { dur = 3, gain = 0.2, band = 800, q = 1, swell = 0.35, waver = 5 }) {
    const ctx = this.ctx;
    this.noise(out, at, { dur: 0, gain: 0 }); // makes the noise buffer
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = band;
    f.Q.value = q;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(gain, at + swell);
    env.gain.setValueAtTime(gain, at + dur * 0.45);
    env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    // The waver: voices coming and going.
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    const wave = ctx.createGain();
    lfo.frequency.value = waver * (0.8 + Math.random() * 0.4);
    depth.gain.value = 0.3;
    wave.gain.value = 0.7;
    lfo.connect(depth).connect(wave.gain);
    src.connect(f).connect(wave).connect(env).connect(out);
    src.start(at, Math.random() * 0.5);
    src.stop(at + dur + 0.05);
    lfo.start(at);
    lfo.stop(at + dur + 0.05);
  }

  noise(out, at, { dur = 0.3, gain = 0.3, band = 1200, q = 0.8 }) {
    const ctx = this.ctx;
    if (!dur) {
      // Only making sure the buffer's there.
      if (this.noiseBuffer) return;
    }
    if (!this.noiseBuffer) {
      const len = Math.floor(ctx.sampleRate * 1);
      this.noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    if (!dur) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = band;
    f.Q.value = q;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(gain, at + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(f).connect(env).connect(out);
    src.start(at, Math.random() * 0.5);
    src.stop(at + dur + 0.05);
  }

  // One of a kind's recordings (the applause, the crowd, the roar), if
  // there are any: played into out at t, for at most `max` seconds (faded
  // out), at `rate` (a touch higher or lower). Its length, or null.
  recording(family, out, t, { max = Infinity, gain = 1, rate = 1 } = {}) {
    const rec = this.engine.recordings?.pick?.(family);
    if (!rec || !this.engine.playBuffer) return null;
    const whole = rec.duration / rate;
    const lasts = Math.min(whole, max);
    const fade = this.ctx.createGain();
    fade.gain.setValueAtTime(gain, t);
    if (lasts < whole) {
      fade.gain.setValueAtTime(gain, t + Math.max(0, lasts - 0.6));
      fade.gain.linearRampToValueAtTime(0.0001, t + lasts);
    }
    fade.connect(out);
    this.engine.playBuffer(rec, fade, t, { rate });
    return lasts;
  }

  // One of the crowd recordings, if there are any (see recording).
  crowd(out, t, opts) {
    return this.recording("crowd", out, t, opts);
  }

  // A gallery: several recordings at once, each [family, gain, delay, max,
  // pan] - the first leading, the rest joining in a moment later from
  // either side, so a few recordings sound like a crowd all round the
  // green. Its length - or null with no recording to lead it (recordings
  // off), for the made-up sound instead.
  gallery(out, t, layers) {
    let lasts = null;
    for (const [family, gain, delay, max, pan = 0] of layers) {
      let into = out;
      const panner = pan ? this.ctx.createStereoPanner?.() : null;
      if (panner) {
        panner.pan.value = pan;
        panner.connect(out);
        into = panner;
      }
      const l = this.recording(family, into, t + delay, { gain, max: max - delay, rate: 0.97 + Math.random() * 0.06 });
      if (l == null && lasts == null) return null;
      if (l != null) lasts = Math.max(lasts ?? 0, delay + l);
    }
    return lasts;
  }
}

// Each sound, from the grandest down to the dullest.
const RECIPES = {
  // An ace or an albatross: the whole gallery, from all round (two roars,
  // cheers on top, applause under it all: sim/celebration.mjs CROWDS) - or,
  // with no recordings, the grand fanfare. (Each no longer than the
  // banner's up.) (With the effects off, the made-up crowd rather than a
  // fanfare.)
  roar(s, out, t, { crowdOnly = false } = {}) {
    return s.gallery(out, t, CROWDS.roar) ?? (crowdOnly ? crowdCheer(s, out, t, 6, 1) : RECIPES.grand(s, out, t));
  },
  // An eagle: two cheers with applause under them, or the short fanfare.
  cheer(s, out, t, { crowdOnly = false } = {}) {
    return s.gallery(out, t, CROWDS.cheer) ?? (crowdOnly ? crowdCheer(s, out, t, 4.5, 0.8) : RECIPES.fanfare(s, out, t));
  },
  // A birdie: a round of applause, or the bright arpeggio.
  applause(s, out, t, { crowdOnly = false } = {}) {
    return s.gallery(out, t, CROWDS.applause) ?? (crowdOnly ? crowdCheer(s, out, t, 3, 0.5) : RECIPES.arpeggio(s, out, t));
  },
  // Made up (recordings off), and the Challenges' own: an ace or an
  // albatross, a drum roll into a full fanfare, bells on top.
  grand(s, out, t) {
    for (let i = 0; i < 10; i++) s.tone(out, t + i * 0.045, { freq: 90, dur: 0.12, gain: 0.18 + i * 0.02, attack: 0.003 });
    const f = t + 0.45;
    s.brass(out, f, NOTE.G4, 0.14);
    s.brass(out, f + 0.16, NOTE.G4, 0.14);
    s.brass(out, f + 0.32, NOTE.G4, 0.14);
    s.brass(out, f + 0.48, NOTE.C5, 0.5);
    s.brass(out, f + 0.98, NOTE.G4, 0.2);
    for (const n of [NOTE.C5, NOTE.E5, NOTE.G5]) s.brass(out, f + 1.2, n, 1.5, 0.16);
    s.tone(out, f + 1.2, { freq: 65.4, dur: 1.2, gain: 0.35, attack: 0.005 });
    [NOTE.C6, NOTE.E6, NOTE.G6, NOTE.C6 * 2].forEach((n, i) => s.bell(out, f + 1.3 + i * 0.12, n, 0.08, 1.4));
  },
  // An eagle: a short fanfare to a held chord.
  fanfare(s, out, t) {
    s.brass(out, t, NOTE.G4, 0.14);
    s.brass(out, t + 0.16, NOTE.C5, 0.14);
    s.brass(out, t + 0.32, NOTE.E5, 0.14);
    for (const n of [NOTE.C5, NOTE.E5, NOTE.G5]) s.brass(out, t + 0.5, n, 1.1, 0.15);
    [NOTE.E6, NOTE.G6].forEach((n, i) => s.bell(out, t + 0.6 + i * 0.12, n, 0.07, 1.1));
  },
  // A birdie: a bright rising arpeggio with a bell to finish.
  arpeggio(s, out, t) {
    [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((n, i) => {
      s.tone(out, t + i * 0.09, { freq: n, type: "triangle", dur: 0.45, gain: 0.25 });
      s.tone(out, t + i * 0.09, { freq: n / 2, dur: 0.3, gain: 0.1 });
    });
    s.bell(out, t + 0.4, NOTE.E6, 0.1, 1);
  },
  // A par: a soft two-note chime.
  chime(s, out, t) {
    s.bell(out, t, NOTE.E5, 0.2, 1.1);
    s.bell(out, t + 0.14, NOTE.B5, 0.16, 1.2);
  },
  // A bogey: two low notes, falling.
  low(s, out, t) {
    s.tone(out, t, { freq: NOTE.G3, type: "triangle", dur: 0.35, gain: 0.22, cutoff: 900 });
    s.tone(out, t + 0.3, { freq: NOTE.E3, type: "triangle", dur: 0.5, gain: 0.2, cutoff: 800 });
  },
  // A double: lower again, drooping at the end.
  lower(s, out, t) {
    s.tone(out, t, { freq: NOTE.F3, type: "triangle", dur: 0.4, gain: 0.2, cutoff: 600 });
    s.tone(out, t + 0.36, { freq: NOTE.D3, type: "triangle", dur: 0.7, gain: 0.18, cutoff: 500, glideTo: NOTE.D3 * 0.94 });
  },
  // Worse, or picked up: one muffled, sinking note.
  muted(s, out, t) {
    s.tone(out, t, { freq: NOTE.C3, type: "sine", dur: 0.9, gain: 0.2, cutoff: 300, glideTo: NOTE.C3 * 0.85 });
  },
  // A crowd going wild: a roar of voices in a few bands, a couple of
  // whoops, and applause thinning out - or a recording of one.
  cheerBig(s, out, t) {
    return s.crowd(out, t, { max: 8 }) ?? crowdCheer(s, out, t, 4.5, 1);
  },
  // A shorter cheer and a round of applause, for each success on a record
  // run after the one that set it.
  cheerSmall(s, out, t) {
    return s.crowd(out, t, { max: 2.5, gain: 0.8 }) ?? crowdCheer(s, out, t, 2.2, 0.6);
  },
  // One beat: the "lub" and the softer "dub", low thumps with a little
  // body above them so small speakers carry it too. period: the beat's
  // length, which brings the dub in closer as it quickens.
  heartbeat(s, out, t, period = 0.8) {
    if (typeof period !== "number") period = 0.8;
    const dub = Math.min(0.3, period * 0.36);
    for (const [at, g, f] of [
      [t, 1, 62],
      [t + dub, 0.7, 70],
    ]) {
      s.tone(out, at, { freq: f, glideTo: f * 0.68, dur: 0.16, gain: 0.55 * g, attack: 0.006 });
      s.tone(out, at, { freq: f * 2, glideTo: f * 1.3, dur: 0.1, gain: 0.18 * g, attack: 0.004, cutoff: 400 });
    }
  },
  // A firework going off: a thump, a crack, then crackle.
  pop(s, out, t) {
    s.tone(out, t, { freq: 120, dur: 0.25, gain: 0.3, attack: 0.002, glideTo: 50 });
    s.noise(out, t, { dur: 0.35, gain: 0.35, band: 900, q: 0.6 });
    for (let i = 0; i < 6; i++) s.noise(out, t + 0.15 + Math.random() * 0.5, { dur: 0.04, gain: 0.12, band: 3000 + Math.random() * 2000, q: 2 });
  },
};

// The crowd, synthesized: voices in bands swelling and wavering, whoops
// rising over them, and applause - claps thick at first, thinning out.
// size 0 - 1. Its length, seconds.
function crowdCheer(s, out, t, dur, size) {
  for (const [band, q, gain] of [
    [320, 0.9, 0.2],
    [650, 1.1, 0.2],
    [1250, 1.3, 0.14],
    [2500, 1.6, 0.07],
  ]) {
    s.roar(out, t, { dur, gain: gain * (0.6 + 0.4 * size), band: band * (0.95 + Math.random() * 0.1), q, swell: 0.3 + 0.2 * size, waver: 4 + Math.random() * 3 });
  }
  const whoops = Math.round(1 + 3 * size);
  for (let i = 0; i < whoops; i++) {
    const at = t + 0.15 + Math.random() * dur * 0.4;
    const f = 650 + Math.random() * 350;
    s.tone(out, at, { freq: f, glideTo: f * (1.6 + Math.random() * 0.4), dur: 0.45 + Math.random() * 0.3, gain: 0.045, attack: 0.05, vibrato: 0.02 });
  }
  const claps = Math.round(dur * (18 + 30 * size));
  for (let i = 0; i < claps; i++) {
    // Most early on, fewer as it dies away.
    const at = t + 0.1 + Math.pow(Math.random(), 1.6) * dur * 0.95;
    s.noise(out, at, { dur: 0.025 + Math.random() * 0.02, gain: 0.05 + Math.random() * 0.08, band: 1400 + Math.random() * 1400, q: 0.8 });
  }
  return dur;
}

export const SOUND_NAMES = Object.keys(RECIPES);
