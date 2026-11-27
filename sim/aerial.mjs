// Aerial photographs under the course plan (courseplan.js), to pick out a
// course's tees, greens and fairways by eye (the owner, 23 November 2026:
// "Yes I would" - and, for where there's no open source, "Open photos +
// player's own key").
//
// Where a country's mapping agency publishes its aerial photographs openly,
// as tiles anyone may fetch with no key, the game fetches them for a course
// there by itself - as it does the LiDAR (server/lidarfetch.mjs):
//
//   USA          USGS The National Map, orthoimagery (USDA NAIP): public
//                domain - to zoom 16, about 2 m a pixel
//   France       IGN Géoplateforme, ORTHOIMAGERY.ORTHOPHOTOS: Licence
//                Ouverte (Etalab 2.0)
//   Netherlands  PDOK, Luchtfoto RGB (Beeldmateriaal Nederland): CC BY 4.0
//   Spain        IGN, PNOA máxima actualidad: CC BY 4.0
//   Switzerland  swisstopo, SWISSIMAGE: free with the source named
//   Austria      basemap.at, orthophoto: CC BY 4.0
//
// The European ones to zoom 19 (a fifth of a metre a pixel). Each answered
// with a photo, no key, on 23 November 2026; outside its own country each
// gives a blank tile, so a source is only used where a tile at the course
// is a photo (server/aerial.mjs). The credit is shown on the map whenever
// its photos are.
//
// Elsewhere - the UK and Ireland among them - there's no open source. A
// player can add a photo service of their own: its tile address (with {z},
// {x} and {y}, and {key} where their key goes) and their key, kept on their
// PC only (server/aerial.mjs), never in a course or sent anywhere but that
// service. The service's own terms are theirs to keep to.
//
// All are Web Mercator tiles (256 pixels, z/x/y). Pure.

// Approximate boxes for each source (south, west, north, east); several
// overlap at borders, which the tile at the course settles.
export const AERIAL_SOURCES = [
  {
    id: "swisstopo",
    name: "swisstopo SWISSIMAGE (Switzerland)",
    boxes: [[45.8, 5.9, 47.85, 10.55]],
    maxZoom: 19,
    credit: "© swisstopo",
    url: (z, x, y) => `https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/${z}/${x}/${y}.jpeg`,
  },
  {
    id: "pdok",
    name: "PDOK Luchtfoto (Netherlands)",
    boxes: [[50.7, 3.3, 53.6, 7.25]],
    maxZoom: 19,
    credit: "Luchtfoto: Beeldmateriaal Nederland, PDOK (CC BY 4.0)",
    url: (z, x, y) => `https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_orthoHR/EPSG:3857/${z}/${x}/${y}.jpeg`,
  },
  {
    id: "basemapat",
    name: "basemap.at orthophoto (Austria)",
    boxes: [[46.35, 9.5, 49.05, 17.2]],
    maxZoom: 19,
    credit: "Datenquelle: basemap.at (CC BY 4.0)",
    url: (z, x, y) => `https://mapsneu.wien.gv.at/basemap/bmaporthofoto30cm/normal/google3857/${z}/${y}/${x}.jpeg`,
  },
  {
    id: "ignfr",
    name: "IGN orthophotos (France)",
    boxes: [
      [41.3, -5.3, 51.15, 9.7],
    ],
    maxZoom: 19,
    credit: "© IGN, Géoplateforme (Licence Ouverte)",
    url: (z, x, y) => `https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX=${z}&TILEROW=${y}&TILECOL=${x}&FORMAT=image/jpeg`,
  },
  {
    id: "pnoa",
    name: "IGN PNOA (Spain)",
    boxes: [
      [35.9, -9.5, 43.9, 4.4],
      [27.5, -18.3, 29.5, -13.3],
    ],
    maxZoom: 19,
    credit: "PNOA cedido por © Instituto Geográfico Nacional (CC BY 4.0)",
    url: (z, x, y) => `https://www.ign.es/wmts/pnoa-ma?request=GetTile&service=WMTS&VERSION=1.0.0&Layer=OI.OrthoimageCoverage&Style=default&Format=image/jpeg&TileMatrixSet=GoogleMapsCompatible&TileMatrix=${z}&TileRow=${y}&TileCol=${x}`,
  },
  {
    id: "usgs",
    name: "USGS The National Map (USA)",
    boxes: [
      [24, -125, 50, -66],
      [51, -170, 72, -129],
      [18, -161, 23, -154],
    ],
    maxZoom: 16,
    credit: "USDA, USGS The National Map: Orthoimagery",
    url: (z, x, y) => `https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/${z}/${y}/${x}`,
  },
];

