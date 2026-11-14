// Sharing a course with friends, and fetching a friend's (sim/sharedcourse.mjs
// says what and why; the PC's server/sharedcourses.mjs and the phone's and
// web version's pocket server answer /api/courses/share and /shared):
//   shareBox(id, name)   the PC's own course put up by a code - shown with
//                        its link and QR code, to send to friends
//   friendBox()          a friend's course fetched by its code (or link),
//                        kept here as a course of its own -> { id, name }
//                        or null
// Small boxes in the page, as askbox.js's.

import { esc } from "./util.js";
import { qrPath } from "./sim/qrcode.mjs";

const post = (url, body) =>
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(async (r) => {
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error ?? r.statusText);
    return j;
  });
function qrSvg(text) {
  const q = qrPath(text);
  return q ? `<svg viewBox="0 0 ${q.size} ${q.size}" role="img" aria-label="QR code for the course"><rect width="${q.size}" height="${q.size}" fill="#fff"/><path d="${q.d}" fill="#000"/></svg>` : "";
}
function box(html) {
  const d = document.createElement("dialog");
  d.className = "small-dialog share-box";
  d.innerHTML = `<form method="dialog">${html}</form>`;
  d.addEventListener("close", () => d.remove());
  document.body.appendChild(d);
  d.showModal();
  return d;
}

export async function shareBox(id, name) {
  const d = box(`<h3>Share ${esc(name ?? "this course")}</h3><p class="small share-msg">Putting it up for friends...</p><div class="dialog-buttons"><button value="close" class="primary">Done</button></div>`);
  const msg = d.querySelector(".share-msg");
  try {
    const r = await post("/api/courses/share", { id });
    msg.outerHTML = `<p class="small">Friends add it with this code - on the PC, the phone app or the web version: <b>Course</b>, <b>Friend's course...</b></p>
      <p class="share-code">${esc(r.code)}</p>
      <div class="share-qr">${qrSvg(r.link)}</div>
      <p class="small"><a href="${esc(r.link)}" target="_blank" rel="noopener">${esc(r.link)}</a></p>
      <p class="muted small">${r.again ? "It's the same as when you last shared it, so it's the same code. " : ""}It's this course as it is now: change it and share it again for a new code - the old one stays as it was, so a season on it doesn't change.</p>`;
  } catch (err) {
    msg.textContent = `Couldn't share it: ${err.message}`;
  }
}

export function friendBox() {
  return new Promise((resolve) => {
    let got = null;
    const d = box(`<h3>A friend's course</h3>
      <p class="small">Type the code they sent (a C and five letters or numbers), or paste their link.</p>
      <input type="text" class="friend-code" maxlength="200" autocomplete="off" spellcheck="false" placeholder="C7Q2MX" aria-label="The course's code">
      <p class="small friend-msg" role="status" aria-live="polite"></p>
      <div class="dialog-buttons"><button value="close">Close</button><button type="button" class="primary friend-go">Fetch it</button></div>`);
    const input = d.querySelector(".friend-code");
    const msg = d.querySelector(".friend-msg");
    const go = async () => {
      msg.textContent = "Fetching it...";
      try {
        got = await post("/api/courses/shared", { code: input.value });
        d.close();
      } catch (err) {
        msg.textContent = err.message;
      }
    };
    d.querySelector(".friend-go").addEventListener("click", go);
    input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      go();
    });
    d.addEventListener("close", () => resolve(got));
    input.focus();
  });
}
