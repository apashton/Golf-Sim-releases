// The game's sound: one audio context for the whole page, and the buses
// every sound goes through -
//
//   strike, landing, cup ─┐
//   celebrations (sounds.js) ─ effects ─┐
//   wind, birds, water ─ scene fade ─ ambience ─ duck ─┴─ master ─ limiter ─ speakers
//
// - so the Sound settings (on/off, master, effects and ambience volume, each
// ambience layer) apply to everything, and a gentle limiter at the end
// keeps stacked sounds from ever clipping. The ambience dips a few dB while
// a strike or a landing plays, so the shot always stands out.
//
// Browsers only allow sound after a key press or click, so the context is
// made on the first one (the Windows app is allowed from the start); the
// background starts as soon as it's allowed. Sound is a nicety: if there's
// no audio at all, every call quietly does nothing and never throws.
//
// Recordings - the game's own clips and the owner's (server: /api/sounds) -
// play in each kind of sound's rotation (Recordings, below).

import { inTurn } from "../sim/inturn.mjs";
import { loadSetting, saveSetting } from "../util.js";
import {
  soundSettings,
  firstSoundSettings,
  migrateSoundSettings,
  storedSoundSettings,
  SOUND_SETTINGS_VERSION,
  volumeGain,
  strikeProfile,
  strikeRecipe,
  landingSound,
  landingFamily,
  treeFamily,
  landRecipe,
  treeRecipe,
  splashRecipe,
  cupRecipe,
  lipRecipe,
  impactGain,
  distanceGain,
  airCutoff,
  panFor,
  chooseSource,
  recordingVariation,
} from "./params.mjs";
import * as synth from "./synth.js";
import { Ambience } from "./layers.js";
import { MAX_SOUND_SECONDS } from "./families.mjs";

// How much the ambience dips (dB) under a sound, and for how long (s).
const DUCK_DB = 4;
const DUCK_HOLD = 0.35;
// Quiet strokes (putts, chips) dip the background further, and every dip
// is under way before the sound starts: a putter's tock is over in a tenth
// of a second, so a dip that arrives after it is no help.
const QUIET_DUCK_DB = 10;
const DUCK_LEAD = 0.015;

export class AudioEngine {
  constructor() {
    // The saved settings, brought up to date (and saved again, so that's
    // done once); or, the first time, the defaults with what the old course
    // and Challenges Sounds boxes said about the celebrations.
    const saved = loadSetting("sound", {});
    const hasSaved = Object.keys(saved).length > 0;
    this.settings = hasSaved ? migrateSoundSettings(saved) : firstSoundSettings(loadSetting("course", {}), loadSetting("challenges", {}));
    if (hasSaved && saved.version !== SOUND_SETTINGS_VERSION) saveSetting("sound", storedSoundSettings(this.settings));
    this.ctx = null;
    this.failed = false;
    // Where the sound is heard from: the camera (frame()).
    this.listener = { pos: [0, 1.6, 6], right: [1, 0, 0] };
    this.watchers = new Set();
    this.recordings = new Recordings(this);
    this.wantAmbience = false;
    this.ambienceLayer = null;
    this.scape = null;
    this.hidden = false;
    try {
      const unlock = () => this.unlock();
      window.addEventListener("keydown", unlock, true);
      window.addEventListener("pointerdown", unlock, true);
      // Out of sight (minimised, another window in front of a browser tab):
      // no sound, and no work for the audio thread.
      this.hidden = !!document.hidden;
      document.addEventListener("visibilitychange", () => {
        this.hidden = document.hidden;
        this.applyRunning();
      });
    } catch {
      // No window (the tests): nothing to listen for.
    }
  }

  get on() {
    return this.settings.on;
  }

  // Something to call when the settings or the recordings change (the
  // Sound panel, the speaker button, the course's Sounds box). Returns a
  // function that stops it.
  watch(fn) {
    this.watchers.add(fn);
    return () => this.watchers.delete(fn);
  }
  changed() {
    for (const fn of this.watchers) {
      try {
        fn(this.settings);
      } catch {
        // A watcher's problem is its own.
      }
    }
  }

