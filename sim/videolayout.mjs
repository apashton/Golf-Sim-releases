// The recording's layout: what goes where in the video the recorder makes
// (public/videorec.js draws it, public/videopanel.js is the designer). It's
// only for the recording - the projector and the controls window are never
// changed by it.
//
// A layout is a list of layers, drawn in order (the last on top), each a
// rectangle kept as shares of the picture (arrange.mjs's toShares and
// toPixels), so the same layout records at 720p, 1080p or 1440p:
//
//   game     the game window's picture
//   camera   one of the chosen webcams (slot 0 is the first ticked), with
//            zoom and pan to crop it, and optional rounded corners or border
//   tiles    the last shot's numbers, each tile on or off
//   player   who hit it and with what
//   info     the hole, the score, the challenge - on the course and in the
//            Challenges
//   title    "A² Golf" (sim/clips.mjs SHORT_NAME) and a line of the owner's own
//   clock    the time, the date, or both
//   stat     one number big: the carry, the ball speed... (any tile)
//   flight   the flight path drawn as the ball flies, from the side or
//            from above
//   field    one piece of information on its own: the player, the club,
//            the hole, the score, the distance to the pin, the result,
//            the lie, the slopes, the wind... (sim/videotiles.mjs
//            INFO_FIELDS)
//   text     the owner's own words
//   minimap  the hole being played, from above: the ball, the shots so far,
//            the aim and the other players' balls, as the game window's map
//            (on the course; nothing elsewhere)
//
// Every layer with words or numbers has its look too (cleanStyle): the
// backing (a panel, solid, or none) and how see-through, the text's size,
// colour and alignment, the accent, labels and units on or off, rounded
// corners and a border - and the tiles how they're arranged (as fits, one
// row, one column, or a grid of so many across).
//
// Any layer can be shown always, or only at one time of the shot (when:
// before it, while it flies, after it lands - sim/shotphase.mjs), fading
// in and out: the flight path while the ball's in the air, the numbers
// once it's down.
//
// There can be any number of named layouts; one is active. Four presets
// start them off: Swing review, YouTube, Game only and Finish (the end of a
// round's scene - sim/videoscenes.mjs). Pure, for the page
// and the tests.

import { toShares, toPixels, snapToEdges, MIN_W, MIN_H } from "./arrange.mjs";
import { WHEN } from "./shotphase.mjs";
import { cleanFill } from "./fillbox.mjs";

// The sizes the video can be. 1440p only if the PC keeps up (the panel
// says so; the frame rate hint below speaks up if it doesn't).
export const OUTPUT_SIZES = [
  { w: 1920, h: 1080, name: "1080p" },
  { w: 1280, h: 720, name: "720p" },
  { w: 2560, h: 1440, name: "1440p" },
];
export const OUTPUT_FPS = [30, 60];

export const LAYER_KINDS = ["game", "camera", "tiles", "player", "info", "title", "clock", "stat", "flight", "scorecard", "standings", "field", "text", "minimap", "box"];
export const LAYER_NAMES = {
  game: "Game view",
  camera: "Camera",
  tiles: "Shot data",
  player: "Player and club",
  info: "Hole, score, challenge",
  title: "Title",
  clock: "Clock",
  stat: "One number",
  flight: "Flight path",
  scorecard: "Round card",
  standings: "Standings",
  field: "Information",
  text: "Your words",
  minimap: "Mini map",
  box: "Background box",
};
// The pieces of information a field layer can be (sim/videotiles.mjs has
// their words).
export const FIELDS = ["player", "club", "playerClub", "mode", "course", "hole", "score", "pin", "result", "note", "lie", "stance", "wind"];

// ---- How a layer with words looks ----------------------------------------------

// (And the background box, which has a look but no words: a backing, its
// colour, how solid, corners and an outline.)
export const WORD_KINDS = ["tiles", "player", "info", "title", "clock", "stat", "flight", "field", "text", "minimap", "box"];
export const BACKINGS = ["panel", "solid", "none"];
export const BACKING_NAMES = { panel: "Dark panel", solid: "Solid colour", none: "None (words only)" };
export const ALIGNS = ["left", "center", "right"];
export const ARRANGES = ["auto", "row", "column", "grid"];
export const ARRANGE_NAMES = { auto: "As fits the box", row: "One row", column: "One column", grid: "A grid" };
// The colours to pick from: white, the flag's yellow, green, sky blue,
// orange, red, and black (for words on a light backing).
export const COLOURS = ["#ffffff", "#ffd23f", "#7ed957", "#8fd3ff", "#ffa94d", "#ff6b6b", "#111111"];
export const COLOUR_NAMES = { "#ffffff": "White", "#ffd23f": "Yellow", "#7ed957": "Green", "#8fd3ff": "Blue", "#ffa94d": "Orange", "#ff6b6b": "Red", "#111111": "Black" };
// The backing's colours: the dark green panel, black, white, and the rest.
export const BACKING_COLOURS = ["#08100a", "#000000", "#1c5a38", "#ffffff", "#ffd23f", "#1d3557"];
export const BACKING_COLOUR_NAMES = { "#08100a": "Dark green", "#000000": "Black", "#1c5a38": "Green", "#ffffff": "White", "#ffd23f": "Yellow", "#1d3557": "Navy" };
export const TEXT_SCALE = { min: 0.5, max: 1.6 };
// The biggest a text size can be typed, 1080p pixels (sim/layerstyle.mjs).
export const MAX_TEXT_PX = 200;

