// Every colour the pictures are painted in, in one place: the 3D range,
// the course, the practice greens, and the flat maps in the designer and
// the course panel. Kept together so they can't drift apart - a pond on the
// map and the same pond in 3D, a flag on the map and on the green.
//
// The look is "late-morning parkland": on a fair day a blue sky with white
// clouds (the sky can change - cloud, rain, mist - but never the palette), a
// soft haze in the distance, grass in clear steps of brightness (green, fairway,
// rough, then the country beyond, duller and hazier), nothing pure black,
// and only the ball pure white. Colours are written as you'd pick them on
// screen; with the lighting in look/environment.js a sunlit flat surface
// shows close to the colour written here.
//
// Plain data, no three.js, so the maps and the tests can use it too.

// In named sections, one for each part of the picture, so work on one part
// adds to its own section: the sky, the ground (grass, sand, water, paths
// and worn ground), plants, the country beyond the hole, the club's built
// things, and what's drawn for play (flags, markers, the ball). PALETTE is
// all of them together, as it always was.

// Sky and distance.
export const SKY = {
  // The sky as it renders on a fair day (look/environment.js's Sky):
  // overhead, at the horizon, and at the horizon under the sun.
  skyOverhead: "#5294f4",
  skyHorizon: "#e2f6fd",
  skyHorizonSun: "#f1fcfe",
  // The haze (look/glsl/haze.js): its colour, a touch warmer and brighter
  // looking towards the sun and cooler looking away; paler on a misty
  // morning.
  fog: "#d3e0e8",
  hazeSun: "#dee3e1",
  hazeShade: "#c9d8e4",
  mist: "#dfe6ea",
  // Rain's streaks: a pale blue-grey, never white.
  rain: "#c7d2dc",
  // A cloud's sunlit top (never brighter: the clouds aren't tone mapped),
  // its soft grey-blue base on a fair day, and the slate a rain cloud's
  // base darkens towards.
  cloud: "#f6f8fb",
  cloudShade: "#c9d3e0",
  cloudSlate: "#8e98a6",
};

