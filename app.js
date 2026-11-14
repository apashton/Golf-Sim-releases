// Wires the page together: the renderer, the practice modes, the
// connection to the local server, and the made-up swings.

// (First: the phone app's start screen goes up before the game starts
// loading under it - phonehome.js.)
import { ShotFacts } from "./sim/shotfacts.mjs";
import { phoneHome } from "./phonehome.js";
import { routeSettings } from "./sim/phoneroutes.mjs";
import * as THREE from "three";
import { Range } from "./range.js";
import { PuttingGreen } from "./putting.js";
import { ChippingGreen, CHIP_CLUB_LIST } from "./chipping.js";
import { CourseMode } from "./course.js";
import { ChallengesMode } from "./challenges.js";
import { loadSetting, saveSetting, esc, settingsHeld } from "./util.js";
import { Clubhouse } from "./menu.js";
import { applyUiStyle, applyBigBars, bigBars, modePicker, uiStyle } from "./uistyle.js";
import { CommandWidgets } from "./ccwidgets.js";
import { setLineLevel, watchLineLevel } from "./puttline.js";
import { readClips, changeLimit, usage, sizeText } from "./limits.js";
import { freeSpace, lowSpaceNote } from "./sim/clips.mjs";
import { rollConditions, cleanConditions } from "./sim/weather.mjs";
import { cleanOffset, viewWindow, offsetWords, wideFrame } from "./sim/viewoffset.mjs";
import { playerNames } from "./sim/players.mjs";
import { BayView, clubName } from "./bay.js";
import { animateScenery } from "./scenery.js";
import { HIGH, ULTRA, LEVEL, savedGraphics, startMessage, startedSafely } from "./look/quality.js";
import { phonePixelRatio, pictureSizeText } from "./sim/phonepicture.mjs";
import { usePictureRenderer, setPictureBase, applyPictureScale, pictureShare, pictureBase, pictureSuper, setPictureFlying, pictureEased, flyShare } from "./look/renderscale.js";
import { flyEase } from "./sim/ultra.mjs";
import { NAMES as GRAPHICS_NAMES, chooseHighest, settleQuestion, formerNote } from "./sim/graphics.mjs";
import { EFFECTS, EFFECT_IDS, SCREEN_EFFECTS, readEffects, setEffect, effectsInUse, needsReload, madeOn, costNote } from "./sim/effects.mjs";
import { SystemMenu } from "./system.js";
import { Welcome } from "./welcome.js";
import { SignIn } from "./signin.js";
import { view as camera, setFollow } from "./view.js";
import { VoiceControl, voiceHelp } from "./voice.js";
import { clubForMode } from "./sim/voice.mjs";
import { voiceAction, WAKE_CHOICES, WAKE_NAMES, DEFAULT_WAKE, wakeWords } from "./sim/voicecmd.mjs";
import { clubInHand, holdable } from "./sim/clubinhand.mjs";
import { Recorder } from "./recorder.js";
import { RecordingSwitch } from "./recording.js";
import { omniStatusLine } from "./omni.js";
import { testClubData } from "./sim/shotdata.mjs";
import { MAX_PLAYERS, PLAYER_COLOURS, COLOUR_NAMES, isSimple, simpleNames } from "./sim/players.mjs";
import { monitorById, monitorName, waitingName } from "./sim/launchmonitors.mjs";
import { GUEST, isGuest, readProfiles, profileNames, isProfile, nameProblem, addProfile, renameProfile, removeProfile, setProfile, handOf, playingColours, playingFrom, togglePlaying, addGuest, renameKey, playingWords, whoPrompt, startSequence, WARM_UP_BOX } from "./sim/profiles.mjs";
import { HINT_TIMES, nextHint, hintShown, dismissHint, hintsLeft, cleanHintState, keysNow } from "./sim/keyhints.mjs";
import { CLUB_ORDER as CLUBS, testSwing, clubShort, WEDGE_LOFTS } from "./sim/clubs.mjs";
import { startInBay, withoutBayFlag } from "./sim/roundkeys.mjs";
import { audio } from "./audio/engine.js";
import { soundscape } from "./audio/cues.mjs";
import { SoundPanel } from "./audio/panel.js";
import { Screens, takeEarlyControls } from "./screens.js";
import { keyInit, KEY_CHANNEL, historyMessage, historyListMessage } from "./sim/screens.mjs";
import { BlankAreas } from "./blankarea.js";
import { PromptMirror } from "./promptmirror.js";
import { startBarClock } from "./barclock.js";
import { ControlsLayout } from "./arrange.js";
import { GameLayout } from "./gamearrange.js";
import { CameraManager } from "./cameras.js";
import { CAM_CHANNEL } from "./sim/shotcams.mjs";
import { InstantReplay } from "./replay.js";
import { CameraBoxes } from "./camerabox.js";
import { CameraPanel } from "./camerapanel.js";
import { SwingReplay } from "./swingreplay.js";
import { FrameRate } from "./fps.js";
import { followNearShadow } from "./look/nearshadow.js";
import { drawMirrors } from "./look/mirrors.js";
import { useEffects, effectsOn, drawWithEffects, setEffects, canFinish, setFocus, setTaaFrame, BUILT_WITH, AO } from "./look/effects.js";
import { setCirrus, useSun } from "./look/environment.js";
import { setHazeScale, HAZE_OFF } from "./look/glsl/haze.js";
import { SWAY, drawSwayed } from "./look/sway.js";
import { RAIN_GROUND } from "./look/glsl/ground.js";
import { setTuftAO } from "./look/groundbits.js";
import { ShadowWatch } from "./look/shadowwatch.js";
import { updateWeatherLook, weatherLook } from "./look/weatherlook.js";
import { setTreeBatching, treeBatching, updateTreeDetail, repaintTreePictures, treeShapesKept, keepTreeShapes } from "./look/trees.js";
import { viewOf } from "./sim/framerate.mjs";
import { LongFrames, shaderName } from "./sim/longframes.mjs";
import { opaqueOrder } from "./sim/draworder.mjs";
import { setWideFrame, drawWide } from "./widepicture.js";
import { takeFrameNotes } from "./sim/framenotes.mjs";
import { PartClock } from "./sim/frameparts.mjs";
import { takeForcedLayout } from "./framewatch.js";
import { StillPicture, SceneryClock } from "./sim/stillpicture.mjs";
import { IdleQueue, idleBudget, heavyAllowed, WAIT } from "./sim/idlework.mjs";
import { keepPrograms } from "./sim/keepprograms.mjs";
import { sendNewSteps, drawAllSteps, takeFirstDraws } from "./look/gpuprep.js";
import { greenWarmers } from "./greengrid.js";
import { nestWarmers } from "./look/lienest.js";
import { longGrassWarmers } from "./look/longgrass.js";
import { tuftFieldWarmers } from "./look/tuftfield.js";
import { RefreshMeter, screenKey, knownRefresh, withRefresh, snapRate } from "./sim/refresh.mjs";
import { setWildlifeClock } from "./look/wildlife.js";
import { SpeedTest } from "./speedtest.js";
import { RendererTest } from "./renderertest.js";
import { warmUp, tracerWarmers, buildsInBackground, settle } from "./look/warmup.js";
import { FrameCap } from "./sim/framecap.mjs";
import { makeRenderer, rendererKind, readCard, onCardReset, frameDraws, countShadowDraws, countPart, programList, programCount, drawsManyAtOnce, portFacts } from "./look/gpu.js";
import { chooseRenderer, rendererName } from "./sim/rendererchoice.mjs";
import { detailTexturesSettled } from "./look/textures.js";
import { LoadingScreen, nextFrame, within } from "./loading.js";
import { loadPlan, startingMode, warmOrder, freshStart, STARTED_KEY, MODE_STAGES } from "./sim/loading.mjs";
import { bakeTreeAtlas, redrawTreeAtlas } from "./look/treeatlas.js";
import { celebrationWarmers } from "./look/celebrate.js";
import { VideoRecorder } from "./videorec.js";
import { VideoPanel } from "./videopanel.js";
import { chooseRecording } from "./recordchoice.js";
import { VideoMonitor } from "./videomonitor.js";
import { startHow } from "./sim/videorec.mjs";
import { simulateShot, setCarryMatch } from "./sim/flight.mjs";
import { carryPercentOf, carryPercentWords, cleanCarryPercent } from "./sim/carryadjust.mjs";
import { shotFlight } from "./sim/shotflight.mjs";
import { Showreel } from "./showreel.js";
import { takesShot, isReelShot } from "./sim/showreel.mjs";
import { shotPhase } from "./sim/shotphase.mjs";
import { PracticePlan } from "./practiceplan.js";
import { RoundCardView } from "./roundcard.js";
import { seasonBlock, netSeasonBlock, matchBlock, ladderBlock, finishBlocks } from "./sim/finishstandings.mjs";
import { ladderState } from "./sim/matchladder.mjs";
import { NetPlayClient, OnlinePanel } from "./netplay.js";
import { ReactionBar } from "./netreact.js";
import { NetCards } from "./netcards.js";
import { MatchKeeper } from "./netmatchkeep.js";
import { NetSeasonKeeper } from "./netseasonkeep.js";
import { SeasonsSection } from "./netseasons.js";
import { eventWords, netSeasonLine } from "./sim/netseason.mjs";
import { watchJoinLinks } from "./netinvite.js";
import { PagePhoneLink } from "./phonelinkpage.js";
import { resumeAt, resumeWords } from "./sim/netresume.mjs";
import { courseResult, tallyResult, pongResult } from "./sim/netresults.mjs";
import { cleanPresets, savePreset, removePreset, presetOf, presetWords } from "./sim/netpresets.mjs";
import { afterRound, comingsAndGoings, readCode } from "./sim/netgame.mjs";
import { LobbyButton } from "./lobbybutton.js";
import { TopBarFold } from "./topbarfold.js";
import { NetTurns, NetBoard } from "./netside.js";
import { gameById as challengeById } from "./sim/challenges.mjs";
import { TailscalePart } from "./tailscale.js";
import { FORMAT_NAMES as GAME_NAMES, formatFits } from "./sim/formats.mjs";
import { usesTeams } from "./sim/teams.mjs";
import { SwingPad } from "./mouseswing.js";
import { PlayMode } from "./app/playmode.js";
import { SideFold } from "./sidepanel.js";
import { PanelSections } from "./panelsections.js";
import { makeRestRunner } from "./restrun.js";
import { TouchControls } from "./touchcontrols.js";
import { Upright } from "./upright.js";
import { touchStripOn } from "./sim/touchcontrols.mjs";
import { GamePad } from "./gamepad.js";
import { PadPanel } from "./padpanel.js";
import { padKeyEvent } from "./sim/gamepad.mjs";
import { dayOf } from "./sim/pinday.mjs";
import { SWING_DEVICES, TEST_SHOT, madeUpSwing } from "./sim/mouseswing.mjs";
import { madeUpShot, planOf, planMark, reachOf, distanceWords } from "./sim/madeshot.mjs";
import { madeUpIndex } from "./sim/madeuphcp.mjs";
import { cleanLevel, cleanCustom, levelHelp, playerLevel, levelAtLeast, LEVELS, LEVEL_ORDER } from "./sim/swinglevels.mjs";
import { countRound, climbWords, cleanClimb, climbOf, progressWords } from "./sim/levelup.mjs";
import { ShotSetupCard } from "./shotsetupcard.js";
import { LevelCard } from "./levelcard.js";
import { TRADE, levelFacts, levelTag, levelsLine } from "./sim/levelchoice.mjs";
import { PlayerSkills, SkillsCard } from "./skills.js";
import { shotSkills, setupHarshness, harshWords } from "./sim/skills.mjs";
import { cleanReads, cleanMadeUp, DEFAULT_READS, DEFAULT_MADE_UP, levelFloor, rulesWords, cleanCarryRule, DEFAULT_CARRY_RULE, carryRuleWords, bayCarryWords, cleanSkillsRule, DEFAULT_SKILLS_RULE } from "./sim/netrules.mjs";
import { afterLoss, lostWords } from "./sim/gamepicture.mjs";
import { bindMenus } from "./app/menus.js";
import { onKey } from "./app/keys.js";
import { PhoneRange } from "./phonerange.js";
import { checkAppUpdate, checkWhenBack } from "./appupdate.js";
import { startLadderAlerts } from "./ladderalerts.js";
import { keepNetLadder, leftGame } from "./sim/netladder.mjs";

const view = document.getElementById("view");
// The side panel's fold (sidepanel.js): made once the picture can be
// resized (below, by showBay); null until then.
export let sideFold = null;
// The touch screen's strip (touchcontrols.js), made with the swing pad.
let touchControls = null;
// The loading screen (loading.js), up since the first paint: each stage
// below says when it starts, and it fades once the first whole picture of
// the mode the game opens in has been drawn (the end of this file).
const loading = new LoadingScreen(document.getElementById("loading"));
// (As the game starts - not a reload while it runs, which the session
// remembers by Who's playing having been asked: markWhoAsked - the range.)
const startMode = startingMode(location.search, loadSetting("app", {}).mode, undefined, { fresh: freshStart() });
// The trees' shapes kept from the last start, asked for now (look/trees.js
// treeShapesKept): waited for before anything with trees is built.
const shapesKept = treeShapesKept();
await loading.reach("start");
// The picture's centre, moved left or right for a golfer who hits down
// one side of the net (sim/viewoffset.mjs): every mode's camera renders
// its view slid over, so the ball and the target line are drawn there.
// The Clubhouse, the one menu (made further down, once everything it
// changes is): screens and keys look for it before then.
export let menu = null;
// The game's video (showreel.js), made further down too.
export let reel = null;
// The speed test (speedtest.js): made with the video, below.
export let speedTest = null;
// The WebGPU test (renderertest.js): made with the speed test.
export let rendererTest = null;
// How many of the video's shots have arrived (it waits for each).
let reelShots = 0;
export const picture = { centre: cleanOffset(loadSetting("picture", { centre: 0 }).centre), wide: false };
// Where a wide picture's parts go (the recording's compositor, once it's
// made: resize can come first).
let gameWindowsTo = null;
export function setPictureCentre(share) {
  picture.centre = cleanOffset(share);
  saveSetting("picture", { centre: picture.centre });
  resize();
}

// WebGL, as always - or, behind the hidden ?renderer= switch, three.js's
// WebGPURenderer, for checking the WebGPU port a piece at a time
// (sim/rendererchoice.mjs, look/gpu.js).
const rendererAsked = chooseRenderer(location.search);
const renderer = await makeRenderer(rendererAsked, { antialias: true, powerPreference: "high-performance" });
// The picture's pixels: up to twice the screen's on Medium and High (sharp
// on a high-DPI screen), the screen's own on Standard - times the share the
// safety valve has left the 3D picture at (look/renderscale.js): every
// pixel ratio the renderer gets goes through there, so a resize can't
// undo a step. In the phone app, a budget of pixels for the setting
// instead, and no supersampling (sim/phonepicture.mjs): twice a phone's
// page was some 1.5 million pixels a frame on its graphics chip.
const inPocket = !!window.pocket;
const fullPixelRatio = (w = view.clientWidth, h = view.clientHeight) =>
  inPocket ? phonePixelRatio({ dpr: window.devicePixelRatio || 1, width: w, height: h, setting: LEVEL }) : Math.min(window.devicePixelRatio || 1, HIGH ? 2 : 1);
usePictureRenderer(renderer, fullPixelRatio(), { width: view.clientWidth, height: view.clientHeight }, { supersampling: !inPocket });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
// Solid things drawn in the order that hides the most first: what stands
// on the ground, then the ground's layers top first, the sky last - each
// pixel's colour worked out once rather than under the fairway as well
// (sim/draworder.mjs). Nothing looks different.
renderer.setOpaqueSort(opaqueOrder);
// Neutral tone mapping shows colours close to how they're written in
// look/palette.js: the filmic kind darkened and oversaturated the grass and
// bleached the sky white.
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.1;
// What a frame drew, counted over the whole frame - the ponds' reflections,
// the shadow map, the scene and the effects' passes - not only its last
// pass (which, with the effects on, was one call: every report said "1").
// Reset as each frame starts drawing (the loop below).
renderer.info.autoReset = false;
// (The shadow maps' and reflections' shares counted apart: look/gpu.js
// frameDraws.)
countShadowDraws(renderer);
view.appendChild(renderer.domElement);
// A card reset (the driver restarted it) goes in the next report, so a
// stall can be told from a hang in the game's own code.
const gpuEvents = [];
onCardReset(renderer, (type) => {
  gpuEvents.push({ at: Date.now(), type });
  if (type !== "context-restored") console.error("The graphics card reset the picture");
  // (The leaf pictures' pixels aren't kept once on the card: painted again
  // for it - look/trees.js - and the far woods' pictures drawn again.)
  else {
    repaintTreePictures();
    redrawTreeAtlas(renderer);
  }
});
// The shadow map drawn only when a caster changes, not every frame.
const shadowWatch = new ShadowWatch(renderer, { ultra: ULTRA });
// The picture's finish - ambient occlusion, bloom, the far blur, the
// colour and vignette, FXAA - each as switched (look/effects.js).
useEffects(renderer);
// And those that change the scene as it plays: the haze, the high cloud,
// the camera's sway.
// A course's altitude or humidity (the menu's), for the next round.
export function courseAirSet(key, v) {
  modes.course.settings[key] = v;
  saveSetting("course", modes.course.settings);
}
function liveEffects(on) {
  setHazeScale(on.haze ? 1 : HAZE_OFF);
  setCirrus(on.sky);
  SWAY.on = !!on.sway;
  RAIN_GROUND.on = !!on.rainground;
  setTuftAO(!!on.ao, AO.near, AO.far);
}
liveEffects(BUILT_WITH);
// Trees in a few batches, each tree outside the view dropped on its own
// (look/trees.js): that needs the graphics card to draw many things in one
// call. Without it - or with the graphics setting's trees: "instanced" -
// they're drawn one instanced mesh per kind and shape, as they were.
setTreeBatching(drawsManyAtOnce(renderer) && loadSetting("graphics", {}).trees !== "instanced");
// What a report says about the graphics (graphicsFacts): the card's name,
// read once, here as the page starts: asking for it waits for the graphics
// card to finish what it's doing, which on a busy picture took seconds -
// longer than a report waits for the answer - and, asked after the scenes
// were built, held the load up while their shaders finished.
const cardFacts = await readCard(renderer);
// What the loading screen goes through (sim/loading.mjs): a round started
// from the address (the designer's "Play") is laid out behind it too.
const backgroundShaders = buildsInBackground(renderer);
// Every shader program built stays on the card for the page's life
// (sim/keepprograms.mjs): swept each loop below, and as the load warms up.
const keptPrograms = new WeakSet();
loading.plan = loadPlan({ round: !!new URLSearchParams(location.search).get("course") });

// Each mode's scene built in turn, the loading screen drawn between them
// so its bar moves (in the usual order: the Challenges use the course's).
export const modes = {};
// In the phone app the game opens in the mode last played, under its start
// screen (phonehome.js): the range and the greens other than that one are
// built only if they're come into - their ground, greens and trees - not as
// the game starts (a round started on the phone built the whole range
// first: ten seconds and more on a phone). The PC builds them all, to
// switch between at once.
const buildLater = (name) => typeof window !== "undefined" && !!window.pocket && name !== startMode;
// The mode whose shaders are made first (sim/loading.mjs warmOrder): the
// one the game opens in. Where the card builds shaders in the background,
// its scene's are asked for the moment it's built (warmEarly), so the card
// works on them while the other modes are built and the page is set up,
// rather than starting once everything's built.
const firstWarm = MODE_STAGES.includes(startMode) ? startMode : "range";
let sceneWarmed = null;
function warmEarly(name) {
  if (!backgroundShaders || name !== firstWarm || modes[name]?.unbuilt) return;
  sceneWarmed = warmUp(renderer, modes[name].scene, modes[name].camera);
}
// (Never long: a server that doesn't answer, and they're made afresh.)
await within(shapesKept, 4000);
await loading.reach("range");
modes.range = new Range(document.getElementById("panel-range"), renderer, { later: buildLater("range") });
warmEarly("range");
await loading.reach("putting");
modes.putting = new PuttingGreen(document.getElementById("panel-putting"), renderer, view, { later: buildLater("putting") });
warmEarly("putting");
await loading.reach("chipping");
modes.chipping = new ChippingGreen(document.getElementById("panel-chipping"), renderer, view, { later: buildLater("chipping") });
warmEarly("chipping");
await loading.reach("course");
// The saved players (sim/profiles.mjs): name, colour and hand each, with
// simple play beside them - made from the players list the first time, so
// everyone already on it (Player 1 too) keeps their stats.
export let profiles = readProfiles(loadSetting("profiles", null), loadSetting("course", {}).players);
if (!Array.isArray(loadSetting("profiles", null)?.list)) saveSetting("profiles", profiles);
modes.course = new CourseMode(document.getElementById("panel-course"), renderer, view);
warmEarly("course");
// Work done in the picture's quiet moments (sim/idlework.mjs): the course's
// next hole built ahead while you play this one, and sent to the graphics
// card, so moving on to it is quick. Run from the frame loop below.
const idleWork = new IdleQueue({ now: () => performance.now() });
modes.course.idleWork = idleWork;
// On the phone, while the picture rests, that work's run between the frames
// too, a slice at a time (sim/idlework.mjs RestRunner): the frames can come
// slowly while nothing's drawn, and the next hole wasn't ready in time.
// Only while resting, nothing moving, the page shown: a touch wakes the
// picture and stops it.
let lastBusy = true;
const restRunner = inPocket ? makeRestRunner({ queue: idleWork, canRun: () => picturesOn && !lastBusy && !document.hidden && stillPicture.resting && performance.now() >= stillPicture.awakeUntil }) : null;
await loading.reach("challenges");
// The Challenges share the course's players list, so friends are typed in
// once and the course panel shows any change made here.
modes.challenges = new ChallengesMode(document.getElementById("panel-challenges"), renderer, view, {
  players: {
    get: () => modes.course.players,
    set: (names) => {
      modes.course.settings.players = playerNames(names);
      saveSetting("course", modes.course.settings);
      keepProfiles(modes.course.settings.players);
      modes.course.renderPlayers();
    },
    // Their colours, and a saved player renamed (their stats go too).
    colours: (names) => playingColours(names, profiles),
    renamed: (from, to) => renameEverywhere(from, to),
  },
  // The driving challenge can take a player's average from the range.
  // (Not those hit to check the Omni, which mishit the driver on purpose,
  // misreads taken out, or mouse swings, which are nobody's real drives.)
  rangeDrives: () => modes.range.shots.filter((s) => s.club === "DR" && !s.removed && !madeUpSwing(s.deviceId)).map((s) => s.result.total),
});
warmEarly("challenges");
await loading.reach("setup");
// The far woods' pictures of every tree (look/treeatlas.js) drawn first,
// once, while the page loads, rather than in the first frame that shows
// them. How long it took is in a report (graphicsFacts).
const farTreesMs = bakeTreeAtlas(renderer);
// Every mode's shader programs built while the page loads, rather than the
// first time the mode shows (which stalled the picture for a moment). In
// the background where the graphics card can (compileAsync); a new hole's
// programs are mostly these same ones, shared by kind. With them, the
// tracers' programs (built at the strike, the moment a freeze shows most),
// a celebration's, the green's grid and shading's (built as the ball first
// reached a green: a report's 547 ms frame, and 1.8 s stood still after),
// the grass round the ball's and the long grass's (first drawn as a
// round's first shot was set up: on Ultra 10 s stood still), in each
// scene's light (look/warmup.js).
// The mode the game opens in first, started now so the card works on them
// while the rest of the page is set up - and, built, drawn once each
// behind the loading screen (finishLoading: the card finishes a shader as
// it's first drawn, a hold of up to most of a second each). Where the card
// builds them in the background, the other modes' follow once the game is
// showing, one mode a frame (finishLoading, at the end of this file), and
// their first drawings in the quiet moments (prepareOtherModes); where it
// can't, they're asked for now as well, so they're built behind the
// loading screen (the first picture waits for them) rather than in the way
// of play.
const warmers = [tracerWarmers(), celebrationWarmers(), greenWarmers(), nestWarmers(), longGrassWarmers(), tuftFieldWarmers()].filter(Boolean);
// (The course draws them behind its still with its first hole: course.js
// idleBuilt.)
modes.course.warmers = warmers;
// (A mode not built yet - the phone's: buildLater - has nothing to warm.)
const warmMode = (name) => (modes[name].unbuilt ? Promise.resolve() : warmUp(renderer, modes[name].scene, modes[name].camera, warmers));
const laterWarms = warmOrder(Object.keys(modes), firstWarm).slice(1);
// (Its scene asked for already, as it was built: warmEarly. The warmers
// now, with its light.)
const firstWarmed = sceneWarmed ? Promise.all([sceneWarmed, warmUp(renderer, modes[firstWarm].scene, modes[firstWarm].camera, warmers, { withScene: false })]) : warmMode(firstWarm);
if (!backgroundShaders) for (const name of laterWarms) warmMode(name);
export const MODE_NAMES = { range: "Driving range", putting: "Putting green", chipping: "Chipping green", course: "Course", challenges: "Challenges" };
const prefs = loadSetting("app", { mode: "range", club: "DR", bay: false, voice: false, screens: "docked" });
export let mode = startMode in modes ? startMode : "range";

