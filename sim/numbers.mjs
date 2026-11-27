// Numbers said out loud: a carry ("two hundred and forty one", "two forty
// one" as golfers say a yardage, "two four one" digit by digit, "one forty
// one point five") and a swing's power
// ("fifty", "fifty percent", "half", "three quarter swing", "full"). Digits
// as a browser writes them ("241", "50%") read the same.
//
// Pure. The Windows app's grammar lists its number phrases from here
// (carryPhrases, powerPhrases), so every number it can hear, this reads.

const UNIT = { zero: 0, oh: 0, o: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 };
const TEEN = { ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19 };
const TEN = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const UNIT_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const TEEN_WORDS = Object.keys(TEEN);
const TEN_WORDS = Object.keys(TEN);
// "Oh" and "o" are a nought inside a number ("two oh five"), never one on
// its own.
const NOUGHTS = new Set(["oh", "o", "zero"]);

// Under a hundred, in words: 7 -> "seven", 41 -> "forty one".
export function wordsUnder100(n) {
  if (n < 10) return UNIT_WORDS[n];
  if (n < 20) return TEEN_WORDS[n - 10];
  const tens = TEN_WORDS[Math.floor(n / 10) - 2];
  return n % 10 ? `${tens} ${UNIT_WORDS[n % 10]}` : tens;
}

// A whole number from 0 to 999 as it's written out: 241 -> "two hundred and
// forty one" (without "and" with and: false).
export function sayNumber(n, { and = true } = {}) {
  if (n < 100) return wordsUnder100(n);
  const h = `${UNIT_WORDS[Math.floor(n / 100)]} hundred`;
  const r = n % 100;
  return r ? `${h}${and ? " and" : ""} ${wordsUnder100(r)}` : h;
}

// Below a hundred, from the words at i: { value, next } or null.
function under100(tok, i) {
  const w = tok[i];
  if (w == null) return null;
  if (/^\d{1,2}$/.test(w)) return { value: Number(w), next: i + 1 };
  if (w in TEEN) return { value: TEEN[w], next: i + 1 };
  if (w in TEN) {
    const u = tok[i + 1];
    if (u in UNIT && !NOUGHTS.has(u)) return { value: TEN[w] + UNIT[u], next: i + 2 };
    return { value: TEN[w], next: i + 1 };
  }
  if (w in UNIT && !NOUGHTS.has(w)) return { value: UNIT[w], next: i + 1 };
  if (w === "zero") return { value: 0, next: i + 1 };
  return null;
}

const digitOf = (w) => (w in UNIT ? UNIT[w] : /^\d$/.test(w) ? Number(w) : null);

// A whole number from its words (lower case, as sim/voice.mjs's normalise
// leaves them), or null when the words aren't one number. Ambiguous ones
// ("one five": 15, 105 or 1 and 5?) are null rather than a guess.
export function spokenInteger(words) {
  const said = String(words ?? "")
    .trim()
    .split(/\s+/);
  // "Two hundred and..." with nothing after: it was cut short.
  if (said.at(-1) === "and") return null;
  const tok = said.filter((w) => w && w !== "and");
  if (!tok.length) return null;
  // Digits as a browser writes them.
  if (tok.length === 1 && /^\d+$/.test(tok[0])) return Number(tok[0]);
  // "two hundred (and) forty one", "a hundred and ten", "one hundred".
  const h = tok.indexOf("hundred");
  if (h >= 0) {
    if (h > 1) return null;
    const lead = h === 0 || tok[0] === "a" ? 1 : digitOf(tok[0]);
    if (!(lead >= 1)) return null;
    if (h === tok.length - 1) return lead * 100;
    const rest = under100(tok, h + 1);
    if (!rest || rest.next !== tok.length || rest.value === 0) return null;
    return lead * 100 + rest.value;
  }
  // Digit by digit: "two four one", "two oh five".
  if (tok.length === 3 && tok.every((w) => digitOf(w) != null)) {
    const d = tok.map(digitOf);
    return d[0] === 0 || NOUGHTS.has(tok[0]) ? null : d[0] * 100 + d[1] * 10 + d[2];
  }
  // As a yardage is said: "two forty one", "one fifty", "one twelve".
  if (tok.length >= 2 && tok[0] in UNIT && !NOUGHTS.has(tok[0])) {
    const rest = under100(tok, 1);
    if (rest && rest.next === tok.length && rest.value >= 10) return UNIT[tok[0]] * 100 + rest.value;
  }
  // Under a hundred: "forty one", "seven".
  const r = under100(tok, 0);
  return r && r.next === tok.length ? r.value : null;
}

// Words that may follow a carry and mean nothing more.
const UNITS_SAID = /\s+(yards?|yds|metres?|meters?)$/;