// A words layer's look, made sensible (defaults as the recording always
// drew them).
export function cleanStyle(l = {}, kind = l.kind) {
  const pick = (v, list, d) => (list.includes(v) ? v : d);
  const s = {
    bg: pick(l.bg, BACKINGS, "panel"),
    bgColour: pick(l.bgColour, BACKING_COLOURS, "#08100a"),
    bgAlpha: round(num(l.bgAlpha, 0, 1, 0.72)),
    textScale: round(num(l.textScale, TEXT_SCALE.min, TEXT_SCALE.max, 1)),
    // The text's size exactly, in pixels of a 1080p picture (its biggest
    // words - sim/layerstyle.mjs textMul); 0: as big as fits the box, by
    // textScale.
    textPx: Math.round(num(l.textPx, 0, MAX_TEXT_PX, 0)),
    align: pick(l.align, ALIGNS, kind === "clock" || kind === "tiles" ? "center" : "left"),
    colour: pick(l.colour, COLOURS, "#ffffff"),
    accent: pick(l.accent, COLOURS, "#ffd23f"),
    labels: l.labels !== false && !(kind === "field" && l.labels == null),
    units: l.units !== false,
    rounded: l.rounded !== false,
    // The rounded corners' size in pixels of a 1080p picture; 0: as the
    // box's size has it (sim/layerstyle.mjs cornerOf).
    cornerPx: Math.round(num(l.cornerPx, 0, MAX_RADIUS, 0)),
    outline: l.outline === true,
    // The outline's thickness in pixels of a 1080p picture; 0: as the box's
    // size has it (a thin line on a small box, a thicker one on a big one).
    outlineWidth: Math.round(num(l.outlineWidth, 0, MAX_LINE, 0)),
    shadow: l.shadow === true,
  };
  if (kind === "tiles") {
    s.arrange = pick(l.arrange, ARRANGES, "auto");
    s.cols = Math.round(num(l.cols, 1, 8, 3));
  }
  return s;
}
export const FLIGHT_VIEWS = ["side", "above"];

// The shot data tiles, in the order they're shown: the ball's and the
// flight's (CORE_TILE_KEYS, the ones "all the numbers" means), then the
// rest the launch monitor and the flight give - the club's own numbers
// need a launch monitor that reads the club.
export const CORE_TILE_KEYS = ["carry", "total", "ballSpeed", "clubSpeed", "launch", "spin", "spinAxis", "offline", "apex"];
export const TILE_KEYS = [...CORE_TILE_KEYS, "direction", "backSpin", "sideSpin", "descent", "hangTime", "smash", "clubPath", "faceAngle", "faceToPath", "attackAngle", "dynamicLoft", "spinLoft", "shape", "strike"];
export const DEFAULT_TILES = ["carry", "total", "ballSpeed", "clubSpeed", "launch", "spin"];
export const CLOCK_SHOWS = ["time", "date", "both"];

export const MAX_LAYERS = 40;
export const MAX_LAYOUTS = 24;
export const MAX_SLOTS = 4;
// A recording has at most four camera layers (the owner's: "longform
// recordings will have max 4 cameras").
export const MAX_CAMERA_LAYERS = 4;
export const cameraLayers = (layout) => (layout?.layers ?? []).filter((l) => l.kind === "camera").length;
// The smallest a layer can be, as a share of the picture.
export const MIN_SHARE = 0.03;
export const ZOOM_LIMITS = { min: 1, max: 4 };
// Rounded corners, in pixels of a 1080p picture (scaled with the size).
export const MAX_RADIUS = 60;
// The thickest an outline or a picture's border can be, in pixels of a
// 1080p picture.
export const MAX_LINE = 24;

const round = (v) => Math.round(v * 10000) / 10000;
const num = (v, lo, hi, dflt) => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt;
};
const str = (v, max) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "");
const ID = /^[a-z0-9-]{1,24}$/;
const GROUP_ID = /^g\d{1,3}$/;

// A rectangle of shares made sensible: at least MIN_SHARE each way, and
// inside the picture.
export function clampShares(r) {
  const w = num(r?.w, MIN_SHARE, 1, 0.3);
  const h = num(r?.h, MIN_SHARE, 1, 0.3);
  return { x: round(num(r?.x, 0, 1 - w, 0)), y: round(num(r?.y, 0, 1 - h, 0)), w: round(w), h: round(h) };
}

