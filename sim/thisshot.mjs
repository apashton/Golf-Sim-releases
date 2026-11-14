// The command centre's This shot box (details.js): one box, for every mode,
// for the shot being played - who's hitting and with what, where from, the
// situation, what the next shot is said to be, and how the last one went.
// It replaced the Shot details and each mode's own boxes for the result,
// the guide, the lie, the target and the course's status, which said the
// same things in different places (the owner, 16 October 2026: "What can
// be stripped, what can be combined"). Built from what the mode already
// gives the game window (its overlay content, bay.js), so a mode has
// nothing more to do for it. Pure, for the page and the tests.

import { detailItems, slopeNumbers } from "./gametext.mjs";
import { SPECIALS, SPECIAL_NAMES } from "./shotstats.mjs";
import { POWER_CHOICES, powerName } from "./power.mjs";

// A number of the last shot's (the Last shot box's), not the situation's:
// a mode marks its stats so ({ of: "shot" }) - the carry, the ball speed,
// the putt's leave - and the rest (the score, the run holed, the distance
// to the pin) are the situation, here.
export const isShotStat = (s) => s?.of === "shot";

// What the box shows, from the overlay content:
//   player     { name, colour, label } who's hitting (whose turn it is, or
//              whose shots these are; label: a warm-up's "Warm-up"), or null
//   club       the club's code, or null
//   lines      [{ kind, text }]: the result, the note, the lie's and the
//              guide's lines and the mode's details, each in full
//              (gametext.mjs detailItems)
//   situation  the overlay's stats that aren't the last shot's numbers
//              (the club's left out: it's by the name)
//   suggest    the club the mode suggests, where it isn't the one in hand
//              (content.suggest: the course's, the chipping green's), or null
//   stance     the lie of the land (content.stance), where it isn't level -
//              drawn as the game window draws it (gametext.mjs slopeSvg)
//   next       the next-shot row (nextRow), or null where it doesn't apply
// next: { on, special, power } - the recorder's next shot (recorder.js),
// on where E says one (every mode but the putting green, and recording).
export function thisShot(content, { next = null } = {}) {
  const c = content ?? {};
  return {
    player: c.player?.name ? { name: c.player.name, colour: c.player.colour ?? null, label: c.player.label ?? null } : null,
    club: c.club ?? null,
    lines: detailItems(c),
    situation: (c.stats ?? []).filter((s) => s && !isShotStat(s) && s.label !== "Club"),
    suggest: c.suggest && c.suggest !== c.club ? c.suggest : null,
    stance: slopeNumbers(c.stance) ? c.stance : null,
    next: next?.on ? nextRow(next) : null,
  };
}

// The next shot, as E and Shift + E set it: a normal swing, one of the
// special kinds, or a part swing at a power. { kinds: [{ id, name, on }],
// powers: [{ pw, name, on }] } - the one said lit (a power and a kind are
// never both said: recorder.js).
export function nextRow({ special = null, power = null } = {}) {
  const sp = SPECIALS.includes(special) ? special : null;
  const pw = POWER_CHOICES.includes(power) ? power : null;
  return {
    kinds: [null, ...SPECIALS].map((k) => ({ id: k ?? "normal", name: k ? SPECIAL_NAMES[k] : "Normal", on: k === sp && (k != null || pw == null) })),
    powers: POWER_CHOICES.map((p) => ({ pw: p, name: powerName(p), on: p === pw })),
  };
}

// The command centre's Last shot box (ccwidgets.js): the mode's own numbers
// for the last shot where it gives them - the range's, the putt's, the
// chip's: those over the picture marked of: "shot", and any it gives for
// the controls alone (content.more: the chip's roll) - else the launch
// monitor's and the flight's (tiles: videotiles.mjs shotTiles, the flight
// the mode really flew: shotflight.mjs). [{ label, value, unit, accent,
// tone }].
export function lastShotTiles(content, tiles = []) {
  const own = [...(content?.stats ?? []).filter(isShotStat), ...(content?.more ?? [])];
  const tile = ({ label, value, unit, accent, tone }) => ({ label, value: String(value ?? "-"), unit: unit ?? "", accent: !!accent, tone: tone ?? null });
  return own.length ? own.map(tile) : (tiles ?? []).map((t) => tile({ ...t, accent: false }));
}
