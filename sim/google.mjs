// Signing in with Google, for each player's stats kept in their own Google
// Drive (docs/STATS-CLOUD-PLAN.md; the owner, 10 November 2026: "Can we have
// a way to save stats to Google drive? And that be the true source").
//
// Two sign-ins, one Google project ("A2 Golf", the owner's), each with its
// own client - an entry made in Google's console, its id here (ids aren't
// secret: every app that signs in with Google shows its own):
//   desktop  the game's own server, in the Windows app or npm start: the
//            player's browser opens Google's page, which hands back to the
//            server on this PC (a "loopback" address, any port), with PKCE.
//            Google wants the client's secret with it too - for a desktop
//            app not a real secret, Google says, but kept out of the code:
//            the Windows build puts it in (GOOGLE_DESKTOP_SECRET,
//            server/googleauth.mjs);
//   web      a page on the web (the stats website, the web version): Google's
//            own pop-up, for the origins the owner listed.
// What it asks for: drive.file (only the files A² Golf itself makes -
// nothing else in their Drive), and openid + email (who they are: their
// account's id, later the Premium login too).
//
// Pure: building Google's address, reading what comes back. The server
// (server/googleauth.mjs) does the asking.

export const GOOGLE = Object.freeze({
  webClient: "322547839668-9psms58v4vlb6uqlef336t90n7sj1g45.apps.googleusercontent.com",
  desktopClient: "322547839668-pbdv2sve99d6nlnpktu6f37labll27jg.apps.googleusercontent.com",
  scopes: Object.freeze(["openid", "email", "https://www.googleapis.com/auth/drive.file"]),
  authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  revokeUrl: "https://oauth2.googleapis.com/revoke",
  driveUrl: "https://www.googleapis.com/drive/v3",
  uploadUrl: "https://www.googleapis.com/upload/drive/v3",
});

// How long a sign-in started can take to finish (Google's page left open).
export const SIGN_IN_MS = 10 * 60000;
// An access token is used until this close to running out, then refreshed.
export const TOKEN_MARGIN_MS = 60000;

// Google's sign-in page for the game's own server: the code comes back to
// redirectUri (this PC), with state (to know it's ours) and the PKCE
// challenge. offline + consent: a refresh token every time, so it stays
// signed in. hint: the account to suggest (signing in again).
export function authLink({ clientId = GOOGLE.desktopClient, redirectUri, state, challenge, hint = null, authUrl = GOOGLE.authUrl }) {
  const q = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE.scopes.join(" "),
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    access_type: "offline",
    prompt: "consent",
  });
  if (hint) q.set("login_hint", hint);
  return `${authUrl}?${q}`;
}

// The address Google hands back to: this PC's own server, as Google allows
// a desktop client any port on it.
export const backAddress = (port) => `http://127.0.0.1:${port}/api/google/back`;

// Who signed in, from the ID token Google sent with the tokens: { sub,
// email }, or null. Not checked against Google's signature: it came
// straight from Google, over its own https, as the answer to our request
// (the relay checks it before trusting it - Premium, later).
export function readIdToken(token) {
  const part = String(token ?? "").split(".")[1];
  if (!part) return null;
  try {
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "=");
    const json = new TextDecoder().decode(Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0)));
    const c = JSON.parse(json);
    return typeof c?.sub === "string" ? { sub: c.sub, email: typeof c.email === "string" ? c.email : null } : null;
  } catch {
    return null;
  }
}

// Whether all the access asked for was given: on Google's page each box can
// be unticked, and without Drive there's nothing to keep stats in.
export function grantedAll(scope) {
  const have = new Set(String(scope ?? "").split(/\s+/).filter(Boolean));
  return have.has("https://www.googleapis.com/auth/drive.file");
}

// Whether an access token can still be used.
export const tokenFresh = (tok, now = Date.now()) => !!tok?.access && Number.isFinite(tok.until) && tok.until - TOKEN_MARGIN_MS > now;

// Why a sign-in or a refresh didn't work, in words for My stats.
export function googleTrouble(err) {
  const e = String(err?.error ?? err ?? "");
  if (e === "access_denied") return "Signing in was cancelled";
  if (e === "invalid_grant") return "Google asked to sign in again - sign in again on My stats";
  if (e === "scope") return "Drive wasn't ticked on Google's page - sign in again and leave Drive ticked";
  if (e === "state") return "That sign-in had run out - start it again from My stats";
  if (e === "secret") return "Google sign-in isn't in this copy of A² Golf";
  if (e === "offline") return "Couldn't reach Google - check the internet and try again";
  return `Google said: ${e || "no answer"}`;
}
