// Play / At the range -> My stats (link.html): this phone linked to the PC
// once (net/devicelink.mjs PhoneLink, sim/devicelink.mjs) - linked here with
// the code the PC's My stats shows (or its QR code's link: ?code=), then in
// step by itself (the game page syncs too: pocket.mjs). What the PC left
// shows here: each player's handicaps, club distances and last rounds.

import { PhoneLink } from "../net/devicelink.mjs";
import { outboxSummary, phoneOutbox, handicapLines } from "../sim/phonesync.mjs";
import { mergeProfiles, agoWords, readLinkCode, showLinkCode, deviceName } from "../sim/devicelink.mjs";
import { DEFAULT_RELAY } from "../sim/netgame.mjs";
import { readProfiles } from "../sim/profiles.mjs";
import { pageStore } from "./pocket.mjs";
import { esc, loadSetting, saveSetting } from "../util.js";

const store = pageStore();
const outbox = phoneOutbox(store);
const $ = (id) => document.getElementById(id);
const saved = () => readProfiles(loadSetting("profiles", null), loadSetting("course", {}).players);

// What the PC calls this phone: its first saved player's.
const phoneName = () => deviceName(saved().list, "phone", "A² Golf phone");

const link = new PhoneLink({
  store,
  outbox,
  relay: DEFAULT_RELAY,
  name: phoneName,
  // The PC's players taken into the phone's own.
  onDown: (down) => {
    const was = saved();
    const p = mergeProfiles(was, down.players);
    if (p !== was) saveSetting("profiles", p);
  },
  onChange: show,
});

const yards = (m) => (Number.isFinite(m) ? Math.round(m * 1.09361) : "-");
const toPar = (n) => (n === 0 ? "E" : n > 0 ? `+${n}` : `${n}`);
const day = (t) => (Number.isFinite(t) ? new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "");

function statsHtml(down) {
  if (!down) return "";
  const names = [...new Set([...down.players.map((p) => p.name), ...Object.keys(down.stats)])].filter((n) => down.stats[n] || down.handicaps[n]);
  return names
    .map((name) => {
      const s = down.stats[name];
      const hcp = handicapLines({ [name]: down.handicaps[name] })[0]?.replace(`${name} - `, "") ?? "";
      const clubs = s?.clubs?.length
        ? `<table class="small"><tr><th>Club</th><th>Carry</th><th>Total</th><th>Shots</th></tr>${s.clubs.map((c) => `<tr><td>${esc(c.club)}</td><td>${yards(c.carry)}</td><td>${yards(c.total)}</td><td>${c.n}</td></tr>`).join("")}</table>`
        : `<p class="small muted">No club distances yet.</p>`;
      const rounds = s?.rounds?.length
        ? `<ul class="small">${s.rounds.map((r) => `<li>${esc(day(r.t))} ${esc(r.course ?? "A round")}${r.played ? ` (${r.played} holes)` : ""}${Number.isFinite(r.score) ? ` - ${r.score}${Number.isFinite(r.toPar) ? ` (${toPar(r.toPar)})` : ""}` : ""}</li>`).join("")}</ul>`
        : "";
      return `<div class="card"><h2>${esc(name)}</h2><p class="small">${esc(hcp)}</p>${clubs}${rounds}</div>`;
    })
    .join("") + `<p class="small muted">From ${esc(down.pc)}, ${esc(agoWords(down.at))} (yards; the swing pad's shots are counted apart, as on the PC).</p>`;
}

function show(view = link.view()) {
  $("state").textContent = view.words;
  $("state").className = view.state === "failed" ? "no" : view.linked && view.state === "done" ? "yes" : "muted";
  $("link-form").hidden = view.linked;
  $("link-help").hidden = view.linked;
  $("linked").hidden = !view.linked;
  $("sync").disabled = view.state === "syncing";
  $("link").disabled = view.state === "syncing";
  const sum = outboxSummary(outbox.entries());
  $("waiting").innerHTML = sum.writes
    ? `<ul>${sum.players.map((p) => `<li><b>${esc(p.name)}</b>: ${p.shots} shot${p.shots === 1 ? "" : "s"}${p.games ? `, ${p.games} game${p.games === 1 ? "" : "s"}` : ""}</li>`).join("")}</ul>`
    : view.linked
      ? "Nothing - everything's gone to the PC."
      : "Nothing yet.";
  $("waiting").classList.toggle("muted", !sum.writes);
  $("stats").innerHTML = view.down ? statsHtml(view.down) : `<div class="card"><p class="small muted">${view.linked ? "Your stats from the PC show here once it's been on." : "Link to your PC to see your stats from it here."}</p></div>`;
}

$("link-form").addEventListener("submit", (e) => {
  e.preventDefault();
  link.join($("code").value);
});
$("sync").addEventListener("click", () => link.sync());
$("unlink").addEventListener("click", () => link.unlink());
$("back").addEventListener("click", (e) => {
  if (history.length > 1) {
    e.preventDefault();
    history.back();
  }
});

// A QR code's link (a2golf://link/CODE, the app at My stats): the code in.
const wanted = readLinkCode(new URLSearchParams(location.search).get("code"));
if (wanted && !link.linked) $("code").value = showLinkCode(wanted);
show();
if (link.linked) link.sync();
