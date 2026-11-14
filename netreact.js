// Online play's quick reactions (sim/netreact.mjs): a button over the
// picture opens a wheel of eight - the best for the moment first, at the
// top (smartReactions: a friend's ball in the air, a birdie, the water,
// the sand...), its words in the middle as each is pointed at - with all
// 25 from the button in its middle (the owner, 30 October 2026: "Can we
// add more actions please. With a smart actions wheel to select"). Tap the
// button and then one, or press on the button, slide to one and let go.
// The one picked shows on every bay's screen, with who it's from. One every 30 seconds a
// bay (the owner: "Reactions restrict to every 30 seconds"): the button
// counts down till the next may go, and the host turns away one sooner.
// With the screens separate (the PC's command centre: the owner, 29
// October 2026, "on pc, move reactions and lobby to command centre") the
// button is in the controls window's top bar, after Lobby, the wheel
// dropping down under it (inBar; app.js says when); the bubbles stay over
// the game window's picture - at its right, under the messages' symbol,
// each under the one before and on screen 20 seconds (the owner, 29
// October 2026: "Leave messages sent to each other on screen for much
// longer and put them under each other if more than 1 at a time ... not
// central but still within view").

import { esc } from "./util.js";
import { REACTIONS, REACTION_KEYS, WHEEL_SLOTS, reactWait, reactionLine, freshReaction, smartReactions } from "./sim/netreact.mjs";

// How long each stays (style.css's net-react-in runs as long), and how many
// at once - the oldest goes to make room.
export const BUBBLE_MS = 20_000;
export const MOST_BUBBLES = 5;

export class ReactionBar {
  // send(event): to the game (netplay.js NetPlayClient send). parent: where
  // the bubbles go - the picture (#view), so the game screen's arranging
  // can move them (sim/gamelayout.mjs GAME_ITEMS).
  constructor({ send, parent = document.body }) {
    this.send = send;
    this.el = document.createElement("div");
    this.el.className = "net-react";
    this.el.hidden = true;
    const pick = (k, i = null) => `<button data-react="${k}"${i == null ? "" : ` style="--i: ${i}"`} title="${esc(REACTIONS[k].words)}" aria-label="${esc(REACTIONS[k].words)}">${REACTIONS[k].icon}</button>`;
    this.el.innerHTML = `<div class="net-react-picks" hidden><div class="net-react-ring"></div><div class="net-react-say" aria-hidden="true"></div><button class="net-react-more" title="All of them" aria-label="All reactions" aria-expanded="false">⋯</button><div class="net-react-all" hidden>${REACTION_KEYS.map((k) => pick(k)).join("")}</div></div><button class="net-react-open" title="React - one every 30 seconds" aria-label="React" aria-expanded="false">😀</button>`;
    this.slot = pick;
    this.picks = this.el.querySelector(".net-react-picks");
    this.ring = this.el.querySelector(".net-react-ring");
    this.say = this.el.querySelector(".net-react-say");
    this.more = this.el.querySelector(".net-react-more");
    this.all = this.el.querySelector(".net-react-all");
    this.open = this.el.querySelector(".net-react-open");
    this.bubbles = document.createElement("div");
    this.bubbles.className = "net-react-bubbles";
    this.bubbles.setAttribute("aria-live", "polite");
    this.home = document.body;
    this.home.append(this.el);
    parent.append(this.bubbles);
    this.el.addEventListener("click", (e) => {
      const pick = e.target.closest("button[data-react]");
      if (pick) return this.pick(pick.dataset.react);
      if (e.target.closest(".net-react-more")) return this.showAll(this.all.hidden);
      // (From the keyboard: a press on it opens it - pointerdown below.)
      if (e.target.closest(".net-react-open") && e.detail === 0) this.toggle();
    });
    // Press on the button: the wheel opens; slide to one and let go to
    // send it, or let go where you pressed and tap one.
    this.open.addEventListener("pointerdown", (e) => {
      if (e.button > 0) return;
      e.preventDefault();
      if (!this.picks.hidden) return this.toggle(false);
      this.toggle(true);
      if (this.picks.hidden) return;
      const from = [e.clientX, e.clientY];
      const under = (ev) => document.elementFromPoint(ev.clientX, ev.clientY)?.closest?.(".net-react-picks button[data-react]") ?? null;
      const move = (ev) => this.point(under(ev));
      const up = (ev) => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        const b = under(ev);
        if (b && Math.hypot(ev.clientX - from[0], ev.clientY - from[1]) > 12) this.pick(b.dataset.react);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    });
    // Its words in the middle, for the one pointed at.
    this.picks.addEventListener("pointerover", (e) => this.point(e.target.closest("button[data-react]")));
    this.picks.addEventListener("focusin", (e) => this.point(e.target.closest("button[data-react]")));
    // Away from it, or Escape: shut.
    document.addEventListener("pointerdown", (e) => {
      if (!this.picks.hidden && !this.el.contains(e.target)) this.toggle(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !this.picks.hidden) this.toggle(false);
    });
    this.view = null;
    this.seen = undefined;
    this.lastAt = null;
    this.timer = null;
  }

