// Player profiles (the owner, 8 October 2026: "Player profiles, but not
// always one selected... go with your suggestions"): saved players to pick
// when wanted, and guests, whose shots are played as anyone's but kept in
// nobody's stats. Pure: app.js, recorder.js and course.js use it.
//
// Two lists:
//   - the profiles: everyone saved - { name, colour, hand } each, with the
//     simple flag for young children kept beside them ({ simple: [names] },
//     as before) and the handicap index in the course's settings (hcp, by
//     name, as before). Their stats are the server's, filed by name.
//   - who's playing now: the course's players list (as before), one to
//     eight names, each a profile's or a guest's ("Guest", "Guest 2"...).
// Kept as the "profiles" setting: { list: [{ name, colour, hand }],
// simple: [names] }. A game from before profiles has no list: everyone on
// its players list becomes a profile - "Player 1" too, with the stats
// already under that name, to be renamed if wanted.

import { MAX_PLAYERS, PLAYER_COLOURS, playerNames } from "./players.mjs";

export const GUEST = "Guest";
export const MAX_NAME = 20;
// Plenty for a family and its friends; the list is a picker, not a club.
export const MAX_PROFILES = 24;
export const HANDS = ["right", "left"];

// A guest's name: "Guest", "Guest 2" ... "Guest 8" - never a profile's.
export const isGuest = (name) => /^Guest(?: [2-8])?$/.test(String(name ?? "").trim());

// The first guest's name not already playing.
export function guestFor(playing = []) {
  for (let i = 1; i <= MAX_PLAYERS; i++) {
    const g = i === 1 ? GUEST : `${GUEST} ${i}`;
    if (!playing.includes(g)) return g;
  }
  return null;
}

const clean = (name) => (typeof name === "string" ? name.trim().slice(0, MAX_NAME) : "");
const colourIndex = (c) => (Number.isInteger(c) && c >= 0 && c < PLAYER_COLOURS.length ? c : null);

// The saved profiles, made sound - or, saved before there were any, made
// from the course's players list (coursePlayers): everyone on it but a
// guest, in its order, each with its slot's colour.
export function readProfiles(saved, coursePlayers = null) {
  const s = saved && typeof saved === "object" ? saved : {};
  let list;
  if (Array.isArray(s.list)) {
    list = [];
    for (const p of s.list) {
      const name = clean(p?.name);
      if (!name || isGuest(name) || list.some((q) => q.name === name)) continue;
      list.push({ name, colour: colourIndex(p.colour), hand: p.hand === "left" ? "left" : "right" });
      if (list.length >= MAX_PROFILES) break;
    }
  } else {
    list = playerNames(coursePlayers)
      .filter((n) => !isGuest(n))
      .map((name, i) => ({ name, colour: i % PLAYER_COLOURS.length, hand: "right" }));
  }
  const names = list.map((p) => p.name);
  const simple = (Array.isArray(s.simple) ? s.simple : []).filter((n) => typeof n === "string" && names.includes(n.trim())).map((n) => n.trim());
  return { list, simple };
}

export const profileNames = (p) => p.list.map((q) => q.name);
export const profileNamed = (p, name) => p.list.find((q) => q.name === String(name ?? "").trim()) ?? null;
export const isProfile = (p, name) => !!profileNamed(p, name);

// Why a name can't be a profile's ("" when it can): empty, a guest's, or
// another profile's already. except: the profile being renamed.
export function nameProblem(p, name, except = null) {
  const n = clean(name);
  if (!n) return "Type a name";
  if (isGuest(n)) return `"${n}" is kept for guests`;
  if (n !== except && p.list.some((q) => q.name === n)) return `There's a ${n} already`;
  return "";
}

// The first colour no profile has, else the least used.
function freeColour(p) {
  const used = p.list.map((q) => q.colour);
  const free = PLAYER_COLOURS.findIndex((_, i) => !used.includes(i));
  if (free >= 0) return free;
  const counts = PLAYER_COLOURS.map((_, i) => used.filter((c) => c === i).length);
  return counts.indexOf(Math.min(...counts));
}

// A new profile (unchanged if the name won't do, or there are as many as
// can be).
export function addProfile(p, name, { hand = "right" } = {}) {
  if (nameProblem(p, name) || p.list.length >= MAX_PROFILES) return p;
  return { ...p, list: [...p.list, { name: clean(name), colour: freeColour(p), hand: hand === "left" ? "left" : "right" }] };
}

// A profile renamed: its colour, hand and simple flag go with it.
export function renameProfile(p, from, to) {
  const n = clean(to);
  if (!isProfile(p, from) || nameProblem(p, n, from)) return p;
  return {
    ...p,
    list: p.list.map((q) => (q.name === from ? { ...q, name: n } : q)),
    simple: p.simple.map((s) => (s === from ? n : s)),
  };
}

export function removeProfile(p, name) {
  return { ...p, list: p.list.filter((q) => q.name !== name), simple: p.simple.filter((s) => s !== name) };
}

// A profile's colour or hand changed; simple on or off.
export function setProfile(p, name, { colour, hand, simple } = {}) {
  if (!isProfile(p, name)) return p;
  const list = p.list.map((q) =>
    q.name === name ? { ...q, ...(colour !== undefined ? { colour: colourIndex(colour) } : {}), ...(hand !== undefined ? { hand: hand === "left" ? "left" : "right" } : {}) } : q,
  );
  let s = p.simple;
  if (simple === true && !s.includes(name)) s = [...s, name];
  if (simple === false) s = s.filter((n) => n !== name);
  return { ...p, list, simple: s };
}

