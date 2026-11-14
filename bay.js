// Bay view: for a projector screen in a hitting bay. The 3D view fills the
// screen and the numbers are laid over it, big enough to read from the mat.
// Also the club/mode toasts and the keyboard help, which both views use.
//
// With separate windows this window is the game window, the projector's
// alone: every word on it is big, and a line too long for that is said
// short here and whole in the command centre's This shot (details.js),
// which this feeds - the rules are sim/gametext.mjs's. In one window there's
// nowhere else for the whole line, so it's shown whole.

import { clubColor } from "./clubcolors.js";
import { esc } from "./util.js";
import { onThisScreen } from "./sim/keywords.mjs";
import { clubName } from "./sim/clubs.mjs";
import { gameLines, noteText, unitPhone, toastParts, slopeNumbers, slopeSvg, messageWay, MESSAGE_SYMBOL, symbolCount } from "./sim/gametext.mjs";
import { ShotDetails } from "./details.js";
import { MessageBox } from "./messages.js";

export { clubName };

// [key, what it does, what it does in a few words]: the whole description
// in the normal view (and on the controls window's copy of the list, with
// the screens separate); the few words in bay view, big enough to read from
// the mat (a row without them shows its whole description there too).
export const SHORTCUTS = [
  ["B", "Bay view on / off (full screen, numbers over the picture)", "Bay view on / off"],
  ["F", "Full screen on / off", "Full screen"],
  ["F11", "Windows app, separate windows: the window it's pressed in in / out of full screen, to move it", "This window full screen"],
  ["R  /  P  /  C  /  O  /  X", "Driving range  /  putting green  /  chipping  /  course  /  challenges", "Range / putting / chipping / course / challenges"],
  ["1  2  3", "Challenges: play a game from the cards", "Challenges: play a game"],
  ["Shift + 1  2  3", "Challenges: change that game's option (distances, fairways, green)", "Challenges: its option"],
  ["↑ ↓  or  Page Up / Down", "Change club (a presentation clicker works too).  Between holes, watching the cart: ↑ takes the wheel, then ↑ ↓ its speed", "Change club"],
  ["← →", "Course, driving challenge and putting green: turn the aim (putting: a quarter degree, Shift + ← → a degree).  Driving the cart between holes: steer", "Turn the aim"],
  ["N", "Practice: new random putt, or another chipping distance.  Challenges: new round, or skip the wait.  Course: start a round, or the next hole", "New putt, round or hole"],
  ["T", "Range: next target (none, 50 - 250 yds, random).  Putting practice and course greens: the ideal line (the read) - off, after each putt, before and after.  Online with line reads counted: spends one on this putt", "Target, or the putting read"],
  ["I  /  Shift + I", "Putting green and course greens: look along the putt's line a section at a time - 25%, 50%, 75%, behind the hole, side-on, back behind the ball / a stop back", "Look along the putt / back"],
  ["J", "Course, after a hole: the flyover following the ball through its strokes plays by itself (unless switched off) - J or Esc skips it, and J plays it again until the next hole (click another's name on the card)", "Hole flyover"],
  ["Shift + M", "Course, with Mulligans on (the course's Options): the last stroke taken back - the ball where it was, the stroke not counted - to play it again. Never online or in a scramble", "Mulligan"],
  ["U", "Practice: next player - who's hitting, for their stats.  Course: the ball's unplayable - a penalty stroke and where to play from under the Rules: back where it was played from (the tee), back on the line, or within two club-lengths (1 - 4 to choose, Esc to play it as it lies)", "Next player / unplayable"],
  ["Shift + R", "Recording: practice / round (kept as round play) / experimental (kept, but out of your stats) / not recording - back to practice each new day", "Recording format"],
  ["Y  /  N or L", "Club check: yes it was that club  /  no, the one it flew like (N on the range; D, 3 - 9 for a club; Z undoes). While it shows, 3 is the 3 wood, not the third challenge", "Club check: yes / the club it flew like"],
  ["Delete", "Take the last shot out of your stats: the launch monitor misread it (Z puts it back)", "Misread: take the last shot out"],
  ["Y  /  K", "Thin, fat or odd-reading card (range): yes, that's right  /  keep it - a good strike, or a real reading. B: just a bad hit. Delete takes it out", "Strike card: yes / keep it"],
  ["Y  /  Esc", "Voice's \"do this?\" box (anything voice heard but a club change): do it  /  cancel (or say \"confirm\" / \"cancel\")", "Voice box: do it / cancel"],
  ["E", "Next shot is a special one - punch / low, part swing, something else (again for the next kind, then off): kept out of your club stats, not asked about", "Next shot is a special one"],
  ["Shift + E", "Next swing's power - 25%, 50%, 75%, full, then off: a part swing (or a chip) kept by its power, so My stats has each club's carry at each power. The chipping panel has the same buttons", "Next swing's power"],
  ["Y  /  K  /  1 - 4", "\"That felt like a 50% swing?\" card after a chip or part swing: yes, the power lit  /  no, as it was  /  25%, 50%, 75% or full. Z undoes", "Power card: yes / no / 25 - 100%"],
  ["E  /  Y  /  K", "\"What was it?\" card after a very short shot (any mode): the special shot that's lit  /  the mishit it was judged  /  struck fine. N or L the club it flew like, D, 3 - 9 another club, Delete a misread, Z undoes", "What was it?: special / mishit / fine"],
  ["V", "Camera: follow the ball / stay put", "Camera: follow / stay put"],
  ["Shift + V", "Video recording: start / stop - the game, the cameras and the shot data as the Recording layout has them (the controls window's Recording button), with the game's sound and a microphone", "Record video: start / stop"],
  ["Shift + Q", "The game window shows what's being recorded - the recording's own picture, whole - or the game again (not recording: what would be recorded). A smaller box of it while recording: the Recording panel, On the game window", "Recording / game"],
  ["L", "Voice on / off: 'club picked seven iron' changes club; while a card shows, answer it out loud ('yes', 'thin', 'fifty'); 'shot note' then the note adds a note, 'power next fifty' a part swing, 'undo' takes an answer back", "Voice on / off"],
  ["S", "Range: session view, all your balls from above / back to the tee.  Course: look from the ball itself (← → to look round) - the gaps and branches in the way / back behind the ball", "Session view / from the ball"],
  ["Shift + S", "Save the last shot's camera replay, every angle (otherwise the next shot replaces it) - or Save on a camera box, or say 'save that'", "Save the replay"],
  ["Q", "Swing replay: the last shot's camera replay big on the game window, a few times round, then gone (Q again or Esc closes it, the next shot too) - or say 'replay', 'slow motion', 'close replay'; which cameras in Cameras", "Swing replay on / off"],
  ["A  /  Shift + A", "Sound on / off  /  sound settings: volumes, wind, birds, water", "Sound on / off / settings"],
  ["G", "Graphics: Very low (for slower PCs), Low, Standard, Medium and round again - never above the highest setting in the menu", "Graphics"],
  ["Shift + F", "Frame rate on / off: frames a second, the average frame and the slowest in the last 5 seconds, top right of the picture", "Frame rate"],
  ["Shift + D", "Screens: the game on one screen (the projector), the controls and menus in a window of their own (the laptop) / back to one window", "Screens: separate / one"],
  [",  /  .", "Controls window, a camera box clicked: its replay a frame back  /  a frame on (the box's buttons do the same)", "Replay: frame back / on"],
  ["[  /  ]", "Picture centre a step left / right: the ball and target line drawn over to one side, for hitting down one side of the net (the menu's Screens page has a slider)", "Picture centre left / right"],
  ["Shift + B", "Controls window: arrange its boxes (drag, size from the corner, - and + for text) and its blank area.  Game window or bay view: arrange the words and numbers over the picture (drag, - and +), its blank area on the bar.  One window: its blank area", "Arrange this screen"],
  ["M", "Menu: every setting, grouped - play, ball flight, greens, the launch monitor, screens, cameras and video, sound, stats, and the system", "Menu"],
  ["W", "Welcome: connection check and quick start", "Welcome"],
  ["Alt + F4", "Windows app: quit A² Golf - it asks first. So do the power button at the right of the top bar and Quit under the menu's pages", "Quit A² Golf"],
  ["K", "While a tip shows over the picture: don't show that tip again (the menu's Play page brings them all back)", "Tip: don't show again"],
  ["H  or  ?", "Show these keys", "These keys"],
  [
    "Controller",
    "A game controller (Xbox or PlayStation): right stick pulled back and pushed up through - a swing (a full one just short of the edge, 105% at it); Y the shot setup (shape, height, spin); left stick or D-pad ← → aim; LB / RB or D-pad ↑ ↓ a longer / shorter club; A OK, B back, X next, LT flyover, RT swing replay, Menu the menu, View the controller panel - every key here as a button to press (the camera too), and its buttons. In the menu or on a card: the D-pad moves, A presses, B goes back",
    "Controller: right stick swings, LB / RB club",
  ],
];

