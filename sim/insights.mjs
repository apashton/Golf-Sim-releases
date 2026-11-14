// Coaching notes from a player's shots: plain English, each with what it's
// based on and something to practise - the patterns a coach would spot:
// a club's miss and strike, gaps, the driver's launch, approaches, putting
// pace and chipping, and from the same data irons spinning a lot for their
// speed, long irons that don't get up, tiring late in a session, one club
// less consistent than its neighbours, three-putts and greens missed to
// one side on the course, and the course against the range.
// docs/COACHING.md has where it can go next.
//
// Each note: { id, tone, period, title, text, evidence, practice }
//   tone    "work" (something to work on), "good" (better than usual) or
//           "info" (worth knowing)
//   period  "recent" (the last few shots of it, or this session) or "long"
//
// Pure, so the tests can feed it made-up shots. Shots are as stored (see
// shotstats.mjs), oldest first.

import { CLUB_ORDER, counts, rated, live, asking, strikeCounts, STRIKES, median, quantile, mean, profiles, bigGap, PUTT_BANDS, RECENT_SHOTS } from "./shotstats.mjs";
import { BAG, CLUB_NAMES } from "./clubs.mjs";
import { simulateShot } from "./flight.mjs";
import { tagsOf } from "./shotnotes.mjs";

// "7 iron", "driver": a club's name as it reads mid-sentence.
const name = (c) => CLUB_NAMES[c]?.toLowerCase() ?? c;
const Name = (c) => name(c)[0].toUpperCase() + name(c).slice(1);
const yds = (v) => `${Math.round(Math.abs(v))} yds`;

// ---- One club's miss ---------------------------------------------------------

// Which way the ball starts and curves says what the face and path were
// doing: the face mostly sets the start line, the face against the path
// sets the curve. `side` is where it finishes (right +), which tells a
// pull-fade that stays left from one that fades past the target. Returns
// [what it does, what that means, what to try], or null.
//   start  degrees right of the target it starts (the launch direction)
//   curve  how much it's tilted to curve, right + (the spin axis)
export function missPattern(start, curve, side = 0) {
  const s = start >= 1.5 ? "R" : start <= -1.5 ? "L" : "0";
  const c = curve >= 3 ? "R" : curve <= -3 ? "L" : "0";
  // A big curve is a slice or a hook; a gentle one a fade or a draw.
  const big = Math.abs(curve) >= 8;
  const bend = c === "R" ? (big ? "slice" : "fade") : big ? "hook" : "draw";
  const key = s + c + (s !== "0" && c !== "0" && s !== c ? (side > 0 ? "R" : "L") : "");
  const table = {
    RR: ["starts right and curves further right", `the club face is open to the way you're swinging - a push-${bend}.`, "Work on squaring the face: check the grip isn't weak, and let the forearms turn over through the ball."],
    LL: ["starts left and curves further left", `the club face is closed to the way you're swinging - a pull-${bend}.`, "Quieter hands through impact, and check the grip isn't too strong."],
    RLR: ["starts right and draws, but not back to the target", "the swing is heading well out to the right, and the face follows it.", "Aim the swing less far right: feet and shoulders square to the target line."],
    RLL: ["starts right and draws past the target", "the swing comes too much from the inside, with the face closed to it - an over-draw.", "Feel the swing go more straight through the target, and hold the face a touch more open."],
    LRL: ["starts left and fades, but stays left", "the swing cuts across the ball from outside, with the face pointing left too - a pull-fade.", "Start the downswing with the lower body, so the club comes from the inside."],
    LRR: ["starts left and fades past the target", "the swing cuts across the ball from outside and the face is open to it - an over-cut.", "Feel the club drop inside on the way down, so it isn't cutting across the ball."],
    "0R": ["starts straight and curves right", `the club face is open to the way you're swinging - often a swing that comes over the top - a ${bend}.`, "Feel the club drop inside on the way down and swing out to the right of the target."],
    "0L": ["starts straight and curves left", `the club face is closed to the way you're swinging - a ${bend}.`, "Hold the face a touch more open through impact; check the grip."],
    R0: ["starts right and flies straight", "the face and the swing both point right - usually aim or alignment.", "Lay a club on the ground along your toes to check where you're lined up."],
    L0: ["starts left and flies straight", "the face and the swing both point left - usually aim, or the shoulders open.", "Lay a club along your toes and another across your shoulders to check the line."],
  };
  return table[key] ?? null;
}

// Below this many shots a pattern is an early sign, and said as one.
const FIRM = 15;

function missDirection(club, list, period) {
  if (list.length < 8) return null;
  const offs = list.map((s) => s.r.off ?? 0);
  const carry = median(list.map((s) => s.r.carry));
  const mid = median(offs);
  const side = mid > 0 ? 1 : -1;
  const sameSide = offs.filter((o) => o * side > 2).length;
  if (sameSide / offs.length < 0.65 || Math.abs(mid) < Math.max(4, carry * 0.035)) return null;
  const withBall = list.filter((s) => s.b);
  const start = median(withBall.map((s) => s.b.h));
  const curve = median(withBall.map((s) => s.b.ax));
  const pattern = withBall.length >= 5 ? missPattern(start, curve, side) : null;
  const dir = side > 0 ? "right" : "left";
  const early = list.length < FIRM;
  const curves = Math.abs(curve) < 3 ? "fly fairly straight" : `curve ${curve >= 0 ? "right" : "left"}`;
  return {
    id: `miss-${club}-${period}`,
    tone: "work",
    period,
    title: `${Name(club)}: missing ${dir}${early ? " (early signs)" : ""}`,
    text: pattern ? `It ${pattern[0]}: ${pattern[1]} ${pattern[2]}` : `Most of your ${name(club)} shots finish ${dir} of the line.`,
    evidence: `${sameSide} of ${list.length} ${period === "recent" ? "recent " : ""}shots finished ${dir}, ${yds(mid)} typically` +
      (pattern ? `; they start about ${Math.abs(start).toFixed(0)}° ${start >= 0 ? "right" : "left"} of the target and ${curves}.` : ".") +
      measuredMiss(list) +
      (early ? ` Only ${list.length} shots so far - worth watching rather than changing much yet.` : ""),
    practice: `Range: a target at ${Math.round(carry / 10) * 10} yds with the ${name(club)}, ten balls, trying to start each one ${side > 0 ? "left" : "right"} of it.`,
  };
}

// What the Omni measured of the face and path on those shots, when it did:
// " The launch monitor measured the face 4° open to the path, the path 3°
// out-to-in."
function measuredMiss(list) {
  const k = withClub(list, "f", "p");
  if (k.length < CLUB_DATA.min) return "";
  const path = median(k.map((s) => s.k.p));
  const fp = median(k.map((s) => s.k.f - s.k.p));
  return ` The launch monitor measured the face ${faceWords(fp)} the path, and the path ${pathWords(path)}.`;
}

// ---- How a club is struck ---------------------------------------------------

// A bad strike that keeps coming back with one club: at least STRIKE_TIP.share
// of its full swings (and STRIKE_TIP.least of them), from at least
// STRIKE_TIP.min shots. Some thin and fat ones are part of golf; one in
// five of the same kind is a pattern worth working on.
export const STRIKE_TIP = Object.freeze({ min: 10, least: 3, share: 20 });
const STRIKE_WORDS = {
  badhit: {
    what: "bad hits",
    text: "Shots you've called just a bad hit - not the swing you meant. Lots of them with one club usually means it's hard to commit to: a smoother, three-quarter tempo you can repeat beats a hard swing you can't.",
    practice: (c) => `Range: ten balls with the ${c} at three-quarter speed, holding the finish for a count of three each time.`,
  },
  thin: {
    what: "thin",
    text: "A thin strike catches the ball low on the face, with the bottom of the swing at or just before the ball - often from lifting up through it. Keep your chest over the ball and hit down: ball first, then turf.",
    practice: (c) => `Range: a tee pushed in a hand's width behind the ball; miss it and strike the ball first - ten balls with the ${c}.`,
  },
  fat: {
    what: "fat",
    text: "A fat strike hits the ground before the ball: the bottom of the swing is behind it, often from hanging back on the trail foot. Get your weight onto the lead foot before impact.",
    practice: (c) => `Range: a line (a towel's edge, a tee on its side) just in front of the ball; brush the grass on the target side of it with the ${c}, ten balls.`,
  },
  topped: {
    what: "topped",
    text: "A topped shot catches the top half of the ball: usually standing up out of the shot, or the arms pulling in. Keep your height and head level until the ball has gone.",
    practice: (c) => `Range: half swings with the ${c}, holding your posture until the ball's gone, then build up to full.`,
  },
  shank: {
    what: "shanked",
    text: "A shank comes off the hosel: the club moving out towards the ball through impact, often standing too close or the weight going onto the toes.",
    practice: (c) => `Range: a headcover just beyond the ball (on the far side from you); miss it with the ${c}, ten balls.`,
  },
};

