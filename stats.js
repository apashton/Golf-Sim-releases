// The stats page: one player's clubs, short game, games and tips. The
// server does the adding up (server/stats.mjs), so it stays quick with
// thousands of shots; this only lays it out.

import { clubName } from "./bay.js";
import { clubColor } from "./clubcolors.js";
import { readProfiles, profileNames, handOf, isGuest } from "./sim/profiles.mjs";
// The saved players (sim/profiles.mjs), as the game keeps them.
const savedProfiles = () => readProfiles(loadSetting("profiles", null), loadSetting("course", {}).players);
import { SWING_NAMES, STRIKE_NAMES, SPECIAL_NAMES, bigGap } from "./sim/shotstats.mjs";
import { GAMES } from "./sim/challenges.mjs";
import { loadSetting, saveSetting, esc } from "./util.js";
import { BASELINES } from "./sim/strokesgained.mjs";
import { StatsFilter, DaysList, SessionsList, RoundsList, StartAgain, FortnightView, renderView, renderTrends, renderPlans } from "./statsview.js";
import { suggestDrills } from "./sim/practiceplan.mjs";
import { TAG_GROUPS, tagGroup } from "./sim/shotnotes.mjs";
import { powerName } from "./sim/power.mjs";
import { tidyWhy } from "./sim/tidy.mjs";
import { runWords } from "./sim/wrongclub.mjs";
import { CLUB_ORDER } from "./sim/clubs.mjs";
import { ShotVideo } from "./shotvideo.js";
import { LinkPanel } from "./statslink.js";
import { GoogleCard } from "./statsgoogle.js";

const $ = (id) => document.getElementById(id);
const n0 = (v) => (Number.isFinite(v) ? String(Math.round(v)) : "-");
const n1 = (v) => (Number.isFinite(v) ? v.toFixed(1) : "-");
const day = (t) => (t ? new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "-");
const when = (t) => (t ? new Date(t).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "-");
const side = (v) => (!Number.isFinite(v) ? "-" : Math.abs(v) < 0.5 ? "0" : `${Math.round(Math.abs(v))} ${v > 0 ? "R" : "L"}`);
const dot = (club) => `<i class="club-dot" style="background:${clubColor(club)}"></i>`;

const GAME_NAMES = {
  range: "Driving range",
  putting: "Putting practice",
  chipping: "Chipping practice",
  course: "Course round",
  "putting-challenge": "Putting challenge",
  "chipping-challenge": "Chipping challenge",
  "practice-plan": "Practice plan",
  // The Challenges mode's games, by the names on their cards.
  ...Object.fromEntries(GAMES.map((g) => [g.kind, g.name])),
};
const gameName = (kind) => GAME_NAMES[kind] ?? String(kind).replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

// A challenge's key, in words: "putt:10ft:normal:s10" -> "10 ft, normal cup, stimp 10".
function keyText(kind, key, name) {
  if (name) return name;
  if (!key) return "";
  const parts = key.split(":");
  if (parts[0] === "putt") return `${parts[1] === "lag" ? "lag putting 30 - 50 ft" : parts[1].replace("ft", " ft")}, ${parts[2]} cup, stimp ${parts[3]?.slice(1)}`;
  if (parts[0] === "chip") return `${parts[1].replace("yd", " yds")}, land ${parts[2].replace("land", "")}, ${parts[3]} cup`;
  // "challenge:driving:tight": the option played.
  if (parts[0] === "challenge" && parts[2]) return parts[2].replace(/^./, (c) => c.toUpperCase());
  return key;
}

let players = [];
let current = null;
// My stats -> Your Google account (statsgoogle.js).
let googleCard = null;
// What's counted (the days and formats), the Days list, the Rounds, and
// starting again (statsview.js).
let filter = null;
let daysList = null;
let sessionsList = null;
let roundsList = null;
let startAgain = null;
// The two-week summary, and which fortnight it's on.
const fortnight = new FortnightView({
  clubName,
  // What a best was in: a course by its name, a challenge by its own.
  bestName: (b) => (b.kind === "course" ? `${b.name ?? "Course"} (a round)` : GAMES.some((g) => g.kind === b.kind) ? `${gameName(b.kind)}${b.name ? ` (${b.name})` : ""}` : (b.name ?? `${gameName(b.kind)} ${keyText(b.kind, b.key, null)}`)),
  load: (at) =>
    fetch(`/api/stats/fortnight?name=${encodeURIComponent(current)}&at=${encodeURIComponent(at)}&${filter.query()}&sg=${encodeURIComponent(sgChoice())}`)
      .then((r) => r.json())
      .then((d) => d.fortnight ?? null),
});

// A drill started in the sim: in the window that opened this page when
// it's still there (the sim's), else the sim in a new tab.
function startPlan(id) {
  const sim = window.opener && !window.opener.closed ? window.opener : null;
  if (sim?.golfsim?.startPlan) {
    sim.golfsim.startPlan(id);
    sim.focus();
    $("plans-msg").textContent = "Started in the sim - over to the mat.";
  } else {
    window.open(`/?plan=${encodeURIComponent(id)}`, "_blank");
  }
}

