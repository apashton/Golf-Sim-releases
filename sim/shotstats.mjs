// A player's shots, made sense of: what kind of swing each one was, what
// "normal" looks like for each club, whether a shot looks like the club that
// was selected, and the numbers the stats page shows. Pure, so the server
// (which keeps the shots) and the tests share one copy of the rules.
//
// A stored shot (see server/stats.mjs for the file it lives in):
//   { id, t, p, m, g, c, sw, b: { s, v, h, sp, ax }, r: { carry, total, off,
//     apex, desc }, tg: { d, f, long, side, made }, lie, un, ok, ans, air: { temp,
//     alt }, fm }
//   t   time (ms)            p   player's name       m  mode (range, course...)
//   g   the game or session: { k: kind, id, ...whatever the mode adds }
//   c   club                 sw  swing: full, partial, chip, pitch or putt
//   b   ball as measured: speed mph, launch, direction (HLA), spin, spin axis
//   r   the result in yards: carry, total, offline (right +), apex, descent°
//   tg  against a target, in yards: its distance, how far from it the ball
//       finished, along the line (long +), and whether it went in; on a
//       course, also across the line (side, right +; since 4 October 2026)
//   un  1 when hit off uneven ground (a slope, a hilly course), which
//       changes the carry, so it stays out of the club's numbers
//   ok  false while a club check is waiting for an answer
//   ans "yes" when the player said the selected club was right, "changed"
//       when they said it was another, "quiet" when several unanswered
//       checks at one distance were taken as that club's normal
//   air the temperature (°C) and altitude (m) it flew in, when the range's
//       settings weren't the 20°C at sea level everything else flies in;
//       and the wind (wind mph, wfrom degrees), with on the course how
//       much of it was into the shot (hw mph, helping negative; from 8
//       October 2026)
//   fm  the version of the ball flight that measured it (none: the first)
//   hd  seconds between the shot being hit and recorded (the ball's
//       flight), so a session recording can be found at the moment it
//       was hit (from 6 October 2026)
//   es  1 when the Omni estimated the spin rather than measured it (from
//       5 October 2026): the spin notes leave it out
//   k   the Omni's club data, when it came: club speed mph (s), where on
//       the face it was struck, mm up (iv) and towards the toe (ih); and
//       since 5 October 2026 the club path (p) and face to the target (f),
//       right + (in-to-out, open), the attack angle (a, up +) and the
//       dynamic loft (l), in degrees; and the lie angle at impact (li)
//       from a launch monitor that sends one
//   st  how a full swing was struck, worked out as it was recorded: "good",
//       "thin", "fat", "topped" or "shank" (none: from before strikes were
//       judged, and worked out when the file is read)
//   odd why the reading looked like no real strike (a misread): "smash",
//       "spin", "launch" or "speed"; left out of everything until the
//       player says whether to keep it
//   my  what the player said about it since (from the file's later lines):
//       "misread" (taken out of everything, kept in the file so it can be
//       put back), "keep" (an odd reading that was real), or the strike
//       ("good", "thin", "fat", "topped", "shank") in place of the one
//       worked out, or a special shot ("punch", "part", "other": see
//       applySay) - the swing it was recorded with is then read as that
//   sp  a special shot's kind: "punch" (punch / low) or "other" (something
//       else); with sw "special". A part swing said as one is sw "partial"
//   ask 1 when the shot went so far from the club's usual that the player
//       was asked what it was (unusualShot); out of every club number and
//       the strike percentages until they answer (my, or a club check's ans)
//   rec the recording format it was hit in (sim/recording.mjs): "r" round
//       play, "x" experimental (kept, but out of every number, tip and club
//       check unless asked for); none is practice - every shot from before
//       there was a switch (a course round's: round play). With recording
//       off, no line is written. sim/statdays.mjs decides what's in view
//   to  on a course: where it came to rest - a lie, "water", or "cup" when
//       holed; pen, the penalty it cost ("water" or "lost"). For the round
//       stats (sim/roundstats.mjs); none on shots from before they were kept

import { BAG, CLUB_ORDER } from "./clubs.mjs";
import { cleanPower, powerSwing } from "./power.mjs";

export { CLUB_ORDER };
export const SWINGS = ["full", "partial", "pitch", "chip", "putt", "special"];
export const SWING_NAMES = { full: "Full swing", partial: "Part swing", pitch: "Pitch", chip: "Chip", putt: "Putt", special: "Special shot" };
// A deliberate shot that isn't the club's normal swing: a punch or
// knockdown kept low, a part swing, or anything else on purpose (a low
// runner, an odd club for a tricky shot). What the player can say, and
// what each is called. A part swing is kept as sw "partial" (it has its own
// distances); the others as sw "special", with the kind in sp. All of them
// stay out of the club's numbers, its strike percentages, gapping and tips;
// they still count for scores, putting and the rest.
export const SPECIALS = ["punch", "part", "other"];
export const SPECIAL_NAMES = { punch: "Punch / low", part: "Part swing", other: "Something else" };
// The swing a special shot is kept as.
export const specialSwing = (kind) => (kind === "part" ? "partial" : "special");
// Long clubs are always a full swing: nobody hits a half driver on purpose,
// so a short one is a miss. A topped or thinned one is judged a bad strike
// (strikeQuality) and kept out of the driver's carry, but in its strike
// percentages.
const NEVER_PARTIAL = new Set(["DR", "3W", "5W", "4H"]);
const WEDGES = new Set(["PW", "AW", "GW", "SW", "LW"]);

// How many full shots of a club before its own numbers replace the bag's.
export const BASELINE_MIN = 8;
// How far out, in spreads, before a shot is questioned.
export const CHECK_SPREADS = 2.5;
// Before a club has its own numbers, how unlike the bag's version of it a
// shot must be - carry, launch, spin and ball speed together, not carry
// alone, since a new player's distances can be anything.
export const PRIOR_SPREADS = 1.5;
// Unanswered club checks at about the same distance, after which that
// distance is taken as the player's normal and they stop being asked -
// unless it's another club they hit (quietFits).
export const QUIET_AFTER = 3;
// A wrong club so clear it's put right by itself (the owner, 10 November
// 2026: "I find too often I forget to change the club selection, so I
// have tons of shots, many very obvious in the wrong club's stats"): the
// shot fits the club it flew like within `fit` spreads and is `far`
// spreads or more from the one selected, by carry, launch, spin and ball
// speed together (it needs the ball's numbers, not only its carry), and
// the player has their own numbers for the club it flew like - never
// moved to a club they've not hit (they may not carry a 4 iron at all).
// A message says so, and Z (or Shot history) puts it back. Anything less
// clear is held out of the numbers until it's answered.
export const OBVIOUS = Object.freeze({ fit: 1.5, far: 4 });

// ---- Small statistics -------------------------------------------------------

