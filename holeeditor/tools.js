// The hole editor's tools and words (holeeditor.js): the toolbar's tools
// and their modes, each tool's help line and the reasons an edit is
// refused. Data and small helpers only - holeeditor.js does the editing.

import { DEPTHS } from "../sim/holeedits.mjs";

export const svg = (body) => `<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">${body}</svg>`;
export const TOOLS = [
  {
    id: "look",
    word: "Look",
    icon: svg(`<circle cx="13" cy="13" r="8" fill="none" stroke="#e7efe8" stroke-width="3"/><path d="M19 19l8 8" stroke="#e7efe8" stroke-width="4" stroke-linecap="round"/>`),
  },
  {
    id: "trees",
    word: "Trees",
    icon: svg(`<rect x="14" y="18" width="4" height="11" fill="#8a5a36"/><circle cx="16" cy="13" r="10" fill="#3f8a3a"/><circle cx="12" cy="11" r="4" fill="#5aa84c"/>`),
  },
  {
    // Decor placed by hand (sim/decor.mjs): heather, gorse, rocks,
    // wildflowers and bushes.
    id: "decor",
    word: "Decor",
    icon: svg(`<circle cx="9" cy="22" r="5" fill="#8a6a9a"/><circle cx="20" cy="20" r="6" fill="#4f7d3a"/><path d="M22 28l4-7 4 7z" fill="#9a958c"/><circle cx="12" cy="12" r="2.5" fill="#d8c25a"/>`),
  },
  {
    id: "bunkers",
    word: "Bunkers",
    icon: svg(`<path d="M4 18c0-6 8-9 13-7s11-1 11 5-6 9-13 9S4 23 4 18z" fill="#e8d9a6"/><path d="M9 19c3 2 10 2 14-1" stroke="#c9b47a" stroke-width="2" fill="none"/>`),
  },
  {
    id: "green",
    word: "Green",
    icon: svg(`<ellipse cx="16" cy="24" rx="13" ry="6" fill="#8fd060"/><path d="M16 24V4" stroke="#fff" stroke-width="2"/><path d="M16 4l10 4-10 4z" fill="#e5484d"/>`),
  },
  {
    id: "water",
    word: "Water",
    icon: svg(`<path d="M3 12q4-4 8 0t8 0 8 0M3 19q4-4 8 0t8 0 8 0M3 26q4-4 8 0t8 0 8 0" stroke="#5aa7df" stroke-width="3" fill="none" stroke-linecap="round"/>`),
  },
  {
    id: "brooks",
    word: "Brook",
    // A stream winding across between grassy banks.
    icon: svg(`<path d="M2 8c8 0 6 8 14 8s6 8 14 8" stroke="#6cae46" stroke-width="12" fill="none"/><path d="M2 8c8 0 6 8 14 8s6 8 14 8" stroke="#5aa7df" stroke-width="5" fill="none"/>`),
  },
  {
    id: "fairway",
    word: "Fairway",
    icon: svg(`<path d="M9 30C9 18 13 10 12 2h9c1 8-3 16-3 28z" fill="#6cae46"/><path d="M4 16h4M24 16h4M4 16l2-2M4 16l2 2M28 16l-2-2M28 16l-2 2" stroke="#e7efe8" stroke-width="2" stroke-linecap="round"/>`),
  },
  {
    // The rough's lines on a designed hole (sim/course.mjs firstCutWidth,
    // deepRoughFrom): the first cut wider or narrower, the deep rough in
    // or out, smoothed - rubbed along the edge.
    id: "rough",
    word: "Rough",
    icon: svg(`<path d="M2 30V2h8c3 9-3 19 0 28z" fill="#3f6b32"/><path d="M10 30c-3-9 3-19 0-28h6c-3 9 2 19 0 28z" fill="#629a45"/><path d="M16 30c2-9-3-19 0-28h14v28z" fill="#7db555"/><path d="M10 30c-3-9 3-19 0-28" stroke="#ffd23f" stroke-width="2" fill="none"/>`),
  },
  {
    // The ground of the whole hole (sim/groundedit.mjs): only on a hole
    // with real ground - from the map, or a course given hills.
    id: "ground",
    word: "Ground",
    icon: svg(`<path d="M2 26l8-12 6 7 5-9 9 14z" fill="#7a9a52"/><path d="M2 26l8-12 6 7 5-9 9 14" stroke="#e7efe8" stroke-width="2" fill="none" stroke-linejoin="round"/><path d="M24 4v8M21 7l3-3 3 3" stroke="#ffd23f" stroke-width="2" fill="none" stroke-linecap="round"/>`),
  },
  {
    id: "paths",
    word: "Paths",
    // A grey strip curving up the hole, with pale kerbs.
    icon: svg(`<path d="M8 30C8 20 24 18 22 2" stroke="#c9c3b3" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M8 30C8 20 24 18 22 2" stroke="#77756f" stroke-width="7" fill="none" stroke-linecap="round"/>`),
  },
];