// The open sources whose box takes in a place, in order to try.
export function aerialSourcesFor(lat, lon) {
  return AERIAL_SOURCES.filter((s) => s.boxes.some(([s0, w0, n0, e0]) => lat >= s0 && lat <= n0 && lon >= w0 && lon <= e0));
}
export const sourceById = (id) => AERIAL_SOURCES.find((s) => s.id === id) ?? null;

// A tile smaller than this (bytes) is a blank one - a service's answer
// outside its own country (PDOK's over London: 1.6 kB; its photos 15 - 30).
export const BLANK_TILE = 3000;

// ---- Tiles --------------------------------------------------------------------------

const DEG = Math.PI / 180;
// Metres a pixel of a zoom-0 tile spans at the equator.
export const EQUATOR_MPP = 156543.03392804097;

// The tile a place is in at a zoom: { z, x, y }.
export function tileOf(lat, lon, z) {
  const n = 2 ** z;
  const x = Math.floor(((lon + 180) / 360) * n);
  const y = Math.floor(((1 - Math.asinh(Math.tan(lat * DEG)) / Math.PI) / 2) * n);
  return { z, x: Math.min(n - 1, Math.max(0, x)), y: Math.min(n - 1, Math.max(0, y)) };
}

// A tile's edges in latitude and longitude.
export function tileEdges(z, x, y) {
  const n = 2 ** z;
  const lonOf = (tx) => (tx / n) * 360 - 180;
  const latOf = (ty) => Math.atan(Math.sinh(Math.PI * (1 - (2 * ty) / n))) / DEG;
  return { west: lonOf(x), east: lonOf(x + 1), north: latOf(y), south: latOf(y + 1) };
}

// The zoom whose pixels are nearest `mpp` metres across at a latitude (no
// finer than `max`, nor coarser than `min`).
export function zoomFor(mpp, lat, { min = 12, max = 19 } = {}) {
  const z = Math.round(Math.log2((EQUATOR_MPP * Math.cos(lat * DEG)) / Math.max(1e-3, mpp)));
  return Math.min(max, Math.max(min, z));
}

// The tiles covering a box of latitude and longitude at a zoom (at most
// `most` of them: none if it would be more).
export function tilesOver({ south, west, north, east }, z, most = 400) {
  const a = tileOf(north, west, z);
  const b = tileOf(south, east, z);
  const count = (b.x - a.x + 1) * (b.y - a.y + 1);
  if (count > most || count <= 0) return [];
  const out = [];
  for (let y = a.y; y <= b.y; y++) for (let x = a.x; x <= b.x; x++) out.push({ z, x, y });
  return out;
}

// ---- A player's own photo service -------------------------------------------------------

// Its tile address, checked: https, with {z}, {x} and {y} in it (and {key}
// if a key is to go in). Returns the address, or throws saying what's wrong.
export function checkTemplate(t) {
  const s = String(t ?? "").trim();
  if (!s) throw new Error("Give the service's tile address.");
  let u;
  try {
    u = new URL(s.replace(/\{(z|x|y|key)\}/g, "0"));
  } catch {
    throw new Error("That isn't a web address.");
  }
  if (u.protocol !== "https:") throw new Error("The tile address should start https://.");
  for (const k of ["{z}", "{x}", "{y}"]) if (!s.includes(k)) throw new Error(`The tile address needs ${k} in it, where the tile's ${k[1]} goes.`);
  if (s.length > 600) throw new Error("That tile address is too long.");
  return s;
}

// The address of one tile from the player's own service.
export function ownTileUrl({ template, key = "" }, z, x, y) {
  return template
    .replaceAll("{z}", String(z))
    .replaceAll("{x}", String(x))
    .replaceAll("{y}", String(y))
    .replaceAll("{key}", encodeURIComponent(key ?? ""));
}

// The service's host, to say whose photos they are.
export function ownHost(template) {
  try {
    return new URL(template.replace(/\{(z|x|y|key)\}/g, "0")).host;
  } catch {
    return "";
  }
}
