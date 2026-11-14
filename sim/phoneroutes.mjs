// The phone app's two routes (the owner, 24 October 2026: "the main aim
// here is a playable golf app. That users can play alongside others.
// Secondly the few users that will connect the app direct to their
// launcher at the range, but even then it's a simplified version compared
// to the home option ... That starts when opening the app. And defined
// routes from there"; docs/ANDROID-PLAN.md, "Two apps from one game"):
//   play   the phone game, for most players - swung with a finger on the
//          swing pad, no launch monitor;
//   range  at the range, with a launch monitor over the phone's Bluetooth.
// The app opens in play every time, straight into the game (the owner, 3
// November 2026: "do away with the play/range screen ... always default to
// mobile gameplay"; OPENS_IN): a range session is the menu's (Range
// session), ended there or on its Session card, back to play. Each has its
// own home of things to do (Home, first in the menu), each a way into the
// game with what to start. They're drawn over the game page itself as it loads
// (public/phonehome.js: the owner, 26 October 2026, "Once past the initial
// screens (play/launch) and then the next screen, it then loads in (pre
// loading should be done here) and we should be able to get back to these
// screens"): the game loads behind them, and Home brings them back over it
// as it is. Choosing a route sets how the phone plays (sim/playmode.mjs:
// the touch screen or the launch monitor) and the swing pad with it, and
// the welcome's question is never asked: the route answered it.
//
// The game's menu on the phone leaves out the PC's bay features
// (PHONE_MENU_OFF: separate windows, cameras and recording, voice, the
// Windows app's own...) and has Range session, and End range session.
//
// Pure: public/phonehome.js draws the routes, public/app/menus.js hides
// the menu's items; test/phoneroutes.test.mjs.

import { LEVELS } from "./swinglevels.mjs";

// What's in a route's home. Each thing is one of:
//   go     the game, starting there: { mode } - and for a course,
//          course: "pick" (the course list first); online: the Online
//          play panel open (host a game or join one by its code);
//          ladders: the side panel open at the match ladders (app.js
//          openLadderPanel);
//   page   another of the app's pages;
//   level  the swing's level, chosen there and then;
//   soon   not yet - what it'll be, and when.
export const ROUTES = [
  {
    id: "play",
    name: "Play",
    playMode: "touch",
    line: "Golf on your phone: swing with a finger on the pad. Rounds, practice and challenges.",
    items: [
      { id: "round", label: "Play a round", help: "A course, hole by hole: pick one of the courses that come with the app, one you've made or a friend's.", go: { mode: "course", course: "pick" } },
      { id: "online", label: "Online", help: "Play friends on their phones and PC bays: host a game or join one by its code, and your online match ladders - live, or by post.", go: { mode: "course", online: true } },
      { id: "range", label: "Driving range", help: "Hit as many as you like: each shot's carry, line and what it did.", go: { mode: "range" } },
      { id: "putting", label: "Putting green", help: "Putts of every length and slope - and golf pong against the phone.", go: { mode: "putting" } },
      { id: "chipping", label: "Chipping green", help: "Chips and pitches to a flag from the fairway, the rough and the sand.", go: { mode: "chipping" } },
      { id: "challenges", label: "Challenges", help: "Games with a score to beat: closest to the pin, the approach ladder and more.", go: { mode: "challenges" } },
      { id: "designer", label: "Course designer", help: "Make a course of your own - in a few taps, or from a scorecard - change any hole, play it, and share it with friends by a code.", page: "/designer.html" },
      { id: "stats", label: "My stats", help: "Link the phone to your PC once: your shots go into its stats by themselves, and your players, handicaps, club distances and rounds come back here.", page: "/pocket/link.html" },
      { id: "level", label: "Your level", help: "How forgiving the swing is and how far it hits: Beginner and Amateur forgive mistakes but hit shorter, Pro and Tour punish them but hit further - two good rounds at yours and you move up one.", level: true },
    ],
  },
  {
    id: "range",
    name: "At the range",
    playMode: "monitor",
    line: "With your launch monitor over the phone's Bluetooth: every shot's numbers, wherever you're hitting.",
    items: [
      { id: "session", label: "Range session", help: "Hit balls with your launch monitor: each shot's carry, speed, spin and line, club by club.", go: { mode: "range" } },
      { id: "round", label: "Play a course", help: "A round on one of the app's courses, every shot hit with your launch monitor.", go: { mode: "course", course: "pick" } },
      { id: "stats", label: "My stats", help: "Link the phone to your PC once: your shots go into its stats by themselves, and your players, handicaps, club distances and rounds come back here.", page: "/pocket/link.html" },
      { id: "check", label: "Check the Bluetooth", help: "Whether the phone sees your launch monitor - and a report to send back if it doesn't.", page: "/pocket/phone.html" },
    ],
  },
];

