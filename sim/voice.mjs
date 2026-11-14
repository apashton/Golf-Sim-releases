// Changing club by voice: "club picked seven iron". This file turns what a
// speech recogniser heard into a club, and lists every phrase it listens for.
// The same list builds the Windows app's fixed grammar (electron/voice.mjs),
// so the offline recogniser and this parser can't drift apart.
//
// Pure: no page, no microphone. The page side is public/voice.js.

import { WEDGE_LOFTS, puttsFrom } from "./clubs.mjs";

// The words that must come first. Without them nothing happens, so talking
// about "my seven iron" mid-round changes nothing.
// "Club picked" is unusual enough to count even after some chatter ("good
// shot, club picked seven iron"), and so are "change club (to)", "switch
// club (to)", "club change", "change to" and "switch to": after any of them
// everything else said must be a club, so "switch to a seven next time"
// changes nothing. A bare "club" or "picked" turns up in ordinary talk
// ("what club, a seven?", "I picked the nine"), so those only count at the
// very start, and only before a club's full name.
export const STRONG_WAKE = [
  "club picked",
  "club pick",
  "club picks",
  "change club",
  "change club to",
  "change clubs",
  "change clubs to",
  "switch club",
  "switch club to",
  "switch clubs",
  "switch clubs to",
  "club change",
  "change to",
  "switch to",
];
export const WEAK_WAKE = ["picked", "club"];
// Said after the club, and still a club change.
export const POLITE = ["please", "thanks", "thank you"];

const UNITS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const TEENS = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70 };

// A number as words: 7 -> "seven", 56 -> "fifty six".
export function numberWords(n) {
  if (n < 10) return UNITS[n];
  if (n < 20) return TEENS[n - 10];
  const tens = Object.keys(TENS).find((w) => TENS[w] === Math.floor(n / 10) * 10);
  return n % 10 ? `${tens} ${UNITS[n % 10]}` : tens;
}

// Wedge lofts, for "fifty six degree" (clubs.mjs has the bag's): a spoken
// loft goes to the nearest of these the bag has.
export { WEDGE_LOFTS };
// Lofts people say out loud for a wedge. Outside this it's not a wedge.
export const LOFT_RANGE = [44, 64];

// Every way of saying each club, in words (the recogniser in the Windows app
// only knows words; the parser turns digits into words first).
const IRON_NUMBERS = { "4I": 4, "5I": 5, "6I": 6, "7I": 7, "8I": 8, "9I": 9 };
function buildAliases() {
  const a = {
    DR: ["driver", "one wood", "big stick"],
    "3W": ["three wood", "three w", "three metal", "fairway wood", "fairway"],
    "5W": ["five wood", "five w", "five metal"],
    "4H": ["four hybrid", "four h", "hybrid", "four rescue", "rescue", "rescue club", "four utility"],
    PW: ["pitching wedge", "pitching", "p w", "pee wee"],
    AW: ["approach wedge", "approach", "a w", "attack wedge"],
    GW: ["gap wedge", "gap", "g w", "utility wedge"],
    SW: ["sand wedge", "sand", "s w", "sand iron", "sam wedge"],
    LW: ["lob wedge", "lob", "l w", "flop wedge"],
    PT: ["putter", "flat stick"],
  };
  for (const [club, n] of Object.entries(IRON_NUMBERS)) a[club] = [`${numberWords(n)} iron`, `${numberWords(n)} i`];
  return a;
}
// A club's name, said in full: "seven iron", "sand wedge", "driver".
export const CLUB_ALIASES = buildAliases();
// A bare number for an iron: "seven", "a seven", "the nine". Fine after
// "club picked", but too common in chat to follow a bare "club".
export const SHORT_ALIASES = Object.fromEntries(
  Object.entries(IRON_NUMBERS).map(([club, n]) => {
    const w = numberWords(n);
    return [club, [w, `a ${w}`, `the ${w}`]];
  }),
);
// "A seven iron", "the sand wedge", "my driver": the same club.
const ARTICLES = ["a", "the", "my"];
function withArticles(list) {
  return list.flatMap((w) => (/^(a|the|my) /.test(w) ? [w] : [w, ...ARTICLES.map((a) => `${a} ${w}`)]));
}

// "fifty six degree", "fifty six degrees", "fifty six degree wedge",
// "fifty six wedge" for every loft in range; with short, the bare "fifty
// six" too.
export function loftPhrases({ short = true } = {}) {
  const out = [];
  for (let n = LOFT_RANGE[0]; n <= LOFT_RANGE[1]; n++) {
    const w = numberWords(n);
    if (short) out.push(w);
    out.push(`${w} degree`, `${w} degrees`, `${w} degree wedge`, `${w} wedge`);
  }
  return out;
}

