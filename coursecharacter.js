// The course's character on its page in the designer (sim/
// coursecharacter.mjs): its look - turf, long grass, sand and air - what
// its town is built of, and its bunkers' faces, each a choice that's laid
// on every hole at once (and changed back the same way).
//
// mountCharacter(el, { course, change }): course() - the course now;
// change(next) - the course with a choice made.

import { esc } from "./util.js";
import { LOOKS, TOWNS, FACES, characterOf, characterChoices, withLook, withTown, withFaces, facesSummary } from "./sim/coursecharacter.mjs";

const select = (id, choices, now, label, title) =>
  `<label title="${esc(title)}">${esc(label)} <select id="${id}">${Object.entries(choices)
    .map(([k, v]) => `<option value="${k}" ${k === now ? "selected" : ""} title="${esc(v.blurb)}">${esc(v.name)}</option>`)
    .join("")}</select></label>`;

export function mountCharacter(el, { course, change }) {
  const draw = () => {
    const c = course();
    const now = characterOf(c);
    const can = characterChoices(c);
    el.innerHTML = `<h3>Its character</h3>
      <div class="row">
        ${select("char-look", LOOKS, now.look, "Look", "Its turf, long grass, sand and air, on every hole")}
        ${can.town ? select("char-town", TOWNS, now.town, "Its town", "What the buildings round it are built of, where the map doesn't say - one building the same from every hole") : ""}
        ${can.faces ? select("char-faces", FACES, now.faces, "Bunker faces", "Each bunker's face, where its LiDAR shows one") : ""}
      </div>
      <p class="muted small" id="char-words">${esc(words(now, can, c))}</p>`;
    el.querySelector("#char-look").addEventListener("change", (e) => apply(() => withLook(course(), e.target.value)));
    el.querySelector("#char-town")?.addEventListener("change", (e) => apply(() => withTown(course(), e.target.value)));
    el.querySelector("#char-faces")?.addEventListener("change", (e) => apply(() => withFaces(course(), e.target.value)));
  };
  // (Faces read every hole's ground: a few seconds, said, before it's done.)
  const apply = (make) => {
    el.querySelectorAll("select").forEach((s) => (s.disabled = true));
    el.querySelector("#char-words").textContent = "Laying it on every hole...";
    setTimeout(() => {
      try {
        change(make());
      } finally {
        draw();
      }
    }, 30);
  };
  draw();
  return { draw };
}

// What's chosen, in a line.
const lower1 = (t) => t.charAt(0).toLowerCase() + t.slice(1);
function words(now, can, course) {
  const parts = [LOOKS[now.look].blurb + "."];
  if (can.town) parts.push(`Buildings: ${lower1(TOWNS[now.town].blurb)}.`);
  if (can.faces) {
    const f = now.faces === "revetted" ? facesSummary(course) : null;
    parts.push(f ? `Bunkers: stacked turf faces on ${f.faced} of the ${f.bunkers}, where the LiDAR shows a face.` : `Bunkers: ${lower1(FACES[now.faces].blurb)}.`);
  }
  return parts.join(" ");
}
