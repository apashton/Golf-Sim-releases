// The page that holds the Omni's Bluetooth connection. The Windows app opens
// it in a hidden window and starts the search itself (see electron/main.mjs);
// in Chrome or Edge it can be opened and connected by hand. Shots, state and
// every message go to the local server, which hands them on like any other
// launch monitor's.

import { OmniLink } from "./omnilink.js";
import { hex } from "./omni.js";

const $ = (sel) => document.querySelector(sel);
const params = new URLSearchParams(location.search);
const inApp = params.has("app");
// Opened from the Windows app's own screens (diagnostics), not its hidden
// Bluetooth window: the app already looks after the Omni, so this page only
// shows how that's going. A search from here would compete for the Omni -
// and couldn't pick it, as only the hidden window has the app's picker - and
// its state would overwrite the real link's.
const watchOnly = !inApp && /Electron/i.test(navigator.userAgent);

// This page's own id, with everything it sends: should two pages report
// at once (one the app lost track of, or this page opened by hand as well
// as the app's), the server goes by the one that has the Omni
// (server/omnipages.mjs) rather than each in turn.
const page = Math.random().toString(36).slice(2, 12);

function post(body) {
  if (watchOnly) return Promise.resolve();
  return fetch("/api/omni", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, page }),
  }).catch(() => {});
}

// Opened by hand (not the app's hidden window), the page only speaks for the
// Omni once Connect has been pressed: until then its "not connected" would
// cover up the app's own connection, which may well be connected.
let pressedConnect = false;
const reporting = () => inApp || pressedConnect;

const link = new OmniLink({
  bluetooth: navigator.bluetooth,
  // With the message's own bytes: the server reads them again with the
  // signs in use (server/omnisigns.mjs), and keeps them with the shot.
  onShot: ({ ball, measuredSpin, bytes }) => post({ type: "shot", ball, measuredSpin, hex: bytes && hex(bytes) }),
  onClub: ({ club, bytes, offset, clubCode }) => post({ type: "club", club, hex: bytes && hex(bytes), offset, clubCode }),
  onLog: (direction, text) => post({ type: "log", direction, text }),
  // A message it doesn't understand, with its bytes, for the log.
  onUnknown: ({ bytes, reason }) => bytes && post({ type: "unknown", hex: hex(bytes), reason }),
  onState: (s) => {
    $("#omni-state").textContent = s.message;
    $("#omni-detail").textContent = [
      s.name,
      s.battery !== null && `battery ${s.battery}%`,
      s.state === "connected" && (s.armed ? "armed" : "not armed"),
    ]
      .filter(Boolean)
      .join(" - ");
    if (reporting()) post({ type: "state", state: s });
  },
});

// Tells the server every few seconds that this page is still here, so a
// closed page doesn't leave the Omni showing as connected.
setInterval(() => reporting() && post({ type: "state", state: link.state }), 5000);

// The club in hand, once the sim has picked one: the Omni is told whenever it
// changes, as GSPro's connector tells it - the putter is what switches it
// into putting mode. In the app, the app passes it on (omniSetClub, below);
// a page opened by hand hears it from the server's status.
if (!inApp && !watchOnly && navigator.bluetooth) {
  const events = new EventSource("/events");
  events.addEventListener("status", (e) => {
    try {
      const { club, clubChosen } = JSON.parse(e.data);
      if (clubChosen && typeof club === "string") link.setClub(club);
    } catch {
      // Not a status it can read; the next one will do.
    }
  });
}

if (watchOnly) {
  for (const id of ["#omni-connect", "#omni-stop"]) $(id).disabled = true;
  const show = async () => {
    try {
      const s = await (await fetch("/api/status")).json();
      const o = s.omni;
      $("#omni-state").textContent = o ? o.message || o.state : "Bluetooth is off in the menu (M, Launch monitor)";
      $("#omni-detail").textContent = [
        o?.name,
        Number.isFinite(o?.battery) && `battery ${o.battery}%`,
        o?.state === "connected" && (o.armed ? "armed" : "not armed"),
        "A² Golf connects by itself; to choose the Omni by hand: Menu (M) - Launch monitor - This is my Omni",
      ]
        .filter(Boolean)
        .join(" - ");
    } catch {
      // Try again next time.
    }
  };
  show();
  setInterval(show, 2000);
} else if (!navigator.bluetooth) {
  link.setState({ state: "unavailable", message: "This browser can't use Bluetooth - use the Windows app, Chrome or Edge" });
  $("#omni-connect").disabled = true;
} else link.setState({ state: "idle", message: inApp ? "Starting..." : "Press Connect to find the Omni" });

$("#omni-connect").addEventListener("click", () => {
  pressedConnect = true;
  link.stopped = false;
  link.scan();
});
$("#omni-stop").addEventListener("click", () => link.stop());

// For the app, which searches on the page's behalf (a search needs a click in
// a browser; the app can supply one).
window.omniWantsScan = () => !!navigator.bluetooth && link.wantsScan;
window.omniScan = () => link.scan();
window.omniStop = () => link.stop();
// The app's recovery after a long time without the Omni (electron/omnirecovery.mjs).
window.omniReconnectKnown = () => link.reconnectKnown();
window.omniSetClub = (club) => link.setClub(club);
