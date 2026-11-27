// What's left of the WebGPU port, read off a scene (docs/BACKLOG-GRAPHICS.md,
// "Finishing the WebGPU port"). three.js's WebGPURenderer draws only node
// materials: it makes one from each of three's own materials as they are,
// leaves out any patch made to one (onBeforeCompile), and can't make one
// from a shader of the game's own (ShaderMaterial) at all. So each material
// in a scene is one of:
//
//   ported   a node material: drawn as on WebGL (once its picture matches)
//   same     three's own, unpatched: drawn as on WebGL
//   plain    patched: drawn without its patch (no wind, no country colour...)
//   missing  a shader of its own: not drawn (look/gpu.js leaves it out)
//
// Pure: a scene is anything with traverse(), its objects three.js's shape.

export const PORT_STATES = Object.freeze(["ported", "same", "plain", "missing"]);

// One material's state. `basePatch`: the onBeforeCompile every material has
// unpatched (THREE.Material.prototype's); without it, a material's own is a
// patch.
export function portState(m, basePatch = undefined) {
  if (!m) return null;
  // (Or drawn by its node version: look/twins.js, look/nodetwins.js.)
  if (m.isNodeMaterial || (m.userData?.twin?.made && !m.userData.twin.partial)) return "ported";
  if (m.isShaderMaterial || m.isRawShaderMaterial) return "missing";
  const own = Object.prototype.hasOwnProperty.call(m, "onBeforeCompile") && typeof m.onBeforeCompile === "function" && m.onBeforeCompile !== basePatch;
  return own ? "plain" : "same";
}

// What a drawn thing is called: its own name, or its nearest named group's,
// or its material's, or the kind of material it is.
export function portLabel(o, m) {
  for (let p = o; p; p = p.parent) if (p.name) return p.name;
  return m?.name || m?.type || "unnamed";
}

const drawable = (o) => !!(o && (o.isMesh || o.isPoints || o.isLine || o.isSprite) && o.material);

// Every drawn thing under `root`, counted by state, with what's plain or
// missing listed by name (most first). Each material counted once per name.
export function portSurvey(root, basePatch = undefined) {
  const counts = { ported: 0, same: 0, plain: 0, missing: 0 };
  const named = { plain: new Map(), missing: new Map() };
  const seen = new Set();
  root?.traverse?.((o) => {
    if (!drawable(o)) return;
    for (const m of [o.material].flat()) {
      const state = portState(m, basePatch);
      if (!state || seen.has(m)) continue;
      seen.add(m);
      counts[state]++;
      if (state === "plain" || state === "missing") {
        const label = portLabel(o, m);
        named[state].set(label, (named[state].get(label) ?? 0) + 1);
      }
    }
  });
  const list = (map) => [...map].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(([name, n]) => ({ name, n }));
  return { counts, plain: list(named.plain), missing: list(named.missing) };
}

// One line for a report or the compare tool: "12 ported, 30 same, 8 plain
// (ground 3, trees 2...), 4 missing (sky, clouds...)".
export function portLine(survey, most = 6) {
  if (!survey) return "";
  const { counts } = survey;
  const some = (items) => {
    const shown = items.slice(0, most).map((i) => (i.n > 1 ? `${i.name} ${i.n}` : i.name));
    if (items.length > most) shown.push(`${items.length - most} more`);
    return shown.length ? ` (${shown.join(", ")})` : "";
  };
  return `${counts.ported} ported, ${counts.same} as they are, ${counts.plain} plain${some(survey.plain)}, ${counts.missing} not drawn${some(survey.missing)}`;
}
