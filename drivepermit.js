// The web version's permission to keep its own files in the player's Google
// Drive (sim/coursedrive.mjs: the courses made in its designer): Google's
// own pop-up gives the page a token, good for an hour - kept for the tab
// (the game and the designer are pages of one tab), asked for again when
// it's run out. Only ever for the files A² Golf makes itself (drive.file).
// On the PC the server has the player's sign-in instead
// (server/googleauth.mjs); this is never loaded there.

import { GOOGLE } from "./sim/google.mjs";

const SCOPE = "https://www.googleapis.com/auth/drive.file";
const KEY = "golfsim.driveToken";
// Not handed out with less than this left of it.
const MARGIN_MS = 2 * 60000;

function inHand() {
  try {
    const t = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
    return t?.token && t.until - MARGIN_MS > Date.now() ? t : null;
  } catch {
    return null;
  }
}
function keep(t) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(t));
  } catch {
    // Not kept: asked for again next time.
  }
}
export function forgetPermit() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to forget.
  }
}

// Google's script, loaded once - ahead of the press that needs it, so its
// window opens from the press itself (a browser blocks one that doesn't).
let loading = null;
export function readyPermit() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error("Google's sign-in couldn't load - check the internet and try again"));
    };
    document.head.appendChild(s);
  });
  return loading;
}

// The permission: { token, expires (seconds) }. ask: false - only one still
// in hand, never Google's window (null with none). hint: the Google account
// to suggest.
export async function drivePermit({ ask = true, hint = null } = {}) {
  const have = inHand();
  if (have) return { token: have.token, expires: Math.round((have.until - Date.now()) / 1000) };
  if (!ask) return null;
  await readyPermit();
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE.webClient,
      scope: SCOPE,
      ...(hint ? { login_hint: hint } : {}),
      callback: (r) => {
        if (!r?.access_token || (r.scope && !String(r.scope).split(/\s+/).includes(SCOPE))) return reject(new Error(r?.error === "access_denied" ? "Google's permission wasn't given" : "Drive wasn't allowed on Google's page - try again and leave it ticked"));
        const expires = Number(r.expires_in) || 3600;
        keep({ token: r.access_token, until: Date.now() + expires * 1000 });
        resolve({ token: r.access_token, expires });
      },
      error_callback: (e) => reject(new Error(e?.type === "popup_closed" ? "Google's window was closed" : e?.type === "popup_failed_to_open" ? "The browser stopped Google's window - allow pop-ups for A² Golf and try again" : "Google's window didn't open - try again")),
    });
    client.requestAccessToken({ prompt: "" });
  });
}
