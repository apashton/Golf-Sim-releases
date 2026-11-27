// How the phone looks for the Omni again (pocket/pocket.mjs; docs/
// ANDROID-PLAN.md, "At the range, properly": the launch monitor
// reconnecting by itself). A search (a 10 s Bluetooth scan) every few
// seconds, slower after a run of them finds nothing; with an Omni had
// since the app opened, connecting straight to it in turn with the
// searches - quicker than a scan, and it reaches one that's stopped
// advertising - and the first thing tried. Back in front (the phone
// woken, the app switched back to), straight away, slow or not. An Omni
// left be for going quiet (omnilink.js wentQuiet: asleep, say) is tried
// again after `quietAgain` (OmniLink wake), as it is back in front. Pure.

export const OMNI_RETRY = Object.freeze({
  // A try every `every` ms; after `slowAfter` in a row come to nothing,
  // every `slowEvery`.
  every: 5_000,
  slowAfter: 6,
  slowEvery: 30_000,
  quietAgain: 120_000,
});

// What to try now: "known" (connect straight to the Omni had before),
// "scan", or null (nothing: one's not due, or it isn't looking).
// wantsScan: OmniLink's (no Omni, nothing under way); known: an Omni had
// since the app opened; failed: tries in a row come to nothing; sinceLast:
// ms since the last; resumed: just back in front.
export function omniTry({ wantsScan, known = false, failed = 0, sinceLast = Infinity, resumed = false }) {
  if (!wantsScan) return null;
  if (!resumed && failed >= OMNI_RETRY.slowAfter && sinceLast < OMNI_RETRY.slowEvery) return null;
  return known && failed % 2 === 0 ? "known" : "scan";
}
