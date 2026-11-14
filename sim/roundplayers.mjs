// Rounds whose players aren't this PC's to change: online (the host's game),
// a ladder's match, a season by post's event. Starting another round or
// changing the players there would throw the round away from under the
// others - said instead. -> words, or null when the players can change.
export function fixedPlayersWords(round) {
  if (!round || round.finished) return null;
  if (round.net) return "Online, the host's game decides who plays - leave the game first";
  if (round.ladder) return "A ladder match is played as it is - finish it, or leave it from the ladder";
  if (round.postSeason) return "A season's event is played as it is - finish the round first";
  return null;
}
