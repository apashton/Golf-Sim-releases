// The A² Golf video (docs/VIDEO-PLAN.md): the one video of the game, played
// by the game itself and recorded as it plays. The owner, 28 October 2026:
// "Just one video. Showing a tee shot on each type of hole. And approach
// shot on two holes. 2 putts. A hole in one. Showing off multiplayer hole but
// show the drives coming towards the camera (would never see it this way in
// game) show the second shot by one of the player from their viewpoint. But
// all the other 3 players already shoot before the player in view. Lastly
// show the green with all 4 putts going at similar times. Show a quick demo
// of the course designer showing how easy to amend holes even with the
// multiple options. Mentions working with mobile touch screen controller
// mouse and golf launchers. Sense check all the shots for anything unusual."
//
// This file is the video with nothing of the page: its scenes and captions,
// the shots it plays - each found by flying it first in the same physics
// the course plays it with (playShot, playPutt), from where the course has
// the ball, its lie, club, aim and stance (lineUp: as course.js sets them
// up), so what's planned is what flies - the checks every shot is held to,
// and the online game the four friends play. public/showreel.js plays it
// on the page. Pure, for the page and the tests.

import { playShot, playPutt, readPutt, suggestClub, defaultAim, distanceToPin, riseToPin, typicalShot, faceAhead, scoreName } from "./courseplay.mjs";
import { stanceAt, stanceFromSlope, FLAT, LIE_NAMES } from "./lie.mjs";
import { nearest, makePath, pointAt, seeded } from "./course.mjs";
import { cleanLayout } from "./videolayout.mjs";
import { newGame, refuse, applyEvent } from "./netgame.mjs";
import { thinPath } from "./netpath.mjs";

const YARD = 0.9144;
const FOOT = 0.3048;
const DEG = Math.PI / 180;

// ---- What it plays with ---------------------------------------------------------------

// The launch monitor its shots come from (Open Connect's DeviceID), so the
// server and every page can tell them from real ones: they fly and are
// shown, and nothing keeps them.
export const REEL_DEVICE = "A² Golf video";
export const isReelShot = (entry) => entry?.deviceId === REEL_DEVICE;
// Which shots a page takes: while the video plays, only its own (a real one
// hit meanwhile is left alone); otherwise never its own.
export const takesShot = (entry, playing) => (playing ? isReelShot(entry) : !isReelShot(entry));

// What the page may send its server while the video plays: reading
// anything, its own shots, the club in hand (so they fly with it), its
// recording, and the page's graphics facts (a crash report's: app.js
// sendGraphics - nothing a player keeps). Anything else - a shot or a round for the stats, a
// course's trees or paths, a note, a setting on the server - is stopped
// before it's sent (showreel.js), so nothing it does is kept.
const REEL_WRITES = [/^\/api\/test-shot$/, /^\/api\/club$/, /^\/api\/graphics$/, /^\/api\/clips\/session$/, /^\/api\/clips\/session\/[a-z0-9]{6,32}(\/finish)?$/];
export function reelMayWrite(method = "GET", url = "") {
  const m = String(method || "GET").toUpperCase();
  if (m === "GET" || m === "HEAD") return true;
  let path;
  try {
    path = new URL(String(url), "http://localhost").pathname;
  } catch {
    return false;
  }
  return REEL_WRITES.some((re) => re.test(path));
}
// A planned shot as a launch monitor sends it (Open Connect), from the
// video's own device: the ball's numbers, no club's.
export function reelShotBody(ball) {
  return {
    DeviceID: REEL_DEVICE,
    Units: "Yards",
    APIversion: "1",
    BallData: { Speed: ball.speedMph, VLA: ball.vla, HLA: ball.hla, TotalSpin: ball.totalSpin, SpinAxis: ball.spinAxis },
    ShotDataOptions: { ContainsBallData: true, ContainsClubData: false, IsHeartBeat: false },
  };
}
// How the recording's laid out (sim/videolayout.mjs): the game's picture
// whole, the name in the corner, and each shot's numbers along the top as
// it flies - nothing else over the picture but its words (compositor.js).
export const REEL_LAYOUT = cleanLayout({
  id: "a2-golf-video",
  name: "The A² Golf video",
  layers: [
    { id: "game", kind: "game", x: 0, y: 0, w: 1, h: 1 },
    { id: "title", kind: "title", x: 0.02, y: 0.03, w: 0.22, h: 0.07, text: "" },
    { id: "tiles", kind: "tiles", when: "shot", x: 0.5, y: 0.03, w: 0.48, h: 0.11, tiles: ["carry", "total", "ballSpeed", "launch", "spin"] },
  ],
});

