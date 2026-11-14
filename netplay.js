// Online play on the page: the game as this PC's server has it (it hosts,
// or talks to the host: server/netplay.mjs), and the Online play panel -
// host a game, join one by its code, find one on the home network or over
// Tailscale, join by address, start the round, and see who's in and who's
// connected. The round itself is the course's (course.js startRound with
// net, applyNet). In the phone app the pocket server answers instead
// (sim/pocketserver.mjs), by code only (the view's lan false): the panel
// leaves out the home network and Tailscale.

import { esc, typingNow } from "./util.js";
import { showCode } from "./sim/netgame.mjs";
import { carryPercentWords } from "./sim/carryadjust.mjs";
import { cleanCarryRule, cleanMadeUp, levelFloor, lobbyRulesWords } from "./sim/netrules.mjs";
import { TRADE, levelFacts, levelTag } from "./sim/levelchoice.mjs";
import { TEAM_LETTERS, MAX_TEAMS, usesTeams, cleanTeams, defaultTeams, teamsOf, teamName } from "./sim/teams.mjs";
import { GAMES } from "./sim/challenges.mjs";
import { LobbyExtras } from "./netlobby.js";
import { onlineTab, tabsHtml, rulesHtml } from "./onlinetabs.js";

// What the host can start: a round on the course, or a game every bay
// plays the same way (netgame.mjs SIDE_GAMES).
const PLAY_CHOICES = [
  ["course", "A round on the course (the course panel's)"],
  ["putting", "The putting challenge (the putting green's distance)"],
  ["chipping", "The chipping challenge (the chipping green's distance)"],
  ["pong", "Golf pong - 1 v 1, three in lanes or four-way, in turn or all at once (the putting green's golf pong settings)"],
  ...GAMES.map((g) => [`challenge:${g.id}`, `Challenge: ${g.name}`]),
];

// The longest Host or Join waits for this bay's players' handicaps
// (OnlinePanel playersNow) before going without them.
const BAY_WAIT_MS = 800;

// What online play says while this PC's own server can't be reached.
export const LOST_SERVER = "Lost touch with A² Golf's own server - trying again...";

// The game as this PC's server sees it, kept up to date.
export class NetPlayClient {
  constructor() {
    this.view = { mode: "off", game: null };
    this.listeners = new Set();
    this.connect();
  }

  connect() {
    try {
      this.source = new EventSource("/api/play/events");
      this.source.addEventListener("play", (e) => {
        try {
          this.view = JSON.parse(e.data);
        } catch {
          return;
        }
        for (const f of this.listeners) f(this.view);
      });
      // This PC's own server gone (the app closing, a restart): said, until
      // it's back (the browser tries again by itself, and the first thing
      // it says is the whole view).
      this.source.onerror = () => {
        if (this.view.error === LOST_SERVER) return;
        this.view = { ...this.view, error: LOST_SERVER };
        for (const f of this.listeners) f(this.view);
      };
    } catch {
      // No server (a page opened on its own): online play isn't there.
    }
  }

  onChange(f) {
    this.listeners.add(f);
    f(this.view);
    return () => this.listeners.delete(f);
  }

  async call(path, body = null) {
    const res = await fetch(`/api/play${path}`, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {});
    const reply = await res.json().catch(() => ({}));
    if (!res.ok || reply.ok === false) throw new Error(reply.error ?? `Online play said ${res.status}`);
    return reply;
  }

  host(bay) {
    return this.call("/host", bay);
  }
  join(address, bay) {
    return this.call("/join", { address, ...bay });
  }
  joinCode(code, bay) {
    return this.call("/join", { code, ...bay });
  }
  start(round) {
    return this.call("/start", round);
  }
  send(event) {
    return this.call("/event", { event }).catch((err) => ({ ok: false, error: err.message }));
  }
  leave() {
    return this.call("/leave", {});
  }
  find() {
    return this.call("/find");
  }
  // The game kept from before the app started again (the view's rejoin):
  // back into it, or forgotten.
  rejoin() {
    return this.call("/rejoin", {});
  }
  forget() {
    return this.call("/forget", {});
  }
}