// The club nearest a spoken loft, among the wedges in the bag. A tie goes
// to the higher loft: a 54 is more often a sand wedge than a gap wedge.
export function wedgeForLoft(loft, bag = Object.keys(WEDGE_LOFTS)) {
  if (!(loft >= LOFT_RANGE[0] && loft <= LOFT_RANGE[1])) return null;
  let best = null;
  for (const [club, l] of Object.entries(WEDGE_LOFTS)) {
    if (!bag.includes(club)) continue;
    const d = Math.abs(l - loft);
    if (!best || d < best.d || (d === best.d && l > best.l)) best = { club, d, l };
  }
  return best?.club ?? null;
}

// Answers to a club check ("was that your seven iron?"), heard only while
// one is showing.
export const YES_WORDS = ["yes", "yeah", "yep", "yes it was", "correct", "that's right", "that is right"];
export const NO_WORDS = ["no", "nope", "no it wasn't", "no it was not"];
// "A", "the" and "my" come with the club phrases ("it was a seven iron").
export const ANSWER_LEADS = ["it was", "no it was"];

// Tidies what a recogniser wrote into plain lower-case words, digits spelt
// out: "Club picked 7-iron." -> "club picked seven iron", "P.W." -> "p w",
// "56°" -> "fifty six degree", "7i" -> "seven i".
export function normalise(text) {
  let t = String(text ?? "").toLowerCase();
  t = t.replace(/°/g, " degree ");
  t = t.replace(/(\d+)([a-z]+)/g, "$1 $2");
  t = t.replace(/[^a-z0-9' ]+/g, " ");
  // "PW" written as one word is the letters said one by one.
  t = t.replace(/\b([pgsla])w\b/g, "$1 w");
  t = t.replace(/\d+/g, (d) => (Number(d) < 80 ? ` ${numberWords(Number(d))} ` : ` ${d} `));
  // Sound-alikes browsers write for a number said on its own.
  t = ` ${t} `.replace(/ for /g, " four ").replace(/ ate /g, " eight ").replace(/ fore /g, " four ");
  // "forty-six" and "fifty six" both end up as two words.
  return t.replace(/\s+/g, " ").trim();
}

// Words (joined) -> number, for "fifty six" and "fifty".
function wordsToNumber(words) {
  const parts = words.split(" ");
  if (parts.length === 1) {
    if (parts[0] in TENS) return TENS[parts[0]];
    const u = UNITS.indexOf(parts[0]);
    if (u >= 0) return u;
    const t = TEENS.indexOf(parts[0]);
    return t >= 0 ? 10 + t : null;
  }
  if (parts.length === 2 && parts[0] in TENS && UNITS.indexOf(parts[1]) > 0) return TENS[parts[0]] + UNITS.indexOf(parts[1]);
  return null;
}

// The club a phrase names, or null. `bag` limits which wedges a loft can
// mean. With short: false, only a club's full name counts (not "a seven" or
// "fifty six"), for after a bare "club".
export function clubFromWords(words, bag, { short = true } = {}) {
  const w = normalise(words)
    // "Seven irons" is a mishearing of "seven iron".
    .replace(/\b(iron|wood|wedge|hybrid)s\b/g, "$1");
  if (!w) return null;
  // "A seven iron" is a seven iron. The whole phrase first, though: "a w"
  // is the approach wedge, not "w".
  const bare = w.replace(/^(a|an|the|my) /, "");
  for (const t of [w, bare]) {
    for (const [club, list] of Object.entries(CLUB_ALIASES)) if (list.includes(t)) return club;
    if (short) for (const [club, list] of Object.entries(SHORT_ALIASES)) if (list.includes(t)) return club;
  }
  // A loft: "fifty six degree(s)", "fifty six (degree) wedge", or, with
  // short, just "fifty six".
  const number = bare.replace(/ (degrees?(?: wedge)?|wedge)$/, "");
  if (number !== bare || short) {
    const n = wordsToNumber(number);
    if (n != null) return wedgeForLoft(n, bag ?? Object.keys(WEDGE_LOFTS));
  }
  return null;
}

// What a recogniser heard -> what to do, or null to ignore it.
//   { club: "7I" }                   "club picked seven iron"
//   { unknown: "banana" }            "club picked banana": the command was
//                                    clear but the club wasn't, so the page
//                                    can say so rather than stay silent
//   { answer: "yes" | "no" }         only with answers: true
//   { answer: "club", club: "7I" }   "it was a seven iron", only with answers
// A result the recogniser wasn't sure of (confidence below minConfidence) is
// ignored; one with no confidence at all is taken at its word.
export function parseVoice(text, { confidence = null, minConfidence = 0.5, answers = false, bag } = {}) {
  if (confidence != null && confidence < minConfidence) return null;
  const t = normalise(text);
  if (!t) return null;
  const tail = (s) => s.trim().replace(new RegExp(` (${POLITE.join("|")})$`), "");

  // A browser can run chatter and the command together ("good shot club
  // picked seven iron"), so the command is the last "club picked" and
  // everything after it, which must be a club and nothing else.
  const padded = ` ${t} `;
  const found = [];
  for (const wake of STRONG_WAKE) {
    for (let i = padded.indexOf(` ${wake} `); i >= 0; i = padded.indexOf(` ${wake} `, i + 1)) found.push({ i, wake });
  }
  // Latest first; at the same place, the longer wake word.
  found.sort((a, b) => b.i - a.i || b.wake.length - a.wake.length);
  for (const { i, wake } of found) {
    const club = clubFromWords(tail(padded.slice(i + wake.length + 2)), bag);
    if (club) return { club };
  }
  // A bare "club" or "picked": only as the first word, and only before a
  // club's full name ("club seven iron", not "club, a seven").
  for (const wake of WEAK_WAKE) {
    if (!t.startsWith(`${wake} `) || STRONG_WAKE.some((s) => t.startsWith(`${s} `))) continue;
    const club = clubFromWords(tail(t.slice(wake.length + 1)), bag, { short: false });
    if (club) return { club };
  }
  // "Club picked" and then something that isn't a club. Not after "change
  // to" or "switch to" alone, which turn up in chat ("switch to plan B").
  const said = found.find(({ wake }) => wake.includes("club"));
  if (said) {
    const { i, wake } = said;
    const rest = tail(padded.slice(i + wake.length + 2));
    if (rest) return { unknown: rest };
  }

  if (answers) {
    if (YES_WORDS.includes(t)) return { answer: "yes" };
    if (NO_WORDS.includes(t)) return { answer: "no" };
    for (const lead of [...ANSWER_LEADS].sort((a, b) => b.length - a.length)) {
      if (t.startsWith(`${lead} `)) {
        const club = clubFromWords(t.slice(lead.length + 1), bag);
        if (club) return { answer: "club", club };
      }
    }
  }
  return null;
}

// What to say when "club picked" was followed by something that isn't a
// club: a club that isn't in the bag ("seven wood"), or just not caught.
export function unknownMessage(rest) {
  if (/\b(iron|wood|hybrid|wedge|putter|driver)s?$/.test(rest)) return `No ${rest} in the bag`;
  return `Didn't catch a club: "${rest}"`;
}

// Every club phrase, as words: the club half of the grammar. With short:
// false, only full names (what may follow a bare "club" or "picked").
export function clubPhrases({ short = true } = {}) {
  const full = withArticles(Object.values(CLUB_ALIASES).flat());
  const shortOnes = short ? Object.values(SHORT_ALIASES).flat() : [];
  return [...new Set([...full, ...shortOnes, ...loftPhrases({ short })])];
}

// Whether a spoken club can be taken up in the mode that's showing, as the
// keyboard would: { club } to change to it, or { why } to say why not.
//   mode: range, putting, chipping, course or challenges
//   rangeClubs / chipClubs: the clubs each has
//   course: { round, onGreen, lie } for the player whose turn it is
//   challenge: { game, clubs, onGreen } - the game being played (its name,
//     or null before one's started) and the clubs it lets ↑ ↓ pick; none
//     of them is played on a green yet, but one that was would be putter
//     only, as the course is
//   name: a club's name for the message ("7 iron")
export function clubForMode(mode, club, { rangeClubs = [], chipClubs = [], course = {}, challenge = {}, name = (c) => c } = {}) {
  if (mode === "putting") return club === "PT" ? { club } : { why: "Putting green: putter only" };
  if (mode === "range") return rangeClubs.includes(club) ? { club } : { why: `No ${name(club).toLowerCase()} on the range` };
  if (mode === "chipping") {
    if (chipClubs.includes(club)) return { club };
    return { why: `Chipping clubs: ${name(chipClubs.at(-1))} to ${name(chipClubs[0]).toLowerCase()}` };
  }
  if (mode === "course") {
    if (!course.round) return { why: "Start a round first" };
    if (course.onGreen) return club === "PT" ? { club } : { why: "On the green: putter only" };
    // Off it, from the short grass if it's picked (clubs.mjs PUTTER_LIES).
    if (club === "PT") return puttsFrom(course.lie) ? { club } : { why: "Putter only from the green, fringe, fairway or first cut" };
    if (club === "DR" && course.lie !== "tee") return { why: "Driver only off the tee" };
    return { club };
  }
  if (mode === "challenges") {
    const { game, clubs = [], onGreen = false } = challenge;
    if (!game) return { why: "Pick a game first" };
    if (onGreen) return club === "PT" ? { club } : { why: "On the green: putter only" };
    if (club === "PT") return { why: "Putter only on a green" };
    if (clubs.includes(club)) return { club };
    // The game's own range of clubs: "Chipping ladder: 7 iron to lob wedge".
    return { why: clubs.length ? `${game}: ${name(clubs[0])} to ${name(clubs.at(-1)).toLowerCase()}` : `No ${name(club).toLowerCase()} in this game` };
  }
  return { why: "Not in this mode" };
}