// The launch monitor the player has (menu, Launch monitor): its setup steps
// are the ones shown, there and on the welcome screen (sim/launchmonitors.mjs).
export let launchMonitor = monitorById(loadSetting("monitor", "omni")).id;
export function setLaunchMonitor(id) {
  const next = monitorById(id).id;
  if (next === launchMonitor) return;
  launchMonitor = next;
  saveSetting("monitor", launchMonitor);
  // In the Windows app, A² Golf's own Bluetooth link to the Omni is on for
  // the Omni and off for anything else - it would only look for an Omni
  // that isn't there, and say so in the top bar.
  if (appBridge?.patchConfig) Promise.resolve(appBridge.patchConfig({ omni: { enabled: next === "omni" } })).catch(() => {});
  if (lastStatus) showStatus(lastStatus);
}
// Set once the page has started: a change of game after that may check
// who's playing (reconfirmWho).
let startedUp = false;
export const bay = new BayView(view);
// A message given while the loading screen is still up (a round's "Hole 1
// - par 4" from the designer's Play) would come and go unseen behind it:
// the latest is held and given as it fades (finishLoading).
const toastNow = bay.toast.bind(bay);
let heldToast = null;
bay.toast = (text, ms, opts) => {
  if (loading.showing && text) heldToast = [text, ms, opts];
  else toastNow(text, ms, opts);
};
// The frame rate on the picture (Shift + F): off until turned on. With it
// the safety valve, which steps the picture down from the setting chosen
// while it stays slow, and asks when it kept switching back and forth.
const graphicsChoice = savedGraphics();
export const frameRate = new FrameRate(view, {
  built: LEVEL,
  // The 3D picture's own pixels, as drawn.
  picture: () => {
    const b = renderer.getDrawingBufferSize(pictureSize);
    return pictureSizeText(b.x, b.y);
  },
  highest: graphicsChoice.highest,
  fixed: graphicsChoice.fixed,
  scale: pictureShare,
  // (The frame rate alone, the rest a click or a tap away - on the PC too;
  // the phone's valve and place its own.)
  compact: true,
  phone: inPocket,
  onSettle: (between) => askSettle(between),
  // The recording guard (fps.js): said, as it eases the picture and as
  // the recording stops and it's put back.
  onGuard: (names) => bay.toast(names ? `Recording: the picture eased to keep up (${names.at(-1)})` : "Recording stopped: the picture back as you chose it", 3500),
  // (On the phone, when the valve has eased the picture a whole setting
  // down: said, so it's seen to work - fps.js onEase.)
  onEase: inPocket ? (now) => bay.toast(`Running slowly: graphics eased to ${GRAPHICS_NAMES[now] ?? now} to keep up`, 3500) : null,
});
// The picture rests while nothing moves (sim/stillpicture.mjs): the
// setting (the menu's Screens page), the watch, and the scenery's own
// clock, which stops while it rests so the flag, the water and the birds
// carry on from where they stopped. Any key, click or control used - here
// or in the controls window - wakes it, as does anything moving.
export const stillSetting = loadSetting("still", { on: true });
const stillPicture = new StillPicture();
const sceneryClock = new SceneryClock();
setWildlifeClock(() => sceneryClock.seconds);
export function wakePicture() {
  stillPicture.wake(performance.now());
}
for (const type of ["keydown", "pointerdown", "wheel", "touchstart", "input", "change"]) window.addEventListener(type, wakePicture, { capture: true, passive: true });
// (A drag - a button held - wakes it; the mouse merely passing doesn't.)
window.addEventListener("pointermove", (e) => e.buttons && wakePicture(), { capture: true, passive: true });
document.addEventListener("visibilitychange", wakePicture);
// The camera's numbers, for telling whether the view moved: where it is,
// which way it looks, and its lens.
const viewNow = new Array(23).fill(0);
function viewNumbers(camera) {
  const p = camera.position;
  const q = camera.quaternion;
  viewNow[0] = p.x;
  viewNow[1] = p.y;
  viewNow[2] = p.z;
  viewNow[3] = q.x;
  viewNow[4] = q.y;
  viewNow[5] = q.z;
  viewNow[6] = q.w;
  const e = camera.projectionMatrix.elements;
  for (let i = 0; i < 16; i++) viewNow[7 + i] = e[i];
  return viewNow;
}
// The screen's refresh rate, for what the safety valve aims at
// (sim/refresh.mjs): the Windows app is told it by Windows; a browser
// measures it, once on each screen, from the frames that come while the
// picture rests. Kept by screen in the setting "display".
const refreshMeter = new RefreshMeter();
let refreshKey = null;
async function knowScreen() {
  let info = null;
  try {
    info = (await window.golfsimApp?.displayInfo?.()) ?? null;
  } catch {
    info = null;
  }
  const key = info ? screenKey({ id: info.id, width: info.width, height: info.height, ratio: info.scale }) : screenKey({ width: screen.width, height: screen.height, ratio: window.devicePixelRatio || 1 });
  if (key === refreshKey) return;
  refreshKey = key;
  refreshMeter.reset();
  if (snapRate(info?.hz)) saveSetting("display", withRefresh(loadSetting("display", {}), key, info.hz, "app", Date.now()));
  frameRate.setRefresh(knownRefresh(loadSetting("display", {}), key));
}
// Each loop while the rate isn't known: drawn - whether the frame before
// was drawn (its work may have made this one late).
function noteRefresh(time, drawn) {
  if (frameRate.refresh || !refreshKey) return;
  const hz = refreshMeter.tick(time, { drawn });
  if (!hz) return;
  saveSetting("display", withRefresh(loadSetting("display", {}), refreshKey, hz, "measured", Date.now()));
  frameRate.setRefresh({ hz, how: "measured" });
}
knowScreen();
// (A window moved to another screen is resized.)
window.addEventListener("resize", () => knowScreen());
// This load of the page as the run's record knows it (sim/graphicsrun.mjs):
// its id, when it started and the setting it was built at. Its facts go to
// the server (sendGraphics) once the game's ready, a minute apart after,
// and as the page leaves - saying why when it knows (leaving: a graphics
// or effects change, the game's video, the speed test) - so a report covers
// the whole run, every load of the page, and has the facts even when this
// window can't answer (stuck).
const spell = { id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, startedAt: Math.round(performance.timeOrigin), setting: LEVEL };
let leavingWhy = null;
export function leaving(why) {
  leavingWhy = why;
}
function sendGraphics(ended = false) {
  try {
    const facts = graphicsFacts();
    if (ended) facts.spell.ended = { at: Date.now(), why: leavingWhy };
    fetch("/api/graphics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(facts), keepalive: true }).catch(() => {});
  } catch {
    // Nothing: a report takes the page's facts live.
  }
}
setInterval(() => sendGraphics(), 60_000);
// Memory as the run goes on (a report's Memory row): every few minutes, the
// last few hours - so one that grows and grows can be told from a stall.
const memoryLog = [];
function memoryNow() {
  const heap = typeof performance !== "undefined" && performance.memory ? performance.memory : null;
  return { at: Date.now(), heapMB: heap ? Math.round(heap.usedJSHeapSize / 1e6) : null, heapLimitMB: heap ? Math.round(heap.jsHeapSizeLimit / 1e6) : null, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures };
}
setInterval(() => {
  memoryLog.push(memoryNow());
  if (memoryLog.length > 36) memoryLog.shift();
}, 5 * 60_000);
window.addEventListener("pagehide", () => sendGraphics(true));
// What a report says about the graphics: the card (cardFacts), whether it
// can draw many things in one call (the trees rely on it: look/trees.js),
// the setting, the picture's size (and the share of it the safety valve
// draws), the frame rate seen in each view (fps.js), the long frames, and
// how the load went (loading.js).
function graphicsFacts() {
  const canvas = renderer.domElement;
  return {
    ...cardFacts,
    spell: { ...spell, at: Date.now() },
    // What drew the game (WebGL, or WebGPU behind the hidden switch) and,
    // on WebGPU, what of the port is still to do in the scene on show.
    renderer: rendererName(rendererKind(renderer), rendererAsked),
    port: portFacts(modes[mode]?.scene),
    multiDraw: drawsManyAtOnce(renderer),
    // Shader programs built this session (every one kept: sim/keepprograms.mjs),
    // and whether the card builds them in the background.
    programs: programCount(renderer),
    backgroundShaders,
    trees: treeBatching() ? "batched" : "one instanced mesh per kind and shape",
    farTreesMs: Math.round(farTreesMs),
    canvas: { width: canvas.width, height: canvas.height },
    pixelRatio: renderer.getPixelRatio(),
    // The share of its pixels the 3D picture is drawn at (1, or 0.85 and
    // 0.7 when the safety valve has made it smaller), of a full-size ratio.
    renderScale: pictureShare(),
    fullPixelRatio: pictureBase(),
    ...frameRate.report(),
    // Resting while nothing moves: on or off, and how much of the time.
    still: { on: stillSetting.on, ...stillPicture.report(performance.now()) },
    // How often the shadow maps were drawn again, and what made them
    // (look/shadowwatch.js).
    shadowMaps: shadowWatch.report(),
    // The speed test's last runs (speedtest.js).
    speedTests: speedTest?.history.slice(0, 3) ?? [],
    // The WebGPU test's (renderertest.js).
    rendererTests: rendererTest?.history.slice(0, 3) ?? [],
    long: longFrames.report(),
    load: loading.summary(),
    // The round's moves from hole to hole: built ahead or not, and how
    // long each took (course.js switchLog).
    holeSwitches: modes.course?.switchLog ?? [],
    // Memory (now, and how it went: memoryLog), a graphics-card reset, and
    // the recording, so a freeze while recording can be told apart from the
    // game running out of memory or the card stalling. (Not "gpu": that's
    // the card's name, above.)
    memory: { now: memoryNow(), log: memoryLog.slice() },
    cardResets: gpuEvents.slice(-8),
    recording: video?.report?.() ?? null,
    supersampling: pictureSuper(),
    // Ultra's, eased while the camera flies (look/renderscale.js): how much
    // bigger then (1: the screen's own pixels), or null where it isn't.
    supersamplingInFlight: flyShare() < 1 ? Math.round(pictureSuper() * flyShare() * 100) / 100 : null,
    // The command centre's Game screen box: another live copy of the
    // picture, every frame.
    gameMirror: !!commandWidgets?.gameStream,
  };
}
export function toggleFrameRate() {
  bay.toast(frameRate.toggle() ? "Frame rate on - Shift + F to hide" : "Frame rate off", 1500, QUICK);
}
// A blank area on a window (Shift + B): part of it kept black - where a
// webcam hangs in front of the laptop's screen - with everything else moved
// clear of it. This page's ("main": the game, or the one window), and the
// controls window's when the screens are separate.
export const blank = new BlankAreas({
  onChange: (role) => role === "main" && resize(),
  toast: (text, ms) => bay.toast(text, ms),
});
blank.apply(document, "main");
// The game screen's words and numbers, moved and sized by hand
// (gamearrange.js): Shift + B in bay view, or the menu's Screens page.
export const gameLayout = new GameLayout(view, {
  blank: () => blank.edit(document, "main"),
  toast: (text, ms) => bay.toast(text, ms),
  // What its list of everything on the screen can turn on and off: the
  // menu's own switches (Screens: Show the frame rate; Key tips).
  switches: {
    fps: { get: () => frameRate.on, set: (on) => (frameRate.set(on), menu?.refresh?.(["frame-rate"])) },
    hint: {
      get: () => !hints.off,
      set: (on) => {
        setHints({ ...hints, off: !on });
        if (!on) bay.showHint(null);
        menu?.refresh?.(["key-tips"]);
      },
    },
  },
});
// The controls window's page, while there is one: a drawing of its blank
// area goes when it does.
let controlsDoc = null;
// Separate windows (Shift + D): the top bar, side panel and menus move to a
// controls window of their own, for a laptop, and this window is the game,
// for the projector (screens.js). What moves: the top bar, the Shot
// details (the game window's words in full: bay.js, details.js), the side
// panel, the add-a-player box, the menu, the Sound settings, the welcome
// screen and online play's panel - its lobby (and its reactions go in the
// top bar there: netreact.js). The picture, the numbers over it, the
// cards, the keys list, the reactions' bubbles and the toasts stay here,
// where the mat can see them, short and big (and are copied onto the
// controls window: the prompt mirror, below).
export const screens = new Screens({
  parts: () => [topBar, bay.details.el, bay.messages.el, cameraBoxes.el, commandWidgets.el, sidePanel, whoDialog, whoCheck, playersDialog, menu?.el, soundPanel.el, cameraPanel.el, videoPanel.el, welcome.el, onlinePanel.el],
  onKey,
  onChange: letGo,
  toast: (text, ms) => bay.toast(text, ms),
  bridge: window.golfsimApp ?? null,
  onActivity: wakePicture,
  moved: (separate) => {
    if (separate) {
      controlsDoc = screens.doc;
      blank.apply(controlsDoc, "controls");
      mirror.attach(controlsDoc, { into: bay.messages.cardsEl });
      helpMirror.attach(controlsDoc);
      layout.attach(controlsDoc);
    } else {
      // (The levels card home too, if it was open there.)
      levelCard.moveTo(document);
      layout.detach();
      mirror.detach();
      helpMirror.detach();
      blank.forget(controlsDoc);
      controlsDoc = null;
    }
    bay.setSeparate(separate);
    // Online play's reactions: by the Lobby button in the controls
    // window's top bar, or over the picture.
    reactions.inBar(separate ? topBar.querySelector("#lobby-open") : null);
    cameraBoxes.setSeparate(separate);
    commandWidgets.setSeparate(separate);
    showBay();
    showScreens();
    refreshOverlay();
    resize();
    if (separate) {
      prefs.screens = "separate";
      saveSetting("app", prefs);
      return;
    }
    // Docked because the controls window was closed - or because A-Squared Golf
    // is quitting, and closing every window. Only remembered if this page
    // is still here a moment later, so quitting doesn't count.
    // (Nor if they've been separated again meanwhile.)
    setTimeout(() => {
      if (screens.separate) return;
      prefs.screens = "docked";
      saveSetting("app", prefs);
    }, 1500);
  },
});
// Every shot and game, recorded for each player's stats (recorder.js).
export const recorder = new Recorder({ view, toast: (text, ms) => bay.toast(text, ms) });
// A game played with made-up swings earned skill XP: said, with any point
// it brought (sim/skills.mjs; spent on Menu -> Swing pad & controller).
recorder.onSkillXp = async (name, xp) => {
  if (!(xp > 0)) return;
  const s = await playerSkills.get(name, { fresh: true });
  const left = s?.left ?? 0;
  bay.toast(`${name}: +${xp} skill XP${left ? ` - ${left} skill point${left === 1 ? "" : "s"} to spend (Menu, Swing pad & controller, Skill points)` : ""}`, 5000);
};
// A warm-up as the game starts, until Who's playing is answered: balls fly,
// nothing's kept (startWarmUp).
let warmingUp = false;
// How they're recorded: practice, round, experimental or off - the top bar
// next to Hitting, the menu, Shift + R (recording.js).
export const recording = new RecordingSwitch({ select: document.getElementById("recording"), toast: (text, ms) => bay.toast(text, ms), bay, mode: () => mode });
// (Nothing at all during the warm-up before Who's playing is answered as
// the game starts: startWarmUp.)
recorder.formatFor = (m) => (warmingUp ? "off" : recording.formatFor(m));
// Who plays simple (the Players box): asked nothing about their shots, no
// tips while they hit - their shots kept as anyone's (sim/players.mjs).
recorder.simpleFor = (name) => isSimple(profiles, name);
// Each player's colour, their profile's; a left-hander's session tips.
recorder.playerColours = (names) => playingColours(names, profiles);
recorder.handFor = (name) => handOf(profiles, name);
// The last shot was another club than the one picked - put right by itself,
// or said ("last shot driver", "yes" to "the driver?"): on the range that
// club's picked for the next one too, the club left picked being how it
// happened (the owner, 10 November 2026: "I find too often I forget to
// change the club selection"). Not while a practice plan picks the clubs,
// nor once another club's been picked since.
recorder.onClubFixed = (shot, club, was) => {
  if (mode !== "range" || shot.mode !== "range" || practicePlan?.active || heldClub() !== was || !CLUBS.includes(club) || club === "PT") return false;
  setClub(club);
  return true;
};
modes.course.playerColours = recorder.playerColours;
modes.course.onPlayers = (names) => keepProfiles(names);
modes.course.onRenamed = (from, to) => renameEverywhere(from, to);
// Stopped recording: a special shot said for the next one has nothing to
// be kept as.
recording.onChange((f) => f === "off" && recorder.setSpecial(null));
// The latest shot from the launch monitor: which one, and its club data.
// Each shot's facts, kept with it (sim/shotfacts.mjs): the shot a mode
// records is the one it played, not whichever came in last.
const shotFacts = new ShotFacts();

// With the screens separate, the game window's cards show on the controls
// window as well, and their buttons work there (promptmirror.js): at the
// top of the command centre's Messages box. (Not the messages themselves, nor the next shot's mark: the Messages box lists every one,
// and This shot says the next shot.)
const mirror = new PromptMirror({
  // (A card come or gone: laid out again, for one in a closed drawer.)
  shown: (any) => bay.messages.setCards(any) && layout.doc && layout.soon(),
  sources: () => [
    ...view.querySelectorAll(".challenge-results, .challenge-side, .celebrate"),
    // A question over the picture (the graphics one), and the course's
    // card before a round: answered from the laptop too.
    bay.askEl,
    modes.course.introEl,
    recorder.card,
    modes.course.offerEl,
    // The scramble's pick of the team's balls, an unplayable ball's
    // choices, and the speed test's and the practice plan's cards:
    // answered on the laptop too.
    modes.course.pickEl,
    modes.course.holeCard?.el,
    // (The cart ride's screen: its card, not the box placed over the
    // screen each frame - course/buggy.js.)
    modes.course.rideEl?.firstElementChild,
    modes.course.rideBarEl,
    modes.course.reliefEl,
    speedTest?.card,
    rendererTest?.card,
    practicePlan?.card,
    ...(reel?.elements ?? []),
  ],
});
// And the keys list (H), over the whole controls window as on the game's.
const helpMirror = new PromptMirror({ sources: () => [bay.helpEl] });

// The laptop's time in the command centre's top bar.
startBarClock(document.getElementById("bar-clock"));

// Modes where shots go to whoever's turn it is, not "Who's hitting?".
export const hasTurns = () => mode === "course" || mode === "challenges";

// A practice plan's drill, when one's on (practiceplan.js).
export let practicePlan = null;
function refreshOverlay() {
  const content = modes[mode].overlay();
  const drill = practicePlan?.note();
  if (drill) {
    // (A note with a short form of its own keeps it, the drill before both.)
    const join = (n) => [drill, n].filter(Boolean).join(" · ");
    const n = content.note;
    content.note = n && typeof n === "object" ? { text: join(n.text), short: join(n.short) } : join(n);
  }
  if (mode === "range") content.club = heldClub();
  // Practising with friends: who's hitting, as the course shows whose turn.
  // (The course and the Challenges have turns, and say whose it is.)
  // Always up, alone or not (the owner: "a box that shows on screen who's
  // shooting at all times, so you can't get confused"): whose turn it is on
  // the course and in the Challenges, else whose shots these are.
  if (!content.player) {
    const who = hitterNow();
    if (who) content.player = { name: who, colour: recorder.colour(who) };
  }
  // A warm-up says so there, where the player can see it: nothing's kept.
  if (warmingUp) content.player = { ...WARM_UP_BOX, title: "A warm-up: nothing's kept until Play on Who's playing - click to open it" };
  bay.render(content);
  // The command centre's Keys box follows what's on the screen at once.
  refreshKeys();
  // The course's card before a round says where its settings are, which
  // changes with bay view and the screens (course.js renderIntro).
  if (mode === "course") modes.course.renderIntro();
}
for (const [name, m] of Object.entries(modes)) {
  m.onChange = () => m === modes[mode] && refreshOverlay();
  m.onToast = (text, ms, opts) => m === modes[mode] && bay.toast(text, ms, opts);
  // The flight the mode flew (its wind, lie, air and ground), the moment
  // it's worked out: the recording's and the command centre's flight path
  // draw that, not the launch monitor's numbers flown in still air
  // (sim/shotflight.mjs).
  m.onFlight = (f) => {
    if (m !== modes[mode] || !videoShot) return;
    const flown = shotFlight(f);
    if (!flown) return;
    videoShot = { ...videoShot, flight: { ...(videoShot.flight ?? {}), ...flown } };
    commandWidgets.update(videoShot);
  };
  // With the launch monitor's club data for it, when that has come (it
  // follows the shot by a moment; recorder.js sends it on if it's later).
  m.onRecord = ({ factsKey, ...ctx }) => {
    // (Its own shot's facts where the mode says which: a ball that was
    // still rolling when the next shot came - sim/shotfacts.mjs.)
    const latestShot = factsKey != null ? shotFacts.of(factsKey) : shotFacts.playing();
    const shotNumber = latestShot?.shotNumber;
    shotSince = Date.now();
    // In a gapping session the game picked the club and asked for a full
    // swing: kept as one, and never asked whether it was that club.
    const gapping = name === "range" && practicePlan?.gapping ? { swing: "full", clubSure: true } : {};
    // A warm-up's first few balls, loosening up: not kept at all.
    const done = practicePlan?.unsaved ? Promise.resolve(null) : recorder.record({ mode: name, shotNumber, clubData: latestShot?.clubData ?? undefined, measuredSpin: latestShot?.measuredSpin, hitAt: latestShot?.at, mouse: !!latestShot?.mouse, made: latestShot?.made ?? null, ...ctx, ...gapping });
    practicePlan?.onRecord(name, { ...ctx, mouse: !!latestShot?.mouse }, done);
    // The shot's replay clips wait for this to be named: whose, which
    // club, how far, and its id in the stats (replay.js).
    const about = { player: ctx.player ?? recorder.hitter, club: ctx.club, carry: ctx.result?.carry, mode: name };
    Promise.resolve(done)
      .catch(() => null)
      .then((reply) => {
        replay.recorded(shotNumber, { ...about, stats: reply?.id });
      });
    // The recording's tiles: the mode's own carry and total (its wind, its
    // ground), and who hit it.
    if (videoShot && videoShot.shotNumber === shotNumber) {
      const r = ctx.result ?? {};
      const f = { ...(videoShot.flight ?? {}) };
      for (const k of ["carry", "total", "offline"]) if (Number.isFinite(r[k])) f[k] = r[k];
      videoShot = { ...videoShot, flight: ctx.swing === "putt" || ctx.club === "PT" ? null : f, player: about.player ?? videoShot.player, club: ctx.club ?? videoShot.club };
      commandWidgets.update(videoShot);
    }
    return done;
  };
  m.onGame = (game) => recorder.game({ mode: name, ...game });
  // The course: a ball called unplayable, its penalty kept with its shot.
  m.onUnplayable = (u) => recorder.unplayable(u);
  m.onSessionEnd = () => recorder.endSession(name);
}
// The range's lie guidance is for the club in hand and whoever's hitting;
// the putting and chipping streaks are whoever's hitting's.
modes.range.currentClub = () => heldClub();
modes.range.hitter = () => recorder.hitter;
// (Their hand: the range lays its mats for it - sim/furniture.mjs bayLayout.)
modes.range.hand = () => handOf(profiles, recorder.hitter);
// On the phone, the range session's card over the picture - its shots, each
// club's distances, Finish to sum it up (phonerange.js); shown on the range.
const phoneRange = inPocket ? new PhoneRange({ range: modes.range, session: () => inRangeSession(), onEnd: () => endRangeSession() }) : null;
if (phoneRange) modes.range.onSession = (shots) => phoneRange.update(shots);
// The match ladders on the phone are the course's side panel's (its Match
// ladder section), the panel opened at it (the owner, 1 November 2026: "The
// ladder/start game all the options etc should be in the pull out" - no
// button of their own over the picture).
// (On the phone the panel's sections are folded till tapped - panelsections.js,
// made once the panel's found below: the ladder's opened here.)
let panelSections = null;
function openLadderPanel() {
  if (mode !== "course") setMode("course");
  sideFold?.change("open");
  modes.course.renderLadder();
  panelSections?.show("course-ladder");
  // (Once the panel's laid out at its width.)
  requestAnimationFrame(() => sidePanel.querySelector("#course-ladder")?.scrollIntoView({ block: "start", behavior: "smooth" }));
}
if (inPocket) {
  // The ladders' alerts (ladderalerts.js): asked for once there's an online
  // ladder - at start, or when one's made or joined - and a tapped alert
  // opens Match ladders.
  const alerts = () =>
    startLadderAlerts({
      hasOnline: () => modes.course.ladders.list.some((l) => l.online),
      onToken: (token) => modes.course.ladderAlertToken(token),
      onOpen: () => afterLoading.then(() => {
        if (phoneHome.up) phoneHome.toGame?.();
        modes.course.ladderAlerted();
        onlinePanel.show(true, "ladders");
      }),
      onAlert: (text) => {
        if (text) bay.toast(text, 6000);
        modes.course.ladderAlerted();
      },
    });
  let alertsAsked = false;
  const askAlerts = () => {
    if (alertsAsked || !modes.course.ladders.list.some((l) => l.online)) return;
    alertsAsked = true;
    alerts();
  };
  askAlerts();
  modes.course.onLadderOnline = askAlerts;
  modes.course.ladderWhere = "Match ladder, in the side panel";
  // (A new ladder on the phone swings with a finger, unless it's at the
  // range with a launch monitor.)
  modes.course.ladderWayDefault = () => (loadSetting("playMode", "touch") === "monitor" ? "monitor" : "madeup");
}
modes.putting.hitter = () => recorder.hitter;
// Golf pong's two players here take turns: each the hitter on their putt.
modes.putting.playerNames = () => recorder.players;
modes.putting.setHitterName = (name) => {
  if (recorder.players.includes(name) && recorder.hitter !== name) recorder.hitter = name;
};
modes.chipping.hitter = () => recorder.hitter;
// Their tracers are in that player's colour, as each player's are on the
// course.
for (const m of [modes.range, modes.putting, modes.chipping]) m.hitterColour = () => recorder.colour(recorder.hitter);
// A mode changing its own club (↑ ↓ there, its own picker, the course's
// or a game's club for the shot) changes the club in hand; before a round
// or a game they show the club in hand too.
for (const name of ["chipping", "course", "challenges"]) modes[name].onClub = (club) => modeClub(name, club);
modes.course.heldClub = () => heldClub();
modes.challenges.heldClub = () => heldClub();

// ---- Mode and club ----------------------------------------------------------

// The top bar and side panel's elements, kept hold of rather than looked up
// each time: with separate screens they're in the controls window's page
// (screens.js), where this page's document.getElementById can't see them.
const topBar = document.querySelector("body > header");
export const sidePanel = document.querySelector("main > aside");
// On the phone each of its sections shows just its heading till it's tapped
// (the owner: "sections collapsed until expanded"): it opens as a short list.
if (inPocket) panelSections = new PanelSections({ root: sidePanel });
const modeButtons = [...document.querySelectorAll("[data-mode]")];
// The menus' and buttons' style (Menu, Screens: New or Legacy), worn by
// the page at once; and, in the new style on the phone, the modes folded
// into one button (uistyle.js).
applyUiStyle(uiStyle());
applyBigBars(bigBars());
const modePick = modePicker(topBar, document.getElementById("mode-pick"));
const panels = Object.fromEntries(Object.keys(modes).map((name) => [name, document.getElementById(`panel-${name}`)]));
// The controls window as boxes (arrange.js): the top bar's halves, the
// mode's sections and the prompts' area, laid out round its blank area and
// arranged by hand (Shift + B, or its Arrange button).
// The controls window's own boxes: a shot number on its own, all of them,
// the flight path - added from the Arrange bar (ccwidgets.js).
const commandWidgets = new CommandWidgets({
  layout: () => layout.attached && layout.soon(),
  // The Game screen box: the game's picture, copied live - or the
  // recording's, switched to (video is made further down: asked for only
  // once a box shows it).
  game: () => renderer.domElement,
  recording: () => video.compositor,
  // Its Replay and Save: the last shot's replay (made further down).
  replays: { show: () => replayShot(), save: () => saveReplay() },
  // The Keys box: a line clicked presses its key.
  press: (key, shift) => pressKey(key, shift),
  // The Shot history: the recorder's last few shots, marked or put down to
  // another club from the box as from a card (Z undoes either).
  history: {
    list: () => recorder.recent,
    names: () => recorder.multi,
    mark: (id, say) => recorder.markFrom(id, say),
    club: (id, club) => recorder.clubFrom(id, club),
  },
});
// The Last shot box: the mode's own numbers for it, from what's over the
// picture (bay.js render), and what's there already.
bay.onRender = (content) => commandWidgets.setContent(content);
commandWidgets.setContent(bay.content);
recorder.onHistory = () => {
  commandWidgets.refreshHistory();
  shareHistory();
};
export const layout = new ControlsLayout({
  header: topBar,
  aside: sidePanel,
  mode: () => mode,
  panel: (name) => panels[name],
  // (The cards are in the Messages box now: no box of their own.)
  messages: () => null,
  // This shot (the game window's words in full, and the next shot) and a
  // box for each camera (camerabox.js): boxes for every mode.
  extras: () => [
    { id: "details", el: bay.details.el, name: "This shot" },
    // Every message, the last few always in sight: the game window has only
    // a symbol for one now (bay.js, messages.js).
    { id: "msglog", el: bay.messages.el, name: "Messages" },
    ...(cameraBoxes?.extras() ?? []),
    ...commandWidgets.extras(),
  ],
  palette: () => commandWidgets.palette,
  add: (key) => commandWidgets.add(key),
  // Boxes taken out with their ×, to tick back in Arrange ▾.
  takenOut: () => [...(cameraBoxes?.takenOut?.() ?? []), ...commandWidgets.takenOut()],
  blank,
  inbox: bay.messages,
  toast: (text, ms) => bay.toast(text, ms),
});
// Arrange ▾: the boxes by name, the drawer, Tidy up and arranging by
// hand (Shift + B goes straight to arranging).
document.getElementById("arrange-toggle")?.addEventListener("click", (e) => {
  e.currentTarget.blur();
  layout.menu(e.currentTarget);
});

// ---- Cameras and instant replay ------------------------------------------------

// The webcams the owner has chosen (cameras.js owns their streams), each
// shot's replay from them (replay.js), the controls window's camera boxes
// (camerabox.js) and the Cameras panel (camerapanel.js). Nothing is opened
// until a camera is chosen; nothing is drawn on the game window - except
// the swing replay asked for by voice, Q or a camera box's "Show on
// projector" (swingreplay.js), which the next shot closes.
const cameras = new CameraManager();
// A camera's × on the shot data screen: off the shot screen, kept that way.
try {
  new BroadcastChannel(CAM_CHANNEL).onmessage = (e) => {
    const id = e.data?.offShotScreen;
    if (typeof id === "string") cameras.update(id, { shotScreen: false });
  };
} catch {
  // No BroadcastChannel: the Cameras panel's Show in still does it.
}
const replay = new InstantReplay({
  cameras,
  onShot: () => {
    swingReplay.shot();
    cameraBoxes.shot();
  },
  onClip: (clip) => {
    cameraBoxes.clip(clip);
    swingReplay.clip(clip);
  },
  toast: (text, ms) => bay.toast(text, ms),
});
const cameraBoxes = new CameraBoxes({
  cameras,
  layout: () => layout.attached && layout.soon(),
  settings: () => showCameras(),
  save: () => saveReplay(),
  project: () => swingReplay.toggle(),
});
// The last shot's replay, big on the game window, on demand.
export const swingReplay = new SwingReplay({
  view,
  cameras,
  replay,
  before: bay.toastEl,
  clubName,
  playerList: () => recorder.players,
  toast: (text, ms) => bay.toast(text, ms),
  onChange: (on) => {
    cameraBoxes.setProjecting(on);
    commandWidgets.setReplay(commandWidgets.replay, on);
  },
});
// Q, the touch strip's Replay, a controller's RT: the last shot again -
// the swing camera's replay, or with none set up (as on the phone), on the
// course the ball's flight flown again (course/flyover.js replayLastShot).
export function replayShot() {
  if (swingReplay.showing || swingReplay.canReplay || mode !== "course") return swingReplay.toggle();
  return modes.course.replayLastShot();
}
// Whether Q has anything to show after a shot (the tips and the strip ask).
function replayable() {
  return swingReplay.canReplay || (mode === "course" && !!modes.course.round);
}
// A replay is kept only until the next shot, unless it's saved: the camera
// boxes' Save, Shift + S, "save that", the menu or the Game screen box.
// "7 iron 154 yds": what the toast calls it.
function replayLabel(meta = {}) {
  const carry = Number(meta.carry);
  return [meta.club ? clubName(meta.club) : null, meta.carry != null && Number.isFinite(carry) ? `${Math.round(carry)} yds` : null].filter(Boolean).join(" ") || "the last shot";
}
export function saveReplay({ sayWhy = true } = {}) {
  const r = replay.save();
  if (r.why) {
    if (sayWhy) bay.toast(r.why, 2500);
  } else bay.toast(`${r.already ? "Saved already" : "Saved"} - ${replayLabel(r.meta)}`, 2200);
  return r;
}
replay.onSaveChange((state) => {
  cameraBoxes.setSaveState(state);
  // The command centre's Game screen box: Replay and Save.
  commandWidgets.setReplay(state && { saved: state.saved });
});
export const cameraPanel = new CameraPanel({
  cameras,
  replay,
  bridge: window.golfsimApp ?? null,
  // Every saved replay: the Recording panel's Saved replays.
  openReplays: () => (cameraPanel.show(false), showVideo("replays")),
  separate: () => screens.separate,
  toast: (text, ms) => bay.toast(text, ms),
});
export function showCameras() {
  cameraPanel.show(true);
  screens.focusControls();
}
document.getElementById("cameras-toggle")?.addEventListener("click", (e) => {
  e.currentTarget.blur();
  showCameras();
});
cameras.apply();

// ---- Video recording --------------------------------------------------------------

// The in-house recorder (videorec.js): the active recording layout - the
// game, the cameras, the shot data - drawn off screen in this page, where
// the renderer is (compositor.js), and recorded with the game's sound and a
// microphone. The Recording panel (videopanel.js) is the layout designer.
// The Record button and the Recording button are in the controls window's
// top bar; Shift + V and "start filming" / "stop filming" anywhere.
// The last shot, for the recording's tiles: the launch monitor's readings
// and the flight (the mode's own carry and total once it records it).
let videoShot = null;
// Who's hitting now: whoever's turn it is on the course and in the
// Challenges, else "Who's hitting?".
function hitterNow() {
  try {
    if (mode === "course") return modes.course.me?.name ?? null;
    if (mode === "challenges") return modes.challenges.match?.player?.name ?? null;
  } catch {
    // Between rounds: nobody.
  }
  return recorder.hitter;
}
// (Online, the round over: the host's Back to the lobby on it - or who
// the others wait for.)
export const roundCards = new RoundCardView({ toast: (text, ms) => bay.toast(text, ms), highlights: () => modes.course.watchHighlights(), online: () => netAfter(), lobby: () => backToLobby(), standings: () => finishStandings() });
// What a finished round counted for, as standings (sim/finishstandings.mjs;
// the owner, 5 November 2026: "any online seasons, match ladders, stuff
// like that show on the finish"): a season's event on this PC, an online
// season's event (the host's season, with the game), the online match
// over several games, a match ladder's match - beside the round card and
// in the recording's Finish scene. Worked out at most once a second (the
// recording asks every frame).
let standingsMemo = { at: -Infinity, blocks: [] };
function finishStandings() {
  const now = performance.now();
  if (now - standingsMemo.at < 1000) return standingsMemo.blocks;
  const c = modes.course;
  const r = c.round;
  const blocks = [];
  if (r?.finished && !reelNet) {
    if (r.season != null && c.season) blocks.push(seasonBlock(c.season, r.season, { you: r.players[0]?.name ?? "You" }));
    const g = r.net ? netClient.view.game : null;
    const mine = r.players.filter((p) => !p.remote).map((p) => p.name);
    if (g?.round?.season && g.season) blocks.push(netSeasonBlock(g.season, g.round.season.k, { mine }));
    if (g?.match) blocks.push(matchBlock(g.match, { mine }));
    const L = r.ladder ? c.ladders?.list?.find((l) => l.id === r.ladder.id) : null;
    if (L) blocks.push(ladderBlock({ name: L.name, state: ladderState(L), match: r.ladder.match, players: [r.ladder.by, r.ladder.of] }));
  }
  standingsMemo = { at: now, blocks: finishBlocks(blocks) };
  return standingsMemo.blocks;
}

// ---- Online play -----------------------------------------------------------------------

// The game hosted here or joined (netplay.js), and its panel. The round
// itself is the course's: when the host starts it every bay's course
// starts it (startRound with net), and each change to the game reaches it
// (applyNet); this bay's shots go back out (netSend).
const netClient = new NetPlayClient();
// The carry adjustment as the server keeps it (Menu -> Ball flight -> Carry
// adjustment: a drag scale, and a spin part from the old calibration page).
let ownCarry = { scale: 1, spin: 1 };
// Every flight in this window - the range, the course, the challenges, both
// windows of separate screens - flies with it, from the status (it comes
// first on the event stream, and again the moment it changes, so it's in
// force before the next shot flies). Not in an online game whose host has
// everyone on A-Squared Golf's own carries; nor in the game's video: the
// shots it plans (sim/showreel.mjs) do on every PC what they did when
// planned (the page reloads as it ends).
function applyCarry() {
  const own = reel?.active || onlineOwnCarry();
  setCarryMatch(own ? 1 : ownCarry.scale, own ? 1 : ownCarry.spin);
}
// Whether the online game this bay is playing has everyone on A-Squared
// Golf's own carries, as its host chose (sim/netrules.mjs): this bay's
// carry adjustment is set aside till it ends.
export function onlineOwnCarry() {
  const v = netClient.view;
  return !reelNet && v.mode !== "off" && !!v.game?.started && !v.game.ended && cleanCarryRule(v.game.round?.carry) === "own";
}
// This bay's carry adjustment, told to the online game it's in whenever
// the game has another for it (each bay flies its own shots, so everyone
// sees it: the owner, "during online play this must be shared if someone
// has upped their distance"). A host from before keeps none: not sent.
let carrySent = null;
function shareCarry() {
  const v = netClient.view;
  const mine = v.mode !== "off" && !reelNet && !v.game?.ended ? v.game?.bays?.[v.bay] : null;
  if (!mine || !("carry" in mine)) return;
  const pct = cleanCarryPercent(ownCarryPercent());
  if (mine.carry === pct) return void (carrySent = null);
  if (carrySent === pct) return;
  carrySent = pct;
  netClient.send({ type: "carry", bay: v.bay, carry: pct }).then((r) => {
    if (r?.ok === false) carrySent = null;
  });
}
// Each other bay's carry adjustment as last seen, to say when one changes
// during a game.
let baysCarry = null;
function carryNews(v) {
  const g = v.game;
  if (v.mode === "off" || !g || g.ended) return void (baysCarry = null);
  const now = Object.fromEntries(
    Object.entries(g.bays ?? {})
      .filter(([b]) => b !== v.bay)
      .map(([b, x]) => [b, x.carry ?? 0]),
  );
  const was = baysCarry;
  baysCarry = now;
  if (!was || !g.started || cleanCarryRule(g.round?.carry) === "own") return;
  for (const [b, c] of Object.entries(now)) {
    if (b in was && was[b] !== c) bay.toast(`Online: ${g.bays[b].name} ${c ? `now plays ${carryPercentWords(c)}` : "is back on A² Golf's own carries"}`, 4000);
  }
}
// This bay's players as the course panel has them, with their handicaps
// (typed in, else their stats').
// A player swinging with the mouse or a controller says that handicap
// instead, at their level as this bay's own rules have it (the host's
// aren't known until the round starts): sim/madeuphcp.mjs.
// (quick: without looking in their stats - what's typed or was asked;
// OnlinePanel playersNow, when the stats are slow to come.)
async function netBay({ quick = false } = {}) {
  const c = modes.course;
  // (An online ladder match: the ladder's player from this bay, alone.)
  const names = c.netLadderPlayers() ?? c.players;
  const players = await Promise.all(
    names.map(async (name) => {
      const swing = madeUpGuess(name, levelFloor(cleanMadeUp(c.settings.madeUp ?? DEFAULT_MADE_UP)));
      // (Their own level, for everyone to see in the lobby: levelcard.js.)
      return { ...(await netPlayer(name, swing, quick)), level: swing ? playerLevel(name, mouseSwing) : null };
    }),
  );
  return { name: `${names[0]}'s bay`, players, carry: ownCarryPercent() };
}
// One of them: { name, index } - their handicap, as above.
async function netPlayer(name, swing, quick) {
  const c = modes.course;
  const typed = c.settings.hcp?.[name];
  if (!swing && typed != null && typed !== "" && Number.isFinite(Number(typed))) return { name, index: Number(typed) };
  // (A handicap they gave - the season asks for one with too few rounds -
  // until their rounds give one: course/madeupplay.js askedIndex.)
  const asked = c.askedIndex(name, swing);
  const ofSwing = (made) => {
    const got = madeUpIndex(made, swing.device, swing.level, mouseSwing.custom);
    return got.own || asked == null ? got.index : asked;
  };
  if (quick) return { name, index: swing ? ofSwing(null) : asked };
  try {
    const d = await fetch(`/api/stats/player?name=${encodeURIComponent(name)}&period=today`).then((r) => (r.ok ? r.json() : null));
    if (swing) return { name, index: ofSwing(d?.madeUp) };
    return { name, index: Number.isFinite(d?.handicap?.index) ? d.handicap.index : asked };
  } catch {
    return { name, index: swing ? ofSwing(null) : asked };
  }
}
// What the host starts: the course picked in the course panel, its game and
// handicaps, and the round's weather rolled here for everyone - or, as
// picked in the Online play panel, the putting or chipping challenge as
// set on this bay, or one of the Challenges (its option here, new holes).
function netRound() {
  const what = onlinePanel?.what ?? "course";
  if (what === "putting") {
    const s = modes.putting.settings;
    const name = modes.putting.gameName;
    // Lag putting: the seed gives every player the same ten in one order.
    const lag = s.gameLag ? { lag: true, seed: Math.floor(Math.random() * 1e9) } : {};
    return { mode: "putting", attempts: 10, name, label: name, setup: { distance: s.gameDistanceFt, cup: s.cup, stimp: s.stimp, ...lag } };
  }
  if (what === "pong") {
    // Golf pong: the green as set on this bay, new slopes, and who putts
    // first drawn at random - or everyone at once, in rounds or racing, as
    // set here.
    const s = modes.putting.pong?.settings ?? {};
    // (Two players: from either end; three: in lanes; four: four-way.)
    const n = netClient.view.game?.players?.length ?? 2;
    const setup = { players: n, layout: s.layout, spacing: s.spacing, length: s.length, size: s.size, slopes: s.slopes, speed: s.speed, seed: Math.floor(Math.random() * 1e9), first: Math.floor(Math.random() * n), together: !!s.together, race: !!s.together && !!s.race };
    return { mode: "pong", attempts: 1, name: "Golf pong", label: "Golf pong", setup };
  }
  if (what === "chipping") {
    const s = modes.chipping.settings;
    const name = `${s.gameYards} yd chipping challenge`;
    return { mode: "chipping", attempts: 10, name, label: name, setup: { yards: s.gameYards, cup: s.cup, stimp: s.stimp } };
  }
  if (what.startsWith("challenge:")) {
    const meta = challengeById(what.slice(10));
    if (meta) {
      const option = modes.challenges.optionOf(meta.id);
      return { mode: "challenge", attempts: meta.holes, name: meta.name, label: meta.name, setup: { game: meta.id, option, seed: Math.floor(Math.random() * 1e9) } };
    }
  }
  const c = modes.course;
  // The host's online season's next event, asked for in Seasons.
  const event = seasonNetRound();
  if (event) return event;
  // An online ladder match: its course and the ladder's rules.
  const ladder = ladderNetRound();
  if (ladder) return ladder;
  const course = c.nextCourse;
  const players = netClient.view.game?.players?.length ?? c.players.length;
  // A team game: the teams the host set in the Online play panel.
  const teams = usesTeams(c.settings.format, players) && netClient.view.game ? onlinePanel.teamOf() : null;
  const format = formatFits(c.settings.format, players, teams) ? c.settings.format : "stroke";
  return {
    teams: usesTeams(format, players) ? teams : null,
    courseId: course?.id ?? null,
    courseName: course?.name ?? null,
    format,
    formatName: GAME_NAMES[format].toLowerCase(),
    label: `${course?.name ?? "course"}, ${GAME_NAMES[format].toLowerCase()}`,
    handicaps: c.settings.handicaps !== false,
    tees: c.settings.tees,
    // Where the cups are cut: today's, for everyone, or each hole's own.
    pinDay: c.settings.pins === "daily" ? dayOf() : null,
    ...courseRules(),
    rules: rulesWords(courseRules()),
    weather: cleanConditions(rollConditions({ wind: c.settings.wind, temp: c.settings.temp, sky: c.settings.sky, time: c.settings.time, altitudeM: c.settings.altitudeM, humidity: c.settings.humidity }, Date.now())),
  };
}
// The host's online season's event as the lobby's next game (the Online
// tab's Seasons: netseasons.js, sim/netseason.mjs): its course, stroke play,
// handicaps on for a season scored net - the rest the course panel's
// (tees, cups, rules, the weather rolled as ever) - or null when no event's
// asked for, or its course has gone from this PC.
function seasonNetRound() {
  const k = seasonKeeper.next;
  const s = seasonKeeper.season;
  if (k == null || !s) return null;
  const c = modes.course;
  const course = c.list.find((x) => x.id === s.events[k].courseId);
  if (!course) return null;
  const net = s.scoring === "net";
  return {
    teams: null,
    courseId: course.id,
    courseName: course.name,
    format: "stroke",
    formatName: "stroke play",
    label: `${s.name}, event ${k + 1} of ${s.events.length}: ${s.events[k].name} (stroke play${net ? " with handicaps" : ""})`,
    handicaps: net,
    tees: c.settings.tees,
    pinDay: c.settings.pins === "daily" ? dayOf() : null,
    ...courseRules(),
    rules: rulesWords(courseRules()),
    weather: cleanConditions(rollConditions({ wind: c.settings.wind, temp: c.settings.temp, sky: c.settings.sky, time: c.settings.time, altitudeM: c.settings.altitudeM, humidity: c.settings.humidity }, Date.now())),
    season: { k, of: s.events.length, name: s.events[k].name },
  };
}
// Event k as the lobby's next game: hosting first if this bay isn't (not
// from inside someone else's game - the host runs the season).
async function playSeasonEvent(k) {
  const s = seasonKeeper.season;
  const e = s?.events[k];
  if (!e) return;
  if (!modes.course.list.some((x) => x.id === e.courseId)) {
    seasonKeeper.playNext(false);
    return bay.toast(`${e.course} isn't on this ${inPocket ? "phone" : "PC"} any more - the season can't play ${e.name}`, 5000);
  }
  if (netClient.view.mode === "guest") {
    seasonKeeper.playNext(false);
    return bay.toast("You're in someone else's game - leave it to host your season's event", 4000);
  }
  onlinePanel.what = "course";
  onlinePanel.show(true, "play");
  if (netClient.view.mode !== "host") await onlinePanel.act("host");
  bay.toast(`${eventWords(s, k)} - Start in the lobby once everyone's in`, 4500);
}
// An online match ladder's match as the host starts it (course/
// ladderonline.js): on the course it was accepted on, match play with the
// ladder's own strokes (the round's ladder), the same cups for both, no
// skill points - or null when no ladder match is being set up.
function ladderNetRound() {
  const c = modes.course;
  const p = c.pendingNetLadder;
  const L = p && c.ladders.list.find((l) => l.online?.code === p.code);
  const course = L && c.list.find((x) => x.id === p.course);
  if (!course) return null;
  // (A match that's been played, voided or walked over since: the mark's
  // stale - an ordinary round, and the mark gone, sim/netladder.mjs.)
  if (!c.ladderRoundFor({ id: L.id, match: p.match })) {
    c.pendingNetLadder = keepNetLadder(p, { what: "closed", open: false });
    return null;
  }
  const rules = { ...courseRules(), skills: "off" };
  return {
    teams: null,
    courseId: course.id,
    courseName: course.name,
    format: "match",
    formatName: "match play",
    label: `${L.name}: ladder match on ${course.name}`,
    handicaps: false,
    tees: c.settings.tees,
    pinDay: dayOf(),
    ...rules,
    rules: `${rulesWords(rules)}; the ladder's strokes, gimmes and level`,
    weather: cleanConditions(rollConditions({ wind: c.settings.wind, temp: c.settings.temp, sky: c.settings.sky, time: c.settings.time, altitudeM: c.settings.altitudeM, humidity: c.settings.humidity }, Date.now())),
    ladder: { code: p.code, match: p.match },
  };
}
// The match's online game, from the ladder: hosted here (its code then
// goes to the ladder for the other to join), or joined with that code.
async function ladderNetGame(L, m, how, code = null) {
  const c = modes.course;
  if (how === "host" && !c.list.some((x) => x.id === m.course)) return bay.toast("That course isn't on this PC - the one challenged needs it to host", 4000);
  // (game: the online game's code, once known - leaving that game takes the
  // mark away, sim/netladder.mjs.)
  const mark = { code: L.online.code, match: m.match, name: L.online.me?.name, course: m.course, game: how === "join" ? readCode(code) : null };
  c.pendingNetLadder = mark;
  onlinePanel.what = "course";
  if (how === "join") {
    onlinePanel.joinWith(code);
    return onlinePanel.act("join-code");
  }
  const was = netClient.view?.code ?? null;
  onlinePanel.show(true, "play");
  await onlinePanel.act("host");
  // The game's code, once the relay's given it (not the game this bay was
  // in before): to the ladder.
  const got = await new Promise((res) => {
    let off = null;
    const done = (v) => {
      clearTimeout(t);
      setTimeout(() => off?.());
      res(v);
    };
    const t = setTimeout(() => done(null), 15000);
    off = netClient.onChange((v) => v.mode === "host" && v.code && v.code !== was && done(v.code));
  });
  if (c.pendingNetLadder === mark) c.pendingNetLadder = got ? { ...mark, game: got } : null;
  if (got) c.ladderRoom(L, m.match, got);
  else bay.toast("No game code from the relay yet - host again from the ladder", 4000);
}
modes.course.ladderRelay = () => netClient.view.relayUrl ?? "";
// (What's waiting on the online ladders, said when the game opens whatever
// mode it's in - the course's own messages only show in the course.)
modes.course.onNotice = (text, ms) => bay.toast(text, ms);
// (The relay's known a moment after the page opens: the ladder section
// drawn again then, so Live is offered - and, once, what's waiting on this
// PC's online ladders said, whatever mode the game opened in.)
let ladderRelayOn = false;
netClient.onChange((v) => {
  if (!!v.relayUrl === ladderRelayOn) return;
  ladderRelayOn = !!v.relayUrl;
  if (ladderRelayOn) modes.course.ladderNotices().then(() => modes.course.postSeasonNotices()).then(() => phoneHome.refresh?.());
  modes.course.renderLadder();
  modes.course.renderPostSeasons();
});
// (Out of the online game - it ended, or was left - with no result: the
// ladder match's mark goes, so the next ordinary game isn't taken for it,
// sim/netladder.mjs.)
let netViewWas = null;
netClient.onChange((v) => {
  const game = leftGame(netViewWas, v);
  if (game) modes.course.pendingNetLadder = keepNetLadder(modes.course.pendingNetLadder, { what: "left", game });
  netViewWas = { mode: v.mode, code: v.code ?? null };
});
modes.course.onLadderHost = (L, m) => ladderNetGame(L, m, "host");
modes.course.onLadderJoin = (L, m, code) => ladderNetGame(L, m, "join", code);
// A round's rules on the course (the course panel's Game): line reads,
// how much harder made-up swings are, skill points.
function courseRules() {
  const c = modes.course.settings;
  return { reads: cleanReads(c.reads ?? DEFAULT_READS), madeUp: cleanMadeUp(c.madeUp ?? DEFAULT_MADE_UP), skills: cleanSkillsRule(c.skills ?? DEFAULT_SKILLS_RULE) };
}
// The host's rules for the next game, in the lobby for everyone to see
// before the start - the easiest level anyone plays at among them
// (sim/netgame.mjs rules): a course round's, or another game's carry rule.
function lobbyRules() {
  const carry = cleanCarryRule(modes.course.settings.carry ?? DEFAULT_CARRY_RULE);
  return (onlinePanel?.what ?? "course") === "course" ? { ...courseRules(), carry } : { carry };
}
// ...sent when they change (checked every second, and again after 5
// seconds if the game hasn't taken them).
let rulesSent = { key: "", at: 0 };
function sendLobbyRules() {
  const v = netClient.view;
  if (v.mode !== "host" || !v.game || v.game.started) return;
  const rules = lobbyRules();
  const key = JSON.stringify(rules);
  if (key === JSON.stringify(v.game.lobbyRules ?? null) || (key === rulesSent.key && Date.now() - rulesSent.at < 5000)) return;
  rulesSent = { key, at: Date.now() };
  netClient.send({ type: "rules", rules });
}
// Playing from other houses: Tailscale's set-up steps and status.
const tailscalePart = new TailscalePart({ bridge: window.golfsimApp ?? null });
// With the carry rule for every game (the course panel's).
function netStart() {
  const r = netRound();
  const carry = cleanCarryRule(modes.course.settings.carry ?? DEFAULT_CARRY_RULE);
  return { ...r, carry, rules: r.rules ? `${r.rules}; ${carryRuleWords(carry)}` : carryRuleWords(carry) };
}
// The host's match over several games, kept on this PC or phone
// (netmatchkeep.js), and its saved game settings (sim/netpresets.mjs).
const matchKeeper = new MatchKeeper({ client: netClient, load: () => loadSetting("netMatch", null), save: (m) => saveSetting("netMatch", m) });
// The host's online season (netseasonkeep.js), kept on this PC or phone,
// and the Online tab's Seasons (netseasons.js).
const seasonKeeper = new NetSeasonKeeper({ client: netClient, load: () => loadSetting("netSeason", null), save: (s) => saveSetting("netSeason", s) });
const seasonsSection = new SeasonsSection({ keeper: seasonKeeper, view: () => netClient.view, courses: () => modes.course.list.map((c) => ({ id: c.id, name: c.name })), play: (k) => playSeasonEvent(k), toast: (text) => bay.toast(text, 3500), onCourse: () => (onlinePanel?.what ?? "course") === "course" });
const netPresets = {
  list: () => cleanPresets(loadSetting("netPresets", [])),
  save: (name) => saveSetting("netPresets", savePreset(netPresets.list(), presetOf(name, { what: onlinePanel.what, course: modes.course.nextCourse, settings: modes.course.presetSettings() }))),
  use: (p) => modes.course.applyPreset(p),
  remove: (name) => saveSetting("netPresets", removePreset(netPresets.list(), name)),
  words: (p) => presetWords(p, { formatName: (f) => (GAME_NAMES[f] ?? f).toLowerCase(), whatName: (w) => (w === "putting" ? "the putting challenge" : w === "chipping" ? "the chipping challenge" : w === "pong" ? "golf pong" : w.startsWith("challenge:") ? (challengeById(w.slice(10))?.name ?? "a Challenge") : w) }),
};
// The game's video's online game (showreel.js, sim/showreel.mjs
// reelGame), while it plays the four-ball: this bay's changes go to the
// video's pretend host, and what this PC's server says of online play
// (nothing going) is left alone.
let reelNet = null;
// While the game's video's designer covers the whole picture (showreel.js
// cover): none of the course shows, so none of it's drawn.
let reelCover = false;
// (The top bar's Online tab, made just below: told as the panel opens and
// shuts. Its first update reads reelNet, so that's declared above.)
let onlineTabButton = null;
export const onlinePanel = new OnlinePanel({
  client: netClient,
  bay: netBay,
  round: netStart,
  tailscale: tailscalePart,
  toast: (text, ms) => bay.toast(text, ms),
  roundOver: () => netAfter(),
  presets: netPresets,
  match: matchKeeper,
  shown: () => screens.focusControls(),
  levels: () => openLevels(true, { near: onlinePanel.el }),
  // The Online tab's Ladders: the online ones (live, by post) drawn there
  // (course/matchladder.js renderLadderInto, "online"), and what waits on
  // them by its name; its Host rules: the course's settings.
  ladders: {
    attach: (el) => {
      modes.course.onlineLadderEl = el;
      modes.course.renderLadder();
    },
    waiting: () => onlineWaiting(),
  },
  // Its Seasons: an online season played together (netseasons.js) - and
  // seasons by post, drawn there (course/seasonpost.js renderPostSeasons),
  // with what waits on them by its name.
  seasons: seasonsSection,
  postSeasons: {
    attach: (el) => {
      modes.course.onlinePostSeasonEl = el;
      modes.course.renderPostSeasons();
    },
    waiting: () => modes.course.postSeasonsWaiting?.() ?? 0,
  },
  rules: { values: () => modes.course.settings, set: (key, value) => modes.course.setOnlineRule(key, value) },
  onShow: () => onlineTabButton?.update(),
});
// How much waits on the online ladders (challenges, results to see).
function onlineWaiting() {
  try {
    return (modes.course.ladderWaiting?.() ?? []).reduce((n, w) => n + 1 + (w.more ?? 0), 0);
  } catch {
    return 0;
  }
}
// And on the seasons by post (an event open to play, a round to send).
function seasonsWaiting() {
  try {
    return modes.course.postSeasonsWaiting?.() ?? 0;
  } catch {
    return 0;
  }
}
// The top bar's Online tab (index.html #online-tab): the Online panel open
// or shut, pressed while it's open, a dot while this bay's in an online
// game, and a count of what waits on the online ladders.
onlineTabButton = (() => {
  const el = document.getElementById("online-tab");
  if (!el) return null;
  el.addEventListener("click", () => onlinePanel.show(!onlinePanel.open));
  // (Another tab picked while it's open: that mode, the panel put away.)
  el.closest("nav")?.addEventListener("click", (e) => {
    if (e.target.closest?.("[data-mode]") && onlinePanel.open) onlinePanel.show(false);
  });
  const tab = {
    update() {
      el.classList.toggle("on", onlinePanel.open);
      el.setAttribute("aria-pressed", String(onlinePanel.open));
      const live = !reelNet && netClient.view.mode !== "off";
      el.classList.toggle("live", live);
      const n = onlineWaiting() + seasonsWaiting();
      const badge = el.querySelector(".online-badge");
      if (badge) {
        badge.textContent = n ? String(n) : "";
        badge.hidden = !n;
      }
      el.title = live ? "Online - you're in an online game: the lobby, and who's in" : "Online - play with friends on other bays: host or join a game, online match ladders, the host's rules";
    },
  };
  tab.update();
  return tab;
})();
// Online: the Online tab opened at a section (a ladder's join link). The
// course panel has nothing of online play: that's the Online tab's alone.
modes.course.onOnlineTab = (tab) => onlinePanel.show(true, tab);
modes.course.isPocket = () => inPocket;
// Over the picture in an online game: quick reactions (one every 30
// seconds; with the screens separate, in the command centre's top bar), and
// the countdown before a start and the game paused (netreact.js,
// netcards.js).
const reactions = new ReactionBar({ send: (ev) => netClient.send(ev), parent: view });
const netCards = new NetCards({ onResume: () => netClient.send({ type: "pause", on: false }) });
// Whether an online game is paused for everyone: a shot isn't played.
function netPaused() {
  const g = netClient.view.game;
  return !reelNet && netClient.view.mode !== "off" && !!g?.started && !g.ended && !!g.paused;
}
// Where everyone finished a game, for the host's match (sim/netresults.mjs).
function recordForMatch(g = netClient.view.game) {
  if (netClient.view.mode !== "host" || !g?.started || !matchKeeper.match || reelNet) return;
  const mode = g.round?.mode ?? "course";
  let result = null;
  if (mode === "course") {
    const r = modes.course.round;
    if (r?.net && r.id === g.round.id && r.finished) result = courseResult({ id: r.id, name: `${g.round.course?.name ?? "Course"}, ${(GAME_NAMES[r.format] ?? r.format).toLowerCase()}`, players: r.players, st: modes.course.game().st });
  } else result = mode === "pong" ? pongResult(g) : tallyResult(g);
  if (result && matchKeeper.record(result)) bay.toast(`Match: ${result.name} counted`, 3000);
}
// A round that was the host's season's event, finished: its places (the
// round's standings, stroke play gross or net) kept with the season, once,
// and everyone told.
function recordForSeason(g = netClient.view.game) {
  if (netClient.view.mode !== "host" || !g?.started || (g.round?.mode ?? "course") !== "course" || !g.round.season || reelNet) return;
  const r = modes.course.round;
  if (!r?.net || r.id !== g.round.id || !r.finished) return;
  const k = g.round.season.k;
  const result = courseResult({ id: r.id, name: g.round.season.name, players: r.players, st: modes.course.game().st });
  if (!result || !seasonKeeper.record(k, result)) return;
  const s = seasonKeeper.season;
  bay.toast(`${s.events[k].name} counted - ${netSeasonLine(s)}`, 5000);
  seasonsSection.render();
}
// A game this bay was in before the app started again: offered once.
let rejoinOffered = false;
// A friend's join link opening the phone app: the code to the Online play
// panel (netinvite.js).
watchJoinLinks(
  (code) => afterLoading.then(() => {
    if (phoneHome.up) phoneHome.toGame?.();
    onlinePanel.joinWith(code);
  }),
  // A match ladder's link: the Online tab's Ladders open, the code ready
  // to join (course/ladderonline.js askToJoinLadder).
  (code) => afterLoading.then(() => {
    if (phoneHome.up) phoneHome.toGame?.();
    modes.course.askToJoinLadder(code);
  }),
  // The PC's "link a phone" QR code: My stats, the code typed in.
  (code) => location.assign(`/pocket/link.html?code=${encodeURIComponent(code)}`),
  // A season by post's link: the Online tab's Seasons, the code ready to
  // join (course/seasonpost.js askToJoinPostSeason).
  (code) => afterLoading.then(() => {
    if (phoneHome.up) phoneHome.toGame?.();
    modes.course.askToJoinPostSeason(code);
  }),
  // The phone app's Google sign-in back from the browser (signin.js).
  (idToken) => afterLoading.then(() => signIn?.googleBack(idToken)),
);
// An online round over on this bay (sim/netgame.mjs afterRound): the host
// takes everyone back to the lobby - from the round card, the course
// panel (the command centre's heading) or the Online play panel - and the
// others are told who they're waiting for (the owner: "stop games, start
// games, and it pull everyone along").
function netAfter() {
  const r = modes.course.round;
  return r?.finished && r.net && !reelNet ? afterRound(netClient.view) : null;
}
function backToLobby() {
  if (!netAfter()?.host) return;
  onlinePanel.show(true, "play");
  onlinePanel.act("lobby");
}
modes.course.netAfter = netAfter;
modes.course.onLobby = backToLobby;
// Online putting, chipping and challenges: everyone's standings.
const netBoard = new NetBoard(view);
const sideModes = () => [modes.putting, modes.chipping, modes.challenges];
modes.course.netSend = (ev) => {
  if (reelNet) return reelNet(ev);
  if (modes.course.round?.net) netClient.send(ev).then((r) => r?.ok === false && bay.toast(`Online play: ${r.error}`, 3000));
};
let netStarted = null;
// How many of this bay's the host had refused through the relay, as last
// seen (server/netplay.mjs view's refused).
let netRefused = null;
// The game as last seen, for who's come and gone since.
let netSeen = null;
// The top bar's Lobby, next to Home, once an online game has started: the
// host stops it (asked first) or, the round over, takes everyone back;
// anyone else gets the Online play panel (lobbybutton.js).
const lobbyOpen = new LobbyButton(document.getElementById("lobby-open"), {
  view: () => netClient.view,
  over: () => !!netAfter()?.host,
  quiet: () => !!reelNet,
  panel: () => onlinePanel.show(true, "play"),
  lobby: () => (onlinePanel.show(true, "play"), onlinePanel.act("lobby")),
});
netClient.onChange((v) => {
  lobbyOpen.update();
  onlineTabButton?.update();
  if (reelNet) return;
  reactions.update(v);
  netCards.update(v);
  matchKeeper.sync(v);
  recordForMatch(v.game);
  seasonKeeper.sync(v);
  recordForSeason(v.game);
  if (v.rejoin && !rejoinOffered) {
    rejoinOffered = true;
    bay.toast(`${v.rejoin.words} - Online play to rejoin it`, 5000);
    if (v.rejoin.started) afterLoading.then(() => netClient.view.rejoin && onlinePanel.show(true, "play"));
  }
  // (The round's Back to the lobby or who it waits for, once this has
  // settled - the host gone, or back in the lobby.)
  queueMicrotask(() => {
    modes.course.renderBetween?.();
    if (roundCards.open) roundCards.render();
  });
  // Who's joined, left, dropped out or come back: said on every bay
  // (sim/netgame.mjs comingsAndGoings).
  const seen = v.mode === "off" ? null : v.game;
  for (const line of comingsAndGoings(netSeen, seen, v.bay)) bay.toast(`Online: ${line}`, 3500);
  netSeen = seen;
  // This bay's carry adjustment: shared, and set aside (or back) as the
  // game's host has it; another bay's changing is said.
  applyCarry();
  shareCarry();
  carryNews(v);
  // Refused through the relay: said here, as a refusal from across the
  // house is (the send's own reply). (Golf pong goes back to the host's
  // match below, with the view this comes with.)
  if ("refused" in v) {
    const n = v.refused?.n ?? 0;
    if (netRefused != null && n > netRefused) bay.toast(`Online play: ${v.refused.error}`, 3000);
    netRefused = n;
  }
  const g = v.game;
  const c = modes.course;
  // Left, or the host stopped: this bay's round carries on by itself.
  netBoard.update(v.mode === "off" ? null : g, { bay: v.bay });
  if (v.mode === "off") for (const m of sideModes()) if (m.net) m.stopNet();
  if (v.mode === "off") netStarted = null;
  if (v.mode === "off" && c.round?.net) {
    for (const p of c.round.players) if (p.remote) p.done = true;
    c.round.net = null;
    c.round.waiting = false;
    bay.toast("Online play has ended - the round carries on here", 3500);
    c.render();
    return;
  }
  // Back in the lobby - the host stopped the game (the owner: "stop games,
  // start games, and it pull everyone along and drag everyone to the same
  // place"): this bay's game stops too, its card showing, and everyone's at
  // the Online play panel for the host's next.
  if (v.mode !== "off" && g && !g.started && netStarted != null) {
    netStarted = null;
    for (const m of sideModes()) m.stopNet?.();
    if (c.round?.net) {
      for (const p of c.round.players) if (p.remote) p.done = true;
      c.round.net = null;
      c.round.waiting = false;
      c.round.holding = false;
      c.endRound({ ask: false });
    }
    bay.toast(v.mode === "host" ? "Game stopped - everyone's back in the lobby" : `${g.bays?.[g.host]?.name ?? "The host"} stopped the game - back in the lobby for the next`, 4000);
    // (The round card makes way: My stats keeps it.)
    roundCards.show(false);
    onlinePanel.show(true, "play");
    return;
  }
  if (!g?.started || g.ended) {
    if (g?.ended && c.round?.net) bay.toast("The host has ended the game", 3000);
    return;
  }
  // The host has started the round: every bay starts it (once the host's
  // course has come).
  if (netStarted !== g.round.id && v.courseReady) {
    netStarted = g.round.id;
    // Everyone told each bay's carry adjustment - or, the host's rule, that
    // everyone's on A-Squared Golf's own (a round's rules say it already).
    const ownCarries = cleanCarryRule(g.round.carry) === "own";
    const carryLine = ownCarries ? ((g.round.mode ?? "course") === "course" ? null : "Online: everyone on A² Golf's own carries this game (the host's rule)") : bayCarryWords(g);
    if (carryLine) setTimeout(() => bay.toast(carryLine, 5000), 9500);
    // Golf pong: one player at each end (or side, four-way), putting in
    // turn or all at once - this bay's played here, the others' rolled here
    // as they went.
    if (g.round.mode === "pong") {
      for (const m of sideModes()) m.stopNet?.();
      netMode("putting");
      const net = {
        names: g.players.map((p) => p.name),
        ids: g.players.map((p) => p.id),
        mine: g.players.map((p, i) => (p.bay === v.bay ? i : -1)).filter((i) => i >= 0),
        // (What the host said back: golf pong all at once counts what it
        // sent till the host has it.)
        // Refused (across the house: through the relay it comes with the
        // view), back to the match as the host has it - in turn, it was
        // left a turn on from the host's.
        send: (ev) =>
          netClient.send(ev).then((r) => {
            if (r?.ok === false) {
              bay.toast(`Online play: ${r.error}`, 3000);
              if (netClient.view.game?.pong) modes.putting.pongNet(netClient.view.game);
            }
            return r;
          }),
      };
      modes.putting.startPong(net, g);
      onlinePanel.show(false);
      return;
    }
    // Putting, chipping or a challenge: every bay to that game, with the
    // host's setup, this bay's players in turn.
    if ((g.round.mode ?? "course") !== "course") {
      const target = g.round.mode === "challenge" ? "challenges" : g.round.mode;
      for (const m of sideModes()) m.stopNet?.();
      netMode(target);
      const net = new NetTurns({
        game: g,
        bay: v.bay,
        send: (ev) => netClient.send(ev).then((r) => r?.ok === false && bay.toast(`Online play: ${r.error}`, 3000)),
        setHitter: (name) => {
          if (recorder.players.includes(name)) recorder.hitter = name;
        },
      });
      modes[target].startNet(net, Object.fromEntries(g.players.map((p) => [p.id, p.colour])));
      bay.toast(`Online: ${g.round.name} - ${g.players.map((p) => p.name).join(", ")}`, 4000);
      onlinePanel.show(false);
      return;
    }
    netMode("course");
    const courseUrl = v.mode === "host" ? `/api/courses/${encodeURIComponent(g.round.course.id)}` : "/api/play/course";
    // Part way through already (the page or app started again): this
    // bay's players picked back up where the game has them
    // (sim/netresume.mjs, course/netresume.js).
    const resume = resumeAt(g, v.bay);
    c.startRound(null, (resume?.hole ?? 0) + 1, { bay: v.bay, game: g, courseUrl, resume }).then(() => bay.toast(resume ? resumeWords(resume) : `Online: ${g.round.course.name} - ${GAME_NAMES[g.round.format] ?? ""} - ${g.players.map((p) => p.name).join(", ")}`, 4000));
    onlinePanel.show(false);
    return;
  }
  if (g.round.mode === "pong") modes.putting.pongNet(g);
  if (c.round?.net && c.round.id === g.round.id) c.applyNet(g);
});
export const video = new VideoRecorder({
  gameCanvas: renderer.domElement,
  cameras,
  replay,
  audio,
  view,
  toast: (text, ms) => bay.toast(text, ms),
  info: () => {
    // Who's up and the club in hand at address; the shot's own player and
    // club from the hit until it has landed (sim/shotphase.mjs) - so the
    // line never names the last hitter for the next one's shot.
    const live = !!videoShot && shotPhase(videoShot, performance.now()).phase !== "address";
    return {
      shot: videoShot,
      player: live ? videoShot.player : hitterNow(),
      club: live ? videoShot.club : currentClub(),
      mode,
      // (Every mode's: the recording's pieces of information read it - sim/videotiles.mjs infoField.)
      overlay: modes[mode]?.overlay?.() ?? null,
      // The hole's map, for the recording's mini map (on the course).
      map: mode === "course" ? (modes.course.mapInfo?.() ?? null) : null,
      card: roundCards.card,
      // What the round counted for, with the card (the Finish scene's
      // standings layer).
      standings: roundCards.card ? finishStandings() : [],
    };
  },
});
gameWindowsTo = (w) => video.compositor.setGameWindows(w);

// What's over the game picture but not in it - a celebration's banner, the
// swing replay and the mode's cards over it (the scorecard between holes:
// course/buggy.js pictureCards) - drawn into recordings too, as the game
// window shows them (compositor.js setOverlays).
video.compositor.setOverlays(() => ({ banner: modes[mode]?.celebration?.bannerFrame?.() ?? null, replay: swingReplay.frame(), cards: modes[mode]?.pictureCards?.() ?? null }));
// The game's picture lost when the graphics process crashed (the card
// reset): a recording holds its last picture meanwhile rather than going on
// without it, and if the card hasn't given it back in a few seconds the
// page is opened again to get it, the recording carrying on in its next
// file - or, when that would end a round, the player's told how
// (sim/gamepicture.mjs; the owner, 20 October 2026: "the second half of the
// video was a bit buggy and missing the main game screen").
let pictureLostAt = null;
let pictureTold = false;
onCardReset(renderer, (type) => {
  const lost = type !== "context-restored";
  if (lost === (pictureLostAt != null)) return;
  pictureLostAt = lost ? performance.now() : null;
  pictureTold = false;
  video.compositor.setGameLost(lost);
  video.pictureLost(lost);
});
setInterval(() => {
  if (pictureLostAt == null) return;
  const act = afterLoss({ lostFor: performance.now() - pictureLostAt, busy: busy(), told: pictureTold });
  if (act === "reload") {
    pictureLostAt = null;
    location.reload();
  } else if (act === "tell") {
    pictureTold = true;
    bay.toast(lostWords(busy()), 15000);
  }
}, 1000);
// The end of a round on the course: the recording's Finish scene, and
// back from it when the next round starts (sim/videoscenes.mjs).
modes.course.onRoundEnd = () => {
  video.roundEnded();
  // An online round finished with the host's match on, or as its season's
  // event: counted.
  setTimeout(() => (recordForMatch(), recordForSeason()), 0);
  // And to another launch monitor's connector, as GSPro says it ("GSPro
  // round ended"): some disarm the launch monitor on it.
  fetch("/api/round-ended", { method: "POST" }).catch(() => {});
};
modes.course.onRoundStart = () => {
  sideFold?.played();
  roundCards.set([]);
  roundCards.show(false);
  video.roundStarted();
};
// The round card at the end of a round (roundcard.js): after the round's
// celebration, over the picture - and in the recording's Finish scene.
// Online with no card (a scramble's is the team's), the Online play
// panel instead: the host's Back to the lobby, or who the others wait for.
modes.course.onRoundCard = (cards) => {
  roundCards.set(cards);
  if (!cards.length && !netAfter()) return;
  setTimeout(() => {
    if (mode !== "course" || !modes.course.round?.finished || menu?.open || onlinePanel.open) return;
    if (roundCards.cards.length) roundCards.show(true);
    else if (netAfter()) onlinePanel.show(true, "play");
  }, 7000);
};
// What's being recorded, on the game window: a box while recording (the
// Recording panel's "On the game window"), and Shift + Q flicking the
// whole window to the recording's picture and back.
export const videoMonitor = new VideoMonitor({ video, view });
export function flickRecording() {
  const words = videoMonitor.flick();
  if (words) bay.toast(words, 2500);
}
export const videoPanel = new VideoPanel({ video, cameras, bridge: window.golfsimApp ?? null, toast: (text, ms) => bay.toast(text, ms), record: (doc) => toggleVideo({ doc }) });
// tab: the page it opens on ("replays": every saved replay).
export function showVideo(tab = null) {
  videoPanel.show(true, tab);
  screens.focusControls();
}
// Started from a screen someone's at (the Record button, Shift + V, the
// menu, the Recording panel): what to record is asked there (recordchoice.js)
// unless What to record says; by voice, nobody can pick, so it's what was
// recorded last (sim/videorec.mjs startHow). doc: the page it was asked
// from - the laptop's, with the screens separate.
export async function toggleVideo({ doc = (screens.separate && screens.doc) || document, by = "button" } = {}) {
  const was = video.recording;
  let ok;
  if (was) ok = await video.stop();
  else {
    const how = startHow(video.settings, { by, active: video.layouts.active });
    const pick = how.ask ? await chooseRecording(doc, video.layouts, video.settings) : how;
    if (!pick || video.recording) return;
    const voiceScreen = by === "voice" && pick.what === "screen";
    ok = await video.start({ what: pick.what, scene: pick.scene, quiet: voiceScreen });
    // A browser hands over the screen only after a click, and a voice has
    // none: the scene picked in Layout instead.
    if (!ok && voiceScreen && !video.recording) ok = await video.start({ what: "scene", scene: video.layouts.active });
  }
  // Started: said, and - when the recordings' allowance is nearly full - how
  // long before the oldest recording is deleted to make room.
  if (ok && !was) {
    const room = video.roomWarning();
    bay.toast(room ? `Recording - Shift + V stops it. ${room}` : "Recording - Shift + V stops it", room ? 5000 : 1800);
  }
}
document.getElementById("video-toggle")?.addEventListener("click", (e) => {
  e.currentTarget.blur();
  showVideo();
});
// The Record button: a red dot, and the time while recording (shown in one
// window too while it's recording, to stop it).
const videoBtn = document.getElementById("video-rec");
videoBtn.addEventListener("click", (e) => {
  e.currentTarget.blur();
  toggleVideo({ doc: docOf(e.currentTarget) });
});
function showVideoButton() {
  videoBtn.classList.toggle("on", video.recording);
  videoBtn.classList.toggle("slow", !!video.hint);
  videoBtn.querySelector(".rec-time").textContent = video.recording ? video.elapsedText() : "Rec";
  videoBtn.title = video.recording ? `Recording ${video.elapsedText()} - click or Shift + V to stop${video.hint ? `\n${video.hint}` : ""}` : "Record video (Shift + V) - the Recording button beside it lays out what's in it";
}
video.onChange(showVideoButton);
setInterval(() => video.recording && showVideoButton(), 1000);
showVideoButton();
const clubWrap = document.getElementById("club-wrap");
const hitterWrap = document.getElementById("hitter-wrap");

const clubSelect = document.getElementById("club");
clubSelect.innerHTML = CLUBS.map((c) => `<option value="${c}">${clubShort(c)}</option>`).join("");
clubSelect.value = heldClub();

// ---- The club in hand ---------------------------------------------------------
//
// One club for the whole program (sim/clubinhand.mjs says why): stored once,
// as the "app" setting's club, and changed by every way of changing club -
// the top bar's picker, ↑ ↓ and the clicker, voice, and each mode's own
// picker and keys. Each
// mode takes it up when it can use it; when it can't, it plays its nearest
// club for now and says so, and the club in hand stays as it was.
function heldClub() {
  return holdable(prefs.club, CLUBS) ? prefs.club : "DR";
}
// Kept, and shown everywhere it shows. False when it was already the club.
function holdClub(club) {
  if (!holdable(club, CLUBS) || club === prefs.club) return false;
  prefs.club = club;
  saveSetting("app", prefs);
  clubSelect.value = club;
  return true;
}
// Set while the page puts a club into a mode itself, so the mode's own
// news of it isn't taken as the player changing club there.
let pushing = false;
function quietly(fn) {
  const was = pushing;
  pushing = true;
  try {
    fn();
  } finally {
    pushing = was;
  }
}
// What the mode on show can do with the club in hand (sim/clubinhand.mjs).
function clubHere() {
  const c = modes.course;
  const ch = modes.challenges;
  return clubInHand(mode, heldClub(), {
    order: CLUBS,
    chipClubs: CHIP_CLUB_LIST,
    course: { round: Boolean(c.round && !c.round.done), onGreen: c.onGreen, lie: c.me?.lie, current: c.me?.club ?? null },
    challenge: { game: ch.playing, clubs: ch.clubs, current: ch.playing ? ch.club : null },
    name: clubName,
  });
}
// The mode on show takes up the club in hand, or the nearest it can play
// (saying so when say is set: on going into the mode). The Omni is told by
// the caller.
function offerClub({ say = false } = {}) {
  const got = clubHere();
  if (got.club && got.club !== "PT") {
    quietly(() => {
      if (mode === "chipping" && got.club !== modes.chipping.club) modes.chipping.setClub(got.club);
      else if (mode === "course" && got.club !== modes.course.club) modes.course.setClub(got.club);
      else if (mode === "challenges" && got.club !== modes.challenges.club) modes.challenges.setClub(got.club);
    });
  }
  if (say && got.why) bay.toast(got.why, 2500);
}
// Everything showing the club catches up, and the Omni is told once.
function clubChanged() {
  sendClub();
  modes.range.showLieGuide();
  refreshOverlay();
}
// A mode changed its own club: that's the club in hand now (the putter
// aside). Not while the page is putting one there, nor from a mode that
// isn't on show (a course round being set up behind the range).
function modeClub(name, club) {
  if (pushing || modes[name] !== modes[mode]) return;
  holdClub(club);
  clubChanged();
}

// Tells the connector which club is in hand. In putting mode that is the
// putter, which is what switches a Square into putting.
function currentClub() {
  if (mode === "putting") return "PT";
  if (mode === "chipping") return modes.chipping.club;
  if (mode === "course") return modes.course.round ? (modes.course.onGreen ? "PT" : modes.course.club) : heldClub();
  if (mode === "challenges") return modes.challenges.playing ? modes.challenges.club : heldClub();
  return heldClub();
}
function sendClub() {
  const club = currentClub();
  // For another launch monitor's connector too (Open Connect's player
  // information): yards to the pin or hole where the mode knows it, and
  // which hand the player in turn plays with.
  let distance;
  try {
    distance = modes[mode]?.targetYards?.() ?? undefined;
  } catch {
    distance = undefined;
  }
  const handed = handOf(profiles, hitterNow()) === "left" ? "LH" : "RH";
  fetch("/api/club", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ club, distance, handed }),
  }).catch(() => {});
}

