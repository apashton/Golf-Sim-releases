// The course designer: a scorecard in, a course out, and any hole redesigned
// until it's one you want to play. Or a real course, rebuilt from
// OpenStreetMap and open terrain data, then tidied up hole by hole.

import { buildCourse, rebuildHole, parseScorecard, courseTotals, slugify, newSeed, OPTIONS, OPTION_LABELS, MIN_YARDS, MAX_YARDS, reslopeGreens } from "./sim/course.mjs";
import { STYLES, PATTERNS, PARS, LENGTHS, DETAILS, PRESETS, makeCard, sectionsFor, cleanSections, presetChoices } from "./sim/coursemaker.mjs";
import { reworkMappedHole, MAPPED_OPTIONS } from "./sim/mapcourse.mjs";
import { holeStory } from "./sim/architect.mjs";
import { mountHandEditor } from "./holeeditor.js";
import { mowingFor, mowSeed, mowChoice, FAIRWAY_MOWS, GREEN_MOWS } from "./sim/mowing.mjs";
import { withEdits } from "./sim/holeedits.mjs";
import { riseToGreen } from "./sim/groundedit.mjs";
import { esc } from "./util.js";
import { ask, askText, tell } from "./askbox.js";
import { withHills, HILLS, HILL_NAMES, coursePlaces, toCourse } from "./sim/imaginary.mjs";
import { isHills } from "./sim/coursewide.mjs";
import { mountCourseMap } from "./coursewide.js";
import { mountReview, rememberPlays } from "./reviewpanel.js";
import { SEARCH_CHOICES, canSearch, searchWords, searchSaid } from "./sim/coursesearch.mjs";
import { findBest } from "./searchrunner.js";
import { forHills } from "./sim/searchkept.mjs";
import { canMoveHoles } from "./sim/coursewide.mjs";
import { courseNeighbours } from "./sim/neighbours.mjs";
import { shapeOwners, sayOwner, OWNED } from "./sim/owners.mjs";
import { holeFrame } from "./sim/terrain.mjs";
import { holeLinks, drawLink } from "./sim/linkpaths.mjs";
import { SEA_CHOICES, SEA_NAMES, SEA_GAPS, SEA_GAP_NAMES, seaShape } from "./sim/coast.mjs";
import { CourseFinder } from "./coursefinder.js";
import { standsFor } from "./sim/treepalette.mjs";
import { holeSignature } from "./sim/treeclear.mjs";
import { hasMapCourses, hasCourseDrive } from "./sim/webapp.mjs";
import { driveBox, driveQuietly } from "./coursedrivebox.js";

// What the Sea choice does, for its title.
const SEA_TITLE = "A course by the sea: the coast round its holes - a beach and low dunes, the sea out to the horizon - and the round's wind coming off the sea. Never in play: the water's edge is always well past where a ball can finish.";
// The course maker's Best holes (sim/coursesearch.mjs SEARCH_CHOICES).
const SEARCH_TITLE = "Every hole played in the head by the course's golfers, then other designs tried of the holes the review marks down - no better side to drive to, nothing round a par 3's green anyone finds - and the best course of them all kept. On every core the computer has to spare: about half a minute for 18 holes on Find the best.";
const SEA_GAP_TITLE = "How close the sea comes to the holes nearest it: behind a band of dunes, near the beach with low dunes between, or right on the shore - the beach running up to the edge of the long grass. Never in play: the water is always past where a ball can finish.";

const $ = (sel) => document.querySelector(sel);
// Opened in a window of its own from the controls window (separate
// screens: app.js), rather than in place of the sim. Its Play buttons then
// tell the sim (over the "a2-designer" channel) and close it.
const OWN_WINDOW = new URLSearchParams(location.search).get("window") === "1";
const toSim = typeof BroadcastChannel === "function" ? new BroadcastChannel("a2-designer") : null;
// Set once the page is leaving for the game (Play), so a request still in
// flight when it goes - the course list refreshing after a save - is let go
// quietly rather than reported as an error ("Failed to fetch").
let leaving = false;
// A hole asked for: just that hole, then back here (the owner: "make sure
// it just plays that hole and then goes back to the course designer").
function playInSim(id, hole = null) {
  leaving = true;
  if (OWN_WINDOW && toSim) {
    toSim.postMessage({ play: id, hole, only: !!hole });
    window.close();
    return;
  }
  location.href = `/?mode=course&course=${encodeURIComponent(id)}${hole ? `&hole=${hole}&only=1` : ""}`;
}
// A real course from the map, and its ground from LiDAR files, are the
// PC's (its server works them out): in the web version and the phone app -
// the designer in a page of its own, its courses kept on the device -
// they're left out, and said.
const MAP_COURSES = hasMapCourses();
if (!MAP_COURSES) {
  $("#map-course").remove();
  $("#back").textContent = "Back to the game";
}
// Your courses, on a narrow screen (a phone: the list is above what's
// being made): folded under its heading whenever a course or the new
// course's form is shown, so that's first - opened again with its heading.
// On a wide one it's always open in its side column.
const narrow = window.matchMedia("(max-width: 900px)");
const yourCourses = $("#your-courses");
const foldList = () => {
  yourCourses.open = !narrow.matches;
};
// (Its heading a stop for the Tab key only where it folds.)
const listHeading = yourCourses.querySelector("summary");
const headingStop = () => {
  listHeading.tabIndex = narrow.matches ? 0 : -1;
};
headingStop();
yourCourses.addEventListener("toggle", () => {
  if (!narrow.matches && !yourCourses.open) yourCourses.open = true;
});
narrow.addEventListener("change", () => {
  headingStop();
  if (!narrow.matches) yourCourses.open = true;
});
const main = $("#main");
let course = null; // the course being edited
let current = 0; // hole index in the editor
let dirty = false;
let groundShown = null; // the ground section being drawn

function setDirty(on) {
  dirty = on;
  $("#save-state").textContent = on ? "Unsaved changes" : course ? "Saved" : "";
}
// Unsaved changes hold the page (the Windows app asks then: electron/
// main.mjs) - not once leaving has been asked and agreed to.
window.addEventListener("beforeunload", (e) => {
  if (dirty && !leaving) e.preventDefault();
});
$("#back").addEventListener("click", async (e) => {
  e.preventDefault();
  if (dirty && !(await ask("Leave without saving this course?", { yes: "Leave without saving", no: "Stay", danger: true }))) return;
  leaving = true;
  // In a window of its own (separate screens): just close it - the sim
  // is still there in the game and controls windows.
  if (OWN_WINDOW) return window.close();
  location.href = $("#back").getAttribute("href");
});

// ---- Course list -------------------------------------------------------------

// Your courses, found by their name or what kind they are (coursefinder.js:
// the words box, the filters, the order) - many courses aren't a long list
// to scroll through. The one open is marked.
let courseList = [];
const finder = new CourseFinder($("#courses"), {
  list: () => courseList,
  current: () => course?.id ?? null,
  pick: (id) => {
    if (id !== course?.id) openCourse(id);
  },
  mark: "Open",
  placeholder: "Find a course...",
  fold: true,
});

async function loadList() {
  let list;
  try {
    const r = await fetch("/api/courses");
    // (Anything but the list - a page, an error - said as such, not as
    // what a page looks like read as a list.)
    if (!r.ok || !/json/i.test(r.headers.get("content-type") ?? "")) throw new Error(r.ok ? "the game's server didn't send them" : `the game's server said ${r.status}`);
    list = await r.json();
  } catch (err) {
    // The page going away cuts off a request, which isn't a problem; a
    // server that can't be reached is said in the list itself.
    if (leaving) return;
    $("#courses .cf-list").innerHTML = `<p class="muted cf-none">Couldn't load the courses: ${esc(err.message)}</p>`;
    return;
  }
  courseList = Array.isArray(list) ? list : [];
  finder.update();
}

// Unsaved changes, before something replaces them: true to carry on.
const discardChanges = async () => !dirty || (await ask("Discard the unsaved changes to this course?", { yes: "Discard them", no: "Keep them", danger: true }));

// (At hole `at`, 0 the first: back from playing one, its own.)
async function openCourse(id, at = 0) {
  if (!(await discardChanges())) return;
  course = keepRouting(await fetch(`/api/courses/${encodeURIComponent(id)}`).then((r) => r.json()));
  current = Math.min(Math.max(0, Math.floor(at) || 0), course.holes.length - 1);
  setDirty(false);
  showCourse();
  loadList();
}

// ---- New course: the course maker, or a scorecard ----------------------------

const EXAMPLE = `Paste a scorecard, one hole per line (hole, par, yards, stroke index):
1 4 385 7
2 4 410 3
3 3 165 15
...

or as rows:
Par   4 4 3 5 4 3 4 5 4
Yards 385 410 165 520 350 190 430 545 400`;