export const routeById = (id) => ROUTES.find((r) => r.id === id) ?? null;

// The route the app opens in, every time: phone play.
export const OPENS_IN = "play";

// Where the home is: the address's # (so the phone's back button steps
// back through it): "" none (play's home, as there's no start screen),
// "play" a route's home,
// "play/courses" its course list, "play/game" in the game, the home put
// away. -> { route: a route's id or null, sub: "courses", "game" or null }
export function homeAt(hash = "") {
  const [where = "", sub = ""] = String(hash ?? "").replace(/^#/, "").split("/");
  const route = routeById(where)?.id ?? null;
  return { route, sub: route && (sub === "courses" || sub === "game") ? sub : null };
}
// And the # for one: homeHash("play", "game") "#play/game", homeHash() "#".
export const homeHash = (route = null, sub = null) => (routeById(route) ? `#${route}${sub ? `/${sub}` : ""}` : "#");

// What the home's Back to the game says it goes back to (the owner, 29
// October 2026: "the home button takes you back to the original screen,
// but no sensible way to exit back to game"): the round going on and its
// hole, or where you were. mode: the game's mode; round: { course, hole }
// (hole from 1) while a course round's under way, or null.
const PLACES = { range: "The driving range", putting: "The putting green", chipping: "The chipping green", course: "The course", challenges: "The challenges" };
export function gameWhere({ mode = null, round = null } = {}) {
  if (round?.course) return Number.isInteger(round.hole) && round.hole > 0 ? `${round.course} - hole ${round.hole}` : round.course;
  return PLACES[mode] ?? "Where you left it";
}

// A page asked to start somewhere in the game - ?mode=, ?course= or
// ?online= (a link from before, the app's own pages coming back) - goes
// straight in, the home put away.
export const startsInGame = (search = "") => /[?&](mode|course|online)=/.test(String(search ?? ""));

// What choosing a route keeps (the game's own settings, golfsim.<key> in
// the phone's storage: util.js loadSetting): the route, how the phone
// plays, the swing pad on for the touch screen and off for a launch
// monitor, and the welcome as seen (the route answered its question).
// saved: the swing pad's setting as it is (kept, but for on).
//   -> { key: value } to keep
export function routeSettings(route, { mouseSwing = {} } = {}) {
  const r = typeof route === "string" ? routeById(route) : route;
  if (!r) return {};
  return {
    route: r.id,
    playMode: r.playMode,
    welcome: { seen: true },
    mouseSwing: { ...mouseSwing, on: r.playMode === "touch" },
  };
}

// The levels a player picks from on the phone (Custom's switches are the
// menu's): { id, name, help }.
export const PHONE_LEVELS = ["beginner", "amateur", "pro", "tour"].map((id) => ({ id, name: LEVELS[id].label, help: LEVELS[id].help }));

// The swing's level with this one chosen (the menu's own: mouseSwing.level).
export const withLevel = (mouseSwing = {}, level) => ({ ...mouseSwing, level: PHONE_LEVELS.some((l) => l.id === level) ? level : (mouseSwing.level ?? "beginner") });

// The menu's items the phone leaves out (sim/menu.mjs ids): the PC's bay
// - separate windows and screens, the shot data window, the speed test,
// kept holes, cameras, replays and recording, voice, the Windows app's
// updates and reports, the keyboard's keys - and what a route decides or
// isn't on the phone (the stats page is the PC's: At the range, Send to
// your PC). Online play is on the phone: by code, through the relay
// (sim/pocketserver.mjs).
export const PHONE_MENU_OFF = new Set([
  // Screens: the PC's big screens
  "big-bars",
  // Play
  "welcome",
  "record-video",
  "mouse-swing",
  "key-tips",
  "key-tips-reset",
  "recording",
  // Launch monitor
  "play-mode",
  "monitor-kind",
  "monitor-setup",
  "diagnostics",
  "omni-page",
  // Screens
  "screens",
  "arrange",
  "arrange-game",
  "shot-data",
  "app-window",
  "picture-centre",
  "bay-view",
  "full-screen",
  "speed-test",
  "renderer-test",
  "kept-holes",
  "holes-folder",
  // Cameras and video
  "cameras",
  "swing-replay",
  "save-replay",
  "saved-replays",
  "video-layout",
  "video-rec",
  "limit-clips",
  "limit-sessions",
  "recordings-folder",
  "folders",
  // Sound and voice
  "voice",
  "voice-wake",
  "voice-more",
  // Stats
  "my-stats",
  "practice-plan",
  "warmup",
  "gapping",
  "stats-restart-all",
  // System
  "updates",
  "power",
  "reports",
  "programs",
  "troubleshooting",
  // Keys
  "keys-list",
]);
export const onPhone = (id) => !PHONE_MENU_OFF.has(id);