function strikeTrouble(club, list, period) {
  if (list.length < STRIKE_TIP.min) return null;
  const c = strikeCounts(list);
  const worst = STRIKES.reduce((a, q) => (c[q] > c[a] ? q : a), STRIKES[0]);
  if (c[worst] < STRIKE_TIP.least || c.pct[worst] < STRIKE_TIP.share) return null;
  const w = STRIKE_WORDS[worst];
  const early = list.length < FIRM;
  const others = STRIKES.filter((q) => q !== worst && c[q] > 0).map((q) => `${c[q]} ${STRIKE_WORDS[q].what}`);
  return {
    id: `strike-${club}-${worst}-${period}`,
    tone: "work",
    period,
    title: `${Name(club)}: ${c.pct[worst]}% ${w.what}${early ? " (early signs)" : ""}`,
    text: w.text,
    evidence: `${c[worst]} of ${c.n} ${period === "recent" ? "recent " : ""}full swings were ${w.what}${others.length ? ` (and ${others.join(", ")})` : ""}; they're left out of its typical carry.` +
      (early ? ` Only ${c.n} shots so far - worth watching rather than changing much yet.` : ""),
    practice: w.practice(name(club)),
  };
}

// ---- Gaps and overlaps ------------------------------------------------------

const WOODS = new Set(["DR", "3W", "5W", "4H"]);

// Neighbouring clubs the player has hit, against the step the bag expects
// between them (scaled to how far they hit): a gap is well over that, an
// overlap is next to nothing. A club they haven't hit isn't a gap - it's
// just not in the chart yet - so the expected step spans it.
function gapping(byClub, factor) {
  const have = CLUB_ORDER.filter((c) => (byClub.get(c) ?? []).length >= 5).map((c) => ({ club: c, carry: median(byClub.get(c).map((s) => s.r.carry)) }));
  const out = [];
  for (let i = 0; i + 1 < have.length; i++) {
    const [a, b] = [have[i], have[i + 1]];
    const diff = a.carry - b.carry;
    const expected = (BAG[a.club].carry - BAG[b.club].carry) * factor;
    if (diff < 4) {
      out.push({
        id: `overlap-${a.club}-${b.club}`,
        tone: "info",
        period: "long",
        title: `${Name(a.club)} and ${name(b.club)} overlap`,
        text: `They go about the same distance, so one of them isn't adding anything. Usually the longer club needs a better strike or more speed - or you only need one of them.`,
        evidence: `Typical carry ${yds(a.carry)} with the ${name(a.club)} and ${yds(b.carry)} with the ${name(b.club)}.`,
        practice: `Range: alternate the two, five balls each, and look at the gapping chart.`,
      });
    } else if (bigGap(a.club, b.club, diff, factor) && have.length >= 6) {
      // Only once they're hitting most of a bag. Nobody should learn a
      // three-quarter driver or wood; a gap there is a club question.
      const wood = WOODS.has(a.club);
      out.push({
        id: `gap-${a.club}-${b.club}`,
        tone: "info",
        period: "long",
        title: `A big gap after the ${name(a.club)}`,
        text: wood
          ? `There's ${yds(diff)} between the ${name(a.club)} and the ${name(b.club)}, more than usual. A club in between (a hybrid or another wood) may be worth trying.`
          : `There's ${yds(diff)} between the ${name(a.club)} and the ${name(b.club)}, more than usual. Learn a three-quarter swing with the ${name(a.club)}, or it may be worth a club to fill it.`,
        evidence: `Typical carry ${yds(a.carry)} and ${yds(b.carry)}; a step of about ${yds(expected)} is usual.`,
        practice: `Range: target practice at ${Math.round((a.carry + b.carry) / 20) * 10} yds, trying both clubs.`,
      });
    }
  }
  return out;
}

// ---- The driver's launch window ---------------------------------------------

function driverWindow(list) {
  const withBall = list.filter((s) => s.b);
  if (withBall.length < 8) return [];
  // Spin from the drives whose spin was measured, not estimated.
  const spun = withBall.filter((s) => !s.es);
  const spin = spun.length >= 8 ? median(spun.map((s) => s.b.sp)) : NaN;
  const launch = median(withBall.map((s) => s.b.v));
  const out = [];
  const note = (id, title, text, evidence, practice) => out.push({ id, tone: "work", period: "long", title, text, evidence, practice });
  const practice = "Range: driver, tee it up, ten balls - watch the launch and spin numbers after each.";
  if (spin > 3300) {
    note("driver-spin-high", "Driver spin is high", "Too much backspin makes the ball balloon and cost distance. It usually comes from hitting down on it or a glancing blow: tee it higher, ball off the front foot, and feel you hit up.", `Typical ${Math.round(spin)} rpm; most good drives are 2,000 - 3,000.`, practice);
  } else if (spin < 1800) {
    note("driver-spin-low", "Driver spin is low", "Very low spin makes the ball fall out of the air and wander. A little more loft, or a strike nearer the middle of the face, helps.", `Typical ${Math.round(spin)} rpm; most good drives are 2,000 - 3,000.`, practice);
  }
  if (launch < 9) {
    note("driver-launch-low", "Driver launches low", "A low launch loses carry. Tee it higher and play it further forward, so you catch it on the way up.", `Typical launch ${launch.toFixed(1)}°; about 11 - 16° suits most swings.`, practice);
  } else if (launch > 18) {
    note("driver-launch-high", "Driver launches high", "A very high launch costs distance into the wind and on landing. Check the ball isn't too far forward and the hands lead at impact.", `Typical launch ${launch.toFixed(1)}°; about 11 - 16° suits most swings.`, practice);
  }
  return out;
}

// ---- How the club met the ball (the Omni's club data) --------------------------

// The Omni measures the club as well as the ball: its path, the face, the
// attack angle and the loft at impact. Where the notes above read the face
// and path from the ball's start and curve, these use what was measured.
//   min      shots with the number before it's judged
//   attack   driver: hitting down by more than this (degrees) is a note
//   path     a path further across the ball than this either way
//   facePath a face open or closed to the path by more than this
//   loft     irons: dynamic loft this far over a usual strike's (flipping)
//   toe      a strike this far (mm) towards the toe or heel, typically
export const CLUB_DATA = Object.freeze({ min: 8, attack: -1, path: 4, facePath: 3, loft: 6, toe: 8 });
const withClub = (list, ...keys) => list.filter((s) => keys.every((k) => Number.isFinite(s.k?.[k])));
const deg = (v) => `${Math.abs(v).toFixed(1)}°`;
const faceWords = (fp) => (Math.abs(fp) < 1 ? "square to" : `${deg(fp)} ${fp > 0 ? "open" : "closed"} to`);
const pathWords = (p) => (Math.abs(p) < 1 ? "straight down the line" : `${deg(p)} ${p > 0 ? "in-to-out" : "out-to-in"}`);
// A usual strike's dynamic loft for a club: about its launch over 0.77,
// with the hands a little ahead of the ball.
export const usualLoft = (club) => BAG[club].vla * 1.3;

// The driver hit down on: it costs carry and adds spin; up on it is longer.
function driverAttack(list) {
  const k = withClub(list, "a");
  if (k.length < CLUB_DATA.min) return null;
  const attack = median(k.map((s) => s.k.a));
  if (attack >= CLUB_DATA.attack) return null;
  const spin = median(k.filter((s) => s.b && !s.es).map((s) => s.b.sp));
  return {
    id: "driver-attack",
    tone: "work",
    period: "long",
    title: "Driver: hitting down on it",
    text: "With a driver off a tee you want to catch the ball on the way up. Hitting down on it adds spin and costs carry - most longer hitters swing up on it by a few degrees.",
    evidence: `Typical attack angle ${deg(attack)} down over ${k.length} drives${Number.isFinite(spin) ? `, with ${rpm(spin)} rpm of spin` : ""}; 0 to 5° up suits most swings.`,
    practice: "Range: driver, tee it so half the ball is above the top of the face, ball inside the front heel, and tilt the spine away from the target at address - ten balls, watching the attack angle.",
  };
}

