// The Recording panel: the layout designer - a 16:9 picture of the
// recording, live, with a frame over each layer to drag and size (at most
// four cameras) - how it's recorded (size, frame rate, the sound), and the
// recordings kept: how much of their allowance is used, what the next one
// would push out, and a list to mark one Keep, delete one, or open the
// folder. Opened
// from the Recording button in the controls window's top bar (next to the
// camera button), or the menu's Cameras & video page. It opens in the
// controls window when the screens are separate (app.js moves it there
// with the menus); the picture it shows is drawn in the game window's page
// by the compositor, and copied here a few times a second.
//
// The layout is only for the recording: nothing here changes the
// projector or the controls window. The rules (presets, placing, snapping)
// are sim/videolayout.mjs's.

import { WORD_KINDS, BACKINGS, BACKING_NAMES, BACKING_COLOURS, BACKING_COLOUR_NAMES, COLOURS, COLOUR_NAMES, ALIGNS, ARRANGES, ARRANGE_NAMES, TEXT_SCALE, FIELDS, duplicateLayer } from "./sim/videolayout.mjs";
import { INFO_FIELD_NAMES } from "./sim/videotiles.mjs";
import { WIDGETS, addWidget, FLIGHT_VIEWS, LAYER_KINDS, LAYER_NAMES, TILE_KEYS, CLOCK_SHOWS, OUTPUT_SIZES, OUTPUT_FPS, PRESETS, MAX_RADIUS, MAX_LINE, ZOOM_LIMITS, MAX_SLOTS, MAX_CAMERA_LAYERS, cameraLayers, activeLayout, usePreset, saveAs, removeLayout, setLayer, reorderLayer, addLayer, removeLayer, placeLayer, layerPixels } from "./sim/videolayout.mjs";
import { TILES } from "./sim/videotiles.mjs";
import { WHEN, WHEN_NAMES, shownIn } from "./sim/shotphase.mjs";
import { guideLines, frameLayer, spreadLayers, matchLooks, GUIDES, GUIDE_NAMES, SHORT_KINDS } from "./sim/sceneframe.mjs";
import { chipPicture, drawPalette, guidesHtml, frameButtons, openCleanPreview, PICTURED } from "./scenetools.js";

// A widget's name on its button: a number's is its label.
const widgetName = (w) => w.name ?? TILES[w.extra?.stat]?.label ?? INFO_FIELD_NAMES[w.extra?.field] ?? LAYER_NAMES[w.kind];
const ALIGN_NAMES = { left: "Left", center: "Centre", right: "Right" };
// The layer settings that are numbers.
const NUMBER_OPTS = ["slot", "zoom", "panX", "panY", "radius", "bgAlpha", "textScale", "cols", "outlineWidth", "borderWidth", "textPx", "cornerPx"];
// How near an edge must be dragged to another's to lock onto it: in the
// screen's pixels, however small the picture is drawn.
const LOCK_PX = 10;
// The preview's "show it as" buttons: now, or one time of the shot.
const PREVIEW_PHASES = [
  [null, "Live"],
  ["address", "Before the shot"],
  ["flight", "In flight"],
  ["after", "After it lands"],
];
// A time, in words after "Not shown ...".
const PHASE_WORDS = { address: "before the shot", flight: "while it flies", after: "after it lands" };

import { MIC_MAX, NVENC_SESSIONS, RECORD_WHAT, RECORD_WHAT_NAMES, MONITORS, MONITOR_NAMES, RECORD_FORMATS, RECORD_FORMAT_NAMES, sizeOf } from "./sim/videorec.mjs";
import { LIMIT_GB, savedReplays, replayWords } from "./sim/clips.mjs";
import { changeLimit, sizeText } from "./limits.js";
import { esc, loadSetting, saveSetting } from "./util.js";
import { ask } from "./askbox.js";
import { SHORT_NAME } from "./sim/clips.mjs";
import { MODES, MODE_NAMES, TRANSITIONS, TRANSITION_NAMES, SECONDS } from "./sim/videoscenes.mjs";
import { sceneFile, sceneFileName, readSceneFile, addScenes, addedWords, readyMadeScenes } from "./sim/scenefile.mjs";
import { groupIds, movingIds, groupLayers, ungroupLayers, moveLayers, alignLayers, typedPlace, placeOf, touchingEdges, ALIGN_HOW_NAMES, PLACE_W, PLACE_H } from "./sim/layerplace.mjs";
import { setLayers, changeTargets, MAX_TEXT_PX } from "./sim/layerstyle.mjs";
import { containIn, flowContainers, FILL_HOW, FILL_HOW_NAMES, FILL_START, FILL_MAX } from "./sim/container.mjs";
import { cropDrag, cropAmounts, cropTo, wholePicture } from "./sim/layercrop.mjs";

const EDGES = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
// The designer's pages.
const TABS = [
  ["design", "Design"],
  ["scenes", "Scenes"],
  ["output", "Recording and sound"],
  ["library", "Recordings"],
  ["replays", "Saved replays"],
];
const PREVIEW_MS = 100;

