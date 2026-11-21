// A swing's power - a "mod swing": 50% said before a chip, or after it. The
// player says it ("power on this next shot is fifty percent", "last shot
// fifty percent", Shift + E, the chipping panel's buttons) and the shot is
// kept with it (pw, 10 - 100 in fives), so My stats can say how far each
// club goes at each power ("Sand wedge at 50%: 22 yds").
//
// What a power makes of the swing (powerSwing):
//   - under 100%: a full swing, part swing or special shot is a part swing
//     at that power - out of the club's full-swing numbers, never
//     questioned, as part swings already are;
//   - a chip or pitch stays one, with its power: it still counts in how
//     close the chipping green's chips finish, and in its tips;
//   - 100% (a full swing): a part swing or special shot said to be full is
//     a full swing after all; a chip or pitch keeps it as its power;
//   - a putt is a putt.
//
// Pure, and imports nothing, so the swing rules (shotstats.mjs) and the
// mod-swing prompt (modswing.mjs) can both use it.

export const POWER = Object.freeze({ min: 10, max: 100, step: 5 });
// The powers the card, Shift + E and the chipping panel offer.
export const POWER_CHOICES = [25, 50, 75, 100];

// A power as the stats keep it (10 - 100 in fives), or null.
export function cleanPower(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < POWER.min || n > POWER.max || n % POWER.step) return null;
  return n;
}

// "50%", or "Full" for 100.
export const powerName = (pw) => (pw === 100 ? "Full" : `${pw}%`);
// "a 50%" / "a full" swing, for a sentence.
export const powerWords = (pw) => (pw === 100 ? "full" : `${pw}%`);

// Shift + E: off -> 25% -> 50% -> 75% -> full -> off.
export function nextPower(current) {
  const i = POWER_CHOICES.indexOf(current);
  return i < 0 ? POWER_CHOICES[0] : (POWER_CHOICES[i + 1] ?? null);
}

// The swing a shot is read as at a power, from the one it would otherwise
// be (the top of this file).
export function powerSwing(base, pw) {
  if (pw == null || base === "putt" || base === "chip" || base === "pitch") return base;
  if (pw < 100) return ["full", "partial", "special"].includes(base) ? "partial" : base;
  return base === "partial" || base === "special" ? "full" : base;
}

// The power a shot counts at in the stats by power: a part swing's, or a
// chip's or pitch's (full ones too). A full swing at 100% is just the club's
// full swing, in its normal numbers.
export function powerOf(s) {
  const pw = s?.pw;
  if (!Number.isFinite(pw)) return null;
  return s.sw === "partial" || s.sw === "chip" || s.sw === "pitch" ? pw : null;
}
