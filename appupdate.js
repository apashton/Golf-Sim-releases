// The phone app: a card when a newer version is out (sim/appupdate.mjs has
// the rules). Asked once the game's loaded and whenever the app's brought
// back to the front, at most once an hour - and at once when the player
// asks (Menu, Check for updates). The
// card sits at the top of the picture with Download - the APK, opened in
// the phone's browser (a link off the app's own pages leaves the app) -
// and Later. Only in the app.

import { RELEASES_API, dueToCheck, updateNotice, noticeWords, apkVersion } from "./sim/appupdate.mjs";
import { esc, loadSetting, saveSetting } from "./util.js";

// asked: the player asked - GitHub's asked now whenever it last was, a
// version put off with Later is shown again, and what was found is handed
// back to be said: { state: "newer" | "current" | "none" | "offline",
// version, current } (sim/appupdate.mjs checkedWords). By itself: the
// notice, or null.
let asking = null;
export function checkAppUpdate({ doc = document, now = Date.now(), asked = false } = {}) {
  // (One at a time: the app opening and coming to the front together.)
  if (asking && !asked) return asking;
  const run = check({ doc, now, asked }).finally(() => {
    if (asking === run) asking = null;
  });
  if (!asked) asking = run;
  return run;
}
async function check({ doc, now, asked }) {
  const kept = loadSetting("appUpdate", {});
  if (!asked && !dueToCheck(kept.checked, now)) return null;
  let current = null;
  let release = null;
  try {
    current = (await (await fetch("/pocket/app.json")).json()).version;
    const r = await fetch(RELEASES_API, { headers: { Accept: "application/vnd.github+json" }, cache: "no-store" });
    if (!r.ok) return asked ? { state: "offline", current } : null;
    release = await r.json();
  } catch {
    // No internet, or GitHub not answering: asked again next time.
    return asked ? { state: "offline", current } : null;
  }
  saveSetting("appUpdate", { ...loadSetting("appUpdate", {}), checked: now });
  const notice = updateNotice({ current, release, later: asked ? null : kept.later, now });
  if (notice) showCard(doc, { ...notice, current });
  if (!asked) return notice;
  const version = apkVersion(release);
  return { state: notice ? "newer" : version ? "current" : "none", version, current };
}

// A phone's apps are left open for days, and the game with them: asked
// again whenever it's brought back to the front (if it's due).
export function checkWhenBack(doc = document) {
  doc.addEventListener("visibilitychange", () => {
    if (doc.visibilityState === "visible") checkAppUpdate({ doc });
  });
}

function showCard(doc, { version, url, current }) {
  doc.querySelector(".app-update")?.remove();
  const words = noticeWords({ version, current });
  const card = doc.createElement("div");
  card.className = "app-update";
  card.setAttribute("role", "status");
  card.innerHTML = `<b>${esc(words.title)}</b><span>${esc(words.line)}</span><div><a class="primary" href="${esc(url)}">Download</a><button type="button" data-later>Later</button></div>`;
  card.addEventListener("click", (e) => {
    if (e.target.closest("[data-later]")) {
      saveSetting("appUpdate", { ...loadSetting("appUpdate", {}), later: { version, at: Date.now() } });
      card.remove();
    } else if (e.target.closest("a")) card.remove();
  });
  doc.body.append(card);
}
