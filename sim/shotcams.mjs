// The shot data screen's cameras (shotscreen.js): a column down its right
// with the live picture from one or two of the owner's webcams, each
// shot's replay played there once it's ready, and back to live after it.
// Always there while a camera is chosen, in the same place whatever the
// shot - a stream crops each box - so the rest of the screen is laid out
// round it. Pure: which cameras, when to look for the replay, and what
// comes after each time round.

import { cleanCameraSettings } from "./cameras.mjs";
import { pickReplayCams } from "./swingreplay.mjs";
import { viewSize } from "./camview.mjs";

// At most this many cameras (two side on and one looking down, say); the
// replay looked for this long after the shot (it's ready once the seconds
// after it have been recorded), this often, and given up on after this.
export const SHOT_CAMS = { max: 3, firstLook: 2500, every: 1000, giveUp: 25000 };
// A camera's × on the shot screen asks the game (which keeps the cameras'
// settings) to take it off the shot screen, over this channel:
// { offShotScreen: camera id }.
export const CAM_CHANNEL = "golfsim-cams";

// The cameras the column shows: the swing replay's first (the Cameras
// panel's choice, or the first one or two with Replay on), then the rest
// that are ticked, up to three - each one that shows on the shot screen
// (its Shot screen tick in Cameras). With replays off, live only.
//   saved  the cameras' settings as kept (loadSetting("cameras"))
export function shotScreenCams(saved) {
  const s = cleanCameraSettings(saved);
  const on = s.cams.filter((c) => c.on !== false);
  const picked = pickReplayCams(s.cams, s.swing, { replayOn: s.replay });
  const list = [...picked, ...on.filter((c) => !picked.includes(c))].filter((c) => c.shotScreen !== false).slice(0, SHOT_CAMS.max);
  return list.map((c) => ({ ...c, replay: s.replay && c.replay !== false }));
}

// ---- Where the pictures go -----------------------------------------------------------

// A camera's picture's shape, width over height, as it's shown: turned and
// cropped as the Cameras panel has it (sim/camview.mjs) - a camera on its
// side for down the line is upright, tall and narrow.
export function camAspect(cam) {
  const { w, h } = viewSize(cam.width || 1280, cam.height || 720, cam.view);
  return w > 0 && h > 0 ? w / h : 16 / 9;
}

// The pictures (aspects, width over height) laid out in a w x h area, as
// big as they'll go: one under another, side by side, one across the top
// with the rest below it, or - for three - one down the whole side and the
// other two one under the other beside it (two side on and an upright
// one, say). The way that shows them biggest wins, every one counted
// (sizeScore: one made tiny for the others to grow doesn't). Each picture
// keeps its shape.
// Returns { tiles: [{ x, y, w, h }] in the order given, used: { w, h } }.
// How big a layout's pictures are: each one's size (the side of a square
// as big), added up - so two fair-sized pictures beat a big one and a
// sliver.
export const sizeScore = (tiles) => tiles.reduce((t, r) => t + Math.sqrt(Math.max(0, r.w) * Math.max(0, r.h)), 0);

export function packCams(aspects, area, gap = 10) {
  const n = aspects.length;
  if (!n || !(area.w > 0 && area.h > 0)) return { tiles: [], used: { w: 0, h: 0 } };
  const ways = [];
  // One under another, all as wide.
  {
    const inv = aspects.reduce((t, a) => t + 1 / a, 0);
    const w = Math.min(area.w, (area.h - gap * (n - 1)) / inv);
    let y = 0;
    const tiles = aspects.map((a) => {
      const t = { x: 0, y, w, h: w / a };
      y += t.h + gap;
      return t;
    });
    ways.push(tiles);
  }
  // Side by side, all as tall.
  if (n > 1) {
    const sum = aspects.reduce((t, a) => t + a, 0);
    const h = Math.min(area.h, (area.w - gap * (n - 1)) / sum);
    let x = 0;
    ways.push(
      aspects.map((a) => {
        const t = { x, y: 0, w: h * a, h };
        x += t.w + gap;
        return t;
      }),
    );
  }
  // One across the whole width at the top, the rest laid out below it as
  // best they go (face on across the top, down the line upright under it).
  if (n > 1) {
    for (let i = 0; i < n; i++) {
      const hi = area.w / aspects[i];
      if (hi + gap >= area.h) continue;
      const others = aspects.map((a, k) => k).filter((k) => k !== i);
      const below = packCams(
        others.map((k) => aspects[k]),
        { w: area.w, h: area.h - hi - gap },
        gap,
      );
      const tiles = [];
      tiles[i] = { x: 0, y: 0, w: area.w, h: hi };
      others.forEach((k, m) => (tiles[k] = { ...below.tiles[m], y: below.tiles[m].y + hi + gap }));
      ways.push(tiles);
    }
  }
  // One down the side, two one under the other beside it - either side.
  if (n === 3) {
    for (let i = 0; i < 3; i++) {
      const [j, k] = [0, 1, 2].filter((x) => x !== i);
      const inv = 1 / aspects[j] + 1 / aspects[k];
      // Both columns h tall: the one's width h a, the pair's (h - gap) / inv.
      const h = Math.min(area.h, (area.w - gap + gap / inv) / (aspects[i] + 1 / inv));
      const wi = h * aspects[i];
      const wp = (h - gap) / inv;
      for (const oneLeft of [true, false]) {
        const xi = oneLeft ? 0 : wp + gap;
        const xp = oneLeft ? wi + gap : 0;
        const tiles = [];
        tiles[i] = { x: xi, y: 0, w: wi, h };
        tiles[j] = { x: xp, y: 0, w: wp, h: wp / aspects[j] };
        tiles[k] = { x: xp, y: wp / aspects[j] + gap, w: wp, h: wp / aspects[k] };
        ways.push(tiles);
      }
    }
  }
  const shown = sizeScore;
  const ok = ways.filter((tiles) => tiles.every((r) => r.w > 0 && r.h > 0));
  const best = ok.reduce((a, b) => (shown(b) > shown(a) + 0.5 ? b : a), ok[0] ?? ways[0]);
  const used = {
    w: Math.max(...best.map((r) => r.x + r.w)),
    h: Math.max(...best.map((r) => r.y + r.h)),
  };
  // Across the area, in the middle of it.
  const dx = Math.max(0, (area.w - used.w) / 2);
  return { tiles: best.map((r) => ({ ...r, x: r.x + dx })), used: { w: used.w, h: used.h } };
}