// The path across the ball, over the woods and irons: out-to-in is the
// slicer's swing (over the top), well in-to-out the hooker's.
const FULL_CLUBS = ["DR", "3W", "5W", "4H", "4I", "5I", "6I", "7I", "8I", "9I"];
function clubPath(byClub) {
  const k = withClub(FULL_CLUBS.flatMap((c) => byClub.get(c) ?? []), "p", "f");
  if (k.length < CLUB_DATA.min * 2) return [];
  const path = median(k.map((s) => s.k.p));
  const fp = median(k.map((s) => s.k.f - s.k.p));
  const out = [];
  const base = `over ${k.length} full swings with the woods and irons`;
  if (Math.abs(path) >= CLUB_DATA.path) {
    const across = path < 0;
    out.push({
      id: "club-path",
      tone: "work",
      period: "long",
      title: across ? "Swinging out-to-in (across the ball)" : "Swinging a long way in-to-out",
      text: across
        ? "The club comes across the ball from outside the line - the swing behind most slices and pulls. The face has to stay open to it or the ball goes left; either way it's a glancing blow that costs distance."
        : "The club swings well out to the right through the ball. A little in-to-out draws it; this much pushes it right, or hooks it when the face closes.",
      evidence: `Typical path ${pathWords(path)} ${base}, with the face ${faceWords(fp)} it; within 2° either way is a neutral swing.`,
      practice: across
        ? "Range: a head cover just outside the ball and a little behind it - swing without hitting it, so the club comes from the inside. Ten balls, watching the path number."
        : "Range: an alignment stick on the ground along the target line - feel the club swing left of it after impact. Ten balls, watching the path number.",
    });
  }
  if (Math.abs(fp) >= CLUB_DATA.facePath) {
    const open = fp > 0;
    out.push({
      id: "face-to-path",
      tone: "work",
      period: "long",
      title: `The face is ${open ? "open" : "closed"} to the path`,
      text: open
        ? "The face points right of where the club is swinging at impact, so the ball curves right - a fade, or a slice when there's more. It's the face against the path that curves it, not the path alone."
        : "The face points left of where the club is swinging at impact, so the ball curves left - a draw, or a hook when there's more. It's the face against the path that curves it, not the path alone.",
      evidence: `Typical face ${faceWords(fp)} the path ${base}, the path ${pathWords(path)}; within 2° either way flies fairly straight.`,
      practice: open
        ? "Range: a slightly stronger grip (two knuckles showing on the lead hand), and feel the forearms turn over through the ball - ten balls, watching face to path."
        : "Range: a slightly weaker grip, and feel the chest keep turning through the ball so the hands don't flip over - ten balls, watching face to path.",
    });
  }
  return out;
}

// Irons with much more loft at impact than a solid strike has: the hands
// behind the ball (a flip or scoop), which launches it high and short.
function ironLoft(byClub) {
  const high = [];
  for (const club of IRONS) {
    const k = withClub(byClub.get(club) ?? [], "l");
    if (k.length < CLUB_DATA.min) continue;
    const loft = median(k.map((s) => s.k.l));
    if (loft >= usualLoft(club) + CLUB_DATA.loft) high.push({ club, n: k.length, loft, over: loft - usualLoft(club) });
  }
  if (!(high.length >= 2 || high.some((h) => h.n >= IRON_SPIN.firm))) return null;
  const top = high.reduce((a, h) => (h.over > a.over ? h : a));
  const others = high.filter((h) => h !== top).map((h) => name(h.club));
  return {
    id: "iron-loft",
    tone: "work",
    period: "long",
    title: "Irons: adding loft at impact",
    text: "Your irons meet the ball with more loft than a solid strike, which usually means the hands are behind the ball at impact - flipping or scooping it up. It launches the ball high and spinning, short of where the club should go.",
    evidence: `${Name(top.club)}: ${top.loft.toFixed(0)}° of loft at impact, where about ${usualLoft(top.club).toFixed(0)}° is usual${others.length ? ` (the ${others.join(" and ")} too)` : ""}.`,
    practice: `Range: ten ${name(top.club)} shots with the hands ahead of the ball at impact - a towel a foot behind it, missed each time - watching the loft number come down.`,
  };
}

// Struck towards the toe or the heel, time after time with one club:
// shorter and off line, and a heel strike is a shank's near miss. From
// every full swing judged, not only the good ones.
function strikeSpot(shots) {
  const off = [];
  for (const club of FULL_CLUBS.concat(["PW", "AW", "GW", "SW", "LW"])) {
    const k = withClub(shots.filter((s) => s.c === club && rated(s)), "ih");
    if (k.length < CLUB_DATA.min + 2) continue;
    const ih = median(k.map((s) => s.k.ih));
    if (Math.abs(ih) >= CLUB_DATA.toe) off.push({ club, ih, n: k.length });
  }
  if (!off.length) return null;
  const top = off.reduce((a, o) => (Math.abs(o.ih) > Math.abs(a.ih) ? o : a));
  const toe = top.ih > 0;
  const same = off.filter((o) => o !== top && o.ih > 0 === toe).map((o) => name(o.club));
  return {
    id: `strike-${toe ? "toe" : "heel"}`,
    tone: "work",
    period: "long",
    title: `${Name(top.club)}: struck towards the ${toe ? "toe" : "heel"}`,
    text: toe
      ? "Most strikes are out towards the toe, which loses ball speed and twists the face open. Usually standing too far from the ball, or the arms pulling in through impact."
      : "Most strikes are in towards the heel, which loses ball speed - and the heel is next to the hosel, where a shank comes from. Usually standing too close, or the weight going onto the toes.",
    evidence: `Typically ${Math.round(Math.abs(top.ih))} mm ${toe ? "towards the toe" : "towards the heel"} over ${top.n} shots${same.length ? ` (the ${same.join(" and ")} too)` : ""}; within about 5 mm of the middle is a good strike.`,
    practice: toe
      ? `Range: a tee in the ground just outside the ball - hit the ball without touching it, ten ${name(top.club)} shots, watching where on the face each one is struck.`
      : `Range: a tee in the ground just inside the ball (towards you) - hit the ball without touching it, ten ${name(top.club)} shots, watching where on the face each one is struck.`,
  };
}

// ---- The putter at impact (the Omni's club data on putts) --------------------

// The face at impact sends a putt where it starts: a degree open starts it
// two inches right of the hole from 10 ft, half the cup. Over the latest
// putts with the putter's numbers:
//   min      putts with the face measured
//   look     the latest this many
//   face     typically open or closed by this much or more (degrees)
//   spread   the middle half of the faces this wide or more: not repeating
export const PUTTER = Object.freeze({ min: 15, look: 80, face: 1, spread: 2 });
// Inches off line at a distance (feet) for a face angle (degrees).
const inchesOff = (face, feet) => Math.abs(Math.tan((face * Math.PI) / 180) * feet * 12);
function putterFace(shots) {
  const putts = withClub(shots.filter((s) => s.sw === "putt"), "f").slice(-PUTTER.look);
  if (putts.length < PUTTER.min) return null;
  const faces = putts.map((s) => s.k.f);
  const face = median(faces);
  const spread = quantile(faces, 0.75) - quantile(faces, 0.25);
  const paths = withClub(putts, "p").map((s) => s.k.p);
  const path = paths.length >= PUTTER.min ? median(paths) : NaN;
  const pathNote = Number.isFinite(path) && Math.abs(path) >= 2 ? ` The putter's path is ${pathWords(path)} - the face matters far more, but a path across the ball adds a little sidespin.` : "";
  if (Math.abs(face) >= PUTTER.face) {
    const open = face > 0;
    return {
      id: "putter-face",
      tone: "work",
      period: "recent",
      title: `Putter face ${open ? "open" : "closed"} at impact`,
      text: `The face decides where a putt starts - far more than the stroke's path. Yours is typically ${deg(face)} ${open ? "open" : "closed"}, which starts a putt ${open ? "right" : "left"} of where you aimed: from 10 ft that's ${inchesOff(face, 10).toFixed(1)} inches, and the cup is only 2 inches either side of the middle.${pathNote}`,
      evidence: `Typical face ${deg(face)} ${open ? "open" : "closed"} over your latest ${putts.length} putts with the putter measured; good putters are within about half a degree.`,
      practice: `Putting green: a gate of two tees just wider than the ball, a foot in front of it on a straight 6 ft putt - ten putts through the gate without touching it, watching the face number.`,
    };
  }
  if (spread >= PUTTER.spread) {
    return {
      id: "putter-face-spread",
      tone: "work",
      period: "recent",
      title: "Putter face: square on average, but not every time",
      text: `Your putter face averages out square, but from one putt to the next it's open or closed by a degree or more - so the start line wanders. A quieter stroke, with the wrists out of it, repeats better.${pathNote}`,
      evidence: `The middle half of your latest ${putts.length} putts' faces span ${spread.toFixed(1)}°; within about a degree repeats well.`,
      practice: "Putting green: ten 4 ft putts with a club shaft under the arms across the chest - shoulders rock, wrists stay out - watching the face number stay near 0.",
    };
  }
  return null;
}

