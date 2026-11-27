// The ladders' alerts on the phone (docs/ANDROID.md, "Ladder alerts"): a
// challenge, an answer, the other's Postal round in, a line said - on the
// phone even with the app closed, through Firebase (relay/alerts.mjs sends
// them). Here the app asks the phone to allow them (once), takes its alert
// token and gives it to each online ladder it's on (course/ladderonline.js
// ladderAlertToken), and a tapped alert opens Match ladders.
//
// Only in the phone app built with the owner's Firebase file - the build
// says so in /pocket/alerts.json (.github/workflows/android-app.yml):
// without Firebase, asking for a token would stop the app. Nothing on a PC
// or in a browser.

export async function startLadderAlerts({ hasOnline, onToken, onOpen, onAlert }) {
  if (!window.Capacitor?.isNativePlatform?.()) return false;
  const on = await fetch("/pocket/alerts.json")
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  if (!on?.on) return false;
  if (!window.PocketPush) {
    try {
      await import("/pocket/ble.js");
    } catch {
      return false;
    }
  }
  const push = window.PocketPush;
  if (!push) return false;
  try {
    push.addListener("registration", (t) => t?.value && onToken(t.value));
    push.addListener("pushNotificationActionPerformed", (a) => onOpen(a?.notification?.data?.ladder ?? null));
    // (With the app open: said as a message, the ladder brought up to date.)
    push.addListener("pushNotificationReceived", (n) => onAlert(n?.body ?? n?.title ?? ""));
    // Asked for only once there's an online ladder to be alerted about.
    if (!hasOnline()) return false;
    let perm = await push.checkPermissions();
    if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") perm = await push.requestPermissions();
    if (perm.receive !== "granted") return false;
    await push.createChannel?.({ id: "ladders", name: "Match ladders", description: "Challenges, answers and results on your match ladders", importance: 4 });
    await push.register();
    return true;
  } catch {
    return false;
  }
}
