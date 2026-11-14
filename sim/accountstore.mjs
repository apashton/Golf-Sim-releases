// The accounts signed in on a device (sim/accounts.mjs says what and why),
// and their requests - the same on the PC's server (server/accounts.mjs,
// which adds Google's sign-in on this PC and the Drive sync) and in the
// phone's and web version's pocket server (sim/pocketserver.mjs, kept in
// the page's own storage):
//   GET  /api/accounts                          the list (no tokens), which
//                                               is in use, whether one's needed
//   POST /api/accounts/signup  { email, password }
//   POST /api/accounts/signin  { email, password }
//   POST /api/accounts/reset   { email }        Firebase emails a reset link
//   POST /api/accounts/google  { idToken }      a Google ID token (the web
//                                               version's Google button; the
//                                               phone app's, back by its link)
//   POST /api/accounts/google  {}               the phone app: start, ->
//                                               { url } to open in its browser
//                                               (sim/phonegoogle.mjs)
//   POST /api/accounts/use     { uid }          switch to another signed in
//   POST /api/accounts/link    { uid, player }  the saved player it is here
//   POST /api/accounts/signout { uid }          off this device (stats stay)

import { token } from "./netgame.mjs";
import { phoneTokenTrouble } from "./phonegoogle.mjs";
import { FIREBASE, signInReady, fbRequest, fbUser, fbTrouble, checkCredentials, noAccounts, cleanAccounts, signedIn, useAccount, signedOut, linkPlayer, accountsView } from "./accounts.mjs";

const cleanPlayer = (p) => (typeof p === "string" && p.trim() ? p.trim().slice(0, 20) : null);

export class AccountStore {
  // read() / write(value): where the list's kept. seal / unseal: a refresh
  // token kept as it is, or encrypted (the Windows app). googleWay: how
  // Google signs in here - "desktop" (the PC's own page in the browser),
  // "idToken" (Google's button in the page: the web version), "browser"
  // (the phone app: the phone's browser and back by the app's link -
  // sim/phonegoogle.mjs), or null. For "browser": googlePage(nonce) -> the
  // page to open; started: { get(), set(v) } - the sign-in started, kept
  // where it outlasts the app being put away while the browser's up.
  constructor({ read = () => null, write = () => {}, firebase = FIREBASE, fetchImpl = (...a) => fetch(...a), now = () => Date.now(), seal = (t) => t, unseal = (t) => t, googleWay = null, googlePage = () => null, started = null } = {}) {
    let kept = null;
    started ??= { get: () => kept, set: (v) => (kept = v) };
    Object.assign(this, { read, write, firebase, fetchImpl, now, seal, unseal, googleWay, googlePage, started });
    this.data = null;
    this.onChange = () => {};
  }

  get ready() {
    return signInReady(this.firebase);
  }
  load() {
    if (!this.data) this.data = cleanAccounts(this.read() ?? noAccounts());
    return this.data;
  }
  save(next) {
    this.data = cleanAccounts(next);
    this.write(this.data);
    this.onChange(this.view());
  }
  view() {
    return { ...accountsView(this.load(), { ready: this.ready }), google: this.googleWay };
  }

