// My stats' parts for what's counted and what's kept: the filter (which days,
// which recording formats), the Days list (look at chosen days, leave a day
// out, make it experimental - each taken back as easily), the Rounds, and
// starting a player's stats again with the archive to bring them back from.
// stats.js fetches the player's report with the filter and lays out the
// numbers; these draw the rest from the same report.

import { esc, loadSetting, saveSetting } from "./util.js";
import { viewFilter, FORMAT_WORDS } from "./sim/statdays.mjs";
import { roundCard } from "./sim/roundcard.mjs";
import { MISS_KINDS } from "./sim/roundstats.mjs";
import { RoundCardView } from "./roundcard.js";

const $ = (id) => document.getElementById(id);
const post = (url, body) =>
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(async (r) => {
    const out = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(out.error ?? r.statusText);
    return out;
  });

// "2026-09-28" as the page says it: "Mon 28 Sep 2026", and today or
// yesterday said so.
export function dayName(day, today = null) {
  const [y, m, d] = day.split("-").map(Number);
  const words = new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  if (today && day === today) return `Today - ${words}`;
  if (today) {
    const [ty, tm, td] = today.split("-").map(Number);
    const yday = new Date(ty, tm - 1, td - 1);
    if (yday.getFullYear() === y && yday.getMonth() === m - 1 && yday.getDate() === d) return `Yesterday - ${words}`;
  }
  return words;
}
const shortDay = (day) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
};
const PERIOD_WORDS = { today: "Today", 7: "The last 7 days", 30: "The last 30 days", "3m": "The last 3 months", "6m": "The last 6 months", "12m": "The last 12 months", all: "All time", days: "Chosen days" };
const MODE_WORDS = { range: "Driving range", putting: "Putting", chipping: "Chipping", course: "Course", challenges: "Challenges", calibration: "Calibration" };
const signed = (v) => (!Number.isFinite(v) ? "-" : v === 0 ? "E" : v > 0 ? `+${v}` : `${v}`);

// ---- The filter ---------------------------------------------------------------------

// What the page counts: from its address, else as last left here, else
// every day, practice and round play. onChange() is called after each
// change (stats.js fetches the report again).
export class StatsFilter {
  constructor(params, onChange) {
    const fromAddress = params.has("period") || params.has("formats") || params.has("days");
    this.f = viewFilter(fromAddress ? { period: params.get("period"), days: params.get("days"), formats: params.get("formats") } : loadSetting("statsView", {}));
    this.onChange = onChange;
    $("period").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-period]");
      if (b) this.set({ period: b.dataset.period });
    });
    for (const box of document.querySelectorAll("input[data-format]")) {
      box.addEventListener("change", () => {
        const formats = [...document.querySelectorAll("input[data-format]:checked")].map((x) => x.dataset.format);
        // Never nothing at all: the last one stays ticked.
        if (!formats.length) {
          box.checked = true;
          return;
        }
        this.set({ formats });
      });
    }
    this.render();
  }

  get filter() {
    return this.f;
  }

  // The report's address for it.
  query() {
    const q = new URLSearchParams({ period: this.f.period, formats: this.f.formats.join(",") });
    if (this.f.period === "days") q.set("days", this.f.days.join(","));
    return q.toString();
  }

  set(patch) {
    this.f = viewFilter({ ...this.f, ...patch });
    saveSetting("statsView", this.f);
    this.render();
    this.onChange();
  }

  // A day ticked or unticked in the Days list: looking at the chosen days -
  // starting afresh when another period was showing (the days chosen before
  // are only kept for the Chosen days button).
  pick(day, on) {
    const days = new Set(this.f.period === "days" ? this.f.days : []);
    if (on) days.add(day);
    else days.delete(day);
    this.set({ period: "days", days: [...days].sort().reverse() });
  }

  render() {
    for (const b of $("period").querySelectorAll("button")) {
      const on = b.dataset.period === this.f.period;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", String(on));
      if (b.dataset.period === "days") b.textContent = `Chosen days${this.f.days.length ? ` (${this.f.days.length})` : ""}`;
    }
    for (const box of document.querySelectorAll("input[data-format]")) box.checked = this.f.formats.includes(box.dataset.format);
  }
}

// The line under the filter: what's being counted, and what's not.
export function renderView(d) {
  const v = d.view;
  if (!v) return;
  const formats = v.formats.map((f) => FORMAT_WORDS[f].toLowerCase());
  const period = v.period === "days" ? (v.days.length ? v.days.map(shortDay).join(", ") : "no days chosen yet - tick them in Days, below") : PERIOD_WORDS[v.period].toLowerCase();
  const out = (d.days ?? []).filter((x) => x.out);
  const x = (d.days ?? []).reduce((a, day) => a + (day.out ? 0 : day.x), 0);
  const parts = [`Counting ${formats.join(", ").replace(/, ([^,]*)$/, " and $1")} shots: ${period}.`];
  if (out.length) parts.push(`${out.length} day${out.length === 1 ? "" : "s"} left out (${out.reduce((a, day) => a + day.shots, 0)} shots).`);
  if (x && !v.formats.includes("x")) parts.push(`${x} experimental shot${x === 1 ? "" : "s"} not counted - tick Experimental to look at them.`);
  $("view-note").textContent = parts.join(" ");
}

// ---- Days -----------------------------------------------------------------------------

