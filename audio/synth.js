// Web Audio building blocks for the game's sounds: a burst of filtered
// noise (or of sparse crackle), a tone that glides and dies away, a set of
// ringing partials or modes, a short tail of the space round a sound. Every
// sound is made of these, fresh each time, from a recipe in params.mjs.
//
// Each block starts its own nodes at time `t` and stops them once they've
// died away, so nothing is left running; the caller's output node is let go
// a moment after the whole sound has finished (engine.js).

// Noise to filter, made once per audio context: two seconds of white noise
// for the short sounds, started at a random point each time so no two
// bursts are the same stretch; and for the background, longer stretches of
// white noise and of a darker, rumbling noise (for wind), which it plays a
// few seconds at a time from random points (layers.js NoiseBed), so it
// never repeats.
const buffers = new WeakMap();
export function noiseBuffers(ctx) {
  let b = buffers.get(ctx);
  if (b) return b;
  const white = whiteNoise(ctx, 1, 2);
  // Brown-ish (each sample a little on from the last): stereo, so the two
  // sides move independently. Made to loop without a click by fading the
  // join.
  const brown = ctx.createBuffer(2, Math.floor(ctx.sampleRate * 13), ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = brown.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      d[i] = last * 3.5;
    }
    const fade = Math.floor(ctx.sampleRate * 0.05);
    for (let i = 0; i < fade; i++) {
      const k = i / fade;
      d[d.length - fade + i] = d[d.length - fade + i] * (1 - k) + d[i] * k;
    }
  }
  b = { white, brown, hiss: whiteNoise(ctx, 2, 9), crackle: crackle(ctx, 2) };
  buffers.set(ctx, b);
  return b;
}

function whiteNoise(ctx, channels, seconds) {
  const buf = ctx.createBuffer(channels, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  for (let ch = 0; ch < channels; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return buf;
}

// Sparse clicks of random size and sign, a few hundred a second: through
// a band-pass, the crunch of sand grains or grit rather than a smooth hiss.
// Made loud enough (each click a whole sample) to sit level with the white
// noise through the same filter.
function crackle(ctx, seconds) {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const d = buf.getChannelData(0);
  const rate = 900 / ctx.sampleRate;
  for (let i = 0; i < d.length; i++) if (Math.random() < rate) d[i] = (Math.random() < 0.5 ? -1 : 1) * (0.3 + 0.7 * Math.random()) * 4;
  return buf;
}

// A short tail of the space round a sound: a few hundred ms of noise
// dying away and dulling as it goes, as sound comes back off the ground,
// the bay's walls and nearby trees - a convolution reverb's impulse
// response, made once per context. Scaled so the tail comes out about as
// loud as what goes in; a sound sets how much of it to add.
const rooms = new WeakMap();
function roomResponse(ctx) {
  let buf = rooms.get(ctx);
  if (buf) return buf;
  const sr = ctx.sampleRate;
  buf = ctx.createBuffer(1, Math.floor(sr * 0.35), sr);
  const d = buf.getChannelData(0);
  let low = 0;
  let energy = 0;
  for (let i = 0; i < d.length; i++) {
    const s = i / sr;
    // Duller as it goes: a smoothing that grows with time.
    const k = Math.min(0.95, 0.15 + s * 6);
    low = low * k + (Math.random() * 2 - 1) * (1 - k);
    // A first reflection off the ground, then the diffuse tail.
    d[i] = (s > 0.004 ? low : 0) * Math.exp(-s / 0.04) + (i === Math.floor(sr * 0.0035) ? 0.4 : 0);
    energy += d[i] * d[i];
  }
  const norm = 1 / Math.sqrt(energy || 1);
  for (let i = 0; i < d.length; i++) d[i] *= norm;
  rooms.set(ctx, buf);
  return buf;
}

// Where a sound with a room tail plays into: a node that goes straight to
// `out` and, `gain` down, through the tail to it too. Returns the node and
// when the tail is over. With no convolver (an old browser), just `out`.
export function withRoom(ctx, out, t, room) {
  if (!(room?.gain > 0) || !ctx.createConvolver) return { node: out, end: t };
  const dry = ctx.createGain();
  const conv = ctx.createConvolver();
  conv.normalize = false;
  conv.buffer = roomResponse(ctx);
  const wet = ctx.createGain();
  wet.gain.value = room.gain;
  dry.connect(out);
  dry.connect(conv).connect(wet).connect(out);
  return { node: dry, end: t + 0.35 };
}

// An envelope: up to `gain` over `attack`, then an exponential fade with
// time constant `decay` (about -60 dB after seven of them). Returns the
// gain node and when it's silent.
export function envelope(ctx, t, { gain = 1, attack = 0.002, decay = 0.05 }) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(Math.max(0, gain), t + attack);
  g.gain.setTargetAtTime(0, t + attack, Math.max(0.001, decay));
  return { node: g, end: t + attack + decay * 7 };
}

// Filtered noise. type: "bandpass", "lowpass" or "highpass" at `freq`
// (gliding to `freqTo` over `sweep` seconds), `q` its sharpness; `hp`
// takes out what's below it as well (for a band with soft edges), and
// `crackle` plays sparse clicks rather than a hiss (sand, grit).
export function noise(ctx, out, t, { gain, attack = 0.001, decay, type = "bandpass", freq = 1000, freqTo = null, sweep = 0.2, q = 1, dark = false, hp = null, crackle = false }) {
  if (!(gain > 0)) return t;
  const bufs = noiseBuffers(ctx);
  const src = ctx.createBufferSource();
  src.buffer = crackle ? bufs.crackle : dark ? bufs.brown : bufs.white;
  // Looping, so a long burst started late in the buffer carries on rather
  // than stopping dead when it runs out (random noise loops unheard).
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (freqTo) f.frequency.exponentialRampToValueAtTime(Math.max(20, freqTo), t + sweep);
  f.Q.value = q;
  const env = envelope(ctx, t, { gain, attack, decay });
  let last = src.connect(f);
  if (hp) {
    const h = ctx.createBiquadFilter();
    h.type = "highpass";
    h.frequency.value = hp;
    h.Q.value = 0.7;
    last = last.connect(h);
  }
  last.connect(env.node).connect(out);
  src.start(t, Math.random() * src.buffer.duration);
  src.stop(env.end + 0.02);
  return env.end;
}

// A tone gliding from `freq` to `to` over `glide` seconds.
export function tone(ctx, out, t, { gain, freq, to = null, glide = 0.05, attack = 0.001, decay, type = "sine" }) {
  if (!(gain > 0)) return t;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + glide);
  const env = envelope(ctx, t, { gain, attack, decay });
  osc.connect(env.node).connect(out);
  osc.start(t);
  osc.stop(env.end + 0.02);
  return env.end;
}

