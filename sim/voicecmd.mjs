// Everything a player can say, beyond changing club (sim/voice.mjs): the
// last shot's club or strike ("last shot seven iron", "last shot mishit"),
// the answers to the cards in the corner and the club check's question,
// taking an answer back - and, with the menu's More voice commands on, a
// note about a shot, a swing's power, a special shot next, replays,
// scenes, the stats' recording format and the putting green.
// hear() turns what a recogniser heard into what to do; every phrase list
// here also builds the Windows app's fixed grammar (electron/voice.mjs),
// so the two can't drift apart.
//
// Two kinds of phrase:
//   - commands, which start with words chatter doesn't ("club picked",
//     "shot note", "power next", "punch next", "last shot fifty percent",
//     "stop recording") and are heard any time
//     voice is on;
//   - bare answers ("yes", "thin", "fifty", "undo"), which are only heard
//     while something is waiting for them - a card showing, an answer that
//     can still be taken back - and need a surer hearing (CONFIDENCE). Outside a prompt
//     nothing bare is acted on, so chatter never answers anything.
//
// Pure: no page, no microphone. The page side is public/voice.js.

import { parseVoice, normalise, clubFromWords, YES_WORDS, NO_WORDS, ANSWER_LEADS } from "./voice.mjs";
import { spokenPower, spokenNumber, wordsUnder100 } from "./numbers.mjs";
import { cleanNote } from "./shotnotes.mjs";

// How sure the recogniser must be, from 0 to 1, for each kind of phrase.
//   command  a phrase with its wake words: the words themselves make chat
//            unlikely (what club changes have always used)
//   bare     a bare word or two, only while a card or box waits for it:
//            short and common, so it needs a surer hearing
//   number   a bare number: "fifteen" and "fifty", "two four one" and "two
//            forty one" are easily confused, so surer still
// Windows' recogniser only ever hears the grammar's phrases, so a low score
// there is usually noise that happened to fit one; a browser writes down
// anything, and scores it less generously. A result with no score (a
// browser's 0) is taken at its word, as it always has been.
export const CONFIDENCE = {
  app: { command: 0.6, bare: 0.75, number: 0.8 },
  browser: { command: 0.5, bare: 0.65, number: 0.7 },
};

// ---- Answers to the cards ---------------------------------------------------------

// Bare words for what a shot was, as the cards' buttons say it (markShot's
// words: parseSay in recorder.js). Not the commonest single words - "good",
// "fine", "nothing", "other" - which a friend in the bay says all the time:
// "good strike", "struck fine", "nothing wrong", "something else".
export const CARD_WORDS = {
  good: ["good strike", "a good strike", "struck fine", "struck it fine", "struck well", "it was fine", "nothing wrong"],
  thin: ["thin", "thinned", "thinned it", "bladed", "bladed it"],
  fat: ["fat", "heavy", "chunked", "chunked it", "hit it fat"],
  topped: ["topped", "topped it"],
  shank: ["shank", "shanked", "shanked it"],
  badhit: ["bad hit", "a bad hit", "just a bad hit", "bad shot", "a bad shot", "mishit", "mishit it", "duffed it", "underpowered"],
  misread: ["misread", "a misread", "take it out", "bad read"],
  keep: ["keep it", "keep", "keep it in", "it was real"],
  punch: ["punch", "a punch", "punch shot", "a punch shot", "knockdown", "a knockdown", "low one", "a low one"],
  part: ["part swing", "a part swing", "partial", "partial swing"],
  other: ["something else"],
  // The end of a session: "keep it" (above), or it was just a test.
  testing: ["just testing", "testing", "it was testing", "it was a test", "make it experimental", "experimental"],
  leaveout: ["leave it out", "leave it out of my stats", "ignore it", "ignore that session"],
};
export const WRONG_CLUB = ["wrong club", "the wrong club"];
export const UNDO_WORDS = ["undo", "undo that", "take that back"];

// What each card can be answered with (the recorder's cards):
//   check    "Last shot looked like a driver?" (an unsure club check, said
//            while voice is on: yes, it was the driver; no, it was the 7
//            iron selected; a club; a mishit; a misread)
//   strike   "Thin - left out of your 7 iron's carry" (a bad strike)
//   review   "That 7 iron - what was wrong with it?" (the range's button)
//   odd      "Did the launch monitor misread that?"
//   unusual  "That 7 iron went 95 yds (usually 150). What was it?"
//   power    "That felt like a 50% swing?" (the mod-swing prompt)
//   session  "That session: 24 shots. Keep it in your stats?" (as it ends)
// "power" is a power as a part swing's ("half swing", "fifty percent"; a
// bare number too on the power card), "club" is "it was a <club>".
export const CARD_ACCEPTS = {
  check: ["yes", "no", "club", "misread", "badhit"],
  strike: ["yes", "no", "good", "thin", "fat", "topped", "shank", "badhit", "misread", "punch", "part", "other", "power"],
  review: ["good", "thin", "fat", "topped", "shank", "badhit", "misread", "punch", "part", "other", "power"],
  odd: ["yes", "no", "keep", "misread"],
  unusual: ["yes", "no", "good", "thin", "fat", "topped", "shank", "badhit", "misread", "punch", "part", "other", "power", "club", "wrong club"],
  power: ["yes", "no", "power", "misread"],
  session: ["yes", "keep", "testing", "leaveout"],
};

// "It was thin", "that was a punch": the same as "thin", "punch".
const SAID_AS = /^(it was|that was)( a| an| the)? /;
const LEADS = [...ANSWER_LEADS].sort((a, b) => b.length - a.length);

// A bare answer to the card showing, or null.
function cardAnswer(t, card, { bag, numbers }) {
  const ok = new Set(CARD_ACCEPTS[card] ?? []);
  if (ok.has("club")) {
    for (const lead of LEADS) {
      if (!t.startsWith(`${lead} `)) continue;
      const club = clubFromWords(t.slice(lead.length + 1), bag);
      if (club) return { answer: "club", club };
    }
  }
  if (ok.has("yes") && YES_WORDS.includes(t)) return { answer: "yes" };
  if (ok.has("no") && NO_WORDS.includes(t)) return { answer: "no" };
  // A club on its own, while the card asks which club it was: that one
  // ("eight iron") - by its whole name, never a bare number ("fifty").
  if (ok.has("club")) {
    const club = clubFromWords(t, bag, { short: false });
    if (club) return { answer: "club", club };
  }
  const bare = t.replace(SAID_AS, "");
  for (const w of new Set([t, bare])) {
    if (ok.has("wrong club") && WRONG_CLUB.includes(w)) return { wrongClub: true };
    for (const [say, list] of Object.entries(CARD_WORDS)) if (ok.has(say) && list.includes(w)) return { say };
    if (ok.has("power")) {
      const p = spokenPower(w, { bare: card === "power" && numbers });
      if (p?.pw) return { power: p.pw, when: "card" };
      if (p?.bad != null && card === "power") return { badPower: p.bad, when: "card" };
    }
  }
  return null;
}

