// The top bar's Lobby button (lobbybutton.js, index.html #lobby-open, by
// Home): once an online game has started on this bay, back to the lobby
// from anywhere (the owner, 29 October 2026: "Getting back to the lobby
// needs to be its own button next to home, once an online game is
// started. To be able to stop the game").

// Asked before the host stops a game going on (the round not over).
export const LOBBY_ASK = "Stop the game for everyone and go back to the lobby?\n\nEach round's card shows, its scores kept as far as it went. Then pick the next game and Start.";

// What the button does, or null when there's no game on to go back from.
// view: the online play view (mode host, guest or off, and the game);
// over: this bay's round over (app.js netAfter).
// - the host, the game going: stops it for everyone, asked first (ask);
// - the host, the round over: everyone back, nothing to ask;
// - anyone else: the Online play panel - who's playing, Leave the game
//   (only the host stops a game for everyone).
export function lobbyButton(view, { over = false } = {}) {
  const g = view?.game;
  if (!g?.started || g.ended || (view.mode !== "host" && view.mode !== "guest")) return null;
  if (view.mode === "guest") return { act: "panel", title: "The online game: who's playing, and Leave the game - the host takes everyone back to the lobby" };
  if (over) return { act: "lobby", title: "Everyone back to the lobby, for the next game" };
  return { act: "stop", ask: LOBBY_ASK, title: "Stop the game - everyone back to the lobby" };
}
