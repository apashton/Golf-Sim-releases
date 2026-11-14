// The clubs, written down once: their order in the bag, their names, and a
// typical amateur's distances with them. Everything else (the club picker,
// the course's club suggestions, the club check, the stats page, test shots)
// reads them from here, so they can't drift apart.
//
// Pure, so the server, the pages and the tests all share it, and small, so
// the stats page can use it without loading the course engine.

// Longest to shortest: the order of the club picker and the stats tables.
// (The putter isn't in it: it's chosen by the putting modes, not the picker.)
export const CLUB_ORDER = ["DR", "3W", "5W", "4H", "4I", "5I", "6I", "7I", "8I", "9I", "PW", "AW", "GW", "SW", "LW"];

// Where the putter can be picked off a green (the owner, 26 October 2026:
// "the putter from the fringe or even off the fairway if chosen"): the
// short grass - the fringe, the fairway and the first cut. A putt from
// there rolls as one on the green does, slower until it's on it. On a
// green it's always the putter.
export const PUTTER_LIES = ["fringe", "fairway", "semi"];
export const puttsFrom = (lie) => PUTTER_LIES.includes(lie);

// The wedges' lofts, degrees. Between the pitching and lob wedges the bag
// has three wedges known by their loft (48, 52 and 56 degrees): AW, GW and
// SW underneath, and "48° wedge" and so on on screen. A spoken loft ("fifty
// two degree") picks the nearest of these.
export const WEDGE_LOFTS = { PW: 46, AW: 48, GW: 52, SW: 56, LW: 60 };
const BY_LOFT = ["AW", "GW", "SW"];
const loftName = (c) => `${WEDGE_LOFTS[c]}° wedge`;

export const CLUB_NAMES = {
  DR: "Driver",
  "3W": "3 wood",
  "5W": "5 wood",
  "4H": "4 hybrid",
  "4I": "4 iron",
  "5I": "5 iron",
  "6I": "6 iron",
  "7I": "7 iron",
  "8I": "8 iron",
  "9I": "9 iron",
  PW: "Pitching wedge",
  AW: loftName("AW"),
  GW: loftName("GW"),
  SW: loftName("SW"),
  LW: "Lob wedge",
  PT: "Putter",
};

// "7 iron" for "7I"; anything unknown as it is.
export const clubName = (c) => CLUB_NAMES[c] ?? c;
// A club in a few letters, for a picker, a table or a badge: its code
// ("7I", "PW"), or a loft-named wedge's loft ("52°").
export const clubShort = (c) => (BY_LOFT.includes(c) ? `${WEDGE_LOFTS[c]}°` : c);

// A typical amateur bag: carry in yards, and the launch and spin that go with
// each club, for suggesting a club and for test shots. `speed` is the ball
// speed (mph) that carries it that far - shotForCarry (courseplay.mjs) works
// it out, but that takes a few hundred flights for the whole bag, too slow to
// do while someone is aiming; the tests keep the two in step.
export const BAG = {
  DR: { carry: 230, vla: 12, spin: 2700, speed: 142 },
  "3W": { carry: 210, vla: 11.5, spin: 3600, speed: 134.5 },
  "5W": { carry: 195, vla: 12.5, spin: 4300, speed: 129 },
  "4H": { carry: 185, vla: 13.5, spin: 4600, speed: 124.5 },
  "4I": { carry: 178, vla: 13, spin: 4700, speed: 121 },
  "5I": { carry: 170, vla: 14, spin: 5300, speed: 118 },
  "6I": { carry: 160, vla: 15.5, spin: 6100, speed: 114 },
  "7I": { carry: 150, vla: 17, spin: 6800, speed: 109 },
  "8I": { carry: 140, vla: 19, spin: 7500, speed: 104.5 },
  "9I": { carry: 130, vla: 21, spin: 8300, speed: 99 },
  PW: { carry: 118, vla: 24, spin: 8800, speed: 93 },
  AW: { carry: 112, vla: 25.5, spin: 8900, speed: 89.5 },
  GW: { carry: 104, vla: 27, spin: 9000, speed: 85 },
  SW: { carry: 88, vla: 30, spin: 9200, speed: 76.5 },
  LW: { carry: 70, vla: 33, spin: 8500, speed: 66 },
};

// A made-up full swing with a club, for the range's Test shot: the bag's
// numbers, a little different each time (speed within 4%, launch within
// 1.5°, direction within 3°, spin within 10%, curve within 9°). So a test
// drive on the range flies as far as one on the course. An unknown club
// swings the driver.
export function testSwing(club, rand = Math.random) {
  const jitter = (v, amount) => v + (rand() - 0.5) * 2 * amount;
  const b = BAG[club] ?? BAG.DR;
  return {
    speedMph: jitter(b.speed, b.speed * 0.04),
    vla: jitter(b.vla, 1.5),
    hla: jitter(0, 3),
    totalSpin: jitter(b.spin, b.spin * 0.1),
    spinAxis: jitter(0, 9),
  };
}
