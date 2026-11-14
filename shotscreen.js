// The shot data screen: everything the launch monitor says about the last
// shot, as pictures and big numbers, for a second monitor beside the sim.
// It listens to the same server as the main page and follows every shot,
// whatever mode the sim is in. The Windows app opens it on the second screen
// by itself (electron/main.mjs); in a browser, open /shotscreen.html.

import { simulateShot, setCarryMatch, YARD } from "./sim/flight.mjs";
import { shotReport, Tally } from "./sim/shotdata.mjs";
import { STRIKE_NAMES } from "./sim/shotstats.mjs";
import { tagGroup } from "./sim/shotnotes.mjs";
import { clubColor } from "./clubcolors.js";
import { clubName } from "./bay.js";
import { clubShort } from "./sim/clubs.mjs";
import { KEY_CHANNEL, shotScreenKeeps, keyMessage, historyMessage, readHistoryList, HISTORY_ASK } from "./sim/screens.mjs";
import { HISTORY_MARKS, HISTORY_MARK_NAMES, HISTORY_MAX, historyClubs } from "./sim/shothistory.mjs";
import { omniStatusLine } from "./omni.js";
import { esc, loadSetting } from "./util.js";
import { readProfiles, handOf } from "./sim/profiles.mjs";
// Which hand who's hitting plays with (their saved profile, sim/profiles.mjs):
// a left-hander's draw curves right.
const handNow = () => handOf(readProfiles(loadSetting("profiles", null), loadSetting("course", {}).players), loadSetting("hitter", { name: null }).name);
import { isPutt, puttReport, puttSummary, resultWords, lineWords, CUP_HALF_IN } from "./sim/puttdata.mjs";
import { ShotCams } from "./shotcams.js";

const $ = (id) => document.getElementById(id);
const NS = "http://www.w3.org/2000/svg";
const KEEP = 60;

// This session's latest shots: { entry, report, flight, putt }, newest
// last - putt is the putting view's report (sim/puttdata.mjs) for a putt,
// which has no flight. Only
// the last KEEP are kept for the pictures; every shot is counted, and goes
// into its club's averages (a Tally of running totals, by club).
const shots = [];
let sessionShots = 0;
const tallies = new Map();
const tallyFor = (report) => {
  const club = report.clubName ?? "";
  if (!tallies.has(club)) tallies.set(club, new Tally());
  return tallies.get(club);
};

// ---- Formatting -------------------------------------------------------------

const has = (v) => typeof v === "number" && Number.isFinite(v);
const fmt = (v, dp = 1) => (has(v) ? v.toFixed(dp) : "-");
// Left/right, as golfers say it: "2.3 R".
const lr = (v, dp = 1) => (!has(v) ? "-" : Math.abs(v) < 0.05 ? "0" : `${Math.abs(v).toFixed(dp)} ${v > 0 ? "R" : "L"}`);

