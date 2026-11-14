// Hints on the game screen now and then, each a key that does something
// useful right then (the owner: "have hints on screen from time to time
// showing you the key presses that can do things, specifically if it's
// appropriate. So on the green showing the I button. You can dismiss it so
// it doesn't show again, but every option should be shown from time to
// time until it's dismissed"). Pure: which hint fits, and when; app.js
// shows it (bay.js showHint) and keeps what's been dismissed.
//
// ctx: what's going on - { mode, round, lie, toPin, onGreen, holeDone,
//        trouble, fromBall, relief, lookDown, flyover, pick, pending,
//        session, gapping, challenge, card, recording, voice, wake, afterShot,
//        multi, flying, busy }
//   mode       "range" | "putting" | "chipping" | "course" | "challenges"
//   pong       on the putting green, golf pong (no read or line to look
//              along: its own aim and new game)
//   round      on the course, a round going
//   lie, toPin on the course, where the ball lies ("tee", "bunker"...) and
//              how far it is from the pin (yards)
//   onGreen    on the course, the ball's on the green
//   putting    on the course, a putt to play: on the green, or with the
//              putter picked off it (the fringe, the fairway, the first cut)
//   holeDone   on the course, this hole's finished (N, J)
//   trouble    on the course, the ball lies in the trees or deep rough, or
//              the trees are in the way of the shot, or a bunker's face is
//              too steep to get over (S, U)
//   fromBall   on the course, looking from the ball (S)
//   relief     on the course, an unplayable ball's card is up (1 - 4) -
//              or a ball in the water's (reliefWater: no playing it as it
//              lies); placing, a drop's spot being chosen on it
//   lookDown, flyover  on the course, the look down the hole or the
//              flyover playing
//   pick       on the course, a scramble's team ball to pick: how many
//   pending    on the course with friends, the pause after a shot
//   mulligan   on the course, a mulligan can be taken (Shift + M)
//   session    on the range, the session view
//   gapping    on the range, a gapping session on (N skips a club)
//   challenge  in the Challenges, "picker", "playing" or "results"
//   card       a card up asking about the last shot: "check", "strike",
//              "odd", "review", "unusual", "power" or "session"
//   recording, voice   a video being recorded, voice on
//   wake       the voice's wake word in a word ("Caddie"), or null for none
//   afterShot  a shot's been hit (Q, Shift + S)
//   multi      more than one player
//   flying     a ball in the air - no hint then
//   busy       something else is up (a card, a menu) - no hint then
//
// A hint about what's just happened (soon: the ball in trouble) comes at
// once rather than waiting its turn, and is first in the command centre's
// Keys box (keysNow), as is one about where you are (first: on the green,
// a hole finished). One that's only for that box (tip: false) never pops
// up over the picture.

// A shot with a club to come (not a putt): the club, the aim, a special
// shot. Not on a green (nor putting off one), after a hole, or at the
// Challenges' cards.
export const fullShot = (c) =>
  c.mode !== "putting" && !(c.mode === "course" && (c.onGreen || c.putting || c.holeDone)) && !(c.mode === "challenges" && c.challenge && c.challenge !== "playing");
// A club to choose: for a shot with one to come, and with the putter
// picked off a green (to take a club again).
export const clubChoice = (c) => fullShot(c) || (c.mode === "course" && !!c.putting && !c.onGreen && !c.holeDone);