// ---- The last shot ------------------------------------------------------------------

// "Last shot seven iron", "this shot was the driver", "last shot mishit",
// "last shot good", "last shot misread": the shot just hit (the owner, 10
// November 2026: "Should really just be for club confirmation or either
// this shot or last shot ... confirm last shot 7 iron. Last shot mishit
// etc"). "This shot" and "that shot" are the same shot - the one just hit,
// still in the air or landed. A club by its whole name only ("seven iron",
// never "seven" or "fifty", which are a power's: "last shot fifty
// percent").
export const LAST_SHOT_LEADS = ["last shot", "the last shot", "this shot", "that shot"];
export const LAST_SHOT_LINKS = ["", "was", "was a", "was an", "was the", "was my", "with", "with the", "with my", "is", "is a"];
export const LAST_SHOT_WORDS = {
  good: ["good", "good strike", "a good strike", "good shot", "a good shot", "good one", "a good one", "fine", "struck fine", "nothing wrong"],
  thin: CARD_WORDS.thin,
  fat: CARD_WORDS.fat,
  topped: CARD_WORDS.topped,
  shank: CARD_WORDS.shank,
  badhit: ["mishit", "a mishit", "mis hit", "a mis hit", "miss hit", "a miss hit", "mishit it", "bad hit", "a bad hit", "just a bad hit", "bad shot", "a bad shot", "duffed it"],
  misread: ["misread", "a misread", "misread take it out", "take it out", "bad read"],
};
const LAST_LEADS_ALL = LAST_SHOT_LEADS.flatMap((lead) => LAST_SHOT_LINKS.map((link) => (link ? `${lead} ${link}` : lead))).sort((a, b) => b.length - a.length);
// { lastClub } / { lastSay }, or null.
function lastShotCommand(t, bag) {
  for (const lead of LAST_LEADS_ALL) {
    if (!t.startsWith(`${lead} `)) continue;
    const rest = t.slice(lead.length + 1);
    for (const [say, list] of Object.entries(LAST_SHOT_WORDS)) if (list.includes(rest)) return { lastSay: say };
    const club = clubFromWords(rest, bag, { short: false });
    if (club) return { lastClub: club };
  }
  return null;
}

// ---- A special shot next ------------------------------------------------------------

// "Punch next", "next shot a part swing": what E does, said out loud.
export const SPECIAL_WORDS = {
  punch: ["punch", "a punch", "punch shot", "a punch shot", "knockdown", "a knockdown", "low one", "a low one"],
  part: ["part swing", "a part swing"],
  other: ["something else"],
};
export const NEXT_AFTER = ["next", "next shot"];
export const NEXT_BEFORE = ["next shot", "next shot is", "next shot is a", "the next shot is", "the next shot is a", "next one"];

function specialNext(t) {
  for (const [special, list] of Object.entries(SPECIAL_WORDS)) {
    for (const w of list) {
      if (NEXT_AFTER.some((after) => t === `${w} ${after}`) || NEXT_BEFORE.some((lead) => t === `${lead} ${w}`)) return { special, when: "next" };
    }
  }
  return null;
}

// ---- Power: a "mod swing" -------------------------------------------------------------

// "Power on this next shot is fifty percent", "power next fifty", "next
// shot fifty percent", "half swing next"; "power on the last shot was fifty
// percent", "last shot fifty percent", "that was a half swing". After a
// lead with "power" in it a bare number is a power; after the others it has
// to say so ("fifty percent", "half swing").
export const POWER_NEXT_LEADS = [
  "power next",
  "power next shot",
  "power on this next shot is",
  "power on the next shot is",
  "power on this next shot",
  "power on next shot",
  "next shot",
  "next shot is",
  "next shot is a",
  "next shot at",
  "the next shot is",
  "the next shot is a",
];
export const POWER_NEXT_AFTER = NEXT_AFTER;
export const POWER_LAST_LEADS = [
  "power last",
  "power last shot",
  "power on the last shot was",
  "power on last shot was",
  "power on the last shot",
  "power on that shot was",
  "last shot",
  "last shot was",
  "last shot was a",
  "the last shot was",
  "the last shot was a",
  "that was a",
];
const longestFirst = (list) => [...list].sort((a, b) => b.length - a.length);
const NEXT_LEADS = longestFirst(POWER_NEXT_LEADS);
const LAST_LEADS = longestFirst(POWER_LAST_LEADS);

// The words after a lead: with "power" in the lead, a lead can come after
// some chatter (a browser runs it in); without, only to start with.
function afterLead(t, lead) {
  if (t.startsWith(`${lead} `)) return t.slice(lead.length + 1);
  if (!lead.startsWith("power")) return null;
  const i = ` ${t} `.lastIndexOf(` ${lead} `);
  return i > 0 ? t.slice(i + lead.length).trim() : null;
}

function powerCommand(t) {
  for (const [when, leads] of [
    ["next", NEXT_LEADS],
    ["last", LAST_LEADS],
  ]) {
    for (const lead of leads) {
      const rest = afterLead(t, lead);
      if (rest == null) continue;
      const p = spokenPower(rest, { bare: lead.startsWith("power") });
      if (p?.pw) return { power: p.pw, when };
      if (p?.bad != null) return { badPower: p.bad, when };
    }
  }
  for (const after of POWER_NEXT_AFTER) {
    if (!t.endsWith(` ${after}`)) continue;
    const p = spokenPower(t.slice(0, -after.length - 1));
    if (p?.pw) return { power: p.pw, when: "next" };
  }
  return null;
}

// ---- The stats' recording format ---------------------------------------------------

