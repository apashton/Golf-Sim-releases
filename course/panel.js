// The course's side panel and players: building the panel (course, tees, format, players, teams, settings), the players' list and names, and redrawing it.
// Part of CourseMode (course.js), split out of it: these methods are
// added to CourseMode.prototype there and run with `this` the course.

import { fixedPlayersWords } from "../sim/roundplayers.mjs";
import { WIND_CHOICES, WIND_CHOICE_NAMES, TEMP_CHOICES, TEMP_CHOICE_NAMES, SKY_CHOICES, SKY_CHOICE_NAMES } from "../sim/weather.mjs";
import { TIME_CHOICES, TIME_CHOICE_NAMES, cleanTime } from "../sim/daylight.mjs";
import { distanceToPin, GROUND } from "../sim/courseplay.mjs";
import { TEES, TEE_NAMES, teeColour, teeSpot } from "../sim/tees.mjs";
import { PIN_CHOICES } from "../sim/pinday.mjs";
import { PLUGS, PLUG_ORDER, DEFAULT_PLUGS } from "../sim/sand.mjs";
import { saveSetting, esc } from "../util.js";
import { SPECIAL_NAMES } from "../sim/shotstats.mjs";
import { Sounds } from "../sounds.js";
import { audio } from "../audio/engine.js";
import { puttLine, setLineLevel, setPlaysLike, setGridColours, lineOptions } from "../puttline.js";
import { READ_CHOICES, MADE_UP_ORDER, CARRY_RULE_ORDER, SKILLS_RULE_ORDER } from "../sim/netrules.mjs";

// The host's rules for online games: on the Online tab (onlinetabs.js).
const ONLINE_RULE_KEYS = ["reads", "madeUp", "skills", "carry"];
import { FORMATS, FORMAT_NAMES, FORMAT_HELP, formatFits } from "../sim/formats.mjs";
import { TEAM_LETTERS, MAX_TEAMS, cleanTeams, teamsOf, teamName, usesTeams } from "../sim/teams.mjs";
import { MAX_PLAYERS, PLAYER_COLOURS, TURNS, defaultName, playerNames } from "../sim/players.mjs";
import { guestFor } from "../sim/profiles.mjs";
import { GIMMES, MAX_STROKES, lieGuideHtml } from "../course.js";
import { keyed } from "../sim/roundkeys.mjs";
import { CoursePicker } from "../coursefinder.js";
import { courseLine } from "../sim/coursepicker.mjs";
// The phone app and the web version (window.pocket, set before the game's
// code): the course designer's on every version, but real courses from the
// map only on the PC, and the courses' Google Drive not in the phone app
// (sim/webapp.mjs).
import { PHONE } from "../look/quality.js";
import { hasMapCourses, hasCourseDrive } from "../sim/webapp.mjs";
// Sharing a course with friends, and fetching a friend's (coursesharebox.js).
import { shareBox, friendBox } from "../coursesharebox.js";
// The courses you make kept in your own Google Drive, if it's turned on
// (coursedrivebox.js; sim/coursesync.mjs).
import { driveBox, driveQuietly } from "../coursedrivebox.js";
import { isBuiltIn } from "../sim/shown.mjs";

export class CoursePanel {
  // The "Punch / part shot next" button: what the next shot was said to be
  // (recorder.js's special), or off.
  showSpecial(kind) {
    const b = this.panel.querySelector("#course-special");
    if (!b) return;
    b.classList.toggle("on", !!kind);
    b.innerHTML = kind ? `Next shot: ${esc(SPECIAL_NAMES[kind])} <kbd>E</kbd>` : `Punch / part shot next <kbd>E</kbd>`;
  }

  // The online host's saved game settings (sim/netpresets.mjs): this
  // panel's choices as they are now, for saving; and a saved one put back
  // in the panel - each set as if picked here (its change does the rest),
  // and its course picked.
  presetSettings() {
    const s = this.settings;
    return { format: s.format, handicaps: s.handicaps !== false, tees: s.tees, pins: s.pins, wind: s.wind, temp: s.temp, sky: s.sky, reads: s.reads, madeUp: s.madeUp, skills: s.skills, carry: s.carry };
  }

  // A host's rule for online games (the Online tab's Host rules,
  // onlinetabs.js): kept with the course's settings, for the next game
  // this bay hosts - a value it doesn't know left as it was.
  setOnlineRule(key, value) {
    const s = this.settings;
    const v = String(value);
    const ok = { reads: READ_CHOICES.map(String), madeUp: MADE_UP_ORDER, skills: SKILLS_RULE_ORDER, carry: CARRY_RULE_ORDER }[key];
    if (!ok?.includes(v)) return false;
    s[key] = key === "reads" ? (v === "any" ? "any" : Number(v)) : v;
    saveSetting("course", s);
    this.onChange();
    return true;
  }

