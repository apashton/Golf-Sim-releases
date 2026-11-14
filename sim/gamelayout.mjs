// The game screen's own arrangement: each of the words and numbers laid
// over the picture (the club and connection along the top, the note, the
// lie's guidance, the lie of the land, the putt's, the shot's numbers, the messages, the
// course's hole map and scoreboard) can be moved from where it sits to
// begin with and made bigger or smaller. The owner: "Need to be able to
// move items on the game screen too" - as the controls window's boxes are
// (sim/arrange.mjs).
//
// Kept as how far each has been moved - shares of the picture's width and
// height, so it fits a projector as well as a laptop - and its size. What
// isn't moved stays where the page puts it. Pure: gamearrange.js draws it.

export const GAME_ITEMS = [
  // (The top bar can be made narrower too: it wraps onto more rows.)
  // when: when it shows, for the list of everything on the screen
  // (screenList) - an item with a switch of its own (the frame rate, the
  // key tips) is on or off there instead.
  { id: "top", selector: ".bay-top", name: "Club, player and connection", widen: true, when: "all the time" },
  { id: "note", selector: ".bay-note", name: "The note", when: "with the hole or the shot's result" },
  { id: "lie", selector: ".bay-lie", name: "The lie's guidance", when: "off the fairway, before a shot" },
  { id: "slope", selector: ".bay-slope", name: "The lie of the land", when: "on a slope" },
  { id: "guide", selector: ".bay-guide", name: "The putt's guidance", when: "on the green" },
  // (The numbers can be made narrower too - a block that wraps, to put
  // anywhere - not only a strip the picture's width: `widen`.)
  { id: "stats", selector: ".bay-stats", name: "The shot's numbers", widen: true, when: "after a shot" },
  // A message's symbol (its words are in the Messages box: messages.js);
  // only the demo videos' and the speed test's own words still show over
  // the picture, where the messages did.
  { id: "msgs", selector: ".bay-msgs", name: "Message symbol", when: "when there's a message" },
  { id: "toast", selector: ".bay-toast", name: "The videos' words", when: "in the speed test" },
  { id: "hint", selector: ".bay-hint", name: "Key tips", when: "now and then" },
  { id: "fps", selector: ".fps-readout", name: "Frame rate", when: "when turned on" },
  { id: "map", selector: ".course-map", name: "Hole map", when: "in a course round" },
  { id: "standings", selector: ".course-standings", name: "Scoreboard", when: "in a round with friends" },
  // Online play's reactions as they come in (netreact.js).
  { id: "reactions", selector: ".net-react-bubbles", name: "Reactions", when: "online, as they come in" },
  // What's being recorded (videomonitor.js), while recording.
  { id: "recording", selector: ".video-monitor", name: "What's being recorded", when: "while recording, when chosen on the Recording page" },
];
const IDS = GAME_ITEMS.map((i) => i.id);

export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 2.5;
export const ZOOM_STEP = 0.1;
// How narrow an item that can be (widen) may go, as a share of the
// picture's width, and the step - and 1, the whole width, as the page has it.
export const WIDTH_MIN = 0.2;
export const WIDTH_STEP = 0.1;
// Never moved further than the picture is wide or high.
const REACH = 1;

const num = (v, lo, hi, d) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
const round = (v, n = 4) => Math.round(v * 10 ** n) / 10 ** n;

// One item's place: { dx, dy, z, w? } - moved by dx of the picture's width
// and dy of its height, at z its size, and (the numbers) w of the picture's
// width wide - none for the whole width. Null: as the page has it.
export function cleanPlace(p) {
  if (!p || typeof p !== "object") return null;
  const c = { dx: round(num(p.dx, -REACH, REACH, 0)), dy: round(num(p.dy, -REACH, REACH, 0)), z: round(num(p.z, ZOOM_MIN, ZOOM_MAX, 1), 2) };
  const w = round(num(p.w, WIDTH_MIN, 1, 1), 2);
  if (w < 1) c.w = w;
  return c.dx === 0 && c.dy === 0 && c.z === 1 && !c.w ? null : c;
}