async function newCourse() {
  if (!(await discardChanges())) return;
  foldList();
  course = null;
  setDirty(false);
  loadList();
  // The course maker (sim/coursemaker.mjs): a quick start, then as much
  // customising as wanted - sections of holes in different styles, the
  // pars, the length and course-wide choices - which fill in the scorecard
  // below; that can still be changed by hand, or pasted.
  const maker = { holes: 18, preset: "parkland", ...presetChoices("parkland", 18), length: "normal", seed: newSeed() };
  const opt = (choices, value) => Object.entries(choices).map(([k, v]) => `<option value="${k}" ${k === value ? "selected" : ""}>${esc(typeof v === "string" ? v : v.name)}</option>`).join("");
  main.innerHTML = `
    <h2>New course</h2>
    <p class="muted">Pick a quick start and press <b>Make the course</b> - or customise it first: sections of holes in different styles, the pars, water, cart paths and more. Every hole can still be redesigned afterwards.</p>
    <div class="row"><label>Name <input id="name" value="My course" size="30"></label>
      <label>Holes <select id="count"><option>9</option><option selected>18</option></select></label>
      <label title="Made-up ground: rolling hills of the size picked, greens and tees kept playable. Every hole's ground can be changed afterwards with the Ground tool.">Ground <select id="hills">${HILLS.map((h) => `<option value="${h}" ${h === "rolling" ? "selected" : ""}>${HILL_NAMES[h]}</option>`).join("")}</select></label>
      <label title="${esc(SEA_TITLE)}">Sea <select id="sea">${SEA_CHOICES.map((k) => `<option value="${k}" ${k === "auto" ? "selected" : ""}>${esc(SEA_NAMES[k])}</option>`).join("")}</select></label>
      <label title="${esc(SEARCH_TITLE)}">Best holes <select id="search">${opt(SEARCH_CHOICES, "best")}</select></label></div>
    <h3>Quick start</h3>
    <div class="presets" id="presets">${Object.entries(PRESETS)
      .map(([id, p]) => `<button data-preset="${id}" class="preset" title="${esc(p.styles.map((st) => STYLES[st].blurb).join(" / "))}"><span class="swatches">${p.styles.map((st) => `<i style="background:${STYLES[st].colour}"></i>`).join("")}</span>${esc(p.name)}</button>`)
      .join("")}</div>
    <div class="strip" id="strip" title="Each hole's style"></div>
    <div class="row"><button id="generate" class="primary">Make the course</button> <span class="muted" id="totals"></span></div>
    <div class="row searching" id="searching" hidden><progress id="search-bar" max="1" value="0"></progress> <span id="search-msg"></span> <button id="search-stop" title="Keep the best course found so far">Stop - keep the best so far</button></div>
    <details class="maker" id="maker">
      <summary>Customise</summary>
      <h4>Styles by hole</h4>
      <div class="row" id="patterns">${Object.entries(PATTERNS).map(([k, v]) => `<button data-pattern="${k}">${esc(v)}</button>`).join("")}</div>
      <table class="sections"><tbody id="sections"></tbody></table>
      <div class="row"><button id="add-section">+ Add a section</button><span class="muted small">Each section runs from the hole after the last one's end.</span></div>
      <h4>The whole course</h4>
      <div class="maker-grid">
        <label>Pars <select id="pars">${opt(PARS, maker.pars)}</select></label>
        <label>Hole lengths <select id="length">${opt(LENGTHS, maker.length)}</select></label>
        ${Object.entries(DETAILS).map(([k, d]) => `<label>${esc(d.label)} <select data-detail="${k}">${opt(d.choices, maker.details[k])}</select></label>`).join("")}
        <label class="check" title="Cart paths from the end of each hole's path to the start of the next's, where that's worth it, as well as down the holes"><input type="checkbox" id="link-paths" checked> Paths between holes</label>
      </div>
      <div class="row"><button id="reroll" title="The same choices, different holes">Different holes, same choices</button></div>
      <h4>Scorecard <small class="muted">(filled in from the choices above; change any hole, or paste a scorecard)</small></h4>
      <div class="card-entry">
        <div>
          <table class="card"><thead><tr><th>Hole</th><th>Par</th><th>Yards</th><th>Stroke index</th><th>Style</th></tr></thead>
          <tbody id="card-rows"></tbody></table>
        </div>
        <div>
          <h3>Or paste a scorecard</h3>
          <textarea id="paste" placeholder="${esc(EXAMPLE)}"></textarea>
          <div class="row"><button id="read">Fill in from pasted text</button><span id="paste-msg"></span></div>
        </div>
      </div>
    </details>`;
  const totals = () => {
    const card = readCard();
    $("#totals").textContent = `${card.length} holes - par ${card.reduce((a, h) => a + h.par, 0)}, ${card.reduce((a, h) => a + h.yards, 0)} yards`;
  };
  // The scorecard, the strip and the sections from the choices.
  const fill = () => {
    maker.siTyped = false;
    maker.sections = cleanSections(maker.sections, maker.holes);
    const card = makeCard({ ...maker, holes: maker.holes });
    $("#card-rows").innerHTML = card
      .map(
        (h, i) => `<tr data-options='${esc(JSON.stringify(h.options))}'><td>${i + 1}</td>
        <td><select data-f="par">${[3, 4, 5].map((p) => `<option ${p === h.par ? "selected" : ""}>${p}</option>`).join("")}</select></td>
        <td><input data-f="yards" type="number" min="${MIN_YARDS}" max="${MAX_YARDS}" value="${h.yards}"></td>
        <td><input data-f="si" type="number" min="1" max="18" value="${h.si}"></td>
        <td><span class="dot" style="background:${STYLES[h.style].colour}"></span>${esc(STYLES[h.style].name)}</td></tr>`,
      )
      .join("");
    $("#strip").innerHTML = card.map((h, i) => `<span style="background:${STYLES[h.style].colour}" title="Hole ${i + 1}: ${esc(STYLES[h.style].name)}">${i + 1}</span>`).join("");
    $("#sections").innerHTML = maker.sections
      .map(
        (sec, k) => `<tr><td>Holes ${sec.from} to <input type="number" data-sec-to="${k}" min="${sec.from}" max="${maker.holes}" value="${sec.to}"></td>
        <td><select data-sec-style="${k}">${opt(STYLES, sec.style)}</select></td>
        <td class="muted small">${esc(STYLES[sec.style].blurb)}</td>
        <td>${maker.sections.length > 1 ? `<button data-sec-remove="${k}" title="Remove this section">×</button>` : ""}</td></tr>`,
      )
      .join("");
    for (const b of document.querySelectorAll("[data-preset]")) b.classList.toggle("on", b.dataset.preset === maker.preset);
    totals();
  };
  const changed = () => {
    maker.preset = null;
    fill();
  };
  $("#presets").addEventListener("click", (e) => {
    const b = e.target.closest("[data-preset]");
    if (!b) return;
    Object.assign(maker, { preset: b.dataset.preset, ...presetChoices(b.dataset.preset, maker.holes) });
    $("#pars").value = maker.pars;
    for (const sel of document.querySelectorAll("[data-detail]")) sel.value = maker.details[sel.dataset.detail];
    // A name to match, while it's still one of these.
    const nameOf = (id) => (id === "parkland" ? "My course" : PRESETS[id].name);
    if (Object.keys(PRESETS).map(nameOf).includes($("#name").value)) $("#name").value = nameOf(b.dataset.preset);
    fill();
  });
  $("#patterns").addEventListener("click", (e) => {
    const b = e.target.closest("[data-pattern]");
    if (!b) return;
    // The styles in use, in turn.
    const styles = [...new Set(maker.sections.map((sec) => sec.style))];
    if (styles.length < 2 && b.dataset.pattern !== "one") styles.push(styles[0] === "links" ? "parkland" : "links");
    maker.sections = sectionsFor(b.dataset.pattern, maker.holes, styles);
    changed();
  });
  $("#sections").addEventListener("change", (e) => {
    const t = e.target;
    if (t.dataset.secTo != null) maker.sections[Number(t.dataset.secTo)].to = Number(t.value);
    if (t.dataset.secStyle != null) maker.sections[Number(t.dataset.secStyle)].style = t.value;
    changed();
  });
  $("#sections").addEventListener("click", (e) => {
    const b = e.target.closest("[data-sec-remove]");
    if (!b) return;
    maker.sections.splice(Number(b.dataset.secRemove), 1);
    changed();
  });
  $("#add-section").addEventListener("click", () => {
    const last = maker.sections[maker.sections.length - 1];
    if (last.to - last.from < 1) return;
    const mid = Math.floor((last.from + last.to) / 2);
    maker.sections.push({ from: mid + 1, to: last.to, style: last.style === "links" ? "parkland" : "links" });
    last.to = mid;
    changed();
  });
  $("#count").addEventListener("change", () => {
    maker.holes = Number($("#count").value);
    // The same layout of styles, for the new number of holes.
    if (maker.preset) Object.assign(maker, presetChoices(maker.preset, maker.holes));
    else maker.sections = maker.sections.map((sec) => ({ ...sec, to: Math.min(maker.holes, Math.round((sec.to * maker.holes) / (maker.holes === 9 ? 18 : 9))) }));
    fill();
  });
  $("#pars").addEventListener("change", () => ((maker.pars = $("#pars").value), changed()));
  $("#length").addEventListener("change", () => ((maker.length = $("#length").value), changed()));
  for (const sel of document.querySelectorAll("[data-detail]")) sel.addEventListener("change", () => ((maker.details[sel.dataset.detail] = sel.value), changed()));
  $("#reroll").addEventListener("click", () => {
    maker.seed = newSeed();
    fill();
  });
  $("#card-rows").addEventListener("input", (e) => {
    if (e.target.dataset?.f === "si") maker.siTyped = true;
    totals();
  });
  $("#read").addEventListener("click", () => {
    try {
      const card = parseScorecard($("#paste").value);
      maker.holes = card.length > 9 ? 18 : 9;
      $("#count").value = String(maker.holes);
      fill();
      document.querySelectorAll("#card-rows tr").forEach((tr, i) => {
        if (!card[i]) return tr.remove();
        tr.querySelector('[data-f="par"]').value = card[i].par;
        tr.querySelector('[data-f="yards"]').value = card[i].yards;
        tr.querySelector('[data-f="si"]').value = card[i].si ?? "";
      });
      maker.siTyped = card.some((h) => Number.isFinite(h.si));
      $("#paste-msg").textContent = `Read ${card.length} holes`;
      $("#paste-msg").className = "muted";
      totals();
    } catch (err) {
      $("#paste-msg").textContent = err.message;
      $("#paste-msg").className = "error";
    }
  });
  $("#generate").addEventListener("click", async () => {
    const name = $("#name").value.trim() || "My course";
    const list = await fetch("/api/courses").then((r) => r.json());
    let id = slugify(name);
    if (list.some((c) => c.id === id) && !(await ask(`There's already a course called "${name}". Replace it?`, { yes: "Replace it", danger: true }))) return;
    let made = buildCourse(name, readCard(), newSeed());
    made.id = id;
    // By the sea (sim/coast.mjs): as asked - a links course, as it comes,
    // kept so even on hills (whose holes don't keep their links look).
    const sea = $("#sea").value;
    if (sea !== "auto") made.sea = sea;
    else if (seaShape(made)) made.sea = "coast";
    // The best of many (sim/coursesearch.mjs, searchrunner.js): every hole
    // played in the head, other designs of the ones the review marks down
    // tried, the best course kept - on flat ground, before any hills.
    const how = SEARCH_CHOICES[$("#search").value] ?? SEARCH_CHOICES.best;
    const hills = $("#hills").value;
    const found = how.tries ? await searchBest(keepRouting(made), how.tries, !maker.siTyped) : null;
    if (found) made = found.course;
    // On hills: the course laid out as a whole on made-up ground
    // (sim/imaginary.mjs), its holes then with real ground of their own -
    // routed over the hills as they are, not where the search kept them on
    // the flat (sim/searchkept.mjs forHills).
    if (hills !== "flat") made = withHills(forHills(made), { hills, seed: newSeed() }).course;
    // (What the search did kept with it, hills or not.)
    if (found) made = { ...made, search: found.record };
    // Cart paths from each green to the next tee (sim/linkpaths.mjs), as a
    // new course has them down each hole - unless they're not wanted.
    course = { ...keepRouting(made), linkPaths: $("#link-paths").checked && maker.details.paths !== "none" };
    // (Its holes' plays the review's at once, where they're the holes as
    // they are.)
    if (found && hills === "flat") rememberPlays(course, found.plays);
    current = 0;
    setDirty(true);
    showCourse();
    if (found) tell(searchSaid(found.record, { hills: hills !== "flat" }));
  });
  // The search, with its progress under Make the course and a Stop.
  let searching = false;
  const searchBest = async (c, tries, siFromPlay) => {
    if (searching || !canSearch(c)) return null;
    searching = true;
    let stop = false;
    const box = $("#searching");
    const bar = $("#search-bar");
    const msg = $("#search-msg");
    const button = $("#generate");
    box.hidden = false;
    button.disabled = true;
    $("#search-stop").onclick = () => {
      stop = true;
      msg.textContent = "Stopping - keeping the best so far";
    };
    try {
      return await findBest(c, {
        seed: newSeed(),
        tries,
        siFromPlay,
        stopped: () => stop,
        onProgress: (p) => {
          if (stop) return;
          bar.value = p.of ? p.done / p.of : 0;
          msg.textContent = searchWords(p);
        },
      });
    } catch (err) {
      console.warn("The search for the best course failed; the course is as made:", err);
      return null;
    } finally {
      searching = false;
      box.hidden = true;
      button.disabled = false;
    }
  };
  fill();
}

