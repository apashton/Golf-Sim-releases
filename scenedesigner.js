// The scene designer page (the owner: "I'd like to be able to design the
// records scenes etc outside the game to then plug in ... the ability to
// setup scenes that we can then have pre built into the game, rather than
// me doing it in the simulator bay"): the game's own Recording panel
// (videopanel.js) and picture (compositor.js) on a web page of their own,
// with no game, server or install - a game picture to design over, two
// sample cameras, and a made-up 7 iron hit again and again
// (sim/scenesamples.mjs), so every layer shows as it would in the game.
// Scenes are kept in the browser as the game keeps them, and saved to a
// scenes file (sim/scenefile.mjs) to bring into the game's Recording panel
// (Scenes, Bring in a scenes file) - or to send, to be built into the game
// (public/scenes).
//
// Built into one page by tools/scenedesigner.mjs, which puts its pictures,
// the sample hole, the course and the ready-made scenes in the page as JSON
// (#designer-data). Published as a claude.ai page, a file is saved through
// the page's downloads (its own download is blocked there).

import { VideoRecorder } from "./videorec.js";
import { VideoPanel } from "./videopanel.js";
import { sampleInfo } from "./sim/scenesamples.mjs";
import { readSceneFile } from "./sim/scenefile.mjs";
import { esc, loadSetting, saveSetting } from "./util.js";

const data = JSON.parse(document.getElementById("designer-data")?.textContent || "{}");
const pictures = Array.isArray(data.pictures) ? data.pictures : [];

// ---- The game's picture: one of the game's own, or one of yours ----------------

const game = document.createElement("canvas");
game.width = 1920;
game.height = 1080;
// Kept to its shape, filling the picture (cut at the sides or the top).
function showPicture(img) {
  const g = game.getContext("2d");
  const k = Math.max(game.width / img.width, game.height / img.height);
  const w = img.width * k;
  const h = img.height * k;
  g.fillStyle = "#0f1a12";
  g.fillRect(0, 0, game.width, game.height);
  g.drawImage(img, (game.width - w) / 2, (game.height - h) / 2, w, h);
}
function loadPicture(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      showPicture(img);
      resolve();
    };
    img.onerror = () => reject(new Error("That picture couldn't be opened"));
    img.src = src;
  });
}

// ---- Sample cameras ---------------------------------------------------------------------

