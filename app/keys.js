// Every key the game takes: onKey (from this window, the controls window
// and the shot data window) and the welcome screen's keys. Split out of
// app.js, which still listens (window keydown -> onKey) and holds the
// state these read; they're imported back from it.

import { NAMES as GRAPHICS_NAMES } from "../sim/graphics.mjs";
import { KEYS, RELEASE, TYPE, keyRoute } from "../keys.mjs";
import { LEVEL, nextQuality, savedGraphics, setQuality } from "../look/quality.js";
import { isBlankKey } from "../sim/blankarea.mjs";
import { isScreensKey } from "../sim/screens.mjs";
import { MODE_NAMES, QUICK, answerVoiceAsk, bay, blank, busy, cameraPanel, dismissTip, docOf, editBlank, flickRecording, gameFullscreen, gameLayout, hasTurns, layout, leaving, levelCard, menu, mode, modes, nudgePictureCentre, onlinePanel, openMenu, padActions, practicePlan, recorder, recording, rendererTest, replayShot, roundCards, saveReplay, screens, setBay, shotSetup, setMode, soundPanel, speedTest, stepClub, swingReplay, toggleCamera, toggleFrameRate, toggleFullscreen, toggleScreens, toggleSound, toggleVideo, toggleVoice, reel, videoPanel, voiceAsking, welcome } from "../app.js";

