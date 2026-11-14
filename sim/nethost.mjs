// Online play by code: another bay takes over as host if the host's gone
// (its PC switched off, its connection lost for good) - the game carries
// on rather than everyone stopping. The host keeps the game and checks
// every change (sim/netgame.mjs), so one bay has to become it: the first
// bay to have joined that still has a player in the game ("the heir"),
// after TAKEOVER_MS without the host; if that one's gone too, the next
// after twice as long, and so on. The others find it again with the same
// code and come back to their own places, known by their pass - their
// token's hash, kept with each bay in the game, so the new host can tell a
// bay coming back from anyone else without ever having been told the
// token. The old host back later joins its own game as a bay.
//
// Only through the relay: on the same home network or over Tailscale the
// other bays talk to the host's PC itself, and wait for it to come back.

import { sha256 } from "./sha256.mjs";

export const TAKEOVER_MS = 20_000;

// A bay's pass: what the game keeps of its token.
export const passOf = (token) => (token ? sha256(`a2golf-bay:${token}`).slice(0, 32) : null);

// The passes the relay keeps for a game's code (relay/rooms.mjs hostKeep):
// every bay's, the host's own among them - so whichever takes over can
// prove it's of this game.
export function gamePasses(g) {
  return [...new Set(Object.values(g?.bays ?? {}).map((b) => b?.pass).filter((p) => typeof p === "string" && /^[0-9a-f]{32}$/.test(p)))].slice(0, 16);
}

// The bays that would take over, in the order they would: every bay but
// the host's that still has a player in the game, as they joined.
export function heirs(g) {
  return Object.keys(g?.bays ?? {}).filter((b) => b !== g.host && g.players.some((p) => p.bay === b && !p.dropped));
}

// How long `bay` waits without the host before taking over (ms), or null
// if it never would. (base: the first in line's wait.)
export function takeoverWait(g, bay, base = TAKEOVER_MS) {
  const k = heirs(g).indexOf(bay);
  return k < 0 ? null : base * (k + 1);
}

// Whether `bay` takes over now: the host gone since goneAt (ms).
export function takesOver(g, bay, goneAt, now = Date.now(), base = TAKEOVER_MS) {
  const wait = takeoverWait(g, bay, base);
  return wait != null && Number.isFinite(goneAt) && now - goneAt >= wait;
}

// A bay coming back to a host that wasn't told its token (a new host):
// its own place if its token's pass is that bay's, else null.
export function bayByPass(g, bay, token) {
  const pass = g?.bays?.[bay]?.pass;
  return pass && token && passOf(token) === pass ? bay : null;
}