// Each a moving picture of its own (a still one gives the video nothing to
// show): its name, and a running time as a camera's.
const SAMPLE_CAMS = [
  { id: "sample-face", name: "Face on", tint: "#24384a" },
  { id: "sample-dtl", name: "Down the line", tint: "#3a2f45" },
];
const camStreams = new Map();
const camCanvases = SAMPLE_CAMS.map((cam) => {
  const c = document.createElement("canvas");
  c.width = 640;
  c.height = 360;
  return { cam, c };
});
const started = performance.now();
function drawCameras() {
  const secs = Math.floor((performance.now() - started) / 1000);
  const time = `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;
  for (const { cam, c } of camCanvases) {
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 0, c.height);
    grad.addColorStop(0, cam.tint);
    grad.addColorStop(0.62, "#101a14");
    grad.addColorStop(0.62, "#1e5a2c");
    grad.addColorStop(1, "#163f20");
    g.fillStyle = grad;
    g.fillRect(0, 0, c.width, c.height);
    // The mat and the ball.
    g.fillStyle = "#2f7a3c";
    g.fillRect(c.width * 0.3, c.height * 0.7, c.width * 0.4, c.height * 0.16);
    g.fillStyle = "#f4f4f0";
    g.beginPath();
    g.arc(c.width * 0.5, c.height * 0.76, 6, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#e7efe8";
    g.font = "700 30px system-ui, sans-serif";
    g.textAlign = "center";
    g.fillText(`${cam.name} camera`, c.width / 2, c.height * 0.4);
    g.font = "400 18px system-ui, sans-serif";
    g.fillStyle = "#93a897";
    g.fillText("A sample - in the game, your camera's picture", c.width / 2, c.height * 0.4 + 30);
    g.textAlign = "left";
    g.font = "600 16px ui-monospace, monospace";
    g.fillStyle = "#e7efe8";
    g.fillText(time, 14, 26);
  }
}
drawCameras();
for (const { cam, c } of camCanvases) {
  try {
    camStreams.set(cam.id, c.captureStream(10));
  } catch {
    // No moving pictures here: the cameras' places say so.
  }
}
setInterval(drawCameras, 250);
const cameras = {
  cams: SAMPLE_CAMS.map(({ id, name }) => ({ id, name })),
  state: (id) => ({ stream: camStreams.get(id) ?? null }),
  onChange: () => () => {},
  settings: { mic: null, replay: false },
  micError: null,
  media: null,
  listMics: async () => [],
  setMic() {},
  closeMic() {},
};

// ---- The panel ------------------------------------------------------------------------

const toastEl = document.createElement("div");
toastEl.className = "sd-toast";
toastEl.setAttribute("role", "status");
document.body.appendChild(toastEl);
let toastTimer = null;
function toast(text, ms = 2500) {
  toastEl.textContent = text;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), ms);
}

// No recordings here (there's no server to keep them).
class DesignerRecorder extends VideoRecorder {
  loadLibrary() {
    this.library = null;
    return Promise.resolve(null);
  }
}

const samples = sampleInfo({ hole: data.hole ?? null, course: data.course ?? null, start: performance.now() });
const video = new DesignerRecorder({ gameCanvas: game, cameras, replay: { setPaused() {} }, audio: null, info: () => samples(performance.now()), view: null, toast });

// Saved through claude.ai's downloads where it's a page there; the
// browser's own download where the page is opened by itself.
const framed = typeof window.claude?.use === "function";
const downloads = framed ? window.claude.use("downloads").catch(() => null) : Promise.resolve(null);
async function save(name, text) {
  const d = await downloads;
  if (d) {
    try {
      await d.save({ filename: name, data: text });
      return true;
    } catch (err) {
      if (err?.code === "declined") return false;
      if (err?.code === "rate_limited") {
        toast("A save is already waiting for your answer", 3000);
        return false;
      }
    }
  }
  if (framed) {
    showText(name, text);
    return false;
  }
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return true;
}
// Where a file can't be saved: its words, to copy into a file of that name.
function showText(name, text) {
  const d = document.createElement("dialog");
  d.className = "small-dialog sd-text";
  d.innerHTML = `<form method="dialog">
    <h3>Save it by hand</h3>
    <p class="muted">Saving files isn't allowed here. Copy this into a new text file named <b>${esc(name)}</b>, then bring that file into the game.</p>
    <textarea id="sd-file-text" readonly rows="10" spellcheck="false">${esc(text)}</textarea>
    <div class="dialog-buttons"><button type="button" data-copy class="primary">Copy</button><button value="close">Close</button></div>
  </form>`;
  const area = d.querySelector("textarea");
  d.querySelector("[data-copy]").addEventListener("click", () => {
    navigator.clipboard
      ?.writeText(text)
      .then(() => toast("Copied", 1500))
      .catch(() => {
        area.focus();
        area.select();
      });
  });
  d.addEventListener("close", () => d.remove());
  document.body.appendChild(d);
  d.showModal();
}

const panel = new VideoPanel({
  video,
  cameras,
  toast,
  save,
  // The ready-made scenes, carried in the page.
  fetchText: async (path) => {
    const text = data.scenes?.[path.replace(/^scenes\//, "")];
    if (typeof text !== "string") throw new Error(`${path} isn't in the page`);
    return text;
  },
});

// The panel made the designer's: its name, the game picture to design
// over, the files, and how it's used - no recording, recordings or the
// game's own scene settings.
panel.el.classList.add("scene-designer");
panel.el.querySelector(".vp-head h2").textContent = "Scene designer";
const pictureOpts = pictures.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("");
panel.el.querySelector(".vp-head h2").insertAdjacentHTML(
  "afterend",
  `<label class="sd-picture">Game picture <select id="sd-picture">${pictureOpts}<option value="own">Your own picture...</option></select></label>
  <input type="file" id="sd-picture-file" accept="image/*" hidden>
  <span class="sd-files">
    <button data-act="import-scenes" title="A scenes file saved here, or from the game's Recording panel">Open a scenes file...</button>
    <button data-act="export-scene" class="primary" title="The scene picked in Layout, on its own">Save this scene</button>
    <button data-act="export-scenes" title="Every scene here, in one file">Save all scenes</button>
  </span>
  <button type="button" id="sd-how">How it works</button>`,
);
panel.el.querySelector(".vp-head").insertAdjacentHTML(
  "afterend",
  `<p class="sd-line muted small">Your scenes stay in this browser. To use them in A² Golf, save them to a file, then in the game open Recording, then Scenes, and choose Bring in a scenes file. Drop a scenes file or a picture anywhere here to open it.</p>`,
);

