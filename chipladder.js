// The chipping ladder: the approach ladder's rules round a smaller circle,
// 11 ft down to 2 ft a foot at a time, on one green for the whole game.
// Three holes, each with its own pin and its own spot to chip from - the
// fringe, the approach in front, then the rough - at 10 to 30 yards. How
// sloping the green is gets picked on the card before the game.
//
// Everything that happens after a shot (the circle, the marks, the ladder,
// the sounds, the look at the green) is the approach ladder's, so this only
// sets up the holes, the club and a closer camera. The chips fly, bounce
// and roll over the real fringe, rough and slopes (courseplay.mjs), as a
// chip round the green does on the course.

import { prepareHole } from "./sim/courseplay.mjs";
import { LADDERS } from "./sim/ladder.mjs";
import { chipGame, holeLayout, CHIP_GREENS, chipClub, plannedChipCarry } from "./sim/chipladder.mjs";
import { chipForCarry, CHIP_CLUBS } from "./sim/chipping.mjs";
import { middleCarry } from "./sim/lie.mjs";
import { ApproachLadder, radiusText } from "./approachladder.js";
import { clearGroup } from "./look/dispose.js";

// Longest to shortest, so ↓ moves to more loft as it does on the course.
const CLUBS = ["7I", "8I", "9I", "PW", "AW", "GW", "SW", "LW"];
const where = (kind) => ({ fringe: "from the fringe", fairway: "from the approach", rough: "from the rough" })[kind] ?? "";

export class ChipLadder extends ApproachLadder {
  constructor(host) {
    super(host);
    this.id = "chipping";
    this.option = {
      label: "Green",
      choices: { flat: "Flat", gentle: "Gentle slopes", moderate: "Moderate slopes", severe: "Severe slopes" },
      fallback: "gentle",
    };
    this.rules = LADDERS.chipping;
    // A 2 ft circle needs a thinner line, smaller marks and a camera in close.
    // Crouched behind the ball, and no look at the green first: from here
    // it's in plain view.
    this.look3d = { ringWidth: 0.07, ringShare: 0.065, mark: 0.12, chase: 7, pad: 2.5, lift: 1.2, back: 3.6, up: 2.3, intro: 0 };
    this.club = "SW";
    this.ballShadow.mesh.visible = false;
  }

  get info() {
    return this.plan?.holes[this.holeIndex] ?? null;
  }
  get yards() {
    return this.info?.yards ?? 0;
  }

  // ---- A game, a hole, a turn ------------------------------------------------------

  start(complexity, seed) {
    this.complexity = complexity in CHIP_GREENS ? complexity : "gentle";
    this.seed = seed;
    // One green for the game, the same for everyone: its three pins and
    // spots come with it.
    this.plan = chipGame(seed, this.complexity);
    this.builtKey = null;
  }

  // The game's green with hole `i`'s pin, drawn (unless it's up already).
  buildChipHole(i) {
    const key = `${this.seed}:${this.complexity}:${i}`;
    if (this.builtKey === key) return;
    this.builtKey = key;
    this.hole = prepareHole(holeLayout(this.plan, i));
    this.spot = this.plan.holes[i].start;
    this.lie = this.plan.holes[i].lie;
    this.drawHole();
  }

  beginTurn() {
    const i = this.holeIndex;
    this.buildChipHole(i);
    this.club = chipClub(this.info.kind, this.yards);
    this.freshLadder(`Hole ${i + 1} - ${this.yards} yds ${where(this.info.kind)}`);
  }

  preview() {
    this.start("gentle", 5);
    this.buildChipHole(0);
    this.aim = Math.atan2(this.hole.cup.z - this.spot[1], this.hole.cup.x - this.spot[0]);
    this.ladder = null;
    this.flying = null;
    this.pause = null;
    clearGroup(this.ringGroup);
    clearGroup(this.marks);
    this.address(true);
  }

  // ---- Shots ------------------------------------------------------------------------

  // A made-up chip: the right club's launch and spin, carried the usual
  // share of the way for that club, with a little human error.
  testShot() {
    if (!this.ladder) return null;
    const jitter = (v, amount) => v + (Math.random() - 0.5) * 2 * amount;
    const club = CHIP_CLUBS[this.club] ? this.club : "SW";
    const carry = plannedChipCarry(club, this.yards, this.lie);
    const shot = chipForCarry(club, carry / middleCarry(this.lie));
    return { ...shot, speedMph: jitter(shot.speedMph, shot.speedMph * 0.04), hla: jitter(0, 2), spinAxis: jitter(0, 6) };
  }

  // The chip about to be played, for the lie's guidance: the usual share
  // of the way in the air for the club, and the swing that carries it.
  lieSwing() {
    const club = CHIP_CLUBS[this.club] ? this.club : "SW";
    const plan = plannedChipCarry(club, this.yards, this.lie);
    return { swing: chipForCarry(club, plan), plan };
  }

  // For the stats: never a full swing round the green, as on the chipping
  // green - a chip if it's under 20 yards in the air, else a pitch.
  swingFor(result) {
    return result.carry < 20 ? "chip" : "pitch";
  }

  get clubs() {
    return CLUBS;
  }
  stepClub(delta) {
    const i = Math.max(0, CLUBS.indexOf(this.club));
    this.club = CLUBS[Math.min(CLUBS.length - 1, Math.max(0, i + delta))];
    this.host.sendClub();
    this.host.changed();
    return this.club;
  }

  // ---- What's on show -----------------------------------------------------------------

  noteFor(i, radius) {
    return `Chipping ladder - hole ${i + 1} of 3 - ${this.yards} yds ${where(this.info?.kind)} - ${radiusText(radius)} circle`;
  }
}