export function median(list) {
  if (!list.length) return NaN;
  const s = [...list].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// A spread that one wild shot can't blow up: the median distance from the
// median, scaled to match a standard deviation on well-behaved numbers.
export function robustSpread(list) {
  if (list.length < 2) return NaN;
  const m = median(list);
  return 1.4826 * median(list.map((v) => Math.abs(v - m)));
}

export function quantile(list, q) {
  if (!list.length) return NaN;
  const s = [...list].sort((a, b) => a - b);
  const i = (s.length - 1) * q;
  const lo = Math.floor(i);
  return s[lo] + (s[Math.min(lo + 1, s.length - 1)] - s[lo]) * (i - lo);
}

export const mean = (list) => (list.length ? list.reduce((a, v) => a + v, 0) / list.length : NaN);

// ---- What kind of swing -----------------------------------------------------

// Putts are putts; the chipping green and anything near a course's green is
// a chip (low, under 20 yards in the air) or a pitch; a club hit much
// shorter than it usually goes, towards a target that was short of it too,
// is a part swing. `fullCarry` is how far this player's full swing with the
// club usually carries, and `own` whether that's from their own shots (or
// scaled from their other clubs) rather than the bag's guess.
//   shot: { mode, club, carry, lie, toPin (yards to the flag before it),
//           intended (yards the player was trying to hit it) }
export function swingType(shot, fullCarry = BAG[shot.club]?.carry ?? 150, { own = true } = {}) {
  const { mode, club, carry, lie, toPin, intended } = shot;
  if (club === "PT" || mode === "putting" || lie === "green") return "putt";
  const short = () => (carry < 20 ? "chip" : "pitch");
  if (mode === "chipping") return short();
  const nearPin = Number.isFinite(toPin) && lie !== "tee";
  if (nearPin && toPin <= 50) return short();
  // A wedge from inside 80 yards, well short of its full carry, is a pitch:
  // the in-between shot every golfer has to learn.
  if (nearPin && WEDGES.has(club) && toPin <= 80 && carry < fullCarry * 0.85) return short();
  if (NEVER_PARTIAL.has(club)) return "full";
  if (carry < 40) return short();
  // Towards a shorter target, and landing somewhere near it: a part swing.
  // A shot well past that target was a full swing that came up short of
  // usual - a mishit, not a choice (an old target left on from wedge work).
  if (Number.isFinite(intended) && intended < fullCarry * 0.85 && carry < fullCarry * 0.9 && carry <= intended * 1.2 + 5) return "partial";
  // With no target, only call it a part swing on distance alone once we
  // know how far this player hits: a junior's full 7 iron can be half the
  // bag's. Wedges are the exception - half wedges are what people practise.
  if (Number.isFinite(intended) || !(own || WEDGES.has(club))) return "full";
  if (carry < fullCarry * 0.6) return "partial";
  return "full";
}

// ---- What normal looks like for each club -----------------------------------

// A shot the player said the launch monitor misread: it counts nowhere.
export const removed = (s) => s.my === "misread";
// A reading that looked like no real strike, not yet kept or removed.
export const waiting = (s) => !!s.odd && !s.my;
// Everything but the misreads and the readings still in doubt: what every
// number, percentage and tip is made from.
export const live = (shots) => shots.filter((s) => !removed(s) && !waiting(s));

// How a shot was struck: what the player said, else what was worked out.
// "badhit": the player saying it just wasn't the swing they meant - under-
// powered, mishit, whatever it was - without naming a fault (the owner:
// "just call it a bad hit, and then we can recognise bad hits"). Never
// worked out; only said. Like the rest, out of the club's numbers.
export const STRIKES = ["thin", "fat", "topped", "shank", "badhit"];
export const STRIKE_NAMES = { good: "Good strike", thin: "Thin", fat: "Fat", topped: "Topped", shank: "Shank", badhit: "Bad hit" };
export const strikeOf = (s) => (s.my === "good" || STRIKES.includes(s.my) ? s.my : (s.st ?? "good"));

// The swing a shot is read as once the player has had their say (my),
// from the one it was recorded with: a punch or something else is a
// special shot, a part swing a part swing, and a strike (good, thin...)
// says it was a normal full swing after all. Chips, pitches and putts stay
// what they were; so does everything else.
export function saidSwing(recorded, my) {
  if (my === "punch" || my === "other") return "special";
  if (my === "part") return "partial";
  if ((my === "good" || STRIKES.includes(my)) && (recorded === "full" || recorded === "partial" || recorded === "special")) return "full";
  return recorded;
}

// What the player says about a stored shot (server/stats.mjs's marks, as
// the file is read): its my, and its swing (and special kind) read again
// from the ones it was recorded with, which are kept (rsw, rsp) so a later
// say - or "auto", taking it back - starts from them. Changes the shot.
export function applySay(s, q) {
  if (!("rsw" in s)) {
    s.rsw = s.sw;
    s.rsp = s.sp;
  }
  if (q === "auto") delete s.my;
  else s.my = q;
  s.sw = saidSwing(s.rsw, s.my);
  const sp = s.sw !== "special" ? undefined : s.my === "punch" || s.my === "other" ? s.my : (s.rsp ?? "other");
  if (sp) s.sp = sp;
  else delete s.sp;
  return s;
}

// Full swings whose strike is judged and counted in a club's strike
// percentages: from a good lie (the rough or sand takes distance off) on
// flat ground (a slope changes the carry too), whose club nobody has
// doubted or the player has since confirmed, and not a misread or a
// reading still in doubt. Shots hit with the old calibration panel open
// (kept as mode "calibration") were deliberate mishits.
export const goodLie = (lie) => !lie || lie === "tee" || lie === "fairway" || lie === "path";
// A shot the player was asked about (it went well short of the club's
// usual) and hasn't answered: out of the club's numbers and its strike
// percentages until they do - it may well have been a punch or a part
// swing, and it can't be counted as a thin or fat one on a guess.
export const asking = (s) => !!s.ask && !s.my && !s.ans;
export const rated = (s) => s.sw === "full" && s.ok !== false && goodLie(s.lie) && !s.un && s.m !== "calibration" && !removed(s) && !waiting(s) && !asking(s);
// Shots that count towards a club's full-swing numbers - what it carries:
// those, struck well. A thin or fat one is not what anyone would expect
// the club to carry.
export const counts = (s) => rated(s) && strikeOf(s) === "good";
// A yes, or a run of unanswered checks at one distance: this far is normal.
const settled = (s) => s.ans === "yes" || s.ans === "quiet";

function spreadOf(list, floor) {
  const s = robustSpread(list);
  return Math.max(floor, Number.isFinite(s) ? s : 0);
}

// Everything the club check and swing typing need to know about a player,
// from their shots. Clubs they've hit enough get their own centre and
// spread; the rest get the bag's, scaled by how far this player hits the
// clubs they do have numbers for, and a generous spread.
export function profiles(shots) {
  const own = new Map();
  const all = new Map();
  const push = (map, s) => (map.has(s.c) ? map.get(s.c).push(s) : map.set(s.c, [s]));
  for (const s of shots) {
    if (!rated(s) || !BAG[s.c]) continue;
    push(all, s);
    if (counts(s)) push(own, s);
  }
  const ratios = [];
  for (const [club, list] of own) {
    if (list.length >= 5) ratios.push(median(list.map((s) => s.r.carry)) / BAG[club].carry);
  }
  const factor = ratios.length ? Math.min(1.35, Math.max(0.55, median(ratios))) : 1;
  // Ball speed doesn't fall as fast as carry for a slower swing.
  const speedFactor = factor ** 0.8;
  const clubs = {};
  const priors = {};
  for (const club of CLUB_ORDER) {
    const bag = BAG[club];
    const list = own.get(club) ?? [];
    const n = list.length;
    const prior = {
      carry: { m: bag.carry * factor, s: Math.max(5, bag.carry * factor * 0.07) },
      vla: { m: bag.vla, s: 2.5 },
      spin: { m: bag.spin, s: bag.spin * 0.16 },
      speed: { m: bag.speed * speedFactor, s: bag.speed * speedFactor * 0.045 },
    };
    priors[club] = prior;
    const carries = list.map((s) => s.r.carry);
    if (n >= BASELINE_MIN) {
      const m = median(carries);
      const withBall = list.filter((s) => s.b);
      clubs[club] = {
        n,
        own: true,
        carry: { m, s: spreadOf(carries, Math.max(3, m * 0.035)) },
        vla: withBall.length >= BASELINE_MIN ? { m: median(withBall.map((s) => s.b.v)), s: spreadOf(withBall.map((s) => s.b.v), 1.2) } : prior.vla,
        spin: withBall.length >= BASELINE_MIN
          ? { m: median(withBall.map((s) => s.b.sp)), s: spreadOf(withBall.map((s) => s.b.sp), bag.spin * 0.08) }
          : prior.spin,
        speed: withBall.length >= BASELINE_MIN && withBall.every((s) => Number.isFinite(s.b.s))
          ? { m: median(withBall.map((s) => s.b.s)), s: spreadOf(withBall.map((s) => s.b.s), bag.speed * 0.025) }
          : prior.speed,
      };
    } else if (n >= 3) {
      // A few shots move the centre part of the way; the spread stays generous.
      const w = n / BASELINE_MIN;
      clubs[club] = { ...prior, n, own: false, carry: { m: median(carries) * w + prior.carry.m * (1 - w), s: prior.carry.s } };
    } else {
      clubs[club] = { ...prior, n, own: false };
    }
    clubs[club].norm = strikeNorm(club, list, all.get(club) ?? [], clubs[club], ratios.length > 0);
  }
  // A club whose own middle is out of the bag's order - next to no
  // further than a shorter club the player has numbers for, where the bag
  // says there's a real gap between them (a session's drives hit with the
  // 7 iron selected, counted as 7 irons before it was spotted), or clearly
  // shorter than it: the one of the two further from what the bag says it
  // carries, scaled to this player, goes back to the bag's numbers until
  // its own come right (mixed: the stats page's review shows why).
  for (let pass = 0; pass < CLUB_ORDER.length; pass++) {
    const owned = CLUB_ORDER.filter((c) => clubs[c].own);
    let moved = false;
    for (let i = 0; i + 1 < owned.length; i++) {
      const [la, sb] = [owned[i], owned[i + 1]];
      const a = clubs[la];
      const b = clubs[sb];
      const expected = (BAG[la].carry - BAG[sb].carry) * factor;
      if (a.carry.m - b.carry.m >= expected * 0.25 - Math.max(a.carry.s, b.carry.s)) continue;
      const off = (club) => Math.abs(Math.log(clubs[club].carry.m / (BAG[club].carry * factor)));
      const worse = off(la) >= off(sb) ? la : sb;
      const n = clubs[worse].n;
      clubs[worse] = { ...priors[worse], n, own: false, mixed: true };
      clubs[worse].norm = strikeNorm(worse, own.get(worse) ?? [], all.get(worse) ?? [], clubs[worse], ratios.length > 0);
      moved = true;
      break;
    }
    if (!moved) break;
  }
  const out = { clubs, factor, scaled: ratios.length > 0, clubSpeed: clubSpeedTrusted(all) };
  out.accepted = acceptedCarries(shots, out);
  return out;
}

// ---- How it was struck ------------------------------------------------------

// A good strike's smash factor (ball speed per club speed) with each kind
// of club, before a player has their own.
export function typicalSmash(club) {
  if (club === "DR") return 1.47;
  if (club === "3W" || club === "5W") return 1.43;
  if (club === "4H") return 1.39;
  if (WEDGES.has(club)) return 1.22;
  return 1.33;
}
const smashOf = (s) => (s.k?.s >= 30 && s.b?.s > 0 ? s.b.s / s.k.s : NaN);

// What a club's strike is judged against: its good strikes, once there
// are enough and they're at least STRIKE.goodShare of its full swings.
// Otherwise all its full swings, good or not - a player whose ball always
// launches low isn't thin every shot, that's their normal, and judging
// against good strikes alone could never find enough of them. Before a
// club has BASELINE_MIN full swings, the bag's numbers (scaled once the
// player's other clubs say how far they hit: `scaled`).
function strikeNorm(club, good, all, c, scaled) {
  const list = good.length >= BASELINE_MIN && good.length >= all.length * STRIKE.goodShare ? good : all.length >= BASELINE_MIN ? all : null;
  const smashes = (list ?? all).map(smashOf).filter(Number.isFinite);
  const smash = smashes.length >= 5 ? median(smashes) : typicalSmash(club);
  if (!list) return { own: false, scaled, n: all.length, carry: c.carry.m, speed: c.speed.m, vla: c.vla, spin: c.spin, smash };
  const bag = BAG[club];
  const withBall = list.filter((s) => s.b && Number.isFinite(s.b.v));
  const enough = withBall.length >= BASELINE_MIN;
  const speeds = withBall.map((s) => s.b.s).filter(Number.isFinite);
  return {
    own: true,
    scaled,
    n: all.length,
    carry: median(list.map((s) => s.r.carry)),
    speed: speeds.length >= BASELINE_MIN ? median(speeds) : c.speed.m,
    vla: enough ? { m: median(withBall.map((s) => s.b.v)), s: spreadOf(withBall.map((s) => s.b.v), 1.2) } : c.vla,
    spin: enough ? { m: median(withBall.map((s) => s.b.sp)), s: spreadOf(withBall.map((s) => s.b.sp), bag.spin * 0.08) } : c.spin,
    smash,
  };
}

// Whether the club speed can be believed: the player's full swings with
// club data have given sensible smash factors. Club speed in the wrong
// units (the calibration's smash check) would make every shot look
// impossible, and no shot is called a misread on its word until then.
function clubSpeedTrusted(all) {
  const ratios = [];
  for (const [club, list] of all) for (const s of list) {
    const m = smashOf(s);
    if (Number.isFinite(m)) ratios.push(m / typicalSmash(club));
  }
  if (ratios.length < 5) return false;
  const m = median(ratios);
  return m > 0.8 && m < 1.15;
}

// Where the lines are drawn, all against the club's normal (strikeNorm):
//  topped  launched under toppedLaunch° or toppedShare of its usual launch,
//          whichever is higher, and carried under toppedCarry of usual
//  shank   started shankStart° or more off line having lost ball speed
//          (under shankSpeed of usual) - either way, for either hand
//  thin    carried under thinCarry of usual, with ball speed still over
//          thinSpeed of usual (a thin one comes off hot), launched at least
//          thinDrop° or thinSpreads of its usual spread under the usual
//          launch - or struck lowImpact mm or more below centre with a
//          smaller drop (half as much) or a poor smash - and, with an iron
//          or wedge, spinning no more than usual (a driver low on the face
//          spins more, so that's not asked of the long clubs)
//  fat     carried under fatCarry of usual (fatCarryNew before the club has
//          its own numbers), with ball speed under fatSpeed of usual (the
//          ground took it; fatSpeedNew before) or a smash factor smashDrop
//          under usual - but launched and spinning no more than a little
//          over usual, so a shorter club hit with this one selected is
//          still a club check, not fat. Ball speed alone says nothing for a
//          new player until their other clubs say how hard they hit, so
//          without club data a new player's shot is never called fat.
// Each is well outside a good strike's scatter: a thin 7 iron launches
// 4-8° lower and loses 10-25% of its carry; a fat one loses 10% or more of
// its ball speed. Missing a bad strike costs little (the player can mark
// it); calling a good one bad would take it out of the club's numbers.
export const STRIKE = Object.freeze({
  goodShare: 0.4,
  toppedLaunch: 4,
  toppedShare: 0.35,
  toppedCarry: 0.8,
  shankStart: 18,
  shankSpeed: 0.85,
  thinCarry: 0.92,
  thinSpeed: 0.85,
  thinDrop: 3,
  thinSpreads: 2,
  lowImpact: -8,
  fatCarry: 0.85,
  fatCarryNew: 0.78,
  fatSpeed: 0.9,
  fatSpeedNew: 0.82,
  smashDrop: 0.12,
});
const LONG_CLUBS = new Set(["DR", "3W", "5W", "4H"]);

// How a full swing was struck, against the club's normal (see STRIKE).
// Returns { q: "good" | "thin" | "fat" | "topped" | "shank", why } - why
// is a few words on what gave it away, for the card after the shot.
//   shot: { club, carry, vla, spin, speed, hla, clubSpeed, impactV }
export function strikeQuality(shot, prof) {
  const n = prof.clubs[shot.club]?.norm;
  const good = { q: "good", why: "" };
  if (!n || !Number.isFinite(shot.carry) || !Number.isFinite(shot.vla)) return good;
  const L = STRIKE;
  const fin = Number.isFinite;
  const carryPart = shot.carry / n.carry;
  const speedPart = fin(shot.speed) && shot.speed > 0 ? shot.speed / n.speed : NaN;
  const smash = fin(shot.clubSpeed) && shot.clubSpeed >= 30 && fin(shot.speed) ? shot.speed / shot.clubSpeed : NaN;
  const poorSmash = fin(smash) && smash <= n.smash - L.smashDrop;
  const low = fin(shot.impactV) && shot.impactV <= L.lowImpact;
  const drop = n.vla.m - shot.vla;
  const r = Math.round;
  const launchWhy = `launched ${r(shot.vla)}° (usually ${r(n.vla.m)}°)`;
  const carryWhy = `carried ${r(shot.carry)} yds (usually ${r(n.carry)})`;
  if (shot.vla < Math.max(L.toppedLaunch, n.vla.m * L.toppedShare) && carryPart < L.toppedCarry) return { q: "topped", why: `${launchWhy}, ${carryWhy}` };
  if (fin(shot.hla) && Math.abs(shot.hla) >= L.shankStart && speedPart < L.shankSpeed) {
    return { q: "shank", why: `started ${r(Math.abs(shot.hla))}° ${shot.hla > 0 ? "right" : "left"}, ball speed ${r(shot.speed)} mph (usually ${r(n.speed)})` };
  }
  const spinOk = LONG_CLUBS.has(shot.club) || !fin(shot.spin) || shot.spin <= n.spin.m;
  const bigDrop = drop >= Math.max(L.thinDrop, L.thinSpreads * n.vla.s);
  const lowDrop = low && (drop >= Math.max(L.thinDrop, L.thinSpreads * n.vla.s) / 2 || poorSmash);
  if (carryPart < L.thinCarry && !(speedPart < L.thinSpeed) && (bigDrop || lowDrop) && spinOk) {
    return { q: "thin", why: [launchWhy, low ? `struck ${r(-shot.impactV)} mm low on the face` : "", carryWhy].filter(Boolean).join(", ") };
  }
  const known = n.own || n.scaled;
  const slow = known && speedPart < (n.own ? L.fatSpeed : L.fatSpeedNew);
  const notHigher = drop > -Math.max(3, 2 * n.vla.s) && !(fin(shot.spin) && shot.spin > n.spin.m + 1.5 * n.spin.s);
  if (carryPart < (n.own ? L.fatCarry : L.fatCarryNew) && (slow || poorSmash) && notHigher) {
    const speedWhy = poorSmash ? `smash ${smash.toFixed(2)} (usually ${n.smash.toFixed(2)})` : `ball speed ${r(shot.speed)} mph (usually ${r(n.speed)})`;
    return { q: "fat", why: `${speedWhy}, ${carryWhy}` };
  }
  return good;
}

// A reading no real strike produces - the launch monitor got it wrong (a
// double read, a stray, a ball it lost). Only what can't happen, as
// calling a real shot a misread is worse than missing one; the player is
// asked rather than the shot being taken out. Returns { why, words } or
// null.
//  smash   ball speed over 1.62 times club speed (the rules hold a driver
//          to about 1.5) or under 0.5 with a real swing (50 mph or more) -
//          only once the club speed has been believable (clubSpeedTrusted)
//  spin    under 300 rpm on a full swing launched 8° or more at 60 mph or
//          more (a ball in the air always spins - the Omni sends 0 when it
//          had no spin reading), or over 13,000 rpm
//  launch  over 65° at more than 70 mph, or under -10°
//  speed   ball speed over 210 mph
export function misread(shot, { clubSpeed = true } = {}) {
  const fin = Number.isFinite;
  const { speed, vla, spin } = shot;
  if (shot.sw === "putt") return null;
  if (clubSpeed && fin(shot.clubSpeed) && shot.clubSpeed >= 30 && fin(speed)) {
    const smash = speed / shot.clubSpeed;
    if (smash > 1.62 || (smash < 0.5 && shot.clubSpeed >= 50)) {
      return { why: "smash", words: `${Math.round(speed)} mph ball speed from ${Math.round(shot.clubSpeed)} mph club speed` };
    }
  }
  if (fin(spin) && fin(vla) && fin(speed) && shot.sw === "full" && spin < 300 && vla >= 8 && speed >= 60) {
    return { why: "spin", words: `${Math.round(spin)} rpm spin at ${Math.round(vla)}° launch` };
  }
  if (fin(spin) && spin > 13000) return { why: "spin", words: `${Math.round(spin).toLocaleString("en-GB")} rpm spin` };
  if (fin(vla) && ((vla > 65 && speed > 70) || vla < -10)) return { why: "launch", words: `${Math.round(vla)}° launch at ${Math.round(speed)} mph` };
  if (fin(speed) && speed > 210) return { why: "speed", words: `${Math.round(speed)} mph ball speed` };
  return null;
}

// A stored shot's numbers, as strikeQuality and misread take them.
export const shotNumbers = (s) => ({
  club: s.c,
  sw: s.sw,
  carry: s.r?.carry,
  vla: s.b?.v,
  spin: s.b?.sp,
  speed: s.b?.s,
  hla: s.b?.h,
  clubSpeed: s.k?.s,
  impactV: s.k?.iv,
});

// Shots from before strikes were judged: each full swing judged against
// the club's normal from the whole history (twice - the second time
// against a normal from the strikes the first found good), in memory, as
// the file is read. Leaves shots already judged alone. Returns the shots.
export function judgeOld(shots) {
  const old = shots.filter((s) => s.sw === "full" && s.st === undefined && goodLie(s.lie) && !s.un && s.m !== "calibration" && s.r && Number.isFinite(s.r.carry));
  if (!old.length) return shots;
  for (let pass = 0; pass < 2; pass++) {
    const prof = profiles(shots);
    for (const s of old) s.st = strikeQuality(shotNumbers(s), prof).q;
  }
  return shots;
}

// Each club's carries a player has settled as normal: a yes to a club
// check, or checks left unanswered at one distance - those only while they
// still fit the club (quietFits, against the profile they're for: one
// settled before that rule, a session of another club's distances, no
// longer counts as this club's normal).
function acceptedCarries(shots, prof = null) {
  const accepted = new Map();
  for (const s of shots) {
    if (!counts(s) || !BAG[s.c] || !settled(s)) continue;
    if (prof && s.ans === "quiet" && !quietFits({ club: s.c, carry: s.r.carry, vla: s.b?.v, spin: s.b?.sp, speed: s.b?.s }, prof)) continue;
    if (!accepted.has(s.c)) accepted.set(s.c, []);
    accepted.get(s.c).push(s.r.carry);
  }
  return accepted;
}

// How many of each club's latest shots the club check goes on.
export const CHECK_WINDOW = 300;

// The profile the club check uses as each shot is recorded (server/
// stats.mjs): from each club's latest CHECK_WINDOW full swings - the
// player's current form, and plenty to know a club by - so it stays quick
// however long the history grows. Every distance ever settled as normal
// still counts. The stats page's numbers still use every shot.
export function checkProfile(shots, per = CHECK_WINDOW) {
  const recent = [];
  const taken = new Map();
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    if (!rated(s) || !BAG[s.c]) continue;
    const n = taken.get(s.c) ?? 0;
    if (n >= per) continue;
    taken.set(s.c, n + 1);
    recent.push(s);
  }
  const prof = profiles(recent.reverse());
  return { ...prof, accepted: acceptedCarries(shots, prof) };
}

