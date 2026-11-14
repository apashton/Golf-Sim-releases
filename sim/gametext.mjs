// Text on the game window - the projector, read from the hitting mat
// several metres away - and what the controls window repeats in full.
//
// With separate windows the game window keeps each line of guidance short
// enough to show big ("80–95%", "20 ft ↑ 5 in · plays
// 25 ft"), and the controls window's Shot details have every line whole. In
// one window there's no other screen to hold the whole line, so the bay
// view shows it whole (see bay.js).
//
// A line is a string, or { text, short } when whoever wrote it has a short
// form of their own. A string in the lie's or the putt's wording (from
// lieguide.mjs and puttguide.mjs) has its short form worked out here; any
// other string short enough to be big is its own short form; a longer one
// has none, and shows whole (cut to two lines on the game window, where the
// controls have it all). So a mode that adds a line of its own - to the
// bay content's lie, guide or details - gets it on both screens without
// anything here changing. Pure, so the wording can be tested against the
// sentences it shortens.

// A line this long or shorter is big as it is.
export const SHORT_MAX = 48;

// ---- The lie's guidance -------------------------------------------------------

// "Rough: expect 80–95% of your normal carry (your 7 iron's ~150 → 120–143
// yds) · less spin, a bit left" - or "(a 40-yd swing → 30–37 yds)" near the
// green, or no yards at all.
const LIE_BEFORE = /^(.+?): expect (\d+(?:–\d+)?%) of your normal carry(?: \((?:(?:your|a) [^()]+?'s ~\d+|a \d+-yd swing) → (\d+(?:–\d+)?) yds\))?(?: · .*)?$/;
// "The rough took 13% off: 150 yds at 100% → 131 yds (expected 80–95%:
// about the middle)", "... added 4% - a flyer: ...", "... took nothing off: ...".
const LIE_AFTER = /^The .+? (?:took (\d+)% off|added (\d+)% - a flyer|(took nothing off)): \d+ yds at 100% → \d+ yds \(expected [^:()]+: (.+)\)$/;
// Where in the lie's range the shot fell (lieguide.mjs luckWord), in a word
// or two.
const LUCK = {
  "the kind end": "kind end",
  "the kind side of the middle": "kind side",
  "about the middle": "middle",
  "the heavy side of the middle": "heavy side",
  "the bad end - unlucky": "bad end",
};

// The lie's line, short: just the ends of the carry it's likely to keep -
// "80–95%" - before the shot (the owner: "doesn't need to advise the new
// distance or anything, just the book ends"; the whole line is in the
// controls window), "Last shot −18% (middle)" after it. Null for any other
// line.
export function lieShort(line) {
  const text = String(line ?? "");
  const before = LIE_BEFORE.exec(text);
  if (before) return before[2];
  const after = LIE_AFTER.exec(text);
  if (after) {
    const luck = LUCK[after[4]] ?? after[4];
    if (after[1]) return `Last shot −${after[1]}% (${luck})`;
    if (after[2]) return `Last shot +${after[2]}%, a flyer`;
    return `Last shot ±0% (${luck})`;
  }
  return null;
}

// ---- The putt's guidance ------------------------------------------------------

const FT = String.raw`\d+(?:\.\d)? ft`;
const SIZE = String.raw`\d+(?:\.\d)? (?:in|ft)`;
// "20 ft · ↑ 4 in uphill (1.7%) · plays like 23 ft", "10 ft · level", "30
// ft · ↓ 2 ft downhill (2.2%) · runs away downhill: just get it moving".
const PUTT_BEFORE = new RegExp(`^(${FT}) · (?:level|([↑↓]) (${SIZE}) (?:uphill|downhill)(?: \\(\\d+(?:\\.\\d)?%\\))?)(?: · (?:plays like (${FT})|(runs away downhill)[^·]*))?$`);
// "Hit for 17 ft on the flat · the slope took 3 ft off · you needed 25 ft
// of pace - 8 ft short" (or "- 4 ft long", "- right on it"), or "... · it
// runs away downhill on its own".
const PUTT_AFTER = new RegExp(`^Hit for ${FT} on the flat · the slope (?:made little difference|took ${FT} off|added ${FT}) · (?:(it runs away downhill on its own)|you needed ${FT} of pace - (?:(right on it)|(${FT}) (short|long)))$`);
// "A 21 ft stroke · 20 ft was the dead-weight pace", or "A 3 ft stroke ·
// downhill enough to run away on its own": a holed putt.
const PUTT_HOLED = new RegExp(`^A (${FT}) stroke · (?:(${FT}) was the dead-weight pace|(downhill enough to run away on its own))$`);
// "Ideal: aim 8 in left of the hole (2 cups) · 22 ft of pace, 5.1 mph", or
// "Ideal: straight at the hole · ...".
const IDEAL = new RegExp(`^Ideal: (?:(straight at the hole)|aim (${SIZE}) (left|right) of the hole(?: \\((\\d+) cups?\\))?) · (${FT}) of pace, [\\d.]+ mph$`);
const NO_LINE = "No line holes this one: lag it close";

// The putt's line, short: "20 ft ↑ 5 in · plays 25 ft" before it, "6 ft
// short of pace" (or "6 ft too firm", "Right pace") after it, "Aim 2 cups
// left · 22 ft of pace" for the ideal line. Null for any other line.
export function puttShort(line) {
  const text = String(line ?? "");
  let m = PUTT_BEFORE.exec(text);
  if (m) {
    const [, distance, arrow, size, plays, runs] = m;
    const rise = arrow ? ` ${arrow} ${size}` : " level";
    return `${distance}${rise}${plays ? ` · plays ${plays}` : runs ? " · runs away" : ""}`;
  }
  m = PUTT_AFTER.exec(text);
  if (m) {
    const [, runs, spot, by, way] = m;
    if (runs) return "Runs away downhill";
    if (spot) return "Right pace";
    return way === "short" ? `${by} short of pace` : `${by} too firm`;
  }
  m = PUTT_HOLED.exec(text);
  if (m) return m[2] ? `${m[1]} stroke · ${m[2]} needed` : `${m[1]} stroke · runs away on its own`;
  m = IDEAL.exec(text);
  if (m) {
    const [, straight, size, side, cups, pace] = m;
    const n = Number(cups);
    const aim = straight ? "straight" : n ? `${n} ${n === 1 ? "cup" : "cups"} ${side}` : `${size} ${side}`;
    return `Aim ${aim} · ${pace} of pace`;
  }
  if (text === NO_LINE) return "No line holes it: lag it close";
  return null;
}

// ---- The note -----------------------------------------------------------------

// "Golf Sim Links - hole 3, par 4, 380 yds" (the course's note).
const HOLE = /^(.+) - hole (\d+), par (\d+), (\d+) yds$/;

// The note over the picture, short: each part as it is (they're short),
// but the course's name left to the controls - "Hole 3 · par 4 · 380 yds ·
// Ball above your feet (4°)".
export function noteShort(note) {
  const text = String(note ?? "");
  if (!text) return "";
  return text
    .split(" · ")
    .map((part) => {
      const m = HOLE.exec(part);
      return m ? `Hole ${m[2]} · par ${m[3]} · ${m[4]} yds` : part;
    })
    .join(" · ");
}

// The note as the game window shows it: short with separate windows (its
// own short form, or noteShort's), whole in one window; shortest on the
// phone (notePhone). A string, or { text, short }.
export function noteText(note, { separate = false, phone = false } = {}) {
  const own = note && typeof note === "object";
  const full = String((own ? note.text : note) ?? "").trim();
  if (!separate && !phone) return full;
  const short = own && note.short != null ? String(note.short).trim() : noteShort(full);
  return phone ? notePhone(short) : short;
}

// ---- The phone ------------------------------------------------------------------

// The phone app held sideways (the owner, 25 October 2026: "how busy the
// screen is, can't see lie etc, too much text ... especially for mobile"):
// a small picture with the swing pad and the touch strip standing at its
// sides, so the words over it are said shortest, a line each - and every
// line is whole in the side panel (course/panel.js), as the controls
// window has them with separate windows.

// The note, short (noteShort's), on the phone: its "Face: ..." part left to
// the numbers (Face needs) - "Hole 3 · par 4 · 380 yds". (A stance is
// drawn, and left out of a course note's short form already.)
export function notePhone(short) {
  return String(short ?? "")
    .split(" · ")
    .filter((part) => part && !/^Face:/.test(part))
    .join(" · ");
}

// A line on the phone: its short form ("Carry 80–95%" for the lie's book
// ends, which alone would say nothing), or with none, whole (cut to a line
// over the picture: clip).
export function linePhone(line) {
  const { full, big } = lineForms(line);
  if (!big) return { text: full, clip: true };
  return { text: /^\d+(?:–\d+)?%$/.test(big) ? `Carry ${big}` : big, clip: false };
}

// A number's unit on the phone: its first word ("mph", not "mph helping
// and from the right" - the arrow says which way).
export const unitPhone = (unit) => String(unit ?? "").split(" ")[0];

// ---- Any line -----------------------------------------------------------------

// A line's two forms: { full, big } - the whole line, and what the game
// window shows big (null when there's no short form and it's too long to
// be one).
export function lineForms(line) {
  if (line && typeof line === "object") {
    const full = String(line.text ?? "").trim();
    const short = String(line.short ?? "").trim();
    return { full, big: short || (full.length <= SHORT_MAX ? full : null) };
  }
  const full = String(line ?? "").trim();
  if (!full) return { full: "", big: null };
  return { full, big: lieShort(full) ?? puttShort(full) ?? (full.length <= SHORT_MAX ? full : null) };
}

// The whole of a line, for the controls window (and one window).
export function fullText(line) {
  return lineForms(line).full;
}

// What the game window shows of a list of lines (the lie's, the putt's):
// [{ text, clip }]. Separate windows: each line short and big, or - with no
// short form - whole, clipped to two lines (clip), as the controls have
// it. One window: each line whole, as there's nowhere else for it. The
// phone: shortest (linePhone).
export function gameLines(lines, { separate = false, phone = false } = {}) {
  const out = [];
  for (const line of lines ?? []) {
    const { full, big } = lineForms(line);
    if (!full && !big) continue;
    if (phone) out.push(linePhone(line));
    else if (!separate) out.push({ text: full || big, clip: false });
    else out.push({ text: big ?? full, clip: !big });
  }
  return out;
}

// ---- The command centre's This shot (thisshot.mjs) ------------------------------

// Text from the bay view's title, which may be HTML ("<b class="made">
// Holed!</b>", a name made safe with &amp;): the words alone.
export function plainText(html) {
  const ENT = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " };
  return String(html ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (e) => ENT[e])
    .replace(/\s+/g, " ")
    .trim();
}

// What This shot repeats in full from the bay view's content (bay.js
// render): [{ kind, text }] in reading order - the last shot's result line
// (its whole line, full, where the mode gives one longer than the title:
// "4.2 ft away - 3.1 ft long, 2.8 ft right"), the note, the lie's lines,
// the putt's lines, and any lines a mode gives for the controls alone
// (details). A line said already isn't said again. (The connection is the
// top bar's.)
export function detailItems(content) {
  const c = content ?? {};
  const items = [];
  const said = new Set();
  const add = (kind, line) => {
    const text = fullText(line);
    if (!text || said.has(text)) return;
    said.add(text);
    items.push({ kind, text });
  };
  add("result", plainText(c.full || c.title));
  add("note", c.note);
  for (const line of c.lie ?? []) add("lie", line);
  for (const line of c.guide ?? []) add("guide", line);
  for (const line of c.details ?? []) add("detail", line);
  return items;
}

// ---- Messages (toasts) -------------------------------------------------------------

// Up to this long, a message shows as it is.
export const TOAST_SHORT = 26;

// A message split for the picture: the gist big (head), and what to do
// about it smaller under it (tail) - "Taken out of your stats as a misread"
// / "Z to undo". Split at its first " - ", once it's too long for one big
// line; a short one, or one with nothing to split at, is all head.
export function toastParts(text) {
  const t = String(text ?? "").trim();
  const i = t.indexOf(" - ");
  if (t.length <= TOAST_SHORT || i < 6 || i + 3 >= t.length) return { head: t, tail: "" };
  return { head: t.slice(0, i), tail: t.slice(i + 3) };
}

// How many messages the Messages box keeps (messages.js): at least the
// last five always in sight (the owner, 15 October 2026).
export const TOAST_LOG = 8;

// How a message is given over the picture (the owner, 15 October 2026:
// "Instead of big text on the main game screen, can we just have a
// notification symbol pop up?"): a symbol that pops up - its words go to
// the Messages box, kept there - unless it's sent with `force` (the game's
// video's and the speed test's own words, which are what the picture is
// showing: still words over it). While hushed (the video plays) nothing
// else shows at all. Nor does a `quick` one: the answer to a key just
// pressed whose result is there to see anyway - the aim turned, a step
// along the line, the club or the mode changed - which isn't a message to
// keep (the owner, 20 October 2026: "there seems to be messages for far
// too much even for aiming on the putting warmup"). "symbol", "words" or
// null.
export function messageWay({ force = false, hush = false, quick = false } = {}) {
  if (force) return "words";
  return hush || quick ? null : "symbol";
}

// The symbol: up for `hold` ms after the latest message (or the message's
// own time, if longer), with how many have come since it popped up - at
// most `most` counted ("9+").
export const MESSAGE_SYMBOL = { hold: 6000, most: 9 };
export const symbolCount = (n) => (n > MESSAGE_SYMBOL.most ? `${MESSAGE_SYMBOL.most}+` : n > 1 ? String(n) : "");

// The latest messages, newest first: [{ text, at, count }].
// The same message again soon after is counted rather than listed twice;
// one that replaced another within a moment (the clubs going by as the
// clicker is held) takes its place.
export function logToast(log, text, now = Date.now(), { max = TOAST_LOG, burstMs = 1500, repeatMs = 10000 } = {}) {
  const t = String(text ?? "").trim();
  const list = Array.isArray(log) ? log : [];
  if (!t) return list;
  const [last, ...rest] = list;
  if (last && last.text === t && now - last.at < repeatMs) return [{ ...last, at: now, count: last.count + 1 }, ...rest];
  if (last && now - last.at < burstMs && last.count === 1) return [{ text: t, at: now, count: 1 }, ...rest].slice(0, max);
  return [{ text: t, at: now, count: 1 }, ...list].slice(0, max);
}

// ---- The lie of the land -------------------------------------------------------
//
// The owner: "Lie adjustment should be a small graphic showing the lie of
// the land it is on and two numbers, one for left to right, one for up to
// down." The stance (sim/lie.mjs: side + ball above the feet, slope +
// uphill) as a tile of ground seen from behind and above the ball, tilted
// as the ground is (steeper than life, so a few degrees show), the ball on
// it and an arrow to the target - and its two numbers.

// The two numbers: { across, updown }, each { deg, words }, or null on
// flat ground (nothing to show).
export function slopeNumbers(stance) {
  const side = Math.round(Number(stance?.side) || 0);
  const slope = Math.round(Number(stance?.slope) || 0);
  if (!side && !slope) return null;
  return {
    across: { deg: Math.abs(side), words: side > 0 ? "ball above feet" : side < 0 ? "ball below feet" : "level" },
    updown: { deg: Math.abs(slope), words: slope > 0 ? "uphill" : slope < 0 ? "downhill" : "level" },
  };
}

// How much steeper than life the tile is drawn, and the steepest it goes.
const TILT = 2.4;
const TILT_MAX = 14;
const f1 = (v) => (Math.round(v * 10) / 10).toString();

// The tile as an SVG (a string, 0 0 100 90), or "" on flat ground. Seen
// from behind a right-handed player and a little to their right: the
// target into the distance (up and right in the picture), the player's
// side on the left - so ball above the feet rises to the right, and
// uphill rises away.
export function slopeSvg(stance) {
  if (!slopeNumbers(stance)) return "";
  const side = Math.max(-TILT_MAX, Math.min(TILT_MAX, (Number(stance.side) || 0) * TILT));
  const slope = Math.max(-TILT_MAX, Math.min(TILT_MAX, (Number(stance.slope) || 0) * TILT));
  // A point on the ground: u across (+ right, toward the ball's side), v
  // along (+ toward the target), each -1..1, at height h (level 0).
  const at = (u, v, h) => [50 + u * 26 + v * 20, 46 + u * 8 - v * 12 - h];
  const P = (u, v) => at(u, v, u * side + v * slope);
  // The base the tile stands on: level, below its lowest corner.
  const low = Math.min(...[-1, 1].flatMap((u) => [-1, 1].map((v) => u * side + v * slope)));
  const B = (u, v) => at(u, v, low - 10);
  const pts = (list) => list.map(([x, y]) => `${f1(x)},${f1(y)}`).join(" ");
  const top = [P(-1, -1), P(1, -1), P(1, 1), P(-1, 1)];
  // Its front and right-hand sides, down to the base, so the tilt reads
  // against something level.
  const front = [P(-1, -1), P(1, -1), B(1, -1), B(-1, -1)];
  const right = [P(1, -1), P(1, 1), B(1, 1), B(1, -1)];
  const ball = P(0.1, -0.2);
  const [ax, ay] = P(0.1, 0.25);
  const [tx, ty] = P(0.1, 0.95);
  // Drawn to fit: whatever the tilt, the whole of it in the box.
  const all = [...top, ...front, ...right];
  const ys = all.map((p) => p[1]);
  const shift = Math.max(0, 6 - Math.min(...ys)) - Math.max(0, Math.max(...ys) - 86);
  const sh = ([x, y]) => [x, y + shift];
  const S = (list) => pts(list.map(sh));
  const [bx, by] = sh(ball);
  return `<svg class="slope-tile" viewBox="0 0 100 90" aria-hidden="true">` +
    `<polygon points="${S(front)}" fill="#5a3f22"/>` +
    `<polygon points="${S(right)}" fill="#47321b"/>` +
    `<polygon points="${S(top)}" fill="#4f9a45" stroke="#cfe8b0" stroke-width="1.2"/>` +
    `<line x1="${f1(ax)}" y1="${f1(ay + shift)}" x2="${f1(tx)}" y2="${f1(ty + shift)}" stroke="#ffd23f" stroke-width="2.4" stroke-linecap="round"/>` +
    `<circle cx="${f1(tx)}" cy="${f1(ty + shift)}" r="3" fill="#ffd23f"/>` +
    `<circle cx="${f1(bx)}" cy="${f1(by - 3)}" r="4.2" fill="#fff" stroke="#222" stroke-width="0.8"/>` +
    `</svg>`;
}