// One layer made sensible, or null for anything that isn't one.
export function cleanLayer(l, i = 0) {
  if (!l || typeof l !== "object" || !LAYER_KINDS.includes(l.kind)) return null;
  const out = { id: ID.test(l.id ?? "") ? l.id : `${l.kind}-${i + 1}`, kind: l.kind, on: l.on !== false, when: WHEN.includes(l.when) ? l.when : "always", ...clampShares(l) };
  if (l.kind === "game" || l.kind === "camera") {
    if (l.kind === "camera") out.slot = Math.round(num(l.slot, 0, MAX_SLOTS - 1, 0));
    out.zoom = round(num(l.zoom, ZOOM_LIMITS.min, ZOOM_LIMITS.max, 1));
    out.panX = round(num(l.panX, -1, 1, 0));
    out.panY = round(num(l.panY, -1, 1, 0));
    out.radius = Math.round(num(l.radius, 0, MAX_RADIUS, 0));
    out.border = l.border === true;
    // The border's thickness (pixels of a 1080p picture; 0: about 4, as it
    // always was) and colour.
    out.borderWidth = Math.round(num(l.borderWidth, 0, MAX_LINE, 0));
    out.borderColour = COLOURS.includes(l.borderColour) ? l.borderColour : "#ffffff";
  }
  // The game's picture centred on the target line in the recording, when
  // the picture's centre is moved for play (app.js picture.centre; the
  // owner: "centred on game screen even if off center in play"): on unless
  // turned off.
  if (l.kind === "game") out.centred = l.centred !== false;
  // A background box as a container: it lays out the rest of its group in
  // itself (sim/container.mjs).
  if (l.kind === "box") {
    const fill = cleanFill(l.fill);
    if (fill) out.fill = fill;
  }
  if (l.kind === "tiles") {
    const want = Array.isArray(l.tiles) ? l.tiles : DEFAULT_TILES;
    out.tiles = TILE_KEYS.filter((k) => want.includes(k));
  }
  if (l.kind === "title") out.text = str(l.text, 60);
  if (l.kind === "clock") out.show = CLOCK_SHOWS.includes(l.show) ? l.show : "time";
  if (l.kind === "stat") out.stat = TILE_KEYS.includes(l.stat) ? l.stat : "carry";
  if (l.kind === "flight") out.view = FLIGHT_VIEWS.includes(l.view) ? l.view : "side";
  if (l.kind === "field") out.field = FIELDS.includes(l.field) ? l.field : "player";
  if (l.kind === "text") out.text = str(l.text, 120) || "Your words here";
  if (WORD_KINDS.includes(l.kind)) Object.assign(out, cleanStyle(l, l.kind));
  // Grouped with others, to move together (sim/layerplace.mjs).
  if (typeof l.group === "string" && GROUP_ID.test(l.group)) out.group = l.group;
  return out;
}

// A layout: { id, name, layers }, layers with ids of their own, and no more
// than MAX_CAMERA_LAYERS cameras (any beyond, from a layout kept before
// there was a limit, are left out - the first four, back to front, stay).
export function cleanLayout(o, i = 0) {
  if (!o || typeof o !== "object") return null;
  const seen = new Set();
  const layers = [];
  let cams = 0;
  for (const [j, l] of (Array.isArray(o.layers) ? o.layers : []).entries()) {
    const c = cleanLayer(l, j);
    if (!c) continue;
    if (c.kind === "camera" && ++cams > MAX_CAMERA_LAYERS) continue;
    while (seen.has(c.id)) c.id = `${c.kind}-${seen.size + j + 1}`.slice(0, 24);
    seen.add(c.id);
    layers.push(c);
    if (layers.length >= MAX_LAYERS) break;
  }
  // A group of one (its others taken out) is no group.
  const inGroup = new Map();
  for (const l of layers) if (l.group) inGroup.set(l.group, (inGroup.get(l.group) ?? 0) + 1);
  for (const l of layers) if (l.group && inGroup.get(l.group) < 2) delete l.group;
  return { id: ID.test(o.id ?? "") ? o.id : `layout-${i + 1}`, name: str(o.name, 40) || "Layout", layers };
}

// ---- The presets ----------------------------------------------------------------

export const PRESETS = [
  { id: "swing", name: "Swing review" },
  { id: "youtube", name: "YouTube" },
  { id: "game", name: "Game only" },
  { id: "finish", name: "Finish" },
];