// Each day with shots: tick to look at just those days; leave one out or
// put it back; make it experimental or not. Each change says what it did,
// with Undo.
export class DaysList {
  // player(): whose. filter: the StatsFilter. names: { gameName, keyText }
  // from stats.js. changed(): the report is fetched again.
  constructor({ player, filter, names, changed }) {
    this.player = player;
    this.filter = filter;
    this.names = names;
    this.changed = changed;
    $("days").addEventListener("change", (e) => {
      const box = e.target.closest("input[data-pick]");
      if (box) this.filter.pick(box.dataset.pick, box.checked);
    });
    $("days").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-day]");
      if (b) this.mark(b.dataset.day, b.dataset.out != null ? { out: b.dataset.out === "1" } : { x: b.dataset.x === "1" });
    });
    $("days-msg").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-undo]");
      if (b && this.undo) this.mark(this.undo.day, this.undo.change, { undoing: true });
    });
  }

  async mark(day, change, { undoing = false } = {}) {
    const name = this.player();
    try {
      await post("/api/stats/day", { player: name, day, ...change });
    } catch (err) {
      $("days-msg").textContent = `Couldn't change ${shortDay(day)}: ${err.message}`;
      return;
    }
    const what =
      "out" in change
        ? change.out
          ? "left out of every number"
          : "put back - it counts again"
        : change.x
          ? "made experimental - left out unless Experimental is ticked"
          : "not experimental any more - it counts again";
    // Undo is the opposite change; undoing says so, without another Undo.
    this.undo = undoing ? null : { day, change: "out" in change ? { out: !change.out } : { x: !change.x } };
    $("days-msg").innerHTML = `${esc(shortDay(day))} ${esc(what)}.${this.undo ? ` <button data-undo>Undo</button>` : ""}`;
    this.changed();
  }

  render(d) {
    const days = d.days ?? [];
    const today = d.view?.today ?? null;
    const chosen = new Set(this.filter.filter.period === "days" ? this.filter.filter.days : []);
    const { gameName, keyText } = this.names;
    const game = (g) => {
      const what = g.kind === "course" ? `${gameName(g.kind)}: ${g.name ?? g.key}` : `${gameName(g.kind)}${keyText(g.kind, g.key, g.name) ? ` (${keyText(g.kind, g.key, g.name)})` : ""}`;
      const score = g.kind === "course" ? (g.score != null ? ` ${g.score}${g.toPar != null ? ` (${signed(g.toPar)})` : ""}` : "") : g.score != null ? ` ${g.score}` : "";
      return `${what}${score}${g.rec === "x" ? " - experimental" : ""}`;
    };
    const formats = (x) =>
      ["p", "r", "x"]
        .filter((f) => x[f])
        .map((f) => `<span class="fmt-${f}">${FORMAT_WORDS[f]} ${x[f]}</span>`)
        .join(" · ");
    $("days").innerHTML =
      `<tr><th>Day</th><th>Shots</th><th>Played</th><th>Recorded as</th><th></th></tr>` +
      (days
        .map((x) => {
          const played = [x.modes.map((m) => MODE_WORDS[m] ?? m).join(", "), ...x.games.map(game)].filter(Boolean);
          const tags = [x.out ? `<span class="tag out">Left out</span>` : "", x.xday ? `<span class="tag xday">Experimental day</span>` : ""].join("");
          return `<tr class="${x.out ? "out" : ""}${x.xday ? " xday" : ""}${chosen.has(x.day) ? " chosen" : ""}">
            <td><label class="check" title="${x.out ? "Left out - put it back to look at it" : "Look at just the days ticked"}"><input type="checkbox" data-pick="${x.day}" ${chosen.has(x.day) ? "checked" : ""} ${x.out ? "disabled" : ""}> ${esc(dayName(x.day, today))}</label>${tags}</td>
            <td>${x.shots}</td>
            <td class="played">${played.map((p) => `<div>${esc(p)}</div>`).join("")}</td>
            <td class="fmts">${formats(x)}</td>
            <td class="actions">${x.out ? `<button data-day="${x.day}" data-out="0">Put back</button>` : `<button data-day="${x.day}" data-out="1" title="Count nothing from this day">Leave out</button>`}
              ${x.xday ? `<button data-day="${x.day}" data-x="0">Not experimental</button>` : `<button data-day="${x.day}" data-x="1" title="Every shot and game this day counts as experimental">Make experimental</button>`}</td></tr>`;
        })
        .join("") || `<tr><td colspan="5" class="muted">No shots yet</td></tr>`);
  }
}

// ---- Sessions -------------------------------------------------------------------------

