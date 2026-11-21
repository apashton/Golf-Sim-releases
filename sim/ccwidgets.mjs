// Boxes of the owner's own in the controls window (the command centre):
// any shot number on its own, big (the carry, the ball speed...), all the
// numbers together, the flight path, from the side or from above, the shot
// history, the keys that help right now, or the laptop's clock - added in one click from the
// Arrange bar (arrange.js) and taken out with its ×. Each is a box like
// the others: dragged, sized and zoomed there. Kept in the "ccWidgets"
// setting. Pure: ccwidgets.js draws them.

import { TILE_KEYS } from "./videolayout.mjs";
import { TILES, clockText } from "./videotiles.mjs";

export const MAX_WIDGETS = 24;
export const WIDGET_KINDS = ["stat", "tiles", "flight", "history", "keys", "game", "clock"];
const VIEWS = ["side", "above"];

// What can be added, grouped for the Arrange bar: key -> a new widget.
export const PALETTE = [
  { group: "A number", items: TILE_KEYS.map((k) => ({ key: `stat:${k}`, name: TILES[k].label })) },
  {
    group: "More",
    items: [
      { key: "tiles", name: "Last shot" },
      { key: "flight:side", name: "Flight path" },
      { key: "flight:above", name: "Flight from above" },
      { key: "history", name: "Shot history" },
      { key: "keys", name: "Keys for now" },
      { key: "game", name: "Game screen" },
      { key: "clock", name: "Clock" },
    ],
  },
];

// A widget from a palette key, or null.
export function fromKey(key) {
  const [kind, arg] = String(key ?? "").split(":");
  if (kind === "stat" && TILE_KEYS.includes(arg)) return { kind, stat: arg };
  if (["tiles", "history", "keys", "game", "clock"].includes(kind) && !arg) return { kind };
  if (kind === "flight" && VIEWS.includes(arg)) return { kind, view: arg };
  return null;
}

// The list kept: known kinds only, ids of their own, at most MAX_WIDGETS.
// What a Game screen box shows (the owner, 16 October 2026: "enable the
// grid game screen to switch from either just the pure game or the
// recording screen"): the game's own picture, or the recording's - its
// layout, scene and words (compositor.js), what is (or would be) recorded.
export const GAME_SHOWS = ["game", "recording"];
export const GAME_SHOW_NAMES = { game: "Game", recording: "Recording" };

// The list with Game screen box `id` showing `show` (GAME_SHOWS).
export function showInGameBox(list, id, show) {
  return cleanWidgets(list).map((w) => (w.id === id && w.kind === "game" ? { ...w, show: GAME_SHOWS.includes(show) ? show : "game" } : w));
}

export function cleanWidgets(list) {
  const out = [];
  const seen = new Set();
  for (const w of Array.isArray(list) ? list : []) {
    if (!w || !WIDGET_KINDS.includes(w.kind) || out.length >= MAX_WIDGETS) continue;
    const c = { id: /^[a-z0-9-]{1,24}$/.test(w.id ?? "") && !seen.has(w.id) ? w.id : null, kind: w.kind };
    if (w.kind === "stat") c.stat = TILE_KEYS.includes(w.stat) ? w.stat : "carry";
    if (w.kind === "flight") c.view = VIEWS.includes(w.view) ? w.view : "side";
    if (w.kind === "game") c.show = GAME_SHOWS.includes(w.show) ? w.show : "game";
    if (!c.id) for (let i = 1; ; i++) if (!seen.has(`w-${i}`) && !out.some((x) => x.id === `w-${i}`)) {
      c.id = `w-${i}`;
      break;
    }
    seen.add(c.id);
    out.push(c);
  }
  return out;
}

// { list, id } with a widget from the palette added (id null: none added -
// an unknown key, or no room).
export function addWidget(list, key) {
  const w = fromKey(key);
  const now = cleanWidgets(list);
  if (!w || now.length >= MAX_WIDGETS) return { list: now, id: null };
  let n = 1;
  while (now.some((x) => x.id === `w-${n}`)) n++;
  const id = `w-${n}`;
  return { list: [...now, { id, ...w }], id };
}

// A box added once for everyone (the owner asked for the Shot history and
// the Keys in the command centre; the Game screen and the Last shot's
// numbers came with them later): the list with it, unless it's there or
// it has been offered before. Returns { list, added }.
export function offerBox(list, kind, offered) {
  const now = cleanWidgets(list);
  if (offered || now.some((w) => w.kind === kind)) return { list: now, added: false };
  const { list: out, id } = addWidget(now, kind);
  return { list: out, added: !!id };
}
export const offerHistory = (list, offered) => offerBox(list, "history", offered);

// The command centre's own boxes it starts with (offered once each:
// offerBox) - the Last shot, the Shot history, the Keys and the Game
// screen - that have been taken out (their ×): listed in Arrange ▾ to tick
// back (the owner, 3 November 2026: "If we delete something, we'd be able
// to add it back"). [{ key, name }].
export const STANDARD_BOXES = ["tiles", "history", "keys", "game"];
export function takenOutBoxes(list) {
  const now = cleanWidgets(list);
  return STANDARD_BOXES.filter((k) => !now.some((w) => w.kind === k)).map((key) => ({ key, name: widgetName({ kind: key }) }));
}

export function removeWidget(list, id) {
  return cleanWidgets(list).filter((w) => w.id !== id);
}

// Its name on the box and in the Arrange frames: "Carry", "Flight path".
export function widgetName(w) {
  if (w.kind === "stat") return TILES[w.stat]?.label ?? "Number";
  // (The mode's own numbers for it, or the launch monitor's: thisshot.mjs
  // lastShotTiles.)
  if (w.kind === "tiles") return "Last shot";
  if (w.kind === "history") return "Shot history";
  if (w.kind === "keys") return "Keys for now";
  if (w.kind === "game") return "Game screen";
  if (w.kind === "clock") return "Clock";
  return w.view === "above" ? "Flight from above" : "Flight path";
}

// The Clock box: the laptop's time, big, and the date under it - a bigger
// one than the top bar's (barclock.js; the owner, 16 October 2026: "With
// full screen and my setup I can't actually see the time without looking
// at my phone"), as the recording's clock says them (videotiles.mjs
// clockText): "20:41", "16 Oct 2026".
export function clockFace(at = new Date()) {
  return { time: clockText(at, "time"), date: clockText(at, "date") };
}
