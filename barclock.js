// The laptop's time in the command centre's top bar (the owner, 16 October
// 2026: "Add a clock onto the command center that shows the laptop time.
// With full screen and my setup I can't actually see the time without
// looking at my phone"): always in sight there, whatever's arranged, as
// the recording's clock says it ("20:41"; the date in its tooltip). Only
// the controls window shows it (style.css). The Clock box (ccwidgets.js)
// is a bigger one to add.

import { clockText } from "./sim/videotiles.mjs";

// Keeps el showing the time, written only when the minute changes.
export function startBarClock(el) {
  if (!el) return;
  const tick = () => {
    const now = new Date();
    const time = clockText(now, "time");
    if (el.textContent !== time) {
      el.textContent = time;
      el.title = `The laptop's time - ${clockText(now, "date")}`;
    }
  };
  tick();
  setInterval(tick, 1000);
}
