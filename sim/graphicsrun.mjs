// The graphics record of a whole run of the game, across every load of its
// page (the owner: "if I send a report, all freezes and load times in 30
// mins are fetched in the report?" - they weren't: a graphics change
// reloads the page, and the page's record - its long frames, frame rates,
// load and hole switches - started again with it, so a report covered only
// the time since the last change). Each load of the page is a spell: the
// page sends its facts (app.js graphicsFacts, with the spell's id, start
// and setting) to the local server as it goes and as it leaves, the server
// keeps the last SPELLS_KEPT of them (server/server.mjs /api/graphics - it
// runs for the whole run, whatever the page does), and a report carries
// the spell on screen in full and every earlier one in short
// (electron/main.mjs reportGraphics, electron/report.mjs earlierSection).
// Pure: the list kept, and the short form of a spell.

export const SPELLS_KEPT = 12;
// The worst frames kept of a spell in its short form, and of the run.
export const WORST_KEPT = 5;
export const RUN_WORST = 10;

const num = (v) => (Number.isFinite(Number(v)) && v !== null && v !== "" ? Number(v) : null);

// The list with `facts` in it: in place of the spell with the same id,
// else among the rest in the order the pages started, the oldest dropped
// past SPELLS_KEPT. Facts without a spell id are left out (an older page).
// Returns a new list.
export function addSpell(list, facts) {
  const spells = (Array.isArray(list) ? list : []).filter((s) => typeof s?.spell?.id === "string");
  const id = facts?.spell?.id;
  if (typeof id !== "string" || !id) return spells;
  const i = spells.findIndex((s) => s.spell.id === id);
  if (i >= 0) spells[i] = facts;
  else spells.push(facts);
  spells.sort((a, b) => (num(a.spell.startedAt) ?? 0) - (num(b.spell.startedAt) ?? 0));
  return spells.slice(-SPELLS_KEPT);
}

// A spell in short, for a report's list of earlier ones: when the page
// started, when it was last heard from and when it ended (and why, if it
// said: a graphics change, the game's video; or not at all - the window stuck
// or closed), the setting it was built at, how its load went, its long
// frames (how many, what of) and the worst of them, and its moves from
// hole to hole.
export function spellSummary(facts) {
  const f = facts && typeof facts === "object" ? facts : {};
  const s = f.spell ?? {};
  const long = f.long && typeof f.long === "object" ? f.long : {};
  return {
    id: typeof s.id === "string" ? s.id : null,
    startedAt: num(s.startedAt),
    heardAt: num(s.at),
    endedAt: num(s.ended?.at),
    why: typeof s.ended?.why === "string" && s.ended.why ? s.ended.why : null,
    setting: typeof f.setting === "string" ? f.setting : null,
    load: f.load && typeof f.load === "object" ? f.load : null,
    long: {
      total: num(long.total) ?? 0,
      counts: Array.isArray(long.counts) ? long.counts.filter((c) => Array.isArray(c)) : [],
    },
    worst: worstOf(long.latest, WORST_KEPT),
    holeSwitches: Array.isArray(f.holeSwitches) ? f.holeSwitches : [],
  };
}

// The longest frames among `latest`, longest first.
function worstOf(latest, n) {
  return (Array.isArray(latest) ? latest : [])
    .filter((e) => e && num(e.ms) !== null)
    .sort((a, b) => Number(b.ms) - Number(a.ms))
    .slice(0, n);
}

// The worst frames of the whole run - every spell's, the one on screen
// included - longest first, each with the setting it was drawn at.
export function runWorst(spells, n = RUN_WORST) {
  const all = [];
  for (const f of Array.isArray(spells) ? spells : []) {
    const setting = typeof f?.setting === "string" ? f.setting : null;
    for (const e of worstOf(f?.long?.latest, n)) all.push({ ...e, setting });
  }
  return all.sort((a, b) => Number(b.ms) - Number(a.ms)).slice(0, n);
}

// The same from what a report has: the earlier spells in short
// (spellSummary: their worst) and the spell on screen in full (its facts).
export function worstAcross(earlier, current, n = RUN_WORST) {
  const all = [];
  for (const s of Array.isArray(earlier) ? earlier : []) {
    for (const e of Array.isArray(s?.worst) ? s.worst : []) if (e && num(e.ms) !== null) all.push({ ...e, setting: s.setting ?? null });
  }
  const setting = typeof current?.setting === "string" ? current.setting : null;
  for (const e of worstOf(current?.long?.latest, n)) all.push({ ...e, setting });
  return all.sort((a, b) => Number(b.ms) - Number(a.ms)).slice(0, n);
}