  // ---- The context and the buses ----------------------------------------------------

  // The audio context, made on first use. Before any key press or click a
  // browser would refuse it (and say so in the console), so it waits for
  // one; the Windows app allows sound without.
  context({ gesture = false } = {}) {
    if (this.ctx || this.failed) return this.ctx;
    const activated = gesture || globalThis.navigator?.userActivation?.hasBeenActive !== false || !!globalThis.golfsimApp;
    if (!activated) return null;
    try {
      const AC = globalThis.AudioContext ?? globalThis.webkitAudioContext;
      if (!AC) throw new Error("no audio");
      // (The phone app's at a lower rate: PHONE_RATE.)
      const ctx = onPhone() ? new AC({ sampleRate: PHONE_RATE }) : new AC();
      const gain = (value, to) => {
        const g = ctx.createGain();
        g.gain.value = value;
        if (to) g.connect(to);
        return g;
      };
      // The limiter: gentle, just catching peaks.
      this.limiter = ctx.createDynamicsCompressor();
      this.limiter.threshold.value = -6;
      this.limiter.ratio.value = 12;
      if (this.limiter.knee) this.limiter.knee.value = 4;
      if (this.limiter.attack) this.limiter.attack.value = 0.002;
      if (this.limiter.release) this.limiter.release.value = 0.2;
      this.limiter.connect(ctx.destination);
      this.master = gain(this.masterGain(), this.limiter);
      this.effects = gain(volumeGain(this.settings.effects, this.settings.effectsMute), this.master);
      // Celebrations (sounds.js): effects, cut short on their own.
      this.celebrations = gain(1, this.effects);
      this.duckGain = gain(1, this.master);
      this.ambience = gain(volumeGain(this.settings.ambience, this.settings.ambienceMute), this.duckGain);
      this.ctx = ctx;
    } catch {
      this.failed = true;
      this.ctx = null;
      return null;
    }
    this.recordings.refresh();
    if (this.wantAmbience) this.startAmbience();
    return this.ctx;
  }

  // The recorder's copy of the game's sound (videorec.js): everything the
  // speakers get - after the Sound settings' volumes and the limiter - also
  // into node, a node of this context. Returns a function that stops it, or
  // null when there's no sound to have.
  tapOutput(node) {
    const ctx = this.context({ gesture: true });
    if (!ctx || !this.limiter || node?.context !== ctx) return null;
    this.limiter.connect(node);
    return () => {
      try {
        this.limiter.disconnect(node);
      } catch {
        // Disconnected already.
      }
    };
  }

  masterGain() {
    return this.settings.on ? volumeGain(this.settings.master) : 0;
  }

  unlock() {
    if (!this.settings.on) return;
    const ctx = this.context({ gesture: true });
    if (ctx) this.applyRunning();
  }

  // Running while sound is on and the page is in sight; otherwise
  // suspended, which costs nothing.
  applyRunning() {
    const ctx = this.ctx;
    if (!ctx) return;
    const run = this.settings.on && !this.hidden;
    try {
      if (run && ctx.state === "suspended") ctx.resume().catch(() => {});
      if (!run && ctx.state === "running") setTimeout(() => !(this.settings.on && !this.hidden) && ctx.suspend?.().catch(() => {}), 200);
    } catch {
      // Not a real context.
    }
  }

  // Ready to make a sound now: on, allowed, and in sight (a sound made
  // while hidden would only come out late, when the page is back).
  get ready() {
    if (!this.settings.on || this.hidden) return false;
    const ctx = this.context();
    if (!ctx) return false;
    if (ctx.state === "suspended") ctx.resume?.().catch(() => {});
    return true;
  }

  // ---- Settings ----------------------------------------------------------------------

  setOn(on) {
    this.set("on", !!on);
  }
  toggle() {
    this.setOn(!this.settings.on);
    return this.settings.on;
  }

