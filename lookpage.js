// The Recording panel's Look page (videopanel.js): one look for every box in
// every scene - its frames, plates and type (sim/scenelook.mjs, drawn by
// framedraw.js) - picked from a gallery of cards, then its colour, its
// typeface and its frame's exact sizes; a live picture of the scene; and
// Tidy (sim/scenetidy.mjs), which lines the boxes up and sets them evenly
// apart. The owner, 23 November 2026: "Make multiple choices but let the
// border automatically fit around the scene inputs and make it easier to
// align and have boxes consistent."
//
// Here: the page's words and buttons, the cards drawn, and what the Design
// page says of a layer while a look is on. The panel (videopanel.js) keeps
// the state and handles the clicks; the look is the recorder's
// (VideoRecorder.look, setLook), kept per PC.

import { LOOKS, LOOK_NAMES, LOOK_LINES, ACCENTS, ACCENT_NAMES, TYPEFACES, TYPEFACE_NAMES, TYPEFACE_FONTS, LOOK_LIMITS, FRAME_TIER_NAMES, lookSpec, hasBox, fillsPicture, frameTier } from "./sim/scenelook.mjs";
import { drawLookCard } from "./framedraw.js";
import { esc } from "./util.js";

// Picking a look starts it as it's made: its own colour, type, frame and
// corners (each look's are made for its material - walnut's frame is 18
// pixels, broadcast glass's 3). The gap and the edge are the scene's
// spacing, not the look's: they stay.
export const FRESH_LOOK = { accent: null, type: null, frame: null, thin: null, corner: null };

// The exact sizes (pixels of a 1080p picture, whatever size is recorded):
// [key, name, the line saying what it does]. The frame's three are the
// look's own until changed; Tidy's two are the scene's spacing. Two frame
// thicknesses and no more, each the same on every box it's round (the
// owner, 24 November 2026: "all main borders slightly thicker. Inner text
// and small item borders thin").
export const FRAME_SIZES = [
  ["frame", "Main frames", "Round the game, the cameras, the flight path, the mini map and the cards - every one exactly this thick."],
  ["thin", "Small boxes' frames", "Round the numbers, the words, who's hitting, the hole, the clock and the title - every one exactly this thick. 0: none."],
  ["corner", "Corners", "How round every box's outer corners are. 0: square."],
];
export const TIDY_SIZES = [
  ["gap", "Gap between boxes", "How far apart Tidy sets boxes that sit side by side - and how far apart a dragged edge locks."],
  ["edge", "In from the edge", "How far in from the picture's edge Tidy sets the boxes along it - and where a dragged edge locks."],
];

// A look's own frame thickness and corners (null: "own", which has none).
export function ownSizes(look) {
  const spec = lookSpec({ look });
  return spec ? { frame: spec.frame.width, thin: spec.frame.thin, corner: spec.frame.radius, accent: spec.accent, type: spec.type.face } : null;
}

// ---- The page -----------------------------------------------------------------------

