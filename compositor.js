// The recording's picture: the active layout (sim/videolayout.mjs) drawn
// into a canvas of its own, off screen, at the recording's frame rate -
// the game's picture, the cameras, the shot data tiles and the words.
// Nothing here is ever shown on the projector or changes the controls
// window; the recorder (videorec.js) records the canvas, and the layout
// designer (videopanel.js) shows a small copy of it while it's open.
//
// It runs in the game window's page, where the renderer is, so it doesn't
// need the controls window open. The game's picture is copied straight
// from the WebGL canvas right after the renderer has drawn a frame, in the
// same task (app.js's animation loop calls frame() after render()), so the
// drawing buffer still holds the picture without preserveDrawingBuffer
// (which would cost every frame, recording or not): one copy on the
// graphics card per recorded frame. The cameras are drawn from video
// elements of their own on the CameraManager's streams (the same stream,
// not the device opened again), playing only while the compositor is.
// The words are drawn into a small canvas per layer, redrawn only when
// they change, and copied on each frame.

import { layerPixels, coverSource, radiusAt, cleanStyle } from "./sim/videolayout.mjs";
import { textMul, cornerOf } from "./sim/layerstyle.mjs";
import { isPlain, viewSize } from "./sim/camview.mjs";
import { drawView } from "./camview.js";
import { transitionFrame } from "./sim/videoscenes.mjs";
import { shotTiles, tileLayout, playerLine, infoLines, infoField, INFO_FIELD_NAMES, FIELD_SAMPLES, clockText } from "./sim/videotiles.mjs";
import { layerAlpha, shownIn, shotPhase } from "./sim/shotphase.mjs";
import { drawFlightPath } from "./flightdraw.js";
import { drawHole } from "./coursemap.js";
import { letterAt, depthLayers, wordFit, RIM_EM } from "./sim/scoreword.mjs";

import { drawCard as drawRoundCard } from "./roundcard.js";
import { drawStandings } from "./finishstandings.js";
import { rasterize } from "./domraster.js";
import { SHORT_NAME } from "./sim/clips.mjs";
import { HELD_EVERY_MS, LOST_LINE, heldSize } from "./sim/gamepicture.mjs";

// The video's card going fades out into the picture this long (ms).
const CARD_OUT_MS = 450;
// A card from the game window (the scorecard: drawCards) is drawn again
// from the page this often while it's up (ms) - its words change (the
// countdown, Loading... to Next hole) - and copied each frame between.
const PAGE_CARD_MS = 250;
// How often the game's video's page piece (setPage) is drawn again from the
// page (its canvases are drawn every frame).
const PAGE_MS = 120;

const FONT = `"Segoe UI", "Helvetica Neue", Arial, sans-serif`;
const ACCENT = "#ffd23f";
const PANEL = "rgba(8, 14, 10, 0.72)";
const MUTED = "rgba(231, 239, 232, 0.72)";
// How often the words' data is asked for (the overlay can be dear).
const INFO_MS = 250;
// Pictures a second for the game window's copy (videomonitor.js), and the
// command centre's Game screen box switched to the recording ("mirror":
// ccwidgets.js), while not recording; recording, it's the recording's own.
const MONITOR_FPS = 30;

export class Compositor {
  // gameCanvas: the renderer's canvas. cameras: the CameraManager. info():
  // { shot, player, club, mode, overlay } - the last shot and what's
  // happening, for the words.
  constructor({ gameCanvas, cameras, info = () => ({}) }) {
    this.game = gameCanvas;
    this.cameras = cameras;
    this.info = info;
    this.canvas = document.createElement("canvas");
    this.canvas.width = 1920;
    this.canvas.height = 1080;
    this.g = this.canvas.getContext("2d", { alpha: false });
    this.layout = { layers: [] };
    this.fps = 30;
    // Why it's drawing: "record" (every frame at fps) and/or "preview" (the
    // designer: a few a second). Neither: nothing is drawn or decoded.
    this.users = new Set();
    this.last = -Infinity;
    this.videos = new Map(); // cam.id -> <video>
    this.cache = new Map(); // layer id -> { key, canvas }
    this.data = null;
    this.dataAt = -Infinity;
    this.frames = 0;
    this.drawMs = 0;
    this.track = null;
    // The designer's preview can show the picture as it is at one time of
    // the shot ("address", "flight", "after"; null: as it is now), so
    // layers shown only then can be placed.
    this.previewPhase = null;
    // The game's picture lost (the graphics process crashed: setGameLost)
    // and a copy of it kept to hold meanwhile (sim/gamepicture.mjs).
    this.gameLost = false;
    // The game's canvas drawn wider than the screen: its parts (setGameWindows).
    this.gameWindows = null;
    this.held = null;
    this.heldAt = -Infinity;
    cameras.onChange(() => this.syncVideos());
  }

  // The game's picture lost or back (app.js, from the card's reset).
  setGameLost(lost) {
    this.gameLost = !!lost;
  }

  // The game's picture drawn wider than the screen (app.js resize, sim/
  // viewoffset.mjs wideFrame): { screen, centred }, each { x, w } as shares
  // of the canvas's width - the part the screen shows, and the part centred
  // on the target line - or null when the canvas is the screen's picture.
  setGameWindows(win) {
    this.gameWindows = win ?? null;
  }

  // Whether a game layer shown wants the picture centred on the target line
  // (sim/videolayout.mjs centred): app.js draws it wide while it does and
  // something is being drawn here.
  // (Only while it's being recorded, or laid out in the designer: drawn
  // wide, the picture is a third and more pixels more - with the centre
  // moved 15%, 2496 across for a 1920 screen - and the command centre's
  // monitor box alone kept it wide all through play, recording or not: the
  // owner's range tee at 42 frames a second where it had been 53. The
  // monitor shows the screen's part until the recording starts.)
  wantsCentredGame() {
    if (!this.users.has("record") && !this.users.has("preview")) return false;
    return !!this.layout?.layers?.some((l) => l.kind === "game" && l.on && l.centred !== false);
  }

  // The part of the game's canvas a game layer shows, in its pixels:
  // { x, w, h } - centred on the target line if it asks and the picture's
  // drawn wide, else the screen's part (all of it, usually).
  gamePart(layer) {
    const c = this.game;
    const W = c?.width ?? 0;
    const H = c?.height ?? 0;
    const win = this.gameWindows;
    const part = win ? (layer?.centred !== false ? (win.centred ?? win.screen) : win.screen) : null;
    return part ? { x: part.x * W, w: part.w * W, h: H } : { x: 0, w: W, h: H };
  }

  // A picture layer's source as it's drawn (the designer's cropping, sim/
  // layercrop.mjs): { w, h }, or null with nothing to show.
  sourceSize(layer, cams = this.cameras?.cams ?? []) {
    if (layer?.kind === "game") {
      const p = this.gamePart(layer);
      return p.w > 0 && p.h > 0 ? { w: p.w, h: p.h } : null;
    }
    if (layer?.kind === "camera") {
      const cam = cams[layer.slot];
      const v = cam && this.videos.get(cam.id);
      if (!v || !v.videoWidth) return null;
      const turned = cam.view && !isPlain(cam.view);
      const shown = turned ? viewSize(v.videoWidth, v.videoHeight, cam.view) : { w: v.videoWidth, h: v.videoHeight };
      return shown.w > 0 && shown.h > 0 ? shown : null;
    }
    return null;
  }

  // A copy of the game's picture as it is now, at most once a second while
  // it's there, to hold if it's lost. (Small: it's only shown dimmed.)
  keepGame(now) {
    if (this.gameLost || now - this.heldAt < HELD_EVERY_MS) return;
    // (The centred part, when the picture's drawn wide for it.)
    const part = this.gamePart(this.layout?.layers?.find((l) => l.kind === "game"));
    const size = heldSize(part.w, part.h);
    if (!size) return;
    this.heldAt = now;
    if (!this.held) this.held = document.createElement("canvas");
    if (this.held.width !== size.w || this.held.height !== size.h) Object.assign(this.held, { width: size.w, height: size.h });
    try {
      this.held.getContext("2d").drawImage(this.game, part.x, 0, part.w, part.h, 0, 0, size.w, size.h);
    } catch {
      // Nothing to copy this time.
    }
  }

