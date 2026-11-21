// Online play's quick reactions: a tap - "Nice shot!", a clap, a laugh -
// shown on every bay's screen (the owner, 29 October 2026: "Reactions
// restrict to every 30 seconds"). Each is one small message through the
// relay, so a bay may send one every REACT_MS: its button waits that long
// after each (the page), and the host turns away one sooner (sim/netgame.mjs
// refuse) - by its own clock, a little short of the full wait so the time a
// message takes on its way never makes a fair one too soon.

export const REACT_MS = 30_000;
const SLACK_MS = 2_000;

// The reactions (the owner, 30 October 2026: "Can we add more actions
// please. With a smart actions wheel to select"), in the order the whole
// list shows them - the first six as they always were, so a bay a version
// behind still knows those.
export const REACTIONS = {
  nice: { icon: "👏", words: "Nice shot!" },
  great: { icon: "🔥", words: "Great shot!" },
  unlucky: { icon: "😬", words: "Unlucky!" },
  laugh: { icon: "😂", words: "Ha!" },
  wow: { icon: "😮", words: "Wow!" },
  gg: { icon: "🤝", words: "Good game" },
  close: { icon: "🎯", words: "So close!" },
  well: { icon: "🙌", words: "Well played" },
  yes: { icon: "💪", words: "Yes!" },
  getup: { icon: "🚀", words: "Get up!" },
  sit: { icon: "✋", words: "Sit!" },
  getin: { icon: "⛳", words: "Get in the hole!" },
  fore: { icon: "📢", words: "Fore!" },
  ace: { icon: "🏆", words: "Hole in one!" },
  eagle: { icon: "🦅", words: "Eagle!" },
  birdie: { icon: "🐦", words: "Birdie!" },
  par: { icon: "👍", words: "Nice par" },
  splash: { icon: "💦", words: "Splash!" },
  timber: { icon: "🌲", words: "Timber!" },
  beach: { icon: "🏖️", words: "Beach day!" },
  oops: { icon: "🙈", words: "Oops!" },
  lucky: { icon: "🍀", words: "Lucky bounce!" },
  pressure: { icon: "😰", words: "No pressure..." },
  luck: { icon: "🤞", words: "Good luck!" },
  turn: { icon: "⏰", words: "Your shot!" },
};
export const REACTION_KEYS = Object.keys(REACTIONS);

// The wheel: how many round it, the best for the moment first (at the
// top, going round clockwise); the rest from its middle.
export const WHEEL_SLOTS = 8;

// What to say now, best first - every reaction once, those that fit the
// moment in front (smartReactions): what last happened in the game (g),
// from bay's point of view.
//   - before anyone's hit: good luck;
//   - a ball in the air: get up, sit, get in the hole (a putt: get in);
//   - holed: an ace, an eagle, a birdie, a par - a bogey, unlucky;
//   - where it came to rest: in the water, the trees, the sand; on the
//     green close (within CLOSE_FT), or not; the fairway; the rough;
//   - your own: oops for a bad one, yes for a good one;
//   - the game over: good game.
// After those, the rest in the whole list's order.
export const CLOSE_FT = 8;
const FIT = {
  start: ["luck", "pressure", "laugh", "turn"],
  ended: ["gg", "well", "laugh", "great"],
  air: ["getup", "sit", "getin", "fore", "wow"],
  airPutt: ["getin", "close", "pressure", "wow"],
  myAir: ["sit", "getup", "getin", "fore", "oops"],
  myAirPutt: ["getin", "pressure", "oops"],
  ace: ["ace", "wow", "great", "lucky"],
  eagle: ["eagle", "wow", "great", "well"],
  birdie: ["birdie", "great", "nice", "well"],
  par: ["par", "nice", "well"],
  over: ["unlucky", "laugh", "oops"],
  myGood: ["yes", "lucky", "laugh"],
  myBad: ["oops", "laugh", "unlucky"],
  water: ["splash", "unlucky", "laugh", "oops"],
  trees: ["timber", "unlucky", "fore", "laugh"],
  skipped: ["wow", "lucky", "splash"],
  sand: ["beach", "unlucky", "laugh"],
  close: ["close", "great", "nice", "wow"],
  green: ["nice", "great", "pressure"],
  fairway: ["nice", "great", "well"],
  rough: ["unlucky", "lucky", "oops"],
};

