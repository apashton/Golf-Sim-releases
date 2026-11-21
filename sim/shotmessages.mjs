// What the game says after a shot, instead of asking (the owner, 16
// October 2026: "we're still getting these big pop-ups on screen ... no
// pop-ups are needed, just the message box ... Anyone can change the shots
// in the shot history. At worst, it should be a note to say ... change
// your club if this is the wrong club"). Each is a message for the
// Messages box (messages.js): what was worked out about the shot, what was
// kept, and where to change it - Shot history (the club, a mishit, a punch
// or part swing, a misread) or My stats. Nothing waits for an answer. Pure:
// recorder.js sends them, with clubs already named ("7 iron").

import { STRIKE_NAMES, SPECIALS } from "./shotstats.mjs";

// "a 7 iron", "an 8 iron", "an 11 wood".
export const aClub = (name) => `${/^(8|11|18|[aeiou])/i.test(String(name)) ? "an" : "a"} ${name}`;
// "Your 7 iron", "Ben's 7 iron" (with friends playing).
const whose = (player, multi) => (multi && player ? `${player}'s` : "Your");
const yds = (v) => Math.round(v);
const listWords = (list) => (list.length < 2 ? list.join("") : `${list.slice(0, -1).join(", ")} or ${list.at(-1)}`);

// A club that flew like another (the server's club check): it stays out of
// that club's numbers until it's said - another club in Shot history, or
// "yes, it was" on My stats.
// With voice listening (voice), it's a question to answer out loud, with
// no wake word, while it shows (the owner, 10 November 2026: "if a shot
// looks off a notification might prompt the user to confirm"): "yes", it
// was that club; "no", the one picked; or "mishit". Not answered, it's
// left as it was, as ever.
export function clubCheckSaid({ club, looksLike, carry, player, multi = false, voice = false }) {
  const how = Number.isFinite(carry) ? ` (${yds(carry)} yds carry)` : "";
  if (voice) return `${whose(player, multi)} ${club} flew like ${aClub(looksLike)}${how} - the ${looksLike}? Say "yes", "no" (the ${club}) or "mishit"`;
  return `${whose(player, multi)} ${club} flew like ${aClub(looksLike)}${how} - wrong club? Change it in Shot history`;
}

// A wrong club so clear it was put right by itself (the server's club
// check, sure: shotstats.mjs OBVIOUS): counted as the club it flew like -
// and, on the range, that club picked for the next one (picked), the club
// left picked being how it happened. Z just after ("undo" with voice), or
// Shot history, puts it back.
export function clubMovedSaid({ club, looksLike, carry, player, multi = false, picked = false, voice = false }) {
  const how = Number.isFinite(carry) ? ` (${yds(carry)} yds carry)` : "";
  const theirs = multi && player ? `${player}'s` : "your";
  const now = picked ? `, and the ${looksLike}'s picked now` : "";
  return `${whose(player, multi)} ${club} flew like ${theirs} ${looksLike}${how} - counted as the ${looksLike}${now}. Not the ${looksLike}? ${voice ? `Say "undo" or Z` : "Z to undo"}, or Shot history`;
}

// A full swing well short of the club's usual (the server's unusual): left
// out of its numbers until it's marked - a punch or part swing (the
// likeliest first, by what the course asked of it), or a mishit.
const KIND_WORDS = { punch: "a punch", part: "a part swing" };
export function unusualSaid({ club, carry, usual, order = [], player, multi = false }) {
  const kinds = [...new Set([...order, ...SPECIALS])].filter((k) => KIND_WORDS[k]).map((k) => KIND_WORDS[k]);
  const what = listWords([...kinds, "a mishit"]);
  return `${whose(player, multi)} ${club} went ${yds(carry)} yds (usually ${yds(usual)}) - left out of its numbers. ${what[0].toUpperCase()}${what.slice(1)}? Mark it in Shot history`;
}

// A bad strike on the range: left out of the club's carry, as judged.
export function strikeSaid({ strike, club, why = "", player, multi = false }) {
  const name = STRIKE_NAMES[strike] ?? strike;
  const who = multi && player ? `${player}: ` : "";
  const not = strike === "badhit" ? "a bad hit" : name.toLowerCase();
  return `${who}${name}${why ? `: ${why}` : ""} - left out of your ${club}'s carry. Not ${not}? Mark it in Shot history`;
}

// A reading no real strike gives: left out of the stats until it's marked.
export const ODD_NOTE = "That shot didn't look right";
export function oddSaid({ odd, player, multi = false }) {
  const who = multi && player ? `${player}: ` : "";
  return `${who}${ODD_NOTE} - it read ${odd}, so it's left out of your stats. Mark it in Shot history: Misread to take it out, or Good, Thin... to keep it`;
}

// A chip or part swing that went like another power than the one said:
// kept as it was said (the power can be said again, "last shot fifty").
export function powerSaid({ club, carry, ask, said = null, words = (pw) => `${pw}%`, player, multi = false }) {
  const kept = said != null ? `kept as the ${words(said)} swing you said` : "kept as a normal chip";
  return `${whose(player, multi)} ${club} carried ${yds(carry)} yds, like your ${words(ask)} swings - ${kept}`;
}

// The end of a practice session: kept (My stats can make it Experimental,
// or leave it out, if it was just testing).
export function sessionSaid({ shots, minutes, players = [], multi = false }) {
  const who = multi && players.length ? ` (${players.join(", ")})` : "";
  return `That session${who}: ${shots} shot${shots === 1 ? "" : "s"} in ${Math.max(1, Math.round(minutes))} min, kept in your stats - just testing? My stats can leave it out`;
}

// A tip from how it went (sim/insights.mjs): its title, what showed it and
// what to practise, in one message.
export function tipSaid({ title, evidence = "", practice = "" }, { player, multi = false } = {}) {
  const who = multi && player ? `${player}: ` : "";
  return `${who}${title} - ${[evidence, practice].filter(Boolean).join(" ")}`.trim();
}
