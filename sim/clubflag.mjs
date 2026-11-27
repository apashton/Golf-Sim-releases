// The wrong-club flag (the owner, 19 November 2026: "when there's been a
// shot that's been played that definitely seems like it's not the right
// club, there should be some flag on screen that stays there until that's
// been assessed in the shot history, and it can be changed. So you might
// play 2 or 3 shots, notice the flag and go, alright, yeah, I need to
// change my club, and change the last few shots").
//
// A shot the club check doubted - one it moved to the club it flew like
// (sure), or one it asked about - carries a flag in the Shot history
// (sim/shothistory.mjs, recorder.js) until the player's said what it was:
// another club, the club it has (it was right), or a mark that explains it
// (a bad hit, thin, a misread...). While any shot has one, a small "Club?"
// stays on the picture (bay.js); clicked, it asks about each in turn
// (flagAsk) - and the Shot history's rows say it too, with the same
// answers. Pure: recorder.js keeps the flags, bay.js and ccwidgets.js draw
// them.

// A shot's flag from the server's club check ({ looksLike, moved, sure })
// and the club it was recorded with: { looksLike, was, moved } - was: the
// club picked, moved: already counted as looksLike (the check was sure).
// Null when there's nothing to doubt.
export function clubFlag(check, club) {
  const like = check?.looksLike;
  if (typeof like !== "string" || !like || typeof club !== "string" || !club || like === club) return null;
  return { looksLike: like, was: club, moved: check.moved === true };
}

// The shots still flagged, oldest first (the history is newest first).
export function flaggedShots(list) {
  return (list ?? []).filter((s) => s?.flag).reverse();
}

// Whether a mark from the Shot history settles a flag: anything that says
// why it flew as it did (a bad hit, thin, fat, a punch, a misread...) - but
// not Good (a good strike that flew like another club is still that) nor
// "As judged".
export function settlesFlag(say) {
  return typeof say === "string" && say !== "good" && say !== "auto";
}

const low = (s) => String(s ?? "").toLowerCase();
const article = (words) => (/^[aeiou8]/i.test(words) || /^(11|18)\b/.test(words) ? "an" : "a");

// The flag on the picture while any shot has one: { n, text, title }, or
// null. text: "Club?" ("Club? 3" for three); title: what it's about.
export function flagChip(list, { clubName = (c) => c } = {}) {
  const shots = flaggedShots(list);
  if (!shots.length) return null;
  const n = shots.length;
  if (n === 1) {
    const f = shots[0].flag;
    const what = f.moved ? `was counted as ${article(clubName(f.looksLike))} ${low(clubName(f.looksLike))}, not the ${low(clubName(f.was))} picked` : `flew like ${article(clubName(f.looksLike))} ${low(clubName(f.looksLike))}, not the ${low(clubName(f.was))}`;
    return { n, text: "Club?", title: `${whereWords(list, shots[0])} ${what} - click to sort it out (it stays till you do), or in Shot history` };
  }
  return { n, text: `Club? ${n}`, title: `${n} shots flew like another club - click to sort them out (they stay till you do), or in Shot history` };
}

// Where a shot is in the history: "Your last shot", "Your shot 2 back" -
// with friends, whose ("Ben's last shot").
function whereWords(list, shot, { names = false } = {}) {
  const i = (list ?? []).findIndex((s) => s.id === shot.id);
  const whose = names && shot.player ? `${shot.player}'s` : "Your";
  return i <= 0 ? `${whose} last shot` : `${whose} shot ${i} back`;
}

// The question the flag asks about one shot (the oldest flagged, unless
// given): { id, head, text, answers } - each answer { label, act }: act
// { club } (counted as that club), { keep: true } (it was the club it has
// now), { say: "badhit" } (a bad hit, so the club stays and it's out of
// the club's numbers), { all: [ids], club } (every shot flagged the same
// way - the same player, club picked and club it flew like - counted as
// it), or { later: true } (left flagged). Null with nothing flagged.
export function flagAsk(list, { id = null, names = false, clubName = (c) => c } = {}) {
  const shots = flaggedShots(list);
  const shot = id ? shots.find((s) => s.id === id) : shots[0];
  if (!shot) return null;
  const f = shot.flag;
  const name = (c) => clubName(c);
  const carry = Number.isFinite(shot.carry) ? `, ${Math.round(shot.carry)} yds` : "";
  const where = whereWords(list, shot, { names });
  const later = { label: "Later", act: { later: true } };
  if (f.moved) {
    return {
      id: shot.id,
      head: "Club?",
      text: `${where}: counted as ${article(name(f.looksLike))} ${low(name(f.looksLike))}${carry} - it flew like one, with the ${low(name(f.was))} picked`,
      answers: [{ label: `Right: ${name(f.looksLike)}`, act: { keep: true } }, { label: `Put back: ${name(f.was)}`, act: { club: f.was } }, later],
    };
  }
  const same = shots.filter((s) => !s.flag.moved && s.player === shot.player && s.flag.was === f.was && s.flag.looksLike === f.looksLike && s.club === f.was);
  const all = same.length > 1 ? [{ label: `All ${same.length}: ${name(f.looksLike)}`, act: { all: same.map((s) => s.id), club: f.looksLike } }] : [];
  return {
    id: shot.id,
    head: "Club?",
    text: `${where}: ${low(name(shot.club))}${carry} - it flew like ${article(name(f.looksLike))} ${low(name(f.looksLike))}`,
    answers: [{ label: name(f.looksLike), act: { club: f.looksLike } }, ...all, { label: `It was the ${low(name(shot.club))}`, act: { keep: true } }, { label: "Bad hit", act: { say: "badhit" } }, later],
  };
}

// A flagged row's line in the Shot history: "⚑ Flew like a 6 iron" or
// "⚑ Counted as a 6 iron (the 7 iron was picked)", and its answers as in
// flagAsk, Later left out (the row is there to come back to). Null for a
// shot with no flag.
export function flagRow(list, shot, { clubName = (c) => c } = {}) {
  const f = shot?.flag;
  if (!f) return null;
  const ask = flagAsk(list, { id: shot.id, clubName });
  const like = `${article(clubName(f.looksLike))} ${low(clubName(f.looksLike))}`;
  return {
    text: f.moved ? `⚑ Counted as ${like} - the ${low(clubName(f.was))} was picked` : `⚑ Flew like ${like}`,
    answers: (ask?.answers ?? []).filter((a) => !a.act.later),
  };
}
