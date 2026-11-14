// What to record, asked as Record's pressed (the owner: "when we hit
// record, we need to pick how it is recording? Full screen or a scene?"):
// the screen just as it shows, or one of the recording's scenes (sim/
// videorec.mjs recordChoices) - in the page the Record button, Shift + V or
// the menu was used in, so with the screens separate it's on the laptop,
// not the projector. Enter takes what was recorded last; Esc, Cancel or
// clicking off records nothing. The Recording panel's What to record sets
// it to one of them, so it isn't asked.
//
//   chooseRecording(doc, layouts, settings) -> Promise<{ what, scene } | null>

import { esc } from "./util.js";
import { recordChoices, choiceFor } from "./sim/videorec.mjs";

// The box open now: asked once at a time - Record pressed again (or in
// the other window) while it's up does nothing more.
let asking = null;

export function chooseRecording(doc, layouts, settings) {
  if (asking?.isConnected) {
    asking.querySelector("button.primary")?.focus();
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    const choices = recordChoices(layouts, settings);
    // What was recorded last is first to hand.
    const first = settings?.lastWhat === "screen" ? 0 : Math.min(1, choices.length - 1);
    const d = doc.createElement("dialog");
    d.className = "small-dialog record-choice";
    d.innerHTML = `<form method="dialog">
      <h3>What to record?</h3>
      <div class="record-choices">${choices
        .map((c, i) => `<button value="${i}" class="${i === first ? "primary" : ""}" ${i === first ? "autofocus" : ""}><b>${esc(c.name)}</b>${c.note ? `<span class="small">${esc(c.note)}</span>` : ""}</button>`)
        .join("")}</div>
      <p class="muted small">To skip this, set What to record in the Recording panel (Recording and sound).</p>
      <div class="dialog-buttons"><button value="cancel">Cancel</button></div>
    </form>`;
    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      asking = null;
      const c = choiceFor(choices, value);
      d.remove();
      resolve(c ? { what: c.what, scene: c.scene ?? null } : null);
    };
    d.addEventListener("close", () => finish(d.returnValue));
    // Clicking off the box: nothing recorded.
    d.addEventListener("click", (e) => e.target === d && d.close("cancel"));
    // Its keys are its own (Enter, Esc, Tab): the game behind it never
    // takes them - a card's Esc, or Shift + V asking again.
    d.addEventListener("keydown", (e) => e.stopPropagation());
    asking = d;
    doc.body.appendChild(d);
    d.showModal();
  });
}