// ---- What the player felt against what was measured -----------------------------

// A shot note's tags ("felt thin", "pulled it": sim/shotnotes.mjs) set
// against the numbers: the strike worked out from them (the player's own
// say aside), and where the ball started and curved. Players often feel a
// thin one as fat, or a push as a pull - knowing which helps practice.
//   min   notes that can be checked, before it's judged
//   off   the share that disagree, from which it's said
//   start degrees of start line that count as a pull or a push
//   curve degrees of spin axis that count as a draw or a fade
export const FEEL = Object.freeze({ min: 6, off: 0.4, start: 1.5, curve: 3 });
const FELT_STRIKE = { thin: "thin", skull: "thin", fat: "fat", heavy: "fat", chunk: "fat", top: "topped", shank: "shank", flush: "good", pured: "good", clean: "good" };
const STRIKE_WORD = { thin: "thin", fat: "fat", topped: "topped", shank: "a shank", good: "a good strike" };
// What a tag says of the start (-1 left, +1 right) or the curve.
const FELT_START = { pull: -1, push: 1, block: 1 };
const FELT_CURVE = { hook: -1, draw: -1, slice: 1, fade: 1 };

// Each checkable tag on a shot, and whether the numbers agree:
// [{ tag, felt, measured, agrees }].
export function feelChecks(s) {
  const tags = tagsOf(s);
  const out = [];
  for (const tag of tags) {
    if (FELT_STRIKE[tag] && s.sw === "full" && s.st !== undefined) {
      // The strike as the numbers had it: the worked-out one, not one the
      // player has since said.
      const measured = s.st ?? "good";
      out.push({ tag, felt: FELT_STRIKE[tag], measured, agrees: FELT_STRIKE[tag] === measured });
    }
    if (FELT_START[tag] && Number.isFinite(s.b?.h)) {
      const m = s.b.h >= FEEL.start ? 1 : s.b.h <= -FEEL.start ? -1 : 0;
      out.push({ tag, felt: FELT_START[tag], measured: m, agrees: m === FELT_START[tag] });
    }
    if (FELT_CURVE[tag] && Number.isFinite(s.b?.ax)) {
      const m = s.b.ax >= FEEL.curve ? 1 : s.b.ax <= -FEEL.curve ? -1 : 0;
      out.push({ tag, felt: FELT_CURVE[tag], measured: m, agrees: m === FELT_CURVE[tag] });
    }
  }
  return out;
}

const sideWord = (v, left, right) => (v < 0 ? left : v > 0 ? right : "straight");
function feelVsNumbers(shots) {
  const checks = shots.flatMap((s) => feelChecks(s).map((c) => ({ ...c, club: s.c })));
  if (checks.length < FEEL.min) return null;
  const off = checks.filter((c) => !c.agrees);
  const share = off.length / checks.length;
  // The commonest disagreement, in words.
  const words = (c) =>
    FELT_STRIKE[c.tag]
      ? `you said ${c.tag}, the numbers say ${STRIKE_WORD[c.measured] ?? c.measured}`
      : FELT_START[c.tag]
        ? `you said ${c.tag}, it started ${sideWord(c.measured, "left", "right")}`
        : `you said ${c.tag}, it curved ${c.measured < 0 ? "left" : c.measured > 0 ? "right" : "hardly at all"}`;
  const tally = new Map();
  for (const c of off) tally.set(words(c), (tally.get(words(c)) ?? 0) + 1);
  const top = [...tally].sort((a, b) => b[1] - a[1])[0];
  if (share < FEEL.off) {
    if (checks.length < FEEL.min * 2 || share > 0.15) return null;
    return {
      id: "feel-good",
      tone: "good",
      period: "long",
      title: "Your feel matches the numbers",
      text: "What you say about a shot - the strike, the start, the curve - agrees with what was measured almost every time. Trust it on the course.",
      evidence: `${checks.length - off.length} of ${checks.length} things you've said in shot notes agree with the numbers.`,
      practice: "Keep saying a word or two after the odd shot (\"shot note, pulled it\"): it keeps your feel honest.",
    };
  }
  return {
    id: "feel-off",
    tone: "work",
    period: "long",
    title: "Your feel and the numbers disagree",
    text: "What you say about a shot often isn't what was measured. Feel is what you take onto the course, so it's worth training: guess the strike and the start before you look, then check.",
    evidence: `${off.length} of ${checks.length} things you've said in shot notes disagree with the numbers - most often ${top[0]} (${top[1]} time${top[1] === 1 ? "" : "s"}).`,
    practice: "Range: ten balls, and before looking at the screen say the strike and where it started (\"shot note, thin, pushed it\"). See how many you get right, and do it again next time.",
  };
}

// ---- Wind on the course -------------------------------------------------------------

// Course shots keep how much of the wind was into them (air.hw, mph). Set
// against each club's usual carry in still air: how much the wind takes
// off into it and adds down it - and whether the swing changes into it
// (harder: more ball speed and spin, the ball climbing into the wind).
//   strong  mph into or behind that counts
//   min     shots each way before it's said
//   harder  ball speed this share up into the wind (with spin up by
//           spinUp): swinging harder
export const WIND_PLAY = Object.freeze({ strong: 5, min: 6, harder: 0.03, spinUp: 0.08 });
function windPlay(shots, byClub) {
  const usual = new Map();
  for (const [club, list] of byClub) {
    const still = list.filter((s) => !(Math.abs(s.air?.hw ?? 0) >= 1));
    if (still.length >= 5) usual.set(club, { carry: median(still.map((s) => s.r.carry)), speed: median(still.filter((s) => s.b?.s).map((s) => s.b.s)), spin: median(still.filter((s) => s.b?.sp && !s.es).map((s) => s.b.sp)) });
  }
  const windy = shots.filter((s) => s.sw === "full" && Number.isFinite(s.air?.hw) && usual.has(s.c) && s.r && Number.isFinite(s.r.carry) && (s.st ?? "good") === "good" && !s.odd);
  const side = (into) => windy.filter((s) => (into ? s.air.hw >= WIND_PLAY.strong : s.air.hw <= -WIND_PLAY.strong));
  const into = side(true);
  const down = side(false);
  const carryRatio = (list) => median(list.map((s) => s.r.carry / usual.get(s.c).carry));
  const out = [];
  const pct = (v) => `${Math.round(Math.abs(v - 1) * 100)}%`;
  const mph = (list) => Math.round(median(list.map((s) => Math.abs(s.air.hw))));
  const parts = [];
  if (into.length >= WIND_PLAY.min) parts.push(`into the wind (about ${mph(into)} mph) your carries are ${pct(carryRatio(into))} shorter than your usual, over ${into.length} shots`);
  if (down.length >= WIND_PLAY.min) parts.push(`downwind (about ${mph(down)} mph) ${pct(carryRatio(down))} longer, over ${down.length} shots`);
  if (parts.length) {
    out.push({
      id: "wind-carry",
      tone: "info",
      period: "long",
      title: "What the wind does to your carries",
      text: `On the course, ${parts.join("; ")}. Worth knowing when you pick a club.`,
      evidence: "Good strikes with the same clubs, against each club's usual carry in still air.",
      practice: "Course: before a shot into or down the wind, pick the club from these numbers, not the yardage alone.",
    });
  }
  if (into.length >= WIND_PLAY.min) {
    const speed = median(into.filter((s) => s.b?.s && usual.get(s.c).speed).map((s) => s.b.s / usual.get(s.c).speed));
    const spin = median(into.filter((s) => s.b?.sp && !s.es && usual.get(s.c).spin).map((s) => s.b.sp / usual.get(s.c).spin));
    if (speed >= 1 + WIND_PLAY.harder && spin >= 1 + WIND_PLAY.spinUp) {
      out.push({
        id: "wind-harder",
        tone: "work",
        period: "long",
        title: "Swinging harder into the wind",
        text: "Into the wind your ball speed and spin go up - you're swinging harder. Extra spin makes the ball climb and the wind takes even more off it. \"When it's breezy, swing easy\": take more club and swing smoothly.",
        evidence: `Into the wind: ball speed ${pct(speed)} and spin ${pct(spin)} above the same clubs' usual.`,
        practice: "Range, with the wind set into you: ten balls with one club more than the yardage, at three-quarter pace, watching the spin stay down.",
      });
    }
  }
  return out;
}

