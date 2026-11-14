// A² Golf on the web (docs/WEB-PLAN.md; the owner, 8 November 2026: "Let's
// build a test for the web please. Doesn't have to have all features if
// that helps"): the phone app's web folder - the game with its pocket
// server answering the page's own requests (tools/androidweb.mjs) - put on
// a website (tools/webbuild.mjs, .github/workflows/web-app.yml), for an
// iPhone or anyone without the app. What differs from the app:
//   - the page says it's the web's (window.a2web, set first in its head):
//     no "a newer app is out" card (appupdate.js is the APK's), the
//     version in the phone home's foot is the web's;
//   - no launch monitor: the app reaches the Omni through its Bluetooth
//     plugin, and a page has only Web Bluetooth - none at all in Safari on
//     an iPhone - so the menu's Range session is left out (WEB_MENU_OFF);
//     everyone swings with a finger, the mouse or a game controller;
//   - Add to Home Screen: a manifest and icons, so a phone keeps it as an
//     app of its own - its icon, the whole screen.
// Pure: the build writes these into the folder; test/webbuild.test.mjs.

export const WEB_FLAG = "<script>window.a2web = true;</script>";
export const MANIFEST = "manifest.webmanifest";
// The icons the build makes from build/icon.png: Android's and the
// manifest's, and the iPhone's Home Screen one.
export const ICONS = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
];
// The game's own dark green, behind the page as it opens.
const BACKGROUND = "#0b1a12";

// The course designer is on every version - the PC's, the web version's
// (the owner, 14 November 2026: "Also build the web designer") and the
// phone app's ("Phone app needs the designer too please"); off the PC its
// courses are kept on the device (sim/coursekeep.mjs). What isn't
// everywhere - `w`: the page's window (pocket: the phone's or the web's own
// server in the page; a2web: the web's):
// A real course from the map, and its ground from LiDAR files, are worked
// out by the PC's server (server/mapimport.mjs, server/lidar.mjs): not in
// a page with only itself to ask.
export const hasMapCourses = (w = globalThis) => !w?.pocket;
// The courses you make kept in your own Google Drive (sim/coursesync.mjs):
// the PC (its server has the player's Google sign-in) and the web version
// (the page asks Google's own window) - not the phone app yet, where
// Google won't open its window inside an app's page.
export const hasCourseDrive = (w = globalThis) => !w?.pocket || !!w?.a2web;

// The menu's items a page can't do (sim/menu.mjs ids): a range session is
// the launch monitor over the app's Bluetooth.
export const WEB_MENU_OFF = new Set(["range-session"]);

// The head's lines for a web page: the flag first, then the manifest, the
// icons and how a phone shows it from the Home Screen.
export function webHead() {
  return [
    WEB_FLAG,
    `<link rel="manifest" href="/${MANIFEST}" />`,
    `<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />`,
    `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`,
    `<meta name="theme-color" content="${BACKGROUND}" />`,
    `<meta name="mobile-web-app-capable" content="yes" />`,
    `<meta name="apple-mobile-web-app-capable" content="yes" />`,
    `<meta name="apple-mobile-web-app-title" content="A² Golf" />`,
    `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />`,
  ].join("\n    ");
}

// A game page made the web's: the head's lines in at the top of its head,
// just after its character set and ahead of every script (the pocket
// server's start included) - and its empty icons ("data:,", there so a
// browser doesn't ask the PC's server for one) taken out, for the web's
// own. Once only.
export function webPage(html) {
  if (html.includes(WEB_FLAG)) return html;
  const page = html.replace(/[ \t]*<link rel="icon" href="data:," \/>\r?\n?/g, "");
  const m = /<meta charset="[^"]*" \/>/i.exec(page) ?? /<head[^>]*>/i.exec(page);
  if (!m) throw new Error("The page has no head to put the web's lines in");
  const at = m.index + m[0].length;
  return `${page.slice(0, at)}\n    ${webHead()}${page.slice(at)}`;
}

// The manifest: the game as an app of its own on a phone's Home Screen.
export function webManifest({ version = null } = {}) {
  return {
    name: "A² Golf",
    short_name: "A² Golf",
    description: "A golf game you swing with a finger, the mouse or a controller - play a round, the range and online with friends.",
    start_url: "/",
    scope: "/",
    display: "fullscreen",
    orientation: "any",
    background_color: BACKGROUND,
    theme_color: BACKGROUND,
    icons: ICONS.filter((i) => i.file.startsWith("icon-")).map((i) => ({ src: `/${i.file}`, sizes: `${i.size}x${i.size}`, type: "image/png", purpose: "any" })),
    ...(version ? { version: String(version) } : {}),
  };
}

// The version in words, for the phone home's foot: "Web test 3.0.660
// (abc1234)", or the app's "Test app 0.1.34-test".
export const versionWords = ({ version, commit = null } = {}, web = false) => `${web ? "Web test" : "Test app"} ${version}${commit ? ` (${commit})` : ""}`;

// A picture made smaller ({ width, height, data: RGBA }): each new pixel
// the average of the old ones it covers (an icon from the game's 512).
export function shrinkPicture({ width, height, data }, size) {
  const out = new Uint8ClampedArray(size * size * 4);
  const sx = width / size;
  const sy = height / size;
  for (let y = 0; y < size; y++) {
    const y0 = y * sy;
    const y1 = y0 + sy;
    for (let x = 0; x < size; x++) {
      const x0 = x * sx;
      const x1 = x0 + sx;
      const sum = [0, 0, 0, 0];
      let area = 0;
      for (let py = Math.floor(y0); py < Math.min(height, Math.ceil(y1)); py++) {
        const wy = Math.min(py + 1, y1) - Math.max(py, y0);
        for (let px = Math.floor(x0); px < Math.min(width, Math.ceil(x1)); px++) {
          const w = wy * (Math.min(px + 1, x1) - Math.max(px, x0));
          const i = (py * width + px) * 4;
          // (Colours weighted by how solid they are, so a clear edge
          // doesn't darken.)
          const a = data[i + 3] * w;
          sum[0] += data[i] * a;
          sum[1] += data[i + 1] * a;
          sum[2] += data[i + 2] * a;
          sum[3] += a;
          area += w;
        }
      }
      const o = (y * size + x) * 4;
      if (sum[3] > 0) for (let c = 0; c < 3; c++) out[o + c] = Math.round(sum[c] / sum[3]);
      out[o + 3] = Math.round(sum[3] / area);
    }
  }
  return { width: size, height: size, data: out };
}