// A preset's layers, fresh.
export function presetLayers(id) {
  const L = (o, i) => cleanLayer(o, i);
  if (id === "swing") {
    // The owner's own, made in the recording designer and sent back (1
    // November 2026: "add these scenes as the defaults"): two cameras big,
    // side by side and tall (a golfer is taller than wide), the game small
    // top right with who's hitting, the score and the clock under it, and
    // every number along the bottom, eight to a row.
    return [
      { id: "cam-1", kind: "camera", x: 0.01, y: 0.02, w: 0.36, h: 0.78, radius: 12 },
      { id: "cam-2", kind: "camera", x: 0.38, y: 0.02, w: 0.36, h: 0.78, slot: 1, radius: 12 },
      { id: "game", kind: "game", x: 0.75, y: 0.02, w: 0.24, h: 0.24, radius: 12 },
      { id: "player", kind: "player", x: 0.75, y: 0.28, w: 0.24, h: 0.09 },
      { id: "info", kind: "info", x: 0.75, y: 0.39, w: 0.24, h: 0.2 },
      { id: "clock", kind: "clock", x: 0.75, y: 0.73, w: 0.24, h: 0.07, show: "both" },
      { id: "tiles", kind: "tiles", x: 0.01, y: 0.82, w: 0.98, h: 0.16, tiles: ["carry", "total", "ballSpeed", "clubSpeed", "launch", "spin", "spinAxis", "offline", "apex", "direction", "backSpin", "sideSpin", "descent", "hangTime", "smash", "clubPath", "faceAngle", "faceToPath", "attackAngle", "dynamicLoft", "spinLoft", "shape", "strike"], textPx: 36, cols: 8 },
    ].map(L);
  }
  if (id === "youtube") {
    // The owner's own, made in the recording designer and sent back (1
    // November 2026: "add these scenes as the defaults"; before that 15 and
    // 16 October): the game to the right, edged in yellow, and a column
    // down the left - the hole, the first camera, then below it the second
    // camera before the shot, the flight from above and from the side while
    // it flies, and eight big numbers once it's down (the face, attack
    // angle, hang time, face to path, spin - the owner's swap for a second
    // attack angle - dynamic loft, the shape and the strike). Who's hitting top right; the score and the
    // lie of the land at the top beside the column; the mini map and eight
    // numbers (see-through, outlined) along the bottom.
    return [
      { id: "game", kind: "game", x: 0.2337, w: 0.7663, h: 1, border: true, borderWidth: 5, borderColour: "#ffd23f" },
      { id: "cam-1", kind: "camera", y: 0.0789, w: 0.2344, h: 0.2731, border: true, borderWidth: 5, borderColour: "#ffd23f" },
      { id: "player", kind: "player", x: 0.7519, y: 0.0129, w: 0.2337, h: 0.047, bgColour: "#000000", bgAlpha: 0.7, cornerPx: 15, outline: true, shadow: true },
      { id: "info", kind: "info", x: 0.2426, y: 0.0129, h: 0.12, outline: true },
      { id: "tiles", kind: "tiles", x: 0.3886, y: 0.8969, w: 0.5928, h: 0.0855, tiles: ["carry", "total", "ballSpeed", "clubSpeed", "launch", "offline", "backSpin", "smash"], bgAlpha: 0.45, textScale: 0.65, units: false, rounded: false, outline: true, shadow: true },
      { id: "field-1", kind: "field", w: 0.2337, h: 0.0787, field: "hole", bg: "solid", bgColour: "#1c5a38", bgAlpha: 1, rounded: false, outline: true, outlineWidth: 5 },
      { id: "field-2", kind: "field", x: 0.2426, y: 0.1403, w: 0.28, h: 0.07, field: "stance", bgColour: "#000000", cornerPx: 15, outline: true, shadow: true },
      { id: "minimap-1", kind: "minimap", x: 0.2426, y: 0.693, w: 0.1334, h: 0.2894, rounded: false },
      { id: "camera-1", kind: "camera", when: "address", y: 0.327, w: 0.2337, h: 0.626, slot: 1, border: true, borderWidth: 5, borderColour: "#ffd23f" },
      { id: "flight-2", kind: "flight", when: "flight", x: 0.0007, y: 0.8011, w: 0.2337, h: 0.1989, bg: "solid", bgColour: "#1c5a38", rounded: false, outline: true, outlineWidth: 5 },
      { id: "flight-1", kind: "flight", when: "flight", y: 0.327, w: 0.2337, h: 0.4741, view: "above", bg: "solid", bgColour: "#1c5a38", rounded: false, outline: true, outlineWidth: 5 },
      { id: "camera-2", kind: "camera", when: "address", y: 0.3196, w: 0.2337, h: 0.6804, slot: 1, border: true, borderColour: "#ffd23f" },
      { id: "stat-1", kind: "stat", when: "after", y: 0.352, w: 0.1172, h: 0.162, stat: "faceAngle", bg: "solid", bgColour: "#1c5a38", textPx: 40, align: "center", rounded: false, outline: true, outlineWidth: 5, shadow: true },
      { id: "stat-2", kind: "stat", when: "after", x: 0.1172, y: 0.352, w: 0.1172, h: 0.162, stat: "attackAngle", bg: "solid", bgColour: "#1c5a38", textPx: 40, align: "center", rounded: false, outline: true, outlineWidth: 5, shadow: true },
      { id: "stat-3", kind: "stat", when: "after", x: 0.1172, y: 0.514, w: 0.1172, h: 0.162, stat: "hangTime", bg: "solid", bgColour: "#1c5a38", textPx: 40, align: "center", rounded: false, outline: true, outlineWidth: 5, shadow: true },
      { id: "stat-4", kind: "stat", when: "after", y: 0.514, w: 0.1172, h: 0.162, stat: "faceToPath", bg: "solid", bgColour: "#1c5a38", textPx: 40, align: "center", rounded: false, outline: true, outlineWidth: 5, shadow: true },
      { id: "stat-5", kind: "stat", when: "after", y: 0.676, w: 0.1172, h: 0.162, stat: "spin", bg: "solid", bgColour: "#1c5a38", textPx: 40, align: "center", rounded: false, outline: true, outlineWidth: 5, shadow: true },
      { id: "stat-6", kind: "stat", when: "after", x: 0.1172, y: 0.676, w: 0.1172, h: 0.162, stat: "dynamicLoft", bg: "solid", bgColour: "#1c5a38", textPx: 40, align: "center", rounded: false, outline: true, outlineWidth: 5, shadow: true },
      { id: "stat-7", kind: "stat", when: "after", y: 0.838, w: 0.1172, h: 0.162, stat: "shape", bg: "solid", bgColour: "#1c5a38", textPx: 40, align: "center", rounded: false, outline: true, outlineWidth: 5, shadow: true },
      { id: "stat-8", kind: "stat", when: "after", x: 0.1172, y: 0.838, w: 0.1172, h: 0.162, stat: "strike", bg: "solid", bgColour: "#1c5a38", textPx: 40, align: "center", rounded: false, outline: true, outlineWidth: 5, shadow: true },
    ].map(L);
  }
  if (id === "finish") {
    // The end of a round (sim/videoscenes.mjs), the owner's own (16
    // October 2026: "default finish screen"): the game's picture whole,
    // the round card over it on the right - the scorecard, the score and
    // net, strokes gained, the shot of the round (roundcard.js) - and the
    // first camera in the corner bottom left, the player at the end; the
    // shot data gone. And above the camera, what the round counted for -
    // a season, an online season, the match, a ladder (the owner, 5
    // November 2026: "any online seasons, match ladders, stuff like that
    // show on the finish"; nothing when it counted for none).
    return [
      { id: "game", kind: "game", x: 0, y: 0, w: 1, h: 1 },
      { id: "card", kind: "scorecard", x: 0.56, y: 0.03, w: 0.42, h: 0.94 },
      { id: "standings", kind: "standings", x: 0.0205, y: 0.03, w: 0.36, h: 0.6 },
      { id: "camera-1", kind: "camera", slot: 0, x: 0.0205, y: 0.67, w: 0.3, h: 0.3 },
    ].map(L);
  }
  // Game only: the picture, nothing over it.
  return [{ id: "game", kind: "game", x: 0, y: 0, w: 1, h: 1 }].map(L);
}