// How far a player's full swing with a club usually carries.
export function fullCarry(prof, club) {
  return prof.clubs[club]?.carry.m ?? BAG[club]?.carry ?? 150;
}
// Whether that is known from the player's own shots rather than the bag.
export const knownCarry = (prof, club) => !!(prof.clubs[club]?.own || prof.scaled);

// How unlike a club's normal a shot is, in spreads: mostly carry, with
// launch and spin helping tell a driver from a fairway wood or a topped
// shot from a different club.
function unlike(c, shot) {
  const zc = (shot.carry - c.carry.m) / c.carry.s;
  let sum = zc * zc;
  let parts = 1;
  if (Number.isFinite(shot.vla)) {
    sum += 0.5 * ((shot.vla - c.vla.m) / c.vla.s) ** 2;
    parts += 0.5;
  }
  if (Number.isFinite(shot.spin) && shot.spin > 0) {
    sum += 0.5 * ((shot.spin - c.spin.m) / c.spin.s) ** 2;
    parts += 0.5;
  }
  if (Number.isFinite(shot.speed) && shot.speed > 0 && c.speed) {
    sum += 0.5 * ((shot.speed - c.speed.m) / c.speed.s) ** 2;
    parts += 0.5;
  }
  return Math.sqrt(sum / parts);
}

