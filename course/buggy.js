// Between holes: the cart ride to the next tee (sim/buggy.mjs says what it
// is), in place of the scorecard card over the picture. The cart waits by
// the green, and the camera comes round behind to follow it as it drives
// on to the next tee (sim/buggy.mjs rideStart) - along the cart paths, to
// park beside the box the round plays from (sim/cartway.mjs) - a bar along
// the bottom with Scorecard and Next hole (N). Scorecard - or a tap on the
// picture - takes the camera into the cart, looking up at the screen under
// its roof and closing in until the screen, the round's scorecard on it,
// fills the
// middle of the picture and the course round it is blurred; its Watch the
// drive goes back out. The next hole, built ahead while this one was
// played (course.js prebuildNext), is finished meanwhile - quicker behind
// the blur (loadingPause), and given a resting frame's time while the cart's
// watched (buildingBetween). Next hole goes whenever it's pressed: a hole
// not finished yet is finished behind the loading card, as N does.
// Part of CourseMode (course.js), split out of it: these methods are added
// to CourseMode.prototype there and run with `this` the course.

import * as THREE from "three";
import { RIDE, measureWay, wayAt, driven, driveSpeed, wheelSteer, rideShot, screenAmount, rideBlur, rideFov, cardShown, rideCentre, cardFit, cardNarrow, cardFills, cardTop, rideWords, driveTime, rideOnAt, rideStart, rideSpeed, trimWay } from "../sim/buggy.mjs";
import { cartField, cartFieldSteps, cartRide, cartRideSteps, cartWayFrom, cartGuide, rideBox, playedGround } from "../sim/cartway.mjs";
import { blobRadius, makePath } from "../sim/course.mjs";
import { rideTee } from "../sim/nexttee.mjs";
import { DRIVE, DRIVE_HINT, AUTO_HINT, GUIDE, driveStart, driveKey, driveStep, driveFacing, driveArrived, driveGround, driveWords, guideTurn, guideWords } from "../sim/freedrive.mjs";
import { hayAt } from "../sim/hay.mjs";
import { lieWithOthers, treeClearance } from "../sim/treeclear.mjs";
import { holeExtras, lineDistance } from "../sim/country.mjs";
import { courseLines, courseDeepWoods } from "../sim/neighbours.mjs";
import { deepWoods } from "../sim/deepwoods.mjs";
import { crownReach } from "../sim/teelane.mjs";
import { insidePolygon } from "../sim/terrain.mjs";
import { signThings, furnitureThings, dressingThings, movedThings } from "../sim/cartthings.mjs";
import { signsFor } from "../sim/signs.mjs";
import { windsockSpot } from "../sim/windsock.mjs";
import { holeFurniture } from "../sim/furniture.mjs";
import { makeBuggy, screenCorners, cartReflections, turnWheels } from "../look/buggy.js";
import { CartSound } from "../audio/cart.js";
import { esc } from "../util.js";
import { keyed } from "../sim/roundkeys.mjs";

const UP = new THREE.Vector3(0, 1, 0);
// Within this of the next tee's middle (metres), this hole's long grass
// that's nearer the next hole's line, in its open ground, is the next
// hole's rough round its tee (cartGroundIn): not long grass ringing the tee
// off from the cart.
const NEXT_TEE_ROUGH = 25;

export class CourseBuggy {
  // Whether a hole's end takes the cart (the scorecard after each hole on,
  // the cart ride with it): a round's hole with another after it, not one
  // the designer's trying out, nor while the game's video plays (it moves
  // on by itself: showreel.js).
  rideWanted() {
    const r = this.round;
    if (!r || r.finished || r.onlyHole != null || !this.view || !this.isActive) return false;
    if (this.settings.holeCard === false || this.settings.cartRide === false) return false;
    if (this.pace !== 1 || this.heldView) return false;
    return r.index + 1 < (this.course?.holes?.length ?? 0);
  }

  // The ride begun (true), or not - nowhere to drive (false): the card
  // as it was, then.
  startRide() {
    const r = this.round;
    const L = r?.hole?.layout;
    if (!L || this.ride) return false;
    const found = this.rideWayFor(L);
    if (!found) return false;
    // (A way too long to drive in good time begun partway along it, still
    // ending by the tee - and a long one driven quicker: sim/buggy.mjs.)
    const measured = measureWay(trimWay(found.way));
    const speed = rideSpeed(measured.length);
    this.buggy ??= makeBuggy();
    this.scene.add(this.buggy);
    cartReflections(this.buggy, this.scene);
    const cam = this.camera;
    this.ride = {
      t: 0,
      way: measured,
      speed,
      start: { at: cam.position.clone(), look: this.look.clone() },
      held: null,
      // Following the cart to begin with, the scorecard a tap away.
      watch: rideStart(),
      fov: cam.fov,
      ready: false,
      // The cart waits by the green until it's told to go (the owner, 13
      // November 2026: "Have an auto drive button ... Click auto drive, or
      // drive themselves and then click next hole" - it had set off by
      // itself): goAt, the ride's second its Auto drive began (null while
      // it waits, or while it's driven); every cell's way on to the tee,
      // for a cart handed back partway and for showing the way
      // (sim/cartway.mjs cartWayFrom, cartGuide); rolled, how far its
      // wheels had turned before this way.
      goAt: null,
      flow: found.flow ?? null,
      rolled: 0,
      // Parked by the next tee (where it always goes: sim/cartway.mjs).
      arrived: false,
      // The cart's tilt, eased.
      tilt: { pitch: 0, roll: 0, y: null },
      next: r.index + 1,
      // On to the next hole by itself, this long in (sim/buggy.mjs
      // rideOnAt): 40 s with nothing chosen - or, on Auto drive, with the
      // cart parked by then, else 5 s after it parks (autoDrive). Never
      // while it's driven.
      onAt: RIDE.onAfter,
      count: null,
    };
    this.placeCart(0, true);
    // Its motor and tyres heard as it drives (audio/cart.js).
    (this.cartSound ??= new CartSound()).start();
    this.showRideCard();
    // (Built ahead now if it hadn't started.)
    this.prebuildNext(0);
    this.onChange?.();
    return true;
  }