// The Finish scene as it was made before (the score in a box at the
// bottom; then the title and the round card): one still just as it was
// made becomes the owner's.
const OLD_FINISH = new Set(
  [
    [
      { id: "game", kind: "game", x: 0, y: 0, w: 1, h: 1 },
      { id: "title", kind: "title", x: 0.02, y: 0.03, w: 0.3, h: 0.09, text: "" },
      { id: "info", kind: "info", x: 0.3, y: 0.78, w: 0.4, h: 0.17 },
    ],
    [
      { id: "game", kind: "game", x: 0, y: 0, w: 1, h: 1 },
      { id: "title", kind: "title", x: 0.02, y: 0.03, w: 0.3, h: 0.09, text: "" },
      { id: "card", kind: "scorecard", x: 0.56, y: 0.03, w: 0.42, h: 0.94 },
    ],
    // (Before the standings, November 2026.)
    [
      { id: "game", kind: "game", x: 0, y: 0, w: 1, h: 1 },
      { id: "card", kind: "scorecard", x: 0.56, y: 0.03, w: 0.42, h: 0.94 },
      { id: "camera-1", kind: "camera", slot: 0, x: 0.0205, y: 0.67, w: 0.3, h: 0.3 },
    ],
  ].map((layers) => JSON.stringify(layers.map((o, i) => cleanLayer(o, i)))),
);

// The YouTube layouts as they were made before (the game whole with one
// camera in the corner; the owner's first, of 15 October 2026; then their
// second, of 16 October): one still just as it was made, never changed by
// hand, becomes the owner's latest.
const OLD_YOUTUBE = new Set(
  [
    [
      { id: "game", kind: "game", x: 0.2337, y: 0, w: 0.7663, h: 1 },
      { id: "cam-1", kind: "camera", slot: 0, x: 0, y: 0.0991, w: 0.2337, h: 0.2749, border: true, borderColour: "#ffd23f" },
      { id: "player", kind: "player", x: 0, y: 0.0521, w: 0.2337, h: 0.047, bgColour: "#1c5a38", rounded: false, shadow: true },
      { id: "info", kind: "info", x: 0.2426, y: 0.0129, w: 0.3, h: 0.12 },
      { id: "tiles", kind: "tiles", x: 0.3886, y: 0.8969, w: 0.5928, h: 0.0855, tiles: ["carry", "total", "ballSpeed", "clubSpeed", "launch", "spin", "offline", "smash", "faceToPath", "attackAngle"], bgAlpha: 0.45, textScale: 0.65, units: false, rounded: false, outline: true, shadow: true },
      { id: "field-1", kind: "field", field: "hole", x: 0, y: 0, w: 0.2337, h: 0.0521, bgColour: "#1c5a38", rounded: false },
      { id: "field-2", kind: "field", field: "stance", x: 0.2426, y: 0.1403, w: 0.28, h: 0.07, rounded: false },
      { id: "minimap-1", kind: "minimap", x: 0.2426, y: 0.693, w: 0.1334, h: 0.2894, rounded: false },
      { id: "camera-1", kind: "camera", slot: 1, when: "address", x: 0, y: 0.374, w: 0.2337, h: 0.626, border: true, borderColour: "#ffd23f" },
      { id: "flight-2", kind: "flight", when: "flight", x: 0, y: 0.8011, w: 0.2337, h: 0.1989, bgColour: "#1c5a38", rounded: false },
      { id: "flight-1", kind: "flight", when: "flight", view: "above", x: 0, y: 0.374, w: 0.2337, h: 0.4271, bgColour: "#1c5a38", rounded: false },
      { id: "camera-2", kind: "camera", slot: 1, when: "after", x: 0, y: 0.374, w: 0.2337, h: 0.626, border: true, borderColour: "#ffd23f" },
    ],
    [
      { id: "game", kind: "game", x: 0, y: 0, w: 1, h: 1 },
      { id: "cam-1", kind: "camera", slot: 0, x: 0.72, y: 0.04, w: 0.26, h: 0.26, radius: 16, border: true },
      { id: "title", kind: "title", x: 0.02, y: 0.03, w: 0.3, h: 0.09, text: "" },
      { id: "player", kind: "player", x: 0.02, y: 0.13, w: 0.26, h: 0.07 },
      { id: "info", kind: "info", x: 0.02, y: 0.21, w: 0.3, h: 0.12 },
      { id: "tiles", kind: "tiles", x: 0.02, y: 0.84, w: 0.96, h: 0.13, tiles: ["carry", "total", "ballSpeed", "clubSpeed", "launch", "spin", "offline"] },
    ],
    [
      { id: "game", kind: "game", x: 0.2337, y: 0, w: 0.7663, h: 1 },
      { id: "cam-1", kind: "camera", slot: 0, x: 0, y: 0.1466, w: 0.2468, h: 0.2747, radius: 16, border: true },
      { id: "player", kind: "player", x: 0, y: 0, w: 0.251, h: 0.074, bgColour: "#1c5a38", rounded: false, shadow: true },
      { id: "info", kind: "info", x: 0.2468, y: 0, w: 0.3, h: 0.12 },
      { id: "tiles", kind: "tiles", x: 0.3886, y: 0.8969, w: 0.5928, h: 0.0855, tiles: ["carry", "total", "ballSpeed", "clubSpeed", "launch", "spin", "offline", "smash", "faceToPath", "attackAngle"] },
      { id: "field-1", kind: "field", field: "hole", x: 0, y: 0.074, w: 0.2468, h: 0.0652, rounded: false },
      { id: "field-2", kind: "field", field: "stance", x: 0.2468, y: 0.12, w: 0.28, h: 0.07, rounded: false },
      { id: "minimap-1", kind: "minimap", x: 0.251, y: 0.693, w: 0.1334, h: 0.2894, rounded: false },
      { id: "flight-1", kind: "flight", when: "flight", view: "above", x: 0, y: 0.3888, w: 0.2426, h: 0.4327 },
      { id: "flight-2", kind: "flight", when: "flight", x: 0, y: 0.8053, w: 0.2337, h: 0.1947 },
      { id: "camera-2", kind: "camera", slot: 1, when: "after", zoom: 3.4, border: true, x: 0, y: 0.3814, w: 0.2468, h: 0.6186 },
      { id: "camera-1", kind: "camera", slot: 1, when: "address", border: true, x: 0, y: 0.4096, w: 0.2468, h: 0.5904 },
    ],
  ].map((layers) => JSON.stringify(layers.map((o, i) => cleanLayer(o, i)))),
);

