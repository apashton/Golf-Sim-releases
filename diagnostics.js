// The diagnostics page: live connection checks, advice, and the raw log.

import { diagnose, trimLog } from "./diagnose.mjs";
import { esc } from "./util.js";

const $ = (sel) => document.querySelector(sel);
let status = {};
let entries = [];
let paused = false;
const pending = [];

// Pretty-prints each JSON object in a chunk, leaving anything else as sent.
function tidy(text) {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

// Heartbeats (a connector's every second or two, the Omni's status check
// every four seconds) bury everything else. The server marks them, and their
// acknowledgements, as `beat`.
function hidden(entry) {
  return $("#hide-heartbeats").checked && !!entry.beat;
}

function renderLog() {
  const pretty = $("#pretty").checked;
  const rows = [];
  entries.forEach((e) => {
    if (hidden(e)) return;
    const arrow = { in: "&larr;", out: "&rarr;", info: "&bull;" }[e.kind] ?? "?";
    const time = new Date(e.at).toLocaleTimeString([], { hour12: false });
    const where = [e.port && `:${e.port}`, e.peer].filter(Boolean).join(" ");
    const text = e.kind === "info" ? e.text : pretty ? tidy(e.text) : e.text;
    rows.push(
      `<tr><td class="t">${time}<br>${esc(where)}</td><td class="k k-${e.kind}">${arrow}</td><td class="x">${esc(text)}</td></tr>`,
    );
  });
  rows.reverse(); // newest first
  $("#log").innerHTML = rows.join("") || `<tr><td class="muted">Nothing yet.</td></tr>`;
  $("#log-count").textContent = `(${entries.length} entries${paused ? ", paused" : ""})`;
}

function renderChecks() {
  const { checks, advice } = diagnose(status, entries);
  // Which A-Squared Golf this is, so a copied log or a photo says.
  $("#app-version").textContent = status.appVersion ? `A² Golf ${status.appVersion}` : "A² Golf (browser)";
  // Over Bluetooth the buttons tell the Omni itself, as changing club in the
  // sim does; otherwise they tell a connector, as GSPro would.
  const bluetoothOnly = status.omni && !(status.connectorList ?? []).length;
  $("#club-help").textContent = bluetoothOnly
    ? "Tells the Omni the club over Bluetooth, as changing club in the sim does (the log shows each one). The putter should switch it into putting mode."
    : "What changing club does: the Omni over Bluetooth, or a connector, is told the club. The putter should switch the Omni into putting mode.";
  // In the Windows app, its own hidden window holds the Omni: a second one
  // opened by hand would fight it.
  $("#omni-tool").hidden = !!status.appVersion;
  $("#checks").innerHTML = checks
    .map(
      (c) => `<div class="check-card ${c.state}"><h4>${esc(c.title)}</h4><b>${esc(c.value)}</b><p>${esc(c.detail)}</p></div>`,
    )
    .join("");
  $("#advice").innerHTML = advice.length
    ? `<h3>What to do next</h3><ol>${advice.map((a) => `<li>${esc(a)}</li>`).join("")}</ol>`
    : "";
  const addrs = status.addresses ?? [];
  const ports = (status.ports ?? []).filter((p) => p.state === "listening").map((p) => p.port);
  $("#addresses").innerHTML =
    `On this PC: <b>127.0.0.1</b>, port <b>${ports.join(" or ") || "-"}</b>` +
    (addrs.length
      ? `<br>From another machine: ${addrs.map((a) => `<b>${esc(a.address)}</b> <span class="small">(${esc(a.name)})</span>`).join(", ")}`
      : "");
}

async function load() {
  const [s, w] = await Promise.all([fetch("/api/status").then((r) => r.json()), fetch("/api/wire").then((r) => r.json())]);
  status = s;
  entries = w;
  renderChecks();
  renderLog();
}

const events = new EventSource("/events?wire=1");
events.addEventListener("status", (e) => {
  status = JSON.parse(e.data);
  renderChecks();
});
events.addEventListener("wire", (e) => {
  const entry = JSON.parse(e.data);
  if (paused) {
    pending.push(entry);
    return;
  }
  entries.push(entry);
  // As the server keeps it: the latest 300, only a few of them heartbeats.
  entries = trimLog(entries);
  renderChecks();
  renderLog();
});
events.onerror = () => {
  $("#advice").innerHTML = status.appVersion
    ? "<h3>Lost A² Golf</h3><p>Is A² Golf still open? Start it again, then this page reconnects by itself.</p>"
    : "<h3>Lost the A² Golf server</h3><p>Is its window still open? In a browser, restart it with start.bat (or npm start).</p>";
};
// Heartbeat ages change without any new event.
setInterval(renderChecks, 5000);

for (const btn of document.querySelectorAll("[data-club]")) {
  btn.addEventListener("click", () =>
    fetch("/api/club", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ club: btn.dataset.club }),
    }),
  );
}
$("#hide-heartbeats").addEventListener("change", renderLog);
$("#pretty").addEventListener("change", renderLog);
$("#pause").addEventListener("click", () => {
  paused = !paused;
  $("#pause").textContent = paused ? "Resume" : "Pause";
  if (!paused) {
    entries = trimLog([...entries, ...pending.splice(0)]);
  }
  renderLog();
});
$("#clear").addEventListener("click", async () => {
  await fetch("/api/wire/clear", { method: "POST" });
  entries = [];
  renderLog();
  renderChecks();
});
$("#copy").addEventListener("click", async () => {
  // Everything, heartbeats included, plus the status - what someone
  // debugging from elsewhere needs.
  const text = [
    `A² Golf connection log, ${new Date().toISOString()}, ${status.appVersion ? `A² Golf ${status.appVersion}` : "browser"}`,
    `Status: ${JSON.stringify(status)}`,
    "",
    ...entries.map((e) => `${e.at} ${{ in: "<<", out: ">>", info: "--" }[e.kind]} ${e.port ? ":" + e.port : ""} ${e.peer ?? ""} ${e.text}`),
  ].join("\n");
  try {
    await navigator.clipboard.writeText(text);
    $("#copy").textContent = "Copied";
  } catch {
    $("#copy").textContent = "Copy failed - use the log file";
  }
  setTimeout(() => ($("#copy").textContent = "Copy all"), 2000);
});

// Send to Claude: the app files a report (electron/reporter.mjs) with this
// log and everything else it knows. In a browser there's no app to hold the
// GitHub token, and the server says so.
$("#send-report").addEventListener("click", async () => {
  const btn = $("#send-report");
  const out = $("#report-result");
  btn.disabled = true;
  out.className = "small";
  out.textContent = "Sending...";
  try {
    const res = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: $("#report-note").value }),
    });
    const r = await res.json().catch(() => ({}));
    if (r.ok) {
      out.textContent = `Sent as report #${r.number}. Thank you!`;
      out.className = "small good";
      $("#report-note").value = "";
    } else if (r.queued) {
      // No internet just now: the app keeps it and sends it by itself, so
      // the box is cleared rather than inviting a second copy.
      out.textContent = r.error ?? "Saved - it will be sent by itself when GitHub can be reached.";
      out.className = "small";
      $("#report-note").value = "";
    } else {
      out.textContent = r.error ?? `Couldn't send it (error ${res.status}).`;
      out.className = "small bad";
    }
  } catch {
    out.textContent = "Couldn't reach the A² Golf server - is it still running?";
    out.className = "small bad";
  }
  btn.disabled = false;
});

load();