// After a full swing: is it outside the normal range for the selected club,
// and does it look more like another one? Returns { club, looksLike } to ask
// about - with sure: true when it's that clear (OBVIOUS) - or null. Doesn't
// ask when:
//  - it's within the club's usual range: its carry, once the player has
//    their own numbers for it; before that, carry, launch, spin and ball
//    speed together against the bag's (so a 5 iron's flight is spotted
//    from the first shot, but a strong player's 7 iron isn't doubted),
//  - the player has already said yes to this club going about this far,
//  - it looks like no club at all (a topped or shanked shot is still the
//    club in hand), or no clearer another club than this one.
//   shot: { club, sw, carry, vla, spin, speed }
export function clubCheck(shot, prof) {
  if (shot.sw !== "full" || !prof.clubs[shot.club]) return null;
  const mine = prof.clubs[shot.club];
  const dMine = unlike(mine, shot);
  if (mine.own ? Math.abs(shot.carry - mine.carry.m) <= CHECK_SPREADS * mine.carry.s : dMine <= PRIOR_SPREADS) return null;
  if ((prof.accepted.get(shot.club) ?? []).some((c) => Math.abs(c - shot.carry) <= c * 0.06)) return null;
  let best = null;
  let dBest = Infinity;
  for (const club of CLUB_ORDER) {
    const d = unlike(prof.clubs[club], shot);
    if (d < dBest) [best, dBest] = [club, d];
  }
  if (best === shot.club || dBest > CHECK_SPREADS || dBest > dMine * 0.6) return null;
  const ballKnown = Number.isFinite(shot.vla) && Number.isFinite(shot.spin) && shot.spin > 0;
  const sure = ballKnown && dBest <= OBVIOUS.fit && dMine >= OBVIOUS.far && !!prof.clubs[best].own;
  return sure ? { club: shot.club, looksLike: best, sure: true } : { club: shot.club, looksLike: best };
}