// ---- How high it flies and how steeply it lands ------------------------------

// Each shot keeps its apex and the angle it came down at. Set against a
// solid strike's flight at the player's own ball speed - the club's usual
// launch and spin per mph of it - so a slower swing isn't faulted for
// flying lower: what's left is the launch and spin.
//   min      a club's good strikes with the flight kept, before it's judged
//   balloon  apex over carry this many times a solid strike's ...
//   steeper  ... and landing this many degrees steeper: ballooning
//   flat     landing this many degrees shallower than a solid strike's
//   firm     one club with this many shots is enough; else two clubs
export const FLIGHT_SHAPE = Object.freeze({ min: 10, balloon: 1.35, steeper: 5, flat: 8, firm: 20 });
const usualFlights = new Map();
// A solid strike's { ratio: apex / carry, desc } for a club at a ball speed.
export function usualFlight(club, speed) {
  const s = Math.round(speed / 2) * 2;
  const key = `${club}:${s}`;
  if (!usualFlights.has(key)) {
    const b = BAG[club];
    const r = simulateShot({ speedMph: s, vla: b.vla, hla: 0, totalSpin: (b.spin / b.speed) * s, spinAxis: 0 });
    usualFlights.set(key, { ratio: r.carry > 1 ? r.apex / r.carry : NaN, desc: r.descentAngle });
  }
  return usualFlights.get(key);
}
const withFlight = (list) => list.filter((s) => s.b?.s > 30 && Number.isFinite(s.r.apex) && Number.isFinite(s.r.desc) && s.r.carry > 20);
function flightOf(club, list) {
  const k = withFlight(list);
  if (k.length < FLIGHT_SHAPE.min) return null;
  const usual = usualFlight(club, median(k.map((s) => s.b.s)));
  return {
    club,
    n: k.length,
    ratio: median(k.map((s) => s.r.apex / s.r.carry)),
    apex: median(k.map((s) => s.r.apex)),
    desc: median(k.map((s) => s.r.desc)),
    usual,
  };
}
const enough = (found) => found.length >= 2 || found.some((f) => f.n >= FLIGHT_SHAPE.firm);

// Ballooning: up too high for the distance and dropping steeply - the
// woods and long irons lose carry, and the wind takes them.
function ballooning(byClub) {
  const found = [];
  for (const club of ["DR", "3W", "5W", "4H", "4I", "5I", "6I", "7I"]) {
    const f = flightOf(club, byClub.get(club) ?? []);
    if (f && f.ratio >= f.usual.ratio * FLIGHT_SHAPE.balloon && f.desc >= f.usual.desc + FLIGHT_SHAPE.steeper) found.push(f);
  }
  if (!enough(found)) return null;
  const top = found.reduce((a, f) => (f.ratio / f.usual.ratio > a.ratio / a.usual.ratio ? f : a));
  const others = found.filter((f) => f !== top).map((f) => name(f.club));
  return {
    id: "ballooning",
    tone: "work",
    period: "long",
    title: "The ball balloons: up high, down steep",
    text: "Your longer clubs climb higher than a solid strike's at your speed and drop almost straight down, which costs carry and roll - and into the wind it's worse. It comes from too much spin or launch: a strike low on the face, the club cutting across the ball, or hitting down too much with the woods.",
    evidence: `${Name(top.club)}: up ${Math.round(top.apex)} yds and down at ${Math.round(top.desc)}°, where about ${Math.round(top.usual.desc)}° and a peak ${Math.round(top.usual.ratio * 100)}% of the carry is usual at that speed (it's ${Math.round(top.ratio * 100)}%)${others.length ? `; the ${others.join(" and ")} too` : ""}.`,
    practice: `Range: ten ${name(top.club)} shots trying to hit it lower - ball a touch further back, a shorter follow-through - watching the peak height come down and the carry go up.`,
  };
}

// Coming in flat: an iron that lands shallow runs on through the green
// instead of stopping by the flag.
function flatLanding(byClub) {
  const found = [];
  for (const club of ["6I", "7I", "8I", "9I", "PW"]) {
    const f = flightOf(club, byClub.get(club) ?? []);
    if (f && f.desc <= f.usual.desc - FLIGHT_SHAPE.flat) found.push(f);
  }
  if (!enough(found)) return null;
  const top = found.reduce((a, f) => (f.usual.desc - f.desc > a.usual.desc - a.desc ? f : a));
  const others = found.filter((f) => f !== top).map((f) => name(f.club));
  return {
    id: "flat-landing",
    tone: "work",
    period: "long",
    title: "Irons come in flat",
    text: "Your irons land at a shallower angle than a solid strike's at your speed, so they run on rather than stopping by the flag - you'll find yourself at the back of greens. Usually too little spin or launch: the ball too far back, or a strike low on the face.",
    evidence: `${Name(top.club)}: down at ${Math.round(top.desc)}°, where about ${Math.round(top.usual.desc)}° is usual at your speed${others.length ? ` (the ${others.join(" and ")} too)` : ""}; about 45° or more holds a green.`,
    practice: `Range: ten ${name(top.club)} shots with the ball in the middle of the stance, feeling the club brush the grass just after the ball - watching the landing angle.`,
  };
}

// ---- Approaches against their target ----------------------------------------

// Shots hit while checking the Omni (m "calibration") are deliberate
// mishits, not approaches: left out, as counts() leaves them out elsewhere.
// So are special shots (sw "special": a punch under a tree comes up short
// on purpose) and ones still asked about (asking) - either might be.
function approaches(shots, period) {
  const list = shots.filter((s) => s.m !== "calibration" && (s.sw === "full" || s.sw === "partial") && !asking(s) && s.tg && s.tg.d >= 50 && s.tg.d <= 230 && Number.isFinite(s.tg.long));
  if (list.length < 8) return null;
  const longs = list.map((s) => s.tg.long);
  const short = longs.filter((l) => l < -2).length;
  const mid = median(longs);
  if (short / list.length < 0.65 || mid > -4) return null;
  return {
    id: `approach-short-${period}`,
    tone: "work",
    period,
    title: "Approaches mostly come up short",
    text: "The most common miss in golf: picking the club for a perfect strike. Take the club that gets there with your usual shot, not your best one - often one more.",
    evidence: `${short} of ${list.length} shots at a target finished short, ${yds(mid)} typically.`,
    practice: "Range: target practice at a random distance, or an approach ladder in Challenges - aim to finish past the flag.",
  };
}

// ---- Putting pace -----------------------------------------------------------

// The same distance bands as the stats page's putting table.

function puttingPace(shots, period) {
  const out = [];
  for (const [lo, hi, label] of PUTT_BANDS) {
    const missed = shots.filter((s) => s.sw === "putt" && s.tg && !s.tg.made && Number.isFinite(s.tg.long) && s.tg.d * 3 >= lo && s.tg.d * 3 < hi);
    if (missed.length < 6) continue;
    const short = missed.filter((s) => s.tg.long < 0).length;
    const past = median(missed.map((s) => s.tg.long * 3));
    // A distance the putting challenge offers, in the middle of the band.
    const practiceAt = Math.round(Math.min(40, (lo + Math.min(hi, 40)) / 2) / 5) * 5;
    if (short / missed.length >= 0.65) {
      out.push({
        id: `putt-short-${lo}-${period}`,
        tone: "work",
        period,
        title: `Putts from ${label.toLowerCase()} are coming up short`,
        text: "A putt that stops short never had a chance. Aim to finish about 18 inches past the hole.",
        evidence: `${short} of ${missed.length} misses were short, by ${Math.abs(past).toFixed(1)} ft typically.`,
        practice: `Putting: the distance challenge at ${practiceAt} ft - it scores finishing just past best.`,
      });
    } else if ((missed.length - short) / missed.length >= 0.65 && past > 2.5) {
      out.push({
        id: `putt-long-${lo}-${period}`,
        tone: "work",
        period,
        title: `Putts from ${label.toLowerCase()} are running well past`,
        text: "Charging it past leaves long return putts. A shorter backswing with the same smooth pace controls it better than hitting softer.",
        evidence: `${missed.length - short} of ${missed.length} misses went past, by ${past.toFixed(1)} ft typically.`,
        practice: `Putting: the distance challenge at ${practiceAt} ft.`,
      });
    }
  }
  return out;
}

