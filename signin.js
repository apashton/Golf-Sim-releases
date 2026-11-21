// Signing in to play, and the player switcher (sim/accounts.mjs says what
// and why; sim/accountstore.mjs and server/accounts.mjs keep them):
//   - No account on this device: a card before play, until someone signs
//     in - with Google (recommended: their stats and players follow them to
//     the phone and the web) or an email and password (create one, sign in,
//     forgot password). Then "Which player are you?": one of the saved
//     players here (their history becomes theirs) or a new one.
//   - After that the game opens straight into the account in use, as its
//     player.
//   - The player name (the top bar's, the bay view's): the switcher - who's
//     signed in here, switch to another, sign someone else in, Who's playing
//     (friends, children, guests: players without a login), sign out.
// The same on the PC, the phone and the web version: each asks its own
// server's /api/accounts. Google here: the PC's own page in the browser
// (googleWay "desktop"), Google's button in the web version ("idToken"),
// the phone's browser and back in the phone app ("browser"),
// not inside the phone app (null: email there).

import { esc } from "./util.js";
import { nameFor } from "./sim/accounts.mjs";
import { GOOGLE } from "./sim/google.mjs";

const post = (url, body = {}) =>
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(async (r) => {
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error ?? r.statusText);
    return j;
  });
const getView = () => fetch("/api/accounts").then((r) => (r.ok ? r.json() : null));
// Browser checks and the picture tools play without signing in.
const skipped = () => {
  try {
    return localStorage.getItem("golfsim.signinSkip") === "1";
  } catch {
    return false;
  }
};
const GOOGLE_NOTE = "With Google, your stats and players go with you to the phone and the web - kept in your own Google Drive.";

export class SignIn {
  // players(): the saved players here. playAs(player, { start }): that
  // player hitting (app.js). openWho(): the Who's playing card.
  constructor({ players = () => [], playAs = () => {}, openWho = () => {}, toast = () => {} } = {}) {
    Object.assign(this, { players, playAs, openWho, toast });
    this.view = null;
    this.dialog = document.createElement("dialog");
    this.dialog.className = "small-dialog who-dialog signin-dialog";
    document.body.appendChild(this.dialog);
    // Esc closes it only when signing in isn't needed.
    this.dialog.addEventListener("cancel", (e) => {
      if (this.required) e.preventDefault();
    });
    this.dialog.addEventListener("click", (e) => this.click(e));
    this.dialog.addEventListener("submit", (e) => {
      e.preventDefault();
      this.password(e.submitter?.dataset.act === "signup");
    });
  }

  // As the game starts: a card when nobody's signed in here; else straight
  // in as the account in use.
  async start() {
    try {
      this.view = await getView();
    } catch {
      this.view = null;
    }
    if (!this.view?.ready || skipped()) return;
    const cur = this.current();
    if (!cur) return this.open({ required: true });
    if (!cur.player) return this.who(cur, { required: true });
    this.playAs(cur.player, { start: true });
  }
  current() {
    return this.view?.users?.find((u) => u.uid === this.view.current) ?? null;
  }
  // Whether signing in's there to click the name for.
  get ready() {
    return !!this.view?.ready;
  }

  show(html, { required }) {
    this.required = required;
    this.dialog.innerHTML = html;
    if (!this.dialog.open) this.dialog.showModal();
  }
  close() {
    clearTimeout(this.waitTimer);
    this.required = false;
    if (this.dialog.open) this.dialog.close();
  }
  say(text) {
    const m = this.dialog.querySelector(".si-msg");
    if (m) m.textContent = text;
  }

  // ---- Signing in ---------------------------------------------------------------

  open({ required = false } = {}) {
    const google = this.view?.google;
    this.show(
      `<h3>${required ? "Sign in to play" : "Sign someone else in"}</h3>
      <p class="small">${required ? "One sign-in and A² Golf knows who you are - and opens as you every time after." : "They'll be able to switch to themselves from the player name."}</p>
      ${google ? `<div class="si-google">${google === "desktop" || google === "browser" ? `<button type="button" class="primary" data-act="google">Continue with Google</button>` : `<div class="si-gis"></div>`}</div><p class="small si-note">${esc(GOOGLE_NOTE)}</p><p class="small muted si-or">Or with your email:</p>` : `<p class="small si-note">${esc(GOOGLE_NOTE)} (Google sign-in is in the Windows app, the phone app and the web version.)</p>`}
      <form class="si-form">
        <label class="small">Email <input type="email" class="si-email" autocomplete="email" required></label>
        <label class="small">Password <input type="password" class="si-password" autocomplete="current-password" required minlength="6"></label>
        <div class="dialog-buttons"><button type="button" class="linkish" data-act="forgot">Forgot password?</button><button data-act="signup">Create account</button><button data-act="signin" class="primary">Sign in</button></div>
      </form>
      <p class="small si-msg" role="status" aria-live="polite"></p>
      ${required ? "" : `<div class="dialog-buttons"><button type="button" data-act="close">Close</button></div>`}`,
      { required },
    );
    if (google === "idToken") this.googleButton();
    this.dialog.querySelector(".si-email")?.focus();
  }

