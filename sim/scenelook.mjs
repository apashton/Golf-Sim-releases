// The recording's look: one set of frames, plates and type for every box in
// every scene (the owner, 23 November 2026: "an overlay which cleans up all
// the boxes and keeps the same look, so like metal frame, wooden frame, neon
// light tube effect, different effects that are easy to setup and look good
// ... let the border automatically fit around the scene inputs"). Also "a
// consistent type look across all scenes is needed": one typeface and one
// set of colours for all the words.
//
// It's kept per PC, like the transition (videorec.js, the setting
// "videoLook"), and applies to every scene the recorder draws - not to the
// game's own promo video, which keeps its own style. "own" draws each box as
// it was made, as the recording always did.
//
// Here: the looks, the typefaces and accents, the saved settings made
// sensible (cleanSceneLook), everything the drawing needs (lookSpec), how
// thick a box's frame is and how round its corners (frameWidth,
// frameRadius), and which boxes share one frame (boxDrawers). Drawing them
// is public/framedraw.js; the compositor (compositor.js) puts them round
// the layers. Sizes are pixels of a 1080p picture, scaled with the
// picture's height, so a scene looks the same at 720p, 1080p or 1440p.
// Pure: no page, for the tests.

import { WORD_KINDS } from "./videolayout.mjs";
import { PHASES, shownIn } from "./shotphase.mjs";

export const LOOKS = ["own", "broadcast", "steel", "gold", "walnut", "neon", "carbon"];
export const LOOK_NAMES = {
  own: "Each box as you made it",
  broadcast: "Broadcast glass",
  steel: "Brushed steel",
  gold: "Championship gold",
  walnut: "Walnut and brass",
  neon: "Neon tube",
  carbon: "Carbon fibre",
};
export const LOOK_LINES = {
  own: "Every box keeps the border, colours and corners you gave it.",
  broadcast: "TV sport graphics: dark frosted glass, a bright bar along the top.",
  steel: "A bevelled bezel of brushed steel lit from above, on gunmetal.",
  gold: "Polished gold frames on deep green, like a major's scoreboard.",
  walnut: "Walnut frames with a brass lip, on tobacco leather.",
  neon: "A glowing tube of light round see-through black glass.",
  carbon: "Glossy carbon-fibre weave with a thin coloured pinstripe.",
};
// A fresh PC's look.
export const DEFAULT_LOOK = "broadcast";

// The typefaces: one for every word in every scene. Each stack has good
// fallbacks, so a PC without the first still draws something close.
export const TYPEFACES = ["sport", "clean", "classic", "digital"];
export const TYPEFACE_NAMES = { sport: "Scoreboard", clean: "Clean", classic: "Clubhouse", digital: "Digital" };
export const TYPEFACE_FONTS = {
  // Bahnschrift is the game's own (DIN, a scoreboard's letters).
  sport: `"Bahnschrift", "DIN Alternate", "DIN Next", "Barlow", "Roboto Condensed", "Arial Narrow", "Segoe UI", sans-serif`,
  clean: `"Segoe UI", "Helvetica Neue", "Inter", Roboto, Arial, sans-serif`,
  // (Cambria and Palatino before Georgia: their figures stand on the line,
  // as a scoreboard's do - Georgia's dip below it.)
  classic: `Cambria, "Palatino Linotype", "Book Antiqua", Palatino, Georgia, "Times New Roman", serif`,
  digital: `"Cascadia Mono", Consolas, "SF Mono", Menlo, "DejaVu Sans Mono", "Courier New", monospace`,
};
// How each typeface's numbers and labels are set: the weights, and the
// labels' letter spacing (em).
const TYPE_SET = {
  sport: { numberWeight: 700, labelWeight: 600, labelSpacing: 0.12 },
  clean: { numberWeight: 700, labelWeight: 600, labelSpacing: 0.1 },
  classic: { numberWeight: 700, labelWeight: 400, labelSpacing: 0.14 },
  digital: { numberWeight: 700, labelWeight: 400, labelSpacing: 0.06 },
};

// The accent colours to pick from (null: the look's own).
export const ACCENTS = ["#ffd23f", "#f0c75e", "#ff8a3d", "#e8152b", "#ff3fa4", "#b07cff", "#36e2ff", "#7cc8ff", "#7ed957", "#ffffff"];
export const ACCENT_NAMES = {
  "#ffd23f": "Yellow",
  "#f0c75e": "Gold",
  "#ff8a3d": "Orange",
  "#e8152b": "Red",
  "#ff3fa4": "Pink",
  "#b07cff": "Violet",
  "#36e2ff": "Cyan",
  "#7cc8ff": "Ice blue",
  "#7ed957": "Green",
  "#ffffff": "White",
};