  // Into the top bar after `after` (the Lobby button, in the controls
  // window), or - null - back over the picture.
  inBar(after) {
    this.toggle(false);
    if (after) after.after(this.el);
    else this.home.append(this.el);
    this.el.classList.toggle("in-bar", !!after);
  }

  toggle(on = this.picks.hidden) {
    if (on && reactWait(this.lastAt) > 0) return;
    if (on) this.fill();
    else this.showAll(false);
    this.picks.hidden = !on;
    this.open.setAttribute("aria-expanded", String(on));
  }

  // The wheel for the moment: the best eight round it, the best at the
  // top (sim/netreact.mjs smartReactions), its words in the middle.
  fill() {
    const order = smartReactions(this.view?.game, this.view?.bay).slice(0, WHEEL_SLOTS);
    this.ring.innerHTML = order.map((k, i) => this.slot(k, i)).join("");
    this.point(this.ring.firstElementChild);
  }

  // The one pointed at: lit, and its words in the middle.
  point(b) {
    if (!b) return;
    for (const o of this.picks.querySelectorAll("button.hot")) o.classList.remove("hot");
    b.classList.add("hot");
    this.say.textContent = REACTIONS[b.dataset.react]?.words ?? "";
  }

  // All of them, in place of the wheel - or back to the wheel.
  showAll(on) {
    this.all.hidden = !on;
    this.ring.hidden = on;
    this.picks.classList.toggle("all", on);
    this.more.textContent = on ? "↺" : "⋯";
    this.more.title = on ? "Back to the wheel" : "All of them";
    this.more.setAttribute("aria-expanded", String(on));
  }

  // The game as it is now: shown with someone to react to; a new reaction
  // (not the ones from before this bay looked) on screen.
  update(view) {
    this.view = view;
    const g = view?.mode !== "off" ? view?.game : null;
    const others = g ? Object.keys(g.bays ?? {}).filter((b) => b !== view.bay).length : 0;
    this.el.hidden = !g || g.ended || !others;
    if (this.el.hidden) this.toggle(false);
    const { seen, show } = freshReaction(this.seen, g);
    this.seen = seen;
    if (show) this.bubble(reactionLine(g, show), show.bay === view.bay);
  }

  async pick(what) {
    const v = this.view;
    if (!v?.bay || reactWait(this.lastAt) > 0) return;
    this.lastAt = Date.now();
    this.toggle(false);
    this.wait();
    const r = await this.send({ type: "react", bay: v.bay, what });
    // Turned away for another reason than the wait: may try again.
    if (r?.ok === false && !/30 seconds/.test(r.error ?? "")) {
      this.lastAt = null;
      this.wait();
    }
  }

  // The button counting down till the next may go.
  wait() {
    clearInterval(this.timer);
    const tick = () => {
      const left = Math.ceil(reactWait(this.lastAt) / 1000);
      this.open.disabled = left > 0;
      this.open.textContent = left > 0 ? String(left) : "😀";
      this.open.title = left > 0 ? `React again in ${left} s` : "React - one every 30 seconds";
      if (!left) clearInterval(this.timer);
    };
    this.timer = setInterval(tick, 500);
    tick();
  }

  bubble(text, mine = false) {
    if (!text) return;
    const b = document.createElement("div");
    b.className = `net-react-bubble${mine ? " mine" : ""}`;
    b.textContent = text;
    this.bubbles.append(b);
    while (this.bubbles.children.length > MOST_BUBBLES) this.bubbles.firstElementChild.remove();
    setTimeout(() => b.remove(), BUBBLE_MS);
  }
}