  click(e) {
    const b = e.target.closest("[data-act]");
    if (!b || b.type === "submit") return;
    const act = b.dataset.act;
    if (act === "close") this.close();
    else if (act === "google") this.google();
    else if (act === "forgot") this.forgot();
    else if (act === "me") this.link(b.dataset.player);
    else if (act === "new") this.link(this.dialog.querySelector(".si-new")?.value);
    else if (act === "use") this.use(b.dataset.uid);
    else if (act === "another") this.open({ required: false });
    else if (act === "who") (this.close(), this.openWho());
    else if (act === "out") this.signOut(b.dataset.uid);
  }

  async password(creating) {
    const email = this.dialog.querySelector(".si-email")?.value ?? "";
    const password = this.dialog.querySelector(".si-password")?.value ?? "";
    this.say(creating ? "Making your account..." : "Signing in...");
    try {
      const before = new Set((this.view?.users ?? []).map((u) => u.uid));
      this.view = await post(creating ? "/api/accounts/signup" : "/api/accounts/signin", { email, password });
      this.signedIn(before);
    } catch (err) {
      this.say(err.message);
    }
  }

  async forgot() {
    const email = this.dialog.querySelector(".si-email")?.value ?? "";
    if (!email) return this.say("Type your email above, then Forgot password");
    try {
      await post("/api/accounts/reset", { email });
      this.say(`If there's an account for ${email}, an email to set a new password is on its way.`);
    } catch (err) {
      this.say(err.message);
    }
  }

  // The PC: Google's page in the player's own browser; asked every two
  // seconds until they're back, signed in.
  // The phone app the same, by its browser (sim/phonegoogle.mjs): the page
  // opened there comes back by the app's link (googleBack), and the asking
  // sees it too.
  async google() {
    const phone = this.view?.google === "browser";
    this.say(phone ? "Sign in with Google in your browser, then come back here..." : "Finish signing in on Google's page in your browser...");
    const before = new Set((this.view?.users ?? []).map((u) => u.uid));
    try {
      const { url } = await post("/api/accounts/google");
      // (The app's own page going to an address outside the app is handed
      // to the phone's browser by the app, and the game stays where it is.)
      if (phone) location.assign(url);
      else window.open(url, "_blank", "noopener");
    } catch (err) {
      return this.say(err.message);
    }
    const until = Date.now() + 10 * 60000;
    const ask = async () => {
      if (!this.dialog.open || Date.now() > until) return;
      try {
        const v = await getView().catch(() => null);
        // (A reply without its list of users is no answer yet.)
        if (v?.users?.some((u) => !before.has(u.uid) || (u.uid === v.current && v.current !== this.view?.current))) {
          this.view = v;
          return this.signedIn(before);
        }
      } catch {
        // Asked again in a moment.
      }
      this.waitTimer = setTimeout(ask, 2000);
    };
    this.waitTimer = setTimeout(ask, 2000);
  }

  // The phone app: Google's answer back by the app's link (netinvite.js) -
  // signed in with it, or the card up saying why not.
  async googleBack(idToken) {
    clearTimeout(this.waitTimer);
    if (!this.view) this.view = await getView().catch(() => null);
    const before = new Set((this.view?.users ?? []).map((u) => u.uid));
    try {
      this.view = await post("/api/accounts/google", { idToken });
      this.signedIn(before);
    } catch (err) {
      if (!this.dialog.open) this.open({ required: !this.current() });
      this.say(err.message);
    }
  }

  // The web version: Google's own button (its script loaded once).
  googleButton() {
    const el = this.dialog.querySelector(".si-gis");
    if (!el) return;
    const draw = () => {
      window.google.accounts.id.initialize({
        client_id: GOOGLE.webClient,
        callback: async ({ credential }) => {
          this.say("Signing in...");
          try {
            const before = new Set((this.view?.users ?? []).map((u) => u.uid));
            this.view = await post("/api/accounts/google", { idToken: credential });
            this.signedIn(before);
          } catch (err) {
            this.say(err.message);
          }
        },
      });
      window.google.accounts.id.renderButton(el, { theme: "filled_black", size: "large", text: "continue_with", shape: "pill" });
    };
    if (window.google?.accounts?.id) return draw();
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = draw;
    s.onerror = () => (el.textContent = "Google's button couldn't load - sign in with your email below");
    document.head.appendChild(s);
  }