  applyPreset(p) {
    const $ = (sel) => this.panel.querySelector(sel);
    const ids = { format: "#course-format", tees: "#course-tees", pins: "#course-pins", wind: "#course-wind", temp: "#course-temp", sky: "#course-sky", time: "#course-time" };
    // (The host's rules: the Online tab's, set straight.)
    for (const key of ONLINE_RULE_KEYS) if (p.settings?.[key] != null) this.setOnlineRule(key, p.settings[key]);
    for (const [key, sel] of Object.entries(ids)) {
      const el = $(sel);
      const v = p.settings?.[key];
      if (!el || v == null || ![...el.options].some((o) => o.value === String(v))) continue;
      el.value = String(v);
      el.dispatchEvent(new Event("change"));
    }
    const hcp = $("#course-handicaps");
    if (hcp && typeof p.settings?.handicaps === "boolean") {
      hcp.checked = p.settings.handicaps;
      hcp.dispatchEvent(new Event("change"));
    }
    const pick = $("#course-pick");
    if (pick && p.courseId && [...pick.options].some((o) => o.value === p.courseId)) {
      pick.value = p.courseId;
      pick.dispatchEvent(new Event("change"));
    }
  }

  buildPanel() {
    const s = this.settings;
    this.panel.innerHTML = `
      <section class="settings">
        <h3>Course</h3>
        <button type="button" id="course-choose" class="course-choose" title="Choose the course: find it by its name or what kind it is - links, hilly, by the sea, 9 holes - or make a new one"><span class="course-choose-what"><b id="course-chosen">Pick a course</b><small id="course-chosen-line"></small></span><span class="course-choose-change">Change</span></button>
        <select id="course-pick" hidden aria-hidden="true" tabindex="-1"></select>
        <div class="players">
          <div class="players-head">Players</div>
          <div id="course-players"></div>
          <button id="course-add-player">Add player</button>
        </div>
        <label title="Which tee boxes the round is played from, everyone alike: white at the back, yellow the hole's usual tee, red forward - the holes' yards from them (from the next round)">Tees <select id="course-tees">${TEES.map((t) => `<option value="${t}" ${t === s.tees ? "selected" : ""}>${TEE_NAMES[t]}</option>`).join("")}</select></label>
        <label title="${esc(FORMAT_HELP[s.format] ?? "")}">Game <select id="course-format">${FORMATS.map((f) => `<option value="${f}" ${f === s.format ? "selected" : ""}>${FORMAT_NAMES[f]}</option>`).join("")}</select></label>
        <label class="check" title="Each player's handicap from their stats (or typed in beside their name) gives them strokes on the hardest holes"><input type="checkbox" id="course-handicaps" ${s.handicaps !== false ? "checked" : ""}> Handicaps</label>
        <p id="course-format-help" class="muted small">${esc(FORMAT_HELP[s.format] ?? "")}</p>
        <p id="course-teams" class="muted small" hidden></p>
        <label>Turns <select id="course-turns">${Object.entries(TURNS).map(([v, t]) => `<option value="${v}" ${v === (s.turns ?? "farthest") ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        <div class="row-buttons">
          <button id="course-start" class="primary" data-head>Start round</button>
          <button id="course-design" title="This course in the course designer: change its holes - or make a new course">Course designer</button>
        </div>
        <div class="row-buttons">
          <button id="course-share" title="Put this course up for friends with a code - to play on the phone app, the web version or another PC, or a season by post on it">Share...</button>
          <button id="course-friend" title="A course a friend shared: type its code or paste its link, and it's here to play">Friend's course...</button>
          ${hasCourseDrive() ? `<button id="course-drive" title="Keep the courses you make in your own Google Drive, so they're on every PC and browser you turn it on in - off unless you turn it on">Google Drive...</button>` : ""}
        </div>
        <p id="course-empty" class="muted small" hidden>No courses yet. Open the course designer, type in a scorecard, and it designs the holes for you.</p>
      </section>
      <section class="settings" id="course-season">
        <h3>Season</h3>
        <div id="course-season-body"></div>
      </section>
      <section class="settings" id="course-ladder">
        <h3>Match ladder</h3>
        <div id="course-ladder-body"></div>
      </section>
      <section class="round-buttons" id="course-between" data-cc="head" hidden><button id="course-watch" title="Out of the cart, following it to the next tee - and back up at its screen">Watch the drive</button><button id="course-next" class="primary">Next hole</button><button id="course-lobby" class="primary" hidden title="The round's over: everyone back to the Online play lobby, for the next game">Back to the lobby</button><button id="course-auto" hidden title="The cart drives itself to the next tee">Auto drive</button></section>
      <section class="putt-result" id="course-status" data-cc="off">Pick a course</section>
      <section class="round-buttons course-friends" id="course-friends" hidden></section>
      <section class="odd-shot" data-cc="off"><button id="course-special" title="A punch under a branch, a part swing, an odd club on purpose: kept out of the club's numbers, and not asked about (E; again for the next kind)">Punch / part shot next <kbd>E</kbd></button></section>
      <section class="numbers" id="course-numbers" data-cc="off"></section>
      <section data-cc="off"><p id="course-guide" class="guide"></p></section>
      <section class="line-read" id="course-read" hidden></section>
      <section><canvas id="course-panel-map" width="320" height="420"></canvas></section>
      <section>
        <h3>Scorecard</h3>
        <div id="course-card"></div>
      </section>
      <section class="settings" data-drawer="options">
        <h3>Options</h3>
        <label class="check" title="Shift + M (or the menu) takes the last stroke back - the ball where it was, the stroke not counted - to play it again: for a misread, or a shot you'd rather have again. Never in online play or a scramble"><input type="checkbox" id="course-mulligans" ${s.mulligans ? "checked" : ""}> Mulligans <kbd>Shift + M</kbd></label>
        <label>Gimmes <select id="course-gimme">${Object.entries(GIMMES).map(([v, t]) => `<option value="${v}" ${Number(v) === s.gimme ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        <label>Green speed <select id="course-stimp">${[8, 9, 10, 11, 12, 13].map((v) => `<option ${v === s.stimp ? "selected" : ""} value="${v}">Stimp ${v}</option>`).join("")}</select></label>
        <label title="The wind for the next round: rolled when it starts, from any direction, gusting a little shot to shot. It carries the ball as it does outside - more the higher it flies">Wind <select id="course-wind">${WIND_CHOICES.map((v) => `<option value="${v}" ${v === (s.wind ?? "calm") ? "selected" : ""}>${WIND_CHOICE_NAMES[v]}</option>`).join("")}</select></label>
        <label title="The air for the next round: warm air is thinner and carries the ball further">Temperature <select id="course-temp">${TEMP_CHOICES.map((v) => `<option value="${v}" ${v === (s.temp ?? "mild") ? "selected" : ""}>${TEMP_CHOICE_NAMES[v]}</option>`).join("")}</select></label>
        <label title="The sky for the next round: only a look, except that rain and showers play with soft fairways for that round (a shorter run-out)">Sky <select id="course-sky">${SKY_CHOICES.map((v) => `<option value="${v}" ${v === (s.sky ?? "fair") ? "selected" : ""}>${SKY_CHOICE_NAMES[v]}</option>`).join("")}</select></label>
        <label title="The time of day for the next round: the sun's height and colour, and where the shadows fall - only a look">Time of day <select id="course-time">${TIME_CHOICES.map((v) => `<option value="${v}" ${v === cleanTime(s.time) ? "selected" : ""}>${TIME_CHOICE_NAMES[v]}</option>`).join("")}</select></label>
        <label>Fairways <select id="course-ground">${Object.entries(GROUND).map(([v, g]) => `<option value="${v}" ${v === (s.ground ?? "normal") ? "selected" : ""}>${g.name}</option>`).join("")}</select></label>
        <label class="check" title="After each hole, once the celebration's over, the camera follows the ball through its strokes by itself (Esc, J or a shot skips it). Off (the usual), the next hole comes and the replay waits for J or a click on the card, until the next shot"><input type="checkbox" id="course-autoflyover" ${s.autoFlyover !== false ? "checked" : ""}> Flyover after each hole</label>
        <label class="check" title="As each hole starts, a short look from behind the tee over the landing area to the green, in place of the usual short wait. A shot, Esc or J cuts it short"><input type="checkbox" id="course-lookdown" ${s.lookDown ? "checked" : ""}> Look down each hole</label>
        <label class="check"><input type="checkbox" id="course-grid" ${s.grid ? "checked" : ""}> Grid on the greens</label>
        <label class="check" title="The grid's markers coloured by how steep the green is under them. Off, plain white: the grid's lines and the markers' pace show the slopes on their own. The same setting as the putting green's"><input type="checkbox" id="course-gridcolours" ${puttLine.gridColours ? "checked" : ""}> Colours on the grid</label>
        <label class="check" title="The green tinted by how steep it is, in the pace markers' colours: clear under 1%, deeper as it steepens"><input type="checkbox" id="course-shade" ${s.shade ? "checked" : ""}> Slope shading on the greens</label>
        <label class="check" title="In a wind of Windy or stronger, the gusts come and go while the ball's in the air - one can catch it at its peak. Off, each shot meets one steady gust, as before"><input type="checkbox" id="course-flightgusts" ${s.flightGusts !== false ? "checked" : ""}> Gusts during the flight</label>
        <label title="How often a ball coming down steep and fast into a bunker plugs - half buried (a fried egg) or right in - and how hard it then is to get out: Off, Rare (less often than in real life) or as often as real (from the next shot)">Plugged lies <select id="course-plugs">${PLUG_ORDER.map((v) => `<option value="${v}" ${v === (s.plugs ?? DEFAULT_PLUGS) ? "selected" : ""}>${PLUGS[v].name}</option>`).join("")}</select></label>
        <label class="check" title="Each green's grass lies one way: a putt down-grain runs a touch quicker, into it a touch slower, and every putt is eased a little down-grain. The guide says which way it runs (from the next hole)"><input type="checkbox" id="course-grain" ${s.grain !== false ? "checked" : ""}> Grain on the greens</label>
        <label title="Where the cups are cut: at each hole's own pin, or somewhere new every day - front, middle or back, left or right - well in from the edge, on gentle ground, clear of sand and water; the same for everyone playing that day (online, the host's day). From the next round">Pin positions <select id="course-pins">${Object.entries(PIN_CHOICES).map(([v, name]) => `<option value="${v}" ${v === (s.pins ?? "fixed") ? "selected" : ""}>${name}</option>`).join("")}</select></label>
        <label title="The line a putt finishing about 18 in past would have taken, and where to aim to start it on it (T). The same setting as the putting green's">Ideal line on the greens <select id="course-line">${lineOptions()}</select></label>
        <label class="check" title="A help: what each putt plays like (the distance it needs on the flat) said before it's struck. Off, how its pace compared is said after. The same setting as the putting green's"><input type="checkbox" id="course-playslike" ${puttLine.playsLike ? "checked" : ""}> Plays-like before the putt</label>
        <label class="check" title="The celebration sounds: fanfares and chimes for a hole's score (A turns all the game's sound on and off)"><input type="checkbox" id="course-sounds" ${audio.settings.celebrations ? "checked" : ""}> Sounds</label>
        <p class="muted small">← → aims, ↑ ↓ changes club. Water and lost balls cost a stroke and drop you back in play. Pick up after ${MAX_STROKES}.</p>
      </section>`;
    const $ = (id) => this.panel.querySelector(id);
    this.renderSeason();
    this.renderLadder();
    $("#course-special").addEventListener("click", (e) => {
      e.currentTarget.blur();
      this.onSpecialNext?.();
    });
    // Online: watch a friend's view, or back to this bay's ball (course/watch.js).
    $("#course-friends").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-watch-player]");
      if (!b) return;
      b.blur();
      if (b.dataset.watchPlayer === "back") this.stopWatching();
      else this.watchPlayer(this.round?.players[Number(b.dataset.watchPlayer)]);
    });
    // Between holes: the game window card's own buttons (renderBetween).
    $("#course-watch").addEventListener("click", (e) => {
      e.currentTarget.blur();
      this.rideWatch(!this.ride?.watch?.on);
    });
    $("#course-next").addEventListener("click", (e) => {
      e.currentTarget.blur();
      if (this.ride) this.rideNext();
      else this.next();
    });
    // (And its Auto drive: the cart's waited by the green till it's told.)
    $("#course-auto").addEventListener("click", (e) => {
      e.currentTarget.blur();
      this.autoDrive();
    });
    $("#course-lobby").addEventListener("click", (e) => {
      e.currentTarget.blur();
      if (this.netAfter?.()?.host) this.onLobby?.();
    });
    $("#course-start").addEventListener("click", async () => {
      const id = $("#course-pick").value;
      if (!id) return;
      const fixed = fixedPlayersWords(this.round);
      if (fixed) return this.onToast(fixed, 3500);
      if (!(await this.leaveRound("Abandon this round and start again?"))) return;
      this.startRound(id);
    });
    // Another course picked: the card says it, and its first hole is
    // drawn behind it.
    $("#course-pick").addEventListener("change", () => {
      this.renderChosen();
      this.idleSoon(300);
      this.onChange();
    });
    $("#course-choose").addEventListener("click", (e) => {
      e.currentTarget.blur();
      this.openPicker();
    });
    $("#course-design")?.addEventListener("click", () => this.openDesigner($("#course-pick").value || null));
    $("#course-share")?.addEventListener("click", (e) => {
      e.currentTarget.blur();
      const id = $("#course-pick").value;
      if (!id) return this.onToast("Pick a course to share first");
      if (isBuiltIn(id)) return this.onToast("That course comes with the game - everyone has it already");
      shareBox(id, this.list.find((c) => c.id === id)?.name);
    });
    $("#course-drive")?.addEventListener("click", (e) => {
      e.currentTarget.blur();
      driveBox({ changed: () => this.refreshList() });
    });
    // (The web version: in step as the game opens, if it's on and Google's
    // permission is still in hand - the PC's server does it by itself.)
    driveQuietly().then((v) => v?.last && !v.last.error && this.refreshList());
    $("#course-friend").addEventListener("click", async (e) => {
      e.currentTarget.blur();
      const got = await friendBox();
      if (!got) return;
      await this.refreshList();
      const pick = $("#course-pick");
      if ([...pick.options].some((o) => o.value === got.id)) {
        pick.value = got.id;
        pick.dispatchEvent(new Event("change"));
      }
      this.onToast(`${got.name}: here to play`);
    });
    this.renderPlayers();
    $("#course-add-player").addEventListener("click", () => {
      const names = this.players;
      // A guest (sim/profiles.mjs): typing their name makes them a saved
      // player (app.js onPlayers).
      if (names.length < MAX_PLAYERS) this.changePlayers([...names, guestFor(names) ?? defaultName(names.length)]);
    });
    $("#course-format").addEventListener("change", () => {
      s.format = $("#course-format").value;
      saveSetting("course", s);
      $("#course-format-help").textContent = FORMAT_HELP[s.format] ?? "";
      $("#course-format").parentElement.title = FORMAT_HELP[s.format] ?? "";
      this.renderPlayers();
      if (!formatFits(s.format, this.players.length, this.teamOf)) this.onToast(this.unfitWords(s.format), 3000);
      else if (this.round && !this.round.finished) this.onToast(`${FORMAT_NAMES[s.format]} from the next round`, 2200);
    });
    $("#course-tees").addEventListener("change", () => {
      s.tees = teeColour($("#course-tees").value);
      saveSetting("course", s);
      // Before a round, the first hole as it will be played: the ball on
      // the chosen tee, its sign's yards. A round already going keeps its own.
      if (!this.round && this.idle?.hole && !this.idle.bench) {
        try {
          this.buildHoleScene();
          this.putBall(teeSpot(this.idle.hole.layout.teeSpots, s.tees).at);
        } catch (err) {
          console.error("Couldn't redraw the first hole:", err);
        }
      }
      this.renderIntro();
    });
    $("#course-handicaps").addEventListener("change", () => {
      s.handicaps = $("#course-handicaps").checked;
      saveSetting("course", s);
      if (this.round && !this.round.finished) {
        this.round.handicaps = s.handicaps;
        this.render();
      }
    });
    $("#course-turns").addEventListener("change", () => {
      s.turns = $("#course-turns").value;
      saveSetting("course", s);
    });
    $("#course-gimme").addEventListener("change", () => {
      s.gimme = Number($("#course-gimme").value);
      saveSetting("course", s);
    });
    $("#course-stimp").addEventListener("change", () => {
      s.stimp = Number($("#course-stimp").value);
      saveSetting("course", s);
      if (this.round?.hole) this.round.hole.green.stimp = s.stimp;
    });
    $("#course-ground").addEventListener("change", () => {
      s.ground = $("#course-ground").value;
      saveSetting("course", s);
    });
    for (const [id, key] of [["#course-wind", "wind"], ["#course-temp", "temp"], ["#course-sky", "sky"], ["#course-time", "time"]]) {
      $(id).addEventListener("change", () => {
        s[key] = $(id).value;
        saveSetting("course", s);
        this.onToast(this.round && !this.round.finished ? "The next round's weather - this one's stays as it is" : "The weather for the next round");
      });
    }
    $("#course-line").addEventListener("change", () => setLineLevel($("#course-line").value));
    $("#course-playslike").addEventListener("change", () => setPlaysLike($("#course-playslike").checked));
    $("#course-lookdown").addEventListener("change", () => {
      s.lookDown = $("#course-lookdown").checked;
      saveSetting("course", s);
      if (!s.lookDown) this.endLookDown();
    });
    $("#course-mulligans").addEventListener("change", () => {
      s.mulligans = $("#course-mulligans").checked;
      saveSetting("course", s);
    });
    $("#course-autoflyover").addEventListener("change", () => {
      s.autoFlyover = $("#course-autoflyover").checked;
      saveSetting("course", s);
      // A hole just finished follows the new setting too: switched off
      // while it's still to come, it doesn't come.
      if (!s.autoFlyover && this.flyoverOffer?.auto) {
        this.flyoverOffer.auto = false;
        this.showOffer();
      }
    });
    $("#course-grid").addEventListener("change", () => {
      s.grid = $("#course-grid").checked;
      saveSetting("course", s);
      if (this.round) this.showGrid();
    });
    $("#course-gridcolours").addEventListener("change", () => setGridColours($("#course-gridcolours").checked));
    $("#course-flightgusts").addEventListener("change", () => {
      s.flightGusts = $("#course-flightgusts").checked;
      saveSetting("course", s);
    });
    $("#course-plugs").addEventListener("change", () => {
      s.plugs = $("#course-plugs").value;
      saveSetting("course", s);
    });
    $("#course-grain").addEventListener("change", () => {
      s.grain = $("#course-grain").checked;
      saveSetting("course", s);
    });
    $("#course-pins").addEventListener("change", () => {
      s.pins = $("#course-pins").value;
      saveSetting("course", s);
    });
    $("#course-shade").addEventListener("change", () => {
      s.shade = $("#course-shade").checked;
      saveSetting("course", s);
      if (this.round) this.showShade();
    });
    // Looking along a putt's line: a button for each stop, and its profile.
    this.sections.panel($("#course-read"), (i) => this.pickSection(i));
    // The celebration sounds on and off: the same setting as the Sound
    // panel's Celebrations (A is all the sound).
    $("#course-sounds").addEventListener("change", () => audio.set("celebrations", $("#course-sounds").checked));
    audio.watch((sound) => ($("#course-sounds").checked = sound.celebrations));
  }