  // The cart's ride from this green to the next tee, in the world's xz
  // (sim/cartway.mjs cartRide): { way, tier, atTee, paved } - from a spot
  // by the green, along the cart paths where they go its way and round the
  // trees, sand, water, greens, tees, long grass and steep ground in the
  // way off them, to beside the box the round plays from; or null, no way
  // there. Worked out ahead while the hole's played (prepareRide), or now.
  rideWayFor(L) {
    const ahead = this.rideField?.L === L ? this.rideField : null;
    if (ahead?.done) return ahead.ride;
    const job = ahead ? this.idleWork?.take("cart-field") : null;
    if (job) {
      let r = job.it.next();
      while (!r.done) r = job.it.next();
      Object.assign(ahead, r.value, { done: true });
      return ahead.ride;
    }
    const spec = this.rideSpec(L);
    return spec ? cartRide(this.rideFieldFor(spec), spec) : null;
  }

  // Where the ride's worked out for a hole, in the world's xz: { green,
  // reach, tee, ahead, paths, keepOff, box, cell } - its green's middle and
  // size; the middle of the next tee box the round plays from, and the way
  // the next hole goes from it (rideTeeOf); the cart paths' lines, this
  // hole's (its own and those on to the next) and the next hole's as
  // they're drawn on this one (holescenery.js nextTeePaths); the next
  // tee's boxes, and a hole from a map's buildings, never driven over; and
  // the ground the cart's field covers (sim/cartway.mjs rideBox: the
  // green, the tee and the paths between) - or null, no next tee.
  rideSpec(L) {
    const at = this.rideTeeOf(L);
    if (!at || !L?.green) return null;
    const g = L.green;
    const reach = g.poly?.length > 2 ? Math.max(...g.poly.map(([x, z]) => Math.hypot(x - g.x, z - g.z))) : blobRadius(g, 0);
    // Hole frame -> the world's xz: (x, z) -> (z, -x).
    const w = ([x, z]) => [z, -x];
    const green = w([g.x, g.z]);
    const tee = w(at.tee);
    // (The paths as they're drawn - joined, their bends as laid -
    // holescenery.js grassPaths: it drives on the path that's there.)
    const drawn = this.grassPaths?.(L) ?? [];
    const lines = drawn.length ? drawn.map((p) => p.line) : [...(L.paths ?? []), ...(this.nextTeePaths?.() ?? [])].filter((p) => p?.p?.length >= 2).map((p) => p.p);
    const paths = lines.map((line) => line.map(w));
    // (And a hole from a map's buildings: holescenery.js addClub.)
    const keepOff = [...at.boxes, ...(L.source === "map" ? (L.buildings ?? []).filter((p) => p?.length >= 3) : [])].map((poly) => poly.map(w));
    return { green, reach, tee, ahead: at.ahead ? w(at.ahead) : null, paths, keepOff, ...rideBox({ green, reach, tee, paths }) };
  }

  // The next tee as the cart goes to it, in this hole's frame (sim/
  // nexttee.mjs rideTee): { tee, ahead, boxes } - the middle of the box the
  // round plays from (its colour), the next hole's line from there, and
  // its tee boxes - or, where only the next tee's spot is known, its
  // yellow box's; null with no next hole. (Worked out once a hole.)
  rideTeeOf(L) {
    const i = this.round?.index ?? 0;
    const colour = this.round?.tees ?? this.settings.tees;
    const key = `${i}|${colour}`;
    if (this.rideTeeKept?.L === L && this.rideTeeKept.key === key) return this.rideTeeKept.at;
    let at = this.course?.holes?.[i + 1] ? rideTee(this.course, i, colour) : null;
    if (!at) {
      const tee = this.nextTeeOf(L, i);
      if (tee) at = { tee, ahead: null, boxes: [] };
    }
    this.rideTeeKept = { L, key, at };
    return at;
  }

  // The hole's ground read for the cart ahead, a few rows at a time in the
  // picture's quiet moments while it's played (sim/cartway.mjs
  // cartFieldSteps) - so working out the ride as the hole ends costs next
  // to nothing (reading it then held the page a few tenths of a second on
  // a slow machine). Begun with each hole of a round that has a ride
  // after it.
  prepareRide() {
    const q = this.idleWork;
    const r = this.round;
    const L = r?.hole?.layout;
    this.rideField = null;
    q?.cancel("cart-field");
    if (!q || !L || r.onlyHole != null || r.index + 1 >= (this.course?.holes?.length ?? 0)) return;
    if (this.settings.holeCard === false || this.settings.cartRide === false) return;
    const spec = this.rideSpec(L);
    if (!spec) return;
    const ahead = { L, field: null, ride: null, done: false };
    this.rideField = ahead;
    q.add({
      id: "cart-field",
      after: q.now() + 4000,
      priority: 1,
      steps: () => this.rideSteps(spec),
      done: (out) => {
        if (this.rideField === ahead) Object.assign(ahead, out, { done: true });
      },
      failed: (err) => console.warn("The cart's ground wasn't read ahead:", err),
    });
  }

  // Its steps: the field read (rideFieldSteps), then the cart's way over it
  // worked out - the green and the next tee known as the hole begins, so
  // the whole ride's ready as it ends: { field, ride }.
  *rideSteps(spec) {
    const field = yield* this.rideFieldSteps(spec);
    yield "the cart's way";
    const ride = yield* cartRideSteps(field, spec);
    return { field, ride };
  }