export function setMode(next) {
  const changed = startedUp && next !== mode;
  // Leaving a drill's mode ends the drill.
  if (practicePlan?.active && next !== practicePlan.run.drill.mode) practicePlan.stop();
  // Leaving a practice mode ends its session (and may say how it went).
  if (next !== mode && !hasTurns()) recorder.endSession(mode);
  mode = next;
  prefs.mode = next;
  phoneRange?.shown(mode === "range");
  saveSetting("app", prefs);
  for (const btn of modeButtons) btn.classList.toggle("active", btn.dataset.mode === mode);
  modePick.show(modeButtons.find((b) => b.dataset.mode === mode)?.textContent ?? "");
  // (Quietly: a mode setting up its club as it starts isn't the player
  // changing club - the club in hand is offered to it just below.)
  quietly(() => {
    for (const name of Object.keys(modes)) {
      panels[name].hidden = name !== mode;
      // One mode failing to start mustn't leave the top bar, club and overlay
      // half switched: it's logged, and the switch carries on.
      try {
        modes[name].setActive?.(name === mode);
      } catch (err) {
        console.error(`Couldn't ${name === mode ? "start" : "leave"} ${name}:`, err);
      }
    }
  });
  // In the mode's own light: a round's, the range's, else the page's
  // (look/environment.js useSun; the sun is every scene's).
  try {
    useSun(modes[mode]?.scene, modes[mode]?.sunNow?.());
  } catch (err) {
    console.error("Couldn't set the light:", err);
  }
  offerClub({ say: true });
  // Whatever the mode built on coming in (Challenges' scenery), its
  // shaders started now rather than at its first frame (look/warmup.js).
  warmUp(renderer, modes[mode].scene, modes[mode].camera);
  // And its shapes sent while it settles, before anything flies over them
  // (look/gpuprep.js; the course's own are sent with each shot set up).
  const shown = modes[mode];
  if (shown.scene && shown.camera) idleWork.add({ id: "send-new", after: performance.now() + 1500, priority: 1, steps: () => sendNewSteps(renderer, shown.scene, shown.camera, shown.scene, { near: shown.treePath?.() ?? null }) });
  // The recording's scene for this mode, if it has one (videorec.js).
  video.modeChanged(mode);
  // The club in hand, to change from the top bar in every mode with a
  // choice of club (on the course and in the Challenges it's the player's
  // up: offerClub) - not on the putting green.
  clubWrap.hidden = mode === "putting";
  // On the course and in the Challenges it's whoever's turn it is.
  hitterWrap.hidden = hasTurns();
  showHitters();
  // A course round is round play: the recording switch says so there.
  recording.render();
  showNextShot();
  sendClub();
  refreshOverlay();
  resize();
  if (changed) reconfirmWho();
}
for (const btn of modeButtons) btn.addEventListener("click", () => setMode(btn.dataset.mode));
// Picking a club, however it's done: it's the club in hand, and the mode on
// show takes it up.
function setClub(club) {
  holdClub(club);
  clubSelect.value = heldClub();
  offerClub();
  clubChanged();
}
clubSelect.addEventListener("change", () => setClub(clubSelect.value));

