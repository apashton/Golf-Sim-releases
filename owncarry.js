// How far a player's own full swing with a club carries, from their stats
// (the server's /api/stats/player), for the lie guidance's "your 7 iron's
// ~150". Asked for once per player and kept; until it's in (or with no
// server, or too few shots with the club) it's null and the bag's number
// is used. `onReady` is called once it arrives, to show it. Asked again
// after a few minutes, so a session's own shots come into it.

import { ownFullCarry } from "./sim/lieguide.mjs";

// Per player: the last report that came back, when it was asked for, and
// whether an ask is on its way.
const reports = new Map();
const asked = new Map();
const pending = new Set();
const FRESH = 3 * 60 * 1000;

export function ownCarry(name, club, onReady) {
  if (!name) return null;
  const old = reports.get(name) ?? null;
  if (!pending.has(name) && (!asked.has(name) || Date.now() - asked.get(name) > FRESH)) {
    asked.set(name, Date.now());
    pending.add(name);
    fetch(`/api/stats/player?name=${encodeURIComponent(name)}`)
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null)
      .then((report) => {
        pending.delete(name);
        if (!asked.has(name) || !report) return;
        reports.set(name, report);
        if (ownFullCarry(report, club) !== ownFullCarry(old, club)) onReady?.();
      });
  }
  // The last numbers stand while new ones are fetched.
  return ownFullCarry(old, club);
}

// Forgets them all, so they're asked again (a new round: the stats have
// more shots in them).
export function forgetOwnCarries() {
  reports.clear();
  asked.clear();
  pending.clear();
}
