// Which keys belong to a box that has the keyboard, and which are the sim's
// shortcuts. Pure (it's given the element's tag and type, not the element),
// so the rules can be tested.
//
// After a click on a tick box, or typing a temperature, that control keeps
// the keyboard. Without these rules every shortcut stopped working from
// then on - and a presentation clicker changed the air temperature instead
// of the club. So:
//   - a box you type words into (a name, the report note) keeps every key;
//   - a tick box or button never keeps a key: they're all shortcuts (Space
//     doesn't tick or press it);
//   - a number box keeps what's used to type a number (digits, a minus,
//     Backspace, the left and right arrows); anything else lets go of it
//     and is a shortcut - Enter or Esc just let go;
//   - a drop-down keeps letters (to jump to a choice) but lets go for the
//     up and down arrows, Page Up and Down (a clicker) and Space, which then
//     do what they always do (change club; Space nothing).

// What each route means to the page's key handler:
//   "type"    leave the key to the box
//   "release" take the keyboard away from the box, then treat it as a shortcut
//   "keys"    a shortcut as it is (nothing to take the keyboard from)
export const TYPE = "type";
export const RELEASE = "release";
export const KEYS = "keys";

// Controls that are clicked rather than typed into.
const CLICKED = new Set(["checkbox", "radio", "range", "button", "submit", "reset", "color", "file", "image"]);
// Keys that are part of typing a number, or moving about in one.
const NUMBER_KEYS = new Set(["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Home", "End", "Tab"]);
// Keys that press nothing by themselves (held for another key).
const MODIFIERS = new Set(["Shift", "Control", "Alt", "Meta", "CapsLock", "AltGraph", "Process", "Unidentified", "Dead"]);
// What a drop-down lets go for.
const SELECT_RELEASE = new Set(["Escape", "ArrowUp", "ArrowDown", "PageUp", "PageDown", " "]);

// element: { tagName, type } (a DOM element will do); key: KeyboardEvent.key.
export function keyRoute(element, key) {
  const tag = String(element?.tagName ?? "").toUpperCase();
  const type = String(element?.type ?? "").toLowerCase();
  if (MODIFIERS.has(key)) return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" ? TYPE : KEYS;
  if (tag === "TEXTAREA") return TYPE;
  if (element?.isContentEditable) return TYPE;
  if (tag === "SELECT") return SELECT_RELEASE.has(key) ? RELEASE : TYPE;
  if (tag !== "INPUT") return KEYS;
  if (CLICKED.has(type)) return KEYS;
  if (type === "number") return NUMBER_KEYS.has(key) || /^[0-9.,+\-eE]$/.test(key) ? TYPE : RELEASE;
  // Text, a password, a search: every key is typing.
  return TYPE;
}