// Who's hitting, in the practice modes: the course's players list.
const hitterSelect = document.getElementById("hitter");
// Signing in to play (signin.js): made below, with Who's playing.
export let signIn = null;
function showHitters() {
  hitterSelect.innerHTML =
    recorder.players.map((n) => `<option>${esc(n)}</option>`).join("") +
    `<option value="__add">Who's playing...</option>` +
    `<option value="__names">Saved players...</option>` +
    (signIn?.ready ? `<option value="__accounts">Signed in...</option>` : "");
  hitterSelect.value = recorder.hitter;
}
hitterSelect.addEventListener("focus", showHitters);
hitterSelect.addEventListener("change", () => {
  if (hitterSelect.value === "__add") return addPlayer();
  if (hitterSelect.value === "__names") return openPlayers();
  if (hitterSelect.value === "__accounts") return (showHitters(), signIn.switcher());
  recorder.hitter = hitterSelect.value;
  modes.range.showLieGuide();
});
// ---- Who's playing, and the saved players (sim/profiles.mjs) ---------------------

// A phone linked to the PC (phonelinkpage.js): made just below.
let pagePhoneLink = null;
const saveProfiles = (p) => {
  profiles = p;
  saveSetting("profiles", p);
  tellVoice();
  pagePhoneLink?.tell();
};
// The same names, the same players, on a linked phone and the PC.
pagePhoneLink = new PagePhoneLink({ pocket: inPocket, profiles: () => profiles, save: saveProfiles });
// A ladder joined in a browser signed in to this PC (course/ladderweb.js):
// taken up when the link says one's come - and once soon after the game
// opens, for any that came while it was shut.
if (!inPocket) {
  pagePhoneLink.onInbox = () => modes.course?.takeWebInbox?.();
  setTimeout(() => modes.course?.takeWebInbox?.(), 45000);
}
// Voice hears "Alex hitting" for these names (once it's made).
function tellVoice() {
  try {
    voice.setNames(sayableNames());
  } catch {
    // (Not made yet: it's told as the game starts.)
  }
}
// The names "Alex hitting" can be said for: the saved players and the
// guests playing.
const sayableNames = () => [...profileNames(profiles), ...recorder.players.filter(isGuest)];
// Anyone typed onto the players list who isn't a guest is a saved player
// from then on (the course's and the challenges' panels). Not while the
// game's video plays its own players.
function keepProfiles(names) {
  if (settingsHeld()) return;
  let p = profiles;
  for (const n of names) if (!isGuest(n) && !isProfile(p, n)) p = addProfile(p, n);
  if (p !== profiles) saveProfiles(p);
}
// A saved player renamed (here, or on a players list): their stats go with
// them on the server, and their handicap, bests and practice plans here.
// Their old name a guest's: they're saved under the new one. Returns
// whether they were renamed. keep: a players list already shows the new
// name, so it's kept as a saved player even when the stats couldn't move
// (the Saved players box puts the old name back instead).
async function renameEverywhere(from, to, { keep = true } = {}) {
  if (settingsHeld()) return false;
  const refused = (why) => {
    bay.toast(`${why} - ${from}'s stay under ${from}`, 3500);
    if (keep) keepProfiles([to]);
    return false;
  };
  if (!isProfile(profiles, from) || nameProblem(profiles, to, from)) {
    if (keep) keepProfiles([to]);
    return false;
  }
  try {
    const r = await fetch("/api/stats/rename", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ from, to }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return refused(d.error ?? "Couldn't move the stats");
  } catch {
    return refused("Couldn't reach the stats");
  }
  saveProfiles(renameProfile(profiles, from, to));
  const c = modes.course.settings;
  c.hcp = renameKey(c.hcp, from, to);
  saveSetting("course", c);
  mouseSwing.players = renameKey(mouseSwing.players, from, to);
  mouseSwing.climb = renameKey(mouseSwing.climb, from, to);
  saveSetting("mouseSwing", mouseSwing);
  for (const key of ["streaks", "practicePlans"]) {
    const kept = loadSetting(key, null);
    if (kept && typeof kept === "object") saveSetting(key, renameKey(kept, from, to));
  }
  if (recorder.prefs.name === from) recorder.hitter = to;
  return true;
}

// The "Who's playing?" card: once as the game starts (unless turned off),
// then from the menu, the Hitting list and a click on who's hitting. The
// saved players to tap in and out, guests, a new player; Skip plays as a
// guest. A reload while the game runs doesn't ask again (sim/profiles.mjs
// whoPrompt): the session remembers it was asked.
const whoDialog = document.getElementById("who-dialog");
const whoCheck = document.getElementById("who-check");
let whoPlaying = [GUEST];
export const askWho = () => loadSetting("askPlayers", true) !== false;
const WHO_ASKED = STARTED_KEY;
function whoAsked() {
  try {
    return sessionStorage.getItem(WHO_ASKED) === "1";
  } catch {
    return false;
  }
}
function markWhoAsked() {
  try {
    sessionStorage.setItem(WHO_ASKED, "1");
  } catch {
    // Not kept: asked again on a reload.
  }
}
function whoRender() {
  const list = whoDialog.querySelector(".who-list");
  list.innerHTML = profiles.list.length
    ? profiles.list
        .map((q) => {
          const at = whoPlaying.indexOf(q.name);
          return `<button type="button" class="who-chip${at >= 0 ? " on" : ""}" data-name="${esc(q.name)}" aria-pressed="${at >= 0}"><span style="background:${PLAYER_COLOURS[q.colour ?? 0]}"></span>${esc(q.name)}${q.hand === "left" ? " <i>L</i>" : ""}${at >= 0 ? ` <b>${at + 1}</b>` : ""}</button>`;
        })
        .join("")
    : `<p class="small">No saved players yet - add one below, or play as a guest.</p>`;
  whoDialog.querySelector(".who-now").textContent = playingWords(whoPlaying);
  whoDialog.querySelector(".who-guest").disabled = whoPlaying.length >= MAX_PLAYERS;
}
whoDialog.querySelector(".who-list").addEventListener("click", (e) => {
  const chip = e.target.closest("[data-name]");
  if (!chip) return;
  whoPlaying = togglePlaying(whoPlaying, chip.dataset.name);
  whoRender();
});
whoDialog.querySelector(".who-guest").addEventListener("click", () => {
  whoPlaying = addGuest(whoPlaying);
  whoRender();
});
function whoAddNew() {
  const input = whoDialog.querySelector(".who-new");
  const name = input.value.trim();
  const why = nameProblem(profiles, name);
  if (why) return bay.toast(why, 2200, { force: true });
  saveProfiles(addProfile(profiles, name));
  whoPlaying = togglePlaying(whoPlaying, name);
  input.value = "";
  whoRender();
}
whoDialog.querySelector(".who-add").addEventListener("click", whoAddNew);
whoDialog.querySelector(".who-new").addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  e.preventDefault();
  whoAddNew();
});
whoDialog.querySelector(".who-edit").addEventListener("click", () => openPlayers({ then: whoRender }));
export function openWho() {
  showHitters();
  menu?.show(false);
  whoPlaying = playingFrom(recorder.players, profiles);
  whoRender();
  whoDialog.returnValue = "";
  screens.focusControls?.();
  whoDialog.showModal();
}
// The players chosen: the course's list (and so every mode's), the first
// of them hitting.
async function playWith(names) {
  if ((await modes.course.changePlayers(names)) === false) return;
  recorder.hitter = recorder.players[0];
  tellVoice();
  showHitters();
  refreshOverlay();
  menu?.refresh?.(["hitter", "players"]);
  bay.toast(playingWords(recorder.players), 3000);
}
whoDialog.addEventListener("close", () => {
  if (whoDialog.returnValue === "play" || whoDialog.returnValue === "skip") endWarmUp();
  if (whoDialog.returnValue === "play") playWith(whoPlaying);
  else if (whoDialog.returnValue === "skip") playWith([GUEST]);
});
// Signing in to play (signin.js; the owner, 10 November 2026: "require all
// versions to at least signup/login ... automatically load back into that
// user on next login. Give the ability to click the player name to change
// user or add more users"): the account's player hitting. As the game
// starts, straight in as them - the Who's playing card answered with them;
// after, from the switcher. On the course and in the challenges it's
// whoever's turn it is.
async function playAs(player, { start = false } = {}) {
  if (settingsHeld()) return;
  keepProfiles([player]);
  if (whoDialog.open) {
    whoPlaying = [player];
    whoDialog.close("play");
    return;
  }
  if (hasTurns()) return;
  if (!recorder.players.includes(player)) return playWith([player, ...recorder.players.filter((n) => n !== player && !isGuest(n))]);
  recorder.hitter = player;
  showHitters();
  tellVoice();
  if (!start) refreshOverlay();
}
signIn = new SignIn({ players: () => profileNames(profiles), playAs, openWho, toast: (text, ms) => bay.toast(text, ms) });
// The warm-up as the game starts, before Who's playing is answered (sim/
// profiles.mjs startSequence): the range's balls fly and their numbers
// show, but nothing's kept - no stats, no shot history, no club checks or
// tips - until Play (or Skip, as a guest). Closed without either, it goes
// on; a click on the box saying so opens the card again.
function startWarmUp() {
  warmingUp = true;
  refreshOverlay();
}
function endWarmUp() {
  if (!warmingUp) return;
  warmingUp = false;
  // The warm-up's balls and lines off the range: the session's from here.
  modes.range.clearSession({ end: false });
  refreshOverlay();
}
// On changing game with more than one playing: a yes/no, not the whole
// card - No opens it. Not in a drill, the demo or the speed test, nor as
// online play sets the game.
let whoQuiet = false;
function netMode(next) {
  whoQuiet = true;
  try {
    setMode(next);
  } finally {
    whoQuiet = false;
  }
}
function reconfirmWho() {
  if (whoQuiet || bay.hush || practicePlan?.active || whoDialog.open || whoCheck.open) return;
  if (whoPrompt({ on: askWho(), asked: true, players: recorder.players, change: true }) !== "confirm") return;
  whoCheck.querySelector(".who-check-text").textContent = `Still the same players - ${recorder.players.join(", ")}?`;
  whoCheck.returnValue = "";
  screens.focusControls?.();
  whoCheck.showModal();
  whoCheck.querySelector('button[value="yes"]').focus();
}
whoCheck.addEventListener("close", () => {
  if (whoCheck.returnValue === "change") openWho();
});
// Picking someone from the Hitting list's "Who's playing..." (and the menu's).
export function addPlayer() {
  openWho();
}

