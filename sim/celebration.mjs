// What finishing a hole deserves. The further under par, the bigger the
// party: a sparkle for a par, confetti for a birdie, fireworks from an
// eagle, the camera circling the flag for an albatross or an ace. The
// further over, the quieter it gets: a low note for a bogey, the picture
// briefly draining of colour for a double, more so for worse. Every hole's
// score is its word in 3D letters (sim/scoreword.mjs): the better it is
// the bigger and brighter, a par's still bright but the tamest, and each
// score over par duller and flatter, to near black for a triple bogey and
// anything worse. (The banner styles here - gold, bright, neat, plain -
// are the round's and the games' boxes.) Pure, so the ladder can be tested
// and shared with the page.

import { YARD } from "./flight.mjs";
import { FOOT } from "./putting.mjs";

// Best to worst. An ace and an albatross (or a condor) share the top rung.
export const TIERS = ["ace", "albatross", "eagle", "birdie", "par", "bogey", "double", "worse"];

export const LEVEL = { ace: 3, albatross: 3, eagle: 2, birdie: 1, par: 0, bogey: -1, double: -2, worse: -3 };

// Everything each level gets. Going up a rung never gives less (confetti,
// fireworks, sparkle, loudness, banner size, time on screen); going down
// never gives less gloom (desaturation, dimming). The tests hold it to that.
//  confetti   pieces at High quality
//  streamers  paper ribbons fired from the confetti cannons, at High
//  fireworks  bursts
//  sparkle    size of the ring of sparkles round the cup, 0-1
//  camera     where the camera goes: back to frame the flag against the sky,
//             orbiting it (radians a second) at the top
//  sound      which sound (see sounds.js: a crowd round the green for a
//             birdie and better, made up for the rest), and how loud, 0-1
//  desaturate how much colour leaves the picture at worst, 0-1; dim likewise
//             for brightness
//  hold       seconds before moving on to the next hole
//  banner     style (gold, bright, neat, plain), size (1 is the biggest) and
//             how bright it is
const LADDER = {
  3: {
    confetti: 900, streamers: 64, fireworks: 8, sparkle: 1, camera: { distance: 9, height: 2.5, lookUp: 2.8, orbit: 0.28 },
    sound: "roar", volume: 1, desaturate: 0, dim: 0, hold: 10, banner: { style: "gold", size: 1, opacity: 1 },
  },
  2: {
    confetti: 550, streamers: 40, fireworks: 4, sparkle: 0.8, camera: { distance: 8, height: 2.3, lookUp: 2.6, orbit: 0 },
    sound: "cheer", volume: 0.85, desaturate: 0, dim: 0, hold: 8, banner: { style: "gold", size: 0.9, opacity: 1 },
  },
  1: {
    confetti: 280, streamers: 18, fireworks: 0, sparkle: 0.6, camera: { distance: 6, height: 2, lookUp: 2, orbit: 0 },
    sound: "applause", volume: 0.6, desaturate: 0, dim: 0, hold: 6, banner: { style: "bright", size: 0.8, opacity: 1 },
  },
  0: {
    confetti: 0, streamers: 0, fireworks: 0, sparkle: 0.35, camera: null,
    sound: "chime", volume: 0.55, desaturate: 0, dim: 0, hold: 4.5, banner: { style: "neat", size: 0.62, opacity: 1 },
  },
  "-1": {
    confetti: 0, streamers: 0, fireworks: 0, sparkle: 0, camera: null,
    sound: "low", volume: 0.4, desaturate: 0, dim: 0, hold: 4.5, banner: { style: "plain", size: 0.5, opacity: 0.95 },
  },
  "-2": {
    confetti: 0, streamers: 0, fireworks: 0, sparkle: 0, camera: null,
    sound: "lower", volume: 0.32, desaturate: 0.55, dim: 0.08, hold: 4.5, banner: { style: "plain", size: 0.46, opacity: 0.85 },
  },
  "-3": {
    confetti: 0, streamers: 0, fireworks: 0, sparkle: 0, camera: null,
    sound: "muted", volume: 0.25, desaturate: 0.85, dim: 0.16, hold: 4.5, banner: { style: "plain", size: 0.42, opacity: 0.72 },
  },
};

// A putt this long or longer gets its length on the banner.
export const LONG_PUTT_FT = 15;

// The tier for a score on a hole.
export function tierFor(strokes, par, { pickedUp = false } = {}) {
  if (pickedUp) return "worse";
  const d = strokes - par;
  if (strokes === 1) return "ace";
  if (d <= -3) return "albatross";
  if (d === -2) return "eagle";
  if (d === -1) return "birdie";
  if (d === 0) return "par";
  if (d === 1) return "bogey";
  if (d === 2) return "double";
  return "worse";
}

const OVER = { 3: "Triple bogey", 4: "Quadruple bogey" };