// An item a step narrower (-1) or wider (+1).
export function widened(place, dir) {
  const p = place ?? { dx: 0, dy: 0, z: 1 };
  return cleanPlace({ ...p, w: Math.round(((p.w ?? 1) + dir * WIDTH_STEP) * 100) / 100 });
}

// The whole of it, as kept: known items only, each moved or sized.
export function cleanGameLayout(saved) {
  const out = {};
  for (const id of IDS) {
    const p = cleanPlace(saved?.[id]);
    if (p) out[id] = p;
  }
  return out;
}

// An item moved by a drag of (px, py) pixels on a picture w x h.
export function moved(place, px, py, w, h) {
  const p = place ?? { dx: 0, dy: 0, z: 1 };
  return cleanPlace({ ...p, dx: p.dx + (w > 0 ? px / w : 0), dy: p.dy + (h > 0 ? py / h : 0) });
}

// An item a step bigger (+1) or smaller (-1).
export function zoomed(place, dir) {
  const p = place ?? { dx: 0, dy: 0, z: 1 };
  return cleanPlace({ ...p, z: Math.round((p.z + dir * ZOOM_STEP) * 100) / 100 });
}

// The CSS it's drawn with on a picture w x h: { translate, scale } (both
// "" when it's where the page puts it), set as the element's own
// translate and scale - apart from any transform it has of its own.
export function placeStyle(place, w, h) {
  const p = cleanPlace(place);
  if (!p) return { translate: "", scale: "", width: "" };
  return {
    translate: p.dx || p.dy ? `${Math.round(p.dx * w)}px ${Math.round(p.dy * h)}px` : "",
    scale: p.z !== 1 ? String(p.z) : "",
    width: p.w ? `${Math.round(p.w * 100)}%` : "",
  };
}

// What a key does while arranging: { act, ... } or null for nothing.
//   Enter: keep; Esc: put it back as it was; arrows: move the item last
//   touched (a 1% step; Shift: 5%); - and +: its size; [ and ]: narrower
//   and wider (the numbers); 0: back where the page puts it.
export function arrangeGameKey(key, shift = false) {
  const step = shift ? 0.05 : 0.01;
  const arrows = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
  if (key === "Enter") return { act: "done" };
  if (key === "Escape") return { act: "cancel" };
  if (arrows[key]) return { act: "move", dx: arrows[key][0], dy: arrows[key][1] };
  if (key === "-" || key === "_") return { act: "zoom", dir: -1 };
  if (key === "+" || key === "=") return { act: "zoom", dir: 1 };
  if (key === "0") return { act: "reset" };
  if (key === "[") return { act: "width", dir: -1 };
  if (key === "]") return { act: "width", dir: 1 };
  return null;
}

// The room the column down the right of the picture (the hole map, the
// scoreboard, the messages' symbol, the reactions) leaves at its head for
// the frame rate box, in pixels: the box's height and a gap while it's
// showing in its own place (fps.css) - nothing when it's off, on the phone
// (compact, its own place) or moved on the game screen's Arrange (then
// it's wherever it was put). It used to sit beside the top line, and
// covered the connection pill and a long result - and then, given room
// there (3.0.645), pushed the microphone and the connection off the
// line's right end.
export const FPS_GAP = 12;
export function fpsRoom({ on = false, compact = false, moved = false, size = 0 } = {}) {
  if (!on || compact || moved || !(size > 0)) return 0;
  return Math.ceil(size) + FPS_GAP;
}

// Every item kept on the picture, whatever was saved (the owner, 3 November
// 2026, of the projector: the frame rate "definitely not there. It's not
// behind anything" - moved up the picture when it sat at the bottom right,
// the same move took it off the top once it was put top right (#518), out
// of sight with no way to find it). Shares of a rectangle on the picture
// (W x H), in pixels: { left, top, width, height }.
export function shareInside(r, W, H) {
  if (!(r?.width > 0) || !(r?.height > 0) || !(W > 0) || !(H > 0)) return 1;
  const w = Math.max(0, Math.min(r.left + r.width, W) - Math.max(r.left, 0));
  const h = Math.max(0, Math.min(r.top + r.height, H) - Math.max(r.top, 0));
  return (w * h) / (r.width * r.height);
}