  // The players list: a name each, editable, with a remove button once
  // there's more than one.
  renderPlayers() {
    const names = this.players;
    const list = this.panel.querySelector("#course-players");
    // Teams, in the games played in teams: a letter beside each name, and
    // who's with whom underneath.
    const teams = usesTeams(this.settings.format, names.length);
    const teamOf = this.teamOf;
    list.innerHTML = names
      .map(
        (n, i) => `<div class="player-row"><span class="player-dot" style="background:${this.colourOf(names, i)}"></span>` +
          `<input type="text" maxlength="20" data-player="${i}" value="${esc(n)}" aria-label="Player ${i + 1}">` +
          (teams
            ? `<select class="team" data-team="${i}" title="${esc(n)}'s team" aria-label="${esc(n)} team">${TEAM_LETTERS.slice(0, MAX_TEAMS).map((l, t) => `<option value="${t}" ${teamOf[i] === t ? "selected" : ""}>${l}</option>`).join("")}</select>`
            : "") +
          `<input type="number" class="hcp" step="0.1" min="-10" max="54" data-hcp="${i}" value="${esc(this.settings.hcp?.[n] ?? "")}" placeholder="hcp" title="${esc(n)}'s handicap index - leave blank to use their stats'" aria-label="${esc(n)} handicap">` +
          (names.length > 1 ? `<button data-remove="${i}" title="Remove ${esc(n)}">×</button>` : "") +
          `</div>`,
      )
      .join("");
    this.panel.querySelector("#course-add-player").disabled = names.length >= MAX_PLAYERS;
    for (const input of list.querySelectorAll("input[data-hcp]")) {
      input.addEventListener("keydown", (e) => e.key === "Enter" && input.blur());
      input.addEventListener("change", () => {
        const name = names[Number(input.dataset.hcp)];
        const v = Number(input.value);
        this.settings.hcp ??= {};
        if (input.value === "" || !Number.isFinite(v)) delete this.settings.hcp[name];
        else this.settings.hcp[name] = Math.max(-10, Math.min(54, Math.round(v * 10) / 10));
        saveSetting("course", this.settings);
        // Mid-round too: it's the same player.
        const p = this.round?.players.find((q) => q.name === name);
        if (p && !this.round.finished && !p.remote) {
          p.realIndex = this.settings.hcp[name] ?? null;
          p.realFrom = p.realIndex != null ? "typed" : null;
          this.swingIndex(p);
          this.render();
        }
      });
    }
    for (const input of list.querySelectorAll("input[data-player]")) {
      // Enter finishes the name and hands the keyboard back to the shortcuts.
      input.addEventListener("keydown", (e) => e.key === "Enter" && input.blur());
      input.addEventListener("change", () => this.renamePlayer(Number(input.dataset.player), input.value));
    }
    for (const btn of list.querySelectorAll("[data-remove]")) {
      btn.addEventListener("click", async () => {
        const gone = Number(btn.dataset.remove);
        const kept = this.teamOf.filter((_, i) => i !== gone);
        if ((await this.changePlayers(names.filter((_, i) => i !== gone))) !== false) {
          this.settings.teams = kept;
          saveSetting("course", this.settings);
          this.renderPlayers();
        }
      });
    }
    for (const sel of list.querySelectorAll("select[data-team]")) {
      sel.addEventListener("change", () => {
        const t = this.teamOf;
        t[Number(sel.dataset.team)] = Number(sel.value);
        this.settings.teams = t;
        saveSetting("course", this.settings);
        this.renderPlayers();
        if (this.round && !this.round.finished && usesTeams(this.round.format, this.round.players.length)) this.onToast("The new teams from the next round", 2200);
      });
    }
    const note = this.panel.querySelector("#course-teams");
    if (note) {
      note.hidden = !teams;
      note.textContent = teams
        ? `${teamsOf(teamOf)
            .map((t) => `${TEAM_LETTERS[t.id]}: ${teamName(t.members, names)}`)
            .join(" · ")}${this.settings.format === "scramble" ? " - the first named is the captain, who picks the ball" : ""}${formatFits(this.settings.format, names.length, teamOf) ? "" : ` - ${this.unfitWords(this.settings.format)}`}`
        : "";
    }
  }