  // Changes one setting (on, master, effects, ambience, effectsMute,
  // ambienceMute, celebrations, strike, wind, birds, water, rain, outdoor,
  // birdDensity, recordings), remembers it and applies it.
  set(key, value) {
    this.settings = soundSettings({ ...this.settings, [key]: value });
    saveSetting("sound", storedSoundSettings(this.settings));
    const ctx = this.ctx;
    if (ctx) {
      const now = ctx.currentTime;
      const glide = (param, v) => {
        param.cancelScheduledValues(now);
        param.setTargetAtTime(v, now, 0.05);
      };
      if (key === "on" || key === "master") glide(this.master.gain, this.masterGain());
      if (key === "effects" || key === "effectsMute") glide(this.effects.gain, volumeGain(this.settings.effects, this.settings.effectsMute));
      if (key === "ambience" || key === "ambienceMute") glide(this.ambience.gain, volumeGain(this.settings.ambience, this.settings.ambienceMute));
      if (["wind", "birds", "water", "rain", "outdoor"].includes(key)) this.ambienceLayer?.setLayer(key, this.settings[key]);
    }
    if (key === "on") {
      if (this.settings.on) this.unlock();
      else this.applyRunning();
    }
    this.changed();
  }

  // ---- The background ----------------------------------------------------------------

  // Wind, birds and water, from when sound is first allowed.
  startAmbience() {
    this.wantAmbience = true;
    if (!this.ctx && this.settings.on) this.context();
    if (!this.ctx || this.ambienceLayer) return;
    try {
      this.ambienceLayer = new Ambience(this);
      if (this.scape) this.ambienceLayer.setScape(this.scape);
    } catch {
      this.ambienceLayer = null;
    }
  }

  // Every frame: where the camera is and which way it faces (for where
  // sounds come from), and the scene on screen (cues.mjs soundscape), whose
  // wind and water the background plays.
  frame(camera, scape) {
    const e = camera?.matrixWorld?.elements;
    if (e) {
      const L = this.listener;
      L.pos[0] = e[12];
      L.pos[1] = e[13];
      L.pos[2] = e[14];
      L.right[0] = e[0];
      L.right[1] = e[1];
      L.right[2] = e[2];
    }
    if (scape && scape !== this.scape) {
      this.scape = scape;
      this.ambienceLayer?.setScape(scape);
    }
  }

  // The background dips a few dB for a moment.
  duck(db = DUCK_DB) {
    const ctx = this.ctx;
    if (!ctx || !(db > 0)) return;
    const g = this.duckGain.gain;
    const now = ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setTargetAtTime(Math.pow(10, -db / 20), now, 0.005);
    g.setTargetAtTime(1, now + DUCK_HOLD, 0.45);
  }

  // ---- Playing a sound ------------------------------------------------------------------

  // Where a point in the world (a THREE.Vector3 or [x, y, z]) is heard from
  // the camera: how loud, how muffled by distance, left or right.
  spatial(at, ref = 15) {
    const p = Array.isArray(at) ? at : [at.x, at.y, at.z];
    const L = this.listener;
    const d = Math.hypot(p[0] - L.pos[0], p[1] - L.pos[1], p[2] - L.pos[2]);
    return { distance: d, gain: distanceGain(d, ref), cutoff: airCutoff(d), pan: panFor(L.pos, L.right, p) };
  }

  // A chain for one sound: its level, the air's muffling and its side,
  // into a bus (the effects unless said).
  chain({ gain = 1, cutoff = null, pan = 0, to = this.effects }) {
    const ctx = this.ctx;
    const input = ctx.createGain();
    input.gain.value = gain;
    const nodes = [input];
    let last = input;
    if (cutoff && cutoff < 17000) {
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = cutoff;
      last = last.connect(f);
      nodes.push(f);
    }
    if (pan && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      last = last.connect(p);
      nodes.push(p);
    }
    last.connect(to);
    return { input, nodes };
  }