// The ground: grass, sand, water, cart paths and worn ground.
export const GROUND = {
  // Grass: [light, dark] where it's mown in stripes.
  rough: ["#5b9141", "#578d3e"],
  deep: "#4b7b37",
  woodsFloor: "#3f6630",
  // A links hole's ground off the fairways. Brown dunes: its rough an
  // olive khaki, its long grass past it straw, with darker clumps of
  // heather and gorse through both. Green: the rough as anywhere, its long
  // grass in darker, thicker patches.
  duneRough: "#8f8d5c",
  fescue: "#a39a66",
  fescueDry: "#b6ab79",
  longGreen: "#416a30",
  // Hay past the long grass (sim/hay.mjs): paler, gone to seed.
  hay: "#b9ab72",
  hayDry: "#cbbf8e",
  // The dunes' patches (sim/dunes.mjs): pale sandy blowouts, dark heather
  // and gorse, greener hollows, stony ground under the outcrops.
  duneSand: "#c4b585",
  duneHeather: "#6f5a55",
  duneGreen: "#6e8a46",
  duneStone: "#9b978a",
  fairway: ["#7db555", "#6fa74b"],
  // A brown links hole's: firm and dry, yellower and browner, its first cut
  // with it.
  linksFairway: ["#93a958", "#86994c"],
  linksFirstCut: ["#7f9545", "#7a8f42"],
  // The first cut (semi-rough) along a fairway's edge: a step between the
  // fairway and the rough.
  firstCut: ["#6ba249", "#679e46"],
  fringe: "#75ab4f",
  // A fringe mown in rings round its green (sim/fringe.mjs): the darker
  // of its two shades; and a lusher, longer collar's.
  fringeDark: "#6a9e46",
  // A penalty area's stakes and painted line (look/hazards.js).
  penaltyRed: "#c4342c",
  penaltyYellow: "#e3bd2b",
  fringeLush: "#679b45",
  green: ["#95c96b", "#89be61"],
  tee: ["#73ab51", "#6a9e49"],
  // The collar of longer grass round a bunker.
  collar: "#508339",
  // Straw: dry grass on a firm or hot day, in patches of the fairways and
  // rough (drawn at the grass's own brightness).
  straw: "#b9ad6a",
  // Flowers in the rough, close up: daisies cream (never white) and
  // dandelions yellow.
  daisy: "#efe9d2",
  dandelion: "#e7c238",

  // Sand.
  sand: "#dccb9d",
  sandDamp: "#b8a47c",
  sandLip: "#6b5a3c",

  // Water: darker than any grass round it, at any distance.
  waterDeep: "#0f2a2c",
  waterShallow: "#56693f",
  waterMud: "#5c5840",
  waterBank: "#5a5f38",
  // A burn's or a brook's stony bed, seen through its shallow, clear water
  // (look/sandwater.js WATER_RUN).
  runBed: "#6d6550",
  // What the sky's reflection is tinted by: a green-grey sheen, not a mirror.
  waterSheen: "#b8d0cc",
  // What deep water scatters back up when looked down into (added to its
  // colour, seen from above).
  waterBody: "#0f1f12",
  // The far bank's trees and earth, mirrored along a pond's far side:
  // dark, but never black.
  waterBankTrees: "#34472e",
  // The dark teal water's lit no darker than (WATER_LIT_FLOOR).
  waterFloor: "#3f4f4d",
  // The green scum along a wall at the waterline, and a pond's earth bank.
  algae: "#44552a",
  earthBank: "#5f5638",

  // Cart paths: weathered asphalt - a mid grey, never a black stripe on a
  // projector - concrete, gravel, and the kerbs along them, a shade off
  // the path and never white.
  path: "#6f6e6a",
  pathConcrete: "#aba495",
  pathGravel: "#b3a283",
  pathEdge: "#938e82",
  // The worn, drier grass along a path's edges.
  pathVerge: "#6f8b45",
  // Worn grass (look/wear.js): the browner verge along a path, a track
  // trodden by feet, a patch of thin grass in the rough - and the bare,
  // dusty soil that shows through the worst of each.
  vergeWorn: "#86894a",
  trodden: "#83864a",
  thinGrass: "#7e8b4c",
  bareSoil: "#7d6a4b",
  // The sand a tee's divots are filled with: a little darker than a
  // bunker's, as it's mixed with seed and soil.
  divotSand: "#b9a77c",
};

// Plants: trees' bark (their leaves' colours are look/trees.js TREE_TINTS)
// - and the windsocks, and the ponds' ducks and swans.
export const PLANTS = {
  bark: "#6b4b32",
  // A silver birch's papery white bark (its dark marks are drawn on it), a
  // willow's grey-brown, a poplar's.
  barkBirch: "#d9d5c9",
  barkWillow: "#6a5b48",
  barkPoplar: "#665748",
  // A Scots pine's orange upper bark (grey-brown lower down: look/trees.js
  // trunkGeometry), a spreading oak's grey-brown, a dead snag's weathered
  // silver-grey.
  barkScots: "#b56a40",
  barkOak: "#625443",
  barkSnag: "#8f877b",
  // A beech's smooth elephant-grey, a horse chestnut's brown-grey, a
  // cedar's dark grey-brown, a holly's pale smooth grey, a hawthorn's
  // dark, twisted brown.
  barkBeech: "#a09e95",
  barkChestnut: "#5e5346",
  barkCedar: "#57493e",
  barkHolly: "#6f6d63",
  barkHawthorn: "#584a3c",
  // The windsock by each tee (look/windsock.js), which reads the wind the
  // plants show: a matt orange-red with a cream band - never neon, never
  // white.
  windsock: "#c4532f",
  windsockBand: "#e9dfc6",
  // Ducks and swans on the ponds (look/wildlife.js): ducks brown with a
  // grey-green head, never black; swans cream, never white; their beaks;
  // the dark of the water under each.
  duck: "#7a5f43",
  duckHead: "#4f6b4b",
  swan: "#e9e1cb",
  beak: "#c98a3a",
  swanBeak: "#d0753a",
  birdShadow: "#26403c",
};