function el(svg, name, attrs = {}, text) {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text !== undefined) e.textContent = text;
  svg.appendChild(e);
  return e;
}
function clear(svg) {
  svg.replaceChildren();
  // Arrowheads, one per colour used.
  const defs = el(svg, "defs");
  for (const [id, color] of Object.entries({ path: "#3cc4ff", face: "#ffd23f", attack: "#3cc4ff", white: "#e7efe8" })) {
    const m = document.createElementNS(NS, "marker");
    for (const [k, v] of Object.entries({ id: `ah-${svg.id}-${id}`, viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" })) m.setAttribute(k, v);
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", "M0,0 L10,5 L0,10 z");
    p.setAttribute("fill", color);
    m.appendChild(p);
    defs.appendChild(m);
  }
}
const arrow = (svg, color) => `url(#ah-${svg.id}-${color})`;
const rad = (deg) => (deg * Math.PI) / 180;
// Small angles drawn bigger so they can be seen from the mat; the numbers
// say the real value.
const shown = (deg, by = 2.5, max = 40) => Math.max(-max, Math.min(max, (deg ?? 0) * by));

// ---- The numbers along the top ------------------------------------------------

// Left/right values show as a number with L or R beside the unit.
const side = (v, unit) => (has(v) ? [Math.abs(v).toFixed(1), Math.abs(v) < 0.05 ? unit : `${unit} ${v > 0 ? "R" : "L"}`] : ["-", ""]);

function renderTiles(r) {
  showTiles([
    ["Carry", fmt(r.flight?.carry), "yds"],
    ["Total", fmt(r.flight?.total), "yds"],
    ["Ball speed", fmt(r.ball.speed), "mph"],
    ["Club speed", fmt(r.club?.speed), "mph"],
    ["Smash", fmt(r.derived.smash, 2), ""],
    ["Launch", fmt(r.ball.launch), "°"],
    ["Direction", ...side(r.ball.direction, "°")],
    ["Spin", has(r.ball.spin) ? String(r.ball.spin) : "-", "rpm"],
    ["Spin axis", ...side(r.ball.spinAxis, "°")],
    ["Apex", fmt(r.flight?.apex), "yds"],
    ["Descent", fmt(r.flight?.descent), "°"],
    ["Offline", ...side(r.flight?.offline, "yds")],
  ]);
}

// The twelve tiles: [label, value, unit] each.
function showTiles(tiles) {
  $("ss-tiles").innerHTML = tiles
    .map(([k, v, unit]) => `<div class="ss-tile ${v === "-" ? "missing" : ""}"><div class="k">${k}</div><div class="v">${esc(v)}</div><div class="u">${v !== "-" ? esc(unit) : "&nbsp;"}</div></div>`)
    .join("");
}

// ---- Club from above: path and face against the target line -----------------------

function renderAbove(r) {
  const svg = $("ss-above");
  clear(svg);
  const bx = 150;
  const by = 150;
  el(svg, "line", { x1: bx, y1: 250, x2: bx, y2: 12, stroke: "#93a897", "stroke-dasharray": "6 6" });
  el(svg, "text", { x: bx + 6, y: 24, class: "muted" }, "target");
  const c = r.club;
  if (!c || (!has(c.path) && !has(c.face))) {
    el(svg, "circle", { cx: bx, cy: by, r: 7, fill: "#fff" });
    $("ss-above-text").innerHTML = `<span class="muted">No club data for this shot</span>`;
    return;
  }
  if (has(c.path)) {
    const a = rad(shown(c.path));
    const dx = Math.sin(a);
    const dy = -Math.cos(a);
    el(svg, "line", { x1: bx - dx * 110, y1: by - dy * 110, x2: bx + dx * 95, y2: by + dy * 95, stroke: "#3cc4ff", "stroke-width": 5, "marker-end": arrow(svg, "path") });
    el(svg, "text", { x: bx - dx * 110 + 6, y: Math.min(250, by - dy * 110), fill: "#3cc4ff" }, "path");
  }
  if (has(c.face)) {
    const a = rad(shown(c.face));
    // The face is square to where it points: a bar across that direction.
    const fx = Math.cos(a);
    const fy = Math.sin(a);
    const cx = bx - Math.sin(a) * 12;
    const cy = by + Math.cos(a) * 12;
    el(svg, "line", { x1: cx - fx * 55, y1: cy - fy * 55, x2: cx + fx * 55, y2: cy + fy * 55, stroke: "#ffd23f", "stroke-width": 8, "stroke-linecap": "round" });
    el(svg, "line", { x1: bx, y1: by, x2: bx + Math.sin(a) * 80, y2: by - Math.cos(a) * 80, stroke: "#ffd23f", "stroke-width": 2, "stroke-dasharray": "4 4", "marker-end": arrow(svg, "face") });
  }
  el(svg, "circle", { cx: bx, cy: by, r: 7, fill: "#fff" });
  const pathWord = !has(c.path) ? "" : Math.abs(c.path) < 0.5 ? "square" : c.path > 0 ? "in-to-out" : "out-to-in";
  const faceWord = !has(c.face) ? "" : Math.abs(c.face) < 0.5 ? "square" : c.face > 0 ? "open" : "closed";
  const fp = r.derived.facePath;
  const fpWord = !has(fp) ? "" : Math.abs(fp) < 0.5 ? "square to the path" : fp > 0 ? "open to the path - fades" : "closed to the path - draws";
  $("ss-above-text").innerHTML = [
    has(c.path) && `Path <b>${lr(c.path)}°</b> ${pathWord}`,
    has(c.face) && `Face <b>${lr(c.face)}°</b> ${faceWord}`,
    has(fp) && `Face to path <b>${fmt(fp)}°</b> ${fpWord}`,
  ]
    .filter(Boolean)
    .join("<br>");
}

// ---- Club from the side: attack angle and loft -------------------------------------

function renderSide(r) {
  const svg = $("ss-side");
  clear(svg);
  const groundY = 205;
  const ball = { x: 185, y: groundY - 12 };
  el(svg, "line", { x1: 10, y1: groundY, x2: 290, y2: groundY, stroke: "#52d97c", "stroke-width": 3 });
  el(svg, "text", { x: 250, y: groundY + 18, class: "muted" }, "target >");
  const c = r.club;
  if (!c || (!has(c.attack) && !has(c.loft))) {
    el(svg, "circle", { cx: ball.x, cy: ball.y, r: 12, fill: "#fff" });
    $("ss-side-text").innerHTML = `<span class="muted">No club data for this shot</span>`;
    return;
  }
  const contact = { x: ball.x - 12, y: ball.y };
  if (has(c.attack)) {
    const a = rad(shown(c.attack, 3, 35));
    // Travelling towards the target, rising for a positive angle.
    const dx = Math.cos(a);
    const dy = -Math.sin(a);
    el(svg, "line", { x1: contact.x - dx * 150, y1: contact.y - dy * 150, x2: contact.x - dx * 8, y2: contact.y - dy * 8, stroke: "#3cc4ff", "stroke-width": 5, "marker-end": arrow(svg, "attack") });
  }
  if (has(c.loft)) {
    const l = rad(Math.max(0, Math.min(70, c.loft)));
    // The face leans back from upright by its loft.
    const ux = -Math.sin(l);
    const uy = -Math.cos(l);
    el(svg, "line", { x1: contact.x - ux * 12, y1: contact.y - uy * 12, x2: contact.x + ux * 60, y2: contact.y + uy * 60, stroke: "#ffd23f", "stroke-width": 7, "stroke-linecap": "round" });
    // Where the face points: the ball starts between this and the path.
    el(svg, "line", { x1: ball.x, y1: ball.y, x2: ball.x + Math.cos(l) * 95, y2: ball.y - Math.sin(l) * 95, stroke: "#ffd23f", "stroke-width": 2, "stroke-dasharray": "4 4", "marker-end": arrow(svg, "face") });
  }
  el(svg, "circle", { cx: ball.x, cy: ball.y, r: 12, fill: "#fff" });
  const attackWord = !has(c.attack) ? "" : Math.abs(c.attack) < 0.3 ? "level" : c.attack > 0 ? "up on it" : "down on it";
  $("ss-side-text").innerHTML = [
    has(c.attack) && `Attack <b>${fmt(c.attack)}°</b> ${attackWord}`,
    has(c.loft) && `Dynamic loft <b>${fmt(c.loft)}°</b>`,
    has(r.derived.spinLoft) && `Spin loft <b>${fmt(r.derived.spinLoft)}°</b>`,
    has(c.lie) && `Lie at impact <b>${fmt(c.lie)}°</b>`,
  ]
    .filter(Boolean)
    .join("<br>");
}

// ---- Strike on the face --------------------------------------------------------

function renderFace(r) {
  const svg = $("ss-face");
  clear(svg);
  const cx = 150;
  const cy = 118;
  const mm = 2.2; // pixels per millimetre
  const wood = /^(DR|\dW|\dH)$/.test(r.clubName ?? "");
  if (r.clubName === "PT") {
    // A blade putter's face: long and shallow.
    el(svg, "rect", { x: cx - 118, y: cy - 30, width: 236, height: 60, rx: 10, fill: "#26352b", stroke: "#93a897", "stroke-width": 2 });
    el(svg, "line", { x1: cx - 6, y1: cy - 44, x2: cx - 6, y2: cy - 30, stroke: "#93a897", "stroke-width": 6 });
  } else if (wood) {
    el(svg, "path", { d: `M${cx - 120},${cy + 40} C${cx - 130},${cy - 30} ${cx - 90},${cy - 62} ${cx - 10},${cy - 62} C${cx + 90},${cy - 62} ${cx + 135},${cy - 40} ${cx + 125},${cy + 20} C${cx + 120},${cy + 55} ${cx + 60},${cy + 62} ${cx},${cy + 60} C${cx - 60},${cy + 60} ${cx - 110},${cy + 60} ${cx - 120},${cy + 40} Z`, fill: "#26352b", stroke: "#93a897", "stroke-width": 2 });
  } else {
    el(svg, "path", { d: `M${cx - 105},${cy + 45} L${cx - 95},${cy - 35} Q${cx + 40},${cy - 62} ${cx + 110},${cy - 55} L${cx + 115},${cy + 45} Z`, fill: "#26352b", stroke: "#93a897", "stroke-width": 2 });
    for (let g = -3; g <= 4; g++) el(svg, "line", { x1: cx - 80, y1: cy + g * 10, x2: cx + 90, y2: cy + g * 10, stroke: "#3a4d40", "stroke-width": 2 });
  }
  el(svg, "line", { x1: cx, y1: cy - 55, x2: cx, y2: cy + 55, stroke: "#93a897", "stroke-dasharray": "3 5" });
  el(svg, "line", { x1: cx - 115, y1: cy, x2: cx + 115, y2: cy, stroke: "#93a897", "stroke-dasharray": "3 5" });
  el(svg, "text", { x: cx + 120, y: cy + 80, "text-anchor": "end", class: "muted" }, "toe >");
  el(svg, "text", { x: cx - 120, y: cy + 80, class: "muted" }, "< heel");
  // This club's other strikes this session, faded.
  const same = shots.filter((s) => s.report.clubName === r.clubName && s.report !== r && has(s.report.club?.impactH)).slice(-15);
  for (const s of same) {
    el(svg, "circle", { cx: cx + s.report.club.impactH * mm, cy: cy - (s.report.club.impactV ?? 0) * mm, r: 6, fill: "#e7efe8", opacity: 0.25 });
  }
  const c = r.club;
  if (!c || (!has(c.impactH) && !has(c.impactV))) {
    $("ss-face-text").innerHTML = `<span class="muted">No strike data for this shot</span>`;
    return;
  }
  const x = cx + (c.impactH ?? 0) * mm;
  const y = cy - (c.impactV ?? 0) * mm;
  el(svg, "circle", { cx: x, cy: y, r: 11, fill: "#ffd23f", stroke: "#111", "stroke-width": 2 });
  $("ss-face-text").innerHTML = `Struck <b>${esc(r.strike ?? "")}</b><br><span class="muted">${fmt(Math.abs(c.impactH ?? 0))} mm ${(c.impactH ?? 0) >= 0 ? "toe" : "heel"}, ${fmt(Math.abs(c.impactV ?? 0))} mm ${(c.impactV ?? 0) >= 0 ? "high" : "low"}</span>`;
}

// ---- Ball launch and spin ---------------------------------------------------------

function renderLaunch(r) {
  const svg = $("ss-launch");
  clear(svg);
  const b = r.ball;
  // Left: launch angle from the side.
  const gx = 20;
  const gy = 200;
  el(svg, "line", { x1: gx, y1: gy, x2: 150, y2: gy, stroke: "#52d97c", "stroke-width": 3 });
  if (has(b.launch)) {
    const a = rad(Math.max(-5, Math.min(60, b.launch)));
    el(svg, "path", { d: `M${gx + 60},${gy} A60,60 0 0 0 ${gx + 60 * Math.cos(a)},${gy - 60 * Math.sin(a)}`, fill: "none", stroke: "#ffd23f", "stroke-width": 2 });
    el(svg, "line", { x1: gx, y1: gy, x2: gx + Math.cos(a) * 125, y2: gy - Math.sin(a) * 125, stroke: "#e7efe8", "stroke-width": 4, "marker-end": arrow(svg, "white") });
    el(svg, "text", { x: gx + 66, y: gy - 8 }, `${fmt(b.launch)}°`);
  }
  el(svg, "circle", { cx: gx, cy: gy - 6, r: 6, fill: "#fff" });
  el(svg, "text", { x: gx, y: gy + 22, class: "muted" }, "launch");
  // Right: the ball from behind, its spin axis tilted as it spins.
  const bx = 225;
  const by = 125;
  el(svg, "circle", { cx: bx, cy: by, r: 50, fill: "#f4f6f4", stroke: "#93a897", "stroke-width": 2 });
  if (has(b.spinAxis)) {
    const a = rad(Math.max(-60, Math.min(60, b.spinAxis)));
    const dx = Math.sin(a);
    const dy = -Math.cos(a);
    el(svg, "line", { x1: bx - dx * 68, y1: by - dy * 68, x2: bx + dx * 68, y2: by + dy * 68, stroke: "#ff4d4d", "stroke-width": 4 });
    // The seam the ball turns on, square to the axis.
    el(svg, "ellipse", { cx: bx, cy: by, rx: 48, ry: 14, fill: "none", stroke: "#3cc4ff", "stroke-width": 2, transform: `rotate(${(a * 180) / Math.PI} ${bx} ${by})` });
  }
  el(svg, "text", { x: 290, y: 30, "text-anchor": "end", class: "muted" }, "spin axis, from behind");
  $("ss-launch-text").innerHTML = [
    `Direction <b>${lr(b.direction)}°</b>`,
    has(b.spin) && `Spin <b>${b.spin}</b> rpm${has(b.backSpin) ? ` <span class="muted">(${b.backSpin} back, ${lr(b.sideSpin, 0)} side)</span>` : ""}`,
  ]
    .filter(Boolean)
    .join("<br>");
}

// ---- Flight from the side, and from above ----------------------------------------------

function renderFlight() {
  const svg = $("ss-flight");
  clear(svg);
  const W = 640;
  const H = 240;
  const left = 30;
  const bottom = 205;
  const recent = shots.filter((s) => s.flight).slice(-6);
  if (!recent.length) return;
  const maxX = Math.max(60, ...recent.map((s) => s.flight.total)) * 1.08;
  const maxY = Math.max(15, ...recent.map((s) => s.flight.apex)) * 1.25;
  const sx = (W - left - 20) / maxX;
  const sy = (bottom - 20) / maxY;
  const px = (m) => left + (m / YARD) * sx;
  const py = (m) => bottom - (m / YARD) * sy;
  el(svg, "line", { x1: left, y1: bottom, x2: W - 10, y2: bottom, stroke: "#52d97c", "stroke-width": 3 });
  const step = maxX > 220 ? 50 : maxX > 90 ? 25 : 10;
  for (let yd = step; yd < maxX; yd += step) {
    el(svg, "line", { x1: left + yd * sx, y1: bottom, x2: left + yd * sx, y2: bottom + 6, stroke: "#93a897" });
    el(svg, "text", { x: left + yd * sx, y: bottom + 22, "text-anchor": "middle", class: "muted" }, String(yd));
  }
  recent.forEach((s, i) => {
    const latest = i === recent.length - 1;
    const pts = s.flight.path.map((p) => `${px(p[0]).toFixed(1)},${py(p[1]).toFixed(1)}`).join(" ");
    el(svg, "polyline", { points: pts, fill: "none", stroke: clubColor(s.report.clubName), "stroke-width": latest ? 4 : 2, opacity: latest ? 1 : 0.3 });
  });
  const f = recent.at(-1).flight;
  const apexPoint = f.path.reduce((a, p) => (p[1] > a[1] ? p : a), f.path[0]);
  el(svg, "circle", { cx: px(apexPoint[0]), cy: py(apexPoint[1]), r: 5, fill: "#ffd23f" });
  el(svg, "text", { x: px(apexPoint[0]), y: py(apexPoint[1]) - 10, "text-anchor": "middle" }, `apex ${fmt(f.apex)} yds`);
  const land = f.path[f.flightPoints - 1];
  el(svg, "circle", { cx: px(land[0]), cy: py(0), r: 5, fill: "#fff" });
  el(svg, "text", { x: px(land[0]) - 8, y: bottom - 10, "text-anchor": "end" }, `carry ${fmt(f.carry)}`);
  el(svg, "circle", { cx: px(f.rest[0]), cy: bottom, r: 4, fill: "#93a897" });
  // Kept inside the chart: near its right-hand edge, ended at the edge and
  // a line up, clear of the carry's label.
  const tx = px(f.rest[0]) + 8;
  const edge = tx > W - 90;
  el(svg, "text", { x: edge ? W - 4 : tx, y: bottom - (edge ? 28 : 10), "text-anchor": edge ? "end" : "start", class: "muted" }, `total ${fmt(f.total)}`);
}

function renderDispersion() {
  const svg = $("ss-disp");
  clear(svg);
  const W = 300;
  const H = 240;
  const list = shots.filter((s) => s.flight).slice(-30);
  if (!list.length) return;
  const maxY = Math.max(60, ...list.map((s) => s.flight.total)) * 1.1;
  const maxX = Math.max(25, ...list.map((s) => Math.abs(s.flight.offline))) * 1.2;
  const x = (yd) => W / 2 + (yd / maxX) * (W / 2 - 15);
  const y = (yd) => H - 15 - (yd / maxY) * (H - 30);
  el(svg, "line", { x1: W / 2, y1: H - 10, x2: W / 2, y2: 8, stroke: "#93a897", "stroke-dasharray": "6 6" });
  for (let yd = 50; yd < maxY; yd += 50) {
    el(svg, "line", { x1: 10, y1: y(yd), x2: W - 10, y2: y(yd), stroke: "#2b4232" });
    el(svg, "text", { x: 12, y: y(yd) - 3, class: "muted" }, String(yd));
  }
  list.forEach((s, i) => {
    const latest = i === list.length - 1;
    el(svg, "circle", { cx: x(s.flight.offline), cy: y(s.flight.total), r: latest ? 8 : 5, fill: clubColor(s.report.clubName), opacity: latest ? 1 : 0.55, stroke: latest ? "#fff" : "none", "stroke-width": 2 });
  });
}

// ---- The session table -----------------------------------------------------------

const TABLE_COLS = [
  ["Club", (r) => (r.clubName ? clubShort(r.clubName) : "-")],
  ["Ball", (r) => fmt(r.ball.speed)],
  ["Club", (r) => fmt(r.club?.speed)],
  ["Smash", (r) => fmt(r.derived.smash, 2)],
  ["Launch", (r) => fmt(r.ball.launch)],
  ["Spin", (r) => (has(r.ball.spin) ? r.ball.spin : "-")],
  ["Carry", (r) => fmt(r.flight?.carry)],
  ["Total", (r) => fmt(r.flight?.total)],
  ["Path", (r) => lr(r.club?.path)],
  ["Face", (r) => lr(r.club?.face)],
];
function renderTable() {
  const cols = TABLE_COLS;
  const head = `<tr>${cols.map(([h]) => `<th>${h}</th>`).join("")}</tr>`;
  const recent = shots.filter((s) => !s.putt).slice(-8).reverse();
  const rows = recent.map((s, i) => `<tr class="${i === 0 ? "latest" : ""}">${cols.map(([, get]) => `<td>${esc(get(s.report))}</td>`).join("")}</tr>`).join("");
  let avgRow = "";
  const last = shots.filter((s) => !s.putt).at(-1);
  if (last) {
    const a = tallyFor(last.report).averages();
    const vals = [`Avg ${last.report.clubName ? clubShort(last.report.clubName) : ""} (${a.shots})`, fmt(a.ballSpeed), fmt(a.clubSpeed), fmt(a.smash, 2), fmt(a.launch), has(a.spin) ? Math.round(a.spin) : "-", fmt(a.carry), fmt(a.total), lr(a.path), lr(a.face)];
    avgRow = `<tr class="avg">${vals.map((v) => `<td>${esc(v)}</td>`).join("")}</tr>`;
  }
  $("ss-table").innerHTML = head + rows + avgRow;
}

// ---- The putting view ---------------------------------------------------------------
//
// A putt fills the same boxes - the same tiles, panels and table, in the
// same places - with what matters on the green, so a stream's layout (a
// streaming program cropping each box) never moves between a drive and a
// putt.

// Each box's heading, for a full swing and for a putt, by the picture in it.
const CAPTIONS = {
  "ss-above": ["Club from above", "Putter from above"],
  "ss-side": ["Club from the side", "Putter from the side"],
  "ss-face": ["Strike on the face", "Strike on the putter"],
  "ss-launch": ["Ball launch and spin", "Start line - at the hole"],
  "ss-flight": ["Flight from the side", "Pace - on a flat green"],
  "ss-disp": ["From above - this session", "Pace and line"],
  "ss-table": ["This session", "This session's putts"],
};
function setCaptions(putt) {
  for (const [id, words] of Object.entries(CAPTIONS)) {
    const cap = $(id).closest("figure")?.querySelector("figcaption");
    if (cap) cap.textContent = words[putt ? 1 : 0];
  }
}

// The putting green's pace: the flat roll is worked out on it.
function stimpNow() {
  const s = Number(loadSetting("putting", {})?.stimp);
  return s >= 5 && s <= 16 ? s : 10;
}

const feetText = (v) => (has(v) ? (Math.abs(v) < 1 ? `${Math.round(Math.abs(v) * 12)} in` : `${Math.abs(v).toFixed(1)} ft`) : "-");
const puttsNow = () => shots.filter((s) => s.putt);

function renderPuttTiles(p) {
  const res = p.result;
  const pace = has(p.pace) ? [Math.abs(p.pace).toFixed(1), Math.abs(p.pace) < 0.05 ? "ft" : `ft ${p.pace > 0 ? "past" : "short"}`] : ["-", ""];
  const hole = has(p.atHole) ? [Math.abs(p.atHole).toFixed(1), Math.abs(p.atHole) < 0.05 ? "in" : `in ${p.atHole > 0 ? "R" : "L"}`] : ["-", ""];
  const strike = has(p.club?.impactH) ? [Math.abs(p.club.impactH).toFixed(1), Math.abs(p.club.impactH) < 0.05 ? "mm" : `mm ${p.club.impactH > 0 ? "toe" : "heel"}`] : ["-", ""];
  showTiles([
    ["Putt", fmt(res?.feet), "ft"],
    ["Result", resultWords(res) ?? "-", ""],
    ["Ball speed", fmt(p.ball.speed), "mph"],
    ["Roll", fmt(p.roll), "ft flat"],
    ["Pace", ...pace],
    ["Start line", ...side(p.ball.start, "°")],
    ["At the hole", ...hole],
    ["Face", ...side(p.club?.face, "°")],
    ["Path", ...side(p.club?.path, "°")],
    ["Face / path", fmt(p.club?.facePath), "°"],
    ["Club speed", fmt(p.club?.speed), "mph"],
    ["Strike", ...strike],
  ]);
}

// From above, the start line to the hole: sideways drawn many times bigger
// than along (a cup is 4¼ in across; the putt may be 30 ft), so an inch off
// line can be seen. The session's other putts faded behind.
function renderStartLine(p) {
  const svg = $("ss-launch");
  clear(svg);
  const cx = 150;
  const ballY = 232;
  const holeY = 52;
  const cupR = 26;
  const k = cupR / CUP_HALF_IN; // pixels per inch sideways
  const x = (inches) => cx + Math.max(-140, Math.min(140, inches * k));
  el(svg, "line", { x1: cx, y1: ballY, x2: cx, y2: holeY - 30, stroke: "#93a897", "stroke-dasharray": "6 6" });
  el(svg, "circle", { cx, cy: holeY, r: cupR, fill: "#0d1a12", stroke: "#e7efe8", "stroke-width": 2 });
  el(svg, "text", { x: cx + cupR + 6, y: holeY - cupR + 4, class: "muted" }, p.result ? `${fmt(p.result.feet)} ft` : "where it stops");
  for (const o of puttsNow().slice(-12, -1)) {
    if (!has(o.putt.atHole)) continue;
    el(svg, "line", { x1: cx, y1: ballY, x2: x(o.putt.atHole), y2: holeY, stroke: "#e7efe8", "stroke-width": 2, opacity: 0.22 });
  }
  if (has(p.atHole)) {
    const color = p.onLine ? "#52d97c" : "#ffd23f";
    el(svg, "line", { x1: cx, y1: ballY, x2: x(p.atHole), y2: holeY, stroke: color, "stroke-width": 4 });
    el(svg, "circle", { cx: x(p.atHole), cy: holeY, r: 6, fill: color, stroke: "#111", "stroke-width": 2 });
  }
  el(svg, "circle", { cx, cy: ballY, r: 7, fill: "#fff" });
  el(svg, "text", { x: 8, y: 250, class: "muted" }, "sideways drawn bigger");
  $("ss-launch-text").innerHTML = [
    has(p.ball.start) && `Start <b>${lr(p.ball.start)}°</b>${has(p.atHole) ? ` - ${esc(lineWords(p.atHole))}` : ""}`,
    (has(p.ball.launch) || has(p.ball.spin)) && `<span class="muted">${[has(p.ball.launch) && `Launch ${fmt(p.ball.launch)}°`, has(p.ball.spin) && `spin ${p.ball.spin} rpm`].filter(Boolean).join(", ")}</span>`,
  ]
    .filter(Boolean)
    .join("<br>");
}

// The pace: each recent putt's roll on a flat green, a lane each (the
// latest at the bottom), against its hole and the band just past it
// (up to 1½ ft) that a good pace finishes in.
function renderPace() {
  const svg = $("ss-flight");
  clear(svg);
  const W = 640;
  const left = 30;
  const list = puttsNow().slice(-6);
  if (!list.length) return;
  const far = Math.max(8, ...list.map((s) => Math.max(s.putt.roll ?? 0, (s.putt.result?.feet ?? 0) + 2))) * 1.08;
  const sx = (W - left - 20) / far;
  const px = (ft) => left + ft * sx;
  const bottom = 200;
  const lane = Math.min(30, 170 / list.length);
  const step = far > 40 ? 10 : far > 16 ? 5 : 2;
  el(svg, "line", { x1: left, y1: bottom + 8, x2: W - 10, y2: bottom + 8, stroke: "#52d97c", "stroke-width": 3 });
  for (let ft = step; ft < far; ft += step) {
    el(svg, "line", { x1: px(ft), y1: bottom + 8, x2: px(ft), y2: bottom + 14, stroke: "#93a897" });
    el(svg, "text", { x: px(ft), y: bottom + 30, "text-anchor": "middle", class: "muted" }, `${ft} ft`);
  }
  list.forEach((s, i) => {
    const p = s.putt;
    const latest = i === list.length - 1;
    const y = bottom - (list.length - 1 - i) * lane;
    const hole = p.result?.feet;
    if (has(hole)) {
      el(svg, "rect", { x: px(hole), y: y - 7, width: Math.max(2, 1.5 * sx), height: 14, fill: "#52d97c", opacity: latest ? 0.35 : 0.15 });
      el(svg, "line", { x1: px(hole), y1: y - 11, x2: px(hole), y2: y + 11, stroke: "#e7efe8", "stroke-width": 3, opacity: latest ? 1 : 0.4 });
    }
    if (has(p.roll)) {
      const made = p.result?.made;
      el(svg, "line", { x1: left, y1: y, x2: px(p.roll), y2: y, stroke: made ? "#ffd23f" : "#3cc4ff", "stroke-width": latest ? 5 : 2, opacity: latest ? 1 : 0.4 });
      el(svg, "circle", { cx: px(p.roll), cy: y, r: latest ? 7 : 4, fill: "#fff", opacity: latest ? 1 : 0.5 });
    }
    if (latest) {
      const words = [has(p.roll) && `rolls ${fmt(p.roll)} ft`, has(p.pace) && `${feetText(p.pace)} ${p.pace >= 0 ? "past" : "short"}`].filter(Boolean).join(" - ");
      const tx = has(p.roll) ? px(p.roll) + 12 : left;
      const edge = tx > W - 200;
      el(svg, "text", { x: edge ? W - 6 : tx, y: y - 12, "text-anchor": edge ? "end" : "start" }, words);
    }
  });
  el(svg, "text", { x: left, y: 20, class: "muted" }, `Flat green, stimp ${list.at(-1).putt.stimp} - the stroke's own length, slopes taken away`);
}

// Pace against line, every putt this session with a hole: across, where the
// start line reaches the hole (inches); up and down, how far past or short
// the stroke would roll on the flat. The hole in the middle, and the box a
// good putt lands in - on the cup, up to 1½ ft past.
function renderPuttDispersion() {
  const svg = $("ss-disp");
  clear(svg);
  const W = 300;
  const H = 240;
  const cx = W / 2;
  const cy = 150;
  const perIn = 9; // pixels per inch across
  const perFt = 16; // pixels per foot along
  const x = (inches) => cx + Math.max(-140, Math.min(140, inches * perIn));
  const y = (ft) => cy - Math.max(-5.5, Math.min(8.5, ft)) * perFt;
  el(svg, "rect", { x: x(-CUP_HALF_IN), y: y(1.5), width: 2 * CUP_HALF_IN * perIn, height: 1.5 * perFt, fill: "#52d97c", opacity: 0.2 });
  el(svg, "line", { x1: 10, y1: cy, x2: W - 10, y2: cy, stroke: "#2b4232" });
  el(svg, "line", { x1: cx, y1: 8, x2: cx, y2: H - 8, stroke: "#2b4232" });
  el(svg, "circle", { cx, cy, r: CUP_HALF_IN * perIn, fill: "none", stroke: "#e7efe8", "stroke-width": 2 });
  el(svg, "text", { x: W - 10, y: 18, "text-anchor": "end", class: "muted" }, "past");
  el(svg, "text", { x: W - 10, y: H - 8, "text-anchor": "end", class: "muted" }, "short");
  el(svg, "text", { x: 10, y: cy - 6, class: "muted" }, "left");
  el(svg, "text", { x: W - 10, y: cy - 6, "text-anchor": "end", class: "muted" }, "right");
  const list = puttsNow().filter((s) => has(s.putt.pace) && has(s.putt.atHole)).slice(-30);
  if (!list.length) {
    el(svg, "text", { x: cx, y: 40, "text-anchor": "middle", class: "muted" }, "Putts on a green with a hole show here");
    return;
  }
  list.forEach((s, i) => {
    const latest = i === list.length - 1;
    el(svg, "circle", { cx: x(s.putt.atHole), cy: y(s.putt.pace), r: latest ? 8 : 5, fill: s.putt.result?.made ? "#ffd23f" : "#3cc4ff", opacity: latest ? 1 : 0.55, stroke: latest ? "#fff" : "none", "stroke-width": 2 });
  });
}

function renderPuttTable() {
  const cols = [
    ["Putt", (p) => (p.result ? `${fmt(p.result.feet)} ft` : "-")],
    ["Result", (p) => resultWords(p.result) ?? "-"],
    ["Ball", (p) => fmt(p.ball.speed)],
    ["Roll", (p) => fmt(p.roll)],
    ["Start", (p) => lr(p.ball.start)],
    ["Face", (p) => lr(p.club?.face)],
    ["Path", (p) => lr(p.club?.path)],
    ["Strike", (p) => (has(p.club?.impactH) ? `${Math.abs(p.club.impactH).toFixed(0)} ${p.club.impactH >= 0 ? "toe" : "heel"}` : "-")],
  ];
  const all = puttsNow();
  const head = `<tr>${cols.map(([h]) => `<th>${h}</th>`).join("")}</tr>`;
  const rows = all
    .slice(-8)
    .reverse()
    .map((s, i) => `<tr class="${i === 0 ? "latest" : ""}">${cols.map(([, get]) => `<td>${esc(get(s.putt))}</td>`).join("")}</tr>`)
    .join("");
  const a = puttSummary(all.map((s) => s.putt));
  const made = a.known ? `Holed ${a.made}/${a.known}` : `${a.putts} putts`;
  const line = a.lines ? `on line ${a.onLine}/${a.lines}` : "";
  const vals = [made, line, fmt(a.speed), fmt(a.roll), lr(a.start), lr(a.face), lr(a.path), has(a.impactH) ? `${Math.abs(a.impactH).toFixed(0)} ${a.impactH >= 0 ? "toe" : "heel"}` : "-"];
  $("ss-table").innerHTML = head + rows + `<tr class="avg">${vals.map((v) => `<td>${esc(v)}</td>`).join("")}</tr>`;
}

// A shot that wasn't a launch monitor's, said: "mouse swing", "controller
// swing" (or "test shot", the tests' and checks').
const madeUpWords = (entry) => entry.source === "test" && String(entry.deviceId || "test shot").toLowerCase();

function renderPuttView(last) {
  const p = last.putt;
  const r = last.report;
  $("ss-shape").textContent = p.result ? (p.result.made ? "Holed!" : `Putt - ${resultWords(p.result)}`) : "Putt";
  const n = puttsNow().length;
  $("ss-sub").textContent = [clubName("PT"), `putt ${n} this session`, p.result && `${fmt(p.result.feet)} ft`, madeUpWords(last.entry)].filter(Boolean).join(" - ");
  $("ss-spin").hidden = true;
  $("ss-strike").hidden = true;
  renderPuttTiles(p);
  renderAbove(r);
  renderSide(r);
  renderFace(r);
  renderStartLine(p);
  renderPace();
  renderPuttDispersion();
  renderPuttTable();
}

// ---- Putting it together ---------------------------------------------------------

function flightFor(entry) {
  try {
    // Off a flat fairway: the launch monitor's shot, not the lie it came off.
    return simulateShot(entry.ball);
  } catch {
    return null;
  }
}

function renderAll() {
  const last = shots.at(-1);
  if (!last) return;
  const r = last.report;
  const badge = $("ss-club");
  badge.textContent = r.clubName ? clubShort(r.clubName) : "-";
  badge.style.background = clubColor(r.clubName);
  $("ss-shape").textContent = r.shape?.name ?? "Shot";
  $("ss-sub").textContent = [r.clubName && clubName(r.clubName), `shot ${sessionShots} this session`, madeUpWords(last.entry)].filter(Boolean).join(" - ");
  const spin = $("ss-spin");
  spin.hidden = r.measuredSpin === null || r.measuredSpin === undefined;
  spin.className = `ss-badge ${r.measuredSpin ? "measured" : "estimated"}`;
  spin.textContent = r.measuredSpin ? "Spin measured" : "Spin estimated";
  // Thin, fat, topped - or a reading that looks like a misread - as the
  // player's stats judged it (server/stats.mjs), once they have.
  const strike = $("ss-strike");
  const said = last.strike;
  strike.hidden = !said || (!said.odd && (!said.strike || said.strike === "good"));
  strike.textContent = said?.odd ? "Misread?" : (STRIKE_NAMES[said?.strike] ?? "");
  strike.title = said?.odd ? "No real strike gives these numbers - left out of the stats until the player says" : "Left out of the club's carry in the stats, counted in its strike percentages";
  // A note said about it ("shot note, pulled it"): its tags, then its words.
  const note = $("ss-note");
  const notes = last.note?.notes ?? [];
  note.hidden = !notes.length;
  note.innerHTML = notes.length ? `${(last.note.tags ?? []).map((t) => `<span class="ss-tag ${tagGroup(t)}">${esc(t)}</span>`).join("")}<q>${esc(notes.join(" · "))}</q>` : "";
  setCaptions(!!last.putt);
  if (last.putt) return renderPuttView(last);
  renderTiles(r);
  renderAbove(r);
  renderSide(r);
  renderFace(r);
  renderLaunch(r);
  renderFlight();
  renderDispersion();
  renderTable();
}

// ---- The cameras, and the shot history drawer -------------------------------------
//
// The cameras: a column down the right, the screen's other boxes laid out
// round it (narrower, the session table moved under the cameras), the same
// for every shot.
const cams = new ShotCams({
  host: $("ss-cams"),
  onChange: (n, { width, table: under }) => {
    document.body.classList.toggle("with-cams", n > 0);
    document.body.classList.toggle("table-under-cams", n > 0 && under);
    document.body.dataset.cams = String(n);
    if (width) document.body.style.setProperty("--ss-cam-w", `${width}px`);
    $("ss-cams").hidden = n === 0;
    const table = document.querySelector(".ss-table-wrap");
    const home = n > 0 && under ? $("ss-cams") : document.querySelector(".ss-wide");
    if (table.parentNode !== home) home.appendChild(table);
  },
});

// Every shot this session (the last KEEP), newest first, and each club's
// averages - over the right of the screen while it's wanted. Each with its
// Replay, and - for the shots the game can still change (its recorder's
// last few: editable, from the game) - its marks and its club, as in the
// command centre's Shot history.
let editable = new Map();
function shotTools(s) {
  const n = s.entry?.shotNumber;
  const replay = Number.isInteger(n) ? `<button type="button" data-replay="${n}">Replay</button>` : "";
  const now = s.statsId ? editable.get(s.statsId) : null;
  if (!now) {
    const why = s.statsId ? `Only the last ${HISTORY_MAX} shots can be changed` : "Not recorded";
    return `<div class="ss-edit">${replay} <span class="ss-edit-why">${why}</span></div>`;
  }
  const id = esc(s.statsId);
  const can = historyClubs({ club: now.club ?? (s.putt ? "PT" : null) });
  const clubs = can.length ? `<select data-clubof="${id}" title="The club this shot was really hit with">${now.club ? "" : `<option value="" selected>Which club?</option>`}${can.map((c) => `<option value="${c}"${c === now.club ? " selected" : ""}>${esc(clubShort(c))}</option>`).join("")}</select>` : "";
  const marks = HISTORY_MARKS.map((m) => `<button type="button" data-say="${m}" data-id="${id}" class="${now.say === m ? "on" : ""}${m === "misread" ? " out" : ""}" title="${now.say === m ? "Put it back as it was judged" : esc(HISTORY_MARK_NAMES[m])}">${esc(HISTORY_MARK_NAMES[m])}</button>`).join("");
  return `<div class="ss-edit">${replay} ${clubs} ${marks}</div>`;
}
function renderHistory() {
  const cols = TABLE_COLS;
  const head = `<tr><th>#</th>${cols.map(([h]) => `<th>${h}</th>`).join("")}</tr>`;
  const list = shots.map((s, i) => ({ s, n: sessionShots - shots.length + i + 1 })).reverse();
  const rows = list
    .map(({ s, n }) =>
      s.putt
        ? `<tr class="putt"><td>${n}</td><td>PT</td><td colspan="${cols.length - 1}">${esc([has(s.putt.ball.speed) ? `${fmt(s.putt.ball.speed)} mph` : null, resultWords(s.putt.result) ?? "Putt"].filter(Boolean).join(" · "))}${shotTools(s)}</td></tr>`
        : `<tr><td>${n}</td>${cols.map(([, get]) => `<td>${esc(get(s.report))}</td>`).join("")}</tr><tr class="ss-edit-row"><td></td><td colspan="${cols.length}">${shotTools(s)}</td></tr>`,
    )
    .join("");
  const avg = [...tallies]
    .filter(([club]) => club && club !== "PT")
    .map(([club, t]) => {
      const a = t.averages();
      if (!a.shots) return "";
      const vals = [`${clubShort(club)} (${a.shots})`, fmt(a.ballSpeed), fmt(a.clubSpeed), fmt(a.smash, 2), fmt(a.launch), has(a.spin) ? Math.round(a.spin) : "-", fmt(a.carry), fmt(a.total), lr(a.path), lr(a.face)];
      return `<tr><td></td>${vals.map((v) => `<td>${esc(v)}</td>`).join("")}</tr>`;
    })
    .join("");
  $("ss-drawer-body").innerHTML = shots.length
    ? `<h3>Each club's averages</h3><table class="ss-table">${head}${avg}</table><h3>Every shot, newest first</h3><table class="ss-table">${head}${rows}</table>`
    : `<p class="muted">The shots this session show here as they're hit.</p>`;
}
function showHistory(on) {
  $("ss-drawer").hidden = !on;
  if (on) renderHistory();
}
$("ss-history").addEventListener("click", (e) => {
  e.currentTarget.blur();
  showHistory($("ss-drawer").hidden);
});
$("ss-drawer-close").addEventListener("click", () => showHistory(false));
$("ss-drawer-body").addEventListener("click", (e) => {
  const replay = e.target.closest?.("[data-replay]");
  if (replay) {
    const n = Number(replay.dataset.replay);
    const row = shots.find((s) => s.entry?.shotNumber === n);
    cams.shot(n, row?.report?.clubName ? clubName(row.report.clubName) : "");
    return;
  }
  // (The mark it has already, again: back as it was judged.)
  const say = e.target.closest?.("[data-say]");
  if (say?.dataset.id) {
    const was = editable.get(say.dataset.id)?.say;
    const msg = historyMessage({ id: say.dataset.id, say: say.dataset.say === was ? "auto" : say.dataset.say });
    if (msg) keysOut?.postMessage(msg);
  }
});
$("ss-drawer-body").addEventListener("change", (e) => {
  const club = e.target.closest?.("[data-clubof]");
  if (!club?.dataset.clubof || !club.value) return;
  const msg = historyMessage({ id: club.dataset.clubof, club: club.value });
  if (msg) keysOut?.postMessage(msg);
});

function addShot(entry, { live = true } = {}) {
  if (!entry?.ball) return;
  // A putt has no flight: the putting view shows it (its result comes
  // with the stats' strike, once it has stopped).
  const putt = isPutt(entry) ? puttReport(entry, { stimp: stimpNow() }) : null;
  const flight = putt ? null : flightFor(entry);
  const report = shotReport(entry, flight, handNow());
  shots.push({ entry, flight, report, putt, seen: Date.now() });
  if (shots.length > KEEP) shots.shift();
  sessionShots++;
  tallyFor(report).add(report);
  renderAll();
  // Its replay, in the camera column once it's ready (not for the last
  // shot fetched when the screen opens: its replay has been and gone).
  if (live) cams.shot(entry.shotNumber, report.clubName ? clubName(report.clubName) : "");
  if (!$("ss-drawer").hidden) renderHistory();
}

// Club data follows its shot by a moment (the Omni sends it when asked).
function addClub({ shotNumber, clubData }) {
  const last = shots.at(-1);
  if (!last || last.entry.shotNumber !== shotNumber) return;
  last.entry = { ...last.entry, clubData };
  const before = last.report;
  last.report = shotReport(last.entry, last.flight, handNow());
  tallyFor(before).swap(before, last.report);
  if (last.putt) last.putt = puttReport(last.entry, { stimp: last.putt.stimp, result: last.tg });
  renderAll();
}

// How the stats judged the latest shot's strike: it comes once the shot is
// recorded (on the range at once, elsewhere when the ball has stopped).
function addStrike(info) {
  const last = shots.at(-1);
  if (!last || Date.now() - last.seen > 60000) return;
  last.strike = info;
  // Which shot it is in the stats, so a note said about it finds it.
  last.statsId = info.id ?? null;
  // How a putt finished: its length, and how far from the hole.
  if (last.putt && info.tg) {
    last.tg = info.tg;
    last.putt = puttReport(last.entry, { stimp: last.putt.stimp, result: info.tg });
  }
  renderAll();
}

// A note said about a shot, with its tags (server/stats.mjs): shown with the
// latest shot when it's about that one.
function addNote(info) {
  const last = shots.at(-1);
  if (!last || !info?.id || last.statsId !== info.id) return;
  last.note = info;
  renderAll();
}

function showLink(s) {
  // The owner's carry match, as the sim flies with it (app.js showStatus), so
  // this screen's carry is the range's.
  setCarryMatch(s.carryMatch ?? 1, s.carrySpin ?? 1);
  const omni = omniStatusLine(s.omni, s.gspconnect);
  $("ss-link").textContent = omni ? omni.text : s.connectors > 0 ? "Launch monitor connected" : "No launch monitor yet";
}

function connect() {
  const events = new EventSource("/events");
  events.addEventListener("shot", (e) => addShot(JSON.parse(e.data)));
  events.addEventListener("club", (e) => addClub(JSON.parse(e.data)));
  events.addEventListener("strike", (e) => addStrike(JSON.parse(e.data)));
  events.addEventListener("note", (e) => addNote(JSON.parse(e.data)));
  events.addEventListener("status", (e) => showLink(JSON.parse(e.data)));
  events.onerror = () => ($("ss-link").textContent = "Lost A² Golf - reconnecting...");
}

// Full screen or a window: the app does it for its window (so it can be
// moved between screens); a browser uses its own full screen.
function toggleFullScreen() {
  if (window.golfsimShot) return window.golfsimShot.toggleFullScreen();
  if (document.fullscreenElement) document.exitFullscreen?.();
  else document.documentElement.requestFullscreen?.().catch(() => {});
}
$("ss-full").addEventListener("click", toggleFullScreen);
document.querySelector(".ss-head").addEventListener("dblclick", toggleFullScreen);
// Its own keys: F (and F11, in the app) for full screen. Every other key is
// the sim's, sent on to it, so the keys work whichever window has the
// keyboard - nobody at the mat should have to click the projector first
// (public/sim/screens.mjs says which keys, and the sim checks them again).
let keysOut = null;
try {
  keysOut = new BroadcastChannel(KEY_CHANNEL);
  // Which shots can still be changed (the game says, as they change).
  keysOut.addEventListener("message", (m) => {
    const list = readHistoryList(m.data);
    if (!list) return;
    editable = list;
    if (!$("ss-drawer").hidden) renderHistory();
  });
  keysOut.postMessage(HISTORY_ASK);
} catch {
  // No BroadcastChannel: the keys stay here.
}
document.addEventListener("keydown", (e) => {
  // Esc closes the shot history drawer when it's open (and goes no further).
  if (e.key === "Escape" && !$("ss-drawer").hidden) {
    e.preventDefault();
    return showHistory(false);
  }
  if (e.key === "f" || e.key === "F") toggleFullScreen();
  if (!keysOut || shotScreenKeeps(e)) return;
  e.preventDefault();
  keysOut.postMessage(keyMessage(e));
});

// The last shot, so the screen isn't blank when it opens mid-session.
fetch("/api/last-shot")
  .then((r) => r.json())
  .then((entry) => entry && addShot(entry, { live: false }))
  .catch(() => {})
  .finally(connect);