  // The field's steps: what stands on the ground (rideThingsIn), the trees
  // and the ground's reading gathered (the woods past the hole the dearest
  // part), then the field read a few rows at a time, the paths burnt into
  // it.
  *rideFieldSteps(spec) {
    const things = this.rideThingsIn(spec.box);
    yield "what the cart keeps clear of";
    const ground = this.cartGroundIn(spec.box);
    yield "the cart's trees";
    return yield* cartFieldSteps({ ...ground, things, box: spec.box, cell: spec.cell, paths: spec.paths, keepOff: spec.keepOff });
  }

  // The cart's field for a ride, all read now (nothing read ahead).
  rideFieldFor(spec) {
    return cartField({ ...this.cartGroundIn(spec.box), things: this.rideThingsIn(spec.box), box: spec.box, cell: spec.cell, paths: spec.paths, keepOff: spec.keepOff });
  }

  // The ground in a box (the world's xz) as a cart sees it (sim/cartway.mjs
  // cartField): { lie, height, trees } - this hole's lies, the
  // other holes' greens, tees and fairways (sim/treeclear.mjs
  // lieWithOthers) and their sand, water and woods (their crops:
  // sim/neighbours.mjs); the trees - this hole's and the woods round it
  // (view.js's crowns, with the club's buildings), its woods out past its
  // back rows (as the country grows them: sim/countryparts.mjs), the other
  // holes', and every other tree drawn (drawnTrees); and the ground's
  // height.
  cartGroundIn(box) {
    // (The trees from a little further out: their crowns reach in.)
    const out = 15;
    const reach = { x0: box.x0 - out, x1: box.x1 + out, z0: box.z0 - out, z1: box.z1 + out };
    const inBox = (x, z) => x > reach.x0 && x < reach.x1 && z > reach.z0 && z < reach.z1;
    const trees = (this.cameraTrees ?? []).filter((t) => inBox(t.x, t.z)).map((t) => [t.x, t.z, t.r]);
    trees.push(...this.drawnTrees(reach, new Set(this.cameraTrees ?? [])));
    for (const t of this.cartWoods()) {
      const [wx, wz] = [t[1], -t[0]];
      if (inBox(wx, wz)) trees.push([wx, wz, crownReach(t)]);
    }
    // The other holes', in this hole's frame: their shapes and trees.
    const shapes = [];
    for (const n of this.neighbours ?? []) {
      for (const t of n.trees ?? []) {
        const [wx, wz] = [t[1], -t[0]];
        if (inBox(wx, wz)) trees.push([wx, wz, crownReach(t)]);
      }
      for (const [lie, polys] of [["water", n.water], ["bunker", n.bunkers], ["trees", n.woods]]) {
        for (const poly of polys ?? []) {
          if (!poly?.length) continue;
          let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
          for (const [x, z] of poly) {
            x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
          }
          shapes.push({ lie, poly, x0, x1, z0, z1 });
        }
      }
    }
    const index = this.round?.index ?? 0;
    const own = (x, z) => this.hole.lieAt(x, z);
    const lieAt = this.course?.holes?.length > 1 ? lieWithOthers(this.course, index, own) : own;
    // The hole just played: its fairway, and its first cut in front of its
    // green, crossed only where there's no other way - round the back of
    // the green (sim/cartway.mjs playedGround).
    const played = playedGround(this.hole?.layout, own);
    // Past this hole's play, this hole reads woods - but it may be another
    // hole's own rough (the next tee's, say): theirs where it's nearer
    // their line than this one, within their open ground. Not its long
    // grass, though: that's drawn there, from this hole's lies (sim/
    // holetufts.mjs), and the cart kept out of it as it looks (the owner,
    // 26 October 2026: "Golf Cart drives through and even parks in very
    // long grass still"); the hay in it the dearest of all.
    const L = this.hole?.layout;
    const mine = L?.path ?? [];
    const hayPath = mine.length > 1 ? makePath(mine) : null;
    // (Those whose open ground reaches the box: its x is the world's -z.)
    const near = (n) => {
      const xs = n.path.map((p) => p[0]);
      const zs = n.path.map((p) => p[1]);
      return Math.min(...xs) - n.open < -box.z0 && Math.max(...xs) + n.open > -box.z1 && Math.min(...zs) - n.open < box.x1 && Math.max(...zs) + n.open > box.x0;
    };
    const others = this.challenge || !this.course?.holes?.length ? [] : courseLines(this.course, index).filter((n) => n.path.length > 1 && near(n));
    // (Nearer another hole's line than this one's, within its open ground.)
    const theirs = (x, z) => {
      const d = lineDistance(mine, x, z);
      return others.some((n) => {
        const e = lineDistance(n.path, x, z);
        return e < d && e <= n.open;
      });
    };
    const nextTee = this.rideTeeOf?.(L)?.tee ?? null;
    const lie = (wx, wz) => {
      const x = -wz;
      const z = wx;
      for (const s of shapes) if (x >= s.x0 && x <= s.x1 && z >= s.z0 && z <= s.z1 && insidePolygon(s.poly, x, z)) return s.lie;
      const l = played(x, z, lieAt(x, z));
      if (l === "inplay") return l;
      if (l === "deep") {
        if (hayPath && hayAt(L, x, z, hayPath)) return "hay";
        // Right by the next tee: its own rough round it (NEXT_TEE_ROUGH).
        return nextTee && others.length && Math.hypot(x - nextTee[0], z - nextTee[1]) < NEXT_TEE_ROUGH && theirs(x, z) ? "rough" : l;
      }
      if (l !== "trees" || !others.length) return l;
      return theirs(x, z) ? "rough" : l;
    };
    return { lie, height: (wx, wz) => this.rideGround(wx, wz), trees };
  }