// Each session - a range visit, a putting or chipping session, a challenge,
// a round - with its own Leave out and Make experimental: a test session
// taken out without losing the rest of the day. The same as the question
// when a session ends (recorder.js), and taken back as easily.
export class SessionsList {
  // player(): whose. names: { gameName }. changed(): the report is fetched
  // again.
  constructor({ player, names, changed }) {
    this.player = player;
    this.names = names;
    this.changed = changed;
    $("sessions").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-ses]");
      if (b) this.mark(b.dataset.ses, b.dataset.out != null ? { out: b.dataset.out === "1" } : { x: b.dataset.x === "1" });
    });
    $("sessions-msg").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-undo]");
      if (b && this.undo) this.mark(this.undo.id, this.undo.change, { undoing: true });
    });
  }

  async mark(id, change, { undoing = false } = {}) {
    try {
      await post("/api/stats/session", { player: this.player(), id, ...change });
    } catch (err) {
      $("sessions-msg").textContent = `Couldn't change that session: ${err.message}`;
      return;
    }
    const what =
      "out" in change
        ? change.out
          ? "left out of every number"
          : "put back - it counts again"
        : change.x
          ? "made experimental - left out unless Experimental is ticked"
          : "not experimental any more - it counts again";
    this.undo = undoing ? null : { id, change: "out" in change ? { out: !change.out } : { x: !change.x } };
    $("sessions-msg").innerHTML = `That session ${esc(what)}.${this.undo ? ` <button data-undo>Undo</button>` : ""}`;
    this.changed();
  }

  render(d) {
    const list = d.sessionList ?? [];
    const today = d.view?.today ?? null;
    const when = (t) => new Date(t).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    $("sessions").innerHTML =
      `<tr><th>When</th><th class="what">What</th><th>Shots</th><th>Time</th><th></th></tr>` +
      (list
        .map((x) => {
          const tags = [
            x.out ? `<span class="tag out">Left out</span>` : x.dayOut ? `<span class="tag out" title="The whole day is left out (Days, above)">Day left out</span>` : "",
            x.x || x.rec === "x" ? `<span class="tag xday">Experimental</span>` : x.dayX ? `<span class="tag xday" title="The whole day is experimental (Days, above)">Experimental day</span>` : "",
          ].join("");
          const what = `${this.names.gameName(x.kind)}${x.name ? `: ${x.name}` : ""}${x.score != null ? ` - ${x.score}` : ""}`;
          return `<tr class="${x.out || x.dayOut ? "out" : ""}${x.x || x.dayX ? " xday" : ""}">
            <td>${esc(dayName(x.day, today))}, ${esc(when(x.first))}</td>
            <td class="what">${esc(what)}${tags}</td>
            <td>${x.shots}</td>
            <td>${Math.max(1, Math.round((x.last - x.first) / 60000))} min</td>
            <td class="actions">${x.out ? `<button data-ses="${esc(x.id)}" data-out="0">Put back</button>` : `<button data-ses="${esc(x.id)}" data-out="1" title="Count nothing from this session">Leave out</button>`}
              ${x.rec === "x" ? "" : x.x ? `<button data-ses="${esc(x.id)}" data-x="0">Not experimental</button>` : `<button data-ses="${esc(x.id)}" data-x="1" title="Just testing: every shot counts as experimental">Just testing</button>`}</td></tr>`;
        })
        .join("") || `<tr><td colspan="5" class="muted">None yet</td></tr>`);
  }
}

// ---- Rounds ---------------------------------------------------------------------------

const yes = (v) => (v == null ? `<span class="muted">-</span>` : v ? `<span class="better" title="Yes">✓</span>` : `<span class="worse" title="No">✗</span>`);
const ofText = (a, b) => (b ? `${a}/${b}` : `<span class="muted">-</span>`);
const pctText = (p, n) => (p == null ? "-" : `${p}%`) + (n ? ` <small class="muted">of ${n}</small>` : "");

// Strokes gained, to one place with its sign: "+0.4", "-1.2".
const sgText = (v) => (!Number.isFinite(v) ? `<span class="muted">-</span>` : `<span class="${v >= 0 ? "better" : "worse"}">${v > 0 ? "+" : ""}${v.toFixed(1)}</span>`);

// Strokes gained a round by kind, as bars either side of the tour's line;
// then approach shots and putts by distance.
// A missed fairway, briefly: "trees, right".
const missText = (m) => [MISS_KINDS[m.where]?.toLowerCase(), m.side].filter(Boolean).join(", ");

// Where the fairways were missed and what the penalties were, across the
// rounds in view.
function breakdown(a) {
  const tm = a.teeMisses;
  const pk = a.penaltyKinds;
  const out = [];
  if (tm?.of) {
    const sided = tm.left + tm.right;
    const lean = sided >= 4 && Math.max(tm.left, tm.right) / sided >= 0.7 ? ` - mostly <b>${tm.left > tm.right ? "left" : "right"}</b>` : "";
    const where = Object.entries(tm.where)
      .filter(([, v]) => v)
      .sort((x, y) => y[1] - x[1])
      .map(([k, v]) => `<span class="tile"><b>${v}</b><span>${esc(MISS_KINDS[k])}</span></span>`)
      .join("");
    out.push(`<div><h3>Fairways missed <small class="muted">${tm.of} tee shot${tm.of === 1 ? "" : "s"}</small></h3>
      <p>${tm.left} left of where you aimed, ${tm.right} right${tm.of - sided ? `, ${tm.of - sided} fairly straight (through a dog-leg, or too long)` : ""}${lean}.</p><div class="tiles">${where}</div></div>`);
  }
  const pens = pk ? pk.water + pk.lost + pk.unplayable + pk.dropped : 0;
  if (pens) {
    const kinds = [
      ["water", "Water"],
      ["lost", "Lost ball"],
      ["unplayable", "Unplayable"],
      ["dropped", "Not known (an older round)"],
    ]
      .filter(([k]) => pk[k])
      .map(([k, name]) => `<span class="tile"><b>${pk[k]}</b><span>${esc(name)}</span></span>`)
      .join("");
    out.push(`<div><h3>Penalty strokes <small class="muted">${pens} in all</small></h3><div class="tiles">${kinds}</div></div>`);
  }
  return out.length ? `<div class="round-breakdown">${out.join("")}</div>` : "";
}