// Whether a distance can be taken as a club's normal when its checks go
// unanswered: not when the shot fits another club this player has their
// own numbers for (then it's that club, hit with this one selected), nor
// when it would put the club out of the bag's order - as far as a longer
// club the player has numbers for goes, or no further than a shorter one.
// (A player with no numbers of their own yet may well hit it that far.)
//   shot: { club, carry, vla, spin, speed }
export function quietFits(shot, prof) {
  const at = CLUB_ORDER.indexOf(shot.club);
  if (at < 0 || !Number.isFinite(shot.carry)) return true;
  // (Fitting another club needs the ball's launch and spin too: by carry
  // alone, a 7 iron going a little further sits next to the 6 iron.)
  const ballKnown = Number.isFinite(shot.vla) && Number.isFinite(shot.spin) && shot.spin > 0;
  for (const club of ballKnown ? CLUB_ORDER : []) {
    const c = prof.clubs[club];
    if (club === shot.club || !c?.own) continue;
    if (unlike(c, shot) <= OBVIOUS.fit) return false;
  }
  const own = (i) => {
    const c = prof.clubs[CLUB_ORDER[i]];
    return c?.own ? c : null;
  };
  // (CLUB_ORDER runs longest first.)
  for (let i = at - 1; i >= 0; i--) {
    const c = own(i);
    if (!c) continue;
    if (shot.carry >= c.carry.m - c.carry.s) return false;
    break;
  }
  for (let i = at + 1; i < CLUB_ORDER.length; i++) {
    const c = own(i);
    if (!c) continue;
    if (shot.carry <= c.carry.m + c.carry.s) return false;
    break;
  }
  return true;
}

// ---- A very unusual shot: what was it? ----------------------------------

