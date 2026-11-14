// A mulligan on the course (sim/mulligan.mjs): Shift + M or the menu takes
// the last stroke back - in the air or come to rest, even one
// that finished the hole - and the ball is set up where it was, to be
// played again. Only with Mulligans on (the course's Options), never
// online, not in a scramble and not in a match ladder's match.

import { retireTracers } from "../look/tracer.js";
import { mulliganRefusal, takeBack, mulliganWords } from "../sim/mulligan.mjs";

export class CourseMulligan {
  // Why one can't be taken now, or null.
  mulliganRefused() {
    const r = this.round;
    const kept = r && !r.finished && this.beforeShot?.round === r ? this.beforeShot : null;
    return mulliganRefusal({
      on: !!this.settings.mulligans,
      online: !!r?.net,
      scramble: !!r?.scr,
      ladder: !!r?.ladder || !!r?.postSeason,
      kept,
      sameHole: !!kept && kept.kept.hole === r.index && !this.switching,
    });
  }

  mulligan() {
    const why = this.mulliganRefused();
    if (why) {
      this.onToast(why, 2500);
      return false;
    }
    const r = this.round;
    const { player: p, kept, tracer } = this.beforeShot;
    this.beforeShot = null;
    // Whatever the stroke set going stops: its flight (never settled, so
    // never recorded), the pause before the next shot or player, the
    // celebration and flyover of a hole it finished.
    this.flying = null;
    clearTimeout(this.turnTimer);
    clearTimeout(this.nextTimer);
    this.setUpToken = (this.setUpToken ?? 0) + 1;
    this.settingUp = false;
    this.moveOnWhenBack = false;
    this.celebration.clear();
    this.endFlyover?.({ moveOn: false });
    this.flyoverOffer = null;
    this.showOffer?.();
    // (The hole's scorecard, and the cart ride with it, if it was up.)
    this.hideHoleCard?.();
    this.hideRelief?.({ camera: false });
    // Its tracer goes.
    if (tracer && this.tracers.list.includes(tracer)) {
      this.tracers.list.splice(this.tracers.list.indexOf(tracer), 1);
      retireTracers([tracer], 0, tracer.parent);
      this.tracers.restyle();
      if (this.tracer === tracer) this.tracer = this.tracers.last;
    }
    takeBack(p, r, kept);
    // Set up from where it was, with the club and aim it was played with.
    this.newPosition(true);
    p.club = kept.player.club;
    p.aim = kept.player.aim;
    this.onClub(p.club);
    this.updateStance();
    this.drawAim();
    this.onToast(mulliganWords(p, { multi: this.multi }), 4500);
    this.render();
    return true;
  }
}
