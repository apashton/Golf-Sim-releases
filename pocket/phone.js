// The Android test app's Phone check (phone.html): what this phone and its
// web view can do (the facts docs/ANDROID-PLAN.md's step 0 asks), the Omni
// through the app's Bluetooth plugin - the devices heard, and the game's own
// link to it (omnilink.js over sim/blebridge.mjs) - a game controller's
// buttons, and what the game kept from playing (the Omni's log and its last
// errors, pocket.mjs). "Copy the report" copies all of it as text.

import { bluetoothFrom, isOmniResult } from "../sim/blebridge.mjs";
import { OmniLink } from "../omnilink.js";
import { hex } from "../omni.js";

const $ = (s) => document.querySelector(s);
const facts = [];
const bleLines = [];
const shotLines = [];
let padLine = "";

function stored(key) {
  try {
    return JSON.parse(localStorage.getItem(`pocket.${key}`) ?? "null");
  } catch {
    return null;
  }
}

function addFact(name, value, good = null) {
  facts.push([name, String(value)]);
  const tr = document.createElement("tr");
  const td = (text, cls) => Object.assign(document.createElement("td"), { textContent: text, className: cls ?? "" });
  tr.append(td(name), td(String(value), good === true ? "yes" : good === false ? "no" : ""));
  $("#facts").append(tr);
}

function bleLog(text) {
  const line = `${new Date().toLocaleTimeString()} ${text}`;
  bleLines.push(line);
  if (bleLines.length > 300) bleLines.shift();
  const el = $("#ble-log");
  el.textContent = bleLines.join("\n");
  el.scrollTop = el.scrollHeight;
}

// ---- This phone ------------------------------------------------------------

function glFacts() {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    addFact("WebGL 2 (the game needs it)", "no", false);
    return;
  }
  const dbg = gl.getExtension("WEBGL_debug_renderer_info");
  addFact("WebGL 2 (the game needs it)", "yes", true);
  addFact("Graphics chip", dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
  addFact("Biggest texture", gl.getParameter(gl.MAX_TEXTURE_SIZE));
  addFact("Anti-aliasing samples", gl.getParameter(gl.MAX_SAMPLES));
  // How finely it tells near from far, and works out the picture: a phone
  // drawing the grass's layers (a centimetre apart) through each other in
  // straight-edged patches, where a PC doesn't, shows here (the owner, 25
  // October 2026: dark patches by a bunker on Golf Sim Links' 2nd).
  addFact("Screen depth", `${gl.getParameter(gl.DEPTH_BITS)} bits`);
  const high = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
  addFact("High precision in shaders", high?.precision ? `yes (${high.precision} bits)` : "no", !!high?.precision);
  const buffer = !!(gl.getExtension("EXT_color_buffer_half_float") || gl.getExtension("EXT_color_buffer_float"));
  addFact("Picture buffer (half floats)", buffer ? "yes" : "no - drawn straight to the screen", buffer);
  gl.getExtension("WEBGL_lose_context")?.loseContext();
}