// Ringing partials (metal, plastic, wood): sines at `freqs` with `gains`,
// the higher ones dying away a little quicker.
export function partials(ctx, out, t, { freqs, gains = null, gain = 1, decay }) {
  let end = t;
  freqs.forEach((f, i) => {
    const g = (gains ? gains[i] : 1 / (i + 1)) * gain;
    end = Math.max(end, tone(ctx, out, t, { gain: g, freq: f, attack: 0.0008, decay: decay / (1 + i * 0.25) }));
  });
  return end;
}

// ---- The sounds of a shot -------------------------------------------------------------

// The ball struck (params.mjs strikeRecipe): the crack of face and ball,
// the head's modes ringing out from a hair after it (the strike's lag),
// each a sine dying away at its own rate; a short low thud; the turf a
// moment later; and a short tail of the space round it all. Returns when
// it's over.
export function strike(ctx, out, t, r) {
  const room = withRoom(ctx, out, t, r.room);
  const into = room.node;
  let end = room.end;
  const ringAt = t + (r.character?.lag ?? 0);
  for (const m of r.modes ?? []) end = Math.max(end, tone(ctx, into, ringAt, { gain: m.gain, freq: m.freq, attack: 0.0004, decay: m.decay }));
  if (r.click) end = Math.max(end, noise(ctx, into, t, { gain: r.click.gain, type: "bandpass", freq: r.click.band, q: r.click.q, attack: 0.0002, decay: r.click.decay }));
  if (r.thud) end = Math.max(end, tone(ctx, into, t, { gain: r.thud.gain, freq: r.thud.freq, to: r.thud.to, glide: r.thud.decay * 1.5, attack: 0.0008, decay: r.thud.decay }));
  if (r.turf) end = Math.max(end, noise(ctx, into, t + r.turf.at, { gain: r.turf.gain, type: "lowpass", freq: r.turf.lp, hp: r.turf.hp, q: 0.6, attack: r.turf.attack, decay: r.turf.decay }));
  return end;
}