// Still air on a fair day, the same for every hole: what's planned is what
// flies (a gust would carry a shot off its plan).
export const REEL_WEATHER = { preset: "calm", wind: { mph: 0, from: 200, gust: 0 }, temperatureC: 20, sky: "fair", seed: 3 };
// Every strike in the middle of its lie's range (course.js fixedSeverity).
export const REEL_SEVERITY = 0.5;
// The course's settings while it plays (held: put back as they were):
// no gusts, no plugged lies, the course's own pins, no flyover or look down
// the hole first, no grid on the greens, friends' shots flown the moment
// they come, everyone from the yellow tees, nothing given.
export const REEL_COURSE = {
  gimme: 0,
  holeCard: false,
  cartRide: false,
  stimp: 10,
  ground: "normal",
  grain: true,
  grid: false,
  shade: false,
  autoFlyover: false,
  lookDown: false,
  plugs: "off",
  flightGusts: false,
  pins: "fixed",
  friendsShots: "landed",
  tees: "yellow",
  mulligans: false,
  format: "stroke",
  handicaps: false,
  wind: "calm",
  temp: "mild",
  sky: "fair",
};
// The player it plays as, and the four-ball's other three, each on a bay
// of their own (a pretend online game: reelGame).
export const REEL_PLAYER = "Alex";
export const REEL_HOST = { bay: "reel-alex", name: "Alex's bay", players: [{ name: REEL_PLAYER, index: 6.2 }] };
export const REEL_FRIENDS = [
  { bay: "reel-sam", name: "Sam's bay", players: [{ name: "Sam", index: 11.4 }] },
  { bay: "reel-jo", name: "Jo's bay", players: [{ name: "Jo", index: 8.6 }] },
  { bay: "reel-kit", name: "Kit's bay", players: [{ name: "Kit", index: 14.1 }] },
];

// ---- The scenes ----------------------------------------------------------------------

// In order. course: a course that comes with the game (its own copy, as it
// comes: never the player's, which they may have changed), hole: its
// number. play: the shots, each planned from where the last finished.
// Each kind of hole teed off on - parkland, links in the dunes by the sea,
// green links, the mountains, the hills - never named (the owner: "Just
// holes show variations of style without remark so the viewer absorbs
// it"); approaches and putts on two of them; then the ace, the four-ball,
// the designer and the end.
export const REEL_SCENES = [
  { id: "parkland", course: "nine-oaks", hole: 1, play: ["drive", "approach", "putt"] },
  { id: "dunes", course: "links-by-the-sea", hole: 6, play: ["drive"] },
  { id: "green-links", course: "sea-links", hole: 1, play: ["drive"] },
  { id: "mountain", course: "nine-oaks-mountain", hole: 1, play: ["drive"] },
  { id: "hills", course: "hillside-park", hole: 1, play: ["drive", "approach", "putt"] },
  { id: "ace", course: "sea-links", hole: 3, play: ["ace"] },
  { id: "friends", course: "golf-sim-links", hole: 16, four: true },
  { id: "designer", course: "golf-sim-links", hole: 5, designer: true },
  { id: "end" },
];
export const sceneOf = (id) => REEL_SCENES.find((s) => s.id === id) ?? null;
// The courses it plays on, each once.
export const REEL_COURSES = [...new Set(REEL_SCENES.map((s) => s.course).filter(Boolean))];

// The words on the picture: a line or two at a time, at the foot of the
// picture, never over the ball. Every way the game is played is said once:
// a launch monitor, a game controller, a mouse, a phone's touch screen
// (the owner: "Mentions working with mobile touch screen controller mouse
// and golf launchers"). Never "free", and no launch monitor by name (the
// owner: "Take out references to it being free ... Take out square Omni
// too").
export const REEL_CAPTIONS = {
  open: { title: "A² Golf", lines: ["Real golf, from your launch monitor"] },
  mountain: { lines: ["Or swing with a game controller or a mouse"] },
  hills: { lines: ["Every course drawn and played in full 3D"] },
  friends: { lines: ["Play with your friends online"] },
  second: { lines: ["Everyone plays their own ball, at the same time"] },
  putts: { lines: ["No waiting: everyone putts at once"] },
  designer: { lines: ["Design your own course", "change any hole in a few taps"] },
  end: { title: "A² Golf", lines: ["With your launch monitor, a controller or a mouse", "and on your phone, with its touch screen"] },
};
// How long a caption stays up, from its words (seconds).
export const captionSeconds = (c) => Math.min(6, 2 + 0.25 * [c?.title ?? "", ...(c?.lines ?? [])].join(" ").split(/\s+/).filter(Boolean).length);

// ---- Lining a shot up ---------------------------------------------------------------

