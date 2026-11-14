// The Clubhouse: A-Squared Golf's one menu (M, or the Menu button), laid out as
// pages of settings that belong together, every one with a line saying
// what it does. This file is the menu's plan - its pages, their sections
// and each setting's words - with nothing about how any of it is done:
// public/menu.js draws it, and app.js binds each item to what it changes
// (menu.bind). An item nothing is bound to isn't shown (the Windows app's
// own items in a browser, say), so the plan can list everything.
//
// Adding a setting: put it on the page it belongs with here, with a label
// and a line of help (test/menu.test.mjs insists on both), and bind its id
// in app.js. Pure, for the page and the tests.
//
// Kinds of item:
//   action   a button (or several: `buttons`) that does something now
//   toggle   on or off
//   choice   one of a few, as buttons side by side (options, or the
//            binding's own)
//   range    a slider: min, max, step; the binding says it in words
//   number   a number box: min, max, step, unit
//   select   one of many, as a drop-down (the binding's options)
//   custom   drawn by the binding itself (a list of devices, say)
//   note     words only

import { EFFECTS } from "./effects.mjs";
import { SETTINGS as GRAPHICS_SETTINGS, NAMES as GRAPHICS_NAMES } from "./graphics.mjs";

// The graphics settings, each by its name (sim/graphics.mjs NAMES).
const GRAPHICS_OPTIONS = GRAPHICS_SETTINGS.map((value) => ({ value, label: GRAPHICS_NAMES[value] }));

// The menus' and buttons' two styles (Menu, Screens, Menus and buttons):
// New, and Legacy - the look before it, kept to compare (the owner, 25
// October 2026: "Hold current look as legacy view. We can then review and
// decide which one to continue with").
export const UI_STYLES = [
  { value: "new", label: "New" },
  { value: "legacy", label: "Legacy" },
];
export const cleanUiStyle = (style) => (style === "legacy" ? "legacy" : "new");

