// The rules behind the game's sounds, kept apart from the Web Audio code so
// they can be tested: which sound a shot makes, and the recipe for each
// one. Every recipe is drawn fresh with a random source (Math.random in the
// game, a seeded one in the tests), so no two strikes, landings or cup
// rattles are quite the same, while each stays recognisably itself.
//
// Units: speeds in mph as the launch monitor sends them for the strike, in
// metres per second for the ball hitting the ground; times in seconds;
// frequencies in Hz; gains 0-1 (how loud before the volume settings).

// ---- Settings -----------------------------------------------------------------

export const SOUND_DEFAULTS = {
  on: true,
  master: 0.8,
  effects: 0.85,
  ambience: 0.55,
  // The fanfares and chimes for a hole's score (the course's and
  // Challenges' Sounds box).
  celebrations: true,
  // The club hitting the ball. Off to begin with: at the mat the player
  // hears their own club hit the real ball into the screen, and a made-up
  // one a moment later only muddles it. The Sound panel turns it on.
  strike: false,
  wind: true,
  birds: true,
  water: true,
  // Rain's hiss and patter, when it rains.
  rain: true,
  // The quiet, distant outdoor bed under the wind (recordings only).
  outdoor: true,
  birdDensity: 0.5,
  // The two buses muted, whatever their volume (the owner: "separate
  // volume/mute for Effects vs Ambience, so birds can be dialled down while
  // recording swing videos").
  effectsMute: false,
  ambienceMute: false,
  // The recordings (RECORDINGS_MODES) - the game's own clips and the
  // owner's: "only" plays a recording wherever a kind of sound has any,
  // the synthesized sound where it has none (the owner, October 2026: "all
  // audio is currently synthesized. Sounds feel a bit off and are too
  // repetitive... replace synthesized audio with real recorded samples, with
  // randomized playback"). "made" is the synthesized sounds alone.
  recordings: "only",
};

// What's done with the recordings (the game's own and the owner's), for a
// kind of sound that has some: not used, mixed in with the made-up sound
// (each recording as likely as it), or only them.
export const RECORDINGS_MODES = ["made", "mixed", "only"];

import { clamp } from "../sim/mathutil.mjs";
const clamp01 = (v) => clamp(v, 0, 1);

// Stored settings, tidied: anything missing or nonsense falls back to the
// default, so a damaged setting can never make the game silent by accident.
export function soundSettings(raw = {}) {
  const out = { ...SOUND_DEFAULTS };
  for (const [k, d] of Object.entries(SOUND_DEFAULTS)) {
    const v = raw?.[k];
    if (typeof d === "boolean" && typeof v === "boolean") out[k] = v;
    if (typeof d === "number" && Number.isFinite(v)) out[k] = clamp01(v);
  }
  if (RECORDINGS_MODES.includes(raw?.recordings)) out.recordings = raw.recordings;
  return out;
}

// Which version of the settings a saved copy is, so an older copy can be
// brought up to date once (migrateSoundSettings) and never again.
//   1  before the Club strike sound setting (no version saved)
//   2  with it
//   3  the recordings choice (made, mixed, only) in place of Only my recordings
//   4  recordings by default ("only"), with clips that come with the game
export const SOUND_SETTINGS_VERSION = 4;

// Saved settings, brought up to date and tidied. Settings from before the
// Club strike sound setting come out with the strike off, like everyone
// else's: the strike always played then, but only because it couldn't be
// turned off. Once saved at this version, what's saved is what counts.
// Settings from before the recordings choice come out with the made-up
// sounds alone, unless Only my recordings was ticked (then only them):
// recordings used to be mixed in whether or not anyone had asked.
export function migrateSoundSettings(raw = {}) {
  const version = Number(raw?.version) || 1;
  const out = soundSettings(raw);
  if (version < 2) out.strike = SOUND_DEFAULTS.strike;
  if (version < 3) out.recordings = raw?.recordedOnly === true ? "only" : "made";
  // Until version 4 the made-up sounds were the default, so "made" saved
  // then says nothing: the recordings, now there are some for everyone.
  if (version < 4 && out.recordings === "made") out.recordings = SOUND_DEFAULTS.recordings;
  return out;
}

// The settings as they're saved: with their version.
export function storedSoundSettings(settings) {
  return { ...soundSettings(settings), version: SOUND_SETTINGS_VERSION };
}

// The settings the first time, before any are saved: the course's and
// Challenges' own Sounds boxes (from before there was a Sound panel) carry
// over - if either was off, the celebrations stay off.
export function firstSoundSettings(course = {}, challenges = {}) {
  return soundSettings({ celebrations: course?.sounds !== false && challenges?.sounds !== false });
}

// A volume slider (0-1) to a gain: squared, so the slider's middle sounds
// like half as loud rather than barely quieter.
export function volumeGain(v, muted = false) {
  if (muted) return 0;
  const x = clamp01(Number(v) || 0);
  return x * x;
}

// ---- Random helpers -------------------------------------------------------------

// A value between lo and hi.
export const between = (rand, lo, hi) => lo + (hi - lo) * rand();
// A whole number from lo to hi inclusive.
export const count = (rand, lo, hi) => Math.min(hi, lo + Math.floor(rand() * (hi - lo + 1)));
// v, give or take a fraction `by` of it.
export const vary = (rand, v, by) => v * (1 + (rand() * 2 - 1) * by);