// The club, aim and stance the course sets a player up with at a ball
// (course.js setup and updateStance): the suggested club for what's left
// (uphill longer), aimed down the hole or at the pin, the stance off the
// slope there. seed: the hole's (its spec's), for a designed hole's lies.
export function lineUp(hole, ball, lie, { seed = 1, club: given = null } = {}) {
  if (lie === "green") return { club: "PT", aim: defaultAim(hole, ball, "PT"), stance: FLAT };
  const distance = distanceToPin(hole, ball) + riseToPin(hole, ball);
  const stanceFor = (aim) => (lie === "tee" ? FLAT : hole.mapped ? stanceFromSlope(hole.gradientAt(ball[0], ball[1]), aim) : stanceAt(seed, ball[0], ball[1], lie));
  let club = given ?? suggestClub(distance, lie, { reach: 1 });
  let aim = defaultAim(hole, ball, club);
  let stance = stanceFor(aim);
  const face = given ? null : faceAhead(hole, ball, aim);
  if (face) {
    const c = suggestClub(distance, lie, { face, stance, reach: 1 });
    if (c !== club) {
      club = c;
      aim = defaultAim(hole, ball, club);
      stance = stanceFor(aim);
    }
  }
  return { club, aim, stance };
}

// A shot flown as the course flies it (course.js: the round's weather, a
// strike in the middle of its range, no gusts, no plugs).
export function flyShot(hole, ball, lie, up, shot) {
  return up.club === "PT"
    ? playPutt(hole, ball, shot, up.aim, { weather: REEL_WEATHER })
    : playShot(hole, ball, lie, shot, up.aim, { stance: up.stance, club: up.club, ground: REEL_COURSE.ground, severity: REEL_SEVERITY, weather: REEL_WEATHER, plugs: REEL_COURSE.plugs, gusts: false });
}

// 0, then a step either side, then two..., to `most`.
export function* outward(most, step) {
  yield 0;
  for (let k = 1; k * step <= most + 1e-9; k++) {
    yield +(k * step).toFixed(4);
    yield +(-k * step).toFixed(4);
  }
}

const feetFromCup = (hole, p) => Math.hypot(p[0] - hole.cup.x, p[1] - hole.cup.z) / FOOT;
// How far off the hole's line of play a spot is (+ right, - left), and how
// far along it (metres).
function offLine(hole, [x, z]) {
  const at = nearest(hole.path, x, z);
  const i = Math.min(hole.path.points.length - 1, Math.max(1, hole.path.points.findIndex((_, k) => k > 0 && hole.path.cum[k] >= at.s)));
  const [ax, az] = hole.path.points[i - 1];
  const [bx, bz] = hole.path.points[i];
  const side = Math.sign((bx - ax) * (z - az) - (bz - az) * (x - ax)) || 1;
  return { off: side * at.dist, along: at.s };
}

// The first of `shots` (nearest first) whose flight `score` takes (a number,
// lower better; false: not at all), or the best of them all if none is good
// enough (at most `enough`). null if none would do.
function search(shots, fly, score, enough) {
  let best = null;
  let tried = 0;
  for (const shot of shots) {
    tried++;
    const result = fly(shot);
    const s = score(result, shot);
    if (s === false) continue;
    if (!best || s < best.s) best = { s, shot, result };
    if (best.s <= enough) break;
  }
  return best && { shot: best.shot, result: best.result, tried };
}

// ---- The shots ------------------------------------------------------------------------

// What every shot of the video is held to (the owner: "Sense check all the
// shots for anything unusual"): no penalty, no tree touched, no skip off
// water, never in sand, a sensible height; and what each kind must do.
// The problems, or [] (a plan with none is a good one).
export const SHOT_RULES = {
  drive: "on the fairway, near the middle (or the side asked for)",
  layup: "on the fairway, short of where the drives go",
  approach: "on the green, a putt of a few yards left",
  putt: "holed",
  lip: "a lip-out: round the rim and out, left by the hole",
  ace: "a hole in one",
};
export function shotProblems(kind, result, { hole, lo = 0, hi = Infinity } = {}) {
  const out = [];
  if (!result) return ["no shot"];
  if (result.penalty) out.push(`a penalty (${result.penalty.kind})`);
  if (result.trees?.length) out.push("it touched a tree");
  if (result.skipped) out.push("it skipped off water");
  if (["bunker", "greenside"].includes(result.lie)) out.push("it finished in sand");
  if (result.lie === "waste") out.push("it finished in the waste area");
  const top = Math.max(0, ...(result.path ?? []).map((q) => q[1]));
  if (top > 55) out.push(`it flew ${Math.round(top)} m high`);
  if (kind === "drive" || kind === "layup") {
    if (result.lie !== "fairway") out.push(`it finished ${LIE_NAMES[result.lie] ?? result.lie}, not on the fairway`);
  } else if (kind === "approach") {
    const f = hole ? feetFromCup(hole, result.rest) : 0;
    if (result.lie !== "green") out.push(`it finished ${LIE_NAMES[result.lie] ?? result.lie}, not on the green`);
    else if (result.holed) out.push("it went in (a putt was to follow)");
    else if (f < lo || f > hi) out.push(`it finished ${Math.round(f)} ft away (${lo} - ${hi} ft wanted)`);
  } else if (kind === "putt" || kind === "ace") {
    if (!result.holed) out.push("it didn't drop");
  } else if (kind === "lip") {
    const f = hole ? feetFromCup(hole, result.rest) : 0;
    if (result.holed) out.push("it dropped");
    else if (!result.lipped) out.push("it missed the hole");
    else if (f > 2.5) out.push(`it finished ${f.toFixed(1)} ft away`);
  }
  return out;
}