// The country beyond the hole.
export const COUNTRY = {
  hillsNear: "#5d7f5a",
  hillsFar: "#8aa3a0",
  // The hills' patches of field and wood (look/backdrop.js), and the far
  // ridge behind them: bluer, paler, hazier.
  hillsField: "#7a9465",
  hillsWood: "#4f6f52",
  ridgeFar: "#9db3b6",
  // The skyline in front of the hills: treelines and poplars in hazed
  // blue-greens (never black), the odd roof, barn or spire.
  skylineTrees: "#46664f",
  skylineTreesFar: "#5c7a69",
  skylineRoof: "#8b6e60",
  skylineWall: "#b9b1a0",
  skylineSpire: "#8d948f",
  // The fields past the trees (look/country.js): duller and paler than the
  // hole's own grass, so the hole stands out - pasture, a hay meadow,
  // straw, stubble and heath - with darker wood patches, hedgerows, farm
  // tracks and the odd pond.
  fieldPasture: "#6a8f50",
  fieldMeadow: "#8c9d5b",
  fieldStraw: "#b4a66e",
  fieldStubble: "#a39371",
  fieldHeath: "#7f7559",
  // Round a links: dunes of marram grass and sand.
  fieldDunes: "#93986a",
  woodPatch: "#46663c",
  coniferPatch: "#3b5a3d",
  hedgerow: "#41603a",
  farmTrack: "#a09379",
  farPond: "#4f6864",
  // The sea beside a course (look/sea.js): grey-blue out deep, greener in
  // the shallows, sandy at the edge, white where the surf breaks; the sky
  // in it a cool grey-blue sheen. Its shore (look/country.js): pale dry
  // sand, darker wet sand along the water, the tide's line of wrack, and
  // marram on the dunes behind.
  seaDeep: "#294d58",
  seaShallow: "#467970",
  seaSand: "#8a8a6a",
  seaFoam: "#e9ede8",
  seaSheen: "#aec0c6",
  beachSand: "#d6c69c",
  beachWet: "#9c8e6a",
  wrack: "#6a6146",
  marram: "#a5a57a",
  // Leaf litter and needles under a tree's crown, near the ground's own
  // brightness.
  leafLitter: "#77733f",
};

// The club's built things: posts, boards, walls, the range's mats.
export const CLUB = {
  timber: "#7a5a3c",
  timberGrain: "#5a412b",
  // Old, sun-bleached timber: the top of a wall of sleepers or planks.
  timberWeathered: "#8b7a62",
  brick: "#8e4f3a",
  mortar: "#b9ab94",
  // A brick wall's stone coping.
  coping: "#a7a39a",
  sodSeam: "#6e5538",
  // A wall of stacked turf (a revetted bunker face): each sod's grassy
  // edge, in two shades, over its seam of soil - on a links, more soil
  // than grass, the grass dry and olive (as in the owner's photos).
  sod: ["#6a6b38", "#56582d"],
  // Painted posts and markers: the cream they're painted.
  paint: "#ece4cc",
  metal: "#8f989b",
  signBoard: "#24452f",
  signInk: "#f2eee2",
  rangeMat: "#3d6b3c",
  rangeMatEdge: "#4f7f47",
  rubber: "#2a2a28",
  // The clubhouse and the buildings on a course from a map (look/club.js):
  // walls of cream render (never white), brick or stone; roofs of slate
  // or clay tile; windows a deep blue-grey, never black; the terrace's
  // stone flags; the club's own flag, a matt navy, so it's never taken for
  // a hole's red one.
  render: "#e2d6ba",
  stone: "#a99f8b",
  roofSlate: "#59616b",
  roofTile: "#a5603f",
  window: "#3c4b5c",
  flagstone: "#b9b09d",
  clubFlag: "#2f4a7c",
  // Box hedges round the flower beds, the beds' soil and their flowers.
  hedge: "#3d6a33",
  soil: "#6b543a",
  flowers: ["#c8506a", "#e8b84a", "#8a6cc4", "#e9e2cc", "#d9773d"],
  // Golf bags in the bag stand.
  bags: ["#2f4a7c", "#8e3b32", "#d9cfb4", "#3e6a45"],
  // The range's ball-stop netting (a grey-green, never white) and its
  // poles; the ball-picker's tyres (a dark rubber, never black) and its
  // picker discs.
  net: "#6e8172",
  netPole: "#7d8780",
  tyre: "#3a3b37",
  // The cart between holes (look/buggy.js): a cream body, a dark green
  // roof and seats, the screen under the roof a deep blue-green when it's
  // dark.
  cartBody: "#e4ddc8",
  cartTrim: "#2c4334",
  cartSeat: "#33473b",
  cartScreen: "#14231e",
  pickerGang: "#b9a24a",
};

