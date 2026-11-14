// The Online play panel's extras (netplay.js OnlinePanel; the owner, 29
// October 2026, "Go for them"): before a game, each bay's I'm ready and the
// host's Start counting down on every bay (sim/netlobby.mjs); Rematch - the
// same again; the host's saved game settings (sim/netpresets.mjs) and a
// match over several games (sim/netmatch.mjs, netmatchkeep.js); the game's
// code as a QR code for a phone's camera (sim/netinvite.mjs,
// sim/qrcode.mjs); each bay's connection (sim/netsignal.mjs); pausing the
// game for everyone; and a game this bay was in before the app started
// again, to rejoin (net/relayplay.mjs keep).

import { esc } from "./util.js";
import { isReady, readyWords, rematchOf, COUNTDOWN_S } from "./sim/netlobby.mjs";
import { matchTable, matchLine } from "./sim/netmatch.mjs";
import { signalOf } from "./sim/netsignal.mjs";
import { joinLink } from "./sim/netinvite.mjs";
import { qrPath } from "./sim/qrcode.mjs";

// A bay's connection as bars, beside its name.
export function signalBars(bay) {
  const s = signalOf(bay);
  if (s.bars == null) return "";
  return `<span class="net-signal net-signal-${s.level}" title="${esc(s.words)}" aria-label="${esc(s.words)}">${[1, 2, 3].map((k) => `<i class="${k <= s.bars ? "on" : ""}"></i>`).join("")}</span>`;
}

// The game's join link as a QR code (an SVG), for a phone's camera.
export function qrSvg(text) {
  const q = qrPath(text);
  if (!q) return "";
  return `<svg class="online-qr-code" viewBox="0 0 ${q.size} ${q.size}" role="img" aria-label="QR code to join"><rect width="${q.size}" height="${q.size}" fill="#fff"/><path d="${q.d}" fill="#000"/></svg>`;
}