export class BayView {
  constructor(view) {
    this.enabled = false;
    this.el = document.createElement("div");
    this.el.className = "bay-overlay";
    this.el.innerHTML = `
      <div class="bay-top">
        <div class="bay-player" hidden></div>
        <div class="bay-club"></div>
        <div class="bay-rec" hidden></div>
        <div class="bay-title"></div>
        <div class="bay-voice" hidden></div>
        <div class="bay-sound" hidden title="Sound off (A turns it on)" aria-label="Sound off"></div>
        <div class="bay-status status off" role="button" tabindex="-1"></div>
        <div class="bay-notice" role="button" tabindex="-1" hidden></div>
      </div>
      <div class="bay-note"></div>
      <div class="bay-group" hidden></div>
      <div class="bay-lie"></div>
      <div class="bay-slope" hidden></div>
      <div class="bay-guide"></div>
      <div class="bay-stats"></div>`;
    view.appendChild(this.el);
    // The connection pill and the update reminder can be clicked (the rest
    // of the overlay lets clicks through to the picture): app.js decides
    // what opens.
    this.onStatusClick = null;
    for (const sel of [".bay-status", ".bay-notice"]) this.el.querySelector(sel).addEventListener("click", () => this.onStatusClick?.());
    // Who's hitting can be clicked too: their name changed (app.js).
    this.onPlayerClick = null;
    this.el.querySelector(".bay-player").addEventListener("click", () => this.onPlayerClick?.());
    // A key hint's "don't show again" (app.js keeps it; K does the same).
    // (On the picture itself, as the messages are, so it shows in every
    // view, not only bay view.)
    this.hint = null;
    this.onHintDismiss = null;
    this.hintEl = Object.assign(document.createElement("div"), { className: "bay-hint", hidden: true });
    view.appendChild(this.hintEl);
    this.hintEl.addEventListener("click", (e) => {
      if (e.target.closest("button") && this.hint) this.onHintDismiss?.(this.hint.id);
    });
    // A question with buttons, where the tips show (ask).
    this.askEl = Object.assign(document.createElement("div"), { className: "bay-hint bay-ask", hidden: true });
    view.appendChild(this.askEl);

    this.toastEl = document.createElement("div");
    this.toastEl.className = "bay-toast";
    view.appendChild(this.toastEl);
    // Messages kept off the picture (toast): the game's video's own only.
    this.hush = false;
    // A message's symbol (toast): a speech bubble that pops up, how many
    // have come while it's up beside it - its words are in the Messages
    // box (messages.js), which it opens over the picture in the one window.
    this.messages = new MessageBox();
    this.msgEl = Object.assign(document.createElement("div"), { className: "bay-msgs", role: "button", tabIndex: -1, title: "A message - its words are in the Messages box" });
    this.msgEl.setAttribute("aria-label", "New message");
    this.msgEl.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><circle cx="8" cy="10.5" r="1.4"/><circle cx="12" cy="10.5" r="1.4"/><circle cx="16" cy="10.5" r="1.4"/></svg><span class="bm-count"></span>`;
    view.appendChild(this.msgEl);
    view.appendChild(this.messages.el);
    this.msgEl.addEventListener("click", () => this.messages.setOpen());
    this.unseen = 0;
    // The latest message's words while its time lasts (pickClub keeps a
    // "Ben to play" with the club after it): { text, until }.
    this.latest = null;

    // The keys: each described in full in the normal view; in bay view in
    // a few words, big, in two columns the browser balances by height, so
    // however many keys there are the list is as short as it can be
    // (style.css shows the one that fits).
    this.helpEl = document.createElement("div");
    this.helpEl.className = "bay-help";
    this.helpEl.hidden = true;
    const row = (k, v) => `<tr><td><kbd>${esc(k)}</kbd></td><td>${esc(v)}</td></tr>`;
    const short = SHORTCUTS.map(([k, v, few]) => `<div class="kr"><kbd>${esc(k)}</kbd><span>${esc(few || v)}</span></div>`).join("");
    this.helpEl.innerHTML = `<div class="bay-help-box keys-box"><h2>Keys</h2>
      <table class="keys-full">${SHORTCUTS.map(([k, v]) => row(k, v)).join("")}</table>
      <div class="keys-short">${short}</div>
      <p>Press any key to close</p></div>`;
    this.helpEl.addEventListener("click", () => this.showHelp(false));
    document.body.appendChild(this.helpEl);

    // With separate windows: the command centre's This shot, which repeats
    // in full what this window says short. Hidden here until then.
    this.separate = false;
    // The phone app (pocket/start.js marks the page): its words shortest,
    // whole in the side panel (sim/gametext.mjs notePhone).
    this.phone = document.documentElement.classList.contains("pocket");
    this.content = {};
    this.status = { cls: "off", text: "", short: "" };
    this.details = new ShotDetails();
    document.body.appendChild(this.details.el);
  }

  // Separate windows (on) or one (off): with them, this is the game
  // window, and its text is short and big (style.css's body.game-window).
  setSeparate(on) {
    this.separate = on;
    document.body.classList.toggle("game-window", on);
    this.details.setOn(on);
    this.render(this.content);
    this.setStatus(this.status.cls, this.status.text, this.status.short);
  }

  setEnabled(on) {
    this.enabled = on;
    document.body.classList.toggle("bay", on);
    if (on) this.toast("Bay view - B to leave, H for keys", 2500);
  }

  // content: { club, player: { name, colour }, title, note, group, lie: [lines], guide, details: [lines], stats: [{ label, value, unit, accent, tone }] }
  // lie: the lie's guidance - what the last shot's lie did, what this
  // one's is likely to - quiet lines under the note.
  // guide: a line or two of quiet guidance just above the numbers (a putt's
  // slope and pace), or none.
  // details: lines for the command centre's This shot alone (separate
  // windows), never over the picture.
  // full: the result line whole, where the title is its short form (This
  // shot says it instead of the title).
  // A line is a string, or { text, short } with a short form of its own
  // for the game window (sim/gametext.mjs works out the lie's and the
  // putt's, and a short string is its own). Whatever is in title, note,
  // lie, guide and details is repeated whole in This shot.
  // stance: { side, slope } (sim/lie.mjs) - the lie of the land the ball
  // is on, drawn as a little tilted tile with its two numbers; null or
  // flat for none.
  // tone: "good" (green), "close" (amber) or "bad" (red), for a number that's a warning.
  // of: "shot" on a stat that's one of the last shot's numbers (the
  // command centre's Last shot box has those; This shot the rest).
  render(content) {
    content ??= {};
    this.content = content;
    const $ = (sel) => this.el.querySelector(sel);
    // Who's hitting: whose turn it is, or whose shots these are.
    // (A warm-up's says so instead: sim/profiles.mjs WARM_UP_BOX.)
    $(".bay-player").innerHTML = content.player ? `<small>${esc(content.player.label ?? "Hitting")}</small>${esc(content.player.name)}` : "";
    $(".bay-player").title = content.player ? (content.player.title ?? "Who's hitting - click to change the players' names") : "";
    $(".bay-player").hidden = !content.player;
    $(".bay-player").style.boxShadow = content.player ? `inset 0.3em 0 0 ${content.player.colour}` : "";
    $(".bay-club").textContent = content.club ? clubName(content.club) : "";
    $(".bay-club").hidden = !content.club;
    // A stripe in the club's colour, matching its balls on the range.
    $(".bay-club").style.boxShadow = content.club ? `inset 0.3em 0 0 ${clubColor(content.club)}` : "";
    $(".bay-title").innerHTML = content.title ?? "";
    // Separate windows: the note without the course's name (the controls
    // have it), each lie and putt line short and big. The phone: shortest.
    $(".bay-note").textContent = noteText(content.note, { separate: this.separate, phone: this.phone });
    const lines = (list, tag) =>
      gameLines(list, { separate: this.separate, phone: this.phone })
        .map(({ text, clip }) => `<${tag}${clip ? ' class="clip"' : ""}>${esc(text)}</${tag}>`)
        .join("");
    $(".bay-lie").innerHTML = lines(content.lie, "div");
    // The lie of the land: a tile tilted as the ground is, and its two
    // numbers (sim/gametext.mjs).
    const slope = slopeNumbers(content.stance);
    const slopeEl = $(".bay-slope");
    slopeEl.hidden = !slope;
    slopeEl.innerHTML = slope
      ? `${slopeSvg(content.stance)}<div class="slope-nums">` +
        `<div><span>L–R</span><b>${slope.across.deg}°</b><small>${esc(slope.across.words)}</small></div>` +
        `<div><span>U–D</span><b>${slope.updown.deg}°</b><small>${esc(slope.updown.words)}</small></div></div>`
      : "";
    $(".bay-guide").innerHTML = lines(content.guide, "span");
    // Who's on this hole and their strokes on it (a course round with
    // friends, or a season's playing partners): { title, rows: [{ name,
    // colour, strokes, holed, words }] }.
    const group = content.group;
    const groupEl = $(".bay-group");
    groupEl.hidden = !group?.rows?.length;
    groupEl.innerHTML = group?.rows?.length
      ? `<div class="bg-head">${esc(group.title ?? "This hole")}</div>` +
        group.rows
          .map((g) => `<div class="bg-row${g.holed ? " holed" : ""}"><span class="bg-dot"${g.colour ? ` style="background:${esc(g.colour)}"` : ""}></span><span class="bg-name">${esc(g.name)}</span><b>${g.strokes || "-"}</b><small>${esc(g.words ?? "")}</small></div>`)
          .join("")
      : "";
    $(".bay-stats").innerHTML = (content.stats ?? [])
      .map(
        (s) => `<div class="bay-stat${s.accent ? " accent" : ""}${s.tone ? ` ${s.tone}` : ""}"><span>${esc(s.label)}</span>` +
          `<b>${esc(s.value)}${s.unit ? `<small> ${esc(this.phone ? unitPhone(s.unit) : s.unit)}</small>` : ""}</b></div>`,
      )
      .join("");
    this.details.show(content);
    this.onRender?.(content);
  }

  // While the ball is in the air (flying: true), the notes over the top of
  // the picture - the hole's line, the lie's guidance - fade out so the
  // shot can be seen, and come back when it stops. The club, the shot's
  // result, the connection pill and the hole map stay where they are.
  // Called every frame; only a change does anything.
  setFlying(flying) {
    if (this.flying === !!flying) return;
    this.flying = !!flying;
    this.el.classList.toggle("in-flight", this.flying);
    this.hintEl.classList.toggle("in-flight", this.flying);
    this.askEl.classList.toggle("in-flight", this.flying);
  }

  // The connection: all of its message in one window; with separate
  // windows its short form, bigger ("Omni ready · 85%"), and the whole
  // message in the controls window's top bar.
  // Over the picture it's a small button: connected, just its light (and
  // the battery); otherwise its short form on one line. The whole message
  // is its tooltip, and a click opens the System menu (or diagnostics) with
  // it all - the bar stays one row (the owner: "a very long squashed bar").
  setStatus(cls, text, short = text) {
    this.status = { cls, text, short: short || text };
    const el = this.el.querySelector(".bay-status");
    const ok = cls === "ok";
    el.className = `bay-status status ${cls}${ok ? " compact" : ""}`;
    el.textContent = ok ? (/\d+%/.exec(this.status.short)?.[0] ?? "") : this.status.short;
    el.title = text;
    el.setAttribute("aria-label", text);
  }

  // A reminder that stays up (an update waiting to be installed), or "" for
  // none.
  // A button, "Update", its whole message the tooltip.
  setNotice(text) {
    const el = this.el.querySelector(".bay-notice");
    el.textContent = /^update/i.test(text) ? "Update" : text;
    el.title = text;
    el.hidden = !text;
  }

  // The microphone: listening, heard, or not available (and why), in a
  // few words to read from across the room.
  setVoice(state, text) {
    const el = this.el.querySelector(".bay-voice");
    el.hidden = state === "off";
    // Just the microphone, lit by its state (what it heard shows for a
    // moment in words); the words are its tooltip.
    const words = state === "heard" || state === "missed";
    el.className = `bay-voice voice ${state}${words ? "" : " icon-only"}`;
    el.textContent = words ? text : "";
    el.title = state === "listening" ? "Voice: listening" : `Voice: ${text}`;
  }

  // Sound off: a muted speaker, so silent speakers have an answer on
  // screen (A turns it back on).
  setSound(on) {
    this.el.querySelector(".bay-sound").hidden = on;
  }

  // The recording format, when shots aren't going into the stats as usual:
  // "NOT RECORDING", "EXPERIMENTAL" or "ROUND", big, beside the club ("" for
  // none). format: "off", "experimental" or "round", for its colour.
  setRecording(text, format = "") {
    const el = this.el.querySelector(".bay-rec");
    el.textContent = text;
    el.hidden = !text;
    el.className = `bay-rec rec-${format}`;
  }

  // A message. Over the picture only its symbol pops up (sim/gametext.mjs
  // messageWay) and its words go to the Messages box (messages.js), kept
  // there with the last few, so nothing comes and goes before it's read.
  // Sent with force (the game's video's and the speed test's own words) it
  // shows in words over the picture as it always did: in bay view a long
  // one its gist big and what to do about it under it, the normal view on
  // one line. While hushed (the game's video plays: its captions say what's
  // going on) only one sent with force shows at all.
  toast(text, ms = 1300, { force = false, quick = false } = {}) {
    // (On the phone, without the keys it says: sim/keywords.mjs.)
    text = onThisScreen(text);
    // No text takes down whatever is showing.
    if (!text) {
      clearTimeout(this.toastTimer);
      clearTimeout(this.msgTimer);
      this.toastEl.classList.remove("show");
      this.msgEl.classList.remove("show");
      this.unseen = 0;
      this.latest = null;
      return;
    }
    const way = messageWay({ force, hush: this.hush, quick });
    if (!way) return;
    this.messages.add(text);
    this.latest = { text, until: Date.now() + ms };
    if (way === "symbol") {
      this.unseen++;
      this.msgEl.querySelector(".bm-count").textContent = symbolCount(this.unseen);
      // Popped up again for each one (the animation run afresh).
      this.msgEl.classList.remove("show");
      void this.msgEl.offsetWidth;
      this.msgEl.classList.add("show");
      clearTimeout(this.msgTimer);
      this.msgTimer = setTimeout(() => {
        this.msgEl.classList.remove("show");
        this.unseen = 0;
      }, Math.max(ms, MESSAGE_SYMBOL.hold));
      return;
    }
    const { head, tail } = toastParts(text);
    const span = (className, words) => Object.assign(document.createElement("span"), { className, textContent: words });
    // (The " - " stays in the text, so the message reads as it was said.)
    this.toastEl.replaceChildren(span("bt-head", head), ...(tail ? [span("bt-sep", " - "), span("bt-tail", tail)] : []));
    this.toastEl.classList.toggle("long", head.length > 34);
    this.toastEl.classList.add("show");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastEl.classList.remove("show"), ms);
  }

  // The latest message's words, while its time lasts (or "").
  get current() {
    return this.latest && Date.now() < this.latest.until ? this.latest.text : "";
  }

  // A key hint (sim/keyhints.mjs), or null to take it down: the key, what
  // it does, and how to stop that one showing.
  showHint(hint, ms = 12000) {
    const el = this.hintEl;
    clearTimeout(this.hintTimer);
    this.hint = hint ?? null;
    el.hidden = !hint;
    if (!hint) return;
    el.innerHTML = `<span class="bh-tip">Tip</span> <kbd>${esc(hint.key)}</kbd> <span class="bh-text">${esc(hint.text)}</span> <button type="button" title="Don't show this tip again (K)">Don't show again <kbd>K</kbd></button>`;
    this.hintTimer = setTimeout(() => this.showHint(null), ms);
  }

