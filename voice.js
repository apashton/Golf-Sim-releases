// Voice: "club picked seven iron" changes the club in hand, and while a card
// in the corner asks something, it can be answered out loud ("yes", "thin",
// "fifty"); a note ("shot note, pulled it"), a swing's power ("power next
// fifty") and a special shot next ("punch next") can be said too. What each phrase means is
// sim/voicecmd.mjs's; this listens and hands it on.
//
// Two ways to listen, whichever this page has:
// - the Windows app: Windows' own speech recogniser, offline, run by the app
//   (electron/voice.mjs) and passed over the app bridge;
// - a browser: Chrome's or Edge's speech recognition (SpeechRecognition),
//   which sends the sound to Google or Microsoft, so needs internet.
// Neither: it says so, and why.
//
// No page elements here: it reports its state through onStatus, and the
// page draws the microphone (so the tests can drive it with a pretend
// recogniser).

import { unknownMessage } from "./sim/voice.mjs";
import { hear, NOTE_SECONDS, WAKE_SECONDS, WAKE_WORDS, askingNow, doneAtOnce } from "./sim/voicecmd.mjs";
// How long "Heard: 7 iron" shows before it goes back to "Listening".
const HEARD_MS = 2500;
// After an error, how long the browser must listen without another before
// it counts as listening again (with no internet, it starts, then fails).
const SETTLE_MS = 5000;
// How often the page tells the Windows app whether a question is showing
// (watchAsking).
const ASK_POLL_MS = 300;

// A few words for the bay view's pill, which is read from across the room;
// the full reason is in the tooltip and the toast.
export function shortReason(text) {
  const t = String(text ?? "");
  if (/blocked/i.test(t)) return "Mic blocked";
  if (/no microphone/i.test(t)) return "No microphone";
  if (/internet/i.test(t)) return "No internet";
  if (/english/i.test(t)) return "No English speech";
  if (/localhost/i.test(t)) return "Needs localhost";
  if (/no speech recognition/i.test(t)) return "No speech here";
  return "Not available";
}

export const VOICE_HELP = "Say 'club picked seven iron' to change club, 'last shot seven iron' or 'last shot mishit' about the shot just hit - and answer what's asked out loud ('yes', 'eight iron')";

// The same, with a wake word (name, "Caddie") said first: null for none.
// more: the menu's More voice commands are on (notes, replays...).
export function voiceHelp(name = null, { more = false } = {}) {
  if (!name) return VOICE_HELP + (more ? ", 'shot note' then the note, 'power next fifty' for a part swing" : "");
  return `Say '${name}' first, then the command: '${name}, seven iron' changes club, '${name}, last shot seven iron' or '${name}, last shot mishit' about the shot just hit${more ? `, '${name}, save that', '${name}, shot note' then the note` : ""} - and while something asks, no '${name}' needed: answer it out loud ('yes', 'eight iron')`;
}

