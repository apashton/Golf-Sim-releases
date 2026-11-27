// Online putting, chipping and challenges (sim/netgame.mjs SIDE_GAMES):
// every bay plays the same thing from the host's setup, its own players
// one after another, and only each attempt's points go between the bays.
// NetTurns is this bay's part - whose go it is and sending their scores;
// NetBoard the standings over the picture, everyone's, as they come.

import { esc } from "./util.js";
import { tallyRows } from "./sim/netgame.mjs";

// This bay's players in an online game, in turn.
//   game       the game (netgame.mjs) as it started
//   bay        this bay's id in it
//   send(ev)   a change to the game (netplay.js)
//   setHitter  (name) whose shots they are, for the stats
export class NetTurns {
  constructor({ game, bay, send, setHitter = () => {} }) {
    this.id = game.round.id;
    this.setup = game.round.setup ?? {};
    this.attempts = game.round.holes;
    this.players = game.players.filter((p) => p.bay === bay && !p.dropped).map((p) => ({ id: p.id, name: p.name }));
    this.send = send;
    this.setHitter = setHitter;
    this.at = 0;
    this.done = !this.players.length;
    if (this.player) setHitter(this.player.name);
  }

  // The player whose go it is (null once everyone here has finished).
  get player() {
    return this.done ? null : this.players[this.at];
  }

  // Their n-th attempt (from 0) scored; or, in the Challenges, a named
  // player's hole.
  scored(n, points, text = "", player = this.player) {
    if (!player) return;
    this.send({ type: "score", player: player.id, n, points, text });
  }

  // The player whose go it was has finished all theirs: on to the next
  // here, who's returned (null once everyone here has played).
  next() {
    this.at++;
    if (this.at >= this.players.length) {
      this.done = true;
      return null;
    }
    this.setHitter(this.player.name);
    return this.player;
  }
}

// The standings of an online putting, chipping or challenge game, over
// the picture in the top right corner: everyone's total and how far
// they've got, the winner once all have finished.
export class NetBoard {
  constructor(view) {
    this.el = document.createElement("div");
    this.el.className = "net-board";
    this.el.hidden = true;
    view.appendChild(this.el);
    this.game = null;
  }

  // The game as it is now (or null: none going).
  update(game, { bay = null } = {}) {
    // (Golf pong shows its own score: golfpong.js.)
    this.game = game?.started && !["course", "pong"].includes(game.round?.mode ?? "course") ? game : null;
    if (!this.game) {
      this.el.hidden = true;
      return;
    }
    const t = tallyRows(this.game);
    const n = this.game.round.holes;
    const rows = t.rows
      .map(
        (r) =>
          `<tr class="${r.bay === bay ? "here" : ""}${r.dropped ? " gone" : ""}"><td>${esc(r.place)}</td><td><span class="player-dot" style="background:${esc(r.colour)}"></span>${esc(r.name)}</td><td class="num"><b>${esc(r.total)}</b></td><td class="muted num">${r.done ? "done" : `${r.played}/${n}`}</td></tr>`,
      )
      .join("");
    this.el.innerHTML = `<div class="nb-title">${esc(this.game.round.name ?? "Online")}</div>${t.title ? `<div class="nb-win">${esc(t.title)}</div>` : ""}<table>${rows}</table>`;
    this.el.hidden = false;
  }

  hide() {
    this.update(null);
  }
}