// How far to nudge it to be wholly on the picture: { x, y } pixels (0, 0
// when it is). One bigger than the picture keeps its top left corner on.
export function nudgeInside(r, W, H) {
  const axis = (start, size, max) => {
    if (!(size > 0) || !(max > 0)) return 0;
    if (start < 0) return -start;
    const over = start + size - max;
    return over > 0 ? -Math.min(over, start) : 0;
  };
  return { x: axis(r?.left, r?.width, W), y: axis(r?.top, r?.height, H) };
}

// Where an item is drawn so it's on the picture: its place as kept, when
// that's on it; nudged in, when a little of it's off (a smaller screen);
// and, when most of it's off - a move made when the page put it somewhere
// else - back where the page puts it (its size kept), nudged in if its
// size still takes it over an edge. Not saved: the kept place stays as it
// was until it's arranged again.
//   place  the kept place (null: where the page puts it)
//   r      its rectangle on the picture as drawn at that place, in pixels
//   W, H   the picture's size
// Returns { x, y, kept, forgot }: the translate in pixels; kept: a move of
// its own still on (it's not in the page's spot); forgot: the move set
// aside.
export function fitPlace(place, r, W, H) {
  const p = cleanPlace(place);
  let x = p ? Math.round(p.dx * W) : 0;
  let y = p ? Math.round(p.dy * H) : 0;
  if (!(r?.width > 0) || !(r?.height > 0) || !(W > 0) || !(H > 0)) return { x, y, kept: !!(x || y), forgot: false };
  let box = r;
  let forgot = false;
  if ((x || y) && shareInside(r, W, H) < 0.5) {
    box = { left: r.left - x, top: r.top - y, width: r.width, height: r.height };
    x = 0;
    y = 0;
    forgot = true;
  }
  const n = nudgeInside(box, W, H);
  return { x: x + n.x, y: y + n.y, kept: !forgot && !!(x || y), forgot };
}

// The kept place an item shown at translate (x, y) pixels has, in shares
// (where a drag or an arrow key starts from): its own size and width.
export function shownPlace(place, x, y, W, H) {
  const p = cleanPlace(place) ?? { dx: 0, dy: 0, z: 1 };
  return cleanPlace({ ...p, dx: W > 0 ? x / W : 0, dy: H > 0 ? y / H : 0 });
}

// Everything that can show on the game screen, as the game screen's
// Arrange lists it (the owner, 3 November 2026: "there's no way to add an
// option back on if you've deleted an option from the things that are on
// screen ... If we delete something, we'd be able to add it back"): each
// item, whether it's showing, off (one with a switch - the frame rate, the
// key tips) or waiting for its moment, and how it's been moved or sized -
// each can be turned back on, and put back where it began, from there.
//   showing  { id: true } - drawn on the picture now
//   on       { id: true/false } - the items with a switch, and how it's set
//   places   the kept places (sim/gamelayout.mjs cleanGameLayout)
// Returns [{ id, name, state: "showing"|"off"|"waiting", switchable,
// changed: ["moved", "140%", "60% wide"], words }].
export function screenList({ showing = {}, on = {}, places = {} } = {}) {
  return GAME_ITEMS.map((item) => {
    const p = cleanPlace(places?.[item.id]);
    const switchable = typeof on?.[item.id] === "boolean";
    const state = switchable && !on[item.id] ? "off" : showing?.[item.id] ? "showing" : "waiting";
    const changed = [];
    if (p && (p.dx || p.dy)) changed.push("moved");
    if (p && p.z !== 1) changed.push(`${Math.round(p.z * 100)}%`);
    if (p?.w) changed.push(`${Math.round(p.w * 100)}% wide`);
    const words = state === "off" ? "Off" : state === "showing" ? "Showing" : `Shows ${item.when}`;
    return { id: item.id, name: item.name, state, switchable, changed, words };
  });
}
