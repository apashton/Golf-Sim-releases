// Playing a round with the mouse or a game controller: each of this bay's
// players plays off the handicap for how they're swinging (the owner,
// 23 October 2026: "pitted a launch monitor user against a controller user
// needs to feel fair, so handicaps etc are important"). A player on the
// launch monitor plays off their real index (typed in, or their stats');
// one swinging with the mouse or a controller off that device's index at
// their level (sim/madeuphcp.mjs: their own once they have rounds at it,
// else the level's start) - never their real one.
//
// How they'll swing is guessed as the round starts (madeUpGuess: no launch
// monitor heard from, and the controller or the swing pad in use) and
// settled by their first shot of the round: a made-up swing, or a real one.
// Online, each bay says its players' handicaps as it joins (app.js
// netBay), the same way.
//
// A part of CourseMode (see course.js and docs/ARCHITECTURE.md): its
// methods are copied onto CourseMode.prototype, so `this` is the course.

import { madeUpIndex, madeUpWords, howKey } from "../sim/madeuphcp.mjs";
import { shotGuide } from "../sim/swingguide.mjs";
import { distanceToPin, riseToPin } from "../sim/courseplay.mjs";
import { holeBearing } from "../sim/weather.mjs";
import { YARD } from "../sim/flight.mjs";
import { SWING_DEVICES, madeUpSwing } from "../sim/mouseswing.mjs";
import { saveSetting } from "../util.js";
import { HCP_RANGE } from "../sim/season.mjs";

export class CourseMadeUp {
  // As the round starts, for one of this bay's players: how they're
  // expected to swing (null: on the launch monitor), and the index for it.
  // p.realIndex: their real index, typed in or their stats' (may come
  // later: madeUpStats).
  swingStart(p) {
    p.swing = this.madeUpGuess?.(p.name) ?? null;
    p.madeUps = null;
    p.swingSeen = false;
    this.swingIndex(p);
  }

  // The swing pad's two lines for the shot in hand (sim/swingguide.mjs):
  // the flag's distance, and what it plays like in the wind and air, up or
  // down the slope and from the lie - null unless it's a full shot by the
  // player whose ball is in play, now.
  swingGuide() {
    const r = this.round;
    if (!r?.hole || r.finished || r.done || r.pending || this.flying || !this.me || this.me.done || this.putting) return null;
    const p = this.me;
    const w = r.weather;
    return shotGuide({
      flagYards: distanceToPin(r.hole, p.ball) / YARD,
      riseYards: riseToPin(r.hole, p.ball) / YARD,
      lie: p.lie,
      club: p.club,
      wind: w?.wind ?? null,
      bearing: holeBearing(r.hole) + (p.aim * 180) / Math.PI,
      temperatureC: w?.temperatureC ?? 20,
    });
  }

  // Their stats came: their real index (unless one's typed in) and their
  // mouse and controller ones.
  madeUpStats(p, d) {
    if (p.realIndex == null && Number.isFinite(d?.handicap?.index)) {
      p.realIndex = d.handicap.index;
      p.realFrom = "rounds";
    }
    p.madeUps = d?.madeUp ?? null;
    this.swingIndex(p);
  }

  // The handicap a player said they play off, for how they swing, until
  // their rounds give them one (the season asks for it with too few:
  // course/season.js) - settings.startHcp[name][howKey], or null.
  askedIndex(name, swing) {
    const v = this.settings?.startHcp?.[name]?.[howKey(swing)];
    return v != null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : null;
  }
  setAskedIndex(name, swing, hcp) {
    const v = Number(hcp);
    if (!name || !Number.isFinite(v)) return;
    this.settings.startHcp = { ...(this.settings.startHcp ?? {}) };
    this.settings.startHcp[name] = { ...(this.settings.startHcp[name] ?? {}), [howKey(swing)]: Math.round(Math.max(HCP_RANGE[0], Math.min(HCP_RANGE[1], v)) * 10) / 10 };
    saveSetting("course", this.settings);
  }

  // How far a player's clubs go against the bag's, for the club suggested:
  // a swing pad or controller player's level and Power, each club's (app.js
  // madeUpReach: madeshot.mjs reachOf); 1 on the launch monitor.
  reachOf(p) {
    return p?.swing ? (this.madeUpReach?.(p.name) ?? 1) : 1;
  }

  // The index a player plays off for how they're swinging, and where it
  // came from (indexFrom: "typed", "rounds", "asked", "start" or null) -
  // the one they gave only while their rounds haven't given one.
  swingIndex(p) {
    const asked = this.askedIndex(p.name, p.swing);
    if (!p.swing) {
      p.index = p.realIndex ?? asked ?? null;
      p.indexFrom = p.realIndex != null ? (p.realFrom ?? "typed") : asked != null ? "asked" : null;
      p.swingWords = null;
      return;
    }
    const got = madeUpIndex(p.madeUps, p.swing.device, p.swing.level, this.madeUpCustom?.());
    const mine = !got.own && asked != null;
    p.index = mine ? asked : got.index;
    p.indexFrom = got.own ? "rounds" : mine ? "asked" : "start";
    p.swingWords = madeUpWords(p.swing.device, p.swing.level, mine ? { ...got, index: asked } : got, { asked: mine });
  }

  // A player's first shot of the round settles how they're swinging: said
  // when it isn't what was expected, the strokes they get changing with it.
  swungBy(p, entry) {
    if (!p || p.remote || p.swingSeen || this.round?.net) return;
    p.swingSeen = true;
    const made = madeUpSwing(entry?.deviceId) ? { device: entry.deviceId === SWING_DEVICES.controller ? "controller" : "mouse", level: this.madeUpLevel?.(p.name) ?? null } : null;
    const same = made ? p.swing?.device === made.device && p.swing?.level === made.level : !p.swing;
    if (same) return;
    p.swing = made;
    this.swingIndex(p);
    if (this.round?.handicaps === false) return;
    const now = p.index == null ? "no handicap" : `handicap ${p.index.toFixed(1)}`;
    this.onToast(made ? `${p.name} is swinging with the ${made.device === "controller" ? "controller" : "mouse"}: ${p.swingWords} - ${now}` : `${p.name} is on the launch monitor: their own ${now}`, 4500);
    this.render?.();
  }
}