  // Each player's team (sim/teams.mjs), from the settings.
  get teamOf() {
    return cleanTeams(this.settings.teams, this.players.length);
  }

  // Why a game can't be played with these players.
  unfitWords(format) {
    if (format === "match") return "Match play needs two players, or two teams";
    return `${FORMAT_NAMES[format]} needs at least two players`;
  }

  // A player's colour in a game: their profile's (app.js: sim/profiles.mjs
  // playingColours), else their place in the list's.
  colourOf(names, slot) {
    return this.playerColours?.(names)?.[slot] ?? PLAYER_COLOURS[slot];
  }

  // A new name takes effect at once, mid-round too: it's still the same
  // player. (A saved player renamed takes their stats with them: app.js
  // onRenamed.)
  renamePlayer(i, name) {
    const names = this.players;
    const from = names[i];
    names[i] = name;
    this.settings.players = playerNames(names);
    saveSetting("course", this.settings);
    // (By name, not place: in an online, ladder or post-season round the
    // round's players aren't this list in its order.)
    const p = this.round?.players.find((q) => q.name === from && !q.remote);
    if (p && !this.round.finished) p.name = this.settings.players[i];
    if (from !== this.settings.players[i]) this.onRenamed?.(from, this.settings.players[i]);
    this.renderPlayers();
    this.render();
  }