// The ball landing (params.mjs landRecipe).
export function land(ctx, out, t, r) {
  const room = withRoom(ctx, out, t, r.room);
  const into = room.node;
  let end = room.end;
  if (r.thump) end = Math.max(end, tone(ctx, into, t, { gain: r.thump.gain, freq: r.thump.freq, to: r.thump.to, glide: r.thump.decay * 1.5, attack: 0.002, decay: r.thump.decay }));
  // The thud: low noise, up to about `lp`, but not the very lowest (a deep
  // boom a small speaker can't play, and a big one overdoes).
  if (r.thud) end = Math.max(end, noise(ctx, into, t, { gain: r.thud.gain, type: "lowpass", freq: r.thud.lp, hp: 110, q: 0.6, attack: 0.002, decay: r.thud.decay }));
  // A hard contact and the ball ringing - again, quieter, for each skip.
  const hit = (at, k) => {
    if (r.click) end = Math.max(end, noise(ctx, into, at, { gain: r.click.gain * k, type: "bandpass", freq: r.click.band, q: r.click.q, attack: 0.0002, decay: r.click.decay }));
    for (const m of r.modes ?? []) end = Math.max(end, tone(ctx, into, at, { gain: m.gain * k, freq: m.freq, attack: 0.0004, decay: m.decay }));
  };
  hit(t, 1);
  for (const s of r.skitter ?? []) hit(t + s.at, s.gain);
  if (r.swish) end = Math.max(end, noise(ctx, into, t, { gain: r.swish.gain, type: "bandpass", freq: r.swish.band, q: r.swish.q, attack: r.swish.attack, decay: r.swish.decay }));
  if (r.crunch) end = Math.max(end, noise(ctx, into, t, { gain: r.crunch.gain, type: "bandpass", freq: r.crunch.band, q: r.crunch.q, attack: r.crunch.attack, decay: r.crunch.decay, crackle: true }));
  for (const g of r.grains ?? []) end = Math.max(end, noise(ctx, into, t + g.at, { gain: g.gain, type: "bandpass", freq: g.band, q: g.q, attack: 0.003, decay: g.decay }));
  if (r.knock) end = Math.max(end, partials(ctx, into, t, { freqs: r.knock.freqs, gain: r.knock.gain, decay: r.knock.decay }));
  return end;
}

// A bubble: a short tone rising in pitch, as a pocket of air closes.
export function bubble(ctx, out, t, { gain, freq, to, decay = 0.03 }) {
  return tone(ctx, out, t, { gain, freq, to, glide: decay * 1.5, attack: 0.002, decay });
}

// A splash (params.mjs splashRecipe).
export function splash(ctx, out, t, r) {
  let end = bubble(ctx, out, t, { gain: r.plop.gain, freq: r.plop.freq, to: r.plop.to, decay: r.plop.decay });
  end = Math.max(end, noise(ctx, out, t, { gain: r.body.gain, type: "lowpass", freq: r.body.from, freqTo: r.body.to, sweep: r.body.sweep, q: 0.7, attack: 0.004, decay: r.body.decay }));
  if (r.spray) end = Math.max(end, noise(ctx, out, t + 0.01, { gain: r.spray.gain, type: "highpass", freq: r.spray.hp, q: 0.5, attack: 0.02, decay: r.spray.decay }));
  for (const d of r.drops) end = Math.max(end, bubble(ctx, out, t + d.at, d));
  return end;
}

// Into the cup (params.mjs cupRecipe): a tap on the liner for a firm one,
// the clunk as it drops, then the rattles.
export function cup(ctx, out, t, r) {
  let tap = t;
  if (r.entry) {
    tap = noise(ctx, out, t, { gain: r.entry.gain, type: "bandpass", freq: r.entry.band, q: 2, attack: 0.0003, decay: r.entry.decay });
    tap = Math.max(tap, partials(ctx, out, t, { freqs: r.clunk.freqs, gain: r.entry.gain * 0.8, decay: r.clunk.decay * 0.5 }));
    t += r.entry.drop;
  }
  const c = r.clunk;
  let end = partials(ctx, out, t, { freqs: c.freqs, gain: c.gain * 0.4, decay: c.decay });
  end = Math.max(end, tone(ctx, out, t, { gain: c.gain * 0.7, freq: c.body, to: c.body * 0.8, glide: 0.05, decay: c.bodyDecay }));
  end = Math.max(end, noise(ctx, out, t, { gain: c.gain * 0.6, type: "bandpass", freq: c.hollow, q: 2.5, decay: 0.03 }));
  end = Math.max(end, noise(ctx, out, t, { gain: c.gain * 0.4, type: "bandpass", freq: 2200, q: 1.2, decay: 0.008 }));
  for (const k of r.rattles) {
    end = Math.max(end, noise(ctx, out, t + k.at, { gain: k.gain, type: "bandpass", freq: k.band, q: 3, decay: k.decay }));
    end = Math.max(end, tone(ctx, out, t + k.at, { gain: k.gain * 0.3, freq: k.ring, decay: k.decay * 1.8 }));
  }
  return Math.max(end, tap);
}