// The exact numbers the owner can give (pixels of a 1080p picture): the
// main frames' thickness, the small boxes' (thin), the corners, the gap
// between boxes and how far in from the picture's edge they sit (sim/
// scenetidy uses the last two).
export const LOOK_LIMITS = { frame: { min: 0, max: 32 }, thin: { min: 0, max: 16 }, corner: { min: 0, max: 40 }, gap: { min: 0, max: 48 }, edge: { min: 0, max: 64 } };
export const DEFAULT_GAP = 12;
export const DEFAULT_EDGE = 12;

const HEX = /^#[0-9a-f]{6}$/i;
const num = (v) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN);
const px = (v, { min, max }, dflt) => {
  const n = num(v);
  return Number.isFinite(n) ? Math.round(Math.min(max, Math.max(min, n))) : dflt;
};

// The saved settings made sensible: { look, accent (a colour, or null for
// the look's own), type (a typeface, or null for the look's own), frame
// (the main frames), thin (the small boxes') and corner (px of 1080p, or
// null for the look's own), gap and edge (px of 1080p) }.
export function cleanSceneLook(o) {
  const s = o && typeof o === "object" ? o : {};
  return {
    look: LOOKS.includes(s.look) ? s.look : DEFAULT_LOOK,
    accent: typeof s.accent === "string" && HEX.test(s.accent) ? s.accent.toLowerCase() : null,
    type: TYPEFACES.includes(s.type) ? s.type : null,
    frame: s.frame == null ? null : px(s.frame, LOOK_LIMITS.frame, null),
    thin: s.thin == null ? null : px(s.thin, LOOK_LIMITS.thin, null),
    corner: s.corner == null ? null : px(s.corner, LOOK_LIMITS.corner, null),
    gap: px(s.gap, LOOK_LIMITS.gap, DEFAULT_GAP),
    edge: px(s.edge, LOOK_LIMITS.edge, DEFAULT_EDGE),
  };
}

// ---- The looks ----------------------------------------------------------------------

// Each look's own: its typeface, accent, frame (thickness and corners, px of
// 1080p) and the colours its frames and plates are drawn in (framedraw.js).
// Ramps run dark to light: the metal's colour from a face turned away from
// the light to one catching it.
const BASE = {
  broadcast: {
    type: "sport",
    accent: "#ffd23f",
    text: "#ffffff",
    width: 3,
    radius: 8,
    // (The accent sparingly, as TV sport graphics have it: a bar along the
    // top of every box, and a fine light hairline round the rest.)
    frame: { style: "line", highlight: 0.5, cap: 5, hair: 0.28 },
    plate: { style: "glass", top: "#202a37", bottom: "#090c12", alpha: 0.93, sheen: 0.14, line: 0.22, picture: "#05070a" },
    shadow: { blur: 22, alpha: 0.5, y: 6 },
  },
  steel: {
    type: "sport",
    accent: "#7cc8ff",
    text: "#f4f7fa",
    width: 14,
    radius: 3,
    frame: {
      style: "bevel",
      ramp: ["#15181c", "#383e45", "#666e77", "#a2a9b1", "#dde2e7"],
      diffuse: 0.6,
      env: 0.32,
      ambient: 0.1,
      shine: 36,
      spec: 0.55,
      grain: 0.85,
      screws: true,
    },
    plate: { style: "metal", top: "#3a4149", bottom: "#181c21", alpha: 1, sheen: 0.07, line: 0.16, picture: "#0b0d10" },
    shadow: { blur: 20, alpha: 0.6, y: 6 },
  },
  gold: {
    type: "classic",
    accent: "#f0c75e",
    text: "#f8f1dc",
    width: 14,
    radius: 3,
    frame: {
      style: "bevel",
      // (Polished: deep valleys, a narrow hot streak on the lit faces, a
      // bright line along the lit outer edges - a trophy's snap.)
      ramp: ["#2a1803", "#6e4a0f", "#b9872a", "#ecc65c", "#fff3c8"],
      diffuse: 0.38,
      env: 0.66,
      ambient: 0.04,
      shine: 110,
      spec: 0.9,
      grain: 0.14,
      screws: false,
      rim: true,
    },
    plate: { style: "felt", top: "#0f4a2f", bottom: "#05261a", alpha: 1, sheen: 0.06, line: 0.12, picture: "#03140d" },
    shadow: { blur: 20, alpha: 0.6, y: 6 },
  },
  walnut: {
    type: "classic",
    accent: "#e0b862",
    text: "#f4ecd8",
    width: 18,
    radius: 2,
    frame: {
      style: "wood",
      wood: ["#160a04", "#311a0e", "#4f2e1b", "#6c4225", "#8a5a35"],
      lip: ["#3a2708", "#7a5a1c", "#b48a3a", "#e2c06a", "#fff0c2"],
      seed: 7,
    },
    // (Tobacco leather, not gold's green baize: the two looks apart at a
    // glance.)
    plate: { style: "leather", top: "#2b1d13", bottom: "#120b06", alpha: 1, sheen: 0.06, line: 0.1, picture: "#0b0704" },
    shadow: { blur: 22, alpha: 0.65, y: 7 },
  },
  neon: {
    type: "clean",
    accent: "#ff3fa4",
    text: "#ffffff",
    width: 10,
    radius: 18,
    frame: { style: "neon", glow: 20, core: 0.85 },
    plate: { style: "tint", top: "#0e0914", bottom: "#030205", alpha: 0.9, sheen: 0.05, line: 0, picture: "#030205" },
    shadow: null,
    glow: 14,
  },
  carbon: {
    type: "sport",
    accent: "#e8152b",
    text: "#ffffff",
    width: 12,
    radius: 6,
    frame: { style: "carbon", base: "#0b0c0e", light: "#3b3f45", gloss: 0.28 },
    plate: { style: "carbon", top: "#17181b", bottom: "#09090b", alpha: 1, sheen: 0.08, line: 0.14, picture: "#060607" },
    shadow: { blur: 20, alpha: 0.6, y: 6 },
  },
};

