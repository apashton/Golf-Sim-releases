// Ladders on the web (the owner, 7 November 2026: links that add you "in
// game when they next login", and "an online view of stuff without app or
// pc (which can also help link up users data)"): the Online tab's On the
// web card, and the game's side of a browser signed in to this PC.
//   - On the web: this PC's link (server/phonelinks.mjs - the one its phones
//     use) opened for a quarter of an hour, and its sign-in page's QR code
//     (relay/webpages.mjs /me). A phone's camera on it signs that phone's
//     browser in: it then sees this PC's players and online ladders, and a
//     ladder's page lets it join as one of them or answer a challenge.
//   - What the browser needs: this PC's online ladders, each with the key
//     it's on them by, and its courses' first holes (to accept a challenge
//     on) - told to the server when they change (reportLadders), which
//     leaves them on the link with the players.
//   - A ladder joined in a browser comes back through the link (its key
//     with it): taken up here (takeWebInbox) the next time the PC's in step
//     with it, as if joined on this PC.
// Only on the PC: the phone app's ladders are its own.
// Part of CourseMode (course.js), split out of it: these methods are
// added to CourseMode.prototype there and run with `this` the course.

import { esc, typingNow } from "../util.js";
import { qrSvg } from "../netlobby.js";
import { webLadders, webCourse, inboxWords } from "../sim/ladderweb.mjs";

// While the card's open, in step with the link this often (a browser
// signing in then gets the players and ladders at once).
const STEP_MS = 30000;

export class CourseLadderWeb {
  // The card, under Open ladders (course/ladderopen.js).
  webCardHtml() {
    if (this.isPocket?.()) return "";
    const v = this.ladderWeb;
    if (!v) return `<p class="small"><button data-web="open" title="Sign a phone's browser in to this PC: your ladders on the web, and join or answer a challenge from anywhere - it goes on this PC the next time A² Golf is open">On the web</button> <span class="muted">Your ladders on a phone's browser, no app needed.</span></p>`;
    if (v.error) return `<div class="ladder-card"><p class="small bad">${esc(v.error)}</p><p class="small"><button data-web="close">Close</button></p></div>`;
    if (!v.web) return `<div class="ladder-card"><p class="small">Opening...</p></div>`;
    const open = v.open ? new Date(v.open).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : null;
    const browsers = (v.phones ?? []).filter((p) => p.name === "Web browser").length;
    return `<div class="ladder-card ladder-qr">${qrSvg(v.web)}<p class="small">Point a phone's camera at this, or open <b>${esc(v.web.replace(/#.*$/, ""))}</b> and type <b>${esc(v.shown ?? "")}</b>${open ? ` (until ${esc(open)})` : ""}. That phone's browser then shows your players and online ladders, and a ladder's page lets you join it or answer a challenge from there - it goes on this PC the next time A² Golf is open.${browsers ? ` ${browsers === 1 ? "A browser is" : `${browsers} browsers are`} signed in now (My stats, Your phones, to take one off).` : ""}</p><p class="small"><button data-web="close">Done</button></p></div>`;
  }

  wireWebCard(box) {
    box.querySelector("[data-web=open]")?.addEventListener("click", () => this.openWeb());
    box.querySelector("[data-web=close]")?.addEventListener("click", () => this.closeWeb());
  }