// When a full swing is asked about (unusualShot). Only well short: nobody
// hits a ball further on purpose by swinging differently, and a shot much
// further than usual is the club check's question. Every line is well
// past ordinary scatter - a club's carries spread about 3 - 5% either
// side, and the club check itself starts at CHECK_SPREADS (2.5) spreads:
//  carry       under the club's usual by share (20%) and spreads (3) of its
//              spread, both - a 7 iron that usually carries 150 has to come
//              up about 30 yards short. A 25% swing, a punch under a branch
//              played for distance, a bump-and-run: all well past that
//  launch      or launched launchDrop° (5) and launchSpreads (3) of its
//              spread under its usual, carrying under launchCarry (92%) of
//              usual: a punch or knockdown with a longer club, hit about as
//              far as a shorter one goes, which would otherwise be judged
//              thin (and counted in the club's thin percentage)
//  target      or, aiming at a target short of the club's usual (the flag,
//              a range target) by targetShare (12%) or more - a reason to
//              take something off - under usual by that share and
//              CHECK_SPREADS spreads, having gone past it (had it finished
//              near the target, the swing rules already call it a part
//              swing, and nothing is asked)
// Topped and shanked shots aren't asked about: nobody tops one on purpose,
// and the strike says what it was.
export const UNUSUAL = Object.freeze({
  share: 0.2,
  spreads: 3,
  launchDrop: 5,
  launchSpreads: 3,
  launchCarry: 0.92,
  targetShare: 0.12,
});

// The special kinds in the order the question offers them - the likeliest
// first, which is also the one its key (E) says: a part swing when the
// target was short of the club's usual or the ball came off slowly at
// about its usual launch; a punch when it launched well low with most of
// its ball speed. Something else is always last.
//   shot: { carry, vla, speed, intended }   norm: { carry, speed, vla: { m, s } }
export function specialOrder(shot, norm) {
  const fin = Number.isFinite;
  const part = ["part", "punch", "other"];
  const punch = ["punch", "part", "other"];
  if (!norm) return punch;
  if (fin(shot.intended) && shot.intended < norm.carry * (1 - UNUSUAL.targetShare)) return part;
  const low = Math.max(3, 2 * (norm.vla?.s ?? 1.5));
  const drop = fin(shot.vla) && norm.vla ? norm.vla.m - shot.vla : 0;
  const speedPart = fin(shot.speed) && shot.speed > 0 && norm.speed ? shot.speed / norm.speed : 1;
  if (drop >= low && speedPart >= 0.88) return punch;
  if (speedPart < 0.88) return part;
  return punch;
}

// After a full swing with a club whose range is known (the player's own
// numbers, BASELINE_MIN good strikes): did it go so far short of usual (see
// UNUSUAL) that it may not have been the club's normal swing at all?
// Returns { usual, carry, why, order } to ask about, or null. Never before
// the club's range is known - until then there's no telling.
//   shot: { club, carry, vla, speed, intended }
export function unusualShot(shot, prof) {
  const c = prof.clubs[shot.club];
  if (!c?.own || !Number.isFinite(shot.carry)) return null;
  const U = UNUSUAL;
  const fin = Number.isFinite;
  const m = c.carry.m;
  const short = m - shot.carry;
  if (short <= 0) return null;
  const vla = c.norm?.own ? c.norm.vla : c.vla;
  const speed = c.norm?.own ? c.norm.speed : c.speed.m;
  const r = Math.round;
  const base = { usual: r(m), carry: r(shot.carry), order: specialOrder(shot, { carry: m, speed, vla }) };
  if (short >= U.share * m && short >= U.spreads * c.carry.s) return { ...base, why: "carry" };
  if (fin(shot.vla) && vla.m - shot.vla >= Math.max(U.launchDrop, U.launchSpreads * vla.s) && shot.carry < U.launchCarry * m) {
    return { ...base, why: "launch", launch: r(shot.vla), usualLaunch: r(vla.m) };
  }
  if (fin(shot.intended) && shot.intended < m * (1 - U.targetShare) && shot.carry > shot.intended && short >= U.targetShare * m && short >= CHECK_SPREADS * c.carry.s) {
    return { ...base, why: "target", target: r(shot.intended) };
  }
  return null;
}