async function phoneFacts() {
  const app = await fetch("/pocket/app.json")
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}));
  const ua = navigator.userAgent;
  addFact("Test app", `${app.version ?? "?"}${app.commit ? ` (${app.commit})` : ""}${app.built ? `, built ${app.built.slice(0, 16).replace("T", " ")}` : ""}`);
  addFact("Android", /Android ([\d.]+)/.exec(ua)?.[1] ?? "?");
  addFact("Phone", /Android [\d.]+; ([^;)]+)/.exec(ua)?.[1]?.trim() ?? "?");
  addFact("Web view", /Chrome\/([\d.]+)/.exec(ua)?.[1] ?? ua);
  const dpr = window.devicePixelRatio || 1;
  addFact("Screen", `${screen.width} × ${screen.height} (× ${dpr.toFixed(2)}: ${Math.round(screen.width * dpr)} × ${Math.round(screen.height * dpr)} pixels)`);
  addFact("Page now", `${innerWidth} × ${innerHeight}, ${screen.orientation?.type ?? "?"}`);
  addFact("Cores", navigator.hardwareConcurrency ?? "?");
  addFact("Memory", navigator.deviceMemory ? `about ${navigator.deviceMemory} GB` : "not said");
  glFacts();
  addFact("WebGPU", navigator.gpu ? "there" : "not there");
  addFact("Web Bluetooth in the web view", navigator.bluetooth ? "yes" : "no (the app's plugin is used)", navigator.bluetooth ? true : null);
  addFact("Bluetooth plugin", (await plugin()) ? "yes" : "no - not in the app?", !!(await plugin()));
  addFact("Game controllers (Gamepad API)", typeof navigator.getGamepads === "function" ? "yes" : "no", typeof navigator.getGamepads === "function");
  addFact("Touch points", navigator.maxTouchPoints ?? 0);
  addFact("Screen kept awake (Wake Lock)", "wakeLock" in navigator ? "yes" : "no (the app keeps it on)");
  addFact("Voice (speech recognition)", "webkitSpeechRecognition" in window || "SpeechRecognition" in window ? "yes" : "no");
  try {
    const est = await navigator.storage?.estimate?.();
    if (est) addFact("Storage", `${(est.usage / 1e6).toFixed(1)} MB used of ${(est.quota / 1e9).toFixed(1)} GB`);
  } catch {
    // Not said.
  }
  addFact("Refresh rate", `${await refreshRate()} a second`);
}