function deeper(a, base) {
  const parts = [];
  const bd = breakdown(a);
  if (bd) parts.push(bd);
  const sg = a.sg;
  if (sg) {
    const kinds = [
      ["tee", "Off the tee"],
      ["approach", "Approach"],
      ["around", "Around the green"],
      ["putting", "Putting"],
      ["total", "Total"],
    ];
    const most = Math.max(1, ...kinds.map(([k]) => Math.abs(sg[k])));
    const bars = kinds
      .map(([k, name]) => {
        const v = sg[k];
        const w = Math.min(50, (50 * Math.abs(v)) / most);
        return `<span>${k === "total" ? `<b>${name}</b>` : name}</span><span class="sg-bar"><i class="${v >= 0 ? "plus" : "minus"}" style="width:${w.toFixed(1)}%"></i></span><b>${sgText(v)}</b>`;
      })
      .join("");
    const worst = kinds.slice(0, 4).reduce((m, k) => (sg[k[0]] < sg[m[0]] ? k : m));
    const against = base?.name ?? "a tour pro";
    const tour = base?.choice === "tour";
    parts.push(`<h3>Strokes gained <small class="muted">a round of 18, against ${esc(against)} (${sg.holes} holes)</small></h3>
      <div class="sg-bars">${bars}</div>
      <p class="muted small">Each shot's worth: the strokes ${esc(against)} takes on average from where it was played, less those from where it finished, less the stroke (and any penalty). ${tour ? "Below nothing is normal against the tour - the kind furthest below is where strokes go" : "Above nothing is better than that golfer, below is worse - the kind furthest below is where you lose most"}: <b>${esc(worst[1].toLowerCase())}</b>. The handicap levels scale the tour's numbers (a golfer of handicap h takes 1 + (h + 2) / 54 as long over every stroke but the last). Off the tee: par 4 and 5 tee shots. Approach: the rest from over 30 yds, par 3 tee shots too. Around the green: from 30 yds in, off the green.</p>`);
  }
  const ap = a.approachBands ?? [];
  const pt = a.puttBands ?? [];
  const tables = [];
  if (ap.some((b) => b.shots))
    tables.push(`<div><h3>Approach by distance</h3><div class="table-wrap"><table class="stats-table"><tr><th>From</th><th>Shots</th><th>Green hit</th><th>Left, on average</th></tr>${ap
      .map((b) => `<tr><td>${esc(b.name)}</td><td>${b.shots}</td><td>${b.greenPct == null ? "-" : `${b.greenPct}%`}</td><td>${b.feet == null ? "-" : `${b.feet} ft`}</td></tr>`)
      .join("")}</table></div></div>`);
  if (pt.some((b) => b.putts))
    tables.push(`<div><h3>Putts holed by length</h3><div class="table-wrap"><table class="stats-table"><tr><th>Length</th><th>Putts</th><th>Holed</th></tr>${pt
      .map((b) => `<tr><td>${esc(b.name)}</td><td>${b.putts}</td><td>${b.madePct == null ? "-" : `${b.madePct}%`}</td></tr>`)
      .join("")}</table></div></div>`);
  if (tables.length) parts.push(`<div class="deep-tables">${tables.join("")}</div>`);
  return parts.join("");
}

// The Rounds section: averages across the rounds in view, each round with
// its holes (a button shows them), and other play recorded as Round.
export class RoundsList {
  constructor({ names }) {
    this.names = names;
    this.open = new Set();
    $("rounds").addEventListener("click", (e) => {
      const card = e.target.closest("button[data-card]");
      if (card) return this.showCard(card.dataset.card);
      const b = e.target.closest("button[data-round]");
      if (!b) return;
      const id = b.dataset.round;
      if (this.open.has(id)) this.open.delete(id);
      else this.open.add(id);
      this.render(this.last);
    });
  }

  // A round's card (roundcard.js), over the page.
  showCard(id) {
    const d = this.last;
    const x = d?.rounds?.list?.find((r) => r.id === id);
    if (!x) return;
    this.cardView ??= new RoundCardView({ toast: (t) => ($("rounds-msg").textContent = t) });
    const index = x.hcp ? null : (d.handicap?.index ?? null);
    this.cardView.set([roundCard(x, { player: d.name, index, against: d.sgBaseline?.name ?? "your handicap", hcp: x.hcp ?? null })]);
    this.cardView.show(true);
  }

