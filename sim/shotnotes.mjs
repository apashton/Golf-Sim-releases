// A note about a shot, said out loud ("shot note, pulled it, felt rushed")
// and kept with it, and the tags read from its words - the strike, the
// start and shape, the kind of shot and how it felt - so My stats and the
// shot data screen can show them as small chips.
//
// Pure: the page shows what it heard with the tags at once, and the server
// reads the same tags from the same words when it keeps the note.

// The tag groups, in the order the chips are shown.
export const TAG_GROUPS = { strike: "Strike", shape: "Start and shape", type: "Shot type", feel: "Feel" };

// Each tag: its group and the words that give it. Words are matched whole
// (so "thinking" isn't thin), several words in a row as a phrase.
export const NOTE_TAGS = [
  // How it was struck.
  { tag: "thin", group: "strike", words: ["thin", "thinned", "thinner", "thinnish"] },
  { tag: "fat", group: "strike", words: ["fat", "fatted", "fatty"] },
  { tag: "heavy", group: "strike", words: ["heavy"] },
  { tag: "chunk", group: "strike", words: ["chunk", "chunked", "chunky", "chunks"] },
  { tag: "skull", group: "strike", words: ["skull", "skulled", "skulls", "skulling"] },
  // "Top" on its own is as often the top of the swing: only "topped",
  // "top it", "topping" and the like.
  { tag: "top", group: "strike", words: ["topped", "topping", "tops it", "top it", "topped one"] },
  { tag: "shank", group: "strike", words: ["shank", "shanked", "shanks", "shanking"] },
  { tag: "toe", group: "strike", words: ["toe", "toed", "toey"] },
  { tag: "heel", group: "strike", words: ["heel", "heeled", "heely"] },
  { tag: "high", group: "strike", words: ["high"] },
  { tag: "low", group: "strike", words: ["low"] },
  { tag: "flush", group: "strike", words: ["flush", "flushed", "flushing"] },
  { tag: "pured", group: "strike", words: ["pured", "pure", "puring"] },
  { tag: "clean", group: "strike", words: ["clean", "cleanly"] },
  // Where it started and how it curved.
  { tag: "pull", group: "shape", words: ["pull", "pulled", "pulling", "pulls"] },
  { tag: "push", group: "shape", words: ["push", "pushed", "pushing", "pushes"] },
  { tag: "hook", group: "shape", words: ["hook", "hooked", "hooking", "hooks"] },
  { tag: "slice", group: "shape", words: ["slice", "sliced", "slicing", "slices"] },
  { tag: "fade", group: "shape", words: ["fade", "faded", "fading", "fades"] },
  { tag: "draw", group: "shape", words: ["draw", "drew", "drawn", "drawing", "draws"] },
  { tag: "block", group: "shape", words: ["block", "blocked", "blocking", "blocks"] },
  { tag: "flip", group: "shape", words: ["flip", "flipped", "flipping", "flippy", "flicked"] },
  // What kind of shot it was meant to be.
  { tag: "punch", group: "type", words: ["punch", "punched", "punching"] },
  { tag: "knockdown", group: "type", words: ["knockdown", "knockdowns", "knock down", "knocked down"] },
  { tag: "flighted", group: "type", words: ["flighted", "flighting", "flight it"] },
  { tag: "half", group: "type", words: ["half"] },
  { tag: "three-quarter", group: "type", words: ["three quarter", "three quarters"] },
  // How it felt.
  { tag: "felt great", group: "feel", words: ["felt great", "feel great", "feels great", "felt amazing", "felt lovely", "felt perfect"] },
  { tag: "good", group: "feel", words: ["good", "nice", "solid"] },
  { tag: "bad", group: "feel", words: ["bad", "awful", "terrible", "poor", "horrible", "rubbish"] },
  { tag: "rushed", group: "feel", words: ["rushed", "rush", "rushing", "hurried", "quick"] },
  { tag: "tense", group: "feel", words: ["tense", "tensed", "tension", "tight"] },
];
const GROUP_OF = Object.fromEntries(NOTE_TAGS.map((t) => [t.tag, t.group]));
export const tagGroup = (tag) => GROUP_OF[tag] ?? "feel";

// Words that say what follows didn't happen ("didn't pull it", "not
// thin"): up to two words before a tag's.
const NEGATORS = new Set(["not", "no", "never", "didn't", "didnt", "wasn't", "wasnt", "isn't", "isnt", "don't", "dont", "doesn't", "doesnt", "hardly", "without"]);

