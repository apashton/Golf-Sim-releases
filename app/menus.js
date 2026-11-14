// The menu's bindings: every setting in sim/menu.mjs's plan tied to what
// it does in the game (get/set/run/options...). Split out of app.js, which
// calls bindMenus() where the bindings used to be made; everything here
// still lives in app.js (imported back from it) - this only holds the list.

import { DEFAULT_WAKE, WAKE_CHOICES, WAKE_NAMES } from "../sim/voicecmd.mjs";
import { FORMATS, FORMAT_NAMES } from "../sim/recording.mjs";
import { NAMES as GRAPHICS_NAMES, chooseFixed } from "../sim/graphics.mjs";
import { HINT_TIMES, TIPS, hintsLeft, resetHints } from "../sim/keyhints.mjs";
import { LEVEL, savedGraphics, setQuality } from "../look/quality.js";
import { LINE_NAMES } from "../sim/puttguide.mjs";
import { PIN_CHOICES } from "../sim/pinday.mjs";
import { PRESET_NAMES, choosePreset, readEffects } from "../sim/effects.mjs";
import { SCORED } from "../sim/practiceplan.mjs";
import { SHORTCUTS } from "../bay.js";
import { SKY_CHOICES, SKY_CHOICE_NAMES, SKY_KINDS, TEMP_CHOICES, TEMP_CHOICE_NAMES, WIND_CHOICES, WIND_CHOICE_NAMES, cleanSky } from "../sim/weather.mjs";
import { TIME_CHOICES, TIME_CHOICE_NAMES, cleanTime } from "../sim/daylight.mjs";
import { LEVELS, LEVEL_ORDER, levelName, PUTT_HELP, PUTT_ORDER, TEMPOS, TEMPO_ORDER, RANKED, DRIVES, DRIVE_FROM } from "../sim/swinglevels.mjs";
import { audio } from "../audio/engine.js";
import { celebrationFx, setCelebrationFx } from "../celebrationfx.js";
import { view as camera } from "../view.js";
import { history } from "../sim/changelog.mjs";
import { esc, loadSetting, saveSetting } from "../util.js";
import { friendsShots } from "../sim/netflights.mjs";
import { canRestartRound, canEndRound } from "../sim/roundkeys.mjs";
import { offsetWords } from "../sim/viewoffset.mjs";
import { omniStatusLine } from "../omni.js";
import { monitorById, monitorChoices, setupSteps, measuresLine, monitorName } from "../sim/launchmonitors.mjs";
import { profileNames } from "../sim/profiles.mjs";
import { PHONE_MENU_OFF } from "../sim/phoneroutes.mjs";
import { checkAppUpdate } from "../appupdate.js";
import { checkedWords } from "../sim/appupdate.mjs";
import { WEB_MENU_OFF } from "../sim/webapp.mjs";
import { phoneHome } from "../phonehome.js";
import { setUiStyle, setBigBars, bigBars, BIG_SCREEN } from "../uistyle.js";
import { tuftsLight, setLightTufts } from "../look/tuftfield.js";
import { puttLine, setLineLevel, setPlaysLike, setGridColours } from "../puttline.js";
import { sizeText } from "../limits.js";
import { mountLegal } from "../legal.js";
import { MODE_NAMES, addPlayer, levelDistanceWords, appBridge, askWho, bay, signIn, busy, carryWords, changeEffects, controller, courseAirSet, endRangeSession, inRangeSession, startRangeSession, editBlank, effectBinding, frameRate, gameFullscreen, gameLayout, hasTurns, hints, holesFolderBinding, keptHoles, lastStatus, launchMonitor, layout, leaving, limitBinding, menu, mode, modes, mouseSwing, onlineOwnCarry, onlinePanel, ownCarryPercent, openMenu, openPage, openPlayers, openWho, panelOptions, panelSet, picture, playMode, practicePlan, profiles, readKeptHoles, recorder, recording, recordingsFolderBinding, rendererTest, roundCards, saveReplay, screens, setBay, setCarryPercent, setHighestGraphics, setHints, setLaunchMonitor, setMode, setMouseSwing, setPictureCentre, levelProgressLine, setSwingAutoUp, setSwingCustom, setSwingLevel, showCameras, skillsCard, sideFold, showVideo, sidePanel, soundPanel, speedTest, statusEl, stillSetting, stimpWords, swingReplay, system, barFold, toggleCamera, toggleFullscreen, toggleScreens, toggleVideo, toggleVoice, reel, video, videoPanel, voice, voiceMore, setVoiceMore, voiceWake, wakeName, wakePicture, welcome } from "../app.js";
import { phoneTurn, setPhoneTurn } from "../upright.js";
import { TURN_WAYS, TURN_NAMES } from "../sim/upright.mjs";

const sys = (part) => (system ? { mount: (el) => system.mount(el, part) } : null);

// The carry adjustment's line under its slider: what's in force, or that
// an online round's host has everyone on A² Golf's own for now.
const carryNote = () => {
  if (onlineOwnCarry()) return "This online game: A² Golf's own carries for everyone (the host's rule) - yours comes back after it";
  const pct = ownCarryPercent();
  return pct ? `In force now: ${carryWords(pct)}` : "";
};

