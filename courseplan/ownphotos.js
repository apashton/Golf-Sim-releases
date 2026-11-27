// A photo service of the player's own, for the course plan where there are
// no open aerial photos (sim/aerial.mjs): its tile address and their key,
// kept by this PC's server (server/aerial.mjs) - never in a course, never
// sent anywhere but that service. The course plan's Photos... opens it;
// this is its one home.
//
// ownPhotos({ changed }): changed(source) once it's saved ({ id: "own",
// name, credit, maxZoom }), or changed(null) once it's taken off.

import { esc } from "../util.js";
import { checkTemplate, ownHost } from "../sim/aerial.mjs";

export const ownSource = (template) => ({ id: "own", name: `Your own (${ownHost(template)})`, credit: `Photos: ${ownHost(template)}`, maxZoom: 20 });

export async function ownPhotos({ changed }) {
  let now = null;
  try {
    const r = await fetch("/api/map/aerial/own");
    if (r.ok) now = await r.json();
  } catch {
    // None to show.
  }
  const d = document.createElement("dialog");
  d.className = "small-dialog own-photos";
  d.innerHTML = `<form method="dialog">
    <h3>Photos of your own</h3>
    <p class="small">Where there are no open aerial photos - the UK and Ireland among them - the plan can show a photo
      service you have an account with. Give its <b>tile address</b>, with <code>{z}</code>, <code>{x}</code> and
      <code>{y}</code> where a tile's zoom and place go (and <code>{key}</code> where your key goes), and your
      <b>key</b>. They're kept on this PC only and used only to show the plan. The service's terms are yours to keep to:
      use one that lets you trace from its photos.</p>
    <label class="block">Tile address <input id="own-template" size="60" spellcheck="false" autocomplete="off"
      placeholder="https://example.com/tiles/{z}/{y}/{x}?key={key}" value="${esc(now?.template ?? "")}"></label>
    <label class="block">Your key <input id="own-key" type="password" size="40" autocomplete="off"
      placeholder="${now?.key ? "(kept - leave empty to keep it)" : "if the service needs one"}"></label>
    <p class="warn small" id="own-said"></p>
    <div class="dialog-buttons">
      <button value="save" class="primary">Save</button>
      ${now ? `<button value="off" class="danger">Take it off</button>` : ""}
      <button value="cancel">Cancel</button>
    </div>
  </form>`;
  document.body.append(d);
  const said = d.querySelector("#own-said");
  d.querySelector("form").addEventListener("submit", async (e) => {
    const what = e.submitter?.value;
    if (what === "cancel") return;
    e.preventDefault();
    try {
      if (what === "off") {
        const r = await fetch("/api/map/aerial/own", { method: "DELETE" });
        if (!r.ok) throw new Error((await r.json()).error);
        changed(null);
        d.close();
        return;
      }
      const template = checkTemplate(d.querySelector("#own-template").value);
      const key = d.querySelector("#own-key").value.trim();
      const r = await fetch("/api/map/aerial/own", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ template, ...(key ? { key } : {}) }) });
      const out = await r.json();
      if (!r.ok) throw new Error(out.error);
      changed(ownSource(out.template));
      d.close();
    } catch (err) {
      said.textContent = err.message;
    }
  });
  d.addEventListener("close", () => d.remove());
  d.showModal();
}