  render(d) {
    this.last = d;
    const r = d.rounds ?? { list: [], other: [], averages: null };
    const a = r.averages;
    const hcp = d.handicap ?? null;
    const when = (t) => (t ? new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "-");
    $("rounds-avg").innerHTML =
      a && a.rounds
        ? [
            ...(hcp ? [[hcp.index == null ? "-" : hcp.index.toFixed(1), hcp.index == null ? `handicap index - ${hcp.rounds ? `${3 - hcp.rounds} more 9 or 18 hole round${3 - hcp.rounds === 1 ? "" : "s"} to go` : "play a full 9 or 18 holes"}` : `handicap index (best ${hcp.counting} of ${hcp.of})`]] : []),
            [signed(a.toPar), `to par, a round (${a.rounds} round${a.rounds === 1 ? "" : "s"}, ${a.holes} holes)`],
            [a.fairways == null ? "-" : `${a.fairways}%`, `fairways hit${a.fairwayChances ? ` (of ${a.fairwayChances})` : ""}`],
            [a.greens == null ? "-" : `${a.greens}%`, `greens in regulation${a.greenChances ? ` (of ${a.greenChances})` : ""}`],
            [a.puttsPerRound ?? "-", `putts a round${a.puttsPerHole != null ? ` (${a.puttsPerHole} a hole)` : ""}`],
            [a.upDowns == null ? "-" : `${a.upDowns}%`, `up and downs${a.upDownChances ? ` (of ${a.upDownChances})` : ""}`],
            [a.penaltiesPerRound ?? "-", "penalties a round"],
            [a.sandSaves == null ? "-" : `${a.sandSaves}%`, `sand saves${a.sandChances ? ` (of ${a.sandChances})` : ""}`],
          ]
            .map(([v, label]) => `<div class="tile"><b>${esc(v)}</b><span>${esc(label)}</span></div>`)
            .join("")
        : `<p class="muted">No rounds in view - play a course (or record play as Round) and they show here.</p>`;
    const rows = r.list.map((x) => {
      const id = esc(x.id ?? "");
      const open = this.open.has(x.id);
      const course = `${esc(x.course ?? "Course")}${x.rec === "x" ? ` <span class="tag xday">Experimental</span>` : ""}${x.carded ? "" : ` <span class="muted small" title="The round's scorecard wasn't saved: holes finished as far as its shots show">(not finished)</span>`}`;
      const main = `<tr class="round-row"><td>${when(x.t)}</td><td>${course}</td><td>${x.played}${x.complete === false && x.of ? ` <span class="muted small">of ${x.of}</span>` : ""}</td>
        <td><b>${x.score ?? "-"}</b> ${x.toPar != null ? `(${signed(x.toPar)})` : ""}${x.hcp ? ` <small class="muted" title="Handicap score differential${x.hcp.courseHandicap != null ? ` - played off ${x.hcp.courseHandicap}` : ""}">diff ${x.hcp.diff.toFixed(1)}${x.hcp.net != null ? ` · net ${x.hcp.net}` : ""}</small>` : ""}</td>
        <td>${ofText(x.fairways.hit, x.fairways.of)}</td><td>${ofText(x.greens.hit, x.greens.of)}</td>
        <td>${x.putts.holes ? `${x.putts.total}${x.putts.holes < x.played ? ` <small class="muted">(${x.putts.holes} holes)</small>` : ""}` : "-"}</td>
        <td>${ofText(x.upDowns.made, x.upDowns.of)}</td><td>${x.penalties.holes ? x.penalties.total : "-"}</td>
        <td>${sgText(x.sg?.total)}${x.sg && x.sg.holes < x.played ? ` <small class="muted">(${x.sg.holes} holes)</small>` : ""}</td>
        <td>${x.holes.length ? `<button data-round="${id}" aria-expanded="${open}">${open ? "Hide holes" : "Holes"}</button> <button data-card="${id}" title="The round card: the scorecard, net score, strokes gained and the shot of the round, to save or copy as a picture">Card</button>` : ""}</td></tr>`;
      if (!open) return main;
      const holes = x.holes
        .map(
          (h) => `<tr><td>${h.hole}</td><td>${h.par ?? "-"}</td><td><b>${h.score ?? "-"}</b>${h.given ? ` <small class="muted" title="The last putt was given">(gimme)</small>` : h.pickedUp ? ` <small class="muted">(picked up)</small>` : ""}</td>
            <td>${h.putts ?? "-"}</td><td>${h.par >= 4 ? yes(h.fir) : `<span class="muted">par 3</span>`}${h.teeMiss ? ` <small class="muted">${esc(missText(h.teeMiss))}</small>` : ""}</td><td>${yes(h.gir)}</td><td>${h.upDown == null ? `<span class="muted">-</span>` : yes(h.upDown)}</td><td>${h.penalties ?? "-"}</td><td>${sgText(h.sg?.total)}</td></tr>`,
        )
        .join("");
      return `${main}<tr class="round-holes"><td colspan="11"><table class="stats-table holes-table"><tr><th>Hole</th><th>Par</th><th>Score</th><th>Putts</th><th>Fairway</th><th>Green</th><th>Up and down</th><th>Penalties</th><th>SG</th></tr>${holes}</table></td></tr>`;
    });
    $("rounds").innerHTML = r.list.length
      ? `<tr><th>Date</th><th>Course</th><th>Holes</th><th>Score</th><th>Fairways</th><th>Greens</th><th>Putts</th><th>Up and down</th><th>Penalties</th><th title="Strokes gained against a tour player">SG</th><th></th></tr>${rows.join("")}`
      : "";
    $("rounds-deep").innerHTML = a && a.rounds ? deeper(a, d.sgBaseline) : "";
    const { gameName } = this.names;
    $("rounds-other").innerHTML = r.other?.length
      ? `<h3>Other play recorded as Round</h3><div class="table-wrap"><table class="stats-table"><tr><th>Date</th><th>What</th><th>Shots</th><th>Score</th></tr>${r.other
          .map((o) => `<tr><td>${when(o.t)}</td><td>${esc(gameName(o.kind))}${o.name ? ` - ${esc(o.name)}` : ""}</td><td>${o.shots}</td><td>${o.score ?? "-"}</td></tr>`)
          .join("")}</table></div>`
      : "";
    const old = $("rounds-old");
    old.hidden = !r.old;
    old.textContent = r.old
      ? "Rounds played before 28 September 2026 didn't keep where each shot finished or its penalty: their fairways, greens and up-and-downs are worked out from where the next shot was played, and a penalty from the ball being dropped - so which penalty it was (water or a lost ball) isn't known, and a hole whose scorecard wasn't saved can't say whether its last putt was given."
      : "";
  }
}

// ---- Start again, and the archive -------------------------------------------------------

