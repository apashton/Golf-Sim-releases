// Signing in with Google in the phone app (the owner, 11 November 2026:
// "Why no Google sign in for APK?" - "Yeah build that for APK"). Google
// won't sign anyone in inside an app's own page, so the app hands over to
// the phone's browser and takes the answer back by its own link:
//   1. the sign-in card's Continue with Google asks the pocket server to
//      start (sim/accountstore.mjs googleStart): a one-time word (the
//      nonce) is kept, and the relay's page for it opened in the browser -
//      https://relay/g#<nonce> (relay/googlepage.mjs);
//   2. that page shows Google's own button (the web version's, the same
//      client - the relay's address is one it already allows), asking
//      Google to put the nonce in what it hands back;
//   3. signed in, the page opens the app with a2golf://google/<ID token>
//      (straight to this app's package, where the browser can);
//   4. the app (netinvite.js) gives the token to the pocket server, which
//      takes it only if it carries the nonce it started with, is for this
//      game's client, and came back in time - then signs in to Firebase
//      with it as the web version does. Firebase checks Google's signature.
// So a link someone else made can't sign this phone in as them: it hasn't
// this phone's nonce.
//
// Pure: the addresses, and reading what comes back.

import { GOOGLE, SIGN_IN_MS } from "./google.mjs";

export const GOOGLE_APP_LINK = "a2golf://google/";
// The one-time word: letters and numbers only (it rides in an address).
export const NONCE = /^[A-Za-z0-9]{16,64}$/;
// A Google ID token: three runs of base64url, dots between.
const TOKEN = /^[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}$/;
const TOKEN_MOST = 6000;

// The relay's sign-in page for a nonce: wss://relay.example ->
// https://relay.example/g#<nonce>. Null without a relay or a sound nonce.
export function googlePageLink(relayUrl, nonce) {
  if (!relayUrl || !NONCE.test(String(nonce ?? ""))) return null;
  const base = String(relayUrl).replace(/^ws(s?):\/\//, "http$1://").replace(/\/+$/, "");
  return /^https?:\/\//.test(base) ? `${base}/g#${nonce}` : null;
}

// The ID token in the app's link (a2golf://google/<token>), or null if the
// link isn't one.
export function googleTokenFromLink(url) {
  const s = String(url ?? "");
  if (!s.startsWith(GOOGLE_APP_LINK) || s.length > TOKEN_MOST) return null;
  const t = s.slice(GOOGLE_APP_LINK.length).replace(/[/?#].*$/, "");
  return TOKEN.test(t) ? t : null;
}

// What an ID token says (its middle part, read - not checked: Firebase
// checks Google's signature when it's signed in with), or null.
export function tokenClaims(idToken) {
  try {
    const part = String(idToken ?? "").split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4)), (c) => c.charCodeAt(0));
    const v = JSON.parse(new TextDecoder().decode(bytes));
    return v && typeof v === "object" && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

// Why a token that came back by the app's link isn't taken, in words - or
// null if it's this phone's own sign-in: started here ({ nonce, at }), not
// long ago, and for this game's Google client.
export function phoneTokenTrouble(idToken, started, { now = Date.now(), clientId = GOOGLE.webClient, within = SIGN_IN_MS } = {}) {
  const again = "press Continue with Google again";
  if (!started?.nonce) return `That Google sign-in wasn't started on this phone - ${again}`;
  if (!(now - (started.at ?? 0) < within)) return `That Google sign-in took too long - ${again}`;
  const c = tokenClaims(idToken);
  if (!c) return `Google's answer couldn't be read - ${again}`;
  if (c.nonce !== started.nonce) return `That Google sign-in wasn't started on this phone - ${again}`;
  if (c.aud !== clientId) return `That Google sign-in is for another app - ${again}`;
  return null;
}