// Everything worked out about a new shot, from the player's history:
// its swing type, how a full swing was struck, whether the reading looks
// like a misread, whether to question the club or ask what the shot was,
// and any earlier unanswered questions this one settles. Returns { sw, sp,
// strike, odd, check, settle, unusual } - strike is { q, why } for a full
// swing judged (see rated), else null; odd is misread()'s { why, words } or
// null; unusual is unusualShot()'s answer plus looksLike (the club it flew
// like, if any), or null; sp a special shot's kind.
//   shot: { mode, club, carry, lie, toPin, intended, vla, spin, speed, hla,
//           clubSpeed, impactV (the Omni's club data, when it came with
//           the shot), swing (when the mode knows), uneven (hilly ground,
//           a slope), special (said before the shot: "punch", "part",
//           "other"), power (said before the shot: 10 - 100, power.mjs) }
// A power said before the shot comes back as pw (null for a putt), and the
// swing it would have been without it as bsw, when that's another.
export function classify(shot, history, prof = profiles(history)) {
  const { club, carry } = shot;
  let sw = SWINGS.includes(shot.swing) ? shot.swing : swingType(shot, fullCarry(prof, club), { own: knownCarry(prof, club) });
  const ball = { club, carry, vla: shot.vla, spin: shot.spin, speed: shot.speed };
  const numbers = { ...ball, hla: shot.hla, clubSpeed: shot.clubSpeed, impactV: shot.impactV };
  const fair = goodLie(shot.lie) && !shot.uneven && shot.mode !== "calibration";
  // Short, but with a full swing's ball speed and next to no launch: a
  // topped (or badly thinned) full swing, not a pitch or a part swing -
  // which never come off the face that fast. Only away from a green, when
  // the mode didn't say, and not at a target the player meant to hit short.
  const nearGreen = shot.mode === "chipping" || shot.lie === "green" || (Number.isFinite(shot.toPin) && shot.lie !== "tee" && shot.toPin <= 80);
  const shortTarget = Number.isFinite(shot.intended) && shot.intended < fullCarry(prof, club) * 0.85;
  if (fair && !SWINGS.includes(shot.swing) && ["partial", "pitch", "chip"].includes(sw) && !nearGreen && !shortTarget) {
    const q = strikeQuality(numbers, prof).q;
    const n = prof.clubs[club]?.norm;
    if (q === "topped" || (q === "thin" && n && shot.speed >= n.speed * 0.95)) sw = "full";
  }
  // Said before the shot to be a special one (a punch, a part swing...):
  // that's what it was, unless it was a chip, a pitch or a putt anyway.
  // Never judged or questioned, and out of the club's numbers.
  //
  // Or said to be at a power (a "mod swing", power.mjs): a part swing at
  // that power, or a chip or pitch with it - in place of a special shot, and
  // never judged or questioned, as a part swing isn't.
  const pw = sw === "putt" ? null : cleanPower(shot.power);
  const special = pw == null && SPECIALS.includes(shot.special) && ["full", "partial"].includes(sw) ? shot.special : null;
  if (special) sw = specialSwing(special);
  const bsw = sw;
  if (pw != null) sw = powerSwing(sw, pw);
  const sp = sw === "special" ? special : undefined;
  const odd = misread({ ...numbers, sw }, { clubSpeed: prof.clubSpeed });
  const strike = sw === "full" && fair ? strikeQuality(numbers, prof) : null;
  // Short with no target: a part swing of this club, or a full swing with
  // a shorter one while this one was still selected? The launch and spin
  // tell them apart - a full sand wedge climbs and spins like one.
  if (sw === "partial" && !special && pw == null && !Number.isFinite(shot.intended)) {
    const q = clubCheck({ ...ball, sw: "full" }, prof);
    if (q && CLUB_ORDER.indexOf(q.looksLike) > CLUB_ORDER.indexOf(club)) sw = "full";
  }
  // Out of the rough or sand, or off a slope, the ground took distance off
  // or added it, so the carry says nothing about the club.
  // A bad strike is still the club in hand, and a misread says nothing
  // about any club: neither is questioned. Nor is a club the game picked
  // itself (clubSure: a gapping session's).
  let check = fair && !odd && !shot.clubSure && (!strike || strike.q === "good") ? clubCheck({ ...ball, sw }, prof) : null;
  // Well short of the club's usual, once its range is known: a punch, a
  // part swing, a mishit or another club? One question asks all of it, in
  // place of the club check (whose answer is one of its choices) and of
  // the strike being counted on a guess. Not a topped or shanked shot.
  let unusual = null;
  const settle = [];
  if (sw === "full" && fair && !odd && !(strike && (strike.q === "topped" || strike.q === "shank"))) {
    unusual = unusualShot({ ...ball, intended: shot.intended }, prof);
    // A distance this player has said is normal for the club.
    if (unusual && (prof.accepted.get(club) ?? []).some((c) => Math.abs(c - carry) <= c * 0.06)) unusual = null;
    if (unusual) {
      // Asked about this far a few times and never answered: it's how far
      // they hit it now (a new club, a sore back), and they stop being
      // asked - those shots count again.
      const near = history.filter((s) => asking(s) && s.c === club && s.r && !removed(s) && Math.abs(s.r.carry - carry) <= carry * 0.06);
      if (near.length >= QUIET_AFTER - 1 && quietFits(ball, prof)) {
        unusual = null;
        settle.push(...near.map((s) => s.id));
      } else {
        // Offered as the wrong club only if it's a shorter one: a shot
        // well short that "looked like" a longer club (a low punch, by its
        // launch and spin) was never hit with one.
        const looks = clubCheck({ ...ball, sw }, prof)?.looksLike ?? null;
        unusual.looksLike = looks && CLUB_ORDER.indexOf(looks) > CLUB_ORDER.indexOf(club) ? looks : null;
        check = null;
      }
    }
  }
  // Earlier checks with this club still waiting for an answer.
  const waiting = history.filter((s) => s.ok === false && s.check && s.c === club && s.r && !removed(s));
  if (check) {
    // Asked before about this far and never answered: after a few, take it
    // as how far this player hits it and stop asking. A card that fades
    // unanswered shouldn't mean being asked about every shot for ever.
    // (Never a wrong club, though: if it's another club this player hits,
    // or out of their bag's order, it stays asked - quietFits.)
    const near = waiting.filter((s) => Math.abs(s.r.carry - carry) <= carry * 0.06);
    if (!check.sure && near.length >= QUIET_AFTER - 1 && quietFits(ball, prof)) {
      check = null;
      settle.push(...near.map((s) => s.id));
    }
  } else {
    // As the player's own numbers grow, an old doubt may no longer look odd
    // at all: then it was their normal, and it counts.
    settle.push(
      ...waiting.filter((s) => !clubCheck({ club, sw: "full", carry: s.r.carry, vla: s.b?.v, spin: s.b?.sp, speed: s.b?.s }, prof)).map((s) => s.id),
    );
  }
  return { sw, sp, strike, odd, check, settle, unusual, pw, bsw: bsw !== sw ? bsw : undefined };
}

// ---- The stats page's numbers -------------------------------------------------

// A gap between two clubs (the longer first) well beyond the step the bag
// expects between them, scaled to how far this player hits. Clubs not hit
// in between are part of that expected step, not a gap.
export function bigGap(a, b, diff, factor = 1) {
  if (!BAG[a] || !BAG[b]) return false;
  return diff > (BAG[a].carry - BAG[b].carry) * factor + 12;
}

const r1 = (v) => (Number.isFinite(v) ? Math.round(v * 10) / 10 : null);
const r0 = (v) => (Number.isFinite(v) ? Math.round(v) : null);

// "Recent" for a club is its last 20 shots; "long term" is all of them.
// Recent against older is only compared once there are enough of both.
export const RECENT_SHOTS = 20;

function clubNumbers(list) {
  const carries = list.map((s) => s.r.carry);
  const offs = list.map((s) => s.r.off ?? 0);
  const withBall = list.filter((s) => s.b);
  return {
    n: list.length,
    carry: r1(mean(carries)),
    carryMedian: r1(median(carries)),
    total: r1(mean(list.map((s) => s.r.total ?? s.r.carry))),
    // The typical carry and roll, which a topped one doesn't drag down (the
    // driving challenge's "From your stats" average).
    totalMedian: r1(median(list.map((s) => s.r.total ?? s.r.carry))),
    low: r1(quantile(carries, 0.1)),
    high: r1(quantile(carries, 0.9)),
    side: r1(mean(offs)),
    left: r1(quantile(offs, 0.1)),
    right: r1(quantile(offs, 0.9)),
    width: r1(quantile(offs, 0.9) - quantile(offs, 0.1)),
    speed: r1(mean(withBall.map((s) => s.b.s))),
    launch: r1(mean(withBall.map((s) => s.b.v))),
    spin: r0(mean(withBall.map((s) => s.b.sp))),
  };
}

// Recent against the shots before them: what's changed, when there are
// enough of each to say. Positive carry is further; positive width wider.
export function recentVsUsual(list, recentCount = RECENT_SHOTS) {
  if (list.length < recentCount + 10) return null;
  const recent = list.slice(-recentCount);
  const older = list.slice(0, -recentCount);
  const a = clubNumbers(recent);
  const b = clubNumbers(older);
  return { recent: a, usual: b, carry: r1(a.carryMedian - b.carryMedian), width: r1(a.width - b.width) };
}

// Misses in a band before its pace (mostly short, mostly long) is shown.
export const PACE_MIN = 5;
export const PUTT_BANDS = [
  [0, 6, "Under 6 ft"],
  [6, 12, "6 - 12 ft"],
  [12, 25, "12 - 25 ft"],
  [25, 45, "25 - 45 ft"],
  [45, 999, "45 ft +"],
];
const CHIP_BANDS = [
  [0, 15, "Under 15 yds"],
  [15, 25, "15 - 25 yds"],
  [25, 40, "25 - 40 yds"],
  [40, 999, "40 yds +"],
];

export function puttingBands(shots) {
  shots = live(shots);
  const putts = shots.filter((s) => s.sw === "putt" && s.tg && Number.isFinite(s.tg.d));
  return PUTT_BANDS.map(([lo, hi, label]) => {
    const list = putts.filter((s) => s.tg.d * 3 >= lo && s.tg.d * 3 < hi);
    if (!list.length) return null;
    const made = list.filter((s) => s.tg.made).length;
    const missed = list.filter((s) => !s.tg.made && Number.isFinite(s.tg.long));
    const short = missed.filter((s) => s.tg.long < 0).length;
    // Pace needs a few misses to say anything: 0 of 3 isn't a tendency.
    const enough = missed.length >= PACE_MIN;
    return {
      label,
      from: lo,
      to: hi,
      n: list.length,
      made,
      makePct: r0((100 * made) / list.length),
      shortPct: enough ? r0((100 * short) / missed.length) : null,
      leaveFt: missed.length ? r1(mean(missed.map((s) => s.tg.f * 3))) : null,
      pastFt: enough ? r1(median(missed.map((s) => s.tg.long * 3))) : null,
    };
  }).filter(Boolean);
}