// "#rrggbb" at an alpha.
export function rgbaOf(hex, a = 1) {
  const n = parseInt(String(hex).slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// The accent as words are written in it: a dark one (red, pink, violet)
// lifted toward white, so a line in it reads as a highlight rather than a
// warning. Frames and pinstripes keep the pure accent.
export function accentText(hex) {
  const n = parseInt(String(hex).slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const lin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const lum = 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  if (lum >= 0.32) return String(hex).toLowerCase();
  return `#${c.map((v) => Math.round(v + (255 - v) * 0.3).toString(16).padStart(2, "0")).join("")}`;
}

// Everything the drawing needs, from the settings: the look's own values
// wherever the owner hasn't chosen. null for "own" (each box draws as it
// always has).
//   { id, name, key (changes whenever the drawing would), accent,
//     frame: { style, width, radius (px of 1080p), ...its palette },
//     plate: { style, top, bottom, alpha, sheen, line, picture },
//     type: { face, font, text, muted, accent, accentText (words in the
//             accent), glow: { colour, blur } | null,
//             numberWeight, labelWeight, labelSpacing (em), labelUpper },
//     shadow: { blur, alpha, y } | null, gap, edge }
export function lookSpec(settings) {
  const s = cleanSceneLook(settings);
  if (s.look === "own") return null;
  const b = BASE[s.look];
  const accent = s.accent ?? b.accent;
  const face = s.type ?? b.type;
  const width = s.frame ?? b.width;
  // (The small boxes' own is half the look's own main frame, whatever the
  // main one's been set to: each of the two numbers stands on its own.)
  const thin = s.thin ?? plateFrame(b.width);
  const radius = s.corner ?? b.radius;
  const frame = { ...b.frame, width, thin, radius, accent };
  if (frame.style === "line" || frame.style === "neon") frame.colour = accent;
  if (frame.style === "carbon") frame.pin = accent;
  return {
    id: s.look,
    name: LOOK_NAMES[s.look],
    key: `${s.look}|${accent}|${face}|${width}|${thin}|${radius}`,
    accent,
    frame,
    plate: { ...b.plate, accent },
    type: {
      face,
      font: TYPEFACE_FONTS[face],
      text: b.text,
      muted: rgbaOf(b.text, 0.7),
      accent,
      accentText: accentText(accent),
      glow: b.glow ? { colour: accent, blur: b.glow } : null,
      ...TYPE_SET[face],
      labelUpper: true,
    },
    shadow: b.shadow ? { ...b.shadow } : null,
    gap: s.gap,
    edge: s.edge,
  };
}

// A canvas font in the look's typeface: weight, size in px.
export const lookFont = (spec, weight, size) => `${weight} ${Math.max(1, Math.round(size))}px ${spec?.type?.font ?? TYPEFACE_FONTS.clean}`;

// ---- Which boxes get a frame, how thick, how round ---------------------------------

// Two thicknesses of frame and no more, each exactly the same on every box
// it's round (the owner, 24 November 2026: "all main borders slightly
// thicker. Inner text and small item borders thin. But don't want them all
// at slightly different PT sizes"): the main frame round the pictures and
// panels - the game, the cameras, the flight path, the mini map, a
// background box, the round's card and the standings - and the thin one
// round every small box of words or numbers (the tiles, one number, the
// info, a piece of information, the player strip, the title, the clock, a
// line of words). Chosen by what the box is, never by its size; a box can
// be given the other one, or none, on the Design page (framed: "main",
// "thin" or false - frameTier).
export const FRAME_TIERS = ["main", "thin"];
export const FRAME_TIER_NAMES = { main: "Main", thin: "Thin" };
const MAIN_FRAME = ["game", "camera", "flight", "minimap", "box", "scorecard", "standings"];
// Which of the two a layer's frame is: its own choice, else by its kind.
export const frameTier = (layer) => (FRAME_TIERS.includes(layer?.framed) ? layer.framed : MAIN_FRAME.includes(layer?.kind) ? "main" : "thin");
// The round's card and the standings: cards of their own, drawn in the
// look's type and colours on its plate (roundcard.js, finishstandings.js
// with cardTheme) - and under a look with nothing to show yet (no round
// finished), no box at all rather than an empty frame.
export const CARD_KINDS = ["scorecard", "standings"];

// A layer that fills the whole picture: the background.
export const fillsPicture = (l) => l.x <= 0.002 && l.y <= 0.002 && l.w >= 0.996 && l.h >= 0.996;

// Does the layer have a box under a look (a plate, and a frame unless it's
// marked framed:false)? Not a background filling the picture, not words
// set with no backing (words only).
export function hasBox(layer) {
  if (!layer) return false;
  if (fillsPicture(layer)) return false;
  if (WORD_KINDS.includes(layer.kind) && layer.bg === "none") return false;
  return true;
}

// The layer's size in pixels of an H-high 16:9 picture.
const shortSide = (layer, H) => Math.min(layer.w * ((H * 16) / 9), layer.h * H);

// How thick a layer's frame is, in pixels of an H-high picture: 0 where it
// has none - the "own" look, a layer marked framed:false, a layer with no
// box (hasBox), a tier set to 0. Otherwise its tier's thickness (frameTier:
// the main frame or the thin one), the same on every box of that tier
// whatever its size - only a box too small to hold it (under three times
// it across) has it cut down, so the frame never fills the box.
export function frameWidth(spec, layer, H) {
  if (!spec || !layer || layer.framed === false || !hasBox(layer)) return 0;
  const w1080 = frameTier(layer) === "main" ? spec.frame.width : (spec.frame.thin ?? plateFrame(spec.frame.width));
  if (!(w1080 > 0)) return 0;
  const px = Math.max(1, Math.round((w1080 * H) / 1080));
  return Math.max(1, Math.min(px, Math.floor(shortSide(layer, H) / 3)));
}
// A look's own thin frame, pixels of 1080p, from its main one: about half,
// at least 2.
export const plateFrame = (full) => Math.max(2, Math.round(full / 2));

// The round's card and the standings drawn in the look (roundcard.js
// drawCard, finishstandings.js drawStandings): its typeface and weights,
// its words' colours, the accent as words are written in it, and its
// plate's colours (the card's own panels a shade of them) - so the finish
// scene's most wordy box is in the same type as every other (the art
// direction, round 2: the card had kept its own green, mint and gold
// inside every look's frame). null with no look: the card as it always was.
export function cardTheme(spec) {
  if (!spec) return null;
  const T = spec.type;
  return {
    font: T.font,
    numberWeight: T.numberWeight,
    labelWeight: T.labelWeight,
    labelSpacing: T.labelSpacing,
    text: T.text,
    muted: T.muted,
    accent: T.accentText ?? T.accent,
    plateTop: spec.plate.top,
    plateBottom: spec.plate.bottom,
  };
}

// The corner radius of the box's outer edge, in pixels of an H-high
// picture: the look's, the same on every box (only a box too small for it -
// under twice it across - has it cut down); 0 for "own" and for layers
// with no box.
export function frameRadius(spec, layer, H) {
  if (!spec || !layer || !hasBox(layer)) return 0;
  const r = Math.round((spec.frame.radius * H) / 1080);
  return Math.max(0, Math.min(r, Math.floor(shortSide(layer, H) / 2)));
}

// The frame's inner edge: what goes in the box is drawn in this, its
// corners this round.
export const insetRect = (r, d) => ({ x: r.x + d, y: r.y + d, w: Math.max(1, r.w - 2 * d), h: Math.max(1, r.h - 2 * d) });
export const innerRadius = (radius, width) => Math.max(0, radius - width);

// A rectangle on whole pixels (its edges rounded, so a frame's lines are
// crisp and what's in it meets them exactly).
export function snapRect(r) {
  const x = Math.round(r.x);
  const y = Math.round(r.y);
  return { x, y, w: Math.max(1, Math.round(r.x + r.w) - x), h: Math.max(1, Math.round(r.y + r.h) - y) };
}

// ---- Boxes side by side: one line between them, not two ----------------------------

// Frames this close (pixels of 1080p) - or overlapping by up to a frame -
// are one line, not two (the owner, 25 November 2026: "If two lines bunch
// up set as 1 line not two, with the lines splitting into two again at the
// top or bottom"). Further apart, each box keeps its own frame: Tidy's
// gap (12 to start) leaves two frames with the picture between them, as
// meant; a gap of 0 makes the boxes a grid of single lines.
export const SEAM_GAP = 6;

// Where boxes' frames meet: boxes in draw order, each { rect (pixels), width
// (its frame's), alpha } - one less than half shown takes no part. Returns
// Map(index -> { left, right, top, bottom }): for each box that gives way,
// the sides it gives way on and where its edge goes - onto the other box's
// outer edge, its own frame gone along that side, so the other's frame is
// the one line between them. Past the other box's end the other's frame
// carries on alone and this one's frame turns along its own top or bottom:
// the line splits into two there.
//
// Which gives way: the one whose side is covered all along by the other's
// frame (the YouTube column's boxes beside the game, the game's frame
// running on past each). Covered both ways (two boxes the same height side
// by side): the one with fewer neighbours on that side, then the thinner
// frame, then the one drawn later. Neither (boxes stepped past each other):
// both keep their frames.
export function boxSeams(boxes, H = 1080) {
  const tol = (SEAM_GAP * H) / 1080;
  const live = boxes.map((b, i) => ({ ...b, i })).filter((b) => b.width > 0 && (b.alpha ?? 1) >= 0.5 && b.rect.w > 0 && b.rect.h > 0);
  const right = (r) => r.x + r.w;
  const bottom = (r) => r.y + r.h;
  // Every pair of facing sides close enough: [{ a, aSide, b, bSide, span }].
  const pairs = [];
  for (const A of live)
    for (const B of live) {
      if (A.i === B.i) continue;
      const P = A.rect;
      const Q = B.rect;
      const thin = Math.min(A.width, B.width);
      const thick = Math.max(A.width, B.width);
      // A's right side facing B's left.
      const gx = Q.x - right(P);
      const oy = [Math.max(P.y, Q.y), Math.min(bottom(P), bottom(Q))];
      if (gx >= -thin && gx <= tol && oy[1] - oy[0] > 2 * thick) pairs.push({ a: A.i, aSide: "right", b: B.i, bSide: "left", span: oy, at: { a: Q.x, b: right(P) } });
      // A's bottom facing B's top.
      const gy = Q.y - bottom(P);
      const ox = [Math.max(P.x, Q.x), Math.min(right(P), right(Q))];
      if (gy >= -thin && gy <= tol && ox[1] - ox[0] > 2 * thick) pairs.push({ a: A.i, aSide: "bottom", b: B.i, bSide: "top", span: ox, at: { a: Q.y, b: bottom(P) } });
    }
  if (!pairs.length) return new Map();
  const box = new Map(live.map((b) => [b.i, b]));
  const key = (i, side) => `${i}:${side}`;
  const onSide = new Map();
  for (const p of pairs) {
    for (const [i, side] of [
      [p.a, p.aSide],
      [p.b, p.bSide],
    ]) {
      if (!onSide.has(key(i, side))) onSide.set(key(i, side), []);
      onSide.get(key(i, side)).push(p);
    }
  }
  // Is a box's side covered all along by its neighbours' frames (to within
  // its own frame's width at each end)?
  const covered = (i, side) => {
    const r = box.get(i).rect;
    const along = side === "left" || side === "right" ? [r.y, bottom(r)] : [r.x, right(r)];
    const t = box.get(i).width + 1;
    const spans = onSide
      .get(key(i, side))
      .map((p) => p.span)
      .sort((u, v) => u[0] - v[0]);
    let reach = along[0] + t;
    for (const [s, e] of spans) {
      if (s > reach + 1) return false;
      reach = Math.max(reach, e);
    }
    return reach >= along[1] - t;
  };
  const neighbours = (i, side) => onSide.get(key(i, side)).length;
  // Each pair: which side gives way (null: neither).
  const choose = (p, keep = new Set()) => {
    const ca = covered(p.a, p.aSide) && !keep.has(key(p.a, p.aSide));
    const cb = covered(p.b, p.bSide) && !keep.has(key(p.b, p.bSide));
    if (!ca && !cb) return null;
    if (ca !== cb) return ca ? "a" : "b";
    const A = box.get(p.a);
    const B = box.get(p.b);
    const na = neighbours(p.a, p.aSide);
    const nb = neighbours(p.b, p.bSide);
    if (na !== nb) return na < nb ? "a" : "b";
    if (A.width !== B.width) return A.width < B.width ? "a" : "b";
    return p.a > p.b ? "a" : "b";
  };
  // A side that keeps its frame for one neighbour can't give way to
  // another (that one would meet no line): it keeps it for all.
  let gives = pairs.map((p) => choose(p));
  for (let round = 0; round < 4; round++) {
    const keep = new Set();
    pairs.forEach((p, n) => {
      if (gives[n] === "a") keep.add(key(p.b, p.bSide));
      if (gives[n] === "b") keep.add(key(p.a, p.aSide));
    });
    const next = pairs.map((p) => choose(p, keep));
    if (next.every((g, n) => g === gives[n])) break;
    gives = next;
  }
  // Where each giving side goes: the neighbour's outer edge (the one
  // alongside it the furthest, where there are several).
  const out = new Map();
  const best = new Map();
  pairs.forEach((p, n) => {
    if (!gives[n]) return;
    const [i, side, at] = gives[n] === "a" ? [p.a, p.aSide, p.at.a] : [p.b, p.bSide, p.at.b];
    const len = p.span[1] - p.span[0];
    const k = key(i, side);
    if ((best.get(k) ?? -1) >= len) return;
    best.set(k, len);
    if (!out.has(i)) out.set(i, {});
    out.get(i)[side] = at;
  });
  return out;
}

// A box giving way on some sides (boxSeams): { draw: the rect its plate and
// frame are drawn on - run on past each giving side, so that side's frame
// and corners fall beyond it - and clip: { x0, y0, x1, y1 }, what of them is
// kept (up to where it meets the other's frame) }.
export function seamCut(rect, cut, { width, radius }) {
  const ext = width + radius + 2;
  const clip = { x0: -Infinity, y0: -Infinity, x1: Infinity, y1: Infinity };
  let x0 = rect.x;
  let y0 = rect.y;
  let x1 = rect.x + rect.w;
  let y1 = rect.y + rect.h;
  if (cut.left != null) {
    clip.x0 = cut.left;
    x0 = cut.left - ext;
  }
  if (cut.right != null) {
    clip.x1 = cut.right;
    x1 = cut.right + ext;
  }
  if (cut.top != null) {
    clip.y0 = cut.top;
    y0 = cut.top - ext;
  }
  if (cut.bottom != null) {
    clip.y1 = cut.bottom;
    y1 = cut.bottom + ext;
  }
  return { draw: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, clip };
}

// ---- Boxes that take turns ----------------------------------------------------------

// The same place: every edge within SAME_PLACE of a share of the picture -
// or, as an owner drags them, two boxes mostly over each other: their
// overlap at least SAME_OVERLAP of the two together (intersection over
// union). The owner's YouTube column as made takes turns in three not
// quite matching places - the camera from 0.3196 down, the flight paths
// from 0.327, the numbers from 0.352 - and each time of the shot had had
// frames of its own, crossing as one faded into the next, until Tidy (the
// art direction, round 2: "most owners will see the untidied version
// first").
export const SAME_PLACE = 0.004;
export const SAME_OVERLAP = 0.85;
export function overlapOf(a, b) {
  const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  if (!(ix > 0 && iy > 0)) return 0;
  const both = ix * iy;
  return both / (a.w * a.h + b.w * b.h - both);
}
export function samePlace(a, b) {
  const near = (p, q) => Math.abs(p - q) <= SAME_PLACE;
  if (near(a.x, b.x) && near(a.y, b.y) && near(a.x + a.w, b.x + b.w) && near(a.y + a.h, b.y + b.h)) return true;
  return overlapOf(a, b) >= SAME_OVERLAP;
}

// The layers with a box (hasBox) in the same place, each place's in draw
// order: [[layer, ...], ...], in the order each place is first met. A layer
// joins the first place whose first layer it's in the same place as.
export function placeGroups(layers) {
  const groups = [];
  for (const l of layers ?? []) {
    if (!l || l.on === false || !hasBox(l)) continue;
    const grp = groups.find((g) => samePlace(g[0], l));
    if (grp) grp.push(l);
    else groups.push([l]);
  }
  return groups;
}
// The box round a place's layers: all of them (shares of the picture).
export const placeRect = (members) => boundsOf(members);

// The boxes: layers that take turns in the same place (the YouTube
// column's camera before the shot, the flight path while it flies, the
// numbers after) share ONE box - its plate and frame stay put while what's
// in it fades from one to the next. layers: in draw order; alphaOf(layer):
// how shown it is now, 0 - 1. Returns a Map of layer id -> the box's alpha,
// holding only each group's box drawer: the first (bottom-most) member
// shown at all. Its alpha: its members' together - the strongest of those
// shown at each time of the shot, added up (one fading out as the next
// fades in is 1 all the way through: the frame never dims as they cross
// over), at most 1. Layers with no box (hasBox) are in no group. The
// groups are placeGroups' (the box round each: placeRect, all of it, so it
// doesn't move as one member takes over from the next).
export function boxDrawers(layers, alphaOf) {
  const out = new Map();
  for (const members of placeGroups(layers)) {
    let drawer = null;
    const byWhen = new Map();
    for (const l of members) {
      const a = Math.max(0, Math.min(1, Number(alphaOf(l)) || 0));
      if (!(a > 0.001)) continue;
      drawer ??= l;
      const w = l.when ?? "always";
      byWhen.set(w, Math.max(byWhen.get(w) ?? 0, a));
    }
    if (drawer) out.set(drawer.id, together(byWhen.values()));
  }
  return out;
}
// Alphas of things taking turns, together: added up, at most 1.
const together = (alphas) => Math.min(1, [...alphas].reduce((t, a) => t + a, 0));

// ---- A set taking turns with a box, or another set ----------------------------------

// The owner's YouTube column takes turns three ways in one place: a camera
// before the shot, two flight paths one above the other while it flies,
// eight numbers in a grid after. None of those is in the same place as
// another, so each would have its own frames, and while one time fades into
// the next both sets' frames would be drawn at once - bezels across the
// camera's picture, flight paths over the numbers' frames. They're one
// region: one plate and one frame round all of it, the sets' members in it
// with fine lines between them (framedraw.js drawDivider), fading with
// them, and no frame of their own.
//
// A set: layers shown at the same times (one `when`) that touch or sit no
// more than about a gap apart and between them fill their bounding box. A
// region: sets shown at times that never meet (sim/shotphase.mjs shownIn)
// whose boxes are in the same place (samePlace: as Tidy leaves them, or
// mostly over each other as the owner dragged them), at least one of them
// more than one box (one box each is boxDrawers'). Layers shown always
// never take turns.
//
// The region's box is round all its sets; each set's boxes are fitted to it
// (cells: each box's place in the region, its set's bounding box stretched
// to the region's) - so the numbers that sat a little lower than the
// camera before them fill the same frame, not leaving a strip of empty
// plate along its top. A tidied scene's sets are in the region's place
// already: their cells are where the boxes are.
//
// layers: in draw order. Returns [{ rect (shares of the picture), ids (in
// draw order), sets: [{ when, ids }], cells: Map(id -> rect, shares),
// dividers: [{ x0, y0, x1, y1, ids: [a, b] }] (shares: the line down or
// across the middle of the gap between two of a set's cells, as long as
// they face each other) }].
// The most gap between a set's boxes: Tidy's biggest (LOOK_LIMITS.gap, 48
// pixels of 1080p) and a little, as shares of the picture.
const SET_GAP_X = 50 / 1920;
const SET_GAP_Y = 50 / 1080;
// A set's boxes fill at least this much of its bounding box.
const SET_FILL = 0.8;
// The gap between two boxes along each way (less than 0: they overlap that way).
const gapX = (a, b) => Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w));
const gapY = (a, b) => Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h));
const boundsOf = (rs) => {
  const x = Math.min(...rs.map((r) => r.x));
  const y = Math.min(...rs.map((r) => r.y));
  return { x, y, w: Math.max(...rs.map((r) => r.x + r.w)) - x, h: Math.max(...rs.map((r) => r.y + r.h)) - y };
};
const phasesOf = (when) => PHASES.filter((p) => shownIn(when ?? "always", p));

