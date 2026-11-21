// The Recording panel's designer helpers (videopanel.js; the owner: "show
// how the tiles will look in game ... enable better framing of things"):
//
//   tile pictures   each Add button that puts words on the picture (a
//                   number, the tiles, a piece of information) shows that
//                   layer as the game draws it - its look, a real or sample
//                   value - drawn by the compositor itself (wordsFor)
//   guide lines     the thirds and the safe area over the picture
//                   (sim/sceneframe.mjs), which dragged edges lock onto
//   frame icons     each quick frame's button a little picture of where it
//                   puts the layer
//   clean preview   the scene full size, as it will be recorded - no
//                   designer's outlines or names over it
//
// Thin: the rules are sim/sceneframe.mjs's and sim/videolayout.mjs's.

import { addWidget, cleanLayout, widgetById } from "./sim/videolayout.mjs";
import { guideLines, frameRect, FRAMES, FRAME_NAMES } from "./sim/sceneframe.mjs";
import { esc } from "./util.js";

// The kinds an Add button shows a picture of: words the compositor draws.
export const PICTURED = new Set(["stat", "tiles", "field", "info", "player", "minimap", "title", "clock", "text", "box"]);

// A widget's layer as it'd be added (its default size and look).
function widgetLayer(id) {
  const { layout, id: lid } = addWidget(cleanLayout({ id: "pal", name: "pal", layers: [] }), id);
  return layout.layers.find((l) => l.id === lid) ?? null;
}

// A canvas for each pictured Add button, to draw into (drawPalette).
export const chipPicture = (w) => (PICTURED.has(w.kind) ? `<canvas class="vp-chip-pic" data-pic="${esc(w.id)}" width="160" height="60" aria-hidden="true"></canvas>` : "");

// Every pictured Add button drawn: the layer at its own size in a 1920 x
// 1080 picture, scaled into its button, keeping its shape.
export function drawPalette(root, compositor) {
  for (const c of root.querySelectorAll("canvas[data-pic]")) {
    const layer = c._layer ?? (c._layer = widgetLayer(c.dataset.pic));
    const g = c.getContext("2d");
    g.clearRect(0, 0, c.width, c.height);
    if (!layer) continue;
    const W = 1920;
    const H = 1080;
    const lw = Math.max(1, Math.round(layer.w * W));
    const lh = Math.max(1, Math.round(layer.h * H));
    let content = null;
    try {
      content = compositor.wordsFor(layer, true, H);
    } catch {
      content = null;
    }
    const off = c._off ?? (c._off = document.createElement("canvas"));
    off.width = lw;
    off.height = lh;
    const og = off.getContext("2d");
    og.clearRect(0, 0, lw, lh);
    if (content) content.draw(og, lw, lh, H);
    else {
      // Nothing to show yet (no shot hit): its name, faint.
      og.fillStyle = "rgba(255,255,255,0.35)";
      og.font = `600 ${Math.round(lh * 0.35)}px system-ui, sans-serif`;
      og.textAlign = "center";
      og.textBaseline = "middle";
      og.fillText(widgetById(c.dataset.pic)?.name ?? "", lw / 2, lh / 2, lw * 0.9);
    }
    const k = Math.min(c.width / lw, c.height / lh);
    const dw = lw * k;
    const dh = lh * k;
    g.drawImage(off, (c.width - dw) / 2, (c.height - dh) / 2, dw, dh);
  }
}

// The guides' lines over the picture (as shares, for the page's boxes).
export function guidesHtml(on, W, H) {
  const { xs, ys } = guideLines({ W, H, ...on });
  return [...xs.map((x) => `<i class="vp-grid-line v" style="left:${(x / W) * 100}%"></i>`), ...ys.map((y) => `<i class="vp-grid-line h" style="top:${(y / H) * 100}%"></i>`)].join("");
}

// The quick frames' buttons, each a little picture of where it puts it.
export function frameButtons(words = false) {
  return FRAMES.map((f) => {
    const r = frameRect(f, { words });
    return `<button data-frame="${f}" class="vp-fq" title="${esc(FRAME_NAMES[f])}" aria-label="${esc(FRAME_NAMES[f])}"><i style="left:${r.x * 100}%;top:${r.y * 100}%;width:${r.w * 100}%;height:${r.h * 100}%"></i></button>`;
  }).join("");
}

// The scene full size, as it'll be recorded: the compositor's own picture
// copied each frame, nothing over it. Click, or Esc, to close.
export function openCleanPreview(doc, compositor, note = "") {
  const d = doc.createElement("dialog");
  d.className = "vp-clean";
  d.innerHTML = `<canvas></canvas><p>${esc(note || "As it will be recorded - click or press Esc to close")}</p>`;
  const c = d.querySelector("canvas");
  let on = true;
  const copy = () => {
    if (!on) return;
    const src = compositor.canvas;
    if (c.width !== src.width || c.height !== src.height) {
      c.width = src.width;
      c.height = src.height;
    }
    c.getContext("2d").drawImage(src, 0, 0);
    doc.defaultView.requestAnimationFrame(copy);
  };
  d.addEventListener("click", () => d.close());
  d.addEventListener("close", () => {
    on = false;
    d.remove();
  });
  doc.body.appendChild(d);
  d.showModal();
  copy();
  return d;
}
