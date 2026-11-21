// The standings at the finish (sim/finishstandings.mjs has what's in
// them): beside the round card at the end of a round (roundcard.js
// RoundCardView), and drawn into the recording's Finish scene - the
// "standings" layer (compositor.js) - in the round card's own colours.

import { esc } from "./util.js";
import { KIND_TITLES } from "./sim/finishstandings.mjs";

// As a panel of the page: each block a heading, its line and its rows.
export function standingsHtml(blocks) {
  if (!blocks?.length) return "";
  return `<h3>Standings</h3>${blocks
    .map(
      (b) => `<section class="fs-block"><p class="fs-kind">${esc(KIND_TITLES[b.kind] ?? "")}</p><h4>${esc(b.title)}</h4>${b.line ? `<p class="fs-line">${esc(b.line)}</p>` : ""}<table class="fs-table">${b.rows
        .map((r) => (r.gap ? `<tr class="fs-gap"><td colspan="3">...</td></tr>` : `<tr class="${r.me ? "me" : ""}"><td>${r.place}</td><td>${esc(r.name)}</td><td>${esc(r.value)}</td></tr>`))
        .join("")}</table></section>`,
    )
    .join("")}`;
}

const FONT = `"Bahnschrift", "DIN Alternate", "Segoe UI", "Helvetica Neue", Arial, sans-serif`;
const ACCENT = "#ffd23f";
const TEXT = "#eaf4ec";
const MUTED = "rgba(234, 244, 236, 0.66)";
const PANEL = "rgba(8, 22, 14, 0.86)";
const LINE = "rgba(143, 227, 166, 0.22)";

function fit(g, s, max) {
  let str = String(s ?? "");
  while (str.length > 1 && g.measureText(str).width > max) str = str.slice(0, -2) + "…";
  return str;
}

// The words of a line wrapped to `max` wide, at most `lines` of them.
function wrap(g, s, max, lines = 2) {
  const words = String(s ?? "").split(/\s+/).filter(Boolean);
  const out = [];
  let now = "";
  for (const w of words) {
    const next = now ? `${now} ${w}` : w;
    if (g.measureText(next).width <= max || !now) now = next;
    else {
      out.push(now);
      now = w;
      if (out.length === lines) break;
    }
  }
  if (out.length < lines && now) out.push(now);
  if (out.length === lines && words.join(" ") !== out.join(" ")) out[lines - 1] = fit(g, `${out[lines - 1]}…`, max);
  return out;
}

// Drawn into a w x h box from (0, 0): a dark panel, each block in turn -
// its kind small, its name, its line, its rows (this bay's in the accent) -
// as many as fit.
export function drawStandings(g, blocks, w, h) {
  if (!blocks?.length) return;
  const u = Math.min(w / 420, h / 560);
  const pad = 18 * u;
  g.save();
  g.fillStyle = PANEL;
  g.beginPath();
  if (g.roundRect) g.roundRect(0, 0, w, h, 16 * u);
  else g.rect(0, 0, w, h);
  g.fill();
  g.textBaseline = "alphabetic";
  let y = pad;
  const max = w - pad * 2;
  const say = (s, size, { weight = 600, color = TEXT, x = pad, align = "left", width = max } = {}) => {
    g.font = `${weight} ${size}px ${FONT}`;
    g.fillStyle = color;
    g.textAlign = align;
    g.fillText(fit(g, s, width), x, y);
  };
  for (const b of blocks) {
    const rowH = 30 * u;
    const need = 26 * u + 34 * u + 2 * 24 * u + rowH * Math.min(3, b.rows.length);
    if (y + need > h - pad && y > pad) break;
    y += 22 * u;
    say((KIND_TITLES[b.kind] ?? "").toUpperCase(), 16 * u, { weight: 700, color: ACCENT });
    y += 32 * u;
    say(b.title, 28 * u, { weight: 700 });
    if (b.line) {
      g.font = `500 ${18 * u}px ${FONT}`;
      for (const l of wrap(g, b.line, max, 2)) {
        y += 24 * u;
        say(l, 18 * u, { weight: 500, color: MUTED });
      }
    }
    y += 10 * u;
    for (const r of b.rows) {
      if (y + rowH > h - pad) break;
      y += rowH;
      if (r.gap) {
        say("...", 20 * u, { color: MUTED });
        continue;
      }
      const color = r.me ? ACCENT : TEXT;
      say(String(r.place), 22 * u, { weight: 700, color, width: 40 * u });
      say(r.name, 22 * u, { weight: r.me ? 700 : 500, color, x: pad + 44 * u, width: max - 44 * u - 120 * u });
      say(r.value, 22 * u, { weight: 600, color, x: w - pad, align: "right", width: 116 * u });
    }
    y += 12 * u;
    g.strokeStyle = LINE;
    g.lineWidth = Math.max(1, 1.5 * u);
    g.beginPath();
    g.moveTo(pad, y);
    g.lineTo(w - pad, y);
    g.stroke();
  }
  g.restore();
}