export class VoiceControl {
  // bridge: the Windows app's (window.golfsimApp), or null.
  // Recognition: the browser's SpeechRecognition constructor, or null.
  // secure: whether the browser will allow the microphone (localhost or https).
  // onClub(club, heardText): a club was asked for. Returns { name } when it
  //   was taken, or { why } when it can't be here (and has said so).
  // onMiss(message): "club picked" was heard but no club was caught; the
  //   page shows the message.
  // onStatus({ state, text, short }): state is off, starting, listening,
  //   heard (a club taken), missed (heard, but not a club it could take) or
  //   unavailable; text says it in words (and why), short in a few.
  // waiting(): what's waiting for a bare answer right now - { card,
  //   undo } (sim/voicecmd.mjs hear) - so "yes" or "fifty" is only heard
  //   while something asks for it.
  // onCommand(r, heardText): everything else hear() understood (an answer,
  //   a note, a power...). Returns { done, short } when it was done, or
  //   { why } when it couldn't be (having said so).
  // confirm(r, heardText, run): when given, everything but a club is asked
  //   about first - the page shows what it would do, and calls run() only
  //   if it's agreed to. Its yes or no comes back as { confirm: true |
  //   false } (waiting().confirm) through onCommand.
  // onNotice(reason): the Windows helper's word that something is missing
  //   (no dictation for notes).
  // onNote(listening): the Windows app is listening for a note, its wake
  //   words heard (true), or none came (false) - for the page to say so.
  // wake(): the wake word's phrases when one must come first (sim/voicecmd.mjs
  //   WAKE_WORDS), or null; wakeName(): it in a word, for what's said.
  // extras(): whether the menu's More voice commands are on - notes,
  //   powers, replays, scenes, recording, the putting green, who's hitting
  //   (sim/voicecmd.mjs hear); off, only clubs, the last shot and answers.
  constructor({
    bridge = null,
    Recognition = null,
    secure = true,
    lang = "en-GB",
    onClub = () => {},
    onMiss = () => {},
    onStatus = () => {},
    waiting = () => ({}),
    onCommand = () => ({ why: "Nothing to do with that" }),
    onNotice = () => {},
    onNote = () => {},
    confirm = null,
    wake = () => null,
    wakeName = () => null,
    extras = () => true,
    timers = globalThis,
    now = () => Date.now(),
  } = {}) {
    Object.assign(this, { bridge, Recognition, secure, lang, onClub, onMiss, onStatus, waiting, onCommand, onNotice, onNote, confirm, wake, wakeName, extras, timers, now });
    this.enabled = false;
    // Until when what's said is a command without the wake word (it was
    // just said on its own).
    this.awakeUntil = 0;
    this.rec = null;
    this.answer = null;
    this.status = { state: "off", text: "Voice off", short: "Voice off" };
    this.useApp = Boolean(bridge?.voiceStart);
    if (this.useApp) bridge.onVoice?.((msg) => this.fromApp(msg));
  }

  // Why voice can't work here, or null if it can.
  get unavailableReason() {
    if (this.useApp) return null;
    if (!this.Recognition) return "This browser has no speech recognition - use the Windows app, Chrome or Edge";
    if (!this.secure) return "The browser only allows the microphone at http://localhost - open the page there";
    return null;
  }

  setStatus(state, text, short = state === "unavailable" ? shortReason(text) : text) {
    this.status = { state, text, short };
    this.onStatus(this.status);
  }

  async setEnabled(on) {
    this.enabled = on;
    this.timers.clearTimeout(this.heardTimer);
    this.timers.clearTimeout(this.restartTimer);
    this.timers.clearTimeout(this.settleTimer);
    this.failing = false;
    if (!on) {
      this.stopBrowser();
      this.timers.clearTimeout(this.askTimer);
      if (this.useApp) {
        this.tellAsking(false);
        await this.bridge.voiceStop?.();
      }
      this.setStatus("off", "Voice off");
      return;
    }
    const why = this.unavailableReason;
    if (why) {
      this.setStatus("unavailable", why);
      return;
    }
    this.setStatus("starting", "Voice starting");
    if (this.useApp) {
      // (Its grammar is made as it starts: with the More voice commands or without.)
      await this.tellExtras();
      const r = await this.bridge.voiceStart();
      if (!r?.ok && this.enabled) this.setStatus("unavailable", r?.reason ?? "Speech didn't start");
      else if (this.enabled) this.watchAsking();
      return;
    }
    this.startBrowser();
  }

  // ---- A question on screen, for the Windows app ------------------------------

  // What's waiting for a bare answer now (waiting(), and a club check's ask).
  waitingNow() {
    let waiting = {};
    try {
      waiting = { ...this.waiting?.() };
    } catch {
      // Nothing waits, then.
    }
    // A club check asking through ask() (below) takes its answers.
    if (this.answer && !waiting.card) waiting.card = "check";
    return waiting;
  }
  // Whether a question shows (sim/voicecmd.mjs askingNow), told to the
  // Windows app each time it changes, every ASK_POLL_MS while voice is on:
  // its listener then hears a club on its own as well ("ask-club"), as just
  // after the wake word - the browser hears everything anyway.
  watchAsking() {
    this.timers.clearTimeout(this.askTimer);
    if (!this.enabled || !this.useApp) return;
    this.tellAsking(askingNow(this.waitingNow()));
    this.askTimer = this.timers.setTimeout(() => this.watchAsking(), ASK_POLL_MS);
  }
  tellAsking(on) {
    if (this.askingTold === on) return;
    this.askingTold = on;
    Promise.resolve(this.bridge?.voiceAsking?.(on)).catch(() => {});
  }