  // What stands on the ground in and round a box (the world's xz) that the
  // cart keeps clear of (sim/cartthings.mjs), [x, z, reach, kind]: the
  // signs, the windsock and the furniture by the tee and the bunkers, as
  // holescenery.js puts them up (addSignage, addClub) - worked out again
  // from the same pure pieces: where they stand changes only with the
  // round's tee colour (the markers) and where the next tee is (the
  // arrow); the next tee's as it's drawn on arrival (addNextTee, from
  // nextTeeSight's view); and the rough's gorse, rocks, boulders, stumps
  // and logs (the hole's dressing).
  rideThingsIn(box) {
    const L = this.hole?.layout;
    if (this.challenge || !L?.path?.length) return [];
    const i = this.round?.index ?? 0;
    const tee = this.round?.tees ?? this.settings.tees;
    const w = ([x, z]) => [z, -x];
    const signs = signsFor(L, { tee, nextTee: this.nextTeeOf(L, i) });
    const sock = windsockSpot(L, signs.tee);
    const out = movedThings([...signThings(signs, sock), ...furnitureThings(holeFurniture(L, { sign: signs.tee, sock })), ...dressingThings(this.dressing)], w);
    const view = this.nextTeeSight?.()?.view;
    if (view) {
      // (Its sign, markers and other tees as nextTeeView puts them up, in
      // the round's colour.)
      const next = signsFor(view.layout, { tee });
      out.push(...movedThings([...signThings({ tee: next.tee, markers: next.markers, otherTees: next.otherTees }, view.sock), ...furnitureThings(view.furniture)], (p) => w(view.to(p))));
    }
    // (Those reaching into it - from 15 m round it, as the trees.)
    const m = 15;
    return out.filter(([x, z, r]) => x + r > box.x0 - m && x - r < box.x1 + m && z + r > box.z0 - m && z - r < box.z1 + m);
  }