  // The game's place while its picture is lost: the last copy, dimmed, and
  // the line saying it's coming back - never the empty space.
  drawLostGame(layer, r, H) {
    const g = this.g;
    if (this.held) this.drawSource(this.held, this.held.width, this.held.height, layer, r, H);
    g.save();
    g.fillStyle = "rgba(0, 0, 0, 0.55)";
    g.fillRect(r.x, r.y, r.w, r.h);
    g.fillStyle = "#fff";
    g.font = `600 ${Math.round(H / 30)}px ${FONT}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(LOST_LINE, r.x + r.w / 2, r.y + r.h / 2, r.w - 24);
    g.restore();
  }

  get active() {
    return this.users.size > 0;
  }

  setSize(w, h) {
    if (this.canvas.width === w && this.canvas.height === h) return;
    this.canvas.width = w;
    this.canvas.height = h;
    this.cache.clear();
  }

  // A new layout (a scene: sim/videoscenes.mjs). With a transition other
  // than a cut, and a picture already drawn, the old scene's last picture
  // is kept and the change drawn over `seconds`.
  setLayout(layout, { transition = "cut", seconds = 0 } = {}) {
    const was = this.layout;
    this.layout = layout;
    this.cache.clear();
    this.last = -Infinity;
    // Under the game's video's own layout a scene changing changes nothing
    // in the picture: no transition either.
    if (transition === "cut" || !(seconds > 0) || !this.frames || !this.active || was === layout || this.reelLayout) {
      this.trans = null;
      return;
    }
    this.fromCanvas = copyOf(this.canvas, this.fromCanvas);
    // Timed from the first picture drawn after it (a new mode's first
    // frames can take a while), and held through any stall.
    this.trans = { kind: transition, start: null, drawnAt: null, ms: seconds * 1000 };
  }

  // ---- The game's video (showreel.js) ---------------------------------------------

  // Its own layout while it records, over whichever scene is active (the
  // scenes still switch underneath, and come back when it's gone); null
  // for none.
  setReelLayout(layout) {
    this.reelLayout = layout ?? null;
    this.cache.clear();
    this.last = -Infinity;
  }
  // Its caption, a lower third: { title, lines, top }, or null (top: in a
  // band across the top instead - the designer's, the page under it kept
  // clear of it). Its card over the whole picture: { title, lines, solid },
  // or null (solid: nothing of the game through it). Each fades in; a card
  // going fades out (CARD_OUT_MS) into the picture rather than cutting to
  // it.
  setCaption(caption) {
    this.caption = caption?.title || caption?.lines?.length ? { ...caption, since: performance.now() } : null;
  }
  setCard(card) {
    const now = performance.now();
    const before = this.card;
    // (instant: at full strength from its first frame - the video's
    // opening, before anything else is seen.)
    this.card = card?.title ? { ...card, since: card.instant ? now - 1000 : (before?.since ?? now) } : null;
    this.leaving = !this.card && before ? { ...before, left: now } : null;
  }
  // A piece of the page over the whole picture, drawn as it shows
  // (domraster.js: its boxes and words again every PAGE_MS, its canvases
  // every frame) - the hole editor, as the video uses it - or null.
  setPage(el) {
    this.page = el ?? null;
    this.pageShot = null;
  }
  // Where a finger's tapping the page piece: () => { x, y, down } in the
  // page's pixels, or null for none - drawn as a touch's ring each frame.
  setTouch(get) {
    this.touch = typeof get === "function" ? get : null;
  }

  // What's over the game picture in the game window but not in it, asked
  // for each frame (app.js): () => { banner, replay, cards } - a
  // celebration's banner (celebrate.js bannerFrame), the swing replay
  // (swingreplay.js frame) and the page's cards over the picture
  // (course/buggy.js pictureCards: the scorecard after each hole or on the
  // cart's screen, with the blur behind it), any of them null. Drawn over
  // the game layer, as the game window shows them, so a recording has them
  // too.
  setOverlays(get) {
    this.overlays = typeof get === "function" ? get : null;
  }

  drawReelWords() {
    const W = this.canvas.width;
    const H = this.canvas.height;
    const fade = (since) => Math.min(1, Math.max(0, (performance.now() - since) / 350));
    if (this.page?.isConnected) this.drawPage(W, H);
    // The last card, fading out into the picture.
    const out = this.leaving && performance.now() - this.leaving.left < CARD_OUT_MS ? this.leaving : null;
    if (!out) this.leaving = null;
    for (const [which, item] of [["card", this.card ?? out], ["caption", this.card ? null : this.caption]]) {
      if (!item) continue;
      const box = which === "card" ? { x: 0, y: 0, w: 1, h: 1 } : item.top ? CAPTION_TOP : CAPTION_BOX;
      const r = { x: Math.round(box.x * W), y: Math.round(box.y * H), w: Math.max(1, Math.round(box.w * W)), h: Math.max(1, Math.round(box.h * H)) };
      const key = `${which}|${r.w}x${r.h}|${JSON.stringify([item.title, item.lines, !!item.solid])}`;
      let c = this.cache.get(`reel-${which}`);
      if (!c || c.key !== key) {
        const canvas = c?.canvas ?? document.createElement("canvas");
        canvas.width = r.w;
        canvas.height = r.h;
        const g = canvas.getContext("2d");
        g.clearRect(0, 0, r.w, r.h);
        if (which === "card") drawCard(g, item, r.w, r.h);
        else drawCaption(g, item, r.w, r.h);
        c = { key, canvas };
        this.cache.set(`reel-${which}`, c);
      }
      this.g.save();
      this.g.globalAlpha = item === out ? 1 - (performance.now() - out.left) / CARD_OUT_MS : fade(item.since);
      this.g.drawImage(c.canvas, r.x, r.y);
      this.g.restore();
    }
  }

  // The page piece (setPage) over the whole picture: fitted, its shape
  // kept, the page's own background round it.
  drawPage(W, H) {
    const el = this.page;
    const R = el.getBoundingClientRect();
    if (!(R.width > 0) || !(R.height > 0)) return;
    const k = Math.min(W / R.width, H / R.height);
    const now = performance.now();
    if (!this.pageShot || now - this.pageShot.at > PAGE_MS) {
      const shot = rasterize(el, { scale: k, live: true });
      if (shot) this.pageShot = { ...shot, at: now };
    }
    const shot = this.pageShot;
    if (!shot) return;
    const g = this.g;
    const x0 = (W - R.width * k) / 2;
    const y0 = (H - R.height * k) / 2;
    g.save();
    g.fillStyle = getComputedStyle(el).backgroundColor || "#101814";
    g.fillRect(0, 0, W, H);
    g.drawImage(shot.canvas, x0, y0, R.width * k, R.height * k);
    // Its canvases as they are now (the map, moving as it's used).
    for (const c of shot.live) {
      if (!c.el.isConnected || !(c.el.width > 0)) continue;
      g.globalAlpha = c.alpha;
      g.drawImage(c.el, x0 + c.box.x * k, y0 + c.box.y * k, c.box.w * k, c.box.h * k);
    }
    g.globalAlpha = 1;
    let t = null;
    try {
      t = this.touch?.() ?? null;
    } catch {
      t = null;
    }
    if (t) {
      const x = x0 + (t.x - R.left) * k;
      const y = y0 + (t.y - R.top) * k;
      const r = Math.max(10, H * 0.022) * (t.down ? 0.75 : 1);
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fillStyle = t.down ? "rgba(255, 210, 63, 0.6)" : "rgba(255, 255, 255, 0.32)";
      g.fill();
      g.lineWidth = Math.max(2, H * 0.004);
      g.strokeStyle = "rgba(255, 255, 255, 0.95)";
      g.stroke();
    }
    g.restore();
  }

  // Something wants the picture ("record", "preview"), or no longer does.
  use(who, on) {
    if (on) this.users.add(who);
    else this.users.delete(who);
    this.last = -Infinity;
    this.syncVideos();
  }

  // The canvas as a video track: a frame each time one is drawn (not on a
  // timer), so the recording has exactly the frames drawn.
  videoTrack() {
    if (this.track?.readyState === "live") return this.track;
    const stream = this.canvas.captureStream(0);
    this.track = stream.getVideoTracks()[0];
    return this.track;
  }

  // A video element per open camera while drawing; none otherwise (a
  // camera nobody is drawing isn't decoded twice).
  syncVideos() {
    const want = new Map();
    if (this.active) for (const cam of this.cameras.cams) {
      const s = this.cameras.state(cam.id).stream;
      if (s) want.set(cam.id, s);
    }
    for (const [id, v] of this.videos) {
      if (want.get(id) === v.srcObject) continue;
      v.pause();
      v.srcObject = null;
      this.videos.delete(id);
    }
    for (const [id, stream] of want) {
      if (this.videos.has(id)) continue;
      const v = document.createElement("video");
      v.muted = true;
      v.playsInline = true;
      v.srcObject = stream;
      v.play().catch(() => {});
      this.videos.set(id, v);
    }
  }

  // The animation loop's every frame, just after the game was drawn. Draws
  // one when it's due: at the recording's rate while recording, a few a
  // second for the designer's preview.
  frame(now) {
    if (!this.active) return false;
    // (Shown on the game window and not recording - videomonitor.js -
    // smoother than the designer's preview.)
    const fps = this.users.has("record") ? this.fps : this.users.has("monitor") || this.users.has("mirror") ? MONITOR_FPS : 12;
    const every = 1000 / fps;
    // A couple of ms early is on time (the loop's frames jitter).
    if (now - this.last < every - 2) return false;
    this.last = now - this.last > every * 2 ? now : this.last + every;
    const t0 = performance.now();
    this.draw(now);
    if (this.users.has("record")) this.track?.requestFrame?.();
    this.drawMs = this.drawMs * 0.9 + (performance.now() - t0) * 0.1;
    this.frames++;
    return true;
  }

  // The whole picture, now - in the middle of a change of scene, the new
  // one moving in over the old one's last picture (transitionFrame) - and
  // the game's video's words over it all.
  draw(now = performance.now()) {
    // The game's picture shrunk to the recording's size smoothly: the
    // browser's quick way left the leaves' edges crawling in the video
    // (a canvas forgets this when it's resized, so it's set each time).
    this.g.imageSmoothingEnabled = true;
    this.g.imageSmoothingQuality = "high";
    // Full screen: the screen as it shows, in place of the layout.
    if (this.screen) return this.drawScreen();
    this.drawScene(now);
    this.drawTransition();
    this.drawReelWords();
  }

  // Full screen (videorec.js, what "screen"): `video` - the game window's
  // own picture, captured just as it shows (its numbers, cards and
  // messages with it) - drawn whole in place of the layout, at the
  // recording's size: kept to its shape, with black either side if that
  // isn't the video's. null: back to the layout.
  useScreen(video) {
    this.screen = video ?? null;
  }
  drawScreen() {
    const g = this.g;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const v = this.screen;
    g.fillStyle = "#000";
    g.fillRect(0, 0, W, H);
    if (!(v.readyState >= 2 && v.videoWidth && v.videoHeight)) return;
    const k = Math.min(W / v.videoWidth, H / v.videoHeight);
    const w = v.videoWidth * k;
    const h = v.videoHeight * k;
    g.drawImage(v, (W - w) / 2, (H - h) / 2, w, h);
  }

  drawTransition() {
    const tr = this.trans;
    if (!tr) return;
    const at = performance.now();
    if (tr.start == null) tr.start = at;
    // A stall (more than 0.7 s between pictures - a new mode setting up) doesn't
    // eat the transition: it carries on from where it was.
    if (tr.drawnAt != null && at - tr.drawnAt > 700) tr.start += at - tr.drawnAt - 1000 / 30;
    tr.drawnAt = at;
    const t = (at - tr.start) / tr.ms;
    if (t >= 1 || !this.fromCanvas) {
      this.trans = null;
      return;
    }
    const W = this.canvas.width;
    const H = this.canvas.height;
    this.nextCanvas = copyOf(this.canvas, this.nextCanvas);
    const f = transitionFrame(tr.kind, t);
    const g = this.g;
    g.save();
    g.fillStyle = "#000";
    g.fillRect(0, 0, W, H);
    g.globalAlpha = f.to.alpha;
    g.drawImage(this.nextCanvas, f.to.x * W, f.to.y * H, W, H);
    if (f.from.alpha > 0) {
      g.globalAlpha = f.from.alpha;
      g.drawImage(this.fromCanvas, f.from.x * W, f.from.y * H, W, H);
    }
    g.restore();
  }

  // The layout's picture, now.
  drawScene(now = performance.now()) {
    const g = this.g;
    const W = this.canvas.width;
    const H = this.canvas.height;
    if (now - this.dataAt >= INFO_MS || !this.data) {
      this.dataAt = now;
      try {
        this.data = this.info() ?? {};
      } catch (err) {
        console.warn("The recording's words couldn't be had:", err);
        this.data = {};
      }
    }
    g.fillStyle = "#000";
    g.fillRect(0, 0, W, H);
    const cams = this.cameras.cams;
    // (The designer's picture alone shows samples and missing cameras: the
    // game window's copy - videomonitor.js - is as it would be recorded.)
    const preview = this.users.has("preview") && !this.users.has("record");
    const shot = this.data?.shot ?? null;
    let over = null;
    try {
      over = this.overlays?.() ?? null;
    } catch {
      over = null;
    }
    for (const layer of (this.reelLayout ?? this.layout).layers) {
      if (!layer.on) continue;
      // The round card waits for the round's celebration banner to go,
      // rather than covering half of it.
      if ((layer.kind === "scorecard" || layer.kind === "standings") && over?.banner) continue;
      // In the game's video the banner has the picture to itself, with the
      // title and the caption: the other boxes of words make way.
      if (this.reelLayout && over?.banner && layer.kind !== "game" && layer.kind !== "title") continue;
      // Shown only at one time of the shot: faded in and out. (The
      // designer set to a time: only what shows then - the owner,
      // "the tiles that don't show on that view grey out and don't show in
      // the scene".)
      const alpha = preview && this.previewPhase ? (shownIn(layer.when ?? "always", this.previewPhase) ? 1 : 0) : layerAlpha(layer.when, shot, now);
      if (alpha <= 0.001) continue;
      const r = layerPixels(layer, W, H);
      g.save();
      g.globalAlpha = alpha;
      try {
        if (layer.kind === "flight") this.drawFlight(layer, r, shot, now, H, preview);
        else if (layer.kind === "game") {
          if (this.gameLost) this.drawLostGame(layer, r, H);
          else {
            // (Its part of the canvas: centred on the target line when the
            // picture's drawn wide for it - gamePart.)
            const part = this.gamePart(layer);
            this.drawSource(this.game, part.w, part.h, layer, r, H, null, part.x);
            this.keepGame(now);
          }
          // The swing replay, the page's cards (the scorecard), and a
          // celebration's banner over those, as the game window has them
          // over its picture.
          if (over?.replay) drawReplay(g, over.replay, r);
          if (over?.cards && !this.gameLost) this.drawCards(over.cards, layer, r, H);
          if (over?.banner) drawBanner(g, over.banner, r);
        } else if (layer.kind === "camera") {
          const cam = cams[layer.slot];
          const v = cam && this.videos.get(cam.id);
          if (v && v.readyState >= 2 && v.videoWidth) this.drawSource(v, v.videoWidth, v.videoHeight, layer, r, H, cam.view);
          // Only the designer's preview says a camera is missing; the
          // recording leaves its place empty.
          else if (preview) this.placeholder(r, cam ? `${cam.name}: no picture` : `Camera ${layer.slot + 1}: not chosen`, H);
        } else this.drawWords(layer, r, W, H, preview);
      } catch (err) {
        // One layer failing (a camera unplugged mid-frame) leaves the rest.
        if (!this.warned) console.warn("A recording layer couldn't be drawn:", err);
        this.warned = true;
      }
      g.restore();
    }
  }

  // The flight path (flightdraw.js), drawn as the ball flies; in the
  // designer with no shot yet, a made-up one to place it by.
  drawFlight(layer, r, shot, now, H, preview) {
    const t = shot ? shotPhase(shot, now).t : 1;
    // Its backing as the layer has it, the path over it.
    backing(this.g, r.x, r.y, r.w, r.h, cleanStyle(layer, "flight"), 0.12);
    drawFlightPath(this.g, r, { shot, t, H, view: layer.view, sample: preview, panel: false });
  }

  // A picture (the game, a camera) cropped to the layer, never stretched.
  // view: a camera's turn and crop (sim/camview.mjs) - the layer's own
  // zoom and pan then work within what it keeps.
  // x0: where in src its picture starts (the game's centred part, from a
  // canvas drawn wider than the screen).
  drawSource(src, sw0, sh0, layer, r, H, view = null, x0 = 0) {
    if (!src || !(sw0 > 0) || !(sh0 > 0)) return;
    const g = this.g;
    const turned = view && !isPlain(view);
    const shown = turned ? viewSize(sw0, sh0, view) : { w: sw0, h: sh0 };
    const { sx, sy, sw, sh } = coverSource(shown.w, shown.h, r.w, r.h, layer);
    const rad = radiusAt(layer, H);
    g.save();
    if (rad > 0) {
      roundRect(g, r.x, r.y, r.w, r.h, rad);
      g.clip();
    }
    if (turned) drawView(g, src, sw0, sh0, view, r, { sx, sy, sw, sh });
    else g.drawImage(src, x0 + sx, sy, sw, sh, r.x, r.y, r.w, r.h);
    g.restore();
    if (layer.border) {
      // As thick as it's set (kept for 1080p), or about 4 pixels of 1080p.
      const lw = layer.borderWidth > 0 ? (layer.borderWidth * H) / 1080 : Math.max(2, H / 270);
      g.save();
      g.lineWidth = lw;
      g.strokeStyle = rgba(layer.borderColour ?? "#ffffff", 0.9);
      roundRect(g, r.x + lw / 2, r.y + lw / 2, r.w - lw, r.h - lw, Math.max(0, rad - lw / 2));
      g.stroke();
      g.restore();
    }
  }

  // The game window's cards over its picture - page elements, not in the
  // game's canvas - drawn where they show over it, mapped into the game
  // layer as its picture is (coverSource): each drawn from the page
  // (domraster.js), again every PAGE_CARD_MS, and copied each frame at
  // its place then, faded as it is. `blur` (CSS pixels): the picture
  // blurred behind them, as the cart's screen has it.
  drawCards({ cards = [], blur = 0 } = {}, layer, r, H) {
    const game = this.game;
    const C = game?.getBoundingClientRect?.();
    if (!C || !(C.width > 0) || !(C.height > 0) || !(game.width > 0)) return;
    const g = this.g;
    const { sx, sy, sw, sh } = coverSource(game.width, game.height, r.w, r.h, layer);
    // Page pixels to the recording's: through the canvas's own pixels, as
    // its picture is copied.
    const kx = (game.width / C.width) * (r.w / sw);
    const ky = (game.height / C.height) * (r.h / sh);
    const toX = (cx) => r.x + ((cx - C.left) * (game.width / C.width) - sx) * (r.w / sw);
    const toY = (cy) => r.y + ((cy - C.top) * (game.height / C.height) - sy) * (r.h / sh);
    const rad = radiusAt(layer, H);
    g.save();
    roundRect(g, r.x, r.y, r.w, r.h, rad);
    g.clip();
    if (blur > 0) {
      g.save();
      g.filter = `blur(${(blur * kx).toFixed(1)}px)`;
      g.drawImage(game, sx, sy, sw, sh, r.x, r.y, r.w, r.h);
      g.restore();
    }
    const now = performance.now();
    this.pageCards ??= new WeakMap();
    for (const el of cards) {
      if (!el?.isConnected) continue;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      const opacity = Number(cs.opacity);
      if (!(opacity > 0.01)) continue;
      const B = el.getBoundingClientRect();
      if (!(B.width > 0) || !(B.height > 0)) continue;
      const w = B.width * kx;
      const h = B.height * ky;
      // Drawn from the page at about the size it's copied at (sharp, but no
      // bigger than it needs).
      const scale = Math.min(2, Math.max(1, w / Math.max(1, el.offsetWidth)));
      let kept = this.pageCards.get(el);
      if (!kept || now - kept.at > PAGE_CARD_MS || Math.abs(kept.scale - scale) > 0.25) {
        const raster = rasterize(el, { scale });
        if (!raster) continue;
        kept = { ...raster, at: now, scale };
        this.pageCards.set(el, kept);
      }
      g.save();
      g.globalAlpha *= opacity;
      g.drawImage(kept.canvas, toX(B.left), toY(B.top), w, h);
      g.restore();
    }
    g.restore();
  }

  placeholder(r, text, H) {
    const g = this.g;
    g.save();
    g.fillStyle = "#1a2320";
    g.fillRect(r.x, r.y, r.w, r.h);
    g.fillStyle = MUTED;
    g.font = `600 ${Math.round(H / 40)}px ${FONT}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, r.x + r.w / 2, r.y + r.h / 2, r.w - 16);
    g.restore();
  }

  // ---- The words: drawn once into a layer's own canvas, copied each frame -----

  drawWords(layer, r, W, H, preview = false) {
    const content = this.wordsFor(layer, preview, H);
    if (content == null) return;
    const w = Math.max(1, Math.round(r.w));
    const h = Math.max(1, Math.round(r.h));
    const key = `${w}x${h}|${JSON.stringify(layer)}|${content.key}`;
    let c = this.cache.get(layer.id);
    if (!c || c.key !== key) {
      const canvas = c?.canvas ?? document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const g = canvas.getContext("2d");
      g.clearRect(0, 0, w, h);
      content.draw(g, w, h, H);
      c = { key, canvas };
      this.cache.set(layer.id, c);
    }
    this.g.drawImage(c.canvas, Math.round(r.x), Math.round(r.y));
  }

  // What a words layer shows now: { key, draw(g, w, h, H) }, or null for
  // nothing (the hole info on the range).
  // preview: the designer's picture, where a piece of information with
  // nothing to say yet shows a sample of itself, faint, to be placed.
  wordsFor(layer, preview = false, H = 1080) {
    const d = this.data ?? {};
    // (lineScale: an outline's thickness is kept for 1080p.)
    const st = { ...cleanStyle(layer, layer.kind), lineScale: H / 1080 };
    // A background box: its backing and outline, nothing on it.
    if (layer.kind === "box") return { key: "box", draw: (g, w, h) => backing(g, 0, 0, w, h, st, 0.06) };
    if (layer.kind === "tiles") {
      const tiles = shotTiles(d.shot, layer.tiles);
      if (!tiles.length) return null;
      return { key: tiles.map((t) => t.value).join("|"), draw: (g, w, h, H) => drawTiles(g, tiles, w, h, H, st) };
    }
    if (layer.kind === "player") {
      const text = playerLine({ player: d.player, club: d.club });
      if (!text) return null;
      return { key: text, draw: (g, w, h) => drawLines(g, [text], w, h, st, { bold: true }) };
    }
    if (layer.kind === "info") {
      const lines = infoLines(d.mode, d.overlay);
      if (!lines.length) return null;
      return { key: lines.join("\n"), draw: (g, w, h) => drawLines(g, lines, w, h, st, { first: true }) };
    }
    // One piece of information on its own.
    if (layer.kind === "field") {
      const real = infoField(layer.field, d);
      const text = real || (preview ? FIELD_SAMPLES[layer.field] : "");
      if (!text) return null;
      const label = st.labels ? INFO_FIELD_NAMES[layer.field] : "";
      return {
        key: `${real ? "" : "sample:"}${text}`,
        draw: (g, w, h) => {
          if (!real) g.globalAlpha = 0.45;
          drawLines(g, [text], w, h, st, { bold: true, label });
        },
      };
    }
    if (layer.kind === "text") return { key: layer.text, draw: (g, w, h) => drawLines(g, [layer.text], w, h, st, { bold: true }) };
    // The hole from above, as the game window's map (on the course).
    if (layer.kind === "minimap") {
      const m = d.map;
      if (!m) return preview ? { key: "sample", draw: (g, w, h) => drawLines(g, ["Mini map: on the course"], w, h, st, {}) } : null;
      return { key: m.key, draw: (g, w, h) => drawMiniMap(g, m, w, h, st) };
    }
    if (layer.kind === "stat") {
      const [tile] = shotTiles(d.shot, [layer.stat]);
      if (!tile) return null;
      return { key: tile.value, draw: (g, w, h, H) => drawStat(g, tile, w, h, H, st) };
    }
    if (layer.kind === "title") return { key: layer.text ?? "", draw: (g, w, h) => drawTitle(g, layer.text, w, h, st) };
    // The round card, once a round has finished (roundcard.js).
    if (layer.kind === "scorecard") {
      const c = d.card;
      if (!c) return null;
      return { key: `${c.player}|${c.course}|${c.date}|${c.gross}`, draw: (g, w, h) => drawRoundCard(g, c, w, h) };
    }
    // What the round counted for, with the card (finishstandings.js).
    if (layer.kind === "standings") {
      const b = d.standings;
      if (!b?.length) return null;
      return { key: JSON.stringify(b), draw: (g, w, h) => drawStandings(g, b, w, h) };
    }
    if (layer.kind === "clock") {
      const text = clockText(new Date(), layer.show);
      return { key: text, draw: (g, w, h) => drawLines(g, [text], w, h, st, { bold: true }) };
    }
    return null;
  }
}

