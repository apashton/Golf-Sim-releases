// The last two bytes of the Omni's long club message (bytes 17 and 18),
// which GSPro's connector never reads, and a check of what they are.
//
// They turned out to be the Omni's smash factor times 100 - the ball speed
// over the club speed, as its own display shows it. The owner's drivers in
// September 2026 (issue 85) had 126 for a ball at 126.35% of the club's
// speed, 140 for 139.69, 146 for 146.34 and so on, every one within half a
// point; with no club data the bytes are FF-FF. So the check looks for that
// first, against the ball and club speeds A-Squared Golf reads from the Omni's own
// bytes, and says so plainly.
//
// Before that was known the question was whether the Omni sends its own
// carry here, as every other number A-Squared Golf shows matched the Omni's
// screen except carry. That check is kept for anything that isn't a smash
// factor (a later firmware, say): the field is decoded every way that's
// plausible - little-endian signed and unsigned as the other fields are,
// big-endian, and each over 10 and 100 - and each is set against A-Squared Golf's
// carry (yards and metres), the ball speed (mph and m/s) and the carry the
// owner typed in from the Omni's own screen. The verdict says plainly
// whether it looks like a carry.
//
// Pure: the server (the Omni's own smash factor, kept with its club data)
// and the stats share it, and the tests cover it.

import { unhex } from "../omni.js";

const fin = (v) => typeof v === "number" && Number.isFinite(v);
export const YARDS_PER_METRE = 1.0936133;
const MPS_TO_MPH = 2.23694;

// The two bytes from a club message's hex, or null when there are none (the
// short message, no club data, or bytes that aren't a club message):
//   { hex: "34-12", u16: 4660, s16: 4660, be16: 13330 }
export function clubTail(hexClub) {
  const bytes = typeof hexClub === "string" ? unhex(hexClub) : null;
  if (!bytes || bytes.length !== 19 || bytes[0] !== 0x11 || bytes[1] !== 0x07) return null;
  const lo = bytes[17];
  const hi = bytes[18];
  const u16 = lo | (hi << 8);
  const hx = (b) => b.toString(16).toUpperCase().padStart(2, "0");
  return { hex: `${hx(lo)}-${hx(hi)}`, u16, s16: u16 >= 0x8000 ? u16 - 0x10000 : u16, be16: (lo << 8) | hi };
}

// What the Omni sends in the field when it has no club data for a shot.
export const NO_CLUB_TAIL = 0xffff;

// The Omni's smash factor from the field (1.42 for 142), or null when it sent
// none (FF-FF) or there's no field.
export const tailSmash = (tail) => (tail && fin(tail.u16) && tail.u16 !== NO_CLUB_TAIL ? tail.u16 / 100 : null);

// Does club data belong with this ball? The Omni works its smash factor out
// from the ball and club speeds of one shot, so when the ball speed over
// the club speed is far from it, the club data came with another shot (a
// club message after a shot the Omni had no ball speed for, say). Within
// half a point always, from the owner's drives; SMASH_AGREE allows for
// rounding. True when it agrees, or when there's nothing to check.
export const SMASH_AGREE = 0.06;
export function clubFitsBall(ballMph, clubMph, omniSmash) {
  if (!fin(omniSmash) || !fin(ballMph) || !fin(clubMph) || clubMph <= 0) return true;
  return Math.abs(ballMph / clubMph - omniSmash) <= SMASH_AGREE;
}

// The ways of reading it that are tried.
// (Unsigned first: for a positive number the two are the same, and a
// distance is never negative.)
export const TAIL_READS = [
  { id: "u16", text: "unsigned", read: (t) => t.u16 },
  { id: "s16", text: "signed", read: (t) => t.s16 },
  { id: "u16/10", text: "unsigned / 10", read: (t) => t.u16 / 10 },
  { id: "s16/10", text: "signed / 10", read: (t) => t.s16 / 10 },
  { id: "u16/100", text: "unsigned / 100", read: (t) => t.u16 / 100 },
  { id: "s16/100", text: "signed / 100", read: (t) => t.s16 / 100 },
  { id: "be16", text: "big-endian", read: (t) => t.be16 },
  { id: "be16/10", text: "big-endian / 10", read: (t) => t.be16 / 10 },
];

