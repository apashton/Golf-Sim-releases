// Menu -> Help -> About: the licence agreement, the privacy note, the
// third-party notices and the sound credits (public/legal/*.txt,
// soundpack/CREDITS.md; the list is sim/feedback.mjs's LEGAL). A button
// each; the one picked is read and shown below them, as plain text.

import { LEGAL } from "./sim/feedback.mjs";
import { esc } from "./util.js";

export function mountLegal(el) {
  el.innerHTML = `<div class="buttons legal-buttons">${LEGAL.map((l) => `<button data-legal="${esc(l.id)}">${esc(l.name)}</button>`).join("")}</div><pre class="legal-text" hidden></pre>`;
  const out = el.querySelector(".legal-text");
  el.onclick = async (e) => {
    const b = e.target.closest("button[data-legal]");
    if (!b) return;
    const doc = LEGAL.find((l) => l.id === b.dataset.legal);
    for (const x of el.querySelectorAll("button[data-legal]")) x.classList.toggle("on", x === b);
    out.hidden = false;
    out.textContent = "Reading...";
    try {
      const r = await fetch(doc.file);
      if (!r.ok) throw new Error(r.statusText);
      out.textContent = await r.text();
    } catch {
      out.textContent = `${doc.name} couldn't be read.`;
    }
    out.scrollTop = 0;
  };
}