  // Every tree drawn in the world within a box (the world's xz), as
  // [x, z, crown]: each 3D tree's crown (look/trees.js userData.crowns -
  // the hole's own, its backdrop and the other holes' near it, on every
  // setting: holescenery.js cropSurfaceSteps) and each far woods card's
  // reach across from its trunk (look/farwoods.js fwBox) - the woods the
  // country stands round the hole, the deep woods and the other holes'
  // trees drawn as cards. So the cart keeps clear of whatever trees there
  // are to see (the owner, 26 October 2026: "We still have instances where
  // we're driving through trees with the ... buggy"). Crowns in `known`
  // are left out (already counted).
  drawnTrees(box, known = new Set()) {
    const out = [];
    const inBox = (x, z) => x > box.x0 && x < box.x1 && z > box.z0 && z < box.z1;
    const m = new THREE.Matrix4();
    this.world?.traverse((o) => {
      for (const t of o.userData?.crowns ?? []) if (!known.has(t) && inBox(t.x, t.z)) out.push([t.x, t.z, t.r]);
      if (!o.userData?.farWoods || !o.isInstancedMesh) return;
      const fw = o.geometry.getAttribute("fwBox");
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, m).premultiply(o.matrixWorld);
        const [x, z] = [m.elements[12], m.elements[14]];
        if (inBox(x, z)) out.push([x, z, fw ? Math.max(1, -fw.getX(i), fw.getY(i)) : 3]);
      }
    });
    return out;
  }

  // This hole's woods out past its back rows, in its own frame - the same
  // trees the country stands there (holescenery.js countryArgs), worked out
  // once a hole.
  cartWoods() {
    const L = this.hole?.layout;
    if (!L) return [];
    if (this.cartWoodsOf?.L === L) return this.cartWoodsOf.trees;
    let trees = [];
    if (holeExtras({ challenge: this.challenge, mapped: this.hole.mapped }).backdrop) {
      const course = this.challenge || !this.course?.holes?.length ? null : this.course;
      const ok = course ? treeClearance(course, this.round?.index ?? 0) : () => true;
      const others = (this.neighbours ?? []).map((n) => ({ path: n.path, open: n.open }));
      const character = this.characterOf(L) ?? "parkland";
      // (On a course: the woods the country stands there - grown against
      // every hole, once: sim/neighbours.mjs courseDeepWoods.)
      trees = (course ? courseDeepWoods(course, this.round?.index ?? 0, { character, keepOff: this.backdrop ?? [] }) : deepWoods(L, { character, others, keepOff: this.backdrop ?? [], stands: null })).filter((t) => ok(t[0], t[1], crownReach(t)));
    }
    this.cartWoodsOf = { L, trees };
    return trees;
  }

  // The ground the cart's on: the hole's own, or the land drawn beyond it.
  rideGround(wx, wz) {
    const own = this.worldHeight(wx, wz);
    const far = this.farGround?.(wx, wz);
    return Number.isFinite(far) ? Math.max(own, far) : own;
  }

  // An arrow key while the ride's watched (app/keys.js): the wheel taken
  // (sim/freedrive.mjs) at the first, and the cart driven from then on -
  // ↑ ↓ its speed, ← → its wheel - wherever the ground's drawn round the
  // hole, until Next hole. True if the key was the cart's (not the aim's
  // or the club's). Not at the scorecard, nor online while the others
  // are waited for.
  driveKey(key) {
    const ride = this.ride;
    if (!ride || !ride.watch?.on || this.round?.waiting) return false;
    if (!ride.free) {
      // (Taken with ↑ alone, so a stray ← or → doesn't stop the ride.)
      if (key !== "up") return true;
      this.takeWheel();
    }
    ride.free = driveKey(ride.free, key, ride.t);
    return true;
  }

  // Whose the arrows are between holes (app.js hintContext, for the touch
  // strip - sim/touchcontrols.mjs drivesNow): "watch" while the ride's
  // watched and could be driven, "drive" once it is, else null.
  driveState() {
    const ride = this.ride;
    if (!ride || !ride.watch?.on || this.round?.waiting) return null;
    return ride.free ? "drive" : "watch";
  }

  // Auto drive: the cart drives itself to the next tee - from where it
  // waits by the green, or, handed back after being driven, from wherever
  // it's got to (a way on from there over the ride's ground: sim/cartway.mjs
  // cartWayFrom; none from there - out past the ground the ride knows,
  // with sand or water between - and it says so, and stays the driver's).
  // True if it's off.
  autoDrive() {
    const ride = this.ride;
    if (!ride || this.round?.waiting) return false;
    if (ride.free) {
      const at = [ride.free.x, ride.free.z];
      const way = cartWayFrom(ride.flow, at, { blocked: (x, z) => !!ride.ground?.blocked?.(x, z) });
      if (!way) {
        this.onToast?.("No way to the tee from here - drive nearer a path, or Next hole", 3200);
        return false;
      }
      ride.way = measureWay(way);
      ride.speed = rideSpeed(ride.way.length);
      ride.rolled = ride.rolledAt + ride.free.rolled;
      // (Turning onto its way from how it stood, not snapped round.)
      ride.turn = { from: Math.atan2(-driveFacing(ride.free)[0], -driveFacing(ride.free)[1]), at: ride.t };
      ride.free = null;
      ride.ground = null;
    } else if (ride.goAt != null) return false;
    ride.goAt = ride.t;
    ride.arrived = false;
    ride.onAt = rideOnAt(ride.t + driveTime(ride.way.length, { speed: ride.speed }));
    ride.count = null;
    this.updateRideCard();
    return true;
  }

  // How long the cart's been driving itself (seconds; before it's told
  // to, none - it waits).
  rideGone() {
    const ride = this.ride;
    return ride.goAt == null ? -1 : ride.t - ride.goAt;
  }

  // The wheel taken: the cart where the ride had got to, at its speed;
  // what stops it gathered once (the ground the ride knows, over the
  // whole of this hole's crop); the ride no longer going on by itself.
  takeWheel() {
    const ride = this.ride;
    const t = this.rideGone();
    const s = driven(t, ride.way.length, { speed: ride.speed });
    const { at, facing } = wayAt(ride.way, s);
    ride.free = driveStart({ at, facing, speed: driveSpeed(t, ride.way.length, { speed: ride.speed }) });
    ride.rolledAt = ride.rolled + s;
    ride.goAt = null;
    ride.turn = null;
    // The drawn ground's edge (the crop's circle, the hole's frame) in the
    // world's xz - or, with no crop (a hole on its own), 400 m of the cart.
    const c = this.crop?.circle;
    const circle = c ? { x: c.z, z: -c.x, r: c.r - DRIVE.arrive } : { x: at[0], z: at[1], r: 400 };
    const box = { x0: circle.x - circle.r, x1: circle.x + circle.r, z0: circle.z - circle.r, z1: circle.z + circle.r };
    const ground = this.cartGroundIn(box);
    ride.ground = driveGround({ lie: ground.lie, trees: ground.trees, things: this.rideThingsIn(box), circle });
    ride.onAt = Infinity;
    ride.count = null;
    this.updateRideCard();
  }

  // The cart `t` seconds into the ride, on the ground and tilted with it.
  placeCart(dt, snap = false) {
    const ride = this.ride;
    let s;
    let at;
    let facing;
    // (How far along its way, where it's on one.)
    let wayS = 0;
    if (ride.free) {
      // Driven: a step of it, and by the next tee once it's within reach
      // of where the ride would have parked.
      const was = ride.free.speed;
      ride.free = driveStep(ride.free, dt, ride.t, ride.ground);
      ride.freeAccel = dt > 0 ? (ride.free.speed - was) / dt : 0;
      at = [ride.free.x, ride.free.z];
      facing = driveFacing(ride.free);
      s = ride.rolledAt + ride.free.rolled;
      const there = driveArrived(ride.free, wayAt(ride.way, ride.way.length).at);
      if (there !== ride.arrived) {
        ride.arrived = there;
        this.updateRideCard();
      }
    } else {
      const on = driven(this.rideGone(), ride.way.length, { speed: ride.speed });
      if (on >= ride.way.length - 0.01 && !ride.arrived) {
        ride.arrived = true;
        this.updateRideCard();
      }
      ({ at, facing } = wayAt(ride.way, on));
      wayS = on;
      s = ride.rolled + on;
    }
    const [fx, fz] = facing;
    const g = (u, v) => this.rideGround(at[0] + fx * u - fz * v, at[1] + fz * u + fx * v);
    const front = g(0.85, 0);
    const back = g(-0.85, 0);
    const right = g(0, 0.56);
    const left = g(0, -0.56);
    const y = Math.max((front + back) / 2, (left + right) / 2, this.rideGround(at[0], at[1]));
    const k = snap ? 1 : 1 - Math.exp(-dt * 6);
    const tilt = ride.tilt;
    tilt.pitch += (Math.atan2(front - back, 1.7) - tilt.pitch) * k;
    tilt.roll += (Math.atan2(right - left, 1.12) - tilt.roll) * k;
    tilt.y = tilt.y == null || snap ? y : tilt.y + (y - tilt.y) * Math.min(1, k * 2);
    const b = this.buggy;
    b.position.set(at[0], tilt.y, at[1]);
    // (Handed back to Auto drive: turned onto its way over a second, the
    // short way round.)
    let yaw = Math.atan2(-fx, -fz);
    if (ride.turn && !ride.free) {
      const k2 = Math.min(1, (ride.t - ride.turn.at) / GUIDE.turn);
      if (k2 >= 1) ride.turn = null;
      else yaw = ride.turn.from + Math.atan2(Math.sin(yaw - ride.turn.from), Math.cos(yaw - ride.turn.from)) * k2 * k2 * (3 - 2 * k2);
    }
    b.rotation.set(tilt.pitch, yaw, tilt.roll, "YXZ");
    // Its wheels rolling the way it's gone, the front two steered into the
    // bends (sim/buggy.mjs wheelSteer) - eased, or a way's corners would
    // snap them round.
    const steer = ride.free ? ride.free.steer : wheelSteer(ride.way, wayS);
    ride.steer = snap || ride.steer == null ? steer : ride.steer + (steer - ride.steer) * (1 - Math.exp(-dt * 5));
    turnWheels(b, s, ride.steer);
    b.updateMatrixWorld(true);
    // And heard: how fast, speeding up or slowing, on the path or the
    // grass, from where it is.
    const t = this.rideGone();
    const go = { speed: ride.speed };
    const speed = ride.free ? Math.abs(ride.free.speed) : driveSpeed(t, ride.way.length, go);
    const accel = ride.free ? (ride.freeAccel ?? 0) * Math.sign(ride.free.speed || 1) : (driveSpeed(t + 0.05, ride.way.length, go) - driveSpeed(t - 0.05, ride.way.length, go)) / 0.1;
    const surface = this.hole?.lieAt?.(-at[1], at[0]) === "path" ? "path" : "grass";
    this.cartSound?.update({ speed, accel, surface, at: b.position });
  }

  // A shot of the camera's (RIDE.shots) in the world: where it is and what
  // it looks at. In the cart (the seat, the screen) it moves with the
  // cart, tilts and all, so the screen holds still in the picture; round it
  // (getting in, following) it turns with the cart but keeps level.
  rideShotPose(name) {
    const ride = this.ride;
    if (name === "start") return ride.start;
    if (name === "held") return ride.held ?? ride.start;
    const shot = RIDE.shots[name];
    const b = this.buggy;
    const inside = name === "seat" || name === "screen";
    const m = inside ? b.matrixWorld : new THREE.Matrix4().makeRotationY(b.rotation.y).setPosition(b.position);
    const at = new THREE.Vector3(...shot.at).applyMatrix4(m);
    const look = new THREE.Vector3(...shot.look).applyMatrix4(m);
    if (!inside) at.y = Math.max(at.y, this.rideGround(at.x, at.z) + 1.2);
    return { at, look };
  }

  // Each frame of the ride (update): the cart on along its way, the camera
  // with it, the screen's card where the screen is in the picture, and the
  // blur round it.
  stepRide(dt) {
    const ride = this.ride;
    if (!ride) return;
    ride.t += dt;
    this.placeCart(dt);
    const { from, to, k, look } = rideShot(ride.t, ride.watch);
    const a = this.rideShotPose(from);
    const b = this.rideShotPose(to);
    const cam = this.camera;
    cam.position.lerpVectors(a.at, b.at, k);
    this.look.lerpVectors(a.look, b.look, look);
    this.camWant.copy(cam.position);
    this.lookWant.copy(this.look);
    // At the screen, the camera's up is the cart's, so the screen stays
    // square in the picture however the cart tilts.
    const amount = screenAmount(ride.t, ride.watch);
    const cartUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.buggy.quaternion);
    cam.up.copy(UP).lerp(cartUp, amount).normalize();
    cam.lookAt(this.look);
    const fov = rideFov(ride.fov, amount);
    const slid = this.rideSlide(amount);
    if (Math.abs(cam.fov - fov) > 1e-3 || slid) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
    cam.updateMatrixWorld();
    this.rideOverlay(amount);
    this.updateRideGuide();
    // Ready once the next hole's built (or there's no building it ahead).
    // Next hole doesn't wait for it: not built yet, it's finished behind
    // the loading card (the owner, 1 November 2026: a ride whose Next hole
    // waited, loading, until another Next hole was pressed).
    const ready = this.rideReady();
    if (ready !== ride.ready) {
      ride.ready = ready;
      this.updateRideCard();
    }
    // On to the next hole by itself once the time's come (not online while
    // the others are still on the hole), the last seconds counted down on
    // the screen - built or not: what's left is finished behind the
    // loading card, never waited on for good.
    const left = ride.onAt - ride.t;
    const count = left <= RIDE.countdown ? Math.max(1, Math.ceil(left)) : null;
    if (count !== ride.count) {
      ride.count = count;
      this.updateRideCard();
    }
    if (left <= 0 && !ride.going && !this.round?.waiting) {
      ride.going = true;
      // (After this frame, as the card's own timer does: holeCardDone.)
      setTimeout(() => this.ride === ride && this.rideNext(), 0);
    }
  }

  // The picture's centre, moved for play (app.js resize: the camera's
  // view window, for a golfer down one side of the net), slid back to the
  // middle as the camera closes in on the screen (sim/buggy.mjs
  // rideCentre). Whether it's moved.
  rideSlide(amount) {
    const ride = this.ride;
    const v = this.camera.view;
    if (!v?.enabled) return false;
    // (Its share of the picture's width as app.js set it - read again when
    // it's set again, as on a resize.)
    if (v.offsetX !== ride.slid) ride.share = -v.offsetX / v.fullWidth;
    const x = -rideCentre(ride.share, amount) * v.fullWidth;
    ride.slid = x;
    if (x === v.offsetX) return false;
    v.offsetX = x;
    return true;
  }

  // Between holes with the next one still being built (the ride up, the
  // hole not ready): app.js gives the build a resting frame's time
  // (sim/idlework.mjs idleBudget between), the cart moving or not.
  buildingBetween() {
    return !!this.ride && !this.ride.ready;
  }

  // Whether the next hole is built and waiting.
  rideReady() {
    const ride = this.ride;
    if (!ride) return false;
    if (!this.idleWork) return true;
    const p = this.prebuilt;
    return !!p && p.index === ride.next && p.course === this.course && p.key === this.prebuildKey(ride.next);
  }

  // Whether the picture is behind the screen's blur, for the next hole to
  // be finished in (course.js loadingPause): the camera at the screen.
  rideCovers() {
    const ride = this.ride;
    return !!ride && !ride.watch?.on && screenAmount(ride.t, ride.watch) > 0.6;
  }

  // Watch the drive (on): out of the cart, following it to the tee; or
  // (off) back up at the screen.
  rideWatch(on) {
    const ride = this.ride;
    if (!ride || !!ride.watch?.on === on) return;
    ride.held = { at: this.camera.position.clone(), look: this.look.clone() };
    ride.watch = { on, at: ride.t, from: screenAmount(ride.t, ride.watch) };
    // (Up at the scorecard, a cart being driven stops: nobody's steering.)
    if (!on && ride.free) ride.free = { ...ride.free, gear: 1 };
    this.updateRideCard();
  }

  // Next hole from the ride: the cart's gone, and on.
  rideNext() {
    if (!this.ride) return;
    if (this.round?.done && !this.round.finished) this.nextHole();
    else this.endRide();
  }

  // The ride over: the cart, its card and the blur gone, the camera's
  // own width, up and picture centre again (the next hole places it).
  endRide() {
    const ride = this.ride;
    if (!ride) return;
    this.ride = null;
    this.cartSound?.stop();
    if (this.buggy) this.scene.remove(this.buggy);
    this.rideEl?.remove();
    this.rideBlurEl?.remove();
    this.rideBarEl?.remove();
    if (this.rideTap) this.view?.removeEventListener("click", this.rideTap);
    this.rideTap = null;
    this.rideEl = this.rideBlurEl = this.rideBarEl = null;
    this.renderBetween();
    const cam = this.camera;
    cam.up.copy(UP);
    const v = cam.view;
    const centre = v?.enabled && ride.share != null && v.offsetX === ride.slid ? -ride.share * v.fullWidth : null;
    if (cam.fov !== ride.fov || (centre != null && centre !== v.offsetX)) {
      cam.fov = ride.fov;
      if (centre != null) v.offsetX = centre;
      cam.updateProjectionMatrix();
    }
    this.onChange?.();
  }

  // ---- The screen's card, the blur and the bar ---------------------------------------

  // What the game window has over its picture between holes, for the
  // recording to draw over its copy of it (compositor.js drawCards, from
  // app.js): the scorecard card, or the cart's screen with the blur behind
  // it and, following the cart, its bar (the owner, 26 October 2026: "The
  // scorecard whilst showing on the game screen doesn't show on the record
  // screen").
  pictureCards() {
    const cards = [this.holeCard?.el, this.rideEl, this.rideBarEl].filter((el) => el?.isConnected && !el.hidden);
    return cards.length ? { cards, blur: this.ride ? (this.rideBlurPx ?? 0) : 0 } : null;
  }

  // The scorecard as the cart's screen shows it (over the picture, where
  // the screen is in it), the blur behind, and - watching the drive - a
  // bar along the bottom with Next hole.
  showRideCard() {
    const r = this.round;
    const s = this.course.holes[r.index].spec;
    const blur = document.createElement("div");
    blur.className = "ride-blur";
    const el = document.createElement("div");
    el.className = "ride-screen";
    el.innerHTML = `<div class="rs-inner">
        <div class="hc-eyebrow">Hole ${esc(s.number)} done</div>
        <div class="hc-body"><div class="hc-card">${this.scorecardHtml()}</div>${this.seasonBoardHtml()}</div>
        <div class="rs-foot"><span class="rs-words"></span>
          <span class="rs-buttons"><button data-act="watch">Watch the drive</button><button class="primary" data-act="next">${keyed("Next hole", "N", this.keysShown())}</button></span></div>
      </div>`;
    const bar = document.createElement("div");
    bar.className = "ride-bar";
    bar.hidden = true;
    // (Drive it: the wheel taken with a tap or a click, as ↑ takes it - the
    // only way where there are no keys. Gone once it's driven.)
    // (Auto drive: the cart drives itself there - from where it waits, or
    // handed back from wherever it's been driven to. The arrow: which way
    // the tee is while it's driven, and how far - updateRideGuide.)
    bar.innerHTML = `<span class="rs-words"></span><span class="rs-guide" hidden><span class="rs-arrow" aria-hidden="true">↑</span><span class="rs-left"></span></span><span class="rs-buttons"><button data-act="drive" title="${esc(DRIVE_HINT)}">${keyed("Drive it", "↑", this.keysShown())}</button><button data-act="auto" title="${esc(AUTO_HINT)}">Auto drive</button><button data-act="screen">Scorecard</button><button class="primary" data-act="next">${keyed("Next hole", "N", this.keysShown())}</button></span>`;
    const click = (e) => {
      const b = e.target.closest("button[data-act]");
      if (!b || b.disabled) return;
      if (b.dataset.act === "next") this.rideNext();
      else if (b.dataset.act === "drive") this.driveKey("up");
      else if (b.dataset.act === "auto") this.autoDrive();
      else this.rideWatch(b.dataset.act === "watch");
    };
    el.addEventListener("click", click);
    bar.addEventListener("click", click);
    // A tap on the picture itself while following the cart: the scorecard.
    // (Not while it's driven: a finger on the picture would stop the cart.)
    this.rideTap = (e) => {
      if (e.target?.tagName === "CANVAS" && this.ride?.watch?.on && !this.ride.free) this.rideWatch(false);
    };
    this.view.addEventListener("click", this.rideTap);
    this.view.append(blur, el, bar);
    this.rideEl = el;
    this.rideBlurEl = blur;
    this.rideBarEl = bar;
    // (Its own size, for fitting it to the screen.)
    const inner = el.firstElementChild;
    this.ride.cardSize = { w: inner.offsetWidth || 900, h: inner.offsetHeight || 420 };
    this.updateRideCard();
  }

  updateRideCard() {
    const ride = this.ride;
    if (!ride || !this.rideEl) return;
    const spec = this.course.holes[ride.next]?.spec ?? {};
    // (Online, ready and waiting for the others to be: who for - course/netflights.js.)
    const holding = this.holdingWords();
    const hole = { number: spec.number ?? ride.next + 1, par: spec.par ?? 4, yards: this.yardsOf(ride.next) };
    const words = holding ?? (ride.free ? driveWords({ ...hole, arrived: ride.arrived, keys: this.keysShown() }) : rideWords({ ...hole, ready: ride.ready, arrived: ride.arrived, left: ride.count }));
    // (That it can be driven: its button, until it is.)
    const drive = this.rideBarEl.querySelector("button[data-act=drive]");
    if (drive) drive.hidden = !!ride.free || !!holding;
    // (And that it can drive itself: until it does, or it's there.)
    const auto = this.rideBarEl.querySelector("button[data-act=auto]");
    if (auto) auto.hidden = !!holding || (!ride.free && ride.goAt != null) || (!!ride.free && ride.arrived);
    this.rideBarEl.classList.toggle("four", !!drive && !!auto && !drive.hidden && !auto.hidden);
    this.updateRideGuide(true);
    for (const w of [...this.rideEl.querySelectorAll(".rs-words"), ...this.rideBarEl.querySelectorAll(".rs-words")]) w.textContent = words;
    for (const b of [...this.rideEl.querySelectorAll("button[data-act=next]"), ...this.rideBarEl.querySelectorAll("button[data-act=next]")]) {
      // (Pressed before the hole's built: it's finished behind the loading
      // card. Held only online, waiting for the others.)
      b.disabled = !!holding;
      b.textContent = holding ? "Ready" : keyed("Next hole", "N", this.keysShown());
    }
    this.rideBarEl.hidden = !ride.watch?.on;
    // (And the panel's, for the command centre: course/panel.js.)
    this.renderBetween();
  }

  // Which way the next tee is, while the cart's driven: the bar's arrow
  // turned to it as the picture sees it (sim/freedrive.mjs guideTurn - the
  // way a cart would go from here, round the sand and along the paths:
  // sim/cartway.mjs cartGuide) and how far - read every GUIDE.every
  // seconds (now: at once). Gone when it isn't driven, or it's there.
  updateRideGuide(now = false) {
    const ride = this.ride;
    const el = this.rideBarEl?.querySelector(".rs-guide");
    if (!ride || !el) return;
    const shown = !!ride.free && !ride.arrived && !!ride.watch?.on && !this.holdingWords();
    if (el.hidden === shown) el.hidden = !shown;
    if (!shown) return;
    if (!now && ride.t - (ride.guidedAt ?? -Infinity) < GUIDE.every) return;
    ride.guidedAt = ride.t;
    const at = [ride.free.x, ride.free.z];
    const park = wayAt(ride.way, ride.way.length).at;
    const far = Math.hypot(park[0] - at[0], park[1] - at[1]);
    // (Close by: straight at where it parks.)
    const guide = far < GUIDE.near ? null : cartGuide(ride.flow, at);
    const to = guide?.to ?? park;
    const f = this.camera.getWorldDirection(new THREE.Vector3());
    const deg = guideTurn([f.x, f.z], at, to);
    if (deg !== ride.guideDeg) {
      ride.guideDeg = deg;
      el.querySelector(".rs-arrow").style.transform = `rotate(${deg}deg)`;
    }
    const words = guideWords({ left: guide?.left ?? far, on: guide?.on ?? true });
    if (words !== ride.guideWords) {
      ride.guideWords = words;
      el.querySelector(".rs-left").textContent = words;
    }
  }

  // Where the screen is in the picture: the card fitted over it, as clear
  // as the camera's got there, and the blur round it.
  rideOverlay(amount) {
    const el = this.rideEl;
    if (!el) return;
    const w = this.view.clientWidth;
    const h = this.view.clientHeight;
    // (A narrow picture: the card laid out narrower, and as big as the
    // picture has room for - sim/buggy.mjs cardNarrow. Its size again.)
    const narrow = cardNarrow(w);
    if (narrow !== !!this.ride.narrow) {
      this.ride.narrow = narrow;
      el.classList.toggle("narrow", narrow);
      const inner = el.firstElementChild;
      this.ride.cardSize = { w: inner.offsetWidth || 900, h: inner.offsetHeight || 420 };
    }
    // (Or a short one, a phone sideways: as big as there's room for, over
    // the swing pad and the strip at its sides.)
    const fills = cardFills(w, h);
    el.classList.toggle("fills", fills);
    const shown = cardShown(amount);
    el.style.opacity = shown.toFixed(3);
    el.style.pointerEvents = shown > 0.5 ? "auto" : "none";
    el.style.visibility = shown > 0.01 ? "visible" : "hidden";
    if (shown > 0.01) {
      let x0 = Infinity;
      let y0 = Infinity;
      let x1 = -Infinity;
      let y1 = -Infinity;
      for (const c of screenCorners(this.buggy)) {
        c.project(this.camera);
        const px = ((c.x + 1) / 2) * w;
        const py = ((1 - c.y) / 2) * h;
        x0 = Math.min(x0, px);
        x1 = Math.max(x1, px);
        y0 = Math.min(y0, py);
        y1 = Math.max(y1, py);
      }
      const fit = cardFit({ x0, y0, x1, y1 }, this.ride.cardSize, w, h, undefined, fills, cardTop(w, h));
      el.style.left = `${fit.x.toFixed(1)}px`;
      el.style.top = `${fit.y.toFixed(1)}px`;
      el.style.transform = `translate(-50%, -50%) scale(${fit.scale.toFixed(4)})`;
    }
    const px = rideBlur(amount, h);
    this.rideBlurPx = px;
    this.rideBlurEl.style.backdropFilter = px > 0 ? `blur(${px}px)` : "none";
    this.rideBlurEl.hidden = px <= 0;
  }
}