// For the stats' recording formats (Practice / Round / Experimental / Off,
// golfsim.setRecording). "Round" and "experimental" alone turn up in chat
// ("let's play a round"), so they need "recording" with them.
export const RECORDING_WORDS = {
  off: ["stop recording", "recording off"],
  practice: ["start recording", "recording on", "recording practice", "practice recording"],
  experimental: ["recording experimental", "experimental recording"],
  round: ["recording round", "round recording"],
};
function recording(t) {
  for (const [mode, list] of Object.entries(RECORDING_WORDS)) if (list.some((w) => t === w || t.endsWith(` ${w}`))) return { recording: mode };
  return null;
}

// ---- The video recorder -----------------------------------------------------------

// Starting and stopping the video recorder (videorec.js). Not "start
// recording" - that's the stats' recording format, above.
export const VIDEO_WORDS = {
  start: ["start filming", "start the video", "start video", "video on"],
  stop: ["stop filming", "stop the video", "stop video", "video off"],
};
function videoCommand(t) {
  for (const [what, list] of Object.entries(VIDEO_WORDS)) if (list.some((w) => t === w || t.endsWith(` ${w}`))) return { video: what };
  return null;
}

// ---- The recording's scenes ----------------------------------------------------------

// Switching the recording's scene (sim/videoscenes.mjs): "next scene",
// "previous scene", or "scene" and its name or number ("scene swing
// review", "switch to scene two"). Always "scene" in it, so chatter rarely
// fits. { scene: 1 | -1 | "the words" }.
export const SCENE_WORDS = {
  next: ["next scene", "scene next", "change scene", "change the scene"],
  previous: ["previous scene", "last scene", "scene back", "back a scene"],
};
export const SCENE_LEADS = ["switch to scene", "switch scene to", "go to scene", "change scene to", "show scene", "scene"];
// For the Windows grammar: the leads with names every recorder has, and
// the numbers.
export const SCENE_NAMES = ["swing review", "youtube", "game only", "finish", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
function sceneCommand(t) {
  if (SCENE_WORDS.next.includes(t)) return { scene: 1 };
  if (SCENE_WORDS.previous.includes(t)) return { scene: -1 };
  for (const lead of SCENE_LEADS) {
    if (!t.startsWith(`${lead} `)) continue;
    const rest = t.slice(lead.length + 1).trim();
    if (rest) return { scene: rest };
  }
  // "switch to the swing review scene"
  const m = /^(?:switch to|go to|show) (?:the )?(.+) scene$/.exec(t);
  return m ? { scene: m[1] } : null;
}

// ---- Saving the replay ---------------------------------------------------------------

// Keeping the last shot's camera replay, which otherwise goes at the next
// shot (replay.js). "Save" leads every one: "keep that" is too close to the
// cards' "keep it" (a misread card's answer), and "keep" alone is one.
export const SAVE_WORDS = ["save that", "save it", "save clip", "save the clip", "save that clip", "save replay", "save the replay", "save that replay", "save the swing", "save that swing"];
function saveCommand(t) {
  return SAVE_WORDS.some((w) => t === w || t.endsWith(` ${w}`)) ? { saveReplay: true } : null;
}

// ---- The swing replay on the game window --------------------------------------------

// The last shot's camera replay, big on the game window (swingreplay.js):
// "replay", "show me that swing", "slow motion"... and "close replay". Each
// has "replay" or "swing" (or "slow motion") in it, so chatter rarely fits;
// "replay" alone only as all that's said. Never "save": that keeps the
// replay (above). Speeds: slow is a quarter, half, full; none said is the
// Cameras panel's (half, to begin with).
export const REPLAY_WORDS = {
  close: ["close replay", "close the replay", "hide replay", "hide the replay", "stop replay", "stop the replay", "end replay", "replay off", "close the swing", "hide the swing"],
  slow: ["slow motion", "replay slow", "slow replay", "replay in slow motion", "replay slow motion", "slow motion replay", "show it in slow motion", "replay quarter speed", "replay at quarter speed", "quarter speed replay"],
  half: ["replay half speed", "replay at half speed", "half speed replay"],
  full: ["replay full speed", "replay at full speed", "full speed replay", "replay normal speed", "replay at normal speed", "replay real time", "replay in real time"],
  show: [
    "replay",
    "replay please",
    "show replay",
    "show the replay",
    "show me the replay",
    "replay that",
    "replay it",
    "replay the swing",
    "replay that swing",
    "replay my swing",
    "show me that swing",
    "show me the swing",
    "show me my swing",
    "show the swing",
    "show that swing",
    "show my swing",
    "replay again",
    "show it again",
    "instant replay",
    "swing replay",
  ],
};
// Only while a replay is showing (bare words, like a card's answers): once
// more from the beginning, a speed, or enough.
export const REPLAY_BARE = {
  again: ["again", "one more time", "once more", "play it again", "and again"],
  close: ["that's enough", "thats enough", "enough", "close it", "hide it", "close"],
  slow: ["slower", "quarter speed", "slow it down"],
  half: ["half speed"],
  full: ["full speed", "normal speed", "faster"],
};
const REPLAY_SPEED = { slow: 0.25, half: 0.5, full: 1 };
const replayResult = (kind) => (kind === "close" ? { replay: "close" } : kind === "again" ? { replay: "again" } : kind === "show" ? { replay: "show" } : { replay: "show", speed: REPLAY_SPEED[kind] });

// "Replay" on its own only as all that's said ("that was a great replay"
// isn't asking); a longer phrase can follow some chatter, as the others do.
function replayCommand(t) {
  for (const [kind, list] of Object.entries(REPLAY_WORDS)) {
    if (list.some((w) => t === w || (w.includes(" ") && t.endsWith(` ${w}`)))) return replayResult(kind);
  }
  return null;
}
function replayBare(t) {
  for (const [kind, list] of Object.entries(REPLAY_BARE)) if (list.includes(t)) return replayResult(kind);
  return null;
}

// ---- The flyover after a hole ---------------------------------------------------------

// On the course, once a hole is finished: the camera following the ball
// through its strokes (course.js). Every phrase has "flyover" or "fly
// over" in it, which chatter in a bay hardly ever does; "stop" ones end it.
export const FLYOVER_WORDS = {
  show: ["flyover", "fly over", "show the flyover", "show me the flyover", "flyover please", "hole flyover", "fly over the hole", "do the flyover", "play the flyover"],
  stop: ["stop flyover", "stop the flyover", "skip flyover", "skip the flyover", "end flyover", "flyover off"],
};
function flyoverCommand(t) {
  for (const [kind, list] of Object.entries(FLYOVER_WORDS)) {
    if (list.some((w) => t === w || (w.includes(" ") && t.endsWith(` ${w}`)))) return { flyover: kind };
  }
  return null;
}

// ---- The game's video ----------------------------------------------------------------------

// The A² Golf video (showreel.js), playing itself and recording itself:
// "record the show reel" starts it, "stop the show reel" stops it. Every
// phrase says "reel", which chatter in a bay doesn't (and "stop the video"
// is the recorder's own: VIDEO_WORDS).
export const REEL_WORDS = {
  start: ["record the show reel", "play the show reel", "start the show reel", "record the reel", "play the reel"],
  stop: ["stop the show reel", "end the show reel", "stop the reel", "end the reel"],
};
function reelCommand(t) {
  // Stopping first: "stop the show reel" ends with "show reel".
  for (const what of ["stop", "start"]) {
    const list = REEL_WORDS[what];
    if (list.some((w) => t === w || t.endsWith(` ${w}`))) return { reel: what };
  }
  return null;
}

// ---- A note about a shot ------------------------------------------------------------

// "Shot note, pulled it a touch", "note: felt rushed", "that felt great":
// everything after the wake words is the note (with "that felt", those
// words are part of it). "Shot note" can follow some chatter; "note" and
// "that felt" only start one. In a browser, which writes down everything
// said, a note is said in one go like this.
export const NOTE_WAKE = ["shot note", "note", "that felt"];

// In the Windows app a note is said in two goes (electron/voice.mjs): one
// of these on its own, then - once the microphone says "Say your note" -
// the note itself, the only time Windows writes down free speech, for
// NOTE_SECONDS. Listening for free speech after the wake words all the
// time, its recogniser fitted almost anything said in the bay to them,
// and wrote down words nobody said (the owner: "It seems to be coming up
// all the time and not actually getting the words that I'm saying").
// Never "note" alone, a short word like "no" and "not".
export const NOTE_START = ["shot note", "take a note"];
// How long it waits for the note to be started, seconds.
export const NOTE_SECONDS = 8;

// { note, wake, wakeWords } or null.
export function parseNote(text) {
  const words = String(text ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const low = words.map((w) => w.toLowerCase().replace(/[^a-z']/g, ""));
  let from = null;
  let wake = null;
  for (let i = 0; i < low.length - 1; i++) {
    if (low[i] === "shot" && (low[i + 1] === "note" || low[i + 1] === "notes")) {
      [from, wake] = [i + 2, "shot note"];
      break;
    }
  }
  if (from == null && (low[0] === "note" || low[0] === "notes")) [from, wake] = [1, "note"];
  if (from == null && low[0] === "that" && low[1] === "felt") [from, wake] = [0, "that felt"];
  if (from == null) return null;
  const note = cleanNote(words.slice(from).join(" "));
  // "That felt" alone isn't a note.
  if (!note || (wake === "that felt" && words.length < 3)) return null;
  return { note, wake, wakeWords: wake === "note" ? 1 : 2 };
}

// How sure the recogniser was of the wake words alone (the Windows app
// sends each word's score: a note's free words always score lower), or
// null when it didn't say.
function wakeConfidence(words, count) {
  const list = typeof words === "number" ? [words] : Array.isArray(words) ? words : null;
  if (!list || list.length < count) return null;
  const head = list.slice(0, count);
  return head.every(Number.isFinite) ? head.reduce((a, v) => a + v, 0) / count : null;
}

// ---- The putting green --------------------------------------------------------------

// The practice green from the mat: a flat or a new random green (how
// severe), its slopes in per cent, its contours, the putt's distance in
// feet, and the aim off the mat in cups or degrees. "Breaks right" is the
// way the ball goes; "left to right" the same. Each needs its own words
// ("green", "percent", "feet", "aim"), so chat about a putt changes nothing.
export const PUTT_WORDS = {
  flat: ["flat green", "make the green flat", "make it flat", "no slope"],
  random: ["new green", "random green", "new random green", "another green", "change the green", "different green"],
  noBreak: ["no break", "straight putt", "no side slope"],
  noHill: ["no uphill", "no downhill", "no up or down"],
  noContours: ["no contours", "flat plane", "plain green"],
  aimHole: ["aim at the hole", "aim straight", "straight at the hole", "aim at the cup"],
  aimRead: ["aim at the read", "aim where the read says", "use the read", "aim as read"],
};
export const PUTT_SEVERITIES = ["flat", "gentle", "moderate", "severe", "any"];
export const PUTT_CONTOURS = { none: "none", gentle: "gentle", moderate: "moderate", severe: "severe" };
export const PUTT_SLOPE_LEADS = {
  up: ["uphill", "up hill"],
  down: ["downhill", "down hill"],
  right: ["breaks right", "break right", "breaking right", "left to right"],
  left: ["breaks left", "break left", "breaking left", "right to left"],
};
export const PUTT_AIM_LEADS = { right: ["aim right", "aim to the right"], left: ["aim left", "aim to the left"] };
export const PUTT_DISTANCE_LEADS = ["putt from", "putting from", "a putt from", "putts from", "from"];
export const PUTT_FEET = [2, 80];

// "half a", "one and a half", "two", "a" -> a number, or null.
function spokenAmount(words) {
  const t = String(words ?? "").trim();
  if (!t) return null;
  if (/^(half|half a|a half)$/.test(t)) return 0.5;
  if (/^(a|an|one)$/.test(t)) return 1;
  const m = /^(.+?) and a half$/.exec(t);
  if (m) {
    const n = spokenNumber(m[1]);
    return n == null ? null : n + 0.5;
  }
  return spokenNumber(t);
}

function puttCommand(t) {
  for (const w of PUTT_WORDS.flat) if (t === w) return { putt: { flat: true } };
  for (const w of PUTT_WORDS.random) {
    if (t === w) return { putt: { random: null } };
    for (const sev of PUTT_SEVERITIES) if (t === `${w} ${sev}` || t === `${sev} ${w}` || t === `${w} ${sev} one`) return { putt: { random: sev } };
  }
  for (const w of PUTT_WORDS.noBreak) if (t === w) return { putt: { breaks: 0 } };
  for (const w of PUTT_WORDS.noHill) if (t === w) return { putt: { uphill: 0 } };
  for (const w of PUTT_WORDS.noContours) if (t === w) return { putt: { contours: "none" } };
  for (const c of ["gentle", "moderate", "severe"]) if (t === `${c} contours` || t === `${c} contour`) return { putt: { contours: c } };
  for (const w of PUTT_WORDS.aimHole) if (t === w) return { putt: { aim: "hole" } };
  for (const w of PUTT_WORDS.aimRead) if (t === w) return { putt: { aim: "read" } };
  // A slope: "breaks right two percent", "uphill one and a half percent",
  // "breaks left" (a per cent).
  for (const [way, leads] of Object.entries(PUTT_SLOPE_LEADS)) {
    for (const lead of leads) {
      if (t !== lead && !t.startsWith(`${lead} `)) continue;
      const rest = t.slice(lead.length).trim();
      let pct = 1;
      if (rest) {
        const m = /^(.+?)\s+(percent|per cent|percents)$/.exec(rest);
        if (!m) return null;
        pct = spokenAmount(m[1]);
        if (pct == null || pct < 0 || pct > 4) return null;
      }
      const sign = way === "up" || way === "right" ? 1 : -1;
      return { putt: way === "up" || way === "down" ? { uphill: sign * pct } : { breaks: sign * pct } };
    }
  }
  // The aim: "aim left two cups", "aim right half a degree".
  for (const [way, leads] of Object.entries(PUTT_AIM_LEADS)) {
    for (const lead of leads) {
      if (!t.startsWith(`${lead} `)) continue;
      const m = /^(.+?)\s+(cups?|degrees?)$/.exec(t.slice(lead.length).trim());
      if (!m) return null;
      const n = spokenAmount(m[1]);
      if (n == null || n <= 0 || n > (m[2].startsWith("cup") ? 12 : 15)) return null;
      const side = way === "right" ? 1 : -1;
      return { putt: { aim: m[2].startsWith("cup") ? { cups: n, side } : { degrees: n, side } } };
    }
  }
  // The distance: "putt from fifteen feet", "a fifteen foot putt", "fifteen footer".
  const feet = (words) => {
    const n = spokenNumber(words);
    return n != null && n >= PUTT_FEET[0] && n <= PUTT_FEET[1] && Number.isInteger(n) ? n : null;
  };
  for (const lead of PUTT_DISTANCE_LEADS) {
    const m = new RegExp(`^${lead} (.+?) (feet|foot)$`).exec(t);
    if (m) {
      const n = feet(m[1]);
      return n == null ? null : { putt: { distance: n } };
    }
  }
  const m = /^(?:a |an )?(.+?) (?:foot putt|feet putt|footer)$/.exec(t);
  if (m) {
    const n = feet(m[1]);
    return n == null ? null : { putt: { distance: n } };
  }
  return null;
}

// ---- Everything -----------------------------------------------------------------------

// Digits and signs as a browser writes them: "50%" is fifty percent,
// "141.5" one forty one point five.
function prepare(text) {
  return normalise(
    String(text ?? "")
      .replace(/%/g, " percent ")
      .replace(/(\d)\.(\d)/g, "$1 point $2"),
  );
}

// What was heard -> what to do, or null to ignore it.
//   text        what the recogniser wrote
//   confidence  its score, 0 - 1 (null: none given)
//   source      "app" (Windows' recogniser) or "browser"
//   words       the Windows app's score for each word, for a note
//   grammar     the Windows app's grammar it was heard in: "note-text" is
//               a note, said once its wake words were (NOTE_START)
//   waiting     what's waiting for a bare answer: { card (a CARD_ACCEPTS
//               kind, or null), undo (an answer can still be taken back), replay
//               (a swing replay is showing on the game window) }
//   bag         the wedges a spoken loft can mean
//   extras      the menu's More voice commands: with it off, only a club
//               change, the last shot's club or strike ("last shot seven
//               iron", "last shot mishit") and the answers to what's asking
//               are heard - notes, powers, replays, scenes, recording, the
//               putting green and who's hitting aren't (the owner: "Maybe
//               need to strip a lot of things to allow it to confirm things
//               easier?")
// Results:
//   { club } / { unknown }                  a club change (sim/voice.mjs)
//   { lastClub }                            "last shot seven iron": the shot
//                                           just hit was that club
//   { lastSay }                             "last shot mishit", "good",
//                                           "misread", "thin"...: how it was
//   { extra }                               one of the More voice commands,
//                                           heard with them off: not done
//   { answer: "yes" | "no" }                on a card
//   { answer: "club", club }                "it was a 5 iron", on a card
//   { say }                                 "thin", "punch", "misread"... on a card
//   { wrongClub: true }                     on the "What was it?" card
//   { power, when: "next" | "last" | "card" }, { badPower, when }
//   { special, when: "next" }               "punch next"
//   { note, wake }                          "shot note ..."
//   { undo: true }                          "undo", "take that back"
//   { recording }                           "stop recording"...
//   { video: "start" | "stop" }             "start filming"...
//   { saveReplay: true }                    "save that", "save clip"...
//   { scene: 1 | -1 | words }               "next scene", "scene swing review"...
//   { replay: "show", speed? }              "replay", "slow motion" (0.25)...
//   { replay: "again" | "close" }           "again", "that's enough" (while
//                                           showing); "close replay" any time
//   { flyover: "show" | "stop" }            "flyover", "stop the flyover"
//   { reel: "start" | "stop" }              "record the show reel", "stop the show reel"
//   { putt: { flat } | { random: severity | null } | { uphill } | { breaks }
//           | { contours } | { distance } | { aim } }
//                                           the putting green: "flat green",
//                                           "breaks right two percent", "putt
//                                           from fifteen feet", "aim left two cups"
// With a wake word (wake: its phrases, WAKE_WORDS; awake: it was just said
// on its own), also:
//   { woke, seconds? }                      the wake word on its own, heard as
//                                           surely as a bare answer: listen for
//                                           the command (seconds: how long,
//                                           when not WAKE_SECONDS)
//   { unclear }                             the wake word, then nothing understood
//   (a command without the wake word: null, ignored without a word)
//                                           not done
export function hear(text, { confidence = null, source = "browser", words = null, waiting = {}, bag, grammar = null, wake = null, awake = false, players = [], extras = true } = {}) {
  const level = CONFIDENCE[source] ?? CONFIDENCE.browser;
  const sure = (min) => confidence == null || confidence >= min;
  const o = { confidence, source, words, waiting, bag, grammar, level, sure, players, extras };
  const woken = !!wake?.length;
  // A word the Windows app hears only so it isn't taken for a wake word
  // ("carry" for "caddie"): nothing.
  if (grammar === "decoy") return null;
  // The Windows app's note, said in two goes: what was written down once
  // its wake words had been heard on their own. (Those alone do nothing
  // here: the app then listens for the note.) With a wake word, only once
  // it was said with them (awake).
  if (grammar === "note-text") {
    if ((woken && !awake) || !extras) return null;
    const said = cleanNote(text);
    return said ? { note: said, wake: "shot note" } : null;
  }
  if (grammar === "note-wake") {
    if (!extras) return null;
    const split = woken ? splitWake(text, wake) : null;
    return split && sure(level.command) ? { woke: split.wake, seconds: NOTE_SECONDS + 2 } : null;
  }
  // A club on its own heard by the Windows app while a question shows (its
  // "ask-club", listened for only then): an answer, or else a club.
  if (grammar === "ask-club") return askingNow(waiting) ? orNull(answerOf(text, o) ?? clubOf(text, { ...o, whole: true })) : null;
  if (!woken) return orNull(commandOf(text, o) ?? answerOf(text, o));
  // A wake word first (WAKE_WORDS): what follows is a command, or a club
  // on its own ("caddie, seven iron"); said alone, the next thing said is.
  // Alone it's a short word, the easiest to hear in something else, so it
  // needs a bare answer's surer hearing. (The Windows app listens for a
  // club on its own after it for WAKE_SECONDS from when it was heard; the
  // page waits two more, for the club to be said.)
  const split = splitWake(text, wake);
  if (split) {
    // (Said after other words - "thanks caddie", "where's my caddie" - it's
    // talk, not the wake word: nothing at all is shown for it.)
    if (!split.rest) return !split.lead && sure(level.bare) ? (source === "app" ? { woke: split.wake, seconds: WAKE_SECONDS + 2 } : { woke: split.wake }) : null;
    return orNull(commandOf(split.rest, o) ?? answerOf(split.rest, o) ?? clubOf(split.rest, o) ?? (!split.lead && sure(level.command) ? { unclear: split.rest } : null));
  }
  if (awake) return orNull(commandOf(text, o) ?? answerOf(text, o) ?? clubOf(text, o));
  // A question on screen: no wake word needed until it goes (the owner: "If
  // a question is being asked default to not needing a wake word during
  // that window. So the user can just say out loud yes, 8 iron, etc. then
  // go back to wake word after") - its answers first, then anything said
  // as after the wake word, a club on its own included.
  // Only its answers, though, and a club by its whole name: any other
  // command still needs the wake word, so talk while a card shows never
  // asks "do this?".
  // ("Last shot seven iron" too: its own words make it no chatter.)
  if (askingNow(waiting)) return orNull(answerOf(text, o) ?? lastOf(text, o) ?? clubOf(text, { ...o, whole: true }));
  // Not woken: only the answers something on screen is waiting for.
  // Anything else - a command said without the wake word included - is
  // ignored, silently (the owner: "Let's not have a pop-up unless the wake
  // word is said. We don't need to assume the user has forgotten").
  return orNull(answerOf(text, o));
}

// (A command recognised but not surely enough heard is false: nothing is
// done, and nothing else is tried.)
const orNull = (r) => r || null;

// Whether a question is waiting for voice to answer (waiting: hear's) - a
// card, voice's own "do this?" (app.js askVoice): no wake word needed while
// one waits.
export const askingNow = (waiting) => !!(waiting?.card || waiting?.confirm);

// Whether a heard phrase answers the card on screen - the club check's yes,
// no or club, a strike's word, a wrong club, a power: done at once, the card
// being the question already (the owner: "Don't have two boxes"), never
// asked about again in voice's own box.
export const answersCard = (r) => !!r && (r.answer != null || r.say != null || !!r.wrongClub || r.when === "card");

// What's done as soon as it's heard, never asked about first ("say confirm
// to do it"): a card's answer, the last shot's club or strike, "undo" -
// each easily taken back (Z, "undo"), and said again and again when it
// had to be agreed to as well (the owner, 10 November 2026: "I often had
// to say the same thing a few times").
export const doneAtOnce = (r) => answersCard(r) || (!!r && (!!r.undo || r.lastClub != null || r.lastSay != null));

// A command, a note or a club change; false when one was recognised but
// not surely enough heard; null when it isn't one.
function commandOf(text, { source, grammar, words, confidence, level, sure, bag, players = [], extras = true }) {
  // A note in one go first (a browser, which writes down everything said;
  // nothing else the Windows app hears is ever a note): its free words can
  // be anything. "Note" on its own is a short, common word, so it's held
  // to the bare answers' bar.
  const note = source === "app" && grammar ? null : parseNote(text);
  if (note && !extras) return sure(level.command) ? { extra: "note" } : false;
  if (note) {
    const c = wakeConfidence(words, note.wakeWords) ?? confidence;
    const min = note.wakeWords === 1 ? level.bare : level.command;
    return c == null || c >= min ? { note: note.note, wake: note.wake } : false;
  }
  if (!sure(level.command)) return false;
  const club = parseVoice(text, { bag });
  if (club) return club;
  const t = prepare(text);
  if (!t) return null;
  const last = lastShotCommand(t, bag);
  if (last) return last;
  const more = hitterCommand(t, players) ?? powerCommand(t) ?? specialNext(t) ?? recording(t) ?? videoCommand(t) ?? saveCommand(t) ?? replayCommand(t) ?? flyoverCommand(t) ?? reelCommand(t) ?? sceneCommand(t) ?? puttCommand(t);
  // One of the More voice commands with them off: said so, not done.
  return more && !extras ? { extra: Object.keys(more)[0] } : more;
}

// Who's hitting (sim/profiles.mjs): "Alex hitting", "Alex is up" - one of
// the players' names, as it's heard. players: the names that can be said.
export const HITTING_AFTER = ["hitting", "is hitting", "to hit", "is up", "up next", "next"];
export function hitterCommand(t, players = []) {
  for (const name of players) {
    const n = normalise(name);
    if (n && HITTING_AFTER.some((a) => t === `${n} ${a}`)) return { hitter: name };
  }
  return null;
}

// Bare words: only while something waits for them, and only when sure.
function answerOf(text, { waiting, bag, level, sure }) {
  if (!sure(level.bare)) return null;
  const t = prepare(text);
  if (!t) return null;
  // While its box asks whether to do what was heard: agreed, or not.
  if (waiting.confirm) {
    if (CONFIRM_WORDS.yes.includes(t)) return { confirm: true };
    if (CONFIRM_WORDS.no.includes(t)) return { confirm: false };
  }
  // While a swing replay shows: "again", "that's enough", "half speed".
  if (waiting.replay) {
    const r = replayBare(t);
    if (r) return r;
  }
  if (waiting.undo && UNDO_WORDS.includes(t)) return { undo: true };
  if (waiting.card) return cardAnswer(t, waiting.card, { bag, numbers: sure(level.number) });
  return null;
}

// "Last shot seven iron", "last shot mishit", while a question asks.
function lastOf(text, { level, sure, bag }) {
  if (!sure(level.command)) return null;
  const t = prepare(text);
  return t ? lastShotCommand(t, bag) : null;
}

// After the wake word, a club needs no "club picked": "caddie, seven iron".
// whole: by its whole name only (while a question shows, with no wake word
// said): "eight iron", never "fifty" or "seven".
function clubOf(text, { level, sure, bag, whole = false }) {
  if (!sure(level.command)) return null;
  const club = clubFromWords(text, bag, { short: !whole });
  return club ? { club } : null;
}

// ---- A wake word first ----------------------------------------------------------------

// With one chosen (the menu's Sound & voice), nothing is done unless it's
// said first, as "OK Google" or "Alexa" are (the owner: "we need a key word
// as the initial trigger word"): "Caddie, seven iron", "Caddie, save
// that", "Caddie, shot note, pulled it". Said on its own, whatever is said
// in the next WAKE_SECONDS is the command. The answers to a card or box on
// screen ("yes", "thin", "confirm") need none: something is asking for
// them. "Hey" or "OK" in front, or a browser spelling it "caddy", is the
// same word. (The owner: "I really like Alba or Caddie as the wake name".)
export const WAKE_CHOICES = ["caddie", "alba", "albatross", "off"];
export const WAKE_NAMES = { caddie: "Caddie", alba: "Alba", albatross: "Albatross", off: "Off - commands any time" };
export const WAKE_WORDS = {
  caddie: ["caddie", "caddy", "hey caddie", "hey caddy", "ok caddie", "ok caddy", "okay caddie", "okay caddy"],
  alba: ["alba", "hey alba", "ok alba", "okay alba"],
  albatross: ["albatross", "hey albatross", "ok albatross", "okay albatross"],
};
// Words that sound like a wake word, said in a bay: "carry" above all (a
// sound from "caddie", and said after every shot), names, and swing talk's
// "elbow" against "alba". The Windows app listens only for its own
// phrases and fits whatever's said to the nearest one, so it listens for
// these too and they're dropped (hear's "decoy"): heard as themselves,
// they aren't taken for the wake word. (A browser writes down what was
// said, so it needs none.) None is anything a player says to the game.
export const WAKE_DECOYS = ["carry", "carried", "caddies", "katie", "cathy", "daddy", "paddy", "laddie", "candy", "elbow", "elbows", "alpha", "album", "albert", "alma"];
export const DEFAULT_WAKE = "caddie";
export const WAKE_SECONDS = 8;
// The words for a choice, or null when there's none (off, or not a choice).
export const wakeWords = (choice) => WAKE_WORDS[choice] ?? null;
// Every choice's words: the Windows app's grammar hears them all, and the
// page acts only on the one chosen.
export const wakePhrases = () => [...new Set(Object.values(WAKE_WORDS).flat())];

// The last wake word in what was heard, and what came after it ("good shot,
// caddie, seven iron" -> { wake: "caddie", rest: "seven iron" }), or null.
export function splitWake(text, words) {
  if (!words?.length) return null;
  const t = ` ${normalise(text)} `;
  let best = null;
  for (const w of words) {
    for (let i = t.indexOf(` ${w} `); i >= 0; i = t.indexOf(` ${w} `, i + 1)) {
      if (!best || i > best.i || (i === best.i && w.length > best.w.length)) best = { i, w };
    }
  }
  if (!best) return null;
  // lead: what came before it ("good shot" in "good shot, caddie"). Said at
  // the start it's the wake word for sure; after other words it may just be
  // talk ("thanks caddie"), so hear() then only takes a command after it.
  return { wake: best.w, rest: t.slice(best.i + best.w.length + 2).trim(), lead: t.slice(0, best.i).trim().replace(/(^| )(hey|ok|okay)$/, "").trim() };
}

// ---- Asked before it's done ---------------------------------------------------------

// Voice changes the club straight away; everything else it hears is asked
// about first, in a box that has to be agreed to (the owner: "every now and
// then it thinks I meant to do something when I didn't... the only thing it
// should change without an action is changing club"). Agreed by a key or a
// click, or by saying one of these - never a bare "yes", which chatter and
// the club check use. Cancelled by these, Esc, or by saying nothing.
export const CONFIRM_WORDS = {
  yes: ["confirm", "do it", "yes do it", "go ahead", "agreed", "i agree"],
  no: ["cancel", "cancel that", "don't", "no don't", "leave it", "never mind", "no thanks"],
};
export const confirmPhrases = () => [...CONFIRM_WORDS.yes, ...CONFIRM_WORDS.no];

const SAY_WORDS = {
  good: "a good strike",
  thin: "thin",
  fat: "fat",
  topped: "topped",
  shank: "a shank",
  badhit: "just a bad hit",
  misread: "a misread - take it out of the stats",
  keep: "a real reading - keep it",
  punch: "a punch / low shot",
  part: "a part swing",
  other: "something else on purpose",
};
const SPECIAL_WORDS_SHORT = { punch: "a punch / low shot", part: "a part swing", other: "something else" };

// What a heard command would do, in words, for its box. clubName: a club's
// name from its code.
export function voiceAction(r, { clubName = (c) => c } = {}) {
  if (!r) return "";
  if (r.lastClub) return `The last shot was a ${clubName(r.lastClub)}`;
  if (r.lastSay) return `Mark the last shot as ${SAY_WORDS[r.lastSay] ?? r.lastSay}`;
  if (r.answer === "yes") return "Answer the club check: yes, that club";
  if (r.answer === "no") return "Answer the club check: no";
  if (r.answer === "club") return `Answer the club check: it was a ${clubName(r.club)}`;
  if (r.wrongClub) return "Say the last shot was hit with the wrong club";
  if (r.say) return `Mark the last shot as ${SAY_WORDS[r.say] ?? r.say}`;
  if (r.note) return `Add a note to the last shot: "${r.note}"`;
  if (r.hitter) return `${r.hitter} hitting`;
  if (r.power != null) return r.when === "next" ? `Next swing: ${r.power}% power` : `Last shot: a ${r.power}% swing`;
  if (r.badPower != null) return "Set the swing's power";
  if (r.special) return `Next shot: ${SPECIAL_WORDS_SHORT[r.special] ?? r.special}`;
  if (r.recording) return `Keeping the shots: ${{ off: "not recording", practice: "practice", round: "round", experimental: "experimental" }[r.recording] ?? r.recording}`;
  if (r.video) return r.video === "start" ? "Start recording video" : "Stop recording video";
  if (r.scene != null) return r.scene === 1 ? "Next recording scene" : r.scene === -1 ? "Previous recording scene" : `Recording scene: ${r.scene}`;
  if (r.saveReplay) return "Save the last shot's replay";
  if (r.replay) return r.replay === "close" ? "Close the swing replay" : r.replay === "again" ? "Play the swing replay again" : r.speed ? "Show the swing replay, slowed down" : "Show the swing replay";
  if (r.flyover) return r.flyover === "stop" ? "Skip the flyover" : "Play the hole's flyover";
  if (r.reel) return r.reel === "stop" ? "Stop the show reel" : "Record the show reel";
  if (r.undo) return "Take the last answer back";
  if (r.putt) return puttAction(r.putt);
  return "Do what was heard";
}

// The putting green's, for the same box.
function puttAction(p) {
  const pct = (v) => `${Math.abs(v).toString().replace(/\.0$/, "")}%`;
  if (p.flat) return "Putting green: flat";
  if (p.random !== undefined) return p.random ? `Putting green: a new random green, ${p.random}` : "Putting green: a new random green";
  if (p.uphill !== undefined) return p.uphill ? `Putting green: ${pct(p.uphill)} ${p.uphill > 0 ? "uphill" : "downhill"}` : "Putting green: no up or down hill";
  if (p.breaks !== undefined) return p.breaks ? `Putting green: breaks ${p.breaks > 0 ? "right" : "left"} ${pct(p.breaks)}` : "Putting green: no break";
  if (p.contours) return p.contours === "none" ? "Putting green: no contours" : `Putting green: ${p.contours} contours`;
  if (p.distance != null) return `Putt from ${p.distance} ft`;
  if (p.aim === "hole") return "Aim straight at the hole";
  if (p.aim === "read") return "Aim where the read says";
  if (p.aim) {
    const n = p.aim.cups ?? p.aim.degrees;
    const unit = p.aim.cups != null ? (n === 1 ? "cup" : "cups") : n === 1 ? "degree" : "degrees";
    return `Aim ${n} ${unit} ${p.aim.side > 0 ? "right" : "left"}`;
  }
  return "Change the putting green";
}

// ---- For the Windows grammar -------------------------------------------------------

// Every bare card phrase (yes and no are the club check's, already listed).
export function cardPhrases() {
  return [...new Set([...Object.values(CARD_WORDS).flat(), ...WRONG_CLUB])];
}
export const specialPhrases = () => [...new Set(Object.values(SPECIAL_WORDS).flat())];
export const recordingPhrases = () => Object.values(RECORDING_WORDS).flat();
export const videoPhrases = () => Object.values(VIDEO_WORDS).flat();
export const savePhrases = () => [...SAVE_WORDS];
export const scenePhrases = () => [...new Set([...Object.values(SCENE_WORDS).flat(), ...SCENE_NAMES.map((n) => `scene ${n}`), ...SCENE_NAMES.map((n) => `switch to scene ${n}`)])];
export const replayPhrases = () => [...new Set(Object.values(REPLAY_WORDS).flat())];
export const flyoverPhrases = () => [...new Set(Object.values(FLYOVER_WORDS).flat())];
export const reelPhrases = () => [...new Set(Object.values(REEL_WORDS).flat())];
// The putting green's: the fixed phrases, and the parts of the ones with a
// number in them (a lead, then an amount with its unit).
export const puttPhrases = () =>
  [
    ...Object.values(PUTT_WORDS).flat(),
    ...PUTT_WORDS.random.flatMap((w) => PUTT_SEVERITIES.flatMap((sev) => [`${w} ${sev}`, `${sev} ${w}`])),
    ...["gentle", "moderate", "severe"].map((c) => `${c} contours`),
  ].filter((v, i, a) => a.indexOf(v) === i);
export const puttSlopeLeads = () => Object.values(PUTT_SLOPE_LEADS).flat();
export const puttPercentPhrases = () => ["half a percent", "a percent", "one percent", "one and a half percent", "two percent", "two and a half percent", "three percent", "three and a half percent", "four percent"];
export const puttAimLeads = () => Object.values(PUTT_AIM_LEADS).flat();
export const puttAimPhrases = () => {
  const out = ["half a cup", "a cup", "one cup", "half a degree", "a degree", "one degree"];
  for (let n = 2; n <= 12; n++) out.push(`${wordsUnder100(n)} cups`);
  for (let n = 2; n <= 10; n++) out.push(`${wordsUnder100(n)} degrees`);
  return out;
};
export const puttDistanceLeads = () => [...PUTT_DISTANCE_LEADS];
export const puttFeetPhrases = () => {
  const out = [];
  for (let n = PUTT_FEET[0]; n <= PUTT_FEET[1]; n++) out.push(`${wordsUnder100(n)} feet`, `${wordsUnder100(n)} foot`);
  return out;
};
export const puttFooterPhrases = () => {
  const out = [];
  for (let n = PUTT_FEET[0]; n <= PUTT_FEET[1]; n++) out.push(`${wordsUnder100(n)} foot putt`, `a ${wordsUnder100(n)} foot putt`, `${wordsUnder100(n)} footer`, `a ${wordsUnder100(n)} footer`);
  return out;
};
// The last shot's: its leads ("last shot", "this shot was the"), and what
// can follow one besides a club.
export const lastShotLeads = () => [...LAST_LEADS_ALL];
export const lastShotSayPhrases = () => [...new Set(Object.values(LAST_SHOT_WORDS).flat())];
// The bare ones not already among the commands.
export const replayBarePhrases = () => [...new Set(Object.values(REPLAY_BARE).flat())].filter((w) => !replayPhrases().includes(w));