// Legacy's pages (and every setting's own words, which the new pages share).
export const PAGES = [
  {
    id: "play",
    title: "Play",
    icon: "flag",
    blurb: "Modes, who's hitting and what's kept",
    sections: [
      {
        title: "Where to play",
        items: [
          {
            id: "mode",
            kind: "choice",
            label: "Mode",
            keys: "R  P  C  O  X",
            help: "The driving range, the putting green, the chipping green, a course, or the challenges. Each has its own panel at the side with what's special to it.",
            options: [
              { value: "range", label: "Range" },
              { value: "putting", label: "Putting" },
              { value: "chipping", label: "Chipping" },
              { value: "course", label: "Course" },
              { value: "challenges", label: "Challenges" },
            ],
          },
          { id: "range-session", kind: "action", label: "Range session", help: "With your launch monitor over the phone's Bluetooth, on the range: it connects by itself, and the swing pad goes off. The Session button has each shot and each club's distances. The app always opens in phone play." },
          { id: "phone-play", kind: "action", label: "End range session", help: "Back to phone play: the swing pad on, the launch monitor not looked for - right where you are." },
          { id: "welcome", kind: "action", label: "Welcome and connection check", keys: "W", help: "The first screen again: is the launch monitor talking to A² Golf, and a quick start." },
          { id: "online-play", kind: "action", label: "Online play", help: "Play a course with friends at the same time: one hosts, the others join with the code on the host's screen - from anywhere, on a PC bay or the phone app - or, PC to PC, on the same home network or over Tailscale. Each bay plays its own shots; the balls, scores and the game (stroke play, Stableford, match play, skins) go between them. Opens the Online tab (Online in the top bar), with the online match ladders and the host's rules." },
          {
            id: "online-shots",
            kind: "choice",
            label: "Friends' shots",
            help: "Online, how the other bays' shots fly in here. Together: once your ball is down, the ones waiting fly in at the same time - tee shots struck at once on three bays come in at once. As each lands: each friend's ball flies in the moment it lands at their bay, even while yours is still in the air (or you're mid swing). After your shot: held while someone here is about to swing, and flown in once their ball is down.",
            options: [
              { value: "together", label: "Together" },
              { value: "landed", label: "As each lands" },
              { value: "after", label: "After your shot" },
            ],
          },
        ],
      },
      {
        title: "The round",
        help: "The course round you're playing (online, the course panel's Leave the game instead).",
        items: [
          { id: "round-restart", kind: "action", label: "Restart the round", help: "The same course again from the 1st tee, with the same players and choices. The round so far is kept as far as it went, as leaving a round always keeps it." },
          { id: "round-end", kind: "action", label: "End the round", help: "Finish the round now: its scorecard comes up and its scores are kept as far as it went (a round not finished isn't counted for a season), and the A² Golf video can play." },
          { id: "course-mulligans", kind: "toggle", label: "Mulligans", help: "On, Shift + M takes the last stroke back - the ball where it was, the stroke not counted - to play it again: for a misread, or a shot you'd rather have again. Never in online play or a scramble. The same switch as the course's Options." },
          { id: "round-mulligan", kind: "action", label: "Take a mulligan", keys: "Shift + M", help: "The last stroke taken back and played again, with Mulligans on - in the air or come to rest, until the next stroke or the next hole." },
        ],
      },
      {
        title: "The A² Golf video",
        help: "A² Golf showing itself off in one video of about two minutes: it plays itself - every kind of hole, a hole in one, four friends online and the course designer - and records itself into the recordings folder. Nothing it does is kept in anyone's stats or settings, and nothing goes online. Esc stops it.",
        items: [{ id: "record-video", kind: "action", label: "Record the A² Golf video", help: "It starts at once, and the game puts itself back as it was at the end. Or say \"record the show reel\"." }],
      },
      {
        title: "Without a launch monitor",
        help: "Play with the mouse or a game controller instead - for trying things out, or friends who don't have a launch monitor (or don't really play golf). It works everywhere a launch monitor does: the range, the greens, the course, the challenges and online play. Every club has its own distance at your level: a full swing (100%) carries it, a 90% swing 90% of it, and an overswing goes to 105% - a little further, and wilder every percent past 100.",
        items: [
          { id: "mouse-swing", kind: "toggle", label: "Mouse swing", help: "A swing pad on the screen: press the ball, pull down (the further, the bigger the swing - the gold line is a full swing, the orange one 105%), then push back up through the ball. As you pull, it shows the swing's size and how far it carries. Straight up and down goes straight; finishing to one side starts it that way, and a slanted push curves it. Shot opens the shot setup. Works with a finger on a touch screen too. Mouse swings are kept as experimental shots: out of everyone's stats." },
          { id: "controller", kind: "toggle", label: "Game controller", help: "An Xbox or PlayStation controller, plugged in or by Bluetooth: the right stick swings - pull it back (a full swing just short of the edge, 105% right at it), then push it up through the middle; through off to one side starts it that way, and a slanted push curves it, and back about three times as long as through is a smooth rhythm. Y is the shot setup (shape, height, spin), the left stick aims, LB and RB change club, A is OK, B goes back, X next, Menu the menu, View every action - and in the menu or on a card the D-pad moves round and A presses. Its swings are kept as experimental shots, as mouse swings are." },
          { id: "controller-rumble", kind: "toggle", label: "Controller rumble", help: "A tap of rumble as the stick reaches a full swing (100%), and a stronger one at 105%." },
          { id: "swing-level", kind: "select", label: "Level", help: "For the mouse's and the controller's swings, for anyone without their own (Saved players gives each their own). Beginner: two lines on the pad - the flag's on the flat and where to stop for the shot as it plays (wind, slope, the air, the lie) - near enough counts, a wobble's forgiven, putts read for you, drives of 180 to 220 yards. Amateur: the two lines, near enough counts, putts' pace marked, rhythm counts a little, drives of 213 to 260. Pro: your own distances and reads, rhythm counts, pulling past a full swing costs, drives of 245 to 300. Tour: every fault shows, rhythm counts a lot, overdoing it costs dearly, drives of 262 to 320. (Drives with roll, further with Power skill points.) Custom: the help picked below." },
          { id: "swing-climb", kind: "toggle", label: "Move up a level by itself", help: "After two good rounds on the course at your level (nine holes or more, finished, close to par - Beginner about a third of a shot a hole over, Amateur a sixth, Pro level par), you move up one: Beginner to Amateur to Pro to Tour, a little harder each time. Back down any time with Level. Off, the level stays as you set it." },
          { id: "skills", kind: "action", label: "Skill points", help: "Each player's skill points for the swing pad and a controller, earned from rounds and challenges played with them and spent on what to be better at: Power (further, within your level's distances), Accuracy, Curve control, Consistency, Feel, Tempo, Strike, Trajectory, Short game, Putting, Recovery. 75 at most and they get far harder past 60, so no one fills them all. Moving points is free below level 5, then once a season." },
          { id: "swing-custom-faults", kind: "range", label: "Custom: how much a crooked swing shows", min: 0.25, max: 2.5, step: 0.05, help: "The Custom level's: 0.25 as forgiving as Beginner, 0.5 Amateur, 1.35 Pro, 2 Tour, 2.5 harsher still." },
          { id: "swing-custom-mark", kind: "toggle", label: "Custom: the flag's mark", help: "The Custom level's: two lines on the swing pad - a white one for the flag on the flat and a blue one where to stop for the shot as it plays." },
          { id: "swing-custom-snap", kind: "toggle", label: "Custom: close enough counts", help: "The Custom level's: a swing within a few percent of the flag's mark is taken as the mark." },
          { id: "swing-custom-putt", kind: "select", label: "Custom: putts", help: "The Custom level's: the line read and the pace marked for you, only the pace marked, or neither." },
          { id: "swing-custom-tempo", kind: "select", label: "Custom: rhythm", help: "The Custom level's: how much the swing's rhythm counts - back about three times as long as through is pure; off it, it loses distance and goes more crooked." },
          { id: "swing-custom-drive", kind: "select", label: "Custom: distances", help: "The Custom level's: which level's distances it plays - each level's drives, carry and roll, from none of the Power skill to all of it (Beginner 180 to 220 yards, Tour 262 to 320), the rest of the bag with them." },
        ],
      },
      {
        title: "Who's hitting",
        help: "Shots go in the stats of whoever's hitting. On the course and in the challenges the players take turns by themselves - their names are on those panels.",
        items: [
          { id: "hitter", kind: "select", label: "Hitting now", keys: "U", help: "Whose shots these are on the range and the greens - or say \"Anna hitting\". Change who's playing from here too." },
          { id: "accounts", kind: "action", label: "Signed in", help: "Who's signed in on this computer or phone, switching to another, signing someone else in, and signing out - also by clicking the player's name. With Google, a player's stats and players go with them to the phone and the web, kept in their own Google Drive; with an email they stay on this device." },
          { id: "players", kind: "action", label: "Who's playing", help: "Who's playing now, up to eight: saved players and guests. A guest's shots play as anyone's but go in nobody's stats. The same players on the range, the greens, the course and the challenges. Clicking who's hitting on the game screen opens it too." },
          { id: "saved-players", kind: "action", label: "Saved players", help: "Everyone who keeps stats here: a name, a colour, which hand they play with, a handicap index, their level with the mouse or a controller, and simple play for young children. Renaming someone takes their stats with them." },
          { id: "ask-players", kind: "toggle", label: "Ask who's playing at the start", help: "When the game starts (not on a reload), the Who's playing card comes up - Skip plays as a guest; changing game with more than one playing just checks yes or no. Off, it starts with whoever played last." },
        ],
      },
      {
        title: "Key tips",
        help: "Now and then a tip over the picture shows a key that helps with what you're doing - I on the green, J after a hole - until you've seen enough of it.",
        items: [
          { id: "key-tips", kind: "toggle", label: "Key tips", keys: "K", help: "A tip now and then: a key and what it does right now, for a few seconds. K (or its button) stops that one showing again; every other still comes round in turn." },
          { id: "key-tips-reset", kind: "action", label: "Show every tip again", help: "Brings back the tips you've stopped, and starts them from the beginning." },
        ],
      },
      {
        title: "What's kept",
        items: [
          {
            id: "recording",
            kind: "choice",
            label: "Keeping the shots",
            keys: "Shift + R",
            help: "Practice counts every shot. Round counts it as round play (a course round always is). Experimental keeps shots out of every number, tip and club check - for trying things, or friends having a go. Not recording keeps nothing. Back to Practice each new day.",
          },
        ],
      },
    ],
  },
  {
    id: "flight",
    title: "Ball flight",
    icon: "arc",
    blurb: "How far the ball goes, the wind and the air",
    sections: [
      {
        title: "Carry",
        help: "A² Golf flies each shot from the launch monitor's ball speed, launch, direction, spin and spin axis.",
        items: [
          { id: "carry-percent", kind: "range", label: "Carry adjustment", min: -10, max: 12, step: 0.5, help: "0 is A² Golf's own flight - leave it there unless you want every club to go a little further or shorter: +3.5% carries a 230 yd drive about 238. Online, the other bays see it, and the host can have everyone play A² Golf's own." },
        ],
      },
      {
        title: "Weather on the course",
        help: "Each round rolls its own weather from these when it starts - the wind from any direction, gusting a little shot to shot, the same for every hole. The wind carries the ball as it does outside, more the higher it flies; the course shows it with an arrow, and what the distance plays like.",
        items: [
          { id: "course-wind", kind: "select", label: "Wind", help: "Calm, breezy (6 - 12 mph), windy (12 - 20), strong (20 - 30), or any - a surprise each round." },
          { id: "course-temp", kind: "select", label: "Temperature", help: "Warm air is thinner and carries further - a yard or so on a drive for every 2 °C." },
          { id: "course-sky", kind: "select", label: "Sky", help: "Clear, fair (sunny spells), cloudy, overcast, showers, rain, a misty morning, or any. Only a look - except that a round of rain or showers plays with soft fairways (a shorter run-out), and says so when it starts." },
          { id: "course-time", kind: "select", label: "Time of day", help: "Morning, midday, afternoon or late afternoon (done by dusk), from the clock, or any - a surprise each round. The clock moves on about 15 minutes a hole, the sun with it; a round that would end in the dark starts earlier. Only a look." },
          { id: "course-altitude", kind: "number", label: "Altitude", min: 0, max: 3500, step: 50, unit: "m", help: "How high the course is: thinner air higher up, about 1% more carry every 150 m. 0 for sea level." },
          { id: "course-humidity", kind: "number", label: "Humidity", min: 0, max: 100, step: 5, unit: "%", help: "Humid air is a little thinner: on a warm day at 100%, about a yard more on a drive. 0 for dry air, as before." },
        ],
      },
      {
        title: "Weather on the range",
        help: "The range flies in the air set here. Windy shots are kept, but out of the club's numbers - their carry isn't the club's.",
        items: [
          { id: "range-wind", kind: "number", label: "Wind", min: 0, max: 40, step: 1, unit: "mph", help: "0 for none. It gusts a little shot to shot." },
          { id: "range-wind-from", kind: "select", label: "Wind from", help: "Where it comes from, as you stand on the mat." },
          { id: "range-sky", kind: "select", label: "Sky", help: "Clear, fair, cloudy, overcast, showers, rain or a misty morning: only a look - the Ground setting is how it plays." },
          { id: "range-time", kind: "select", label: "Time of day", help: "Morning, midday, afternoon or late afternoon, from the clock, or any - a surprise each visit. Only a look." },
          { id: "temperature", kind: "number", label: "Temperature", min: -10, max: 45, step: 1, unit: "°C", help: "About 1 yard more carry on a drive for every 2 °C warmer." },
          { id: "altitude", kind: "number", label: "Altitude", min: 0, max: 3500, step: 50, unit: "m", help: "Thinner air higher up: about 1% more carry every 150 m." },
          { id: "humidity", kind: "number", label: "Humidity", min: 0, max: 100, step: 5, unit: "%", help: "Humid air is a little thinner: on a warm day at 100%, about a yard more on a drive. 0 for dry air, as before." },
        ],
      },
    ],
  },
  {
    id: "greens",
    title: "Greens",
    icon: "green",
    blurb: "Putting help, gimmes and green speeds",
    sections: [
      {
        title: "Reading the putt",
        help: "The same on the putting green and on the course's greens.",
        items: [
          {
            id: "putt-line",
            kind: "choice",
            label: "Ideal line",
            keys: "T",
            help: "The line the putt should have rolled on. After each putt shows it once you've hit; Before and after shows it at address too.",
          },
          { id: "plays-like", kind: "toggle", label: "Say what it plays like before the putt", help: "\"Plays like 23 ft\" before you hit, as well as after. Off, it's only said after the putt - so you read it yourself first." },
          { id: "course-grid", kind: "toggle", label: "Grid on the course's greens", help: "Lines across the green with dots that roll the way it slopes - the colour is how steep, the pace how fast." },
          { id: "grid-colours", kind: "toggle", label: "Colours on the grid", help: "The grid's dots coloured by how steep the green is under them, on the course and the putting green. Off, they're plain white - the lines and the dots' pace show the slopes on their own." },
          { id: "course-shade", kind: "toggle", label: "Slope shading on the course's greens", help: "The green tinted by how steep it is, faint outside the putt's channel." },
          { id: "course-grain", kind: "toggle", label: "Grain on the course's greens", help: "Each green's grass lies one way: down-grain putts run a touch quicker, into it slower, and the green looks lighter down-grain, darker into it." },
          { id: "course-pins", kind: "choice", label: "Pin positions", help: "Each hole's own pin, or the cups cut somewhere new every day - the same for everyone playing that day." },
        ],
      },
      {
        title: "Putting green",
        help: "The practice green from here as well as from its panel - and from the mat: N a new random green, ← → the aim, or say \"flat green\", \"breaks right two percent\", \"putt from fifteen feet\", \"aim left two cups\".",
        items: [
          { id: "putt-distance", kind: "select", label: "Distance", help: "How far the putt is. The panel can roll a random one between two limits each putt instead." },
          { id: "putt-uphill", kind: "select", label: "Up / down hill", help: "The green's overall rise or fall from the ball to the hole, per cent." },
          { id: "putt-side", kind: "select", label: "Side slope", help: "Which way it breaks, and how much. Over about 3% a real pin wouldn't be cut." },
          { id: "putt-contours", kind: "select", label: "Contours", help: "Humps and hollows along the putt, so the break changes as it rolls - or a plain tilted plane." },
          { id: "putt-severity", kind: "choice", label: "Random green", help: "How steep a new random green (N) may be: flat, gentle (to 1%), moderate (to 2%), severe (2 - 3%, always some break), or any of those." },
          { id: "putt-random", kind: "action", label: "New green", keys: "N", help: "A new random green within that limit (and a new distance, with a random distance set) - or a flat one." },
          { id: "putt-next", kind: "select", label: "After each putt", help: "The same green again, a new random one, or up the ladder of distances." },
          { id: "putt-cup", kind: "select", label: "Cup", help: "A regulation hole, a double one for confidence, or a small one for precision." },
          { id: "putt-aim", kind: "action", label: "Aim off the mat", keys: "← →", help: "Turn where the mat points, as on the course: the hole moves on the screen and the ball starts where the mat points plus your stroke. A cup is the hole's width at the hole; At the read sets it where the ideal line says. A new green aims straight at the hole again." },
        ],
      },
      {
        title: "On the course",
        items: [
          {
            id: "gimme",
            kind: "choice",
            label: "Gimmes",
            help: "Putts this close are given - counted as holed with one more stroke.",
            options: [
              { value: 0, label: "None" },
              { value: 2, label: "2 ft" },
              { value: 3, label: "3 ft" },
              { value: 4, label: "4 ft" },
              { value: 5, label: "5 ft" },
              { value: 6, label: "6 ft" },
            ],
          },
          { id: "course-lookdown", kind: "toggle", label: "Look down each hole", help: "As each hole starts, a short look from behind the tee over the landing area to the green, in place of the usual short wait - it shows hazards you can't see from the tee. A shot, Esc or J cuts it short. Never in the Challenges." },
          { id: "course-hole-card", kind: "toggle", label: "Scorecard after each hole", help: "Once a hole's done, the round's scorecard over the picture for 10 seconds, then the next hole (N sooner) - the next hole finishes loading behind it, so it's ready when it comes. Off, straight on to the next hole." },
          { id: "course-cart-ride", kind: "toggle", label: "Ride the cart to the next tee", help: "With the scorecard after each hole on: a cart waits by the green, the camera gets in and looks up at the screen under its roof - the scorecard on it, the course round it blurred - as it drives to the next tee along the cart paths, parking beside it, and the next hole finishes loading. Next hole once it's ready, or Watch the drive to follow the cart first. Off, the scorecard over the picture for 10 seconds." },
          { id: "course-flyover", kind: "toggle", label: "Flyover after each hole", help: "Once the hole's celebration is over, the camera follows the ball from the tee through every stroke by itself, then the next hole. Esc, J or a shot skips it. Off, J (or the card) plays it when you want it." },
        ],
      },
      {
        title: "Green speed",
        help: "Each green has its own speed (a stimp: how many feet a ball rolls off the stimpmeter). Club greens run about 8-9, tour greens 12-13.",
        items: [
          { id: "stimp-putting", kind: "range", label: "Putting green", min: 7, max: 14, step: 1, help: "Practice and the distance challenge." },
          { id: "stimp-chipping", kind: "range", label: "Chipping green", min: 7, max: 14, step: 1, help: "Where the chips land and run out." },
          { id: "stimp-course", kind: "range", label: "Course greens", min: 8, max: 13, step: 1, help: "Every green on every course." },
        ],
      },
    ],
  },
  {
    id: "monitor",
    title: "Launch monitor",
    icon: "signal",
    blurb: "Your launch monitor, connecting and checking",
    sections: [
      {
        title: "Your launch monitor",
        help: "The Square Omni connects by itself over Bluetooth. Most others send their shots through their own app or a community connector - A² Golf answers it.",
        items: [
          {
            id: "play-mode",
            kind: "choice",
            label: "Play on this phone with",
            help: "The Android app: the touch screen (the swing pad's on - swing with a finger, no launch monitor looked for) or a launch monitor (found over the phone's Bluetooth and connected by itself). Asked the first time the app starts; it's kept, and this changes it.",
            options: [
              { value: "touch", label: "Touch screen" },
              { value: "monitor", label: "Launch monitor" },
            ],
          },
          {
            id: "monitor-kind",
            kind: "select",
            label: "Launch monitor",
            help: "Which launch monitor you have: the steps below are for it. Any but the Omni turns A² Golf's own Bluetooth link to the Omni off.",
          },
          { id: "monitor-setup", kind: "custom", label: "Setting it up", help: "How its shots get into A² Golf, step by step, with this PC's address and the port to use - and what it measures." },
        ],
      },
      {
        title: "Connection",
        items: [
          { id: "connection", kind: "custom", label: "Now", help: "Whether the launch monitor is talking to A² Golf." },
          { id: "diagnostics", kind: "action", label: "Connection diagnostics", help: "Every message from the launch monitor as it arrives, and the log to send when something's wrong." },
          { id: "omni-page", kind: "action", label: "Omni over Bluetooth, in a browser", help: "Connect the Omni from a browser page, when not using the Windows app." },
        ],
      },
      {
        title: "Square Omni",
        help: "A² Golf finds the Omni and connects by itself over Bluetooth - nothing else to install or start.",
        items: [{ id: "omni", kind: "custom", label: "Bluetooth", help: "Connect over Bluetooth, and which device is your Omni." }],
      },
    ],
  },
  {
    id: "screens",
    title: "Screens",
    icon: "screens",
    blurb: "Windows, the picture and how it looks",
    sections: [
      {
        title: "Menus and buttons",
        items: [
          {
            id: "ui-style",
            kind: "choice",
            label: "Menus and buttons",
            help: "New: the menu's pages sorted by subject (Play, Players, Swing pad, Graphics, Help...), bigger buttons, and each setting's line short with More for the rest - on the phone a page at a time, sized for a thumb, and a cleaner top bar. Legacy: the menus and buttons as they were, to compare or to keep.",
            options: UI_STYLES,
          },
          { id: "big-bars", kind: "toggle", label: "Bigger top bar and side panel", help: "On a screen bigger than 1080p (1440p, or 4K at Windows' 100%) the top bar and the side panel are drawn larger, as the menu is there. Off, they stay the screen's own size - small on a 4K screen. Only shown on such a screen." },
        ],
      },
      {
        title: "Windows",
        items: [
          { id: "screens", kind: "toggle", label: "Separate windows", keys: "Shift + D", help: "The game on one screen (the projector) and the controls and menus in a window of their own (the laptop)." },
          { id: "arrange", kind: "action", label: "Arrange this window", keys: "Shift + B", help: "Move and size the controls window's boxes, and keep part of a window blank - where a webcam hangs in front of the screen, say." },
          { id: "arrange-game", kind: "action", label: "Arrange the game screen", keys: "Shift + B", help: "Move and size the words and numbers over the picture - the club and connection, the note, the lie's and the putt's guidance, the shot's numbers, the messages, the hole map - by dragging them on the game screen (bay view). Its blank area is a button there." },
          { id: "shot-data", kind: "action", label: "Shot data window", help: "Club path and face, strike, spin, flight and this session's shots - put it on a second screen." },
          { id: "app-window", kind: "custom", label: "The app's window", help: "Full screen with no frame, starting in bay view, and the shot data window by itself on the second monitor." },
        ],
      },
      {
        title: "The picture",
        items: [
          { id: "picture-centre", kind: "range", label: "Picture centre", min: -45, max: 45, step: 1, keys: "[  ]", help: "Moves the ball and the target line left or right of the screen's middle - for hitting down one side of the net. Up to nearly off the edge." },
          { id: "bay-view", kind: "toggle", label: "Bay view", keys: "B", help: "Full screen with the numbers laid over the picture, big enough to read from the mat." },
          {
            id: "side-pin",
            kind: "toggle",
            label: "Side panel pinned open",
            help: "The panel at the side (each mode's settings) stays open while you play. Off, it folds away by itself when you hit - the picture the whole width, the shot's numbers over it - and the tab on the picture's right edge opens it again (its pin does the same as this).",
          },
          {
            id: "bar-pin",
            kind: "toggle",
            label: "Top bar always shown",
            help: "Off (the first), the phone's top bar slides away while you play, for the whole picture - tap the tab near the top of the screen (or pull down on it) and it's back for a few seconds. On, it stays, above the picture rather than over it.",
          },
          {
            id: "phone-turn",
            kind: "select",
            label: "Turns with the phone",
            help: "The phone held sideways, the swing pad and the buttons are at the picture's sides; held upright, the picture's at the top and they're under it, under your thumb. As the phone's held (the first), the game turns as you turn it; Sideways only or Upright only keep it that way however the phone's held - so a tilt while you swing never turns it.",
          },
          { id: "camera-follow", kind: "toggle", label: "Camera follows the ball", keys: "V", help: "Off, the camera stays put behind you and watches the ball go." },
          { id: "full-screen", kind: "action", label: "Full screen", keys: "F", help: "The game window full screen, or back to a window." },
          {
            id: "celebration-effects",
            kind: "toggle",
            label: "Celebration effects",
            help: "Confetti, streamers, confetti cannons and fireworks round the flag for a birdie or better, and a sparkle round the cup for a par - on the course, the greens and the challenges. Off: just the score in big letters and the crowd cheering, with no other sounds - no fireworks, chimes or fanfares.",
          },
        ],
      },
      {
        title: "How it looks",
        items: [
          {
            id: "graphics",
            kind: "choice",
            label: "Graphics",
            keys: "G",
            help: "Low draws the grass, trees and shadows in full; Standard adds trees in 3D further out, more woods in the distance and long grass round the ball; Medium grows the long grass fuller and further out, for a faster graphics card; Very low is lighter, for a slower PC. (Until November 2026 these were Standard, Medium, High and Ultra - the same pictures under new names, with room above for a new High and Ultra.) A² Golf reloads to change it.",
            options: GRAPHICS_OPTIONS,
          },
          {
            id: "graphics-fixed",
            kind: "toggle",
            label: "Don't adjust automatically",
            help: "Keeps the graphics exactly as chosen, however slow the picture gets - except while recording, when a picture that stays slow is eased between shots (it says so) and put back when the recording stops, as a recording at a slow picture can stall the graphics card. Off, the game turns detail down by itself between shots while the picture is slow for your screen - Medium down to Standard, Standard down to Low, then less - and back up when there's room. It aims at your screen's refresh rate, up to 60 frames a second, measured the first time on each screen.",
          },
          {
            id: "graphics-highest",
            kind: "choice",
            label: "Highest graphics",
            help: "The highest setting the game uses: G and the automatic switching never go above it. Lower than the setting chosen, it brings it down.",
            options: GRAPHICS_OPTIONS,
          },
          { id: "light-tufts", kind: "toggle", label: "Lighter long grass round you", help: "On trial: the long grass within a few metres of you drawn a third lighter - each blade bent in two pieces, not three. It should look the same; switch it off and on standing in the rough to compare, and leave it off if the blades look stiffer. Medium graphics and up." },
          { id: "frame-rate", kind: "toggle", label: "Show the frame rate", keys: "Shift + F", help: "Frames a second in the corner of the picture. Click it (or tap it) for the rest - the frame time, the slowest frame lately, what each frame draws, the picture's size and the setting - and again for just the frame rate." },
          {
            id: "speed-test",
            kind: "action",
            label: "Speed test",
            help: "The same fly-throughs over three kinds of hole - parkland, links by the sea and a mountain hole - at each setting, Very low to Medium, for one score each: how many frames a second this PC can draw them, and the slowest moment. A² Golf reloads for each setting and comes back as it was; about four minutes. Esc stops it.",
          },
          {
            id: "renderer-test",
            kind: "action",
            label: "WebGPU test",
            help: "The same 20-second flight round the driving range drawn three ways - WebGL, as the game is drawn today, and the new WebGPU renderer on WebGL 2 and on WebGPU - for each one's frames a second and a picture of it, to see what WebGPU would do on this PC. The new renderer draws the whole range as WebGL does, the screen's effects too. A² Golf reloads for each and comes back as it was; about two minutes. Esc stops it.",
          },
          {
            id: "kept-holes",
            kind: "action",
            label: "Holes kept for loading",
            help: "Each hole is kept on this PC (or phone) once it's been built - the shape of its ground and its grass - so playing it again loads in a fraction of the time, with no pauses while the next hole is got ready. On a PC every course's first hole is kept ahead, in the quiet moments, so the course selection screen's flyover is quick; it's kept for good. Kept for each graphics setting; a new version of A² Golf builds each hole afresh once. Up to 3 GB (500 MB on the phone), the least lately played going first (courses' first holes last). Clearing them is safe: each is built again when it's next needed.",
          },
          {
            id: "holes-folder",
            kind: "action",
            label: "Holes kept in",
            help: "The folder the holes kept for loading go in - choose one on another drive to keep the room on this one. Those kept already move there.",
          },
          {
            id: "still-picture",
            kind: "toggle",
            label: "Rest the picture while nothing moves",
            help: "Stops drawing the picture while nothing in it moves - between shots, the camera still - which keeps the graphics card cool and quiet. The flag, the trees and the water stop with it; anything that happens (a shot, a key, a click) starts it again at once. Off: drawn all the time.",
          },
        ],
      },
      {
        title: "Picture effects",
        help: "The finish on the picture, each with its own switch. When the picture is slow the game drops the far blur, the bloom and the ambient occlusion first, by itself.",
        items: [
          {
            id: "effects-preset",
            kind: "choice",
            label: "Effects",
            help: "Default turns every effect on. Performance turns off the three heavier ones - ambient occlusion, bloom and the far blur - for a slower PC; on the phone, where it starts, it also leaves out the sharp ground textures, grass all over the hole, the finer leaves and wet-ground shine, too fine for its screen. Or switch each one below.",
            options: [
              { value: "default", label: "Default" },
              { value: "performance", label: "Performance" },
            ],
          },
          ...EFFECTS.map((e) => ({ id: `effect-${e.id}`, kind: "toggle", label: e.label, help: e.help })),
        ],
      },
    ],
  },
  {
    id: "video",
    title: "Cameras & video",
    icon: "camera",
    blurb: "Webcams, replays and recording",
    sections: [
      {
        title: "Cameras and replays",
        help: "Webcams as boxes in the controls window, live, with each shot's replay. A webcam opens in one program at a time: close it in any other program first.",
        items: [
          { id: "cameras", kind: "action", label: "Cameras and replays", help: "Choose the webcams, turn and crop them, and set the instant replay and the swing replay." },
          { id: "swing-replay", kind: "action", label: "Swing replay on the game window", keys: "Q", help: "The last shot's replay big on the projector, a few times round. Or say \"replay\"." },
          { id: "save-replay", kind: "action", label: "Save the last replay", keys: "Shift + S", help: "A replay is kept only until the next shot unless it's saved." },
          { id: "saved-replays", kind: "action", label: "Every saved replay", help: "Every replay you've saved, newest first, each shot with all its angles: watch them side by side, or delete what you don't want." },
        ],
      },
      {
        title: "Video recording",
        help: "Record videos to share, with no other software: the game, your cameras and the shot data laid out as you like, scenes that change with the mode and the shot, the game's sound and a microphone.",
        items: [
          { id: "video-layout", kind: "action", label: "Recording layout and scenes", help: "What goes where in the video: add cameras, the shot numbers, the flight path; scenes for each mode, before and after the shot, and the end of a round." },
          { id: "video-rec", kind: "toggle", label: "Recording now", keys: "Shift + V", help: "Starts and stops the video. Say \"start filming\" or \"stop filming\" too." },
        ],
      },
      {
        title: "Disk space",
        help: "When either is full, the oldest are deleted first to make room. A replay not saved never counts; a recording marked Keep is never deleted.",
        items: [
          { id: "limit-clips", kind: "number", label: "Saved clips up to", min: 0.5, max: 500, step: 0.5, unit: "GB", help: "The cameras' saved replays." },
          { id: "limit-sessions", kind: "number", label: "Recordings up to", min: 0.5, max: 500, step: 0.5, unit: "GB", help: "The video recorder's recordings." },
          { id: "recordings-folder", kind: "action", label: "Recordings and replays saved in", help: "The folder the video recordings go in, with the cameras' replays in a replays folder inside it - choose one on another drive for big files. Those already made stay where they are." },
          { id: "folders", kind: "action", label: "Folders", help: "Where the clips and recordings are kept." },
        ],
      },
    ],
  },
  {
    id: "sound",
    title: "Sound & voice",
    icon: "sound",
    blurb: "Volumes, celebrations and talking to A² Golf",
    sections: [
      {
        title: "Sound",
        items: [
          { id: "sound-on", kind: "toggle", label: "Sound", keys: "A", help: "Every sound on or off." },
          { id: "celebrations", kind: "toggle", label: "Celebrations", help: "Cheers and claps for a holed putt, a birdie or a best - on the course, the greens and the challenges." },
          { id: "sound-settings", kind: "action", label: "Volumes and background", keys: "Shift + A", help: "Volume, the shots' and the background's; wind, birds, water and rain; your own recordings." },
        ],
      },
      {
        title: "Voice",
        items: [
          {
            id: "voice",
            kind: "toggle",
            label: "Listen for voice commands",
            keys: "L",
            help: "Say the wake word first, then the command: \"Caddie, seven iron\" changes club; \"Caddie, last shot seven iron\" says the shot just hit was the 7 iron, \"Caddie, last shot mishit\" (or good, thin, fat, misread) how it went. While something asks - \"Your 7 iron flew like a driver - the driver?\" - answer it with no wake word: \"yes\", \"no\", \"eight iron\", \"mishit\". Done at once; Z or \"undo\" takes it back.",
          },
          {
            id: "voice-wake",
            kind: "choice",
            label: "Wake word",
            help: "The word said before every command, as \"OK Google\" or \"Alexa\" are - so talk in the bay never changes anything. Said on its own, the next thing said is the command. Off: commands are heard any time, as before (\"club picked seven iron\").",
          },
          {
            id: "voice-more",
            kind: "toggle",
            label: "More voice commands",
            help: "Off, voice is just for clubs, the last shot and answering what's asked - fewer phrases to listen for, so it hears you right first time more often. On, it also takes notes (\"Caddie, shot note\", then the note), a swing's power (\"power next fifty\"), a punch next, replays (\"replay\", \"save that\"), the video recorder's scenes and filming, recording formats, the putting green (\"putt from fifteen feet\") and who's hitting (\"Alex hitting\") - each asked about first (say \"confirm\").",
          },
        ],
      },
    ],
  },
  {
    id: "stats",
    title: "Stats",
    icon: "chart",
    blurb: "Every club, game and tip",
    sections: [
      {
        title: "Your numbers",
        items: [
          { id: "my-stats", kind: "action", label: "My stats", help: "Every club's carry and spread, games, bests and tips, for each player." },
          { id: "round-card", kind: "action", label: "Round card", help: "The last finished course round on one card - the scorecard, the score and net, the handicap differential, fairways, greens and putts, strokes gained and the shot of the round - to save or copy as a picture. It shows by itself after a round; My stats has one for every round." },
          {
            id: "practice-plan",
            kind: "action",
            label: "Practice plan",
            help: "Ten scored shots at one part of your game. My weak spot picks the part your stats say costs you most strokes (against your handicap) - or pick one: drives down the middle, an approach combine at 50-100, 100-150, 150-200 or 200+ yds, chips from 10-30 yds, or putts short, makeable or long. The score is kept in My stats with its trend.",
          },
          {
            id: "warmup",
            kind: "action",
            label: "Warm-up",
            help: "Before you play: 5 balls to loosen up (not kept in your stats), then 5 drivers, 5 with a long iron, 5 with a short iron, 5 with a wedge and 5 more drivers on the range - A² Golf picks each club in turn, a different long iron, short iron and wedge each warm-up - and 10 putts on the practice green to finish. N skips ahead on the range.",
          },
          {
            id: "gapping",
            kind: "action",
            label: "Gapping session",
            help: "On the range: five good balls with every club, wedges first. A² Golf picks each club in turn and moves on by itself - a thin or fat one doesn't count, so hit again - and at the end shows the carries side by side with any big gaps or overlaps. My clubs: the ones in your stats; Every club: the whole bag. N skips a club you don't carry. The shots fill the gapping chart in My stats.",
          },
          { id: "stats-restart-all", kind: "action", label: "Start everyone's stats again", help: "Moves every player's stats into the archive and starts them from nothing. Nothing is deleted: My stats, Archived stats, brings anyone's back." },
        ],
      },
    ],
  },
  {
    id: "news",
    title: "What's new",
    icon: "news",
    blurb: "What changed in this version, every version since 3.0, and the licence",
    sections: [
      {
        title: "Version history",
        items: [
          { id: "version-history", kind: "custom", label: "What's new", help: "This version's changes at the top, and the versions before it below - tap one to open or close it." },
          { id: "app-update", kind: "action", label: "Check for updates", help: "Whether a newer A² Golf for Android is out, asked now. The app looks by itself too, as it opens and when you come back to it - at most once an hour." },
        ],
      },
      {
        title: "About",
        items: [{ id: "legal", kind: "custom", label: "Licence, privacy and credits", help: "The licence agreement, what the game keeps and sends, and the people whose work it's built with." }],
      },
    ],
  },
  {
    id: "system",
    title: "System",
    icon: "gear",
    blurb: "Updates, reports, programs and the PC",
    sections: [
      {
        title: "A² Golf",
        items: [
          { id: "updates", kind: "custom", label: "Updates", help: "Checks when A² Golf starts and every half hour; tick Beta versions for each new version as soon as it's built. Go back to the version you had before if a new one gives trouble." },
          { id: "power", kind: "custom", label: "Quit, restart or shut down", help: "Quit closes A² Golf, asking first (it's also under this menu's pages, and the power button at the right of the top bar); or restart or shut down the PC." },
        ],
      },
      {
        title: "Feedback",
        help: "A problem, or an idea: saved as a report on this PC, and posted by you on the support page.",
        items: [{ id: "feedback", kind: "custom", label: "Feedback", help: "Saves a report with your note and opens the support page to post it - nothing is sent until you post it." }],
      },
      {
        title: "Reports to Claude",
        help: "A report has your note, the connection log, settings, screens and recent errors - never the token.",
        items: [{ id: "reports", kind: "custom", label: "Reports", help: "Send a problem straight to the developer, or have them sent automatically." }],
      },
      {
        title: "Programs",
        help: "Other programs to start with A² Golf. A connector (one that speaks Open Connect) is only needed with Bluetooth off.",
        items: [{ id: "programs", kind: "custom", label: "Programs", help: "Start them with A² Golf, now, or add one." }],
      },
      {
        title: "Troubleshooting",
        items: [{ id: "troubleshooting", kind: "custom", label: "When something's stuck", help: "Reload the picture, get to other windows or the desktop, or open the shot logs." }],
      },
    ],
  },
  {
    id: "keys",
    title: "Keys",
    icon: "keys",
    blurb: "Every keyboard shortcut",
    sections: [{ title: "Keys", items: [{ id: "keys-list", kind: "custom", label: "Every key", keys: "H", help: "The keyboard shortcuts, anywhere in A² Golf." }] }],
  },
];