// The Online play panel, over the picture.
//   client      a NetPlayClient
//   bay()       this bay's players: { name, players: [{ name, index }] }
//   round()     what the host starts: { courseId, courseName, format,
//               handicaps, weather, teams }
//   tailscale   the Tailscale part (tailscale.js), or null
//   levels()    the levels card, for this bay's players (levelcard.js)
export class OnlinePanel {
  // roundOver(): this bay's online round over (app.js netAfter) - the
  // host's Back to the lobby, or who the others wait for - or null.
  // presets, match: the host's saved game settings and match over several
  // games (netlobby.js LobbyExtras).
  // shown(): it's just opened (app.js: the controls window brought
  // forward, where it is with the screens separate).
  // The Online tab's other sections (onlinetabs.js): ladders - { attach(el):
  // the online ladders drawn into el, waiting(): how many wait on them };
  // seasons - { attach(el): the Seasons drawn into el (netseasons.js),
  // lobbyHtml(v, g): the season's line in the lobby }; rules - { values():
  // the course's settings, set(key, value) }.
  // onShow(open): the top bar's Online tab told it's open or shut.
  constructor({ client, bay, round, tailscale = null, toast = () => {}, roundOver = () => null, presets = null, match = null, shown = () => {}, levels = null, ladders = null, seasons = null, postSeasons = null, rules = null, onShow = () => {} }) {
    Object.assign(this, { client, bay, round, tailscale, toast, roundOver, shown, levels, ladders, seasons, postSeasons, rules, onShow });
    // Which section's shown (onlinetabs.js ONLINE_TABS).
    this.tab = "play";
    // The ready check and countdown, Rematch, saved games, the match, the
    // QR code, each bay's connection, pause and rejoin (netlobby.js).
    this.extras = new LobbyExtras(this, { presets, match });
    this.found = null;
    this.finding = false;
    this.busy = false;
    // The host's teams for a team game, by player id (teamOf).
    this.teams = {};
    // What the host starts (PLAY_CHOICES).
    this.what = "course";
    this.el = document.createElement("div");
    this.el.className = "bay-help online-play";
    this.el.hidden = true;
    this.el.addEventListener("change", (e) => {
      // (A host rule: the course's setting, for the next game hosted.)
      const rule = e.target.closest("select[data-rule]");
      if (rule) return this.rules?.set(rule.dataset.rule, rule.value);
      const what = e.target.closest("select[data-what]");
      if (what) {
        this.what = what.value;
        this.startAnyway = false;
        return this.render();
      }
      const sel = e.target.closest("select[data-team]");
      if (!sel) return;
      this.teams[sel.dataset.team] = Number(sel.value);
      this.render();
    });
    this.el.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-act]");
      if (b) this.act(b.dataset.act, b.dataset);
      else if (e.target === this.el) this.show(false);
    });
    document.body.appendChild(this.el);
    // A message about what was just done goes once the game moves on
    // (hosting -> started -> ended).
    let stage = "";
    client.onChange((v) => {
      const now = `${v.mode}|${!!v.game?.started}|${!!v.game?.ended}`;
      if (now !== stage) {
        stage = now;
        this.message = null;
      }
      // (Not the ladders' section: its boxes keep what's being typed. Nor
      // the seasons by post's, on Seasons: only the season played
      // together's part follows the game.)
      if (this.open && this.tab === "seasons" && this.el.querySelector(".online-postseasons")) this.seasons?.render();
      // (Nor while a name or code is being typed in it: drawn with the
      // next change after.)
      else if (this.open && this.tab !== "ladders" && !(this.el.contains(document.activeElement) && typingNow())) this.render();
      this.onShow(this.open);
    });
    tailscale?.onChange?.(() => this.open && this.render());
  }

  get open() {
    return !this.el.hidden;
  }

  // A friend's join link (netinvite.js): the panel open, the code typed in
  // - Join to press.
  joinWith(code) {
    this.pendingCode = code;
    this.message = { text: "A friend's game - press Join to play", bad: false };
    this.show(true, "play");
  }

  // This bay's players for hosting or joining, looked up as the panel
  // opens - their handicaps come from their stats, which take a moment (on
  // a phone longer: the owner, "it took a little while for it to show up
  // on the other screen"), so pressing Host or Join doesn't wait on them.
  playersSoon() {
    if (!this.baying || Date.now() - this.baying.at > 30000) this.baying = { at: Date.now(), got: Promise.resolve().then(() => this.bay()).catch(() => null) };
    return this.baying.got;
  }

  // ...and when Host or Join is pressed: as looked up, or - still coming
  // after a moment (BAY_WAIT_MS) - without their handicaps, sent on to the
  // game as they come (before the start).
  async playersNow() {
    const full = this.playersSoon();
    const got = await Promise.race([full, new Promise((r) => setTimeout(() => r(null), BAY_WAIT_MS))]);
    if (got) return got;
    const quick = await this.bay({ quick: true });
    full.then((b) => {
      const v = this.client.view;
      if (b && v.mode !== "off" && v.bay && !v.game?.started) this.client.send({ type: "bay", bay: v.bay, ...b });
    });
    return quick;
  }

  // This bay's players sent again before the start (a level changed: their
  // level and the handicap that goes with it).
  async refreshBay() {
    const v = this.client.view;
    if (v.mode === "off" || !v.bay || v.game?.started) return;
    this.baying = null;
    const b = await this.playersSoon();
    const now = this.client.view;
    if (b && now.mode !== "off" && now.bay && !now.game?.started) this.client.send({ type: "bay", bay: now.bay, ...b });
  }

  // By code only, through the relay (the phone app): no home network to
  // look on or join by address, no Tailscale.
  get byCodeOnly() {
    return this.client.view.lan === false;
  }

  // Each player's team, in the game's players' order: as the host set
  // them, else a team to each bay (two houses, two teams), else the first
  // half against the second.
  teamOf(g = this.client.view.game) {
    const players = g?.players ?? [];
    const bays = [...new Set(players.map((p) => p.bay))];
    const byBay = bays.length >= 2 && bays.length <= MAX_TEAMS;
    const def = defaultTeams(players.length);
    return cleanTeams(
      players.map((p, i) => this.teams[p.id] ?? (byBay ? bays.indexOf(p.bay) : def[i])),
      players.length,
    );
  }

  // Shown or not; tab, the section to show (else the one last shown -
  // Play now with a game going).
  show(on = true, tab = null) {
    this.el.hidden = !on;
    if (tab) this.tab = onlineTab(tab);
    if (on) this.belowTab();
    this.onShow(on);
    if (on) {
      // (Their handicaps looked up now, for Host or Join: playersNow.)
      if (this.client.view.mode === "off") this.playersSoon();
      this.render();
      if (!this.byCodeOnly) {
        this.tailscale?.refresh?.();
        if (this.client.view.mode === "off" && !this.found) this.act("find");
      }
      this.shown();
    }
  }

  // The top bar stays in reach while it's open - it's a tab up there:
  // Online shuts it, the modes switch away - so it opens below the Online
  // tab's row (where the screens are separate, the controls window's).
  belowTab() {
    const el = this.el;
    const win = el.ownerDocument.defaultView;
    el.style.top = "";
    const tab = el.ownerDocument.getElementById("online-tab");
    if (!win || !tab?.checkVisibility?.()) return;
    const r = tab.getBoundingClientRect();
    if (r.bottom <= 0 || r.bottom > win.innerHeight / 3) return;
    const was = parseFloat(win.getComputedStyle(el).top) || 0;
    el.style.top = `${Math.round(Math.max(was, r.bottom + 4))}px`;
  }

  key(e) {
    if (!this.open) return false;
    if (e.key === "Escape") {
      this.show(false);
      e.preventDefault();
      return true;
    }
    // Typing an address: the keys are the box's.
    return e.target?.closest?.(".online-play") != null;
  }

  async act(what, data = {}) {
    if (this.busy && what !== "close") return;
    const say = (t, bad = false) => {
      this.message = { text: t, bad };
      this.render();
    };
    try {
      if (what === "close") return this.show(false);
      if (what === "levels") return this.levels?.();
      if (what === "tab") {
        this.tab = onlineTab(data.tab);
        return this.render();
      }
      if (what === "find") {
        this.finding = true;
        this.render();
        this.found = await this.client.find().catch(() => []);
        this.finding = false;
        return;
      }
      this.busy = true;
      if (await this.extras.act(what, data, say)) return;
      if (what === "host") {
        await this.client.host(await this.playersNow());
        say("Hosting - other bays can join now. Start the round when everyone's in.");
      } else if (what === "join-code") {
        const code = this.el.querySelector("#online-code").value.trim();
        if (!code) return say("Type the code the host's screen shows", true);
        this.message = { text: "Joining...", bad: false };
        this.render();
        await this.client.joinCode(code, await this.playersNow());
        say("Joined - the host starts the round.");
      } else if (what === "join" || what === "join-address") {
        const address = what === "join" ? data.address : this.el.querySelector("#online-address").value.trim();
        if (!address) return say("Type the host's address first", true);
        await this.client.join(address, await this.playersNow());
        say("Joined - the host starts the round.");
      } else if (what === "start") {
        // The relay's free allowance nearly used up: said first, and started
        // on a second press.
        const v = this.client.view;
        if (lowAllowance(v) && !this.startAnyway) {
          this.startAnyway = true;
          return say("Online play by code is nearly out of today's free allowance - see above. Press Start anyway to play knowing it might stop.", true);
        }
        this.startAnyway = false;
        // (Counted down on every bay first: netlobby.js.)
        await this.extras.start(this.round());
        say("Starting - counting down on every bay...");
      } else if (what === "drop") {
        await this.client.send({ type: "drop", player: data.player });
      } else if (what === "lobby") {
        // Everyone back to the lobby: the game stops on every bay, and the
        // host picks the next (sim/netgame.mjs lobby).
        const r = await this.client.send({ type: "lobby" });
        if (r?.ok === false) return say(r.error, true);
        say("Game stopped - everyone's back in the lobby. Pick the next game and Start.");
      } else if (what === "leave") {
        await this.client.leave();
        this.startAnyway = false;
        say("Left the game");
      } else if (what.startsWith("ts-")) {
        const out = await this.tailscale?.act(what.slice(3), data);
        if (out) say(out);
      }
    } catch (err) {
      say(err.message, true);
    } finally {
      this.busy = false;
      // (The games found only show on Play now: another section - a form
      // being filled in on Ladders or Seasons - isn't drawn again for them.)
      if (what !== "find" || this.tab === "play") this.render();
    }
  }

  render() {
    const v = this.client.view;
    const g = v.game;
    const dot = (p) => `<span class="player-dot" style="background:${esc(p.colour)}"></span>`;
    // A team game: the host sets the teams before the start; after it,
    // everyone sees them.
    const fmt = g?.started ? ((g.round.mode ?? "course") === "course" ? g.round.format : null) : this.round().format;
    const teamed = g && usesTeams(fmt, g.players.length);
    const teamOf = g?.started ? (g.round.teams ?? []) : this.teamOf(g);
    const teamBox = (p, i) => {
      if (!teamed) return "";
      if (v.mode === "host" && !g.started)
        return ` <select data-team="${esc(p.id)}" title="${esc(p.name)}'s team">${TEAM_LETTERS.slice(0, MAX_TEAMS).map((l, t) => `<option value="${t}" ${teamOf[i] === t ? "selected" : ""}>Team ${l}</option>`).join("")}</select>`;
      return Number.isInteger(teamOf[i]) ? ` <span class="muted small">Team ${TEAM_LETTERS[teamOf[i]]}</span>` : "";
    };
    const teamLine = teamed
      ? `<p class="small muted">${teamsOf(teamOf)
          .map((t) => `Team ${TEAM_LETTERS[t.id]}: ${esc(teamName(t.members, g.players.map((p) => p.name)))}`)
          .join(" · ")}${fmt === "scramble" ? " - the first named on each team is its captain, who picks the ball" : ""}</p>`
      : "";
    // The easiest level anyone plays at: the round's rule once it's
    // started, the host's for the next game before (sim/netgame.mjs rules).
    const floor = !g ? null : levelFloor(cleanMadeUp(g.started ? g.round?.madeUp : (v.mode === "host" ? this.round() : g.lobbyRules)?.madeUp));
    const players = (g?.players ?? [])
      .map((p, i) => {
        const bay = g.bays[p.bay];
        const here = p.bay === v.bay;
        const conn = here ? "this bay" : bay?.online ? `${esc(bay.name)}, connected` : `${esc(bay?.name ?? "")}, <span class="worse">not connected</span>`;
        // Its carry adjustment (Menu -> Ball flight), for everyone to see -
        // set aside when the host has everyone on A² Golf's own.
        const carry = carryPercentWords(bay?.carry) && !(g.started && cleanCarryRule(g.round?.carry) === "own") ? `, <b>${esc(carryPercentWords(bay.carry))}</b>` : "";
        const drop = v.mode === "host" && g.started && !here && !bay?.online && !p.dropped ? ` <button data-act="drop" data-player="${esc(p.id)}">Carry on without ${esc(p.name)}</button>` : "";
        // Their level with the mouse, a finger or a controller (none on a
        // launch monitor), coloured as on the swing pad - lifted by the
        // host's rule, said so.
        const tag = p.level ? levelTag(p.level, floor) : null;
        const lv = tag ? levelFacts(tag.id) : null;
        const level = lv ? ` <span class="lv-tag" data-forgive="${lv.forgive}" title="${esc(`${tag.words}: ${lv.line}`)}">${esc(lv.name)}</span>${tag.raised ? ` <span class="muted small">(the host's rule)</span>` : ""}` : "";
        return `<li>${dot(p)}<b>${esc(p.name)}</b>${p.index != null ? ` <span class="muted">(${esc(p.index)})</span>` : ""}${level}${teamBox(p, i)} <span class="muted small">${conn}${carry}${p.dropped ? " - left the game" : ""}</span>${this.extras.playerExtras(v, g, p)}${drop}</li>`;
      })
      .join("");
    const lan = !this.byCodeOnly;
    let body = "";
    if (v.mode === "off") {
      const r = this.round();
      const found = this.finding
        ? `<p class="muted">Looking for games on your home network${this.tailscale ? " and over Tailscale" : ""}...</p>`
        : this.found?.length
          ? `<ul class="online-found">${this.found
              .map(
                (f) =>
                  `<li><b>${esc(f.host)}</b> <span class="muted small">${esc((Array.isArray(f.players) ? f.players : []).join(", "))}${f.started ? ` - playing ${esc(f.course ?? "")}` : ""} - ${f.via === "tailscale" ? `over Tailscale (${esc(f.peerName ?? f.address)})` : "home network"}</span> ${
                    f.started || f.room < 1 ? `<span class="muted small">${f.started ? "started" : "full"}</span>` : `<button class="primary" data-act="join" data-address="${esc(`${f.address}:${f.port}`)}">Join</button>`
                  }</li>`,
              )
              .join("")}</ul>`
          : this.found
            ? `<p class="small muted">No games found. Is the host's game open (Host a game), and are you on the same home network - or both on Tailscale?</p>`
            : "";
      const byCode = v.relay
        ? `<p class="small">Type the code on the host's screen:</p>
            <div class="online-field"><input id="online-code" class="online-code-input" type="text" maxlength="8" placeholder="K7Q-2MX" autocomplete="off" spellcheck="false" value="${esc(this.pendingCode ? showCode(this.pendingCode) : "")}"><button class="primary" data-act="join-code">Join</button></div>
            ${lan ? '<h4 class="online-sub">On your home network</h4>' : ""}`
        : lan
          ? ""
          : '<p class="small worse">Joining needs the internet - this phone can\'t reach online play just now.</p>';
      const nearby = lan
        ? `${found}
            <div class="online-field"><button data-act="find">${this.found ? "Look again" : "Find games"}</button></div>
            <p class="small">Or type the host's address:</p>
            <div class="online-field"><input id="online-address" type="text" placeholder="192.168.1.20 or alex-pc" size="22"><button data-act="join-address">Join</button></div>`
        : "";
      body = `
        ${this.extras.rejoinHtml(v)}
        <div class="online-cols">
          <section class="online-card">
            <h3>Host a game</h3>
            <p class="small">Your players (the course panel's) play here; up to eight players in all, across up to eight ${lan ? "bays" : "phones and bays"}. ${v.relay ? "You get a code to give your friends. " : ""}When everyone's in you start a round on <b>${esc(r.courseName ?? "the course picked")}</b>, ${esc(r.formatName ?? "stroke play")} - or the putting or chipping challenge, or one of the Challenges, everyone playing the same.</p>
            <div class="online-field"><button class="primary" data-act="host">Host a game</button></div>
          </section>
          <section class="online-card">
            <h3>Join a game</h3>
            ${byCode}
            ${nearby}
          </section>
        </div>`;
    } else {
      const host = v.mode === "host";
      const hostName = g?.bays?.[g.host]?.name ?? "the host";
      const over = g?.started && !g.ended ? this.roundOver() : null;
      const lost = v.mode === "guest" && !v.connected ? ` - <span class="worse">lost the host, trying again...</span>` : "";
      const state = !g
        ? ""
        : g.ended
          ? "The host has ended the game."
          : g.started
            ? over
              ? `${host ? "The round's over - back to the lobby to pick the next game, everyone with you" : `The round's over. ${esc(over.words)}`}${lost}.`
              : `Playing ${esc(g.round.course?.name ?? g.round.name ?? "")}${lost}.`
            : host
              ? g.games
                ? "Back in the lobby, everyone still in. Pick the next game and Start."
                : "Waiting for players to join. Start when everyone's in."
              : v.connected
                ? g.games
                  ? `Back in the lobby with ${esc(hostName)}. Waiting for the host to start the next game.`
                  : `Joined ${esc(hostName)}. Waiting for the host to start.`
                : `<span class="worse">Connecting to ${esc(hostName)}...</span>`;
      const out = v.usage?.level === "out";
      const codeBox =
        host && v.code
          ? out
            ? `<div class="online-warn small"><b>No code today:</b> playing by code has used up today's free allowance - it's back at <b>${esc(backAt(v.usage))}</b>.${lan ? " Friends on your home network, or over Tailscale, can still join." : ""}</div>`
            : `<div class="online-code-row"><div class="online-code"><span class="muted small">Friends join with the code</span><b>${esc(showCode(v.code))}</b><span class="small ${v.relayConnected ? "muted" : "worse"}">${v.relayConnected ? "Anywhere: they press Join and type it in." : "Connecting to the relay..."}</span></div>${this.extras.qrHtml(v)}</div>`
          : "";
      const where = !host
        ? ""
        : !lan
          ? codeBox
          : `${codeBox}<p class="small muted">${v.code ? "On the same home network they can also" : "Others"} find it with <b>Find games</b>: on your home network straight away${v.code ? "" : ", from another house over Tailscale"}. Or they type one of this PC's addresses: ${(v.host?.addresses ?? [])
            .map((a) => `<b>${esc(a.address)}</b> (${a.kind === "tailscale" ? "Tailscale" : "home network"})`)
            .join(", ") || "-"}.</p>`;
      const r = this.round();
      const buttons = [
        host && !g?.started ? this.extras.startButton(v, g, `<button class="primary" data-act="start" ${g?.players?.length ? "" : "disabled"}>${this.startAnyway && lowAllowance(v) ? "Start anyway" : "Start"} - ${esc(r.label ?? "")}</button>`) : "",
        this.extras.buttons(v, g),
        // Each player's level, changed before the start (levelcard.js).
        this.levels && !g?.started ? `<button data-act="levels" title="${esc(TRADE)}">Levels...</button>` : "",
        host && g?.started ? (over ? `<button class="primary" data-act="lobby">Back to the lobby</button>` : `<button data-act="lobby">Stop the game - everyone back to the lobby</button>`) : "",
        `<button data-act="leave">${host ? "Stop hosting" : "Leave the game"}</button>`,
      ].join(" ");
      const choose =
        host && !g?.started
          ? `<p><label>Play <select data-what>${PLAY_CHOICES.map(([value, label]) => `<option value="${value}" ${value === this.what ? "selected" : ""}>${esc(label)}</option>`).join("")}</select></label></p>`
          : "";
      // The game's own rules (the course panel's) - and the host's, as it
      // sent them, for everyone who's joined (the easiest level anyone
      // plays at among them).
      const rules = g?.started ? "" : host ? (r.rules ? `<p class="small muted">Rules: ${esc(r.rules)} - <button data-act="tab" data-tab="rules">Host rules</button></p>` : "") : g?.lobbyRules ? `<p class="small muted">The host's rules: ${esc(lobbyRulesWords(g.lobbyRules))}.</p>` : "";
      body = `<p class="online-state">${state}</p>${this.extras.pausedHtml(g)}${allowanceNote(v, g, lan)}<ul class="online-players">${players}</ul>${teamLine}${this.extras.readyHtml(v, g)}${this.extras.matchHtml(g)}${this.seasons?.lobbyHtml?.(v, g) ?? ""}${choose}${rules}${this.extras.hostToolsHtml(v, g)}${where}<div class="row-buttons">${buttons}</div>`;
    }
    // (The allowance used up is said above, where the code would be.)
    const error = v.usage?.level === "out" && v.mode === "host" && /allowance/.test(v.error ?? "") ? null : v.error;
    const msg = this.message ? `<p class="menu-status ${this.message.bad ? "bad" : ""}">${esc(this.message.text)}</p>` : error ? `<p class="menu-status bad">${esc(error)}</p>` : "";
    const tabs = tabsHtml(this.tab, { ladders: this.ladders?.waiting?.() ?? 0, seasons: this.postSeasons?.waiting?.() ?? 0 });
    // (A header: the title, the sections and the ×; Esc shuts it too. The
    // owner, 3 November 2026, of how it looked: "Massive text, just not
    // very organized" - one size of text, the sections in cards.)
    const head = `<header class="online-head"><h2>Online</h2>${tabs}<button class="online-x" data-act="close" title="Close (Esc)" aria-label="Close">×</button></header>`;
    // The online ladders, and the host's rules (onlinetabs.js).
    if (this.tab === "ladders") {
      this.el.innerHTML = `<div class="bay-help-box online-box">${head}<div class="online-body"><p class="online-intro">Match ladders against other people online: live (both playing at once, as an online game) or by post (each plays the same round when they like). Ladders at the bay, or against made-up golfers, are on the Course tab.</p><div class="online-card online-ladders"></div></div></div>`;
      this.ladders?.attach(this.el.querySelector(".online-ladders"));
      return;
    }
    if (this.tab === "seasons") {
      this.el.innerHTML = `<div class="bay-help-box online-box">${head}<div class="online-body"><p class="online-intro">Seasons against other people online. By post: each event stays open for days and everyone plays its round when they like - invite anyone with its link. Played together: its events played one at a time as games from the lobby, everyone in the game at once. A season on your own, against made-up golfers, is on the Course tab.</p><div class="online-card online-postseasons"></div><div class="online-card"><h3>Played together</h3><div class="online-seasons"></div></div></div></div>`;
      this.postSeasons?.attach(this.el.querySelector(".online-postseasons"));
      this.seasons?.attach(this.el.querySelector(".online-seasons"));
      return;
    }
    if (this.tab === "rules") {
      this.el.innerHTML = `<div class="bay-help-box online-box">${head}<div class="online-body">${rulesHtml(this.rules?.values?.() ?? {})}</div></div>`;
      return;
    }
    this.el.innerHTML = `<div class="bay-help-box online-box">
      ${head}
      <div class="online-body">
        <p class="online-intro">Everyone plays the same course at the same time, ${lan ? "each bay with its own launch monitor" : "each on their own phone or golf simulator"}. The balls, scores and the game go between the bays; everyone goes on to the next hole together, once all have finished this one and are ready. The host can stop the game and bring everyone back here for the next.</p>
        ${v.mode === "off" ? body : `<section class="online-card online-lobby">${body}</section>`}
        ${msg}
        ${this.tailscale && lan ? `<details class="online-ts"><summary>Playing from other houses over Tailscale</summary>${this.tailscale.html()}</details>` : ""}
      </div>
    </div>`;
  }
}

