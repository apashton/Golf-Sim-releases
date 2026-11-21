// From GPS latitude/longitude (WGS 84) to the grids LiDAR files come in, so a
// point on a hole can be found in a downloaded elevation file:
//   27700        British National Grid (England, Scotland, Wales): OSGB36
//                by the standard 7-parameter Helmert shift (good to about
//                2 m, the same as PROJ uses without the OSTN15 grid), then
//                the OS Transverse Mercator
//   32601-32660  WGS 84 / UTM north, 32701-32760 south (USGS and others)
//   26901-26923  NAD83 / UTM north (USGS 3DEP)
//   6330-6348    NAD83(2011) / UTM zones 1-19 north (newer USGS files)
//   25828-25838  ETRS89 / UTM (Europe)
//   2157         Irish Transverse Mercator
//   4326, 4269, 4258   latitude/longitude itself
// Pure: shared by the server and the tests (checked against PROJ).

const DEG = Math.PI / 180;
const ELLIPSOIDS = {
  wgs84: { a: 6378137, f: 1 / 298.257223563 },
  grs80: { a: 6378137, f: 1 / 298.257222101 },
  airy: { a: 6377563.396, f: 1 - 6356256.909 / 6377563.396 },
};

// Transverse Mercator (the Ordnance Survey's series, good to a millimetre
// within a few degrees of the central meridian).
function transverseMercator({ ellipsoid, lat0, lon0, k0, e0, n0 }) {
  const { a, f } = ELLIPSOIDS[ellipsoid];
  const b = a * (1 - f);
  const e2 = 1 - (b * b) / (a * a);
  const n = (a - b) / (a + b);
  const phi0 = lat0 * DEG;
  return (lat, lon) => {
    const phi = lat * DEG;
    const dl = (lon - lon0) * DEG;
    const s = Math.sin(phi);
    const c = Math.cos(phi);
    const t = Math.tan(phi);
    const nu = (a * k0) / Math.sqrt(1 - e2 * s * s);
    const rho = (a * k0 * (1 - e2)) / (1 - e2 * s * s) ** 1.5;
    const eta2 = nu / rho - 1;
    const dp = phi - phi0;
    const sp = phi + phi0;
    const M =
      b *
      k0 *
      ((1 + n + (5 / 4) * n ** 2 + (5 / 4) * n ** 3) * dp -
        (3 * n + 3 * n ** 2 + (21 / 8) * n ** 3) * Math.sin(dp) * Math.cos(sp) +
        ((15 / 8) * n ** 2 + (15 / 8) * n ** 3) * Math.sin(2 * dp) * Math.cos(2 * sp) -
        (35 / 24) * n ** 3 * Math.sin(3 * dp) * Math.cos(3 * sp));
    const I = M + n0;
    const II = (nu / 2) * s * c;
    const III = (nu / 24) * s * c ** 3 * (5 - t * t + 9 * eta2);
    const IIIA = (nu / 720) * s * c ** 5 * (61 - 58 * t * t + t ** 4);
    const IV = nu * c;
    const V = (nu / 6) * c ** 3 * (nu / rho - t * t);
    const VI = (nu / 120) * c ** 5 * (5 - 18 * t * t + t ** 4 + 14 * eta2 - 58 * t * t * eta2);
    return [e0 + IV * dl + V * dl ** 3 + VI * dl ** 5, I + II * dl ** 2 + III * dl ** 4 + IIIA * dl ** 6];
  };
}