  // Signed in: their player here, or asked which they are.
  signedIn() {
    const cur = this.current();
    if (!cur) return;
    if (cur.player) {
      this.close();
      this.playAs(cur.player, { start: false });
      this.toast(`Signed in - ${cur.player} hitting`, 2200);
      return;
    }
    this.who(cur, { required: true });
  }

  // ---- Which player are you? ------------------------------------------------------

  who(account, { required = true } = {}) {
    const taken = new Set((this.view?.users ?? []).filter((u) => u.uid !== account.uid).map((u) => u.player));
    const free = this.players().filter((n) => !taken.has(n));
    this.linking = account.uid;
    this.show(
      `<h3>Which player are you?</h3>
      <p class="small">Signed in as <b>${esc(account.email ?? "your account")}</b>. ${free.length ? "Pick yourself from the players here - their shots and rounds are yours from now on - or add yourself." : "Add yourself as a player."}</p>
      ${free.length ? `<div class="who-list">${free.map((n) => `<button type="button" class="who-chip" data-act="me" data-player="${esc(n)}">${esc(n)}</button>`).join("")}</div>` : ""}
      <div class="who-row"><input type="text" class="si-new" maxlength="20" autocomplete="off" value="${esc(free.includes(nameFor(account)) || taken.has(nameFor(account)) ? "" : nameFor(account))}" placeholder="Your name" aria-label="Your name"><button type="button" class="primary" data-act="new">That's me</button></div>
      <p class="small si-msg" role="status" aria-live="polite"></p>`,
      { required },
    );
  }

  async link(player) {
    const name = String(player ?? "").trim();
    if (!name) return this.say("Type your name, or pick yourself");
    try {
      this.view = await post("/api/accounts/link", { uid: this.linking, player: name });
      this.close();
      this.playAs(name, { start: true, added: true });
      this.toast(`Welcome, ${name}`, 2200);
    } catch (err) {
      this.say(err.message);
    }
  }

  // ---- The switcher (the player name) ---------------------------------------------------

  async switcher() {
    try {
      this.view = await getView();
    } catch {
      // As last known.
    }
    if (!this.view?.ready) return this.openWho();
    const cur = this.current();
    if (!cur) return this.open({ required: !skipped() });
    const others = this.view.users.filter((u) => u.uid !== cur.uid);
    const how = (u) => (u.provider === "google" ? "Google" : "email");
    this.show(
      `<h3>${esc(cur.player ?? "Signed in")}</h3>
      <p class="small">Signed in as <b>${esc(cur.email ?? "")}</b> (${how(cur)})${cur.provider === "google" ? " - stats kept in their Google Drive" : ""}.</p>
      ${others.length ? `<p class="small muted">Also signed in here:</p><div class="who-list">${others.map((u) => `<button type="button" class="who-chip" data-act="use" data-uid="${esc(u.uid)}">${esc(u.player ?? u.email ?? "")}</button>`).join("")}</div>` : ""}
      <div class="dialog-buttons si-switch">
        <button type="button" data-act="another">Sign someone else in</button>
        <button type="button" data-act="who">Who's playing...</button>
        <button type="button" class="danger" data-act="out" data-uid="${esc(cur.uid)}">Sign out</button>
        <button type="button" class="primary" data-act="close">Done</button>
      </div>
      <p class="small muted">Friends, children and guests play from <i>Who's playing</i> - no sign-in needed.</p>
      <p class="small si-msg" role="status" aria-live="polite"></p>`,
      { required: false },
    );
  }

  async use(uid) {
    try {
      this.view = await post("/api/accounts/use", { uid });
      const cur = this.current();
      if (!cur?.player) return this.who(cur, { required: false });
      this.close();
      this.playAs(cur.player, { start: false });
      this.toast(`${cur.player} hitting`, 1800);
    } catch (err) {
      this.say(err.message);
    }
  }

  async signOut(uid) {
    const leaving = this.view?.users?.find((u) => u.uid === uid);
    try {
      this.view = await post("/api/accounts/signout", { uid });
    } catch (err) {
      return this.say(err.message);
    }
    this.toast(`${leaving?.player ?? "They're"} signed out - their stats stay`, 2200);
    const cur = this.current();
    if (!cur) return this.open({ required: !skipped() });
    this.close();
    if (cur.player) this.playAs(cur.player, { start: false });
  }
}