export class VideoPanel {
  // video: the VideoRecorder. cameras: the CameraManager. bridge: the
  // Windows app's (to open the recordings folder), or null. toast(text, ms).
  // record(doc): starts or stops the recording as the Record button does
  // (asking what to record, in this panel's page), else the recorder's own.
  // The scene designer page (scenedesigner.js), which has no game or
  // server: save(fileName, text) -> Promise, a file saved its own way;
  // fetchText(path) -> Promise<text>, the ready-made scenes it carries.
  constructor({ video, cameras, bridge = null, toast = () => {}, record = null, save = null, fetchText = null }) {
    Object.assign(this, { video, cameras, bridge, toast, record, saveFile: save });
    this.selected = null;
    // Several layers picked at once (Shift or Ctrl + click): to line up,
    // size alike, butt together, group, or drag together.
    this.picked = [];
    // The time of the shot the picture's shown at (null: live), and the
    // guides shown and locked onto (sim/sceneframe.mjs).
    this.phase = null;
    const g = loadSetting("sceneGuides", {});
    this.guideOn = { thirds: g?.thirds === true, safe: g?.safe === true };
    this.el = document.createElement("div");
    // The whole window, not a box over the command centre: the owner,
    // "make it a full screen display".
    this.el.className = "bay-help video-panel";
    this.el.hidden = true;
    this.el.innerHTML = `<div class="video-settings">
      <div class="vp-head">
        <h2>Recording</h2>
        <button class="vp-rec" data-act="rec"><span class="rec-dot"></span><span class="vp-rec-words">Record</span></button>
        <span class="vp-state muted small"></span>
        <nav class="vp-tabs" role="tablist">${TABS.map(([id, name]) => `<button role="tab" data-tab-btn="${id}" class="${id === "design" ? "on" : ""}">${esc(name)}</button>`).join("")}</nav>
        <span class="vp-spacer"></span>
        <button data-act="fullscreen" title="This window full screen, or back (F11 in the app)">Full screen</button>
        <button data-act="close" class="primary">Close (Esc)</button>
      </div>
      <p class="vp-hint" hidden></p>
      <div class="vp-tab vp-design" data-tab="design">
        <div class="vp-palette">
          <h3>Add <span class="muted small">(one click each; drag it into place)</span></h3>
          ${WIDGETS.map((g) => `<div class="vp-group"><span class="vp-group-name">${esc(g.group)}</span>${g.items.map((w) => `<button class="chip${PICTURED.has(w.kind) ? " pictured" : ""}" data-widget="${w.id}" data-when="${esc(w.extra?.when ?? "always")}" title="Add ${esc(widgetName(w))}">${chipPicture(w)}<span>+ ${esc(widgetName(w))}</span></button>`).join("")}</div>`).join("")}
        </div>
        <div class="vp-centre">
          <div class="vp-layouts">
            <label>Layout <select data-layout></select></label>
            <input type="text" maxlength="40" data-newname placeholder="A name" aria-label="A name for the layout">
            <button data-act="saveas" title="Keep this arrangement as a new layout, with the name typed">Save as new</button>
            <button data-act="rename" title="Give this layout the name typed">Rename</button>
            <button data-act="delete">Delete</button>
            <span class="vp-presets"><span class="muted small">Presets:</span> ${PRESETS.map((p) => `<button data-preset="${p.id}" title="Added as a layout of its own">${esc(p.name)}</button>`).join("")}<span class="vp-readymade"></span></span>
          </div>
          <div class="vp-phase" role="group" aria-label="Show the picture as it is">${PREVIEW_PHASES.map(([p, name]) => `<button data-phase="${p ?? ""}" class="${p ? "" : "on"}">${esc(name)}</button>`).join("")}<span class="vp-guide-btns" role="group" aria-label="Guides"><span class="muted small">Guides:</span>${GUIDES.map((k) => `<button data-guide="${k}" class="${this.guideOn[k] ? "on" : ""}" title="${k === "thirds" ? "The rule of thirds: lines a third of the way in, which edges lock onto" : "Where nothing is cut off on a TV or under YouTube's buttons: 5% in from each side, which edges lock onto"}">${esc(GUIDE_NAMES[k])}</button>`).join("")}</span><button data-act="clean" title="The scene full size, as it will be recorded - nothing over it">Preview</button>
            <span class="muted small vp-phase-note">Before the shot, In flight or After it lands shows the picture at that time: layers not shown then are hidden, and greyed out in the lists. Drag to move, an edge or corner to size - edges lock onto the others', the picture's and the guides' (Alt: they don't). Alt + drag the edge of the game or a camera crops it there, as in OBS. Shift + click picks several, to change them all at once or put them in a container; arrows move the picked one, Shift + arrows size it.</span></div>
          <div class="vp-stage-wrap"><div class="vp-stage"><canvas class="vp-preview"></canvas><div class="vp-grid"></div><div class="vp-frames"></div><div class="vp-guides"></div></div></div>
        </div>
        <div class="vp-side">
          <h3>Layers <span class="muted small">(top is in front)</span></h3>
          <ol class="vp-layers"></ol>
          <div class="vp-opts"></div>
        </div>
      </div>
      <div class="vp-tab" data-tab="scenes" hidden>
      <section class="vp-scenes">
        <h3>Scenes</h3>
        <p class="muted small">Each layout is a scene. Switch between them while recording by voice ("next scene", "scene swing review", "scene two") or with the Layout box above, and let each mode and the end of a round switch for you. The video is always the size set above, whatever the screens are showing.</p>
        <div class="vp-scene-modes">
          ${MODES.map((m) => `<label>${esc(MODE_NAMES[m])} <select data-scene-mode="${m}"></select></label>`).join("")}
          <label>End of a round <select data-scene-finish></select></label>
        </div>
        <p class="muted small">And a scene for the shot itself, if you like: switched to at the hit (or when it lands), and back to the one before as the next shot is set up.</p>
        <div class="vp-scene-modes">
          <label>While it flies <select data-scene-phase="flight"></select></label>
          <label>After it lands <select data-scene-phase="after"></select></label>
        </div>
        <div class="vp-scene-trans">
          <label>Changing scene <select data-scene-trans>${TRANSITIONS.map((t) => `<option value="${t}">${esc(TRANSITION_NAMES[t])}</option>`).join("")}</select></label>
          <label>over <input type="number" min="${SECONDS.min}" max="${SECONDS.max}" step="0.1" data-scene-secs> seconds</label>
          <button data-act="scene-next" title="Switches to the next scene with the transition, to see it in the picture above">Next scene (try it)</button>
        </div>
      </section>
      <section class="vp-scenefiles">
        <h3>Scene files</h3>
        <p class="muted small">Scenes made on the scene designer page, or on another PC, come in from a file here - each as a layout of its own, your others as they were. And yours go out to a file, to take to another PC or to send to be built into the game.</p>
        <div class="buttons">
          <button data-act="import-scenes">Bring in a scenes file...</button>
          <button data-act="export-scene" title="The scene picked in Layout, on its own">Save this scene to a file</button>
          <button data-act="export-scenes">Save every scene to a file</button>
          <input type="file" accept=".json,application/json" data-scene-file hidden>
        </div>
      </section>
      </div>
      <div class="vp-tab" data-tab="output" hidden>
        <p class="muted small">Record videos to share, with no other software. The layout says what goes where in the video, and the scenes which layout plays when - it's only for the recording: the projector and the controls window stay as they are. <kbd>Shift + V</kbd> starts and stops recording anywhere.</p>
      <section>
        <h3>Recording</h3>
        <div class="vp-row">
          <label>Size <select data-set="size">${OUTPUT_SIZES.map((o) => `<option value="${o.w}x${o.h}">${o.name} (${o.w}x${o.h})${o.h > 1080 ? " - if the PC keeps up" : ""}</option>`).join("")}</select></label>
          <label>Frames <select data-set="fps">${[...OUTPUT_FPS].sort((a, b) => b - a).map((f) => `<option value="${f}">${f} a second${f === 60 ? " (smooth)" : " (lighter on the PC)"}</option>`).join("")}</select></label>
          <label>Quality <select data-set="quality"><option value="best">Best</option><option value="standard">Standard (smaller files)</option><option value="compact">Compact (smallest files)</option></select></label>
          <label title="H.265 makes much the same picture in about half the size, where the graphics card can encode it. Windows' own Media Player needs Microsoft's HEVC Video Extensions to play it (VLC, YouTube, phones and the game take it as it is); H.264 plays anywhere.">Format <select data-set="format">${RECORD_FORMATS.map((f) => `<option value="${f}">${esc(RECORD_FORMAT_NAMES[f])}</option>`).join("")}</select></label>
          <label title="Full screen records the game window just as it shows - its own numbers, cards and messages too. A scene records the layout you designed. Asked each time, Record (or Shift + V) asks which; by voice it's what was recorded last.">What to record <select data-set="what">${RECORD_WHAT.map((w) => `<option value="${w}">${esc(RECORD_WHAT_NAMES[w])}</option>`).join("")}</select></label>
        </div>
        <p class="muted small vp-mode-words"></p>
      </section>
      <section>
        <h3>Sound</h3>
        <div class="vp-row">
          <label>The game's sound <input type="range" min="0" max="100" step="5" data-set="game"> <span data-show="game"></span></label>
        </div>
        <div class="vp-row">
          <label class="check"><input type="checkbox" data-set="micOn"> Microphone</label>
          <select data-mic><option value="">Choose one...</option></select>
          <label>Volume <input type="range" min="0" max="${MIC_MAX}" step="5" data-set="mic"> <span data-show="mic"></span></label>
        </div>
        <p class="small vp-mic-state muted"></p>
      </section>
      <section>
        <h3>While recording</h3>
        <label class="check"><input type="checkbox" data-set="recDot"> A small REC dot in the corner of the game window (off: the projector stays clean)</label>
        <label title="A box over the game showing the recording's own picture - move and size it with the game screen's Arrange. Shift + Q flicks the whole game window to the recording and back, whatever this says.">On the game window <select data-set="monitor">${MONITORS.map((m) => `<option value="${m}">${esc(MONITOR_NAMES[m])}</option>`).join("")}</select> <span class="muted small">Shift + Q: the whole window, and back</span></label>
        <label class="check"><input type="checkbox" data-set="keepReplays"> Keep the cameras' own instant replays running too</label>
        <p class="muted small vp-encoders"></p>
        <div class="buttons">${bridge?.openClipsFolder ? `<button data-act="clips">Open clips folder</button>` : ""}</div>
        <p class="small vp-status muted"></p>
      </section>
      </div>
      <div class="vp-tab" data-tab="library" hidden>
      <section class="vp-library">
        <h3>Recordings</h3>
        <p class="small vp-use"></p>
        <div class="vp-row">
          <label>Keep up to <input type="number" min="${LIMIT_GB.min}" max="${LIMIT_GB.max}" step="0.5" data-limit> GB of recordings</label>
          <span class="muted small">The oldest not marked Keep are deleted when a new recording finishes over it - never the one being recorded. Kept ones don't count.</span>
        </div>
        <p class="small vp-room"></p>
        <table class="vp-recs"></table>
        <div class="buttons">${bridge?.openRecordingsFolder ? `<button data-act="folder">Open recordings folder</button>` : ""}</div>
      </section>
      </div>
      <div class="vp-tab" data-tab="replays" hidden>
      <section class="vp-saved">
        <h3>Saved replays</h3>
        <p class="muted small">Every replay you've saved, newest first - each shot with all its cameras' angles. A replay is kept only until the next shot unless it's saved: <b>Save</b> on a camera box, <kbd>Shift + S</kbd>, or say "save that". A player's own shots can be watched from My stats too.</p>
        <p class="small vp-saved-use"></p>
        <div class="vp-saved-watch" hidden></div>
        <table class="vp-recs vp-saved-list"></table>
        <div class="buttons">${bridge?.openClipsFolder ? `<button data-act="clips">Open clips folder</button>` : ""}</div>
      </section>
      </div>
    </div>`;
    document.body.appendChild(this.el);
    this.stage = this.el.querySelector(".vp-stage");
    this.frames = this.el.querySelector(".vp-frames");
    this.guides = this.el.querySelector(".vp-guides");
    this.grid = this.el.querySelector(".vp-grid");
    this.preview = this.el.querySelector(".vp-preview");
    this.el.addEventListener("click", (e) => this.click(e));
    this.el.addEventListener("change", (e) => this.change(e.target));
    this.el.addEventListener("input", (e) => e.target.type === "range" && this.change(e.target));
    this.frames.addEventListener("pointerdown", (e) => this.down(e));
    this.frames.addEventListener("pointermove", (e) => this.move(e));
    this.frames.addEventListener("pointerup", (e) => this.up(e));
    this.frames.addEventListener("pointercancel", (e) => this.up(e));
    video.onChange(() => {
      if (!this.open) return;
      this.renderState();
      this.renderLibrary();
      // A scene changed elsewhere (a mode, the voice, a round's end).
      if (this.shownLayout !== this.video.layouts.active) {
        this.selected = null;
        this.picked = [];
        this.renderLayouts();
        this.renderLayers();
      }
    });
    cameras.onChange(() => this.open && (this.renderLayers(), this.renderMic()));
    // The scenes that come with the game (public/scenes), beside the presets.
    this.readyMade = [];
    readyMadeScenes(fetchText ?? ((path) => fetch(path).then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.status))))))
      .then((list) => {
        this.readyMade = list;
        this.renderReadyMade();
      })
      .catch(() => {});
  }

  // The ready-made scenes' buttons, beside the presets: each added as a
  // layout of its own.
  renderReadyMade() {
    const el = this.el.querySelector(".vp-readymade");
    if (!el) return;
    el.innerHTML = this.readyMade.flatMap((f, fi) => f.scenes.map((sc, si) => `<button data-ready="${fi}:${si}" title="Comes with the game (${esc(f.name)}): added as a layout of its own">${esc(sc.name)}</button>`)).join("");
  }

  // Scenes brought in (a file, a ready-made one): added as layouts of their
  // own, the first made the one shown.
  bringIn(scenes) {
    const r = addScenes(this.video.layouts, scenes);
    if (r.added.length || r.already) this.video.setLayouts(r.store);
    this.selected = null;
    this.picked = [];
    this.renderAll();
    this.toast(addedWords(r), 3000);
  }

  // Scenes saved to a file (the browser's or the app's own download; the
  // scene designer page's own way, which may be declined).
  async saveScenes(layouts) {
    const file = sceneFile(layouts);
    const text = JSON.stringify(file, null, 1);
    const name = sceneFileName(layouts);
    if (this.saveFile) {
      if (!(await this.saveFile(name, text))) return;
    } else {
      const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
      const a = this.doc.createElement("a");
      a.href = url;
      a.download = name;
      this.doc.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
    this.toast(`Saved ${file.scenes.length === 1 ? `"${file.scenes[0].name}"` : `${file.scenes.length} scenes`} to a file`, 2500);
  }

  get open() {
    return !this.el.hidden;
  }
  get doc() {
    return this.el.ownerDocument;
  }
  get layout() {
    return this.draft ?? this.video.layout;
  }

  // tab: the page to open on ("replays": every saved replay).
  show(on = !this.open, tab = null) {
    this.el.hidden = !on;
    this.video.compositor.use("preview", on);
    clearInterval(this.previewTimer);
    if (!on) {
      if (this.el.contains(this.doc.activeElement)) this.doc.activeElement.blur();
      // Opened from the menu: back to it (app.js sets this).
      const back = this.onClose;
      this.onClose = null;
      back?.();
      return;
    }
    // The preview at the recording's size and layout (not while recording,
    // when they're the recording's own).
    if (!this.video.recording) {
      const { w, h } = sizeOf(this.video.settings);
      this.video.compositor.setSize(w, h);
    }
    this.previewTimer = setInterval(() => this.drawPreview(), PREVIEW_MS);
    this.renderAll();
    if (tab) this.tab(tab);
    this.video.loadLibrary();
    this.el.querySelector(".vp-rec").focus();
  }

  renderAll() {
    this.renderLayouts();
    this.renderScenes();
    this.renderLayers();
    this.renderSettings();
    this.renderMic();
    this.renderState();
    this.renderLibrary();
  }

  // ---- The picture ------------------------------------------------------------------

  drawPreview() {
    if (!this.open) return;
    const src = this.video.compositor.canvas;
    const r = this.stage.getBoundingClientRect();
    const dpr = this.doc.defaultView?.devicePixelRatio ?? 1;
    const w = Math.max(1, Math.round(r.width * dpr));
    const h = Math.max(1, Math.round(r.height * dpr));
    if (this.preview.width !== w || this.preview.height !== h) {
      this.preview.width = w;
      this.preview.height = h;
    }
    this.preview.getContext("2d").drawImage(src, 0, 0, w, h);
    if (Date.now() - (this.stateAt ?? 0) > 1000) this.renderState();
    // The Add buttons' pictures of their layers, with the sample's numbers.
    if (Date.now() - (this.paletteAt ?? 0) > 1000) {
      this.paletteAt = Date.now();
      drawPalette(this.el.querySelector(".vp-palette"), this.video.compositor);
    }
  }

  // A frame over each shown layer, where the recording has it.
  renderFrames() {
    const L = this.layout;
    const cams = this.cameras.cams;
    const picked = new Set(this.pickedIds());
    // The picked ones' groups: the rest of each outlined too.
    const grouped = new Set([...picked].flatMap((id) => groupIds(L, id)));
    this.frames.innerHTML = L.layers
      .map((l, i) =>
        l.on && this.seen(l.when)
          ? `<div class="vp-frame${picked.has(l.id) ? " picked" : grouped.has(l.id) ? " grouped" : ""}" data-id="${esc(l.id)}" style="left:${l.x * 100}%;top:${l.y * 100}%;width:${l.w * 100}%;height:${l.h * 100}%;z-index:${i + 1}">
          <span class="vp-frame-name">${esc(layerName(l, cams))}</span>${EDGES.map((e) => `<i data-edges="${e}"></i>`).join("")}</div>`
          : "",
      )
      .join("");
  }

  // ---- Layouts ------------------------------------------------------------------------

  renderLayouts() {
    const sel = this.el.querySelector("[data-layout]");
    const { layouts, active } = this.video.layouts;
    this.shownLayout = active;
    sel.innerHTML = layouts.map((l) => `<option value="${esc(l.id)}" ${l.id === active ? "selected" : ""}>${esc(l.name)}</option>`).join("");
    this.el.querySelector('[data-act="delete"]').disabled = layouts.length <= 1;
  }

  // The scenes: each mode's, the end of a round's, the transition.
  renderScenes() {
    const { layouts } = this.video.layouts;
    const sc = this.video.scenes;
    const opts = (none, want) => [`<option value="">${esc(none)}</option>`, ...layouts.map((l) => `<option value="${esc(l.id)}" ${l.id === want ? "selected" : ""}>${esc(l.name)}</option>`)].join("");
    for (const sel of this.el.querySelectorAll("[data-scene-mode]")) sel.innerHTML = opts("Stay as it is", sc.byMode[sel.dataset.sceneMode]);
    const fin = this.el.querySelector("[data-scene-finish]");
    if (fin) fin.innerHTML = opts("No change", sc.finish);
    for (const sel of this.el.querySelectorAll("[data-scene-phase]")) sel.innerHTML = opts("No change", sc.byPhase?.[sel.dataset.scenePhase]);
    const tr = this.el.querySelector("[data-scene-trans]");
    if (tr) tr.value = sc.transition;
    const secs = this.el.querySelector("[data-scene-secs]");
    if (secs && this.doc.activeElement !== secs) secs.value = String(sc.seconds);
    if (secs) secs.disabled = sc.transition === "cut";
  }

  // The active layout changed: kept, and drawn so.
  commit(layout) {
    const store = this.video.layouts;
    // (Every container's layers laid out in it again: sim/container.mjs.)
    const { w: W, h: H } = sizeOf(this.video.settings);
    const flowed = flowContainers(layout, { W, H });
    this.video.setLayouts({ ...store, layouts: store.layouts.map((l) => (l.id === flowed.id ? flowed : l)) });
    this.renderLayers();
  }

  // The layers a change of the settings goes to: several picked, or the
  // picked one's whole group ("The whole group", the start), or it alone.
  targets() {
    return changeTargets(this.video.layout, { selected: this.selected, picked: this.picked.length > 1 ? this.picked : [], wholeGroup: this.wholeGroup !== false });
  }

  // A picture layer's source size, as it's drawn (compositor.js
  // sourceSize), for cropping; null when there's none to see.
  sourceOf(layer) {
    return this.video.compositor?.sourceSize?.(layer, this.cameras.cams) ?? null;
  }

  // ---- Layers -------------------------------------------------------------------------

  renderLayers() {
    const L = this.layout;
    if (this.selected && !L.layers.some((l) => l.id === this.selected)) this.selected = null;
    this.picked = this.picked.filter((id) => L.layers.some((l) => l.id === id));
    const picked = new Set(this.pickedIds());
    const cams = this.cameras.cams;
    // Groups numbered as they come, back to front: "Group 1".
    const groups = [...new Set(L.layers.map((l) => l.group).filter(Boolean))];
    // Front first.
    this.el.querySelector(".vp-layers").innerHTML = [...L.layers]
      .reverse()
      .map(
        (l) => `<li class="${picked.has(l.id) ? "picked" : ""}${l.on ? "" : " off"}${this.seen(l.when) ? "" : " unseen"}" data-layer="${esc(l.id)}"${this.seen(l.when) ? "" : ` title="Not shown ${esc(PHASE_WORDS[this.phase])}"`}>
        <input type="checkbox" data-on ${l.on ? "checked" : ""} title="Show or hide it">
        <span class="vp-layer-name">${esc(layerName(l, cams))}${l.group ? ` <span class="vp-grouptag" title="Moves with the rest of its group">Group ${groups.indexOf(l.group) + 1}</span>` : ""}${l.when && l.when !== "always" ? ` <span class="vp-when">${esc(WHEN_NAMES[l.when])}</span>` : ""}</span>
        <button data-order="1" title="Forward">↑</button><button data-order="-1" title="Back">↓</button><button data-dup title="A copy of it">⧉</button><button data-remove title="Take it out">×</button>
      </li>`,
      )
      .join("");
    // At most four cameras: their Add buttons say so once they're in.
    const full = cameraLayers(L) >= MAX_CAMERA_LAYERS;
    for (const b of this.el.querySelectorAll('[data-widget^="camera"]')) {
      b.disabled = full;
      b.title = full ? `${MAX_CAMERA_LAYERS} cameras at most - all in` : b.title;
    }
    // The Add buttons for layers not shown at the time picked: greyed.
    for (const b of this.el.querySelectorAll(".vp-palette [data-widget]")) b.classList.toggle("unseen", !this.seen(b.dataset.when));
    this.renderGrid();
    this.renderFrames();
    this.renderOpts();
  }

  // Whether a layer shown `when` shows at the time picked (always, live).
  seen(when) {
    return !this.phase || shownIn(when ?? "always", this.phase);
  }
  // The guides' lines, in pixels of the recording (for locking onto).
  lines() {
    const { w: W, h: H } = sizeOf(this.video.settings);
    return guideLines({ W, H, ...this.guideOn });
  }
  renderGrid() {
    if (!this.grid) return;
    const { w: W, h: H } = sizeOf(this.video.settings);
    this.grid.innerHTML = guidesHtml(this.guideOn, W, H);
  }

  // The picked layer's own settings - or, with several picked, the lining
  // up and containers and then the settings they share, changed on all.
  renderOpts() {
    const box = this.el.querySelector(".vp-opts");
    const ids = this.pickedIds();
    if (ids.length > 1) {
      const picked = ids.map((id) => this.layout.layers.find((l) => l.id === id)).filter(Boolean);
      box.innerHTML = this.manyOpts(ids) + this.sharedOpts(picked);
      return;
    }
    const l = this.layout.layers.find((x) => x.id === this.selected);
    if (!l) {
      box.innerHTML = `<p class="muted small">Pick a layer (here or on the picture) for its settings - Shift + click to pick several, to line them up, change them all at once or put them in a container.</p>`;
      return;
    }
    box.innerHTML = this.layerOpts(l);
  }

  // The settings several picked layers share: the first picture's
  // (corners, border) and the first words layer's look, each change made to
  // all of them that have it - what each one is (its number, its words, its
  // camera) left as it is.
  sharedOpts(picked) {
    const parts = [`<h3 class="vp-shared">Change them all</h3><p class="muted small">A change here goes to every one picked that has it - each keeps its own number, words and camera.</p>`];
    parts.push(`<label>Show it <select data-opt="when">${WHEN.map((w) => `<option value="${w}" ${(picked[0].when ?? "always") === w ? "selected" : ""}>${esc(WHEN_NAMES[w])}</option>`).join("")}</select></label>`);
    const pic = picked.find((l) => l.kind === "camera" || l.kind === "game");
    if (pic) parts.push(pictureLook(pic));
    const words = picked.find((l) => WORD_KINDS.includes(l.kind));
    if (words) parts.push(styleOpts(words));
    return parts.join("");
  }

  // One layer's settings.
  layerOpts(l) {
    const cams = this.cameras.cams;
    const parts = [`<h3>${esc(layerName(l, cams))}</h3>`];
    // Where it is and how big, typed (pixels of a 1080p picture).
    const at = placeOf(l);
    parts.push(
      `<div class="vp-place" title="In pixels of a ${PLACE_W} x ${PLACE_H} picture, whatever size is recorded">${[
        ["x", "Left"],
        ["y", "Top"],
        ["w", "Width"],
        ["h", "Height"],
      ]
        .map(([k, name]) => `<label>${name} <input type="number" data-place="${k}" value="${at[k]}" min="0" max="${k === "x" || k === "w" ? PLACE_W : PLACE_H}" step="1"></label>`)
        .join("")}</div>`,
    );
    parts.push(`<div class="vp-opt"><span>Frame it</span><div class="vp-choice vp-fqs" role="group">${frameButtons(SHORT_KINDS.includes(l.kind))}</div></div>`);
    if (l.group) {
      const n = groupIds(this.layout, l.id).length;
      const all = this.wholeGroup !== false;
      parts.push(
        `<div class="small vp-in-group"><p>In a group of ${n}: they move together. <button data-act="ungroup">Ungroup</button></p>
        <div class="vp-opt"><span>Settings change</span><div class="vp-choice" role="group"><button data-act="group-all" class="${all ? "on" : ""}" title="A change to this one's look goes to every one in its group that has it">The whole group</button><button data-act="group-one" class="${all ? "" : "on"}">Just this one</button></div></div></div>`,
      );
    }
    parts.push(`<label>Show it <select data-opt="when">${WHEN.map((w) => `<option value="${w}" ${(l.when ?? "always") === w ? "selected" : ""}>${esc(WHEN_NAMES[w])}</option>`).join("")}</select></label>`);
    if (l.kind === "stat") parts.push(`<label>Number <select data-opt="stat">${TILE_KEYS.map((k) => `<option value="${k}" ${l.stat === k ? "selected" : ""}>${esc(TILES[k].label)}</option>`).join("")}</select></label>`);
    if (l.kind === "flight") {
      parts.push(`<label>Seen <select data-opt="view">${FLIGHT_VIEWS.map((v) => `<option value="${v}" ${l.view === v ? "selected" : ""}>${{ side: "From the side", above: "From above" }[v]}</option>`).join("")}</select></label>`);
      parts.push(`<p class="muted small">Drawn as the ball flies, then whole with the carry. "While it flies" shows it only in the air.</p>`);
    }
    if (l.kind === "camera") {
      parts.push(`<label>Camera <select data-opt="slot">${Array.from({ length: MAX_SLOTS }, (_, i) => `<option value="${i}" ${l.slot === i ? "selected" : ""}>${i + 1}${cams[i] ? `: ${esc(cams[i].name)}` : " (not chosen)"}</option>`).join("")}</select></label>`);
    }
    if (l.kind === "camera" || l.kind === "game") {
      if (l.kind === "game")
        parts.push(
          `<label class="check" title="With the picture's centre moved for play ([ and ] in the game), the recording still has the target line in the middle - the game draws a little more of the picture while recording, off the screen's edge, to have it"><input type="checkbox" data-opt="centred" ${l.centred !== false ? "checked" : ""}> Centred on the target line, even when the picture's centre is moved for play</label>`,
        );
      parts.push(
        numRange("Zoom", "zoom", l.zoom, { min: ZOOM_LIMITS.min, max: ZOOM_LIMITS.max, step: 0.05, unit: "×" }),
        `<label>Across <input type="range" min="-1" max="1" step="0.02" value="${l.panX}" data-opt="panX"></label>`,
        `<label>Up and down <input type="range" min="-1" max="1" step="0.02" value="${l.panY}" data-opt="panY"></label>`,
      );
      // Cropping: how much of the picture is cut off each side - Alt +
      // drag an edge, as in OBS, or typed.
      const src = this.sourceOf(l);
      if (src) {
        const { w: W, h: H } = sizeOf(this.video.settings);
        const cut = cropAmounts(l, src.w, src.h, layerPixels(l, W, H));
        parts.push(
          `<div class="vp-opt vp-crop"><span title="Hold Alt and drag an edge of it on the picture to cut it there, the picture staying where it is">Cropped (Alt + drag an edge)</span><div class="vp-crop-row">${[
            ["left", "Left"],
            ["right", "Right"],
            ["top", "Top"],
            ["bottom", "Bottom"],
          ]
            .map(([k, name]) => `<label>${name} <input type="number" data-crop="${k}" value="${Math.round(cut[k] * 1000) / 10}" min="0" max="90" step="0.5">%</label>`)
            .join("")}<button data-act="whole" title="Nothing cut off: the picture's own shape, as tall as the box">Whole picture</button></div></div>`,
        );
      }
      parts.push(pictureLook(l));
    }
    if (l.kind === "tiles") {
      parts.push(`<div class="vp-tiles">${TILE_KEYS.map((k) => `<label class="check"><input type="checkbox" data-tile="${k}" ${l.tiles.includes(k) ? "checked" : ""}> ${esc(TILES[k].label)}</label>`).join("")}</div>`);
    }
    if (l.kind === "title") parts.push(`<label>After "${SHORT_NAME}" <input type="text" maxlength="60" data-opt="text" value="${esc(l.text)}" placeholder="Your words (optional)"></label>`);
    if (l.kind === "clock") parts.push(`<label>Shows <select data-opt="show">${CLOCK_SHOWS.map((s) => `<option value="${s}" ${l.show === s ? "selected" : ""}>${{ time: "The time", date: "The date", both: "The date and time" }[s]}</option>`).join("")}</select></label>`);
    if (l.kind === "info") parts.push(`<p class="muted small">The hole, the score and the challenge, on the course and in the Challenges; nothing on the range and greens.</p>`);
    if (l.kind === "standings") parts.push(`<p class="muted small">What the round counted for, once a course round has finished: a season's event, an online season's, the online match over several games, a match ladder's match - each its standings, your players in gold. Nothing when it counted for none.</p>`);
    if (l.kind === "scorecard") parts.push(`<p class="muted small">The round card - the scorecard, the score and net, strokes gained and the shot of the round - once a course round has finished; nothing before. It keeps its shape (4:5) in the middle of the box.</p>`);
    if (l.kind === "player") parts.push(`<p class="muted small">Who hit the last shot and with which club.</p>`);
    if (l.kind === "field") parts.push(`<label>Shows <select data-opt="field">${FIELDS.map((f) => `<option value="${f}" ${l.field === f ? "selected" : ""}>${esc(INFO_FIELD_NAMES[f])}</option>`).join("")}</select></label>`, `<p class="muted small">Nothing is drawn while there's nothing to say (no hole on the range, say).</p>`);
    if (l.kind === "box") {
      parts.push(`<p class="muted small">A plain box to sit behind other layers - a panel behind a column of them, say. It goes behind the rest when it's added (↑ ↓ in the list move it); its colour, how solid, corners and outline are below.</p>`);
      parts.push(containerOpts(l, groupIds(this.layout, l.id).length - 1));
    }
    if (l.kind === "minimap") parts.push(`<p class="muted small">The hole being played, from above - the ball, the shots so far, the aim and the other players' balls - as the game window's map. On the course; nothing elsewhere.</p>`);
    if (l.kind === "text") parts.push(`<label>Words <input type="text" maxlength="120" data-opt="text" value="${esc(l.text)}"></label>`);
    if (WORD_KINDS.includes(l.kind)) parts.push(styleOpts(l));
    return parts.join("");
  }

  // One of the designer's pages.
  tab(id) {
    for (const t of this.el.querySelectorAll("[data-tab]")) t.hidden = t.dataset.tab !== id;
    for (const b of this.el.querySelectorAll("[data-tab-btn]")) b.classList.toggle("on", b.dataset.tabBtn === id);
    if (id === "library" || id === "replays") this.video.loadLibrary();
    if (id !== "replays") this.watch(null);
  }

  // The layers picked: several (Shift + click), or the one.
  pickedIds() {
    if (this.picked.length > 1) return this.picked;
    return this.selected ? [this.selected] : [];
  }

  // A layer picked - on its own, or (add) with those picked already, or
  // taken out of them if it was one.
  pick(id, add = false) {
    if (add) {
      const now = this.pickedIds();
      this.picked = now.includes(id) ? now.filter((x) => x !== id) : [...now, id];
      this.selected = this.picked.includes(id) ? id : (this.picked.at(-1) ?? null);
      if (this.picked.length < 2) this.picked = [];
    } else {
      this.picked = [];
      this.selected = id;
    }
    this.renderLayers();
  }

  // Several layers picked: lined up, sized alike, butted together,
  // grouped or ungrouped - the first picked the one the others take their
  // size from.
  manyOpts(ids) {
    const L = this.layout;
    const first = L.layers.find((l) => l.id === ids[0]);
    const anyGrouped = ids.some((id) => L.layers.find((l) => l.id === id)?.group);
    const grouped = new Set(ids.map((id) => L.layers.find((l) => l.id === id)?.group));
    const oneGroup = grouped.size === 1 && !grouped.has(undefined) && groupIds(L, ids[0]).length === ids.length;
    const btns = (list) => `<div class="vp-choice" role="group">${list.map((h) => `<button data-align="${h}">${esc(ALIGN_HOW_NAMES[h])}</button>`).join("")}</div>`;
    return `<h3>${ids.length} layers picked</h3>
      <p class="muted small">Shift + click another to add it, or one of these to take it out. Dragging one moves them all.</p>
      <div class="vp-opt"><span>Line up</span>${btns(["left", "centre", "right", "top", "middle", "bottom"])}</div>
      <div class="vp-opt"><span>Size, as ${esc(layerName(first, this.cameras.cams))}</span>${btns(["width", "height"])}</div>
      <div class="vp-opt"><span>Butt together, no gaps</span>${btns(["stack", "row"])}</div>
      ${ids.length >= 3 ? `<div class="vp-opt"><span>Even gaps between them</span><div class="vp-choice" role="group"><button data-spread="across">Across</button><button data-spread="down">Down</button></div></div>` : ""}
      <div class="vp-opt"><span>Borders and corners</span><div class="vp-choice" role="group"><button data-act="match" title="The others' corners, border or outline and backing made ${esc(layerName(first, this.cameras.cams))}'s">All as ${esc(layerName(first, this.cameras.cams))}</button></div></div>
      <div class="vp-opt"><span title="A background box round them (or the one picked with them), grouped with them, laying them out evenly in it - ${FILL_START.gap} px apart and ${FILL_START.pad} px in from its edges, both changed in the box's settings">Put them in a container, evenly</span><div class="vp-choice" role="group">${FILL_HOW.map((h) => `<button data-contain="${h}">${esc({ down: "Down", across: "Across", grid: "A grid" }[h])}</button>`).join("")}</div></div>
      <div class="buttons">${oneGroup ? "" : `<button data-act="group" class="primary" title="They move together from now on">Group them</button>`}${anyGrouped ? `<button data-act="ungroup">Ungroup</button>` : ""}</div>`;
  }

  // ---- Dragging on the picture -----------------------------------------------------

  down(e) {
    const f = e.target.closest?.(".vp-frame");
    if (!f) return;
    e.preventDefault();
    const id = f.dataset.id;
    // Shift (or Ctrl) + click: one more picked, or one fewer - no drag.
    if (e.shiftKey || e.ctrlKey || e.metaKey) return this.pick(id, true);
    if (!this.pickedIds().includes(id)) this.pick(id);
    else if (id !== this.selected) {
      this.selected = id;
      this.renderOpts();
    }
    const { w: W, h: H } = sizeOf(this.video.settings);
    const layer = this.layout.layers.find((l) => l.id === id);
    const r = this.stage.getBoundingClientRect();
    const edges = e.target.dataset?.edges ?? null;
    // Moving: those picked with it, or its group, go too. Sizing: it alone.
    const ids = edges ? [id] : movingIds(this.layout, id, this.picked);
    // Alt on a picture's edge: cropping it, as OBS does (sim/layercrop.mjs) -
    // the picture in it stays where it is.
    const src = edges && e.altKey && (layer.kind === "game" || layer.kind === "camera") ? this.sourceOf(layer) : null;
    this.drag = { id, ids, edges, from: [e.clientX, e.clientY], start: layerPixels(layer, W, H), scale: W / r.width, W, H, moved: false, crop: src ? { layer, src } : null };
    try {
      this.frames.setPointerCapture(e.pointerId);
    } catch {
      // Not capturable: follows while over the picture.
    }
  }

  move(e) {
    const d = this.drag;
    if (!d) return;
    const dx = (e.clientX - d.from[0]) * d.scale;
    const dy = (e.clientY - d.from[1]) * d.scale;
    if (!d.moved && Math.hypot(dx, dy) < 3) return;
    d.moved = true;
    const s = d.start;
    let r = { ...s };
    if (!d.edges) r = { ...s, x: s.x + dx, y: s.y + dy };
    else {
      if (d.edges.includes("e")) r.w = s.w + dx;
      if (d.edges.includes("s")) r.h = s.h + dy;
      if (d.edges.includes("w")) r = { ...r, x: s.x + dx, w: s.w - dx };
      if (d.edges.includes("n")) r = { ...r, y: s.y + dy, h: s.h - dy };
    }
    const lock = { W: d.W, H: d.H, snap: !e.altKey, within: LOCK_PX * d.scale, lines: this.lines() };
    if (d.crop) {
      const c = cropDrag(d.crop.layer, d.crop.src.w, d.crop.src.h, s, r);
      // (Cut as small as it goes: left at the last.)
      if (!c) return;
      const k = c.rect;
      this.draft = setLayer(this.video.layout, d.id, { x: k.x / d.W, y: k.y / d.H, w: k.w / d.W, h: k.h / d.H, zoom: c.zoom, panX: c.panX, panY: c.panY });
    } else this.draft = d.edges ? placeLayer(this.video.layout, d.id, r, { ...lock, edges: d.edges }) : moveLayers(this.video.layout, d.ids, dx, dy, lock);
    // (A container's layers following it as it's sized or moved.)
    this.draft = flowContainers(this.draft, { W: d.W, H: d.H });
    this.video.compositor.setLayout(this.draft);
    for (const id of [...new Set([...d.ids, ...groupIds(this.draft, d.id)])]) {
      const l = this.draft.layers.find((x) => x.id === id);
      const el = this.frames.querySelector(`[data-id="${CSS.escape(id)}"]`);
      if (el && l) Object.assign(el.style, { left: `${l.x * 100}%`, top: `${l.y * 100}%`, width: `${l.w * 100}%`, height: `${l.h * 100}%` });
    }
    this.showGuides(lock.snap ? touchingEdges(this.draft, d.ids, { W: d.W, H: d.H, lines: lock.lines }) : null, d.W, d.H);
  }

  // A line across the picture where what's dragged sits flush on another
  // layer's edge: it's seen to be locked on.
  showGuides(edges, W, H) {
    if (!this.guides) return;
    this.guides.innerHTML = edges ? [...edges.xs.map((x) => `<i class="vp-guide v" style="left:${(x / W) * 100}%"></i>`), ...edges.ys.map((y) => `<i class="vp-guide h" style="top:${(y / H) * 100}%"></i>`)].join("") : "";
  }

  up() {
    const d = this.drag;
    this.drag = null;
    this.showGuides(null);
    // One of several picked, clicked and not dragged: it alone, now.
    if (d && !d.moved && this.picked.length > 1) return this.pick(d.id);
    if (!d?.moved || !this.draft) return;
    const layout = this.draft;
    this.draft = null;
    this.commit(layout);
  }

  // ---- Clicks and changes ----------------------------------------------------------

  async click(e) {
    const row = e.target.closest?.("[data-layer]");
    const btn = e.target.closest?.("button");
    const L = this.video.layout;
    if (row && !e.target.matches("input")) {
      const id = row.dataset.layer;
      if (btn?.dataset.order) return this.commit(reorderLayer(L, id, Number(btn.dataset.order)));
      if (btn?.hasAttribute("data-remove")) return this.commit(removeLayer(L, id));
      if (btn?.hasAttribute("data-dup")) {
        const r = duplicateLayer(L, id);
        if (!r.id) return this.toast(r.why === "cameras" ? `A recording has at most ${MAX_CAMERA_LAYERS} cameras` : "That's as many layers as a layout can have", 2500);
        this.selected = r.id;
        return this.commit(r.layout);
      }
      return this.pick(id, e.shiftKey || e.ctrlKey || e.metaKey);
    }
    if (!btn) return;
    // Several picked: lined up, sized alike or butted together.
    if (btn.dataset.align) {
      const { w: W, h: H } = sizeOf(this.video.settings);
      return this.commit(alignLayers(L, this.pickedIds(), btn.dataset.align, { W, H }));
    }
    // A colour, alignment or the like picked from its buttons.
    if (btn.dataset.swatch && this.selected) return this.commit(setLayers(L, this.targets(), { [btn.dataset.swatch]: btn.dataset.value }));
    // Several picked put in a container, laid out evenly (sim/container.mjs).
    if (btn.dataset.contain) {
      const { w: W, h: H } = sizeOf(this.video.settings);
      const { layout, id } = containIn(L, this.pickedIds(), btn.dataset.contain, { W, H });
      if (!id) return this.toast("That's as many layers as a layout can have", 2500);
      this.picked = [];
      this.selected = id;
      this.commit(layout);
      return this.toast("In a container: size or move the box and they follow - its gap and padding are in its settings", 3500);
    }
    // A box's container on, another way, or off.
    if (btn.hasAttribute("data-fill-how") && this.selected) {
      const l = L.layers.find((x) => x.id === this.selected);
      const how = btn.dataset.fillHow;
      return this.commit(setLayer(L, this.selected, { fill: how ? { ...FILL_START, ...(l?.fill ?? {}), how } : null }));
    }
    if (btn.dataset.widget) {
      const { layout, id, why } = addWidget(L, btn.dataset.widget);
      if (!id) return this.toast(why === "cameras" ? `A recording has at most ${MAX_CAMERA_LAYERS} cameras - take one out first` : "That's as many layers as a layout can have", 2500);
      this.selected = id;
      return this.commit(layout);
    }
    if (btn.hasAttribute("data-phase")) {
      this.phase = btn.dataset.phase || null;
      this.video.compositor.previewPhase = this.phase;
      for (const b of this.el.querySelectorAll("[data-phase]")) b.classList.toggle("on", b === btn);
      return this.renderLayers();
    }
    if (btn.dataset.guide) {
      this.guideOn = { ...this.guideOn, [btn.dataset.guide]: !this.guideOn[btn.dataset.guide] };
      btn.classList.toggle("on", this.guideOn[btn.dataset.guide]);
      saveSetting("sceneGuides", this.guideOn);
      return this.renderGrid();
    }
    if (btn.dataset.frame && this.selected) {
      const { w: W, h: H } = sizeOf(this.video.settings);
      const l = L.layers.find((x) => x.id === this.selected);
      return this.commit(frameLayer(L, this.selected, btn.dataset.frame, { W, H, words: SHORT_KINDS.includes(l?.kind) }));
    }
    if (btn.dataset.spread) {
      const { w: W, h: H } = sizeOf(this.video.settings);
      return this.commit(spreadLayers(L, this.pickedIds(), btn.dataset.spread, { W, H }));
    }
    if (btn.dataset.ready) {
      const [fi, si] = btn.dataset.ready.split(":").map(Number);
      const scene = this.readyMade[fi]?.scenes[si];
      return scene && this.bringIn([scene]);
    }
    if (btn.dataset.preset) {
      const { store, id } = usePreset(this.video.layouts, btn.dataset.preset);
      if (!id) return this.toast("That's as many layouts as can be kept - delete one first", 3000);
      const added = store.layouts.length > this.video.layouts.layouts.length;
      this.video.setLayouts(store);
      this.selected = null;
      this.picked = [];
      this.renderAll();
      return added && this.toast(`Added as "${activeLayout(store).name}" - your other layouts are as they were`, 2500);
    }
    if (btn.dataset.watch) return this.watch(btn.dataset.watch);
    if (btn.dataset.delShot) {
      const shot = savedReplays(this.video.library?.clips).find((x) => x.key === btn.dataset.delShot);
      const n = shot?.clips.length ?? 0;
      if (!n || !(await ask(`Delete this shot's saved replay${n === 1 ? "" : `s (${n} angles)`} - ${replayWords(shot, MODE_NAMES)}, ${when(shot.at)}? It can't be brought back.`, { yes: "Delete", danger: true }))) return;
      if (this.watching === shot.key) this.watch(null);
      return this.video.removeClips(shot.clips.map((c) => c.id));
    }
    if (btn.dataset.del) {
      const c = this.video.recordings().find((x) => x.id === btn.dataset.del);
      if (!c || !(await ask(`Delete the recording "${c.file}"? It can't be brought back.`, { yes: "Delete", danger: true }))) return;
      return this.video.remove(c.id);
    }
    if (btn.dataset.tabBtn) return this.tab(btn.dataset.tabBtn);
    switch (btn.dataset.act) {
      case "close":
        return this.show(false);
      case "group":
        this.commit(groupLayers(L, this.pickedIds()));
        return this.toast("Grouped: they move together - Ungroup to part them", 2500);
      case "ungroup":
        return this.commit(ungroupLayers(L, this.pickedIds()));
      case "match":
        return this.commit(matchLooks(L, this.pickedIds()));
      case "group-all":
      case "group-one":
        this.wholeGroup = btn.dataset.act === "group-all";
        return this.renderOpts();
      case "whole": {
        const l = L.layers.find((x) => x.id === this.selected);
        const src = l && this.sourceOf(l);
        if (!src) return;
        const { w: W, h: H } = sizeOf(this.video.settings);
        const c = wholePicture(src.w, src.h, layerPixels(l, W, H), { W, H });
        return this.commit(setLayer(L, l.id, { x: c.rect.x / W, y: c.rect.y / H, w: c.rect.w / W, h: c.rect.h / H, zoom: 1, panX: 0, panY: 0 }));
      }
      case "clean":
        return openCleanPreview(this.doc, this.video.compositor, this.phase ? `As it will be recorded ${PHASE_WORDS[this.phase]} - click or press Esc to close` : "");
      case "fullscreen": {
        const d = this.doc;
        if (d.fullscreenElement) return d.exitFullscreen?.();
        return d.documentElement.requestFullscreen?.().catch(() => this.toast("Full screen isn't allowed here - F11 in the app", 2500));
      }
      case "rec":
        await (this.record ? this.record(this.doc) : this.video.toggle());
        return this.renderState();
      case "scene-next":
        this.video.stepScene(1, "panel");
        this.selected = null;
        this.picked = [];
        return this.renderAll();
      case "import-scenes":
        return this.el.querySelector("[data-scene-file]").click();
      case "export-scene":
        return this.saveScenes([L]);
      case "export-scenes":
        return this.saveScenes(this.video.layouts.layouts);
      case "folder":
        return this.bridge?.openRecordingsFolder?.();
      case "clips":
        return this.bridge?.openClipsFolder?.();
      case "watch-close":
        return this.watch(null);
      case "watch-play":
        return this.playWatched();
      case "watch-speed":
        this.watchSpeed = WATCH_SPEEDS[(WATCH_SPEEDS.indexOf(this.watchSpeed ?? 1) + 1) % WATCH_SPEEDS.length];
        btn.textContent = speedWords(this.watchSpeed);
        for (const v of this.el.querySelectorAll(".vp-saved-watch video")) v.playbackRate = this.watchSpeed;
        return;
      case "saveas": {
        const name = this.typedName() || `${L.name} copy`;
        const { store, id } = saveAs(this.video.layouts, name, L.layers);
        if (!id) return this.toast("That's as many layouts as can be kept - delete one first", 3000);
        this.video.setLayouts(store);
        this.renderAll();
        return this.toast(`Saved as "${activeLayout(store).name}"`, 2000);
      }
      case "rename": {
        const name = this.typedName();
        if (!name) return this.toast("Type the new name in the box first", 2000);
        this.commit({ ...L, name });
        return this.renderLayouts();
      }
      case "delete":
        if (!(await ask(`Delete the layout "${L.name}"?`, { yes: "Delete", danger: true }))) return;
        this.video.setLayouts(removeLayout(this.video.layouts, L.id));
        return this.renderAll();
    }
  }

  // The name typed in the box beside the layouts (and the box emptied).
  typedName() {
    const box = this.el.querySelector("[data-newname]");
    const name = box.value.trim().slice(0, 40);
    box.value = "";
    return name;
  }

  change(t) {
    const L = this.video.layout;
    if (t.matches("[data-scene-file]")) {
      const file = t.files?.[0];
      t.value = "";
      if (!file) return;
      return file
        .text()
        .then((text) => this.bringIn(readSceneFile(text)))
        .catch((err) => this.toast(err.message, 3500));
    }
    if (t.matches("[data-layout]")) {
      // A change of scene: with the transition while recording.
      this.video.switchScene(t.value, "panel");
      this.selected = null;
      this.picked = [];
      return this.renderAll();
    }
    if (t.matches("[data-scene-mode]")) return this.video.setScenes({ byMode: { [t.dataset.sceneMode]: t.value || null } });
    if (t.matches("[data-scene-finish]")) return this.video.setScenes({ finish: t.value || null });
    if (t.matches("[data-scene-phase]")) return this.video.setScenes({ byPhase: { ...this.video.scenes.byPhase, [t.dataset.scenePhase]: t.value || null } });
    if (t.matches("[data-scene-trans]")) {
      this.video.setScenes({ transition: t.value });
      return this.renderScenes();
    }
    if (t.matches("[data-scene-secs]")) {
      this.video.setScenes({ seconds: Number(t.value) });
      return this.renderScenes();
    }
    if (t.matches("[data-add]")) {
      if (!t.value) return;
      const { layout, id, why } = addLayer(L, t.value);
      t.value = "";
      if (!id) return this.toast(why === "cameras" ? `A recording has at most ${MAX_CAMERA_LAYERS} cameras - take one out first` : "That's as many layers as a layout can have", 2500);
      this.selected = id;
      return this.commit(layout);
    }
    const row = t.closest?.("[data-layer]");
    if (row && t.matches("[data-on]")) return this.commit(setLayer(L, row.dataset.layer, { on: t.checked }));
    // Its place typed, in pixels of a 1080p picture.
    if (t.dataset.place && this.selected) return this.commit(typedPlace(L, this.selected, { [t.dataset.place]: t.value }));
    if (t.dataset.tile && this.selected) {
      const l = L.layers.find((x) => x.id === this.selected);
      const tiles = t.checked ? [...l.tiles, t.dataset.tile] : l.tiles.filter((k) => k !== t.dataset.tile);
      return this.commit(setLayer(L, l.id, { tiles }));
    }
    // A crop typed: that share of the picture cut off, the picture left
    // where it is (sim/layercrop.mjs).
    if (t.dataset.crop && this.selected) {
      const l = L.layers.find((x) => x.id === this.selected);
      const src = l && this.sourceOf(l);
      if (!src) return;
      const { w: W, h: H } = sizeOf(this.video.settings);
      const c = cropTo(l, src.w, src.h, layerPixels(l, W, H), { [t.dataset.crop]: Number(t.value) / 100 }, { W, H });
      if (!c) {
        this.toast("That's more than can be cut off - less, or Whole picture first", 2500);
        return this.renderOpts();
      }
      return this.commit(setLayer(L, l.id, { x: c.rect.x / W, y: c.rect.y / H, w: c.rect.w / W, h: c.rect.h / H, zoom: c.zoom, panX: c.panX, panY: c.panY }));
    }
    // A container's gap, padding or columns.
    if (t.dataset.fill && this.selected) {
      const l = L.layers.find((x) => x.id === this.selected);
      if (!l?.fill) return;
      return this.commit(setLayer(L, l.id, { fill: { ...l.fill, [t.dataset.fill]: Number(t.value) } }));
    }
    // (A share typed as a percentage: how solid.)
    const pct = t.dataset.pct;
    if ((t.dataset.opt || pct) && this.selected) {
      const k = t.dataset.opt ?? pct;
      const v = t.type === "checkbox" ? t.checked : pct ? Number(t.value) / 100 : NUMBER_OPTS.includes(k) ? Number(t.value) : t.value;
      // To the picked one - or its whole group, or every one picked
      // (sim/layerstyle.mjs: what each one is stays its own).
      const next = setLayers(L, this.targets(), { [k]: v });
      // A slider dragged: drawn as it goes, the number beside it with it,
      // the options left alone.
      if (t.type === "range") {
        const box = t.parentElement?.querySelector?.(`input[type="number"][data-opt="${k}"], input[type="number"][data-pct="${k}"]`);
        if (box) box.value = box.dataset.pct ? String(Math.round(Number(t.value) * 100)) : t.value;
        this.video.setLayouts({ ...this.video.layouts, layouts: this.video.layouts.layouts.map((x) => (x.id === next.id ? next : x)) });
        return this.renderFrames();
      }
      return this.commit(next);
    }
    const key = t.dataset.set;
    if (key) {
      const v = t.type === "checkbox" ? t.checked : ["fps", "game", "mic"].includes(key) ? Number(t.value) : t.value;
      if (this.video.recording && ["size", "fps", "quality", "format"].includes(key)) {
        this.toast("That changes from the next recording", 2500);
      }
      this.video.set({ [key]: v });
      if (key === "size" && !this.video.recording) {
        const { w, h } = sizeOf(this.video.settings);
        this.video.compositor.setSize(w, h);
      }
      if (key === "micOn" && t.checked && !this.cameras.settings.mic) this.renderMic(true);
      this.renderLibrary();
      return this.renderSettings();
    }
    if (t.matches("[data-limit]")) return this.changeLimit(t);
    if (t.matches("[data-keep]")) return this.video.setKeep(t.dataset.keep, t.checked);
    if (t.matches("[data-mic]")) {
      const d = (this.mics ?? []).find((m) => m.deviceId === t.value) ?? null;
      this.cameras.setMic(d);
      if (d && !this.video.settings.micOn) this.video.set({ micOn: true });
      this.renderSettings();
      return this.renderMic();
    }
  }

  renderSettings() {
    const s = this.video.settings;
    const set = (k, v) => {
      for (const el of this.el.querySelectorAll(`[data-set="${k}"]`)) {
        if (this.doc.activeElement === el && el.type !== "radio" && el.type !== "range") continue;
        if (el.type === "checkbox") el.checked = !!v;
        else if (el.type === "radio") el.checked = el.value === v;
        else el.value = String(v);
      }
      const show = this.el.querySelector(`[data-show="${k}"]`);
      if (show) show.textContent = `${v}%`;
    };
    for (const k of ["size", "fps", "quality", "format", "what", "game", "mic", "micOn", "recDot", "keepReplays", "monitor"]) set(k, s[k]);
    const v = this.video;
    const gb = (v.perHour() / 1e9).toFixed(1);
    const codec = v.typeFor()?.codec;
    const fmt = codec === "hevc" ? " in H.265" : codec === "avc" ? ` in H.264${s.format === "small" ? (v.hevcFailed ? " (H.265 failed on this card earlier - H.264 until the game's started again)" : " (this PC can't record H.265)") : ""}` : "";
    this.el.querySelector(".vp-mode-words").textContent = `Recording starts when you press Record (or Shift + V) and stops when you stop it: a file an hour in the recordings folder (a long one in parts, kept together), about ${gb} GB an hour at this size and quality${fmt}. Nothing is recorded by itself - a shot's quick review is the cameras' replay.`;
    const enc = this.video.encoders();
    this.el.querySelector(".vp-encoders").textContent =
      `While recording, ${enc.composed} video encoder${enc.composed === 1 ? "" : "s"} for the recording` +
      (enc.replays ? ` and ${enc.replays} for the cameras' replays` : this.cameras.cams.length ? " - the cameras' replays pause meanwhile (the recording has the swing), unless kept running above" : "") +
      `. Graphics cards like the GTX 1070 encode only a few videos at once (about ${NVENC_SESSIONS}); beyond that the processor does it, and the game may slow.`;
  }

  // The microphones present, and the chosen one's state.
  async renderMic(ask = false) {
    const sel = this.el.querySelector("[data-mic]");
    const state = this.el.querySelector(".vp-mic-state");
    let mics = await this.cameras.listMics();
    // Their names come once access has been allowed: asked for here only
    // when the owner ticks the microphone.
    if (ask && !mics.some((m) => m.label) && this.cameras.media?.getUserMedia) {
      try {
        const s = await this.cameras.media.getUserMedia({ audio: true, video: false });
        for (const t of s.getTracks()) t.stop();
      } catch {
        // Refused: listed without names.
      }
      mics = await this.cameras.listMics();
    }
    this.mics = mics;
    const chosen = this.cameras.settings.mic;
    const opts = mics.map((m, i) => `<option value="${esc(m.deviceId)}" ${chosen && (m.deviceId === chosen.deviceId || (!mics.some((x) => x.deviceId === chosen.deviceId) && m.label && m.label === chosen.label)) ? "selected" : ""}>${esc(m.label || `Microphone ${i + 1}`)}</option>`);
    sel.innerHTML = `<option value="">${mics.length ? "None" : "No microphones found"}</option>${opts.join("")}`;
    if (chosen && !sel.value) sel.insertAdjacentHTML("beforeend", `<option selected value="${esc(chosen.deviceId)}">${esc(chosen.label || "The chosen microphone")} - not found</option>`);
    const err = this.cameras.micError;
    state.textContent = err ? `Microphone: ${err.text}` : this.video.recording && this.video.sound?.mic ? "Microphone: in the recording" : "";
    state.classList.toggle("bad", !!err);
  }

  // The Record button, the time, how it's going.
  renderState() {
    this.stateAt = Date.now();
    const v = this.video;
    const btn = this.el.querySelector(".vp-rec");
    btn.classList.toggle("on", v.recording);
    btn.querySelector(".vp-rec-words").textContent = v.recording ? `Stop  ${v.elapsedText()}` : "Record";
    const st = v.stats();
    const s = v.settings;
    this.el.querySelector(".vp-state").textContent = v.recording
      ? `${s.size.replace("x", " x ")} at ${s.fps} · ${v.type?.ext?.toUpperCase() ?? ""}${st.sent ? ` · ${(st.sent / 1e6).toFixed(1)} MB sent` : ""}${st.waiting > 2 ? ` · ${st.waiting} s waiting to send` : ""}`
      : v.supported
        ? ""
        : "Recording needs the A² Golf app";
    const hint = this.el.querySelector(".vp-hint");
    hint.hidden = !v.hint;
    hint.textContent = v.hint ?? "";
    const saved = v.saved.sessions ? `${v.saved.sessions} recording${v.saved.sessions === 1 ? "" : "s"}` : "";
    this.el.querySelector(".vp-status").textContent = [saved && `Saved this time: ${saved}.`, v.lastFile && `Last: ${v.lastFile.file}`].filter(Boolean).join(" ");
  }

  // ---- The recordings kept ------------------------------------------------------------

  // How much of the allowance is used, what the next recording would push
  // out, and the list: name, size, date, Keep, Delete.
  renderLibrary() {
    this.renderReplays();
    const v = this.video;
    const lib = v.library;
    const use = this.el.querySelector(".vp-use");
    const room = this.el.querySelector(".vp-room");
    const table = this.el.querySelector(".vp-recs");
    const limitBox = this.el.querySelector("[data-limit]");
    if (!lib) {
      use.textContent = "The recordings can't be listed - is the local server running?";
      room.textContent = "";
      table.innerHTML = "";
      return;
    }
    if (this.doc.activeElement !== limitBox) limitBox.value = String(lib.retention?.sessionMaxGB ?? "");
    const u = v.use();
    const recs = v.recordings();
    use.textContent = `${sizeText(u.used)} of ${sizeText(u.limit)} used${u.kept ? ` · ${u.kept} kept (${sizeText(u.keptBytes)}) not counted` : ""}${v.recording ? ` · recording now: ${sizeText(v.session?.bytes ?? 0)}` : ""}`;
    const goes = new Set(u.goes.map((c) => c.id));
    const names = u.goes.map((c) => c.file);
    let warn = "";
    if (names.length) warn = `${v.recording ? "When this recording stops" : "When the next recording finishes"}, ${names.length === 1 ? `"${names[0]}" will be deleted` : `${names.length} recordings will be deleted (the oldest: "${names[0]}")`} to stay within ${sizeText(u.limit)}. Tick Keep on any you want, or raise the allowance.`;
    else if (recs.some((c) => !c.keep) && u.minutesLeft != null && u.minutesLeft < 60) warn = `About ${u.minutesLeft} min of recording at this size before the oldest recording is deleted to make room.`;
    room.textContent = warn;
    room.classList.toggle("warn", !!warn);
    const rows = recs.map(
      (c) => `<tr class="${goes.has(c.id) ? "goes" : ""}">
        <td class="vp-rec-name"><a href="/api/clips/file/${encodeURIComponent(c.file)}" target="_blank" rel="noopener">${esc(c.file)}</a></td>
        <td class="vp-num">${sizeText(c.bytes)}</td>
        <td class="vp-num">${esc(when(c.at))}${c.length ? ` · ${esc(minutes(c.length))}` : ""}</td>
        <td><label class="check" title="Never deleted to make room"><input type="checkbox" data-keep="${esc(c.id)}" ${c.keep ? "checked" : ""}> Keep</label></td>
        <td><button data-del="${esc(c.id)}" title="Delete this recording now">Delete</button></td>
      </tr>`,
    );
    if (v.recording) rows.unshift(`<tr class="now"><td class="vp-rec-name">● Recording now</td><td class="vp-num">${sizeText(v.session?.bytes ?? 0)}</td><td class="vp-num">${esc(v.elapsedText())}</td><td colspan="2" class="muted small">never deleted</td></tr>`);
    table.innerHTML = rows.length ? rows.join("") : `<tr><td class="muted small">No recordings yet.</td></tr>`;
  }

  // Every saved replay (sim/clips.mjs savedReplays), a shot a row: when,
  // whose, which club and how far, Watch (every angle, here) and Delete.
  renderReplays() {
    const lib = this.video.library;
    const use = this.el.querySelector(".vp-saved-use");
    const table = this.el.querySelector(".vp-saved-list");
    if (!lib) {
      use.textContent = "The saved replays can't be listed - is the local server running?";
      table.innerHTML = "";
      return;
    }
    const shots = savedReplays(lib.clips);
    const clips = shots.reduce((n, s) => n + s.clips.length, 0);
    use.textContent = shots.length
      ? `${shots.length} shot${shots.length === 1 ? "" : "s"} saved (${clips} clip${clips === 1 ? "" : "s"}): ${sizeText(lib.bytes ?? 0)} of ${lib.retention?.maxGB ?? 5} GB${lib.retention?.maxDays ? `, none older than ${lib.retention.maxDays} days` : ""} - when they're over it, the oldest go first (Menu, Cameras & video, Saved clips up to).`
      : "No saved replays yet.";
    if (this.watching && !shots.some((s) => s.key === this.watching)) this.watch(null);
    table.innerHTML = shots
      .map(
        (s) => `<tr class="${s.key === this.watching ? "on" : ""}">
        <td class="vp-num">${esc(when(s.at))}</td>
        <td class="vp-saved-words">${esc(replayWords(s, MODE_NAMES))}</td>
        <td class="muted small">${esc(s.clips.map((c, i) => c.angle ?? `Camera ${i + 1}`).join(", "))}</td>
        <td class="vp-num">${sizeText(s.bytes)}</td>
        <td><button data-watch="${esc(s.key)}">Watch</button></td>
        <td><button data-del-shot="${esc(s.key)}" title="Delete this shot's saved replays now">Delete</button></td>
      </tr>`,
      )
      .join("");
  }

  // A saved shot's angles side by side above the list, each from the
  // shot's pre-roll (as a replay starts), or none (key null).
  watch(key) {
    const box = this.el.querySelector(".vp-saved-watch");
    const shot = key ? savedReplays(this.video.library?.clips).find((s) => s.key === key) : null;
    this.watching = shot?.key ?? null;
    for (const v of box.querySelectorAll("video")) v.pause();
    box.hidden = !shot;
    if (!shot) {
      box.innerHTML = "";
      for (const tr of this.el.querySelectorAll(".vp-saved-list tr")) tr.classList.remove("on");
      return;
    }
    this.watchSpeed ??= 1;
    box.innerHTML = `<div class="vp-saved-head"><b>${esc(replayWords(shot, MODE_NAMES))}</b> <span class="muted small">${esc(when(shot.at))}</span>
        <span class="vp-spacer"></span>
        <button data-act="watch-play">Play from the shot</button>
        <button data-act="watch-speed">${speedWords(this.watchSpeed)}</button>
        <button data-act="watch-close">Close</button></div>
      <div class="vp-saved-views">${shot.clips
        .map((c, i) => `<figure><figcaption>${esc(c.angle ?? `Camera ${i + 1}`)}</figcaption><video src="/api/clips/file/${encodeURIComponent(c.file)}" data-offset="${c.offset}" preload="auto" playsinline muted controls></video></figure>`)
        .join("")}</div>`;
    for (const v of box.querySelectorAll("video")) {
      v.addEventListener("loadedmetadata", () => {
        const at = Number(v.dataset.offset) || 0;
        v.currentTime = Math.min(at, Math.max(0, (v.duration || at) - 0.1));
        v.playbackRate = this.watchSpeed;
      });
    }
    this.renderReplays();
  }
  // Every angle from the shot's pre-roll, together.
  playWatched() {
    for (const v of this.el.querySelectorAll(".vp-saved-watch video")) {
      v.currentTime = Number(v.dataset.offset) || 0;
      v.playbackRate = this.watchSpeed ?? 1;
      v.play().catch(() => {});
    }
  }

  // The allowance typed (1 - 500 GB): a smaller one that would delete
  // recordings now asks first, naming them (limits.js).
  async changeLimit(t) {
    const win = this.doc.defaultView;
    const r = await changeLimit("sessions", t.value, { confirm: (q) => win.confirm(q), toast: this.toast });
    await this.video.loadLibrary();
    if (!r) this.renderLibrary();
  }

  // While it's open the panel has the keyboard: Esc closes it, the arrows
  // move the picked layer (Shift: size it), Delete... is left to boxes.
  key(e) {
    if (!this.open) return false;
    if (e.key === "Escape") {
      e.preventDefault();
      this.show(false);
      return true;
    }
    const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const tag = e.target?.tagName;
    if (arrows[e.key] && this.selected && !["INPUT", "SELECT", "TEXTAREA"].includes(tag)) {
      e.preventDefault();
      const { w: W, h: H } = sizeOf(this.video.settings);
      const L = this.video.layout;
      const l = L.layers.find((x) => x.id === this.selected);
      if (!l) return true;
      const r = layerPixels(l, W, H);
      // A step of 8 pixels (of 1080p); with Ctrl, 1.
      const [dx, dy] = arrows[e.key].map((v) => v * (e.ctrlKey || e.metaKey ? 1 : 8) * (W / PLACE_W));
      // Sizing: the picked one. Moving: those picked, or its group, with it.
      if (e.shiftKey) this.commit(placeLayer(L, l.id, { ...r, w: r.w + dx, h: r.h + dy }, { W, H, edges: "se", snap: false }));
      else this.commit(moveLayers(L, movingIds(L, l.id, this.picked), dx, dy, { W, H, snap: false }));
      return true;
    }
    // Shift + V still starts and stops recording with the panel open.
    if (e.shiftKey && (e.key === "V" || e.key === "v") && !["INPUT", "TEXTAREA"].includes(tag)) return false;
    return true;
  }
}