export function boxRegions(layers) {
  const list = (layers ?? []).filter((l) => l && l.on !== false && hasBox(l) && (l.when ?? "always") !== "always");
  // Each time's sets.
  const sets = [];
  for (const when of [...new Set(list.map((l) => l.when))]) {
    const ls = list.filter((l) => l.when === when);
    const top = ls.map((_, i) => i);
    const find = (i) => (top[i] === i ? i : (top[i] = find(top[i])));
    for (let i = 0; i < ls.length; i++)
      for (let j = i + 1; j < ls.length; j++) {
        const gx = gapX(ls[i], ls[j]);
        const gy = gapY(ls[i], ls[j]);
        if ((gx < -SAME_PLACE && gy <= SET_GAP_Y) || (gy < -SAME_PLACE && gx <= SET_GAP_X)) top[find(i)] = find(j);
      }
    const byTop = new Map();
    ls.forEach((l, i) => byTop.set(find(i), [...(byTop.get(find(i)) ?? []), l]));
    for (const members of byTop.values()) {
      const rect = boundsOf(members);
      const area = members.reduce((t, l) => t + l.w * l.h, 0);
      if (area < rect.w * rect.h * SET_FILL) continue;
      sets.push({ when, phases: phasesOf(when), members, rect });
    }
  }
  const order = new Map((layers ?? []).map((l, i) => [l?.id, i]));
  const used = new Set();
  const out = [];
  for (const a of sets) {
    if (used.has(a)) continue;
    const grp = [a];
    for (const b of sets) {
      if (b === a || used.has(b) || !samePlace(a.rect, b.rect)) continue;
      if (grp.every((c) => !c.phases.some((p) => b.phases.includes(p)))) grp.push(b);
    }
    if (grp.length < 2 || !grp.some((g) => g.members.length > 1)) continue;
    for (const g of grp) used.add(g);
    const members = grp.flatMap((g) => g.members).sort((p, q) => order.get(p.id) - order.get(q.id));
    const rect = boundsOf(grp.map((g) => g.rect));
    const cells = new Map();
    for (const g of grp) for (const l of g.members) cells.set(l.id, fitInto(l, g.rect, rect));
    out.push({
      rect,
      ids: members.map((l) => l.id),
      sets: grp.map((g) => ({ when: g.when, ids: g.members.map((l) => l.id) })),
      cells,
      dividers: grp.flatMap((g) => dividersOf(g.members.map((l) => ({ id: l.id, ...cells.get(l.id) })))),
    });
  }
  return out;
}

