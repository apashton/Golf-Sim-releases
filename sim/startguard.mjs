// Starting safely (the owner, after a beta that wouldn't load on High: "we
// need a rollback method"). Before the page builds its picture at a
// setting it notes so ({ setting, at }, the "startGuard" setting); once the
// first whole picture is up it clears the note. A note still there when
// the page starts again means that setting didn't finish starting - it
// hung, crashed or was reloaded part-way - so this start is one setting
// lower, saved, and said. And "?graphics=standard" on the address (the
// Windows app's "Start on Standard graphics") starts on Standard whatever
// was saved. Pure: look/quality.js reads it before anything is built.

import { SETTINGS, NAMES, readGraphics, chooseSetting } from "./graphics.mjs";

// A note older than this is from a start long ago (left on the loading
// screen and closed, say), not a start that failed just now.
export const STALE_MS = 30 * 60 * 1000;

// What to start at:
//   saved   the saved "graphics" setting
//   note    the guard's note from the last start, if any
//   search  the page's address after the "?"
// Returns { graphics (saved, changed or not), setting, changed, note (to
// keep while starting), message ("" or what to say once it's up) }.
export function guardStart(saved, note = null, now = Date.now(), search = "") {
  let graphics = saved ?? {};
  let message = "";
  const asked = new URLSearchParams(search).get("graphics");
  if (SETTINGS.includes(asked)) {
    graphics = chooseSetting(graphics, asked);
    message = `Started on ${NAMES[asked]} graphics - G changes it`;
  } else {
    const g = readGraphics(graphics);
    const failed = note && typeof note === "object" && note.setting === g.setting && Number.isFinite(note.at) && now - note.at >= 0 && now - note.at < STALE_MS;
    const lower = SETTINGS[SETTINGS.indexOf(g.setting) - 1];
    if (failed && lower) {
      // Lowered, not a ceiling: G (or the menu) can try it again.
      graphics = { ...chooseSetting(graphics, lower), highest: graphics?.highest ?? null };
      message = `${NAMES[g.setting]} didn't finish starting last time on this PC - started on ${NAMES[lower]}. G to try ${NAMES[g.setting]} again`;
    }
  }
  const setting = readGraphics(graphics).setting;
  return { graphics, setting, changed: graphics !== saved, note: { setting, at: now }, message };
}