// The new style's pages: the same settings - each the very item above, on
// one page only - sorted so each page is one subject, in three groups down
// the rail. Play's mix is split up (the round and online play stay; who's
// playing, the swing pad and the help each get a page; the game's video
// goes to Cameras & video; the course's between-hole choices come over from
// Greens), and Screens' graphics are a page of their own.
const ITEM = Object.fromEntries(PAGES.flatMap((p) => p.sections.flatMap((s) => s.items.map((i) => [i.id, i]))));
const SECTION = Object.fromEntries(PAGES.flatMap((p) => p.sections.map((s) => [s.title, s])));
const PAGE = Object.fromEntries(PAGES.map((p) => [p.id, p]));
const items = (...ids) => ids.map((id) => ITEM[id]);

export const NEW_PAGES = [
  {
    id: "play",
    group: "Play",
    title: "Play",
    icon: "flag",
    blurb: "Where to play, the round and online play",
    sections: [
      { title: "Where to play", items: items("mode", "range-session", "phone-play") },
      SECTION["The round"],
      { title: "Between holes", help: "On a course, as one hole ends and the next begins.", items: items("course-lookdown", "course-hole-card", "course-cart-ride", "course-flyover") },
      { title: "Online play", items: items("online-play", "online-shots") },
    ],
  },
  {
    id: "players",
    group: "Play",
    title: "Players",
    icon: "people",
    blurb: "Who's playing, who's hitting and what's kept",
    sections: [SECTION["Who's hitting"], SECTION["What's kept"]],
  },
  {
    id: "swing",
    group: "Play",
    title: "Swing pad & controller",
    icon: "pad",
    blurb: "Playing without a launch monitor, and your level",
    sections: [SECTION["Without a launch monitor"]],
  },
  { ...PAGE.flight, group: "Play" },
  {
    ...PAGE.greens,
    group: "Play",
    blurb: "Putting help, the practice green, gimmes and green speeds",
    sections: [SECTION["Reading the putt"], SECTION["Putting green"], { title: "Gimmes", items: items("gimme") }, SECTION["Green speed"]],
  },
  { ...PAGE.monitor, group: "Set up" },
  {
    id: "screens",
    group: "Set up",
    title: "Screens",
    icon: "screens",
    blurb: "Windows, the picture and the menus",
    sections: [SECTION["Menus and buttons"], SECTION["Windows"], SECTION["The picture"]],
  },
  {
    id: "graphics",
    group: "Set up",
    title: "Graphics",
    icon: "eye",
    blurb: "Detail, speed and the picture's effects",
    sections: [SECTION["How it looks"], SECTION["Picture effects"]],
  },
  {
    ...PAGE.video,
    group: "Set up",
    blurb: "Webcams, replays, recording and the A² Golf video",
    sections: [SECTION["Cameras and replays"], SECTION["Video recording"], SECTION["Disk space"], SECTION["The A² Golf video"]],
  },
  { ...PAGE.sound, group: "Set up" },
  { ...PAGE.stats, group: "More" },
  {
    id: "help",
    group: "More",
    title: "Help",
    icon: "help",
    blurb: "Getting started, keys, tips, what's new and the licence",
    sections: [{ title: "Getting started", items: items("welcome") }, SECTION["Key tips"], SECTION["Keys"], { ...SECTION["Version history"], title: "What's new" }, SECTION["About"]],
  },
  { ...PAGE.system, group: "More" },
];