  // ---- A club check can ask for an answer ------------------------------------

  // While a check ("was that your 7 iron?") is showing, "yes", "no" and "it
  // was a <club>" go to handler({ answer: "yes" | "no" }) or
  // handler({ answer: "club", club }). The rest of the time they're ignored.
  // Returns a function that stops listening for the answer. (The sim's
  // cards answer through waiting() and onCommand instead, every card
  // alike; this stays for a page that only has a club check.)
  ask(handler) {
    this.answer = handler;
    return () => {
      if (this.answer === handler) this.answer = null;
    };
  }

  // The players' names, for "Alex hitting" (sim/voicecmd.mjs hitterCommand):
  // the Windows app's grammar is fixed, so it's told them too.
  setNames(names) {
    this.names = Array.isArray(names) ? [...names] : [];
    Promise.resolve(this.bridge?.voiceNames?.(this.names)).catch(() => {});
  }

  // The More voice commands on or off (extras()), told to the Windows app:
  // without them its grammar is a few hundred phrases rather than
  // thousands, so what's said is fitted to fewer wrong ones. (A browser
  // writes everything down anyway: hear() leaves them out.)
  tellExtras() {
    return Promise.resolve(this.bridge?.voiceExtras?.(this.extrasOn())).catch(() => {});
  }
  extrasOn() {
    try {
      return this.extras?.() !== false;
    } catch {
      return true;
    }
  }

  // ---- What was heard ---------------------------------------------------------

  // What a phrase would do: a parse result, or null to ignore it. words:
  // the Windows app's score for each word; grammar: the Windows app's
  // grammar it was heard in (its "note-text" is a note).
  // woken: as if said straight after a wake word, whatever the owner's (a
  // video's own words: "seven iron" alone is a club then, as after
  // "Caddie" - with the wake word off it needs "club picked").
  parse(text, confidence, source, { words = null, grammar = null, force = false, awake = false, woken = false } = {}) {
    if (!this.enabled && !force) return null;
    const waiting = this.waitingNow();
    return hear(text, { confidence, source, words, grammar, waiting, wake: this.wakeList() ?? (woken ? WAKE_WORDS.caddie : null), awake: awake || woken || this.awake, players: this.names, extras: this.extrasOn() });
  }

  // The wake word's phrases, or null when commands need none.
  wakeList() {
    try {
      const list = this.wake?.();
      return Array.isArray(list) && list.length ? list : null;
    } catch {
      return null;
    }
  }
  // The wake word was just said on its own: what's said next is a command.
  get awake() {
    return this.now() < this.awakeUntil;
  }