export const HINTS = [
  // ---- A card up (recorder.js) - what answers it. The card says too, on
  // the game window; these are for the Keys box on the laptop.
  // The range's "Odd shot?" card, the one card asked for after a shot.
  { id: "card-strike-yes", key: "Y", text: "the card's right", soon: true, tip: false, when: (c) => c.card === "strike" },
  { id: "card-strike-keep", key: "K", text: "keep it - a good strike", soon: true, tip: false, when: (c) => c.card === "strike" || c.card === "review" },
  { id: "card-bad-hit", key: "B", text: "just a bad hit", soon: true, tip: false, when: (c) => c.card === "strike" || c.card === "review" },
  { id: "card-misread", key: "Delete", text: "a misread - that shot out of your stats (Z puts it back)", soon: true, tip: false, when: (c) => !!c.card },
  { id: "card-close", key: "Esc", text: "close the card", soon: true, tip: false, when: (c) => !!c.card },
  // ---- The course: what's going on.
  { id: "look-down-stop", key: "J", text: "stop the look down the hole", soon: true, tip: false, when: (c) => c.mode === "course" && c.lookDown },
  { id: "flyover-stop", key: "Esc", text: "skip the flyover - J stops it too, and plays it again", soon: true, tip: false, when: (c) => c.mode === "course" && c.flyover },
  { id: "scramble-pick", key: (c) => `1 - ${c.pick}`, text: "pick the team's ball - everyone plays the next shot from it", soon: true, tip: false, when: (c) => c.mode === "course" && c.pick > 0 },
  { id: "turn-now", key: "N", text: "the next player's turn now, without the wait", soon: true, tip: false, when: (c) => c.mode === "course" && c.pending },
  { id: "ball-view", key: "S", text: "look from the ball itself - the gaps and branches in your way", soon: true, when: (c) => c.mode === "course" && c.trouble && !c.fromBall && !c.relief },
  { id: "ball-view-back", key: "S", text: "back behind the ball", soon: true, tip: false, when: (c) => c.mode === "course" && c.fromBall },
  { id: "ball-view-turn", key: "← →", text: "look round from the ball - the aim turns with it", soon: true, tip: false, when: (c) => c.mode === "course" && c.fromBall },
  { id: "mulligan", key: "Shift + M", text: "mulligan - take that stroke back and play it again", soon: true, when: (c) => c.mode === "course" && c.mulligan && c.afterShot },
  { id: "unplayable", key: "U", text: "unplayable - a penalty stroke to drop it under the Rules, or go back where you played from", soon: true, when: (c) => c.mode === "course" && c.trouble && !c.relief },
  { id: "relief-pick", key: "1 - 4", text: "choose where it's played from on the card", soon: true, tip: false, when: (c) => c.mode === "course" && c.relief && !c.placing },
  { id: "relief-keep", key: "Esc", text: "no drop - play it as it lies", soon: true, tip: false, when: (c) => c.mode === "course" && c.relief && !c.placing && !c.reliefWater },
  { id: "relief-move", key: "↑ ↓ ← →", text: "move the drop's spot - further back, nearer, across (or click the ground)", soon: true, tip: false, when: (c) => c.mode === "course" && c.placing },
  { id: "relief-drop", key: "Enter", text: "drop it on the spot", soon: true, tip: false, when: (c) => c.mode === "course" && c.placing },
  { id: "relief-back", key: "Esc", text: "back to the choices of where from", soon: true, tip: false, when: (c) => c.mode === "course" && c.placing },
  // ---- The course: where the ball lies.
  { id: "green-sections", key: "I", text: "look along the putt's line a section at a time (Shift + I back)", first: true, when: (c) => (c.mode === "course" && (c.onGreen || c.putting)) || (c.mode === "putting" && !c.pong) },
  { id: "green-aim", key: "← →", text: "aim the putt - a quarter of a degree at a time", first: true, tip: false, when: (c) => c.mode === "course" && (c.onGreen || c.putting) && !c.holeDone },
  { id: "course-line", key: "T", text: "the read on the greens - the ideal line - after each putt, before and after, or off", first: true, when: (c) => c.mode === "course" && (c.onGreen || c.putting) },
  // On the fringe, the putter's there to pick (sim/clubs.mjs PUTTER_LIES),
  // after the lob wedge: said in the Keys box only - a choice, never
  // suggested (the owner, 26 October 2026: "it should be a choice, never a
  // suggestion").
  { id: "fringe-putter", key: "↑ ↓", text: "the putter too, after the lob wedge", first: true, tip: false, when: (c) => c.mode === "course" && c.round && !c.holeDone && c.lie === "fringe" && !c.putting },
  { id: "bunker-club", key: "↑ ↓", text: "a club that gets out over the face - the bar on the lip shows the launch it needs", first: true, tip: false, when: (c) => c.mode === "course" && c.round && (c.lie === "bunker" || c.lie === "greenside") },
  { id: "chip-power", key: "Shift + E", text: "a chip's power - 25%, 50%, 75%, full - kept by its power in My stats", first: true, tip: false, when: (c) => c.mode === "course" && c.round && !c.onGreen && !c.putting && !c.holeDone && c.toPin != null && c.toPin <= 60 },
  { id: "next-hole", key: "N", text: "on to the next hole", first: true, when: (c) => c.mode === "course" && c.holeDone },
  { id: "flyover", key: "J", text: "fly along the hole you just played, following the ball", first: true, when: (c) => c.mode === "course" && c.holeDone && !c.flyover },
  { id: "course-start", key: "N", text: "start a round on the course picked in the panel", first: true, tip: false, when: (c) => c.mode === "course" && !c.round },
  // ---- The range, the practice greens and the Challenges.
  { id: "range-session-back", key: "S", text: "back to the tee", soon: true, tip: false, when: (c) => c.mode === "range" && c.session },
  { id: "gapping-skip", key: "N", text: "skip this club in the gapping session - one you don't carry", first: true, tip: false, when: (c) => c.mode === "range" && c.gapping },
  { id: "range-target", key: "T", text: "change the target you're aiming at", when: (c) => c.mode === "range" && !c.session },
  { id: "range-session", key: "S", text: "see this session's shots", when: (c) => c.mode === "range" && c.afterShot && !c.session },
  { id: "putt-read", key: "T", text: "the read - the ideal line - after each putt, before and after, or off", when: (c) => c.mode === "putting" && !c.pong },
  { id: "putt-new", key: "N", text: "a new putt", tip: false, when: (c) => c.mode === "putting" && !c.pong },
  { id: "pong-aim", key: "← →", text: "golf pong: aim (Shift: a degree at a time)", tip: false, when: (c) => c.pong },
  { id: "pong-new", key: "N", text: "golf pong: a new game on a new mat", tip: false, when: (c) => c.pong },
  { id: "chip-new", key: "N", text: "another chipping distance", tip: false, when: (c) => c.mode === "chipping" },
  { id: "challenge-play", key: "1 2 3 4", text: "play a game from the cards", first: true, tip: false, when: (c) => c.mode === "challenges" && c.challenge !== "playing" },
  { id: "challenge-option", key: "Shift + 1 2 3 4", text: "change that game's option - distances, fairways, the green", tip: false, when: (c) => c.mode === "challenges" && c.challenge === "picker" },
  { id: "challenge-again", key: "N", text: "play that game again", first: true, tip: false, when: (c) => c.mode === "challenges" && c.challenge === "results" },
  { id: "challenge-skip", key: "N", text: "skip the wait", tip: false, when: (c) => c.mode === "challenges" && c.challenge === "playing" },
  { id: "challenge-cards", key: "X", text: "back to the cards, to pick another game", tip: false, when: (c) => c.mode === "challenges" && c.challenge && c.challenge !== "picker" },
  // ---- Anywhere.
  // (Not while the cart's watched between holes: the arrows are its wheel
  // and its speed then - course/buggy.js driveKey.)
  { id: "aim", key: "← →", text: "turn your aim", when: (c) => !c.cart && ((c.mode === "course" && c.round && !c.holeDone && !c.relief) || (c.mode === "challenges" && c.challenge === "playing")) },
  { id: "club", key: "↑ ↓", text: "change club", when: (c) => !c.cart && clubChoice(c) },
  { id: "rec-stop", key: "Shift + V", text: "stop recording the video", first: true, tip: false, when: (c) => c.recording },
  { id: "rec-view", key: "Shift + Q", text: "see what's being recorded, or the game again", tip: false, when: (c) => c.recording },
  // (Only with a replay to come: canReplay - a swing camera, or the
  // course's flight again - and canSave, a camera's; the owner, 26 October
  // 2026: "Replay doesnt seem to work shot to shot, even though the button
  // is there".)
  { id: "replay", key: "Q", text: "watch your last shot again", when: (c) => c.afterShot && c.canReplay !== false },
  { id: "save-replay", key: "Shift + S", text: "keep the last shot's replay", when: (c) => c.afterShot && c.canSave !== false && !(c.mode === "range" && c.session) },
  { id: "special", key: "E", text: "mark the next shot as a punch or part swing, kept out of the club's numbers", when: (c) => fullShot(c) },
  { id: "part-power", key: "Shift + E", text: "the next swing's power - 25%, 50%, 75%, full", tip: false, when: (c) => c.mode === "range" || c.mode === "chipping" },
  { id: "who", key: "U", text: "next player's turn to hit", when: (c) => c.multi && (c.mode === "range" || c.mode === "chipping" || c.mode === "putting") },
  { id: "voice-off", key: "L", text: (c) => (c.wake ? `voice off - while it's on, say "${c.wake}, seven iron", or "${c.wake}, shot note" and the note` : 'voice off - while it\'s on, say "club picked seven iron", or "shot note" and the note'), tip: false, when: (c) => c.voice },
  { id: "camera", key: "V", text: "the camera: follow the ball, or stay put", tip: false, when: (c) => c.mode !== "putting" },
  { id: "menu", key: "M", text: "the menu - every setting", when: () => true },
  { id: "keys", key: "H", text: "every key on one page", when: () => true },
  { id: "full-screen", key: "F", text: "full screen, and back", when: () => true },
];

