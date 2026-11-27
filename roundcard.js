// The round card drawn (sim/roundcard.mjs has what's on it): a portrait
// card, 1080 x 1350 (a phone's and Instagram's shape), drawn at any size
// into a canvas - saved or copied as a picture at the end of a round, on My
// stats, and in the recording's Finish scene (compositor.js). And the card
// over the picture at the end of a round, with Save and Copy.

import { scoreMark, signed, cardFileName } from "./sim/roundcard.mjs";
import { standingsHtml } from "./finishstandings.js";

export const CARD_W = 1080;
export const CARD_H = 1350;
const FONT = `"Bahnschrift", "DIN Alternate", "Segoe UI", "Helvetica Neue", Arial, sans-serif`;
const BODY = `"Segoe UI", "Helvetica Neue", Arial, sans-serif`;
const ACCENT = "#ffd23f";
const GREEN = "#6fdc97";
const RED = "#e0785c";
const TEXT = "#eaf4ec";
const MUTED = "rgba(234, 244, 236, 0.62)";
const LINE = "rgba(143, 227, 166, 0.18)";

// The card's own colours and type: a deep green card, mint and gold.
const OWN = {
  font: FONT,
  body: BODY,
  heavy: 800,
  bold: 700,
  label: null,
  spacing: 0,
  text: TEXT,
  muted: MUTED,
  accent: ACCENT,
  head: GREEN,
  tileLabel: GREEN,
  good: GREEN,
  over: ACCENT,
  bad: RED,
  line: LINE,
  panel: "rgba(3, 12, 7, 0.45)",
  mark: "#1f6b42",
  gold: "rgba(255, 210, 63, 0.1)",
  goldEdge: "rgba(255, 210, 63, 0.45)",
  total: "rgba(255, 210, 63, 0.14)",
  card: true,
};
// "#rrggbb" at an alpha.
function tint(hex, a) {
  const n = parseInt(String(hex).slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
// The colours and type a card's drawn in: its own, or in the recording's
// scene look (sim/scenelook.mjs cardTheme: { font, numberWeight,
// labelWeight, labelSpacing, text, muted, accent, plateTop, plateBottom }) -
// the look's one typeface for every word, its labels spaced out, the
// accent where the card had its mint and gold, and no background of its
// own: the look's plate is behind it, its frame round it.
function paletteOf(t) {
  if (!t) return OWN;
  return {
    font: t.font,
    body: t.font,
    heavy: t.numberWeight,
    bold: t.numberWeight,
    label: t.labelWeight,
    spacing: t.labelSpacing ?? 0,
    text: t.text,
    muted: t.muted,
    accent: t.accent,
    head: t.accent,
    tileLabel: t.muted,
    good: t.accent,
    over: t.text,
    bad: t.muted,
    line: tint(t.text, 0.16),
    panel: tint(t.plateBottom, 0.62),
    mark: tint(t.accent, 0.16),
    gold: tint(t.accent, 0.08),
    goldEdge: tint(t.accent, 0.42),
    total: tint(t.accent, 0.12),
    card: false,
  };
}
// The card's colours and type while it's being drawn (drawFull).
let P = OWN;

function rr(g, x, y, w, h, r) {
  g.beginPath();
  if (g.roundRect) g.roundRect(x, y, w, h, r);
  else g.rect(x, y, w, h);
}

// label: words set as a label (in capitals) - in a look, in its label
// weight and spaced out as its labels are.
function text(g, s, x, y, { size = 32, weight = 600, color = P.text, align = "left", font = P.font, max = null, label = false } = {}) {
  const spaced = label && P.label != null;
  g.font = `${spaced ? P.label : weight} ${size}px ${font}`;
  if (P.label != null && "letterSpacing" in g) g.letterSpacing = spaced && P.spacing > 0 ? `${(P.spacing * size).toFixed(2)}px` : "0px";
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = "alphabetic";
  let str = String(s ?? "");
  if (max) {
    while (str.length > 1 && g.measureText(str).width > max) str = str.slice(0, -2) + "…";
  }
  g.fillText(str, x, y);
}

const dayText = (t) => (t ? new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) : "");

// The card at its own size (1080 x 1350) into g, from (0, 0): in its own
// colours, or in a scene look's (theme: paletteOf).
function drawFull(g, c, theme = null) {
  const was = P;
  P = paletteOf(theme);
  try {
    drawCardIn(g, c);
  } finally {
    P = was;
    if (theme && "letterSpacing" in g) g.letterSpacing = "0px";
  }
}

function drawCardIn(g, c) {
  const W = CARD_W;
  // The card: a deep green, lit from the top left. (In a look, none: the
  // look's plate is behind it.)
  if (P.card) {
    const bg = g.createLinearGradient(0, 0, W, CARD_H);
    bg.addColorStop(0, "#123a25");
    bg.addColorStop(1, "#06140c");
    rr(g, 0, 0, W, CARD_H, 40);
    g.fillStyle = bg;
    g.fill();
    g.strokeStyle = "rgba(143, 227, 166, 0.25)";
    g.lineWidth = 3;
    g.stroke();
  }

  // The A² mark and the date.
  rr(g, 60, 52, 64, 64, 16);
  g.fillStyle = P.mark;
  g.fill();
  text(g, "A²", 92, 98, { size: 34, weight: P.heavy, color: P.accent, align: "center" });
  text(g, "A-SQUARED GOLF", 142, 96, { size: 30, weight: 700, color: P.head, label: true });
  text(g, dayText(c.date), W - 60, 96, { size: 28, weight: 500, color: P.muted, align: "right", font: P.body });
  // The round's clock under it: first tee to last hole.
  if (c.times) text(g, c.times, W - 60, 134, { size: 24, weight: 500, color: P.muted, align: "right", font: P.body });

  // The course, the player, the day's weather.
  text(g, c.course ?? "Course", 60, 196, { size: 58, weight: P.heavy, max: W - 120 });
  const who = [c.player, c.swing, c.weather].filter(Boolean).join("  ·  ");
  if (who) text(g, who, 60, 246, { size: 30, weight: 500, color: P.muted, font: P.body, max: W - 120 });

  // The score, big: gross and against par; net and the differential beside.
  const complete = c.played && c.played === c.of;
  text(g, c.gross ?? "-", 60, 400, { size: 150, weight: P.heavy });
  g.font = `${P.heavy} 150px ${P.font}`;
  const gw = g.measureText(String(c.gross ?? "-")).width;
  text(g, signed(c.toPar), 60 + gw + 28, 400, { size: 72, weight: P.heavy, color: c.toPar != null && c.toPar <= 0 ? P.good : P.over });
  text(g, complete ? `${c.of} holes` : `${c.played} of ${c.of} holes`, 60 + gw + 30, 318, { size: 28, weight: 500, color: P.muted, font: P.body });
  const side = [];
  if (c.net != null) side.push([`${c.net}`, `net (plays off ${c.courseHandicap})`]);
  if (c.diff != null) side.push([c.diff.toFixed(1), "handicap differential"]);
  else if (c.index != null) side.push([c.index.toFixed(1), "handicap index"]);
  side.forEach(([v, label], i) => {
    const y = 300 + i * 88;
    text(g, v, W - 60, y, { size: 58, weight: P.heavy, align: "right" });
    text(g, label, W - 60, y + 34, { size: 24, weight: 500, color: P.muted, align: "right", font: P.body });
  });

  // The scorecard: a row of nine, twice.
  let y = 440;
  const nines = [
    [1, 9, "OUT", c.out],
    [10, 18, "IN", c.in],
  ].filter(([, , , t]) => t);
  for (const [from, to, label, tot] of nines) {
    drawNine(g, c, from, to, label, tot, 60, y, W - 120, nines.length === 2 && label === "IN" ? c : null);
    y += 175;
  }

  // Fairways, greens, putts, up and downs.
  y += 10;
  const s = c.stats ?? {};
  const tiles = [
    ["Fairways", s.fairways, s.fairwayPct],
    ["Greens", s.greens, s.greenPct],
    ["Putts", s.putts, null],
    ["Up & down", s.upDowns, null],
  ];
  const tw = (W - 120 - 3 * 16) / 4;
  // None of them known (the round's shots weren't kept): no row.
  if (tiles.every(([, v]) => v == null)) tiles.length = 0;
  tiles.forEach(([label, v, p], i) => {
    const x = 60 + i * (tw + 16);
    rr(g, x, y, tw, 110, 18);
    g.fillStyle = P.panel;
    g.fill();
    text(g, label.toUpperCase(), x + 20, y + 38, { size: 22, weight: 700, color: P.tileLabel, label: true });
    text(g, v ?? "-", x + 20, y + 88, { size: 46, weight: P.heavy });
    if (p != null) {
      g.font = `${P.heavy} 46px ${P.font}`;
      text(g, `${p}%`, x + 20 + g.measureText(String(v)).width + 12, y + 86, { size: 24, weight: 600, color: P.muted, font: P.body });
    }
  });
  if (tiles.length) y += 142;

  // Strokes gained, by part of the game.
  if (c.sg) {
    text(g, "STROKES GAINED", 60, y, { size: 24, weight: 700, color: P.head, label: true });
    text(g, `vs ${c.sg.against}`, W - 60, y, { size: 24, weight: 500, color: P.muted, align: "right", font: P.body });
    y += 14;
    const rows = [
      ["Off the tee", c.sg.tee],
      ["Approach", c.sg.approach],
      ["Around the green", c.sg.around],
      ["Putting", c.sg.putting],
    ];
    const most = Math.max(1, ...rows.map(([, v]) => Math.abs(v)), Math.abs(c.sg.total));
    const labelW = 300;
    const barX = 60 + labelW;
    const barW = W - 120 - labelW - 110;
    const mid = barX + barW / 2;
    [...rows, ["Total", c.sg.total]].forEach(([label, v], i) => {
      const ry = y + 22 + i * 40;
      text(g, label, 60, ry + 22, { size: 28, weight: label === "Total" ? P.heavy : 500, font: label === "Total" ? P.font : P.body });
      rr(g, barX, ry + 4, barW, 22, 11);
      g.fillStyle = "rgba(255, 255, 255, 0.06)";
      g.fill();
      const len = (Math.min(Math.abs(v), most) / most) * (barW / 2);
      rr(g, v >= 0 ? mid : mid - len, ry + 4, Math.max(4, len), 22, 11);
      g.fillStyle = v >= 0 ? P.good : P.bad;
      g.fill();
      g.fillStyle = P.muted;
      g.fillRect(mid - 1, ry - 2, 2, 34);
      text(g, `${v > 0 ? "+" : ""}${v.toFixed(1)}`, W - 60, ry + 24, { size: 30, weight: P.heavy, color: v >= 0 ? P.good : P.bad, align: "right" });
    });
    y += 22 + 5 * 40 + 14;
  }

  // The best shot.
  if (c.best?.words) {
    const bh = 90;
    rr(g, 60, y, W - 120, bh, 18);
    g.fillStyle = P.gold;
    g.fill();
    g.strokeStyle = P.goldEdge;
    g.lineWidth = 2;
    g.stroke();
    text(g, "SHOT OF THE ROUND", 84, y + 36, { size: 22, weight: 700, color: P.accent, label: true });
    text(g, `${c.best.words}${Number.isFinite(c.best.sg) ? `  (+${c.best.sg.toFixed(1)})` : ""}`, 84, y + 72, { size: 30, weight: 600, font: P.body, max: W - 170 });
  }

  text(g, "by A2 Games", W - 60, CARD_H - 28, { size: 22, weight: 500, color: P.muted, align: "right", font: P.body });
}

// Nine holes: the numbers, the par and the score with its mark, and the
// nine's total (and, after the back nine, the round's).
function drawNine(g, c, from, to, label, tot, x, y, w, total = null) {
  const cols = to - from + 1 + 1 + (total ? 1 : 0);
  const cw = w / (cols + 0.9);
  const lx = x;
  const first = x + cw * 0.9;
  text(g, "HOLE", lx, y + 34, { size: 20, weight: 700, color: P.muted, label: true });
  text(g, "PAR", lx, y + 78, { size: 20, weight: 700, color: P.muted, label: true });
  text(g, "SCORE", lx, y + 140, { size: 20, weight: 700, color: P.muted, label: true });
  g.fillStyle = P.line;
  g.fillRect(x, y + 94, w, 2);
  for (let n = from; n <= to; n++) {
    const h = c.holes.find((q) => q.n === n);
    const cx = first + (n - from + 0.5) * cw;
    text(g, n, cx, y + 34, { size: 24, weight: P.bold, color: P.head, align: "center" });
    text(g, h?.par ?? "", cx, y + 78, { size: 28, weight: 500, color: P.muted, align: "center", font: P.body });
    if (!h) continue;
    const mark = scoreMark(h.score, h.par);
    const r = Math.min(cw * 0.42, 30);
    const cy = y + 128;
    g.lineWidth = 3;
    g.strokeStyle = mark === "eagle" || mark === "birdie" ? P.good : P.bad;
    if (mark === "birdie" || mark === "eagle") {
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.stroke();
      if (mark === "eagle") {
        g.beginPath();
        g.arc(cx, cy, r - 6, 0, Math.PI * 2);
        g.stroke();
      }
    } else if (mark === "bogey" || mark === "double") {
      g.strokeRect(cx - r, cy - r, 2 * r, 2 * r);
      if (mark === "double") g.strokeRect(cx - r + 6, cy - r + 6, 2 * r - 12, 2 * r - 12);
    }
    text(g, h.score ?? "-", cx, y + 140, { size: 34, weight: P.heavy, align: "center" });
  }
  const tx = first + (to - from + 1 + 0.5) * cw;
  rr(g, tx - cw / 2 + 2, y + 4, cw - 4, 160, 12);
  g.fillStyle = P.panel;
  g.fill();
  text(g, label, tx, y + 34, { size: 22, weight: 800, color: P.head, align: "center", label: true });
  text(g, tot.par, tx, y + 78, { size: 28, weight: 500, color: P.muted, align: "center", font: P.body });
  text(g, tot.score ?? "-", tx, y + 140, { size: 34, weight: P.heavy, align: "center" });
  if (total) {
    const ox = tx + cw;
    rr(g, ox - cw / 2 + 2, y + 4, cw - 4, 160, 12);
    g.fillStyle = P.total;
    g.fill();
    text(g, "TOT", ox, y + 34, { size: 22, weight: 800, color: P.accent, align: "center", label: true });
    text(g, total.par ?? "", ox, y + 78, { size: 28, weight: 500, color: P.muted, align: "center", font: P.body });
    text(g, total.gross ?? "-", ox, y + 140, { size: 34, weight: P.heavy, align: "center" });
  }
}

// The card drawn to fit (w x h) - kept to its shape, in the middle. theme:
// a scene look's (sim/scenelook.mjs cardTheme) in the recording, or null
// for the card's own colours.
export function drawCard(g, card, w, h, theme = null) {
  const k = Math.min(w / CARD_W, h / CARD_H);
  g.save();
  g.translate((w - CARD_W * k) / 2, (h - CARD_H * k) / 2);
  g.scale(k, k);
  drawFull(g, card, theme);
  g.restore();
}

// The card as a canvas at its full size (for saving and copying).
export function cardCanvas(card, doc = document) {
  const canvas = doc.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  drawFull(canvas.getContext("2d"), card);
  return canvas;
}

const toBlob = (canvas) => new Promise((resolve) => canvas.toBlob(resolve, "image/png"));

// Saved as a picture: a download (the app keeps it in Downloads).
export async function saveCard(card) {
  const blob = await toBlob(cardCanvas(card));
  if (!blob) return false;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = cardFileName(card);
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return true;
}

// Copied as a picture, to paste into a message.
export async function copyCard(card) {
  const blob = await toBlob(cardCanvas(card));
  if (!blob || !navigator.clipboard?.write || typeof ClipboardItem === "undefined") return false;
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
  return true;
}

// The card over the picture at the end of a round: each player's (← →),
// Save (S), Copy (C), and Esc or N to close - and, online, Back to the
// lobby (L) for the host.
export class RoundCardView {
  // highlights(): play the round's highlight reel (course.js
  // watchHighlights) - or null, no button. online(): an online round's
  // end (sim/netgame.mjs afterRound) - the host's Back to the lobby,
  // lobby(), or who the others wait for - or null. standings(): what the
  // round counted for - a season, an online season, the match, a ladder
  // (sim/finishstandings.mjs blocks) - shown beside the card.
  constructor({ toast = () => {}, highlights = null, online = () => null, lobby = () => {}, standings = () => [] } = {}) {
    this.toast = toast;
    this.standings = standings;
    this.highlights = highlights;
    this.online = online;
    this.lobby = lobby;
    this.cards = [];
    this.at = 0;
    this.el = document.createElement("div");
    this.el.className = "bay-help round-card-view";
    this.el.hidden = true;
    this.el.innerHTML = `<div class="bay-help-box round-card-box">
      <canvas width="${CARD_W}" height="${CARD_H}"></canvas>
      <aside class="round-card-standings" hidden></aside>
      <div class="round-card-side">
        <h2>Round card</h2>
        <div class="round-card-who"></div>
        <button class="primary" data-act="lobby" hidden>Back to the lobby <kbd>L</kbd></button>
        <p class="round-card-online small" hidden></p>
        <button class="primary" data-act="save">Save picture <kbd>S</kbd></button>
        <button data-act="copy">Copy <kbd>C</kbd></button>
        ${highlights ? `<button data-act="highlights" title="The round's best shots played back, hole by hole: holed putts, chip-ins, the longest drive, the closest approach">Watch highlights <kbd>W</kbd></button>` : ""}
        <button data-act="next" hidden>Next player <kbd>→</kbd></button>
        <button data-act="close">Close <kbd>Esc</kbd></button>
        <p class="muted small">Saved pictures go to your Downloads. My stats has the card for every round.</p>
      </div>
    </div>`;
    this.el.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-act]");
      if (b) this.act(b.dataset.act);
      else if (e.target === this.el) this.show(false);
    });
    document.body.appendChild(this.el);
  }

  get open() {
    return !this.el.hidden;
  }

  get card() {
    return this.cards[this.at] ?? null;
  }

  // cards: one per player.
  set(cards) {
    this.cards = cards.filter(Boolean);
    this.at = 0;
    if (this.open) this.render();
  }

  show(on = true) {
    if (on && !this.cards.length) return false;
    this.el.hidden = !on;
    if (on) this.render();
    return true;
  }

  render() {
    const c = this.card;
    if (!c) return;
    const canvas = this.el.querySelector("canvas");
    const g = canvas.getContext("2d");
    g.clearRect(0, 0, CARD_W, CARD_H);
    drawFull(g, c);
    this.el.querySelector(".round-card-who").textContent = this.cards.length > 1 ? `${c.player} (${this.at + 1} of ${this.cards.length})` : "";
    this.el.querySelector('[data-act="next"]').hidden = this.cards.length < 2;
    // Online: the host takes everyone back to the lobby; the others wait.
    const on = this.online?.() ?? null;
    this.el.querySelector('[data-act="lobby"]').hidden = !on?.host;
    this.el.querySelector('[data-act="save"]').classList.toggle("primary", !on?.host);
    const line = this.el.querySelector(".round-card-online");
    line.hidden = !on;
    line.textContent = on?.words ?? "";
    // What the round counted for, beside the card.
    const st = this.el.querySelector(".round-card-standings");
    let blocks = [];
    try {
      blocks = this.standings?.() ?? [];
    } catch {
      blocks = [];
    }
    st.innerHTML = standingsHtml(blocks);
    st.hidden = !blocks.length;
  }

  async act(what) {
    const c = this.card;
    if (what === "close") return this.show(false);
    if (what === "lobby") {
      if (!this.online?.()?.host) return;
      this.show(false);
      this.lobby();
      return;
    }
    if (what === "highlights") {
      this.show(false);
      // (Why not, if there are none, is said by the course.)
      this.highlights?.();
      return;
    }
    if (what === "next") {
      this.at = (this.at + 1) % this.cards.length;
      return this.render();
    }
    if (!c) return;
    try {
      if (what === "save") this.toast((await saveCard(c)) ? "Round card saved to Downloads" : "The picture couldn't be made", 2500);
      if (what === "copy") this.toast((await copyCard(c)) ? "Round card copied - paste it into a message" : "Copying pictures isn't possible here - Save it instead", 3000);
    } catch (err) {
      this.toast(`Couldn't: ${err.message}`, 3000);
    }
  }

  // Keys while it's open. True if used.
  key(e) {
    if (!this.open) return false;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === "Escape" || k === "n" || k === "Enter") this.show(false);
    else if (k === "s") this.act("save");
    else if (k === "c") this.act("copy");
    else if (k === "w" && this.highlights) this.act("highlights");
    else if (k === "l" && this.online?.()?.host) this.act("lobby");
    else if (k === "ArrowRight" || k === "ArrowLeft") {
      if (this.cards.length > 1) {
        this.at = (this.at + (k === "ArrowRight" ? 1 : this.cards.length - 1)) % this.cards.length;
        this.render();
      }
    } else return false;
    e.preventDefault();
    return true;
  }
}