  // A Firebase request: its answer, or throws { error } (its code).
  async ask(kind, args) {
    if (!this.ready) throw { error: "notready" };
    const { url, body } = fbRequest(kind, args, this.firebase);
    let res;
    try {
      res = await this.fetchImpl(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } catch {
      throw { error: "offline" };
    }
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw { error: j?.error?.message ?? `http ${res.status}` };
    return j;
  }

  // Signed in: kept (its refresh token sealed), and in use.
  keep(u, extra = {}) {
    const user = { uid: u.uid, email: u.email, provider: u.provider, name: u.name ?? null, refresh: u.refresh ? this.seal(u.refresh) : null, at: this.now(), ...extra };
    this.save(signedIn(this.load(), user));
    return this.view();
  }

  async password({ email, password }, { creating }) {
    const bad = checkCredentials({ email, password }, { creating });
    if (bad) throw new Error(bad);
    try {
      const r = await this.ask(creating ? "signUp" : "signIn", { email: String(email).trim(), password });
      return this.keep(fbUser(r, "password", this.now()));
    } catch (err) {
      throw new Error(err?.error ? fbTrouble(err.error) : err.message);
    }
  }

  async reset({ email }) {
    const e = String(email ?? "").trim();
    if (checkCredentials({ email: e, password: "x" })) throw new Error(fbTrouble("INVALID_EMAIL"));
    try {
      await this.ask("reset", { email: e });
    } catch (err) {
      // (Never saying whether there's an account for it.)
      if (err?.error !== "EMAIL_NOT_FOUND") throw new Error(fbTrouble(err.error));
    }
    return { sent: true };
  }

  // The phone app: a sign-in started - its one-time word kept, and the page
  // to open in the phone's browser.
  googleStart() {
    const nonce = token(16);
    const url = this.googlePage(nonce);
    if (!url) throw new Error("Google sign-in can't be reached from here - sign in with your email");
    this.started.set({ nonce, at: this.now() });
    return { url };
  }

  // A Google ID token (Google's own button, in the page): signed in to
  // Firebase with it. In the phone app it came back by the app's link, so
  // it must be the answer to the sign-in started here - once.
  async googleToken({ idToken }) {
    if (!idToken) throw new Error("No Google sign-in came back");
    if (this.googleWay === "browser") {
      const bad = phoneTokenTrouble(idToken, this.started.get(), { now: this.now() });
      if (bad) throw new Error(bad);
      this.started.set(null);
    }
    try {
      const r = await this.ask("google", { idToken });
      return this.keep(fbUser(r, "google", this.now()));
    } catch (err) {
      throw new Error(err?.error ? fbTrouble(err.error) : err.message);
    }
  }

  use({ uid }) {
    this.save(useAccount(this.load(), uid));
    return this.view();
  }

  link({ uid, player }) {
    const name = cleanPlayer(player);
    if (!name) throw new Error("Which player?");
    const a = this.load();
    if (!a.users.some((x) => x.uid === uid)) throw new Error("No such account here");
    if (a.users.some((x) => x.uid !== uid && x.player === name)) throw new Error(`${name} is another account's player here`);
    this.save(linkPlayer(a, uid, name));
    return this.view();
  }

  signOut({ uid }) {
    this.save(signedOut(this.load(), uid));
    return this.view();
  }

  // A saved player renamed: the account follows.
  rename(from, to) {
    const a = this.load();
    if (!a.users.some((u) => u.player === from)) return;
    this.save({ ...a, users: a.users.map((u) => (u.player === from ? { ...u, player: to } : u)) });
  }

  // One request -> { status, json }. extra: the device's own routes
  // (server/accounts.mjs: Google on the PC).
  async request(method, path, body = {}, extra = null) {
    const ok = (json, status = 200) => ({ status, json });
    try {
      if (path === "/api/accounts" && method === "GET") return ok(this.view());
      if (method !== "POST") return ok({ error: "Not found" }, 404);
      const b = body && typeof body === "object" ? body : {};
      const mine = extra ? await extra(path, b) : undefined;
      if (mine !== undefined) return ok(mine);
      if (path === "/api/accounts/signup") return ok(await this.password(b, { creating: true }));
      if (path === "/api/accounts/signin") return ok(await this.password(b, { creating: false }));
      if (path === "/api/accounts/reset") return ok(await this.reset(b));
      if (path === "/api/accounts/google") return ok(this.googleWay === "browser" && !b.idToken ? this.googleStart() : await this.googleToken(b));
      if (path === "/api/accounts/use") return ok(this.use(b));
      if (path === "/api/accounts/link") return ok(this.link(b));
      if (path === "/api/accounts/signout") return ok(this.signOut(b));
      return ok({ error: "Not found" }, 404);
    } catch (err) {
      return ok({ error: err?.message ?? String(err) }, 400);
    }
  }
}