  // Adding or removing a player starts the round again with the new
  // players, asking first (in the page) if anyone has played a shot.
  // Resolves false if the answer was no.
  async changePlayers(names) {
    const r = this.round;
    const live = r && !r.finished;
    const fixed = fixedPlayersWords(r);
    if (fixed) {
      this.onToast(fixed, 3500);
      this.renderPlayers();
      return false;
    }
    if (this.underway && !(await this.askFirst("Abandon this round and start again?", { yes: "Start again", no: "Not now", danger: true }))) {
      this.renderPlayers();
      return false;
    }
    this.settings.players = playerNames(names);
    saveSetting("course", this.settings);
    this.onPlayers?.(this.settings.players);
    this.renderPlayers();
    if (live) {
      this.saveRound();
      this.startRound(this.course.id);
    }
  }

  renderList() {
    const pick = this.panel.querySelector("#course-pick");
    pick.innerHTML = this.list
      .map((c) => `<option value="${esc(c.id)}" ${c.id === this.settings.courseId ? "selected" : ""}>${esc(c.name)} - ${c.holes} holes, par ${c.par}${c.best ? `, best ${c.best}${c.bestBy ? ` (${esc(c.bestBy)})` : ""}` : ""}</option>`)
      .join("");
    this.panel.querySelector("#course-empty").hidden = this.list.length > 0;
    this.panel.querySelector("#course-start").disabled = !this.list.length;
    this.renderChosen();
    this.picker?.refresh();
  }