// The Swing review layout as it was made before (with a title, and the core
// numbers along the bottom): one still just as it was made becomes the
// owner's.
const OLD_SWING = new Set(
  [
    [
      { id: "cam-1", kind: "camera", slot: 0, x: 0.01, y: 0.02, w: 0.36, h: 0.78, radius: 12 },
      { id: "cam-2", kind: "camera", slot: 1, x: 0.38, y: 0.02, w: 0.36, h: 0.78, radius: 12 },
      { id: "game", kind: "game", x: 0.75, y: 0.02, w: 0.24, h: 0.24, radius: 12 },
      { id: "player", kind: "player", x: 0.75, y: 0.28, w: 0.24, h: 0.09 },
      { id: "info", kind: "info", x: 0.75, y: 0.39, w: 0.24, h: 0.2 },
      { id: "title", kind: "title", x: 0.75, y: 0.61, w: 0.24, h: 0.1, text: "" },
      { id: "clock", kind: "clock", x: 0.75, y: 0.73, w: 0.24, h: 0.07, show: "both" },
      { id: "tiles", kind: "tiles", x: 0.01, y: 0.82, w: 0.98, h: 0.16, tiles: CORE_TILE_KEYS },
    ],
  ].map((layers) => JSON.stringify(layers.map((o, i) => cleanLayer(o, i)))),
);

// A layout's layers replaced by a preset's (its name and id kept).
export function applyPreset(layout, id) {
  return { ...layout, layers: presetLayers(id) };
}

// A preset picked in the panel: a layout that is still exactly that preset
// is made active; otherwise a new one is added, named after it ("Swing
// review 2"). A layout the owner has made is never overwritten. Returns {
// store, id } - id null when there's no room for another layout.
export function usePreset(store, presetId) {
  const want = JSON.stringify(presetLayers(presetId));
  const same = store.layouts.find((l) => JSON.stringify(l.layers) === want);
  if (same) return { store: { ...store, active: same.id }, id: same.id };
  const name = PRESETS.find((p) => p.id === presetId)?.name ?? "Layout";
  return saveAs(store, name, presetLayers(presetId));
}

// Every layout kept, and which is active: { active, layouts }. None kept
// yet: one of each preset, YouTube active.
export function cleanLayouts(store) {
  const src = store && typeof store === "object" ? store : {};
  const seen = new Set();
  const layouts = [];
  for (const [i, o] of (Array.isArray(src.layouts) ? src.layouts : []).entries()) {
    const c = cleanLayout(o, i);
    if (!c) continue;
    // The Finish scene as it was made before (OLD_FINISH) becomes the
    // owner's - unless it's been changed by hand.
    if (c.id === "finish" && OLD_FINISH.has(JSON.stringify(c.layers))) c.layers = presetLayers("finish");
    // So does the YouTube one.
    if (c.id === "youtube" && OLD_YOUTUBE.has(JSON.stringify(c.layers))) c.layers = presetLayers("youtube");
    // And the Swing review.
    if (c.id === "swing" && OLD_SWING.has(JSON.stringify(c.layers))) c.layers = presetLayers("swing");
    while (seen.has(c.id)) c.id = `layout-${seen.size + i + 1}`;
    seen.add(c.id);
    layouts.push(c);
    if (layouts.length >= MAX_LAYOUTS) break;
  }
  if (!layouts.length) {
    for (const p of PRESETS) layouts.push({ id: p.id, name: p.name, layers: presetLayers(p.id) });
    return { active: "youtube", layouts };
  }
  return { active: layouts.some((l) => l.id === src.active) ? src.active : layouts[0].id, layouts };
}

// The store with the Finish scene in it (sim/videoscenes.mjs), added from
// its preset under its own id if it isn't there and there's room.
export function ensureFinish(store) {
  if (store.layouts.some((l) => l.id === "finish") || store.layouts.length >= MAX_LAYOUTS) return store;
  return { ...store, layouts: [...store.layouts, { id: "finish", name: freshName(store.layouts, "Finish"), layers: presetLayers("finish") }] };
}

export function activeLayout(store) {
  return store.layouts.find((l) => l.id === store.active) ?? store.layouts[0];
}