  // Does what a parsed phrase asks, and shows what was heard: gold when it
  // was done (a club taken, a card answered, a note kept), amber when it was
  // heard but couldn't be (a club that doesn't fit here, no club caught,
  // an answer that isn't one for the card showing).
  act(r, text) {
    if (!r) return;
    if (r.woke) {
      // On its own: listening for the command, for a few seconds.
      const ms = (r.seconds ?? WAKE_SECONDS) * 1000;
      this.awakeUntil = this.now() + ms;
      this.setStatus("heard", `Heard: ${text} - say the command`, "Yes?");
      this.timers.clearTimeout(this.heardTimer);
      this.heardTimer = this.timers.setTimeout(() => this.enabled && this.status.short === "Yes?" && this.setStatus("listening", "Listening"), ms);
      return;
    }
    if (r.unclear) {
      // (Only after the wake word said first: speech without it is never
      // shown - hear() gives null for it.)
      const why = `Didn't catch that: "${r.unclear}"`;
      this.onMiss(why);
      this.setStatus("missed", `Heard: ${text} - ${why}`, "Didn't catch that");
    } else if (r.extra) {
      const why = "That's one of the More voice commands - Menu, Sound & voice turns them on";
      this.onMiss(why);
      this.setStatus("missed", `Heard: ${text} - ${why}`, "More voice commands are off");
    } else if (r.unknown) {
      const why = unknownMessage(r.unknown);
      this.onMiss(why);
      this.setStatus("missed", `Heard: ${text} - ${why}`, "Didn't catch a club");
    } else if (r.club && !r.answer) {
      const done = this.onClub(r.club, text) ?? {};
      if (done.why) this.setStatus("missed", `Heard: ${text} - ${done.why}`, done.why);
      else this.setStatus("heard", `Heard: ${text}`, `Heard: ${done.name ?? r.club}`);
    } else if (this.confirm && r.confirm == null && !r.confirmed && !doneAtOnce(r)) {
      // Anything but a club or a card's answer, asked about first (in a
      // message: app.js askVoice): done only when it's agreed to.
      const run = () => this.act({ ...r, confirmed: true }, text);
      this.confirm(r, text, run);
      this.setStatus("heard", `Heard: ${text} - say "confirm" to do it`, "Say confirm?");
      this.awakeUntil = 0;
      return;
    } else if (r.answer && this.answer) {
      const { confirmed, ...said } = r;
      this.answer(said);
      this.setStatus("heard", `Heard: ${text}`, `Heard: ${r.answer}`);
    } else {
      let done;
      try {
        const { confirmed, ...said } = r;
        done = this.onCommand(said, text) ?? {};
      } catch (err) {
        done = { why: `Couldn't do that: ${err.message}` };
      }
      if (done.why) this.setStatus("missed", `Heard: ${text} - ${done.why}`, done.why);
      else this.setStatus("heard", `Heard: ${text}${done.done ? ` - ${done.done}` : ""}`, done.short ?? `Heard: ${text}`);
    }
    // A command taken: the wake word is needed again for the next.
    this.awakeUntil = 0;
    this.timers.clearTimeout(this.heardTimer);
    this.heardTimer = this.timers.setTimeout(() => this.enabled && /heard|missed/.test(this.status.state) && this.setStatus("listening", "Listening"), HEARD_MS);
  }

  // True if it was acted on.
  heard(text, confidence, source, extra) {
    const r = this.parse(text, confidence, source, extra);
    this.act(r, text);
    return Boolean(r);
  }

  // A phrase as though a recogniser had heard it, voice on or not: the
  // page's test hook (window.golfsim.hear) and the console's. It goes the
  // same way as anything heard - the same parsing, the same "only while a
  // card asks" and the same confidence bars (a Windows app score of 0.95
  // unless given). Returns what it was taken as, or null.
  // (A script's words aren't speech: done without the box, unless ask is
  // set.)
  inject(text, { confidence = 0.95, source = "app", words = null, ask = false, woken = false } = {}) {
    // (A script's words need no wake word either.)
    const r = this.parse(text, confidence, source, { words, force: true, awake: true, woken });
    this.act(r && !ask ? { ...r, confirmed: true } : r, text);
    return r;
  }

  // ---- The Windows app -----------------------------------------------------

  fromApp(msg) {
    if (!this.enabled || !msg) return;
    if (msg.type === "heard") this.heard(msg.text, msg.confidence, "app", { words: msg.words ?? null, grammar: msg.grammar ?? null });
    // (With a wake word, a note's only listened for once it was said with
    // it: the app listens anyway, and what it writes down is dropped.)
    else if (msg.type === "note") (!this.wakeList() || this.awake) && this.noteListening(msg.state === "listening");
    else if (msg.type === "notice") this.onNotice(msg.reason);
    else if (msg.type === "ready") this.setStatus("listening", "Listening");
    else if (msg.type === "starting" || msg.type === "restarting") this.setStatus("starting", "Voice starting");
    else if (msg.type === "error" && msg.fatal) this.setStatus("unavailable", `${msg.reason} - trying again shortly`);
  }

