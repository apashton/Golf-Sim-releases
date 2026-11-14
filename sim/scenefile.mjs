// A recording's scenes as a file (the owner: "I'd like to be able to
// design the records scenes etc outside the game to then plug in"): made on
// the scene designer page (tools/scenedesigner.mjs), or exported from one
// PC's Recording panel, and brought into another's - and the scenes that
// come with the game, public/scenes/*.json (listed in public/scenes/
// index.json), offered beside the presets (sim/videolayout.mjs PRESETS).
//
// A file: { format: "a2golf-scenes", version: 1, name?, scenes: [{ name,
// layers }] } - each scene a layout (sim/videolayout.mjs), its layers as
// the panel keeps them, so a scene is drawn the same wherever it was made.
// Read back through the layouts' own cleaning: anything a newer version
// added that this one doesn't know is left out, never a broken scene.
// Pure, for the page, the designer and the tests.

import { cleanLayout, saveAs, MAX_LAYOUTS } from "./videolayout.mjs";

export const SCENE_FORMAT = "a2golf-scenes";
export const SCENE_VERSION = 1;

// The file for some layouts: their names and layers (their ids are the
// PC's own, given afresh where they're brought in).
export function sceneFile(layouts, { name = "" } = {}) {
  const scenes = (layouts ?? [])
    .map((l, i) => cleanLayout(l, i))
    .filter((l) => l?.layers.length)
    .map((l) => ({ name: l.name, layers: l.layers }));
  return { format: SCENE_FORMAT, version: SCENE_VERSION, ...(name ? { name: String(name).slice(0, 60) } : {}), scenes };
}

// A file's name to save it as: "A2 Golf scenes - YouTube.json".
export function sceneFileName(layouts) {
  const one = layouts?.length === 1 ? layouts[0].name : `${layouts?.length ?? 0} scenes`;
  return `A2 Golf scenes - ${String(one).replace(/[\\/:*?"<>|]+/g, " ").trim() || "scenes"}.json`;
}

// The scenes in a file (its text, or what it parsed to): [layout], each
// cleaned. Also taken: a list of layouts, one layout ({ name, layers }), or
// the panel's own store ({ layouts }). Throws an Error saying what's wrong,
// in words for the player.
export function readSceneFile(input) {
  let o = input;
  if (typeof input === "string") {
    try {
      o = JSON.parse(input);
    } catch {
      throw new Error("That isn't a scenes file (it isn't the kind of file the scene designer saves)");
    }
  }
  const list = o?.format === SCENE_FORMAT ? o.scenes : Array.isArray(o) ? o : Array.isArray(o?.layouts) ? o.layouts : Array.isArray(o?.layers) ? [o] : null;
  if (!Array.isArray(list)) throw new Error("That isn't an A² Golf scenes file");
  const scenes = list
    .map((s, i) => cleanLayout(s, i))
    .filter((s) => s?.layers.length)
    .slice(0, MAX_LAYOUTS);
  if (!scenes.length) throw new Error("That scenes file has no scenes in it");
  return scenes;
}

const sameLayers = (a, b) => JSON.stringify(a.layers) === JSON.stringify(b.layers);

// The layouts kept with `scenes` added, each a layout of its own (its name
// made fresh if one's taken: "YouTube 2"); one already kept just as it is
// (the same layers) isn't added twice. The first one brought in (or found)
// is made active. Returns { store, added: [id], already: n, left: n - those
// with no room (MAX_LAYOUTS) }.
export function addScenes(store, scenes) {
  let s = store;
  const added = [];
  let already = 0;
  let first = null;
  let left = 0;
  for (const scene of scenes ?? []) {
    const same = s.layouts.find((l) => sameLayers(l, scene));
    if (same) {
      already++;
      first ??= same.id;
      continue;
    }
    const r = saveAs(s, scene.name, scene.layers);
    if (!r.id) {
      left++;
      continue;
    }
    s = r.store;
    added.push(r.id);
    first ??= r.id;
  }
  return { store: first ? { ...s, active: first } : store, added, already, left };
}

// What a bring-in did, in words: "2 scenes added", "Already here",
// "1 added - no room for 2 more (24 is the most: delete one first)".
export function addedWords({ added, already, left }) {
  const bits = [];
  if (added.length) bits.push(`${added.length} scene${added.length === 1 ? "" : "s"} added`);
  if (already) bits.push(`${already} already here`);
  if (left) bits.push(`no room for ${left} more (${MAX_LAYOUTS} is the most: delete one first)`);
  return bits.join(" - ") || "Nothing to add";
}

// The scenes that come with the game: public/scenes/index.json, { files:
// [name.json] }, each a scenes file. fetchText(path) -> Promise<text>.
// Returns [{ file, name, scenes }]; a file that won't read is left out.
export async function readyMadeScenes(fetchText) {
  let index;
  try {
    index = JSON.parse(await fetchText("scenes/index.json"));
  } catch {
    return [];
  }
  const out = [];
  for (const file of (Array.isArray(index?.files) ? index.files : []).filter((f) => typeof f === "string" && /^[\w .-]+\.json$/.test(f))) {
    try {
      const text = await fetchText(`scenes/${file}`);
      const parsed = JSON.parse(text);
      out.push({ file, name: String(parsed?.name ?? file.replace(/\.json$/, "")).slice(0, 60), scenes: readSceneFile(parsed) });
    } catch {
      // (A bad file: the rest still come.)
    }
  }
  return out;
}
