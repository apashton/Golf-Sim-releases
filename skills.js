// Skill points on the screen (sim/skills.mjs): each player's ranks as the
// stats have them, kept here for the swing (PlayerSkills), and the card
// where they're spent (SkillsCard: Menu -> Swing pad & controller -> Skill
// points). The stats keep them (the PC's server, or the phone's pocket
// server until they're sent): /api/stats/player's skills, POST
// /api/stats/skills.

import { esc, loadSetting } from "./util.js";
import { isGuest } from "./sim/profiles.mjs";
import { ATTRIBUTES, MAX_RANK, MOST_POINTS, HARD_FROM, spentOf, cleanRanks, canRespec } from "./sim/skills.mjs";

// How long a player's skills are taken as they were before they're asked
// for again.
const FRESH_MS = 60_000;

// The season's start, for the once-a-season re-spend (course/season.js).
export const seasonStart = () => {
  const s = loadSetting("season", null);
  return Number.isFinite(s?.started) ? s.started : null;
};

export class PlayerSkills {
  constructor({ fetcher = (...a) => fetch(...a) } = {}) {
    this.fetch = fetcher;
    this.kept = new Map(); // name -> { at, skills }
  }

  // A player's skills now ({ xp, points, ranks, ... }), asked for.
  async get(name, { fresh = false } = {}) {
    if (!name || isGuest(name)) return null;
    const k = this.kept.get(name);
    if (k && !fresh && performance.now() - k.at < FRESH_MS) return k.skills;
    let skills = null;
    try {
      const d = await this.fetch(`/api/stats/player?name=${encodeURIComponent(name)}&period=today`).then((r) => (r.ok ? r.json() : null));
      skills = d?.skills ?? null;
    } catch {
      skills = null;
    }
    this.kept.set(name, { at: performance.now(), skills });
    return skills;
  }

  // Their ranks as last known, for a swing struck now (asked for again in
  // the background when they're stale).
  ranks(name) {
    if (!name || isGuest(name)) return {};
    const k = this.kept.get(name);
    if (!k || performance.now() - k.at > FRESH_MS) this.get(name);
    return k?.skills?.ranks ?? {};
  }

  forget(name) {
    this.kept.delete(name);
  }

  async spend(name, ranks) {
    const res = await this.fetch("/api/stats/skills", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ player: name, ranks, seasonStart: seasonStart() }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.error ?? "Couldn't keep them");
    this.kept.set(name, { at: performance.now(), skills: d });
    return d;
  }
}

// The card: a player's level and points, each attribute with - and +,
// Keep. Who: players() (the names playing), first the one hitting.
export class SkillsCard {
  constructor({ doc = document, parent = doc.body, skills, players = () => [], hitter = () => null, toast = () => {} }) {
    this.skills = skills;
    this.players = players;
    this.hitter = hitter;
    this.toast = toast;
    this.name = null;
    this.now = null;
    this.ranks = {};
    this.el = doc.createElement("div");
    this.el.className = "corner-card skills-card";
    this.el.hidden = true;
    this.el.setAttribute("role", "dialog");
    this.el.setAttribute("aria-label", "Skill points");
    parent.append(this.el);
    this.el.addEventListener("click", (e) => this.click(e));
    this.el.addEventListener("change", (e) => {
      if (e.target.matches("select.sk-who")) this.load(e.target.value);
    });
  }

  get open() {
    return !this.el.hidden;
  }

  async show(on = !this.open, name = null) {
    this.el.hidden = !on;
    if (!on) return;
    // A guest's aren't kept: the first saved player then.
    await this.load(name ?? [this.hitter(), ...this.players()].find((n) => n && !isGuest(n)) ?? null);
  }

  async load(name) {
    this.name = name;
    this.el.innerHTML = `<p class="muted">Loading ${esc(name ?? "")}'s skill points...</p>`;
    this.now = name ? await this.skills.get(name, { fresh: true }) : null;
    this.ranks = { ...(this.now?.ranks ?? {}) };
    this.draw();
  }

  click(e) {
    const b = e.target.closest("button");
    if (!b) return;
    const id = b.dataset.attr;
    if (b.dataset.act === "close") return this.show(false);
    if (b.dataset.act === "reset") {
      this.ranks = { ...(this.now?.ranks ?? {}) };
      return this.draw();
    }
    if (b.dataset.act === "keep") return this.keep();
    if (!id || !this.now) return;
    const r = this.ranks[id] ?? 0;
    if (b.dataset.act === "up" && r < MAX_RANK && spentOf(this.ranks) < this.now.points) this.ranks[id] = r + 1;
    if (b.dataset.act === "down" && r > 0) this.ranks[id] = r - 1;
    this.draw();
  }

