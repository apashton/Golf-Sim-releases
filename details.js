// The command centre's This shot, with separate windows: the shot being
// played, for the laptop, in one box for every mode (sim/thisshot.mjs) -
//
//   - who's hitting and the club (and the one the game suggests, where
//     another's in hand);
//   - the last shot's result line and the note over the picture, whole;
//   - the lie's guidance and the putt's guidance, each line whole (bay
//     content's lie and guide), and any lines a mode gives for the
//     controls alone (bay content's details);
//   - the lie of the land, drawn as the game window draws it;
//   - the situation: the numbers over the picture that aren't the last
//     shot's (those are the Last shot box's, ccwidgets.js) - the distance
//     to the pin, the score, the run holed;
//   - the next shot: a normal swing, a punch, a part swing, something
//     else, or a power (E and Shift + E: recorder.js), to click.
// (The last shot's replay is the Game screen box's: ccwidgets.js.)
//
// The game window keeps its words short and big, to read from the mat;
// what it shortens is here whole. (The messages - toasts - have a box of
// their own: messages.js; the connection is the top bar's.)
//
// It's fed by the bay view (bay.js), so whatever a mode puts in its overlay
// content comes here with nothing more to do. The prompts themselves - the
// cards, the banners, the keys list - are copied onto the controls window
// by promptmirror.js. The element lives in the sim's page, hidden, and goes
// to the controls window with the top bar (screens.js, app.js's parts).

import { thisShot } from "./sim/thisshot.mjs";
import { slopeNumbers, slopeSvg } from "./sim/gametext.mjs";
import { clubName } from "./sim/clubs.mjs";
import { esc } from "./util.js";

export class ShotDetails {
  constructor() {
    this.el = document.createElement("section");
    this.el.className = "shot-details";
    this.el.setAttribute("aria-label", "This shot");
    this.el.innerHTML = `
      <h3>This shot</h3>
      <p class="sd-who" hidden></p>
      <div class="sd-lines"></div>
      <div class="sd-slope" hidden></div>
      <div class="numbers sd-situation" hidden></div>
      <div class="sd-next" hidden></div>`;
    this.on = false;
    this.content = null;
    // The next shot: { on, special, power } (app.js, from the recorder).
    this.next = null;
    // onSpecial(kind): a kind clicked (null: a normal swing). onPower(pw):
    // a power clicked (null: off again).
    this.onSpecial = () => {};
    this.onPower = () => {};
    this.el.querySelector(".sd-next").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      b.blur();
      // (The one lit, again: a normal swing.)
      if (b.dataset.kind) this.onSpecial(b.dataset.kind === "normal" || b.classList.contains("on") ? null : b.dataset.kind);
      else if (b.dataset.pw) this.onPower(b.classList.contains("on") ? null : Number(b.dataset.pw));
    });
  }

  // Shown (and kept up to date) only with separate windows.
  setOn(on) {
    this.on = on;
    if (on) this.render();
  }

  // The bay view's content, as the game window has just drawn it.
  show(content) {
    this.content = content;
    if (this.on) this.render();
  }

  // The next shot as the recorder has it: { on, special, power }.
  setNext(next) {
    this.next = next;
    if (this.on) this.render();
  }

  render() {
    const v = thisShot(this.content, { next: this.next });
    const $ = (sel) => this.el.querySelector(sel);
    const who = $(".sd-who");
    const parts = [];
    if (v.player) parts.push(`<span class="player-dot" style="background:${esc(v.player.colour ?? "")}"></span>${v.player.label ? `${esc(v.player.label)}: ` : ""}<b>${esc(v.player.name)}</b>`);
    if (v.club) parts.push(esc(clubName(v.club)));
    if (v.suggest) parts.push(`<span class="sd-suggest" title="The club the game suggests for this shot (↑ ↓ change club)">suggested: ${esc(clubName(v.suggest))}</span>`);
    // (Each part written only when it's changed: the command centre lays
    // itself out again when what's in a box changes.)
    const put = (el, key, html) => {
      if (this.drawn?.[key] === html) return;
      this.drawn = { ...this.drawn, [key]: html };
      el.innerHTML = html;
    };
    who.hidden = !parts.length;
    put(who, "who", parts.join(" · "));
    // The lie of the land: the game window's tilted tile and its numbers.
    const slope = $(".sd-slope");
    const nums = v.stance ? slopeNumbers(v.stance) : null;
    slope.hidden = !nums;
    const html = nums
      ? `${slopeSvg(v.stance)}<div class="slope-nums">` +
        `<div><span>L–R</span><b>${nums.across.deg}°</b><small>${esc(nums.across.words)}</small></div>` +
        `<div><span>U–D</span><b>${nums.updown.deg}°</b><small>${esc(nums.updown.words)}</small></div></div>`
      : "";
    put(slope, "slope", html);
    put($(".sd-lines"), "lines", v.lines.map(({ kind, text }) => `<p class="sd-${kind}">${esc(text)}</p>`).join(""));
    const sit = $(".sd-situation");
    sit.hidden = !v.situation.length;
    put(
      sit,
      "situation",
      v.situation.map((s) => `<div class="stat${s.accent ? " accent" : ""}${s.tone ? ` ${s.tone}` : ""}"><span>${esc(s.label)}</span><b>${esc(s.value)}${s.unit ? ` <small>${esc(s.unit)}</small>` : ""}</b></div>`).join(""),
    );
    const next = $(".sd-next");
    next.hidden = !v.next;
    if (v.next) {
      // (Not redrawn under a click either: only when what's lit changes.)
      put(
        next,
        "next",
        `<span class="sd-next-label">Next shot</span>` +
          v.next.kinds.map((k) => `<button type="button" data-kind="${k.id}"${k.on ? ' class="on"' : ""}>${esc(k.name)}</button>`).join("") +
          `<span class="sd-next-gap"></span>` +
          v.next.powers.map((p) => `<button type="button" data-pw="${p.pw}"${p.on ? ' class="on"' : ""} title="A part swing at this power, kept with it (Shift + E)">${esc(p.name)}</button>`).join(""),
      );
    }
  }
}