export class StartAgain {
  // player(): whose stats the page shows. changed(): they're fetched again.
  constructor({ player, changed }) {
    this.player = player;
    this.changed = changed;
    this.dialog = $("restart-dialog");
    $("restart").addEventListener("click", () => this.ask());
    this.dialog.addEventListener("close", () => this.dialog.returnValue === "restart" && this.restart());
    $("archive").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-restore]");
      if (b) this.restore(b.dataset.restore, b.dataset.name, b.dataset.when);
    });
  }

  // The confirmation, saying what goes: this player's shots, on how many days.
  ask(report = this.report) {
    const name = this.player();
    const who = `${name}'s`;
    this.dialog.querySelector("[data-who]").textContent = who;
    const shots = report?.view?.all ?? 0;
    const days = report?.days?.length ?? 0;
    this.dialog.querySelector("[data-what]").innerHTML = shots
      ? `Every shot, game and best on My stats for <b>${esc(name)}</b> - ${shots.toLocaleString()} shot${shots === 1 ? "" : "s"} on ${days} day${days === 1 ? "" : "s"} - moves into the archive, and the next shot starts them again from nothing.`
      : `<b>${esc(name)}</b> has no shots recorded, so there's nothing to move - their stats already start from nothing.`;
    this.dialog.returnValue = "";
    this.dialog.showModal();
  }

  async restart() {
    const name = this.player();
    try {
      const r = await post("/api/stats/restart", { player: name });
      $("restart-msg").textContent = r.archived
        ? `${name}'s stats start again from nothing - the old ones (${r.archived.shots} shots) are in the archive below.`
        : `${name} had no stats to move.`;
    } catch (err) {
      $("restart-msg").textContent = `Couldn't start again: ${err.message}`;
    }
    this.changed();
  }

  async restore(file, name, when) {
    if (!confirm(`Bring back ${name}'s stats from ${when}?\n\nWhatever ${name} has recorded since goes into the archive in their place, so nothing is lost either way.`)) return;
    try {
      const r = await post("/api/stats/restore", { file });
      $("restart-msg").textContent = `${r.restored?.name ?? name}'s stats from ${when} are back${r.archived ? ` - the ones they replaced (${r.archived.shots} shots) are in the archive` : ""}.`;
    } catch (err) {
      $("restart-msg").textContent = `Couldn't bring them back: ${err.message}`;
    }
    this.changed();
  }

  // The report as shown (for the confirmation), and the archive list.
  async render(report) {
    this.report = report;
    const name = this.player();
    $("restart").textContent = `Start ${name}'s stats again...`;
    let list = [];
    try {
      list = await fetch("/api/stats/archive").then((r) => (r.ok ? r.json() : []));
    } catch {
      list = [];
    }
    const at = (t) => new Date(t).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const span = (a) => (a.first ? `${new Date(a.first).toLocaleDateString(undefined, { day: "numeric", month: "short" })} - ${new Date(a.last).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}` : "-");
    // This player's first.
    list.sort((a, b) => (b.name === name) - (a.name === name) || b.at - a.at);
    $("archive").innerHTML = list.length
      ? `<tr><th>Player</th><th>Archived</th><th>Shots</th><th>Games</th><th>Days</th><th>From - to</th><th></th></tr>` +
        list
          .map(
            (a) => `<tr class="${a.name === name ? "mine" : ""}"><td>${esc(a.name)}</td><td>${at(a.at)}</td><td>${a.shots}</td><td>${a.games}</td><td>${a.days}</td><td>${span(a)}</td>
              <td><button data-restore="${esc(a.file)}" data-name="${esc(a.name)}" data-when="${esc(at(a.at))}">Bring back</button></td></tr>`,
          )
          .join("")
      : `<tr><td class="muted">Nothing archived - starting again moves stats here.</td></tr>`;
  }
}

// ---- Trends ---------------------------------------------------------------------------

const UNIT_WORDS = { hour: "hour", day: "day", week: "week", month: "month" };
const DIRECTION = {
  better: { icon: "▲", word: "Improving", cls: "better" },
  worse: { icon: "▼", word: "Declining", cls: "worse" },
  steady: { icon: "▬", word: "Steady", cls: "muted" },
  few: { icon: "·", word: "Too few to tell", cls: "muted" },
};

// A little line of a number over the period: a dot a group of time (an
// hour, day, week or month), the recent end on the right.
function spark(points, from, to, better) {
  if (!points?.length) return "";
  const W = 120;
  const H = 28;
  const vs = points.map((p) => p.v);
  let lo = Math.min(...vs);
  let hi = Math.max(...vs);
  if (hi - lo < 1e-9) {
    lo -= 1;
    hi += 1;
  }
  const span = Math.max(1, to - from);
  // Better is always up on the line, so a rising line is good news.
  const y = (v) => {
    const f = (v - lo) / (hi - lo);
    return (3 + (H - 6) * (better === "down" ? f : 1 - f)).toFixed(1);
  };
  const x = (t) => (3 + (W - 6) * Math.min(1, Math.max(0, (t - from) / span))).toFixed(1);
  const pts = points.map((p) => `${x(p.t)},${y(p.v)}`);
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">${pts.length > 1 ? `<polyline points="${pts.join(" ")}" />` : ""}${pts.map((p) => `<circle cx="${p.split(",")[0]}" cy="${p.split(",")[1]}" r="2" />`).join("")}</svg>`;
}

// A trend's number with its unit: "12.3%", "4.0 ft", "230.0 yds", or "-".
// (util.js fmt is the bare number.)
function fmtUnit(v, digits, unit) {
  if (!Number.isFinite(v)) return "-";
  const n = v.toFixed(digits);
  return unit === "%" ? `${n}%` : unit === "ft" || unit === "yds" ? `${n} ${unit}` : n;
}

// words: other names for better and worse ("Longer", "Shorter" for carry).
function trendRow(name, m, unit, digits, trend, range, sub = "", words = null) {
  const base = DIRECTION[m.direction] ?? DIRECTION.few;
  const d = words?.[m.direction] ? { ...base, word: words[m.direction] } : base;
  const change = Number.isFinite(m.change) ? `${m.change > 0 ? "+" : ""}${fmtUnit(m.change, digits, unit)}` : "";
  return `<tr><td>${esc(name)}${sub ? ` <small class="muted">${esc(sub)}</small>` : ""}</td>
    <td>${spark(m.points, range.from, range.to, trend)}</td>
    <td>${fmtUnit(m.earlier, digits, unit)} → <b>${fmtUnit(m.recent, digits, unit)}</b></td>
    <td class="${d.cls}">${change}</td>
    <td class="${d.cls}" title="${m.n} ${m.n === 1 ? "item" : "items"}">${d.icon} ${d.word}</td></tr>`;
}

