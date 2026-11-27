// The Messages box (the owner, 15 October 2026: "a notification symbol
// which would make someone look at the message history box ... so can keep
// at least 5 last message on screen rather than pop up and disappear"):
// every message the game gives - a misread taken out of the stats, a shot
// changed in the shot history, a club picked - kept here, newest first,
// with the time, the last TOAST_LOG of them (sim/gametext.mjs logToast),
// the newest lit up for a moment. Over the picture a message is only a
// symbol now (bay.js); this is where its words are.
//
// With separate windows it's a box of the controls window (the command
// centre: arrange.js places it, under This shot), with the game window's
// cards copied in at its top while they're up (promptmirror.js); in the one
// window it opens over the picture from the symbol (click it, or the box's
// × closes it).

import { logToast, TOAST_LOG } from "./sim/gametext.mjs";
import { esc } from "./util.js";

// How long the newest stays lit up.
const FRESH_MS = 6000;

export class MessageBox {
  constructor() {
    this.el = document.createElement("section");
    this.el.className = "msg-box";
    this.el.setAttribute("aria-label", "Messages");
    this.el.innerHTML = `
      <h3>Messages <button type="button" class="msg-close" title="Close">×</button></h3>
      <div class="msg-cards"></div>
      <p class="msg-none">No messages yet</p>
      <ol class="msg-list"></ol>`;
    this.log = [];
    this.open = false;
    // Messages (and cards) that came while the box was out of sight - in a
    // closed drawer, or on another of its tabs: counted, for the drawer's
    // tab to say, until the box is seen (the owner, 20 October 2026: rather
    // than the box popping out of its tab, "staying in the tab and a
    // message number coming up"). inSight(): whether it's showing now
    // (arrange.js says); onUnseen(): the count changed.
    this.unseen = 0;
    this.inSight = () => true;
    this.onUnseen = () => {};
    this.el.querySelector(".msg-close").addEventListener("click", (e) => {
      e.currentTarget.blur();
      this.setOpen(false);
    });
  }

  // A message: kept, newest first.
  add(text, now = Date.now()) {
    const before = this.log;
    this.log = logToast(this.log, text, now, { max: TOAST_LOG });
    if (this.log === before) return;
    this.render(now);
    this.notice();
  }

  // One more come while it's out of sight.
  notice() {
    if (this.inSight()) return;
    this.unseen++;
    this.onUnseen();
  }
  // Seen: none unseen.
  seen() {
    if (!this.unseen) return;
    this.unseen = 0;
    this.onUnseen();
  }

  // Where the game window's cards are copied in the command centre
  // (promptmirror.js): at the top, over the messages, while they want an
  // answer.
  get cardsEl() {
    return this.el.querySelector(".msg-cards");
  }

  // A card showing at the top (promptmirror.js), or none: marked (in the
  // window, the box comes out in front of the boxes below it for it -
  // arrange.js; in a drawer it stays there, its tab counting it), and
  // scrolled to the top to show it. Returns whether that changed.
  setCards(any) {
    if (this.el.classList.contains("has-cards") === !!any) return false;
    this.el.classList.toggle("has-cards", !!any);
    if (any) {
      this.el.scrollTop = 0;
      this.notice();
    }
    return true;
  }

  // Over the picture, in the one window (the symbol's click): open or shut.
  setOpen(open = !this.open) {
    this.open = open;
    this.el.classList.toggle("open", open);
    if (open) this.render();
  }

  render(now = Date.now()) {
    this.el.querySelector(".msg-none").hidden = this.log.length > 0;
    this.el.querySelector(".msg-list").innerHTML = this.log
      .map((m, i) => `<li${i === 0 && now - m.at < FRESH_MS ? ' class="fresh"' : ""}><time>${esc(clock(m.at))}</time> ${esc(m.text)}${m.count > 1 ? ` <small>×${m.count}</small>` : ""}</li>`)
      .join("");
    clearTimeout(this.freshTimer);
    this.freshTimer = setTimeout(() => this.el.querySelector(".msg-list li.fresh")?.classList.remove("fresh"), FRESH_MS);
  }
}

// "20:41": when a message came.
function clock(at) {
  const d = new Date(at);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
