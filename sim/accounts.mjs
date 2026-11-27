// Signing in to play (the owner, 10 November 2026: "can we require all
// versions to at least signup/login with an email/x/google. advise that
// with google, stats and information can pass along the versions", then
// "Once someone is logged in, automatically load back into that user on
// next login. Give the ability to click the player name to change user or
// add more users etc. do this on all platforms"). Chosen: Firebase's sign-in
// (on the owner's A2 Golf Google project), email + password and Google
// first, X next; at a bay one person signs in, and friends, children and
// guests are added as players without a login.
//
// An account is a Firebase user: its id (uid), its email, how it signs in
// (password or google), and the saved player it is on this device. A
// device keeps the accounts signed in on it and which is in use, and opens
// straight into that one next time - offline too. A Google account's stats
// also go into their Google Drive (sim/drivesync.mjs), so they follow them
// to the phone and the web.
//
// Pure: Firebase's sign-in requests (its REST API - the same from the PC's
// server, a browser or the phone), their errors in words, and the device's
// list. server/accounts.mjs (the PC) and the pocket server (web, phone)
// keep it.

export const FIREBASE = Object.freeze({
  // The A2 Golf project's web app (Firebase console, Project settings):
  // public, as in every page that uses Firebase.
  apiKey: "AIzaSyDF95gjIEyWnukS3F9Z-8cyY948PErugaE",
  authDomain: "a2golf.firebaseapp.com",
  projectId: "a2golf",
  identity: "https://identitytoolkit.googleapis.com/v1",
  secureToken: "https://securetoken.googleapis.com/v1",
});

// Whether this copy can sign in at all (the project's key is in).
export const signInReady = (fb = FIREBASE) => !!fb.apiKey;

// A Firebase request: { url, body } to POST as JSON.
export function fbRequest(kind, args = {}, fb = FIREBASE) {
  const key = `?key=${encodeURIComponent(fb.apiKey)}`;
  const id = (path, body) => ({ url: `${fb.identity}/${path}${key}`, body });
  switch (kind) {
    case "signUp":
      return id("accounts:signUp", { email: args.email, password: args.password, returnSecureToken: true });
    case "signIn":
      return id("accounts:signInWithPassword", { email: args.email, password: args.password, returnSecureToken: true });
    case "reset":
      return id("accounts:sendOobCode", { requestType: "PASSWORD_RESET", email: args.email });
    case "google":
      // A Google ID token from either of the project's Google clients.
      return id("accounts:signInWithIdp", { postBody: `id_token=${encodeURIComponent(args.idToken)}&providerId=google.com`, requestUri: args.requestUri ?? "http://localhost", returnSecureToken: true, returnIdpCredential: true });
    case "refresh":
      return { url: `${fb.secureToken}/token${key}`, body: { grant_type: "refresh_token", refresh_token: args.refreshToken } };
    default:
      throw new Error(`No such request: ${kind}`);
  }
}

// A signed-in Firebase answer -> { uid, email, provider, refresh, idToken,
// until, name } (until: when the ID token runs out).
export function fbUser(r, provider, now = Date.now()) {
  return {
    uid: r.localId ?? r.user_id ?? null,
    email: r.email ?? null,
    provider,
    refresh: r.refreshToken ?? r.refresh_token ?? null,
    idToken: r.idToken ?? r.id_token ?? null,
    until: now + (Number(r.expiresIn ?? r.expires_in) || 3600) * 1000,
    name: r.displayName ?? r.fullName ?? null,
  };
}

// Firebase's error codes in words, for the sign-in card.
export function fbTrouble(code) {
  const c = String(code ?? "").split(" ")[0];
  const words = {
    EMAIL_EXISTS: "There's already an account with that email - sign in instead",
    INVALID_LOGIN_CREDENTIALS: "That email and password don't match - try again, or Forgot password",
    INVALID_PASSWORD: "That email and password don't match - try again, or Forgot password",
    EMAIL_NOT_FOUND: "No account with that email - check it, or create one",
    INVALID_EMAIL: "That isn't an email address",
    MISSING_PASSWORD: "Type a password",
    WEAK_PASSWORD: "Pick a password of at least 6 characters",
    TOO_MANY_ATTEMPTS_TRY_LATER: "Too many tries - wait a few minutes and try again",
    USER_DISABLED: "That account has been turned off",
    OPERATION_NOT_ALLOWED: "That way of signing in isn't turned on yet",
    offline: "Couldn't reach the sign-in service - check the internet and try again",
    notready: "Signing in isn't set up in this copy of A² Golf",
  };
  return words[c] ?? `Couldn't sign in (${c || "no answer"})`;
}

// A plausible email and password before asking Firebase.
export function checkCredentials({ email, password }, { creating = false } = {}) {
  const e = String(email ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return fbTrouble("INVALID_EMAIL");
  if (!password) return fbTrouble("MISSING_PASSWORD");
  if (creating && String(password).length < 6) return fbTrouble("WEAK_PASSWORD");
  return null;
}

// ---- The accounts on a device ---------------------------------------------------------

// { current: uid | null, users: [{ uid, email, provider, player, at }] }
export const noAccounts = () => ({ current: null, users: [] });
export function cleanAccounts(a) {
  const users = (Array.isArray(a?.users) ? a.users : []).filter((u) => u && typeof u.uid === "string" && u.uid);
  const current = users.some((u) => u.uid === a?.current) ? a.current : (users[0]?.uid ?? null);
  return { current, users };
}

// Signed in (again): added, or brought up to date, and made the one in use.
export function signedIn(a, user) {
  const list = cleanAccounts(a).users.filter((u) => u.uid !== user.uid);
  const was = cleanAccounts(a).users.find((u) => u.uid === user.uid);
  const kept = { ...was, ...user, player: user.player ?? was?.player ?? null };
  return { current: user.uid, users: [kept, ...list] };
}
export function useAccount(a, uid) {
  const c = cleanAccounts(a);
  return c.users.some((u) => u.uid === uid) ? { ...c, current: uid } : c;
}
export function signedOut(a, uid) {
  const c = cleanAccounts(a);
  const users = c.users.filter((u) => u.uid !== uid);
  return cleanAccounts({ current: c.current === uid ? (users[0]?.uid ?? null) : c.current, users });
}
// The saved player an account is on this device.
export function linkPlayer(a, uid, player) {
  const c = cleanAccounts(a);
  return { ...c, users: c.users.map((u) => (u.uid === uid ? { ...u, player } : u)) };
}
export const currentAccount = (a) => cleanAccounts(a).users.find((u) => u.uid === cleanAccounts(a).current) ?? null;

// What the page's sign-in and switcher see: no tokens.
export const accountsView = (a, { ready = true } = {}) => {
  const c = cleanAccounts(a);
  return { ready, current: c.current, users: c.users.map(({ uid, email, provider, player, name }) => ({ uid, email, provider, player: player ?? null, name: name ?? null })), needed: !c.users.length };
};

// A name for a new player from the account: the Google name's first word,
// else the email's start ("pat.smith@" -> "Pat").
export function nameFor(user) {
  const first = String(user?.name ?? "").trim().split(/\s+/)[0];
  if (first) return first.slice(0, 20);
  const head = String(user?.email ?? "").split("@")[0].split(/[._+-]/)[0];
  return head ? (head[0].toUpperCase() + head.slice(1)).slice(0, 20) : "Player";
}
