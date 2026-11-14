// Menus and buttons: New or Legacy (Menu, Screens; sim/menu.mjs UI_STYLES).
// The page wears it as html[data-ui] - the controls window's too, when the
// screens are separate (screens.js) - and the stylesheets do the rest: every
// rule of the new style is under [data-ui="new"] (uistyle.css), so Legacy
// is the look as it was. The menu's own pages follow it (menu.js setStyle).
//
// And the phone's mode picker: in the new style the top bar's five mode
// tabs fold into one button saying where you are, which opens them as a
// list big enough for a thumb.

import { loadSetting, saveSetting } from "./util.js";
import { cleanUiStyle } from "./sim/menu.mjs";

export const uiStyle = () => cleanUiStyle(loadSetting("uiStyle", "new"));

// On a page (and any other window showing the game's controls).
export function applyUiStyle(style, docs = [document]) {
  for (const doc of docs) if (doc?.documentElement) doc.documentElement.dataset.ui = cleanUiStyle(style);
}

export function setUiStyle(style, docs) {
  const s = cleanUiStyle(style);
  saveSetting("uiStyle", s);
  applyUiStyle(s, docs);
  return s;
}

// Bigger top bar and side panel on a big screen (Menu, Screens): worn as
// html[data-big-bars="on"], where theme.css draws them larger by --big, as
// it does the menu. Off as it starts: they're laid out and measured by more
// of the game than the menu is, and that's only been seen in pictures (the
// owner, 12 November 2026: "make it an option").
export const BIG_SCREEN = "(min-width: 2400px) and (min-height: 1300px)";
export const bigBars = () => loadSetting("bigBars", false) === true;
export function applyBigBars(on, docs = [document]) {
  for (const doc of docs) if (doc?.documentElement) doc.documentElement.dataset.bigBars = on ? "on" : "off";
}
export function setBigBars(on, docs) {
  saveSetting("bigBars", !!on);
  applyBigBars(!!on, docs);
  return !!on;
}

// The mode picker: header is the top bar, button the picker in it. Its list
// is the top bar's own mode tabs (index.html nav), so picking one is what
// clicking a tab always was; the list closes as one's picked, or with a tap
// anywhere else. show(label): the button says where you are now.
export function modePicker(header, button) {
  if (!header || !button) return { show() {} };
  const open = (on) => {
    header.classList.toggle("modes-open", on);
    button.setAttribute("aria-expanded", String(on));
  };
  button.addEventListener("click", () => open(!header.classList.contains("modes-open")));
  header.addEventListener("click", (e) => {
    if (e.target.closest?.("nav [data-mode], nav [data-online]")) open(false);
  });
  // (The header's own document: it moves to the controls window and back.)
  const away = (e) => {
    if (header.classList.contains("modes-open") && !e.target.closest?.(".mode-pick, header.topbar nav")) open(false);
  };
  for (const doc of new Set([document, header.ownerDocument])) doc.addEventListener("pointerdown", away, true);
  return {
    show(label) {
      button.querySelector("b").textContent = label;
    },
  };
}