// What's drawn for play: flags, markers, the ball, and what's drawn over
// the picture.
export const PLAY = {
  flag: "#c8302c",
  pole: "#e8e6df",
  rangeFlags: ["#c8302c", "#e0b43c", "#3a6fc4", "#ecebe4", "#c8302c"],
  // The flag for a target at a distance with no green.
  targetFlag: "#e8742a",
  teeMarkers: { white: "#ecebe4", yellow: "#e0b43c", red: "#c8302c", blue: "#3a6fc4" },
  // Things drawn over the picture.
  marking: "#ffffff",
  // The page's yellow (style.css's accent), as on the chipping spot's
  // rings. The tracer was this yellow; it's now in the players' colours
  // (sim/tracer.mjs), so a shot shows whose it was.
  accent: "#ffd23f",
  ball: "#ffffff",
  // A celebration's confetti and fireworks: strong colours, and cream
  // rather than white, so only the ball is pure white. (Their sparks start
  // cream-hot, not white-hot.)
  cream: "#f6efdc",
  confetti: ["#ffd23f", "#ff4d6d", "#3a86ff", "#2ec4b6", "#ff9f1c", "#c77dff", "#f6efdc", "#80ed99"],
  fireworks: ["#ffc21a", "#ff2e4d", "#2f7bff", "#2bff5a", "#ff3de0", "#f6efdc"],
  // Foil confetti and streamers (gold, silver, rose gold), flashing as they
  // turn to the light; and the gold of a willow firework's long trails.
  foil: ["#ffcf4a", "#dfe6ee", "#f2a65a"],
  willow: "#ffbe55",
};

export const PALETTE = { ...SKY, ...GROUND, ...PLANTS, ...COUNTRY, ...CLUB, ...PLAY };

// Wet ground (after rain) is this much darker, every grass alike, so the
// steps of brightness between them hold: the one factor the weather's
// brightness check and the ground's shader both use.
export const WET = 0.92;

// Water is never lit brighter than this share of the fairway in the same
// light (look/sandwater.js), so a pond seen from above - looking towards
// the sun, its ripples catching it - is never the brightest thing in the
// picture; only its glints, sparse points, go over.
export const WATER_LIT_CAP = 0.7;
// Nor darker than this share of it (look/sandwater.js, glsl/waternode.js),
// what's missing made up in deep water's own dark teal (waterFloor): so on
// a calm day - its sky's sheen faint, its far bank's trees dark - a pond
// seen from the fairway or the ball's flight reads as dark water, not a
// hole. (Lit at a tenth of the fairway or less, the picture's finish took
// it to pure black - Nine Oaks' 9th, Links by the Sea's 5th, Golf Sim
// Links' 10th - and at 16% still all but black: the finish keeps little
// of what's that dark, so even at this share it shows a deep teal, far
// darker than any grass.)
export const WATER_LIT_FLOOR = 0.35;