function readCard() {
  // Each hole with the options the maker gave it (its style's, and the
  // course's choices).
  return [...document.querySelectorAll("#card-rows tr")].map((tr) => {
    let options = {};
    try {
      options = JSON.parse(tr.dataset.options || "{}");
    } catch {
      // As a plain hole.
    }
    return {
      par: Number(tr.querySelector('[data-f="par"]').value),
      yards: Math.max(MIN_YARDS, Math.min(MAX_YARDS, Number(tr.querySelector('[data-f="yards"]').value) || 0)),
      si: Number(tr.querySelector('[data-f="si"]').value) || null,
      options,
    };
  });
}

// ---- A course: all holes, and the hole editor ------------------------------------

// The course's page: its buttons, then one hole at a time - picked from the
// list, or flicked through with the arrows - with its map and choices. The
// whole course's layout is a screen of its own (Course layout), opened over
// this one and closed again (the owner: "if you want to do the course
// layout, you go to specific screens, you just do the course layout, then
// you can close that screen down, then you can just flick through the
// holes"). Nothing moves the page by itself.
function showCourse() {
  foldList();
  const t = courseTotals(course);
  main.innerHTML = `
    <div class="row"><h2 id="title">${esc(course.name)}</h2>
      <span class="muted" id="totals">${course.holes.length} holes - par ${t.par} - ${t.yards} yards</span></div>
    <div class="row">
      <button id="save" class="primary"${course.builtIn ? ` title="${esc(course.name)} comes with the game: changes to it are saved as a copy of your own"` : ""}>${course.builtIn ? "Save as a copy" : "Save course"}</button>
      <button id="play">Play this course</button>
      <button id="open-layout" title="The whole course on one map: where each hole is${canMoveHoles(course) ? ", moved and turned by hand" : ""}">Course layout</button>
      <button id="open-review" title="The course scored as the ranking panels score one - shot options, variety, pacing, challenge, routing, fairness - with notes on what to change">Course review</button>
      <button id="rename">Rename</button>
      ${course.builtIn ? `<span class="muted small">Comes with the game - always here, and updated with each version</span>` : `<button id="delete" class="danger">Delete</button>`}
      ${designedHoles().length ? `<button id="paths-all">${pathsEverywhere() ? "Take cart paths off every hole" : "Cart paths on every hole"}</button>` : ""}
    </div>
    ${course.holes.some((h) => h.layout.source === "map") && course.source?.kind !== "imaginary" ? `<section class="ground" id="ground"></section>` : ""}
    ${hillsRow()}
    ${seaRow()}
    ${slopesRow()}
    <div class="row hole-pick">
      <button id="prev" title="The hole before" aria-label="Previous hole">&#9664;</button>
      <label>Hole <select id="hole-pick"></select></label>
      <button id="next" title="The next hole" aria-label="Next hole">&#9654;</button>
      <span class="muted small">Other holes on the map are drawn in red: pick one to change it.</span>
    </div>
    <div class="editor" id="editor"></div>
    <section class="layout-screen" id="layout-screen" hidden>
      <div class="row layout-head">
        <h2>Course layout</h2>
        <span class="muted">${esc(course.name)}</span>
        <span class="gap"></span>
        <button id="layout-done" class="primary">Done</button>
      </div>
      <div class="row layout-tools" id="layout-tools"></div>
      <section class="course-map-sec" id="course-map"></section>
      <div class="row layout-picked" id="layout-picked"></div>
    </section>
    <section class="layout-screen review-screen" id="review-screen" hidden>
      <div class="row layout-head">
        <h2>Course review</h2>
        <span class="muted">${esc(course.name)}</span>
        <span class="gap"></span>
        <button id="review-done" class="primary">Done</button>
      </div>
      <div id="review"></div>
    </section>`;
  $("#save").addEventListener("click", save);
  $("#play").addEventListener("click", async () => {
    if (dirty && !(await save())) return;
    playInSim(course.id);
  });
  $("#rename").addEventListener("click", async () => {
    const name = await askText("Course name", course.name, { yes: "Rename" });
    if (!name?.trim()) return;
    course = { ...course, name: name.trim() };
    $("#title").textContent = course.name;
    setDirty(true);
  });
  $("#paths-all")?.addEventListener("click", () => setPathsEverywhere(!pathsEverywhere()));
  $("#slopes-go")?.addEventListener("click", async () => {
    const level = $("#slopes-now").value;
    if (!(await ask(`New ${OPTIONS.contours[level].toLowerCase()} slopes on every green? Each green keeps its shape and pin, and anything shaped by hand stays on top.`, { yes: "New slopes" }))) return;
    // (A pin moved by hand is kept off the tiers too.)
    course = reslopeGreens(course, level, (h) => [h.layout.pin, withEdits(h.layout).pin]);
    setDirty(true);
    showEditor();
  });
  $("#sea-gap")?.addEventListener("change", () => {
    const v = $("#sea-gap").value;
    course = { ...course, seaGap: v };
    if (v === "dunes") delete course.seaGap;
    setDirty(true);
    $("#sea-shape").textContent = seaWords();
    courseMap?.draw();
  });
  $("#sea-now")?.addEventListener("change", () => {
    const v = $("#sea-now").value;
    course = { ...course, sea: v };
    if (v === "auto") delete course.sea;
    setDirty(true);
    $("#sea-shape").textContent = seaWords();
    courseMap?.draw();
  });
  $("#hills-go")?.addEventListener("click", async () => {
    const hills = $("#hills-now").value;
    if (hills === "flat") return;
    if (!(await ask("Lay the course out on hills? Each hole keeps its shape, but changes made to holes by hand start again, and the holes' own designs (Redesign) give way to the Ground tool.", { yes: "Put it on hills" }))) return;
    course = withHills(course, { hills, seed: newSeed() }).course;
    setDirty(true);
    showCourse();
  });
  $("#delete")?.addEventListener("click", async () => {
    if (!(await ask(`Delete ${course.name} and its scores?`, { yes: "Delete", danger: true }))) return;
    await fetch(`/api/courses/${encodeURIComponent(course.id)}`, { method: "DELETE" });
    inDriveToo();
    course = null;
    setDirty(false);
    main.innerHTML = "";
    loadList();
  });
  $("#hole-pick").addEventListener("change", () => openHole(Number($("#hole-pick").value)));
  $("#prev").addEventListener("click", () => select(current - 1));
  $("#next").addEventListener("click", () => select(current + 1));
  $("#open-layout").addEventListener("click", openLayout);
  $("#layout-done").addEventListener("click", closeLayout);
  $("#open-review").addEventListener("click", openReview);
  $("#review-done").addEventListener("click", () => closeReview());
  courseMap = null;
  drawPicker();
  showEditor();
  if ($("#ground")) groundShown = showGround();
}