function roundRect(g, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  g.beginPath();
  if (g.roundRect) g.roundRect(x, y, w, h, rr);
  else g.rect(x, y, w, h);
}

// The biggest font size (px) at which text fits width, up to max.
function fit(g, text, weight, width, max) {
  let size = Math.max(6, Math.floor(max));
  g.font = `${weight} ${size}px ${FONT}`;
  const m = g.measureText(text).width;
  if (m > width && m > 0) size = Math.max(6, Math.floor((size * width) / m));
  g.font = `${weight} ${size}px ${FONT}`;
  return size;
}

// ---- A words layer's look (sim/videolayout.mjs cleanStyle) --------------------

const DEFAULT_STYLE = cleanStyle({});
// "#rrggbb" at an alpha.
function rgba(hex, a = 1) {
  const n = parseInt(String(hex).slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
// Its colours: the words, the quieter labels and units, the accent.
function inks(s) {
  return { main: s.colour, muted: rgba(s.colour, 0.68), accent: s.accent };
}
// Its backing - a panel, solid or none - with rounded corners and an
// outline if it has them; r: the corner as a share of the shorter side.
function backing(g, x, y, w, h, s, r = 0.14) {
  if (s.bg !== "none") {
    g.fillStyle = s.bg === "solid" ? rgba(s.bgColour, 1) : rgba(s.bgColour, s.bgAlpha);
    roundRect(g, x, y, w, h, cornerOf(s, w, h, r));
    g.fill();
  }
  if (s.outline) {
    // As thick as it's set (kept for 1080p), or as the box's size has it.
    const lw = s.outlineWidth > 0 ? s.outlineWidth * (s.lineScale ?? 1) : Math.max(1.5, Math.min(w, h) * 0.03);
    g.lineWidth = lw;
    g.strokeStyle = s.accent;
    roundRect(g, x + lw / 2, y + lw / 2, w - lw, h - lw, s.rounded ? Math.max(0, cornerOf(s, w, h, r) - lw / 2) : 0);
    g.stroke();
  }
}
// Words with a soft shadow, for words over the picture with no backing.
function shadowed(g, s, on = s.shadow || s.bg === "none") {
  if (on) {
    g.shadowColor = "rgba(0, 0, 0, 0.75)";
    g.shadowBlur = 6;
    g.shadowOffsetY = 2;
  } else {
    g.shadowColor = "transparent";
    g.shadowBlur = 0;
    g.shadowOffsetY = 0;
  }
}
// Where a line of width tw starts in a box from x to x + w, aligned.
const alignedX = (align, x, w, tw) => (align === "center" ? x + (w - tw) / 2 : align === "right" ? x + w - tw : x);

// The shot data: a tile per number, big and clean - the label small
// above, the number big, its unit beside it.
function drawTiles(g, tiles, w, h, H, s = DEFAULT_STYLE) {
  const { cols, rows } = tileLayout(tiles.length, w, h, s);
  const gap = Math.max(4, Math.round(H / 135));
  const tw = (w - gap * (cols - 1)) / cols;
  const th = (h - gap * (rows - 1)) / rows;
  const pad = Math.max(4, Math.min(tw, th) * 0.1);
  // (An exact text size, or the slider's share of what fits: sim/
  // layerstyle.mjs textMul - the number its biggest words.)
  const k = textMul(s, s.labels ? th * 0.5 : th * 0.62);
  const ink = inks(s);
  for (const [i, t] of tiles.entries()) {
    const x = (i % cols) * (tw + gap);
    const y = Math.floor(i / cols) * (th + gap);
    shadowed(g, s, false);
    backing(g, x, y, tw, th, s, 0.12);
    shadowed(g, s);
    g.textBaseline = "alphabetic";
    g.textAlign = "left";
    let lsize = 0;
    if (s.labels) {
      g.fillStyle = ink.muted;
      const label = t.label.toUpperCase();
      lsize = fit(g, label, 600, tw - pad * 2, th * 0.2 * k);
      g.fillText(label, alignedX(s.align, x + pad, tw - pad * 2, g.measureText(label).width), y + pad + lsize);
    }
    // The number, and its unit smaller beside it, together.
    const unit = s.units && t.unit ? ` ${t.unit}` : "";
    g.font = `600 ${Math.round(th * 0.2 * k)}px ${FONT}`;
    const unitW = unit ? g.measureText(unit).width : 0;
    const vsize = fit(g, t.value, 700, tw - pad * 2 - unitW, (s.labels ? th * 0.5 : th * 0.62) * k);
    const vw = g.measureText(t.value).width;
    const usize = Math.round(Math.min(th * 0.2 * k, vsize * 0.45));
    g.font = `600 ${usize}px ${FONT}`;
    const uw = unit ? g.measureText(unit).width : 0;
    const left = alignedX(s.align, x + pad, tw - pad * 2, vw + uw);
    // In the middle of what's under the label.
    const base = y + pad + lsize + (th - pad * 2 - lsize) / 2 + vsize * 0.36;
    g.font = `700 ${vsize}px ${FONT}`;
    g.fillStyle = ink.main;
    g.fillText(t.value, left, base);
    if (unit) {
      g.font = `600 ${usize}px ${FONT}`;
      g.fillStyle = ink.muted;
      g.fillText(unit, left + vw, base);
    }
  }
}

// One number, big: its label small above, the number, its unit beside.
function drawStat(g, t, w, h, H, s = DEFAULT_STYLE) {
  const ink = inks(s);
  const k = textMul(s, s.labels ? h * 0.56 : h * 0.72);
  backing(g, 0, 0, w, h, s, 0.14);
  // An accent bar down the side it's lined up on, as a scoreboard's.
  const bar = s.bg === "none" ? 0 : Math.max(3, w * 0.025);
  if (bar) {
    g.fillStyle = ink.accent;
    const bx = s.align === "right" ? w - bar : 0;
    if (s.align !== "center") {
      roundRect(g, bx, 0, bar, h, cornerOf(s, w, h, 0.14));
      g.fill();
    }
  }
  shadowed(g, s);
  const pad = Math.max(6, Math.min(w, h) * 0.12);
  const inner = { x: pad * 1.3, w: w - pad * 2.6 };
  g.textBaseline = "alphabetic";
  g.textAlign = "left";
  let lsize = 0;
  if (s.labels) {
    g.fillStyle = ink.muted;
    const label = t.label.toUpperCase();
    lsize = fit(g, label, 700, inner.w, h * 0.2 * k);
    g.fillText(label, alignedX(s.align, inner.x, inner.w, g.measureText(label).width), pad + lsize);
  }
  const unit = s.units && t.unit ? ` ${t.unit}` : "";
  const usize = Math.round(h * 0.18 * k);
  g.font = `600 ${usize}px ${FONT}`;
  const uw = unit ? g.measureText(unit).width : 0;
  const vsize = fit(g, t.value, 800, inner.w - uw, (s.labels ? h * 0.56 : h * 0.72) * k);
  const vw = g.measureText(t.value).width;
  const base = s.labels ? h - pad : h / 2 + vsize * 0.36;
  const left = alignedX(s.align, inner.x, inner.w, vw + uw);
  g.fillStyle = ink.main;
  g.fillText(t.value, left, base);
  if (unit) {
    g.font = `600 ${usize}px ${FONT}`;
    g.fillStyle = ink.muted;
    g.fillText(unit, left + vw, base);
  }
}

// Lines of words on a panel, as big as fit. first: the first line in the
// accent; label: a small label above them.
function drawLines(g, lines, w, h, s = DEFAULT_STYLE, { bold = false, first = false, label = "" } = {}) {
  const ink = inks(s);
  backing(g, 0, 0, w, h, s, 0.18);
  shadowed(g, s);
  const pad = Math.max(4, (h * 0.14) / (lines.length + (label ? 0.5 : 0)) + 4);
  // (The lines' size as fits, against an exact one: sim/layerstyle.mjs.)
  const k = textMul(s, ((h - pad * 2 - (label ? (h - pad * 2) * 0.28 : 0)) / lines.length) * 0.78);
  let top = pad;
  g.textAlign = "left";
  if (label) {
    const lh = (h - pad * 2) * 0.28;
    g.textBaseline = "middle";
    g.fillStyle = ink.muted;
    fit(g, label.toUpperCase(), 700, w - pad * 2, lh * 0.8 * k);
    g.fillText(label.toUpperCase(), alignedX(s.align, pad, w - pad * 2, g.measureText(label.toUpperCase()).width), top + lh / 2);
    top += lh;
  }
  const lh = (h - top - pad) / lines.length;
  g.textBaseline = "middle";
  for (const [i, text] of lines.entries()) {
    fit(g, text, bold || i === 0 ? 700 : 500, w - pad * 2, lh * 0.78 * k);
    g.fillStyle = i === 0 && first ? ink.accent : ink.main;
    g.fillText(text, alignedX(s.align, pad, w - pad * 2, g.measureText(text).width), top + lh * (i + 0.5));
  }
}

// The hole's map, drawn at the box's own size (coursemap.js drawHole), in
// rounded corners if the layer has them, as see-through as its backing
// says, with an outline in the accent if asked.
function drawMiniMap(g, m, w, h, s = DEFAULT_STYLE) {
  const c = g.canvas.ownerDocument.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  drawHole(c, m.layout, { ...m.extras, labelScale: Math.max(1, h / 330) * 1.4 });
  g.save();
  roundRect(g, 0, 0, w, h, cornerOf(s, w, h, 0.08));
  g.clip();
  g.globalAlpha *= s.bg === "none" ? 1 : Math.max(0.3, 1 - (1 - s.bgAlpha) * 0.7);
  g.drawImage(c, 0, 0);
  g.restore();
  if (s.outline) backing(g, 0, 0, w, h, { ...s, bg: "none" }, 0.08);
}

// "A² Golf" (SHORT_NAME) with a little flag, and the owner's own words
// after it.
// As wide as its words need, up to w, as the caption is: "A² Golf" alone
// in a box a third of the picture across looked unfinished (the show
// reel, looked at again). The words start clear of the flag's pennant.
function drawTitle(g, text, w, h, s = DEFAULT_STYLE) {
  const ink = inks(s);
  const pad = h * 0.16;
  // (An exact text size: the title's words that many pixels high.)
  const fh = s.textPx > 0 ? (s.textPx * (s.lineScale ?? 1)) / 0.8 : (h - pad * 2) * Math.min(1, s.textScale);
  const words = text ? [[SHORT_NAME, ink.accent, 800], [`  ${text}`, ink.main, 500]] : [[SHORT_NAME, ink.accent, 800]];
  const all = words.map((wd) => wd[0]).join("");
  const flagW = fh * 0.82;
  const size = fit(g, all, 800, w - pad * 2 - flagW, fh * 0.8);
  g.font = `800 ${size}px ${FONT}`;
  const textW = words.reduce((sum, [t, , weight]) => ((g.font = `${weight} ${size}px ${FONT}`), sum + g.measureText(t).width), 0);
  const boxW = Math.min(w, flagW + textW + pad * 2.4);
  const bx = alignedX(s.align, 0, w, boxW);
  backing(g, bx, 0, boxW, h, s, 0.18);
  shadowed(g, s);
  const x0 = bx + (boxW - flagW - textW) / 2;
  const mid = h / 2;
  // The flag: a pole and a pennant.
  const fx = x0 + fh * 0.18;
  const ft = mid - fh / 2;
  g.strokeStyle = ink.main;
  g.lineWidth = Math.max(1.5, fh * 0.07);
  g.beginPath();
  g.moveTo(fx, ft + fh * 0.05);
  g.lineTo(fx, ft + fh);
  g.stroke();
  g.fillStyle = ink.accent;
  g.beginPath();
  g.moveTo(fx, ft + fh * 0.05);
  g.lineTo(fx + fh * 0.5, ft + fh * 0.22);
  g.lineTo(fx, ft + fh * 0.4);
  g.closePath();
  g.fill();
  g.textBaseline = "middle";
  g.textAlign = "left";
  let at = x0 + flagW;
  for (const [t, colour, weight] of words) {
    g.font = `${weight} ${size}px ${FONT}`;
    g.fillStyle = colour;
    g.fillText(t, at, mid);
    at += g.measureText(t).width;
  }
}

// Where the video's caption goes: a lower third, at the foot of the
// picture on the left, clear of the ball (shares of the picture).
const CAPTION_BOX = { x: 0.035, y: 0.79, w: 0.62, h: 0.12 };
// The same at the top (the designer's: showreel.js, .reel-designer keeps
// that band clear).
const CAPTION_TOP = { x: 0.035, y: 0.03, w: 0.62, h: 0.12 };

// The video's caption: a lower third - a panel with an accent bar, the
// title big and its lines under it (or the lines alone, the first the
// bigger). As wide as its words need, up to w: a short caption a short
// box, so it covers no more of the picture than it must.
function drawCaption(g, { title = "", lines = [] }, w, h) {
  const pad = h * 0.16;
  const x = pad + Math.max(4, h * 0.06);
  const width = w - x - pad;
  g.textBaseline = "middle";
  g.textAlign = "left";
  const rows = [title && [title, 700, "#fff"], ...lines.map((l, i) => [l, title || i ? 500 : 700, title || i ? MUTED : "#fff"])].filter(Boolean).slice(0, 3);
  const size = rows.length === 1 ? [0.46] : rows.length === 2 ? [0.32, 0.25] : [0.26, 0.2, 0.2];
  const at = rows.length === 1 ? [0.5] : rows.length === 2 ? [0.36, 0.72] : [0.26, 0.56, 0.8];
  const used = Math.max(
    0,
    ...rows.map(([text, weight], i) => {
      fit(g, text, weight, width, h * size[i]);
      return g.measureText(text).width;
    }),
  );
  const boxW = Math.min(w, Math.max(h * 3, x + used + pad * 1.6));
  g.fillStyle = "rgba(8, 14, 10, 0.78)";
  roundRect(g, 0, 0, boxW, h, h * 0.12);
  g.fill();
  g.fillStyle = ACCENT;
  roundRect(g, 0, 0, Math.max(4, h * 0.06), h, h * 0.12);
  g.fill();
  rows.forEach(([text, weight, colour], i) => {
    fit(g, text, weight, width, h * size[i]);
    g.fillStyle = colour;
    g.fillText(text, x, h * at[i]);
  });
}

// The video's card over the whole picture: the title, and its lines under
// it, on a dark veil. The title about 9% of the picture's height, the lines
// about 3.4%. solid: nothing of the game through it - a deep green, a touch
// lighter in the middle.
function drawCard(g, { title = "", lines = [], solid = false }, w, h) {
  if (solid) {
    const glow = g.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h * 0.45, Math.hypot(w, h) * 0.6);
    glow.addColorStop(0, "#14261b");
    glow.addColorStop(1, "#050a07");
    g.fillStyle = glow;
  } else g.fillStyle = "rgba(6, 12, 9, 0.78)";
  g.fillRect(0, 0, w, h);
  g.textAlign = "center";
  g.textBaseline = "middle";
  const top = h * (lines.length > 2 ? 0.34 : 0.4);
  fit(g, title, 800, w * 0.8, h * 0.09);
  g.fillStyle = "#fff";
  g.fillText(title, w / 2, top);
  g.fillStyle = ACCENT;
  g.fillRect(w / 2 - w * 0.05, top + h * 0.062, w * 0.1, Math.max(3, h * 0.005));
  const first = top + h * 0.14;
  lines.forEach((line, i) => {
    fit(g, line, 500, w * 0.8, h * 0.034);
    g.fillStyle = i === 0 ? "#fff" : MUTED;
    g.fillText(line, w / 2, first + h * i * 0.06);
  });
}

// The swing replay over the game picture r, as the game window shows it
// (style.css .swing-replay): over the whole picture, or a panel 52% wide
// on one side; the cameras side by side (one above the other in a panel),
// each fitted whole on black; its caption under them ("7 iron · 154 yds ·
// ½ speed"). Waiting for the clip: "Replay coming…" on a panel in the
// middle. rep: swingreplay.js frame().
function drawReplay(g, rep, r) {
  const u = r.w / 100;
  g.save();
  g.beginPath();
  g.rect(r.x, r.y, r.w, r.h);
  g.clip();
  g.textAlign = "center";
  g.textBaseline = "middle";
  if (rep.phase !== "showing") {
    const text = rep.caption || "Replay coming…";
    const size = Math.max(12, 4 * u);
    g.font = `800 ${size}px ${FONT}`;
    const pw = Math.min(r.w - 6 * u, g.measureText(text).width + 2.4 * u);
    const ph = size * 1.15 + 2.4 * u;
    const py = r.y + (r.h - ph) / 2;
    g.fillStyle = "#060a08";
    roundRect(g, r.x + (r.w - pw) / 2, py, pw, ph, u);
    g.fill();
    g.fillStyle = "#fff";
    g.fillText(text, r.x + r.w / 2, py + ph / 2, pw - 2.4 * u);
    g.restore();
    return;
  }
  const side = rep.place === "left" || rep.place === "right";
  const fw = side ? r.w * 0.52 : r.w;
  const fx = rep.place === "right" ? r.x + r.w - fw : r.x;
  g.fillStyle = "#060a08";
  g.fillRect(fx, r.y, fw, r.h);
  const pad = 1.2 * u;
  const gap = u;
  const capSize = Math.max(12, (side ? 2.3 : 2.8) * u);
  const capH = rep.caption ? capSize * 1.15 : 0;
  const area = { x: fx + pad, y: r.y + pad, w: fw - pad * 2, h: r.h - pad * 2 - (capH ? capH + gap : 0) };
  const n = rep.videos.length;
  rep.videos.forEach(({ v, view }, i) => {
    const cw = side ? area.w : (area.w - gap * (n - 1)) / n;
    const ch = side ? (area.h - gap * (n - 1)) / n : area.h;
    const cell = { x: side ? area.x : area.x + i * (cw + gap), y: side ? area.y + i * (ch + gap) : area.y, w: cw, h: ch };
    g.save();
    roundRect(g, cell.x, cell.y, cell.w, cell.h, 0.6 * u);
    g.fillStyle = "#000";
    g.fill();
    g.clip();
    const turned = view && !isPlain(view);
    const shown = turned ? viewSize(v.videoWidth, v.videoHeight, view) : { w: v.videoWidth, h: v.videoHeight };
    if (shown.w > 0 && shown.h > 0) {
      const k = Math.min(cell.w / shown.w, cell.h / shown.h);
      const dest = { w: shown.w * k, h: shown.h * k };
      dest.x = cell.x + (cell.w - dest.w) / 2;
      dest.y = cell.y + (cell.h - dest.h) / 2;
      if (turned) drawView(g, v, v.videoWidth, v.videoHeight, view, dest);
      else g.drawImage(v, dest.x, dest.y, dest.w, dest.h);
    }
    g.restore();
  });
  if (rep.caption) {
    g.font = `800 ${capSize}px ${FONT}`;
    g.fillStyle = "#fff";
    g.fillText(rep.caption, fx + fw / 2, r.y + r.h - pad - capH / 2, fw - pad * 2);
  }
  g.restore();
}

// A birdie's word and better's, over the game picture r as the game window
// shows it (celebrate.js showWord, sim/scoreword.mjs): each letter its side
// (layers stepping down and right, front to back) and its face, flying in
// as it does on the page, the same time into its flight (b.age); the line
// under it in a pill.
function drawScoreWord(g, b, r) {
  const word = b.word;
  // As big against the picture as on the page (a 6.4% em), and fitted.
  const size = wordFit(word, r.w, 0.064 * r.w);
  if (!(size > 1) || !(b.opacity > 0)) return;
  const chars = [...word.text];
  g.save();
  g.beginPath();
  g.rect(r.x, r.y, r.w, r.h);
  g.clip();
  g.globalAlpha *= b.opacity;
  g.font = `${word.weight} ${size}px ${FONT}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  const spacing = size * 0.02;
  const widths = chars.map((ch) => (ch === " " ? size * 0.3 : g.measureText(ch).width + spacing));
  const total = widths.reduce((a, w) => a + w, 0);
  const cy = r.y + r.h * (b.low ? 0.64 : 0.23);
  const layers = depthLayers(word);
  let x = r.x + r.w / 2 - total / 2;
  chars.forEach((ch, i) => {
    const w = widths[i];
    const cx = x + w / 2;
    x += w;
    if (ch === " ") return;
    const l = letterAt(word, i, b.age ?? 0);
    if (!(l.alpha > 0.01)) return;
    g.save();
    g.globalAlpha *= l.alpha;
    // Leaned over and tipped back about its foot - tipped back being
    // squashed top to bottom, as the page's rotateX looks from in front.
    g.translate(cx, cy + size * (l.down + 0.3));
    if (l.roll) g.rotate((l.roll * Math.PI) / 180);
    g.scale(l.scale, l.scale * Math.max(0.05, Math.cos((l.tilt * Math.PI) / 180)));
    g.translate(0, -size * 0.3);
    // A soft shadow under it all, then the side, back to front.
    const back = layers.at(-1);
    g.save();
    g.shadowColor = "rgba(0, 0, 0, 0.55)";
    g.shadowBlur = size * 0.12;
    g.fillStyle = back.colour;
    g.fillText(ch, (back.dx + 0.02) * size, (back.dy + 0.05) * size);
    g.restore();
    for (let k = layers.length - 1; k >= 0; k--) {
      g.fillStyle = layers[k].colour;
      g.fillText(ch, layers[k].dx * size, layers[k].dy * size);
    }
    // The face, with the glow round the gold words or the rim round the
    // darkest.
    const face = g.createLinearGradient(0, -size * 0.45, 0, size * 0.45);
    face.addColorStop(0, word.face[0]);
    face.addColorStop(0.52, word.face[1]);
    face.addColorStop(1, word.face[2]);
    g.fillStyle = face;
    if (word.glow) {
      g.shadowColor = word.glow;
      g.shadowBlur = size * 0.3;
    } else if (word.rim) {
      g.shadowColor = word.rim;
      g.shadowBlur = size * RIM_EM;
    }
    g.fillText(ch, 0, 0);
    g.restore();
  });
  if (b.subtitle) {
    const sub = Math.max(14, Math.min(r.w * 0.019, size * 0.36));
    g.font = `700 ${sub}px ${FONT}`;
    const tw = g.measureText(b.subtitle).width;
    const py = cy + size * 0.75 + sub;
    g.fillStyle = "rgba(10, 14, 10, 0.72)";
    roundRect(g, r.x + r.w / 2 - tw / 2 - sub * 0.75, py - sub * 0.7, tw + sub * 1.5, sub * 1.4, sub * 0.7);
    g.fill();
    g.fillStyle = "#fff";
    g.fillText(b.subtitle, r.x + r.w / 2, py);
  }
  g.restore();
}

// A celebration's banner over the game picture r, as the game window
// shows it (style.css .celebrate): centred across the picture a little
// under a quarter of the way down - or below the middle when the camera
// stays on the cup - popping in and fading out as it does there. Gold for
// an eagle and better (with its glint), bright for a birdie, neat for a
// par, plain grey for worse. b: celebrate.js bannerFrame().
function drawBanner(g, b, r) {
  if (b.word) return drawScoreWord(g, b, r);
  const em = (b.size || 1) * 0.064 * r.w;
  if (!(em > 1) || !(b.opacity > 0)) return;
  const gold = b.style === "gold";
  const ink = b.style === "plain" ? `rgba(201, 207, 203, ${b.fade ?? 1})` : "#fff";
  const lines = [
    { text: b.title, weight: b.style === "plain" ? 700 : b.style === "neat" ? 800 : 900, size: em, colour: ink, gap: 0 },
    b.subtitle && { text: b.subtitle, weight: 700, size: em * 0.4, colour: gold ? "#ffe9a6" : ink, gap: em * 0.2 },
    b.detail && { text: b.detail, weight: 600, size: em * 0.28, colour: gold ? "#fff4d0" : ink, gap: em * 0.3, alpha: 0.85 },
  ].filter(Boolean);
  const most = r.w * 0.9 - em * 1.6;
  for (const l of lines) {
    // A long line (a round's totals with friends) is made to fit.
    l.size = Math.min(l.size, fit(g, l.text, l.weight, most, l.size));
    g.font = `${l.weight} ${l.size}px ${FONT}`;
    l.width = g.measureText(l.text).width;
    l.h = l.size * (l === lines[0] ? 1.05 : 1.2);
  }
  const bw = Math.max(...lines.map((l) => l.width)) + em * 1.6;
  const bh = lines.reduce((t, l) => t + l.h + l.gap, 0) + em * 0.46;
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h * (b.low ? 0.64 : 0.23) + (b.rise ?? 0) * em;
  g.save();
  g.beginPath();
  g.rect(r.x, r.y, r.w, r.h);
  g.clip();
  g.globalAlpha *= b.opacity;
  g.translate(cx, cy);
  g.scale(b.scale ?? 1, b.scale ?? 1);
  const x = -bw / 2;
  const y = -bh / 2;
  // The box.
  g.save();
  if (gold) {
    const fill = g.createRadialGradient(0, 0, 0, 0, 0, bw / 2);
    fill.addColorStop(0, "rgba(52, 36, 0, 0.82)");
    fill.addColorStop(1, "rgba(20, 14, 0, 0.78)");
    g.fillStyle = fill;
    g.shadowColor = b.top ? "rgba(255, 200, 40, 0.75)" : "rgba(255, 200, 40, 0.55)";
    g.shadowBlur = em * (b.top ? 0.9 : 0.5);
  } else if (b.style === "bright") {
    const fill = g.createLinearGradient(x, y, x + bw, y + bh);
    fill.addColorStop(0, "rgba(235, 64, 82, 0.92)");
    fill.addColorStop(1, "rgba(255, 140, 66, 0.92)");
    g.fillStyle = fill;
    g.shadowColor = "rgba(0, 0, 0, 0.35)";
    g.shadowBlur = em * 0.4;
    g.shadowOffsetY = em * 0.1;
  } else g.fillStyle = b.style === "neat" ? "rgba(10, 20, 12, 0.9)" : "rgb(48, 52, 50)";
  roundRect(g, x, y, bw, bh, em * 0.28);
  g.fill();
  g.restore();
  const border = gold ? ["#ffd23f", em * (b.top ? 0.07 : 0.05)] : b.style === "bright" ? ["rgba(255, 255, 255, 0.85)", em * 0.04] : b.style === "neat" ? ["rgba(255, 255, 255, 0.35)", Math.max(1, r.w / 1920)] : null;
  if (border) {
    g.lineWidth = border[1];
    g.strokeStyle = border[0];
    roundRect(g, x + border[1] / 2, y + border[1] / 2, bw - border[1], bh - border[1], em * 0.28);
    g.stroke();
  }
  // The words, centred, one under another.
  g.textAlign = "center";
  g.textBaseline = "middle";
  let at = y + em * 0.18;
  for (const [i, l] of lines.entries()) {
    at += l.gap;
    g.save();
    g.font = `${l.weight} ${l.size}px ${FONT}`;
    g.globalAlpha *= l.alpha ?? 1;
    if (i === 0 && gold) {
      // Gold lettering, and its glint running across (the CSS's 300%-wide
      // gradient at --shine).
      const x0 = -l.width / 2 - 2 * l.width * ((b.shine ?? 0) / 100);
      const shine = g.createLinearGradient(x0, 0, x0 + 3 * l.width, 0);
      for (const [stop, c] of [[0, "#f5b700"], [0.38, "#ffe07a"], [0.5, "#fffbe8"], [0.62, "#ffe07a"], [1, "#f5b700"]]) shine.addColorStop(stop, c);
      g.fillStyle = shine;
      g.shadowColor = "rgba(0, 0, 0, 0.6)";
      g.shadowBlur = em * 0.05;
      g.shadowOffsetY = em * 0.04;
    } else {
      g.fillStyle = l.colour;
      if (b.style === "bright") {
        g.shadowColor = "rgba(0, 0, 0, 0.35)";
        g.shadowBlur = l.size * 0.08;
        g.shadowOffsetY = l.size * 0.04;
      }
    }
    g.fillText(l.text, 0, at + l.h / 2);
    g.restore();
    at += l.h;
  }
  g.restore();
}

// A copy of a canvas's picture, in `into` (made, or resized, to fit).
function copyOf(canvas, into = null) {
  const c = into ?? document.createElement("canvas");
  if (c.width !== canvas.width || c.height !== canvas.height) {
    c.width = canvas.width;
    c.height = canvas.height;
  }
  c.getContext("2d").drawImage(canvas, 0, 0);
  return c;
}
