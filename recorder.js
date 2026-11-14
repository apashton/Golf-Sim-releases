// The one place every shot is recorded from, for each player's stats.
//
// How a mode joins in (app.js gives every mode these two hooks):
//
//   this.onRecord?.({ club, ball, result, target, lie, toPin, intended,
//                     swing, game, player, air, onFix })
//     once a shot has finished. Only club and result.carry are needed:
//       ball      the launch monitor's numbers (entry.ball)
//       result    { carry, total, offline, apex, descent } in yards / degrees
//       target    { distance, finish, long, made } in yards: how far the
//                 target was, how far from it the ball finished, along the
//                 line (long +), and whether it went in
//       lie       where it was hit from; toPin / intended: yards to the flag
//                 and yards the player meant to hit it (for telling a part
//                 swing from a full one)
//       uneven    true off a slope or onto ground well above or below, or
//                 when a tree was in the way: the carry isn't a fair one,
//                 so it stays out of club numbers
//       swing     "putt", "chip"... when the mode knows; else it's worked out
//       game      { kind, id, ...a few plain fields } - which game or round
//                 the shot belongs to; left out, it's a practice session
//       player    whose shot (games with turns); left out, whoever is
//                 picked in "Who's hitting?"
//       air       { temperatureC, altitudeM } the shot flew in, when the
//                 mode lets them be changed (the range); left out, the
//                 20°C at sea level the other modes fly in
//       onFix     called with the right club if a club check changes it
//       onMark    called with what the player says about the shot
//                 ("misread", "good", "thin"...; "auto" when taken back)
//       clubData  the launch monitor's club data, when it came with the
//                 shot; shotNumber, which shot it was (app.js adds both, and
//                 club data that follows the shot is sent after it)
//
//   this.onGame?.({ kind, id, key, score, ...details })
//     when a game or round finishes. kind names the game, key which version
//     of it (a distance, a course), score what it scored. Course rounds win
//     on the lowest score, everything else on the highest.
//
// The server works out the swing type, how a full swing was struck,
// whether the reading looks like a misread and whether the club looks wrong
// for the shot (server/stats.mjs). Nothing pops up to ask about it (the
// owner, 16 October 2026: "no pop-ups are needed, just the message box"):
// a message says what was worked out and kept - a club that flew like
// another, a full swing so far short of the club's usual that it may have
// been a punch or a part swing, on the range a bad strike or a doubtful
// reading, a chip that went like another power than the one said - and
// Shot history is where it's changed (sim/shotmessages.mjs has the words).
// E before a shot says the next one is a special shot (a punch, a part
// swing...); Shift + E (or "power next fifty") says what power the next
// swing is - a part swing at that power, kept by it. The range's "Odd
// shot?" asks what was wrong with the last one, on a card, when it's asked.
// Delete takes the last shot out of the stats as a misread, anywhere.
// What's kept follows the recording switch (recording.js): each shot and
// game carries its format (round play, experimental), an experimental one
// is never asked about, and with recording off nothing is sent at all. A
// mouse swing always goes in as experimental.
//
// Voice answers the "Odd shot?" card while it shows (hear(): what
// sim/voicecmd.mjs made of a phrase, done as the card's keys and buttons
// would), keeps a note about a shot, and says a power for the next or the
// last shot.

import { gameXp } from "./sim/skills.mjs";
import { playerNames, PLAYER_COLOURS } from "./sim/players.mjs";
import { isGuest } from "./sim/profiles.mjs";
import { loadSetting, saveSetting, esc } from "./util.js";
import { clubName } from "./bay.js";
import { CLUB_ORDER, STRIKE_NAMES, SPECIAL_NAMES, SPECIALS } from "./sim/shotstats.mjs";
import { nextSpecial, SPECIAL_KEY } from "./sim/specialshot.mjs";
import { YARD } from "./sim/flight.mjs";
import { WEDGE_LOFTS } from "./sim/clubs.mjs";
import { REC_CODES } from "./sim/recording.mjs";
import { madeUpOf } from "./sim/madeuphcp.mjs";
import { powerName, powerWords, nextPower, cleanPower } from "./sim/power.mjs";
import { cleanNote, noteTags, noteStrike } from "./sim/shotnotes.mjs";
import { pushShot, changeShot, HISTORY_MARK_NAMES } from "./sim/shothistory.mjs";
import { clubCheckSaid, clubMovedSaid, unusualSaid, strikeSaid, oddSaid, powerSaid, sessionSaid, tipSaid } from "./sim/shotmessages.mjs";

const lower = (club) => clubName(club).toLowerCase();
// How long the "Odd shot?" card stays up.
const CHECK_MS = 15000;
// A session's end says so after this many shots.
const SESSION_MIN = 5;
// How long a message about a shot is given (its words stay in the
// Messages box).
const SAID_MS = 6000;
// How long after a shot Delete still takes it out, and its club data (which
// follows the shot by a moment) is still sent with it.
const LAST_MS = 120000;
// How long after an answer Z (or "undo") takes it back.
const UNDO_MS = 8000;
// How long an unsure club check's question ("the driver? Say yes or no")
// can be answered by voice, with no wake word: as long as it shows.
const ASK_MS = 10000;
// How long after a shot is hit it can still be in the air or rolling, not
// yet recorded (the course, the chipping and putting greens record a shot
// once the ball stops).
const FLIGHT_MS = 30000;
const BAD = new Set(["thin", "fat", "topped", "shank", "badhit"]);
const JSON_POST = { method: "POST", headers: { "Content-Type": "application/json" } };
// What's held for a shot still in the air, in words: "the note", "the
// power", "the club", "what it was".
const heldWords = (item) => (item.note != null ? "the note" : item.power != null ? "the power" : item.club ? "the club" : "the mark");
// A note in a toast: the start of it, if it's long.
const shortNote = (t) => (t.length > 60 ? `${t.slice(0, 57)}...` : t);
// What a card answer was, in a word or two.
const sayName = (say) => STRIKE_NAMES[say] ?? SPECIAL_NAMES[say] ?? { misread: "Misread", keep: "Kept" }[say] ?? say;
// What a player might say, or a page call pass, about a shot.
export function parseSay(value) {
  const t = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (/^(misread|remove|delete|take it out|bad read(ing)?|wrong)$/.test(t)) return "misread";
  if (/^(keep|keep it|real)$/.test(t)) return "keep";
  if (/^(good|fine|good strike|pure|ok)$/.test(t)) return "good";
  if (/^(thin|thinned|bladed)$/.test(t)) return "thin";
  if (/^(fat|heavy|chunked)$/.test(t)) return "fat";
  if (/^(top|topped)$/.test(t)) return "topped";
  if (/^(shank|shanked)$/.test(t)) return "shank";
  // Just a bad hit: not the swing meant, no fault named.
  if (/^(badhit|bad|bad hit|a bad hit|bad shot|a bad shot|bad one|a bad one|bad swing|poor|poor shot|mishit|mis-hit|mishit it|duff|duffed|duffed it|underpowered|under powered)$/.test(t)) return "badhit";
  // A special shot: a punch or knockdown kept low, a part swing, anything
  // else on purpose.
  if (/^(punch|punched|punch ?\/? ?low|low|low one|knock ?down|stinger|punch shot)$/.test(t)) return "punch";
  if (/^(part|part swing|partial|half|half swing|three ?quarters?|three ?quarter swing|quarter swing)$/.test(t)) return "part";
  if (/^(other|something else|special|special shot)$/.test(t)) return "other";
  if (t === "auto" || t === "undo") return "auto";
  return null;
}

