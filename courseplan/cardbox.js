// The course plan's box for the club's card (courseplan.js): pasted in as
// the designer's scorecard is read (sim/course.mjs parseScorecard), kept on
// the plan (sim/planextras.mjs setCard) - the hole list then sets each hole
// beside it, and the suggestion is led by it.
//
// cardBox(el, { card, use(card), clear(), said }): el - an empty element;
// card - the plan's card now, or none; said - what the box says under it.

import { esc } from "../util.js";
import { parseScorecard } from "../sim/course.mjs";

// The card as lines to paste back: hole, par, yards, stroke index.
export const cardText = (card) => (card ?? []).map((c, i) => [i + 1, c.par ?? "", c.yards ?? "", c.si ?? ""].join(" ").trim()).join("\n");

export function cardBox(el, { card = null, use, clear, said = "" }) {
  el.innerHTML = `
    <details class="cplan-cardbox">
      <summary>The club's card${card ? ` <span class="muted">(${card.length} holes)</span>` : ""}</summary>
      <p class="muted small">Paste the club's scorecard: each hole is set beside its card's yards and par, the suggested holes are found by it, and it's built with the card's pars and stroke indexes.</p>
      <textarea rows="6" spellcheck="false" placeholder="One hole a line - hole, par, yards, stroke index:&#10;1 4 385 7&#10;2 3 165 15&#10;or rows: Par 4 3 5 ... / Yards 385 165 ... / SI 7 15 ...">${esc(cardText(card))}</textarea>
      <div class="row">
        <button data-card="use" class="primary">Use the card</button>
        <button data-card="clear" ${card ? "" : "disabled"}>Take it off</button>
      </div>
      <p class="small cplan-cardnote"></p>
    </details>`;
  const say = (text, warn = false) => {
    const p = el.querySelector(".cplan-cardnote");
    p.className = `small cplan-cardnote${warn ? " warn" : ""}`;
    p.textContent = text;
  };
  if (said) {
    say(said);
    el.querySelector("details").open = true;
  }
  el.querySelector('[data-card="use"]').addEventListener("click", () => {
    let read;
    try {
      read = parseScorecard(el.querySelector("textarea").value);
    } catch (err) {
      return say(err.message, true);
    }
    use(read, `Read ${read.length} holes: par ${read.reduce((s, c) => s + (c.par ?? 0), 0)}, ${read.reduce((s, c) => s + (c.yards ?? 0), 0).toLocaleString()} yards.`);
  });
  el.querySelector('[data-card="clear"]').addEventListener("click", () => {
    say("");
    clear();
  });
}