// The page, built once: the cards (each a canvas drawn later), the places
// the settings go, the picture and Tidy. phases: the "show it as" buttons'
// html (the Design page's own, sharing its time of the shot).
export function lookTabHtml(phases) {
  // The looks, then - a slim card across the bottom - no look at all.
  const cards = [...LOOKS.filter((id) => id !== "own"), "own"].map(
    (id) => `<button type="button" class="vp-look-card${id === "own" ? " plain" : ""}" data-look="${id}" aria-pressed="false" title="${esc(LOOK_LINES[id])}">
      <span class="vp-look-pic"><canvas aria-hidden="true"></canvas><span class="vp-look-tick" aria-hidden="true">In use</span></span>
      <span class="vp-look-words"><b>${esc(LOOK_NAMES[id])}</b><span>${esc(id === "own" ? `No look: ${LOOK_LINES[id].replace(/^E/, "e")}` : LOOK_LINES[id])}</span></span>
    </button>`,
  ).join("");
  return `<div class="vp-look-main">
      <section class="vp-look-pick">
        <h3>Look <span class="muted small">one set of frames, backings and type for every box in every scene</span></h3>
        <p class="muted small">The frames fit round each box by themselves - the game, the cameras, the numbers - and boxes that take turns in one place share one frame. Picking a look starts it as it's made; change its colour, type and frame below.</p>
        <div class="vp-look-cards" role="group" aria-label="Look">${cards}</div>
      </section>
      <div class="vp-look-opts"></div>
    </div>
    <div class="vp-look-side">
      <div class="vp-look-top">
        <label>Scene <select data-layout></select></label>
        <button type="button" data-tab-go="design" title="The Design page: move, size and add the boxes">Design it</button>
      </div>
      <div class="vp-phase vp-look-phase" role="group" aria-label="Show the picture as it is">${phases}</div>
      <div class="vp-look-stage"><canvas class="vp-look-preview"></canvas></div>
      <section class="vp-look-tidy">
        <h3>Line them up</h3>
        <p class="muted small">Tidy lines the boxes up and sets them evenly apart, so the frames read as one set: edges that nearly line up line up, boxes sit the gap apart and the same way in from the edge, clear of the game's or a camera's frame, and boxes that take turns in one place end up in exactly the same place. Nothing is added or taken out.</p>
        <div class="buttons">
          <button type="button" data-act="tidy" class="primary" title="This scene's boxes lined up and evenly apart">Tidy this scene</button>
          <button type="button" data-act="tidy-all" title="Every scene's boxes lined up and evenly apart, each on its own">Tidy every scene</button>
          <button type="button" data-act="untidy" title="The scenes back as they were before the last tidy (any changed since are left as they are)" disabled>Undo tidy</button>
        </div>
        <p class="small vp-tidy-said" aria-live="polite"></p>
        <div class="vp-look-sizes vp-look-tidy-sizes"></div>
      </section>
    </div>`;
}

// One exact size: its slider and number, "the look's own" where it can be
// (own: what the look's own is; null where it can't), and its line.
function sizeRow([key, name, line], value, own) {
  const { min, max } = LOOK_LIMITS[key];
  const isOwn = own != null && value == null;
  const v = value ?? own ?? min;
  const back =
    own == null
      ? ""
      : `<button type="button" data-look-own="${key}" data-own="${own}" class="vp-look-back${isOwn ? " on" : ""}" title="${esc(`The look's own: ${own} px`)}">${isOwn ? `The look's own` : `Back to the look's own (${own})`}</button>`;
  return `<div class="vp-look-size" data-size="${key}">
      <label><span class="vp-look-size-name">${esc(name)}</span>
        <input type="range" min="${min}" max="${max}" step="1" value="${v}" data-look-num="${key}" aria-label="${esc(name)}">
        <input type="number" class="vp-num" min="${min}" max="${max}" step="1" value="${v}" data-look-num="${key}" aria-label="${esc(name)}, pixels"><span class="muted small">px</span></label>
      ${back}
      <p class="muted small">${esc(line)}</p>
    </div>`;
}