// ---- Chipping proximity: getting better or worse ----------------------------

function chippingTrend(recent, older, period) {
  const pick = (list) => list.filter((s) => (s.sw === "chip" || s.sw === "pitch") && s.tg && Number.isFinite(s.tg.f));
  const a = pick(recent);
  const b = pick(older);
  if (a.length < 8 || b.length < 15) return null;
  const now = mean(a.map((s) => s.tg.f * 3));
  const before = mean(b.map((s) => s.tg.f * 3));
  if (now < before * 0.85) {
    return {
      id: `chip-better-${period}`,
      tone: "good",
      period,
      title: "Chipping: better than your usual",
      text: "Your chips are finishing closer than they used to.",
      evidence: `${now.toFixed(1)} ft from the hole on average${period === "recent" ? " lately" : " this session"}, against ${before.toFixed(1)} ft before.`,
      practice: "Chipping: try the challenge at a longer distance.",
    };
  }
  if (now > before * 1.15) {
    return {
      id: `chip-worse-${period}`,
      tone: "work",
      period,
      title: "Chipping: worse than your usual",
      text: "Chips are finishing further away than they used to. Pick a landing spot and commit to it; the roll takes care of itself.",
      evidence: `${now.toFixed(1)} ft from the hole on average${period === "recent" ? " lately" : " this session"}, against ${before.toFixed(1)} ft before.`,
      practice: "Chipping: practice with one club and one landing spot until the carry is repeatable.",
    };
  }
  return null;
}

// ---- A club against its usual -----------------------------------------------

function clubAgainstUsual(club, recent, older, period) {
  if (recent.length < 8 || older.length < 15) return [];
  const out = [];
  const width = (l) => quantile(l.map((s) => s.r.off ?? 0), 0.9) - quantile(l.map((s) => s.r.off ?? 0), 0.1);
  const [wNow, wBefore] = [width(recent), width(older)];
  const [cNow, cBefore] = [median(recent.map((s) => s.r.carry)), median(older.map((s) => s.r.carry))];
  const when = period === "recent" ? "lately" : "this session";
  if (wBefore > 6 && wNow < wBefore * 0.75) {
    out.push({ id: `tighter-${club}-${period}`, tone: "good", period, title: `${Name(club)}: tighter than your usual`, text: `Your ${name(club)} is straighter ${when}.`, evidence: `Left-to-right spread ${yds(wNow)}, against ${yds(wBefore)} before.`, practice: "Keep doing what you're doing - try target practice with it." });
  } else if (wNow > wBefore * 1.3 && wNow - wBefore > 5) {
    out.push({ id: `wider-${club}-${period}`, tone: "work", period, title: `${Name(club)}: wider than your usual`, text: `Your ${name(club)} is spraying more ${when}. Slow down a touch and hold the finish.`, evidence: `Left-to-right spread ${yds(wNow)}, against ${yds(wBefore)} before.`, practice: `Range: ten balls with the ${name(club)} at 80% effort, then build back up.` });
  }
  const d = cNow - cBefore;
  if (Math.abs(d) >= Math.max(5, cBefore * 0.04)) {
    out.push({
      id: `carry-${club}-${period}`,
      tone: d > 0 ? "good" : "work",
      period,
      title: `${Name(club)}: ${d > 0 ? "further" : "shorter"} than your usual`,
      text: d > 0 ? `Your ${name(club)} is carrying further ${when} - worth allowing for when you pick a club.` : `Your ${name(club)} is carrying less far ${when}. A tired swing or a thin strike often does it.`,
      evidence: `Typical carry ${yds(cNow)}, against ${yds(cBefore)} before.`,
      practice: `Range: target practice at ${Math.round(cBefore / 10) * 10} yds with it.`,
    });
  }
  return out;
}

// ---- Irons spinning a lot for their speed -----------------------------------------

