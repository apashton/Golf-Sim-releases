// Online play's invitation: the host's code as a link, for its QR code on
// the host's screen (sim/qrcode.mjs) - a friend points their phone's
// camera at it rather than typing the code (the owner's "invite links/QR
// codes for codes"). The link opens a small page on the relay saying the
// code (relay/joinpage.mjs), with a button that opens the phone app at
// Online play with the code typed in (a2golf://join/CODE: the app's own
// link, android/native AndroidManifest.xml; public/netinvite.js). Opening
// the page is the relay's Worker, not a room: none of the day's allowance
// for games (relay/README.md).

import { readCode } from "./netgame.mjs";

export const APP_LINK = "a2golf://join/";

// The relay's page for a game's code: wss://relay.example -> https://relay.example/join/K7Q2MX.
export function joinLink(relayUrl, code) {
  const c = readCode(code);
  if (!c || !relayUrl) return null;
  const base = String(relayUrl).replace(/^ws(s?):\/\//, "http$1://").replace(/\/+$/, "");
  return /^https?:\/\//.test(base) ? `${base}/join/${c}` : null;
}

// The app's own link for the code.
export const appLink = (code) => (readCode(code) ? `${APP_LINK}${readCode(code)}` : null);

// The code a link carries (the app's own, or the relay's page), or null.
export function codeFromLink(url) {
  const m = /^(?:a2golf:\/\/join\/|https?:\/\/[^/]+\/join\/)([A-Za-z0-9-]{6,8})\/?$/.exec(String(url ?? "").trim());
  return m ? readCode(m[1]) : null;
}

// A match ladder's invitation, the same way (docs/LADDERS.md, "Joining by
// QR or link"): its code as the relay's page (/l/LK7Q2M, relay/joinpage.mjs
// ladderPage) for a QR code on the ladder's panel, and the app's own link
// (a2golf://ladder/LK7Q2M), which opens the phone app at Match ladders with
// the code typed in to join. A ladder's code is an L and five more.
export const LADDER_APP_LINK = "a2golf://ladder/";
export const readLadderCode = (code) => {
  const c = String(code ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return /^L[A-Z0-9]{5}$/.test(c) ? c : null;
};
export function ladderJoinLink(relayUrl, code) {
  const c = readLadderCode(code);
  if (!c || !relayUrl) return null;
  const base = String(relayUrl).replace(/^ws(s?):\/\//, "http$1://").replace(/\/+$/, "");
  return /^https?:\/\//.test(base) ? `${base}/l/${c}` : null;
}
export const ladderAppLink = (code) => (readLadderCode(code) ? `${LADDER_APP_LINK}${readLadderCode(code)}` : null);
export function ladderCodeFromLink(url) {
  const m = /^(?:a2golf:\/\/ladder\/|https?:\/\/[^/]+\/l\/)([A-Za-z0-9-]{6,8})\/?$/.exec(String(url ?? "").trim());
  return m ? readLadderCode(m[1]) : null;
}

// A season by post's, the same (docs/COURSES.md, "A season by post"): the
// relay's page for it (/s/SK7Q2M: its events, leaderboards and
// table, relay/webpages.mjs) and the app's own link (a2golf://season/SK7Q2M),
// which opens the Online tab's Seasons with the code typed in. A season's
// code is an S and five more.
export const SEASON_APP_LINK = "a2golf://season/";
export const readSeasonCode = (code) => {
  const c = String(code ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return /^S[A-Z0-9]{5}$/.test(c) ? c : null;
};
export function seasonJoinLink(relayUrl, code) {
  const c = readSeasonCode(code);
  if (!c || !relayUrl) return null;
  const base = String(relayUrl).replace(/^ws(s?):\/\//, "http$1://").replace(/\/+$/, "");
  return /^https?:\/\//.test(base) ? `${base}/s/${c}` : null;
}
export const seasonAppLink = (code) => (readSeasonCode(code) ? `${SEASON_APP_LINK}${readSeasonCode(code)}` : null);
export function seasonCodeFromLink(url) {
  const m = /^(?:a2golf:\/\/season\/|https?:\/\/[^/]+\/s\/)([A-Za-z0-9-]{6,8})\/?$/.exec(String(url ?? "").trim());
  return m ? readSeasonCode(m[1]) : null;
}