  // The course chosen, on the panel's button that opens the picker: its
  // name and its line (holes, par, length, what kind it is, the best).
  // (#course-pick, hidden, holds the choice: everything that reads or sets
  // the course goes through it.)
  renderChosen() {
    const id = this.panel?.querySelector("#course-pick")?.value;
    const c = this.list.find((x) => x.id === id);
    const name = this.panel?.querySelector("#course-chosen");
    if (!name) return;
    name.textContent = c ? c.name : this.list.length ? "Pick a course" : "No courses yet";
    this.panel.querySelector("#course-chosen-line").textContent = c ? courseLine(c) : "";
    this.panel.querySelector("#course-choose").disabled = !this.list.length;
  }

  // The course picker (coursefinder.js): every course, found by its name
  // or what kind it is - and the way to a new one in the designer (a real
  // course from the map on the PC only). In the window the panel's in.
  openPicker() {
    const doc = this.panel?.ownerDocument ?? document;
    this.picker ??= new CoursePicker({
      doc,
      list: () => this.list,
      current: () => this.panel?.querySelector("#course-pick")?.value || null,
      autofocus: !PHONE,
      fold: PHONE,
      choose: (id) => {
        const pick = this.panel?.querySelector("#course-pick");
        if (!pick || ![...pick.options].some((o) => o.value === id)) return;
        if (pick.value !== id) {
          pick.value = id;
          pick.dispatchEvent(new Event("change"));
        }
      },
      design: (start) => this.openDesigner(null, start),
      map: hasMapCourses(),
    });
    this.picker.moveTo(doc);
    this.picker.show(true);
  }

