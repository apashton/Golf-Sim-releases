// My stats -> Your phones (stats.html): phones linked to this PC once, then
// kept in step by themselves (server/phonelinks.mjs, sim/devicelink.mjs).
// Link a phone shows the code (and its QR code) for a quarter of an hour;
// each linked phone is listed with when it was last in touch, what's still
// waiting from it and Unlink; Sync now doesn't wait for the ten minutes.

import { esc } from "./util.js";
import { qrPath } from "./sim/qrcode.mjs";
import { agoWords } from "./sim/devicelink.mjs";

const $ = (id) => document.getElementById(id);

function qrSvg(text) {
  const q = qrPath(text);
  return q ? `<svg viewBox="0 0 ${q.size} ${q.size}" role="img" aria-label="QR code to link a phone"><rect width="${q.size}" height="${q.size}" fill="#fff"/><path d="${q.d}" fill="#000"/></svg>` : "";
}

export class LinkPanel {
  // changed(): stats came in from a phone.
  constructor({ changed = () => {} } = {}) {
    this.changed = changed;
    this.got = 0;
    $("link-get").addEventListener("click", () => this.post({ op: "link" }));
    $("link-sync").addEventListener("click", () => this.post({ op: "sync" }));
    $("link-end").addEventListener("click", () => this.post({ op: "unlink" }));
    $("link-phones").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-unlink]");
      if (b) this.post({ op: "unlink", device: b.dataset.unlink });
    });
    this.poll();
  }

  async post(body) {
    $("link-msg").textContent = body.op === "link" ? "Asking the online server..." : body.op === "sync" ? "Getting in step..." : "";
    try {
      const r = await fetch("/api/phone/link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      this.render(await r.json());
    } catch {
      $("link-msg").textContent = "Couldn't reach the sim's server";
    }
    this.poll();
  }

  // Asked again every few seconds while the code's up or it's syncing,
  // else every minute.
  async poll() {
    clearTimeout(this.timer);
    let v = null;
    try {
      v = await fetch("/api/phone/link").then((r) => (r.ok ? r.json() : null));
    } catch {
      v = null;
    }
    if (v) this.render(v);
    this.timer = setTimeout(() => this.poll(), v && (v.open || v.state === "syncing") ? 3000 : 60000);
  }

  render(v) {
    const now = Date.now();
    $("link-open").hidden = !v.open;
    $("link-code").textContent = v.open ? v.shown : "";
    $("link-qr").innerHTML = v.open && v.page ? qrSvg(v.page) : "";
    $("link-phones").innerHTML = (v.phones ?? [])
      .map(
        (p) =>
          `<li><b>${esc(p.name)}</b> <span class="muted small">linked ${esc(agoWords(p.joined, now))}, last in touch ${esc(agoWords(p.seen, now))}${p.waiting ? `, ${p.waiting} to come in` : ""}</span><button data-unlink="${esc(p.device)}" title="Take this phone off: it stops sending its shots here">Unlink</button></li>`,
      )
      .join("");
    $("link-get").textContent = v.linked && v.phones?.length ? "Link another phone" : "Link a phone";
    $("link-get").hidden = !!v.open;
    $("link-sync").hidden = !v.phones?.length;
    $("link-end").hidden = !v.linked;
    const msg = v.state === "failed"
      ? v.error
      : v.open
        ? `On the phone: Play (or At the range), My stats - type ${v.shown} and press Link. It takes a phone for 15 minutes.`
        : v.state === "syncing"
          ? "Getting in step..."
          : v.phones?.length
            ? `In step ${agoWords(v.synced, now)}${v.got?.shots ? ` - ${v.got.shots} shot${v.got.shots === 1 ? "" : "s"} came in` : ""}.`
            : v.on
              ? ""
              : "Linking needs the online server, and there isn't one set up.";
    $("link-msg").textContent = msg ?? "";
    $("link-msg").classList.toggle("bad", v.state === "failed");
    // Shots came in: the page shows them.
    const got = v.got?.shots ?? 0;
    if (v.state === "done" && got && got !== this.got) this.changed();
    this.got = got;
  }
}