// Each strike a little its own, as a real swing is: the ball speed a touch
// either way, the launch up to a degree, the spin some hundreds of rpm -
// seeded from the hole, the spot, the club and the line wanted, so the
// video is the same each time it's made but no two shots read alike (the
// browser check: every drive showed 142.0 mph, 12.0°, 2,700 rpm - made up,
// to anyone who looks). base: typicalShot's; side: the line asked for;
// take: another swing of the same (the four-ball's, planFourSteps).
export const STRIKE_SPREAD = { speed: 0.015, launch: 0.8, spin: 0.07 };
export function ownStrike(base, seed, ball, club, side = 0, take = 0) {
  let h = (seed >>> 0) ^ 0x9e3779b9;
  for (const v of [Math.round(ball[0] * 100), Math.round(ball[1] * 100), side + 3, take, ...String(club).split("").map((c) => c.charCodeAt(0))]) h = Math.imul(h ^ v, 0x85ebca6b) ^ (h >>> 13);
  const r = seeded(h);
  const swing = (most) => (r() * 2 - 1) * most;
  return {
    ...base,
    speedMph: +(base.speedMph * (1 + swing(STRIKE_SPREAD.speed))).toFixed(1),
    vla: +(base.vla + swing(STRIKE_SPREAD.launch)).toFixed(1),
    totalSpin: Math.round((base.totalSpin * (1 + swing(STRIKE_SPREAD.spin))) / 10) * 10,
  };
}

// A drive: the club's own strike, a touch longer or shorter and a degree or
// two either way, on the fairway with nothing touched - near the middle,
// or (side) to one side of it: -1 left, 1 right, the share of the
// fairway's half-width to be out (sim/course.mjs fairwayHalfWidth isn't
// needed: SIDE_OFF metres). short: as much shorter (metres) as asked.
// Past where the plain strike stops (a fairway bunker can stop it) rather
// than short of it: a drive carried over the sand, not one held back from
// it - which would leave a long iron that won't stop by the hole.
const SIDE_OFF = 9;
const SHORT_COST = 0.2;
const LONG_COST = 0.05;
export function planDrive(hole, ball, lie, up, { side = 0, short = 0, seed = 1, take = 0 } = {}) {
  const base = ownStrike(typicalShot(up.club, lie, up.stance), seed, ball, up.club, side, take);
  const plain = flyShot(hole, ball, lie, up, { ...base, hla: 0, spinAxis: 0 });
  const length = plain.totalYards * YARD - short;
  function* shots() {
    for (const k of [0, -0.02, 0.02, -0.04, 0.04, -0.06, 0.06, -0.08, -0.1, -0.12]) for (const h of outward(4, 0.5)) for (const axis of side ? [0, side * 6, side * 12] : [0]) yield { ...base, speedMph: base.speedMph * (1 + k), hla: h, spinAxis: axis };
  }
  return search(
    shots(),
    (s) => flyShot(hole, ball, lie, up, s),
    (r, s) => {
      if (shotProblems("drive", r).length) return false;
      const { off } = offLine(hole, r.rest);
      const far = Math.hypot(r.rest[0] - ball[0], r.rest[1] - ball[1]) - length;
      const along = short ? Math.abs(far) * 0.1 : far < 0 ? -far * SHORT_COST : far * LONG_COST;
      return Math.abs(off - side * SIDE_OFF) + along + Math.abs(s.hla) * 0.2;
    },
    1.5,
  );
}

