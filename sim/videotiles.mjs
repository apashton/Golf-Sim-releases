// The words the recording draws over its picture (public/videorec.js's
// compositor): the shot data tiles, who hit it with what, the hole or
// challenge, the title and the clock - and the Record button's running
// time. Pure, for the page and the tests.

import { CORE_TILE_KEYS, FIELDS } from "./videolayout.mjs";
import { clubName } from "./clubs.mjs";
import { derive, shotShape, strikeWords } from "./shotdata.mjs";

const has = (v) => typeof v === "number" && Number.isFinite(v);
const DASH = "–";

// Each tile: its label, and its unit.
export const TILES = {
  carry: { label: "Carry", unit: "yds" },
  total: { label: "Total", unit: "yds" },
  ballSpeed: { label: "Ball speed", unit: "mph" },
  clubSpeed: { label: "Club speed", unit: "mph" },
  launch: { label: "Launch", unit: "°" },
  spin: { label: "Spin", unit: "rpm" },
  spinAxis: { label: "Spin axis", unit: "°" },
  offline: { label: "Offline", unit: "yds" },
  apex: { label: "Apex", unit: "yds" },
  direction: { label: "Direction", unit: "°" },
  backSpin: { label: "Back spin", unit: "rpm" },
  sideSpin: { label: "Side spin", unit: "rpm" },
  descent: { label: "Descent", unit: "°" },
  hangTime: { label: "Hang time", unit: "s" },
  smash: { label: "Smash", unit: "" },
  clubPath: { label: "Club path", unit: "°" },
  faceAngle: { label: "Face angle", unit: "°" },
  faceToPath: { label: "Face to path", unit: "°" },
  attackAngle: { label: "Attack angle", unit: "°" },
  dynamicLoft: { label: "Dynamic loft", unit: "°" },
  spinLoft: { label: "Spin loft", unit: "°" },
  shape: { label: "Shot shape", unit: "" },
  strike: { label: "Strike", unit: "" },
};

const fixed = (v, dp) => (has(v) ? v.toFixed(dp) : DASH);
// Thousands with a comma: 6,512.
const whole = (v) => (has(v) ? Math.round(v).toLocaleString("en-GB") : DASH);
// Left or right as golfers say it: "4.2 R" (0 alone when straight).
function side(v, dp = 1) {
  if (!has(v)) return DASH;
  if (Math.abs(v) < 0.5 * 10 ** -dp) return "0";
  return `${Math.abs(v).toFixed(dp)} ${v > 0 ? "R" : "L"}`;
}
// Side spin: "1,240 R", 0 alone when there's none to speak of.
const spinSide = (v) => (Math.abs(v) < 0.5 ? "0" : `${whole(Math.abs(v))} ${v > 0 ? "R" : "L"}`);
// Up or down: "+3.2", "−1.5" (an attack angle).
const signed = (v, dp = 1) => (!has(v) ? DASH : Math.abs(v) < 0.5 * 10 ** -dp ? "0" : `${v > 0 ? "+" : "−"}${Math.abs(v).toFixed(dp)}`);
// A club angle as golfers say it: open / closed, in to out / out to in -
// "2.1 open", "3.0 in-out" (right-handed, + to the right).
const face = (v) => (!has(v) ? DASH : Math.abs(v) < 0.05 ? "Square" : `${Math.abs(v).toFixed(1)} ${v > 0 ? "open" : "closed"}`);
const path = (v) => (!has(v) ? DASH : Math.abs(v) < 0.05 ? "0" : `${Math.abs(v).toFixed(1)} ${v > 0 ? "in-out" : "out-in"}`);

