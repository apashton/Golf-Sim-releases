// My stats -> Your Google account (stats.html): the player showing signed in
// to Google, so their stats are kept in their own Google Drive and in step
// on every computer they sign in on (server/googleauth.mjs, drivesync.mjs;
// docs/STATS-CLOUD-PLAN.md). Sign in opens Google's page in the player's
// own browser (Google won't sign in inside an app's window); this asks every
// couple of seconds until it's done. Signed in: who as, how in step it is,
// Sync now and Sign out. Shown only where the game's server can sign in
// (not on the phone yet, nor a copy without Google sign-in).

import { esc } from "./util.js";
import { driveWords } from "./sim/drivesync.mjs";

const $ = (id) => document.getElementById(id);
const post = (url, body) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(async (r) => {
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? r.statusText);
  return j;
});

export class GoogleCard {
  // player(): whose stats are showing. changed(): stats came in from Drive.
  constructor({ player = () => null, changed = () => {} } = {}) {
    Object.assign(this, { player, changed });
    this.waitUntil = 0;
    this.got = null;
    $("google-in").addEventListener("click", () => this.signIn());
    $("google-sync").addEventListener("click", () => this.syncNow());
    $("google-out").addEventListener("click", () => this.signOut());
  }

  // The player showing changed (or came back): how they are.
  async show() {
    clearTimeout(this.timer);
    const who = this.player();
    if (!who) return;
    let v = null;
    try {
      v = await fetch(`/api/google/status?player=${encodeURIComponent(who)}`).then((r) => (r.ok ? r.json() : null));
    } catch {
      v = null;
    }
    if (who !== this.player()) return;
    this.render(who, v);
    // Asked again soon while a sign-in's waiting or it's busy, else every
    // minute.
    const soon = (Date.now() < this.waitUntil && !v?.signedIn) || v?.drive?.busy;
    this.timer = setTimeout(() => this.show(), soon ? 2000 : 60000);
  }

  render(who, v) {
    $("google-wrap").hidden = !v?.available;
    if (!v?.available) return;
    const name = esc(who);
    $("google-who").innerHTML = v.signedIn
      ? `<b>${name}</b> is signed in as <b>${esc(v.email ?? "a Google account")}</b>: their stats are kept in that Google Drive, in a folder called A² Golf.`
      : `Keep <b>${name}</b>'s stats in their own Google Drive: in step on every computer they sign in on, and safe if this one isn't. A² Golf can only see the files it makes there.${v.why ? ` <span class="warn">${esc(v.why)}.</span>` : ""}`;
    $("google-state").textContent = v.signedIn ? driveWords(v.drive ?? {}) : Date.now() < this.waitUntil ? "Finish signing in on Google's page in your browser..." : "";
    $("google-in").hidden = v.signedIn;
    $("google-sync").hidden = !v.signedIn;
    $("google-out").hidden = !v.signedIn;
    // Lines in from another device: My stats drawn again.
    const got = v.drive?.got ?? null;
    if (this.got != null && got != null && got > this.got) this.changed();
    this.got = got;
    if (v.signedIn) this.waitUntil = 0;
  }

  async signIn() {
    const who = this.player();
    $("google-msg").textContent = "";
    try {
      const { url } = await post("/api/google/start", { player: who });
      // (The Windows app opens it in the player's browser.)
      window.open(url, "_blank", "noopener");
      this.waitUntil = Date.now() + 10 * 60000;
    } catch (err) {
      $("google-msg").textContent = `Couldn't start signing in: ${err.message}`;
    }
    this.show();
  }

  async syncNow() {
    $("google-msg").textContent = "";
    $("google-state").textContent = "Stats in Drive: getting in step...";
    try {
      await post("/api/google/sync", { player: this.player() });
    } catch (err) {
      $("google-msg").textContent = `Couldn't get in step: ${err.message}`;
    }
    this.show();
  }

  async signOut() {
    const who = this.player();
    try {
      await post("/api/google/signout", { player: who });
      $("google-msg").textContent = `${who} is signed out. Their stats stay here and in their Drive.`;
    } catch (err) {
      $("google-msg").textContent = `Couldn't sign out: ${err.message}`;
    }
    this.show();
  }
}