// The pages for a style.
export const pagesFor = (style) => (cleanUiStyle(style) === "legacy" ? PAGES : NEW_PAGES);

// Every item, with where it is: [{ page, section, item }].
export function allItems(pages = PAGES) {
  const out = [];
  for (const page of pages) for (const section of page.sections) for (const item of section.items) out.push({ page, section, item });
  return out;
}

export const itemById = (id, pages = PAGES) => allItems(pages).find((x) => x.item.id === id) ?? null;
export const pageOf = (id, pages = PAGES) => itemById(id, pages)?.page.id ?? null;

// Words a search matches loosely: case and punctuation don't matter.
const plain = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9%+ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// The items a search finds, best first: every word must be in the item's
// label, help, keys, section or page; a word in the label counts most.
// has(id): whether it's shown (bound) - the rest are left out.
export function search(text, { has = () => true, pages = PAGES } = {}) {
  const words = plain(text).split(" ").filter(Boolean);
  if (!words.length) return [];
  const hits = [];
  for (const x of allItems(pages)) {
    if (!has(x.item.id)) continue;
    const label = plain(x.item.label);
    const rest = plain([x.item.help, x.item.keys, x.section.title, x.section.help, x.page.title, x.page.blurb, ...(x.item.options ?? []).map((o) => o.label)].join(" "));
    let score = 0;
    let all = true;
    for (const w of words) {
      if (label.includes(w)) score += label.startsWith(w) ? 4 : 3;
      else if (rest.includes(w)) score += 1;
      else all = false;
    }
    if (all) hits.push({ ...x, score });
  }
  return hits.sort((a, b) => b.score - a.score);
}
