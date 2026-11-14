// Questions and messages in the page itself, in place of the browser's own
// confirm(), prompt() and alert(). The Windows app has no prompt() at all
// (Electron leaves it out, so the designer's Rename did nothing there), and
// on Windows a confirm() or alert() can leave the page's boxes unable to
// take typing, or a list to open, until the window is switched away and
// back (the owner: "I couldn't seem the select boxes and type into the name
// box... delete would work but that was the only button").
//
//   ask(text, { yes, no, danger })     -> Promise<boolean>
//   askText(text, value, { yes })      -> Promise<string | null> (null: cancelled)
//   tell(text)                         -> Promise<void>
//
// Esc, or clicking off the box, is No. Enter in a text box is Yes.

import { esc } from "./util.js";

function box({ text, value = null, yes = "OK", no = "Cancel", danger = false, alone = false }) {
  return new Promise((resolve) => {
    const d = document.createElement("dialog");
    d.className = "small-dialog ask-box";
    // Yes first in the form, so Enter in the text box is Yes.
    d.innerHTML = `<form method="dialog">
      <p class="ask-text">${esc(text)}</p>
      ${value != null ? `<input class="ask-answer" value="${esc(value)}" maxlength="80" autocomplete="off" spellcheck="false">` : ""}
      <div class="dialog-buttons">
        <button value="yes" class="${danger ? "danger" : "primary"}">${esc(yes)}</button>
        ${alone ? "" : `<button value="no">${esc(no)}</button>`}
      </div>
    </form>`;
    const input = d.querySelector("input");
    d.addEventListener("close", () => {
      const ok = d.returnValue === "yes";
      const answer = input ? input.value : null;
      d.remove();
      resolve({ ok, answer });
    });
    // A click on the backdrop (outside the box) is No.
    d.addEventListener("click", (e) => {
      if (e.target !== d) return;
      const r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close("no");
    });
    document.body.appendChild(d);
    d.showModal();
    // Typing goes straight in; a question that loses something starts on
    // No, so a stray Enter can't do it.
    if (input) {
      input.focus();
      input.select();
    } else d.querySelector(danger && !alone ? 'button[value="no"]' : 'button[value="yes"]').focus();
  });
}

export const ask = (text, opts = {}) => box({ text, ...opts }).then((r) => r.ok);
export const askText = (text, value = "", opts = {}) => box({ text, value: String(value ?? ""), ...opts }).then((r) => (r.ok ? r.answer : null));
export const tell = (text) => box({ text, alone: true }).then(() => undefined);
