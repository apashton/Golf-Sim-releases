// A colour for each club, the same everywhere: the balls left lying on the
// range, the dispersion chart, the club badge in bay view. Down the bag they
// run round the rainbow - driver red, long irons yellow, short irons blue,
// wedges purple and pink - so neighbouring clubs are near in colour and the
// ends of the bag are far apart.

export const CLUB_COLORS = {
  DR: "#ff4d4d",
  "3W": "#ff8a3d",
  "5W": "#ffb35c",
  "4H": "#ffd23f",
  "4I": "#e4f04a",
  "5I": "#a8e44b",
  "6I": "#52d97c",
  "7I": "#2fe0c4",
  "8I": "#3cc4ff",
  "9I": "#4f8cff",
  PW: "#8e7cff",
  AW: "#a774ff",
  GW: "#c06bff",
  SW: "#ff6bd8",
  LW: "#ffa3d1",
  PT: "#ffffff",
};

export const clubColor = (club) => CLUB_COLORS[club] ?? "#ffffff";