export function chippingBands(shots) {
  shots = live(shots);
  const chips = shots.filter((s) => (s.sw === "chip" || s.sw === "pitch") && s.tg && Number.isFinite(s.tg.d) && Number.isFinite(s.tg.f));
  return CHIP_BANDS.map(([lo, hi, label]) => {
    const list = chips.filter((s) => s.tg.d >= lo && s.tg.d < hi);
    if (!list.length) return null;
    return {
      label,
      n: list.length,
      leaveFt: r1(mean(list.map((s) => s.tg.f * 3))),
      holed: list.filter((s) => s.tg.made).length,
      recentLeaveFt: list.length >= 30 ? r1(mean(list.slice(-RECENT_SHOTS).map((s) => s.tg.f * 3))) : null,
    };
  }).filter(Boolean);
}

// Part swings, pitches and chips with each club: how far they carry, kept
// apart from its full swing.
export function shortSwings(shots) {
  shots = live(shots);
  const out = [];
  for (const club of CLUB_ORDER) {
    for (const sw of ["partial", "pitch", "chip"]) {
      const list = shots.filter((s) => s.c === club && s.sw === sw && s.r && Number.isFinite(s.r.carry) && s.m !== "calibration");
      if (!list.length) continue;
      const carries = list.map((s) => s.r.carry);
      out.push({ club, swing: sw, n: list.length, carry: r1(median(carries)), low: r1(quantile(carries, 0.1)), high: r1(quantile(carries, 0.9)) });
    }
  }
  return out;
}

// A club's full swings by how they were struck: how many were judged (the
// full swings from a fair lie that weren't misreads), how many of each bad
// strike, and each as a percentage of them.
export function strikeCounts(list) {
  const judged = list.filter(rated);
  const out = { n: judged.length, bad: 0, pct: {} };
  for (const q of STRIKES) {
    out[q] = judged.filter((s) => strikeOf(s) === q).length;
    out.bad += out[q];
    out.pct[q] = judged.length ? r0((100 * out[q]) / judged.length) : null;
  }
  out.pct.bad = judged.length ? r0((100 * out.bad) / judged.length) : null;
  return out;
}

// How many of each club's latest shots the stats page lists, so an odd one
// can be spotted and taken out (or put back).
export const LISTED = 12;

// One shot as the stats page's list shows it.
function listed(s) {
  return {
    id: s.id,
    t: s.t,
    // When it was hit (ms), for finding it in a recording: hd seconds
    // before it was recorded, when that was kept.
    hit: Number.isFinite(s.hd) ? s.t - s.hd * 1000 : null,
    club: s.c,
    sw: s.sw,
    carry: r1(s.r?.carry),
    speed: r1(s.b?.s),
    launch: r1(s.b?.v),
    spin: r0(s.b?.sp),
    strike: s.sw === "full" ? strikeOf(s) : null,
    // What the stats page's drop-down shows: the strike of a full swing,
    // or a part swing's or special shot's kind.
    kind: s.sw === "full" ? strikeOf(s) : s.sw === "partial" ? "part" : s.sw === "special" ? (s.sp ?? "other") : null,
    asking: asking(s),
    auto: s.st ?? null,
    my: s.my ?? null,
    odd: s.odd ?? null,
    removed: removed(s),
  };
}

// Everything for one player's stats page. `games` are the finished games
// the modes reported (challenge rounds, course rounds...). Shots the player
// took out as misreads, and readings still in doubt, count nowhere; they
// are only listed.
export function summarise(allShots, games = []) {
  const shots = live(allShots);
  const clubs = [];
  for (const club of CLUB_ORDER) {
    const mine = shots.filter((s) => s.c === club && s.r);
    const list = mine.filter(counts);
    const unchecked = mine.filter((s) => s.ok === false || asking(s)).length;
    const strikes = strikeCounts(mine);
    if (!list.length && !unchecked && !strikes.n) continue;
    clubs.push({ club, ...clubNumbers(list), unchecked, strikes, trend: recentVsUsual(list) });
  }
  // Each club's latest shots, misreads too (so they can be put back).
  const recent = [];
  for (const club of [...CLUB_ORDER, "PT"]) {
    const list = allShots.filter((s) => s.c === club && s.r).slice(-LISTED);
    if (list.length) recent.push({ club, shots: list.reverse().map(listed) });
  }
  // Special shots (punches, something else) by club: kept out of every
  // club number, but counted here so none silently vanishes. Part swings
  // have their own table (short).
  const special = [];
  for (const club of CLUB_ORDER) {
    const list = shots.filter((s) => s.c === club && s.sw === "special" && s.r && Number.isFinite(s.r.carry));
    if (!list.length) continue;
    const kinds = {};
    for (const k of SPECIALS) kinds[k] = list.filter((s) => (s.sp ?? "other") === k).length;
    special.push({ club, n: list.length, ...kinds, carry: r1(median(list.map((s) => s.r.carry))) });
  }
  const odd = allShots
    .filter(waiting)
    .slice(-10)
    .reverse()
    .map(listed);
  // Practice sessions, from the shots themselves: a range visit, a putting
  // or chipping session, each with its date and how many shots.
  const sessions = new Map();
  for (const s of shots) {
    if (!s.g?.id) continue;
    const key = `${s.g.k}:${s.g.id}`;
    if (!sessions.has(key)) sessions.set(key, { kind: s.g.k, id: s.g.id, from: s.t, to: s.t, shots: 0 });
    const e = sessions.get(key);
    e.to = s.t;
    e.shots++;
  }
  // The best of each kind of game (and of each version of it, the key).
  const bests = {};
  for (const g of games) {
    if (!Number.isFinite(g.score)) continue;
    const key = `${g.kind}|${g.key ?? ""}`;
    const lowWins = g.kind === "course";
    const cur = bests[key];
    if (!cur || (lowWins ? g.score < cur.score : g.score > cur.score)) bests[key] = { kind: g.kind, key: g.key ?? "", score: g.score, t: g.t, name: g.name };
  }
  const unchecked = shots
    .filter((s) => s.ok === false && s.check)
    .slice(-10)
    .reverse()
    .map((s) => ({ id: s.id, t: s.t, club: s.c, looksLike: s.check.looksLike, carry: r1(s.r.carry) }));
  return {
    shots: shots.length,
    removed: allShots.filter(removed).length,
    factor: profiles(shots).factor,
    first: shots[0]?.t ?? null,
    last: shots[shots.length - 1]?.t ?? null,
    clubs,
    short: shortSwings(shots),
    special,
    putting: puttingBands(shots),
    chipping: chippingBands(shots),
    games: [...games].reverse().slice(0, 200),
    bests: Object.values(bests),
    sessions: [...sessions.values()].reverse().slice(0, 50),
    unchecked,
    odd,
    recent,
  };
}
