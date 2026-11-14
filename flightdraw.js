// A shot's flight path drawn on a canvas: from the side (along the ground
// and up) or from above (down the range, left and right), drawn as far as
// the ball has got (t, 0 - 1 through its hang time) with the ball at its
// head, then whole with the carry at its end. The recording's Flight path
// layer (compositor.js) and the controls window's Flight path box
// (ccwidgets.js) both draw it.

const FONT = `"Bahnschrift", "Segoe UI", "Helvetica Neue", Arial, sans-serif`;
const ACCENT = "#ffd23f";
const PANEL = "rgba(8, 14, 10, 0.72)";

// A made-up drive, for placing a flight path before any shot: [x, y, z,
// t] metres and seconds.
export const SAMPLE_PATH = Array.from({ length: 31 }, (_, i) => {
  const t = (i / 30) * 6;
  const x = 210 * (1 - Math.exp(-t / 3.2)) * 1.25;
  return [x, Math.max(0, 30 * Math.sin((Math.PI * t) / 6) * (1 - t / 14)), -4 + 0.35 * t * t, t];
});

function roundRect(g, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  g.beginPath();
  if (g.roundRect) g.roundRect(x, y, w, h, rr);
  else g.rect(x, y, w, h);
}

// g: a 2d context; r: { x, y, w, h } to draw in; shot: { flight: { path,
// flightPoints, carry } } or null; H: the picture's height (sizes the
// lines); view "side" or "above"; sample: a made-up shot when there's
// none; panel: false to leave the background out.
export function drawFlightPath(g, r, { shot = null, t = 1, H = 1080, view = "side", sample = false, panel = true } = {}) {
  let path = shot?.flight?.path;
  let points = shot?.flight?.flightPoints ?? path?.length ?? 0;
  if (!path?.length) {
    if (!sample) return;
    path = SAMPLE_PATH;
    points = SAMPLE_PATH.length;
    t = 1;
  }
  const air = path.slice(0, Math.max(2, points));
  const side = view !== "above";
  // The two axes shown: along (x) and up (y), or across (z) and along.
  const P = (p) => (side ? [p[0], p[1]] : [p[2], p[0]]);
  const pts = air.map(P);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const pad = Math.max(8, Math.min(r.w, r.h) * 0.1);
  if (panel) {
    g.fillStyle = PANEL;
    roundRect(g, r.x, r.y, r.w, r.h, Math.min(r.w, r.h) * 0.12);
    g.fill();
  }
  // Scaled to fit, the same scale both ways (a flight's shape is true)
  // unless that would make it a flat line: from the side, up is drawn up
  // to three times bigger.
  let x0, x1, y0, y1;
  if (side) {
    x0 = 0;
    x1 = Math.max(10, ...xs);
    y0 = 0;
    y1 = Math.max(5, ...ys);
  } else {
    const m = Math.max(15, ...xs.map(Math.abs));
    x0 = -m;
    x1 = m;
    y0 = 0;
    y1 = Math.max(10, ...ys);
  }
  const iw = r.w - pad * 2;
  const ih = r.h - pad * 2;
  let sx = iw / (x1 - x0);
  let sy = ih / (y1 - y0);
  if (side) sy = Math.min(sy, sx * 3);
  else sx = sy = Math.min(sx, sy);
  const ox = side ? r.x + pad : r.x + r.w / 2;
  const oy = r.y + r.h - pad;
  const X = (v) => ox + (side ? v - x0 : v) * sx;
  const Y = (v) => oy - (v - y0) * sy;
  // The ground (from the side) or the target line (from above).
  g.strokeStyle = "rgba(255, 255, 255, 0.28)";
  g.lineWidth = Math.max(1, H / 540);
  g.beginPath();
  if (side) {
    g.moveTo(r.x + pad * 0.5, oy);
    g.lineTo(r.x + r.w - pad * 0.5, oy);
  } else {
    g.moveTo(ox, oy);
    g.lineTo(ox, r.y + pad * 0.5);
  }
  g.stroke();
  // How far along: t of its hang time.
  const hang = air.at(-1)[3] ?? 1;
  const upTo = t * hang;
  const shown = [];
  for (const p of air) {
    if (p[3] > upTo && shown.length) break;
    shown.push(P(p));
  }
  g.strokeStyle = ACCENT;
  g.lineWidth = Math.max(2, H / 300);
  g.lineJoin = "round";
  g.lineCap = "round";
  g.beginPath();
  for (const [i, [a, b]] of shown.entries()) (i ? g.lineTo : g.moveTo).call(g, X(a), Y(b));
  g.stroke();
  const head = shown.at(-1);
  if (head) {
    g.fillStyle = "#fff";
    g.beginPath();
    g.arc(X(head[0]), Y(head[1]), Math.max(3, H / 200), 0, Math.PI * 2);
    g.fill();
  }
  // Down: the carry at the landing.
  const carry = shot?.flight?.carry;
  if (t >= 1 && Number.isFinite(carry) && head) {
    const size = Math.round(Math.max(12, Math.min(r.h * 0.16, H / 30)));
    g.font = `700 ${size}px ${FONT}`;
    g.fillStyle = "#fff";
    g.textBaseline = "bottom";
    g.textAlign = side ? "right" : "left";
    g.fillText(`${Math.round(carry)} yds`, side ? Math.min(X(head[0]), r.x + r.w - pad * 0.5) : X(head[0]) + 8, side ? Y(head[1]) - 8 : Math.max(r.y + size + 4, Y(head[1])));
  }
}