// WGS 84 latitude/longitude to OSGB36 (Airy), through Earth-centred
// coordinates and the Helmert shift (EPSG:1314, position vector).
function wgs84ToOsgb36(lat, lon) {
  const w = ELLIPSOIDS.wgs84;
  const e2w = w.f * (2 - w.f);
  const phi = lat * DEG;
  const lam = lon * DEG;
  const nu = w.a / Math.sqrt(1 - e2w * Math.sin(phi) ** 2);
  const x = nu * Math.cos(phi) * Math.cos(lam);
  const y = nu * Math.cos(phi) * Math.sin(lam);
  const z = nu * (1 - e2w) * Math.sin(phi);
  const tx = -446.448;
  const ty = 125.157;
  const tz = -542.06;
  const s = 20.4894e-6;
  const rx = (-0.1502 / 3600) * DEG;
  const ry = (-0.247 / 3600) * DEG;
  const rz = (-0.8421 / 3600) * DEG;
  const X = tx + (1 + s) * x - rz * y + ry * z;
  const Y = ty + rz * x + (1 + s) * y - rx * z;
  const Z = tz - ry * x + rx * y + (1 + s) * z;
  const air = ELLIPSOIDS.airy;
  const e2 = air.f * (2 - air.f);
  const p = Math.hypot(X, Y);
  let p2 = Math.atan2(Z, p * (1 - e2));
  for (let i = 0; i < 8; i++) {
    const n2 = air.a / Math.sqrt(1 - e2 * Math.sin(p2) ** 2);
    p2 = Math.atan2(Z + e2 * n2 * Math.sin(p2), p);
  }
  return [p2 / DEG, Math.atan2(Y, X) / DEG];
}

const BNG = transverseMercator({ ellipsoid: "airy", lat0: 49, lon0: -2, k0: 0.9996012717, e0: 400000, n0: -100000 });
const utm = (zone, south, ellipsoid = "wgs84") =>
  transverseMercator({ ellipsoid, lat0: 0, lon0: zone * 6 - 183, k0: 0.9996, e0: 500000, n0: south ? 10000000 : 0 });

// A function (lat, lon) -> [x, y] in the grid of EPSG code `epsg`, or null
// if it's one A-Squared Golf doesn't know.
export function projector(epsg) {
  const code = Number(epsg);
  if (code === 27700) return (lat, lon) => BNG(...wgs84ToOsgb36(lat, lon));
  if (code >= 32601 && code <= 32660) return utm(code - 32600, false);
  if (code >= 32701 && code <= 32760) return utm(code - 32700, true);
  if (code >= 26901 && code <= 26923) return utm(code - 26900, false, "grs80");
  if (code >= 6330 && code <= 6348) return utm(code - 6329, false, "grs80");
  if (code >= 25828 && code <= 25838) return utm(code - 25800, false, "grs80");
  if (code === 2157) return transverseMercator({ ellipsoid: "grs80", lat0: 53.5, lon0: -8, k0: 0.99982, e0: 600000, n0: 750000 });
  if ([4326, 4269, 4258].includes(code)) return (lat, lon) => [lon, lat];
  return null;
}

export const knownGrid = (epsg) => projector(epsg) != null;

// The EPSG code from a .prj file (WKT) beside an ASCII grid, if it's one of
// the above.
export function epsgFromWkt(wkt) {
  const t = String(wkt ?? "");
  const code = /AUTHORITY\["EPSG",\s*"?(\d+)"?\]\s*\]\s*$/i.exec(t.trim()) || /ID\["EPSG",\s*(\d+)\]\s*\]\s*$/i.exec(t.trim());
  if (code && knownGrid(code[1])) return Number(code[1]);
  if (/British[_ ]National[_ ]Grid|OSGB[_ ]?1936|OSGB36/i.test(t)) return 27700;
  if (/Irish[_ ]Transverse[_ ]Mercator|IRENET95/i.test(t)) return 2157;
  const z = /UTM[_ ]zone[_ ](\d{1,2})([NS])/i.exec(t);
  if (z) {
    const zone = Number(z[1]);
    const south = z[2].toUpperCase() === "S";
    if (/NAD[_ ]?83|North[_ ]American[_ ]1983/i.test(t) && !south) return 26900 + zone;
    if (/ETRS[_ ]?89/i.test(t) && !south) return 25800 + zone;
    return (south ? 32700 : 32600) + zone;
  }
  if (/^\s*GEOGCS/i.test(t) || /^\s*GEOGCRS/i.test(t)) return 4326;
  return null;
}

// No coordinate system in the file at all: numbers that fit Great Britain's
// grid are taken to be it (the old EA ASCII tiles came without a .prj).
export function guessGrid(x, y) {
  return x >= 0 && x <= 700000 && y >= 0 && y <= 1300000 ? 27700 : null;
}