function titleFor(tier, strokes, par, pickedUp) {
  const d = strokes - par;
  if (pickedUp) return "Picked up";
  switch (tier) {
    case "ace":
      return "Hole in one!";
    case "albatross":
      return d <= -4 ? "Condor!" : "Albatross!";
    case "eagle":
      return "Eagle!";
    case "birdie":
      return "Birdie!";
    case "par":
      return "Par";
    case "bogey":
      return "Bogey";
    case "double":
      return "Double bogey";
    default:
      return OVER[d] ?? `+${d}`;
  }
}

const feet = (ft) => (ft < 10 ? String(Math.round(ft * 10) / 10) : String(Math.round(ft)));

// The line under the title: what made it notable, if anything.
function subtitleFor({ tier, strokes, par, gimme, gimmeFeet, pickedUp, holedFromFeet, chipIn, holedFromYards, fromLie }) {
  if (pickedUp) return "";
  // (Not the score in numbers - "3 on the par 4": the owner, "doesn't
  // need the text". An ace's banner says it's a hole in one already.)
  if (tier === "ace") {
    const d = strokes - par;
    if (d <= -4) return "A condor too!";
    if (d === -3) return "An albatross too!";
    return "";
  }
  if (chipIn) {
    const yds = Number.isFinite(holedFromYards) ? Math.round(holedFromYards) : null;
    const from = yds ? ` from ${yds} yds` : "";
    if (fromLie === "bunker" || fromLie === "greenside") return `Holed out of the bunker${from}`;
    if (fromLie === "waste") return `Holed out from the waste area${from}`;
    if (yds && yds >= 40) return `Holed out${from}`;
    return `Chipped in${from}`;
  }
  if (Number.isFinite(holedFromFeet) && holedFromFeet >= LONG_PUTT_FT) return `Holed from ${Math.round(holedFromFeet)} ft`;
  if (gimme) return Number.isFinite(gimmeFeet) ? `Given from ${feet(gimmeFeet)} ft` : "Given";
  return "";
}

function describe(level) {
  const rung = LADDER[level];
  return { ...rung, camera: rung.camera ? { ...rung.camera } : null, banner: { ...rung.banner } };
}
// The same, for other games that pick a rung of the ladder (-3 to 3) for
// themselves (sim/challenges.mjs).
export const describeLevel = (level) => describe(Math.max(-3, Math.min(3, Math.round(level))));

// What a finished hole gets.
//  strokes, par      the score
//  pickedUp          picked up at the stroke limit
//  gimme, gimmeFeet  the last putt was given, from this far
//  holedFromFeet     the last putt went in from this far
//  chipIn            holed from off the green (holedFromYards, fromLie)
export function celebrationFor({
  strokes,
  par,
  gimme = false,
  gimmeFeet = null,
  pickedUp = false,
  holedFromFeet = null,
  chipIn = false,
  holedFromYards = null,
  fromLie = null,
} = {}) {
  const tier = tierFor(strokes, par, { pickedUp });
  const level = LEVEL[tier];
  return {
    tier,
    level,
    title: titleFor(tier, strokes, par, pickedUp),
    subtitle: subtitleFor({ tier, strokes, par, gimme, gimmeFeet, pickedUp, holedFromFeet, chipIn, holedFromYards, fromLie }),
    detail: "",
    ...describe(level),
  };
}

// What the end of a hole tells the banner, from how it ended and the last
// shot: a putt that dropped (and from how far), a shot holed from off the
// green (a chip-in or holed out, unless it was the tee shot: that's an ace),
// a gimme and how short it was, or picked up.
//  how         "holed", "given" or "picked up"
//  lie         the lie the last shot was played from
//  fromMetres  how far from the hole it was played
//  leftMetres  how far from the hole it finished
export function finishFacts({ strokes, par, how, lie, fromMetres, leftMetres = null }) {
  const holed = how === "holed";
  const putt = lie === "green";
  return {
    strokes,
    par,
    pickedUp: how === "picked up",
    gimme: how === "given",
    gimmeFeet: how === "given" && Number.isFinite(leftMetres) ? leftMetres / FOOT : null,
    holedFromFeet: holed && putt ? fromMetres / FOOT : null,
    chipIn: holed && !putt && strokes > 1,
    holedFromYards: holed && !putt ? fromMetres / YARD : null,
    fromLie: lie,
  };
}

// The end of a round, scaled by how far over par it went for the holes
// played: under par is the whole show, level par nearly so, and it quietens
// through a good round (about 6 over for 18), a steady one (13 over) and a
// bogey round. Finishing a round is never met with the grey-out, so it stops
// at the plain banner.
export function roundCelebration({ total, par, holes = 18 }) {
  const over = total - par;
  const perHole = over / Math.max(1, holes);
  let level;
  if (over < 0) level = 3;
  else if (over === 0) level = 2;
  else if (perHole <= 0.34) level = 1;
  else if (perHole <= 0.75) level = 0;
  else level = -1;
  const titles = { 3: "Under par!", 2: "Level par!", 1: "Great round!", 0: "Round complete", "-1": "Round complete" };
  const tiers = { 3: "under", 2: "level", 1: "good", 0: "steady", "-1": "over" };
  const score = over === 0 ? "level par" : over > 0 ? `${over} over par` : `${-over} under par`;
  const d = describe(level);
  return {
    tier: tiers[level],
    level,
    round: true,
    title: titles[level],
    subtitle: `${total} - ${score}`,
    detail: `${holes} ${holes === 1 ? "hole" : "holes"} played`,
    ...d,
    // Nothing follows the last hole, so the banner can stay up a while.
    hold: d.hold + 3,
    camera: d.camera ? { ...d.camera, orbit: level === 3 ? d.camera.orbit : 0 } : null,
  };
}