// A solid strike spins in step with the ball's speed (the spin loft stays
// the same), so spin per mph of ball speed sets aside how fast someone
// swings. Well over the bag's for the irons: a glancing blow, or loft added
// at impact.
const IRONS = ["4I", "5I", "6I", "7I", "8I", "9I"];
// (A spin the Omni estimated rather than measured says nothing of the
// strike: left out.)
const withNumbers = (list) => list.filter((s) => s.b?.s > 0 && Number.isFinite(s.b.sp) && Number.isFinite(s.b.v) && !s.es);
const spinPerMph = (s) => s.b.sp / s.b.s;
const usualPerMph = (club) => BAG[club].spin / BAG[club].speed;
const rpm = (v) => `${Math.round(v / 100) * 100}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
// min: an iron's shots before it's judged; over: how far above the bag's
// spin per mph counts. Two irons like it, or one with `firm` shots: one
// on its own could be that club's loft.
export const IRON_SPIN = Object.freeze({ min: 10, over: 1.25, firm: 20 });

function ironSpin(byClub) {
  const high = [];
  for (const club of IRONS) {
    const list = withNumbers(byClub.get(club) ?? []);
    if (list.length < IRON_SPIN.min) continue;
    const over = median(list.map(spinPerMph)) / usualPerMph(club);
    if (over >= IRON_SPIN.over) high.push({ club, n: list.length, over, speed: median(list.map((s) => s.b.s)), spin: median(list.map((s) => s.b.sp)) });
  }
  if (!(high.length >= 2 || high.some((h) => h.n >= IRON_SPIN.firm))) return null;
  const top = high.reduce((a, h) => (h.over > a.over ? h : a));
  const others = high.filter((h) => h !== top).map((h) => name(h.club));
  return {
    id: "iron-spin",
    tone: "work",
    period: "long",
    title: "Irons: a lot of spin for the speed",
    text: "Your irons spin more than their ball speed would with a solid strike. That's usually a glancing blow - the swing cutting across the ball with the face open to it - or loft added at impact, with the hands behind the ball. It costs distance and makes the ball climb, more so into the wind.",
    evidence: `${Name(top.club)}: ${rpm(top.spin)} rpm at ${Math.round(top.speed)} mph ball speed, where about ${rpm(usualPerMph(top.club) * top.speed)} is usual at that speed${others.length ? ` (the ${others.join(" and ")} too)` : ""}.`,
    practice: `Range: ten ${name(top.club)} shots with the hands ahead of the ball at impact - a towel a foot behind it, missed each time - watching the spin.`,
  };
}

// ---- Long irons that don't get up -----------------------------------------------

// Launching low with little spin, a long iron comes down flat and runs out
// rather than stopping: getting one up takes more speed than most golfers
// have. A hybrid of the same loft launches higher and lands softer.
const LONG_IRONS = ["4I", "5I"];
// min: shots before it's judged; launch: degrees under the bag's; spin:
// the share of the bag's spin per mph it's at or under.
export const LONG_IRON_LOW = Object.freeze({ min: 8, launch: 2.5, spin: 0.8 });

function longIronsLow(byClub) {
  const low = [];
  for (const club of LONG_IRONS) {
    const list = withNumbers(byClub.get(club) ?? []);
    if (list.length < LONG_IRON_LOW.min) continue;
    const launch = median(list.map((s) => s.b.v));
    const perMph = median(list.map(spinPerMph));
    if (launch <= BAG[club].vla - LONG_IRON_LOW.launch && perMph <= usualPerMph(club) * LONG_IRON_LOW.spin) low.push({ club, launch, spin: median(list.map((s) => s.b.sp)) });
  }
  if (!low.length) return null;
  const clubs = low.map((l) => name(l.club));
  const first = low[0];
  return {
    id: "long-irons-low",
    tone: "info",
    period: "long",
    title: `${clubs.length > 1 ? `The ${clubs.join(" and ")}` : `Your ${clubs[0]}`} ${clubs.length > 1 ? "launch" : "launches"} low with little spin`,
    text: "So the ball comes down flat and runs out instead of stopping - getting a long iron up takes more speed than most golfers have. A hybrid of the same loft launches higher and lands softer: worth trying in its place.",
    evidence: low.map((l) => `${Name(l.club)}: ${l.launch.toFixed(1)}° and ${rpm(l.spin)} rpm, where about ${BAG[l.club].vla}° and ${rpm(BAG[l.club].spin)} rpm is usual`).join("; ") + ".",
    practice: `Range: five ${name(first.club)} shots, then five with a hybrid at the same target - compare how high each launches and where it stops.`,
  };
}

// ---- Tiring late in a session ---------------------------------------------------

// Each club's carry over its typical one, so a session of mixed clubs is on
// one scale; the first few swings are a warm-up and left out. A session's
// last third against the rest: well shorter is tiredness, and tired swings
// groove tired habits.
//   min      full swings that count, before a session is judged
//   warmUp   the first ones left out
//   drop     the share shorter that counts
//   sessions how many of the last `look` long sessions must show it
export const FATIGUE = Object.freeze({ min: 30, warmUp: 5, drop: 0.04, sessions: 2, look: 5 });

function sessionDrops(shots, byClub) {
  const typical = new Map();
  for (const [club, list] of byClub) if (list.length >= 5) typical.set(club, median(list.map((s) => s.r.carry)));
  const bySession = new Map();
  for (const s of shots) {
    if (!counts(s) || !Number.isFinite(s.r?.carry) || !typical.has(s.c) || !s.g?.id) continue;
    if (!bySession.has(s.g.id)) bySession.set(s.g.id, []);
    bySession.get(s.g.id).push(s);
  }
  const out = [];
  for (const list of bySession.values()) {
    if (list.length < FATIGUE.min) continue;
    const scale = list.slice(FATIGUE.warmUp).map((s) => s.r.carry / typical.get(s.c));
    const cut = Math.floor((scale.length * 2) / 3);
    const drop = 1 - mean(scale.slice(cut)) / mean(scale.slice(0, cut));
    out.push({ start: list[0].t, end: list.at(-1).t, n: list.length, drop });
  }
  return out.sort((a, b) => a.end - b.end);
}

function fatigue(shots, byClub, since) {
  const drops = sessionDrops(shots, byClub);
  const pct = (d) => Math.round(d * 100);
  if (since != null) {
    const now = drops.findLast((d) => d.end >= since);
    if (!now || now.drop < FATIGUE.drop) return null;
    return {
      id: "fatigue-session",
      tone: "work",
      period: "session",
      title: "Tiring towards the end",
      text: "The last third of this session carried noticeably less than the rest, with the same clubs - time for a break and a drink, or to stop while the swing is still good.",
      evidence: `The last third carried ${pct(now.drop)}% less than the start (${now.n} full swings).`,
      practice: "Practice: 30-40 balls, each with a purpose, then stop - or five minutes off every 30.",
    };
  }
  const last = drops.slice(-FATIGUE.look);
  const tired = last.filter((d) => d.drop >= FATIGUE.drop);
  if (tired.length < FATIGUE.sessions) return null;
  const typical = median(tired.map((d) => d.drop));
  return {
    id: "fatigue-long",
    tone: "work",
    period: "long",
    title: "Your carry drops off late in long sessions",
    text: "With the same clubs, the end of a long session carries less than the start: tiredness. Tired swings groove tired habits, so stop sooner, or take a break every 30 balls.",
    evidence: `In ${tired.length} of your last ${last.length} sessions of ${FATIGUE.min} or more full swings, the last third carried about ${pct(typical)}% less than the rest - a ${yds(150)} club going about ${yds(150 * (1 - typical))}.`,
    practice: "Practice: 30-40 balls, each with a purpose, then stop - or five minutes off every 30.",
  };
}

// ---- One club less consistent than its neighbours -------------------------------

// The middle 80% of a club's carries, against the clubs either side of it
// (those the player has numbers for, no more than two places away in the
// bag). One club spraying where its neighbours don't is usually set-up with
// that club - the ball position, how far away they stand - or the club.
//   min    shots for a club to be in it
//   times  how many times its neighbours' spread (for its length) it is
//   yds    and at least this many yards wider
export const SPREAD = Object.freeze({ min: 10, times: 1.6, yds: 6 });

function oneClubSpread(byClub) {
  const have = CLUB_ORDER.filter((c) => (byClub.get(c) ?? []).length >= SPREAD.min).map((club) => {
    const carries = byClub.get(club).map((s) => s.r.carry);
    return { club, at: CLUB_ORDER.indexOf(club), carry: median(carries), spread: quantile(carries, 0.9) - quantile(carries, 0.1) };
  });
  const out = [];
  for (let i = 0; i < have.length; i++) {
    const me = have[i];
    const either = [have[i - 1], have[i + 1]].filter((x) => x && Math.abs(x.at - me.at) <= 2);
    if (!either.length) continue;
    const theirs = mean(either.map((x) => x.spread / x.carry));
    const wider = me.spread - mean(either.map((x) => x.spread));
    if (me.spread / me.carry < theirs * SPREAD.times || wider < SPREAD.yds) continue;
    out.push({
      id: `spread-${me.club}`,
      tone: "work",
      period: "long",
      title: `${Name(me.club)}: less consistent than the clubs either side`,
      text: `Its carry varies a lot more than the ${either.map((x) => name(x.club)).join(" and ")}'s. When one club misbehaves and its neighbours don't, it's usually the set-up with that club - the ball too far back or forward, or standing a different distance from it - or the club itself (its loft or lie may be off).`,
      evidence: `The middle 80% of carries: ${name(me.club)} ${yds(me.spread)} wide; ${either.map((x) => `${name(x.club)} ${yds(x.spread)}`).join(", ")}.`,
      practice: `Range: alternate the ${[...either.map((x) => name(x.club)), name(me.club)].join(", ")}, checking the ball position against a club laid on the ground each time.`,
    });
  }
  return out;
}

// ---- Three-putts from a distance on the course ------------------------------------

// Each hole's putts on the course (by its round and number): from long
// range the first putt is about pace, not the line.
//   from   the first putt's length (ft) that counts
//   holes  holes like it before it's judged
//   share  the share taking three putts or more
export const THREE_PUTT = Object.freeze({ from: 20, holes: 10, share: 0.25 });

function threePutts(shots) {
  const holes = new Map();
  for (const s of shots) {
    if (s.sw !== "putt" || s.g?.k !== "course" || !s.g.id || s.g.hole == null) continue;
    const key = `${s.g.id}|${s.g.hole}`;
    if (!holes.has(key)) holes.set(key, []);
    holes.get(key).push(s);
  }
  let long = 0;
  let three = 0;
  for (const list of holes.values()) {
    const first = list.reduce((a, s) => (s.t < a.t ? s : a));
    if (!(first.tg?.d * 3 >= THREE_PUTT.from)) continue;
    long++;
    if (list.length >= 3) three++;
  }
  if (long < THREE_PUTT.holes || three / long < THREE_PUTT.share) return null;
  return {
    id: "three-putts",
    tone: "work",
    period: "long",
    title: `Three-putts from ${THREE_PUTT.from} ft and more`,
    text: "From long range the first putt is about pace, not the line: aim to leave it inside three feet, short or long, and the three-putts go.",
    evidence: `${three} of the ${long} holes where your first putt was from ${THREE_PUTT.from} ft or more took three putts or more.`,
    practice: "Putting: the distance challenge's lag putting (Distance: Lag 30 - 50 ft) - or the practice plan Lag putts 20-45 ft (Menu, Stats).",
  };
}

// ---- Missing greens on one side ---------------------------------------------------

// Approaches on the course that missed the green, by which side of the
// flag's line they finished (tg.side, right +: kept from 4 October 2026).
// Set against the same clubs on the range: straight there, it's the aim
// on the course rather than the swing.
//   min    missed greens with a side before it's judged
//   share  the share on one side
//   yds    how far to one side counts as that side
export const GREEN_SIDE = Object.freeze({ min: 8, share: 0.7, yds: 3 });

function greenSide(shots) {
  const missed = shots.filter(
    (s) => s.m === "course" && (s.sw === "full" || s.sw === "partial") && s.tg?.d >= 50 && s.tg.d <= 230 && Number.isFinite(s.tg.side) && Math.abs(s.tg.side) >= GREEN_SIDE.yds && s.to && s.to !== "green" && s.to !== "cup",
  );
  if (missed.length < GREEN_SIDE.min) return null;
  const right = missed.filter((s) => s.tg.side > 0).length;
  const side = right * 2 >= missed.length ? 1 : -1;
  const n = side > 0 ? right : missed.length - right;
  if (n / missed.length < GREEN_SIDE.share) return null;
  const dir = side > 0 ? "right" : "left";
  const clubs = new Set(missed.map((s) => s.c));
  const range = shots.filter((s) => s.m === "range" && counts(s) && clubs.has(s.c) && Number.isFinite(s.r?.off));
  const onRange = range.length >= 10 ? median(range.map((s) => s.r.off)) : null;
  const straight = onRange != null && Math.abs(onRange) < GREEN_SIDE.yds;
  const same = onRange != null && onRange * side >= GREEN_SIDE.yds;
  return {
    id: `greens-${dir}`,
    tone: "work",
    period: "long",
    title: `Missing greens to the ${dir}`,
    text: straight
      ? `On the range the same clubs fly straight, so it's likely the aim on the course rather than the swing: pick a spot a few feet in front of the ball on the line to the flag, and line the club up with that.`
      : same
        ? `It's the same miss you have on the range with those clubs, so it's the swing - the club notes say what the start line and curve point to. Meanwhile, aim at the ${side > 0 ? "left" : "right"} half of the green.`
        : `Aim at the ${side > 0 ? "left" : "right"} half of the green until it evens out, and check where you're lined up: a club along your toes.`,
    evidence: `${n} of ${missed.length} missed greens from 50-230 yds finished ${dir} of the flag's line.` + (onRange != null ? ` On the range those clubs finish ${Math.abs(onRange) < 1 ? "on the line" : `${yds(onRange)} ${onRange > 0 ? "right" : "left"}`} typically.` : ""),
    practice: `Range: target practice with your alignment checked each shot - a club on the ground along your toes, pointing at the target.`,
  };
}