const sgChoice = () => loadSetting("statsSg", { choice: "mine" }).choice ?? "mine";

async function start() {
  const params = new URLSearchParams(location.search);
  const again = () => current && show(current);
  const names = { gameName, keyText };
  filter = new StatsFilter(params, again);
  daysList = new DaysList({ player: () => current, filter, names, changed: again });
  sessionsList = new SessionsList({ player: () => current, names, changed: again });
  roundsList = new RoundsList({ names });
  // Who strokes gained is measured against: remembered.
  const sgPick = $("sg-pick");
  sgPick.value = BASELINES.includes(sgChoice()) ? sgChoice() : "mine";
  sgPick.addEventListener("change", () => {
    saveSetting("statsSg", { choice: sgPick.value });
    again();
  });
  startAgain = new StartAgain({ player: () => current, changed: again });
  const known = await loadPlayers();
  // Linked phones: everyone's again once a phone's shots are in.
  new LinkPanel({
    changed: async () => {
      await loadPlayers();
      if (current) show(current);
    },
  });
  // Stats in Google Drive: the player showing's sign-in; stats in from
  // another computer drawn again.
  googleCard = new GoogleCard({ player: () => current, changed: () => current && show(current) });
  const hitter = loadSetting("hitter", { name: null }).name;
  const pick = params.get("player") ?? (players.includes(hitter) ? hitter : (known[0]?.name ?? players[0]));
  show(pick);
}

// Everyone with shots on record, and everyone in the sim's players list.
async function loadPlayers() {
  let known = [];
  try {
    known = await fetch("/api/stats/players").then((r) => r.json());
  } catch {
    known = [];
  }
  // (The saved players; never a guest, whose shots aren't kept.)
  const local = profileNames(savedProfiles());
  players = [...new Set([...local, ...known.map((p) => p.name)])].filter((n) => !isGuest(n));
  return known;
}

function renderPlayers() {
  $("players").innerHTML = players
    .map((p) => `<button data-player="${esc(p)}" class="${p === current ? "active" : ""}">${esc(p)}</button>`)
    .join("");
  for (const b of $("players").querySelectorAll("button")) b.addEventListener("click", () => show(b.dataset.player));
}

async function show(name) {
  if (name !== current) {
    // Another player: the last tidy-up's Undo was someone else's.
    tidyUndo = null;
    $("tidy-msg").textContent = "";
    wrongUndo = null;
    $("wrong-msg").textContent = "";
    // And their own latest fortnight.
    fortnight.reset();
  }
  current = name;
  renderPlayers();
  googleCard?.show();
  history.replaceState(null, "", `?player=${encodeURIComponent(name)}&${filter.query()}`);
  let data;
  try {
    // (The replays and recordings too, so a shot with video can be watched.)
    // (A left-hander's tips the right way round: sim/insights.mjs.)
    [data] = await Promise.all([fetch(`/api/stats/player?name=${encodeURIComponent(name)}&${filter.query()}&sg=${encodeURIComponent(sgChoice())}&hand=${handOf(savedProfiles(), name)}${fortnight.query()}`).then((r) => r.json()), video.load()]);
  } catch {
    $("summary").textContent = "Couldn't reach A² Golf - is it still running?";
    return;
  }
  if (current !== name) return;
  render(data);
}

function render(d) {
  const out = d.removed ? ` ${d.removed} taken out as misreads.` : "";
  $("summary").innerHTML = d.shots
    ? `<b>${esc(d.name)}</b>: ${d.shots} shots since ${day(d.first)}, last played ${day(d.last)}. ${d.games.length} games and rounds.${out}`
    : d.view?.all
      ? `<b>${esc(d.name)}</b>: no shots counted in this view - try <i>All time</i>, or tick <i>Experimental</i>.${out}`
      : `<b>${esc(d.name)}</b> has no shots yet. Pick them in <i>Hitting</i> at the top of the sim and every shot is kept here.${out}`;
  renderView(d);
  fortnight.render(d.fortnight);
  daysList.render(d);
  sessionsList.render(d);
  roundsList.render(d);
  renderTrends(d, clubName);
  renderPlans(d, suggestDrills, startPlan);
  startAgain.render(d);
  renderNotes(d.insights);
  renderWrong(d.wrong);
  renderOdd(d.odd ?? []);
  renderTidy(d.tidy);
  renderClubs(d.clubs);
  renderRecent(d.recent ?? []);
  $("gapping").innerHTML = gappingChart(d.clubs.filter((c) => c.n >= 3), d.factor);
  renderShort(d.short);
  renderPower(d.power ?? []);
  renderSpecial(d.special ?? []);
  renderPutting(d.putting);
  renderChipping(d.chipping);
  renderGames(d);
}