// A lip-out's tick off the rim (params.mjs lipRecipe).
export function lip(ctx, out, t, r) {
  let end = partials(ctx, out, t, { freqs: r.freqs, gain: 0.7, decay: r.decay });
  end = Math.max(end, noise(ctx, out, t, { gain: 0.5, type: "highpass", freq: r.click, q: 0.7, decay: 0.004 }));
  return end;
}

// The ball teed up or put down for the next shot (engine.js teeUp): a soft,
// woody tick of ball on tee, and a dull touch of turf under it - never the
// same twice (a little higher or lower each time).
export function teeUp(ctx, out, t) {
  const k = 0.9 + Math.random() * 0.2;
  let end = noise(ctx, out, t, { gain: 0.5, type: "bandpass", freq: 2300 * k, q: 3, decay: 0.012 });
  end = Math.max(end, tone(ctx, out, t, { gain: 0.35, freq: 520 * k, to: 380 * k, glide: 0.03, decay: 0.035 }));
  end = Math.max(end, noise(ctx, out, t + 0.004, { gain: 0.25, type: "lowpass", freq: 600, decay: 0.05, dark: true }));
  return end;
}

// A bird's call (ambience.mjs birdCall): one voice for the whole call,
// its pitch and loudness moved note by note.
export function birdCall(ctx, out, t, call) {
  const osc = ctx.createOscillator();
  osc.type = call.wave === "sawtooth" ? "sawtooth" : "sine";
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0, t);
  let end = t;
  for (const n of call.notes) {
    const a = t + n.at;
    const b = a + n.dur;
    osc.frequency.setValueAtTime(n.from, a);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, n.to), b);
    const rise = Math.min(0.02, n.dur * 0.25);
    amp.gain.setValueAtTime(0, a);
    amp.gain.linearRampToValueAtTime(n.gain, a + rise);
    amp.gain.setValueAtTime(n.gain, Math.max(a + rise, b - n.dur * 0.35));
    amp.gain.linearRampToValueAtTime(0, b);
    end = Math.max(end, b);
  }
  const nodes = [osc];
  let voice = osc;
  if (call.formants) {
    // A crow's caw: a buzzing saw through the formants of its throat.
    const mix = ctx.createGain();
    // The formants let little of the saw through: made up here, so a crow
    // is heard about as well as the other birds.
    mix.gain.value = 4;
    for (const [i, f] of call.formants.entries()) {
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = f;
      bp.Q.value = 4 + i;
      voice.connect(bp).connect(mix);
    }
    voice = mix;
  }
  voice.connect(amp);
  if (call.trill || call.buzz) {
    // A warble's flutter in pitch; a caw's rasp in loudness.
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.type = call.buzz ? "square" : "sine";
    lfo.frequency.value = call.trill?.rate ?? call.buzz;
    if (call.trill) {
      depth.gain.value = call.notes[0].from * call.trill.depth;
      lfo.connect(depth).connect(osc.frequency);
    } else {
      const rasp = ctx.createGain();
      rasp.gain.value = 0.6;
      depth.gain.value = 0.4;
      voice.disconnect();
      voice.connect(rasp).connect(amp);
      lfo.connect(depth).connect(rasp.gain);
    }
    nodes.push(lfo);
  }
  let harmonic = null;
  if (call.harmonic) {
    // A cuckoo's softer, rounder note: a little of the octave above.
    harmonic = ctx.createOscillator();
    const hg = ctx.createGain();
    hg.gain.value = call.harmonic;
    for (const n of call.notes) {
      harmonic.frequency.setValueAtTime(n.from * 2, t + n.at);
      harmonic.frequency.exponentialRampToValueAtTime(n.to * 2, t + n.at + n.dur);
    }
    harmonic.connect(hg).connect(amp);
    nodes.push(harmonic);
  }
  amp.connect(out);
  for (const n of nodes) {
    n.start(t);
    n.stop(end + 0.05);
  }
  return end;
}