// Watching a saved replay: normal speed, then half and a quarter.
const WATCH_SPEEDS = [1, 0.5, 0.25];
const speedWords = (v) => (v === 1 ? "Normal speed" : `${v}× slow motion`);

// "29 Sep 14:05": when a recording was begun.
function when(at) {
  const d = new Date(at);
  if (!Number.isFinite(d.getTime())) return "";
  return `${d.getDate()} ${d.toLocaleString("en-GB", { month: "short" })} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
// "40 s", "42 min", "1 h 5 min".
function minutes(sec) {
  if (sec < 60) return `${Math.max(1, Math.round(sec))} s`;
  const m = Math.round(sec / 60);
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${Math.max(1, m)} min`;
}

// A setting with an exact number beside its slider (the owner: "Text size,
// border size etc all need to be given a specific number so we can make
// sure all border areas 5 pixels thick"): both change it, the number box
// typed or stepped. zero: what 0 means, said beside it.
function numRange(label, key, value, { min, max, step = 1, unit = "px", zero = "", pct = false } = {}) {
  const shown = pct ? Math.round(value * 100) : value;
  const attr = pct ? `data-pct="${key}"` : `data-opt="${key}"`;
  return `<label class="vp-numrange">${esc(label)} <input type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-opt="${key}"><input type="number" class="vp-num" min="${pct ? Math.round(min * 100) : min}" max="${pct ? Math.round(max * 100) : max}" step="${pct ? 1 : step}" value="${shown}" ${attr}><span class="muted small">${esc(pct ? "%" : unit)}${zero && !value ? ` - ${esc(zero)}` : ""}</span></label>`;
}

