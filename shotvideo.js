// Watching a shot from the stats page: its own replays, or the session
// recording running when it was hit (sim/clips.mjs clipsForShot), in a
// dialog - one shot, or two side by side (a thin one beside a good one).
// Each from just before the swing, in slow motion if wanted.
import { clipsForShot } from "./sim/clips.mjs";
import { esc } from "./util.js";

const SPEEDS = [1, 0.5, 0.25];

export class ShotVideo {
  constructor() {
    this.clips = [];
    this.dialog = null;
  }

  // The clip index, fresh (a replay saved since the page opened shows).
  async load() {
    try {
      const r = await fetch("/api/clips");
      this.clips = r.ok ? ((await r.json()).clips ?? []) : [];
    } catch {
      this.clips = [];
    }
    return this.clips;
  }

  for(shot) {
    return clipsForShot(this.clips, shot);
  }

  // shots: [{ id, hit, label }], one or two.
  open(shots) {
    const views = shots.map((s) => ({ shot: s, clips: this.for(s), pick: 0 })).filter((v) => v.clips.length);
    if (!views.length) return;
    const d = this.dialogEl();
    let speed = 1;
    const draw = () => {
      d.querySelector(".sv-views").innerHTML = views
        .map((v, i) => {
          const c = v.clips[v.pick];
          const angles = v.clips.length > 1 ? `<div class="sv-angles">${v.clips.map((x, k) => `<button data-view="${i}" data-pick="${k}" class="${k === v.pick ? "on" : ""}">${esc(x.angle ?? (x.kind === "session" ? "Recording" : `Camera ${k + 1}`))}</button>`).join("")}</div>` : "";
          return `<figure class="sv-view"><figcaption>${esc(v.shot.label ?? "")}${c.kind === "session" ? ' <span class="muted small">(session recording)</span>' : ""}</figcaption>
            <video data-view="${i}" src="/api/clips/file/${encodeURIComponent(c.file)}" preload="auto" playsinline muted controls></video>${angles}</figure>`;
        })
        .join("");
      d.classList.toggle("sv-two", views.length > 1);
      for (const vid of d.querySelectorAll("video")) {
        const c = views[Number(vid.dataset.view)];
        const start = c.clips[c.pick].offset ?? 0;
        vid.addEventListener("loadedmetadata", () => {
          vid.currentTime = Math.min(start, Math.max(0, (vid.duration || start) - 0.1));
          vid.playbackRate = speed;
        });
      }
      for (const b of d.querySelectorAll("button[data-pick]")) {
        b.addEventListener("click", () => {
          views[Number(b.dataset.view)].pick = Number(b.dataset.pick);
          draw();
        });
      }
    };
    const videos = () => [...d.querySelectorAll("video")];
    // Both from the moment before the swing, together.
    d.querySelector(".sv-play").onclick = () => {
      for (const vid of videos()) {
        const c = views[Number(vid.dataset.view)];
        vid.currentTime = c.clips[c.pick].offset ?? 0;
        vid.playbackRate = speed;
        vid.play().catch(() => {});
      }
    };
    d.querySelector(".sv-speed").onclick = (e) => {
      speed = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
      e.target.textContent = speed === 1 ? "Normal speed" : `${speed}× slow motion`;
      for (const vid of videos()) vid.playbackRate = speed;
    };
    d.querySelector(".sv-speed").textContent = "Normal speed";
    draw();
    d.showModal();
  }

  dialogEl() {
    if (this.dialog) return this.dialog;
    const d = document.createElement("dialog");
    d.className = "shot-video";
    d.innerHTML = `<div class="sv-views"></div>
      <div class="sv-bar"><button class="sv-play">▶ Play from the swing</button> <button class="sv-speed">Normal speed</button> <button class="sv-close">Close</button></div>`;
    d.querySelector(".sv-close").addEventListener("click", () => d.close());
    // Closed: the videos stop and let go of their files.
    d.addEventListener("close", () => (d.querySelector(".sv-views").innerHTML = ""));
    document.body.append(d);
    this.dialog = d;
    return d;
  }
}
