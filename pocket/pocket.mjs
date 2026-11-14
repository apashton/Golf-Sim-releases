// The pocket server set up in the Android app's game page (start.js asks
// for it): sim/pocketserver.mjs with the phone's own storage, the courses
// and sounds the app comes with (tools/androidweb.mjs writes them under
// /pocket/), the courses kept on the device (coursestore.mjs: friends',
// and the web version's own from its designer page, which starts with
// this too), and the Omni over the app's Bluetooth plugin, searched for
// and connected by itself as the Windows app does.
//
// The Omni's log is kept in the page's storage too (and the pocket server
// keeps the game's errors there), for the Phone check page (phone.html) to
// show and copy.

import { PocketServer } from "../sim/pocketserver.mjs";
import { PocketBakes, appStamp } from "../sim/pocketbakes.mjs";
import { bakeStorage } from "./bakestore.mjs";
import { KeptCourses, memoryCourses } from "../sim/coursekeep.mjs";
import { courseStorage } from "./coursestore.mjs";
import { DEFAULT_RELAY } from "../sim/netgame.mjs";
import { PhoneLink } from "../net/devicelink.mjs";
import { deviceName } from "../sim/devicelink.mjs";
import { phoneOutbox } from "../sim/phonesync.mjs";
import { readProfiles } from "../sim/profiles.mjs";
import { loadSetting } from "../util.js";
import { bluetoothFrom } from "../sim/blebridge.mjs";
import { OmniLink } from "../omnilink.js";
import { omniTry, OMNI_RETRY } from "../sim/omniretry.mjs";
import { hex } from "../omni.js";

const PREFIX = "pocket.";
// How often the Omni is looked for while it isn't found: every few seconds
// at first, then less often (a search keeps the phone's radio busy).

// The page's own storage, as the pocket server's store.
export function pageStore(prefix = PREFIX) {
  return {
    get(key) {
      try {
        const v = localStorage.getItem(prefix + key);
        return v == null ? null : JSON.parse(v);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        if (value == null) localStorage.removeItem(prefix + key);
        else localStorage.setItem(prefix + key, JSON.stringify(value));
      } catch {
        // Full, or not allowed: not kept this time.
      }
    },
  };
}

async function readJson(url, fallback) {
  try {
    const r = await fetch(url);
    return r.ok ? await r.json() : fallback;
  } catch {
    return fallback;
  }
}