// Every menu setting bound to what it does (sim/menu.mjs has the plan).
export function bindMenus() {
  menu.bindAll({
    // Play
    mode: { get: () => mode, set: (m) => (m !== mode ? (setMode(m), `${MODE_NAMES[m]}`) : "") },
    // The phone's range session with a launch monitor, and back to phone
    // play (app.js startRangeSession, endRangeSession; sim/phoneroutes.mjs).
    "range-session": { available: () => playMode.inApp && !inRangeSession(), button: "Start", run: () => (menu.show(false), startRangeSession()) },
    "phone-play": { available: () => inRangeSession(), button: "End", run: () => (menu.show(false), endRangeSession()) },
    // The phone app: is a newer one out, asked now (appupdate.js: it looks
    // by itself too). What it found is said in the menu; a newer one's card
    // is over the picture, so the menu steps aside for it.
    "app-update": {
      available: () => playMode.inApp && !window.a2web,
      button: "Check",
      run: async () => {
        menu.say("Looking for a newer A² Golf...");
        const words = checkedWords(await checkAppUpdate({ asked: true }));
        if (!words) menu.show(false);
        return words ?? "";
      },
    },
    "mouse-swing": { get: () => mouseSwing.on, set: (on) => (setMouseSwing(on), on ? "Mouse swing on - the swing pad is on the right" : "Mouse swing off") },
    controller: {
      get: () => controller.on,
      set: (on) => {
        controller.on = !!on;
        saveSetting("controller", controller);
        return on ? "Game controller on - right stick to swing" : "Game controller off";
      },
    },
    "controller-rumble": {
      get: () => controller.rumble !== false,
      set: (on) => ((controller.rumble = !!on), saveSetting("controller", controller), on ? "Controller rumble on" : "Controller rumble off"),
    },
    "swing-level": {
      get: () => mouseSwing.level,
      options: () => LEVEL_ORDER.map((v) => ({ value: v, label: `${LEVELS[v].label} - ${LEVELS[v].help}` })),
      set: (v) => (setSwingLevel(v), `Mouse and controller: ${levelName(v)}`),
      // What it drives and carries (the owner: "show the user ... how the
      // level picks default and maximum distances you can shoot").
      // And how far whoever's hitting is towards the next (the owner: "once
      // they're getting two good scores ... put them up into a new level").
      note: () => [levelDistanceWords(), levelProgressLine()].filter(Boolean).join("\n"),
    },
    // Two good rounds at a level and up one (app.js recorder.onMadeUpRound).
    "swing-climb": {
      get: () => mouseSwing.autoUp !== false,
      set: (on) => (setSwingAutoUp(on), on ? "Moving up a level after two good rounds" : "The level stays as you set it"),
    },
    skills: { button: "Skill points...", run: () => (menu.show(false), void skillsCard.show(true), "") },
    "swing-custom-faults": { get: () => mouseSwing.custom.faults, set: (v) => (setSwingCustom({ faults: Number(v) }), ""), words: (v) => `${Number(v).toFixed(2)}x` },
    "swing-custom-mark": { get: () => mouseSwing.custom.mark, set: (on) => (setSwingCustom({ mark: !!on }), "") },
    "swing-custom-snap": { get: () => mouseSwing.custom.snap, set: (on) => (setSwingCustom({ snap: !!on }), "") },
    "swing-custom-putt": { get: () => mouseSwing.custom.putt, options: () => PUTT_ORDER.map((v) => ({ value: v, label: PUTT_HELP[v] })), set: (v) => (setSwingCustom({ putt: v }), "") },
    "swing-custom-tempo": { get: () => mouseSwing.custom.tempo, options: () => TEMPO_ORDER.map((v) => ({ value: v, label: TEMPOS[v].label })), set: (v) => (setSwingCustom({ tempo: v }), "") },
    "swing-custom-drive": {
      get: () => mouseSwing.custom.drive,
      options: () => RANKED.map((v) => ({ value: v, label: `${LEVELS[v].label}'s: drives ${Math.round(DRIVES[v] * DRIVE_FROM)}-${DRIVES[v]} yds` })),
      set: (v) => (setSwingCustom({ drive: v }), ""),
    },
    // The game's video (showreel.js): it starts at once.
    "record-video": { button: "Record", run: () => (menu.show(false), void reel.offer()) },
    welcome: { run: () => (menu.show(false), welcome.show(true).then(() => screens.focusControls())) },
    // The round in progress, on the course (sim/roundkeys.mjs).
    "round-restart": { available: () => mode === "course" && canRestartRound(modes.course.round), button: "Restart", run: () => (menu.show(false), modes.course.restartRound(), "") },
    "course-mulligans": { get: () => !!modes.course.settings.mulligans, set: (on) => (panelSet("#course-mulligans", on), on ? "Mulligans on - Shift + M takes the last stroke back" : "No mulligans") },
    "round-mulligan": { available: () => mode === "course" && !!modes.course.round && !modes.course.round.finished, button: "Mulligan", run: () => (menu.show(false), modes.course.mulligan(), "") },
    "round-end": { available: () => mode === "course" && canEndRound(modes.course.round), button: "End it", run: () => (menu.show(false), modes.course.endRound(), "") },
    hitter: {
      available: () => !hasTurns(),
      get: () => recorder.hitter,
      options: () => [...recorder.players.map((n) => ({ value: n, label: n })), { value: "__add", label: "Who's playing..." }],
      set: (v) => {
        if (v === "__add") {
          menu.show(false);
          return addPlayer();
        }
        recorder.hitter = v;
        modes.range.showLieGuide();
        return `${v} hitting`;
      },
    },
    accounts: { button: "Signed in...", run: () => (menu.show(false), signIn.switcher()), available: () => signIn.ready },
    players: { button: "Who's playing...", run: () => openWho(), note: () => recorder.players.join(", ") },
    "saved-players": { button: "Saved players...", run: () => openPlayers(), note: () => profileNames(profiles).join(", ") },
    "ask-players": {
      get: () => askWho(),
      set: (on) => (saveSetting("askPlayers", !!on), on ? "Asks who's playing when the game starts" : "Starts with whoever played last"),
    },
    "key-tips": {
      get: () => !hints.off,
      set: (on) => {
        setHints({ ...hints, off: !on });
        if (!on) bay.showHint(null);
        return on ? "Key tips on - one now and then" : "Key tips off";
      },
      note: () => {
        const left = hintsLeft(hints);
        return left === TIPS.length ? "" : `${TIPS.length - left} dismissed`;
      },
    },
    "key-tips-reset": {
      button: "Show them all again",
      run: () => {
        setHints({ ...resetHints(hints), off: false, started: Date.now() - HINT_TIMES.first });
        menu.refresh(["key-tips"]);
        return "Every key tip will show again";
      },
    },
    recording: { get: () => recording.format, options: () => FORMATS.map((f) => ({ value: f, label: FORMAT_NAMES[f] })), set: (f) => (recording.set(f), `Keeping the shots: ${FORMAT_NAMES[f]}`) },
    // Ball flight
    "carry-percent": { get: () => ownCarryPercent(), set: (v) => setCarryPercent(v), words: carryWords, note: carryNote },
    "course-wind": {
      get: () => modes.course.settings.wind ?? "calm",
      options: () => WIND_CHOICES.map((v) => ({ value: v, label: WIND_CHOICE_NAMES[v] })),
      set: (v) => (panelSet("#course-wind", v), `The next round: ${WIND_CHOICE_NAMES[v].toLowerCase()}`),
    },
    "course-temp": {
      get: () => modes.course.settings.temp ?? "mild",
      options: () => TEMP_CHOICES.map((v) => ({ value: v, label: TEMP_CHOICE_NAMES[v] })),
      set: (v) => (panelSet("#course-temp", v), `The next round: ${TEMP_CHOICE_NAMES[v].toLowerCase()}`),
    },
    "course-sky": {
      get: () => modes.course.settings.sky ?? "fair",
      options: () => SKY_CHOICES.map((v) => ({ value: v, label: SKY_CHOICE_NAMES[v] })),
      set: (v) => (panelSet("#course-sky", v), `The next round: ${SKY_CHOICE_NAMES[v].toLowerCase()}`),
    },
    "course-time": {
      get: () => cleanTime(modes.course.settings.time),
      options: () => TIME_CHOICES.map((v) => ({ value: v, label: TIME_CHOICE_NAMES[v] })),
      set: (v) => (panelSet("#course-time", v), `The next round: ${TIME_CHOICE_NAMES[v].toLowerCase()}`),
    },
    "range-time": {
      get: () => cleanTime(modes.range.settings.time),
      options: () => TIME_CHOICES.map((v) => ({ value: v, label: v === "any" ? "Any - a surprise each visit" : TIME_CHOICE_NAMES[v] })),
      set: (v) => (panelSet("#range-time", v), `The range's light: ${v === "any" ? "a surprise each visit" : TIME_CHOICE_NAMES[v].toLowerCase()}`),
    },
    "range-sky": {
      get: () => cleanSky(modes.range.settings.sky),
      options: () => SKY_KINDS.map((v) => ({ value: v, label: SKY_CHOICE_NAMES[v] })),
      set: (v) => (panelSet("#range-sky", v), `The range's sky: ${SKY_CHOICE_NAMES[v].toLowerCase()}`),
    },
    "range-wind": { get: () => modes.range.settings.windMph ?? 0, set: (v) => (panelSet("#range-wind", v), v ? `The range: ${v} mph of wind` : "No wind on the range") },
    "range-wind-from": {
      get: () => String(modes.range.settings.windFrom ?? 0),
      options: () => [...(sidePanel.querySelector("#range-wind-from")?.options ?? [])].map((o) => ({ value: o.value, label: o.textContent })),
      set: (v) => (panelSet("#range-wind-from", v), ""),
    },
    temperature: { get: () => modes.range.settings.temperatureC, set: (v) => (panelSet("#range-temp", v), `The range flies at ${v} °C`) },
    altitude: { get: () => modes.range.settings.altitudeM, set: (v) => (panelSet("#range-alt", v), `The range is ${v} m up`) },
    humidity: { get: () => modes.range.settings.humidity ?? 0, set: (v) => (panelSet("#range-hum", v), v ? `The range's air: ${v}% humidity` : "The range's air: dry") },
    "course-altitude": { get: () => modes.course.settings.altitudeM ?? 0, set: (v) => (courseAirSet("altitudeM", v), v ? `The next round: ${v} m up` : "The next round: at sea level") },
    "course-humidity": { get: () => modes.course.settings.humidity ?? 0, set: (v) => (courseAirSet("humidity", v), v ? `The next round: ${v}% humidity` : "The next round: dry air") },
    // Greens
    "putt-line": {
      get: () => puttLine.level,
      options: () => Object.entries(LINE_NAMES).map(([value, label]) => ({ value, label })),
      set: (v) => (setLineLevel(v), `Ideal line: ${LINE_NAMES[v].toLowerCase()}`),
    },
    "plays-like": { get: () => puttLine.playsLike, set: (on) => (setPlaysLike(on), on ? "Plays-like said before each putt" : "Plays-like said after the putt") },
    "course-grid": { get: () => modes.course.settings.grid, set: (on) => (panelSet("#course-grid", on), "") },
    "grid-colours": { get: () => puttLine.gridColours, set: (on) => (setGridColours(on), on ? "The grid in colour" : "The grid plain white") },
    "course-shade": { get: () => modes.course.settings.shade, set: (on) => (panelSet("#course-shade", on), "") },
    "course-grain": { get: () => modes.course.settings.grain !== false, set: (on) => (panelSet("#course-grain", on), on ? "Grain on the greens, from the next hole" : "No grain on the greens, from the next hole") },
    "course-pins": {
      get: () => modes.course.settings.pins ?? "fixed",
      options: () => Object.entries(PIN_CHOICES).map(([value, label]) => ({ value, label })),
      set: (v) => (panelSet("#course-pins", v), v === "daily" ? "The cups move every day, from the next round" : "Each hole's own pin, from the next round"),
    },
    "course-lookdown": { get: () => !!modes.course.settings.lookDown, set: (on) => (panelSet("#course-lookdown", on), on ? "A look down each hole as it starts" : "Straight to the tee") },
    "course-hole-card": {
      get: () => modes.course.settings.holeCard !== false,
      set: (on) => {
        modes.course.settings.holeCard = !!on;
        saveSetting("course", modes.course.settings);
        return on ? "The scorecard for 10 seconds after each hole" : "Straight on to the next hole";
      },
    },
    "course-cart-ride": {
      get: () => modes.course.settings.cartRide !== false,
      set: (on) => {
        modes.course.settings.cartRide = !!on;
        saveSetting("course", modes.course.settings);
        return on ? "The cart to the next tee, the scorecard on its screen" : "The scorecard over the picture after each hole";
      },
    },
    "course-flyover": { get: () => modes.course.settings.autoFlyover !== false, set: (on) => (panelSet("#course-autoflyover", on), on ? "Flyover after each hole" : "Flyover when asked for (J)") },
    gimme: { get: () => modes.course.settings.gimme, set: (v) => (panelSet("#course-gimme", v), v ? `Putts inside ${v} ft are given` : "No gimmes") },
    "stimp-putting": { get: () => modes.putting.settings.stimp, set: (v) => (panelSet("#putt-stimp", v), `Putting green: stimp ${v}`), words: stimpWords },
    // The putting green's practice: the green itself and the aim.
    "putt-distance": {
      get: () => modes.putting.settings.distanceFt,
      options: () => [...(sidePanel.querySelector("#putt-distance")?.options ?? [])].map((o) => ({ value: o.value, label: o.textContent })),
      set: (v) => (panelSet("#putt-dist-mode", "fixed"), panelSet("#putt-distance", v), `Putting from ${v} ft`),
      note: () => (modes.putting.settings.distanceMode === "random" && modes.putting.settings.next !== "ladder" ? `A random distance each putt (${Math.min(modes.putting.settings.minFt, modes.putting.settings.maxFt)} - ${Math.max(modes.putting.settings.minFt, modes.putting.settings.maxFt)} ft) - choosing one here stops that` : modes.putting.settings.next === "ladder" ? "The ladder sets the distance" : null),
    },
    "putt-uphill": { get: () => modes.putting.settings.uphill, options: () => panelOptions("#putt-uphill"), set: (v) => (panelSet("#putt-uphill", v), "") },
    "putt-side": { get: () => modes.putting.settings.fallRight, options: () => panelOptions("#putt-side"), set: (v) => (panelSet("#putt-side", v), "") },
    "putt-contours": { get: () => modes.putting.settings.contours, options: () => panelOptions("#putt-contours"), set: (v) => (panelSet("#putt-contours", v), "") },
    "putt-severity": { get: () => modes.putting.settings.severity, options: () => panelOptions("#putt-severity"), set: (v) => (panelSet("#putt-severity", v), "") },
    "putt-random": {
      buttons: () => [
        { value: "random", label: "New random green", primary: true },
        { value: "flat", label: "Flat green" },
      ],
      run: (v) => (v === "flat" ? modes.putting.flatGreen() : modes.putting.randomPutt(), modes.putting.plainDescription()),
    },
    "putt-next": { get: () => modes.putting.settings.next, options: () => panelOptions("#putt-next"), set: (v) => (panelSet("#putt-next", v), "") },
    "putt-cup": { get: () => modes.putting.settings.cup, options: () => panelOptions("#putt-cup"), set: (v) => (panelSet("#putt-cup", v), "") },
    "putt-aim": {
      note: () => modes.putting.aimWordsNow?.() ?? null,
      buttons: () => [
        { value: "left", label: "◀ A cup left" },
        { value: "hole", label: "At the hole" },
        { value: "read", label: "At the read" },
        { value: "right", label: "A cup right ▶" },
      ],
      run: (v) => {
        const p = modes.putting;
        if (v === "hole") p.aimAtHole();
        else if (v === "read") p.aimAtRead();
        else p.aimCups(v === "left" ? -1 : 1);
        return p.aimWordsNow();
      },
    },
    "stimp-chipping": { get: () => modes.chipping.settings.stimp, set: (v) => (panelSet("#chip-stimp", v), `Chipping green: stimp ${v}`), words: stimpWords },
    "stimp-course": { get: () => modes.course.settings.stimp, set: (v) => (panelSet("#course-stimp", v), `Course greens: stimp ${v}`), words: stimpWords },
    // Launch monitor
    "play-mode": {
      available: () => playMode.inApp,
      get: () => playMode.mode,
      set: (v) => (playMode.set(v), v === "touch" ? "Touch screen: swing on the pad" : "Launch monitor: A² Golf looks for it over Bluetooth"),
    },
    "monitor-kind": {
      // (Not in the Android app: it has the Omni over Bluetooth only.)
      available: () => !playMode.inApp,
      get: () => launchMonitor,
      options: () => monitorChoices(),
      set: (v) => (setLaunchMonitor(v), menu.refresh(["monitor-setup"]), v === "omni" ? "Square Omni: A² Golf connects to it over Bluetooth" : `${monitorById(v).name}: the steps are below`),
    },
    "monitor-setup": {
      available: () => !playMode.inApp,
      mount: (el) => {
        const m = monitorById(launchMonitor);
        const s = lastStatus ?? {};
        const port = (s.ports ?? []).find((p) => p.state === "listening")?.port ?? 921;
        const steps = setupSteps(m.id, { addresses: s.addresses ?? [], port, e6Port: s.e6?.port ?? 2483 });
        // What's connected now, by the name each launch monitor's program gives.
        const now = (s.connectorList ?? []).map((c) => monitorName(c.deviceId ?? (c.protocol === "e6" ? "Garmin Golf app" : null)));
        const e6Problem = m.route === "e6" && s.e6 && s.e6.state !== "listening" ? `<p class="warn-line small">A² Golf couldn't listen for the Garmin Golf app: ${esc(s.e6.error ?? s.e6.state)}</p>` : "";
        el.innerHTML =
          `<p class="small"><b>${esc(m.name)}</b>${m.via ? ` - through ${esc(m.via)}` : ""}${m.fixed ? " (on this PC only)" : ""}.</p>` +
          `<ol class="monitor-steps small">${steps.map((t) => `<li>${esc(t)}</li>`).join("")}</ol>` +
          (m.route === "none" ? "" : `<p class="muted small">${esc(measuresLine(m.id))}.${m.note ? ` ${esc(m.note)}` : ""}</p>`) +
          e6Problem +
          (now.length ? `<p class="small"><span class="dot ok"></span> Connected now: ${esc(now.join(", "))}</p>` : "");
      },
    },
    connection: {
      mount: (el) => {
        const line = lastStatus ? omniStatusLine(lastStatus.omni) : null;
        const text = statusEl.title || statusEl.textContent;
        // The top bar's own colour: ok (green), warn (amber) or off (showStatus).
        const cls = ["ok", "warn", "off"].find((c) => statusEl.classList.contains(c)) ?? line?.cls ?? "off";
        el.innerHTML = `<p class="ch-state"><span class="dot ${esc(cls)}"></span> ${esc(text)}</p>`;
      },
    },
    diagnostics: { button: "Open", run: () => openPage("/diagnostics.html") },
    "bar-pin": {
      available: () => playMode.inApp,
      get: () => !!barFold?.pinned,
      set: (on) => (barFold.setPinned(on), on ? "The top bar stays" : "The top bar slides away as you play - pull down from the top for it"),
    },
    // How the app turns with the phone (upright.js): the app only.
    "phone-turn": {
      available: () => playMode.inApp,
      get: () => phoneTurn(),
      options: () => TURN_WAYS.map((v) => ({ value: v, label: TURN_NAMES[v] })),
      set: (v) => (setPhoneTurn(v), TURN_NAMES[phoneTurn()]),
    },
    "side-pin": {
      available: () => !screens.separate,
      get: () => !!sideFold?.pinned,
      set: (on) => (sideFold.setPinned(on), on ? "Side panel pinned open" : "Side panel folds away as you play"),
    },
    "omni-page": { available: () => !appBridge && !playMode.inApp, button: "Open", run: () => openPage("/omni.html") },
    omni: sys("omni"),
    // Screens
    // Screens: New or Legacy menus and buttons (uistyle.js), on this page
    // and the controls window, and the menu itself redrawn in it.
    "ui-style": {
      get: () => menu.style,
      set: (v) => {
        const style = setUiStyle(v, [document, screens.win?.document]);
        menu.setStyle(style);
        return style === "new" ? "The new menus and buttons" : "Legacy: the menus and buttons as they were";
      },
    },
    // (Only on a screen big enough for it to do anything: theme.css --big.)
    "big-bars": {
      available: () => matchMedia(BIG_SCREEN).matches,
      get: () => bigBars(),
      set: (on) => (setBigBars(on), window.dispatchEvent(new Event("resize")), on ? "The top bar and side panel drawn larger" : "The top bar and side panel at the screen's own size"),
    },
    screens: { get: () => screens.separate, set: async (on) => (on !== screens.separate ? (menu.show(false), toggleScreens()) : "") },
    arrange: { button: "Arrange...", run: () => (menu.show(false), screens.separate ? layout.edit() : editBlank(document)) },
    "arrange-game": { button: "Arrange...", run: () => (menu.show(false), gameLayout.edit()) },
    "shot-data": { button: "Open", run: () => openPage("/shotscreen.html") },
    "app-window": sys("app-window"),
    "picture-centre": {
      live: true,
      get: () => Math.round(picture.centre * 100),
      set: (v) => setPictureCentre(v / 100),
      words: (v) => offsetWords(v / 100),
    },
    "bay-view": {
      available: () => !screens.separate,
      get: () => bay.enabled,
      set: (on) => {
        menu.show(false);
        setBay(on);
        toggleFullscreen(on);
      },
    },
    "camera-follow": { get: () => camera.follow, set: (on) => (on !== camera.follow ? (toggleCamera(), "") : "") },
    "full-screen": { button: "Full screen", run: () => (menu.show(false), screens.separate ? gameFullscreen() : toggleFullscreen()) },
    graphics: {
      get: () => savedGraphics().setting,
      set: (v) => {
        if (v === savedGraphics().setting && v === LEVEL) return "";
        const lose = busy();
        if (lose && !confirm(`Change the graphics to ${GRAPHICS_NAMES[v]}? A² Golf reloads to do it, and ${lose} will end.`)) return "";
        leaving(`graphics change to ${GRAPHICS_NAMES[v]}`);
        setTimeout(() => setQuality(v), 400);
        return `Graphics: ${GRAPHICS_NAMES[v]} - reloading`;
      },
    },
    "graphics-fixed": {
      get: () => savedGraphics().fixed,
      set: (on) => {
        saveSetting("graphics", chooseFixed(loadSetting("graphics", {}), on));
        frameRate.setFixed(on);
        return on ? `Graphics stay ${GRAPHICS_NAMES[savedGraphics().setting]}, however slow the picture` : "Graphics turn down by themselves while the picture is slow";
      },
    },
    "graphics-highest": {
      get: () => savedGraphics().highest,
      set: (v) => setHighestGraphics(v),
    },
    "effects-preset": {
      get: () => readEffects(loadSetting("effects", {}), LEVEL).preset,
      set: (v) => changeEffects(choosePreset(loadSetting("effects", {}), v, LEVEL), `Effects: ${PRESET_NAMES[v] ?? v}`),
      note: () => (readEffects(loadSetting("effects", {}), LEVEL).preset === "custom" ? "Your own mix, switched below." : ""),
    },
    "effect-grade": effectBinding("grade"),
    "effect-ao": effectBinding("ao"),
    "effect-fxaa": effectBinding("fxaa"),
    "effect-bloom": effectBinding("bloom"),
    "effect-sky": effectBinding("sky"),
    "effect-haze": effectBinding("haze"),
    "effect-textures": effectBinding("textures"),
    "effect-dof": effectBinding("dof"),
    "effect-shafts": effectBinding("shafts"),
    "effect-focus": effectBinding("focus"),
    "effect-taa": effectBinding("taa"),
    "effect-upscale": effectBinding("upscale"),
    "effect-sway": effectBinding("sway"),
    "effect-evening": effectBinding("evening"),
    "effect-hardsun": effectBinding("hardsun"),
    "effect-grassfield": effectBinding("grassfield"),
    "effect-fineleaves": effectBinding("fineleaves"),
    "effect-clock": effectBinding("clock"),
    "effect-seasons": effectBinding("seasons"),
    "effect-rainground": effectBinding("rainground"),
    "effect-wetshine": effectBinding("wetshine"),
    "light-tufts": { get: () => tuftsLight(), set: (on) => (setLightTufts(on), wakePicture(), on ? "Long grass round you: the lighter blades" : "Long grass round you: the blades as they were") },
    "frame-rate": { get: () => frameRate.on, set: (on) => (frameRate.set(on), on ? "Frame rate on - top right of the picture" : "Frame rate off") },
    "speed-test": {
      buttons: () => [{ value: "run", label: "Run it", primary: true }],
      note: () => speedTest?.note() ?? "",
      run: () => (menu.show(false), speedTest.offer()),
    },
    "renderer-test": {
      buttons: () => [{ value: "run", label: "Run it", primary: true }],
      note: () => rendererTest?.note() ?? "",
      run: () => (menu.show(false), rendererTest.offer()),
    },
    "kept-holes": {
      buttons: () => [{ value: "clear", label: "Clear them", disabled: !(keptHoles?.files > 0) }],
      note: () => (!keptHoles ? "" : keptHoles.files ? `${keptHoles.files} kept${keptHoles.firsts ? ` (${keptHoles.firsts} of them courses' first holes)` : ""}, ${sizeText(keptHoles.bytes)}` : window.pocket ? "None kept yet - each hole's kept the first time it's played" : "None kept yet - each course's first hole is kept in the quiet moments, and every hole the first time it's played"),
      run: async () => {
        const r = await fetch("/api/bakes", { method: "DELETE" });
        if (!r.ok) throw new Error("The local server didn't clear them");
        await readKeptHoles();
        return "Cleared - each hole's built afresh the next time it's played (and the courses' first holes again in the quiet moments)";
      },
    },
    "celebration-effects": {
      get: () => celebrationFx.on,
      set: (on) => (setCelebrationFx(on), on ? "Confetti, streamers and fireworks for the good scores" : "Just the score and the crowd cheering"),
    },
    "still-picture": {
      get: () => stillSetting.on,
      set: (on) => {
        stillSetting.on = !!on;
        saveSetting("still", stillSetting);
        wakePicture();
        return on ? "The picture rests while nothing moves" : "The picture is drawn all the time";
      },
    },
    // Cameras and video
    cameras: { button: "Cameras...", run: () => (menu.show(false), showCameras()) },
    "swing-replay": { button: "Show it", run: () => (menu.show(false), swingReplay.toggle()) },
    "save-replay": { button: "Save it", run: () => saveReplay() },
    "saved-replays": { button: "See them...", run: () => (menu.show(false), showVideo("replays"), (videoPanel.onClose = () => openMenu())) },
    // Over the whole controls window, as the course designer is; closed, back
    // to the menu where it was opened.
    "video-layout": { button: "Layout and scenes...", run: () => (menu.show(false), showVideo(), (videoPanel.onClose = () => openMenu())) },
    "video-rec": { get: () => video.recording, set: async () => (menu.show(false), toggleVideo()) },
    "limit-clips": limitBinding("clips"),
    "limit-sessions": limitBinding("sessions"),
    "recordings-folder": recordingsFolderBinding,
    "holes-folder": holesFolderBinding,
    folders: appBridge
      ? {
          buttons: () => [
            ...(appBridge.openClipsFolder ? [{ value: "clips", label: "Clips folder" }] : []),
            ...(appBridge.openRecordingsFolder ? [{ value: "recordings", label: "Recordings folder" }] : []),
            ...(appBridge.openSoundsFolder ? [{ value: "sounds", label: "Sounds folder" }] : []),
          ],
          run: (v) => (v === "clips" ? appBridge.openClipsFolder() : v === "recordings" ? appBridge.openRecordingsFolder() : appBridge.openSoundsFolder?.()),
        }
      : null,
    // Sound and voice
    "sound-on": { get: () => audio.on, set: (on) => (audio.setOn(on), on ? "Sound on" : "Sound off - A turns it back on") },
    celebrations: { get: () => audio.settings.celebrations, set: (on) => (audio.set("celebrations", !!on), "") },
    "sound-settings": { button: "Sound settings...", run: () => (menu.show(false), soundPanel.show(true), (soundPanel.onClose = () => openMenu())) },
    voice: { get: () => voice.enabled, set: (on) => (toggleVoice(!!on), "") },
    "voice-wake": {
      options: () => WAKE_CHOICES.map((value) => ({ value, label: WAKE_NAMES[value] })),
      get: () => voiceWake.word,
      set: (v) => {
        voiceWake.word = WAKE_CHOICES.includes(v) ? v : DEFAULT_WAKE;
        saveSetting("voiceWake", voiceWake);
        modes.course.renderIntro();
        const name = wakeName();
        return name ? `Say "${name}" before a command - "${name}, seven iron"` : "Commands heard any time, with no word first";
      },
    },
    "voice-more": {
      get: () => voiceMore.on === true,
      set: (on) => (setVoiceMore(!!on), on ? 'More voice commands: notes, powers, replays, scenes, the putting green - each asked about first' : 'Voice is for clubs, the last shot ("last shot seven iron", "last shot mishit") and answers'),
    },
    // Stats
    "my-stats": { button: "Open", run: () => openPage("/stats.html") },
    "online-play": { button: "Open", run: () => (menu.show(false), onlinePanel.show(true, "play"), "") },
    "online-shots": {
      get: () => friendsShots(modes.course.settings.friendsShots),
      set: (v) => {
        modes.course.settings.friendsShots = friendsShots(v);
        saveSetting("course", modes.course.settings);
        return v === "landed" ? "Friends' shots fly in as each lands" : v === "after" ? "Friends' shots wait until after your shot" : "Friends' shots fly in together";
      },
    },
    "round-card": { button: "Show", run: () => (roundCards.cards.length ? (menu.show(false), roundCards.show(true), "") : "No round finished yet - finish a course round and its card shows here") },
    "practice-plan": {
      buttons: () => [{ value: "suggested", label: "My weak spot" }, ...SCORED.map((d) => ({ value: d.id, label: d.name })), ...(practicePlan?.active && !practicePlan.gapping && !practicePlan.warmup ? [{ value: "stop", label: "Stop the drill" }] : [])],
      run: async (v) => {
        menu.show(false);
        if (v === "stop") return practicePlan.stop(), "";
        const d = await practicePlan.start(v);
        return d ? `${d.name}: ten shots` : "";
      },
    },
    warmup: {
      buttons: () => (practicePlan?.warmup ? [{ value: "stop", label: "Stop the warm-up" }] : [{ value: "start", label: "Start" }]),
      run: async (v) => {
        menu.show(false);
        if (v === "stop") return practicePlan.stop(), "";
        await practicePlan.start("warmup");
        return "Warm-up: on the range, then the putting green";
      },
    },
    gapping: {
      buttons: () => (practicePlan?.gapping ? [{ value: "stop", label: "Stop the session" }] : [{ value: "mine", label: "My clubs" }, { value: "all", label: "Every club" }]),
      run: async (v) => {
        menu.show(false);
        if (v === "stop") return practicePlan.stop(), "";
        await practicePlan.start("gapping", { clubs: v });
        return "Gapping session: five good balls a club";
      },
    },
    "stats-restart-all": {
      button: "Start again...",
      run: async () => {
        if (
          !confirm(
            "Start every player's stats again?\n\nEvery player's shots, games and the bests on My stats move into the archive, and everyone starts again from nothing. Nothing is deleted - My stats, Archived stats, brings anyone's back.",
          )
        )
          return "";
        const res = await fetch("/api/stats/restart-all", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
        const r = await res.json();
        if (!res.ok) throw new Error(r.error ?? res.statusText);
        const n = r.archived?.length ?? 0;
        return n ? `Everyone's stats start again: ${n} player${n === 1 ? "'s" : "s'"} moved into the archive` : "No stats to start again yet";
      },
    },
    // System (the Windows app)
    updates: sys("updates"),
    power: sys("power"),
    feedback: sys("feedback"),
    reports: sys("reports"),
    programs: sys("programs"),
    troubleshooting: sys("troubleshooting"),
    // What's new (public/changelog.json, sim/changelog.mjs)
    "version-history": {
      mount: (el) => {
        el.innerHTML = '<p class="ch-log-wait">Reading the update log...</p>';
        readChangelog()
          .then((log) => (el.innerHTML = historyHtml(log, lastStatus?.appVersion ?? "")))
          .catch(() => (el.innerHTML = '<p class="ch-log-wait">The update log couldn\'t be read.</p>'));
      },
    },
    // The licence, privacy and credits (public/legal/, legal.js)
    legal: { mount: (el) => mountLegal(el) },
    // Keys
    "keys-list": {
      mount: (el) => {
        el.innerHTML = `<table class="ch-keys-table">${SHORTCUTS.map(([k, v]) => `<tr><td><kbd>${esc(k)}</kbd></td><td>${esc(v)}</td></tr>`).join("")}</table>`;
      },
    },
  });
  // The phone app's menu: without the PC's bay features, and what a route
  // decides (sim/phoneroutes.mjs PHONE_MENU_OFF).
  if (playMode.inApp) for (const id of PHONE_MENU_OFF) if (menu.bindings.has(id)) menu.bind(id, { ...menu.bindings.get(id), available: () => false });
  // On the web, nor what needs the app's Bluetooth (sim/webapp.mjs).
  if (playMode.inApp && window.a2web) for (const id of WEB_MENU_OFF) if (menu.bindings.has(id)) menu.bind(id, { ...menu.bindings.get(id), available: () => false });
}

// The update log, read once (it's a file of the game's: public/changelog.json).
let changelog = null;
export const readChangelog = () =>
  (changelog ??= fetch("changelog.json").then((r) => {
    if (!r.ok) throw new Error(r.statusText);
    return r.json();
  }).catch((e) => {
    changelog = null;
    throw e;
  }));

// The What's new screen: each version a fold, the current one open at the
// top (a browser's copy, with no app version, also shows what's coming).
export function historyHtml(log, version) {
  const now = version ? `You have A² Golf ${esc(version)}.` : "Running from source: the next version's notes are first.";
  const rows = history(log, version, { unreleased: !version }).map((e) => {
    const tags = [e.current ? '<span class="ch-log-tag now">This version</span>' : "", e.stable ? '<span class="ch-log-tag">Stable</span>' : ""].join("");
    const date = e.date ? `<span class="ch-log-date">${esc(e.date)}</span>` : "";
    const nums = e.versions ? `<p class="ch-log-nums">${e.archived ? "Earlier betas, no longer downloadable: " : ""}${e.versions.map(esc).join(", ")}</p>` : "";
    return `<details class="ch-log"${e.open ? " open" : ""}><summary><b>${esc(e.title)}</b>${tags}${date}</summary>${nums}<ul>${e.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul></details>`;
  });
  return `<div class="ch-log-list"><p class="ch-log-now">${now}</p>${rows.join("")}</div>`;
}
