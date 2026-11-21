// The Challenges: a mode of its own, with short games to play for a score,
// alone or with up to three friends taking turns hole by hole.
//
// This is the shell every game shares: picking a game (big cards over the
// picture, 1 2 3, or the side panel), the players (the same list as the
// course), whose turn it is, the scoreboard, personal bests, the results at
// the end with a celebration to suit, and the bay view overlay. The rules
// live in sim/challenges.mjs; each game is its own file.
//
// A game is an object made with `new Game(host)`, with:
//   id, option: { label, choices: { value: name }, fallback }
//   start(option, seed)  a new game: everyone gets the same holes from seed
//   beginTurn()          set up host.match's hole for its player
//   onShot(entry)        a shot from the launch monitor
//   update(dt)           move the ball and the camera
//   next()               N: cut a wait short
//   testShot()           a made-up shot for this spot, or null
//   stepClub(delta)      up / down a club; returns the club
//   club                 the club to send to the connector
//   focus                where a celebration goes (a THREE.Vector3)
//   overlay()            { title, note, stats } for the bay view and panel
//   sideHtml()           the ladder or progress shown over the picture
//   preview()            some scenery to show behind the picker
//   share(score)         0-1, how good a score is (games with no maximum)
//   atRest()             the game's over: a quiet picture for the results
//   stop()               the game's been abandoned
//   clubs                the clubs ↑ ↓ goes through (a spoken club must be one)
// and it calls host.turnOver(points) when a player's hole is done,
// host.changed() when anything on show changes, host.toast(text, ms),
// host.sendClub(), and host.record(shot, extra) once each shot has
// finished, for the player's stats (recorder.js's onRecord, with the
// player, game and hole filled in here).

import * as THREE from "three";
import { GAMES, gameById, Match, results, bestKey, recordChallengeBest, challengeCelebration, winnerLine, shotGame, gameRecords } from "./sim/challenges.mjs";
import { MAX_PLAYERS, PLAYER_COLOURS, defaultName, playerNames } from "./sim/players.mjs";
import { guestFor } from "./sim/profiles.mjs";
import { newSeed } from "./sim/course.mjs";
import { addEnvironment } from "./look/environment.js";
import { HIGH } from "./look/quality.js";
import { Celebration } from "./celebrate.js";
import { Sounds } from "./sounds.js";
import { audio } from "./audio/engine.js";
import { loadSetting, saveSetting, esc } from "./util.js";
import { fullText } from "./sim/gametext.mjs";
import { clubName } from "./bay.js";
import { newId } from "./recorder.js";
import { ApproachLadder } from "./approachladder.js";
import { DrivingChallenge } from "./drivingchallenge.js";
import { ChipLadder } from "./chipladder.js";
import { ApproachChallenge } from "./approachchallenge.js";
import { warmUp } from "./look/warmup.js";
import { fitLens } from "./sim/upright.mjs";

export class ChallengesMode {
  // players: { get() -> names, set(names) } - the course's players list,
  // shared so friends are typed in once. rangeDrives: () -> the yards of
  // this session's driver shots on the range (for the driving challenge).
  constructor(panel, renderer, view, { players, rangeDrives = () => [] }) {
    this.panel = panel;
    this.view = view;
    this.renderer = renderer;
    this.playersList = players;
    this.rangeDrives = rangeDrives;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.25, 6000);
    this.world = new THREE.Group();
    this.scene.add(this.world);
    this.light = addEnvironment(this.scene, renderer, { shadowSize: 60 }).light;
    this.settings = loadSetting("challenges", { game: "approach", options: {} });
    this.onChange = () => {};
    this.onToast = () => {};
    this.onClub = () => {};
    this.sounds = new Sounds();
    this.celebration = new Celebration({ view, canvas: renderer.domElement, scene: this.scene, sounds: this.sounds, high: HIGH });
    this.celebration.onBannerGone = () => this.renderOverlays();
    // "picker", "playing" or "results".
    this.state = "picker";
    this.match = null;
    this.game = null;
    this.isActive = false;