// The note's words, lower case: "Three-quarter, didn't pull it!" ->
// ["three", "quarter", "didn't", "pull", "it"].
function wordsOf(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/[^a-z0-9' ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

// Where each of a list of phrases is found in the words, and whether it's
// negated there: [{ at, negated }].
function find(words, phrases) {
  const out = [];
  for (const phrase of phrases) {
    const p = phrase.split(" ");
    for (let i = 0; i + p.length <= words.length; i++) {
      if (p.every((w, k) => words[i + k] === w)) out.push({ at: i, negated: [words[i - 1], words[i - 2]].some((w) => NEGATORS.has(w)) });
    }
  }
  return out;
}
const said = (words, phrases) => find(words, phrases).some((f) => !f.negated);

// The tags a note's words give, in the order they're listed above. A tag
// whose word is negated ("didn't pull it") isn't given.
export function noteTags(text) {
  const words = wordsOf(text);
  return NOTE_TAGS.filter((t) => said(words, t.words)).map((t) => t.tag);
}

// A note as it's kept: trimmed, one line, at most MAX_NOTE characters (cut
// at a word), first letter a capital. Empty when there's nothing to keep.
export const MAX_NOTE = 200;
export function cleanNote(text) {
  let t = String(text ?? "")
    .replace(/\s+/g, " ")
    .replace(/^[\s,.:;!?-]+/, "")
    .trim();
  if (t.length > MAX_NOTE) t = `${t.slice(0, MAX_NOTE).replace(/\s+\S*$/, "")}...`;
  return t ? t[0].toUpperCase() + t.slice(1) : "";
}

// ---- Notes kept with a shot ----------------------------------------------------------

// A note line from a player's stats file (server/stats.mjs), onto its shot
// as the file is read: { text, tags } adds a note (a shot can have several,
// oldest first), { drop } takes the latest back. Tags missing from a line
// are read from its words. Changes the shot.
export function applyNote(s, o) {
  if (o?.drop) {
    s.notes?.pop();
    if (!s.notes?.length) delete s.notes;
    return s;
  }
  const text = cleanNote(o?.text);
  if (!text) return s;
  const tags = Array.isArray(o.tags) ? o.tags.filter((t) => typeof t === "string" && GROUP_OF[t]) : noteTags(text);
  (s.notes ??= []).push({ text, tags, t: o.t ?? null });
  return s;
}
// Every tag of a shot's notes, once each, in the order they're listed.
export function tagsOf(s) {
  const all = new Set((s?.notes ?? []).flatMap((n) => n.tags));
  return NOTE_TAGS.map((t) => t.tag).filter((t) => all.has(t));
}

// ---- A note that says how it was struck -------------------------------------------

// The strike labels a note can set (as markShot("thin") does), and the
// words that clearly say each.
export const NOTE_STRIKES = {
  thin: ["thin", "thinned", "skulled", "bladed"],
  fat: ["fat", "heavy", "chunked", "chunky", "hit it fat"],
  topped: ["topped", "top it"],
  shank: ["shank", "shanked"],
  badhit: ["bad hit", "mishit", "duffed"],
};
// Words that make it less than certain ("a bit thin", "maybe fat").
const HEDGES = ["bit", "slightly", "little", "almost", "nearly", "maybe", "kind of", "sort of", "touch", "tad", "fairly", "somewhat", "probably", "might", "bordering", "semi"];
// Words for a good strike, or a shot that wasn't a normal full swing at all
// (a punch, a half swing): then a strike word isn't a label for it.
const NOT_A_LABEL = ["flush", "flushed", "pured", "pure", "clean", "cleanly", "good strike", "struck well", "struck fine", "punch", "punched", "knockdown", "knock down", "flighted", "half", "three quarter", "three quarters", "part swing", "partial", "chip", "chipped", "pitch"];

// The strike a note clearly says, or null - conservative, as setting it
// takes the shot out of the club's carry (or puts it back):
//  - exactly one bad strike named (thin, fat, topped, shank, or a word for
//    one: skulled and bladed are thin, heavy and chunked fat), and not
//    negated anywhere ("wasn't thin");
//  - nothing hedging it ("a bit thin", "maybe fat", or a question);
//  - nothing saying it was a good strike, or not a normal full swing (a
//    punch, a half swing, a chip) - the label is for a full swing's strike.
// The page also only sets it on a full swing (recorder.js).
export function noteStrike(text) {
  if (/\?/.test(String(text ?? ""))) return null;
  const words = wordsOf(text);
  const kinds = [];
  for (const [kind, phrases] of Object.entries(NOTE_STRIKES)) {
    const found = find(words, phrases);
    if (found.some((f) => f.negated)) return null;
    if (found.length) kinds.push(kind);
  }
  if (kinds.length !== 1) return null;
  if (find(words, HEDGES).length) return null;
  if (find(words, NOT_A_LABEL).length) return null;
  return kinds[0];
}
