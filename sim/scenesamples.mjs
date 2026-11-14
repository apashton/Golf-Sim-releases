// What the scene designer page (scenedesigner.js) shows in its picture, in
// place of a game being played: one made-up 7 iron, hit again every
// CYCLE seconds - before the shot, in the air, then landed - so every
// layer has something real to show at each of its times, as it would in
// the game (the owner: "the ability to setup scenes ... rather than me
// doing it in the simulator bay"). The compositor's info() (compositor.js)
// for a page with no game: { shot, player, club, mode, overlay, map, card }.
// Pure, for the page and the tests.
//
//   sampleInfo({ hole, course, start }) -> (now) => info
//
// hole: a hole's layout (the mini map's), a par 3 of about 160 yds, the
// shot's flight laid along it to its pin. course: { name, pars, yards } -
// the round card's. start: when the first cycle began (ms).

import { simulateShot } from "./flight.mjs";
import { flightSeconds, AFTER } from "./shotphase.mjs";
import { roundStats } from "./roundstats.mjs";
import { roundCard } from "./roundcard.mjs";

export const SAMPLE_PLAYER = "Alex";
export const SAMPLE_CLUB = "7I";
// A good 7 iron: about 164 yds in the air, 170 in all.
export const SAMPLE_BALL = Object.freeze({ speedMph: 118, vla: 16.3, hla: -0.8, totalSpin: 6900, spinAxis: 2.1 });
export const SAMPLE_CLUB_DATA = Object.freeze({ speedMph: 87.4, path: 1.4, faceToTarget: 0.2, angleOfAttack: -4.2, loft: 21.8, impactHorizontal: 1.5, impactVertical: -1 });
// Seconds before the shot each time round.
export const ADDRESS = 4;
const FOOT = 0.3048;

// The flight laid along the hole: from the tee (the path's first point)
// towards the pin. [x, y] in the hole's own metres.
function along(hole, p) {
  const tee = hole?.path?.[0] ?? [0, 0];
  const pin = hole?.pin ?? hole?.path?.at(-1) ?? [150, 0];
  const a = Math.atan2(pin[1] - tee[1], pin[0] - tee[0]);
  return [tee[0] + Math.cos(a) * p[0] - Math.sin(a) * p[2], tee[1] + Math.sin(a) * p[0] + Math.cos(a) * p[2]];
}

// The round card's round: par on every hole but a bogey (three putts) on
// the 4th and a birdie on the sample hole (the 7 iron close, the putt in).
export function sampleCard(course, { player = SAMPLE_PLAYER, birdie = null } = {}) {
  const pars = course?.pars?.length ? course.pars : [4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 3, 4];
  const yards = course?.yards?.length === pars.length ? course.yards : pars.map((p) => (p === 3 ? 165 : p === 4 ? 395 : 515));
  const shots = [];
  pars.forEach((par, i) => {
    const hole = i + 1;
    let n = 0;
    const add = (lie, d, f, to, c) => shots.push({ t: hole * 100 + n++, g: { k: "course", id: "sample", hole, par }, c: c ?? (lie === "green" ? "PT" : "7I"), sw: lie === "green" ? "putt" : "full", lie, tg: { d, f, made: to === "cup" || undefined }, to });
    if (par === 3) add("tee", yards[i], hole === birdie ? 1.3 : 8, "green", "7I");
    else {
      if (par === 5) add("tee", yards[i], 260, "fairway", "DR");
      add(par === 5 ? "fairway" : "tee", par === 5 ? 260 : yards[i], 150, "fairway", par === 5 ? "3W" : "DR");
      add("fairway", 150, 7, "green");
    }
    if (hole === birdie) add("green", 1.3, 0, "cup");
    else if (hole === 4) {
      add("green", 7, 2, "green");
      add("green", 2, 0.4, "green");
      add("green", 0.4, 0, "cup");
    } else {
      add("green", 7, 0.5, "green");
      add("green", 0.5, 0, "cup");
    }
  });
  const scores = pars.map((p, i) => p + (i + 1 === birdie ? -1 : i === 3 ? 1 : 0));
  const name = course?.name ?? "Golf Sim Links";
  const total = pars.reduce((a, b) => a + b, 0);
  const stats = roundStats(shots, { scores, pars, yards, total, holes: pars.length, complete: true, name }, { level: 12 });
  return roundCard(stats, { player, index: 12, against: "your handicap (12.0)", date: Date.UTC(2026, 9, 3, 14), course: name, weather: "Light breeze: 8 mph, 17 °C" });
}

export function sampleInfo({ hole = null, course = null, start = 0 } = {}) {
  const flight = simulateShot(SAMPLE_BALL);
  const fly = flightSeconds({ flight });
  const cycle = (ADDRESS + fly + AFTER) * 1000;
  const number = hole?.number ?? 17;
  const par = hole?.par ?? 3;
  const yds = hole?.yards ?? 160;
  const name = course?.name ?? "Golf Sim Links";
  const tee = hole?.path?.[0] ?? [0, 0];
  const pin = hole?.pin ?? hole?.path?.at(-1) ?? [150, 0];
  const rest = along(hole, flight.rest);
  const left = Math.hypot(pin[0] - rest[0], pin[1] - rest[1]);
  const leftFt = Math.max(1, Math.round(left / FOOT));
  const holeNote = `${name} - hole ${number}, par ${par}, ${yds} yds`;
  const card = sampleCard(course, { birdie: number });
  // The overlay (the game's own words, sim/videotiles.mjs reads them):
  // on the tee, then on the green.
  const onTee = {
    title: "",
    note: `${holeNote} · Wind ↗ 8 mph`,
    lie: [{ text: "Tee: carries as hit (100%)", short: "100%" }],
    stance: null,
    stats: [
      { label: "To the pin", value: String(yds), unit: "yds" },
      { label: "Score", value: "+1" },
      { label: "Strokes", value: "0" },
    ],
  };
  const onGreen = {
    title: `On the green - ${leftFt} ft`,
    note: `${holeNote} · Wind ↗ 8 mph`,
    lie: [{ text: "Green: putts roll true", short: "Green" }],
    stance: null,
    stats: [
      { label: "To the hole", value: String(leftFt), unit: "ft" },
      { label: "Score", value: "+1" },
      { label: "Strokes", value: "1" },
    ],
  };
  const shots = new Map();
  return (now) => {
    const k = Math.max(0, Math.floor((now - start) / cycle));
    const from = start + k * cycle;
    // The shot of this time round (the same object all the way through,
    // as the game's is), arriving ADDRESS seconds in.
    if (!shots.has(k)) {
      shots.clear();
      shots.set(k, { shotNumber: k + 1, at: from + ADDRESS * 1000, ball: { ...SAMPLE_BALL }, clubData: { ...SAMPLE_CLUB_DATA }, flight, player: SAMPLE_PLAYER, hand: "right", club: SAMPLE_CLUB });
    }
    const shot = shots.get(k);
    const down = now >= shot.at + fly * 1000;
    const map = hole?.path?.length
      ? {
          layout: hole,
          extras: down ? { ball: rest, shots: [tee, rest], aim: null, others: [], drops: [] } : { ball: tee, shots: [], aim: { from: tee, to: pin }, others: [], drops: [] },
          key: `sample|${down ? "down" : "tee"}`,
        }
      : null;
    return { shot, player: SAMPLE_PLAYER, club: SAMPLE_CLUB, mode: "course", overlay: down ? onGreen : onTee, map, card };
  };
}