    // The games; a card for any not built yet would say it's on the way.
    this.games = {};
    for (const Game of [ApproachLadder, DrivingChallenge, ChipLadder, ApproachChallenge]) {
      const g = new Game(this);
      this.games[g.id] = g;
    }

    // Over the picture, in either view: the picker's cards, the ladder, the
    // results.
    this.pickerEl = this.overlayDiv("challenge-picker");
    this.sideEl = this.overlayDiv("challenge-side");
    this.resultsEl = this.overlayDiv("challenge-results");
    this.pickerEl.addEventListener("click", (e) => this.pickerClick(e));
    this.resultsEl.addEventListener("click", (e) => {
      const act = e.target.closest("button")?.dataset.act;
      if (act === "again") this.start(this.gameId);
      if (act === "pick") this.showPicker();
    });

    this.buildPanel();
  }

  overlayDiv(cls) {
    const el = document.createElement("div");
    el.className = cls;
    el.hidden = true;
    this.view.appendChild(el);
    return el;
  }

  // ---- Players --------------------------------------------------------------------

  get players() {
    return playerNames(this.playersList.get());
  }
  get multi() {
    return (this.match?.players.length ?? this.players.length) > 1;
  }

  // ---- The chosen game and its option ---------------------------------------------

  get gameId() {
    return this.settings.game in this.games ? this.settings.game : "approach";
  }
  optionOf(id) {
    const o = this.games[id]?.option;
    if (!o) return null;
    const v = this.settings.options?.[id];
    return v in o.choices ? v : o.fallback;
  }
  setOption(id, value) {
    this.settings.options = { ...this.settings.options, [id]: value };
    saveSetting("challenges", this.settings);
    this.render();
  }
  bestFor(id, option = this.optionOf(id)) {
    return loadSetting("bests", {})[bestKey(id, option)] ?? null;
  }

  // ---- Playing --------------------------------------------------------------------

  // A new game of `id` for everyone in the players list. seed: its holes
  // (the same ones every time); left out, new ones.
  // Online, the host's option and seed, and this bay's players.
  start(id = this.gameId, { seed = null, option = null, players = null } = {}) {
    const game = this.games[id];
    if (!game) {
      this.onToast(`${gameById(id)?.name ?? "That game"} is on its way`, 2200);
      return;
    }
    this.game?.stop?.();
    this.celebration.clear();
    // A game of this bay's own (play again, another card) isn't the online one.
    if (!players) this.net = null;
    this.settings.game = id;
    saveSetting("challenges", this.settings);
    const meta = gameById(id);
    this.match = new Match((players ?? this.players.map((name, i, all) => ({ name, colour: this.colourOf(all, i) }))), meta.holes);
    this.game = game;
    // The games share one scene: only this one's ball shadow shows, and
    // it's this game's scenery that stays behind the cards afterwards.
    for (const g of Object.values(this.games)) if (g.ballShadow) g.ballShadow.mesh.visible = g === game;
    this.previewing = game;
    this.option = option != null && option in (game.option?.choices ?? {}) ? option : this.optionOf(id);
    // Every shot and the result go in each player's stats under this id.
    this.matchId = newId();
    this.seed = Number.isInteger(seed) ? seed : newSeed();
    this.state = "playing";
    game.start(this.option, this.seed);
    // The game's scenery, built as it starts: its shaders begun now, not at
    // its first frame (look/warmup.js).
    warmUp(this.renderer, this.scene, this.camera);
    this.beginTurn();
  }

  beginTurn() {
    this.game.beginTurn();
    this.sendClub();
    this.render();
  }

  // Online (netside.js NetTurns): the host's game, option and seed, so
  // every bay plays the same holes; this bay's players take turns as
  // usual, each hole's points going to every bay.
  startNet(net, colours = {}) {
    const u = net.setup;
    this.net = net;
    this.start(u.game, { seed: Number.isInteger(u.seed) ? u.seed : null, option: u.option ?? null, players: net.players.map((p, i) => ({ name: p.name, colour: colours[p.id] ?? PLAYER_COLOURS[i] })) });
  }

  stopNet() {
    this.net = null;
  }

  // The player whose turn it was has finished their hole.
  turnOver(points) {
    if (this.state !== "playing") return;
    if (this.net) this.net.scored(this.match.hole, points, "", this.net.players[this.match.playerIndex]);
    const { finished } = this.match.record(points);
    if (finished) this.finish();
    else this.beginTurn();
  }

  finish() {
    const meta = gameById(this.game.id);
    const rows = results(this.match);
    const key = bestKey(this.game.id, this.option);
    const saved = recordChallengeBest(loadSetting("bests", {}), key, rows, this.multi);
    if (saved.isBest) saveSetting("bests", saved.bests);
    // Each player's score, into their own stats' games and bests.
    const optionName = this.game.option.choices[this.option] ?? this.option;
    for (const g of gameRecords(meta, { id: this.matchId, key, optionName }, rows, this.multi)) this.onGame?.(g);
    // Their driver numbers may have moved on for next time.
    this.game.refreshStats?.();
    this.state = "results";
    this.lastResult = { rows, ...saved };
    const desc = challengeCelebration({
      game: meta,
      rows,
      max: meta.max,
      share: meta.max ? null : this.game.share?.(rows[0]?.total ?? 0),
      isBest: saved.isBest,
      previous: saved.previous,
      multi: this.multi,
    });
    this.onToast("", 0);
    this.game.atRest?.();
    const focus = this.game.focus ?? new THREE.Vector3();
    const away = new THREE.Vector3().subVectors(this.camera.position, focus);
    this.celebration.play(desc, { focus, camera: this.camera, away });
    this.render();
  }

  // Back to the cards. A game with shots played asks first.
  showPicker() {
    if (this.state === "playing" && this.match.turn + (this.game.shotsThisTurn ?? 0) > 0 && !confirm("Stop this game and pick another?")) return;
    this.game?.stop?.();
    this.celebration.clear();
    this.state = "picker";
    this.match = null;
    this.render();
  }

  pickerClick(e) {
    const t = e.target.closest("[data-act]");
    if (!t) return;
    const id = t.dataset.game;
    if (t.dataset.act === "option") return this.cycleOption(id);
    if (t.dataset.act === "play") this.start(id);
  }

  // A game's option, round its choices one at a time (a click on the card,
  // or Shift and its number).
  cycleOption(id) {
    const o = this.games[id]?.option;
    if (!o) return;
    const values = Object.keys(o.choices);
    const value = values[(values.indexOf(this.optionOf(id)) + 1) % values.length];
    this.setOption(id, value);
    this.onToast(`${gameById(id).name}: ${o.choices[value]}`, 1800);
  }

  // The background sound of the hole on show (course.js buildHoleScene,
  // which each game's scenery draws with).
  get soundscape() {
    return this.world.userData.soundscape ?? null;
  }

  onShot(entry) {
    if (this.state === "playing") return this.game.onShot(entry);
    this.onToast(this.state === "results" ? "N to play again, X to pick a game" : `Pick a game first: 1 to ${GAMES.length}`, 2200);
  }

  testShot() {
    if (this.state === "picker") {
      this.onToast(`Pick a game first: 1 to ${GAMES.length}`, 2200);
      return null;
    }
    return this.state === "playing" ? this.game.testShot() : null;
  }

  // The swing pad's two lines, from the game being played, where it has
  // them (the approach games: approachladder.js).
  swingGuide() {
    return this.state === "playing" ? (this.game.swingGuide?.() ?? null) : null;
  }

  // N: skip a wait while playing; play again from the results; start the
  // last game picked from the cards.
  next() {
    if (this.state === "playing") this.game.next();
    else this.start(this.gameId);
  }

  // Keys only this mode has: 1-4 pick a game from the cards (or the
  // results), Shift with 1-4 changes that game's option, X goes back to the
  // cards. True when the key was used.
  onKey(key, e = null) {
    // By the key's place, since Shift+1 types a different character on
    // different keyboards.
    const digit = /^Digit([1-9])$/.exec(e?.code ?? "");
    if (digit && e.shiftKey && this.state !== "playing") {
      const g = GAMES[Number(digit[1]) - 1];
      if (g) this.cycleOption(g.id);
      return !!g;
    }
    if (/^[1-9]$/.test(key) && this.state !== "playing") {
      const g = GAMES[Number(key) - 1];
      if (g) this.start(g.id);
      return !!g;
    }
    if (key === "x" && this.state !== "picker") {
      this.showPicker();
      return true;
    }
    return false;
  }

  stepClub(delta) {
    return this.state === "playing" ? this.game.stepClub(delta) : null;
  }
  // The game being played, by name (null at the cards or the results).
  get playing() {
    return this.state === "playing" ? gameById(this.game.id).name : null;
  }
  // The clubs the game in hand has (none before a game's started), and
  // taking one of them up, as ↑ ↓ would: for a spoken club.
  get clubs() {
    return this.state === "playing" ? this.game.clubs : [];
  }
  setClub(club) {
    if (this.state !== "playing" || !this.game.clubs.includes(club)) return;
    this.game.club = club;
    this.sendClub();
    this.changed();
  }

  // A shot has finished: into the stats of the player whose turn it is,
  // as part of this game and hole. A club check that says another club was
  // in hand picks that one up for the rest of the turn (the next shot of a
  // ladder is the same shot again), but not once the turn has moved on.
  record(shot, extra = {}) {
    const m = this.match;
    if (!m?.player) return;
    const meta = gameById(this.game.id);
    const turn = m.turn;
    const game = this.game;
    this.onRecord?.({
      ...shot,
      player: m.player.name,
      game: shotGame(meta, { id: this.matchId, key: bestKey(game.id, this.option), hole: m.hole }, extra),
      onFix: (club) => {
        if (this.state === "playing" && this.game === game && this.match === m && m.turn === turn && game.club !== club && game.clubs.includes(club)) {
          game.club = club;
          this.sendClub();
          this.changed();
        }
      },
    });
  }
  // ←/→, for a game that lets the aim move.
  nudgeAim(dir) {
    if (this.state === "playing") this.game.nudgeAim?.(dir);
  }
  // Between games, the program's club in hand (app.js: heldClub).
  get club() {
    return this.state === "playing" ? this.game.club : (this.heldClub?.() ?? "7I");
  }
  sendClub() {
    this.onClub(this.club);
  }
  toast(text, ms) {
    this.onToast(text, ms);
  }
  changed() {
    this.render();
  }

  update(dt) {
    if (this.state !== "picker" && this.game) this.game.update(dt);
    else this.previewing?.update?.(dt);
    this.camera.updateMatrixWorld();
    this.celebration.update(dt, this.camera);
  }

  resize(aspect) {
    // (A picture taller than it's wide - the phone held upright - with the
    // lens widened: sim/upright.mjs.)
    fitLens(this.camera, aspect);
  }

  // Scenery behind the cards built ahead, a step at a time in the quiet
  // moments of another mode (sim/idlework.mjs, app.js), so coming in for
  // the first time doesn't stop the picture to build it.
  prepareAhead(queue) {
    if (this.previewed || this.state !== "picker" || !queue) return;
    this.previewed = true;
    this.idleWork = queue;
    const game = this.games.approach;
    queue.add({
      id: "challenges-preview",
      steps: function* () {
        yield* game.previewSteps(true);
        this.previewing = game;
        warmUp(this.renderer, this.scene, this.camera);
      }.bind(this),
      failed: () => (this.previewed = false),
    });
  }

  setActive(on) {
    this.isActive = on;
    // (Built ahead but not finished: finished now.)
    if (on && this.idleWork?.has("challenges-preview")) this.idleWork.finish("challenges-preview");
    // Scenery behind the cards, built the first time it's needed rather
    // than slowing down the page opening.
    if (on && !this.previewed) {
      this.previewed = true;
      if (this.state === "picker") {
        this.games.approach.preview();
        this.previewing = this.games.approach;
        warmUp(this.renderer, this.scene, this.camera);
      }
    }
    if (!on) this.celebration.clear();
    // Each player's driver average from their stats, for the driving
    // challenge, looked up afresh on coming in (it's been added to since).
    if (on) this.games.driving?.refreshStats?.();
    this.renderOverlays();
  }

  // ---- What's on show -------------------------------------------------------------

  overlay() {
    if (this.state === "picker") return { title: "Challenges", note: `Pick a game: press 1 to ${GAMES.length}, or click one`, stats: [] };
    const quiet = this.celebration.showing;
    if (this.state === "results") {
      return { title: quiet ? "" : "Game over", note: `${gameById(this.game.id).name} - N to play again, X to pick a game`, stats: [] };
    }
    const o = this.game.overlay();
    const p = this.match.player;
    return {
      ...o,
      club: this.game.club,
      // Whose turn, by the club, only with friends.
      player: this.multi && p ? { name: p.name, colour: p.colour } : null,
      title: quiet ? "" : o.title,
    };
  }

  render() {
    this.renderOverlays();
    this.renderPanel();
    this.onChange();
  }

  renderOverlays() {
    const on = this.isActive;
    this.pickerEl.hidden = !on || this.state !== "picker";
    if (!this.pickerEl.hidden) this.pickerEl.innerHTML = this.pickerHtml();
    const side = on && this.state === "playing" ? this.game.sideHtml?.() : "";
    this.sideEl.hidden = !side;
    this.sideEl.innerHTML = side || "";
    // The results wait for the banner to go, so the two don't sit on top of
    // each other.
    this.resultsEl.hidden = !on || this.state !== "results" || this.celebration.showing;
    if (!this.resultsEl.hidden) this.resultsEl.innerHTML = this.resultsHtml();
    this.onChange();
  }

  pickerHtml() {
    const cards = GAMES.map((g, i) => {
      const ready = !!this.games[g.id];
      const opt = ready ? this.games[g.id].option : null;
      const value = ready ? this.optionOf(g.id) : null;
      const best = ready ? this.bestFor(g.id) : null;
      return `<div class="challenge-card${ready ? "" : " soon"}">
        <div class="challenge-key">${i + 1}</div>
        <h2>${esc(g.name)}</h2>
        <p>${esc(g.rules)}</p>
        ${opt ? `<button class="challenge-option" data-act="option" data-game="${g.id}" title="Click, or Shift+${i + 1}, to change">${esc(opt.label)}: <b>${esc(opt.choices[value])}</b> <span class="challenge-change">› Shift+${i + 1}</span></button>` : ""}
        ${ready && this.games[g.id].cardNote ? `<div class="challenge-note">${esc(this.games[g.id].cardNote())}</div>` : ""}
        <div class="challenge-best">${ready ? `Personal best <b>${best ? `${best.score}${g.max ? ` / ${g.max}` : ""}` : "-"}</b>${best?.name ? ` (${esc(best.name)})` : ""}` : "Coming soon"}</div>
        ${ready ? `<button class="primary" data-act="play" data-game="${g.id}">Play (${i + 1})</button>` : ""}
      </div>`;
    }).join("");
    const names = this.players;
    const who = names.length > 1 ? `Playing: ${names.map(esc).join(", ")}` : "One player";
    return `<div class="challenge-cards">${cards}</div>
      <p class="challenge-hint">${who} - players are set in the side panel (the same list as the course). Shift and a game's number changes its option.</p>`;
  }

  resultsHtml() {
    const r = this.lastResult;
    const meta = gameById(this.game.id);
    const holes = meta.holes;
    const head = `<tr><th></th>${Array.from({ length: holes }, (_, i) => `<th>${i + 1}</th>`).join("")}<th>Total</th></tr>`;
    // A game can add a word by each player's name (the driving challenge:
    // the average their holes were drawn to).
    const note = (i) => {
      const t = this.game.resultNote?.(i);
      return t ? ` <small class="muted">${esc(t)}</small>` : "";
    };
    const rows = r.rows
      .map(
        (p) => `<tr><td class="player-name">${this.multi ? `<span class="player-dot" style="background:${esc(p.colour)}"></span>${esc(p.name)}` : "Score"}${note(p.index)}</td>` +
          p.scores.map((s) => `<td>${s ?? "-"}</td>`).join("") + `<td><b>${p.total}</b></td></tr>`,
      )
      .join("");
    const who = r.isBest && r.name ? ` for ${esc(r.name)}` : "";
    const best = r.isBest
      ? `<p class="points">New personal best${who}${r.previous != null ? ` - was ${r.previous}` : ""}!</p>`
      : `<p class="muted">Personal best ${r.previous ?? "-"}${meta.max ? ` / ${meta.max}` : ""}</p>`;
    return `<div class="challenge-results-box">
      <h2>${esc(meta.name)}</h2>
      <p class="muted">${esc(this.games[this.game.id].option.choices[this.option] ?? "")}</p>
      ${this.multi ? `<p class="challenge-winner">${esc(winnerLine(r.rows))}</p>` : ""}
      <table class="scorecard">${head}${rows}</table>
      ${best}
      <div class="row-buttons"><button class="primary" data-act="again">Play again (N)</button><button data-act="pick">Pick a game (X)</button></div>
    </div>`;
  }

  // ---- Side panel -----------------------------------------------------------------

  buildPanel() {
    this.panel.innerHTML = `
      <section class="tabs" id="ch-games" data-cc="head">${GAMES.map((g) => `<button data-game="${g.id}">${esc(g.name)}</button>`).join("")}</section>
      <section class="settings">
        <p id="ch-rules" class="describe"></p>
        <label id="ch-option-wrap"><span id="ch-option-label"></span> <select id="ch-option"></select></label>
        <div class="players">
          <div class="players-head">Players <small class="muted">(shared with the course)</small></div>
          <div id="ch-players"></div>
          <button id="ch-add-player">Add player</button>
        </div>
        <div class="players" id="ch-extra" hidden></div>
        <div class="row-buttons">
          <button id="ch-start" class="primary" data-head>Start (N)</button>
          <button id="ch-pick" data-head>Pick a game (X)</button>
        </div>
      </section>
      <section class="putt-result" id="ch-status" data-cc="off"></section>
      <section class="numbers" id="ch-numbers" data-cc="off"></section>
      <section>
        <h3>Scores</h3>
        <div id="ch-card"></div>
      </section>
      <section>
        <h3>Personal bests</h3>
        <table class="clubs" id="ch-bests"></table>
      </section>
      <section class="settings">
        <label class="check" title="The celebration sounds: fanfares and chimes for a hole's score (A turns all the game's sound on and off)"><input type="checkbox" id="ch-sounds" ${audio.settings.celebrations ? "checked" : ""}> Sounds</label>
      </section>`;
    const $ = (id) => this.panel.querySelector(id);
    for (const btn of this.panel.querySelectorAll("#ch-games [data-game]")) {
      btn.addEventListener("click", () => {
        this.settings.game = btn.dataset.game;
        saveSetting("challenges", this.settings);
        this.render();
      });
    }
    $("#ch-option").addEventListener("change", () => this.setOption(this.settings.game, $("#ch-option").value));
    $("#ch-start").addEventListener("click", () => {
      if (this.state === "playing" && this.match.turn + (this.game.shotsThisTurn ?? 0) > 0 && !confirm("Stop this game and start again?")) return;
      this.start(this.settings.game);
    });
    $("#ch-pick").addEventListener("click", () => this.showPicker());
    $("#ch-add-player").addEventListener("click", () => {
      const names = this.players;
      // A guest, as on the course (sim/profiles.mjs).
      if (names.length < MAX_PLAYERS) this.changePlayers([...names, guestFor(names) ?? defaultName(names.length)]);
    });
    // The celebration sounds on and off: the same setting as the Sound
    // panel's Celebrations (A is all the sound).
    $("#ch-sounds").addEventListener("change", () => audio.set("celebrations", $("#ch-sounds").checked));
    audio.watch((sound) => ($("#ch-sounds").checked = sound.celebrations));
    this.renderPanel();
  }

  // Adding or removing a player mid-game starts it again (asking first);
  // a new name just changes the name.
  changePlayers(names) {
    const live = this.state === "playing";
    if (live && this.match.turn + (this.game.shotsThisTurn ?? 0) > 0 && !confirm("Stop this game and start again with these players?")) return this.renderPanel();
    this.playersList.set(names);
    if (live) this.start(this.game.id);
    else this.render();
  }
  // A player's colour: their profile's (the list's colours, app.js), else
  // their place's.
  colourOf(names, i) {
    return this.playersList.colours?.(names)?.[i] ?? PLAYER_COLOURS[i];
  }
  renamePlayer(i, name) {
    const names = this.players;
    const from = names[i];
    names[i] = name;
    this.playersList.set(names);
    if (from !== this.players[i]) this.playersList.renamed?.(from, this.players[i]);
    const p = this.match?.players[i];
    if (p) p.name = this.players[i];
    this.render();
  }

  renderPlayers() {
    const names = this.players;
    const list = this.panel.querySelector("#ch-players");
    // Not while a name is being typed: that would lose the typing.
    // (The panel may be in the controls window: its own document says.)
    if (list.contains(list.ownerDocument.activeElement)) return;
    list.innerHTML = names
      .map(
        (n, i) => `<div class="player-row"><span class="player-dot" style="background:${this.colourOf(names, i)}"></span>` +
          `<input type="text" maxlength="20" data-player="${i}" value="${esc(n)}" aria-label="Player ${i + 1}">` +
          (names.length > 1 ? `<button data-remove="${i}" title="Remove ${esc(n)}">×</button>` : "") +
          `</div>`,
      )
      .join("");
    this.panel.querySelector("#ch-add-player").disabled = names.length >= MAX_PLAYERS;
    for (const input of list.querySelectorAll("input")) {
      input.addEventListener("keydown", (e) => e.key === "Enter" && input.blur());
      input.addEventListener("change", () => this.renamePlayer(Number(input.dataset.player), input.value));
    }
    for (const btn of list.querySelectorAll("[data-remove]")) {
      btn.addEventListener("click", () => this.changePlayers(names.filter((_, i) => i !== Number(btn.dataset.remove))));
    }
  }

  renderPanel() {
    const $ = (id) => this.panel.querySelector(id);
    const id = this.settings.game;
    const meta = gameById(id);
    const game = this.games[id];
    for (const btn of this.panel.querySelectorAll("#ch-games [data-game]")) btn.classList.toggle("active", btn.dataset.game === id);
    $("#ch-rules").textContent = game ? meta.rules : `${meta.rules} Coming soon.`;
    $("#ch-option-wrap").hidden = !game;
    // While a game's on, its option shows what's being played and can't
    // be changed (it would only count from the next game anyway).
    const locked = this.state === "playing" && this.game?.id === id;
    if (game) {
      $("#ch-option-label").textContent = game.option.label;
      $("#ch-option").disabled = locked;
      $("#ch-option").title = locked ? "Fixed for this game - pick a game (X) to change it" : "";
      const value = locked ? this.option : this.optionOf(id);
      $("#ch-option").innerHTML = Object.entries(game.option.choices)
        .map(([v, name]) => `<option value="${v}" ${v === value ? "selected" : ""}>${esc(name)}</option>`)
        .join("");
    }
    // Anything a game wants set for each player (the driving challenge's
    // average drives). Not while it's being typed in.
    const extra = $("#ch-extra");
    const extraHtml = game?.panelHtml?.() ?? "";
    extra.hidden = !extraHtml;
    if (!extra.contains(extra.ownerDocument.activeElement)) {
      extra.innerHTML = extraHtml;
      if (extraHtml) game.bindPanel?.(extra);
    }
    $("#ch-start").disabled = !game;
    $("#ch-start").textContent = this.state === "playing" ? "Start again" : "Start (N)";
    this.renderPlayers();

    const playing = this.state === "playing";
    const o = playing ? this.game.overlay() : null;
    const p = this.match?.player;
    let status = "Pick a game and press Start";
    if (playing) {
      const who = this.multi && p ? `<span class="player-dot" style="background:${esc(p.colour)}"></span><b>${esc(p.name)}</b> to play<br>` : "";
      // The lie's guidance, where a game plays from grass or sand.
      const lie = o.lie?.length ? `<span class="lie-guide">${o.lie.map((l) => esc(fullText(l))).join("<br>")}</span>` : "";
      status = `${who}${esc(o.note)}${o.title ? `<br><span class="points">${o.title}</span>` : ""}${lie}`;
    } else if (this.state === "results") {
      status = `<b>Game over</b> - ${esc(gameById(this.game.id).name)}`;
    }
    $("#ch-status").innerHTML = status;
    // The club, which the bay view shows on its badge.
    const stats = o ? [{ label: "Club", value: clubName(this.game.club) }, ...o.stats] : [];
    $("#ch-numbers").innerHTML = stats
      .map((s) => `<div class="stat${s.tone ? ` ${s.tone}` : ""}"><span>${esc(s.label)}</span><b>${esc(s.value)}${s.unit ? ` ${esc(s.unit)}` : ""}</b></div>`)
      .join("");
    $("#ch-card").innerHTML = this.cardHtml();

    const bests = loadSetting("bests", {});
    const rows = [];
    for (const g of GAMES) {
      const opt = this.games[g.id]?.option;
      if (!opt) continue;
      for (const [v, name] of Object.entries(opt.choices)) {
        const b = bests[bestKey(g.id, v)];
        if (!b) continue;
        const here = g.id === id && v === (locked ? this.option : this.optionOf(id)) ? ' class="here"' : "";
        rows.push(`<tr${here}><td>${esc(g.name)}</td><td>${esc(name.replace(/ \(.*\)$/, ""))}</td><td>${b.score}${b.name ? ` <small>${esc(b.name)}</small>` : ""}</td><td>${b.date}</td></tr>`);
      }
    }
    $("#ch-bests").innerHTML = `<tr><th>Game</th><th></th><th>Best</th><th>Date</th></tr>${rows.join("") || `<tr><td colspan="4" class="muted">No games finished yet</td></tr>`}`;
  }

  // The scores so far: a row per player, a column per hole, the hole being
  // played outlined.
  cardHtml() {
    const m = this.match;
    if (!m) return `<p class="muted small">Scores show here once a game starts.</p>`;
    const head = `<tr><th></th>${Array.from({ length: m.holes }, (_, i) => `<th>${i + 1}</th>`).join("")}<th>Total</th></tr>`;
    const rows = m.players
      .map((p, i) => {
        const turn = i === m.playerIndex;
        const cells = p.scores.map((s, h) => `<td${turn && h === m.hole ? ' class="here"' : ""}>${s ?? (turn && h === m.hole ? (this.game.madeSoFar ?? "") : "")}</td>`).join("");
        const name = this.multi ? `<span class="player-dot" style="background:${esc(p.colour)}"></span>${esc(p.name)}` : "Score";
        return `<tr${turn ? ' class="turn"' : ""}><td class="player-name">${name}</td>${cells}<td><b>${m.total(i)}</b></td></tr>`;
      })
      .join("");
    return `<table class="scorecard">${head}${rows}</table>`;
  }
}