function renderNotes(notes) {
  $("notes").innerHTML = notes.length
    ? notes
        .map(
          (n) => `<div class="note ${n.tone}"><span class="tag">${n.period === "long" ? "Long term" : "Recent"}</span>
            <h3>${esc(n.title)}</h3><p>${esc(n.text)}</p><p class="evidence">${esc(n.evidence)}</p><p class="practice">${esc(n.practice)}</p></div>`,
        )
        .join("")
    : `<p class="muted">Nothing to say yet - tips appear as patterns show up (about eight shots of a club, or of putts from one distance).</p>`;
}

// The "Wrong club?" review (sim/wrongclub.mjs): runs of shots from one
// sitting that flew like another club, each moved, kept or taken out in one
// go; single shots; and the shots moved by themselves, to put back.
const lc = (c) => clubName(c).toLowerCase();
const clubPick = (chosen) => `<select data-wrong-pick aria-label="Another club">${CLUB_ORDER.map((c) => `<option value="${c}" ${c === chosen ? "selected" : ""}>${esc(clubName(c))}</option>`).join("")}</select>`;
function wrongButtons(ids, club, looksLike) {
  const all = esc(ids.join(","));
  const many = ids.length > 1;
  return `<span class="wrong-acts" data-ids="${all}">
    <button class="primary" data-wrong="move" data-club="${looksLike}">${many ? "Move them" : "Move it"} to the ${esc(lc(looksLike))}</button>
    ${clubPick(looksLike)} <button data-wrong="pick">Move</button>
    <button data-wrong="sel">${many ? `They were ${esc(lc(club))}s` : `It was the ${esc(lc(club))}`}</button>
    <button data-wrong="badhit">${many ? "Bad hits" : "Bad hit"}</button>
    <button data-wrong="misread">${many ? "Misreads" : "Misread"}</button></span>`;
}
function renderWrong(w) {
  const runs = w?.runs ?? [];
  const singles = w?.singles ?? [];
  const moved = w?.moved ?? [];
  $("wrong-wrap").hidden = !runs.length && !singles.length && !moved.length && !wrongUndo;
  const mixed = (w?.mixed ?? []).length
    ? `<p class="small">${esc(listOf(w.mixed.map((c) => `your ${lc(c)}`)))} ${w.mixed.length > 1 ? "have" : "has"} other clubs' shots in ${w.mixed.length > 1 ? "their" : "its"} numbers, so ${w.mixed.length > 1 ? "they're" : "it's"} judged by a typical bag's for now - sort out the shots below and ${w.mixed.length > 1 ? "their" : "its"} own numbers come back.</p>`
    : "";
  const shotLine = (s) => `${when(s.t)}: ${n0(s.carry)} yds carry${Number.isFinite(s.vla) ? `, ${n1(s.vla)}° launch` : ""}${Number.isFinite(s.spin) ? `, ${n0(s.spin)} rpm` : ""}`;
  const runHtml = runs
    .map(
      (r) => `<div class="ladder-card wrong-run"><p><b>${esc(runWords(r, clubName, day))}</b>${r.sure === r.n ? "" : ` <span class="muted small">(${r.sure} of them clearly)</span>`}</p>
        <p class="small">${wrongButtons(r.shots.map((s) => s.id), r.club, r.looksLike)}</p>
        <details><summary class="small">The ${r.n} shots</summary><ul class="small">${r.shots.map((s) => `<li>${esc(shotLine(s))}</li>`).join("")}</ul></details></div>`,
    )
    .join("");
  const singleHtml = singles.length
    ? `<h3 class="small">Single shots</h3>${singles
        .map((s) => `<div class="check-row"><span>${esc(shotLine(s))}: <b>${esc(clubName(s.club))}</b> selected - it flew like your ${esc(lc(s.looksLike))}.</span> ${wrongButtons([s.id], s.club, s.looksLike)}</div>`)
        .join("")}${w.moreSingles ? `<p class="muted small">And ${w.moreSingles} more - sort these out and look again.</p>` : ""}`
    : "";
  const movedHtml = moved.length
    ? `<details class="wrong-moved"><summary>Moved by themselves (${moved.length}${w.moreMoved ? "+" : ""}) <span class="muted small">so clearly another club that they were put right as they were hit</span></summary>${moved
        .map((s) => `<div class="check-row"><span>${esc(shotLine(s))}: counted as your <b>${esc(lc(s.club))}</b>${s.sel ? ` (${esc(lc(s.sel))} selected)` : ""}.</span>${s.sel ? ` <span class="wrong-acts" data-ids="${esc(s.id)}"><button data-wrong="sel">It was the ${esc(lc(s.sel))}</button></span>` : ""}</div>`)
        .join("")}</details>`
    : "";
  $("wrong").innerHTML = mixed + runHtml + singleHtml + movedHtml;
}
const listOf = (list) => (list.length < 2 ? list.join("") : `${list.slice(0, -1).join(", ")} and ${list.at(-1)}`);
// The last change, for its Undo: { ids, kind: "club" | "mark" }.
let wrongUndo = null;
async function wrongDo(ids, what, club = null, { undoing = false } = {}) {
  const post = (url, body) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ player: current, ids, ...body }) }).then(async (r) => {
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? r.statusText);
  });
  try {
    if (what === "badhit" || what === "misread") await post("/api/stats/marks", { say: what });
    else if (what === "unmark") await post("/api/stats/marks", { say: "auto" });
    else if (what === "unclub") await post("/api/stats/answers", { undo: true });
    else await post("/api/stats/answers", { club: what === "sel" ? "sel" : club });
  } catch (err) {
    $("wrong-msg").textContent = `Couldn't change ${ids.length > 1 ? "them" : "it"}: ${err.message}`;
    return;
  }
  const n = ids.length === 1 ? "1 shot" : `${ids.length} shots`;
  wrongUndo = undoing ? null : { ids, kind: what === "badhit" || what === "misread" ? "mark" : "club" };
  const said = { move: `moved to the ${lc(club ?? "")}`, pick: `moved to the ${lc(club ?? "")}`, sel: "kept as the club that was selected", badhit: "marked bad hits - in your stats, out of the club's carry", misread: "taken out as misreads", unmark: "put back", unclub: "put back - waiting to be answered" };
  $("wrong-msg").innerHTML = `${esc(n)} ${esc(said[what] ?? "changed")}.${undoing ? "" : " <button data-wrong-undo>Undo</button>"}`;
  show(current);
}
$("wrong").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-wrong]");
  if (!b) return;
  const acts = b.closest(".wrong-acts");
  const ids = (acts?.dataset.ids ?? "").split(",").filter(Boolean);
  if (!ids.length) return;
  const what = b.dataset.wrong;
  const club = what === "pick" ? acts.querySelector("[data-wrong-pick]")?.value : b.dataset.club;
  wrongDo(ids, what, club);
});
$("wrong-msg").addEventListener("click", (e) => {
  if (!e.target.closest("button[data-wrong-undo]") || !wrongUndo) return;
  const { ids, kind } = wrongUndo;
  wrongDo(ids, kind === "mark" ? "unmark" : "unclub", null, { undoing: true });
});