// An approach: on the green with a putt of lo - hi feet left - and, given
// `apart` (balls on the green already), round the cup from them: at least
// APART degrees from each, seen from the cup, so four putts come in from
// different sides (apartDeg: how far apart). fan: { toward: [x, z] (a
// direction from the cup), half (degrees) } - finishing within that fan
// of the cup (fourLane: the four-ball's, so one camera close behind the
// cup has all four putts coming at it, greenView) - the nearer its middle
// the better (LANE_PULL a degree off it), so the next player's lane is
// left clear.
export const APART = 40;
export const LANE_PULL = 0.08;
export function planApproach(hole, ball, lie, up, { lo = 8, hi = 16, apart = null, apartDeg = APART, fan = null, seed = 1, take = 0 } = {}) {
  const yards = distanceToPin(hole, ball) / YARD;
  const base = ownStrike(typicalShot(up.club, lie, up.stance, yards), seed, ball, up.club, 0, take);
  const cup = [hole.cup.x, hole.cup.z];
  const bearing = ([x, z]) => Math.atan2(z - cup[1], x - cup[0]);
  const gap = (a, b) => Math.abs(((a - b + 3 * Math.PI) % (2 * Math.PI)) - Math.PI) / DEG;
  function* shots() {
    for (const k of outward(0.16, 0.01)) for (const h of outward(4, 0.25)) yield { ...base, speedMph: base.speedMph * (1 + k), hla: h };
  }
  return search(
    shots(),
    (s) => flyShot(hole, ball, lie, up, s),
    (r, s) => {
      if (shotProblems("approach", r, { hole, lo, hi }).length) return false;
      const lane = fan ? gap(bearing(r.rest), Math.atan2(fan.toward[1], fan.toward[0])) : 0;
      if (lane > (fan?.half ?? 0)) return false;
      const k = Math.abs(s.speedMph / base.speedMph - 1);
      let spread = 0;
      if (apart?.length) {
        const least = Math.min(...apart.map((q) => gap(bearing(r.rest), bearing(q))));
        if (least < apartDeg) return false;
        spread = Math.max(0, 90 - least) * 0.02;
      }
      return Math.abs(feetFromCup(hole, r.rest) - (lo + hi) / 2) * 0.15 + spread + lane * LANE_PULL + k * 10 + Math.abs(s.hla) * 0.3;
    },
    2.5,
  );
}

// A putt that drops (or, lip: one round the rim and out): the green's own
// read (the ideal line, as the T line shows it), a touch firmer or softer
// and a little either way, from the aim the player's set up with.
export function planPutt(hole, ball, up, { lip = false } = {}) {
  const read = readPutt(hole, ball);
  const h0 = (read.aim - up.aim) / DEG;
  function* shots() {
    for (const k of outward(lip ? 0.3 : 0.14, 0.01)) for (const h of outward(lip ? 3 : 2, 0.05)) yield { speedMph: read.speedMph * (1 + k), vla: 1, hla: +(h0 + h).toFixed(3), totalSpin: 0, spinAxis: 0 };
  }
  const kind = lip ? "lip" : "putt";
  return search(
    shots(),
    (s) => flyShot(hole, ball, "green", up, s),
    (r, s) => (shotProblems(kind, r, { hole }).length ? false : Math.abs(s.speedMph / read.speedMph - 1) * 5 + Math.abs(s.hla - h0) * 0.2),
    0.4,
  );
}

// A hole in one from the tee: the nearest finishes of the club's strike,
// a little firmer or softer and either way, then finer round the nearest.
export function planAce(hole, ball, up, seed = 1) {
  const base = ownStrike(typicalShot(up.club, "tee", FLAT, distanceToPin(hole, ball) / YARD), seed, ball, up.club);
  const fly = (s) => flyShot(hole, ball, "tee", up, s);
  const near = [];
  let tried = 0;
  for (const k of outward(0.12, 0.01)) {
    for (const h of outward(3, 0.2)) {
      const shot = { ...base, speedMph: base.speedMph * (1 + k), hla: h, spinAxis: 0 };
      const result = fly(shot);
      tried++;
      if (result.holed && !shotProblems("ace", result).length) return { shot, result, tried };
      if (!result.penalty) near.push({ shot, f: feetFromCup(hole, result.rest) });
    }
  }
  near.sort((a, b) => a.f - b.f);
  for (const c of near.slice(0, 8)) {
    for (const k of outward(0.012, 0.001)) {
      for (const h of outward(0.24, 0.02)) {
        const shot = { ...c.shot, speedMph: c.shot.speedMph * (1 + k), hla: +(c.shot.hla + h).toFixed(3) };
        const result = fly(shot);
        tried++;
        if (result.holed && !shotProblems("ace", result).length) return { shot, result, tried };
      }
    }
  }
  return null;
}

// A planned shot of a kind from where a player is: { club, aim, stance,
// shot (the ball's numbers to send), result, kind } or null. opts as each
// planner takes them; seed: the hole's (lineUp);
// up: the club, aim and stance the player is set up with (the course
// mode's own, as the page plays it), else as lineUp has them; take: which
// swing of theirs (ownStrike), kept in the plan.
export function planShot(kind, hole, ball, lie, { seed = 1, club = null, up: given = null, take = 0, ...opts } = {}) {
  const up = given ?? lineUp(hole, ball, lie, { seed, club });
  const got =
    kind === "drive" || kind === "layup"
      ? planDrive(hole, ball, lie, up, { ...opts, seed, take })
      : kind === "approach"
        ? planApproach(hole, ball, lie, up, { ...opts, seed, take })
        : kind === "putt" || kind === "lip"
          ? planPutt(hole, ball, up, { lip: kind === "lip" })
          : kind === "ace"
            ? planAce(hole, ball, up, seed)
            : null;
  return got && { ...up, kind, take, shot: got.shot, result: got.result, tried: got.tried };
}