// The saved players, edited in one place (the owner: "there's nowhere to
// set myself as a player name - make it obvious"): a name, a colour, which
// hand, a handicap index, their level with the mouse or a controller
// (sim/swinglevels.mjs; blank: the menu's) and simple play each. A name changed takes its
// stats with it; a player removed keeps their stats (on the stats page, or
// back by adding them again).
const playersDialog = document.getElementById("players-dialog");
const colourOptions = (c) => PLAYER_COLOURS.map((hex, i) => `<option value="${i}"${i === c ? " selected" : ""}>${COLOUR_NAMES[i]}</option>`).join("");
function playerRows(rows) {
  const list = playersDialog.querySelector(".pd-list");
  list.innerHTML = rows
    .map(
      (r, i) =>
        `<div class="pd-row" data-orig="${esc(r.orig ?? "")}"><span style="background:${PLAYER_COLOURS[r.colour ?? 0]}"></span>` +
        `<input type="text" maxlength="20" autocomplete="off" value="${esc(r.name)}" aria-label="Player ${i + 1}" placeholder="Name">` +
        `<select data-colour title="Their colour" aria-label="Colour">${colourOptions(r.colour ?? 0)}</select>` +
        `<select data-hand title="Which hand they play with: a left-hander's draw and fade are the other way round in the tips" aria-label="Hand"><option value="right"${r.hand !== "left" ? " selected" : ""}>Right</option><option value="left"${r.hand === "left" ? " selected" : ""}>Left</option></select>` +
        `<input type="number" data-hcp step="0.1" min="-10" max="54" value="${esc(r.hcp ?? "")}" placeholder="hcp" title="Handicap index - leave blank to use their stats'" aria-label="Handicap">` +
        `<select data-level title="Their level with the mouse or a game controller - the menu's (Without a launch monitor), or their own" aria-label="Mouse and controller level"><option value="">Level: the menu's</option>${LEVEL_ORDER.map((v) => `<option value="${v}"${r.level === v ? " selected" : ""}>${LEVELS[v].label}</option>`).join("")}</select>` +
        // (How far they are towards the next level: sim/levelup.mjs.)
        (r.orig ? `<small class="pd-climb" title="Good rounds on the course at this level, towards the next: two move them up">${esc(levelProgress(r.orig, { short: true, level: r.level || mouseSwing.level }))}</small>` : "") +
        `<label class="pd-simple" title="Simple play - for young children: their shots go in their stats, but nothing is said about them (no club checks, no notes on strikes, no tips)"><input type="checkbox" data-simple${r.simple ? " checked" : ""}> Simple</label>` +
        `<button type="button" data-remove="${i}" title="Remove from the saved players (their stats are kept)">×</button>` +
        `</div>`,
    )
    .join("");
  playersDialog.querySelector(".pd-add").disabled = rows.length >= 24;
}
const typedRows = () =>
  [...playersDialog.querySelectorAll(".pd-row")].map((row) => ({
    orig: row.dataset.orig || null,
    name: row.querySelector("input[type=text]").value.trim().slice(0, 20),
    colour: Number(row.querySelector("select[data-colour]").value),
    hand: row.querySelector("select[data-hand]").value,
    hcp: row.querySelector("input[data-hcp]").value,
    level: row.querySelector("select[data-level]").value,
    simple: row.querySelector("input[data-simple]").checked,
  }));
playersDialog.querySelector(".pd-list").addEventListener("click", (e) => {
  const b = e.target.closest("[data-remove]");
  if (!b) return;
  const rows = typedRows();
  rows.splice(Number(b.dataset.remove), 1);
  playerRows(rows);
});
playersDialog.querySelector(".pd-list").addEventListener("change", (e) => {
  // The colour's dot follows its choice.
  const sel = e.target.closest("select[data-colour]");
  if (sel) sel.parentElement.querySelector("span").style.background = PLAYER_COLOURS[Number(sel.value)];
});
playersDialog.querySelector(".pd-add").addEventListener("click", () => {
  const rows = typedRows();
  const used = rows.map((r) => r.colour);
  const colour = Math.max(0, PLAYER_COLOURS.findIndex((_, i) => !used.includes(i)));
  playerRows([...rows, { orig: null, name: "", colour, hand: "right", hcp: "", level: "", simple: false }]);
  [...playersDialog.querySelectorAll(".pd-list input[type=text]")].at(-1)?.focus();
});
let afterPlayers = null;
export function openPlayers({ then = null } = {}) {
  showHitters();
  menu?.show(false);
  afterPlayers = then;
  const hcp = modes.course.settings.hcp ?? {};
  playerRows(profiles.list.map((q) => ({ orig: q.name, name: q.name, colour: q.colour, hand: q.hand, hcp: hcp[q.name] ?? "", level: mouseSwing.players[q.name] ?? "", simple: profiles.simple.includes(q.name) })));
  playersDialog.returnValue = "";
  screens.focusControls?.();
  playersDialog.showModal();
}
playersDialog.addEventListener("close", async () => {
  const then = afterPlayers;
  afterPlayers = null;
  if (playersDialog.returnValue !== "save") return then?.();
  const rows = typedRows().filter((r) => r.name);
  const problems = [];
  // Removed first, then renamed (their stats moved), then the new ones.
  const kept = new Set(rows.map((r) => r.orig).filter(Boolean));
  const gone = profileNames(profiles).filter((n) => !kept.has(n));
  let p = profiles;
  for (const n of gone) p = removeProfile(p, n);
  saveProfiles(p);
  const renames = [];
  for (const r of rows) {
    if (r.orig && r.name !== r.orig) {
      const why = nameProblem(profiles, r.name, r.orig);
      if (why) {
        problems.push(why);
        r.name = r.orig;
        continue;
      }
      if (await renameEverywhere(r.orig, r.name, { keep: false })) renames.push([r.orig, r.name]);
      else {
        problems.push(`${r.orig} kept their name`);
        r.name = r.orig;
      }
    } else if (!r.orig) {
      const why = nameProblem(profiles, r.name);
      if (why) {
        problems.push(why);
        r.skip = true;
        continue;
      }
      saveProfiles(addProfile(profiles, r.name));
    }
  }
  const c = modes.course.settings;
  c.hcp ??= {};
  for (const r of rows) {
    if (r.skip) continue;
    saveProfiles(setProfile(profiles, r.name, { colour: r.colour, hand: r.hand, simple: r.simple }));
    const v = Number(r.hcp);
    if (r.hcp === "" || !Number.isFinite(v)) delete c.hcp[r.name];
    else c.hcp[r.name] = Math.max(-10, Math.min(54, Math.round(v * 10) / 10));
    setSwingLevel(r.level, r.name);
  }
  // Who's playing now: under their new names, those removed out of it.
  const before = recorder.players;
  const now = before.map((n) => renames.find(([f]) => f === n)?.[1] ?? n).filter((n) => !gone.includes(n));
  if (now.length !== before.length) modes.course.changePlayers(now.length ? now : [GUEST]);
  else {
    c.players = now;
    const r = modes.course.round;
    if (r && !r.finished) r.players.forEach((q) => (q.name = renames.find(([f]) => f === q.name)?.[1] ?? q.name));
    modes.course.render?.();
  }
  saveSetting("course", c);
  modes.course.renderPlayers();
  showHitters();
  // (A hand changed: the range's mats laid for it.)
  modes.range.showLieGuide();
  refreshOverlay();
  menu?.refresh?.(["hitter", "players"]);
  bay.toast(problems.length ? problems.join(" - ") : `Saved players: ${profileNames(profiles).join(", ") || "none"}`, 2800);
  then?.();
});
// (Who's signed in, and Who's playing from there, once signing in's set up.)
bay.onPlayerClick = () => (signIn?.ready ? signIn.switcher() : openWho());

// ---- The graphics' highest setting, and asking when they keep switching -------
// The highest setting the graphics may use (menu): one lower than the
// setting chosen brings it down, and a picture built higher sheds the
// extras at once (fps.js) - the next start builds the new setting.
export function setHighestGraphics(v) {
  saveSetting("graphics", chooseHighest(loadSetting("graphics", {}), v));
  frameRate.setHighest(v);
  menu?.refresh?.(["graphics", "graphics-highest"]);
  return `Highest graphics: ${GRAPHICS_NAMES[v]}`;
}
// The graphics kept switching back and forth between two settings, so the
// safety valve stopped on the lower one (fps.js; it only switches between
// shots). Asked once a session: make that the highest?
let settleAsked = false;
function askSettle(between) {
  if (settleAsked) return;
  settleAsked = true;
  bay.ask(
    settleQuestion(between),
    [
      { label: "Yes", run: () => bay.toast(`${setHighestGraphics(between.lower)} - the menu changes it (How it looks)`, 3500) },
      { label: "Not now", run: () => {} },
    ],
    { head: "Graphics" },
  );
}

// ---- Key tips: a key that helps right now, shown now and then -----------------
// (sim/keyhints.mjs picks it; dismissed ones are kept.)
export let hints = { ...cleanHintState(loadSetting("hints", {})), started: Date.now() };
let shotSince = 0; // when the last shot came in, for the tips after one
export function setHints(next) {
  hints = next;
  const { dismissed, shown, off } = hints;
  saveSetting("hints", { dismissed, shown, off });
}
export function dismissTip(id) {
  setHints(dismissHint(hints, id));
  bay.showHint(null);
  bay.toast(hintsLeft(hints) ? "That tip won't show again" : "No more key tips - the menu brings them back", 1800);
  menu?.refresh?.(["key-tips"]);
}
bay.onHintDismiss = dismissTip;
function hintContext() {
  const c = modes.course;
  let flying = false;
  try {
    flying = !!modes[mode]?.flying;
  } catch {
    // (A mode without one.)
  }
  const r = mode === "course" && c.round && !c.round.finished ? c.round : null;
  return {
    mode,
    // The putting green's golf pong (its own keys: no read, no line).
    pong: mode === "putting" && !!modes.putting.isPong,
    onGreen: !!r && !!c.onGreen,
    // A putt to play - on the green, or the putter picked off it.
    putting: !!r && !r.done && !c.me?.done && !!c.putting,
    holeDone: !!r?.done,
    round: !!r,
    // Where the ball lies, and how far from the pin.
    lie: r && !r.done && !c.me?.done ? (c.me?.lie ?? null) : null,
    toPin: r && !r.done ? c.yardsToPin : null,
    trouble: !!r && !r.done && c.inTrouble(),
    fromBall: !!r && !!c.fromBall,
    relief: !!r && !!c.relief,
    // A drop's spot being chosen in its relief area; out of the water
    // (where it has to be dropped, not played as it lies).
    placing: !!r && !!c.relief?.pick,
    reliefWater: !!r && !!c.relief?.water,
    lookDown: !!r && !!c.lookDown,
    flyover: mode === "course" && !!c.flyover,
    // Between holes, the cart watched: the arrows are its wheel and speed
    // ("watch" till the wheel's taken, then "drive" - course/buggy.js).
    cart: mode === "course" ? c.driveState() : null,
    // A scramble's team ball to pick: from how many.
    pick: r && r.pick != null && !r.pending ? (r.scr?.[r.pick]?.members.length ?? 0) : 0,
    pending: !!r && !!r.pending && !r.done,
    // A mulligan can be taken now (Mulligans on, a stroke to take back).
    mulligan: !!r && !c.mulliganRefused(),
    session: mode === "range" && !!modes.range.sessionView,
    gapping: mode === "range" && !!practicePlan?.gapping,
    challenge: mode === "challenges" ? (modes.challenges.state ?? null) : null,
    card: recorder.voiceWaiting().card,
    recording: !!video.recording,
    voice: !!voice.enabled,
    wake: wakeName(),
    afterShot: shotSince > 0 && Date.now() - shotSince < 5 * 60_000,
    // A replay to watch (Q) and one to keep (Shift + S): none without a
    // swing camera, but the course's flight again (replayShot).
    canReplay: replayable(),
    canSave: swingReplay.canReplay,
    multi: recorder.multi,
    flying,
    busy: !!(menu?.open || bay.helpOpen || bay.asking || welcome.open || recorder.review || document.hidden || reel?.active || speedTest?.running || rendererTest?.running),
  };
}
setInterval(() => {
  // No tips while someone playing simple is hitting - nor while a finger
  // plays (they name keys it hasn't got; the touch strip has their buttons).
  if (bay.hint || isSimple(profiles, hitterNow()) || touchControls?.shown) return;
  const now = Date.now();
  const h = nextHint(hintContext(), hints, now);
  if (!h) return;
  bay.showHint(h, HINT_TIMES.show);
  setHints(hintShown(hints, h.id, now));
}, 5000);
// Every other mode got ready in the quiet moments once the game's going
// (sim/idlework.mjs): the Challenges' scenery behind its cards built a step
// at a time, then each mode's shaders built (in the background where the
// card can, waited for) and its shapes sent to the graphics card - so
// coming into one for the first time doesn't stop the picture.
function prepareOtherModes() {
  // (Not on the phone, opened in another: buildLater.)
  if (!buildLater("challenges")) modes.challenges?.prepareAhead?.(idleWork);
  // (Only where the card builds shaders in the background: elsewhere
  // building them - or drawing anything that needs them - would stop the
  // picture just as switching does.)
  if (!backgroundShaders) return;
  idleWork.add({
    id: "other-modes",
    after: performance.now() + 8000,
    priority: -1,
    steps: function* () {
      for (const [name, m] of Object.entries(modes)) {
        if (name === mode || !m.scene || !m.camera || m.unbuilt) continue;
        let built = false;
        warmUp(renderer, m.scene, m.camera).then(() => (built = true));
        for (let k = 0; !built && k < 600; k++) yield WAIT;
        yield* sendNewSteps(renderer, m.scene, m.camera, m.scene);
      }
    },
  });
}

// The command centre's Keys box (ccwidgets.js): the keys that help with
// what's happening (sim/keyhints.mjs keysNow), kept up as the game's words
// are (refreshOverlay) and every second while it's showing, for what
// changes besides (a card, the session view). A line clicked there is that
// key pressed (pressKey).
setInterval(() => refreshKeys(), 1000);
function refreshKeys() {
  try {
    if (commandWidgets.wantsKeys) commandWidgets.setKeys(keysNow(hintContext()));
  } catch {
    // (Before the page has finished setting up.)
  }
}
function pressKey(key, shift = false) {
  onKey({ key, shiftKey: !!shift, ctrlKey: false, metaKey: false, altKey: false, target: document.body, preventDefault() {} });
}
recorder.onHitter = () => {
  showHitters();
  modes.putting.hitterChanged?.();
  modes.chipping.hitterChanged?.();
  refreshOverlay();
};
// Said it was another club: on the range, pick that club up for the next
// shot too, or every shot would ask again. (The course picks each shot's
// club itself; a challenge picks it up for the rest of that player's turn
// through the shot's onFix, and here only says so.)
// The range's "Odd shot?" button: what was wrong with the last one.
modes.range.onOddShot = () => recorder.reviewLast() || bay.toast("No shot to say that about yet", 1500);
// The course panel's "Punch / part shot next" button, and what it shows.
modes.course.onSpecialNext = () => recorder.toggleSpecial();
recorder.onSpecial = (kind) => {
  modes.course.showSpecial?.(kind);
  showNextShot();
};
// The chipping panel's power for the next chip, and what it shows.
modes.chipping.onPowerNext = (pw) => {
  recorder.setPower(pw);
  bay.toast(recorder.power != null ? `Next chip: ${recorder.power === 100 ? "full" : `${recorder.power}%`} swing` : "Next chip: a normal chip", 1500, QUICK);
};
recorder.onPower = (pw) => {
  modes.chipping.showPower?.(pw);
  showNextShot();
};
// The command centre's This shot: the next shot, as E and Shift + E say it,
// to click - in every mode E works in (not the putting green), while
// shots are being recorded.
function showNextShot() {
  bay.details.setNext({ on: mode !== "putting" && recording.format !== "off", special: recorder.special, power: recorder.power });
}
bay.details.onSpecial = (kind) => {
  // A normal swing: no power either.
  if (!kind && recorder.power != null) recorder.setPower(null);
  recorder.setSpecial(kind);
};
bay.details.onPower = (pw) => recorder.setPower(pw);
recording.onChange(() => showNextShot());

// A dropdown, tick box or number box keeps the keyboard after it's used,
// which would swallow the shortcuts; hand it back once a choice is made.
// (Not in the menu or the welcome screen, where the keyboard is
// being used to get round the menu: see keys.mjs for the rest.)
// (By tag, not instanceof: a control in the controls window was made by
// that window's page, and isn't one of this page's HTMLInputElements.)
function letGo(e) {
  const t = e.target;
  if (t.closest?.(".bay-help")) return;
  if (t.tagName === "SELECT" || (t.tagName === "INPUT" && ["checkbox", "radio", "number"].includes(t.type))) t.blur();
}
document.addEventListener("change", letGo);

// Nothing keeps the keyboard, in this window or the controls window.
function blurActive() {
  for (const doc of new Set([document, screens?.doc ?? document])) {
    const el = doc.activeElement;
    if (el && el !== doc.body && typeof el.blur === "function") el.blur();
  }
}

// ---- Shots and status from the server ---------------------------------------

export const statusEl = document.getElementById("status");
export let lastStatus = null;
function showStatus(s) {
  lastStatus = s;
  // The carry adjustment (Menu -> Ball flight): every flight in this
  // window takes it from here (applyCarry), and online it's shared.
  ownCarry = { scale: s.carryMatch ?? 1, spin: s.carrySpin ?? 1 };
  applyCarry();
  shareCarry();
  const fresh = s.lastHeartbeat && Date.now() - s.lastHeartbeat < 30000;
  let cls = "off";
  // No Bluetooth link here (a browser, or turned off in the app): the
  // Bluetooth page, or a connector on port 921.
  let text = "Waiting for the launch monitor - its Bluetooth page, or a connector on port 921";
  // What the top bar says instead on a narrower screen, where all of it
  // won't fit (the whole message is in the tooltip).
  let short = "Waiting for the launch monitor";
  // Another launch monitor chosen: waiting for it by name, its steps in the
  // menu - and for the Garmin Golf app, its own port matters, not 921.
  const chosen = monitorById(launchMonitor);
  if (chosen.id !== "omni") {
    short = `Waiting for your ${waitingName(chosen.id)}`;
    text = `${short} - its steps are in the menu (M, Launch monitor)`;
  }
  const on921 = (s.ports ?? []).some((p) => p.port === 921 && p.state === "listening");
  if (chosen.route === "e6" && s.e6?.state === "failed") {
    cls = "warn";
    text = `Port ${s.e6.port} unavailable - the Garmin Golf app can't connect. Click for diagnostics`;
    short = `Port ${s.e6.port} unavailable`;
  } else if (chosen.route !== "e6" && s.ports?.length && !on921) {
    cls = "warn";
    text = "Port 921 unavailable - another program is using it. Click for diagnostics";
    short = "Port 921 unavailable";
  }
  if (s.connectors > 0) {
    cls = s.ready ? "ok" : "warn";
    text = `${monitorName(s.deviceId)} connected`;
    if (fresh) text += s.ready ? (s.ballDetected ? " - ball detected" : " - ready") : " - not ready";
    short = text;
  }
  // The Omni over Bluetooth, when the app is looking for it. A connector on
  // 921 that's actually connected still says so instead - unless GSPro's own
  // connector is running, which has the Omni and needs closing.
  const omni = omniStatusLine(s.omni, s.gspconnect);
  if (omni && (s.connectors === 0 || s.omni?.state === "connected" || s.gspconnect)) ({ cls, text, short } = omni);
  // The phone on the touch screen: the swing pad plays, nothing's awaited.
  const touch = playMode.status(s);
  if (touch) ({ cls, text, short } = touch);
  statusEl.className = `status ${cls}`;
  // Both, and the style sheet shows the one that fits (.wide-only and
  // .narrow-only in style.css).
  const part = (className, words) => Object.assign(document.createElement("span"), { className, textContent: words });
  if (short && short !== text) statusEl.replaceChildren(part("wide-only", text), part("narrow-only", short));
  else statusEl.textContent = text;
  statusEl.title = `${text} - connection diagnostics`;
  // Bay view can't be clicked through to diagnostics as the top bar can:
  // clicking its pill opens the menu (or diagnostics in a browser).
  // (The game window of separate windows says it short.)
  bay.setStatus(cls, text.replace(/ Click for diagnostics$/, ""), short);
  welcome?.setStatus(s);
  system?.setStatus(s);
  // Menu, Launch monitor's line and setup's "connected now", kept up with it.
  menu?.refresh(["connection", "monitor-setup"]);
}
setInterval(() => lastStatus && showStatus(lastStatus), 5000);

function connect() {
  const events = new EventSource("/events");
  events.addEventListener("status", (e) => showStatus(JSON.parse(e.data)));
  // A linked phone's new players, saved here too.
  events.addEventListener("phonelink", (e) => pagePhoneLink?.heard(JSON.parse(e.data)));
  events.addEventListener("shot", (e) => {
    const entry = JSON.parse(e.data);
    // Not while the speed test or the WebGPU test runs: each flies its
    // own path.
    if (speedTest?.running || rendererTest?.running) return;
    // While the game's video plays, only its shots; otherwise never its
    // (another window's) - sim/showreel.mjs.
    if (!takesShot(entry, !!reel?.active)) {
      if (reel?.active) bay.toast("The A² Golf video is recording - Esc stops it", 2000, { force: true });
      return;
    }
    // An online game paused for everyone by its host: not played.
    // A test shot (players have none; the tests' and checks') is never
    // played online.
    if (entry.deviceId === TEST_SHOT && modes.course.round?.net) {
      bay.toast("Test shots aren't played online", 3000, { force: true });
      return;
    }
    if (netPaused()) {
      bay.toast(`Paused by ${netClient.view.game.paused.by} - that shot isn't played`, 3000, { force: true });
      return;
    }
    if (isReelShot(entry)) reelShots++;
    // Playing: the side panel folds away unless it's pinned.
    else (sideFold?.played(), barFold.played());
    // (A made-up swing's device, and the level it was swung at: for that
    // handicap - recorder.js.)
    const made = madeUpSwing(entry.deviceId) ? { device: entry.deviceId === SWING_DEVICES.controller ? "controller" : "mouse", level: lastMadeUp?.level ?? null } : null;
    // (A test shot is kept as experimental too, as a made-up swing is.)
    const factsKey = shotFacts.arrive({ shotNumber: entry.shotNumber, at: entry.at, clubData: entry.clubData ?? null, measuredSpin: entry.measuredSpin, mouse: !!made || entry.deviceId === TEST_SHOT, made, source: entry.source, ball: entry.ball ?? null, club: entry.club ?? currentClub(), mode });
    // Each camera's replay of it, from a few seconds before now (before the
    // mode takes the shot, which may record it at once).
    replay.shot({ shotNumber: entry.shotNumber, at: entry.at ?? new Date().toISOString(), player: hasTurns() ? null : recorder.hitter, club: currentClub(), mode });
    // The recording's tiles (a putt has no flight).
    let flight = null;
    try {
      flight = currentClub() === "PT" || !entry.ball ? null : simulateShot(entry.ball);
    } catch {
      // Readings the flight can't take: the tiles show the readings alone.
    }
    // at: when it arrived, for the layers shown only at one time of the
    // shot (sim/shotphase.mjs).
    videoShot = { shotNumber: entry.shotNumber, at: performance.now(), ball: entry.ball ?? null, clubData: entry.clubData ?? null, flight, player: hitterNow(), hand: handOf(profiles, hitterNow()), club: currentClub() };
    commandWidgets.update(videoShot);
    // Until the mode records it (when the ball stops, on the course and the
    // greens), a note or "last shot fifty percent" said is about this shot.
    recorder.struck();
    shotFacts.played(factsKey);
    try {
      // (Its facts' key goes with it: sim/shotfacts.mjs.)
      modes[mode].onShot({ ...entry, factsKey });
    } catch (err) {
      // (A mode that couldn't take it: nothing's waiting to be recorded.)
      recorder.notRecorded();
      throw err;
    }
    // The strike, the moment the shot arrives: by the club in hand (after
    // the shot's taken, so with friends it's the club of whoever hit it).
    audio.strike({ club: currentClub(), speedMph: entry.ball?.speedMph, clubData: entry.clubData });
  });
  events.addEventListener("club", (e) => {
    const got = JSON.parse(e.data);
    shotFacts.clubData(got.shotNumber, got.clubData);
    // (And the boxes showing it: the club speed, smash and face came after
    // the shot, so they showed "-" until the next one.)
    if (videoShot?.shotNumber === got.shotNumber) {
      videoShot = { ...videoShot, clubData: got.clubData };
      commandWidgets.update(videoShot);
    }
    recorder.clubData(got);
  });
  events.addEventListener("courses", () => modes.course.refreshList());
  events.onerror = () => {
    statusEl.className = "status off";
    statusEl.textContent = "Lost the local server - is it still running?";
    bay.setStatus("off", statusEl.textContent, "Lost the local server");
  };
  // Tell the server our club once connected, e.g. after a reload.
  events.addEventListener("open", sendClub);
}
connect();

// ---- The shot the game would play here ----------------------------------------

// The shot the game would play here, just now (null: nothing to hit): what
// the made-up swings aim with (steadyBall), and a test shot.
function testBall() {
  let ball;
  if (mode === "putting") {
    ball = modes.putting.testPutt();
    ball = { ...ball, vla: 1, totalSpin: 0, spinAxis: 0 };
  } else if (mode === "chipping") {
    ball = modes.chipping.testShot();
  } else if (mode === "course") {
    ball = modes.course.testShot();
  } else if (mode === "challenges") {
    ball = modes.challenges.testShot();
  } else {
    // The same typical bag the course's test shots use, so a test drive
    // goes as far on the range as it does on a hole.
    ball = testSwing(heldClub());
  }
  return ball ?? null;
}

// How much harder made-up swings are in this round: an online round's
// host says (sim/netrules.mjs); otherwise as they are.
function madeUpRule() {
  return mode === "course" && modes.course.round?.net ? (modes.course.round.rules?.madeUp ?? "off") : "off";
}
// Skill points (sim/skills.mjs): each player's, kept from their stats; an
// online host can have none played (the course panel's rule).
export const playerSkills = new PlayerSkills();
// (A match ladder's match: none - everyone with the same game.)
const skillsPlayed = () => !(mode === "course" && ((modes.course.round?.net && modes.course.round.rules?.skills === "off") || modes.course.round?.ladder || modes.course.round?.postSeason));
// The ranks for a swing struck now: whoever's hitting.
const skillsNow = () => (skillsPlayed() ? playerSkills.ranks(hitterNow()) : null);

// A test shot: that shot, sent as a launch monitor's would be. Players
// have no way to hit one any more (sim/mouseswing.mjs TEST_SHOT); the
// tests and browser checks do, through window.golfsim.testShot.
export function testShot() {
  const ball = testBall();
  if (ball) sendShot(ball);
}

// A shot made here (a test shot, a mouse swing), to the server.
function sendShot(ball, device = TEST_SHOT) {
  // Club numbers to go with it, for the shot data screen.
  const club = testClubData(ball, currentClub());
  // Sent in the launch monitor's own format, so a test shot takes the same
  // path through the server as a real one.
  fetch("/api/test-shot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      DeviceID: device,
      Units: "Yards",
      APIversion: "1",
      BallData: {
        Speed: ball.speedMph,
        VLA: ball.vla,
        HLA: ball.hla,
        TotalSpin: ball.totalSpin,
        SpinAxis: ball.spinAxis,
      },
      ClubData: club && {
        Speed: club.speedMph,
        Path: club.path,
        FaceToTarget: club.faceToTarget,
        AngleOfAttack: club.angleOfAttack,
        Loft: club.loft,
        ImpactHorizontal: club.impactHorizontal,
        ImpactVertical: club.impactVertical,
      },
      ShotDataOptions: { ContainsBallData: true, ContainsClubData: !!club, IsHeartBeat: false },
    }),
  });
}

// ---- Mouse swing: play without a launch monitor ------------------------------
// The swing pad (mouseswing.js) and a game controller's stick (below): a
// swing with set club distances - a full one (100%) the club's own carry,
// a part swing that share of it, an overswing up to 105% wilder each
// percent - struck as the swing says, as the shot setup says, and as
// forgiving as whoever's swinging's level (sim/madeshot.mjs,
// sim/shotsetup.mjs, sim/swinglevels.mjs). The shot the game would play
// here (the test shot's, without its made-up wobble) is the flag's mark on
// the pad, where the level shows one. It goes the same way as any other
// shot, so it plays on the course, in the challenges and in online play
// just the same.