// What the player says about a shot ("misread", "thin", "good", "auto" to
// put it back as it was worked out...), then the page again.
async function mark(id, say) {
  try {
    await fetch("/api/stats/mark", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ player: current, id, say }) });
  } catch {
    // Shown again as it was.
  }
  show(current);
}

function renderOdd(list) {
  $("odd-wrap").hidden = !list.length;
  $("odd").innerHTML = list
    .map(
      (s) => `<div class="check-row"><span>${when(s.t)}: <b>${esc(clubName(s.club))}</b>, ${n0(s.carry)} yds carry - ${esc(oddWords(s))}.</span>
        <button data-id="${s.id}" data-say="misread">Misread - take it out</button>
        <button data-id="${s.id}" data-say="keep">It was real - keep it</button></div>`,
    )
    .join("");
  for (const b of $("odd").querySelectorAll("button")) b.addEventListener("click", () => mark(b.dataset.id, b.dataset.say));
}
// The suggested tidy-up: each club's shots far from the rest, ticked, to
// take out as misreads together (and put back together, with Undo).
function renderTidy(tidy) {
  const clubs = tidy?.clubs ?? [];
  $("tidy-wrap").hidden = !clubs.length && !tidyUndo;
  $("tidy-go").hidden = !clubs.length;
  $("tidy").innerHTML =
    clubs
      .map(
        (c) => `<h3 class="sub">${dot(c.club)}${esc(clubName(c.club))} <small class="muted">${c.shots.length} of ${c.n}</small></h3>
        ${c.shots
          .map(
            (s) => `<label class="check check-row"><input type="checkbox" data-tidy="${esc(s.id)}" checked>
              <span>${when(s.t)}: ${n0(s.carry)} yds carry${s.speed != null ? `, ${n1(s.speed)} mph` : ""} - ${esc(s.why.map(tidyWhy).join("; "))}</span></label>`,
          )
          .join("")}`,
      )
      .join("") + (tidy?.more ? `<p class="muted small">And ${tidy.more} more, not so far out - take these out first and look again.</p>` : "");
}
let tidyUndo = null;
async function tidy(ids, say, { undoing = false } = {}) {
  if (!ids.length) return;
  try {
    const r = await fetch("/api/stats/marks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ player: current, ids, say }) });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? r.statusText);
  } catch (err) {
    $("tidy-msg").textContent = `Couldn't change them: ${err.message}`;
    return;
  }
  tidyUndo = undoing ? null : ids;
  const n = `${ids.length} shot${ids.length === 1 ? "" : "s"}`;
  $("tidy-msg").innerHTML = say === "misread" ? `${n} taken out. <button data-undo>Undo</button>` : `${n} put back.`;
  show(current);
}
$("tidy-go").addEventListener("click", () => tidy([...$("tidy").querySelectorAll("input[data-tidy]:checked")].map((b) => b.dataset.tidy), "misread"));
$("tidy-msg").addEventListener("click", (e) => {
  if (e.target.closest("button[data-undo]") && tidyUndo) tidy(tidyUndo, "auto", { undoing: true });
});

const ODD_WORDS = { spin: "a spin reading no real strike gives", smash: "more ball speed than the club speed could give, or far less", launch: "a launch angle no real strike gives", speed: "a ball speed no real strike gives" };
const oddWords = (s) => ODD_WORDS[s.odd] ?? "an odd reading";

// A club's thin, fat, topped and shanked shots, as a share of its full
// swings: the commonest first, "-" when all were good.
function strikeText(st) {
  if (!st?.n) return `<span class="muted">-</span>`;
  const parts = ["thin", "fat", "topped", "shank", "badhit"].filter((q) => st[q] > 0).sort((a, b) => st[b] - st[a]);
  const tip = `${st.n} full swings: ${parts.length ? parts.map((q) => `${st[q]} ${STRIKE_NAMES[q].toLowerCase()}`).join(", ") : "all struck well"}`;
  if (!parts.length) return `<span class="muted" title="${esc(tip)}">none</span>`;
  const words = parts.map((q) => `${STRIKE_NAMES[q]} ${st.pct[q]}%`).join(" · ");
  return `<span class="${st.pct.bad >= 20 ? "worse" : ""}" title="${esc(tip)}">${words}</span>`;
}

// Each club's latest shots: a row each, with how it was struck and what
// can be said about it.
function renderRecent(groups) {
  listedShots.clear();
  for (const g of groups) for (const s of g.shots) listedShots.set(s.id, s);
  for (const id of [...comparing]) if (!listedShots.has(id)) comparing.delete(id);
  $("recent").innerHTML = groups.length
    ? groups.map(recentGroup).join("")
    : `<p class="muted">No shots yet.</p>`;
  for (const b of $("recent").querySelectorAll("button[data-watch]")) b.addEventListener("click", () => video.open([watchable(b.dataset.watch)]));
  for (const c of $("recent").querySelectorAll("input[data-compare]")) {
    c.addEventListener("change", () => {
      if (c.checked) comparing.add(c.dataset.compare);
      else comparing.delete(c.dataset.compare);
      // Two at a time: the oldest pick goes.
      while (comparing.size > 2) comparing.delete(comparing.values().next().value);
      for (const o of $("recent").querySelectorAll("input[data-compare]")) o.checked = comparing.has(o.dataset.compare);
      compareBar();
    });
  }
  compareBar();
  for (const sel of $("recent").querySelectorAll("select[data-id]")) sel.addEventListener("change", () => mark(sel.dataset.id, sel.value));
  for (const b of $("recent").querySelectorAll("button[data-id]")) b.addEventListener("click", () => mark(b.dataset.id, b.dataset.say));
  for (const d of $("recent").querySelectorAll("details")) d.addEventListener("toggle", () => (d.open ? openClubs.add(d.dataset.club) : openClubs.delete(d.dataset.club)));
}
// Which clubs' lists are open, kept as the page redraws after a change.
const openClubs = new Set();

// Watching a shot's swing (shotvideo.js): the shots listed, and the two
// ticked to watch side by side.
const video = new ShotVideo();
const listedShots = new Map();
const comparing = new Set();
const watchable = (id) => {
  const s = listedShots.get(id);
  return { id, hit: s?.hit ?? null, label: s ? `${clubName(s.club)}, ${when(s.t)} - ${n0(s.carry)} yds${s.kind && s.kind !== "good" ? `, ${kindName(s.kind).toLowerCase()}` : ""}` : "" };
};
function compareBar() {
  const n = comparing.size;
  $("compare-bar").hidden = n === 0;
  $("compare-go").disabled = n < 2;
  $("compare-msg").textContent = n < 2 ? "Tick one more shot to watch them side by side." : "Two shots ticked.";
}
$("compare-go").addEventListener("click", () => video.open([...comparing].map(watchable)));
$("compare-clear").addEventListener("click", () => {
  comparing.clear();
  for (const o of $("recent").querySelectorAll("input[data-compare]")) o.checked = false;
  compareBar();
});

// What a full swing, part swing or special shot can be said to be.
const KINDS = ["good", "badhit", "thin", "fat", "topped", "shank", "punch", "part", "other"];
const kindName = (q) => STRIKE_NAMES[q] ?? SPECIAL_NAMES[q] ?? q;

function recentGroup(g) {
  const out = g.shots.filter((s) => s.removed).length;
  const bad = g.shots.filter((s) => !s.removed && s.strike && s.strike !== "good" && !s.asking).length;
  const special = g.shots.filter((s) => !s.removed && s.sw === "special").length;
  const asked = g.shots.filter((s) => !s.removed && s.asking).length;
  const noted = g.shots.filter((s) => s.notes?.length).length;
  const note = [
    bad ? `${bad} mishit${bad === 1 ? "" : "s"}` : "",
    special ? `${special} special` : "",
    asked ? `${asked} not answered` : "",
    out ? `${out} taken out` : "",
    noted ? `${noted} with notes` : "",
  ]
    .filter(Boolean)
    .join(", ");
  const rows = g.shots
    .map((s) => {
      // Not answered yet: a blank choice first, so any pick is an answer.
      const tip = s.asking
        ? "Well short of this club's usual - what was it? Out of the club's numbers until you say"
        : s.my && s.my !== "keep"
          ? `You said ${esc(kindName(s.my))}; worked out as ${esc(kindName(s.auto ?? "good"))}`
          : "Worked out from the numbers - change it if it's wrong";
      const strike =
        s.kind && !s.removed
          ? `<select data-id="${s.id}" title="${tip}">${s.asking ? `<option value="" selected disabled>Not answered</option>` : ""}${KINDS.map(
              (q) => `<option value="${q}" ${!s.asking && q === s.kind ? "selected" : ""}>${kindName(q)}</option>`,
            ).join("")}</select>`
          : s.removed
            ? `<span class="muted">Misread</span>`
            : `<span class="muted">${esc(SWING_NAMES[s.sw] ?? s.sw)}</span>`;
      const action = s.removed
        ? `<button data-id="${s.id}" data-say="auto">Put back</button>`
        : `<button data-id="${s.id}" data-say="misread" title="The launch monitor got it wrong: count it nowhere">Take out</button>`;
      // Its swing on video, when a replay or a session recording has it.
      const watch = video.for(s).length
        ? ` <button data-watch="${s.id}" class="watch" title="Watch the swing">▶</button><label class="compare" title="Tick two to watch side by side"><input type="checkbox" data-compare="${s.id}" ${comparing.has(s.id) ? "checked" : ""} /></label>`
        : "";
      // Said at a power ("power next fifty"): a part swing, chip or pitch
      // kept with it.
      const power = s.pw != null ? ` <span class="power-badge" title="Said to be a ${esc(powerName(s.pw))} swing">${esc(powerName(s.pw))}</span>` : "";
      const row = `<tr class="${s.removed ? "removed" : ""}${(s.odd && !s.my) || s.asking ? " doubtful" : ""}${s.sw === "special" ? " special" : ""}${s.notes?.length ? " noted" : ""}"><td>${when(s.t)}</td><td>${n0(s.carry)}</td><td>${n1(s.speed)}</td>
        <td>${Number.isFinite(s.launch) ? `${n1(s.launch)}°` : "-"}</td><td>${n0(s.spin)}</td><td>${strike}${power}</td><td>${action}${watch}</td></tr>`;
      // A note said about it, under it: its tags as chips, then its words.
      return s.notes?.length ? `${row}<tr class="shot-note"><td></td><td colspan="6">${tagChips(s.tags ?? [])}${s.notes.map((t) => `<q>${esc(t)}</q>`).join(" ")}</td></tr>` : row;
    })
    .join("");
  return `<details data-club="${g.club}" ${openClubs.has(g.club) ? "open" : ""}><summary>${dot(g.club)}<b>${esc(clubName(g.club))}</b> <span class="muted small">last ${g.shots.length}${note ? ` - ${note}` : ""}</span></summary>
    <div class="table-wrap"><table class="stats-table recent-shots"><tr><th>When</th><th>Carry</th><th>Ball speed</th><th>Launch</th><th>Spin</th><th>Strike</th><th></th></tr>${rows}</table></div></details>`;
}

// A note's tags as small chips, coloured by what they're about (the
// strike, the start and shape, the kind of shot, the feel).
function tagChips(tags) {
  return tags.map((t) => `<span class="tag-chip ${tagGroup(t)}" title="${esc(TAG_GROUPS[tagGroup(t)])}">${esc(t)}</span>`).join("");
}

// An arrow for recent against usual. For carry, further is neither good
// nor bad, just different; for the left-right spread, narrower is better.
function arrow(delta, { goodIfLess = false, unit = "" } = {}) {
  if (!Number.isFinite(delta) || Math.abs(delta) < 2) return `<span class="same" title="About the same as usual">=</span>`;
  const up = delta > 0;
  const cls = goodIfLess ? (up ? "worse" : "better") : "same";
  return `<span class="${cls}" title="Last 20 shots against the ones before">${up ? "▲" : "▼"}${Math.abs(Math.round(delta))}${unit}</span>`;
}

function renderClubs(clubs) {
  $("clubs").innerHTML =
    `<tr><th>Club</th><th>Shots</th><th title="Share of the club's full swings (not misreads) struck thin, fat, topped or shanked">Thin / fat</th><th>Carry</th><th>Total</th><th>Typical carry</th><th>Left / right</th><th>Ball speed <small>mph</small></th><th>Launch</th><th>Spin <small>rpm</small></th><th>Recent carry</th><th>Recent spread</th></tr>` +
    (clubs
      .map(
        (c) => `<tr><td>${dot(c.club)}${esc(clubName(c.club))}${c.unchecked ? ` <span class="muted small" title="Waiting for a club check, or for what a very short shot was (Latest shots)">(+${c.unchecked} to check)</span>` : ""}</td>
          <td>${c.n}</td><td>${strikeText(c.strikes)}</td><td>${n0(c.carry)}</td><td>${n0(c.total)}</td>
          <td>${c.n >= 3 ? `${n0(c.low)} - ${n0(c.high)}` : "-"}</td>
          <td>${c.n >= 3 ? `${side(c.left)} to ${side(c.right)}` : side(c.side)}</td>
          <td>${n1(c.speed)}</td><td>${Number.isFinite(c.launch) ? `${n1(c.launch)}°` : "-"}</td><td>${n0(c.spin)}</td>
          <td>${c.trend ? `${n0(c.trend.recent.carryMedian)} ${arrow(c.trend.carry, { unit: " yds" })}` : `<span class="muted">-</span>`}</td>
          <td>${c.trend ? `${n0(c.trend.recent.width)} ${arrow(c.trend.width, { goodIfLess: true })}` : `<span class="muted">-</span>`}</td></tr>`,
      )
      .join("") || `<tr><td colspan="12" class="muted">No full swings yet</td></tr>`);
}

// Carry bars per club, longest at the top: each bar the middle 80% of its
// carries, a dot at the typical one. Where one club's bar runs into the
// next it's shaded as an overlap; a big step between two is labelled.
export function gappingChart(clubs, factor = 1) {
  if (!clubs.length) return `<p class="muted">Hit at least three full shots with a club to see it here.</p>`;
  const W = 720;
  const row = 30;
  const left = 140;
  const right = 70;
  const top = 10;
  const H = top + clubs.length * row + 28;
  const maxYd = Math.ceil((Math.max(...clubs.map((c) => c.high ?? c.carry)) + 10) / 25) * 25;
  const X = (yd) => left + (yd / maxYd) * (W - left - right);
  const parts = [];
  // Recessive grid every 25 or 50 yards.
  const step = maxYd > 200 ? 50 : 25;
  parts.push(`<g class="grid">`);
  for (let yd = 0; yd <= maxYd; yd += step) parts.push(`<line x1="${X(yd)}" x2="${X(yd)}" y1="${top}" y2="${H - 24}"/>`);
  parts.push(`</g><g class="axis">`);
  for (let yd = 0; yd <= maxYd; yd += step) parts.push(`<text x="${X(yd)}" y="${H - 8}" text-anchor="middle">${yd}</text>`);
  parts.push(`</g>`);
  clubs.forEach((c, i) => {
    const y = top + i * row + row / 2;
    const next = clubs[i + 1];
    if (next && Number.isFinite(next.high) && next.high > c.low) {
      // The overlap spans both rows.
      const x0 = X(Math.max(next.low, c.low));
      const x1 = X(Math.min(next.high, c.high));
      if (x1 > x0) {
        parts.push(`<rect class="overlap" x="${x0}" y="${y - 6}" width="${x1 - x0}" height="${row + 12}" rx="3"><title>${esc(clubName(c.club))} and ${esc(clubName(next.club).toLowerCase())} overlap</title></rect>`);
      }
    } else if (next && bigGap(c.club, next.club, c.carryMedian - next.carryMedian, factor)) {
      parts.push(`<text class="gap-label" x="${W - right + 6}" y="${y + row / 2 + 4}">gap ${Math.round(c.carryMedian - next.carryMedian)}</text>`);
    }
  });
  clubs.forEach((c, i) => {
    const y = top + i * row + row / 2;
    const colour = clubColor(c.club);
    const tip = `${clubName(c.club)}: typically ${n0(c.carryMedian)} yds carry, middle 80% ${n0(c.low)} - ${n0(c.high)} yds (${c.n} shots)`;
    parts.push(`<g><title>${esc(tip)}</title>`);
    parts.push(`<rect class="bar-hit" x="0" y="${y - row / 2}" width="${W}" height="${row}"/>`);
    parts.push(`<text x="${left - 10}" y="${y + 4}" text-anchor="end">${esc(clubName(c.club))}</text>`);
    parts.push(`<rect x="${X(c.low)}" y="${y - 5}" width="${Math.max(4, X(c.high) - X(c.low))}" height="10" rx="4" fill="${colour}" opacity="0.55"/>`);
    parts.push(`<circle cx="${X(c.carryMedian)}" cy="${y}" r="6" fill="${colour}" stroke="#16241a" stroke-width="2"/>`);
    parts.push(`<text x="${W - right + 6}" y="${y + 4}">${n0(c.carryMedian)}</text>`);
    parts.push(`</g>`);
  });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Carry by club">${parts.join("")}</svg>`;
}

function renderShort(list) {
  $("short").innerHTML =
    `<tr><th>Club</th><th>Swing</th><th>Shots</th><th>Typical carry</th><th>Range</th></tr>` +
    (list
      .map(
        (s) => `<tr><td>${dot(s.club)}${esc(clubName(s.club))}</td><td>${esc(SWING_NAMES[s.swing])}</td><td>${s.n}</td>
          <td>${n0(s.carry)} yds</td><td>${s.n >= 3 ? `${n0(s.low)} - ${n0(s.high)}` : "-"}</td></tr>`,
      )
      .join("") || `<tr><td colspan="5" class="muted">None yet - chip on the chipping green, or hit part swings on the range</td></tr>`);
}

// Part swings, chips and pitches said at a power ("mod swings"), by club
// and power: "Sand wedge at 50%: 22 yds". Kept apart from the club's full
// swings, as every part swing is.
function renderPower(list) {
  $("power-wrap").hidden = !list.length;
  $("power").innerHTML =
    `<tr><th>Club and power</th><th>Shots</th><th>Typical carry</th><th>Range</th></tr>` +
    list
      .map(
        (p) => `<tr><td>${dot(p.club)}${esc(clubName(p.club))} at ${esc(powerName(p.pw))}</td>
          <td title="${p.chips ? `${p.chips} of them chips or pitches` : "Part swings"}">${p.n}</td><td><b>${n0(p.carry)} yds</b></td><td>${p.n >= 3 ? `${n0(p.low)} - ${n0(p.high)}` : "-"}</td></tr>`,
      )
      .join("");
}

// Punches and other special shots, by club: how many of each, and how far
// they carried - so none of them silently vanishes from the stats.
function renderSpecial(list) {
  $("special-wrap").hidden = !list.length;
  $("special").innerHTML =
    `<tr><th>Club</th><th>Shots</th><th>${esc(SPECIAL_NAMES.punch)}</th><th>${esc(SPECIAL_NAMES.other)}</th><th>Typical carry</th></tr>` +
    list
      .map((s) => `<tr><td>${dot(s.club)}${esc(clubName(s.club))}</td><td>${s.n}</td><td>${s.punch || "-"}</td><td>${s.other || "-"}</td><td>${n0(s.carry)} yds</td></tr>`)
      .join("");
}

function pace(b) {
  if (b.shortPct == null) return "-";
  if (b.shortPct >= 65) return `<span class="worse">Mostly short</span>`;
  if (b.shortPct <= 35 && b.pastFt > 2.5) return `<span class="worse">Mostly long</span>`;
  return `<span class="better">Good pace</span>`;
}

function renderPutting(bands) {
  $("putting").innerHTML =
    `<tr><th>Distance</th><th>Made</th><th>%</th><th>Pace</th><th>Short misses</th><th>Avg miss</th></tr>` +
    (bands
      .map(
        (b) => `<tr><td>${b.label}</td><td>${b.made}/${b.n}</td><td>${b.makePct}%</td><td>${pace(b)}</td>
          <td>${b.shortPct == null ? "-" : `${b.shortPct}%`}</td><td>${b.leaveFt == null ? "-" : `${n1(b.leaveFt)} ft`}</td></tr>`,
      )
      .join("") || `<tr><td colspan="6" class="muted">No putts yet</td></tr>`);
}

function renderChipping(bands) {
  $("chipping").innerHTML =
    `<tr><th>To the hole</th><th>Shots</th><th>Finish, on average</th><th>Holed</th></tr>` +
    (bands
      .map((b) => `<tr><td>${b.label}</td><td>${b.n}</td><td>${n1(b.leaveFt)} ft${b.recentLeaveFt != null ? ` <span class="muted small">(last 20: ${n1(b.recentLeaveFt)})</span>` : ""}</td><td>${b.holed}</td></tr>`)
      .join("") || `<tr><td colspan="4" class="muted">No chips yet</td></tr>`);
}

function scoreText(g) {
  if (g.kind === "course") {
    const par = Number.isFinite(g.toPar) ? ` (${g.toPar === 0 ? "E" : g.toPar > 0 ? `+${g.toPar}` : g.toPar})` : "";
    return `${g.total ?? g.score ?? "-"}${par}${g.complete === false ? ` <span class="muted small">${g.holes} holes</span>` : ""}`;
  }
  return esc(g.score ?? "-");
}

function renderGames(d) {
  $("bests").innerHTML =
    `<tr><th>Game</th><th></th><th>Best</th><th>Date</th></tr>` +
    (d.bests
      .map((b) => `<tr><td>${esc(gameName(b.kind))}</td><td>${esc(keyText(b.kind, b.key, b.name))}</td><td><b>${esc(b.score)}</b></td><td>${day(b.t)}</td></tr>`)
      .join("") || `<tr><td colspan="4" class="muted">Finish a challenge or a round to set one</td></tr>`);
  $("games").innerHTML =
    `<tr><th>Date</th><th>Game</th><th></th><th>Score</th></tr>` +
    (d.games
      .map((g) => `<tr><td>${day(g.t)}</td><td>${esc(gameName(g.kind))}</td><td>${esc(keyText(g.kind, g.key, g.name))}</td><td>${scoreText(g)}</td></tr>`)
      .join("") || `<tr><td colspan="4" class="muted">None yet</td></tr>`);
}

start();