// A whole scene's shots planned in turn from the tee (each from where the
// last finished): [{ kind, club, shot, result, problems }]. Stops at the
// first that can't be planned (its problems say so). tee: where the ball's
// teed up (the round's tees: course.js teeAt).
export function planScene(scene, hole, seed = 1, tee = [0, 0]) {
  const out = [];
  let ball = [...tee];
  let lie = "tee";
  for (const kind of scene.play ?? []) {
    const p = planShot(kind, hole, ball, lie, { seed });
    if (!p) {
      out.push({ kind, problems: [`no ${kind} could be found (${SHOT_RULES[kind]})`] });
      break;
    }
    out.push({ ...p, problems: shotProblems(kind, p.result, { hole }) });
    if (p.result.holed) break;
    ball = p.result.rest;
    lie = p.result.lie;
  }
  return out;
}

// ---- The four-ball -------------------------------------------------------------------

// How the four play the hole: off the tee each a different line - Sam down
// the left, Jo down the right, Kit a 3 wood short of them, Alex down the
// middle - four drives fanning out towards the camera down the fairway;
// then the three friends' approaches onto the green, each finishing round
// the cup from the others, before Alex's (from Alex's view, theirs already
// there); then
// all four putts at once - three drop, Jo's lips out.
export const FOUR_PLAN = {
  drives: { Sam: { kind: "drive", side: -1 }, Jo: { kind: "drive", side: 1 }, Kit: { kind: "layup", club: "3W" }, Alex: { kind: "drive", side: 0 } },
  // How far each approach leaves them (feet): each round the cup from the
  // others' (planApproach apart).
  approaches: { Sam: [9, 22], Jo: [8, 20], Kit: [6, 16], Alex: [8, 16] },
  putts: { Sam: "putt", Jo: "lip", Kit: "putt", Alex: "putt" },
  // The friends strike this far apart (seconds), never quite evenly.
  stagger: [0, 0.85, 1.75, 2.6],
};
// The order they swing off the tee (and when): the friends first.
export const FOUR_ORDER = ["Sam", "Jo", "Kit", "Alex"];

// The four-ball's shots planned: { [name]: [drive, approach, putt] } each
// as planShot gives them (from that player's own ball, where the online
// game keeps it: to the centimetre, sim/netgame.mjs), or with problems.
// tee: where they tee off (the round's tees).
const kept = (p) => p.map((v) => Math.round(v * 100) / 100);
export function planFour(hole, seed = 1, tee = [0, 0]) {
  const steps = planFourSteps(hole, seed, tee);
  for (;;) {
    const s = steps.next();
    if (s.done) return s.value;
  }
}
// The same, a shot at a time: each yield one shot planned, so the page can
// draw (and answer) between them (showreel.js) - the twelve together take
// some seconds. Each player's strikes vary (ownStrike): if from where a
// drive goes no approach finishes in their lane, or no putt drops from
// there, their next take (up to FOUR_TAKES) - the page plays the take
// kept in the plan.
export const FOUR_TAKES = 4;
export function* planFourSteps(hole, seed = 1, tee = [0, 0]) {
  const out = {};
  for (const name of FOUR_ORDER) {
    const d = FOUR_PLAN.drives[name];
    const [lo, hi] = FOUR_PLAN.approaches[name];
    const apart = Object.values(out).map((q) => q[1]?.result?.rest).filter(Boolean);
    let shots = null;
    for (let take = 0; take < FOUR_TAKES; take++) {
      const drive = planShot(d.kind, hole, tee, "tee", { seed, take, club: d.club ?? null, side: d.side ?? 0, short: d.kind === "layup" ? 25 : 0 });
      yield name;
      shots = [drive ? { ...drive, problems: shotProblems(d.kind, drive.result, { hole }) } : { kind: d.kind, problems: ["no drive found"] }];
      if (!drive) continue;
      const approach = planShot("approach", hole, kept(drive.result.rest), drive.result.lie, { seed, take, lo, hi, apart, apartDeg: FOUR_APART, fan: fourLane(hole, tee, name) });
      yield name;
      if (!approach) {
        shots.push({ kind: "approach", problems: [`no approach to ${lo} - ${hi} ft in their lane past the cup, clear of the others`] });
        continue;
      }
      shots.push({ ...approach, problems: shotProblems("approach", approach.result, { hole, lo, hi }) });
      const kind = FOUR_PLAN.putts[name];
      const putt = planShot(kind, hole, kept(approach.result.rest), approach.result.lie, { seed });
      yield name;
      shots.push(putt ? { ...putt, problems: shotProblems(kind, putt.result, { hole }) } : { kind, problems: [`no ${kind} found`] });
      if (putt) break;
    }
    out[name] = shots;
  }
  return out;
}