// A colour's brightness in linear light (what lighting works in).
export function linearLum(hex) {
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = rgb(hex).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// How low water's seen before its sky reflection and the sun's sheen are
// held down (look/sandwater.js, glsl/waternode.js): from `from` (the
// eye's height over its distance, near enough) they come back by `near`
// close to - within nearAt metres, where water seen low still shows the
// sky's sheen - and only by `far` past farAt, so a pond seen almost edge
// on from the tee reads as dark water, not a pale strip. (By 0.3 at any
// distance, water 10 - 30 m off seen from a player's height read very
// dark.)
export const WATER_LOW = { from: 0.015, near: 0.08, far: 0.3, nearAt: 25, farAt: 80 };

// The far bank mirrored along water's far side (look/sandwater.js,
// glsl/waternode.js): where a line from the eye, bounced off the water,
// meets the bank before it clears it - [reach, height, step]: metres
// added to how far on the bank is, how high what's mirrored stands, and
// how far apart the water's edge distance is read for which way the bank
// is, and how far across it is (0: too far to matter - a pond's far shore
// is mirrored only where it's the nearest). A pond's is its trees, some
// 11 m up; a brook's its own banks (sim/brooks.mjs brookBankHeight) and
// its width, so a burn shows the sky along its near side and the bank
// along its far side, more of it the lower it's seen, as water in a
// channel does. (A brook had a pond's: the whole of its water read as
// mirrored trees, a dark green road.)
export const WATER_BAND = { pond: [5, 11, 1, 0], brook: (height, across) => [0, height, 0.25, across] };

// The sky's sheen in water (look/sandwater.js, glsl/waternode.js): [colour,
// most, gain] - how much of the sky's own colour it keeps (the rest grey),
// the brightest it's let be, and how much more of it there is. A pond's a
// soft green-grey sheen, never a blue mirror (it mirrors its trees and
// banks as much as the sky); a brook's narrow water, seen along its
// channel, shows more of the sky ahead - with a pond's, a burn read as a
// dark green road.
export const WATER_SHEEN = { pond: [0.3, 0.1, 1], brook: [0.55, 0.22, 2.5] };

// How far a brook's banks' bare earth is drawn towards the eye, metres
// (look/sandwater.js bankSlopeMaterial along, glsl/banknode.js): the grass
// laid down its banks (course/holebuild.js downBanks) and the ground there
// are split 0.3 m apart, and across the curve of a cut bank their straight
// sides stand up to a few centimetres over it.
export const BANK_PULL = 0.08;
// How much lighter a brook's banks' earth is than a pond's (the same
// files): on a cut bank, steep and facing away from the sun, it was black.
export const BANK_LIGHT = 1.35;
// A brook's cut bank broken up along its length (the same files), so seen
// side on it doesn't read as a log lying along the water - the band of
// earth the same height and colour all the way, lit like a trunk: the turf
// slumping down over it in stretches (`slump` of the way to the water,
// where the noise at `scale` a metre is past `from`), and runnels down its
// face, darker and lighter (`runnels`, `runnelScale` a metre); and pale
// silt only on its lower part (below `silt` of the way up, fading over
// `siltFade`), not along its top where it rounds over - a pale ridge there
// was the log's light along its top.
export const BANK_BREAK = Object.freeze({ scale: 0.35, from: 0.4, to: 0.55, slump: 0.6, runnels: 0.4, runnelScale: 3.3, silt: 0.3, siltFade: 0.25 });

// The flat maps (course panel, designer, hole builder). The same colours,
// a little lighter so they read small on a dark page.
// The hole builder's tree key: a colour for each kind of tree (sim/
// treeshapes.mjs KINDS, in order), told apart on the dark map - conifers
// blue-greens, broadleaves greens and golds, the odd ones brighter.
// (And the latest: a beech's coppery orange, a horse chestnut's red, a
// cedar's slate blue, a holly's dark crimson, a hawthorn's pale pink.)
export const MAP_TREE_KINDS = ["#2f8f6b", "#5dbb4a", "#d9e27a", "#9fd36b", "#e0a43a", "#e57fb8", "#3fb6c2", "#a37a2e", "#1f6f9e", "#7fc9ff", "#b8b0a2", "#d9763a", "#c9473f", "#6f86b8", "#9e2b4f", "#f2b8c6"];

export const MAP_COLORS = {
  background: "#1f3a24",
  rough: "#4f7f3a",
  // The first cut along a designed fairway.
  firstCut: "#629a45",
  deep: "#3f6b32",
  wood: "#2f5530",
  fairway: "#7db555",
  fringe: "#75ab4f",
  green: "#95c96b",
  tee: "#73ab51",
  bunker: "#e3d3a3",
  bunkerDeep: "#c9b47a",
  // A waste area (sim/wastearea.mjs): browner sandy ground, its scrub dots.
  waste: "#bfa77c",
  wasteScrub: "#6f5a55",
  water: "#2f5f5a",
  tree: "#25482f",
  building: "#8a8478",
  path: "rgba(255,255,255,0.18)",
  // Cart paths by what they're made of (sim/paths.mjs m), a little lighter
  // than in 3D so a narrow line reads on a small map, and the dark edge
  // that sets them off the rough.
  cartPaths: ["#a19f96", "#c4bdac", "#c8b692"],
  cartPathEdge: "rgba(34,36,33,0.55)",
  flag: "#d4403a",
  timber: PALETTE.timber,
  sod: PALETTE.sodSeam,
  // Walls along a bunker's or pond's edge (sim/walls.mjs), on the maps: a
  // turf wall dark brown with a green top, timber mid brown, brick red.
  walls: { turf: "#5b4a2e", turfTop: "#6f9a45", timber: "#9a6a40", brick: "#b0573d", rock: "#8a857a", cap: "#e8e0c8" },
  // The yardage posts' colours (sim/signs.mjs).
  yardage: { red: PALETTE.teeMarkers.red, white: PALETTE.teeMarkers.white, blue: PALETTE.teeMarkers.blue },
  // A brown links hole's ground, as the 3D draws it (GROUND duneRough,
  // fescue, linksFirstCut, linksFairway; the owner, 20 October 2026: "Course
  // designer and mini map don't show brown dunes as brown dunes. Everything
  // looks green"): its rough an olive khaki, its long grass straw, its
  // fairway and first cut yellower, the dunes beyond darker; and the dunes'
  // patches (sim/dunes.mjs) as they're painted over its rough.
  links: {
    background: "#6c6747",
    rough: "#8a8757",
    deep: "#9c9361",
    firstCut: "#7a8f42",
    fairway: "#8fa654",
    patches: { sand: GROUND.duneSand, heather: GROUND.duneHeather, green: GROUND.duneGreen, stone: GROUND.duneStone },
  },
};

// The map's colours for a hole's ground: a brown links hole's (course.mjs
// trees "dunes") its own, any other hole's (a green links hole too) the
// usual.
export function mapGround(L) {
  return L?.links && L.links !== "green" ? { ...MAP_COLORS, ...MAP_COLORS.links } : MAP_COLORS;
}

// "#rrggbb" -> [r, g, b], each 0-1, as written (not linear light).
export function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

// "#rrggbb" -> 0xrrggbb, for three.js colours.
export function num(hex) {
  return parseInt(hex.slice(1), 16);
}

// A colour as a shader constant, as written (sRGB): "vec3(0.357, 0.569, 0.255)".
export function glsl(hex) {
  return `vec3(${rgb(hex).map((v) => v.toFixed(4)).join(", ")})`;
}

// The same, in linear light (what lighting works in).
export function glslLinear(hex) {
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return `vec3(${rgb(hex).map((v) => lin(v).toFixed(4)).join(", ")})`;
}