// on, side: the pad; level: the level for anyone without their own (and
// guests); players: { name: level } each saved player's own (Saved
// players); custom: the Custom level's help; climb: each player's good
// rounds towards the next level, autoUp: false when they stay put
// (sim/levelup.mjs). (help: the old "How forgiving", read as a level the
// first time.)
export const mouseSwing = loadSetting("mouseSwing", { on: false, help: "easy", side: "left" });
mouseSwing.level = cleanLevel(mouseSwing.level ?? mouseSwing.help);
mouseSwing.custom = cleanCustom(mouseSwing.custom);
mouseSwing.players = mouseSwing.players && typeof mouseSwing.players === "object" ? mouseSwing.players : {};
mouseSwing.climb = cleanClimb(mouseSwing.climb);
const puttingNow = () => mode === "putting" || currentClub() === "PT";
function swingWhat() {
  if (mode === "course" && (!modes.course.round || modes.course.round.finished)) return null;
  if (mode === "challenges" && modes.challenges.state !== "playing") return null;
  return puttingNow() ? "putt" : "swing";
}
// The test shot's own, without the wobble: every made-up spread in it comes
// from Math.random() - 0.5, so a steady middle gives the shot itself.
function steadyBall() {
  const random = Math.random;
  Math.random = () => 0.5;
  try {
    return testBall();
  } finally {
    Math.random = random;
  }
}
// The level a made-up swing plays at: whoever's swinging's own (or the
// menu's), no easier than an online round's rules allow.
export function swingLevelOf(name = hitterNow()) {
  // A match ladder's match: the ladder's one level for everyone
  // (course/matchladder.js).
  // (A season by post's event: its one level, the same.)
  const ladder = mode === "course" ? (modes.course.round?.ladder?.level ?? modes.course.round?.postSeason?.level) : null;
  if (ladder) return ladder;
  return levelAtLeast(playerLevel(name, mouseSwing), levelFloor(madeUpRule()));
}
// How fast the green putted on runs, and how far the hole is (feet; null
// where the mode has no one hole - golf pong's cups).
function puttStimp() {
  if (mode === "course") return modes.course.round?.hole?.green?.stimp ?? modes.course.settings.stimp ?? 10;
  if (mode === "putting") return (modes.putting.pongOn ? modes.putting.pong?.settings?.speed : modes.putting.settings.stimp) ?? 10;
  return 10;
}
function holeFeetNow() {
  if (mode === "putting" && modes.putting.pongOn) return null;
  const yds = modes[mode]?.targetYards?.();
  return Number.isFinite(yds) ? yds * 3 : null;
}
// What the shot here asks of a made-up swing: the club, the plan (the shot
// the game would play: sim/madeshot.mjs planOf) and, for a putt, the green.
// On the course a full shot's straight from the carry it's aimed at - the
// flag's on the flat and the shot's as it plays, wind, slope and lie and
// all, for the pad's two lines (course/madeupplay.js swingGuide, no search
// of the club's flights, which stopped a phone for a good part of a second
// as each swing began and again as it struck), and anything else there
// kept while the ball's where it is.
// A putt there from its own read, worked out on another core (course/
// putting.js plannedPutt) - until it's there, straight at the hole at
// what the putt plays like, or (as the swing begins) its distance;
// waiting: none until there's something to go on.
let keptPlan = null;
function swingPlan({ waiting = false } = {}) {
  const putt = puttingNow();
  const c = modes.course;
  // (And the same on the range at a target and in the approach
  // challenges: their swingGuide.)
  if (!putt && (mode === "course" || mode === "range" || mode === "challenges")) {
    const g = modes[mode].swingGuide?.(currentClub());
    if (g) return { club: currentClub(), putt, stimp: 10, holeFeet: null, plan: { carry: g.carry, flat: g.flat, flagYards: g.flagYards, playYards: g.playYards, why: g.why } };
  }
  if (mode === "course" && putt && c.round && !c.round.pending) {
    const read = c.plannedPutt({ now: !waiting });
    if (read) {
      const stimp = puttStimp();
      const plan = read.rough ? { feet: read.feet, hla: read.hla } : planOf({ ...read, vla: 1 }, { putt, stimp });
      return { club: "PT", putt, stimp, holeFeet: holeFeetNow(), plan };
    }
    if (waiting) return null;
  }
  const key = mode === "course" && c.round && c.me ? [c.round.index, c.me.name, c.me.ball?.join(), c.me.lie, currentClub(), putt].join("|") : null;
  if (key && keptPlan?.key === key) return keptPlan.p;
  const ideal = steadyBall();
  if (!ideal) return null;
  const stimp = putt ? puttStimp() : 10;
  const p = { club: putt ? "PT" : currentClub(), putt, stimp, holeFeet: putt ? holeFeetNow() : null, plan: planOf(ideal, { putt, stimp }) };
  if (key) keptPlan = { key, p };
  return p;
}
// The plan the swing began with, for its strike (the same shot, not worked
// out twice): kept a few seconds, in the mode and with the club it was for.
let swingBegan = null;
// As a swing begins: what a full one carries and the flag's mark, for the
// pad (mouseswing.js reading).
function swingReading({ waiting = false } = {}) {
  try {
    const p = swingPlan({ waiting });
    swingBegan = p && { p, mode, club: currentClub(), at: performance.now() };
    if (!p) return null;
    return planMark({ ...p, setup: p.putt ? null : shotSetup.setup, help: levelHelp(swingLevelOf(), mouseSwing.custom), skills: skillsNow() });
  } catch {
    return null;
  }
}
// The same while the pad waits, for its lines before it's pressed - only
// where asking can't move play on (on the course, not with the next
// player's turn or the next hole to come: a test shot there would start
// it).
function restReading() {
  const c = modes.course;
  if (mode === "course" && (!c.round?.hole || c.round.done || c.round.pending || c.flying || !c.me || c.me.done)) return null;
  if (modes[mode]?.flying) return null;
  return swingReading({ waiting: true });
}
// A made-up swing struck: the shot sent as the launch monitor's would be,
// the setup plain again after it. The words say what it did.
let lastMadeUp = null;
function swingStruck(swing, device) {
  const began = swingBegan;
  swingBegan = null;
  const fresh = began && began.mode === mode && began.club === currentClub() && performance.now() - began.at < 15_000;
  const p = fresh ? began.p : swingPlan();
  if (!p) return "";
  const level = swingLevelOf();
  // (A Postal ladder match: its luck, the same for both rounds - course/
  // ladderpostal.js ladderLuck; undefined any other time.)
  const rand = mode === "course" ? modes.course.ladderLuck?.("swing") : undefined;
  const out = madeUpShot({ ...p, swing, level, custom: mouseSwing.custom, setup: p.putt ? null : shotSetup.setup, skills: skillsNow(), rand });
  lastMadeUp = { device, level };
  sendShot(out.ball, device);
  shotSetup.reset();
  return out.words;
}
const swingPad = new SwingPad({
  what: swingWhat,
  // On the phone, nothing to hit (before a round): out of the way (the
  // owner, 1 November 2026: "remove the touchpad bar from the menu before
  // starting a game, doesn't need to be there if not about to take a shot").
  away: (what) => inPocket && !what,
  reading: swingReading,
  waiting: restReading,
  // The side panel folds as the swing begins rather than as it strikes:
  // folding resizes the picture, which on a phone held the ball up.
  onPress: () => (sideFold?.played(), barFold?.played()),
  onSetup: () => openShotSetup(),
  onLevel: () => openLevels(true),
  side: mouseSwing.side,
  onSide: (side) => ((mouseSwing.side = side), saveSetting("mouseSwing", mouseSwing), shotSetup.el.classList.toggle("right", side === "right"), touchControls.refresh()),
  // The half-power pad, for chips (the ½ button): kept until a swing's
  // struck on it, or it's switched off (mouseswing.js fullPower).
  half: !!mouseSwing.half,
  onHalf: (on) => ((mouseSwing.half = on), saveSetting("mouseSwing", mouseSwing)),
  onSwing: (swing) => {
    const words = swingStruck(swing, SWING_DEVICES.mouse);
    if (words) swingPad.said(words);
  },
});
swingPad.show(mouseSwing.on);
setInterval(() => {
  if (mouseSwing.on) swingPad.refresh();
  showLevel();
  sendLobbyRules();
}, 1000);
export function setMouseSwing(on) {
  mouseSwing.on = !!on;
  saveSetting("mouseSwing", mouseSwing);
  swingPad.show(mouseSwing.on);
  touchControls?.refresh();
}
// The top bar's foot, for what sits just under it (the swing pad on a
// phone, style.css --top-bar): it can go to two rows, and back.
const markTopBar = () => document.documentElement.style.setProperty("--top-bar", `${Math.round(topBar.getBoundingClientRect().bottom)}px`);
new ResizeObserver(markTopBar).observe(topBar);
markTopBar();
// Played with a finger (touchcontrols.js, sim/touchcontrols.mjs): with the
// swing pad on a touch screen, the aim, the club and what's useful just
// then on a strip on the picture's other side, and a finger drawn across
// the picture turns the aim - each what its key does.
const touchScreen = !!window.pocket || !!window.matchMedia?.("(any-pointer: coarse)").matches;
touchControls = new TouchControls({
  view,
  canvas: renderer.domElement,
  context: () => hintContext(),
  // (The pad's lines follow a new club or aim at once.)
  press: (key, shift) => (pressKey(key, shift), swingPad.refresh()),
  club: () => clubName(currentClub()),
  on: () => touchStripOn({ swingPad: mouseSwing.on, touch: touchScreen, separate: !!screens?.separate }),
  // (On the phone, with nothing to hit, it stands aside too: the side
  // panel has the course, the game and Start round.)
  idle: () => inPocket && !swingWhat(),
  side: () => mouseSwing.side,
  more: () => padActions.show(true, { touch: true }),
});
// The phone held upright (upright.js): the strip in the dock under the
// picture, and the picture sized again as the phone turns or the dock
// comes and goes.
// (Only once the page is set up: its picture can't be sized before.)
const upright = new Upright({ view, strip: touchControls.el, on: inPocket, onResize: () => startedUp && resize() });
setInterval(() => {
  touchControls.refresh();
  swingPad.place();
  // The range session's button in the touch strip while it's up, not over
  // it (phonerange.js dock).
  phoneRange?.dock(touchControls.el.hidden ? null : touchControls.el);
}, 500);
// The Android app: played on the touch screen (the swing pad on) or with a
// launch monitor (the Omni looked for) - asked on the welcome screen the
// first time, kept, and in the menu (app/playmode.js). Nothing on a PC.
export const playMode = new PlayMode({
  setSwingPad: (on) => setMouseSwing(on),
  onChange: () => {
    menu?.refresh(["play-mode", "mouse-swing", "connection"]);
    if (lastStatus) showStatus(lastStatus);
  },
});
playMode.start();
// A level's distances in words (the menu's Level; the phone's Your level
// draws its own): to start, with Power maxed, and the player at the mat's
// own with their Power points (sim/madeshot.mjs distanceWords).
export const levelDistanceWords = (level = mouseSwing.level) => distanceWords(level, { custom: mouseSwing.custom, power: skillsNow()?.power ?? 0 });
// The level for anyone without their own, a saved player's own ("" for
// the menu's), and the Custom level's help (the menu, Saved players).
export function setSwingLevel(level, name = null) {
  if (name == null) mouseSwing.level = cleanLevel(level);
  else if (!level) delete mouseSwing.players[name];
  else mouseSwing.players[name] = cleanLevel(level);
  saveSetting("mouseSwing", mouseSwing);
  // (Shown at once: the pad's level, the card before a round, the card.)
  showLevel();
  levelCard.refresh();
}
export function setSwingCustom(change) {
  mouseSwing.custom = cleanCustom({ ...mouseSwing.custom, ...change });
  saveSetting("mouseSwing", mouseSwing);
}
// How far a player is towards the next level, in words (sim/levelup.mjs):
// for the menu's Level, the phone's Your level and Saved players - "1 of 2
// good rounds towards Amateur" (short: "1 of 2 to Amateur"); nothing for a
// guest, who doesn't move up.
export function levelProgress(name = hitterNow(), { short = false, level = playerLevel(name, mouseSwing) } = {}) {
  if (!name || isGuest(name)) return "";
  return progressWords(climbOf(mouseSwing.climb, name, level), { on: mouseSwing.autoUp !== false, short });
}
// With the name: "Anna: 1 of 2 good rounds towards Amateur".
export function levelProgressLine(name = hitterNow()) {
  const words = levelProgress(name);
  return words ? `${name}: ${words}` : "";
}
// Move up a level by itself (the menu's), on unless turned off.
export function setSwingAutoUp(on) {
  mouseSwing.autoUp = !!on;
  saveSetting("mouseSwing", mouseSwing);
}
// A round on the course played with made-up swings at the player's own
// level counts towards moving up one (sim/levelup.mjs): two good ones and
// they're a level up - their own (Saved players) if they have one, or the
// menu's - unless Move up a level by itself is off (autoUp).
recorder.onMadeUpRound = (name, body) => {
  if (body?.kind !== "course" || mouseSwing.autoUp === false) return;
  const own = playerLevel(name, mouseSwing);
  if (cleanLevel(body.lv) !== own) return;
  const got = countRound(mouseSwing.climb, { name, level: own, round: body });
  mouseSwing.climb = got.climb;
  if (got.up) {
    const has = mouseSwing.players[name] != null && mouseSwing.players[name] !== "";
    if (has) mouseSwing.players[name] = got.up;
    else mouseSwing.level = got.up;
  }
  saveSetting("mouseSwing", mouseSwing);
  // (The Level's note says how far they've got; the pad and the levels
  // card the level they're on now.)
  menu?.refresh?.(["swing-level"]);
  showLevel();
  levelCard.refresh();
  const words = climbWords(name, own, got);
  if (words) bay.toast(words, got.up ? 8000 : 5000);
};

// The shot setup (shotsetupcard.js): the next made-up swing's shape,
// height and spin - a controller's Y, or the pad's Shot button. Near the
// green with a wedge, a punch is a bump and run and very high a flop.
export const shotSetup = new ShotSetupCard({
  hand: () => handOf(profiles, hitterNow()),
  near: () => {
    const club = currentClub();
    const yds = modes[mode]?.targetYards?.();
    return { near: mode === "chipping" || (Number.isFinite(yds) && yds < 60), wedge: Object.hasOwn(WEDGE_LOFTS, club) };
  },
  onChange: () => swingPad.setup(shotSetup.words(), shotSetup.setup),
  // What the setup makes harder, with the hitter's Trajectory.
  price: (setup) => harshWords(setupHarshness(setup, shotSkills(skillsNow()))),
});
shotSetup.el.classList.toggle("right", mouseSwing.side === "right");
// The skill points card (skills.js): Menu -> Swing pad & controller.
export const skillsCard = new SkillsCard({ skills: playerSkills, players: () => recorder.players.filter((n) => !isGuest(n)), hitter: () => hitterNow(), toast: (t, ms) => bay.toast(t, ms) });
// Open or closed; a putt has none.
export function openShotSetup(on = !shotSetup.open) {
  if (on && swingWhat() !== "swing") {
    bay.toast(swingWhat() === "putt" ? "A putt has no shot setup" : "Nothing to hit just now", 2000);
    return;
  }
  shotSetup.show(on);
}

// ---- Levels -------------------------------------------------------------------
// Each player's level side by side with what it means (levelcard.js,
// sim/levelchoice.mjs: Beginner and Amateur forgive mistakes but hit
// shorter, Pro and Tour punish them but hit further) - from the level on
// the swing pad, the card before a round and the online lobby. A saved
// player's own (Saved players); a guest plays the menu's.
export const levelCard = new LevelCard({
  players: () => recorder.players.map((name) => ({ name, level: playerLevel(name, mouseSwing) })),
  setLevel: (name, level) => {
    setSwingLevel(level, isGuest(name) ? null : name);
    menu?.refresh?.(["swing-level"]);
    // Online, before the start: everyone told (and the handicap that goes
    // with it).
    onlinePanel?.refreshBay?.();
  },
  floor: () => levelFloorNow(),
  custom: () => mouseSwing.custom,
});
// It opens in the window it was asked from (near: an element there): with
// the screens separate, the lobby's Levels... and the card before a round's
// Change level (pressed on its copy there: the prompt mirror) in the
// controls window, the swing pad's level in the game's.
export function openLevels(on = !levelCard.open, { near = null } = {}) {
  if (on) levelCard.moveTo(near?.ownerDocument ?? document);
  levelCard.show(on);
}
modes.course.onLevels = () => openLevels(true, { near: controlsDoc?.body ?? null });
// The easiest level anyone plays at here: an online round's host rule - and
// in the lobby before it starts, this bay's own when it's hosting, or the
// host's as it sent them (sim/netgame.mjs rules) when it's joined.
function levelFloorNow() {
  if (madeUpRule() !== "off") return levelFloor(madeUpRule());
  const v = netClient.view;
  if (v.mode === "off" || v.game?.started) return null;
  return levelFloor(cleanMadeUp((v.mode === "host" ? lobbyRules() : v.game?.lobbyRules)?.madeUp));
}
// The level whoever's swinging plays at, at the swing pad's top (a tap
// opens the levels card) - and the card before a round kept up with who
// plays at which (introLevels), as players, levels and devices change.
let levelsShown = "";
function showLevel() {
  const name = hitterNow();
  if (!name) swingPad.level(null);
  else {
    const tag = levelTag(playerLevel(name, mouseSwing), levelFloor(madeUpRule()));
    const f = levelFacts(tag.id, mouseSwing.custom);
    swingPad.level({ name: tag.name, forgive: f.forgive, title: `${name}: ${tag.words} - ${f.line}. ${TRADE} Tap to change.` });
  }
  const key = JSON.stringify(introLevels());
  if (key !== levelsShown) {
    levelsShown = key;
    modes.course.renderIntro?.();
  }
}
// The card before a round's levels line: the course's players swinging with
// the mouse, a finger or a controller, and theirs (null: none).
function introLevels() {
  const list = modes.course.players.filter((name) => madeUpGuess(name)).map((name) => ({ name, level: playerLevel(name, mouseSwing) }));
  return list.length ? { line: levelsLine(list, mouseSwing.custom), count: list.length } : null;
}

// ---- A game controller -------------------------------------------------------
// An Xbox or PlayStation pad on the PC (gamepad.js, sim/gamepad.mjs): its
// right stick swings as the mouse does on the swing pad - the swing shown
// on the pad, the shot the mouse swing's, kept as experimental the same
// way (its own DeviceID) - and its buttons are the game's keys, or in the
// menu, a panel or a card, its buttons; Y the shot setup. rumble: a tap
// as a pull reaches a full swing and the most.
export const controller = loadSetting("controller", { on: true, rumble: true });
// The open menu or panel: it has the controller while it's open.
function padPanel() {
  // (The levels card first: it can be over the Online play panel.)
  if (levelCard.open) return levelCard.el;
  for (const p of [menu, soundPanel, cameraPanel, videoPanel, onlinePanel, welcome, padActions]) if (p?.open) return p.el;
  return null;
}
// The controller panel (View): every key's action as a button, each sent
// as its key, as if pressed (padpanel.js, sim/gamepad.mjs PAD_ACTIONS).
export const padActions = new PadPanel({
  run: (a) => document.body.dispatchEvent(new KeyboardEvent("keydown", { ...padKeyEvent(a), bubbles: true, cancelable: true })),
});
// A card asking something over the picture (the range's "Odd shot?", the
// graphics question, the shot setup) - on show, with a button to press;
// the last, with two up.
function padCard() {
  // (Not a card that takes the D-pad as arrows: a drop's spot being chosen.)
  const cards = [...document.querySelectorAll(".corner-card:not([hidden]):not(.pad-keys), .bay-ask:not([hidden])")];
  return cards.filter((c) => c.querySelector("button:not([disabled])") && c.getClientRects().length > 0).at(-1) ?? null;
}
const gamePad = new GamePad({
  on: () => controller.on,
  windows: () => [window, screens.separate ? screens.win : null],
  busy: () => (speedTest?.running ? "test" : reel?.active ? "video" : null),
  what: swingWhat,
  pad: swingPad,
  reading: swingReading,
  setupWords: () => shotSetup.words(),
  setup: () => openShotSetup(),
  // (Open, the left stick moves its dot and the D-pad its height.)
  setupCard: () => (shotSetup.open ? shotSetup : null),
  rumble: () => controller.rumble !== false,
  quick: true,
  onSwing: (swing) => swingStruck(swing, SWING_DEVICES.controller),
  // As if pressed, through onKey like any other.
  key: (key) => document.body.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true })),
  panel: padPanel,
  card: padCard,
  // View: the controller panel, open or closed.
  actions: () => padActions.show(),
  wake: () => stillPicture.wake(performance.now()),
  toast: (text) => bay.toast(text, 2500),
});

// How a player will swing in a round about to start (course/madeupplay.js,
// netBay): with no launch monitor heard from lately and the controller or
// the swing pad in use, a made-up swing - which, and at their level (no
// easier than `floor`, or the round's own rules) - else null. Their first
// shot settles it in the round.
function monitorLive() {
  return !!lastStatus?.lastHeartbeat && Date.now() - lastStatus.lastHeartbeat < 30000;
}
function madeUpGuess(name, floor = undefined) {
  if (monitorLive()) return null;
  const stick = controller.on && !!gamePad.connected;
  if (!stick && !mouseSwing.on) return null;
  const level = floor === undefined ? swingLevelOf(name) : levelAtLeast(playerLevel(name, mouseSwing), floor);
  return { device: stick ? "controller" : "mouse", level };
}
modes.course.madeUpGuess = (name) => madeUpGuess(name);
modes.course.madeUpLevel = (name) => swingLevelOf(name);
modes.course.madeUpCustom = () => mouseSwing.custom;
// How far a player's clubs go on the swing pad or a controller (their
// level's distances and Power: madeshot.mjs reachOf), each club's, for the
// clubs suggested.
const madeUpReach = (name) => {
  const help = levelHelp(swingLevelOf(name), mouseSwing.custom);
  const skills = skillsPlayed() ? playerSkills.ranks(name) : null;
  return (club) => reachOf(help, skills, club);
};
modes.course.madeUpReach = madeUpReach;
// The Challenges: only while the swing pad or a controller is how they'll
// swing.
modes.challenges.clubReach = (name) => (name && madeUpGuess(name) ? madeUpReach(name) : 1);

// ---- Bay view and keys -------------------------------------------------------