// A picture's (the game's, a camera's) rounded corners and border.
function pictureLook(l) {
  const out = [numRange("Rounded corners", "radius", l.radius, { min: 0, max: MAX_RADIUS, step: 1, zero: "square" })];
  out.push(`<label class="check"><input type="checkbox" data-opt="border" ${l.border ? "checked" : ""}> Border</label>`);
  if (l.border) {
    out.push(
      numRange("Border thickness", "borderWidth", l.borderWidth, { min: 0, max: MAX_LINE, step: 1, zero: "usual (about 4)" }),
      `<div class="vp-opt"><span>Border colour</span><div class="vp-swatches" role="group">${COLOURS.map((c) => `<button data-swatch="borderColour" data-value="${c}" class="${l.borderColour === c ? "on" : ""}" title="${esc(COLOUR_NAMES[c])}" style="--sw:${c}"></button>`).join("")}</div></div>`,
    );
  }
  return out.join("");
}

// A background box as a container (sim/container.mjs): laying out the rest
// of its group in it, how, and its gap and padding. n: how many it holds.
function containerOpts(l, n) {
  const f = l.fill;
  const how = f?.how ?? null;
  const out = [`<h4>Container</h4>`];
  out.push(
    `<div class="vp-opt"><span>Lay out its group in it</span><div class="vp-choice" role="group">${FILL_HOW.map((h) => `<button data-fill-how="${h}" class="${how === h ? "on" : ""}">${esc(FILL_HOW_NAMES[h])}</button>`).join("")}<button data-fill-how="" class="${how ? "" : "on"}">Off</button></div></div>`,
  );
  if (f) {
    out.push(`<p class="muted small">Holding ${n} - each the same size, ${f.gap} px apart, ${f.pad} px in from its edges. Group another with it to add it; size or move the box and they follow.</p>`);
    out.push(
      `<div class="vp-crop-row"><label>Gap <input type="number" class="vp-num" data-fill="gap" value="${f.gap}" min="0" max="${FILL_MAX}" step="1">px</label><label>Padding <input type="number" class="vp-num" data-fill="pad" value="${f.pad}" min="0" max="${FILL_MAX}" step="1">px</label>${how === "grid" ? `<label>Across <input type="number" class="vp-num" data-fill="cols" value="${f.cols}" min="1" max="8" step="1"></label>` : ""}</div>`,
    );
  } else out.push(`<p class="muted small">Off: the box is just a backing. Pick it with others (Shift + click) and use Put them in a container to fill it.</p>`);
  return out.join("");
}