// A box r in a set whose bounding box is `from`, moved and stretched with
// it to `to` - where it already is when the two are the same.
function fitInto(r, from, to) {
  const same = ["x", "y", "w", "h"].every((k) => Math.abs(from[k] - to[k]) < 1e-9);
  if (same) return { x: r.x, y: r.y, w: r.w, h: r.h };
  const kx = to.w / from.w;
  const ky = to.h / from.h;
  return { x: to.x + (r.x - from.x) * kx, y: to.y + (r.y - from.y) * ky, w: r.w * kx, h: r.h * ky };
}

// The lines between a set's boxes: down the middle of the gap between two
// side by side, across it between two one above the other, as long as they
// face each other.
function dividersOf(members) {
  const out = [];
  for (let i = 0; i < members.length; i++)
    for (let j = i + 1; j < members.length; j++) {
      const a = members[i];
      const b = members[j];
      const gx = gapX(a, b);
      const gy = gapY(a, b);
      if (gx >= -SAME_PLACE && gx <= SET_GAP_X && gy < -SAME_PLACE) {
        const [l, r] = a.x < b.x ? [a, b] : [b, a];
        const x = (l.x + l.w + r.x) / 2;
        out.push({ x0: x, y0: Math.max(a.y, b.y), x1: x, y1: Math.min(a.y + a.h, b.y + b.h), ids: [a.id, b.id] });
      } else if (gy >= -SAME_PLACE && gy <= SET_GAP_Y && gx < -SAME_PLACE) {
        const [t, u] = a.y < b.y ? [a, b] : [b, a];
        const y = (t.y + t.h + u.y) / 2;
        out.push({ x0: Math.max(a.x, b.x), y0: y, x1: Math.min(a.x + a.w, b.x + b.w), y1: y, ids: [a.id, b.id] });
      }
    }
  return out;
}