// The Trends section: scoring, each club, the short game.
export function renderTrends(d, clubName = (c) => c) {
  const t = d.trends;
  const el = document.getElementById("trends");
  if (!el) return;
  if (!t || (!t.scoring.length && !t.clubs.length && !t.short.length && !t.practice?.length && !t.challenges?.length)) {
    el.innerHTML = `<p class="muted">No trends yet - they show once there are enough shots or rounds in the period.</p>`;
    return;
  }
  const range = { from: t.from, to: t.to };
  const head = `<tr><th></th><th>By ${UNIT_WORDS[t.unit]}</th><th>Earlier → recent</th><th>Change</th><th></th></tr>`;
  const parts = [];
  const all = [...t.scoring, ...t.short, ...(t.practice ?? []), ...(t.challenges ?? []), ...t.clubs.flatMap((c) => [c.carry, c.offline])];
  const better = all.filter((m) => m.direction === "better").length;
  const worse = all.filter((m) => m.direction === "worse").length;
  parts.push(
    `<p class="trend-sum"><span class="better">▲ ${better} improving</span> · <span class="worse">▼ ${worse} declining</span> · <span class="muted">the rest steady or too few to tell</span></p>`,
  );
  const table = (title, rows) => (rows.length ? `<h3>${title}</h3><div class="table-wrap"><table class="stats-table trends-table">${head}${rows.join("")}</table></div>` : "");
  parts.push(table("Scoring <small class=\"muted\">course rounds</small>", t.scoring.map((m) => trendRow(m.name, m, m.unit === "%" ? "%" : "", m.digits, m.better, range, m.unit === "%" ? "" : m.unit))));
  parts.push(
    table(
      "Clubs <small class=\"muted\">good full swings</small>",
      t.clubs.flatMap((c) => [trendRow(`${clubName(c.club)} carry`, c.carry, "yds", 1, "up", range, `${c.shots} shots`, { better: "Longer", worse: "Shorter" }), trendRow(`${clubName(c.club)} off line`, c.offline, "yds", 1, "down", range)]),
    ),
  );
  parts.push(table("Short game", t.short.map((m) => trendRow(m.name, m, m.unit, m.digits, m.better, range))));
  parts.push(table("Practice plans <small class=\"muted\">each drill's score, 0-100</small>", (t.practice ?? []).map((m) => trendRow(m.name, m, "", 0, "up", range))));
  parts.push(table("Challenges <small class=\"muted\">each one's score, played three times or more</small>", (t.challenges ?? []).map((m) => trendRow(m.name, m, "", 0, "up", range))));
  parts.push(
    `<p class="muted small">The period's shots (or rounds) are split in two by time and the halves' averages compared. <i>Improving</i> or <i>declining</i> only when the change is big enough to matter and clear of the ups and downs of single shots (1.5 standard errors); otherwise <i>steady</i>. A club's carry says <i>longer</i> or <i>shorter</i> - further isn't always better. On the little lines better (or longer) is always up. Pick <i>3 months</i>, <i>6 months</i> or <i>12 months</i> above for the longer view.</p>`,
  );
  el.innerHTML = parts.join("");
}

// ---- The two-week summary --------------------------------------------------------------

// A fortnight's first and last day as the page says them: "Mon 5 Oct - Sun
// 18 Oct", with the year when it isn't this one.
export function fortnightSpan(from, to, year = new Date().getFullYear()) {
  const words = (day) => {
    const [y, m, d] = day.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", ...(y !== year ? { year: "numeric" } : {}) });
  };
  return `${words(from)} - ${words(to)}`;
}

// How much was played: "3 days, 412 shots, 1 round, 2 challenges and drills".
function playedWords(p) {
  const n = (v, one, many = `${one}s`) => `${v} ${v === 1 ? one : many}`;
  const parts = [n(p.days, "day"), n(p.shots, "shot")];
  if (p.rounds) parts.push(n(p.rounds, "round"));
  if (p.games) parts.push(n(p.games, "challenge or drill", "challenges and drills"));
  return parts.join(", ");
}

// The units a number is in that its figures don't say ("a round of 18").
const quietUnit = (m) => (["%", "ft", "yds", ""].includes(m.unit) ? "" : m.unit);
// What's shown at first in each list; the rest a click away.
const FORTNIGHT_SHOWN = 6;

// The fortnight's summary: what was played, what improved, what slipped,
// the bests set - with Earlier and Later to step through the fortnights
// played. load(at) gives the summary of the fortnight with that day in it.
export class FortnightView {
  // clubName(code): "7 iron". bestName(best): what a best was in ("Lag
  // putting challenge (30 - 50 ft)", "Oak Park").
  constructor({ load, clubName = (c) => c, bestName = (b) => b.name ?? b.kind }) {
    this.load = load;
    this.clubName = clubName;
    this.bestName = bestName;
    // The fortnight picked (a day in it), or null for the latest.
    this.at = null;
  }

  // For the report's address: the fortnight picked, if one is.
  query() {
    return this.at ? `&fortnight=${encodeURIComponent(this.at)}` : "";
  }
  // Another player: their latest fortnight.
  reset() {
    this.at = null;
  }