// What it's set against, from one row. unit: said after "to within 1".
export const TAIL_TARGETS = [
  { id: "omni-yds", text: "the Omni's carry (yds)", unit: "yd", carry: true, omni: true, of: (r) => r.omniCarryYds },
  { id: "omni-m", text: "the Omni's carry (m)", unit: "m", carry: true, omni: true, of: (r) => (fin(r.omniCarryYds) ? r.omniCarryYds / YARDS_PER_METRE : null) },
  { id: "gs-yds", text: "A² Golf's carry (yds)", unit: "yd", carry: true, of: (r) => r.gsCarryYds },
  { id: "gs-m", text: "A² Golf's carry (m)", unit: "m", carry: true, of: (r) => (fin(r.gsCarryYds) ? r.gsCarryYds / YARDS_PER_METRE : null) },
  { id: "ball-mph", text: "ball speed (mph)", unit: "mph", of: (r) => r.ballMph },
  { id: "ball-ms", text: "ball speed (m/s)", unit: "m/s", of: (r) => (fin(r.ballMph) ? r.ballMph / MPS_TO_MPH : null) },
];

// Pearson's correlation, or NaN (fewer than 3, or no spread in either).
export function pearson(xs, ys) {
  const n = xs.length;
  if (n < 3 || ys.length !== n) return NaN;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : NaN;
}

const median = (list) => {
  const s = [...list].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : NaN;
};

// The fewest shots for any verdict; with the Omni's carry typed in, the share
// that must match to the yard (or metre) to call it the Omni's carry.
export const TAIL_MIN = 3;
export const MATCH_SHARE = 0.8;
export const MATCH_WITHIN = 1;
// A smash factor: the field within this of 100 x A-Squared Golf's ball mph over
// club mph (the Omni rounds to the whole point, and the speeds A-Squared Golf
// reads are the Omni's own to a hundredth, so half a point is usual).
export const SMASH_WITHIN = 1.5;
// Tracks something closely: a correlation this high and about the same size.
export const TRACK_R = 0.9;
export const SAME_SIZE = [0.8, 1.25];