// ---- Shorter on the course than on the range --------------------------------------

// The same club's good strikes from good, flat lies in still air (counts:
// a windy day's are already out), on the course against the range - by
// ball speed, which neither the ground nor the air changes. Slower on the
// course is the swing: often a tighter, quicker one when the shot counts.
//   course, range  shots of a club needed in each
//   drop           the share slower that counts
//   firm           one club on its own needs this many course shots
export const COURSE_RANGE = Object.freeze({ course: 5, range: 8, drop: 0.03, firm: 10 });

function courseVsRange(byClub) {
  const slow = [];
  for (const club of CLUB_ORDER) {
    const list = byClub.get(club) ?? [];
    const course = list.filter((s) => s.m === "course" && s.b?.s > 0);
    const range = list.filter((s) => s.m === "range" && s.b?.s > 0);
    if (course.length < COURSE_RANGE.course || range.length < COURSE_RANGE.range) continue;
    const speeds = [median(course.map((s) => s.b.s)), median(range.map((s) => s.b.s))];
    const drop = 1 - speeds[0] / speeds[1];
    if (drop >= COURSE_RANGE.drop) slow.push({ club, n: course.length, drop, speeds, carries: [median(course.map((s) => s.r.carry)), median(range.map((s) => s.r.carry))] });
  }
  if (!(slow.length >= 2 || slow.some((x) => x.n >= COURSE_RANGE.firm))) return null;
  const top = slow.reduce((a, x) => (x.drop > a.drop ? x : a));
  const others = slow.filter((x) => x !== top).map((x) => name(x.club));
  return {
    id: "course-short",
    tone: "work",
    period: "long",
    title: "Shorter on the course than on the range",
    text: "The same clubs come off the face slower on the course - from good lies in still air, so it's the swing, not the ground: often a tighter, quicker swing when the shot counts. Allow a club more on the course, and practise like you play - one ball, your full routine and a new target every shot.",
    evidence: `${Name(top.club)}: ${Math.round(top.speeds[0])} mph ball speed on the course, ${Math.round(top.speeds[1])} on the range - a carry of ${yds(top.carries[0])} against ${yds(top.carries[1])}${others.length ? ` (the ${others.join(" and ")} too)` : ""}.`,
    practice: "Range: play a round on the range - a different club and target every shot, with your full routine each time.",
  };
}

// ---- All together -------------------------------------------------------------

// Notes for a player. With `since` (a time, ms), it's about that session:
// the shots since then against everything before. Without, recent is each
// club's last 20 shots (and the last 20 chips) against the rest, and the
// long-term notes look at everything.
// A left-hander (their profile: sim/profiles.mjs): every note is worked out
// on their shots mirrored - the start, the curve, the path, the face, the
// side they finish - so a left-hander's draw (curving right) is read as a
// draw, not a fade, and the swing advice (inside, outside, open, closed)
// holds; then the notes' left and right are turned back the way the ball
// really went.
export function mirrorShot(s) {
  const neg = (v) => (Number.isFinite(v) ? -v : v);
  const out = { ...s };
  if (s.b) out.b = { ...s.b, h: neg(s.b.h), ax: neg(s.b.ax) };
  if (s.r) out.r = { ...s.r, off: neg(s.r.off) };
  if (s.k) out.k = { ...s.k, p: neg(s.k.p), f: neg(s.k.f) };
  if (s.tg) out.tg = { ...s.tg, side: neg(s.tg.side) };
  return out;
}
// Left for right and right for left, where they're a direction - not
// "left out", "get it right" or "what's left".
const SWAP = { left: "right", right: "left", Left: "Right", Right: "Left" };
export const swapSides = (text) => (typeof text === "string" ? text.replace(/(?<!get )(?<!get it )(?<!'s )\b(left|right|Left|Right)\b(?! out)/g, (m) => SWAP[m]) : text);
const swapNote = (n) => Object.fromEntries(Object.entries(n).map(([k, v]) => [k, typeof v === "string" && k !== "id" && k !== "tone" && k !== "period" ? swapSides(v) : v]));

export function insights(shots, { since = null, hand = "right" } = {}) {
  if (hand === "left") return insights(shots.map(mirrorShot), { since }).map(swapNote);
  // A misread (or a reading still in doubt) says nothing about the player.
  shots = live(shots);
  const out = [];
  const session = since != null;
  const period = session ? "session" : "recent";
  const splitAt = (list) => (session ? list.findIndex((s) => s.t >= since) : Math.max(0, list.length - RECENT_SHOTS));
  const split = (list) => {
    let i = splitAt(list);
    if (i < 0) i = list.length;
    return [list.slice(i), list.slice(0, i)];
  };

  const byClub = new Map();
  for (const s of shots) {
    if (!counts(s) || !s.r || !Number.isFinite(s.r.carry)) continue;
    if (!byClub.has(s.c)) byClub.set(s.c, []);
    byClub.get(s.c).push(s);
  }

  for (const club of CLUB_ORDER) {
    const list = byClub.get(club) ?? [];
    if (!list.length) continue;
    const [recent, older] = split(list);
    const miss = missDirection(club, recent, period) ?? (session ? null : missDirection(club, list, "long"));
    if (miss) out.push(miss);
    out.push(...clubAgainstUsual(club, recent, older, period));
  }
  // Thin, fat and topped: from every full swing judged, not just the good
  // strikes the numbers above are made from.
  for (const club of CLUB_ORDER) {
    const list = shots.filter((s) => s.c === club && rated(s));
    if (!list.length) continue;
    const [recent] = split(list);
    const note = strikeTrouble(club, recent, period) ?? (session ? null : strikeTrouble(club, list, "long"));
    if (note) out.push(note);
  }
  if (!session) {
    out.push(...gapping(byClub, profiles(shots).factor));
    out.push(...driverWindow(byClub.get("DR") ?? []));
    out.push(...oneClubSpread(byClub));
    out.push(...clubPath(byClub));
    out.push(...windPlay(shots, byClub));
    const feel = feelVsNumbers(shots);
    if (feel) out.push(feel);
    for (const note of [driverAttack(byClub.get("DR") ?? []), ironSpin(byClub), ballooning(byClub), flatLanding(byClub), ironLoft(byClub), strikeSpot(shots), longIronsLow(byClub), courseVsRange(byClub), greenSide(shots), threePutts(shots)]) if (note) out.push(note);
  }
  // The putter's face: over the latest putts, or this session's.
  const face = putterFace(session ? shots.filter((s) => s.t >= since) : shots);
  if (face) out.push(face);
  const tired = fatigue(shots, byClub, since);
  if (tired) out.push(tired);

  const [recentAll] = split(shots);
  const target = session ? recentAll : shots.slice(-60);
  const appr = approaches(target, session ? "session" : "recent") ?? (session ? null : approaches(shots, "long"));
  if (appr) out.push(appr);
  const pace = puttingPace(session ? recentAll : shots.slice(-80), session ? "session" : "recent");
  out.push(...(pace.length || session ? pace : puttingPace(shots, "long")));

  const chips = shots.filter((s) => s.sw === "chip" || s.sw === "pitch");
  const [cRecent, cOlder] = split(chips);
  const trend = chippingTrend(cRecent, cOlder, period);
  if (trend) out.push(trend);

  // Something to work on first, then good news, then the rest.
  const order = { work: 0, good: 1, info: 2 };
  return out.sort((a, b) => order[a.tone] - order[b.tone]);
}