  async go(at) {
    const el = $("fortnight");
    this.at = at;
    el?.classList.add("loading");
    try {
      this.render(await this.load(at));
    } catch {
      if (el) el.querySelector(".fn-msg").textContent = "Couldn't reach A² Golf - is it still running?";
    } finally {
      el?.classList.remove("loading");
    }
  }

  row(m) {
    const name = m.club ? `${this.clubName(m.club)} ${m.part === "carry" ? "carry" : "off line"}` : m.name;
    // The change between the figures as shown, so 40 → 58 is +18.
    const shown = (v) => Number(v.toFixed(m.digits));
    const diff = shown(m.recent) - shown(m.earlier);
    const change = `${diff > 0 ? "+" : ""}${fmtUnit(diff, m.digits, m.unit)}`;
    // A club's carry is longer or shorter: further isn't always better.
    const word = m.part === "carry" ? (m.change > 0 ? " longer" : " shorter") : "";
    const unit = quietUnit(m);
    return `<li><b>${esc(name)}</b>${unit ? ` <small class="muted">${esc(unit)}</small>` : ""}
      <span class="fn-figs">${fmtUnit(m.earlier, m.digits, m.unit)} → <b>${fmtUnit(m.recent, m.digits, m.unit)}</b>
      <span class="${m.direction === "better" ? "better" : "worse"}">${change}${word}</span></span></li>`;
  }

  list(items, empty) {
    if (!items.length) return `<p class="muted small">${empty}</p>`;
    const shown = items.slice(0, FORTNIGHT_SHOWN).map((m) => this.row(m));
    const more = items.slice(FORTNIGHT_SHOWN).map((m) => this.row(m));
    return `<ul class="fn-list">${shown.join("")}</ul>` + (more.length ? `<details><summary>${more.length} more</summary><ul class="fn-list">${more.join("")}</ul></details>` : "");
  }

  render(f) {
    const el = $("fortnight");
    if (!el) return;
    if (!f) {
      el.innerHTML = `<p class="muted">Nothing played yet - the summary starts with the first shots.</p><p class="fn-msg small"></p>`;
      return;
    }
    const when = f.soFar ? `so far - day ${f.day} of 14` : "";
    const against = f.against ? `against ${esc(fortnightSpan(f.against.from, f.against.to))}, the last fortnight played before it` : "nothing played before it to compare with";
    const bests = f.bests.map(
      (b) => `<li><b>${esc(this.bestName(b))}</b> <span class="fn-figs"><b>${esc(b.score)}</b> ${b.previous == null ? `<span class="muted">the first</span>` : `<span class="better">was ${esc(b.previous)}</span>`}</span></li>`,
    );
    el.innerHTML = `
      <div class="fn-head">
        <button data-fn="${esc(f.earlier ?? "")}" ${f.earlier ? "" : "disabled"} title="The fortnight played before this one">◀ Earlier</button>
        <div class="fn-when"><b>${esc(fortnightSpan(f.from, f.to))}</b>${when ? ` <span class="muted">${when}</span>` : ""}<div class="muted small">${against}</div></div>
        <button data-fn="${esc(f.later ?? "")}" ${f.later ? "" : "disabled"} title="The fortnight played after this one">Later ▶</button>
      </div>
      <p class="fn-played">Played: <b>${esc(playedWords(f.played))}</b>.${f.before ? ` <span class="muted">The fortnight before: ${esc(playedWords(f.before))}.</span>` : ""}</p>
      <div class="two fn-lists">
        <div><h3 class="better">▲ Improved</h3>${this.list(f.improved, f.against ? "Nothing clearly better yet." : "Nothing to compare with yet.")}</div>
        <div><h3 class="worse">▼ Slipped</h3>${this.list(f.slipped, f.against ? "Nothing clearly worse." : "Nothing to compare with yet.")}</div>
      </div>
      ${bests.length ? `<h3>★ Bests set</h3><ul class="fn-list">${bests.join("")}</ul>` : ""}
      <p class="muted small">${f.steady} steady, ${f.few} too few to tell. The same numbers as <i>Trends</i>, below - scoring from the course rounds, each club, the short game, the practice plans and the challenges - this fortnight's against the last one played: improved or slipped only when the change is big enough to matter and clear of the ups and downs of single shots, else steady (each side needs 6 shots, 2 rounds or 2 games). Fortnights run Monday to the Sunday after next. Counts the shots ticked above, whatever days are picked.</p>
      <p class="fn-msg small"></p>`;
    for (const b of el.querySelectorAll("button[data-fn]")) b.addEventListener("click", () => b.dataset.fn && this.go(b.dataset.fn));
  }
}

// ---- Practice plans --------------------------------------------------------------------

// What to practise next: the drills the stats point to, the first the
// most useful, each with why and a button to start it in the sim.
export function renderPlans(d, suggest, start) {
  const el = document.getElementById("plans");
  if (!el) return;
  const list = suggest(d).slice(0, 3);
  el.innerHTML = list
    .map(
      (x, i) => `<div class="plan${i === 0 ? " first" : ""}"><div><b>${esc(x.drill.name)}</b>${i === 0 ? ` <span class="tag">Start here</span>` : ""}
        <div class="small">${esc(x.why || "A good all-round start.")}</div>
        <div class="muted small">${esc(x.drill.what)}</div></div>
        <button data-plan="${esc(x.drill.id)}"${i === 0 ? ` class="primary"` : ""}>Practise this</button></div>`,
    )
    .join("");
  for (const b of el.querySelectorAll("button[data-plan]")) b.addEventListener("click", () => start(b.dataset.plan));
}