// A hole picked (the list, the arrows, the course layout, or another hole
// tapped on the hole's map): its editor, where the page already is.
let courseMap = null;
function openHole(i) {
  current = (i + course.holes.length) % course.holes.length;
  drawPicker();
  showEditor();
}
const select = openHole;

// The list of holes, the one being changed picked.
function drawPicker() {
  const pick = $("#hole-pick");
  if (!pick) return;
  pick.innerHTML = course.holes
    .map((h, i) => `<option value="${i}" ${i === current ? "selected" : ""}>${esc(h.spec.number)} - par ${esc(h.spec.par)} - ${esc(h.spec.yards)} yds</option>`)
    .join("");
  const t = courseTotals(course);
  $("#totals").textContent = `${course.holes.length} holes - par ${t.par} - ${t.yards} yards`;
}

// ---- The course layout: a screen of its own ------------------------------------------

// A designed course's holes where its routing put them, kept on it: so a
// hole made longer later grows where it is, rather than every hole moving
// (sim/routing.mjs works the routing out once). Kept with the course when
// it's next saved; nothing else changes.
const designedFlat = (c) => canMoveHoles(c) && !isHills(c);
function keepRouting(c) {
  if (!c?.holes?.length || !designedFlat(c)) return c;
  const have = c.routing ?? [];
  if (c.holes.every((h, i) => [have[i]?.x, have[i]?.z, have[i]?.heading].every(Number.isFinite))) return c;
  return { ...c, routing: coursePlaces(c) };
}

// The whole course on one map (coursewide.js), over the page: a tap picks a
// hole (it's the one shown when the screen's closed); a designed course's
// holes are moved and turned on it.
function openLayout() {
  const screen = $("#layout-screen");
  screen.hidden = false;
  document.body.classList.add("layout-open");
  layoutTools();
  courseMap = mountCourseMap($("#course-map"), {
    size: [1600, 900],
    course: () => course,
    selected: () => current,
    pick: (i) => {
      current = i;
      courseMap?.draw();
      layoutPicked();
    },
    moved: (c) => {
      course = c;
      setDirty(true);
      courseMap?.draw();
      layoutTools();
    },
  });
  layoutPicked();
  $("#layout-done").focus();
}

function closeLayout() {
  const screen = $("#layout-screen");
  if (!screen || screen.hidden) return;
  screen.hidden = true;
  document.body.classList.remove("layout-open");
  $("#course-map").innerHTML = "";
  courseMap = null;
  openHole(current);
}
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape" || document.querySelector("dialog[open]")) return;
  if ($("#layout-screen") && !$("#layout-screen").hidden) closeLayout();
  if ($("#review-screen") && !$("#review-screen").hidden) closeReview();
});

// ---- The course review: a screen of its own --------------------------------------------

// The course reviewed (reviewpanel.js, sim/coursereview.mjs) over the
// page: a note's hole button closes it on that hole.
let review = null;
function openReview() {
  const screen = $("#review-screen");
  screen.hidden = false;
  document.body.classList.add("layout-open");
  review = mountReview($("#review"), {
    course: () => course,
    openHole: (i) => closeReview(i),
    setStrokeIndexes: (si) => {
      course = { ...course, holes: course.holes.map((h, i) => ({ ...h, spec: { ...h.spec, si: si[i] }, layout: { ...h.layout, si: si[i] } })) };
      setDirty(true);
      drawPicker();
      review?.draw();
    },
  });
  $("#review-done").focus();
}
function closeReview(hole = null) {
  const screen = $("#review-screen");
  if (!screen || screen.hidden) return;
  screen.hidden = true;
  document.body.classList.remove("layout-open");
  review?.stop();
  review = null;
  $("#review").innerHTML = "";
  openHole(hole ?? current);
}

// Under the map: the hole picked, and a way to it.
function layoutPicked() {
  const h = course.holes[current];
  const el = $("#layout-picked");
  if (!el || !h) return;
  el.innerHTML = `<b>Hole ${esc(h.spec.number)}</b> <span class="muted">par ${esc(h.spec.par)} - ${esc(h.spec.yards)} yds</span>
    <button id="layout-edit">Change this hole</button>`;
  $("#layout-edit").addEventListener("click", closeLayout);
}

// Over the map: what can be done to the layout as a whole - a designed
// course laid out afresh, another arrangement each time.
function layoutTools() {
  const el = $("#layout-tools");
  if (!el) return;
  el.innerHTML = `${
    designedFlat(course)
      ? `<button id="relay" title="Each nine out from the clubhouse and back, the holes turning back alongside each other - another way of fitting them together each time">Lay the holes out again</button>`
      : ""
  }<button id="links" class="${course.linkPaths ? "on" : ""}" aria-pressed="${course.linkPaths ? "true" : "false"}" title="A cart path from the end of each hole's path to the start of the next's, where that's worth it, round greens, tees, sand, water and other holes' play - drag its dot on the map to bend it">${course.linkPaths ? "Cart paths between holes: on" : "Cart paths between holes: off"}</button>`;
  $("#links").addEventListener("click", () => {
    course = { ...course, linkPaths: !course.linkPaths };
    if (!course.linkPaths) delete course.linkPaths;
    setDirty(true);
    layoutTools();
    courseMap?.draw();
  });
  $("#relay")?.addEventListener("click", async () => {
    if (!(await ask("Lay the holes out again? Every hole moves to a new place, wherever you've put them by hand.", { yes: "Lay them out again" }))) return;
    // (A second or so of working it out: said first.)
    const b = $("#relay");
    b.disabled = true;
    b.textContent = "Laying the holes out...";
    await new Promise((r) => setTimeout(r, 30));
    const fresh = { ...course, routingSeed: newSeed() };
    delete fresh.routing;
    delete fresh.crossOk;
    course = keepRouting(fresh);
    setDirty(true);
    layoutTools();
    courseMap?.draw();
  });
}

// ---- Hills ---------------------------------------------------------------------------

// A flat designed course can be given hills (sim/imaginary.mjs); one on
// hills says how hilly, and how much its holes climb and fall.
function hillsRow() {
  if (course.source?.kind === "imaginary") {
    return `<p class="muted">Ground: <b>${esc(HILL_NAMES[course.source.hills] ?? "Hills")}</b> (made up). Change any hole's ground with its Ground tool - raise, lower, smooth, or tilt the whole hole.</p>`;
  }
  if (course.holes.some((h) => h.layout.source === "map")) return "";
  return `<div class="row"><label title="Lay the course out as a whole on made-up hills, greens and tees kept playable">Ground <select id="hills-now">${HILLS.map((h) => `<option value="${h}" ${h === "rolling" ? "selected" : ""}>${HILL_NAMES[h]}</option>`).join("")}</select></label><button id="hills-go">Put it on hills</button><span class="muted">Flat now. On hills, every hole gets a Ground tool too.</span></div>`;
}

// ---- The sea --------------------------------------------------------------------------

// A designed course (flat or on made-up hills) can be by the sea (sim/
// coast.mjs); a real course from the map has the coast it has.
function seaRow() {
  if (course.source?.kind === "osm" || (course.holes.some((h) => h.layout.source === "map") && course.source?.kind !== "imaginary")) return "";
  const v = SEA_CHOICES.includes(course.sea) ? course.sea : "auto";
  const gap = SEA_GAPS[course.seaGap] ? course.seaGap : "dunes";
  return `<div class="row"><label title="${esc(SEA_TITLE)}">Sea <select id="sea-now">${SEA_CHOICES.map((k) => `<option value="${k}" ${k === v ? "selected" : ""}>${esc(SEA_NAMES[k])}</option>`).join("")}</select></label>
    <label title="${esc(SEA_GAP_TITLE)}">How close <select id="sea-gap">${Object.keys(SEA_GAPS).map((k) => `<option value="${k}" ${k === gap ? "selected" : ""}>${esc(SEA_GAP_NAMES[k])}</option>`).join("")}</select></label><span class="muted" id="sea-shape">${esc(seaWords())}</span></div>`;
}

// Every green's slopes at once (sim/course.mjs reslopeGreens): a designed
// course's, or one on made-up hills - a real course's greens have their
// real ground. The level most of its greens have now, picked.
function slopesRow() {
  if (course.source?.kind === "osm" || (course.holes.some((h) => h.layout.source === "map") && course.source?.kind !== "imaginary")) return "";
  const counts = {};
  for (const h of course.holes) counts[h.spec?.options?.contours] = (counts[h.spec?.options?.contours] ?? 0) + 1;
  const now = Object.keys(OPTIONS.contours).sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0))[0];
  return `<div class="row"><label title="How sloping every green is, as real greens are: gentle - a tilt of about 1.5% and a swell or two; moderate - about 2%, a tier, humps and hollows; severe - nearly 3%, one or two tiers, a false front, more to read. Pins stay on fair spots.">Green slopes <select id="slopes-now">${Object.entries(OPTIONS.contours).map(([k, v]) => `<option value="${k}" ${k === now ? "selected" : ""}>${esc(v)}</option>`).join("")}</select></label><button id="slopes-go">New slopes on every green</button></div>`;
}