// ---- The relay's free daily allowance (relay/usage.mjs) -------------------------

// When it's back: midnight UTC, in this PC's own time.
function backAt(usage) {
  if (!usage?.resetsAt) return "midnight UTC";
  return new Date(usage.resetsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Nearly used up, with another bay in the game (on its own a bay has
// nothing to lose).
function lowAllowance(v) {
  return v.usage?.level === "low" && Object.keys(v.game?.bays ?? {}).length > 1;
}

// What the host and the bays that joined are told when it's low - before
// the round, and if the relay's lost during it.
function allowanceNote(v, g, lan = true) {
  if (v.usage?.level !== "low" || g?.ended) return "";
  const lost = g?.started && (v.mode === "host" ? v.relayConnected === false : !v.connected);
  if (lost) return `<div class="online-warn small">The relay may have run out of today's free allowance - if so the game can't carry on between houses until it's back at <b>${esc(backAt(v.usage))}</b>. Still trying...</div>`;
  if (g?.started) return "";
  const n = v.usage.roundsLeft;
  const left = !Number.isFinite(n) ? "" : n < 1 ? " (this is about the last game there's room for today)" : ` (room for about ${n} more game${n === 1 ? "" : "s"} today, across everyone playing)`;
  return `<div class="online-warn small"><b>Heads up:</b> online play by code is nearly out of today's free allowance${left}. If it runs out, a game started now <b>will stop part way through the round</b> for the bays joined by code - it's back at <b>${esc(backAt(v.usage))}</b>.${lan ? " Bays on the same home network, or over Tailscale, aren't affected." : ""}</div>`;
}