// Words a voice or a typed answer might use for each club.
const NUMBERS = { one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9" };
export function parseClub(text) {
  if (typeof text !== "string") return null;
  let t = text.trim().toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ");
  t = t.replace(/\b(one|two|three|four|five|six|seven|eight|nine)\b/g, (w) => NUMBERS[w]);
  const up = t.replace(/ /g, "").toUpperCase();
  if (CLUB_ORDER.includes(up)) return up;
  for (const c of CLUB_ORDER) if (clubName(c).toLowerCase() === t) return c;
  // A bare number is an iron ("seven" - the 7 iron), as people say it.
  if (/^[4-9]$/.test(t)) return `${t}I`;
  const m = /^(\d) ?(iron|wood|hybrid|i|w|h)$/.exec(t);
  if (m) {
    const code = `${m[1]}${m[2][0].toUpperCase()}`;
    if (CLUB_ORDER.includes(code)) return code;
  }
  // A wedge by its loft: "52", "52°", "52 degree wedge" (° went with the tidying).
  const loft = /^(\d\d) ?(deg|degrees?)? ?(wedge)?$/.exec(t);
  if (loft) {
    const c = Object.keys(WEDGE_LOFTS).find((k) => WEDGE_LOFTS[k] === Number(loft[1]));
    if (c) return c;
  }
  const words = { driver: "DR", pitching: "PW", approach: "AW", gap: "GW", sand: "SW", lob: "LW", pw: "PW", aw: "AW", gw: "GW", sw: "SW", lw: "LW" };
  for (const [w, c] of Object.entries(words)) if (t.split(" ")[0] === w) return c;
  return null;
}

export class Recorder {
  constructor({ view, toast = () => {} }) {
    this.toast = toast;
    this.prefs = loadSetting("hitter", { name: null });
    // Practice sessions: an id per mode, started on first use and again
    // after a session ends (leaving the mode, Clear session).
    this.sessions = {};
    // When each game or session's first shot was, for its end-of-session
    // note, and how many shots it had.
    this.started = new Map();
    // The range's "Odd shot?" card on screen: { shot, kind: "strike" | "review" }
    this.review = null;
    // The last shot recorded: { player, id, club, mode, t, shotNumber,
    // strike, why, odd, onMark, clubSent }
    this.lastShot = null;
    this.recording = null; // { shotNumber, clubData } while its reply is awaited
    this.said = new Map(); // shot id -> what the player last said about it
    this.card = document.createElement("div");
    this.card.className = "corner-card club-check";
    this.card.hidden = true;
    this.card.addEventListener("click", (e) => this.click(e));
    view.appendChild(this.card);
    this.onHitter = () => {};
    this.last = null; // the last answer, for a few seconds: Z takes it back
    // What the next shot was said to be before it was hit (E, or a voice
    // command): "punch", "part", "other", or null. Cleared by that shot.
    this.special = null;
    this.specialEl = document.createElement("div");
    this.specialEl.className = "special-next";
    this.specialEl.hidden = true;
    this.specialEl.setAttribute("role", "button");
    this.specialEl.addEventListener("click", () => (this.power != null ? this.stepPower() : this.toggleSpecial()));
    view.appendChild(this.specialEl);
    // Called with the special kind (or null) whenever it changes, so a
    // panel's button can show it.
    this.onSpecial = () => {};
    // The recording format a shot or game in a mode goes in as
    // (recording.js): "practice", "round", "experimental" - kept, but asked
    // nothing about and in no numbers - or "off", not kept at all.
    this.formatFor = () => "practice";
    // Whether a player plays simple: asked nothing (app.js, from the players' profiles).
    this.simpleFor = () => false;
    // The next shot's power (Shift + E, "power next fifty", the chipping
    // panel), 10 - 100, or null. Cleared by that shot; a special shot and
    // a power are one or the other.
    this.power = null;
    // Called with the power (or null) whenever it changes (the chipping
    // panel's buttons show it).
    this.onPower = () => {};
    // In what order the latest shot was hit (struck()), the latest was
    // recorded and the next shot's mark was set (a count, as two can come
    // in the same millisecond), and when the shot was hit. Between a shot
    // being hit and recorded it's in the air or rolling: a note or a "last
    // shot" power said then is for it, and waits (held) until it's
    // recorded; a mark said then ("power next fifty") is for the shot after.
    this.seq = 0;
    this.strikeSeq = 0;
    this.recordSeq = 0;
    this.markSeq = 0;
    this.strikeAt = 0;
    this.held = [];
    // The last few shots recorded, newest first, to mark or change the club
    // of from the command centre's Shot history (sim/shothistory.mjs), and
    // each one's own record (its onMark, onFix). onHistory: the list
    // changed.
    this.recent = [];
    this.recentShots = new Map();
    this.onHistory = () => {};
    // Whether voice is listening (app.js): an unsure club check is then a
    // question voice can answer - "yes", "no", a club, "mishit" - while it
    // shows: { shot, looksLike, until } (voiceWaiting's "check").
    this.voiceOn = () => false;
    this.asking = null;
    // The last shot was another club than the one picked (put right by
    // itself, or said so): app.js picks that club for the next one where it
    // can, returning true if it did (and, called back the other way, puts it
    // back).
    this.onClubFixed = () => false;
  }

  // ---- The shot history -------------------------------------------------------

  remember(shot, result) {
    this.recent = pushShot(this.recent, { id: shot.id, player: shot.player, club: shot.club, mode: shot.mode, t: shot.t, carry: result?.carry, total: result?.total, shotNumber: shot.shotNumber });
    this.recentShots.set(shot.id, shot);
    for (const id of this.recentShots.keys()) if (!this.recent.some((s) => s.id === id)) this.recentShots.delete(id);
    this.onHistory();
  }

  // From the Shot history: what a shot was ("thin", "misread"... or
  // "auto": as it was judged). Z takes it back, as from a card.
  markFrom(id, say) {
    const shot = this.recentShots.get(id);
    if (!shot || (say !== "auto" && !parseSay(say))) return false;
    const prev = this.said.get(id) ?? "auto";
    this.sayAbout(shot, say);
    this.last = { kind: "mark", shot, say, prev, card: null, check: null, t: Date.now() };
    const what = say === "auto" ? "Back as it was judged" : `${HISTORY_MARK_NAMES[say] ?? say}`;
    this.toast(`${clubName(shot.club)}: ${what} - Z to undo`, 1800);
    return true;
  }

  // A wrong club the server put right as it recorded the shot (its club
  // check, sure): the shot is the club it flew like here too - the shot
  // history, the mode's own record (onFix) - and Z puts it back, as a
  // club changed in Shot history is.
  movedClub(shot, club, carry) {
    const was = shot.club;
    shot.club = club;
    shot.onFix?.(club);
    this.recent = changeShot(this.recent, shot.id, { club });
    this.onHistory();
    const picked = this.followClub(shot, club, was);
    this.last = { kind: "clubFrom", shot, was, picked, t: Date.now() };
    this.toast(clubMovedSaid({ club: lower(was), looksLike: lower(club), carry, player: shot.player, multi: this.multi, picked, voice: this.voiceOn() }), SAID_MS);
  }

  // The latest shot was another club than the one picked: that club picked
  // for the next one too, where app.js can (onClubFixed). True if it was.
  followClub(shot, club, was) {
    if (shot !== this.lastShot) return false;
    try {
      return this.onClubFixed(shot, club, was) === true;
    } catch {
      return false;
    }
  }

  // What the player said the shot was hit with - by voice, "last shot
  // seven iron", or "yes" or "no" to the club check's question: the club
  // it was recorded with (a yes to it), or another (counted as that, and
  // picked for the next one where it can be). Z takes it back.
  shotWasClub(shot, club) {
    this.asking = null;
    const was = shot.club;
    const who = this.multi ? `${shot.player}'s` : "your";
    this.post({ player: shot.player, id: shot.id, club });
    if (club === was) {
      this.last = { kind: "clubYes", shot, asked: shot.told === "check", t: Date.now() };
      this.toast(`Last shot: kept as ${who} ${lower(club)} - Z to undo`, 2000);
      return { done: `kept as the ${lower(club)}`, short: `Kept: ${clubName(club)}` };
    }
    shot.club = club;
    shot.onFix?.(club);
    this.recent = changeShot(this.recent, shot.id, { club });
    this.onHistory();
    const picked = this.followClub(shot, club, was);
    this.last = { kind: "clubFrom", shot, was, picked, t: Date.now() };
    this.toast(`Last shot: counted as ${who} ${lower(club)}, not the ${lower(was)}${picked ? ` - the ${lower(club)}'s picked now` : ""} - Z to undo`, 2500);
    return { done: `counted as the ${lower(club)}`, short: `Last: ${clubName(club)}` };
  }

  // From the Shot history: the club it really was.
  clubFrom(id, club) {
    const shot = this.recentShots.get(id);
    if (!shot || !club || club === shot.club) return false;
    const was = shot.club;
    this.post({ player: shot.player, id, club });
    shot.club = club;
    shot.onFix?.(club);
    this.recent = changeShot(this.recent, id, { club });
    this.onHistory();
    this.last = { kind: "clubFrom", shot, was, t: Date.now() };
    this.toast(`Recorded as a ${lower(club)} - Z to undo`, 2000);
    return true;
  }

  // Not recording: the shot still flew and the game still scores, but
  // nothing is kept - and a special shot said for it is used up. It's the
  // last shot now, so Delete (a misread) has nothing to take out, rather
  // than taking out the one recorded before it.
  notRecorded() {
    // A power or special shot said for it is used up too (one said after
    // it was hit is for the next shot), and anything held while it flew
    // goes with it, so it can't land on a later shot.
    const mine = !(this.strikeSeq && this.markSeq > this.strikeSeq);
    if (mine) {
      if (this.special) this.setSpecial(null);
      if (this.power != null) this.setPower(null);
    }
    this.held = [];
    this.recordSeq = ++this.seq;
    this.lastShot = null;
    return null;
  }

  // A shot has just been hit (app.js, as the launch monitor's shot comes
  // in, before the mode takes it).
  struck() {
    this.strikeSeq = ++this.seq;
    this.strikeAt = Date.now();
    // The club check's question was about the shot before.
    this.asking = null;
  }
  // A shot hit and not recorded yet, still in the air or rolling.
  get inFlight() {
    return this.strikeSeq > this.recordSeq && Date.now() - this.strikeAt < FLIGHT_MS;
  }

  // ---- Special shot next ------------------------------------------------------

  // E: the next shot is a special one - punch / low, then part swing, then
  // something else, then off again. Returns the kind now set (or null).
  toggleSpecial() {
    this.setSpecial(nextSpecial(this.special));
    if (this.special) this.toast(`Next shot: ${SPECIAL_NAMES[this.special]}`, 1600);
    else this.toast("Next shot: a normal swing", 1400);
    return this.special;
  }
  setSpecial(kind) {
    this.special = SPECIALS.includes(kind) ? kind : null;
    if (this.special) this.markSeq = ++this.seq;
    if (this.special && this.power != null) {
      this.power = null;
      this.onPower(null);
    }
    this.showNext();
    this.onSpecial(this.special);
  }

  // The next shot's power: a part swing at it (a chip or pitch keeps its
  // power), 10 - 100 in fives, or null for a normal swing.
  setPower(pw) {
    this.power = cleanPower(pw);
    if (this.power != null) this.markSeq = ++this.seq;
    if (this.power != null && this.special) {
      this.special = null;
      this.onSpecial(null);
    }
    this.showNext();
    this.onPower(this.power);
  }
  // Shift + E: 25%, 50%, 75%, full, then off. Returns the power now set.
  stepPower() {
    this.setPower(nextPower(this.power));
    this.toast(this.power != null ? `Next shot: ${powerWords(this.power)} swing` : "Next shot: a normal swing", 1600);
    return this.power;
  }

  // The pill in the corner: what the next shot was said to be.
  showNext() {
    const el = this.specialEl;
    el.hidden = !this.special && this.power == null;
    if (this.power != null) {
      el.innerHTML = `Next shot: <b>${esc(powerName(this.power))} swing</b> <span>${this.power < 100 ? "kept with its power" : "a full swing"}</span> <kbd>Shift + ${SPECIAL_KEY}</kbd>`;
    } else {
      el.innerHTML = this.special ? `Next shot: <b>${esc(SPECIAL_NAMES[this.special])}</b> <span>not in club stats</span> <kbd>${SPECIAL_KEY}</kbd>` : "";
    }
  }

  // ---- Who's hitting --------------------------------------------------------

  // The same players as the course's list.
  get players() {
    return playerNames(loadSetting("course", {}).players);
  }
  get hitter() {
    const list = this.players;
    return list.includes(this.prefs.name) ? this.prefs.name : list[0];
  }
  set hitter(name) {
    this.prefs.name = name;
    saveSetting("hitter", this.prefs);
    this.onHitter(name);
  }
  get multi() {
    return this.players.length > 1;
  }
  // Their colour: their profile's (playerColours, from app.js: sim/
  // profiles.mjs playingColours), else their place in the list's.
  colour(name) {
    const list = this.players;
    const at = Math.max(0, list.indexOf(name));
    return this.playerColours?.(list)[at] ?? PLAYER_COLOURS[at];
  }
  // U: on to the next player in the list.
  nextHitter() {
    const list = this.players;
    this.hitter = list[(list.indexOf(this.hitter) + 1) % list.length];
    return this.hitter;
  }

  // ---- Sessions -------------------------------------------------------------

  session(mode) {
    if (!this.sessions[mode]) this.sessions[mode] = newId();
    return this.sessions[mode];
  }

  // A practice session is over (leaving the mode, clearing it): said, and a
  // short note on how it went, when there were enough shots to say.
  endSession(mode) {
    const id = this.sessions[mode];
    delete this.sessions[mode];
    if (!id) return;
    this.sessionEnded(id);
    this.noteFor(id);
  }

  // As a session ends - a practice mode left or cleared, a game finished -
  // with enough shots counted from it: a message that it's kept (My stats
  // makes one that was just testing Experimental, or leaves it out). Nothing
  // asked: the usual answer shouldn't need one.
  sessionEnded(id) {
    const s = this.started.get(id);
    if (!s || s.counted < SESSION_MIN) return;
    this.toast(sessionSaid({ shots: s.counted, minutes: (Date.now() - s.t) / 60000, players: [...s.players], multi: this.multi }), SAID_MS);
  }

  async noteFor(gameId, player = null) {
    const s = this.started.get(gameId);
    this.started.delete(gameId);
    if (!s || s.shots < 8) return;
    // No tips for a player playing simple.
    if (this.simpleFor(player ?? s.player)) return;
    try {
      const name = player ?? s.player;
      // (A left-hander's tips the right way round: sim/insights.mjs.)
      const r = await fetch(`/api/stats/player?name=${encodeURIComponent(name)}&since=${s.t}&hand=${this.handFor?.(name) ?? "right"}`).then((res) => res.json());
      const note = r.insights?.[0];
      if (note) this.toast(tipSaid(note, { player: name, multi: this.multi }), SAID_MS);
    } catch {
      // No note this time.
    }
  }

  // ---- Recording ------------------------------------------------------------

  // made: a made-up swing's { device: "controller" | "mouse", level }
  // (sim/swinglevels.mjs), counted towards the game's (game).
  async record({ mouse = false, made = null, ...ctx }) {
    let format = this.formatFor(ctx.mode);
    // A mouse swing (mouseswing.js) is nobody's real strike: kept, but out
    // of every number, tip and club check, as an experimental shot is.
    if (mouse && format !== "off") format = "experimental";
    if (format === "off") return this.notRecorded();
    const player = ctx.player ?? this.hitter;
    // A guest (sim/profiles.mjs): played as anyone's, kept in nobody's stats.
    if (isGuest(player)) return this.notRecorded();
    const game = ctx.game ?? { kind: ctx.mode, id: this.session(ctx.mode) };
    if (!this.started.has(game.id)) this.started.set(game.id, { t: Date.now() - 1000, shots: 0, counted: 0, player, players: new Set(), mouse: new Set(), swings: new Map() });
    const started = this.started.get(game.id);
    started.shots++;
    started.players.add(player);
    // Who has swung with the mouse in it: their score is kept out too (game).
    if (mouse) started.mouse.add(player);
    // Each player's shots in it, and how many were made-up swings with
    // which device at which level: for their mouse or controller handicap
    // (madeUpOf).
    const sw = started.swings.get(player) ?? { shots: 0, made: {} };
    sw.shots++;
    if (mouse && made?.device) {
      const k = `${made.device}|${made.level ?? ""}`;
      sw.made[k] = (sw.made[k] ?? 0) + 1;
    }
    started.swings.set(player, sw);
    // Experimental shots are out of the numbers already: nothing to ask. A
    // player playing simple (a young child: sim/players.mjs) is asked
    // nothing either, their shots kept as anyone's.
    const simple = format !== "experimental" && this.simpleFor(player);
    if (format !== "experimental" && !simple) started.counted++;
    const body = { ...ctx, player, game, rec: REC_CODES[format], ...(simple ? { simple: true } : {}) };
    // Said about this shot while it was in the air: its power, and notes
    // (kept once it has an id).
    const held = this.held;
    this.held = [];
    const heldPower = held.findLast((h) => h.power != null);
    // Said before the shot: its power, or a special one. Only for this shot;
    // one said after it was hit is for the next.
    const mine = !(this.strikeSeq && this.markSeq > this.strikeSeq);
    if (heldPower) body.power = heldPower.power;
    if (mine && (this.power != null || this.special)) {
      if (!heldPower) {
        if (this.power != null) body.power = this.power;
        else body.special = this.special;
      }
      this.setPower(null);
      this.setSpecial(null);
    }
    delete body.onFix;
    delete body.onMark;
    delete body.shotNumber;
    const recording = { shotNumber: ctx.shotNumber, clubData: null };
    this.recording = recording;
    let reply = null;
    try {
      // Tried twice (a moment's hiccup on the server), then given up on.
      for (let attempt = 0; attempt < 2 && !reply; attempt++) {
        try {
          const res = await fetch("/api/stats/shot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
          if (res.ok) reply = await res.json();
          // (Refused as it is: sending it again won't change that.)
          else if (res.status < 500) break;
        } catch {
          // Tried again, once.
        }
      }
    } finally {
      if (this.recording === recording) this.recording = null;
      this.recordSeq = ++this.seq;
    }
    if (!reply) {
      // The shot still plays; it just isn't in the stats - and it's the last
      // shot now, so Delete can't take out the one kept before it.
      this.lastShot = null;
      this.toast("That shot couldn't be kept in your stats", 2500);
      return null;
    }
    const shot = {
      player,
      id: reply.id,
      club: ctx.club,
      mode: ctx.mode,
      t: Date.now(),
      shotNumber: ctx.shotNumber,
      strike: reply.strike,
      why: reply.why,
      odd: reply.odd,
      onMark: ctx.onMark,
      onFix: ctx.onFix,
      clubSent: !!ctx.clubData,
      unusual: reply.unusual ?? null,
      // Its swing and power as recorded (a power said later changes them).
      sw: reply.swing ?? null,
      pw: reply.power ?? null,
      rpw: reply.power ?? null,
      modswing: reply.modswing ?? null,
    };
    // What was said about it (the club data that follows can change a
    // strike said, or one that was fine).
    shot.told = simple || reply.simple ? "simple" : reply.unusual ? "unusual" : reply.check ? "check" : reply.modswing ? "power" : reply.special || (body.power != null && reply.power != null) ? "said" : "fine";
    this.lastShot = shot;
    this.remember(shot, ctx.result);
    if (simple || reply.simple) {
      // Nothing to say.
    } else if (reply.unusual) this.toast(unusualSaid({ club: lower(shot.club), carry: reply.unusual.carry, usual: reply.unusual.usual, order: reply.unusual.order, player, multi: this.multi }), SAID_MS);
    else if (reply.check?.moved) this.movedClub(shot, reply.check.looksLike, ctx.result?.carry);
    else if (reply.check) {
      // With voice listening it's a question voice can answer while it shows.
      const voice = !!this.voiceOn();
      if (voice) this.asking = { shot, looksLike: reply.check.looksLike, until: Date.now() + ASK_MS };
      this.toast(clubCheckSaid({ club: lower(shot.club), looksLike: lower(reply.check.looksLike), carry: ctx.result?.carry, player, multi: this.multi, voice }), voice ? ASK_MS : SAID_MS);
    }
    else if (reply.modswing) this.tellPower(shot);
    else if (reply.special) this.toast(`${SPECIAL_NAMES[reply.special]} - kept out of the ${lower(ctx.club)}'s numbers`, 1800);
    else if (body.power != null && reply.power != null) this.toast(`${powerName(reply.power)} swing - kept with the ${lower(ctx.club)}'s ${powerWords(reply.power)} distances`, 1800);
    else this.tellStrike(shot);
    // Notes said while it was in the air, now it's in the stats. The last
    // thing said can still be taken back.
    for (const h of held) {
      if (h.note == null) continue;
      const done = this.noteOn(shot, h.note, { quiet: true });
      if (this.last?.kind === "held" && this.last.item === h) this.last = done;
    }
    if (heldPower && this.last?.kind === "held" && this.last.item === heldPower) this.last = { kind: "power", shot, prev: null, recorded: true, t: Date.now() };
    // "This shot seven iron", "this shot mishit", said while it was in the
    // air: now it's recorded. (The last thing said can be taken back.)
    const heldClub = held.findLast((h) => h.club);
    const heldSay = held.findLast((h) => h.say);
    if (heldClub && heldClub.club !== "PT" && shot.club !== "PT") this.shotWasClub(shot, heldClub.club);
    if (heldSay && parseSay(heldSay.say)) this.markOn(shot, heldSay.say);
    // Club data that came while the shot was being recorded.
    if (recording.clubData) this.clubData(recording.clubData);
    return reply;
  }

  // A note or a "last shot" power said while the shot is still in the air:
  // kept for it until it's recorded, or dropped if it never is (a shot the
  // mode didn't take - on the course with no round going, say).
  hold(item) {
    this.held.push(item);
    this.last = { kind: "held", item, t: Date.now() };
    setTimeout(() => {
      if (!this.held.includes(item) || this.inFlight) return;
      this.held = this.held.filter((h) => h !== item);
      this.toast(`That shot wasn't recorded - ${heldWords(item)} wasn't kept`, 2500);
    }, Math.max(0, this.strikeAt + FLIGHT_MS - Date.now()) + 100);
  }

  // The launch monitor's club data, which follows its shot by a moment
  // ({ shotNumber, clubData }, the server's "club" event): kept with the
  // shot in the stats, and the strike judged again with it.
  async clubData({ shotNumber, clubData }) {
    if (!clubData) return;
    if (this.recording && this.recording.shotNumber === shotNumber) {
      this.recording.clubData = { shotNumber, clubData };
      return;
    }
    const shot = this.lastShot;
    if (!shot || shot.clubSent || shot.shotNumber !== shotNumber || Date.now() - shot.t > LAST_MS) return;
    const quiet = this.simpleFor(shot.player);
    shot.clubSent = true;
    let reply;
    try {
      const res = await fetch("/api/stats/club", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ player: shot.player, id: shot.id, clubData }) });
      if (!res.ok) return;
      reply = await res.json();
    } catch {
      return;
    }
    const was = { strike: shot.strike, odd: shot.odd };
    Object.assign(shot, { strike: reply.strike, why: reply.why, odd: reply.odd });
    if (quiet || this.said.has(shot.id)) return; // simple play, or the player has had their say
    // Judged again on it: said again if that's changed what was said (a
    // shot with something else said about it - its club, a power - was
    // never said to be a bad strike).
    const told = shot.told;
    if (told !== "strike" && told !== "fine") return;
    const bad = BAD.has(reply.strike) || !!reply.odd;
    if (bad && (reply.strike !== was.strike || reply.odd !== was.odd)) this.tellStrike(shot);
    else if (!bad && was.strike !== reply.strike && (BAD.has(was.strike) || was.odd)) this.toast(`${clubName(shot.club)}: a good strike after all, on its club data - it counts`, 2500);
  }

  // mouse: a mouse swing went into the score (a practice plan's drill says
  // so); a game's own shots say so as they're recorded.
  async game({ mouse = false, ...g }) {
    let format = this.formatFor(g.mode);
    const player = g.player ?? this.hitter;
    // A score made with a mouse swing is nobody's real one: kept, but out of
    // every number, as the mouse swing itself is (record).
    if ((mouse || this.started.get(g.id)?.mouse.has(player)) && format !== "off") format = "experimental";
    if (format === "off" || isGuest(player)) return;
    // A round played with the mouse or a controller: which, and at what
    // level, for that handicap (sim/madeuphcp.mjs).
    const made = madeUpOf(this.started.get(g.id)?.swings.get(player));
    const body = { ...g, player, rec: REC_CODES[format], ...(made ? { sw: made.device, lv: made.level } : {}) };
    delete body.mode;
    try {
      // Kept going if the page is closing (a reload mid-round saves it).
      const res = await fetch("/api/stats/game", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), keepalive: true });
      // Played with made-up swings: the skill XP it earned (sim/skills.mjs).
      if (res.ok && made) this.onSkillXp?.(player, gameXp({ ...body, t: Date.now() }));
    } catch {
      // Not in the history, but the game itself still counted.
    }
    // And towards moving up a level (app.js, sim/levelup.mjs).
    if (made) this.onMadeUpRound?.(player, body);
    if (!g.id) return;
    this.sessionEnded(g.id);
    if (g.note !== false) this.noteFor(g.id, player);
    else this.started.delete(g.id);
  }

  // ---- What's said after a shot ----------------------------------------------

  // After a full swing on the range judged a bad strike, or whose reading
  // looks like no real strike: said, and left as it was judged - a bad
  // strike out of the club's carry, a doubtful reading out of the stats -
  // until it's marked otherwise in Shot history (Misread takes it out for
  // good, Good, Thin... keep it). Nothing when the shot was fine.
  tellStrike(shot) {
    if (shot.mode !== "range") return;
    const who = { player: shot.player, multi: this.multi };
    if (shot.odd) this.toast(oddSaid({ odd: shot.odd, ...who }), SAID_MS);
    else if (BAD.has(shot.strike)) this.toast(strikeSaid({ strike: shot.strike, club: lower(shot.club), why: shot.why, ...who }), SAID_MS);
    else return;
    shot.told = "strike";
  }

  // After a chip or part swing that went like another power than the one
  // said (or, on the chipping green, a power when none was): the server's
  // modswing (sim/modswing.mjs). Said, and kept as it was said - "last
  // shot fifty" says it was another.
  tellPower(shot) {
    const m = shot.modswing;
    if (!m) return;
    this.toast(powerSaid({ club: lower(shot.club), carry: m.carry, ask: m.ask, said: m.said, words: powerWords, player: shot.player, multi: this.multi }), SAID_MS);
  }

  // ---- The "Odd shot?" card -------------------------------------------------------

  // Asked for (the range's "Odd shot?"): kind "strike" (it was judged a
  // bad strike) or "review" (what was wrong with it?).
  showCard(shot, kind) {
    this.review = { shot, kind };
    const who = this.multi ? `${esc(shot.player)}: ` : "";
    const club = esc(lower(shot.club));
    const words = (w) => (w ? esc(w[0].toUpperCase() + w.slice(1)) : "");
    // The other strikes, and the special shots (a punch on purpose isn't
    // a thin one).
    const others = (skip) =>
      ["thin", "fat", "topped", "shank", "badhit"]
        .filter((q) => q !== skip)
        .map((q) => `<button data-say="${q}">${STRIKE_NAMES[q]}</button>`)
        .join("") + SPECIALS.map((q) => `<button data-say="${q}">${SPECIAL_NAMES[q]}</button>`).join("");
    let body;
    if (kind === "strike") {
      body = `
        <div class="cc-q">${who}${STRIKE_NAMES[shot.strike]} - left out of your ${club}'s carry</div>
        ${shot.why ? `<div class="cc-why">${words(shot.why)}.</div>` : ""}
        <div class="cc-buttons">
          <button data-say="${shot.strike}">Yes, ${esc(STRIKE_NAMES[shot.strike].toLowerCase())} <kbd>Y</kbd></button>
          <button data-say="good">No, a good strike <kbd>K</kbd></button>
          <button data-say="misread">Misread - take it out <kbd>Del</kbd></button>
        </div>
        <div class="cc-others">${others(shot.strike)}</div>`;
    } else {
      body = `
        <div class="cc-q">${who}That ${club} - what was wrong with it?</div>
        <div class="cc-why">A thin or fat one, or just a bad hit, stays in your stats but out of what the ${club} carries; a misread comes out of everything.</div>
        <div class="cc-buttons">
          <button data-say="badhit">Just a bad hit <kbd>B</kbd></button>
          <button data-say="misread">Misread - take it out <kbd>Del</kbd></button>
          <button data-say="good">Nothing - a good strike <kbd>K</kbd></button>
        </div>
        <div class="cc-others">${others("badhit")}</div>`;
    }
    this.card.className = `corner-card club-check strike-card ${kind}`;
    this.card.innerHTML = `${body}<div class="cc-timer"></div>`;
    this.show(CHECK_MS);
  }

  // The range's "Odd shot?" button: the card for the last shot, whatever
  // was worked out about it. False when there's no shot to say it about.
  reviewLast() {
    const shot = this.lastShot;
    if (!shot || Date.now() - shot.t > LAST_MS) return false;
    this.showCard(shot, BAD.has(shot.strike) ? "strike" : "review");
    return true;
  }

  // What the player says about a shot: the one on the "Odd shot?" card,
  // else the last one recorded (Delete, anywhere). "misread",
  // "keep", "good", "thin", "fat", "topped" or "shank" (or words for them:
  // parseSay). A special shot - "punch", "part", "other" - answers the card
  // showing, and with none showing says it about the next shot (as E
  // does). This is what a voice command can call
  // (window.golfsim.markShot). True when it was taken.
  markShot(value) {
    const say = parseSay(value);
    if (!say || say === "auto") return false;
    if (SPECIALS.includes(say) && !this.review) {
      this.setSpecial(say);
      this.toast(`Next shot: ${SPECIAL_NAMES[say]}`, 1600);
      return true;
    }
    let shot = this.review?.shot ?? null;
    shot ??= this.lastShot && Date.now() - this.lastShot.t <= LAST_MS ? this.lastShot : null;
    if (!shot) return false;
    this.markOn(shot, say);
    return true;
  }

  // What a shot was (markShot's words), said about that shot: the card
  // asking about it answered (Z puts it back), the club check's question
  // too.
  markOn(shot, say) {
    const card = this.review?.shot === shot ? this.review.kind : null;
    const prev = this.said.get(shot.id) ?? "auto";
    if (card) this.close();
    if (this.asking?.shot === shot) this.asking = null;
    this.sayAbout(shot, say);
    this.last = { kind: "mark", shot, say, prev, card, t: Date.now() };
    const who = this.multi ? `${shot.player}'s` : "your";
    if (say === "misread") this.toast(`Taken out of ${who} stats as a misread - Z to undo`, 2500);
    else if (say === "keep") this.toast("Kept - it counts", 1400);
    else if (say === "good") this.toast(`Good strike - it counts for the ${lower(shot.club)} - Z to undo`, 2000);
    else if (SPECIALS.includes(say)) this.toast(`${SPECIAL_NAMES[say]} - kept out of the ${lower(shot.club)}'s numbers - Z to undo`, 2000);
    else this.toast(`${STRIKE_NAMES[say]} - kept out of the ${lower(shot.club)}'s carry - Z to undo`, 2000);
  }

  sayAbout(shot, say) {
    if (say === "auto") this.said.delete(shot.id);
    else this.said.set(shot.id, say);
    if (this.recentShots.has(shot.id)) {
      this.recent = changeShot(this.recent, shot.id, { say: say === "auto" ? null : say });
      this.onHistory();
    }
    fetch("/api/stats/mark", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ player: shot.player, id: shot.id, say }) }).catch(() => {});
    shot.onMark?.(say);
  }

  show(ms) {
    this.card.hidden = false;
    // The bar starts again from full each time.
    const bar = this.card.querySelector(".cc-timer");
    bar.style.animation = "none";
    void bar.offsetWidth;
    bar.style.animation = "";
    bar.style.animationDuration = `${ms}ms`;
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => this.close(), ms);
  }

  close() {
    clearTimeout(this.hideTimer);
    this.card.hidden = true;
    this.review = null;
  }

  get open() {
    return !this.card.hidden;
  }

  click(e) {
    const b = e.target.closest("button");
    if (b?.dataset.say) this.markShot(b.dataset.say);
  }

  // A club put right in Shot history, to the server.
  post(body) {
    fetch("/api/stats/answer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => {});
  }

  // A power said about a shot after it (pw 10 - 100, or "auto" for the one
  // it was recorded with): to the server, and onto the page's own shot.
  // none: back to no power at all, not the one it was recorded with (a
  // power said while the shot was in the air went on as recorded).
  postPower(shot, pw, { none = false } = {}) {
    shot.pw = pw === "auto" ? (none ? null : (shot.rpw ?? null)) : pw;
    if (!this.said.has(shot.id)) this.said.set(shot.id, "power");
    const body = { player: shot.player, id: shot.id, pw: none ? "none" : pw };
    fetch("/api/stats/power", { ...JSON_POST, body: JSON.stringify(body) })
      .then((res) => (res.ok ? res.json() : null))
      .then((j) => {
        if (j?.swing) shot.sw = j.swing;
      })
      .catch(() => {});
  }

  // A course shot's ball called unplayable where it came to rest (course.js):
  // n penalty strokes kept with the shot, for the round stats.
  unplayable({ player, id, n }) {
    if (!id) return;
    fetch("/api/stats/unplayable", { ...JSON_POST, body: JSON.stringify({ player, id, n }) }).catch(() => {});
  }

  postNote(shot, body) {
    fetch("/api/stats/note", { ...JSON_POST, body: JSON.stringify({ player: shot.player, id: shot.id, ...body }) }).catch(() => {});
  }

  // ---- Voice ------------------------------------------------------------------------

  // What the card showing now (the range's "Odd shot?") can be answered
  // with by voice (sim/voicecmd.mjs CARD_ACCEPTS), and whether an answer
  // can still be taken back. Nothing bare is heard with no card up.
  voiceWaiting() {
    const card = this.open && this.review ? this.review.kind : this.askingNow() ? "check" : null;
    return { card, undo: this.canUndo() };
  }

  // Whether the club check's question about the last shot is still showing.
  askingNow() {
    const a = this.asking;
    return !!a && a.shot === this.lastShot && Date.now() <= a.until;
  }

  // Whether Z (or "undo") would take something back now: an answer within
  // a few seconds.
  canUndo() {
    const l = this.last;
    return !!l && Date.now() - l.t <= UNDO_MS;
  }

  // The shot a voice note or "last shot fifty percent" is about: the one
  // the card is asking about, else the last one (for two minutes).
  voiceShot() {
    if (this.review?.shot) return this.review.shot;
    const l = this.lastShot;
    return l && Date.now() - l.t <= LAST_MS ? l : null;
  }

  // What voice heard (sim/voicecmd.mjs hear), done as the keys and buttons
  // would: an answer to the card showing, a note, a power for the next or
  // the last shot, a special shot next, or "undo". Returns { done, short }
  // when it was done, or { why } when it couldn't be.
  hear(r) {
    if (!r) return { why: "Didn't catch that" };
    if (r.undo) return this.undo() ? { done: "taken back", short: "Taken back" } : { why: "Nothing to take back" };
    if (r.note != null) return this.addNote(r.note);
    if (r.badPower != null) return { why: `A power is 10 to 100%, in fives - not ${r.badPower}` };
    if (r.when === "next" && (r.special || r.power != null)) {
      const was = { special: this.special, power: this.power };
      if (r.special) this.setSpecial(r.special);
      else this.setPower(r.power);
      this.last = { kind: "next", ...was, t: Date.now() };
      const words = r.special ? SPECIAL_NAMES[r.special] : `${powerWords(r.power)} swing`;
      this.toast(`Next shot: ${words} - Z undoes`, 1800);
      return { done: `next shot ${words.toLowerCase()}`, short: `Next: ${r.special ? words : powerName(r.power)}` };
    }
    if (r.when === "last" && r.power != null) return this.powerLast(r.power);
    if (r.lastClub || r.lastSay) return this.lastShotSaid(r);
    const card = this.voiceWaiting().card;
    if (!card) return { why: "No card to answer" };
    if (card === "check" && !this.review) return this.answerCheck(r);
    return this.answerCard(card, r);
  }

  // "Last shot seven iron", "last shot mishit": the shot just hit - kept for
  // it while it's still in the air - else the one the club check or a card
  // asks about, else the last one recorded (for two minutes).
  lastShotSaid(r) {
    if (r.lastSay && !parseSay(r.lastSay)) return { why: "Didn't catch what it was" };
    if (this.inFlight) {
      const item = r.lastClub ? { club: r.lastClub } : { say: r.lastSay };
      this.hold(item);
      const words = r.lastClub ? `the ${lower(r.lastClub)}` : sayName(r.lastSay).toLowerCase();
      this.toast(`This shot: ${words} - Z undoes`, 2200);
      return { done: `this shot ${words}`, short: `This: ${r.lastClub ? clubName(r.lastClub) : sayName(r.lastSay)}` };
    }
    const shot = (this.askingNow() ? this.asking.shot : null) ?? this.voiceShot();
    if (!shot) return { why: "No shot to say that about" };
    if (r.lastClub) {
      if (r.lastClub === "PT" || shot.club === "PT") return { why: "A putt is a putt" };
      return this.shotWasClub(shot, r.lastClub);
    }
    this.markOn(shot, r.lastSay);
    return { done: sayName(r.lastSay).toLowerCase(), short: `Last: ${sayName(r.lastSay)}` };
  }

  // An answer to the club check's question ("Your 7 iron flew like a
  // driver - the driver?"): yes, it was the club it flew like; no, the one
  // picked; another club; a mishit or a misread.
  answerCheck(r) {
    const { shot, looksLike } = this.asking;
    if (r.answer === "yes") return this.shotWasClub(shot, looksLike);
    if (r.answer === "no") return this.shotWasClub(shot, shot.club);
    if (r.answer === "club") return this.shotWasClub(shot, r.club);
    if (r.say === "misread" || r.say === "badhit") {
      this.markOn(shot, r.say);
      return { done: sayName(r.say).toLowerCase(), short: `Heard: ${sayName(r.say)}` };
    }
    return { why: `Say "yes" for the ${lower(looksLike)}, or "no" for the ${lower(shot.club)}` };
  }

  // A bare answer to the card showing (sim/voicecmd.mjs CARD_ACCEPTS): a
  // strike card's, or "what was wrong with it?".
  answerCard(card, r) {
    const shot = this.review?.shot ?? null;
    const took = (ok, words) => (ok ? { done: words.toLowerCase(), short: `Heard: ${words}` } : { why: "Couldn't take that answer" });
    if (r.say === "misread") return took(this.markShot("misread"), "Misread");
    if (!shot) return { why: "Not an answer to that card" };
    if (r.answer === "yes") {
      const q = card === "strike" || BAD.has(shot.strike) ? shot.strike : null;
      return q && BAD.has(q) ? took(this.markShot(q), STRIKE_NAMES[q]) : { why: "Say what it was: a punch, a part swing, thin, fat..." };
    }
    if (r.answer === "no") return took(this.markShot("good"), "Good strike");
    if (r.say) return took(this.markShot(r.say), sayName(r.say));
    if (r.power != null) return this.partAt(shot, r.power);
    return { why: "Not an answer to that card" };
  }

  // "Half swing", "fifty percent" on a card about a full swing: it was a
  // part swing, at that power - the card answered as Part swing is, and the
  // power kept with it.
  partAt(shot, pw) {
    if (pw >= 100) return { why: "A full swing: say how it was struck - good strike, thin, fat..." };
    const prev = shot.pw ?? null;
    if (!this.markShot("part")) return { why: "Couldn't take that answer" };
    this.postPower(shot, pw);
    if (this.last?.kind === "mark") this.last.power = { prev };
    this.toast(`${powerName(pw)} part swing - kept out of the ${lower(shot.club)}'s full-swing numbers - Z to undo`, 2200);
    return { done: `a ${powerWords(pw)} part swing`, short: `Heard: ${powerName(pw)}` };
  }

  // "Power on the last shot was fifty percent", "last shot half swing": the
  // shot the card is about, or the last one. The card about that shot takes
  // it as its answer.
  powerLast(pw) {
    if (this.inFlight) {
      this.hold({ power: pw });
      this.toast(`This shot: ${powerWords(pw)} swing - Z undoes`, 2200);
      return { done: `this shot ${powerWords(pw)}`, short: `This: ${powerName(pw)}` };
    }
    const shot = this.voiceShot();
    if (!shot) return { why: "No shot to say that about" };
    if (shot.sw === "putt" || shot.club === "PT") return { why: "A putt has no power" };
    if (this.review?.shot === shot) return this.partAt(shot, pw);
    const prev = shot.pw ?? null;
    const chip = shot.sw === "chip" || shot.sw === "pitch";
    this.postPower(shot, pw);
    this.last = { kind: "power", shot, prev, t: Date.now() };
    const what = pw >= 100 ? "a full swing" : chip ? `kept with the ${lower(shot.club)}'s ${powerWords(pw)} chips` : `a part swing, out of the ${lower(shot.club)}'s full-swing numbers`;
    this.toast(`Last shot: ${powerWords(pw)} swing - ${what} - Z to undo`, 2500);
    return { done: `last shot ${powerWords(pw)}`, short: `Last: ${powerName(pw)}` };
  }

  // A note said about a shot - the one a card is about, else the last one -
  // kept with the tags its words give (sim/shotnotes.mjs). A note that
  // clearly says a full swing was thin, fat, topped or shanked says so for
  // the stats too, as markShot("thin") would (noteStrike: conservative -
  // one bad strike named, nothing hedging it, a full swing).
  addNote(text) {
    const note = cleanNote(text);
    if (!note) return { why: "Didn't catch the note" };
    const tags = noteTags(note);
    // Said while the shot is in the air: it's about that one.
    if (this.inFlight) {
      this.hold({ note });
      this.toast(`Note for this shot: "${shortNote(note)}"${tags.length ? ` (${tags.join(", ")})` : ""} - Z undoes`, 3500);
      return { done: `note kept${tags.length ? `: ${tags.join(", ")}` : ""}`, short: "Note kept" };
    }
    const shot = this.voiceShot();
    if (!shot) return { why: "No shot to add a note to" };
    const last = this.noteOn(shot, note);
    this.last = last;
    return { done: `note kept${tags.length ? `: ${tags.join(", ")}` : ""}`, short: "Note kept" };
  }

  // Keeps a note with a shot (and its strike label, when it clearly says
  // one): returns what undo needs. quiet: no toast (said before it was
  // recorded, and shown then).
  noteOn(shot, note, { quiet = false } = {}) {
    const tags = noteTags(note);
    this.postNote(shot, { text: note });
    const prevSay = this.said.get(shot.id) ?? "auto";
    const strike = shot.sw === "full" ? noteStrike(note) : null;
    const label = strike && strike !== prevSay ? strike : null;
    // The label answers the card asking about the shot (Z puts it back).
    const card = label && this.review?.shot === shot ? this.review.kind : null;
    if (label) {
      if (card) this.close();
      this.sayAbout(shot, label);
    }
    const also = label ? ` - ${STRIKE_NAMES[label].toLowerCase()}, out of the ${lower(shot.club)}'s carry` : "";
    if (!quiet || label) this.toast(`Note: "${shortNote(note)}"${tags.length ? ` (${tags.join(", ")})` : ""}${also} - Z undoes`, 3500);
    return { kind: "note", shot, label, prevSay, card, t: Date.now() };
  }

  // Z, within a few seconds of an answer: a key pressed by mistake (or
  // habit) is taken back (and the card that asked shows again). A shot
  // taken out as a misread, or marked thin or fat, is put back as it was.
  undo() {
    const last = this.last;
    const ok = this.canUndo();
    this.last = null;
    if (!ok) return false;
    if (last.kind === "mark") {
      const { shot, prev, card } = last;
      this.sayAbout(shot, prev);
      // "Half swing" on a card said a power too.
      if (last.power) this.postPower(shot, last.power.prev ?? "auto");
      if (card) this.showCard(shot, card);
      else this.toast(prev === "auto" ? "Put back in the stats" : "Taken back", 1400);
      return true;
    }
    if (last.kind === "clubFrom") {
      // Back to the club it was recorded with (the server asks again).
      const { shot, was } = last;
      const club = shot.club;
      this.post({ player: shot.player, id: shot.id, club: was });
      shot.club = was;
      shot.onFix?.(was);
      this.recent = changeShot(this.recent, shot.id, { club: was });
      this.onHistory();
      // The club picked for the next one, back too.
      if (last.picked) this.followClub(shot, was, club);
      this.toast(`Back to the ${lower(was)}`, 1400);
      return true;
    }
    if (last.kind === "clubYes") {
      // A yes to the club it was recorded with, taken back: asked about, it
      // waits for an answer again.
      if (last.asked) this.post({ player: last.shot.player, id: last.shot.id, undo: true });
      this.toast("Taken back", 1400);
      return true;
    }
    if (last.kind === "note") {
      const { shot, label, prevSay, card } = last;
      this.postNote(shot, { drop: true });
      if (label) this.sayAbout(shot, prevSay);
      if (card) this.showCard(shot, card);
      else this.toast("Note taken back", 1400);
      return true;
    }
    if (last.kind === "power") {
      // A power said while the shot was in the air went on the shot itself:
      // taken back, it has none.
      if (last.recorded) this.postPower(last.shot, "auto", { none: true });
      else this.postPower(last.shot, last.prev ?? "auto");
      this.toast("Power taken back", 1400);
      return true;
    }
    if (last.kind === "held") {
      this.held = this.held.filter((h) => h !== last.item);
      const what = heldWords(last.item);
      this.toast(`${what[4].toUpperCase()}${what.slice(5)} taken back`, 1400);
      return true;
    }
    if (last.kind === "next") {
      if (last.power != null) this.setPower(last.power);
      else this.setSpecial(last.special);
      this.toast(last.power != null ? `Next shot: ${powerWords(last.power)} swing` : last.special ? `Next shot: ${SPECIAL_NAMES[last.special]}` : "Next shot: a normal swing", 1400);
      return true;
    }
    return false;
  }

  // Keys while the "Odd shot?" card is up: Y yes (the strike it was
  // judged), K a good strike, B just a bad hit, E a punch, Esc to leave it;
  // Z just after an answer takes it back. Delete, card or not, takes the
  // last shot out as a misread. (With no card showing, E says the next
  // shot is a special one and Shift + E its power: app.js.) True when used.
  key(key, mode, { shift = false } = {}) {
    const k = key.toLowerCase();
    if (shift && k === "e") return false;
    if (k === "z" && !this.open) return this.undo();
    if (key === "Delete") return this.markShot("misread");
    if (!this.open || !this.review) return false;
    if (key === "Escape") return this.close(), true;
    if (k === SPECIAL_KEY.toLowerCase()) return this.markShot("punch");
    const { shot, kind } = this.review;
    if (k === "y" && kind !== "review") return this.markShot(shot.strike);
    if (k === "k") return this.markShot("good");
    if (k === "b") return this.markShot("badhit");
    return false;
  }
}