  // Lets a chain go once its sound is over (`end`, context time).
  release(chain, end, done = null) {
    const wait = Math.max(0, end - this.ctx.currentTime) + 0.3;
    const t = setTimeout(() => {
      for (const n of chain.nodes) n.disconnect();
      done?.();
    }, wait * 1000);
    t?.unref?.();
  }

  // A recording, at a little higher or lower pitch.
  playBuffer(buffer, out, t, { rate = 1, gain = 1 } = {}) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(g).connect(out);
    src.start(t);
    return t + buffer.duration / rate;
  }

  // Plays a one-off sound: made fresh (make(out, t) returns when it ends),
  // or one of the recordings of its kind (family), when the
  // recordings setting says so. at: where in the
  // world, for its distance and side; duck: how far the background dips.
  fx({ family = null, gain = 1, recGain = gain, at = null, ref = 15, floor = 0, make, duck = 0 }) {
    if (!this.ready) return;
    try {
      const ctx = this.ctx;
      const sp = at ? this.spatial(at, ref) : { gain: 1, cutoff: null, pan: 0 };
      const level = Math.max(sp.gain, floor);
      // The background starts to dip first, then the sound plays into it.
      const ducking = duck && level > 0.2;
      if (ducking) this.duck(duck * Math.min(1, level));
      const t = ctx.currentTime + (ducking ? DUCK_LEAD : 0.01);
      const rec = family ? this.recordings.pick(family) : null;
      const chain = this.chain({ gain: (rec ? recGain : gain) * level, cutoff: sp.cutoff, pan: sp.pan });
      const end = rec ? this.playBuffer(rec, chain.input, t, recordingVariation()) : make(chain.input, t);
      this.release(chain, end);
    } catch {
      // Sound is a nicety; never let it break the game.
    }
  }

  // The ball struck: by the club and the ball speed (and a mishit, when
  // the club data says so). Heard from the tee, where the player is. Only
  // with the Club strike sound on (every club, the putter too), unless
  // `always` (the Sound panel's buttons, so it can be heard and judged).
  strike({ club, speedMph, clubData = null, always = false } = {}) {
    if (!this.settings.strike && !always) return;
    const profile = strikeProfile(club, speedMph, clubData);
    const recipe = strikeRecipe(profile);
    const quiet = profile.kind === "putter" || profile.kind === "chip";
    this.fx({ family: profile.family, gain: 0.5 * profile.gain * recipe.level, recGain: profile.gain, make: (out, t) => synth.strike(this.ctx, out, t, recipe), duck: quiet ? QUIET_DUCK_DB : DUCK_DB + 1 });
  }

  // The ball teed up, or put down on the mat for the next shot, heard from
  // where it is: a recording of it, or a soft, short tick of ball on tee
  // and turf. Always quiet, under everything else.
  teeUp(at = null) {
    this.fx({ family: "tee", gain: 0.22, recGain: 0.55, at, ref: 4, make: (out, t) => synth.teeUp(this.ctx, out, t) });
  }

  // A moment in a shot (cues.mjs shotCues), heard from where the ball is.
  cue(c, at) {
    switch (c.kind) {
      case "land": {
        const sound = landingSound(c.lie);
        if (sound === "splash") return this.cue({ ...c, kind: "splash" }, at);
        const hit = c.impact ?? c.speed;
        // How far off, so a far landing loses its quiet detail.
        const r = landRecipe(sound, hit, c.bounce, Math.random, { distance: at ? this.spatial(at).distance : 0 });
        return this.fx({ family: landingFamily(sound), gain: 0.7 * r.gain * r.level, recGain: impactGain(hit, c.bounce), at, make: (out, t) => synth.land(this.ctx, out, t, r), duck: c.bounce ? 0 : 3 });
      }
      case "splash": {
        const r = splashRecipe(c.speed, c.steep);
        return this.fx({ family: "splash", gain: 0.4 * r.gain, recGain: r.gain, at, ref: 20, make: (out, t) => synth.splash(this.ctx, out, t, r), duck: 3 });
      }
      case "cup": {
        const r = cupRecipe(c.speed, { fly: c.fly, tapped: !!c.tapped });
        // A hole-out is always heard, even from a way off.
        return this.fx({ family: "cup", gain: 0.6 * r.gain, recGain: r.gain, at, ref: 20, floor: 0.35, make: (out, t) => synth.cup(this.ctx, out, t, r), duck: 3 });
      }
      case "lip": {
        const r = lipRecipe(c.speed, Math.random, { wall: !!c.wall });
        return this.fx({ gain: 0.5 * r.gain, at, ref: 20, floor: 0.25, make: (out, t) => synth.lip(this.ctx, out, t, r) });
      }
      case "tree": {
        // Into a wood (the driving challenge), or a tree on a course: what
        // it met, its trunk or its leaves: a knock on wood, or a rustle
        // through the leaves (the recordings of each, or made up).
        const r = c.part ? treeRecipe(c.part, c.speed) : landRecipe("trees", Math.max(10, c.speed), 0);
        return this.fx({ family: treeFamily(c.part), gain: 0.8 * Math.max(0.5, r.gain), recGain: Math.max(0.5, impactGain(c.speed)), at, make: (out, t) => synth.land(this.ctx, out, t, r), duck: 3 });
      }
      case "face": {
        // Into the bank of a bunker: a thump into turf, and sand thrown.
        const thump = landRecipe("rough", c.speed, 0);
        const sand = landRecipe("sand", c.speed * 0.7, 0);
        return this.fx({
          gain: 0.7 * thump.gain,
          at,
          make: (out, t) => Math.max(synth.land(this.ctx, out, t, thump), synth.land(this.ctx, out, t + 0.01, sand)),
          duck: 3,
        });
      }
    }
  }

  // Each kind of sound on demand, from the Sound panel, to hear the
  // volumes: a few at random, as they would come. A bird (or a duck or
  // swan) is heard at the Background volume even with the birds turned off
  // (it's asked for).
  // Returns false if it can't be heard (sound off, or not allowed yet).
  demo(kind) {
    if (!this.ready) return false;
    const pick = (list) => list[Math.floor(Math.random() * list.length)];
    const near = [this.listener.pos[0], this.listener.pos[1] - 1.5, this.listener.pos[2] - 8];
    // The strikes play even with the Club strike sound off, to judge them.
    if (kind === "driver") this.strike({ club: "DR", speedMph: 140 + Math.random() * 20, always: true });
    if (kind === "iron") this.strike({ club: pick(["5I", "7I", "9I"]), speedMph: 100 + Math.random() * 20, always: true });
    if (kind === "wedge") this.strike({ club: pick(["PW", "SW"]), speedMph: 70 + Math.random() * 20, always: true });
    if (kind === "putt") this.strike({ club: "PT", speedMph: 3 + Math.random() * 6, always: true });
    if (kind === "land") this.cue({ kind: "land", lie: pick(["fairway", "green", "rough", "bunker"]), speed: 12 + Math.random() * 12, bounce: 0 }, near);
    if (kind === "splash") this.cue({ kind: "splash", speed: 8 + Math.random() * 20, steep: 0.4 + Math.random() * 0.5 }, near);
    if (kind === "cup") this.cue({ kind: "cup", speed: 0.5 + Math.random() * 1.2 }, near);
    if (kind === "tee") this.teeUp();
    if (kind === "tree") this.cue({ kind: "tree", part: pick(["trunk", "leaves"]), speed: 25 + Math.random() * 20 }, near);
    if (kind === "duck") {
      const L = this.listener.pos;
      this.ambienceLayer?.fowlCall({ kind: pick(["duck", "duck", "swan"]), at: [L[0] + 6, L[1] - 1.5, L[2] - 10] }, this.ctx.currentTime + 0.05, { preview: true });
    }
    if (kind === "bird") this.ambienceLayer?.birdCall(pick(["chirp", "warble", "whistle", "cuckoo", "caw"]), this.ctx.currentTime + 0.05, { preview: true });
    return true;
  }
}