// How many particles to draw: fewer on Standard graphics, for slower PCs.
export const STANDARD_SHARE = 0.4;
export function particleCounts(desc, { high = true } = {}) {
  const k = high ? 1 : STANDARD_SHARE;
  return {
    confetti: Math.round((desc.confetti ?? 0) * k),
    streamers: Math.round((desc.streamers ?? 0) * k),
    fireworks: desc.fireworks ?? 0,
    perBurst: desc.fireworks ? Math.round((high ? 160 : 70) * (0.8 + 0.2 * Math.max(0, desc.level - 1))) : 0,
    sparkle: Math.round((desc.sparkle ?? 0) * (high ? 90 : 40)),
  };
}

// The crowd round the green for each good score, graded (the owner, 16
// October 2026: "the cheers need to be like more enthusiastic for a hole in
// one and an eagle than a birdie"): recordings played together (sounds.js
// gallery), each [family, gain, delay s, until s, pan]. A birdie: a round of
// applause, quieter (its volume above) and shorter. An eagle: two different
// cheers from either side with applause under them. An ace or an albatross:
// the whole gallery - a roar, a second roar swelling in from the other side
// as the rest realise, cheers on top and applause going on under it all.
// (The families: public/soundpack's applause, crowd and roar - the small
// applause and small cheering are applause, so an eagle never gets them.)
export const CROWDS = {
  applause: [["applause", 0.85, 0, 5]],
  cheer: [
    ["crowd", 1, 0, 7.5, -0.3],
    ["crowd", 0.75, 0.45, 7.5, 0.35],
    ["applause", 0.65, 0.25, 7.5, 0.05],
  ],
  roar: [
    ["roar", 1, 0, 9.5, -0.15],
    ["roar", 0.85, 0.7, 9.5, 0.5],
    ["crowd", 0.8, 0.3, 9.5, -0.5],
    ["crowd", 0.6, 1.4, 9.5, 0.25],
    ["applause", 0.65, 0.9, 9.5, 0.4],
  ],
};
// How much crowd a gallery is, for comparing them: every layer's gain over
// its length, times the score's volume.
export const crowdSize = (layers, volume = 1) => volume * layers.reduce((n, [, gain, delay, until]) => n + gain * (until - delay), 0);

// The sounds that are the crowd: all a celebration plays with its effects
// off (celebrationfx.js) - the rest (the chimes, low notes, fireworks'
// pops, fanfares, heartbeat) stay quiet.
export const CROWD_SOUNDS = ["roar", "cheer", "applause", "cheerBig", "cheerSmall"];
export const soundWithEffects = (name, effectsOn) => (effectsOn || CROWD_SOUNDS.includes(name) ? name : null);

// How this celebration's confetti comes (the owner, 16 October 2026: "the
// graphics a little bit? Just another version of it"): not the same every
// time. rand: a seeded random (look/celebrate.js), so a captured one looks
// the same again.
//  cannons   two confetti cannons either side of the flag fire paper and
//            streamers up over it
//  shower    confetti raining in from above the flag
//  popper    confetti fired up out of the cup (an eagle and better)
//  foil      the share of the pieces that are gold or silver foil,
//            flashing as they turn to the light
//  gold      the colours mostly gold (an ace, an albatross)
//  bursts    the fireworks' kinds, one per burst, in turn: "peony" (a ball
//            of sparks), "ring" (a flat ring), "willow" (long gold trails
//            drooping), "crackle" (glitter that twinkles out)
export const BURSTS = ["peony", "ring", "willow", "crackle"];
export function celebrationStyle(level, rand = Math.random) {
  if (level < 1) return { cannons: false, shower: false, popper: false, foil: 0, gold: false, bursts: [] };
  // A birdie: cannons or a shower, either.
  if (level === 1) {
    const cannons = rand() < 0.5;
    return { cannons, shower: !cannons, popper: false, foil: 0.14, gold: false, bursts: [] };
  }
  // Fireworks in a mixed order, never the same kind twice running.
  const first = Math.floor(rand() * BURSTS.length);
  // (Forwards or backwards round the list: every kind comes before any
  // comes again.)
  const step = rand() < 0.5 ? 1 : BURSTS.length - 1;
  const bursts = Array.from({ length: BURSTS.length }, (_, i) => BURSTS[(first + i * step) % BURSTS.length]);
  if (level === 2) return { cannons: true, shower: rand() < 0.5, popper: true, foil: 0.22, gold: false, bursts };
  return { cannons: true, shower: true, popper: true, foil: 0.32, gold: true, bursts };
}
