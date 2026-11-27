// What one shot's numbers say, for the shot data screen: the launch
// monitor's own readings plus what follows from them - smash factor,
// face-to-path, spin loft, the shot's shape, where on the face it was struck
// - and whatever the flight model adds. Pure, so it can be tested.
//
// Directions are GSPro's, as the Omni's readings are turned to (omni.js):
// positive is to the right for a right-handed player - an open face, an
// in-to-out path, a fade spin axis, a ball starting right.

const has = (v) => typeof v === "number" && Number.isFinite(v);
const round = (v, dp = 1) => (has(v) ? Math.round(v * 10 ** dp) / 10 ** dp : null);

// Where the words change: a start more than 2° either way is a push or a
// pull; a curve beyond 4° of spin axis a fade or draw (15° a slice or hook);
// a strike 5 mm or more from the centre is off the toe, heel, high or low.
export const SHAPE_LIMITS = Object.freeze({ start: 2, curve: 4, bend: 15, centreMm: 5 });

// Club - how the club met the ball, from above and from the side.
//   facePath   face angle relative to the path: what curves the ball
//   spinLoft   dynamic loft less attack angle: what spins it
//   smash      ball speed per club speed: how well it was struck
export function derive(ball, club) {
  const c = club ?? {};
  const facePath = has(c.faceToTarget) && has(c.path) ? c.faceToTarget - c.path : null;
  const spinLoft = has(c.loft) && has(c.angleOfAttack) ? c.loft - c.angleOfAttack : null;
  const smash = has(c.speedMph) && c.speedMph > 0 && has(ball?.speedMph) ? ball.speedMph / c.speedMph : null;
  return { facePath: round(facePath), spinLoft: round(spinLoft), smash: round(smash, 2) };
}

// The shot's shape in the usual words: where it started (pull, straight,
// push) and how it curved (hook, draw, straight, fade, slice).
// With club data it's read from the face (start) and face-to-path (curve);
// without, from the ball's direction and spin axis, which say the same.
// hand: "left" for a left-hander (their profile), whose push starts left
// and whose draw curves right.
export function shotShape(ball, club, hand = "right") {
  const d = derive(ball, club);
  let start = has(club?.faceToTarget) ? club.faceToTarget : ball?.hla;
  // A face-to-path of a degree curves the ball about as much as 2-3 degrees
  // of spin axis; the thresholds below are in spin axis degrees.
  let curve = has(d.facePath) ? d.facePath * 2.5 : ball?.spinAxis;
  if (!has(start) && !has(curve)) return null;
  const side = hand === "left" ? -1 : 1;
  start = has(start) ? start * side : 0;
  curve = has(curve) ? curve * side : 0;
  const { start: s, curve: c, bend } = SHAPE_LIMITS;
  const startWord = start < -s ? "Pull" : start > s ? "Push" : "";
  const curveWord = curve < -bend ? "hook" : curve < -c ? "draw" : curve > bend ? "slice" : curve > c ? "fade" : "";
  if (!startWord && !curveWord) return { name: "Straight", start: "straight", curve: "straight" };
  const name = startWord && curveWord ? `${startWord} ${curveWord}` : startWord || curveWord[0].toUpperCase() + curveWord.slice(1);
  return { name, start: startWord.toLowerCase() || "straight", curve: curveWord || "straight" };
}

// Where on the face, in words: "toe, high", "centre". Readings are taken as
// millimetres from the centre, across (toe +) and up (high +).
export function strikeWords(club) {
  const h = club?.impactHorizontal;
  const v = club?.impactVertical;
  if (!has(h) && !has(v)) return null;
  const centre = SHAPE_LIMITS.centreMm;
  const across = !has(h) || Math.abs(h) < centre ? "" : h > 0 ? "toe" : "heel";
  const up = !has(v) || Math.abs(v) < centre ? "" : v > 0 ? "high" : "low";
  return [across, up].filter(Boolean).join(", ") || "centre";
}