// The moment: { kind, mine } - what last happened in the game, by its
// order (seq), and whether it was bay's own player's.
export function reactMoment(g, bay) {
  if (!g?.started) return { kind: "start", mine: false };
  if (g.ended) return { kind: "ended", mine: false };
  let last = null;
  for (const p of g.players ?? []) {
    if (p.dropped) continue;
    for (const at of g.progress?.[p.id] ?? []) {
      if (!at) continue;
      const mine = p.bay === bay;
      if (at.air && !(last && last.seq >= at.air.seq)) last = { seq: at.air.seq, air: at.air, mine };
      if (Number.isFinite(at.seq) && at.seq > 0 && !(last && last.seq >= at.seq)) last = { seq: at.seq, at, mine };
    }
  }
  if (!last) return { kind: "start", mine: false };
  const { mine } = last;
  if (last.air) return { kind: last.air.putt ? (mine ? "myAirPutt" : "airPutt") : mine ? "myAir" : "air", mine };
  const at = last.at;
  const text = at.text ?? "";
  if (at.done) {
    if (/hole in one/i.test(text)) return { kind: mine ? "myGood" : "ace", mine };
    if (/albatross|eagle/i.test(text)) return { kind: mine ? "myGood" : "eagle", mine };
    if (/birdie/i.test(text)) return { kind: mine ? "myGood" : "birdie", mine };
    if (/^par/i.test(text) || /^given$/i.test(text)) return { kind: mine ? "myGood" : "par", mine };
    return { kind: mine ? "myBad" : "over", mine };
  }
  if (/penalty area/i.test(text)) return { kind: mine ? "myBad" : "water", mine };
  if (/trees|hit a tree/i.test(text)) return { kind: mine ? "myBad" : "trees", mine };
  if (/skipped off the water/i.test(text)) return { kind: mine ? "myGood" : "skipped", mine };
  if (at.lie === "bunker" || /plugged/i.test(text)) return { kind: mine ? "myBad" : "sand", mine };
  if (at.lie === "green") {
    const ft = Number(/(\d+) ft/.exec(text)?.[1]);
    const close = Number.isFinite(ft) && ft <= CLOSE_FT;
    return { kind: mine ? "myGood" : close ? "close" : "green", mine };
  }
  if (at.lie === "fairway") return { kind: mine ? "myGood" : "fairway", mine };
  if (at.lie === "rough" || at.lie === "deep") return { kind: mine ? "myBad" : "rough", mine };
  return { kind: mine ? "myGood" : "fairway", mine };
}

// Every reaction once, best for the moment first.
export function smartReactions(g, bay) {
  const fit = FIT[reactMoment(g, bay).kind] ?? [];
  return [...new Set([...fit, ...REACTION_KEYS])];
}

// Why the host turns a reaction away, or null. at: the host's clock as it
// came (RelayPlay apply puts it on).
export function reactRefusal(g, ev, fromBay) {
  if (ev.bay !== fromBay) return "Not your bay";
  if (!g.bays?.[fromBay]) return "Not in the game";
  if (!REACTIONS[ev.what]) return "No such reaction";
  if (!Number.isFinite(ev.at)) return "No time";
  const last = g.reacted?.[fromBay];
  if (Number.isFinite(last) && ev.at - last < REACT_MS - SLACK_MS) return "One reaction every 30 seconds";
  return null;
}

// How long till this bay's next reaction may go (ms; 0: now), by the page's
// own clock since its last.
export function reactWait(lastAt, now = Date.now()) {
  return Number.isFinite(lastAt) ? Math.max(0, REACT_MS - (now - lastAt)) : 0;
}

// The game's reaction, new to this page or not: seen is what the page took
// in last - undefined before it's looked at this game (what's there then is
// from before it looked: taken in, not shown), "none" before the game's
// first. { seen, show: the reaction to show, or null }. (No game: the next
// is looked at afresh.)
export function freshReaction(seen, g) {
  if (!g) return { seen: undefined, show: null };
  const key = g.react ? String(g.react.seq) : "none";
  return { seen: key, show: seen !== undefined && key !== seen ? (g.react ?? null) : null };
}

// Who a reaction's from: the bay's one player by name, else the bay.
export function reactorName(g, bay) {
  const mine = (g?.players ?? []).filter((p) => p.bay === bay && !p.dropped);
  return mine.length === 1 ? mine[0].name : (g?.bays?.[bay]?.name ?? "Someone");
}

// "Sam: 👏 Nice shot!"
export function reactionLine(g, react) {
  const r = REACTIONS[react?.what];
  return r ? `${react.name ?? reactorName(g, react.bay)}: ${r.icon} ${r.words}` : "";
}