export function toggleFullscreen(on = !document.fullscreenElement) {
  if (on && !document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
  if (!on && document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
}

export function setBay(on) {
  prefs.bay = on;
  saveSetting("app", prefs);
  bay.setEnabled(on);
  showBay();
  blurActive();
  refreshOverlay();
  resize();
}
// With separate screens the game window is always bay view (its top bar and
// side panel are in the controls window); docked, it's as chosen.
function showBay() {
  document.body.classList.toggle("bay", bay.enabled || !!screens?.separate);
  // (Bay view and separate windows have no side panel to fold.)
  sideFold?.show();
}
// The side panel folds away - the tab on the picture's right edge - and
// by itself as play starts (a shot, a round) unless it's pinned; folded,
// the shot's numbers are over the picture (sim/sidepanel.mjs).
sideFold = new SideFold({
  view,
  here: () => ({ bay: bay.enabled, separate: !!screens?.separate }),
  onResize: () => resize(),
  onChange: () => menu?.refresh(["side-pin"]),
});
// The phone app's top bar slides away while playing - back with a touch
// on the tab left at the top (topbarfold.js) - unless the menu's Top bar
// always shown is on.
export const barFold = new TopBarFold({
  header: topBar,
  on: playMode.inApp,
  // (Its first few seconds count from the game showing: not behind the
  // phone's home screens or the loading screen.)
  inGame: () => !phoneHome.up && !loading.showing,
  busy: () => !!menu?.open || !!document.querySelector("header.topbar.modes-open, dialog[open]") || (document.activeElement?.tagName === "SELECT" && !!document.activeElement.closest("header.topbar")),
  onChange: () => menu?.refresh(["bar-pin"]),
});
// Played with a finger, it starts folded away (unless it's pinned): folded
// at the first shot, the picture was resized just as the ball should have
// been on its way. (As the load finishes, before the first picture.) On
// the phone before a course round it starts open instead: the course, the
// game, the ladders and Start round are in it (startInPanel).
function foldForTouch() {
  touchControls.refresh();
  if (startInPanel()) return;
  if (touchControls.shown && !sideFold.pinned && !sideFold.folded) sideFold.change("fold");
}
// The phone before a course round (the card before it up): the side panel
// out, with everything to start one in it (the owner, 1 November 2026: "in
// the menu it comes out at the point automatically, we then have a game
// screen with less clutter and scrollable sidebar with lots of info and
// options"). Folded again as the round starts (onRoundStart), and left as
// it's put meanwhile. Whether it did.
function startInPanel() {
  if (!inPocket || mode !== "course" || modes.course.round) return false;
  sideFold?.change("open");
  return true;
}
modes.course.onIntroShown = () => startInPanel();

export function stepClub(delta) {
  if (mode === "course") {
    // With friends, the first press after a shot hands over to the next
    // player (whose own ball decides whether there's a club to change).
    if (modes.course.round && modes.course.takeTurn()) return;
    if (!modes.course.onGreen) bay.toast(clubName(modes.course.stepClub(delta)), 1300, QUICK);
    return;
  }
  if (mode === "chipping") {
    bay.toast(clubName(modes.chipping.stepClub(delta)), 1300, QUICK);
    return;
  }
  if (mode === "challenges") {
    const club = modes.challenges.stepClub(delta);
    if (club) bay.toast(clubName(club), 1300, QUICK);
    return;
  }
  if (mode !== "range") return;
  const i = CLUBS.indexOf(heldClub());
  const next = CLUBS[Math.min(CLUBS.length - 1, Math.max(0, i + delta))];
  if (next !== heldClub()) setClub(next);
  bay.toast(clubName(next), 1300, QUICK);
}
// The answer to a key just pressed whose result is there to see (the club
// in the top bar and This shot, the mode): not a message to keep
// (sim/gametext.mjs messageWay).
export const QUICK = Object.freeze({ quick: true });

document.getElementById("bay-toggle")?.addEventListener("click", () => {
  setBay(true);
  toggleFullscreen(true);
});
document.getElementById("keys-help")?.addEventListener("click", () => bay.showHelp(true));

// Separate windows, or one: Shift + D, the Screens button, the menu.
const screensBtn = document.getElementById("screens-toggle");
// Two screens drawn on it (the top bar is full at 1280 px), lit while
// they're separate; hovering says which.
function showScreens() {
  menu?.refresh(["screens"]);
  if (!screensBtn) return;
  screensBtn.classList.toggle("on", screens.separate);
  screensBtn.setAttribute("aria-label", `Screens: ${screens.separate ? "separate windows" : "one window"}`);
  screensBtn.title = screens.separate
    ? "Screens: the game and the controls in windows of their own - click for one window again (Shift + D)"
    : "Screens: one window - click to give the controls a window of their own, for a laptop, with the game on the projector (Shift + D)";
}
export async function toggleScreens() {
  blurActive();
  if (screens.separate) {
    screens.dock();
    bay.toast("One window - Shift + D separates them again", 2500);
  } else if (await screens.open()) {
    bay.toast("Separate windows - the controls in a window of their own, Shift + D for one again", 3500);
  }
}
screensBtn?.addEventListener("click", toggleScreens);
showScreens();
// The game window's full screen, with separate screens (B or F): the app
// does it for the window; a browser only lets its own window's key or click
// do it.
export function gameFullscreen() {
  if (appBridge?.gameFullScreen) return appBridge.gameFullScreen();
  if (document.fullscreenElement) return document.exitFullscreen?.().catch(() => {});
  document.documentElement
    .requestFullscreen?.()
    .catch(() => bay.toast("Click the picture, then F: a browser only goes full screen from its own window", 3500));
}
// Keys pressed in the shot data window, sent on to here (public/sim/screens.mjs
// says which, and checks what arrives) - and its Shot history: which shots
// can still be changed told to it (shareHistory), its marks and clubs done
// here by the recorder, as from the command centre.
let screensChannel = null;
try {
  screensChannel = new BroadcastChannel(KEY_CHANNEL);
  screensChannel.addEventListener("message", (m) => {
    const init = keyInit(m.data);
    if (init) document.body.dispatchEvent(new KeyboardEvent("keydown", init));
    if (m.data?.type === "history-ask") shareHistory();
    const edit = m.data?.type === "history" ? historyMessage(m.data) : null;
    if (edit?.say) recorder.markFrom(edit.id, edit.say);
    if (edit?.club) recorder.clubFrom(edit.id, edit.club);
  });
} catch {
  // No BroadcastChannel: the shot data window's keys stay there.
}
function shareHistory() {
  screensChannel?.postMessage(historyListMessage(recorder.recent));
}

// V: the camera follows the ball, or stays put and watches it go.
const cameraBtn = document.getElementById("camera-toggle");
function showCamera() {
  menu?.refresh(["camera-follow"]);
  if (!cameraBtn) return;
  // The state is left off on a narrower screen (style.css), so the top bar
  // keeps to one row; the tooltip always says it.
  cameraBtn.innerHTML = `Camera<span class="wide-only">: ${camera.follow ? "follow" : "stay put"}</span>`;
  cameraBtn.title = `Camera: ${camera.follow ? "follows the ball" : "stays put and watches it go"} (V)`;
}
export function toggleCamera() {
  setFollow(!camera.follow);
  showCamera();
  bay.toast(camera.follow ? "Camera follows the ball" : "Camera stays put", 1800);
  blurActive();
}
cameraBtn?.addEventListener("click", toggleCamera);
showCamera();

// What closing or reloading A-Squared Golf now would lose: a course round or a
// challenge being played. Asked about first (the menu, G).
// The picture's effects (sim/effects.mjs): a switch or a preset changed -
// saved, put to use now, and those built into the scene (the light, the
// ground's textures) by reloading, as the graphics setting is.
export function changeEffects(next, words) {
  saveSetting("effects", next);
  const now = effectsInUse(next, LEVEL);
  setEffects(now, renderer);
  liveEffects(now);
  menu?.refresh?.(["effects-preset", ...EFFECT_IDS.map((id) => `effect-${id}`)]);
  wakePicture();
  if (!needsReload(BUILT_WITH, now)) return words;
  const lose = busy();
  if (lose && !confirm(`${words}? A² Golf reloads to do it, and ${lose} will end.`)) return `${words} - from the next start`;
  leaving("picture effects change");
  setTimeout(() => location.reload(), 400);
  return `${words} - reloading`;
}
const EFFECT_LABELS = Object.fromEntries(EFFECTS.map((e) => [e.id, e.label]));
export const effectBinding = (id) => ({
  // (Not made on this graphics setting, or the screen's effects on a card
  // that can't keep the picture's buffer: not shown.)
  available: () => madeOn(id, LEVEL) && (!SCREEN_EFFECTS.includes(id) || canFinish(renderer)),
  get: () => readEffects(loadSetting("effects", {}), LEVEL).on[id],
  set: (on) => changeEffects(setEffect(loadSetting("effects", {}), id, on, LEVEL), `${EFFECT_LABELS[id]} ${on ? "on" : "off"}`),
  // What it typically costs, and what the speed test measured it at here.
  note: () => costNote(id, speedTest?.history ?? []),
});

export function busy() {
  if (modes.course.underway) return "the round in progress";
  if (modes.challenges.playing) return `the ${modes.challenges.playing} in progress`;
  return null;
}
// A course round cut short by a reload or an update is still saved, with
// the scores so far (as abandoning one from the panel does).
window.addEventListener("pagehide", () => {
  if (modes.course.underway) modes.course.saveRound();
  // A recording's file finished as the page goes on purpose, and not
  // started again in the next (videorec.js leaving).
  video.leaving();
});

// Running as the Windows app: the menu (programs, power).
export const appBridge = window.golfsimApp ?? null;
// Sound: the speaker in the top bar (and Shift + A) opens its settings; A
// turns it on and off. The background plays as soon as sound is allowed.
export const soundPanel = new SoundPanel(audio, { bridge: appBridge, button: document.getElementById("sound-toggle"), toggle: toggleSound, toast: (t) => bay.toast(t, 2500) });
audio.startAmbience();
export function toggleSound() {
  bay.toast(audio.toggle() ? "Sound on" : "Sound off - A turns it back on", 1500);
}
// Bay view has no top bar, so a muted speaker says when sound is off.
bay.setSound(audio.on);
audio.watch((s) => bay.setSound(s.on));
// A downloaded update waiting to be installed: said on the Menu button,
// and in bay view next to the connection, until it's installed.
let updateReady = null;
const menuBtn = document.getElementById("menu-open");
// The Windows app's own parts of the menu (system.js): the Omni over
// Bluetooth, the app's window, updates, reports, programs and the PC.
export const system = appBridge
  ? new SystemMenu(appBridge, {
      toast: (t, ms = 2500) => bay.toast(t, ms),
      busy,
      onUpdate: (s) => {
        updateReady = s?.state === "ready" ? s.next : null;
        menuBtn.classList.toggle("attention", !!updateReady);
        menuBtn.title = updateReady ? `A² Golf ${updateReady} is ready to install - Menu, System (M)` : "Menu: every setting, grouped (M)";
        bay.setNotice(updateReady ? `Update ready - press M` : "");
      },
    })
  : null;

// ---- The Clubhouse: the one menu (menu.js, sim/menu.mjs) ----------------------------

menu = new Clubhouse({
  style: uiStyle(),
  onOpen: () => {
    screens.focusControls();
    readLimits();
  },
  onClose: () => system?.unmount(),
  // Quit under the menu's pages, whichever page is open (bay view has no
  // top bar).
  onQuit: system ? (at) => system.quit(at) : null,
  // The phone app's Home (its start screens, the game kept as it is):
  // first in the menu, not the top bar (phonehome.js).
  onHome: phoneHome.on ? () => phoneHome.open() : null,
});
if (system) system.menu = menu;
// Quitting, in the Windows app: full screen has no window frame, so no X.
// The top bar's power button sits where the X would be; it asks first, as
// the menu's Quit does (system.js quit).
const quitBtn = document.getElementById("quit-app");
if (system && quitBtn) {
  quitBtn.hidden = false;
  quitBtn.addEventListener("click", () => {
    quitBtn.blur();
    system.quit(quitBtn);
  });
}
export function openMenu(page = null) {
  menu.show(true, page);
}
menuBtn.addEventListener("click", () => {
  menuBtn.blur();
  menu.open ? menu.show(false) : openMenu();
});
// In bay view there's no top bar: the connection pill (and the update
// reminder) open the menu - at the launch monitor, or the update.
bay.onStatusClick = () => openMenu(updateReady ? "system" : "monitor");
statusEl.addEventListener("click", (e) => {
  e.preventDefault();
  openMenu("monitor");
});

// A control on a mode's side panel set as if by hand (its own handler does
// the rest: saving, redrawing the green), so the menu and the panel never
// disagree. Returns false when the panel has no such control.
export function panelSet(sel, value) {
  const el = sidePanel.querySelector(sel);
  if (!el) return false;
  if (el.type === "checkbox") el.checked = !!value;
  else el.value = String(value);
  el.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}
function panelGet(sel) {
  const el = sidePanel.querySelector(sel);
  if (!el) return undefined;
  return el.type === "checkbox" ? el.checked : el.value;
}
// A panel select's choices, for the menu's own copy of it.
export function panelOptions(sel) {
  return [...(sidePanel.querySelector(sel)?.options ?? [])].map((o) => ({ value: o.value, label: o.textContent }));
}
export const stimpWords = (v) => `Stimp ${v}${v <= 8 ? " - slow" : v >= 12 ? " - quick" : ""}`;
export const openPage = (url) => (screens.doc?.defaultView ?? window).open(url, "_blank");
// The carry adjustment, as a share further for a drive, and what that does
// to a 230 yd one.
export const carryWords = (v) => (!v ? "A² Golf's own" : `${v > 0 ? "+" : ""}${v}% · a 230 yd drive carries ${Math.round(230 * (1 + v / 100))}`);
// This bay's own (whether or not an online game has it set aside).
export const ownCarryPercent = () => carryPercentOf(ownCarry.scale, ownCarry.spin);
export async function setCarryPercent(percent) {
  const res = await fetch("/api/carry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ percent }) });
  const r = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(r.error ?? "The carry couldn't be changed");
  ownCarry = { scale: r.carryMatch ?? 1, spin: r.carrySpin ?? 1 };
  applyCarry();
  shareCarry();
  const online = netClient.view.game && !netClient.view.game.ended && netClient.view.mode !== "off" ? (onlineOwnCarry() ? " - not in this online game: the host has everyone on A² Golf's own" : " - everyone in the online game sees it") : "";
  return `${percent ? `Carry ${carryWords(percent)} - every club about as much` : "Back to A² Golf's own carries"}${online}`;
}
// The disk limits (the server's), and what's in use.
let clipsLib = null;
async function readLimits() {
  clipsLib = await readClips();
  menu.refresh(["limit-clips", "limit-sessions"]);
  readRecordingsFolder();
  readKeptHoles();
  readHolesFolder();
}
// The holes kept for loading (server/bakes.mjs): { files, bytes }, or null
// before the server's said.
export let keptHoles = null;
export async function readKeptHoles() {
  keptHoles = await fetch("/api/bakes")
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  menu.refresh(["kept-holes"]);
}
// Where the holes kept for loading go (the Windows app's: Menu, Graphics,
// Holes kept for loading): { dir, chosen, usual, missing }.
let holesFolder = null;
async function readHolesFolder() {
  if (!appBridge?.holesFolder) return;
  holesFolder = await appBridge.holesFolder().catch(() => null);
  menu.refresh(["holes-folder"]);
}
export const holesFolderBinding = appBridge?.chooseHolesFolder
  ? {
      buttons: () => [{ value: "choose", label: "Choose a folder..." }, ...(holesFolder?.chosen ? [{ value: "usual", label: "Back to the usual folder" }] : [])],
      run: async (v) => {
        const r = await (v === "usual" ? appBridge.useUsualHolesFolder() : appBridge.chooseHolesFolder());
        holesFolder = r ?? holesFolder;
        menu.refresh(["holes-folder"]);
        if (r?.error) throw new Error(r.error);
        if (!r || r.canceled) return "";
        setTimeout(readKeptHoles, 3000);
        return v === "usual" ? "Holes are kept in the usual folder again - those kept are moving back" : `Holes are kept in ${r.dir} from now on - those kept are moving there`;
      },
      note: () => {
        if (!holesFolder) return "";
        if (holesFolder.missing) return `${holesFolder.chosen} isn't there (a drive not plugged in?) - keeping them in the usual folder for now`;
        return holesFolder.chosen ? holesFolder.dir : `The usual folder: ${holesFolder.dir}`;
      },
    }
  : null;
// Where the video recordings go, and the replays with them (the Windows
// app's: Menu, Cameras & video, Disk space): { dir, chosen, usual, missing }.
let recFolder = null;
async function readRecordingsFolder() {
  if (!appBridge?.recordingsFolder) return;
  recFolder = await appBridge.recordingsFolder().catch(() => null);
  menu.refresh(["recordings-folder"]);
}
export const recordingsFolderBinding = appBridge?.chooseRecordingsFolder
  ? {
      buttons: () => [{ value: "choose", label: "Choose a folder..." }, ...(recFolder?.chosen ? [{ value: "usual", label: "Back to the usual folder" }] : [])],
      run: async (v) => {
        const r = await (v === "usual" ? appBridge.useUsualRecordingsFolder() : appBridge.chooseRecordingsFolder());
        recFolder = r ?? recFolder;
        menu.refresh(["recordings-folder"]);
        if (r?.error) throw new Error(r.error);
        if (!r || r.canceled) return "";
        return v === "usual" ? "Recordings and replays go in the usual folders again" : `New recordings and replays go in ${r.dir} - those already made stay where they are`;
      },
      note: () => {
        if (!recFolder) return "";
        if (recFolder.missing) return `${recFolder.chosen} isn't there (a drive not plugged in?) - recording to the usual folder for now`;
        return recFolder.chosen ? recFolder.dir : `The usual folder: ${recFolder.dir}`;
      },
    }
  : null;
export function limitBinding(which) {
  return {
    get: () => (clipsLib ? usage(clipsLib)[which].limit : ""),
    set: async (v) => {
      await changeLimit(which, v, { confirm: (q) => (menu.doc.defaultView ?? window).confirm(q), toast: (t, ms) => bay.toast(t, ms) });
      await readLimits();
    },
    note: () => {
      if (!clipsLib) return "The local server isn't answering";
      const x = usage(clipsLib)[which];
      // The recordings' line says the room left on their drive too.
      const room = which === "sessions" ? freeSpace(clipsLib.free) : null;
      return `${sizeText(x.used)} used of ${x.limit} GB${which === "sessions" && x.kept ? ` · ${x.kept} kept (${sizeText(x.keptBytes)}) not counted` : ""}${room ? ` · ${room.text}${room.low ? " - running low" : ""}` : ""}`;
    },
  };
}
// The drive the recordings and replays go to running low (sim/clips.mjs
// lowSpaceNote): said over play once a session - never a box in the way -
// and not while a video's being recorded (it would be in it) or the
// game's video plays. Looked at soon after starting, then every quarter of an hour.
let lowSpaceSaid = false;
async function checkFreeSpace() {
  if (lowSpaceSaid || video.recording || bay.hush) return;
  const note = lowSpaceNote((await readClips())?.free);
  if (!note || video.recording || bay.hush) return;
  lowSpaceSaid = true;
  bay.toast(note, 9000);
}
setTimeout(checkFreeSpace, 30_000);
setInterval(checkFreeSpace, 15 * 60_000);
bindMenus();
// The menu follows changes made elsewhere: a key, a panel, the voice.
recording.onChange(() => menu.refresh(["recording"]));
audio.watch(() => menu.refresh(["sound-on", "celebrations"]));
watchLineLevel(() => menu.refresh(["putt-line", "plays-like", "grid-colours"]));
video.onChange(() => menu.refresh(["video-rec"]));

// ---- Voice: "club picked seven iron" ----------------------------------------

// A spoken club, taken up as the arrow keys would: the range's club, the
// chipping club, the course player's club (their turn starts if they were
// waiting), the putter on the putting green, one of the clubs the
// challenge being played has; the connector is told.
// Returns { name } when taken, { why } when not (having said why).
function pickClub(club) {
  // While the game's video plays, nothing over its picture: the why goes
  // to voice's status (the microphone button's words), not a message.
  if (reel?.active) return { why: 'The A² Golf video is recording - say "stop the show reel"' };
  const c = modes.course;
  // With friends, the next player saying their club starts their turn, as
  // a key would; their "Ben to play" message is kept, with the club after it.
  const handedOver = mode === "course" && c.round && c.takeTurn();
  const turn = handedOver && bay.current ? `${bay.current} - ` : "";
  const ok = clubForMode(mode, club, {
    rangeClubs: CLUBS,
    chipClubs: CHIP_CLUB_LIST,
    course: { round: Boolean(c.round && !c.round.done), onGreen: c.onGreen, lie: c.me?.lie },
    challenge: { game: modes.challenges.playing, clubs: modes.challenges.clubs },
    name: clubName,
  });
  if (ok.why) {
    bay.toast(turn + ok.why, turn ? 3000 : 2200);
    return { why: ok.why };
  }
  // The club in hand (the putter aside), taken up here as any club picked is.
  // The putter off a course's green (the fringe, the fairway or the first
  // cut) is that shot's own club.
  if (club !== "PT") setClub(club);
  else if (mode === "course" && !c.onGreen) c.setClub("PT");
  else sendClub();
  bay.toast(turn + clubName(club), turn ? 2500 : 1300, turn ? {} : QUICK);
  return { name: clubName(club) };
}

// Everything voice understood beyond a club (sim/voicecmd.mjs): a card's
// answer, a note, a power or a special shot go to the recorder, "undo" too;
// the stats' recording format to golfsim.setRecording, where this version
// has it.
// Returns { done, short } or { why } (said on screen too).
function voiceCommand(r) {
  let done;
  // Its yes or no to the box asking whether to do what it heard.
  if (r.confirm != null) {
    if (!voiceAsking) return { why: "Nothing waiting to be agreed" };
    answerVoiceAsk(r.confirm);
    return r.confirm ? { done: "agreed", short: "Agreed" } : { done: "cancelled", short: "Cancelled" };
  }
  // While the game's video plays, only "stop the show reel".
  if (reel?.active && !r.reel) return { why: 'The A² Golf video is recording - say "stop the show reel"' };
  if (r.reel) {
    if (r.reel === "stop") done = reel.stop("stopped by voice") ? { done: "video stopped", short: "Stopping the video" } : { why: "The video isn't playing" };
    else done = reel.active ? { done: "video playing", short: "The video is recording" } : reel.offer();
    if (done?.why) bay.toast(done.why, 2200);
    return done;
  }
  if (r.hitter) {
    // On the course and in the challenges it's whoever's turn it is.
    if (hasTurns()) done = { why: "It's whoever's turn it is here" };
    else if (!recorder.players.includes(r.hitter)) done = { why: `${r.hitter} isn't playing - Who's playing in the menu` };
    else {
      recorder.hitter = r.hitter;
      done = { done: `${r.hitter} hitting`, short: `${r.hitter} hitting` };
    }
    if (done.why) bay.toast(done.why, 2200);
    return done;
  }
  if (r.undo) done = recorder.hear(r);
  else if (r.recording) done = setRecording(r.recording);
  else if (r.video) done = videoVoice(r.video);
  else if (r.scene != null) done = sceneVoice(r.scene);
  else if (r.saveReplay) {
    // (Why it couldn't be is said below, once.)
    const got = saveReplay({ sayWhy: false });
    done = got.why ? { why: got.why } : { done: "replay saved", short: "Saved" };
  } else if (r.flyover) {
    // The hole's flyover on the course (it says why it can't itself).
    if (mode !== "course") done = { why: "The flyover is for the course, after a hole" };
    else if (r.flyover === "stop") done = modes.course.skipFlyover() ? { done: "flyover skipped", short: "Flyover skipped" } : { why: "No flyover going" };
    else done = modes.course.flyover ? { done: "flyover", short: "Flyover" } : modes.course.startFlyover();
    if (done?.why && mode === "course") return done;
  } else if (r.replay) {
    // The swing replay on the game window (it says why it can't itself).
    if (r.replay === "close") done = swingReplay.close();
    else if (r.replay === "again") done = swingReplay.again();
    else if (!swingReplay.canReplay && mode === "course") done = modes.course.replayLastShot();
    else done = swingReplay.show({ speed: r.speed ?? null });
    if (done?.why) return done;
  }
  else if (r.putt) {
    // The putting green's green and aim: "flat green", "breaks right two
    // percent", "putt from fifteen feet", "aim left two cups"...
    done = mode === "putting" ? modes.putting.voice(r.putt) : { why: "That's for the putting green (P)" };
  } else if (r.when === "next" && mode === "putting") done = { why: "Putting green: every shot's a putt" };
  else done = recorder.hear(r);
  if (done?.why) bay.toast(done.why, 2200);
  return done;
}
// "Stop recording", "recording round"...: the stats' recording formats
// (Practice, Round, Experimental, Off), if this version of the sim has them.
function setRecording(format) {
  const set = window.golfsim?.setRecording;
  if (typeof set !== "function") return { why: "Recording formats aren't in this version yet" };
  set(format);
  const words = { off: "Recording off", practice: "Recording: practice", experimental: "Recording: experimental", round: "Recording: round" }[format] ?? `Recording: ${format}`;
  return { done: words.toLowerCase(), short: words };
}

// "Start filming", "stop filming": the video recorder.
function videoVoice(what) {
  if (what === "start" && video.recording) return { done: "already recording", short: "Already recording" };
  if (what === "stop" && !video.recording) return { done: "not recording", short: "Not recording" };
  toggleVideo({ by: "voice" });
  return what === "start" ? { done: "recording video", short: "Recording" } : { done: "video stopped", short: "Video stopped" };
}

// The recording's scene: the next, the previous, or one by name or number.
function sceneVoice(what) {
  const layout = typeof what === "number" ? video.stepScene(what) : video.sceneByWords(what);
  if (!layout) return { why: `No scene called "${what}"` };
  return { done: `scene ${layout.name.toLowerCase()}`, short: `Scene: ${layout.name}` };
}

// ---- Voice: asked before it's done --------------------------------------------
// Only a club is changed straight from what voice heard; anything else is
// said in the messages first (what was heard, and what it would do) and is
// done only once agreed: Y, or saying "confirm" / "do it". N, "cancel" - or
// ten seconds of nothing - and it isn't. Never a box over the game (the
// owner, 22 October 2026, of one in the putting game: "Can we just check
// all areas of the game to make sure we don't get that?").
const VOICE_ASK_MS = 10000;
export let voiceAsking = null;
function askVoice(r, text, run) {
  // While the game's video plays it listens for one thing: "stop the show
  // reel", done at once. Nothing else it hears (the room talking over it,
  // its own cheers) puts anything over the picture.
  if (reel?.active) {
    if (r.reel === "stop") reel.stop("stopped by voice");
    return;
  }
  if (voiceAsking) clearTimeout(voiceAsking.timer);
  // In the messages, as any other: no box.
  bay.toast(voiceQuestion(r, text), VOICE_ASK_MS);
  voiceAsking = { run, timer: setTimeout(() => answerVoiceAsk(false, { quiet: true }), VOICE_ASK_MS) };
}
// What it asks: what it heard and what it would do.
const voiceQuestion = (r, text) => `Voice heard "${text}": ${voiceAction(r, { clubName })}? Say "confirm" or press Y to do it.`;
// Voice's one message slot: every message voice puts up (didn't catch
// that, a note to say, voice on or off, the helper's notices) goes through
// here, and drops a "do this?" still waiting - so there are never two voice
// questions at once; the newest replaces the last (the owner: "Ensure we
// never have two pop-ups with voice stuff").
export function voiceToast(text, ms) {
  if (voiceAsking) answerVoiceAsk(false, { quiet: true });
  bay.toast(text, ms);
}
export function answerVoiceAsk(yes, { quiet = false } = {}) {
  const a = voiceAsking;
  if (!a) return false;
  clearTimeout(a.timer);
  voiceAsking = null;
  if (yes) a.run();
  else if (!quiet) voiceToast("Cancelled - nothing done", 1400);
  return true;
}

const voiceBtn = document.getElementById("voice-toggle");
const VOICE_WORDS = { off: "off", starting: "starting", listening: "listening", heard: "heard", missed: "heard", unavailable: "not available" };
// The word said before a command (the menu's Sound & voice): "Caddie" to
// begin with, or off for commands any time.
export const voiceWake = loadSetting("voiceWake", { word: DEFAULT_WAKE });
if (!WAKE_CHOICES.includes(voiceWake.word)) voiceWake.word = DEFAULT_WAKE;
export const wakeName = () => (wakeWords(voiceWake.word) ? WAKE_NAMES[voiceWake.word] : null);
// The menu's More voice commands: off, voice is only for clubs, the last
// shot ("last shot seven iron", "last shot mishit") and answering what's
// asked - notes, powers, replays, scenes, recording, the putting green and
// who's hitting need it on (the owner, 10 November 2026: "Maybe need to
// strip a lot of things to allow it to confirm things easier?").
export const voiceMore = loadSetting("voiceMore", { on: false });
export const voice = new VoiceControl({
  bridge: appBridge,
  Recognition: window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null,
  secure: window.isSecureContext,
  lang: navigator.language?.startsWith("en") ? navigator.language : "en-GB",
  // (Something else heard while a "do this?" waits takes its place.)
  onClub: (club, text) => (voiceAsking && answerVoiceAsk(false, { quiet: true }), pickClub(club, text)),
  onMiss: (why) => voiceToast(why, 2500),
  // Bare answers ("yes", "thin", "fifty", "two four one", "undo") are only
  // heard while something here waits for them.
  waiting: () => ({ ...recorder.voiceWaiting(), undo: recorder.canUndo(), replay: swingReplay.showing, confirm: !!voiceAsking }),
  onCommand: (r, text) => (voiceAsking && r.confirm == null && answerVoiceAsk(false, { quiet: true }), voiceCommand(r, text)),
  confirm: askVoice,
  wake: () => wakeWords(voiceWake.word),
  wakeName,
  extras: () => voiceMore.on === true,
  onNotice: (reason) => voiceToast(reason, 4000),
  // A note in the Windows app: "shot note", then the note itself.
  onNote: (listening) => voiceToast(listening ? "Shot note - say it now" : "No note heard", 2500),
  onStatus: ({ state, text, short }) => {
    // The button is just the microphone (the top bar is full at 1366 px):
    // its colour shows the state, hovering says it in words and why.
    voiceBtn.className = `voice ${state}`;
    voiceBtn.setAttribute("aria-label", `Voice: ${VOICE_WORDS[state] ?? state}`);
    voiceBtn.title = `Voice: ${VOICE_WORDS[state] ?? state}${state === "off" ? "" : `\n${text}`}\n${voiceHelp(wakeName(), { more: voiceMore.on === true })} (L turns voice on and off)`;
    bay.setVoice(state, short);
  },
});
// The club check's question is voice's to answer while it listens (on, and
// able to here).
recorder.voiceOn = () => voice.enabled && voice.status.state !== "unavailable";
// The menu's More voice commands turned on or off: heard from now on (the
// Windows app's listener starts again with its other grammar).
export function setVoiceMore(on) {
  voiceMore.on = on === true;
  saveSetting("voiceMore", voiceMore);
  voice.tellExtras();
  voice.setStatus(voice.status.state, voice.status.text, voice.status.short);
}
export function toggleVoice(on = !voice.enabled) {
  prefs.voice = on;
  saveSetting("app", prefs);
  voice.setEnabled(on).then(() => {
    modes.course.renderIntro();
    const { state, text } = voice.status;
    // (Just "Voice on": how to use it is the microphone's tooltip, not a
    // reminder to say the wake word.)
    voiceToast(!on ? "Voice off" : state === "unavailable" ? text : "Voice on", on && state === "unavailable" ? 4000 : 1500);
  });
  blurActive();
}
voiceBtn.addEventListener("click", () => toggleVoice());
// The course's card before a round: where the course, players and game
// are picked on this screen, and whether voice's words are worth saying.
// (keys: whether there's a keyboard to name keys on - not on the phone.)
modes.course.introContext = () => ({ where: screens.separate ? "controls" : bay.enabled ? "bay" : "panel", voice: voice.enabled, wake: wakeName(), keys: !inPocket, levels: introLevels() });
if (prefs.voice) voice.setEnabled(true);
// A reload with voice off stops the app's listener if it was left running.
else appBridge?.voiceStop?.();

// Every key, from whichever window has the keyboard: this one, the controls
// window (screens.js hands its keys here as they are), or the shot data
// window (sent on over a BroadcastChannel, below).
window.addEventListener("keydown", onKey);
// The window a key or a click came from: this page, or the controls window.
export const docOf = (t) => (t?.nodeType === 9 ? t : t?.ownerDocument) ?? document;
// Draws the blank area of the window with this page in it.
export function editBlank(doc = document) {
  const role = screens.separate && doc === screens.doc ? "controls" : "main";
  // The controls window's blank area is arranged with its boxes.
  if (role === "controls" && layout.attached) return void (layout.edit(), screens.focusControls());
  // The game screen (or bay view): its words and numbers, the blank area
  // a button on its bar.
  if (role === "main" && document.body.classList.contains("bay")) return void gameLayout.edit();
  blank.edit(role === "controls" ? screens.doc : document, role);
  if (role === "controls") screens.focusControls();
}
// Leaving full screen with Esc leaves bay view too, or the side panel would
// stay hidden in a normal window.
// (Not with separate screens, where the game window is bay view anyway.)
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && bay.enabled && !screens.separate) setBay(false);
  resize();
});

// ---- Render loop ------------------------------------------------------------

// [ / ]: the picture's centre 5% of the width left or right.
export function nudgePictureCentre(dir) {
  setPictureCentre(Math.round((picture.centre + dir * 0.05) * 100) / 100);
  bay.toast(`Picture centre: ${offsetWords(picture.centre)}`, 1500, QUICK);
}

const drawnSize = new THREE.Vector2();
const pictureSize = new THREE.Vector2();
function resize() {
  const w = view.clientWidth;
  const h = view.clientHeight;
  // (A window moved to a screen of another scale: the ratio again, the
  // valve's share kept.)
  // (And the window's size, for Ultra's supersampling.)
  setPictureBase(fullPixelRatio(w, h), { width: w, height: h });
  // Only when it's really changed: setting the canvas's size, even to the
  // same, throws its picture away and makes it again - a second or more
  // each time a mode was come into (resize runs then too).
  // While a recording wants the game's picture centred on the target line
  // with the picture's centre moved for play, drawn wider than the screen
  // (sim/viewoffset.mjs wideFrame): the canvas past the screen's edge,
  // slid so the screen shows what it always did, the recording taking the
  // centred part (compositor.js setGameWindows).
  const wide = picture.wide ? wideFrame(w, h, picture.centre) : null;
  setWideFrame(wide);
  const canvasW = wide ? wide.width : w;
  const was = renderer.getSize(drawnSize);
  if (was.x !== canvasW || was.y !== h) renderer.setSize(canvasW, h);
  renderer.domElement.style.marginLeft = wide && wide.left ? `${wide.left}px` : "";
  gameWindowsTo?.(wide ? { screen: wide.screen, centred: wide.centred } : null);
  const win = wide ? wide.normal : viewWindow(w, h, picture.centre);
  for (const m of Object.values(modes)) {
    m.resize(w / h);
    if (!m.camera) continue;
    if (win) m.camera.setViewOffset(win.fullWidth, win.fullHeight, win.x, win.y, win.width, win.height);
    else if (m.camera.view) m.camera.clearViewOffset();
  }
}
window.addEventListener("resize", resize);

// A camera that jumps further than this in one frame has cut to a new view
// (as has a new scene): not counted by the frame-rate table or the safety
// valve (fps.js).
const CUT_METRES = 15;
const lastCamera = { scene: null, at: new THREE.Vector3() };
function cameraCut(m) {
  const cut = lastCamera.scene !== m.scene || m.camera.position.distanceTo(lastCamera.at) > CUT_METRES;
  lastCamera.scene = m.scene;
  lastCamera.at.copy(m.camera.position);
  return cut;
}
// What this frame did, for the long frames (sim/longframes.mjs): the
// shaders it built, what it sent to the graphics card, and the rest.
function noteFrame(m, { trees, shadows, cut, resized, update, draw }) {
  // What the update was spent on, the course's own steps in its, and page
  // layout forced mid-script (sim/frameparts.mjs, framewatch.js).
  frameFacts.parts = frameParts.take();
  frameFacts.steps = m.steps?.take?.() ?? null;
  frameFacts.layout = takeForcedLayout();
  const programs = programList(renderer);
  const memory = renderer.info.memory;
  frameFacts.shaders = programs.length > frameCounts.programs ? programs.slice(frameCounts.programs).map(shaderName) : [];
  frameFacts.textures = Math.max(0, memory.textures - frameCounts.textures);
  frameFacts.geometries = Math.max(0, memory.geometries - frameCounts.geometries);
  frameFacts.shadows = !!shadows;
  frameFacts.trees = trees || 0;
  frameFacts.cut = !!cut;
  frameFacts.resized = resized || 0;
  frameFacts.scene = frameCounts.scene !== null && frameCounts.scene !== m.scene;
  frameFacts.update = update;
  frameFacts.draw = draw;
  // What else the game said the frame did (sim/framenotes.mjs).
  frameFacts.notes = takeFrameNotes();
  // The quiet moments' slowest step since the last drawn frame: which job
  // and what it was building (sim/idlework.mjs takeSlowest).
  frameFacts.idleStep = idleWork.takeSlowest();
  // The quiet moments' work since the last drawn frame, and the shaders it
  // drew for the first time (look/gpuprep.js).
  frameFacts.idle = frameIdleMs;
  frameIdleMs = 0;
  frameFacts.firstDraws = takeFirstDraws();
  frameCounts.programs = programs.length;
  frameCounts.textures = memory.textures;
  frameCounts.geometries = memory.geometries;
  frameCounts.scene = m.scene;
  frameCounts.view = currentView(m);
}
// Which view this is, for the frame rate by view (sim/framerate.mjs).
function currentView(m) {
  return viewOf({
    mode,
    flying: !!(m.flying || m.game?.flying),
    session: !!m.sessionView,
    flyover: !!m.flyover,
    green: mode === "course" && !!m.round && !!m.putting,
  });
}

// Frames far longer than the rest, with what the game did in them, for a
// report (sim/longframes.mjs): what each frame built, sent to the graphics
// card or drew again, and how long its own work took.
const longFrames = new LongFrames();
// Whether the window was hidden since the last frame (a long gap then is
// a stop, not a freeze: sim/longframes.mjs).
let wentHidden = false;
document.addEventListener("visibilitychange", () => {
  if (document.hidden) wentHidden = true;
});
const frameFacts = { shaders: [], textures: 0, geometries: 0, shadows: false, trees: 0, cut: false, scene: false, resized: 0, update: 0, draw: 0, idle: 0, firstDraws: 0, notes: [], idleStep: null, parts: null, steps: null, layout: 0 };
const frameParts = new PartClock();
// Ms in the quiet moments' work since the last drawn frame.
let frameIdleMs = 0;
const frameCounts = { programs: 0, textures: 0, geometries: 0, scene: null, view: null };