// A number with its decimals ("one forty one point five" -> 141.5), or null.
export function spokenNumber(words) {
  const t = String(words ?? "")
    .trim()
    .replace(UNITS_SAID, "");
  const [whole, decimals, ...more] = t.split(/\s+point\s+|\s+point$/);
  if (more.length) return null;
  const n = spokenInteger(whole);
  if (n == null) return null;
  if (decimals === undefined) return n;
  const digits = decimals.split(/\s+/).map(digitOf);
  if (!digits.length || digits.length > 2 || digits.some((d) => d == null)) return null;
  return Number(`${n}.${digits.join("")}`);
}

// ---- A carry ------------------------------------------------------------

// What a carry can be said as, in yards or metres: a chip to a long drive.
export const CARRY_RANGE = [1, 400];

// A spoken carry, or null: a number in CARRY_RANGE, to a tenth.
export function spokenCarry(words) {
  const n = spokenNumber(words);
  if (n == null || n < CARRY_RANGE[0] || n > CARRY_RANGE[1]) return null;
  return Math.round(n * 10) / 10;
}

// Every way the grammar lists a whole number: "two hundred and forty one",
// "two hundred forty one", "two forty one", "two four one" (and "two oh
// five", "two zero five" for the noughts).
export function integerPhrases(n) {
  if (n < 100) return [wordsUnder100(n)];
  const hw = UNIT_WORDS[Math.floor(n / 100)];
  const r = n % 100;
  if (!r) return n === 100 ? ["one hundred", "a hundred"] : [`${hw} hundred`];
  const out = [sayNumber(n), sayNumber(n, { and: false })];
  if (r >= 10) {
    out.push(`${hw} ${wordsUnder100(r)}`, `${hw} ${UNIT_WORDS[Math.floor(r / 10)]} ${UNIT_WORDS[r % 10]}`);
  } else {
    out.push(`${hw} oh ${UNIT_WORDS[r]}`, `${hw} zero ${UNIT_WORDS[r]}`);
  }
  if (Math.floor(n / 100) === 1) out.push(`a hundred and ${wordsUnder100(r)}`);
  return out;
}

// The carry half of the Windows grammar: every whole number in CARRY_RANGE,
// each way it's said. Tenths go on with POINT_PHRASES.
export function carryPhrases() {
  const out = new Set();
  for (let n = CARRY_RANGE[0]; n <= CARRY_RANGE[1]; n++) for (const p of integerPhrases(n)) out.add(p);
  return [...out];
}
export const POINT_PHRASES = UNIT_WORDS.map((w) => `point ${w}`);

// ---- A swing's power -----------------------------------------------------------

// A power is said in fives from 10 to 100 (power.mjs keeps the rule).
const POWERS = Array.from({ length: 19 }, (_, i) => 10 + i * 5);
// The fractions golfers use for a swing's length, as a power.
export const FRACTIONS = { half: 50, "a half": 50, quarter: 25, "a quarter": 25, "three quarter": 75, "three quarters": 75, full: 100, "a full": 100 };

// A spoken power, as { pw } - or { bad } for a power-like number that isn't
// one (not in fives, or out of range) - or null for anything else.
//   "fifty", "fifty percent", "fifty percent swing", "half", "a half
//   swing", "three quarter swing", "full swing", "a hundred percent"
// A bare number ("fifty") only counts with bare: true - after "power
// next", or on the card asking for one; elsewhere it could be anything.
export function spokenPower(words, { bare = false } = {}) {
  let t = String(words ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!t) return null;
  let marked = false;
  if (/ swing$/.test(t)) {
    t = t.slice(0, -" swing".length);
    marked = true;
  }
  if (/ (percent|per cent)$/.test(t)) {
    t = t.replace(/ (percent|per cent)$/, "");
    marked = true;
  }
  if (t in FRACTIONS) return { pw: FRACTIONS[t] };
  if (!marked && !bare) return null;
  const n = spokenInteger(t);
  if (n == null) return null;
  return POWERS.includes(n) ? { pw: n } : { bad: n };
}

// Every power phrase the Windows grammar lists: each power in fives, with
// and without "percent" (and "percent swing"), and the fractions, with and
// without "swing". With marked, only the ones that say they're a power
// (not a bare "fifty"), for after a lead without "power" in it.
export function powerPhrases({ marked = false } = {}) {
  const out = new Set();
  for (const pw of POWERS) {
    for (const w of integerPhrases(pw)) {
      if (!marked) out.add(w);
      out.add(`${w} percent`).add(`${w} percent swing`);
    }
  }
  for (const f of Object.keys(FRACTIONS)) out.add(f).add(`${f} swing`);
  return [...out];
}