// Ways of using a tool, and the line of help for each.
export const MODES = {
  decor: [
    { id: "place", word: "Place", help: "Pick what to place, then tap the ground. It can go on this hole's fairway, but not on a green, a tee, sand, water, right on the line, or another hole's ground." },
    { id: "move", word: "Move", help: "Drag a piece of decor to move it." },
    { id: "remove", word: "Take away", help: "Tap a piece of decor to take it away." },
  ],
  trees: [
    { id: "move", word: "Move", help: "Drag a tree to move it, or tap it to change its kind, shape or height. Tap empty ground to plant one." },
    { id: "plant", word: "Plant", help: "Rub over the ground to plant clumps of trees." },
    { id: "remove", word: "Take away", help: "Rub over trees to take them away." },
    { id: "pick", word: "Pick a bunch", help: "Draw a ring round some trees to pick them up, then drag the bunch where you want it." },
  ],
  green: [
    { id: "shape", word: "Shape", help: "Drag the white dots to change the green's shape. Drag the flag to move the pin." },
    { id: "styles", word: "Styles", help: "Tap a style for a ready-made green. Tap it again for another take on it." },
    { id: "brush", word: "Raise and lower", help: "Rub inside the ring to raise, lower or smooth the green. Each rub adds a little." },
    { id: "stamps", word: "Stamps", help: "Pick a shape, then tap the green to stamp it there. Drag it to move it. The white dot stretches and turns it; the yellow dot makes it wider." },
    { id: "tilt", word: "Tilt", help: "Drag across the green the way you want it to slope down. A longer drag makes it steeper." },
    { id: "area", word: "Area", help: "Tap round part of the green to outline it - three dots or more, any shape. Then level it, smooth it, raise or lower it, or hold its slope to a limit. Do two areas for a two-tier green." },
  ],
  // A designed hole's fairway: its width all along, or rubbed wider or
  // thinner where the brush goes, or its edge smoothed - and more fairways
  // added by hand, each moved, sized and shaped as a pond is (the owner, 22
  // October 2026: "I couldn't move the fairway on the par 3... I couldn't
  // create a second fairway").
  fairway: [
    { id: "width", word: "Width", help: "Slide to make the fairway narrower or wider all along." },
    { id: "wider", word: "Widen", help: "Rub along the fairway's edge to push it out there. Each rub adds a little." },
    { id: "thinner", word: "Thin", help: "Rub along the fairway's edge to bring it in there. Each rub takes a little." },
    { id: "smooth", word: "Smooth", help: "Rub along the fairway's edge to even out its line there." },
    { id: "more", word: "Add and move", help: "Tap the ground to add a fairway there - in front of the green, behind it, anywhere on the hole. Tap one to pick it, then drag it to move it." },
    // An island green's causeway (sim/causeway.mjs causewayLook; the owner,
    // 22 October 2026: "can we shape the causeway and make it bigger").
    { id: "causeway", word: "Causeway", help: "An island green's way to land. Make it wider or narrower, flare its ends out where they meet the green and the land, or drag the yellow dot at its end to turn it round the green and run it further onto the land." },
  ],
  rough: [
    { id: "cut-wider", word: "Wider first cut", help: "Rub along the first cut (the paler band by the fairway) to make it wider there." },
    { id: "cut-narrower", word: "Narrower first cut", help: "Rub along the first cut to make it narrower there - down to straight into the rough." },
    { id: "deep-in", word: "Deep rough in", help: "Rub where the deep rough (darker) starts to bring it in towards the fairway there." },
    { id: "deep-out", word: "Deep rough out", help: "Rub where the deep rough starts to push it back out - right out to the trees for none." },
    { id: "smooth", word: "Smooth", help: "Rub along an edge of the rough to even out its line there." },
  ],
  ground: [
    { id: "raise", word: "Raise", help: "Rub over the ground to build it up - a hill, a ridge, a raised green. Each rub adds a little." },
    { id: "lower", word: "Lower", help: "Rub over the ground to dig it down - a hollow, a valley. Each rub takes a little." },
    { id: "smooth", word: "Smooth", help: "Rub over bumps to smooth them out." },
    { id: "tilt", word: "Tilt the hole", help: "Slide to play the hole uphill or downhill, and to lean it left or right." },
  ],
};
// What an edge brush does, by tool and mode (holeedits.mjs "edge"): its
// band (none: smoothing the rough, whichever edge is nearer), how far each
// dab moves it, or smoothing. null for any other tool or mode.
export function edgeBrush(tool, mode) {
  if (tool === "fairway") return { wider: { band: "fw", a: 0.8 }, thinner: { band: "fw", a: -0.8 }, smooth: { band: "fw", smooth: true } }[mode] ?? null;
  if (tool === "rough") return { "cut-wider": { band: "cut", a: 1 }, "cut-narrower": { band: "cut", a: -1 }, "deep-in": { band: "deep", a: -2 }, "deep-out": { band: "deep", a: 2 }, smooth: { band: null, smooth: true } }[mode] ?? null;
  return null;
}
export const HELP = {
  look: "Zoom in with the + button, the mouse wheel or two fingers, then drag to look around.",
  bunkers: "Tap a bunker to pick it: then drag it, make it deeper or give it a wall with the buttons above. Tap empty ground to add one.",
  water: "Tap a pond or lake to pick it, then drag it or give it a wall edge. Tap empty ground to add a pond.",
  fairway: "Slide to make the fairway narrower or wider.",
  paths: "Tap a path to pick it. Tap empty ground to start a new one, then tap along where it should go.",
  brooks: "Tap empty ground to start a brook, then tap along where it runs. Tap a brook (or a burn) to change it.",
};
// Drawing a new brook.
export const BROOK_DRAWING_HELP = "Tap along where the brook runs. Pick Brook, Ditch or Stream, then tap Done.";
// Walling a stretch of a brook's bank: the first tap, then the second.
export const BANK_HELP = ["Tap the bank where the wall starts - or the water, for both banks.", "Now tap where the wall ends."];
export const NO_BROOK = "A brook can't run over the tee, the green or the cup, and needs to be at least 8 m long.";
// A hole from a map or on hills can have a fairway or more - its own, and
// its neighbours' that come within it - each sized or taken away on its
// own (the owner: "I need them to be independent and to be able to delete
// them and size them differently").
export const FAIRWAYS_HELP = "Tap a fairway to pick it: then make it narrower or wider, or remove it.";
// Drawing a new cart path.
export const DRAWING_HELP = "Tap along where the path should go. Tap Done when it's finished.";
// The paths between holes, to and from this one (the yellow lines: the
// owner, "Links can be adjusted on either hole in design"): with them
// shown, and with one picked.
export const LINKS_HELP = "Yellow lines are the paths to and from the holes either side: tap one to change it.";
export const LINK_HELP = "Drag its line to bend it, or a white dot to move that bit. Tap between dots for a new bend. Tap empty ground to let go.";
// Where a path between holes can't go (sim/linkpaths.mjs linkFits).
export const NO_LINK = "A path between holes can't go there: it keeps off tees, greens and sand, and crosses water only straight over, on a bridge.";
// With a bunker or pond picked.
export const PICKED_HELP = {
  bunkers: "Drag it to move it, drag its white dot to make it bigger or smaller, or use Deeper and Shallower above. Tap empty ground to let go of it.",
  water: "Drag it to move it, or drag its white dot to make it bigger or smaller. Drag a blue mark on its edge to pull that part of the shore in or push it out. Tap empty ground to let go of it.",
  paths: "Drag a white dot to move that bit, or the path to move it all. Tap between dots for a new bend. Tap empty ground to let go.",
  brooks: "Drag a white dot to move that bit, or the brook to move it all. Tap between dots for a new bend. Its banks slope down to the water unless walled. Tap empty ground to let go.",
  fairway: "Slide to make this fairway narrower or wider, or remove it. Tap another to pick it, or empty ground to let go.",
  // One added by hand (the Fairway tool's Add and move).
  added: "Drag it to move it, or drag its white dot to make it bigger or smaller. Drag a blue mark on its edge to pull that part in or push it out. Tap empty ground to let go of it.",
};
// With a bunker or pond picked that has a wall along its edge (sim/walls.mjs).
export const WALL_HELP = {
  bunkers: "Drag the yellow dots round the edge to choose where the wall goes. Taller and Lower change how far it drops to the sand.",
  water: "Drag the yellow dots along the edge to choose where the wall goes. Higher and Lower change how far it stands above the water.",
};
// Before it has one: what Add a wall does, by which way it would face
// (sim/walls.mjs wallFacing).
export const FACING = { green: "the side facing the green", far: "the side facing the green (its far side)", fairway: "the side facing the fairway" };
export const WALL_NOTE = {
  bunkers: (f) => `A wall on ${FACING[f]}. Drag its yellow dots round the edge to move it.`,
  water: (f) => `A wall on ${FACING[f]}, standing half a metre above the water. Drag its yellow dots along the edge to move it.`,
};
// The button that puts a wall back that way (worded as what it does, like
// every other button), and what Undo calls it.
export const FACE_BUTTON = { green: "Put it back facing the green", far: "Put it back on the far side", fairway: "Put it back facing the fairway" };
export const FACE_STEP = { green: "move the wall back to face the green", far: "move the wall back to the far side", fairway: "move the wall back to face the fairway" };
// A wall's height in words: "half a metre", "0.75 m", "1 m".
export const metres = (h) => (h === 0.5 ? "half a metre" : `${h} m`);
export const NO_WALL = {
  bunkers: "That wall's too short (or too long) for this bunker.",
  water: "That wall's too short (or too long) for this pond.",
};
// A bunker's depth, from as it was made (dug a little below the grass as
// every bunker is, no deeper than Shallow: sim/course.mjs sinkShape) down
// to a pot bunker: one step at a time.
export const LADDER = [{ name: "As made", dig: 0 }, ...DEPTHS];
export const depthStep = (dig) => (dig ? LADDER.reduce((best, d, i) => (Math.abs(d.dig - dig) < Math.abs(LADDER[best].dig - dig) ? i : best), 0) : 0);
export const NO_TREES = "Trees can't go on a green, a tee, sand, water or right on the line of play.";
export const NO_DECOR = "Decor can't go on a green, a tee, sand, water or right on the line of play.";
export const NO_SHAPE = "That would spoil the hole: the tee, the cup and the green have to stay clear.";
export const NO_GREEN = "The green can't grow over a bunker, a brook or a pond with a wall. Move them out of the way first.";
export const NO_SHAPING = "That can't be done to this green.";
export const NO_PATH = "A path can't go on a green, a tee, sand or water.";
// Why a path can't go where it's drawn (sim/paths.mjs pathTrouble).
export const PATH_WHY = {
  green: "A path can't go on or right by a green.",
  tee: "A path can't go on a tee.",
  sand: "A path can't go through sand.",
  water: "A path can't go through water.",
  "off the hole": "That's off this hole's ground.",
  "too short": "That's too short for a path: tap a few more dots along where it should go.",
  "too long": "That's longer than a path can be.",
};
export const TREES_GONE = "Trees in its way have gone (Undo brings them back).";
export const NO_SHAPE_ON_PATH = "Sand can't go on or right by a cart path.";
// A pond's edge pulled where it can't go.
// Why a bunker, pond or added fairway can't go where it's dragged
// (holeedits shapeTrouble), on the map in red.
export const SHAPE_TROUBLE = {
  tee: "Can't go on the tee",
  cup: "Can't go over the cup",
  green: "Can't go on the green",
  ground: "Off this hole's ground",
  path: "Not on a cart path",
  size: "As big (or small) as it goes",
};
export const NO_CAUSEWAY = "The causeway can't take that shape.";
export const NO_FAIRWAY = "A fairway can't go on the green, or off this hole's ground.";
export const NO_RESHAPE = "The water can't take that shape: the tee and the cup have to stay clear of it.";
// What each kind of stamp is called in Undo ("Undo: move the crescent").
export const STAMP_NAMES = ["round shape", "rectangle", "crescent"];