// Where the four approaches finish: beyond the cup, where an approach
// that holds the green does (short of it is the front bunkers' - a short
// one finishes in the sand), each player in a lane of their own (degrees
// either side of the line of play carried on past the cup, LANE_HALF wide
// each way) and FOUR_APART apart at least, seen from the cup - so the four
// putts all roll the same way, side by side, back at the camera in front
// of the cup (greenView). (Picked one after another all round the cup,
// the first took one side and left the last nowhere a camera could see
// them all from close.)
export const FOUR_LANES = { Sam: -30, Jo: 50, Kit: 10, Alex: -65 };
export const LANE_HALF = 20;
export const FOUR_APART = 22;
export function fourLane(hole, tee, name) {
  const [bx, bz] = unit([hole.cup.x - tee[0], hole.cup.z - tee[1]]);
  const a = (FOUR_LANES[name] ?? 0) * DEG;
  return { toward: [bx * Math.cos(a) - bz * Math.sin(a), bx * Math.sin(a) + bz * Math.cos(a)], half: LANE_HALF };
}

// The pretend online game the four play (no relay: the page is its host).
// course: { id, name, holes }; started on the course for the four.
export function reelGame(course) {
  let g = newGame({ hostBay: REEL_HOST.bay, hostName: REEL_HOST.name, players: REEL_HOST.players });
  const events = [
    ...REEL_FRIENDS.map((b) => [{ type: "bay", bay: b.bay, name: b.name, players: b.players }, b.bay]),
    [{ type: "start", course: { id: course.id, name: course.name, holes: course.holes.length }, format: "stroke", handicaps: false, weather: REEL_WEATHER, id: "a2-golf-video", tees: "yellow" }, REEL_HOST.bay],
  ];
  for (const [ev, from] of events) g = hostTakes(g, ev, from).game;
  return g;
}
// The host's word on a change from a bay: applied, or why not.
export function hostTakes(game, ev, fromBay) {
  const why = refuse(game, ev, fromBay);
  return why ? { game, why } : { game: applyEvent(game, ev), why: null };
}
// A friend's player id in the game, and which bay it's on.
export const friendId = (game, name) => game.players.find((p) => p.name === name)?.id ?? null;
export const bayOf = (game, name) => game.players.find((p) => p.name === name)?.bay ?? null;
// Where a player's ball is on hole h by the game (its progress).
export function ballOf(game, pid, h) {
  const at = game?.progress?.[pid]?.[h];
  return at ? { strokes: at.strokes, ball: [...at.ball], lie: at.done ? "cup" : at.lie, done: !!at.done } : { strokes: 0, ball: [0, 0], lie: "tee", done: false };
}

// A friend's planned shot as the event their bay sends: where it finished
// (or that it dropped), with its flight for this bay to fly.
export function friendEvent({ hole, par, pid, h, at, plan }) {
  const res = plan.result;
  const flight = thinPath(res.path, Math.max(1, res.flightPoints || 1));
  const putt = plan.club === "PT";
  const strokes = at.strokes + 1;
  if (res.holed) return { type: "holed", player: pid, hole: h, score: strokes, text: scoreName(strokes, par), flight, putt };
  const left = distanceToPin(hole, res.rest);
  const text = res.lie === "green" ? `On the green - ${Math.round(left / FOOT)} ft` : `${LIE_NAMES[res.lie] ?? res.lie} - ${Math.round(left / YARD)} yds to go`;
  return { type: "shot", player: pid, hole: h, strokes, ball: res.rest, lie: res.lie, text, flight, putt };
}

// ---- The cameras -------------------------------------------------------------------

