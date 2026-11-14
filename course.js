// Playing a course: pick one made in the designer and play it hole by hole.
// Full shots fly and roll over whatever they land on; on the green it's a
// putt, with the putter sent to the connector and the grid showing the slopes.
//
// CourseMode is still one class, but some of its parts live in
// public/course/ (season.js, flyover.js, relief.js, scramble.js): each is
// a class of methods copied onto CourseMode.prototype at the bottom of this
// file, so `this` is the course and every caller (app.js, the pages, the
// tests) still imports CourseMode from here. A few constants those parts
// share are exported from here for them. See docs/ARCHITECTURE.md
// ("Playing a course") before moving more out; don't merge them back.

import { rollConditions, cleanConditions, holeBearing, components, arrowAngle, windArrow, windWords, playsLike, windy, conditionsWords, flagYaw, rainingAt, hazeFor, dryFor } from "./sim/weather.mjs";
import { screenPart } from "./widepicture.js";
import * as THREE from "three";
import { YARD } from "./sim/flight.mjs";
import { FOOT } from "./sim/putting.mjs";
import { blobRadius, LIES, pointAt, insideBlob, seedName } from "./sim/course.mjs";
import { insideDepth, shapeBounds, withEdits } from "./sim/holeedits.mjs";
import { greenZone, waterDry } from "./sim/greenfirst.mjs";
import { causeways, causewayPast, causewayBounds } from "./sim/causeway.mjs";
import { cutOver } from "./look/dugground.js";
import { stanceAt, stanceFromSlope, describeStance, FLAT, LIE_NAMES, drawSeverity } from "./sim/lie.mjs";
import { EYE } from "./sim/eye.mjs";
import { beforeLine, afterLine } from "./sim/lieguide.mjs";
import { ownCarry, forgetOwnCarries } from "./owncarry.js";
import {
  prepareHole,
  playShot,
  playPutt,
  suggestClub,
  defaultAim,
  distanceToPin,
  testShotFor,
  scoreName,
  toPar,
  riseToPin,
  faceAhead,
  launchToClear,
  swingFor,
  typicalShot,
  clubClearsFace,
  escapeAim,
  FACE_MARGIN,
  BAG,
  BAG_ORDER,
  rollNote,
  plannedCarry,
  puttGiven,
} from "./sim/courseplay.mjs";
import { TEE_NAMES, DEFAULT_TEE, teeColour, teeSpots, teeSpot, teeYards, onTeeBox } from "./sim/tees.mjs";
import { puttsFrom } from "./sim/clubs.mjs";
import { terrainMesh, terrainMeshHeight, skirtRing, splatTextures, mappedGroundMaterial } from "./look/mappedground.js";
import { makeBall, setFlagLook, toWorld, BallShadow } from "./scenery.js";
import { ballDrawRadius, REAL_BALL_R } from "./sim/ballsize.mjs";
import { setTuftClear, useShortGrass } from "./look/groundbits.js";
import { ask } from "./askbox.js";
import { keepNetLadder } from "./sim/netladder.mjs";
import { updateTuftFields } from "./look/tuftfield.js";
import { useCut } from "./look/cutline.js";
import { preparedHole } from "./sim/holesite.mjs";
import { dayOf } from "./sim/pinday.mjs";
import { penaltyWords } from "./sim/penalty.mjs";
import { flagLook, FLAG_FADE } from "./sim/flagstick.mjs";
import { DEFAULT_PLUGS, PLUG_WORDS } from "./sim/sand.mjs";
import { divotFor } from "./sim/marks.mjs";
import { sandFor, waterFor } from "./look/sandwater.js";
import { makeWall, cutAlongWall, landStrip, besideWall } from "./look/walls.js";
import { wallOf, wallLine, wallViews } from "./sim/walls.mjs";
import { brookBed, brookLine, nearestOnLine, kindOf as brookKind } from "./sim/brooks.mjs";
import { addEnvironment, applyReflections, sunDirection, setSky, setSun, useSun } from "./look/environment.js";
import { USUAL_SUN, roundSeason, roundClock, holeSun, clockWords, roundTimes, HOLE_HOURS } from "./sim/daylight.mjs";
import { setCourseSeason, SEASON_TODAY } from "./look/season.js";
import { grassMaterial, LAYER, GRASS } from "./look/grass.js";
import { holeMowing, MOW_WIDTH } from "./sim/mowing.mjs";
import { treeNote } from "./sim/treehits.mjs";
import { standsFor } from "./sim/treepalette.mjs";
import { treeWarning } from "./sim/treewarn.mjs";
import { fullText, noteShort } from "./sim/gametext.mjs";
import { ringMesh } from "./greenscene.js";
import { drawHole } from "./coursemap.js";
import { clubName } from "./bay.js";
import { HIGH, LEVEL, PHONE } from "./look/quality.js";
import { makeShotTracer } from "./look/tracer.js";
import { tracerColour, drawnPath, drawnHeight } from "./sim/tracer.mjs";
import { friendsShots } from "./sim/netflights.mjs";
import { flyoverAt, autoFlyover, lookDownPlan, idleCraneAt, IDLE_CRANE } from "./sim/flyover.mjs";
import { readyFan, fanLength, withFlight, flightStep } from "./sim/preflight.mjs";
import { warmUp } from "./look/warmup.js";
import { hideInScene, showHidden, dropHidden, sendSteps, sendNewSteps, drawAllSteps } from "./look/gpuprep.js";
import { WAIT, HEAVY, hurried } from "./sim/idlework.mjs";
import { teeView } from "./sim/teeview.mjs";
import { effectsInUse } from "./sim/effects.mjs";
import { SURFACE_LIFT, drawnLift, restingLift } from "./look/lifts.js";
import { showNest } from "./look/lienest.js";
import { noteFrame } from "./sim/framenotes.mjs";
import { withCountry } from "./look/country.js";
import { bakesOn, keptHoles } from "./look/bake.js";
import { withLinks } from "./sim/linkpaths.mjs";
import { insidePolygon } from "./sim/terrain.mjs";
import { speedTestPlan, speedTestAt, speedTestTreePath } from "./sim/speedtest.mjs";
import { coastOf, shoreHeight, duneLump, seaLevel, onshoreFrom, COAST } from "./sim/coast.mjs";
import { skirtLevel, skirtHeight, ringDrop, SKIRT } from "./sim/country.mjs";
import { holeHeightField } from "./sim/coursefield.mjs";
import { calmShapes, cropBoxOf } from "./sim/holecrop.mjs";
import { insideCrop, sheetSteps, skirtToward } from "./sim/cropground.mjs";
import { clearGroup, shared } from "./look/dispose.js";
import { view, keepInView, clearOfTrees, easePast } from "./view.js";
import { greenEntry, greenView, greenFollow } from "./sim/greencam.mjs";
import { loadSetting, saveSetting, fmt, esc } from "./util.js";
import { photoFor, wantPhoto, keepPhoto, PHOTOS } from "./sim/coursephotos.mjs";
import { LOOK } from "./sim/lookstamp.mjs";
import { flightFacts, newId } from "./recorder.js";
import { celebrationFor, finishFacts, roundCelebration } from "./sim/celebration.mjs";
import { Celebration } from "./celebrate.js";
import { Sounds } from "./sounds.js";
import { audio } from "./audio/engine.js";
import { shotCues, CueQueue } from "./audio/cues.mjs";
import {
  puttFeedback,
  GuideCache,
  followsPutt,
  followPose,
} from "./sim/puttguide.mjs";
import { puttLine, stepLineLevel, watchLineLevel } from "./puttline.js";
import { roundRules, readsLimited, spendRead, rulesWords } from "./sim/netrules.mjs";
import { pickNextCourse, idleNote, playAgainNote, keyed, nextAction, anyScores, roundUnderway, introCard, canRestartRound, canEndRound } from "./sim/roundkeys.mjs";
import { roundStats } from "./sim/roundstats.mjs";
import { roundCard } from "./sim/roundcard.mjs";
import { FORMATS, FORMAT_NAMES, formatFits, holeWords } from "./sim/formats.mjs";
import { waitingFor, waitingWords, cleanHoleSpecs } from "./sim/netgame.mjs";
import { cleanTeams, teamsOf, teamName, usesTeams, newScramble, scrambleHit, scrambleTurn } from "./sim/teams.mjs";
import { thinPath } from "./sim/netpath.mjs";
import { baselineLevel, baselineName } from "./sim/strokesgained.mjs";
import { regridDue } from "./sim/greenread.mjs";
import { SectionView } from "./sectionview.js";
import {
  playerNames,
  honourOrder,
  nextPlayer,
  holeFinished,
  standings,
  winnerTitle,
  totalsLine,
} from "./sim/players.mjs";
import { CourseSeason } from "./course/season.js";
import { CourseMatchLadder } from "./course/matchladder.js";
import { CourseLadderOnline } from "./course/ladderonline.js";
import { CourseLadderPostal } from "./course/ladderpostal.js";
import { CourseLadderOpen } from "./course/ladderopen.js";
import { CourseLadderWeb } from "./course/ladderweb.js";
import { CourseSeasonPost } from "./course/seasonpost.js";
import { CourseFlyover } from "./course/flyover.js";
import { CourseRelief } from "./course/relief.js";
import { CourseDropSpot } from "./course/dropspot.js";
import { CourseScramble } from "./course/scramble.js";
import { CourseHoleBuild, fromOwnServer } from "./course/holebuild.js";
import { CourseHoleScenery } from "./course/holescenery.js";
import { CoursePutting } from "./course/putting.js";
import { CourseNetFlights } from "./course/netflights.js";
import { CourseNetResume } from "./course/netresume.js";
import { boardOrder } from "./sim/netresults.mjs";
import { CoursePanel } from "./course/panel.js";
import { CourseMulligan } from "./course/mulligan.js";
import { CourseLandings } from "./course/landings.js";
import { CourseBuggy } from "./course/buggy.js";
import { CourseMadeUp } from "./course/madeupplay.js";
import { CourseFilms } from "./course/films.js";
import { CourseWatch } from "./course/watch.js";
import { beforeStroke } from "./sim/mulligan.mjs";
import { fitLens } from "./sim/upright.mjs";
import { PartClock } from "./sim/frameparts.mjs";

// A set of lists of things on the ground ([x, z, ...] in the hole's frame:
// dressing, a links hole's marram and pebbles) without those `off` says
// are on the beach; anything else in it as it was.
export function offShore(set, off) {
  if (!set) return set;
  const out = { ...set };
  for (const [k, v] of Object.entries(set)) if (Array.isArray(v) && v.length && Array.isArray(v[0]) && Number.isFinite(v[0][0])) out[k] = v.filter((p) => !off(p[0], p[1]));
  return out;
}

// Tufts of longer grass all over every hole (the Grass all over the hole
// switch, sim/effects.mjs); off, only by the tee and round the green.
export const GRASS_FIELD = HIGH && effectsInUse(loadSetting("effects", {}), LEVEL).grassfield;

// The seed a hole's mowing is worked out from (look/glsl/ground.js
// mowingFor): the same hole, the same pattern every time. (A plain
// function, so the Challenges' hole scenery, which borrows the course's
// drawing, needs nothing more.)
export { mowSeed, holeMowing } from "./sim/mowing.mjs";

// Where a hole's tee boxes are (hole frame): a designed hole's own tee, or a
// mapped one's mapped boxes, and the squares round each of its tee spots
// (sim/tees.mjs) - what a cart path is never drawn over.
export function teeBoxAt(L) {
  const spots = L.teeSpots ?? [];
  const mapped = L.source === "map" ? (L.tees ?? []).filter((t) => Array.isArray(t) && t.length > 2) : null;
  return (x, z) => (mapped ? mapped.some((t) => insidePolygon(t, x, z)) : Math.abs(x) <= 6 && Math.abs(z) <= 7) || onTeeBox(spots, x, z);
}
// A shot in the air or rolling that has run onto the green, with the camera
// set to follow: the close look there (sim/greencam.mjs).
const closesIn = (f) => !!f?.green && view.follow && f.elapsed >= f.green.t;

export const BALL_R = 0.045; // a little larger than life so it can be followed

export const PUTT_BALL_R = 0.02135;
// The view from the ball (S): the camera this far above it and behind it,
// looking this far along the aim and this much higher (metres).
export const BALL_VIEW = { up: 0.45, back: 0.25, ahead: 40, rise: 2 };
// The view while an unplayable ball's drops are shown (sim/relief.mjs
// dropsView): at least this far behind them and this high (metres), this
// far round to the right of the line from the hole (radians).
export const DROPS_VIEW = { behind: 7, up: 2.2, side: 0.45 };
export const MAX_STROKES = 10; // pick up after this many
// A putt left this close (feet) is given: up to 6 ft.
export const GIMMES = { 0: "None", 2: "2 ft", 3: "3 ft", 4: "4 ft", 5: "5 ft", 6: "6 ft" };
// A course as text, to tell whether it's the one a hole was built for -
// less its holes' trees as kept (sim/treelock.mjs: what a hole's build
// sends the server once, and the course comes back with next time, for the
// very trees it was built with).
// (And less its cart paths as kept: sim/pathlock.mjs.)
const courseJson = (c) => JSON.stringify(c?.holes ? { ...c, pathLock: undefined, holes: c.holes.map((h) => (h?.layout?.treeLock ? { ...h, layout: { ...h.layout, treeLock: undefined } } : h)) } : c);
// The wait after a flyover before the next hole.
// How long the scorecard after each hole stays up, seconds (showHoleCard).
const HOLE_CARD = 10;
// How long a hole has been on screen before the next is built ahead
// (prebuildNext), ms. On the phone sooner: its build takes three or four
// times a PC's, and only what the picture rests through goes on it, so the
// first quiet moments of a hole count (the owner, 1 November 2026: "Some
// times where we get a loading screen").
const PREBUILD_WAIT = PHONE ? 1500 : 6000;
// The longest a hole built a step at a time waits for its country, tufts
// or sheets from the other core (startCountry) before working them out
// itself. Long: a slow core is still doing the work, and working it out
// here as well was the same seconds again with the page held for all of
// them (at 20 s, a report's 41 s and 75 s stood still on the green). Not
// waited for at all when the build's hurried.
export const COUNTRY_WAIT = 120000;
// The longest the hole built ahead waits for the card to finish its new
// shaders before its shapes are sent (prebuildSteps): sent sooner, the
// first one drawn with a shader still building holds the page until it's
// done.
const SHADER_WAIT = 120000;
export const AFTER_FLYOVER = 3;
// A flyover's next stroke starting further than this (metres) from where
// the last one finished - played again from the tee - is cut to.
export const FLYOVER_CUT = 30;

// The lie's guidance lines in the side panel: small, under the lie. A
// line may be { text, short } (the trees' warning): the whole of it here.
export function lieGuideHtml(lines) {
  return lines.length ? `<span class="lie-guide">${lines.map((l) => esc(fullText(l))).join("<br>")}</span>` : "";
}

// How long the first hole before a round waits for its shaders before it's
// shown anyway (idleBuilt), ms.
const IDLE_WARM_LIMIT = 20000;
// The first hole drawn ahead with another mode on screen (aheadOfMode):
// not until `after` ms from its being asked for - the mode on show's own
// loading and warming first - and at `priority` in the quiet moments'
// queue, under the work for what's being played.
export const IDLE_AHEAD = { after: 8000, priority: 0 };
// How long a shot's grass across the hole waits on the other core before
// it's placed on the page after all (growHoleGrass).
export const HOLE_GRASS_WAIT = 20000;
// How long a hole built a step at a time waits for what's kept of it from
// the last time it was built (openBake) before it's built afresh, ms.
export const BAKE_WAIT = 15000;
// How long after the course list arrives (or a round ends) every course's
// first hole starts being kept ahead (bakeFirstSoon), ms: the page settled
// first, and the selection screen's own hole built.
const BAKE_FIRST_DELAY = 20000;
// Each course's first hole's kept file name, by the course as it was (its
// id, when it was last changed, the grain setting): known, it's found kept
// without making the hole ready to name it (bakeFirstSteps). Kept between
// visits in the page's own storage.
const firstKept = (() => {
  let had = {};
  try {
    had = JSON.parse(localStorage.getItem("golfsim.firstKept") ?? "{}") ?? {};
  } catch {
    had = {};
  }
  const map = new Map(Object.entries(had));
  return {
    get: (k) => map.get(k) ?? null,
    set(k, v) {
      map.set(k, v);
      // (Only the last few hundred.)
      while (map.size > 400) map.delete(map.keys().next().value);
      try {
        localStorage.setItem("golfsim.firstKept", JSON.stringify(Object.fromEntries(map)));
      } catch {
        // (Not kept: worked out again next time.)
      }
    },
  };
})();

// Runs a build's steps (a generator: buildHoleSteps) letting the page go
// every SLICE_MS or so - and for a moment when a step is waiting on
// another core (WAIT) - rather than all at once.
// (Behind the "Loading hole N..." card, with the picture not drawn,
// LOADING_SLICE_MS: longer slices, the build done in about a third of the
// time, the page still answering - the card's circle turns on the
// graphics card's side.) Resolves to the longest single step (ms), for
// the report's log of the move.
const SLICE_MS = 12;
const LOADING_SLICE_MS = 40;
async function runSliced(steps, slice = SLICE_MS) {
  let from = performance.now();
  let longest = 0;
  for (;;) {
    const t0 = performance.now();
    const { done, value } = steps.next();
    longest = Math.max(longest, performance.now() - t0);
    if (done) return longest;
    if (value === WAIT || performance.now() - from > slice) {
      await new Promise((go) => setTimeout(go, value === WAIT ? 8 : 0));
      from = performance.now();
    }
  }
}