  async keep() {
    try {
      this.now = await this.skills.spend(this.name, cleanRanks(this.ranks));
      this.ranks = { ...this.now.ranks };
      this.toast(`${this.name}'s skill points kept`, 2000);
      this.draw();
    } catch (err) {
      this.draw(err.message);
    }
  }

  draw(problem = "") {
    const now = this.now;
    const names = [...new Set([this.name, ...this.players()].filter(Boolean))];
    const who = names.length > 1 ? `<select class="sk-who" aria-label="Whose">${names.map((n) => `<option ${n === this.name ? "selected" : ""}>${esc(n)}</option>`).join("")}</select>` : `<b>${esc(this.name ?? "")}</b>`;
    if (!now) {
      const words = this.name ? "No skill points to show yet - they come with stats: rounds and challenges played with the swing pad or a controller." : "Skill points are kept for saved players (a guest's aren't): choose one in Who's playing.";
      this.el.innerHTML = `<b>Skill points</b> ${who}<p class="small muted">${words}</p><div class="buttons"><button type="button" data-act="close">Close</button></div>`;
      return;
    }
    const spent = spentOf(this.ranks);
    const left = now.points - spent;
    const changed = JSON.stringify(cleanRanks(this.ranks)) !== JSON.stringify(cleanRanks(now.ranks));
    const lowered = ATTRIBUTES.some((a) => (this.ranks[a.id] ?? 0) < (now.ranks[a.id] ?? 0));
    const re = canRespec({ points: now.points, lastRespec: now.lastRespec, seasonStart: seasonStart() });
    const bar = now.need ? `<div class="sk-bar" title="${now.into} of ${now.need} XP to the next point"><i style="width:${Math.round((100 * now.into) / now.need)}%"></i></div>` : "";
    const next = now.need ? `${now.into.toLocaleString()} / ${now.need.toLocaleString()} XP to the next${now.points >= HARD_FROM ? " (past 60 they're far harder)" : ""}` : `All ${MOST_POINTS} earned`;
    const rows = ATTRIBUTES.map((a) => {
      const r = this.ranks[a.id] ?? 0;
      const pips = Array.from({ length: MAX_RANK }, (_, i) => `<i class="${i < r ? "on" : ""}"></i>`).join("");
      return `<div class="sk-row" title="${esc(a.does)}"><span class="sk-name"><b>${esc(a.name)}</b><small>${esc(a.does)}</small></span>
        <span class="sk-pips">${pips}</span>
        <span class="sk-ctl"><button type="button" data-act="down" data-attr="${a.id}" ${r ? "" : "disabled"} aria-label="One less ${esc(a.name)}">−</button><b>${r}</b><button type="button" data-act="up" data-attr="${a.id}" ${r < MAX_RANK && left > 0 ? "" : "disabled"} aria-label="One more ${esc(a.name)}">+</button></span></div>`;
    }).join("");
    this.el.innerHTML = `<b>Skill points</b> ${who}
      <p class="sk-sum">Level ${now.points} · <b>${left}</b> point${left === 1 ? "" : "s"} to spend · ${now.xp.toLocaleString()} XP</p>
      ${bar}<p class="small muted">${next}</p>
      <div class="sk-rows">${rows}</div>
      <p class="small muted">For the swing pad and a controller (not a launch monitor). Points come from rounds and challenges played with them: each hole, pars and better, a finished round, a season event's place. ${MOST_POINTS} at most - eleven skills of ten each won't all fill, so pick what to be good at. Moving points: ${esc(re.words.toLowerCase())}.</p>
      ${lowered && !re.ok ? `<p class="small bad">${esc(re.words)}</p>` : ""}
      ${problem ? `<p class="small bad">${esc(problem)}</p>` : ""}
      <div class="buttons"><button type="button" data-act="reset" ${changed ? "" : "disabled"}>Undo</button><button type="button" data-act="close">Close</button><button type="button" class="primary" data-act="keep" ${changed && !(lowered && !re.ok) ? "" : "disabled"}>Keep them</button></div>`;
  }
}
