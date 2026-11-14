// How the Android app is played (the owner, 24 October 2026: "It should
// default to a touch screen games mode, similar to mouse. Setting up as
// launcher mode or mobile mode should be the first choice, and a permanent
// choice in setup as a default"):
//   touch    on the touch screen: the swing pad's on, swung with a finger,
//            and no launch monitor is looked for - the default;
//   monitor  with a launch monitor: the Omni found over the phone's
//            Bluetooth and connected by itself.
// Set by the route chosen on the app's start screen (sim/phoneroutes.mjs:
// Play is the touch screen, At the range the launch monitor) and kept; the
// welcome screen's question is only for a phone that hasn't chosen one.
// Only in the app: on a PC the launch monitor and the mouse swing are
// chosen as they always were.
//
// Pure: public/app/playmode.js does it in the page; test/playmode.test.mjs.

export const PLAY_MODES = [
  { id: "touch", name: "Touch screen", help: "Swing with a finger on the swing pad - no launch monitor needed." },
  { id: "monitor", name: "Launch monitor", help: "Your launch monitor over the phone's Bluetooth: switch it on and A² Golf connects to it by itself." },
];
export const DEFAULT_PLAY_MODE = "touch";

export const cleanPlayMode = (v) => (PLAY_MODES.some((m) => m.id === v) ? v : DEFAULT_PLAY_MODE);
export const playModeName = (v) => PLAY_MODES.find((m) => m.id === cleanPlayMode(v)).name;

// What a play mode turns on: the swing pad and the search for the Omni.
// chosen: the player has just picked it (the welcome screen, the menu) -
// the swing pad goes off for a launch monitor then; at a start, it's left
// as the player last had it (Mouse swing in the menu).
//   -> { swingPad: true | false | null (left as it is), omniSearch }
export function playModeEffects(mode, { chosen = false } = {}) {
  const touch = cleanPlayMode(mode) === "touch";
  return { swingPad: touch ? true : chosen ? false : null, omniSearch: !touch };
}

// The top bar's words on the touch screen: unless a launch monitor's
// talking after all (the Omni connected), it's the swing pad that plays -
// not "waiting for the launch monitor". Null otherwise.
export function touchStatus(mode, s) {
  if (cleanPlayMode(mode) !== "touch") return null;
  if (s?.omni?.state === "connected" || s?.connectors > 0) return null;
  return { cls: "ok", text: "Touch screen - swing on the pad", short: "Touch screen" };
}