export function onKey(e) {
  // The speed test: while it runs Esc stops it, and no other key does
  // anything.
  if (speedTest?.key(e)) return;
  if (rendererTest?.key(e)) return;
  // The game's video: while it plays, Esc stops it and no other key does
  // anything.
  if (reel?.key(e)) return;
  // Voice's "do this?" (a message, app.js askVoice): Y agrees, N cancels.
  // (Enter and Esc go on as themselves: nothing's on screen to answer.)
  if (voiceAsking && !e.ctrlKey && !e.metaKey && !e.altKey) {
    const k = e.key.toLowerCase();
    if (k === "y" || k === "n") {
      e.preventDefault();
      answerVoiceAsk(k === "y");
      return;
    }
  }
  // Arranging the controls window, or drawing a blank area: every key is
  // its own until it's kept or left.
  if (layout.key(e)) return;
  if (gameLayout.key(e)) return;
  if (blank.key(e)) return;
  // The Sound panel first, whatever has the keyboard in it: its own keys
  // work its controls; any other closes it and carries on below as a
  // shortcut (even though it was pressed on one of the panel's controls).
  if (soundPanel.key(e)) return;
  // The controller panel: Esc closes it; any other key closes it and
  // carries on as itself.
  if (padActions.key(e)) return;
  // The Cameras panel keeps the keyboard while it's open (Esc closes it).
  if (cameraPanel.key(e)) return;
  // So does the Recording panel (Esc closes it; Shift + V still records).
  if (videoPanel.key(e)) return;
  const fromPanel = soundPanel.el.contains(e.target);
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  // The menu has the keyboard while it's open: Esc or M closes it,
  // and every other key is left to the menu (Tab, Enter, and the arrows,
  // Page Up and Down to scroll it).
  // The menu has the keyboard while it's open: Esc or M closes it, and
  // every other key is left to the menu (Tab, Enter, the arrows, /).
  if (menu?.open) {
    menu.key(e);
    return;
  }
  // Typing in a box (a name, a temperature) is just typing; a tick box or
  // a number box lets go of the keyboard for a shortcut (keys.mjs).
  const route = fromPanel ? KEYS : keyRoute(e.target, e.key);
  if (route === TYPE) {
    // Esc leaves a box being typed in (a player's name, say).
    if (e.key === "Escape" && e.target.tagName === "INPUT" && !e.target.closest("dialog, .bay-help")) e.target.blur();
    return;
  }
  // Shift + D: separate windows for the game and the controls, or back to
  // one.
  if (isScreensKey(e)) {
    e.preventDefault();
    toggleScreens();
    return;
  }
  // Shift + B: the blank area of the window it was pressed in.
  if (isBlankKey(e)) {
    e.preventDefault();
    editBlank(docOf(e.target));
    return;
  }
  if (route === RELEASE) {
    e.target.blur();
    // Enter or Esc only let go (Enter keeps what was typed).
    if (e.key === "Enter" || e.key === "Escape") {
      e.preventDefault();
      return;
    }
  }
  if (bay.helpOpen) {
    bay.showHelp(false);
    e.preventDefault();
    return;
  }
  if (welcome?.open) {
    welcomeKey(e);
    return;
  }
  // The round card's keys while it's open (S save, C copy, arrows, Esc).
  if (roundCards.key(e)) return;
  // Esc (a controller's B) closes the levels card - before the Online play
  // panel it can be opened over.
  if (e.key === "Escape" && levelCard.open) {
    e.preventDefault();
    levelCard.show(false);
    return;
  }
  // The Online play panel's (Esc closes it; typing an address is the box's).
  if (onlinePanel.key(e)) return;
  // Esc closes the shot setup.
  if (e.key === "Escape" && shotSetup.open) {
    e.preventDefault();
    shotSetup.show(false);
    return;
  }
  // Esc closes the swing replay on the game window first (a card showing
  // too is left for the next Esc).
  if (e.key === "Escape" && swingReplay.showing) {
    e.preventDefault();
    swingReplay.close();
    return;
  }
  // Esc skips a flyover of the hole on the course: the one playing, or
  // the one about to play by itself.
  if (e.key === "Escape" && mode === "course" && modes.course.skipFlyover()) {
    e.preventDefault();
    return;
  }
  // An unplayable ball's card on the course, while it's up: its 1 - 4 and
  // Esc come first - it was asked for just now, with U.
  if (mode === "course" && modes.course.reliefKey(e.key, e.shiftKey)) {
    e.preventDefault();
    return;
  }
  // The range's "Odd shot?" card: Y, K, B, E or Esc answer it first;
  // Delete takes the last shot out as a misread anywhere, and Z just after
  // an answer takes it back (every other key still goes on below).
  if (recorder.key(e.key, mode, { shift: e.shiftKey })) {
    e.preventDefault();
    return;
  }
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  // Keys a mode keeps for itself (the Challenges' 1 2 3 and X).
  if (modes[mode].onKey?.(key, e)) {
    e.preventDefault();
    return;
  }
  const actions = {
    b: () => {
      // Separate: the game window is bay view already; B, like F, puts it
      // in and out of full screen.
      if (screens.separate) return gameFullscreen();
      const on = !bay.enabled;
      setBay(on);
      toggleFullscreen(on);
    },
    // Shift + F: the frame rate on the picture.
    f: () => (e.shiftKey ? toggleFrameRate() : screens.separate ? gameFullscreen() : toggleFullscreen()),
    // Shift + V: start or stop recording video (V alone: the camera).
    v: () => (e.shiftKey ? toggleVideo({ doc: docOf(e.target) }) : toggleCamera()),
    l: () => toggleVoice(),
    a: () => (e.shiftKey ? (soundPanel.show(true), screens.focusControls()) : toggleSound()),
    // Shift + S: save the last shot's replay (it's kept only until the next
    // shot otherwise). S alone: the range's session view, or on the course
    // the view from the ball.
    s: () => (e.shiftKey ? saveReplay() : mode === "range" ? modes.range.toggleSessionView() : mode === "course" && modes.course.toggleBallView()),
    // Q: the last shot's replay on the game window, or closed again (with
    // no swing camera, on the course the ball's flight again: replayShot).
    // Shift + Q: the game window flicked to what's being recorded, and back.
    q: () => (e.shiftKey ? flickRecording() : replayShot()),
    // Shift + R: the recording format - practice, round, experimental, off.
    r: () => (e.shiftKey ? recording.cycle() : mode !== "range" && (setMode("range"), bay.toast(MODE_NAMES.range, 1300, QUICK))),
    p: () => mode !== "putting" && (setMode("putting"), bay.toast(MODE_NAMES.putting, 1300, QUICK)),
    c: () => !e.shiftKey && mode !== "chipping" && (setMode("chipping"), bay.toast(MODE_NAMES.chipping, 1300, QUICK)),
    o: () => mode !== "course" && (setMode("course"), bay.toast(MODE_NAMES.course, 1300, QUICK)),
    x: () => mode !== "challenges" && (setMode("challenges"), bay.toast(MODE_NAMES.challenges, 1300, QUICK)),
    // [ and ]: the picture's centre a step left or right (sim/viewoffset.mjs).
    "[": () => nudgePictureCentre(-1),
    "]": () => nudgePictureCentre(1),
    // ← →: turn the aim - on the course, in the driving challenge, and on
    // the putting green (a quarter degree, Shift a degree).
    // (Between holes, watching the cart: its wheel and its speed - course/buggy.js driveKey.)
    ArrowLeft: () => (mode === "course" && modes.course.driveKey("left")) || (mode === "course" ? modes.course.nudgeAim(-1) : mode === "challenges" ? modes.challenges.nudgeAim(-1) : mode === "putting" && modes.putting.nudgeAim(-1, e.shiftKey)),
    ArrowRight: () => (mode === "course" && modes.course.driveKey("right")) || (mode === "course" ? modes.course.nudgeAim(1) : mode === "challenges" ? modes.challenges.nudgeAim(1) : mode === "putting" && modes.putting.nudgeAim(1, e.shiftKey)),
    ArrowUp: () => (mode === "course" && modes.course.driveKey("up")) || stepClub(-1),
    PageUp: () => stepClub(-1),
    ArrowDown: () => (mode === "course" && modes.course.driveKey("down")) || stepClub(1),
    PageDown: () => stepClub(1),
    // (In a gapping session on the range, N skips to the next club.)
    n: () => (mode === "range" && practicePlan?.skipClub()) || modes[mode].next?.(),
    // J: after a hole on the course, the flyover following the ball through
    // its strokes; again, it stops.
    j: () => mode === "course" && modes.course.toggleFlyover(),
    // The side panel's practice choices, from the mat.
    t: () => (mode === "range" ? modes.range.cycleTarget() : mode === "putting" ? modes.putting.toggleRead() : mode === "course" && modes.course.stepLine()),
    // Looking along a putt's line a section at a time (Shift + I back).
    i: () => (mode === "putting" ? modes.putting.stepSection(e.shiftKey ? -1 : 1) : mode === "course" && modes.course.stepSection(e.shiftKey ? -1 : 1)),
    h: () => bay.showHelp(true),
    g: () => {
      // The next setting (Standard, Medium, High and round again, never
      // above the highest). Changing it reloads the page: a round in
      // progress would end.
      const next = nextQuality();
      if (next === LEVEL && next === savedGraphics().setting) return bay.toast(`Graphics: ${GRAPHICS_NAMES[next]} - the highest setting (menu, How it looks)`, 2500);
      const lose = busy();
      if (lose && !confirm(`Change the graphics to ${GRAPHICS_NAMES[next]}? A² Golf reloads to do it, and ${lose} will end.`)) return;
      bay.toast(`Graphics: ${GRAPHICS_NAMES[next]} - reloading`, 2000);
      leaving(`graphics change to ${GRAPHICS_NAMES[next]}`);
      setTimeout(() => setQuality(next), 600);
    },
    "?": () => bay.showHelp(true),
    // Shift + M: a mulligan on the course (with Mulligans on, never online).
    m: () => (e.shiftKey ? mode === "course" && modes.course.mulligan() : openMenu()),
    w: () => welcome.show(true).then(() => screens.focusControls()),
    // U: the next player in practice; on the course, the ball's unplayable
    // (where it can be played from under the Rules).
    u: () => (mode === "course" ? modes.course.unplayable() : !hasTurns() && bay.toast(`${recorder.nextHitter()} hitting`, 1500)),
    // K: the key tip showing won't show again.
    k: () => bay.hint && dismissTip(bay.hint.id),
    // The next shot is a special one - a punch, a part swing... - kept out
    // of the club's numbers and not asked about. Again for the next kind.
    // Shift + E: the next swing's power (25%, 50%, 75%, full, off) - a part
    // swing kept by its power, or a chip with it.
    e: () => mode !== "putting" && (e.shiftKey ? recorder.stepPower() : recorder.toggleSpecial()),
  };
  const action = actions[key];
  if (action) {
    e.preventDefault();
    action();
  }
}

// The welcome screen's keys: the mode keys start playing, as its buttons
// do; M opens the menu; Esc or W closes it. Enter presses the button
// that's lit (Driving range, to begin with).
export function welcomeKey(e) {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const byKey = { r: "range", p: "putting", c: "chipping", o: "course", x: "challenges" };
  if (key === "Escape" || key === "w") welcome.show(false);
  else if (key === "m") {
    welcome.show(false);
    openMenu();
  } else if (byKey[key]) {
    welcome.show(false);
    if (mode !== byKey[key]) setMode(byKey[key]);
    bay.toast(MODE_NAMES[byKey[key]], 1300, QUICK);
  } else return;
  e.preventDefault();
}