// A new layout's id, not one already used.
export function newLayoutId(layouts) {
  const used = new Set(layouts.map((l) => l.id));
  for (let i = 1; ; i++) if (!used.has(`layout-${i}`)) return `layout-${i}`;
}

// A name not already used: "Swing review", then "Swing review 2"...
export function freshName(layouts, name) {
  const base = str(name, 36) || "Layout";
  const used = new Set(layouts.map((l) => l.name));
  if (!used.has(base)) return base;
  for (let i = 2; ; i++) if (!used.has(`${base} ${i}`)) return `${base} ${i}`;
}

// The store with a copy of the given layers saved under a new name, and
// active. Returns { store, id }; at MAX_LAYOUTS the store is unchanged and
// id is null.
export function saveAs(store, name, layers) {
  if (store.layouts.length >= MAX_LAYOUTS) return { store, id: null };
  const id = newLayoutId(store.layouts);
  const layout = cleanLayout({ id, name: freshName(store.layouts, name), layers });
  return { store: { active: id, layouts: [...store.layouts, layout] }, id };
}

// The store without a layout (never the last one).
export function removeLayout(store, id) {
  if (store.layouts.length <= 1) return store;
  const layouts = store.layouts.filter((l) => l.id !== id);
  return { active: store.active === id ? layouts[0].id : store.active, layouts };
}

// ---- Changing a layout -----------------------------------------------------------

// A layer changed: the same layout with it made sensible.
export function setLayer(layout, id, patch) {
  return { ...layout, layers: layout.layers.map((l, i) => (l.id === id ? cleanLayer({ ...l, ...patch, id, kind: l.kind }, i) : l)) };
}

// Toward the front (+1: drawn later, over the next one), toward the back
// (-1), or right to the front or back ("front", "back").
export function reorderLayer(layout, id, dir) {
  const layers = [...layout.layers];
  const i = layers.findIndex((l) => l.id === id);
  if (i < 0) return layout;
  const [l] = layers.splice(i, 1);
  const to = dir === "front" ? layers.length : dir === "back" ? 0 : Math.min(layers.length, Math.max(0, i + (dir > 0 ? 1 : -1)));
  layers.splice(to, 0, l);
  return { ...layout, layers };
}

// A new layer of a kind, in the middle, on top. A camera takes the next
// slot not already shown. Returns { layout, id }, id null when there's no
// room: why says so ("cameras": four are in already).
export function addLayer(layout, kind, extra = {}) {
  if (!LAYER_KINDS.includes(kind) || layout.layers.length >= MAX_LAYERS) return { layout, id: null, why: "layers" };
  if (kind === "camera" && cameraLayers(layout) >= MAX_CAMERA_LAYERS) return { layout, id: null, why: "cameras" };
  const used = new Set(layout.layers.map((l) => l.id));
  let n = 1;
  while (used.has(`${kind}-${n}`)) n++;
  const id = `${kind}-${n}`;
  const slots = new Set(layout.layers.filter((l) => l.kind === "camera").map((l) => l.slot));
  let slot = 0;
  while (slots.has(slot) && slot < MAX_SLOTS - 1) slot++;
  const size = { game: [0.4, 0.4], camera: [0.3, 0.3], tiles: [0.6, 0.14], player: [0.26, 0.07], info: [0.3, 0.12], title: [0.3, 0.09], clock: [0.2, 0.07], stat: [0.16, 0.13], flight: [0.36, 0.22], scorecard: [0.42, 0.94], standings: [0.36, 0.6], field: [0.28, 0.07], text: [0.34, 0.08], minimap: [0.17, 0.42], box: [0.3, 0.3] }[kind];
  // A widget's own settings (a stat's number, when it shows) come along;
  // where it goes is decided here.
  const { x: _x, y: _y, w: _w, h: _h, id: _id, kind: _k, ...own } = extra ?? {};
  // Not right on top of the last one added: each a step down and right.
  const step = 0.03 * (layout.layers.filter((l) => l.kind === kind).length % 6);
  const layer = cleanLayer({ ...own, id, kind, slot, x: Math.min(1 - size[0], (1 - size[0]) / 2 + step), y: Math.min(1 - size[1], (1 - size[1]) / 2 + step), w: size[0], h: size[1] });
  // A background box goes behind the rest - just over the game's picture
  // when that's at the back - not over what it's meant to sit under.
  const layers = [...layout.layers];
  layers.splice(kind === "box" ? (layers[0]?.kind === "game" ? 1 : 0) : layers.length, 0, layer);
  return { layout: { ...layout, layers }, id };
}