// How wide the camera column is on a screen W wide, its height h: three
// tenths of the screen - and with an upright picture beside others (two
// side on and one down the line, turned on its side), wider, up to about
// two fifths, as far as that still shows a good deal more of them: one
// under another they'd be small, with black down both sides. With room
// left under the pictures (TABLE_ROOM or more) the session table goes
// there (table).
export const CAM_WIDTHS = [0.3, 0.34, 0.38, 0.42];
export const TABLE_ROOM = 160;
export function camColumn(aspects, W, h, gap = 10) {
  if (!aspects.length) return { width: 0, ...packCams([], { w: 0, h: 0 }), table: false };
  const upright = aspects.length > 1 && aspects.some((a) => a < 1);
  const tries = (upright ? CAM_WIDTHS : CAM_WIDTHS.slice(0, 1)).map((f) => {
    const width = Math.round(Math.min(Math.max(340, W * f), W * 0.45));
    const p = packCams(aspects, { w: width, h }, gap);
    return { width, ...p, shown: sizeScore(p.tiles) };
  });
  const most = Math.max(...tries.map((t) => t.shown));
  const pick = tries.find((t) => t.shown >= most * 0.92);
  return { width: pick.width, tiles: pick.tiles, used: pick.used, table: h - pick.used.h - gap >= TABLE_ROOM };
}

// How the replays play there: the swing replay's speed and times round.
export function replayPace(saved) {
  const { swing } = cleanCameraSettings(saved);
  return { speed: swing.speed, loops: swing.loops };
}

// The server's list of a shot's clips (/api/clips/shot/<n>) as each
// camera's: { camId: { url, offset } }, the camera's newest.
export function clipsByCam(got, cams) {
  const out = {};
  for (const c of Array.isArray(got?.clips) ? got.clips : []) {
    if (!c || typeof c.file !== "string" || !cams.some((k) => k.id === c.cam) || out[c.cam]) continue;
    out[c.cam] = { url: `/api/clips/file/${encodeURIComponent(c.file)}`, offset: Number.isFinite(c.offset) ? Math.max(0, c.offset) : 0 };
  }
  return out;
}

// Whether to look again for a shot's replay: some camera still waiting
// for it, and not given up on.
export function lookAgain({ since, waiting }) {
  return waiting > 0 && since < SHOT_CAMS.giveUp;
}

// A replay come to its end: "again" (round once more), "live" (its times
// round done: the live picture back) or "hold" (no live picture here -
// another program has the camera - so the replay stays, round and round,
// until the next shot).
export function afterReplay({ done, loops, live }) {
  if (done < loops) return "again";
  return live ? "live" : "hold";
}

// What a camera's box says at its foot.
export function camWords({ mode, live, problem = null, label = "", speed = 1 }) {
  if (mode === "replay") return `Replay${label ? ` · ${label}` : ""}${speed !== 1 ? ` · ${speed === 0.5 ? "½" : speed === 0.25 ? "¼" : speed}× speed` : ""}`;
  if (mode === "waiting") return live ? "Live · replay coming" : "Replay coming";
  if (live) return "Live";
  return problem ?? "Replays after each shot";
}