// What the course has now: "The sea round two sides (see Course layout)".
function seaWords() {
  const shape = seaShape(course);
  if (!shape) return "Inland.";
  const where = { side: "along one side", corner: "round two sides", headland: "round a headland" }[shape];
  return `The sea ${where} - see Course layout.`;
}

// ---- Cart paths on every hole --------------------------------------------------------

// The designed holes (a mapped hole has the paths its map has, and the
// Paths tool for more).
const designedHoles = () => course.holes.map((h, i) => i).filter((i) => course.holes[i].layout.source !== "map");
// Does every designed hole have its cart path switched on?
const pathsEverywhere = () => designedHoles().every((i) => (course.holes[i].spec.options?.paths ?? "none") !== "none");
// Switches the cart path on (Auto) or off for every designed hole: each is
// made again with its own layout, keeping its hand changes where they still
// fit - asking first if some wouldn't.
async function setPathsEverywhere(on) {
  let next = course;
  let lost = 0;
  for (const i of designedHoles()) {
    const was = (next.holes[i].spec.options?.paths ?? "none") !== "none";
    if (was === on) continue;
    const before = next.holes[i].layout;
    next = rebuildHole(next, i, { options: { paths: on ? "auto" : "none" } });
    const edits = next.holes[i].layout.edits;
    if (!edits?.length) continue;
    const had = withEdits(before).applied;
    const now = withEdits(next.holes[i].layout).applied;
    lost += edits.filter((e, k) => had[k] && !now[k]).length;
    const kept = edits.filter((e, k) => now[k]);
    const holes = next.holes.slice();
    const layout = { ...next.holes[i].layout };
    if (kept.length) layout.edits = kept;
    else delete layout.edits;
    holes[i] = { ...next.holes[i], layout };
    next = { ...next, holes };
  }
  if (next === course) return;
  if (lost && !(await ask(`That undoes ${lost === 1 ? "one of the changes" : `${lost} of the changes`} made to the holes by hand (they'd be in the way of a path). Carry on?`, { yes: "Carry on", danger: true }))) return;
  course = next;
  setDirty(true);
  showCourse();
}

// ---- LiDAR: the real ground at 1 m -------------------------------------------------

// Where the ground and trees of a mapped course came from, and adding LiDAR
// files to make them real. `note`: what the last change did, shown under it.
const KIND_NAMES = { dtm: "Ground (DTM)", dsm: "Surface with trees (DSM)" };
// How A-Squared Golf knows a file's kind (a name saying so needs no note).
const KIND_FROM = {
  content: `<span class="muted">(told by comparing with another file)</span>`,
  shape: `<span class="muted">(told by its shape: trees and roofs stand up in it)</span>`,
  owner: `<span class="muted">(set by you)</span>`,
  null: `<span class="warn">(a guess - nothing says which it is; check it)</span>`,
};
const OPTION_NAMES = { none: "None", light: "Light", normal: "Normal", heavy: "Heavy" };
async function showGround(note = "") {
  if (!MAP_COURSES) {
    $("#ground").innerHTML = `<h3>Ground and trees</h3><p class="muted small">This is a real course from the map. Its ground and trees from LiDAR files are changed in A² Golf on a PC.</p>`;
    return;
  }
  const mapped = course.holes.filter((h) => h.layout.source === "map");
  const lidarHoles = mapped.filter((h) => h.layout.geo?.ground === "lidar");
  const treeHoles = mapped.filter((h) => h.layout.lidarTrees);
  const realTrees = treeHoles.reduce((n, h) => n + h.layout.lidarTrees.length, 0);
  let files = [];
  try {
    files = await fetch("/api/lidar").then((r) => r.json());
  } catch {
    // Listed as none.
  }
  const surfaces = files.filter((f) => f.kind === "dsm").length;
  $("#ground").innerHTML = `
    <h3>Ground and trees</h3>
    <p>${
      lidarHoles.length
        ? `<b>LiDAR, 1 m</b> on ${lidarHoles.length} of ${mapped.length} holes${
            lidarHoles.some((h) => h.layout.geo.lidarCover < 0.95) ? " (some only partly covered)" : ""
          }.`
        : `From map tiles, a height every 3-5 m: the hills and slopes, not the detail.`
    } LiDAR files give a height every metre: bunkers dip, greens show their breaks.</p>
    <p>${
      treeHoles.length
        ? `<b>Real trees</b> from LiDAR on ${treeHoles.length} of ${mapped.length} holes: ${realTrees} found, each where it stands and as tall as it is.`
        : `Trees are filled into the mapped woods.`
    } Add the <b>surface model (DSM)</b> as well as the ground (DTM) and A² Golf finds the real trees in it - every one at its
      real spot and height, the ground under their crowns playing as trees. A file known to be a surface model is never used as the ground.</p>
    <div class="row">
      <button id="lidar-fetch" title="England (Environment Agency, 1 m) and the USA (USGS 3DEP): the files covering this course, downloaded and used by themselves">Fetch LiDAR automatically</button>
      <label class="button">Add LiDAR files... <input id="lidar-files" type="file" multiple accept=".zip,.tif,.tiff,.asc,.prj" hidden></label>
      ${files.length ? `<button id="lidar-apply">Use the LiDAR files on this course</button>` : ""}
      <details><summary>Where to get them</summary>
        <p class="small">Download both at <b>1 m</b> for the area round the course, then add the downloaded files here - zips are fine:
          the <b>DTM</b> (bare ground) for the ground, and the <b>DSM</b> (the surface, with the trees and buildings on it) for the trees.</p>
        <ul class="small">
          <li>England: <a href="https://environment.data.gov.uk/survey" target="_blank" rel="noopener">Defra Survey Data Download</a> -
            draw round the course, then <i>LIDAR Composite DTM</i> and <i>LIDAR Composite First Return DSM</i> (or the
            <i>National LIDAR Programme</i> DTM and DSM), 1 m</li>
          <li>Scotland: <a href="https://remotesensingdata.gov.scot" target="_blank" rel="noopener">Scottish Remote Sensing Portal</a> - LiDAR DTM and DSM</li>
          <li>Wales: <a href="https://datamap.gov.wales" target="_blank" rel="noopener">DataMapWales</a> - LiDAR DTM and DSM, 1 m</li>
          <li>USA: <a href="https://apps.nationalmap.gov/downloader/" target="_blank" rel="noopener">USGS National Map</a> - Elevation Products (3DEP), 1 meter DEM
            (the ground; there's no ready-made surface model)</li>
        </ul>
        <p class="small muted">GeoTIFF (.tif) and ASCII grid (.asc) files on the British, Irish or UTM grids, or in latitude and longitude.
          A² Golf tells a DSM from a DTM by its name, or by comparing it with a DTM of the same ground; if it gets one wrong, change it in the list of files.</p>
      </details>
    </div>
    <div id="lidar-status">${note}</div>
    ${
      files.length
        ? `<details class="small" ${files.length <= 8 ? "open" : ""}><summary>${files.length} LiDAR file${files.length > 1 ? "s" : ""} added${
            surfaces ? ` (${surfaces} surface model${surfaces > 1 ? "s" : ""})` : ""
          }</summary><ul class="lidar-files">${files
            .map(
              (f) => `<li>${esc(f.file)} <span class="muted">${f.cell} m, EPSG:${f.epsg}</span>
                <select data-kind="${esc(f.file)}" title="What the file holds">${Object.entries(KIND_NAMES)
                  .map(([k, label]) => `<option value="${k}" ${f.kind === k ? "selected" : ""}>${label}</option>`)
                  .join("")}</select> ${KIND_FROM[f.kindFrom] ?? ""}
                <button data-remove="${esc(f.file)}">Remove</button></li>`,
            )
            .join("")}</ul></details>`
        : ""
    }`;
  $("#lidar-files").addEventListener("change", (e) => addLidar([...e.target.files]));
  $("#lidar-apply")?.addEventListener("click", applyLidarToCourse);
  $("#lidar-fetch").addEventListener("click", fetchLidarForCourse);
  $("#ground").querySelectorAll("[data-remove]").forEach((b) =>
    b.addEventListener("click", async () => {
      await fetch(`/api/lidar/${encodeURIComponent(b.dataset.remove)}`, { method: "DELETE" });
      showGround();
    }),
  );
  $("#ground").querySelectorAll("[data-kind]").forEach((sel) =>
    sel.addEventListener("change", async () => {
      await fetch("/api/lidar/kind", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ file: sel.dataset.kind, kind: sel.value }) });
      showGround(`<p class="small">${esc(sel.dataset.kind)} is now used as the ${sel.value === "dsm" ? "surface, for trees" : "ground"}.
        Press <b>Use the LiDAR files on this course</b> to rebuild the course with it${
          sel.value === "dsm" ? " - wherever no ground model covers a hole now, it gets its ground from the map back" : ""
        }.</p>`);
    }),
  );
}

