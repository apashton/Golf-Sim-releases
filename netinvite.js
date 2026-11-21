// A friend's join link opening the phone app (sim/netinvite.mjs) - a game's,
// a match ladder's (to ask to join it from Match ladders) or a season by
// post's (the Online tab's Seasons, ready to join): the page
// the host's QR code opens has a button that opens the app with
// a2golf://join/CODE - the App plugin (android/ble-entry.js) hands the link
// over, as the app starts or while it's running, and the code goes to the
// Online play panel. And the Windows app the same (electron/applink.mjs:
// the link it was started with, and each clicked while it runs) - games',
// ladders' and seasons' links only. Nothing in a plain browser.

import { codeFromLink, ladderCodeFromLink, seasonCodeFromLink } from "./sim/netinvite.mjs";
import { linkCodeFromLink } from "./sim/devicelink.mjs";
import { googleTokenFromLink } from "./sim/phonegoogle.mjs";

// onCode(code): an online game's; onLadder(code): a match ladder's
// (a2golf://ladder/CODE - its panel's QR code); onLink(code): the PC's
// link a phone (a2golf://link/CODE - My stats, Your phones); onSeason(code):
// a season by post's (a2golf://season/CODE - its web page).
// onGoogle(idToken): the phone app's Google sign-in coming back from the
// browser (a2golf://google/<token> - sim/phonegoogle.mjs); never on the PC.
export async function watchJoinLinks(onCode, onLadder = () => {}, onLink = () => {}, onSeason = () => {}, onGoogle = () => {}) {
  // The Windows app: a game's or a ladder's link (never a phone's link, on
  // the PC that made it).
  const pc = window.golfsimApp;
  if (pc?.onAppLink) {
    const takePc = (url) => {
      const code = codeFromLink(url);
      if (code) return onCode(code);
      const ladder = ladderCodeFromLink(url);
      if (ladder) return onLadder(ladder);
      const season = seasonCodeFromLink(url);
      if (season) onSeason(season);
    };
    pc.onAppLink(takePc);
    try {
      const launch = await pc.takeAppLink?.();
      if (launch) takePc(launch);
    } catch {
      // An older app: links typed.
    }
    return;
  }
  if (!window.Capacitor?.isNativePlatform?.()) return;
  if (!window.PocketApp) {
    try {
      await import("/pocket/ble.js");
    } catch {
      return;
    }
  }
  const app = window.PocketApp;
  if (!app) return;
  const take = (url) => {
    const google = googleTokenFromLink(url);
    if (google) return onGoogle(google);
    const code = codeFromLink(url);
    if (code) return onCode(code);
    const ladder = ladderCodeFromLink(url);
    if (ladder) return onLadder(ladder);
    const season = seasonCodeFromLink(url);
    if (season) return onSeason(season);
    const link = linkCodeFromLink(url);
    if (link) onLink(link);
  };
  try {
    app.addListener("appUrlOpen", (e) => take(e?.url));
    const launch = await app.getLaunchUrl();
    if (launch?.url) take(launch.url);
  } catch {
    // No links: the code's typed.
  }
}
