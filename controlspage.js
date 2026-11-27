// The controls window's own page (controls.html): opened by the game
// (?open=...), it says the command centre's on its way until the game moves
// the controls in - as the game starts, that's once its controls are made
// (earlyscreens.js opens this window first); opened by itself, it says
// where the game is.
document.body.classList.toggle("from-game", new URLSearchParams(location.search).has("open"));