const ago = (at) => {
  const m = Math.round((Date.now() - at) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
};

export class LobbyExtras {
  // panel: the Online play panel. presets: { list(), save(name), use(preset),
  // remove(name), words(preset) } - the host's saved game settings (app.js).
  // match: the host's match over several games (netmatchkeep.js).
  constructor(panel, { presets = null, match = null } = {}) {
    Object.assign(this, { panel, presets, match });
    // The host's last start (for Rematch), and its countdown under way.
    this.lastRound = null;
    this.timer = null;
  }

  get client() {
    return this.panel.client;
  }

  // ---- Start, counted down on every bay; Rematch ---------------------------

  get counting() {
    return this.timer != null;
  }

  async start(round) {
    const r = await this.client.send({ type: "countdown", secs: COUNTDOWN_S });
    if (r?.ok === false) throw new Error(r.error);
    this.lastRound = round;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.go(round), COUNTDOWN_S * 1000);
  }

  async go(round) {
    this.timer = null;
    try {
      await this.client.start(round);
      this.panel.show(false);
    } catch (err) {
      this.panel.message = { text: err.message, bad: true };
      this.client.send({ type: "countdown", secs: 0 });
    }
    this.panel.render();
  }

  async cancel() {
    clearTimeout(this.timer);
    this.timer = null;
    await this.client.send({ type: "countdown", secs: 0 });
  }

  // The same again: the host's last start, a new round of it (stopping the
  // one going first, the round over).
  async rematch() {
    const again = rematchOf(this.lastRound);
    if (!again) throw new Error("Nothing to play again yet");
    const g = this.client.view.game;
    if (g?.started) {
      const r = await this.client.send({ type: "lobby" });
      if (r?.ok === false) throw new Error(r.error);
    }
    await this.start(again);
  }

  rematchable(v) {
    const g = v.game;
    return v.mode === "host" && !!this.lastRound && !!g && !this.counting && ((!g.started && (g.games ?? 0) > 0) || (g.started && !!this.panel.roundOver()));
  }

  // ---- The panel's buttons ------------------------------------------------------

  // A button of this module's pressed: done (true), or not this one's.
  async act(what, data, say) {
    const v = this.client.view;
    switch (what) {
      case "ready":
        await this.client.send({ type: "readyup", bay: v.bay, ready: !isReady(v.game, v.bay) });
        return true;
      case "cancel-start":
        await this.cancel();
        say("Start called off");
        return true;
      case "rematch":
        await this.rematch();
        say("The same again - starting...");
        return true;
      case "pause":
      case "resume": {
        const r = await this.client.send({ type: "pause", on: what === "pause" });
        if (r?.ok === false) say(r.error, true);
        return true;
      }
      case "rejoin":
        this.panel.message = { text: "Rejoining...", bad: false };
        this.panel.render();
        await this.client.rejoin();
        say("Back in the game");
        return true;
      case "forget":
        await this.client.forget();
        return true;
      case "preset-use": {
        const p = this.presets?.list().find((q) => q.name === data.name);
        if (!p) return true;
        this.panel.what = p.what;
        this.presets.use(p);
        say(`Set up as "${p.name}"`);
        return true;
      }
      case "preset-save": {
        const name = this.panel.el.querySelector("#online-preset-name")?.value.trim();
        if (!name) return say("Give it a name first", true), true;
        this.presets?.save(name);
        say(`Saved "${name}" - pick it here next time`);
        return true;
      }
      case "preset-delete":
        this.presets?.remove(data.name);
        return true;
      case "match-start": {
        const name = this.panel.el.querySelector("#online-match-name")?.value.trim() || "The match";
        await this.match?.start(name);
        say(`${name} started - every game you play now counts`);
        return true;
      }
      case "match-end":
        await this.match?.end();
        say("The match is over - its table stays on the last game's card");
        return true;
      default:
        return false;
    }
  }

  // ---- What it adds to the panel -------------------------------------------------

  // A game this bay was in before the app started again (nothing going now).
  rejoinHtml(v) {
    const k = v.rejoin;
    if (v.mode !== "off" || !k) return "";
    return `<div class="online-rejoin"><p><b>${esc(k.words)}</b> - ${k.started ? "a round was going" : "you were in the lobby"}${k.at ? ` (${ago(k.at)})` : ""}. Rejoin it, back in your own place${k.started ? " with your scores so far" : ""}?</p>
      <div class="row-buttons"><button class="primary" data-act="rejoin">Rejoin</button> <button data-act="forget">Forget it</button></div></div>`;
  }

  // Beside each player: their bay ready (in the lobby), and its connection.
  playerExtras(v, g, p) {
    const bay = g.bays[p.bay];
    const ready = !g.started && p.bay !== g.host && isReady(g, p.bay) ? ` <span class="net-ready" title="Ready">✓ ready</span>` : "";
    return `${ready} ${signalBars(bay)}`;
  }

  // In the lobby: I'm ready (each bay but the host), who's not yet (the
  // host), the countdown going.
  readyHtml(v, g) {
    if (!g || g.started) return "";
    if (g.countdown) return `<p class="online-countdown">Starting in a moment - get your club ready...</p>`;
    if (v.mode === "host") return Object.keys(g.bays).length > 1 ? `<p class="small muted">${esc(readyWords(g))}. Start counts down ${COUNTDOWN_S} seconds on every bay first.</p>` : "";
    const ready = isReady(g, v.bay);
    return `<p><button class="${ready ? "" : "primary"}" data-act="ready">${ready ? "Ready ✓ - tap if you're not" : "I'm ready"}</button> <span class="small muted">The host sees who's ready, then starts.</span></p>`;
  }

  // The host's Start while counting down: Stop it. Rematch, when there's a
  // last game. Pause or carry on, during a game.
  buttons(v, g) {
    if (!g) return "";
    const out = [];
    if (this.rematchable(v)) out.push(`<button class="primary" data-act="rematch">Rematch - the same again</button>`);
    if (v.mode === "host" && g.started && !g.ended) out.push(g.paused ? `<button class="primary" data-act="resume">Carry on - unpause</button>` : `<button data-act="pause">Pause for everyone</button>`);
    return out.join(" ");
  }

  startButton(v, g, label) {
    if (this.counting || g?.countdown) return `<button data-act="cancel-start">Stop the countdown</button>`;
    return label;
  }

  // The host's saved game settings, and the match - in the lobby.
  hostToolsHtml(v, g) {
    if (v.mode !== "host" || !g || g.started) return "";
    const list = this.presets?.list() ?? [];
    const presets = `<details class="online-presets"><summary>Saved games${list.length ? ` (${list.length})` : ""}</summary>
      ${list.length ? `<ul class="online-preset-list">${list.map((p) => `<li><b>${esc(p.name)}</b> <span class="small muted">${esc(this.presets.words(p))}</span> <button data-act="preset-use" data-name="${esc(p.name)}">Use</button> <button class="small" data-act="preset-delete" data-name="${esc(p.name)}" title="Delete it">✕</button></li>`).join("")}</ul>` : `<p class="small muted">The game set up now - what to play, the course, its game and rules - saved by name, to pick again in one go.</p>`}
      <p class="small"><input id="online-preset-name" type="text" maxlength="40" placeholder="Sunday four-ball" autocomplete="off"> <button data-act="preset-save">Save these</button></p></details>`;
    const m = this.match?.match;
    const match = m
      ? `<p class="small"><button data-act="match-end">End the match</button> <span class="muted">Every game the group plays counts till then.</span></p>`
      : `<details class="online-presets"><summary>A match over several games</summary><p class="small muted">A league for the evening: each game you play counts - 10 points for first, 8, 6, 5... - and the table shows here and on each game's card. Kept on this ${v.lan === false ? "phone" : "PC"}.</p>
        <p class="small"><input id="online-match-name" type="text" maxlength="40" placeholder="Sunday league" autocomplete="off"> <button data-act="match-start">Start the match</button></p></details>`;
    return presets + match;
  }

  // The match's table, for everyone (it comes with the game).
  matchHtml(g) {
    const m = g?.match;
    if (!m) return "";
    const t = matchTable(m);
    const line = matchLine(m) || "No games played yet";
    return `<div class="online-match"><p><b>${esc(m.name)}</b> <span class="small muted">${esc(line)}</span></p>${
      t.length ? `<table class="online-match-table"><tr><th></th><th>Player</th><th>Points</th><th>Won</th><th>Played</th></tr>${t.map((r) => `<tr><td>${esc(r.place)}</td><td>${esc(r.name)}</td><td><b>${esc(r.points)}</b></td><td>${esc(r.wins)}</td><td>${esc(r.played)}</td></tr>`).join("")}</table>` : ""
    }</div>`;
  }

  // The game's code as a QR code, for a phone's camera.
  qrHtml(v) {
    const link = joinLink(v.relayUrl, v.code);
    if (!link || !v.relayConnected) return "";
    return `<div class="online-qr">${qrSvg(link)}<span class="small muted">Or point a phone's camera at this - it opens the game's code, and the A² Golf app.</span></div>`;
  }

  // The game paused, said in the panel.
  pausedHtml(g) {
    return g?.started && g.paused ? `<p class="online-paused">Paused by ${esc(g.paused.by)} - no shots are played and nobody goes on until the host carries on.</p>` : "";
  }
}