  // The course designer: on a course (id), or a new one ("new", or "map":
  // a real course from the map). With separate screens it opens in a
  // window of its own where the controls are (app.js onOpenDesigner);
  // otherwise in place of the sim.
  async openDesigner(id = null, start = null) {
    if (!(await this.leaveRound("Open the course designer?"))) return;
    if (this.onOpenDesigner?.(id, null, start)) return;
    const q = id ? `?course=${encodeURIComponent(id)}` : start === "map" ? "?start=map" : "";
    location.href = `/designer.html${q}`;
  }

  // Between holes - the cart ride to the next tee, or the scorecard card
  // over the picture - its Watch the drive (Scorecard while watching) and
  // Next hole here too: in the command centre's mode box heading
  // (arrange.js headButtons), where the mouse is, not only on the game
  // window's card (the owner, 26 October 2026: "there should also be a
  // button for watch drive and next hole on the command center").
  // An online round over: the host's Back to the lobby here too (and so in
  // the command centre's heading), or, for the others, who they're waiting
  // for (netAfter: app.js, sim/netgame.mjs afterRound).
  renderBetween() {
    const el = this.panel?.querySelector("#course-between");
    if (!el) return;
    const ride = this.ride;
    const after = this.round?.finished && this.round.net ? (this.netAfter?.() ?? null) : null;
    el.hidden = !ride && !this.holeCard && !after;
    const watch = el.querySelector("#course-watch");
    watch.hidden = !ride;
    watch.textContent = ride?.watch?.on ? "Scorecard" : "Watch the drive";
    // (Auto drive: while the cart waits, or it's being driven.)
    const auto = el.querySelector("#course-auto");
    auto.hidden = !ride || !!this.holdingWords() || (!ride.free && ride.goAt != null) || (!!ride.free && ride.arrived);
    const next = el.querySelector("#course-next");
    next.hidden = !!after;
    // (Online, ready and waiting for the others: who for. Never held for
    // the next hole's build: course/buggy.js updateRideCard.)
    const holding = this.holdingWords();
    next.disabled = !!holding;
    next.textContent = holding ?? keyed(this.round?.onlyHole != null ? "Back to the designer" : "Next hole", "N", this.keysShown());
    const lobby = el.querySelector("#course-lobby");
    lobby.hidden = !after;
    lobby.disabled = !after?.host;
    lobby.textContent = after?.host ? "Back to the lobby" : (after?.words ?? "");
  }