  // A question over the picture where the tips show, hidden while a ball
  // flies (the graphics' question when they keep switching: app.js): the
  // words, and a button for each answer ([{ label, run }]). Answered - or
  // after `ms`, as the last answer ("Not now") - it goes. A tip showing
  // makes way for it.
  ask(text, answers, { head = "", ms = 90_000 } = {}) {
    const el = this.askEl;
    clearTimeout(this.askTimer);
    const done = (answer) => {
      clearTimeout(this.askTimer);
      el.hidden = true;
      el.replaceChildren();
      answer?.run?.();
    };
    const span = (className, words) => Object.assign(document.createElement("span"), { className, textContent: words });
    const buttons = answers.map((a) => {
      const b = Object.assign(document.createElement("button"), { type: "button", textContent: a.label });
      b.addEventListener("click", () => done(a));
      return b;
    });
    el.replaceChildren(...(head ? [span("bh-tip", head)] : []), span("bh-text", text), ...buttons);
    el.hidden = false;
    this.showHint(null);
    this.askTimer = setTimeout(() => done(answers.at(-1)), ms);
  }
  get asking() {
    return !this.askEl.hidden;
  }

  showHelp(on = this.helpEl.hidden) {
    this.helpEl.hidden = !on;
  }
  get helpOpen() {
    return !this.helpEl.hidden;
  }
}