  // The link opened for a browser, and its QR code shown - kept in step
  // meanwhile, so a browser signing in gets what it needs at once.
  async openWeb() {
    this.ladderWeb = {};
    this.renderLadder();
    await this.reportLadders(true);
    const ask = (op) => fetch("/api/phone/link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op }) }).then((r) => r.json());
    try {
      const v = await ask("link");
      this.ladderWeb = v.web ? v : { error: v.error ?? "Couldn't open the link - check the internet connection" };
    } catch {
      this.ladderWeb = { error: "Couldn't open the link - check the internet connection" };
    }
    clearInterval(this.webTimer);
    if (this.ladderWeb.web) {
      const until = Date.now() + 15 * 60000;
      this.webTimer = setInterval(async () => {
        if (!this.ladderWeb || Date.now() > until) return this.closeWeb();
        try {
          const v = await ask("sync");
          if (this.ladderWeb) this.ladderWeb = { ...this.ladderWeb, phones: v.phones ?? this.ladderWeb.phones };
          // (Not over a name or code being typed: the next tick draws it.)
          if (!typingNow()) this.renderLadder();
        } catch {
          // Next time.
        }
      }, STEP_MS);
    }
    this.renderLadder();
  }
  closeWeb() {
    clearInterval(this.webTimer);
    this.ladderWeb = null;
    this.renderLadder();
  }

  // This PC's online ladders, to the server (it leaves them on the link for
  // a signed-in browser) when they've changed - and its courses' first
  // holes when asked (courses). Its seasons by post too: their codes and
  // names (no keys), for the browser's list.
  async reportLadders(courses = false) {
    if (this.isPocket?.()) return;
    const ladders = webLadders(this.ladders.list);
    const seasons = (this.postSeasons?.list ?? []).map((S) => ({ code: S.code, name: S.view.season.name, player: S.view.me?.name ?? "" }));
    // (Its courses only when asked - the card opening: each course read in
    // full for its first holes. The server keeps what it was last told.)
    let sendCourses = null;
    if (courses) {
      sendCourses = [];
      for (const c of (this.list ?? []).slice(0, 40)) {
        try {
          const full = await fetch(`/api/courses/${encodeURIComponent(c.id)}`).then((r) => (r.ok ? r.json() : null));
          const w = full ? webCourse(full) : null;
          if (w) sendCourses.push(w);
        } catch {
          // (Not readable now: left out.)
        }
      }
    }
    const said = JSON.stringify([ladders, seasons]);
    if (said === this.webSaid && !sendCourses) return;
    this.webSaid = said;
    await fetch("/api/phone/link/ladders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sendCourses ? { ladders, seasons, courses: sendCourses } : { ladders, seasons }) }).catch(() => null);
  }

  // Ladders joined in a browser signed in to this PC: each taken up with
  // the key it joined with - brought up to date from the relay and kept
  // here as if joined on this PC - and the server told they're done. And
  // seasons by post the same (course/seasonpost.js takeWebSeason).
  async takeWebInbox() {
    if (this.isPocket?.() || this.webTaking) return;
    this.webTaking = true;
    try {
      const { items = [] } = await fetch("/api/phone/link/inbox").then((r) => (r.ok ? r.json() : {}));
      const done = [];
      const joined = [];
      const seasons = [];
      for (const it of items) {
        if (it?.kind === "season") {
          try {
            const name = await this.takeWebSeason(it);
            if (name) seasons.push(name);
            done.push(it.id);
          } catch (err) {
            if (err.status) done.push(it.id);
          }
          continue;
        }
        if (it?.kind !== "ladder") {
          done.push(it?.id);
          continue;
        }
        const had = this.ladders.list.find((L) => L.online?.code === it.code);
        if (had) {
          done.push(it.id);
          continue;
        }
        try {
          const reply = await this.ladderStore().read(it.code, it.key);
          const L = this.takeOnline(reply, it.key);
          if (L) {
            this.putOnline(L);
            joined.push(L.name);
          }
          done.push(it.id);
        } catch (err) {
          // Gone, or taken off it meanwhile: dropped. (Not reached: next time.)
          if (err.status) done.push(it.id);
        }
      }
      if (done.length) await fetch("/api/phone/link/inbox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ done }) }).catch(() => null);
      if (seasons.length) this.onToast(inboxWords(seasons, "Seasons"), 6000);
      if (joined.length) {
        this.onToast(inboxWords(joined), 6000);
        this.sendAlertTokens?.();
        this.onLadderOnline?.();
        this.renderLadder();
      }
    } catch {
      // The server not there: next time.
    } finally {
      this.webTaking = false;
    }
  }
}