// ---- The recordings --------------------------------------------------------------------------

// Audio files, one folder per kind (families.mjs): the game's own clips
// (public/soundpack) and the owner's in the sounds folder, together in one
// pool per kind - fetched from the server once sound is allowed and
// decoded ready to play. They're used as the recordings setting says
// (params.mjs chooseSource): in place of the synthesized sound of their
// kind to begin with (where a kind has none, the synthesized sound plays),
// mixed in with it, or not at all - never the same one twice running. A file that
// can't be used is listed, with why, for the Sound panel: skipped by the
// server (the wrong type, the wrong place, too big), too long, or not one
// the browser can play.
const MAX_PER_KIND = 40;
// On the phone (the app's page: window.pocket) sound is mixed at a lower rate
// - a phone's speaker gives nothing above about 15 kHz - so each clip held
// decoded takes two thirds the memory, and the long loops (LOOPS: water, a
// stream, the wind, rain, the outdoor bed and the cart's two, up to a minute or two each and
// ten to forty megabytes apiece decoded) are each decoded only when one's
// first wanted, one of each kind: the made-up sound plays (or, the
// outdoor bed, none) for the moment it takes, and it fades in
// (recordingsChanged). Everything else as on the PC.
const PHONE_RATE = 32000;
const LOOPS = new Set(["water", "stream", "wind", "rain", "outdoor", "cart", "cart-motor"]);
const onPhone = () => typeof window !== "undefined" && !!window.pocket;
// How many of the game's sounds are fetched and decoded at once.
const DECODE_AT_ONCE = 4;
// All the owner's recordings together, seconds: each is held decoded in
// memory. The game's own clips (about twelve minutes, mostly the beds) don't
// count: there's a set number of them, kept small by the tests.
const MAX_TOTAL_SECONDS = 15 * 60;