// How often: the first a little while in, then a gap between them, and the
// same hint not again for a good while (milliseconds).
export const HINT_TIMES = { first: 45_000, gap: 120_000, again: 15 * 60_000, show: 12_000 };

// A fresh record of what's been shown and dismissed.
export const newHintState = () => ({ dismissed: [], shown: {}, last: 0, started: 0, off: false });

// A stored record made safe (anything missing or wrong put right).
export function cleanHintState(s) {
  const out = newHintState();
  if (!s || typeof s !== "object") return out;
  if (Array.isArray(s.dismissed)) out.dismissed = s.dismissed.filter((id) => HINTS.some((h) => h.id === id));
  if (s.shown && typeof s.shown === "object") for (const h of HINTS) if (Number.isFinite(s.shown[h.id])) out.shown[h.id] = s.shown[h.id];
  out.off = s.off === true;
  return out;
}

// The hint to show now, or null: one that fits, isn't dismissed and hasn't
// been shown lately - the one shown longest ago (never first), so every
// one comes round in turn. `now` and the state's times in milliseconds.
export function nextHint(ctx, state, now) {
  if (!ctx || ctx.flying || ctx.busy || state.off) return null;
  const fits = TIPS.filter((h) => !state.dismissed.includes(h.id) && h.when(ctx) && !(now - (state.shown[h.id] ?? -Infinity) < HINT_TIMES.again));
  // Longest since shown first; among never-shown, the list's order (the
  // most useful for where you are first).
  const oldest = (list) => list.reduce((a, b) => ((state.shown[b.id] ?? -Infinity) < (state.shown[a.id] ?? -Infinity) ? b : a));
  // About what's just happened: now, whatever the wait.
  const soon = fits.filter((h) => h.soon);
  if (soon.length) return withText(oldest(soon), ctx);
  if (now - (state.started || now) < HINT_TIMES.first) return null;
  if (state.last && now - state.last < HINT_TIMES.gap) return null;
  return fits.length ? withText(oldest(fits), ctx) : null;
}