export class CourseMode {
  constructor(panel, renderer, view) {
    this.panel = panel;
    // Each step of update timed, for a long frame's words (sim/
    // frameparts.mjs: app.js noteFrame takes them).
    this.steps = new PartClock();
    this.renderer = renderer;
    // The picture's element, for the cards laid over it.
    this.view = view;
    this.scene = new THREE.Scene();
    // The hole's mower's line for its own grass, while it's drawn, and no
    // other scene's (look/cutline.js).
    this.scene.onBeforeRender = () => useCut(this.cutField);
    this.scene.onAfterRender = () => useCut(null);
    // A near plane well out from the camera keeps depth precision for the
    // flat layers (fairway, sand, water) hundreds of metres away.
    // (A golfer's lens: sim/eye.mjs.)
    this.camera = new THREE.PerspectiveCamera(EYE.lens, 1, 0.25, 6000);
    // The season being played, if any (sim/season.mjs): kept between
    // sessions.
    this.season = loadSetting("season", null);
    // The match ladders (course/matchladder.js).
    this.ladders = this.readLadders(loadSetting("ladders", null));
    // The seasons by post this bay's in (course/seasonpost.js).
    this.postSeasons = this.readPostSeasons(loadSetting("postSeasons", null));
    this.settings = loadSetting("course", { courseId: null, mulligans: false, gimme: 2, stimp: 10, ground: "normal", grid: true, autoFlyover: false, lookDown: false, wind: "calm", temp: "mild", sky: "fair", time: "any", format: "stroke", handicaps: true, hcp: {}, friendsShots: "together", tees: DEFAULT_TEE });
    if (!FORMATS.includes(this.settings.format)) this.settings.format = "stroke";
    this.settings.tees = teeColour(this.settings.tees);
    // The replay of a hole became asked for (J), not automatic: once, those
    // who had it on by itself (the old default) have it off.
    if (!this.settings.flyoverAsked) {
      this.settings.autoFlyover = false;
      this.settings.flyoverAsked = true;
      saveSetting("course", this.settings);
    }
    this.settings.friendsShots = friendsShots(this.settings.friendsShots);
    // Online: the other bays' shots waiting to fly here, those flying,
    // those down here before their bay has said where they finished (flown
    // as they were struck: course/netflights.js), and how long the waiting
    // ones have been held for friends still to play.
    this.remoteFlights = [];
    this.remoteFlying = [];
    this.remoteParked = [];
    this.gathered = 0;
    // The pauses in play - after a shot, the celebration before the next
    // hole or its flyover, between holes online, after a flyover - are this
    // many times as long: 1, or less while the game's video plays
    // (showreel.js keeps it moving). And whether the flyover's card is
    // offered after a hole (not in the game's video).
    this.pace = 1;
    this.offers = true;
    // A hole finished isn't moved on from (no card, ride or next hole): the
    // game's video goes on to its next scene itself (showreel.js).
    this.holdOnHole = false;
    if (!this.settings.hcp || typeof this.settings.hcp !== "object") this.settings.hcp = {};
    this.onChange = () => {};
    this.onToast = () => {};
    this.onClub = () => {};
    this.list = [];
    // The course picker (coursefinder.js), made when it's first opened
    // (course/panel.js openPicker).
    this.picker = null;
    // Whether the list of courses has come back from the server yet: until
    // it has, "no courses" isn't known to be true.
    this.listed = false;
    this.course = null;
    // The course whose kinds of tree were last put on the shelves of shapes
    // (course/holebuild.js buildHoleSteps: look/trees.js wantTreeKinds).
    this.kindsWanted = null;
    // { index, hole, players: [{ name, colour, scores, strokes, ball, lie,
    // shots, club, aim, stance, done }], order, turn, done, message }
    this.round = null;
    // The next hole built ahead in the picture's quiet moments (prebuildNext:
    // the queue is app.js's, sim/idlework.mjs), while it's being built, and
    // once it's ready to show.
    this.idleWork = null;
    this.prebuild = null;
    this.prebuilding = null;
    this.prebuilt = null;
    this.flying = null;
    // The game's video's camera, held where it puts it (holdView).
    this.heldView = null;
    this.world = new THREE.Group();
    this.scene.add(this.world);
    this.light = addEnvironment(this.scene, renderer, { shadowSize: 60 }).light;
    this.ballShadow = new BallShadow(this.light.userData.sun, BALL_R);
    this.scene.add(this.ballShadow.mesh);
    this.look = new THREE.Vector3();
    this.camWant = new THREE.Vector3();
    // Online: the friend being watched, and the bar saying so (course/watch.js).
    this.watching = null;
    this.watchBarEl = null;
    this.lookWant = new THREE.Vector3();

    // The hole map, laid over the picture in a corner.
    this.mapCanvas = document.createElement("canvas");
    this.mapCanvas.width = 220;
    this.mapCanvas.height = 330;
    this.mapCanvas.className = "course-map";
    this.mapCanvas.title = "Click to show the holes around this one";
    this.mapCanvas.addEventListener("click", () => {
      this.mapWide = !this.mapWide;
      if (this.round?.hole) this.drawMaps();
    });
    this.mapCanvas.hidden = true;
    view.appendChild(this.mapCanvas);
    // With friends, a compact scoreboard just under it: on the map itself it
    // would cover the tee and whoever's ball is short of the others.
    this.standingsCanvas = document.createElement("canvas");
    this.standingsCanvas.width = 220;
    this.standingsCanvas.className = "course-standings";
    this.standingsCanvas.hidden = true;
    view.appendChild(this.standingsCanvas);

    // Finishing a hole: a banner, effects and a sound to suit the score.
    this.sounds = new Sounds();
    this.celebration = new Celebration({ view, canvas: renderer.domElement, scene: this.scene, sounds: this.sounds, high: HIGH });
    this.celebration.onBannerGone = () => this.render();
    // After a hole, the offer of a flyover following the ball through its
    // strokes (J, "flyover", or a click on it - with friends, on a name),
    // and the flyover itself while it runs.
    this.offerEl = document.createElement("div");
    this.offerEl.className = "corner-card flyover-offer";
    this.offerEl.hidden = true;
    this.offerEl.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-slot]");
      if (b) this.startFlyover(Number(b.dataset.slot));
    });
    view.appendChild(this.offerEl);
    // The scramble's pick: the captain's choice of the team's balls.
    this.pickEl = document.createElement("div");
    this.pickEl.className = "corner-card scramble-pick";
    this.pickEl.hidden = true;
    this.pickEl.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-pick]");
      if (b) this.pickBall(Number(b.dataset.pick));
    });
    view.appendChild(this.pickEl);
    // An unplayable ball's choices (U): where it can be played from under
    // the Rules, each marked on the hole and the map.
    this.reliefEl = document.createElement("div");
    this.reliefEl.className = "corner-card relief-pick";
    this.reliefEl.hidden = true;
    this.reliefEl.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-relief]");
      if (!b) return;
      if (b.dataset.relief === "keep") this.playAsItLies();
      else if (b.dataset.relief === "drop") this.dropHere();
      else if (b.dataset.relief === "back") this.backToChoices();
      else this.chooseRelief(Number(b.dataset.relief));
    });
    view.appendChild(this.reliefEl);
    this.relief = null;
    // Looking from the ball itself (S), not from behind it.
    this.fromBall = false;
    // Before a round: the first hole of the course N plays, drawn behind a
    // card saying what to do (showIdle) - in place of an empty sky.
    // idle: { id, updated, stimp, json, hole, plan, t, treePath } while
    // that hole is drawn.
    this.idle = null;
    this.introEl = document.createElement("div");
    this.introEl.className = "course-intro";
    this.introEl.hidden = true;
    this.introEl.addEventListener("click", (e) => {
      // (Each player's level, changed before the round: app.js levelCard.)
      if (e.target.closest("button[data-act=levels]")) return this.onLevels?.();
      if (!e.target.closest("button[data-act=start]")) return;
      e.target.blur();
      this.next();
    });
    view.appendChild(this.introEl);
    // A still of the course behind the card while its first hole is being
    // drawn (sim/coursephotos.mjs): its own from the last time it was
    // shown, else another course's, else a painted sky and fairway - gone
    // once the hole's own picture is there (pictureDrawn).
    this.photoEl = document.createElement("div");
    this.photoEl.className = "course-photo gone";
    view.insertBefore(this.photoEl, this.introEl);
    // In the phone app a film of the course's first hole there instead
    // (course/films.js): films, the app's (sim/flyfilms.mjs cleanFilms),
    // once read; film, the one playing.
    this.filmEl = document.createElement("video");
    this.filmEl.className = "course-film gone";
    this.filmEl.muted = true;
    this.filmEl.loop = true;
    this.filmEl.playsInline = true;
    this.filmEl.setAttribute("muted", "");
    this.filmEl.setAttribute("playsinline", "");
    this.filmEl.setAttribute("aria-hidden", "true");
    view.insertBefore(this.filmEl, this.introEl);
    this.films = null;
    this.film = null;
    this.filmsRead = false;
    this.flyoverOffer = null;
    this.flyover = null;
    // Whether the course is on screen (see setActive), and whether a
    // finished hole is waiting for it to be to move on.
    this.isActive = true;
    this.moveOnWhenBack = false;

    // Putting guidance for where the ball is on the green (preparePutt),
    // and the ideal lines already worked out, by where they're from.
    this.puttGuide = null;
    this.ideals = new GuideCache(12);
    // Looking along the putt's line a section at a time (I, or the panel).
    this.sections = new SectionView({ camera: this.camera, view });
    this.sections.onChange = () => this.render();

    this.buildPanel();
    this.refreshList();
    // The ideal line setting, changed here or on the putting green.
    watchLineLevel(() => {
      const box = this.panel.querySelector("#course-line");
      if (box) box.value = puttLine.level;
      const help = this.panel.querySelector("#course-playslike");
      if (help) help.checked = puttLine.playsLike;
      const colours = this.panel.querySelector("#course-gridcolours");
      if (colours) colours.checked = puttLine.gridColours;
      if (this.round?.hole) {
        this.drawIdeal();
        this.render();
      }
    });
  }

  // ---- Which club, where it's aimed ------------------------------------------

  // The player whose ball is in play: the one whose turn it is (or who has
  // just played, until the view moves on).
  get me() {
    const r = this.round;
    return r?.players?.[r.turn] ?? null;
  }
  // Before a round, the program's club in hand (app.js: heldClub).
  get club() {
    return this.me?.club ?? this.heldClub?.() ?? "DR";
  }
  // (Before a round, the first hole drawn behind the card: showIdle.)
  get hole() {
    return this.round?.hole ?? this.idle?.hole ?? null;
  }
  get onGreen() {
    return this.me?.lie === "green";
  }
  // Putting: on the green, or with the putter picked off it - on the
  // fringe, the fairway or the first cut (sim/clubs.mjs PUTTER_LIES) -
  // where it's played, read, aimed and watched as a putt on the green is.
  get putting() {
    return this.onGreen || (this.me?.club === "PT" && puttsFrom(this.me?.lie));
  }
  // The green read - its grid and slope shading (course/putting.js
  // showGrid, showShade) - while putting, on the green or off it, and on
  // the fringe whatever the club (the owner, 26 October 2026: "if you're
  // going to go putter, and in fact even when you're on the fringe with a
  // chip, we should be seeing some green reads").
  get greenRead() {
    return this.putting || this.me?.lie === "fringe";
  }
  // Yards to the pin from the ball in play, for another launch monitor's
  // connector (app.js sendClub: Open Connect's player information); null
  // between rounds.
  targetYards() {
    const p = this.me;
    if (!p?.ball || !this.hole) return null;
    return distanceToPin(this.hole, p.ball) / YARD;
  }
  // More than one player: names show, turns pass.
  get multi() {
    return (this.round?.players?.length ?? 0) > 1;
  }
  get players() {
    return playerNames(this.settings.players);
  }

  setClub(club, { reaim = true } = {}) {
    // (Nor while a round's first hole is still loading.)
    if (!this.round?.hole) return;
    const was = this.putting;
    this.me.club = club;
    if (reaim) this.me.aim = defaultAim(this.hole, this.me.ball, club);
    this.updateStance();
    // The putter picked off the green, or put away again (course/
    // putting.js puttingChanged).
    if (this.putting !== was) this.puttingChanged();
    this.onClub(club);
    this.drawAim();
    this.render();
  }

  // T: the ideal line on the greens - off, after each putt, before and
  // after.
  // Online with line reads counted (sim/netrules.mjs), on the green before
  // a putt: T spends one on this putt instead.
  stepLine() {
    const p = this.me;
    const g = this.puttGuide;
    if (p?.reads && g && !g.struck && !p.done && !this.flying) {
      const out = spendRead(p.reads, g.key);
      p.reads = out.reads;
      this.onToast(out.words, 2000);
      this.drawIdeal();
      this.render();
      return;
    }
    this.onToast(stepLineLevel(), 1800);
  }

  // I (Shift + I back): on the green, the view steps along the putt's line -
  // 25%, 50%, 75%, behind the hole, side-on, and back behind the ball.
  stepSection(delta = 1) {
    if (!this.canLookAlong()) return;
    const stop = this.sections.step(delta);
    if (stop) this.onToast(stop.id === "ball" ? "Back behind the ball" : `Line: ${stop.name.toLowerCase()}`, 1400);
  }
  // A stop's button in the panel.
  pickSection(i) {
    if (this.canLookAlong()) this.sections.go(i);
  }
  // Only lining up a putt (on the green, or the putter picked off it): not
  // with the ball on its way, nor while the last shot is still being
  // looked at.
  canLookAlong() {
    const r = this.round;
    if (r && !r.done && !r.finished && !r.pending && this.putting && !this.flying && !this.me?.done && this.sections.putt) return true;
    this.onToast("Before a putt: I looks along the line", 2000);
    return false;
  }

  // With friends, changing club or aim during the pause after a shot is
  // the next player getting ready: their turn starts now.
  // True when it did: that key press only readied the next player, so it
  // changes nothing else (and the "Ben to play" toast stays up).
  takeTurn() {
    if (!this.multi || this.flying || !(this.round.pending || this.me.done) || this.round.done) return false;
    this.passTurn(true);
    return true;
  }

  stepClub(delta) {
    if (this.round && this.takeTurn()) return this.club;
    if (!this.round || this.onGreen) return this.club;
    const list = BAG_ORDER.filter((c) => c !== "DR" || this.me.lie === "tee");
    // On the short grass, the putter after the lob wedge.
    if (puttsFrom(this.me.lie)) list.push("PT");
    const i = Math.max(0, list.indexOf(this.club));
    const next = list[Math.min(list.length - 1, Math.max(0, i + delta))];
    this.setClub(next);
    return next;
  }

  // The slope of the stance: on a generated hole, made up for the spot (the
  // same for anyone who finds it); on a mapped one, the real ground's slope
  // for the way you're aiming.
  updateStance() {
    const r = this.me;
    if (!r?.ball) return;
    if (this.onGreen || r.lie === "tee") r.stance = FLAT;
    else if (this.hole.mapped) r.stance = stanceFromSlope(this.hole.gradientAt(...r.ball), r.aim);
    else r.stance = stanceAt(this.course.holes[this.round.index].spec.seed ?? 1, r.ball[0], r.ball[1], r.lie);
  }

  // ← / →: turn the aim a degree (a quarter on the green). Nothing to aim
  // once the hole's finished, and the camera may be off framing the flag.
  nudgeAim(dir) {
    // (Nothing to aim at while a round's first hole is still loading.)
    if (this.round && !this.round.hole) return;
    if (this.round && this.takeTurn()) return;
    if (!this.round || this.round.done || this.me.done || this.flying) return;
    // Aiming is done from behind the ball.
    this.sections.reset();
    this.me.aim += (dir * (this.putting ? 0.25 : 1) * Math.PI) / 180;
    this.aimTurnedAt = performance.now();
    this.updateStance();
    this.drawAim();
    // Eased round, not jumped, so holding an arrow turns smoothly.
    this.placeCamera(false);
    this.render();
  }

  // ---- Courses -------------------------------------------------------------------

  async refreshList() {
    try {
      this.list = await fetch("/api/courses").then((r) => r.json());
    } catch {
      this.list = [];
    }
    this.listed = true;
    this.renderList();
    this.idleSoon();
    this.bakeFirstSoon();
    // Bay view's note says which course N plays, and that isn't known until
    // the list arrives (after the first drawing when the app starts in
    // course mode, or when a course is added in the designer).
    this.onChange();
  }

  // `from`: the hole to start at (1 is the first), for the designer's
  // "Play this hole".
  // net: an online game's round (netplay.js) - the course from the host,
  // everyone's players (this bay's playing here, the others shown as they
  // go), the host's weather and game: { bay, game, courseUrl }.
  // weather: conditions to play it in (sim/weather.mjs cleanConditions)
  // instead of rolling them from the settings - the game's video's own.
  // made: the course itself, not fetched (the game's video's copy of a
  // course as it comes, and its hole as the designer left it: showreel.js).
  // only: just that one hole, then back to the course designer (its "Play
  // this hole": the owner, 22 October 2026, "it just plays that hole and
  // then goes back to the course designer") - not on into the rest of the
  // course, nor kept as a round.
  async startRound(id = this.settings.courseId, from = 1, net = null, { weather: given = null, course: made = null, only = false } = {}) {
    if (!id && !net) return;
    this.heldView = null;
    // (A hole built ahead for the last round is no use to this one; nor is
    // the courses' first holes being kept ahead while it's played.)
    this.dropPrebuilt();
    this.idleWork?.cancel("bake-first");
    this.dropKept();
    this.dropSwitch();
    this.hideHoleCard();
    // (Started twice at once - N pressed twice: the later one goes ahead.)
    const starting = (this.starting = {});
    const url = net ? net.courseUrl : `/api/courses/${encodeURIComponent(id)}`;
    // (A server that's gone says so too, as a course it doesn't have does.)
    // (One from this page's own server keeps its holes' trees there once
    // grown: course/holebuild.js keepTreeLock.)
    const course =
      made ??
      (await fetch(url)
        .then((r) => (r.ok ? r.json() : null))
        .then((c) => (url.startsWith("/api/courses/") ? fromOwnServer(c) : c))
        .catch(() => null));
    if (this.starting !== starting) return;
    if (!course) {
      this.onToast(net ? "Couldn't get the host's course - try again in a moment" : "Couldn't load that course");
      // (A ladder's match or a season's event that couldn't start isn't
      // left waiting to become whatever round's played next.)
      this.pendingLadder = null;
      this.pendingSeason = null;
      this.pendingPostSeason = null;
      return;
    }
    if (!net) {
      this.settings.courseId = id;
      saveSetting("course", this.settings);
    }
    // (Its holes' numbers numbers, whoever's PC it came from.)
    cleanHoleSpecs(course);
    this.course = course;
    // Its cart paths kept as first worked out (sim/pathlock.mjs), if they
    // aren't yet (or it's changed since): course/holebuild.js keepPathLock.
    this.keepPathLock(course);
    // The players' own carries, asked again: the stats have grown.
    forgetOwnCarries();
    // A shot still in the air belonged to the last round, and so did any
    // setting up after one.
    this.flying = null;
    this.settingUp = false;
    const start = Math.min(course.holes.length, Math.max(1, Math.floor(from) || 1));
    const g = net?.game;
    const players = net
      ? g.players.map((q) => ({ name: q.name, colour: q.colour, scores: course.holes.map(() => null), last: null, netId: q.id, remote: q.bay !== net.bay, netIndex: q.index }))
      : (this.pendingLadder?.players ?? this.pendingPostSeason?.players ?? this.players).map((name, slot, all) => ({ name, colour: this.colourOf(all, slot), scores: course.holes.map(() => null), last: null }));
    // The round's weather, rolled once from the choice (sim/weather.mjs):
    // the same wind (in its gusts), temperature and sky for every hole -
    // online, the host's, the same on every bay. A wet sky plays with soft
    // fairways for this round only (courseplay.mjs roundGround), the
    // owner's Fairways setting left as it is.
    const weather = net && g.round.weather ? cleanConditions(g.round.weather) : given ? cleanConditions(given) : cleanConditions(rollConditions({ wind: this.settings.wind, temp: this.settings.temp, sky: this.settings.sky, time: this.settings.time, altitudeM: this.settings.altitudeM, humidity: this.settings.humidity }, Date.now()));
    // By the sea, the wind comes off it (sim/coast.mjs onshoreFrom): the
    // way it was rolled turned into the sea's quarter - the same on every
    // bay online, from the host's roll and the same course.
    const coast = coastOf(course);
    if (coast) weather.wind.from = onshoreFrom(coast.from, weather.wind.from / 360);
    // The round's clock (sim/daylight.mjs roundClock: its time of day as
    // picked with the sky, or from its seed - online the host's, and the
    // host's clock), a quarter of an hour a hole and done by dusk, and the
    // sun on its first hole; then its sky, baked with the sun where it now
    // is. Moved on at each hole (showHole).
    const clock = roundClock(weather.time, weather.seed, only && !net ? 1 : course.holes.length - start + 1, weather.clock);
    setSun(holeSun(clock, 0));
    setSky(this.scene, weather.sky, weather.seed);
    // And its own season and upkeep (sim/daylight.mjs roundSeason: drier on
    // a links, after a dry spell, with firm fairways; lusher after rain),
    // read as each hole is built (look/season.js).
    const linksCourse = (course.holes ?? []).filter((h) => (h.layout ?? h)?.links).length * 2 > (course.holes?.length ?? 0);
    setCourseSeason(roundSeason(weather.seed, { links: linksCourse, sky: weather.sky, ground: this.settings.ground, today: SEASON_TODAY }));
    // The game (sim/formats.mjs): match play needs two sides, the team
    // games two players. The teams (sim/teams.mjs): online, the host's for
    // everyone; here, the panel's.
    // (A match ladder's match between two here: match play. A season by
    // post's event: stroke play.)
    const want = net ? g.round.format : this.pendingLadder?.players?.length === 2 ? "match" : this.pendingPostSeason ? "stroke" : this.settings.format;
    const teamOf = usesTeams(want, players.length) ? (net ? (Array.isArray(g.round.teams) ? cleanTeams(g.round.teams, players.length) : null) : this.teamOf) : null;
    const format = formatFits(want, players.length, teamOf) && (want === "match" || !usesTeams(want, players.length) || teamOf) ? want : "stroke";
    if (format !== want && players.length > 1) this.onToast(`${this.unfitWords(want)} - this round is ${FORMAT_NAMES[format].toLowerCase()}`, 3500);
    // The local players take turns among themselves; the others play at the
    // same time on their own bays.
    const order = players.map((_, i) => i).filter((i) => !players[i].remote);
    this.round = { id: net ? g.round.id : newId(), index: start - 2, first: start - 1, clock, players, order, turn: order[0] ?? 0, saved: false, weather, format, teamOf: format === want ? teamOf : null, handicaps: net ? g.round.handicaps : this.settings.handicaps !== false, net: net ? { bay: net.bay } : null, tees: teeColour(net ? g.round.tees : (this.pendingLadder?.tees ?? this.pendingPostSeason?.tees ?? this.settings.tees)), pinDay: net ? (g.round.pinDay ?? null) : (this.pendingLadder?.pin ?? this.pendingPostSeason?.pin ?? (this.settings.pins === "daily" ? dayOf() : null)) };
    this.netGame = g ?? null;
    // Online, the page started again part way through: this bay's players
    // picked back up where the game has them (course/netresume.js).
    this.round.resume = net?.resume ?? null;
    this.resumeScores(this.round.resume);
    // Only this hole (the designer's Play this hole): its index.
    this.round.onlyHole = only && !net ? start - 1 : null;
    // An online round's own rules, the host's (sim/netrules.mjs): each of
    // this bay's players' line reads, and how much harder made-up swings
    // are (app.js). Offline: no limits.
    this.round.rules = roundRules(net ? g.round : null);
    // A season's event (playSeasonEvent), or none.
    this.round.season = net ? null : (this.pendingSeason ?? null);
    this.pendingSeason = null;
    // A match ladder's match (course/matchladder.js playLadderMatch), or none.
    // (Online: the ladder match the host started it as - g.round.ladder,
    // course/ladderonline.js.)
    this.round.ladder = net ? this.netLadderRound(g.round.ladder) : this.ladderRoundFor(this.pendingLadder);
    this.pendingLadder = null;
    // A season by post's event (course/seasonpost.js playPostSeason), or none.
    this.round.postSeason = net ? null : (this.pendingPostSeason ?? null);
    this.pendingPostSeason = null;
    // (Online, the ladder match this bay was setting up stays marked only if
    // this is that match - another game started instead is an ordinary one:
    // sim/netladder.mjs.)
    if (net) this.pendingNetLadder = keepNetLadder(this.pendingNetLadder, { what: "started", ladder: g.round.ladder ?? null });
    // (A Postal match's round picked back up: its holes so far on the card -
    // course/ladderpostal.js.)
    this.resumePostal();
    this.resumePostSeason();
    if (this.round.ladder) this.renderLadder();
    for (const p of players) if (readsLimited(this.round.rules.reads) && !p.remote) p.reads = { left: this.round.rules.reads, at: null };
    // Each player's handicap index before the round: one typed in for them
    // in the panel, else the stats' (none yet, or no stats: none - they
    // play off scratch); swinging with the mouse or a controller, that
    // one's instead (course/madeupplay.js). For the games' strokes and the
    // round card's net.
    for (const p of players) {
      p.log = [];
      // Online: each bay said its players' handicaps when it joined.
      if (net) {
        p.index = Number.isFinite(p.netIndex) ? p.netIndex : null;
        continue;
      }
      const typed = Number(this.settings.hcp?.[p.name]);
      p.realIndex = Number.isFinite(typed) && this.settings.hcp?.[p.name] !== "" && this.settings.hcp?.[p.name] != null ? typed : null;
      p.realFrom = p.realIndex != null ? "typed" : null;
      this.swingStart(p);
      fetch(`/api/stats/player?name=${encodeURIComponent(p.name)}&period=today`)
        .then((res) => (res.ok ? res.json() : null))
        .then((d) => {
          if (!d) return;
          this.madeUpStats(p, d);
          this.render();
        })
        .catch(() => {});
    }
    // (And the first tee's time: the round's clock, a quarter of an hour a
    // hole from there - from the clock, earlier than now if it would end in
    // the dark.)
    this.onToast(`Today's weather - ${conditionsWords(weather, { soft: true })} - teeing off at ${clockWords(clock.start)}`, 4000);
    // Online: the host's rules, said once at the start.
    if (net) setTimeout(() => this.onToast(`Online rules: ${rulesWords(this.round.rules)}`, 5000), 4200);
    // (The recording's scenes go back from the Finish scene: videorec.js.)
    this.onRoundStart?.();
    // (The last online round's Back to the lobby gone.)
    this.renderBetween();
    this.nextHole();
  }

  // Everyone's scores on every hole: the round has started in earnest once
  // anyone has finished a hole.
  get anyScores() {
    return anyScores(this.round);
  }

  // A round that's been played into: a shot hit, or a hole finished.
  get underway() {
    return roundUnderway(this.round);
  }

  // A question asked in the page itself (askbox.js), never the browser's own
  // confirm box: on Windows that can leave the page's lists unable to open and
  // its boxes unable to take typing (the owner: "when I cancelled it, I
  // couldn't seem to then start a new one ... I wanted a live one, not a
  // versus bots" - the ladder's Play list stuck on its first choice). False
  // while another's up, so a second press can't ask, or do, it twice.
  async askFirst(text, opts = {}) {
    if (this.asking) return false;
    this.asking = true;
    try {
      return await ask(text, opts);
    } finally {
      this.asking = false;
    }
  }

  // Before anything that ends the round in progress (a new round, the
  // course designer, a reload): asks first, and keeps the scores so far as
  // abandoning a round always has. Resolves false if the answer was no.
  async leaveRound(question) {
    if (!this.underway) return true;
    const kept = this.anyScores ? " (its scores so far are kept)" : "";
    if (question && !(await this.askFirst(`${question} The round in progress will end${kept}.`, { yes: "Yes", no: "Not now", danger: true }))) return false;
    this.saveRound();
    return true;
  }

  // The menu's Restart the round: the same course from the 1st tee, the
  // same players and choices - the round so far kept, as leaving one always
  // keeps it (sim/roundkeys.mjs canRestartRound). False if not.
  async restartRound() {
    if (!canRestartRound(this.round)) return false;
    // (The designer's one hole: that hole again. A season's event: still
    // that event.)
    const r = this.round;
    const only = r.onlyHole;
    const season = r.season;
    const ladder = r.ladder;
    if (!(await this.leaveRound(only != null ? "Play this hole again from the tee?" : "Restart the round from the 1st tee?"))) return false;
    // (Another round begun while it asked: that one's left be.)
    if (this.round !== r) return false;
    // (A ladder's match: the same match, still open.)
    this.pendingLadder = ladder && !ladder.recorded ? { id: ladder.id, match: ladder.match, players: r.players.map((p) => p.name) } : null;
    this.pendingSeason = season ?? null;
    this.startRound(this.settings.courseId, only != null ? only + 1 : 1, null, { only: only != null });
    return true;
  }

  // Is this the round's last hole - the course's, or the only one played
  // (the designer's Play this hole)?
  lastOfRound(r = this.round) {
    return !!r && (r.onlyHole != null || r.index + 1 >= this.course.holes.length || this.ladderOver(r) || this.postSeasonOver(r));
  }

  // The designer's one hole played: the round's over - not kept as a round
  // (a hole tried out isn't one) - and back to the course designer, on
  // that hole (app.js onBackToDesigner).
  backToDesigner() {
    const r = this.round;
    if (!r || r.finished) return;
    r.finished = true;
    clearTimeout(this.nextTimer);
    this.dropSwitch();
    this.hideHoleCard();
    this.dropPrebuilt();
    this.dropKept();
    this.render();
    this.onBackToDesigner?.(this.settings.courseId, r.onlyHole + 1);
  }

  // The menu's End the round: over now, as the last hole ends it - its
  // card, its scores kept as far as it went (an unfinished card isn't
  // counted for a season or a handicap), and the videos free to play
  // (app.js busy). Asks first once it's been played into (not when an
  // online game's host has stopped it: ask false). False if not.
  async endRound({ ask = true } = {}) {
    const r = this.round;
    if (!canEndRound(r)) return false;
    if (ask && this.underway && !(await this.askFirst(`End the round now? ${this.anyScores ? "Its scores so far are kept, and its card shows." : "No hole's been finished, so nothing's kept."}`, { yes: "End it", no: "Keep playing", danger: true }))) return false;
    // (Over by now, or a new one started, while it asked.)
    if (this.round !== r || !canEndRound(r)) return false;
    // (As the next hole would: a shot in the air, the flyover, a card and
    // the friends' turn all belonged to the hole.)
    this.flying = null;
    this.settingUp = false;
    this.endFlyover({ moveOn: false });
    this.hideHoleCard();
    this.hideOffer();
    this.celebration.clear();
    this.moveOnWhenBack = false;
    clearTimeout(this.turnTimer);
    r.pending = false;
    // (The designer's one hole: back to the designer, nothing kept.)
    if (r.onlyHole != null) this.backToDesigner();
    else this.finishRound({ early: true });
    return true;
  }

  // The course N starts: the one picked in the panel, else the one last
  // played, else the first there is (sim/roundkeys.mjs).
  get nextCourse() {
    return pickNextCourse(this.list, this.panel.querySelector("#course-pick")?.value, this.settings.courseId);
  }

  // ---- Before a round ------------------------------------------------------------

  // With no round going, the first hole of the course N plays is drawn
  // behind a card saying what to do (the owner: "a better temp screen
  // before we hit n to start a new course, currently it's a blank screen
  // (slightly cloudy) and looks a bit odd"). It's idle time, so it's drawn
  // a moment after the page has settled (or the mode is come into), never
  // while a round is going or another mode is on screen, and its shaders
  // are built in the background then (look/warmup.js) - so the round's
  // first hole, when N starts it, is drawn already and costs nothing more.
  // Whether the first hole is drawn ahead while another mode is on screen
  // (the owner, 13 November 2026, to the loads: the round's first hole was
  // the one slow move left - 4.8 s in a report where every other hole was
  // 3 ms - because it was only drawn before the round with the course on
  // screen, and the game opens on the range): on the PC, with the quiet
  // moments' queue to build it a slice at a time. Not on the phone, whose
  // memory holds one scene's worth.
  aheadOfMode() {
    return !PHONE && !!this.idleWork;
  }
  idleSoon(delay = 400) {
    clearTimeout(this.idleTimer);
    this.renderIntro();
    // (And, a round over, the courses' first holes kept ahead again.)
    this.bakeFirstSoon();
    if (this.round || !this.listed) return;
    // (With another mode on screen - the range the game opens on - it's
    // drawn ahead all the same, later and behind everything else in the
    // quiet moments, so the round's first hole is there when the course is
    // come into: aheadOfMode.)
    if (!this.isActive && !this.aheadOfMode()) return;
    if (!this.isActive) delay = Math.max(delay, IDLE_AHEAD.after);
    this.idleTimer = setTimeout(() => {
      const go = () => this.showIdle();
      if (typeof requestIdleCallback === "function") requestIdleCallback(go, { timeout: 2000 });
      else go();
    }, delay);
  }

  async showIdle() {
    if (this.round || (!this.isActive && !this.aheadOfMode()) || this.benching) return;
    const next = this.nextCourse;
    const stimp = this.settings.stimp;
    // (Already drawn, unless the course has been changed in the designer
    // since.)
    if (!next || (this.idle?.id === next.id && this.idle.stimp === stimp && this.idle.updated === next.updated)) return this.renderIntro();
    const ask = (this.idleAsk = {});
    const course = await fetch(`/api/courses/${encodeURIComponent(next.id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(fromOwnServer)
      .catch(() => null);
    // A round started, another course was picked or the mode was left
    // meanwhile: not now.
    if (ask !== this.idleAsk || this.round || (!this.isActive && !this.aheadOfMode()) || !course?.holes?.length) return;
    cleanHoleSpecs(course);
    const first = course.holes[0];
    this.course = course;
    this.idle = { id: next.id, updated: next.updated, stimp, json: courseJson(course), hole: preparedHole(withLinks(course, 0), { calm: calmShapes(course, 0), stimp, stands: standsFor(course, 0), tees: true, grain: this.settings.grain !== false, pinDay: this.pinDayFor(course) }), pinDay: this.pinDayFor(course), t: 0, plan: null, treePath: null, ready: false };
    const idle = this.idle;
    const failed = (err) => {
      // The card shows over the sky (or the course's still), as before.
      console.error("Couldn't draw the first hole before the round:", err);
      if (this.idle === idle) this.idle = null;
      this.renderIntro();
    };
    // Built a piece at a time in the quiet moments (sim/idlework.mjs),
    // behind the course's still (showPhoto), rather than all at once - the
    // page frozen for a second or two as the mode's come into.
    const q = this.idleWork;
    if (q) {
      q.add({
        id: "idle-hole",
        // (Behind the mode on show's own work while it isn't this one.)
        priority: this.isActive ? 2 : IDLE_AHEAD.priority,
        steps: function* () {
          yield* this.buildHoleSteps(true);
          if (this.idle === idle) this.idleBuilt(idle);
        }.bind(this),
        failed,
      });
      return;
    }
    try {
      this.buildHoleScene();
    } catch (err) {
      return failed(err);
    }
    this.idleBuilt(idle);
  }

  // The first hole drawn before a round: the ball teed up, the camera on
  // its crane, the shaders built - shown (the still goes) from its next
  // frame.
  idleBuilt(idle) {
    // The ball teed up, as the round will start (from the panel's tees).
    this.putBall(teeSpot(this.idle.hole.layout.teeSpots, this.settings.tees).at);
    this.ballShadow.update(this.ball.position, this.worldSurface, this.ballDraw ?? REAL_BALL_R);
    // The camera on the look down the hole's crane, slowly, there and back
    // (sim/flyover.mjs idleCraneAt); a hole with no line of play, from
    // behind the tee.
    const L = this.idle.hole.layout;
    const path = (L.path ?? []).map(([x, z]) => [z, -x]);
    if (path.length > 1) {
      const plan = lookDownPlan(path, (x, z) => this.worldHeight(x, z), this.pinWorld.toArray(), IDLE_CRANE);
      this.idle.plan = plan;
      // Where it goes, for the trees drawn in full (look/trees.js): chosen
      // once, as it never cuts.
      this.idle.treePath = [];
      for (let t = 0; t <= plan.total; t += 1) {
        const at = idleCraneAt(plan, t);
        this.idle.treePath.push([at.cam[0], at.cam[2]], [at.look[0], at.look[2]]);
      }
    } else {
      toWorld(-28, this.heightAt(-28, 0) + 13, 0, this.camera.position);
      this.camera.lookAt(this.pinWorld);
    }
    this.stepIdle(0);
    // Shown once its shaders are built, in the background where the card
    // can, and each drawn once behind the still - one new shader a step
    // (look/gpuprep.js drawAllSteps), the warmers' with them (app.js: the
    // tracers', a celebration's, the green's, the grass round the ball's,
    // in this scene's light) - so the round's first frames, first strike
    // and first green build and draw nothing new. Drawn sooner, the card
    // was made to finish every one of them there and then, holding the
    // page (and the controls window with it) - on Ultra about 20 seconds
    // before the first flyover (the owner: "the whole system froze"). The
    // still stays up meanwhile (pictureHidden). Not waited for for ever.
    idle.warming = true;
    idle.built = true;
    const shown = () => {
      if (this.idle !== idle || idle.ready) return;
      idle.warming = false;
      idle.ready = true;
      this.renderIntro();
    };
    let built = false;
    const warmed = () => (built = true);
    const warming = warmUp(this.renderer, this.scene, this.camera, this.warmers ?? null);
    warming.then(warmed, warmed);
    const q = this.idleWork;
    if (q) {
      q.add({
        id: "idle-warm",
        priority: 2,
        steps: function* () {
          // (By the clock, not a count of frames: taken over behind the
          // loading card, each wait is a few milliseconds - SHADER_WAIT.)
          const until = performance.now() + SHADER_WAIT;
          while (!built && !hurried() && performance.now() < until) yield WAIT;
          yield* drawAllSteps(this.renderer, this.scene, this.camera, this.scene, { warmers: this.warmers ?? [] });
        }.bind(this),
        done: shown,
        failed: shown,
      });
    } else warming.then(shown, shown);
    setTimeout(shown, IDLE_WARM_LIMIT);
  }

  // A frame of the camera before a round (or the speed test's fly-through,
  // on its own clock: real seconds, however slow the frames).
  stepIdle(dt) {
    const idle = this.idle;
    idle.t = idle.clock ? idle.clock() : idle.t + dt;
    if (idle.plan) {
      const at = idle.bench ? speedTestAt(idle.plan, idle.t) : idleCraneAt(idle.plan, idle.t);
      this.camera.position.set(...at.cam);
      this.keepAboveGround(this.camera.position, 3);
      this.look.set(...at.look);
      clearOfTrees(this.cameraTrees, this.camera.position, this.look);
      this.camera.lookAt(this.look);
    }
    this.camera.updateMatrixWorld();
  }

  // Everything else stopped for the speed test.
  benchStart() {
    clearTimeout(this.idleTimer);
    this.idleWork?.cancel("bake-first");
    this.idleWork?.cancel("idle-hole");
    this.idleWork?.cancel("idle-warm");
    this.idleAsk = {};
    this.benching = true;
  }
  // A speed-test hole as the hole before a round (no round, no wind):
  // `idle`, not drawn while it's built, nor till its shaders are.
  // (Its dunes levelled under the other holes in its crop, as a round's
  // are - calmShapes: without it the links hole's dunes stood up to 2 m
  // through the other holes' fairways as it flew over them - the owner, 12
  // November 2026: "on the speed test we had some odd hole placements".)
  benchIdle(course, index, clock) {
    const h = course.holes[index];
    const stimp = this.settings.stimp;
    return { id: "speed-test", bench: true, updated: null, stimp, json: "", hole: preparedHole(withLinks(course, index), { calm: calmShapes(course, index), stimp, stands: standsFor(course, index), tees: true }), t: 0, plan: null, treePath: null, clock, warming: true };
  }
  // A speed-test hole built on show, a slice at a time, the page let go
  // between them, its heavy parts on the other cores as a round's holes
  // are (preparedHole: the recipe the other cores make it again from -
  // without it, the tufts and the ground were worked out here, 11 s of a
  // links hole's 15 on the test machine) (the owner: "long pauses and even
  // freezes where the webcams would pause"): built in one go it held the
  // page - and the controls window, which shares it - for seconds at each
  // hole.
  async buildSpeedTest(course, index, clock) {
    this.course = course;
    this.idle = this.benchIdle(course, index, clock);
    await runSliced(this.buildHoleSteps(true));
  }
  // The speed test's holes, every one built before the run starts (the
  // owner: "for the speed tests and demo runs, can we ensure we pre build
  // the necessary holes and area for each before initiating the run?"):
  // each out of sight as a round's next hole is (prebuildSteps) - in a
  // state of its own, kept on disk for next time (look/bake.js), its
  // shaders built and its shapes sent to the graphics card - so moving on
  // to the next is a swap (showSpeedTest), with nothing built while the
  // test runs. list: [{ course, index }]; onHole(i) as each is begun.
  // Resolves to each one built (null where it couldn't be: built on show).
  async prepareSpeedTest(list, clock, onHole = () => {}) {
    this.benchStart();
    const out = [];
    for (const [i, { course, index }] of list.entries()) {
      // (Its card painted before the hole's made ready, a second or two.)
      await onHole(i);
      const idle = this.benchIdle(course, index, clock);
      const pre = { key: `speed-test:${i}`, course, index, hole: idle.hole, state: new Map([["world", new THREE.Group()], ["idle", idle], ["course", course]]), after: [], hidden: null };
      try {
        pre.longest = await runSliced(this.prebuildSteps(pre), LOADING_SLICE_MS);
        out.push(pre);
      } catch (err) {
        console.error("Couldn't build a speed-test hole ahead:", err);
        this.dropPre(pre);
        out.push(null);
      }
    }
    return out;
  }

  // A hole of a course to be built out of sight (bakeFirsts):
  // made ready as a round's is (prepareFor).
  aheadPre(course, index) {
    const stimp = this.settings.stimp;
    const hole = preparedHole(withLinks(course, index), { calm: calmShapes(course, index), stimp, stands: standsFor(course, index), tees: true, grain: this.settings.grain !== false, pinDay: this.pinDayFor(course) });
    const idle = { id: "bake", bench: true, updated: null, stimp, json: "", hole, t: 0, plan: null, treePath: null, clock: () => 0, warming: true };
    return { key: `bake:${course.id ?? course.name}:${index}`, course, index, hole, state: new Map([["world", new THREE.Group()], ["idle", idle], ["course", course]]), after: [], hidden: null };
  }

  *aheadSteps(pre) {
    const it = this.inPrebuild(pre, () => this.buildHoleSteps(true));
    for (;;) {
      const r = this.inPrebuild(pre, () => it.next());
      if (r.done) return;
      yield r.value === WAIT ? WAIT : r.value ? `building ${r.value}` : "building";
    }
  }

  // ---- Every course's first hole kept ahead ---------------------------------------
  //
  // The first hole of every course, kept on disk (look/bake.js) before it's
  // asked for (the owner: "this should be saved for future returns to the
  // selection screen and 'instant' loading the flyover. I'd also like some
  // if not all of the first hole baked and permanently saved"): built out
  // of sight in the quiet moments (sim/idlework.mjs, below everything else
  // there), one course at a time, whichever mode is on screen - never
  // while a round's going or the speed test runs. Only those not kept
  // already, so it's work after a new version of the game (which keeps
  // nothing of the last one's), a new or changed course, or another
  // graphics setting - and the server keeps first holes when it trims the
  // folder (server/bakes.mjs). The course the selection screen shows comes
  // first. Not on the phone: six courses' holes built in the background
  // there is minutes of its cores and battery while it's at the range, and
  // its courses start behind their films - each hole's kept as it's
  // played (sim/pocketbakes.mjs).
  bakeFirstSoon(delay = BAKE_FIRST_DELAY) {
    const q = this.idleWork;
    if (PHONE || !q || !this.listed || this.round || this.benching || q.has("bake-first")) return;
    q.add({
      id: "bake-first",
      priority: -1,
      after: performance.now() + delay,
      steps: () => this.bakeFirstSteps(),
      failed: (err) => console.warn("Couldn't keep the courses' first holes ahead:", err?.message ?? err),
    });
  }

  *bakeFirstSteps() {
    const waitFor = function* (promise) {
      let out;
      let done = false;
      promise.then((v) => (out = v), () => {}).finally(() => (done = true));
      while (!done) yield WAIT;
      return out;
    };
    const names = yield* waitFor(keptHoles());
    if (!names) return;
    const first = this.nextCourse?.id;
    const list = [...(this.list ?? [])].sort((a, b) => (b.id === first) - (a.id === first));
    for (const item of list) {
      if (this.round || this.benching) return;
      // (Known kept from before - by the course as it was then - without
      // making the hole ready to find its name.)
      const sig = `${item.id}@${item.updated ?? ""}@${this.settings.grain !== false}`;
      const known = firstKept.get(sig);
      if (known && names.has(known)) continue;
      const course = yield* waitFor(
        fetch(`/api/courses/${encodeURIComponent(item.id)}`)
          .then((r) => (r.ok ? r.json() : null))
          .then(fromOwnServer)
          .catch(() => null),
      );
      if (!course?.holes?.length || this.round || this.benching) continue;
      // (Making the hole ready holds the page a moment: only in a frame
      // that can take it, and a step of its own - it was put down to the
      // build's first step, "clearing the last hole", up to 1.5 s.)
      yield HEAVY;
      const pre = this.aheadPre(course, 0);
      try {
        yield "making the hole ready";
        if (this.round || this.benching) return;
        const key = this.inPrebuild(pre, () => {
          this.shore = this.shoreOf(pre.hole.layout);
          return this.bakeKeyOf(pre.hole.layout);
        });
        if (!key) continue;
        firstKept.set(sig, key);
        if (names.has(key)) continue;
        for (const step of this.aheadSteps(pre)) {
          if (this.round || this.benching) return;
          yield step;
        }
        names.add(key);
      } finally {
        this.dropPre(pre);
      }
    }
  }

  // The speed test's fly-through (speedtest.js, sim/speedtest.mjs): hole
  // `index` of a course built in the page, drawn as before a round, the sky
  // clear and the air still (no round, no wind), the camera on the test's
  // own path by `clock` (seconds). Resolves once its shaders are ready.
  // pre: the hole built already (prepareSpeedTest), swapped in.
  async showSpeedTest(course, index, clock, pre = null) {
    this.benchStart();
    if (pre && !pre.dropped) {
      this.swapIn(pre);
      this.idle.clock = clock;
    } else await this.buildSpeedTest(course, index, clock);
    // (The usual afternoon sun: the same test every time.)
    setSun(USUAL_SUN);
    setSky(this.scene, "clear", 1);
    this.putBall([0, 0]);
    const L = this.idle.hole.layout;
    const path = L.path.map(([x, z]) => [z, -x]);
    this.idle.plan = speedTestPlan(path, (x, z) => this.worldHeight(x, z), this.pinWorld.toArray());
    this.idle.treePath = speedTestTreePath(this.idle.plan);
    this.stepIdle(0);
    this.renderIntro();
    // Not drawn till its shaders are built (idleBuilt says why): the pause
    // between the test's holes was partly the card finishing them all in
    // the first frame.
    const idle = this.idle;
    const done = () => {
      idle.warming = false;
    };
    return warmUp(this.renderer, this.scene, this.camera).then(done, done);
  }

  // As a round's hole is set up (nextHole): the hole drawn before the round,
  // if it's this one - the first hole of the same course, at the same green
  // speed - else null. Either way the round has the picture from now on.
  takeIdle(index) {
    const idle = this.idle;
    this.idle = null;
    this.idleAsk = null;
    clearTimeout(this.idleTimer);
    // (One still being built is stopped: the round builds its own.)
    this.idleWork?.cancel("idle-hole");
    if (!idle || !idle.built || index !== 0 || idle.stimp !== this.settings.stimp || idle.json !== courseJson(this.course) || JSON.stringify(idle.pinDay) !== JSON.stringify(this.pinDayFor())) {
      this.idleWork?.cancel("idle-warm");
      return null;
    }
    // (Built but its shaders not all drawn yet - N pressed early: the rest
    // handed over (idleWarmLeft), for nextHole to draw a slice at a time
    // behind the "Loading hole 1..." card. Drawn all at once, as they were,
    // each new one holding the page as the card built it - seconds on
    // Ultra, the controls window with it.)
    this.idleWarmLeft = !idle.ready && this.idleWork?.has("idle-warm") ? this.idleWork.take("idle-warm") : null;
    return idle.hole;
  }

  // ---- The course's still, before its first hole is drawn -----------------------------

  // Shows the still for `next` (a course in the list) behind the card, or
  // takes it away: with no course, or once that course's first hole is on
  // the screen (idle.shown).
  showPhoto(next) {
    const el = this.photoEl;
    const drawn = next && this.idle?.id === next.id && this.idle.shown;
    // (In the phone app, a film of the hole in its place: course/films.js.)
    const filmed = this.showFilm(next);
    if (!next || drawn || filmed) {
      el.classList.add("gone");
      return;
    }
    const p = photoFor(loadSetting("coursePhotos", null), next.id, next.updated ?? null, LOOK);
    const want = p ? `url("${p.data}")` : "";
    if (el.dataset.of !== next.id || el.style.backgroundImage !== want) {
      el.style.backgroundImage = want;
      el.dataset.of = next.id;
    }
    el.classList.toggle("painted", !p);
    el.classList.remove("gone");
  }

  // A frame of the picture has just been drawn (app.js, the canvas still
  // holding it): the first of the course's hole before a round takes the
  // still away - and, a moment into its flight down the hole, is kept as
  // the course's still for next time if there's none of it as it is now.
  pictureDrawn(canvas) {
    const idle = this.idle;
    if (!idle || this.round || idle.bench) return;
    if (!idle.ready) return;
    if (!idle.shown) {
      idle.shown = true;
      idle.photoAt = performance.now() + PHOTOS.after;
      this.renderIntro();
      return;
    }
    if (idle.photoTaken || performance.now() < idle.photoAt) return;
    idle.photoTaken = true;
    const list = loadSetting("coursePhotos", null);
    if (!wantPhoto(list, idle.id, idle.updated ?? null, LOOK)) return;
    try {
      // (The screen's part: the canvas can be drawn wider for a centred
      // recording - widepicture.js.)
      const { sx, sw } = screenPart(canvas);
      const w = PHOTOS.width;
      const h = Math.round((w * canvas.height) / Math.max(1, sw));
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d").drawImage(canvas, sx, 0, sw, canvas.height, 0, 0, w, h);
      const data = c.toDataURL("image/jpeg", PHOTOS.quality);
      saveSetting("coursePhotos", keepPhoto(list, { id: idle.id, updated: idle.updated ?? null, look: LOOK, at: Date.now(), data }));
    } catch {
      // No still this time: the browser's storage full, or the canvas
      // unreadable.
    }
  }

  // ---- The next hole, built ahead ------------------------------------------------------
  //
  // While a hole is played the next one is built in the picture's quiet
  // moments - stood over the ball, between shots, nothing moving - a step
  // at a time (sim/idlework.mjs, app.js's frame loop), then its shaders
  // built and its shapes and pictures sent to the graphics card, out of
  // sight (look/gpuprep.js). Moving on then swaps it in rather than
  // building it then and there (nextHole). Built as the hole would be at
  // that moment; anything that would change it since (the green speed, the
  // tees, the course edited) and it's built again the usual way.

  // A hole of this course made ready to play (sim/courseplay.mjs).
  prepareFor(i) {
    return preparedHole(withLinks(this.course, i), { calm: calmShapes(this.course, i), stimp: this.settings.stimp, stands: standsFor(this.course, i), tees: true, grain: this.settings.grain !== false, pinDay: this.pinDayFor() });
  }

  // Where the cups are cut (sim/pinday.mjs): with Pin positions set to
  // change every day, the round's day (online, the host's) - before a
  // round, today - and the course; else null, the holes' own pins.
  pinDayFor(course = this.course) {
    const day = this.round ? this.round.pinDay : this.settings.pins === "daily" ? dayOf() : null;
    return day ? { day, key: seedName(course) } : null;
  }

  // What a hole built ahead must still match to be used.
  prebuildKey(i) {
    return JSON.stringify([i, this.settings.stimp, this.settings.grain !== false, this.round?.tees ?? this.settings.tees, this.challenge ?? null, this.pinDayFor()?.day ?? null]);
  }

  // Starts building the round's next hole (if there's a queue to build it
  // in, and it isn't built or being built already) - not for the first few
  // seconds of a hole, while it's being looked down and the first shot set
  // up.
  prebuildNext(wait = PREBUILD_WAIT) {
    const r = this.round;
    const q = this.idleWork;
    if (!q || !r || r.finished || !this.course) return;
    const i = r.index + 1;
    // (None after the designer's one hole.)
    if (i >= this.course.holes.length || r.onlyHole != null) return;
    const key = this.prebuildKey(i);
    const same = (p) => p && p.key === key && p.course === this.course;
    if (same(this.prebuilt) || (same(this.prebuilding) && q.has("next-hole"))) return;
    this.dropPrebuilt();
    const pre = { key, course: this.course, index: i, hole: null, state: new Map([["world", new THREE.Group()]]), after: [], hidden: null };
    this.prebuilding = pre;
    q.add({
      id: "next-hole",
      after: q.now() + wait,
      steps: () => this.prebuildSteps(pre),
      done: () => {
        if (this.prebuilding !== pre) return this.dropPre(pre);
        this.prebuilding = null;
        this.prebuilt = pre;
      },
      failed: (err) => {
        console.error("Couldn't build the next hole ahead:", err);
        if (this.prebuilding === pre) this.prebuilding = null;
        this.dropPre(pre);
      },
    });
  }

  // Its steps: the hole made ready, drawn (buildHoleSteps, in its own
  // state), its shaders built and pictures sent, then its shapes a few at
  // a time.
  *prebuildSteps(pre) {
    pre.hole ??= this.prepareFor(pre.index);
    yield "made ready";
    // (Each step named - what it built - for a report's long frames:
    // sim/idlework.mjs slowSteps. A wait on another core passed on as one.)
    const steps = this.inPrebuild(pre, () => this.buildHoleSteps(true));
    for (;;) {
      const r = this.inPrebuild(pre, () => steps.next());
      if (r.done) break;
      yield r.value === WAIT ? WAIT : r.value ? `building ${r.value}` : "building";
    }
    const world = pre.state.get("world");
    pre.hidden = hideInScene(this.scene, world);
    yield "built: put out of sight";
    // (Its shapes drawn only once the card has built their shaders in the
    // background, where it can: drawn sooner, it's made to build them
    // there and then. Not waited for for ever: SHADER_WAIT.)
    let built = false;
    warmUp(this.renderer, this.scene, this.camera, world).then(() => (built = true));
    yield "its shaders asked for, its pictures sent to the card";
    const until = performance.now() + SHADER_WAIT;
    while (!built && !hurried() && performance.now() < until) yield WAIT;
    // (Finished at once - moving on before it was done - its shapes are
    // left to be sent as they're drawn, its shaders building in the
    // background meanwhile: sending every one in that one go, every shader
    // finished with them, held the page for seconds on top of the build.)
    if (hurried()) return;
    yield* sendSteps(this.renderer, this.scene, this.camera, pre.hidden);
  }

  // Hole `index` built now (not in the quiet moments), a slice at a time
  // with the page let go between, as a hole is built ahead - its own state,
  // swapped in once it's ready (swapIn) - rather than all at once, the
  // picture and the controls window frozen for it. hole: its prepared hole
  // if there is one. Resolves to the built hole (pre), for swapIn or
  // dropPre.
  async buildAhead(index, hole = null, { slice = SLICE_MS } = {}) {
    const pre = { key: this.prebuildKey(index), course: this.course, index, hole, state: new Map([["world", new THREE.Group()]]), after: [], hidden: null };
    try {
      pre.longest = await runSliced(this.prebuildSteps(pre), slice);
    } catch (err) {
      this.dropPre(pre);
      throw err;
    }
    return pre;
  }

  // Runs fn as if the hole built ahead were the one on show: its state
  // (everything the drawing keeps on `this`) put in place, the round at
  // its hole - then everything put back as it was, what fn changed kept as
  // the built hole's. One step at a time, never with anything else between.
  inPrebuild(pre, fn) {
    // (No round for the speed test's holes: their hole is their own idle
    // one, in their state - prepareSpeedTest.)
    const r = this.round;
    const was = r ? { index: r.index, hole: r.hole } : null;
    const before = new Map(Object.entries(this));
    for (const [k, v] of pre.state) this[k] = v;
    if (r) {
      r.index = pre.index;
      r.hole = pre.hole;
    }
    this.prebuild = pre;
    try {
      return fn();
    } finally {
      this.prebuild = null;
      if (r) {
        r.index = was.index;
        r.hole = was.hole;
      }
      for (const k of Object.keys(this)) {
        if (k === "prebuild") continue;
        const old = before.get(k);
        if (this[k] === old && !pre.state.has(k)) continue;
        pre.state.set(k, this[k]);
        if (before.has(k)) this[k] = old;
        else delete this[k];
      }
    }
  }

  // The hole built ahead for hole i, if it's there and still right
  // ({ pre }), or one still being built - its job taken out of the queue
  // (sim/idlework.mjs take) for nextHole to run on a slice at a time
  // ({ pre, job }) - or null, anything stale dropped.
  takePrebuilt(i) {
    const key = this.prebuildKey(i);
    const same = (p) => p && p.index === i && p.key === key && p.course === this.course;
    if (same(this.prebuilt)) {
      const pre = this.prebuilt;
      this.prebuilt = null;
      return { pre };
    }
    if (same(this.prebuilding) && this.idleWork?.has("next-hole")) {
      // (The switch's own from here: a change of settings meanwhile
      // doesn't throw it away under its feet.)
      const pre = this.prebuilding;
      this.prebuilding = null;
      return { pre, job: this.idleWork.take("next-hole") };
    }
    this.dropPrebuilt();
    return null;
  }

  // Fields a built hole owns (course/flyover.js parkPlaying): parked with
  // its group and put back when that hole is shown again, so the ball, the
  // flag and the country picture are the ones in that group, not the hole
  // that replaced it - and what it did to the scene as a whole
  // (sceneSteps), done again as it comes back.
  static KEPT_FIELDS = ["world", "shade", "splat", "countryPicture", "countryMats", "waterLevels", "shore", "farSheet", "farGround", "pathGround", "cupMark", "flag", "pinWorld", "backdrop", "cameraTrees", "nearKinds", "ball", "markers", "aimGroup", "reliefGroup", "idealGroup", "marks", "grid", "nest", "longGrass", "holeGrass", "wear", "dressing", "dunes", "links", "linksRelief", "crop", "neighbours", "ballDraw", "sceneSteps", "cutField", "mownEdge"];

  // The hole built ahead shown: the last hole's picture parked (if it
  // wasn't already), the stand-in let go, the new one's state in its
  // place, and what it does to the scene as a whole.
  swapIn(pre) {
    const stand = { world: this.world, shade: this.shade, splat: this.splat, countryPicture: this.countryPicture };
    this.scene.remove(this.world);
    this.disposeWorld(stand);
    for (const [k, v] of pre.state) this[k] = v;
    if (pre.hidden) showHidden(pre.hidden);
    if (!this.world.parent) this.scene.add(this.world);
    // (The tracers are kept from hole to hole, in the hole's group.)
    if (this.tracers) this.tracers.parent = this.world;
    for (const fn of pre.after) fn();
  }

  // Throws away whatever's built ahead (the round over, the settings or
  // the course changed).
  dropPrebuilt() {
    this.idleWork?.cancel("next-hole");
    this.dropPre(this.prebuilding);
    this.dropPre(this.prebuilt);
    this.prebuilding = null;
    this.prebuilt = null;
  }
  dropPre(pre) {
    if (!pre || pre.dropped) return;
    pre.dropped = true;
    dropHidden(this.scene, pre.hidden);
    const of = Object.fromEntries(pre.state);
    if (of.world) this.disposeWorld(of);
  }

  // The card over the picture before a round: the course N plays, who's
  // playing, the keys (sim/roundkeys.mjs introCard). Gone as a round
  // starts; shown again only with no round at all (after one, its own
  // celebration and card say what N does).
  renderIntro() {
    const el = this.introEl;
    const show = this.isActive && this.listed && !this.round && !this.benching;
    el.hidden = !show;
    this.showPhoto(show ? this.nextCourse : null);
    // (Come up: on the phone the side panel opens with it - app.js
    // startInPanel.)
    const came = show && !this.introUp;
    this.introUp = show;
    if (came) this.onIntroShown?.();
    if (!show) return;
    const next = this.nextCourse;
    const ctx = this.introContext?.() ?? {};
    const spec = next && this.idle?.id === next.id ? this.course?.holes?.[0]?.spec : null;
    // From the panel's tees: the first hole's yards and the course's.
    const first = spec ? { ...spec, yards: this.yardsOf(0) } : null;
    const yards = spec ? this.course.holes.reduce((a, _, i) => a + (this.yardsOf(i) ?? 0), 0) : null;
    const card = introCard({ next, list: this.list, players: this.players, format: FORMAT_NAMES[this.settings.format], first, where: ctx.where, voice: ctx.voice, wake: ctx.wake, tees: TEE_NAMES[this.settings.tees].toLowerCase(), yards, keys: this.keysShown(), levels: ctx.levels });
    const html = `<div class="ci-card${card.key ? "" : " no-key"}">
        ${card.key ? `<div class="ci-key">${esc(card.key)}</div>` : ""}
        <div class="ci-eyebrow">${card.button ? "Next round" : "Course"}</div>
        <h2>${esc(card.title)}</h2>
        ${card.lines.map((l, i) => `<p class="${i === 0 ? "ci-facts" : "ci-line"}">${esc(l)}</p>`).join("")}
        ${card.levels ? `<p class="ci-levels">${esc(card.levels.line)} <button data-act="levels">${esc(card.levels.button)}</button></p>` : ""}
        ${card.button ? `<button class="primary" data-act="start">${esc(card.button)}</button>` : ""}
        ${card.others.length ? `<p class="ci-others">Also here: ${card.others.map(esc).join(" · ")}</p>` : ""}
      </div>
      <p class="ci-hint">${esc(card.hint)}</p>`;
    if (html !== this.introHtml) {
      el.innerHTML = html;
      this.introHtml = html;
    }
  }

  nextHole() {
    const r = this.round;
    if (!r || r.finished || this.switching?.round === r) return;
    // Online: on together, once every bay's ready - till then the card
    // stays up saying who for (course/netflights.js holdForOthers).
    if (this.holdForOthers()) return;
    // The last hole's flyover goes; the hole itself is kept to replay (J)
    // until the next shot - its strokes, to be drawn again (lastHole).
    this.endFlyover({ moveOn: false });
    this.hideHoleCard();
    const offered = this.flyoverOffer;
    this.keepLastHole(offered?.slot ?? null);
    // (And kept for the round's highlights: keepForReel.)
    this.keepForReel();
    this.hideOffer();
    this.celebration.clear();
    this.moveOnWhenBack = false;
    clearTimeout(this.turnTimer);
    r.pending = false;
    // After the last hole the round is over; the index stays on that hole,
    // so everything that shows the hole still has one. (The designer's one
    // hole played: back to the designer. A ladder's match: over once it's
    // decided or its holes are played.)
    // (A Postal match's round: each hole kept on this PC as it's finished -
    // course/ladderpostal.js.)
    if (r.ladder) this.keepPostal(r);
    // (A season by post's event: the same - course/seasonpost.js.)
    if (r.postSeason) this.keepPostSeason(r);
    if (r.onlyHole != null && r.index >= r.onlyHole) return this.backToDesigner();
    if (r.index + 1 >= this.course.holes.length || this.ladderOver(r) || this.postSeasonOver(r)) return this.finishRound();
    // (The ladder section's line: the match as it stands.)
    if (r.ladder) this.renderLadder();
    // The honour: the lowest score on the hole just played tees off first.
    if (r.index >= 0) r.order = honourOrder(r.order, r.players.map((p) => p.scores[r.index]));
    const index = r.index + 1;
    // The first hole already drawn behind the card before the round, the
    // same course at the same green speed: played as it is, not drawn again
    // (so N starts the round sooner than it did).
    const ready = this.takeIdle(index);
    // (Its shaders not all drawn yet: the rest, drawn behind the card.)
    const warm = ready ? this.idleWarmLeft : null;
    this.idleWarmLeft = null;
    // Or built ahead while the last hole was played (prebuildNext).
    // (How far it had got, and how long moving on took, for a report:
    // switchLog.)
    const switchFrom = performance.now();
    const ahead = ready ? "shown" : this.prebuilt?.index === index ? "built" : this.prebuilding?.index === index ? "part" : "none";
    const taken = ready ? null : this.takePrebuilt(index);
    if ((ready && !warm) || (taken && !taken.job)) return this.showHole(index, { ready, pre: taken?.pre ?? null, ahead, switchFrom });
    // Not built ahead, or only part: built now a slice at a time with the
    // page let go between (the job's own steps run on, or buildAhead),
    // behind a card saying so, the last hole's picture staying up - rather
    // than all at once, which held the page (and the controls window with
    // it) for seconds, on Ultra tens of them (a report: 46 s, "a window
    // stopped responding"). A shot hit meanwhile is played once it's up
    // (onShot).
    const sw = (this.switching = { index, round: r });
    this.showHoleLoading(index);
    const building = warm
      ? runSliced(warm.it, LOADING_SLICE_MS).then((longest) => ({ warmed: true, longest }))
      : taken?.job
      ? runSliced(taken.job.it, LOADING_SLICE_MS).then((longest) => {
          if (taken.pre.dropped) throw new Error("dropped while building");
          taken.pre.longest = longest;
          return taken.pre;
        })
      : this.buildAhead(index, null, { slice: LOADING_SLICE_MS });
    building
      .then((pre) => {
        // (The first hole drawn behind the still, its shaders finished.)
        if (pre?.warmed) {
          if (this.switching !== sw || this.round !== r || r.finished) return;
          return this.showHole(index, { ready, ahead, switchFrom, longest: pre.longest });
        }
        if (this.switching !== sw || this.round !== r || r.finished || pre?.dropped) return this.dropPre(pre);
        this.showHole(index, { pre, ahead, switchFrom });
      })
      .catch((err) => {
        console.error("Couldn't build the next hole a slice at a time:", err);
        if (this.switching !== sw || this.round !== r || r.finished) return;
        // Built all at once, as before (the first hole as it is, its
        // shaders drawn as they come).
        this.showHole(index, warm ? { ready, ahead, switchFrom } : { ahead: "none", switchFrom });
      })
      .finally(() => {
        if (this.switching !== sw) return;
        this.switching = null;
        this.showHoleLoading(null);
        const shot = this.pendingShot;
        this.pendingShot = null;
        if (shot && this.round === r && !r.finished) this.onShot(shot);
      });
  }

  // A move to the next hole still being built, given up (the round
  // finished, back to the designer, another round started): its loading
  // card down, and a shot held for it forgotten.
  dropSwitch() {
    if (!this.switching && !this.pendingShot) return;
    this.switching = null;
    this.pendingShot = null;
    this.showHoleLoading(null);
  }

  // The round on to hole `index`, built: the one drawn before the round
  // (ready: its prepared hole), one built ahead or just built (pre: swapped
  // in), or neither (built all at once now). ahead and switchFrom: for the
  // report's log of the move (switchLog).
  showHole(index, { ready = null, pre = null, ahead = "none", switchFrom = performance.now(), longest = pre?.longest } = {}) {
    const r = this.round;
    if (pre || !ready) this.parkPlaying();
    r.index = index;
    // The sun where the round's clock has got to (sunNow): a quarter of an
    // hour on from the last hole's, its sky's reflection baked again.
    useSun(this.scene, this.sunNow());
    // Some of its trees of no given kind grow as the newer kinds, in stands
    // from the hole's own seed (sim/treehits.mjs treeStands).
    r.hole = ready ?? pre?.hole ?? this.prepareFor(index);
    // Everyone tees off from the round's tees (sim/tees.mjs).
    const tee = this.teeAt();
    for (const p of r.players) {
      p.strokes = 0;
      p.ball = [...tee];
      p.lie = "tee";
      p.plug = null;
      p.lieAfter = "";
      p.shots = [[...tee]];
      p.done = false;
      p.puttFeedback = null;
      // Where the last stroke was played from, and that stroke's id in the
      // stats: for an unplayable ball (back where it was played from, and
      // the penalty kept with the shot).
      p.from = null;
      p.recordedId = null;
    }
    this.hideRelief();
    this.fromBall = false;
    // A scramble: each team's one ball (sim/teams.mjs).
    r.scr = r.format === "scramble" && r.teamOf ? teamsOf(r.teamOf).map((t) => newScramble(t.members, tee)) : null;
    r.pick = null;
    // Online: this bay's shots and picks not yet back from the host.
    r.scrLocal = [];
    r.scrWait = false;
    this.hidePick();
    r.turn = this.whoseTurn();
    r.done = false;
    r.waiting = false;
    r.message = "";
    this.clearRemoteFlights();
    if (pre) this.swapIn(pre);
    else if (!ready) this.buildHoleScene();
    // Each move to a hole this round: was it built ahead ("built"), part
    // built ("part": finished then), the one before the round ("shown"),
    // or not at all ("none": built then, every shader with it), and how
    // long it took - for the report (app.js graphicsFacts).
    // (Built behind the card: its longest single step too - the page held
    // that long at most.)
    // (And whether its parts were kept from the last time it was built:
    // "all", "part" or "none" - look/bake.js; nothing if it couldn't be.)
    const note = this.bakeNote;
    this.bakeNote = null;
    const kept = note ? (note.misses ? (note.hits ? "part" : "none") : "all") : null;
    this.switchLog = [...(this.switchLog ?? []).slice(-17), { hole: r.index + 1, ahead, ms: Math.round(performance.now() - switchFrom), ...(Number.isFinite(longest) ? { longest: Math.round(longest) } : {}), ...(kept ? { kept } : {}) }];
    // Online: where the other bays' players have got to on this hole
    // already (they may be ahead of the picture here), their tracers too.
    if (r.net) this.applyNet(this.netGame, { quiet: true });
    // (And this bay's own, picked back up after the page started again.)
    if (r.resume) this.resumeOwn();
    // The line looked along a section at a time, on this hole's green (the
    // Challenges borrow buildHoleScene, and have none).
    this.sections.attach(this.world);
    this.newPosition(true);
    // Its shaders built now, while the hole's coming up, rather than as
    // each is first drawn - at the first shot (look/warmup.js).
    if (!ready) warmUp(this.renderer, this.scene, this.camera);
    this.startLookDown();
    // The card to replay the hole just finished, until the next shot.
    if (this.lastHole) this.showOffer();
    const s = this.course.holes[r.index].spec;
    // With friends it says who has the honour; the yards are in the note.
    // (And the time on the round's clock.)
    const at = clockWords(r.clock.start + (r.index - r.first) * HOLE_HOURS);
    if (this.multi) this.onToast(`Hole ${s.number} - par ${s.par} - ${this.me.name} first - ${at}`, 2600);
    else this.onToast(`Hole ${s.number} - par ${s.par} - ${this.yardsOf(r.index)} yds - ${at}`, 2200);
    // And the one after it built while this one's played, and the ground
    // round this green read for the cart ride after it (course/buggy.js).
    this.prebuildNext();
    this.prepareRide();
  }

  // The card over the picture while the next hole is built (nextHole):
  // "Loading hole 4..." with a turning circle (the speed test's own, which
  // turns on the graphics card's side: speedtest.js showLoading) - or null
  // to take it away.
  showHoleLoading(index) {
    this.holeLoading?.remove();
    this.holeLoading = null;
    if (index == null || !this.view) return;
    const el = document.createElement("div");
    el.className = "speed-loading hole-loading";
    const spec = this.course?.holes?.[index]?.spec;
    const n = spec?.number ?? index + 1;
    const yards = spec ? this.yardsOf(index) : null;
    el.innerHTML = `<span class="speed-spinner" aria-hidden="true"></span><span>Loading hole ${esc(String(n))}${spec ? `, par ${esc(spec.par)}, ${esc(yards)} yds` : ""}...</span>`;
    this.view.appendChild(el);
    this.holeLoading = el;
  }

  // Where the round's tees are on the hole being played (sim/tees.mjs),
  // and a hole's yards from them (its card's from the yellow).
  teeAt() {
    const r = this.round;
    return teeSpot(r?.hole?.layout?.teeSpots, r?.tees).at;
  }

  yardsOf(i = this.round?.index ?? 0) {
    const spec = this.course?.holes?.[i]?.spec ?? {};
    const r = this.round;
    const spots = r && i === r.index ? r.hole?.layout?.teeSpots : this.course?.holes?.[i]?.teeSpots;
    const colour = r?.tees ?? this.settings.tees;
    if (spots) return teeYards(spec.yards, spots, colour);
    // A hole not prepared yet: its boxes worked out from its layout.
    const L = this.course?.holes?.[i]?.layout;
    if (!L || teeColour(colour) === DEFAULT_TEE || !(L.path?.length >= 2)) return spec.yards;
    const holes = this.course.holes;
    holes[i].teeSpots ??= teeSpots(withEdits(withLinks(this.course, i)));
    return teeYards(spec.yards, holes[i].teeSpots, colour);
  }

  // The player the scorecard, scoreboard and panel point at: while the last
  // shot is still being looked at, whoever plays next.
  get toPlay() {
    const r = this.round;
    return r.pending || this.me.done ? this.whoseTurn() : r.turn;
  }

  // Who plays next, by the rules in sim/players.mjs.
  whoseTurn() {
    const r = this.round;
    // A scramble: team by team, everyone from the team's ball; a pick
    // waiting is the captain's (r.pick, the team).
    if (r.scr) {
      const t = scrambleTurn(r.scr, r.order, (b) => distanceToPin(r.hole, b));
      r.pick = t?.pick ?? null;
      // Online, nothing to do here until another bay's teammate has hit or
      // its captain has picked.
      r.scrWait = !!t?.wait;
      if (!t || t.wait) return r.turn;
      if (t.pick == null) this.toTeamBall(t.player, r.scr[t.team]);
      return t.player;
    }
    const balls = r.players.map((p) => ({ done: p.done, teed: p.strokes > 0, distance: distanceToPin(r.hole, p.ball) }));
    return nextPlayer(balls, r.order, this.settings.turns ?? "farthest") ?? r.turn;
  }

  // With friends: the view moves on to the next player's ball, the way it
  // moves on to the next shot playing alone, and says whose turn it is.
  passTurn(snap = !view.follow) {
    const r = this.round;
    clearTimeout(this.turnTimer);
    if (!r || r.finished || r.done || this.flying) return;
    // A hole-out's wait still running has nothing left to do: left armed, it
    // would cut short the pause after the next player's shot.
    clearTimeout(this.nextTimer);
    r.pending = false;
    this.moveOnWhenBack = false;
    // Online, this bay's players all finished: wait for the others.
    if (this.waitForOthers()) return;
    // A holed-out player's celebration makes way for the next shot.
    this.celebration.clear();
    this.hideRelief();
    r.turn = this.whoseTurn();
    // The last player's result has had its moment (and its toast); the top
    // line is now about the one to play.
    r.message = "";
    this.newPosition(snap);
    if (r.pick != null) {
      this.showPick();
      this.render();
      return;
    }
    if (r.scrWait) {
      r.waiting = true;
      r.message = this.scrambleWaitWords();
      this.render();
      return;
    }
    const left = distanceToPin(r.hole, this.me.ball);
    this.onToast(`${this.me.name} to play - ${this.putting ? `${fmt(left / FOOT, 0)} ft` : `${fmt(left / YARD, 0)} yds`}`, 2000);
  }

  // A wait that ran out while the course was off screen: the next hole (or
  // the end of the round), or the next player's turn.
  moveOn() {
    const r = this.round;
    if (!r || r.finished || this.flying) return;
    if (r.done && this.holdOnHole) return;
    if (r.done) {
      // The scorecard first, a while (showHoleCard) - the next hole's
      // loading finished behind it - unless it's off, already up, or the
      // round's over (its own card comes).
      // (The designer's one hole: its card, then back to the designer.)
      // With the cart ride on, the card's on the cart's screen as it
      // drives to the next tee (course/buggy.js) - where there's a way to
      // drive.
      if (this.ride) return;
      if (this.rideWanted() && this.startRide()) return;
      if (this.settings.holeCard !== false && !this.holeCard && (r.onlyHole != null || r.index + 1 < this.course.holes.length)) return this.showHoleCard();
      this.nextHole();
    } else if (r.pending) this.passTurn(true);
  }

  // ---- The scorecard after each hole ---------------------------------------------------
  //
  // Once a hole's done (its celebration, and its flyover if there's one),
  // the round's scorecard over the picture for HOLE_CARD seconds, a bar
  // counting them down, then the next hole (N, or the card's button,
  // sooner). The pause is the next hole's to finish loading in (the
  // owner: "a 10 second pause that is used to pre load"): the picture
  // behind it isn't what's watched, so the quiet moments' work (app.js,
  // sim/idlework.mjs) gets most of each frame while it's up (loadingPause),
  // and whatever of the hole built ahead (prebuildNext) is left is done.

  showHoleCard() {
    const r = this.round;
    this.hideHoleCard();
    const el = document.createElement("div");
    el.className = "hole-card";
    const s = this.course.holes[r.index].spec;
    const only = r.onlyHole != null;
    const next = only ? null : this.course.holes[r.index + 1]?.spec;
    el.innerHTML = `<div class="hc-inner">
        <div class="hc-eyebrow">Hole ${esc(s.number)} done${next ? ` · next: hole ${esc(next.number)}, par ${esc(next.par)}, ${esc(this.yardsOf(r.index + 1))} yds` : only ? " · back to the course designer" : ""}</div>
        <div class="hc-body"><div class="hc-card">${this.scorecardHtml()}</div>${this.seasonBoardHtml()}</div>
        <div class="hc-bar"><i style="animation-duration:${HOLE_CARD}s"></i></div>
        <button class="primary" data-act="next">${keyed(only ? "Back to the designer" : "Next hole", "N", this.keysShown())}</button>
      </div>`;
    el.addEventListener("click", (e) => {
      if (e.target.closest("button[data-act=next]")) this.next();
    });
    this.view.appendChild(el);
    this.holeCard = { el, timer: setTimeout(() => this.holeCardDone(), this.paced(HOLE_CARD * 1000)) };
    this.renderBetween();
    this.onChange();
  }
  holeCardDone() {
    if (!this.holeCard) return;
    // (Online, waiting for the others to be ready: it stays up, saying who
    // for, till they are - nextHole takes it down.)
    if (this.round?.done && !this.round.finished) this.nextHole();
    if (!this.round?.holding) this.hideHoleCard();
  }
  hideHoleCard() {
    // (And the cart ride, the card on its screen: course/buggy.js.)
    this.endRide();
    if (!this.holeCard) return;
    clearTimeout(this.holeCard.timer);
    this.holeCard.el.remove();
    this.holeCard = null;
    this.renderBetween();
  }
  // Whether the picture is behind a card that's there for loading in.
  loadingPause() {
    return !!this.holeCard || !!this.holeLoading || this.pictureHidden() || this.rideCovers();
  }
  // Whether the picture is covered whole - the course's still up while the
  // first hole is built behind it - so there's no drawing it at all
  // (app.js) until the hole's ready to be seen.
  pictureHidden() {
    // (And while the first hole's shaders are still being built, still or
    // no still: idleBuilt. And behind the "Loading hole N..." card: the
    // last picture stays up, not drawn again, so the build behind it has
    // the page - nextHole.)
    // (Or a film: the generic one till then, a course's own till the round
    // starts - course/films.js.)
    const covered = !this.photoEl.classList.contains("gone") || !this.filmEl.classList.contains("gone");
    return this.isActive && ((covered && !this.idle?.ready) || !!this.idle?.warming || !!this.switching || this.filmCovers());
  }
  // The ground of a hole rebuilt from a map: the real terrain as one mesh,
  // coloured from the hole's lie raster, a finer patch over the green (for
  // the ball and the cup), coarse ground out to the horizon, and water lying
  // flat at the lowest point of each pond's edge.
  *buildMappedGround(L, cup) {
    const hole = this.hole;
    const r = L.region;
    const splat = splatTextures(hole.raster);
    this.splat = splat;
    // Mown in the hole's own patterns (look/glsl/ground.js mowingFor) - and
    // Ultra's short grass across it in its stripes' shades, worked out as
    // its ground's are, in the hole's frame (look/groundbits.js).
    const mowing = holeMowing(L);
    this.sceneStep(() => useShortGrass({ ...GRASS.fairway, stripeWidth: MOW_WIDTH.fairway, mow: mowing.fairway.kind, mowDir: mowing.fairway.dir }, { hole: true }));
    const ground = withCountry(mappedGroundMaterial({ splat, raster: hole.raster, hole: cup, layer: LAYER.fairway, mowing }));
    const greenMat = mappedGroundMaterial({ splat, raster: hole.raster, hole: cup, layer: LAYER.green, mowing });
    (this.countryMats ??= []).push(ground);
    const h = (x, z) => this.heightAt(x, z);
    // As fine as the ground data (1 m from LiDAR, 2.5 m from map tiles).
    const cell = hole.green.terrain?.cell ?? 2.5;
    const spacing = HIGH ? Math.min(1.25, cell) : Math.max(2, cell);
    const g = L.green;
    // The finer patch round the green reaches past its fringe - and past
    // the whole bank of a green shaped by hand (sim/greensculpt.mjs), whose
    // humps and hollows a coarser mesh would cut across.
    const shaped = (L.contours ?? []).find((c) => c.sculpt);
    const reach = Math.max(g.rx, g.rz) + (shaped ? 1.6 + shaped.bank + 1 : 6);
    const box = { x0: g.x - reach, x1: g.x + reach, z0: g.z - reach, z1: g.z + reach };
    // The coarse mesh leaves out what the finer patch covers (all but a
    // strip round its edge, so no gap shows between them): laid under it,
    // a coarse triangle's straight sides would poke up through a hollow.
    const coarse = terrainMesh(r, spacing, h, ground);
    // The ground as the mesh draws it, for laying a cart path on (it mustn't
    // dip under the mesh's straight-sided triangles in a hollow).
    const drawn = terrainMeshHeight(r, spacing, h);
    this.pathGround = (wx, wz) => Math.max(h(-wz, wx), drawn(-wz, wx));
    const within = (wx, wz) => -wz > box.x0 + spacing && -wz < box.x1 - spacing && wx > box.z0 + spacing && wx < box.z1 - spacing;
    coarse.geometry = cutOver(coarse.geometry, within, false);
    this.world.add(coarse);
    // (A part a step: on a hole from a map, all of it was a third of a
    // second of the page as the hole was built ahead.)
    yield "the mapped ground";
    const fineCell = HIGH ? 0.35 : 0.6;
    const fine = terrainMesh(box, fineCell, h, greenMat, 0.002);
    // Slopes shown on and just round the green.
    this.shadeSlopes(fine, (x, z) => Math.min(1, Math.max(0, 1 - (-insideDepth(g, x, z) - 1.6) / 3)));
    this.world.add(fine);
    yield "the mapped ground round the green";
    // Walls along bunkers and ponds (sim/walls.mjs): neither mesh may lie
    // across one (a triangle from the top to the foot would be a ramp in
    // front of it), so those go; the ground is laid again right up to the
    // wall's top, in the same colours; a bunker with a wall has its sand
    // drawn over the ground as a bowl, crisp at the wall's foot, and the
    // coarse ground under it goes (it would poke up through the sand).
    const walled = [...L.bunkers.filter((b) => wallOf(b)).map((s) => ({ s, kind: "bunker" })), ...L.water.filter((w) => wallOf(w) && !w.brook).map((s) => ({ s, kind: "water" }))];
    // A brook (sim/brooks.mjs): its banks drawn finely - a patch of their
    // own, the coarse mesh (and the green's) left out under them, where its
    // big triangles would cut across the channel - the patch cut along
    // each wall, and the grass laid again along each wall's top. (drawBrook
    // builds the walls.)
    const brookPatch = HIGH ? 0.5 : 0.75;
    for (const w of L.water.filter((q) => q.brook)) {
      const bed = brookBed(w);
      const over = (wx, wz) => insideBlob(bed, -wz, wx, 0.5);
      coarse.geometry = cutOver(coarse.geometry, over, true);
      fine.geometry = cutOver(fine.geometry, over, true);
      const patch = terrainMesh(shapeBounds(bed, spacing + 2), brookPatch, h, ground, 0.001);
      patch.geometry = cutOver(patch.geometry, (wx, wz) => !insideBlob(bed, -wz, wx, spacing + 1.5), "all");
      const top = mappedGroundMaterial({ splat, raster: hole.raster, hole: cup, layer: (LAYER.fairway + LAYER.fringe) / 2, mowing });
      for (const v of wallViews(w)) {
        patch.geometry = cutAlongWall(patch.geometry, v, brookPatch * 0.75 + 0.05, (x, z) => insideDepth(v, x, z) > 0);
        const strip = landStrip(v, { width: brookPatch * 1.5 + 0.3, ext: 1.5, heightAt: h, lift: 0.004, material: top });
        if (strip) this.world.add(strip);
      }
      this.world.add(patch);
    }
    // An island green's causeway to land (sim/causeway.mjs), coloured as
    // fairway by the lies: the ground along it drawn finely too, its edges
    // dropping away to the water within a metre or so, which the coarse
    // mesh's big triangles would cut across.
    for (const c of causeways(L)) {
      const over = (wx, wz) => causewayPast(c, -wz, wx) < 1.5;
      coarse.geometry = cutOver(coarse.geometry, over, true);
      fine.geometry = cutOver(fine.geometry, over, true);
      const patch = terrainMesh(causewayBounds(c, spacing + 2), brookPatch, h, ground, 0.001);
      patch.geometry = cutOver(patch.geometry, (wx, wz) => causewayPast(c, -wz, wx) > spacing + 1.5, "all");
      this.world.add(patch);
    }
    if (walled.length) {
      const apron = mappedGroundMaterial({ splat, raster: hole.raster, hole: cup, layer: (LAYER.fairway + LAYER.fringe) / 2, mowing });
      for (const { s, kind } of walled) {
        const inside = (x, z) => insideDepth(s, x, z) > 0;
        coarse.geometry = cutAlongWall(coarse.geometry, s, spacing * 0.75 + 0.05, inside);
        fine.geometry = cutAlongWall(fine.geometry, s, fineCell * 0.75 + 0.05, inside);
        const level = kind === "water" ? hole.pondLevel(s) : 0;
        const bunker = kind === "bunker";
        // A bunker with a wall: the ground round it finely (the coarse
        // ground's big triangles poked up through its sand on a slope),
        // with the coarse ground cut away under it but for a strip round
        // its edge, as round the green.
        let cell = spacing;
        if (bunker) {
          // (Nor the finer ground round the green, which may reach it.)
          fine.geometry = cutOver(fine.geometry, (wx, wz) => insideBlob(s, -wz, wx), "all");
          cell = HIGH ? 0.3 : 0.45;
          const b = shapeBounds(s, 2);
          const patch = terrainMesh(b, cell, h, apron, 0.001);
          patch.geometry = cutOver(patch.geometry, (wx, wz) => insideBlob(s, -wz, wx), "all");
          patch.geometry = cutAlongWall(patch.geometry, s, cell * 0.75 + 0.05, inside);
          this.world.add(patch);
          const under = (wx, wz) => -wz > b.x0 + spacing && -wz < b.x1 - spacing && wx > b.z0 + spacing && wx < b.z1 - spacing;
          coarse.geometry = cutOver(coarse.geometry, under, false);
        }
        const strip = landStrip(s, { width: cell * 1.5 + 0.3, ext: 1.5, heightAt: h, lift: 0.004, material: apron });
        if (strip) this.world.add(strip);
        // A pond's bank past the wall's ends, on the water side, where
        // the cut left the coarse ground open (by the wall it's down at
        // the wall's foot, under the water).
        if (!bunker) {
          const low = besideWall(s, h);
          const bank = landStrip(s, { width: cell * 1.5 + 0.3, ext: 2, heightAt: low, lift: 0.004, material: apron, inward: true });
          if (bank) this.world.add(bank);
        }
        const wall = makeWall(s, kind, { heightAt: h, level });
        if (wall) this.world.add(wall);
        if (!bunker) continue;
        const sw = toWorld(s.x, 0, s.z);
        const round = (a) => blobRadius(s, Math.atan2(Math.cos(a), -Math.sin(a)) - (s.rot ?? 0));
        const outline = s.poly.map(([x, z]) => [z, -x]);
        const low = this.besideWall(s);
        this.world.add(
          ringMesh({ cx: sw.x, cz: sw.z, outline: round, rings: Math.ceil(Math.max(s.rx, s.rz) / 0.3), segments: 128, heightAt: low, lift: 0.006, material: sandFor(outline, low, LAYER.sand) }),
        );
      }
    }
    yield "the mapped ground's walls and brooks";
    // Beyond the mapped ground: deep rough like its outer edge, meeting the
    // edge's heights and easing over 75 m to the edge's mean level (sim/
    // country.mjs skirtHeight) - carried straight out, the edge heights
    // left straight ribs across sloping ground for 900 m.
    const skirt = withCountry(grassMaterial({ ...GRASS.deep, layer: LAYER.rough }));
    this.countryMats.push(skirt);
    const pad = 900;
    const level = skirtLevel(h, r);
    // The skirt eases onto the course field where there is one, and onto
    // the edge's mean level otherwise (sim/cropground.mjs skirtToward).
    const index = this.round?.index ?? Math.max(0, (L.number ?? 1) - 1);
    const field = !this.challenge && (this.course?.holes?.length ?? 0) > 1 ? holeHeightField(this.course, index, { own: h }) : null;
    const eased = field ? (x, z) => skirtToward(h, r, field, x, z) : (x, z) => skirtHeight(h, r, level, x, z);
    // (By the sea, running down through low dunes and a beach under the
    // water: sim/coast.mjs shoreHeight - on a finer grid for them.)
    const shored = this.shored((wx, wz) => eased(-wz, wx), level);
    const under = (x, z) => shored(z, -x);
    if (this.shore) this.shore.level = seaLevel(level) - 0.3;
    // Meeting the box's edge with no step (sim/country.mjs SKIRT): a ring of
    // the hole's own fineness round it, easing down to the coarse land
    // beyond - which runs on under the ring's outer part but is kept clear
    // of the box, so its big triangles can't cut across a steep bank or a
    // hollow and stand up through the ground there (or anything laid on
    // it, a cart path), and needn't be sunk where the hole's dug: beside a
    // pond on steep ground, that sinking was a cliff at the box's edge.
    // (On the higher setting, every other one of the hole's edge points:
    // still meeting it point for point, at a quarter of the triangles.)
    this.world.add(skirtRing(r, spacing < 2 ? spacing * 2 : spacing, (x, z) => under(x, z) - ringDrop(r, x, z), skirt));
    const far = this.shore ? 8 : 12;
    // What stands out there (other holes' trees, the woods) stands on the
    // ground as it's drawn: the ring round the box, and past it the coarse
    // land - whose triangles, 8 - 20 m a side, cut under a rise's curve, so
    // a tree set on the curve itself stood clear of the ground (by up to
    // 0.6 m on Hillside Park's hills). Each mesh's own height, as a cart
    // path's is (pathGround); the finest that covers a spot first.
    const drawnBeyond = [];
    this.farGround = (wx, wz) => {
      const x = -wz;
      const z = wx;
      const d = Math.hypot(x - Math.min(Math.max(x, r.x0), r.x1), z - Math.min(Math.max(z, r.z0), r.z1));
      const ring = d < SKIRT.ring ? under(x, z) - ringDrop(r, x, z) : -Infinity;
      const mesh = drawnBeyond.find((m) => x >= m.box.x0 && x <= m.box.x1 && z >= m.box.z0 && z <= m.box.z1);
      const land = (mesh ? mesh.height(x, z) : under(x, z)) - SKIRT.drop;
      return Math.max(ring, land);
    };
    const placeBeyond = (box, step) => {
      const mesh = terrainMesh(box, step, under, skirt, -SKIRT.drop);
      const clear = SKIRT.ring - step * Math.SQRT2;
      const near = (wx, wz) => -wz > r.x0 - clear && -wz < r.x1 + clear && wx > r.z0 - clear && wx < r.z1 + clear;
      mesh.geometry = cutOver(mesh.geometry, near, true);
      this.world.add(mesh);
      drawnBeyond.unshift({ box, height: terrainMeshHeight(box, step, under) });
      return mesh;
    };
    if (!field) placeBeyond({ x0: r.x0 - pad, x1: r.x1 + pad, z0: r.z0 - pad, z1: r.z1 + pad }, far);
    else {
      const crop = cropBoxOf(this.course, index, { preset: LEVEL });
      const steps = sheetSteps(LEVEL, !!this.shore);
      let outer = { x0: r.x0 - pad, x1: r.x1 + pad, z0: r.z0 - pad, z1: r.z1 + pad };
      if (crop?.box) {
        outer = {
          x0: Math.min(outer.x0, crop.box.x0),
          x1: Math.max(outer.x1, crop.box.x1),
          z0: Math.min(outer.z0, crop.box.z0),
          z1: Math.max(outer.z1, crop.box.z1),
        };
      }
      const mesh = placeBeyond(outer, crop?.box ? steps.outer : far);
      if (crop?.box) {
        mesh.geometry = cutOver(mesh.geometry, (wx, wz) => insideCrop(wx, wz, crop.box, steps.outer), "all");
        placeBeyond(crop.box, steps.crop);
      }
    }
    // Water: deeper-coloured away from its edge (look/sandwater.js), and
    // none on a green or its fringe (sim/greenfirst.mjs).
    const zone = greenZone(L);
    for (const w of L.water) {
      if (w.brook) {
        this.drawBrook(w, w.poly.map(([x, z]) => [z, -x]), null);
        continue;
      }
      // (As play has it - sim/walls.mjs pondLevel: from the ground before
      // any was built up beside a wall.)
      const level = hole.pondLevel(w);
      (this.waterLevels ??= []).push({ w, level });
      const geo = new THREE.ShapeGeometry(new THREE.Shape(w.poly.map(([x, z]) => new THREE.Vector2(z, x))));
      geo.rotateX(-Math.PI / 2);
      const wallPts = wallOf(w) ? wallLine(w).pts.map(([x, z]) => [z, -x]) : null;
      const m = new THREE.Mesh(geo, waterFor(w.poly.map(([x, z]) => [z, -x]), LAYER.water, null, wallPts, 1, waterDry(zone, w)));
      m.position.y = level;
      m.receiveShadow = true;
      this.world.add(m);
    }
  }

  // Slopes shown on a green: each spot a little lighter where it faces the
  // sun and darker where it faces away - more than the light alone makes
  // it, so a tier, a crown or a hollow reads from the approach and not
  // just in the putting grid. `weight(x, z)` (hole frame) fades it out: 1
  // on the green.
  shadeSlopes(mesh, weight = () => 1) {
    const sun = sunDirection();
    const flat = Math.hypot(sun.x, sun.z) || 1;
    const [sx, sz] = [sun.x / flat, sun.z / flat];
    const pos = mesh.geometry.attributes.position;
    const col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i);
      const wz = pos.getZ(i);
      const [gx, gz] = this.worldGradient(wx, wz);
      // Facing the sun: the ground rising towards it.
      const lit = Math.max(-0.22, Math.min(0.22, (gx * sx + gz * sz) * 5));
      const s = 1 + lit * weight(-wz, wx);
      col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = s;
    }
    mesh.geometry.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    mesh.material.vertexColors = true;
    return mesh;
  }

  // A strip down one side of the hole (side -1 left, 1 right) between two
  // distances from the centre line, following it round any dog-leg; both
  // edges fade raggedly over a few metres (see edgeStrip). Its outer edge,
  // out under the trees, wanders in and out rather than running exactly
  // parallel to the hole, and its ends fade out raggedly over the last 20 m
  // rather than being cut straight across - from above, a straight-edged
  // band read as a runway. (The inner edge is where the deep rough plays
  // from, so it stays where it is.)
  // inner: metres, or (s) -> metres along the line.
  deepRoughBand(path, inner, outer, side) {
    const innerAt = typeof inner === "function" ? inner : () => inner;
    const pos = [];
    const edge = [];
    const index = [];
    const fade = 3;
    const ends = 20;
    // Across it: its soft inner edge, then every few metres (so it lies
    // over a links hole's dunes), then its soft outer edge.
    const across = this.hole?.green?.rolls ? (this.hole.layout?.links ? 3 : 6) : Infinity;
    // The outer edge's wander: slow waves, their own for each side.
    const ph = side > 0 ? 1.7 : 4.1;
    const wander = (s) => 7 * Math.sin(s / 41 + ph) + 4 * Math.sin(s / 17 + ph * 2.3);
    const from = -25 - ends;
    const to = path.length + 25 + ends;
    // (The same number every row: as many as its widest needs.)
    const widest = Math.max(...Array.from({ length: Math.ceil((to - from) / 4) + 1 }, (_, i) => outer - fade * 3 - Math.min(innerAt(from + i * 4), outer - fade * 3 - 1)));
    const cols = 4 + (Number.isFinite(across) ? Math.max(0, Math.ceil(widest / across) - 1) : 0);
    let rows = 0;
    for (let s = from; s <= to + 3.99; s += 4) {
      const at = pointAt(path, Math.min(Math.max(s, 0), path.length));
      const beyond = s < 0 ? s : s > path.length ? s - path.length : 0;
      const cx = at.p[0] + at.dir[0] * beyond;
      const cz = at.p[1] + at.dir[1] * beyond;
      // Full inside the band, fading to nothing over its last 20 m each end.
      const end = Math.min(1, Math.max(0, Math.min(s - from, to - s) / ends));
      const ins = Math.min(innerAt(s), outer - fade * 3 - 1);
      const offs = [ins - fade, ins];
      for (let k = 1; k < cols - 3; k++) offs.push(ins + ((outer - fade * 3 - ins) * k) / (cols - 3));
      offs.push(outer - fade * 3, outer);
      offs.forEach((d0, k) => {
        // (The wander only on the outer ones, growing in across the middle.)
        const d = d0 + wander(s) * Math.min(1, Math.max(0, (d0 - ins) / Math.max(1, outer - fade * 3 - ins)));
        // Hole frame (x down, z right) -> world (z, -x).
        const hx = cx - at.dir[1] * d * side;
        const hz = cz + at.dir[0] * d * side;
        const wx = hz;
        const wz = -hx;
        pos.push(wx, this.drapeHeight(wx, wz) + SURFACE_LIFT.deep, wz);
        edge.push(k === 0 || k === cols - 1 ? 0 : end);
      });
      rows++;
    }
    for (let i = 0; i < rows - 1; i++) {
      for (let k = 0; k < cols - 1; k++) {
        const a = i * cols + k;
        const b = (i + 1) * cols + k;
        index.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
    // Facing up, whichever side it's on: flip every triangle if the first
    // one faces down.
    const v = (i) => new THREE.Vector3(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
    const [i0, i1, i2] = index;
    const up = v(i1).sub(v(i0)).cross(v(i2).sub(v(i0))).y > 0;
    if (!up) for (let i = 0; i < index.length; i += 3) [index[i + 1], index[i + 2]] = [index[i + 2], index[i + 1]];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("gEdgeIn", new THREE.Float32BufferAttribute(edge, 1));
    geo.setIndex(index);
    geo.computeVertexNormals();
    return geo;
  }

  // After a shot settles (or a new hole, or a new turn): suggest a club,
  // aim, set up.
  newPosition(snap = false) {
    const r = this.me;
    const hole = this.hole;
    this.fromBall = false;
    // (For a report's long frames: a shot set up is the frame's work.)
    noteFrame("setup");
    // Uphill plays longer and downhill shorter, about a metre for a metre.
    const distance = distanceToPin(hole, r.ball) + riseToPin(hole, r.ball);
    // (A swing pad or controller player's clubs go as far as their level.)
    const reach = this.reachOf(r);
    let club = suggestClub(distance, r.lie, { reach });
    r.club = club;
    r.aim = defaultAim(hole, r.ball, club);
    this.updateStance();
    // In a dug bunker, a club that gets out over the face that way.
    const face = faceAhead(hole, r.ball, r.aim);
    if (face) {
      club = suggestClub(distance, r.lie, { face, stance: r.stance, reach });
      if (club !== r.club) {
        r.club = club;
        r.aim = defaultAim(hole, r.ball, club);
        this.updateStance();
      }
    }
    // Facing a bunker's wall (sim/walls.mjs) too high for any club to get
    // over that way: aimed out to the side, where one does.
    const turned = faceAhead(hole, r.ball, r.aim)?.wall ? escapeAim(hole, r.ball, r.lie, r.stance, r.aim) : null;
    if (turned) {
      r.aim = turned.aim;
      r.club = club = turned.club;
      this.updateStance();
      this.onToast("The wall's too high to go over towards the pin: aimed out to the side (← → to change)", 4500);
    }
    // The club it suggested, for the command centre's This shot to say
    // once another's been picked.
    this.suggested = { who: r.name, club };
    this.onClub(club);
    this.ball.geometry.dispose();
    this.world.remove(this.ball);
    this.ball = makeBall(BALL_R);
    this.world.add(this.ball);
    this.fitBall(0, false);
    // The sky in it too, as the rest of the scene's shiny things have
    // (without it a ball seen against the sun was a dull blue-grey).
    applyReflections(this.scene, this.ball);
    this.putBall(r.ball);
    this.growNest(r.ball);
    this.growLongGrass(r.ball);
    // Teed up (the hole's first shot, each player's, or played again from
    // the tee), heard - not a shot from where the ball lay.
    if (r.lie === "tee") audio.teeUp(this.ball.position);
    this.showFlag();
    this.drawMarkers();
    this.showGrid();
    this.showShade();
    this.drawAim();
    this.preparePutt();
    this.placeCamera(snap);
    this.render();
    this.sendNewSoon();
  }

  // What's new on the hole - the grass just grown round the ball, anything
  // not drawn yet - sent to the graphics card while the shot's set up
  // (look/gpuprep.js), nearest where the camera will follow the ball
  // first (treePath: the fan of flights it's ready for), so none of it is
  // sent mid-flight as it first comes into view.
  sendNewSoon() {
    const q = this.idleWork;
    if (!q) return;
    const near = this.treePath?.() ?? null;
    q.add({ id: "send-new", after: q.now() + 800, priority: 1, steps: () => sendNewSteps(this.renderer, this.scene, this.camera, this.world, { near }) });
  }

  // ---- The round's end: its card, the celebration, saving it ----------------------

  // (early: ended from the menu before the last hole - no celebration if
  // no one finished a hole.)
  finishRound({ early = false } = {}) {
    const r = this.round;
    r.finished = true;
    this.dropSwitch();
    this.dropPrebuilt();
    this.dropKept();
    // The recording's Finish scene (videorec.js), if it has one.
    this.onRoundEnd?.();
    const pars = this.course.holes.map((h) => h.spec.par);
    if (early && !this.anyScores) {
      // Nothing to celebrate: the round just ends.
    } else if (this.multi) {
      // With friends: the winner, and everyone's totals.
      const table = standings(r.players, pars);
      const best = table.filter((t) => t.played > 0).sort((a, b) => a.total - b.total)[0];
      const played = best ? pars.filter((_, i) => r.players[best.index].scores[i] != null) : [];
      const desc = roundCelebration({ total: best?.total ?? 0, par: played.reduce((a, p) => a + p, 0), holes: played.length });
      desc.title = winnerTitle(table);
      desc.subtitle = totalsLine(table);
      // The game's winner and standings (sim/formats.mjs), when it's more
      // than plain stroke play.
      const game = this.game();
      if (game.shown) {
        desc.title = game.st.title;
        desc.subtitle = `${FORMAT_NAMES[r.format]}: ${game.st.line}`;
      }
      // Four names and totals can be wider than the picture.
      desc.wrap = true;
      desc.detail = `${this.course.name} - ${desc.detail}`;
      this.celebrate(desc);
    } else {
      const scores = r.players[0].scores;
      const played = this.course.holes.map((h, i) => (scores[i] == null ? null : h.spec.par)).filter((p) => p != null);
      const total = scores.reduce((a, s) => a + (s ?? 0), 0);
      // The round gets its own celebration, scaled by the total against par.
      const desc = roundCelebration({ total, par: played.reduce((a, p) => a + p, 0), holes: played.length });
      desc.detail = `${this.course.name} - ${desc.detail}`;
      this.celebrate(desc);
    }
    // (An online ladder match's mark goes with its round, whatever came of
    // it: sim/netladder.mjs.)
    if (r.net) this.pendingNetLadder = keepNetLadder(this.pendingNetLadder, { what: "finished" });
    // (The season's event first: where it finished goes with the round, for
    // its skill XP - sim/skills.mjs.)
    // (A ladder's match the same: its result on the ladder.)
    this.ladderMatchPlayed();
    this.seasonEventPlayed();
    // (A season by post's event: its round sent - course/seasonpost.js.)
    this.postSeasonPlayed();
    this.saveRound();
    this.render();
    // (Online: the host's Back to the lobby - course/panel.js.)
    this.renderBetween();
    this.onRoundCard?.(this.roundCards());
  }

  // Each player's round card (sim/roundcard.mjs) from the shots kept this
  // round: the scorecard, net of their handicap, strokes gained against it
  // and the best shot. Players who didn't finish a hole have none.
  roundCards() {
    const r = this.round;
    // A scramble's card is the team's, on the scorecard: no one player's.
    if (!r || !this.course || r.format === "scramble") return [];
    const pars = this.course.holes.map((h) => h.spec.par);
    const yards = this.course.holes.map((_, i) => this.yardsOf(i));
    const sis = this.course.holes.map((h) => (Number.isFinite(h.spec.si) ? h.spec.si : null));
    return r.players
      .filter((p) => !p.remote && p.scores.some((v) => v != null))
      .map((p) => {
        const played = p.scores.filter((v) => v != null);
        const card = { scores: p.scores, pars, yards, sis, total: played.reduce((a, v) => a + v, 0), holes: played.length, complete: played.length === p.scores.length, name: this.course.name };
        const level = baselineLevel("mine", p.index);
        const stats = roundStats(p.log ?? [], card, { level });
        // (The round's clock: its first tee to the end of the hole it's on.)
        return roundCard(stats, { player: p.name, index: p.index, against: baselineName("mine", p.index), date: Date.now(), course: this.course.name, weather: conditionsWords(r.weather), times: roundTimes(r.clock, r.index - r.first + 1), swing: p.swing ? p.swingWords : null });
      });
  }

  // Plays a celebration at this hole's flag, the camera keeping to the side
  // it's on (or behind the aim if it's right over the flag).
  celebrate(desc) {
    if (!this.pinWorld) return;
    // A "to play" toast still up would sit under the banner.
    this.onToast("", 0);
    const away = new THREE.Vector3().subVectors(this.camera.position, this.pinWorld).setY(0);
    if (away.lengthSq() < 1) away.set(-Math.sin(this.me?.aim ?? 0), 0, Math.cos(this.me?.aim ?? 0));
    this.celebration.play(desc, { focus: this.pinWorld, camera: this.camera, away, groundAt: this.worldHeight });
  }

  // Each player's round is saved as a round for the course, with their
  // name. Playing alone it's saved without one, as before: the name is for
  // telling friends apart, and a lone player has no one to be told from.
  async saveRound() {
    const r = this.round;
    // (The designer's one hole tried isn't a round of the course.)
    if (!r || r.saved || !this.anyScores || r.onlyHole != null) return;
    r.saved = true;
    const pars = this.course.holes.map((h) => h.spec.par);
    const sends = [];
    // A scramble's scores are the team's, not any one player's: kept in the
    // course's history once for each team, under the team's names, and
    // never in a player's own games (or their handicap).
    const teams = r.format === "scramble" && r.teamOf ? teamsOf(r.teamOf) : null;
    for (const p of r.players) {
      if (!p.scores.some((s) => s != null)) continue;
      // Online, the other bays' players are theirs to keep.
      if (p.remote) continue;
      if (teams) {
        const t = teams.find((x) => x.members.includes(r.players.indexOf(p)));
        if (!t || t.members[0] !== r.players.indexOf(p)) continue;
        sends.push(
          fetch(`/api/courses/${encodeURIComponent(this.course.id)}/rounds`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ scores: p.scores, name: teamName(t.members, r.players.map((q) => q.name)) }),
            keepalive: true,
          }).catch(() => {}),
        );
        continue;
      }
      // In the player's own game history too; a finished round is a score
      // to beat. A note on how it went only playing alone: with friends
      // the end of the round is theirs.
      const played = p.scores.filter((s) => s != null);
      const complete = played.length === p.scores.length;
      const total = played.reduce((a, s) => a + s, 0);
      this.onGame?.({
        kind: "course",
        id: r.id,
        key: this.course.id,
        name: this.course.name,
        player: p.name,
        scores: p.scores,
        total,
        toPar: total - pars.filter((_, h) => p.scores[h] != null).reduce((a, v) => a + v, 0),
        holes: played.length,
        complete,
        ...(complete ? { score: total } : {}),
        note: !this.multi,
        // A season's event: where it finished (course/season.js).
        ...(p === r.players[0] && Number.isInteger(r.seasonPos) ? { seasonPos: r.seasonPos } : {}),
        // For the handicap: each hole's par, length and stroke index.
        pars,
        yards: this.course.holes.map((_, i) => this.yardsOf(i)),
        sis: this.course.holes.map((h) => (Number.isFinite(h.spec.si) ? h.spec.si : null)),
      });
      const named = this.multi;
      // Sent straight away for every player, and kept going if the page is
      // closing (a reload, an update): see the pagehide in app.js.
      sends.push(
        fetch(`/api/courses/${encodeURIComponent(this.course.id)}/rounds`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(named ? { scores: p.scores, name: p.name } : { scores: p.scores }),
          keepalive: true,
        }).catch(() => {
          // The round still shows; it just isn't in the history.
        }),
      );
    }
    await Promise.all(sends);
  }

  // ---- Heights, the ball, the aim and the camera ---------------------------------

  // Heights in the hole frame and in world terms: humps near the green on a
  // generated hole, the real ground everywhere on one rebuilt from a map.
  heightAt(x, z) {
    if (!this.hole) return 0;
    const g = this.hole.heightAt(x, z);
    return this.shore ? this.shoreDown(z, -x, g) : g;
  }
  // By the sea, the hole's own ground run down through the beach to the
  // water as the far ground is (shored) - only past where a ball can
  // finish (shoreHeight leaves play alone), but with the sea brought right
  // up to a hole (sim/coast.mjs SEA_GAPS) its own ground reaches the beach,
  // and stood there as a ledge over the water.
  shoreDown(wx, wz, g) {
    const d = this.shore.at(wx, wz);
    if (d >= COAST.beach + COAST.dunes) return g;
    return shoreHeight(d, g, seaLevel(0), duneLump(wx, wz, this.horizonSeed()), this.shore.past(wx, wz));
  }
  // Whether (wx, wz) is on the beach or in the sea, where no grass, heather
  // or rock grows.
  onShore(wx, wz) {
    return !!this.shore && this.shore.at(wx, wz) < COAST.beach + 6;
  }
  worldHeight = (wx, wz) => this.heightAt(-wz, wx);
  // The ground (world terms) for sand or a bank drawn beside a wall: the
  // height at the wall's foot right up to it (look/walls.js besideWall).
  besideWall(s, taper = false) {
    const at = besideWall(s, (x, z) => this.heightAt(x, z), { taper });
    return (wx, wz) => at(-wz, wx);
  }
  // Without what's been dug by hand, for the big sparse shapes (fairway,
  // bands of rough) laid over it, which would otherwise tent across a dug
  // bunker; they have it cut out of them instead (see buildHoleScene). But
  // over what's been raised by hand - a flashed bunker's lip and the grass
  // easing down behind it (sim/hazardshapes.mjs flashLift) - as the rough
  // under them is: laid on the ground as it was, the fairway lay under the
  // rough there, and the rough showed through it beside the bunker in dark,
  // saw-toothed patches (the owner's phone, Golf Sim Links' 2nd: "the
  // shadows ... on second hole").
  drapeHeight = (wx, wz) => {
    const base = this.hole?.baseHeightAt;
    const g = base ? Math.max(base(-wz, wx), this.hole.heightAt(-wz, wx)) : this.hole.heightAt(-wz, wx);
    return this.shore ? this.shoreDown(wx, wz, g) : g;
  };
  worldGradient = (wx, wz) => {
    const [gx, gz] = this.hole.gradientAt(-wz, wx);
    return [gz, -gx];
  };
  worldNormal = (wx, wz) => {
    const [gx, gz] = this.worldGradient(wx, wz);
    return new THREE.Vector3(-gx, 1, -gz).normalize();
  };

  // The drawn radius just now (fitBall): real size on the ground, larger
  // only while it's in the air.
  fitBall(height = 0, air = false) {
    const r = ballDrawRadius({ air, height });
    if (this.ball?.geometry?.parameters?.radius) this.ball.scale.setScalar(r / this.ball.geometry.parameters.radius);
    this.ballDraw = r;
    return r;
  }

  // The ball on what's drawn at (x, z) - or `y` above it in flight.
  putBall([x, z], y = null) {
    const r = this.fitBall(0, false);
    toWorld(x, (y ?? 0) + this.surfaceHeight(x, z, true) + r, z, this.ball.position);
  }

  // A shot's path as it's drawn - its tracer, and the ball through the air
  // (sim/tracer.mjs drawnPath): on real ground as flown, over the ground;
  // on a made-up hole, flown over flat ground, rising evenly from where it
  // was hit to where it lands, not over each rise and pond on the way.
  pathDrawn(path, flightPoints) {
    return drawnPath(path, flightPoints, { ground: (x, z) => this.heightAt(x, z), surface: (x, z) => this.surfaceHeight(x, z), flown: !!this.hole?.green?.terrain });
  }

  // The height of what's drawn at (x, z), hole frame: the ground and the
  // surface's lift over it (SURFACE_LIFT). resting: a ball sits a little
  // down into sand.
  surfaceHeight(x, z, resting = false) {
    const lie = this.hole.lieAt(x, z);
    if (lie === "water") {
      // Water lies flat: on a map, at its level; on a designed hole, over
      // the ground as it was before anything was dug.
      const flat = this.waterLevels?.find((l) => insideBlob(l.w, x, z));
      if (flat) return flat.at ? flat.at(x, z) : flat.level;
      if (!this.hole.mapped) return (this.hole.baseHeightAt ?? this.hole.heightAt)(x, z) + SURFACE_LIFT.water;
    }
    return this.heightAt(x, z) + (resting ? restingLift(lie, this.hole.mapped) : drawnLift(lie, this.hole.mapped));
  }
  worldSurface = (wx, wz) => this.surfaceHeight(-wz, wx);

  // A line along the aim, as far as the club goes (or to the hole on a putt),
  // with a ring where it ends.
  drawAim() {
    if (!this.aimGroup) return;
    // Redrawn at every nudge of the aim: let the last one's go.
    clearGroup(this.aimGroup);
    const r = this.me;
    if (!r || r.done || this.round.done || this.flying) return;
    const len = this.putting ? distanceToPin(this.hole, r.ball) : Math.min(BAG[r.club]?.carry ?? 150, distanceToPin(this.hole, r.ball) / YARD + 5) * YARD;
    // On the ground - or over water, on the water, not down on its bed (a
    // pond with a wall lies below the grass).
    const aimY = (x, z) => (this.hole.lieAt(x, z) === "water" ? Math.max(this.heightAt(x, z), this.surfaceHeight(x, z)) : this.heightAt(x, z));
    const pts = [];
    for (let d = 0; d <= len; d += Math.max(0.2, len / 60)) {
      const x = r.ball[0] + Math.cos(r.aim) * d;
      const z = r.ball[1] + Math.sin(r.aim) * d;
      pts.push(toWorld(x, aimY(x, z) + 0.03, z));
    }
    // As pieces, leaving out any that drops more than 30 cm - where the
    // line crosses a wall into water below the grass - so it breaks off at
    // the wall rather than running down its face, as the ring does.
    const pieces = [];
    for (let k = 1; k < pts.length; k++) if (Math.abs(pts[k].y - pts[k - 1].y) < 0.3) pieces.push(pts[k - 1], pts[k]);
    // The line and ring look the same every time, so their materials are
    // made once and kept: made afresh at every nudge, the graphics card
    // would rebuild the programs that draw them each time.
    this.aimLook ??= {
      far: shared(new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 1.5, gapSize: 1, transparent: true, opacity: 0.8 })),
      green: shared(new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.12, gapSize: 0.08, transparent: true, opacity: 0.8 })),
      // Pulled towards the camera so it sits on the ground it's laid over
      // rather than flickering in and out of it.
      ring: shared(
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -10, polygonOffsetUnits: -16 }),
      ),
    };
    const line = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pieces), this.putting ? this.aimLook.green : this.aimLook.far);
    line.computeLineDistances();
    this.aimGroup.add(line);
    line.renderOrder = 3;
    if (!this.putting) {
      // The ring where it ends, laid over the ground's slopes (flat, it sank
      // into a sloping green and showed as a broken C).
      const end = pts[pts.length - 1];
      const geo = new THREE.RingGeometry(2.2, 3, 40, 2).rotateX(-Math.PI / 2);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) pos.setY(i, aimY(-(end.z + pos.getZ(i)), end.x + pos.getX(i)) + 0.05);
      // Where it crosses a wall into water below the grass, it stops at
      // the wall rather than hanging down its face.
      const idx = geo.index.array;
      const keep = [];
      for (let i = 0; i < idx.length; i += 3) {
        const ys = [idx[i], idx[i + 1], idx[i + 2]].map((v) => pos.getY(v));
        if (Math.max(...ys) - Math.min(...ys) < 0.3) keep.push(idx[i], idx[i + 1], idx[i + 2]);
      }
      geo.setIndex(keep);
      const ring = new THREE.Mesh(geo, this.aimLook.ring);
      ring.position.set(end.x, 0, end.z);
      ring.renderOrder = 3;
      this.aimGroup.add(ring);
    }
    this.drawFace();
  }

  // Out of a dug bunker: a bar along the lip ahead where the aim crosses
  // it, at the height the ball has to clear, and a faint line up from the
  // ball at the launch that gets over it (as the ball leaves the sand) -
  // green if this club's usual launch does, amber if only just, red if
  // not - with the angle to see on the launch monitor by it.
  drawFace() {
    const f = this.faceHelp();
    if (!f) return;
    const r = this.me;
    const colour = { good: 0x5ee06a, close: 0xffb938, bad: 0xff5a4e }[f.tone];
    const [ax, az] = f.face.at;
    const ground0 = this.heightAt(r.ball[0], r.ball[1]);
    const lipY = ground0 + f.face.need;
    const dir = [Math.cos(r.aim), Math.sin(r.aim)];
    const side = [-dir[1], dir[0]];
    const half = 1.2;
    const mat = new THREE.MeshBasicMaterial({ color: colour, transparent: true, opacity: 0.9, depthTest: false });
    // The bar across the aim, and short posts down to the grass at its ends.
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, half * 2, 8), mat);
    bar.position.copy(toWorld(ax, lipY, az));
    bar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), toWorld(side[0], 0, side[1]).normalize());
    bar.renderOrder = 5;
    this.aimGroup.add(bar);
    for (const k of [-1, 1]) {
      const x = ax + side[0] * half * k;
      const z = az + side[1] * half * k;
      const pts = [toWorld(x, lipY, z), toWorld(x, this.heightAt(x, z), z)];
      const post = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: colour, transparent: true, opacity: 0.7, depthTest: false }));
      post.renderOrder = 5;
      this.aimGroup.add(post);
    }
    // The launch line: from the ball, at the angle needed, a little past
    // the lip.
    if (f.sand != null) {
      const t = Math.tan((f.sand * Math.PI) / 180);
      const reach = f.face.edge + 1.5;
      const pts = [];
      for (let d = 0; d <= reach + 1e-6; d += reach / 12) pts.push(toWorld(r.ball[0] + dir[0] * d, ground0 + BALL_R + d * t, r.ball[1] + dir[1] * d));
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineDashedMaterial({ color: colour, dashSize: 0.25, gapSize: 0.15, transparent: true, opacity: 0.75, depthTest: false }),
      );
      line.computeLineDistances();
      line.renderOrder = 5;
      this.aimGroup.add(line);
    }
    // The angle, in a label above the lip.
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 96;
    const ctx = canvas.getContext("2d");
    ctx.font = "bold 56px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 10;
    ctx.strokeStyle = "rgba(0,0,0,0.65)";
    const text = f.need == null ? "Too steep" : this.faceLabel(f);
    ctx.strokeText(text, 128, 48);
    ctx.fillStyle = { good: "#7ff08a", close: "#ffc55c", bad: "#ff7b70" }[f.tone];
    ctx.fillText(text, 128, 48);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    label.scale.set(1.6, 0.6, 1);
    label.position.copy(toWorld(ax, lipY + 0.7, az));
    label.renderOrder = 6;
    this.aimGroup.add(label);
  }

  // Behind the ball looking down the aim; lower and closer on the green.
  // From the ball itself (S), or up over it while an unplayable ball's
  // drops are shown.
  placeCamera(snap) {
    const r = this.me;
    if (!r) return;
    // Held by the game's video (holdView): the camera stays there, not
    // cut to the next ball.
    if (this.heldView) snap = false;
    const b = this.ball.position;
    if (this.relief || this.fromBall) {
      if (this.relief) this.overDrops(b, r);
      else this.atBall(b, r);
      this.addressLook = this.lookWant.clone();
      if (snap) {
        this.camera.position.copy(this.camWant);
        this.look.copy(this.lookWant);
      }
      return;
    }
    // The ball sits in the lower middle of the picture, clear of the
    // numbers along the bottom in bay view. Putting, low behind the ball
    // (on the green, or the putter picked off it). Otherwise, a golfer's eye
    // (sim/eye.mjs: lower and closer than it was - the owner: "like you
    // are very tall looking down").
    const back = this.putting ? 2.6 : EYE.back;
    const up = this.putting ? 1.3 : EYE.up;
    const dir = new THREE.Vector3(Math.sin(r.aim), 0, -Math.cos(r.aim)); // world direction of the aim
    this.camWant.copy(b).addScaledVector(dir, -back).add(new THREE.Vector3(0, up, 0));
    const ahead = this.putting ? Math.min(distanceToPin(this.hole, r.ball), 10) : Math.min(60, distanceToPin(this.hole, r.ball));
    this.lookWant.copy(b).addScaledVector(dir, ahead).setY(b.y - (this.putting ? 0.6 : EYE.drop));
    // Turning the aim left and right only turns the camera: its height and
    // how far down it looks are worked out once for where the ball is (the
    // owner: "left and right shouldn't change the camera angle up and
    // down"), not again for the ground in each new direction.
    const spot = `${r.ball[0].toFixed(2)},${r.ball[1].toFixed(2)},${this.putting ? "g" : ""},${this.round?.index}`;
    const held = this.addressHeld?.spot === spot ? this.addressHeld : null;
    if (held) {
      this.camWant.y = b.y + held.camUp;
      this.lookWant.y = b.y + held.lookUp;
      this.keepAboveGround(this.camWant, this.putting ? 0.8 : 1.5);
      this.addressLook = this.lookWant.clone();
      if (snap) {
        this.camera.position.copy(this.camWant);
        this.look.copy(this.lookWant);
      }
      return;
    }
    // On a real hill, look at the ground ahead rather than into it, and keep
    // the camera out of the slope behind.
    if (this.hole.mapped && !this.putting) {
      this.lookWant.y = this.worldHeight(this.lookWant.x, this.lookWant.z) + (b.y - this.worldHeight(b.x, b.z)) - 1;
      // Where the ground rises steeply ahead, looking up at the bank put the
      // ball under the numbers and filled the picture with the slope: the
      // camera looks lower (and from a little higher, if that shows more of
      // the ground ahead), so the ball stays in the picture and as much of
      // the way ahead as can be seen is (sim/teeview.mjs).
      const foot = this.worldHeight(b.x, b.z);
      const ground = [];
      for (let d = 10; d <= Math.min(300, ahead * 5); d += 10) ground.push([d, this.worldHeight(b.x + dir.x * d, b.z + dir.z * d) - foot]);
      const flat = Math.hypot(this.lookWant.x - this.camWant.x, this.lookWant.z - this.camWant.z);
      const pitch = Math.atan2(this.lookWant.y - this.camWant.y, flat);
      const v = teeView({ ground, back, up: this.camWant.y - foot, pitch, fov: this.camera.fov });
      if (v) {
        this.camWant.y += v.lift;
        this.lookWant.y = this.camWant.y + Math.tan(v.pitch) * flat;
      }
    }
    this.keepAboveGround(this.camWant, this.putting ? 0.8 : 1.5);
    this.addressHeld = { spot, camUp: this.camWant.y - b.y, lookUp: this.lookWant.y - b.y };
    this.addressLook = this.lookWant.clone();
    if (snap) {
      this.camera.position.copy(this.camWant);
      this.look.copy(this.lookWant);
    }
  }

  // Lifts a camera position clear of the ground under it.
  keepAboveGround(p, clearance) {
    if (!this.hole?.mapped) return;
    p.y = Math.max(p.y, this.worldHeight(p.x, p.z) + clearance);
  }

  // ---- Shots ---------------------------------------------------------------------

  onShot(entry) {
    const r = this.round;
    if (!r || r.finished) {
      this.onToast(this.nextCourse ? `No round going - press N to play ${this.nextCourse.name}` : "Make a course in the course designer first", 2500);
      return;
    }
    if (this.flying) this.settle();
    // A shot cuts a flyover short, and the look down the hole - and the
    // last hole's replay is no longer offered.
    this.endFlyover({ moveOn: false });
    this.endLookDown();
    this.dropLastHole();
    // Online, waiting for another bay to finish the hole: nothing to hit yet.
    if (r.waiting) {
      this.onToast(r.scrWait ? `${this.scrambleWaitWords()} - that shot wasn't played` : `${waitingWords(waitingFor(this.netGame, r.index, r.net.bay))} to finish the hole - that shot wasn't played`, 3000);
      return;
    }
    // The next hole still being built (nextHole): the shot waits for it.
    if (r.done) this.nextHole();
    // Online, the others still to be ready to go on: nothing to hit yet.
    if (r.holding) {
      this.onToast(`${this.holdingWords() ?? "Waiting for the others"} for the next hole - that shot wasn't played`, 3000);
      return;
    }
    if (this.switching?.round === r) {
      this.pendingShot = entry;
      this.onToast("Loading the next hole - your shot plays once it's up", 2500);
      return;
    }
    if (this.round.finished) return;
    // With friends, a shot during the pause after the last one belongs to
    // the next player: move on to their ball now.
    if (this.multi && (r.pending || this.me.done)) this.passTurn(true);
    // A scramble's ball to pick first: the shot can't be from anywhere yet.
    if (r.pick != null) {
      this.showPick();
      this.onToast(`${this.me.name}: pick the team's ball first (${this.pickKeys()}) - that shot wasn't played`, 3000);
      return;
    }
    // Out of the water, where it's played from is still to be chosen.
    if (this.relief?.water) {
      this.showRelief();
      this.onToast(`${this.multi ? `${this.me.name}: ` : ""}choose where to drop it first - that shot wasn't played`, 3000);
      return;
    }
    // Struck while looking along the line, or from the ball, or with an
    // unplayable ball's drops up (played as it lies): straight back behind
    // the ball.
    if (this.sections.showing || this.fromBall || this.relief) {
      this.sections.reset();
      this.fromBall = false;
      this.hideRelief({ camera: false });
      this.placeCamera(true);
    }
    const p = this.me;
    // Their first shot says how they're swinging, and so which handicap
    // they play off (course/madeupplay.js).
    this.swungBy(p, entry);
    // Worked out again from where the ball is now: a shot can come before
    // the view has moved on to it.
    this.showFlag(true);
    // As it all was before the stroke, for a mulligan (course/mulligan.js).
    const kept = beforeStroke(p, r);
    p.strokes++;
    // Where in its lie's range this strike falls: every shot out of grass
    // or sand is a little different (the game's video's in the middle, as
    // it plans them: fixedSeverity).
    const stance = p.stance ?? FLAT;
    const result = this.putting
      ? playPutt(r.hole, p.ball, entry.ball, p.aim, { weather: r.weather })
      : playShot(r.hole, p.ball, p.lie, entry.ball, p.aim, { stance, club: p.club, ground: this.settings.ground, severity: this.fixedSeverity ?? drawSeverity(this.ladderLuck("lie")), weather: r.weather, plugs: this.settings.plugs ?? DEFAULT_PLUGS, plug: p.plug ?? null, gusts: this.settings.flightGusts !== false });
    const shot = { entry, result, from: [...p.ball], lie: p.lie, stance, club: p.club, player: p, aim: p.aim, putt: this.putting };
    // The flight it flew (the lie, the weather, the ground), for the
    // recording's and the command centre's flight path - turned from the
    // hole's frame to the shot's (sim/shotflight.mjs). A putt has none.
    if (!shot.putt) this.onFlight?.({ path: result.path, flightPoints: result.flightPoints, from: shot.from, aim: p.aim });
    // Ultra: the turf it took (sim/marks.mjs); out of sand, the sand
    // (course/landings.js).
    this.marks?.divot(p.ball, p.aim, divotFor({ club: p.club, lie: p.lie, putt: shot.putt, speedMph: entry.ball.speedMph }));
    this.shotStruck(p, shot, entry.ball.speedMph);
    p.lieAfter = "";
    p.last = shot;
    p.from = { ball: [...p.ball], lie: p.lie };
    p.recordedId = null;
    p.puttFeedback = null;
    const g = this.puttGuide;
    if (shot.putt && g) {
      // Its start line against the line to the cup (the aim can be turned
      // off it with the arrows).
      const hla = entry.ball.hla + ((p.aim - g.cg.heading) * 180) / Math.PI;
      shot.feedback = puttFeedback(g.cg.green, g.cg.distance, { speedMph: entry.ball.speedMph, hla }, { holed: result.holed, fig: this.puttFigures() });
      // Followed down the green if it's long, or the ball would go small
      // (and the camera is set to follow).
      const path = result.path.map(([x, , z]) => {
        const dx = x - p.ball[0];
        const dz = z - p.ball[1];
        const c = Math.cos(g.cg.heading);
        const s = Math.sin(g.cg.heading);
        return [dx * c + dz * s, -dx * s + dz * c];
      });
      shot.follow = view.follow && followsPutt({ distance: g.cg.distance, path, fovDeg: this.camera.fov, camBack: 2.6 });
      g.struck = true;
    }
    clearGroup(this.aimGroup);
    if (this.grid) this.grid.group.visible = false;

    // Its tracer, flight and ground (a putt's along the green), in this
    // player's colour - where it's drawn (pathDrawn), as the ball is.
    const drawn = this.pathDrawn(result.path, result.flightPoints);
    const place = ([x, y, z]) => toWorld(x, y + BALL_R, z);
    this.tracer = this.tracers.add(makeShotTracer(drawn, result.flightPoints, place, { colour: tracerColour(r.players.indexOf(p)), putt: shot.putt }));
    this.beforeShot = { round: r, player: p, kept, tracer: this.tracer };
    this.tracer.userData.tracerOf = p;
    // (Kept so the hole can be drawn again for its replay once the next
    // one is up: lastHole.)
    this.tracer.userData.made = { drawn, air: result.flightPoints };
    this.tracer.userData.putt = shot.putt;
    // Its sounds as the ball gets there: each landing on whatever it lands
    // on, the water, the cup, a lip-out.
    const cues = new CueQueue(shotCues(result, { lieAt: r.hole.lieAt }));
    // A shot (not a putt) that runs onto the green: the camera closes in
    // there as it comes on, to see it run out and how near the pin it stops
    // (sim/greencam.mjs).
    const on = shot.putt ? null : greenEntry(result.path, { flightPoints: result.flightPoints, onGreen: r.hole.onGreen });
    const end = result.path.at(-1);
    const green = on && { t: on.t, view: greenView({ from: shot.from, touch: on.at, rest: [end[0], end[2]], pin: [r.hole.cup.x, r.hole.cup.z] }) };
    this.flying = { shot, elapsed: 0, index: 0, cues, green, drawn };
    // Online: the other bays' shots held for this one are shown once it
    // lands ("After your shot").
    for (const q of this.remoteFlights) q.released = true;
    // Online: its flight to the other bays now, to fly there as it flies
    // here - where it finished follows as it lands (settle), known by its
    // swing (k: the hole and stroke). (The owner: "a little bit laggy ...
    // maybe 3-4 seconds" - a shot used to go once it had landed here.)
    if (r.net) {
      shot.netK = r.index * 100 + p.strokes;
      this.netSend?.({ type: "flying", player: p.netId, hole: r.index, k: shot.netK, flight: thinPath(result.path, result.flightPoints), putt: shot.putt });
    }
    // The grass round the ball goes with it.
    showNest(this.nest, false);
    r.message = "";
    this.render();
  }

  update(dt) {
    const steps = this.steps;
    steps.start();
    // A shot's first moments: its first picture with the ball on its spot,
    // however long the strike took to work out, then no frame's step longer
    // than a normal one's until it's on its way - the camera with it
    // (sim/preflight.mjs).
    if (this.flying) {
      dt = flightStep(this.flying.elapsed, dt, { first: !this.flying.started });
      this.flying.started = true;
    }
    // The yellow glow and closing circle round the cup, sized for the camera.
    this.cupMark?.update(this.camera, dt);
    // Before a round: the camera craning down the first hole, and nothing
    // else moving.
    if (!this.round && this.idle) return this.stepIdle(dt);
    // A round's first hole still loading behind its card (nextHole): no
    // hole yet, nothing to move. (Asked for the ground under the ball's
    // shadow, it threw every frame: a report's "reading 'lieAt'".)
    if (this.round && !this.round.hole) return;
    steps.lap("other");
    // What the shots threw up, flying and falling back (look/sprays.js).
    this.sprays?.step(dt);
    steps.lap("sprays");
    if (this.flyover) this.stepFlyover(dt);
    steps.lap("flyover");
    // A putt's flag lifting out and fading as the ball sets off.
    if (this.flagSince != null) {
      this.flagSince += dt;
      setFlagLook(this.flag, flagLook(this.flagPlan, this.flagSince));
      if (this.flagSince > FLAG_FADE) this.flagSince = null;
    }
    steps.lap("other");
    // Online: the other bays' shots, flown in their colours.
    if (this.round?.net) this.stepRemoteFlight(dt);
    steps.lap("remote");
    const f = this.flying;
    if (f) {
      f.elapsed += dt;
      const path = f.shot.result.path;
      while (f.index < path.length - 1 && path[f.index + 1][3] <= f.elapsed) f.index++;
      const a = path[f.index];
      const b = path[Math.min(f.index + 1, path.length - 1)];
      const k = Math.min(1, Math.max(0, (f.elapsed - a[3]) / (b[3] - a[3] || 1)));
      const x = a[0] + (b[0] - a[0]) * k;
      const z = a[2] + (b[2] - a[2]) * k;
      // Through the air along its tracer (pathDrawn); then on what it
      // bounces and rolls over, down in sand.
      if (f.index < f.shot.result.flightPoints - 1) {
        const above = a[1] + (b[1] - a[1]) * k;
        const r = this.fitBall(above, true);
        toWorld(x, drawnHeight(f.drawn, f.index, k) + r, z, this.ball.position);
      } else this.putBall([x, z], a[1] + (b[1] - a[1]) * k);
      for (const c of f.cues.due(f.elapsed)) {
        audio.cue(c, this.ball.position);
        // What it leaves where it comes down: in sand, on the green, into
        // water (course/landings.js).
        this.shotCue(c, f.shot);
      }
      // Drawn as far as the ball has got, in the air and then along the
      // ground.
      if (this.tracer) this.tracer.userData.reveal(f.index, k);
      // Chase the ball on long shots; just watch it on putts. With the
      // camera set to stay put, it stays where you hit from and turns only
      // as far as keeps the ball in the picture.
      const p = this.ball.position;
      if (closesIn(f)) {
        // Run onto the green: in close, low, behind the line (following a
        // ball still running up) - the ball, where it stops and the pin
        // all in the picture.
        const g = f.green.view;
        const { cam: [cx, cz], look: [lx, lz] } = greenFollow([x, z], g);
        toWorld(cx, this.heightAt(cx, cz) + g.up, cz, this.camWant);
        this.keepAboveGround(this.camWant, 0.8);
        clearOfTrees(this.cameraTrees, this.camWant, p);
        toWorld(lx, this.heightAt(lx, lz), lz, this.lookWant);
      } else if (f.shot.putt && f.shot.follow) {
        // A long putt: behind the ball down the line, the cup in view.
        const pose = followPose({ start: f.shot.from, hole: [this.hole.cup.x, this.hole.cup.z], ball: [x, z] });
        const [cx, cz] = pose.cam;
        const [lx, lz] = pose.look;
        toWorld(cx, this.heightAt(cx, cz) + pose.up, cz, this.camWant);
        this.keepAboveGround(this.camWant, 0.5);
        toWorld(lx, this.heightAt(lx, lz), lz, this.lookWant);
      } else if (f.shot.putt) {
        this.lookWant.copy(p);
      } else if (view.follow) {
        const dir = new THREE.Vector3(Math.sin(this.me.aim), 0, -Math.cos(this.me.aim));
        const above = p.y - this.worldHeight(p.x, p.z);
        this.camWant.copy(p).addScaledVector(dir, -24).add(new THREE.Vector3(0, Math.max(3, above * 0.6 + 3), 0));
        this.keepAboveGround(this.camWant, 2.5);
        // Never through a tree's crown: over it, or in closer to the ball.
        clearOfTrees(this.cameraTrees, this.camWant, p);
        this.lookWant.copy(p);
      } else {
        keepInView(this.camera.position, this.addressLook ?? this.lookWant, p, this.lookWant);
      }
      if (f.index >= path.length - 1) this.settle();
    }
    steps.lap("flight");
    // A celebration can take the camera round to the flag. The last shot's
    // tracer fades as it goes: flying out from under a hole-out, the camera
    // would pass close by it, and it shows as a broad band. It's back,
    // faint, with the next shot.
    if (!f && this.celebration.steering) {
      this.celebration.steer(this.camWant, this.lookWant);
      this.keepAboveGround(this.camWant, 1.2);
      clearOfTrees(this.cameraTrees, this.camWant, this.lookWant);
      if (this.tracer?.visible) this.tracer.userData.fade(dt * 2);
    }
    steps.lap("celebration");
    // Online, a friend watched: the camera where they'd stand (course/watch.js).
    if (this.watching) this.stepWatch();
    // Held by the game's video (holdView): over everything else.
    if (this.heldView) {
      this.camWant.copy(this.heldView.cam);
      this.lookWant.copy(this.heldView.look);
    }
    steps.lap("other");
    this.stepIdeal();
    steps.lap("read");
    // Looking along the putt's line from a stop, or on the way: the section
    // view has the camera. Otherwise it eases to where it wants to be.
    if (this.sections.drive(dt)) this.look.copy(this.sections.look);
    else {
      // (Closer behind the ball in a flyover, which moves quicker; in to the
      // green a little quicker than the chase.)
      const lerp = 1 - Math.exp(-dt * (this.flyover ? 3 : closesIn(f) ? 2.2 : f && !f.shot.putt ? 1.6 : 2.5));
      // Over the trees in its way, not through them (view.js easePast).
      easePast(this.cameraTrees, this.camera.position, this.camWant, lerp);
      this.look.lerp(this.lookWant, 1 - Math.exp(-dt * 4));
      this.camera.lookAt(this.look);
    }
    if (this.lookDown) this.stepLookDown(dt);
    steps.lap("camera");
    if (this.grid?.group.visible) {
      // Turned to a new aim once it's been left there a moment.
      // (By the clock: a frame's dt is capped, so a slow picture would wait longer.)
      const still = (performance.now() - (this.aimTurnedAt ?? 0)) / 1000;
      if (!this.flying && this.me && regridDue({ builtAim: this.gridAim, aim: this.me.aim, still })) this.showGrid({ alongAim: true });
      this.grid?.update(dt, this.camera);
    }
    steps.lap("grid");
    if (this.ball) this.ballShadow.update(this.ball.position, this.worldSurface, this.ballDraw ?? this.ball.geometry.parameters.radius);
    // The tufts see-through round the ball (look/groundbits.js).
    // (Not while it flies: the tufts under it would shrink as it passed.)
    if (this.ball) setTuftClear(this.ball.position.x, this.ball.position.z, this.ball.visible && !this.flying);
    // The other players' markers keep about the size they'd have from close
    // by, so one 200 yards away still shows as more than a speck.
    for (const m of this.markers?.children ?? []) m.scale.setScalar(Math.min(12, Math.max(1, m.position.distanceTo(this.camera.position) / m.userData.near)));
    steps.lap("other");
    // Riding to the next tee: the cart and the camera with it.
    if (this.ride) this.stepRide(dt);
    steps.lap("ride");
    this.camera.updateMatrixWorld();
    // The tufts near the camera drawn in full, the rest as one triangle
    // each (look/tuftfield.js): gathered round where it now is.
    updateTuftFields(this.camera);
    steps.lap("ground");
    this.celebration.update(dt, this.camera);
    steps.lap("celebration");
  }

  // A pause in play (ms), as long as the pace has it now.
  paced(ms) {
    return ms * (this.pace > 0 ? this.pace : 1);
  }

  // The shot has finished: penalties, holing out, the next position.
  settle() {
    const f = this.flying;
    if (!f) return;
    this.flying = null;
    if (this.tracer) this.tracer.userData.revealAll();
    const r = this.round;
    const p = f.shot.player;
    const res = f.shot.result;
    if (f.shot.feedback) p.puttFeedback = f.shot.feedback;
    // The ideal line after the putt, with it on.
    this.drawIdeal();
    // Longer to look at the ideal line before the view moves on.
    const pause = f.shot.putt && this.idealShowing ? 3500 : 1400;
    this.record(f.shot, r);
    // (A Postal match's round: kept as each shot lands - course/ladderpostal.js.)
    if (r.ladder) this.keepPostal(r);
    if (r.postSeason) this.keepPostSeason(r);
    // What the lie did to it, until this player's next shot.
    p.lieAfter = afterLine(f.shot.lie, f.shot.stance, res.lieOutcome, { carry: res.carryYards });
    p.shots.push(res.rest);
    let holed = res.holed;
    let text = "";
    // Into a penalty area's water: the stroke, and the player chooses where
    // it's played from (course/relief.js waterChoices) - meanwhile, and
    // where nobody's choosing, the game's own pick.
    let water = null;
    if (res.penalty) {
      p.strokes++;
      p.ball = res.penalty.drop;
      p.shots.push(p.ball);
      p.lie = r.hole.lieAt(...p.ball);
      p.plug = null;
      text = res.penalty.kind === "water" ? penaltyWords(res.penalty) : "Lost in the trees - one stroke penalty, drop";
      water = res.penalty.kind === "water" ? this.waterChoices(p, res.penalty) : null;
      if (water) text = water.text;
    } else if (!holed) {
      p.ball = res.rest;
      p.lie = res.lie;
      // Plugged in the sand: until it's played out (sim/sand.mjs) - its
      // crater round it.
      p.plug = res.plug ?? null;
      if (p.plug) this.shotPlugged(p.ball, p.plug);
      const left = distanceToPin(r.hole, p.ball);
      // A gimme: close enough on the green counts as the next putt holed.
      // (A ladder's match: the ladder's gimmes. A season by post's event is
      // stroke play: every putt holed.)
      const gimme = r.ladder ? r.ladder.gimme : r.postSeason ? 0 : this.settings.gimme;
      if (puttGiven({ lie: p.lie, leftM: left, gimmeFeet: gimme, strokes: p.strokes, maxStrokes: MAX_STROKES })) {
        p.strokes++;
        holed = true;
        text = "Given";
      } else if (p.lie === "green") {
        text = `On the green - ${fmt(left / FOOT, 0)} ft`;
      } else {
        text = `${LIE_NAMES[p.lie] ?? p.lie} - ${fmt(left / YARD, 0)} yds to go`;
      }
      // How far it ran out, so a release (or a check) can be seen.
      const rolled = f.shot.putt ? "" : rollNote(res);
      if (rolled && text !== "Given") text += `, ${rolled}`;
      if (res.plug) text = `${res.plug === "buried" ? "Plugged right in" : "Plugged - a fried egg"} - ${text}`;
      if (res.skipped) text = `Skipped off the water${res.skipped > 1 ? " twice" : ""}! ${text}`;
    }
    // A tree in the way: "Hit a tree - Rough - 142 yds to go".
    const tree = treeNote(res);
    if (tree && text && text !== "Given") text = `${tree} - ${text}`;
    if (!holed && p.strokes >= MAX_STROKES) {
      holed = true;
      text = "Picked up";
      water = null;
    }
    // With friends, whose shot it was.
    const who = (t) => (this.multi ? `${p.name}: ${t}` : t);
    // A scramble: the shot is one of the team's from its ball; holed, the
    // hole's over for the whole team at that score.
    if (r.scr) {
      const me = r.players.indexOf(p);
      const k = r.scr.findIndex((t) => t.members.includes(me));
      if (k >= 0) {
        r.scr[k] = scrambleHit(r.scr[k], me, { ball: p.ball, lie: p.lie, strokes: p.strokes, holed });
        if (r.net) r.scrLocal.push(holed ? { p: p.netId, s: p.strokes, h: true } : { p: p.netId, s: p.strokes, b: [...p.ball], l: p.lie });
        if (holed) {
          for (const m of r.scr[k].members) {
            const q = r.players[m];
            if (q === p) continue;
            q.strokes = p.strokes;
            q.scores[r.index] = p.strokes;
            q.done = true;
          }
        }
      }
    }
    if (holed) {
      this.finishHole(p, { text, shot: f.shot });
      return;
    }
    r.message = who(text);
    this.netSend?.({ type: "shot", player: p.netId, hole: r.index, strokes: p.strokes, ball: p.ball, lie: p.lie, text, flight: thinPath(res.path, res.flightPoints), putt: f.shot.putt, k: f.shot.netK ?? null });
    // Where from out of the water: the card, before anything moves on
    // (takeRelief carries on from there).
    if (water) {
      this.waterRelief(p, water);
      return;
    }
    if (this.multi) {
      // The same pause, then the view moves on to whoever plays next.
      r.pending = true;
      clearTimeout(this.turnTimer);
      this.turnTimer = setTimeout(() => {
        if (this.round === r && !this.flying && r.pending) this.passTurn();
      }, this.paced(pause));
      this.render();
      return;
    }
    // A pause to see where it finished, then set up the next shot (club,
    // aim and stance for where the ball lies) - settingUp meanwhile, which
    // the game's video waits on before it plans the next.
    const token = (this.setUpToken = (this.setUpToken ?? 0) + 1);
    this.settingUp = true;
    setTimeout(() => {
      if (this.setUpToken === token) this.settingUp = false;
      // Staying put means no fly-through to the next spot: cut to it.
      if (this.round === r && !this.flying && !r.done && !r.finished) this.newPosition(!view.follow);
    }, this.paced(pause));
    this.render();
  }

  // A player's hole over - holed, the next putt given, or picked up: the
  // score, the celebration, the other bays told, and on to whoever's next
  // or the next hole. shot: the stroke it ended on ({ lie, from, putt,
  // result }), or null when it ended between strokes (picked up once an
  // unplayable ball's penalty took it to the most a hole allows).
  finishHole(p, { text, shot = null }) {
    const r = this.round;
    const res = shot?.result ?? null;
    const spec = this.course.holes[r.index].spec;
    const who = (t) => (this.multi ? `${p.name}: ${t}` : t);
    p.scores[r.index] = p.strokes;
    p.done = true;
    const pickedUp = text === "Picked up";
    const name = pickedUp ? "Picked up" : scoreName(p.strokes, spec.par);
    r.message = who(`${name}!`.replace("!!", "!"));
    // Holed, it lies where its path ends, in the bottom of the cup.
    const end = res?.path?.at(-1);
    if (res?.holed) this.putBall(end ? [end[0], end[2]] : [r.hole.cup.x, r.hole.cup.z], end ? end[1] : -0.1);
    // What made it notable: the length of the putt that dropped, a chip-in
    // or holed-out shot, or a gimme.
    const desc = celebrationFor(
      finishFacts({
        strokes: p.strokes,
        par: spec.par,
        how: pickedUp ? "picked up" : text === "Given" ? "given" : "holed",
        lie: shot?.lie ?? p.lie,
        fromMetres: distanceToPin(r.hole, shot?.from ?? p.ball),
        leftMetres: distanceToPin(r.hole, p.ball),
      }),
    );
    if (this.multi) desc.title = `${desc.title} - ${p.name}`;
    this.celebrate(desc);
    // The hole is over once everyone has finished it: a flyover of it is
    // offered, following whoever just finished - and, once the
    // celebration below has had its moment, played by itself (unless
    // it's switched off or there's nothing worth watching: sim/flyover.mjs).
    this.netSend?.({ type: "holed", player: p.netId, hole: r.index, score: p.strokes, text: `${scoreName(p.strokes, spec.par)}${pickedUp ? " (picked up)" : ""}`, flight: pickedUp || !res ? null : thinPath(res.path, res.flightPoints), putt: !!shot?.putt, k: shot?.netK ?? null });
    r.done = holeFinished(r.players);
    r.pending = !r.done;
    // Online, this bay done but not every bay: wait (the others' last
    // scores arrive by applyNet, which moves on).
    if (!r.done && r.net && r.players.every((q) => q.remote || q.done)) {
      r.pending = false;
      r.waiting = true;
    }
    // With friends, what the hole meant in the game: "Anna wins the hole -
    // 1 up", "Ben wins 2 skins", "Anna 3 pts · Ben 2 pts".
    if (r.done && this.multi) {
      const game = this.game();
      const words = game.shown ? holeWords(r.format, r.players, game.holes, game.hs, r.index, r.teamOf) : null;
      if (words) setTimeout(() => this.round === r && this.onToast(words, 4500), 1800);
    }
    if (r.done) {
      const auto = autoFlyover({
        on: this.settings.autoFlyover,
        how: pickedUp ? "picked up" : text === "Given" ? "given" : "holed",
        strokes: this.strokesOf(p),
        lastHole: this.lastOfRound(r),
      });
      this.offerFlyover(p, { auto });
    }
    // A bigger celebration gets longer before the next hole (or the next
    // player); N skips it. Away in another mode, it waits for the course
    // to be back on screen, so the last hole's round celebration (and its
    // sound) isn't spent over the range.
    clearTimeout(this.nextTimer);
    this.nextTimer = setTimeout(() => {
      // (A flyover under way waits for it to end: endFlyover.)
      if (this.round !== r || this.flying || this.flyover) return;
      if (!r.done && !r.pending) return;
      // The flyover in place of the next hole: the wait for that starts
      // again when it ends (endFlyover), so the two waits don't add up.
      // Only on screen - away in another mode it would play to nobody.
      if (r.done && this.isActive && this.flyoverOffer?.auto && this.startFlyover(this.flyoverOffer.slot).done) return;
      if (this.isActive) this.moveOn();
      else this.moveOnWhenBack = true;
    }, this.paced(desc.hold * 1000));
    this.render();
  }

  // For the player's stats (recorder.js): the shot against the flag, and
  // across the line it was aimed on.
  record(shot, r) {
    const res = shot.result;
    const cup = [r.hole.cup.x, r.hole.cup.z];
    const [from, rest] = [shot.from, res.rest];
    const toPin = distanceToPin(r.hole, from) / YARD;
    const along = [cup[0] - from[0], cup[1] - from[1]];
    const len = Math.hypot(...along) || 1;
    const long = ((rest[0] - cup[0]) * along[0] + (rest[1] - cup[1]) * along[1]) / len / YARD;
    // And across that line, right +: which side of the flag it finished
    // (sim/insights.mjs, greens missed to one side).
    const side = ((rest[0] - cup[0]) * -along[1] + (rest[1] - cup[1]) * along[0]) / len / YARD;
    const d = [rest[0] - from[0], rest[1] - from[1]];
    const offline = (-Math.sin(shot.aim) * d[0] + Math.cos(shot.aim) * d[1]) / YARD;
    const flight = res.flightPoints > 1 ? flightFacts(res.path, res.flightPoints) : { apex: 0, descent: null };
    const spec = this.course.holes[r.index].spec;
    // Landing well above or below where it was hit from, or off a sloping
    // stance, changes the carry: kept, but out of the club's numbers. So
    // does a tree it met on the way.
    const hilly = !!r.hole.green.terrain && res.firstBounce;
    const rise = hilly ? r.hole.heightAt(res.firstBounce[0], res.firstBounce[1]) - r.hole.heightAt(from[0], from[1]) : 0;
    const stance = shot.player.stance ?? FLAT;
    // A breezy day's shots, too: their carry isn't the club's.
    const w = r.weather;
    // Kept for the round card, as the stats keep it (sim/roundstats.mjs).
    shot.player.log?.push({
      t: Date.now(),
      g: { k: r.scr ? "scramble" : "course", id: r.id, hole: spec.number, par: spec.par },
      c: shot.putt ? "PT" : shot.club,
      sw: shot.putt ? "putt" : toPin <= 60 ? "chip" : "full",
      lie: shot.lie,
      tg: { d: toPin, f: res.holed ? 0 : distanceToPin(r.hole, rest) / YARD, made: !!res.holed || undefined },
      to: res.lie,
      ...(res.penalty?.kind ? { pen: res.penalty.kind } : {}),
    });
    const recorded = this.onRecord?.({
      factsKey: shot.entry?.factsKey,
      uneven: Math.abs(rise) > 3 || Math.abs(stance.slope ?? 0) + Math.abs(stance.side ?? 0) > 2 || res.trees?.length || (!shot.putt && windy(w?.wind)) ? true : undefined,
      // (And how much of it was into the shot, mph - helping is negative -
      // for the wind tips: sim/insights.mjs.)
      air: w ? { temperatureC: w.temperatureC, altitudeM: w.altitudeM, humidity: w.humidity, windMph: w.wind.mph, windFrom: w.wind.from, headMph: w.wind.mph > 0 ? components(w.wind, holeBearing(r.hole) + (shot.aim * 180) / Math.PI).head : undefined } : undefined,
      player: shot.player.name,
      club: shot.putt ? "PT" : shot.club,
      swing: shot.putt ? "putt" : undefined,
      ball: shot.entry.ball,
      result: { carry: shot.putt ? 0 : (res.carryYards ?? 0), total: Math.hypot(...d) / YARD, offline, apex: flight.apex, descent: flight.descent },
      target: { distance: toPin, finish: res.holed ? 0 : distanceToPin(r.hole, rest) / YARD, long: res.holed ? 0 : long, side: res.holed ? 0 : side, made: !!res.holed },
      toPin,
      intended: toPin,
      lie: shot.lie,
      // Where it came to rest ("cup" holed) and a penalty it cost, for the
      // round stats: fairways, greens in regulation, putts, penalties.
      rest: res.lie,
      penalty: res.penalty?.kind,
      // A scramble's shots are each player's own (their club numbers count),
      // but its holes aren't anyone's own round: not "course", so they're
      // in no player's rounds or handicap.
      game: { kind: r.scr ? "scramble" : "course", id: r.id, course: this.course.name, hole: spec.number, par: spec.par },
    });
    // Its id in the stats once it's there (null if it isn't recorded), for
    // a penalty that comes after: the ball called unplayable where it lies.
    shot.player.recordedId = Promise.resolve(recorded)
      .then((reply) => reply?.id ?? null)
      .catch(() => null);
  }

  // N: on to the next hole once this one's done. With friends, it also
  // cuts short the wait before the next player's turn.
  // With no round going (or the last one over), N starts one: the course
  // picked in the panel. After a round, the first N clears its celebration
  // and the next one starts again.
  next() {
    // N in a flyover: it ends, and N does what it does after a hole.
    this.endFlyover({ moveOn: false });
    if (this.round?.waiting) {
      this.onToast(`${waitingWords(waitingFor(this.netGame, this.round.index, this.round.net.bay))} to finish the hole`, 2500);
      return;
    }
    const action = nextAction({ round: this.round, flying: !!this.flying, celebrationShowing: this.celebration.showing, multi: this.multi });
    if (action === "clear") {
      this.celebration.clear();
      this.render();
    } else if (action === "start") {
      const c = this.nextCourse;
      if (!c) this.onToast("Make a course in the course designer first", 2500);
      else this.startRound(c.id);
    } else if (action === "hole") {
      clearTimeout(this.nextTimer);
      this.nextHole();
    } else if (action === "turn") {
      clearTimeout(this.nextTimer);
      this.passTurn(true);
    }
  }

  testShot() {
    const r = this.round;
    if (!r || r.finished) {
      this.onToast(this.nextCourse ? `Press N to play ${this.nextCourse.name}` : "Make a course in the course designer first", 2500);
      return null;
    }
    if (r.done) this.nextHole();
    if (r.holding) {
      this.onToast(`${this.holdingWords() ?? "Waiting for the others"} for the next hole`, 2500);
      return null;
    }
    // The test shot is for whoever plays next.
    if (this.multi && (r.pending || this.me.done)) this.passTurn(true);
    const p = this.me;
    return testShotFor(r.hole, p.ball, p.lie, p.club, Math.random, this.puttIdealNow(p.ball));
  }

  // ---- Panel, map, overlay -------------------------------------------------------

  // Keys the course keeps for itself: 1-8 for a scramble's pick.
  onKey(key) {
    if (this.round?.pick == null || !/^[1-8]$/.test(key)) return false;
    this.pickBall(Number(key) - 1);
    return true;
  }

  // With friends, whose turn it is ("Anna to play"), or who's next while
  // the last shot is still being looked at. Nothing playing alone.
  turnText() {
    const r = this.round;
    if (!this.multi || r.finished || r.done) return "";
    const dot = (p) => `<span class="player-dot" style="background:${esc(p.colour)}"></span>`;
    if (r.pick != null && !r.pending) return `${dot(this.me)}<b>${esc(this.me.name)}</b> picks the team's ball (${this.pickKeys()})`;
    if (r.pending || this.me.done) {
      const next = r.players[this.toPlay];
      return `${dot(next)}${esc(next.name)} next`;
    }
    return `${dot(this.me)}<b>${esc(this.me.name)}</b> to play`;
  }

  stats() {
    // (A friend watched online: their numbers - course/watch.js.)
    if (this.watching) return this.watchStats();
    const r = this.round;
    const p = this.me;
    const toPin = distanceToPin(r.hole, p.ball);
    const pars = this.course.holes.map((h) => h.spec.par);
    const out = [
      this.putting ? { label: "To the hole", value: fmt(toPin / FOOT, 0), unit: "ft", accent: true } : { label: "To the pin", value: fmt(toPin / YARD, 0), unit: "yds", accent: true },
      { label: "Club", value: this.putting ? "Putter" : clubName(p.club) },
      { label: "Lie", value: LIE_NAMES[p.lie] ?? LIES[p.lie]?.name ?? p.lie },
      ...(() => {
        // Out of a dug bunker: the launch the face needs, green if this
        // club gets out, amber if only just, red if it doesn't.
        const f = this.faceHelp();
        if (!f) return [];
        return [{ label: "Face needs", value: this.faceLabel(f), unit: f.need ? "launch" : "", tone: f.tone }];
      })(),
      ...(() => {
        // How much higher or lower the pin is, on real ground.
        const rise = r.done || p.done ? 0 : riseToPin(r.hole, p.ball);
        return Math.abs(rise) >= 1 ? [{ label: "Pin", value: `${rise > 0 ? "+" : "-"}${fmt(Math.abs(rise), 0)}`, unit: "m" }] : [];
      })(),
      ...this.weatherTiles(toPin),
      { label: "Strokes", value: String(p.strokes) },
      { label: "Score", value: toPar(p.scores, pars) },
    ];
    const last = p.last?.result;
    if (last && last.flightPoints > 1) out.push({ label: "Last shot", value: `${fmt(last.carryYards, 0)} / ${fmt(last.totalYards, 0)}`, unit: "yds" });
    return out;
  }

  // Where the camera will go in the move under way, for which trees are
  // drawn near (look/trees.js updateTreeDetail): a flyover's whole path, or
  // the shot's flight (the chase camera follows the ball) with the fan it
  // was got ready for, as world [x, z] points - the same array for as long
  // as the move lasts. At address, that fan (readyPlan); null for none.
  treePath() {
    if (!this.round && this.idle) return this.idle.treePath;
    const fo = this.flyover;
    if (fo) {
      if (!fo.treePath) {
        fo.treePath = [];
        for (let t = 0; t <= fo.plan.total; t += 0.5) {
          const at = flyoverAt(fo.plan, t);
          if (at.done) break;
          fo.treePath.push([at.cam[0], at.cam[2]], [at.ball[0], at.ball[2]]);
        }
      }
      return fo.treePath;
    }
    const f = this.flying;
    if (!f) return this.readyPlan();
    if (f.shot.putt) return null;
    return (f.treePath ??= withFlight(this.readyPlan(), f.shot.result.path.filter((_, i, a) => i % 4 === 0 || i === a.length - 1).map(([x, , z]) => [z, -x])));
  }

  // Where the player stands, for which trees are drawn close up
  // (look/trees.js): the ball at address, kept as it was all through its
  // shot, in world [x, z]; null in a flyover or with no round (the
  // camera's own place is used).
  treeStand() {
    if (!this.round || this.flyover) return null;
    const p = this.me;
    if (!this.flying && p?.ball) {
      const w = toWorld(p.ball[0], 0, p.ball[1]);
      this.standAt = [w.x, w.z];
    }
    return this.standAt ?? null;
  }

  // At address, where this shot is likely to go: a fan of lines along the
  // aim, as far as the club goes and a bit further (the player's own carry
  // with it, if longer than the bag's), so the trees the flight will pass
  // are made near while the ball waits, not as it's struck
  // (sim/preflight.mjs). The same object while nothing about it changes.
  // null for a putt, or with no shot to play.
  readyPlan() {
    const r = this.round;
    const p = this.me;
    if (!r?.hole || r.done || !p || p.done || this.putting) return null;
    const spot = `${r.index}|${r.turn ?? 0}|${p.ball[0].toFixed(1)}|${p.ball[1].toFixed(1)}`;
    const key = `${spot}|${p.club}`;
    if (this.readyKey !== key) {
      this.readyKey = key;
      this.readyLength = fanLength(Math.max(BAG[p.club]?.carry ?? 150, ownCarry(p.name, p.club) ?? 0) * YARD);
    }
    this.ready = readyFan(this.ready, { spot, from: p.ball, aim: p.aim, length: this.readyLength, phone: PHONE });
    return this.ready.paths;
  }

  // The game's video's camera (showreel.js): held at `view` - { at: [x,
  // z, up], look: [x, z, up] } in the hole's frame, up in metres above
  // the ground there - over wherever the game would put it, whatever's
  // flying, until let go (null: back to the game's, cut there). cut: there
  // at once rather than moving to it.
  holdView(view = null, { cut = false } = {}) {
    if (!view) {
      if (!this.heldView) return;
      this.heldView = null;
      this.placeCamera(true);
      return;
    }
    const world = ([x, z, up]) => toWorld(x, this.heightAt(x, z) + up, z);
    const cam = world(view.at);
    this.keepAboveGround(cam, 1.2);
    this.heldView = { cam, look: world(view.look) };
    if (!cut) return;
    this.camWant.copy(this.heldView.cam);
    this.lookWant.copy(this.heldView.look);
    this.camera.position.copy(this.camWant);
    this.look.copy(this.lookWant);
    this.camera.lookAt(this.look);
  }

  // The hole's wind, for the scenery (app.js's frame): the flags, clouds
  // and ponds show it (look/weatherlook.js) - limp in a calm, streaming in
  // a strong wind - its gusts on a clock seeded by the round. null with no
  // round (still air).
  // The round's sky goes with it (look/weatherlook.js): its haze (a misty
  // morning lifting over the first holes), whether a shower is falling -
  // which changes only between shots, never with the ball in the air - and
  // the cloud shadows faded out while putting.
  sceneryWind() {
    const r = this.round;
    const w = r?.weather?.wind;
    if (!w || !r.hole) return null;
    const c = r.weather;
    if (!this.flying || this.shower?.round !== r.id) {
      const shots = r.players.reduce((a, p) => a + p.scores.slice(0, Math.max(0, r.index)).reduce((b, n) => b + (n ?? 0), 0) + (p.strokes ?? 0), 0);
      this.shower = { round: r.id, raining: rainingAt(c.sky, c.seed, shots) };
    }
    const sky = { kind: c.sky, seed: c.seed, raining: this.shower.raining, haze: hazeFor(c.sky, c.temperatureC, r.index), dry: dryFor(c.sky, c.temperatureC), shade: this.putting ? 0 : 1 };
    return { mph: w.mph ?? 0, yaw: flagYaw(w, holeBearing(r.hole)), seed: Math.round((w.from ?? 0) * 1000 + (w.mph ?? 0) * 10) + (r.index ?? 0) * 101 + 1, sky };
  }

  // The wind as the shot sees it (an arrow the way it blows, up the screen
  // being the way you're aimed) and what the distance plays like in it and
  // up or down the slope (as the swing pad's line has it: sim/swingguide.mjs)
  // - off the green, while there's a shot to play.
  weatherTiles(toPin) {
    const r = this.round;
    const p = this.me;
    const w = r.weather;
    if (!w || this.putting || r.done || p.done) return [];
    const bearing = holeBearing(r.hole) + (p.aim * 180) / Math.PI;
    const out = [];
    if (w.wind.mph >= 1) out.push({ label: "Wind", value: `${windArrow(arrowAngle(w.wind, bearing))} ${Math.round(w.wind.mph)}`, unit: `mph ${windWords(w.wind, bearing).replace(/^\d+ mph,? ?/, "")}`.trim() });
    const plays = playsLike((toPin + riseToPin(r.hole, p.ball)) / YARD, w.wind, bearing, w.temperatureC);
    if (Math.abs(plays - toPin / YARD) >= 2) out.push({ label: "Plays like", value: fmt(plays, 0), unit: "yds" });
    return out;
  }

  // The hole's map for the recording's mini map (compositor.js): the hole,
  // and the balls, shots and aim as the game window's map has them; a key
  // that changes when any of it does. Null with no round going.
  mapInfo() {
    const r = this.round;
    if (!r?.hole || !this.me) return null;
    const extras = this.mapExtras();
    return { layout: r.hole.layout, extras, key: `${r.id}|${r.index}|${JSON.stringify(extras)}` };
  }

  mapExtras() {
    const r = this.round;
    const p = this.me;
    const reach = this.putting ? distanceToPin(r.hole, p.ball) : (BAG[p.club]?.carry ?? 150) * YARD;
    return {
      ball: p.ball,
      shots: p.shots,
      aim: r.done || p.done ? null : { from: p.ball, to: [p.ball[0] + Math.cos(p.aim) * reach, p.ball[1] + Math.sin(p.aim) * reach] },
      // The other players' balls, in their colours.
      others: this.multi ? r.players.filter((o, i) => i !== r.turn && !o.done && o.strokes > 0).map((o) => ({ ball: o.ball, colour: o.colour })) : [],
      // An unplayable ball's places to drop, numbered as the card has them
      // - or, a spot being chosen, it and its relief area.
      ...this.dropMapExtras(),
    };
  }

  drawMaps() {
    const r = this.round;
    const extras = this.mapExtras();
    // The yardages two sizes bigger in bay view, to read from the mat.
    const wide = !!this.mapWide && !!this.crop?.box;
    drawHole(this.mapCanvas, r.hole.layout, { ...extras, labelScale: 2.2, wide, box: wide ? this.crop.box : null, neighbours: wide ? this.crop.neighbours : null });
    if (this.multi) this.drawStandings(this.standingsCanvas);
    const panelMap = this.panel.querySelector("#course-panel-map");
    if (panelMap) drawHole(panelMap, r.hole.layout, extras);
  }

  // Under the bay view's map, with friends, a compact scoreboard: each
  // player's score against par and strokes on this hole, the one to play
  // marked.
  drawStandings(canvas) {
    const r = this.round;
    const pars = this.course.holes.map((h) => h.spec.par);
    const game = this.game();
    // Big enough to read from the mat, as the map's yardages are; a little
    // closer with more than four, so eight still fit under the map.
    const big = r.players.length <= 4;
    const line = big ? 28 : 22;
    const h = 8 + r.players.length * line;
    // Sized to the players; the CSS height follows at the same scale.
    if (canvas.height !== h) canvas.height = h;
    canvas.style.height = `calc(var(--map-w) * ${h / canvas.width})`;
    const ctx = canvas.getContext("2d");
    const top = 0;
    const turn = this.toPlay;
    ctx.clearRect(0, 0, canvas.width, h);
    ctx.fillStyle = "rgba(10, 20, 12, 0.8)";
    ctx.fillRect(0, top, canvas.width, h);
    ctx.font = `bold ${big ? 20 : 17}px system-ui, sans-serif`;
    ctx.textBaseline = "middle";
    // Online, a live leaderboard: everyone by where they stand, with their
    // places (sim/netresults.mjs boardOrder); else in the order they play.
    const rows = r.net ? boardOrder(r.players, pars, game) : r.players.map((_, i) => ({ i, place: null }));
    rows.forEach(({ i, place }, k) => {
      const p = r.players[i];
      const y = top + 4 + line * k + line / 2;
      if (i === turn && !r.finished && !r.done) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
        ctx.fillRect(0, y - line / 2, canvas.width, line);
      }
      ctx.fillStyle = p.colour;
      ctx.beginPath();
      ctx.arc(12, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.textAlign = "left";
      const name = p.name.length > 10 ? `${p.name.slice(0, 9)}…` : p.name;
      ctx.fillText(place ? `${place} ${name}` : name, 24, y);
      ctx.textAlign = "right";
      const now = p.scores[r.index] ?? (p.strokes || "-");
      // The game's standing (points, holes up, skins, net) where it says
      // more than the score against par.
      const row = game?.shown ? game.st.byPlayer[i] : null;
      ctx.fillText(`${row ? row.text : toPar(p.scores, pars)}  ${now}`, canvas.width - 10, y);
    });
    ctx.textAlign = "left";
  }

  renderCard() {
    this.panel.querySelector("#course-card").innerHTML = this.scorecardHtml();
  }

  // The round's scorecard so far: the panel's, and the card after each hole
  // (showHoleCard).
  scorecardHtml() {
    const r = this.round;
    const holes = this.course.holes;
    const pars = holes.map((h) => h.spec.par);
    const multi = this.multi;
    const half = (from, to, label) => {
      const idx = holes.slice(from, to).map((_, i) => from + i);
      if (!idx.length) return "";
      const sum = (f) => idx.reduce((a, i) => a + (f(i) ?? 0), 0);
      const cell = (p) => (i) => {
        const s = p.scores[i];
        const par = holes[i].spec.par;
        const cls = s == null ? "" : s < par ? "under" : s > par ? "over" : "level";
        return `<td class="${cls} ${i === r.index ? "here" : ""}">${s ?? (i === r.index ? p.strokes || "" : "")}</td>`;
      };
      // Playing alone the row is just "Score"; with friends a row each,
      // named, the one to play highlighted.
      const row = (p, k) => {
        const head = multi ? `<td class="player-name"><span class="player-dot" style="background:${esc(p.colour)}"></span>${esc(p.name)}</td>` : `<td>Score</td>`;
        const cls = multi && k === this.toPlay && !r.finished && !r.done ? ` class="turn"` : "";
        return `<tr${cls}>${head}${idx.map(cell(p)).join("")}<td>${sum((i) => p.scores[i]) || ""}</td></tr>`;
      };
      return `<tr><th>Hole</th>${idx.map((i) => `<th>${i + 1}</th>`).join("")}<th>${label}</th></tr>
        <tr><td class="muted">Par</td>${idx.map((i) => `<td class="muted">${holes[i].spec.par}</td>`).join("")}<td class="muted">${sum((i) => holes[i].spec.par)}</td></tr>
        ${r.players.map(row).join("")}`;
    };
    const played = Math.max(...r.players.map((p) => p.scores.filter((s) => s != null).length));
    const game = this.game();
    const summary = multi
      ? game.shown
        ? `${FORMAT_NAMES[r.format]}${r.handicaps ? "" : ", no handicaps"}: ${esc(game.st.line || "-")}`
        : standings(r.players, pars).map((t) => `${esc(t.name)} ${t.played ? `${t.total} (${t.toPar})` : "-"}`).join(" · ")
      : toPar(r.players[0].scores, pars);
    return `<table class="scorecard${multi ? " multi" : ""}">${half(0, 9, "Out")}${half(9, 18, "In")}</table>
      <p class="muted small">${played} hole${played === 1 ? "" : "s"} played - ${summary}</p>`;
  }

  overlay() {
    const r = this.round;
    if (!r?.hole) return { title: "Course", note: this.listed ? idleNote(this.nextCourse, { keys: this.keysShown() }) : "", stats: [] };
    const spec = this.course.holes[r.index].spec;
    const p = this.me;
    // A finished hole's score is on the celebration's banner, and stays off
    // the top line until the next hole (rather than flashing up as the
    // banner goes); the hole note makes way for the banner too. After the
    // last hole, "Round complete" comes back once the round's banner goes.
    const quiet = this.celebration.showing || (r.done && !r.finished);
    return {
      club: r.done || p.done ? null : this.onGreen ? "PT" : p.club,
      // With friends, the name of whoever's ball is in play goes by the
      // club.
      player: this.multi && !r.finished && !r.done && !p.done ? { name: p.name, colour: p.colour } : null,
      title: quiet ? "" : r.finished ? "Round complete" : r.message && !this.flying ? esc(r.message) : "",
      note: quiet
        ? ""
        : r.finished
          ? this.playAgainText()
          : this.holeNote(spec),
      lie: quiet || r.finished ? [] : this.lieLines(),
      // The lie of the land, drawn (the words for it are in the note).
      stance: quiet || r.finished || !this.stanceText() ? null : (p.stance ?? null),
      stats: this.stats(),
      guide: quiet ? [] : this.puttLines(),
      // Who's on this hole with you and their strokes on it: friends, and
      // a season's playing partners (course/season.js holeGroup).
      group: quiet ? null : this.holeGroup(),
      // The club suggested for this shot (This shot says it when another's
      // in hand).
      suggest: quiet || r.finished || r.done || p.done || this.onGreen || this.flying || this.suggested?.who !== p.name ? null : this.suggested.club,
    };
  }

  // After a round: what N does next.
  playAgainText() {
    const c = this.nextCourse ?? this.course;
    return playAgainNote(c.name, { again: c.id === this.course.id, keys: this.keysShown() });
  }

  // Whether there's a keyboard to name keys on: not in the phone app
  // (app.js introContext), where buttons and the touch strip do it.
  keysShown() {
    return this.introContext?.()?.keys !== false;
  }

  // In a dug bunker, what the face ahead needs: { face, need, sand,
  // launch, tone, better } - the launch that gets over it as the launch
  // monitor reads it (what the player sees on it; the lie and slope then
  // add or take off as play does) and as the ball leaves the sand, this
  // club's usual launch, "good" if that gets out with room to spare,
  // "close" if only just, "bad" if not, and a club that would be safer.
  // All at the swing it takes to reach the pin - a soft splash needs more
  // height than a full swing. Null anywhere else. The same rule play uses
  // (courseplay.mjs), so what it says is what happens. Kept until the
  // ball, aim, club or stance moves.
  faceHelp() {
    const r = this.me;
    if (!r?.ball || r.done || this.round.done || this.flying || !["bunker", "greenside"].includes(r.lie)) return null;
    const key = [r.ball, r.aim, r.club, r.lie, r.stance?.side, r.stance?.slope].join();
    if (this.faceCache?.key === key) return this.faceCache.help;
    const face = faceAhead(this.hole, r.ball, r.aim);
    let help = null;
    if (face) {
      const stance = r.stance ?? FLAT;
      const distance = distanceToPin(this.hole, r.ball) + riseToPin(this.hole, r.ball);
      const yards = distance / YARD;
      const raw = swingFor(r.club, r.lie, stance, yards);
      const need = launchToClear(face, raw, { lie: r.lie, stance, club: r.club });
      const clears = clubClearsFace(face, r.club, r.lie, stance, 0, yards);
      const safe = clears && clubClearsFace(face, r.club, r.lie, stance, FACE_MARGIN, yards);
      const better = safe ? null : suggestClub(distance, r.lie, { face, stance, reach: this.reachOf(r) });
      // The lie's own change to the launch, to draw the line the ball
      // actually takes off the sand.
      const lift = typicalShot(r.club, r.lie, stance, yards).vla - raw.vla;
      help = {
        face,
        need,
        sand: need == null ? null : need + lift,
        launch: raw.vla,
        clears,
        tone: safe ? "good" : clears ? "close" : "bad",
        better: better !== r.club ? better : null,
      };
    }
    this.faceCache = { key, help };
    return help;
  }

  // "Face: needs 38° launch - your 7 iron launches about 17°, too low: try
  // the sand wedge"
  faceText() {
    const f = this.faceHelp();
    if (!f) return "";
    if (f.need === 0) return "Face: any launch gets out";
    const need = f.need == null ? "Face: too steep to clear from here" : `Face: needs ${Math.ceil(f.need)}° launch`;
    const club = clubName(this.me.club).toLowerCase();
    const better = f.better ? clubName(f.better).toLowerCase() : null;
    if (f.tone === "good") return `${need} - your ${club} gets out (about ${Math.round(f.launch)}°)`;
    if (f.tone === "close") return `${need} - your ${club} only just gets out (about ${Math.round(f.launch)}°)${better ? `: the ${better} is safer` : ""}`;
    return `${need} - your ${club} launches about ${Math.round(f.launch)}°, too low${better ? `: try the ${better}` : ""}`;
  }

  // The face's need as a short label: "✓ 25°", "! 28°", "✗ 34°".
  faceLabel(f) {
    if (f.need == null) return "too steep";
    if (f.need === 0) return "✓ any";
    return `${{ good: "✓", close: "!", bad: "✗" }[f.tone]} ${Math.ceil(f.need)}°`;
  }

  // The lie's guidance: what the last shot's lie did to it (until the
  // player's next shot), and what this one's is likely to - quiet lines
  // under the lie and stance.
  lieLines() {
    const p = this.me;
    if (!p || this.round.done) return [];
    return [p.lieAfter, this.lieBefore(), this.treeWarn(), this.stuckLine()].filter(Boolean);
  }

  // In trouble, the keys that help - there for as long as it lasts (the
  // tips over the picture come and go): "S: look from the ball · U:
  // unplayable". { text, short }, or null.
  stuckLine() {
    if (this.relief || !this.inTrouble()) return null;
    return {
      text: this.fromBall
        ? "S goes back behind the ball; U calls it unplayable - a penalty stroke and a drop under the Rules, or back where you played from."
        : "Stuck? S looks from the ball itself, to see the ways out; U calls it unplayable - a penalty stroke and a drop under the Rules, or back where you played from.",
      short: this.fromBall ? "S: back behind the ball · U: unplayable" : "S: look from the ball · U: unplayable",
    };
  }

  // Under the trees, or close behind them, with a shot along the aim
  // likely to meet them: "Under the trees - punch it low" on the game
  // window, the whole sentence in the Shot details (sim/treewarn.mjs).
  // { text, short }, or null. Looked along again only when the ball, aim,
  // club, lie or stance moves.
  treeWarn() {
    const p = this.me;
    if (!p?.ball || p.done || this.round.done || this.flying || this.putting) return null;
    const key = [p.ball, p.aim, p.club, p.lie, p.stance?.side, p.stance?.slope].join();
    if (this.treeCache?.key !== key) {
      const w = treeWarning(this.hole, p.ball, p.aim, { club: p.club, lie: p.lie, stance: p.stance ?? FLAT });
      this.treeCache = { key, line: w ? { text: w.text, short: w.short } : null };
    }
    return this.treeCache.line;
  }

  // "Rough: expect 80–95% of your normal carry (your 7 iron's ~150 →
  // 120–143 yds) · less spin, a bit left", or "" from a clean lie. For the
  // swing it takes to reach the pin: a full one scaled to the player's own
  // carry with the club (their stats, else the bag's), or less than that
  // near the green.
  lieBefore() {
    const p = this.me;
    if (!p?.ball || p.done || this.flying || this.putting) return "";
    const stance = p.stance ?? FLAT;
    const yards = Math.round((distanceToPin(this.hole, p.ball) + riseToPin(this.hole, p.ball)) / YARD);
    const own = ownCarry(p.name, p.club, () => this.render());
    const key = [p.lie, stance.side, stance.slope, p.club, yards, own, p.plug].join();
    if (this.lieCache?.key === key) return this.lieCache.text;
    const plan = plannedCarry(p.club, yards);
    const partial = plan < (BAG[p.club]?.carry ?? 150) * 0.9;
    const base = partial
      ? beforeLine(p.lie, stance, { club: p.club, swing: swingFor(p.club, "fairway", FLAT, yards), plan })
      : beforeLine(p.lie, stance, { club: p.club, full: own ?? BAG[p.club]?.carry, own: own != null });
    // Plugged in the sand (sim/sand.mjs): said first.
    const text = p.plug && PLUG_WORDS[p.plug] ? [PLUG_WORDS[p.plug], base].filter(Boolean).join(" · ") : base;
    this.lieCache = { key, text };
    return text;
  }

  // The note over the picture: the hole, the stance, the face. The game
  // window's short form leaves the stance to its drawing (bay.js).
  holeNote(spec) {
    const hole = `${this.course.name} - hole ${spec.number}, par ${spec.par}, ${this.yardsOf()} yds`;
    const text = [hole, this.stanceText(), this.faceText()].filter(Boolean).join(" · ");
    return this.stanceText() ? { text, short: noteShort([hole, this.faceText()].filter(Boolean).join(" · ")) } : text;
  }

  // "Ball above your feet (4°)" while setting up a shot from a slope.
  stanceText() {
    const r = this.me;
    if (!r || r.done || this.round.done || this.flying || this.putting) return "";
    return describeStance(r.stance ?? FLAT);
  }

  resize(aspect) {
    // (A picture taller than it's wide - the phone held upright - with the
    // lens widened: sim/upright.mjs. A cart ride's lens put back to it.)
    const lens = fitLens(this.camera, aspect);
    if (this.ride) this.ride.fov = lens;
    this.sections.refresh();
  }

  // The hole's background sound: its ponds and streams (buildHoleScene).
  get soundscape() {
    return this.world.userData.soundscape ?? null;
  }

  // Shown only while this mode is on screen.
  // The course's light as it comes on show (app.js setMode: look/
  // environment.js useSun), and at each hole (showHole): where the round's
  // clock has got to, if one's being played.
  sunNow() {
    const r = this.round;
    return r?.clock ? holeSun(r.clock, r.index - r.first) : null;
  }

  setActive(on) {
    this.isActive = on;
    this.sections.setActive(on);
    // Before a round, the first hole and the card (idleSoon).
    if (on) this.idleSoon();
    else this.renderIntro();
    this.mapCanvas.hidden = !on || !this.round?.hole;
    this.standingsCanvas.hidden = this.mapCanvas.hidden || !this.multi;
    // The banner, the faded colour and the sound belong to this mode's
    // picture.
    if (!on) this.celebration.clear();
    // The offer and the flyover too: the card is over every mode's picture.
    // So is an unplayable ball's card: away, the ball's played as it lies
    // (U again brings it back); and the view from the ball goes.
    if (!on) {
      this.endFlyover({ moveOn: false });
      this.hideOffer();
      // The cart ride: stopped, and begun again on coming back.
      if (this.ride) {
        this.endRide();
        this.moveOnWhenBack = true;
      }
      const away = this.fromBall || !!this.relief;
      // (Out of the water and still choosing: the game's pick taken.)
      if (this.relief?.water) this.takeRelief(this.relief.suggested ?? 0);
      this.hideRelief({ camera: false });
      this.fromBall = false;
      if (away && this.round?.hole && this.me && !this.flying) this.placeCamera(true);
    }
    // A scramble's pick still waiting comes back with the course.
    if (on && this.round?.pick != null && !this.round.pending) this.showPick();
    else this.hidePick();
    // A finished hole whose wait ran out while away moves on now: the next
    // hole, or the end of the round with its celebration.
    if (on && this.moveOnWhenBack) {
      this.moveOnWhenBack = false;
      this.moveOn();
    }
  }
}

// The parts of CourseMode kept in public/course/: their methods join the
// class as if written in it (non-enumerable, like class methods).
for (const part of [CourseSeason, CourseMatchLadder, CourseLadderOnline, CourseLadderPostal, CourseLadderOpen, CourseLadderWeb, CourseSeasonPost, CourseFlyover, CourseRelief, CourseDropSpot, CourseScramble, CourseHoleBuild, CourseHoleScenery, CoursePutting, CourseNetFlights, CourseNetResume, CoursePanel, CourseMulligan, CourseLandings, CourseBuggy, CourseMadeUp, CourseFilms, CourseWatch]) {
  for (const [key, desc] of Object.entries(Object.getOwnPropertyDescriptors(part.prototype))) {
    if (key === "constructor") continue;
    // (Two parts, or a part and the class, with one name: the later would
    // silently win - the Postal ladder's Watch once never showed.)
    if (Object.hasOwn(CourseMode.prototype, key)) throw new Error(`CourseMode already has ${key} (${part.name})`);
    Object.defineProperty(CourseMode.prototype, key, desc);
  }
}