// The look's settings: its colour, its type and its frame (none to change
// for "Each box as you made it", which keeps every box's own).
export function lookOptsHtml(s) {
  const own = ownSizes(s.look);
  const off = !own;
  const face = s.type ?? own?.type ?? null;
  const ownAccent = own?.accent ?? "#ffffff";
  const sample = (f) => `<span class="vp-face-sample" style="font-family:${esc(TYPEFACE_FONTS[f])}">187<small>yds</small></span>`;
  const note = off ? `<p class="vp-look-off small">Each box keeps the border, colours and type you gave it on the Design page. Pick a look for these.</p>` : "";
  return `${note}
    <fieldset class="vp-look-set"${off ? " disabled" : ""}>
      <legend>Colour</legend>
      <p class="muted small">The colour picked out in every box: the glass's edge, the neon tube, carbon's pinstripe, the brass's shine - and the units beside the numbers.</p>
      <div class="vp-look-accents">
        <button type="button" data-look-accent="" class="vp-look-back${s.accent == null && !off ? " on" : ""}" title="The colour the look is made with"><i style="--sw:${esc(ownAccent)}"></i>The look's own</button>
        <div class="vp-swatches" role="group" aria-label="Colours">${ACCENTS.map((c) => `<button type="button" data-look-accent="${c}" class="${!off && s.accent === c ? "on" : ""}" title="${esc(ACCENT_NAMES[c])}" aria-label="${esc(ACCENT_NAMES[c])}" style="--sw:${c}"></button>`).join("")}</div>
      </div>
    </fieldset>
    <fieldset class="vp-look-set"${off ? " disabled" : ""}>
      <legend>Type</legend>
      <p class="muted small">One typeface for every word in every scene - the numbers, their labels, names and titles - and the flight path's.</p>
      <div class="vp-look-faces" role="group" aria-label="Typeface">
        <button type="button" data-look-type="" class="vp-face${s.type == null && !off ? " on" : ""}" title="The typeface the look is made with">${own ? sample(own.type) : `<span class="vp-face-sample">-</span>`}<span class="vp-face-name">The look's own${own ? `<br><span class="muted">${esc(TYPEFACE_NAMES[own.type])}</span>` : ""}</span></button>
        ${TYPEFACES.map((f) => `<button type="button" data-look-type="${f}" class="vp-face${!off && s.type === f ? " on" : ""}${!off && s.type == null && face === f ? " own" : ""}" title="${esc(TYPEFACE_NAMES[f])}">${sample(f)}<span class="vp-face-name">${esc(TYPEFACE_NAMES[f])}</span></button>`).join("")}
      </div>
    </fieldset>
    <fieldset class="vp-look-set"${off ? " disabled" : ""}>
      <legend>Frame</legend>
      <p class="muted small">In pixels of a 1080p picture, whatever size is recorded - the same on every box, so they all match.</p>
      <div class="vp-look-sizes">${FRAME_SIZES.map((row) => sizeRow(row, off ? null : s[row[0]], own ? own[row[0]] : 0)).join("")}</div>
    </fieldset>`;
}

// Tidy's spacing: the gap between boxes and how far in from the edge.
export const tidySizesHtml = (s) => TIDY_SIZES.map((row) => sizeRow(row, s[row[0]], null)).join("");

// ---- The cards ------------------------------------------------------------------------

// The cards drawn: each look as it's made (the one in use as it's set now),
// at its size on the page - one at a time, a moment apart, so the page never
// stops while a look's textures are made the first time - and only those
// that changed.
export class LookCards {
  constructor(box) {
    this.box = box;
    this.keys = new Map();
    this.queue = [];
    this.timer = null;
  }
  get win() {
    return this.box.ownerDocument.defaultView;
  }
  // s: the look's settings as they are now.
  update(s) {
    const dpr = this.win?.devicePixelRatio ?? 1;
    const want = [];
    for (const card of this.box.querySelectorAll("[data-look]")) {
      const c = card.querySelector("canvas");
      const r = c.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) continue;
      const w = Math.round(r.width * dpr);
      const h = Math.round(r.height * dpr);
      const id = card.dataset.look;
      const settings = id === s.look ? { look: id, accent: s.accent, type: s.type, frame: s.frame, thin: s.thin, corner: s.corner } : { look: id };
      const key = `${w}x${h}|${JSON.stringify(settings)}`;
      if (this.keys.get(id) === key) continue;
      want.push({ c, w, h, id, settings, key });
    }
    if (!want.length) return;
    // (The one in use first.)
    want.sort((a, b) => (b.id === s.look) - (a.id === s.look));
    this.queue = [...this.queue.filter((q) => !want.some((x) => x.id === q.id)), ...want];
    this.next();
  }
  next() {
    if (this.timer != null || !this.queue.length || !this.win) return;
    this.timer = this.win.setTimeout(() => {
      this.timer = null;
      const q = this.queue.shift();
      if (q) {
        if (q.c.width !== q.w || q.c.height !== q.h) {
          q.c.width = q.w;
          q.c.height = q.h;
        }
        try {
          drawLookCard(q.c, q.settings);
          this.keys.set(q.id, q.key);
        } catch {
          // Not drawn (a page that can't): the card keeps its words.
        }
      }
      this.next();
    }, 16);
  }
}

