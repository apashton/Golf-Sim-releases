// The Tour's friends board (relay/worker.mjs /tour/friends, docs/TOUR.md):
// the people in your match ladders and seasons by post - "found from what
// this bay already keeps, no friends list to manage" (docs/TOUR-PLAN.md).
// The game sends its memberships - each online ladder's or season's code
// and this bay's key there, as it sends them to the ladder itself - and
// the relay links each to the account and says back the boards of
// everyone linked in them. Pure: the hub sends what this works out.

// At most this many sent at once (the relay asks no more).
export const FRIEND_CIRCLES = 24;

const same = (a, b) => typeof a === "string" && typeof b === "string" && a.trim().toLowerCase() === b.trim().toLowerCase();

// This bay's online match ladders and seasons by post played as the
// signed-in account's player (a ladder played as another of the PC's
// players isn't this account's - it's never linked to it): [{ kind, code,
// key }]. None without a player.
export function tourCircles({ ladders = [], seasons = [] } = {}, player = null) {
  if (typeof player !== "string" || !player.trim()) return [];
  const out = [];
  for (const L of ladders ?? []) {
    const o = L?.online;
    if (o?.code && o.key && same(o.me?.name, player)) out.push({ kind: "ladder", code: o.code, key: o.key });
  }
  for (const S of seasons ?? []) if (S?.code && S.key && same(S.view?.me?.name, player)) out.push({ kind: "season", code: S.code, key: S.key });
  return out.slice(0, FRIEND_CIRCLES);
}

// What the friends board says above its boards: how many friends it has
// (others linked), and from how many groups.
export function friendsLine({ count = 0, circles = 0 } = {}) {
  if (!circles) return "You're not in a match ladder or a season by post yet - your friends board is the people in those (Course tab and Online tab).";
  if (!count) return `Nobody else from your ${circles === 1 ? "match ladder or season" : "match ladders and seasons"} is on it yet - each shows once their A² Golf is up to date and they've looked at the Tour signed in.`;
  return `${count} ${count === 1 ? "friend" : "friends"} from your match ladders and seasons by post - places among you${count === 1 ? " two" : ""}.`;
}
