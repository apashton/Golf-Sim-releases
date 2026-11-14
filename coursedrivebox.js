// The courses you make kept in your own Google Drive (sim/coursesync.mjs
// says what and why): the box that turns it on or off - it's off unless
// you turn it on - says how it is, and syncs now. Opened from the Course
// tab and the course designer (Google Drive...); the same on the PC (its
// server has the player's Google sign-in: server/coursedrive.mjs) and in
// the web version (the page asks Google for its permission:
// drivepermit.js). Not in the phone app.
//   driveBox({ changed })   the box; changed(): a sync may have changed
//                           the courses here
//   driveQuietly()          the web version: in step again if it's on and
//                           Google's permission is still in hand - never
//                           asks (after a save, as a page opens)

import { esc } from "./util.js";
import { drivePermit, readyPermit, forgetPermit } from "./drivepermit.js";

const WEB = typeof window !== "undefined" && !!window.pocket;
const view = () =>
  fetch("/api/drive/courses")
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
const post = (url, body = {}) =>
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(async (r) => {
    const j = await r.json().catch(() => ({}));
    if (!r.ok && !("on" in j)) throw new Error(j.error ?? r.statusText);
    return j;
  });

// When it was last checked, in words.
function when(at) {
  if (!Number.isFinite(at)) return "";
  const mins = Math.round((Date.now() - at) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  return new Date(at).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" });
}

// How it is, as the box's inside. said: a line about what was just tried.
export function driveHtml(v, said = "") {
  const note = said ? `<p class="small drive-said" role="status">${esc(said)}</p>` : "";
  const done = `<button value="close"${v?.on ? "" : ' class="primary"'}>Done</button>`;
  if (!v?.available) return `<p class="small">Google sign-in isn't in this copy of A² Golf, so its courses can't be kept in Google Drive.</p>${note}<div class="dialog-buttons">${done}</div>`;
  const what = `<p class="small">Keep the courses you make in your own Google Drive, and they're on every PC and browser you turn this on in - a course made or changed on one is on the others. Only the ones made in the course designer: not the game's own, nor friends'.</p>`;
  if (!v.on) {
    const who = v.web
      ? ""
      : v.players.length > 1
        ? `<label>Whose Google Drive <select class="drive-player">${v.players.map((p) => `<option>${esc(p)}</option>`).join("")}</select></label>`
        : v.players.length
          ? `<p class="small">In <b>${esc(v.players[0])}</b>'s Google Drive.</p>`
          : `<p class="small">First sign a player in to Google: <b>My stats</b>, <b>Your Google account</b>. Then turn it on here.</p>`;
    const can = v.web || v.players.length > 0;
    return `${what}<p class="small"><b>It's off</b> - your courses are kept only on this ${v.web ? "browser" : "PC"}.</p>${who}${note}
      <div class="dialog-buttons">${done}${can ? `<button type="button" class="primary" data-drive="on">Turn it on</button>` : ""}</div>`;
  }
  const last = v.last;
  const state = v.busy
    ? "Checking..."
    : last?.error
      ? esc(last.error)
      : last
        ? `${v.count} course${v.count === 1 ? "" : "s"} there - ${esc(last.words)}, ${when(last.at)}${last.failed ? ` (${last.failed} couldn't be read)` : ""}`
        : "Not checked yet";
  const again = v.signin && !v.web ? `<p class="small">Sign in to Google again on <b>My stats</b>, <b>Your Google account</b>.</p>` : v.web && v.needsToken ? `<p class="small muted">Sync now asks Google again: its permission lasts an hour.</p>` : "";
  return `<p class="small"><b>It's on</b> - the courses you make here are kept in <b>${esc(v.email ?? v.who ?? "your")}</b>${v.email || v.who ? "'s" : ""} Google Drive (the folder <b>A² Golf</b>, <b>A² Golf courses</b>), and the ones there are here.</p>
    <p class="small drive-state${last?.error ? " error" : ""}">${state}</p>${again}${note}
    <div class="dialog-buttons"><button type="button" data-drive="off" title="Stop keeping them in step: the courses stay here, and in the Drive, as they are">Turn it off</button><button type="button" data-drive="sync">Sync now</button><button value="close" class="primary">Done</button></div>`;
}

export function driveBox({ changed = () => {} } = {}) {
  return new Promise((resolve) => {
    const d = document.createElement("dialog");
    d.className = "small-dialog share-box drive-box";
    d.innerHTML = `<form method="dialog"><h3>Your courses in Google Drive</h3><div class="drive-body"><p class="small">Looking...</p></div></form>`;
    d.addEventListener("close", () => {
      d.remove();
      resolve();
    });
    document.body.appendChild(d);
    d.showModal();
    const body = d.querySelector(".drive-body");
    const show = (v, said) => (body.innerHTML = driveHtml(v, said));
    // (Google's script ready ahead of the press that opens its window.)
    if (WEB) readyPermit().catch(() => {});
    view().then((v) => show(v));
    body.addEventListener("click", async (e) => {
      const act = e.target.closest("button[data-drive]")?.dataset.drive;
      if (!act) return;
      const buttons = [...body.querySelectorAll("button")];
      const player = body.querySelector(".drive-player")?.value ?? null;
      for (const b of buttons) b.disabled = true;
      const state = body.querySelector(".drive-state, .drive-said");
      if (state && act !== "off") state.textContent = act === "on" ? "Turning it on..." : "Checking...";
      try {
        let v;
        if (act === "off") {
          v = await post("/api/drive/courses", { on: false });
          if (WEB) forgetPermit();
        } else {
          const permit = WEB ? await drivePermit() : {};
          v = await post(act === "on" ? "/api/drive/courses" : "/api/drive/courses/sync", act === "on" ? { on: true, player, ...permit } : permit);
          changed();
        }
        show(v, v.error ?? "");
      } catch (err) {
        show(await view(), err.message);
      }
    });
  });
}

// The web version only: see the top.
export async function driveQuietly() {
  if (!WEB || !window.a2web) return null;
  try {
    const v = await view();
    if (!v?.on) return null;
    const permit = await drivePermit({ ask: false });
    return permit ? await post("/api/drive/courses/sync", permit) : v;
  } catch {
    return null;
  }
}