class Recordings {
  constructor(engine) {
    this.engine = engine;
    this.dir = null;
    this.files = {};
    // The game's own clips, by kind (the owner's are `files`).
    this.pack = {};
    this.buffers = {};
    // The one each kind played last, so it isn't played again straight away.
    this.last = {};
    this.failed = [];
    this.skipped = [];
    this.loading = false;
    // The phone's loops still to decode, by kind: { names, url } (LOOPS).
    this.later = {};
  }

  async refresh() {
    if (this.loading || !this.engine.ctx || typeof location === "undefined" || !/^https?:$/.test(location.protocol)) return;
    this.loading = true;
    this.engine.changed();
    const had = this.total;
    try {
      const res = await fetch("/api/sounds");
      if (!res.ok) return;
      const list = await res.json();
      this.dir = list.dir ?? null;
      this.files = list.families ?? {};
      this.pack = list.pack && typeof list.pack === "object" ? list.pack : {};
      this.buffers = {};
      this.last = {};
      this.later = {};
      this.failed = [];
      this.skipped = Array.isArray(list.skipped) ? list.skipped : [];
      let seconds = 0;
      // The game's own first (each kind's whole pool), then the owner's.
      let sources = [
        ...Object.entries(this.pack).map(([family, names]) => ({ family, names, url: "/soundpack", own: false })),
        ...Object.entries(this.files).map(([family, names]) => ({ family, names, url: "/sounds", own: true })),
      ];
      // (The long loops when they're first wanted, on the PC too: LOOPS.)
      for (const src of sources) if (!src.own && LOOPS.has(src.family) && src.names.length) this.later[src.family] = { names: src.names, url: src.url };
      sources = sources.filter((src) => !this.later[src.family] || src.own);
      const load = (this.load = async (url, family, name) => {
        try {
          const r = await fetch(`${url}/${encodeURIComponent(family)}/${encodeURIComponent(name)}`);
          if (!r.ok) throw new Error(String(r.status));
          return await this.engine.ctx.decodeAudioData(await r.arrayBuffer());
        } catch {
          return null;
        }
      });
      // Every file fetched and decoded a few at a time (DECODE_AT_ONCE: all
      // at once held the page at the first click), then taken in order.
      const jobs = sources.flatMap(({ family, names, url, own }, k) => (own ? names.slice(0, MAX_PER_KIND) : names).map((name) => ({ k, url, family, name })));
      const got = await inTurn(jobs, DECODE_AT_ONCE, (j) => load(j.url, j.family, j.name));
      const decoded = sources.map(() => []);
      jobs.forEach((j, i) => decoded[j.k].push(got[i]));
      for (const [k, { family, names, own }] of sources.entries()) {
        if (own) names.slice(MAX_PER_KIND).forEach((name) => this.skipped.push({ file: `${family}/${name}`, why: `more than ${MAX_PER_KIND} of that kind` }));
        for (const [i, buf] of decoded[k].entries()) {
          const name = names[i];
          const file = own ? `${family}/${name}` : `the game's ${family}/${name}`;
          if (!buf) {
            // Not a file this browser can play: left out, and listed.
            this.failed.push(file);
            continue;
          }
          if (buf.duration > MAX_SOUND_SECONDS) this.skipped.push({ file, why: "too long - keep a recording under three minutes" });
          else if (own && seconds + buf.duration > MAX_TOTAL_SECONDS) this.skipped.push({ file, why: "too many long recordings altogether" });
          else {
            if (own) seconds += buf.duration;
            (this.buffers[family] ??= []).push(buf);
          }
        }
      }
    } catch {
      // No server to ask (or an old one): synthesized sounds only.
    } finally {
      this.loading = false;
      if (had || this.total) this.engine.ambienceLayer?.recordingsChanged();
      this.engine.changed();
    }
  }

