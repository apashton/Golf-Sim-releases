// The Celebration effects setting (Menu → Screens → The picture): on, a
// good score gets its confetti, streamers, cannons and fireworks and a par
// its sparkle; off, none of them, and the only celebration sound is the
// crowd cheering - no fireworks, chimes, fanfares or heartbeat (the owner,
// 16 October 2026: "Make the visual effects an option. If switched off
// sound becomes just cheers no other sounds"). Read by every mode's
// celebration (celebrate.js) and sounds (sounds.js) as each plays.

import { loadSetting, saveSetting } from "./util.js";

export const celebrationFx = loadSetting("celebrationFx", { on: true });

export function setCelebrationFx(on) {
  celebrationFx.on = !!on;
  saveSetting("celebrationFx", { on: celebrationFx.on });
}