export function newId() {
  return `${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36).padStart(2, "0")}`;
}

// Apex and landing angle from a flight path of [x, y, z, t] points (metres).
export function flightFacts(path, flightPoints) {
  const n = Math.min(flightPoints ?? path.length, path.length);
  if (n < 2) return { apex: 0, descent: null };
  let apex = 0;
  for (let i = 0; i < n; i++) apex = Math.max(apex, path[i][1]);
  const [a, b] = [path[n - 2], path[n - 1]];
  const run = Math.hypot(b[0] - a[0], b[2] - a[2]);
  return { apex: apex / YARD, descent: run > 0 ? (Math.atan2(a[1] - b[1], run) * 180) / Math.PI : null };
}

// The result a mode reports, from a course-style shot (courseplay.mjs's
// playShot: carryYards, rest and path in metres): carry, how far it went
// from `from` to where it stopped, how far right (+) or left of the line
// it was aimed along (`aim`, radians, as the course measures it), and the
// flight's apex and landing angle. Yards and degrees.
export function shotFacts(res, from, aim) {
  const rest = res.rest ?? from;
  const d = [rest[0] - from[0], rest[1] - from[1]];
  const flight = res.flightPoints > 1 ? flightFacts(res.path, res.flightPoints) : { apex: 0, descent: null };
  return {
    carry: res.carryYards ?? 0,
    total: Math.hypot(...d) / YARD,
    offline: (-Math.sin(aim) * d[0] + Math.cos(aim) * d[1]) / YARD,
    apex: flight.apex,
    descent: flight.descent,
  };
}