  // A phone's loop of this kind (LOOPS) decoded now it's wanted - one of
  // them - and the ambience told when it's in, to fade it in.
  // (The phone: one of them, to keep its memory down. The PC: all of the
  // kind, one at a time, so its beds vary as they did.)
  wanted(family) {
    const later = this.later[family];
    if (!later || this.buffers[family]?.length || !this.load) return;
    delete this.later[family];
    const names = onPhone() ? [later.names[Math.floor(Math.random() * later.names.length)]] : later.names;
    inTurn(names, 1, async (name) => {
      const buf = await this.load(later.url, family, name);
      if (!buf || buf.duration > MAX_SOUND_SECONDS) return;
      const first = !this.buffers[family]?.length;
      (this.buffers[family] ??= []).push(buf);
      // (The first of a kind in: the ambience told, to fade it in. The rest
      // join the choice quietly, for the next time one's picked.)
      if (first) this.engine.ambienceLayer?.recordingsChanged();
      this.engine.changed();
    });
  }

  count(family) {
    return this.buffers[family]?.length ?? 0;
  }
  get total() {
    return Object.values(this.buffers).reduce((n, list) => n + list.length, 0);
  }

  // How many of a kind are the owner's own (the rest are the game's).
  ownCount(family) {
    return Math.min(MAX_PER_KIND, this.files[family]?.length ?? 0);
  }

  // A background bed of a kind (the outdoor bed, the cart's), or one of a
  // kind there's no made-up sound for (the cart's clubs rattling), whatever
  // the recordings setting says but "made" (there's none to mix with): one
  // at random, never the last when there's another.
  pickBed(family, rand = Math.random) {
    this.wanted(family);
    const list = this.buffers[family];
    const i = chooseSource(list?.length ?? 0, rand, "only", this.last[family] ?? -1);
    this.last[family] = i;
    return i >= 0 ? list[i] : null;
  }

  // One of a kind's recordings to play this time - never the one it played
  // last, when there's another - or null for the synthesized sound.
  pick(family, rand = Math.random) {
    if (this.engine.settings.recordings !== "made") this.wanted(family);
    const list = this.buffers[family];
    const i = chooseSource(list?.length ?? 0, rand, this.engine.settings.recordings, this.last[family] ?? -1);
    this.last[family] = i;
    return i >= 0 ? list[i] : null;
  }
}

// The one engine for the page.
export const audio = new AudioEngine();
