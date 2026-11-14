// The top bar's Lobby button (index.html #lobby-open, next to Home): shown
// once an online game has started on this bay, it takes it back to the
// lobby - the host stopping the game for everyone (asked first), or with
// the round over taking everyone back; anyone else gets the Online play
// panel (sim/lobbybutton.mjs lobbyButton says which).
import { lobbyButton } from "./sim/lobbybutton.mjs";

export class LobbyButton {
  // el: the button; view: the online play view now; over: this bay's round
  // over; quiet: nothing shown (the game's video playing its own online
  // game); panel: the Online play panel opened; lobby: the game stopped,
  // everyone back to the lobby; ask: a yes/no question.
  constructor(el, { view, over = () => false, quiet = () => false, panel, lobby, ask = (q) => globalThis.confirm(q) }) {
    Object.assign(this, { el, view, over, quiet, panel, lobby, ask });
    el?.addEventListener("click", () => this.press());
    this.update();
  }

  now() {
    return this.quiet() ? null : lobbyButton(this.view(), { over: !!this.over() });
  }

  update() {
    if (!this.el) return;
    const b = this.now();
    this.el.hidden = !b;
    if (b) this.el.title = b.title;
  }

  press() {
    const b = this.now();
    if (!b) return false;
    if (b.act === "panel") {
      this.panel();
      return true;
    }
    if (b.ask && !this.ask(b.ask)) return false;
    this.lobby();
    return true;
  }
}