// The shot the tiles show, from what the page knows: the launch monitor's
// ball (and club) readings and what the flight gave. shot: { ball: {
// speedMph, vla, totalSpin, spinAxis }, clubData: { speedMph }, flight: {
// carry, total, offline, apex } } - any of it may be missing (a putt has no
// flight; a launch monitor without club data has no club speed).
// Returns [{ key, label, value, unit }] for the keys asked for, in order.
export function shotTiles(shot, keys = CORE_TILE_KEYS) {
  const b = shot?.ball ?? {};
  const c = shot?.clubData ?? {};
  const f = shot?.flight ?? {};
  const d = derive(b, c);
  const axis = has(b.spinAxis) ? (b.spinAxis * Math.PI) / 180 : null;
  const values = {
    direction: side(b.hla),
    backSpin: has(b.totalSpin) && axis != null ? whole(b.totalSpin * Math.cos(axis)) : DASH,
    sideSpin: has(b.totalSpin) && axis != null ? spinSide(b.totalSpin * Math.sin(axis)) : DASH,
    descent: fixed(f.descentAngle ?? f.descent, 0),
    hangTime: fixed(f.hangTime, 1),
    smash: fixed(d.smash, 2),
    clubPath: path(c.path),
    faceAngle: face(c.faceToTarget),
    faceToPath: face(d.facePath),
    attackAngle: signed(c.angleOfAttack),
    dynamicLoft: fixed(c.loft, 1),
    spinLoft: fixed(d.spinLoft, 1),
    shape: shot?.ball ? (shotShape(b, c, shot.hand)?.name ?? DASH) : DASH,
    strike: strikeWords(c) ?? DASH,
    carry: fixed(f.carry, 0),
    total: fixed(f.total, 0),
    ballSpeed: fixed(b.speedMph, 1),
    clubSpeed: fixed(c.speedMph, 1),
    launch: fixed(b.vla, 1),
    spin: whole(b.totalSpin),
    spinAxis: side(b.spinAxis),
    offline: side(f.offline),
    apex: fixed(f.apex, 0),
  };
  return keys.filter((k) => k in TILES).map((key) => ({ key, label: TILES[key].label, value: shot ? values[key] : DASH, unit: TILES[key].unit }));
}

// How n tiles fill a w x h box: the columns and rows that make each tile
// nearest to `aspect` (wider than tall, like a scoreboard), with no more
// empty cells than a row. Returns { cols, rows }.
export function tileGrid(n, w, h, aspect = 1.6) {
  if (!(n > 0) || !(w > 0) || !(h > 0)) return { cols: 0, rows: 0 };
  let best = null;
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    if (rows > 1 && cols * rows - n >= cols) continue;
    const a = w / cols / (h / rows);
    const score = Math.abs(Math.log(a / aspect));
    if (!best || score < best.score - 1e-9) best = { cols, rows, score };
  }
  return { cols: best.cols, rows: best.rows };
}

// How n tiles fill a w x h box as a layer's look says (sim/videolayout.mjs
// cleanStyle): one row, one column, a grid of so many across, or as fits.
export function tileLayout(n, w, h, s = {}) {
  if (!(n > 0)) return { cols: 0, rows: 0 };
  if (s.arrange === "row") return { cols: n, rows: 1 };
  if (s.arrange === "column") return { cols: 1, rows: n };
  if (s.arrange === "grid") {
    const cols = Math.max(1, Math.min(n, Math.round(s.cols) || 1));
    return { cols, rows: Math.ceil(n / cols) };
  }
  return tileGrid(n, w, h);
}

// Who hit it and with what: "Ben · 7 iron". Either may be missing.
export function playerLine({ player, club } = {}) {
  const who = typeof player === "string" ? player.trim().slice(0, 30) : "";
  const what = typeof club === "string" && club ? clubName(club) : "";
  return [who, what].filter(Boolean).join(" · ");
}