// A small seeded random source (mulberry32), for the tests.
export function seededRandom(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- The strike ----------------------------------------------------------------------

// Which kind of strike a club makes at a ball speed (mph): a driver's
// titanium ting, a wood's, an iron's click, a wedge's softer clip, a chip
// (an iron or wedge hit gently), or a putt.
export function strikeKind(club, speedMph = 100) {
  const c = String(club ?? "").toUpperCase();
  if (c === "PT") return "putter";
  if (c === "DR") return "driver";
  if (/^\d+[WH]$/.test(c)) return "wood";
  const wedge = ["PW", "GW", "AW", "SW", "LW"].includes(c);
  if (speedMph < 50) return "chip";
  if (wedge) return "wedge";
  if (/^\d+I$/.test(c)) return "iron";
  // Anything else (an unknown club name): judged by the ball speed.
  if (speedMph >= 135) return "driver";
  return speedMph >= 80 ? "iron" : "wedge";
}

// The ball speed each kind is usually hit at: at that speed the strike has
// its full, normal sound; faster is louder and brighter, slower quieter.
const STRIKE_REF = { driver: 150, wood: 135, iron: 115, wedge: 88, putter: 7 };
// How loud each kind is at that speed, against a driver's strike: a wood a
// little under it, an iron well under, a wedge more so, a putt a quiet tock
// (a chip is its club's, hit gently).
const STRIKE_LOUD = { driver: 1, wood: 0.67, iron: 0.59, wedge: 0.4, putter: 0.14 };
// A clean strike's smash factor (ball speed over club speed) for each kind.
const SMASH = { driver: 1.48, wood: 1.44, iron: 1.32, wedge: 1.2 };

// How much of a mishit the club data says it was, 0 (clean) to 1: struck
// well away from the centre of the face (mm), or a smash factor well short
// of a clean one. 0 when there's no club data to say.
export function mishitAmount(kind, speedMph, clubData = null) {
  if (!clubData) return 0;
  let m = 0;
  const h = Number(clubData.impactHorizontal);
  const v = Number(clubData.impactVertical);
  if (Number.isFinite(h) || Number.isFinite(v)) {
    const off = Math.hypot(Number.isFinite(h) ? h : 0, Number.isFinite(v) ? v : 0);
    m = Math.max(m, (off - 8) / 20);
  }
  const clubSpeed = Number(clubData.speedMph);
  if (SMASH[kind] && Number.isFinite(clubSpeed) && clubSpeed > 20 && speedMph > 0) {
    // A few hundredths short of a clean smash is still a good strike.
    m = Math.max(m, (SMASH[kind] - 0.03 - speedMph / clubSpeed) / 0.15);
  }
  return clamp01(m);
}

// Everything that decides how a strike sounds, before the random detail:
//   { kind, club, family, gain, bright, mishit, soft, ratio, across, up }
// gain: how loud, a full driver 1, going up with the speed and never
// dropping as it does (a firm chip into a full wedge, say). family: the
// recordings folder for it. soft: shorter irons play a little softer than
// long ones. ratio: the ball speed against the club's usual one. across
// and up: where on the face the club data says it was struck (mm from the
// middle, toe and high positive; 0 without club data).
export function strikeProfile(club, speedMph, clubData = null) {
  const speed = Math.max(0, Number(speedMph) || 0);
  const kind = strikeKind(club, speed);
  const name = String(club ?? "").toUpperCase();
  const n = /^(\d+)I$/.exec(name);
  // A chip is the same club hit gently: judged against its full swing, so
  // the sound never jumps as a chip gets firmer and becomes a full shot.
  const full = kind === "chip" ? (n ? "iron" : "wedge") : kind;
  const ratio = speed / STRIKE_REF[full];
  const mishit = mishitAmount(kind, speed, clubData);
  let soft = 1;
  if (n) soft = clamp(1 - (Number(n[1]) - 4) * 0.05, 0.7, 1);
  else if (full === "wedge") soft = 0.8;
  let gain;
  if (kind === "putter") {
    // Putts: a tap is quiet, a long lag firmer.
    gain = STRIKE_LOUD.putter * clamp(0.12 + 0.88 * ratio, 0.12, 1.3);
  } else {
    // A chip a touch softer than its club's full swing at that speed.
    const chip = kind === "chip" ? 0.85 : 1;
    gain = STRIKE_LOUD[full] * clamp(Math.pow(ratio, 1.4), 0.05, 1.25) * soft * chip * (1 - 0.2 * mishit);
  }
  const bright = clamp(0.35 + 0.65 * ratio, 0.25, 1.2) * (1 - 0.45 * mishit);
  const mm = (v) => (Number.isFinite(Number(v)) && v !== null ? clamp(Number(v), -40, 40) : 0);
  return { kind, club: name, family: strikeFamily(kind), gain, bright, mishit, soft, ratio, across: mm(clubData?.impactHorizontal), up: mm(clubData?.impactVertical) };
}

// The note a driver's or wood's crown rings at (Hz): the same club always
// rings at much the same pitch, as a real one does, so it's picked from
// the club's name - a driver somewhere in 2.8-3.4 kHz; a wood's smaller,
// stiffer head a little higher, 3.3-3.9 kHz.
export function ringNote(kind, club = "") {
  let h = 2166136261;
  for (const c of String(club)) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const k = (h % 1000) / 1000;
  return kind === "driver" ? 2800 + 600 * k : 3300 + 600 * k;
}

export function strikeFamily(kind) {
  return { driver: "strike-driver", wood: "strike-driver", iron: "strike-iron", wedge: "strike-wedge", chip: "strike-wedge", putter: "strike-putter" }[kind] ?? "strike-iron";
}

// ---- What a real strike sounds like ----------------------------------------------------
//
// From recordings of real strikes and the published measurements of club
// sound: what you hear is mostly the clubhead ringing, set going by the
// half a millisecond or so the ball is on the face, over a crack of the
// face and ball meeting.
//
// - A driver: a hollow titanium shell, so it rings like a small bell - a
//   bright, hollow "tink" whose body is at about 1-4 kHz, loudest where
//   the crown and sole ring at 3-4 kHz, a few lower shell modes under them,
//   over within a few tenths of a second. The crack on top of it is broad,
//   up past 6 kHz. A fairway wood's smaller head rings a little higher and
//   shorter.
// - An iron: a solid, heavily damped steel head that barely rings - a
//   compressed "click-thud", a dense cluster of modes from about 1 to 7 kHz
//   all gone in a couple of hundredths of a second, the lowest (near 1 kHz)
//   the thud. Off the mat or grass the sole meets the ground a few ms after
//   the ball: a dull swish of low-mid noise. Longer irons a little lower.
// - A wedge: the same, but a thinner, lighter head - softer, higher and
//   shorter - and more turf, as a wedge takes more ground.
// - A putter: a soft, muted "tock". The ball is slow and on the face for
//   longer, so little above 2 kHz is set going: a knock near 1 kHz gone in
//   a few hundredths.
// - A mishit: the ball on the face for longer and the head twisting, so
//   the high modes are hardly set going and die sooner (the energy goes
//   into the hands) - duller, more low thud, less ring. Off the toe (or
//   heel) the head's twisting modes join in, close in pitch to others, and
//   beat against them: rattly.
//
// So a strike is made as its modes (modal synthesis: each a sine dying
// away at its own rate) with the crack, a short low thud, the turf, and a
// short tail of the space round it. Every strike jitters each mode's pitch,
// ring and strength a little, and where on the face it was struck, so no
// two are alike while each club keeps its own voice.

// Each club's modes, as struck in the middle of the face at its usual
// speed: [frequency, how long it rings (s, the time constant: -60 dB
// after about seven), how strongly it's set going, and whether it's
// even - set going most from the middle of the face - or odd - most off
// the toe or heel]. A driver's and wood's frequencies are multiples of
// their note (ringNote); the others' in Hz.
export const STRIKE_MODES = {
  driver: [
    [0.45, 0.02, 0.28, "even"], // ~1.4 kHz: the whole head on the shaft, the hollow body
    [0.68, 0.028, 0.36, "odd"], // ~2.1 kHz: the face's first bend
    [1, 0.055, 0.8, "even"], // ~3.1 kHz: the crown - the ring you hear
    [1.19, 0.042, 0.44, "odd"], // ~3.7 kHz: the sole
    [1.52, 0.028, 0.28, "even"], // ~4.7 kHz
    [2.05, 0.014, 0.18, "odd"], // ~6.4 kHz: the bright top of the tink
  ],
  wood: [
    [0.48, 0.016, 0.35, "even"],
    [0.7, 0.02, 0.45, "odd"],
    [1, 0.036, 1, "even"],
    [1.2, 0.028, 0.5, "odd"],
    [1.55, 0.018, 0.3, "even"],
    [2.1, 0.01, 0.18, "odd"],
  ],
  iron: [
    [1050, 0.009, 0.6, "even"], // the ball against a solid head: the thud of click-thud
    [1800, 0.008, 0.3, "odd"], // the head twisting about the shaft: a toe or heel strike's
    [2600, 0.011, 0.85, "even"], // the head's first bend: the body of the click
    [3900, 0.007, 0.6, "even"],
    [5400, 0.005, 0.45, "even"],
    [7400, 0.0035, 0.28, "even"], // the edge of the click
  ],
  wedge: [
    [1250, 0.0065, 0.4, "even"],
    [2100, 0.006, 0.25, "odd"],
    [3000, 0.0075, 0.8, "even"],
    [4400, 0.0055, 0.6, "even"],
    [6200, 0.0042, 0.42, "even"],
    [8200, 0.003, 0.22, "even"],
  ],
  putter: [
    [1000, 0.01, 1, "even"], // the tock: the ball against a soft face
    [1800, 0.006, 0.45, "odd"],
    [3000, 0.0035, 0.18, "even"],
  ],
};

// How long the ball is on the face, as it shapes the sound (a time, s, of
// which only the ratios matter): the longer, the less the high modes are
// set going. Slower strikes are on longer (as a bouncing ball is, gently
// with the speed), mishits longer still.
const CONTACT = { driver: 0.00012, wood: 0.00012, iron: 0.00011, wedge: 0.0001, putter: 0.00035 };
export function contactTime(kind, ratio = 1, mishit = 0) {
  const base = CONTACT[kind] ?? CONTACT.iron;
  return base * Math.pow(clamp(ratio, 0.05, 1.5), -0.2) * (1 + 2.5 * clamp01(mishit));
}
// How strongly a strike of that contact time sets a mode of frequency f
// going, 0-1: a short, sharp strike sets them all going; a long, soft one
// mostly the low ones.
export function excitation(f, contact) {
  return 1 / Math.sqrt(1 + (f * contact) ** 2);
}

// How far off the middle a strike is, 0 (dead centre) to 1 (25 mm or more
// off; high or low on the face counts a little less than across it).
function offCentre(profile) {
  return clamp01(Math.hypot(profile.across ?? 0, 0.7 * (profile.up ?? 0)) / 25);
}

// The character of one strike, drawn once for the whole of it so its
// parts move together (rather than each part jittering on its own, which
// averages out to the same sound every time):
//   ring   how long the head rings, against its usual (0.9-1.1)
//   tilt   rounder (towards 0) or brighter (towards 1): the high modes
//          and the crack up and the low ones down, or the other way
//   lag    seconds from the face's crack to the head ringing out (0-0.8 ms):
//          the ring builds as the ball leaves the face
export function strikeCharacter(rand = Math.random) {
  return { ring: between(rand, 0.9, 1.1), tilt: rand(), lag: between(rand, 0, 0.0008) };
}

// The modes of one strike (the club's, above), each { freq, decay, gain },
// with the strike's character (strikeCharacter) running through them.
export function strikeModes(profile, rand = Math.random, character = strikeCharacter(rand)) {
  const { kind, club, mishit = 0, ratio = 1 } = profile;
  const { ring } = character;
  const tilt = 2 * character.tilt - 1;
  const full = kind === "chip" ? (/^\d+I$/.test(club) ? "iron" : "wedge") : kind;
  const table = STRIKE_MODES[full] ?? STRIKE_MODES.iron;
  const contact = contactTime(full, ratio, mishit) * vary(rand, 1, 0.1);
  // Where on the face: even a "pure" strike is a few mm one way or another.
  const p = clamp01(offCentre(profile) + Math.abs(rand() - 0.5) * 0.15);
  // The club's pitch: a driver's and wood's note; a longer iron a little
  // lower, a shorter one higher; the wedges rising with their loft.
  let scale = 1;
  const n = /^(\d+)I$/.exec(club);
  if (full === "driver" || full === "wood") scale = ringNote(full, club) * vary(rand, 1, 0.012) * (1 - 0.04 * mishit);
  else if (n) scale = 1 + (Number(n[1]) - 7) * 0.03;
  else if (full === "wedge") scale = { PW: 1, GW: 1.03, AW: 1.03, SW: 1.06, LW: 1.09 }[club] ?? 1;
  const modes = table.map(([f, decay, g, shape]) => {
    const freq = f * scale * vary(rand, 1, 0.015);
    const where = shape === "even" ? 1 - 0.55 * p : 0.55 + 0.9 * p;
    // A mishit's energy goes into the hands: the high modes die soonest.
    const high = freq > 1500;
    const damp = 1 - (high ? 0.45 : 0.2) * mishit;
    // A gentler strike is duller: its high modes a little quieter.
    const lift = high ? Math.pow(clamp(0.35 + 0.65 * ratio, 0.45, 1.2), 0.5) : 1;
    const lean = 1 + (high ? 0.12 : -0.1) * tilt;
    return { freq, decay: decay * ring * vary(rand, 1, 0.12) * damp, gain: g * excitation(freq, contact) * where * lift * lean * between(rand, 0.75, 1) };
  });
  // Off the toe or heel: the head twists, its twisting modes a few per
  // cent off the odd ones beat against them (rattly), with a low buzz.
  const rattle = rattleAmount(profile);
  if (rattle > 0) {
    for (const m of modes.filter((_, i) => table[i][3] === "odd")) {
      const off = between(rand, 0.012, 0.025) * (rand() < 0.5 ? -1 : 1);
      modes.push({ freq: m.freq * (1 + off), decay: m.decay * 1.3, gain: m.gain * 0.6 * rattle });
    }
    modes.push({ freq: between(rand, 520, 700), decay: vary(rand, 0.022, 0.2), gain: 0.35 * rattle });
  }
  return modes;
}

// How rattly a strike is, 0-1: only off the toe or heel (not high or low
// on the face), and only well off.
export function rattleAmount(profile) {
  return clamp01((Math.abs(profile.across ?? 0) - 10) / 15);
}

// How much each kind's recipe below is turned up to come out as loud as
// a driver's at the same gain (measured by rendering them: a click is over
// far quicker than a ring, so it needs more level to sound as loud). So
// the profile's gain alone says how loud a strike is.
const STRIKE_LEVEL = { driver: 1, wood: 1.5, iron: 2.0, wedge: 2.7, chip: 3.4, putter: 4.3 };

// The recipe for one strike, from its profile: level (above), and parts
// (any may be missing):
//   modes  the head ringing: [{ freq, decay, gain }] (strikeModes)
//   click  the crack of face and ball: a burst of noise { gain, band, q, decay }
//   thud   a short low thump dropping in pitch - the ball squashing, the
//          shaft kicking: { gain, freq, to, decay }
//   turf   the sole through the grass or the mat, a moment after the ball:
//          noise between hp and lp Hz { at, gain, hp, lp, attack, decay }
//   room   a short tail of the space round it: { gain }
//   rattle how rattly (0-1), for the tests
//   character  this strike's own (strikeCharacter); lag is when the modes
//          start after the crack
export function strikeRecipe(profile, rand = Math.random) {
  const { kind, gain, bright, mishit } = profile;
  const character = strikeCharacter(rand);
  const r = { kind, gain, level: STRIKE_LEVEL[kind] ?? 1, rattle: rattleAmount(profile), character };
  // A chip with an iron rings with the iron's modes, which carry more than
  // a wedge's: turned up less.
  if (kind === "chip" && /^\d+I$/.test(profile.club)) r.level *= 0.7;
  r.modes = strikeModes(profile, rand, character);
  // A mishit's crack is smaller and lower; a brighter strike's a little
  // higher and sharper.
  const crack = (g, band, decay) => ({ gain: g * bright * (1 - 0.5 * mishit) * (0.9 + 0.2 * character.tilt), band: vary(rand, band, 0.15) * (1 - 0.3 * mishit) * (0.95 + 0.1 * character.tilt), q: between(rand, 0.6, 0.9), decay: vary(rand, decay, 0.25) });
  const thud = (g, freq, to, decay) => ({ gain: g * (1 + 3 * mishit), freq: vary(rand, freq, 0.12), to: vary(rand, to, 0.1), decay: vary(rand, decay, 0.2) * (1 + 0.6 * mishit) });
  if (kind === "driver" || kind === "wood") {
    r.click = crack(0.5, kind === "driver" ? 6500 : 6000, 0.0012);
    r.thud = thud(0.12, 190, 125, 0.012);
    // A wood off the mat may brush it; a driver's off a tee.
    if (kind === "wood" && rand() < 0.5) r.turf = { at: between(rand, 0.003, 0.008), gain: between(rand, 0.03, 0.1), hp: vary(rand, 250, 0.2), lp: vary(rand, 1500, 0.25), attack: vary(rand, 0.004, 0.3), decay: vary(rand, 0.04, 0.25) };
    r.room = { gain: kind === "driver" ? 0.1 : 0.08 };
  } else if (kind === "iron") {
    r.click = crack(0.7, 4200, 0.0018);
    r.thud = thud(0.18, 230, 140, 0.012);
    // Some strikes nip the ball off the top of the turf, some take a divot.
    r.turf = { at: between(rand, 0.003, 0.009), gain: between(rand, 0.08, 0.3), hp: vary(rand, 250, 0.2), lp: vary(rand, 1600, 0.25), attack: vary(rand, 0.005, 0.3), decay: vary(rand, 0.05, 0.25) };
    r.room = { gain: 0.05 };
  } else if (kind === "wedge" || kind === "chip") {
    const chip = kind === "chip";
    r.click = crack(chip ? 0.3 : 0.5, 5200, 0.0014);
    r.thud = thud(chip ? 0.08 : 0.12, 250, 150, 0.01);
    r.turf = { at: between(rand, 0.002, 0.007), gain: chip ? between(rand, 0.08, 0.2) : between(rand, 0.12, 0.3), hp: vary(rand, 300, 0.2), lp: vary(rand, chip ? 2000 : 2200, 0.25), attack: vary(rand, 0.004, 0.3), decay: vary(rand, chip ? 0.035 : 0.045, 0.25) };
    r.room = { gain: chip ? 0.04 : 0.05 };
  } else {
    // A putter: a knock and hardly a click - the tock, not a note.
    r.click = { gain: 0.25 * (0.5 + 0.5 * Math.min(1, bright)), band: vary(rand, 3000, 0.15), q: 1, decay: 0.0008 };
    r.thud = { gain: 0.2, freq: vary(rand, 420, 0.1), to: vary(rand, 330, 0.08), decay: vary(rand, 0.008, 0.2) };
    r.room = { gain: 0.03 };
  }
  return r;
}

// ---- The ball hitting the ground ---------------------------------------------------

// What a lie sounds like when a ball lands on it.
const LAND_SOUNDS = {
  green: "green",
  fringe: "grass",
  fairway: "grass",
  tee: "grass",
  approach: "grass",
  firm: "grass",
  soft: "grass",
  semi: "rough",
  rough: "rough",
  deep: "rough",
  trees: "trees",
  bunker: "sand",
  greenside: "sand",
  // A waste area's firm sand and scrub.
  waste: "sand",
  sand: "sand",
  water: "splash",
  path: "hard",
};
export function landingSound(lie) {
  return LAND_SOUNDS[lie] ?? "grass";
}
export function landingFamily(sound) {
  return { grass: "land-grass", rough: "land-grass", green: "land-green", sand: "land-sand", splash: "splash" }[sound] ?? null;
}

// The recordings for a ball into a tree: its trunk (or a branch) a knock
// on wood, anything else - the leaves, caught up in the branches - a
// rustle through the leaves.
export function treeFamily(part) {
  return part === "trunk" ? "tree-wood" : "tree-leaves";
}

// How hard a ball comes down (m/s into the ground, cues.mjs impactSpeed)
// to a loudness: a drive dropping out of the sky is a proper thud, a later
// bounce much less, a ball trickling off a hop next to nothing.
export function impactGain(speed, bounce = 0) {
  const g = clamp(Math.max(0, speed) / 20, 0.03, 1.2);
  return g * Math.pow(0.7, Math.max(0, bounce));
}

// ---- What a real landing sounds like --------------------------------------------------
//
// A 46 g ball arriving at 10-30 m/s: the ground gives, so most of what's
// heard is a short, dull thud - a few hundred Hz, and how dull and how
// short says how soft the ground is - with the grass or sand it passes
// through on top. Nothing reaches down to the deepest bass.
// - Fairway: a soft thud with a quick rustle of grass blades.
// - Green: firmer, closer-cut turf - a softer, deader thud, shorter and
//   duller, with hardly any rustle and just a hint of a tap.
// - Rough: muffled (the long grass cushions it), and a longer swish of
//   grass parting that swells in rather than snapping.
// - Sand: a crunchy "phut" - a puff of low noise and the crunch of grains
//   (sparse clicks rather than a smooth hiss), then a few settling.
// - A cart path: a hard, bright click, the ball itself ringing briefly
//   (it barely gives on concrete), sometimes a tiny skip, and a touch of
//   the space round it; the hops after come from the flight itself.
// - The cup (cupRecipe): a firm putt taps the back of the liner first,
//   then the ball drops and clunks on the bottom and rattles to rest.
// Far off, the quiet detail (rustle, grains, crunch) is lost first, and the
// air takes the top off the rest (engine.js, airCutoff).

// How much each landing is turned up to come out about as loud as it did
// before it was modelled like this (measured by rendering them).
const LAND_LEVEL = { grass: 1, green: 1, rough: 1.15, sand: 1, hard: 1, trees: 1 };

// The recipe for a landing of `sound` (grass, green, rough, sand, trees,
// hard) at impact speed `speed`, the `bounce`th touchdown (0 the first),
// `distance` metres from the camera. Any part may be missing:
//   thump   { gain, freq, to, decay }          the ground giving: a low knock dropping in pitch
//   thud    { gain, lp, decay }                low noise, below lp Hz
//   click   { gain, band, q, decay }           a hard contact
//   modes   [{ freq, decay, gain }]            the ball ringing off something hard
//   swish   { gain, band, q, attack, decay }   grass against the ball
//   crunch  { gain, band, q, attack, decay }   sand grains
//   grains  [{ at, gain, band, q, decay }]     rustles: blades, leaves, sand settling
//   knock   { gain, freqs, decay }             a branch
//   skitter [{ at, gain }]                     a tiny skip: the click and modes again, quieter
//   room    { gain }                           a short tail of the space round it
//   firm    how firm the ground is just there (0.85-1.15, grass, green,
//           rough and sand): firmer is a brighter, shorter thud with less
//           rustle; softer duller, longer, with more - the parts together
export function landRecipe(sound, speed, bounce = 0, rand = Math.random, { distance = 0 } = {}) {
  const gain = impactGain(speed, bounce);
  const r = { sound, gain, level: LAND_LEVEL[sound] ?? 1 };
  const hard = clamp(speed / 18, 0.2, 1.2);
  // The quiet detail is lost with distance.
  const near = 1 - 0.7 * clamp01((distance - 40) / 120);
  // The ground just there: one patch firmer or softer than the next.
  const firm = ["grass", "green", "rough", "sand"].includes(sound) ? between(rand, 0.85, 1.15) : 1;
  if (firm !== 1) r.firm = firm;
  // Softer ground gives more: a duller, longer thud; firmer, a brighter,
  // shorter one. Longer grass on softer ground: more rustle.
  const give = { lp: firm, decay: 1 / firm, rustle: 2 - firm };
  if (sound === "grass") {
    r.thump = { gain: 0.4, freq: vary(rand, 230, 0.12) * (0.9 + 0.15 * hard) * Math.sqrt(firm), to: vary(rand, 140, 0.1), decay: vary(rand, 0.028, 0.2) * give.decay };
    r.thud = { gain: 0.85, lp: vary(rand, 650, 0.2) * (0.85 + 0.2 * hard) * give.lp, decay: vary(rand, 0.04, 0.25) * give.decay };
    r.swish = { gain: between(rand, 0.12, 0.22) * near * give.rustle, band: vary(rand, 4200, 0.25), q: 0.8, attack: vary(rand, 0.003, 0.3), decay: vary(rand, 0.035, 0.25) * give.rustle };
    let at = 0;
    r.grains = Array.from({ length: count(rand, 1, 3) }, () => {
      at += between(rand, 0.008, 0.03);
      return { at, gain: between(rand, 0.04, 0.08) * near * give.rustle, band: vary(rand, 5000, 0.3), q: 1.5, decay: vary(rand, 0.012, 0.3) };
    });
  } else if (sound === "green") {
    r.thump = { gain: 0.45, freq: vary(rand, 200, 0.1) * Math.sqrt(firm), to: vary(rand, 135, 0.1), decay: vary(rand, 0.02, 0.2) * give.decay };
    r.thud = { gain: 0.7, lp: vary(rand, 450, 0.2) * give.lp, decay: vary(rand, 0.028, 0.2) * give.decay };
    // A firmer green: more of a tap.
    r.click = { gain: between(rand, 0.03, 0.06) * hard * near * firm, band: vary(rand, 2200, 0.2), q: 0.8, decay: vary(rand, 0.0015, 0.25) };
    r.swish = { gain: between(rand, 0.02, 0.05) * near * give.rustle, band: vary(rand, 4500, 0.25), q: 0.8, attack: 0.002, decay: vary(rand, 0.02, 0.25) };
  } else if (sound === "rough") {
    r.thump = { gain: 0.28, freq: vary(rand, 185, 0.12) * Math.sqrt(firm), to: vary(rand, 120, 0.1), decay: vary(rand, 0.035, 0.2) * give.decay };
    r.thud = { gain: 0.8, lp: vary(rand, 400, 0.2) * give.lp, decay: vary(rand, 0.055, 0.25) * give.decay };
    r.swish = { gain: between(rand, 0.13, 0.2) * near * give.rustle, band: vary(rand, 2300, 0.25), q: 0.8, attack: vary(rand, 0.015, 0.3), decay: vary(rand, 0.08, 0.25) * give.rustle };
    let at = between(rand, 0.01, 0.03);
    r.grains = Array.from({ length: count(rand, 3, 6) }, (_, i) => {
      const g = { at, gain: (between(rand, 0.03, 0.07) / (1 + i * 0.3)) * near, band: vary(rand, 3200, 0.35), q: 1.2, decay: vary(rand, 0.03, 0.35) };
      at += between(rand, 0.015, 0.03);
      return g;
    });
  } else if (sound === "sand") {
    // The phut: a puff of low noise, hardly a thump.
    // Packed, damp sand thuds; dry, loose sand is all crunch.
    r.thump = { gain: 0.15 * firm, freq: vary(rand, 170, 0.1), to: vary(rand, 120, 0.1), decay: vary(rand, 0.02, 0.2) };
    r.thud = { gain: 0.6, lp: vary(rand, 800, 0.2) * give.lp, decay: vary(rand, 0.035, 0.25) * give.decay };
    r.crunch = { gain: between(rand, 0.5, 0.7) * (0.5 + 0.5 * near) * give.rustle, band: vary(rand, 3800, 0.2), q: 0.6, attack: vary(rand, 0.004, 0.3), decay: vary(rand, 0.055, 0.25) * give.rustle };
    let at = between(rand, 0.02, 0.04);
    r.grains = Array.from({ length: count(rand, 3, 6) }, () => {
      const g = { at, gain: between(rand, 0.06, 0.12) * near, band: vary(rand, 6000, 0.25), q: 0.9, decay: vary(rand, 0.02, 0.3) };
      at += between(rand, 0.01, 0.025);
      return g;
    });
  } else if (sound === "trees") {
    // Leaves: a scatter of short rustles, sometimes a branch knocked.
    const n = count(rand, 4, 9);
    let at = 0;
    r.grains = Array.from({ length: n }, () => {
      at += between(rand, 0.015, 0.07);
      return { at, gain: between(rand, 0.15, 0.4), band: vary(rand, 4200, 0.4), q: between(rand, 0.9, 2), decay: vary(rand, 0.04, 0.4) };
    });
    if (rand() < 0.6) {
      const f = between(rand, 380, 720);
      r.knock = { gain: 0.35, freqs: [f, f * vary(rand, 2.3, 0.08), f * vary(rand, 3.9, 0.08)], decay: vary(rand, 0.06, 0.3) };
    }
    r.thud = { gain: 0.25, lp: vary(rand, 500, 0.3), decay: 0.06 };
  } else {
    // Hard ground (a cart path): a bright click, the ball ringing, a
    // little low knock, sometimes a tiny skip.
    r.click = { gain: 0.8, band: vary(rand, 5000, 0.15), q: 0.7, decay: vary(rand, 0.0015, 0.25) };
    r.modes = [
      { freq: between(rand, 900, 1300), decay: vary(rand, 0.006, 0.2), gain: 0.45 * between(rand, 0.75, 1) },
      { freq: between(rand, 2300, 2900), decay: vary(rand, 0.012, 0.2), gain: 0.8 * between(rand, 0.75, 1) },
      { freq: between(rand, 4200, 5000), decay: vary(rand, 0.007, 0.2), gain: 0.45 * between(rand, 0.75, 1) * hard },
    ];
    r.thump = { gain: 0.2, freq: vary(rand, 180, 0.12), to: vary(rand, 130, 0.1), decay: vary(rand, 0.01, 0.2) };
    r.skitter = bounce === 0 && rand() < 0.7 ? [{ at: between(rand, 0.012, 0.03), gain: between(rand, 0.12, 0.25) }] : [];
    r.room = { gain: 0.08 };
  }
  return r;
}

// A ball meeting a tree in the air on a course (sim/treehits.mjs), by what
// it met (`part`): "trunk" a hard, woody knock - a low hollow note, a crack
// and only a few leaves; "caught" (stopped in the crown) and "branch" (off
// one) the rustle of a landing in the trees, always with a branch knocked;
// "clip" (through the leaves) the rustle alone, softer.
export function treeRecipe(part = "clip", speed = 10, rand = Math.random) {
  const r = landRecipe("trees", Math.max(10, speed), 0, rand);
  if (part === "trunk") {
    const f = between(rand, 240, 380);
    r.knock = { gain: 0.9, freqs: [f, f * vary(rand, 2.2, 0.06), f * vary(rand, 3.5, 0.06)], decay: vary(rand, 0.09, 0.2) };
    r.click = { gain: 0.5, band: vary(rand, 2800, 0.2), q: 0.8, decay: vary(rand, 0.002, 0.25) };
    r.thud = { gain: 0.45, lp: vary(rand, 450, 0.2), decay: 0.05 };
    r.grains = r.grains.slice(0, 2);
  } else if (part === "caught" || part === "branch") {
    const f = between(rand, 380, 720);
    r.knock ??= { gain: 0.35, freqs: [f, f * vary(rand, 2.3, 0.08), f * vary(rand, 3.9, 0.08)], decay: vary(rand, 0.06, 0.3) };
  } else {
    delete r.knock;
    r.grains = r.grains.map((g) => ({ ...g, gain: g.gain * 0.6 }));
  }
  return r;
}

// A splash: the plop of the ball going in, a burst of spray and a few
// droplets falling back. Bigger for a ball coming in fast and steep; a ball
// that rolls in just plops.
//   size     0-1, how big a splash
//   plop     { gain, freq, to, glide, decay }   the bubble as it goes under
//   body     { gain, from, to, sweep, decay }   the water thrown up
//   spray    { gain, hp, decay }
//   drops    [{ at, gain, freq, to, decay }]
export function splashRecipe(speed, steep = 0.7, rand = Math.random) {
  // Even a drive dropping out of the sky is a golf ball, not a bucket: the
  // biggest splash is no louder than a driver's strike, and soon over.
  const size = clamp((Math.max(0, speed) / 24) * (0.55 + 0.45 * clamp01(steep)), 0.08, 1);
  const gain = clamp(0.25 + 0.75 * size, 0.2, 1.1);
  const r = { size, gain };
  // The bubble's pitch rises all through its short life.
  const plopDecay = vary(rand, 0.035 + 0.02 * size, 0.25);
  r.plop = { gain: 0.7, freq: vary(rand, 260 - 60 * size, 0.15), to: 0, glide: plopDecay * 3, decay: plopDecay };
  r.plop.to = r.plop.freq * between(rand, 2.4, 3.6);
  // The water thrown up: a little even for a ball rolling in.
  r.body = { gain: 0.2 + 0.4 * size, from: vary(rand, 2500 + 3500 * size, 0.2), to: vary(rand, 800, 0.25), sweep: vary(rand, 0.1 + 0.2 * size, 0.2), decay: vary(rand, 0.04 + 0.07 * size, 0.2) };
  if (size > 0.18) r.spray = { gain: 0.2 * size, hp: vary(rand, 3500, 0.2), decay: vary(rand, 0.06 + 0.07 * size, 0.2) };
  const n = Math.round(clamp(2 + size * 6 + between(rand, -1.5, 1.5), 1, 10));
  r.drops = Array.from({ length: n }, (_, i) => {
    const f = between(rand, 900, 2600);
    return { at: between(rand, 0.06, 0.2 + 0.45 * size) + i * 0.01, gain: between(rand, 0.08, 0.2) * (1 - (i / (n + 2)) * 0.6), freq: f, to: f * between(rand, 1.4, 2.3), decay: vary(rand, 0.02, 0.3) };
  });
  r.drops.sort((a, b) => a.at - b.at);
  return r;
}

// The ball into the cup: a firm one taps the back of the liner first
// (entry), then a hollow clunk as it drops onto the bottom, then two to
// five quick rattles round the plastic, each quicker and quieter than the
// last (more for a ball arriving quicker, or dropping in on the fly).
//   entry    { gain, band, decay, drop }  the tap, and how long till the
//            clunk (s); none for a ball dying in over the front edge
//   clunk    { gain, freqs, decay, body, bodyDecay, hollow }
//   rattles  [{ at, gain, band, ring, decay }]  (at: after the clunk) -
//            the rattles of one cup close up at their own rate (shrink)
//            round their own band (tone), so one holed putt chatters
//            tightly and brightly and the next knocks about more slowly
export function cupRecipe(speed = 1, { fly = false, tapped = false } = {}, rand = Math.random) {
  const shrink = between(rand, 0.6, 0.84);
  const tone = between(rand, 1900, 3000);
  const pace = clamp(speed / 1.5, 0.2, 1.5) * (fly ? 1.5 : 1);
  const gain = clamp(0.45 + 0.35 * pace, 0.4, 1);
  const f0 = between(rand, 520, 760);
  const clunk = { gain: 0.8, freqs: [f0, f0 * vary(rand, 1.62, 0.05), f0 * vary(rand, 2.35, 0.05)], decay: vary(rand, 0.035, 0.25), body: vary(rand, 210, 0.15), bodyDecay: vary(rand, 0.035, 0.25), hollow: vary(rand, 900, 0.2) };
  const n = clamp(Math.round(2 + pace * 1.6 + between(rand, -0.6, 1.2)), 2, 5);
  let at = between(rand, 0.06, 0.11);
  let gap = at;
  let level = between(rand, 0.45, 0.65);
  const rattles = [];
  for (let i = 0; i < n; i++) {
    rattles.push({ at, gain: level, band: vary(rand, tone, 0.12), ring: f0 * between(rand, 0.95, 1.12), decay: vary(rand, 0.012, 0.3) });
    gap *= shrink * vary(rand, 1, 0.06);
    at += Math.max(0.018, gap);
    level *= between(rand, 0.5, 0.72);
  }
  // Firm enough to reach the back of the cup before it drops - unless that
  // knock has been heard already, from the ball meeting the wall itself.
  const entry = pace > 0.6 && !tapped ? { gain: between(rand, 0.06, 0.1) * Math.min(1, pace), band: between(rand, 2500, 3500), decay: vary(rand, 0.006, 0.25), drop: between(rand, 0.03, 0.05) } : null;
  return { gain, entry, clunk, rattles, shrink, tone };
}

// A lip-out: a small tick off the rim. Off the cup's wall (`wall`), the
// plastic liner's lower, hollower clack.
export function lipRecipe(speed = 1, rand = Math.random, { wall = false } = {}) {
  const f = wall ? between(rand, 900, 1400) : between(rand, 2300, 3200);
  return {
    gain: clamp(0.25 + 0.2 * speed, 0.2, 0.6),
    freqs: [f, f * vary(rand, 1.48, 0.04), f * vary(rand, 2.21, 0.04)],
    decay: vary(rand, 0.03, 0.25),
    click: vary(rand, wall ? 2500 : 5000, 0.2),
  };
}

// ---- Where a sound is heard from ------------------------------------------------------

// How loud a sound `distance` metres away is, against one at `ref` metres
// or closer: inverse distance, the way sound falls off outdoors.
export function distanceGain(distance, ref = 15) {
  const d = Math.max(0, Number(distance) || 0);
  return d <= ref ? 1 : ref / d;
}

// Far sounds lose their top end in the air: the low-pass cutoff for one
// `distance` metres away.
export function airCutoff(distance) {
  return clamp(18000 * Math.exp(-Math.max(0, distance) / 110), 1200, 18000);
}

// Left-right position (-1 to 1) of a point for a listener at `from` whose
// right hand points along `right` (both [x, y, z]); only the ground plane
// counts. Held back from the very edges.
export function panFor(from, right, point) {
  const dx = point[0] - from[0];
  const dz = point[2] - from[2];
  const len = Math.hypot(dx, dz);
  const rl = Math.hypot(right[0], right[2]);
  if (len < 1e-6 || rl < 1e-6) return 0;
  return clamp(((dx * right[0] + dz * right[2]) / (len * rl)) * 0.85, -0.85, 0.85);
}

// ---- The owner's recordings --------------------------------------------------------------

// Which to play: -1 for the synthesized sound, or the index of one of `n`
// recordings, by the recordings setting (RECORDINGS_MODES): "made" never a
// recording; "mixed" each recording as likely as the synthesized one;
// "only" always a recording, when there is one.
//
// Never the same recording twice running (the owner: "random selection from
// each pool, avoiding immediate repeats"): `last`, the one played last time
// (-1 for none, or the synthesized sound - which is drawn fresh each time,
// so it may come again), is left out of the draw whenever there's another.
export function chooseSource(n, rand = Math.random, mode = "made", last = -1) {
  if (!(n > 0) || mode === "made") return -1;
  // Recordings to draw from ("mixed": the synthesized sound one more, -1).
  const options = mode === "only" ? n : n + 1;
  const skip = last >= 0 && last < n && options > 1 ? last : -1;
  let pick = Math.min(options - (skip >= 0 ? 1 : 0) - 1, Math.floor(rand() * (options - (skip >= 0 ? 1 : 0))));
  if (skip >= 0 && pick >= skip) pick++;
  return pick >= n ? -1 : pick;
}

// A recording played again sounds different enough: a touch higher or
// lower, a little louder or quieter.
export function recordingVariation(rand = Math.random) {
  return { rate: between(rand, 0.95, 1.05), gain: between(rand, 0.8, 1) };
}