// Which hand a player plays with: a profile's, or right (a guest).
export const handOf = (p, name) => profileNamed(p, name)?.hand ?? "right";

// Each player's colour in a game: their profile's, unless a player before
// them already has it - then the first not yet taken - and a guest's the
// first not yet taken.
export function playingColours(names, p) {
  const taken = new Set();
  return names.map((n, slot) => {
    const own = profileNamed(p, n)?.colour;
    let c = own != null && !taken.has(own) ? own : null;
    if (c == null) c = [slot % PLAYER_COLOURS.length, ...PLAYER_COLOURS.keys()].find((i) => !taken.has(i)) ?? slot % PLAYER_COLOURS.length;
    taken.add(c);
    return PLAYER_COLOURS[c];
  });
}

// Who's playing, from the saved list: profiles' and guests' names only (a
// profile since removed drops out), never empty - a guest at least.
export function playingFrom(saved, p) {
  const names = (Array.isArray(saved) ? saved : []).map(clean).filter((n, i, all) => n && all.indexOf(n) === i && (isGuest(n) || isProfile(p, n)));
  return names.length ? names.slice(0, MAX_PLAYERS) : [GUEST];
}

// The "Who's playing?" card: a profile tapped in or out of the game, in
// the order tapped; a guest added. Never empty (a guest then), never more
// than eight.
export function togglePlaying(playing, name) {
  if (playing.includes(name)) {
    const left = playing.filter((n) => n !== name);
    return left.length ? left : [GUEST];
  }
  if (playing.length >= MAX_PLAYERS) return playing;
  // Only guests so far, and a profile picked: the profile instead of a
  // lone guest (the card starts on "Guest").
  if (playing.length === 1 && playing[0] === GUEST) return [name];
  return [...playing, name];
}
export function addGuest(playing) {
  const g = guestFor(playing);
  return g && playing.length < MAX_PLAYERS ? [...playing, g] : playing;
}

// Something kept by name ({ name: value } - a handicap, bests, plans)
// moved to a profile's new name.
export function renameKey(obj, from, to) {
  if (!obj || typeof obj !== "object" || !(from in obj) || from === to) return obj;
  const out = { ...obj, [to]: obj[from] };
  delete out[from];
  return out;
}

// What the card says about who's playing: "Playing as Anna", "Anna, Ben and
// Guest", and that a guest's shots aren't kept.
export function playingWords(playing) {
  const names = playing.length > 1 ? `${playing.slice(0, -1).join(", ")} and ${playing.at(-1)}` : playing[0];
  const guests = playing.filter(isGuest).length;
  const note = !guests ? "" : guests === playing.length ? " - not kept in anyone's stats" : ` - ${guests > 1 ? "guests' shots aren't" : "a guest's shots aren't"} kept`;
  return `${playing.length > 1 ? "Playing" : "Playing as"} ${names}${note}`;
}

// When to ask who's playing (the owner: "that should only happen first
// load... on very first load it should pop up before any command centre
// stuff and then lock in. If the user then has multiple people playing we
// might need a reconfirm on game change but a simpler confirmation is all
// that's needed yes/no"):
//   "card"    - the full Who's playing card: once as the game starts, not
//               again for a reload while it's running (a hang, a graphics
//               change, the speed test or the demo going on to its next part)
//   "confirm" - a yes/no "Still playing ...?" on changing game, when more
//               than one is playing
//   null      - nothing: the same players carry on (Who's playing in the
//               menu, or a click on who's hitting, changes them)
// on: the menu's "Ask who's playing at the start"; asked: the card has
// come up already since the game started; players: who's playing now;
// change: a change of game rather than the game starting.
export function whoPrompt({ on = true, asked = false, players = [], change = false } = {}) {
  if (!on) return null;
  if (!change) return asked ? null : "card";
  return players.length > 1 ? "confirm" : null;
}

// What the game does as it starts (app.js), given whether the Who's playing
// card comes up (whoFirst: whoPrompt's "card" - not for a round asked for
// in the address), whether the first run's welcome is up instead, and
// whether the controls are in a window of their own:
//   who     "controls": the card over the command centre, opened as soon
//           as the controls window is there (the owner: "command centre
//           opens with the same floating window currently on the game
//           screen showing on the command centre (floating ontop)") - over
//           the game screen only where that window can't open;
//           "here": over the game screen (one window); null: no card.
//   warmUp  until the card's answered - Play, or Skip as a guest - a
//           warm-up: balls fly, nothing's kept (the owner: "if nothing
//           picked range balls can still be hit, but nothing records etc
//           until play is hit in the command centre").
export function startSequence({ whoFirst = false, welcome = false, separate = false } = {}) {
  if (welcome || !whoFirst) return { who: null, warmUp: false };
  return { who: separate ? "controls" : "here", warmUp: true };
}

// The box saying who's hitting, while it's a warm-up (bay.js).
export const WARM_UP_BOX = { label: "Warm-up", name: "Nothing kept until Play", colour: "#8a939c" };