// A words layer's look: its backing, its words' size, colour and line,
// labels and units, corners and outline - and the tiles' arrangement.
function styleOpts(l) {
  const swatches = (key, list, names) =>
    `<div class="vp-swatches" role="group">${list.map((c) => `<button data-swatch="${key}" data-value="${c}" class="${l[key] === c ? "on" : ""}" title="${esc(names[c])}" style="--sw:${c}"></button>`).join("")}</div>`;
  const choice = (key, list, names) => `<div class="vp-choice" role="group">${list.map((v) => `<button data-swatch="${key}" data-value="${v}" class="${l[key] === v ? "on" : ""}">${esc(names[v])}</button>`).join("")}</div>`;
  const check = (key, words) => `<label class="check"><input type="checkbox" data-opt="${key}" ${l[key] ? "checked" : ""}> ${esc(words)}</label>`;
  const solid = () => numRange("How solid", "bgAlpha", l.bgAlpha, { min: 0, max: 1, step: 0.05, pct: true });
  const corners = () => (l.rounded ? numRange("Corners", "cornerPx", l.cornerPx ?? 0, { min: 0, max: MAX_RADIUS, step: 1, zero: "as the box's size" }) : "");
  const out = [`<h4>Look</h4>`];
  // The mini map: how see-through, its corners and outline.
  if (l.kind === "minimap") {
    out.push(solid());
    out.push(`<div class="vp-opt"><span>Outline colour</span>${swatches("accent", COLOURS, COLOUR_NAMES)}</div>`);
    out.push(`<div class="vp-ticks">${check("rounded", "Rounded corners")}${check("outline", "Outline")}</div>`);
    out.push(corners());
    if (l.outline) out.push(thickness(l));
    return out.join("");
  }
  // A background box: its backing, colour, how solid, corners and outline.
  if (l.kind === "box") {
    out.push(`<div class="vp-opt"><span>Backing</span>${choice("bg", BACKINGS, BACKING_NAMES)}</div>`);
    if (l.bg !== "none") out.push(`<div class="vp-opt"><span>Colour</span>${swatches("bgColour", BACKING_COLOURS, BACKING_COLOUR_NAMES)}</div>`);
    if (l.bg === "panel") out.push(solid());
    out.push(`<div class="vp-ticks">${check("rounded", "Rounded corners")}${check("outline", "Outline")}</div>`);
    out.push(corners());
    if (l.outline) out.push(`<div class="vp-opt"><span>Outline colour</span>${swatches("accent", COLOURS, COLOUR_NAMES)}</div>`, thickness(l));
    return out.join("");
  }
  out.push(`<div class="vp-opt"><span>Backing</span>${choice("bg", BACKINGS, BACKING_NAMES)}</div>`);
  if (l.bg !== "none") out.push(`<div class="vp-opt"><span>Backing colour</span>${swatches("bgColour", BACKING_COLOURS, BACKING_COLOUR_NAMES)}</div>`);
  if (l.bg === "panel") out.push(solid());
  if (l.kind !== "flight") {
    // The text's size exactly (its biggest words, 1080p pixels), or as big
    // as fits the box - the slider's share of that.
    out.push(numRange("Text size", "textPx", l.textPx ?? 0, { min: 0, max: MAX_TEXT_PX, step: 1, zero: "as fits the box" }));
    if (!(l.textPx > 0)) out.push(`<label>As fits, at <input type="range" min="${TEXT_SCALE.min}" max="${TEXT_SCALE.max}" step="0.05" value="${l.textScale}" data-opt="textScale"> <span class="muted small">${Math.round(l.textScale * 100)}%</span></label>`);
    out.push(`<div class="vp-opt"><span>Line up</span>${choice("align", ALIGNS, ALIGN_NAMES)}</div>`);
    out.push(`<div class="vp-opt"><span>Words</span>${swatches("colour", COLOURS, COLOUR_NAMES)}</div>`);
  }
  out.push(`<div class="vp-opt"><span>Accent</span>${swatches("accent", COLOURS, COLOUR_NAMES)}</div>`);
  if (l.kind === "tiles") {
    out.push(`<div class="vp-opt"><span>Arrange</span>${choice("arrange", ARRANGES, ARRANGE_NAMES)}</div>`);
    if (l.arrange === "grid") out.push(`<label>Across <input type="number" min="1" max="8" value="${l.cols}" data-opt="cols"></label>`);
  }
  const ticks = [];
  if (["tiles", "stat", "field"].includes(l.kind)) ticks.push(check("labels", "Labels"));
  if (["tiles", "stat"].includes(l.kind)) ticks.push(check("units", "Units"));
  ticks.push(check("rounded", "Rounded corners"), check("outline", "Outline (accent)"), check("shadow", "Shadow on the words"));
  out.push(`<div class="vp-ticks">${ticks.join("")}</div>`);
  out.push(corners());
  if (l.outline) out.push(thickness(l));
  return out.join("");
}

// How thick an outline is: pixels of a 1080p picture, or (0) as the box's
// size has it.
function thickness(l) {
  return numRange("Outline thickness", "outlineWidth", l.outlineWidth, { min: 0, max: MAX_LINE, step: 1, zero: "as the box's size" });
}

// A layer's name in the list: "Camera 1: Face on".
function layerName(l, cams) {
  if (l.kind === "camera") return `Camera ${l.slot + 1}${cams[l.slot] ? `: ${cams[l.slot].name}` : " (not chosen)"}`;
  if (l.kind === "title" && l.text) return `Title: ${l.text}`;
  if (l.kind === "stat") return TILES[l.stat]?.label ?? LAYER_NAMES.stat;
  if (l.kind === "flight") return `${LAYER_NAMES.flight} ${l.view === "above" ? "from above" : "from the side"}`;
  if (l.kind === "field") return INFO_FIELD_NAMES[l.field] ?? LAYER_NAMES.field;
  if (l.kind === "text") return `“${l.text}”`;
  return LAYER_NAMES[l.kind];
}