// Where the camera's held for the four-ball's two shots the game never
// shows this way (course.js holdView), in the hole's frame: { at: [x, z,
// up], look: [x, z, up] } (up: metres above the ground there).
const unit = ([x, z]) => {
  const l = Math.hypot(x, z) || 1;
  return [x / l, z / l];
};
const mean = (ps) => [ps.reduce((a, p) => a + p[0], 0) / ps.length, ps.reduce((a, p) => a + p[1], 0) / ps.length];
// The drives coming: down the fairway just past where they finish, a
// little to the side and low, looking back up the hole - each ball rising
// far off and coming down at the camera, the longest rolling up to a few
// paces from it (the owner: "show the drives coming towards the camera
// (would never see it this way in game)"). Close, so they come down big:
// from further back they stayed specks on the skyline. rests: where the
// drives finish. past/side/up: the camera's spot (metres beyond the
// longest, to the side the fewest finish, above the ground); back/lookUp:
// where it looks (metres back up the hole from the longest, above the
// ground).
export const TOWARDS = { past: 18, side: 8, up: 2.5, back: 70, lookUp: 6 };
export function towardsView(tee, rests) {
  const mid = mean(rests);
  const d = unit([mid[0] - tee[0], mid[1] - tee[1]]);
  const far = Math.max(...rests.map((p) => (p[0] - tee[0]) * d[0] + (p[1] - tee[1]) * d[1]));
  const right = [-d[1], d[0]];
  // The side the fewest balls finish on, so none rolls up to the lens.
  const lean = rests.reduce((a, p) => a + Math.sign((p[0] - mid[0]) * right[0] + (p[1] - mid[1]) * right[1]), 0) > 0 ? -1 : 1;
  const base = [tee[0] + d[0] * (far + TOWARDS.past), tee[1] + d[1] * (far + TOWARDS.past)];
  const at = [base[0] + right[0] * TOWARDS.side * lean, base[1] + right[1] * TOWARDS.side * lean, TOWARDS.up];
  const look = [tee[0] + d[0] * (far - TOWARDS.back), tee[1] + d[1] * (far - TOWARDS.back), TOWARDS.lookUp];
  return { at, look };
}
// The green, low, from just short of the cup on the far side from the four
// balls (fourLane: they finish beyond it, side by side), so all four roll
// at the cup and the camera at once (the owner: "show the green with all 4
// putts going at similar times") - close enough that they come up big as
// they near the hole, not so close the widest falls out of the picture.
// cup: [x, z]; balls: where the four lie.
export function greenView(cup, balls) {
  const ways = balls.map((b) => unit([b[0] - cup[0], b[1] - cup[1]]));
  let away = mean(ways);
  // (All round it: from the side the furthest ball isn't.)
  if (Math.hypot(...away) < 0.2) away = ways[balls.reduce((k, b, i) => (Math.hypot(b[0] - cup[0], b[1] - cup[1]) > Math.hypot(balls[k][0] - cup[0], balls[k][1] - cup[1]) ? i : k), 0)];
  const back = unit([-away[0], -away[1]]);
  const reach = Math.max(...balls.map((b) => Math.hypot(b[0] - cup[0], b[1] - cup[1])));
  const out = 2.5 + reach * 0.3;
  const at = [cup[0] + back[0] * out, cup[1] + back[1] * out, 1.2 + reach * 0.1];
  const look = [cup[0] - back[0] * reach * 0.3, cup[1] - back[1] * reach * 0.3, 0];
  return { at, look };
}

// ---- The designer --------------------------------------------------------------------

// What the designer shows on its hole (the owner: "Show a quick demo of
// the course designer showing how easy to amend holes even with the
// multiple options"): the real hole editor, each step a tool picked and
// used as a finger would - a tap, a rub, a button - at spots given as
// shares along the hole (0 the tee, 1 the green) and across it (metres,
// + right), so they fit whatever the hole is - each tap on empty ground,
// so it adds one (on an existing bunker it would only pick it): the new
// bunker short of the green on its line, where the map, zoomed to the
// bunkers, shows it. said: the caption while it's done. Then "Play this
// hole" plays it as changed: its tee shot (designTeeShot).
export const DESIGN_STEPS = [
  { tool: "bunkers", tap: [0.85, 0], said: "Add a bunker" },
  { tool: "water", tap: [0.58, 30], said: "Dig a pond" },
  { tool: "trees", mode: "plant", rub: [[0.22, -34], [0.42, -36], [0.55, -33]], said: "Plant trees" },
  { tool: "green", mode: "styles", styles: 2, said: "Pick a green from the styles" },
];
// A design step's spot on the hole's map: [x, z] in its frame. layout: the
// hole's (its path from the tee to the green).
export function designSpot(layout, [share, across]) {
  const path = makePath(layout.path);
  const { p, dir } = pointAt(path, Math.max(0, Math.min(1, share)) * path.length);
  return [p[0] - dir[1] * across, p[1] + dir[0] * across];
}
// A design step's tap as the hole editor commits it on empty ground (its
// tool's shape added there: holeeditor.js SHAPE_TOOLS), or null for a step
// without one.
const SHAPE_KINDS = { bunkers: "b", water: "w" };
export function designEdit(layout, step) {
  const k = step.tap && SHAPE_KINDS[step.tool];
  return k ? { k: `${k}+`, at: designSpot(layout, step.tap).map((v) => Math.round(v * 100) / 100) } : null;
}
// The changed hole's tee shot: onto the green on a par 3, else a drive.
export const designTeeShot = (par) => (par === 3 ? "approach" : "drive");