  // Everything that shows the state of play.
  render() {
    const r = this.round;
    const $ = (id) => this.panel.querySelector(id);
    // Start round in the command centre's mode box heading only before a
    // round (in one, the menu's Restart and End the round).
    $("#course-start")?.toggleAttribute("data-head", !this.underway);
    this.renderIntro();
    if (!r?.hole) {
      this.mapCanvas.hidden = true;
      this.standingsCanvas.hidden = true;
      this.onChange();
      return;
    }
    const spec = this.course.holes[r.index].spec;
    const toPin = distanceToPin(r.hole, this.me.ball);
    const turn = this.turnText();
    $("#course-status").innerHTML = r.finished
      ? `<b>Round complete</b>`
      : `<b>Hole ${spec.number}</b> - par ${spec.par} - ${this.yardsOf(r.index)} yds${turn ? `<br>${turn}` : ""}${r.message ? `<br><span class="points">${esc(r.message)}</span>` : ""}${
          this.stanceText() ? `<br>${esc(this.stanceText())}` : ""
        }${this.faceText() ? `<br><span class="face-${this.faceHelp().tone}">${esc(this.faceText())}</span>` : ""}${lieGuideHtml(this.lieLines())}`;
    const friends = this.watchHtml();
    $("#course-friends").innerHTML = friends;
    $("#course-friends").hidden = !friends;
    const stats = this.stats();
    $("#course-guide").innerHTML = this.puttLines().map((l) => `<span>${esc(l)}</span>`).join("<br>");
    $("#course-numbers").innerHTML = stats.map((s) => `<div class="stat${s.tone ? ` ${s.tone}` : ""}"><span>${s.label}</span><b>${esc(s.value)}${s.unit ? ` ${s.unit}` : ""}</b></div>`).join("");
    this.drawMaps();
    this.renderCard();
    // Over the picture only while the course is on screen (T on the putting
    // green redraws the course from behind, for its ideal line setting).
    this.mapCanvas.hidden = !this.isActive;
    this.standingsCanvas.hidden = !this.isActive || !this.multi;
    this.onChange();
    return toPin;
  }
}