// rows: [{ id, tail (clubTail), gsCarryYds, ballMph, omniCarryYds, smash }],
// smash being A-Squared Golf's ball mph over club mph from the Omni's bytes.
//   -> { n, state, words, constant, values, best, table, smash }
// state: "few", "smash" (the Omni's smash factor x 100), "constant", "carry"
// (matches the Omni's carry), "likely"
// (follows a carry closely but not to the yard), "tracks" (follows the ball
// speed or a carry-sized number), or "not".
// table: every read against every target with enough shots:
//   { read, target, n, r, within, ratio }.
// smash: { n, within } - the shots with club data and both speeds, and how
// many of them the field matches as a smash factor - or null with too few.
export function tailCheck(rows) {
  const have = (rows ?? []).filter((r) => r && r.tail && fin(r.tail.u16));
  const out = { n: have.length, state: "few", words: "", constant: false, values: have.map((r) => r.tail.s16), best: null, table: [], smash: null };
  if (have.length < TAIL_MIN) {
    out.words = `Only ${have.length} shot${have.length === 1 ? "" : "s"} with the long club message - hit a few more to tell what the last field is.`;
    return out;
  }
  // The smash factor first: it's what the field has always been so far. A
  // shot the Omni sent no club data for (FF-FF) has nothing to say about it.
  const withSmash = have.filter((r) => r.tail.u16 !== NO_CLUB_TAIL && fin(r.smash) && r.smash > 0);
  if (withSmash.length >= TAIL_MIN) {
    const within = withSmash.filter((r) => Math.abs(r.tail.u16 - 100 * r.smash) <= SMASH_WITHIN).length;
    out.smash = { n: withSmash.length, within };
    if (within >= MATCH_SHARE * withSmash.length) {
      out.state = "smash";
      out.words = `It's the Omni's smash factor × 100 (ball speed ÷ club speed): it matches 100 × the ball speed over the club speed to within ${SMASH_WITHIN} on ${within} of ${withSmash.length} shots, so it isn't a carry - the Omni doesn't send its carry.`;
      return out;
    }
  }
  if (have.every((r) => r.tail.u16 === have[0].tail.u16)) {
    out.state = "constant";
    out.constant = true;
    out.words = `The last field is the same on every one of ${have.length} shots (${have[0].tail.hex}, ${have[0].tail.s16}) - it isn't a carry.`;
    return out;
  }
  for (const read of TAIL_READS) {
    for (const target of TAIL_TARGETS) {
      const xs = [];
      const ys = [];
      for (const r of have) {
        const y = target.of(r);
        if (!fin(y)) continue;
        xs.push(read.read(r.tail));
        ys.push(y);
      }
      if (xs.length < TAIL_MIN) continue;
      const within = xs.filter((x, i) => Math.abs(x - ys[i]) <= MATCH_WITHIN).length;
      const ratio = median(xs.map((x, i) => (ys[i] ? x / ys[i] : NaN)).filter(fin));
      out.table.push({ read: read.id, readText: read.text, target: target.id, targetText: target.text, unit: target.unit, carry: !!target.carry, omni: !!target.omni, n: xs.length, r: pearson(xs, ys), within, ratio });
    }
  }
  const r2 = (v) => (fin(v) ? v.toFixed(2) : "-");
  // Most shots matching first; a tie keeps the order above (yards first).
  const byMatch = (list) => [...list].sort((a, b) => b.within / b.n - a.within / a.n);
  const byR = (list) => [...list].filter((x) => fin(x.r)).sort((a, b) => b.r - a.r);
  const sameSize = (x) => fin(x.ratio) && x.ratio >= SAME_SIZE[0] && x.ratio <= SAME_SIZE[1];
  const omni = out.table.filter((x) => x.omni);
  // With the Omni's own carry typed in, the question is answered directly.
  if (omni.length) {
    const best = byMatch(omni)[0];
    out.best = best;
    if (best.within >= TAIL_MIN && best.within >= MATCH_SHARE * best.n) {
      out.state = "carry";
      out.words = `It looks like the Omni's carry: read ${best.readText}, it matches the Omni carry to within ${MATCH_WITHIN} ${best.unit} on ${best.within} of ${best.n} shots.`;
      return out;
    }
    const close = byR(omni).find((x) => x.r >= TRACK_R && sameSize(x));
    if (close) {
      out.state = "likely";
      out.best = close;
      out.words = `It follows the Omni carry closely (read ${close.readText}, r ${r2(close.r)} over ${close.n} shots) but matches it to within ${MATCH_WITHIN} ${close.unit} on only ${close.within} - maybe a carry worked out another way.`;
      return out;
    }
  }
  const all = byR(out.table.filter((x) => !x.omni));
  const tracking = all.find((x) => x.r >= TRACK_R && sameSize(x));
  const bestR = byR(out.table)[0] ?? null;
  if (tracking) {
    out.state = "tracks";
    out.best = tracking;
    const what = tracking.carry ? "a carry" : "the ball speed";
    out.words = `It follows ${tracking.targetText} closely (read ${tracking.readText}, r ${r2(tracking.r)} over ${tracking.n} shots, about the same size) - it could be ${what}.${omni.length ? "" : " Type in the Omni's own carry for these shots to be sure."}`;
    return out;
  }
  out.state = "not";
  out.best = omni.length ? byMatch(omni)[0] : bestR;
  const omniPart = omni.length ? `it matches the Omni carry to within ${MATCH_WITHIN} ${out.best.unit} on only ${out.best.within} of ${out.best.n} shots, and ` : "";
  out.words = `It doesn't look like a carry: ${omniPart}${bestR ? `the closest it follows anything is r ${r2(bestR.r)} (read ${bestR.readText}, against ${bestR.targetText})` : "it follows nothing"}.${omni.length ? "" : " Typing in the Omni's own carry for these shots would settle it."}`;
  return out;
}