// Text from the overlay's HTML (a title may have markup and entities).
export function plainText(html) {
  return String(html ?? "")
    .replace(/<br\s*\/?>|<\/(p|div|li)>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// The overlay's numbers worth keeping in a video: the score and the
// strokes, the distance to the pin, a challenge's own.
const INFO_LABELS = ["To the pin", "To the hole", "Strokes", "Score", "Points", "Total", "Round", "Shot", "Target", "Best"];

// The hole / score / challenge lines, on the course and in the Challenges
// (nothing on the range and greens, where there's no hole or game).
// overlay: the mode's { title, note, stats: [{ label, value, unit }] }.
// Returns up to three lines.
export function infoLines(mode, overlay) {
  if (mode !== "course" && mode !== "challenges") return [];
  const o = overlay ?? {};
  const lines = [];
  const note = noteOf(o);
  if (note) lines.push(note.split(" · ")[0]);
  const title = plainText(o.title);
  if (title && !lines.includes(title)) lines.push(title);
  const stats = (Array.isArray(o.stats) ? o.stats : [])
    .filter((s) => s && INFO_LABELS.includes(s.label) && s.value != null && s.value !== "")
    .map((s) => `${s.label} ${plainText(s.value)}${s.unit ? ` ${s.unit}` : ""}`);
  if (stats.length) lines.push(stats.slice(0, 4).join(" · "));
  return lines.slice(0, 3).map((l) => (l.length > 70 ? `${l.slice(0, 69)}…` : l));
}

// The overlay's note as plain words: a string, or { text, short } with a
// short form for the game window (the whole of it here).
const noteOf = (o) => plainText(o?.note && typeof o.note === "object" ? o.note.text : o?.note);

// ---- Each piece of information on its own ------------------------------------
//
// The owner: "I want to be able to split up stats and info and present
// different things". Each is a layer of its own (kind "field"), placed and
// styled like any other.
export const INFO_FIELDS = FIELDS;
export const INFO_FIELD_NAMES = {
  player: "Player",
  club: "Club",
  playerClub: "Player and club",
  mode: "Mode",
  course: "Course name",
  hole: "Hole, par and length",
  score: "Score and strokes",
  pin: "Distance to the pin",
  result: "Result line",
  note: "The note (whole)",
  lie: "Lie and carry range",
  stance: "Lie of the land (slopes)",
  wind: "Wind",
};
// What a piece shows in the designer while there's nothing to say yet
// (no hole on the range, say), so it can still be placed and styled.
export const FIELD_SAMPLES = {
  player: "Alex",
  club: "7 iron",
  playerClub: "Alex · 7 iron",
  mode: "Course",
  course: "Golf Sim Links",
  hole: "Hole 3 · Par 4 · 380 yds",
  score: "Score +1 · Strokes 2",
  pin: "To the pin 152 yds",
  result: "On the green - 14 ft",
  note: "Ball above your feet (4°)",
  lie: "80–95%",
  stance: "L–R 4° ball above feet · U–D 2° downhill",
  wind: "Wind ↗ 8 mph",
};
const MODE_WORDS = { range: "Driving range", putting: "Putting green", chipping: "Chipping green", course: "Course", challenges: "Challenges" };
const HOLE = /^(.+) - hole (\d+), par (\d+), (\d+) yds$/;
const SCORE_LABELS = ["Score", "Strokes", "Points", "Total", "Round", "Best"];
const PIN_LABELS = ["To the pin", "To the hole", "Target"];
const statText = (s) => `${s.label} ${plainText(s.value)}${s.unit ? ` ${s.unit}` : ""}`;
const lineText = (l) => plainText(l && typeof l === "object" ? (l.short ?? l.text) : l);

// One piece's words now ("" for nothing to show). d: the compositor's
// data - { player, club, mode, overlay }.
export function infoField(field, d = {}) {
  const o = d.overlay ?? {};
  const parts = noteOf(o).split(" · ").filter(Boolean);
  const hole = parts.map((p) => HOLE.exec(p)).find(Boolean);
  const stats = Array.isArray(o.stats) ? o.stats.filter((s) => s && s.value != null && s.value !== "") : [];
  const pick = (labels) => stats.filter((s) => labels.includes(s.label)).map(statText).join(" · ");
  switch (field) {
    case "player":
      return typeof d.player === "string" ? d.player.trim().slice(0, 30) : "";
    case "club":
      return typeof d.club === "string" && d.club ? clubName(d.club) : "";
    case "playerClub":
      return playerLine({ player: d.player, club: d.club });
    case "mode":
      return MODE_WORDS[d.mode] ?? "";
    case "course":
      return hole ? hole[1] : "";
    case "hole":
      return hole ? `Hole ${hole[2]} · Par ${hole[3]} · ${hole[4]} yds` : "";
    case "score":
      return pick(SCORE_LABELS);
    case "pin": {
      const s = pick(PIN_LABELS);
      return s || (parts.find((p) => /^Target: /.test(p)) ?? "");
    }
    case "result":
      return plainText(o.title);
    case "note":
      return parts.filter((p) => !HOLE.test(p)).join(" · ");
    case "lie":
      return (Array.isArray(o.lie) ? o.lie : []).map(lineText).filter(Boolean).join(" · ");
    case "stance": {
      const side = Math.round(Number(o.stance?.side) || 0);
      const slope = Math.round(Number(o.stance?.slope) || 0);
      if (!side && !slope) return "";
      const across = side ? `${Math.abs(side)}° ball ${side > 0 ? "above" : "below"} feet` : "level";
      const updown = slope ? `${Math.abs(slope)}° ${slope > 0 ? "uphill" : "downhill"}` : "level";
      return `L–R ${across} · U–D ${updown}`;
    }
    case "wind":
      return parts.find((p) => /^Wind\b/.test(p)) ?? "";
    default:
      return "";
  }
}

const pad = (n) => String(n).padStart(2, "0");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// The clock: "14:05", "29 Sep 2026" or both.
export function clockText(at, show = "time") {
  const d = at instanceof Date ? at : new Date(at);
  if (!Number.isFinite(d.getTime())) return "";
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const date = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  return show === "date" ? date : show === "both" ? `${date}  ${time}` : time;
}

// The Record button's running time: "0:07", "12:34", "1:02:03".
export function elapsedText(ms) {
  const s = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}