const pickEl = document.getElementById("sd-picture");
const fileEl = document.getElementById("sd-picture-file");
let shown = pictures[0]?.id ?? null;
async function pickPicture(id) {
  const p = pictures.find((x) => x.id === id) ?? pictures[0];
  if (!p) return;
  shown = p.id;
  pickEl.value = p.id;
  await loadPicture(p.src).catch(() => {});
  saveSetting("sceneDesignerPicture", p.id);
}
async function ownPicture(file) {
  if (!file || !/^image\//.test(file.type)) return toast("That isn't a picture", 2500);
  const url = URL.createObjectURL(file);
  try {
    await loadPicture(url);
    pickEl.value = "own";
    shown = "own";
    toast("Your picture is in - it isn't kept, or saved with the scenes", 3500);
  } catch (err) {
    toast(err.message, 3000);
    pickEl.value = shown ?? "";
  } finally {
    URL.revokeObjectURL(url);
  }
}
pickEl.addEventListener("change", (e) => {
  e.stopPropagation();
  if (pickEl.value === "own") {
    pickEl.value = shown ?? "";
    return fileEl.click();
  }
  pickPicture(pickEl.value);
});
fileEl.addEventListener("change", (e) => {
  e.stopPropagation();
  const f = fileEl.files?.[0];
  fileEl.value = "";
  ownPicture(f);
});
pickPicture(loadSetting("sceneDesignerPicture", null));

// How it's used, step by step.
document.getElementById("sd-how").addEventListener("click", () => {
  const d = document.createElement("dialog");
  d.className = "small-dialog sd-how";
  d.innerHTML = `<form method="dialog">
    <h3>Making scenes for A² Golf</h3>
    <ol>
      <li><b>Design.</b> Add pieces from the list on the left, drag them into place on the picture (their edges lock onto each other's), and set each one's look, or type its size, on the right. Shift + click picks several, to line them up, size them alike, butt them together or group them. A layout is a scene: Save as new makes another. The buttons over the picture show it before the shot, in flight and after it lands; Live plays a sample 7 iron again and again.</li>
      <li><b>Save.</b> Save this scene, or all of them, to a file. They also stay in this browser for next time.</li>
      <li><b>Bring it into the game.</b> In A² Golf open Recording, then Scenes, and choose Bring in a scenes file. Each scene comes in as a layout of its own, and your others stay as they were.</li>
      <li><b>Built into the game.</b> Send the file to be added to the game's ready-made scenes. They then sit beside the presets on every PC, after the next update.</li>
    </ol>
    <p class="muted small">The cameras here are samples: the game puts each of yours in its place. The game picture is one of the game's own, or one of yours (it isn't kept).</p>
    <div class="dialog-buttons"><button value="close" class="primary">Got it</button></div>
  </form>`;
  d.addEventListener("close", () => d.remove());
  d.addEventListener("click", (e) => e.target === d && d.close());
  document.body.appendChild(d);
  d.showModal();
});

// A file dropped anywhere: scenes brought in, a picture designed over.
document.addEventListener("dragover", (e) => {
  if ([...(e.dataTransfer?.types ?? [])].includes("Files")) e.preventDefault();
});
document.addEventListener("drop", (e) => {
  const f = e.dataTransfer?.files?.[0];
  if (!f) return;
  e.preventDefault();
  if (/^image\//.test(f.type)) return ownPicture(f);
  f.text()
    .then((text) => panel.bringIn(readSceneFile(text)))
    .catch((err) => toast(err.message, 3500));
});

// The arrows move the picked layer (Shift: size it), as in the game.
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" || document.querySelector("dialog[open]")) return;
  panel.key(e);
});

panel.show(true);
(function loop(now) {
  video.frame(now);
  requestAnimationFrame(loop);
})(performance.now());