async function addLidar(list) {
  if (!list.length) return;
  if (dirty && !(await save())) return;
  const status = $("#lidar-status");
  const lines = [];
  const show = () => (status.innerHTML = lines.map((l) => `<div class="small">${l}</div>`).join(""));
  for (const file of list) {
    lines.push(`Adding ${esc(file.name)} (${(file.size / 1e6).toFixed(1)} MB)...`);
    show();
    try {
      const res = await fetch("/api/lidar/upload", { method: "POST", headers: { "X-Filename": encodeURIComponent(file.name) }, body: file });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error);
      lines[lines.length - 1] = `${esc(file.name)}: ${out.added.length ? `${out.added.length} elevation file${out.added.length > 1 ? "s" : ""} added` : "nothing added"}${out.skipped
        .map((s) => `<br><span class="warn">${esc(s.name)} skipped - ${esc(s.why)}</span>`)
        .join("")}`;
    } catch (err) {
      lines[lines.length - 1] = `<span class="warn">${esc(file.name)}: couldn't add it (${esc(err.message)})</span>`;
    }
    show();
  }
  await applyLidarToCourse();
}

// LiDAR found and downloaded by itself (server/lidarfetch.mjs) where
// there's an open 1 m source - England and the USA - then used as files
// added by hand are.
async function fetchLidarForCourse() {
  if (dirty && !(await save())) return;
  const status = $("#lidar-status");
  status.insertAdjacentHTML("beforeend", `<div class="small">Looking for LiDAR for this course and downloading it - this can take a minute or two...</div>`);
  try {
    const res = await fetch("/api/lidar/fetch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: course.id }) });
    const out = await res.json();
    if (!res.ok) throw new Error(out.error);
    status.insertAdjacentHTML("beforeend", `<div class="small">${esc(fetchedWords(out.fetched))}</div>`);
    if (out.fetched?.added?.length || out.fetched?.had) await applyLidarToCourse();
    else showGround();
  } catch (err) {
    status.insertAdjacentHTML("beforeend", `<div class="small warn">Couldn't fetch LiDAR: ${esc(err.message)}</div>`);
  }
}

// What fetching found, in words.
function fetchedWords(f) {
  if (!f) return "";
  if (f.why) return f.why;
  const parts = [];
  if (f.added?.length) parts.push(`${f.added.length} file${f.added.length === 1 ? "" : "s"} downloaded from ${f.source}`);
  if (f.had) parts.push(`${f.had} already here`);
  if (f.failed?.length) parts.push(`${f.failed.length} couldn't be had (${f.failed[0].why}) - the course may be outside what's been flown`);
  return parts.length ? `${parts.join("; ")}.` : `Nothing found from ${f.source}.`;
}

async function applyLidarToCourse() {
  if (dirty && !(await save())) return;
  const status = $("#lidar-status");
  status.insertAdjacentHTML("beforeend", `<div class="small">Rebuilding the ground and finding the trees from LiDAR...</div>`);
  try {
    const res = await fetch("/api/lidar/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: course.id }) });
    const out = await res.json();
    if (!res.ok) throw new Error(out.error);
    const covered = out.report.filter((r) => r.changed || r.cover > 0.02 || r.trees != null);
    const withTrees = out.report.some((r) => r.dsmCover != null || r.treesRemoved != null);
    const id = course.id;
    course = await fetch(`/api/courses/${encodeURIComponent(id)}`).then((r) => r.json());
    const pct = (r) =>
      r.cover > 0.02
        ? `${Math.round(r.cover * 100)}%`
        : r.groundRestored
          ? `none - <span class="muted">the map's ground back</span>`
          : `<span class="warn">none</span>`;
    const trees = (r) =>
      r.trees != null
        ? `${r.trees}${r.trees ? ` <span class="muted">(tallest ${Math.round(r.tallest)} m)</span>` : ""}${
            r.kept ? ` <span class="muted">- the hole keeps its Trees choice (${OPTION_NAMES[r.kept] ?? r.kept})</span>` : ""
          }${r.datumFrom === "low" ? ` <span class="warn">- lined up without fairways or greens to go by; check the heights</span>` : ""}`
        : r.treesRemoved != null
          ? `<span class="muted">none now - the ${r.treesRemoved} found before taken away</span>`
          : r.dsmCover != null
            ? `<span class="warn">DSM covers ${Math.round(r.dsmCover * 100)}%</span>`
            : "-";
    const note = covered.length
      ? `<table class="map-report small"><tr><th>Hole</th><th>Ground from LiDAR</th><th>Up/down</th>${withTrees ? "<th>Real trees found</th>" : ""}</tr>${out.report
          .map(
            (r) => `<tr><td>${r.number}</td><td>${pct(r)}</td><td>${r.rise != null ? `${r.rise >= 0 ? "+" : ""}${r.rise.toFixed(1)} m` : "-"}</td>${
              withTrees ? `<td>${trees(r)}</td>` : ""
            }</tr>`,
          )
          .join("")}</table>`
      : `<p class="warn small">None of the LiDAR files cover this course. Check they're for the right place.</p>`;
    showCourse();
    await groundShown;
    await showGround(note);
  } catch (err) {
    status.insertAdjacentHTML("beforeend", `<p class="warn small">Couldn't use them: ${esc(err.message)}</p>`);
  }
}

// A hole made before Design and Template were choices is classic, its own kind.
const OPTION_DEFAULTS = { design: "classic", template: "auto" };

// The hole's mowing (sim/mowing.mjs): Auto (the pattern picked for it,
// as before) or one chosen, for its fairway and its green. Kept on its
// layout as layout.mow; a hole saved before has none, so Auto. Changing it
// redraws nothing of the hole's shape.
const MOW_WORDS = { across: "Across", diagonal: "Diagonal", checked: "Checked", along: "Along the hole", straight: "Straight", crosshatch: "Crosshatch" };
function mowSelects(L) {
  const auto = mowingFor(mowSeed(L));
  const one = (which, names) =>
    `<label title="How the ${which} is mown: Auto keeps the pattern picked for this hole (${MOW_WORDS[auto[which].name].toLowerCase()}).">${which === "fairway" ? "Fairway mowing" : "Green mowing"} <select data-mow="${which}"><option value="auto">Auto (${MOW_WORDS[auto[which].name]})</option>${names
      .map((n) => `<option value="${n}" ${L.mow?.[which] === n ? "selected" : ""}>${MOW_WORDS[n]}</option>`)
      .join("")}</select></label>`;
  return one("fairway", FAIRWAY_MOWS) + one("green", GREEN_MOWS);
}
function wireMowing() {
  $("#editor").querySelectorAll("[data-mow]").forEach((el) =>
    el.addEventListener("change", () => {
      const h = course.holes[current];
      const mow = mowChoice({ ...(h.layout.mow ?? {}), [el.dataset.mow]: el.value });
      const layout = { ...h.layout };
      if (mow) layout.mow = mow;
      else delete layout.mow;
      const holes = course.holes.slice();
      holes[current] = { ...h, layout };
      course = { ...course, holes };
      setDirty(true);
    }),
  );
}

function showEditor() {
  const h = course.holes[current];
  if (h.layout.source === "map") return showMappedEditor();
  const s = h.spec;
  const optSelect = (key) =>
    `<label>${OPTION_LABELS[key] ?? key[0].toUpperCase() + key.slice(1)} <select data-opt="${key}">${Object.entries(OPTIONS[key])
      .map(([v, label]) => `<option value="${v}" ${(s.options[key] ?? OPTION_DEFAULTS[key] ?? "none") === v ? "selected" : ""}>${label}</option>`)
      .join("")}</select></label>`;
  $("#editor").innerHTML = `
    <div id="hand"></div>
    <div>
      <h3>Hole ${s.number}</h3>
      <label>Par <select data-spec="par">${[3, 4, 5].map((p) => `<option ${p === s.par ? "selected" : ""}>${p}</option>`).join("")}</select></label>
      <label>Yards <input data-spec="yards" type="number" min="${MIN_YARDS}" max="${MAX_YARDS}" value="${s.yards}"></label>
      <label>Stroke index <input data-spec="si" type="number" min="1" max="18" value="${esc(s.si ?? "")}"></label>
      ${optSelect("dogleg")}${optSelect("fairway")}${optSelect("bunkers")}${optSelect("water")}${optSelect("green")}${optSelect("contours")}${optSelect("trees")}${optSelect("paths")}${optSelect("design")}${optSelect("template")}
      ${mowSelects(h.layout)}
      ${holeStory(h.layout) ? `<p class="small">${esc(holeStory(h.layout))}</p>` : ""}
      <div class="row">
        <button id="relayout" class="primary">New layout</button>
      </div>
      <p class="muted small">New layout keeps the par, length and choices above and designs the hole again. Keep pressing it until you like what you see.
        Changes made on the map by hand stay through the choices above, wherever they still fit.</p>
    </div>`;
  handEditor(h);
  const change = async (changes) => {
    // A new layout is a different hole: hand changes don't carry over.
    if (changes.seed != null && course.holes[current].layout.edits?.length && !(await ask("A new layout loses the changes you've made to this hole by hand. Carry on?", { yes: "New layout", danger: true }))) return;
    const next = await keepHandChanges(course, rebuildHole(course, current, changes));
    if (!next) return showEditor();
    course = next;
    setDirty(true);
    drawPicker();
    showEditor();
  };
  // (A template asked for makes the hole strategic.)
  $("#editor").querySelectorAll("[data-opt]").forEach((el) =>
    el.addEventListener("change", () => change({ options: { [el.dataset.opt]: el.value, ...(el.dataset.opt === "template" && el.value !== "auto" ? { design: "strategic" } : {}) } })),
  );
  $("#editor").querySelectorAll("[data-spec]").forEach((el) =>
    el.addEventListener("change", () => {
      const v = Number(el.value);
      if (el.dataset.spec === "si") change({ si: v || null });
      else if (v) change({ [el.dataset.spec]: v });
    }),
  );
  $("#relayout").addEventListener("click", () => change({ seed: newSeed() }));
  wireMowing();
}

// A hole rebuilt from the map: its shapes and ground are real, so the
// choices are the ones that don't redraw it - par and index, trees, the
// pin, extra slopes on the green - or swapping it for a designed hole.
function showMappedEditor() {
  const h = course.holes[current];
  const s = h.spec;
  const L = h.layout;
  // The rise as the hole plays: with the Ground tool's changes and a moved
  // pin, as the Ground tool itself says it (holeeditor.js).
  const shown = withEdits(L);
  const rise = L.geo ? riseToGreen(shown.terrain, shown.pin) : 0;
  // Real trees are a choice only where a LiDAR surface model found them.
  const choose = (key, value) =>
    `<label>${key === "contours" ? "Green" : "Trees"} <select data-map="${key}">${Object.entries(MAPPED_OPTIONS[key])
      .filter(([v]) => v !== "lidar" || L.lidarTrees)
      .map(([v, label]) => `<option value="${v}" ${value === v ? "selected" : ""}>${label}</option>`)
      .join("")}</select></label>`;
  const missing = [];
  if (!L.fairways?.length && s.par > 3) missing.push("no fairway");
  if (L.outlined?.length) missing.push(`no ${L.outlined.join(" or ")} - outlined along the hole's line instead`);
  if (!L.bunkers.length) missing.push("no bunkers");
  // A hole of an imaginary course on hills (sim/imaginary.mjs) is built
  // the same way, on made-up ground: nothing of it is from a map.
  const imaginary = course.source?.kind === "imaginary";
  if (imaginary) missing.length = 0;
  $("#editor").innerHTML = `
    <div id="hand"></div>
    <div>
      <h3>Hole ${esc(s.number)} <small class="muted">${imaginary ? "on made-up hills" : "from the map"}</small></h3>
      <p class="muted small">${esc(s.yards)} yds, tee to green${imaginary ? "" : " along the mapped line"}${
        L.geo ? ` - the green is ${Math.abs(rise).toFixed(0)} m ${rise >= 0 ? "above" : "below"} the tee` : ""
      }.${missing.length ? ` The map has ${missing.join(" and ")} for this hole.` : ""}${holeStory(L) ? ` ${esc(holeStory(L))}` : ""}${
        L.lidarTrees ? ` LiDAR found ${L.lidarTrees.length} real trees on it.` : ""
      }</p>
      <label>Par <select data-spec="par">${[3, 4, 5].map((p) => `<option ${p === s.par ? "selected" : ""}>${p}</option>`).join("")}</select></label>
      <label>Stroke index <input data-spec="si" type="number" min="1" max="18" value="${esc(s.si ?? "")}"></label>
      ${choose("trees", s.options?.trees ?? "normal")}
      ${choose("contours", s.options?.contours ?? "none")}
      ${mowSelects(L)}
      <div class="row">
        <button id="move-pin">Move the pin</button>
      </div>
      <div class="row"><button id="designed" class="danger">Replace with a designed hole</button></div>
      ${
        imaginary
          ? `<p class="muted small">Its ground is made up - the Ground tool raises, lowers, smooths or tilts it. <i>Replace with a designed hole</i> swaps this hole for one designed from its par and length, on flat ground.</p>`
          : `<p class="muted small">Greens, tees, fairways, bunkers and water are as mapped in OpenStreetMap. If something's
        missing or wrong there, it can be fixed at <a href="https://www.openstreetmap.org" target="_blank" rel="noopener">openstreetmap.org</a>
        (it helps everyone who uses the map) and the course imported again. <i>Replace with a designed hole</i> swaps this hole
        for one designed from its par and length, on flat ground.</p>
      <p class="muted small">Map data © OpenStreetMap contributors (ODbL). Terrain: AWS Terrain Tiles (Mapzen/Tilezen, from national elevation data).</p>`
      }
    </div>`;
  handEditor(h);
  const change = async (changes) => {
    const next = await keepHandChanges(course, reworkMappedHole(course, current, { seed: newSeed(), ...changes }));
    if (!next) return showEditor();
    course = next;
    setDirty(true);
    drawPicker();
    showEditor();
  };
  $("#editor").querySelectorAll("[data-map]").forEach((el) => el.addEventListener("change", () => change({ [el.dataset.map]: el.value })));
  wireMowing();
  $("#editor").querySelectorAll("[data-spec]").forEach((el) =>
    el.addEventListener("change", () => {
      const v = Number(el.value);
      if (el.dataset.spec === "si") change({ si: v || null });
      else if (v) change({ par: v });
    }),
  );
  $("#move-pin").addEventListener("click", () => {
    // A pin placed by hand would stay put: this moves it somewhere new.
    const now = course.holes[current];
    if (now.layout.edits?.some((e) => e.k === "pin")) {
      const holes = course.holes.slice();
      const edits = now.layout.edits.filter((e) => e.k !== "pin");
      holes[current] = { ...now, layout: { ...now.layout, edits } };
      course = { ...course, holes };
    }
    change({ pin: "move" });
  });
  $("#designed").addEventListener("click", async () => {
    if (!(await ask(`Replace hole ${s.number} with a designed hole (par ${s.par}, ${s.yards} yds, flat ground)?${course.holes[current].layout.edits?.length ? " The changes made to it by hand go too." : ""}`, { yes: "Replace it", danger: true }))) return;
    // Where the map had it, kept for the course map and the holes round it.
    const was = coursePlaces(course)[current];
    const holes = course.holes.slice();
    holes[current] = { spec: { number: s.number, par: s.par, yards: s.yards, si: s.si ?? null, seed: newSeed(), options: { paths: "auto" } }, layout: null };
    course = rebuildHole({ ...course, holes }, current, {});
    if (was) {
      const routing = (course.routing ?? []).slice();
      routing[current] = was;
      course = { ...course, routing };
    }
    setDirty(true);
    drawPicker();
    showEditor();
  });
}

// A change of par, length or options keeps the hole's hand changes where
// they still fit (trees moved by hand can't follow trees grown afresh, say).
// If some no longer would, it asks first, and drops those. Null if not.
async function keepHandChanges(before, after) {
  const edits = after.holes[current].layout?.edits;
  if (!edits?.length) return after;
  const was = withEdits(before.holes[current].layout).applied;
  const now = withEdits(after.holes[current].layout).applied;
  const lost = edits.filter((e, i) => was[i] && !now[i]).length;
  if (lost && !(await ask(`That undoes ${lost === 1 ? "one of the changes" : `${lost} of the changes`} you made to this hole by hand (they don't fit the hole as it will be). Carry on?`, { yes: "Carry on", danger: true }))) return null;
  const kept = edits.filter((e, i) => now[i]);
  const holes = after.holes.slice();
  const layout = { ...after.holes[current].layout };
  if (kept.length) layout.edits = kept;
  else delete layout.edits;
  holes[current] = { ...after.holes[current], layout };
  return { ...after, holes };
}

// What of other holes is on hole `index`'s map, in its own frame, for the
// hand editor to draw red and leave alone: a designed course's neighbours
// where its layout puts them (sim/neighbours.mjs); on a hole from the map,
// the other holes' greens, tees, fairways, sand and water in its box
// (sim/owners.mjs). And every other hole's line, to say which is nearest.
function othersOf(c, index) {
  const L = c.holes[index]?.layout;
  const out = { shapes: [], lines: [], trees: [] };
  const places = coursePlaces(c);
  if (!L || !places?.[index]) return out;
  const me = holeFrame([places[index].x, places[index].z], places[index].heading);
  c.holes.forEach((h, j) => {
    if (j === index || !places[j] || !h.layout?.path?.length) return;
    out.lines.push({ index: j, number: h.spec?.number ?? j + 1, line: h.layout.path.map((p) => me.toHole(toCourse(places[j], p))) });
  });
  if (L.source === "map") {
    const owners = shapeOwners(c, index, { places });
    for (const list of OWNED) {
      (L[list] ?? []).forEach((s, k) => {
        const j = owners[list][k];
        const poly = list === "bunkers" || list === "water" ? s?.poly : s;
        if (j === index || !poly || poly.length < 3) return;
        out.shapes.push({ list, k, index: j, number: j >= 0 ? (c.holes[j].spec?.number ?? j + 1) : null, poly });
      });
    }
  } else {
    for (const n of courseNeighbours(c, index, { woods: false })) {
      for (const list of OWNED) for (const poly of n[list] ?? []) out.shapes.push({ list, index: n.index, number: n.number, poly });
      // Its trees: shown here, locked - each is changed only from its own
      // hole (sim/treeclear.mjs).
      for (const t of n.trees ?? []) out.trees.push({ list: "trees", index: n.index, number: n.number, at: [t[0], t[1]], size: t[2] ?? 1 });
      // Its placed decor (sim/decor.mjs), locked the same way.
      for (const d of n.decor ?? []) out.trees.push({ list: "decor", index: n.index, number: n.number, at: [d[0], d[1]], size: 0.6 });
    }
  }
  return out;
}

// The map of the hole being edited, with the tools for changing it by hand.
// Each change is kept on the hole straight away and marks the course
// unsaved; Save course keeps it, like any other change.
function handEditor(h) {
  const index = current;
  // Worked out again only when the course changes.
  let othersFor = null;
  let othersKept = null;
  let linksFor = null;
  let linksKept = null;
  mountHandEditor($("#hand"), {
    key: `${course.id}#${index}`,
    // The hole as designed, so undo kept for a course replaced under the
    // same name, or for the hole's old layout, isn't offered on this one.
    // A mapped hole's features come from the map, whatever its seed.
    base: `${course.created ?? ""}|${h.spec?.source === "map" ? "map" : (h.spec?.seed ?? "")}`,
    number: h.spec.number,
    // Its trees grow in stands of its kinds (sim/treepalette.mjs: the
    // tree key).
    stands: standsFor(course, index),
    // Its signature tree, if it has one (sim/treeclear.mjs holeSignature),
    // as the course is now.
    signature: () => holeSignature(course, index),
    layout: () => course.holes[index].layout,
    save: (layout) => {
      const holes = course.holes.slice();
      holes[index] = { ...course.holes[index], layout };
      course = { ...course, holes };
      setDirty(true);
    },
    play: async () => {
      if (dirty && !(await save())) return;
      playInSim(course.id, index + 1);
    },
    others: () => {
      if (othersFor !== course) {
        othersFor = course;
        othersKept = othersOf(course, index);
      }
      return othersKept;
    },
    pick: (i) => openHole(i),
    // The paths between holes to and from this one (sim/linkpaths.mjs), to
    // change here - on either hole (the owner: "Links can be adjusted on
    // either hole in design"): its frame's line, [] for none, or null to
    // have it worked out again. False where a path can't go there.
    links: () => {
      if (linksFor !== course) {
        linksFor = course;
        linksKept = holeLinks(course, index);
      }
      return linksKept;
    },
    drawLink: (number, line) => {
      const place = coursePlaces(course)[index];
      const frame = holeFrame([place.x, place.z], place.heading);
      const out = drawLink(course, number, line?.length ? line.map((q) => frame.toLocal(q)) : line);
      if (out.refused) return false;
      course = out;
      setDirty(true);
      return true;
    },
    // The owner's word on whose a shape is (sim/owners.mjs).
    own: (list, k, number) => {
      const holes = course.holes.slice();
      holes[index] = { ...course.holes[index], layout: sayOwner(course.holes[index].layout, list, k, number) };
      course = { ...course, holes };
      setDirty(true);
    },
  });
}

// ---- A real course from the map ---------------------------------------------------

async function mapCourse() {
  if (!(await discardChanges())) return;
  course = null;
  setDirty(false);
  main.innerHTML = `
    <h2>A real course from the map</h2>
    <p class="muted">A² Golf rebuilds the course from <b>OpenStreetMap</b> - where volunteers have mapped the holes,
      greens, tees, fairways, bunkers and water - and lays it on the real lie of the land from open elevation data.
      You can then tidy each hole up. Needs the internet for the import; after that it plays offline.</p>
    <div class="row">
      <input id="map-q" type="search" placeholder="Course name, and town if it helps" size="40" autofocus>
      <button id="map-search" class="primary">Search</button>
    </div>
    <label>Trees in mapped woods <select id="map-trees">${Object.entries(MAPPED_OPTIONS.trees)
      .filter(([v]) => v !== "none" && v !== "lidar")
      .map(([v, l]) => `<option value="${v}" ${v === "normal" ? "selected" : ""}>${l}</option>`)
      .join("")}</select></label>
    <div id="map-results"></div>
    <p class="muted small">Not every course is mapped in enough detail. If yours isn't, it can be added at
      <a href="https://www.openstreetmap.org" target="_blank" rel="noopener">openstreetmap.org</a> (trace the holes, greens and
      bunkers over the aerial photos), or designed here from its scorecard instead.</p>
    <p class="muted small">Map data © OpenStreetMap contributors (ODbL). Terrain: AWS Terrain Tiles.</p>`;
  const results = $("#map-results");
  const search = async () => {
    const q = $("#map-q").value.trim();
    if (!q) return;
    results.innerHTML = `<p class="muted">Searching...</p>`;
    try {
      const res = await fetch(`/api/map/search?q=${encodeURIComponent(q)}`);
      const list = await res.json();
      if (!res.ok) throw new Error(list.error);
      results.innerHTML = list.length
        ? `<ul class="map-results">${list
            .map(
              (c, i) => `<li><b>${esc(c.name)}</b> <span class="muted">${esc(c.place)}</span>
                <button data-i="${i}">Import</button></li>`,
            )
            .join("")}</ul>`
        : `<p>No golf courses found for that. Try the club's full name, or add the town.</p>`;
      results.querySelectorAll("button[data-i]").forEach((b) => b.addEventListener("click", () => importCourse(list[Number(b.dataset.i)])));
    } catch (err) {
      results.innerHTML = `<p>Couldn't search: ${esc(err.message)}. Is the PC online?</p>`;
    }
  };
  $("#map-search").addEventListener("click", search);
  $("#map-q").addEventListener("keydown", (e) => e.key === "Enter" && search());

  const importCourse = async (c) => {
    results.innerHTML = `<p><b>Importing ${esc(c.name)}...</b> <span class="muted">Fetching the map and the ground under it -
      this can take a minute.</span></p>`;
    try {
      const res = await fetch("/api/map/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: c.type, id: c.id, name: c.name, trees: $("#map-trees").value }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error);
      await loadList();
      showImportReport(out);
    } catch (err) {
      results.innerHTML = `<p>Couldn't import it: ${esc(err.message)}</p>`;
    }
  };
}

// What the import found, hole by hole, so anything the map is missing is
// easy to spot before playing.
function showImportReport(out) {
  const warn = (ok, text) => (ok ? "" : `<span class="warn">${text}</span>`);
  $("#map-results").innerHTML = `
    <h3>${esc(out.name)}: ${out.holes} holes imported</h3>
    ${out.skipped?.length ? `<p class="muted">Left out: ${out.skipped.length} more holes mapped in the same grounds (a second course?).</p>` : ""}
    ${out.terrain && out.terrain.found < out.terrain.tiles ? `<p class="warn">Some ground heights were missing; those parts are flat.</p>` : ""}
    ${out.terrain?.fetched ? `<p class="small">LiDAR: ${esc(fetchedWords(out.terrain.fetched))}${out.terrain.lidar ? ` Used on ${out.terrain.lidar} holes.` : ""}</p>` : ""}
    <table class="map-report"><tr><th>Hole</th><th>Par</th><th>Yds</th><th>Up/down</th><th>Fairway</th><th>Bunkers</th><th>Water</th><th>Trees</th><th>Cart paths</th><th></th></tr>
    ${out.report
      .map(
        (h) => `<tr><td>${h.number}</td><td>${h.par}</td><td>${h.yards}</td><td>${h.rise >= 0 ? "+" : ""}${h.rise.toFixed(0)} m</td>
          <td>${h.fairways || "-"}</td><td>${h.bunkers || "-"}</td><td>${h.water || "-"}${h.walls ? ` <span class="muted">(${h.walls} with a wall)</span>` : ""}</td><td>${h.trees}${h.realTrees != null ? ` <span class="muted">(${h.realTrees} real, from LiDAR)</span>` : ""}</td>
          <td>${h.paths || "-"}</td><td>${warn(h.green, "no green mapped - a round one was made")}</td></tr>`,
      )
      .join("")}</table>
    ${out.report.some((h) => h.others) ? `<p class="muted small">Where holes run close, a hole's ground takes in its neighbours' greens, fairways and sand too: each is counted with its own hole above, and drawn red when you change a hole beside it.</p>` : ""}
    <div class="row"><button id="open-imported" class="primary">Check and tidy the holes</button></div>`;
  $("#open-imported").addEventListener("click", () => openCourse(out.id));
}

async function save() {
  // A course that comes with the game (Nine Oaks: sim/shown.mjs BUILT_IN) is
  // never saved over: the changes go into a copy of the player's own, laid
  // out and dressed as it was (seedAs), which is the one open from then on.
  if (course.builtIn) {
    const { builtIn, ...rest } = course;
    const base = slugify(`${course.name} copy`) || "course-copy";
    let id = base;
    for (let n = 2; (await fetch(`/api/courses/${encodeURIComponent(id)}`)).ok; n++) id = `${base}-${n}`;
    course = { ...rest, id, name: `${course.name} (copy)`, seedAs: course.seedAs ?? course.id };
  }
  const res = await fetch(`/api/courses/${encodeURIComponent(course.id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(course),
  });
  const body = await res.json();
  if (!res.ok) {
    await tell(`Couldn't save: ${body.error}`);
    return false;
  }
  setDirty(false);
  loadList();
  // (A copy just made: its own name and buttons now.)
  if (!$("#delete")) showCourse();
  inDriveToo();
  return true;
}

// The courses kept in the player's Google Drive, if that's turned on
// (coursedrivebox.js): the box, from Your courses; and in the web version a
// course just saved or deleted sent on while Google's permission is still
// in hand (the PC's server sends its own by itself).
const inDriveToo = () => driveQuietly().then((v) => v?.last && !v.last.error && loadList());
// (Not in the phone app yet: sim/webapp.mjs hasCourseDrive.)
if (hasCourseDrive()) $("#drive-courses").addEventListener("click", () => driveBox({ changed: loadList }));
else $("#drive-courses").remove();

$("#new-course").addEventListener("click", newCourse);
$("#map-course")?.addEventListener("click", mapCourse);
inDriveToo();
loadList().then(() => {
  const q = new URLSearchParams(location.search);
  const id = q.get("course");
  if (id) openCourse(id, (Number(q.get("hole")) || 1) - 1);
  // (The course picker's "Real course from the map": course/panel.js.)
  else if (q.get("start") === "map" && MAP_COURSES) mapCourse();
  else newCourse();
});