// A request's JSON body, or null.
async function bodyOf(input, init) {
  let text = init?.body;
  if (text == null && input instanceof Request) text = await input.clone().text();
  if (typeof text !== "string" || !text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// A request's bytes (a kept hole's: look/bake.js saveBake), or null.
async function bytesOf(input, init) {
  const body = init?.body ?? (input instanceof Request ? await input.clone().arrayBuffer() : null);
  if (body instanceof ArrayBuffer) return body;
  if (ArrayBuffer.isView(body)) return body.byteOffset === 0 && body.byteLength === body.buffer.byteLength ? body.buffer : body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength);
  if (body instanceof Blob) return await body.arrayBuffer();
  return null;
}

// The app's Bluetooth plugin (ble.js, built with the app), if this is the
// app: null in a browser.
async function blePlugin() {
  if (window.PocketBle) return window.PocketBle;
  if (!window.Capacitor?.isNativePlatform?.()) return null;
  try {
    await import("/pocket/ble.js");
  } catch {
    return null;
  }
  return window.PocketBle ?? null;
}

export async function start() {
  const store = pageStore();
  const [list, sounds, app, courseDb] = await Promise.all([readJson("/pocket/courses/index.json", []), readJson("/pocket/sounds.json", null), readJson("/pocket/app.json", {}), courseStorage()]);
  // The courses kept on this device (friends', and the web version's own
  // from its designer): in the page's IndexedDB, or only while the page is
  // open where there's none.
  const kept = new KeptCourses({ storage: courseDb ?? memoryCourses() });
  const server = new PocketServer({
    kept,
    // (The courses made here in the player's Google Drive, if they turn it
    // on: the web version, where the page can ask Google - coursedrivebox.js.)
    driveCourses: !!window.a2web,
    store,
    courses: { list, get: (id) => readJson(`/pocket/courses/${encodeURIComponent(id)}.json`, null) },
    sounds,
    appVersion: app.version ?? null,
    relay: DEFAULT_RELAY,
    // Google's own sign-in button in the web version; in the phone app
    // (whose own page Google refuses) the phone's browser and back by the
    // app's link (sim/phonegoogle.mjs).
    googleWay: window.a2web ? "idToken" : window.Capacitor?.isNativePlatform?.() ? "browser" : null,
  });
  // Another page of the game saved or deleted a course (the designer's, to
  // the game's): this page's list again.
  courseDb?.onChange(() => kept.reload().then(() => server.broadcast("courses", {})));
  startOmni(server, store);
  const link = startLink(store);
  // Holes kept once built, in the phone's own storage (none where it can't
  // be had: built afresh each time, as before).
  const storage = await bakeStorage();
  const bakes = new PocketBakes(storage, { stamp: storage ? appStamp(app) : null });
  return {
    server,
    bakes,
    async fetch(url, input, init) {
      const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
      if (url.pathname === "/api/bakes" || url.pathname.startsWith("/api/bakes/")) {
        const body = method === "PUT" ? await bytesOf(input, init) : null;
        const r = await bakes.handle({ method, path: url.pathname, query: url.searchParams, body });
        if (r.bytes) return new Response(r.bytes, { status: r.status, headers: { "Content-Type": "application/octet-stream" } });
        return new Response(JSON.stringify(r.json), { status: r.status, headers: { "Content-Type": "application/json" } });
      }
      const body = method === "GET" || method === "HEAD" ? null : await bodyOf(input, init);
      const { status, json } = await server.handle({ method, path: url.pathname, query: url.searchParams, body });
      // A stats write kept for the PC: to it soon, if linked.
      if (method === "POST" && url.pathname.startsWith("/api/stats/")) link.soon();
      if (json === undefined || status === 204) return new Response(null, { status });
      return new Response(JSON.stringify(json), { status, headers: { "Content-Type": "application/json" } });
    },
    subscribe: (stream, send) => server.subscribe(stream, send),
  };
}

// The Omni, through the app's Bluetooth plugin: looked for until it's
// found, connected, told the club in hand; its shots and club data to the
// pocket server, its state to the top bar, its log kept. Only while the
// page says to look (the play mode: a launch monitor, not the touch
// screen - sim/playmode.mjs, POST /api/omni-search); let go of otherwise.
async function startOmni(server, store) {
  const ble = await blePlugin();
  if (!ble) return;
  const log = (direction, text) => server.addLog(direction, text);
  const link = new OmniLink({
    bluetooth: bluetoothFrom(ble, { onLog: (text) => log("info", text) }),
    onShot: ({ ball, measuredSpin, bytes }) => server.omniShot({ ball, measuredSpin, hex: bytes && hex(bytes) }),
    onClub: ({ club }) => server.omniClub({ club }),
    onState: (s) => server.omniState(s),
    onLog: log,
    onUnknown: ({ bytes, reason }) => bytes && log("info", `not understood: ${reason} (${hex(bytes)})`),
  });
  server.onClub = (club) => link.setClub(club);
  if (server.state.clubChosen) link.setClub(server.state.club);
  // (Searches, and straight to an Omni had before in turn with them:
  // sim/omniretry.mjs.)
  let failed = 0;
  let last = 0;
  const search = async (resumed = false) => {
    if (!server.omniSearch) return;
    const now = Date.now();
    const what = omniTry({ wantsScan: link.wantsScan, known: !!link.lastDevice, failed, sinceLast: now - last, resumed });
    if (!what) return;
    last = now;
    const ok = what === "known" ? /^connected/.test(await link.reconnectKnown()) : await link.scan();
    failed = ok ? 0 : failed + 1;
  };
  const looking = (on) => {
    if (!on) return link.stop();
    link.stopped = false;
    failed = 0;
    last = 0;
    link.setState({ state: "searching", message: "Looking for the Omni..." });
    search();
  };
  server.onOmniSearch = looking;
  // (Told before the plugin had loaded: looked for now.)
  link.stopped = !server.omniSearch;
  if (server.omniSearch) looking(true);
  setInterval(() => {
    // An Omni left be for going quiet tried again now and then.
    if (server.omniSearch && link.quietFor() > OMNI_RETRY.quietAgain) link.wake();
    search();
  }, OMNI_RETRY.every);
  // Back in front (the phone woken, the app switched back to): tried
  // again straight away, the slow searches started afresh.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden || !server.omniSearch) return;
    failed = 0;
    link.wake();
    search(true);
  });
  // The log, for the Phone check page (now and then, not every line).
  let saved = 0;
  setInterval(() => {
    if (server.logged === saved) return;
    saved = server.logged;
    store.set("log", server.log.slice(-200));
  }, 5_000);
}

// Linked to the PC (net/devicelink.mjs; My stats, link.html): in step by
// itself - soon after the app starts, when it comes back to the front,
// every quarter of an hour while it's open, and a couple of minutes after
// a shot or a game is kept. What comes down: the PC's players to the game
// page (app.js PagePhoneLink, "pocket-linkdown").
export const LINK_SOON_MS = 2 * 60000;
export const LINK_EVERY_MS = 15 * 60000;
function startLink(store) {
  const name = () => deviceName(readProfiles(loadSetting("profiles", null), loadSetting("course", {}).players).list, "phone", "A² Golf phone");
  const link = new PhoneLink({
    store,
    outbox: phoneOutbox(store),
    relay: DEFAULT_RELAY,
    name,
    onDown: (down) => window.dispatchEvent(new CustomEvent("pocket-linkdown", { detail: down })),
  });
  const sync = () => link.linked && link.sync().catch(() => null);
  let timer = null;
  const soon = () => {
    if (!link.linked) return;
    clearTimeout(timer);
    timer = setTimeout(sync, LINK_SOON_MS);
  };
  setTimeout(sync, 15000);
  setInterval(sync, LINK_EVERY_MS);
  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && sync());
  return { soon, sync, link };
}