// A hint's words, which may depend on what's going on (the wake word).
const textOf = (h, ctx) => (typeof h.text === "function" ? h.text(ctx) : h.text);
const withText = (h, ctx) => (typeof h.text === "function" ? { ...h, text: h.text(ctx) } : h);

// The hints that pop up over the picture (not the Keys box's own).
export const TIPS = HINTS.filter((h) => h.tip !== false);

// ---- The command centre's Keys box ---------------------------------------------

// The keys that help right now, for the Keys box in the controls window
// (ccwidgets.js): those about what's just happened first, then the rest
// that fit, in the list's order - one line for each key - at most `max`.
// Dismissing a tip doesn't take it out of here. Each { id, key, text,
// press }: press the key to send when the line is clicked ({ key, shift }),
// or null for one that's more than one key (← →).
export function keysNow(ctx, { max = 9 } = {}) {
  if (!ctx) return [];
  const fits = HINTS.filter((h) => h.when(ctx));
  const out = [];
  const lead = (h) => (h.soon ? 0 : h.first ? 1 : 2);
  for (const h of [...fits].sort((a, b) => lead(a) - lead(b))) {
    const key = typeof h.key === "function" ? h.key(ctx) : h.key;
    if (out.some((o) => o.key === key) || out.length >= max) continue;
    out.push({ id: h.id, key, text: textOf(h, ctx), press: pressOf(key) });
  }
  return out;
}

// The key a hint's label stands for: "S", "Shift + S", "Space", "Esc",
// "Delete" - or null for more than one ("← →", "1 2 3", "1 - 4").
const NAMED = { Space: " ", Esc: "Escape", Delete: "Delete", Enter: "Enter" };
export function pressOf(label) {
  const m = /^(Shift \+ )?(\S+)$/.exec(String(label ?? ""));
  if (!m) return null;
  if (NAMED[m[2]]) return { key: NAMED[m[2]], shift: !!m[1] };
  if (m[2].length !== 1) return null;
  return { key: m[2].toLowerCase(), shift: !!m[1] };
}

// The state with a hint shown at `now`.
export function hintShown(state, id, now) {
  return { ...state, last: now, shown: { ...state.shown, [id]: now } };
}

// The state with a hint dismissed for good.
export function dismissHint(state, id) {
  return state.dismissed.includes(id) ? state : { ...state, dismissed: [...state.dismissed, id] };
}

// Every hint back again.
export const resetHints = (state) => ({ ...state, dismissed: [], shown: {}, last: 0 });

// How many are left to show (not dismissed).
export const hintsLeft = (state) => TIPS.filter((h) => !state.dismissed.includes(h.id)).length;