// ---- The Design page, while a look is on ------------------------------------------------

// A layer's frame in one click, beside it in the layers list (the owner, 25
// November 2026: "Also allow not framing something. But crucially make all
// of this easy and simple to change"): what it has now - Main, Thin or None
// - and a click for the next (nextFrame). Nothing for a layer the look gives
// no box (the background, words with no backing), or with no look.
export function frameChip(l, spec) {
  if (!spec || !l || fillsPicture(l) || !hasBox(l)) return "";
  const now = l.framed === false ? "none" : frameTier(l);
  const next = { main: "Thin", thin: "None", none: "Main" }[now];
  const name = now === "none" ? "None" : FRAME_TIER_NAMES[now];
  return `<button type="button" data-frame-cycle class="vp-frame-chip ${now}" title="Its frame: ${esc(name)}${now === "none" ? "" : ` (${now === "main" ? spec.frame.width : spec.frame.thin} px)`}. Click for ${esc(next)}.">${esc(name)}</button>`;
}
// The frame a click on the chip gives it: Main, then Thin, then None.
export function nextFrame(l) {
  const now = l?.framed === false ? "none" : frameTier(l);
  return { main: "thin", thin: false, none: "main" }[now];
}

// A layer's frame under the look: the main one, the thin one, or none
// (framed: "main", "thin", false - its kind's own until picked; sim/
// scenelook.mjs frameTier). A layer the look gives no box says why.
export function framedOpts(l, spec) {
  if (!spec || !l) return "";
  if (fillsPicture(l)) return `<p class="muted small vp-look-why">It fills the picture - the background - so the look doesn't frame it.</p>`;
  if (!hasBox(l)) return `<p class="muted small vp-look-why">Words only (no backing): no box or frame, just the look's type. A backing gives it the look's box.</p>`;
  // (The round's card and the standings keep their own words and colours
  // inside the look's frame.)
  const card = l.kind === "scorecard" || l.kind === "standings" ? `<p class="muted small vp-look-why">A card of its own: it keeps its own words and colours, the look's frame round it.</p>` : "";
  const now = l.framed === false ? "none" : frameTier(l);
  const usual = frameTier({ kind: l.kind });
  const px = { main: spec.frame.width, thin: spec.frame.thin };
  const btn = (v, name) => `<button type="button" data-framed="${v}" class="${now === v ? "on" : ""}" title="${v === "none" ? "No frame round it - its backing and type stay the look's" : `The look's ${name.toLowerCase()} frame: ${px[v]} px, as on every ${v === "main" ? "picture and panel" : "small box"}`}">${esc(name)}${v === usual ? " (its usual)" : ""}</button>`;
  return `${card}<div class="vp-opt"><span title="Which of the look's two frames goes round this box - the same thickness as every other box with that one">Frame (${esc(spec.name)})</span><div class="vp-choice" role="group">${btn("main", FRAME_TIER_NAMES.main)}${btn("thin", FRAME_TIER_NAMES.thin)}${btn("none", "None")}</div></div>`;
}

// The controls a look sets for every box (border, outline, corners,
// colours): kept for "Each box as you made it", shown dimmed under a note
// saying the look sets them, with the way to the Look page.
export function lookSet(spec, what, html) {
  if (!spec || !html) return html;
  return `<div class="vp-look-held">
      <p class="vp-look-note small">The look, <b>${esc(spec.name)}</b>, sets ${esc(what)} on every box. <button type="button" data-tab-go="look">Change the look</button></p>
      <div class="vp-look-dim" title="Used again with the look Each box as you made it">${html}</div>
    </div>`;
}