// Frames a second the screen shows (60, 90, 120...).
function refreshRate() {
  return new Promise((resolve) => {
    let n = 0;
    let start = 0;
    const step = (t) => {
      if (!start) start = t;
      n++;
      if (t - start >= 1000) resolve(Math.round((n - 1) / ((t - start) / 1000)));
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

// ---- The Omni --------------------------------------------------------------

let pluginLoad = null;
function plugin() {
  pluginLoad ??= (async () => {
    if (window.PocketBle) return window.PocketBle;
    if (!window.Capacitor?.isNativePlatform?.()) return null;
    try {
      await import("/pocket/ble.js");
    } catch (err) {
      bleLog(`the Bluetooth plugin didn't load: ${err?.message ?? err}`);
      return null;
    }
    return window.PocketBle ?? null;
  })();
  return pluginLoad;
}

async function scan() {
  const ble = await plugin();
  if (!ble) return bleLog("No Bluetooth plugin here (only in the app)");
  $("#scan").disabled = true;
  try {
    await ble.initialize({ androidNeverForLocation: true });
    bleLog(`Bluetooth on: ${await ble.isEnabled()}`);
    const seen = new Map();
    await ble.requestLEScan({ allowDuplicates: false }, (r) => {
      const id = r?.device?.deviceId;
      if (!id || seen.has(id)) return;
      seen.set(id, r);
      bleLog(`heard ${r.localName ?? r.device.name ?? "(no name)"} ${id}${Number.isFinite(r.rssi) ? ` ${r.rssi} dBm` : ""}${isOmniResult(r) ? " - an Omni" : ""}`);
    });
    bleLog("looking for 15 s...");
    await new Promise((r) => setTimeout(r, 15000));
    await ble.stopLEScan();
    const omnis = [...seen.values()].filter(isOmniResult).length;
    bleLog(`done: ${seen.size} device${seen.size === 1 ? "" : "s"} heard, ${omnis} Omni${omnis === 1 ? "" : "s"}`);
  } catch (err) {
    bleLog(`search failed: ${err?.message ?? err}`);
  } finally {
    $("#scan").disabled = false;
  }
}

let link = null;
async function connect() {
  const ble = await plugin();
  if (!ble) return bleLog("No Bluetooth plugin here (only in the app)");
  link?.stop();
  link = new OmniLink({
    bluetooth: bluetoothFrom(ble, { onLog: (t) => bleLog(t) }),
    onShot: ({ ball, measuredSpin, bytes }) => {
      shotLines.push(
        `${new Date().toLocaleTimeString()} ${ball.speedMph.toFixed(1)} mph, launch ${ball.vla.toFixed(1)}°, direction ${ball.hla.toFixed(1)}°, spin ${Math.round(ball.totalSpin)} at ${ball.spinAxis.toFixed(1)}°${measuredSpin ? "" : " (spin estimated)"} [${bytes ? hex(bytes) : ""}]`,
      );
      $("#shots").textContent = shotLines.join("\n");
    },
    onClub: ({ club }) => {
      shotLines.push(`  club data ${JSON.stringify(club)}`);
      $("#shots").textContent = shotLines.join("\n");
    },
    onState: (s) => {
      $("#omni-state").textContent = [s.message, s.name, Number.isFinite(s.battery) && `battery ${s.battery}%`, s.state === "connected" && (s.armed ? "armed" : "not armed")].filter(Boolean).join(" - ");
    },
    onLog: (direction, text) => bleLog(`${direction === "in" ? "<" : direction === "out" ? ">" : "-"} ${text}`),
    onUnknown: ({ bytes, reason }) => bleLog(`not understood: ${reason}${bytes ? ` (${hex(bytes)})` : ""}`),
  });
  link.setClub("7I");
  const ok = await link.scan();
  if (!ok) bleLog("no Omni connected this time - is it on, and no other app using it?");
}

// ---- Controllers -------------------------------------------------------------

function pads() {
  const list = [...(navigator.getGamepads?.() ?? [])].filter(Boolean);
  const text = list.length
    ? list
        .map((p) => {
          const down = p.buttons.map((b, i) => (b.pressed ? i : null)).filter((i) => i !== null);
          const axes = p.axes.map((a) => a.toFixed(2)).join(" ");
          return `${p.id} (${p.mapping || "no standard mapping"})\n  buttons down: ${down.join(", ") || "none"}\n  sticks: ${axes}`;
        })
        .join("\n")
    : "None yet.";
  if (text !== padLine) {
    padLine = text;
    $("#pads").textContent = text;
  }
  requestAnimationFrame(pads);
}

// ---- From the game -----------------------------------------------------------

function fromGame() {
  const log = stored("log") ?? [];
  $("#game-log").textContent = log.length ? log.map((l) => `${l.at.slice(11, 19)} ${l.direction} ${l.text}`).join("\n") : "Nothing from the Omni yet.";
  const errors = stored("errors") ?? [];
  $("#game-errors").textContent = errors.length ? errors.map((e) => `${e.at?.slice(0, 19) ?? ""} ${e.message ?? JSON.stringify(e)}${e.stack ? `\n  ${String(e.stack).split("\n").slice(0, 3).join("\n  ")}` : ""}`).join("\n") : "No errors from the game.";
}

// ---- The report ----------------------------------------------------------------

function reportText() {
  return [
    "A² Golf Android test - phone check",
    ...facts.map(([k, v]) => `${k}: ${v}`),
    "",
    "Bluetooth:",
    ...bleLines,
    "",
    "Shots:",
    ...shotLines,
    "",
    "Controller:",
    padLine,
    "",
    "From the game - Omni:",
    $("#game-log").textContent,
    "",
    "From the game - errors:",
    $("#game-errors").textContent,
  ].join("\n");
}

async function copy() {
  const text = reportText();
  let ok = false;
  try {
    await navigator.clipboard.writeText(text);
    ok = true;
  } catch {
    const area = Object.assign(document.createElement("textarea"), { value: text });
    document.body.append(area);
    area.select();
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    area.remove();
  }
  $("#copied").textContent = ok ? "Copied - paste it into a message to send it back." : "Couldn't copy it: press and hold on the text above to copy it instead.";
}

$("#scan").addEventListener("click", scan);
$("#connect").addEventListener("click", connect);
$("#letgo").addEventListener("click", () => link?.stop());
$("#copy").addEventListener("click", copy);
fromGame();
pads();
phoneFacts();
