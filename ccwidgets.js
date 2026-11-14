// The controls window's own boxes (the command centre): a shot number on
// its own, all the numbers, the flight path, the shot history, or the keys
// that help right now - added from the Arrange bar, placed, sized and
// zoomed there like every other box (arrange.js), and taken out with its
// ×. What they can be and what's kept is sim/ccwidgets.mjs's; this draws
// them, fresh with every shot. Only in the controls window, while the
// screens are separate.

import { cleanWidgets, addWidget, removeWidget, widgetName, offerBox, showInGameBox, clockFace, GAME_SHOWS, GAME_SHOW_NAMES, PALETTE, takenOutBoxes } from "./sim/ccwidgets.mjs";
import { HISTORY_MARKS, HISTORY_MARK_NAMES, historyLine, historyClubs } from "./sim/shothistory.mjs";
import { clubName, clubShort } from "./sim/clubs.mjs";
import { shotTiles } from "./sim/videotiles.mjs";
import { lastShotTiles } from "./sim/thisshot.mjs";
import { shotPhase } from "./sim/shotphase.mjs";
import { drawFlightPath } from "./flightdraw.js";
import { loadSetting, saveSetting, esc } from "./util.js";

export class CommandWidgets {
  // layout(): the boxes have changed (arrange.js lays them out again).
  // history: { list(), names(), mark(id, say), club(id, club) } - the
  // recorder's last few shots, and what to do when one is changed.
  // press(key, shift): a line of the Keys box clicked - the key pressed,
  // as from the keyboard.
  // game(): the game's picture (its canvas), for the Game screen box.
  // recording(): the recording's compositor (compositor.js: its canvas,
  // and use(who, on) to have it drawn), for the box switched to Recording.
  // replays: { show(), save() } - the Game screen box's Replay (the last
  // shot's, big on the game window: swingreplay.js) and Save (replay.js).
  constructor({ layout = () => {}, history = null, press = () => {}, game = () => null, recording = () => null, replays = { show: () => {}, save: () => {} } } = {}) {
    this.layoutChanged = layout;
    this.history = history;
    this.press = press;
    this.game = game;
    this.recording = recording;
    this.replays = replays;
    // The last shot's replay: { saved } or null for none, and whether it's
    // showing on the game window (setReplay).
    this.replay = null;
    this.replayShowing = false;
    // The game's picture as a live stream, while a Game screen box shows it;
    // the recording's, while one's switched to it (the compositor drawing
    // it for this - "mirror" - only then).
    this.gameStream = null;
    this.recStream = null;
    this.mirroring = false;
    // The Keys box's lines (sim/keyhints.mjs keysNow), kept up by app.js.
    this.keys = [];
    const kept = loadSetting("ccWidgets", { list: [] });
    // The Shot history and the Keys, each offered once: there to begin
    // with, and gone for good once taken out.
    const history0 = offerBox(kept.list, "history", kept.historyOffered);
    const keys0 = offerBox(history0.list, "keys", kept.keysOffered);
    // And the game's own picture, smaller, to maximise on the command
    // centre's screen (the owner: "my projector is on a rough screen, so I
    // can't always see the level of clarity that I need").
    const game0 = offerBox(keys0.list, "game", kept.gameOffered);
    // And the last shot's numbers, the mode's own (the owner, 16 October
    // 2026: one Last shot box for every mode in place of each mode's).
    const tiles0 = offerBox(game0.list, "tiles", kept.tilesOffered);
    this.list = tiles0.list;
    if (history0.added || keys0.added || game0.added || tiles0.added || !kept.historyOffered || !kept.keysOffered || !kept.gameOffered || !kept.tilesOffered) this.saveList();
    // A Clock box (added from the Arrange bar: the top bar has the time
    // already, barclock.js) kept to the minute, only while one's showing.
    setInterval(() => this.tickClock(), 1000);
    this.shot = null;
    // What the mode has over the picture (its overlay content), for the
    // Last shot box's numbers.
    this.content = null;
    // The shot whose clubs are showing in the Shot history, to put it down
    // to another (its id), or null.
    this.picking = null;
    this.separate = false;
    this.el = document.createElement("div");
    this.el.className = "cc-widgets";
    document.body.appendChild(this.el);
    // The Shot history's buttons: what a shot was, and its club - a button
    // that shows the bag's clubs as buttons, one of them to put it down
    // to. (It was a drop-down: the owner couldn't change the club with it.
    // Buttons work with a mouse, a touch or keys alike - a drop-down hands
    // the arrow keys and a clicker to the club in hand - and a redraw
    // doesn't close them.)
    // The Game screen: its ⤢ (or a double click on the picture) fills the
    // command centre's window with it, and back; Esc puts it back.
    this.el.addEventListener("dblclick", (e) => {
      const box = e.target.closest?.(".cc-game");
      if (box) this.maximise(box);
    });
    this.el.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const box = this.el.querySelector(".cc-game.cc-max");
      if (!box) return;
      e.preventDefault();
      e.stopPropagation();
      this.maximise(box, false);
    });
    this.el.addEventListener("click", (e) => {
      // A Game screen box's Replay and Save.
      const rep = e.target.closest?.("[data-cc-replay]");
      if (rep) {
        rep.blur();
        if (rep.dataset.ccReplay === "save") this.replays.save();
        else this.replays.show();
        return;
      }
      // A Game screen box's Game | Recording.
      const show = e.target.closest?.("[data-cc-show]");
      if (show) {
        const id = show.closest("[data-w]")?.dataset.w;
        if (id) this.showIn(id, show.dataset.ccShow);
        show.blur();
        return;
      }
      const max = e.target.closest?.("[data-cc-max]");
      if (max) {
        this.maximise(max.closest(".cc-game"));
        max.blur();
        return;
      }
      const out = e.target.closest?.("[data-cc-remove]");
      if (out) {
        const id = out.closest("[data-w]")?.dataset.w;
        if (id) this.remove(id);
        return;
      }
      // A line of the Keys box: its key, pressed.
      const key = e.target.closest?.("button[data-press]");
      if (key) {
        this.press(key.dataset.press, key.dataset.shift === "1");
        key.blur();
        return;
      }
      const row = e.target.closest?.("li[data-shot]");
      if (!row) return;
      const id = row.dataset.shot;
      const b = e.target.closest("[data-hmark]");
      if (b) this.history?.mark(id, b.dataset.hmark === row.dataset.say ? "auto" : b.dataset.hmark);
      if (e.target.closest("[data-hpick]")) {
        this.picking = this.picking === id ? null : id;
        this.refreshHistory();
      }
      const c = e.target.closest("[data-hclub]");
      if (c) {
        this.picking = null;
        // A club put down changes the list (recorder.onHistory); the same
        // club again just closes the row.
        if (!this.history?.club(id, c.dataset.hclub)) this.refreshHistory();
      }
    });
    this.render();
  }

  get palette() {
    return PALETTE;
  }

  // Arrange.js's boxes: one per widget, while the screens are separate,
  // each with a way to take it out.
  extras() {
    if (!this.separate) return [];
    // The Keys and the Shot history go in the side drawer (arrange.js)
    // until they're dragged out of it.
    const drawer = (w) => (w.kind === "keys" || w.kind === "history" ? w.kind : null);
    return this.list.map((w) => ({ id: `cc-${w.id}`, el: this.el.querySelector(`[data-w="${w.id}"]`), name: widgetName(w), remove: () => this.remove(w.id), drawer: drawer(w) }));
  }

  // The boxes it starts with that have been taken out, to tick back in
  // Arrange ▾ (sim/ccwidgets.mjs takenOutBoxes).
  takenOut() {
    if (!this.separate) return [];
    return takenOutBoxes(this.list).map((b) => ({ id: `cc-add-${b.key}`, name: b.name, restore: () => this.add(b.key) }));
  }

  setSeparate(on) {
    this.separate = on;
    this.render();
  }

  // One from the palette (a key: "stat:carry", "flight:side"...).
  add(key) {
    const { list, id } = addWidget(this.list, key);
    if (!id) return null;
    this.list = list;
    this.save();
    return id;
  }
  remove(id) {
    this.list = removeWidget(this.list, id);
    this.save();
  }
  save() {
    this.saveList();
    this.render();
    this.layoutChanged();
  }
  saveList() {
    saveSetting("ccWidgets", { list: this.list, historyOffered: true, keysOffered: true, gameOffered: true, tilesOffered: true });
  }

  // The keys that help now ([{ key, text, press }]: sim/keyhints.mjs
  // keysNow): the Keys box drawn again when they've changed.
  setKeys(list) {
    const same = list.length === this.keys.length && list.every((k, i) => k.id === this.keys[i].id);
    this.keys = list;
    if (same) return;
    for (const w of this.list.filter((x) => x.kind === "keys")) {
      const box = this.el.querySelector(`[data-w="${w.id}"] .cc-body`);
      if (box) box.innerHTML = this.keysHtml();
    }
  }
  get wantsKeys() {
    return this.separate && this.list.some((w) => w.kind === "keys");
  }

  // The Keys box: a line for each key that helps now, the key big; one
  // that's a single key can be clicked to press it.
  keysHtml() {
    if (!this.keys.length) return `<p class="cc-empty">The keys that help with what's happening show here.</p>`;
    return `<ul class="ck-list">${this.keys
      .map((k) => {
        const inner = `<kbd>${esc(k.key)}</kbd><span>${esc(k.text)}</span>`;
        return k.press
          ? `<li><button type="button" data-press="${esc(k.press.key)}" data-shift="${k.press.shift ? 1 : 0}" title="Press ${esc(k.key)}">${inner}</button></li>`
          : `<li><div class="ck-line">${inner}</div></li>`;
      })
      .join("")}</ul>`;
  }

  // The last shot: { ball, clubData, flight, at } as the recording has it.
  update(shot) {
    this.shot = shot;
    this.fill();
  }

  // What the mode has over the picture now (bay.js content): the Last shot
  // box's numbers are its own where it gives them.
  setContent(content) {
    this.content = content;
    for (const w of this.list.filter((x) => x.kind === "tiles")) {
      const box = this.el.querySelector(`[data-w="${w.id}"] .cc-body`);
      if (box) this.drawTiles(box);
    }
  }

  // The Last shot's numbers (sim/thisshot.mjs lastShotTiles), drawn only
  // when they've changed.
  drawTiles(box) {
    const html = lastShotTiles(this.content, shotTiles(this.shot))
      .map((t) => `<div class="${[t.accent ? "accent" : "", t.tone ?? ""].join(" ").trim()}"><span>${esc(t.label)}</span><b>${esc(t.value)}</b><small>${esc(t.unit)}</small></div>`)
      .join("");
    if (box.dataset.html !== html) {
      box.innerHTML = html;
      box.dataset.html = html;
    }
  }

  render() {
    const have = new Set(this.list.map((w) => w.id));
    for (const el of [...this.el.children]) if (!have.has(el.dataset.w)) el.remove();
    for (const w of this.list) {
      if (this.el.querySelector(`[data-w="${w.id}"]`)) continue;
      const box = this.el.ownerDocument.createElement("section");
      box.className = `cc-widget cc-${w.kind}`;
      box.dataset.w = w.id;
      // Its × takes it out (the owner: "need to be able to remove shot
      // history from the command center. If it's on the shot screen, it
      // doesn't need to be on both"); Arrange's bar adds it again.
      if (w.kind === "game") box.tabIndex = -1;
      // A Game screen box: the game, or the recording (the owner: "enable
      // the grid game screen to switch from either just the pure game or
      // the recording screen").
      const shows = w.kind === "game" ? `<span class="cc-shows" role="group" aria-label="What it shows">${GAME_SHOWS.map((v) => `<button type="button" data-cc-show="${v}" title="${v === "recording" ? "What's being recorded - or, not recording, what would be: the recording's layout, scene and words (the Recording panel)" : "The game's own picture"}">${GAME_SHOW_NAMES[v]}</button>`).join("")}</span>` : "";
      // And the last shot's replay (the owner's review, 16 October 2026: its
      // buttons by the picture).
      const replays = w.kind === "game" ? `<span class="cc-replay" hidden><button type="button" data-cc-replay="show" title="The last shot's replay, big on the game window (Q; again to close it)">Replay</button><button type="button" data-cc-replay="save" title="Keep the last shot's replay in the clips folder (Shift + S) - otherwise it's kept only until the next shot">Save</button></span>` : "";
      box.innerHTML = `<h3>${esc(widgetName(w))}${shows}${replays}${w.kind === "game" ? `<button type="button" class="cc-x cc-maxb" data-cc-max title="Fill the command centre's screen with the game (double-click the picture too; Esc or this again puts it back)">⤢</button>` : ""}<button type="button" class="cc-x" data-cc-remove title="Take this box out of the command centre (Arrange, then the bar at the foot, adds it again)">×</button></h3><div class="cc-body">${w.kind === "flight" ? "<canvas></canvas>" : w.kind === "game" ? `<video muted autoplay playsinline></video>` : ""}</div>`;
      this.el.appendChild(box);
    }
    this.showGame();
    this.drawReplay();
    this.fill();
  }

  // The last shot's replay: { saved } or null for none; showing: on the
  // game window now.
  setReplay(replay, showing = this.replayShowing) {
    this.replay = replay;
    this.replayShowing = !!showing;
    this.drawReplay();
  }
  drawReplay() {
    for (const span of this.el.querySelectorAll(".cc-replay")) {
      span.hidden = !this.replay;
      const [show, save] = span.querySelectorAll("button");
      show.classList.toggle("on", this.replayShowing);
      show.textContent = this.replayShowing ? "Close replay" : "Replay";
      save.disabled = !!this.replay?.saved;
      save.textContent = this.replay?.saved ? "Saved" : "Save";
    }
  }

  // The Game screen boxes fed from the game's picture or the recording's: a
  // live stream of its canvas (the browser copies each frame drawn, on the
  // graphics card - no work a frame here), only while a box shows it;
  // stopped when the last goes. The words over the picture in bay view are
  // the page's, not the canvas's, so the game's is the 3D picture alone; the
  // recording's has its own layout and words (compositor.js), drawn for
  // the box ("mirror", at the game window's copy's 30 a second) only while
  // one shows it.
  showGame() {
    const boxes = this.list.filter((w) => w.kind === "game").map((w) => [w, this.el.querySelector(`[data-w="${w.id}"]`)]).filter(([, el]) => el);
    const wants = (show) => this.separate && boxes.some(([w]) => (w.show ?? "game") === show);
    this.gameStream = liveStream(this.gameStream, wants("game"), () => this.game());
    const mirror = wants("recording");
    let comp = null;
    if (mirror || this.mirroring) {
      try {
        comp = this.recording();
      } catch {
        comp = null;
      }
    }
    if (mirror !== this.mirroring) {
      comp?.use?.("mirror", mirror);
      this.mirroring = mirror && !!comp;
    }
    this.recStream = liveStream(this.recStream, mirror && !!comp, () => comp?.canvas);
    for (const [w, el] of boxes) {
      const show = w.show ?? "game";
      for (const b of el.querySelectorAll("[data-cc-show]")) b.classList.toggle("on", b.dataset.ccShow === show);
      el.classList.toggle("cc-showing-recording", show === "recording");
      const v = el.querySelector("video");
      const stream = !this.separate ? null : show === "recording" ? this.recStream : this.gameStream;
      if (v.srcObject !== stream) v.srcObject = stream;
      if (stream) v.play?.().catch(() => {});
    }
  }

  // A Game screen box switched to the game or the recording (kept).
  showIn(id, show) {
    this.list = showInGameBox(this.list, id, show);
    this.saveList();
    this.showGame();
  }

  // A Game screen box filling the window, or back (on: which; else the
  // other way).
  maximise(box, on = !box?.classList.contains("cc-max")) {
    if (!box) return;
    box.classList.toggle("cc-max", on);
    const b = box.querySelector("[data-cc-max]");
    if (b) b.textContent = on ? "⤡" : "⤢";
    if (on) box.focus?.({ preventScroll: true });
  }

  // Every box's numbers from the last shot; the flight path drawn as the
  // ball flies.
  fill() {
    for (const w of this.list) {
      const box = this.el.querySelector(`[data-w="${w.id}"] .cc-body`);
      if (!box) continue;
      if (w.kind === "stat") {
        const [t] = shotTiles(this.shot, [w.stat]);
        box.innerHTML = `<b>${esc(t.value)}</b><small>${esc(t.unit)}</small>`;
      } else if (w.kind === "history") {
        this.drawHistory(box);
      } else if (w.kind === "keys") {
        box.innerHTML = this.keysHtml();
      } else if (w.kind === "tiles") {
        this.drawTiles(box);
      } else if (w.kind === "clock") {
        this.drawClock(box);
      }
    }
    this.animate();
  }

  // The Clock boxes: the laptop's time and the date, written only when the
  // minute changes.
  drawClock(box) {
    const { time, date } = clockFace();
    const html = `<b>${esc(time)}</b><small>${esc(date)}</small>`;
    if (box.dataset.html !== html) {
      box.innerHTML = html;
      box.dataset.html = html;
    }
  }
  tickClock() {
    if (!this.separate) return;
    for (const w of this.list.filter((x) => x.kind === "clock")) {
      const box = this.el.querySelector(`[data-w="${w.id}"] .cc-body`);
      if (box) this.drawClock(box);
    }
  }

  // The Shot history again (a shot recorded, marked, its club changed).
  refreshHistory() {
    for (const w of this.list.filter((x) => x.kind === "history")) {
      const box = this.el.querySelector(`[data-w="${w.id}"] .cc-body`);
      if (box) this.drawHistory(box);
    }
  }

  // One Shot history box drawn.
  drawHistory(box) {
    box.innerHTML = this.historyHtml();
  }

  // The last few shots, newest first: each one's club (to change), carry,
  // and what it was (to say; the lit one again puts it back as judged).
  historyHtml() {
    const list = this.history?.list() ?? [];
    if (!list.length) return `<p class="cc-empty">Your last few shots show here, to mark thin, fat or a misread, or put down to another club.</p>`;
    const names = this.history.names();
    // The open row of clubs goes with its shot when that drops off the list.
    if (this.picking && !list.some((s) => s.id === this.picking)) this.picking = null;
    return `<ol class="cc-history">${list
      .map((s, i) => {
        const when = new Date(s.t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
        const can = historyClubs(s);
        const name = s.club ? clubName(s.club) : "Which club?";
        const club = can.length
          ? `<button type="button" data-hpick class="ch-club${this.picking === s.id ? " open" : ""}" title="Put this shot down to another club">${esc(name)} ▾</button>`
          : `<span class="ch-club">${esc(name)}</span>`;
        const clubs =
          this.picking === s.id && can.length
            ? `<div class="ch-clubs">${can.map((c) => `<button type="button" data-hclub="${c}" class="${c === s.club ? "on" : ""}" title="${esc(clubName(c))}">${esc(clubShort(c))}</button>`).join("")}</div>`
            : "";
        const marks = HISTORY_MARKS.map((m) => `<button data-hmark="${m}" class="${s.say === m ? "on" : ""}${m === "misread" ? " out" : ""}" title="${s.say === m ? "Put it back as it was judged" : esc(HISTORY_MARK_NAMES[m])}">${esc(HISTORY_MARK_NAMES[m])}</button>`).join("");
        const rest = historyLine({ ...s, club: null }, { names });
        return `<li data-shot="${esc(s.id)}" data-say="${esc(s.say ?? "")}" class="${s.say === "misread" ? "out" : ""}">
          <div class="ch-top"><span class="ch-n">${i === 0 ? "Last" : `−${i}`} <small>${esc(when)}</small></span>${club}<span class="ch-what">${esc(rest)}</span></div>
          ${clubs}<div class="ch-marks">${marks}</div>
        </li>`;
      })
      .join("")}</ol>`;
  }

  // The flight boxes, redrawn each frame while the ball is in the air.
  animate() {
    const flights = this.list.filter((w) => w.kind === "flight");
    if (!flights.length) return;
    const win = this.el.ownerDocument.defaultView ?? window;
    const draw = () => {
      const now = performance.now();
      const t = this.shot ? shotPhase(this.shot, now).t : 1;
      for (const w of flights) {
        const c = this.el.querySelector(`[data-w="${w.id}"] canvas`);
        if (!c) continue;
        const r = c.getBoundingClientRect();
        const dpr = win.devicePixelRatio || 1;
        const cw = Math.max(1, Math.round(r.width * dpr));
        const ch = Math.max(1, Math.round(r.height * dpr));
        if (c.width !== cw || c.height !== ch) {
          c.width = cw;
          c.height = ch;
        }
        const g = c.getContext("2d");
        g.clearRect(0, 0, cw, ch);
        drawFlightPath(g, { x: 0, y: 0, w: cw, h: ch }, { shot: this.shot, t, H: Math.max(360, ch * 3), view: w.view, sample: !this.shot, panel: false });
      }
      if (t < 1 && this.shot) this.frame = win.requestAnimationFrame(draw);
      else this.frame = null;
    };
    if (this.frame) win.cancelAnimationFrame(this.frame);
    this.frame = win.requestAnimationFrame(draw);
  }
}

// A canvas's live stream while it's wanted (made once, from canvas()), its
// tracks stopped when it isn't.
function liveStream(have, want, canvas) {
  if (!want) {
    for (const t of have?.getTracks() ?? []) t.stop();
    return null;
  }
  if (have) return have;
  try {
    return canvas()?.captureStream?.(30) ?? null;
  } catch {
    return null;
  }
}