// Everything the screen shows for one shot. flight: what simulateShot gave
// (carry, total, apex, descentAngle, offline, hangTime), if known. hand:
// the hitter's (a left-hander's draw curves right).
export function shotReport(entry, flight = null, hand = "right") {
  const ball = entry?.ball ?? {};
  const club = entry?.clubData ?? null;
  return {
    clubName: entry?.club ?? null,
    measuredSpin: entry?.measuredSpin ?? null,
    ball: {
      speed: round(ball.speedMph),
      launch: round(ball.vla),
      direction: round(ball.hla),
      spin: has(ball.totalSpin) ? Math.round(ball.totalSpin) : null,
      spinAxis: round(ball.spinAxis),
      backSpin: has(ball.totalSpin) && has(ball.spinAxis) ? Math.round(ball.totalSpin * Math.cos((ball.spinAxis * Math.PI) / 180)) : null,
      sideSpin: has(ball.totalSpin) && has(ball.spinAxis) ? Math.round(ball.totalSpin * Math.sin((ball.spinAxis * Math.PI) / 180)) : null,
    },
    club: club && {
      speed: round(club.speedMph),
      path: round(club.path),
      face: round(club.faceToTarget),
      attack: round(club.angleOfAttack),
      loft: round(club.loft),
      // The club's lie angle at impact, when a launch monitor sends it
      // (Open Connect's Lie; not the Omni).
      lie: round(club.lie),
      impactH: round(club.impactHorizontal),
      impactV: round(club.impactVertical),
    },
    derived: derive(ball, club),
    shape: shotShape(ball, club, hand),
    strike: strikeWords(club),
    flight: flight && {
      carry: round(flight.carry),
      total: round(flight.total),
      apex: round(flight.apex),
      descent: round(flight.descentAngle),
      offline: round(flight.offline),
      hang: round(flight.hangTime),
    },
  };
}

// The numbers averaged for the session table, and where each is in a report.
const AVERAGED = {
  ballSpeed: (r) => r.ball.speed,
  clubSpeed: (r) => r.club?.speed,
  smash: (r) => r.derived.smash,
  launch: (r) => r.ball.launch,
  spin: (r) => r.ball.spin,
  carry: (r) => r.flight?.carry,
  total: (r) => r.flight?.total,
  path: (r) => r.club?.path,
  face: (r) => r.club?.face,
  attack: (r) => r.club?.attack,
};

// Running totals for a club's averages, so they can cover a whole session
// while the shot data screen keeps only its latest shots. Each number is
// averaged over the shots that have it.
//   add(report)          a new shot
//   swap(before, after)  the same shot again with its club data, which
//                        comes a moment later: counted once, not twice
export class Tally {
  constructor() {
    this.shots = 0;
    this.sums = {};
  }

  add(report, sign = 1) {
    this.shots += sign;
    for (const [k, get] of Object.entries(AVERAGED)) {
      const v = get(report);
      if (!has(v)) continue;
      const sum = (this.sums[k] ??= { total: 0, count: 0 });
      sum.total += sign * v;
      sum.count += sign;
    }
  }

  swap(before, after) {
    this.add(before, -1);
    this.add(after);
  }

  averages() {
    const out = { shots: this.shots };
    for (const k of Object.keys(AVERAGED)) {
      const sum = this.sums[k];
      out[k] = sum?.count > 0 ? round(sum.total / sum.count, k === "smash" ? 2 : 1) : null;
    }
    return out;
  }
}

// Averages of a list of reports: each number over the shots that have it.
export function averages(reports) {
  const tally = new Tally();
  for (const r of reports) tally.add(r);
  return tally.averages();
}

// Club numbers to go with a test shot's ball, so the shot data screen has
// something to show without a launch monitor. Believable, not measured:
// speed from a typical smash factor for the club, a face that starts the
// ball where it went and a path that curves it the way its spin axis does,
// a typical attack angle and loft, and a strike somewhere near the middle.
export function testClubData(ball, clubCode = "7I", rand = Math.random) {
  if (!has(ball?.speedMph) || clubCode === "PT") return null;
  const wood = /^(DR|\dW|\dH)$/.test(clubCode);
  const wedge = /^(PW|AW|GW|SW|LW)$/.test(clubCode);
  const smash = clubCode === "DR" ? 1.47 : wood ? 1.42 : wedge ? 1.22 : 1.33;
  const jitter = (spread) => (rand() * 2 - 1) * spread;
  const face = (ball.hla ?? 0) * 0.85;
  const path = face - (ball.spinAxis ?? 0) / 2.5;
  const attack = clubCode === "DR" ? 1.5 + jitter(2) : wood ? -1 + jitter(1.5) : -4 + jitter(2);
  const loft = (ball.vla ?? 12) * (clubCode === "DR" ? 1.15 : 1.3) + jitter(1);
  return {
    speedMph: round(ball.speedMph / smash, 1),
    path: round(path),
    faceToTarget: round(face),
    angleOfAttack: round(attack),
    loft: round(loft),
    impactHorizontal: round(jitter(12)),
    impactVertical: round(jitter(8)),
  };
}