const timer = new THREE.Timer();
// Pictures drawn so far: the loading screen goes once they've started.
let picturesDrawn = 0;
// Nothing is drawn until the load is ready for its first picture
// (finishLoading): pictures drawn behind the loading screen, of a scene
// still being built, were never seen and held up the building.
let picturesOn = false;
// Whether the last loop drew the picture (for measuring the screen's rate).
let drewLast = false;
// How long the last drawn frame took, ms (for the quiet moments' work).
let lastFrameMs = 0;
// Anything moving in the picture this frame, or about to (the picture
// doesn't rest while it is: sim/stillpicture.mjs). The camera moving is
// seen by itself; this is what moves with the camera still - a ball in the
// air or rolling, its tracer, the reset after it, a flyover or a look down
// the hole, a celebration, a friend's shot flying in, the chipping green's
// advice being worked out, the green-reading grid's markers (their speed
// and direction are the read), rain falling, a recording (or its preview)
// and the game's video.
function pictureMoving(m) {
  if (mustStaySmooth(m) || alwaysMoving()) return true;
  if ((m.restTimer ?? 0) > 0 || (m.resetTimer ?? 0) > 0 || m.flagSince != null) return true;
  if (m.grid?.group?.visible || m.adviceJob) return true;
  // Sand or water still flying from a shot (look/sprays.js).
  if (m.sprays?.busy) return true;
  // A mode that says for itself (golf pong on the putting green).
  return !!m.pictureMoving?.();
}
// What's on screen that a hitch would spoil - a ball in the air or
// rolling, a flyover, a celebration, the video, the speed test: nothing done
// in the quiet moments while it runs (idleBudget's busy).
function mustStaySmooth(m) {
  if (reel?.active || speedTest?.running || rendererTest?.running) return true;
  if (m.flying || m.rolling || m.game?.flying || m.game?.intro || m.flyover || m.lookDown) return true;
  return !!(m.celebration?.active || m.remoteFlying?.length || m.remoteFlights?.length);
}
// The camera on a move it flies along (Ultra's supersampling eased then:
// sim/ultra.mjs FLY) - a ball's flight followed (not a putt), a flyover or
// a look down the hole, the speed test's fly-through (not while its costs
// are timed, the camera held).
function cameraFlying(m) {
  if (speedTest?.running) return !speedTest.loading && !speedTest.costs;
  if (rendererTest?.running) return true;
  if (m.flyover || m.lookDown || m.game?.flying) return true;
  return !!m.flying && !m.flying.shot?.putt;
}
const flyState = { eased: false, left: 0 };
const phoneFrames = inPocket ? new FrameCap() : null;
// A picture that's moving all along - a session being recorded, rain
// falling: it never rests, so the quiet moments' work takes what drawn
// frames leave over (idleBudget, as with resting off). (Counted as busy,
// the next hole was never built ahead while recording or in the rain, so
// moving on built it all at once, every shader with it: a freeze.)
function alwaysMoving() {
  return !!(video.recording || video.compositor?.active) || (weatherLook.rain ?? 0) > 0.01;
}
renderer.setAnimationLoop((time) => {
  if (!picturesOn) return;
  // A game controller, read every frame (gamepad.js) - resting or not.
  gamePad.frame(time);
  // The screen's refresh rate, from the frames that come while the picture
  // rests (until it's known: sim/refresh.mjs).
  noteRefresh(time, drewLast);
  const started = performance.now();
  // Each part of the update timed, for a long frame's words
  // (sim/frameparts.mjs).
  frameParts.start();
  // The picture's size, if the safety valve stepped since the last frame:
  // taken up here, before drawing, so no frame is shown (or recorded)
  // blank (look/renderscale.js).
  const resized = applyPictureScale() ? pictureShare() : 0;
  // The picture drawn wide while the recording (or its designer) wants the
  // game centred and the centre's moved (sim/viewoffset.mjs wideFrame):
  // taken up here, before drawing, as a size change is.
  const wantWide = !!picture.centre && !!video.compositor?.wantsCentredGame?.();
  if (wantWide !== picture.wide) {
    picture.wide = wantWide;
    resize();
  }
  timer.update(time);
  const dt = Math.min(timer.getDelta(), 0.1);
  reel?.frame(dt);
  const m = modes[mode];
  m.update(dt);
  frameParts.lap("play");
  const cut = cameraCut(m);
  // Nothing moving and the camera still: the picture rests - nothing drawn
  // but a check a second, the scenery's own motion stopped with it
  // (sim/stillpicture.mjs). The game itself (above) runs on regardless.
  const still = stillPicture.frame(time, { on: stillSetting.on, moving: cut || resized > 0 || pictureMoving(m), view: viewNumbers(m.camera) });
  const sceneryTime = sceneryClock.step(time, still.draw && !still.check);
  // On Ultra, supersampling eased while the camera flies, not recording
  // (look/renderscale.js) - the full picture again on a resting check.
  setPictureFlying(flyEase(flyState, { moving: cameraFlying(m) && !still.check, recording: !!video.recording, dt }));
  drewLast = still.draw;
  frameRate.rest(stillPicture.resting);
  // Bay view's notes over the top of the picture fade while the ball is in
  // the air (a putt rolls: they stay).
  bay.setFlying(mode !== "putting" && !!(m.flying || m.game?.flying) && !m.flying?.shot?.putt);
  // Sounds are heard from the camera; the background is the scene's own
  // (its wind, its water), or a plain one of the mode's.
  frameParts.lap("other");
  audio.frame(m.camera, m.soundscape ?? (m.quietScape ??= soundscape()));
  frameParts.lap("sound");
  // The quiet moments' work: most of a frame while the picture rests (or,
  // with resting turned off, what a drawn frame leaves under its time),
  // none while anything's moving (a ball in the air, a flyover).
  const busy = !!cut || mustStaySmooth(m);
  // (Starved of time for a while - a picture that never rests, frames
  // never under their target - it's given a little anyway: idleBudget.)
  // A step that holds the page - a shader drawn for the first time
  // (look/gpuprep.js) - only in a frame that can take it: one the picture
  // rests in, or behind a card, or after a long wait (heavyAllowed).
  const idleFrom = performance.now();
  if (!idleWork.idle) {
    const starved = idleWork.starved();
    const budget = idleBudget({ resting: !still.draw, busy, frameMs: lastFrameMs, targetMs: 1000 / (frameRate.refresh?.hz || 60), rests: stillSetting.on && !alwaysMoving(), pause: !!m.loadingPause?.(), between: !!m.buildingBetween?.(), starved });
    idleWork.run(budget, { heavy: heavyAllowed({ budget, starved, sinceHeavy: idleWork.sinceHeavy() }) });
  }
  lastBusy = busy;
  restRunner?.poke();
  frameIdleMs += performance.now() - idleFrom;
  frameParts.lap("idle");
  // Every shader program built stays on the card (sim/keepprograms.mjs).
  keepPrograms(programList(renderer), keptPrograms);
  if (!still.draw) return;
  // On the phone, 60 frames a second at most, however fast its screen
  // (sim/framecap.mjs): the game above ran this frame all the same.
  if (phoneFrames && !phoneFrames.due(time)) return;
  // (Covered whole - the course's still up while its first hole is built
  // behind it: nothing to draw.)
  if (m.pictureHidden?.()) {
    // (Not drawing isn't a freeze: the next frame's gap starts afresh.)
    longFrames.restart();
    frameIdleMs = 0;
    return;
  }
  // (The game's video's designer over all of it: the course not drawn, the
  // recording still given its frame - the editor, the whole picture.)
  if (reelCover) {
    longFrames.restart();
    frameIdleMs = 0;
    video.frame(time);
    return;
  }
  // Drawing again after resting: the rest isn't a long frame.
  if (still.woke) longFrames.restart();
  // (Nor is the quiet moments' work while it rested a drawn frame's.)
  if (still.woke) frameIdleMs = 0;
  // The gap since the last frame, with what that frame did.
  // (A gap of more than a second while the window was showing is a freeze,
  // kept; one while it was hidden or minimised isn't.)
  const longNow = still.check ? null : longFrames.frame(time, frameFacts, { view: frameCounts.view, at: Date.now(), hidden: wentHidden || document.hidden });
  // A second or more (a freeze): the memory then, and whether it was
  // recording, kept with it - a stall can be told from memory running out.
  if (longNow && longNow.ms >= 1000) Object.assign(longNow, { heapMB: memoryNow().heapMB, recording: !!video?.recording });
  wentHidden = false;
  // The weather's values for the picture, then the scenery that shows them
  // (by the scenery's clock: not while resting, a check included).
  const wind = m.sceneryWind?.() ?? null;
  frameParts.lap("other");
  if (!still.check) {
    updateWeatherLook(sceneryTime, wind);
    animateScenery(sceneryTime, wind, m.camera);
  }
  frameParts.lap("scenery");
  // Which trees are drawn in their far version: decided at a cut, or as a
  // planned move starts - a flyover, or at address for where the shot
  // will go, so the strike itself changes nothing (look/trees.js,
  // sim/preflight.mjs). On a resting check too: a plan changed while the
  // picture rests (another club) is got ready then, not as the ball's hit.
  const trees = updateTreeDetail(m.scene, m.camera, { cut, plan: m.treePath?.() ?? null, stand: m.treeStand?.() ?? null });
  frameParts.lap("trees");
  // The sun's shadow map is drawn again only when something in it has
  // changed (look/shadowwatch.js).
  // On High, the near shadow map moves on to where the camera's looking
  // (look/nearshadow.js) - not while a ball flies.
  followNearShadow(m.scene, m.camera, { hold: !!(m.flying || m.game?.flying) });
  const shadows = shadowWatch.check(m.scene);
  frameParts.lap("shadows");
  const drawing = performance.now();
  // Through the picture's effects, while there are any (look/effects.js),
  // the camera swayed for the drawing alone if that's on (look/sway.js) -
  // by the scenery's clock, which stops while the picture rests: by the
  // real one, each resting check (once a second) drew it swayed somewhere
  // else, and the still picture jumped every second.
  // In a flyover on Ultra, focused on the ball (look/effects.js); and its
  // smoothing over time told of a resting check (not nudged) or a cut.
  setFocus(m.focusDistance?.() ?? null);
  setTaaFrame({ still: still.check, cut });
  renderer.info.reset();
  // (Drawn wide for a centred recording: widepicture.js - the camera's
  // window widened for the drawing alone.)
  drawSwayed(m.camera, sceneryTime, () =>
    drawWide(m.camera, () => {
      // On Ultra, the ponds' reflections first (look/mirrors.js), counted
      // apart from the picture's own (look/gpu.js frameDraws).
      countPart(renderer, "reflections", () => drawMirrors(renderer, m.scene, m.camera));
      if (effectsOn()) drawWithEffects(m.camera, () => shadowWatch.render(m.scene, m.camera), m.scene);
      else shadowWatch.render(m.scene, m.camera);
    }),
  );
  const drawn = performance.now();
  frameParts.skip();
  picturesDrawn++;
  // The speed test times each frame to the end of the graphics card's work.
  if (speedTest?.running) speedTest.frame(time, started, longNow);
  // And the WebGPU test (renderertest.js).
  if (rendererTest?.running) rendererTest.frame(started);
  // How long it took, what it drew, and where (fps.js) - not a resting
  // check, nor the gap before the first frame after a rest.
  if (!still.check)
    frameRate.frame(time, {
      draws: frameDraws(renderer),
      view: currentView(m),
      recording: !!video.recording,
      // (A frame drawn eased is quicker than the picture's own: not
      // counted for the valve either way.)
      play: document.visibilityState === "visible" && !pictureEased(),
      cut: cut || still.woke,
      between: !(m.flying || m.game?.flying),
    });
  frameParts.lap("rate");
  // The recording's picture, while there's one: the game's copied now,
  // while the frame just drawn is still in the canvas (compositor.js).
  video.frame(time);
  frameParts.lap("recording");
  // (The game's own work: everything but the drawing, and the drawing.)
  if (!still.check) noteFrame(m, { trees, shadows, cut, resized, update: drawing - started + (performance.now() - drawn), draw: drawn - drawing });
  lastFrameMs = performance.now() - started;
  // (While the canvas still holds the frame: the course's still of its
  // first hole, before a round - course.js pictureDrawn.)
  m.pictureDrawn?.(renderer.domElement);
});

// The welcome screen: first run, and W.
export const welcome = new Welcome({
  bridge: appBridge,
  playMode,
  toast: (t) => bay.toast(t, 3000),
  monitor: () => launchMonitor,
  onMonitor: (id) => setLaunchMonitor(id),
  actions: {
    range: () => setMode("range"),
    putting: () => setMode("putting"),
    chipping: () => setMode("chipping"),
    challenges: () => setMode("challenges"),
    course: async (id) => {
      if (!(await modes.course.leaveRound("Start a new round?"))) return;
      setMode("course");
      modes.course.startRound(id);
    },
  },
});
if (lastStatus) welcome.setStatus(lastStatus);

// The course designer, with separate screens: in a window of its own,
// opened from the controls window so it goes on that screen (the laptop),
// with the game left on the projector, showing the range. Its "Play this
// course" (or hole) and "Back to the sim" come back over a channel and
// close it.
// (start: "map" - no course - opens it on a real course from the map.)
modes.course.onOpenDesigner = (id, hole = null, start = null) => {
  if (!screens.separate) return false;
  const from = screens.doc?.defaultView ?? window;
  const win = from.open(`/designer.html?window=1${id ? `&course=${encodeURIComponent(id)}` : start === "map" ? "&start=map" : ""}${id && hole ? `&hole=${hole}` : ""}`, "a2-designer");
  if (!win) {
    bay.toast("Pop-ups are blocked - allow them for the course designer's window", 3500);
    return false;
  }
  if (mode !== "range") setMode("range");
  return true;
};
if (typeof BroadcastChannel === "function") {
  new BroadcastChannel("a2-designer").onmessage = (e) => {
    const id = e.data?.play;
    if (typeof id !== "string" || !id) return;
    setMode("course");
    modes.course.startRound(id, Number(e.data.hole) || 1, null, { only: !!e.data.only });
  };
}
// The designer's Play this hole, played: back to the course designer, on
// that hole - in its own window with separate screens (the game left on
// the range), else in place of the game.
modes.course.onBackToDesigner = (id, hole) => {
  if (modes.course.onOpenDesigner(id, hole)) return;
  location.href = `/designer.html?course=${encodeURIComponent(id)}&hole=${hole}`;
};

// The designer's "Play this course" arrives as ?mode=course&course=<id>
// (and "Play this hole" with &hole=<number>).
const params = new URLSearchParams(location.search);
if (params.get("mode") in modes) mode = params.get("mode");
setMode(mode);
practicePlan = new PracticePlan({
  modes,
  setMode,
  setClub: (club) => pickClub(club),
  toast: (text, ms) => bay.toast(text, ms),
  recordGame: (g) => recorder.game(g),
  hitter: () => recorder.hitter,
  changed: () => refreshOverlay(),
  view,
  openStats: () => openPage("/stats.html"),
});
// My stats' "Practise this" (?plan=<drill>, or "suggested").
if (params.get("plan")) practicePlan.start(params.get("plan"));
// A round from the address is laid out behind the loading screen, which
// waits for it (finishLoading).
const roundStarting = params.get("course") ? modes.course.startRound(params.get("course"), Number(params.get("hole")) || 1, null, { only: params.get("only") === "1" }) : null;
// Who's playing, as the game starts (the menu turns it off), and not again
// for a reload while it runs: not over the welcome, nor a round asked for
// in the address. With separate windows it floats over the command centre
// once that's open (below); until it's answered, a warm-up (startWarmUp).
// The phone's Play with friends (sim/phoneroutes.mjs) arrives as
// ?online=1: the Online play panel open, to host a game or join one by its
// code - asked for in the address as a round is, so no Who's playing first.
const onlineAsked = params.get("online") === "1";
// (Nor over the phone app's start screen: they come once something's
// picked there - playFromHome.)
const homeFirst = phoneHome.up;
const whoFirst = !roundStarting && !onlineAsked && !homeFirst && whoPrompt({ on: askWho(), asked: whoAsked() }) === "card";
const separateAtStart = Screens.mode(prefs.screens) === "separate";
// (A controls window opened as the page started, for screens that aren't
// separate after all, goes: earlyscreens.js.)
if (!separateAtStart) takeEarlyControls()?.win.close();
const starting = startSequence({ whoFirst, welcome: !roundStarting && !homeFirst && welcome.firstRun, separate: separateAtStart });
if (!roundStarting && !homeFirst && welcome.firstRun) welcome.show(true);
else if (starting.who === "here") openWho();
if (starting.warmUp) startWarmUp();
if (onlineAsked) onlinePanel.show(true, "play");
markWhoAsked();
startedUp = true;
tellVoice();
// Recording when the page before this one went (a crash): it carries on in
// a new file (videorec.js resumeAfterRestart).
video.resumeAfterRestart();
// (Held upright, the picture sized as the page now has it: its dock's
// come or gone as it was set up.)
if (upright.up) resize();
// Nobody signed in here: the card to sign in, over everything; else straight
// in as the account in use (signin.js).
if (!roundStarting) signIn.start();
// Full screen needs a key press or click, so a reload into bay view comes
// back as bay view in a window; F or B puts it back.
// The app says whether to start in bay view (?bay=1 or ?bay=0, its "Start
// in bay view" setting); otherwise, and after that, it's as last left. The
// flag is taken off the address once used, so a reload (G, the System
// menu's Reload) keeps whatever the player has chosen since.
// (startInBay and withoutBayFlag are in sim/roundkeys.mjs.)
const startBay = startInBay(params.get("bay"), prefs.bay);
if (startBay || params.has("bay")) setBay(startBay);
// Separate windows as last left (a browser may want a key or click first),
// with Who's playing, if it's asked, floating over the command centre as
// soon as it's there - or over the game screen if it can't open (a browser
// blocking it until a key or a click: the card then moves across with the
// controls when they go).
// Settled once the game has finished loading (finishLoading, below).
let loadingDone;
const afterLoading = new Promise((resolve) => (loadingDone = resolve));
// The phone app: a newer version on the downloads page, said once the
// game's loaded (appupdate.js, sim/appupdate.mjs). (Not on the web: a page
// is always the site's newest - sim/webapp.mjs.)
if (inPocket && !window.a2web) afterLoading.then(() => checkAppUpdate());
// (And whenever the app's brought back to the front: it's rarely opened afresh.)
if (inPocket && !window.a2web) checkWhenBack();
// The graphics settings' new names (sim/graphics.mjs NAMES), said once to a
// player who had chosen one under its old name - the same picture.
afterLoading.then(() => {
  const note = formerNote(loadSetting("graphics", null), loadSetting("graphicsRenamed", false));
  saveSetting("graphicsRenamed", true);
  if (note) setTimeout(() => bay.toast(note, 9000), 2500);
});
// The phone app's start screen (phonehome.js): a route picked there puts
// how the phone plays in force at once, and what's picked plays once the
// game's loaded (at once if it has) - Who's playing first, once, as the
// game would have asked it on starting.
let askedFromHome = homeFirst ? false : true;
async function playFromHome({ mode: where = null, course = null, online = false, ladders = false } = {}) {
  if (course && !(await modes.course.leaveRound("Start this course?"))) return;
  if (where && where !== mode) setMode(where);
  if (course) modes.course.startRound(course);
  // (Online: the Online tab - its Ladders when something waits there.)
  if (online) onlinePanel.show(true, onlineWaiting() ? "ladders" : seasonsWaiting() ? "seasons" : "play");
  if (ladders) return void openLadderPanel();
  if (askedFromHome) return;
  askedFromHome = true;
  if (!course && !online && whoPrompt({ on: askWho(), asked: false }) === "card") openWho();
}
// How the phone plays, from a route (sim/phoneroutes.mjs): kept, and in
// force at once.
function useRoute(r) {
  const keep = routeSettings(r);
  saveSetting("route", keep.route);
  saveSetting("welcome", keep.welcome);
  playMode.set(keep.playMode);
}
// The phone's range session with a launch monitor (the owner, 3 November
// 2026: "allow user to go menu>range session ... Once in range session can
// cancel and go back to mobile"): Menu -> Range session starts it - the
// launch monitor looked for, the swing pad off, on the range - and End
// range session (the menu, the Session card) goes back to phone play, the
// swing pad on, where you are. The app always opens in phone play.
export const inRangeSession = () => playMode.inApp && loadSetting("route", "play") === "range";
export function startRangeSession() {
  if (phoneHome.up) phoneHome.toGame?.();
  useRoute("range");
  if (mode !== "range") setMode("range");
  bay.toast("Range session: switch on your launch monitor - it connects by itself", 5000);
  menu?.refresh(["range-session", "phone-play"]);
  return "";
}
export function endRangeSession() {
  useRoute("play");
  bay.toast("Back to phone play - swing on the pad", 4000);
  menu?.refresh(["range-session", "phone-play"]);
  return "";
}
phoneHome.connect({
  route: (r) => useRoute(r),
  go: (go) => afterLoading.then(() => playFromHome(go)),
  level: () => mouseSwing.level,
  setLevel: (id) => (setSwingLevel(id), menu?.refresh(["swing-level"])),
  // How far whoever's playing is towards the next level.
  progress: () => levelProgressLine(),
  power: () => skillsNow()?.power ?? 0,
  // What waits on the online ladders, for Play's Online tile.
  ladderWaiting: () => modes.course.ladderWaiting?.() ?? [],
  where: () => ({ mode, round: modes.course.underway && modes.course.course ? { course: modes.course.course.name, hole: (modes.course.round?.index ?? -1) + 1 } : null }),
});
if (separateAtStart) {
  const opened = screens.open({ quiet: true });
  // (Opened slowly as the game loads, it's tried again once the game has
  // loaded - and Who's playing waits for it: it belongs on the command
  // centre, not the projector. Blocked by a browser, it's shown here.)
  if (starting.who === "controls") opened.then((ok) => (ok || screens.blocked ? openWho() : afterLoading.then(() => screens.open({ quiet: true })).then(() => openWho())));
  else opened.then((ok) => !ok && !screens.blocked && afterLoading.then(() => screens.open({ quiet: true })));
}
const query = withoutBayFlag(location.search);
if (query !== null) history.replaceState(null, "", `${location.pathname}${query}${location.hash}`);
// ---- The game's video ----------------------------------------------------------------

// The A² Golf video (showreel.js, sim/showreel.mjs): the game plays it by
// itself and records it - the menu's Record the A² Golf video, or "record
// the video". What it works the page with:
reel = new Showreel({
  modes,
  video,
  view,
  mode: () => mode,
  setMode,
  // A round or a game it would end, if any (it asks to finish it first).
  busy,
  // An online game this bay is playing (it would leave it).
  playingOnline: () => netClient.view.mode !== "off" && !!netClient.view.game?.started && !netClient.view.game.ended,
  toast: (text, ms) => bay.toast(text, ms, { force: true }),
  // How many of its shots have come in (it waits for each).
  shots: () => reelShots,
  // Its player on the course, as the panel would set them.
  setPlayers: (names) => {
    modes.course.settings.players = playerNames(names);
    saveSetting("course", modes.course.settings);
    modes.course.renderPlayers();
    showHitters();
    refreshOverlay();
  },
  // The four-ball's online game: this bay's changes to it (null: back to
  // the server's).
  online: (send) => (reelNet = send ?? null),
  // The designer over the whole picture: the course behind it not drawn.
  cover: (on) => (reelCover = !!on),
  // Nothing for the stats - kept as recording off keeps it - nothing
  // asked, and the cameras' replays paused. Out of the way and heard:
  // every panel and menu closed, the game in one window, the sound on (the
  // strike too: nobody's hitting a real ball), the celebrations' cheers
  // with it. All in the held settings. And no more on the picture than
  // its own words: no tips, no messages, no flyover card.
  prepare: () => {
    recorder.formatFor = () => "off";
    recorder.endSession = () => {};
    if (recorder.open) recorder.close();
    replay.setPaused(true);
    if (menu.open) menu.show(false);
    if (welcome.open) welcome.show(false);
    if (bay.helpOpen) bay.showHelp(false);
    if (soundPanel.open) soundPanel.show(false);
    if (cameraPanel.open) cameraPanel.show(false);
    if (videoPanel.open) videoPanel.show(false);
    if (swingReplay.showing) swingReplay.close();
    if (whoDialog.open) whoDialog.close();
    if (whoCheck.open) whoCheck.close();
    if (playersDialog.open) playersDialog.close();
    bay.showHint(null);
    bay.toast("");
    bay.hush = true;
    modes.course.offers = false;
    if (!audio.on) audio.setOn(true);
    if (!(audio.settings.master > 0)) audio.set("master", 0.8);
    if (!audio.settings.celebrations) audio.set("celebrations", true);
    if (!audio.settings.strike) audio.set("strike", true);
    if (!screens.separate && !bay.enabled) setBay(true);
    // The game screen as it comes: the owner's moved and bigger boxes set
    // aside (gamearrange.js).
    gameLayout.aside(true);
    // Its own carries, not the carry adjustment (applyCarry).
    setCarryMatch(1);
    blurActive();
  },
  reload: () => {
    leaving("the A² Golf video");
    location.reload();
  },
  openRecordings: appBridge?.openRecordingsFolder ? () => appBridge.openRecordingsFolder() : null,
});
// Just back from the video (it reloads the page as it ends): where its
// recording went.
reel.showDone(Showreel.saidAfter(), { folder: !!appBridge?.openRecordingsFolder, shown: afterLoading });
// While a test runs (the speed test, the WebGPU test): nothing else on the
// picture - no recording, replay, menu, tips or messages.
function quietForTest() {
  recorder.formatFor = () => "off";
  recorder.endSession = () => {};
  if (recorder.open) recorder.close();
  replay.setPaused(true);
  if (menu.open) menu.show(false);
  if (welcome.open) welcome.show(false);
  if (bay.helpOpen) bay.showHelp(false);
  if (swingReplay.showing) swingReplay.close();
  bay.showHint(null);
  bay.toast("");
  bay.hush = true;
  modes.course.offers = false;
  blurActive();
}
// The speed test (speedtest.js): the same 30-second fly-through at each
// setting, one score each, from the menu's Screens page.
speedTest = new SpeedTest({
  setMode,
  course: modes.course,
  renderer,
  view,
  busy,
  quiet: quietForTest,
  reload: () => {
    leaving("the speed test");
    location.reload();
  },
  toast: (text, ms) => bay.toast(text, ms, { force: true }),
  facts: () => ({ gpu: cardFacts.gpu ?? "", hz: frameRate.refresh?.hz ?? null, target: frameRate.target }),
});
// The WebGPU test (renderertest.js): the same flight round the range drawn
// by WebGL and by the WebGPU renderer, from the menu's Screens page; quiet
// as for the speed test.
rendererTest = new RendererTest({
  setMode,
  range: modes.range,
  renderer,
  asked: rendererAsked,
  view,
  busy,
  quiet: quietForTest,
  go: (href) => {
    leaving("the WebGPU test");
    location.replace(href);
  },
  toast: (text, ms) => bay.toast(text, ms, { force: true }),
  facts: () => ({ gpu: cardFacts.gpu ?? "" }),
});

// Handy when poking at it from the browser console.
// The range's "Odd shot?" card can be answered out loud while it's
// showing (voice's waiting() and voiceCommand above, recorder.hear).
// markShot("misread" | "thin" | "fat" | "good" | "keep"...) says it about
// the shot on that card, or the last one; markShot("punch" | "part" |
// "other") with no card showing says the next shot is that special shot.
// hear("shot note pulled it", { confidence }) goes through voice exactly as
// a phrase the recogniser heard would, microphone or not: the test hook.
window.golfsim = {
  modes,
  // The phone held upright (upright.js).
  upright,
  bay,
  // The 3D picture's renderer, for checks of what a frame draws.
  renderer,
  // The last shot as the recording and the command centre draw it - its
  // flight the one the mode flew (sim/shotflight.mjs).
  get videoShot() {
    return videoShot;
  },
  // Online play: the game and its panel.
  online: { client: netClient, panel: onlinePanel },
  // My stats' "Practise this", from its window.
  startPlan: (id) => practicePlan.start(id),
  get practicePlan() {
    return practicePlan;
  },
  menu,
  testShot,
  setMode,
  voice,
  pickClub,
  recorder,
  audio,
  screens,
  mirror,
  blank,
  layout,
  cameras,
  replay,
  cameraBoxes,
  cameraPanel,
  swingReplay,
  video,
  videoPanel,
  frameRate,
  shadowWatch,
  // The graphics card and how the picture has run, for a report to Claude
  // (electron/main.mjs asks for it).
  graphics: graphicsFacts,
  markShot: (say) => recorder.markShot(say),
  // The recording format, for a voice command: "practice", "round",
  // "experimental" or "off" (or words for one: "stop recording"). True when
  // it was one. recordingFormat() says which it is now.
  recording,
  setRecording: (format) => recording.set(format),
  recordingFormat: () => recording.format,
  hear: (text, opts) => voice.inject(text, opts),
  reel,
};

// The load's last steps, behind the loading screen: the opening mode's
// shaders ready and each drawn once, a round from the address laid out,
// the detail textures in and sent to the graphics card, and the first
// whole picture drawn. Then it fades. Each wait has its limit, so nothing
// that doesn't come (a course that won't load, a missing texture) can hold
// the game up. The other modes' shaders, where the card builds them in
// the background, follow one mode at a time, a frame apart, while the game
// is played.
//
// Every shader of the opening picture is drawn once here, where nothing
// shows - one new shader a step, the page let go between so the loading
// screen (and the controls window) keep moving (look/gpuprep.js
// drawAllSteps) - with the warmers' (the tracers', a celebration's, the
// green's, the grass round the ball's). The card finishes building a
// shader as it's first drawn, a hold of a tenth of a second to most of
// one each; drawn here, the first picture, the first strike and the first
// green hold for none of them. Not for ever: a card that takes too long
// draws the rest as it comes.
const WARM_DRAW_LIMIT = 30000;
async function drawAhead(m, limitMs = WARM_DRAW_LIMIT) {
  if (!m?.scene || !m.camera) return;
  const from = performance.now();
  const steps = drawAllSteps(renderer, m.scene, m.camera, m.scene, { warmers });
  try {
    for (;;) {
      const { done } = steps.next();
      keepPrograms(programList(renderer), keptPrograms);
      if (done || performance.now() - from > limitMs) break;
      await nextFrame();
    }
  } catch (err) {
    console.error("Warming the shaders:", err);
  } finally {
    // (Cut short: the warmers out of the scene all the same.)
    steps.return();
  }
}
const KEEP_SHAPES_AFTER = 30000;
async function finishLoading() {
  foldForTouch();
  try {
    await loading.reach("shaders");
    await within(firstWarmed, 20000);
    if (roundStarting) {
      await loading.reach("round");
      await within(roundStarting, 30000);
      // The hole's own scenery, new since the course's scene was warmed.
      await within(warmUp(renderer, modes.course.scene, modes.course.camera), 20000);
    }
    await loading.reach("drawing");
    await drawAhead(modes[firstWarm]);
    await loading.reach("textures");
    for (const t of (await within(detailTexturesSettled(), 5000, [])) ?? []) {
      try {
        renderer.initTexture(t);
      } catch {
        // Sent as it's first drawn.
      }
    }
    await loading.reach("picture");
    picturesOn = true;
    const until = performance.now() + 15000;
    const wanted = picturesDrawn + 1;
    // (Nothing to wait for when the picture's covered whole - the course's
    // still up while its first hole is built behind it (course.js
    // pictureHidden): no frame is drawn, and the loading screen stood its
    // full 15 s for one - a report's "picture 15.0 s" of a 32.8 s start.)
    while (picturesDrawn < wanted && !modes[mode]?.pictureHidden?.() && performance.now() < until) await nextFrame(250);
    // Drawn, and finished by the card: the fade starts with the picture
    // ready, rather than standing still while the card catches up.
    settle(renderer);
  } catch (err) {
    console.error("Loading:", err);
  }
  picturesOn = true;
  // Started: the guard's note goes (look/quality.js), the Windows app is
  // told (it offers to go back a version when a start never gets here),
  // and a setting the guard lowered says so.
  startedSafely();
  window.golfsimApp?.started?.();
  // (The load's facts to the server now, for a report at any time after.)
  sendGraphics();
  prepareOtherModes();
  // (The trees' shapes kept for the next start once the first hole's
  // likely built: look/trees.js.)
  setTimeout(keepTreeShapes, KEEP_SHAPES_AFTER);
  if (startMessage) heldToast = [startMessage, 6000];
  const fading = loading.finish();
  if (heldToast) toastNow(...heldToast);
  heldToast = null;
  await fading;
  if (!backgroundShaders) return;
  for (const name of laterWarms) {
    await nextFrame();
    await within(warmMode(name), 20000);
  }
}
// (A speed test under way carries on once the game is ready, every mode's
// shaders built: speedtest.js.)
finishLoading().then(() => {
  loadingDone();
  speedTest?.resume();
  rendererTest?.resume();
});