// The quick-add palette in the designer: every widget in one click - each
// number on its own, the numbers together, the flight path (shown while
// the ball flies), and the rest - grouped for the panel.
export const WIDGETS = [
  { group: "Shot numbers", items: TILE_KEYS.map((k) => ({ id: `stat-${k}`, kind: "stat", extra: { stat: k }, name: null })) },
  {
    group: "Panels",
    items: [
      { id: "tiles", kind: "tiles", name: "Shot data tiles" },
      { id: "tiles-after", kind: "tiles", extra: { when: "after" }, name: "Shot data, after it lands" },
      { id: "flight-side", kind: "flight", extra: { view: "side", when: "flight" }, name: "Flight path from the side, while it flies" },
      { id: "flight-above", kind: "flight", extra: { view: "above", when: "shot" }, name: "Flight path from above" },
      { id: "player", kind: "player", name: "Player and club" },
      { id: "info", kind: "info", name: "Hole, score, challenge" },
      { id: "scorecard", kind: "scorecard", name: "Round card, at the end of a round" },
      { id: "standings", kind: "standings", name: "Standings, at the end of a round" },
      { id: "minimap", kind: "minimap", name: "Mini map of the hole" },
    ],
  },
  {
    group: "Pictures",
    items: [
      { id: "game", kind: "game", name: "Game view" },
      { id: "camera", kind: "camera", name: "Camera" },
      { id: "camera-address", kind: "camera", extra: { when: "address" }, name: "Camera, before the shot" },
    ],
  },
  {
    group: "Information, each on its own",
    items: FIELDS.map((f) => ({ id: `field-${f}`, kind: "field", extra: { field: f }, name: null })),
  },
  {
    group: "Words",
    items: [
      { id: "box", kind: "box", name: "Background box" },
      { id: "text", kind: "text", name: "Your words" },
      { id: "title", kind: "title", name: "Title" },
      { id: "clock", kind: "clock", name: "Clock" },
    ],
  },
];
export const widgetById = (id) => WIDGETS.flatMap((g) => g.items).find((w) => w.id === id) ?? null;

// A widget from the palette added to a layout: { layout, id, why }.
export function addWidget(layout, widgetId) {
  const w = widgetById(widgetId);
  if (!w) return { layout, id: null, why: "widget" };
  return addLayer(layout, w.kind, w.extra ?? {});
}

// A copy of a layer, a little down and right of it, on top: { layout, id }
// (id null when there's no room).
export function duplicateLayer(layout, id) {
  const l = layout.layers.find((x) => x.id === id);
  if (!l || layout.layers.length >= MAX_LAYERS) return { layout, id: null };
  if (l.kind === "camera" && cameraLayers(layout) >= MAX_CAMERA_LAYERS) return { layout, id: null, why: "cameras" };
  const used = new Set(layout.layers.map((x) => x.id));
  let n = 1;
  while (used.has(`${l.kind}-${n}`)) n++;
  // (A copy of one in a group is a layer on its own.)
  const { group: _g, ...src } = l;
  const copy = cleanLayer({ ...src, id: `${l.kind}-${n}`, x: Math.min(1 - l.w, l.x + 0.02), y: Math.min(1 - l.h, l.y + 0.02) });
  return { layout: { ...layout, layers: [...layout.layers, copy] }, id: copy.id };
}

export function removeLayer(layout, id) {
  return { ...layout, layers: layout.layers.filter((l) => l.id !== id) };
}

// ---- Placing, in the picture's pixels -----------------------------------------------

export function layerPixels(layer, W, H) {
  const p = toPixels(layer, W, H);
  return { x: p.x, y: p.y, w: p.w, h: p.h };
}

// A layer moved or sized to rect (pixels of a W x H picture): no smaller
// than a box can be, inside the picture, and - unless snap is false (Alt
// held) - lined up with the other shown layers' edges and the picture's
// (arrange.mjs's snapToEdges). edges: the edges being dragged when sizing
// ("se", "w"...), null when moving. within: how near (picture pixels)
// counts as lined up.
export function placeLayer(layout, id, rect, { W, H, edges = null, snap = true, within = undefined, lines = null }) {
  const layer = layout.layers.find((l) => l.id === id);
  if (!layer) return layout;
  const minW = Math.min(W, Math.max(MIN_W / 2, MIN_SHARE * W));
  const minH = Math.min(H, Math.max(MIN_H / 2, MIN_SHARE * H));
  let r = { x: rect.x, y: rect.y, w: Math.min(W, Math.max(minW, rect.w)), h: Math.min(H, Math.max(minH, rect.h)) };
  if (snap) {
    const others = layout.layers.filter((l) => l.id !== id && l.on).map((l) => layerPixels(l, W, H));
    r = snapToEdges(r, others, { W, H, edges, within, lines });
  }
  r.w = Math.min(W, Math.max(minW, r.w));
  r.h = Math.min(H, Math.max(minH, r.h));
  r.x = Math.min(W - r.w, Math.max(0, r.x));
  r.y = Math.min(H - r.h, Math.max(0, r.y));
  const s = toShares(r, W, H);
  return setLayer(layout, id, { x: s.x, y: s.y, w: s.w, h: s.h });
}

// Which part of a source (a camera, the game) a layer shows: the biggest
// part of the source with the layer's shape (cropping, never stretching),
// made smaller by zoom and moved by pan (-1 to 1: from one edge of what's
// left to the other). Returns { sx, sy, sw, sh } in the source's pixels.
export function coverSource(srcW, srcH, dstW, dstH, { zoom = 1, panX = 0, panY = 0 } = {}) {
  if (!(srcW > 0 && srcH > 0 && dstW > 0 && dstH > 0)) return { sx: 0, sy: 0, sw: Math.max(0, srcW), sh: Math.max(0, srcH) };
  const want = dstW / dstH;
  let sw = srcW;
  let sh = srcW / want;
  if (sh > srcH) {
    sh = srcH;
    sw = srcH * want;
  }
  const z = num(zoom, ZOOM_LIMITS.min, ZOOM_LIMITS.max, 1);
  sw /= z;
  sh /= z;
  const px = num(panX, -1, 1, 0);
  const py = num(panY, -1, 1, 0);
  const sx = ((srcW - sw) / 2) * (1 + px);
  const sy = ((srcH - sh) / 2) * (1 + py);
  return { sx, sy, sw, sh };
}

// The corner radius in the output's pixels (it's kept for 1080p).
export const radiusAt = (layer, H) => ((layer.radius ?? 0) * H) / 1080;