  // A note in the Windows app is said in two goes (sim/voicecmd.mjs
  // NOTE_START): its wake words heard, it says to say the note now, until
  // the note comes (or NOTE_SECONDS pass, when the app says none came).
  noteListening(on) {
    this.timers.clearTimeout(this.heardTimer);
    this.onNote(on);
    if (on) {
      this.setStatus("heard", "Heard: shot note - say your note now", "Say your note");
      this.heardTimer = this.timers.setTimeout(() => this.enabled && this.status.short === "Say your note" && this.setStatus("listening", "Listening"), (NOTE_SECONDS + 2) * 1000);
      return;
    }
    const say = this.wakeList() ? `${this.wakeName?.() ?? "the wake word"}, shot note` : "shot note";
    this.setStatus("missed", `No note heard - say "${say}", then the note`, "No note heard");
    this.heardTimer = this.timers.setTimeout(() => this.enabled && /heard|missed/.test(this.status.state) && this.setStatus("listening", "Listening"), HEARD_MS);
  }

  // ---- A browser ------------------------------------------------------------

  startBrowser() {
    if (!this.enabled || this.rec) return;
    const rec = new this.Recognition();
    this.rec = rec;
    rec.continuous = true;
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    rec.lang = this.lang;
    let retryMs = 300;
    const listening = () => {
      this.failing = false;
      if (!/heard|missed/.test(this.status.state)) this.setStatus("listening", "Listening");
    };
    rec.onstart = () => {
      // Trying again after an error: it only counts as listening once it
      // has gone a few seconds without failing, so a page with no internet
      // doesn't flash "Listening" every time it retries.
      if (!this.failing) return listening();
      this.timers.clearTimeout(this.settleTimer);
      this.settleTimer = this.timers.setTimeout(() => this.rec === rec && listening(), SETTLE_MS);
    };
    rec.onresult = (e) => {
      for (let i = e.resultIndex ?? 0; i < e.results.length; i++) {
        const result = e.results[i];
        if (!result.isFinal) continue;
        if (this.failing) listening();
        // The second or third guess is sometimes the right one ("club
        // picked 7 iron" after "club pick seven I earn"), so a club in any
        // of them wins over "didn't catch a club" in the first.
        let best = null;
        for (let j = 0; j < result.length; j++) {
          const alt = result[j];
          // Chrome gives 0 when it has no score, not when it's sure it's wrong.
          const r = this.parse(alt.transcript, alt.confidence > 0 ? alt.confidence : null, "browser");
          if (r && !r.unknown) {
            best = { r, text: alt.transcript };
            break;
          }
          if (r && !best) best = { r, text: alt.transcript };
        }
        if (best) this.act(best.r, best.text);
      }
    };
    rec.onerror = (e) => {
      const why = {
        "not-allowed": "Microphone blocked - allow it for this page in the browser",
        "service-not-allowed": "Speech recognition blocked in this browser",
        "audio-capture": "No microphone found",
        network: "Browser speech needs internet - the Windows app works offline",
        "language-not-supported": "This browser can't recognise English speech",
      }[e.error];
      if (!why) return; // no-speech, aborted: just carry on listening.
      this.failing = true;
      this.timers.clearTimeout(this.settleTimer);
      this.setStatus("unavailable", why);
      // Blocked stays blocked until the person changes it; the rest may
      // come right (a microphone plugged in, the internet back).
      retryMs = /blocked|can't/.test(why) ? null : 10000;
    };
    // Browsers stop listening every so often by themselves; start again
    // for as long as voice is on.
    rec.onend = () => {
      if (this.rec === rec) this.rec = null;
      if (!this.enabled || retryMs == null) return;
      this.restartTimer = this.timers.setTimeout(() => this.startBrowser(), retryMs);
    };
    try {
      rec.start();
    } catch (err) {
      this.rec = null;
      this.setStatus("unavailable", `Speech didn't start: ${err.message}`);
    }
  }

  stopBrowser() {
    const rec = this.rec;
    this.rec = null;
    if (!rec) return;
    rec.onend = null;
    try {
      if (rec.abort) rec.abort();
      else rec.stop?.();
    } catch {
      // Already stopped.
    }
  }
}
